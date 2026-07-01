const DATA = WEDDING_DATA;
const WEDDING_DATE = new Date(DATA.wedding.dateTime);

let bgmAudio = null;
let isMusicPlaying = false;
let fadeTimer = null;

function getValueByPath(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

function applyTextData() {
  document.querySelectorAll("[data-text]").forEach((element) => {
    const value = getValueByPath(DATA, element.dataset.text);
    if (value !== undefined && value !== null) {
      element.textContent = value;
    }
  });
}

function renderInvitation() {
  const target = document.getElementById("invitationText");
  if (!target) return;
  target.innerHTML = DATA.invitation.map((line) => line === "" ? "<br />" : `<p>${line}</p>`).join("");
}

function renderParkingNotice() {
  const target = document.getElementById("parkingNotice");
  if (!target) return;
  target.innerHTML = DATA.venue.parking.map((line) => `<p>${line}</p>`).join("");
}

function renderMapButtons() {
  const target = document.getElementById("mapButtons");
  if (!target) return;

  const buttons = [
    { label: "카카오맵으로 보기", url: DATA.links.kakaoMap, primary: true },
    { label: "네이버지도에서 보기", url: DATA.links.naverMap }
  ];

  target.innerHTML = buttons
    .filter((button) => button.url)
    .map((button) => `
      <a class="button ${button.primary ? "primary" : ""}" href="${button.url}" target="_blank" rel="noopener">
        ${button.label}
      </a>
    `)
    .join("");
}

function renderAccounts() {
  const target = document.getElementById("accountList");
  if (!target) return;

  const accounts = [DATA.groom, DATA.bride];

  target.innerHTML = accounts.map((person) => {
    const accountText = `${person.bank} ${person.accountNumber}`;
    return `
      <details class="account">
        <summary>${person.accountLabel} 계좌 보기</summary>
        <p>${accountText}</p>
        <button class="copy-btn" type="button" onclick="copyText('${accountText}')">계좌번호 복사</button>
      </details>
    `;
  }).join("");
}

function getDdayDifference() {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const weddingDay = new Date(WEDDING_DATE.getFullYear(), WEDDING_DATE.getMonth(), WEDDING_DATE.getDate());
  return Math.ceil((weddingDay - startOfToday) / (1000 * 60 * 60 * 24));
}

function animateNumber(element, target) {
  const duration = 900;
  const startTime = performance.now();
  const absoluteTarget = Math.abs(target);

  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(absoluteTarget * eased);

    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

function updateDday() {
  const numberElement = document.getElementById("ddayNumber");
  const wrapper = numberElement?.parentElement;
  if (!numberElement || !wrapper) return;

  const diff = getDdayDifference();

  if (diff > 0) {
    wrapper.firstChild.textContent = "D-";
    animateNumber(numberElement, diff);
  } else if (diff === 0) {
    wrapper.textContent = "D-Day";
  } else {
    wrapper.firstChild.textContent = "D+";
    animateNumber(numberElement, diff);
  }
}

function getGoogleCalendarUrl() {
  const start = "20271023T031000Z";
  const end = "20271023T051000Z";
  const text = encodeURIComponent(`${DATA.groom.en} & ${DATA.bride.en} Wedding`);
  const location = encodeURIComponent(`${DATA.venue.address}, ${DATA.venue.name} ${DATA.venue.floor}`);
  const details = encodeURIComponent(`${DATA.groom.en} & ${DATA.bride.en} 결혼식`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}`;
}

function initCalendarButtons() {
  const googleButton = document.getElementById("googleCalendarButton");
  if (googleButton) googleButton.href = getGoogleCalendarUrl();
}

function showToast(message) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");
  toastMessage.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

function copyText(text) {
  navigator.clipboard.writeText(text)
    .then(() => showToast("복사되었습니다"))
    .catch(() => showToast("복사에 실패했습니다"));
}

async function submitRSVP(event) {
  event.preventDefault();

  const form = event.target;
  const submitButton = document.getElementById("rsvpSubmitButton");
  const name = document.getElementById("name").value.trim();
  const side = form.querySelector('input[name="side"]:checked')?.value || "";
  const attend = form.querySelector('input[name="attend"]:checked')?.value || "";
  const meal = form.querySelector('input[name="meal"]:checked')?.value || "";
  const companion = form.querySelector('input[name="companion"]:checked')?.value || "0";

  const companionNumber = companion.includes("3") ? 3 : parseInt(companion, 10) || 0;
  const total = attend === "O" ? 1 + companionNumber : 0;

  const payload = { side, name, attend, meal, companion, total };

  if (!DATA.rsvp?.endpoint) {
    showToast("RSVP 연결 정보가 없습니다");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "제출 중입니다...";

  try {
    await fetch(DATA.rsvp.endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    showToast("참석 여부가 제출되었습니다");
    localStorage.setItem("weddingRsvpSubmitted", "true");
    closeRsvpModal();
    form.reset();
  } catch (error) {
    console.error(error);
    showToast("제출에 실패했습니다");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "참석 여부 제출하기";
  }
}

function initRevealAnimation() {
  const targets = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    targets.forEach((target) => target.classList.add("show"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -40px 0px" });

  targets.forEach((target) => observer.observe(target));
}

function initScrollProgress() {
  const progress = document.getElementById("scrollProgress");
  if (!progress) return;

  const update = () => {
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percentage = documentHeight > 0 ? (window.scrollY / documentHeight) * 100 : 0;
    progress.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
  };

  window.addEventListener("scroll", update, { passive: true });
  update();
}

function setMusicUi(playing) {
  const button = document.getElementById("musicButton");
  const label = document.getElementById("musicLabel");
  if (!button || !label) return;

  button.classList.toggle("is-playing", playing);
  label.textContent = playing ? "ON" : "OFF";
  button.setAttribute("aria-label", playing ? "배경음악 끄기" : "배경음악 켜기");
}

function fadeInAudio(audio, targetVolume, duration) {
  clearInterval(fadeTimer);
  audio.volume = 0;
  const steps = 20;
  const interval = duration / steps;
  let currentStep = 0;

  fadeTimer = setInterval(() => {
    currentStep += 1;
    audio.volume = Math.min(targetVolume, (targetVolume / steps) * currentStep);
    if (currentStep >= steps) clearInterval(fadeTimer);
  }, interval);
}

async function playMusic() {
  if (!DATA.music.enabled) {
    showToast("배경음악 준비 중입니다");
    return;
  }

  if (!bgmAudio) {
    bgmAudio = document.getElementById("bgm");
    bgmAudio.src = DATA.music.file;
    bgmAudio.loop = true;
  }

  try {
    await bgmAudio.play();
    isMusicPlaying = true;
    localStorage.setItem("weddingMusic", "on");
    setMusicUi(true);
    fadeInAudio(bgmAudio, DATA.music.volume ?? 0.75, DATA.music.fadeInMs ?? 1000);
  } catch (error) {
    showToast("음악 파일 준비 중입니다");
    console.error(error);
  }
}

function stopMusic() {
  if (!bgmAudio) return;
  clearInterval(fadeTimer);
  bgmAudio.pause();
  bgmAudio.currentTime = 0;
  isMusicPlaying = false;
  localStorage.setItem("weddingMusic", "off");
  setMusicUi(false);
}

function initMusic() {
  const button = document.getElementById("musicButton");
  if (!button) return;

  setMusicUi(false);
  button.addEventListener("click", () => isMusicPlaying ? stopMusic() : playMusic());
}

function prepareLazyImages() {
  document.querySelectorAll("img").forEach((img) => {
    img.loading = "lazy";
    img.decoding = "async";
  });
}


function openRsvpModal() {
  const modal = document.getElementById("rsvpModal");
  if (!modal) return;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeRsvpModal() {
  const modal = document.getElementById("rsvpModal");
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  localStorage.setItem("weddingRsvpPopupClosed", "true");
}

function initRsvpModal() {
  document.getElementById("rsvpModalClose")?.addEventListener("click", closeRsvpModal);
  document.getElementById("openRsvpFormButton")?.addEventListener("click", () => {
    closeRsvpModal();
    document.getElementById("rsvpForm")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  if (!localStorage.getItem("weddingRsvpPopupClosed") && !localStorage.getItem("weddingRsvpSubmitted")) {
    setTimeout(openRsvpModal, 650);
  }
}

function openLightbox(src) {
  const lightbox = document.getElementById("lightbox");
  const image = document.getElementById("lightboxImage");
  if (!lightbox || !image) return;
  image.src = src;
  lightbox.classList.add("show");
  lightbox.setAttribute("aria-hidden", "false");
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox");
  const image = document.getElementById("lightboxImage");
  if (!lightbox || !image) return;
  lightbox.classList.remove("show");
  lightbox.setAttribute("aria-hidden", "true");
  image.src = "";
}

function initLightbox() {
  document.querySelectorAll("[data-image]").forEach((button) => {
    button.addEventListener("click", () => openLightbox(button.dataset.image));
  });
  document.getElementById("lightboxClose")?.addEventListener("click", closeLightbox);
  document.getElementById("lightbox")?.addEventListener("click", (event) => {
    if (event.target.id === "lightbox") closeLightbox();
  });
}

document.getElementById("copyAddressButton")?.addEventListener("click", () => {
  copyText(DATA.venue.address);
});

applyTextData();
renderInvitation();
renderParkingNotice();
renderMapButtons();
renderAccounts();
updateDday();
initRevealAnimation();
initScrollProgress();
initMusic();
prepareLazyImages();
initRsvpModal();
initLightbox();
