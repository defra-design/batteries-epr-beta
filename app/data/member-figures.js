//
// Dummy data for members' placed on the market figures, by chemistry and
// quarter (EB-366, version 4, 17 November 2026). Prototype only: developers
// use the real data.
//
// Every member gets figures for every quarter from January to March 2024 to
// July to September 2026. They're worked out from the number in the member's
// registration number, so the same member always shows the same figures.
// Each quarter is up to 6% above or below the member's usual figure, so the
// change from one quarter to the next is always under 13%, well under the
// 25% that regulators look out for, and nothing looks odd in research.
//
// Members who've left the scheme have no figures after they left.
//
// The flagged members (app/content/regulator/flags.md) are written out below,
// so their figures match their flags in July to September 2026, compared
// with April to June 2026. If the flags change, change these to match.
//
// Chemistries: lead acid, nickel cadmium and other, the 3 that portable
// battery returns use today. Still to agree: the full list (Kieran thinks 5 to
// 10) and whether to split by category too (UN-036).
//
// The numbers only: the pages turn them into words ("Up 0.50 (42%)"), using
// the words files, so content design can change the wording.
//

const pom = require('./pom-submissions')

const CHEMISTRIES = ['Lead acid', 'Nickel cadmium', 'Other']

// The flagged members, in the two quarters their flags compare
const FLAGGED = {
  // Variance: Other up 42% on last quarter, 1.2 to 1.7 tonnes
  'Northpower Batteries Ltd': {
    '2026-2': { 'Lead acid': 0.31, 'Nickel cadmium': 0, Other: 1.20 },
    '2026-3': { 'Lead acid': 0.32, 'Nickel cadmium': 0, Other: 1.70 }
  },
  // Irregularity: figures look rounded, 1.0 tonnes
  'Cellwise Trading Ltd': {
    '2026-2': { 'Lead acid': 0.12, 'Nickel cadmium': 0, Other: 0.94 },
    '2026-3': { 'Lead acid': 0.11, 'Nickel cadmium': 0, Other: 1.00 }
  }
}

// The chemistry each flag is about, so the member's page can show the flag
// against that row. Brightcell's flag is about the whole quarter (estimated)
const FLAGGED_CHEMISTRY = {
  'Northpower Batteries Ltd': 'Other',
  'Cellwise Trading Ltd': 'Other'
}

// Irregularity: estimated by the scheme in these quarters
const ESTIMATED = { 'Brightcell Ltd': ['2026-3'] }

// Every quarter there's data for, oldest first, as "2026-3" (year, then quarter)
function quarters () {
  const list = []
  for (let year = 2024; year <= Number(pom.LATEST_YEAR); year++) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      if (year === Number(pom.LATEST_YEAR) && quarter > Number(pom.LATEST_QUARTER)) break
      list.push(year + '-' + quarter)
    }
  }
  return list
}

// "July to September 2026", or "Jul to Sep 2026" for table headings
function quarterName (key, short) {
  const [year, quarter] = key.split('-')
  const names = short ? pom.QUARTERS_SHORT : pom.QUARTERS
  return names[quarter - 1] + ' ' + year
}

// The quarter before, or null for the first one
function previousQuarter (key) {
  const list = quarters()
  const i = list.indexOf(key)
  return i > 0 ? list[i - 1] : null
}

// Round to 2 decimal places
function round (n) {
  return Math.round(n * 100) / 100
}

// Members who've left the scheme left at the end of April to June 2026, so
// they have no figures after that
const LEFT_AFTER = '2026-2'

// Whether a member is in a quarter's return: members who've left are only in
// the returns up to when they left (Marie, 20 November: with no Membership
// filter, members who'd left showed on the July to September 2026 list)
function inReturn (member, key) {
  return member.current || quarters().indexOf(key) <= quarters().indexOf(LEFT_AFTER)
}

// One member's tonnes for one quarter: { 'Lead acid': 0.31, 'Nickel cadmium': 0, Other: 1.2 }
function tonnes (member, key) {
  if (FLAGGED[member.name] && FLAGGED[member.name][key]) {
    return FLAGGED[member.name][key]
  }
  if (!member.current && quarters().indexOf(key) > quarters().indexOf(LEFT_AFTER)) {
    return { 'Lead acid': 0, 'Nickel cadmium': 0, Other: 0 }
  }
  // The number in the registration number, for example 142037 in BPRN142037
  const n = Number(member.bprn.replace(/\D/g, ''))
  // From 6% below to 6% above the usual figure, changing each quarter
  const step = (quarters().indexOf(key) + n) % 5
  const change = 1 + (step - 2) * 0.03
  return {
    'Lead acid': round((0.10 + (n % 20) / 100) * change),
    // Every third member doesn't sell nickel cadmium batteries
    'Nickel cadmium': n % 3 === 0 ? 0 : round((0.05 + (n % 10) / 100) * change),
    Other: round((0.20 + (n % 40) / 100) * change)
  }
}

// Two figures and the change between them, as numbers and as text with
// 2 decimal places. The pages turn this into words
function compare (now, before) {
  const diff = round(now - before)
  return {
    now,
    before,
    nowText: now.toFixed(2),
    beforeText: before.toFixed(2),
    diff,
    diffText: Math.abs(diff).toFixed(2),
    // How big the change is, as a whole percentage (none if there was nothing before)
    percent: before > 0 ? Math.round(Math.abs(diff) / before * 100) : null
  }
}

function sum (figures) {
  return round(CHEMISTRIES.reduce((total, chemistry) => total + figures[chemistry], 0))
}

// One member, two quarters: a row per chemistry, then the total
function comparison (member, key, compareKey) {
  const now = tonnes(member, key)
  const before = tonnes(member, compareKey)
  const estimated = ESTIMATED[member.name] || []
  return {
    rows: CHEMISTRIES.map(chemistry => ({ chemistry, ...compare(now[chemistry], before[chemistry]) })),
    total: compare(sum(now), sum(before)),
    nowEstimated: estimated.includes(key),
    beforeEstimated: estimated.includes(compareKey)
  }
}

// The chemistry that changed most, up or down, for the list of member
// figures: { chemistry: 'Other', now: 1.7, before: 1.2, diff: 0.5, ... }.
// By chemistry, not the total, so a change from one chemistry to another
// can't hide behind a total that stays the same
function biggestChange (member, key, compareKey) {
  const now = tonnes(member, key)
  const before = tonnes(member, compareKey)
  let biggest = null
  CHEMISTRIES.forEach(chemistry => {
    const change = { chemistry, ...compare(now[chemistry], before[chemistry]) }
    if (!biggest || Math.abs(change.diff) > Math.abs(biggest.diff)) biggest = change
  })
  return biggest
}

// About the member: when they joined the scheme, and when they left if they
// have. Dummy dates, worked out from the registration number
function about (member) {
  const n = Number(member.bprn.replace(/\D/g, ''))
  return {
    joined: '1 January ' + (2019 + n % 5),
    left: member.current ? null : '30 June 2026'
  }
}

// The chemistry a member's flag is about, or null
function flaggedChemistry (member) {
  return FLAGGED_CHEMISTRY[member.name] || null
}

module.exports = { quarters, quarterName, previousQuarter, comparison, biggestChange, about, flaggedChemistry, tonnes, inReturn }
