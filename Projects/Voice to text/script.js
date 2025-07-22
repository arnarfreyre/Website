// Voice to Text Application - JavaScript
class VoiceToText {
    constructor() {
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
        this.voiceCommandMode = true;  // Changed to true for default ON
        this.lastCommand = '';
        this.commandTimeout = null;

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
    }

    checkBrowserSupport() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Your browser does not support speech recognition. Please use Chrome, Edge, or Safari.');
            this.recordBtn.disabled = true;
            this.statusText.textContent = 'Speech recognition not supported';
        }
    }

    initializeSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = this.languageSelect.value;

            // Handle results
            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    
                    if (event.results[i].isFinal) {
                        // Check for voice commands in the transcript
                        const commandResult = this.checkForVoiceCommand(transcript);
                        
                        if (commandResult.isCommand && this.voiceCommandMode) {
                            // Process the command but don't add it to the transcript
                            this.processVoiceCommand(commandResult.command);
                            // Don't add command text to transcript
                        } else {
                            // Only add non-command text to the transcript
                            finalTranscript += transcript + ' ';
                        }
                    } else {
                        interimTranscript += transcript;
                    }
                }

                // Update the transcription display
                if (finalTranscript) {
                    this.fullTranscript += finalTranscript;
                    this.updateTranscriptionDisplay();
                }

                // Show interim results
                if (interimTranscript) {
                    this.interimText.textContent = interimTranscript;
                } else {
                    this.interimText.textContent = '';
                }
            };

            // Handle errors
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                // Don't show error if we're stopping recognition intentionally
                if (event.error !== 'aborted') {
                    this.handleRecognitionError(event.error);
                }
            };

            // Handle end
            this.recognition.onend = () => {
                if (this.isRecording) {
                    // Restart recognition if still recording
                    this.recognition.start();
                }
            };
        }
    }

    initializeAudioVisualizer() {
        const canvas = this.audioVisualizer;
        const canvasContext = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = 100;

        // Handle window resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
        });
    }

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

    async startRecording() {
        try {
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Stop command recognition during recording (main recognition handles commands)
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
            }
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please ensure you have granted permission.');
        }
    }

    stopRecording() {
        // Stop recognition
        if (this.recognition) {
            this.recognition.stop();
        }
        
        // Stop audio context
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        // Stop animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Update UI
        this.isRecording = false;
        this.statusIndicator.classList.remove('recording');
        // Check if voice commands are active
        const lang = this.languageSelect.value;
        if (this.voiceCommandMode) {
            this.statusText.textContent = lang === 'is-IS' ? 'Hlusta eftir raddskipunum...' : 'Listening for voice commands...';
        } else {
            this.statusText.textContent = lang === 'is-IS' ? 'Smelltu til að byrja upptöku' : 'Click to start recording';
        }
        this.recordBtn.classList.remove('recording');
        this.recordBtn.querySelector('.btn-text').textContent = 'Start Recording';
        
        // Enable save button if there's content
        if (this.fullTranscript.trim()) {
            this.saveBtn.disabled = false;
        }
        
        // Hide audio visualizer
        this.audioVisualizer.classList.remove('active');
        
        // Clear interim text
        this.interimText.textContent = '';
        
        // Restart command recognition if voice commands are enabled
        if (this.voiceCommandMode && this.commandRecognition) {
            setTimeout(() => {
                if (this.voiceCommandMode && !this.isRecording) {
                    this.commandRecognition.start();
                }
            }, 500);
        }
    }

    drawAudioVisualizer() {
        if (!this.isRecording) return;
        
        const canvas = this.audioVisualizer;
        const canvasContext = canvas.getContext('2d');
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            this.animationId = requestAnimationFrame(draw);
            
            this.analyser.getByteFrequencyData(dataArray);
            
            canvasContext.fillStyle = 'rgba(255, 255, 255, 0.1)';
            canvasContext.fillRect(0, 0, canvas.width, canvas.height);
            
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
                
                // Create gradient effect
                const gradient = canvasContext.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
                gradient.addColorStop(0, '#64B5F6');
                gradient.addColorStop(0.5, '#2196F3');
                gradient.addColorStop(1, '#1565C0');
                
                canvasContext.fillStyle = gradient;
                canvasContext.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        };
        
        draw();
    }

    updateTranscriptionDisplay() {
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
    }

    handleRecognitionError(error) {
        let message = 'An error occurred with speech recognition.';
        
        switch (error) {
            case 'no-speech':
                message = 'No speech was detected. Please try again.';
                break;
            case 'audio-capture':
                message = 'No microphone was found. Please check your microphone.';
                break;
            case 'not-allowed':
                message = 'Microphone permission was denied. Please allow access.';
                break;
            case 'network':
                message = 'Network error. Please check your internet connection.';
                break;
        }
        
        this.statusText.textContent = message;
        setTimeout(() => {
            if (!this.isRecording) {
                this.statusText.textContent = 'Click to start recording';
            }
        }, 3000);
    }

    saveTranscript() {
        if (!this.fullTranscript.trim()) {
            alert('No transcript to save.');
            return;
        }
        
        // Create blob
        const timestamp = new Date().toLocaleString();
        const content = `Voice to Text Transcript\n` +
                       `Date: ${timestamp}\n` +
                       `Language: ${this.languageSelect.options[this.languageSelect.selectedIndex].text}\n` +
                       `${'='.repeat(50)}\n\n` +
                       `${this.fullTranscript}`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript_${new Date().getTime()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        // Show success message
        this.statusText.textContent = 'Transcript saved successfully!';
        setTimeout(() => {
            this.statusText.textContent = 'Click to start recording';
        }, 3000);
    }

    clearTranscript() {
        if (this.fullTranscript.trim() && !confirm('Are you sure you want to clear the transcript?')) {
            return;
        }
        
        this.fullTranscript = '';
        this.transcriptionText.innerHTML = '<p class="placeholder">Your words will appear here...</p>';
        this.interimText.textContent = '';
        this.saveBtn.disabled = true;
    }

    // Voice Command Methods
    toggleVoiceCommands(enabled) {
        this.voiceCommandMode = enabled;
        
        if (enabled) {
            this.startCommandListening();
            this.voiceCommandsInfo.style.display = 'block';
            document.body.classList.add('voice-command-active');
            
            // Language-specific activation message
            const lang = this.languageSelect.value;
            if (lang === 'is-IS') {
                this.speak('Raddskipanir virkar. Segðu byrja upptöku til að byrja.');
            } else {
                this.speak('Voice commands activated. Say start recording to begin.');
            }
            
            // Update status text if not recording
            if (!this.isRecording) {
                this.statusText.textContent = lang === 'is-IS' ? 'Hlusta eftir raddskipunum...' : 'Listening for voice commands...';
            }
            
            // Update voice commands display
            this.updateVoiceCommandsDisplay(lang);
        } else {
            this.stopCommandListening();
            this.voiceCommandsInfo.style.display = 'none';
            document.body.classList.remove('voice-command-active');
            // Reset status text if not recording
            if (!this.isRecording) {
                const lang = this.languageSelect.value;
                this.statusText.textContent = lang === 'is-IS' ? 'Smelltu til að byrja upptöku' : 'Click to start recording';
            }
        }
    }

    startCommandListening() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            alert('Voice commands are not supported in your browser.');
            this.voiceCommandToggle.checked = false;
            return;
        }

        this.commandRecognition = new SpeechRecognition();
        this.commandRecognition.continuous = true;
        this.commandRecognition.interimResults = true;
        this.commandRecognition.lang = this.languageSelect.value;

        this.commandRecognition.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    const transcript = event.results[i][0].transcript.toLowerCase();
                    this.processVoiceCommand(transcript);
                }
            }
        };

        this.commandRecognition.onerror = (event) => {
            console.error('Command recognition error:', event.error);
            // Don't process aborted errors (happens when we stop it intentionally)
            if (event.error === 'aborted') {
                return;
            }
            if (event.error === 'not-allowed') {
                this.toggleVoiceCommands(false);
                this.voiceCommandToggle.checked = false;
                alert('Microphone permission denied for voice commands.');
            }
        };

        this.commandRecognition.onend = () => {
            if (this.voiceCommandMode) {
                // Always restart command listening if voice commands are enabled
                setTimeout(() => {
                    if (this.voiceCommandMode && this.commandRecognition) {
                        this.commandRecognition.start();
                    }
                }, 100);
            }
        };

        // Add visual indicator
        this.statusIndicator.classList.add('voice-command-listening');
        this.commandRecognition.start();
    }

    stopCommandListening() {
        if (this.commandRecognition) {
            this.commandRecognition.stop();
            this.commandRecognition = null;
        }
        this.statusIndicator.classList.remove('voice-command-listening');
    }

    checkForVoiceCommand(transcript) {
        const lowerTranscript = transcript.toLowerCase().trim();
        const lang = this.languageSelect.value;
        
        let isCommand = false;
        let command = lowerTranscript;
        let shouldStop = false;
        
        // Define command patterns based on language
        if (lang === 'is-IS') {
            // Icelandic commands - expanded to include ALL commands
            const icelandicCommands = {
                'byrja upptöku': 'start',
                'byrja að taka upp': 'start',
                'stöðva upptöku': 'stop',
                'hætta upptöku': 'stop',
                'vista texta': 'save',
                'vista ritun': 'save',
                'hreinsa texta': 'clear',
                'eyða texta': 'clear'
            };
            
            // Check if transcript contains any command
            for (const cmd in icelandicCommands) {
                if (lowerTranscript.includes(cmd)) {
                    isCommand = true;
                    command = lowerTranscript;
                    shouldStop = icelandicCommands[cmd] === 'stop';
                    break;
                }
            }
        } else {
            // English commands - expanded to include ALL commands
            const englishCommands = {
                'start recording': 'start',
                'begin recording': 'start',
                'stop recording': 'stop',
                'end recording': 'stop',
                'finish recording': 'stop',
                'save transcript': 'save',
                'save text': 'save',
                'clear transcript': 'clear',
                'clear text': 'clear',
                'remove transcript': 'clear'
            };
            
            // Check if transcript contains any command
            for (const cmd in englishCommands) {
                if (lowerTranscript.includes(cmd)) {
                    isCommand = true;
                    command = lowerTranscript;
                    shouldStop = englishCommands[cmd] === 'stop';
                    break;
                }
            }
        }
        
        return { isCommand, command, shouldStop };
    }

    processVoiceCommand(transcript) {
        // Clear any existing command timeout
        if (this.commandTimeout) {
            clearTimeout(this.commandTimeout);
        }

        // Prevent processing the same command multiple times
        if (transcript === this.lastCommand) {
            return;
        }

        this.lastCommand = transcript;
        
        // Reset lastCommand after a delay
        this.commandTimeout = setTimeout(() => {
            this.lastCommand = '';
        }, 2000);

        const lang = this.languageSelect.value;
        
        // Check for commands based on language
        if (lang === 'is-IS') {
            // Icelandic commands
            if ((transcript.includes('byrja upptöku') || transcript.includes('byrja að taka upp')) && !this.isRecording) {
                this.speak('Byrja upptöku');
                this.startRecording();
            } else if ((transcript.includes('stöðva upptöku') || transcript.includes('hætta upptöku')) && this.isRecording) {
                this.speak('Stöðva upptöku');
                this.stopRecording();
            } else if ((transcript.includes('vista texta') || transcript.includes('vista ritun')) && this.fullTranscript.trim()) {
                this.speak('Vista texta');
                this.saveTranscript();
            } else if (transcript.includes('hreinsa texta') || transcript.includes('eyða texta')) {
                this.speak('Hreinsa texta');
                this.clearTranscript();
            }
        } else {
            // English commands (default)
            if (transcript.includes('start recording') && !this.isRecording) {
                this.speak('Starting recording');
                this.startRecording();
            } else if (transcript.includes('stop recording') && this.isRecording) {
                this.speak('Stopping recording');
                this.stopRecording();
            } else if (transcript.includes('save transcript') && this.fullTranscript.trim()) {
                this.speak('Saving transcript');
                this.saveTranscript();
            } else if (transcript.includes('clear transcript')) {
                this.speak('Clearing transcript');
                this.clearTranscript();
            }
        }
    }

    speak(text) {
        // Use the Web Speech API for voice feedback
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.volume = 0.8;
            
            // Use the same language as recognition
            utterance.lang = this.languageSelect.value;
            
            window.speechSynthesis.speak(utterance);
        }
    }

    updateVoiceCommandsDisplay(lang) {
        const englishCommands = document.querySelector('.commands-english');
        const icelandicCommands = document.querySelector('.commands-icelandic');
        
        if (englishCommands && icelandicCommands) {
            if (lang === 'is-IS') {
                englishCommands.style.display = 'none';
                icelandicCommands.style.display = 'block';
            } else {
                englishCommands.style.display = 'block';
                icelandicCommands.style.display = 'none';
            }
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VoiceToText();
});