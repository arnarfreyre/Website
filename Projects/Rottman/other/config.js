// Configuration file for mapping seminar names to PDF file paths
// Maps quiz question seminar names to their corresponding PDF files in the Seminars folder

const SEMINAR_CONFIG = {
    "Seminar 2: Hlutabréf": "Seminars/2_Hlutabref.pdf",
    "Seminar 3: Skuldabréf": "Seminars/3_Skuldabref.pdf", 
    "Seminar 4: Afleiður": "Seminars/4_Afleidur.pdf",
    "Seminar 5: Markaðurinn": "Seminars/5_Markadurinn.pdf",
    "Seminar 6: Eignastýring": "Seminars/6_Eignastyring.pdf"
};

// Function to get PDF path for a seminar
function getSeminarPDF(seminarName) {
    return SEMINAR_CONFIG[seminarName] || null;
}

// Function to open seminar PDF in new window
function openSeminarPDF(seminarName) {
    const pdfPath = getSeminarPDF(seminarName);
    if (pdfPath) {
        // Open PDF directly in new window/tab
        window.open(pdfPath, '_blank');
    } else {
        console.error('PDF not found for seminar:', seminarName);
        alert('PDF file not found for this seminar.');
    }
}

