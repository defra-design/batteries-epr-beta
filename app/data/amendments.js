//
// Dummy data: changes to the figures in a placed on the market return, after
// it was first sent (EB-366, version 4, 17 November 2026). Prototype only:
// developers use the real data.
//
// From Ian's "Amendment history" design (alpha, Figma). Ian's design had a
// row for every changed figure. Version 4 has a row for each time a member's
// figures were changed, so the page still works when a resubmission changes
// lots of figures (waste will have a lot more). Where the figures before and
// after go is still to decide.
//
// Each change: the member, the date (short month, as it's in a table), who
// made it, and the chemistries whose figures changed (the page shows how many).
// A member can be in the list more than once, if their figures changed more
// than once. Only returns with a second version have changes.
//

const AMENDMENTS = {
  'recycling-lives-2026-3': [
    {
      member: 'Acorn Hill Electrical Ltd', bprn: 'BPRN146366', date: '10 Nov 2026', madeBy: 'Michael Osei',
      chemistries: ['Lead acid', 'Lithium ion', 'Nickel cadmium']
    },
    {
      member: 'Acorn Point Electrical Ltd', bprn: 'BPRN142518', date: '10 Nov 2026', madeBy: 'Michael Osei',
      chemistries: ['Lead acid', 'Lithium ion', 'Nickel cadmium', 'Nickel metal hydride', 'Other']
    },
    {
      member: 'Beacon Gate Power Ltd', bprn: 'BPRN144479', date: '6 Nov 2026', madeBy: 'Daniel Hughes',
      chemistries: ['Lithium ion']
    },
    {
      member: 'Acorn Moor Energy Ltd', bprn: 'BPRN149252', date: '3 Nov 2026', madeBy: 'Daniel Hughes',
      chemistries: ['Nickel cadmium']
    },
    {
      member: 'Acorn Hill Electrical Ltd', bprn: 'BPRN146366', date: '3 Nov 2026', madeBy: 'Daniel Hughes',
      chemistries: ['Lead acid']
    }
  ],
  'erp-uk-2026-3': [
    {
      member: 'Beacon Cross Supplies Ltd', bprn: 'BPRN186848', date: '13 Nov 2026', madeBy: 'James Patel',
      chemistries: ['Other', 'Lithium ion']
    },
    {
      member: 'Acorn Hill Electrical Ltd', bprn: 'BPRN185849', date: '13 Nov 2026', madeBy: 'James Patel',
      chemistries: ['Nickel cadmium']
    }
  ]
}

// The changes to one return, newest first: [] if there aren't any
function forReturn (scheme, year, quarter) {
  return AMENDMENTS[scheme + '-' + year + '-' + quarter] || []
}

module.exports = { forReturn }
