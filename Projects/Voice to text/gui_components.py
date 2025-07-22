#!/usr/bin/env python3
"""
Shared GUI components for Voice to Text applications.
Provides reusable UI elements and base classes for Tkinter interfaces.
"""

import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import threading
import logging
from abc import ABC, abstractmethod
from datetime import datetime
from config import GUI_CONFIG, FEATURES

logger = logging.getLogger(__name__)


class BaseVoiceApp(ABC, tk.Tk):
    """Base class for voice recording applications with common GUI elements."""
    
    def __init__(self, title=None):
        super().__init__()
        
        # Window setup
        self.title(title or GUI_CONFIG['window_title'])
        self.geometry(GUI_CONFIG['window_size'])
        self.configure(bg=GUI_CONFIG['colors']['bg'])
        
        # Make window resizable
        self.columnconfigure(0, weight=1)
        self.rowconfigure(0, weight=1)
        
        # State management
        self.is_recording = False
        self.is_processing = False
        
        # Create main frame
        self.main_frame = ttk.Frame(self, padding="20")
        self.main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Initialize UI components
        self._create_widgets()
        self._setup_styles()
        
        # Handle window close
        self.protocol("WM_DELETE_WINDOW", self.on_closing)
        
    def _setup_styles(self):
        """Configure ttk styles for modern appearance."""
        style = ttk.Style()
        
        # Configure button styles
        style.configure(
            "Recording.TButton",
            background=GUI_CONFIG['colors']['recording'],
            foreground="white",
            borderwidth=0,
            focuscolor='none'
        )
        
        style.configure(
            "Success.TButton",
            background=GUI_CONFIG['colors']['success'],
            foreground="white",
            borderwidth=0,
            focuscolor='none'
        )
        
        style.configure(
            "Primary.TButton",
            background=GUI_CONFIG['colors']['listening'],
            foreground="white",
            borderwidth=0,
            focuscolor='none'
        )
    
    def _create_widgets(self):
        """Create common UI widgets."""
        # Title label
        self.title_label = tk.Label(
            self.main_frame,
            text=self.get_title_text(),
            font=(GUI_CONFIG['font_family'], GUI_CONFIG['font_size_large'], "bold"),
            bg=GUI_CONFIG['colors']['bg'],
            fg=GUI_CONFIG['colors']['text']
        )
        self.title_label.grid(row=0, column=0, pady=(0, 20))
        
        # Status frame
        self.status_frame = ttk.Frame(self.main_frame)
        self.status_frame.grid(row=1, column=0, pady=10, sticky=(tk.W, tk.E))
        
        # Status label
        self.status_label = tk.Label(
            self.status_frame,
            text="Ready",
            font=(GUI_CONFIG['font_family'], GUI_CONFIG['font_size_medium']),
            bg=GUI_CONFIG['colors']['bg'],
            fg=GUI_CONFIG['colors']['text']
        )
        self.status_label.pack()
        
        # Progress bar (hidden by default)
        self.progress_bar = ttk.Progressbar(
            self.status_frame,
            mode='indeterminate',
            length=200
        )
        
        # Control frame
        self.control_frame = ttk.Frame(self.main_frame)
        self.control_frame.grid(row=2, column=0, pady=20)
        
        # Create mode-specific controls
        self._create_controls()
        
        # Output frame
        self.output_frame = ttk.LabelFrame(
            self.main_frame,
            text="Transcription Output",
            padding="10"
        )
        self.output_frame.grid(row=3, column=0, pady=20, sticky=(tk.W, tk.E, tk.N, tk.S))
        self.main_frame.rowconfigure(3, weight=1)
        
        # Output text area
        self.output_text = scrolledtext.ScrolledText(
            self.output_frame,
            wrap=tk.WORD,
            width=60,
            height=10,
            font=(GUI_CONFIG['font_family'], GUI_CONFIG['font_size_small'])
        )
        self.output_text.pack(fill=tk.BOTH, expand=True)
        
        # Info frame
        self.info_frame = ttk.Frame(self.main_frame)
        self.info_frame.grid(row=4, column=0, pady=10)
        
        self._create_info_widgets()
    
    @abstractmethod
    def get_title_text(self):
        """Return the title text for the application."""
        pass
    
    @abstractmethod
    def _create_controls(self):
        """Create mode-specific control widgets."""
        pass
    
    @abstractmethod
    def _create_info_widgets(self):
        """Create mode-specific info widgets."""
        pass
    
    def update_status(self, message, status_type="info"):
        """Update status label with color coding."""
        def _update():
            self.status_label.config(text=message)
            
            # Color based on status type
            if status_type == "error":
                color = GUI_CONFIG['colors']['error']
            elif status_type == "success":
                color = GUI_CONFIG['colors']['success']
            elif status_type == "recording":
                color = GUI_CONFIG['colors']['recording']
            elif status_type == "listening":
                color = GUI_CONFIG['colors']['listening']
            else:
                color = GUI_CONFIG['colors']['text']
            
            self.status_label.config(fg=color)
        
        # Thread-safe update
        self.after(0, _update)
    
    def show_progress(self, show=True):
        """Show or hide progress bar."""
        def _update():
            if show:
                self.progress_bar.pack(pady=5)
                self.progress_bar.start(10)
            else:
                self.progress_bar.stop()
                self.progress_bar.pack_forget()
        
        self.after(0, _update)
    
    def append_output(self, text, timestamp=True):
        """Append text to output area."""
        def _update():
            if timestamp and FEATURES['append_timestamp']:
                time_str = datetime.now().strftime("%H:%M:%S")
                text_with_time = f"[{time_str}] {text}"
            else:
                text_with_time = text
            
            self.output_text.insert(tk.END, text_with_time + "\n")
            self.output_text.see(tk.END)
        
        self.after(0, _update)
    
    def clear_output(self):
        """Clear output text area."""
        def _update():
            self.output_text.delete('1.0', tk.END)
        
        self.after(0, _update)
    
    def set_recording_state(self, is_recording):
        """Update UI to reflect recording state."""
        self.is_recording = is_recording
        self.update_ui_state()
    
    def set_processing_state(self, is_processing):
        """Update UI to reflect processing state."""
        self.is_processing = is_processing
        self.show_progress(is_processing)
        self.update_ui_state()
    
    @abstractmethod
    def update_ui_state(self):
        """Update UI elements based on current state."""
        pass
    
    def show_error(self, title, message):
        """Show error dialog."""
        messagebox.showerror(title, message)
    
    def show_info(self, title, message):
        """Show info dialog."""
        messagebox.showinfo(title, message)
    
    def ask_yes_no(self, title, message):
        """Show yes/no dialog."""
        return messagebox.askyesno(title, message)
    
    def on_closing(self):
        """Handle window close event."""
        if self.is_recording:
            if self.ask_yes_no("Confirm Exit", "Recording in progress. Exit anyway?"):
                self.cleanup()
                self.destroy()
        else:
            self.cleanup()
            self.destroy()
    
    @abstractmethod
    def cleanup(self):
        """Cleanup resources before closing."""
        pass


class RecordButton(ttk.Button):
    """Specialized button for recording control."""
    
    def __init__(self, parent, start_command, stop_command, **kwargs):
        super().__init__(parent, **kwargs)
        
        self.start_command = start_command
        self.stop_command = stop_command
        self.is_recording = False
        
        # Initial state
        self.configure(
            text="Start Recording",
            command=self._toggle_recording,
            style="Success.TButton"
        )
    
    def _toggle_recording(self):
        """Toggle between start and stop recording."""
        if self.is_recording:
            self.configure(
                text="Start Recording",
                style="Success.TButton"
            )
            self.stop_command()
        else:
            self.configure(
                text="Stop Recording",
                style="Recording.TButton"
            )
            self.start_command()
        
        self.is_recording = not self.is_recording
    
    def set_recording_state(self, is_recording):
        """Set recording state externally."""
        self.is_recording = is_recording
        if is_recording:
            self.configure(
                text="Stop Recording",
                style="Recording.TButton"
            )
        else:
            self.configure(
                text="Start Recording",
                style="Success.TButton"
            )
    
    def enable(self):
        """Enable the button."""
        self.configure(state='normal')
    
    def disable(self):
        """Disable the button."""
        self.configure(state='disabled')


class StatusIndicator(tk.Canvas):
    """Visual status indicator widget."""
    
    def __init__(self, parent, size=20):
        super().__init__(parent, width=size, height=size, highlightthickness=0)
        self.size = size
        
        # Create circle
        self.indicator = self.create_oval(
            2, 2, size-2, size-2,
            fill="gray",
            outline=""
        )
    
    def set_status(self, status):
        """Set indicator status color."""
        colors = {
            'ready': 'gray',
            'listening': GUI_CONFIG['colors']['listening'],
            'recording': GUI_CONFIG['colors']['recording'],
            'processing': 'orange',
            'success': GUI_CONFIG['colors']['success'],
            'error': GUI_CONFIG['colors']['error']
        }
        
        color = colors.get(status, 'gray')
        self.itemconfig(self.indicator, fill=color)
        
        # Add pulsing animation for certain states
        if status in ['listening', 'recording', 'processing']:
            self._start_pulse()
        else:
            self._stop_pulse()
    
    def _start_pulse(self):
        """Start pulsing animation."""
        # Simple pulse effect (can be enhanced)
        pass
    
    def _stop_pulse(self):
        """Stop pulsing animation."""
        pass


def create_tooltip(widget, text):
    """Create a tooltip for a widget."""
    def on_enter(event):
        tooltip = tk.Toplevel()
        tooltip.wm_overrideredirect(True)
        tooltip.wm_geometry(f"+{event.x_root+10}+{event.y_root+10}")
        
        label = tk.Label(
            tooltip,
            text=text,
            background="lightyellow",
            relief="solid",
            borderwidth=1,
            font=(GUI_CONFIG['font_family'], GUI_CONFIG['font_size_small'])
        )
        label.pack()
        
        widget.tooltip = tooltip
    
    def on_leave(event):
        if hasattr(widget, 'tooltip'):
            widget.tooltip.destroy()
            del widget.tooltip
    
    widget.bind("<Enter>", on_enter)
    widget.bind("<Leave>", on_leave)