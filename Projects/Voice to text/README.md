# Voice to Text Application

A unified Python application that converts speech to text with both manual and voice-controlled modes. Also includes a web-based interface.

## Project Structure

```
voice_to_text/
├── voice_to_text.py      # Main unified Python application
├── config.py             # Centralized configuration
├── audio_utils.py        # Audio recording and speech recognition
├── gui_components.py     # Shared GUI components
├── requirements.txt      # Python dependencies
├── requirements_macos.txt # Additional macOS dependencies
├── index.html            # Web interface
├── script.js             # Web application logic
├── styles.css            # Web styling
└── user_message.txt      # Output file for transcriptions
```

## Features

- **Dual Mode Operation**: Choose between manual control (button/spacebar) or voice commands
- **Unified Codebase**: Single application supporting both modes, reducing code duplication
- **Modern Architecture**: Modular design with shared components
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Web Interface**: Alternative browser-based interface
- **Security Features**: Input validation, safe file operations, resource limits
- **Performance Optimized**: Efficient memory usage, proper thread management

## Setup

### Python Application

1. Install Python 3.8+ (3.12+ recommended)

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. For macOS users with voice control:
   ```bash
   pip install -r requirements_macos.txt
   ```

### Web Application

Simply open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge).

## Quick Start

### Python Application

Run with mode selection dialog:
```bash
python voice_to_text.py
```

Or specify mode directly:
```bash
# Manual mode (button/spacebar control)
python voice_to_text.py --mode manual

# Voice-controlled mode
python voice_to_text.py --mode voice
```

### Voice-Controlled Mode

#### English Commands:
- Say "start recording" to begin
- Say "stop recording" to end and transcribe
- Say "save transcript" to save current conversation
- Say "clear transcript" to clear the text
- Say "exit" or "quit" to close the application

#### Icelandic Commands:
- Say "byrja upptöku" or "byrja að taka upp" to start recording
- Say "stöðva upptöku" or "hætta upptöku" to stop recording
- Say "vista texta" or "vista ritun" to save transcript
- Say "hreinsa texta" or "eyða texta" to clear transcript

### Manual Mode
- Click the button or press spacebar to start/stop recording
- Visual feedback shows recording status

## Usage

1. **Launch the application** using one of the methods above

2. **Select your preferred mode** (if not specified via command line)

3. **For Manual Mode**:
   - Click "Start Recording" or press spacebar
   - Speak your message
   - Click "Stop Recording" or press spacebar again
   - View transcription in the output area

4. **For Voice Mode**:
   - Wait for "Voice control ready" message
   - Say "start recording"
   - Speak your message
   - Say "stop recording"
   - Transcription appears automatically

5. **Transcriptions are saved** to `user_message.txt` with timestamps

## Configuration

All settings can be customized in `config.py`:

- **Audio Settings**: Sample rate, channels, recording limits
- **Speech Recognition**: Thresholds, timeouts, language
- **GUI Settings**: Colors, fonts, window size
- **Voice Commands**: Customizable trigger phrases
- **Security**: File size limits, allowed extensions
- **Performance**: Memory limits, thread pool size

## Requirements

### Python Application
- Python 3.8+ (3.12+ recommended)
- Internet connection (for Google Speech Recognition)
- Microphone access
- Tkinter (usually included with Python)

### Web Application
- Modern web browser with WebRTC support
- Microphone permissions
- Internet connection

## Troubleshooting

### PyAudio Installation Issues

For Python 3.12+ on macOS:
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PortAudio
brew install portaudio

# Install PyAudio
pip install pyaudio
```

Alternative: The application uses `sounddevice` as a fallback, which doesn't require PyAudio.

### Microphone Access

- **macOS**: System Preferences → Security & Privacy → Microphone
- **Windows**: Settings → Privacy → Microphone
- **Linux**: Check PulseAudio/ALSA settings

### Voice Commands Not Working

1. Check microphone permissions
2. Ensure `pyttsx3` is installed for voice feedback
3. Try manual mode as a fallback
4. Check console output for error messages

## Architecture

The refactored application follows a modular architecture:

- **config.py**: Centralized configuration management
- **audio_utils.py**: Audio recording and speech recognition logic
- **gui_components.py**: Reusable GUI components and base classes
- **voice_to_text.py**: Main application with mode selection

This design eliminates code duplication and improves maintainability.

## Security Features

- Input validation for all user inputs
- Safe file operations with path validation
- Resource limits to prevent DoS
- Sanitized filenames and paths
- Maximum recording duration limits

## Performance Optimizations

- Efficient memory usage with streaming audio
- Proper thread management and cleanup
- Resource pooling for repeated operations
- Automatic garbage collection
- Optimized audio processing pipeline

## Contributing

Feel free to submit issues and pull requests. The modular architecture makes it easy to add new features or improve existing ones.

## License

This project is available under the MIT License.