//
// Dummy data for one placed on the market (PoM) submission and its scheme's
// organisation details (EB-325). Prototype only: developers use the real data.
//
// The schemes are real, but every name, address, number and email here is
// made up. Recycling Lives has 14 users, to show a long list.
//

const pom = require('./pom-submissions')

const TODAY = '2026-11-05'
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function shortDate (iso) {
  const [y, m, d] = iso.split('-').map(Number)
  // Non-breaking spaces, so a date never splits over two lines in a table
  return d + '\u00a0' + MONTHS[m - 1] + '\u00a0' + y
}
// "2 November 2026", for summary lists, where there's room for the full month
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
function longDate (iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return d + ' ' + MONTHS_LONG[m - 1] + ' ' + y
}
function addDays (iso, days) {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
function daysBetween (from, to) {
  return Math.round((new Date(to + 'T12:00:00Z') - new Date(from + 'T12:00:00Z')) / 86400000)
}

// Delegated authority runs for a compliance year (dummy dates)
const AUTHORITY = { from: '2026-04-01', to: '2027-03-31' }

// role: appropriatePerson (legally responsible, can always submit),
// superUser (the top of the account: "Super user" or "Admin", depending on
// the version), or user. delegated: has delegated authority to submit.
function person (name, role, delegated) {
  const email = name.toLowerCase().replace(/[^a-z ]/g, '').replace(/ /g, '.') + '@example.com'
  return { name, email, role, delegated: !!delegated }
}

const SCHEMES = {
  batteryback: {
    registeredName: 'BatteryBack',
    address: ['1 Example Street', 'Leeds', 'LS1 1AA'],
    companiesHouseNumber: '01234561',
    bcsNumber: 'BCS 00121',
    members: 12,
    tonnes: 18.4,
    people: [
      person('Priya Shah', 'appropriatePerson'),
      person('Tom Fielding', 'superUser', true),
      person('Hannah Lee', 'user', true),
      person('Owen Price', 'user')
    ]
  },
  'recycling-lives': {
    registeredName: 'Recycling Lives Compliance Services Ltd',
    address: ['2 Example Road', 'Preston', 'PR1 2BB'],
    companiesHouseNumber: '01234562',
    bcsNumber: 'BCS 00122',
    members: 31,
    tonnes: 27.6,
    people: [
      person('Michael Osei', 'superUser', true),
      person('Grace Okafor', 'appropriatePerson'),
      person('Daniel Hughes', 'user', true),
      person('Aisha Khan', 'user', true),
      person('Ben Carter', 'user'),
      person('Chloe Evans', 'user'),
      person('David Morgan', 'user'),
      person('Ella Robinson', 'user'),
      person('Finn Walsh', 'user'),
      person('Isla Murray', 'user'),
      person('Jack Turner', 'user'),
      person('Leah Wood', 'user'),
      person('Noah Bennett', 'user'),
      person('Ruby Clarke', 'user')
    ]
  },
  'erp-uk': {
    registeredName: 'ERP UK Ltd',
    address: ['3 Example Lane', 'London', 'SE1 3CC'],
    companiesHouseNumber: '01234563',
    bcsNumber: 'BCS 00123',
    members: 24,
    tonnes: 22.9,
    people: [
      person('Sarah Mitchell', 'appropriatePerson'),
      person('James Patel', 'superUser', true),
      person('Lucy Green', 'user')
    ]
  },
  valpak: {
    registeredName: 'Valpak Ltd',
    address: ['4 Example Avenue', 'Stratford-upon-Avon', 'CV37 4DD'],
    companiesHouseNumber: '01234564',
    bcsNumber: 'BCS 00124',
    members: 40,
    tonnes: 35.2,
    people: [
      person('Rachel Adams', 'appropriatePerson'),
      person('Chris Doyle', 'superUser', true),
      person('Megan Hall', 'user', true),
      person('Sam Wright', 'user')
    ]
  }
}

// Made-up producer names, for the flags
const PRODUCERS = ['Brightcell Ltd', 'Northpower Batteries Ltd', 'Cellwise Trading Ltd']

function organisation (slug) {
  const s = SCHEMES[slug]
  if (!s) return null
  const scheme = pom.SCHEMES.find(x => x.slug === slug)
  // The appropriate person first, then everyone with delegated authority
  const canSubmit = s.people.filter(p => p.role === 'appropriatePerson').concat(s.people.filter(p => p.role !== 'appropriatePerson' && p.delegated))
  return {
    slug,
    name: scheme.name,
    registeredName: s.registeredName,
    address: s.address,
    companiesHouseNumber: s.companiesHouseNumber,
    bcsNumber: s.bcsNumber,
    members: s.members,
    appropriatePerson: s.people.find(p => p.role === 'appropriatePerson'),
    superUser: s.people.find(p => p.role === 'superUser'),
    canSubmit,
    otherUsers: s.people.filter(p => !canSubmit.includes(p)),
    authorityFrom: shortDate(AUTHORITY.from),
    authorityTo: shortDate(AUTHORITY.to)
  }
}

// One scheme's submission for one quarter, or null if there isn't one
function submission (slug, year, quarter) {
  const row = pom.all().find(r => r.schemeSlug === slug && r.year === String(year) && r.quarter === String(quarter))
  if (!row) return null
  const org = organisation(slug)
  const s = SCHEMES[slug]
  const open = row.status !== 'Accepted'
  // Returns sent back and forth have a second version
  const versions = ['Under review', 'Response received', 'Escalated'].includes(row.status) ? 2 : 1
  // The person who submitted: the super user, who has delegated authority
  const submittedBy = org.superUser
  const flags = open
    ? [
        { title: 'Estimated figure', producer: PRODUCERS[0], reason: PRODUCERS[0] + ' is waiting for figures from its supplier, so this quarter is an estimate.' },
        { title: 'Big change since last quarter', producer: PRODUCERS[1], reason: PRODUCERS[1] + ' started selling a new range of batteries in August.' },
        { title: 'Same tonnage as last quarter', producer: PRODUCERS[2], reason: PRODUCERS[2] + ' has checked and sold the same amount.' }
      ]
    : []
  const fileBase = 'pom-' + slug + '-' + year + '-q' + quarter
  const files = []
  for (let v = versions; v >= 1; v--) {
    const date = v === versions ? row.submittedSort : addDays(row.submittedSort, -8)
    const fileFlags = v === versions ? flags : []
    files.push({ name: fileBase + '-v' + v + '.csv', submittedBy: submittedBy.name, flags: fileFlags.length, flagList: fileFlags, dateText: shortDate(date), dateLong: longDate(date) })
    if (v === versions) {
      files.push({ name: 'supporting-information.pdf', submittedBy: submittedBy.name, flags: 0, flagList: [], dateText: shortDate(date), dateLong: longDate(date) })
    }
  }
  return {
    ...row,
    yearQuarterFull: pom.QUARTERS[quarter - 1] + ' ' + year,
    submittedLong: longDate(row.submittedSort),
    dueLong: row.dueSort ? longDate(row.dueSort) : '',
    open,
    daysLeft: open && !row.overdue ? daysBetween(TODAY, row.dueSort) : null,
    version: versions,
    versions,
    submittedBy,
    tonnes: (s.tonnes + Number(quarter) * 0.7).toFixed(1),
    producers: org.members,
    flags,
    files,
    organisation: org
  }
}

// A scheme's members (producers): made-up names, made from these words so
// every scheme gets its own list. Current members match the scheme's member
// count; a couple of former members are kept for history.
const NAME_START = ['Acorn', 'Beacon', 'Bright', 'Cedar', 'Delta', 'Ember', 'Falcon', 'Granite', 'Harbour', 'Iris', 'Juniper', 'Kestrel', 'Lumen', 'Maple', 'Nova', 'Orchard', 'Pioneer', 'Quartz', 'Riverside', 'Summit', 'Thistle', 'Upland', 'Vale', 'Willow', 'Yarrow', 'Zenith']
const NAME_END = ['Batteries Ltd', 'Power Ltd', 'Energy Ltd', 'Cells Ltd', 'Electrical Ltd', 'Trading Ltd', 'Retail Ltd', 'Supplies Ltd']

function members (slug, year, quarter) {
  const s = SCHEMES[slug]
  if (!s) return null
  const offset = Object.keys(SCHEMES).indexOf(slug) * 7
  const sub = submission(slug, year, quarter)
  // Flags in this submission, by producer
  const flagged = {}
  if (sub) sub.flags.forEach(f => { flagged[f.producer] = (flagged[f.producer] || 0) + 1 })
  const list = []
  // The flagged producers are members too
  PRODUCERS.forEach(name => list.push({ name, current: true }))
  for (let i = 0; list.length < s.members; i++) {
    const name = NAME_START[(i + offset) % NAME_START.length] + ' ' + NAME_END[(i * 3 + offset) % NAME_END.length]
    if (!list.find(m => m.name === name)) list.push({ name, current: true })
  }
  list.push({ name: NAME_START[(offset + 5) % NAME_START.length] + ' Home Ltd', current: false })
  list.push({ name: NAME_START[(offset + 11) % NAME_START.length] + ' Outdoor Ltd', current: false })
  return list
    .map((m, i) => ({
      ...m,
      // Made-up registration numbers: the real format is to check
      bprn: 'BPRN' + String(10000 + (offset + 1) * 1000 + i * 37).padStart(6, '0'),
      flags: flagged[m.name] || 0
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

module.exports = { organisation, submission, members }
