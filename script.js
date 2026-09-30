/*
 * Datos y fotos de la invitación.
 * Los valores del evento son una propuesta de muestra para revisar con la pareja.
 * Las rutas de fotos apuntan a WebP optimizados; los originales se conservan en por-revisar.
 */
const photoPath = (number) => `fotos/web/${String(number).padStart(2, "0")}.webp`;
const heroPhotoNumbers = new Set([3, 5, 10, 12, 14, 36, 43, 49, 51]);
const storyPhotoNumbers = new Set([4, 6, 8, 17, 21, 26]);
const tallGalleryPhotoNumbers = new Set([7, 24, 32, 34, 45]);
const galleryExcludedPhotoNumbers = new Set([...heroPhotoNumbers, ...storyPhotoNumbers, 9, 15, 20, 44, 52]);
// Alterna retratos, paisajes y fotos destacadas para un mosaico tipo tetris.
const galleryOrder = [29, 1, 46, 7, 13, 50, 22, 23, 24, 30, 39, 32, 2, 45, 27, 53, 18, 56, 34, 41, 25, 47, 54, 31, 16, 33, 48, 19, 35, 11, 28, 38, 40, 55, 42, 37];
// Medidas de los WebP para reservar la proporción de cada mosaico antes de la carga diferida.
const galleryPhotoDimensions = {
  1: [1650, 2200], 2: [899, 1599], 7: [1200, 1600], 11: [1200, 1600],
  13: [1200, 1600], 16: [1650, 2200], 18: [1650, 2200], 19: [1650, 2200],
  22: [2200, 1650], 23: [2200, 1238], 24: [1017, 2200], 25: [1650, 2200], 27: [1650, 2200],
  28: [1080, 1920], 29: [1080, 1920], 30: [1080, 1920], 31: [1080, 1920],
  32: [1080, 1920], 33: [1080, 1920], 34: [1239, 2200], 35: [1080, 1920],
  37: [1650, 2200], 38: [1647, 2200], 39: [2200, 1647], 40: [1647, 2200],
  41: [1650, 2200], 42: [1170, 2080], 45: [1239, 2200], 46: [2200, 1650],
  47: [1650, 2200], 48: [1650, 2200], 49: [1080, 1920], 50: [1080, 1920],
  53: [1239, 2200], 54: [899, 1599], 55: [944, 1666], 56: [1672, 941]
};

const invitation = {
  eventDate: "2027-02-13T18:00:00-03:00",
  deadline: "2026-12-13T23:59:59-03:00",
  timezone: "America/Santiago",
  names: "Esteban y Nicole",
  venue: "Espacio Los Aromos",
  place: "Espacio Los Aromos, Lagunillas, Coronel, Chile",
  photos: {
    story: [
      { src: photoPath(4), alt: "Esteban y Nicole compartiendo un momento especial" },
      { src: photoPath(6), alt: "Esteban y Nicole posando juntos durante una salida" },
      { src: photoPath(8), alt: "Esteban y Nicole jugando en la playa" },
      { src: photoPath(17), alt: "Esteban y Nicole abrazados al aire libre" },
      { src: photoPath(21), alt: "Esteban y Nicole disfrutando un atardecer en la playa" },
      { src: photoPath(26), alt: "Esteban y Nicole con lentes de sol durante un paseo" }
    ],
    details: { src: photoPath(9), alt: "Esteban y Nicole junto al mar" },
    dress: { src: photoPath(15), alt: "Esteban y Nicole en una ocasión formal" },
    rsvp: { src: photoPath(52), alt: "Esteban y Nicole en una selfie al aire libre" },
    gallery: galleryOrder
      .filter((number) => !galleryExcludedPhotoNumbers.has(number))
      .map((number) => ({
        number,
        width: galleryPhotoDimensions[number][0],
        height: galleryPhotoDimensions[number][1],
        src: number === 56 ? "fotos/web/56-horizontal.webp" : photoPath(number),
        alt: `Fotografía ${String(number).padStart(2, "0")} de Esteban y Nicole`
      }))
  }
};

function dateParts(date) {
  return Object.fromEntries(new Intl.DateTimeFormat("es-CL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: invitation.timezone
  }).formatToParts(date).map(({ type, value }) => [type, value]));
}

function setDateText(selector, value, uppercase = false) {
  document.querySelectorAll(selector).forEach((node) => {
    node.textContent = uppercase ? value.toLocaleUpperCase("es-CL") : value;
  });
}

function setSinglePhoto(frameName, source, alt) {
  const frame = document.querySelector(`[data-photo-frame="${frameName}"]`);
  if (!frame || !source) return;
  const image = frame.querySelector(".photo-frame__image");
  if (!image) return;
  image.alt = alt;
  image.addEventListener("load", () => frame.classList.add("has-photo"), { once: true });
  image.addEventListener("error", () => frame.classList.remove("has-photo"), { once: true });
  image.src = source;
  if (image.complete && image.naturalWidth > 0) frame.classList.add("has-photo");
}

const storyFrame = document.querySelector('[data-photo-frame="story"]');
const storyLayers = storyFrame ? [...storyFrame.querySelectorAll(".story__image")] : [];
const storySection = storyFrame?.closest(".story");
const chapters = [...document.querySelectorAll("[data-story-step]")];
let visibleStoryLayer = -1;
let requestedStoryIndex = -1;
let storyLoadVersion = 0;
let activeStoryStep = -1;
let storyUpdateFrame = 0;
let storyPhotosPreloaded = false;
const storyPhotoPreloads = [];

function preloadStoryPhotos() {
  if (storyPhotosPreloaded) return;
  storyPhotosPreloaded = true;
  invitation.photos.story.forEach(({ src }) => {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
    storyPhotoPreloads.push(image);
  });
}

function setStoryPhoto(photo, index) {
  if (!storyFrame || !photo?.src || storyLayers.length < 2 || index === requestedStoryIndex) return;
  requestedStoryIndex = index;
  const requestVersion = ++storyLoadVersion;
  const nextIndex = visibleStoryLayer === 0 ? 1 : 0;
  const nextLayer = storyLayers[nextIndex];
  let didReveal = false;
  const reveal = () => {
    if (didReveal || requestVersion !== storyLoadVersion) return;
    didReveal = true;
    nextLayer.classList.add("is-visible");
    if (visibleStoryLayer >= 0) storyLayers[visibleStoryLayer].classList.remove("is-visible");
    visibleStoryLayer = nextIndex;
    storyFrame.classList.add("has-photo");
  };
  nextLayer.alt = photo.alt || `Fotografía destacada ${String(index + 1).padStart(2, "0")}`;
  nextLayer.onload = reveal;
  nextLayer.onerror = () => {
    if (requestVersion === storyLoadVersion) requestedStoryIndex = -1;
  };
  nextLayer.src = photo.src;
  if (nextLayer.complete && nextLayer.naturalWidth > 0) reveal();
}

function updateStoryScene() {
  if (!storySection || !chapters.length) return;
  const sectionBounds = storySection.getBoundingClientRect();
  if (sectionBounds.bottom <= 0 || sectionBounds.top >= window.innerHeight) return;
  preloadStoryPhotos();

  const viewportCenter = window.innerHeight / 2;
  const distances = chapters.map((chapter) => {
    const bounds = chapter.getBoundingClientRect();
    return Math.abs(bounds.top + bounds.height / 2 - viewportCenter);
  });
  let nextStep = distances.reduce((best, distance, index) => (
    distance < distances[best] ? index : best
  ), 0);
  const hysteresis = Math.min(window.innerHeight * 0.08, 80);
  if (activeStoryStep >= 0 && nextStep !== activeStoryStep
      && distances[nextStep] + hysteresis >= distances[activeStoryStep]) {
    nextStep = activeStoryStep;
  }
  if (nextStep === activeStoryStep) return;

  activeStoryStep = nextStep;
  chapters.forEach((chapter, index) => chapter.classList.toggle("is-current", index === nextStep));
  setStoryPhoto(invitation.photos.story[nextStep], nextStep);
}

function queueStoryUpdate() {
  if (storyUpdateFrame) return;
  storyUpdateFrame = window.requestAnimationFrame(() => {
    storyUpdateFrame = 0;
    updateStoryScene();
  });
}

if (storySection && chapters.length) {
  window.addEventListener("scroll", queueStoryUpdate, { passive: true });
  window.addEventListener("resize", queueStoryUpdate);
  queueStoryUpdate();
}

const siteHeader = document.querySelector(".site-header");
const heroSection = document.querySelector(".hero");
if (siteHeader && heroSection) {
  if ("IntersectionObserver" in window) {
    const headerObserver = new IntersectionObserver(([entry]) => {
      siteHeader.classList.toggle("is-past-hero", !entry.isIntersecting);
    }, { threshold: 0 });
    headerObserver.observe(heroSection);
  } else {
    siteHeader.classList.add("is-past-hero");
  }
}

document.querySelectorAll("[data-collage-number]").forEach((image) => {
  image.src = photoPath(Number(image.dataset.collageNumber));
});
setSinglePhoto("details", invitation.photos.details.src, invitation.photos.details.alt);
setSinglePhoto("dress", invitation.photos.dress.src, invitation.photos.dress.alt);
setSinglePhoto("rsvp", invitation.photos.rsvp.src, invitation.photos.rsvp.alt);

function renderGallery() {
  const grid = document.querySelector("[data-gallery-grid]");
  if (!grid || !invitation.photos.gallery.length) return;
  grid.replaceChildren();
  invitation.photos.gallery.forEach((photo, index) => {
    const figure = document.createElement("figure");
    figure.className = "gallery__item";
    figure.dataset.scrollReveal = "";
    figure.dataset.photoNumber = String(photo.number);
    if (tallGalleryPhotoNumbers.has(photo.number)) figure.classList.add("gallery__item--tall");
    if (photo.number === 23 || photo.number === 46 || photo.number === 56) figure.classList.add("gallery__item--landscape");
    if (photo.number === 46) figure.classList.add("gallery__item--uncropped");
    const image = document.createElement("img");
    image.alt = photo.alt || `Fotografía ${index + 1} de Esteban y Nicole`;
    image.width = photo.width;
    image.height = photo.height;
    image.loading = "lazy";
    image.decoding = "async";
    image.src = photo.src;
    figure.append(image);
    grid.append(figure);
  });
  sizeGalleryItems(grid);
}

function sizeGalleryItems(grid) {
  if (!grid?.clientWidth) return;
  const gridStyle = getComputedStyle(grid);
  const columns = gridStyle.gridTemplateColumns.split(" ").length;
  const columnGap = Number.parseFloat(gridStyle.columnGap) || 0;
  const rowGap = Number.parseFloat(gridStyle.rowGap) || 0;
  const rowUnit = Number.parseFloat(gridStyle.gridAutoRows) || 2;
  const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const minTileHeight = rootFontSize * 8;
  const doubleTileHeight = rootFontSize * (window.matchMedia("(min-width: 700px)").matches ? 15 : 11);
  const columnWidth = (grid.clientWidth - columnGap * (columns - 1)) / columns;

  grid.querySelectorAll(".gallery__item").forEach((figure) => {
    const photoNumber = Number(figure.dataset.photoNumber);
    const photo = invitation.photos.gallery.find((item) => item.number === photoNumber);
    if (!photo) return;
    const columnSpan = figure.classList.contains("gallery__item--landscape") ? 2 : 1;
    const photoWidth = columnWidth * columnSpan + columnGap * (columnSpan - 1);
    const naturalHeight = photoWidth * photo.height / photo.width;
    const desiredHeight = tallGalleryPhotoNumbers.has(photoNumber)
      ? doubleTileHeight * 2 + rowGap
      : Math.max(minTileHeight, naturalHeight);
    const rowSpan = Math.max(1, Math.ceil((desiredHeight + rowGap) / (rowUnit + rowGap)));
    figure.style.gridColumnEnd = `span ${columnSpan}`;
    figure.style.gridRowEnd = `span ${rowSpan}`;
  });
}

let gallerySizeFrame = 0;
window.addEventListener("resize", () => {
  if (gallerySizeFrame) return;
  gallerySizeFrame = window.requestAnimationFrame(() => {
    gallerySizeFrame = 0;
    const grid = document.querySelector("[data-gallery-grid]");
    if (grid) sizeGalleryItems(grid);
  });
}, { passive: true });

renderGallery();

const galleryItems = document.querySelectorAll("[data-scroll-reveal]");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -7% 0px" });
  galleryItems.forEach((item) => revealObserver.observe(item));
} else {
  galleryItems.forEach((item) => item.classList.add("is-visible"));
}

const countdownTarget = new Date(invitation.eventDate).getTime();
const countdownParts = {
  days: document.querySelector("[data-countdown-days]"),
  hours: document.querySelector("[data-countdown-hours]"),
  minutes: document.querySelector("[data-countdown-minutes]"),
  seconds: document.querySelector("[data-countdown-seconds]")
};

function updateCountdown() {
  const remaining = Math.max(0, countdownTarget - Date.now());
  const values = {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining % 86400000) / 3600000),
    minutes: Math.floor((remaining % 3600000) / 60000),
    seconds: Math.floor((remaining % 60000) / 1000)
  };
  Object.entries(values).forEach(([key, value]) => {
    if (countdownParts[key]) countdownParts[key].textContent = String(value).padStart(key === "days" ? 3 : 2, "0");
  });
}
updateCountdown();
window.setInterval(updateCountdown, 1000);

const eventTime = new Date(invitation.eventDate);
const eventDateParts = dateParts(eventTime);
const weekdayLabel = eventDateParts.weekday.charAt(0).toLocaleUpperCase("es-CL") + eventDateParts.weekday.slice(1);
const mapLink = document.querySelector("[data-map-link]");
if (mapLink) mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(invitation.place)}`;

setDateText("[data-event-weekday]", weekdayLabel);
setDateText("[data-event-day]", eventDateParts.day);
setDateText("[data-event-month]", eventDateParts.month);
setDateText("[data-event-year]", eventDateParts.year);
setDateText("[data-venue]", invitation.venue);
const deadlineParts = dateParts(new Date(invitation.deadline));
const deadlineString = `${deadlineParts.day} de ${deadlineParts.month} de ${deadlineParts.year}`;
setDateText("[data-deadline-text]", deadlineString);
setDateText("[data-deadline-inline]", `${deadlineParts.day} de ${deadlineParts.month}`);

const musicDock = document.querySelector("[data-music-dock]");
const musicToggle = musicDock?.querySelector("[data-music-toggle]");
const weddingMusic = musicDock?.querySelector("[data-wedding-music]");
const musicStatus = musicDock?.querySelector("[data-music-status]");
const musicIcon = musicDock?.querySelector("[data-music-icon]");
let musicGestureListenersInstalled = false;

function setMusicStatus(message) {
  if (musicStatus) musicStatus.textContent = message;
}

function updateMusicDock() {
  if (!musicDock || !weddingMusic) return;
  const isPlaying = !weddingMusic.paused && !weddingMusic.ended;
  musicDock.classList.toggle("is-playing", isPlaying);
  musicToggle?.setAttribute("aria-pressed", String(isPlaying));
  musicToggle?.setAttribute("aria-label", `${isPlaying ? "Pausar" : "Reanudar"} Volví a Nacer`);
  if (musicIcon) musicIcon.textContent = isPlaying ? "Ⅱ" : "♫";
}

function removeMusicGestureListeners() {
  musicGestureListenersInstalled = false;
  document.removeEventListener("pointerdown", retryMusicAfterGesture, true);
  document.removeEventListener("keydown", retryMusicAfterGesture, true);
}

function retryMusicAfterGesture(event) {
  if (event.target instanceof Element && event.target.closest("[data-music-toggle]")) return;
  removeMusicGestureListeners();
  if (weddingMusic?.paused && !weddingMusic.error) void attemptMusicPlayback();
}

function waitForMusicGesture() {
  if (musicGestureListenersInstalled) return;
  musicGestureListenersInstalled = true;
  document.addEventListener("pointerdown", retryMusicAfterGesture, true);
  document.addEventListener("keydown", retryMusicAfterGesture, true);
}

async function attemptMusicPlayback() {
  if (!weddingMusic) return false;
  try {
    await weddingMusic.play();
    musicDock?.classList.remove("needs-gesture", "needs-file");
    setMusicStatus("Reproduciendo Volví a Nacer.");
    updateMusicDock();
    return true;
  } catch (error) {
    if (weddingMusic.error || error?.name === "NotSupportedError") {
      musicDock?.classList.add("needs-file");
      setMusicStatus("Añade la canción como audio/volvi-a-nacer.mp3 para reproducirla.");
    } else if (error?.name === "NotAllowedError") {
      musicDock?.classList.add("needs-gesture");
      setMusicStatus("El navegador bloqueó el inicio automático. Toca la página o el botón ♫ para iniciar la canción.");
      waitForMusicGesture();
    } else {
      setMusicStatus("No se pudo iniciar la música. Abre los controles para intentarlo otra vez.");
    }
    return false;
  }
}

if (musicDock && musicToggle && weddingMusic) {
  musicToggle.addEventListener("click", () => {
    if (weddingMusic.paused) {
      void attemptMusicPlayback();
    } else {
      weddingMusic.pause();
    }
  });
  weddingMusic.addEventListener("play", () => {
    musicDock.classList.remove("needs-gesture", "needs-file");
    removeMusicGestureListeners();
    setMusicStatus("Reproduciendo Volví a Nacer.");
    updateMusicDock();
  });
  weddingMusic.addEventListener("pause", () => {
    if (weddingMusic.currentTime > 0) setMusicStatus("Canción en pausa.");
    updateMusicDock();
  });
  weddingMusic.addEventListener("error", () => {
    musicDock.classList.add("needs-file");
    setMusicStatus("No está el archivo audio/volvi-a-nacer.mp3. Coloca ahí una copia de audio que tengas permiso para usar.");
  });
  updateMusicDock();
  waitForMusicGesture();
  window.setTimeout(() => {
    if (weddingMusic.paused && !weddingMusic.error) void attemptMusicPlayback();
  }, 500);
}

// Make the photo transitions calm and readable for visitors who prefer reduced motion.
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.classList.add("reduce-motion");
}
