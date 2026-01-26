// --- CONFIGURATION ---
const BLOCK_DURATION_SEC = 10 * 60; // 10 minutes
const BREAK_DURATION_SEC = 2 * 60;  // 2 minutes break
const PAY_PER_MATRIX = 2000;        // 2,000 VND
const TOTAL_BLOCKS = 3; 

// --- WORD LIST FOR TASK 2 ---
const WORD_POOL = [
    "SUN", "SKY", "SEA", "BAT", "CAT", "DOG", "HAT", "MAP", "NUT", "PEN", "RED",
    "BOX", "FOX", "JAM", "LIP", "MUG", "PIG", "RAT", "VAN", "WIG", "ANT", "BUS",
    "CAR", "EGG", "FAN", "HEN", "ICE", "JET", "KEY", "LOG", "MAN", "NET", "OWL"
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

// --- CONDITIONS (Social Comparison) ---
let conditions = [
    { type: 'High', text: "In a previous session, a Fulbright student completed 14 matrices and earned 28,000 VND in this same task." },
    { type: 'Low', text: "In a previous session, a Fulbright student completed 6 matrices and earned 12,000 VND in this same task." },
    { type: 'Control', text: "" } 
];
conditions = conditions.sort(() => Math.random() - 0.5);

// --- TASKS DEFINITIONS ---
// We define the 3 types. We will randomize them for the sessions, 
// but use a fixed order for practice.
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
            // Pick a word starting with S, or NOT starting with S
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

// Create the randomized list for the 3 actual sessions
let sessionTasks = [...TASK_TYPES].sort(() => Math.random() - 0.5);


// --- VISIBILITY LISTENER ---
document.addEventListener("visibilitychange", () => {
    const taskScreen = document.getElementById('screen-task');
    if (!taskScreen || taskScreen.classList.contains('hidden')) return;
    if (isPracticeMode) return; // Ignore practice

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

// --- PRACTICE LOGIC (3 ROUNDS) ---
function startPractice() {
    isPracticeMode = true;
    practiceStep = 0; // Start with first task type
    showScreen('screen-task');
    
    // Update UI for Practice
    document.getElementById('practice-indicator').innerText = "PRACTICE ROUND 1/3 (No Earnings)";
    document.getElementById('practice-indicator').style.display = 'block';
    
    document.getElementById('btn-stop-working').style.display = 'none';
    document.getElementById('btn-end-practice').style.display = 'none'; // Only show at end
    document.getElementById('score-display').style.visibility = 'hidden'; 
    
    loadPracticeMatrix();
}

function loadPracticeMatrix() {
    // We cycle through TASK_TYPES: 0=Numbers, 1=Words, 2=Shapes
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
    
    // Start Real Experiment
    currentBlock = 0;
    totalEarningsGlobal = 0; 
    detailedLog = []; 
    setupBlockIntro();
}

// --- MAIN EXPERIMENT FLOW ---
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
    
    // Use forcedTask (for practice) OR current session task
    const task = forcedTask || sessionTasks[currentBlock];

    for (let i = 0; i < 64; i++) {
        let isTarget = Math.random() > 0.5; // 50/50 chance
        let val = task.generator(isTarget);

        if (isTarget) {
            currentTargetCount++;
        }
        
        let cell = document.createElement('div');
        cell.className = 'matrix-cell';
        cell.innerText = val;
        
        // Styles based on task
        if (task.id === 'shapes') {
            cell.style.fontSize = '24px'; 
        } else if (task.id === 'words') {
            cell.style.fontSize = '14px'; // Smaller for words
        } else {
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
            
            // Advance to next practice task
            practiceStep++;
            
            if (practiceStep < 3) {
                // Next round
                loadPracticeMatrix();
            } else {
                // All 3 done
                document.getElementById('practice-indicator').innerText = "PRACTICE COMPLETE";
                document.getElementById('matrix-container').innerHTML = "<h3 style='grid-column: span 8; color: green;'>Great job! You have practiced all 3 task types.</h3>";
                document.getElementById('task-instruction-label').innerText = "";
                document.querySelector('.input-area').style.display = 'none'; // Hide input
                document.getElementById('btn-end-practice').style.display = 'inline-block';
            }
        } else {
            alert(`Incorrect. The answer was ${currentTargetCount}. Try counting again.`);
            // Don't change the matrix, let them try again? Or generate new?
            // Let's generate a NEW matrix of the SAME type so they practice until they get it.
            loadPracticeMatrix();
        }
        return; 
    }
    
    // --- REAL EXPERIMENT LOGIC ---
    // Restore input area if it was hidden by practice (safety)
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
    const recall = document.getElementById('survey-recall').value;

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

    if (currentBlock < TOTAL_BLOCKS) {
        startBreak(); 
    } else {
        setupBlockIntro(); 
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
        "Satisfaction", "Boredom", "Peer_Recall_Guess", 
        "Timestamp",
        "Importance_Best", "Distraction_Level", "Age", "Gender", "Major", "Year_Study",
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
        row.recall_guess || "N/A", row.timestamp,
        row.final_importance, 
        row.final_distraction, 
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
