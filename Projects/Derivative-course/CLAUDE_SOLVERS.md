# CLAUDE.md - Derivatives Course Solvers System

This file provides guidance to Claude Code when working with the interactive solvers system for the T-503-AFLE Derivatives course.

## 🎯 System Overview

The solvers system provides interactive financial calculators for derivative pricing and analysis. It's a standalone module that can operate independently from the main course infrastructure.

### Core Purpose
- **Interactive Calculations**: Real-time financial computations in the browser
- **Educational Tools**: Step-by-step breakdowns of complex formulas
- **Visualization**: Graphical representations of financial concepts
- **Verification**: Cross-checking manual calculations

## 📁 File Structure

```
solvers-workspace/
│
├── 📄 Core Files
│   ├── solvers.html              # Main navigation page for all solvers
│   ├── styles.css                # Shared styling for consistency
│   └── CLAUDE.md                 # This documentation file
│
├── 📂 js/                        # JavaScript configuration
│   ├── solvers-config.js         # Solver metadata and availability
│   └── render-utils.js           # Card rendering utilities
│
└── 📂 Solvers/                   # Individual calculator pages
    ├── bond-pricing-calculator.html       # Bond valuation tool
    ├── forward-rate-calculator.html       # Forward rate computations
    └── forward-payoff-plotter.html        # Payoff diagram generator
```

## 🏗 Architecture

### Configuration System

The solvers use a JavaScript-based configuration system:

1. **solvers-config.js**: Defines metadata for each solver
   - Title and description
   - File path
   - Availability status
   - Feature list

2. **render-utils.js**: Provides UI generation functions
   - `createCard()`: Generates solver cards
   - `renderCards()`: Batch rendering
   - Handles availability states

### Navigation Flow

```
solvers.html → loads config → renders cards → links to individual solvers
     ↑                                                    ↓
     └──────────── Back navigation ←─────────────────────┘
```

## 🧮 Individual Solvers

### Bond Pricing Calculator
**File**: `Solvers/bond-pricing-calculator.html`
**Features**:
- Present value calculation
- Yield to maturity
- Duration measures (Macaulay, Modified, Effective)
- Price sensitivity analysis
- Convexity calculations

### Forward Rate Calculator
**File**: `Solvers/forward-rate-calculator.html`
**Features**:
- Forward rate extraction from spot rates
- Term structure analysis
- Bootstrapping calculations
- Forward rate agreements (FRA) pricing

### Forward Payoff Plotter
**File**: `Solvers/forward-payoff-plotter.html`
**Features**:
- Visual payoff diagrams
- Long/short position analysis
- Profit/loss scenarios
- Interactive parameter adjustment

## 🔧 Development Guidelines

### Adding a New Solver

1. **Create the HTML file** in `Solvers/` directory:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Solver - Derivatives Course</title>
    <link rel="stylesheet" href="../styles.css">
    <!-- Include KaTeX for math rendering -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
</head>
<body>
    <!-- Your solver content -->
</body>
</html>
```

2. **Update solvers-config.js**:
```javascript
{
    title: "Your Solver Name",
    description: "Brief description of what it calculates",
    path: "Solvers/your-solver.html",
    status: "available",  // or "coming-soon"
    features: [
        "Feature 1",
        "Feature 2"
    ]
}
```

3. **Implement calculations** using JavaScript:
   - Use clear variable names
   - Add input validation
   - Provide step-by-step breakdowns
   - Include error handling

### Mathematical Rendering

All solvers use **KaTeX** for rendering mathematical expressions:

```javascript
// Inline math
element.innerHTML = katex.renderToString('c = \\sqrt{a^2 + b^2}');

// Display math block
element.innerHTML = katex.renderToString('\\frac{1}{2}', {displayMode: true});

// Auto-render (for mixed content)
renderMathInElement(document.body, {
    delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
    ]
});
```

### Styling Guidelines

All solvers inherit styles from `styles.css`. Key classes:

```css
.solver-container     /* Main container for solver content */
.input-section       /* Input form area */
.output-section      /* Results display area */
.formula-display     /* Mathematical formula presentation */
.calculate-btn       /* Calculation trigger buttons */
.result-card         /* Individual result displays */
```

## 💻 Common Patterns

### Input Validation Pattern
```javascript
function validateInput(value, min, max, fieldName) {
    const num = parseFloat(value);
    if (isNaN(num)) {
        throw new Error(`${fieldName} must be a number`);
    }
    if (num < min || num > max) {
        throw new Error(`${fieldName} must be between ${min} and ${max}`);
    }
    return num;
}
```

### Calculation Structure
```javascript
function calculateResult() {
    try {
        // 1. Get and validate inputs
        const input1 = validateInput(document.getElementById('input1').value, 0, 100, 'Input 1');
        
        // 2. Perform calculations
        const result = performCalculation(input1);
        
        // 3. Display results
        displayResults(result);
        
        // 4. Show step-by-step if requested
        if (showSteps) {
            displayStepByStep(calculationSteps);
        }
    } catch (error) {
        displayError(error.message);
    }
}
```

### Result Display Pattern
```javascript
function displayResults(results) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = `
        <div class="result-card">
            <h3>Results</h3>
            <p><strong>Value:</strong> ${results.value.toFixed(4)}</p>
            <div class="formula-display">
                ${katex.renderToString(results.formula, {displayMode: true})}
            </div>
        </div>
    `;
}
```

## 🚀 Best Practices

### Performance
- **Debounce calculations** for real-time updates
- **Cache repeated calculations** where appropriate
- **Lazy load** charts and visualizations

### User Experience
- **Provide examples** with pre-filled values
- **Include tooltips** for complex parameters
- **Show formulas** alongside calculations
- **Export functionality** for results (CSV, PDF)

### Error Handling
- **Validate all inputs** before calculation
- **Provide clear error messages**
- **Highlight problematic fields**
- **Suggest corrections** when possible

### Accessibility
- **Label all inputs** properly
- **Keyboard navigation** support
- **ARIA labels** for dynamic content
- **High contrast** mode support

## 🧪 Testing Checklist

Before deploying a new solver:

- [ ] All calculations verified against Python scripts
- [ ] Input validation handles edge cases
- [ ] Error messages are clear and helpful
- [ ] Mathematical formulas render correctly
- [ ] Responsive design works on mobile
- [ ] Back navigation returns to solvers.html
- [ ] Configuration entry added to solvers-config.js
- [ ] Performance acceptable for complex calculations

## 📚 Dependencies

### External Libraries (CDN)
- **KaTeX 0.16.8**: Mathematical expression rendering
  - katex.min.css
  - katex.min.js
  - auto-render.min.js

### Internal Dependencies
- **styles.css**: Shared styling across all pages
- **solvers-config.js**: Solver metadata and configuration
- **render-utils.js**: UI generation utilities

## 🔒 Security Considerations

- **No server-side execution**: All calculations run client-side
- **Input sanitization**: Prevent XSS through proper escaping
- **No data persistence**: No user data stored or transmitted
- **CDN integrity**: Use SRI hashes for external resources when possible

## 📖 Common Issues & Solutions

### Issue: Solver not appearing on main page
**Solution**: Check solvers-config.js entry and ensure path is correct

### Issue: Math not rendering
**Solution**: Verify KaTeX is loaded and delimiters are properly configured

### Issue: Calculations incorrect
**Solution**: Cross-verify with Python scripts in AA-Extra/Python fact checking/

### Issue: Styling inconsistent
**Solution**: Ensure ../styles.css path is correct and no inline styles conflict

---

**Note**: This standalone solvers system is part of the larger T-503-AFLE Derivatives course but can operate independently with just these files.