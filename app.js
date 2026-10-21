const NAV_ITEMS = [
  { key: "party", label: "Party" },
  { key: "rules", label: "Rules" },
  { key: "map", label: "Map" },
  { key: "rooms", label: "Rooms" },
  { key: "people", label: "People" },
  { key: "items", label: "Gear" },
  { key: "bounties", label: "Bounties" },
  { key: "board", label: "Board" },
  { key: "wall", label: "Wall" },
  { key: "quests", label: "Quests" },
  { key: "rivals", label: "Rivals" },
  { key: "tonight", label: "Tonight" },
  { key: "cast", label: "Cast" },
  { key: "sponsors", label: "Sponsors" },
  { key: "achievements", label: "Achievements" },
  { key: "sessions", label: "Sessions" },
];

const state = {
  manifest: null,
  section: "party",
  query: "",
  cache: {},
};

async function loadJson(name) {
  if (state.cache[name]) return state.cache[name];
  const res = await fetch(`data/${name}`);
  if (!res.ok) throw new Error(`Missing data/${name}`);
  const data = await res.json();
  state.cache[name] = data;
  return data;
}

function normalize(text) {
  return String(text || "").toLowerCase();
}

function matches(row, q) {
  if (!q) return true;
  const hay = normalize(
    [
      row.title,
      row.subtitle,
      row.preview,
      row.name,
      row.hint,
      row.kitchen,
      row.dish,
      row.zone_label,
      row.blurb,
      row.role,
      row.invite_pitch,
      row.giver,
      row.kitchen,
      row.signed,
    ]
      .filter(Boolean)
      .join(" "),
  );
  return q.split(/\s+/).every((word) => hay.includes(word));
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function panelHeader(title, intro, sectionKey) {
  const wrap = el("div", "panel-header");
  const count = state.manifest?.counts?.[sectionKey];
  const label = count != null ? `${title} (${count})` : title;
  wrap.appendChild(el("h2", null, label));
  if (intro) wrap.appendChild(el("p", "intro", intro));
  return wrap;
}

function lootBadgeClass(loot) {
  const s = String(loot || "").toLowerCase();
  if (s.includes("gold")) return "badge-gold";
  if (s.includes("silver")) return "badge-silver";
  if (s.includes("bronze")) return "badge-bronze";
  return "badge-group";
}

function achievementBadges(row) {
  const wrap = el("div", "achievement-badges");
  if (row.group) {
    const g = el("span", "badge badge-group", row.group);
    wrap.appendChild(g);
  }
  if (row.loot) {
    const tier = el("span", `badge ${lootBadgeClass(row.loot)}`, row.loot);
    wrap.appendChild(tier);
  }
  return wrap.children.length ? wrap : null;
}

function cardDetails(row, bodyHtml) {
  const details = el("details", "card");
  const summary = el("summary");
  summary.appendChild(el("span", "card-title", row.title || row.name));
  const sub = row.subtitle || row.zone_label || "";
  if (sub && sub !== (row.title || row.name)) {
    summary.appendChild(el("span", "card-sub", sub));
  }
  if (row.preview && !bodyHtml) {
    summary.appendChild(el("span", "card-sub", row.preview));
  }
  details.appendChild(summary);
  if (bodyHtml) {
    const body = el("div", "card-body");
    body.innerHTML = bodyHtml;
    details.appendChild(body);
  }
  return details;
}

function renderList(rows, renderRow) {
  const ul = el("ul", "card-list");
  const q = normalize(state.query);
  for (const row of rows) {
    if (!matches(row, q)) continue;
    ul.appendChild(renderRow(row));
  }
  if (!ul.children.length) {
    return el(
      "p",
      "empty-state",
      q ? "No matches for that search." : "Nothing in this section yet — run a fresh export.",
    );
  }
  return ul;
}

function roomNumFromArchiveId(id) {
  const m = String(id || "").match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function renderRoomIndex(rows, discoveredByNum) {
  const q = normalize(state.query);
  const filtered = rows.filter((row) => {
    if (matches(row, q)) return true;
    const found = discoveredByNum.get(row.num);
    return found && matches(found, q);
  });
  if (!filtered.length) {
    return el(
      "p",
      "empty-state",
      q ? "No matches for that search." : "No rooms in the index yet.",
    );
  }
  const wrap = el("div", "room-groups");
  let lastZone = "";
  let ul = null;
  for (const row of filtered) {
    const zone = row.zone_label || row.zone_key || "Floor";
    if (zone !== lastZone) {
      wrap.appendChild(el("div", "group-label", zone));
      ul = el("ul", "card-list");
      wrap.appendChild(ul);
      lastZone = zone;
    }
    const li = document.createElement("li");
    const found = discoveredByNum.get(row.num);
    const card = el("details", "card" + (found ? " room-found" : ""));
    const summary = el("summary");
    summary.appendChild(el("span", "card-title", `${row.num} — ${row.title}`));
    if (found) {
      summary.appendChild(el("span", "card-sub", "Discovered"));
    }
    card.appendChild(summary);
    if (found?.body_html) {
      const body = el("div", "card-body");
      body.innerHTML = found.body_html;
      card.appendChild(body);
    }
    li.appendChild(card);
    ul.appendChild(li);
  }
  return wrap;
}

async function renderRules(main) {
  const data = await loadJson(state.manifest.sections.rules);
  const panel = el("div", "panel");
  panel.appendChild(
    panelHeader(
      "Rules",
      "Your notes plus rules pulled from the app on each export.",
      "rules",
    ),
  );
  panel.appendChild(
    renderList(data.rows, (row) => {
      const card = cardDetails(row, row.body_html);
      if (row.source === "system") {
        const summary = card.querySelector("summary");
        if (summary) summary.appendChild(el("span", "card-sub rule-source", "Synced from the app"));
      }
      return card;
    }),
  );
  main.appendChild(panel);
}

async function renderMap(main) {
  const data = await loadJson(state.manifest.sections.map);
  const panel = el("div", "panel");
  panel.appendChild(
    panelHeader("Zone map", data.zone_label || "Explored floor", "map"),
  );
  const wrap = el("div", "map-wrap");
  if (data.image) {
    const img = document.createElement("img");
    img.src = data.image;
    img.alt = `Map of ${data.zone_label || "zone"}`;
    wrap.appendChild(img);
    for (const m of data.markers || []) {
      if (m.x == null || m.y == null) continue;
      const label = el("div", "map-marker", `${m.num}`);
      label.title = m.title || "";
      label.style.left = `${m.x * 100}%`;
      label.style.top = `${m.y * 100}%`;
      wrap.appendChild(label);
    }
  } else {
    wrap.appendChild(el("div", "map-fallback", "No map image in the last export."));
  }
  panel.appendChild(wrap);
  panel.appendChild(
    el("p", "intro", "Room numbers match the player app and the room list below."),
  );
  main.appendChild(panel);
}

async function renderSimpleSection(main, key, title, intro) {
  const file = state.manifest.sections[key];
  const data = await loadJson(file);
  const panel = el("div", "panel");
  panel.appendChild(panelHeader(title, intro, key));
  panel.appendChild(
    renderList(data.rows, (row) =>
      cardDetails(row, row.body_html || (row.preview ? `<p>${row.preview}</p>` : "")),
    ),
  );
  main.appendChild(panel);
}

function formatStatBlock(stats) {
  if (!stats) return "";
  const chips = [];
  if (stats.ac != null) chips.push(`AC ${stats.ac}`);
  if (stats.hp != null) chips.push(`HP ${stats.hp}`);
  if (stats.hd != null) chips.push(`HD ${stats.hd}`);
  const attrs = ["str", "dex", "con", "int", "cha"]
    .filter((k) => stats[k] != null)
    .map((k) => `${k.toUpperCase()} ${stats[k]}`);
  if (attrs.length) chips.push(attrs.join(" · "));
  let html = "";
  if (chips.length) {
    html += `<p>${chips.map((c) => `<span class="chip">${c}</span>`).join(" ")}</p>`;
  }
  if (stats.attacks) html += `<p><strong>Attacks</strong> ${stats.attacks}</p>`;
  if (stats.specials) html += `<p><strong>Specials</strong> ${stats.specials}</p>`;
  return html;
}

async function renderBounties(main) {
  const data = await loadJson(state.manifest.sections.bounties);
  const panel = el("div", "panel");
  const meta = data.meta || {};
  let intro =
    "Top ten on the world board. Each night the app may put one on the floor — the rest stay off-map.";
  if (meta.explainer) intro = meta.explainer;
  if (meta.posted_name) {
    intro += ` Tonight's roll put ${meta.posted_name} on the floor (if anyone came).`;
  }
  panel.appendChild(panelHeader("Board bounties", intro, "bounties"));
  panel.appendChild(
    renderList(data.rows, (row) => {
      const subtitle = [
        row.board_bounty ? `Board ${Number(row.board_bounty).toLocaleString()} gp` : "",
        row.floor_gp ? `Floor ${row.floor_gp} gp` : "",
        row.level ? `Lv ${row.level}` : "",
      ]
        .filter(Boolean)
        .join(" · ");
      const body = [
        row.blurb ? `<p>${row.blurb}</p>` : "",
        row.role ? `<p class="card-sub">${row.role}</p>` : "",
        row.voice ? `<p><em>${row.voice.trim()}</em></p>` : "",
        row.quest ? `<p>${row.quest}</p>` : "",
        formatStatBlock(row.stats),
      ].join("");
      const card = cardDetails(
        { title: `#${row.rank} ${row.name}`, subtitle, preview: "" },
        body,
      );
      return card;
    }),
  );
  main.appendChild(panel);
}

async function renderBoard(main) {
  const data = await loadJson(state.manifest.sections.board);
  const panel = el("div", "panel");
  const meta = data.meta || {};
  panel.appendChild(
    panelHeader(
      "World board",
      meta.explainer ||
        "Top twenty names on the public leaderboard. Only the top ten can roll onto the floor.",
      "board",
    ),
  );
  if (meta.posted_name) {
    panel.appendChild(
      el("p", "intro board-tonight", `Tonight's floor bounty name: ${meta.posted_name}`),
    );
  }
  panel.appendChild(
    renderList(data.rows || [], (row) => {
      const subtitle = [
        row.on_floor ? "Top ten pool" : "",
        row.bounty ? `${Number(row.bounty).toLocaleString()} gp` : "",
        row.level ? `Lv ${row.level}` : "",
        row.kills ? `${row.kills} kills` : "",
      ]
        .filter(Boolean)
        .join(" · ");
      const body = row.blurb ? `<p>${row.blurb}</p>` : "";
      return cardDetails({ title: `#${row.rank} ${row.name}`, subtitle, preview: "" }, body);
    }),
  );
  main.appendChild(panel);
}

async function renderWall(main) {
  const data = await loadJson(state.manifest.sections.wall);
  const panel = el("div", "panel");
  panel.appendChild(
    panelHeader(
      "Achievement wall",
      "Per-crawler progress on started trophies — hints only, no secret triggers.",
      "wall",
    ),
  );
  const stack = el("div", "wall-stack");
  for (const pc of data.rows || []) {
    const block = el("div", "wall-pc");
    block.appendChild(el("h3", "wall-pc-name", pc.pc_name));
    if (pc.story?.length) {
      const story = el("ul", "wall-story");
      for (const line of pc.story) {
        const li = document.createElement("li");
        li.textContent = line;
        story.appendChild(li);
      }
      block.appendChild(story);
    }
    const ach = pc.achievements || [];
    if (!ach.length) {
      block.appendChild(el("p", "card-sub", "No wall progress exported yet."));
    } else {
      const ul = el("ul", "card-list");
      for (const row of ach) {
        const li = document.createElement("li");
        const details = el("details", "card touched");
        const summary = el("summary");
        summary.appendChild(el("span", "card-title", row.name));
        if (row.hint) summary.appendChild(el("span", "card-sub hint", row.hint));
        details.appendChild(summary);
        const body = el("div", "card-body");
        let has = false;
        if (row.progress) {
          body.appendChild(el("p", "progress-line", row.progress));
          has = true;
        }
        if (row.steps?.length) {
          const steps = el("ul", "quest-steps");
          for (const step of row.steps) {
            const sli = document.createElement("li");
            sli.textContent = `${step.met ? "✓" : "○"} ${step.label || step.name || ""}`;
            steps.appendChild(sli);
          }
          body.appendChild(steps);
          has = true;
        }
        if (row.earned_by?.length) {
          body.appendChild(el("p", null, `Earned by: ${row.earned_by.join(", ")}`));
          has = true;
        }
        if (has) details.appendChild(body);
        li.appendChild(details);
        ul.appendChild(li);
      }
      block.appendChild(ul);
    }
    stack.appendChild(block);
  }
  if (!(data.rows || []).length) {
    panel.appendChild(el("p", "empty-state", "No party sheets in this export."));
  } else {
    panel.appendChild(stack);
  }
  main.appendChild(panel);
}

async function renderQuests(main) {
  const data = await loadJson(state.manifest.sections.quests);
  const panel = el("div", "panel");
  panel.appendChild(
    panelHeader(
      "Quest board",
      "Contracts your crawlers have started — objectives only, not the hidden win text.",
      "quests",
    ),
  );
  panel.appendChild(
    renderList(data.rows || [], (row) => {
      const subtitle = [row.giver, row.gp ? `${row.gp} gp` : "", row.prize]
        .filter(Boolean)
        .join(" · ");
      let body = "";
      if (row.steps?.length) {
        body += "<ul class='quest-steps'>";
        for (const step of row.steps) {
          body += `<li>${step.met ? "✓" : "○"} ${step.label}</li>`;
        }
        body += "</ul>";
      }
      if (row.pending) body += "<p><em>Turn-in pending at the booth.</em></p>";
      return cardDetails({ title: row.name, subtitle, preview: row.pc_name }, body);
    }),
  );
  main.appendChild(panel);
}

async function renderRivals(main) {
  const data = await loadJson(state.manifest.sections.rivals);
  const panel = el("div", "panel");
  panel.appendChild(
    panelHeader(
      "Rival kitchens",
      "NPCs your table has made enemies of this evening — Stadium draws from this list.",
      "rivals",
    ),
  );
  if (data.house) {
    panel.appendChild(
      el("p", "intro", `${data.house.kitchen} — ${data.house.note || ""}`),
    );
  }
  const rows = data.rows || [];
  if (!rows.length && !data.house) {
    panel.appendChild(el("p", "empty-state", "No rivals yet tonight."));
  } else {
    panel.appendChild(
      renderList(rows, (row) => {
        const body = [
          row.taunt ? `<p><em>${row.taunt}</em></p>` : "",
          row.dish ? `<p><strong>Signature dish</strong> ${row.dish}</p>` : "",
        ].join("");
        return cardDetails(
          { title: row.name, subtitle: row.kitchen || "", preview: "" },
          body,
        );
      }),
    );
  }
  main.appendChild(panel);
}

async function renderTonight(main) {
  const data = await loadJson(state.manifest.sections.tonight);
  const panel = el("div", "panel");
  const meta = data.meta || {};
  let intro = "Rooms your party has opened this episode (player-safe titles only).";
  if (meta.posted_name) {
    intro += ` Floor bounty roll: ${meta.posted_name}.`;
  }
  panel.appendChild(panelHeader("Tonight", intro, "tonight"));
  const rooms = data.rooms || [];
  if (!rooms.length) {
    panel.appendChild(el("p", "empty-state", "No room history for this episode yet."));
  } else {
    const ul = el("ul", "card-list tonight-rooms");
    for (const room of rooms) {
      const li = document.createElement("li");
      const label = room.title ? `${room.num} — ${room.title}` : `Room ${room.num}`;
      li.appendChild(el("span", "card-title", label));
      if (room.has_text) li.appendChild(el("span", "card-sub", "Read in Rooms"));
      ul.appendChild(li);
    }
    panel.appendChild(ul);
  }
  main.appendChild(panel);
}

async function renderCast(main) {
  const data = await loadJson(state.manifest.sections.cast);
  const panel = el("div", "panel");
  panel.appendChild(
    panelHeader(
      "Cast index",
      "Everyone on the floor — met names match People; others stay as silhouettes until you find them.",
      "cast",
    ),
  );
  panel.appendChild(
    renderList(data.rows || [], (row) => {
      const card = el("details", "card" + (row.discovered ? " cast-met" : ""));
      const summary = el("summary");
      summary.appendChild(el("span", "card-title", row.name));
      summary.appendChild(
        el("span", "card-sub", row.discovered ? "Met" : "Not met"),
      );
      if (row.role) summary.appendChild(el("span", "card-sub", row.role));
      card.appendChild(summary);
      return card;
    }),
  );
  main.appendChild(panel);
}

async function renderSponsors(main) {
  const data = await loadJson(state.manifest.sections.sponsors);
  const panel = el("div", "panel");
  panel.appendChild(
    panelHeader(
      "Sponsors",
      "Booth cards unlock after evening based on your deeds — only on your phone until invited.",
      "sponsors",
    ),
  );
  if (data.scoreboard?.length) {
    const sb = el("div", "sponsor-scoreboard");
    sb.appendChild(el("p", "party-skills-label", "Courting scoreboard"));
    const ul = el("ul", "party-skills");
    for (const row of data.scoreboard) {
      const li = document.createElement("li");
      const pts = Object.entries(row.points || {})
        .map(([name, val]) => `${name} ${val}`)
        .join(" · ");
      li.textContent = `${row.pc_name}${row.signed ? ` (signed ${row.signed})` : ""}: ${pts}`;
      ul.appendChild(li);
    }
    sb.appendChild(ul);
    panel.appendChild(sb);
  }
  if (data.relics?.length) {
    const rel = el("div", "sponsor-relics");
    rel.appendChild(el("p", "party-skills-label", "Relic catalog (public effects)"));
    const ul = el("ul", "card-list");
    for (const relic of data.relics) {
      const li = document.createElement("li");
      const details = el("details", "card");
      const summary = el("summary");
      summary.appendChild(el("span", "card-title", relic.name));
      summary.appendChild(
        el(
          "span",
          "card-sub",
          `${relic.sponsor} · ${relic.cost} pt${relic.cost === 1 ? "" : "s"}${relic.unique ? " · unique" : ""}`,
        ),
      );
      details.appendChild(summary);
      if (relic.effect) {
        const body = el("div", "card-body");
        body.appendChild(el("p", null, relic.effect));
        details.appendChild(body);
      }
      li.appendChild(details);
      ul.appendChild(li);
    }
    rel.appendChild(ul);
    panel.appendChild(rel);
  }
  panel.appendChild(
    renderList(data.rows, (row) => {
      const body = [
        row.blurb ? `<p>${row.blurb}</p>` : "",
        row.invite_pitch
          ? `<p><strong>If they call you</strong> ${row.invite_pitch}</p>`
          : "",
        row.task_teaser
          ? `<p><strong>Contract gist</strong> ${row.task_teaser}</p>`
          : "",
        row.gift
          ? `<p><strong>Signing gift</strong> ${row.gift}${
              row.gift_effect ? ` — ${row.gift_effect}` : ""
            }</p>`
          : "",
        `<p class="card-sub">Exact invite rules stay in play — courting is deed-driven, not a checklist here.</p>`,
      ].join("");
      return cardDetails({ title: row.name, subtitle: "", preview: "" }, body);
    }),
  );
  main.appendChild(panel);
}

async function renderAchievements(main) {
  const data = await loadJson(state.manifest.sections.achievements);
  const panel = el("div", "panel");
  panel.appendChild(
    panelHeader(
      "Achievements",
      "Hints for the wall — green rows are ones your party has touched.",
      "achievements",
    ),
  );
  panel.appendChild(
    renderList(data.rows, (row) => {
      const details = el("details", "card achievement" + (row.touched ? " touched" : ""));
      const summary = el("summary");
      summary.appendChild(el("span", "card-title", row.name));
      const badges = achievementBadges(row);
      if (badges) summary.appendChild(badges);
      if (row.hint) summary.appendChild(el("span", "card-sub hint", row.hint));
      details.appendChild(summary);
      const body = el("div", "card-body");
      let hasBody = false;
      if (row.earned_by?.length) {
        body.appendChild(el("p", null, `Earned by: ${row.earned_by.join(", ")}`));
        hasBody = true;
      }
      const progress = row.progress_by_pc && Object.entries(row.progress_by_pc);
      if (progress?.length) {
        for (const [name, val] of progress) {
          body.appendChild(el("p", "progress-line", `${name}: ${val}`));
          hasBody = true;
        }
      }
      if (hasBody) details.appendChild(body);
      return details;
    }),
  );
  main.appendChild(panel);
}

async function renderRooms(main) {
  const [dirData, roomsData] = await Promise.all([
    loadJson(state.manifest.sections.room_directory),
    loadJson(state.manifest.sections.rooms),
  ]);
  const discoveredByNum = new Map();
  for (const row of roomsData.rows || []) {
    const num = roomNumFromArchiveId(row.id);
    if (num != null) discoveredByNum.set(num, row);
  }
  const panel = el("div", "panel");
  const foundCount = state.manifest?.counts?.rooms;
  panel.appendChild(
    panelHeader(
      "Rooms",
      foundCount
        ? "Every room on the floor; expand discovered places for full text."
        : "Every room name on the floor — grouped by zone.",
      "rooms",
    ),
  );
  panel.appendChild(renderRoomIndex(dirData.rows || [], discoveredByNum));
  main.appendChild(panel);
}

function partyAbilityPills(abilities) {
  const wrap = el("div", "party-abilities");
  for (const ab of abilities || []) {
    const pill = el("span", "party-ability-pill");
    const mod = ab.modifier >= 0 ? `+${ab.modifier}` : String(ab.modifier);
    pill.textContent = `${ab.id} ${ab.score} (${mod})`;
    wrap.appendChild(pill);
  }
  return wrap.children.length ? wrap : null;
}

async function renderParty(main) {
  const data = await loadJson(state.manifest.sections.party);
  const panel = el("div", "panel panel--party");
  panel.appendChild(panelHeader("The party", "Your crawlers, as of the last export.", "party"));
  if (data.skipped) {
    panel.appendChild(
      el(
        "p",
        "empty-state",
        "Sheets were omitted. Re-export without --skip-party, then push the wiki repo.",
      ),
    );
    main.appendChild(panel);
    return;
  }
  if (data.rows.length) {
    panel.appendChild(el("p", "warning", "Public snapshot — matches the player app roster."));
  }
  const stack = el("div", "party-stack");
  for (const row of data.rows) {
    const card = el("div", "party-card");
    const head = el("div", "party-card-head");
    if (row.portrait) {
      const img = document.createElement("img");
      img.className = "party-portrait";
      img.src = row.portrait;
      img.alt = row.name || "Portrait";
      head.appendChild(img);
    }
    const titleWrap = el("div", "party-card-titles");
    titleWrap.appendChild(el("h3", null, row.name));
    if (row.title) titleWrap.appendChild(el("p", "card-sub party-title", row.title));
    if (row.class_level) titleWrap.appendChild(el("p", "card-sub", row.class_level));
    if (row.alignment) titleWrap.appendChild(el("p", "card-sub", row.alignment));
    if (row.xp != null) titleWrap.appendChild(el("p", "card-sub", `XP ${row.xp}`));
    head.appendChild(titleWrap);
    card.appendChild(head);
    if (row.appearance) {
      card.appendChild(el("p", "party-appearance", row.appearance));
    }
    if (row.class_blurb) {
      card.appendChild(el("p", "party-class-blurb", row.class_blurb));
    }
    const abilities = partyAbilityPills(row.abilities);
    if (abilities) card.appendChild(abilities);
    const stats = el("div", "party-stats");
    if (row.hp != null && row.hp_max != null) {
      const chip = el("span", "chip");
      let hp = `${row.hp}/${row.hp_max}`;
      if (row.temp_hp > 0) hp += ` (+${row.temp_hp} temp)`;
      chip.innerHTML = `<strong>HP</strong> ${hp}`;
      stats.appendChild(chip);
    }
    if (row.ac != null) {
      const chip = el("span", "chip");
      chip.innerHTML = `<strong>AC</strong> ${row.ac}`;
      stats.appendChild(chip);
    }
    if (row.load) {
      const chip = el("span", "chip");
      chip.textContent = row.load;
      stats.appendChild(chip);
    }
    if (row.tank) stats.appendChild(el("span", "chip", "Tank"));
    if (row.ai_favour) stats.appendChild(el("span", "chip", "AI favour"));
    card.appendChild(stats);
    if (row.statuses?.length) {
      card.appendChild(el("p", "party-statuses", row.statuses.join(" · ")));
    }
    if (row.powers?.length) {
      const powers = el("p", "party-powers");
      powers.textContent = row.powers.map((p) => `${p.name} (${p.kind})`).join(" · ");
      card.appendChild(powers);
    }
    if (row.skills?.length) {
      const skills = el("ul", "party-skills");
      for (const skill of row.skills) {
        const li = document.createElement("li");
        li.textContent = `${skill.name} +${skill.bonus} (${skill.stat}, rank ${skill.rank})`;
        skills.appendChild(li);
      }
      card.appendChild(el("p", "party-skills-label", "Trained skills"));
      card.appendChild(skills);
    }
    if (row.gear_html) {
      card.appendChild(el("p", "party-skills-label", "Gear"));
      const gear = el("div", "card-body party-gear-block");
      gear.innerHTML = row.gear_html;
      card.appendChild(gear);
    }
    stack.appendChild(card);
  }
  if (!data.rows.length) {
    panel.appendChild(
      el("p", "empty-state", "No active party in this export — check live party.json on the game machine."),
    );
  } else {
    panel.appendChild(stack);
  }
  main.appendChild(panel);
}

async function renderSection() {
  const main = document.getElementById("main");
  main.innerHTML = "";
  const key = state.section;
  try {
    if (key === "rules") await renderRules(main);
    else if (key === "map") await renderMap(main);
    else if (key === "bounties") await renderBounties(main);
    else if (key === "board") await renderBoard(main);
    else if (key === "wall") await renderWall(main);
    else if (key === "quests") await renderQuests(main);
    else if (key === "rivals") await renderRivals(main);
    else if (key === "tonight") await renderTonight(main);
    else if (key === "cast") await renderCast(main);
    else if (key === "sponsors") await renderSponsors(main);
    else if (key === "achievements") await renderAchievements(main);
    else if (key === "party") await renderParty(main);
    else if (key === "rooms") await renderRooms(main);
    else if (key === "people") {
      await renderSimpleSection(main, "people", "People", "NPCs the party has met.");
    } else if (key === "items") {
      await renderSimpleSection(main, "items", "Gear", "Items the party has discovered.");
    } else if (key === "sessions") {
      await renderSimpleSection(main, "sessions", "Sessions", "Player recaps from past nights.");
    }
  } catch (err) {
    main.appendChild(
      el("p", "empty-state", `Could not load this section (${err.message}).`),
    );
  }
}

function sectionExists(key) {
  if (key === "rooms") {
    return Boolean(
      state.manifest?.sections?.room_directory || state.manifest?.sections?.rooms,
    );
  }
  return Boolean(state.manifest?.sections?.[key]);
}

function goToSection(key) {
  if (!sectionExists(key)) return;
  state.section = key;
  syncNavUi();
  renderSection();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function syncNavUi() {
  const nav = document.getElementById("nav");
  if (!nav) return;
  nav.querySelectorAll("[data-section]").forEach((node) => {
    const key = node.dataset.section;
    if (!key) return;
    node.classList.toggle("active", key === state.section);
  });
}

function buildNav() {
  const nav = document.getElementById("nav");
  nav.innerHTML = "";

  const row = el("div", "nav-row nav-row--pills");
  for (const item of NAV_ITEMS) {
    if (!sectionExists(item.key)) continue;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-pill";
    btn.textContent = item.label;
    btn.dataset.section = item.key;
    btn.addEventListener("click", () => goToSection(item.key));
    row.appendChild(btn);
  }
  nav.appendChild(row);
  syncNavUi();
}

async function init() {
  const main = document.getElementById("main");
  try {
    const res = await fetch("data/manifest.json");
    if (!res.ok) throw new Error("manifest missing");
    state.manifest = await res.json();
  } catch {
    main.innerHTML =
      '<p class="empty-state">No wiki data yet. On the game machine run <code>uv run python -m dnd wiki export</code>, then push the <code>wiki</code> repo.</p>';
    return;
  }
  if (!sectionExists(state.section)) {
    state.section = sectionExists("party") ? "party" : Object.keys(state.manifest.sections)[0];
  }
  buildNav();
  document.getElementById("search").addEventListener("input", (ev) => {
    state.query = ev.target.value.trim();
    renderSection();
  });
  await renderSection();
}

init();
