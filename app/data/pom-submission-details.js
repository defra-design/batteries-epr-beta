//
// Dummy data for one placed on the market (PoM) submission and its scheme's
// organisation details (EB-325). Prototype only: developers use the real data.
//
// The schemes are real, but every name, address, number and email here is
// made up. Recycling Lives has 14 users, to show a long list.
// Member counts are up to 281: the most any scheme has, Mak said in the
// design session (10 November 2026). Was 200 to 600, from round 2 of alpha
// testing: whether schemes could grow that big is a question for research.
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
    // When the organisation details last changed (dummy)
    lastUpdated: '2026-08-14',
    members: 214,
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
    // When the organisation details last changed (dummy)
    lastUpdated: '2026-08-14',
    members: 281,
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
    // When the organisation details last changed (dummy)
    lastUpdated: '2026-06-02',
    members: 176,
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
    // When the organisation details last changed (dummy)
    lastUpdated: '2026-09-21',
    members: 248,
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
    lastUpdatedLong: longDate(s.lastUpdated),
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
  // Flags (design session, 10 November 2026), each with a type in Mak and
  // Jen's terms: an error stops a submission, so regulators never see one.
  // An irregularity (something not quite right, like an estimate or rounding)
  // or a variance (a change) makes the scheme give a reason, and that's what
  // regulators see. They're against the data, not a file.
  // found: what we found, in specific words ("Up 42% on last quarter", not "Big change").
  // figures: the numbers behind it (full version only).
  // reason: the scheme's reason, which doesn't name the producer (it's shown next to it).
  // tagClasses: GOV.UK tag colours that no status uses, so they don't compete.
  const IRREGULARITY = { type: 'Irregularity', tagClasses: 'govuk-tag--magenta' }
  const VARIANCE = { type: 'Variance', tagClasses: 'govuk-tag--turquoise' }
  const flags = open
    ? [
        { ...IRREGULARITY, producer: PRODUCERS[0], found: 'Estimated figure', figures: '', reason: 'Waiting for figures from its supplier, so this quarter is an estimate.' },
        { ...VARIANCE, producer: PRODUCERS[1], found: 'Up 42% on last quarter', figures: '1.2 to 1.7 tonnes', reason: 'Started selling a new range of batteries in August.' },
        { ...VARIANCE, producer: PRODUCERS[2], found: 'Same tonnage as last quarter', figures: '0.8 tonnes', reason: 'Has checked and sold the same amount.' }
      ]
    : []
  // Supporting documents the scheme chose to send, to explain the return.
  // No data files (CSVs): the data is in the service, and the technical
  // direction is not to store them (Phil). File trails and earlier versions
  // belong to EB-366 (Mak). To confirm: whether supporting documents are kept
  const supportingDocuments = [
    { name: 'supporting-information.pdf', type: 'PDF', size: '240 KB' }
  ]
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
    // Members in this submission's data. It can differ from the scheme's member count
    membersInSubmission: org.members,
    flags,
    supportingDocuments,
    organisation: org
  }
}

// A scheme's members (producers): made-up names, made from these words so
// every scheme gets its own list. Current members match the scheme's member
// count; a few former members are kept for history.
const NAME_START = ['Acorn', 'Beacon', 'Bright', 'Cedar', 'Delta', 'Ember', 'Falcon', 'Granite', 'Harbour', 'Iris', 'Juniper', 'Kestrel', 'Lumen', 'Maple', 'Nova', 'Orchard', 'Pioneer', 'Quartz', 'Riverside', 'Summit', 'Thistle', 'Upland', 'Vale', 'Willow', 'Yarrow', 'Zenith']
const NAME_MIDDLE = ['Valley', 'Bridge', 'Point', 'Field', 'Gate', 'Park', 'Hill', 'Cross', 'Green', 'Moor', 'Way', 'Works']
const NAME_END = ['Batteries Ltd', 'Power Ltd', 'Energy Ltd', 'Cells Ltd', 'Electrical Ltd', 'Trading Ltd', 'Retail Ltd', 'Supplies Ltd']

function memberName (i, offset) {
  const n = i + offset
  return NAME_START[n % 26] + ' ' + NAME_MIDDLE[Math.floor(n / 26) % 12] + ' ' + NAME_END[(Math.floor(n / 312) + n) % 8]
}

function members (slug, year, quarter) {
  const s = SCHEMES[slug]
  if (!s) return null
  const offset = Object.keys(SCHEMES).indexOf(slug) * 41
  const sub = submission(slug, year, quarter)
  // Flags in this submission, by producer
  const flagged = {}
  if (sub) sub.flags.forEach(f => { flagged[f.producer] = (flagged[f.producer] || 0) + 1 })
  // The flagged producers are members too
  const list = PRODUCERS.map(name => ({ name, current: true }))
  for (let i = 0; list.length < s.members; i++) list.push({ name: memberName(i, offset), current: true })
  for (let i = 0; i < 4; i++) list.push({ name: memberName(1000 + i * 53, offset), current: false })
  return list
    .map((m, i) => ({
      ...m,
      // Made-up registration numbers: the real format is to check
      bprn: 'BPRN' + String(100000 + (offset + 1) * 1000 + i * 37).padStart(6, '0'),
      flags: flagged[m.name] || 0
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

module.exports = { organisation, submission, members }
