/**
 * Number Prediction Game Module
 */
const NumberGame = {
    engine: null,
    historyLog: [],

    init() {
        this.engine = new PredictionEngine(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
        this.historyLog = [];
    },

    play(number) {
        const numStr = String(number);
        const prediction = this.engine.predict();
        this.engine.recordMove(numStr);
        const stats = this.engine.getStats();
        const correct = prediction.prediction === numStr;

        const entry = {
            round: this.historyLog.length + 1,
            playerChoice: numStr,
            aiPrediction: prediction.prediction,
            correct,
            confidence: prediction.confidence
        };
        this.historyLog.push(entry);

        return { ...entry, engineStats: stats };
    },

    reset() {
        this.init();
    },

    render() {
        const t = I18N.t.bind(I18N);
        const stats = this.engine ? this.engine.getStats() : { accuracy: 0, totalMoves: 0 };

        let numberBtns = '';
        for (let i = 1; i <= 10; i++) {
            numberBtns += `
                <button class="number-btn" onclick="NumberGame.handlePlay(${i})" id="num-btn-${i}">
                    ${i}
                </button>`;
        }

        return `
        <div class="game-container" id="number-game">
            <button class="back-btn" onclick="App.showHome()">
                ${t('backHome')}
            </button>
            <div class="game-header">
                <h2 class="game-title">${t('numberTitle')}</h2>
                <p class="game-status" id="number-status">${t('ready')}</p>
            </div>

            <div class="ai-prediction-display hidden" id="number-prediction-display">
                <span class="prediction-label">${t('aiPrediction')}</span>
                <span class="prediction-value" id="number-ai-prediction">?</span>
                <div class="confidence-bar">
                    <div class="confidence-fill" id="number-confidence"></div>
                </div>
                <span class="confidence-label" id="number-confidence-text">${t('confidence')}: 0%</span>
            </div>

            <h3 class="pick-label">${t('pickNumber')}</h3>
            <div class="number-grid">
                ${numberBtns}
            </div>

            <div class="result-display hidden" id="number-result">
                <div class="result-battle">
                    <div class="result-side">
                        <span class="result-label">${t('yourChoice')}</span>
                        <span class="result-emoji result-number" id="number-player-choice"></span>
                    </div>
                    <span class="result-vs">VS</span>
                    <div class="result-side">
                        <span class="result-label">${t('aiPrediction')}</span>
                        <span class="result-emoji result-number" id="number-ai-choice"></span>
                    </div>
                </div>
                <div class="result-message" id="number-result-msg"></div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-value" id="number-accuracy">${stats.accuracy}%</span>
                    <span class="stat-label">${t('accuracy')}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value" id="number-total">${this.historyLog.length}</span>
                    <span class="stat-label">${t('totalRounds')}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value" id="number-correct">${stats.correctPredictions || 0}</span>
                    <span class="stat-label">${t('aiCorrect')}</span>
                </div>
            </div>

            <div class="frequency-chart" id="number-freq-chart">
                <h3>${t('statsTitle')}</h3>
                <div class="freq-bars" id="number-freq-bars"></div>
            </div>

            <div class="history-section">
                <h3>${t('predictionHistory')}</h3>
                <div class="history-log" id="number-history"></div>
            </div>

            <button class="reset-btn" onclick="NumberGame.handleReset()">
                ${t('reset')}
            </button>
        </div>`;
    },

    handlePlay(number) {
        const t = I18N.t.bind(I18N);
        const result = this.play(number);

        // Update status
        const statusEl = document.getElementById('number-status');
        if (result.correct) {
            statusEl.textContent = t('correct');
            statusEl.className = 'game-status status-correct';
        } else {
            statusEl.textContent = t('wrong');
            statusEl.className = 'game-status status-wrong';
        }

        // Show AI prediction display
        const predDisplay = document.getElementById('number-prediction-display');
        predDisplay.classList.remove('hidden');

        // Show result
        const resultDisplay = document.getElementById('number-result');
        resultDisplay.classList.remove('hidden');
        resultDisplay.classList.add('result-animate');

        document.getElementById('number-player-choice').textContent = result.playerChoice;
        document.getElementById('number-ai-choice').textContent = result.aiPrediction;

        const resultMsg = document.getElementById('number-result-msg');
        if (result.correct) {
            resultMsg.textContent = t('correct');
            resultMsg.className = 'result-message result-loss';
        } else {
            resultMsg.textContent = t('wrong');
            resultMsg.className = 'result-message result-win';
        }

        // Update stats
        document.getElementById('number-accuracy').textContent = result.engineStats.accuracy + '%';
        document.getElementById('number-total').textContent = this.historyLog.length;
        document.getElementById('number-correct').textContent = result.engineStats.correctPredictions;

        // Update prediction for next round
        const nextPrediction = this.engine.predict();
        document.getElementById('number-ai-prediction').textContent = '🧠';
        const confPercent = (nextPrediction.confidence * 100).toFixed(0);
        document.getElementById('number-confidence').style.width = confPercent + '%';
        document.getElementById('number-confidence-text').textContent = t('confidence') + ': ' + confPercent + '%';

        // Animate button
        document.querySelectorAll('.number-btn').forEach(b => b.classList.remove('selected'));
        document.getElementById('num-btn-' + number).classList.add('selected');

        // Update frequency chart
        this.renderFrequencyChart();

        // Update history
        this.renderHistory();

        setTimeout(() => {
            resultDisplay.classList.remove('result-animate');
        }, 600);
    },

    renderFrequencyChart() {
        const stats = this.engine.getStats();
        const container = document.getElementById('number-freq-bars');
        const maxFreq = Math.max(...Object.values(stats.frequencyMap), 1);

        container.innerHTML = Object.entries(stats.frequencyMap).map(([num, count]) => `
            <div class="freq-bar-wrapper">
                <div class="freq-bar" style="height: ${(count / maxFreq) * 100}%"></div>
                <span class="freq-bar-label">${num}</span>
            </div>
        `).join('');
    },

    renderHistory() {
        const t = I18N.t.bind(I18N);
        const container = document.getElementById('number-history');
        const recent = this.historyLog.slice(-10).reverse();

        container.innerHTML = recent.map(entry => `
            <div class="history-entry ${entry.correct ? 'history-correct' : 'history-wrong'}">
                <span class="history-round">#${entry.round}</span>
                <span class="history-move">${entry.playerChoice}</span>
                <span class="history-prediction">${entry.correct ? '🧠' : '❌'} → ${entry.aiPrediction}</span>
            </div>
        `).join('');
    },

    handleReset() {
        this.reset();
        document.getElementById('app').innerHTML = this.render();
    }
};
