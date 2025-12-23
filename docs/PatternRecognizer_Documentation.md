# Pattern Recognizer - Tài Liệu Chi Tiết

## Mục Lục
1. [Tổng Quan](#1-tổng-quan)
2. [Kiến Trúc Class](#2-kiến-trúc-class)
3. [Hệ Thống Pattern Cơ Bản](#3-hệ-thống-pattern-cơ-bản)
4. [Thuật Toán Xoay Ma Trận](#4-thuật-toán-xoay-ma-trận)
5. [Thuật Toán Nhận Diện Pattern](#5-thuật-toán-nhận-diện-pattern)
6. [Phân Tích Board và Đề Xuất](#6-phân-tích-board-và-đề-xuất)
7. [Hệ Thống Training (Machine Learning)](#7-hệ-thống-training-machine-learning)
8. [Export/Import Patterns](#8-exportimport-patterns)
9. [Ví Dụ Minh Họa](#9-ví-dụ-minh-họa)
10. [So Sánh với HintSystem và MinimaxSolver](#10-so-sánh-với-hintsystem-và-minimaxsolver)

---

## 1. Tổng Quan

### 1.1. Pattern Recognizer là gì?

**Pattern Recognizer** là module AI sử dụng **Template Matching** để nhận diện các pattern (mẫu hình) chiến lược trên bàn chơi Match-3. Module này phân tích board để tìm các hình dạng đặc biệt có thể tạo ra gem đặc biệt hoặc combo lớn.

### 1.2. Mục đích sử dụng

```
┌─────────────────────────────────────────────────────────────────┐
│                    PATTERN RECOGNIZER                           │
├─────────────────────────────────────────────────────────────────┤
│  Input: Game Board (Grid)                                       │
│                                                                 │
│  Process:                                                       │
│  1. Duyệt từng vị trí trên board                               │
│  2. So khớp với tất cả pattern đã định nghĩa                   │
│  3. Xét cả 4 hướng xoay của mỗi pattern                        │
│  4. Tính điểm dựa trên giá trị pattern                         │
│                                                                 │
│  Output: Danh sách patterns được nhận diện + điểm              │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3. Đặc điểm chính

| Đặc điểm | Mô tả |
|----------|-------|
| **Thuật toán** | Template Matching với xoay ma trận |
| **Patterns** | 10 pattern cơ bản (có thể mở rộng) |
| **Xoay** | 4 hướng (0°, 90°, 180°, 270°) |
| **Training** | Hỗ trợ học từ game data |
| **Export/Import** | Lưu trữ và chia sẻ patterns |

---

## 2. Kiến Trúc Class

### 2.1. Sơ đồ Class

```
┌─────────────────────────────────────────────────────────────────┐
│                     PatternRecognizer                           │
├─────────────────────────────────────────────────────────────────┤
│ Properties:                                                     │
│   - patterns: Map<string, PatternData>                          │
│   - trainingData: Array<GameData>                               │
│   - weights: Object (cho ML)                                    │
├─────────────────────────────────────────────────────────────────┤
│ Methods:                                                        │
│   + initializePatterns()                                        │
│   + addPattern(name, matrix, value)                             │
│   + generateRotations(matrix)                                   │
│   + rotateMatrix90(matrix)                                      │
│   + recognizePatterns(grid)                                     │
│   + findPatternsAt(grid, row, col)                             │
│   + matchPattern(grid, startRow, startCol, pattern)            │
│   + analyzeBoard(grid)                                          │
│   + train(gameData)                                             │
│   + exportPatterns() / importPatterns()                         │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2. Cấu trúc dữ liệu Pattern

```javascript
PatternData = {
    matrix: number[][],      // Ma trận 2D định nghĩa pattern
    value: number,           // Điểm giá trị của pattern
    rotations: number[][][]  // Mảng 4 ma trận xoay
}

// Ví dụ T-shape pattern
{
    matrix: [
        [0, 1, 0],
        [1, 1, 1]
    ],
    value: 50,
    rotations: [
        [[0,1,0], [1,1,1]],      // 0°
        [[1,0], [1,1], [1,0]],    // 90°
        [[1,1,1], [0,1,0]],       // 180°
        [[0,1], [1,1], [0,1]]     // 270°
    ]
}
```

---

## 3. Hệ Thống Pattern Cơ Bản

### 3.1. Danh sách Pattern và Giá Trị

| Pattern | Ma trận | Value | Mô tả |
|---------|---------|-------|-------|
| `horizontal_3` | `[1,1,1]` | 10 | Match 3 ngang cơ bản |
| `vertical_3` | `[[1],[1],[1]]` | 10 | Match 3 dọc cơ bản |
| `horizontal_4` | `[1,1,1,1]` | 25 | Match 4 ngang → Line gem |
| `vertical_4` | `[[1],[1],[1],[1]]` | 25 | Match 4 dọc → Line gem |
| `t_shape_1` | T ngang | 50 | T-shape → Special gem |
| `t_shape_2` | T dọc | 50 | T-shape → Special gem |
| `l_shape_1` | L dọc | 30 | L-shape → Tiềm năng combo |
| `l_shape_2` | L ngang | 30 | L-shape → Tiềm năng combo |
| `cross` | Hình chữ thập | 75 | Cross → Bomb gem |
| `square_2x2` | Vuông 2x2 | 40 | Square → Special gem |

### 3.2. Minh họa các Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│ HORIZONTAL_3 (10 điểm)    │ VERTICAL_3 (10 điểm)               │
│ ● ● ●                     │ ●                                  │
│                           │ ●                                  │
│                           │ ●                                  │
├─────────────────────────────────────────────────────────────────┤
│ HORIZONTAL_4 (25 điểm)    │ VERTICAL_4 (25 điểm)               │
│ ● ● ● ●                   │ ●                                  │
│                           │ ●                                  │
│                           │ ●                                  │
│                           │ ●                                  │
├─────────────────────────────────────────────────────────────────┤
│ T_SHAPE_1 (50 điểm)       │ T_SHAPE_2 (50 điểm)                │
│   ●                       │ ●                                  │
│ ● ● ●                     │ ● ●                                │
│                           │ ●                                  │
├─────────────────────────────────────────────────────────────────┤
│ L_SHAPE_1 (30 điểm)       │ L_SHAPE_2 (30 điểm)                │
│ ● ●                       │ ● ● ●                              │
│ ●                         │ ●                                  │
│ ●                         │                                    │
├─────────────────────────────────────────────────────────────────┤
│ CROSS (75 điểm)           │ SQUARE_2x2 (40 điểm)               │
│   ●                       │ ● ●                                │
│ ● ● ●                     │ ● ●                                │
│   ●                       │                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3. Công thức tính điểm Pattern

```
Pattern Value được xác định dựa trên:
1. Số gem trong pattern (nhiều hơn = giá trị cao hơn)
2. Khả năng tạo gem đặc biệt
3. Tiềm năng cascade/combo

Bảng giá trị:
┌─────────────────┬───────┬────────────────────────────┐
│ Loại Pattern    │ Value │ Lý do                      │
├─────────────────┼───────┼────────────────────────────┤
│ Match 3         │ 10    │ Cơ bản, không tạo special  │
│ Match 4         │ 25    │ Tạo Line gem               │
│ L-shape         │ 30    │ Tiềm năng mở rộng          │
│ Square 2x2      │ 40    │ Có thể tạo special         │
│ T-shape         │ 50    │ Tạo gem đặc biệt           │
│ Cross           │ 75    │ Tạo Bomb gem (mạnh nhất)   │
└─────────────────┴───────┴────────────────────────────┘
```

---

## 4. Thuật Toán Xoay Ma Trận

### 4.1. Nguyên lý xoay 90° theo chiều kim đồng hồ

```
Công thức: rotated[j][rows - 1 - i] = original[i][j]

Với:
- i: chỉ số hàng gốc
- j: chỉ số cột gốc
- rows: số hàng của ma trận gốc
```

### 4.2. Ví dụ xoay T-shape

```
ORIGINAL (0°):          ROTATE 90°:
  ●                     ●
● ● ●                   ● ●
                        ●

Matrix:                 Matrix:
[0, 1, 0]              [1, 0]
[1, 1, 1]              [1, 1]
                       [1, 0]

ROTATE 180°:            ROTATE 270°:
● ● ●                     ●
  ●                     ● ●
                          ●

Matrix:                 Matrix:
[1, 1, 1]              [0, 1]
[0, 1, 0]              [1, 1]
                       [0, 1]
```

### 4.3. Code xoay ma trận

```javascript
rotateMatrix90(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    
    // Ma trận mới có kích thước cols × rows (đảo ngược)
    const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            // Công thức xoay 90° theo chiều kim đồng hồ
            rotated[j][rows - 1 - i] = matrix[i][j];
        }
    }
    
    return rotated;
}
```

### 4.4. Tại sao cần 4 hướng xoay?

```
Lý do: Cùng một pattern có thể xuất hiện ở nhiều hướng khác nhau

Ví dụ L-shape trên board:

Hướng 1:    Hướng 2:    Hướng 3:    Hướng 4:
● ●           ●         ●           ● ●
●           ● ●         ●             ●
●             ●         ● ●           ●

→ Tất cả đều là L-shape, cần nhận diện được cả 4 hướng
```

---

## 5. Thuật Toán Nhận Diện Pattern

### 5.1. Tổng quan quy trình

```
┌─────────────────────────────────────────────────────────────────┐
│                    PATTERN RECOGNITION FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐                                           │
│  │ recognizePatterns│                                          │
│  └────────┬────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────────────────────────┐                       │
│  │ FOR each position (row, col)         │                      │
│  │   ┌─────────────────────────────┐   │                       │
│  │   │ findPatternsAt(row, col)     │   │                      │
│  │   │   ┌─────────────────────┐   │   │                       │
│  │   │   │ FOR each pattern     │   │   │                       │
│  │   │   │   FOR each rotation  │   │   │                       │
│  │   │   │     matchPattern()   │   │   │                       │
│  │   │   └─────────────────────┘   │   │                       │
│  │   └─────────────────────────────┘   │                       │
│  └─────────────────────────────────────┘                       │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────────────────────────┐                       │
│  │ deduplicateAndSort()                 │                      │
│  │ (Loại bỏ trùng lặp, sắp xếp value)  │                       │
│  └─────────────────────────────────────┘                       │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                           │
│  │ Return patterns  │                                          │
│  └─────────────────┘                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2. Thuật toán matchPattern (Template Matching)

```javascript
matchPattern(grid, startRow, startCol, pattern) {
    // 1. Kiểm tra pattern có vừa trong board không
    if (startRow + patternRows > gridRows) return null;
    if (startCol + patternCols > gridCols) return null;
    
    // 2. Duyệt từng ô trong pattern
    for (pRow = 0; pRow < patternRows; pRow++) {
        for (pCol = 0; pCol < patternCols; pCol++) {
            gridRow = startRow + pRow;
            gridCol = startCol + pCol;
            gem = grid[gridRow][gridCol];
            
            // 3. Nếu pattern yêu cầu gem (value = 1)
            if (pattern[pRow][pCol] === 1) {
                // Phải có gem tại vị trí
                if (!gem) return null;
                
                // Tất cả gem phải cùng type
                if (referenceType === null) {
                    referenceType = gem.type;
                } else if (gem.type !== referenceType) {
                    return null;
                }
                
                matchedGems.push({row, col, gem});
            }
        }
    }
    
    // 4. Tính confidence và trả về kết quả
    confidence = matchCount / totalPositions;
    return { gems, confidence, type };
}
```

### 5.3. Độ phức tạp

```
Độ phức tạp tổng thể:
O(R × C × P × 4 × Pm × Pn)

Với:
- R × C: Kích thước grid (8×8 = 64)
- P: Số patterns (10)
- 4: Số hướng xoay
- Pm × Pn: Kích thước trung bình pattern (≈3×3 = 9)

Ước tính: 64 × 10 × 4 × 9 = 23,040 phép so sánh
→ Vẫn rất nhanh (< 1ms)
```

---

## 6. Phân Tích Board và Đề Xuất

### 6.1. Hàm analyzeBoard

```
┌─────────────────────────────────────────────────────────────────┐
│                    analyzeBoard(grid)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BƯỚC 1: Nhận diện patterns hiện có                            │
│  patterns = recognizePatterns(grid)                             │
│                                                                 │
│  BƯỚC 2: Với mỗi pattern tìm được                              │
│  FOR each pattern:                                              │
│      moves = findMovesToActivatePattern(grid, pattern)          │
│      suggestions.push(...moves)                                 │
│                                                                 │
│  BƯỚC 3: Tìm tiềm năng pattern sau khi move                    │
│  FOR each possibleMove:                                         │
│      patternValue = evaluateMoveForPatterns(grid, move)         │
│      IF patternValue > 20:                                      │
│          suggestions.push({move, patternValue})                 │
│                                                                 │
│  BƯỚC 4: Sắp xếp theo giá trị và trả về                        │
│  return suggestions.sort(by patternValue DESC)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2. Đánh giá nước đi theo Pattern

```javascript
evaluateMoveForPatterns(grid, move) {
    // 1. Thực hiện swap tạm thời
    grid.swapGems(gem1, gem2);
    
    // 2. Nhận diện patterns sau khi swap
    patternsAfter = recognizePatterns(grid);
    
    // 3. Tính tổng giá trị tất cả patterns
    totalValue = patternsAfter.reduce((sum, p) => sum + p.value, 0);
    
    // 4. Hoàn tác swap
    grid.swapGems(gem1, gem2);
    
    return totalValue;
}
```

### 6.3. Tìm nước đi gần Pattern

```
Thuật toán: Dùng Manhattan Distance

Điều kiện: distance ≤ 2 (trong phạm vi 2 ô)

distance = |move.gem.row - pattern.gem.row| 
         + |move.gem.col - pattern.gem.col|

Ví dụ:
┌───┬───┬───┬───┬───┐
│   │ 2 │ 1 │ 2 │   │
├───┼───┼───┼───┼───┤
│ 2 │ 1 │ P │ 1 │ 2 │  P = Pattern gem
├───┼───┼───┼───┼───┤  Số = Manhattan Distance
│   │ 2 │ 1 │ 2 │   │
└───┴───┴───┴───┴───┘

→ Các ô có distance ≤ 2 được xem xét
```

---

## 7. Hệ Thống Training (Machine Learning)

### 7.1. Cơ chế học đơn giản

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRAINING FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input: gameData = {                                            │
│      successful: boolean,    // Nước đi có thành công không    │
│      patternsUsed: string[]  // Các pattern đã sử dụng         │
│  }                                                              │
│                                                                 │
│  Process:                                                       │
│  IF gameData.successful:                                        │
│      FOR each pattern in patternsUsed:                          │
│          pattern.value += 1  // Tăng giá trị pattern           │
│                                                                 │
│  trainingData.push(gameData) // Lưu để phân tích sau           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2. Ý tưởng mở rộng ML

```
Hiện tại: Simple Reinforcement (tăng value khi thành công)

Có thể mở rộng:
1. Neural Network để học pattern mới
2. Q-Learning để tối ưu value
3. Genetic Algorithm để evolve patterns
4. Clustering để nhóm patterns tương tự
```

### 7.3. Cấu trúc Training Data

```javascript
trainingData = [
    {
        board: Grid,           // Trạng thái board
        move: Move,            // Nước đi đã thực hiện
        patternsUsed: ['t_shape_1', 'horizontal_4'],
        successful: true,      // Có tạo được match không
        score: 150,            // Điểm đạt được
        cascades: 3            // Số cascade
    },
    // ... more training samples
]
```

---

## 8. Export/Import Patterns

### 8.1. Export Patterns

```javascript
exportPatterns() {
    const exported = {};
    
    patterns.forEach((pattern, name) => {
        exported[name] = {
            matrix: pattern.matrix,
            value: pattern.value
        };
    });
    
    return JSON.stringify(exported, null, 2);
}

// Output:
{
    "horizontal_3": {
        "matrix": [[1, 1, 1]],
        "value": 10
    },
    "t_shape_1": {
        "matrix": [[0, 1, 0], [1, 1, 1]],
        "value": 50
    }
    // ...
}
```

### 8.2. Import Patterns

```javascript
importPatterns(patternsJson) {
    const imported = JSON.parse(patternsJson);
    
    Object.entries(imported).forEach(([name, data]) => {
        this.addPattern(name, data.matrix, data.value);
    });
}

// Tự động:
// 1. Parse JSON
// 2. Tạo pattern mới
// 3. Generate 4 rotations
// 4. Thêm vào Map
```

### 8.3. Use Case

```
1. Chia sẻ patterns giữa các phiên bản game
2. Backup/Restore pattern data
3. A/B Testing với different pattern values
4. Community sharing patterns
```

---

## 9. Ví Dụ Minh Họa

### 9.1. Nhận diện T-shape trên board

```
Board 5x5:
┌───┬───┬───┬───┬───┐
│ R │ G │ B │ R │ Y │
├───┼───┼───┼───┼───┤
│ G │ R │ G │ B │ G │
├───┼───┼───┼───┼───┤
│ B │ R │ R │ R │ B │  ← T-shape tại (1,1)
├───┼───┼───┼───┼───┤
│ Y │ G │ B │ Y │ R │
├───┼───┼───┼───┼───┤
│ R │ B │ G │ R │ Y │
└───┴───┴───┴───┴───┘

T-shape detected:
    R       (row=1, col=1)
  R R R     (row=2, col=0-2)

Result:
{
    name: 't_shape_2',
    rotation: 0,
    position: { row: 1, col: 1 },
    value: 50,
    gems: [
        {row: 1, col: 1, type: 'R'},
        {row: 2, col: 0, type: 'R'},
        {row: 2, col: 1, type: 'R'},
        {row: 2, col: 2, type: 'R'}
    ],
    confidence: 1.0
}
```

### 9.2. Phân tích board với analyzeBoard

```javascript
// Input
const grid = game.grid;

// Process
const suggestions = patternRecognizer.analyzeBoard(grid);

// Output
[
    {
        move: { gem1: {row:0,col:2}, gem2: {row:0,col:3} },
        patternValue: 75,
        type: 'activate_pattern',
        pattern: 'cross'
    },
    {
        move: { gem1: {row:1,col:1}, gem2: {row:2,col:1} },
        patternValue: 50,
        type: 'potential_pattern'
    },
    // ... sorted by patternValue DESC
]
```

---

## 10. So Sánh với HintSystem và MinimaxSolver

### 10.1. Bảng so sánh

| Tiêu chí | PatternRecognizer | HintSystem | MinimaxSolver |
|----------|-------------------|------------|---------------|
| **Thuật toán** | Template Matching | Greedy Search | Minimax + Alpha-Beta |
| **Độ phức tạp** | O(R×C×P×4×Pm×Pn) | O(M×N) | O(b^(d/2)) |
| **Nhìn trước** | 0 bước (hiện tại) | 1 bước | 3 bước |
| **Output** | Pattern list | Best move | Best move |
| **Học hỏi** | Có (training) | Không | Không |
| **Tốc độ** | Rất nhanh | Nhanh | Trung bình |

### 10.2. Khi nào dùng tool nào?

```
PatternRecognizer:
✓ Nhận diện các hình dạng chiến lược
✓ Phân tích board để tìm tiềm năng
✓ Training và cải thiện theo thời gian

HintSystem:
✓ Gợi ý nhanh cho người chơi
✓ Tính toán đơn giản, real-time
✓ Primary AI hint

MinimaxSolver:
✓ Tìm nước đi tối ưu
✓ Auto-solve (fallback)
✓ Phân tích sâu game tree
```

### 10.3. Tích hợp 3 modules

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI SYSTEM INTEGRATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Request: "Show Hint" / "Auto Solve"                      │
│                     │                                           │
│                     ▼                                           │
│  ┌─────────────────────────────────────┐                       │
│  │     PatternRecognizer.analyzeBoard   │                      │
│  │     (Nhận diện patterns hiện có)     │                      │
│  └──────────────────┬──────────────────┘                       │
│                     │                                           │
│                     ▼                                           │
│  ┌─────────────────────────────────────┐                       │
│  │     HintSystem.suggestMove           │ ← Primary            │
│  │     (Kết hợp pattern info)           │                      │
│  └──────────────────┬──────────────────┘                       │
│                     │                                           │
│            (Nếu HintSystem fail)                               │
│                     │                                           │
│                     ▼                                           │
│  ┌─────────────────────────────────────┐                       │
│  │     MinimaxSolver.findBestMove       │ ← Fallback           │
│  │     (Tìm kiếm sâu với game tree)     │                      │
│  └──────────────────┬──────────────────┘                       │
│                     │                                           │
│                     ▼                                           │
│              Return Best Move                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Kết Luận

**Pattern Recognizer** là module quan trọng trong hệ thống AI Match-3:

1. **Template Matching**: Nhận diện patterns bằng so khớp ma trận
2. **Multi-rotation**: Xét 4 hướng xoay của mỗi pattern
3. **Value-based**: Ưu tiên patterns có giá trị cao
4. **Trainable**: Có thể học và cải thiện theo thời gian
5. **Exportable**: Dễ dàng chia sẻ và backup patterns

Module này bổ trợ cho HintSystem và MinimaxSolver, cung cấp thông tin chi tiết về cấu trúc board để đưa ra gợi ý chính xác hơn.

---

## Tài liệu tham khảo

- **HintSystem**: [HintSystem_Documentation.md](./HintSystem_Documentation.md)
- **MinimaxSolver**: [MinimaxSolver_Documentation.md](./MinimaxSolver_Documentation.md)
- **Cascade Prediction**: [CascadePrediction_Documentation.md](./CascadePrediction_Documentation.md) ★ MỚI
- **Báo cáo tổng hợp**: [BaoCao_DiamondCrushAI.md](./BaoCao_DiamondCrushAI.md)

---

*Tài liệu được tạo ngày: 23/12/2024*
*Cập nhật: 23/12/2024 - Thêm tham chiếu tài liệu liên quan*
*Phiên bản: 1.1*
