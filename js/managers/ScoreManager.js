/**
 * ScoreManager - Manages scoring system and achievements
 * Tracks performance metrics for AI analysis
 */
class ScoreManager {
    constructor() {
        this.score = 0;
        this.moves = 30;
        this.level = 1;
        this.multiplier = 1;
        
        // Scoring parameters
        this.baseGemScore = 10;
        this.comboMultipliers = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5];
        this.cascadeBonus = 0.5;
        this.specialGemBonus = 3;
        
        // Performance tracking
        this.stats = {
            totalMatches: 0,
            totalCascades: 0,
            longestCombo: 0,
            currentCombo: 0,
            specialGemsUsed: 0,
            averageMatchSize: 0,
            efficiency: 0, // score per move
            startTime: Date.now(),
            moveHistory: []
        };
        
        // Achievements
        this.achievements = new Set();
        this.achievementDefinitions = {
            'first_match': { name: 'First Blood', description: 'Make your first match' },
            'combo_master': { name: 'Combo Master', description: 'Achieve a 5x combo' },
            'cascade_king': { name: 'Cascade King', description: 'Trigger 10 cascades in one move' },
            'efficient_player': { name: 'Efficient Player', description: 'Average 100+ points per move' },
            'special_collector': { name: 'Special Collector', description: 'Use 5 special gems' },
            'big_match': { name: 'Big Match', description: 'Match 7+ gems at once' },
            'perfectionist': { name: 'Perfectionist', description: 'Complete level with 90%+ efficiency' }
        };
    }
    
    // Add score from a match
    addMatchScore(matchedGems, cascadeLevel = 0, isSpecialGem = false) {
        if (!Array.isArray(matchedGems)) {
            matchedGems = [matchedGems];
        }
        
        const matchSize = matchedGems.length;
        let matchScore = 0;
        
        // Base score calculation
        matchScore = matchSize * this.baseGemScore;
        
        // Combo multiplier
        const comboIndex = Math.min(this.stats.currentCombo, this.comboMultipliers.length - 1);
        matchScore *= this.comboMultipliers[comboIndex];
        
        // Cascade bonus
        if (cascadeLevel > 0) {
            matchScore *= (1 + cascadeLevel * this.cascadeBonus);
            this.stats.totalCascades++;
        }
        
        // Special gem bonus
        if (isSpecialGem) {
            matchScore *= this.specialGemBonus;
            this.stats.specialGemsUsed++;
        }
        
        // Level multiplier
        matchScore *= this.multiplier;
        
        // Round score
        matchScore = Math.floor(matchScore);
        
        // Update totals
        this.score += matchScore;
        this.stats.totalMatches++;
        this.stats.currentCombo++;
        this.stats.longestCombo = Math.max(this.stats.longestCombo, this.stats.currentCombo);
        
        // Update average match size
        this.updateAverageMatchSize(matchSize);
        
        // Check achievements
        this.checkAchievements(matchSize, cascadeLevel, this.stats.currentCombo);
        
        return matchScore;
    }
    
    // Reset combo when no matches found
    resetCombo() {
        this.stats.currentCombo = 0;
    }
    
    // Use a move
    useMove() {
        if (this.moves > 0) {
            this.moves--;
            
            // Record move in history
            this.stats.moveHistory.push({
                moveNumber: 30 - this.moves,
                score: this.score,
                timestamp: Date.now()
            });
            
            // Update efficiency
            this.stats.efficiency = this.moves > 0 ? this.score / (30 - this.moves) : 0;
            
            return true;
        }
        return false;
    }
    
    // Add bonus moves (for special achievements)
    addBonusMoves(count) {
        this.moves += count;
    }
    
    // Level progression
    nextLevel() {
        this.level++;
        this.moves = Math.min(30, this.moves + 5); // Bonus moves for next level
        this.multiplier += 0.1;
        
        // Reset some stats for new level
        this.stats.currentCombo = 0;
        
        return {
            level: this.level,
            bonusMoves: 5,
            newMultiplier: this.multiplier
        };
    }
    
    // Update average match size
    updateAverageMatchSize(newMatchSize) {
        const totalMatches = this.stats.totalMatches;
        this.stats.averageMatchSize = 
            ((this.stats.averageMatchSize * (totalMatches - 1)) + newMatchSize) / totalMatches;
    }
    
    // Check and award achievements
    checkAchievements(matchSize, cascadeLevel, comboLevel) {
        // First match
        if (this.stats.totalMatches === 1) {
            this.unlockAchievement('first_match');
        }
        
        // Combo achievements
        if (comboLevel >= 5) {
            this.unlockAchievement('combo_master');
        }
        
        // Cascade achievements
        if (cascadeLevel >= 10) {
            this.unlockAchievement('cascade_king');
        }
        
        // Efficiency achievements
        if (this.stats.efficiency >= 100) {
            this.unlockAchievement('efficient_player');
        }
        
        // Special gem achievements
        if (this.stats.specialGemsUsed >= 5) {
            this.unlockAchievement('special_collector');
        }
        
        // Big match achievements
        if (matchSize >= 7) {
            this.unlockAchievement('big_match');
        }
    }
    
    unlockAchievement(achievementId) {
        if (!this.achievements.has(achievementId) && this.achievementDefinitions[achievementId]) {
            this.achievements.add(achievementId);
            this.showAchievementNotification(achievementId);
            return true;
        }
        return false;
    }
    
    showAchievementNotification(achievementId) {
        const achievement = this.achievementDefinitions[achievementId];
        console.log(`🏆 Achievement Unlocked: ${achievement.name} - ${achievement.description}`);
        
        // Create UI notification (could be expanded)
        if (typeof window !== 'undefined' && document.getElementById('ai-suggestions')) {
            const notification = document.createElement('div');
            notification.className = 'achievement-notification';
            notification.innerHTML = `
                <div class="achievement-content">
                    <h4>🏆 Achievement Unlocked!</h4>
                    <p><strong>${achievement.name}</strong></p>
                    <small>${achievement.description}</small>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        }
    }
    
    // Get current game statistics
    getStats() {
        return {
            ...this.stats,
            score: this.score,
            moves: this.moves,
            level: this.level,
            multiplier: this.multiplier,
            gameTime: Date.now() - this.stats.startTime,
            achievements: Array.from(this.achievements)
        };
    }
    
    // Get AI-friendly performance data
    getPerformanceVector() {
        return [
            this.stats.efficiency / 100, // Normalized efficiency
            this.stats.averageMatchSize / 7, // Normalized match size (max ~7)
            this.stats.longestCombo / 10, // Normalized combo length
            this.stats.totalCascades / 50, // Normalized cascade count
            this.achievements.size / Object.keys(this.achievementDefinitions).length, // Achievement ratio
            this.moves / 30, // Remaining moves ratio
            Math.min(this.level / 10, 1), // Normalized level
        ];
    }
    
    // Calculate move quality for AI analysis
    evaluateMoveQuality(scoreGained, cascadeCount = 0) {
        let quality = scoreGained / this.baseGemScore; // Base quality
        
        // Bonus for efficiency
        if (this.stats.efficiency > 0) {
            quality *= (scoreGained / this.stats.efficiency);
        }
        
        // Bonus for cascades
        quality += cascadeCount * 2;
        
        // Penalty for low-scoring moves late in game
        if (this.moves < 10 && scoreGained < this.stats.efficiency * 0.5) {
            quality *= 0.5;
        }
        
        return Math.max(0, Math.min(quality, 10)); // Clamp 0-10
    }
    
    // Predict required score for remaining moves
    predictRequiredScore(targetScore) {
        const remainingScore = targetScore - this.score;
        const avgScorePerMove = this.moves > 0 ? remainingScore / this.moves : 0;
        
        return {
            remainingScore,
            avgScorePerMove,
            feasibility: avgScorePerMove <= this.stats.efficiency * 1.2 ? 'achievable' : 
                        avgScorePerMove <= this.stats.efficiency * 2 ? 'challenging' : 'difficult'
        };
    }
    
    // Export game data for analysis
    exportGameData() {
        return JSON.stringify({
            finalStats: this.getStats(),
            moveHistory: this.stats.moveHistory,
            achievements: Array.from(this.achievements),
            performanceVector: this.getPerformanceVector(),
            timestamp: new Date().toISOString()
        });
    }
    
    // Reset for new game
    reset() {
        this.score = 0;
        this.moves = 30;
        this.level = 1;
        this.multiplier = 1;
        
        this.stats = {
            totalMatches: 0,
            totalCascades: 0,
            longestCombo: 0,
            currentCombo: 0,
            specialGemsUsed: 0,
            averageMatchSize: 0,
            efficiency: 0,
            startTime: Date.now(),
            moveHistory: []
        };
        
        this.achievements.clear();
    }
    
    // Save/Load functionality
    saveToLocalStorage(key = 'diamond_crush_scores') {
        try {
            const data = {
                highScore: Math.max(this.score, parseInt(localStorage.getItem(key + '_high') || '0')),
                achievements: Array.from(this.achievements),
                stats: this.getStats()
            };
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save score data:', e);
            return false;
        }
    }
    
    loadFromLocalStorage(key = 'diamond_crush_scores') {
        try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.achievements) {
                data.achievements.forEach(achievement => this.achievements.add(achievement));
            }
            return data;
        } catch (e) {
            console.error('Failed to load score data:', e);
            return {};
        }
    }
    
    // Restore score manager state from saved data
    restoreFromData(data) {
        if (!data) return;
        
        try {
            // Restore basic properties
            this.score = data.score || 0;
            this.level = data.level || 1;
            this.multiplier = data.multiplier || 1;
            
            // Restore stats
            if (data.stats) {
                this.stats = { ...this.stats, ...data.stats };
            }
            
            // Restore achievements
            if (data.achievements) {
                this.achievements.clear();
                if (Array.isArray(data.achievements)) {
                    data.achievements.forEach(achievement => this.achievements.add(achievement));
                } else {
                    // Handle achievements as Set
                    Object.keys(data.achievements).forEach(key => {
                        if (data.achievements[key]) {
                            this.achievements.add(key);
                        }
                    });
                }
            }
            
            console.log('✅ ScoreManager state restored');
        } catch (error) {
            console.error('❌ Failed to restore ScoreManager:', error);
        }
    }
}

// Explicitly export to window
if (typeof window !== 'undefined') {
    window.ScoreManager = ScoreManager;
}