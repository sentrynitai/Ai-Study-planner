/* ==========================================================================
   SMART STUDY PLANNER - JAVASCRIPT
   Table of Contents:
   1. Data Structures & State Management
   2. LocalStorage Helpers
   3. Initialization & Demo Data Setup
   4. Navigation & View Switching
   5. Subject Management (Add, Delete, Render, Dropdown Sync)
   6. Topic Management (Add, Delete, Render, Filter)
   7. Task Management (Add, Complete Toggle, Delete, Render)
   8. Dashboard & Progress Calculations
   9. AI Study Assistant Logic
   10. Calendar Engine (Monthly View, Task Indicators, Day View)
   11. Study Streak Calculation
   12. Form Validation, Modals & Toast Utilities
   ========================================================================== */

// Use strict mode for better error detection
'use strict';

/* ==========================================================================
   1. DATA STRUCTURES & STATE MANAGEMENT
   ========================================================================== */

/**
 * Storage Key in Browser's localStorage
 */
const STORAGE_KEY = 'smart_study_planner_app_state_v1';

/**
 * Global App State Object
 * Holds subjects, topics, tasks, daily study goal, and streak info.
 */
let appState = {
  dailyGoalHours: 3.0,
  streak: 0,
  lastCompletedDate: null,
  subjects: [],
  topics: [],
  tasks: []
};

// Currently selected date for the interactive calendar view (defaults to today)
let calendarCurrentDate = new Date();
let calendarSelectedDateStr = getFormattedDateString(new Date());

// Current active filter for the Study Tasks list ('all', 'pending', 'completed')
let currentTaskFilter = 'all';

// Current active subject filter for the Topics list ('all' or subject name)
let currentTopicFilter = 'all';


/* ==========================================================================
   2. LOCAL STORAGE HELPERS
   ========================================================================== */

/**
 * Saves the entire appState object to localStorage as a JSON string.
 */
function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (error) {
    console.error('Failed to save data to localStorage:', error);
    showToast('⚠️ Storage error: Could not save data.');
  }
}

/**
 * Loads the saved state from localStorage.
 * Returns true if saved data existed, false if it's the user's first visit.
 */
function loadData() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
      const parsed = JSON.parse(rawData);
      // Merge with defaults to ensure all expected array fields exist
      appState = {
        dailyGoalHours: parsed.dailyGoalHours !== undefined ? Number(parsed.dailyGoalHours) : 3.0,
        streak: Number(parsed.streak) || 0,
        lastCompletedDate: parsed.lastCompletedDate || null,
        subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
        topics: Array.isArray(parsed.topics) ? parsed.topics : [],
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : []
      };
      if (typeof window !== 'undefined') window.appState = appState;
      return true;
    }
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
  }
  return false;
}

/**
 * Clears all user data from localStorage and resets the app state.
 */
function clearAllData() {
  const confirmed = confirm('Are you sure you want to delete ALL study data? This action cannot be undone.');
  if (!confirmed) return;

  appState = {
    dailyGoalHours: 3.0,
    streak: 0,
    lastCompletedDate: null,
    subjects: [],
    topics: [],
    tasks: []
  };

  if (typeof window !== 'undefined') window.appState = appState;
  saveData();
  refreshAllViews();
  showToast('🗑️ All study planner data cleared.');
}

/**
 * Loads beginner-friendly initial demo records into the app.
 * Dynamically computes dates so tasks appear on TODAY and TOMORROW!
 */
function loadInitialDemoData() {
  const todayStr = getFormattedDateString(new Date());
  
  // Calculate tomorrow's date string
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getFormattedDateString(tomorrow);

  // Calculate yesterday's date string for streak demonstration
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getFormattedDateString(yesterday);

  appState = {
    dailyGoalHours: 3.0,
    streak: 3,
    lastCompletedDate: yesterdayStr,
    subjects: [
      { id: generateId(), name: 'Data Structures', totalHours: 30, difficulty: 'Hard' },
      { id: generateId(), name: 'Operating Systems', totalHours: 25, difficulty: 'Medium' },
      { id: generateId(), name: 'Database Management', totalHours: 20, difficulty: 'Medium' }
    ],
    topics: [
      { id: generateId(), subject: 'Data Structures', name: 'Binary Search', difficulty: 'Weak' },
      { id: generateId(), subject: 'Data Structures', name: 'Linked List', difficulty: 'Average' },
      { id: generateId(), subject: 'Operating Systems', name: 'Process Scheduling', difficulty: 'Weak' },
      { id: generateId(), subject: 'Database Management', name: 'SQL Queries', difficulty: 'Strong' }
    ],
    tasks: [
      {
        id: generateId(),
        name: 'Practice Binary Search',
        subject: 'Data Structures',
        topic: 'Binary Search',
        date: todayStr,
        duration: 45, // in minutes
        completed: false
      },
      {
        id: generateId(),
        name: 'Study CPU Scheduling Algorithms',
        subject: 'Operating Systems',
        topic: 'Process Scheduling',
        date: todayStr,
        duration: 45,
        completed: false
      },
      {
        id: generateId(),
        name: 'Practice SQL Joins & Queries',
        subject: 'Database Management',
        topic: 'SQL Queries',
        date: todayStr,
        duration: 30,
        completed: true
      },
      {
        id: generateId(),
        name: 'Revise Linked List Reversal',
        subject: 'Data Structures',
        topic: 'Linked List',
        date: tomorrowStr,
        duration: 60,
        completed: false
      }
    ]
  };

  if (typeof window !== 'undefined') window.appState = appState;

  saveData();
  refreshAllViews();
  showToast('🔄 Initial demo records loaded successfully!');
}


/* ==========================================================================
   3. INITIALIZATION
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Try loading from localStorage. If no data found, load demo records.
  const hasExistingData = loadData();
  if (!hasExistingData) {
    loadInitialDemoData();
  }

  // 2. Set default date inputs to today
  const todayStr = getFormattedDateString(new Date());
  const taskDateInput = document.getElementById('taskDateInput');
  if (taskDateInput) {
    taskDateInput.value = todayStr;
  }

  // 3. Setup event listeners
  setupNavigationEvents();
  setupFormEventListeners();
  setupCalendarEventListeners();
  setupModalEventListeners();

  // 4. Update the greeting and live date
  updateLiveGreetingAndDate();

  // 5. Check and update the streak status
  evaluateStreakOnLoad();

  // 6. Render all UI components
  refreshAllViews();
});

/**
 * Updates greeting based on time of day (Morning/Afternoon/Evening)
 * and formats the current date string for display.
 */
function updateLiveGreetingAndDate() {
  const greetingEl = document.getElementById('greetingText');
  const dateEl = document.getElementById('currentDateText');

  const now = new Date();
  const hours = now.getHours();

  let greeting = 'Good Evening, Student 👋';
  if (hours < 12) {
    greeting = 'Good Morning, Student 👋';
  } else if (hours < 17) {
    greeting = 'Good Afternoon, Student 👋';
  }

  if (greetingEl) greetingEl.textContent = greeting;

  // Format: "Friday, October 2, 2026"
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  if (dateEl) dateEl.textContent = now.toLocaleDateString(undefined, options);
}

/**
 * Single helper to refresh all views across the app
 */
function refreshAllViews() {
  populateSubjectDropdowns();
  populateTopicDropdowns();
  renderSubjectsList();
  renderTopicsList();
  renderTasksList();
  renderTodayStudyPlan();
  renderCalendar();
  renderProgressTracker();
  renderAIRecommendations();
  updateDashboardStats();
  updateBadges();
}


/* ==========================================================================
   4. NAVIGATION & VIEW SWITCHING
   ========================================================================== */

function setupNavigationEvents() {
  const navItems = document.querySelectorAll('.nav-item');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const openSidebarBtn = document.getElementById('openSidebarBtn');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');

  // Switch between sections
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const sectionName = item.getAttribute('data-section');
      switchSection(sectionName);

      // On mobile, close sidebar after clicking
      if (window.innerWidth <= 768 && sidebar) {
        sidebar.classList.remove('open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
      }
    });
  });

  // Mobile sidebar open/close
  if (openSidebarBtn && sidebar) {
    openSidebarBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      if (sidebarOverlay) sidebarOverlay.classList.add('active');
    });
  }

  if (closeSidebarBtn && sidebar) {
    closeSidebarBtn.addEventListener('click', () => {
      sidebar.classList.remove('open');
      if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    });
  }

  if (sidebarOverlay && sidebar) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    });
  }

  // Quick Action Buttons
  const quickAddTaskBtn = document.getElementById('quickAddTaskBtn');
  if (quickAddTaskBtn) {
    quickAddTaskBtn.addEventListener('click', () => {
      switchSection('tasks');
      const nameInput = document.getElementById('taskNameInput');
      if (nameInput) nameInput.focus();
    });
  }

  const todayAddTaskBtn = document.getElementById('todayAddTaskBtn');
  if (todayAddTaskBtn) {
    todayAddTaskBtn.addEventListener('click', () => {
      switchSection('tasks');
      const dateInput = document.getElementById('taskDateInput');
      if (dateInput) dateInput.value = getFormattedDateString(new Date());
      const nameInput = document.getElementById('taskNameInput');
      if (nameInput) nameInput.focus();
    });
  }

  const viewAllTodayBtn = document.getElementById('viewAllTodayBtn');
  if (viewAllTodayBtn) {
    viewAllTodayBtn.addEventListener('click', () => {
      switchSection('today');
    });
  }

  // Generic buttons with data-nav-target
  document.querySelectorAll('[data-nav-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-nav-target');
      switchSection(target);
    });
  });

  // Sidebar Reset / Clear Buttons
  const resetDemoBtn = document.getElementById('resetDemoBtn');
  if (resetDemoBtn) resetDemoBtn.addEventListener('click', loadInitialDemoData);

  const clearAllBtn = document.getElementById('clearAllBtn');
  if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllData);
}

/**
 * Switches the active visible section in the DOM
 */
function switchSection(sectionId) {
  // Update nav buttons active state
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('data-section') === sectionId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update content sections active state
  document.querySelectorAll('.content-section').forEach(sec => {
    if (sec.id === `section-${sectionId}`) {
      sec.classList.add('active');
    } else {
      sec.classList.remove('active');
    }
  });

  // Re-render specific dynamic components if needed
  if (sectionId === 'calendar') {
    renderCalendar();
  } else if (sectionId === 'progress') {
    renderProgressTracker();
  } else if (sectionId === 'ai') {
    renderAIRecommendations();
  }
}

/**
 * Updates the badges in the navigation menu (counts for tasks, subjects, etc.)
 */
function updateBadges() {
  const todayStr = getFormattedDateString(new Date());
  const todayTasks = appState.tasks.filter(t => t.date === todayStr);
  const pendingTodayTasks = todayTasks.filter(t => !t.completed);

  const navTodayBadge = document.getElementById('navTodayBadge');
  if (navTodayBadge) navTodayBadge.textContent = pendingTodayTasks.length;

  const navSubjectsBadge = document.getElementById('navSubjectsBadge');
  if (navSubjectsBadge) navSubjectsBadge.textContent = appState.subjects.length;

  const navTasksBadge = document.getElementById('navTasksBadge');
  const pendingAllTasks = appState.tasks.filter(t => !t.completed);
  if (navTasksBadge) navTasksBadge.textContent = pendingAllTasks.length;
}


/* ==========================================================================
   5. SUBJECT MANAGEMENT
   ========================================================================== */

/**
 * Adds a new subject to the planner
 */
function addSubject(name, totalHours, difficulty) {
  // Validation
  const trimmedName = name.trim();
  if (!trimmedName) {
    showInputError('subjectNameError', 'Subject name cannot be empty.');
    return false;
  }

  // Check duplicate
  const exists = appState.subjects.some(s => s.name.toLowerCase() === trimmedName.toLowerCase());
  if (exists) {
    showInputError('subjectNameError', 'A subject with this name already exists.');
    return false;
  }

  const hoursNum = parseFloat(totalHours);
  if (isNaN(hoursNum) || hoursNum <= 0) {
    showInputError('subjectHoursError', 'Total hours must be greater than 0.');
    return false;
  }

  const newSubject = {
    id: generateId(),
    name: trimmedName,
    totalHours: hoursNum,
    difficulty: difficulty || 'Medium'
  };

  appState.subjects.push(newSubject);
  saveData();
  refreshAllViews();
  showToast(`📚 Subject "${trimmedName}" added!`);
  return true;
}

/**
 * Deletes a subject and its associated topics and tasks after confirmation
 */
function deleteSubject(subjectId) {
  const subject = appState.subjects.find(s => s.id === subjectId);
  if (!subject) return;

  const confirmed = confirm(`Are you sure you want to delete "${subject.name}"? This will also remove topics and tasks linked to it.`);
  if (!confirmed) return;

  // Remove subject
  appState.subjects = appState.subjects.filter(s => s.id !== subjectId);
  // Remove linked topics
  appState.topics = appState.topics.filter(t => t.subject !== subject.name);
  // Remove linked tasks
  appState.tasks = appState.tasks.filter(t => t.subject !== subject.name);

  saveData();
  refreshAllViews();
  showToast(`Deleted subject "${subject.name}".`);
}

/**
 * Renders the list of subjects in the Subjects section
 */
function renderSubjectsList() {
  const container = document.getElementById('subjectsList');
  const countBadge = document.getElementById('subjectCountBadge');
  if (!container) return;

  if (countBadge) countBadge.textContent = `${appState.subjects.length} Subjects`;

  if (appState.subjects.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <div class="empty-state-text">No subjects added yet.</div>
        <div class="empty-state-subtext">Add your first course subject using the form!</div>
      </div>
    `;
    return;
  }

  container.innerHTML = appState.subjects.map(subject => {
    const diffClass = getDifficultyClass(subject.difficulty);
    // Count topics and tasks under this subject
    const topicCount = appState.topics.filter(t => t.subject === subject.name).length;
    const taskCount = appState.tasks.filter(t => t.subject === subject.name).length;

    return `
      <div class="subject-item">
        <div class="subject-info">
          <div class="subject-name">${escapeHtml(subject.name)}</div>
          <div class="subject-meta">
            <span class="badge ${diffClass}">${escapeHtml(subject.difficulty)}</span>
            <span>⏱️ ${subject.totalHours} hrs</span>
            <span>• ${topicCount} topics</span>
            <span>• ${taskCount} tasks</span>
          </div>
        </div>
        <div class="subject-actions">
          <button class="btn-delete-task" onclick="deleteSubject('${subject.id}')" title="Delete subject">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Populates all Subject <select> dropdowns in the app
 */
function populateSubjectDropdowns() {
  const dropdownIds = ['topicSubjectSelect', 'taskSubjectSelect', 'topicFilterSubject'];
  
  dropdownIds.forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;

    const previousValue = select.value;

    if (id === 'topicFilterSubject') {
      select.innerHTML = '<option value="all">All Subjects</option>';
    } else {
      select.innerHTML = '<option value="">-- Choose Subject --</option>';
    }

    appState.subjects.forEach(subject => {
      const opt = document.createElement('option');
      opt.value = subject.name;
      opt.textContent = subject.name;
      select.appendChild(opt);
    });

    // Restore selected value if still valid
    if (previousValue && Array.from(select.options).some(o => o.value === previousValue)) {
      select.value = previousValue;
    }
  });
}


/* ==========================================================================
   6. TOPIC MANAGEMENT
   ========================================================================== */

/**
 * Adds a new topic under a subject
 */
function addTopic(subjectName, topicName, difficulty) {
  // Validation
  if (!subjectName) {
    showInputError('topicSubjectError', 'Please select a subject.');
    return false;
  }

  const trimmedName = topicName.trim();
  if (!trimmedName) {
    showInputError('topicNameError', 'Topic name cannot be empty.');
    return false;
  }

  // Check duplicate under this subject
  const exists = appState.topics.some(
    t => t.subject === subjectName && t.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (exists) {
    showInputError('topicNameError', 'This topic already exists under this subject.');
    return false;
  }

  const newTopic = {
    id: generateId(),
    subject: subjectName,
    name: trimmedName,
    difficulty: difficulty || 'Weak'
  };

  appState.topics.push(newTopic);
  saveData();
  refreshAllViews();
  showToast(`📝 Topic "${trimmedName}" added!`);
  return true;
}

/**
 * Deletes a topic after confirmation
 */
function deleteTopic(topicId) {
  const topic = appState.topics.find(t => t.id === topicId);
  if (!topic) return;

  const confirmed = confirm(`Are you sure you want to delete topic "${topic.name}"?`);
  if (!confirmed) return;

  appState.topics = appState.topics.filter(t => t.id !== topicId);
  saveData();
  refreshAllViews();
  showToast(`Deleted topic "${topic.name}".`);
}

/**
 * Renders the topics list with subject filter support
 */
function renderTopicsList() {
  const container = document.getElementById('topicsList');
  if (!container) return;

  let filteredTopics = appState.topics;
  if (currentTopicFilter !== 'all') {
    filteredTopics = appState.topics.filter(t => t.subject === currentTopicFilter);
  }

  if (filteredTopics.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-text">No topics available.</div>
        <div class="empty-state-subtext">Add topics to categorize your study materials!</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredTopics.map(topic => {
    const diffClass = getTopicProficiencyClass(topic.difficulty);
    return `
      <div class="topic-item">
        <div class="topic-info">
          <div class="topic-name">${escapeHtml(topic.name)}</div>
          <div class="topic-meta">
            <span class="task-meta-tag">${escapeHtml(topic.subject)}</span>
            <span class="badge ${diffClass}">${escapeHtml(topic.difficulty)}</span>
          </div>
        </div>
        <div class="topic-actions">
          <button class="btn-delete-task" onclick="deleteTopic('${topic.id}')" title="Delete topic">
            🗑️
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Populates Topic dropdown in the Task Creation form based on selected subject
 */
function populateTopicDropdowns(selectedSubject = '') {
  const topicSelect = document.getElementById('taskTopicSelect');
  if (!topicSelect) return;

  topicSelect.innerHTML = '<option value="">-- Choose Topic (Optional) --</option>';

  let topicsToDisplay = appState.topics;
  if (selectedSubject) {
    topicsToDisplay = appState.topics.filter(t => t.subject === selectedSubject);
  }

  topicsToDisplay.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.name;
    opt.textContent = `${t.name} (${t.difficulty})`;
    topicSelect.appendChild(opt);
  });
}


/* ==========================================================================
   7. STUDY TASK MANAGEMENT
   ========================================================================== */

/**
 * Adds a new study task
 */
function addTask(name, subject, topic, date, duration) {
  // Validation
  const trimmedName = name.trim();
  if (!trimmedName) {
    showInputError('taskNameError', 'Task name cannot be empty.');
    return false;
  }

  if (!subject) {
    showInputError('taskSubjectError', 'Please select a subject.');
    return false;
  }

  if (!date) {
    showInputError('taskDateError', 'Please select a study date.');
    return false;
  }

  const durationNum = parseInt(duration, 10);
  if (isNaN(durationNum) || durationNum <= 0) {
    showInputError('taskDurationError', 'Study duration must be greater than 0 minutes.');
    return false;
  }

  const newTask = {
    id: generateId(),
    name: trimmedName,
    subject: subject,
    topic: topic || '',
    date: date,
    duration: durationNum,
    completed: false
  };

  appState.tasks.push(newTask);
  saveData();
  refreshAllViews();
  showToast(`⏱️ Task "${trimmedName}" created!`);
  return true;
}

/**
 * Toggles a task's completed state
 */
function toggleTaskComplete(taskId) {
  const task = appState.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed = !task.completed;

  // If task was just completed, update study streak
  if (task.completed) {
    recordTaskCompletionForStreak();
    showToast(`🎉 Task completed! Keep it up!`);
  } else {
    showToast(`Task marked pending.`);
  }

  saveData();
  refreshAllViews();
}

/**
 * Deletes a task
 */
function deleteTask(taskId) {
  const task = appState.tasks.find(t => t.id === taskId);
  if (!task) return;

  const confirmed = confirm(`Are you sure you want to delete task "${task.name}"?`);
  if (!confirmed) return;

  appState.tasks = appState.tasks.filter(t => t.id !== taskId);
  saveData();
  refreshAllViews();
  showToast(`Deleted task "${task.name}".`);
}

/**
 * Helper to build the HTML for an individual task item
 */
function buildTaskItemHtml(task) {
  const completedClass = task.completed ? 'completed' : '';
  const checkIcon = task.completed ? '✓' : '';
  const dateDisplay = formatDisplayDate(task.date);

  return `
    <div class="task-item ${completedClass}" id="task-${task.id}">
      <div class="task-left">
        <button class="task-check-btn" onclick="toggleTaskComplete('${task.id}')" title="Toggle Complete">
          ${checkIcon}
        </button>
        <div class="task-details">
          <div class="task-title">${escapeHtml(task.name)}</div>
          <div class="task-meta">
            <span class="task-meta-tag">📚 ${escapeHtml(task.subject)}</span>
            ${task.topic ? `<span class="task-meta-tag">📝 ${escapeHtml(task.topic)}</span>` : ''}
            <span>📅 ${dateDisplay}</span>
            <span>⏱️ ${task.duration} min</span>
          </div>
        </div>
      </div>
      <div class="task-actions">
        <button class="btn-delete-task" onclick="deleteTask('${task.id}')" title="Delete Task">
          🗑️
        </button>
      </div>
    </div>
  `;
}

/**
 * Renders the All Tasks list with filtering (All, Pending, Completed)
 */
function renderTasksList() {
  const container = document.getElementById('allTasksList');
  if (!container) return;

  let tasksToRender = [...appState.tasks];

  // Apply status filter
  if (currentTaskFilter === 'pending') {
    tasksToRender = tasksToRender.filter(t => !t.completed);
  } else if (currentTaskFilter === 'completed') {
    tasksToRender = tasksToRender.filter(t => t.completed);
  }

  // Sort: pending first, then by date ascending
  tasksToRender.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.date.localeCompare(b.date);
  });

  if (tasksToRender.length === 0) {
    let emptyMessage = 'No study tasks found.';
    if (currentTaskFilter === 'pending') emptyMessage = 'No pending tasks! All caught up 🎉';
    if (currentTaskFilter === 'completed') emptyMessage = 'No completed tasks yet. Finish a session!';

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⏱️</div>
        <div class="empty-state-text">${emptyMessage}</div>
      </div>
    `;
    return;
  }

  container.innerHTML = tasksToRender.map(buildTaskItemHtml).join('');
}

/**
 * Renders Today's Study Plan on both the Dashboard widget and the dedicated Today section
 */
function renderTodayStudyPlan() {
  const todayStr = getFormattedDateString(new Date());
  const todayTasks = appState.tasks.filter(t => t.date === todayStr);
  const completedToday = todayTasks.filter(t => t.completed);

  // Calculate percentage
  const percent = todayTasks.length > 0 
    ? Math.round((completedToday.length / todayTasks.length) * 100) 
    : 0;

  // 1. Dashboard Widget
  const dashList = document.getElementById('dashboardTodayTaskList');
  const dashBar = document.getElementById('todayProgressBar');
  const dashPercent = document.getElementById('todayProgressPercent');
  const dashSubtitle = document.getElementById('todayPlanDateSubtitle');

  if (dashBar) dashBar.style.width = `${percent}%`;
  if (dashPercent) dashPercent.textContent = `${percent}%`;
  if (dashSubtitle) dashSubtitle.textContent = `Today: ${formatDisplayDate(todayStr)}`;

  if (dashList) {
    if (todayTasks.length === 0) {
      dashList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">☕</div>
          <div class="empty-state-text">No study tasks for today.</div>
          <div class="empty-state-subtext">Add a task to start learning!</div>
        </div>
      `;
    } else {
      dashList.innerHTML = todayTasks.map(buildTaskItemHtml).join('');
    }
  }

  // 2. Dedicated Today Section
  const todayFullList = document.getElementById('todayTasksFullList');
  const todayDetailBar = document.getElementById('todayDetailProgressBar');
  const todayDetailPercent = document.getElementById('todayDetailProgressPercent');
  const todayProgressText = document.getElementById('todayProgressText');
  const todayTaskCountBadge = document.getElementById('todayTaskCountBadge');

  if (todayDetailBar) todayDetailBar.style.width = `${percent}%`;
  if (todayDetailPercent) todayDetailPercent.textContent = `${percent}%`;
  if (todayProgressText) {
    todayProgressText.textContent = `${completedToday.length} of ${todayTasks.length} tasks completed today`;
  }
  if (todayTaskCountBadge) todayTaskCountBadge.textContent = `${todayTasks.length} Tasks`;

  if (todayFullList) {
    if (todayTasks.length === 0) {
      todayFullList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-text">No tasks scheduled for today.</div>
          <div class="empty-state-subtext">Click "+ Add Task for Today" to plan your schedule!</div>
        </div>
      `;
    } else {
      todayFullList.innerHTML = todayTasks.map(buildTaskItemHtml).join('');
    }
  }
}


/* ==========================================================================
   8. DASHBOARD & PROGRESS CALCULATIONS
   ========================================================================== */

/**
 * Calculates and updates all 4 dynamic summary cards on the Dashboard
 */
function updateDashboardStats() {
  const todayStr = getFormattedDateString(new Date());

  // 1. Today's Study Goal
  const goalEl = document.getElementById('cardTodayGoal');
  if (goalEl) goalEl.textContent = `${appState.dailyGoalHours.toFixed(1)} Hours`;

  // 2. Study Time Completed Today (calculated dynamically in hours)
  const todayTasks = appState.tasks.filter(t => t.date === todayStr);
  const completedTodayTasks = todayTasks.filter(t => t.completed);
  const totalTodayMinutes = completedTodayTasks.reduce((sum, task) => sum + task.duration, 0);
  const todayHours = (totalTodayMinutes / 60).toFixed(1);

  const studyTimeEl = document.getElementById('cardStudyTime');
  if (studyTimeEl) studyTimeEl.textContent = `${todayHours} Hours`;

  const studyTimeSubtext = document.getElementById('cardStudyTimeSubtext');
  if (studyTimeSubtext) {
    const goalMinutes = appState.dailyGoalHours * 60;
    const remainingMin = Math.max(0, goalMinutes - totalTodayMinutes);
    if (remainingMin === 0 && totalTodayMinutes > 0) {
      studyTimeSubtext.textContent = `🎯 Goal achieved for today!`;
    } else {
      studyTimeSubtext.textContent = `${remainingMin} min remaining to reach goal`;
    }
  }

  // 3. Tasks Completed (Today: completed / total)
  const tasksCompletedEl = document.getElementById('cardTasksCompleted');
  if (tasksCompletedEl) {
    tasksCompletedEl.textContent = `${completedTodayTasks.length} / ${todayTasks.length}`;
  }

  const tasksCompletedSubtext = document.getElementById('cardTasksCompletedSubtext');
  if (tasksCompletedSubtext) {
    const percent = todayTasks.length > 0 
      ? Math.round((completedTodayTasks.length / todayTasks.length) * 100) 
      : 0;
    tasksCompletedSubtext.textContent = `${percent}% of today's plan finished`;
  }

  // 4. Study Streak
  const streakEl = document.getElementById('cardStudyStreak');
  if (streakEl) streakEl.textContent = `${appState.streak} Days`;

  const streakSubtext = document.getElementById('cardStreakSubtext');
  if (streakSubtext) {
    if (appState.streak === 0) {
      streakSubtext.textContent = 'Complete a task today to start your streak!';
    } else {
      streakSubtext.textContent = '🔥 Streak active! Keep going!';
    }
  }

  const sidebarStreakCount = document.getElementById('sidebarStreakCount');
  if (sidebarStreakCount) sidebarStreakCount.textContent = `${appState.streak} Days`;

  // Render subject chips in the dashboard overview
  renderDashboardSubjectChips();
}

/**
 * Renders quick subject tags on the dashboard
 */
function renderDashboardSubjectChips() {
  const container = document.getElementById('dashboardSubjectChips');
  if (!container) return;

  if (appState.subjects.length === 0) {
    container.innerHTML = `<span class="text-muted" style="font-size: 0.9rem;">No subjects added yet. Add one in the Subjects tab!</span>`;
    return;
  }

  container.innerHTML = appState.subjects.map(s => {
    const diffClass = getDifficultyClass(s.difficulty);
    return `
      <div class="subject-chip">
        <span>${escapeHtml(s.name)}</span>
        <span class="badge ${diffClass}">${escapeHtml(s.difficulty)}</span>
      </div>
    `;
  }).join('');
}

/**
 * Renders the detailed Progress Section analytics
 */
function renderProgressTracker() {
  const totalTasks = appState.tasks.length;
  const completedTasks = appState.tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;

  const totalPlannedMinutes = appState.tasks.reduce((sum, t) => sum + t.duration, 0);
  const completedMinutes = appState.tasks.filter(t => t.completed).reduce((sum, t) => sum + t.duration, 0);

  const totalPlannedHours = (totalPlannedMinutes / 60).toFixed(1);
  const completedHours = (completedMinutes / 60).toFixed(1);

  const overallPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const timePercent = totalPlannedMinutes > 0 ? Math.round((completedMinutes / totalPlannedMinutes) * 100) : 0;

  // Update stat numbers
  const progTotalTasks = document.getElementById('progTotalTasks');
  if (progTotalTasks) progTotalTasks.textContent = totalTasks;

  const progCompletedTasks = document.getElementById('progCompletedTasks');
  if (progCompletedTasks) progCompletedTasks.textContent = completedTasks;

  const progCompletedRatio = document.getElementById('progCompletedRatio');
  if (progCompletedRatio) progCompletedRatio.textContent = `${overallPercent}% completed`;

  const progPendingTasks = document.getElementById('progPendingTasks');
  if (progPendingTasks) progPendingTasks.textContent = pendingTasks;

  const progCompletedHours = document.getElementById('progCompletedHours');
  if (progCompletedHours) progCompletedHours.textContent = `${completedHours} hrs`;

  const progTotalPlannedHours = document.getElementById('progTotalPlannedHours');
  if (progTotalPlannedHours) progTotalPlannedHours.textContent = `of ${totalPlannedHours} hrs planned`;

  // Update progress bars
  const progOverallPercent = document.getElementById('progOverallPercent');
  if (progOverallPercent) progOverallPercent.textContent = `${overallPercent}%`;

  const progOverallBar = document.getElementById('progOverallBar');
  if (progOverallBar) progOverallBar.style.width = `${overallPercent}%`;

  const progTimePercent = document.getElementById('progTimePercent');
  if (progTimePercent) progTimePercent.textContent = `${timePercent}%`;

  const progTimeBar = document.getElementById('progTimeBar');
  if (progTimeBar) progTimeBar.style.width = `${timePercent}%`;

  // Render subject breakdown
  renderSubjectBreakdown();
}

/**
 * Renders subject-wise task completion breakdown bars
 */
function renderSubjectBreakdown() {
  const container = document.getElementById('subjectProgressBreakdown');
  if (!container) return;

  if (appState.subjects.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-text">No subjects to display.</div></div>`;
    return;
  }

  container.innerHTML = appState.subjects.map(subject => {
    const subjectTasks = appState.tasks.filter(t => t.subject === subject.name);
    const completedSubjectTasks = subjectTasks.filter(t => t.completed);
    const percent = subjectTasks.length > 0 
      ? Math.round((completedSubjectTasks.length / subjectTasks.length) * 100) 
      : 0;

    return `
      <div class="subject-progress-row">
        <div class="subject-progress-header">
          <span class="font-bold">${escapeHtml(subject.name)}</span>
          <span class="text-muted">${completedSubjectTasks.length}/${subjectTasks.length} tasks (${percent}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${percent}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}


/* ==========================================================================
   9. AI STUDY ASSISTANT LOGIC
   ========================================================================== */

/**
 * Analyzes the user's subjects, topics, tasks, and study progress
 * using simple beginner-friendly JavaScript rules.
 *
 * Priority order:
 * 1. Weak topics that have pending tasks
 * 2. Overdue tasks (due before today and not completed)
 * 3. Today's pending tasks
 * 4. Hard subjects with pending work
 * 5. Available daily study time comparison
 * 6. High completion / motivational praise
 */
function generateAIRecommendation() {
  const todayStr = getFormattedDateString(new Date());

  const todayTasks = appState.tasks.filter(t => t.date === todayStr);
  const pendingTodayTasks = todayTasks.filter(t => !t.completed);
  const completedTodayTasks = todayTasks.filter(t => t.completed);

  // Overdue tasks
  const overdueTasks = appState.tasks.filter(t => !t.completed && t.date < todayStr);

  // Weak topics
  const weakTopics = appState.topics.filter(t => t.difficulty === 'Weak');
  // Pending tasks that belong to a weak topic
  const pendingWeakTasks = appState.tasks.filter(task => {
    if (task.completed) return false;
    return weakTopics.some(w => w.name.toLowerCase() === task.topic.toLowerCase() && w.subject === task.subject);
  });

  // Hard subjects
  const hardSubjects = appState.subjects.filter(s => s.difficulty === 'Hard');
  const pendingHardTasks = appState.tasks.filter(task => {
    if (task.completed) return false;
    return hardSubjects.some(h => h.name === task.subject);
  });

  // Calculate study time completed today
  const minutesStudiedToday = completedTodayTasks.reduce((sum, t) => sum + t.duration, 0);
  const targetMinutes = appState.dailyGoalHours * 60;
  const remainingMinutes = targetMinutes - minutesStudiedToday;

  let primaryHeadline = '';
  let primaryDescription = '';
  let priorityTag = 'Study Priority';
  const insights = [];

  // RULE 1: Weak topic with pending tasks
  if (pendingWeakTasks.length > 0) {
    const focusTask = pendingWeakTasks[0];
    primaryHeadline = `Focus on "${focusTask.topic}" today — marked as a Weak topic`;
    primaryDescription = `We detected that topic "${focusTask.topic}" in ${focusTask.subject} needs the most practice. Schedule ${focusTask.duration} minutes to work through key concepts.`;
    priorityTag = 'Weak Topic Focus';
  }
  // RULE 2: Overdue tasks
  else if (overdueTasks.length > 0) {
    const overdue = overdueTasks[0];
    primaryHeadline = `Catch up on ${overdueTasks.length} overdue study task(s)`;
    primaryDescription = `"${overdue.name}" (${overdue.subject}) was scheduled for ${formatDisplayDate(overdue.date)}. Completing it now will keep you on track.`;
    priorityTag = 'Catch Up Needed';
  }
  // RULE 3: Today's pending tasks
  else if (pendingTodayTasks.length > 0) {
    const nextTask = pendingTodayTasks[0];
    primaryHeadline = `Start with "${nextTask.name}" (${nextTask.duration} min)`;
    primaryDescription = `You have ${pendingTodayTasks.length} pending task(s) on today's study plan. Starting with ${nextTask.subject} will build strong study momentum.`;
    priorityTag = "Today's Agenda";
  }
  // RULE 4: All today's tasks completed
  else if (todayTasks.length > 0 && pendingTodayTasks.length === 0) {
    primaryHeadline = `Great job! You completed all today's tasks 🎉`;
    primaryDescription = `You have completed 100% of your planned study sessions for today. Your study streak is active (${appState.streak} Days). Take a well-deserved break or review tomorrow's plan!`;
    priorityTag = 'Goal Achieved';
  }
  // RULE 5: No tasks planned for today
  else if (todayTasks.length === 0) {
    if (appState.subjects.length > 0) {
      primaryHeadline = `Plan your study session for today`;
      primaryDescription = `You have no study tasks scheduled for today. Pick a topic from ${appState.subjects[0].name} and set a 30-45 minute session to maintain your streak!`;
    } else {
      primaryHeadline = `Welcome! Add your first subject to get started`;
      primaryDescription = `Begin by adding course subjects and study topics. The AI Assistant will automatically build personalized study suggestions.`;
    }
    priorityTag = 'Getting Started';
  }

  // BUILD SECONDARY INSIGHTS

  // Insight A: Daily Goal & Time Optimization
  if (remainingMinutes > 0 && minutesStudiedToday > 0) {
    insights.push({
      icon: '⏳',
      title: 'Time Optimization',
      body: `You studied ${(minutesStudiedToday / 60).toFixed(1)} hrs today. You need ${remainingMinutes} more minutes to hit your ${appState.dailyGoalHours} hr goal. Try two 25-minute Pomodoro sessions!`
    });
  } else if (remainingMinutes <= 0 && minutesStudiedToday > 0) {
    insights.push({
      icon: '🏆',
      title: 'Daily Goal Crushed',
      body: `You achieved your ${appState.dailyGoalHours} hour daily study goal today! Outstanding discipline.`
    });
  } else {
    insights.push({
      icon: '🎯',
      title: 'Daily Target',
      body: `Your daily target is ${appState.dailyGoalHours} hours. Break your study time into focused 30-45 minute blocks with 5-minute pauses.`
    });
  }

  // Insight B: Hard Subject Strategy
  if (pendingHardTasks.length > 0) {
    const hardSub = pendingHardTasks[0].subject;
    insights.push({
      icon: '🧠',
      title: `Hard Subject Strategy: ${hardSub}`,
      body: `Since ${hardSub} has challenging concepts, review fundamental theory for 15 minutes before tackling difficult practice questions.`
    });
  } else if (weakTopics.length > 0) {
    insights.push({
      icon: '💡',
      title: `Active Recall for ${weakTopics[0].name}`,
      body: `Use flashcards or self-quizzing for ${weakTopics[0].name}. Testing yourself yields 50% better retention than passive reading.`
    });
  } else {
    insights.push({
      icon: '📚',
      title: 'Spaced Repetition Tip',
      body: 'Revisit learned topics after 1 day, 3 days, and 7 days to transfer them into long-term memory.'
    });
  }

  // Insight C: Streak Motivation
  insights.push({
    icon: '🔥',
    title: `${appState.streak} Day Study Streak`,
    body: appState.streak > 0 
      ? `Consistency is key! Complete at least one study session today to keep your streak burning strong.`
      : `Complete any task today to ignite your study streak.`
  });

  return {
    headline: primaryHeadline,
    description: primaryDescription,
    tag: priorityTag,
    insights: insights
  };
}

/**
 * Renders AI recommendations on both Dashboard and AI Assistant section
 */
function renderAIRecommendations() {
  const recData = generateAIRecommendation();

  // 1. Dashboard Widget Box
  const dashAiBox = document.getElementById('dashboardAiBox');
  if (dashAiBox) {
    dashAiBox.innerHTML = `
      <div class="ai-rec-headline">${escapeHtml(recData.headline)}</div>
      <div class="ai-rec-text">${escapeHtml(recData.description)}</div>
      <ul class="ai-rec-bullets">
        ${recData.insights.slice(0, 2).map(ins => `
          <li><span>${ins.icon}</span> <strong>${escapeHtml(ins.title)}:</strong> ${escapeHtml(ins.body)}</li>
        `).join('')}
      </ul>
    `;
  }

  // 2. Full AI Section Hero Banner
  const heroContainer = document.getElementById('aiHeroRecommendation');
  if (heroContainer) {
    heroContainer.innerHTML = `
      <div class="ai-hero-header">
        <span class="ai-hero-tag">${escapeHtml(recData.tag)}</span>
        <span>✨ AI Real-Time Analysis</span>
      </div>
      <h3 class="ai-hero-title">${escapeHtml(recData.headline)}</h3>
      <p class="ai-hero-desc">${escapeHtml(recData.description)}</p>
    `;
  }

  // 3. Full AI Section Insights Grid
  const gridContainer = document.getElementById('aiInsightsGrid');
  if (gridContainer) {
    gridContainer.innerHTML = recData.insights.map(ins => `
      <div class="insight-card">
        <div class="insight-icon">${ins.icon}</div>
        <div class="insight-title">${escapeHtml(ins.title)}</div>
        <div class="insight-body">${escapeHtml(ins.body)}</div>
      </div>
    `).join('');
  }
}


/* ==========================================================================
   10. CALENDAR ENGINE (Vanilla JavaScript)
   ========================================================================== */

/**
 * Renders the monthly calendar grid and date task details
 */
function renderCalendar() {
  const monthYearEl = document.getElementById('calendarMonthYear');
  const daysGrid = document.getElementById('calendarDaysGrid');
  if (!monthYearEl || !daysGrid) return;

  const year = calendarCurrentDate.getFullYear();
  const month = calendarCurrentDate.getMonth();

  // Display Month and Year in header
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  monthYearEl.textContent = `${monthNames[month]} ${year}`;

  // Calendar math
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const lastDayCurrentMonth = new Date(year, month + 1, 0).getDate();
  const lastDayPrevMonth = new Date(year, month, 0).getDate();

  const todayStr = getFormattedDateString(new Date());

  daysGrid.innerHTML = '';

  // 1. Previous month trailing days
  for (let i = firstDayIndex; i > 0; i--) {
    const dayNum = lastDayPrevMonth - i + 1;
    const prevDate = new Date(year, month - 1, dayNum);
    const dateStr = getFormattedDateString(prevDate);

    const cell = document.createElement('div');
    cell.className = 'calendar-day other-month';
    cell.textContent = dayNum;
    cell.addEventListener('click', () => selectCalendarDate(dateStr, prevDate));
    daysGrid.appendChild(cell);
  }

  // 2. Current month days
  for (let day = 1; day <= lastDayCurrentMonth; day++) {
    const dateObj = new Date(year, month, day);
    const dateStr = getFormattedDateString(dateObj);

    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    cell.textContent = day;

    // Check if it's today
    if (dateStr === todayStr) {
      cell.classList.add('today');
    }

    // Check if it is currently selected
    if (dateStr === calendarSelectedDateStr) {
      cell.classList.add('selected');
    }

    // Check if any study tasks are scheduled on this date
    const hasTasks = appState.tasks.some(t => t.date === dateStr);
    if (hasTasks) {
      cell.classList.add('has-tasks');
    }

    cell.addEventListener('click', () => selectCalendarDate(dateStr, dateObj));
    daysGrid.appendChild(cell);
  }

  // 3. Next month leading days to fill up grid
  const totalRendered = firstDayIndex + lastDayCurrentMonth;
  const remainingCells = (totalRendered % 7 === 0) ? 0 : 7 - (totalRendered % 7);

  for (let nextDay = 1; nextDay <= remainingCells; nextDay++) {
    const nextDate = new Date(year, month + 1, nextDay);
    const dateStr = getFormattedDateString(nextDate);

    const cell = document.createElement('div');
    cell.className = 'calendar-day other-month';
    cell.textContent = nextDay;
    cell.addEventListener('click', () => selectCalendarDate(dateStr, nextDate));
    daysGrid.appendChild(cell);
  }

  // Render the task list for the currently selected date
  renderCalendarSelectedDateTasks();
}

/**
 * Handles clicking a date in the calendar
 */
function selectCalendarDate(dateStr, dateObj) {
  calendarSelectedDateStr = dateStr;
  calendarCurrentDate = new Date(dateObj);
  renderCalendar();
}

/**
 * Renders tasks for the currently selected calendar date in the right panel
 */
function renderCalendarSelectedDateTasks() {
  const titleEl = document.getElementById('selectedDateTitle');
  const subtitleEl = document.getElementById('selectedDateSubtitle');
  const container = document.getElementById('calendarSelectedTaskList');
  if (!container) return;

  const displayDate = formatDisplayDate(calendarSelectedDateStr);
  if (titleEl) titleEl.textContent = displayDate;

  const dateTasks = appState.tasks.filter(t => t.date === calendarSelectedDateStr);
  if (subtitleEl) {
    subtitleEl.textContent = `${dateTasks.length} task(s) planned`;
  }

  if (dateTasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📆</div>
        <div class="empty-state-text">No tasks for this date.</div>
        <div class="empty-state-subtext">Click "+ Add for this Date" to schedule a session!</div>
      </div>
    `;
    return;
  }

  container.innerHTML = dateTasks.map(buildTaskItemHtml).join('');
}

/**
 * Calendar Previous, Next, and Today Navigation Buttons
 */
function setupCalendarEventListeners() {
  const prevBtn = document.getElementById('prevMonthBtn');
  const nextBtn = document.getElementById('nextMonthBtn');
  const todayBtn = document.getElementById('todayMonthBtn');
  const addForSelectedDateBtn = document.getElementById('addForSelectedDateBtn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
      renderCalendar();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
      renderCalendar();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      calendarCurrentDate = new Date();
      calendarSelectedDateStr = getFormattedDateString(new Date());
      renderCalendar();
    });
  }

  if (addForSelectedDateBtn) {
    addForSelectedDateBtn.addEventListener('click', () => {
      switchSection('tasks');
      const dateInput = document.getElementById('taskDateInput');
      if (dateInput) dateInput.value = calendarSelectedDateStr;
      const nameInput = document.getElementById('taskNameInput');
      if (nameInput) nameInput.focus();
    });
  }
}


/* ==========================================================================
   11. STUDY STREAK CALCULATION
   ========================================================================== */

/**
 * Evaluates the study streak on page load.
 * Resets streak to 0 if there was a gap of more than 1 day since last completion.
 */
function evaluateStreakOnLoad() {
  if (!appState.lastCompletedDate) {
    appState.streak = 0;
    saveData();
    return;
  }

  const todayStr = getFormattedDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getFormattedDateString(yesterday);

  // If the last completed date was today or yesterday, streak is preserved.
  // If older than yesterday, there was a gap -> reset streak to 0.
  if (appState.lastCompletedDate !== todayStr && appState.lastCompletedDate !== yesterdayStr) {
    appState.streak = 0;
    saveData();
  }
}

/**
 * Increases or maintains the study streak when a task is completed.
 */
function recordTaskCompletionForStreak() {
  const todayStr = getFormattedDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getFormattedDateString(yesterday);

  if (appState.lastCompletedDate === todayStr) {
    // Already counted today's activity towards the streak
    return;
  }

  if (appState.lastCompletedDate === yesterdayStr) {
    // Consecutive day study!
    appState.streak += 1;
  } else {
    // Starting a new streak or first time
    appState.streak = 1;
  }

  appState.lastCompletedDate = todayStr;
  saveData();
}


/* ==========================================================================
   12. FORM VALIDATION, MODALS & TOAST UTILITIES
   ========================================================================== */

function setupFormEventListeners() {
  // 1. Add Subject Form
  const addSubjectForm = document.getElementById('addSubjectForm');
  if (addSubjectForm) {
    addSubjectForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearInputErrors(['subjectNameError', 'subjectHoursError']);

      const name = document.getElementById('subjectNameInput').value;
      const hours = document.getElementById('subjectHoursInput').value;
      const difficulty = document.getElementById('subjectDifficultySelect').value;

      const success = addSubject(name, hours, difficulty);
      if (success) {
        addSubjectForm.reset();
        document.getElementById('subjectDifficultySelect').value = 'Medium';
      }
    });
  }

  // 2. Add Topic Form
  const addTopicForm = document.getElementById('addTopicForm');
  if (addTopicForm) {
    addTopicForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearInputErrors(['topicSubjectError', 'topicNameError']);

      const subject = document.getElementById('topicSubjectSelect').value;
      const name = document.getElementById('topicNameInput').value;
      const difficulty = document.getElementById('topicDifficultySelect').value;

      const success = addTopic(subject, name, difficulty);
      if (success) {
        addTopicForm.reset();
        document.getElementById('topicDifficultySelect').value = 'Weak';
      }
    });
  }

  // Filter topics by subject
  const topicFilterSubject = document.getElementById('topicFilterSubject');
  if (topicFilterSubject) {
    topicFilterSubject.addEventListener('change', (e) => {
      currentTopicFilter = e.target.value;
      renderTopicsList();
    });
  }

  // 3. Add Task Form
  const addTaskForm = document.getElementById('addTaskForm');
  if (addTaskForm) {
    // When subject changes in task form, update topics dropdown
    const taskSubjectSelect = document.getElementById('taskSubjectSelect');
    if (taskSubjectSelect) {
      taskSubjectSelect.addEventListener('change', (e) => {
        populateTopicDropdowns(e.target.value);
      });
    }

    addTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearInputErrors(['taskNameError', 'taskSubjectError', 'taskDateError', 'taskDurationError']);

      const name = document.getElementById('taskNameInput').value;
      const subject = document.getElementById('taskSubjectSelect').value;
      const topic = document.getElementById('taskTopicSelect').value;
      const date = document.getElementById('taskDateInput').value;
      const duration = document.getElementById('taskDurationInput').value;

      const success = addTask(name, subject, topic, date, duration);
      if (success) {
        addTaskForm.reset();
        document.getElementById('taskDateInput').value = getFormattedDateString(new Date());
        document.getElementById('taskDurationInput').value = '45';
        populateTopicDropdowns('');
      }
    });
  }

  // Filter Tasks Pills (All, Pending, Completed)
  document.querySelectorAll('.task-filter-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.task-filter-pills .pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTaskFilter = btn.getAttribute('data-filter');
      renderTasksList();
    });
  });

  // AI Refresh Buttons
  const dashboardAiRefreshBtn = document.getElementById('dashboardAiRefreshBtn');
  if (dashboardAiRefreshBtn) {
    dashboardAiRefreshBtn.addEventListener('click', () => {
      renderAIRecommendations();
      showToast('✨ AI recommendations refreshed!');
    });
  }

  const aiRefreshPageBtn = document.getElementById('aiRefreshPageBtn');
  if (aiRefreshPageBtn) {
    aiRefreshPageBtn.addEventListener('click', () => {
      renderAIRecommendations();
      showToast('✨ AI recommendations refreshed!');
    });
  }
}

/**
 * Sets up the Daily Study Goal Modal
 */
function setupModalEventListeners() {
  const editGoalBtn = document.getElementById('editGoalBtn');
  const goalModal = document.getElementById('goalModal');
  const closeGoalModalBtn = document.getElementById('closeGoalModalBtn');
  const cancelGoalModalBtn = document.getElementById('cancelGoalModalBtn');
  const saveGoalModalBtn = document.getElementById('saveGoalModalBtn');
  const goalModalBackdrop = document.getElementById('goalModalBackdrop');
  const dailyGoalInput = document.getElementById('dailyGoalInput');

  function openModal() {
    if (dailyGoalInput) dailyGoalInput.value = appState.dailyGoalHours;
    if (goalModal) goalModal.classList.add('active');
  }

  function closeModal() {
    if (goalModal) goalModal.classList.remove('active');
  }

  if (editGoalBtn) editGoalBtn.addEventListener('click', openModal);
  if (closeGoalModalBtn) closeGoalModalBtn.addEventListener('click', closeModal);
  if (cancelGoalModalBtn) cancelGoalModalBtn.addEventListener('click', closeModal);
  if (goalModalBackdrop) goalModalBackdrop.addEventListener('click', closeModal);

  if (saveGoalModalBtn) {
    saveGoalModalBtn.addEventListener('click', () => {
      const val = parseFloat(dailyGoalInput.value);
      if (isNaN(val) || val <= 0 || val > 16) {
        alert('Please enter a realistic study goal between 0.5 and 16 hours.');
        return;
      }
      appState.dailyGoalHours = val;
      saveData();
      updateDashboardStats();
      renderAIRecommendations();
      closeModal();
      showToast(`🎯 Daily goal updated to ${val.toFixed(1)} hours!`);
    });
  }
}

/**
 * Toast notification banner for user feedback
 */
let toastTimeout = null;
function showToast(message) {
  const toast = document.getElementById('toastNotification');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

/**
 * Displays an inline form error under an input field
 */
function showInputError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) el.textContent = message;
}

/**
 * Clears an array of form error elements
 */
function clearInputErrors(elementIds) {
  elementIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}


/* ==========================================================================
   GENERAL UTILITY FUNCTIONS
   ========================================================================== */

/**
 * Generates a unique string ID
 */
function generateId() {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
}

/**
 * Returns date in YYYY-MM-DD string format
 */
function getFormattedDateString(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Converts YYYY-MM-DD into a human-friendly string (e.g. "Today", "Tomorrow", "Oct 2, 2026")
 */
function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const todayStr = getFormattedDateString(new Date());

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getFormattedDateString(tomorrow);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getFormattedDateString(yesterday);

  if (dateStr === todayStr) return 'Today';
  if (dateStr === tomorrowStr) return 'Tomorrow';
  if (dateStr === yesterdayStr) return 'Yesterday';

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return dateStr;
}

/**
 * Returns CSS badge class for subject difficulty
 */
function getDifficultyClass(difficulty) {
  switch (difficulty) {
    case 'Easy': return 'diff-easy';
    case 'Medium': return 'diff-medium';
    case 'Hard': return 'diff-hard';
    default: return 'badge-blue';
  }
}

/**
 * Returns CSS badge class for topic proficiency
 */
function getTopicProficiencyClass(proficiency) {
  switch (proficiency) {
    case 'Strong': return 'diff-strong';
    case 'Average': return 'diff-average';
    case 'Weak': return 'diff-weak';
    default: return 'badge-blue';
  }
}

/**
 * Escapes HTML characters to prevent XSS in dynamic templates
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Function aliases to match exact prompt specifications
function completeTask(taskId) {
  toggleTaskComplete(taskId);
}

function updateDashboard() {
  updateDashboardStats();
}

// Attach state and helper functions to window for onclick handlers & DevTools console access
window.appState = appState;
window.saveData = saveData;
window.loadData = loadData;
window.addSubject = addSubject;
window.addTopic = addTopic;
window.addTask = addTask;
window.completeTask = completeTask;
window.toggleTaskComplete = toggleTaskComplete;
window.deleteSubject = deleteSubject;
window.deleteTopic = deleteTopic;
window.deleteTask = deleteTask;
window.updateDashboard = updateDashboard;
window.generateAIRecommendation = generateAIRecommendation;
window.loadInitialDemoData = loadInitialDemoData;
window.clearAllData = clearAllData;

