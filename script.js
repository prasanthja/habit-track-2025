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
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const habitInput = document.getElementById("habit-input");
const addHabitBtn = document.getElementById("add-habit-btn");
const habitTableBody = document.getElementById("habit-table-body");

// Helper function to get the last 30 days
function getLast30Days() {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toISOString().split("T")[0]); // Format: YYYY-MM-DD
    }
    return dates.reverse();
}

// Function to add a habit
function addHabit(name) {
    const habitRef = database.ref("habits").push();
    const habitData = {
        name: name,
        createdAt: new Date().toISOString(),
        days: {} // Store daily completion status
    };

    const last30Days = getLast30Days();
    last30Days.forEach((date) => {
        habitData.days[date] = false; // Initialize all as incomplete
    });

    habitRef.set(habitData, (error) => {
        if (error) {
            console.error("Error adding habit:", error);
        } else {
            console.log("Habit added successfully");
        }
    });
}

// Function to toggle day status
function toggleDayStatus(habitId, date) {
    const dayRef = database.ref(`habits/${habitId}/days/${date}`);
    dayRef.once("value", (snapshot) => {
        const currentValue = snapshot.val();
        dayRef.set(!currentValue); // Toggle the value
    });
}

// Function to calculate streaks and stats
function calculateStreaks(days) {
    const dates = Object.keys(days).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let last7Days = 0;
    let last30Days = 0;
    let ytd = 0;

    const today = new Date();
    const janFirst = new Date(today.getFullYear(), 0, 1);

    let streak = 0;
    dates.forEach((date) => {
        const completed = days[date];
        const dayDate = new Date(date);

        if (completed) {
            streak++;
            ytd += dayDate >= janFirst ? 1 : 0;
            last7Days += dayDate >= new Date(today.setDate(today.getDate() - 7)) ? 1 : 0;
            last30Days += dayDate >= new Date(today.setDate(today.getDate() - 30)) ? 1 : 0;
        } else {
            streak = 0;
        }

        longestStreak = Math.max(longestStreak, streak);
    });

    currentStreak = streak;
    return { currentStreak, longestStreak, last7Days, last30Days, ytd };
}

// Function to render habits in the table
function renderHabitTable(habits) {
    habitTableBody.innerHTML = ""; // Clear the table

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
        deleteBtn.addEventListener("click", () => deleteHabit(habitId));
        actionsCell.appendChild(deleteBtn);

        row.appendChild(nameCell);
        row.appendChild(createdAtCell);
        row.appendChild(actionsCell);

        last30Days.forEach((date) => {
            const dayCell = document.createElement("td");
            const toggleBtn = document.createElement("button");
            toggleBtn.classList.add("toggle-btn", habit.days[date] ? "completed" : "incomplete");
            toggleBtn.addEventListener("click", () => toggleDayStatus(habitId, date));
            dayCell.appendChild(toggleBtn);
            row.appendChild(dayCell);
        });

        const { currentStreak, longestStreak, last7Days, last30Days: days30, ytd } = calculateStreaks(habit.days);

        const statsCells = [currentStreak, longestStreak, last7Days, days30, ytd].map((stat) => {
            const cell = document.createElement("td");
            cell.textContent = stat;
            return cell;
        });

        statsCells.forEach((cell) => row.appendChild(cell));

        habitTableBody.appendChild(row);
    }
}

// Listen for habit additions/changes in Firebase
database.ref("habits").on("value", (snapshot) => {
    const habits = snapshot.val();
    if (habits) {
        renderHabitTable(habits);
    } else {
        habitTableBody.innerHTML = ""; // Clear table if no habits
    }
});

// Add habit button click event
addHabitBtn.addEventListener("click", () => {
    const habitName = habitInput.value.trim();
    if (habitName) {
        addHabit(habitName);
        habitInput.value = ""; // Clear input field
    }
});
