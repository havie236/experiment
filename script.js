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
let attemptGlobalCounter = 0; // Unique ID for every attempt across all blocks

// --- DATA LOGGING ---
// We will store every single attempt here for detailed analysis
let detailedLog = []; 
let currentBlockSurveyData = {}; // Temp store for survey answers

// --- CONDITIONS ---
let conditions = [
    { type: 'High', text: "In a previous session, a Fulbright student completed 30 matrices and earned 30,000 VND in this same task." },
    { type: 'Low', text: "In a previous session, a Fulbright student completed 10 matrices and earned 10,000 VND in this same task." },
    { type: 'Control', text: "" } 
];

// Randomize order on load
conditions = conditions.sort(() => Math.random() - 0.5);

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
        showFinalResults();
        return;
    }
    
    // Title
    document.getElementById('block-title').innerText = `SESSION ${currentBlock + 1}`;
    
    // Condition Text
    let condition = conditions[currentBlock]; 
    let text = condition.type === 'Control' ? "" : condition.text;
    document.getElementById('social-comparison-text').innerText = text;

    showScreen('screen-block-intro');
}

// --- TASK LOGIC ---
function startBlock() {
    showScreen('screen-task');
    
    // Reset Block Variables
    blockEarnings = 0; 
    currentBlockSurveyData = {}; // Reset survey data for this new block
    
    updateEarningsUI();
    generateMatrix();
    startTimer(BLOCK_DURATION_SEC);
}

function generateMatrix() {
    const container = document.getElementById('matrix-container');
    container.innerHTML = '';
    currentZeros = 0;
    
    for (let i = 0; i < 64; i++) {
        let val = Math.random() > 0.5 ? 1 : 0;
        if (val === 0) currentZeros++;
        
        let cell = document.createElement('div');
        cell.className = 'matrix-cell';
        cell.innerText = val;
        container.appendChild(cell);
    }
    
    // Start timer for this specific matrix
    matrixStartTime = Date.now();
    
    // Auto-focus input for speed
    document.getElementById('user-answer').value = '';
    document.getElementById('user-answer').focus();
}

// --- CORE UPDATE: CHECK ANSWER LOGIC ---
function checkAnswer() {
    const inputField = document.getElementById('user-answer');
    const userInput = parseInt(inputField.value);

    // Guard clause: Ensure they typed a number
    if (isNaN(userInput)) {
        alert("Please enter a number.");
        return;
    }

    // 1. Calculate Timing
    const timeNow = Date.now();
    const durationSeconds = (timeNow - matrixStartTime) / 1000;
    
    // 2. Check Logic
    const isCorrect = (userInput === currentZeros);
    
    attemptGlobalCounter++;

    // 3. LOG DATA (The "Granular" Request)
    // We push this immediately. We will append survey data to these rows later.
    detailedLog.push({
        attempt_id: attemptGlobalCounter,
        block_number: currentBlock + 1,
        condition: conditions[currentBlock].type,
        user_guess: userInput,
        actual_answer: currentZeros,
        is_correct: isCorrect,
        time_spent_seconds: durationSeconds.toFixed(3),
        earnings_at_attempt: blockEarnings, // Earnings before this attempt
        timestamp: new Date().toISOString()
    });

    // 4. Update Game State
    if (isCorrect) {
        blockEarnings += PAY_PER_MATRIX; 
        updateEarningsUI();
        // Optional: Visual Feedback (e.g., green border flash) could go here
    } else {
        // FEEDBACK UPDATE: We do NOT alert/block anymore.
        // We simply move on.
    }

    // 5. Next Matrix
    generateMatrix(); 
}

function updateEarningsUI() {
    document.getElementById('current-earnings').innerText = blockEarnings.toLocaleString();
}

// --- TIMER & STOP LOGIC ---
function startTimer(seconds) {
    let timeLeft = seconds;
    updateTimerUI(timeLeft);
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerUI(timeLeft);
        
        if (timeLeft <= 0) {
            endBlock();
        }
    }, 1000);
}

function updateTimerUI(seconds) {
    let m = Math.floor(seconds / 60);
    let s = seconds % 60;
    const timeString = `${m}:${s < 10 ? '0' : ''}${s}`;
    
    // If you want to show the timer, uncomment in HTML or update here
    if(document.getElementById('time-remaining')) {
        document.getElementById('time-remaining').innerText = timeString;
    }
}

// --- FEEDBACK UPDATE: STOP TEXT ---
function stopEarly() {
    if (confirm("If you stop now, you will not be able to return to this session. There is no penalty for stopping.")) {
        endBlock();
    }
}

function endBlock() {
    clearInterval(timerInterval);

    // 1. Show the Time Up Notification
    alert("Time is up. Please complete the survey.");

    // 2. Handle Peer Earning Question Logic
    const currentConditionType = conditions[currentBlock].type;
    
    // We use a safety check here just in case HTML is missing
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

    // 3. Actually switch the screen
    showScreen('screen-survey'); 
}
// --- SURVEY LOGIC ---
function submitSurvey(event) {
    event.preventDefault(); 
    const sat = document.getElementById('survey-satisfaction').value;
    const bore = document.getElementById('survey-boredom').value;
    // Get the recall value (will be empty if Control)
    const recall = document.getElementById('survey-recall').value;

    detailedLog.forEach(row => {
        if (row.block_number === currentBlock + 1) {
            row.satisfaction = sat;
            row.boredom = bore;
            row.recall_guess = recall || "N/A"; // Save 'N/A' if empty
        }
    });

    document.getElementById('post-survey-form').reset();
    currentBlock++;
    setupBlockIntro();
}

// --- FINAL EXPORT ---
function showFinalResults() {
    showScreen('screen-end');
}

function downloadCSV() {
    if (detailedLog.length === 0) { alert("No data"); return; }
    
    // Added "Peer_Recall_Guess" to headers
    const headers = [
        "Attempt_ID", 
        "Block", 
        "Condition", 
        "Is_Correct", 
        "User_Guess", 
        "Actual_Answer", 
        "Time_Spent_Sec", 
        "Satisfaction", 
        "Boredom", 
        "Peer_Recall_Guess", 
        "Timestamp"
    ];

    const rows = detailedLog.map(row => [
        row.attempt_id, 
        row.block_number, 
        row.condition, 
        row.is_correct, 
        row.user_guess, 
        row.actual_answer, 
        row.time_spent_seconds, 
        row.satisfaction || "N/A", 
        row.boredom || "N/A",
        row.recall_guess || "N/A", // Added this column
        row.timestamp
    ]);

    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "experiment_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- UTILITIES ---
// Track focus switches (tab switching) if you still want that data?
// I'll leave it out for now to keep the CSV clean based on your specific request for Attempt Data.
// If you want it back, let me know!


