# Running the table (DM)

The **DM UI** is the browser on the Mac at **port 8766** — loopback only. Players use **8767** on their phones. Voice chat is for talk; every game action happens in one of those two sites.

This page is a short cheat sheet for tonight’s tools. Full DM UI architecture lives in the private app repo (`docs/DM_UI.md`).

## Who is online

Connected champions get a **green dot** on their portrait in the party strip, on room PC cards, and on the combat initiative row. If the dot is missing, that player’s phone has not heartbeated in a while.

## PC sheet

Click a champion in the party strip or combat roster.

- **Statuses** paint on the **backdrop** behind the sheet (not inside the card). Each chip shows **what caused it** when the app knows.
- **Clear all statuses** sits on that backdrop row — one button clears every affliction on that PC.
- **HP** pills are sized to the digits; in **combat**, use the HP pad on party or lane rows for typed damage and healing.
- **Gear** uses the shared paper doll; **Spells / Active / Passive** are three columns.
- **Hostage** replaced the old backpack strip on the Me tab — at most **one** packed person or obstacle per champion (see the player guide).
- A champion **resting alone** on their phone shows **💤** on the sheet; **Wake now** ends sleep early (`pc_wake_rest`).

## Combat console

Turn order is a wide sidebar with per-row actions, a room drawer, **Next turn**, and optional auto-attack. Clicking an NPC portrait opens the NPC sheet again.

After a fight, the board paint returns to explore mode without leaving stale combat chrome.

## DM room (summoned room)

The free-look column’s summoned room gets the same treatment as a normal room: **+** to stage things, **room menu** for effects, and **move PCs** in and out. Re-stage offstage catalog pieces once per visit; never duplicate a node already on the board.

## Kitchen Stadium / cook-off

When a cook-show is running and PCs are in Kitchen Stadium:

- The **cook-off panel** shows phase, crew, shelves, locks, checks, and scores.
- **Start cook-off** (DM button) moves every active PC to Kitchen Stadium and begins the show on every client — same as the signpost **enter** on phones.

Players also get a **Kitchen Stadium** bottom tab for the duration; they can browse away and tap it to return.

## Party rest vs solo rest

**Party rest** still runs from the DM (**camp** intent) and heals everyone with the usual interruption d6.

Each champion may also **rest alone** from their phone in a safe room (two food units, then a timed sleep). You can **Wake now** from their sheet if the table needs them moving.

## Quick checks

| Situation | Where to look |
|-----------|----------------|
| Mystery gold on a deed | Deed now names a **source** slug in the log and on the phone |
| Corpse loot | App rolls **50% pocket change** or **50% Bronze Loot Box**, not both (regular monsters) |
| Optional late checks | Search/social DCs on “optional” spots are tuned to about **DC 12**, not unfair 17s |
| Bleacher Tunnel | Room **328** is **dark** until someone holds a real light (e.g. Pitch Torch) |

_For deep architecture and intent keys, ask Pete or open `docs/DM_UI.md` in the app checkout._
