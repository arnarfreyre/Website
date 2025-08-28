// problemSets.js - Derivatives Course Problem Sets Database

// Problem sets data structure - Simple and clean
// Simply add new objects to this array
const problemSets = [
    {
        id: 1,
        title: "Problem Set I - Futures & Forwards Basics",
        chapter: "futures-forwards",
        description: "Introduction to futures and forwards pricing, no-arbitrage conditions, and basic valuation.",
        pdfFile: "Problem set I - Reminders.pdf",
        solutionFile: null // Will be added later
    },
    {
        id: 2,
        title: "Problem Set II - Forwards and Futures",
        chapter: "futures-forwards",
        description: "Optimal hedge ratios, basis risk, and hedging strategies using futures contracts.",
        pdfFile: "Problem set II - Forwards.pdf", // To be created
        solutionFile: null
    },
    {
        id: 3,
        title: "Problem Set III - Interest Rate Futures",
        chapter: "futures-forwards",
        description: "Treasury futures, duration hedging, and DV01 calculations.",
        pdfFile: null,
        solutionFile: null
    },
    {
        id: 4,
        title: "Problem Set IV - Options Basics",
        chapter: "options-fundamentals",
        description: "Option payoffs, put-call parity, and basic strategies.",
        pdfFile: null,
        solutionFile: null
    },
    {
        id: 5,
        title: "Problem Set V - Binomial Model",
        chapter: "options-fundamentals",
        description: "Binomial tree pricing and risk-neutral valuation.",
        pdfFile: null,
        solutionFile: null
    },
    {
        id: 6,
        title: "Midterm Practice Set A",
        chapter: "all",
        description: "Comprehensive practice problems covering futures, forwards, and basic options.",
        pdfFile: null,
        solutionFile: null
    },
    {
        id: 7,
        title: "Midterm Practice Set B",
        chapter: "all",
        description: "Additional practice problems with emphasis on calculations and proofs.",
        pdfFile: null,
        solutionFile: null
    },
    {
        id: 8,
        title: "Bonus Challenge - Arbitrage Opportunities",
        chapter: "futures-forwards",
        description: "Identify and exploit arbitrage opportunities in real market scenarios.",
        pdfFile: null,
        solutionFile: null
    }
];

// Helper functions for problem sets

// Get problem sets by chapter
function getProblemSetsByChapter(chapter) {
    if (chapter === 'all') {
        return problemSets;
    }
    return problemSets.filter(ps => ps.chapter === chapter);
}

// Get available problem sets (with PDF)
function getAvailableProblemSets() {
    return problemSets.filter(ps => ps.pdfFile !== null);
}

// Get problem sets with solutions available
function getProblemSetsWithSolutions() {
    return problemSets.filter(ps => ps.solutionFile !== null);
}

// Get problem set by ID
function getProblemSetById(id) {
    return problemSets.find(ps => ps.id === id);
}

// Search problem sets
function searchProblemSets(query) {
    const lowerQuery = query.toLowerCase();
    return problemSets.filter(ps =>
        ps.title.toLowerCase().includes(lowerQuery) ||
        ps.description.toLowerCase().includes(lowerQuery)
    );
}

// Export problem set API
const problemSetAPI = {
    problemSets,
    getProblemSetsByChapter,
    getAvailableProblemSets,
    getProblemSetsWithSolutions,
    getProblemSetById,
    searchProblemSets
};

// For use in browser
if (typeof window !== 'undefined') {
    window.problemSetAPI = problemSetAPI;
}

// For Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = problemSetAPI;
}