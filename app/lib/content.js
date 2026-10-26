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
function toName (label) {
  const words = label
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

module.exports = { content, parse, toName }
