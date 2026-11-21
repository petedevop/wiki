# House rules

This table runs **Twilight Sword** at the core, with Floor Three house conventions baked into the app. The published rulebook is not copied here — ask the DM or use the in-app **Library**.

**Champion rules (d12 roll-under):** when enabled on the campaign, player characters are **Champions**, foes serve **the Scourge**, and hearts/stamina/reactions replace the check_roll HP loop. Start with **[Champion rules (d12)](d12-champions)** — then the generated **Champion rolls**, **Combat house rules**, and **Phone combat** pages for numbers pulled from code.

**Auto-generated pages** (legacy check_roll rolls, party votes, effect tables, etc.) refresh on each `wiki export` — browse the Rules section in the handbook.

## Rolls at this table

**Legacy (flag off):**

- Stat and skill checks are usually a **flat check_roll** unless a status or armour too heavy for your STR imposes disadvantage.
- Weapon swings use a flat check_roll; a held weapon skill adds its rank to hit.
- Natural 1 on an attack: DC 12 DEX check or the weapon breaks. Guns, power tools and firebombs break outright.
- Spellcasting checks and saves stay flat check_roll.

**Champion rules (flag on):** d12 **roll-under** against ability scores; see **Champion rules (d12)**. Weapon feats and armour feats still unlock from play when the table uses them.

## The player app

- **Floor map** and **archive** only show what the party has already discovered in play.
- **Combat** on the phone is turn-gated; the server enforces what you can tap — greyed buttons are not a suggestion.
- **Travel** is per champion. Stepping into a room that would **start combat** asks for confirmation first. **Party votes** need a majority of champions present — **solo rest** is per champion, not a vote.
- **Info** uses a segment hub (Archive, Map, Library, …). **Kitchen Stadium** tab applies during cook-offs as in **Using the player app**.
- **Champion rules on:** header shows **hearts** and **stamina**; combat may offer **dodge/parry** after foe damage; **equipped pool** replaces quick slots. **Flag off:** HP chip and quick slots behave as before.
- House pages **Supplies & statuses** and **Phone combat** list ammo, debuff clocks, meat spoilage, corpse loot, and search-fail ambushes the server enforces.

## Floor Three flavour

- **Projects** are party-driven — see their Rules pages for payouts.

_Edit this file, then run `uv run python -m dnd wiki export` to refresh the public site._
