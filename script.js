// --- CONFIGURATION ---
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwSxCBpVQ1vBXkCJJjr2vKq5xtmFm8WwkHLI8uHMLFiVwdL8MSD496Znv_9JVGnvVLi3A/exec"; // <--- PASTE YOUR NEW GOOGLE SCRIPT URL HERE
const BLOCK_DURATION_SEC = 10 * 60; // 10 minutes per block
const MAX_BLOCKS = 3;               // 3 Total sessions
const PAY_PER_MATRIX = 2000;        // 2,000 VND per correct answer

// --- STATE VARIABLES ---
let participantId = ""; 
let currentBlock = 1;
let blockEarnings = 0;
let totalEarningsGlobal = 0; 
let timerInterval;
let matrixStartTime = 0;
let currentTargetCount = 0; 
let attemptGlobalCounter = 0; 
let blockStartTime = 0;       
let matrixTabSwitches = 0;    
let matrixSwitchHistory = []; 
let detailedLog = []; 
let activeTask = null; 

// --- TASKS DEFINITIONS ---
const TASK_TYPES = [
    { id: 'numbers', instruction: "Count the number of Zeros (0).", target: 0, generator: (isTarget) => isTarget ? 0 : 1 },
    { id: 'letters', instruction: "Count the letter 'E'.", target: 'E', generator: (isTarget) => isTarget ? 'E' : 'F' },
    { id: 'shapes', instruction: "Count the TRIANGLES (▲).", target: '▲', generator: (isTarget) => isTarget ? '▲' : '●' }
];

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
    totalEarningsGlobal = 0; 
    currentBlock = 1;
    detailedLog = []; 
    participantId = "P_" + Math.random().toString(36).substr(2, 6).toUpperCase();
    activeTask = TASK_TYPES[Math.floor(Math.random() * TASK_TYPES.length)];
    setupBlockIntro();
}

function setupBlockIntro() {
    document.getElementById('block-title').innerText = `SESSION ${currentBlock} of ${MAX_BLOCKS}`;
    let introDiv = document.getElementById('screen-block-intro');
    let taskMsg = document.getElementById('block-task-instruction');
    if (!taskMsg) {
        taskMsg = document.createElement('h3');
        taskMsg.id = 'block-task-instruction';
        taskMsg.style.color = "#333";
        taskMsg.style.marginTop = "20px";
        let startBtn = document.querySelector('.start-session-btn');
        introDiv.insertBefore(taskMsg, startBtn);
    }
    taskMsg.innerHTML = `YOUR TASK: <span style="color:#d9534f">${activeTask.instruction}</span>`;
    showScreen('screen-block-intro');
}

// --- TASK LOGIC ---
function startBlock() {
    showScreen('screen-task');
    blockEarnings = 0; 
    document.querySelector('.input-area').style.display = 'flex';
    document.getElementById('task-instruction-label').innerText = activeTask.instruction;
    updateEarningsUI();
    generateMatrix(); 
    blockStartTime = Date.now(); 
    startTimer(BLOCK_DURATION_SEC);
}

function generateMatrix() {
    const container = document.getElementById('matrix-container');
    container.innerHTML = '';
    currentTargetCount = 0; 
    matrixTabSwitches = 0; 
    matrixSwitchHistory = []; 

    const gridSize = 8;
    const totalCells = gridSize * gridSize;
    let cellWidth = '40px';
    let cellHeight = '40px';
    container.style.gridTemplateColumns = `repeat(${gridSize}, ${cellWidth})`;

    for (let i = 0; i < totalCells; i++) {
        let isTarget = Math.random() > 0.5;
        let val = activeTask.generator(isTarget);
        if (isTarget) currentTargetCount++;
        
        let cell = document.createElement('div');
        cell.className = 'matrix-cell';
        cell.innerText = val;
        cell.style.width = cellWidth;
        cell.style.height = cellHeight;
        
        if (activeTask.id === 'shapes') cell.style.fontSize = '24px'; 
        else if (activeTask.id === 'letters') { cell.style.fontSize = '22px'; cell.style.fontFamily = 'Arial, Helvetica, sans-serif'; }
        else cell.style.fontSize = '20px';

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

    const isCorrect = (userInput === currentTargetCount);
    const durationSeconds = (Date.now() - matrixStartTime) / 1000;
    attemptGlobalCounter++;

    detailedLog.push({
        participant_id: participantId,
        attempt_id: attemptGlobalCounter,
        block_number: currentBlock, 
        condition: 'Multi-Block', 
        task_type: activeTask.id, 
        user_guess: userInput,
        actual_answer: currentTargetCount,
        is_correct: isCorrect,
        time_spent_seconds: durationSeconds.toFixed(3),
        tab_switches_count: matrixTabSwitches,
        switch_history: matrixSwitchHistory.join(" | "), 
        earnings_at_attempt: blockEarnings, 
        timestamp: new Date().toISOString()
    });

    if (isCorrect) {
        blockEarnings += PAY_PER_MATRIX; 
        updateEarningsUI(); 
        alert(`Correct! The answer was ${currentTargetCount}.`);
    } else {
        alert(`Incorrect. The actual correct answer was ${currentTargetCount}.`);
    }

    generateMatrix(); 
}

function updateEarningsUI() {
    document.getElementById('current-earnings').innerText = blockEarnings.toLocaleString();
}

function startTimer(seconds) {
    let timeLeft = seconds;
    clearInterval(timerInterval); 
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) endBlock('time_out'); 
    }, 1000);
}

function stopEarly() {
    if (confirm("If you stop now, you will finish the entire experiment. Are you sure?")) {
        endBlock('manual');
    }
}

function endBlock(reason) {
    clearInterval(timerInterval);
    
    // Log final attempt as abandoned if necessary
    const durationSeconds = (Date.now() - matrixStartTime) / 1000;
    attemptGlobalCounter++;
    detailedLog.push({
        participant_id: participantId,
        attempt_id: attemptGlobalCounter,
        block_number: currentBlock,
        condition: 'Multi-Block',
        task_type: activeTask.id,
        user_guess: "ABANDONED", 
        actual_answer: currentTargetCount,
        is_correct: "FALSE", 
        time_spent_seconds: durationSeconds.toFixed(3),
        tab_switches_count: matrixTabSwitches,
        switch_history: matrixSwitchHistory.join(" | "), 
        earnings_at_attempt: blockEarnings,
        timestamp: new Date().toISOString(),
        note: reason === 'time_out' ? "Time Out" : "Stopped Early"
    });

    let finalBlockDuration = (Date.now() - blockStartTime) / 1000;
    totalEarningsGlobal += blockEarnings;

    // Attach block duration to all attempts in this block
    detailedLog.forEach(row => {
        if (row.block_number === currentBlock) {
            row.block_total_duration = finalBlockDuration.toFixed(2);
        }
    });

    if (reason === 'time_out') alert("Time is up for this session!");
    
    // Always clear survey fields before showing
    document.getElementById('survey-satisfaction').value = '';
    document.getElementById('survey-boredom').value = '';
    
    if (reason === 'manual') {
        // If they quit early, force them straight to the exit survey
        currentBlock = MAX_BLOCKS; 
    }
    
    showScreen('screen-post-block-survey');
}

// --- SURVEY & FLOW LOGIC ---
function submitPostBlockSurvey() {
    let sat = document.getElementById('survey-satisfaction').value || "N/A";
    let bor = document.getElementById('survey-boredom').value || "N/A";

    // Save answers to all rows in the CURRENT block
    detailedLog.forEach(row => {
        if (row.block_number === currentBlock) {
            row.satisfaction = sat;
            row.boredom = bor;
        }
    });

    if (currentBlock < MAX_BLOCKS) {
        currentBlock++;
        showScreen('screen-break');
    } else {
        showScreen('screen-exit-survey');
    }
}

function endBreak() {
    setupBlockIntro();
}

function submitExitSurvey() {
    let dist = document.getElementById('survey-distraction').value || "N/A";
    let age = document.getElementById('survey-age').value || "N/A";
    let gen = document.getElementById('survey-gender').value || "N/A";
    let maj = document.getElementById('survey-major').value || "N/A";
    let yr = document.getElementById('survey-year').value || "N/A";

    // Save final demographics to EVERY row in the log
    detailedLog.forEach(row => {
        row.final_distraction = dist;
        row.age = age;
        row.gender = gen;
        row.major = maj;
        row.year_of_study = yr;
        row.grand_total_earnings = totalEarningsGlobal;
    });

    showScreen('screen-end');
    document.getElementById('final-total-earnings').innerText = totalEarningsGlobal.toLocaleString();
}

// --- CLOUD SAVE LOGIC ---
function saveDataToCloud() {
    if (detailedLog.length === 0) { alert("No data to save."); return; }

    const saveBtn = document.getElementById('save-data-btn');
    saveBtn.innerText = "Saving data, please wait...";
    saveBtn.disabled = true;
    saveBtn.style.opacity = "0.5";

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
    .catch((error) => {
        console.error("Error saving:", error);
        alert("There was an error saving your data. Please download the backup CSV.");
        saveBtn.innerText = "Error Saving";
        document.getElementById('backup-download-btn').style.display = "inline-block";
        document.getElementById('earnings-display-area').style.display = "block";
    });
}

function downloadCSV() {
    if (detailedLog.length === 0) return;
    const headers = [
        "Participant_ID", "Attempt_ID", "Block", "Condition", "Task_Type", 
        "Is_Correct", "User_Guess", "Actual_Answer", "Time_Spent_Sec", 
        "Switch_Count", "Switch_History", "Block_Duration_Total", "Note",
        "Satisfaction", "Boredom", "Timestamp", "Distraction_Level", 
        "Age", "Gender", "Major", "Year_Study", "GRAND_TOTAL_EARNINGS"
    ];
    const rows = detailedLog.map(row => [
        row.participant_id, row.attempt_id, row.block_number, row.condition, row.task_type, 
        row.is_correct, row.user_guess, row.actual_answer, row.time_spent_seconds, 
        row.tab_switches_count, row.switch_history, row.block_total_duration, 
        row.note || "", row.satisfaction, row.boredom, row.timestamp,
        row.final_distraction, row.age, row.gender, row.major, row.year_of_study, row.grand_total_earnings
    ]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "multiblock_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
