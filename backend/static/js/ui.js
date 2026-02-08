// UI Utilities and Auth handlers (moved from auth.js)
// Expects window.APP_URLS to be defined by the template (profile/login/home)

const Validators = {
    email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    username: (username) => username && username.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(username),
    password: (password) => password && password.length >= 8,
    passwordStrength: (password) => {
        let strength = 0;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[!@#$%^&*]/.test(password)) strength++;
        return strength;
    },
    passwordsMatch: (pwd1, pwd2) => pwd1 === pwd2 && pwd1.length > 0
};

const MessageHandler = {
    show: (containerId, messageId, text, type = 'error') => {
        const container = document.getElementById(containerId);
        const message = document.getElementById(messageId);
        if (!container || !message) return;
        const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
        const textColor = type === 'success' ? 'text-green-600' : 'text-red-600';
        message.className = `w-full rounded-2xl py-2 px-4 font-bold text-xs flex items-center ${bgColor} border ${textColor}`;
        message.innerText = text;
        container.classList.remove('hidden');
    },
    hide: (containerId) => {
        const container = document.getElementById(containerId);
        if (container) container.classList.add('hidden');
    }
};

const APIClient = {
    login: async (username, password) => {
        const response = await fetch('/api/auth/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return { ok: response.ok, data: await response.json() };
    },
    register: async (userData) => {
        const response = await fetch('/api/auth/register/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return { ok: response.ok, data: await response.json() };
    },
    getProfile: async (token) => {
        const response = await fetch('/api/auth/profile/', {
            headers: { 'Authorization': `Token ${token}` }
        });
        return { ok: response.ok, data: await response.json() };
    }
};

const FormManager = {
    hideMessageOnInput: (fieldIds, containerId) => {
        fieldIds.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.addEventListener('input', () => MessageHandler.hide(containerId));
        });
    },
    getFormData: (fieldIds) => {
        const data = {};
        fieldIds.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) data[fieldId] = field.value;
        });
        return data;
    },
    reset: (formId) => {
        const form = document.getElementById(formId);
        if (form) form.reset();
    },
    setLoading: (buttonSelector, isLoading) => {
        const button = document.querySelector(buttonSelector);
        if (!button) return;
        button.disabled = isLoading;
        button.style.opacity = isLoading ? '0.6' : '1';
        button.innerHTML = isLoading
            ? '<span class="flex items-center gap-2"><i class="fas fa-spinner fa-spin"></i>Processing...</span>'
            : (button.dataset.defaultHtml || '<span>Register</span><i class="fas fa-arrow-right"></i>');
    }
};

// LOGIN handler
function attachLoginHandler() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    FormManager.hideMessageOnInput(['username', 'password'], 'errorContainer');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        if (!username || !password) {
            MessageHandler.show('errorContainer', 'errorMsg', 'Please fill in all fields', 'error');
            return;
        }
        if (!Validators.username(username)) {
            MessageHandler.show('errorContainer', 'errorMsg', 'Invalid username format', 'error');
            return;
        }
        try {
            FormManager.setLoading('button[type="submit"]', true);
            const result = await APIClient.login(username, password);
            if (result.ok) {
                localStorage.setItem('userToken', result.data.token);
                const redirect = window.APP_URLS && window.APP_URLS.profile ? window.APP_URLS.profile : '/profile/';
                window.location.href = redirect;
            } else {
                MessageHandler.show('errorContainer', 'errorMsg', result.data.detail || 'Invalid credentials', 'error');
            }
        } catch (err) {
            console.error('Login error:', err);
            MessageHandler.show('errorContainer', 'errorMsg', 'Network error. Please try again.', 'error');
        } finally {
            FormManager.setLoading('button[type="submit"]', false);
        }
    });
}

// REGISTER handler
function attachRegisterHandler() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;
    const fieldIds = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm'];
    FormManager.hideMessageOnInput(fieldIds, 'messageContainer');
    // preserve button inner html for later
    const btn = document.querySelector('button[type="submit"]');
    if (btn && !btn.dataset.defaultHtml) btn.dataset.defaultHtml = btn.innerHTML;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = FormManager.getFormData(fieldIds);
        if (!formData.username || !formData.email || !formData.password || !formData.password_confirm) {
            MessageHandler.show('messageContainer', 'message', 'Please fill in all required fields', 'error');
            return;
        }
        if (!Validators.username(formData.username)) {
            MessageHandler.show('messageContainer', 'message', 'Username must be 3+ characters, alphanumeric only', 'error');
            return;
        }
        if (!Validators.email(formData.email)) {
            MessageHandler.show('messageContainer', 'message', 'Invalid email address', 'error');
            return;
        }
        if (!Validators.password(formData.password)) {
            MessageHandler.show('messageContainer', 'message', 'Password must be at least 8 characters', 'error');
            return;
        }
        if (!Validators.passwordsMatch(formData.password, formData.password_confirm)) {
            MessageHandler.show('messageContainer', 'message', 'Passwords do not match', 'error');
            return;
        }
        try {
            FormManager.setLoading('button[type="submit"]', true);
            const result = await APIClient.register(formData);
            if (result.ok) {
                MessageHandler.show('messageContainer', 'message', result.data.message || 'Registration successful! Redirecting...', 'success');
                FormManager.reset('registerForm');
                const loginUrl = window.APP_URLS && window.APP_URLS.login ? window.APP_URLS.login : '/login/';
                setTimeout(() => { window.location.href = loginUrl; }, 1500);
            } else {
                const errorText = result.data.detail || Object.values(result.data || {}).flat().join(' ') || 'Registration failed';
                MessageHandler.show('messageContainer', 'message', errorText, 'error');
            }
        } catch (err) {
            console.error('Register error:', err);
            MessageHandler.show('messageContainer', 'message', 'Network error. Please try again.', 'error');
        } finally {
            FormManager.setLoading('button[type="submit"]', false);
        }
    });
}

// Sidebar & profile initialization (for base template)
async function initSidebarAndUser() {
    const token = localStorage.getItem('userToken');
    const sidebar = document.getElementById('sidebar');
    if (!token || !sidebar) return;
    try {
        const response = await fetch('/api/auth/profile/', { headers: { 'Authorization': `Token ${token}` } });
        if (response.ok) {
            sidebar.classList.remove('hidden');
            const data = await response.json();
            const initials = data.username ? data.username.charAt(0).toUpperCase() : '';
            const initialsEl = document.querySelector('#UserInitials');
            const nameEl = document.querySelector('#UserName');
            if (initialsEl) initialsEl.innerText = initials;
            if (nameEl) nameEl.innerText = data.username;
        } else {
            localStorage.removeItem('userToken');
        }
    } catch (err) {
        console.error('Auth check failed', err);
    }
}

// loadProfile used by profile page
async function loadProfile() {
    const token = localStorage.getItem('userToken');
    if (!token) {
        const loginUrl = window.APP_URLS && window.APP_URLS.login ? window.APP_URLS.login : '/login/';
        window.location.href = loginUrl;
        return;
    }
    try {
        const response = await fetch('/api/auth/profile/', { method: 'GET', headers: { 'Authorization': 'Token ' + token, 'Content-Type': 'application/json' } });
        if (!response.ok) {
            if (response.status === 401) logout();
            throw new Error('Failed to load profile');
        }
        const data = await response.json();
        const setText = (sel, value) => { const el = document.querySelector(sel); if (el) el.innerText = value; };
        setText('#Username', data.username);
        setText('#Email', data.email);
        setText('#Top', data.top || '-');
        setText('#Bottom', data.bottom || '-');
        setText('#Shoe', data.shoe_size || '-');
        setText('#Gender', data.gender || '-');
        setText('#Prefs', data.preferences || 'No preferences set.');
        setText('#ProfileP', data.username ? data.username.charAt(0).toUpperCase() : '');
        const loading = document.querySelector('#loading'); if (loading) loading.style.display = 'none';
    } catch (error) {
        console.error(error);
        const loading = document.querySelector('#loading'); if (loading) loading.style.display = 'none';
        const errMsg = document.querySelector('#errorMsg'); if (errMsg) errMsg.innerText = 'Error loading profile. Please try refreshing.';
    }
}

function logout() {
    localStorage.removeItem('userToken');
    const loginUrl = window.APP_URLS && window.APP_URLS.login ? window.APP_URLS.login : '/login/';
    window.location.href = loginUrl;
}

// Sidebar component for Alpine.js
function sidebarComponent() {
    return {
        isHome: window.location.pathname === (window.APP_URLS && window.APP_URLS.home ? new URL(window.APP_URLS.home, window.location.origin).pathname : '/'),
        isWardrobe: window.location.pathname === '#',
        isProfile: window.location.pathname === (window.APP_URLS && window.APP_URLS.profile ? new URL(window.APP_URLS.profile, window.location.origin).pathname : '/profile/')
    };
}

// Expose functions globally for Alpine.js and other uses (must be before Alpine initializes)
window.loadProfile = loadProfile;
window.logout = logout;
window.sidebarComponent = sidebarComponent;

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    attachLoginHandler();
    attachRegisterHandler();
    initSidebarAndUser();
});
