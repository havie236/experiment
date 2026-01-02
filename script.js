const BLOCK_DURATION_SEC = 8 * 60; 
const PAY_PER_MATRIX = 1000; 
let currentBlock = 0;
const totalBlocks = 3; 
let earnings = 0;
let timerInterval;
let matricesSolvedInBlock = 0;
let participantData = [];

let conditions = [
    { type: 'High', text: "In a previous session, a peer earned ~80th percentile amount." },
    { type: 'Low', text: "In a previous session, a peer earned ~20th percentile amount." },
    { type: 'Control', text: "No peer information provided." }
];

conditions = conditions.sort(() => Math.random() - 0.5);

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
    if (currentBlock >= totalBlocks) {
        showFinalResults();
        return;
    }
    
    document.getElementById('block-title').innerText = `BLOCK ${currentBlock + 1}`;
    
    let condition = conditions[currentBlock]; 
    let text = condition.type === 'Control' ? "" : condition.text;
    document.getElementById('social-reference-text').innerText = text;

    showScreen('screen-block-intro');
}

let currentZeros = 0;

function startBlock() {
    showScreen('screen-task');
    earnings = 0; 
    matricesSolvedInBlock = 0;
    
    updateEarningsUI();
    generateMatrix();
    startTimer(BLOCK_DURATION_SEC);
}

function generateMatrix() {
    const container = document.getElementById('matrix-container');
    container.innerHTML = '';
    currentZeros = 0;
    
    // CHANGE: Loop 49 times (7x7 = 49)
    for (let i = 0; i < 49; i++) {
        let val = Math.random() > 0.5 ? 1 : 0;
        if (val === 0) currentZeros++;
        
        let cell = document.createElement('div');
        cell.className = 'matrix-cell';
        cell.innerText = val;
        container.appendChild(cell);
    }
}

function submitMatrix() {
    let input = parseInt(document.getElementById('zero-input').value);
    if (input === currentZeros) {
        earnings += PAY_PER_MATRIX; 
        matricesSolvedInBlock++;
        updateEarningsUI();
    } else {
        alert("Incorrect count.");
    }
    
    document.getElementById('zero-input').value = '';
    generateMatrix(); 
}

function updateEarningsUI() {
    document.getElementById('current-earnings').innerText = earnings;
}

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
    document.getElementById('time-remaining').innerText = 
        `${m}:${s < 10 ? '0' : ''}${s}`;
}

function switchToLeisure() {
    if (confirm("Are you sure? You cannot return to the task in this block?")) {
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

    let csvContent = "Block,Condition,MatricesSolved,Earnings,Satisfaction,Boredom,Recall\n";
    
    participantData.forEach(row => {
        csvContent += `${row.block},${row.condition},${row.matrices_solved},${row.earnings},${row.satisfaction},${row.boredom},${row.recall}\n`;
    });

    const endDiv = document.getElementById('screen-end');
    endDiv.innerHTML = `
        <h2>Experiment Complete</h2>
        <p>Please copy the text below and send it to the researcher:</p>
        <textarea id="data-box" style="width: 100%; height: 150px;">${csvContent}</textarea>
        <br><br>
        <button onclick="copyData()">Copy to Clipboard</button>
    `;
}

function copyData() {
    const copyText = document.getElementById("data-box");
    copyText.select();
    document.execCommand("copy");
    alert("Data copied! Please paste it into a message.");
}

