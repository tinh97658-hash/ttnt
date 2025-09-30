/**
 * UIManager - Handles all UI interactions and updates
 * Coordinates between game engine and DOM elements
 */
class UIManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.scoreManager = null;
        
        // UI elements
        this.elements = {
            score: document.getElementById('score'),
            moves: document.getElementById('moves'),
            hintBtn: document.getElementById('hint-btn'),
            autoSolveBtn: document.getElementById('auto-solve-btn'),
            difficultySelect: document.getElementById('difficulty-select'),
            aiSuggestions: document.getElementById('ai-suggestions'),
            performanceStats: document.getElementById('performance-stats'),
            minimaxDepth: document.getElementById('minimax-depth'),
            evalTime: document.getElementById('eval-time'),
            nodesExplored: document.getElementById('nodes-explored'),
            showPatterns: document.getElementById('show-patterns'),
            predictCascade: document.getElementById('predict-cascade'),
            adaptiveDifficulty: document.getElementById('adaptive-difficulty'),
            hintOverlay: document.getElementById('hint-overlay')
        };
        
        // UI state
        this.currentHints = [];
        this.animations = [];
        this.notifications = [];
        
        this.initializeEventListeners();
        this.setupAnimationSystem();
    }
    
    initializeEventListeners() {
        // AI Control buttons
        if (this.elements.hintBtn) {
            this.elements.hintBtn.addEventListener('click', () => {
                this.requestHint();
            });
        }
        
        if (this.elements.autoSolveBtn) {
            this.elements.autoSolveBtn.addEventListener('click', () => {
                this.autoSolve();
            });
        }
        
        // Difficulty selector
        if (this.elements.difficultySelect) {
            this.elements.difficultySelect.addEventListener('change', (e) => {
                this.changeDifficulty(e.target.value);
            });
        }
        
        // AI feature toggles
        if (this.elements.showPatterns) {
            this.elements.showPatterns.addEventListener('change', (e) => {
                this.togglePatternRecognition(e.target.checked);
            });
        }
        
        if (this.elements.predictCascade) {
            this.elements.predictCascade.addEventListener('change', (e) => {
                this.toggleCascadePrediction(e.target.checked);
            });
        }
        
        if (this.elements.adaptiveDifficulty) {
            this.elements.adaptiveDifficulty.addEventListener('change', (e) => {
                this.toggleAdaptiveDifficulty(e.target.checked);
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
    }
    
    setupAnimationSystem() {
        // Create CSS for dynamic animations
        const style = document.createElement('style');
        style.textContent = `
            .achievement-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
                color: white;
                padding: 1rem;
                border-radius: 0.5rem;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 1000;
                animation: slideInRight 0.3s ease-out;
                max-width: 300px;
            }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            .hint-pulse {
                animation: hintPulse 1s ease-in-out infinite;
            }
            
            @keyframes hintPulse {
                0%, 100% { opacity: 0.7; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.1); }
            }
            
            .loading-spinner {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid rgba(255,255,255,.3);
                border-radius: 50%;
                border-top-color: white;
                animation: spin 1s ease-in-out infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Set score manager reference
    setScoreManager(scoreManager) {
        this.scoreManager = scoreManager;
    }
    
    // Update game UI elements
    updateGameUI(gameState) {
        if (this.elements.score) {
            this.animateNumberChange(this.elements.score, gameState.score);
        }
        
        if (this.elements.moves) {
            this.elements.moves.textContent = gameState.moves;
            
            // Visual warning for low moves
            if (gameState.moves <= 5) {
                this.elements.moves.style.color = '#ef4444';
                this.elements.moves.classList.add('hint-pulse');
            } else {
                this.elements.moves.style.color = '';
                this.elements.moves.classList.remove('hint-pulse');
            }
        }
    }
    
    // Animate number changes
    animateNumberChange(element, newValue) {
        const oldValue = parseInt(element.textContent) || 0;
        const difference = newValue - oldValue;
        
        if (difference === 0) return;
        
        const duration = 500;
        const steps = 30;
        const stepValue = difference / steps;
        const stepTime = duration / steps;
        
        let currentStep = 0;
        
        const animate = () => {
            currentStep++;
            const currentValue = oldValue + (stepValue * currentStep);
            element.textContent = Math.floor(currentValue);
            
            if (currentStep < steps) {
                setTimeout(animate, stepTime);
            } else {
                element.textContent = newValue;
            }
        };
        
        animate();
    }
    
    // Handle AI hint request
    requestHint() {
        if (!this.gameEngine || !this.gameInstance) return;
        
        // Show loading state
        this.elements.hintBtn.innerHTML = '<span class="loading-spinner"></span> Thinking...';
        this.elements.hintBtn.disabled = true;
        
        // Clear previous hints
        this.clearHints();
        
        // Request hint with timing
        const startTime = performance.now();
        
        setTimeout(() => {
            // Call Game's requestAIHint method instead of GameEngine
            this.gameInstance.requestAIHint();
            
            const endTime = performance.now();
            const thinkTime = endTime - startTime;
            
            // Update performance display
            this.updatePerformanceStats({
                evalTime: thinkTime,
                nodesExplored: this.gameEngine.performance.movesAnalyzed
            });
            
            // Reset button
            this.elements.hintBtn.innerHTML = '🧠 AI Hint';
            this.elements.hintBtn.disabled = false;
        }, 100); // Small delay for UX
    }
    
    // Handle auto-solve
    autoSolve() {
        if (!this.gameEngine || !this.gameInstance) return;
        
        this.elements.autoSolveBtn.innerHTML = '<span class="loading-spinner"></span> Solving...';
        this.elements.autoSolveBtn.disabled = true;
        
        // Show AI thinking process
        this.showAIAnalysis("Analyzing board state...");
        
        setTimeout(() => {
            // Call Game's requestAutoSolve method instead of GameEngine
            this.gameInstance.requestAutoSolve();
            
            this.elements.autoSolveBtn.innerHTML = '🤖 Auto Solve';
            this.elements.autoSolveBtn.disabled = false;
            
            this.showAIAnalysis("Move executed based on Minimax algorithm analysis.");
        }, 200);
    }
    
    // Change AI difficulty
    changeDifficulty(difficulty) {
        const depths = { easy: 2, medium: 3, hard: 5 };
        const depth = depths[difficulty] || 3;
        
        if (this.elements.minimaxDepth) {
            this.elements.minimaxDepth.textContent = depth;
        }
        
        // Update AI settings in game engine
        if (this.gameEngine && this.gameEngine.aiOpponent) {
            this.gameEngine.aiOpponent.setDifficulty(difficulty);
        }
        
        this.showNotification(`AI Difficulty set to ${difficulty.toUpperCase()}`, 'info');
    }
    
    // Toggle AI features
    togglePatternRecognition(enabled) {
        if (this.gameEngine) {
            this.gameEngine.patternRecognitionEnabled = enabled;
        }
        
        this.showNotification(
            `Pattern Recognition ${enabled ? 'enabled' : 'disabled'}`, 
            enabled ? 'success' : 'info'
        );
    }
    
    toggleCascadePrediction(enabled) {
        if (this.gameEngine) {
            this.gameEngine.cascadePredictionEnabled = enabled;
        }
        
        this.showNotification(
            `Cascade Prediction ${enabled ? 'enabled' : 'disabled'}`, 
            enabled ? 'success' : 'info'
        );
    }
    
    toggleAdaptiveDifficulty(enabled) {
        if (this.gameEngine) {
            this.gameEngine.adaptiveDifficultyEnabled = enabled;
        }
        
        this.showNotification(
            `Adaptive Difficulty ${enabled ? 'enabled' : 'disabled'}`, 
            enabled ? 'success' : 'info'
        );
    }
    
    // Clear all hints from display
    clearHints() {
        if (this.elements.hintOverlay) {
            this.elements.hintOverlay.innerHTML = '';
        }
        // Remove hint flag from any previously hinted gems
        if (this.currentHints && this.currentHints.length) {
            try {
                this.currentHints.forEach(h => {
                    if (h.gem1 && this.gameEngine.grid.gems[h.gem1.row]?.[h.gem1.col]) {
                        this.gameEngine.grid.gems[h.gem1.row][h.gem1.col].isHinted = false;
                    }
                    if (h.gem2 && this.gameEngine.grid.gems[h.gem2.row]?.[h.gem2.col]) {
                        this.gameEngine.grid.gems[h.gem2.row][h.gem2.col].isHinted = false;
                    }
                });
            } catch (e) { /* ignore */ }
        }
        this.currentHints = [];
    }
    
    // Show AI hint visually
    showHint(hintData) {
        if (!hintData) return;
        
        // Clear previous hints
        this.clearHints();
        
        // Show in AI analysis panel
        this.showAIAnalysis('AI đề xuất nước đi tối ưu:', {
            gem1: hintData.gem1,
            gem2: hintData.gem2,
            confidence: hintData.confidence || 85,
            expectedScore: hintData.expectedScore || hintData.score || 50,
            matchInfo: hintData.matchInfo || { totalMatches: 1, matchSizes: [3] }
        });
        
        // Store current hint for visual highlighting
        this.currentHints.push(hintData);
        // Set subtle highlight on hinted gems
        const g1 = this.gameEngine.grid.gems[hintData.gem1.row]?.[hintData.gem1.col];
        const g2 = this.gameEngine.grid.gems[hintData.gem2.row]?.[hintData.gem2.col];
        if (g1) g1.isHinted = true;
        if (g2) g2.isHinted = true;
        
        // Auto clear after 4s (subtle blink duration)
        setTimeout(() => {
            this.clearHints();
        }, 4000);
    }
    
    // Show AI analysis in sidebar
    showAIAnalysis(message, data = null) {
        if (!this.elements.aiSuggestions) return;
        
        let content = `<div class="ai-analysis-update">
            <h4>🔬 AI Analysis</h4>
            <p>${message}</p>`;
        
        if (data) {
            content += '<div class="analysis-data">';
            
            // Show specific gem positions to swap
            if (data.gem1 && data.gem2) {
                content += `<p><strong>💡 Hoán đổi:</strong> Ô (${data.gem1.row + 1}, ${data.gem1.col + 1}) ↔ Ô (${data.gem2.row + 1}, ${data.gem2.col + 1})</p>`;
            }
            
            if (data.confidence) {
                content += `<p><strong>🎯 Độ tin cậy:</strong> ${data.confidence.toFixed(1)}%</p>`;
            }
            
            if (data.expectedScore) {
                content += `<p><strong>⭐ Điểm dự kiến:</strong> ${data.expectedScore}</p>`;
            }
            
            // Show detailed match information
            if (data.matchInfo) {
                content += `<p><strong>📊 Chi tiết:</strong> ${data.matchInfo.totalMatches} match`;
                if (data.matchInfo.matchSizes && data.matchInfo.matchSizes.length > 0) {
                    const maxSize = Math.max(...data.matchInfo.matchSizes);
                    if (maxSize >= 4) {
                        content += ` (bao gồm combo ${maxSize}!)`;
                    }
                }
                content += `</p>`;
            }
            
            content += '</div>';
        }
        
        content += `<small class="timestamp">Cập nhật: ${new Date().toLocaleTimeString()}</small></div>`;
        
        this.elements.aiSuggestions.innerHTML = content;
        
        // Auto-scroll to show the update
        this.elements.aiSuggestions.scrollTop = this.elements.aiSuggestions.scrollHeight;
    }
    
    // Update performance statistics display
    updatePerformanceStats(stats) {
        if (stats.evalTime && this.elements.evalTime) {
            this.elements.evalTime.textContent = `${stats.evalTime.toFixed(0)}ms`;
        }
        
        if (stats.nodesExplored && this.elements.nodesExplored) {
            this.elements.nodesExplored.textContent = stats.nodesExplored;
        }
        
        if (stats.depth && this.elements.minimaxDepth) {
            this.elements.minimaxDepth.textContent = stats.depth;
        }
    }
    
    // Show notification to user
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1001;
            animation: slideInDown 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        this.notifications.push(notification);
        
        // Auto-remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutUp 0.3s ease-in';
                setTimeout(() => {
                    notification.parentNode.removeChild(notification);
                    this.notifications = this.notifications.filter(n => n !== notification);
                }, 300);
            }
        }, duration);
    }
    
    // Handle keyboard shortcuts
    handleKeyPress(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        
        switch (e.key) {
            case 'h':
            case 'H':
                e.preventDefault();
                this.requestHint();
                break;
            case 's':
            case 'S':
                e.preventDefault();
                this.autoSolve();
                break;
            case 'r':
            case 'R':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.restartGame();
                }
                break;
            case 'p':
            case 'P':
                e.preventDefault();
                this.pauseGame();
                break;
        }
    }
    
    // Game control methods
    restartGame() {
        if (confirm('Are you sure you want to restart the game?')) {
            this.gameEngine.restart();
            this.clearHints();
            this.showNotification('Game restarted!', 'info');
        }
    }
    
    pauseGame() {
        this.gameEngine.pause();
        this.showNotification(
            this.gameEngine.gameState === 'paused' ? 'Game paused' : 'Game resumed', 
            'info'
        );
    }
    
    // Show game end screens
    showGameOver(won = false, stats = null) {
        const modal = document.createElement('div');
        modal.className = 'game-end-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>${won ? '🎉 Congratulations!' : '😔 Game Over'}</h2>
                <div class="final-stats">
                    <p><strong>Final Score:</strong> ${stats?.score || 0}</p>
                    <p><strong>Moves Used:</strong> ${30 - (stats?.moves || 0)}</p>
                    <p><strong>Efficiency:</strong> ${stats?.efficiency?.toFixed(1) || 0} pts/move</p>
                    <p><strong>Longest Combo:</strong> ${stats?.longestCombo || 0}</p>
                </div>
                <div class="modal-actions">
                    <button onclick="this.closest('.game-end-modal').remove(); game.restart()" class="btn-primary">
                        Play Again
                    </button>
                    <button onclick="this.closest('.game-end-modal').remove()" class="btn-secondary">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;
        
        document.body.appendChild(modal);
    }
    
    // Update UI theme based on game state
    updateTheme(gameState) {
        const root = document.documentElement;
        
        if (gameState === 'game-over') {
            root.style.setProperty('--primary-color', '#ef4444');
        } else if (gameState === 'won') {
            root.style.setProperty('--primary-color', '#10b981');
        } else {
            root.style.setProperty('--primary-color', '#6366f1');
        }
    }
    
    // Cleanup method
    destroy() {
        // Remove event listeners
        this.notifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        
        this.notifications = [];
        this.currentHints = [];
        this.animations = [];
    }
}