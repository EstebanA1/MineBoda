/*
 * Datos y fotos de la invitación.
 * Los valores del evento son una propuesta de muestra para revisar con la pareja.
 * Las rutas de fotos apuntan a WebP optimizados; los originales se conservan en por-revisar.
 */
const photoPath = (number) => `fotos/web/${String(number).padStart(2, "0")}.webp`;
const heroPhotoNumbers = new Set([3, 5, 10, 12, 14, 36, 43, 49, 51]);
const storyPhotoNumbers = new Set([4, 6, 8, 17, 21, 26]);
const galleryExcludedPhotoNumbers = new Set([...heroPhotoNumbers, ...storyPhotoNumbers, 9, 15, 20, 44, 52]);
// Alterna retratos y paisajes para que las fotos entren una a una en la historia.
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

const galleryScroll = document.querySelector("[data-gallery-scroll]");
const galleryMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const galleryStepRatio = 0.34;
const galleryTransitionStart = 0.28;
let galleryPhotos = [];
let galleryStage = null;
let galleryUpdateFrame = 0;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function createGalleryPhoto(photo, index) {
  const figure = document.createElement("figure");
  const orientation = photo.width / photo.height > 1.12 ? "landscape" : "portrait";
  figure.className = `gallery__photo gallery__photo--${orientation}`;
  figure.dataset.galleryIndex = String(index);
  figure.dataset.slot = String(index % 6);
  figure.setAttribute("aria-hidden", "true");

  const image = document.createElement("img");
  image.alt = photo.alt || `Fotografía ${String(photo.number).padStart(2, "0")} de Esteban y Nicole`;
  image.width = photo.width;
  image.height = photo.height;
  image.loading = "lazy";
  image.decoding = "async";
  image.dataset.gallerySrc = photo.src;
  figure.append(image);
  return figure;
}

function hydrateGalleryPhoto(photo) {
  photo?.querySelectorAll("img[data-gallery-src]").forEach((image) => {
    if (!image.hasAttribute("src")) {
      image.loading = "eager";
      image.src = image.dataset.gallerySrc;
    }
  });
}

function releaseGalleryPhoto(photo) {
  photo?.querySelectorAll("img[src][data-gallery-src]").forEach((image) => image.removeAttribute("src"));
}

function setGalleryPhotoFrame(photo, opacity, blur) {
  if (!photo) return;
  photo.style.setProperty("--photo-opacity", opacity.toFixed(3));
  photo.style.setProperty("--photo-blur", `${blur.toFixed(1)}px`);
  photo.style.setProperty("--photo-offset", `${((1 - opacity) * 14).toFixed(1)}px`);
  photo.classList.toggle("is-active", opacity > 0.01);
  photo.setAttribute("aria-hidden", String(opacity < 0.18));
}

function easeGalleryTransition(progress) {
  const easedInput = clamp((progress - galleryTransitionStart) / (1 - galleryTransitionStart), 0, 1);
  return easedInput * easedInput * (3 - 2 * easedInput);
}

function updateGalleryStory() {
  if (!galleryScroll || !galleryStage || !galleryPhotos.length) return;
  const bounds = galleryScroll.getBoundingClientRect();
  const stageHeight = galleryStage.offsetHeight || window.innerHeight;
  if (bounds.top >= window.innerHeight || bounds.bottom <= 0) {
    galleryPhotos.forEach((photo) => {
      releaseGalleryPhoto(photo);
      setGalleryPhotoFrame(photo, 0, 0);
    });
    return;
  }

  const photoCount = galleryPhotos.length;
  const progress = clamp(-bounds.top / (stageHeight * galleryStepRatio), 0, photoCount + 1);
  const currentIndex = Math.min(Math.floor(progress), photoCount - 1);
  const firstVisibleIndex = Math.max(0, currentIndex - 5);
  const lastLoadedIndex = Math.min(photoCount - 1, currentIndex + 1);
  for (let index = firstVisibleIndex; index <= lastLoadedIndex; index += 1) {
    hydrateGalleryPhoto(galleryPhotos[index]);
  }

  galleryPhotos.forEach((photo, index) => {
    if (index < firstVisibleIndex || index > lastLoadedIndex) releaseGalleryPhoto(photo);
  });

  if (galleryMotionPreference.matches) {
    const activeIndex = Math.min(Math.floor(progress), photoCount - 1);
    galleryPhotos.forEach((photo, index) => {
      const isVisible = index >= Math.max(0, activeIndex - 5) && index <= activeIndex;
      setGalleryPhotoFrame(photo, isVisible ? 1 : 0, 0);
    });
    return;
  }

  if (progress >= photoCount) {
    const finalFade = easeGalleryTransition(progress - photoCount);
    galleryPhotos.forEach((photo, index) => {
      const isVisible = index >= Math.max(0, photoCount - 6);
      setGalleryPhotoFrame(photo, isVisible ? 1 - finalFade : 0, isVisible ? finalFade * 12 : 0);
    });
    return;
  }

  const fraction = progress - currentIndex;
  const mix = easeGalleryTransition(fraction);
  const incomingIndex = currentIndex + 1;
  const outgoingIndex = currentIndex - 5;
  const canSwapOldestPhoto = currentIndex >= 5 && incomingIndex < photoCount;
  galleryPhotos.forEach((photo, index) => {
    let opacity = 0;
    let blur = 0;
    if (index === incomingIndex && incomingIndex < photoCount) {
      opacity = mix;
      blur = (1 - mix) * 12;
    } else if (canSwapOldestPhoto && index === outgoingIndex) {
      opacity = 1 - mix;
      blur = mix * 12;
    } else if (index >= (canSwapOldestPhoto ? currentIndex - 4 : firstVisibleIndex) && index <= currentIndex) {
      opacity = 1;
    }
    setGalleryPhotoFrame(photo, opacity, blur);
  });
}

function queueGalleryStoryUpdate() {
  if (galleryUpdateFrame) return;
  galleryUpdateFrame = window.requestAnimationFrame(() => {
    galleryUpdateFrame = 0;
    updateGalleryStory();
  });
}

function renderGallery() {
  if (!galleryScroll || !invitation.photos.gallery.length) return;
  galleryStage = document.createElement("div");
  galleryStage.className = "gallery__stage";
  galleryStage.setAttribute("role", "group");
  galleryStage.setAttribute("aria-label", "Fotografías de Esteban y Nicole, una a una");
  const photoLayer = document.createElement("div");
  photoLayer.className = "gallery__photo-layer";
  galleryPhotos = invitation.photos.gallery.map(createGalleryPhoto);
  galleryPhotos.forEach((photo) => photoLayer.append(photo));
  galleryStage.append(photoLayer);

  const steps = document.createElement("div");
  steps.className = "gallery__steps";
  steps.setAttribute("aria-hidden", "true");
  for (let index = 0; index < galleryPhotos.length + 1; index += 1) {
    const step = document.createElement("div");
    step.className = "gallery__step";
    step.style.height = `${galleryStepRatio * 100}svh`;
    steps.append(step);
  }

  galleryScroll.style.height = `${(galleryPhotos.length + 1) * galleryStepRatio * 100}svh`;
  galleryScroll.replaceChildren(galleryStage, steps);
  queueGalleryStoryUpdate();
}

renderGallery();
window.addEventListener("scroll", queueGalleryStoryUpdate, { passive: true });
window.addEventListener("resize", queueGalleryStoryUpdate);
galleryMotionPreference.addEventListener?.("change", queueGalleryStoryUpdate);

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
