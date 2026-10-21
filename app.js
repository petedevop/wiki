const NAV_LAYOUT = [
  { solo: "party", label: "Party" },
  {
    id: "floor",
    label: "Floor",
    items: [
      { key: "map", label: "Map" },
      { key: "room_directory", label: "Rooms" },
      { key: "rooms", label: "Found" },
      { key: "people", label: "People" },
      { key: "items", label: "Gear" },
    ],
  },
  {
    id: "wall",
    label: "Wall",
    items: [
      { key: "achievements", label: "Achievements" },
      { key: "rivals", label: "Rivals" },
    ],
  },
  {
    id: "table",
    label: "Table",
    items: [
      { key: "rules", label: "Rules" },
      { key: "sessions", label: "Sessions" },
    ],
  },
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
    [row.title, row.subtitle, row.preview, row.name, row.hint, row.kitchen, row.dish, row.zone_label]
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

function renderGroupedRoomIndex(rows) {
  const q = normalize(state.query);
  const filtered = rows.filter((r) => matches(r, q));
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
    const card = el("details", "card");
    const summary = el("summary");
    summary.appendChild(el("span", "card-title", `${row.num} — ${row.title}`));
    card.appendChild(summary);
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
      "House and table conventions. Core Shadow Dark stays in your rulebook.",
      "rules",
    ),
  );
  panel.appendChild(renderList(data.rows, (row) => cardDetails(row, row.body_html)));
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
  if (key === "room_directory") {
    panel.appendChild(renderGroupedRoomIndex(data.rows));
  } else {
    panel.appendChild(
      renderList(data.rows, (row) =>
        cardDetails(row, row.body_html || (row.preview ? `<p>${row.preview}</p>` : "")),
      ),
    );
  }
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

async function renderRivals(main) {
  const data = await loadJson(state.manifest.sections.rivals);
  const panel = el("div", "panel");
  panel.appendChild(
    panelHeader("Rivals", "Kitchens the party has made enemies of.", "rivals"),
  );
  if (!data.rows.length) {
    panel.appendChild(el("p", "empty-state", "No active rivals in this snapshot."));
  } else {
    panel.appendChild(
      renderList(data.rows, (row) => {
        const html = [
          row.taunt ? `<p>${row.taunt}</p>` : "",
          row.entrance ? `<p><em>${row.entrance}</em></p>` : "",
          (row.abilities || [])
            .map((a) => `<p><strong>${a.name}</strong> — ${a.text}</p>`)
            .join(""),
        ].join("");
        return cardDetails(
          { title: row.name, subtitle: `${row.kitchen} · ${row.dish}`, preview: "" },
          html,
        );
      }),
    );
  }
  if (data.house?.challenges?.length) {
    panel.appendChild(el("h3", null, "House show"));
    for (const c of data.house.challenges) {
      panel.appendChild(el("p", "card-sub", `${c.name}: ${c.player}`));
    }
  }
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
    panel.appendChild(
      el("p", "warning", "Public snapshot — same fields as the player app at the table."),
    );
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
    else if (key === "achievements") await renderAchievements(main);
    else if (key === "rivals") await renderRivals(main);
    else if (key === "party") await renderParty(main);
    else if (key === "room_directory") {
      await renderSimpleSection(
        main,
        "room_directory",
        "Room index",
        "Every room name on the floor — grouped by zone.",
      );
    } else if (key === "rooms") {
      await renderSimpleSection(
        main,
        "rooms",
        "Discovered places",
        "Full player-safe text for rooms you've found.",
      );
    } else if (key === "people") {
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
  return Boolean(state.manifest?.sections?.[key]);
}

function groupContains(sectionKey, group) {
  if (group.solo) return group.solo === sectionKey;
  return group.items?.some((item) => item.key === sectionKey);
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
  nav.querySelectorAll(".nav-group").forEach((groupEl) => {
    const id = groupEl.dataset.group;
    const group = NAV_LAYOUT.find((g) => g.id === id);
    const active = group && groupContains(state.section, group);
    groupEl.classList.toggle("has-active", Boolean(active));
    if (active) groupEl.open = true;
  });
  const solo = nav.querySelector(".nav-solo");
  if (solo) solo.classList.toggle("active", state.section === "party");
}

function buildNav() {
  const nav = document.getElementById("nav");
  nav.innerHTML = "";

  const soloRow = el("div", "nav-row");
  const partyBtn = document.createElement("button");
  partyBtn.type = "button";
  partyBtn.className = "nav-solo";
  partyBtn.textContent = "Party";
  partyBtn.dataset.section = "party";
  if (sectionExists("party")) {
    partyBtn.addEventListener("click", () => goToSection("party"));
    soloRow.appendChild(partyBtn);
  }
  nav.appendChild(soloRow);

  const groupRow = el("div", "nav-row");
  for (const group of NAV_LAYOUT) {
    if (group.solo) continue;
    const items = (group.items || []).filter((item) => sectionExists(item.key));
    if (!items.length) continue;

    const details = document.createElement("details");
    details.className = "nav-group";
    details.dataset.group = group.id;
    if (groupContains(state.section, group)) details.open = true;

    const summary = document.createElement("summary");
    summary.textContent = group.label;
    details.appendChild(summary);

    const sub = el("div", "nav-sub");
    for (const item of items) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = item.label;
      btn.dataset.section = item.key;
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        goToSection(item.key);
      });
      sub.appendChild(btn);
    }
    details.appendChild(sub);
    groupRow.appendChild(details);
  }
  nav.appendChild(groupRow);
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
      '<p class="empty-state">No handbook data yet. On the game machine run <code>uv run python -m dnd wiki export</code>, then push the <code>wiki</code> repo.</p>';
    return;
  }
  const meta = document.getElementById("export-meta");
  if (state.manifest.exported_at) {
    const when = new Date(state.manifest.exported_at * 1000);
    meta.textContent = `Updated ${when.toLocaleString()} · ${state.manifest.zone_label || "zone"}`;
  }
  if (state.manifest.public_party_sheets === false) {
    document.getElementById("footer-note").textContent +=
      " Party sheets were omitted from this snapshot.";
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
