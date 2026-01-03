// --- CONFIGURATION ---
const BLOCK_DURATION_SEC = 10 * 60; // 10 minutes
const PAY_PER_MATRIX = 2000;        // 2,000 VND
const TOTAL_BLOCKS = 3; 

// --- STATE VARIABLES ---
let currentBlock = 0;
let blockEarnings = 0;
let totalEarningsGlobal = 0; // <--- NEW: Tracks total across all blocks
let timerInterval;
let matrixStartTime = 0;
let currentZeros = 0;
let attemptGlobalCounter = 0; 

// --- TIME & SWITCH TRACKING ---
let blockStartTime = 0;       
let finalBlockDuration = 0;   
let matrixTabSwitches = 0;    
let matrixSwitchHistory = []; 

// --- DATA LOGGING ---
let detailedLog = []; 
let currentBlockSurveyData = {}; 

// --- CONDITIONS ---
let conditions = [
    { type: 'High', text: "In a previous session, a Fulbright student completed 14 matrices and earned 28,000 VND in this same task." },
    { type: 'Low', text: "In a previous session, a Fulbright student completed 6 matrices and earned 12,000 VND in this same task." },
    { type: 'Control', text: "" } 
];
conditions = conditions.sort(() => Math.random() - 0.5);

// --- VISIBILITY LISTENER ---
document.addEventListener("visibilitychange", () => {
    const taskScreen = document.getElementById('screen-task');
    if (!taskScreen || taskScreen.classList.contains('hidden')) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-GB'); 

    if (document.visibilityState === "hidden") {
        matrixTabSwitches++;
        matrixSwitchHistory.push(`OUT: ${timeString}`);
    } else {
        matrixSwitchHistory.push(`IN: ${timeString}`);
    }
});

// --- NAVIGATION & UI ---
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

function toggleSubmitButton() {
    const inputVal = document.getElementById('user-answer').value;
    const btn = document.getElementById('submit-matrix-btn');
    
    if (inputVal !== "") {
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
    totalEarningsGlobal = 0; // Reset total on new experiment
    detailedLog = []; 
    setupBlockIntro();
}

function setupBlockIntro() {
    // 1. Check if experiment is done
    if (currentBlock >= TOTAL_BLOCKS) {
        showScreen('screen-final-survey'); 
        return;
    }
    
    // 2. Set Session Title
    document.getElementById('block-title').innerText = `SESSION ${currentBlock + 1}`;
    
    // 3. Handle Condition Text & Visibility
    let condition = conditions[currentBlock]; 
    const benchmarkBox = document.getElementById('social-comparison-text');

    if (condition.type === 'Control') {
        // HIDE the box completely for Control group
        benchmarkBox.style.display = "none";
        benchmarkBox.innerText = "";
    } else {
        // SHOW the box for High/Low groups
        benchmarkBox.style.display = "block"; // This restores the element
        benchmarkBox.innerText = condition.text;
    }

    // 4. Show the screen
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

    // Save demographic data to all rows
    detailedLog.forEach(row => {
        row.final_importance = importance;
        row.final_distraction = distraction;
        row.age = age;
        row.gender = gender;
        row.major = major;
        row.year_of_study = year;
        
        // Save the Grand Total to every row too (optional but helpful)
        row.grand_total_earnings = totalEarningsGlobal;
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
    
    blockStartTime = Date.now(); 
    startTimer(BLOCK_DURATION_SEC);
}

function generateMatrix() {
    const container = document.getElementById('matrix-container');
    container.innerHTML = '';
    currentZeros = 0;
    
    matrixTabSwitches = 0; 
    matrixSwitchHistory = []; 
    
    for (let i = 0; i < 64; i++) {
        let val = Math.random() > 0.5 ? 1 : 0;
        if (val === 0) currentZeros++;
        
        let cell = document.createElement('div');
        cell.className = 'matrix-cell';
        cell.innerText = val;
        container.appendChild(cell);
    }
    
    matrixStartTime = Date.now();
    
    const input = document.getElementById('user-answer');
    input.value = '';
    input.focus();
    toggleSubmitButton();
}

function checkAnswer() {
    const inputField = document.getElementById('user-answer');
    const userInput = parseInt(inputField.value);

    if (isNaN(userInput)) return;

    const timeNow = Date.now();
    const durationSeconds = (timeNow - matrixStartTime) / 1000;
    const isCorrect = (userInput === currentZeros);
    
    attemptGlobalCounter++;

    const historyString = matrixSwitchHistory.join(" | ");

    detailedLog.push({
        attempt_id: attemptGlobalCounter,
        block_number: currentBlock + 1,
        condition: conditions[currentBlock].type,
        user_guess: userInput,
        actual_answer: currentZeros,
        is_correct: isCorrect,
        time_spent_seconds: durationSeconds.toFixed(3),
        tab_switches_count: matrixTabSwitches,
        switch_history: historyString, 
        earnings_at_attempt: blockEarnings, // Earnings BEFORE this add
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

function logAbandonedAttempt(reason) {
    const timeNow = Date.now();
    const durationSeconds = (timeNow - matrixStartTime) / 1000;
    const historyString = matrixSwitchHistory.join(" | ");
    
    attemptGlobalCounter++;

    detailedLog.push({
        attempt_id: attemptGlobalCounter,
        block_number: currentBlock + 1,
        condition: conditions[currentBlock].type,
        user_guess: "ABANDONED", 
        actual_answer: currentZeros,
        is_correct: "FALSE", 
        time_spent_seconds: durationSeconds.toFixed(3),
        tab_switches_count: matrixTabSwitches,
        switch_history: historyString, 
        earnings_at_attempt: blockEarnings,
        timestamp: new Date().toISOString(),
        note: reason === 'time_out' ? "Time Out" : "Stopped Early"
    });
}

function endBlock(reason) {
    clearInterval(timerInterval);
    logAbandonedAttempt(reason);

    const timeNow = Date.now();
    finalBlockDuration = (timeNow - blockStartTime) / 1000;

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

    // --- NEW: ADD BLOCK EARNINGS TO GRAND TOTAL ---
    totalEarningsGlobal += blockEarnings;

    detailedLog.forEach(row => {
        if (row.block_number === currentBlock + 1) {
            row.satisfaction = sat;
            row.boredom = bore;
            row.recall_guess = recall || "N/A"; 
            row.block_total_duration = finalBlockDuration.toFixed(2);
        }
    });

    document.getElementById('post-survey-form').reset();
    currentBlock++;
    setupBlockIntro();
}

function showFinalResults() {
    showScreen('screen-end');
    // --- NEW: UPDATE THE HTML WITH THE TOTAL ---
    document.getElementById('final-total-earnings').innerText = totalEarningsGlobal.toLocaleString();
}

function downloadCSV() {
    if (detailedLog.length === 0) { alert("No data"); return; }
    
    const headers = [
        "Attempt_ID", "Block", "Condition", "Is_Correct", 
        "User_Guess", "Actual_Answer", "Time_Spent_Sec", 
        "Switch_Count", "Switch_History", 
        "Block_Duration_Total", "Note",
        "Satisfaction", "Boredom", "Peer_Recall_Guess", 
        "Timestamp",
        "Importance_Best", "Distraction_Level", "Age", "Gender", "Major", "Year_Study",
        "GRAND_TOTAL_EARNINGS" // <-- Added to CSV as well
    ];

    const rows = detailedLog.map(row => [
        row.attempt_id, row.block_number, row.condition, row.is_correct, 
        row.user_guess, row.actual_answer, row.time_spent_seconds, 
        row.tab_switches_count, 
        row.switch_history,     
        row.block_total_duration, 
        row.note || "",
        row.satisfaction || "N/A", row.boredom || "N/A",
        row.recall_guess || "N/A", row.timestamp,
        row.final_importance, 
        row.final_distraction, 
        row.age, 
        row.gender, 
        row.major, 
        row.year_of_study,
        row.grand_total_earnings // <-- Added here
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


