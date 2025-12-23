/**
 * Game Class - Main game controller with simplified save/load logic
 * Focus on clean auto-save and auto-restore without conflicts
 */
class Game {
    constructor() {
        this.canvas = null;
        this.gameEngine = null;
        this.scoreManager = null;
        this.uiManager = null;
        
        // Game configuration
        this.config = {
            gridSize: 8,
            gemTypes: 6,
            initialMoves: 30,
            targetScore: 1000,
            enableAI: true,
            enableAnimations: true,
            enableSound: false,
            debugMode: false,
            aiDifficulty: 'medium',  // easy, medium, hard
            aiDepth: 3               // Depth cho Minimax (2-10)
        };
        
        // Game state flags
        this.isInitialized = false;
        this.isPaused = false;
        this.isRestored = false; // Flag to track if game was restored
        
        // Session data
        this.gameSession = {
            startTime: null,
            endTime: null,
            totalScore: 0,
            totalMoves: 0,
            aiHintsUsed: 0,
            autoSolvesUsed: 0
        };
        
        // Auto-save state tracking
        this.lastSavedState = null;
        
        // AI components
        this.aiComponents = {
            hintSystem: null,
            minimaxSolver: null,
            patternRecognizer: null
        };
    }
    
    // Initialize the game
    async initialize(canvasId = 'game-canvas') {
        try {
            // Get canvas element
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) {
                throw new Error(`Canvas element with id '${canvasId}' not found`);
            }
            
            if (!(this.canvas instanceof HTMLCanvasElement)) {
                throw new Error(`Element with id '${canvasId}' is not a canvas element`);
            }
            
            // Initialize core systems
            this.initializeGameEngine();
            this.initializeScoreManager();
            this.initializeUIManager();
            
            // Setup global reference for debugging
            if (this.config.debugMode) {
                window.game = this;
            }
            
            // Try to restore saved game first
            this.isRestored = this.restoreGameState();
            
            // Initialize AI if enabled
            if (this.config.enableAI) {
                await this.initializeAI();
            }
            
            this.isInitialized = true;
            
            if (this.isRestored) {
                console.log('✅ Game initialized and restored from saved state!');
            } else {
                console.log('✅ Game initialized with new state!');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize game:', error);
            return false;
        }
    }
    
    // Initialize game engine
    initializeGameEngine() {
        this.gameEngine = new GameEngine(this.canvas);
        
        // Note: GameEngine handles its own UI updates
        // We'll sync with it through the updateUI() method
        this.gameEngine.onStateChanged = (evt) => {
            // Direct sync without waiting interval
            this.syncGameState();
            // Clear any active hints only on player-initiated moves
            if (evt && evt.type === 'move' && evt.origin === 'player' && this.uiManager) {
                this.uiManager.clearHints();
            }
        };
        
        console.log('🎮 Game Engine initialized');
    }
    
    // Initialize score manager
    initializeScoreManager() {
        this.scoreManager = new ScoreManager();
        this.scoreManager.targetScore = this.config.targetScore;
        console.log('📊 Score Manager initialized');
    }
    
    // Initialize UI manager
    initializeUIManager() {
        this.uiManager = new UIManager(this.gameEngine);
        
        // Set reference to Game instance for UI callbacks
        this.uiManager.gameInstance = this;
        
        console.log('🖼️ UI Manager initialized');
    }
    
    // Initialize AI components (with lazy loading)
    async initializeAI() {
        try {
            // Only initialize AI when explicitly needed
            if (!this.aiComponents.hintSystem) {
                this.aiComponents.hintSystem = new HintSystem();
            }
            
            if (!this.aiComponents.minimaxSolver) {
                this.aiComponents.minimaxSolver = new MinimaxSolver(this.config.aiDepth);
            }
            
            if (!this.aiComponents.patternRecognizer) {
                this.aiComponents.patternRecognizer = new PatternRecognizer();
            }
            
            console.log('🤖 AI components initialized (lazy loaded)');
        } catch (error) {
            console.warn('⚠️ AI initialization failed, using fallbacks:', error);
            // Fallback implementations with correct method names
            this.aiComponents = {
                hintSystem: {
                    findBestMove: (gems) => {
                        console.log('🔄 Using fallback hint system');
                        // Simple fallback: find first available move
                        for (let row = 0; row < 8; row++) {
                            for (let col = 0; col < 7; col++) {
                                if (gems[row] && gems[row][col] && gems[row][col + 1]) {
                                    return {
                                        gem1: { row, col },
                                        gem2: { row, col: col + 1 },
                                        reason: 'Fallback suggestion',
                                        expectedMatches: 1
                                    };
                                }
                            }
                        }
                        return null;
                    },
                    analyzeBoard: () => ({ moves: [], score: 0 })
                },
                minimaxSolver: {
                    solve: (gems) => {
                        console.log('🔄 Using fallback minimax solver');
                        // Simple fallback: return first available move
                        for (let row = 0; row < 8; row++) {
                            for (let col = 0; col < 7; col++) {
                                if (gems[row] && gems[row][col] && gems[row][col + 1]) {
                                    return {
                                        move: {
                                            gem1: { row, col },
                                            gem2: { row, col: col + 1 }
                                        },
                                        score: 50
                                    };
                                }
                            }
                        }
                        return { move: null, score: 0 };
                    },
                    findOptimalPath: () => []
                },
                patternRecognizer: {
                    recognizePatterns: () => []
                }
            };
        }
    }
    
    // Start the game (only called for new games, not restored ones)
    start() {
        if (!this.isInitialized) {
            console.error('Game not initialized. Call initialize() first.');
            return false;
        }
        
        // Only start if not restored from save
        if (!this.isRestored) {
            console.log('🆕 Starting new game session');
            
            // Initialize session
            this.gameSession.startTime = Date.now();
            this.gameSession.totalScore = 0;
            this.gameSession.totalMoves = 0;
            this.gameSession.aiHintsUsed = 0;
            this.gameSession.autoSolvesUsed = 0;
            
            // Start game engine
            this.gameEngine.start();
        } else {
            console.log('🔄 Restored game is ready to continue');
        }
        
        // Periodic sync no longer necessary; onStateChanged handles updates.
        // Keep a lightweight safety sync every 2s in case an event was missed.
        if (!this.syncInterval) {
            this.syncInterval = setInterval(() => {
                this.syncGameState();
            }, 2000);
        }
        
        // Update UI
        this.updateUI();
        
        // Auto-save initial state (for new games)
        if (!this.isRestored) {
            this.lastSavedState = null; // Reset for new game
            this.autoSave();
        }
        
        console.log('🚀 Game ready!');
        return true;
    }
    
    // Restart the game
    restart() {
        if (!this.isInitialized) return false;
        
        // Clear sync interval
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        // Reset all systems
        this.gameEngine.restart();
        this.scoreManager.reset();
        this.uiManager.clearHints();
        this.isRestored = false;
        
        // Clear saved data
        this.clearAllSavedData();
        
        // Start new session
        this.start();
        
        console.log('🔄 Game restarted');
        return true;
    }
    
    // Configure game settings
    configure(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('⚙️ Game configured:', this.config);
    }
    
    // Handle score changes (sync from GameEngine)
    syncGameState() {
        if (!this.gameEngine) return;
        
        // Track changes to determine if save is needed
        let hasChanges = false;
        
        // Sync state from GameEngine
        const prevScore = this.scoreManager.score;
        const prevMoves = this.gameEngine.moves;
        
        this.scoreManager.score = this.gameEngine.score;
        this.gameSession.totalScore = this.gameEngine.score;
        
        // Check for actual changes
        if (this.gameEngine.score !== prevScore) {
            this.gameSession.totalMoves++;
            hasChanges = true;
        }
        
        if (this.gameEngine.moves !== prevMoves) {
            hasChanges = true;
        }
        
        // Only update UI and save if there are changes
        if (hasChanges) {
            // Update UI
            this.updateUI();
            
            // Auto-save only when there are actual changes
            this.autoSave();
        }
        
        // Check game end conditions
        if (this.gameEngine.moves <= 0) {
            const won = this.gameEngine.score >= this.config.targetScore;
            this.handleGameEnd(won, { score: this.gameEngine.score, moves: this.gameEngine.moves });
        }
    }
    
    // Handle game end
    handleGameEnd(won, stats) {
        this.gameSession.endTime = Date.now();
        
        console.log(won ? '🏆 Game won!' : '💀 Game over!');
        
        // Show end screen
        this.uiManager.showGameOver(won, stats);
        
        // Final save
        this.autoSave();
    }
    
    // Thay đổi độ khó AI (được gọi từ UIManager)
    setAIDifficulty(difficulty) {
        const depths = { easy: 2, medium: 3, hard: 10 };
        this.config.aiDifficulty = difficulty;
        this.config.aiDepth = depths[difficulty] || 3;
        
        // Cập nhật depth trong MinimaxSolver nếu đã được khởi tạo
        if (this.aiComponents.minimaxSolver) {
            this.aiComponents.minimaxSolver.maxDepth = this.config.aiDepth;
        }
        
        console.log(`🎚️ AI Difficulty changed to ${difficulty.toUpperCase()} (depth: ${this.config.aiDepth})`);
    }
    
    // Request AI hint
    requestAIHint() {
        if (!this.config.enableAI || !this.aiComponents.hintSystem) {
            this.uiManager.showNotification('❌ AI không khả dụng!', 'error', 2000);
            return null;
        }
        
        try {
            // Use suggestMove instead of findBestMove for real HintSystem
            const hint = this.aiComponents.hintSystem.suggestMove 
                ? this.aiComponents.hintSystem.suggestMove(this.gameEngine.grid)
                : this.aiComponents.hintSystem.findBestMove(this.gameEngine.grid.gems);
            
            if (hint) {
                this.gameSession.aiHintsUsed++;
                this.uiManager.showHint(hint);
                this.uiManager.showNotification(`💡 AI gợi ý: Đổi gem tại (${hint.gem1.row}, ${hint.gem1.col}) với (${hint.gem2.row}, ${hint.gem2.col})`, 'info', 4000);
                this.autoSave(); // Save after using hint
            } else {
                this.uiManager.showNotification('🤔 Không tìm thấy nước đi tốt!', 'warning', 2000);
            }
            
            return hint;
        } catch (error) {
            console.error('❌ AI hint error:', error);
            this.uiManager.showNotification('❌ Lỗi AI hint!', 'error', 2000);
            return null;
        }
    }
    
    // Request auto solve
    requestAutoSolve() {
        if (!this.config.enableAI) {
            this.uiManager.showNotification('❌ Auto-solve không khả dụng!', 'error', 2000);
            return { success: false };
        }
        
        try {
            this.gameSession.autoSolvesUsed++;
            
            // Try to get best move from AI systems in order of preference
            let bestMove = null;
            let moveScore = 0;
            let method = '';
            let nodesExplored = 0;
            let evalTime = 0;
            
            // ★ NẾU HARD MODE (depth >= 5) → DÙNG MINIMAX TRƯỚC
            const useMinimaxFirst = this.config.aiDepth >= 5;
            
            if (useMinimaxFirst) {
                // HARD MODE: Dùng Minimax với depth cao
                console.log(`🧠 Using Minimax with depth ${this.config.aiDepth}...`);
                
                if (this.aiComponents.minimaxSolver && this.aiComponents.minimaxSolver.findBestMove) {
                    const solution = this.aiComponents.minimaxSolver.findBestMove(this.gameEngine.grid, this.config.aiDepth);
                    
                    // Lấy thông tin từ solution
                    nodesExplored = solution?.nodesExplored || 0;
                    evalTime = solution?.evaluationTime || 0;
                    
                    console.log(`⏱️ Minimax took ${evalTime.toFixed(0)}ms, explored ${nodesExplored} nodes`);
                    
                    if (solution && solution.move && !solution.aborted) {
                        bestMove = solution.move;
                        moveScore = solution.score || 0;
                        method = `Minimax (depth=${this.config.aiDepth})`;
                    }
                }
            } else {
                // EASY/MEDIUM MODE: Dùng HintSystem (Greedy - nhanh)
                if (this.aiComponents.hintSystem && this.aiComponents.hintSystem.suggestMove) {
                    const hint = this.aiComponents.hintSystem.suggestMove(this.gameEngine.grid);
                    if (hint && hint.gem1 && hint.gem2) {
                        bestMove = { gem1: hint.gem1, gem2: hint.gem2 };
                        moveScore = hint.matchInfo ? hint.matchInfo.estimatedScore : hint.evaluationScore || 0;
                        method = 'Greedy Search';
                    }
                }
            }
            
            // Fallback to MinimaxSolver if primary method fails
            if (!bestMove && this.aiComponents.minimaxSolver && this.aiComponents.minimaxSolver.findBestMove) {
                const solution = this.aiComponents.minimaxSolver.findBestMove(this.gameEngine.grid, this.config.aiDepth);
                if (solution && solution.move && !solution.aborted) {
                    bestMove = solution.move;
                    moveScore = solution.score || 0;
                    method = 'Minimax (fallback)';
                }
            }
            
            // Final fallback: use best move from grid
            if (!bestMove && this.gameEngine.grid) {
                const possibleMoves = this.gameEngine.grid.findAllPossibleMoves();
                if (possibleMoves.length > 0) {
                    bestMove = possibleMoves[0];
                    moveScore = bestMove.score || 0;
                    method = 'Fallback';
                }
            }
            
            // Execute the move
            if (bestMove && bestMove.gem1 && bestMove.gem2) {
                this.gameEngine.handleSwap(bestMove.gem1, bestMove.gem2);
                
                // Show notification with actual expected score
                let message = '';
                if (moveScore > 0) {
                    message = `🤖 Auto-solve (${method}): ~${moveScore} điểm dự kiến`;
                } else {
                    message = `🤖 Auto-solve (${method}): đang thực hiện...`;
                }
                
                this.uiManager.showNotification(message, 'success', 3000);
                
                console.log(`✅ Auto-solve used ${method} - Expected score: ${moveScore}`);
                this.autoSave();
                
                // ★ Trả về object chứa thông tin chi tiết
                return {
                    success: true,
                    method: method,
                    nodesExplored: nodesExplored,
                    evalTime: evalTime,
                    depth: this.config.aiDepth,
                    score: moveScore
                };
            }
            
            // No valid moves found
            this.uiManager.showNotification('🤖 Không tìm thấy nước đi hợp lệ!', 'warning', 2000);
            return { success: false };
            
        } catch (error) {
            console.error('❌ Auto-solve error:', error);
            this.uiManager.showNotification('❌ Lỗi auto-solve!', 'error', 2000);
            return { success: false, error: error.message };
        }
    }
    
    // Update UI with current game state
    updateUI() {
        if (!this.gameEngine || !this.uiManager) return;
        
        // Sync with GameEngine state
        this.scoreManager.score = this.gameEngine.score;
        
        this.uiManager.updateGameUI({
            score: this.gameEngine.score,
            moves: this.gameEngine.moves,
            level: this.scoreManager.level
        });
    }
    
    // SIMPLE SAVE/LOAD SYSTEM - The core of our fix
    
    // Auto-save game state (immediate, no throttling)
    autoSave() {
        if (!this.isInitialized || this.gameEngine.gameState === 'ended') {
            return;
        }
        
        try {
            const gameState = {
                version: '1.0.0',
                timestamp: Date.now(),
                
                // Core game state
                score: this.scoreManager.score,
                moves: this.gameEngine.moves,
                level: this.scoreManager.level,
                gameState: this.gameEngine.gameState,
                
                // Session data
                session: { ...this.gameSession },
                
                // Board state (simplified)
                board: this.serializeBoard(),
                
                // Config
                config: { ...this.config }
            };
            
            // Check if state has actually changed
            const currentStateString = JSON.stringify({
                score: gameState.score,
                moves: gameState.moves,
                level: gameState.level,
                gameState: gameState.gameState,
                board: gameState.board,
                session: {
                    totalScore: gameState.session.totalScore,
                    totalMoves: gameState.session.totalMoves,
                    aiHintsUsed: gameState.session.aiHintsUsed,
                    autoSolvesUsed: gameState.session.autoSolvesUsed
                }
            });
            
            // Only save if state has changed
            if (this.lastSavedState !== currentStateString) {
                // Save to localStorage
                localStorage.setItem('diamond_crush_game', JSON.stringify(gameState));
                this.lastSavedState = currentStateString;
                
                console.log('💾 Game auto-saved (state changed)');
            } else {
                console.log('📦 No changes detected, skipping auto-save');
            }
            
        } catch (error) {
            console.error('❌ Auto-save failed:', error);
        }
    }
    
    // Restore game state from localStorage
    restoreGameState() {
        try {
            const savedData = localStorage.getItem('diamond_crush_game');
            
            if (!savedData) {
                console.log('📄 No saved game found');
                return false;
            }
            
            const gameState = JSON.parse(savedData);
            const saveTime = new Date(gameState.timestamp);
            
            console.log(`📖 Restoring game from ${saveTime.toLocaleString()}`);
            
            // Restore core state
            const restoredScore = gameState.score || 0;
            const restoredMoves = gameState.moves || this.config.initialMoves;
            const restoredLevel = gameState.level || 1;
            const restoredState = gameState.gameState || 'playing';

            this.scoreManager.score = restoredScore;
            this.scoreManager.level = restoredLevel;
            this.gameEngine.score = restoredScore;
            this.gameEngine.moves = restoredMoves;
            this.gameEngine.level = restoredLevel;
            this.gameEngine.gameState = restoredState === 'ended' ? 'playing' : restoredState;
            
            // Restore session
            this.gameSession = { ...this.gameSession, ...gameState.session };
            
            // Restore board
            this.deserializeBoard(gameState.board);
            
            // Update UI
            this.updateUI();
            
            // Initialize lastSavedState after restore
            const currentStateString = JSON.stringify({
                score: gameState.score,
                moves: gameState.moves,
                level: gameState.level,
                gameState: gameState.gameState,
                board: gameState.board,
                session: {
                    totalScore: gameState.session?.totalScore || 0,
                    totalMoves: gameState.session?.totalMoves || 0,
                    aiHintsUsed: gameState.session?.aiHintsUsed || 0,
                    autoSolvesUsed: gameState.session?.autoSolvesUsed || 0
                }
            });
            this.lastSavedState = currentStateString;
            
            // Show simple notification
            this.uiManager.showNotification('🔄 Đã khôi phục game!', 'success', 2000);
            
            console.log('✅ Game state restored');
            // Ensure the game loop is running after restore
            if (this.gameEngine && !this.gameEngine.isRunning) {
                this.gameEngine.start();
            }
            return true;
            
        } catch (error) {
            console.error('❌ Restore failed:', error);
            this.clearAllSavedData(); // Clear corrupted data
            return false;
        }
    }
    
    // Serialize board state for saving
    serializeBoard() {
        if (!this.gameEngine || !this.gameEngine.grid) {
            return { rows: this.config.gridSize, cols: this.config.gridSize, gems: [] };
        }
        
        const gems = [];
        for (let row = 0; row < this.gameEngine.grid.rows; row++) {
            gems[row] = [];
            for (let col = 0; col < this.gameEngine.grid.cols; col++) {
                const gem = this.gameEngine.grid.gems[row][col];
                gems[row][col] = gem ? {
                    type: gem.type,
                    row: gem.row,
                    col: gem.col
                } : null;
            }
        }
        
        return {
            rows: this.gameEngine.grid.rows,
            cols: this.gameEngine.grid.cols,
            gems: gems
        };
    }
    
    // Deserialize board state from saved data
    deserializeBoard(boardData) {
        if (!boardData || !this.gameEngine || !this.gameEngine.grid) {
            return;
        }
        
        try {
            // Clear current board
            this.gameEngine.grid.gems = [];
            
            // Restore gems
            for (let row = 0; row < boardData.rows; row++) {
                this.gameEngine.grid.gems[row] = [];
                for (let col = 0; col < boardData.cols; col++) {
                    const gemData = boardData.gems[row][col];
                    if (gemData) {
                        // Gem constructor expects (row, col, type)
                        this.gameEngine.grid.gems[row][col] = new Gem(gemData.row, gemData.col, gemData.type);
                    } else {
                        this.gameEngine.grid.gems[row][col] = null;
                    }
                }
            }
            
            // Re-render using GameEngine's render method
            this.gameEngine.render();
            
        } catch (error) {
            console.error('❌ Board deserialization failed:', error);
            // Fallback: generate new board
            this.gameEngine.grid.generateInitialBoard();
        }
    }
    
    // Clear all saved data
    clearAllSavedData() {
        try {
            localStorage.removeItem('diamond_crush_game');
            console.log('🗑️ All saved data cleared');
        } catch (error) {
            console.error('❌ Failed to clear saved data:', error);
        }
    }
    
    // Get save info for debugging
    getSaveInfo() {
        const savedData = localStorage.getItem('diamond_crush_game');
        if (!savedData) {
            return { exists: false };
        }
        
        try {
            const gameState = JSON.parse(savedData);
            return {
                exists: true,
                timestamp: new Date(gameState.timestamp),
                score: gameState.score,
                moves: gameState.moves,
                level: gameState.level
            };
        } catch (error) {
            return { exists: false, error: error.message };
        }
    }
    
    // Get current game state for debugging
    getGameState() {
        return {
            isInitialized: this.isInitialized,
            isRestored: this.isRestored,
            config: this.config,
            gameEngine: {
                score: this.gameEngine?.score || 0,
                moves: this.gameEngine?.moves || 0,
                level: this.scoreManager?.level || 1,
                gameState: this.gameEngine?.gameState || 'stopped'
            },
            session: this.gameSession
        };
    }
}

// Export to window
if (typeof window !== 'undefined') {
    window.Game = Game;
}