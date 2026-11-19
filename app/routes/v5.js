//
// Version 5 (19 November 2026): a copy of version 4 (app/routes/v4.js), with
// a simpler way to pick the members to query (Marie, 19 November).
//
// Why: in version 4 you could tick members on 3 pages (Flags, Members and a
// member's page), and Flags and Members each asked you to do 2 things with
// one table: look at the figures and pick members. It was easy to lose track
// of who you'd picked. In version 5 you pick members in one place only: at
// the bottom of a member's page, with a comment for the scheme. Flags and
// Members are for looking. Then a summary of the members you want to query,
// then the decision. Version 4 stays exactly as it was.
//
// Its own pages (app/views/regulator/v5/) and words (app/content/regulator/v5/).
// Every address starts /regulator/pom-submissions/v5.
//
// The journey, and the page each address shows:
//
//   /regulator/pom-submissions/v5                                  > v5/pom-submissions.html
//     The submissions for the latest quarter
//   /regulator/pom-submissions/v5/all                              > v5/pom-submissions-all.html
//     Every submission, with filters. A link at the bottom of each list
//     switches between them
//
//   One submission, 5 pages with a sub navigation between them (Marie, 17 November).
//   Each has the same top (v5/_submission-header.html):
//   /v5/recycling-lives/2026/3                                     > v5/pom-submission.html
//     Flags: each links to that member's figures
//   /v5/recycling-lives/2026/3/details                             > v5/details.html
//     Submission details and supporting documents
//   /v5/recycling-lives/2026/3/member-figures                      > v5/member-figures.html
//     Members: every member, with their biggest change, and a search that suggests members
//   /v5/recycling-lives/2026/3/changes                             > v5/changes.html
//     Changes to figures since the return was first sent (from Ian's amendment history)
//   /v5/recycling-lives/2026/3/organisation-details                > v5/organisation-details.html
//     Scheme details: the scheme's organisation details for that quarter
//   /v5/recycling-lives/2026/3/download                            > a CSV file
//     The whole return as a spreadsheet: every member's figures, by chemistry
//   /v5/recycling-lives/2026/3/member-figures/BPRN142037           > v5/member.html
//     One member: their details, flags, and figures for 2 quarters by chemistry
//
//   Make a decision (EB-367): pick members to query on their own page, then
//   the members you want to query, then the decision. Those pages are in
//   app/routes/v5-decision.js
//
// Called from app/routes.js.
//

const pom = require('../data/pom-submissions')
const details = require('../data/pom-submission-details')
const figures = require('../data/member-figures')
const amendments = require('../data/amendments')
const messages = require('../data/submission-messages')

const V5 = '/regulator/pom-submissions/v5'

// One submission's address, for example /regulator/pom-submissions/v5/recycling-lives/2026/3
function submissionUrl (scheme, year, quarter) {
  return V5 + '/' + scheme + '/' + year + '/' + quarter
}

// What every page of a submission needs for its top (v5/_submission-header.html):
// the links in the sub navigation, which one you're on, the download, and
// Back, which goes to the list you came from: version 4 (the latest quarter)
// or version 4B (all submissions, with its filters). The lists remember it
function submissionTabs (req, scheme, year, quarter, current) {
  const here = submissionUrl(scheme, year, quarter)
  return {
    tabs: {
      current,
      flags: here,
      details: here + '/details',
      members: here + '/member-figures',
      changes: here + '/changes',
      scheme: here + '/organisation-details'
    },
    downloadHref: here + '/download',
    // Make a decision, at the bottom of all 5 pages: to Members
    // you want to query if you've picked any, if not to Make a decision
    // (app/routes/v5-decision.js). from: so Back comes back to this page
    continueAction: here + '/decision/start',
    continueFrom: req.originalUrl,
    backHref: (req.session && req.session.v5ListBack) || V5 + '?year=' + year + '&quarter=' + quarter
  }
}

// Only keep a value we offer: anything else falls back to the default
function pick (value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback
}

// Members, paged and sorted on the server (Marie, 18 November). 30 a page:
// long enough to scan, short enough to tab through with a keyboard
const MEMBERS_PER_PAGE = 30

// The columns you can sort Members by. Each sorts A to Z, or smallest first;
// [desc] turns it round. Biggest change sorts by its size in tonnes, up or
// down, and opens biggest first, so what looks wrong comes first
const byName = (a, b) => a.name.localeCompare(b.name)
const MEMBER_SORTS = {
  member: byName,
  bprn: (a, b) => a.bprn.localeCompare(b.bprn),
  status: (a, b) => (b.current - a.current) || byName(a, b),
  change: (a, b) => (Math.abs(a.biggest.diff) - Math.abs(b.biggest.diff)) || byName(b, a)
}

// ?sort=change[desc], the way Defra Internal Frontend writes it. Anything
// else falls back to biggest change first
function memberSort (text) {
  const match = String(text || '').match(/^([a-z]+)\[(asc|desc)\]$/)
  if (match && MEMBER_SORTS[match[1]]) return { column: match[1], direction: match[2] }
  return { column: 'change', direction: 'desc' }
}

// The GOV UK pagination component's previous, next and page links. With lots
// of pages it shows the first, the last and the ones either side of this
// one, with "…" between, as the GOV UK Design System says
function paginationFor (page, pages, baseUrl) {
  if (pages < 2) return null
  const href = n => baseUrl + '&page=' + n
  const items = []
  for (let n = 1; n <= pages; n++) {
    if (n === 1 || n === pages || Math.abs(n - page) <= 1) {
      items.push({ number: n, href: href(n), current: n === page })
    } else if (items.length && !items[items.length - 1].ellipsis) {
      items.push({ ellipsis: true })
    }
  }
  return {
    items,
    previous: page > 1 ? { href: href(page - 1) } : null,
    next: page < pages ? { href: href(page + 1) } : null
  }
}

// The members already selected for a decision on this submission (EB-367,
// app/routes/v5-decision.js keeps them), so they stay ticked when you come back
function selectedMembers (req, scheme, year, quarter) {
  const all = (req.session.data && req.session.data.v5Decisions) || {}
  const d = all[scheme + '/' + year + '/' + quarter]
  return d ? d.members : []
}

// What you've written to the scheme about this member (version 5)
function memberComment (req, scheme, year, quarter, bprn) {
  const all = (req.session.data && req.session.data.v5Decisions) || {}
  const d = all[scheme + '/' + year + '/' + quarter]
  return d && d.comments ? (d.comments[bprn] || '') : ''
}

// The "not built yet" page, coming back to this address
function notBuilt (back) {
  return '/regulator/not-built?back=' + encodeURIComponent(back)
}

module.exports = (router) => {
  // The submissions for one quarter. Lands on the latest quarter, as version 3.
  // One link per row, View submission: the organisation details are reached
  // from inside the submission (Marie, 17 November)
  router.get(V5, (req, res) => {
    const year = pick(req.query.year, pom.YEARS, pom.LATEST_YEAR)
    const quarter = pick(req.query.quarter, ['1', '2', '3', '4'], pom.LATEST_QUARTER)
    // Back on a submission comes back to this list, on this quarter
    req.session.v5ListBack = V5 + '?year=' + year + '&quarter=' + quarter
    const rows = pom.all()
      .filter(row => row.year === year && row.quarter === quarter)
      .sort(pom.byDue)
      .map(row => ({ ...row, submissionHref: submissionUrl(row.schemeSlug, row.year, row.quarter) }))
    res.render('regulator/v5/pom-submissions', {
      pom,
      rows,
      filters: { year, quarter },
      quarterText: pom.QUARTERS[quarter - 1] + ' ' + year,
      formAction: V5,
      // Prototype only, for research: switch to version 4B
      switchHref: V5 + '/all'
    })
  })

  // Version 4B: every submission, with quarter, year and status filters. A
  // copy of version 3B's list, as a back-up for research (Marie, 17 November).
  // Lands on everything, what needs action first. One link per row, to the
  // version 4 submission
  router.get(V5 + '/all', (req, res) => {
    const year = pick(req.query.year, ['all', ...pom.YEARS], 'all')
    const quarter = pick(req.query.quarter, ['all', '1', '2', '3', '4'], 'all')
    const status = pick(req.query.status, ['all', ...pom.STATUSES], 'all')
    // Back on a submission comes back to this list, with the same filters
    req.session.v5ListBack = V5 + '/all?' + new URLSearchParams({ quarter, year, status }).toString()
    const rows = pom.all()
      .filter(row => (year === 'all' || row.year === year) &&
        (quarter === 'all' || row.quarter === quarter) &&
        (status === 'all' || row.status === status))
      .sort(pom.byDueThenNewest)
      .map(row => ({ ...row, submissionHref: submissionUrl(row.schemeSlug, row.year, row.quarter) }))
    res.render('regulator/v5/pom-submissions-all', {
      pom,
      rows,
      filters: { year, quarter, status },
      formAction: V5 + '/all',
      // Prototype only, for research: switch to version 4
      switchHref: V5
    })
  })

  // One submission: Flags, the first page. Each flag links to that member's figures
  router.get(V5 + '/:scheme/:year/:quarter', (req, res, next) => {
    const { scheme, year, quarter } = req.params
    const submission = details.submission(scheme, year, quarter)
    const members = details.members(scheme, year, quarter)
    if (!submission || !members) return next()
    const here = submissionUrl(scheme, year, quarter)
    const flags = submission.flags.map(flag => {
      const member = members.find(m => m.name === flag.producer)
      // To the top of the member's page, not down to the table (Marie, 17 November)
      // ?from=submission: so Back on the member's page comes back here
      return { ...flag, figuresHref: member ? here + '/member-figures/' + member.bprn + '?from=submission' : null }
    })
    // No tickboxes in version 5: you pick members to query on their own page
    res.render('regulator/v5/pom-submission', {
      submission,
      flags,
      membersCount: members.length,
      ...submissionTabs(req, scheme, year, quarter, 'flags')
    })
  })

  // Submission details and supporting documents
  router.get(V5 + '/:scheme/:year/:quarter/details', (req, res, next) => {
    const { scheme, year, quarter } = req.params
    const submission = details.submission(scheme, year, quarter)
    if (!submission) return next()
    res.render('regulator/v5/details', {
      submission,
      downloadName: scheme + '-' + year + '-q' + quarter + '.csv',
      lastChanged: amendments.lastChanged(scheme, year, quarter),
      notBuiltHref: notBuilt(req.originalUrl),
      // Messages to the scheme and internal notes, newest first (EB-367,
      // Marie, 18 November). Dummy history only
      history: messages.forSubmission(scheme, year, quarter),
      changesHref: submissionUrl(scheme, year, quarter) + '/changes',
      ...submissionTabs(req, scheme, year, quarter, 'details')
    })
  })

  // The whole return as a spreadsheet (CSV): a row per member, with their
  // figures by chemistry for this quarter and the one before. Made from the
  // data, not the scheme's own file (no files kept: Phil, 10 November)
  router.get(V5 + '/:scheme/:year/:quarter/download', (req, res, next) => {
    const { scheme, year, quarter } = req.params
    const submission = details.submission(scheme, year, quarter)
    const members = details.members(scheme, year, quarter)
    if (!submission || !members) return next()
    const key = year + '-' + quarter
    const compareKey = figures.previousQuarter(key)
    const cell = (value) => '"' + String(value).replace(/"/g, '""') + '"'
    const chemistries = figures.comparison(members[0], key, compareKey).rows.map(r => r.chemistry)
    const head = ['Member', 'Registration number', 'Membership']
    chemistries.forEach(c => head.push(c + ' ' + figures.quarterName(key, true) + ' (tonnes)', c + ' ' + figures.quarterName(compareKey, true) + ' (tonnes)'))
    const lines = [head.map(cell).join(',')]
    members.forEach(m => {
      const row = [m.name, m.bprn, m.current ? 'Current' : 'Former']
      figures.comparison(m, key, compareKey).rows.forEach(r => row.push(r.nowText, r.beforeText))
      lines.push(row.map(cell).join(','))
    })
    res.attachment(scheme + '-' + year + '-q' + quarter + '.csv')
    res.type('text/csv').send(lines.join('\r\n'))
  })

  // The scheme's organisation details for that quarter: back to the submission
  router.get(V5 + '/:scheme/:year/:quarter/organisation-details', (req, res, next) => {
    const { scheme, year, quarter } = req.params
    const organisation = details.organisation(scheme)
    const submission = details.submission(scheme, year, quarter)
    if (!organisation || !submission) return next()
    res.render('regulator/v5/organisation-details', {
      organisation,
      submission,
      quarterText: submission.yearQuarterFull,
      notBuiltHref: notBuilt(req.originalUrl),
      ...submissionTabs(req, scheme, year, quarter, 'scheme')
    })
  })

  // Changes to figures in a return since it was first sent, newest first.
  // From Ian's amendment history design. Each member links to their figures
  router.get(V5 + '/:scheme/:year/:quarter/changes', (req, res, next) => {
    const { scheme, year, quarter } = req.params
    const submission = details.submission(scheme, year, quarter)
    if (!submission) return next()
    const here = submissionUrl(scheme, year, quarter)
    res.render('regulator/v5/changes', {
      submission,
      changes: amendments.forReturn(scheme, year, quarter).map(c => ({
        // ?from=changes: so Back on the member's page comes back here
        // #changes: straight to the member's changes, not the top of the page
        ...c, href: here + '/member-figures/' + c.bprn + '?from=changes#changes'
      })),
      ...submissionTabs(req, scheme, year, quarter, 'changes')
    })
  })

  // Member figures: every member, with the chemistry that changed most on
  // the quarter before. Search by name or registration number, and filter
  // by membership (current members first, as version 3). The search filters
  // this list: it never jumps to another page. A suggestion picked from the
  // list is "Name (BPRN)", so that matches too.
  //
  // Paged, 30 at a time, and sorted on the server, so the whole list is in
  // order, not just the page you're on (Marie, 18 November; Phil: the APIs
  // page and sort on the server). The address carries it all, as Defra
  // Internal Frontend does: ?sort=change[desc]&page=2. Search and
  // Membership go back to page 1. Was every member on one page, sorted in
  // the browser (MOJ sortable table)
  router.get(V5 + '/:scheme/:year/:quarter/member-figures', (req, res, next) => {
    const { scheme, year, quarter } = req.params
    const organisation = details.organisation(scheme)
    const submission = details.submission(scheme, year, quarter)
    const all = details.members(scheme, year, quarter)
    if (!organisation || !submission || !all) return next()
    const key = year + '-' + quarter
    const compareKey = figures.previousQuarter(key)
    const search = String(req.query.search || '').trim().slice(0, 100)
    const status = pick(req.query.status, ['current', 'former', 'all'], 'current')
    const term = search.toLowerCase()
    const found = all.filter(m =>
      (status === 'all' || (status === 'current') === m.current) &&
      (!term ||
        m.name.toLowerCase().includes(term) ||
        m.bprn.toLowerCase().includes(term) ||
        (m.name + ' (' + m.bprn + ')').toLowerCase() === term))
    const sort = memberSort(req.query.sort)
    const rows = found.map(m => ({
      ...m,
      href: submissionUrl(scheme, year, quarter) + '/member-figures/' + m.bprn,
      biggest: figures.biggestChange(m, key, compareKey),
      flags: submission.flags.filter(f => f.producer === m.name)
    })).sort(MEMBER_SORTS[sort.column])
    if (sort.direction === 'desc') rows.reverse()
    const pages = Math.max(1, Math.ceil(rows.length / MEMBERS_PER_PAGE))
    const page = Math.min(pages, Math.max(1, parseInt(req.query.page, 10) || 1))
    const shown = rows.slice((page - 1) * MEMBERS_PER_PAGE, page * MEMBERS_PER_PAGE)
    // The address without sort or page, for the column headers and the pages
    const baseQuery = new URLSearchParams({ status })
    if (search) baseQuery.set('search', search)
    const baseUrl = req.path + '?' + baseQuery.toString()
    const sortText = sort.column + '[' + sort.direction + ']'
    // A member's page goes back to exactly this page of Members, with its
    // search, sort and page (Marie, 19 November: Back went to page 1)
    req.session.v5MembersBack = req.session.v5MembersBack || {}
    req.session.v5MembersBack[scheme + '/' + year + '/' + quarter] = req.originalUrl
    res.render('regulator/v5/member-figures', {
      submission,
      org: organisation,
      quarterText: submission.yearQuarterFull,
      compareName: figures.quarterName(compareKey),
      members: shown,
      found: rows.length,
      showingFrom: shown.length ? (page - 1) * MEMBERS_PER_PAGE + 1 : 0,
      showingTo: (page - 1) * MEMBERS_PER_PAGE + shown.length,
      sort: { ...sort, baseUrl, text: sortText },
      pagination: paginationFor(page, pages, baseUrl + '&sort=' + encodeURIComponent(sortText)),
      suggestions: all.map(m => m.name + ' (' + m.bprn + ')'),
      total: all.length,
      filters: { search, status },
      formAction: req.path,
      ...submissionTabs(req, scheme, year, quarter, 'members')
    })
  })

  // One member: their details, flags, and figures for two quarters side by
  // side, by chemistry. Lands on
  // the submission's quarter, compared with the one before. The two selects
  // and Show button (a plain form) change which quarters are compared
  router.get(V5 + '/:scheme/:year/:quarter/member-figures/:bprn', (req, res, next) => {
    const { scheme, year, quarter, bprn } = req.params
    const organisation = details.organisation(scheme)
    const submission = details.submission(scheme, year, quarter)
    const all = details.members(scheme, year, quarter)
    const member = all && all.find(m => m.bprn === bprn)
    if (!organisation || !submission || !member) return next()
    const keys = figures.quarters()
    const submissionKey = year + '-' + quarter
    const show = pick(req.query.show, keys, submissionKey)
    const compare = pick(req.query.compare, keys, figures.previousQuarter(show) || keys[0])
    // Back goes where you came from (Marie, 17 November): a flag on the
    // submission, the changes page, the member figures list (the default), or
    // Members you're querying (Change, version 5)
    const from = pick(req.query.from, ['submission', 'changes', 'list', 'queries'], 'list')
    const here = submissionUrl(scheme, year, quarter)
    const listBack = (req.session.v5MembersBack || {})[scheme + '/' + year + '/' + quarter] || here + '/member-figures'
    const backHref = { submission: here, changes: here + '/changes', list: listBack, queries: here + '/decision/queries' }[from]
    // Newest quarter first in the selects
    const items = (selected) => keys.slice().reverse().map(key => ({
      value: key, text: figures.quarterName(key), selected: key === selected
    }))
    res.render('regulator/v5/member', {
      org: organisation,
      member,
      about: figures.about(member),
      // This member's flags, only on the submission's own quarter
      flags: show === submissionKey ? submission.flags.filter(f => f.producer === member.name) : [],
      // The chemistry this member's flag is about, to show it against that row
      flaggedChemistry: show === submissionKey ? figures.flaggedChemistry(member) : null,
      // Each figure changed since the return was first sent, before and
      // after, only on the submission's own quarter
      changes: show === submissionKey ? amendments.changesFor(scheme, year, quarter, bprn, figures.tonnes(member, submissionKey)) : [],
      from,
      showItems: items(show),
      compareItems: items(compare),
      showName: figures.quarterName(show),
      compareName: figures.quarterName(compare),
      showShort: figures.quarterName(show, true),
      compareShort: figures.quarterName(compare, true),
      same: show === compare,
      table: figures.comparison(member, show, compare),
      formAction: req.path,
      backHref,
      // At the bottom (version 5, Marie, 19 November): "Send query to scheme
      // about this member", with a comment, then Make a decision, or
      // Continue, back to where you came from. Saved by
      // app/routes/v5-decision.js
      selected: selectedMembers(req, scheme, year, quarter).includes(member.bprn),
      comment: memberComment(req, scheme, year, quarter, member.bprn),
      selectAction: here + '/decision/select',
      saveAction: here + '/decision/save'
    })
  })
}
