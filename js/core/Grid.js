/**
 * Grid Class - Manages the game board and gem matrix
 * Core game logic for match-3 mechanics
 */
class Grid {
    constructor(rows = 8, cols = 8) {
        this.rows = rows;
        this.cols = cols;
        this.gems = [];
        this.selectedGem = null;
        this.possibleMoves = [];

        // When true, skip animations/timeouts for fast AI simulation
        this.simulationMode = false;

        // Initialize empty grid and generate the board
        this.initializeGrid();
        this.generateInitialBoard();

        // AI data structures
        this.boardHistory = [];
        this.lastMoveScore = 0;
        
        // Performance optimization: cache matches
        this._matchCache = null;
        this._boardStateHash = null;
    }

    initializeGrid() {
        this.gems = [];
        for (let row = 0; row < this.rows; row++) {
            this.gems[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.gems[row][col] = null;
            }
        }
    }

    generateInitialBoard() {
        // Fill board ensuring no initial matches
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                let gemType;
                let attempts = 0;

                do {
                    gemType = Math.floor(Math.random() * 6) + 1;
                    attempts++;

                    // Prevent infinite loop
                    if (attempts > 20) {
                        gemType = 1;
                        break;
                    }
                } while (this.wouldCreateMatch(row, col, gemType));

                this.gems[row][col] = new Gem(row, col, gemType);
            }
        }

        // Store initial board state for AI
        this.saveCurrentState();
    }

    wouldCreateMatch(row, col, type) {
        // Check horizontal match
        let horizontalCount = 1;

        // Check left
        for (let c = col - 1; c >= 0; c--) {
            if (this.gems[row][c] && this.gems[row][c].type === type) {
                horizontalCount++;
            } else {
                break;
            }
        }

        // Check right
        for (let c = col + 1; c < this.cols; c++) {
            if (this.gems[row][c] && this.gems[row][c].type === type) {
                horizontalCount++;
            } else {
                break;
            }
        }

        if (horizontalCount >= 3) return true;

        // Check vertical match
        let verticalCount = 1;

        // Check up
        for (let r = row - 1; r >= 0; r--) {
            if (this.gems[r][col] && this.gems[r][col].type === type) {
                verticalCount++;
            } else {
                break;
            }
        }

        // Check down
        for (let r = row + 1; r < this.rows; r++) {
            if (this.gems[r][col] && this.gems[r][col].type === type) {
                verticalCount++;
            } else {
                break;
            }
        }

        return verticalCount >= 3;
    }

    // Find all current matches on the board (optimized with caching)
    findMatches() {
        // Check if board state has changed
        const currentHash = this.getBoardHash();
        if (this._boardStateHash === currentHash && this._matchCache) {
            return this._matchCache;
        }
        
        const matches = new Set();
        let hasMatch = false;

        // Find horizontal matches (optimized)
        for (let row = 0; row < this.rows; row++) {
            let count = 1;
            let currentType = this.gems[row][0]?.type || null;
            let hasSpecialInSequence = this.gems[row][0]?.isSpecial || false;

            for (let col = 1; col < this.cols; col++) {
                const gem = this.gems[row][col];
                const gemType = gem?.type || null;

                if (gemType && gemType === currentType) {
                    count++;
                    if (gem.isSpecial) hasSpecialInSequence = true;
                } else {
                    // Don't match if sequence contains special gem
                    if (count >= 3 && currentType && !hasSpecialInSequence) {
                        hasMatch = true;
                        // Add matched gems
                        for (let i = col - count; i < col; i++) {
                            matches.add(`${row},${i}`);
                        }
                    }

                    count = 1;
                    currentType = gemType;
                    hasSpecialInSequence = gem?.isSpecial || false;
                }
            }

            // Check end of row
            if (count >= 3 && currentType && !hasSpecialInSequence) {
                hasMatch = true;
                for (let i = this.cols - count; i < this.cols; i++) {
                    matches.add(`${row},${i}`);
                }
            }
        }

        // Find vertical matches (optimized)
        for (let col = 0; col < this.cols; col++) {
            let count = 1;
            let currentType = this.gems[0][col]?.type || null;
            let hasSpecialInSequence = this.gems[0][col]?.isSpecial || false;

            for (let row = 1; row < this.rows; row++) {
                const gem = this.gems[row][col];
                const gemType = gem?.type || null;

                if (gemType && gemType === currentType) {
                    count++;
                    if (gem.isSpecial) hasSpecialInSequence = true;
                } else {
                    // Don't match if sequence contains special gem
                    if (count >= 3 && currentType && !hasSpecialInSequence) {
                        hasMatch = true;
                        // Add matched gems
                        for (let i = row - count; i < row; i++) {
                            matches.add(`${i},${col}`);
                        }
                    }

                    count = 1;
                    currentType = gemType;
                    hasSpecialInSequence = gem?.isSpecial || false;
                }
            }

            // Check end of column
            if (count >= 3 && currentType && !hasSpecialInSequence) {
                hasMatch = true;
                for (let i = this.rows - count; i < this.rows; i++) {
                    matches.add(`${i},${col}`);
                }
            }
        }

        const result = Array.from(matches).map(pos => {
            const [row, col] = pos.split(',').map(Number);
            return { row, col };
        });
        
        // Cache the result
        this._matchCache = result;
        this._boardStateHash = currentHash;
        
        return result;
    }

    // Remove matched gems from board and create special gems
    removeMatches(matches) {
        let score = 0;
        
        // Group matches by connected components to detect match sizes
        const matchGroups = this.groupMatchesByConnection(matches);
        
        // Determine if we should create special gems
        let specialGemCreated = false;
        matchGroups.forEach(group => {
            const matchSize = group.length;
            
            // Create special gem for matches of 4 or more
            if (matchSize >= 4 && !specialGemCreated && !this.simulationMode) {
                // Find center position of the match group
                const centerPos = this.findMatchCenter(group);
                const centerGem = this.gems[centerPos.row][centerPos.col];
                
                if (centerGem) {
                    // Determine special type based on match size
                    if (matchSize >= 6) {
                        centerGem.isSpecial = true;
                        centerGem.specialType = 'rainbow';
                    } else if (matchSize === 5) {
                        centerGem.isSpecial = true;
                        centerGem.specialType = 'bomb';
                    } else if (matchSize === 4) {
                        centerGem.isSpecial = true;
                        centerGem.specialType = 'lightning';
                    }
                    
                    // Don't remove the center gem, it becomes special
                    centerGem.matched = false;
                    specialGemCreated = true;
                    
                    // Remove this gem from matches list
                    const index = matches.findIndex(m => m.row === centerPos.row && m.col === centerPos.col);
                    if (index > -1) {
                        matches.splice(index, 1);
                    }
                }
            }
        });

        matches.forEach(match => {
            const gem = this.gems[match.row][match.col];
            if (gem) {
                gem.matched = true;
                score += this.calculateGemScore(gem, matches.length);

                if (this.simulationMode) {
                    this.gems[match.row][match.col] = null;
                } else {
                    // Delay removal for animation
                    setTimeout(() => {
                        this.gems[match.row][match.col] = null;
                    }, 200);
                }
            }
        });

        this.lastMoveScore = score;
        this.invalidateMatchCache();
        return score;
    }

    calculateGemScore(gem, comboSize) {
        let baseScore = 10;

        // Special gem bonus
        if (gem.isSpecial) {
            baseScore *= 3;
        }

        // Combo multiplier
        const comboMultiplier = Math.min(comboSize / 3, 5);

        return Math.floor(baseScore * comboMultiplier);
    }
    
    // Group matches into connected components
    groupMatchesByConnection(matches) {
        const groups = [];
        const visited = new Set();
        
        matches.forEach(match => {
            const key = `${match.row},${match.col}`;
            if (visited.has(key)) return;
            
            const group = [];
            const queue = [match];
            const gemType = this.gems[match.row]?.[match.col]?.type;
            
            while (queue.length > 0) {
                const current = queue.shift();
                const currentKey = `${current.row},${current.col}`;
                
                if (visited.has(currentKey)) continue;
                visited.add(currentKey);
                group.push(current);
                
                // Check adjacent matches
                const directions = [[-1,0], [1,0], [0,-1], [0,1]];
                directions.forEach(([dr, dc]) => {
                    const newRow = current.row + dr;
                    const newCol = current.col + dc;
                    const newKey = `${newRow},${newCol}`;
                    
                    if (!visited.has(newKey) && 
                        matches.some(m => m.row === newRow && m.col === newCol) &&
                        this.gems[newRow]?.[newCol]?.type === gemType) {
                        queue.push({ row: newRow, col: newCol });
                    }
                });
            }
            
            if (group.length > 0) {
                groups.push(group);
            }
        });
        
        return groups;
    }
    
    // Find center position of a match group
    findMatchCenter(group) {
        if (group.length === 0) return null;
        
        // Calculate average position
        const avgRow = Math.round(group.reduce((sum, m) => sum + m.row, 0) / group.length);
        const avgCol = Math.round(group.reduce((sum, m) => sum + m.col, 0) / group.length);
        
        // Find closest actual position to average
        let closest = group[0];
        let minDist = Infinity;
        
        group.forEach(pos => {
            const dist = Math.abs(pos.row - avgRow) + Math.abs(pos.col - avgCol);
            if (dist < minDist) {
                minDist = dist;
                closest = pos;
            }
        });
        
        return closest;
    }

    // Apply gravity and fill empty spaces
    applyGravity() {
        let moved = false;

        for (let col = 0; col < this.cols; col++) {
            // Collect non-null gems from bottom to top
            const columnGems = [];

            for (let row = this.rows - 1; row >= 0; row--) {
                if (this.gems[row][col]) {
                    columnGems.push(this.gems[row][col]);
                }
            }

            // Clear column
            for (let row = 0; row < this.rows; row++) {
                this.gems[row][col] = null;
            }

            // Place gems at bottom
            for (let i = 0; i < columnGems.length; i++) {
                const newRow = this.rows - 1 - i;
                const gem = columnGems[i];

                if (gem.row !== newRow) {
                    moved = true;
                    gem.row = newRow;
                    if (this.simulationMode) {
                        gem.x = gem.col * 60;
                        gem.y = newRow * 60;
                        gem.animating = false;
                    } else {
                        gem.animateTo(gem.col * 60, newRow * 60, 300);
                    }
                }

                this.gems[newRow][col] = gem;
            }

            // Fill empty spaces with new gems
            const empties = this.rows - columnGems.length;
            for (let row = 0; row < empties; row++) {
                const gem = new Gem(row, col);
                if (this.simulationMode) {
                    gem.x = gem.col * 60;
                    gem.y = row * 60;
                    gem.falling = false;
                    gem.animating = false;
                } else {
                    gem.y = (row - empties) * 60; // Start above visible area
                    gem.falling = true;
                    gem.animateTo(gem.col * 60, row * 60, 400);
                }

                this.gems[row][col] = gem;
                moved = true;
            }
        }

        if (moved) {
            this.invalidateMatchCache();
        }
        return moved;
    }

    // Check if two gems can be swapped
    canSwap(gem1, gem2) {
        // Must be adjacent
        const rowDiff = Math.abs(gem1.row - gem2.row);
        const colDiff = Math.abs(gem1.col - gem2.col);

        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            // Check if either gem is special - special gems can always be swapped
            if (gem1.isSpecial || gem2.isSpecial) {
                return true;
            }
            
            // Temporarily swap and check for matches (data-only)
            this.swapGemsData(gem1, gem2);
            const matches = this.findMatches();
            this.swapGemsData(gem1, gem2); // Swap back

            return matches.length > 0;
        }

        return false;
    }
    
    // Activate special gem effect
    activateSpecialGem(gem) {
        if (!gem || !gem.isSpecial) return [];
        
        const affectedGems = [];
        const specialType = gem.specialType;
        
        switch (gem.specialType) {
            case 'bomb':
                // Destroy 5x5 area around the gem
                for (let dr = -2; dr <= 2; dr++) {
                    for (let dc = -2; dc <= 2; dc++) {
                        const row = gem.row + dr;
                        const col = gem.col + dc;
                        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                            const targetGem = this.gems[row][col];
                            if (targetGem) {
                                targetGem.startDestruction('bomb');
                                affectedGems.push({ row, col });
                            }
                        }
                    }
                }
                break;
                
            case 'lightning':
                // Destroy entire row and column
                for (let c = 0; c < this.cols; c++) {
                    const targetGem = this.gems[gem.row][c];
                    if (targetGem) {
                        targetGem.startDestruction('lightning');
                        affectedGems.push({ row: gem.row, col: c });
                    }
                }
                for (let r = 0; r < this.rows; r++) {
                    const targetGem = this.gems[r][gem.col];
                    if (targetGem && r !== gem.row) {
                        targetGem.startDestruction('lightning');
                        affectedGems.push({ row: r, col: gem.col });
                    }
                }
                break;
                
            case 'rainbow':
                // Destroy all gems of the same type as the swapped gem
                // Need to pass target type from swap context
                const targetType = gem.rainbowTargetType || gem.type;
                for (let r = 0; r < this.rows; r++) {
                    for (let c = 0; c < this.cols; c++) {
                        const targetGem = this.gems[r][c];
                        if (targetGem && targetGem.type === targetType && !targetGem.isSpecial) {
                            targetGem.startDestruction('rainbow');
                            affectedGems.push({ row: r, col: c });
                        }
                    }
                }
                break;
        }
        
        return affectedGems;
    }

    // Data-only swap (no animation). Safe for evaluation/simulation.
    swapGemsData(gem1, gem2) {
        const r1 = gem1.row, c1 = gem1.col;
        const r2 = gem2.row, c2 = gem2.col;

        gem1.row = r2; gem1.col = c2;
        gem2.row = r1; gem2.col = c1;

        this.gems[gem1.row][gem1.col] = gem1;
        this.gems[gem2.row][gem2.col] = gem2;
        
        // Invalidate match cache when board changes
        this.invalidateMatchCache();
    }

    // Animated swap for real gameplay (skips animation in simulation mode)
    swapGemsAnimated(gem1, gem2, duration = 300) {
        // Check for special gems before swap
        const hasSpecial = gem1.isSpecial || gem2.isSpecial;
        
        // If rainbow gem, remember target type
        if (gem1.isSpecial && gem1.specialType === 'rainbow') {
            gem1.rainbowTargetType = gem2.type;
        }
        if (gem2.isSpecial && gem2.specialType === 'rainbow') {
            gem2.rainbowTargetType = gem1.type;
        }
        
        this.swapGemsData(gem1, gem2);
        
        if (this.simulationMode) {
            gem1.x = gem1.col * 60;
            gem1.y = gem1.row * 60;
            gem1.animating = false;
            gem2.x = gem2.col * 60;
            gem2.y = gem2.row * 60;
            gem2.animating = false;
        } else {
            gem1.animateTo(gem1.col * 60, gem1.row * 60, duration);
            gem2.animateTo(gem2.col * 60, gem2.row * 60, duration);
            
            // Activate special gem effects after swap animation
            if (hasSpecial) {
                setTimeout(() => {
                    this.processSpecialGemEffects(gem1, gem2);
                }, duration + 100);
            }
        }
    }
    
    // Process special gem effects after swap
    processSpecialGemEffects(gem1, gem2) {
        const affectedPositions = [];
        
        if (gem1.isSpecial) {
            const affected = this.activateSpecialGem(gem1);
            affectedPositions.push(...affected);
            // Add the special gem itself to be destroyed
            affectedPositions.push({ row: gem1.row, col: gem1.col });
            gem1.startDestruction(gem1.specialType);
        }
        
        if (gem2.isSpecial) {
            const affected = this.activateSpecialGem(gem2);
            affectedPositions.push(...affected);
            // Add the special gem itself to be destroyed
            affectedPositions.push({ row: gem2.row, col: gem2.col });
            gem2.startDestruction(gem2.specialType);
        }
        
        // Remove affected gems
        if (affectedPositions.length > 0) {
            // Gems already have destruction animation started by activateSpecialGem
            // Wait for destruction animations to complete (400ms) before removing
            setTimeout(() => {
                affectedPositions.forEach(pos => {
                    const gem = this.gems[pos.row][pos.col];
                    if (gem) {
                        // Cleanup gem properties to help GC
                        gem.destroying = false;
                        gem.animating = false;
                        gem.falling = false;
                    }
                    this.gems[pos.row][pos.col] = null;
                });
                this.invalidateMatchCache();
                
                // Trigger gravity and cascade
                if (typeof window !== 'undefined' && window.game && window.game.gameEngine) {
                    setTimeout(() => {
                        this.applyGravity();
                    }, 100);
                }
            }, 450); // Wait for 400ms destruction animation + 50ms buffer
        }
    }

    // Backward-compatible default swap (animated)
    swapGems(gem1, gem2) {
        this.swapGemsAnimated(gem1, gem2);
    }

    // Find all possible moves (for AI)
    findAllPossibleMoves() {
        const moves = [];

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const gem1 = this.gems[row][col];
                if (!gem1) continue;

                // Check right neighbor
                if (col < this.cols - 1) {
                    const gem2 = this.gems[row][col + 1];
                    if (gem2 && this.canSwap(gem1, gem2)) {
                        moves.push({
                            gem1: { row: gem1.row, col: gem1.col },
                            gem2: { row: gem2.row, col: gem2.col },
                            score: this.evaluateMove(gem1, gem2)
                        });
                    }
                }

                // Check down neighbor
                if (row < this.rows - 1) {
                    const gem2 = this.gems[row + 1][col];
                    if (gem2 && this.canSwap(gem1, gem2)) {
                        moves.push({
                            gem1: { row: gem1.row, col: gem1.col },
                            gem2: { row: gem2.row, col: gem2.col },
                            score: this.evaluateMove(gem1, gem2)
                        });
                    }
                }
            }
        }

        // Sort by score (best moves first)
        return moves.sort((a, b) => b.score - a.score);
    }

    // Evaluate the score potential of a move (data-only, no animations)
    evaluateMove(gem1, gem2) {
        // Temporarily perform the move (data-only)
        this.swapGemsData(gem1, gem2);

        const matches = this.findMatches();
        let score = 0;

        // Calculate score properly - each matched gem contributes based on total matches
        if (matches.length > 0) {
            // Use a fixed base score per gem, with bonus for larger combos
            const baseScorePerGem = 10;
            const totalMatchedGems = matches.length;
            
            // Combo multiplier based on number of gems matched (3=1x, 4=1.5x, 5=2x, etc.)
            const comboMultiplier = Math.min(totalMatchedGems / 3, 5);
            
            score = Math.floor(totalMatchedGems * baseScorePerGem * comboMultiplier);
            
            // Bonus for special gems if any
            matches.forEach(match => {
                const gem = this.gems[match.row][match.col];
                if (gem && gem.isSpecial) {
                    score += 20; // Special gem bonus
                }
            });
        }

        // Consider cascade potential (simplified heuristic)
        score += this.estimateCascadeScore();

        // Swap back (data-only)
        this.swapGemsData(gem1, gem2);

        return score;
    }

    estimateCascadeScore() {
        // Simple heuristic: count gems that might fall and create matches
        let potential = 0;

        for (let col = 0; col < this.cols; col++) {
            let emptySpaces = 0;
            for (let row = this.rows - 1; row >= 0; row--) {
                if (!this.gems[row][col]) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    // Gem will fall, potential for new matches
                    potential += emptySpaces * 5;
                }
            }
        }

        return potential;
    }

    // Get board state for AI analysis
    getBoardState() {
        if (!this.gems || this.gems.length === 0) {
            return [];
        }

        return this.gems.map(row => row.map(gem => (gem ? gem.serialize() : null)));
    }
    
    // Generate a quick hash of the board state for cache invalidation
    getBoardHash() {
        let hash = '';
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const gem = this.gems[row][col];
                hash += gem ? gem.type : '0';
            }
        }
        return hash;
    }
    
    // Invalidate match cache when board changes
    invalidateMatchCache() {
        this._matchCache = null;
        this._boardStateHash = null;
    }

    saveCurrentState() {
        try {
            // Ensure boardHistory is initialized
            if (!this.boardHistory) {
                this.boardHistory = [];
            }

            const boardState = this.getBoardState();
            if (boardState && boardState.length > 0) {
                this.boardHistory.push(JSON.parse(JSON.stringify(boardState)));

                // Limit history size
                if (this.boardHistory.length > 10) {
                    this.boardHistory.shift();
                }
            }
        } catch (error) {
            console.warn('Failed to save board state:', error);
        }
    }

    // Draw the grid
    draw(ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw background grid
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;

        for (let i = 0; i <= this.cols; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 60, 0);
            ctx.lineTo(i * 60, this.rows * 60);
            ctx.stroke();
        }

        for (let i = 0; i <= this.rows; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * 60);
            ctx.lineTo(this.cols * 60, i * 60);
            ctx.stroke();
        }

        // Draw gems
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const gem = this.gems[row][col];
                if (gem) {
                    gem.draw(ctx);
                }
            }
        }

        // Draw hint arrows if there's an active hint
        this.drawHintArrows(ctx);
    }

    // Draw arrows between hinted gems (optional overlay)
    drawHintArrows(ctx) {
        if (!window.game || !window.game.currentHint) return;

        const hint = window.game.currentHint;
        const gem1Pos = {
            x: hint.gem1.col * 60 + 30,
            y: hint.gem1.row * 60 + 30
        };
        const gem2Pos = {
            x: hint.gem2.col * 60 + 30,
            y: hint.gem2.row * 60 + 30
        };

        // Animated arrow
        const time = Date.now() - hint.startTime;
        const pulse = Math.sin(time / 400) * 0.3 + 0.7;

        ctx.save();
        ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
        ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
        ctx.lineWidth = 3;

        // Draw line
        ctx.beginPath();
        ctx.moveTo(gem1Pos.x, gem1Pos.y);
        ctx.lineTo(gem2Pos.x, gem2Pos.y);
        ctx.stroke();

        // Draw arrowheads at both ends
        this.drawArrowHead(ctx, gem1Pos.x, gem1Pos.y, gem2Pos.x, gem2Pos.y);
        this.drawArrowHead(ctx, gem2Pos.x, gem2Pos.y, gem1Pos.x, gem1Pos.y);

        ctx.restore();
    }

    // Draw arrow head
    drawArrowHead(ctx, fromX, fromY, toX, toY) {
        const headlen = 10; // arrow head size
        const angle = Math.atan2(toY - fromY, toX - fromX);

        // Move to the tip
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - headlen * Math.cos(angle - Math.PI / 6),
            toY - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - headlen * Math.cos(angle + Math.PI / 6),
            toY - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
        ctx.fill();
    }

    // Get gem at pixel coordinates
    getGemAt(x, y) {
        const row = Math.floor(y / 60);
        const col = Math.floor(x / 60);

        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.gems[row][col];
        }

        return null;
    }

    // Check if board has any possible moves
    hasPossibleMoves() {
        return this.findAllPossibleMoves().length > 0;
    }

    // Reset board for new game
    reset() {
        this.initializeGrid();
        this.generateInitialBoard();
        this.selectedGem = null;
        this.possibleMoves = [];
        this.boardHistory = [];
        this.lastMoveScore = 0;
    }
}

// Export to window
if (typeof window !== 'undefined') {
    window.Grid = Grid;
}