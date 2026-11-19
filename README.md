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
| Branching between pages | `app/routes.js`. Versions 4 and 5 have their own files in `app/routes/` (for example `v5.js` and `v5-decision.js`), called from `app/routes.js` |
| Dummy data | `app/data/`: the submissions (`pom-submissions.js`), one submission and its scheme (`pom-submission-details.js`), and members' figures (`member-figures.js`) |
| Homepage | `app/views/index.html`: one section per area (Regulators, Compliance schemes, Treatment operators, Producers), each with a link to its page |
| Area pages | `app/views/regulators.html` and so on: one sortable table of all the area's work, newest first. To add work, add it to the top of the list in the page |
| Patterns | `app/views/patterns.html`: patterns, components and experiments we're trying out, and a link to the regulator toolkit prototype, which we align with for regulator pages |
| What's changed (change log) | One record per interaction design change in `app/data/changes/`, screenshots in `app/assets/images/changes/`. Run `npm run changes` to build the pages in `app/views/changes/` (don't edit those by hand). Shown at `/changes`. Content changes aren't recorded: they're in GitHub's history for `app/content/` |
| Layout for the homepage, area pages, Patterns and What's changed (adds the menu: the service name, Patterns, What's changed) | `app/views/layouts/areas.html` |
| Layout for regulator (internal) pages | `app/views/layouts/regulator.html` |
| Beta banner and Welsh language navigation (every regulator page) | `app/views/layouts/regulator.html`, words in `app/content/regulator/header.md`. Both are standard GOV.UK components, not add-ons: the [phase banner](https://design-system.service.gov.uk/components/phase-banner/) and [language navigation](https://design-system.service.gov.uk/components/language-navigation/) (GOV.UK Frontend 6.5 or later). The language navigation sits below the phase banner, right aligned, in the same place as the regulator toolkit prototype. For now, Cymraeg adds `?lang=cy` to the address (as the live regulator service does) and flips which language is current, but the words stay in English. The feedback link goes to a "not built yet" page. The language is set in `app/routes.js` |
| Service name | `app/config.json` |

## Versions

Each version of a journey keeps its own pages, so a version that's been
tested is never changed. The Regulators page (`/regulators`) lists every
version, with its date, status and Jira ticket.

| Version | What | Pages | Words | Addresses start |
|---|---|---|---|---|
| 3 | The placed on the market submissions journey, as played back on 16 November 2026 (EB-324 to EB-326) | `app/views/regulator/pom-submissions/` and `app/views/regulator/pom-submission/` | `app/content/regulator/` | `/regulator/pom-submissions/latest-quarter`, `/regulator/pom-submissions/brief/` |
| 3B | An alternative to version 3: every quarter on one list, and a fuller submission page. Was called "full" (version 3 was "brief") | the same folders as version 3 (`all-submissions.html`, `full.html`) | `app/content/regulator/` (the `-full` files) | `/regulator/pom-submissions/all-submissions`, `/regulator/pom-submissions/full/` |
| 4 | EB-366 and EB-367: checking a member's figures, and the journey to them. A copy of version 3, with one link per row on the list, the flags first on the submission, and two new pages: member figures (every member, with their biggest change by chemistry) and one member (their details, flags and figures by chemistry) | `app/views/regulator/v4/` | `app/content/regulator/v4/` | `/regulator/pom-submissions/v4` |
| 5 | The version to use now (EB-366 and EB-367). A copy of version 4 with a simpler way to query members: regulators pick a member to query only on that member's own page, check them on "Members you're querying", then make the decision. Flags and Members are just for looking | `app/views/regulator/v5/` | `app/content/regulator/v5/` | `/regulator/pom-submissions/v5` |

To start a new version: copy the last version's pages and words into new
`v6` folders, give it its own routes files (`app/routes/v6.js` and
`app/routes/v6-decision.js`, called from `app/routes.js`), and add it to the top of the list on the Regulators page.
Version 3 and 3B keep their old addresses (with "brief" and "full" in them),
as people already have links to them.

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
- Working with Claude: the rules for it are in `CLAUDE.md`, and they're the
  same as these. Keep it vanilla: if a designer couldn't have built it by
  copying from the Design System, it's too clever.

## Add-ons

Everything here that isn't part of the standard kit or the GOV.UK Design
System. If it isn't listed here, it shouldn't be in this repo.

Every file that uses an add-on says so in a comment starting `Add-on:`.
Search the repo for `Add-on:` to find them all. Designers can see them
working on the Patterns page (`/patterns`).

They're in two groups: the ones that are part of the design, which
developers should build, and the ones that only make the prototype work.

### Part of the design: developers, build these

#### Defra internal branding

- **What it does:** the Defra header, green service navigation, footer and Arial typeface for regulator (internal) pages, which can't use GOV.UK branding
- **Why:** copied from Alex Colbeck's regulator prototype, so this work can move into Defra's shared regulator tooling. Two changes: two colour functions swapped for GOV.UK Frontend 6 (see the top of the Sass file), and footer links can take `attributes`, so the prototype-only "Content update" link opens in a new tab
- **Where:** `app/views/layouts/regulator.html`, `app/views/macros/defra-internal/`, `app/assets/sass/_defra-internal.scss`, `app/assets/sass/settings.scss`, two lines at the top of `app/assets/sass/application.scss`
- **Added by:** Alex Colbeck; added by Marie Moyles, October 2026
- **To remove:** delete those, and change regulator pages to extend `layouts/main.html`

#### Accessible autocomplete (GOV.UK)

- **What it does:** the search on the version 4 member figures list suggests members as you type, by name or registration number. Picking one fills the box, and Search shows just that member. Without JavaScript it's a normal search box
- **Why:** schemes have up to 281 members, so this finds one quickly without scrolling a long list (EB-366)
- **Where:** `accessible-autocomplete` in `package.json`, loaded through `app/plugin-proxy.json` (it isn't a Prototype Kit plugin by itself), its styles imported in `app/assets/sass/application.scss`, and `suggestMembers` in `app/assets/javascripts/application.js`. Used on `app/views/regulator/v4/member-figures.html` (`data-app-suggestions`)
- **Added by:** Marie Moyles, 17 November 2026
- **To remove:** delete those, then `npm uninstall accessible-autocomplete`

#### MOJ Frontend (sortable table)

- **What it does:** components from the MOJ Design System that the GOV.UK Design System doesn't have. We use the [sortable table](https://design-patterns.service.justice.gov.uk/components/sortable-table/) (`data-module="moj-sortable-table"`). Without JavaScript it's a normal GOV.UK table
- **Watch out:** it sorts in the browser, so it only sorts the rows on the page. Don't use it with pagination
- **Where:** `@ministryofjustice/frontend` in `package.json` (a Prototype Kit plugin, so its styles and scripts load automatically). Used on the placed on the market submissions page (full version, all submissions), the members pages and on `app/views/regulators.html` (the list of prototypes, prototype only)
- **Added by:** Marie Moyles, November 2026
- **To remove:** remove the table's `data-module` and `aria-sort` attributes, then `npm uninstall @ministryofjustice/frontend`

#### MOJ scrollable pane

- **What it does:** lets a wide table scroll sideways on its own at small widths and 400% zoom, so the page still reflows (WCAG 1.4.10). The regulator toolkit wraps its sortable tables in it too
- **Why it's a copy:** it's an exact copy of the MOJ component from MOJ Frontend 12, because MOJ Frontend 10 (the newest that works with this kit) doesn't have it. Plus two fixes, so visually hidden text in a table can't make the page scroll sideways, or make the pane scroll up and down by a pixel and catch the mouse wheel (the sortable table's "sorted by" message did this)
- **Where:** `app/assets/sass/vendor/_moj-scrollable-pane.scss`, and the fixes in `app/assets/sass/application.scss`. Used on the placed on the market submissions pages, the files tables on the submission pages, the people tables on organisation details, and the Regulators list (`moj-scrollable-pane`, with `role`, `tabindex` and `aria-label`)
- **Added by:** Marie Moyles, November 2026
- **To remove:** delete the copy and the fix, and use the real one when we can upgrade MOJ Frontend

#### Wrapping names in a scrollable table

- **What it does:** lets one column (scheme names) wrap inside the MOJ scrollable pane, which otherwise stops every cell wrapping
- **Why:** without it, a long scheme name made the table wider than a 1020px desktop, so it scrolled sideways on a normal screen. Web standards and fitting a desktop come first
- **Where:** the `app-table-cell--wrap` style in `app/assets/sass/application.scss`, on the Scheme column of the placed on the market submissions pages, the File name column on the full submission page, and the Page column of the Regulators list
- **Added by:** Marie Moyles, November 2026
- **To remove:** remove the class from those cells and the style

#### Filters in a row

- **What it does:** puts filter dropdowns and their button side by side with a fixed 10px gap, wrapping onto a new line when there isn't room. The button lines up with the bottom of the dropdowns. Full width, one under the other, on a phone. A free-text field can grow to fill its line (`app-filters__grow`), and two buttons (Apply and Clear filters) stay together in a GOV.UK button group
- **Why:** a GOV.UK select won't go narrower than 11.5em, so in grid columns they squashed into each other at some widths
- **Where:** the `app-filters` style in `app/assets/sass/application.scss`. Used on the placed on the market submissions pages and the members page (full version)
- **Added by:** Marie Moyles, November 2026
- **To remove:** remove the `app-filters` wrapper and the style: the dropdowns and button then stack, one under the other

### Prototype only: developers, don't build these

#### Words-only content files

- **What it does:** keeps each page's words in a simple file the content designer can edit without touching HTML. Pages get the words with `content("folder/page")`. Links in paragraphs: `[link text](address)`
- **Where:** `app/lib/content.js`, `app/content/`, one line in `app/filters.js`
- **Added by:** Marie Moyles, October 2026
- **To remove:** delete those, and type the words back into the pages that use them

#### Record a change (What's changed)

- **What it does:** a change log the business analyst and developers can read without the code: one record per interaction design change, with what changed and why, the pages it touched, and screenshots. Before and after only when there was a before. Same format as the regulator toolkit's, so records can move across
- **Links:** in a record's "why", type `[link text](https://...)`. It opens in a new tab, and "(opens in new tab)" is added for you
- **Not recorded:** changes to the prototype itself (menus, list pages, add-ons) and content changes
- **Screenshots:** desktop (1020 pixels wide, where GOV.UK pages stop getting wider) and 320 pixels wide (the WCAG reflow width, which is also 1280 pixels at 400% zoom), each from the top of the page to the end of the content
- **Where:** `scripts/build-changes.js` (run it with `npm run changes`), `app/data/changes/`, `app/assets/images/changes/`, `app/views/changes/`, the `app-change-screenshot` style in `app/assets/sass/application.scss`
- **Added by:** Alex Colbeck (record-a-change); added by Marie Moyles, November 2026
- **To remove:** delete those, and the What's changed link in `app/views/layouts/areas.html`

### More about the words-only content files

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
