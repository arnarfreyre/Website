// chapters-config.js - Configuration for index.html chapters
const chaptersConfig = [
    {
        id: 1,
        title: "Chapter 1: Futures & Forwards",
        description: "Mathematical foundations of futures and forwards contracts. Covers no-arbitrage pricing, valuation models, margin mechanics, optimal hedging strategies, and interest rate futures.",
        path: "Chapters/Chapter1.html",
        pdfFile: "Module 1.1.pdf", // Add PDF filename here when available (e.g., "Chapter1.pdf")
        status: "available"
    },
    {
        id: 2,
        title: "Chapter 2: Options Fundamentals",
        description: "Introduction to options pricing, payoff structures, put-call parity, and basic strategies. Binomial models and introduction to Black-Scholes framework.",
        path: null,
        pdfFile: null,
        status: "coming-soon"
    },
    {
        id: 3,
        title: "Chapter 3: Black-Scholes Model",
        description: "Stochastic calculus foundations, derivation of Black-Scholes PDE, risk-neutral valuation, and the Greeks. Numerical methods for option pricing.",
        path: null,
        pdfFile: null,
        status: "coming-soon"
    },
    {
        id: 4,
        title: "Chapter 4: Exotic Options",
        description: "Path-dependent options, barrier options, Asian options, and lookback options. Monte Carlo simulation and advanced pricing techniques.",
        path: null,
        pdfFile: null,
        status: "coming-soon"
    },
    {
        id: 5,
        title: "Chapter 5: Interest Rate Derivatives",
        description: "Caps, floors, and swaptions. Term structure models, short rate models, and the Heath-Jarrow-Morton framework.",
        path: null,
        pdfFile: null,
        status: "coming-soon"
    },
    {
        id: 6,
        title: "Chapter 6: Credit Derivatives",
        description: "Credit default swaps, collateralized debt obligations, and credit risk modeling. Copula methods and correlation trading.",
        path: null,
        pdfFile: null,
        status: "coming-soon"
    },
    {
        id: 7,
        title: "Chapter 7: Volatility Derivatives",
        description: "Variance swaps, volatility swaps, and VIX derivatives. Stochastic volatility models and volatility surface dynamics.",
        path: null,
        pdfFile: null,
        status: "coming-soon"
    },
    {
        id: 8,
        title: "Chapter 8: Risk Management",
        description: "Value at Risk, Expected Shortfall, and stress testing. Portfolio optimization, dynamic hedging strategies, and regulatory frameworks.",
        path: null,
        pdfFile: null,
        status: "coming-soon"
    },
    {
        id: 9,
        title: "Chapter 9: Cryptocurrency Derivatives",
        description: "Bitcoin futures, perpetual swaps, and DeFi derivatives. Unique challenges in crypto markets and decentralized derivative protocols.",
        path: null,
        pdfFile: null,
        status: "coming-soon"
    },
    {
        id: 10,
        title: "Chapter 10: Cryptocurrency Derivatives",
        description: "Bitcoin futures, perpetual swaps, and DeFi derivatives. Unique challenges in crypto markets and decentralized derivative protocols.",
        path: null,
        pdfFile: null,
        status: "coming-soon"
    }
];

// Export for browser use
if (typeof window !== 'undefined') {
    window.chaptersConfig = chaptersConfig;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = chaptersConfig;
}