#!/usr/bin/env python3
"""
Project Manager Script
Scans the Projects folder and automatically updates projects.json
Creates Main.html files for projects with multiple subprojects
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, List, Optional

# Configuration
BASE_DIR = Path(__file__).parent
PROJECTS_DIR = BASE_DIR / "Projects"
PROJECTS_JSON = BASE_DIR / "projects.json"
PROJECT_CONFIG = BASE_DIR / "project_config.json"

# Exclude these from being added to projects.json
EXCLUDE_DIRS = {'.git', '__pycache__', 'node_modules', '_cleanup_archive', 'dev', 'test', 'debug', 'utils', 'CSS', 'Games', 'audio', 'css', 'js'}
EXCLUDE_FILES = {'.DS_Store', 'Thumbs.db', '.gitignore', '.gitkeep'}

# Icon mapping based on project type/name
ICON_MAP = {
    'game': 'gamepad',
    'mini': 'dice',
    'math': 'chart',
    'visual': 'chart',
    'tree': 'tree',
    'voice': 'mic',
    'drink': 'speaker',
    'platform': 'gamepad',
    'derivatives': 'chart',
    'course': 'book',
    'default': 'folder'
}

def get_icon(title: str, tags: List[str]) -> str:
    """Determine icon based on project title and tags"""
    title_lower = title.lower()
    
    # Check specific keywords in title
    if 'game' in title_lower or 'platformer' in title_lower:
        return 'gamepad'
    elif 'math' in title_lower or 'derivative' in title_lower or 'calculus' in title_lower:
        return 'chart'
    elif 'tree' in title_lower or 'nature' in title_lower:
        return 'tree'
    elif 'voice' in title_lower or 'speech' in title_lower:
        return 'mic'
    elif 'drink' in title_lower or 'party' in title_lower:
        return 'speaker'
    elif 'mini' in title_lower:
        return 'dice'
    elif 'course' in title_lower or 'learn' in title_lower:
        return 'book'
    
    # Check tags
    for tag in tags:
        tag_lower = tag.lower()
        if 'game' in tag_lower:
            return 'gamepad'
        elif 'math' in tag_lower or 'visual' in tag_lower:
            return 'chart'
    
    return 'folder'

def create_project_id(folder_name: str) -> str:
    """Create a project ID from folder name"""
    # Remove special characters and convert to lowercase with hyphens
    id_str = re.sub(r'[^a-zA-Z0-9\s-]', '', folder_name)
    id_str = re.sub(r'\s+', '-', id_str)
    return id_str.lower()

def get_project_title(folder_name: str) -> str:
    """Convert folder name to a nice title"""
    # Handle special cases
    if folder_name.lower() == "minigames":
        return "Mini Games Collection"
    elif folder_name.lower() == "math visuals":
        return "Math Visuals Collection"
    elif folder_name.lower() == "platformergame":
        return "Pixel Platformer"
    elif folder_name.lower() == "drinking simulator":
        return "Drinking Simulator"
    elif folder_name.lower() == "tree website":
        return "Tree Website"
    elif folder_name.lower() == "voice to text":
        return "Voice to Text"
    elif folder_name.lower() == "derivitives course":
        return "Derivatives Course"
    
    # Default: capitalize each word
    return ' '.join(word.capitalize() for word in folder_name.split())

def get_project_description(folder_name: str, title: str) -> str:
    """Generate a description based on project type"""
    descriptions = {
        "platformergame": "A browser-based platformer game built with JavaScript and HTML5 Canvas. Experience classic gaming mechanics with smooth animations, multiple levels, and responsive controls.",
        "math visuals": "Interactive mathematical visualizations including differentials, integrals, Fourier transforms, and Laplace transforms. Perfect for learning and exploring mathematical concepts.",
        "minigames": "A collection of classic web-based games including Snake, Tic-Tac-Toe, Chess, and more. Perfect for quick entertainment and casual gaming.",
        "drinking simulator": "A fun party simulation game with interactive elements and themed music. Perfect for social gatherings and entertainment with friends.",
        "tree website": "An interactive visualization of trees and nature with beautiful biome styling. Experience different environmental themes and natural landscapes.",
        "voice to text": "Real-time speech recognition tool that converts your voice to text with enhanced accuracy. Perfect for transcription, note-taking, and accessibility.",
        "derivitives course": "Comprehensive course materials for learning derivatives and calculus. Includes formula sheets, problem sets, and interactive examples."
    }
    
    folder_lower = folder_name.lower()
    if folder_lower in descriptions:
        return descriptions[folder_lower]
    
    # Generate generic description based on detected type
    if 'game' in folder_lower:
        return f"An interactive {title} experience built with modern web technologies."
    elif 'math' in folder_lower or 'course' in folder_lower:
        return f"Educational materials and interactive tools for {title}."
    elif 'visual' in folder_lower:
        return f"Interactive visualizations and graphics for {title}."
    
    return f"Explore {title} with interactive features and modern design."

def get_project_tags(folder_name: str, files: List[str]) -> List[str]:
    """Determine tags based on project type and contents"""
    tags = []
    folder_lower = folder_name.lower()
    
    # Check folder name for hints
    if 'game' in folder_lower:
        tags.append("Game")
    if 'math' in folder_lower or 'derivative' in folder_lower or 'calculus' in folder_lower:
        tags.append("Math")
    if 'visual' in folder_lower:
        tags.append("Visualization")
    if 'course' in folder_lower or 'learn' in folder_lower:
        tags.append("Education")
    if 'voice' in folder_lower or 'speech' in folder_lower:
        tags.append("Voice")
    if 'nature' in folder_lower or 'tree' in folder_lower:
        tags.append("Nature")
    if 'party' in folder_lower or 'drink' in folder_lower:
        tags.append("Party")
    
    # Check for interactive content
    has_js = any(f.endswith('.js') for f in files)
    has_html = any(f.endswith('.html') for f in files)
    if has_js and has_html and "Interactive" not in tags:
        tags.append("Interactive")
    
    # Special cases
    if 'mini' in folder_lower and "Collection" not in tags:
        tags.append("Collection")
    
    # Ensure at least one tag
    if not tags:
        tags.append("Interactive")
    
    return tags

def get_categories(tags: List[str]) -> List[str]:
    """Determine categories based on tags"""
    categories = []
    
    for tag in tags:
        tag_lower = tag.lower()
        if 'game' in tag_lower and 'game' not in categories:
            categories.append('game')
        elif 'visual' in tag_lower and 'visualization' not in categories:
            categories.append('visualization')
        elif 'education' in tag_lower and 'education' not in categories:
            categories.append('education')
    
    # Ensure interactive is added if appropriate
    if 'Interactive' in tags and 'interactive' not in categories:
        categories.append('interactive')
    
    # Default category
    if not categories:
        categories.append('interactive')
    
    return categories

def get_technologies(folder_name: str, files: List[str]) -> List[str]:
    """Determine technologies used based on files present"""
    tech = []
    folder_lower = folder_name.lower()
    
    # Check file extensions
    has_js = any(f.endswith('.js') for f in files)
    has_py = any(f.endswith('.py') for f in files)
    has_canvas = any('canvas' in f.lower() or 'game' in f.lower() for f in files if f.endswith('.js'))
    
    # Special cases based on project
    if 'platformer' in folder_lower and has_canvas:
        tech.extend(['HTML5 Canvas', 'JavaScript'])
    elif 'math' in folder_lower:
        tech.extend(['Mathematics', 'Interactive'])
    elif 'voice' in folder_lower:
        tech.extend(['Speech', 'AI'])
    elif 'game' in folder_lower:
        if 'mini' in folder_lower:
            tech.extend(['Multiple Games', 'Web'])
        else:
            tech.extend(['JavaScript', 'HTML5'])
    elif 'party' in folder_lower or 'drink' in folder_lower:
        tech.extend(['Party Game', 'Audio'])
    elif 'tree' in folder_lower or 'nature' in folder_lower:
        tech.extend(['Nature', 'Interactive'])
    elif 'course' in folder_lower:
        tech.extend(['Education', 'Mathematics'])
    else:
        if has_js:
            tech.append('JavaScript')
        if has_py:
            tech.append('Python')
        if not tech:
            tech.append('Web')
    
    return tech

def find_main_file(project_path: Path, project_name: str, config: Dict) -> Optional[str]:
    """Find the main HTML file for a project"""
    # Check if project has a configured main file
    project_settings = config.get("project_settings", {})
    if project_name in project_settings:
        configured_main = project_settings[project_name].get("main_file")
        if configured_main and (project_path / configured_main).exists():
            return configured_main
    
    # Priority order for main files
    priority_files = ['index.html', 'Main.html', 'main.html', 'home.html']
    
    for filename in priority_files:
        if (project_path / filename).exists():
            return filename
    
    # If no standard main file, look for any HTML file
    html_files = list(project_path.glob('*.html'))
    if html_files:
        # Filter out common non-main files
        exclude_patterns = ['test', 'debug', 'admin', 'login', 'setup', 'accounts']
        for html_file in html_files:
            name_lower = html_file.stem.lower()
            if not any(pattern in name_lower for pattern in exclude_patterns):
                return html_file.name
    
    return None

def load_project_config() -> Dict:
    """Load project configuration from JSON file"""
    if PROJECT_CONFIG.exists():
        with open(PROJECT_CONFIG, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"project_settings": {}, "default_settings": {"needs_main": True, "subproject_threshold": 2}}

def should_create_main_html(project_path: Path, project_name: str, config: Dict) -> bool:
    """Determine if a project needs a Main.html file based on configuration"""
    project_settings = config.get("project_settings", {})
    default_settings = config.get("default_settings", {})
    
    # Check if project has specific configuration
    if project_name in project_settings:
        needs_main = project_settings[project_name].get("needs_main", default_settings.get("needs_main", True))
        if not needs_main:
            print(f"  Config: {project_name} set to not need Main.html")
            return False
    
    # If needs_main is True or not specified, check for multiple subprojects
    return has_multiple_subprojects(project_path, config)

def has_multiple_subprojects(project_path: Path, config: Dict) -> bool:
    """Check if a project has multiple HTML files that could be subprojects"""
    html_files = list(project_path.glob('*.html'))
    
    # Get exclude patterns from config or use defaults
    default_settings = config.get("default_settings", {})
    exclude_patterns = default_settings.get("exclude_patterns", 
                                           ['test', 'debug', 'admin', 'login', 'setup', 'accounts', 'index', 'main'])
    threshold = default_settings.get("subproject_threshold", 2)
    
    subproject_files = []
    for html_file in html_files:
        name_lower = html_file.stem.lower()
        if not any(pattern in name_lower for pattern in exclude_patterns):
            subproject_files.append(html_file)
    
    return len(subproject_files) > threshold  # More than threshold non-utility HTML files suggests subprojects

def create_main_html(project_path: Path, project_name: str):
    """Create a Main.html file for projects with multiple subprojects"""
    # Check if Main.html already exists
    main_file = project_path / "Main.html"
    if main_file.exists():
        print(f"  Main.html already exists for {project_name}")
        return
    
    # Find all HTML files that could be subprojects
    html_files = list(project_path.glob('*.html'))
    exclude_patterns = ['test', 'debug', 'admin', 'login', 'setup', 'accounts', 'index', 'main']
    
    subprojects = []
    for html_file in html_files:
        name_lower = html_file.stem.lower()
        if not any(pattern in name_lower for pattern in exclude_patterns):
            # Create a nice title from filename
            title = html_file.stem.replace('-', ' ').replace('_', ' ').title()
            subprojects.append({
                'file': html_file.name,
                'title': title,
                'description': f"Explore {title} features and functionality"
            })
    
    if len(subprojects) < 2:
        print(f"  Not enough subprojects for {project_name}, skipping Main.html creation")
        return
    
    # Generate HTML content similar to Math visuals/Main.html
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{project_name} Collection</title>
    <style>
        :root {{
            --primary: #5c7cfa;
            --secondary: #748ffc;
            --text-primary: #2d3436;
            --text-secondary: #636e72;
            --bg-primary: #ffffff;
            --bg-secondary: #f8f9fa;
            --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
            --radius: 12px;
        }}

        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background-color: var(--bg-secondary);
            color: var(--text-primary);
            line-height: 1.6;
        }}

        header {{
            background: var(--bg-primary);
            box-shadow: var(--shadow-md);
            padding: 1.5rem 2rem;
        }}

        .header-content {{
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}

        .logo {{
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary);
        }}

        .back-btn {{
            padding: 0.75rem 1.5rem;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 8px;
            text-decoration: none;
            transition: all 0.3s ease;
        }}

        .back-btn:hover {{
            background: var(--secondary);
        }}

        .main-content {{
            max-width: 1200px;
            margin: 3rem auto;
            padding: 0 2rem;
        }}

        .page-title {{
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }}

        .page-subtitle {{
            color: var(--text-secondary);
            margin-bottom: 3rem;
        }}

        .projects-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 2rem;
        }}

        .project-card {{
            background: var(--bg-primary);
            border-radius: var(--radius);
            padding: 2rem;
            box-shadow: var(--shadow-md);
            transition: transform 0.3s ease;
        }}

        .project-card:hover {{
            transform: translateY(-4px);
        }}

        .project-title {{
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }}

        .project-description {{
            color: var(--text-secondary);
            margin-bottom: 1rem;
        }}

        .project-link {{
            color: var(--primary);
            text-decoration: none;
            font-weight: 500;
        }}

        .project-link:hover {{
            text-decoration: underline;
        }}
    </style>
</head>
<body>
    <header>
        <div class="header-content">
            <div class="logo">{project_name}</div>
            <a href="../../index.html" class="back-btn">Back to Portfolio</a>
        </div>
    </header>

    <main class="main-content">
        <h1 class="page-title">{project_name} Collection</h1>
        <p class="page-subtitle">Explore the different features and components</p>

        <div class="projects-grid">
"""
    
    # Add cards for each subproject
    for subproject in subprojects:
        html_content += f"""
            <div class="project-card">
                <h2 class="project-title">{subproject['title']}</h2>
                <p class="project-description">{subproject['description']}</p>
                <a href="{subproject['file']}" class="project-link">Explore →</a>
            </div>
"""
    
    html_content += """
        </div>
    </main>
</body>
</html>"""
    
    # Write the Main.html file
    main_file.write_text(html_content)
    print(f"  Created Main.html for {project_name}")

def scan_projects() -> List[Dict]:
    """Scan the Projects directory and generate project entries"""
    projects = []
    
    # Load project configuration
    config = load_project_config()
    print(f"Loaded configuration from {PROJECT_CONFIG}\n")
    
    if not PROJECTS_DIR.exists():
        print(f"Projects directory not found: {PROJECTS_DIR}")
        return projects
    
    for folder in PROJECTS_DIR.iterdir():
        if not folder.is_dir():
            continue
        
        if folder.name in EXCLUDE_DIRS or folder.name.startswith('.'):
            continue
        
        print(f"Processing: {folder.name}")
        
        # Get all files in the project
        all_files = []
        for root, dirs, files in os.walk(folder):
            # Skip excluded directories
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for file in files:
                if file not in EXCLUDE_FILES:
                    all_files.append(file)
        
        # Find main file
        main_file = find_main_file(folder, folder.name, config)
        if not main_file:
            print(f"  Warning: No main HTML file found for {folder.name}")
            continue
        
        # Check if project should be displayed
        project_settings = config.get("project_settings", {})
        default_settings = config.get("default_settings", {})
        
        # Check if project is configured to be displayed
        if folder.name in project_settings:
            displayed = project_settings[folder.name].get("displayed", default_settings.get("displayed", True))
        else:
            displayed = default_settings.get("displayed", True)
        
        if not displayed:
            print(f"  Skipping: {folder.name} (displayed=false in config)")
            continue
        
        # Check if we need to create Main.html based on configuration
        if should_create_main_html(folder, folder.name, config) and main_file != 'Main.html':
            create_main_html(folder, get_project_title(folder.name))
            main_file = 'Main.html'  # Use the newly created Main.html
        
        # Generate project data
        project_id = create_project_id(folder.name)
        title = get_project_title(folder.name)
        description = get_project_description(folder.name, title)
        tags = get_project_tags(folder.name, all_files)
        categories = get_categories(tags)
        technologies = get_technologies(folder.name, all_files)
        icon = get_icon(title, tags)
        
        # Determine if featured (you can customize this logic)
        featured = folder.name.lower() in ['platformergame']
        
        project_entry = {
            "id": project_id,
            "title": title,
            "description": description,
            "tags": tags,
            "categories": categories,
            "path": f"Projects/{folder.name}/{main_file}",
            "featured": featured,
            "technologies": technologies,
            "icon": icon
        }
        
        projects.append(project_entry)
        print(f"  Added: {title} ({main_file})")
    
    return projects

def update_projects_json(projects: List[Dict]):
    """Update the projects.json file"""
    data = {"projects": projects}
    
    # Write with nice formatting
    with open(PROJECTS_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\nUpdated {PROJECTS_JSON} with {len(projects)} projects")

def main():
    """Main function"""
    print("=== Project Manager Script ===\n")
    print(f"Base Directory: {BASE_DIR}")
    print(f"Projects Directory: {PROJECTS_DIR}")
    print(f"Output: {PROJECTS_JSON}\n")
    
    # Scan projects
    projects = scan_projects()
    
    if not projects:
        print("\nNo projects found!")
        return
    
    # Sort projects (featured first, then alphabetically)
    projects.sort(key=lambda x: (not x['featured'], x['title']))
    
    # Update projects.json
    update_projects_json(projects)
    
    print("\n=== Complete ===")
    print(f"Successfully processed {len(projects)} projects")

if __name__ == "__main__":
    main()