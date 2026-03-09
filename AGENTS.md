## Cursor Cloud specific instructions

This is a Mintlify documentation site (no `package.json`, no build system, no test framework). The only tooling is the `mintlify` CLI installed globally via npm.

### Running the dev server

```bash
mintlify dev
```

Starts on http://localhost:3000 with live-reload. See `README.md` for full contributing guidelines.

### Lint / test / build

There are no lint, test, or build commands in this repo. Validation is done visually via the local preview server. Mintlify handles rendering and deployment externally.

### Gotchas

- The first page load after `mintlify dev` starts may briefly show an error; a browser reload resolves it.
- The CLI fetches remote assets on startup, so an internet connection is required.
