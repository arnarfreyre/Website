# Modular Configuration System Documentation

## Overview

The Derivatives Course has been refactored to use a modular configuration system. Each main HTML page now loads its content dynamically from dedicated configuration files, making the system easy to maintain and extend.

## Architecture

### Configuration Files

Each main HTML page has its own configuration file in the `js/` directory:

- **`js/chapters-config.js`** → Used by `index.html`
- **`js/formulas-config.js`** → Used by `formulas.html`
- **`js/solvers-config.js`** → Used by `solvers.html`
- **`js/problemSets.js`** → Used by `problem-sets.html`

### Shared Components

- **`js/render-utils.js`** - Common rendering functions used by all pages
- **`styles.css`** - Shared styling for consistent appearance

## How to Add New Content

### Adding a New Chapter

Edit `js/chapters-config.js` and add a new object to the `chaptersConfig` array:

```javascript
{
    id: 10,
    title: "Chapter 10: Your New Chapter",
    description: "Description of the chapter content",
    path: "Chapters/Chapter10.html",  // Set to null if not ready
    status: "available"  // or "coming-soon"
}
```

### Adding a New Formula Sheet

Edit `js/formulas-config.js` and add:

```javascript
{
    id: 10,
    title: "New Formula Category",
    description: "Description of formulas",
    path: "formulas/new-category.html",
    pdfPath: null,  // Optional PDF version
    status: "available"
}
```

### Adding a New Solver

Edit `js/solvers-config.js` and add:

```javascript
{
    id: 10,
    title: "New Calculator",
    description: "What this calculator does",
    path: "Solvers/new-calculator.html",  // null if not ready
    status: "available"  // or "coming-soon"
}
```

### Adding a New Problem Set

Edit `js/problemSets.js` and add:

```javascript
{
    id: 9,
    title: "Problem Set IX - New Topic",
    chapter: "chapter-key",
    description: "Description of problems",
    pdfFile: "Problem set IX.pdf",  // null if not ready
    solutionFile: "Solutions-9.html"  // null if no solution yet
}
```

## Configuration Structure

### Standard Item Structure

```javascript
{
    id: number,           // Unique identifier
    title: string,        // Display title
    description: string,  // Card description
    path: string|null,    // Path to resource (null = coming soon)
    status: string        // "available" or "coming-soon"
}
```

### Problem Set Structure

```javascript
{
    id: number,
    title: string,
    chapter: string,      // Associated chapter key
    description: string,
    pdfFile: string|null,     // PDF filename
    solutionFile: string|null // Solution filename
}
```

## Benefits

1. **No HTML Editing Required**: Add new content by only updating JavaScript config files
2. **Consistent Rendering**: All cards use the same rendering logic
3. **Easy Maintenance**: Content and presentation are separated
4. **Modular Design**: Each page has its own config but shares utilities
5. **Future-Proof**: Easy to add new features or modify existing ones

## Testing

Open `test-config.html` in a browser to verify all configuration files are loading correctly.

## File Organization

```
Afleiður/
├── index.html          (Chapters page - uses chapters-config.js)
├── formulas.html       (Formulas page - uses formulas-config.js)
├── problem-sets.html   (Problems page - uses problemSets.js)
├── solvers.html        (Solvers page - uses solvers-config.js)
├── styles.css          (Shared styles)
└── js/
    ├── chapters-config.js    (Chapter definitions)
    ├── formulas-config.js    (Formula sheet definitions)
    ├── solvers-config.js     (Solver tool definitions)
    ├── problemSets.js        (Problem set definitions)
    └── render-utils.js       (Shared rendering functions)
```

## Important Notes

- Always set `path` to `null` for items that are not yet available
- The `status` field determines the visual appearance (available vs coming soon)
- Problem sets use a different structure with `pdfFile` and `solutionFile`
- All paths in configs are relative to the root directory