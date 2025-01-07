// Firebase configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2LV0KjpKw68y7XnQ410HINhm2_PtB_v8",
  authDomain: "habit-tracker-e469f.firebaseapp.com",
  databaseURL: "https://habit-tracker-e469f-default-rtdb.firebaseio.com",
  projectId: "habit-tracker-e469f",
  storageBucket: "habit-tracker-e469f.firebasestorage.app",
  messagingSenderId: "798400313959",
  appId: "1:798400313959:web:565643f1236a861fe9f2c2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM Elements
const habitInput = document.getElementById("habitInput");
const addHabitBtn = document.getElementById("addHabitBtn");
const habitTableContainer = document.getElementById("habitTableContainer");

// Add Habit
addHabitBtn.addEventListener("click", () => {
  const habitName = habitInput.value.trim();
  if (habitName === "") {
    alert("Please enter a habit name!");
    return;
  }

  const habitsRef = ref(db, "habits");
  const newHabitRef = push(habitsRef);

  const habitDates = generateDatesForYear();
  set(newHabitRef, { name: habitName, dates: habitDates });
  habitInput.value = "";
});

// Generate Dates for Full Year
function generateDatesForYear() {
  const year = new Date().getFullYear();
  const dates = {};
  for (let month = 0; month < 12; month++) {
    for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      dates[dateKey] = false; // Default: Not completed
    }
  }
  return dates;
}

// Load Habits
function loadHabits() {
  const habitsRef = ref(db, "habits");
  onValue(habitsRef, (snapshot) => {
    const data = snapshot.val();
    renderHabitTable(data);
  });
}

// Render Habit Table
function renderHabitTable(data) {
  if (!data) {
    habitTableContainer.innerHTML = "<p>No habits found.</p>";
    return;
  }

  let tableHTML = "";
  Object.entries(data).forEach(([id, habit]) => {
    const stats = calculateStats(habit.dates);
    tableHTML += `
      <div class="habit-card">
        <h2>${habit.name}</h2>
        <div class="stats">
          <p>Current Streak: ${stats.currentStreak} days</p>
          <p>Longest Streak: ${stats.longestStreak} days</p>
          <p>Last 7 Days: ${stats.last7Days} days</p>
          <p>Last 30 Days: ${stats.last30Days} days</p>
          <p>Year-to-Date: ${stats.yearToDate} days</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `;
    Object.entries(habit.dates).forEach(([date, status]) => {
      tableHTML += `
        <tr>
          <td>${date}</td>
          <td class="${status ? "green" : "red"}" onclick="toggleStatus('${id}', '${date}', ${status})">
            ${status ? "Yes" : "No"}
          </td>
        </tr>
      `;
    });
    tableHTML += `
          </tbody>
        </table>
        <button class="delete-btn" onclick="deleteHabit('${id}')">Delete Habit</button>
      </div>
    `;
  });

  habitTableContainer.innerHTML = tableHTML;
}

// Calculate Streaks and Stats
function calculateStats(dates) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  let currentStreak = 0;
  let longestStreak = 0;
  let last7Days = 0;
  let last30Days = 0;
  let yearToDate = 0;

  let streak = 0;
  const dateKeys = Object.keys(dates);

  for (let i = 0; i < dateKeys.length; i++) {
    const dateKey = dateKeys[i];
    const completed = dates[dateKey];

    // Update year-to-date
    if (completed) {
      yearToDate++;
    }

    // Update last 7 days and 30 days
    const date = new Date(dateKey);
    const diffInDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    if (diffInDays < 7) {
      if (completed) last7Days++;
    }
    if (diffInDays < 30) {
      if (completed) last30Days++;
    }

    // Streak calculation
    if (completed) {
      streak++;
      if (dateKey === todayKey) {
        currentStreak = streak;
      }
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 0;
    }
  }

  return { currentStreak, longestStreak, last7Days, last30Days, yearToDate };
}

// Toggle Status
window.toggleStatus = function (habitId, date, currentStatus) {
  const statusRef = ref(db, `habits/${habitId}/dates/${date}`);
  update(statusRef, { ".value": !currentStatus });
};

// Delete Habit
window.deleteHabit = function (habitId) {
  const habitRef = ref(db, `habits/${habitId}`);
  remove(habitRef);
};

// Initialize
loadHabits();
