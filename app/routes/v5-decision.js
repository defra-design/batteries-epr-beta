//
// Version 5 (19 November 2026): EB-367, the regulator makes a decision on a
// placed on the market (PoM) submission: accept it, query it, or return it.
// A copy of version 4 (app/routes/v4-decision.js), so version 4 stays as it
// was.
//
// In its own file, next to app/routes/v5.js. Every address starts with the
// submission's, for example /regulator/pom-submissions/v5/recycling-lives/2026/3
//
// The journey (Marie, 19 November):
//
//   1. Look at the submission: Flags, Members, Submission details, Changes
//      and Scheme details. No tickboxes on any of them
//   2. Pick members to query on their own page (View figures):
//      "Send query to scheme about this member", with an optional comment
//      POST .../decision/select      Make a decision (green), or Continue
//                                    (grey), back to where you came from
//      POST .../decision/save        with JavaScript, the tick and comment
//                                    are saved as you go
//   3. .../decision/queries                                    > v5/query-summary.html
//      Members you're querying: each member, why they stand out, your
//      comment, and Change (back to their page). Only if you've picked any
//   4. .../decision                                            > v5/decision.html
//      Accept, query or return, as version 4, without the list of members
//      at the top: you've just checked them
//   5. .../decision/done                                       > v5/decision-done.html
//      The confirmation
//
//   Make a decision, at the bottom of the 5 submission pages,
//   goes to step 3 if you've picked members, or straight to step 4
//      POST .../decision/start
//
//   Why (Marie, 19 November): in version 4 you could tick members on 3 pages,
//   and Flags and Members each had 2 jobs on one table: look and pick. It was
//   easy to lose track of who you'd picked, and to take someone off you had
//   to find them again. Now there's one place to pick, and one page that
//   lists everyone you've picked
//

const pom = require('../data/pom-submissions')
const details = require('../data/pom-submission-details')
const figures = require('../data/member-figures')
const { content } = require('../lib/content')

const V5 = '/regulator/pom-submissions/v5'
const SUBMISSION = V5 + '/:scheme/:year/:quarter'

function submissionUrl (scheme, year, quarter) {
  return V5 + '/' + scheme + '/' + year + '/' + quarter
}

// A form sends one value as a string, more than one as a list: always a list
function list (value) {
  if (value === undefined || value === null || value === '') return []
  return (Array.isArray(value) ? value : [value]).map(String)
}

// Only go back to a page in this prototype
function safeBack (url, fallback) {
  return /^\/(?![/\\])/.test(String(url || '')) ? url : fallback
}

// This submission's decision so far, kept in the session
// Kept in the kit's own data (req.session.data), so Clear data, in the
// footer, clears it between research sessions (Marie, 18 November)
function decisionFor (req, scheme, year, quarter) {
  const key = scheme + '/' + year + '/' + quarter
  req.session.data = req.session.data || {}
  req.session.data.v5Decisions = req.session.data.v5Decisions || {}
  req.session.data.v5Decisions[key] = req.session.data.v5Decisions[key] || { members: [], comments: {}, answers: {}, from: null }
  return req.session.data.v5Decisions[key]
}

// Everything a decision page needs about the submission, or null if there's no such submission
function load (req) {
  const { scheme, year, quarter } = req.params
  const submission = details.submission(scheme, year, quarter)
  const members = details.members(scheme, year, quarter)
  if (!submission || !members) return null
  const here = submissionUrl(scheme, year, quarter)
  return {
    scheme,
    year,
    quarter,
    submission,
    members,
    here,
    decision: decisionFor(req, scheme, year, quarter),
    urls: {
      start: here + '/decision/start',
      queries: here + '/decision/queries',
      decision: here + '/decision',
      done: here + '/decision/done',
      flags: here,
      members: here + '/member-figures'
    }
  }
}

// A new decision starts clear: nothing chosen on the decision page (Marie,
// 18 November)
function startFresh (s) {
  s.decision.answers = {}
}

// Where Make a decision goes: Members you're querying if you've picked
// any, if not straight to the decision
function next (s) {
  return s.decision.members.length ? s.urls.queries : s.urls.decision
}

// "7 December 2026"
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
function longDate (iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return d + ' ' + MONTHS[m - 1] + ' ' + y
}

// The date someone typed, checked: { iso } or { error: 'missing' | 'invalid' | 'past' }
function checkDate (day, month, year) {
  const d = String(day || '').trim()
  const m = String(month || '').trim()
  const y = String(year || '').trim()
  if (!d && !m && !y) return { error: 'missing' }
  if (!/^\d{1,2}$/.test(d) || !/^\d{1,2}$/.test(m) || !/^\d{4}$/.test(y)) return { error: 'invalid' }
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
  if (date.getUTCDate() !== Number(d) || date.getUTCMonth() !== Number(m) - 1) return { error: 'invalid' }
  const iso = date.toISOString().slice(0, 10)
  // The prototype's "today" is fixed (app/data/pom-submissions.js)
  if (iso <= pom.TODAY) return { error: 'past' }
  return { iso }
}

// Save the tick and comment from a member's page. Ticked: they're on the
// list (at the end, in the order picked). Unticked: they come off it. The
// comment is kept either way, so ticking again brings it back
function saveMember (s, body) {
  const bprn = String(body.bprn || '')
  if (!s.members.some(m => m.bprn === bprn)) return
  const ticked = list(body.members).includes(bprn)
  s.decision.members = s.decision.members.filter(b => b !== bprn)
  if (ticked) s.decision.members.push(bprn)
  s.decision.comments = s.decision.comments || {}
  if (body.comment !== undefined) s.decision.comments[bprn] = String(body.comment).trim().slice(0, 500)
}

module.exports = (router) => {
  // Make a decision, at the bottom of the 5 submission pages
  router.post(SUBMISSION + '/decision/start', (req, res, next_) => {
    const s = load(req)
    if (!s) return next_()
    // Back from the next page goes to the page you came from
    s.decision.from = safeBack(req.body.from, s.urls.flags)
    startFresh(s)
    res.redirect(next(s))
  })

  // A member's page: the tick and comment, then Make a decision (green) or
  // Continue (grey), back to where you came from. Buttons, so it all saves
  // without JavaScript
  router.post(SUBMISSION + '/decision/select', (req, res, next_) => {
    const s = load(req)
    if (!s) return next_()
    saveMember(s, req.body)
    if (req.body.next === 'decision') {
      // Back on Members you're querying goes to where you were before you
      // started checking. Coming through Change (this member's page opened
      // from Members you're querying) doesn't move it, or Back would loop
      // between the two pages (Marie, 19 November)
      if (req.body.back !== s.urls.queries) {
        s.decision.from = safeBack(req.body.from, s.urls.flags)
        startFresh(s)
      }
      return res.redirect(next(s))
    }
    res.redirect(safeBack(req.body.back, s.urls.flags))
  })

  // Save the tick and comment as you go (with JavaScript), so nothing's lost
  // if you leave the page another way. Sent by application.js (saveTicks).
  // Nothing to show: no content (204)
  router.post(SUBMISSION + '/decision/save', (req, res, next_) => {
    const s = load(req)
    if (!s) return next_()
    saveMember(s, req.body)
    res.status(204).end()
  })

  // Members you're querying: a check answers page (GOV.UK pattern), one
  // summary card for each member. Change goes back to their page, where you
  // can change the comment or untick them. With nobody picked, straight on
  // to the decision
  router.get(SUBMISSION + '/decision/queries', (req, res, next_) => {
    const s = load(req)
    if (!s) return next_()
    if (!s.decision.members.length) return res.redirect(s.urls.decision)
    const key = s.year + '-' + s.quarter
    res.render('regulator/v5/query-summary', {
      submission: s.submission,
      members: s.decision.members
        .map(bprn => s.members.find(m => m.bprn === bprn))
        .filter(Boolean)
        .map(m => ({
          name: m.name,
          bprn: m.bprn,
          flags: s.submission.flags.filter(f => f.producer === m.name),
          largest: figures.biggestChange(m, key, figures.previousQuarter(key)),
          comment: (s.decision.comments || {})[m.bprn] || '',
          changeHref: s.here + '/member-figures/' + m.bprn + '?from=queries'
        })),
      continueHref: s.urls.decision,
      // Add more members: the members list, with the search, sort and page
      // you left it on (app/routes/v5.js)
      addMoreHref: (req.session.v5MembersBack || {})[s.scheme + '/' + s.year + '/' + s.quarter] || s.urls.members,
      backHref: s.decision.from || s.urls.flags
    })
  })

  // Make a decision
  // errors: each field's error, the name of its message in the words file.
  // Made into the messages for each field (err) and the error summary
  // (errorList, in the order the fields are on the page)
  const FIELDS = [
    ['decision', '#decision'],
    ['respondBy', '#respondBy-day'],
    ['message', '#message']
  ]
  function renderDecision (req, res, s, errors) {
    const words = content('regulator/v5/decision')
    const err = {}
    const errorList = []
    FIELDS.forEach(([name, href]) => {
      if (!errors || !errors[name]) return
      err[name] = { text: words[errors[name]] }
      errorList.push({ text: words[errors[name]], href })
    })
    res.render('regulator/v5/decision', {
      submission: s.submission,
      // How many members you picked, for the hint under Query. The list
      // itself is on Members you're querying, the page before
      count: s.decision.members.length,
      answers: s.decision.answers,
      err,
      errorList,
      formAction: s.urls.decision,
      backHref: s.decision.members.length ? s.urls.queries : (s.decision.from || s.urls.flags)
    })
  }

  // Clear when you come from a submission page (startFresh, above). Your
  // answers are still there when you come back with Change
  router.get(SUBMISSION + '/decision', (req, res, next_) => {
    const s = load(req)
    if (!s) return next_()
    renderDecision(req, res, s)
  })

  router.post(SUBMISSION + '/decision', (req, res, next_) => {
    const s = load(req)
    if (!s) return next_()
    const b = req.body
    // All 3 options, whatever's ticked: open for now, firm up the logic in
    // user stories after research (David, team walkthrough, 18 November).
    // "reject" is the value; the words say Return (Alice and Caz)
    const decision = ['accept', 'query', 'reject'].includes(b.decision) ? b.decision : ''
    const answers = {
      decision,
      // One message to the scheme, whatever the decision (Marie, 18 November)
      message: String(b.message || '').trim(),
      respondByDay: String(b['respondBy-day'] || '').trim(),
      respondByMonth: String(b['respondBy-month'] || '').trim(),
      respondByYear: String(b['respondBy-year'] || '').trim(),
      // Prototype only: without a file upload service, only the file's name comes through
      file: String(b.file || '').trim(),
      // For regulators only: never sent to the scheme (UN-061)
      note: String(b.note || '').trim().slice(0, 1000)
    }
    s.decision.answers = answers

    // Each error is the name of its message in the words file
    const errors = {}
    if (!decision) errors.decision = 'errorDecision'
    if (decision === 'query') {
      const date = checkDate(answers.respondByDay, answers.respondByMonth, answers.respondByYear)
      if (date.error) errors.respondBy = { missing: 'errorRespondByMissing', invalid: 'errorRespondByInvalid', past: 'errorRespondByPast' }[date.error]
    }
    // A message to the scheme: optional to accept, required to query or
    // reject (Mak, 18 November, and alpha research: accepting shouldn't need a
    // reason). The hint under the box says so
    if (decision === 'query' && !answers.message) errors.message = 'errorMessageQuery'
    if (decision === 'reject' && !answers.message) errors.message = 'errorMessageReject'

    if (Object.keys(errors).length) return renderDecision(req, res, s, errors)

    // All good: send it. What was decided is kept for the confirmation, and
    // the ticks and answers are cleared, so the next decision starts fresh.
    // Prototype only: it isn't added to Submission details, and the status
    // doesn't change. That would need the status to move on too, which is
    // more than research needs (Marie, 18 November)
    const date = decision === 'query' ? checkDate(answers.respondByDay, answers.respondByMonth, answers.respondByYear) : null
    s.decision.done = {
      decision,
      count: s.decision.members.length,
      respondByLong: date ? longDate(date.iso) : ''
    }
    s.decision.members = []
    s.decision.comments = {}
    s.decision.answers = {}
    res.redirect(s.urls.done)
  })

  // The confirmation: one page, its words follow the decision (accepted,
  // query sent, rejected). A panel and what happens next, nothing else: no
  // playback of what was typed (Marie, 18 November). Was in Ian's alpha:
  // "What you recorded", a summary list, as well
  router.get(SUBMISSION + '/decision/done', (req, res, next_) => {
    const s = load(req)
    if (!s) return next_()
    if (!s.decision.done) return res.redirect(s.urls.decision)
    res.render('regulator/v5/decision-done', {
      submission: s.submission,
      done: s.decision.done
    })
  })
}
