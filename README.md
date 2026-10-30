# Batteries EPR beta prototype

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
| Homepage | `app/views/index.html`: one section per area (Regulators, Compliance schemes, Treatment operators, Producers), each with its latest work |
| Area pages | `app/views/regulators.html` and so on: Latest work, newest first, then Previous versions. When work changes, update it there and the area's latest work on the homepage |
| What's changed (change log) | `app/views/includes/changes.njk`: add each design change to the top. Shown at `/changes` |
| Layout for the homepage, area pages and What's changed (adds the menu) | `app/views/layouts/areas.html` |
| Layout for regulator (internal) pages | `app/views/layouts/regulator.html` |
| Service name | `app/config.json` |

## Changing the words (for content designers)

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

Everything here that isn't part of the standard kit. If it isn't listed
here, it shouldn't be in this repo.

| Add-on | What it does | Where it lives | Added by | How to remove it |
|---|---|---|---|---|
| Words-only content files | Keeps each page's words in a simple file the content designer can edit without touching HTML. Pages get the words with `content("folder/page")`. Links in paragraphs: `[link text](address)` | `app/lib/content.js`, `app/content/`, one line in `app/filters.js` | Marie Moyles, October 2026 | Delete those, and type the words back into the pages that use them |
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
