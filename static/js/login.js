class LoginManager {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.createParticles();
    }

    initializeElements() {
        // Forms
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.loginCard = document.getElementById('login-card');
        this.registerCard = document.getElementById('register-card');
        
        // Inputs
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.regUsernameInput = document.getElementById('reg-username');
        this.regEmailInput = document.getElementById('reg-email');
        this.regPasswordInput = document.getElementById('reg-password');
        
        // Buttons
        this.loginBtn = document.getElementById('login-btn');
        this.registerBtn = document.getElementById('register-btn');
        this.passwordToggle = document.getElementById('password-toggle');
        this.regPasswordToggle = document.getElementById('reg-password-toggle');
        
        // Links
        this.showRegisterLink = document.getElementById('show-register');
        this.showLoginLink = document.getElementById('show-login');
        
        // Messages
        this.authMessages = document.getElementById('auth-messages');
        this.registerMessages = document.getElementById('register-messages');
        this.loadingOverlay = document.getElementById('loading-overlay');
    }

    initializeEventListeners() {
        // Form submissions
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        
        // Password toggles
        this.passwordToggle.addEventListener('click', () => this.togglePassword('password'));
        this.regPasswordToggle.addEventListener('click', () => this.togglePassword('reg-password'));
        
        // Form switching
        this.showRegisterLink.addEventListener('click', (e) => this.switchToRegister(e));
        this.showLoginLink.addEventListener('click', (e) => this.switchToLogin(e));
        
        // Input validation
        this.usernameInput.addEventListener('blur', () => this.validateUsername(this.usernameInput));
        this.passwordInput.addEventListener('blur', () => this.validatePassword(this.passwordInput));
        this.regUsernameInput.addEventListener('blur', () => this.validateUsername(this.regUsernameInput));
        this.regEmailInput.addEventListener('blur', () => this.validateEmail(this.regEmailInput));
        this.regPasswordInput.addEventListener('blur', () => this.validatePassword(this.regPasswordInput));
    }

    createParticles() {
        const particlesContainer = document.querySelector('.particles');
        
        // Create floating particles
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 100 + 50}px;
                height: ${Math.random() * 100 + 50}px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                animation: float ${Math.random() * 10 + 15}s infinite ease-in-out;
                animation-delay: ${Math.random() * 5}s;
            `;
            particlesContainer.appendChild(particle);
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value;
        
        if (!this.validateLoginForm(username, password)) {
            return;
        }
        
        this.setLoadingState(this.loginBtn, true);
        this.showLoadingOverlay(true);
        this.clearMessages();
        
        try {
            const response = await fetch('/auth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
            });
            
            if (response.ok) {
                this.showMessage('Giriş başarılı! Yönlendiriliyor...', 'success');
                
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
                
            } else {
                const errorData = await response.json();
                this.showMessage(errorData.detail || 'Kullanıcı adı veya şifre hatalı!', 'error');
                this.shakeCard(this.loginCard);
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Bağlantı hatası oluştu. Lütfen tekrar deneyin.', 'error');
            this.shakeCard(this.loginCard);
        } finally {
            this.setLoadingState(this.loginBtn, false);
            this.showLoadingOverlay(false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const username = this.regUsernameInput.value.trim();
        const email = this.regEmailInput.value.trim();
        const password = this.regPasswordInput.value;
        
        if (!this.validateRegisterForm(username, email, password)) {
            return;
        }
        
        this.setLoadingState(this.registerBtn, true);
        this.showLoadingOverlay(true);
        this.clearMessages(true);
        
        try {
            const response = await fetch('/auth/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password
                })
            });
            
            if (response.ok) {
                this.showMessage('Kayıt başarılı! Giriş yapabilirsiniz.', 'success', true);
                
                // Reset form and switch to login
                this.registerForm.reset();
                setTimeout(() => {
                    this.switchToLogin();
                }, 2000);
                
            } else {
                const errorData = await response.json();
                this.showMessage(errorData.detail || 'Kayıt başarısız! Lütfen tekrar deneyin.', 'error', true);
                this.shakeCard(this.registerCard);
            }
            
        } catch (error) {
            console.error('Register error:', error);
            this.showMessage('Bağlantı hatası oluştu. Lütfen tekrar deneyin.', 'error', true);
            this.shakeCard(this.registerCard);
        } finally {
            this.setLoadingState(this.registerBtn, false);
            this.showLoadingOverlay(false);
        }
    }

    showMessage(message, type = 'info', isRegister = false) {
        const container = isRegister ? this.registerMessages : this.authMessages;
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message ${type}`;
        
        const icon = this.getMessageIcon(type);
        messageDiv.innerHTML = `${icon} ${message}`;
        
        container.appendChild(messageDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    clearMessages(isRegister = false) {
        const container = isRegister ? this.registerMessages : this.authMessages;
        container.innerHTML = '';
    }

    getMessageIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-times-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        return icons[type] || icons.info;
    }

    validateLoginForm(username, password) {
        let isValid = true;
        
        if (!username) {
            this.setFieldError(this.usernameInput, 'Kullanıcı adı gerekli');
            isValid = false;
        } else {
            this.setFieldSuccess(this.usernameInput);
        }
        
        if (!password) {
            this.setFieldError(this.passwordInput, 'Şifre gerekli');
            isValid = false;
        } else {
            this.setFieldSuccess(this.passwordInput);
        }
        
        return isValid;
    }

    validateRegisterForm(username, email, password) {
        let isValid = true;
        
        if (!this.validateUsername(this.regUsernameInput)) isValid = false;
        if (!this.validateEmail(this.regEmailInput)) isValid = false;
        if (!this.validatePassword(this.regPasswordInput)) isValid = false;
        
        return isValid;
    }

    validateUsername(input) {
        const username = input.value.trim();
        
        if (!username) {
            this.setFieldError(input, 'Kullanıcı adı gerekli');
            return false;
        } else if (username.length < 3) {
            this.setFieldError(input, 'Kullanıcı adı en az 3 karakter olmalı');
            return false;
        } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            this.setFieldError(input, 'Sadece harf, rakam ve _ kullanabilirsiniz');
            return false;
        } else {
            this.setFieldSuccess(input);
            return true;
        }
    }

    validateEmail(input) {
        const email = input.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            this.setFieldError(input, 'E-posta gerekli');
            return false;
        } else if (!emailRegex.test(email)) {
            this.setFieldError(input, 'Geçerli bir e-posta adresi girin');
            return false;
        } else {
            this.setFieldSuccess(input);
            return true;
        }
    }

    validatePassword(input) {
        const password = input.value;
        
        if (!password) {
            this.setFieldError(input, 'Şifre gerekli');
            return false;
        } else if (password.length < 6) {
            this.setFieldError(input, 'Şifre en az 6 karakter olmalı');
            return false;
        } else {
            this.setFieldSuccess(input);
            return true;
        }
    }

    setFieldError(input, message) {
        const formGroup = input.closest('.form-group');
        formGroup.classList.remove('success');
        formGroup.classList.add('error');
        
        let errorElement = formGroup.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            formGroup.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    setFieldSuccess(input) {
        const formGroup = input.closest('.form-group');
        formGroup.classList.remove('error');
        formGroup.classList.add('success');
        
        const errorElement = formGroup.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    togglePassword(inputId) {
        const input = document.getElementById(inputId);
        const toggle = input.parentElement.querySelector('.password-toggle i');
        
        if (input.type === 'password') {
            input.type = 'text';
            toggle.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            toggle.className = 'fas fa-eye';
        }
    }

    switchToRegister(e) {
        e.preventDefault();
        this.clearMessages();
        this.clearMessages(true);
        
        this.loginCard.style.display = 'none';
        this.registerCard.style.display = 'block';
        this.registerCard.style.animation = 'slideInRight 0.5s ease-out';
    }

    switchToLogin(e) {
        if (e) e.preventDefault();
        this.clearMessages();
        this.clearMessages(true);
        
        this.registerCard.style.display = 'none';
        this.loginCard.style.display = 'block';
        this.loginCard.style.animation = 'slideInRight 0.5s ease-out';
    }

    setLoadingState(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            const isLogin = button.id === 'login-btn';
            button.innerHTML = `
                <div class="spinner"></div>
                <span>${isLogin ? 'Giriş yapılıyor...' : 'Kayıt yapılıyor...'}</span>
            `;
        } else {
            button.disabled = false;
            const isLogin = button.id === 'login-btn';
            button.innerHTML = `
                <i class="fas fa-${isLogin ? 'sign-in-alt' : 'user-plus'}"></i>
                <span>${isLogin ? 'Giriş Yap' : 'Kayıt Ol'}</span>
            `;
        }
    }

    showLoadingOverlay(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    shakeCard(card) {
        card.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            card.style.animation = '';
        }, 500);
    }
}

// Additional CSS animations
const additionalStyles = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
}
`;

// Add additional styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize the login manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});