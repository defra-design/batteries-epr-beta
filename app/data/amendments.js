//
// Dummy data: changes to the figures in a placed on the market return, after
// it was first sent (EB-366, version 4, 17 November 2026). Prototype only:
// developers use the real data.
//
// From Ian's "Amendment history" design (alpha, Figma). Ian's design had a
// row for every changed figure. Version 4 has a row for each time a member's
// figures were changed, so the page still works when a resubmission changes
// lots of figures (waste will have a lot more). Where the figures before and
// after go is still to decide.
//
// Each change: the member, the date (short month, as it's in a table), who
// made it, and the chemistries whose figures changed (the changes page shows
// how many). The member's page shows each figure before and after
// (Marie, 17 November): see changesFor() below.
// A member can be in the list more than once, if their figures changed more
// than once. Only returns with a second version have changes.
//

const AMENDMENTS = {
  'recycling-lives-2026-3': [
    // Flagged and changed, so the member page shows both (Marie, 17 November):
    // Northpower's Other was sent as 17.00, fixed to 1.70, still a variance
    {
      member: 'Northpower Batteries Ltd', bprn: 'BPRN142037', date: '10 Nov 2026', madeBy: 'Michael Osei',
      chemistries: ['Other']
    },
    {
      member: 'Acorn Hill Electrical Ltd', bprn: 'BPRN146366', date: '10 Nov 2026', madeBy: 'Michael Osei',
      chemistries: ['Lead acid', 'Nickel cadmium', 'Other']
    },
    {
      member: 'Acorn Point Electrical Ltd', bprn: 'BPRN142518', date: '10 Nov 2026', madeBy: 'Michael Osei',
      chemistries: ['Lead acid', 'Nickel cadmium', 'Other']
    },
    {
      member: 'Beacon Gate Power Ltd', bprn: 'BPRN144479', date: '6 Nov 2026', madeBy: 'Daniel Hughes',
      chemistries: ['Other']
    },
    {
      member: 'Acorn Moor Energy Ltd', bprn: 'BPRN149252', date: '3 Nov 2026', madeBy: 'Daniel Hughes',
      chemistries: ['Nickel cadmium']
    },
    {
      member: 'Acorn Hill Electrical Ltd', bprn: 'BPRN146366', date: '3 Nov 2026', madeBy: 'Daniel Hughes',
      chemistries: ['Lead acid']
    }
  ],
  'erp-uk-2026-3': [
    {
      member: 'Beacon Cross Supplies Ltd', bprn: 'BPRN186848', date: '13 Nov 2026', madeBy: 'James Patel',
      chemistries: ['Other', 'Lead acid']
    },
    {
      member: 'Acorn Hill Electrical Ltd', bprn: 'BPRN185849', date: '13 Nov 2026', madeBy: 'James Patel',
      chemistries: ['Nickel cadmium']
    }
  ]
}

// The changes to one return, newest first: [] if there aren't any
function forReturn (scheme, year, quarter) {
  return AMENDMENTS[scheme + '-' + year + '-' + quarter] || []
}

// One member's changes in one return, a row per changed figure, newest
// first: { date, chemistry, madeBy, beforeText, afterText }.
// "figures" is the member's figures now: { 'Lead acid': 0.31, ... }, from
// member-figures.js. The newest change ends on today's figure, and each
// change before it ends where the next one started, so the figures add up.
// Dummy kinds of change, in turn: a decimal point in the wrong place, a
// figure left out, and a typing slip
function changesFor (scheme, year, quarter, bprn, figures) {
  const now = { ...figures }
  const rows = []
  let turn = 0
  forReturn(scheme, year, quarter).filter(c => c.bprn === bprn).forEach(c => {
    c.chemistries.forEach(chemistry => {
      const after = now[chemistry]
      let before = [round(after * 10), 0, round(after + 0.2)][turn % 3]
      if (before === after) before = round(after + 0.2)
      rows.push({ date: c.date, chemistry, madeBy: c.madeBy, beforeText: before.toFixed(2), afterText: after.toFixed(2) })
      now[chemistry] = before
      turn++
    })
  })
  return rows
}

// When the return was last changed, with the month in full, for example
// "10 November 2026" (the changes are newest first), or null if it hasn't been
function lastChanged (scheme, year, quarter) {
  const latest = forReturn(scheme, year, quarter)[0]
  if (!latest) return null
  const [day, month, yr] = latest.date.split(' ')
  const months = { Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June', Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December' }
  return day + ' ' + months[month] + ' ' + yr
}

function round (n) {
  return Math.round(n * 100) / 100
}

module.exports = { forReturn, changesFor, lastChanged }
