#!/bin/bash

# Voice Recorder Setup Script for macOS
# This script installs all necessary dependencies for voice_controlled_recorder.py

echo "Voice Recorder macOS Setup"
echo "========================="

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed. Please install Python 3.8 or later."
    exit 1
fi

# Display Python version
echo "Python version: $(python3 --version)"

# Check if Homebrew is installed (needed for portaudio)
if ! command -v brew &> /dev/null; then
    echo "Warning: Homebrew is not installed. Some audio features may not work."
    echo "Install Homebrew from https://brew.sh for better audio support."
else
    # Install portaudio for better microphone support
    echo "Installing portaudio via Homebrew..."
    brew install portaudio
fi

# Create virtual environment (recommended)
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install macOS-specific requirements
echo "Installing macOS-specific dependencies..."
pip install -r requirements_macos.txt

# Additional setup for PyAudio (if portaudio is installed)
if command -v brew &> /dev/null && brew list portaudio &> /dev/null; then
    echo "Installing PyAudio with portaudio support..."
    pip install pyaudio
fi

echo ""
echo "Setup complete!"
echo ""
echo "To run the voice recorder:"
echo "1. Activate the virtual environment: source venv/bin/activate"
echo "2. Run the application: python3 voice_controlled_recorder.py"
echo ""
echo "Note: On first run, macOS may ask for microphone permissions."