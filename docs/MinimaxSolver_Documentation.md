# 📚 Tài liệu chi tiết: MinimaxSolver.js - AI Đối thủ sử dụng Minimax

## 📋 Mục lục
1. [Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
2. [Thuật toán Minimax](#2-thuật-toán-minimax)
3. [Alpha-Beta Pruning](#3-alpha-beta-pruning)
4. [Cấu trúc Class](#4-cấu-trúc-class)
5. [Hệ thống trọng số](#5-hệ-thống-trọng-số)
6. [Chi tiết các phương thức](#6-chi-tiết-các-phương-thức)
7. [Transposition Table](#7-transposition-table)
8. [Đánh giá Board (Heuristics)](#8-đánh-giá-board-heuristics)
9. [Nhận dạng Pattern](#9-nhận-dạng-pattern)
10. [Tối ưu hiệu suất](#10-tối-ưu-hiệu-suất)
11. [So sánh với HintSystem](#11-so-sánh-với-hintsystem)
12. [Ví dụ minh họa](#12-ví-dụ-minh-họa)
13. [Hướng dẫn sử dụng](#13-hướng-dẫn-sử-dụng)

---

## 1. Giới thiệu tổng quan

### 1.1 Mục đích
`MinimaxSolver` là một AI solver sử dụng **thuật toán Minimax** với **Alpha-Beta Pruning** để tìm nước đi tối ưu trong game Match-3. Đây là thuật toán kinh điển trong lý thuyết trò chơi, thường được sử dụng trong các game như Cờ vua, Cờ caro, Tic-tac-toe.

### 1.2 Đặc điểm
| Đặc điểm | Giá trị |
|----------|---------|
| Thuật toán | Minimax + Alpha-Beta Pruning |
| Độ sâu mặc định | 3 levels (có thể tăng lên 4-10 tùy difficulty) |
| Giới hạn thời gian | **2000ms** (đã tăng từ 20ms) |
| Giới hạn nodes | **50,000 nodes** (đã tăng từ 5,000) |
| Memoization | Transposition Table |

> **📝 Cập nhật**: Time budget và max nodes đã được tăng lên đáng kể để AI có thể tìm kiếm sâu hơn khi chọn độ khó Hard.

### 1.3 Khi nào sử dụng?
- Được dùng như **fallback** khi HintSystem không tìm được nước đi
- Trong chế độ **Auto-Solve** (ưu tiên thứ 2 sau HintSystem)
- Khi cần đánh giá **sâu hơn** về chuỗi nước đi

---

## 2. Thuật toán Minimax

### 2.1 Nguyên lý cơ bản

**Minimax** là thuật toán tìm kiếm trong cây game (game tree), dựa trên giả định:
- **MAX player**: Cố gắng **tối đa hóa** điểm số (người chơi)
- **MIN player**: Cố gắng **tối thiểu hóa** điểm số (đối thủ/game)

### 2.2 Pseudocode

```
function minimax(node, depth, isMaximizing):
    if depth == 0 or node is terminal:
        return evaluate(node)
    
    if isMaximizing:
        maxScore = -∞
        for each child of node:
            score = minimax(child, depth-1, false)
            maxScore = max(maxScore, score)
        return maxScore
    else:
        minScore = +∞
        for each child of node:
            score = minimax(child, depth-1, true)
            minScore = min(minScore, score)
        return minScore
```

### 2.3 Cây Game (Game Tree)

```
                        [ROOT - depth 3]
                       /       |        \
                    Move1    Move2     Move3
                   /    \      |         |
               [MAX]  [MAX]  [MAX]     [MAX]
               /   \    |      |       /   \
            [MIN] [MIN] ...   ...   [MIN] [MIN]
             |      |                  |      |
           [EVAL] [EVAL]            [EVAL] [EVAL]
```

### 2.4 Ví dụ tính toán

```
Giả sử có 3 nước đi, mỗi nước có 2 phản hồi:

                    [MAX - chọn max]
                   /        |        \
              Move1      Move2      Move3
             /    \     /    \     /    \
         [MIN]  [MIN] [MIN] [MIN] [MIN] [MIN]
           |      |     |     |     |      |
          30     50    20    40    60     10

MIN chọn:   30       20       10
MAX chọn:       max(30, 20, 10) = 30 → Move1
```

---

## 3. Alpha-Beta Pruning

### 3.1 Nguyên lý

**Alpha-Beta Pruning** là kỹ thuật tối ưu để **cắt tỉa** (prune) các nhánh không cần thiết trong cây Minimax.

- **Alpha (α)**: Giá trị TỐT NHẤT mà MAX đã tìm thấy
- **Beta (β)**: Giá trị TỐT NHẤT mà MIN đã tìm thấy

**Quy tắc cắt tỉa**: Nếu `β ≤ α` → cắt nhánh hiện tại

### 3.2 Pseudocode với Alpha-Beta

```
function minimax(node, depth, α, β, isMaximizing):
    if depth == 0 or node is terminal:
        return evaluate(node)
    
    if isMaximizing:
        maxScore = -∞
        for each child of node:
            score = minimax(child, depth-1, α, β, false)
            maxScore = max(maxScore, score)
            α = max(α, score)
            if β ≤ α:
                break  // β cutoff
        return maxScore
    else:
        minScore = +∞
        for each child of node:
            score = minimax(child, depth-1, α, β, true)
            minScore = min(minScore, score)
            β = min(β, score)
            if β ≤ α:
                break  // α cutoff
        return minScore
```

### 3.3 Ví dụ cắt tỉa

```
                    [MAX] α=-∞, β=+∞
                   /           \
              [MIN]           [MIN]
             /    \          /    \
           30     50       20     ??
           
Bước 1: MAX xét Move1
  - MIN xét 30, 50 → chọn 30 (min)
  - MAX cập nhật α = 30

Bước 2: MAX xét Move2
  - MIN xét 20 (< 30 = α)
  - β = 20, α = 30 → β ≤ α → CẮT TỈNH!
  - Không cần xét nhánh "??" vì MIN đã có 20 < 30

Kết quả: Tiết kiệm 1 node evaluation
```

### 3.4 Hiệu quả

| Không có Pruning | Có Alpha-Beta |
|------------------|---------------|
| O(b^d) | O(b^(d/2)) tốt nhất |
| Xét tất cả nodes | Cắt ~50% nodes |

Với b=10 (branching factor), d=4 (depth):
- Không pruning: 10,000 nodes
- Có pruning: ~100 nodes (tốt nhất)

---

## 4. Cấu trúc Class

```javascript
class MinimaxSolver {
    constructor(maxDepth = 3) {
        this.maxDepth = 3;           // Độ sâu tìm kiếm
        this.nodeCount = 0;           // Đếm nodes đã xét
        this.evaluationTime = 0;      // Thời gian đánh giá
        this.timeBudgetMs = 20;       // Giới hạn thời gian (ms)
        this.maxNodes = 5000;         // Giới hạn số nodes
        this.startTime = 0;           // Thời điểm bắt đầu
        this.weights = {...};         // Trọng số đánh giá
        this.transpositionTable = new Map();  // Bảng ghi nhớ
        this.maxTableSize = 1000;     // Kích thước tối đa bảng
    }
}
```

---

## 5. Hệ thống trọng số

### 5.1 Định nghĩa trọng số

```javascript
this.weights = {
    score: 1.0,           // Trọng số điểm từ simulation
    moves: 0.5,           // Trọng số số nước đi (không dùng)
    possibleMoves: 0.3,   // Trọng số số nước đi khả thi
    specialGems: 2.0,     // Trọng số gem đặc biệt
    centerControl: 0.2    // Trọng số kiểm soát trung tâm
};
```

### 5.2 Công thức đánh giá tổng thể

```
BoardScore = (simulationScore × 1.0)
           + (cascadeCount × 50 × 1.0)
           + (min(moveCount, 30) × 0.3)
           + (specialGemCount × 2.0)
           + (centerControlValue × 0.2)
           + patternBonus
```

### 5.3 Giải thích từng trọng số

| Trọng số | Giá trị | Mục đích |
|----------|---------|----------|
| `score` | 1.0 | Đánh giá điểm trực tiếp từ match |
| `possibleMoves` | 0.3 | Ưu tiên trạng thái có nhiều lựa chọn |
| `specialGems` | 2.0 | Ưu tiên cao cho gem đặc biệt |
| `centerControl` | 0.2 | Bonus nhỏ cho kiểm soát trung tâm |

---

## 6. Chi tiết các phương thức

### 6.1 findBestMove() - Điểm vào chính

```javascript
findBestMove(grid, depth = null, isMaximizing = true)
```

**Mục đích**: Tìm nước đi tốt nhất từ trạng thái hiện tại

**Các bước**:
1. Khởi tạo timer và counter
2. Xóa transposition table
3. Gọi `minimax()` với alpha=-∞, beta=+∞
4. Xử lý exception nếu timeout/node limit
5. Trả về kết quả đầy đủ

**Kết quả trả về**:
```javascript
{
    move: {gem1, gem2},      // Nước đi tốt nhất
    score: number,           // Điểm đánh giá
    nodesExplored: number,   // Số nodes đã xét
    evaluationTime: number,  // Thời gian (ms)
    depth: number,           // Độ sâu tìm kiếm
    aborted: boolean         // Có bị timeout không
}
```

### 6.2 minimax() - Thuật toán chính

```javascript
minimax(grid, depth, alpha, beta, isMaximizing)
```

**Các bước**:

```
1. Kiểm tra timeout/node limit
   ├── Nếu timeout → throw Error
   └── Nếu quá nodes → throw Error

2. Kiểm tra transposition table
   └── Nếu đã có kết quả → return cached

3. Base case (depth = 0)
   └── return evaluateBoard(grid)

4. Lấy tất cả nước đi có thể
   └── Nếu không có → return evaluateBoard

5. Nếu isMaximizing (MAX player):
   ├── maxScore = -∞
   ├── For each move:
   │   ├── Clone grid
   │   ├── Thực hiện swap trên clone
   │   ├── fastSimulate(clone)
   │   ├── score = minimax(clone, depth-1, α, β, false)
   │   ├── Cập nhật maxScore, bestMove
   │   ├── α = max(α, score)
   │   └── Nếu β ≤ α → break (cắt tỉa)
   └── return {maxScore, bestMove}

6. Nếu !isMaximizing (MIN player):
   ├── minScore = +∞
   ├── For each move:
   │   ├── Clone grid
   │   ├── Thực hiện swap trên clone
   │   ├── fastSimulate(clone)
   │   ├── score = minimax(clone, depth-1, α, β, true)
   │   ├── Cập nhật minScore, bestMove
   │   ├── β = min(β, score)
   │   └── Nếu β ≤ α → break (cắt tỉa)
   └── return {minScore, bestMove}
```

### 6.3 fastSimulate() - Mô phỏng nhanh

```javascript
fastSimulate(grid)
```

**Mục đích**: Mô phỏng một bước match + gravity nhanh (không loop)

**Các bước**:
```
1. Tìm matches
2. Nếu không có match → return (score=0)
3. Xóa matches và tính điểm
4. Áp dụng gravity
5. Lưu simulationScore và cascadeCount
```

**Lưu ý**: Chỉ mô phỏng **1 cascade** để tăng tốc độ

### 6.4 shallowCloneGrid() - Clone nhanh

```javascript
shallowCloneGrid(original)
```

**Mục đích**: Tạo bản sao nhẹ của grid để mô phỏng

**Đặc điểm**:
- Clone chỉ dữ liệu cần thiết (rows, cols, gems)
- Bật `simulationMode = true` để tránh animation
- Bind các method cần thiết từ original
- Không copy toàn bộ object

**Code chi tiết**:
```javascript
const cloned = Object.create(Object.getPrototypeOf(original));
cloned.rows = original.rows;
cloned.cols = original.cols;
cloned.simulationMode = true;

// Clone gem matrix
cloned.gems = [];
for (let r = 0; r < original.rows; r++) {
    const rowArr = [];
    for (let c = 0; c < original.cols; c++) {
        const g = original.gems[r][c];
        rowArr[c] = g ? g.clone() : null;
    }
    cloned.gems[r] = rowArr;
}

// Bind methods
cloned.findMatches = original.findMatches.bind(cloned);
cloned.removeMatches = original.removeMatches.bind(cloned);
cloned.applyGravity = original.applyGravity.bind(cloned);
cloned.swapGemsData = original.swapGemsData.bind(cloned);
cloned.findAllPossibleMoves = original.findAllPossibleMoves.bind(cloned);
```

### 6.5 evaluateBoard() - Đánh giá trạng thái

```javascript
evaluateBoard(grid)
```

**Công thức**:
```
score = simulationScore × 1.0
      + cascadeCount × 50 × 1.0
      + min(moveCount, 30) × 0.3
      + specialGemCount × 2.0
      + centerControlValue × 0.2
      + patternScore
```

---

## 7. Transposition Table

### 7.1 Khái niệm

**Transposition Table** là kỹ thuật **memoization** để lưu kết quả đã tính, tránh tính lại các trạng thái giống nhau.

### 7.2 Cấu trúc key

```javascript
const tableKey = `${boardHash}-${depth}-${isMaximizing}`;
```

Ví dụ: `"123456789012...-3-true"`

### 7.3 Giới hạn kích thước

```javascript
storeInTable(key, result) {
    if (this.transpositionTable.size >= this.maxTableSize) {
        // Xóa entry cũ nhất (FIFO)
        const firstKey = this.transpositionTable.keys().next().value;
        this.transpositionTable.delete(firstKey);
    }
    this.transpositionTable.set(key, result);
}
```

### 7.4 Hash function

```javascript
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
```

Ví dụ hash: `"12345678123456781234567812345678..."` (64 ký tự cho grid 8x8)

---

## 8. Đánh giá Board (Heuristics)

### 8.1 countSpecialGems()

Đếm số gem đặc biệt trên bàn cờ:

```javascript
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
```

### 8.2 evaluateCenterControl()

Đánh giá kiểm soát vùng trung tâm:

```
Bản đồ giá trị (radius=2, center=4,4):

    0  1  2  3  4  5  6  7
   ┌──────────────────────┐
 0 │ -  -  -  -  -  -  -  -│
 1 │ -  -  -  -  -  -  -  -│
 2 │ -  -  10 20 30 20 10 -│
 3 │ -  -  20 30 40 30 20 -│
 4 │ -  -  30 40 50 40 30 -│  ← Trung tâm = điểm cao nhất
 5 │ -  -  20 30 40 30 20 -│
 6 │ -  -  10 20 30 20 10 -│
 7 │ -  -  -  -  -  -  -  -│
   └──────────────────────┘
```

**Công thức**:
```
centerValue += (radius - distance + 1) × 10
```

---

## 9. Nhận dạng Pattern

### 9.1 T-Shape Pattern

```
    ⬜ 🔴 ⬜        🔴 🔴 🔴
    🔴 🔴 🔴   hoặc    🔴
    ⬜ 🔴 ⬜           🔴
    
    Bonus: +30 điểm
```

**Điều kiện**:
- Có gem cùng loại ở trên + dưới
- Có ít nhất 1 gem cùng loại ở trái hoặc phải

### 9.2 L-Shape Pattern

```
    🔴 ⬜          ⬜ 🔴
    🔴 ⬜    hoặc  ⬜ 🔴
    🔴 🔴          🔴 🔴
    
    Bonus: +25 điểm
```

**4 hướng kiểm tra**:
```javascript
const directions = [
    [[0, 1], [1, 0]],   // Right-Down L
    [[0, -1], [1, 0]],  // Left-Down L
    [[0, 1], [-1, 0]],  // Right-Up L
    [[0, -1], [-1, 0]]  // Left-Up L
];
```

### 9.3 Square Pattern (2x2)

```
    🔴 🔴
    🔴 🔴
    
    Bonus: +20 điểm
```

**Điều kiện**:
- 4 gem cùng loại tạo hình vuông 2x2

---

## 10. Tối ưu hiệu suất

### 10.1 Giới hạn tài nguyên

```javascript
// ★ ĐÃ CẬP NHẬT - Tăng đáng kể để AI tìm kiếm sâu hơn
this.timeBudgetMs = 2000;   // Tối đa 2000ms (trước: 20ms)
this.maxNodes = 50000;      // Tối đa 50000 nodes (trước: 5000)
```

> **📝 Lý do cập nhật**: Các giá trị cũ quá nhỏ, khiến AI không thể tìm kiếm đủ sâu khi chọn độ khó Hard (depth 4-10).

### 10.2 Kiểm tra giới hạn trong minimax()

```javascript
// Time guard
if (performance.now() - this.startTime > this.timeBudgetMs) {
    throw new Error('time_budget_exceeded');
}

// Node guard
if (++this.nodeCount >= this.maxNodes) {
    throw new Error('node_limit_exceeded');
}
```

### 10.3 Xử lý khi vượt giới hạn

```javascript
try {
    result = this.minimax(grid, searchDepth, -Infinity, Infinity, isMaximizing);
} catch (e) {
    console.warn('Minimax aborted:', e.message);
    // Fallback: chọn nước đi đầu tiên
    const fallbackMoves = grid.findAllPossibleMoves();
    result = { move: fallbackMoves[0] || null, score: 0 };
}
```

### 10.4 So sánh hiệu suất

| Tối ưu | Trước | Sau (★ Cập nhật) |
|--------|-------|------------------|
| Time budget | 40ms | **2000ms** |
| Max nodes | 10,000 | **50,000** |
| Clone strategy | Deep clone | Shallow clone |
| Cascade simulation | Full loop | Single pass |

> **📝 Lưu ý**: Các thông số đã được tăng lên để hỗ trợ tìm kiếm sâu hơn (depth 4-10) khi chơi ở độ khó Hard.

---

## 11. So sánh với HintSystem

| Đặc điểm | HintSystem | MinimaxSolver |
|----------|------------|---------------|
| **Thuật toán** | Greedy Search | Minimax + Alpha-Beta |
| **Độ sâu** | 1 (chỉ 1 bước) | 3 (3 bước trước) |
| **Tốc độ** | Rất nhanh | Chậm hơn |
| **Độ chính xác** | Tốt cho nước đi tức thì | Tốt cho chuỗi nước đi |
| **Cascade** | Ước lượng | Mô phỏng thực |
| **Memory** | O(N) | O(N × depth) |
| **Sử dụng** | AI Hint chính | Fallback, Auto-solve |

### Khi nào dùng cái nào?

- **HintSystem**: 
  - Cần gợi ý nhanh
  - Người chơi cần hint
  - Real-time suggestions

- **MinimaxSolver**:
  - Cần đánh giá sâu
  - Auto-solve mode
  - Khi HintSystem fail

---

## 12. Ví dụ minh họa

### 12.1 Ví dụ cây Minimax

```
Bàn cờ hiện tại có 3 nước đi: A, B, C
Depth = 2

                    [ROOT - MAX]
                   /      |      \
                Move A  Move B  Move C
                 |        |        |
               [MIN]    [MIN]    [MIN]
              /    \   /    \   /    \
            A1    A2  B1    B2  C1    C2
            |      |   |     |   |     |
           40     30  50    20  35    45

Tính toán (bottom-up):
- MIN tại A: min(40, 30) = 30
- MIN tại B: min(50, 20) = 20
- MIN tại C: min(35, 45) = 35

- MAX tại ROOT: max(30, 20, 35) = 35 → Chọn Move C
```

### 12.2 Ví dụ Alpha-Beta Pruning

```
                    [MAX] α=-∞, β=+∞
                   /           \
              [MIN]           [MIN]
             /    \          /    \
           40     30       50     ??

Quá trình:
1. Xét Move A:
   - MIN xét 40 → β=40
   - MIN xét 30 → β=30
   - MIN trả về 30
   - MAX cập nhật α=30

2. Xét Move B:
   - MIN xét 50 → β=50
   - Nhưng 50 > α(30) nên tiếp tục
   - ⚠️ Chờ đã! Nếu MIN tìm được giá trị < 30, 
     MAX sẽ không chọn nhánh này
   - Giả sử nhánh tiếp theo là 20 → β=20
   - β(20) < α(30) → CẮT TỈNH!

Tiết kiệm: Không cần xét thêm nhánh của Move B
```

---

## 13. Hướng dẫn sử dụng

### 13.1 Khởi tạo

```javascript
// Tạo solver với độ sâu mặc định (3)
const solver = new MinimaxSolver();

// Hoặc tùy chỉnh độ sâu
const solver = new MinimaxSolver(4);
```

### 13.2 Tìm nước đi tốt nhất

```javascript
const result = solver.findBestMove(grid);

if (result.move && !result.aborted) {
    console.log(`Best move: (${result.move.gem1.row},${result.move.gem1.col}) ↔ (${result.move.gem2.row},${result.move.gem2.col})`);
    console.log(`Score: ${result.score}`);
    console.log(`Nodes explored: ${result.nodesExplored}`);
    console.log(`Time: ${result.evaluationTime}ms`);
}
```

### 13.3 Thay đổi độ khó

```javascript
solver.setDifficulty('easy');   // depth = 2
solver.setDifficulty('medium'); // depth = 3
solver.setDifficulty('hard');   // depth = 4
```

### 13.4 Lấy thống kê hiệu suất

```javascript
const stats = solver.getPerformanceStats();
console.log(`Nodes: ${stats.nodesExplored}`);
console.log(`Time: ${stats.evaluationTime}ms`);
console.log(`Avg time/node: ${stats.avgTimePerNode}ms`);
```

### 13.5 Tích hợp với Game

```javascript
// Trong Game.js
requestAutoSolve() {
    // Thử HintSystem trước
    if (this.aiComponents.hintSystem) {
        const hint = this.aiComponents.hintSystem.suggestMove(grid);
        if (hint) return hint;
    }
    
    // Fallback sang MinimaxSolver
    if (this.aiComponents.minimaxSolver) {
        const solution = this.aiComponents.minimaxSolver.findBestMove(grid);
        if (solution.move && !solution.aborted) {
            return solution.move;
        }
    }
    
    return null;
}
```

---

## 14. Độ phức tạp thuật toán

### 14.1 Thời gian

| Trường hợp | Độ phức tạp |
|------------|-------------|
| Minimax thuần túy | O(b^d) |
| Với Alpha-Beta (tốt nhất) | O(b^(d/2)) |
| Với Alpha-Beta (trung bình) | O(b^(3d/4)) |

Với b ≈ 20 (branching factor), d = 3:
- Không pruning: 8,000 nodes
- Có pruning: ~90-400 nodes

### 14.2 Không gian

| Component | Độ phức tạp |
|-----------|-------------|
| Call stack | O(d) |
| Transposition table | O(min(nodes, 1000)) |
| Grid clones | O(N × d) với N = rows × cols |

---

## 15. Tài liệu tham khảo

- **HintSystem**: [HintSystem_Documentation.md](./HintSystem_Documentation.md)
- **Cascade Prediction**: [CascadePrediction_Documentation.md](./CascadePrediction_Documentation.md) ★ MỚI
- **Pattern Recognizer**: [PatternRecognizer_Documentation.md](./PatternRecognizer_Documentation.md)
- **Game Engine**: [GameEngine.js](../js/core/GameEngine.js)
- **Grid Logic**: [Grid.js](../js/core/Grid.js)

### Thuật toán liên quan
- Minimax Algorithm - Wikipedia
- Alpha-Beta Pruning - Chess Programming Wiki
- Transposition Tables - Game AI Theory

---

*Tài liệu được tạo ngày: 23/12/2024*
*Cập nhật: 23/12/2024 - Cập nhật timeBudgetMs và maxNodes*
*Phiên bản: 1.1*
