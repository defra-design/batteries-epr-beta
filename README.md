# Batteries EPR beta prototypes

The private beta prototype for Defra's Batteries EPR service. It's the
[GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk/) (version 14)
with as few changes as possible, so anyone who knows the kit can pick it up.

## Run it

You need Node.js 24.

```
npm install
npm run dev
```

Then open http://localhost:3000.

## Where things are

| What | Where |
|---|---|
| Pages | `app/views/` (the web address matches the file: `/regulator/indicative-obligation/option-a-table` is `app/views/regulator/indicative-obligation/option-a-table.html`) |
| Words and dummy figures for each page | `app/content/` (see "Add-ons") |
| Answers a journey remembers | the kit's session data (`app/data/session-data-defaults.js` for starting values) |
| Branching between pages | `app/routes.js` |
| Homepage | `app/views/index.html`: one section per area (Regulators, Compliance schemes, Treatment operators, Producers), each with a link to its page |
| Area pages | `app/views/regulators.html` and so on: one sortable table of all the area's work, newest first. To add work, add it to the top of the list in the page |
| Patterns | `app/views/patterns.html`: patterns, components and experiments we're trying out, and a link to the regulator toolkit prototype, which we align with for regulator pages |
| What's changed (change log) | One record per interaction design change in `app/data/changes/`, screenshots in `app/assets/images/changes/`. Run `npm run changes` to build the pages in `app/views/changes/` (don't edit those by hand). Shown at `/changes`. Content changes aren't recorded: they're in GitHub's history for `app/content/` |
| Layout for the homepage, area pages, Patterns and What's changed (adds the menu: the service name, Patterns, What's changed) | `app/views/layouts/areas.html` |
| Layout for regulator (internal) pages | `app/views/layouts/regulator.html` |
| Service name | `app/config.json` |

## Updating the content

You change the words on the GitHub website. There's nothing to install.

1. Sign in to [GitHub](https://github.com) with your Defra GitHub account
2. Open the prototype, go to the page you want to change, scroll to the footer and select **Content update**. Or find the file yourself in `app/content/`
3. Change the words under the labels. Don't change the labels themselves (the lines starting `##`)
4. To add a paragraph, leave a blank line and type it, under a label that says "paragraphs welcome"
5. To add a link, type `[link text](address)` inside a paragraph. Addresses starting `https://` open in a new tab. Don't type "(opens in new tab)" yourself: it's added to the link text automatically. Addresses starting `/` stay in the prototype
6. Select **Commit changes...**, write a short note of what you changed, leave "Commit directly to the main branch" selected, and select **Commit changes**
7. The live prototype updates in about 5 minutes. Refresh to see it

If something looks wrong, edit it again, or ask Marie. Every change is saved in GitHub's history, so anything can be undone. New headings, lists, tables and other components: ask Marie. Please don't use bold or italics.

## How we work

- Pages use GOV.UK Design System components, set up the way the Design
  System website shows them.
- Every page works without JavaScript and is accessible by default.
- The interaction designer builds the pages. The content designer edits the
  words in `app/content/`, not in the pages.

## Add-ons

Everything here that isn't part of the standard kit or the GOV.UK Design
System. If it isn't listed here, it shouldn't be in this repo.

Every file that uses an add-on says so in a comment starting `Add-on:`.
Search the repo for `Add-on:` to find them all. Designers can see them
working on the Patterns page (`/patterns`).

| Add-on | What it does | Where it lives | Added by | How to remove it |
|---|---|---|---|---|
| Words-only content files | Keeps each page's words in a simple file the content designer can edit without touching HTML. Pages get the words with `content("folder/page")`. Links in paragraphs: `[link text](address)` | `app/lib/content.js`, `app/content/`, one line in `app/filters.js` | Marie Moyles, October 2026 | Delete those, and type the words back into the pages that use them |
| MOJ Frontend | Components from the MOJ Design System that the GOV.UK Design System doesn't have. We use the [sortable table](https://design-patterns.service.justice.gov.uk/components/sortable-table/) (`data-module="moj-sortable-table"`). Without JavaScript it's a normal GOV.UK table. It sorts in the browser, so it only sorts the rows on the page: don't use it with pagination | `@ministryofjustice/frontend` in `package.json` (a Prototype Kit plugin, so its styles and scripts load automatically). Used in `app/views/regulators.html` | Marie Moyles, November 2026 | Remove the table's `data-module` and `aria-sort` attributes, then `npm uninstall @ministryofjustice/frontend` |
| Record a change | A change log the business analyst and developers can read without the code: one record per interaction design change, with what changed and why, the pages it touched, and before and after screenshots. Same format as the regulator toolkit's, so records can move across. Changes to the prototype itself (menus, list pages, add-ons) and content changes aren't recorded. Screenshots: two pairs per page, desktop (1020 pixels wide, where GOV.UK pages stop getting wider) and 320 pixels wide (the WCAG reflow width, which is also 1280 pixels at 400% zoom), each from the top of the page to the end of the content | `scripts/build-changes.js` (and `npm run changes` in `package.json`), `app/data/changes/`, `app/assets/images/changes/`, `app/views/changes/`, the `app-change-screenshot` style in `app/assets/sass/application.scss` | Alex Colbeck (record-a-change); added by Marie Moyles, November 2026 | Delete those, and the What's changed link in `app/views/layouts/areas.html` |
| Filters in a row | Puts filter dropdowns and their button side by side with a fixed gap, wrapping onto a new line when there isn't room, so they never squash into each other (a GOV.UK select won't go narrower than 11.5em). Full width, one under the other, on a phone | The `app-filters` style in `app/assets/sass/application.scss`. Used on the placed on the market submissions pages | Marie Moyles, November 2026 | Remove the `app-filters` wrapper and the style: the dropdowns and button then stack, one under the other |
| Wrapping names in a scrollable table | Lets one column (scheme names) wrap inside the MOJ scrollable pane, which otherwise stops every cell wrapping. Without it, a long scheme name made the table wider than a 1020px desktop, so it scrolled sideways on a normal screen. **Developers: build this, it's a design decision** | The `app-table-cell--wrap` style in `app/assets/sass/application.scss`, on the Scheme column of the placed on the market submissions pages | Marie Moyles, November 2026 | Remove the class from those cells and the style |
| MOJ scrollable pane | Lets a wide table scroll sideways on its own at small widths and 400% zoom, so the page still reflows (WCAG 1.4.10). The regulator toolkit wraps its sortable tables in it too. It's an exact copy of the MOJ component from MOJ Frontend 12, because MOJ Frontend 10 doesn't have it, plus one fix so visually hidden text in a table can't make the page scroll | `app/assets/sass/vendor/_moj-scrollable-pane.scss`, two rules in `app/assets/sass/application.scss`. Used on the placed on the market submissions pages (`moj-scrollable-pane`, with `role`, `tabindex` and `aria-label`) | Marie Moyles, November 2026 | Delete the copy and the fix, and use the real one when we can upgrade MOJ Frontend |
| Defra internal branding | The Defra header, green service navigation, footer and Arial typeface for regulator (internal) pages, which can't use GOV.UK branding. Copied from Alex Colbeck's regulator prototype, so this work can move into Defra's shared regulator tooling. Two changes: two colour functions swapped for GOV.UK Frontend 6 (see the top of the Sass file), and footer links can take `attributes`, so the prototype-only "Content update" link opens in a new tab | `app/views/layouts/regulator.html`, `app/views/macros/defra-internal/`, `app/assets/sass/_defra-internal.scss`, `app/assets/sass/settings.scss`, two lines at the top of `app/assets/sass/application.scss` | Alex Colbeck; added by Marie Moyles, October 2026 | Delete those, and change regulator pages to extend `layouts/main.html` |

### Words-only content files

Each page's words are in `app/content/<folder>/<page>.md`, as labels
(lines starting `##`) with the words underneath:

```
## Heading
Indicative obligation for 2027
```

In a page:

```
{% set words = content("regulator/indicative-obligation") %}
<h1 class="govuk-heading-l">{{ words.heading }}</h1>
```

A label becomes a short name: "Collection target" is `words.collectionTarget`.
Changes show when you refresh the page. If a page asks for a label the file
doesn't have, it shows `[missing: ...]` instead.

The dummy figures on a page go in its content file too, so the content
designer sees and can change everything on the page in one place. They're
only for the prototype: developers use the real data.
