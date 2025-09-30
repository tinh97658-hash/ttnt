/**
 * main.js - Game initialization and startup
 * Entry point for Diamond Crush AI game
 */

// Global game instance
let game = null;

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Diamond Crush AI - Starting initialization...');
    
    // Wait a bit to ensure all scripts are loaded
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
        // Create game instance
        game = new Game();
        
        // Configure for development/debug mode
        game.configure({
            debugMode: true, // Enable debug features
            enableAI: true,
            initialMoves: 30,
            targetScore: 1000
        });
        
        // Initialize game systems
        const initialized = await game.initialize('game-canvas');
        
        if (initialized) {
            // Start the game
            game.start();
            
            console.log('✅ Game started successfully!');
            console.log('🎯 Target Score:', game.config.targetScore);
            console.log('🔢 Initial Moves:', game.config.initialMoves);
            console.log('🤖 AI Enabled:', game.config.enableAI);
            
            // Setup global debugging helpers
            if (game.config.debugMode) {
                setupDebugHelpers();
            }
            
            // Show welcome message
            showWelcomeMessage();
            
        } else {
            throw new Error('Game initialization failed');
        }
        
    } catch (error) {
        console.error('❌ Failed to start game:', error);
        showErrorMessage('Failed to start game: ' + error.message);
    }
});

// Setup debugging helpers
function setupDebugHelpers() {
    // Global access to game instance
    window.game = game;
    window.DEBUG_MODE = true;
    
    // Debug functions
    window.debugFunctions = {
        // Show current game state
        showState: () => {
            console.log('Current Game State:', game.getGameState());
        },
        
        // Add score for testing
        addScore: (amount = 100) => {
            game.scoreManager.score += amount;
            game.uiManager.updateGameUI(game.getGameState().gameEngine);
            console.log(`Added ${amount} points. New score: ${game.scoreManager.score}`);
        },
        
        // Add moves for testing
        addMoves: (amount = 5) => {
            game.gameEngine.moves += amount;
            game.uiManager.updateGameUI(game.getGameState().gameEngine);
            console.log(`Added ${amount} moves. Moves left: ${game.gameEngine.moves}`);
        },
        
        // Force game end for testing
        forceWin: () => {
            game.scoreManager.score = game.config.targetScore + 100;
            game.gameEngine.checkGameEnd();
            console.log('Forced game win');
        },
        
        // Get AI analysis
        analyzeBoard: () => {
            const moves = game.gameEngine.grid.findAllPossibleMoves();
            console.log('Available moves:', moves);
            return moves;
        },
        
        // Test AI hint
        testHint: () => {
            const hint = game.requestAIHint();
            console.log('AI Hint result:', hint);
            return hint;
        },
        
        // Reset game
        reset: () => {
            game.restart();
            console.log('Game reset');
        },
        
        // Toggle pause
        pause: () => {
            const paused = game.togglePause();
            console.log(paused ? 'Game paused' : 'Game resumed');
            return paused;
        },
        
        // Show performance stats
        showStats: () => {
            const stats = game.scoreManager.getStats();
            console.table(stats);
            return stats;
        }
    };
    
    // Add debug panel to UI
    addDebugPanel();
    
    console.log('🛠️ Debug mode enabled. Use window.debugFunctions for testing.');
    console.log('Available debug functions:', Object.keys(window.debugFunctions));
}

// Add debug panel to the UI
function addDebugPanel() {
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.innerHTML = `
        <details style="
            position: fixed; 
            bottom: 20px; 
            right: 20px; 
            background: rgba(0,0,0,0.8); 
            color: white; 
            padding: 1rem; 
            border-radius: 0.5rem;
            font-family: monospace;
            font-size: 12px;
            z-index: 1000;
        ">
            <summary style="cursor: pointer; margin-bottom: 0.5rem;">🛠️ Debug Panel</summary>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 200px;">
                <button onclick="window.debugFunctions.showState()" style="padding: 0.25rem;">Show State</button>
                <button onclick="window.debugFunctions.addScore(100)" style="padding: 0.25rem;">+100 Score</button>
                <button onclick="window.debugFunctions.addMoves(5)" style="padding: 0.25rem;">+5 Moves</button>
                <button onclick="window.debugFunctions.testHint()" style="padding: 0.25rem;">Test AI Hint</button>
                <button onclick="window.debugFunctions.analyzeBoard()" style="padding: 0.25rem;">Analyze Board</button>
                <button onclick="window.debugFunctions.reset()" style="padding: 0.25rem;">Reset Game</button>
                <button onclick="window.debugFunctions.pause()" style="padding: 0.25rem;">Toggle Pause</button>
                <button onclick="window.debugFunctions.showStats()" style="padding: 0.25rem;">Show Stats</button>
            </div>
        </details>
    `;
    document.body.appendChild(debugPanel);
}

// Show welcome message
function showWelcomeMessage() {
    // Create welcome overlay
    const welcome = document.createElement('div');
    welcome.className = 'welcome-overlay';
    welcome.innerHTML = `
        <div class="welcome-content" style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #6366f1, #ec4899);
            color: white;
            padding: 2rem;
            border-radius: 1rem;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 2000;
            max-width: 400px;
        ">
            <h2 style="margin-bottom: 1rem;">💎 Welcome to Diamond Crush AI!</h2>
            <p style="margin-bottom: 1.5rem;">
                This is an AI-powered match-3 game featuring:
                <br><br>
                🧠 <strong>AI Hint System</strong> - Get intelligent suggestions
                <br>
                🤖 <strong>Auto-Solve</strong> - Watch AI play for you
                <br>
                📊 <strong>Performance Analytics</strong> - Track algorithm efficiency
                <br>
                🎯 <strong>Adaptive Difficulty</strong> - Dynamic challenge adjustment
            </p>
            <div style="margin-bottom: 1.5rem;">
                <p><strong>Goal:</strong> Reach ${game.config.targetScore} points in ${game.config.initialMoves} moves</p>
            </div>
            <button onclick="this.closest('.welcome-overlay').remove()" style="
                background: white;
                color: #6366f1;
                border: none;
                padding: 0.75rem 2rem;
                border-radius: 0.5rem;
                font-weight: bold;
                cursor: pointer;
                font-size: 16px;
            ">
                Start Playing! 🚀
            </button>
        </div>
    `;
    
    welcome.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 2000;
        animation: fadeIn 0.3s ease-out;
    `;
    
    document.body.appendChild(welcome);
    
    // Auto-remove after 10 seconds if user doesn't interact
    setTimeout(() => {
        if (welcome.parentNode) {
            welcome.remove();
        }
    }, 10000);
}

// Show error message
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ef4444;
            color: white;
            padding: 2rem;
            border-radius: 1rem;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 3000;
            max-width: 400px;
        ">
            <h3>❌ Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #ef4444;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 0.25rem;
                margin-top: 1rem;
                cursor: pointer;
            ">
                Reload Page
            </button>
        </div>
    `;
    document.body.appendChild(errorDiv);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (!game || !game.isInitialized) return;
    
    // Global shortcuts (work even when game is focused)
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'r':
                e.preventDefault();
                if (confirm('Restart game?')) {
                    game.restart();
                }
                break;
            case 's':
                e.preventDefault();
                game.manualSave();
                break;
            case 'o':
            case 'l':
                e.preventDefault();
                const saveInfo = game.getSaveInfo();
                if (saveInfo.exists) {
                    game.loadGameState();
                } else {
                    game.uiManager.showNotification('📂 Không có game đã lưu!', 'info', 2000);
                }
                break;
        }
    }
    
    // Function keys
    switch (e.key) {
        case 'F5':
            // Allow normal F5 refresh but save first
            game.autoSave();
            break;
        case 'F9':
            e.preventDefault();
            game.manualSave();
            break;
        case 'F10':
            e.preventDefault();
            game.loadGameState();
            break;
    }
});

// Handle page visibility changes (pause when tab is hidden)
document.addEventListener('visibilitychange', function() {
    if (!game || !game.isInitialized) return;
    
    if (document.visibilityState === 'hidden') {
        // Page is hidden, pause the game
        if (!game.isPaused) {
            game.togglePause();
            console.log('Game auto-paused (tab hidden)');
        }
    } else if (document.visibilityState === 'visible') {
        // Page is visible again, resume if it was auto-paused
        if (game.isPaused) {
            // Give user a moment before resuming
            setTimeout(() => {
                if (game.isPaused) {
                    game.togglePause();
                    console.log('Game auto-resumed (tab visible)');
                }
            }, 500);
        }
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    if (game && game.gameEngine) {
        // Canvas will auto-adjust via CSS, no need to resize manually
        console.log('Window resized - game canvas will adapt');
    }
});

// Before page unload - save game state
window.addEventListener('beforeunload', function(e) {
    if (game && game.isInitialized) {
        game.saveGameData();
    }
});

// Export for global access
window.DiamondCrushAI = {
    game: () => game,
    version: '1.0.0',
    debug: () => window.debugFunctions
};