// --- CONFIGURATION ---
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzTUdz9Ck6QXx0l8Ce2U6qaRI_bgKu97nWOa3yW2TEETgG4JYU1lK_q4FrHoJZRQvkQ3Q/exec"; 
const BLOCK_DURATION_SEC = 20 * 60; // 20 minutes per session
const BREAK_DURATION_SEC = 120;     // 2 minute mandatory break
const MAX_BLOCKS = 3;               
const PAY_PER_CORRECT = 2000;       

// --- CODE MAPPING (1-6) ---
const CODE_LOGIC = {
    "1": [{ t: 'numbers', c: 'Baseline' }, { t: 'shapes', c: 'High' }, { t: 'letters', c: 'Low' }],
    "2": [{ t: 'numbers', c: 'High' }, { t: 'shapes', c: 'Low' }, { t: 'letters', c: 'Baseline' }],
    "3": [{ t: 'numbers', c: 'Low' }, { t: 'shapes', c: 'Baseline' }, { t: 'letters', c: 'High' }],
    "4": [{ t: 'shapes', c: 'Baseline' }, { t: 'letters', c: 'High' }, { t: 'numbers', c: 'Low' }],
    "5": [{ t: 'shapes', c: 'High' }, { t: 'letters', c: 'Low' }, { t: 'numbers', c: 'Baseline' }],
    "6": [{ t: 'shapes', c: 'Low' }, { t: 'letters', c: 'Baseline' }, { t: 'numbers', c: 'High' }]
};

// --- STATE VARIABLES ---
let participantId = ""; 
let assignedCode = "";
let assignedCondition = ""; 
let currentSessionConfig = [];
let currentBlock = 1;
let correctCount = 0; 
let totalEarningsGlobal = 0; 
let timerInterval, breakTimerInterval;
let matrixStartTime = 0, blockStartTime = 0;
let currentTargetCount = 0, attemptGlobalCounter = 0; 
let matrixTabSwitches = 0, matrixSwitchHistory = [];
let detailedLog = [], activeTask = null;
let isExperimentFinished = false; 

const TASKS = {
    'numbers': { id: 'numbers', instruction: "Count the number of Zeros (0).", generator: (isT) => isT ? 0 : 1 },
    'letters': { id: 'letters', instruction: "Count the number of letter 'E'.", generator: (isT) => isT ? 'E' : 'F' },
    'shapes': { id: 'shapes', instruction: "Count the number of TRIANGLES (▲).", generator: (isT) => isT ? '▲' : '●' }
};

// --- VISIBILITY LISTENER (For tracking tab switches) ---
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
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    document.getElementById(id).classList.remove('hidden');
    document.getElementById(id).classList.add('active');
}

function toggleSubmitButton() {
    const input = document.getElementById('user-answer').value;
    const btn = document.getElementById('submit-matrix-btn');
    btn.disabled = input === "";
    btn.style.opacity = input === "" ? "0.5" : "1";
    btn.style.cursor = input === "" ? "not-allowed" : "pointer";
}

function updateCorrectUI() { 
    document.getElementById('current-correct').innerText = correctCount; 
}

// --- EXPERIMENT FLOW ---
function startExperiment() {
    assignedCode = document.getElementById('user-code-input').value.trim();
    if (!CODE_LOGIC[assignedCode]) return alert("Please enter a valid code (1-6).");

    currentSessionConfig = CODE_LOGIC[assignedCode];
    participantId = `P_Code${assignedCode}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    totalEarningsGlobal = 0; 
    currentBlock = 1;
    detailedLog = []; 
    handleSessionTransition();
}

function handleSessionTransition() {
    const session = currentSessionConfig[currentBlock - 1];
    activeTask = TASKS[session.t];
    assignedCondition = session.c;

    if (assignedCondition === 'High') {
        document.getElementById('treatment-message').innerHTML = 
            "On average, Fulbright students completed <strong>15 correct counts</strong> and earned around <strong>30,000 VND</strong>.";
        showScreen('screen-treatment');
    } else if (assignedCondition === 'Low') {
        document.getElementById('treatment-message').innerHTML = 
            "On average, Fulbright students completed <strong>6 correct counts</strong> and earned around <strong>14,000 VND</strong>.";
        showScreen('screen-treatment');
    } else {
        setupBlockIntro();
    }
}

function setupBlockIntro() {
    document.getElementById('block-title').innerText = `SESSION ${currentBlock} of 3`;
    showScreen('screen-block-intro');
}

function startBlock() {
    showScreen('screen-task');
    correctCount = 0; 
    document.getElementById('block-progress').innerText = `${currentBlock}/3`;
    document.getElementById('task-instruction-label').innerText = activeTask.instruction;
    updateCorrectUI();
    generateMatrix(); 
    blockStartTime = Date.now(); 
    startTimer(BLOCK_DURATION_SEC);
}

// --- TASK LOGIC ---
function generateMatrix() {
    const container = document.getElementById('matrix-container');
    container.innerHTML = ''; currentTargetCount = 0; matrixTabSwitches = 0; matrixSwitchHistory = [];

    for (let i = 0; i < 64; i++) {
        let isT = Math.random() > 0.5;
        if (isT) currentTargetCount++;
        let cell = document.createElement('div');
        cell.className = 'matrix-cell';
        cell.innerText = activeTask.generator(isT);
        
        if (activeTask.id === 'shapes') cell.style.fontSize = '20px'; 
        else if (activeTask.id === 'letters') { cell.style.fontSize = '22px'; cell.style.fontFamily = 'Arial, Helvetica, sans-serif'; }
        else cell.style.fontSize = '22px';

        container.appendChild(cell);
    }
    matrixStartTime = Date.now();
    const input = document.getElementById('user-answer');
    input.value = '';
    input.focus();
    toggleSubmitButton();
}

function checkAnswer() {
    const val = parseInt(document.getElementById('user-answer').value);
    if (isNaN(val)) return;
    
    const isCorrect = (val === currentTargetCount);
    const duration = (Date.now() - matrixStartTime) / 1000;
    attemptGlobalCounter++;

    detailedLog.push({
        participant_id: participantId,
        attempt_id: attemptGlobalCounter,
        block_number: currentBlock,
        condition: assignedCondition,
        task_type: activeTask.id,
        user_guess: val,
        actual_answer: currentTargetCount,
        is_correct: isCorrect,
        time_spent_seconds: duration.toFixed(3),
        tab_switches_count: matrixTabSwitches,
        switch_history: matrixSwitchHistory.join(" | "),
        timestamp: new Date().toISOString()
    });

    if (isCorrect) { 
        correctCount++; 
        updateCorrectUI(); 
        alert("Correct!"); 
    } else {
        alert(`Incorrect. The actual correct answer was ${currentTargetCount}.`);
    }
    generateMatrix();
}

// --- TIMERS & NAVIGATION ---
function startTimer(sec) {
    let left = sec;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => { 
        left--; 
        if (left <= 0) endBlock('time_out'); 
    }, 1000);
}

function stopEarly() { 
    if (confirm("Are you sure you want to stop this session and move to the next step?")) {
        endBlock('manual'); 
    }
}

function endBlock(reason) {
    clearInterval(timerInterval);
    
    const duration = (Date.now() - matrixStartTime) / 1000;
    attemptGlobalCounter++;
    detailedLog.push({
        participant_id: participantId,
        attempt_id: attemptGlobalCounter,
        block_number: currentBlock,
        condition: assignedCondition, 
        task_type: activeTask.id,
        user_guess: "ABANDONED",
        actual_answer: currentTargetCount,
        is_correct: "FALSE",
        time_spent_seconds: duration.toFixed(3),
        tab_switches_count: matrixTabSwitches,
        switch_history: matrixSwitchHistory.join(" | "),
        timestamp: new Date().toISOString()
    });

    totalEarningsGlobal += (correctCount * PAY_PER_CORRECT);
    let finalBlockDur = (Date.now() - blockStartTime) / 1000;

    detailedLog.forEach(row => {
        if (row.block_number === currentBlock) {
            row.block_total_duration = finalBlockDur.toFixed(2);
        }
    });

    if (reason === 'time_out') alert("Time is up for this session!");

    showScreen('screen-post-block');
}

// --- SURVEYS & BREAKS ---
function submitPostBlockSurvey() {
    let earnSatVal = document.getElementById('block-earnings-satisfaction').value;
    let interestVal = document.getElementById('block-interest').value;

    let earnSat = parseInt(earnSatVal);
    let interest = parseInt(interestVal);

    // --- VALIDATION CHECK ---
    if (isNaN(earnSat) || earnSat < 1 || earnSat > 7 || 
        isNaN(interest) || interest < 1 || interest > 7) {
        alert("Please enter a valid number between 1 and 7 for both questions.");
        return; 
    }

    detailedLog.forEach(row => {
        if (row.block_number === currentBlock) {
            row.earnings_satisfaction = earnSat;
            row.task_interest = interest;
        }
    });

    document.getElementById('block-earnings-satisfaction').value = "";
    document.getElementById('block-interest').value = "";

    if (currentBlock < MAX_BLOCKS) { 
        startBreak(); 
    } else { 
        showScreen('screen-exit-survey'); 
    }
}

function startBreak() {
    showScreen('screen-break');
    let left = BREAK_DURATION_SEC;
    const btn = document.getElementById('end-break-btn');
    const display = document.getElementById('break-timer-display');
    
    btn.disabled = true;
    btn.style.opacity = "0.5";
    btn.innerText = "Wait for timer...";

    clearInterval(breakTimerInterval);
    breakTimerInterval = setInterval(() => {
        let m = Math.floor(left / 60).toString().padStart(2, '0');
        let s = (left % 60).toString().padStart(2, '0');
        display.innerText = `${m}:${s}`;

        if (left <= 0) { 
            clearInterval(breakTimerInterval); 
            btn.disabled = false; 
            btn.style.opacity = "1"; 
            btn.innerText = "Continue to Next Session"; 
            btn.style.cursor = "pointer";
        }
        left--;
    }, 1000);
}

function endBreak() { 
    currentBlock++;
    handleSessionTransition(); 
}

function submitExitSurvey() {
    let compVal = document.getElementById('survey-competitiveness').value;
    let comp = parseInt(compVal);
    let rememberedEarnings = document.getElementById('survey-remembered-earnings').value;

    // --- VALIDATION CHECK ---
    if (isNaN(comp) || comp < 1 || comp > 7) {
        alert("Please enter a valid number between 1 and 7 for the Competitiveness question.");
        return; 
    }
    if (rememberedEarnings.trim() === "") {
        alert("Please estimate how much the previous participant earned.");
        return; 
    }

    const surveyData = {
        competitiveness: comp,
        remembered_earnings: rememberedEarnings,
        age: document.getElementById('survey-age').value || "N/A",
        gender: document.getElementById('survey-gender').value || "N/A",
        major: document.getElementById('survey-major').value || "N/A",
        year_study: document.getElementById('survey-year').value || "N/A"
    };

    detailedLog.forEach(row => { 
        Object.assign(row, surveyData); 
        row.grand_total_earnings = totalEarningsGlobal; 
    });

    showScreen('screen-end');
    document.getElementById('final-total-earnings').innerText = totalEarningsGlobal.toLocaleString();
}

// --- DATA SUBMISSION ---
function saveDataToCloud() {
    isExperimentFinished = true; 
    
    const saveBtn = document.getElementById('save-data-btn');
    saveBtn.innerText = "Saving, please wait...";
    saveBtn.disabled = true;

    fetch(GOOGLE_SCRIPT_URL, { 
        method: "POST", 
        headers: { "Content-Type": "text/plain;charset=utf-8" }, 
        body: JSON.stringify(detailedLog) 
    })
    .then(() => { 
        saveBtn.style.display = "none";
        document.getElementById('save-status-msg').style.display = "block";
        document.getElementById('earnings-display-area').style.display = "block";
    })
    .catch(err => {
        console.error(err);
        alert("Error saving to cloud. Please contact the researcher.");
        saveBtn.innerText = "Error - Try Again";
        saveBtn.disabled = false;
        isExperimentFinished = false; 
    });
}

// --- ACCIDENTAL EXIT PREVENTION (THE SHIELD) ---
window.addEventListener("beforeunload", function (e) {
    if (!isExperimentFinished && participantId !== "") {
        e.preventDefault();
        e.returnValue = "Wait! Your experiment data is not saved yet. Are you sure you want to leave?";
    }
});
