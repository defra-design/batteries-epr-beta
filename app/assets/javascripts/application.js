//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/adding-css-javascript-and-images/
//

window.GOVUKPrototypeKit.documentReady(() => {
  rememberTableSort()
  suggestMembers()
  saveTicks()
  keepScrollPanesTidy()
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

//
// Add-on: accessible autocomplete (GOV.UK). Version 4 member figures list
// (17 November 2026, EB-366).
//
// Why: schemes have up to 281 members. Suggesting members as you type finds
// one quickly, without scrolling a long list.
//
// How: a text input with data-app-suggestions (a list of "Name (BPRN)") is
// swapped for an accessible autocomplete with the same id, name and value, so
// its label and the form still work. Picking a suggestion fills the box, and
// Search filters the list to that member (the matching happens in app/routes/v4.js).
// The letters typed are in bold in each suggestion.
// Picking doesn't change the page by itself (WCAG 3.2.2). Return searches, as in
// any search box, unless a suggestion is highlighted (then it picks it, and
// Return again searches). Without JavaScript nothing
// changes: it's a normal search box.
//
// The package is accessible-autocomplete, loaded through app/plugin-proxy.json,
// with its styles imported in application.scss.
//
// To remove this add-on: delete this function and the line that calls it,
// app/plugin-proxy.json, the import in application.scss and the
// data-app-suggestions attribute, then npm uninstall accessible-autocomplete.
//
function suggestMembers () {
  const $input = document.querySelector('input[data-app-suggestions]')
  if (!$input || typeof window.accessibleAutocomplete !== 'function') return

  let names = []
  try { names = JSON.parse($input.getAttribute('data-app-suggestions')) } catch (e) { return }

  // What's been typed, so each suggestion can show it in bold
  let typed = ''

  const $container = document.createElement('div')
  $input.parentNode.insertBefore($container, $input)
  $input.parentNode.removeChild($input)

  window.accessibleAutocomplete({
    element: $container,
    id: $input.id,
    name: $input.name,
    defaultValue: $input.value,
    minLength: 2,
    showNoOptionsFound: false,
    // The suggestions sit over the page, so the buttons next to the box don't move
    displayMenu: 'overlay',
    // Members whose name or registration number has what's typed in it, up to 10
    source: (query, populate) => {
      typed = query
      const term = query.toLowerCase()
      populate(names.filter(name => name.toLowerCase().includes(term)).slice(0, 10))
    },
    // The component's own way to change how suggestions look (its "templates"
    // option): the letters typed are in bold, so you can see why each one matched
    templates: {
      inputValue: (name) => name || '',
      suggestion: (name) => boldTyped(name, typed)
    }
  })

  // Return searches, as in any search box (Marie, 17 November). The component
  // keeps Return for picking a suggestion, so while suggestions are showing it
  // would do nothing. When no suggestion is highlighted, search with what's
  // typed. Listens first (capture), before the component's own handler
  $container.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return
    if ($container.querySelector('.autocomplete__option--focused')) return
    const $form = $container.closest('form')
    if (!$form) return
    event.preventDefault()
    if ($form.requestSubmit) $form.requestSubmit()
    else $form.submit()
  }, true)
}

// "Northpower Batteries Ltd" with "north" typed > "<strong>North</strong>power Batteries Ltd".
// Everything is escaped first, so a name can't become code
function boldTyped (name, typed) {
  const escape = (text) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  if (!name) return ''
  const start = typed ? name.toLowerCase().indexOf(typed.toLowerCase()) : -1
  if (start === -1) return escape(name)
  const end = start + typed.length
  return escape(name.slice(0, start)) + '<strong>' + escape(name.slice(start, end)) + '</strong>' + escape(name.slice(end))
}

//
// Add-on: save ticks as you go. Version 4, Flags and Members (18 November
// 2026, EB-367).
//
// Why: you tick members on Flags, move to Members with the sub navigation
// and tick more, then Make a decision. The sub navigation is a link, so
// without this the ticks on Flags were lost (Marie, 18 November).
//
// How: a form with data-app-save-ticks="<address>" sends its ticks to that
// address each time one changes, including Select all (which ticks the boxes
// without a change event, so clicks are listened to as well). The page doesn't
// change. The route keeps them (app/routes/v4-decision.js, /decision/save),
// and the pages show them ticked when you come back.
// Without JavaScript: ticks are saved when you press Make a decision.
//
// To remove this add-on: delete this function, the line that calls it and
// the data-app-save-ticks attributes, and the /decision/save route.
//
function saveTicks () {
  document.querySelectorAll('form[data-app-save-ticks]').forEach(($form) => {
    const address = $form.getAttribute('data-app-save-ticks')
    let timer = null
    const save = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const body = new URLSearchParams()
        $form.querySelectorAll('input[name="shown"]').forEach(($i) => body.append('shown', $i.value))
        $form.querySelectorAll('input[name="members"]:checked').forEach(($i) => body.append('members', $i.value))
        // Version 5: any other field marked data-app-save-field (a member's
        // registration number and the comment on their page) goes too
        $form.querySelectorAll('[data-app-save-field]').forEach(($i) => body.append($i.name, $i.value))
        window.fetch(address, { method: 'POST', body, credentials: 'same-origin' }).catch(() => {})
      }, 150)
    }
    // Typing in a saved field saves it too (version 5's comment)
    $form.addEventListener('input', (event) => {
      if (event.target.matches('[data-app-save-field]')) save()
    })
    // Pressing Make a decision sends the ticks itself: don't send them twice
    $form.addEventListener('submit', () => window.clearTimeout(timer))
    $form.addEventListener('change', save)
    $form.addEventListener('click', (event) => {
      if (event.target.matches('input[type="checkbox"]')) save()
    })
  })
}

//
// Add-on: scrolling panes are only a tab stop when they scroll (24 November 2026).
//
// Why: the MOJ scrollable pane has tabindex="0" so keyboard users can reach it
// and scroll it with the arrow keys (WCAG 2.1.1). But when the table fits,
// there's nothing to scroll, so it's a pointless extra tab stop.
//
// How: when the table fits, the pane gets tabindex="-1" (out of the tab order,
// but still styled as a pane). When it doesn't fit, it gets tabindex="0" again.
// Checked when the page loads and when the window changes size or zoom.
// Without JavaScript nothing changes: every pane stays a tab stop, which is safe.
//
// To remove this add-on: delete this function and the line that calls it.
//
function keepScrollPanesTidy () {
  const $panes = document.querySelectorAll('.moj-scrollable-pane[role="region"][tabindex]')
  if (!$panes.length) return

  const check = () => {
    $panes.forEach(($pane) => {
      const scrolls = $pane.scrollWidth > $pane.clientWidth + 1
      $pane.setAttribute('tabindex', scrolls ? '0' : '-1')
    })
  }

  check()
  let timer
  window.addEventListener('resize', () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(check, 100)
  })
}
