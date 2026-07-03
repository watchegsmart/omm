// ==================== SHARED LANGUAGE & NAV MODULE ====================
// Used by index.html and registration.html

(function() {
    // ── Language config ──
    const languages = {
        ar: { name: 'العربية', dir: 'rtl' },
        fr: { name: 'Français', dir: 'ltr' },
        en: { name: 'English', dir: 'ltr' },
        es: { name: 'Español', dir: 'ltr' },
        de: { name: 'Deutsch', dir: 'ltr' },
        nl: { name: 'Nederlands', dir: 'ltr' },
        it: { name: 'Italiano', dir: 'ltr' }
    };

    // Default to Arabic (ar) if no saved preference
    let currentLanguage = localStorage.getItem('language') || 'ar';
    let selectedLanguage = currentLanguage;

    // ── Apply language on load ──
    function setPageDirection(lang) {
        const html = document.documentElement;
        const direction = (languages[lang] && languages[lang].dir) || 'ltr';
        html.setAttribute('dir', direction);
        html.setAttribute('lang', lang);
    }

    function updateAllText(lang) {
        // Text content elements
        document.querySelectorAll('[data-ar]').forEach(function(el) {
            if (el.tagName === 'INPUT') {
                var ph = el.getAttribute('data-' + lang + '-placeholder');
                if (ph) el.placeholder = ph;
            } else {
                var txt = el.getAttribute('data-' + lang);
                if (txt) el.textContent = txt;
            }
        });
        // Input placeholders
        document.querySelectorAll('input[data-ar-placeholder]').forEach(function(input) {
            var ph = input.getAttribute('data-' + lang + '-placeholder');
            if (ph) input.placeholder = ph;
        });
    }

    function updateLanguage(lang) {
        if (!languages[lang]) lang = 'ar';
        currentLanguage = lang;
        localStorage.setItem('language', lang);
        setPageDirection(lang);
        updateAllText(lang);
        // Update selected state in language page
        updateLanguageSelection();
    }

    function updateLanguageSelection() {
        document.querySelectorAll('.language-option').forEach(function(opt) {
            opt.classList.remove('selected');
            if (opt.getAttribute('data-lang') === selectedLanguage) {
                opt.classList.add('selected');
            }
        });
    }

    function selectLanguage(lang) {
        if (languages[lang]) {
            selectedLanguage = lang;
            updateLanguageSelection();
        }
    }

    // ── Page navigation (for pages that embed multiple "pages") ──
    function showPage(pageName) {
        document.querySelectorAll('.page').forEach(function(p) {
            p.classList.remove('active');
        });
        var el = document.getElementById(pageName);
        if (el) el.classList.add('active');
    }

    function updateActiveNav(page) {
        document.querySelectorAll('.nav-item').forEach(function(item) {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === page) {
                item.classList.add('active');
            }
        });
    }

    // ── Wire bottom-nav clicks ──
    function setupNav(homePageId) {
        document.querySelectorAll('.nav-item').forEach(function(item) {
            item.addEventListener('click', function() {
                var page = this.getAttribute('data-page');
                if (page === 'home') {
                    // If on a standalone page, go to index
                    if (!document.getElementById('loginPage') && !document.getElementById('homePage')) {
                        window.location.href = 'index.html';
                    } else {
                        showPage(homePageId || 'loginPage');
                        updateActiveNav('home');
                    }
                } else if (page === 'agencies') {
                    // Placeholder – stays on home
                    if (!document.getElementById('loginPage') && !document.getElementById('homePage')) {
                        window.location.href = 'index.html';
                    } else {
                        showPage(homePageId || 'loginPage');
                        updateActiveNav('agencies');
                    }
                } else if (page === 'menu') {
                    if (document.getElementById('menuPage')) {
                        showPage('menuPage');
                        updateActiveNav('menu');
                    } else if (document.getElementById('loginPage')) {
                        window.location.href = 'login.html';
                    }
                }
            });
        });
    }

    // ── Wire language page buttons ──
    function setupLanguagePage(returnPageId) {
        document.querySelectorAll('.language-option').forEach(function(opt) {
            opt.addEventListener('click', function() {
                selectLanguage(this.getAttribute('data-lang'));
            });
        });

        var confirmBtn = document.getElementById('confirmBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function() {
                updateLanguage(selectedLanguage);
                showPage(returnPageId || 'settingsPage');
            });
        }

        var cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                showPage(returnPageId || 'settingsPage');
            });
        }
    }

    // ── Wire settings & menu back-buttons ──
    function setupMenuAndSettings() {
        var backBtn = document.getElementById('backBtn');
        if (backBtn) backBtn.addEventListener('click', function() {
            showPage('homePage');
            updateActiveNav('home');
        });

        var backBtn2 = document.getElementById('backBtn2');
        if (backBtn2) backBtn2.addEventListener('click', function() {
            showPage('menuPage');
            updateActiveNav('menu');
        });

        var backBtn3 = document.getElementById('backBtn3');
        if (backBtn3) backBtn3.addEventListener('click', function() {
            showPage('settingsPage');
        });

        var settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) settingsBtn.addEventListener('click', function() {
            showPage('settingsPage');
        });

        var languageBtn = document.getElementById('languageBtn');
        if (languageBtn) languageBtn.addEventListener('click', function() {
            selectedLanguage = currentLanguage;
            updateLanguageSelection();
            showPage('languagePage');
        });
    }

    // ── Public init called by each page ──
    window.LangNav = {
        init: function(opts) {
            opts = opts || {};
            document.addEventListener('DOMContentLoaded', function() {
                updateLanguage(currentLanguage);
                if (opts.setupNav !== false) setupNav(opts.homePageId);
                if (opts.setupMenu !== false) setupMenuAndSettings();
                if (opts.setupLangPage !== false) setupLanguagePage(opts.langReturnPage);
                if (opts.activeNav) updateActiveNav(opts.activeNav);
                if (opts.activePage) showPage(opts.activePage);
            });
        },
        updateLanguage: updateLanguage,
        getCurrentLanguage: function() { return currentLanguage; }
    };
})();
