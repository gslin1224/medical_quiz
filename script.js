/* =========================================================
   刷題系統 Script  vFinal
   ========================================================= */

/* ------------------ 全域變數 ------------------ */
let questions = [];
let currentTag = "";

/* ======================== 1. 載入題庫 ======================== */
document.getElementById("load-btn").addEventListener("click", () => {
  currentTag = document.getElementById("dataset-select").value.trim();
  if (!currentTag) return alert("請選擇題庫！");

  fetch(`data/${currentTag}.json`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      questions = data.questions || [];
      renderQuestions();
      document.getElementById("result-box").innerHTML = "";
    })
    .catch(err => {
      alert(`讀檔失敗：${err.message}\n請確認 data/ 資料夾與檔名大小寫`);
    });
});

/* ======================== 2. 顯示題目 ======================== */
function renderQuestions() {
  const alertBox = document.getElementById("alert");
  if (alertBox) {
    if (questions.length !== 50) {
      alertBox.style.display = "";
      alertBox.textContent = `⚠️ JSON 內只有 ${questions.length}/50 題`;
    } else {
      alertBox.style.display = "none";
    }
  }

  const form = document.getElementById("quiz-form");
  form.innerHTML = "";
  questions.forEach((q, idx) => {
    const field = document.createElement("fieldset");
    field.innerHTML =
      `<legend>Q${idx + 1}. ${q.question}</legend>` +
      q.options
        .map(
          opt => `<label><input type="radio" name="q${idx}" value="${opt[0]}"> ${opt}</label>`
        )
        .join("");
    form.appendChild(field);
  });

  document.getElementById("submit-btn").style.display = "block";
}

/* ======================== 3. 交卷批改 ======================== */
document.getElementById("submit-btn").addEventListener("click", submitQuiz);

function submitQuiz() {
  if (!questions.length) return;

  let score = 0;
  const wrongIds = [];
  const wrongItems = [];

  questions.forEach((q, idx) => {
    const chosen = document.querySelector(`input[name="q${idx}"]:checked`);
    const yourAns = chosen ? chosen.value : null;
    const field = document.getElementsByTagName("fieldset")[idx];

    if (yourAns === q.answer) {
      score += 2;
      field.classList.add("correct");
    } else {
      field.classList.add("incorrect");
      field.insertAdjacentHTML(
        "beforeend",
        `<div style="color:green">✅ 正確答案：${q.answer}</div>`
      );
      wrongIds.push(idx + 1);
      wrongItems.push({
        id: q.id,
        question: q.question,
        userAns: yourAns,
        answer: q.answer
      });
    }
  });

  document.getElementById("result-box").innerHTML =
    `🎯 分數：${score} / 100<br>錯題：${wrongIds.join(", ") || "無"}`;

  saveHistory(score, wrongIds);
  if (wrongItems.length) saveWrong(currentTag, wrongItems);
  renderHistory();
  showWrongList();
}

/* ======================== 4. 歷史成績 ======================== */
function saveHistory(score, wrongList) {
  const key = "quiz-history";
  const prev = JSON.parse(localStorage.getItem(key) || "[]");
  prev.unshift({
    tag: currentTag,
    time: new Date().toLocaleString("zh-TW", { dateStyle: "short", timeStyle: "medium" }),
    score,
    wrongList
  });
  localStorage.setItem(key, JSON.stringify(prev.slice(0, 10)));
}

function renderHistory() {
  const ul = document.getElementById("history");
  const arr = JSON.parse(localStorage.getItem("quiz-history") || "[]");
  ul.innerHTML = arr
    .map(
      h =>
        `<li>${h.time} - ${h.tag} - 分數 ${h.score}，錯題 ${h.wrongList.join(", ") ||
          "無"}</li>`
    )
    .join("");
}

/* ======================== 5. 錯題紀錄 ======================== */
/**
 * 將所有錯題存到 single key 'wrongLog'
 */
function saveWrong(tag, items) {
  const key = "wrongLog";
  const prev = JSON.parse(localStorage.getItem(key) || "[]");
  prev.unshift({
    tag,
    time: new Date().toLocaleString("zh-TW", { dateStyle: "short", timeStyle: "medium" }),
    items
  });
  localStorage.setItem(key, JSON.stringify(prev.slice(0, 20)));
}

/**
 * 渲染錯題 Accordion 列表
 */
function showWrongList() {
  const wrap = document.getElementById("wrong-list");
  wrap.innerHTML = "";

  const logs = JSON.parse(localStorage.getItem("wrongLog") || "[]");
  if (!logs.length) {
    wrap.innerHTML = "<p>目前尚無錯題紀錄 🎉</p>";
    return;
  }

  logs.forEach(log => {
    // 按鈕
    const btn = document.createElement("button");
    btn.className = "accordion";
    btn.textContent = `【${log.tag}】 ${log.time}`;

    // 面板
    const panel = document.createElement("div");
    panel.className = "panel";
    const ul = document.createElement("ul");
    log.items.forEach(q => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>Q${q.id}</strong>: ${q.question}<br>
        你選擇：${q.userAns || "—"}，正確答案：${q.answer}
      `;
      ul.appendChild(li);
    });
    panel.appendChild(ul);

    wrap.appendChild(btn);
    wrap.appendChild(panel);
  });

  activateAccordions();
}

function activateAccordions() {
  document.querySelectorAll(".accordion").forEach(btn => {
    btn.onclick = () => {
      const panel = btn.nextElementSibling;
      panel.style.display = panel.style.display === "block" ? "none" : "block";
    };
  });
}

/* ======================== 6. 切換頁面 ======================== */
function switchView(view) {
  document.getElementById("quiz-view").style.display =
    view === "quiz" ? "block" : "none";
  document.getElementById("wrong-view").style.display =
    view === "wrong" ? "block" : "none";
}

/* ======================== 7. 初始執行 ======================== */
document.addEventListener("DOMContentLoaded", () => {
  renderHistory();
  showWrongList();
});
