/**
 * Basic AI Hint System - Simple implementation for demonstration
 * This will be expanded with more sophisticated algorithms later
 */
class HintSystem {
    constructor() {
        this.evaluationDepth = 1;
        this.weights = {
            matchSize: 10,
            cascadePotential: 5,
            specialGemBonus: 15,
            positionValue: 2
        };
    }
    
    // Main method to analyze board and suggest best move
    suggestMove(grid) {
    const possibleMoves = grid.findAllPossibleMoves();
        
        if (possibleMoves.length === 0) {
            return null;
        }
        
        // Evaluate each move and return the best one with detailed info
        let bestMove = possibleMoves[0];
        let bestScore = this.evaluateMove(grid, bestMove);
        let bestMatchInfo = this.getMatchInfo(grid, bestMove);
        
        for (let i = 1; i < possibleMoves.length; i++) {
            const moveScore = this.evaluateMove(grid, possibleMoves[i]);
            if (moveScore > bestScore) {
                bestScore = moveScore;
                bestMove = possibleMoves[i];
                bestMatchInfo = this.getMatchInfo(grid, possibleMoves[i]);
            }
        }
        
        return {
            gem1: bestMove.gem1,  // Position of first gem to swap
            gem2: bestMove.gem2,  // Position of second gem to swap  
            evaluationScore: bestScore,
            confidence: this.calculateConfidence(bestScore, possibleMoves.length),
            matchInfo: bestMatchInfo,  // Details about what matches will be created
            reason: this.generateReason(bestMatchInfo)  // Human readable explanation
        };
    }
    
    // Evaluate the quality of a specific move
    evaluateMove(grid, move) {
        // Temporarily perform the move to evaluate it
    const gem1 = grid.gems[move.gem1.row][move.gem1.col];
    const gem2 = grid.gems[move.gem2.row][move.gem2.col];
    // Temporarily enable simulation mode to avoid animations
    const prevSim = grid.simulationMode;
    grid.simulationMode = true;
    grid.swapGemsData(gem1, gem2);
        
        // Find matches after the move
        const matches = grid.findMatches();
        
        let score = 0;
        
        // Base score from immediate matches
        score += matches.length * this.weights.matchSize;
        
        // Bonus for larger matches
        matches.forEach(match => {
            const matchSize = this.getMatchSize(grid, match);
            if (matchSize >= 4) {
                score += this.weights.specialGemBonus;
            }
        });
        
        // Estimate cascade potential
        score += this.estimateCascades(grid) * this.weights.cascadePotential;
        
        // Position-based evaluation (center pieces are more valuable)
        score += this.evaluatePosition(move) * this.weights.positionValue;
        
        // Swap back to original state
        // Swap back to original state
        grid.swapGemsData(gem1, gem2);
        grid.simulationMode = prevSim;
        
        return score;
    }
    
    // Get the size of a match group
    getMatchSize(grid, match) {
        // Simple implementation - count connected gems of same type
        const visited = new Set();
        const stack = [match];
        let count = 0;
        
        while (stack.length > 0) {
            const current = stack.pop();
            const key = `${current.row},${current.col}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            count++;
            
            // Check adjacent cells
            const directions = [[-1,0], [1,0], [0,-1], [0,1]];
            directions.forEach(([dr, dc]) => {
                const newRow = current.row + dr;
                const newCol = current.col + dc;
                
                if (newRow >= 0 && newRow < grid.rows && 
                    newCol >= 0 && newCol < grid.cols) {
                    
                    const gem = grid.gems[newRow][newCol];
                    const targetGem = grid.gems[current.row][current.col];
                    
                    if (gem && targetGem && gem.type === targetGem.type) {
                        stack.push({row: newRow, col: newCol});
                    }
                }
            });
        }
        
        return count;
    }
    
    // Estimate potential cascades after gravity
    estimateCascades(grid) {
        let cascadePotential = 0;
        
        // Simple heuristic: count gems that will fall into potential matches
        for (let col = 0; col < grid.cols; col++) {
            let emptySpaces = 0;
            
            for (let row = grid.rows - 1; row >= 0; row--) {
                if (!grid.gems[row][col]) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    // This gem will fall
                    cascadePotential += this.evaluateFallingGem(grid, row, col, emptySpaces);
                }
            }
        }
        
        return cascadePotential;
    }
    
    // Evaluate the potential of a falling gem
    evaluateFallingGem(grid, row, col, fallDistance) {
        const gem = grid.gems[row][col];
        if (!gem) return 0;
        
        let potential = 0;
        const newRow = row + fallDistance;
        
        // Check if falling position creates matches
        if (newRow < grid.rows) {
            // Check horizontal neighbors
            if (col > 0 && grid.gems[newRow][col - 1] && 
                grid.gems[newRow][col - 1].type === gem.type) {
                potential += 5;
            }
            if (col < grid.cols - 1 && grid.gems[newRow][col + 1] && 
                grid.gems[newRow][col + 1].type === gem.type) {
                potential += 5;
            }
            
            // Check vertical neighbors
            if (newRow > 0 && grid.gems[newRow - 1][col] && 
                grid.gems[newRow - 1][col].type === gem.type) {
                potential += 5;
            }
            if (newRow < grid.rows - 1 && grid.gems[newRow + 1][col] && 
                grid.gems[newRow + 1][col].type === gem.type) {
                potential += 5;
            }
        }
        
        return potential;
    }
    
    // Evaluate position-based value (center is more valuable)
    evaluatePosition(move) {
        const centerRow = 4; // Assuming 8x8 grid
        const centerCol = 4;
        
        const distance1 = Math.abs(move.gem1.row - centerRow) + Math.abs(move.gem1.col - centerCol);
        const distance2 = Math.abs(move.gem2.row - centerRow) + Math.abs(move.gem2.col - centerCol);
        
        // Lower distance = higher value
        return (16 - distance1 - distance2);
    }
    
    // Get detailed information about what matches will be created
    getMatchInfo(grid, move) {
        // Temporarily perform the move
    const gem1 = grid.gems[move.gem1.row][move.gem1.col];
    const gem2 = grid.gems[move.gem2.row][move.gem2.col];
    const prevSim = grid.simulationMode;
    grid.simulationMode = true;
    grid.swapGemsData(gem1, gem2);
        
        // Find matches after the move
        const matches = grid.findMatches();
        
        let matchInfo = {
            totalMatches: matches.length,
            matchedGems: [],
            gemTypes: new Set(),
            estimatedScore: 0,
            matchSizes: []
        };
        
        matches.forEach(match => {
            const gem = grid.gems[match.row][match.col];
            if (gem) {
                matchInfo.matchedGems.push({
                    row: match.row,
                    col: match.col,
                    type: gem.type
                });
                matchInfo.gemTypes.add(gem.type);
            }
        });
        
        // Group matches by connected components to find match sizes
        const matchGroups = this.groupMatches(matches, grid);
        matchInfo.matchSizes = matchGroups.map(group => group.length);
        matchInfo.estimatedScore = matchInfo.matchSizes.reduce((sum, size) => sum + size * 10, 0);
        
        // Swap back to original state
        grid.swapGemsData(gem1, gem2);
        grid.simulationMode = prevSim;
        
        return matchInfo;
    }
    
    // Generate human-readable reason for the hint
    generateReason(matchInfo) {
        if (!matchInfo || matchInfo.totalMatches === 0) {
            return "Không có match được tạo";
        }
        
        const maxMatchSize = Math.max(...matchInfo.matchSizes);
        const gemTypeArray = Array.from(matchInfo.gemTypes);
        const gemTypeNames = ['💎', '💰', '⭐', '🔥', '💜', '🎯']; // Visual gem representations
        
        let reason = `Tạo ${matchInfo.totalMatches} match`;
        
        if (maxMatchSize >= 4) {
            reason += ` (bao gồm match ${maxMatchSize} viên!)`;
        }
        
        if (gemTypeArray.length === 1) {
            const gemName = gemTypeNames[gemTypeArray[0] - 1] || '💎';
            reason += ` với ${gemName}`;
        }
        
        reason += ` → ~${matchInfo.estimatedScore} điểm`;
        
        return reason;
    }
    
    // Group matches into connected components
    groupMatches(matches, grid) {
        const groups = [];
        const visited = new Set();
        
        matches.forEach(match => {
            const key = `${match.row},${match.col}`;
            if (visited.has(key)) return;
            
            const group = [];
            const queue = [match];
            const targetType = grid.gems[match.row][match.col]?.type;
            
            while (queue.length > 0) {
                const current = queue.shift();
                const currentKey = `${current.row},${current.col}`;
                
                if (visited.has(currentKey)) continue;
                visited.add(currentKey);
                group.push(current);
                
                // Check adjacent positions
                const directions = [[-1,0], [1,0], [0,-1], [0,1]];
                directions.forEach(([dr, dc]) => {
                    const newRow = current.row + dr;
                    const newCol = current.col + dc;
                    const newKey = `${newRow},${newCol}`;
                    
                    if (!visited.has(newKey) && 
                        matches.some(m => m.row === newRow && m.col === newCol) &&
                        grid.gems[newRow]?.[newCol]?.type === targetType) {
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
    
    // Calculate confidence level for the suggestion
    calculateConfidence(bestScore, totalMoves) {
        if (totalMoves === 0) return 0;
        
        // Confidence based on how much better the best move is compared to average
        const baseConfidence = Math.min(bestScore / 50, 1) * 100; // 0-100%
        
        // Reduce confidence if there are many equally good options
        const choiceConfidence = Math.max(0, 100 - (totalMoves - 1) * 5);
        
        return Math.min(baseConfidence * 0.7 + choiceConfidence * 0.3, 100);
    }
}

// Explicitly export to window
if (typeof window !== 'undefined') {
    window.HintSystem = HintSystem;
}