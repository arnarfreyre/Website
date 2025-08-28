# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# T-503-AFLE Derivatives Course Project

## Project Overview

This repository contains a comprehensive HTML-based derivatives course with interactive solutions, problem sets, and verification tools. The course is designed as a complete online learning platform for financial derivatives at Reykjavik University.

### Course Information
- **Course Code:** T-503-AFLE
- **Course Name:** Derivatives
- **Institution:** Reykjavik University
- **Format:** HTML-based interactive course with Python verification
- **Focus Areas:** Bond pricing, term structures, options, futures, swaps, risk management

## Common Development Commands

```bash
# Open the main page in browser
open index.html

# Run Python verification for solutions (from project root)
python3 "AA-Extra/Python fact checking/test.py"
python3 "AA-Extra/Python fact checking/forwards.py"

# Test the website locally with Python's simple HTTP server
python3 -m http.server 8000
# Then visit http://localhost:8000 in browser

# Search for specific content across HTML files
grep -r "Black-Scholes" --include="*.html"

# List all formula pages
ls formulas/*.html

# View git status to track changed files
git status
```

## 📁 Project Structure & Organization

```
Afleiður/
│
├── 📄 Core Files
│   ├── index.html                    # Main navigation with dynamic tab system
│   ├── problem-sets.html            # Problem sets overview page
│   ├── solvers.html                 # Interactive calculators page
│   ├── formulas.html                # Formula reference navigation
│   ├── styles.css                   # Shared styles for all HTML pages where ALL styles will be stored and sectioned
│   └── CLAUDE.md                    # This file - project guidelines
│
├── 📚 Chapters/                     # Course content organized by topic
│   ├── Chapter1.html                # Currently available chapter
│   └── Module 1.1.pdf              # PDF companion material
│
├── 📝 Problem sets/                 # Practice problems (PDF format)
│   ├── Problem set I - Reminders.pdf  
│   └── Problem set II - Forwards.pdf
│
├── ✅ Solutions/                    # HTML solutions with calculations
│   ├── Solutions-1.html            # Problem Set 1 solutions
│   └── Template.html               # Template for new solutions
│
├── 🧮 Solvers/                     # Interactive calculators
│   ├── bond-pricing-calculator.html
│   └── forward-rate-calculator.html
│
├── 📊 formulas/                    # Modular formula pages
│   ├── bond-pricing.html          
│   ├── duration-measures.html     
│   ├── futures-forwards.html      
│   ├── interest-rates.html        
│   ├── options-pricing.html       
│   ├── quick-reference.html       
│   ├── risk-metrics.html          
│   ├── swaps.html                 
│   ├── time-value-money.html      
│   └── pdf/                       
│       └── Derivatives - Formula Sheet.pdf
│
├── 🔧 js/                          # JavaScript configuration and utilities
│   ├── chapters-config.js         # Chapter metadata and availability
│   ├── formulas-config.js         # Formula pages configuration
│   ├── problemSets.js             # Problem set configuration
│   ├── render-utils.js            # Shared rendering functions
│   └── solvers-config.js          # Solver tools configuration
│
├── 🐍 AA-Extra/Python fact checking/ # Python verification scripts
│   ├── test.py                    # General testing script
│   └── forwards.py                # Forward rate calculations
│
└── 📂 AA-Extra/Old course/         # Reference materials from previous course
    ├── Resources/                  # Formula sheets and handouts
    └── Tests and Exams/           # Past exams with solutions
```

## 🏗 Architecture & Key Systems

### JavaScript Configuration System
The website uses a modular JavaScript configuration system where content is defined in `/js/*-config.js` files and rendered dynamically:

1. **Configuration Files** (`js/*-config.js`):
   - Define metadata for chapters, formulas, solvers, and problem sets
   - Control availability status and paths
   - Single source of truth for navigation

2. **Render Utilities** (`js/render-utils.js`):
   - `createCard()`: Generates UI cards for different content types
   - `renderCards()`: Batch renders collections of cards
   - Handles availability states and styling

3. **Dynamic Loading Pattern**:
   ```javascript
   // Each page loads its config and renders content
   chaptersConfig → renderUtils.renderCards() → DOM
   ```

### Navigation System
- **Tab-based navigation**: Main pages (index, problem-sets, solvers, formulas)
- **Dynamic content loading**: JavaScript renders cards based on configuration
- **Availability tracking**: Items marked as 'available' or 'coming-soon' in configs

### Formula Organization
- **Modular structure**: Each topic has its own HTML file in `/formulas/`
- **Central navigation**: `formulas.html` serves as the formula hub
- **Quick reference**: Consolidated formula sheet available as PDF

## 🎯 Folder Purpose & Content Guidelines

### **Core Navigation Pages**
- **index.html**: Study materials and chapters
- **problem-sets.html**: Problem set PDFs and solutions
- **solvers.html**: Interactive calculators
- **formulas.html**: Formula reference hub

### **Chapters/** Folder
**Purpose:** Sequential course content with theory and examples
- Currently contains Chapter1.html and Module PDFs
- Each chapter is self-contained with internal navigation
- Configured via `js/chapters-config.js`

### **Problem sets/** Folder
**Purpose:** Practice problems for student assessment
- PDF format for easy printing and offline work
- Named with descriptive titles (e.g., "Problem set I - Reminders.pdf")

### **Solutions/** Folder
**Purpose:** Detailed HTML solutions with step-by-step explanations
- **MANDATORY:** All numerical answers must be Python-verified first
- Template.html provides boilerplate for new solutions
- Currently contains Solutions-1.html

### **Solvers/** Folder
**Purpose:** Interactive calculation tools
- bond-pricing-calculator.html: Bond valuation tool
- forward-rate-calculator.html: Forward rate computations
- Configured via `js/solvers-config.js`

### **formulas/** Folder
**Purpose:** Modular formula reference pages
- Each financial concept has its own HTML file
- Organized by topic (bonds, options, swaps, etc.)
- PDF subfolder contains downloadable formula sheet

### **js/** Folder
**Purpose:** JavaScript configuration and utilities
- Config files define content metadata and availability
- render-utils.js provides shared UI generation functions
- Centralizes navigation and content management

### **AA-Extra/** Folder
**Purpose:** Python verification and reference materials
- Python fact checking/: Verification scripts for calculations
- Old course/: Historical exams, solutions, and resources

## 🚨 MANDATORY REQUIREMENTS

### 1. Python Verification First Policy

**ALL numerical answers MUST be verified in Python BEFORE being written to any solution file.**

Workflow for creating new solutions:

```bash
# Step 1: Create Python verification script
cd "Python-Fact-Checking"
touch problem_set_X/psX_problemY.py

# Step 2: Implement and verify calculations
python3 problem_set_X/psX_problemY.py

# Step 3: Only if verification passes, create HTML solution
# NEVER skip steps 1 and 2!
```

### 2. JavaScript Configuration Updates

**When adding new content, update the corresponding config file:**

```javascript
// Example: Adding a new chapter in js/chapters-config.js
{
    title: "Chapter 2: Forward Contracts",
    description: "Introduction to forward contracts and pricing",
    path: "Chapters/Chapter2.html",  // or null if not ready
    status: "available",  // or "coming-soon"
    pdfFile: "Chapters/Module 2.pdf"  // optional
}
```

### 3. HTML Consistency Standards

All HTML files must:
- Use shared styles.css for consistent appearance
- Include the standard navigation header
- Use semantic HTML5 elements
- Include KaTeX for mathematical expressions when needed

### 4. File Naming Conventions

- **Chapters:** `Chapter[number].html` (e.g., Chapter1.html)
- **Problem Sets:** Descriptive names with Roman numerals
- **Solutions:** `Solutions-[number].html` (capital S)
- **Python Scripts:** Descriptive names in AA-Extra/Python fact checking/
- **Solvers:** `[topic]-calculator.html`

## 🔧 Development Workflows

### Adding New Content

1. **New Chapter:**
   - Create HTML file in Chapters/
   - Update `js/chapters-config.js`
   - Add any companion PDFs

2. **New Solution:**
   - First write Python verification in AA-Extra/Python fact checking/
   - Create HTML solution using Template.html as base
   - Verify all calculations match Python output

3. **New Solver/Calculator:**
   - Create HTML in Solvers/
   - Update `js/solvers-config.js`
   - Include interactive JavaScript calculations

4. **New Formula Page:**
   - Create HTML in formulas/
   - Update `js/formulas-config.js`
   - Use consistent KaTeX formatting

## 🐛 Important Notes

### Python Verification Policy
**ALL numerical answers MUST be verified in Python BEFORE being written to any solution file.**
- Python scripts go in `AA-Extra/Python fact checking/`
- Run verification before creating HTML solutions
- Document any discrepancies found

### Configuration System
- Content availability is controlled via JavaScript config files
- Set `status: "coming-soon"` and `path: null` for unavailable content
- The render utilities will automatically gray out unavailable items

### Navigation Consistency
- All main pages use the tab navigation system
- Individual content pages should link back to their parent navigation page
- Use relative paths for all internal links

---

**Golden Rule:** Every numerical calculation displayed in the course must be verifiable through Python scripts in the AA-Extra/Python fact checking/ folder.