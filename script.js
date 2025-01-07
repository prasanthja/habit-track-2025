// Firebase configuration
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
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const habitInput = document.getElementById("habit-input");
const addHabitBtn = document.getElementById("add-habit-btn");
const habitTableBody = document.getElementById("habit-table-body");

function getLast30Days() {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toISOString().split("T")[0]);
    }
    return dates.reverse();
}

function calculateStreaks(days) {
    const dates = Object.keys(days);
    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
    let last7Days = 0;
    let last30Days = 0;
    let yearToDate = 0;
    const today = new Date();

    dates.forEach((date) => {
        const isCompleted = days[date];
        const diff = Math.floor((today - new Date(date)) / (1000 * 60 * 60 * 24));

        if (isCompleted) {
            streak++;
            longestStreak = Math.max(longestStreak, streak);
            if (diff <= 7) last7Days++;
            if (diff <= 30) last30Days++;
            if (new Date(date).getFullYear() === today.getFullYear()) yearToDate++;
        } else {
            streak = 0;
        }
    });

    currentStreak = streak;
    return { currentStreak, longestStreak, last7Days, last30Days, yearToDate };
}

function renderHabitTable(habits) {
    habitTableBody.innerHTML = "";
    const last30Days = getLast30Days();

    for (const habitId in habits) {
        const habit = habits[habitId];
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = habit.name;

        const createdAtCell = document.createElement("td");
        createdAtCell.textContent = new Date(habit.createdAt).toLocaleDateString();

        const actionsCell = document.createElement("td");
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.classList.add("delete-btn");
        deleteBtn.addEventListener("click", () => {
            database.ref(`habits/${habitId}`).remove();
        });
        actionsCell.appendChild(deleteBtn);

        row.appendChild(nameCell);
        row.appendChild(createdAtCell);
        row.appendChild(actionsCell);

        last30Days.forEach((date) => {
            const dayCell = document.createElement("td");
            const toggleBtn = document.createElement("button");
            const isCompleted = habit.days[date] || false;
            toggleBtn.classList.add("toggle-btn", isCompleted ? "completed" : "incomplete");
            toggleBtn.addEventListener("click", () => {
                database.ref(`habits/${habitId}/days/${date}`).set(!isCompleted);
            });
            dayCell.appendChild(toggleBtn);
            row.appendChild(dayCell);
        });

        const streaks = calculateStreaks(habit.days);

        const streakCells = [
            streaks.currentStreak,
            streaks.longestStreak,
            streaks.last7Days,
            streaks.last30Days,
            streaks.yearToDate
        ];

        streakCells.forEach((streakValue) => {
            const streakCell = document.createElement("td");
            streakCell.textContent = streakValue;
            row.appendChild(streakCell);
        });

        habitTableBody.appendChild(row);
    }
}

database.ref("habits").on("value", (snapshot) => {
    const habits = snapshot.val();
    if (habits) {
        renderHabitTable(habits);
    } else {
        habitTableBody.innerHTML = "";
    }
});

addHabitBtn.addEventListener("click", () => {
    const habitName = habitInput.value.trim();
    if (habitName) {
        const habitRef = database.ref("habits").push();
        const habitData = {
            name: habitName,
            createdAt: new Date().toISOString(),
            days: {}
        };

        getLast30Days().forEach((date) => {
            habitData.days[date] = false;
        });

        habitRef.set(habitData);
        habitInput.value = "";
    }
});
