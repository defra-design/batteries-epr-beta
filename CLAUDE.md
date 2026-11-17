# Rules for Claude in this prototype

This is the Batteries EPR beta prototype: the GOV.UK Prototype Kit (version 14)
with as few changes as possible. Marie (interaction designer) builds the
pages, and reads every change in Cursor. Anyone should be able to open this
code and change it by hand, without help. Read the README first.

These rules come from the "Clean code with AI" tab of Marie's Prototyping doc.
The README has the same rules for people.

## The test for every change

Could a designer have built this by copying components from the GOV.UK
Design System website and following the Prototype Kit's tutorials? If not,
it's too clever. Keep it vanilla.

## Rules

- **One page, one file, easy to find.** The web address should tell you the
  file. When a route renders a page, say in a comment which address shows
  which file.
- **Only GOV.UK Design System components**, set up the way the Design System
  website shows them. Anything else needs a written reason, and goes in the
  README's Add-ons section.
- **No custom CSS or JavaScript by default.** If JavaScript is needed, the page
  must still work without it.
- **Logic in one place.** Branching lives in `app/routes.js` (version 4 and
  later: their own file in `app/routes/`), one short route per page, with a
  plain-English comment saying why.
- **Dummy data in `app/data/`, as plain numbers and names.** No clever
  generators (no hashing, no random numbers). The data gives numbers; the
  pages turn them into words from the words files.
- **Words live in the words files** (`app/content/`), one per page. Use Jen's
  words (content design) exactly. Don't write or reword content without
  saying so. In a new version, new words are drafts for Jen to review.
- **Repetition is fine.** A little repeated code beats a clever shortcut. Only
  make something reusable when it's on three or more pages.
- **Every table goes in a scrollable pane and uses small text.** Wrap it in
  `<div class="moj-scrollable-pane" role="region" tabindex="0" aria-label="...">`
  so on a phone only the table scrolls, and give every cell and heading
  `govuk-!-font-size-16` (set as `small` at the top of the page). Up to 6
  columns.
- **Dates in tables have a short month**: 10 Nov 2026. Everywhere else, the
  full month: 10 November 2026.
- **No new packages without asking Marie first.**
- **Versions in folders.** Never change a version that's been tested. A new
  version copies the last one into new folders (see the README, "Versions").
  Never change the address of a page in refinement.
- **Comments explain why, not what.** Short, plain English, with who decided
  and when if it came from a session.
- **Keep the README up to date**: where things are, versions and add-ons.

## Before you finish a change

1. Can Marie find the page from its web address?
2. Is every component from the Design System?
3. Has it added any CSS, JavaScript or packages? If so, is it in Add-ons?
4. Has it created files nobody asked for?
5. Has it changed any of Jen's words?
6. Does every page still work without JavaScript?

Then explain the change in plain English. If it can't be explained simply,
it's too complicated.

## Working with Marie

- Plain English, short. Step by step for git, GitHub Desktop, Terminal and
  the kit.
- She commits and pushes in GitHub Desktop herself.
- Interaction design changes get a record in "What's changed"
  (`app/data/changes/`, then `npm run changes`). Content changes don't.
