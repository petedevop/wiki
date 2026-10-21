const NAV_ITEMS = [
  { key: "party", label: "Party" },
  { key: "rules", label: "Rules" },
  { key: "map", label: "Map" },
  { key: "rooms", label: "Rooms" },
  { key: "people", label: "People" },
  { key: "items", label: "Gear" },
  { key: "bounties", label: "Bounties" },
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
  panel.appendChild(
    panelHeader(
      "Board bounties",
      "Top ten on the world board. Each night the app may put one on the floor — the rest stay off-map.",
      "bounties",
    ),
  );
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

async function renderParty(main) {
  const data = await loadJson(state.manifest.sections.party);
  const panel = el("div", "panel panel--party");
  panel.appendChild(panelHeader("The party", "Your crawlers, as of the last export.", "party"));
  if (data.skipped) {
    panel.appendChild(el("p", "empty-state", "Sheets were omitted (--skip-party)."));
    main.appendChild(panel);
    return;
  }
  if (data.rows.length) {
    panel.appendChild(el("p", "warning", "Public sheets — same fields as the player app."));
  }
  const stack = el("div", "party-stack");
  for (const row of data.rows) {
    const card = el("div", "party-card");
    card.appendChild(el("h3", null, row.name));
    if (row.class_level) card.appendChild(el("p", "card-sub", row.class_level));
    const stats = el("div", "party-stats");
    if (row.hp != null && row.hp_max != null) {
      const chip = el("span", "chip");
      chip.innerHTML = `<strong>HP</strong> ${row.hp}/${row.hp_max}`;
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
    card.appendChild(stats);
    if (row.gear_html) {
      const gear = el("div", "card-body");
      gear.innerHTML = row.gear_html;
      card.appendChild(gear);
    }
    stack.appendChild(card);
  }
  if (!data.rows.length) {
    panel.appendChild(el("p", "empty-state", "No active party in this export."));
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
