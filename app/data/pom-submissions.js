//
// Dummy data for the placed on the market (PoM) submissions pages (EB-324).
// Prototype only: developers use the real data.
//
// The 4 real compliance schemes, and one submission per scheme per quarter
// from January to March 2024 to July to September 2026. Everything is
// "Accepted" except the latest quarter. "Today" is fixed at Monday 23 November
// 2026, the first day of user research (23 to 25 November), so every date adds
// up on that day: what's overdue doesn't change as the days go by, and no
// review date to come is already past.
// Was 5 November 2026: moved on 17 November, as 12 November would have been in
// the past by research (David and Steve)
//
// The latest quarter shows each case once, so research can see them all
// (18 November): overdue (sent 31 days ago), 10 days ago, 3 days ago, and
// accepted (just the date).
// Was: an escalated return from April to June 2026, overdue by 101 days, which
// would throw people in research. No dummy return is Query raised or Escalated
//

const TODAY = '2026-11-23'

const SCHEMES = [
  { slug: 'batteryback', name: 'BatteryBack' },
  { slug: 'recycling-lives', name: 'Recycling Lives Compliance Services Ltd' },
  { slug: 'erp-uk', name: 'ERP UK Ltd' },
  { slug: 'valpak', name: 'Valpak Ltd' }
]

// In full for the filters, short for the table (GOV.UK allows short months in tables)
const QUARTERS = ['January to March', 'April to June', 'July to September', 'October to December']
const QUARTERS_SHORT = ['Jan to Mar', 'Apr to Jun', 'Jul to Sep', 'Oct to Dec']

// Jen's statuses (6 November 2026), and their tag colours. Only colours that
// exist in GOV.UK Frontend 6: the standard tag is blue. No red: in GOV.UK
// services red means an error.
// In workflow order, Accepted last (design session, 10 November): the status
// filter lists them in this order, and sorting by Status follows it, not the alphabet
const STATUSES = {
  'To review': '',
  'Under review': 'govuk-tag--teal',
  'Query raised': 'govuk-tag--yellow',
  'Response received': 'govuk-tag--purple',
  Escalated: 'govuk-tag--orange',
  Accepted: 'govuk-tag--green'
}

// The latest quarter (July to September 2026): a mix of statuses
const LATEST = {
  // Recycling Lives: sent 31 days before "today", so it shows Overdue
  'recycling-lives': { submitted: '2026-10-23', status: 'Response received' },
  'erp-uk': { submitted: '2026-11-13', status: 'Under review' },
  batteryback: { submitted: '2026-11-20', status: 'To review' },
  valpak: { submitted: '2026-10-16', status: 'Accepted' }
}

const LATEST_YEAR = 2026
const LATEST_QUARTER = 3

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Days from one date to another: minus when it's already gone
function daysBetween (from, to) {
  return Math.round((new Date(to + 'T12:00:00Z') - new Date(from + 'T12:00:00Z')) / 86400000)
}

function addDays (iso, days) {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// "23 Oct 2026"
function shortDate (iso) {
  const [y, m, d] = iso.split('-').map(Number)
  // Non-breaking spaces, so a date never splits over two lines in a table
  return d + '\u00a0' + MONTHS[m - 1] + '\u00a0' + y
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
        // 28 consecutive days to review it (David, 18 November). Was 10
        const due = addDays(submitted, 28)
        const open = status !== 'Accepted'
        // Days since it was sent: shown until it's accepted or queried, when
        // the status says where it's at (Mak and David, 18 November).
        // Day 0 is the day it's sent, the next day is "1 day ago" (Mak, 18
        // November). To confirm (Mak is asking): whether the count starts
        // again when a scheme answers a query
        const counting = open && status !== 'Query raised'
        const daysSince = counting ? daysBetween(submitted, TODAY) : null
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
          // The review by date, even once it's accepted, so older returns
          // still show when they were due (version 4, Marie, 17 November)
          reviewByText: shortDate(due),
          reviewBySort: due,
          dueSort: open ? due : '',
          // Overdue: 28 days or more since it was sent, and not accepted or queried
          overdue: counting && daysSince >= 28,
          daysSince,
          // Time left to review it (team playback, 16 November): 3 is 3 days
          // left, 0 is due today, -3 is overdue by 3 days. Nothing once accepted
          daysLeft: open ? daysBetween(TODAY, due) : null,
          status,
          // Workflow order, for sorting by Status
          statusSort: String(Object.keys(STATUSES).indexOf(status)),
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

// What needs action first (design session, 10 November): soonest due first,
// then everything accepted, newest quarter first, then by scheme
function byDueThenNewest (a, b) {
  if (a.dueSort && b.dueSort) return a.dueSort.localeCompare(b.dueSort) || a.scheme.localeCompare(b.scheme)
  if (a.dueSort) return -1
  if (b.dueSort) return 1
  return b.quarterSort.localeCompare(a.quarterSort) || a.scheme.localeCompare(b.scheme)
}

module.exports = {
  SCHEMES,
  QUARTERS,
  // Short quarter names, for table headings (version 4, 17 November 2026)
  QUARTERS_SHORT,
  STATUSES: Object.keys(STATUSES),
  YEARS: ['2024', '2025', '2026'],
  LATEST_YEAR: String(LATEST_YEAR),
  LATEST_QUARTER: String(LATEST_QUARTER),
  all,
  byDue,
  byScheme,
  byQuarterThenDue,
  byDueThenNewest
}
