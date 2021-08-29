# Vue Formily Contributing Guide

Hi! I'm really excited that you are interested in contributing to Vue Formily. Before submitting your contribution, please make sure to take a moment and read through the following guidelines:

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Development Setup](#development-setup)

## Pull Request Guidelines

- Checkout a topic branch from the relevant branch, e.g. `dev`, and merge back against that branch.

- Make sure `npm test` passes. (see [development setup](#development-setup))

- If adding a new feature:
  - Add accompanying test case.
  - Provide a convincing reason to add this feature. Ideally, you should open a suggestion issue first and have it approved before working on it.

- If fixing bug:
  - If you are resolving a special issue, add `(fix #xxxx[,#xxxx])` (#xxxx is the issue id) in your PR title for a better release log, e.g. `update form field (fix #3899)`.
  - Provide a detailed description of the bug in the PR. Live demo preferred.

## Development Setup

After cloning the repo, run:

``` bash
$ npm install
```

### Committing Changes

Commit messages should follow the [commitlint](https://github.com/conventional-changelog/commitlint). Commit messages will be automatically validated upon commit. If you are not familiar with the commit message convention, you can use `npm run commit` instead of `git commit`, which provides an interactive CLI for generating proper commit messages.

### Commonly used NPM scripts

``` bash
# build all dist files
$ npm run build

# run the full test suite
$ npm test
```

There are some other scripts available in the `scripts` section of the `package.json` file.
