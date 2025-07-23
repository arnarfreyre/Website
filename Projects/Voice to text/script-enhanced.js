// Voice to Text Application - Enhanced with Debugging
class VoiceToText {
    constructor() {
        // Add debug mode
        this.debugMode = true; // Set to true for debugging
        this.log('Initializing Voice to Text application...');
        
        // Check HTTPS
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            console.error('🚨 WARNING: Web Speech API requires HTTPS. Current protocol:', window.location.protocol);
            alert('⚠️ This application requires HTTPS to work properly. Speech recognition will not function over HTTP.');
        }
        
        // Initialize DOM elements
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.recordBtn = document.getElementById('recordBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.transcriptionText = document.getElementById('transcriptionText');
        this.interimText = document.getElementById('interimText');
        this.languageSelect = document.getElementById('languageSelect');
        this.audioVisualizer = document.getElementById('audioVisualizer');
        this.micIcon = document.getElementById('micIcon');
        this.voiceCommandToggle = document.getElementById('voiceCommandToggle');
        this.voiceCommandsInfo = document.getElementById('voiceCommandsInfo');

        // Initialize state
        this.isRecording = false;
        this.recognition = null;
        this.commandRecognition = null;
        this.fullTranscript = '';
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.animationId = null;
        this.voiceCommandMode = true;
        this.lastCommand = '';
        this.commandTimeout = null;
        this.transcriptionCount = 0; // Debug counter

        // Check browser support
        this.checkBrowserSupport();
        
        // Initialize speech recognition
        this.initializeSpeechRecognition();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize audio visualizer
        this.initializeAudioVisualizer();
        
        // Enable voice commands by default
        this.voiceCommandToggle.checked = true;
        this.toggleVoiceCommands(true);
        
        // Add debug info panel
        this.addDebugPanel();
    }
    
    log(...args) {
        if (this.debugMode) {
            console.log('[VoiceToText]', ...args);
        }
    }
    
    addDebugPanel() {
        if (!this.debugMode) return;
        
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debugPanel';
        debugPanel.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: #0f0;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            max-width: 300px;
            border-radius: 5px;
            z-index: 9999;
        `;
        debugPanel.innerHTML = `
            <div>🔍 Debug Panel</div>
            <div>Protocol: ${window.location.protocol}</div>
            <div>Host: ${window.location.hostname}</div>
            <div>Speech API: ${('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) ? '✅' : '❌'}</div>
            <div id="debugStatus">Status: Idle</div>
            <div id="debugTranscriptions">Transcriptions: 0</div>
            <div id="debugErrors">Errors: 0</div>
        `;
        document.body.appendChild(debugPanel);
        
        this.debugStatus = document.getElementById('debugStatus');
        this.debugTranscriptions = document.getElementById('debugTranscriptions');
        this.debugErrors = document.getElementById('debugErrors');
        this.errorCount = 0;
    }
    
    updateDebugStatus(status) {
        if (this.debugStatus) {
            this.debugStatus.textContent = `Status: ${status}`;
        }
    }

    checkBrowserSupport() {
        this.log('Checking browser support...');
        
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.log('❌ Speech recognition not supported');
            alert('Your browser does not support speech recognition. Please use Chrome, Edge, or Safari.');
            this.recordBtn.disabled = true;
            this.statusText.textContent = 'Speech recognition not supported';
            this.updateDebugStatus('Not Supported');
        } else {
            this.log('✅ Speech recognition supported');
            this.updateDebugStatus('Ready');
        }
    }

    initializeSpeechRecognition() {
        this.log('Initializing speech recognition...');
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = this.languageSelect.value;
            
            this.log('Speech recognition initialized with language:', this.recognition.lang);

            // Handle results
            this.recognition.onresult = (event) => {
                this.log('Speech recognition result event:', event);
                let interimTranscript = '';
                let finalTranscript = '';

                // Process NEW final results only (to avoid duplicates)
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        const transcript = event.results[i][0].transcript;
                        this.log('Final transcript:', transcript);
                        
                        // Check for voice commands in the transcript
                        const commandResult = this.checkForVoiceCommand(transcript);
                        
                        if (commandResult.isCommand && this.voiceCommandMode) {
                            this.log('Voice command detected:', commandResult.command);
                            // Process the command but don't add it to the transcript
                            this.processVoiceCommand(commandResult.command);
                        } else {
                            // Only add non-command text to the transcript
                            finalTranscript += transcript + ' ';
                            this.transcriptionCount++;
                            if (this.debugTranscriptions) {
                                this.debugTranscriptions.textContent = `Transcriptions: ${this.transcriptionCount}`;
                            }
                        }
                    }
                }

                // Collect ALL interim results for live display
                for (let i = 0; i < event.results.length; i++) {
                    if (!event.results[i].isFinal) {
                        interimTranscript += event.results[i][0].transcript + ' ';
                    }
                }

                // Update the transcription display
                if (finalTranscript) {
                    this.log('Adding to full transcript:', finalTranscript);
                    this.fullTranscript += finalTranscript;
                    this.updateTranscriptionDisplay();
                }

                // Show interim results
                this.interimText.textContent = interimTranscript.trim();
                if (interimTranscript) {
                    this.log('Interim transcript:', interimTranscript);
                }
            };

            // Handle errors
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.errorCount++;
                if (this.debugErrors) {
                    this.debugErrors.textContent = `Errors: ${this.errorCount}`;
                }
                this.updateDebugStatus(`Error: ${event.error}`);
                
                // Don't show error if we're stopping recognition intentionally
                if (event.error !== 'aborted') {
                    this.handleRecognitionError(event.error);
                }
            };

            // Handle start
            this.recognition.onstart = () => {
                this.log('Speech recognition started');
                this.updateDebugStatus('Recognition Active');
            };

            // Handle end
            this.recognition.onend = () => {
                this.log('Speech recognition ended');
                this.updateDebugStatus('Recognition Stopped');
                
                if (this.isRecording) {
                    this.log('Restarting recognition (still recording)');
                    // Restart recognition if still recording
                    this.recognition.start();
                }
            };
        }
    }

    async startRecording() {
        this.log('Starting recording...');
        try {
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.log('Microphone access granted');
            
            // Stop command recognition during recording
            if (this.voiceCommandMode && this.commandRecognition) {
                this.commandRecognition.stop();
            }
            
            // Start audio context for visualization
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            this.analyser.fftSize = 256;
            
            // Update UI
            this.isRecording = true;
            this.statusIndicator.classList.add('recording');
            this.statusText.textContent = 'Recording... Speak now';
            this.recordBtn.classList.add('recording');
            this.recordBtn.querySelector('.btn-text').textContent = 'Stop Recording';
            this.saveBtn.disabled = true;
            
            // Show audio visualizer
            this.audioVisualizer.classList.add('active');
            this.drawAudioVisualizer();
            
            // Start speech recognition
            if (this.recognition) {
                this.recognition.start();
                this.log('Speech recognition started successfully');
            }
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.log('❌ Microphone error:', error.message);
            this.updateDebugStatus('Mic Error');
            alert('Could not access microphone. Please ensure you have granted permission.');
        }
    }

    updateTranscriptionDisplay() {
        this.log('Updating transcription display...');
        const placeholder = this.transcriptionText.querySelector('.placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        // Create paragraphs for better readability
        const paragraphs = this.fullTranscript.trim().split('\n\n');
        this.transcriptionText.innerHTML = paragraphs
            .map(p => `<p>${p}</p>`)
            .join('');
        
        // Scroll to bottom
        this.transcriptionText.scrollTop = this.transcriptionText.scrollHeight;
        
        this.log('Transcription display updated. Total length:', this.fullTranscript.length);
    }

    // ... rest of the methods remain the same as original script.js ...
    // (Include all other methods from the original file)

    setupEventListeners() {
        // Record button click
        this.recordBtn.addEventListener('click', () => {
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        });

        // Status indicator click
        this.statusIndicator.addEventListener('click', () => {
            if (this.isRecording) {
                this.stopRecording();
            } else {
                this.startRecording();
            }
        });

        // Save button click
        this.saveBtn.addEventListener('click', () => {
            this.saveTranscript();
        });

        // Clear button click
        this.clearBtn.addEventListener('click', () => {
            this.clearTranscript();
        });

        // Language change
        this.languageSelect.addEventListener('change', (e) => {
            const newLang = e.target.value;
            if (this.recognition) {
                this.recognition.lang = newLang;
                if (this.isRecording) {
                    this.recognition.stop();
                    setTimeout(() => {
                        this.recognition.start();
                    }, 100);
                }
            }
            // Update command recognition language
            if (this.commandRecognition) {
                this.commandRecognition.lang = newLang;
            }
            // Update voice commands display
            this.updateVoiceCommandsDisplay(newLang);
        });

        // Voice command toggle
        this.voiceCommandToggle.addEventListener('change', (e) => {
            this.toggleVoiceCommands(e.target.checked);
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Voice to Text Application Starting...');
    console.log('📍 Current URL:', window.location.href);
    console.log('🔒 Protocol:', window.location.protocol);
    console.log('🌐 Host:', window.location.hostname);
    
    new VoiceToText();
});