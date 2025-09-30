# 💎 Diamond Crush AI - Bài Tập Lớn Trí Tuệ Nhân Tạo

Một game match-3 kim cương được xây dựng với các thuật toán AI tiên tiến cho môn Trí Tuệ Nhân Tạo.

## 🎯 Mục Tiêu Dự Án

Tạo ra một game puzzle match-3 tích hợp nhiều thuật toán AI để minh họa các khái niệm học thuật:
- **Minimax Algorithm** với Alpha-Beta Pruning
- **Pattern Recognition** với Machine Learning
- **Heuristic Search** và đánh giá trạng thái
- **Game Tree Search** và tối ưu hóa
- **Predictive Analytics** cho gameplay

## 🚀 Features Đã Implement

### 🎮 Core Game Features
- **Match-3 Mechanics**: Swap gems để tạo hàng 3+ gems cùng màu
- **Cascade System**: Hiệu ứng rơi và combo liên tục  
- **Scoring System**: Điểm số với multiplier và achievements
- **Move Management**: Giới hạn số lượng moves và mục tiêu điểm
- **Responsive UI**: Giao diện đẹp với animations mượt mà

### 🤖 AI Components

#### 1. **AI Hint System**
- Phân tích board state hiện tại
- Đề xuất move tối ưu với confidence score
- Tính toán potential cascades và special combos
- **Algorithm**: Heuristic evaluation với weighted scoring

#### 2. **Minimax Solver** 
- AI opponent thông minh sử dụng Minimax + Alpha-Beta Pruning
- Độ sâu tìm kiếm có thể điều chỉnh (Easy/Medium/Hard)
- Game tree search với evaluation function phức tạp
- **Performance tracking**: nodes explored, evaluation time

#### 3. **Pattern Recognition**
- Machine Learning để nhận diện patterns đặc biệt
- Phát hiện T-shapes, L-shapes, Cross patterns
- Adaptive learning từ gameplay data
- **Matrix rotation** để detect patterns ở mọi hướng

#### 4. **Performance Analytics**
- Real-time tracking của AI performance
- Statistics về algorithm efficiency
- Move quality evaluation và player behavior analysis

## 📁 Cấu Trúc Project

```
diamond-crush-ai/
├── index.html              # Main game page
├── css/
│   └── style.css          # Game styling & animations
├── js/
│   ├── core/              # Core game engine
│   │   ├── Gem.js         # Gem class với animation
│   │   ├── Grid.js        # Game board & match logic
│   │   └── GameEngine.js  # Main game loop & state
│   ├── ai/                # AI algorithms
│   │   ├── HintSystem.js  # AI hint generation
│   │   ├── MinimaxSolver.js # Minimax với alpha-beta
│   │   └── PatternRecognizer.js # ML pattern detection
│   ├── managers/          # System managers
│   │   ├── ScoreManager.js # Scoring & achievements
│   │   └── UIManager.js   # UI interactions
│   ├── utils/
│   │   └── MathUtils.js   # Mathematical utilities
│   ├── Game.js            # Main game controller
│   └── main.js            # Entry point & initialization
└── README.md              # Documentation
```

## 🛠️ Cách Chạy Project

### Phương Pháp 1: Local Server (Recommended)
```bash
# Sử dụng Python
python -m http.server 8000

# Hoặc Node.js
npx http-server

# Hoặc Live Server extension trong VS Code
```

Sau đó mở: `http://localhost:8000`

### Phương Pháp 2: File Protocol
Mở file `index.html` trực tiếp trong browser (có thể có hạn chế về CORS)

## 🎮 Cách Chơi

1. **Mục tiêu**: Đạt 1000 điểm trong 30 moves
2. **Controls**: Click để chọn gem, click gem khác để swap
3. **Match**: Tạo hàng/cột 3+ gems cùng màu để xóa
4. **AI Features**:
   - **🧠 AI Hint**: Nhận gợi ý move tốt nhất
   - **🤖 Auto Solve**: AI tự động chơi 1 move
   - **📊 Analysis**: Xem performance metrics

## 🤖 Thuật Toán AI Chi Tiết

### 1. Minimax với Alpha-Beta Pruning

```javascript
minimax(grid, depth, alpha, beta, isMaximizing) {
    // Base case: terminal node
    if (depth === 0 || !grid.hasPossibleMoves()) {
        return this.evaluateBoard(grid);
    }
    
    if (isMaximizing) {
        let maxScore = -Infinity;
        for (const move of possibleMoves) {
            // Simulate move
            const score = minimax(newState, depth-1, alpha, beta, false);
            maxScore = Math.max(maxScore, score);
            alpha = Math.max(alpha, score);
            
            // Alpha-beta pruning
            if (beta <= alpha) break;
        }
        return maxScore;
    }
    // ... minimizing case
}
```

**Độ phức tạp**: O(b^d) → O(b^(d/2)) với pruning
- **b**: branching factor (~20-30 moves)  
- **d**: depth (2-4 levels)

### 2. Heuristic Evaluation Function

```javascript
evaluateBoard(grid) {
    let score = 0;
    
    // Immediate score potential
    score += simulationScore * weights.score;
    
    // Future move options  
    score += moveCount * weights.mobility;
    
    // Special gems value
    score += specialGemCount * weights.specials;
    
    // Position control (center preferred)
    score += centerControl * weights.position;
    
    // Pattern recognition bonus
    score += patternBonus;
    
    return score;
}
```

### 3. Pattern Recognition với ML

```javascript
recognizePatterns(grid) {
    const patterns = [];
    
    // Convolutional-style pattern matching
    for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
            // Check each pattern template
            this.patterns.forEach(pattern => {
                const match = this.matchPattern(grid, row, col, pattern);
                if (match.confidence > threshold) {
                    patterns.push(match);
                }
            });
        }
    }
    
    return patterns.sort((a,b) => b.value - a.value);
}
```

## 📊 Metrics & Analytics

### Performance Tracking:
- **Algorithm execution time** (ms)
- **Nodes explored** in search tree
- **Cache hit rates** 
- **Move quality scores**
- **Pattern recognition accuracy**

### Gameplay Analytics:
- **Efficiency**: Points per move
- **Combo frequency**: Cascade triggers
- **AI assistance usage**: Hints vs manual play
- **Achievement progression**

## 🎓 Giá Trị Học Thuật

### Algorithms Demonstrated:
1. **Game Tree Search**: Minimax, Alpha-Beta Pruning
2. **Heuristic Functions**: Multi-criteria evaluation  
3. **Pattern Matching**: Template matching with rotations
4. **Machine Learning**: Adaptive pattern weights
5. **Performance Optimization**: Caching, pruning techniques

### AI Concepts Illustrated:
- **Search vs Knowledge-based AI**
- **Evaluation functions design**
- **Time-space tradeoffs**
- **Learning from experience**
- **Real-time decision making**

## 🔧 Debug Mode

Khi chạy với debug mode, có các functions test:

```javascript
// Global debug functions
window.debugFunctions = {
    showState(),      // In ra game state
    addScore(100),    // Thêm điểm test
    testHint(),       // Test AI hint
    analyzeBoard(),   // Phân tích board
    showStats()       // Performance metrics
}
```

## 📈 Kế Hoạch Mở Rộng

### Phase 2 - Advanced AI:
- [ ] **Deep Q-Learning**: Neural network AI agent
- [ ] **Genetic Algorithm**: Level generation optimization  
- [ ] **A* Pathfinding**: Complex puzzle solving
- [ ] **Monte Carlo Tree Search**: Alternative to Minimax

### Phase 3 - Research Features:
- [ ] **Multi-agent systems**: AI vs AI tournaments
- [ ] **Reinforcement Learning**: Self-improving AI
- [ ] **Computer Vision**: Board state recognition
- [ ] **Natural Language**: Voice commands & explanations

## 💡 Kết Luận

Project này minh họa thành công việc ứng dụng nhiều thuật toán AI vào một game thực tế, từ classical search algorithms (Minimax) đến machine learning (Pattern Recognition). 

**Điểm mạnh**:
- ✅ Implementation đầy đủ các thuật toán cơ bản
- ✅ Performance metrics chi tiết cho analysis  
- ✅ UI/UX professional với AI integration
- ✅ Extensible architecture cho future research

**Potential Applications**:
- Game AI development
- Algorithm visualization tools  
- Educational demos cho AI courses
- Research platform cho game theory

---

**👨‍💻 Author**: [Your Name]  
**📚 Course**: Trí Tuệ Nhân Tạo  
**🏫 University**: [Your University]  
**📅 Date**: September 2025