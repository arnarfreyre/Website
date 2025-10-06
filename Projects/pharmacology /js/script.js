// Global variables
let examData = {};
let currentQuestion = 0;
let currentMode = 'study';
let answers = {};
let timer = null;
let timeRemaining = 180 * 60; // 180 minutes in seconds

// Load exam data on page load
async function loadExamData() {
    try {
        const response = await fetch('data/clinical_pharm_exam_2025.json');
        examData = await response.json();
        initializeExam();
        document.getElementById('loader').classList.add('hidden');
    } catch (error) {
        console.error('Error loading exam data:', error);
        document.getElementById('loader').classList.add('hidden');
        alert('Gat ekki hlaðið prófgögnum. Vinsamlegast reyndu aftur.');
    }
}

// Initialize exam interface
function initializeExam() {
    populatePatientCase();
    populateQuestions();
    createQuestionNav();
    showQuestion(0);
    updateProgress();
}

// Populate patient case tabs
function populatePatientCase() {
    const sjukratilfelli = examData.sjukratilfelli;

    // Saga tab
    document.getElementById('tab-saga').innerHTML = `
        <div>
            <h3 style="color: var(--primary); margin-bottom: 1rem;">Ástæða komu</h3>
            <p style="line-height: 1.8; margin-bottom: 1.5rem;">${sjukratilfelli.astæda_komu}</p>

            <h3 style="color: var(--primary); margin-bottom: 1rem;">Sjúkrasaga</h3>
            <ul style="list-style: none; padding: 0;">
                ${Object.entries(sjukratilfelli.sjukrasaga).map(([key, value]) =>
                    `<li style="padding: 0.5rem 0; border-bottom: 1px solid #e5e7eb;">
                        <strong>${key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.replace(/_/g, ' ').slice(1)}:</strong> ${value}
                    </li>`
                ).join('')}
            </ul>

            <h3 style="color: var(--primary); margin-top: 1.5rem; margin-bottom: 1rem;">Félagssaga</h3>
            <ul style="list-style: none; padding: 0;">
                ${Object.entries(sjukratilfelli.felagssaga).map(([key, value]) =>
                    `<li style="padding: 0.5rem 0;">
                        <strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}
                    </li>`
                ).join('')}
            </ul>
        </div>
    `;

    // Lyfjasaga tab
    document.getElementById('tab-lyf').innerHTML = `
        <div style="display: grid; gap: 1rem;">
            ${sjukratilfelli.lyfjasaga.map(lyf => `
                <div style="padding: 1rem; background: #f9fafb; border-radius: 10px; border-left: 4px solid var(--primary);">
                    <h4 style="color: var(--primary); margin-bottom: 0.5rem;">${lyf.lyf}</h4>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                        <div><strong>Skammtur:</strong> ${lyf.skammtur}</div>
                        <div><strong>Tíðni:</strong> ${lyf.tíðni}</div>
                        ${lyf.aths ? `<div style="grid-column: span 2; color: var(--warning);"><strong>Aths:</strong> ${lyf.aths}</div>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Lífsmörk tab
    document.getElementById('tab-lifsmark').innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            ${Object.entries(sjukratilfelli.lifsmaork).map(([key, value]) => {
                const isAbnormal = key === 'blodthrysting_mmHg' || key === 'puls_slog_min' || key === 'surefiismetun_prósent';
                return `
                    <div style="padding: 1rem; background: ${isAbnormal ? '#fef2f2' : '#f9fafb'}; border-radius: 10px; border: 2px solid ${isAbnormal ? 'var(--danger)' : '#e5e7eb'};">
                        <div style="color: #6b7280; font-size: 0.9rem; margin-bottom: 0.25rem;">${key.replace(/_/g, ' ').toUpperCase()}</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: ${isAbnormal ? 'var(--danger)' : 'var(--primary)'};">${value}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    // Blóðmælingar tab
    document.getElementById('tab-blod').innerHTML = `
        <div class="lab-results">
            ${Object.entries(sjukratilfelli.blodmaelingar).map(([key, data]) => {
                const value = parseFloat(data.gildi);
                const ref = data.vidmidun;
                let className = '';

                // Determine if abnormal
                if (key === 'K_mmol_L' && value > 5.0) className = 'abnormal';
                else if (key === 'SCr_mikromol_L' && value > 120) className = 'abnormal';
                else if (key === 'glukosi_mmol_L' && value > 6.1) className = 'warning';
                else if (key === 'INR' && value > 3.0) className = 'abnormal';
                else if (key === 'HbA1c_mmol_mol' && value > 53) className = 'warning';

                return `
                    <div class="lab-item ${className}">
                        <div class="lab-name">${key.replace(/_/g, ' ')}</div>
                        <div class="lab-value">${data.gildi} ${data.eining || data.einding || ''}</div>
                        <div class="lab-reference">Viðmið: ${ref}</div>
                        ${data.aths ? `<div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--danger);">${data.aths}</div>` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;

    // Læknisskoðun tab
    document.getElementById('tab-skodun').innerHTML = `
        <div>
            <ul style="list-style: none; padding: 0;">
                ${Object.entries(sjukratilfelli.laknisskoðun).map(([key, value]) => `
                    <li style="padding: 1rem; margin-bottom: 0.5rem; background: #f9fafb; border-radius: 10px;">
                        <strong style="color: var(--primary);">${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}
                    </li>
                `).join('')}
            </ul>

            <h3 style="color: var(--primary); margin-top: 2rem; margin-bottom: 1rem;">Viðbótargögn</h3>
            <div style="display: grid; gap: 1rem;">
                ${Object.entries(sjukratilfelli.aukagogn).map(([key, value]) => `
                    <div style="padding: 1rem; background: #f0f9ff; border-radius: 10px; border-left: 4px solid var(--secondary);">
                        <strong>${key.replace(/_/g, ' ').toUpperCase()}:</strong>
                        <p style="margin-top: 0.5rem;">${value}</p>
                    </div>
                `).join('')}
            </div>

            <h3 style="color: var(--primary); margin-top: 2rem; margin-bottom: 1rem;">Niðurstaða læknis</h3>
            <div style="padding: 1.5rem; background: #fef3c7; border-radius: 10px; border-left: 4px solid var(--warning);">
                ${sjukratilfelli.nidurstad_laeknis}
            </div>
        </div>
    `;
}

// Populate questions
function populateQuestions() {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = examData.spurningar.map((q, index) => `
        <div class="question-container ${index === 0 ? 'active' : ''}" id="question-${index}">
            <div class="question-header">
                <div>
                    <div class="question-title">Spurning ${q.spurning_nr}: ${q.flokkur}</div>
                    <div style="color: #6b7280; margin-top: 0.5rem;">${q.spurning}</div>
                </div>
                <div class="question-points">${q.stig} stig</div>
            </div>

            <div class="sub-questions">
                ${q.undirspur ? q.undirspur.map((sub, subIndex) => `
                    <div class="sub-question">
                        <div class="sub-question-header">
                            <span class="sub-question-label">${sub.a || sub.b || sub.c || sub.d || sub.e || ''}</span>
                            <span class="sub-question-points">${sub.stig} stig</span>
                        </div>
                        ${sub.leidbeiningar ? `
                            <div style="padding: 0.75rem; background: #e0e7ff; border-radius: 8px; margin-bottom: 1rem;">
                                <strong>Leiðbeiningar:</strong> ${sub.leidbeiningar}
                            </div>
                        ` : ''}
                        <div class="answer-area">
                            <textarea
                                class="answer-input"
                                id="answer-${index}-${subIndex}"
                                placeholder="Skrifaðu svar þitt hér..."
                                onchange="saveAnswer(${index}, ${subIndex}, this.value)"
                            ></textarea>
                            ${currentMode === 'study' ? `
                                <button class="hint-toggle" onclick="toggleHint('hint-${index}-${subIndex}')">
                                    💡 Sýna vísbendingu
                                </button>
                                <div class="hint-box" id="hint-${index}-${subIndex}">
                                    ${getHint(q.spurning_nr, subIndex)}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('') : ''}
            </div>
        </div>
    `).join('');

    document.getElementById('navigation').style.display = 'block';
}

// Create question navigation
function createQuestionNav() {
    const nav = document.getElementById('questionNav');
    nav.innerHTML = examData.spurningar.map((q, index) => `
        <button class="nav-btn ${index === 0 ? 'active' : ''}"
                id="nav-${index}"
                onclick="showQuestion(${index})">
            ${q.spurning_nr}
        </button>
    `).join('');
}

// Show specific question
function showQuestion(index) {
    // Hide all questions
    document.querySelectorAll('.question-container').forEach(q => {
        q.classList.remove('active');
    });

    // Show selected question
    document.getElementById(`question-${index}`).classList.add('active');

    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`nav-${index}`).classList.add('active');

    currentQuestion = index;
    updateNavigation();
    updateProgress();
}

// Navigate between questions
function navigateQuestion(direction) {
    const newIndex = currentQuestion + direction;
    if (newIndex >= 0 && newIndex < examData.spurningar.length) {
        showQuestion(newIndex);
    }
}

// Update navigation buttons
function updateNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const currentText = document.getElementById('currentQuestionText');

    prevBtn.disabled = currentQuestion === 0;
    nextBtn.style.display = currentQuestion === examData.spurningar.length - 1 ? 'none' : 'inline-flex';
    submitBtn.style.display = currentQuestion === examData.spurningar.length - 1 ? 'inline-flex' : 'none';

    currentText.textContent = `Spurning ${currentQuestion + 1} af ${examData.spurningar.length}`;
}

// Save answer
function saveAnswer(questionIndex, subIndex, value) {
    if (!answers[questionIndex]) {
        answers[questionIndex] = {};
    }
    answers[questionIndex][subIndex] = value;
    updateProgress();

    // Mark question as completed if all sub-questions are answered
    const question = examData.spurningar[questionIndex];
    if (question.undirspur) {
        const allAnswered = question.undirspur.every((_, idx) =>
            answers[questionIndex] && answers[questionIndex][idx]
        );
        if (allAnswered) {
            document.getElementById(`nav-${questionIndex}`).classList.add('completed');
        }
    }
}

// Update progress
function updateProgress() {
    const totalQuestions = examData.spurningar.length;
    const answeredQuestions = Object.keys(answers).length;
    const progress = (answeredQuestions / totalQuestions) * 100;

    document.getElementById('progressBar').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${answeredQuestions} af ${totalQuestions} spurningum`;

    // Calculate potential score
    let potentialScore = 0;
    Object.keys(answers).forEach(qIndex => {
        const question = examData.spurningar[qIndex];
        if (question.undirspur) {
            question.undirspur.forEach((sub, subIndex) => {
                if (answers[qIndex] && answers[qIndex][subIndex]) {
                    potentialScore += sub.stig;
                }
            });
        }
    });
    document.getElementById('scoreText').textContent = `${potentialScore} stig`;
}

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// Set mode
function setMode(mode) {
    currentMode = mode;

    // Update mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Handle mode-specific features
    if (mode === 'exam') {
        startTimer();
        document.getElementById('timerCard').style.display = 'block';
        // Hide hints in exam mode
        document.querySelectorAll('.hint-toggle, .hint-box').forEach(el => {
            el.style.display = 'none';
        });
    } else {
        stopTimer();
        document.getElementById('timerCard').style.display = 'none';
        // Show hints in study mode
        document.querySelectorAll('.hint-toggle').forEach(el => {
            el.style.display = 'block';
        });
    }

    if (mode === 'review') {
        showReview();
    } else {
        hideReview();
    }
}

// Timer functions
function startTimer() {
    timeRemaining = 180 * 60; // Reset to 180 minutes
    updateTimerDisplay();

    timer = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            stopTimer();
            submitExam();
        }
    }, 1000);
}

function stopTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

function updateTimerDisplay() {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;

    const display = document.getElementById('timeDisplay');
    display.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Add warning classes
    if (timeRemaining < 600) { // Less than 10 minutes
        display.classList.add('danger');
    } else if (timeRemaining < 1800) { // Less than 30 minutes
        display.classList.add('warning');
    }
}

// Toggle hint
function toggleHint(hintId) {
    const hintBox = document.getElementById(hintId);
    hintBox.classList.toggle('show');
}

// Get hint for question
function getHint(questionNum, subIndex) {
    const hints = {
        1: [
            "Mundu að nota rétta formúlu fyrir Cockcroft-Gault og athuga einingar",
            "CrCl < 30 = alvarlega skert, 30-60 = í meðallagi skert, 60-90 = vægt skert",
            "Fyrir hjartabilun er ClNR = 20 mL/mín",
            "Vd formúlan tekur tillit til þyngdar og nýrnastarfsemi"
        ],
        2: [
            "Flokkaðu frávik: <10% frá viðmiði = lítið, 10-25% = miðlungs, >25% = alvarlegt",
            "INR 4.2 og K+ 5.8 eru mest áhyggjuefni klínískt",
            "Leiðrétt natríum = mælt Na + [(glúkósi - 5.5) / 5.5] × 2.4"
        ],
        3: [
            "ACE-hemlar og kalíumsparandi þvagræsilyf geta hækkað kalíum",
            "Warfarin milliverkanir: Skert nýrnastarfsemi, lyfjamilliverkanir, mataræði",
            "Metformin er frábending ef CrCl < 30 mL/mín",
            "Athugaðu milliverkanir milli warfarin og annarra lyfja"
        ],
        4: [
            "IV furosemide er fyrsta val fyrir bráða hjartabilun",
            "Vítamín K 1-2 mg PO eða IV fyrir INR > 4",
            "Kalíum lækkun: Insulin+glúkósi, kalíumbindandi lyf",
            "Insulin sliding scale fyrir háan blóðsykur",
            "Súrefnisgjöf með mask eða nefbilung"
        ],
        5: [
            "ACE-hemlar þarf að títra varlega með tilliti til K+ og nýrna",
            "Beta-blokkarar fyrir hjartabilun: Carvedilol, bisoprolol, metoprolol XL",
            "Nýr warfarin skammtur = (5 mg × 2.5) / 4.2 = 3 mg",
            "LDL markmið <1.8 fyrir mjög háa áhættu - íhuga að hækka statin"
        ],
        6: [
            "INR eftirlit vikulega þar til stöðugt, síðan mánaðarlega",
            "Fylgjast með þyngd daglega, blóðþrýstingi og púls",
            "Saltsnautt mataræði, vökvatakmörkun, hætta reykingum"
        ],
        7: [
            "LD = (1.0 × Vd) / 0.7 fyrir töflur",
            "MD = (1.0 × Cl × 1440) / 0.7"
        ]
    };

    return hints[questionNum] && hints[questionNum][subIndex]
        ? hints[questionNum][subIndex]
        : "Lestu spurninguna vandlega og notaðu gefnar formúlur";
}

// Submit exam
function submitExam() {
    stopTimer();
    calculateResults();
    showResults();
}

// Calculate results
function calculateResults() {
    let totalScore = 0;
    let maxScore = 0;

    examData.spurningar.forEach((question, qIndex) => {
        if (question.undirspur) {
            question.undirspur.forEach((sub, subIndex) => {
                maxScore += sub.stig;
                if (answers[qIndex] && answers[qIndex][subIndex]) {
                    // In a real exam, this would be graded properly
                    // For demo, give partial credit for any answer
                    totalScore += sub.stig * 0.7; // 70% credit for attempting
                }
            });
        } else {
            maxScore += question.stig;
        }
    });

    return { totalScore: Math.round(totalScore), maxScore };
}

// Show results
function showResults() {
    const { totalScore, maxScore } = calculateResults();
    const percentage = (totalScore / maxScore) * 100;
    const passed = totalScore >= 50;

    document.getElementById('finalScore').textContent = `${totalScore} / ${maxScore}`;

    const gradeDisplay = document.getElementById('gradeDisplay');
    gradeDisplay.textContent = passed ? 'Staðist' : 'Fall';
    gradeDisplay.className = passed ? 'grade' : 'grade fail';

    // Show detailed results
    const detailedResults = document.getElementById('detailedResults');
    detailedResults.innerHTML = `
        <div style="margin-top: 2rem;">
            <h3 style="margin-bottom: 1rem;">Sundurliðun</h3>
            ${examData.spurningar.map((q, index) => {
                let questionScore = 0;
                let questionMax = q.stig;

                if (q.undirspur) {
                    questionMax = q.undirspur.reduce((sum, sub) => sum + sub.stig, 0);
                    q.undirspur.forEach((sub, subIndex) => {
                        if (answers[index] && answers[index][subIndex]) {
                            questionScore += sub.stig * 0.7;
                        }
                    });
                }

                return `
                    <div style="padding: 1rem; margin-bottom: 0.5rem; background: #f9fafb; border-radius: 10px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span><strong>Spurning ${q.spurning_nr}:</strong> ${q.flokkur}</span>
                            <span style="color: ${questionScore > 0 ? 'var(--success)' : 'var(--danger)'};">
                                ${Math.round(questionScore)} / ${questionMax} stig
                            </span>
                        </div>
                    </div>
                `;
            }).join('')}

            <div style="margin-top: 2rem; padding: 1rem; background: ${passed ? '#dcfce7' : '#fee2e2'}; border-radius: 10px;">
                <p style="font-size: 1.1rem; text-align: center;">
                    <strong>Heildareinkunn: ${percentage.toFixed(1)}%</strong>
                </p>
                <p style="text-align: center; margin-top: 0.5rem;">
                    ${passed
                        ? 'Til hamingju! Þú hefur staðist prófið.'
                        : 'Því miður náðir þú ekki lágmarkseinkunn. Reyndu aftur!'}
                </p>
            </div>
        </div>
    `;

    document.getElementById('resultsModal').classList.add('show');
}

// Show review mode
function showReview() {
    // In review mode, show all questions with correct answers
    // This would typically load from a solutions database
    alert('Yfirlitsstilling er í þróun. Hér myndu birtast réttar lausnir og útskýringar.');
}

function hideReview() {
    // Return to normal view
}

// Close modal
function closeModal() {
    document.getElementById('resultsModal').classList.remove('show');
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    loadExamData();
});