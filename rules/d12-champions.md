# Champion rules (d12)

Aramilla Valley runs **Twilight Sword**: **d12 roll-under**. You are a **Champion** holding the line against **the Scourge** — eight stats, hearts, and roll-under on the die.

This page is the player cheat sheet. The app also exports code-synced detail under **Rules → Champion rolls** and **Combat house rules**.

## The die

Roll **d12**. **Lower is better** — you succeed when the final die result is **less than or equal to** the relevant ability score.

- **Bonuses help** by **subtracting** from the die (easier to roll low).
- **Penalties hurt** by **adding** to the die.
- Circumstance mods on one roll **cap at ±3** after advantage is resolved.
- **Natural 1** = critical success (attacks can crit for champions only).
- **Natural 12** = critical failure (setback — fumbles, broken gear, and similar).

**Advantage:** roll **2d12, keep the lower**. **Disadvantage:** **2d12, keep the higher**. They cancel to a single level — never stack extra dice beyond one adv/dis pair.

## The eight stats

| Code | Name | Typical uses |
|------|------|--------------|
| STR | Strength | Melee swings, parry, heavy work |
| AGL | Agility | Finesse melee, dodge, escape |
| VIT | Vitality | Max hearts, toughness |
| PER | Perception | Ranged attacks, noticing |
| WIL | Will | Hang on at 0 hearts, resolve |
| KNO | Knowledge | Lore and crafted know-how |
| CHA | Charisma | Talk, lead, sway |
| STE | Stealth | Sneaking at the table |

On the Me shelf you see all eight.

## Hearts, stamina, armour

- **Hearts** replace hit points: **max hearts = 10 + VIT** (plus permanent heartstones).
- Incoming damage subtracts **armour rating** first, then hearts.
- At **0 hearts** you make a **WIL** roll-under on your turn — success **hangs on** and keep acting at 0; fail = **K.O.** Drop far below 0 and auto K.O. checks apply in the app.
- **Stamina** starts at **3** (default cap **3** unless stones say otherwise). Spend **1** to: take advantage on a roll, activate a feat, recast an expended spell, or burn a scroll without a check.
- **Boon** (rare): one champion per evening may hold a boon — spend for a forced crit success, a dramatic save, or full stamina recovery (see Me tab when live).

## Words at the table

- **Champions** — player characters.
- **The Scourge** — the valley’s big evil; lore may call foes heartless.
- **Hearts** — your wound track (shown as ♥ on the phone).
- **Green Zin** — coin.

## Combat flow

**Initiative:** d12 roll-under — **lowest goes first**. Ambush gives advantage; being ambushed gives disadvantage on that roll.

**Your attack:** melee uses **STR** (or **AGL** on finesse weapons); ranged uses **PER**. No target number — beat your own stat on the d12. On a hit, roll weapon damage; **nat 1** on the attack roll can **double damage** (champions only — monsters never crit).

**Monster attacks:** hostiles usually skip an attack roll — they declare a target and roll **damage only**. After you see that damage, you may use your **one reaction this round**:

- **Dodge** — **AGL** roll-under; success means no hearts lost.
- **Parry** — **STR** roll-under with a **melee weapon or shield** in hand; shield also lets you parry ranged.

The phone shows a dodge/parry banner when that window is open.

**Ranges / lanes:** combat uses **frontline / backline**. Ranged attacks from the frontline take disadvantage. Leaving a fight on your own is **Escape** (AGL); the whole party leaving is a **retreat** vote.

**Monster rotations:** foes walk a short action list. After they act it advances; **red** steps cannot be parried, **blue** cannot be dodged; a number on the step means they need d12 ≤ that number to land. Crits can **jump** the list. Details: **Monster rotations**.

**Actions:** one main action per turn plus free swaps in your **equipped pool** (three slots — heavy weapons use two). Fetching from the backpack costs your turn.

## Rest

**Camp** upstairs at the Dancing Deer (Room Key → guest room): one camp action each, then sleep. Recovery heals **d12 hearts**, restores **+1 stamina**, and offers a **pick-one** bonus (extra hearts, extra stamina, clear a status, or recharge a spell). **Cook & brew** are free on the rest screen. See **Rest & camp**.

## Feats

No XP ladder. One feat at creation from your Way; another at party hope **4, 8, 12, …**. **Second way** once — a second class and one of its feats.

_Edit this file, then run `uv run python -m dnd wiki export` to refresh the public site._
