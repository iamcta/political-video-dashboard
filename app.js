
"use strict";

// SPECTRUM: Five-column political comparison dashboard

const gallery = document.getElementById("gallery");
const summary = document.getElementById("summary");
const category = document.getElementById("category");
const platform = document.getElementById("platform");
const search = document.getElementById("search");
const sort = document.getElementById("sort");

let videos = [];
let visibleVideos = [];
let boardOrder = [];
let activeIndex = -1;

const BANDS = ["Far-Left", "Left", "Center", "Right", "Far-Right"];
const LABELS = ["Far Left", "Left", "Center", "Right", "Far Right"];

const STOP_WORDS = new Set(`
  a an and are as at be been before but by can could
  did do does for from had has have he her hers him
  his how i in into is it its just live latest news
  new of on or our out over says say she should so
  than that the their them there these they this those
  to today up us video videos watch was were what
  when where who why will with you your shorts
  breaking report reports reacts reaction about after
  amid during now clip clips show shows showing
  explainer explained
`.trim().split(/\s+/));

// --------------------------------------------------
// STYLING
// --------------------------------------------------

const style = document.createElement("style");

style.textContent = `
  .gallery.spectrum-board {
    display: block;
  }

  .spectrum-head, .spectrum-row {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
  }

  .spectrum-head {
    position: sticky;
    top: 0;
    z-index: 5;
    margin-bottom: 12px;
    background: #f6f7f8;
    padding: 8px 0;
  }

  .spectrum-head span {
    text-align: center;
    color: white;
    border-radius: 6px;
    padding: 9px 3px;
    font-weight: 700;
    font-size: 12px;
  }

  .spectrum-head span:nth-child(1) {
    background: #375eae;
  }

  .spectrum-head span:nth-child(2) {
    background: #7ea8da;
    color: #1d2939;
  }

  .spectrum-head span:nth-child(3) {
    background: #777f88;
  }

  .spectrum-head span:nth-child(4) {
    background: #d49a94;
    color: #1d2939;
  }

  .spectrum-head span:nth-child(5) {
    background: #aa4349;
  }

  .spectrum-row {
    margin: 0 0 16px;
    align-items: stretch;
  }

  .spectrum-slot {
    min-width: 0;
  }

  .spectrum-slot .card {
    height: 100%;
    border-top: 5px solid var(--band-color);
  }

  .spectrum-slot[data-band="Far-Left"] {
    --band-color: #375eae;
  }

  .spectrum-slot[data-band="Left"] {
    --band-color: #7ea8da;
  }

  .spectrum-slot[data-band="Center"] {
    --band-color: #777f88;
  }

  .spectrum-slot[data-band="Right"] {
    --band-color: #d49a94;
  }

  .spectrum-slot[data-band="Far-Right"] {
    --band-color: #aa4349;
  }

  .spectrum-slot .category {
    color: var(--band-color);
  }

  .spectrum-slot[data-band="Center"] .card {
    box-shadow: 0 0 0 1px #777f8844;
  }

  .spectrum-slot .thumbnail {
    position: relative;
  }

  .spectrum-slot .thumbnail::after {
    content: "▶";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    background: #000b;
    color: white;
    border-radius: 50%;
    pointer-events: none;
  }

  .spectrum-slot .placeholder {
    height: 100%;
    min-height: 265px;
    border: 1px dashed #cbd2db;
    border-top: 5px solid var(--band-color);
    border-radius: 10px;
    background: #f0f2f5;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 9px;
    padding: 15px;
    text-align: center;
    color: #7b8592;
  }

  .placeholder small {
    font-size: 11px;
  }

  .spectrum-section {
    font-size: 12px;
    text-transform: uppercase;
    color: #68717d;
    letter-spacing: .1em;
    margin: 18px 0 9px;
  }

  .spectrum-discovery {
    border-top: 1px solid #dce0e5;
    margin-top: 12px;
    padding-top: 10px;
  }

  .spectrum-match {
    display: block;
    margin: 0 0 6px;
    color: #6a7481;
    font-size: 10px;
    font-weight: 650;
    letter-spacing: .04em;
    text-transform: uppercase;
  }

  .spectrum-player {
    display: block;
    width: 100%;
    aspect-ratio: 9 / 12;
    height: auto;
    background: black;
    border: 0;
  }

  .spectrum-controls {
    position: fixed;
    bottom: 18px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 8px;
    background: white;
    border: 1px solid #d5d9df;
    border-radius: 10px;
    padding: 9px;
    box-shadow: 0 6px 24px #0002;
  }

  .spectrum-controls[hidden] {
    display: none;
  }

  .spectrum-controls button {
    background: #f6f7f8;
    border: 1px solid #d5d9df;
    color: #25303b;
    padding: 9px 11px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
  }

  .spectrum-controls button:disabled {
    opacity: .35;
    cursor: not-allowed;
  }

  .spectrum-controls button:focus-visible {
    outline: 3px solid #5175af;
  }

  .spectrum-count {
    color: #68717d;
    font-size: 12px;
    white-space: nowrap;
  }

  .card.active-video {
    outline: 2px solid #34495e;
    outline-offset: 2px;
  }

  @media (max-width: 1000px) {
    .spectrum-head {
      display: none;
    }

    .spectrum-row {
      display: flex;
      overflow-x: auto;
      scroll-snap-type: x proximity;
      padding: 4px 3px 14px;
    }

    .spectrum-slot {
      flex: 0 0 min(58vw, 240px);
      scroll-snap-align: start;
    }

    .spectrum-slot[data-band="Center"] {
      order: -1;
    }
  }

  @media (max-width: 600px) {
    .spectrum-controls {
      width: calc(100% - 16px);
      justify-content: center;
      bottom: 8px;
    }

    .spectrum-controls button {
      padding: 8px;
      font-size: 12px;
    }
  }
`;

document.head.appendChild(style);

// --------------------------------------------------
// VIDEO NAVIGATION
// --------------------------------------------------

const controls = document.createElement("nav");
controls.className = "spectrum-controls";
controls.setAttribute("aria-label", "Video navigation");
controls.hidden = true;

const previousButton = document.createElement("button");
previousButton.type = "button";
previousButton.textContent = "↑ Previous";

const counter = document.createElement("span");
counter.className = "spectrum-count";

const nextButton = document.createElement("button");
nextButton.type = "button";
nextButton.textContent = "Next ↓";

const stopButton = document.createElement("button");
stopButton.type = "button";
stopButton.textContent = "✕ Stop";

controls.append(previousButton, counter, nextButton, stopButton);
document.body.appendChild(controls);

// --------------------------------------------------
// UTILITIES
// --------------------------------------------------

function makeText(tag, value, className) {
  const node = document.createElement(tag);
  node.textContent = value;
  if (className) node.className = className;
  return node;
}

function safeURL(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol)
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function videoDate(video) {
  const d = Date.parse(video.published_at || video.published || "");
  return Number.isFinite(d) ? d : 0;
}

function bandFor(video) {
  const value = video.category || "Unclassified";

  if (value === "Center-Left") return "Left";
  if (value === "Center-Right") return "Right";

  return BANDS.includes(value) ? value : null;
}

function getYouTubeId(video) {
  try {
    const url = new URL(video.url);
    let id = null;

    if ([
      "www.youtube.com",
      "youtube.com",
      "m.youtube.com"
    ].includes(url.hostname)) {
      if (url.pathname === "/watch") {
        id = url.searchParams.get("v");
      } else if (/^\/(shorts|embed)\//.test(url.pathname)) {
        id = url.pathname.split("/")[2];
      }
    } else if (url.hostname === "youtu.be") {
      id = url.pathname.slice(1);
    }

    return /^[A-Za-z0-9_-]{11}$/.test(id || "")
      ? id
      : null;
  } catch {
    return null;
  }
}

// --------------------------------------------------
// VIDEO CARDS
// --------------------------------------------------

function makeCard(video, index, matchLabel = "") {
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.index = String(index);

  const link = document.createElement("a");
  link.className = "thumbnail";
  link.href = safeURL(video.url) || "#";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute(
    "aria-label",
    "Watch video: " + (video.title || "Untitled")
  );

  const thumbnail = safeURL(
    video.thumbnail_url || video.thumbnail
  );

  if (thumbnail) {
    const img = document.createElement("img");
    img.src = thumbnail;
    img.alt = "";
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    link.appendChild(img);
  } else {
    link.appendChild(makeText("div", "Video", "no-image"));
  }

  const content = makeText("div", "", "card-content");

  if (matchLabel) {
    content.appendChild(
      makeText("span", matchLabel, "spectrum-match")
    );
  }

  content.appendChild(
    makeText("div", video.category || "Unclassified", "category")
  );

  const heading = makeText("div", "", "video-title");
  const titleLink = makeText("a", video.title || "Untitled video");
  titleLink.href = link.href;
  titleLink.target = "_blank";
  titleLink.rel = "noopener noreferrer";

  heading.appendChild(titleLink);
  content.appendChild(heading);

  const date = videoDate(video);
  const dateText = date
    ? new Date(date).toLocaleDateString()
    : "Date unknown";

  content.appendChild(makeText(
    "div",
    `${video.creator || "Unknown creator"} · ` +
    `${video.platform || "Video"} · ${dateText}`,
    "metadata"
  ));

  card.append(link, content);
  return card;
}

// --------------------------------------------------
// TITLE MATCHING
// --------------------------------------------------

// Normalize common word endings so election and
// elections can match.

function keyword(word) {
  const w = word.toLowerCase();

  if (w.length > 5 && w.endsWith("ies")) {
    return w.slice(0, -3) + "y";
  }

  if (w.length > 5 && w.endsWith("ing")) {
    return w.slice(0, -3);
  }

  if (w.length > 5 && w.endsWith("ed")) {
    return w.slice(0, -2);
  }

  if (w.length > 4 && w.endsWith("s") && !w.endsWith("ss")) {
    return w.slice(0, -1);
  }

  return w;
}

function keywords(title) {
  return [...new Set(
    (title || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(w => w.length >= 4 && !STOP_WORDS.has(w))
      .map(keyword)
  )];
}

// Allow one character to be added, removed or changed.

function oneEditApart(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;

  let i = 0;
  let j = 0;
  let edits = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }

    if (++edits > 1) return false;

    if (a.length > b.length) {
      i++;
    } else if (b.length > a.length) {
      j++;
    } else {
      i++;
      j++;
    }
  }

  return edits + (a.length - i) + (b.length - j) <= 1;
}

function matchingScore(first, second) {
  const a = keywords(first.title);
  const b = keywords(second.title);

  let score = 0;

  for (const word of a) {
    for (const candidate of b) {
      if (word === candidate) {
        score += 3;
        break;
      }

      if (
        word.length >= 6 &&
        candidate.length >= 6 &&
        oneEditApart(word, candidate)
      ) {
        score += 1;
        break;
      }
    }
  }

  return score;
}

// Find the best available matching video for one
// ideological column. Any positive score qualifies.

function pickMatch(anchor, band, entries, used) {
  let best = null;
  let bestScore = 0;

  for (const entry of entries) {
    if (used.has(entry.index)) continue;
    if (bandFor(entry.video) !== band) continue;

    const gap = Math.abs(
      videoDate(anchor.video) - videoDate(entry.video)
    );

    // Avoid linking videos published more than
    // seven days apart when both dates are known.
    if (
      videoDate(anchor.video) &&
      videoDate(entry.video) &&
      gap > 7 * 24 * 60 * 60 * 1000
    ) {
      continue;
    }

    const score = matchingScore(anchor.video, entry.video);

    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  return best;
}

// --------------------------------------------------
// RANDOM DISCOVERY
// --------------------------------------------------

// Stable pseudo-random selections for the day.
// Refreshing the page won't continually reshuffle.

function hashString(value) {
  let h = 2166136261;

  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return h >>> 0;
}

function pickDiscovery(band, entries, used, protectedCenters, row) {
  const seed = new Date().toISOString().slice(0, 10);

  const candidates = entries.filter(entry =>
    bandFor(entry.video) === band &&
    !used.has(entry.index) &&
    (
      band !== "Center" ||
      !protectedCenters.has(entry.index)
    )
  );

  candidates.sort((a, b) =>
    hashString(seed + row + String(a.video.id || a.video.url)) -
    hashString(seed + row + String(b.video.id || b.video.url))
  );

  return candidates[0] || null;
}

// --------------------------------------------------
// BUILD COMPARISON ROWS
// --------------------------------------------------

function makeSlot(band, entry, label = "") {
  const slot = document.createElement("div");
  slot.className = "spectrum-slot";
  slot.dataset.band = band;

  if (entry) {
    slot.appendChild(
      makeCard(entry.video, entry.index, label)
    );
  } else {
    const placeholder = makeText("div", "", "placeholder");

    placeholder.appendChild(
      makeText("div", "Awaiting perspective")
    );

    placeholder.appendChild(
      makeText(
        "small",
        `No ${band.replace("-", " ")} video matches yet`
      )
    );

    slot.appendChild(placeholder);
  }

  return slot;
}

function appendBoardRow(slots, isDiscovery = false) {
  const row = document.createElement("section");
  row.className = "spectrum-row" +
    (isDiscovery ? " spectrum-discovery" : "");

  row.setAttribute(
    "aria-label",
    isDiscovery
      ? "Discovery videos"
      : "Possible views on the same story"
  );

  BANDS.forEach((band, i) => {
    const label = isDiscovery
      ? "Discovery"
      : i === 2
        ? "Center anchor"
        : "Possible topic match";

    row.appendChild(makeSlot(band, slots[i], label));
  });

  gallery.appendChild(row);

  // Navigation starts with the center, followed by
  // nearby perspectives, then the outer columns.
  const sequence = isDiscovery
    ? [0, 1, 2, 3, 4]
    : [2, 1, 3, 0, 4];

  for (const i of sequence) {
    if (slots[i]) {
      boardOrder.push(slots[i].index);
    }
  }
}

// --------------------------------------------------
// RENDER THE BOARD
// --------------------------------------------------

function renderGallery() {
  gallery.replaceChildren();
  boardOrder = [];

  if (!visibleVideos.length) {
    gallery.className = "gallery";
    summary.textContent = "0 videos";

    gallery.appendChild(makeText(
      "div",
      videos.length
        ? "No videos match these filters."
        : "No videos collected yet.",
      "message"
    ));

    return;
  }

  const entries = visibleVideos.map((video, index) => ({
    video,
    index
  }));

  const centerEntries = entries.filter(
    entry => bandFor(entry.video) === "Center"
  );

  // A specific filter uses the ordinary gallery.
  // The comparison board is the default All view.

  const showBoard =
    !category.value &&
    !platform.value &&
    !search.value.trim() &&
    centerEntries.length > 0;

  if (!showBoard) {
    gallery.className = "gallery";

    entries.forEach(entry => {
      gallery.appendChild(
        makeCard(entry.video, entry.index)
      );

      boardOrder.push(entry.index);
    });

    summary.textContent =
      `${visibleVideos.length} videos · ` +
      `${sort.value === "oldest" ? "Oldest" : "Newest"} first`;

    return;
  }

  gallery.className = "gallery spectrum-board";

  const head = document.createElement("div");
  head.className = "spectrum-head";

  LABELS.forEach(label => {
    head.appendChild(makeText("span", label));
  });

  gallery.appendChild(head);

  // Reserve some Center videos for discovery rows.

  let storyCount = 0;

  while (
    storyCount < 21 &&
    storyCount + 1 +
      Math.floor((storyCount + 1) / 3) <= centerEntries.length
  ) {
    storyCount++;
  }

  const anchors = centerEntries.slice(
    0,
    Math.max(1, storyCount)
  );

  const protectedCenters = new Set(
    anchors.map(entry => entry.index)
  );

  const used = new Set();
  let discoveryCount = 0;

  for (let i = 0; i < anchors.length; i++) {
    const anchor = anchors[i];

    used.add(anchor.index);

    const slots = [
      null,
      null,
      anchor,
      null,
      null
    ];

    BANDS.forEach((band, col) => {
      if (col === 2) return;

      const chosen = pickMatch(
        anchor,
        band,
        entries,
        used
      );

      if (chosen) {
        slots[col] = chosen;
        used.add(chosen.index);
      }
    });

    appendBoardRow(slots);

    // After three comparison rows, add one row
    // of random, not necessarily related videos.

    if ((i + 1) % 3 === 0) {
      discoveryCount++;

      gallery.appendChild(makeText(
        "div",
        "Discovery · A sample from each perspective",
        "spectrum-section"
      ));

      const discoveries = BANDS.map(band => {
        const chosen = pickDiscovery(
          band,
          entries,
          used,
          protectedCenters,
          discoveryCount
        );

        if (chosen) {
          used.add(chosen.index);
        }

        return chosen;
      });

      appendBoardRow(discoveries, true);
    }
  }

  summary.textContent =
    `${boardOrder.length} of ${visibleVideos.length} videos shown · ` +
    `Center-led possible matches · ` +
    `${discoveryCount} discovery rows`;
}

// --------------------------------------------------
// PLAYBACK
// --------------------------------------------------

function stopVideo(redraw = true) {
  const playing = activeIndex !== -1;

  activeIndex = -1;
  controls.hidden = true;

  if (redraw && playing) {
    renderGallery();
  }
}

function findPlayableIndex(start, direction) {
  let position = boardOrder.indexOf(start);

  if (position === -1) {
    position = direction > 0 ? -1 : boardOrder.length;
  }

  for (
    let i = position + direction;
    i >= 0 && i < boardOrder.length;
    i += direction
  ) {
    const index = boardOrder[i];

    if (getYouTubeId(visibleVideos[index])) {
      return index;
    }
  }

  return -1;
}

function updateNavigation() {
  counter.textContent =
    `${boardOrder.indexOf(activeIndex) + 1} / ${boardOrder.length}`;

  previousButton.disabled =
    findPlayableIndex(activeIndex, -1) === -1;

  nextButton.disabled =
    findPlayableIndex(activeIndex, 1) === -1;
}

function playVideo(index) {
  const video = visibleVideos[index];
  if (!video) return;

  const id = getYouTubeId(video);
  if (!id) return;

  // Removes the old iframe and stops its playback.
  renderGallery();

  const card = gallery.querySelector(
    `.card[data-index="${index}"]`
  );

  if (!card) return;

  const thumbnail = card.querySelector(".thumbnail");

  const iframe = document.createElement("iframe");
  iframe.className = "spectrum-player";

  iframe.src =
    `https://www.youtube-nocookie.com/embed/` +
    `${encodeURIComponent(id)}` +
    `?controls=1&playsinline=1&autoplay=1`;

  iframe.title =
    "YouTube video player: " + (video.title || "Untitled");

  iframe.allow =
    "autoplay; encrypted-media; picture-in-picture; fullscreen";

  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";

  thumbnail.replaceWith(iframe);
  card.classList.add("active-video");

  activeIndex = index;
  controls.hidden = false;
  updateNavigation();

  card.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

// --------------------------------------------------
// FILTERING
// --------------------------------------------------

function applyFilters() {
  const query = search.value.trim().toLowerCase();

  visibleVideos = videos.filter(video => {
    const matchesCategory =
      !category.value ||
      (video.category || "Unclassified") === category.value;

    const matchesPlatform =
      !platform.value ||
      (video.platform || "").toLowerCase() === platform.value;

    const matchesSearch =
      !query ||
      `${video.title || ""} ${video.creator || ""}`
        .toLowerCase()
        .includes(query);

    return (
      matchesCategory &&
      matchesPlatform &&
      matchesSearch
    );
  });

  visibleVideos.sort((a, b) =>
    sort.value === "oldest"
      ? videoDate(a) - videoDate(b)
      : videoDate(b) - videoDate(a)
  );

  stopVideo(false);
  renderGallery();
}

// --------------------------------------------------
// EVENTS
// --------------------------------------------------

gallery.addEventListener("click", event => {
  if (!(event.target instanceof Element)) return;

  const link = event.target.closest("a.thumbnail");
  if (!link) return;

  const card = link.closest(".card");
  if (!card) return;

  const index = Number(card.dataset.index);

  if (
    !Number.isInteger(index) ||
    !getYouTubeId(visibleVideos[index])
  ) {
    return;
  }

  event.preventDefault();
  playVideo(index);
});

previousButton.addEventListener("click", () => {
  const index = findPlayableIndex(activeIndex, -1);
  if (index !== -1) playVideo(index);
});

nextButton.addEventListener("click", () => {
  const index = findPlayableIndex(activeIndex, 1);
  if (index !== -1) playVideo(index);
});

stopButton.addEventListener("click", () => {
  stopVideo();
});

document.addEventListener("keydown", event => {
  if (
    event.target instanceof Element &&
    event.target.closest(
      "input, textarea, select, [contenteditable='true']"
    )
  ) {
    return;
  }

  if (event.altKey || event.ctrlKey || event.metaKey) return;

  let index = -1;

  if (event.key === "ArrowDown") {
    index = findPlayableIndex(activeIndex, 1);
  } else if (event.key === "ArrowUp") {
    index = findPlayableIndex(activeIndex, -1);
  } else if (
    event.key === "Escape" &&
    activeIndex !== -1
  ) {
    event.preventDefault();
    stopVideo();
    return;
  }

  if (index !== -1) {
    event.preventDefault();
    playVideo(index);
  }
});

[category, platform, search, sort].forEach(element => {
  element.addEventListener("input", applyFilters);
});

// --------------------------------------------------
// LOAD VIDEOS
// --------------------------------------------------

async function loadVideos() {
  try {
    const response = await fetch(
      "./videos.json",
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    videos = Array.isArray(data)
      ? data
      : Array.isArray(data.videos)
        ? data.videos
        : [];

    applyFilters();
  } catch (error) {
    console.error("Spectrum couldn't load videos:", error);

    summary.textContent = "Unable to load video archive.";

    gallery.replaceChildren(makeText(
      "div",
      "Could not load videos.json. Check the GitHub Pages deployment.",
      "message"
    ));
  }
}

loadVideos();

