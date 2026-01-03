// --- CONFIGURATION ---
const BLOCK_DURATION_SEC = 10 * 60; // 10 minutes
const PAY_PER_MATRIX = 1000;        // 1,000 VND
const TOTAL_BLOCKS = 3; 

// --- STATE VARIABLES ---
let currentBlock = 0;
let blockEarnings = 0;
let timerInterval;
let matrixStartTime = 0;
let currentZeros = 0;
let attemptGlobalCounter = 0; 

// --- NEW: DETAILED SWITCH TRACKING ---
let matrixTabSwitches = 0;    // Total count for current matrix
let matrixSwitchHistory = []; // Array to store timestamps strings

// --- DATA LOGGING ---
let detailedLog = []; 
let currentBlockSurveyData = {}; 

// --- CONDITIONS ---
let conditions = [
    { type: 'High', text: "In a previous session, a Fulbright student completed 30 matrices and earned 30,000 VND in this same task." },
    { type: 'Low', text: "In a previous session, a Fulbright student completed 10 matrices and earned 10,000 VND in this same task." },
    { type: 'Control', text: "" } 
];

// Randomize order on load
conditions = conditions.sort(() => Math.random() - 0.5);

// --- UPDATED: VISIBILITY LISTENER ---
document.addEventListener("visibilitychange", () => {
    // Only track if the task screen is actually active
    const taskScreen = document.getElementById('screen-task');
    if (!taskScreen || taskScreen.classList.contains('hidden')) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB'); // Format: HH:MM:SS

    if (document.visibilityState === "hidden") {
        // User LEFT the tab
        matrixTabSwitches++;
        matrixSwitchHistory.push(`OUT: ${timeString}`);
        console.log("Switch OUT at", timeString);
    } else {
        // User CAME BACK
        matrixSwitchHistory.push(`IN: ${timeString}`);
        console.log("Switch IN at", timeString);
    }
});

// --- NAVIGATION ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
    document.getElementById(screenId).classList.add('active');
}

function toggleStartButton() {
    const checkbox = document.getElementById('consent-checkbox');
    const btn = document.getElementById('start-btn');
    
    if (checkbox.checked) {
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
    } else {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
    }
}

function startExperiment() {
    currentBlock = 0;
    detailedLog = []; 
    setupBlockIntro();
}

function setupBlockIntro() {
    if (currentBlock >= TOTAL_BLOCKS) {
        showScreen('screen-final-survey'); 
        return;
    }
    
    document.getElementById('block-title').innerText = `SESSION ${currentBlock + 1}`;
    let condition = conditions[currentBlock]; 
    let text = condition.type === 'Control' ? "" : condition.text;
    document.getElementById('social-comparison-text').innerText = text;

    showScreen('screen-block-intro');
}

function toggleOtherYear(selectObject) {
    const otherInput = document.getElementById('final-year-other');
    if (selectObject.value === "Other") {
        otherInput.style.display = "block";
        otherInput.required = true;
    } else {
        otherInput.style.display = "none";
        otherInput.required = false;
        otherInput.value = "";
    }
}

function submitFinalSurvey(event) {
    event.preventDefault();

    const importance = document.getElementById('final-importance').value;
    const distraction = document.getElementById('final-distraction').value;
    const age = document.getElementById('final-age').value;
    const gender = document.getElementById('final-gender').value;
    const major = document.getElementById('final-major').value;
    
    let year = document.getElementById('final-year').value;
    if (year === "Other") {
        year = "Other: " + document.getElementById('final-year-other').value;
    }

    detailedLog.forEach(row => {
        row.final_importance = importance;
        row.final_distraction = distraction;
        row.age = age;
        row.gender = gender;
        row.major = major;
        row.year_of_study = year;
    });

    showFinalResults();
}

// --- TASK LOGIC ---
function startBlock() {
    showScreen('screen-task');
    blockEarnings = 0; 
    currentBlockSurveyData = {}; 
    updateEarningsUI();
    generateMatrix();
    startTimer(BLOCK_DURATION_SEC);
}

function generateMatrix() {
    const container = document.getElementById('matrix-container');
    container.innerHTML = '';
    currentZeros = 0;
    
    // --- RESET FOR NEW MATRIX ---
    matrixTabSwitches = 0; 
    matrixSwitchHistory = []; // Clear the history list
    
    for (let i = 0; i < 64; i++) {
        let val = Math.random() > 0.5 ? 1 : 0;
        if (val === 0) currentZeros++;
        
        let cell = document.createElement('div');
        cell.className = 'matrix-cell';
        cell.innerText = val;
        container.appendChild(cell);
    }
    
    matrixStartTime = Date.now();
    
    document.getElementById('user-answer').value = '';
    document.getElementById('user-answer').focus();
}

function checkAnswer() {
    const inputField = document.getElementById('user-answer');
    const userInput = parseInt(inputField.value);

    if (isNaN(userInput)) {
        alert("Please enter a number.");
        return;
    }

    const timeNow = Date.now();
    const durationSeconds = (timeNow - matrixStartTime) / 1000;
    const isCorrect = (userInput === currentZeros);
    
    attemptGlobalCounter++;

    // --- LOGGING ---
    // Join the history array into a single string for the CSV cell
    // e.g. "OUT: 10:00:01 | IN: 10:00:05"
    const historyString = matrixSwitchHistory.join(" | ");

    detailedLog.push({
        attempt_id: attemptGlobalCounter,
        block_number: currentBlock + 1,
        condition: conditions[currentBlock].type,
        user_guess: userInput,
        actual_answer: currentZeros,
        is_correct: isCorrect,
        time_spent_seconds: durationSeconds.toFixed(3),
        
        // NEW COLUMNS HERE
        tab_switches_count: matrixTabSwitches,
        switch_history: historyString, 
        
        earnings_at_attempt: blockEarnings,
        timestamp: new Date().toISOString()
    });

    if (isCorrect) {
        blockEarnings += PAY_PER_MATRIX; 
        updateEarningsUI();
    } 

    generateMatrix(); 
}

function updateEarningsUI() {
    document.getElementById('current-earnings').innerText = blockEarnings.toLocaleString();
}

// --- TIMER & STOP LOGIC ---
function startTimer(seconds) {
    let timeLeft = seconds;
    clearInterval(timerInterval); 
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            endBlock('time_out'); 
        }
    }, 1000);
}

function stopEarly() {
    if (confirm("If you stop now, you will not be able to return to this session. There is no penalty for stopping.")) {
        endBlock('manual');
    }
}

function endBlock(reason) {
    clearInterval(timerInterval);

    if (reason === 'time_out') {
        alert("Time is up! Please complete the survey.");
    }

    const currentConditionType = conditions[currentBlock].type;
    const recallContainer = document.getElementById('recall-container');
    const recallInput = document.getElementById('survey-recall');

    if (recallContainer && recallInput) {
        if (currentConditionType === 'Control') {
            recallContainer.style.display = 'none';
            recallInput.required = false;
            recallInput.value = ""; 
        } else {
            recallContainer.style.display = 'block';
            recallInput.required = true;
        }
    }

    showScreen('screen-survey'); 
}

function submitSurvey(event) {
    event.preventDefault(); 
    const sat = document.getElementById('survey-satisfaction').value;
    const bore = document.getElementById('survey-boredom').value;
    const recall = document.getElementById('survey-recall').value;

    detailedLog.forEach(row => {
        if (row.block_number === currentBlock + 1) {
            row.satisfaction = sat;
            row.boredom = bore;
            row.recall_guess = recall || "N/A"; 
        }
    });

    document.getElementById('post-survey-form').reset();
    currentBlock++;
    setupBlockIntro();
}

function showFinalResults() {
    showScreen('screen-end');
}

function downloadCSV() {
    if (detailedLog.length === 0) { alert("No data"); return; }
    
    // --- UPDATED HEADERS ---
    const headers = [
        "Attempt_ID", "Block", "Condition", "Is_Correct", 
        "User_Guess", "Actual_Answer", "Time_Spent_Sec", 
        "Switch_Count", "Switch_History", // <--- 2 COLUMNS FOR SWITCHING
        "Satisfaction", "Boredom", "Peer_Recall_Guess", 
        "Timestamp",
        "Importance_Best", "Distraction_Level", "Age", "Gender", "Major", "Year_Study"
    ];

    const rows = detailedLog.map(row => [
        row.attempt_id, row.block_number, row.condition, row.is_correct, 
        row.user_guess, row.actual_answer, row.time_spent_seconds, 
        
        // Map the new data
        row.tab_switches_count, 
        row.switch_history,     
        
        row.satisfaction || "N/A", row.boredom || "N/A",
        row.recall_guess || "N/A", row.timestamp,
        row.final_importance, 
        row.final_distraction, 
        row.age, 
        row.gender, 
        row.major, 
        row.year_of_study
    ]);

    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "experiment_data_final.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
