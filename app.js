
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

/* Extra viewpoint matches extend beyond five columns. */
style.textContent += `
  .spectrum-row.spectrum-expanded {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 12px;
    scroll-snap-type: x proximity;
    scrollbar-width: thin;
  }

  .spectrum-row.spectrum-expanded .spectrum-slot {
    flex: 0 0 max(190px, calc((100% - 48px) / 5));
    scroll-snap-align: center;
  }

  .spectrum-row.spectrum-expanded
  .spectrum-slot[data-band="Center"] {
    order: 0;
  }
`;

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
  ? new Date(date).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    })
  : "Date unknown";

  content.appendChild(makeText(
    "div",
    `${video.creator || "Unknown creator"} · ` +
    `${video.platform || "Video"} · ${dateText}`,
    "metadata"
  ));

  card.append(link, content);

// Publication-age indicator
if (date) {
  const ageBadge = document.createElement("span");

  ageBadge.className = "spectrum-age";
  ageBadge.dataset.publishedAt = String(date);
  ageBadge.textContent = relativePublished(date);
  ageBadge.title = "Time since video publication";

  link.appendChild(ageBadge);
}

return card;
}

// --------------------------------------------------

/* ============================================
   SPECTRUM NEWS NOUN MATCHING ENGINE

   Only recognized news nouns and named entities
   are eligible for matching.

   Add new words to any category as needed.
   ============================================ */

// 1. CURATED NEWS NOUN VOCABULARY

const NEWS_NOUNS = new Set([

  // ELECTIONS AND DEMOCRACY
  ...`election ballot voter voting primary caucus
  recount referendum candidate campaign polling
  pollster turnout district precinct democracy
  electoral college inauguration impeachment
  nomination nominee electorate registration
  redistricting gerrymandering landslide runoff
  midterm absentee mailin disenfranchisement
  congresswoman congressman`.split(/\s+/),

  // GOVERNMENT AND LEGISLATION
  ...`congress senate senator representative
  legislature legislation bill law amendment
  constitution constitutional governor mayor
  presidency president administration cabinet
  executive veto filibuster committee subpoena
  hearing testimony oversight regulation
  ordinance mandate governor lieutenant
  speaker parliament ministry agency
  shutdown budget appropriation`.split(/\s+/),

  // PARTIES AND POLITICAL GROUPS
  ...`democrat republican libertarian progressive
  conservative liberal socialist communist
  populist nationalist independent greenparty
  labor union activist lobbyist lobby
  establishment opposition coalition
  movement grassroots ideology`.split(/\s+/),

  // COURTS AND JUSTICE
  ...`court judge justice lawsuit trial verdict
  indictment prosecution prosecutor defendant
  plaintiff conviction sentencing appeal
  supreme supremecourt injunction ruling
  attorney investigation investigation
  warrant affidavit evidence jury
  deposition hearing extradition immunity
  pardon felony misdemeanor`.split(/\s+/),

  // ECONOMY AND FINANCE
  ...`inflation recession unemployment economy
  tariff tariffs taxation tax deficit debt
  spending revenue income wages salary
  mortgage housing rent interest banking
  bank bankruptcy stock market wallstreet
  federalreserve fedrate bond dollar
  currency trade imports exports
  manufacturing industry subsidy
  poverty wealth inequality stimulus
  cryptocurrency bitcoin`.split(/\s+/),

  // IMMIGRATION AND BORDER
  ...`immigration immigrant migrant migration
  border asylum deportation detention
  citizenship refugee visa passport
  crossing patrol ice dhs customs
  sanctuary naturalization smuggling
  residency enforcement`.split(/\s+/),

  // HEALTH AND SOCIAL POLICY
  ...`abortion pregnancy healthcare insurance
  medicare medicaid hospital vaccine vaccination
  pandemic disease disability birth
  contraception fertility maternal
  prescription medication pharmacy
  epidemic addiction overdose opioid
  fentanyl euthanasia`.split(/\s+/),

  // EDUCATION AND CULTURE
  ...`education school university college
  tuition scholarship teacher student
  curriculum library literacy textbook
  homeschooling voucher campus
  classroom graduation testing
  censorship bookban religion church
  gender sexuality marriage diversity
  discrimination racism antisemitism
  feminism transgender identity`.split(/\s+/),

  // CRIME AND PUBLIC SAFETY
  ...`crime police policing sheriff
  arrest prison jail incarceration
  murder homicide assault robbery
  burglary trafficking smuggling
  corruption fraud bribery conspiracy
  terrorism extremist extremism
  protest riot demonstration
  surveillance security whistleblower
  investigation crackdown`.split(/\s+/),

  // WAR AND FOREIGN POLICY
  ...`war warfare invasion military
  army navy airforce marine
  defense missile drone artillery
  bomb bombing nuclear weapon
  weapons ceasefire treaty diplomacy
  diplomat embassy sanctions nato
  occupation conflict blockade
  hostage prisoner casualty
  battlefield alliance sovereignty
  genocide insurgency humanitarian
  intelligence espionage`.split(/\s+/),

  // ENVIRONMENT AND ENERGY
  ...`climate warming emissions carbon
  pollution environment energy
  electricity grid renewable solar
  wind coal oil gas petroleum
  pipeline drilling fracking
  wildfire drought hurricane
  tornado flooding flood earthquake
  disaster conservation water
  drought agriculture farming`.split(/\s+/),

  // TECHNOLOGY AND MEDIA
  ...`technology artificialintelligence
  ai algorithm censorship
  socialmedia tiktok youtube
  facebook instagram xplatform
  internet privacy data
  encryption cybersecurity
  hacking hacker leak
  misinformation disinformation
  propaganda journalism journalist
  media newspaper broadcaster
  streaming podcast`.split(/\s+/),

  // COUNTRIES AND GEOGRAPHIC ENTITIES
  ...`america usa unitedstates
  ukraine russia china taiwan
  israel palestine gaza iran iraq
  syria lebanon yemen
  mexico canada cuba venezuela
  europe germany france britain
  india pakistan northkorea
  southkorea afghanistan
  texas california florida
  newyork washington arizona
  georgia pennsylvania michigan
  wisconsin ohio nevada
  minnesota colorado illinois`.split(/\s+/),

  // PROMINENT POLITICAL FIGURES
  // Update this category as political figures change.
  ...`trump vance harris biden
  obama clinton bush
  sanders pelosi schumer
  jeffries johnson aoc ocasio
  desantis abbott newsom
  cruz paxton talarico
  musk thiel bezos
  putin zelensky netanyahu
  xi jinping macron
  merz starmer
  mcconnell rubio
  hegseth kennedy`.split(/\s+/)

]);


// 2. VARIATIONS AND ALIASES
// Maps alternate forms to a single canonical noun.

const NOUN_ALIASES = {

  // Elections
  elections: "election",
  electoral: "election",
  ballots: "ballot",
  voters: "voter",
  candidates: "candidate",
  primaries: "primary",
  caucuses: "caucus",
  midterms: "midterm",

  // Government
  senators: "senator",
  lawmakers: "legislation",
  laws: "law",
  bills: "bill",
  governors: "governor",
  presidents: "president",
  administrations: "administration",

  // Political groups
  democrats: "democrat",
  republicans: "republican",
  gop: "republican",
  progressives: "progressive",
  conservatives: "conservative",
  liberals: "liberal",
  socialists: "socialist",

  // Courts
  judges: "judge",
  lawsuits: "lawsuit",
  indictments: "indictment",
  convictions: "conviction",
  prosecutors: "prosecutor",
  scotus: "supremecourt",

  // Economy
  taxes: "tax",
  taxed: "tax",
  tariffs: "tariff",
  prices: "inflation",
  mortgages: "mortgage",
  banks: "bank",
  layoffs: "unemployment",

  // Immigration
  immigrants: "immigrant",
  migrants: "migrant",
  deportations: "deportation",
  refugees: "refugee",
  visas: "visa",

  // Health
  abortions: "abortion",
  vaccines: "vaccine",
  vaccinations: "vaccination",
  hospitals: "hospital",
  opioids: "opioid",

  // Education
  schools: "school",
  teachers: "teacher",
  students: "student",
  universities: "university",
  vouchers: "voucher",

  // Crime
  arrests: "arrest",
  prisons: "prison",
  murders: "murder",
  protests: "protest",
  protesters: "protest",
  crimes: "crime",

  // Foreign policy
  wars: "war",
  invasions: "invasion",
  missiles: "missile",
  drones: "drone",
  sanctions: "sanctions",
  treaties: "treaty",

  // Environment
  hurricanes: "hurricane",
  floods: "flood",
  wildfires: "wildfire",
  emissions: "emissions",

  // Geography
  ukrainian: "ukraine",
  ukrainians: "ukraine",
  russian: "russia",
  russians: "russia",
  chinese: "china",
  israeli: "israel",
  israelis: "israel",
  palestinian: "palestine",
  palestinians: "palestine",
  american: "america",
  americans: "america",
  us: "usa",
  unitedstates: "usa",

  // People
  donald: "trump",
  zelenskyy: "zelensky",
"ocasio-cortez": "ocasio",
  aoc: "ocasio"
};


// 3. SPELLING SIMILARITY
// Accept one insertion, deletion, or replacement.

function oneEditApart(a, b) {
  if (Math.abs(a.length - b.length) > 1) {
    return false;
  }

  let i = 0;
  let j = 0;
  let edits = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }

    edits++;

    if (edits > 1) {
      return false;
    }

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


// 4. NORMALIZE NEWS NOUNS

const NEWS_NOUN_ARRAY = [...NEWS_NOUNS];

function normalizeNewsNoun(word) {
  const raw = word.toLowerCase();

  // Explicit aliases first
  if (NOUN_ALIASES[raw]) {
    return NOUN_ALIASES[raw];
  }

  // Exact recognized noun
  if (NEWS_NOUNS.has(raw)) {
    return raw;
  }

  // Common plural endings
  const variants = [];

  if (raw.endsWith("ies")) {
    variants.push(raw.slice(0, -3) + "y");
  }

  if (raw.endsWith("es")) {
    variants.push(raw.slice(0, -2));
  }

  if (raw.endsWith("s") && !raw.endsWith("ss")) {
    variants.push(raw.slice(0, -1));
  }

  for (const variant of variants) {
    if (NEWS_NOUNS.has(variant)) {
      return variant;
    }

    if (NOUN_ALIASES[variant]) {
      return NOUN_ALIASES[variant];
    }
  }

  // Fuzzy match only longer, distinctive nouns.
  // Require exactly one candidate to avoid ambiguity.
  if (raw.length >= 6) {
    const candidates = NEWS_NOUN_ARRAY.filter(noun =>
      noun.length >= 6 &&
      noun[0] === raw[0] &&
      oneEditApart(raw, noun)
    );

    if (candidates.length === 1) {
      return candidates[0];
    }
  }

  // Not recognized as a news noun.
  return null;
}


// 5. EXTRACT RECOGNIZED NOUNS FROM A TITLE

function keywords(title) {
  const normalizedTitle = (title || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bwhite house\b/g, "whitehouse")
    .replace(/\bsupreme court\b/g, "supremecourt")
    .replace(/\bunited states\b/g, "unitedstates")
    .replace(/\bartificial intelligence\b/g, "artificialintelligence")
    .replace(/\bsocial media\b/g, "socialmedia")
    .replace(/\bnew york\b/g, "newyork");

  const words = normalizedTitle
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

  const found = new Set();

  for (const word of words) {
    const noun = normalizeNewsNoun(word);

    if (noun) {
      found.add(noun);
    }
  }

  return [...found];
}


// 6. SCORE TWO TITLES
// One shared recognized noun is sufficient.
// Additional shared nouns increase confidence.

function matchingScore(first, second) {
  const firstNouns = new Set(keywords(first.title));
  const secondNouns = new Set(keywords(second.title));

  let matches = 0;

  for (const noun of firstNouns) {
    if (secondNouns.has(noun)) {
      matches++;
    }
  }

  return matches;
}

/* ==========================================
   FIND BEST MATCHING VIDEO
   ========================================== */

function pickMatch(anchor, band, entries, used) {
  let best = null;
  let bestScore = 0;
  let bestGap = Infinity;

  const anchorDate = videoDate(anchor.video);
  const maxGap = 7 * 24 * 60 * 60 * 1000;

  for (const entry of entries) {

    // Do not match the anchor or a video already used.
    if (
      entry.index === anchor.index ||
      used.has(entry.index)
    ) {
      continue;
    }

    // Only consider the requested viewpoint column.
    if (bandFor(entry.video) !== band) {
      continue;
    }

    const candidateDate = videoDate(entry.video);

    const gap = anchorDate && candidateDate
      ? Math.abs(anchorDate - candidateDate)
      : Infinity;

    // Require dates within seven days.
    if (gap > maxGap) {
      continue;
    }

    // Compare recognized news nouns.
    const score = matchingScore(
      anchor.video,
      entry.video
    );

    // One shared noun qualifies.
    // Prefer more shared nouns, then closer dates.
    if (
      score > bestScore ||
      (
        score > 0 &&
        score === bestScore &&
        gap < bestGap
      )
    ) {
      best = entry;
      bestScore = score;
      bestGap = gap;
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


function appendBoardRow(
  slots,
  isDiscovery = false,
  leftExtras = [],
  rightExtras = []
) {
  const row = document.createElement("section");
  row.className = "spectrum-row" +
    (isDiscovery ? " spectrum-discovery" : "");

  const expanded =
    leftExtras.length > 0 || rightExtras.length > 0;

  if (expanded) {
    row.classList.add("spectrum-expanded");
  }

  row.setAttribute(
    "aria-label",
    isDiscovery
      ? "Discovery videos"
      : "Possible views on the same story"
  );

  // Additional Far-Left videos extend OUTWARD
  // from the leftmost original column.
  const cells = leftExtras.slice().reverse().map(entry => ({
    band: "Far-Left",
    entry,
    label: "Additional topic match"
  }));

  // Always preserve the five original columns.
  BANDS.forEach((band, i) => {
    cells.push({
      band,
      entry: slots[i],
      label: isDiscovery
        ? "Discovery"
        : i === 2
          ? "Center anchor"
          : "Possible topic match"
    });
  });

  // Additional Far-Right videos extend OUTWARD
  // from the rightmost original column.
  rightExtras.forEach(entry => {
    cells.push({
      band: "Far-Right",
      entry,
      label: "Additional topic match"
    });
  });

  cells.forEach(cell => {
    row.appendChild(
      makeSlot(cell.band, cell.entry, cell.label)
    );
  });

  gallery.appendChild(row);

  // Preserve keyboard navigation through
  // every matched video, including extra cards.
  const sequence = isDiscovery
    ? [0, 1, 2, 3, 4]
    : [2, 1, 3, 0, 4];

  for (const i of sequence) {
    if (slots[i]) {
      boardOrder.push(slots[i].index);
    }
  }

  [...leftExtras, ...rightExtras].forEach(entry => {
    boardOrder.push(entry.index);
  });

  // Keep the Center anchor visible initially.
  if (expanded) {
    requestAnimationFrame(() => {
      if (!row.isConnected) return;

      const center = row.querySelector(
        '.spectrum-slot[data-band="Center"]'
      );

      if (!center) return;

      const rowRect = row.getBoundingClientRect();
      const centerRect = center.getBoundingClientRect();

      row.scrollLeft +=
        centerRect.left +
        centerRect.width / 2 -
        rowRect.left -
        rowRect.width / 2;
    });
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

    
// Gather additional matching videos from either extreme.
// A video already assigned to a row cannot be reused.

function collectExtraMatches(band) {
  const extras = [];

  while (true) {
    const match = pickMatch(
      anchor,
      band,
      entries,
      used
    );

    if (!match) break;

    used.add(match.index);
    extras.push(match);
  }

  return extras;
}

const leftExtras = collectExtraMatches("Far-Left");
const rightExtras = collectExtraMatches("Far-Right");

appendBoardRow(
  slots,
  false,
  leftExtras,
  rightExtras
);


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


/* ==========================================
   SPECTRUM PUBLICATION TIME
   ========================================== */

// Calculate how long ago a video was published.

function relativePublished(timestamp) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 60000)
  );

  if (minutes < 1) {
    return "Just published";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    return remaining
      ? `${hours}h ${remaining}m ago`
      : `${hours}h ago`;
  }

  const days = Math.floor(minutes / 1440);

  return `${days}d ago`;
}

// Update the age badges without rebuilding cards.
// This avoids interrupting any playing video.

function updatePublishedAges() {
  document.querySelectorAll(".spectrum-age")
    .forEach(badge => {
      const timestamp = Number(
        badge.dataset.publishedAt
      );

      if (Number.isFinite(timestamp) && timestamp > 0) {
        badge.textContent = relativePublished(timestamp);
      }
    });
}

// Refresh every minute.

setInterval(updatePublishedAges, 60000);

// Publication-age badge styling.

style.textContent += `
  .spectrum-age {
    position: absolute;
    top: 9px;
    right: 9px;
    z-index: 2;

    display: inline-block;
    background: rgba(20, 30, 42, 0.92);
    color: white;

    padding: 6px 9px;
    border-radius: 6px;

    font-size: 11px;
    font-weight: 700;
    line-height: 1.2;
    white-space: nowrap;

    pointer-events: none;
  }
`;

