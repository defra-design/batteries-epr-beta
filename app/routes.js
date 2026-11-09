//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/create-routes/
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Add your routes here

// Every page gets its own address as currentUrl, so the regulator layout can
// send people back here from the "not built yet" page.
//
// Language: ?lang=cy in the address, as the live regulator service does.
// Prototype only: this flips the language navigation (English or Cymraeg),
// but the words stay in English. englishUrl and welshUrl are this page with
// and without ?lang=cy, keeping anything else in the address (like filters).
router.use((req, res, next) => {
  res.locals.currentUrl = req.originalUrl
  const url = new URL(req.originalUrl, 'http://prototype')
  url.searchParams.delete('lang')
  const english = url.pathname + url.search
  url.searchParams.set('lang', 'cy')
  res.locals.englishUrl = english
  res.locals.welshUrl = url.pathname + url.search
  res.locals.lang = req.query.lang === 'cy' ? 'cy' : 'en'
  next()
})

// The indicative obligation check's overview page was replaced by the
// Regulators page (30 October 2026). Old links go there instead.
router.get('/regulator/indicative-obligation', (req, res) => {
  res.redirect('/regulators')
})

// -----------------------------------------------------------------------------
// EB-324: placed on the market (PoM) submissions, brief and full versions (5 November 2026)
// The filters are a plain form (GET), so they work without JavaScript. The
// pages read the filters from the address, not the session, so the two
// versions don't change each other's filters.
// -----------------------------------------------------------------------------

const pom = require('./data/pom-submissions')

// Only keep a filter value we offer: anything else falls back to the default
function pick (value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback
}

// "Not built yet" page, coming back to this address
function notBuilt (back) {
  return '/regulator/not-built?back=' + encodeURIComponent(back)
}

// Brief version: one quarter at a time. Lands on the latest quarter with submissions.
// Scheme names aren't links: "View submission" opens one page with everything.
router.get('/regulator/pom-submissions/latest-quarter', (req, res) => {
  const year = pick(req.query.year, pom.YEARS, pom.LATEST_YEAR)
  const quarter = pick(req.query.quarter, ['1', '2', '3', '4'], pom.LATEST_QUARTER)
  const rows = pom.all()
    .filter(row => row.year === year && row.quarter === quarter)
    .sort(pom.byScheme)
    .map(row => ({ ...row, submissionHref: briefUrl(row) }))
  res.render('regulator/pom-submissions/latest-quarter', {
    pom, rows, filters: { year, quarter }, quarterText: pom.QUARTERS[quarter - 1] + ' ' + year
  })
})

// Full version: everything (3 years). Lands on all years, quarters and statuses.
// Scheme names aren't links: "View" opens the submission, which links to the organisation.
router.get('/regulator/pom-submissions/all-submissions', (req, res) => {
  const year = pick(req.query.year, ['all', ...pom.YEARS], 'all')
  const quarter = pick(req.query.quarter, ['all', '1', '2', '3', '4'], 'all')
  const status = pick(req.query.status, ['all', ...pom.STATUSES], 'all')
  const rows = pom.all()
    .filter(row => (year === 'all' || row.year === year) &&
      (quarter === 'all' || row.quarter === quarter) &&
      (status === 'all' || row.status === status))
    .sort(pom.byQuarterThenDue)
    .map(row => ({ ...row, submissionHref: fullUrl(row) }))
  res.render('regulator/pom-submissions/all-submissions', {
    pom, rows, filters: { year, quarter, status }
  })
})

// -----------------------------------------------------------------------------
// EB-325: one submission and the scheme's organisation details (6 November 2026)
// Each version has 2 pages: the submission, then the organisation details.
// Brief: the organisation details are view only, with just the people who can submit.
// Full: the organisation details have Change links, and list every user.
// Each back link goes to the page before it in the journey, worked out from
// the address (no browser history, so it works without JavaScript too).
// -----------------------------------------------------------------------------

const details = require('./data/pom-submission-details')

function briefUrl (row) {
  return '/regulator/pom-submissions/brief/' + row.schemeSlug + '/' + row.year + '/' + row.quarter
}
function fullUrl (row) {
  return '/regulator/pom-submissions/full/' + row.schemeSlug + '/' + row.year + '/' + row.quarter
}

// Brief, page 1: back to the brief list, on this submission's quarter
router.get('/regulator/pom-submissions/brief/:scheme/:year/:quarter', (req, res, next) => {
  const submission = details.submission(req.params.scheme, req.params.year, req.params.quarter)
  if (!submission) return next()
  res.render('regulator/pom-submission/brief', {
    submission,
    backHref: '/regulator/pom-submissions/latest-quarter?year=' + submission.year + '&quarter=' + submission.quarter,
    organisationHref: req.path.replace(/\/$/, '') + '/organisation-details',
    membersHref: req.path.replace(/\/$/, '') + '/members',
    notBuiltHref: notBuilt(req.originalUrl)
  })
})

// Brief, page 2: back to that submission
router.get('/regulator/pom-submissions/brief/:scheme/:year/:quarter/organisation-details', (req, res, next) => {
  const organisation = details.organisation(req.params.scheme)
  if (!organisation || !details.submission(req.params.scheme, req.params.year, req.params.quarter)) return next()
  res.render('regulator/pom-submission/organisation-details-brief', {
    organisation,
    backHref: briefUrl({ schemeSlug: req.params.scheme, year: req.params.year, quarter: req.params.quarter }),
    membersHref: req.path.replace(/\/$/, '') + '/members',
    notBuiltHref: notBuilt(req.originalUrl)
  })
})

// EB-326: members (brief version), from the submission or from the
// organisation details. Back goes to the page it was opened from
function membersPage (req, res, next, backHref) {
  const organisation = details.organisation(req.params.scheme)
  const members = details.members(req.params.scheme, req.params.year, req.params.quarter)
  if (!organisation || !members || !details.submission(req.params.scheme, req.params.year, req.params.quarter)) return next()
  res.render('regulator/pom-submission/members-brief', {
    org: organisation,
    members,
    backHref,
    notBuiltHref: notBuilt(req.originalUrl)
  })
}
router.get('/regulator/pom-submissions/brief/:scheme/:year/:quarter/members', (req, res, next) => {
  membersPage(req, res, next, briefUrl({ schemeSlug: req.params.scheme, year: req.params.year, quarter: req.params.quarter }))
})
router.get('/regulator/pom-submissions/brief/:scheme/:year/:quarter/organisation-details/members', (req, res, next) => {
  membersPage(req, res, next, briefUrl({ schemeSlug: req.params.scheme, year: req.params.year, quarter: req.params.quarter }) + '/organisation-details')
})

// Full, page 1: back to the full list
router.get('/regulator/pom-submissions/full/:scheme/:year/:quarter', (req, res, next) => {
  const submission = details.submission(req.params.scheme, req.params.year, req.params.quarter)
  if (!submission) return next()
  res.render('regulator/pom-submission/full', {
    submission,
    backHref: '/regulator/pom-submissions/all-submissions',
    organisationHref: req.path.replace(/\/$/, '') + '/organisation-details',
    notBuiltHref: notBuilt(req.originalUrl)
  })
})

// Full, page 2: back to that submission
router.get('/regulator/pom-submissions/full/:scheme/:year/:quarter/organisation-details', (req, res, next) => {
  const organisation = details.organisation(req.params.scheme)
  if (!organisation || !details.submission(req.params.scheme, req.params.year, req.params.quarter)) return next()
  res.render('regulator/pom-submission/organisation-details', {
    organisation,
    backHref: fullUrl({ schemeSlug: req.params.scheme, year: req.params.year, quarter: req.params.quarter }),
    notBuiltHref: notBuilt(req.originalUrl)
  })
})


// A holding page for links to pages we haven't built yet
router.get('/regulator/not-built', (req, res) => {
  const back = String(req.query.back || '')
  res.render('regulator/not-built', {
    // Only go back to a page in this prototype
    backHref: /^\/(?![/\\])/.test(back) ? back : '/regulators'
  })
})
