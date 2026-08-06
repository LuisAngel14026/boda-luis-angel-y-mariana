/**
 * Invitación de boda
 * Luis Ángel & Mariana
 * Versión 1.0
 */

"use strict";

/* =========================================================
   1. CONFIGURACIÓN GENERAL
========================================================= */

/**
 * Fecha de la boda.
 * Formato recomendado: YYYY-MM-DDTHH:mm:ss
 * Se utiliza la hora local de La Piedad, Michoacán.
 */
const WEDDING_DATE = "2027-01-09T17:00:00";

/* =========================================================
   2. PRELOADER
========================================================= */

const preloader = document.getElementById("preloader");

/**
 * Oculta la pantalla de carga cuando todos los recursos
 * principales han terminado de cargarse.
 */
window.addEventListener("load", () => {
  window.setTimeout(() => {
    preloader?.classList.add("is-hidden");
    document.body.classList.remove("is-loading");
  }, 450);
});

/**
 * Evita el desplazamiento mientras aparece el preloader.
 */
document.body.classList.add("is-loading");

/* =========================================================
   3. AOS
========================================================= */

if (typeof AOS !== "undefined") {
  AOS.init({
    duration: 900,
    easing: "ease-out-cubic",
    once: true,
    offset: 50,
    disable: window.matchMedia("(prefers-reduced-motion: reduce)").matches
  });
}

/* =========================================================
   4. SWIPER
========================================================= */

if (typeof Swiper !== "undefined") {
  new Swiper(".gallery-swiper", {
    loop: true,
    speed: 750,
    spaceBetween: 18,
    centeredSlides: true,
    grabCursor: true,
    autoplay: {
      delay: 3800,
      disableOnInteraction: false,
      pauseOnMouseEnter: true
    },
    pagination: {
    el: ".swiper-pagination",
    clickable: true,
    dynamicBullets: true
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev"
    },
    breakpoints: {
      0: {
        slidesPerView: 1.08
      },
      600: {
        slidesPerView: 1.7
      },
      900: {
        slidesPerView: 2.35
      }
    }
  });
}

/* =========================================================
   5. CUENTA REGRESIVA
========================================================= */

const countdownElements = {
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds")
};

const weddingTimestamp = new Date(WEDDING_DATE).getTime();

/**
 * Convierte un número a texto con ceros a la izquierda.
 *
 * @param {number} value Número que se desea formatear.
 * @param {number} digits Cantidad mínima de dígitos.
 * @returns {string}
 */
function padNumber(value, digits = 2) {
  return String(value).padStart(digits, "0");
}

/**
 * Actualiza los valores visibles de la cuenta regresiva.
 */
function updateCountdown() {
  const now = Date.now();
  const distance = weddingTimestamp - now;

  if (Number.isNaN(weddingTimestamp)) {
    console.error("La fecha de la boda no tiene un formato válido.");
    return;
  }

  if (distance <= 0) {
    countdownElements.days.textContent = "000";
    countdownElements.hours.textContent = "00";
    countdownElements.minutes.textContent = "00";
    countdownElements.seconds.textContent = "00";
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor(
    (distance % (1000 * 60 * 60)) / (1000 * 60)
  );
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  countdownElements.days.textContent = padNumber(days, 3);
  countdownElements.hours.textContent = padNumber(hours);
  countdownElements.minutes.textContent = padNumber(minutes);
  countdownElements.seconds.textContent = padNumber(seconds);
}

updateCountdown();
window.setInterval(updateCountdown, 1000);

/* =========================================================
   6. REPRODUCTOR DE MÚSICA
========================================================= */

const musicButton = document.getElementById("musicButton");
const backgroundMusic = document.getElementById("backgroundMusic");

let isMusicPlaying = false;

/**
 * Sincroniza el estado visual y accesible del botón de música.
 *
 * @param {boolean} playing Indica si el audio se está reproduciendo.
 */
function updateMusicButton(playing) {
  isMusicPlaying = playing;

  musicButton.classList.toggle("is-playing", playing);
  musicButton.setAttribute("aria-pressed", String(playing));
  musicButton.setAttribute(
    "aria-label",
    playing ? "Pausar música" : "Reproducir música"
  );

  const icon = musicButton.querySelector("i");

  if (icon) {
    icon.className = playing
      ? "fa-solid fa-pause"
      : "fa-solid fa-music";
  }
}

/**
 * Reproduce o pausa la canción.
 * Los navegadores móviles exigen una interacción del usuario
 * antes de iniciar audio, por eso se utiliza un botón.
 */
async function toggleMusic() {
  if (!backgroundMusic) {
    return;
  }

  try {
    if (isMusicPlaying) {
      backgroundMusic.pause();
      updateMusicButton(false);
      return;
    }

    await backgroundMusic.play();
    updateMusicButton(true);
  } catch (error) {
    console.warn(
      "No fue posible reproducir el audio. Verifica que el archivo MP3 exista.",
      error
    );
    updateMusicButton(false);
  }
}

musicButton?.addEventListener("click", toggleMusic);

backgroundMusic?.addEventListener("ended", () => {
  updateMusicButton(false);
});

backgroundMusic?.addEventListener("pause", () => {
  if (!backgroundMusic.ended) {
    updateMusicButton(false);
  }
});

backgroundMusic?.addEventListener("play", () => {
  updateMusicButton(true);
});

/* =========================================================
   7. ENLACES INTERNOS
========================================================= */

/**
 * Desplazamiento suave para enlaces internos.
 * Se mantiene una alternativa por JavaScript para navegadores
 * que no respeten correctamente scroll-behavior.
 */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");

    if (!targetId || targetId === "#") {
      return;
    }

    const target = document.querySelector(targetId);

    if (!target) {
      return;
    }

    event.preventDefault();

    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});

/* =========================================================
   8. OPTIMIZACIÓN DE VISIBILIDAD
========================================================= */

/**
 * Pausa el audio si la pestaña deja de estar visible durante
 * un periodo prolongado. No vuelve a reproducirlo automáticamente,
 * para respetar la decisión del usuario.
 */
document.addEventListener("visibilitychange", () => {
  if (document.hidden && isMusicPlaying) {
    backgroundMusic.pause();
  }
});
