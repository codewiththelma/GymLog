/*******************************************************
 *  FIREBASE (MODULAR SDK)
 *******************************************************/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  arrayUnion,
  where,          // <-- ADD THIS
  getDocs,
  getDoc,        // <-- AND THIS
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  signOut,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
/*******************************************************
 *  FIREBASE INIT
 *******************************************************/
const firebaseConfig = {
  apiKey: "AIzaSyAgKoN-aP4hk4AzeTOkKnGy-QwBMVO5RDw",
  authDomain: "gymtracker-6ef97.firebaseapp.com",
  projectId: "gymtracker-6ef97",
  storageBucket: "gymtracker-6ef97.firebasestorage.app",
  messagingSenderId: "746810944434",
  appId: "1:746810944434:web:7f264137f0d1aeeb7092ab"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

/*******************************************************
 *  LOCAL UI STATE (NOT SAVED)
 *******************************************************/
const state = {
  splitDays: [],
  workouts: [],
};
let challenges = [];
let pendingDeleteId = null;
const MIN_PAST_PROGRESS = 0.01;


/*******************************************************
 *  DOM SELECTORS
 *******************************************************/
const navBtns = document.querySelectorAll(".nav-btn");
const views = document.querySelectorAll(".view");

const addDayForm = document.getElementById("addDayForm");
const addExerciseForm = document.getElementById("addExerciseForm");
const exerciseDaySelect = document.getElementById("exerciseDaySelect");
const exerciseNameInput = document.getElementById("exerciseName");
const splitList = document.getElementById("splitList");
const homeSplitList = document.getElementById("homeSplitList");

const workoutForm = document.getElementById("workoutForm");
const workoutDaySelect = document.getElementById("workoutDaySelect");
const workoutDateInput = document.getElementById("workoutDate");
const workoutExercisesContainer = document.getElementById("workoutExercisesContainer");
const addWorkoutExerciseBtn = document.getElementById("addWorkoutExerciseBtn");
const totalVolumeSpan = document.getElementById("totalVolume");

const historyTableBody = document.getElementById("historyTableBody");
const historyEditBtn = document.getElementById("historyEditBtn");

let historyDeleteMode = false;

const streakSummary = document.getElementById("streakSummary");
const streakCalendar = document.getElementById("streakCalendar");

const weeklyChartCanvas = document.getElementById("weeklyChart");
const weeklyTrendToggleBtns = document.querySelectorAll(".home-toggle-btn");
let weeklyChartInstance = null;
let weeklyTrendMode = "count";

const homeWeekCountEl = document.getElementById("homeWeekCount");
const homeTotalWorkoutsEl = document.getElementById("homeTotalWorkouts");
const homeBadgeEl = document.getElementById("homeBadge");
const homeBadgeTextEl = document.getElementById("homeBadgeText");
const homeStreakFill = document.getElementById("homeStreakFill");
const homeWeekdayDots = document.querySelectorAll(".home-day-dot");

const home7DayCanvas = document.getElementById("home7DayChart");
let home7DayChartInstance = null;

const themeToggle = document.getElementById("themeToggle");

const editModal = document.getElementById("editModal");
const editDayName = document.getElementById("editDayName");
const editExerciseList = document.getElementById("editExerciseList");
const saveSplitChanges = document.getElementById("saveSplitChanges");
const cancelEditSplit = document.getElementById("cancelEditSplit");
const logo = document.getElementById("brandLogo");
let editingDayId = null;
let userDoc = null;
const usernameInput = document.getElementById("profileName");
const emailInput = document.getElementById("profileEmail");
const createdInput = document.getElementById("profileCreated");

const changePasswordBtn = document.getElementById("changePasswordBtn");
const logoutBtn = document.getElementById("logoutBtn");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");

const passwordModal = document.getElementById("passwordModal");
const closePasswordModal = document.getElementById("closePasswordModal");
const cancelPasswordBtn = document.getElementById("cancelPasswordBtn");
const savePasswordBtn = document.getElementById("savePasswordBtn");

const currentPasswordInput = document.getElementById("currentPasswordInput");
const newPasswordInput = document.getElementById("newPasswordInput");

const errorPopup = document.getElementById("errorPopup");
const errorMessage = document.getElementById("errorMessage");

const challengeList = document.getElementById("challengeList");
const emptyState = document.getElementById("challengeEmpty");
const fab = document.getElementById("addFab");

const modal = document.getElementById("challengeModal");
const closeModal = document.getElementById("closeChallengeModal");
const form = document.getElementById("challengeForm");

const challengeIdInput = document.getElementById("challengeId");
const titleInput = document.getElementById("challengeTitle");
const startInput = document.getElementById("challengeStart");
const endInput = document.getElementById("challengeEnd");

const deletePopup = document.getElementById("deletePopup");
const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");

const addChallengeItemModal = document.getElementById("addChallengeItemModal");
const challengeItemInput = document.getElementById("challengeItemInput");
const closeAddChallengeItemModal = document.getElementById("closeAddChallengeItemModal");
const cancelAddChallengeItem = document.getElementById("cancelAddChallengeItem");
const saveChallengeItem = document.getElementById("saveChallengeItem");

/* ---------------------------
   DELETE MODAL ELEMENTS
---------------------------- */
const deleteModal = document.getElementById("deleteModal");
const closeDeleteModal = document.getElementById("closeDeleteModal");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const deletePasswordInput = document.getElementById("deletePasswordInput");

function showError(msg) {
  errorMessage.textContent = msg;
  const icon = errorPopup.querySelector(".success-icon");
  icon.innerHTML = `<i class="fa-solid fa-xmark-circle"></i>`;
  
  icon.classList.remove("success");
  icon.classList.add("error");
  errorPopup.classList.remove("hidden");

  setTimeout(() => errorPopup.classList.add("hidden"), 1800);
}

function showSuccess(msg) {
  errorMessage.textContent = msg;
  const icon = errorPopup.querySelector(".success-icon");
  icon.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
  icon.classList.remove("error");
  icon.classList.add("success");

  errorPopup.classList.remove("hidden");

  setTimeout(() => errorPopup.classList.add("hidden"), 1800);
}

/*******************************************************
 * DARK MODE
 *******************************************************/
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('gymLog-theme', theme);

  if (theme === "dark") {
    document.body.classList.add("dark");
    themeToggle.innerHTML = `<i class="fa-solid fa-sun"></i>`;
  } else {
    document.body.classList.remove("dark");
    themeToggle.innerHTML = `<i class="fa-solid fa-moon"></i>`;
  }
}
function initTheme() {
  const saved = localStorage.getItem('gymLog-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');

  applyTheme(theme);

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}


/*******************************************************
 * NAVIGATION
 *******************************************************/
navBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const view = btn.dataset.view;
    sessionStorage.setItem("activeView", view);

    navBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    views.forEach((v) => {
      v.classList.toggle("active", v.id === view);
    });
  });
});

function restoreSessionView() {
  const saved = sessionStorage.getItem("activeView");
  if (!saved) return;

  if (saved === "challengeDetailView") return;

  views.forEach(v => {
    v.classList.toggle("active", v.id === saved);
  });

  navBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === saved);
  });
}



function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function updateDaySelects() {
  const selects = [exerciseDaySelect, workoutDaySelect];

  selects.forEach((sel) => {
    const old = sel.value;
    sel.innerHTML = `<option value="">Select...</option>`;
    state.splitDays.forEach((d) => {
      sel.innerHTML += `<option value="${d.id}">${d.name}</option>`;
    });
    sel.value = old;
  });
}

/*******************************************************
 * FIREBASE REAL-TIME SYNC
 *******************************************************/
function initData() {
  /** Split days */
  const splitQuery = query(collection(db, 'users', auth.currentUser.uid, "splitDays"), orderBy("createdAt"));
  onSnapshot(splitQuery, (snapshot) => {
    state.splitDays = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));
    renderSplit();
    renderHomeSplitPreview();
    updateDaySelects();
  });

  /** Workouts */
  const workoutQuery = query(collection(db, 'users', auth.currentUser.uid, "workouts"), orderBy("date", "desc"));
  onSnapshot(workoutQuery, (snapshot) => {
    state.workouts = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    renderHistory();
    renderProgress();
    renderHome();
  });
}


/*******************************************************
 * SPLIT CRUD
 *******************************************************/
addDayForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("dayName").value.trim();
  if (!name) return;

  await addDoc(collection(db, 'users', auth.currentUser.uid, "splitDays"), {
    name,
    exercises: [],
    createdAt: serverTimestamp()
  });

  addDayForm.reset();
});

addExerciseForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const dayId = exerciseDaySelect.value;
  const name = exerciseNameInput.value.trim();
  if (!dayId || !name) return;

  await updateDoc(doc(db, 'users', auth.currentUser.uid, "splitDays", dayId), {
    exercises: arrayUnion(name)
  });

  exerciseNameInput.value = "";
});

/*******************************************************
 * EDIT SPLIT MODAL
 *******************************************************/
cancelEditSplit.addEventListener("click", () => {
  editModal.classList.add("hidden");
});

saveSplitChanges.addEventListener("click", async () => {
  const newName = editDayName.value.trim();
  const exercises = [...editExerciseList.querySelectorAll("input")]
    .map((i) => i.value.trim())
    .filter((e) => e);

  await updateDoc(doc(db, 'users', auth.currentUser.uid, "splitDays", editingDayId), {
    name: newName,
    exercises
  });

  editModal.classList.add("hidden");
});

/*******************************************************
 * RENDER SPLIT
 *******************************************************/
function renderSplit() {
  splitList.innerHTML = "";

  if (!state.splitDays.length) {
    splitList.innerHTML = `<p class="small-muted">No training days yet.</p>`;
    return;
  }

  state.splitDays.forEach((day) => {
    const card = document.createElement("div");
    card.className = "split-day-card";

    card.innerHTML = `
      <div class="split-day-header">
        <span>${day.name}</span>
        <button class="split-day-edit" data-id="${day.id}">
          <i class="fa-solid fa-pen"></i>
        </button>
      </div>
      <ul>
        ${
          day.exercises.length === 0
            ? "<li>No exercises yet.</li>"
            : day.exercises.map((e) => `<li>${e}</li>`).join("")
        }
      </ul>
    `;

    splitList.appendChild(card);
  });

  document.querySelectorAll(".split-day-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      editingDayId = btn.dataset.id;
      const day = state.splitDays.find((d) => d.id === editingDayId);

      editDayName.value = day.name;
      editExerciseList.innerHTML = "";

      day.exercises.forEach((ex) => {
        const row = document.createElement("div");
        row.className = "edit-ex-row";

        const inp = document.createElement("input");
        inp.value = ex;

        const del = document.createElement("button");
        del.className = "remove-ex-btn";
        del.textContent = "✕";
        del.addEventListener("click", () => row.remove());

        row.append(inp, del);
        editExerciseList.appendChild(row);
      });

      editModal.classList.remove("hidden");
    });
  });
}

function renderHomeSplitPreview() {
  const noSplitsMessage = document.getElementById("noSplitsMessage");
  homeSplitList.innerHTML = "";
  if (!state.splitDays || state.splitDays.length === 0) {
    noSplitsMessage.style.display = "block";
    return;
  }

  noSplitsMessage.style.display = "none";
  state.splitDays.forEach((day) => {
    const card = document.createElement("div");
    card.className = "split-day-card";

    card.innerHTML = `
      <div class="split-day-header">
        <span>${day.name}</span>
      </div>
      <ul>
        ${
          day.exercises.length
            ? day.exercises.map((e) => `<li>${e}</li>`).join("")
            : "<li>No exercises yet.</li>"
        }
      </ul>
    `;
    homeSplitList.appendChild(card);
  });
}

/*******************************************************
 * WORKOUT CREATION
 *******************************************************/
function createExerciseRow(name = "") {
  const row = document.createElement("div");
  row.className = "exercise-row";

  const ex = document.createElement("input");
  ex.type = "text";
  ex.value = name;
  if (name) {
    ex.readOnly = true;
    ex.classList.add("exercise-name-readonly");
  }

  const sets = document.createElement("input");
  sets.type = "number";
  sets.value = 0;
  sets.min = 0;

  const reps = document.createElement("input");
  reps.type = "number";
  reps.value = 0;
  reps.min = 0;

  const weight = document.createElement("input");
  weight.type = "number";
  weight.value = 0;
  weight.min = 0;

  [sets, reps, weight].forEach((i) => i.addEventListener("input", recalcTotalVolume));

  const remove = document.createElement("button");
  remove.textContent = "✕";
  remove.className = "exercise-remove-btn";
  remove.addEventListener("click", () => row.remove());

  row.append(ex, sets, reps, weight, remove);
  return row;
}

function recalcTotalVolume() {
  let total = 0;
  workoutExercisesContainer.querySelectorAll(".exercise-row").forEach((row) => {
    const [name, s, r, w] = row.querySelectorAll("input");
    const sets = Number(s.value);
    const reps = Number(r.value);
    const weight = Number(w.value);

    if (name.value.trim()) total += sets * reps * weight;
  });

  totalVolumeSpan.textContent = total;
}

workoutDaySelect.addEventListener("change", () => {
  const day = state.splitDays.find((d) => d.id === workoutDaySelect.value);
  workoutExercisesContainer.innerHTML = "";

  if (day?.exercises.length) {
    day.exercises.forEach((ex) => workoutExercisesContainer.appendChild(createExerciseRow(ex)));
  } else {
    workoutExercisesContainer.appendChild(createExerciseRow());
  }

  recalcTotalVolume();
});

addWorkoutExerciseBtn.addEventListener("click", () => {
  workoutExercisesContainer.appendChild(createExerciseRow());
});

/*******************************************************
 * SAVE WORKOUT (FIRESTORE)
 *******************************************************/
workoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const dayId = workoutDaySelect.value;
  const date = workoutDateInput.value;
  const day = state.splitDays.find((d) => d.id === dayId);

  if (!day || !date) return;

  const exercises = [];
  workoutExercisesContainer.querySelectorAll(".exercise-row").forEach((row) => {
    const [name, s, r, w] = row.querySelectorAll("input");
    const n = name.value.trim();
    const sets = Number(s.value);
    const reps = Number(r.value);
    const weight = Number(w.value);

    if (!n || (sets === 0 && reps === 0 && weight === 0)) return;

    exercises.push({
      name: n,
      sets,
      reps,
      weight,
      volume: sets * reps * weight,
    });
  });

  if (!exercises.length) return;

  const totalVolume = exercises.reduce((sum, ex) => sum + ex.volume, 0);

  await addDoc(collection(db, 'users', auth.currentUser.uid, "workouts"), {
    date,
    dayId,
    dayName: day.name,
    exercises,
    totalVolume,
    createdAt: serverTimestamp()
  });

  workoutForm.reset();
  workoutExercisesContainer.innerHTML = "";
  workoutExercisesContainer.appendChild(createExerciseRow());
  workoutDateInput.value = new Date().toLocaleDateString("en-CA");
});

/*******************************************************
 * HISTORY DELETE
 *******************************************************/
historyEditBtn.addEventListener("click", () => {
  historyDeleteMode = !historyDeleteMode;
  renderHistory();
});

function renderHistory() {
  const editBtn = document.querySelector(".history-edit-btn");
  const container = document.getElementById("historyCardList");
  container.innerHTML = "";

  if (!state.workouts.length) {
    container.innerHTML = `<p class="small-muted">No workouts logged yet.</p>`;
    if (editBtn) editBtn.style.display = "none";
    return;
  }

  if (editBtn) editBtn.style.display = "block";

  state.workouts.forEach((w) => {
    const card = document.createElement("div");
    card.className = "history-card";

    // Header: Day name + date
    const header = `
      <div class="history-card-header">
        <span>${w.dayName}</span>
        <span class="history-card-date">${formatDate(w.date)}</span>
      </div>
    `;

    // Exercises
    const exHTML = w.exercises
      .map((e) => 
        `<div class="history-card-exercise">
           • ${e.name} [${e.sets}×${e.reps} @ ${e.weight}kg]
         </div>`
      )
      .join("");

    // Volume
    const volume = `
      <div class="history-card-volume">
        Total Volume: ${w.totalVolume} kg
      </div>
    `;

    card.innerHTML = header + exHTML + volume;

    // If delete mode is active → show delete button
    if (historyDeleteMode) {
      const del = document.createElement("button");
      del.className = "history-delete-icon";
      del.innerHTML = `<i class="fa-solid fa-trash"></i>`;

      del.addEventListener("click", async () => {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, "workouts", w.id));
      });

      card.appendChild(del);
    }

    container.appendChild(card);
  });
}


/*******************************************************
 * PROGRESS PAGE
 *******************************************************/
function renderProgress() {
  renderStreakCalendar();
  renderWeeklyChart();
}

function renderStreakCalendar() {
  streakCalendar.innerHTML = "";

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const total = last.getDate();

  ["S","M","T","W","T","F","S"].forEach((d) => {
    const el = document.createElement("div");
    el.className = "calendar-day-name";
    el.textContent = d;
    streakCalendar.appendChild(el);
  });

  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement("div");
    empty.className = "calendar-cell empty";
    streakCalendar.appendChild(empty);
  }

  const workoutDates = new Set(state.workouts.map((w) => w.date));
  let trained = 0;

  for (let d = 1; d <= total; d++) {
    const dateKey = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const cell = document.createElement("div");
    cell.className = "calendar-cell";
    cell.textContent = d;

    if (workoutDates.has(dateKey)) {
      cell.classList.add("has-workout");
      trained++;
    }

    streakCalendar.appendChild(cell);
  }

  streakSummary.textContent = trained
    ? `${trained} training days this month`
    : "No workouts logged this month.";
}

/*******************************************************
 * WEEKLY TREND (Progress Page)
 *******************************************************/
function computeWeeklyAggregates() {
  const map = new Map();

  state.workouts.forEach((w) => {
    const d = new Date(w.date);

    const year = d.getFullYear();
    const month = d.getMonth(); // 0–11
    const monthName = d.toLocaleString("default", { month: "short" });

    // week of month calculation
    const firstOfMonth = new Date(year, month, 1);
    const firstDay = firstOfMonth.getDay(); // 0 is Sunday
    const date = d.getDate();
    const weekOfMonth = Math.ceil((date + firstDay) / 7);

    const key = `${monthName}-W${weekOfMonth}`;

    if (!map.has(key)) {
      map.set(key, { count: 0, volume: 0, sort: `${year}-${month+1}-${weekOfMonth}` });
    }
    map.get(key).count++;
    map.get(key).volume += w.totalVolume;
  });

  // Sort by logical month-year-week
  const sorted = [...map.entries()].sort((a, b) => 
    a[1].sort.localeCompare(b[1].sort)
  );

  const labels = sorted.map((x) => x[0]);
  const counts = sorted.map((x) => x[1].count);
  const volumes = sorted.map((x) => x[1].volume);

  return { labels, counts, volumes };
}


function renderWeeklyChart() {
  const stats = computeWeeklyAggregates();

  if (weeklyChartInstance) weeklyChartInstance.destroy();
  if (!stats.labels.length) return;

  const data = weeklyTrendMode === "count" ? stats.counts : stats.volumes;

  weeklyChartInstance = new Chart(weeklyChartCanvas.getContext("2d"), {
    type: "line",
    data: {
      labels: stats.labels,
      datasets: [{
        data,
        borderWidth: 2,
        borderColor: "#f9951c",
        backgroundColor: "#57340aff",
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,    // no decimals
                stepSize: 1,     // move in whole numbers
                callback: function(value) {
                  return Number.isInteger(value) ? value : null;
                }
              }
            }
          }

    }
  });
}

weeklyTrendToggleBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    weeklyTrendToggleBtns.forEach((x) => x.classList.remove("active"));
    btn.classList.add("active");

    weeklyTrendMode = btn.dataset.mode;
    renderWeeklyChart();
  });
});

/*******************************************************
 * HOME PAGE
 *******************************************************/
async function renderHomeSummary() {
  const streak = await fetchWeeklyWorkouts();

  homeWeekCountEl.textContent = streak;

  // weekly workouts using createdAt
  const monthly = await fetchMonthlyWorkouts();
  homeTotalWorkoutsEl.textContent = monthly;

  if (streak >= 4) {
    homeBadgeTextEl.textContent = "You’re on fire!";
    homeBadgeEl.classList.remove("hidden");
  } else if (streak >= 3) {
    homeBadgeTextEl.textContent = "Nice consistency!";
    homeBadgeEl.classList.remove("hidden");
  } else {
    homeBadgeEl.classList.add("hidden");
  }

  homeStreakFill.style.width = `${Math.min(streak, 7) / 7 * 100}%`;

  const now = new Date();
  const dow = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dow);

  const workoutDates = new Set(state.workouts.map((w) => w.date));

  homeWeekdayDots.forEach((dot, idx) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + idx);
    const key = d.toLocaleDateString("en-CA");

    if (workoutDates.has(key)) {
      dot.classList.add("done");
    } else {
      dot.classList.remove("done");
    }
  });
}

function getStartOfWeek() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - day);
  sunday.setHours(0, 0, 0, 0);
  return sunday;
}

function getEndOfWeek(startOfWeek) {
  const end = new Date(startOfWeek);
  end.setDate(end.getDate() + 7); 
  end.setHours(0, 0, 0, 0);
  return end;
}



async function fetchWeeklyWorkouts() {
  const start = getStartOfWeek();
  const end = getEndOfWeek(start);

  const workoutsRef = collection(db, 'users', auth.currentUser.uid, "workouts"); // adjust collection name if needed

  const q = query(
    workoutsRef,
    where("createdAt", ">=", start),
    where("createdAt", "<", end)
  );

  const snap = await getDocs(q);
  return snap.size; // workouts completed this week
}
async function fetchMonthlyWorkouts() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0–11

  const monthStart = new Date(year, month, 1);
  const nextMonth = new Date(year, month + 1, 1);

  const workoutsRef = collection(db, 'users', auth.currentUser.uid, "workouts");

  const q = query(
    workoutsRef,
    where("createdAt", ">=", monthStart),
    where("createdAt", "<", nextMonth)
  );

  const snap = await getDocs(q);
  return snap.size;
}


/*******************************************************
 * HOME 7-DAY VOLUME
 *******************************************************/
function renderHome7DayChart() {
  if (!home7DayCanvas) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const labels = [];
  const data = [];

  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);

    labels.push(days[d.getDay()]);

    const key = d.toLocaleDateString("en-CA");
    const dailyVolume = state.workouts
      .filter((w) => w.date === key)
      .reduce((sum, w) => sum + w.totalVolume, 0);

    data.push(dailyVolume);
  }

  if (home7DayChartInstance) home7DayChartInstance.destroy();

  home7DayChartInstance = new Chart(home7DayCanvas.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: "#f9951c",
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}
/*******************************************************
 * Challenges
 *******************************************************/
const dayMs = 1000 * 60 * 60 * 24;

function diffDays(a, b) {
  return Math.round((b - a) / dayMs) + 1;
}

function statusText(start, end) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (today < start) return `In ${Math.ceil((start - today) / dayMs)} days`;
  if (today > end) return "Past";
  return "Current";
}

function formatDates(date) {
  const d = new Date(date);
  const day = d.toLocaleDateString("en-GB", { weekday: "short" });
  const month = d.toLocaleDateString("en-GB", { month: "short" });
  const num = d.getDate();

  const suffix =
    num % 10 === 1 && num !== 11 ? "st" :
    num % 10 === 2 && num !== 12 ? "nd" :
    num % 10 === 3 && num !== 13 ? "rd" : "th";

  return `${day} ${num}${suffix} ${month}`;
}

/* =========================
   RENDER
========================= */

function renderChallenges() {
  challengeList.innerHTML = "";

  if (!challenges.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  challenges.forEach(challenge => {
    const start = new Date(challenge.start);
    const end = new Date(challenge.end);
    const totalDays = diffDays(start, end);

    const card = document.createElement("div");
    card.className = "card goal-card";

    card.innerHTML = `
      <div class="card-main">

          <div class="challenge-card-text">
            <p class="challenge-title">${challenge.title}</p>
            <p class="challenge-subtitle">
              ${formatDates(challenge.start)} – ${formatDates(challenge.end)} (${totalDays} days)
            </p>
            <span class="challenge-clock">
              <i class="fa-solid fa-clock"></i>
              ${statusText(start, end)}
            </span>
          </div>

          <div class="challenge-card-actions">
            <button class="challenge-menu-btn">
              <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>

            <div class="inline-actions hidden">
              <button class="challenge-button-only edit-btn">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="challenge-button-only danger delete-btn">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        
      </div>
    `;

    card.querySelector(".challenge-card-text").onclick = async () => {
      showPreloader();
      await openChallengeDetail(challenge.id);
      hidePreloader();
    };


    const menuBtn = card.querySelector(".challenge-menu-btn");
    const inlineActions = card.querySelector(".inline-actions");
    const editBtn = card.querySelector(".edit-btn");
    const deleteBtn = card.querySelector(".delete-btn");

    menuBtn.onclick = e => {
      e.stopPropagation();
      document.querySelectorAll(".inline-actions").forEach(a => {
        if (a !== inlineActions) a.classList.add("hidden");
      });
      inlineActions.classList.toggle("hidden");
    };

    editBtn.onclick = e => {
      e.stopPropagation();
      inlineActions.classList.add("hidden");
      openEditChallenge(challenge);
    };

    deleteBtn.onclick = e => {
      e.stopPropagation();
      inlineActions.classList.add("hidden");
      pendingDeleteId = challenge.id;
      deletePopup.classList.remove("hidden");
    };

    challengeList.appendChild(card);
  });
}

/* =========================
   LOAD
========================= */

async function loadChallenges() {
  const snap = await getDocs(
    collection(db, "users", auth.currentUser.uid, "challenges")
  );

  challenges = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      return new Date(b.end) - new Date(a.end); // 🔥 descending by end date
    });

  renderChallenges();
}



/* =========================
   MODALS
========================= */

fab.onclick = () => {
  document.getElementById("challengeModalTitle").textContent = "Add Challenge";
  challengeIdInput.value = "";
  form.reset();
  const today = new Date().toISOString().split("T")[0];
   if (!startInput.value) {
      startInput.value = today;
    }

    if (!endInput.value) {
      endInput.value = today;
    }
  modal.classList.remove("hidden");
};

closeModal.onclick = () => modal.classList.add("hidden");

function openEditChallenge(challenge) {
  document.getElementById("challengeModalTitle").textContent = "Edit Challenge";
  challengeIdInput.value = challenge.id;
  titleInput.value = challenge.title;
  startInput.value = challenge.start;
  endInput.value = challenge.end;
  modal.classList.remove("hidden");
}

/* =========================
   DELETE POPUP
========================= */

cancelDelete.onclick = () => {
  pendingDeleteId = null;
  deletePopup.classList.add("hidden");
};

confirmDelete.onclick = async () => {
  if (!pendingDeleteId) return;

  await deleteDoc(
    doc(db, "users", auth.currentUser.uid, "challenges", pendingDeleteId)
  );

  pendingDeleteId = null;
  deletePopup.classList.add("hidden");
  showSuccess("Challenge deleted");
  loadChallenges();
};

/* =========================
   SAVE Challenge
========================= */

form.onsubmit = async e => {
  e.preventDefault();

  const startDate = new Date(startInput.value);
  const endDate = new Date(endInput.value);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  if (endDate < startDate) {
    showError("End date cannot be before start date");
    return;
  }


  const data = {
    title: titleInput.value.trim(),
    start: startInput.value,
    end: endInput.value,
    createdAt: serverTimestamp()
  };

  if (challengeIdInput.value) {
    await updateDoc(
      doc(db, "users", auth.currentUser.uid, "challenges", challengeIdInput.value),
      data
    );
    showSuccess("Challenge updated");
  } else {
    await addDoc(
      collection(db, "users", auth.currentUser.uid, "challenges"),
      data
    );
    showSuccess("Challenge added");
  }

  modal.classList.add("hidden");
  loadChallenges();
};

let activeChallenge = null;
let activeDay = null;
let challengeEditMode = false;

async function loadChallengeItems(challengeId) {
  const snap = await getDocs(
    collection(
      db,
      "users",
      auth.currentUser.uid,
      "challenges",
      challengeId,
      "items"
    )
  );

  return snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
}
async function loadDayProgress(challengeId, dayKey) {
  const ref = doc(
    db,
    "users",
    auth.currentUser.uid,
    "challenges",
    challengeId,
    "days",
    dayKey
  );

  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().completedItemIds || [] : [];
}

async function openChallengeDetail(challengeId) {
  try {
  sessionStorage.setItem("activeChallengeId", challengeId);
  sessionStorage.setItem("activeView", "challengeDetailView");
  activeChallenge = challenges.find(c => c.id === challengeId);
  if (!activeChallenge) return;

  document.getElementById("challengeDetailTitle").textContent =
    activeChallenge.title;

  generateChallengeDays();
  const today = todayKey();

if (activeChallenge.days.includes(today)) {
  activeDay = today;
} else if (today < activeChallenge.days[0]) {
  activeDay = activeChallenge.days[0]; // not started yet
} else {
  activeDay = activeChallenge.days.at(-1); // challenge ended
}

activeChallenge.daysProgress = {};

for (const day of activeChallenge.days) {
  activeChallenge.daysProgress[day] =
    await loadDayProgress(activeChallenge.id, day);
}


  activeChallenge.items = await loadChallengeItems(challengeId);
  activeChallenge.completedToday =
  await loadDayProgress(activeChallenge.id, activeDay);
activeChallenge.daysProgress[activeDay] =
  activeChallenge.completedToday;


  sessionStorage.setItem("activeView", "challengeDetailView");
  views.forEach(v =>
    v.classList.toggle("active", v.id === "challengeDetailView")
  );

  renderChallengeDetail();
  updateChallengeDayLabel(); 
  requestAnimationFrame(scrollDayStripToActive);
  } finally {
    hidePreloader();
  }
}


function generateChallengeDays() {
  const start = new Date(activeChallenge.start);
  const end = new Date(activeChallenge.end);
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);

  activeChallenge.days = [];
  while (start <= end) {
    activeChallenge.days.push(start.toISOString().slice(0,10));
    start.setDate(start.getDate() + 1);
  }
}


function renderChallengeDetail() {
  renderDayStrip();
  renderProgressRing();
  renderChallengeItems();
  const editBtn = document.getElementById("editChallengeItemsBtn");
  editBtn.classList.toggle("active", challengeEditMode);

}
function scrollDayStripToActive() {
  const strip = document.getElementById("challengeDayStrip");
  const activeEl = strip.querySelector(".challenge-day.active");

  if (!activeEl) return;

  activeEl.scrollIntoView({
    behavior: "smooth",
    inline: "center",
    block: "nearest"
  });
}

function renderDayStrip() {
  const strip = document.getElementById("challengeDayStrip");
  strip.innerHTML = "";

  const totalItems = activeChallenge.items.length;

  activeChallenge.days.forEach((day, index) => {
    const completed =
  activeChallenge.daysProgress?.[day]?.length || 0;
    let percent = totalItems ? completed / totalItems : 0;
    if (
      percent === 0 &&
      isPastDay(day)
    ) {
      percent = MIN_PAST_PROGRESS;
    }
    const dash = 2 * Math.PI * 12;
    const offset = dash - dash * percent;

    const el = document.createElement("div");
    el.className = "challenge-day";
    el.dataset.day = day; 

    if (day === todayKey()) el.classList.add("today");
    if (day === activeDay) el.classList.add("active");

    el.innerHTML = `
      <svg class="challenge-day-ring" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="12" class="day-ring-bg" />
        <circle
          cx="14"
          cy="14"
          r="12"
          class="day-ring-progress"
          stroke-dasharray="${dash}"
          stroke-dashoffset="${offset}"
        />
      </svg>
      <span class="challenge-day-number">${index + 1}</span>
      <div class="challenge-day-dot"></div>
    `;

    el.onclick = async () => {
      activeDay = day;

      const progress =
        await loadDayProgress(activeChallenge.id, activeDay);

      activeChallenge.completedToday = progress;
      activeChallenge.daysProgress[activeDay] = progress;

      renderChallengeDetail();
      updateChallengeDayLabel(); 
    };


    strip.appendChild(el);
  });
}



function renderProgressRing() {
  const total = activeChallenge.items.length;
  const completed = activeChallenge.completedToday.length;

  let percent = total ? completed / total : 0;
  if (
      percent === 0 &&
      isPastDay(day)
    ) {
      percent = MIN_PAST_PROGRESS;
    }
  const circle = document.querySelector(".ring-progress");

  circle.style.strokeDashoffset = 314 - percent * 314;

  document.getElementById("challengeProgressText").textContent =
    `${completed} of ${total} completed`;
}

function updateChallengeDayLabel() {
  const index = activeChallenge.days.indexOf(activeDay);
  if (index === -1) return;

  document.getElementById("challengeDayLabel").textContent =
    `Day ${index + 1}`;
}

async function renderChallengeItems() {
  const list = document.getElementById("challengeItemList");
  list.innerHTML = "";

  for (const item of activeChallenge.items) {
    const checked =
      activeChallenge.completedToday?.includes(item.id);

    const row = document.createElement("div");
    row.className = "challenge-item";
    if (challengeEditMode) row.classList.add("edit-mode");

    row.innerHTML = `
      <div class="challenge-item-left">
        <input type="checkbox" ${checked ? "checked" : ""}>
        <span class="challenge-item-text">${item.text}</span>
      </div>

      <button class="delete-item" data-id="${item.id}">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;


    const checkbox = row.querySelector('input[type="checkbox"]');

    checkbox.onchange = async () => {
      if (!isToday(activeDay)) {
        checkbox.checked = !checkbox.checked; // revert UI
        showError("You can only complete tasks for today");
        return;
      }
      await toggleItemCompletion(item.id, checkbox.checked);
    };


    list.appendChild(row);
  }
}
async function toggleItemCompletion(itemId, checked) {
  if (!isToday(activeDay)) {
  showError("You can only complete today’s tasks");
  return;
}

  const ref = doc(
    db,
    "users",
    auth.currentUser.uid,
    "challenges",
    activeChallenge.id,
    "days",
    activeDay
  );

  const snap = await getDoc(ref);
  const existing = snap.exists()
    ? snap.data().completedItemIds || []
    : [];

  const updated = checked
    ? [...new Set([...existing, itemId])]
    : existing.filter(id => id !== itemId);

  await setDoc(ref, {
    completedItemIds: updated,
    updatedAt: serverTimestamp()
  });

  activeChallenge.completedToday = updated;
  activeChallenge.daysProgress[activeDay] = updated;

  renderProgressRing();
  renderDayStrip();
  renderChallengeCalendar();
  renderChallengeItems();
}

document.getElementById("challengeBackBtn").onclick = () => {
  sessionStorage.removeItem("activeChallengeId");
  sessionStorage.setItem("activeView", "ChallengeView");
  views.forEach(v =>
    v.classList.toggle("active", v.id === "ChallengeView")
  );
};

const challengeCalendarModal =
  document.getElementById("challengeCalendarModal");

document.addEventListener("click", (e) => {
  if (e.target.closest("#challengeCalendarBtn")) {
    openChallengeCalendar();
  }

  if (
    e.target.closest("#closeChallengeCalendar") ||
    e.target === challengeCalendarModal
  ) {
    challengeCalendarModal.classList.add("hidden");
  }
});
function openChallengeCalendar() {
  renderChallengeCalendar();
  challengeCalendarModal.classList.remove("hidden");
}
function renderChallengeCalendar() {
  const grid = document.getElementById("challengeCalendarGrid");
  grid.innerHTML = "";

  const totalItems = activeChallenge.items?.length || 0;

  activeChallenge.days.forEach((day, index) => {
    const completed =
  activeChallenge.daysProgress?.[day]?.length || 0;
    let percent = totalItems ? completed / totalItems : 0;
    if (
      percent === 0 &&
      isPastDay(day)
    ) {
      percent = MIN_PAST_PROGRESS;
    }

    const dash = 2 * Math.PI * 14; // circumference
    const offset = dash - dash * percent;

    const cell = document.createElement("div");
    cell.className = "challenge-calendar-day";
    
    if (day === todayKey()) cell.classList.add("today");
    if (day === activeDay) cell.classList.add("active");

    cell.innerHTML = `
      <svg class="challenge-mini-ring" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r="14"
          class="challenge-mini-bg"
        />
        <circle
          cx="18"
          cy="18"
          r="14"
          class="challenge-mini-progress"
          stroke-dasharray="${dash}"
          stroke-dashoffset="${offset}"
        />
      </svg>
      <span>${index + 1}</span>
    `;

   cell.onclick = async () => {
  activeDay = day;

  const progress =
    await loadDayProgress(activeChallenge.id, activeDay);

  activeChallenge.completedToday = progress;
  activeChallenge.daysProgress[activeDay] = progress;

  challengeCalendarModal.classList.add("hidden");
  renderChallengeDetail();
  updateChallengeDayLabel();
  requestAnimationFrame(scrollDayStripToActive);
};



    grid.appendChild(cell);
  });
}

function toggleChallengeEditMode() {
  challengeEditMode = !challengeEditMode;
  renderChallengeItems();
}
function openAddChallengeItemModal() {
  challengeItemInput.value = "";
  addChallengeItemModal.classList.remove("hidden");
  setTimeout(() => challengeItemInput.focus(), 50);
}
closeAddChallengeItemModal.onclick = () =>
  addChallengeItemModal.classList.add("hidden");

cancelAddChallengeItem.onclick = () =>
  addChallengeItemModal.classList.add("hidden");

saveChallengeItem.onclick = async () => {
  const text = challengeItemInput.value.trim();
  if (!text || !activeChallenge) return;

  await addDoc(
    collection(
      db,
      "users",
      auth.currentUser.uid,
      "challenges",
      activeChallenge.id,
      "items"
    ),
    {
      text,
      createdAt: serverTimestamp()
    }
  );

  addChallengeItemModal.classList.add("hidden");
  showSuccess("Item added");

  activeChallenge.items =
    await loadChallengeItems(activeChallenge.id);

  renderChallengeDetail();
};

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".delete-item");
  if (!btn || !challengeEditMode) return;

  const itemId = btn.dataset.id;
  const uid = auth.currentUser.uid;
  const challengeId = activeChallenge.id;

  /* 1️⃣ Delete item document */
  await deleteDoc(
    doc(
      db,
      "users",
      uid,
      "challenges",
      challengeId,
      "items",
      itemId
    )
  );

  /* 2️⃣ Remove itemId from ALL day completion docs */
  const daysSnap = await getDocs(
    collection(
      db,
      "users",
      uid,
      "challenges",
      challengeId,
      "days"
    )
  );

  for (const dayDoc of daysSnap.docs) {
    const data = dayDoc.data();
    if (!data.completedItemIds?.includes(itemId)) continue;

    await updateDoc(dayDoc.ref, {
      completedItemIds: data.completedItemIds.filter(id => id !== itemId)
    });
  }

  /* 3️⃣ Reload items + today progress */
  activeChallenge.items = await loadChallengeItems(challengeId);
  activeChallenge.completedToday =
    await loadDayProgress(challengeId, activeDay);

  renderChallengeDetail();
});
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isPastDay(day) {
  return day < todayKey();
}

function isFutureDay(day) {
  return day > todayKey();
}

function isToday(day) {
  return day === todayKey();
}





/*******************************************************
 * HOME
 *******************************************************/
function renderHome() {
  renderHomeSummary();
  renderHomeSplitPreview();
  renderHome7DayChart();
}

/*******************************************************
 * PROFILE
 *******************************************************/

usernameInput.addEventListener("change", async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await updateProfile(user, { displayName: usernameInput.value });
    showSuccess("Username updated!");
  } catch (err) {
    console.error(err);
    showError("Unable to update username.");
  }
});

changePasswordBtn.addEventListener("click", () => {
  currentPasswordInput.value = "";
  newPasswordInput.value = "";
  passwordModal.classList.remove("hidden");
});

closePasswordModal.addEventListener("click", () => {
  passwordModal.classList.add("hidden");
});

cancelPasswordBtn.addEventListener("click", () => {
  passwordModal.classList.add("hidden");
});

savePasswordBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const currentPass = currentPasswordInput.value.trim();
  const newPass = newPasswordInput.value.trim();

  if (newPass.length < 6) return showError("New password too short.");

  try {
    // Reauthenticate
    const credential = EmailAuthProvider.credential(user.email, currentPass);
    await reauthenticateWithCredential(user, credential);

    await updatePassword(user, newPass);

    passwordModal.classList.add("hidden");
    showSuccess("Password updated!");
  } catch (err) {
    console.error(err);
    if (
    err.code === "auth/wrong-password" ||
    err.code === "auth/invalid-credential"
  ) {

    showError("Incorrect current password.");
  } else {
    showError("Unable to update password.");
  }
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  sessionStorage.removeItem("activeView");
  window.location.href = "login.html";
});

deleteAccountBtn.addEventListener("click", () => {
  deletePasswordInput.value = "";
  deleteModal.classList.remove("hidden");
});

closeDeleteModal.onclick = () => deleteModal.classList.add("hidden");
cancelDeleteBtn.onclick = () => deleteModal.classList.add("hidden");

confirmDeleteBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  const password = deletePasswordInput.value.trim();

  if (!password) {
    showError("Please enter your password.");
    return;
  }

  try {
    // Reauthenticate
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    await deleteDoc(doc(db, "users", user.uid));
    // Delete immediately
    await deleteUser(user);

    showSuccess("Account deleted");
    setTimeout(() => (window.location.href = "signup.html"), 600);
  } catch (err) {
    console.error(err);

    if (
    err.code === "auth/wrong-password" ||
    err.code === "auth/invalid-credential"
  ) {
      showError("Incorrect password.");
    } else {
      showError("Could not delete account.");
    }
  }
});

document.addEventListener("click", (e) => {

  /* ===== ADD CHALLENGE ITEM ===== */
  if (e.target.closest("#addChallengeItemBtn")) {
    e.stopPropagation();
    openAddChallengeItemModal();
    return;
  }

  /* ===== TOGGLE EDIT MODE ===== */
  if (e.target.closest("#editChallengeItemsBtn")) {
    e.stopPropagation();
    toggleChallengeEditMode();
    return;
  }

});
function showPreloader() {
  document.body.classList.add("spa-preload");
  document.getElementById("preloader").style.display = "flex";
}

function hidePreloader() {
  document.body.classList.remove("spa-preload");
  document.getElementById("preloader").style.display = "none";
}


function init() {
  workoutDateInput.value = new Date().toLocaleDateString("en-CA");
  workoutExercisesContainer.appendChild(createExerciseRow());
}
function initProfile(user) {
    const data = userDoc.data();
    // Fill Email
    usernameInput.setAttribute('readonly', true);
    usernameInput.value = data?.username || user.displayName || '';
    setTimeout(() => usernameInput.removeAttribute('readonly'), 100);
    emailInput.value = user.email;
  
    if (createdInput && data.createdOn) {
      createdInput.value = new Date(data.createdOn).toLocaleDateString();
    }
}
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
    initTheme();
    restoreSessionView(); 
    init();
    initData();
    userDoc = await getDoc(doc(db, 'users', user.uid));
    await loadChallenges();
    const savedView = sessionStorage.getItem("activeView");
    const savedChallengeId = sessionStorage.getItem("activeChallengeId");

    if (savedView === "challengeDetailView" && savedChallengeId) {
      showPreloader();
      await openChallengeDetail(savedChallengeId);
}


    initProfile(user)
    document.body.classList.remove("spa-preload");
    document.getElementById("preloader").style.display = "none";

});