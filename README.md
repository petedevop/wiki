# Floor Two — player handbook

Public static site for crawlers, generated from the private
[`petedevop/dnd`](https://github.com/petedevop/dnd) app. Do not edit generated files here.

```sh
cd /Volumes/Ext/dnd && uv run python -m dnd wiki export   # writes ../wiki
cd /Volumes/Ext/wiki && git add -A && git commit -m "wiki: refresh" && git push
```

**Live sites (same export):**

- https://petedevop.github.io/wiki/ — GitHub Pages (legacy; see retirement below)
- https://dnd.pagerpete.com/wiki/ — Cloudflare Access (email PIN)

Cloudflare must redirect `/wiki` → `/wiki/` or relative assets break on deep links.

When the game Mac is offline, the edge sends players to `/wiki/?table=closed`. The exported
`table_closed.js` script remembers that in `sessionStorage`, polls `/healthz`, and returns them
to `/` when the table is live again (no manual refresh).

**Cloudflare Pages deploy:**

```sh
uv run python -m dnd wiki export --out dist/wiki
```

Deploy the `dist/wiki` folder (or point Pages at that output).

**Retire GitHub Pages:** change `WIKI_PUBLIC_BASE_URL` in `application/wiki/paths.py`, update
`og:` metas in `index.html`, then stop pushing this public repo.

- Template (HTML/CSS/JS, fonts, house rules): `docs/player-site/` in the app repo.
- One-line blurbs for rooms, people, items and obstacles are generated from
  player-safe text; override any in `docs/player-site/blurbs.yaml`
  (`python -m dnd wiki blurbs` writes a starter file).
