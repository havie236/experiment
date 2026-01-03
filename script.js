// --- CONFIGURATION ---
const BLOCK_DURATION_SEC = 10 * 60; // 10 minutes
const PAY_PER_MATRIX = 1000;        // 1,000 VND
const TOTAL_BLOCKS = 3; 

// --- STATE VARIABLES ---
let currentBlock = 0;
let earnings = 0;
let timerInterval;
let matricesSolvedInBlock = 0;
let participantData = [];
let matrixStartTime = 0;
let matrixTimesList = []; 
let focusSwitches = 0;
let currentZeros = 0;

// --- CONDITIONS ---
let conditions = [
    { type: 'High', text: "In a previous session, a Fulbright student completed 30 matrices and earned 30,000 VND in this same task." },
    { type: 'Low', text: "In a previous session, a Fulbright student completed 10 matrices and earned 10,000 VND in this same task." },
    { type: 'Control', text: "" } 
];

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

function startExperiment() {
    currentBlock = 0;
    participantData = []; 
    setupBlockIntro();
}

function setupBlockIntro() {
    if (currentBlock >= TOTAL_BLOCKS) {
        showFinalResults();
        return;
    }
    
    // Title and Text
    document.getElementById('block-title').innerText = `SESSION ${currentBlock + 1}`;
    
    let condition = conditions[currentBlock]; 
    let text = condition.type === 'Control' ? "" : condition.text;
    document.getElementById('social-reference-text').innerText = text;

    showScreen('screen-block-intro');
}

// --- TASK LOGIC ---
function startBlock() {
    showScreen('screen-task');
    
    // Reset Variables
    earnings = 0; 
    matricesSolvedInBlock = 0;
    focusSwitches = 0;
    matrixTimesList = []; 
    
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
    matrixStartTime = Date.now();
}

function submitMatrix() {
    let input = parseInt(document.getElementById('zero-input').value);
    
    if (input === currentZeros) {
        let timeNow = Date.now();
        let durationSeconds = (timeNow - matrixStartTime) / 1000;
        matrixTimesList.push(durationSeconds.toFixed(2));
        
        earnings += PAY_PER_MATRIX; 
        matricesSolvedInBlock++;
        updateEarningsUI();
        
        document.getElementById('zero-input').value = '';
        generateMatrix(); 
    } else {
        alert("Incorrect count. Please try again.");
    }
}

function updateEarningsUI() {
    document.getElementById('current-earnings').innerText = earnings.toLocaleString();
}

// --- TIMER ---
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
    document.getElementById('time-remaining').innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
}

// --- ENDING ---
function switchToLeisure() {
    if (confirm("Are you sure? You cannot return to the task in this session?")) {
        clearInterval(timerInterval);
        endBlock();
    }
}

function endBlock() {
    clearInterval(timerInterval);
    showScreen('screen-survey'); 
}

function submitSurvey() {
    let row = {
        block: currentBlock + 1,
        condition: conditions[currentBlock].type,
        matrices_solved: matricesSolvedInBlock,
        earnings: earnings,
        distractions: focusSwitches,
        times_per_matrix: matrixTimesList.join(' | '), 
        satisfaction: document.getElementById('survey-satisfaction').value,
        boredom: document.getElementById('survey-boredom').value,
        recall: document.getElementById('survey-recall').value
    };
    
    participantData.push(row);

    document.getElementById('survey-satisfaction').value = '';
    document.getElementById('survey-boredom').value = '';
    document.getElementById('survey-recall').value = '';

    currentBlock++;
    setupBlockIntro();
}

function showFinalResults() {
    showScreen('screen-end');

    let csvContent = "Block,Condition,MatricesSolved,Earnings,Distractions,Satisfaction,Boredom,Recall,TimesPerMatrix\n";
    
    participantData.forEach(row => {
        csvContent += `${row.block},${row.condition},${row.matrices_solved},${row.earnings},${row.distractions},${row.satisfaction},${row.boredom},${row.recall},${row.times_per_matrix}\n`;
    });

    const endDiv = document.getElementById('screen-end');
    endDiv.innerHTML = `
        <h2>Experiment Complete</h2>
        <p>Please copy the text below:</p>
        <textarea id="data-box" style="width: 100%; height: 150px;">${csvContent}</textarea>
        <br><br>
        <button onclick="copyData()">Copy to Clipboard</button>
    `;
}

function copyData() {
    const copyText = document.getElementById("data-box");
    copyText.select();
    document.execCommand("copy");
    alert("Data copied!");
}

// --- UTILITIES ---
window.addEventListener('blur', () => {
    if (!document.getElementById('screen-task').classList.contains('hidden')) {
        focusSwitches++;
    }
});

// THIS IS THE FUNCTION THAT FIXES YOUR BUTTON
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

