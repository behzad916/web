/**
 * MindReader Prediction Engine
 * Uses Markov chains, frequency analysis, pattern matching, and recency weighting
 * to predict the opponent's next move.
 */
class PredictionEngine {
    constructor(possibleMoves) {
        this.possibleMoves = possibleMoves;
        this.history = [];
        this.markovChains = { 1: {}, 2: {}, 3: {} };
        this.frequency = {};
        this.recencyWindow = 10;
        this.weights = { markov3: 0.35, markov2: 0.25, markov1: 0.15, frequency: 0.1, recency: 0.15 };
        this.totalPredictions = 0;
        this.correctPredictions = 0;
        this.lastPrediction = null;

        // Initialize frequency map
        for (const move of possibleMoves) {
            this.frequency[move] = 0;
        }
    }

    /**
     * Record a move and update all internal models
     */
    recordMove(move) {
        // Check if last prediction was correct
        if (this.lastPrediction !== null) {
            this.totalPredictions++;
            if (this.lastPrediction === move) {
                this.correctPredictions++;
            }
        }

        // Update frequency
        this.frequency[move] = (this.frequency[move] || 0) + 1;

        // Update Markov chains of order 1, 2, 3
        for (let order = 1; order <= 3; order++) {
            if (this.history.length >= order) {
                const key = this.history.slice(-order).join(',');
                if (!this.markovChains[order][key]) {
                    this.markovChains[order][key] = {};
                    for (const m of this.possibleMoves) {
                        this.markovChains[order][key][m] = 0;
                    }
                }
                this.markovChains[order][key][move]++;
            }
        }

        this.history.push(move);
    }

    /**
     * Get prediction scores from a specific Markov chain order
     */
    _getMarkovScores(order) {
        const scores = {};
        for (const move of this.possibleMoves) {
            scores[move] = 0;
        }

        if (this.history.length < order) return scores;

        const key = this.history.slice(-order).join(',');
        const transitions = this.markovChains[order][key];

        if (!transitions) return scores;

        const total = Object.values(transitions).reduce((a, b) => a + b, 0);
        if (total === 0) return scores;

        for (const move of this.possibleMoves) {
            scores[move] = (transitions[move] || 0) / total;
        }

        return scores;
    }

    /**
     * Get frequency-based scores
     */
    _getFrequencyScores() {
        const scores = {};
        const total = this.history.length || 1;

        for (const move of this.possibleMoves) {
            scores[move] = (this.frequency[move] || 0) / total;
        }

        return scores;
    }

    /**
     * Get recency-weighted scores (recent moves matter more)
     */
    _getRecencyScores() {
        const scores = {};
        for (const move of this.possibleMoves) {
            scores[move] = 0;
        }

        const recentMoves = this.history.slice(-this.recencyWindow);
        if (recentMoves.length === 0) return scores;

        for (let i = 0; i < recentMoves.length; i++) {
            const weight = (i + 1) / recentMoves.length; // More recent = higher weight
            scores[recentMoves[i]] += weight;
        }

        // Normalize
        const total = Object.values(scores).reduce((a, b) => a + b, 0);
        if (total > 0) {
            for (const move of this.possibleMoves) {
                scores[move] /= total;
            }
        }

        return scores;
    }

    /**
     * Detect repeating patterns and return scores
     */
    _getPatternScores() {
        const scores = {};
        for (const move of this.possibleMoves) {
            scores[move] = 0;
        }

        if (this.history.length < 4) return scores;

        // Check for repeating patterns of length 1-5
        for (let patternLen = 1; patternLen <= Math.min(5, Math.floor(this.history.length / 2)); patternLen++) {
            const recent = this.history.slice(-patternLen);
            const before = this.history.slice(-(patternLen * 2), -patternLen);

            if (before.length === patternLen) {
                let match = true;
                for (let i = 0; i < patternLen; i++) {
                    if (recent[i] !== before[i]) {
                        match = false;
                        break;
                    }
                }
                if (match && this.history.length > patternLen * 2) {
                    // Pattern detected — predict next element from earlier in history
                    const lookAheadIdx = this.history.length - patternLen * 2 + patternLen;
                    if (lookAheadIdx < this.history.length) {
                        const predicted = this.history[this.history.length - patternLen];
                        scores[predicted] += 1.0 / patternLen;
                    }
                }
            }
        }

        // Normalize
        const total = Object.values(scores).reduce((a, b) => a + b, 0);
        if (total > 0) {
            for (const move of this.possibleMoves) {
                scores[move] /= total;
            }
        }

        return scores;
    }

    /**
     * Get the combined prediction
     * Returns { prediction, confidence, breakdown }
     */
    predict() {
        if (this.history.length === 0) {
            // Random first prediction
            const idx = Math.floor(Math.random() * this.possibleMoves.length);
            this.lastPrediction = this.possibleMoves[idx];
            return {
                prediction: this.lastPrediction,
                confidence: 1 / this.possibleMoves.length,
                breakdown: {}
            };
        }

        const markov3 = this._getMarkovScores(3);
        const markov2 = this._getMarkovScores(2);
        const markov1 = this._getMarkovScores(1);
        const freq = this._getFrequencyScores();
        const recency = this._getRecencyScores();
        const pattern = this._getPatternScores();

        // Combine scores
        const combined = {};
        for (const move of this.possibleMoves) {
            combined[move] =
                this.weights.markov3 * (markov3[move] || 0) +
                this.weights.markov2 * (markov2[move] || 0) +
                this.weights.markov1 * (markov1[move] || 0) +
                this.weights.frequency * (freq[move] || 0) +
                this.weights.recency * (recency[move] || 0) +
                0.15 * (pattern[move] || 0);
        }

        // Find the best prediction
        let bestMove = this.possibleMoves[0];
        let bestScore = -1;
        for (const move of this.possibleMoves) {
            if (combined[move] > bestScore) {
                bestScore = combined[move];
                bestMove = move;
            }
        }

        // Calculate confidence
        const totalScore = Object.values(combined).reduce((a, b) => a + b, 0);
        const confidence = totalScore > 0 ? bestScore / totalScore : 1 / this.possibleMoves.length;

        this.lastPrediction = bestMove;

        return {
            prediction: bestMove,
            confidence: Math.min(confidence, 1),
            breakdown: { markov3, markov2, markov1, freq, recency, pattern, combined }
        };
    }

    /**
     * Get accuracy stats
     */
    getStats() {
        return {
            totalPredictions: this.totalPredictions,
            correctPredictions: this.correctPredictions,
            accuracy: this.totalPredictions > 0
                ? (this.correctPredictions / this.totalPredictions * 100).toFixed(1)
                : 0,
            totalMoves: this.history.length,
            frequencyMap: { ...this.frequency }
        };
    }

    /**
     * Reset the engine
     */
    reset() {
        this.history = [];
        this.markovChains = { 1: {}, 2: {}, 3: {} };
        this.frequency = {};
        this.totalPredictions = 0;
        this.correctPredictions = 0;
        this.lastPrediction = null;
        for (const move of this.possibleMoves) {
            this.frequency[move] = 0;
        }
    }
}
