const SECTION_LABELS = {
  rules: "Rules",
  map: "Map",
  room_directory: "Room index",
  rooms: "Rooms",
  people: "People",
  items: "Gear",
  achievements: "Achievements",
  rivals: "Rivals",
  party: "Party",
  sessions: "Sessions",
};

const state = {
  manifest: null,
  section: "rules",
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
    [row.title, row.subtitle, row.preview, row.name, row.hint, row.kitchen, row.dish]
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

function cardDetails(row, bodyHtml) {
  const details = el("details", "card");
  const summary = el("summary");
  summary.appendChild(el("span", "card-title", row.title || row.name));
  const sub = row.subtitle || row.group || row.zone_label || row.loot || "";
  if (sub) summary.appendChild(el("span", "card-sub", sub));
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
    const empty = el("p", "intro", q ? "No matches." : "Nothing exported yet.");
    return empty;
  }
  return ul;
}

async function renderRules(main) {
  const data = await loadJson(state.manifest.sections.rules);
  const panel = el("div", "panel");
  panel.appendChild(el("h2", null, "Rules"));
  panel.appendChild(
    el(
      "p",
      "intro",
      "House and table conventions for this crawl. Core Shadow Dark rules stay in your rulebook — not republished here.",
    ),
  );
  panel.appendChild(
    renderList(data.rows, (row) => cardDetails(row, row.body_html)),
  );
  main.appendChild(panel);
}

async function renderMap(main) {
  const data = await loadJson(state.manifest.sections.map);
  const panel = el("div", "panel");
  panel.appendChild(el("h2", null, "Zone map"));
  if (data.zone_label) {
    panel.appendChild(el("p", "intro", data.zone_label));
  }
  const wrap = el("div", "map-wrap");
  if (data.image) {
    const img = document.createElement("img");
    img.src = data.image;
    img.alt = `Map of ${data.zone_label || "zone"}`;
    wrap.appendChild(img);
    for (const m of data.markers || []) {
      if (m.x == null || m.y == null) continue;
      const label = el("div", "map-marker", `${m.num}\n${m.title}`);
      label.style.left = `${m.x * 100}%`;
      label.style.top = `${m.y * 100}%`;
      wrap.appendChild(label);
    }
  } else {
    const fb = el("div", "map-fallback", "No zone map image in the last export.");
    wrap.appendChild(fb);
  }
  panel.appendChild(wrap);
  main.appendChild(panel);
}

async function renderSimpleSection(main, key, title, intro) {
  const file = state.manifest.sections[key];
  const data = await loadJson(file);
  const panel = el("div", "panel");
  panel.appendChild(el("h2", null, title));
  if (intro) panel.appendChild(el("p", "intro", intro));
  panel.appendChild(
    renderList(data.rows, (row) =>
      cardDetails(row, row.body_html || (row.preview ? `<p>${row.preview}</p>` : "")),
    ),
  );
  main.appendChild(panel);
}

async function renderAchievements(main) {
  const data = await loadJson(state.manifest.sections.achievements);
  const panel = el("div", "panel");
  panel.appendChild(el("h2", null, "Achievements"));
  panel.appendChild(
    el("p", "intro", "Hints for the wall. Progress highlights what the party has touched."),
  );
  panel.appendChild(
    renderList(data.rows, (row) => {
      const details = el("details", "card achievement" + (row.touched ? " touched" : ""));
      const summary = el("summary");
      summary.appendChild(el("span", "card-title", row.name));
      const bits = [row.group, row.loot].filter(Boolean).join(" · ");
      if (bits) summary.appendChild(el("span", "card-sub", bits));
      if (row.hint) summary.appendChild(el("span", "card-sub", row.hint));
      details.appendChild(summary);
      const body = el("div", "card-body");
      if (row.earned_by?.length) {
        body.appendChild(el("p", null, `Earned by: ${row.earned_by.join(", ")}`));
      }
      const progress = row.progress_by_pc && Object.entries(row.progress_by_pc);
      if (progress?.length) {
        for (const [name, val] of progress) {
          body.appendChild(el("p", null, `${name}: ${val}`));
        }
      }
      details.appendChild(body);
      return details;
    }),
  );
  main.appendChild(panel);
}

async function renderRivals(main) {
  const data = await loadJson(state.manifest.sections.rivals);
  const panel = el("div", "panel");
  panel.appendChild(el("h2", null, "Rivals"));
  panel.appendChild(el("p", "intro", "Kitchens the party has made enemies of this season."));
  if (!data.rows.length) {
    panel.appendChild(el("p", "intro", "No active rivals in the last export."));
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
      panel.appendChild(el("p", null, `${c.name}: ${c.player}`));
    }
  }
  main.appendChild(panel);
}

async function renderParty(main) {
  const data = await loadJson(state.manifest.sections.party);
  const panel = el("div", "panel");
  panel.appendChild(el("h2", null, "Party"));
  if (data.skipped) {
    panel.appendChild(el("p", "intro", "Character sheets were omitted from this export."));
    main.appendChild(panel);
    return;
  }
  const warn = el(
    "p",
    "warning",
    "These sheets are public on the web — same stats the player app shows at the table.",
  );
  panel.appendChild(warn);
  for (const row of data.rows) {
    const card = el("div", "party-card");
    card.appendChild(el("h3", null, row.name));
    card.appendChild(el("p", "card-sub", row.class_level || ""));
    const stats = el("div", "party-stats");
    if (row.hp != null && row.hp_max != null) stats.appendChild(el("span", null, `HP ${row.hp}/${row.hp_max}`));
    if (row.ac != null) stats.appendChild(el("span", null, `AC ${row.ac}`));
    if (row.load) stats.appendChild(el("span", null, row.load));
    card.appendChild(stats);
    if (row.gear_html) {
      const gear = el("div", "card-body");
      gear.innerHTML = row.gear_html;
      card.appendChild(gear);
    }
    panel.appendChild(card);
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
        "All room names on the floor (numbers match the map and the app).",
      );
    } else if (key === "rooms") {
      await renderSimpleSection(
        main,
        "rooms",
        "Rooms",
        "Places the party has discovered — full player-safe text.",
      );
    } else if (key === "people") {
      await renderSimpleSection(main, "people", "People", "NPCs the party has met.");
    } else if (key === "items") {
      await renderSimpleSection(main, "items", "Gear", "Items the party has discovered.");
    } else if (key === "sessions") {
      await renderSimpleSection(main, "sessions", "Sessions", "Player recaps from past nights.");
    }
  } catch (err) {
    main.appendChild(el("p", "intro", `Could not load section (${err.message}). Run wiki export locally.`));
  }
}

function buildNav() {
  const nav = document.getElementById("nav");
  nav.innerHTML = "";
  for (const key of Object.keys(state.manifest.sections)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = SECTION_LABELS[key] || key;
    btn.dataset.section = key;
    if (key === state.section) btn.classList.add("active");
    btn.addEventListener("click", () => {
      state.section = key;
      for (const b of nav.querySelectorAll("button")) {
        b.classList.toggle("active", b.dataset.section === key);
      }
      renderSection();
    });
    nav.appendChild(btn);
  }
}

async function init() {
  const main = document.getElementById("main");
  try {
    const res = await fetch("data/manifest.json");
    if (!res.ok) throw new Error("manifest missing");
    state.manifest = await res.json();
  } catch {
    main.innerHTML =
      "<p class='intro'>No handbook data yet. On the game machine run: <code>uv run python -m dnd wiki export</code>, then commit <code>player-site/</code>.</p>";
    return;
  }
  const meta = document.getElementById("export-meta");
  if (state.manifest.exported_at) {
    const when = new Date(state.manifest.exported_at * 1000);
    meta.textContent = `Last export: ${when.toLocaleString()} · ${state.manifest.zone_label || "zone"}`;
  }
  if (state.manifest.public_party_sheets === false) {
    document.getElementById("footer-note").textContent +=
      " Party sheets were omitted from this snapshot.";
  }
  buildNav();
  document.getElementById("search").addEventListener("input", (ev) => {
    state.query = ev.target.value.trim();
    renderSection();
  });
  await renderSection();
}

init();
