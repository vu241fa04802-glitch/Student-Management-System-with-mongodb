# Student Management System (MongoDB)

A simple Student Management System using HTML, CSS and JavaScript on the frontend, Node.js + Express on the backend, and MongoDB for permanent data storage.

## Features
- Add, edit, search and delete students
- Record attendance and add marks
- Dashboard totals, average marks and student reports
- Stores data in MongoDB instead of browser LocalStorage

## Requirements
- Node.js (LTS recommended)
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

## Setup
1. Extract the ZIP and open the `Student-Management-System` folder in VS Code.
2. Open a terminal in that folder and run:
   ```bash
   npm install
   ```
3. Create a `.env` file in the project root and copy the contents of `.env.example`:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/student_management_system
   PORT=3000
   ```
   For MongoDB Atlas, replace the local URI with your Atlas connection string. Keep `.env` private.
4. Make sure MongoDB is running.
5. Start the app:
   ```bash
   npm start
   ```
6. Open `http://localhost:3000`.

## Project structure
```text
Student-Management-System/
├── public/
│   ├── index.html
│   ├── css/
│   ├── images/
│   ├── js/
│   └── pages/
├── server.js
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## API endpoints
- `GET /api/health` - checks server and database status
- `GET /api/data` - loads student, attendance and marks data
- `PUT /api/data` - saves student, attendance and marks data

Data is stored in the `student_management_system` database, in the `appdatas` collection.

## Important
Do not open `public/index.html` directly. Run `npm start` and visit `http://localhost:3000` so the frontend can use the backend API.
