/**
 * Pattern Recognizer - Machine Learning-based pattern recognition
 * Identifies strategic patterns and gem formations for AI analysis
 */
class PatternRecognizer {
    constructor() {
        this.patterns = new Map();
        this.trainingData = [];
        this.weights = null;
        
        // Initialize with common patterns
        this.initializePatterns();
    }
    
    // Initialize common match-3 patterns
    initializePatterns() {
        // Basic match patterns
        this.addPattern('horizontal_3', [
            [1, 1, 1]
        ], 10);
        
        this.addPattern('vertical_3', [
            [1],
            [1],
            [1]
        ], 10);
        
        this.addPattern('horizontal_4', [
            [1, 1, 1, 1]
        ], 25);
        
        this.addPattern('vertical_4', [
            [1],
            [1],
            [1],
            [1]
        ], 25);
        
        // T-shape patterns (special gem creators)
        this.addPattern('t_shape_1', [
            [0, 1, 0],
            [1, 1, 1]
        ], 50);
        
        this.addPattern('t_shape_2', [
            [1, 0],
            [1, 1],
            [1, 0]
        ], 50);
        
        // L-shape patterns
        this.addPattern('l_shape_1', [
            [1, 1],
            [1, 0],
            [1, 0]
        ], 30);
        
        this.addPattern('l_shape_2', [
            [1, 1, 1],
            [1, 0, 0]
        ], 30);
        
        // Cross patterns (bomb creators)
        this.addPattern('cross', [
            [0, 1, 0],
            [1, 1, 1],
            [0, 1, 0]
        ], 75);
        
        // Square patterns
        this.addPattern('square_2x2', [
            [1, 1],
            [1, 1]
        ], 40);
        
        console.log(`Initialized ${this.patterns.size} base patterns`);
    }
    
    // Add a pattern to the recognition system
    addPattern(name, matrix, value) {
        this.patterns.set(name, {
            matrix: matrix,
            value: value,
            rotations: this.generateRotations(matrix)
        });
    }
    
    // Generate all rotations of a pattern
    generateRotations(matrix) {
        const rotations = [matrix];
        let current = matrix;
        
        // Generate 90, 180, 270 degree rotations
        for (let i = 0; i < 3; i++) {
            current = this.rotateMatrix90(current);
            rotations.push(current);
        }
        
        return rotations;
    }
    
    // Rotate matrix 90 degrees clockwise
    rotateMatrix90(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }
        
        return rotated;
    }
    
    // Recognize patterns in the game board
    recognizePatterns(grid) {
        const recognizedPatterns = [];
        
        // Check each position on the grid
        for (let row = 0; row < grid.rows; row++) {
            for (let col = 0; col < grid.cols; col++) {
                const patternsFound = this.findPatternsAt(grid, row, col);
                recognizedPatterns.push(...patternsFound);
            }
        }
        
        // Remove duplicates and sort by value
        return this.deduplicateAndSort(recognizedPatterns);
    }
    
    // Find patterns starting at a specific position
    findPatternsAt(grid, startRow, startCol) {
        const found = [];
        
        this.patterns.forEach((pattern, name) => {
            // Check all rotations of the pattern
            pattern.rotations.forEach((rotation, rotIndex) => {
                const match = this.matchPattern(grid, startRow, startCol, rotation);
                if (match) {
                    found.push({
                        name: name,
                        rotation: rotIndex,
                        position: { row: startRow, col: startCol },
                        value: pattern.value,
                        gems: match.gems,
                        confidence: match.confidence
                    });
                }
            });
        });
        
        return found;
    }
    
    // Check if a pattern matches at a specific position
    matchPattern(grid, startRow, startCol, pattern) {
        const rows = pattern.length;
        const cols = pattern[0].length;
        
        // Check if pattern fits within grid bounds
        if (startRow + rows > grid.rows || startCol + cols > grid.cols) {
            return null;
        }
        
        const matchedGems = [];
        let referenceType = null;
        let matchCount = 0;
        let totalPositions = 0;
        
        // Check each position in the pattern
        for (let pRow = 0; pRow < rows; pRow++) {
            for (let pCol = 0; pCol < cols; pCol++) {
                const gridRow = startRow + pRow;
                const gridCol = startCol + pCol;
                const gem = grid.gems[gridRow][gridCol];
                
                if (pattern[pRow][pCol] === 1) {
                    totalPositions++;
                    
                    if (!gem) {
                        return null; // Pattern requires a gem but none exists
                    }
                    
                    if (referenceType === null) {
                        referenceType = gem.type;
                    } else if (gem.type !== referenceType) {
                        return null; // Pattern requires same type gems
                    }
                    
                    matchedGems.push({ row: gridRow, col: gridCol, gem: gem });
                    matchCount++;
                }
            }
        }
        
        // Calculate confidence based on match completeness
        const confidence = totalPositions > 0 ? (matchCount / totalPositions) : 0;
        
        // Require perfect match for now (can be adjusted for fuzzy matching)
        if (confidence >= 1.0) {
            return {
                gems: matchedGems,
                confidence: confidence,
                type: referenceType
            };
        }
        
        return null;
    }
    
    // Remove duplicate patterns and sort by value
    deduplicateAndSort(patterns) {
        const unique = new Map();
        
        patterns.forEach(pattern => {
            const key = this.generatePatternKey(pattern);
            if (!unique.has(key) || unique.get(key).value < pattern.value) {
                unique.set(key, pattern);
            }
        });
        
        return Array.from(unique.values()).sort((a, b) => b.value - a.value);
    }
    
    // Generate unique key for pattern deduplication
    generatePatternKey(pattern) {
        const positions = pattern.gems.map(g => `${g.row},${g.col}`).sort();
        return `${pattern.name}_${positions.join('_')}`;
    }
    
    // Analyze board and suggest pattern-based moves
    analyzeBoard(grid) {
        const patterns = this.recognizePatterns(grid);
        const suggestions = [];
        
        // For each recognized pattern, find moves that could activate it
        patterns.forEach(pattern => {
            const moves = this.findMovesToActivatePattern(grid, pattern);
            suggestions.push(...moves);
        });
        
        // Also look for potential patterns after moves
        const potentialMoves = grid.findAllPossibleMoves();
        potentialMoves.forEach(move => {
            const patternValue = this.evaluateMoveForPatterns(grid, move);
            if (patternValue > 20) { // Threshold for interesting patterns
                suggestions.push({
                    move: move,
                    patternValue: patternValue,
                    type: 'potential_pattern'
                });
            }
        });
        
        return suggestions.sort((a, b) => b.patternValue - a.patternValue);
    }
    
    // Find moves that could activate a recognized pattern
    findMovesToActivatePattern(grid, pattern) {
        const moves = [];
        
        // Check if the pattern is already active (creates matches)
        const isActive = this.isPatternActive(grid, pattern);
        
        if (!isActive) {
            // Look for single moves that could complete/activate the pattern
            const nearbyMoves = this.findMovesNearPattern(grid, pattern);
            nearbyMoves.forEach(move => {
                moves.push({
                    move: move,
                    patternValue: pattern.value,
                    type: 'activate_pattern',
                    pattern: pattern.name
                });
            });
        }
        
        return moves;
    }
    
    // Check if a pattern creates valid matches
    isPatternActive(grid, pattern) {
        // Simple check: see if the pattern gems form valid matches
        const matches = grid.findMatches();
        
        return pattern.gems.some(patternGem => {
            return matches.some(match => 
                match.row === patternGem.row && match.col === patternGem.col
            );
        });
    }
    
    // Find possible moves near a pattern
    findMovesNearPattern(grid, pattern) {
        const moves = [];
        const possibleMoves = grid.findAllPossibleMoves();
        
        // Check which moves involve gems near the pattern
        possibleMoves.forEach(move => {
            const isNearPattern = pattern.gems.some(patternGem => {
                const distance1 = Math.abs(move.gem1.row - patternGem.row) + 
                                Math.abs(move.gem1.col - patternGem.col);
                const distance2 = Math.abs(move.gem2.row - patternGem.row) + 
                                Math.abs(move.gem2.col - patternGem.col);
                
                return distance1 <= 2 || distance2 <= 2; // Within 2 moves
            });
            
            if (isNearPattern) {
                moves.push(move);
            }
        });
        
        return moves;
    }
    
    // Evaluate how a move affects pattern formation
    evaluateMoveForPatterns(grid, move) {
        // Temporarily make the move
        const gem1 = grid.gems[move.gem1.row][move.gem1.col];
        const gem2 = grid.gems[move.gem2.row][move.gem2.col];
        
        grid.swapGems(gem1, gem2);
        
        // Recognize patterns after the move
        const patternsAfter = this.recognizePatterns(grid);
        const totalValue = patternsAfter.reduce((sum, p) => sum + p.value, 0);
        
        // Undo the move
        grid.swapGems(gem1, gem2);
        
        return totalValue;
    }
    
    // Train the pattern recognizer with game data
    train(gameData) {
        // Add training data for future ML implementation
        this.trainingData.push(gameData);
        
        // Simple learning: adjust pattern values based on success
        if (gameData.successful && gameData.patternsUsed) {
            gameData.patternsUsed.forEach(patternName => {
                const pattern = this.patterns.get(patternName);
                if (pattern) {
                    pattern.value += 1; // Increase value for successful patterns
                }
            });
        }
        
        console.log(`Training data size: ${this.trainingData.length}`);
    }
    
    // Get pattern statistics
    getStats() {
        const patternStats = new Map();
        
        this.patterns.forEach((pattern, name) => {
            patternStats.set(name, {
                value: pattern.value,
                rotations: pattern.rotations.length,
                dimensions: `${pattern.matrix.length}x${pattern.matrix[0].length}`
            });
        });
        
        return {
            totalPatterns: this.patterns.size,
            trainingDataSize: this.trainingData.length,
            patterns: Object.fromEntries(patternStats)
        };
    }
    
    // Export patterns for analysis
    exportPatterns() {
        const exported = {};
        
        this.patterns.forEach((pattern, name) => {
            exported[name] = {
                matrix: pattern.matrix,
                value: pattern.value
            };
        });
        
        return JSON.stringify(exported, null, 2);
    }
    
    // Import patterns from external source
    importPatterns(patternsJson) {
        try {
            const imported = JSON.parse(patternsJson);
            
            Object.entries(imported).forEach(([name, data]) => {
                this.addPattern(name, data.matrix, data.value);
            });
            
            console.log(`Imported ${Object.keys(imported).length} patterns`);
        } catch (error) {
            console.error('Failed to import patterns:', error);
        }
    }
}