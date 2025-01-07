// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2LV0KjpKw68y7XnQ410HINhm2_PtB_v8",
  authDomain: "habit-tracker-e469f.firebaseapp.com",
  databaseURL: "https://habit-tracker-e469f-default-rtdb.firebaseio.com",
  projectId: "habit-tracker-e469f",
  storageBucket: "habit-tracker-e469f.firebasestorage.app",
  messagingSenderId: "798400313959",
  appId: "1:798400313959:web:565643f1236a861fe9f2c2",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM elements
const habitInput = document.getElementById("habitInput");
const addHabitButton = document.getElementById("addHabit");
const habitTable = document.getElementById("habitTable");

// Generate columns for each day of the year
const generateDaysOfYear = (year) => {
  const days = [];
  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year}-12-31`);

  let currentDate = startDate;
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return days;
};

// Render the table
const renderTable = (habits) => {
  const year = 2025; // Adjust as needed
  const days = generateDaysOfYear(year);

  // Create table header
  let tableHeader = "<tr><th>Habit Name</th>";
  days.forEach((day) => {
    tableHeader += `<th>${day.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}</th>`;
  });
  tableHeader += "<th>Actions</th></tr>";

  // Create table body
  let tableBody = "";
  Object.entries(habits).forEach(([id, habit]) => {
    tableBody += `<tr><td>${habit.name}</td>`;
    days.forEach((day) => {
      const dateKey = day.toISOString().split("T")[0];
      const isDone = habit.dates && habit.dates.includes(dateKey);
      tableBody += `<td class="day-cell ${
        isDone ? "done" : "not-done"
      }" data-id="${id}" data-date="${dateKey}"></td>`;
    });
    tableBody += `
      <td>
        <button class="delete-button" data-id="${id}">Delete</button>
      </td>
    </tr>`;
  });

  habitTable.innerHTML = tableHeader + tableBody;

  // Add event listeners for toggling days
  document.querySelectorAll(".day-cell").forEach((cell) => {
    cell.addEventListener("click", (e) => {
      const id = cell.dataset.id;
      const date = cell.dataset.date;
      const habit = habits[id];

      if (!habit.dates) habit.dates = [];
      if (habit.dates.includes(date)) {
        // Remove date
        habit.dates = habit.dates.filter((d) => d !== date);
        cell.classList.remove("done");
        cell.classList.add("not-done");
      } else {
        // Add date
        habit.dates.push(date);
        cell.classList.remove("not-done");
        cell.classList.add("done");
      }
      database.ref(`habits/${id}`).update({ dates: habit.dates });
    });
  });

  // Add event listeners for delete buttons
  document.querySelectorAll(".delete-button").forEach((button) => {
    button.addEventListener("click", (e) => {
      const id = button.dataset.id;
      database.ref(`habits/${id}`).remove();
    });
  });
};

// Add a new habit
addHabitButton.addEventListener("click", () => {
  const habitName = habitInput.value.trim();
  if (!habitName) {
    alert("Please enter a habit name!");
    return;
  }

  const habit = {
    name: habitName,
    createdAt: new Date().toISOString(),
    dates: [], // To track dates when the habit was completed
  };

  // Save habit to Firebase
  database.ref("habits").push(habit);

  // Clear input field
  habitInput.value = "";
});

// Fetch habits from Firebase
database.ref("habits").on("value", (snapshot) => {
  const habits = snapshot.val() || {};
  renderTable(habits);
});
