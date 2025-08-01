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
        
        // Quiz system
        this.userId = this.getUserIdFromStorage(); // LocalStorage'dan user ID'yi al
        
        // User ID kontrolü - eğer yoksa login sayfasına yönlendir
        if (!this.userId) {
            console.log('User ID bulunamadı, login sayfasına yönlendiriliyor...');
            window.location.href = '/login';
            return; // Constructor'ı durdur
        }
        
        // Preferences kontrolü - eğer daha önce preferences verdi ise direkt chat sayfasına geç
        this.checkUserPreferences();
        
        this.currentQuestion = null;
        this.quizTimer = null;
        this.quizTimeLeft = 30;
        this.selectedQuestionCount = 5; // Yeni: seçilen soru sayısı
        this.allQuestions = []; // Yeni: tüm soruları sakla
        this.currentQuestionIndex = 0; // Yeni: mevcut soru indeksi
        this.quizStats = {
            totalQuestions: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            currentQuestionNumber: 1
        };
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
        
        // Stats Elements
        this.showStatsBtn = document.getElementById('show-stats-btn');
        this.refreshStatsBtn = document.getElementById('refresh-stats-btn');
        
        // Logout Elements
        this.logoutBtn = document.getElementById('logout-btn');
        
        // Quiz Elements - Updated for new structure
        this.quizTopicInput = document.getElementById('quiz-topic-input');
        this.quickTopicButtons = document.querySelectorAll('.quick-topic-btn');
        this.difficultyButtons = document.querySelectorAll('.difficulty-option');
        this.questionCountButtons = document.querySelectorAll('.question-count-option'); // Yeni
        this.startQuizButton = document.getElementById('start-quiz-btn');
        this.quizSetupSection = document.getElementById('quiz-setup');
        this.quizGameSection = document.getElementById('quiz-game');
        this.quizResultSection = document.getElementById('quiz-result');
        this.quizSummarySection = document.getElementById('quiz-summary');
        
        // Quiz Game Elements
        this.quizProgressFill = document.getElementById('quiz-progress-fill');
        this.quizProgressText = document.getElementById('quiz-progress-text');
        this.timerNumber = document.getElementById('timer-number');
        this.timerProgress = document.getElementById('timer-progress');
        this.questionNumber = document.getElementById('question-number');
        this.quizQuestionText = document.getElementById('quiz-question-text');
        this.quizOptionsContainer = document.getElementById('quiz-options-container');
        this.submitQuizAnswer = document.getElementById('submit-quiz-answer');
        
        // Quiz Result Elements
        this.resultAnimation = document.getElementById('result-animation');
        this.resultTitle = document.getElementById('result-title');
        this.resultMessage = document.getElementById('result-message');
        this.explanationText = document.getElementById('explanation-text');
        this.nextQuestionButton = document.getElementById('next-question-btn');
        this.finishQuizButton = document.getElementById('finish-quiz-btn');
        
        // Quiz Summary Elements
        this.totalQuestionsStatElement = document.getElementById('total-questions-stat');
        this.correctAnswersStatElement = document.getElementById('correct-answers-stat');
        this.successRateStatElement = document.getElementById('success-rate-stat');
        this.newQuizButton = document.getElementById('new-quiz-btn');
        this.reviewAnswersButton = document.getElementById('review-answers-btn');
        
        // Toast Container
        this.toastContainer = document.getElementById('toast-container');
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
        
        // Quiz Event Listeners
        this.initializeQuizEventListeners();
        
        // Stats Event Listeners
        this.showStatsBtn.addEventListener('click', () => this.showUserSessionStats());
        this.refreshStatsBtn.addEventListener('click', () => this.refreshUserStats());
        
        // Logout Event Listener
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    initializeQuizEventListeners() {
        // Quick topic selection
        this.quickTopicButtons.forEach(button => {
            button.addEventListener('click', () => this.selectQuickTopic(button.dataset.topic));
        });
        
        // Difficulty selection
        this.difficultyButtons.forEach(button => {
            button.addEventListener('click', () => this.selectDifficulty(button.dataset.difficulty));
        });
        
        // Start quiz
        this.startQuizButton.addEventListener('click', () => this.startQuiz());
        
        // Submit answer
        this.submitQuizAnswer.addEventListener('click', () => this.submitAnswer());
        
        // Quiz result buttons
        this.nextQuestionButton.addEventListener('click', () => this.nextQuestion());
        this.finishQuizButton.addEventListener('click', () => this.finishQuiz());
        
        // Quiz summary buttons
        this.newQuizButton.addEventListener('click', () => this.resetQuiz());
        this.reviewAnswersButton.addEventListener('click', () => this.reviewAnswers());

        // Question count selection
        this.questionCountButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.selectQuestionCount(parseInt(button.dataset.count));
            });
        });
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
            // User ID kontrolü
            if (!this.userId) {
                throw new Error('Kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın.');
            }

            // Preferences'ı user_id ile birlikte gönder
            const response = await fetch('/submit-preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: this.userId,
                    preferences: preferences
                })
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
            
            // İstatistik butonunu göster
            this.showStatsBtn.style.display = 'flex';
            
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

        // User ID kontrolü
        if (!this.userId) {
            this.showStatusMessage('Kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın.', 'error');
            return;
        }

        this.setLoadingState(true);
        this.showStatusMessage('Soru gönderiliyor...', 'info');

        try {
            const response = await fetch('/chat-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    user_id: this.userId,
                    text: question 
                })
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            this.displayResponse(data.response);
            this.showStatusMessage('Yanıt başarıyla alındı!', 'success');
        } catch (error) {
            this.showStatusMessage(error.message || 'Yanıt alınırken bir hata oluştu.', 'error');
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

        // User ID kontrolü
        if (!this.userId) {
            this.showStatusMessage('Kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın.', 'error');
            return;
        }

        this.setLoadingState(true);
        this.audioPlaybackContainer.style.display = 'none';
        this.showStatusMessage('Ses dosyası işleniyor...', 'info');

        const formData = new FormData();
        formData.append('user_id', this.userId);
        formData.append('file', this.audioBlob, 'recording.wav');

        try {
            const response = await fetch('/chat-audio', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            this.displayResponse(data.response);
            this.showStatusMessage('Sesli soru başarıyla işlendi!', 'success');
        } catch (error) {
            this.showStatusMessage(error.message || 'Ses dosyası işlenirken bir hata oluştu.', 'error');
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

        // Buton durumunu güncelle
        this.listenResponseButton.disabled = true;
        this.listenResponseButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Ses Oluşturuluyor...</span>';
        this.showStatusMessage('Ses dosyası oluşturuluyor...', 'info');

        try {
            const response = await fetch('/synthesize-speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text })
            });

            if (response.ok) {
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Gizli audio element oluştur
                if (!this.responseAudioPlayer) {
                    this.responseAudioPlayer = document.createElement('audio');
                    this.responseAudioPlayer.style.display = 'none';
                    document.body.appendChild(this.responseAudioPlayer);
                }
                
                this.responseAudioPlayer.src = audioUrl;
                this.setupResponseAudioPlayer();
                this.responseAudioPlayerContainer.style.display = 'block';
                
                // Buton durumunu geri al
                this.listenResponseButton.disabled = false;
                this.listenResponseButton.innerHTML = '<i class="fas fa-volume-up"></i><span>Sesli Dinle</span>';
                
                this.showStatusMessage('Ses dosyası hazır!', 'success');
                
                // Smooth scroll to audio player
                this.responseAudioPlayerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                
            } else {
                throw new Error('Ses sentezi sırasında bir hata oluştu.');
            }
        } catch (error) {
            this.showStatusMessage(error.message, 'error');
            this.listenResponseButton.disabled = false;
            this.listenResponseButton.innerHTML = '<i class="fas fa-volume-up"></i><span>Sesli Dinle</span>';
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
    setupResponseAudioPlayer() {
        if (!this.responseAudioPlayer) return;
        
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

    // Evaluation speech synthesis
    async handleEvaluationSpeechSynthesis() {
        const text = this.listenEvaluationResponseButton.dataset.text;
        if (!text) {
            this.showStatusMessage('Dinlenecek içerik bulunamadı.', 'warning');
            return;
        }

        try {
            if ('speechSynthesis' in window) {
                // Stop any ongoing speech
                window.speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'tr-TR';
                utterance.rate = 0.9;
                utterance.pitch = 1;
                utterance.volume = 1;
                
                // Get available voices and set Turkish voice if available
                const voices = await this.getVoices();
                const turkishVoice = voices.find(voice => 
                    voice.lang.includes('tr') || voice.lang.includes('TR')
                );
                if (turkishVoice) {
                    utterance.voice = turkishVoice;
                }
                
                utterance.onstart = () => {
                    this.listenEvaluationResponseButton.innerHTML = '<i class="fas fa-pause"></i><span>Durdur</span>';
                    this.showStatusMessage('Değerlendirme sesli olarak dinleniyor...', 'info');
                };
                
                utterance.onend = () => {
                    this.listenEvaluationResponseButton.innerHTML = '<i class="fas fa-volume-up"></i><span>Sesli Dinle</span>';
                    this.showStatusMessage('Sesli değerlendirme tamamlandı.', 'success');
                };
                
                utterance.onerror = (event) => {
                    this.listenEvaluationResponseButton.innerHTML = '<i class="fas fa-volume-up"></i><span>Sesli Dinle</span>';
                    this.showStatusMessage('Sesli değerlendirme sırasında bir hata oluştu.', 'error');
                };
                
                window.speechSynthesis.speak(utterance);
            } else {
                this.showStatusMessage('Tarayıcınız sesli anlatımı desteklemiyor.', 'warning');
            }
        } catch (error) {
            this.showStatusMessage('Sesli değerlendirme başlatılırken bir hata oluştu.', 'error');
        }
    }

    // Get available voices
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

    // Quiz Methods
    async initializeQuiz() {
        // Bu fonksiyon artık gerekli değil çünkü user ID localStorage'dan alınıyor
        // Sadece user ID kontrolü yapıyoruz
        if (!this.userId) {
            this.showToast('Kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın.', 'error');
            return false;
        }
        return true;
    }

    selectQuickTopic(topic) {
        // Remove active class from all topic buttons
        this.quickTopicButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to selected button
        const selectedButton = document.querySelector(`[data-topic="${topic}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
        
        // Set topic input value
        this.quizTopicInput.value = topic;
        this.showToast(`Konu seçildi: ${topic}`, 'success');
    }

    selectDifficulty(difficulty) {
        // Remove active class from all difficulty buttons
        this.difficultyButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to selected button
        const selectedButton = document.querySelector(`[data-difficulty="${difficulty}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
        this.showToast(`Zorluk seviyesi: ${difficulty}`, 'success');
    }

    async startQuiz() {
        try {
            const topic = this.quizTopicInput.value.trim();
            const difficulty = document.querySelector('.difficulty-option.active').dataset.difficulty;
            
            
            if (!topic) {
                this.showToast('Lütfen bir konu seçin', 'warning');
                return;
            }
            if (!difficulty) {
                this.showToast('Lütfen zorluk seviyesi seçin', 'warning');
                return;
            }
            
            // User ID kontrolü
            if (!this.userId) {
                this.showToast('Kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın.', 'error');
                return;
            }
            
            // Reset quiz stats
            this.quizStats = {
                totalQuestions: 0,
                correctAnswers: 0,
                incorrectAnswers: 0,
                currentQuestionNumber: 1
            };
            
            // Show loading state
            this.startQuizButton.disabled = true;
            this.startQuizButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Quiz Hazırlanıyor...</span>';
            this.showToast('Quiz hazırlanıyor, lütfen bekleyiniz...', 'info');
            
            // Tüm soruları bir seferde oluştur
            const response = await fetch('/generate-quiz-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    user_id:this.userId,
                    topic, 
                    difficulty, 
                    question_count: this.selectedQuestionCount 
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.allQuestions = data.questions;
                this.currentQuestionIndex = 0;
                
                // Quiz istatistiklerini güncelle
                this.quizStats.totalQuestions = this.allQuestions.length;
                this.quizStats.correctAnswers = 0;
                this.quizStats.incorrectAnswers = 0;
                this.quizStats.currentQuestionNumber = 1;
                
                // Quiz'i başlat
                this.quizSetupSection.style.display = 'none';
                this.quizGameSection.style.display = 'block';
                
                // İlk soruyu göster
                this.currentQuestion = this.allQuestions[0];
                this.displayQuestion(this.currentQuestion);
                this.updateQuizProgress();
                this.startTimer();
                
                this.showToast('Quiz başladı!', 'success');
                
            } else {
                throw new Error('Quiz soruları oluşturulamadı');
            }
        } catch (error) {
            this.showToast('Quiz başlatılırken hata oluştu', 'error');
            console.error('Quiz start error:', error);
        } finally {
            // Reset button state
            this.startQuizButton.disabled = false;
            this.startQuizButton.innerHTML = '<i class="fas fa-play"></i><span>Quiz\'e Başla</span>';
        }
    }

    async generateQuestion(topic, difficulty) {
        try {
            // Show loading toast for subsequent questions
            if (this.quizGameSection && this.quizGameSection.style.display === 'block') {
                this.showToast('Yeni soru oluşturuluyor...', 'info');
            }
            
            const response = await fetch('/generate-quiz-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, difficulty })
            });
            
            if (response.ok) {
                const questionData = await response.json();
                this.currentQuestion = questionData;
                this.displayQuestion(questionData);
                
                // Show success toast for subsequent questions
                if (this.quizGameSection && this.quizGameSection.style.display === 'block') {
                    this.showToast('Soru hazır!', 'success');
                }
                
            } else {
                throw new Error('Soru oluşturulamadı');
            }
        } catch (error) {
            this.showToast('Soru oluşturulurken hata oluştu', 'error');
            console.error('Question generation error:', error);
            throw error; // Re-throw to be caught by startQuiz
        }
    }

    displayQuestion(questionData) {
        // Update question number and text
        this.questionNumber.textContent = this.quizStats.currentQuestionNumber;
        this.quizQuestionText.textContent = questionData.question;
        
        // Clear existing options
        this.quizOptionsContainer.innerHTML = '';

        // Display options with new structure
        questionData.options.forEach((option, index) => {
            const letter = String.fromCharCode(65 + index); // A, B, C, D, E
            const optionHtml = `
                <div class="quiz-option" data-option="${letter}">
                    <span class="option-letter">${letter}</span>
                    <span class="option-text">${option}</span>
                </div>
            `;
            this.quizOptionsContainer.insertAdjacentHTML('beforeend', optionHtml);
        });
        
        // Add click event listeners to quiz options
        const options = this.quizOptionsContainer.querySelectorAll('.quiz-option');
        options.forEach(option => {
            option.addEventListener('click', () => this.selectQuizOption(option));
        });
        
        // Reset selection state
        this.selectedOption = null;
        this.submitQuizAnswer.disabled = true;
        this.submitQuizAnswer.innerHTML = '<i class="fas fa-check"></i><span>Cevabı Onayla</span>';
    }

    selectQuizOption(optionElement) {
        // Remove selected class from all options
        const options = this.quizOptionsContainer.querySelectorAll('.quiz-option');
        options.forEach(opt => opt.classList.remove('selected'));
        
        // Add selected class to clicked option
        optionElement.classList.add('selected');
        this.selectedOption = optionElement.dataset.option;
        
        // Enable submit button
        this.submitQuizAnswer.disabled = false;
    }

    updateQuizProgress() {
        // Update progress bar and text
        const progressPercentage = (this.quizStats.currentQuestionNumber / this.selectedQuestionCount) * 100;
        this.quizProgressFill.style.width = `${progressPercentage}%`;
        this.quizProgressText.textContent = `Soru ${this.quizStats.currentQuestionNumber}/${this.selectedQuestionCount}`;
    }

    startTimer() {
        // Set timer based on difficulty
        const difficulty = this.currentQuestion.difficulty;
        this.quizTimeLeft = difficulty === 'Zor' ? 45 : (difficulty === 'Orta' ? 30 : 25);
        const totalTime = this.quizTimeLeft;
        
        // Update timer display
        this.timerNumber.textContent = this.quizTimeLeft;
        
        // Clear any existing timer
        if (this.quizTimer) {
            clearInterval(this.quizTimer);
        }
        
        // Start countdown
        this.quizTimer = setInterval(() => {
            this.quizTimeLeft--;
            this.timerNumber.textContent = this.quizTimeLeft;
            
            // Update SVG timer progress
            const percentage = (this.quizTimeLeft / totalTime) * 100;
            const dashArray = `${percentage} 100`;
            this.timerProgress.style.strokeDasharray = dashArray;
            
            // Change color based on remaining time
            if (this.quizTimeLeft <= 10) {
                this.timerProgress.style.stroke = 'var(--danger-color)';
                this.timerNumber.style.color = 'var(--danger-color)';
            } else if (this.quizTimeLeft <= 20) {
                this.timerProgress.style.stroke = 'var(--warning-color)';
                this.timerNumber.style.color = 'var(--warning-color)';
            }
            
            if (this.quizTimeLeft <= 0) {
                this.timeUp();
            }
        }, 1000);
    }

    timeUp() {
        if (this.quizTimer) {
            clearInterval(this.quizTimer);
            this.quizTimer = null;
        }
        
        this.showToast('Süre doldu!', 'warning');
        
        // Force submit with current selection (even if empty)
        this.submitAnswer();
    }

    async submitAnswer() {
        // User ID kontrolü
        if (!this.userId) {
            this.showToast('Kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın.', 'error');
            return;
        }
        
        // Check if manually submitted without selection
        if (!this.selectedOption && this.quizTimeLeft > 0) {
            this.showToast('Lütfen bir seçenek seçin', 'warning');
            return;
        }
        
        // Clear timer
        if (this.quizTimer) {
            clearInterval(this.quizTimer);
            this.quizTimer = null;
        }
        
        // Disable submit button
        this.submitQuizAnswer.disabled = true;
        this.submitQuizAnswer.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Kontrol Ediliyor...</span>';
        
        try {
            const totalTime = this.currentQuestion.difficulty === 'Zor' ? 45 : (this.currentQuestion.difficulty === 'Orta' ? 30 : 25);
            const userAnswer = this.selectedOption || ''; // Empty string if time up
            
            const response = await fetch('/submit-quiz-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: this.userId,
                    question_data: this.currentQuestion,
                    user_answer: userAnswer,
                    time_taken: totalTime - this.quizTimeLeft
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.updateStats(result.is_correct);
                this.displayResult(result);
            } else {
                throw new Error('Cevap gönderilemedi');
            }
        } catch (error) {
            this.showToast('Cevap gönderilirken hata oluştu', 'error');
            console.error('Answer submission error:', error);
            // Re-enable submit button on error
            this.submitQuizAnswer.disabled = false;
            this.submitQuizAnswer.innerHTML = '<i class="fas fa-check"></i><span>Cevabı Onayla</span>';
        }
    }

    displayResult(result) {
        // Show correct/incorrect on the selected option
        const options = this.quizOptionsContainer.querySelectorAll('.quiz-option');
        options.forEach(option => {
            const optionLetter = option.dataset.option;
            if (optionLetter === result.correct_answer) {
                option.classList.add('correct');
            } else if (optionLetter === this.selectedOption && !result.is_correct) {
                option.classList.add('incorrect');
            }
        });
        
        // Wait a moment then show result section
        setTimeout(() => {
            // Hide quiz game and show result
            this.quizGameSection.style.display = 'none';
            this.quizResultSection.style.display = 'block';
            
            // Update result display
            if (result.is_correct) {
                this.resultAnimation.innerHTML = '<i class="fas fa-check-circle"></i>';
                this.resultAnimation.classList.add('correct');
                this.resultAnimation.classList.remove('incorrect');
                this.resultTitle.textContent = 'Doğru Cevap!';
                this.resultMessage.textContent = 'Tebrikler! Soruyu doğru yanıtladınız.';
                this.showToast('Doğru cevap!', 'success');
            } else {
                this.resultAnimation.innerHTML = '<i class="fas fa-times-circle"></i>';
                this.resultAnimation.classList.add('incorrect');
                this.resultAnimation.classList.remove('correct');
                this.resultTitle.textContent = 'Yanlış Cevap';
                this.resultMessage.textContent = `Doğru cevap: ${result.correct_answer}`;
                this.showToast(`Yanlış cevap. Doğru: ${result.correct_answer}`, 'error');
            }
            
            this.explanationText.textContent = result.explanation || 'Açıklama bulunamadı.';
            
            // Show/hide buttons based on question number
            const isLastQuestion = this.currentQuestionIndex >= this.allQuestions.length - 1;
            if (isLastQuestion) {
                this.nextQuestionButton.style.display = 'none';
                this.finishQuizButton.style.display = 'block';
            } else {
                this.nextQuestionButton.style.display = 'block';
                this.finishQuizButton.style.display = 'none';
            }
        }, 1500);
    }

    updateStats(isCorrect) {
        if (isCorrect) {
            this.quizStats.correctAnswers++;
        } else {
            this.quizStats.incorrectAnswers++;
        }
    }

    async nextQuestion() {
        // Hide result section and show quiz game
        this.quizResultSection.style.display = 'none';
        this.quizGameSection.style.display = 'block';
        
        this.currentQuestionIndex++;
        
        if (this.currentQuestionIndex < this.allQuestions.length) {
            // Sonraki soruya geç
            this.currentQuestion = this.allQuestions[this.currentQuestionIndex];
            this.quizStats.currentQuestionNumber = this.currentQuestionIndex + 1;
            
            // Reset selection state
            this.selectedOption = null;
            this.submitQuizAnswer.disabled = true;
            this.submitQuizAnswer.innerHTML = '<i class="fas fa-check"></i><span>Cevabı Onayla</span>';
            
            // Clear previous selections
            const options = this.quizOptionsContainer.querySelectorAll('.quiz-option');
            options.forEach(opt => {
                opt.classList.remove('selected', 'correct', 'incorrect');
            });
            
            this.displayQuestion(this.currentQuestion);
            this.updateQuizProgress();
            this.startTimer();
            
            this.showToast('Sonraki soru!', 'info');
        } else {
            // Quiz bitti
            this.finishQuiz();
        }
    }

    finishQuiz() {
        // Hide results and show summary
        this.quizResultSection.style.display = 'none';
        this.quizSummarySection.style.display = 'block';
        
        // Update summary stats
        this.totalQuestionsStatElement.textContent = this.quizStats.totalQuestions;
        this.correctAnswersStatElement.textContent = this.quizStats.correctAnswers;
        
        const accuracy = this.quizStats.totalQuestions > 0 
            ? Math.round((this.quizStats.correctAnswers / this.quizStats.totalQuestions) * 100)
            : 0;
        this.successRateStatElement.textContent = `${accuracy}%`;
        
        this.showToast(`Quiz tamamlandı! ${accuracy}% başarı`, 'success');
    }

    resetQuiz() {
        // Hide all quiz sections
        this.quizGameSection.style.display = 'none';
        this.quizResultSection.style.display = 'none';
        this.quizSummarySection.style.display = 'none';
        
        // Show setup section
        this.quizSetupSection.style.display = 'block';
        
        // Reset quiz data
        this.currentQuestion = null;
        this.selectedOption = null;
        this.quizStats = {
            totalQuestions: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            currentQuestionNumber: 1
        };
        
        // Clear timer
        if (this.quizTimer) {
            clearInterval(this.quizTimer);
            this.quizTimer = null;
        }
        
        // Reset button states
        this.startQuizButton.disabled = false;
        this.startQuizButton.innerHTML = '<i class="fas fa-play"></i><span>Quiz\'e Başla</span>';
        this.submitQuizAnswer.disabled = true;
        this.submitQuizAnswer.innerHTML = '<i class="fas fa-check"></i><span>Cevabı Onayla</span>';
        
        // Reset form
        this.quizTopicInput.value = '';
        this.quickTopicButtons.forEach(btn => btn.classList.remove('active'));
        this.difficultyButtons.forEach(btn => btn.classList.remove('active'));
        if (this.difficultyButtons[1]) {
            this.difficultyButtons[1].classList.add('active'); // Default to "Orta"
        }

        this.allQuestions = [];
        this.currentQuestionIndex = 0;
        this.selectedQuestionCount = 5;
        
        // Reset question count selection
        this.questionCountButtons.forEach(btn => btn.classList.remove('active'));
        const defaultButton = document.querySelector('[data-count="5"]');
        if (defaultButton) {
            defaultButton.classList.add('active');
        }
        
        this.showToast('Quiz sıfırlandı', 'info');
    }

    reviewAnswers() {
        // For now, just show a message
        this.showToast('Cevap inceleme özelliği geliştiriliyor...', 'info');
        // Future: Show detailed review of all questions and answers
    }

    async viewDetailedPerformance() {
        if (!this.userId) {
            this.showToast('Performans verisi bulunamadı', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`/user-performance/${this.userId}`);
            
            if (response.ok) {
                const performance = await response.json();
                this.showPerformanceDetails(performance);
            } else {
                throw new Error('Performans verisi alınamadı');
            }
        } catch (error) {
            this.showToast('Performans verisi alınırken hata oluştu', 'error');
            console.error('Performance fetch error:', error);
        }
    }

    async getUserSessionStats() {
        /**
         * Kullanıcının session istatistiklerini getirir
         * Chat sayısı, quiz sayısı, üyelik tarihi vb.
         */
        if (!this.userId) {
            this.showToast('Kullanıcı ID bulunamadı', 'error');
            return null;
        }
        
        try {
            const response = await fetch(`/user-session-stats/${this.userId}`);
            const stats = await response.json();
            
            if (response.ok) {
                return stats;
            } else {
                throw new Error(stats.error || 'Session verisi alınamadı');
            }
        } catch (error) {
            this.showToast('Session verisi alınırken hata oluştu', 'error');
            console.error('Session stats fetch error:', error);
            return null;
        }
    }

    async showUserSessionStats() {
        /**
         * Kullanıcı session istatistiklerini ekranda gösterir
         */
        const stats = await this.getUserSessionStats();
        if (!stats) return;

        // Geçirilen zamanı hesapla
        const memberSince = new Date(stats.member_since);
        const now = new Date();
        const diffMs = now - memberSince;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        let timeSpent = '';
        if (diffDays > 0) {
            timeSpent = `${diffDays} gün`;
        } else if (diffHours > 0) {
            timeSpent = `${diffHours} saat`;
        } else {
            timeSpent = `${diffMinutes} dakika`;
        }

        const statsHtml = `
            <div class="user-stats-modal">
                <div class="user-stats-content">
                    <h3>📊 Kullanım İstatistiklerin</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">💬</div>
                            <div class="stat-value">${stats.chat_count}</div>
                            <div class="stat-label">Sohbet</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🧩</div>
                            <div class="stat-value">${stats.quiz_count}</div>
                            <div class="stat-label">Quiz</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">⏱️</div>
                            <div class="stat-value">${timeSpent}</div>
                            <div class="stat-label">Geçirilen Zaman</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">📅</div>
                            <div class="stat-value">${memberSince.toLocaleDateString('tr-TR')}</div>
                            <div class="stat-label">Üyelik</div>
                        </div>
                    </div>
                    <button class="stats-close-btn" onclick="this.closest('.user-stats-modal').remove()">
                        Kapat
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', statsHtml);
        this.showToast('İstatistikler yüklendi!', 'success');
    }

    async refreshUserStats() {
        /**
         * İstatistikleri yeniler ve toast mesajı gösterir
         */
        try {
            // Varsa mevcut modal'ı kapat
            const existingModal = document.querySelector('.user-stats-modal');
            if (existingModal) {
                existingModal.remove();
            }
            
            // Yenile butonunu disabled yap
            this.refreshStatsBtn.disabled = true;
            this.refreshStatsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Yenileniyor...</span>';
            
            // İstatistikleri yeniden çek ve göster
            await this.showUserSessionStats();
            
            // Başarı mesajı
            this.showToast('İstatistikler yenilendi!', 'success');
            
        } catch (error) {
            this.showToast('İstatistikler yenilenirken hata oluştu', 'error');
            console.error('Stats refresh error:', error);
        } finally {
            // Butonu normale döndür
            this.refreshStatsBtn.disabled = false;
            this.refreshStatsBtn.innerHTML = '<i class="fas fa-sync-alt"></i><span>Yenile</span>';
        }
    }

    showPerformanceDetails(performance) {
        let message = `Toplam Soru: ${performance.total_questions}\n`;
        message += `Doğru Cevap: ${performance.correct_answers}\n`;
        message += `Yanlış Cevap: ${performance.incorrect_answers}\n\n`;
        
        if (Object.keys(performance.topics).length > 0) {
            message += 'En çok yanlış yapılan konular:\n';
            Object.entries(performance.topics)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .forEach(([topic, count]) => {
                    message += `- ${topic}: ${count} yanlış\n`;
                });
        }
        
        this.showToast(message, 'info');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = document.createElement('div');
        icon.className = 'toast-icon';
        icon.innerHTML = this.getToastIcon(type);
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'toast-message';
        messageDiv.textContent = message;
        
        toast.appendChild(icon);
        toast.appendChild(messageDiv);
        
        this.toastContainer.appendChild(toast);
        
        // Remove toast after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }

    getToastIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-times-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        return icons[type] || icons.info;
    }

    // Yeni fonksiyon: soru sayısı seçimi
    selectQuestionCount(count) {
        // Remove active class from all buttons
        this.questionCountButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        const selectedButton = document.querySelector(`[data-count="${count}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
        
        this.selectedQuestionCount = count;
    }
    
    getUserIdFromStorage() {
        try {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                if (user.user_id) {
                    return user.user_id;
                }
            }
        } catch (e) {
            console.error('User ID alınamadı:', e);
        }
        
        // User ID yoksa null döndür, yönlendirme yapma
        console.log('User ID bulunamadı');
        return null;
    }
    
    async checkUserPreferences() {
        try {
            const response = await fetch(`/get-user-preferences/${this.userId}`);
            if (response.ok) {
                const preferences = await response.json();
                if (preferences && Object.keys(preferences).length > 0) {
                    // Kullanıcının daha önce preferences'ı var, direkt chat sayfasına geç
                    console.log('Kullanıcının daha önce preferences\'ı var, direkt chat sayfasına geçiliyor...');
                    this.skipToChatPage();
                    return;
                }
            }
        } catch (error) {
            console.error('Preferences kontrolü sırasında hata:', error);
        }
        
        // Preferences yoksa survey sayfasında kal
        console.log('Kullanıcının preferences\'ı yok, survey sayfasında kalınıyor...');
    }
    
    skipToChatPage() {
        // Survey container'ı gizle
        if (this.surveyContainer) {
            this.surveyContainer.style.display = 'none';
        }
        
        // Chat container'ı göster
        if (this.chatContainer) {
            this.chatContainer.style.display = 'block';
        }
        
        // İstatistik butonunu göster
        if (this.showStatsBtn) {
            this.showStatsBtn.style.display = 'flex';
        }
        
        console.log('Chat sayfasına geçildi');
    }
    
    handleLogout() {
        // LocalStorage'dan kullanıcı bilgilerini temizle
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userInfo');
        
        // Login sayfasına yönlendir
        window.location.href = '/login';
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new EducationPlatform();
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


document.addEventListener('DOMContentLoaded', () => {
    const pdfBtn = document.getElementById('pdf-download-btn');
    if (!pdfBtn) return;

    pdfBtn.addEventListener('click', () => {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (!userInfo || !userInfo.user_id) {
            alert("Lütfen önce giriş yapınız.");
            return;
        }

        const userId = userInfo.user_id;
        const pdfUrl = `/export-pdf/${userId}`;

        // Yeni sekmede indir
        window.open(pdfUrl, "_blank");
    });
});
