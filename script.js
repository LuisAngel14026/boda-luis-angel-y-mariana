const CONFIG = {
  weddingDate: new Date('2027-01-09T17:00:00-06:00'),
  galleryCount: 5,
  galleryFallback: 'assets/images/galeria-1.jpg',
  amazonUrl: 'https://www.amazon.com.mx/wedding/guest-view/32YBN92ETQM34'
};

/* ============================================================
   MESA DE REGALOS — EDITA AQUÍ TUS DATOS
   Por ahora se dejan números de ejemplo.
============================================================ */
const GIFT_DATA = {
  banks: [
    {
      owner: 'Luis Ángel',
      bank: 'BANAMEX',
      clabe: '002496702162009671',
      card: '5204166176174094'
    },
    {
      owner: 'Mariana',
      bank: 'BBVA',
      clabe: '012513015548029217',
      card: '4152314064455812'
    }
  ]
};

/* ---------------- PRELOADER ---------------- */
const preloader = document.getElementById('preloader');

/* 5.7 s: alcanza a apreciarse el corazón, varios latidos y
   prácticamente una vuelta completa de la lucecita dorada. */
const PRELOADER_DURATION = 5700;
const preloaderStartedAt = performance.now();

function hidePreloader() {
  if (!preloader || preloader.classList.contains('is-hidden')) return;
  document.body.classList.remove('is-loading');
  preloader.classList.add('is-hidden');
  setTimeout(() => preloader.remove(), 850);
}

/* El loader tiene duración fija y NO espera a las fotografías. */
setTimeout(hidePreloader, PRELOADER_DURATION);

/* Si el navegador restaura la página desde memoria (atrás/adelante),
   respeta el tiempo restante en lugar de ocultarlo casi de inmediato. */
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  const elapsed = performance.now() - preloaderStartedAt;
  const remaining = Math.max(0, PRELOADER_DURATION - elapsed);
  setTimeout(hidePreloader, remaining);
});

/* ---------------- AOS ---------------- */
if (window.AOS) {
  AOS.init({
    duration: 1050,
    once: false,
    mirror: true,
    offset: 58,
    easing: 'cubic-bezier(.16,.84,.32,1)'
  });
  window.addEventListener('pageshow', () => AOS.refreshHard());
}

/* ---------------- MUSIC ---------------- */
const musicButton = document.getElementById('musicButton');
const music = document.getElementById('backgroundMusic');
function syncMusicButton() {
  const playing = !music.paused;
  musicButton.classList.toggle('is-playing', playing);
  musicButton.setAttribute('aria-pressed', String(playing));
  musicButton.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproducir música');
}
musicButton.addEventListener('click', async () => {
  try {
    if (music.paused) await music.play();
    else music.pause();
  } catch (err) {
    showToast('Agrega tu MP3 en assets/audio/cancion-instrumental.mp3');
  }
  syncMusicButton();
});
music.addEventListener('play', syncMusicButton);
music.addEventListener('pause', syncMusicButton);

/* ---------------- COUNTDOWN ---------------- */
const countdown = {
  days: document.getElementById('days'),
  hours: document.getElementById('hours'),
  minutes: document.getElementById('minutes'),
  seconds: document.getElementById('seconds')
};
function updateCountdown() {
  const diff = CONFIG.weddingDate.getTime() - Date.now();
  if (diff <= 0) {
    countdown.days.textContent = '000';
    countdown.hours.textContent = '00';
    countdown.minutes.textContent = '00';
    countdown.seconds.textContent = '00';
    return;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  countdown.days.textContent = String(d).padStart(3, '0');
  countdown.hours.textContent = String(h).padStart(2, '0');
  countdown.minutes.textContent = String(m).padStart(2, '0');
  countdown.seconds.textContent = String(s).padStart(2, '0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

/* ---------------- GALLERY ---------------- */
/*
  Optimización V3.4
  - La página NO descarga las 19 fotos al abrir.
  - Cuando el usuario se acerca a la galería, precarga las primeras.
  - Después carga el resto de manera progresiva en tiempos ociosos.
  - Si existen galeria-1.webp ... galeria-19.webp, usa esas versiones.
  - Si todavía no existen, vuelve automáticamente a los JPG originales.
*/
const gallerySlides = document.getElementById('gallerySlides');
const gallerySection = document.getElementById('galeria');
const galleryImages = [];

for (let i = 1; i <= CONFIG.galleryCount; i += 1) {
  const slide = document.createElement('div');
  slide.className = 'swiper-slide';

  slide.innerHTML = `
    <figure class="gallery-card">
      <span class="gallery-photo-loader" aria-hidden="true"></span>
      <img
        alt="Luis Ángel y Mariana — fotografía ${i}"
        decoding="async"
        loading="lazy"
        fetchpriority="low"
        data-index="${i}"
      >
    </figure>`;

  const img = slide.querySelector('img');

  img.addEventListener('load', () => {
    img.classList.add('is-loaded');
    img.closest('.gallery-card')?.classList.add('is-loaded');
  });

  img.addEventListener('error', () => {
    /* Si por alguna razón falla WebP, usa el JPG original. */
    if (img.dataset.extension === 'webp' && !img.dataset.jpgFallback) {
      img.dataset.jpgFallback = '1';
      img.dataset.extension = 'jpg';
      img.src = `assets/images/galeria-${i}.jpg`;
    }
  });

  galleryImages.push(img);
  gallerySlides.appendChild(slide);
}

/* Detecta una sola vez si las versiones WebP ya existen. */
let galleryExtensionPromise = null;
function detectGalleryExtension() {
  if (galleryExtensionPromise) return galleryExtensionPromise;

  galleryExtensionPromise = new Promise((resolve) => {
    const probe = new Image();
    probe.onload = () => resolve('webp');
    probe.onerror = () => resolve('jpg');
    probe.src = 'assets/images/galeria-1.webp';
  });

  return galleryExtensionPromise;
}

async function loadGalleryImage(index, priority = 'low') {
  const img = galleryImages[index];
  if (!img || img.dataset.loadedRequested === '1') return;

  img.dataset.loadedRequested = '1';
  img.fetchPriority = priority;

  const extension = await detectGalleryExtension();
  img.dataset.extension = extension;
  img.src = `assets/images/galeria-${index + 1}.${extension}`;
}

function loadGalleryNeighborhood(activeIndex = 0) {
  const indexes = new Set([
    activeIndex,
    activeIndex - 1,
    activeIndex + 1,
    activeIndex + 2
  ]);

  indexes.forEach((index) => {
    if (index >= 0 && index < galleryImages.length) {
      loadGalleryImage(index, index === activeIndex ? 'high' : 'low');
    }
  });
}

function scheduleRemainingGalleryImages() {
  let next = 5;

  const loadBatch = () => {
    const limit = Math.min(next + 2, galleryImages.length);

    while (next < limit) {
      loadGalleryImage(next, 'low');
      next += 1;
    }

    if (next < galleryImages.length) {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(loadBatch, { timeout: 1200 });
      } else {
        setTimeout(loadBatch, 450);
      }
    }
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadBatch, { timeout: 1000 });
  } else {
    setTimeout(loadBatch, 450);
  }
}

/* Fondo collage optimizado: UNA sola imagen WebP liviana.
   Ya no se cargan 19 fotos adicionales detrás del carrusel. */

/* Corazones delicados alrededor de la galería. */
const galleryHearts = document.getElementById('galleryHearts');
if (galleryHearts) {
  const heartLayout = [
    [4,8,20,.50,4.6,-.7],[16,10,16,.33,5.1,-2.2],[84,9,18,.42,4.8,-1.4],[95,13,24,.46,5.5,-3.0],
    [5,20,28,.46,5.2,-1.2],[94,23,19,.42,4.4,-2.5],[10,31,16,.35,5.8,-.4],[89,32,22,.45,5.0,-3.4],
    [3,42,21,.40,4.9,-1.8],[96,43,27,.38,5.9,-2.1],[7,54,18,.36,5.4,-3.7],[92,55,20,.42,4.6,-.9],
    [4,66,26,.39,6.2,-2.8],[96,67,17,.47,4.7,-1.1],[10,77,22,.44,5.0,-4.0],[89,79,29,.35,6.0,-.2],
    [5,89,18,.42,4.5,-2.6],[17,93,15,.32,5.3,-.8],[83,92,16,.38,5.6,-3.1],[95,87,25,.43,4.9,-1.6],
    [27,13,13,.28,4.7,-3.6],[72,14,14,.30,5.1,-.5],[25,88,14,.30,5.7,-2.3],[74,89,13,.28,4.8,-3.8]
  ];

  heartLayout.forEach(([x,y,size,opacity,duration,delay]) => {
    const heart = document.createElement('span');
    heart.className = 'gallery-floating-heart';
    heart.textContent = '♡';
    heart.style.setProperty('--x', `${x}%`);
    heart.style.setProperty('--y', `${y}%`);
    heart.style.setProperty('--size', `${size}px`);
    heart.style.setProperty('--opacity', opacity);
    heart.style.setProperty('--duration', `${duration}s`);
    heart.style.setProperty('--delay', `${delay}s`);
    galleryHearts.appendChild(heart);
  });
}

let gallerySwiper = null;

if (window.Swiper) {
  gallerySwiper = new Swiper('.gallery-swiper', {
    loop: true,
    speed: 1150,
    spaceBetween: 14,
    centeredSlides: true,
    grabCursor: true,
    slidesPerView: 1.06,
    autoplay: {
      delay: 2200,
      disableOnInteraction: false,
      pauseOnMouseEnter: false,
      waitForTransition: false
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      dynamicBullets: true
    },
    breakpoints: {
      390: { slidesPerView: 1.08 },
      430: { slidesPerView: 1.1 }
    },
    on: {
      init(swiper) {
        setTimeout(() => swiper.autoplay.start(), 120);
      },
      slideChange(swiper) {
        const real = Number.isFinite(swiper.realIndex) ? swiper.realIndex : 0;
        loadGalleryNeighborhood(real);
      },
      touchEnd(swiper) {
        setTimeout(() => swiper.autoplay.start(), 80);
      },
      transitionEnd(swiper) {
        if (!swiper.autoplay.running) swiper.autoplay.start();
      }
    }
  });

  const galleryEl = document.querySelector('.gallery-swiper');
  ['pointerup', 'pointerleave', 'touchend', 'mouseup', 'mouseleave'].forEach((eventName) => {
    galleryEl.addEventListener(eventName, () => {
      setTimeout(() => gallerySwiper?.autoplay?.start(), 80);
    }, { passive: true });
  });
}

/* Empieza a preparar las fotos ANTES de que la galería llegue a pantalla,
   sin castigar la carga inicial de la invitación. */
let galleryWarmStarted = false;
function warmGallery() {
  if (galleryWarmStarted) return;
  galleryWarmStarted = true;

  for (let i = 0; i < Math.min(5, galleryImages.length); i += 1) {
    loadGalleryImage(i, i === 0 ? 'high' : 'low');
  }

  scheduleRemainingGalleryImages();
}

if ('IntersectionObserver' in window && gallerySection) {
  const galleryObserver = new IntersectionObserver((entries, observer) => {
    if (entries.some(entry => entry.isIntersecting)) {
      warmGallery();
      observer.disconnect();
    }
  }, {
    root: null,
    rootMargin: '1400px 0px',
    threshold: 0
  });

  galleryObserver.observe(gallerySection);
} else {
  setTimeout(warmGallery, 1800);
}

/* ---------------- MESA DE REGALOS ---------------- */
/*
  Se transforma únicamente la sección #regalos.
  No modifica ninguna otra pantalla de la invitación.
*/
const giftsSection = document.getElementById('regalos');

if (giftsSection) {
  giftsSection.classList.remove('art-section', 'art-section--interactive');
  giftsSection.classList.add('gift-section-premium');

  const bankCards = GIFT_DATA.banks.map((item, index) => `
    <article class="gift-bank-card">
      <div class="gift-bank-heading">
        <div>
          <p class="gift-bank-owner">${escapeHtml(item.owner)}</p>
          <p class="gift-bank-name">${escapeHtml(item.bank)}</p>
        </div>
        <span class="gift-bank-icon" aria-hidden="true">
          <i class="fa-solid fa-building-columns"></i>
        </span>
      </div>

      <div class="gift-bank-row">
        <div class="gift-bank-copy">
          <span class="gift-bank-label">CLABE interbancaria</span>
          <strong>${escapeHtml(item.clabe)}</strong>
        </div>
        <button
          class="gift-copy-button"
          type="button"
          data-copy-gift="${escapeHtml(item.clabe)}"
          aria-label="Copiar CLABE de ${escapeHtml(item.owner)}"
        >
          <i class="fa-regular fa-copy"></i>
        </button>
      </div>

      <div class="gift-bank-row">
        <div class="gift-bank-copy">
          <span class="gift-bank-label">Número de tarjeta</span>
          <strong>${escapeHtml(item.card)}</strong>
        </div>
        <button
          class="gift-copy-button"
          type="button"
          data-copy-gift="${escapeHtml(item.card.replace(/\s/g, ''))}"
          aria-label="Copiar número de tarjeta de ${escapeHtml(item.owner)}"
        >
          <i class="fa-regular fa-copy"></i>
        </button>
      </div>
    </article>
  `).join('');

  giftsSection.innerHTML = `
    <div class="gift-premium-shell">
      <div class="gift-premium-icon" aria-hidden="true">
        <i class="fa-solid fa-gift"></i>
      </div>

      <p class="gift-premium-kicker">MESA DE REGALOS</p>
      <span class="gift-premium-separator" aria-hidden="true"></span>

      <h2>Tu compañía es<br>nuestro mejor regalo</h2>

      <div class="gift-premium-heartline" aria-hidden="true">
        <span></span><i class="fa-solid fa-heart"></i><span></span>
      </div>

      <p class="gift-premium-intro">
        Si desean tener un detalle con nosotros, les compartimos algunas opciones
        para hacerlo de la manera que les sea más cómoda.
      </p>

      <div class="gift-premium-block">
        <div class="gift-premium-block-title">
          <i class="fa-solid fa-gift" aria-hidden="true"></i>
          <span>Mesa de regalos</span>
        </div>

        <button class="gift-amazon-button" id="amazonButton" type="button">
          <span class="gift-amazon-mark" aria-hidden="true">a</span>
          <span>VER MESA EN AMAZON</span>
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        </button>
      </div>

      <div class="gift-premium-block gift-premium-block--detail">
        <div class="gift-premium-block-title">
          <i class="fa-regular fa-credit-card" aria-hidden="true"></i>
          <span>Detalle con cariño</span>
        </div>

        <p class="gift-premium-detail-copy">
          Si desean acompañarnos también en este nuevo comienzo,
          cualquier detalle será recibido con muchísimo cariño y gratitud.
        </p>

        <button
          class="gift-options-button"
          id="giftOptionsButton"
          type="button"
          aria-expanded="false"
          aria-controls="giftBankOptions"
        >
          <span>VER OPCIONES</span>
          <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
        </button>
      </div>

      <div class="gift-bank-panel" id="giftBankOptions" hidden>
        ${bankCards}
      </div>

      <p class="gift-premium-thanks">
        Gracias por acompañarnos en este momento tan especial.
      </p>
    </div>
  `;

  const amazonButton = document.getElementById('amazonButton');
  amazonButton?.addEventListener('click', () => {
    if (!CONFIG.amazonUrl) {
      showToast('Falta agregar la liga final de Amazon en script.js');
      return;
    }
    window.open(CONFIG.amazonUrl, '_blank', 'noopener,noreferrer');
  });

  const optionsButton = document.getElementById('giftOptionsButton');
  const bankPanel = document.getElementById('giftBankOptions');

  optionsButton?.addEventListener('click', () => {
    const willOpen = bankPanel.hasAttribute('hidden');

    if (willOpen) {
      bankPanel.removeAttribute('hidden');
      requestAnimationFrame(() => bankPanel.classList.add('is-open'));
    } else {
      bankPanel.classList.remove('is-open');
      setTimeout(() => bankPanel.setAttribute('hidden', ''), 280);
    }

    optionsButton.setAttribute('aria-expanded', String(willOpen));
    optionsButton.classList.toggle('is-open', willOpen);
  });

  giftsSection.querySelectorAll('[data-copy-gift]').forEach((button) => {
    button.addEventListener('click', async () => {
      const value = button.dataset.copyGift || '';

      try {
        await navigator.clipboard.writeText(value);
        showToast('Dato copiado');
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
        showToast('Dato copiado');
      }
    });
  });
}

/* ---------------- RSVP CONECTADO A GOOGLE SHEETS ---------------- */
const RSVP_API_URL = 'https://script.google.com/macros/s/AKfycbwRoGjbY3YW6JxNB2k9CmnTFuN8a6JpJO4Je7axU47HwBOeGdTyxgJaHrCThzap_6pU/exec';
const params = new URLSearchParams(location.search);
const rsvpToken = params.get('r');
let invitation = null;
let invitationError = '';
let invitationLoading = Boolean(rsvpToken);
let jsonpCounter = 0;

const modal = document.getElementById('rsvpModal');
const screenStart = document.getElementById('rsvpScreenStart');
const screenDecline = document.getElementById('rsvpScreenDecline');
const screenDone = document.getElementById('rsvpScreenDone');
const familyEl = document.getElementById('rsvpFamily');
const placesEl = document.getElementById('rsvpPlaces');
const guestListEl = document.getElementById('rsvpGuestList');
const yesCountEl = document.getElementById('rsvpYesCount');
const totalCountEl = document.getElementById('rsvpTotalCount');
const validationEl = document.getElementById('rsvpValidation');
const doneTitleEl = document.getElementById('rsvpDoneTitle');
const doneTextEl = document.getElementById('rsvpDoneText');
const saveButton = document.getElementById('rsvpSave');
const declineButton = document.getElementById('rsvpConfirmDecline');

function requestRsvpJsonpOnce(query) {
  return new Promise((resolve, reject) => {
    const callbackName = `rsvpJsonp_${Date.now()}_${++jsonpCounter}`;
    const script = document.createElement('script');
    let timeoutId;
    let settled = false;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      delete window[callbackName];
      script.remove();
    };

    window[callbackName] = (data) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(data);
    };

    script.async = true;
    script.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('No pudimos conectar con Google. Revisa tu conexión e intenta nuevamente.'));
    };

    const url = new URL(RSVP_API_URL);
    Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, String(value)));
    url.searchParams.set('callback', callbackName);
    url.searchParams.set('_ts', String(Date.now()));
    script.src = url.toString();

    timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Google tardó demasiado en responder. Vuelve a tocar el botón para reintentar.'));
    }, 25000);

    document.head.appendChild(script);
  });
}

// Dos intentos automáticos ayudan cuando el navegador interno de Messenger
// tarda en completar la redirección de Google Apps Script.
async function requestRsvpJsonp(query) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await requestRsvpJsonpOnce(query);
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 900));
    }
  }
  throw lastError || new Error('No pudimos consultar la invitación.');
}

function normalizeSheetAnswer(value) {
  if (value === 'Asiste') return 'yes';
  if (value === 'No asiste') return 'no';
  return '';
}

function mapServerInvitation(data) {
  return {
    family: data.family,
    guests: data.guests.map((guest) => ({
      id: guest.id,
      name: guest.isOpenSlot ? 'Acompañante' : guest.name,
      type: guest.isOpenSlot ? 'open' : 'fixed',
      category: guest.category,
      answer: guest.answer || 'Pendiente',
      companionName: guest.companionName || ''
    }))
  };
}

let invitationPromise = null;

async function loadInvitationFromSheet() {
  if (!rsvpToken) return null;
  if (invitation) return invitation;
  if (invitationPromise) return invitationPromise;

  invitationLoading = true;
  invitationError = '';
  invitationPromise = (async () => {
    const data = await requestRsvpJsonp({ action: 'family', token: rsvpToken });
    if (!data || !data.ok) {
      throw new Error(data?.message || 'Esta invitación no está disponible. Revisa el enlace con los novios.');
    }

    invitation = mapServerInvitation(data);
    familyEl.textContent = `Invitación de ${invitation.family}`;
    placesEl.textContent = `${invitation.guests.length} lugares reservados`;
    totalCountEl.textContent = invitation.guests.length;
    return invitation;
  })();

  try {
    return await invitationPromise;
  } catch (error) {
    invitationError = error?.message || 'No pudimos verificar esta invitación. Intenta nuevamente.';
    throw error;
  } finally {
    invitationLoading = false;
    invitationPromise = null;
  }
}

if (rsvpToken) {
  loadInvitationFromSheet().catch(() => {
    // El error se conserva para mostrarlo y permitir reintentar al tocar RSVP.
  });
}

function setScreen(name) {
  screenStart.hidden = name !== 'start';
  screenDecline.hidden = name !== 'decline';
  screenDone.hidden = name !== 'done';
}

function openRsvp(name = 'start') {
  if (!invitation) {
    if (!rsvpToken) {
      showToast('Usa el enlace personalizado que te enviaron los novios.');
      return;
    }
    if (invitationLoading) {
      showToast('Estamos verificando tu invitación. Espera un momento y vuelve a tocar.');
      return;
    }

    showToast('No se pudo conectar. Estamos intentando nuevamente…');
    loadInvitationFromSheet()
      .then(() => {
        if (name === 'start') buildGuestList(getServerAnswers());
        openRsvp(name);
      })
      .catch(error => {
        showToast(error?.message || 'No pudimos cargar tu invitación. Intenta nuevamente.');
      });
    return;
  }

  setScreen(name);
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeRsvp() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

document
  .querySelectorAll('[data-close-rsvp]')
  .forEach(el => el.addEventListener('click', closeRsvp));

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeRsvp();
});

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getServerAnswers() {
  const saved = {};
  if (!invitation) return saved;

  invitation.guests.forEach((guest, index) => {
    saved[index] = {
      response: normalizeSheetAnswer(guest.answer),
      companionName: guest.companionName || ''
    };
  });
  return saved;
}

function buildGuestList(saved = {}) {
  if (!invitation) return;
  guestListEl.innerHTML = '';

  // Orientación para familias que comparten un mismo enlace.
  let guidance = document.getElementById('rsvpPartialGuidance');
  if (!guidance) {
    guidance = document.createElement('p');
    guidance.id = 'rsvpPartialGuidance';
    guidance.className = 'rsvp-copy';
    guidance.textContent = 'Por favor, responde únicamente por las personas que conoces directamente o de tu familia. Las demás podrán confirmar después con este mismo enlace.';
    guestListEl.parentNode.insertBefore(guidance, guestListEl);
  }

  invitation.guests.forEach((guest, index) => {
    const savedItem = saved[index] || { response: '', companionName: '' };
    const isOpen = guest.type === 'open';
    const item = document.createElement('article');
    item.className = 'rsvp-guest';

    item.innerHTML = `
      <p class="rsvp-guest-name">
        ${escapeHtml(guest.name)}
        ${isOpen ? '<span class="rsvp-open-badge">Lugar abierto</span>' : ''}
        ${guest.answer && guest.answer !== 'Pendiente' ? '<span class="rsvp-open-badge">Respuesta registrada</span>' : ''}
      </p>

      <div class="rsvp-choices">
        <div class="rsvp-choice">
          <input
            type="radio"
            id="g-${index}-yes"
            name="guest-${index}"
            value="yes"
            ${savedItem.response === 'yes' ? 'checked' : ''}
            ${guest.answer && guest.answer !== 'Pendiente' ? 'disabled' : ''}
          >
          <label for="g-${index}-yes">Sí asistirá</label>
        </div>

        <div class="rsvp-choice">
          <input
            type="radio"
            id="g-${index}-no"
            name="guest-${index}"
            value="no"
            ${savedItem.response === 'no' ? 'checked' : ''}
            ${guest.answer && guest.answer !== 'Pendiente' ? 'disabled' : ''}
          >
          <label for="g-${index}-no">No asistirá</label>
        </div>
      </div>

      ${isOpen ? `
        <div
          class="rsvp-companion-field"
          id="companion-wrap-${index}"
          ${savedItem.response === 'yes' ? '' : 'hidden'}
        >
          <label for="companion-${index}">Nombre completo del acompañante</label>
          <input
            type="text"
            id="companion-${index}"
            maxlength="80"
            autocomplete="name"
            placeholder="Nombre y apellidos"
            value="${escapeHtml(savedItem.companionName || '')}"
          >
        </div>
      ` : ''}
    `;

    guestListEl.appendChild(item);

    if (isOpen) {
      const yesRadio = item.querySelector(`#g-${index}-yes`);
      const noRadio = item.querySelector(`#g-${index}-no`);
      const companionWrap = item.querySelector(`#companion-wrap-${index}`);
      const companionInput = item.querySelector(`#companion-${index}`);

      const syncCompanionField = () => {
        companionWrap.hidden = !yesRadio.checked;
        if (noRadio.checked && !guest.companionName) companionInput.value = '';
      };

      yesRadio.addEventListener('change', syncCompanionField);
      noRadio.addEventListener('change', syncCompanionField);
    }
  });

  guestListEl
    .querySelectorAll('input[type="radio"]')
    .forEach(input => input.addEventListener('change', updateSummary));

  updateSummary();
}

function getAnswers() {
  const result = {};
  if (!invitation) return result;

  invitation.guests.forEach((guest, index) => {
    // Las respuestas ya guardadas quedan protegidas: no se vuelven a enviar ni editar.
    if (guest.answer && guest.answer !== 'Pendiente') return;
    const selected = document.querySelector(`input[name="guest-${index}"]:checked`);
    if (!selected) return;

    result[index] = { response: selected.value, companionName: '' };
    if (guest.type === 'open' && selected.value === 'yes') {
      const nameInput = document.getElementById(`companion-${index}`);
      result[index].companionName = nameInput?.value.trim() || '';
    }
  });
  return result;
}

function updateSummary() {
  const answers = getAnswers();
  // Cuenta también los "Asiste" que ya están guardados en Google Sheets.
  // getAnswers() solo incluye respuestas nuevas de invitados pendientes.
  const alreadyConfirmed = invitation
    ? invitation.guests.filter(guest => guest.answer === 'Asiste').length
    : 0;
  const newlyConfirmed = Object.values(answers)
    .filter(item => item.response === 'yes').length;
  yesCountEl.textContent = alreadyConfirmed + newlyConfirmed;
  validationEl.hidden = true;
}

function validateAnswers(answers) {
  if (!invitation) return 'Invitación no encontrada.';
  const answeredIndexes = Object.keys(answers);
  if (!answeredIndexes.length) {
    return 'Selecciona Sí o No para al menos una persona.';
  }

  for (const indexText of answeredIndexes) {
    const index = Number(indexText);
    const guest = invitation.guests[index];
    const answer = answers[index];
    if (!guest || !answer) return 'Hay una respuesta inválida. Recarga la invitación.';
    if (guest.type === 'open' && answer.response === 'yes' && !answer.companionName) {
      return 'Escribe el nombre completo del acompañante.';
    }
  }
  return '';
}

function getConfirmedNames(answers) {
  return invitation.guests.flatMap((guest, index) => {
    const answer = answers[index] || {};
    if (answer.response !== 'yes') return [];
    if (guest.type === 'open') {
      return [answer.companionName || guest.companionName || 'Acompañante'];
    }
    return [guest.name];
  });
}

function renderSaved(payload) {
  if (payload.type === 'declined') {
    doneTitleEl.textContent = 'Hemos registrado que no podrán asistir.';
    doneTextEl.textContent = `La respuesta de ${invitation.family} quedó registrada en la lista de invitados.`;
  } else {
    const names = getConfirmedNames(payload.answers);
    doneTitleEl.textContent = `${names.length} de ${invitation.guests.length} asistirán.`;
    doneTextEl.textContent = names.length
      ? `Confirmados: ${names.join(', ')}.`
      : 'No se confirmó ningún asistente.';
  }
  openRsvp('done');
}

let rsvpSaving = false;

async function saveRsvp(type, answers) {
  // Evita envíos duplicados si el invitado toca el botón varias veces.
  if (rsvpSaving) return;
  rsvpSaving = true;

  // Enviar únicamente las personas que fueron contestadas en esta ocasión.
  // Las demás permanecen intactas en Google Sheets.
  const submitted = Object.entries(answers)
    .filter(([indexText]) => {
      const guest = invitation.guests[Number(indexText)];
      return guest && (!guest.answer || guest.answer === 'Pendiente');
    })
    .map(([indexText, answer]) => {
    const guest = invitation.guests[Number(indexText)];
    return {
      guestId: guest.id,
      answer: answer.response === 'yes' ? 'Asiste' : 'No asiste',
      ...(guest.type === 'open' && answer.response === 'yes'
        ? { companionName: answer.companionName }
        : {})
    };
  });
  if (!submitted.length) {
    rsvpSaving = false;
    validationEl.textContent = 'No hay respuestas pendientes por guardar.';
    validationEl.hidden = false;
    return;
  }
  const activeButton = type === 'declined' ? declineButton : saveButton;
  const originalContent = activeButton.innerHTML;
  const buttons = [saveButton, declineButton];

  buttons.forEach(button => {
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
  });
  activeButton.classList.add('is-loading');
  activeButton.innerHTML = '<span class="rsvp-spinner" aria-hidden="true"></span><span>Guardando respuesta…</span>';

  try {
    // Guardado mediante JSONP: evita CORS/preflight y funciona en navegadores integrados
    // de Messenger y WhatsApp, igual que la lectura de la invitación.
    const saveResult = await requestRsvpJsonp({
      action: 'save',
      token: rsvpToken,
      answers: JSON.stringify(submitted)
    });
    if (!saveResult || !saveResult.ok) {
      throw new Error(saveResult?.message || 'No se pudo registrar la respuesta.');
    }

    // Confirmamos leyendo nuevamente la hoja después de que Apps Script responde al guardado.
    const verification = await requestRsvpJsonp({ action: 'family', token: rsvpToken });
    if (!verification || !verification.ok) {
      throw new Error(verification?.message || 'No pudimos verificar el guardado.');
    }

    const savedById = new Map(verification.guests.map(guest => [guest.id, guest]));
    for (const item of submitted) {
      const savedGuest = savedById.get(item.guestId);
      if (!savedGuest || savedGuest.answer !== item.answer) {
        throw new Error('No pudimos verificar todas las respuestas guardadas. Intenta nuevamente.');
      }
    }

    invitation = mapServerInvitation(verification);
    const confirmed = invitation.guests.filter(guest => guest.answer === 'Asiste').length;
    doneTitleEl.textContent = '¡Respuesta guardada!';
    doneTextEl.textContent = `${submitted.length} respuesta(s) registradas. En total, ${confirmed} de ${invitation.guests.length} invitados han confirmado. Las personas pendientes podrán responder después con este mismo enlace.`;
    openRsvp('done');
  } catch (error) {
    validationEl.textContent = error.message || 'No se pudo guardar la respuesta. Intenta nuevamente.';
    validationEl.hidden = false;
    showToast(validationEl.textContent);
  } finally {
    activeButton.classList.remove('is-loading');
    activeButton.innerHTML = originalContent;
    buttons.forEach(button => {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    });
    rsvpSaving = false;
  }
}

document.getElementById('rsvpYes').addEventListener('click', () => {
  if (!invitation) {
    openRsvp('start');
    return;
  }
  buildGuestList(getServerAnswers());
  openRsvp('start');
});

// La respuesta negativa se elige persona por persona en la lista.
// El botón secundario ya no debe rechazar a toda la familia.
const individualChoiceButton = document.getElementById('rsvpNo');
if (individualChoiceButton) {
  individualChoiceButton.textContent = 'ELEGIR RESPUESTAS';
  individualChoiceButton.addEventListener('click', () => {
    if (!invitation) {
      openRsvp('start');
      return;
    }
    buildGuestList(getServerAnswers());
    openRsvp('start');
  });
}

// Deshabilita la pantalla y el control antiguos de rechazo familiar completo.
if (screenDecline) screenDecline.hidden = true;
if (declineButton) declineButton.hidden = true;

saveButton.addEventListener('click', async () => {
  const answers = getAnswers();
  const error = validateAnswers(answers);
  if (error) {
    validationEl.textContent = error;
    validationEl.hidden = false;
    return;
  }
  await saveRsvp('confirmed', answers);
});

// Se elimina el guardado de rechazo familiar completo; cada negativa se elige en la lista.


document.getElementById('rsvpDeclineBack').addEventListener('click', () => {
  closeRsvp();
});

document.getElementById('rsvpEdit').addEventListener('click', () => {
  if (!invitation) return;
  buildGuestList(getServerAnswers());
  setScreen('start');
});

/* ---------------- TOAST ---------------- */
const toast = document.getElementById('toast');
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
}
