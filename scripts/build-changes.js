#!/usr/bin/env node
/*
 * Add-on: record a change. Copied from Alex Colbeck's record-a-change plugin
 * (alex-colbeck/claude-skills, the regulator toolkit's Claude skills) on
 * 5 November 2026, so our records match the regulator toolkit's. See the
 * README, "Add-ons". Our changes to Alex's version:
 *   - pages use our list layout (layouts/areas.html), with "What's changed"
 *     highlighted in the menu
 *   - the list is called "What's changed", and says it's interaction design
 *     changes only, with a link to content changes on GitHub
 *   - screenshots get their border from a class (app-change-screenshot in
 *     app/assets/sass/application.scss), not inline styles
 *   - the Bug tag is orange, not red
 *   - a new page (no before screenshot) shows just the screenshot, without
 *     "Before" and "After"
 *   - links in the "why": [link text](https://...) opens in a new tab, with
 *     "(opens in new tab)" added to the link text, as GOV.UK asks
 *   - screenshots show at half size, so phone and desktop are at the same scale
 *   - run it with: npm run changes
 *   - screenshots: for each page, one pair at 1020 pixels wide (desktop) and
 *     one at 320 pixels wide, from the top of the page to the end of the content
 *
 * build-pages.js — turn change records into pages the GOV.UK Prototype Kit
 * serves by itself, with no routes:
 *
 *   app/data/changes/<slug>.json  →  app/views/changes/<slug>.html  (/changes/<slug>)
 *                                    app/views/changes/index.html   (/changes)
 *
 * Usage (from the prototype's folder):
 *   node <skill>/build-pages.js
 *
 * Every page it writes starts with a "made by record-a-change" comment. It
 * only ever replaces a page that has that comment, so it never overwrites a
 * page someone wrote by hand.
 *
 * Settings, all optional, in record-a-change.config.json in the project:
 *   { "layout": "layouts/main.html" }   the layout the pages extend
 */
const fs = require('fs')
const path = require('path')

function fail (message) { console.error(message); process.exit(1) }
function projectRoot () {
  let dir = process.cwd()
  for (;;) {
    if (fs.existsSync(path.join(dir, 'package.json')) && fs.existsSync(path.join(dir, 'app', 'views'))) return dir
    const up = path.dirname(dir)
    if (up === dir) fail('Run this from a GOV.UK Prototype Kit prototype (no app/views folder found).')
    dir = up
  }
}
const ROOT = projectRoot()
const RECORDS = path.join(ROOT, 'app', 'data', 'changes')
const PAGES = path.join(ROOT, 'app', 'views', 'changes')
const MARK = '{# Made by record-a-change from app/data/changes/. Edit the record, then run build-pages.js again: changes made here are lost. #}'

let settings = {}
const settingsFile = path.join(ROOT, 'record-a-change.config.json')
if (fs.existsSync(settingsFile)) {
  try { settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8')) } catch (e) { fail('record-a-change.config.json is not valid JSON') }
}
const layout = String(settings.layout || 'layouts/areas.html')
if (!/^[\w./-]+$/.test(layout) || layout.indexOf('..') !== -1) fail('The "layout" setting must be a path to a layout, like layouts/main.html')

// ---- Text ----
function esc (s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    // Nunjucks reads {{ and {% even inside {% raw %} edge cases: break them up
    .replace(/\{/g, '&#123;').replace(/\}/g, '&#125;')
}
function inline (s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links: [text](https://...) only, so a typo can't become a broken or unsafe link
    .replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2" class="govuk-link" rel="noreferrer noopener" target="_blank">$1 (opens in new tab)</a>')
}
// Screenshots show at half their size, so a 320 pixel phone screenshot and a
// 1020 pixel desktop one are at the same scale. The size comes from the file
// name, for example after--version-a-320-pixels.png shows 160 pixels wide
function screenshotWidth (src) {
  const m = /-(\d+)-pixels\.png$/.exec(String(src))
  return m ? ' width="' + Math.round(Number(m[1]) / 2) + '"' : ''
}
// The "why" is short Markdown: paragraphs, **bold**, `code`, [links](https://...) and "- " bullets,
// nested with two spaces
function markdown (text) {
  const out = []
  const blocks = String(text || '').replace(/\r\n/g, '\n').split(/\n\s*\n/)
  blocks.forEach(function (block) {
    const lines = block.split('\n').filter(function (l) { return l.trim() })
    if (!lines.length) return
    if (lines.every(function (l) { return /^\s*- /.test(l) })) {
      let html = '<ul class="govuk-list govuk-list--bullet">'
      let nested = false
      lines.forEach(function (l, i) {
        const deep = /^\s{2,}- /.test(l)
        const item = inline(l.replace(/^\s*- /, ''))
        if (deep && !nested) { html = html.replace(/<\/li>$/, '') + '<ul class="govuk-list govuk-list--bullet">'; nested = true }
        if (!deep && nested) { html += '</ul></li>'; nested = false }
        html += '<li>' + item + '</li>'
      })
      if (nested) html += '</ul></li>'
      out.push(html + '</ul>')
    } else {
      out.push('<p class="govuk-body">' + lines.map(inline).join(' ') + '</p>')
    }
  })
  return out.join('\n')
}
function summary (text) {
  const first = String(text || '').split(/\n\s*\n/)[0] || ''
  return first.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/^\s*- /gm, '').replace(/\s+/g, ' ').trim()
}
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
function longDate (iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''))
  return m ? Number(m[3]) + ' ' + MONTHS[Number(m[2]) - 1] + ' ' + m[1] : esc(iso)
}
// Tag colours from GOV.UK Frontend 6. Fix is the standard (blue) tag
const TYPES = { bug: ['Bug', 'orange'], fix: ['Fix', ''], change: ['Change', 'yellow'], new: ['New', 'green'] }
function tags (r) {
  const t = Object.prototype.hasOwnProperty.call(TYPES, r.type) ? TYPES[r.type] : null
  let html = t ? '<strong class="govuk-tag' + (t[1] ? ' govuk-tag--' + t[1] : '') + '">' + t[0] + '</strong>' : ''
  ;(r.categories || []).forEach(function (c) { html += ' <strong class="govuk-tag govuk-tag--grey">' + esc(c.charAt(0).toUpperCase() + c.slice(1)) + '</strong>' })
  return html
}
// An image or a page address from a record: only paths inside the prototype
function imageSrc (p) { return /^[\w./-]+\.png$/.test(p) && p.indexOf('..') === -1 ? '/public/images/' + p : null }
// A path in the prototype: one slash, then no slash, backslash, space or
// control character that a browser could read as another site
function pageHref (u) { return /^\/(?![\/\\])[^\s\\\x00-\x1f]*$/.test(String(u)) ? esc(u) : null }

function page (title, body, back) {
  return MARK + '\n{% extends "' + layout + '" %}\n\n' +
    '{% set pageName = "' + esc(title) + '" %}\n{% set area = "changes" %}\n\n' +
    (back ? '{% block beforeContent %}\n<a href="' + back[0] + '" class="govuk-back-link">' + back[1] + '</a>\n{% endblock %}\n\n' : '') +
    '{% block content %}\n' + body + '\n{% endblock %}\n'
}

// ---- Records ----
if (!fs.existsSync(RECORDS)) fail('No change records yet. Add one in app/data/changes/ first.')
const records = fs.readdirSync(RECORDS).filter(function (f) { return /^[a-z0-9-]+\.json$/.test(f) }).map(function (f) {
  let r
  try { r = JSON.parse(fs.readFileSync(path.join(RECORDS, f), 'utf8')) } catch (e) { fail('app/data/changes/' + f + ' is not valid JSON') }
  r.slug = f.replace(/\.json$/, '')
  if (r.slug === 'index') fail('app/data/changes/index.json: "index" is kept for the list of changes. Rename the record.')
  if (!r.title) fail('app/data/changes/' + f + ' has no title')
  return r
}).sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')) || a.slug.localeCompare(b.slug) })

// Only replace pages this script made
function write (file, content) {
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8').indexOf(MARK) !== 0) {
    fail(path.relative(ROOT, file) + ' was not made by record-a-change, so it was left alone. Move it, then run this again.')
  }
  fs.writeFileSync(file, content)
}
fs.mkdirSync(PAGES, { recursive: true })

records.forEach(function (r) {
  let body = '<div class="govuk-grid-row">\n<div class="govuk-grid-column-two-thirds">\n' +
    '<span class="govuk-caption-l">' + longDate(r.date) + '</span>\n' +
    '<h1 class="govuk-heading-l">' + esc(r.title) + '</h1>\n' +
    (tags(r) ? '<p class="govuk-body">' + tags(r) + '</p>\n' : '') +
    markdown(r.why) + '\n'
  const pages = (r.pages || []).filter(function (p) { return p && pageHref(p.url) })
  if (pages.length) {
    body += '<h2 class="govuk-heading-m">Pages</h2>\n<ul class="govuk-list">\n' + pages.map(function (p) {
      return '<li><a class="govuk-link" href="' + pageHref(p.url) + '">' + esc(p.label || p.url) + '</a></li>'
    }).join('\n') + '\n</ul>\n'
  }
  body += '</div>\n</div>\n'
  ;(r.beforeAfter || []).forEach(function (pair) {
    const before = imageSrc(pair.before)
    const after = imageSrc(pair.after)
    // No before (a new page): just the screenshot, with no "Before" and "After"
    if (!before) {
      body += '<h2 class="govuk-heading-m">' + esc(pair.label) + '</h2>\n<div class="govuk-grid-row">\n<div class="govuk-grid-column-two-thirds">\n' +
        (after ? '<img src="' + after + '" alt="' + esc(pair.label) + '" class="app-change-screenshot"' + screenshotWidth(after) + '>\n' : '<p class="govuk-body">No screenshot</p>\n') +
        '</div>\n</div>\n'
      return
    }
    body += '<h2 class="govuk-heading-m">' + esc(pair.label) + '</h2>\n<div class="govuk-grid-row">\n'
    ;[['Before', before], ['After', after]].forEach(function (side) {
      body += '<div class="govuk-grid-column-one-half">\n<h3 class="govuk-heading-s">' + side[0] + '</h3>\n' +
        (side[1] ? '<img src="' + side[1] + '" alt="' + side[0] + ': ' + esc(pair.label) + '" class="app-change-screenshot"' + screenshotWidth(side[1]) + '>\n'
          : '<p class="govuk-body">' + (side[0] === 'Before' ? 'No before: this is new' : 'No screenshot') + '</p>\n') + '</div>\n'
    })
    body += '</div>\n'
  })
  write(path.join(PAGES, r.slug + '.html'), page(r.title, body, ['/changes', 'What\'s changed']))
})

let index = '<div class="govuk-grid-row">\n<div class="govuk-grid-column-two-thirds">\n<h1 class="govuk-heading-xl">What\'s changed</h1>\n' +
  '<p class="govuk-body-l">Interaction design changes to the prototype: what changed and why. Newest first.</p>\n' +
  '<p class="govuk-body">Content changes aren\'t listed here. See every <a href="https://github.com/defra-design/batteries-epr-beta/commits/main/app/content" class="govuk-link" rel="noreferrer noopener" target="_blank">content change on GitHub (opens in new tab)</a>.</p>\n'
if (!records.length) index += '<p class="govuk-body">No changes recorded yet.</p>\n'
records.forEach(function (r) {
  index += '<div class="govuk-!-margin-bottom-6">\n' +
    '<p class="govuk-body-s govuk-!-margin-bottom-1">' + longDate(r.date) + (tags(r) ? ' ' + tags(r) : '') + '</p>\n' +
    '<h2 class="govuk-heading-m govuk-!-margin-bottom-2"><a class="govuk-link" href="/changes/' + r.slug + '">' + esc(r.title) + '</a></h2>\n' +
    '<p class="govuk-body">' + esc(summary(r.why)) + '</p>\n</div>\n'
})
index += '</div>\n</div>\n'
write(path.join(PAGES, 'index.html'), page('What\'s changed', index))

console.log('Wrote ' + records.length + ' change ' + (records.length === 1 ? 'page' : 'pages') + ' and the index, in app/views/changes/. They open at /changes.')
