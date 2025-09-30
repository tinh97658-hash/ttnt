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

    // Find all current matches on the board
    findMatches() {
        const matches = new Set();

        // Find horizontal matches
        for (let row = 0; row < this.rows; row++) {
            let count = 1;
            let currentType = this.gems[row][0] ? this.gems[row][0].type : null;

            for (let col = 1; col < this.cols; col++) {
                const gem = this.gems[row][col];

                if (gem && currentType && gem.type === currentType) {
                    count++;
                } else {
                    if (count >= 3 && currentType) {
                        // Add matched gems
                        for (let i = col - count; i < col; i++) {
                            matches.add(`${row},${i}`);
                        }
                    }

                    count = 1;
                    currentType = gem ? gem.type : null;
                }
            }

            // Check end of row
            if (count >= 3 && currentType) {
                for (let i = this.cols - count; i < this.cols; i++) {
                    matches.add(`${row},${i}`);
                }
            }
        }

        // Find vertical matches
        for (let col = 0; col < this.cols; col++) {
            let count = 1;
            let currentType = this.gems[0][col] ? this.gems[0][col].type : null;

            for (let row = 1; row < this.rows; row++) {
                const gem = this.gems[row][col];

                if (gem && currentType && gem.type === currentType) {
                    count++;
                } else {
                    if (count >= 3 && currentType) {
                        // Add matched gems
                        for (let i = row - count; i < row; i++) {
                            matches.add(`${i},${col}`);
                        }
                    }

                    count = 1;
                    currentType = gem ? gem.type : null;
                }
            }

            // Check end of column
            if (count >= 3 && currentType) {
                for (let i = this.rows - count; i < this.rows; i++) {
                    matches.add(`${i},${col}`);
                }
            }
        }

        return Array.from(matches).map(pos => {
            const [row, col] = pos.split(',').map(Number);
            return { row, col };
        });
    }

    // Remove matched gems from board
    removeMatches(matches) {
        let score = 0;

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

        return moved;
    }

    // Check if two gems can be swapped
    canSwap(gem1, gem2) {
        // Must be adjacent
        const rowDiff = Math.abs(gem1.row - gem2.row);
        const colDiff = Math.abs(gem1.col - gem2.col);

        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            // Temporarily swap and check for matches (data-only)
            this.swapGemsData(gem1, gem2);
            const matches = this.findMatches();
            this.swapGemsData(gem1, gem2); // Swap back

            return matches.length > 0;
        }

        return false;
    }

    // Data-only swap (no animation). Safe for evaluation/simulation.
    swapGemsData(gem1, gem2) {
        const r1 = gem1.row, c1 = gem1.col;
        const r2 = gem2.row, c2 = gem2.col;

        gem1.row = r2; gem1.col = c2;
        gem2.row = r1; gem2.col = c1;

        this.gems[gem1.row][gem1.col] = gem1;
        this.gems[gem2.row][gem2.col] = gem2;
    }

    // Animated swap for real gameplay (skips animation in simulation mode)
    swapGemsAnimated(gem1, gem2, duration = 300) {
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

        matches.forEach(match => {
            const gem = this.gems[match.row][match.col];
            if (gem) {
                score += this.calculateGemScore(gem, matches.length);
            }
        });

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