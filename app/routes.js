//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/create-routes/
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Add your routes here

// The indicative obligation check's overview page was replaced by the
// Regulators page (30 October 2026). Old links go there instead.
router.get('/regulator/indicative-obligation', (req, res) => {
  res.redirect('/regulators')
})

// -----------------------------------------------------------------------------
// EB-324: placed on the market (PoM) submissions, two versions (5 November 2026)
// The filters are a plain form (GET), so they work without JavaScript. The
// pages read the filters from the address, not the session, so the two
// versions don't change each other's filters.
// -----------------------------------------------------------------------------

const pom = require('./data/pom-submissions')

// Only keep a filter value we offer: anything else falls back to the default
function pick (value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback
}

function linksFor (row, back) {
  const backParam = '&back=' + encodeURIComponent(back)
  row.schemeHref = '/regulator/not-built?' + backParam.slice(1)
  row.submissionHref = '/regulator/not-built?' + backParam.slice(1)
  return row
}

// Version A: one quarter at a time. Lands on the latest quarter with submissions
router.get('/regulator/pom-submissions/latest-quarter', (req, res) => {
  const year = pick(req.query.year, pom.YEARS, pom.LATEST_YEAR)
  const quarter = pick(req.query.quarter, ['1', '2', '3', '4'], pom.LATEST_QUARTER)
  const rows = pom.all()
    .filter(row => row.year === year && row.quarter === quarter)
    .sort(pom.byDue)
    .map(row => linksFor(row, req.originalUrl))
  res.render('regulator/pom-submissions/latest-quarter', {
    pom, rows, filters: { year, quarter }, quarterText: pom.QUARTERS[quarter - 1] + ' ' + year
  })
})

// Version B: everything (3 years). Lands on all years, quarters and statuses
router.get('/regulator/pom-submissions/all-submissions', (req, res) => {
  const year = pick(req.query.year, ['all', ...pom.YEARS], 'all')
  const quarter = pick(req.query.quarter, ['all', '1', '2', '3', '4'], 'all')
  const status = pick(req.query.status, ['all', ...pom.STATUSES], 'all')
  const rows = pom.all()
    .filter(row => (year === 'all' || row.year === year) &&
      (quarter === 'all' || row.quarter === quarter) &&
      (status === 'all' || row.status === status))
    .sort(pom.byQuarterThenDue)
    .map(row => linksFor(row, req.originalUrl))
  res.render('regulator/pom-submissions/all-submissions', {
    pom, rows, filters: { year, quarter, status }
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
