# Floor Two — player handbook

Public static site for crawlers, generated from the private
[`petedevop/dnd`](https://github.com/petedevop/dnd) app. Do not edit generated files here.

```sh
cd /Volumes/Ext/dnd && uv run python -m dnd wiki export   # writes ../wiki
cd /Volumes/Ext/wiki && git add -A && git commit -m "wiki: refresh" && git push
```

**Live site:** https://petedevop.github.io/wiki/

- Template (HTML/CSS/JS, fonts, house rules): `docs/player-site/` in the app repo.
- One-line blurbs for rooms, people, items and obstacles are generated from
  player-safe text; override any in `docs/player-site/blurbs.yaml`
  (`python -m dnd wiki blurbs` writes a starter file).
