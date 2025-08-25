// formulas-config.js - Configuration for formulas.html
const formulasConfig = [
    {
        id: 1,
        title: "Time Value of Money",
        description: "Compound interest, present value, future value, annuities, and perpetuities. Essential foundations for all financial calculations.",
        path: "formulas/time-value-money.html",
        pdfPath: null,
        status: "available"
    },
    {
        id: 2,
        title: "Bond Pricing",
        description: "Bond valuation formulas, yield to maturity, clean vs dirty prices, and term structure calculations.",
        path: "formulas/bond-pricing.html",
        pdfPath: null,
        status: "available"
    },
    {
        id: 3,
        title: "Duration & Convexity",
        description: "Macaulay duration, modified duration, effective duration, convexity, and price sensitivity measures.",
        path: "formulas/duration-measures.html",
        pdfPath: null,
        status: "available"
    },
    {
        id: 4,
        title: "Options Pricing",
        description: "Black-Scholes formulas, Greeks, put-call parity, binomial models, and option strategies.",
        path: "formulas/options-pricing.html",
        pdfPath: null,
        status: "available"
    },
    {
        id: 5,
        title: "Futures & Forwards",
        description: "Forward pricing, cost of carry model, convenience yield, and futures-spot parity relationships.",
        path: "formulas/futures-forwards.html",
        pdfPath: null,
        status: "available"
    },
    {
        id: 6,
        title: "Interest Rate Structures",
        description: "Term structure interpolation, forward rates, yield curves, bootstrapping, and swap rates.",
        path: "formulas/interest-rates.html",
        pdfPath: null,
        status: "available"
    },
    {
        id: 7,
        title: "Swaps",
        description: "Interest rate swap valuation, swap rates, currency swaps, and credit default swap formulas.",
        path: "formulas/swaps.html",
        pdfPath: null,
        status: "available"
    },
    {
        id: 8,
        title: "Risk Metrics",
        description: "Value at Risk, Expected Shortfall, Expected Credit Loss, and portfolio risk measures.",
        path: "formulas/risk-metrics.html",
        pdfPath: null,
        status: "available"
    },
    {
        id: 9,
        title: "Quick Reference",
        description: "Commonly used constants, conversions, compounding conventions, and important mathematical relationships.",
        path: "formulas/quick-reference.html",
        pdfPath: null,
        status: "available"
    }
];

// Special PDF resources that might be in formulas/pdf/
const formulaPDFs = [
    {
        id: 101,
        title: "Complete Formula Sheet PDF",
        description: "Downloadable PDF containing all formulas from the course",
        path: null,
        pdfPath: "formulas/pdf/Derivatives - Formula Sheet.pdf",
        status: "available"
    }
];

// Export for browser use
if (typeof window !== 'undefined') {
    window.formulasConfig = formulasConfig;
    window.formulaPDFs = formulaPDFs;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { formulasConfig, formulaPDFs };
}