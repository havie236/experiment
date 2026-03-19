// --- CONFIGURATION ---
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwSxCBpVQ1vBXkCJJjr2vKq5xtmFm8WwkHLI8uHMLFiVwdL8MSD496Znv_9JVGnvVLi3A/exec"; 
const BLOCK_DURATION_SEC = 10 * 60; 
const BREAK_DURATION_SEC = 120; // 2 minutes
const MAX_BLOCKS = 3;               
const PAY_PER_MATRIX = 2000;        

// --- CODE MAPPING ---
const CODE_LOGIC = {
    "1": [{ t: 'numbers', c: 'Baseline' }, { t: 'shapes', c: 'High' }, { t: 'letters', c: 'Low' }],
    "2": [{ t: 'numbers', c: 'High' }, { t: 'shapes', c: 'Low' }, { t: 'letters', c: 'Baseline' }],
    "3": [{ t: 'numbers', c: 'Low' }, { t: 'shapes', c: 'Baseline' }, { t: 'letters', c: 'High' }],
    "4": [{ t: 'shapes', c: 'Baseline' }, { t: 'letters', c: 'High' }, { t: 'numbers', c: 'Low' }],
    "5": [{ t: 'shapes', c: 'High' }, { t: 'letters', c: 'Low' }, { t: 'numbers', c: 'Baseline' }],
    "6": [{ t: 'shapes', c: 'Low' }, { t: 'letters', c: 'Baseline' }, { t: 'numbers', c: 'High' }]
};

// --- STATE ---
let participantId = ""; 
let assignedCode = "";
let currentSessionConfig = [];
let currentBlock = 1;
let blockEarnings = 0;
let totalEarningsGlobal = 0; 
let timerInterval, breakTimerInterval;
let matrixStartTime = 0, blockStartTime = 0;
let currentTargetCount = 0, attemptGlobalCounter = 0; 
let matrixTabSwitches = 0, matrixSwitchHistory = [], detailedLog = [], activeTask = null;

const TASKS = {
    'numbers': { id: 'numbers', instruction: "Count the Zeros (0).", generator: (isT) => isT ? 0 : 1 },
    'letters': { id: 'letters', instruction: "Count the letter 'E'.", generator: (isT) => isT ? 'E' : 'F' },
    'shapes': { id: 'shapes', instruction: "Count the TRIANGLES (▲).", generator: (isT) => isT ? '▲' : '●' }
};

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.replace('active', 'hidden'));
    document.getElementById(id).classList.replace('hidden', 'active');
}

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
    const condition = session.c;

    if (condition === 'High') {
        document.getElementById('treatment-message').innerHTML = "On average, Fulbright students complete <strong>15 matrices</strong> and earn around <strong>30,000 VND</strong>.";
        showScreen('screen-treatment');
    } else if (condition === 'Low') {
        document.getElementById('treatment-message').innerHTML = "On average, Fulbright students complete <strong>6 matrices</strong> and earn around <strong>14,000 VND</strong>.";
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
    blockEarnings = 0; 
    document.getElementById('task-instruction-label').innerText = activeTask.instruction;
    updateEarningsUI();
    generateMatrix(); 
    blockStartTime = Date.now(); 
    startTimer(BLOCK_DURATION_SEC);
}

function generateMatrix() {
    const container = document.getElementById('matrix-container');
    container.innerHTML = ''; currentTargetCount = 0; matrixTabSwitches = 0; matrixSwitchHistory = [];
    const gridSize = 8;
    container.style.gridTemplateColumns = `repeat(${gridSize}, 40px)`;

    for (let i = 0; i < 64; i++) {
        let isT = Math.random() > 0.5;
        if (isT) currentTargetCount++;
        let cell = document.createElement('div');
        cell.className = 'matrix-cell';
        cell.innerText = activeTask.generator(isT);
        container.appendChild(cell);
    }
    matrixStartTime = Date.now();
    document.getElementById('user-answer').value = '';
    document.getElementById('user-answer').focus();
    toggleSubmitButton();
}

function checkAnswer() {
    const val = parseInt(document.getElementById('user-answer').value);
    if (isNaN(val)) return;
    const isCorrect = (val === currentTargetCount);
    const duration = (Date.now() - matrixStartTime) / 1000;
    attemptGlobalCounter++;

    detailedLog.push({
        participant_id: participantId, attempt_id: attemptGlobalCounter, block_number: currentBlock,
        condition: currentSessionConfig[currentBlock-1].c, task_type: activeTask.id,
        user_guess: val, actual_answer: currentTargetCount, is_correct: isCorrect,
        time_spent_seconds: duration.toFixed(3), timestamp: new Date().toISOString()
    });

    if (isCorrect) { blockEarnings += PAY_PER_MATRIX; updateEarningsUI(); alert("Correct!"); }
    else alert(`Incorrect. It was ${currentTargetCount}.`);
    generateMatrix();
}

function updateEarningsUI() { document.getElementById('current-earnings').innerText = blockEarnings.toLocaleString(); }

function startTimer(sec) {
    let left = sec;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => { left--; if (left <= 0) endBlock('time_out'); }, 1000);
}

function stopEarly() { if (confirm("Stop this session early?")) endBlock('manual'); }

function endBlock(reason) {
    clearInterval(timerInterval);
    totalEarningsGlobal += blockEarnings;
    if (currentBlock < MAX_BLOCKS) { currentBlock++; startBreak(); }
    else showScreen('screen-exit-survey');
}

function startBreak() {
    showScreen('screen-break');
    let left = BREAK_DURATION_SEC;
    const btn = document.getElementById('end-break-btn');
    btn.disabled = true;
    clearInterval(breakTimerInterval);
    breakTimerInterval = setInterval(() => {
        let m = Math.floor(left / 60).toString().padStart(2, '0');
        let s = (left % 60).toString().padStart(2, '0');
        document.getElementById('break-timer-display').innerText = `${m}:${s}`;
        if (left <= 0) { clearInterval(breakTimerInterval); btn.disabled = false; btn.style.opacity = "1"; btn.innerText = "Continue"; }
        left--;
    }, 1000);
}

function endBreak() { handleSessionTransition(); }

function submitExitSurvey() {
    const data = {
        sat: document.getElementById('survey-satisfaction').value,
        bor: document.getElementById('survey-boredom').value,
        dist: document.getElementById('survey-distraction').value,
        age: document.getElementById('survey-age').value,
        gen: document.getElementById('survey-gender').value,
        maj: document.getElementById('survey-major').value,
        yr: document.getElementById('survey-year').value
    };
    detailedLog.forEach(row => { Object.assign(row, data); row.grand_total_earnings = totalEarningsGlobal; });
    showScreen('screen-end');
    document.getElementById('final-total-earnings').innerText = totalEarningsGlobal.toLocaleString();
}

function saveDataToCloud() {
    fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(detailedLog) })
    .then(() => { 
        document.getElementById('save-data-btn').style.display = "none";
        document.getElementById('save-status-msg').style.display = "block";
        document.getElementById('earnings-display-area').style.display = "block";
    });
}

function toggleSubmitButton() {
    const input = document.getElementById('user-answer').value;
    const btn = document.getElementById('submit-matrix-btn');
    btn.disabled = input === "";
    btn.style.opacity = input === "" ? "0.5" : "1";
}
