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
    if (value !== undefined && value !== null) element.textContent = value;
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
    .map((button) => `<a class="button ${button.primary ? "primary" : ""}" href="${button.url}" target="_blank" rel="noopener">${button.label}</a>`)
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

function rsvpFieldsTemplate() {
  return `
    <fieldset class="rsvp-fieldset">
      <legend>어느 측 하객이신가요?</legend>
      <div class="radio-grid two">
        <label class="radio-card"><input type="radio" name="side" value="신랑측" required><span>신랑측</span></label>
        <label class="radio-card"><input type="radio" name="side" value="신부측" required><span>신부측</span></label>
      </div>
    </fieldset>

    <fieldset class="rsvp-fieldset">
      <legend>참석 여부</legend>
      <div class="radio-grid three">
        <label class="radio-card"><input type="radio" name="attend" value="O" required><span>O</span></label>
        <label class="radio-card"><input type="radio" name="attend" value="X" required><span>X</span></label>
        <label class="radio-card"><input type="radio" name="attend" value="미정" required><span>미정</span></label>
      </div>
    </fieldset>

    <fieldset class="rsvp-fieldset">
      <legend>식사 여부</legend>
      <div class="radio-grid three">
        <label class="radio-card"><input type="radio" name="meal" value="O" required><span>O</span></label>
        <label class="radio-card"><input type="radio" name="meal" value="X" required><span>X</span></label>
        <label class="radio-card"><input type="radio" name="meal" value="미정" required><span>미정</span></label>
      </div>
    </fieldset>

    <label for="name-${Math.random().toString(36).slice(2)}">성함</label>
    <input name="name" type="text" placeholder="성함을 입력해주세요" required />

    <fieldset class="rsvp-fieldset">
      <legend>동행 인원 <span>(본인 제외)</span></legend>
      <div class="radio-grid four">
        <label class="radio-card"><input type="radio" name="companions" value="0" required><span>0명</span></label>
        <label class="radio-card"><input type="radio" name="companions" value="1" required><span>1명</span></label>
        <label class="radio-card"><input type="radio" name="companions" value="2" required><span>2명</span></label>
        <label class="radio-card"><input type="radio" name="companions" value="3명 이상" required><span>3명 이상</span></label>
      </div>
    </fieldset>
  `;
}

function renderRSVPForms() {
  document.querySelectorAll("[data-rsvp-fields]").forEach((target) => {
    target.innerHTML = rsvpFieldsTemplate();
  });
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

function companionToNumber(value) {
  if (value === "3명 이상") return 3;
  const number = parseInt(value, 10);
  return Number.isNaN(number) ? 0 : number;
}

async function submitRSVP(event) {
  event.preventDefault();
  const form = event.target;
  const submitButton = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  const companions = formData.get("companions");
  const attend = formData.get("attend");
  const payload = {
    side: formData.get("side"),
    name: String(formData.get("name") || "").trim(),
    attend,
    meal: formData.get("meal"),
    companions,
    total: attend === "O" ? 1 + companionToNumber(companions) : 0
  };

  if (!payload.name) {
    showToast("성함을 입력해주세요");
    return;
  }

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
    localStorage.setItem("weddingRsvpSubmitted", "true");
    showToast("참석 여부가 전달되었습니다");
    form.reset();
    closeRsvpModal();
    setTimeout(() => alert("참석 여부가 정상적으로 전달되었습니다.
응답해 주셔서 감사합니다."), 250);
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

function openRsvpModal(showForm = false) {
  const modal = document.getElementById("rsvpModal");
  const intro = document.getElementById("rsvpIntro");
  const form = document.getElementById("rsvpModalForm");
  if (!modal || !intro || !form) return;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  intro.hidden = showForm;
  form.hidden = !showForm;
}

function closeRsvpModal() {
  const modal = document.getElementById("rsvpModal");
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  localStorage.setItem("weddingRsvpPopupClosed", "true");
}

function initRsvpModal() {
  document.querySelectorAll("[data-rsvp-close]").forEach((button) => {
    button.addEventListener("click", closeRsvpModal);
  });
  document.getElementById("openRsvpFormButton")?.addEventListener("click", () => openRsvpModal(true));
  const alreadyClosed = localStorage.getItem("weddingRsvpPopupClosed") === "true";
  const alreadySubmitted = localStorage.getItem("weddingRsvpSubmitted") === "true";
  if (!alreadyClosed && !alreadySubmitted) {
    setTimeout(() => openRsvpModal(false), 600);
  }
}

document.getElementById("copyAddressButton")?.addEventListener("click", () => {
  copyText(DATA.venue.address);
});

applyTextData();
renderInvitation();
renderParkingNotice();
renderMapButtons();
renderAccounts();
renderRSVPForms();
updateDday();
initRevealAnimation();
initScrollProgress();
initMusic();
initRsvpModal();
prepareLazyImages();
