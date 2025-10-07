// ===================================
// QUIZ APPLICATION - quiz.js
// Multiple-Choice Test Functionality
// ===================================

// Global State
let quizData = null;
let userAnswers = new Array(25).fill(null);
let currentQuestionIndex = 0;
let isReviewMode = false;

// ===================================
// UTILITY FUNCTIONS
// ===================================

// Fisher-Yates Shuffle Algorithm
function shuffleArray(array) {
    const shuffled = [...array]; // Create a copy to avoid mutating original
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Shuffle answer options for a question while tracking correct answer
function shuffleQuestionAnswers(question) {
    // Get the correct answer text before shuffling
    const correctAnswerText = question.valmöguleikar[question.réttSvar];

    // Shuffle the options array
    const shuffledOptions = shuffleArray(question.valmöguleikar);

    // Find the new index of the correct answer after shuffling
    const newCorrectIndex = shuffledOptions.indexOf(correctAnswerText);

    // Return modified question with shuffled options and updated correct answer index
    return {
        ...question,
        valmöguleikar: shuffledOptions,
        réttSvar: newCorrectIndex
    };
}

// Initialize Quiz on Page Load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadQuizData();
        initializeQuiz();
        hideLoader();
    } catch (error) {
        console.error('Error initializing quiz:', error);
        alert('Villa við að hlaða prófi. Vinsamlegast reyndu aftur.');
    }
});

// Load Quiz Data from JSON
async function loadQuizData() {
    try {
        const response = await fetch('data/clinical_pharma_quiz.json');
        if (!response.ok) throw new Error('Failed to load quiz data');
        const data = await response.json();

        // Shuffle answer options for all questions to randomize answer positions
        data.spurningar = data.spurningar.map(shuffleQuestionAnswers);

        quizData = data;

        // Optional: Log answer distribution for verification (comment out in production)
        // console.log('Answer distribution:', data.spurningar.map(q => q.réttSvar));
    } catch (error) {
        console.error('Error loading quiz data:', error);
        throw error;
    }
}

// Initialize Quiz Interface
function initializeQuiz() {
    createQuestionNavigator();
    displayQuestion(0);
    updateProgress();
    updateSubmitButton();
}

// Display Current Question
function displayQuestion(index) {
    if (!quizData || index < 0 || index >= quizData.spurningar.length) return;

    currentQuestionIndex = index;
    const question = quizData.spurningar[index];

    // Update question number
    document.getElementById('questionNumber').innerHTML = `
        <span>📝</span>
        <span>Spurning ${index + 1} af ${quizData.spurningar.length}</span>
    `;

    // Update question text
    document.getElementById('questionText').textContent = question.spurning;

    // Create answer options
    const optionsContainer = document.getElementById('answerOptions');
    optionsContainer.innerHTML = '';

    const labels = ['A', 'B', 'C', 'D'];
    question.valmöguleikar.forEach((option, optionIndex) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'answer-option';
        optionDiv.dataset.index = optionIndex;

        // Add selected class if already answered
        if (userAnswers[index] === optionIndex) {
            optionDiv.classList.add('selected');
        }

        // In review mode, show correct/incorrect
        if (isReviewMode) {
            optionDiv.style.cursor = 'default';
            if (optionIndex === question.réttSvar) {
                optionDiv.classList.add('correct');
            } else if (userAnswers[index] === optionIndex) {
                optionDiv.classList.add('incorrect');
            }
        } else {
            // Add click handler only in quiz mode
            optionDiv.onclick = () => selectAnswer(index, optionIndex);
        }

        optionDiv.innerHTML = `
            <div class="answer-label">${labels[optionIndex]}</div>
            <div class="answer-text">${option}</div>
        `;

        optionsContainer.appendChild(optionDiv);
    });

    // Show/hide explanation
    const explanationDiv = document.getElementById('explanation');
    if (isReviewMode && userAnswers[index] !== null) {
        explanationDiv.classList.remove('hidden');
        document.getElementById('explanationText').textContent = question.útskýring;
    } else {
        explanationDiv.classList.add('hidden');
    }

    // Update navigation buttons
    updateNavigationButtons();

    // Highlight current question in navigator
    updateQuestionNavigator();
}

// Select Answer
function selectAnswer(questionIndex, optionIndex) {
    if (isReviewMode) return;

    userAnswers[questionIndex] = optionIndex;

    // Update UI
    const options = document.querySelectorAll('.answer-option');
    options.forEach(option => {
        option.classList.remove('selected');
        if (parseInt(option.dataset.index) === optionIndex) {
            option.classList.add('selected');
        }
    });

    // Update progress
    updateProgress();
    updateSubmitButton();
    updateQuestionNavigator();
}

// Navigate to Previous Question
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        displayQuestion(currentQuestionIndex - 1);
    }
}

// Navigate to Next Question
function nextQuestion() {
    if (currentQuestionIndex < quizData.spurningar.length - 1) {
        displayQuestion(currentQuestionIndex + 1);
    }
}

// Jump to Specific Question
function jumpToQuestion(index) {
    displayQuestion(index);
}

// Update Navigation Buttons
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = currentQuestionIndex === quizData.spurningar.length - 1;
}

// Create Question Navigator
function createQuestionNavigator() {
    const navigator = document.getElementById('questionNavigator');
    navigator.innerHTML = '';

    for (let i = 0; i < quizData.spurningar.length; i++) {
        const btn = document.createElement('button');
        btn.className = 'q-nav-btn';
        btn.textContent = i + 1;
        btn.onclick = () => jumpToQuestion(i);
        navigator.appendChild(btn);
    }
}

// Update Question Navigator
function updateQuestionNavigator() {
    const buttons = document.querySelectorAll('.q-nav-btn');
    buttons.forEach((btn, index) => {
        btn.classList.remove('current', 'answered');

        if (index === currentQuestionIndex) {
            btn.classList.add('current');
        } else if (userAnswers[index] !== null) {
            btn.classList.add('answered');
        }
    });
}

// Update Progress Bar and Text
function updateProgress() {
    const answeredCount = userAnswers.filter(a => a !== null).length;
    const totalCount = quizData.spurningar.length;
    const percentage = (answeredCount / totalCount) * 100;

    // Update progress bar
    document.getElementById('progressBar').style.width = `${percentage}%`;

    // Update progress text
    document.getElementById('progressText').textContent = `${answeredCount} af ${totalCount} svarað`;
    document.getElementById('progressPercent').textContent = `${Math.round(percentage)}%`;
}

// Update Submit Button
function updateSubmitButton() {
    const submitBtn = document.getElementById('submitBtn');
    const allAnswered = userAnswers.every(a => a !== null);
    submitBtn.disabled = !allAnswered;
}

// Submit Quiz
function submitQuiz() {
    if (userAnswers.some(a => a === null)) {
        alert('Vinsamlegast svaraðu öllum spurningum áður en þú skilar.');
        return;
    }

    // Calculate results
    const results = calculateResults();

    // Show results modal
    showResults(results);
}

// Calculate Quiz Results
function calculateResults() {
    let correct = 0;
    let incorrect = 0;

    quizData.spurningar.forEach((question, index) => {
        if (userAnswers[index] === question.réttSvar) {
            correct++;
        } else {
            incorrect++;
        }
    });

    const total = quizData.spurningar.length;
    const percentage = (correct / total) * 100;
    const passed = correct >= quizData.stigagjöf.staðið;

    return {
        correct,
        incorrect,
        total,
        percentage: Math.round(percentage),
        passed
    };
}

// Show Results Modal
function showResults(results) {
    const modal = document.getElementById('resultsModal');

    // Update score display
    document.getElementById('finalScore').textContent = `${results.correct} / ${results.total}`;

    // Update grade
    const gradeDiv = document.getElementById('gradeDisplay');
    if (results.passed) {
        gradeDiv.textContent = '✅ Staðist';
        gradeDiv.className = 'grade pass';
    } else {
        gradeDiv.textContent = '❌ Féll';
        gradeDiv.className = 'grade fail';
    }

    // Update stats
    document.getElementById('correctCount').textContent = results.correct;
    document.getElementById('incorrectCount').textContent = results.incorrect;
    document.getElementById('percentageScore').textContent = `${results.percentage}%`;

    // Update passing message
    const passingMsg = document.getElementById('passingMessage');
    if (results.passed) {
        passingMsg.textContent = `Til hamingju! Þú fékkst ${results.correct} stig og stóðst prófið (þarft ${quizData.stigagjöf.staðið}+)`;
        passingMsg.style.color = 'var(--success)';
    } else {
        passingMsg.textContent = `Þú fékkst ${results.correct} stig. Þú þarft ${quizData.stigagjöf.staðið} stig til að standast (60%)`;
        passingMsg.style.color = 'var(--error)';
    }

    // Show modal
    modal.classList.remove('hidden');
}

// Review Answers
function reviewAnswers() {
    isReviewMode = true;
    document.getElementById('resultsModal').classList.add('hidden');
    displayQuestion(0);

    // Update submit button to show "Til baka í niðurstöður"
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = '📊 Skoða niðurstöður';
    submitBtn.disabled = false;
    submitBtn.onclick = () => {
        const results = calculateResults();
        showResults(results);
    };
}

// Hide Loader
function hideLoader() {
    document.getElementById('loader').classList.add('hidden');
}

// Prevent accidental page navigation
window.addEventListener('beforeunload', (e) => {
    if (!isReviewMode && userAnswers.some(a => a !== null)) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});
