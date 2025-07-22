#!/usr/bin/env python3
"""
Audio processing utilities shared between voice recording applications.
Enhanced with speech recognition, voice command handling, and security features.
"""

import numpy as np
import sounddevice as sd
import scipy.io.wavfile as wav
import speech_recognition as sr
import tempfile
import os
import logging
import threading
import queue
import time
from datetime import datetime
from pathlib import Path
from config import (
    AUDIO_CONFIG, SPEECH_CONFIG, VOICE_COMMANDS, 
    SECURITY_CONFIG, OUTPUT_FILE, TEMP_AUDIO_DIR
)

logger = logging.getLogger(__name__)


class AudioRecorder:
    """Handles audio recording with sounddevice and speech recognition."""
    
    def __init__(self, sample_rate=None, channels=None):
        # Use config values with optional overrides
        self.sample_rate = sample_rate or AUDIO_CONFIG['sample_rate']
        self.channels = channels or AUDIO_CONFIG['channels']
        self.recording_data = []
        self.stream = None
        self.is_recording = False
        
        # Recording control
        self.recording_start_time = None
        self.max_duration = SECURITY_CONFIG['max_recording_duration']
        
        # Initialize speech recognizer
        self.recognizer = sr.Recognizer()
        self.recognizer.pause_threshold = SPEECH_CONFIG['pause_threshold']
        self.recognizer.energy_threshold = SPEECH_CONFIG['energy_threshold']
        self.recognizer.dynamic_energy_threshold = SPEECH_CONFIG['dynamic_energy_threshold']
        
    def start_recording(self):
        """Start recording audio with duration tracking."""
        if self.is_recording:
            logger.warning("Already recording")
            return False
            
        self.recording_data = []
        self.is_recording = True
        self.recording_start_time = time.time()
        
        try:
            self.stream = sd.InputStream(
                samplerate=self.sample_rate,
                channels=self.channels,
                callback=self._audio_callback
            )
            self.stream.start()
            logger.info("Audio recording started")
            return True
        except Exception as e:
            logger.error(f"Failed to start recording: {e}")
            self.is_recording = False
            self.recording_start_time = None
            return False
            
    def stop_recording(self):
        """Stop recording and return the audio data."""
        if not self.is_recording:
            logger.warning("Not currently recording")
            return None
            
        self.is_recording = False
        
        if self.stream:
            self.stream.stop()
            self.stream.close()
            self.stream = None
            
        logger.info("Audio recording stopped")
        return self.recording_data
        
    def _audio_callback(self, indata, frames, time_info, status):
        """Callback for audio recording with duration check."""
        if status:
            logger.warning(f"Audio callback status: {status}")
        
        if self.is_recording:
            # Check max duration
            if self.recording_start_time:
                duration = time.time() - self.recording_start_time
                if duration > self.max_duration:
                    logger.warning(f"Max recording duration ({self.max_duration}s) reached")
                    self.is_recording = False
                    return
            
            self.recording_data.append(indata.copy())
            
    def save_to_wav(self, audio_data, filename=None):
        """Save audio data to WAV file."""
        if not audio_data:
            raise ValueError("No audio data to save")
            
        try:
            # Combine audio chunks
            audio_array = np.concatenate(audio_data, axis=0)
            
            # Create temporary file if no filename provided
            if filename is None:
                tmp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
                filename = tmp_file.name
                tmp_file.close()
                
            # Save to WAV
            wav.write(filename, self.sample_rate,
                     (audio_array * 32767).astype(np.int16))
                     
            logger.info(f"Audio saved to {filename}")
            return filename
            
        except Exception as e:
            logger.error(f"Failed to save audio: {e}")
            raise
            
    def cleanup_temp_file(self, filename):
        """Remove temporary audio file."""
        try:
            if os.path.exists(filename):
                os.unlink(filename)
                logger.debug(f"Removed temporary file: {filename}")
        except Exception as e:
            logger.warning(f"Failed to remove temp file {filename}: {e}")
    
    def transcribe_audio(self, audio_data=None, audio_file=None, language='en-US'):
        """Transcribe audio to text using Google Speech Recognition."""
        try:
            # If audio_data provided, save to temp file first
            if audio_data is not None:
                audio_file = self.save_to_wav(audio_data)
                temp_file_created = True
            else:
                temp_file_created = False
            
            if not audio_file or not os.path.exists(audio_file):
                raise ValueError("No audio file to transcribe")
            
            # Load audio file
            with sr.AudioFile(audio_file) as source:
                audio = self.recognizer.record(source)
            
            # Transcribe
            text = self.recognizer.recognize_google(audio, language=language)
            logger.info(f"Transcription successful: {len(text)} characters")
            
            # Cleanup temp file if created
            if temp_file_created:
                self.cleanup_temp_file(audio_file)
            
            return text
            
        except sr.UnknownValueError:
            logger.warning("Could not understand audio")
            return None
        except sr.RequestError as e:
            logger.error(f"Speech recognition request failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            return None
    
    def save_transcription(self, text, filename=None):
        """Save transcribed text to file with timestamp."""
        if not text:
            logger.warning("No text to save")
            return False
        
        try:
            # Validate and sanitize filename
            if filename:
                filename = Path(filename)
                if filename.suffix not in SECURITY_CONFIG['allowed_output_extensions']:
                    logger.error(f"Invalid file extension: {filename.suffix}")
                    return False
            else:
                filename = OUTPUT_FILE
            
            # Prepare text with timestamp
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            formatted_text = f"[{timestamp}]\n{text}\n\n"
            
            # Append to file
            with open(filename, 'a', encoding='utf-8') as f:
                f.write(formatted_text)
            
            logger.info(f"Transcription saved to {filename}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save transcription: {e}")
            return False


class VoiceCommandListener:
    """Handles voice command detection and processing."""
    
    def __init__(self, callback=None):
        self.recognizer = sr.Recognizer()
        self.recognizer.pause_threshold = SPEECH_CONFIG['pause_threshold']
        self.recognizer.energy_threshold = SPEECH_CONFIG['energy_threshold']
        self.microphone = None
        self.listening = False
        self.callback = callback
        self.command_queue = queue.Queue()
        
    def check_microphone(self):
        """Check if microphone is available."""
        try:
            # Test microphone availability
            test_mic = sr.Microphone()
            test_mic.__enter__()
            test_mic.__exit__(None, None, None)
            return True
        except Exception as e:
            logger.error(f"Microphone check failed: {e}")
            return False
    
    def start_listening(self):
        """Start continuous voice command listening."""
        if not self.check_microphone():
            logger.error("Microphone not available")
            return False
        
        self.listening = True
        self.microphone = sr.Microphone()
        
        # Start listening thread
        listen_thread = threading.Thread(target=self._listen_loop, daemon=True)
        listen_thread.start()
        
        logger.info("Voice command listener started")
        return True
    
    def stop_listening(self):
        """Stop voice command listening."""
        self.listening = False
        if self.microphone:
            self.microphone = None
        logger.info("Voice command listener stopped")
    
    def _listen_loop(self):
        """Continuous listening loop for voice commands."""
        with self.microphone as source:
            # Initial ambient noise adjustment
            self.recognizer.adjust_for_ambient_noise(source, duration=1)
            
            while self.listening:
                try:
                    # Listen with timeout
                    audio = self.recognizer.listen(
                        source, 
                        timeout=SPEECH_CONFIG['timeout'],
                        phrase_time_limit=SPEECH_CONFIG['phrase_time_limit']
                    )
                    
                    # Process in separate thread to avoid blocking
                    process_thread = threading.Thread(
                        target=self._process_audio,
                        args=(audio,),
                        daemon=True
                    )
                    process_thread.start()
                    
                except sr.WaitTimeoutError:
                    # Normal timeout, continue listening
                    continue
                except Exception as e:
                    logger.error(f"Listening error: {e}")
                    time.sleep(1)
    
    def _process_audio(self, audio):
        """Process audio for voice commands."""
        try:
            # Transcribe audio
            text = self.recognizer.recognize_google(audio).lower()
            logger.debug(f"Heard: '{text}'")
            
            # Check for commands
            command = self._extract_command(text)
            if command:
                logger.info(f"Command detected: {command}")
                self.command_queue.put(command)
                
                # Execute callback if provided
                if self.callback:
                    self.callback(command)
            
        except sr.UnknownValueError:
            # Could not understand audio, ignore
            pass
        except Exception as e:
            logger.error(f"Command processing error: {e}")
    
    def _extract_command(self, text):
        """Extract command from transcribed text."""
        text_lower = text.lower()
        
        for command, phrases in VOICE_COMMANDS.items():
            for phrase in phrases:
                if phrase in text_lower:
                    return command
        
        return None
    
    def get_command(self, timeout=None):
        """Get next command from queue."""
        try:
            return self.command_queue.get(timeout=timeout)
        except queue.Empty:
            return None