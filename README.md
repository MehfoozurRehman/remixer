# create-remixer

A command-line tool that scaffolds a React project from a starter template, renames it, and optionally installs dependencies and sets up git.

**Status:** Stub. The tool is two source files, `index.js` and `publish.js`, which is below the size of a finished tool. The CLI itself is complete enough to run, but there are no tests.

## The problem

Starting a new React project means repeating the same setup each time. This CLI copies a starter template into a new folder, renames it, and sets it up in one command.

## What it does

- Prompts for a project name, whether to install dependencies, and whether to initialize git (`inquirer`).
- Clones the starter template from the `remixer-web` repository into the new folder (`simple-git`).
- Replaces the `project_name` placeholder in the template files with the chosen name, including in nested data.
- Installs dependencies with npm, yarn or pnpm, and uses `--legacy-peer-deps` for npm.
- Runs `git init` in the new project when the user chooses it.

## How it's built

- A Node.js ES module with a `bin` entry, so it installs as the `create-remixer` command.
- The template is fetched from git at run time, so the starter can change without a new CLI release.
- The yarn and pnpm check reads `process.env.APPDATA`, which exists only on Windows.

## Running it locally

```bash
npm i -g create-remixer
create-remixer
```

To run the CLI from the repo, use `node index.js`. The one script in `package.json`, `new-version`, runs `publish.js`.

## What's left

- No tests are committed.
- The template URL is hard-coded in `index.js`.
- The global package-manager check depends on `APPDATA`, so it is Windows-only as written.
- The README's contributions section only asks for issues, and the README does not describe the template structure.
