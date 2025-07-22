# Voice Recorder Setup Guide

## Quick Fix for macOS Users

Run the setup script:
```bash
./setup_macos.sh
```

Then activate the virtual environment and run:
```bash
source venv/bin/activate
python3 voice_controlled_recorder.py
```

## Manual Installation

If the setup script doesn't work:

1. Install dependencies:
```bash
pip install -r requirements_macos.txt
```

2. Install Homebrew (if not installed):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

3. Install portaudio:
```bash
brew install portaudio
```

4. Run the application:
```bash
python3 voice_controlled_recorder.py
```

## What Was Fixed

1. **TTS Error**: Added pyobjc dependencies for macOS text-to-speech
2. **distutils Error**: Added setuptools for Python 3.12+ compatibility
3. **Fallback Mode**: Added manual control buttons if voice commands fail

## Troubleshooting

- If voice commands don't work, use the manual "Start Recording" and "Stop Recording" buttons
- Make sure to grant microphone permissions when macOS asks
- The app will save recordings to `user_message.txt` in the same directory