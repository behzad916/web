/**
 * Color Prediction Game Module
 */
const ColorGame = {
    engine: null,
    historyLog: [],

    colors: {
        red: { hex: '#FF4B6E', name: 'red', emoji: '🔴' },
        blue: { hex: '#4B8BFF', name: 'blue', emoji: '🔵' },
        green: { hex: '#4BFF8B', name: 'green', emoji: '🟢' },
        yellow: { hex: '#FFD84B', name: 'yellow', emoji: '🟡' },
        purple: { hex: '#B44BFF', name: 'purple', emoji: '🟣' },
        orange: { hex: '#FF8B4B', name: 'orange', emoji: '🟠' },
    },

    colorNames: {
        en: { red: 'Red', blue: 'Blue', green: 'Green', yellow: 'Yellow', purple: 'Purple', orange: 'Orange' },
        es: { red: 'Rojo', blue: 'Azul', green: 'Verde', yellow: 'Amarillo', purple: 'Morado', orange: 'Naranja' },
        fr: { red: 'Rouge', blue: 'Bleu', green: 'Vert', yellow: 'Jaune', purple: 'Violet', orange: 'Orange' },
        de: { red: 'Rot', blue: 'Blau', green: 'Grün', yellow: 'Gelb', purple: 'Lila', orange: 'Orange' },
        hi: { red: 'लाल', blue: 'नीला', green: 'हरा', yellow: 'पीला', purple: 'बैंगनी', orange: 'नारंगी' },
        ar: { red: 'أحمر', blue: 'أزرق', green: 'أخضر', yellow: 'أصفر', purple: 'بنفسجي', orange: 'برتقالي' },
        zh: { red: '红', blue: '蓝', green: '绿', yellow: '黄', purple: '紫', orange: '橙' },
        ja: { red: '赤', blue: '青', green: '緑', yellow: '黄', purple: '紫', orange: 'オレンジ' },
        ko: { red: '빨강', blue: '파랑', green: '초록', yellow: '노랑', purple: '보라', orange: '주황' },
        pt: { red: 'Vermelho', blue: 'Azul', green: 'Verde', yellow: 'Amarelo', purple: 'Roxo', orange: 'Laranja' },
        ru: { red: 'Красный', blue: 'Синий', green: 'Зелёный', yellow: 'Жёлтый', purple: 'Фиолетовый', orange: 'Оранжевый' },
        tr: { red: 'Kırmızı', blue: 'Mavi', green: 'Yeşil', yellow: 'Sarı', purple: 'Mor', orange: 'Turuncu' },
        fa: { red: 'قرمز', blue: 'آبی', green: 'سبز', yellow: 'زرد', purple: 'بنفش', orange: 'نارنجی' },
        ur: { red: 'سرخ', blue: 'نیلا', green: 'سبز', yellow: 'پیلا', purple: 'جامنی', orange: 'نارنجی' },
    },

    getColorName(colorKey) {
        const lang = I18N.currentLang;
        return (this.colorNames[lang] && this.colorNames[lang][colorKey]) ||
            this.colorNames.en[colorKey] || colorKey;
    },

    init() {
        this.engine = new PredictionEngine(Object.keys(this.colors));
        this.historyLog = [];
    },

    play(colorKey) {
        const prediction = this.engine.predict();
        this.engine.recordMove(colorKey);
        const stats = this.engine.getStats();
        const correct = prediction.prediction === colorKey;

        const entry = {
            round: this.historyLog.length + 1,
            playerChoice: colorKey,
            aiPrediction: prediction.prediction,
            correct,
            confidence: prediction.confidence
        };
        this.historyLog.push(entry);

        return { ...entry, engineStats: stats };
    },

    reset() { this.init(); },

    render() {
        const t = I18N.t.bind(I18N);
        const stats = this.engine ? this.engine.getStats() : { accuracy: 0, totalMoves: 0 };

        const colorBtns = Object.entries(this.colors).map(([key, color]) => `
            <button class="color-btn" onclick="ColorGame.handlePlay('${key}')" id="color-btn-${key}"
                    style="--btn-color: ${color.hex}">
                <span class="color-circle" style="background: ${color.hex}"></span>
                <span class="color-label">${this.getColorName(key)}</span>
            </button>
        `).join('');

        return `
        <div class="game-container" id="color-game">
            <button class="back-btn" onclick="App.showHome()">
                ${t('backHome')}
            </button>
            <div class="game-header">
                <h2 class="game-title">${t('colorTitle')}</h2>
                <p class="game-status" id="color-status">${t('ready')}</p>
            </div>

            <h3 class="pick-label">${t('pickColor')}</h3>
            <div class="color-grid">
                ${colorBtns}
            </div>

            <div class="result-display hidden" id="color-result">
                <div class="result-battle">
                    <div class="result-side">
                        <span class="result-label">${t('yourChoice')}</span>
                        <span class="result-emoji" id="color-player-choice"></span>
                    </div>
                    <span class="result-vs">VS</span>
                    <div class="result-side">
                        <span class="result-label">${t('aiPrediction')}</span>
                        <span class="result-emoji" id="color-ai-choice"></span>
                    </div>
                </div>
                <div class="result-message" id="color-result-msg"></div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-value" id="color-accuracy">${stats.accuracy}%</span>
                    <span class="stat-label">${t('accuracy')}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value" id="color-total">${this.historyLog.length}</span>
                    <span class="stat-label">${t('totalRounds')}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value" id="color-correct">${stats.correctPredictions || 0}</span>
                    <span class="stat-label">${t('aiCorrect')}</span>
                </div>
            </div>

            <div class="frequency-chart" id="color-freq-chart">
                <h3>${t('statsTitle')}</h3>
                <div class="color-freq-bars" id="color-freq-bars"></div>
            </div>

            <div class="history-section">
                <h3>${t('predictionHistory')}</h3>
                <div class="history-log" id="color-history"></div>
            </div>

            <button class="reset-btn" onclick="ColorGame.handleReset()">
                ${t('reset')}
            </button>
        </div>`;
    },

    handlePlay(colorKey) {
        const t = I18N.t.bind(I18N);
        const result = this.play(colorKey);

        // Status
        const statusEl = document.getElementById('color-status');
        if (result.correct) {
            statusEl.textContent = t('correct');
            statusEl.className = 'game-status status-correct';
        } else {
            statusEl.textContent = t('wrong');
            statusEl.className = 'game-status status-wrong';
        }

        // Result
        const resultDisplay = document.getElementById('color-result');
        resultDisplay.classList.remove('hidden');
        resultDisplay.classList.add('result-animate');

        document.getElementById('color-player-choice').innerHTML =
            `<span class="color-dot" style="background:${this.colors[colorKey].hex}"></span>`;
        document.getElementById('color-ai-choice').innerHTML =
            `<span class="color-dot" style="background:${this.colors[result.aiPrediction].hex}"></span>`;

        const resultMsg = document.getElementById('color-result-msg');
        if (result.correct) {
            resultMsg.textContent = t('correct');
            resultMsg.className = 'result-message result-loss';
        } else {
            resultMsg.textContent = t('wrong');
            resultMsg.className = 'result-message result-win';
        }

        // Stats
        document.getElementById('color-accuracy').textContent = result.engineStats.accuracy + '%';
        document.getElementById('color-total').textContent = this.historyLog.length;
        document.getElementById('color-correct').textContent = result.engineStats.correctPredictions;

        // Animate button
        document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
        document.getElementById('color-btn-' + colorKey).classList.add('selected');

        this.renderFrequencyChart();
        this.renderHistory();

        setTimeout(() => resultDisplay.classList.remove('result-animate'), 600);
    },

    renderFrequencyChart() {
        const stats = this.engine.getStats();
        const container = document.getElementById('color-freq-bars');
        const maxFreq = Math.max(...Object.values(stats.frequencyMap), 1);

        container.innerHTML = Object.entries(stats.frequencyMap).map(([color, count]) => `
            <div class="freq-bar-wrapper">
                <div class="freq-bar" style="height: ${(count / maxFreq) * 100}%; background: ${this.colors[color].hex}"></div>
                <span class="freq-bar-label">${this.colors[color].emoji}</span>
            </div>
        `).join('');
    },

    renderHistory() {
        const t = I18N.t.bind(I18N);
        const container = document.getElementById('color-history');
        const recent = this.historyLog.slice(-10).reverse();

        container.innerHTML = recent.map(entry => `
            <div class="history-entry ${entry.correct ? 'history-correct' : 'history-wrong'}">
                <span class="history-round">#${entry.round}</span>
                <span class="color-dot-small" style="background:${this.colors[entry.playerChoice].hex}"></span>
                <span class="history-prediction">${entry.correct ? '🧠' : '❌'}</span>
            </div>
        `).join('');
    },

    handleReset() {
        this.reset();
        document.getElementById('app').innerHTML = this.render();
    }
};
