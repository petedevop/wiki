# Champion rules (d12)

When **Champion rules** are on, the floor runs **d12 roll-under** Twilight Sword maths. You are a **Champion** in service of **the Scourge** — eight stats, hearts, and roll-under on the die.

The phone and handbook stay the same places; labels and maths change. This page is the player cheat sheet. The app also exports code-synced detail under **Rules → Champion rolls** and **Combat house rules**.

## The die

Roll **d12**. **Lower is better** — you succeed when the final die result is **less than or equal to** the relevant ability score.

- **Bonuses help** by **subtracting** from the die (easier to roll low).
- **Penalties hurt** by **adding** to the die.
- Circumstance mods on one roll **cap at ±3** after advantage is resolved.
- **Natural 1** = critical success (attacks can crit for champions only).
- **Natural 12** = critical failure (setback — fumbles, broken gear, and similar).

**Advantage:** roll **2d12, keep the lower**. **Disadvantage:** **2d12, keep the higher**. They cancel to a single level — never stack extra dice beyond one adv/dis pair.

## The eight stats

| Code | Name | Replaces (legacy) |
|------|------|-------------------|
| STR | Strength | STR |
| AGL | Agility | DEX |
| VIT | Vitality | CON |
| PER | Perception | (new) |
| WIL | Will | WIS |
| KNO | Knowledge | INT |
| CHA | Charisma | CHA |
| STE | Stealth | (new) |

On the Me shelf you see all eight when Champion rules are on; legacy nights still show the old five-stat strip.

## Hearts, stamina, armour

- **Hearts** replace hit points: **max hearts = 10 + VIT** (plus permanent heartstones).
- Incoming damage subtracts **armour rating** first, then hearts.
- At **0 hearts** you make a **WIL** roll-under on your turn — success **hangs on** and keep acting at 0; fail = **K.O.** Drop far below 0 and auto K.O. checks apply in the app.
- **Stamina** starts at **3** (default cap **3** unless stones say otherwise). Spend **1** to: take advantage on a roll, activate a feat, recast an expended spell, or burn a scroll without a check.
- **Boon** (rare): one champion per evening may hold a boon — spend for a forced crit success, a dramatic save, or full stamina recovery (see Me tab when live).

## Words at the table

- **Champions** — player characters.
- **The Scourge** — the floor’s big evil; lore may call foes heartless.
- **Hearts** — your wound track (shown as ♥ on the phone when rules are on).

## Combat flow

**Initiative:** d12 roll-under — **lowest goes first**. Ambush gives advantage; being ambushed gives disadvantage on that roll.

**Your attack:** melee uses **STR** (or **AGL** on finesse weapons); ranged uses **PER**. No target number — beat your own stat on the d12. On a hit, roll weapon damage; **nat 1** on the attack roll can **double damage** (champions only — monsters never crit).

**Monster attacks:** hostiles usually skip an attack roll — they declare a target and roll **damage only**. After you see that damage, you may use your **one reaction this round**:

- **Dodge** — **AGL** roll-under; success means no hearts lost.
- **Parry** — **STR** roll-under with a **melee weapon or shield** in hand; no parrying ranged shots unless you have a shield.

The phone shows a dodge/parry banner when that window is open.

**Ranges:** Close · Near · Far (and **too far** when you are out of the fight but can still support). Ranged attacks suffer disadvantage at **close**. Leaving melee may need an **AGL** disengage check.

**Actions:** one main action per turn plus free swaps in your **equipped pool** (three slots — heavy weapons use two). Fetching from the backpack costs your turn.

## Rest

**Solo rest** in a safe room still costs rations and downtime, but recovery under Champion rules heals **d12 hearts**, restores **+1 stamina**, and offers a **pick-one** bonus (extra hearts, extra stamina, clear a status, or recharge a spell). Party camp uses the same champion rest pass when the flag is on.

_Edit this file, then run `uv run python -m dnd wiki export` to refresh the public site._
