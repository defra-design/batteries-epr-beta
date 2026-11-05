//
// Dummy data for the placed on the market (PoM) submissions pages (EB-324).
// Prototype only: developers use the real data.
//
// The 4 real compliance schemes, and one submission per scheme per quarter
// from January to March 2024 to July to September 2026. Everything is
// "Accepted" except the latest quarter. "Today" is fixed at 5 November 2026,
// so what's overdue doesn't change as the days go by.
//

const TODAY = '2026-11-05'

const SCHEMES = [
  { slug: 'batteryback', name: 'BatteryBack' },
  { slug: 'recycling-lives', name: 'Recycling Lives Compliance Services Ltd' },
  { slug: 'erp-uk', name: 'ERP UK Ltd' },
  { slug: 'valpak', name: 'Valpak Ltd' }
]

// In full for the filters, short for the table (GOV.UK allows short months in tables)
const QUARTERS = ['January to March', 'April to June', 'July to September', 'October to December']
const QUARTERS_SHORT = ['Jan to Mar', 'Apr to Jun', 'Jul to Sep', 'Oct to Dec']

// Jen's statuses, and their tag colours
const STATUSES = {
  'To review': 'govuk-tag--blue',
  'In progress': 'govuk-tag--light-blue',
  'Query raised': 'govuk-tag--yellow',
  'Review response': 'govuk-tag--purple',
  Accepted: 'govuk-tag--green'
}

// The latest quarter (July to September 2026): a mix of statuses
const LATEST = {
  'recycling-lives': { submitted: '2026-10-23', status: 'Review response' },
  'erp-uk': { submitted: '2026-10-29', status: 'In progress' },
  batteryback: { submitted: '2026-11-02', status: 'To review' },
  valpak: { submitted: '2026-10-16', status: 'Accepted' }
}
const LATEST_YEAR = 2026
const LATEST_QUARTER = 3

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function addDays (iso, days) {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// "23 Oct 2026" (the table is in a scrollable pane, so cells don't wrap)
function shortDate (iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return d + ' ' + MONTHS[m - 1] + ' ' + y
}

// Every submission, before any filtering
function all () {
  const rows = []
  for (let year = 2024; year <= LATEST_YEAR; year++) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      if (year === LATEST_YEAR && quarter > LATEST_QUARTER) continue
      SCHEMES.forEach((scheme, i) => {
        let submitted, status
        if (year === LATEST_YEAR && quarter === LATEST_QUARTER) {
          ({ submitted, status } = LATEST[scheme.slug])
        } else {
          // Each quarter's returns come in during the month after it ends
          const quarterEnd = new Date(Date.UTC(year, quarter * 3, 0)).toISOString().slice(0, 10)
          submitted = addDays(quarterEnd, 9 + i * 4)
          status = 'Accepted'
        }
        const due = addDays(submitted, 10)
        const open = status !== 'Accepted'
        rows.push({
          scheme: scheme.name,
          schemeSlug: scheme.slug,
          year: String(year),
          quarter: String(quarter),
          quarterText: QUARTERS_SHORT[quarter - 1] + ' ' + year,
          quarterSort: year + '-' + quarter,
          submittedText: shortDate(submitted),
          submittedSort: submitted,
          // Once it's accepted, nothing is due
          dueText: open ? shortDate(due) : '',
          dueSort: open ? due : '',
          overdue: open && due < TODAY,
          status,
          statusClasses: STATUSES[status]
        })
      })
    }
  }
  return rows
}

// Soonest due first. Accepted (nothing due) at the bottom
function byDue (a, b) {
  if (a.dueSort && b.dueSort) return a.dueSort.localeCompare(b.dueSort)
  if (a.dueSort) return -1
  if (b.dueSort) return 1
  return a.scheme.localeCompare(b.scheme)
}

// Alphabetical by scheme, so each scheme is always in the same place
function byScheme (a, b) {
  return a.scheme.localeCompare(b.scheme)
}

// Newest quarter first, then soonest due
function byQuarterThenDue (a, b) {
  return b.quarterSort.localeCompare(a.quarterSort) || byDue(a, b)
}

module.exports = {
  SCHEMES,
  QUARTERS,
  STATUSES: Object.keys(STATUSES),
  YEARS: ['2024', '2025', '2026'],
  LATEST_YEAR: String(LATEST_YEAR),
  LATEST_QUARTER: String(LATEST_QUARTER),
  all,
  byDue,
  byScheme,
  byQuarterThenDue
}
