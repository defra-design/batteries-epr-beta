//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/adding-css-javascript-and-images/
//

window.GOVUKPrototypeKit.documentReady(() => {
  rememberTableSort()
})

//
// Add-on: remember a sortable table's sort (design session, 10 November 2026).
//
// Why: the MOJ sortable table sorts in the browser, so reloading the page
// (Reset, or coming back from a submission) lost the sort someone chose.
//
// How: add data-app-remember-sort="a-name" to a table that has
// data-module="moj-sortable-table". The sort is kept for this browser tab only
// (sessionStorage), and put back by pressing the same column button again.
// Without JavaScript nothing changes: the table is in its normal order.
//
// To remove this add-on: delete this function and the line that calls it,
// and the data-app-remember-sort attributes.
//
function rememberTableSort () {
  document.querySelectorAll('table[data-app-remember-sort]').forEach(($table) => {
    const key = 'app-sort-' + $table.getAttribute('data-app-remember-sort')

    // Wait a moment, so the MOJ sortable table has added its column buttons
    window.setTimeout(() => {
      const $buttons = $table.querySelectorAll('thead th button')
      let saved = null
      try { saved = JSON.parse(window.sessionStorage.getItem(key)) } catch (e) {}

      // Put the saved sort back: press the column's button until it matches (2 presses at most)
      if (saved && $buttons[saved.column]) {
        for (let i = 0; i < 2; i++) {
          if ($buttons[saved.column].parentElement.getAttribute('aria-sort') === saved.direction) break
          $buttons[saved.column].click()
        }
      }

      // Save the sort whenever someone presses a column button
      $buttons.forEach(($button, column) => {
        $button.addEventListener('click', () => {
          window.setTimeout(() => {
            const direction = $button.parentElement.getAttribute('aria-sort')
            try { window.sessionStorage.setItem(key, JSON.stringify({ column, direction })) } catch (e) {}
          }, 0)
        })
      })
    }, 0)
  })
}
