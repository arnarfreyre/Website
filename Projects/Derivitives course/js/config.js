// config.js - Derivatives Course Configuration

const config = {
    // Path configurations
    problemSetsPath: 'problem-sets/',
    solutionsPath: 'solutions/',
    pdfPath: 'pdfs/',
    
    // Course settings
    courseName: 'Derivatives: Financial Engineering',
    courseDescription: 'A comprehensive mathematical treatment of derivative instruments',
    
    // Platform settings
    searchDelay: 300, // Milliseconds to wait before searching
    minSearchLength: 2, // Minimum characters for search
    itemsPerPage: 20, // For future pagination
    
    // Language settings
    language: 'en', // English
    dateFormat: 'YYYY-MM-DD',
    
    // Feature flags
    enableSolutions: true, // Enable/disable solution buttons
    enablePDFDownload: true, // Enable/disable PDF downloads
    enableInteractiveCalculators: true, // Enable/disable calculators
    
    // Default view settings
    defaultView: 'chapters', // 'chapters' or 'problemsets'
    animationSpeed: 300, // Milliseconds for animations
};

// Chapter configuration
const chapters = {
    'futures-forwards': {
        id: 1,
        name: 'Futures & Forwards',
        description: 'Mathematical foundations of futures and forwards contracts',
        icon: '📊',
        available: true,
        htmlFile: 'Chapter1.html',
        topics: ['No-arbitrage pricing', 'Valuation models', 'Margin mechanics', 'Hedging strategies']
    },
    'options-fundamentals': {
        id: 2,
        name: 'Options Fundamentals',
        description: 'Introduction to options pricing and basic strategies',
        icon: '📈',
        available: false,
        htmlFile: null,
        topics: ['Payoff structures', 'Put-call parity', 'Binomial models', 'Basic strategies']
    },
    'black-scholes': {
        id: 3,
        name: 'Black-Scholes Model',
        description: 'Stochastic calculus and Black-Scholes framework',
        icon: '🧮',
        available: false,
        htmlFile: null,
        topics: ['Stochastic calculus', 'Black-Scholes PDE', 'Risk-neutral valuation', 'The Greeks']
    },
    'exotic-options': {
        id: 4,
        name: 'Exotic Options',
        description: 'Path-dependent and exotic option pricing',
        icon: '🎯',
        available: false,
        htmlFile: null,
        topics: ['Barrier options', 'Asian options', 'Lookback options', 'Monte Carlo methods']
    },
    'interest-rate': {
        id: 5,
        name: 'Interest Rate Derivatives',
        description: 'Caps, floors, swaptions and term structure models',
        icon: '💰',
        available: false,
        htmlFile: null,
        topics: ['Caps and floors', 'Swaptions', 'Short rate models', 'HJM framework']
    },
    'credit': {
        id: 6,
        name: 'Credit Derivatives',
        description: 'Credit default swaps and credit risk modeling',
        icon: '🏦',
        available: false,
        htmlFile: null,
        topics: ['CDS', 'CDOs', 'Credit risk models', 'Copula methods']
    },
    'volatility': {
        id: 7,
        name: 'Volatility Derivatives',
        description: 'Variance swaps and volatility trading',
        icon: '📉',
        available: false,
        htmlFile: null,
        topics: ['Variance swaps', 'VIX derivatives', 'Stochastic volatility', 'Volatility surface']
    },
    'risk-management': {
        id: 8,
        name: 'Risk Management',
        description: 'VaR, stress testing and portfolio optimization',
        icon: '🛡️',
        available: false,
        htmlFile: null,
        topics: ['Value at Risk', 'Expected Shortfall', 'Stress testing', 'Dynamic hedging']
    },
    'crypto': {
        id: 9,
        name: 'Cryptocurrency Derivatives',
        description: 'Bitcoin futures and DeFi derivatives',
        icon: '₿',
        available: false,
        htmlFile: null,
        topics: ['Bitcoin futures', 'Perpetual swaps', 'DeFi derivatives', 'Decentralized protocols']
    }
};

// Problem set categories
const problemCategories = {
    'weekly': {
        name: 'Weekly Problem Sets',
        icon: '📝',
        description: 'Regular weekly assignments'
    },
    'midterm': {
        name: 'Midterm Practice',
        icon: '📚',
        description: 'Practice problems for midterm exam'
    },
    'final': {
        name: 'Final Exam Prep',
        icon: '🎓',
        description: 'Comprehensive final exam preparation'
    },
    'bonus': {
        name: 'Bonus Challenges',
        icon: '🏆',
        description: 'Advanced optional problems'
    }
};

// UI Text configuration
const uiText = {
    navigation: {
        chapters: 'Chapters',
        problemSets: 'Problem Sets',
        resources: 'Resources'
    },
    buttons: {
        viewChapter: 'View Chapter',
        openPDF: 'Open PDF',
        viewSolutions: 'View Solutions',
        download: 'Download',
        back: '← Back to Course'
    },
    status: {
        available: 'Available',
        comingSoon: 'Coming Soon',
        new: 'New',
        updated: 'Recently Updated'
    },
    problemSet: {
        problems: 'problems',
        difficulty: 'Difficulty',
        dueDate: 'Due Date',
        submitted: 'Submitted',
        notSubmitted: 'Not Submitted'
    },
    difficulty: {
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
        expert: 'Expert'
    }
};

// Difficulty levels with colors
const difficultyLevels = {
    easy: { name: 'Easy', color: '#28a745', points: 10 },
    medium: { name: 'Medium', color: '#ffc107', points: 20 },
    hard: { name: 'Hard', color: '#fd7e14', points: 30 },
    expert: { name: 'Expert', color: '#dc3545', points: 50 }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        config, 
        chapters, 
        problemCategories, 
        uiText, 
        difficultyLevels 
    };
}

// For browser use
if (typeof window !== 'undefined') {
    window.courseConfig = {
        config,
        chapters,
        problemCategories,
        uiText,
        difficultyLevels
    };
}