/**
 * Minimax Solver - AI opponent using minimax algorithm with alpha-beta pruning
 * Demonstrates game tree search algorithms for academic purposes
 */
class MinimaxSolver {
    constructor(maxDepth = 3) {
        this.maxDepth = maxDepth;
        this.nodeCount = 0;
        this.evaluationTime = 0;
        this.timeBudgetMs = 20; // Reduced from 40ms to 20ms for better responsiveness
        this.maxNodes = 5000; // Reduced from 10000 for safety
        this.startTime = 0;
        
        // Evaluation weights for different game features
        this.weights = {
            score: 1.0,
            moves: 0.5,
            possibleMoves: 0.3,
            specialGems: 2.0,
            centerControl: 0.2
        };
        
        // Transposition table for memoization
        this.transpositionTable = new Map();
        this.maxTableSize = 1000;
    }
    
    // Find the best move using minimax algorithm
    findBestMove(grid, depth = null, isMaximizing = true) {
        this.startTime = performance.now();
        this.nodeCount = 0;
        const searchDepth = depth || this.maxDepth;
        
        // Clear transposition table for new search
        this.transpositionTable.clear();

        let result;
        try {
            result = this.minimax(grid, searchDepth, -Infinity, Infinity, isMaximizing);
        } catch (e) {
            console.warn('Minimax aborted:', e.message);
            // Fallback: choose first possible move
            const fallbackMoves = grid.findAllPossibleMoves();
            result = { move: fallbackMoves[0] || null, score: 0 };
        }

        this.evaluationTime = performance.now() - this.startTime;
        return {
            move: result.move,
            score: result.score,
            nodesExplored: this.nodeCount,
            evaluationTime: this.evaluationTime,
            depth: searchDepth,
            aborted: this.evaluationTime > this.timeBudgetMs || this.nodeCount >= this.maxNodes
        };
    }
    
    // Minimax algorithm with alpha-beta pruning
    minimax(grid, depth, alpha, beta, isMaximizing) {
        // Time / node guard
        if (performance.now() - this.startTime > this.timeBudgetMs) {
            throw new Error('time_budget_exceeded');
        }
        if (++this.nodeCount >= this.maxNodes) {
            throw new Error('node_limit_exceeded');
        }
        
        // Check transposition table
        const boardHash = grid.getBoardHash ? grid.getBoardHash() : this.getSimpleHash(grid);
        const tableKey = `${boardHash}-${depth}-${isMaximizing}`;
        if (this.transpositionTable.has(tableKey)) {
            return this.transpositionTable.get(tableKey);
        }
        
        // Base case: reached maximum depth or no moves available
        if (depth === 0) {
            const result = {
                score: this.evaluateBoard(grid),
                move: null
            };
            this.storeInTable(tableKey, result);
            return result;
        }

        const possibleMoves = grid.findAllPossibleMoves();
        if (possibleMoves.length === 0) {
            const result = { score: this.evaluateBoard(grid), move: null };
            this.storeInTable(tableKey, result);
            return result;
        }
        
        let bestMove = null;
        
        if (isMaximizing) {
            let maxScore = -Infinity;
            
            for (const move of possibleMoves) {
                // Make the move
                const gem1 = grid.gems[move.gem1.row][move.gem1.col];
                const gem2 = grid.gems[move.gem2.row][move.gem2.col];
                
                // Work on a lightweight clone so we don't mutate original grid repeatedly
                const cloned = this.shallowCloneGrid(grid);
                const cGem1 = cloned.gems[move.gem1.row][move.gem1.col];
                const cGem2 = cloned.gems[move.gem2.row][move.gem2.col];
                // Data-only swap on cloned grid
                cloned.swapGemsData(cGem1, cGem2);
                this.fastSimulate(cloned); // resolve immediate matches quickly
                const result = this.minimax(cloned, depth - 1, alpha, beta, false);
                
                if (result.score > maxScore) {
                    maxScore = result.score;
                    bestMove = move;
                }
                
                alpha = Math.max(alpha, result.score);
                
                // Alpha-beta pruning
                if (beta <= alpha) {
                    break;
                }
            }
            
            const result = { score: maxScore, move: bestMove };
            this.storeInTable(tableKey, result);
            return result;
            
        } else {
            let minScore = Infinity;
            
            for (const move of possibleMoves) {
                // Make the move
                const gem1 = grid.gems[move.gem1.row][move.gem1.col];
                const gem2 = grid.gems[move.gem2.row][move.gem2.col];
                
                const cloned = this.shallowCloneGrid(grid);
                const cGem1 = cloned.gems[move.gem1.row][move.gem1.col];
                const cGem2 = cloned.gems[move.gem2.row][move.gem2.col];
                // Data-only swap on cloned grid
                cloned.swapGemsData(cGem1, cGem2);
                this.fastSimulate(cloned);
                const result = this.minimax(cloned, depth - 1, alpha, beta, true);
                
                if (result.score < minScore) {
                    minScore = result.score;
                    bestMove = move;
                }
                
                beta = Math.min(beta, result.score);
                
                // Alpha-beta pruning
                if (beta <= alpha) {
                    break;
                }
            }
            
            const result = { score: minScore, move: bestMove };
            this.storeInTable(tableKey, result);
            return result;
        }
    }
    
    // Fast simulate: single pass match + gravity (no infinite while)
    fastSimulate(grid) {
        const matches = grid.findMatches();
        if (matches.length === 0) {
            grid.simulationScore = 0;
            grid.cascadeCount = 0;
            return;
        }
        const gained = grid.removeMatches(matches);
        grid.applyGravity();
        grid.simulationScore = gained;
        grid.cascadeCount = 1; // Only one cascade considered for speed
    }
    
    // Shallow clone without regenerating random board
    shallowCloneGrid(original) {
    const cloned = Object.create(Object.getPrototypeOf(original));
        // Copy primitive properties quickly
        cloned.rows = original.rows;
        cloned.cols = original.cols;
        cloned.simulationScore = 0;
        cloned.cascadeCount = 0;
    cloned.simulationMode = true; // ensure no animations/timeouts
        // Clone gem matrix references (clone gem objects minimally)
        cloned.gems = [];
        for (let r = 0; r < original.rows; r++) {
            const rowArr = [];
            for (let c = 0; c < original.cols; c++) {
                const g = original.gems[r][c];
                if (g) {
                    // Minimal clone: keep only fields used by evaluation
                    const cg = g.clone();
                    rowArr[c] = cg;
                } else {
                    rowArr[c] = null;
                }
            }
            cloned.gems[r] = rowArr;
        }
        // Reuse Grid methods by binding prototype methods (assuming Grid functions don't rely on constructor side-effects beyond gems/rows/cols)
        cloned.findMatches = original.findMatches.bind(cloned);
        cloned.removeMatches = original.removeMatches.bind(cloned);
        cloned.applyGravity = original.applyGravity.bind(cloned);
        cloned.swapGemsData = original.swapGemsData.bind(cloned);
        // Keep a non-animated alias for compatibility
        cloned.swapGems = cloned.swapGemsData;
        cloned.findAllPossibleMoves = original.findAllPossibleMoves.bind(cloned);
        return cloned;
    }
    
    // Evaluate the board state using various heuristics
    evaluateBoard(grid) {
        let score = 0;
        
        // Base score from simulation results
        if (grid.simulationScore) {
            score += grid.simulationScore * this.weights.score;
        }
        
        // Bonus for cascade potential
        if (grid.cascadeCount) {
            score += grid.cascadeCount * 50 * this.weights.score;
        }
        
        // Number of available moves (more options = better position)
        let moveCount = 0;
        try {
            moveCount = grid.findAllPossibleMoves().length;
        } catch (e) {
            // In rare cases cloning anomalies; ignore
            moveCount = 0;
        }
        score += Math.min(moveCount, 30) * this.weights.possibleMoves; // cap influence
        
        // Special gems on board
        score += this.countSpecialGems(grid) * this.weights.specialGems;
        
        // Control of center positions
        score += this.evaluateCenterControl(grid) * this.weights.centerControl;
        
        // Pattern recognition bonus
        score += this.evaluatePatterns(grid);
        
        return score;
    }
    
    // Count special gems on the board
    countSpecialGems(grid) {
        let count = 0;
        
        for (let row = 0; row < grid.rows; row++) {
            for (let col = 0; col < grid.cols; col++) {
                const gem = grid.gems[row][col];
                if (gem && gem.isSpecial) {
                    count++;
                }
            }
        }
        
        return count;
    }
    
    // Evaluate control of center positions
    evaluateCenterControl(grid) {
        let centerValue = 0;
        const centerRow = Math.floor(grid.rows / 2);
        const centerCol = Math.floor(grid.cols / 2);
        const radius = 2;
        
        for (let row = Math.max(0, centerRow - radius); row <= Math.min(grid.rows - 1, centerRow + radius); row++) {
            for (let col = Math.max(0, centerCol - radius); col <= Math.min(grid.cols - 1, centerCol + radius); col++) {
                const gem = grid.gems[row][col];
                if (gem) {
                    // Distance from center (closer = more valuable)
                    const distance = Math.abs(row - centerRow) + Math.abs(col - centerCol);
                    centerValue += (radius - distance + 1) * 10;
                }
            }
        }
        
        return centerValue;
    }
    
    // Evaluate beneficial patterns on the board
    evaluatePatterns(grid) {
        let patternScore = 0;
        
        // Look for T-shapes, L-shapes, and other strategic patterns
        for (let row = 0; row < grid.rows; row++) {
            for (let col = 0; col < grid.cols; col++) {
                const gem = grid.gems[row][col];
                if (!gem) continue;
                
                // T-shape detection
                if (this.isTShape(grid, row, col)) {
                    patternScore += 30;
                }
                
                // L-shape detection
                if (this.isLShape(grid, row, col)) {
                    patternScore += 25;
                }
                
                // Square pattern detection (2x2)
                if (this.isSquarePattern(grid, row, col)) {
                    patternScore += 20;
                }
            }
        }
        
        return patternScore;
    }
    
    // Check if position forms a T-shape pattern
    isTShape(grid, row, col) {
        const gem = grid.gems[row][col];
        if (!gem) return false;
        
        // Check horizontal T (vertical line with horizontal cross)
        if (row > 0 && row < grid.rows - 1 && col > 0 && col < grid.cols - 1) {
            const up = grid.gems[row - 1][col];
            const down = grid.gems[row + 1][col];
            const left = grid.gems[row][col - 1];
            const right = grid.gems[row][col + 1];
            
            if (up && down && (left || right) &&
                up.type === gem.type && down.type === gem.type &&
                ((left && left.type === gem.type) || (right && right.type === gem.type))) {
                return true;
            }
        }
        
        return false;
    }
    
    // Check if position forms an L-shape pattern
    isLShape(grid, row, col) {
        const gem = grid.gems[row][col];
        if (!gem) return false;
        
        // Check various L-shape orientations
        const directions = [
            [[0, 1], [1, 0]],   // Right-Down L
            [[0, -1], [1, 0]],  // Left-Down L
            [[0, 1], [-1, 0]],  // Right-Up L
            [[0, -1], [-1, 0]]  // Left-Up L
        ];
        
        for (const [dir1, dir2] of directions) {
            const gem1 = this.getGemAt(grid, row + dir1[0], col + dir1[1]);
            const gem2 = this.getGemAt(grid, row + dir2[0], col + dir2[1]);
            
            if (gem1 && gem2 && gem1.type === gem.type && gem2.type === gem.type) {
                return true;
            }
        }
        
        return false;
    }
    
    // Check if position forms a square pattern
    isSquarePattern(grid, row, col) {
        if (row >= grid.rows - 1 || col >= grid.cols - 1) return false;
        
        const gem = grid.gems[row][col];
        if (!gem) return false;
        
        const topRight = grid.gems[row][col + 1];
        const bottomLeft = grid.gems[row + 1][col];
        const bottomRight = grid.gems[row + 1][col + 1];
        
        return topRight && bottomLeft && bottomRight &&
               topRight.type === gem.type &&
               bottomLeft.type === gem.type &&
               bottomRight.type === gem.type;
    }
    
    // Helper function to safely get gem at position
    getGemAt(grid, row, col) {
        if (row < 0 || row >= grid.rows || col < 0 || col >= grid.cols) {
            return null;
        }
        return grid.gems[row][col];
    }
    
    // Store result in transposition table with size limit
    storeInTable(key, result) {
        if (this.transpositionTable.size >= this.maxTableSize) {
            // Remove oldest entry (first entry)
            const firstKey = this.transpositionTable.keys().next().value;
            this.transpositionTable.delete(firstKey);
        }
        this.transpositionTable.set(key, result);
    }
    
    // Simple hash for grids without getBoardHash method
    getSimpleHash(grid) {
        let hash = '';
        for (let r = 0; r < grid.rows; r++) {
            for (let c = 0; c < grid.cols; c++) {
                const gem = grid.gems[r]?.[c];
                hash += gem ? gem.type : '0';
            }
        }
        return hash;
    }
    
    // Set difficulty level
    setDifficulty(difficulty) {
        switch (difficulty) {
            case 'easy':
                this.maxDepth = 2;
                break;
            case 'medium':
                this.maxDepth = 3;
                break;
            case 'hard':
                this.maxDepth = 4;
                break;
            default:
                this.maxDepth = 3;
        }
    }
    
    // Get performance statistics
    getPerformanceStats() {
        return {
            nodesExplored: this.nodeCount,
            evaluationTime: this.evaluationTime,
            maxDepth: this.maxDepth,
            avgTimePerNode: this.nodeCount > 0 ? this.evaluationTime / this.nodeCount : 0
        };
    }
}

// Export to window
if (typeof window !== 'undefined') {
    window.MinimaxSolver = MinimaxSolver;
}