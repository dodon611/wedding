const WEDDING_DATE = new Date("2027-10-23T12:10:00+09:00");

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

  // 현재는 테스트용입니다.
  // 다음 단계에서 Google Forms 또는 Google Sheets와 연결합니다.
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

updateDday();
initRevealAnimation();
