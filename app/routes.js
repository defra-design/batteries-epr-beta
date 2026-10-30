//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/create-routes/
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Add your routes here

// The indicative obligation check's overview page was replaced by the
// Regulators page (30 October 2026). Old links go there instead.
router.get('/regulator/indicative-obligation', (req, res) => {
  res.redirect('/regulators')
})
