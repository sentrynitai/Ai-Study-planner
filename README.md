# 🤖 AI Study Planner

> A beginner-friendly, intelligent study planning platform that helps students organize their studies, manage tasks, track progress, and receive personalized study recommendations.

## 📌 Overview

**AI Study Planner** is a web-based study management platform designed for students who want a simple and organized way to plan their academic work.

The platform allows students to manage their **subjects, topics, study tasks, daily study time, progress, and study streaks** from a single dashboard.

It also includes an **AI-style Study Assistant** that analyzes the student's study data and provides simple personalized recommendations such as which weak topic to study first or how to use the available study time effectively.

> **Current Version:** The AI recommendation system is implemented using beginner-friendly JavaScript logic. No external AI API or backend is required.

---

## 🎯 Problem Statement

Students often manage their studies using notebooks, reminders, spreadsheets, or multiple applications.

This can make it difficult to:

- Decide what to study first
- Track pending work
- Manage daily study time
- Focus on weak topics
- Measure study progress
- Maintain a consistent study routine

**AI Study Planner** brings these activities together into one simple platform.

---

## 💡 Solution

The platform provides a centralized study dashboard where students can:

- Add and manage subjects
- Organize topics
- Create study tasks
- Set daily study time
- Track completed and pending tasks
- View daily study plans
- Monitor overall progress
- Maintain a study streak
- Receive personalized study recommendations

---

# ✨ Key Features

## 📊 1. Smart Dashboard

The dashboard provides a quick overview of the student's study activity.

It displays:

- Today's Study Goal
- Study Time
- Tasks Completed
- Study Streak
- Today's Study Plan
- AI Recommendation
- Overall Progress

Dashboard values are calculated dynamically from the user's data rather than being hard-coded.

---

## 📚 2. Subject Management

Students can create subjects with:

- Subject Name
- Total Study Hours
- Difficulty

Difficulty options:

- Easy
- Medium
- Hard

Students can also delete subjects when they are no longer needed.

---

## 📝 3. Topic Management

Students can organize individual topics under each subject.

Each topic can be classified as:

- 🟢 Strong
- 🟡 Average
- 🔴 Weak

Weak topics are given higher priority by the recommendation system.

Example:

```text
Data Structures
 ├── Binary Search       → Weak
 ├── Linked List         → Average
 └── Stack               → Strong
```

---

## ✅ 4. Study Task Management

Students can create tasks containing:

- Task Name
- Subject
- Topic
- Date
- Study Duration

Example:

```text
Task: Practice Binary Search
Subject: Data Structures
Topic: Binary Search
Date: 03 October 2026
Duration: 60 minutes
```

Each task can be:

- Completed
- Deleted

Completing a task automatically updates the relevant progress information.

---

## ⏱️ 5. Daily Study-Time Planning

Students can define the amount of time they are available to study each day.

The value is stored in **minutes**.

Examples:

```text
30 minutes  → 30 min
60 minutes  → 1 hr
90 minutes  → 1 hr 30 min
120 minutes → 2 hrs
180 minutes → 3 hrs
```

The planner uses this value when organizing the student's daily study workload.

### Example

For a daily study limit of **120 minutes**:

```text
Binary Search        45 min
Operating Systems    30 min
SQL Practice         30 min
Revision             15 min
---------------------------
Total               120 min
```

The recommended plan should not exceed the student's available daily study time.

---

# 🤖 6. AI Study Assistant

The platform includes an AI-style recommendation system.

It analyzes the student's current study data and provides recommendations based on simple rules.

### Recommendation Priority

```text
1. Weak Topics
2. Overdue Tasks
3. Today's Pending Tasks
4. Hard Subjects
5. General Motivation
```

### Example Recommendations

> Focus on Binary Search today because it is marked as a weak topic.

> You have 3 pending tasks. Start with Operating Systems.

> You have only 1 hour available today. Try a shorter focused study session.

> Great job! You completed all today's tasks 🎉

### How it works

The current version uses JavaScript conditions instead of a machine-learning model.

Example:

```javascript
function generateAIRecommendation() {
    const weakTopic = topics.find(
        topic => topic.difficulty === "Weak"
    );

    if (weakTopic) {
        return `Focus on ${weakTopic.name} today.`;
    }

    return "Keep following your study plan!";
}
```

This approach keeps the application simple enough for beginners while demonstrating the idea of personalized recommendations.

---

# 📅 7. Today's Study Plan

The platform automatically displays the tasks planned for the current date.

Example:

```text
09:00 AM   Binary Search       45 min
11:00 AM   Operating Systems   30 min
04:00 PM   SQL Practice        45 min
```

A progress bar shows how much of today's plan has been completed.

---

# 📈 8. Progress Tracking

The progress section provides important study statistics.

It tracks:

- Total Tasks
- Completed Tasks
- Pending Tasks
- Total Study Hours
- Completed Study Hours
- Progress Percentage

Example:

```text
Total Tasks        : 12
Completed Tasks    : 8
Pending Tasks      : 4
Study Time         : 6.5 hours
Progress           : 67%
```

Progress is calculated dynamically from the stored task data.

---

# 🔥 9. Study Streak

The platform includes a simple study streak system.

When a student completes at least one task on a day:

- The study date is stored.
- Consecutive study days increase the streak.
- A missed day breaks the current streak.

Example:

```text
🔥 5 Day Study Streak
```

This encourages consistent study habits.

---

# 🗓️ 10. Study Calendar

A simple monthly calendar allows students to view planned study activity.

The calendar includes:

- Current month
- Previous month
- Next month
- Today's date
- Dates containing study tasks

Selecting a date can display the tasks planned for that day.

---

# 💾 11. Local Data Storage

The platform uses browser **localStorage** to save student data.

The application can store:

- Subjects
- Topics
- Tasks
- Daily Study Time
- Study History
- Study Streak

Example:

```javascript
localStorage.setItem(
    "subjects",
    JSON.stringify(subjects)
);
```

Data can be loaded again after the page is refreshed.

---

# 🛠️ Technology Stack

## Frontend

- **HTML5**
- **CSS3**
- **Vanilla JavaScript**

## Storage

- **Browser localStorage**

## AI Logic

- **JavaScript rule-based recommendation system**

## No Backend Required

The current platform works completely in the browser.

It does **not** require:

- React
- Next.js
- Node.js
- Python
- Java
- Database server
- External AI API

This keeps the project easy to understand, run, and modify.

---

# 📁 Project Structure

```text
AI-Study-Planner/
│
├── index.html
├── style.css
├── script.js
└── README.md
```

### `index.html`

Contains the structure of the platform:

- Navigation
- Dashboard
- Subject section
- Topic section
- Task section
- Calendar
- Progress
- AI Assistant

### `style.css`

Contains:

- Layout
- Colors
- Cards
- Forms
- Buttons
- Progress bars
- Responsive design

### `script.js`

Contains:

- Application data
- localStorage functions
- Navigation
- Subject management
- Topic management
- Task management
- Dashboard calculations
- AI recommendation logic
- Calendar
- Study streak

### `README.md`

Documentation for the project.

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/AI-Study-Planner.git
```

## 2. Open the Project

```bash
cd AI-Study-Planner
```

## 3. Run the Application

Open:

```text
index.html
```

in your web browser.

You can also use **Live Server** in VS Code.

No package installation is required.

---

# 🖥️ Recommended Development Environment

You can build and edit this project using:

- Visual Studio Code
- Google Antigravity
- Any modern web browser

Recommended browser:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox

---

# 🧠 JavaScript Concepts Demonstrated

This project is useful for learning practical JavaScript concepts such as:

- Variables
- Arrays
- Objects
- Functions
- Conditional statements
- Loops
- Array methods
- `filter()`
- `find()`
- DOM manipulation
- Event listeners
- Form handling
- Date handling
- Template literals
- JSON
- `localStorage`

---

# 📋 Example User Flow

```text
Student opens AI Study Planner
           ↓
Sets daily study time
           ↓
Adds subjects
           ↓
Adds topics
           ↓
Marks weak topics
           ↓
Creates study tasks
           ↓
Views today's study plan
           ↓
Completes tasks
           ↓
Progress updates automatically
           ↓
AI Study Assistant analyzes data
           ↓
Personalized recommendation
```

---

# 🔮 Future Improvements

The current platform is intentionally simple. It can later be extended with:

### 🤖 Real AI Integration

Connect an AI API to generate more advanced:

- Study plans
- Explanations
- Quizzes
- Revision schedules
- Personalized recommendations

### 👤 User Authentication

Add:

- Registration
- Login
- User profiles

### ☁️ Cloud Database

Store study data in a cloud database so students can access their planner from different devices.

### 🔔 Notifications

Add reminders for:

- Upcoming tasks
- Study sessions
- Deadlines
- Revision schedules

### 🍅 Pomodoro Timer

Integrate a study timer for focused sessions.

### 📄 Study Material Analysis

Allow students to upload PDFs or notes and generate:

- Summaries
- Important topics
- Questions
- Revision material

### 📊 Advanced Analytics

Add charts for:

- Weekly study hours
- Subject-wise progress
- Task completion
- Study consistency

---

# 🎓 Project Purpose

This project is designed as both a **real-world student productivity platform** and a **learning project for web development**.

It demonstrates how simple frontend technologies can be combined to build a complete interactive application.

---

# 👨‍💻 Author

**Nitai Das**

B.Tech in Information Technology

---

# ⭐ Support

If you find this project useful for learning, consider giving the repository a ⭐ on GitHub.

---
