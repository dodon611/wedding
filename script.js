const DATA = WEDDING_DATA;
const WEDDING_DATE = new Date(DATA.wedding.dateTime);

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

  target.innerHTML = DATA.invitation
    .map((line) => line === "" ? "<br />" : `<p>${line}</p>`)
    .join("");
}

function renderParkingNotice() {
  const target = document.getElementById("parkingNotice");
  if (!target) return;

  target.innerHTML = DATA.venue.parking
    .map((line) => `<p>${line}</p>`)
    .join("");
}

function renderMapButtons() {
  const target = document.getElementById("mapButtons");
  if (!target) return;

  const buttons = [
    { label: "카카오맵으로 보기", url: DATA.links.kakaoMap, primary: true },
    { label: "네이버지도에서 보기", url: DATA.links.naverMap },
    { label: "티맵에서 보기", url: DATA.links.tmap }
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

function updateDday() {
  const ddayElement = document.getElementById("dday");
  if (!ddayElement) return;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const weddingDay = new Date(WEDDING_DATE.getFullYear(), WEDDING_DATE.getMonth(), WEDDING_DATE.getDate());

  const diff = Math.ceil((weddingDay - startOfToday) / (1000 * 60 * 60 * 24));

  if (diff > 0) {
    ddayElement.textContent = `D-${diff}`;
  } else if (diff === 0) {
    ddayElement.textContent = "D-Day";
  } else {
    ddayElement.textContent = `D+${Math.abs(diff)}`;
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1600);
}

function copyText(text) {
  navigator.clipboard.writeText(text)
    .then(() => showToast("복사되었습니다"))
    .catch(() => showToast("복사에 실패했습니다"));
}

function submitRSVP(event) {
  event.preventDefault();

  const attend = document.getElementById("attend").value;
  const name = document.getElementById("name").value;
  const count = document.getElementById("count").value;

  console.log({ attend, name, count });

  showToast("제출되었습니다");
  event.target.reset();
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
  }, {
    threshold: 0.14,
    rootMargin: "0px 0px -40px 0px"
  });

  targets.forEach((target) => observer.observe(target));
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
