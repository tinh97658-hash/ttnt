/**
 * GameEngine Class - Core game logic and state management
 * Handles game flow, animations, and coordinates between systems
 */
class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.grid = new Grid(8, 8); // Hardcode grid size for now
        
        // Game state
        this.gameState = 'playing'; // 'playing', 'animating', 'game-over', 'paused'
        this.score = 0;
        this.moves = 30;
        this.level = 1;
        this.target = { score: 1000 };
        
        // Animation and timing
        this.lastFrameTime = 0;
        this.animationQueue = [];
        this.isProcessingMatches = false;
        
        // Input handling
        this.selectedGem = null;
        this.mousePos = { x: 0, y: 0 };
        
        // AI integration points
        this.aiHints = [];
        this.aiAnalysis = null;
        this.aiOpponent = null;
        
        // Performance tracking for AI display
        this.performance = {
            matchesFound: 0,
            movesAnalyzed: 0,
            cascadesTriggered: 0,
            averageThinkTime: 0
        };

        // External observer callback (Game will set this)
        this.onStateChanged = null;

        // Running state guard to avoid duplicate RAF loops
        this.isRunning = false;
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    // Main game loop
    update(currentTime) {
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        if (this.gameState === 'playing') {
            this.updateGameLogic(deltaTime);
        }
        
        this.updateAnimations(deltaTime);
        this.render();
        
        // Continue game loop
        requestAnimationFrame((time) => this.update(time));
    }
    
    updateGameLogic(deltaTime) {
        // Check for matches if not currently processing
        if (!this.isProcessingMatches) {
            this.processMatches();
        }
        
        // Check win/lose conditions
        this.checkGameEnd();
        
        // Update AI analysis periodically
        if (this.aiAnalysis) {
            this.updateAIAnalysis();
        }
    }
    
    updateAnimations(deltaTime) {
        // Process animation queue
        this.animationQueue = this.animationQueue.filter(animation => {
            animation.update(deltaTime);
            return !animation.completed;
        });
        
        // Update gem animations
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const gem = this.grid.gems[row][col];
                if (gem && gem.animating) {
                    // Animation is handled in Gem class
                }
            }
        }
    }
    
    processMatches() {
        const matches = this.grid.findMatches();
        
        if (matches.length > 0) {
            this.isProcessingMatches = true;
            this.performance.matchesFound++;
            
            // Calculate score
            const matchScore = this.grid.removeMatches(matches);
            this.score += matchScore;
            
            // Apply gravity after match removal
            setTimeout(() => {
                const moved = this.grid.applyGravity();
                
                // Check for cascades
                setTimeout(() => {
                    this.isProcessingMatches = false;
                    
                    // Recursively check for new matches
                    const newMatches = this.grid.findMatches();
                    if (newMatches.length > 0) {
                        this.performance.cascadesTriggered++;
                    }

                    // Notify external listener after resolution
                    if (this.onStateChanged) {
                        this.onStateChanged({ type: 'matchesResolved', score: this.score, moves: this.moves, origin: this._lastMoveOrigin || 'player' });
                    }
                }, moved ? 500 : 100);
            }, 300);
        }
    }
    
    // Handle mouse interactions
    handleMouseDown(e) {
        if (this.gameState !== 'playing') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const gem = this.grid.getGemAt(x, y);
        this.handleGemSelection(gem, x, y);
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
    }
    
    handleMouseUp(e) {
        // Handle drag-to-swap logic here if needed
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        const gem = this.grid.getGemAt(x, y);
        this.handleGemSelection(gem, x, y);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = touch.clientX - rect.left;
        this.mousePos.y = touch.clientY - rect.top;
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
    }
    
    handleGemSelection(gem, x, y) {
        if (!gem) return;
        
        if (!this.selectedGem) {
            // First selection
            this.selectedGem = gem;
            gem.selected = true;
            this.showPossibleMoves(gem);
        } else if (this.selectedGem === gem) {
            // Deselect same gem
            this.selectedGem.selected = false;
            this.selectedGem = null;
            this.clearHints();
        } else {
            // Attempt swap
            if (this.grid.canSwap(this.selectedGem, gem)) {
                this.performMove(this.selectedGem, gem, 'player');
            } else {
                // Invalid move, select new gem
                this.selectedGem.selected = false;
                this.selectedGem = gem;
                gem.selected = true;
                this.showPossibleMoves(gem);
            }
        }
    }
    
    performMove(gem1, gem2, origin = 'player') {
        if (this.moves <= 0 || this.gameState !== 'playing') return;
        
        this.moves--;
        this.performance.movesAnalyzed++;
        this._lastMoveOrigin = origin;
        
        // Clear selections
        gem1.selected = false;
        gem2.selected = false;
        this.selectedGem = null;
        this.clearHints();
        
        // Perform swap
        this.grid.swapGems(gem1, gem2);
        
        // Save state for AI analysis
        this.grid.saveCurrentState();
        
        // Update UI
        this.updateGameUI();

        // Trigger immediate match processing
        this.processMatches();

        // Notify observer
        if (this.onStateChanged) {
            this.onStateChanged({ type: 'move', score: this.score, moves: this.moves, origin });
        }
    }
    
    // Public method for AI to trigger moves
    handleSwap(gem1Pos, gem2Pos) {
        // Convert position objects to actual gem objects
        const gem1 = this.grid.gems[gem1Pos.row][gem1Pos.col];
        const gem2 = this.grid.gems[gem2Pos.row][gem2Pos.col];
        
        if (gem1 && gem2 && this.grid.canSwap(gem1, gem2)) {
            this.performMove(gem1, gem2, 'ai');
            return true;
        }
        return false;
    }
    
    showPossibleMoves(gem) {
        // Clear existing hints
        this.clearHints();
        
        // Find valid swaps for selected gem
        const validMoves = [];
        const directions = [
            { row: -1, col: 0 }, // up
            { row: 1, col: 0 },  // down
            { row: 0, col: -1 }, // left
            { row: 0, col: 1 }   // right
        ];
        
        directions.forEach(dir => {
            const newRow = gem.row + dir.row;
            const newCol = gem.col + dir.col;
            
            if (newRow >= 0 && newRow < this.grid.rows && 
                newCol >= 0 && newCol < this.grid.cols) {
                
                const targetGem = this.grid.gems[newRow][newCol];
                if (targetGem && this.grid.canSwap(gem, targetGem)) {
                    validMoves.push(targetGem);
                }
            }
        });
        
        // Highlight valid moves
        validMoves.forEach(move => {
            move.highlighted = true;
        });
    }
    
    clearHints() {
        this.aiHints = [];
        
        // Clear all highlights
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const gem = this.grid.gems[row][col];
                if (gem) {
                    gem.highlighted = false;
                }
            }
        }
    }
    
    // AI Integration Methods
    requestAIHint() {
        const startTime = Date.now();
        
        // Find best possible moves
        const possibleMoves = this.grid.findAllPossibleMoves();
        
        if (possibleMoves.length > 0) {
            const bestMove = possibleMoves[0]; // Already sorted by score
            
            this.aiHints = [
                {
                    gem1: bestMove.gem1,
                    gem2: bestMove.gem2,
                    score: bestMove.score,
                    confidence: this.calculateHintConfidence(bestMove)
                }
            ];
            
            this.displayAIHint(bestMove);
        }
        
        // Update performance stats
        const thinkTime = Date.now() - startTime;
        this.performance.averageThinkTime = 
            (this.performance.averageThinkTime + thinkTime) / 2;
            
        this.updatePerformanceDisplay();
    }
    
    calculateHintConfidence(move) {
        // Simple confidence based on score relative to average
        const allMoves = this.grid.findAllPossibleMoves();
        const averageScore = allMoves.reduce((sum, m) => sum + m.score, 0) / allMoves.length;
        
        return Math.min(move.score / averageScore, 2) * 50; // 0-100%
    }
    
    displayAIHint(move) {
        // Create visual hint on UI
        const hintOverlay = document.getElementById('hint-overlay');
        hintOverlay.innerHTML = '';
        
        // Create arrows pointing to suggested gems
        const arrow1 = this.createHintArrow(move.gem1);
        const arrow2 = this.createHintArrow(move.gem2);
        
        hintOverlay.appendChild(arrow1);
        hintOverlay.appendChild(arrow2);
        
        // Update AI suggestions panel
        const suggestionsPanel = document.getElementById('ai-suggestions');
        suggestionsPanel.innerHTML = `
            <h4>🎯 AI Recommendation</h4>
            <p>Swap gems at (${move.gem1.row + 1}, ${move.gem1.col + 1}) and (${move.gem2.row + 1}, ${move.gem2.col + 1})</p>
            <p>Predicted Score: <strong>${move.score}</strong></p>
            <p>Confidence: <strong>${this.calculateHintConfidence(move).toFixed(1)}%</strong></p>
            <div class="hint-explanation">
                <small>This move creates the highest scoring combination with potential cascades.</small>
            </div>
        `;
        
        // Auto-hide hint after 5 seconds
        setTimeout(() => {
            hintOverlay.innerHTML = '';
        }, 5000);
    }
    
    createHintArrow(gemPos) {
        const arrow = document.createElement('div');
        arrow.className = 'hint-arrow';
        arrow.textContent = '💎';
        arrow.style.left = (gemPos.col * 60 + 25) + 'px';
        arrow.style.top = (gemPos.row * 60 + 25) + 'px';
        return arrow;
    }
    
    // Auto-solve feature (for demonstration)
    autoSolve() {
        if (this.gameState !== 'playing') return;
        
        const bestMove = this.grid.findAllPossibleMoves()[0];
        if (bestMove) {
            const gem1 = this.grid.gems[bestMove.gem1.row][bestMove.gem1.col];
            const gem2 = this.grid.gems[bestMove.gem2.row][bestMove.gem2.col];
            
            if (gem1 && gem2) {
                this.performMove(gem1, gem2);
            }
        }
    }
    
    // Game state management
    checkGameEnd() {
        if (this.moves <= 0) {
            if (this.score >= this.target.score) {
                this.gameState = 'won';
                this.onGameWon();
            } else {
                this.gameState = 'game-over';
                this.onGameOver();
            }
        } else if (!this.grid.hasPossibleMoves()) {
            this.gameState = 'no-moves';
            this.onNoMovesLeft();
        }
    }
    
    onGameWon() {
        console.log('Level completed!');
        // Trigger celebration animation
        // Advance to next level
    }
    
    onGameOver() {
        console.log('Game Over!');
        // Show game over screen
    }
    
    onNoMovesLeft() {
        console.log('No moves available!');
        // Shuffle board or end game
    }
    
    // UI Update methods
    updateGameUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('moves').textContent = this.moves;
    }
    
    updatePerformanceDisplay() {
        document.getElementById('eval-time').textContent = `${this.performance.averageThinkTime.toFixed(0)}ms`;
        document.getElementById('nodes-explored').textContent = this.performance.movesAnalyzed;
    }
    
    updateAIAnalysis() {
        // Update AI analysis panel with current board evaluation
        const possibleMoves = this.grid.findAllPossibleMoves();
        const analysis = {
            possibleMoves: possibleMoves.length,
            bestMoveScore: possibleMoves.length > 0 ? possibleMoves[0].score : 0,
            boardComplexity: this.calculateBoardComplexity()
        };
        
        // Update analysis display (implement in UIManager)
        this.aiAnalysis = analysis;
    }
    
    calculateBoardComplexity() {
        // Simple metric: variety of gem types and distribution
        const typeCounts = {};
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const gem = this.grid.gems[row][col];
                if (gem) {
                    typeCounts[gem.type] = (typeCounts[gem.type] || 0) + 1;
                }
            }
        }
        
        return Object.keys(typeCounts).length;
    }
    
    // Main render method
    render() {
        this.grid.draw(this.ctx);
        
        // Render additional UI elements
        this.renderGameState();
        this.renderDebugInfo();
    }
    
    renderGameState() {
        // Render game state overlays if needed
        if (this.gameState === 'game-over') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    renderDebugInfo() {
        // Render debug information in development
        if (window.DEBUG_MODE) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`FPS: ${(1000 / (Date.now() - this.lastFrameTime)).toFixed(1)}`, 10, 20);
            this.ctx.fillText(`Moves: ${this.grid.findAllPossibleMoves().length}`, 10, 35);
        }
    }
    
    // Start the game
    start() {
        if (this.isRunning) return; // Prevent multiple loops
        this.isRunning = true;
        if (this.gameState !== 'paused') {
            this.gameState = 'playing';
        }
        this.updateGameUI();
        this.update(Date.now());
    }
    
    // Restart the game
    restart() {
        this.grid.reset();
        this.score = 0;
        this.moves = 30;
        this.level = 1;
        this.gameState = 'playing';
        this.selectedGem = null;
        this.clearHints();
        this.updateGameUI();
    }
    
    // Pause/Resume
    pause() {
        this.gameState = this.gameState === 'paused' ? 'playing' : 'paused';
    }
}