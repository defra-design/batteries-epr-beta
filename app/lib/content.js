//
// Words-only content files: an add-on to the GOV.UK Prototype Kit.
//
// Why: the content designer edits the words for a page without touching
// the page's HTML, so they can't break the layout or the components.
//
// The words (and a page's dummy figures) live in app/content/, one .md file per page. Each file is a list
// of labels (lines starting ##) with the words underneath:
//
//   ## Heading
//   Indicative obligation for 2027
//
// Anything above the first ## is a note for the person editing, and is not
// shown on the page.
//
// In a page template, get the words like this:
//
//   {% set words = content("regulator/indicative-obligation") %}
//   <h1 class="govuk-heading-l">{{ words.heading }}</h1>
//
// A label becomes a short name: "Heading" is words.heading, and
// "Collection target" is words.collectionTarget.
//
// Paragraphs: under a label, a blank line starts a new paragraph. Show them
// with the paragraphs filter, which wraps each one in <p class="govuk-body">
// and shows nothing if the label is empty:
//
//   {{ words.calculationIntro | paragraphs }}
//
// The file is read every time the page loads, so a saved change shows when
// you refresh. A label the page asks for but the file doesn't have shows as
// [missing: ...] so it's easy to spot, and the rest of the page still works.
//
// To remove this add-on: delete this file, app/content/, and the line that
// requires it in app/filters.js. Pages that use content() would then need
// their words typed in again.
//

const fs = require('fs')
const path = require('path')

const CONTENT_DIR = path.join(__dirname, '..', 'content')

// "Collection target" -> "collectionTarget"
// Anything in brackets is a note for the editor, not part of the name:
// "Calculation intro (paragraphs welcome)" -> "calculationIntro"
function toName (label) {
  const words = label
    .replace(/\(.*?\)/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .trim()
    .split(/\s+/)
  return words
    .map((word, i) => (i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join('')
}

// Turn the text of a content file into { name: 'words' }
function parse (text) {
  const words = {}
  let name = null
  let lines = []

  function save () {
    if (name) {
      words[name] = lines.join('\n').trim()
    }
  }

  text.split(/\r?\n/).forEach((line) => {
    const label = line.match(/^##\s+(.+?)\s*$/)
    if (label) {
      save()
      name = toName(label[1])
      lines = []
    } else if (name) {
      lines.push(line)
    }
  })
  save()

  return words
}

// Wrap the words so a missing label shows as [missing: ...] instead of nothing
function withMissingMarkers (words, file) {
  return new Proxy(words, {
    get (target, key) {
      if (typeof key !== 'string' || key in target || key.startsWith('_') || key === 'then' || key === 'toJSON') {
        return target[key]
      }
      return `[missing: ${key} in app/content/${file}.md]`
    }
  })
}

function content (file) {
  const filePath = path.join(CONTENT_DIR, `${file}.md`)
  let text = ''
  try {
    text = fs.readFileSync(filePath, 'utf8')
  } catch (error) {
    console.warn(`content(): can't find app/content/${file}.md`)
  }
  return withMissingMarkers(parse(text), file)
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

// Words with blank lines between them -> one <p class="govuk-body"> each.
// The words are escaped, so nothing typed in a content file can become code.
function paragraphs (text) {
  if (!text || String(text).startsWith('[missing:')) {
    return text || ''
  }
  return String(text)
    .split(/\n\s*\n/)
    .map((para) => para.trim().replace(/\s*\n\s*/g, ' '))
    .filter(Boolean)
    .map((para) => `<p class="govuk-body">${para.replace(/[&<>"']/g, (c) => ESCAPES[c])}</p>`)
    .join('\n')
}

module.exports = { content, paragraphs, parse, toName }
