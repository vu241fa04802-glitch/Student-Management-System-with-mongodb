// Data is loaded from the MongoDB-backed Express API.
let students = [];
let attendance = [];
let marks = [];

let editIndex = -1;


// Save all application data to MongoDB through the backend API.
async function saveData() {
    try {
        const response = await fetch("/api/data", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ students, attendance, marks })
        });
        if (!response.ok) throw new Error("Could not save data");
        setConnectionStatus("Connected to MongoDB");
    } catch (error) {
        console.error(error);
        setConnectionStatus("Backend connection error");
        alert("Could not save data. Please check that the server and MongoDB are running.");
    }
}

function setConnectionStatus(message) {
    const status = document.getElementById("databaseStatus");
    if (status) status.textContent = message;
}

async function loadData() {
    try {
        setConnectionStatus("Connecting...");
        const response = await fetch("/api/data");
        if (!response.ok) throw new Error("Could not load data");
        const data = await response.json();
        students = data.students || [];
        attendance = data.attendance || [];
        marks = data.marks || [];
        setConnectionStatus("Connected to MongoDB");
        refreshAll();
    } catch (error) {
        console.error(error);
        setConnectionStatus("Backend connection error");
        alert("Unable to connect to the backend. Start the server and check your MongoDB connection.");
    }
}


// Prevent HTML injection when displaying user input

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function(char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[char];
    });
}


// Navigation

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.getElementById(pageId).classList.add("active");

    updateDashboard();
    displayStudents();
    updateStudentOptions();
    displayAttendance();
    displayMarks();
    displayReports();
}


// Add and Edit Students

const studentForm = document.getElementById("studentForm");

studentForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const student = {
        name: document.getElementById("name").value.trim(),
        roll: document.getElementById("roll").value.trim(),
        email: document.getElementById("email").value.trim(),
        branch: document.getElementById("branch").value,
        year: document.getElementById("year").value
    };

    if (students.some((s, i) =>
        s.roll.toLowerCase() === student.roll.toLowerCase() &&
        i !== editIndex
    )) {
        alert("Roll number already exists!");
        return;
    }

    if (editIndex === -1) {
        students.push(student);
        alert("Student added successfully!");
    } else {
        const oldRoll = students[editIndex].roll;

        students[editIndex] = student;

        attendance.forEach(a => {
            if (a.roll === oldRoll) a.roll = student.roll;
        });

        marks.forEach(m => {
            if (m.roll === oldRoll) m.roll = student.roll;
        });

        alert("Student updated successfully!");
    }

    editIndex = -1;

    document.getElementById("studentSubmit").textContent = "Add Student";

    studentForm.reset();

    saveData();
    refreshAll();
});


// Display Students

function displayStudents(searchText = "") {

    const list = document.getElementById("studentList");

    const filtered = students.filter(s =>
        s.name.toLowerCase().includes(searchText.toLowerCase()) ||
        s.roll.toLowerCase().includes(searchText.toLowerCase())
    );

    list.innerHTML = filtered.map(s => `
        <tr>
            <td>${escapeHTML(s.name)}</td>
            <td>${escapeHTML(s.roll)}</td>
            <td>${escapeHTML(s.email)}</td>
            <td>${escapeHTML(s.branch)}</td>
            <td>${escapeHTML(s.year)}</td>
            <td>
                <button class="action-btn edit-btn"
                    data-action="edit"
                    data-roll="${encodeURIComponent(s.roll)}">
                    Edit
                </button>

                <button class="action-btn delete-btn"
                    data-action="delete"
                    data-roll="${encodeURIComponent(s.roll)}">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}


// Search Students

document.getElementById("search").addEventListener("input", function() {
    displayStudents(this.value);
});


// Edit and Delete Students

document.getElementById("studentList").addEventListener("click", function(event) {

    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const roll = decodeURIComponent(button.dataset.roll);

    const index = students.findIndex(s => s.roll === roll);

    if (index === -1) return;

    if (button.dataset.action === "edit") {

        const s = students[index];

        document.getElementById("name").value = s.name;
        document.getElementById("roll").value = s.roll;
        document.getElementById("email").value = s.email;
        document.getElementById("branch").value = s.branch;
        document.getElementById("year").value = s.year;

        editIndex = index;

        document.getElementById("studentSubmit").textContent = "Update Student";

        document.getElementById("students").scrollIntoView();

    } else if (button.dataset.action === "delete") {

        if (confirm("Are you sure you want to delete this student?")) {

            students.splice(index, 1);

            attendance = attendance.filter(a => a.roll !== roll);
            marks = marks.filter(m => m.roll !== roll);

            editIndex = -1;
            studentForm.reset();

            document.getElementById("studentSubmit").textContent = "Add Student";

            saveData();
            refreshAll();
        }
    }
});


// Attendance Student Options

function updateStudentOptions() {

    const options = students.map(s => `
        <option value="${encodeURIComponent(s.roll)}">
            ${escapeHTML(s.name)} (${escapeHTML(s.roll)})
        </option>
    `).join("");

    document.getElementById("attendanceStudent").innerHTML =
        '<option value="">Select Student</option>' + options;

    document.getElementById("marksStudent").innerHTML =
        '<option value="">Select Student</option>' + options;
}


// Set today's date

const today = new Date().toLocaleDateString("en-CA");

document.getElementById("attendanceDate").value = today;


// Attendance Management

document.getElementById("attendanceForm").addEventListener("submit", function(event) {

    event.preventDefault();

    const roll = decodeURIComponent(
        document.getElementById("attendanceStudent").value
    );

    const date = document.getElementById("attendanceDate").value;
    const status = document.getElementById("attendanceStatus").value;

    if (!roll || !date || !status) return;

    const existing = attendance.find(a =>
        a.roll === roll && a.date === date
    );

    if (existing) {
        existing.status = status;
        alert("Attendance updated!");
    } else {
        attendance.push({ roll, date, status });
        alert("Attendance saved!");
    }

    saveData();
    this.reset();
    document.getElementById("attendanceDate").value = today;

    refreshAll();
});


// Display Attendance

function displayAttendance() {

    const list = document.getElementById("attendanceList");

    list.innerHTML = attendance.map(a => {

        const student = students.find(s => s.roll === a.roll);

        if (!student) return "";

        return `
            <tr>
                <td>${escapeHTML(student.name)}</td>
                <td>${escapeHTML(a.date)}</td>
                <td>${escapeHTML(a.status)}</td>
            </tr>
        `;

    }).join("");
}


// Marks Management

document.getElementById("marksForm").addEventListener("submit", function(event) {

    event.preventDefault();

    const roll = decodeURIComponent(
        document.getElementById("marksStudent").value
    );

    const subject = document.getElementById("subject").value.trim();

    const obtained = Number(document.getElementById("marksObtained").value);

    if (!roll || !subject || !Number.isFinite(obtained) ||
        obtained < 0 || obtained > 100) {
        alert("Enter valid marks between 0 and 100.");
        return;
    }

    marks.push({
        roll,
        subject,
        obtained
    });

    alert("Marks added successfully!");

    saveData();
    this.reset();

    refreshAll();
});


// Display Marks

function displayMarks() {

    const list = document.getElementById("marksList");

    list.innerHTML = marks.map(m => {

        const student = students.find(s => s.roll === m.roll);

        if (!student) return "";

        const result = m.obtained >= 35 ? "Pass" : "Fail";

        return `
            <tr>
                <td>${escapeHTML(student.name)}</td>
                <td>${escapeHTML(m.subject)}</td>
                <td>${m.obtained}/100</td>
                <td>${m.obtained}%</td>
                <td>${result}</td>
            </tr>
        `;

    }).join("");
}


// Dashboard

function updateDashboard() {

    document.getElementById("totalStudents").textContent = students.length;

    const todayAttendance = attendance.filter(a => a.date === today);

    const present = todayAttendance.filter(a => a.status === "Present").length;

    const absent = todayAttendance.filter(a => a.status === "Absent").length;

    document.getElementById("presentCount").textContent = present;

    document.getElementById("absentCount").textContent = absent;

    const average = marks.length
        ? marks.reduce((sum, m) => sum + m.obtained, 0) / marks.length
        : 0;

    document.getElementById("averageMarks").textContent =
        average.toFixed(2) + "%";
}


// Reports

function displayReports() {

    const list = document.getElementById("reportList");

    list.innerHTML = students.map(s => {

        const studentAttendance = attendance.filter(a => a.roll === s.roll);

        const present = studentAttendance.filter(
            a => a.status === "Present"
        ).length;

        const attendancePercentage = studentAttendance.length
            ? (present / studentAttendance.length) * 100
            : 0;

        const studentMarks = marks.filter(m => m.roll === s.roll);

        const average = studentMarks.length
            ? studentMarks.reduce((sum, m) => sum + m.obtained, 0) /
              studentMarks.length
            : 0;

        return `
            <tr>
                <td>${escapeHTML(s.name)}</td>
                <td>${escapeHTML(s.roll)}</td>
                <td>${attendancePercentage.toFixed(2)}%</td>
                <td>${average.toFixed(2)}%</td>
            </tr>
        `;

    }).join("");
}


// Refresh all sections

function refreshAll() {
    updateDashboard();
    displayStudents(document.getElementById("search").value);
    updateStudentOptions();
    displayAttendance();
    displayMarks();
    displayReports();
}


// Load data from MongoDB when the website opens.
loadData();