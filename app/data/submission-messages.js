//
// Messages to the scheme and internal notes on a submission (EB-367, Marie,
// 18 November 2026). Shown at the bottom of Submission details, newest
// first: what was sent to the scheme (a query, an acceptance, a return) and
// internal notes only regulators see (UN-061). What the scheme changed is on
// the Changes page, so it isn't repeated here.
//
// A submission is one quarter, and it might go back and forth a few times,
// so the list stays short.
//
// Dummy history only, so research sees a submission that's already been
// queried (Recycling Lives, Response received). Prototype only: decisions
// made in the prototype aren't added here, as the status would need to move
// on too (Marie, 18 November).
//
// Each entry: date (YYYY-MM-DD), kind ('query', 'accept', 'reject', 'note'),
// by (who), and what goes with that kind: members (names), message,
// respondBy (YYYY-MM-DD), file.
// Prototype only: developers use the real data.
//

// Who's signed in, in the prototype: the regulator making decisions
const REGULATOR = 'Sam Patel'

const DUMMY = {
  'recycling-lives/2026/3': [
    {
      date: '2026-10-28',
      kind: 'query',
      by: REGULATOR,
      members: ['Northpower Batteries Ltd', 'Acorn Hill Electrical Ltd', 'Acorn Point Electrical Ltd'],
      message: 'Please check the figures for these 3 members. Northpower Batteries Ltd reported 17 tonnes of other batteries, 10 times the quarter before.',
      respondBy: '2026-11-11'
    },
    {
      date: '2026-10-28',
      kind: 'note',
      by: REGULATOR,
      message: 'Northpower looks like a typo, 17 for 1.7. The scheme usually corrects these quickly.'
    }
  ]
}

// Newest first. Entries on the same day keep the order they were added
function forSubmission (scheme, year, quarter) {
  const all = DUMMY[scheme + '/' + year + '/' + quarter] || []
  return all
    .map((entry, i) => ({ ...entry, i }))
    .sort((a, b) => (b.date.localeCompare(a.date)) || (b.i - a.i))
}

module.exports = { REGULATOR, forSubmission }
