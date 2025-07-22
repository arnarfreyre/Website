#!/usr/bin/env python3
"""
Centralized configuration for Voice to Text application.
All shared settings and constants are defined here.
"""

import os
from pathlib import Path

# Audio Settings
AUDIO_CONFIG = {
    'sample_rate': 44100,
    'channels': 1,
    'chunk_size': 1024,
    'audio_format': 'int16',
}

# Speech Recognition Settings
SPEECH_CONFIG = {
    'pause_threshold': 0.5,
    'energy_threshold': 4000,
    'dynamic_energy_threshold': True,
    'dynamic_energy_adjustment_ratio': 1.5,
    'ambient_noise_duration': 0.5,
    'timeout': 2,  # Seconds to wait for speech
    'phrase_time_limit': None,  # No limit on phrase length
}

# Voice Commands
VOICE_COMMANDS = {
    'start': ['start recording', 'begin recording', 'record', 'start', 'byrja upptöku', 'byrja að taka upp'],
    'stop': ['stop recording', 'end recording', 'stop', 'finish', 'stöðva upptöku', 'hætta upptöku'],
    'save': ['save transcript', 'save text', 'save', 'vista texta', 'vista ritun'],
    'end_conversation': ['end conversation', 'finish conversation', 'close conversation', 'loka samtal'],
    'clear': ['clear transcript', 'clear text', 'clear', 'hreinsa texta', 'eyða texta'],
    'exit': ['exit', 'quit', 'close', 'goodbye'],
}

# File Paths
OUTPUT_DIR = Path(__file__).parent
OUTPUT_FILE = OUTPUT_DIR / 'user_message.txt'
TEMP_AUDIO_DIR = OUTPUT_DIR / 'temp_audio'

# Ensure temp directory exists
TEMP_AUDIO_DIR.mkdir(exist_ok=True)

# GUI Settings
GUI_CONFIG = {
    'window_title': 'Voice to Text Recorder',
    'window_size': '600x400',
    'font_family': 'Arial',
    'font_size_large': 16,
    'font_size_medium': 14,
    'font_size_small': 10,
    'colors': {
        'bg': '#f0f0f0',
        'listening': '#2196F3',
        'recording': '#ff4444',
        'success': '#4CAF50',
        'error': '#f44336',
        'text': '#333333',
    }
}

# TTS Settings
TTS_CONFIG = {
    'enabled': True,
    'rate': 180,  # Words per minute
    'volume': 0.9,
    'voice_index': None,  # Use default voice
}

# Security Settings
SECURITY_CONFIG = {
    'max_file_size': 100 * 1024 * 1024,  # 100MB
    'max_recording_duration': 300,  # 5 minutes
    'allowed_output_extensions': ['.txt'],
    'sanitize_filenames': True,
}

# Performance Settings
PERFORMANCE_CONFIG = {
    'max_memory_usage': 500 * 1024 * 1024,  # 500MB
    'thread_pool_size': 4,
    'cache_enabled': True,
    'cache_size': 10,  # Number of recent transcriptions to cache
}

# Logging Settings
LOGGING_CONFIG = {
    'level': 'INFO',
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'file': None,  # Set to a path to enable file logging
}

# Application Modes
class AppMode:
    """Application operation modes."""
    MANUAL = 'manual'
    VOICE_CONTROLLED = 'voice_controlled'
    
    @classmethod
    def all_modes(cls):
        return [cls.MANUAL, cls.VOICE_CONTROLLED]

# Feature Flags
FEATURES = {
    'auto_save': True,
    'append_timestamp': True,
    'show_waveform': False,  # Future feature
    'cloud_sync': False,  # Future feature
}

def get_output_filename(timestamp=None):
    """Generate output filename with optional timestamp."""
    if FEATURES['append_timestamp'] and timestamp:
        return OUTPUT_DIR / f'transcription_{timestamp}.txt'
    return OUTPUT_FILE

def validate_config():
    """Validate configuration settings."""
    errors = []
    
    # Check audio settings
    if AUDIO_CONFIG['sample_rate'] not in [8000, 16000, 44100, 48000]:
        errors.append(f"Invalid sample rate: {AUDIO_CONFIG['sample_rate']}")
    
    # Check paths
    if not OUTPUT_DIR.exists():
        errors.append(f"Output directory does not exist: {OUTPUT_DIR}")
    
    # Check security limits
    if SECURITY_CONFIG['max_recording_duration'] > 3600:
        errors.append("Max recording duration exceeds 1 hour")
    
    return errors

# Run validation on import
config_errors = validate_config()
if config_errors:
    import warnings
    for error in config_errors:
        warnings.warn(f"Configuration warning: {error}")