//
// Version 4 (18 November 2026): EB-367, the regulator makes a decision on a
// placed on the market (PoM) submission: accept it, query it, or reject it.
//
// In its own file, next to app/routes/v4.js, so the decision journey is easy
// to find and to hand over. Every address starts with the submission's, for
// example /regulator/pom-submissions/v4/recycling-lives/2026/3
//
// The journey (agreed with Marie, 18 November):
//
//   Flags or Members: tick the members you want to ask about (or none), then
//   Make a decision. Not on a member's page: there's nothing to tick there
//     POST .../decision/start       saves the ticks, then:
//       with members ticked        > .../decision/members  (Selected members)
//       with none                  > .../decision           (Make a decision)
//     POST .../decision/save        with JavaScript, each tick is saved as
//                                   you make it, so ticks on Flags are still
//                                   there after you move to Members
//
//   .../decision/members                                       > v4/selected-members.html
//     Selected members: each ticked to start with, with what made you look
//     (a flag, or the biggest change) and an optional short question.
//     Untick to remove. Continue, or Add more members (back to Members,
//     keeping what's here)
//   .../decision                                               > v4/decision.html
//     Make a decision: accept, query (with a respond by date) or reject, then
//     a message to the scheme and a file, whatever you choose.
//     Continue checks the answers, then goes straight to the confirmation
//     (no check your answers page)
//   .../decision/done                                          > v4/decision-done.html
//     The confirmation: a panel and what happens next, for the decision made
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
  req.session.data.v4Decisions[key] = req.session.data.v4Decisions[key] || { members: [], questions: {}, answers: {}, from: null }
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
      selected: here + '/decision/members',
      decision: here + '/decision',
      done: here + '/decision/done',
      flags: here,
      members: here + '/member-figures'
    }
  }
}

// Where Make a decision goes: Selected members if any are ticked, if not
// straight to Make a decision (Marie, 18 November)
function next (s) {
  return s.decision.members.length ? s.urls.selected : s.urls.decision
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
    res.redirect(next(s))
  })

  // Save the ticks as you go, so you can tick on Flags, move to Members and
  // tick more (Marie, 18 November). Sent by application.js (saveTicks) each
  // time a tick changes, with JavaScript. Nothing to show: no content (204)
  router.post(SUBMISSION + '/decision/save', (req, res, next_) => {
    const s = load(req)
    if (!s) return next_()
    saveTicks(s, req.body)
    res.status(204).end()
  })

  // Selected members
  router.get(SUBMISSION + '/decision/members', (req, res, next_) => {
    const s = load(req)
    if (!s) return next_()
    if (!s.decision.members.length) return res.redirect(s.urls.decision)
    const key = s.year + '-' + s.quarter
    const compareKey = figures.previousQuarter(key)
    const selected = s.decision.members
      .map(bprn => s.members.find(m => m.bprn === bprn))
      .filter(Boolean)
      .map(m => ({
        ...m,
        question: s.decision.questions[m.bprn] || '',
        // What made you look: the member's flags, or their biggest change
        flags: s.submission.flags.filter(f => f.producer === m.name),
        biggest: figures.biggestChange(m, key, compareKey)
      }))
    res.render('regulator/v4/selected-members', {
      submission: s.submission,
      selected,
      formAction: s.urls.selected,
      backHref: s.decision.from || s.urls.flags
    })
  })

  // Selected members: keep the ticked ones and their questions. Continue goes
  // to Make a decision; Add more members goes back to Members (Marie, 18 November)
  router.post(SUBMISSION + '/decision/members', (req, res, next_) => {
    const s = load(req)
    if (!s) return next_()
    const ticked = new Set(list(req.body.members))
    s.decision.members = s.decision.members.filter(b => ticked.has(b))
    const questions = {}
    s.decision.members.forEach(b => {
      const q = String(req.body['question-' + b] || '').trim().slice(0, 200)
      if (q) questions[b] = q
    })
    s.decision.questions = questions
    if (req.body.next === 'add') {
      s.decision.from = s.urls.members
      return res.redirect(s.urls.members)
    }
    res.redirect(s.urls.decision)
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
    const count = s.decision.members.length
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
      count,
      answers: s.decision.answers,
      err,
      errorList,
      formAction: s.urls.decision,
      // Change, in the line at the top: the members you've selected, or
      // Members to pick some if there are none
      changeHref: count ? s.urls.selected : s.urls.members,
      backHref: count ? s.urls.selected : (s.decision.from || s.urls.flags)
    })
  }

  // The page is clear when you come to it: nothing chosen (Marie, 18
  // November). Answers only come back after an error, to fix them
  router.get(SUBMISSION + '/decision', (req, res, next_) => {
    const s = load(req)
    if (!s) return next_()
    s.decision.answers = {}
    renderDecision(req, res, s)
  })

  router.post(SUBMISSION + '/decision', (req, res, next_) => {
    const s = load(req)
    if (!s) return next_()
    const b = req.body
    const decision = ['accept', 'query', 'reject'].includes(b.decision) ? b.decision : ''
    const answers = {
      decision,
      // One message to the scheme, whatever the decision (Marie, 18 November)
      message: String(b.message || '').trim(),
      respondByDay: String(b['respondBy-day'] || '').trim(),
      respondByMonth: String(b['respondBy-month'] || '').trim(),
      respondByYear: String(b['respondBy-year'] || '').trim(),
      // Prototype only: without a file upload service, only the file's name comes through
      file: String(b.file || '').trim()
    }
    s.decision.answers = answers

    // Each error is the name of its message in the words file
    const errors = {}
    if (!decision) errors.decision = 'errorDecision'
    if (decision === 'query') {
      const date = checkDate(answers.respondByDay, answers.respondByMonth, answers.respondByYear)
      if (date.error) errors.respondBy = { missing: 'errorRespondByMissing', invalid: 'errorRespondByInvalid', past: 'errorRespondByPast' }[date.error]
    }
    // A message to the scheme, always: one rule, whatever the decision. To
    // accept, it can be short (Marie, 18 November). Was: required only to
    // reject or to query the whole submission
    if (!answers.message) errors.message = 'errorMessage'

    if (Object.keys(errors).length) return renderDecision(req, res, s, errors)

    // Done: straight to the confirmation. No check your answers page:
    // regulators have just made their choices on this page, and it's an
    // internal service (Marie, 18 November). What was decided is kept for
    // the confirmation, and the ticks, questions and answers are cleared, so
    // the next decision starts fresh
    const date = decision === 'query' ? checkDate(answers.respondByDay, answers.respondByMonth, answers.respondByYear) : null
    s.decision.done = {
      decision,
      count: s.decision.members.length,
      respondByLong: date ? longDate(date.iso) : ''
    }
    s.decision.members = []
    s.decision.questions = {}
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
