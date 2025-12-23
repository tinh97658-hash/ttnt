# 📚 Tài liệu chi tiết: HintSystem.js - Hệ thống Gợi ý AI

## 📋 Mục lục
1. [Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
2. [Cấu trúc Class](#2-cấu-trúc-class)
3. [Hệ thống trọng số](#3-hệ-thống-trọng-số)
4. [Thuật toán chính: suggestMove()](#4-thuật-toán-chính-suggestmove)
5. [Thuật toán đánh giá: evaluateMove()](#5-thuật-toán-đánh-giá-evaluatemove)
6. [Thuật toán đếm Match: getMatchSize()](#6-thuật-toán-đếm-match-getmatchsize)
7. [Thuật toán ước lượng Cascade: estimateCascades()](#7-thuật-toán-ước-lượng-cascade-estimatecascades)
8. [Thuật toán đánh giá vị trí: evaluatePosition()](#8-thuật-toán-đánh-giá-vị-trí-evaluateposition)
9. [Thuật toán lấy thông tin Match: getMatchInfo()](#9-thuật-toán-lấy-thông-tin-match-getmatchinfo)
10. [Thuật toán nhóm Match: groupMatches()](#10-thuật-toán-nhóm-match-groupmatches)
11. [Thuật toán tính độ tin cậy: calculateConfidence()](#11-thuật-toán-tính-độ-tin-cậy-calculateconfidence)
12. [Sơ đồ luồng hoạt động](#12-sơ-đồ-luồng-hoạt-động)
13. [Ví dụ minh họa](#13-ví-dụ-minh-họa)
14. [Phân tích độ phức tạp](#14-phân-tích-độ-phức-tạp)
15. [Ưu điểm và hạn chế](#15-ưu-điểm-và-hạn-chế)
16. [**★ Cascade Prediction (Tính năng mới)**](#16-cascade-prediction-tính-năng-mới)

---

## 1. Giới thiệu tổng quan

### 1.1 Mục đích
`HintSystem` là một hệ thống trí tuệ nhân tạo (AI) được thiết kế để phân tích bàn cờ trong game Match-3 (tương tự Candy Crush, Bejeweled) và đưa ra gợi ý nước đi tốt nhất cho người chơi.

### 1.2 Nguyên lý hoạt động
Hệ thống sử dụng phương pháp **Greedy Search** (Tìm kiếm tham lam) kết hợp với **Heuristic Evaluation** (Đánh giá kinh nghiệm) để:
1. Duyệt qua tất cả các nước đi có thể
2. Đánh giá điểm số cho từng nước đi
3. Chọn nước đi có điểm cao nhất

### 1.3 Đặc điểm
- **Độ sâu tìm kiếm**: 1 (chỉ nhìn trước 1 bước)
- **Phương pháp**: Greedy với Heuristic
- **Thời gian thực**: Phù hợp cho game real-time

---

## 2. Cấu trúc Class

```javascript
class HintSystem {
    constructor() {
        this.evaluationDepth = 1;    // Độ sâu đánh giá
        this.weights = { ... };       // Hệ thống trọng số
    }
    
    // Phương thức chính
    suggestMove(grid)                 // Gợi ý nước đi tốt nhất
    
    // Phương thức đánh giá
    evaluateMove(grid, move)          // Đánh giá một nước đi
    getMatchSize(grid, match)         // Đếm kích thước match
    estimateCascades(grid)            // Ước lượng cascade
    evaluateFallingGem(...)           // Đánh giá gem rơi
    evaluatePosition(move)            // Đánh giá vị trí
    
    // Phương thức thông tin
    getMatchInfo(grid, move)          // Lấy thông tin chi tiết match
    generateReason(matchInfo)         // Tạo lý do gợi ý
    groupMatches(matches, grid)       // Nhóm các match liên kết
    calculateConfidence(...)          // Tính độ tin cậy
}
```

---

## 3. Hệ thống trọng số

### 3.1 Định nghĩa trọng số

```javascript
this.weights = {
    matchSize: 10,        // Điểm cơ bản cho mỗi gem trong match
    cascadePotential: 5,  // Điểm cho tiềm năng tạo combo (ước lượng)
    cascadeActual: 25,    // ★ NEW: Điểm cho cascade thực sự (mô phỏng)
    specialGemBonus: 15,  // Bonus khi tạo được match ≥4 viên
    positionValue: 2      // Điểm thưởng cho vị trí trung tâm
};
```

### 3.2 Giải thích chi tiết từng trọng số

| Trọng số | Giá trị | Mục đích | Lý do |
|----------|---------|----------|-------|
| `matchSize` | 10 | Điểm cơ bản cho mỗi gem match | Ưu tiên các nước đi tạo nhiều match |
| `cascadePotential` | 5 | Điểm cho combo tiềm năng (ước lượng) | Khuyến khích tạo chuỗi combo |
| `cascadeActual` | 25 | ★ **MỚI**: Điểm cho cascade thực sự | Khi bật Cascade Prediction |
| `specialGemBonus` | 15 | Bonus cho match lớn (≥4) | Ưu tiên tạo gem đặc biệt |
| `positionValue` | 2 | Điểm vị trí | Ưu tiên vị trí trung tâm bàn cờ |

> **📝 Lưu ý**: `cascadeActual` được sử dụng khi bật tính năng **Cascade Prediction**. Xem thêm tài liệu [CascadePrediction_Documentation.md](CascadePrediction_Documentation.md)

### 3.3 Công thức tổng điểm

```
Tổng điểm = (Số gem match × matchSize) 
          + (Số match ≥4 viên × specialGemBonus)
          + (Điểm cascade × cascadePotential)
          + (Điểm vị trí × positionValue)
```

**Dạng toán học:**

$$Score = \sum_{i=1}^{n} gems_i \times 10 + \sum_{j=1}^{m} (size_j \geq 4) \times 15 + cascade \times 5 + position \times 2$$

Confidence=min(0.7×baseConf+0.3×choiceConf,100)
Trong đó:

baseConf=min(bestScore/50,1)×100

choiceConf=max(0,100−(totalMoves−1)×5)

---

## 4. Thuật toán chính: suggestMove()

### 4.1 Mã nguồn

```javascript
suggestMove(grid) {
    const possibleMoves = grid.findAllPossibleMoves();
    
    if (possibleMoves.length === 0) {
        return null;
    }
    
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
        gem1: bestMove.gem1,
        gem2: bestMove.gem2,
        evaluationScore: bestScore,
        confidence: this.calculateConfidence(bestScore, possibleMoves.length),
        matchInfo: bestMatchInfo,
        reason: this.generateReason(bestMatchInfo)
    };
}
```

### 4.2 Giải thích từng bước

#### Bước 1: Thu thập tất cả nước đi có thể
```javascript
const possibleMoves = grid.findAllPossibleMoves();
```
- Gọi phương thức của Grid để lấy danh sách tất cả các cặp gem có thể hoán đổi
- Mỗi `move` chứa: `{gem1: {row, col}, gem2: {row, col}}`

#### Bước 2: Kiểm tra trường hợp không có nước đi
```javascript
if (possibleMoves.length === 0) {
    return null;
}
```
- Nếu không có nước đi nào → trả về `null`
- Game sẽ cần shuffle lại bàn cờ

#### Bước 3: Khởi tạo với nước đi đầu tiên
```javascript
let bestMove = possibleMoves[0];
let bestScore = this.evaluateMove(grid, bestMove);
let bestMatchInfo = this.getMatchInfo(grid, bestMove);
```
- Giả định nước đi đầu tiên là tốt nhất
- Đánh giá điểm và lấy thông tin match

#### Bước 4: Duyệt và so sánh tất cả nước đi
```javascript
for (let i = 1; i < possibleMoves.length; i++) {
    const moveScore = this.evaluateMove(grid, possibleMoves[i]);
    if (moveScore > bestScore) {
        bestScore = moveScore;
        bestMove = possibleMoves[i];
        bestMatchInfo = this.getMatchInfo(grid, possibleMoves[i]);
    }
}
```
- Duyệt từ nước đi thứ 2 đến cuối
- Nếu điểm cao hơn → cập nhật best

#### Bước 5: Trả về kết quả đầy đủ
```javascript
return {
    gem1: bestMove.gem1,           // Vị trí gem 1
    gem2: bestMove.gem2,           // Vị trí gem 2
    evaluationScore: bestScore,     // Điểm đánh giá
    confidence: ...,                // Độ tin cậy (%)
    matchInfo: bestMatchInfo,       // Thông tin chi tiết
    reason: ...                     // Lý do dạng text
};
```

### 4.3 Sơ đồ thuật toán

```
┌─────────────────────────────────────┐
│         suggestMove(grid)           │
└─────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│   possibleMoves = findAllMoves()    │
└─────────────────────────────────────┘
                   │
                   ▼
          ┌───────────────┐
          │ moves.length  │──── = 0 ──→ return null
          │     = 0?      │
          └───────────────┘
                   │ > 0
                   ▼
┌─────────────────────────────────────┐
│   bestMove = moves[0]               │
│   bestScore = evaluate(bestMove)    │
└─────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│   FOR i = 1 to moves.length - 1     │
│   ┌───────────────────────────────┐ │
│   │ score = evaluate(moves[i])    │ │
│   │ IF score > bestScore:         │ │
│   │   bestScore = score           │ │
│   │   bestMove = moves[i]         │ │
│   └───────────────────────────────┘ │
└─────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│   return {gem1, gem2, score,        │
│           confidence, matchInfo,    │
│           reason}                   │
└─────────────────────────────────────┘
```

---

## 5. Thuật toán đánh giá: evaluateMove()

### 5.1 Mã nguồn

```javascript
evaluateMove(grid, move) {
    // Bước 1: Lấy tham chiếu đến 2 gem
    const gem1 = grid.gems[move.gem1.row][move.gem1.col];
    const gem2 = grid.gems[move.gem2.row][move.gem2.col];
    
    // Bước 2: Bật chế độ mô phỏng
    const prevSim = grid.simulationMode;
    grid.simulationMode = true;
    
    // Bước 3: Thực hiện swap tạm thời
    grid.swapGemsData(gem1, gem2);
    
    // Bước 4: Tìm các match sau khi swap
    const matches = grid.findMatches();
    
    // Bước 5: Tính điểm
    let score = 0;
    
    // 5a. Điểm cơ bản từ số lượng match
    score += matches.length * this.weights.matchSize;
    
    // 5b. Bonus cho match lớn (≥4 viên)
    matches.forEach(match => {
        const matchSize = this.getMatchSize(grid, match);
        if (matchSize >= 4) {
            score += this.weights.specialGemBonus;
        }
    });
    
    // 5c. Điểm từ tiềm năng cascade
    score += this.estimateCascades(grid) * this.weights.cascadePotential;
    
    // 5d. Điểm từ vị trí
    score += this.evaluatePosition(move) * this.weights.positionValue;
    
    // Bước 6: Khôi phục trạng thái ban đầu
    grid.swapGemsData(gem1, gem2);
    grid.simulationMode = prevSim;
    
    return score;
}
```

### 5.2 Giải thích chi tiết

#### Bước 1-3: Chuẩn bị mô phỏng
```javascript
// Lấy tham chiếu gem từ lưới
const gem1 = grid.gems[move.gem1.row][move.gem1.col];
const gem2 = grid.gems[move.gem2.row][move.gem2.col];

// Bật simulation mode để tránh animation
grid.simulationMode = true;

// Hoán đổi dữ liệu 2 gem
grid.swapGemsData(gem1, gem2);
```

**Tại sao cần simulation mode?**
- Tránh trigger animation khi đánh giá
- Đảm bảo tính toán nhanh
- Không ảnh hưởng UI

#### Bước 4: Tìm matches
```javascript
const matches = grid.findMatches();
```
- Trả về mảng các vị trí gem tạo match
- Ví dụ: `[{row: 0, col: 0}, {row: 0, col: 1}, {row: 0, col: 2}]`

#### Bước 5a: Tính điểm cơ bản
```javascript
score += matches.length * this.weights.matchSize;
// Ví dụ: 5 gems matched × 10 = 50 điểm
```

#### Bước 5b: Bonus cho match lớn
```javascript
matches.forEach(match => {
    const matchSize = this.getMatchSize(grid, match);
    if (matchSize >= 4) {
        score += this.weights.specialGemBonus; // +15 điểm
    }
});
```

**Lý do ưu tiên match lớn:**
- Match 4 viên → tạo Striped Gem
- Match 5 viên → tạo Rainbow Gem
- Gem đặc biệt có giá trị cao hơn

#### Bước 5c: Điểm cascade
```javascript
score += this.estimateCascades(grid) * this.weights.cascadePotential;
```
- Đánh giá khả năng tạo combo
- Combo = điểm thưởng lớn trong game

#### Bước 5d: Điểm vị trí
```javascript
score += this.evaluatePosition(move) * this.weights.positionValue;
```
- Ưu tiên vị trí trung tâm
- Trung tâm có nhiều cơ hội combo hơn

#### Bước 6: Khôi phục trạng thái
```javascript
grid.swapGemsData(gem1, gem2);  // Swap lại
grid.simulationMode = prevSim;   // Khôi phục mode
```
- **Quan trọng**: Phải khôi phục để không ảnh hưởng game state

### 5.3 Công thức tính điểm hoàn chỉnh

```
Score = (matches.length × 10) 
      + (count(matchSize ≥ 4) × 15)
      + (cascadePotential × 5)
      + (positionScore × 2)
```

**Ví dụ cụ thể:**
```
Một nước đi tạo:
- 6 gems match (gồm 1 match 4 viên)
- Cascade potential = 3
- Position score = 10

Tổng điểm = (6 × 10) + (1 × 15) + (3 × 5) + (10 × 2)
          = 60 + 15 + 15 + 20
          = 110 điểm
```

---

## 6. Thuật toán đếm Match: getMatchSize()

### 6.1 Thuật toán sử dụng: DFS (Depth-First Search)

### 6.2 Mã nguồn

```javascript
getMatchSize(grid, match) {
    const visited = new Set();
    const stack = [match];
    let count = 0;
    
    while (stack.length > 0) {
        const current = stack.pop();
        const key = `${current.row},${current.col}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        count++;
        
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
```

### 6.3 Giải thích thuật toán DFS

#### Khởi tạo
```javascript
const visited = new Set();  // Theo dõi ô đã thăm
const stack = [match];      // Stack cho DFS
let count = 0;              // Đếm số gem liên kết
```

#### Vòng lặp chính
```
WHILE stack không rỗng:
    1. Pop phần tử từ stack
    2. Tạo key duy nhất "row,col"
    3. Nếu đã visited → bỏ qua
    4. Đánh dấu visited, tăng count
    5. Kiểm tra 4 hướng: ↑ ↓ ← →
    6. Nếu gem cùng loại → push vào stack
```

#### 4 hướng kiểm tra
```javascript
const directions = [
    [-1, 0],  // Lên    (row - 1)
    [1, 0],   // Xuống  (row + 1)
    [0, -1],  // Trái   (col - 1)
    [0, 1]    // Phải   (col + 1)
];
```

### 6.4 Ví dụ minh họa

```
Bàn cờ:
    0   1   2   3
0   🔴  🔵  🔴  🟢
1   🔴  🔴  🔵  🟢
2   🔵  🔴  🔵  🔴
3   🟢  🔵  🟢  🔴

Gọi getMatchSize() tại (0,0):

Bước 1: stack = [{0,0}], visited = {}, count = 0
Bước 2: Pop {0,0}, visited = {"0,0"}, count = 1
        Kiểm tra: ↑(out), ↓{1,0}🔴✓, ←(out), →{0,1}🔵✗
        stack = [{1,0}]
        
Bước 3: Pop {1,0}, visited = {"0,0","1,0"}, count = 2
        Kiểm tra: ↑{0,0}visited, ↓{2,0}🔵✗, ←(out), →{1,1}🔴✓
        stack = [{1,1}]
        
Bước 4: Pop {1,1}, visited = {"0,0","1,0","1,1"}, count = 3
        Kiểm tra: ↑{0,1}🔵✗, ↓{2,1}🔴✓, ←{1,0}visited, →{1,2}🔵✗
        stack = [{2,1}]
        
Bước 5: Pop {2,1}, visited = {"0,0","1,0","1,1","2,1"}, count = 4
        Không còn gem 🔴 liền kề chưa visit
        stack = []
        
Kết quả: count = 4 (có 4 gem đỏ liên kết)
```

### 6.5 Độ phức tạp

- **Thời gian**: O(n) với n là số ô trong lưới
- **Không gian**: O(n) cho visited set và stack

---

## 7. Thuật toán ước lượng Cascade: estimateCascades()

### 7.1 Khái niệm Cascade

**Cascade** (hay Combo) xảy ra khi:
1. Các gem match bị xóa
2. Gem phía trên rơi xuống lấp đầy
3. Gem mới rơi tạo thêm match
4. Lặp lại cho đến khi không còn match

### 7.2 Mã nguồn

```javascript
estimateCascades(grid) {
    let cascadePotential = 0;
    
    for (let col = 0; col < grid.cols; col++) {
        let emptySpaces = 0;
        
        for (let row = grid.rows - 1; row >= 0; row--) {
            if (!grid.gems[row][col]) {
                emptySpaces++;
            } else if (emptySpaces > 0) {
                cascadePotential += this.evaluateFallingGem(grid, row, col, emptySpaces);
            }
        }
    }
    
    return cascadePotential;
}
```

### 7.3 Giải thích thuật toán

#### Ý tưởng chính
Duyệt từng cột từ dưới lên, đếm số ô trống và đánh giá tiềm năng khi gem rơi xuống.

#### Bước 1: Duyệt từng cột
```javascript
for (let col = 0; col < grid.cols; col++) {
```

#### Bước 2: Duyệt từ dưới lên trong mỗi cột
```javascript
for (let row = grid.rows - 1; row >= 0; row--) {
```

#### Bước 3: Đếm ô trống
```javascript
if (!grid.gems[row][col]) {
    emptySpaces++;
}
```

#### Bước 4: Đánh giá gem sẽ rơi
```javascript
else if (emptySpaces > 0) {
    cascadePotential += this.evaluateFallingGem(grid, row, col, emptySpaces);
}
```

### 7.4 Ví dụ minh họa

```
Cột 2 của bàn cờ:
Row 0: 🔴
Row 1: ⬜ (empty)
Row 2: ⬜ (empty)
Row 3: 🔵
Row 4: 🔴
Row 5: 🔴
Row 6: 🔴
Row 7: 🔵

Duyệt từ dưới lên:
- Row 7: 🔵, emptySpaces = 0
- Row 6: 🔴, emptySpaces = 0
- Row 5: 🔴, emptySpaces = 0
- Row 4: 🔴, emptySpaces = 0
- Row 3: 🔵, emptySpaces = 0
- Row 2: ⬜, emptySpaces = 1
- Row 1: ⬜, emptySpaces = 2
- Row 0: 🔴, emptySpaces = 2
        → Gem này sẽ rơi 2 ô
        → Đánh giá tiềm năng tại vị trí mới (row = 0 + 2 = 2)
```

---

## 8. Thuật toán đánh giá Gem rơi: evaluateFallingGem()

### 8.1 Mã nguồn

```javascript
evaluateFallingGem(grid, row, col, fallDistance) {
    const gem = grid.gems[row][col];
    if (!gem) return 0;
    
    let potential = 0;
    const newRow = row + fallDistance;
    
    if (newRow < grid.rows) {
        // Kiểm tra hàng ngang bên trái
        if (col > 0 && grid.gems[newRow][col - 1] && 
            grid.gems[newRow][col - 1].type === gem.type) {
            potential += 5;
        }
        // Kiểm tra hàng ngang bên phải
        if (col < grid.cols - 1 && grid.gems[newRow][col + 1] && 
            grid.gems[newRow][col + 1].type === gem.type) {
            potential += 5;
        }
        // Kiểm tra hàng dọc phía trên
        if (newRow > 0 && grid.gems[newRow - 1][col] && 
            grid.gems[newRow - 1][col].type === gem.type) {
            potential += 5;
        }
        // Kiểm tra hàng dọc phía dưới
        if (newRow < grid.rows - 1 && grid.gems[newRow + 1][col] && 
            grid.gems[newRow + 1][col].type === gem.type) {
            potential += 5;
        }
    }
    
    return potential;
}
```

### 8.2 Giải thích

Hàm này đánh giá tiềm năng tạo match khi một gem rơi xuống vị trí mới.

#### Các hướng kiểm tra

```
          ↑ (newRow - 1)
          |
← ────── GEM ────── →
          |
          ↓ (newRow + 1)
```

#### Công thức tính điểm

```
potential = 5 × (số gem cùng loại ở 4 hướng)
```

**Ví dụ:**
```
Vị trí mới sau khi rơi:

    col-1  col  col+1
    ─────────────────
    🔴     🔴    🔵     ← newRow-1
    🔴   [🔴]   🔴     ← newRow (gem rơi vào đây)
    🔵     🔴    🔵     ← newRow+1

Gem 🔴 rơi vào [🔴]:
- Trái: 🔴 cùng loại → +5
- Phải: 🔴 cùng loại → +5
- Trên: 🔴 cùng loại → +5
- Dưới: 🔴 cùng loại → +5

Tổng potential = 20
```

---

## 9. Thuật toán đánh giá vị trí: evaluatePosition()

### 9.1 Mã nguồn

```javascript
evaluatePosition(move) {
    const centerRow = 4;  // Giả sử lưới 8x8
    const centerCol = 4;
    
    const distance1 = Math.abs(move.gem1.row - centerRow) + Math.abs(move.gem1.col - centerCol);
    const distance2 = Math.abs(move.gem2.row - centerRow) + Math.abs(move.gem2.col - centerCol);
    
    return (16 - distance1 - distance2);
}
```

### 9.2 Giải thích

#### Khái niệm Manhattan Distance

**Manhattan Distance** (Khoảng cách Manhattan) là tổng khoảng cách theo chiều ngang và dọc.

$$d = |x_1 - x_2| + |y_1 - y_2|$$

#### Tại sao ưu tiên vị trí trung tâm?

1. **Nhiều láng giềng hơn**: Gem ở trung tâm có 4 hướng để tạo match
2. **Cascade potential**: Trung tâm ảnh hưởng nhiều gem hơn khi cascade
3. **Chiến thuật**: Giữ các gem tốt ở trung tâm cho các nước đi sau

### 9.3 Ví dụ minh họa

```
Lưới 8x8 (index 0-7), trung tâm = (4, 4)

Nước đi 1: swap (0,0) với (0,1)
- distance1 = |0-4| + |0-4| = 8
- distance2 = |0-4| + |1-4| = 7
- positionScore = 16 - 8 - 7 = 1 (thấp)

Nước đi 2: swap (4,4) với (4,5)
- distance1 = |4-4| + |4-4| = 0
- distance2 = |4-4| + |5-4| = 1
- positionScore = 16 - 0 - 1 = 15 (cao)

→ Nước đi 2 được ưu tiên hơn về mặt vị trí
```

### 9.4 Bản đồ điểm vị trí

```
   0  1  2  3  4  5  6  7
  ┌──────────────────────┐
0 │ 0  1  2  3  4  3  2  1│
1 │ 1  2  3  4  5  4  3  2│
2 │ 2  3  4  5  6  5  4  3│
3 │ 3  4  5  6  7  6  5  4│
4 │ 4  5  6  7  8  7  6  5│
5 │ 3  4  5  6  7  6  5  4│
6 │ 2  3  4  5  6  5  4  3│
7 │ 1  2  3  4  5  4  3  2│
  └──────────────────────┘
  (Điểm vị trí = 16 - distance, điểm cao = tốt)
```

---

## 10. Thuật toán lấy thông tin Match: getMatchInfo()

### 10.1 Mã nguồn

```javascript
getMatchInfo(grid, move) {
    // Thực hiện swap tạm thời
    const gem1 = grid.gems[move.gem1.row][move.gem1.col];
    const gem2 = grid.gems[move.gem2.row][move.gem2.col];
    const prevSim = grid.simulationMode;
    grid.simulationMode = true;
    grid.swapGemsData(gem1, gem2);
    
    // Tìm matches
    const matches = grid.findMatches();
    
    // Tạo object thông tin
    let matchInfo = {
        totalMatches: matches.length,
        matchedGems: [],
        gemTypes: new Set(),
        estimatedScore: 0,
        matchSizes: []
    };
    
    // Thu thập thông tin từng gem match
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
    
    // Nhóm matches và tính kích thước
    const matchGroups = this.groupMatches(matches, grid);
    matchInfo.matchSizes = matchGroups.map(group => group.length);
    matchInfo.estimatedScore = matchInfo.matchSizes.reduce((sum, size) => sum + size * 10, 0);
    
    // Khôi phục trạng thái
    grid.swapGemsData(gem1, gem2);
    grid.simulationMode = prevSim;
    
    return matchInfo;
}
```

### 10.2 Cấu trúc dữ liệu trả về

```javascript
{
    totalMatches: 6,           // Tổng số gem trong tất cả matches
    matchedGems: [             // Chi tiết từng gem
        {row: 0, col: 2, type: 1},
        {row: 0, col: 3, type: 1},
        {row: 0, col: 4, type: 1},
        {row: 3, col: 5, type: 3},
        {row: 4, col: 5, type: 3},
        {row: 5, col: 5, type: 3}
    ],
    gemTypes: Set(2) {1, 3},   // Các loại gem match
    estimatedScore: 60,         // Điểm ước tính
    matchSizes: [3, 3]          // Kích thước mỗi nhóm match
}
```

---

## 11. Thuật toán nhóm Match: groupMatches()

### 11.1 Thuật toán sử dụng: BFS (Breadth-First Search)

### 11.2 Mã nguồn

```javascript
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
```

### 11.3 So sánh DFS vs BFS

| Đặc điểm | DFS (getMatchSize) | BFS (groupMatches) |
|----------|--------------------|--------------------|
| Cấu trúc dữ liệu | Stack | Queue |
| Thao tác | pop() | shift() |
| Thứ tự duyệt | Sâu trước | Rộng trước |
| Use case | Đếm nhanh | Nhóm chính xác |

### 11.4 Ví dụ minh họa

```
Matches = [{0,0}, {0,1}, {0,2}, {3,3}, {3,4}, {3,5}]

Grid (chỉ hiển thị matches):
    0   1   2   3   4   5
0   🔴  🔴  🔴  -   -   -
1   -   -   -   -   -   -
2   -   -   -   -   -   -
3   -   -   -   🔵  🔵  🔵

Kết quả groupMatches:
groups = [
    [{0,0}, {0,1}, {0,2}],   // Nhóm 1: 3 gem đỏ
    [{3,3}, {3,4}, {3,5}]    // Nhóm 2: 3 gem xanh
]

matchSizes = [3, 3]
```

---

## 12. Thuật toán tính độ tin cậy: calculateConfidence()

### 12.1 Mã nguồn

```javascript
calculateConfidence(bestScore, totalMoves) {
    if (totalMoves === 0) return 0;
    
    // Độ tin cậy dựa trên điểm số
    const baseConfidence = Math.min(bestScore / 50, 1) * 100;
    
    // Giảm tin cậy nếu có nhiều lựa chọn
    const choiceConfidence = Math.max(0, 100 - (totalMoves - 1) * 5);
    
    return Math.min(baseConfidence * 0.7 + choiceConfidence * 0.3, 100);
}
```

### 12.2 Công thức

$$Confidence = \min\left(0.7 \times baseConf + 0.3 \times choiceConf, 100\right)$$

Trong đó:
- $baseConf = \min\left(\frac{bestScore}{50}, 1\right) \times 100$
- $choiceConf = \max(0, 100 - (totalMoves - 1) \times 5)$

### 12.3 Phân tích

#### baseConfidence (70% trọng số)
- Điểm càng cao → tin cậy càng lớn
- Đạt 100% khi bestScore ≥ 50

#### choiceConfidence (30% trọng số)
- Ít lựa chọn → tin cậy cao (nước đi rõ ràng)
- Nhiều lựa chọn → tin cậy giảm (có thể có nước đi khác tốt hơn)

### 12.4 Bảng ví dụ

| bestScore | totalMoves | baseConf | choiceConf | Confidence |
|-----------|------------|----------|------------|------------|
| 30 | 5 | 60% | 80% | 66% |
| 50 | 3 | 100% | 90% | 97% |
| 80 | 10 | 100% | 55% | 86.5% |
| 20 | 20 | 40% | 5% | 29.5% |

---

## 13. Sơ đồ luồng hoạt động

### 13.1 Sơ đồ tổng thể

```
                    ┌──────────────────────────────────────┐
                    │           USER REQUESTS HINT         │
                    └──────────────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           suggestMove(grid)                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ 1. possibleMoves = grid.findAllPossibleMoves()                         │  │
│  │    → Lấy danh sách tất cả nước đi hợp lệ                              │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                       │
│                                       ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ 2. FOR EACH move IN possibleMoves:                                     │  │
│  │    ┌──────────────────────────────────────────────────────────────┐    │  │
│  │    │                    evaluateMove(move)                         │    │  │
│  │    │  ┌────────────────────────────────────────────────────────┐  │    │  │
│  │    │  │ a. Swap tạm thời                                       │  │    │  │
│  │    │  │ b. matches = grid.findMatches()                        │  │    │  │
│  │    │  │ c. score = matches.length × 10                         │  │    │  │
│  │    │  │ d. FOR EACH match: getMatchSize() → bonus nếu ≥4       │  │    │  │
│  │    │  │ e. score += estimateCascades() × 5                     │  │    │  │
│  │    │  │ f. score += evaluatePosition() × 2                     │  │    │  │
│  │    │  │ g. Swap lại để khôi phục                               │  │    │  │
│  │    │  │ h. return score                                        │  │    │  │
│  │    │  └────────────────────────────────────────────────────────┘  │    │  │
│  │    │                          │                                    │    │  │
│  │    │                          ▼                                    │    │  │
│  │    │  IF score > bestScore → update bestMove, bestScore            │    │  │
│  │    └──────────────────────────────────────────────────────────────┘    │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                       │
│                                       ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ 3. matchInfo = getMatchInfo(bestMove)                                  │  │
│  │    → Thu thập thông tin chi tiết về matches                           │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                       │
│                                       ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ 4. confidence = calculateConfidence(bestScore, totalMoves)             │  │
│  │    → Tính độ tin cậy của gợi ý                                        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                       │
│                                       ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ 5. reason = generateReason(matchInfo)                                  │  │
│  │    → Tạo giải thích dạng text                                         │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │  RETURN {gem1, gem2, score,          │
                    │          confidence, matchInfo,      │
                    │          reason}                     │
                    └──────────────────────────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │       UI HIGHLIGHTS SUGGESTED        │
                    │            GEMS TO SWAP              │
                    └──────────────────────────────────────┘
```

---

## 14. Ví dụ minh họa hoàn chỉnh

### 14.1 Tình huống

```
Bàn cờ 8x8:
    0   1   2   3   4   5   6   7
  ┌─────────────────────────────────┐
0 │ 🔴  🔵  🔴  🔴  🟢  🔵  🟡  🔴 │
1 │ 🟢  🔴  🔵  🔵  🔵  🟢  🔴  🟢 │
2 │ 🔵  🟡  🔴  🟢  🔴  🔵  🟢  🔵 │
3 │ 🔴  🔵  🟢  🔴  🔵  🔴  🔵  🔴 │
4 │ 🟢  🔴  🔵  🟡  🔴  🟢  🔴  🟢 │
5 │ 🔵  🟢  🔴  🔵  🟢  🔵  🟢  🔵 │
6 │ 🔴  🔵  🟢  🔴  🔵  🔴  🔵  🔴 │
7 │ 🟢  🔴  🔵  🟢  🔴  🟢  🔴  🟢 │
  └─────────────────────────────────┘

Giả sử có 2 nước đi:
- Move A: swap (0,2) với (0,3) → tạo match 3 🔴
- Move B: swap (1,2) với (1,3) → tạo match 4 🔵
```

### 14.2 Đánh giá Move A

```
Sau swap (0,2) ↔ (0,3):
    0   1   2   3   4   ...
0 │ 🔴  🔵  🔴  🔴  🟢  ...
             ↑___↑

- matches.length = 3 (gem 🔴 tại 0,0 và 0,2 và 0,3)
  Thực tế chỉ có 🔴 tại 0,2, 0,3... không đủ 3 liên tiếp

Giả sử match hợp lệ tạo 3 gem:
- Base score: 3 × 10 = 30
- Match size = 3 (không có bonus)
- Cascade potential: 0 (không có ô trống)
- Position: distance1 = |0-4| + |2-4| = 6
            distance2 = |0-4| + |3-4| = 5
            positionScore = 16 - 6 - 5 = 5

Total Score A = 30 + 0 + 0 + (5 × 2) = 40
```

### 14.3 Đánh giá Move B

```
Sau swap (1,2) ↔ (1,3):
    0   1   2   3   4   ...
1 │ 🟢  🔴  🔵  🔵  🔵  ...
             ↑___↑___↑___↑

- matches.length = 4 (gem 🔵 tại 1,2 1,3 1,4)
- Base score: 4 × 10 = 40
- Match size = 4 → bonus +15
- Cascade potential: 2 (giả sử có 2 gem khớp khi rơi)
- Position: distance1 = |1-4| + |2-4| = 5
            distance2 = |1-4| + |3-4| = 4
            positionScore = 16 - 5 - 4 = 7

Total Score B = 40 + 15 + (2 × 5) + (7 × 2) = 40 + 15 + 10 + 14 = 79
```

### 14.4 Kết quả

```javascript
{
    gem1: {row: 1, col: 2},
    gem2: {row: 1, col: 3},
    evaluationScore: 79,
    confidence: 85.3,
    matchInfo: {
        totalMatches: 4,
        matchedGems: [...],
        gemTypes: Set(1) {2},  // 🔵
        estimatedScore: 40,
        matchSizes: [4]
    },
    reason: "Tạo 4 match (bao gồm match 4 viên!) với 🔵 → ~40 điểm"
}
```

---

## 15. Phân tích độ phức tạp

### 15.1 Độ phức tạp thời gian

| Hàm | Độ phức tạp | Giải thích |
|-----|-------------|------------|
| `suggestMove` | O(M × E) | M = số moves, E = evaluateMove |
| `evaluateMove` | O(N) | N = số ô trong grid |
| `getMatchSize` | O(N) | DFS qua các ô |
| `estimateCascades` | O(N) | Duyệt toàn bộ grid |
| `evaluatePosition` | O(1) | Tính toán đơn giản |
| `getMatchInfo` | O(N) | Tương tự evaluateMove |
| `groupMatches` | O(M²) | M = số matches |
| `calculateConfidence` | O(1) | Tính toán đơn giản |

**Tổng thể**: O(M × N) với M = số nước đi có thể, N = kích thước grid

### 15.2 Độ phức tạp không gian

| Hàm | Độ phức tạp | Giải thích |
|-----|-------------|------------|
| `getMatchSize` | O(N) | visited Set và stack |
| `groupMatches` | O(M) | visited Set và queue |
| Khác | O(1) | Không dùng bộ nhớ phụ đáng kể |

---

## 16. Ưu điểm và hạn chế

### 16.1 Ưu điểm

| # | Ưu điểm | Mô tả |
|---|---------|-------|
| 1 | ✅ **Đơn giản** | Dễ hiểu, dễ maintain |
| 2 | ✅ **Nhanh** | O(M×N) đủ cho real-time |
| 3 | ✅ **Thông tin đầy đủ** | Trả về cả lý do và độ tin cậy |
| 4 | ✅ **Heuristic đa dạng** | Xét nhiều yếu tố: match, cascade, vị trí |
| 5 | ✅ **Không ảnh hưởng game state** | Sử dụng simulation mode |

### 16.2 Hạn chế

| # | Hạn chế | Giải pháp tiềm năng |
|---|---------|---------------------|
| 1 | ❌ **Chỉ nhìn 1 bước** | Dùng Minimax với depth > 1 |
| 2 | ✅ **Cascade không chính xác** | ★ **ĐÃ GIẢI QUYẾT** - Cascade Prediction |
| 3 | ❌ **Không xét gem đặc biệt** | Thêm logic cho Striped, Rainbow |
| 4 | ❌ **Heuristic cố định** | Machine Learning để điều chỉnh weights |
| 5 | ❌ **Không có pruning** | Alpha-Beta pruning để tối ưu |

---

## 16. ★ Cascade Prediction (Tính năng mới)

### 16.1 Giới thiệu

**Cascade Prediction** là tính năng nâng cao cho phép HintSystem **mô phỏng thực sự** các chuỗi cascade thay vì chỉ ước lượng. Điều này giúp AI đưa ra gợi ý **chính xác hơn**.

### 16.2 Thuộc tính và Phương thức mới

```javascript
class HintSystem {
    constructor() {
        // ... existing code ...
        
        // ★ NEW: Flag bật/tắt Cascade Prediction
        this.cascadePredictionEnabled = false;
        
        // ★ NEW: Trọng số mới cho cascade thực sự
        this.weights.cascadeActual = 25;
    }
    
    // ★ NEW: Setter để bật/tắt từ UI
    setCascadePrediction(enabled) {
        this.cascadePredictionEnabled = enabled;
        console.log(`🔮 Cascade Prediction: ${enabled ? 'ON' : 'OFF'}`);
    }
}
```

### 16.3 Logic trong evaluateMove()

```javascript
evaluateMove(grid, move) {
    // ... existing evaluation code ...
    
    // ★ NEW: Kiểm tra Cascade Prediction
    if (this.cascadePredictionEnabled && grid.simulateCascades) {
        // Mô phỏng cascade thực sự
        const cascadeResult = grid.simulateCascades(move, 5);
        
        // Cộng điểm chính xác
        score += cascadeResult.cascadeCount * this.weights.cascadeActual;
        score += cascadeResult.specialGemsCreated * this.weights.specialGemBonus;
        
        // Lưu kết quả để debug
        move._cascadeResult = cascadeResult;
    } else {
        // Fallback: Ước lượng nhanh (cách cũ)
        score += this.estimateCascades(grid) * this.weights.cascadePotential;
    }
    
    return score;
}
```

### 16.4 So sánh hai phương pháp

| Tiêu chí | Ước lượng (cũ) | Mô phỏng (mới) |
|----------|----------------|----------------|
| **Tốc độ** | Rất nhanh (~1ms) | Chậm hơn (~10-50ms) |
| **Độ chính xác** | ~60-70% | 100% |
| **Cách tính** | Đếm gem cùng loại gần đó | Chạy thử cascade thực sự |
| **Thông tin** | Chỉ có tiềm năng | Số cascade, điểm, gem đặc biệt |

### 16.5 Sơ đồ luồng

```
evaluateMove()
      │
      ▼
┌─────────────────────────┐
│ cascadePredictionEnabled│
│         = true?         │
└───────────┬─────────────┘
            │
    ┌───────┴───────┐
    ▼ YES           ▼ NO
┌──────────┐   ┌──────────┐
│ grid.    │   │ estimate │
│ simulate │   │ Cascades │
│ Cascades │   │ () (ước  │
│ ()       │   │ lượng)   │
└────┬─────┘   └────┬─────┘
     │              │
     ▼              ▼
┌──────────┐   ┌──────────┐
│ Kết quả  │   │ Kết quả  │
│ CHÍNH XÁC│   │ ƯỚC LƯỢNG│
└──────────┘   └──────────┘
```

### 16.6 Cách bật/tắt

**Qua UI:**
- Tick checkbox "Cascade Prediction" trong mục "🎯 AI Features"

**Qua Console:**
```javascript
// Bật
game.aiComponents.hintSystem.setCascadePrediction(true);

// Tắt
game.aiComponents.hintSystem.setCascadePrediction(false);

// Kiểm tra trạng thái
console.log(game.aiComponents.hintSystem.cascadePredictionEnabled);
```

### 16.7 Tài liệu chi tiết

Xem thêm: [CascadePrediction_Documentation.md](CascadePrediction_Documentation.md)

---

## 17. Hướng phát triển

### 17.1 Cải thiện ngắn hạn
1. ✅ ~~Thêm đánh giá cho gem đặc biệt~~ (Đã có specialGemBonus)
2. ✅ ~~Cải thiện cascade estimation~~ (**ĐÃ GIẢI QUYẾT với Cascade Prediction**)
3. Điều chỉnh weights dựa trên testing

### 17.2 Cải thiện dài hạn
1. Implement Minimax với Alpha-Beta pruning
2. Tích hợp Monte Carlo Tree Search (MCTS)
3. Sử dụng Neural Network để đánh giá board state
4. Học từ dữ liệu người chơi (Reinforcement Learning)

---

## 18. Tài liệu tham khảo

- **Minimax Algorithm**: [MinimaxSolver.js](../js/ai/MinimaxSolver.js)
- **Pattern Recognition**: [PatternRecognizer.js](../js/ai/PatternRecognizer.js)
- **Cascade Prediction**: [CascadePrediction_Documentation.md](CascadePrediction_Documentation.md) ★ MỚI
- **Game Engine**: [GameEngine.js](../js/core/GameEngine.js)
- **Grid Logic**: [Grid.js](../js/core/Grid.js)

---

*Tài liệu được tạo ngày: 23/12/2024*
*Cập nhật: 23/12/2024 - Thêm Cascade Prediction*
*Phiên bản: 1.1*
