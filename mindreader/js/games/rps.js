/**
 * Rock-Paper-Scissors Game Module
 */
const RPSGame = {
    engine: null,
    stats: { wins: 0, losses: 0, draws: 0 },
    aiStreak: 0,
    historyLog: [],

    init() {
        this.engine = new PredictionEngine(['rock', 'paper', 'scissors']);
        this.stats = { wins: 0, losses: 0, draws: 0 };
        this.aiStreak = 0;
        this.historyLog = [];
    },

    getCounter(move) {
        const counters = { rock: 'paper', paper: 'scissors', scissors: 'rock' };
        return counters[move];
    },

    getEmoji(move) {
        const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
        return emojis[move] || '';
    },

    play(playerMove) {
        const prediction = this.engine.predict();
        const aiCounter = this.getCounter(prediction.prediction);

        // Determine winner
        let result;
        if (playerMove === aiCounter) {
            result = 'loss'; // AI wins — it predicted and countered correctly
            this.stats.losses++;
            this.aiStreak++;
        } else if (this.getCounter(playerMove) === aiCounter) {
            result = 'draw';
            this.stats.draws++;
            this.aiStreak = 0;
        } else {
            result = 'win'; // Player wins
            this.stats.wins++;
            this.aiStreak = 0;
        }

        this.engine.recordMove(playerMove);
        const stats = this.engine.getStats();

        const entry = {
            round: this.historyLog.length + 1,
            playerMove,
            aiPrediction: prediction.prediction,
            aiPlayed: aiCounter,
            result,
            confidence: prediction.confidence,
            predictionCorrect: prediction.prediction === playerMove
        };
        this.historyLog.push(entry);

        return {
            ...entry,
            engineStats: stats,
            gameStats: { ...this.stats },
            aiStreak: this.aiStreak
        };
    },

    reset() {
        this.init();
    },

    render() {
        const t = I18N.t.bind(I18N);
        const stats = this.engine ? this.engine.getStats() : { accuracy: 0, totalMoves: 0 };
        const totalGames = this.stats.wins + this.stats.losses + this.stats.draws;

        return `
        <div class="game-container" id="rps-game">
            <button class="back-btn" onclick="App.showHome()">
                ${t('backHome')}
            </button>
            <div class="game-header">
                <h2 class="game-title">${t('rpsTitle')}</h2>
                <p class="game-status" id="rps-status">${t('ready')}</p>
            </div>

            <div class="rps-choices">
                <button class="rps-btn" onclick="RPSGame.handlePlay('rock')" id="btn-rock">
                    <span class="rps-emoji">🪨</span>
                    <span class="rps-label">${t('rock')}</span>
                </button>
                <button class="rps-btn" onclick="RPSGame.handlePlay('paper')" id="btn-paper">
                    <span class="rps-emoji">📄</span>
                    <span class="rps-label">${t('paper')}</span>
                </button>
                <button class="rps-btn" onclick="RPSGame.handlePlay('scissors')" id="btn-scissors">
                    <span class="rps-emoji">✂️</span>
                    <span class="rps-label">${t('scissors')}</span>
                </button>
            </div>

            <div class="result-display hidden" id="rps-result">
                <div class="result-battle">
                    <div class="result-side">
                        <span class="result-label">${t('yourChoice')}</span>
                        <span class="result-emoji" id="rps-player-choice"></span>
                    </div>
                    <span class="result-vs">VS</span>
                    <div class="result-side">
                        <span class="result-label">${t('aiPrediction')}</span>
                        <span class="result-emoji" id="rps-ai-choice"></span>
                    </div>
                </div>
                <div class="result-message" id="rps-result-msg"></div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-value" id="rps-accuracy">${stats.accuracy}%</span>
                    <span class="stat-label">${t('accuracy')}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value" id="rps-total">${totalGames}</span>
                    <span class="stat-label">${t('totalRounds')}</span>
                </div>
                <div class="stat-card win-stat">
                    <span class="stat-value" id="rps-wins">${this.stats.wins}</span>
                    <span class="stat-label">${t('youWin')}</span>
                </div>
                <div class="stat-card loss-stat">
                    <span class="stat-value" id="rps-losses">${this.stats.losses}</span>
                    <span class="stat-label">${t('aiWins')}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value" id="rps-draws">${this.stats.draws}</span>
                    <span class="stat-label">${t('draws')}</span>
                </div>
                <div class="stat-card streak-stat">
                    <span class="stat-value" id="rps-streak">${this.aiStreak}</span>
                    <span class="stat-label">${t('currentStreak')}</span>
                </div>
            </div>

            <div class="history-section">
                <h3>${t('predictionHistory')}</h3>
                <div class="history-log" id="rps-history"></div>
            </div>

            <button class="reset-btn" onclick="RPSGame.handleReset()">
                ${t('reset')}
            </button>
        </div>`;
    },

    handlePlay(move) {
        const t = I18N.t.bind(I18N);
        const result = this.play(move);

        // Update status
        const statusEl = document.getElementById('rps-status');
        if (result.predictionCorrect) {
            statusEl.textContent = t('correct');
            statusEl.className = 'game-status status-correct';
        } else {
            statusEl.textContent = t('wrong');
            statusEl.className = 'game-status status-wrong';
        }

        // Show result
        const resultDisplay = document.getElementById('rps-result');
        resultDisplay.classList.remove('hidden');
        resultDisplay.classList.add('result-animate');

        document.getElementById('rps-player-choice').textContent = this.getEmoji(move);
        document.getElementById('rps-ai-choice').textContent = this.getEmoji(result.aiPlayed);

        const resultMsg = document.getElementById('rps-result-msg');
        if (result.result === 'win') {
            resultMsg.textContent = t('youWin') + '! 🎉';
            resultMsg.className = 'result-message result-win';
        } else if (result.result === 'loss') {
            resultMsg.textContent = t('aiWins') + '! 🧠';
            resultMsg.className = 'result-message result-loss';
        } else {
            resultMsg.textContent = t('draws') + '! 🤝';
            resultMsg.className = 'result-message result-draw';
        }

        // Update stats
        document.getElementById('rps-accuracy').textContent = result.engineStats.accuracy + '%';
        document.getElementById('rps-total').textContent = this.historyLog.length;
        document.getElementById('rps-wins').textContent = this.stats.wins;
        document.getElementById('rps-losses').textContent = this.stats.losses;
        document.getElementById('rps-draws').textContent = this.stats.draws;
        document.getElementById('rps-streak').textContent = this.aiStreak;

        // Update history
        this.renderHistory();

        // Animate buttons
        document.querySelectorAll('.rps-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById('btn-' + move).classList.add('selected');

        setTimeout(() => {
            resultDisplay.classList.remove('result-animate');
        }, 600);
    },

    renderHistory() {
        const t = I18N.t.bind(I18N);
        const container = document.getElementById('rps-history');
        const recent = this.historyLog.slice(-10).reverse();

        container.innerHTML = recent.map(entry => `
            <div class="history-entry ${entry.predictionCorrect ? 'history-correct' : 'history-wrong'}">
                <span class="history-round">#${entry.round}</span>
                <span class="history-move">${this.getEmoji(entry.playerMove)}</span>
                <span class="history-prediction">${entry.predictionCorrect ? '🧠' : '❌'}</span>
                <span class="history-result history-result-${entry.result}">${t(entry.result)}</span>
            </div>
        `).join('');
    },

    handleReset() {
        this.reset();
        document.getElementById('app').innerHTML = this.render();
    }
};
