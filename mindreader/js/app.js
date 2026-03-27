/**
 * MindReader — Main App Controller
 */
const App = {
    currentGame: null,

    init() {
        I18N.init();
        RPSGame.init();
        NumberGame.init();
        ColorGame.init();
        this.buildLanguageSelector();
        this.showHome();
        this.updateAllText();
    },

    buildLanguageSelector() {
        const selector = document.getElementById('lang-select');
        selector.innerHTML = Object.entries(I18N.languageNames).map(([code, name]) =>
            `<option value="${code}" ${code === I18N.currentLang ? 'selected' : ''}>${name}</option>`
        ).join('');

        selector.addEventListener('change', (e) => {
            I18N.setLanguage(e.target.value);
            this.updateAllText();
            // Re-render current view
            if (this.currentGame) {
                this.showGame(this.currentGame);
            } else {
                this.showHome();
            }
        });
    },

    updateAllText() {
        const t = I18N.t.bind(I18N);
        document.getElementById('header-title').textContent = t('appName');
        document.getElementById('header-lang-label').textContent = t('language') + ':';
    },

    showHome() {
        this.currentGame = null;
        const t = I18N.t.bind(I18N);

        document.getElementById('app').innerHTML = `
        <div class="home-container">
            <div class="hero-section">
                <div class="hero-brain">🧠</div>
                <h1 class="hero-title">${t('appName')}</h1>
                <p class="hero-tagline">${t('tagline')}</p>
                <p class="hero-subtitle">${t('subtitle')}</p>
            </div>

            <div class="how-it-works">
                <h2>${t('howItWorks')}</h2>
                <div class="steps-grid">
                    <div class="step-card">
                        <span class="step-icon">🎯</span>
                        <span class="step-num">1</span>
                        <p>${t('howStep1')}</p>
                    </div>
                    <div class="step-card">
                        <span class="step-icon">📊</span>
                        <span class="step-num">2</span>
                        <p>${t('howStep2')}</p>
                    </div>
                    <div class="step-card">
                        <span class="step-icon">🔗</span>
                        <span class="step-num">3</span>
                        <p>${t('howStep3')}</p>
                    </div>
                    <div class="step-card">
                        <span class="step-icon">🚀</span>
                        <span class="step-num">4</span>
                        <p>${t('howStep4')}</p>
                    </div>
                </div>
            </div>

            <h2 class="section-title">${t('selectGame')}</h2>
            <div class="game-cards">
                <div class="game-card rps-card" onclick="App.showGame('rps')">
                    <div class="card-icon">✊✋✌️</div>
                    <h3>${t('rpsTitle')}</h3>
                    <p>${t('rpsDesc')}</p>
                    <button class="play-btn">${t('play')}</button>
                </div>
                <div class="game-card number-card" onclick="App.showGame('number')">
                    <div class="card-icon">🔢</div>
                    <h3>${t('numberTitle')}</h3>
                    <p>${t('numberDesc')}</p>
                    <button class="play-btn">${t('play')}</button>
                </div>
                <div class="game-card color-card" onclick="App.showGame('color')">
                    <div class="card-icon">🎨</div>
                    <h3>${t('colorTitle')}</h3>
                    <p>${t('colorDesc')}</p>
                    <button class="play-btn">${t('play')}</button>
                </div>
            </div>
        </div>`;
    },

    showGame(game) {
        this.currentGame = game;
        const appEl = document.getElementById('app');

        switch (game) {
            case 'rps':
                appEl.innerHTML = RPSGame.render();
                break;
            case 'number':
                appEl.innerHTML = NumberGame.render();
                break;
            case 'color':
                appEl.innerHTML = ColorGame.render();
                break;
        }
    }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
