
"use strict";

/*
  SPECTRUM VIDEO DASHBOARD
  ------------------------
  Features:
  - Load videos from videos.json
  - Filter by political category and platform
  - Search titles and creators
  - Sort chronologically
  - Play YouTube videos inside the gallery
  - Stop the previous video when another opens
  - Arrow Down: next video
  - Arrow Up: previous video
  - Escape: close player
  - On-screen navigation controls
*/

// --------------------------------------------------
// 1. ELEMENTS AND STATE
// --------------------------------------------------

const gallery = document.getElementById("gallery");
const summary = document.getElementById("summary");
const category = document.getElementById("category");
const platform = document.getElementById("platform");
const search = document.getElementById("search");
const sort = document.getElementById("sort");

let videos = [];
let visibleVideos = [];
let activeIndex = -1;


// --------------------------------------------------
// 2. PLAYER NAVIGATION STYLING
// --------------------------------------------------

const navigationStyles = document.createElement("style");

navigationStyles.textContent = `
  .spectrum-controls {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: #ffffff;
    border: 1px solid #d5d9df;
    border-radius: 12px;
    box-shadow: 0 5px 25px rgba(0,0,0,0.15);
  }

  .spectrum-controls[hidden] {
    display: none;
  }

  .spectrum-controls button {
    background: #f6f7f8;
    color: #222a33;
    border: 1px solid #d5d9df;
    border-radius: 7px;
    padding: 9px 13px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .spectrum-controls button:hover:not(:disabled) {
    background: #e6e9ed;
  }

  .spectrum-controls button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .spectrum-controls button:focus-visible {
    outline: 3px solid #4d78b2;
    outline-offset: 2px;
  }

  .spectrum-controls .close-player {
    color: #a52734;
  }

  .spectrum-count {
    font-size: 12px;
    color: #68717d;
    white-space: nowrap;
  }

  .card.active-video {
    outline: 2px solid #34495e;
    outline-offset: 2px;
  }

  .spectrum-player {
    width: 100%;
    aspect-ratio: 9 / 12;
    height: auto;
    display: block;
    border: none;
    background: black;
  }

  @media (max-width: 600px) {
    .spectrum-controls {
      bottom: 10px;
      width: calc(100% - 20px);
      justify-content: center;
      gap: 6px;
      padding: 8px;
    }

    .spectrum-controls button {
      padding: 9px;
      font-size: 12px;
    }

    .spectrum-count {
      font-size: 11px;
    }
  }
`;

document.head.appendChild(navigationStyles);


// --------------------------------------------------
// 3. CREATE PLAYER NAVIGATION CONTROLS
// --------------------------------------------------

const controls = document.createElement("nav");
controls.className = "spectrum-controls";
controls.setAttribute("aria-label", "Video navigation");
controls.hidden = true;

const previousButton = document.createElement("button");
previousButton.type = "button";
previousButton.textContent = "↑ Previous";

const videoCounter = document.createElement("span");
videoCounter.className = "spectrum-count";

const nextButton = document.createElement("button");
nextButton.type = "button";
nextButton.textContent = "Next ↓";

const stopButton = document.createElement("button");
stopButton.type = "button";
stopButton.textContent = "✕ Stop";
stopButton.className = "close-player";

controls.append(
  previousButton,
  videoCounter,
  nextButton,
  stopButton
);

document.body.appendChild(controls);


// --------------------------------------------------
// 4. UTILITIES
// --------------------------------------------------

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
  const value =
    video.published_at ||
    video.published ||
    "";

  const time = Date.parse(value);

  return Number.isFinite(time) ? time : 0;
}

function makeText(tag, value, className) {
  const element = document.createElement(tag);

  element.textContent = value;

  if (className) {
    element.className = className;
  }

  return element;
}


// --------------------------------------------------
// 5. GET YOUTUBE VIDEO ID
// --------------------------------------------------

function getYouTubeId(video) {
  const urlString = safeURL(video.url);

  if (!urlString) return null;

  try {
    const url = new URL(urlString);
    let id = null;

    if (
      [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com"
      ].includes(url.hostname)
    ) {
      if (url.pathname === "/watch") {
        id = url.searchParams.get("v");
      } else if (
        url.pathname.startsWith("/shorts/") ||
        url.pathname.startsWith("/embed/")
      ) {
        id = url.pathname.split("/")[2];
      }
    } else if (url.hostname === "youtu.be") {
      id = url.pathname.slice(1);
    }

    if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) {
      return id;
    }

    return null;
  } catch {
    return null;
  }
}


// --------------------------------------------------
// 6. BUILD INDIVIDUAL VIDEO CARD
// --------------------------------------------------

function makeCard(video, index) {
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
    link.appendChild(
      makeText("div", "Video", "no-image")
    );
  }

  const content = makeText(
    "div",
    "",
    "card-content"
  );

  const categoryLabel = makeText(
    "div",
    video.category || "Unclassified",
    "category"
  );

  content.appendChild(categoryLabel);

  const heading = makeText(
    "div",
    "",
    "video-title"
  );

  const titleLink = makeText(
    "a",
    video.title || "Untitled video"
  );

  titleLink.href = link.href;
  titleLink.target = "_blank";
  titleLink.rel = "noopener noreferrer";

  heading.appendChild(titleLink);
  content.appendChild(heading);

  const date = videoDate(video);

  const dateText = date
    ? new Date(date).toLocaleDateString()
    : "Date unknown";

  const metadata = makeText(
    "div",
    `${video.creator || "Unknown creator"} · ` +
    `${video.platform || "Video"} · ${dateText}`,
    "metadata"
  );

  content.appendChild(metadata);

  card.append(link, content);

  return card;
}


// --------------------------------------------------
// 7. FILTER AND SORT VIDEOS
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

    const searchableText =
      `${video.title || ""} ${video.creator || ""}`
        .toLowerCase();

    const matchesSearch =
      !query || searchableText.includes(query);

    return (
      matchesCategory &&
      matchesPlatform &&
      matchesSearch
    );
  });

  visibleVideos.sort((a, b) => {
    if (sort.value === "oldest") {
      return videoDate(a) - videoDate(b);
    }

    return videoDate(b) - videoDate(a);
  });

  stopVideo(false);
  renderGallery();
}


// --------------------------------------------------
// 8. RENDER VIDEO GALLERY
// --------------------------------------------------

function renderGallery() {
  gallery.replaceChildren();

  summary.textContent =
    `${visibleVideos.length} videos · Chronological ordering`;

  if (!visibleVideos.length) {
    const message = videos.length
      ? "No videos match these filters."
      : "No videos collected yet.";

    gallery.appendChild(
      makeText("div", message, "message")
    );

    return;
  }

  visibleVideos.forEach((video, index) => {
    gallery.appendChild(makeCard(video, index));
  });
}


// --------------------------------------------------
// 9. FIND NEXT PLAYABLE VIDEO
// --------------------------------------------------

function findPlayableIndex(start, direction) {
  let index = start + direction;

  while (
    index >= 0 &&
    index < visibleVideos.length
  ) {
    if (getYouTubeId(visibleVideos[index])) {
      return index;
    }

    index += direction;
  }

  return -1;
}


// --------------------------------------------------
// 10. PLAY SELECTED VIDEO
// --------------------------------------------------

function playVideo(index) {
  if (
    index < 0 ||
    index >= visibleVideos.length
  ) {
    return;
  }

  const video = visibleVideos[index];
  const videoId = getYouTubeId(video);

  if (!videoId) {
    return;
  }

  /*
    Re-rendering removes any existing iframe.
    Removing an iframe stops its playback.
    This guarantees only one active player.
  */

  renderGallery();

  activeIndex = index;

  const cards = gallery.querySelectorAll(".card");
  const activeCard = cards[index];

  if (!activeCard) return;

  const thumbnail = activeCard.querySelector(".thumbnail");

  if (!thumbnail) return;

  const player = document.createElement("iframe");

  player.className = "spectrum-player";

  player.src =
    "https://www.youtube-nocookie.com/embed/" +
    encodeURIComponent(videoId) +
    "?controls=1&playsinline=1&autoplay=1";

  player.title =
    "YouTube video player: " +
    (video.title || "Untitled");

  player.allow =
    "autoplay; encrypted-media; picture-in-picture; fullscreen";

  player.allowFullscreen = true;

  player.referrerPolicy =
    "strict-origin-when-cross-origin";

  thumbnail.replaceWith(player);

  activeCard.classList.add("active-video");

  controls.hidden = false;

  updateNavigation();

  activeCard.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}


// --------------------------------------------------
// 11. UPDATE NAVIGATION CONTROLS
// --------------------------------------------------

function updateNavigation() {
  videoCounter.textContent =
    `${activeIndex + 1} / ${visibleVideos.length}`;

  previousButton.disabled =
    findPlayableIndex(activeIndex, -1) === -1;

  nextButton.disabled =
    findPlayableIndex(activeIndex, 1) === -1;
}


// --------------------------------------------------
// 12. STOP CURRENT VIDEO
// --------------------------------------------------

function stopVideo(redraw = true) {
  const wasPlaying = activeIndex !== -1;

  activeIndex = -1;
  controls.hidden = true;

  /*
    Re-rendering removes the YouTube iframe,
    stopping video and audio playback.
  */

  if (redraw && wasPlaying) {
    renderGallery();
  }
}


// --------------------------------------------------
// 13. NEXT AND PREVIOUS VIDEO
// --------------------------------------------------

function nextVideo() {
  const nextIndex = findPlayableIndex(
    activeIndex,
    1
  );

  if (nextIndex !== -1) {
    playVideo(nextIndex);
  }
}

function previousVideo() {
  const previousIndex = findPlayableIndex(
    activeIndex,
    -1
  );

  if (previousIndex !== -1) {
    playVideo(previousIndex);
  }
}


// --------------------------------------------------
// 14. CLICK THUMBNAIL TO PLAY
// --------------------------------------------------

gallery.addEventListener("click", function(event) {
  if (!(event.target instanceof Element)) {
    return;
  }

  const thumbnail = event.target.closest("a.thumbnail");

  if (!thumbnail) return;

  const card = thumbnail.closest(".card");

  if (!card) return;

  const index = Number(card.dataset.index);

  if (!Number.isInteger(index)) return;

  const video = visibleVideos[index];

  if (!video || !getYouTubeId(video)) {
    return;
  }

  event.preventDefault();

  playVideo(index);
});


// --------------------------------------------------
// 15. ON-SCREEN BUTTONS
// --------------------------------------------------

previousButton.addEventListener("click", () => {
  previousVideo();
});

nextButton.addEventListener("click", () => {
  nextVideo();
});

stopButton.addEventListener("click", () => {
  stopVideo();
});


// --------------------------------------------------
// 16. KEYBOARD NAVIGATION
// --------------------------------------------------

document.addEventListener("keydown", function(event) {
  /*
    Do not override keyboard navigation inside
    search boxes, dropdowns, or editable fields.
  */

  if (
    event.target instanceof Element &&
    event.target.closest(
      "input, textarea, select, [contenteditable='true']"
    )
  ) {
    return;
  }

  if (event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }

  if (event.key === "ArrowDown") {
    const nextIndex = findPlayableIndex(
      activeIndex,
      1
    );

    if (nextIndex !== -1) {
      event.preventDefault();
      playVideo(nextIndex);
    }
  }

  if (event.key === "ArrowUp") {
    const start = activeIndex === -1
      ? visibleVideos.length
      : activeIndex;

    const previousIndex = findPlayableIndex(
      start,
      -1
    );

    if (previousIndex !== -1) {
      event.preventDefault();
      playVideo(previousIndex);
    }
  }

  if (event.key === "Escape") {
    if (activeIndex !== -1) {
      event.preventDefault();
      stopVideo();
    }
  }
});


// --------------------------------------------------
// 17. FILTER EVENTS
// --------------------------------------------------

[
  category,
  platform,
  search,
  sort
].forEach(control => {
  control.addEventListener("input", applyFilters);
});


// --------------------------------------------------
// 18. FETCH VIDEO DATA
// --------------------------------------------------

async function loadVideos() {
  try {
    const response = await fetch(
      "./videos.json",
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data = await response.json();

    videos = Array.isArray(data)
      ? data
      : Array.isArray(data.videos)
        ? data.videos
        : [];

    applyFilters();

    console.log(
      `Spectrum: Loaded ${videos.length} videos.`
    );
  } catch (error) {
    console.error(
      "Spectrum: Unable to load videos.",
      error
    );

    videos = [];
    visibleVideos = [];

    gallery.replaceChildren();

    summary.textContent =
      "Unable to load the video archive.";

    gallery.appendChild(
      makeText(
        "div",
        "Video data could not be loaded. Check videos.json and the deployment.",
        "message"
      )
    );
  }
}


// --------------------------------------------------
// 19. INITIALIZE
// --------------------------------------------------

loadVideos();
