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
            hintOverlay: document.getElementById('hint-overlay'),
            // ★ NEW: Cascade Comparison elements
            cascadeComparison: document.getElementById('cascade-comparison'),
            compareCascadeBtn: document.getElementById('compare-cascade-btn'),
            cascadeCompareResult: document.getElementById('cascade-compare-result')
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
        
        // ★ NEW: Compare Cascade button
        if (this.elements.compareCascadeBtn) {
            this.elements.compareCascadeBtn.addEventListener('click', () => {
                this.runCascadeComparison();
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
        this.showAIAnalysis("🔄 AI đang phân tích bàn cờ...");
        
        // ★ Tính thời gian chạy cho Auto Solve
        const startTime = performance.now();
        
        setTimeout(() => {
            // Call Game's requestAutoSolve method and get result
            const result = this.gameInstance.requestAutoSolve();
            
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            
            // Lấy thời gian từ AI (chính xác hơn) hoặc dùng totalTime
            const evalTime = result?.evalTime || totalTime;
            
            // ★ Cập nhật hiển thị thời gian và thống kê
            this.updatePerformanceStats({
                evalTime: evalTime,
                nodesExplored: result?.nodesExplored || 0,
                depth: result?.depth || this.gameInstance.config.aiDepth
            });
            
            this.elements.autoSolveBtn.innerHTML = '🤖 Auto Solve';
            this.elements.autoSolveBtn.disabled = false;
            
            // Hiển thị thông tin chi tiết hơn
            if (result?.success) {
                const method = result.method || 'AI';
                const nodes = result.nodesExplored || 0;
                this.showAIAnalysis(`✅ ${method}\n⏱️ Thời gian: ${evalTime.toFixed(0)}ms\n🔢 Nodes: ${nodes}`);
            } else {
                this.showAIAnalysis(`❌ Không tìm được nước đi`);
            }
        }, 50);
    }
    
    // Change AI difficulty
    changeDifficulty(difficulty) {
        const depths = { easy: 2, medium: 3, hard: 10 };
        const depth = depths[difficulty] || 3;
        
        if (this.elements.minimaxDepth) {
            this.elements.minimaxDepth.textContent = depth;
        }
        
        // ★ GỌI GAME.setAIDifficulty() ĐỂ THỰC SỰ THAY ĐỔI DEPTH
        if (this.gameInstance && this.gameInstance.setAIDifficulty) {
            this.gameInstance.setAIDifficulty(difficulty);
        }
        
        // Update AI settings in game engine
        if (this.gameEngine && this.gameEngine.aiOpponent) {
            this.gameEngine.aiOpponent.setDifficulty(difficulty);
        }
        
        this.showNotification(`AI Difficulty set to ${difficulty.toUpperCase()} (Depth: ${depth})`, 'info');
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
    
    /**
     * ★ TOGGLE CASCADE PREDICTION
     * Bật/tắt tính năng mô phỏng cascade khi AI đánh giá nước đi
     * 
     * Khi BẬT:
     * - AI sẽ mô phỏng thực sự các cascade có thể xảy ra
     * - Kết quả chính xác hơn nhưng chậm hơn
     * 
     * Khi TẮT:
     * - AI chỉ ước lượng tiềm năng cascade
     * - Nhanh hơn nhưng ít chính xác
     */
    toggleCascadePrediction(enabled) {
        // Cập nhật flag trong GameEngine
        if (this.gameEngine) {
            this.gameEngine.cascadePredictionEnabled = enabled;
        }
        
        // ★ Cập nhật flag trong HintSystem (qua Game instance)
        if (this.gameInstance && this.gameInstance.aiComponents && this.gameInstance.aiComponents.hintSystem) {
            this.gameInstance.aiComponents.hintSystem.setCascadePrediction(enabled);
        }
        
        // ★ Hiển thị/ẩn panel so sánh Cascade
        if (this.elements.cascadeComparison) {
            this.elements.cascadeComparison.style.display = enabled ? 'block' : 'none';
        }
        
        // Hiển thị thông báo
        this.showNotification(
            `🔮 Cascade Prediction ${enabled ? 'BẬT - AI sẽ mô phỏng combo' : 'TẮT - AI ước lượng nhanh'}`, 
            enabled ? 'success' : 'info'
        );
        
        console.log(`🔮 Cascade Prediction: ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }
    
    /**
     * ★ CHẠY SO SÁNH CASCADE PREDICTION
     * So sánh kết quả AI có/không Cascade Prediction
     */
    runCascadeComparison() {
        if (!this.gameInstance || !this.gameInstance.aiComponents || !this.gameInstance.aiComponents.hintSystem) {
            this.showNotification('❌ Không thể chạy so sánh', 'error');
            return;
        }
        
        const hintSystem = this.gameInstance.aiComponents.hintSystem;
        const grid = this.gameEngine.grid;
        
        // Disable nút trong khi đang chạy
        if (this.elements.compareCascadeBtn) {
            this.elements.compareCascadeBtn.disabled = true;
            this.elements.compareCascadeBtn.innerHTML = '⏳ Đang so sánh...';
        }
        
        setTimeout(() => {
            try {
                // Chạy so sánh
                const comparison = hintSystem.compareWithAndWithoutCascade(grid);
                
                // Hiển thị kết quả
                this.displayCascadeComparison(comparison);
                
            } catch (error) {
                console.error('Cascade comparison error:', error);
                if (this.elements.cascadeCompareResult) {
                    this.elements.cascadeCompareResult.innerHTML = `<div style="color: #ef4444;">❌ Lỗi: ${error.message}</div>`;
                }
            }
            
            // Enable lại nút
            if (this.elements.compareCascadeBtn) {
                this.elements.compareCascadeBtn.disabled = false;
                this.elements.compareCascadeBtn.innerHTML = '📊 So sánh 2 phương pháp';
            }
        }, 50);
    }
    
    /**
     * ★ HIỂN THỊ KẾT QUẢ SO SÁNH CASCADE
     * Hiển thị Top 3 nước đi của mỗi phương pháp để thấy sự khác biệt
     */
    displayCascadeComparison(comparison) {
        if (!this.elements.cascadeCompareResult) return;
        
        const { without, with: withCascade, comparison: compare } = comparison;
        
        // Format vị trí move
        const formatMove = (move) => {
            if (!move) return 'N/A';
            return `(${move.gem1.row},${move.gem1.col})↔(${move.gem2.row},${move.gem2.col})`;
        };
        
        // Tạo HTML cho danh sách top moves
        const createTopMovesHTML = (topMoves, methodName) => {
            if (!topMoves || topMoves.length === 0) {
                return '<div style="color: #999;">Không có nước đi</div>';
            }
            
            return topMoves.map((move, index) => {
                const cascadeInfo = move.cascadeInfo ? 
                    `<span class="cascade-badge">${move.cascadeInfo.cascadeCount} cascade</span>` : 
                    '<span class="cascade-badge estimate">ước lượng</span>';
                
                return `
                    <div class="top-move-item ${index === 0 ? 'best' : ''}">
                        <span class="rank">#${index + 1}</span>
                        <span class="move-pos">${formatMove(move)}</span>
                        <span class="move-score">${move.score} pts</span>
                        ${cascadeInfo}
                    </div>
                `;
            }).join('');
        };
        
        // Tạo HTML cho ranking changes
        const createRankingChangesHTML = (changes) => {
            if (!changes || changes.length === 0) {
                return '<div style="color: #22c55e; font-size: 12px;">Không có thay đổi thứ hạng</div>';
            }
            
            return changes.map(change => {
                const direction = change.change > 0 ? '↑' : '↓';
                const color = change.change > 0 ? '#22c55e' : '#ef4444';
                return `
                    <div style="font-size: 11px; color: ${color};">
                        ${formatMove(change.move)}: #${change.rankWithout} → #${change.rankWith} (${direction}${Math.abs(change.change)})
                    </div>
                `;
            }).join('');
        };
        
        const html = `
            <div class="compare-columns">
                <div class="compare-section">
                    <h5>❌ Ước lượng (Estimate)</h5>
                    <div class="compare-meta">
                        <span>⏱️ ${without.time.toFixed(1)}ms</span>
                    </div>
                    <div class="top-moves-list">
                        ${createTopMovesHTML(without.topMoves, 'without')}
                    </div>
                </div>
                
                <div class="compare-section highlight-section">
                    <h5>✅ Mô phỏng (Simulate)</h5>
                    <div class="compare-meta">
                        <span>⏱️ ${withCascade.time.toFixed(1)}ms</span>
                        <span>🔥 ${withCascade.totalCascade} cascades</span>
                    </div>
                    <div class="top-moves-list">
                        ${createTopMovesHTML(withCascade.topMoves, 'with')}
                    </div>
                </div>
            </div>
            
            ${compare.rankingChanges.length > 0 ? `
                <div class="ranking-changes">
                    <h6>📊 Thay đổi thứ hạng:</h6>
                    ${createRankingChangesHTML(compare.rankingChanges)}
                </div>
            ` : ''}
            
            <div class="compare-summary ${compare.sameTop1 ? 'same' : 'different'}">
                ${compare.recommendation}
            </div>
            
            <div class="compare-footer">
                <small>
                    Chênh lệch thời gian: +${compare.timeDifference.toFixed(1)}ms | 
                    Top 1 ${compare.sameTop1 ? '✅ giống nhau' : '⚠️ khác nhau'}
                </small>
            </div>
        `;
        
        this.elements.cascadeCompareResult.innerHTML = html;
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
        
        // Force render to remove hint highlights
        if (this.gameEngine) {
            this.gameEngine.needsRender = true;
        }
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
        
        // Force render to show hint highlights
        if (this.gameEngine) {
            this.gameEngine.needsRender = true;
        }
        
        // Auto clear after 5s (keep visible longer)
        setTimeout(() => {
            this.clearHints();
        }, 5000);
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

// Explicitly export to window
if (typeof window !== 'undefined') {
    window.UIManager = UIManager;
}