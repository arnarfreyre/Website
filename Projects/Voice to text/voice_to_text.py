"""
Unified Voice to Text Application
Supports both manual and voice-controlled recording modes.

Usage:
    python voice_to_text.py [--mode manual|voice]
    
If no mode is specified, a selection dialog will be shown.
"""

import argparse
import sys
import logging
import threading
import time
import json
from datetime import datetime
from pathlib import Path

# Check for tkinter availability
try:
    import tkinter as tk
except ImportError:
    print("Error: tkinter is not available. Please install python3-tk package.")
    print("  Ubuntu/Debian: sudo apt-get install python3-tk")
    print("  macOS: tkinter should be included with Python")
    print("  Windows: tkinter should be included with Python")
    sys.exit(1)

# Fix for Python 3.12+ distutils issue
try:
    import setuptools
except ImportError:
    pass

# Import TTS support
try:
    import pyttsx3
    TTS_AVAILABLE = True
except ImportError:
    TTS_AVAILABLE = False
    print("Warning: Text-to-speech not available. Install pyttsx3 for voice feedback.")

# Local imports
from config import (
    AppMode, LOGGING_CONFIG, TTS_CONFIG, GUI_CONFIG,
    FEATURES, OUTPUT_FILE, OUTPUT_DIR
)
from audio_utils import AudioRecorder, VoiceCommandListener
from gui_components import (
    BaseVoiceApp, RecordButton, StatusIndicator, 
    create_tooltip
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOGGING_CONFIG['level']),
    format=LOGGING_CONFIG['format']
)
logger = logging.getLogger(__name__)


class TTSEngine:
    """Text-to-speech engine wrapper."""
    
    def __init__(self):
        self.enabled = TTS_CONFIG['enabled'] and TTS_AVAILABLE
        if self.enabled:
            try:
                self.engine = pyttsx3.init()
                self.engine.setProperty('rate', TTS_CONFIG['rate'])
                self.engine.setProperty('volume', TTS_CONFIG['volume'])
                
                # Set voice if specified
                if TTS_CONFIG['voice_index'] is not None:
                    voices = self.engine.getProperty('voices')
                    if 0 <= TTS_CONFIG['voice_index'] < len(voices):
                        self.engine.setProperty('voice', voices[TTS_CONFIG['voice_index']].id)
            except Exception as e:
                logger.error(f"Failed to initialize TTS: {e}")
                self.enabled = False
    
    def speak(self, text):
        """Speak the given text."""
        if self.enabled:
            try:
                self.engine.say(text)
                self.engine.runAndWait()
            except Exception as e:
                logger.error(f"TTS error: {e}")


class VoiceToTextApp(BaseVoiceApp):
    """Main application supporting both manual and voice-controlled modes."""
    
    def __init__(self, mode=AppMode.MANUAL):
        self.mode = mode
        self.recorder = AudioRecorder()
        self.tts = TTSEngine()
        self.voice_listener = None
        self.recording_thread = None
        self.current_transcript = []  # Store current conversation transcript
        
        # Initialize parent
        super().__init__()
        
        # Start voice listener if in voice mode
        if self.mode == AppMode.VOICE_CONTROLLED:
            self.start_voice_listener()
            self.tts.speak("Voice control ready. Say 'start recording' to begin.")
    
    def get_title_text(self):
        """Return the title text based on mode."""
        mode_text = "Voice Controlled" if self.mode == AppMode.VOICE_CONTROLLED else "Manual"
        return f"Voice to Text Recorder - {mode_text} Mode"
    
    def _create_controls(self):
        """Create mode-specific control widgets."""
        if self.mode == AppMode.MANUAL:
            # Manual mode: Single record button
            self.record_button = RecordButton(
                self.control_frame,
                start_command=self.start_recording,
                stop_command=self.stop_recording
            )
            self.record_button.pack(pady=10)
            
            # Add keyboard shortcut hint
            hint_label = tk.Label(
                self.control_frame,
                text="Press Space to start/stop recording",
                font=(GUI_CONFIG['font_family'], GUI_CONFIG['font_size_small']),
                fg="gray"
            )
            hint_label.pack()
            
            # Bind spacebar
            self.bind('<space>', lambda e: self.record_button.invoke())
            
        else:
            # Voice controlled mode: Status indicator and manual fallback
            status_frame = tk.Frame(self.control_frame)
            status_frame.pack(pady=10)
            
            self.status_indicator = StatusIndicator(status_frame)
            self.status_indicator.pack(side=tk.LEFT, padx=5)
            
            status_text = tk.Label(
                status_frame,
                text="Listening for commands...",
                font=(GUI_CONFIG['font_family'], GUI_CONFIG['font_size_medium'])
            )
            status_text.pack(side=tk.LEFT)
            
            # Manual fallback buttons
            fallback_frame = tk.Frame(self.control_frame)
            fallback_frame.pack(pady=20)
            
            tk.Label(
                fallback_frame,
                text="Manual Controls:",
                font=(GUI_CONFIG['font_family'], GUI_CONFIG['font_size_small']),
                fg="gray"
            ).pack()
            
            button_frame = tk.Frame(fallback_frame)
            button_frame.pack(pady=5)
            
            self.manual_start_btn = tk.Button(
                button_frame,
                text="Start Recording",
                command=self.start_recording,
                bg=GUI_CONFIG['colors']['success'],
                fg="white",
                padx=20,
                pady=10
            )
            self.manual_start_btn.pack(side=tk.LEFT, padx=5)
            
            self.manual_stop_btn = tk.Button(
                button_frame,
                text="Stop Recording",
                command=self.stop_recording,
                bg=GUI_CONFIG['colors']['recording'],
                fg="white",
                padx=20,
                pady=10,
                state='disabled'
            )
            self.manual_stop_btn.pack(side=tk.LEFT, padx=5)
    
    def _create_info_widgets(self):
        """Create mode-specific info widgets."""
        if self.mode == AppMode.VOICE_CONTROLLED:
            # Voice commands info
            commands_text = """Voice Commands:
• "Start recording" - Begin recording
• "Stop recording" - End recording and transcribe
• "Save transcript" - Save current conversation as JSON
• "End conversation" - Save transcript and start new conversation
• "Clear transcript" - Clear current transcript without saving
• "Exit" or "Quit" - Close application"""
            
            info_label = tk.Label(
                self.info_frame,
                text=commands_text,
                font=(GUI_CONFIG['font_family'], GUI_CONFIG['font_size_small']),
                fg="gray",
                justify=tk.LEFT
            )
            info_label.pack()
        else:
            # Manual mode info
            info_text = "Click the button or press Space to start/stop recording"
            info_label = tk.Label(
                self.info_frame,
                text=info_text,
                font=(GUI_CONFIG['font_family'], GUI_CONFIG['font_size_small']),
                fg="gray"
            )
            info_label.pack()
        
        # Output file info
        output_info = tk.Label(
            self.info_frame,
            text=f"Auto-save: {OUTPUT_FILE}\nJSON transcripts: {OUTPUT_DIR}/transcript_*.json",
            font=(GUI_CONFIG['font_family'], GUI_CONFIG['font_size_small'] - 2),
            fg="gray",
            justify=tk.LEFT
        )
        output_info.pack(pady=(5, 0))
        create_tooltip(output_info, f"Directory: {str(OUTPUT_DIR.absolute())}")
    
    def start_voice_listener(self):
        """Start the voice command listener."""
        self.voice_listener = VoiceCommandListener(callback=self.handle_voice_command)
        
        if not self.voice_listener.start_listening():
            self.update_status("Microphone not available - using manual mode", "error")
            self.show_error(
                "Microphone Error",
                "Could not access microphone. Voice commands disabled.\n"
                "Please use manual controls instead."
            )
            if hasattr(self, 'status_indicator'):
                self.status_indicator.set_status('error')
    
    def handle_voice_command(self, command):
        """Handle voice commands."""
        logger.info(f"Voice command received: {command}")
        
        if command == 'start' and not self.is_recording:
            self.tts.speak("Starting recording")
            self.after(0, self.start_recording)
            
        elif command == 'stop' and self.is_recording:
            self.tts.speak("Stopping recording")
            self.after(0, self.stop_recording)
            
        elif command == 'save':
            self.tts.speak("Saving transcript")
            self.after(0, self.save_current_transcript)
            
        elif command == 'end_conversation':
            self.tts.speak("Ending conversation and saving transcript")
            self.after(0, self.end_conversation)
            
        elif command == 'clear':
            self.tts.speak("Clearing transcript")
            self.after(0, self.clear_transcript)
            
        elif command == 'exit':
            self.tts.speak("Goodbye")
            self.after(0, self.on_closing)
    
    def start_recording(self):
        """Start audio recording."""
        if self.is_recording:
            logger.warning("Already recording")
            return
        
        # Start recording in separate thread
        self.recording_thread = threading.Thread(target=self._recording_worker)
        self.recording_thread.start()
    
    def _recording_worker(self):
        """Worker thread for recording."""
        try:
            # Update UI
            self.set_recording_state(True)
            self.update_status("Recording...", "recording")
            self.append_output("Recording started...")
            
            # Start recording
            if self.recorder.start_recording():
                logger.info("Recording started successfully")
            else:
                raise Exception("Failed to start recording")
                
        except Exception as e:
            logger.error(f"Recording error: {e}")
            self.update_status(f"Recording error: {e}", "error")
            self.set_recording_state(False)
    
    def stop_recording(self):
        """Stop recording and transcribe."""
        if not self.is_recording:
            logger.warning("Not currently recording")
            return
        
        # Stop recording
        self.set_recording_state(False)
        self.update_status("Processing...", "processing")
        self.set_processing_state(True)
        
        # Process in separate thread
        process_thread = threading.Thread(target=self._process_recording)
        process_thread.start()
    
    def _process_recording(self):
        """Process the recorded audio."""
        try:
            # Stop recording
            audio_data = self.recorder.stop_recording()
            
            if not audio_data:
                raise Exception("No audio data recorded")
            
            self.append_output("Recording stopped. Transcribing...")
            
            # Transcribe audio
            text = self.recorder.transcribe_audio(audio_data)
            
            if text:
                # Display transcription
                self.append_output(f"Transcription: {text}")
                
                # Add to current transcript
                self.current_transcript.append({
                    'timestamp': datetime.now().isoformat(),
                    'text': text
                })
                
                # Save to file
                if FEATURES['auto_save']:
                    if self.recorder.save_transcription(text):
                        self.append_output(f"Saved to {OUTPUT_FILE}")
                        self.update_status("Transcription saved successfully", "success")
                    else:
                        self.update_status("Failed to save transcription", "error")
                
                # Speak result if voice mode
                if self.mode == AppMode.VOICE_CONTROLLED and self.tts.enabled:
                    self.tts.speak("Transcription complete")
            else:
                self.append_output("Could not understand audio")
                self.update_status("Could not understand audio", "error")
                
                if self.mode == AppMode.VOICE_CONTROLLED and self.tts.enabled:
                    self.tts.speak("Could not understand audio")
                    
        except Exception as e:
            logger.error(f"Processing error: {e}")
            self.update_status(f"Error: {e}", "error")
            self.append_output(f"Error: {e}")
            
        finally:
            self.set_processing_state(False)
    
    def update_ui_state(self):
        """Update UI elements based on current state."""
        if self.mode == AppMode.MANUAL:
            # Update record button state
            if hasattr(self, 'record_button'):
                self.record_button.set_recording_state(self.is_recording)
                self.record_button.enable() if not self.is_processing else self.record_button.disable()
        else:
            # Update status indicator
            if hasattr(self, 'status_indicator'):
                if self.is_recording:
                    self.status_indicator.set_status('recording')
                elif self.is_processing:
                    self.status_indicator.set_status('processing')
                else:
                    self.status_indicator.set_status('listening')
            
            # Update manual buttons
            if hasattr(self, 'manual_start_btn'):
                self.manual_start_btn.config(
                    state='disabled' if self.is_recording or self.is_processing else 'normal'
                )
                self.manual_stop_btn.config(
                    state='normal' if self.is_recording else 'disabled'
                )
    
    def save_current_transcript(self):
        """Save the current conversation transcript as JSON."""
        if not self.current_transcript:
            self.update_status("No transcript to save", "error")
            self.append_output("No transcript to save")
            return
        
        try:
            # Generate filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = OUTPUT_DIR / f"transcript_{timestamp}.json"
            
            # Prepare transcript data
            transcript_data = {
                'conversation_start': self.current_transcript[0]['timestamp'] if self.current_transcript else None,
                'conversation_end': datetime.now().isoformat(),
                'total_recordings': len(self.current_transcript),
                'mode': self.mode,
                'transcripts': self.current_transcript
            }
            
            # Save as JSON
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(transcript_data, f, ensure_ascii=False, indent=2)
            
            self.append_output(f"Transcript saved to {filename}")
            self.update_status("Transcript saved successfully", "success")
            logger.info(f"Transcript saved to {filename}")
            
        except Exception as e:
            logger.error(f"Failed to save transcript: {e}")
            self.update_status(f"Failed to save transcript: {e}", "error")
            self.append_output(f"Error saving transcript: {e}")
    
    def end_conversation(self):
        """End the current conversation and save transcript."""
        # Save current transcript
        self.save_current_transcript()
        
        # Clear the transcript
        self.current_transcript = []
        
        # Update UI
        self.append_output("Conversation ended")
        self.update_status("Conversation ended and saved", "success")
        
        # Speak if voice mode
        if self.mode == AppMode.VOICE_CONTROLLED and self.tts.enabled:
            self.tts.speak("Conversation ended and transcript saved")
    
    def clear_transcript(self):
        """Clear the current transcript without saving."""
        self.current_transcript = []
        self.append_output("Transcript cleared")
        self.update_status("Transcript cleared", "success")
        
        # Clear output display
        if hasattr(self, 'output_text'):
            self.output_text.delete(1.0, tk.END)
    
    def cleanup(self):
        """Cleanup resources before closing."""
        # Stop recording if active
        if self.is_recording:
            self.recorder.stop_recording()
        
        # Stop voice listener
        if self.voice_listener:
            self.voice_listener.stop_listening()
        
        logger.info("Application cleanup complete")


def select_mode():
    """Show mode selection dialog."""
    import tkinter.messagebox as mb
    
    root = tk.Tk()
    root.withdraw()
    
    result = mb.askyesnocancel(
        "Select Mode",
        "Choose recording mode:\n\n"
        "Yes - Voice Controlled Mode (requires microphone)\n"
        "No - Manual Mode (button/spacebar control)\n"
        "Cancel - Exit"
    )
    
    root.destroy()
    
    if result is True:
        return AppMode.VOICE_CONTROLLED
    elif result is False:
        return AppMode.MANUAL
    else:
        return None


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Voice to Text Recorder with manual and voice-controlled modes"
    )
    parser.add_argument(
        '--mode',
        choices=['manual', 'voice'],
        help='Recording mode (default: show selection dialog)'
    )
    
    args = parser.parse_args()
    
    # Determine mode
    if args.mode == 'manual':
        mode = AppMode.MANUAL
    elif args.mode == 'voice':
        mode = AppMode.VOICE_CONTROLLED
    else:
        # Show selection dialog
        mode = select_mode()
        if mode is None:
            print("Mode selection cancelled")
            return
    
    # Create and run application
    try:
        app = VoiceToTextApp(mode=mode)
        logger.info(f"Starting Voice to Text application in {mode} mode")
        app.mainloop()
    except Exception as e:
        logger.error(f"Application error: {e}")
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()