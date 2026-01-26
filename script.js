// --- CONFIGURATION ---
const BLOCK_DURATION_SEC = 10 * 60; // 10 minutes
const BREAK_DURATION_SEC = 2 * 60;  // 2 minutes break
const PAY_PER_MATRIX = 2000;        // 2,000 VND
const TOTAL_BLOCKS = 3; 

// --- EXPANDED WORD LIST (200+ Words) ---
const WORD_POOL = [
    // --- TARGETS (Start with S) ---
    "SAC", "SAD", "SAG", "SAP", "SAT", "SAW", "SAY", "SEA", "SEE", "SET", 
    "SEW", "SHE", "SHY", "SIN", "SIP", "SIR", "SIS", "SIT", "SIX", "SKI", 
    "SKY", "SLY", "SOB", "SOD", "SON", "SOP", "SOW", "SOY", "SPA", "SPY", 
    "SUB", "SUE", "SUM", "SUN", 

    // --- DISTRACTORS (Do NOT start with S) ---
    "ACT", "ADD", "AGE", "AIM", "AIR", "ANT", "APE", "ARC", "ARM", "ART", "ASH", "ASK", "AWE", "AXE",
    "BAD", "BAG", "BAN", "BAR", "BAT", "BAY", "BED", "BEE", "BEG", "BET", "BIB", "BID", "BIG", "BIN", 
    "BIT", "BOA", "BOB", "BOG", "BOW", "BOX", "BOY", "BUD", "BUG", "BUN", "BUS", "BUT", "BUY", "BYE",
    "CAB", "CAM", "CAN", "CAP", "CAR", "CAT", "COB", "COD", "COG", "CON", "COO", "COP", "COT", "COW", 
    "COY", "CRY", "CUB", "CUE", "CUP", "CUT",
    "DAD", "DAM", "DAY", "DEN", "DEW", "DID", "DIG", "DIM", "DIN", "DIP", "DOC", "DOE", "DOG", "DOT", 
    "DRY", "DUB", "DUD", "DUE", "DUG", "DYE",
    "EAR", "EAT", "EBB", "EEL", "EGG", "EGO", "ELK", "ELM", "END", "ERA", "EVE", "EWE", "EYE",
    "FAN", "FAR", "FAT", "FED", "FEE", "FEW", "FIB", "FIG", "FIN", "FIT", "FIX", "FLU", "FLY", "FOB", 
    "FOE", "FOG", "FOR", "FOX", "FRY", "FUN", "FUR",
    "GAG", "GAP", "GAS", "GEL", "GEM", "GET", "GIG", "GIN", "GNU", "GOA", "GOB", "GOD", "GOO", "GOT", 
    "GUM", "GUN", "GUT", "GYM",
    "HAD", "HAG", "HAM", "HAS", "HAT", "HAY", "HEM", "HEN", "HER", "HEW", "HEY", "HID", "HIM", "HIP", 
    "HIS", "HIT", "HOE", "HOG", "HOP", "HOT", "HOW", "HUB", "HUE", "HUG", "HUM", "HUT",
    "ICE", "ICY", "ILL", "INK", "INN", "ION", "IRE", "IVY",
    "JAB", "JAM", "JAR", "JAW", "JAY", "JET", "JIG", "JOB", "JOG", "JOY", "JUG", "JUT",
    "KEG", "KEY", "KID", "KIN", "KIT", "KOI",
    "LAB", "LAD", "LAG", "LAP", "LAW", "LAX", "LAY", "LEA", "LED", "LEE", "LEG", "LET", "LID", "LIE", 
    "LIP", "LIT", "LOB", "LOG", "LOT", "LOW", "LUG", "LUX",
    "MAD", "MAN", "MAP", "MAT", "MAW", "MAX", "MAY", "MEN", "MET", "MEW", "MID", "MIX", "MOB", "MOD", 
    "MOM", "MOO", "MOP", "MOW", "MUD", "MUG", "MUM",
    "NAB", "NAG", "NAP", "NAY", "NET", "NEW", "NIL", "NIP", "NOD", "NON", "NOR", "NOT", "NOW", "NUN", "NUT",
    "OAF", "OAK", "OAR", "OAT", "ODD", "ODE", "OFF", "OIL", "OLD", "ONE", "OPT", "ORB", "ORE", "OUR", 
    "OUT", "OWL", "OWN",
    "PAD", "PAL", "PAN", "PAR", "PAT", "PAW", "PAY", "PEA", "PEG", "PEN", "PEP", "PET", "PEW", "PIE", 
    "PIG", "PIN", "PIP", "PIT", "PLY", "POD", "POP", "POT", "PRO", "PRY", "PUB", "PUG", "PUN", "PUP", "PUT",
    "RAG", "RAM", "RAN", "RAP", "RAT", "RAW", "RAY", "RED", "RIB", "RID", "RIG", "RIM", "RIP", "ROB", 
    "ROD", "ROT", "ROW", "RUB", "RUG", "RUM", "RUN", "RUT", "RYE",
    "TAB", "TAG", "TAN", "TAP", "TAR", "TEA", "TED", "TEE", "TEN", "THE", "TIE", "TIN", "TIP", "TOE", 
    "TOG", "TON", "TOO", "TOP", "TOT", "TOW", "TOY", "TRY", "TUB", "TUG", "TWO",
    "URN", "USE",
    "VAN", "VAT", "VET", "VEX", "VIA", "VIM", "VOW",
    "WAG", "WAR", "WAX", "WAY", "WEB", "WED", "WEE", "WET", "WHO", "WHY", "WIG", "WIN", "WIT", "WOE", 
    "WON", "WOW", "WRY",
    "YAK", "YAM", "YAP", "YEA", "YES", "YET", "YEW", "YIP", "YOU",
    "ZAP", "ZEN", "ZIG", "ZIP", "ZOO"
];

// --- STATE VARIABLES ---
let currentBlock = 0;
let blockEarnings = 0;
let totalEarningsGlobal = 0; 
let timerInterval;
let breakInterval;
let matrixStartTime = 0;
let currentTargetCount = 0; 
let attemptGlobalCounter = 0; 

// --- PRACTICE STATE ---
let isPracticeMode = false;
let practiceStep = 0; // 0=Numbers, 1=Words, 2=Shapes

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

// --- TASKS DEFINITIONS ---
const TASK_TYPES = [
    { 
        id: 'numbers', 
        instruction: "Count the number of Zeros (0).", 
        target: 0, 
        generator: (isTarget) => isTarget ? 0 : 1
    },
    { 
        id: 'words', 
        instruction: "Count the words that start with 'S'.", 
        target: 'S', 
        generator: (isTarget) => {
            let word;
            if (isTarget) {
                const targets = WORD_POOL.filter(w => w.startsWith('S'));
                word = targets[Math.floor(Math.random() * targets.length)];
            } else {
                const distractors = WORD_POOL.filter(w => !w.startsWith('S'));
                word = distractors[Math.floor(Math.random() * distractors.length)];
            }
            return word;
        }
    },
    { 
        id: 'shapes', 
        instruction: "Count the TRIANGLES (▲).", 
        target: '▲', 
        generator: (isTarget) => isTarget ? '▲' : '●'
    }
];

// Randomize for sessions
let sessionTasks = [...TASK_TYPES].sort(() => Math.random() - 0.5);


// --- VISIBILITY LISTENER ---
document.addEventListener("visibilitychange", () => {
    const taskScreen = document.getElementById('screen-task');
    if (!taskScreen || taskScreen.classList.contains('hidden')) return;
    if (isPracticeMode) return; 

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
    showScreen('screen-practice-intro');
}

// --- PRACTICE LOGIC ---
function startPractice() {
    isPracticeMode = true;
    practiceStep = 0; 
    showScreen('screen-task');
    
    // UI Update for Practice
    document.getElementById('practice-indicator').style.display = 'block';
    document.getElementById('btn-stop-working').style.display = 'none';
    document.getElementById('btn-end-practice').style.display = 'none'; 
    document.getElementById('score-display').style.visibility = 'hidden'; 
    
    loadPracticeMatrix();
}

function loadPracticeMatrix() {
    const task = TASK_TYPES[practiceStep];
    
    document.getElementById('practice-indicator').innerText = `PRACTICE ROUND ${practiceStep + 1}/3 (No Earnings)`;
    document.getElementById('task-instruction-label').innerText = task.instruction;
    
    generateMatrix(task);
}

function endPractice() {
    isPracticeMode = false;
    
    // Reset UI for Real Experiment
    document.getElementById('practice-indicator').style.display = 'none';
    document.getElementById('btn-stop-working').style.display = 'inline-block';
    document.getElementById('btn-end-practice').style.display = 'none';
    document.getElementById('score-display').style.visibility = 'visible';
    
    currentBlock = 0;
    totalEarningsGlobal = 0; 
    detailedLog = []; 
    setupBlockIntro();
}

// --- MAIN FLOW ---
function setupBlockIntro() {
    if (currentBlock >= TOTAL_BLOCKS) {
        showScreen('screen-final-survey'); 
        return;
    }
    
    document.getElementById('block-title').innerText = `SESSION ${currentBlock + 1}`;
    
    let condition = conditions[currentBlock]; 
    const benchmarkBox = document.getElementById('social-comparison-text');

    if (condition.type === 'Control') {
        benchmarkBox.style.display = "none";
        benchmarkBox.innerText = "";
    } else {
        benchmarkBox.style.display = "block";
        benchmarkBox.innerText = condition.text;
    }

    const task = sessionTasks[currentBlock];
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
    taskMsg.innerHTML = `YOUR TASK: <span style="color:#d9534f">${task.instruction}</span>`;

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

// --- TASK LOGIC ---
function startBlock() {
    showScreen('screen-task');
    blockEarnings = 0; 
    currentBlockSurveyData = {}; 
    
    const task = sessionTasks[currentBlock];
    document.getElementById('task-instruction-label').innerText = task.instruction;

    updateEarningsUI();
    generateMatrix(task); 
    
    blockStartTime = Date.now(); 
    startTimer(BLOCK_DURATION_SEC);
}

function generateMatrix(forcedTask = null) {
    const container = document.getElementById('matrix-container');
    container.innerHTML = '';
    currentTargetCount = 0; 
    
    matrixTabSwitches = 0; 
    matrixSwitchHistory = []; 
    
    const task = forcedTask || sessionTasks[currentBlock];

    // --- GRID SIZE LOGIC ---
    // Practice: 5x5 (25 cells)
    // Real: 8x8 (64 cells)
    const gridSize = isPracticeMode ? 5 : 8;
    const totalCells = gridSize * gridSize;

    // --- DYNAMIC STYLING FOR WORDS ---
    // If it's a word task, cells are 55px wide. If others, 40px wide.
    let cellWidth = (task.id === 'words') ? '55px' : '40px';
    let cellHeight = '40px';
    
    // Update CSS Grid Layout
    container.style.gridTemplateColumns = `repeat(${gridSize}, ${cellWidth})`;

    for (let i = 0; i < totalCells; i++) {
        let isTarget = Math.random() > 0.5;
        let val = task.generator(isTarget);

        if (isTarget) {
            currentTargetCount++;
        }
        
        let cell = document.createElement('div');
        cell.className = 'matrix-cell';
        cell.innerText = val;
        
        // Apply dimensions
        cell.style.width = cellWidth;
        cell.style.height = cellHeight;
        
        // --- UPDATED FONT STYLING ---
        if (task.id === 'shapes') {
            cell.style.fontSize = '24px'; 
        } else if (task.id === 'words') {
            // Use modern Sans-Serif font for words
            cell.style.fontSize = '15px'; 
            cell.style.fontFamily = 'Arial, Helvetica, sans-serif'; 
            cell.style.letterSpacing = '0.5px';
        } else {
            // Keep monospace for Numbers
            cell.style.fontSize = '20px';
        }

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

    // --- PRACTICE MODE LOGIC ---
    if (isPracticeMode) {
        if (isCorrect) {
            alert(`Correct! That was practice task ${practiceStep + 1} of 3.`);
        } else {
            alert(`Incorrect. The correct answer was ${currentTargetCount}. Moving to next practice.`);
        }

        practiceStep++;
        
        if (practiceStep < 3) {
            loadPracticeMatrix();
        } else {
            document.getElementById('practice-indicator').innerText = "PRACTICE COMPLETE";
            document.getElementById('matrix-container').innerHTML = "<h3 style='grid-column: span 1; white-space:nowrap; color: green;'>Great job! Practice complete.</h3>";
            document.getElementById('task-instruction-label').innerText = "";
            document.querySelector('.input-area').style.display = 'none'; // Hide input
            document.getElementById('btn-end-practice').style.display = 'inline-block';
        }
        return; 
    }
    
    // --- REAL EXPERIMENT LOGIC ---
    document.querySelector('.input-area').style.display = 'flex';

    const timeNow = Date.now();
    const durationSeconds = (timeNow - matrixStartTime) / 1000;
    
    attemptGlobalCounter++;
    const historyString = matrixSwitchHistory.join(" | ");

    detailedLog.push({
        attempt_id: attemptGlobalCounter,
        block_number: currentBlock + 1,
        condition: conditions[currentBlock].type,
        task_type: sessionTasks[currentBlock].id, 
        user_guess: userInput,
        actual_answer: currentTargetCount,
        is_correct: isCorrect,
        time_spent_seconds: durationSeconds.toFixed(3),
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

function logAbandonedAttempt(reason) {
    const timeNow = Date.now();
    const durationSeconds = (timeNow - matrixStartTime) / 1000;
    const historyString = matrixSwitchHistory.join(" | ");
    
    attemptGlobalCounter++;

    detailedLog.push({
        attempt_id: attemptGlobalCounter,
        block_number: currentBlock + 1,
        condition: conditions[currentBlock].type,
        task_type: sessionTasks[currentBlock].id,
        user_guess: "ABANDONED", 
        actual_answer: currentTargetCount,
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
    
    showScreen('screen-survey'); 
}

function startBreak() {
    showScreen('screen-break');
    let timeLeft = BREAK_DURATION_SEC;
    const timerDisplay = document.getElementById('break-timer');
    const nextBtn = document.getElementById('btn-end-break');
    
    nextBtn.disabled = true;
    nextBtn.style.opacity = "0";

    clearInterval(breakInterval);
    
    let m = Math.floor(timeLeft / 60);
    let s = timeLeft % 60;
    timerDisplay.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;

    breakInterval = setInterval(() => {
        timeLeft--;
        m = Math.floor(timeLeft / 60);
        s = timeLeft % 60;
        timerDisplay.innerText = `${m}:${s < 10 ? '0' : ''}${s}`;

        if (timeLeft <= 0) {
            clearInterval(breakInterval);
            timerDisplay.innerText = "Break Over";
            nextBtn.disabled = false;
            nextBtn.style.opacity = "1";
            nextBtn.style.pointerEvents = "auto";
        }
    }, 1000);
}

function endBreak() {
    setupBlockIntro();
}

function submitSurvey(event) {
    event.preventDefault(); 
    const sat = document.getElementById('survey-satisfaction').value;
    const bore = document.getElementById('survey-boredom').value;
    
    totalEarningsGlobal += blockEarnings;

    detailedLog.forEach(row => {
        if (row.block_number === currentBlock + 1) {
            row.satisfaction = sat;
            row.boredom = bore;
            row.block_total_duration = finalBlockDuration.toFixed(2);
        }
    });

    document.getElementById('post-survey-form').reset();
    currentBlock++;

    if (currentBlock < TOTAL_BLOCKS) {
        startBreak(); 
    } else {
        setupBlockIntro(); 
    }
}

function submitFinalSurvey(event) {
    event.preventDefault();

    // REMOVED 'importance' variable here
    const distraction = document.getElementById('final-distraction').value;
    const age = document.getElementById('final-age').value;
    const gender = document.getElementById('final-gender').value;
    const major = document.getElementById('final-major').value;
    
    let year = document.getElementById('final-year').value;
    if (year === "Other") {
        year = "Other: " + document.getElementById('final-year-other').value;
    }

    detailedLog.forEach(row => {
        // REMOVED row.final_importance
        row.final_distraction = distraction;
        row.age = age;
        row.gender = gender;
        row.major = major;
        row.year_of_study = year;
        row.grand_total_earnings = totalEarningsGlobal;
    });

    showFinalResults();
}

function showFinalResults() {
    showScreen('screen-end');
    document.getElementById('final-total-earnings').innerText = totalEarningsGlobal.toLocaleString();
}

function downloadCSV() {
    if (detailedLog.length === 0) { alert("No data"); return; }
    
    const headers = [
        "Attempt_ID", "Block", "Condition", "Task_Type", 
        "Is_Correct", "User_Guess", "Actual_Answer", "Time_Spent_Sec", 
        "Switch_Count", "Switch_History", 
        "Block_Duration_Total", "Note",
        "Satisfaction", "Boredom", 
        "Timestamp",
        "Distraction_Level", "Age", "Gender", "Major", "Year_Study", // REMOVED Importance_Best
        "GRAND_TOTAL_EARNINGS"
    ];

    const rows = detailedLog.map(row => [
        row.attempt_id, row.block_number, row.condition, row.task_type, 
        row.is_correct, row.user_guess, row.actual_answer, row.time_spent_seconds, 
        row.tab_switches_count, 
        row.switch_history,     
        row.block_total_duration, 
        row.note || "",
        row.satisfaction || "N/A", row.boredom || "N/A", 
        row.timestamp,
        row.final_distraction, // REMOVED row.final_importance
        row.age, 
        row.gender, 
        row.major, 
        row.year_of_study,
        row.grand_total_earnings
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
