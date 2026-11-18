//
// Version 4 (18 November 2026): EB-367, the regulator makes a decision on a
// placed on the market (PoM) submission: accept it, query it, or reject it.
//
// In its own file, next to app/routes/v4.js, so the decision journey is easy
// to find and to hand over. Every address starts with the submission's, for
// example /regulator/pom-submissions/v4/recycling-lives/2026/3
//
// The journey (Marie, 18 November evening, after a heuristic review):
//
//   Any page of a submission: tick the members you want to query on Flags or
//   Members (or none), then Continue at the bottom of the page
//     POST .../decision/start       saves the ticks, then Make a decision
//     POST .../decision/select      on a member's page: tick "Query this
//                                   member", then Continue, or Back to
//                                   flags, members or changes, where they
//                                   show as ticked
//     POST .../decision/save        with JavaScript, each tick is saved as
//                                   you make it, so ticks on Flags are still
//                                   there after you move to Members
//
//   .../decision                                               > v4/decision.html
//     Make a decision, all on one page: the members you selected (Change
//     members), accept, query (with a respond by date) or return, then a
//     message to the scheme and a file, and an internal note only
//     regulators see. Send to the scheme checks the answers, then the
//     confirmation
//   .../decision/done                                          > v4/decision-done.html
//     The confirmation: a panel and one line of what happens next
//
//   Was (18 November): Selected members (a message about each member) and
//   Check your decision as well. Dropped the same evening: no user need asks
//   for a message about each member, and with everything on one page there's
//   nothing to check that isn't already on screen
//
// What's ticked and typed is kept in the session, one submission at a time
// (req.session.data.v4Decisions, so Clear data in the footer clears it),
// so it works without JavaScript: every page is
// a plain form. Nothing is ticked to start with on Flags or Members, but a
// member you've already selected stays ticked when you come back to add more.
//
// Called from app/routes.js.
//

const pom = require('../data/pom-submissions')
const details = require('../data/pom-submission-details')
const figures = require('../data/member-figures')
const { content } = require('../lib/content')

const V4 = '/regulator/pom-submissions/v4'
const SUBMISSION = V4 + '/:scheme/:year/:quarter'

function submissionUrl (scheme, year, quarter) {
  return V4 + '/' + scheme + '/' + year + '/' + quarter
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
  req.session.data.v4Decisions = req.session.data.v4Decisions || {}
  req.session.data.v4Decisions[key] = req.session.data.v4Decisions[key] || { members: [], answers: {}, from: null }
  return req.session.data.v4Decisions[key]
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

// Where Continue goes: Make a decision
function next (s) {
  return s.urls.decision
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

// Save the ticks from Flags or Members. shown: every member on that page, so
// unticking one there removes them, and anyone selected on another page (or
// another search) stays selected. Keeps the order they were picked in
function saveTicks (s, body) {
  const known = new Set(s.members.map(m => m.bprn))
  const shown = new Set(list(body.shown))
  const ticked = list(body.members).filter(b => known.has(b))
  const kept = s.decision.members.filter(b => !shown.has(b) || ticked.includes(b))
  s.decision.members = [...new Set([...kept, ...ticked])]
}

module.exports = (router) => {
  // Make a decision on Flags or Members: save the ticks, then go on.
  // shown: every member on that page, so unticking one there removes them,
  // and anyone selected on another page (or another search) stays selected
  router.post(SUBMISSION + '/decision/start', (req, res, next_) => {
    const s = load(req)
    if (!s) return next_()
    saveTicks(s, req.body)
    // Back from Selected members goes to the page you came from
    s.decision.from = safeBack(req.body.from, s.urls.flags)
    startFresh(s)
    res.redirect(next(s))
  })

  // Save the ticks as you go, so you can tick on Flags, move to Members and
  // tick more (Marie, 18 November). Sent by application.js (saveTicks) each
  // time a tick changes, with JavaScript. Nothing to show: no content (204)
  // A member's page: "Select this member for a decision", then Back to
  // flags, members or changes (a button, so it saves without JavaScript)
  router.post(SUBMISSION + '/decision/select', (req, res, next_) => {
    const s = load(req)
    if (!s) return next_()
    saveTicks(s, req.body)
    // Continue: on to Selected members or Make a decision, as from any
    // other page. The grey Back button: back where you came from
    if (req.body.next === 'continue') {
      s.decision.from = safeBack(req.body.from, s.urls.flags)
      startFresh(s)
      return res.redirect(next(s))
    }
    res.redirect(safeBack(req.body.back, s.urls.flags))
  })

  router.post(SUBMISSION + '/decision/save', (req, res, next_) => {
    const s = load(req)
    if (!s) return next_()
    saveTicks(s, req.body)
    res.status(204).end()
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
    const words = content('regulator/v4/decision')
    const err = {}
    const errorList = []
    FIELDS.forEach(([name, href]) => {
      if (!errors || !errors[name]) return
      err[name] = { text: words[errors[name]] }
      errorList.push({ text: words[errors[name]], href })
    })
    res.render('regulator/v4/decision', {
      submission: s.submission,
      // The members you selected, in the order you picked them, each with
      // why you picked them, to jog your memory when you write the message
      // (Marie, 18 November): their flags, or if they have none, their
      // largest change on the quarter before
      members: s.decision.members
        .map(bprn => s.members.find(m => m.bprn === bprn))
        .filter(Boolean)
        .map(m => ({
          name: m.name,
          bprn: m.bprn,
          flags: s.submission.flags.filter(f => f.producer === m.name),
          largest: figures.biggestChange(m, s.year + '-' + s.quarter, figures.previousQuarter(s.year + '-' + s.quarter))
        })),
      answers: s.decision.answers,
      err,
      errorList,
      formAction: s.urls.decision,
      backHref: s.decision.from || s.urls.flags
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
    res.render('regulator/v4/decision-done', {
      submission: s.submission,
      done: s.decision.done
    })
  })
}
