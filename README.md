# Alárinà frontend

The app couples use, and the pages guests see: Vite, React and TypeScript. Setup, ports and deployment are in the [root README](../README.md). How it should look and read is in the [style guide](../docs/style-guide.md).

```bash
nvm use
yarn install
yarn dev     # http://localhost:5173
yarn lint
yarn build   # needs VITE_API_URL
```

| Folder | What's in it |
|---|---|
| `src/pages` | One component per route, plus their CSS |
| `src/invite` | The invitation card and guest pages, styled by `invite.css` |
| `src/studio` | Panels and canvas for the invitation editor at `/app/studio` |
| `src/setup` | Setup wizard steps and the live preview |
| `src/components` | Shared components (`Field`, `Select`, `DatePicker`, `Tour`, …) |
| `src/auth` | Sign-in state and route protection |
| `src/lib` | API client, formatting, types and hooks |

Tokens and shared classes live in `src/index.css`. To see every component in light and dark, run `yarn dev` and open `/styleguide` (development only).
