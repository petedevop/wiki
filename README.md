# Floor Two — player handbook

Public static site for crawlers. Content is generated from the private
[`petedevop/dnd`](https://github.com/petedevop/dnd) app:

```sh
cd /Volumes/Ext/dnd && uv run python -m dnd wiki export
cd /Volumes/Ext/wiki && git add -A && git commit -m "wiki: refresh" && git push
```

**Live site:** https://petedevop.github.io/wiki/

Edit house rules in `dnd/player-site/rules/`, then export again.
