// Modern Eğitim Platformu JavaScript

class EducationPlatform {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.createParticles();
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioBlob = null;
        this.md = window.markdownit();
        this.isRecording = false;
        this.recordingStartTime = null;
        this.recordingTimer = null;
    }

    initializeElements() {
        // HTML Elementleri
        this.surveyContainer = document.getElementById('survey-container');
        this.chatContainer = document.getElementById('chat-container');
        this.preferencesForm = document.getElementById('preferences-form');
        this.questionInput = document.getElementById('question-input');
        this.sendTextButton = document.getElementById('send-text');
        this.startRecordButton = document.getElementById('start-record');
        this.stopRecordButton = document.getElementById('stop-record');
        this.responseArea = document.getElementById('response-area');
        this.listenResponseButton = document.getElementById('listen-response');
        this.audioPlaybackContainer = document.getElementById('audio-playback-container');
        this.audioPlayer = document.getElementById('audio-player');
        this.sendAudioButton = document.getElementById('send-audio');
        
        // Tab Elements
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabPanes = document.querySelectorAll('.tab-pane');
        
        // Evaluation Elements
        this.startEvaluationRecordButton = document.getElementById('start-evaluation-record');
        this.stopEvaluationRecordButton = document.getElementById('stop-evaluation-record');
        this.evaluationAudioPlayer = document.getElementById('evaluation-audio-player');
        this.evaluationAudioPlaybackContainer = document.getElementById('evaluation-audio-playback-container');
        this.sendEvaluationAudioButton = document.getElementById('send-evaluation-audio');
        this.evaluationResponseArea = document.getElementById('evaluation-response-area');
        this.listenEvaluationResponseButton = document.getElementById('listen-evaluation-response');
        this.evaluationRecordingTimer = document.getElementById('evaluation-recording-timer');
        this.evaluationTimerDisplay = document.getElementById('evaluation-timer-display');
        
        // Custom Audio Player Elements
        this.evaluationPlayPauseBtn = document.getElementById('evaluation-play-pause');
        this.evaluationStopBtn = document.getElementById('evaluation-stop');
        this.evaluationProgressFill = document.getElementById('evaluation-progress-fill');
        this.evaluationCurrentTime = document.getElementById('evaluation-current-time');
        this.evaluationDuration = document.getElementById('evaluation-duration');
        this.evaluationMuteBtn = document.getElementById('evaluation-mute');
        this.evaluationVolumeSlider = document.getElementById('evaluation-volume');
        
        // Response Audio Player Elements
        this.responseAudioPlayerContainer = document.getElementById('response-audio-player-container');
        this.responsePlayPauseBtn = document.getElementById('response-play-pause');
        this.responseStopBtn = document.getElementById('response-stop');
        this.responseProgressFill = document.getElementById('response-progress-fill');
        this.responseCurrentTime = document.getElementById('response-current-time');
        this.responseDuration = document.getElementById('response-duration');
        this.responseMuteBtn = document.getElementById('response-mute');
        this.responseVolumeSlider = document.getElementById('response-volume');
        
        // Evaluation Response Audio Player Elements
        this.evaluationResponseAudioPlayerContainer = document.getElementById('evaluation-response-audio-player-container');
        this.evaluationResponsePlayPauseBtn = document.getElementById('evaluation-response-play-pause');
        this.evaluationResponseStopBtn = document.getElementById('evaluation-response-stop');
        this.evaluationResponseProgressFill = document.getElementById('evaluation-response-progress-fill');
        this.evaluationResponseCurrentTime = document.getElementById('evaluation-response-current-time');
        this.evaluationResponseDuration = document.getElementById('evaluation-response-duration');
        this.evaluationResponseMuteBtn = document.getElementById('evaluation-response-mute');
        this.evaluationResponseVolumeSlider = document.getElementById('evaluation-response-volume');
        this.evaluationResponseAudio = null;
    }

    initializeEventListeners() {
        // Form gönderimi
        this.preferencesForm.addEventListener('submit', (e) => this.handlePreferencesSubmit(e));
        
        // Metin gönderme
        this.sendTextButton.addEventListener('click', () => this.handleTextSubmit());
        
        // Ses kaydı
        this.startRecordButton.addEventListener('click', () => this.startRecording());
        this.stopRecordButton.addEventListener('click', () => this.stopRecording());
        this.sendAudioButton.addEventListener('click', () => this.handleAudioSubmit());
        
        // Sesli dinleme
        this.listenResponseButton.addEventListener('click', () => this.handleSpeechSynthesis());
        
        // Enter tuşu ile gönderme
        this.questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleTextSubmit();
            }
        });
        
        // Tab switching
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => this.switchTab(button.dataset.tab));
        });
        
        // Evaluation recording
        this.startEvaluationRecordButton.addEventListener('click', () => this.startEvaluationRecording());
        this.stopEvaluationRecordButton.addEventListener('click', () => this.stopEvaluationRecording());
        this.sendEvaluationAudioButton.addEventListener('click', () => this.handleEvaluationAudioSubmit());
        
        // Evaluation response listening
        this.listenEvaluationResponseButton.addEventListener('click', () => this.handleEvaluationSpeechSynthesis());
        
        // Custom Audio Player Controls
        this.evaluationPlayPauseBtn.addEventListener('click', () => this.toggleEvaluationAudio());
        this.evaluationStopBtn.addEventListener('click', () => this.stopEvaluationAudio());
        this.evaluationMuteBtn.addEventListener('click', () => this.toggleEvaluationMute());
        this.evaluationVolumeSlider.addEventListener('input', (e) => this.setEvaluationVolume(e.target.value));
        this.evaluationProgressFill.addEventListener('click', (e) => this.seekEvaluationAudio(e));
        
        // Response Audio Player Controls
        this.responsePlayPauseBtn.addEventListener('click', () => this.toggleResponseAudio());
        this.responseStopBtn.addEventListener('click', () => this.stopResponseAudio());
        this.responseMuteBtn.addEventListener('click', () => this.toggleResponseMute());
        this.responseVolumeSlider.addEventListener('input', (e) => this.setResponseVolume(e.target.value));
        this.responseProgressFill.addEventListener('click', (e) => this.seekResponseAudio(e));
        
        // Evaluation Response Audio Player Controls
        this.evaluationResponsePlayPauseBtn.addEventListener('click', () => this.toggleEvaluationResponseAudio());
        this.evaluationResponseStopBtn.addEventListener('click', () => this.stopEvaluationResponseAudio());
        this.evaluationResponseMuteBtn.addEventListener('click', () => this.toggleEvaluationResponseMute());
        this.evaluationResponseVolumeSlider.addEventListener('input', (e) => this.setEvaluationResponseVolume(e.target.value));
        this.evaluationResponseProgressFill.addEventListener('click', (e) => this.seekEvaluationResponseAudio(e));
    }

    createParticles() {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles';
        
        for (let i = 0; i < 9; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particlesContainer.appendChild(particle);
        }
        
        document.body.appendChild(particlesContainer);
    }

    showStatusMessage(message, type = 'info') {
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message status-${type}`;
        
        const icon = document.createElement('span');
        icon.innerHTML = this.getStatusIcon(type);
        
        const text = document.createElement('span');
        text.textContent = message;
        
        statusDiv.appendChild(icon);
        statusDiv.appendChild(text);
        
        // Mevcut status mesajlarını temizle
        const existingStatus = document.querySelector('.status-message');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        document.body.appendChild(statusDiv);
        
        // 5 saniye sonra kaldır
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 5000);
    }

    getStatusIcon(type) {
        const icons = {
            success: '✅',
            info: 'ℹ️',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || icons.info;
    }

    async handlePreferencesSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.preferencesForm);
        const preferences = Object.fromEntries(formData.entries());

        // Butonu devre dışı bırak ve yükleniyor durumu göster
        const submitButton = this.preferencesForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-spinner"></span> Ayarlanıyor...';

        try {
            const response = await fetch('/submit-preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferences)
            });

            if (response.ok) {
                this.showStatusMessage('Tercihleriniz başarıyla kaydedildi!', 'success');
                this.animateTransition();
            } else {
                throw new Error('Tercihler gönderilirken bir hata oluştu.');
            }
        } catch (error) {
            this.showStatusMessage(error.message, 'error');
            submitButton.disabled = false;
            submitButton.innerText = 'Öğrenmeye Başla';
        }
    }

    animateTransition() {
        // Animasyonlu geçiş
        this.surveyContainer.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
        this.surveyContainer.style.opacity = '0';
        this.surveyContainer.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            this.surveyContainer.style.display = 'none';
            this.chatContainer.style.display = 'block';
            this.chatContainer.style.opacity = '0';
            this.chatContainer.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                this.chatContainer.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
                this.chatContainer.style.opacity = '1';
                this.chatContainer.style.transform = 'translateY(0)';
            }, 50);
        }, 500);
    }

    async handleTextSubmit() {
        const question = this.questionInput.value.trim();
        if (!question) {
            this.showStatusMessage('Lütfen bir soru yazın.', 'warning');
            return;
        }

        this.setLoadingState(true);
        this.showStatusMessage('Soru gönderiliyor...', 'info');

        try {
            const response = await fetch('/chat-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: question })
            });

            const data = await response.json();
            this.displayResponse(data.response);
            this.showStatusMessage('Yanıt başarıyla alındı!', 'success');
        } catch (error) {
            this.showStatusMessage('Yanıt alınırken bir hata oluştu.', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            this.audioBlob = null;
            this.audioPlaybackContainer.style.display = 'none';

            this.mediaRecorder.ondataavailable = (e) => {
                this.audioChunks.push(e.data);
            };

            this.mediaRecorder.onstop = () => {
                this.audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(this.audioBlob);
                this.audioPlayer.src = audioUrl;
                this.audioPlaybackContainer.style.display = 'block';
                this.showStatusMessage('Ses kaydı tamamlandı!', 'success');
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            this.startRecordingTimer();
            
            this.startRecordButton.disabled = true;
            this.stopRecordButton.disabled = false;
            
            this.showStatusMessage('Ses kaydı başlatıldı...', 'info');
            this.addRecordingIndicator();
            
        } catch (err) {
            this.showStatusMessage('Mikrofon erişimi reddedildi veya bir hata oluştu.', 'error');
            console.error(err);
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.stopRecordingTimer();
            this.removeRecordingIndicator();
            
            this.startRecordButton.disabled = false;
            this.stopRecordButton.disabled = true;
            
            this.showStatusMessage('Ses kaydı durduruldu.', 'info');
        }
    }

    startRecordingTimer() {
        this.recordingTimer = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const displaySeconds = seconds % 60;
            
            const timeString = `${minutes}:${displaySeconds.toString().padStart(2, '0')}`;
            const indicator = document.querySelector('.recording-indicator');
            if (indicator) {
                indicator.querySelector('span:last-child').textContent = `Kayıt: ${timeString}`;
            }
        }, 1000);
    }

    stopRecordingTimer() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
    }

    addRecordingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'recording-indicator';
        indicator.innerHTML = `
            <div class="recording-dot"></div>
            <span>Kayıt yapılıyor...</span>
        `;
        
        // Mevcut indicator'ı kaldır
        this.removeRecordingIndicator();
        
        document.body.appendChild(indicator);
    }

    removeRecordingIndicator() {
        const existingIndicator = document.querySelector('.recording-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
    }

    async handleAudioSubmit() {
        if (!this.audioBlob) {
            this.showStatusMessage('Önce ses kaydı yapın.', 'warning');
            return;
        }

        this.setLoadingState(true);
        this.audioPlaybackContainer.style.display = 'none';
        this.showStatusMessage('Ses dosyası işleniyor...', 'info');

        const formData = new FormData();
        formData.append('file', this.audioBlob, 'recording.wav');

        try {
            const response = await fetch('/chat-audio', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            this.displayResponse(data.response);
            this.showStatusMessage('Sesli soru başarıyla işlendi!', 'success');
        } catch (error) {
            this.showStatusMessage('Ses dosyası işlenirken bir hata oluştu.', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    async handleSpeechSynthesis() {
        const responseContent = this.responseArea.querySelector('.response-content');
        if (!responseContent) {
            this.showStatusMessage('Dinlenecek içerik bulunamadı.', 'warning');
            return;
        }

        const text = responseContent.textContent || responseContent.innerText;
        if (!text) {
            this.showStatusMessage('Dinlenecek metin bulunamadı.', 'warning');
            return;
        }

        // Show loading state
        this.listenResponseButton.disabled = true;
        this.listenResponseButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Konu Anlatımı Oluşturuluyor...</span>';
        this.showStatusMessage('Konu anlatımı oluşturuluyor, lütfen bekleyin...', 'info');

        try {
            // Call Google Gemini TTS API
            const response = await fetch('/synthesize-speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text })
            });

            if (response.ok) {
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Setup audio player
                this.setupResponseAudioPlayer(audioUrl);
                
                // Show audio player
                this.responseAudioPlayerContainer.style.display = 'block';
                
                // Reset button
                this.listenResponseButton.disabled = false;
                this.listenResponseButton.innerHTML = '<i class="fas fa-volume-up"></i><span>Konu Anlatımı Oluştur</span>';
                
                this.showStatusMessage('Konu anlatımı hazır! Oynatıcıyı kullanarak dinleyebilirsiniz.', 'success');
                
                // Scroll to audio player
                this.responseAudioPlayerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                throw new Error('Ses dosyası oluşturulamadı.');
            }
        } catch (error) {
            this.showStatusMessage('Konu anlatımı oluşturulurken bir hata oluştu: ' + error.message, 'error');
            this.listenResponseButton.disabled = false;
            this.listenResponseButton.innerHTML = '<i class="fas fa-volume-up"></i><span>Konu Anlatımı Oluştur</span>';
        }
    }

    displayResponse(response) {
        // Markdown olarak render et ve response-content div'i içine koy
        this.responseArea.innerHTML = `
            <div class="response-content">
                ${this.md.render(response)}
            </div>
        `;
        
        // Yanıt alanına animasyon ekle
        this.responseArea.style.animation = 'none';
        this.responseArea.offsetHeight; // Reflow
        this.responseArea.style.animation = 'slideInUp 0.5s ease-out';
        
        this.listenResponseButton.disabled = false;
    }

    setLoadingState(isLoading) {
        if (isLoading) {
            this.responseArea.innerHTML = `
                <div class="d-flex flex-column justify-content-center align-items-center" style="height: 200px;">
                    <div class="loading-spinner mb-3"></div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: 0%"></div>
                    </div>
                    <p class="mt-3 text-muted">İşleniyor...</p>
                </div>
            `;
            
            // Progress bar animasyonu
            setTimeout(() => {
                const progressBar = this.responseArea.querySelector('.progress-bar');
                if (progressBar) {
                    progressBar.style.width = '100%';
                }
            }, 100);
            
            this.sendTextButton.disabled = true;
            this.startRecordButton.disabled = true;
            this.sendAudioButton.disabled = true;
        } else {
            this.sendTextButton.disabled = false;
            this.startRecordButton.disabled = false;
            this.sendAudioButton.disabled = false;
        }
    }

    // Utility fonksiyonları
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // Tab switching functionality
    switchTab(tabName) {
        // Remove active class from all tabs and panes
        this.tabButtons.forEach(button => button.classList.remove('active'));
        this.tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Add active class to selected tab and pane
        const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
        const selectedPane = document.getElementById(`${tabName}-tab`);
        
        if (selectedTab && selectedPane) {
            selectedTab.classList.add('active');
            selectedPane.classList.add('active');
        }
    }

    // Start evaluation recording
    async startEvaluationRecording() {

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                this.audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(this.audioBlob);
                
                // Gizli audio element oluştur
                if (!this.evaluationAudioPlayer) {
                    this.evaluationAudioPlayer = document.createElement('audio');
                    this.evaluationAudioPlayer.style.display = 'none';
                    document.body.appendChild(this.evaluationAudioPlayer);
                }
                
                this.evaluationAudioPlayer.src = audioUrl;
                this.setupEvaluationAudioPlayer();
                this.evaluationAudioPlaybackContainer.style.display = 'block';
                this.stopEvaluationRecordingTimer();
                this.removeEvaluationRecordingIndicator();
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            
            // UI güncellemeleri
            this.startEvaluationRecordButton.disabled = true;
            this.stopEvaluationRecordButton.disabled = false;
            this.startEvaluationRecordingTimer();
            this.addEvaluationRecordingIndicator();
            
            this.showStatusMessage('Kayıt başlatıldı. Konunuzu anlatmaya başlayabilirsiniz.', 'info');
            
        } catch (error) {
            this.showStatusMessage('Mikrofon erişimi sağlanamadı.', 'error');
        }
    }

    // Stop evaluation recording
    stopEvaluationRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.isRecording = false;
            
            // UI güncellemeleri
            this.startEvaluationRecordButton.disabled = false;
            this.stopEvaluationRecordButton.disabled = true;
        }
    }

    // Start evaluation recording timer
    startEvaluationRecordingTimer() {
        this.recordingStartTime = Date.now();
        this.evaluationRecordingTimer.style.display = 'block';
        
        this.evaluationRecordingTimer = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            this.evaluationTimerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    // Stop evaluation recording timer
    stopEvaluationRecordingTimer() {
        if (this.evaluationRecordingTimer) {
            clearInterval(this.evaluationRecordingTimer);
            this.evaluationRecordingTimer.style.display = 'none';
        }
    }

    // Add evaluation recording indicator
    addEvaluationRecordingIndicator() {
        this.startEvaluationRecordButton.innerHTML = '<i class="fas fa-microphone-slash"></i><span>Kaydediliyor...</span>';
        this.startEvaluationRecordButton.classList.add('recording');
    }

    // Remove evaluation recording indicator
    removeEvaluationRecordingIndicator() {
        this.startEvaluationRecordButton.innerHTML = '<i class="fas fa-microphone"></i><span>Kaydı Başlat</span>';
        this.startEvaluationRecordButton.classList.remove('recording');
    }

    // Setup custom audio player
    setupEvaluationAudioPlayer() {
        if (!this.evaluationAudioPlayer) return;
        
        this.evaluationAudioPlayer.addEventListener('loadedmetadata', () => {
            this.evaluationDuration.textContent = this.formatTime(this.evaluationAudioPlayer.duration);
        });
        
        this.evaluationAudioPlayer.addEventListener('timeupdate', () => {
            const currentTime = this.evaluationAudioPlayer.currentTime;
            const duration = this.evaluationAudioPlayer.duration;
            
            this.evaluationCurrentTime.textContent = this.formatTime(currentTime);
            this.evaluationProgressFill.style.width = `${(currentTime / duration) * 100}%`;
        });
        
        this.evaluationAudioPlayer.addEventListener('ended', () => {
            this.evaluationPlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            this.evaluationProgressFill.style.width = '0%';
            this.evaluationCurrentTime.textContent = '00:00';
        });
        
        this.evaluationAudioPlayer.addEventListener('play', () => {
            this.evaluationPlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        });
        
        this.evaluationAudioPlayer.addEventListener('pause', () => {
            this.evaluationPlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        });
    }

    // Toggle play/pause
    toggleEvaluationAudio() {
        if (!this.evaluationAudioPlayer) return;
        
        if (this.evaluationAudioPlayer.paused) {
            this.evaluationAudioPlayer.play();
        } else {
            this.evaluationAudioPlayer.pause();
        }
    }

    // Stop audio
    stopEvaluationAudio() {
        if (!this.evaluationAudioPlayer) return;
        
        this.evaluationAudioPlayer.pause();
        this.evaluationAudioPlayer.currentTime = 0;
        this.evaluationPlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.evaluationProgressFill.style.width = '0%';
        this.evaluationCurrentTime.textContent = '00:00';
    }

    // Toggle mute
    toggleEvaluationMute() {
        if (!this.evaluationAudioPlayer) return;
        
        this.evaluationAudioPlayer.muted = !this.evaluationAudioPlayer.muted;
        
        if (this.evaluationAudioPlayer.muted) {
            this.evaluationMuteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            this.evaluationMuteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }

    // Set volume
    setEvaluationVolume(value) {
        if (!this.evaluationAudioPlayer) return;
        
        this.evaluationAudioPlayer.volume = value / 100;
        
        if (value == 0) {
            this.evaluationMuteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else if (value < 50) {
            this.evaluationMuteBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
        } else {
            this.evaluationMuteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }

    // Seek audio
    seekEvaluationAudio(event) {
        if (!this.evaluationAudioPlayer) return;
        
        const rect = this.evaluationProgressFill.parentElement.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const width = rect.width;
        const seekTime = (clickX / width) * this.evaluationAudioPlayer.duration;
        
        this.evaluationAudioPlayer.currentTime = seekTime;
    }

    // Format time helper
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Response Audio Player Functions
    setupResponseAudioPlayer(audioUrl) {
        if (this.responseAudioPlayer) {
            this.responseAudioPlayer.pause();
            URL.revokeObjectURL(this.responseAudioPlayer.src);
        }
        
        if (!this.responseAudioPlayer) {
            this.responseAudioPlayer = document.createElement('audio');
            this.responseAudioPlayer.style.display = 'none';
            document.body.appendChild(this.responseAudioPlayer);
        }
        
        this.responseAudioPlayer.src = audioUrl;
        
        this.responseAudioPlayer.addEventListener('loadedmetadata', () => {
            this.responseDuration.textContent = this.formatTime(this.responseAudioPlayer.duration);
        });
        
        this.responseAudioPlayer.addEventListener('timeupdate', () => {
            const currentTime = this.responseAudioPlayer.currentTime;
            const duration = this.responseAudioPlayer.duration;
            
            this.responseCurrentTime.textContent = this.formatTime(currentTime);
            this.responseProgressFill.style.width = `${(currentTime / duration) * 100}%`;
        });
        
        this.responseAudioPlayer.addEventListener('ended', () => {
            this.responsePlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            this.responseProgressFill.style.width = '0%';
            this.responseCurrentTime.textContent = '00:00';
        });
        
        this.responseAudioPlayer.addEventListener('play', () => {
            this.responsePlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        });
        
        this.responseAudioPlayer.addEventListener('pause', () => {
            this.responsePlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        });
    }

    toggleResponseAudio() {
        if (!this.responseAudioPlayer) return;
        
        if (this.responseAudioPlayer.paused) {
            this.responseAudioPlayer.play();
        } else {
            this.responseAudioPlayer.pause();
        }
    }

    stopResponseAudio() {
        if (!this.responseAudioPlayer) return;
        
        this.responseAudioPlayer.pause();
        this.responseAudioPlayer.currentTime = 0;
        this.responsePlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.responseProgressFill.style.width = '0%';
        this.responseCurrentTime.textContent = '00:00';
    }

    toggleResponseMute() {
        if (!this.responseAudioPlayer) return;
        
        this.responseAudioPlayer.muted = !this.responseAudioPlayer.muted;
        
        if (this.responseAudioPlayer.muted) {
            this.responseMuteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            this.responseMuteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }

    setResponseVolume(value) {
        if (!this.responseAudioPlayer) return;
        
        this.responseAudioPlayer.volume = value / 100;
        
        if (value == 0) {
            this.responseMuteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else if (value < 50) {
            this.responseMuteBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
        } else {
            this.responseMuteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }

    seekResponseAudio(event) {
        if (!this.responseAudioPlayer) return;
        
        const rect = this.responseProgressFill.parentElement.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const width = rect.width;
        const seekTime = (clickX / width) * this.responseAudioPlayer.duration;
        
        this.responseAudioPlayer.currentTime = seekTime;
    }

    // Handle evaluation audio submit
    async handleEvaluationAudioSubmit() {
        if (!this.audioBlob) {
            this.showStatusMessage('Önce bir kayıt yapın.', 'warning');
            return;
        }

        this.setEvaluationLoadingState(true);
        
        try {
            const formData = new FormData();
            formData.append('file', this.audioBlob, 'recording.wav');

            const response = await fetch('/mistakes-by-audio', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                this.displayEvaluationResponse(data.response);
                this.showStatusMessage('Değerlendirme tamamlandı!', 'success');
            } else {
                throw new Error('Değerlendirme sırasında bir hata oluştu.');
            }
        } catch (error) {
            this.showStatusMessage(error.message, 'error');
        } finally {
            this.setEvaluationLoadingState(false);
        }
    }

    // Display evaluation response
    displayEvaluationResponse(response) {
        if (!response) {
            this.evaluationResponseArea.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Değerlendirme sonucu alınamadı. Lütfen tekrar deneyin.</p>
                </div>
            `;
            return;
        }

        // Convert markdown to HTML
        const htmlContent = this.md.render(response);
        
        this.evaluationResponseArea.innerHTML = `
            <div class="response-content">
                ${htmlContent}
            </div>
        `;
        
        this.listenEvaluationResponseButton.disabled = false;
        this.listenEvaluationResponseButton.dataset.text = response;
        
        // Smooth scroll to response
        this.evaluationResponseArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Set evaluation loading state
    setEvaluationLoadingState(isLoading) {
        const button = this.sendEvaluationAudioButton;
        const icon = button.querySelector('i');
        const span = button.querySelector('span');
        
        if (isLoading) {
            button.disabled = true;
            icon.className = 'fas fa-spinner fa-spin';
            span.textContent = 'Değerlendiriliyor...';
            this.evaluationResponseArea.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Konu anlatımınız değerlendiriliyor...</p>
                </div>
            `;
        } else {
            button.disabled = false;
            icon.className = 'fas fa-upload';
            span.textContent = 'Değerlendirmeyi Başlat';
        }
    }

    // Evaluation speech synthesis using Google Gemini TTS
    async handleEvaluationSpeechSynthesis() {
        const text = this.listenEvaluationResponseButton.dataset.text;
        if (!text) {
            this.showStatusMessage('Dinlenecek içerik bulunamadı.', 'warning');
            return;
        }

        try {
            // Show loading state
            this.listenEvaluationResponseButton.disabled = true;
            this.listenEvaluationResponseButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Konu Anlatımı Oluşturuluyor...</span>';
            this.showStatusMessage('Konu anlatımı oluşturuluyor, lütfen bekleyin...', 'info');

            // Call Google Gemini TTS API
            const response = await fetch('/synthesize-evaluation-speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text })
            });

            if (response.ok) {
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Setup audio player
                this.setupEvaluationResponseAudioPlayer(audioUrl);
                
                // Show audio player
                this.evaluationResponseAudioPlayerContainer.style.display = 'block';
                
                // Reset button
                this.listenEvaluationResponseButton.disabled = false;
                this.listenEvaluationResponseButton.innerHTML = '<i class="fas fa-volume-up"></i><span>Konu Anlatımı Oluştur</span>';
                
                this.showStatusMessage('Konu anlatımı hazır! Oynatıcıyı kullanarak dinleyebilirsiniz.', 'success');
                
                // Scroll to audio player
                this.evaluationResponseAudioPlayerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                throw new Error('Ses dosyası oluşturulamadı.');
            }
        } catch (error) {
            this.showStatusMessage('Konu anlatımı oluşturulurken bir hata oluştu: ' + error.message, 'error');
            this.listenEvaluationResponseButton.disabled = false;
            this.listenEvaluationResponseButton.innerHTML = '<i class="fas fa-volume-up"></i><span>Konu Anlatımı Oluştur</span>';
        }
    }

    // Setup evaluation response audio player
    setupEvaluationResponseAudioPlayer(audioUrl) {
        if (this.evaluationResponseAudio) {
            this.evaluationResponseAudio.pause();
            URL.revokeObjectURL(this.evaluationResponseAudio.src);
        }
        
        this.evaluationResponseAudio = new Audio(audioUrl);
        
        this.evaluationResponseAudio.addEventListener('loadedmetadata', () => {
            this.evaluationResponseDuration.textContent = this.formatTime(this.evaluationResponseAudio.duration);
        });
        
        this.evaluationResponseAudio.addEventListener('timeupdate', () => {
            if (!isNaN(this.evaluationResponseAudio.duration)) {
                const progress = (this.evaluationResponseAudio.currentTime / this.evaluationResponseAudio.duration) * 100;
                this.evaluationResponseProgressFill.style.width = progress + '%';
                this.evaluationResponseCurrentTime.textContent = this.formatTime(this.evaluationResponseAudio.currentTime);
            }
        });
        
        this.evaluationResponseAudio.addEventListener('ended', () => {
            this.evaluationResponsePlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            this.evaluationResponseProgressFill.style.width = '0%';
            this.evaluationResponseCurrentTime.textContent = '00:00';
        });
        
        this.evaluationResponseAudio.addEventListener('play', () => {
            this.evaluationResponsePlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        });
        
        this.evaluationResponseAudio.addEventListener('pause', () => {
            this.evaluationResponsePlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        });
    }

    // Toggle evaluation response audio
    toggleEvaluationResponseAudio() {
        if (!this.evaluationResponseAudio) return;
        
        if (this.evaluationResponseAudio.paused) {
            this.evaluationResponseAudio.play();
        } else {
            this.evaluationResponseAudio.pause();
        }
    }

    // Stop evaluation response audio
    stopEvaluationResponseAudio() {
        if (!this.evaluationResponseAudio) return;
        
        this.evaluationResponseAudio.pause();
        this.evaluationResponseAudio.currentTime = 0;
        this.evaluationResponseProgressFill.style.width = '0%';
        this.evaluationResponseCurrentTime.textContent = '00:00';
        this.evaluationResponsePlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }

    // Toggle evaluation response mute
    toggleEvaluationResponseMute() {
        if (!this.evaluationResponseAudio) return;
        
        this.evaluationResponseAudio.muted = !this.evaluationResponseAudio.muted;
        const icon = this.evaluationResponseMuteBtn.querySelector('i');
        
        if (this.evaluationResponseAudio.muted) {
            icon.className = 'fas fa-volume-mute';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }

    // Set evaluation response volume
    setEvaluationResponseVolume(value) {
        if (!this.evaluationResponseAudio) return;
        
        this.evaluationResponseAudio.volume = value / 100;
        const icon = this.evaluationResponseMuteBtn.querySelector('i');
        
        if (value == 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (value < 50) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }

    // Seek evaluation response audio
    seekEvaluationResponseAudio(event) {
        if (!this.evaluationResponseAudio) return;
        
        const rect = this.evaluationResponseProgressFill.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const width = rect.width;
        const seekTime = (clickX / width) * this.evaluationResponseAudio.duration;
        
        this.evaluationResponseAudio.currentTime = seekTime;
    }

    // Get available voices (kept for compatibility)
    getVoices() {
        return new Promise((resolve) => {
            let voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                resolve(voices);
            } else {
                speechSynthesis.onvoiceschanged = () => {
                    voices = speechSynthesis.getVoices();
                    resolve(voices);
                };
            }
        });
    }
}

// Sayfa yüklendiğinde uygulamayı başlat
document.addEventListener('DOMContentLoaded', () => {
    // Loading screen'i gizle
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 1000);
        }, 2000);
    }
    
    // Markdown-it kütüphanesinin yüklenmesini bekle
    if (typeof window.markdownit !== 'undefined') {
        window.app = new EducationPlatform();
    } else {
        // Markdown-it yüklenene kadar bekle
        const checkMarkdownIt = setInterval(() => {
            if (typeof window.markdownit !== 'undefined') {
                clearInterval(checkMarkdownIt);
                window.app = new EducationPlatform();
            }
        }, 100);
    }
});

// Sayfa kapatılırken kaynakları temizle
window.addEventListener('beforeunload', () => {
    if (window.app && window.app.mediaRecorder && window.app.isRecording) {
        window.app.stopRecording();
    }
});

// Hata yakalama
window.addEventListener('error', (event) => {
    console.error('Uygulama hatası:', event.error);
    if (window.app) {
        window.app.showStatusMessage('Beklenmeyen bir hata oluştu.', 'error');
    }
});

// Online/Offline durumu
window.addEventListener('online', () => {
    if (window.app) {
        window.app.showStatusMessage('İnternet bağlantısı yeniden kuruldu!', 'success');
    }
});

window.addEventListener('offline', () => {
    if (window.app) {
        window.app.showStatusMessage('İnternet bağlantısı kesildi.', 'warning');
    }
});