//
// For guidance on how to create filters see:
// https://prototype-kit.service.gov.uk/filters/
//

const govukPrototypeKit = require('govuk-prototype-kit')
const addFilter = govukPrototypeKit.views.addFilter
const addFunction = govukPrototypeKit.views.addFunction

// Add-on: words-only content files. See app/lib/content.js
addFunction('content', require('./lib/content').content)
addFilter('paragraphs', require('./lib/content').paragraphs, { renderAsHtml: true })

// Add your filters here
