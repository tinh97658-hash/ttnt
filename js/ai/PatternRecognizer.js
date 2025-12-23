/**
 * ============================================================================
 * PATTERN RECOGNIZER - NHẬN DIỆN MẪU HÌNH BẰNG TEMPLATE MATCHING
 * ============================================================================
 * 
 * MỤC ĐÍCH:
 * - Nhận diện các pattern (mẫu hình) chiến lược trên bàn chơi
 * - Sử dụng Template Matching để so khớp ma trận
 * - Hỗ trợ Machine Learning để học và cải thiện
 * 
 * THUẬT TOÁN CHÍNH:
 * - Template Matching: So khớp ma trận pattern với board
 * - Matrix Rotation: Xoay pattern 4 hướng (0°, 90°, 180°, 270°)
 * - Deduplication: Loại bỏ pattern trùng lặp
 * 
 * CÁC PATTERN CƠ BẢN:
 * - Match 3/4: Horizontal và Vertical (10-25 điểm)
 * - T-shape: Tạo gem đặc biệt (50 điểm)
 * - L-shape: Tiềm năng combo (30 điểm)
 * - Cross: Tạo Bomb gem (75 điểm - cao nhất)
 * - Square 2x2: Pattern đặc biệt (40 điểm)
 * 
 * ============================================================================
 */
class PatternRecognizer {
    /**
     * KHỞI TẠO PATTERN RECOGNIZER
     * 
     * Các thuộc tính:
     * - patterns: Map lưu trữ tất cả patterns
     * - trainingData: Dữ liệu huấn luyện cho ML
     * - weights: Trọng số cho ML (dự phòng)
     */
    constructor() {
        /**
         * BẢN ĐỒ PATTERNS
         * Key: tên pattern (string)
         * Value: { matrix, value, rotations }
         */
        this.patterns = new Map();
        
        /**
         * DỮ LIỆU HUẤN LUYỆN
         * Lưu trữ kết quả game để học hỏi
         */
        this.trainingData = [];
        
        /**
         * TRỌNG SỐ ML (Dự phòng cho tính năng sau)
         */
        this.weights = null;
        
        // Khởi tạo các pattern cơ bản
        this.initializePatterns();
    }
    
    /**
     * ============================================================================
     * KHỞI TẠO CÁC PATTERN CƠ BẢN
     * ============================================================================
     * 
     * BẢNG GIÁ TRỊ PATTERN:
     * ┌─────────────────┬───────┬────────────────────────────┐
     * │ Loại Pattern    │ Value │ Lý do                      │
     * ├─────────────────┼───────┼────────────────────────────┤
     * │ Match 3         │ 10    │ Cơ bản, không tạo special  │
     * │ Match 4         │ 25    │ Tạo Line gem               │
     * │ L-shape         │ 30    │ Tiềm năng mở rộng          │
     * │ Square 2x2      │ 40    │ Có thể tạo special         │
     * │ T-shape         │ 50    │ Tạo gem đặc biệt           │
     * │ Cross           │ 75    │ Tạo Bomb gem (mạnh nhất)   │
     * └─────────────────┴───────┴────────────────────────────┘
     * 
     * MA TRẬN PATTERN:
     * - 1 = Vị trí cần có gem (cùng loại)
     * - 0 = Vị trí bỏ qua (có thể có hoặc không)
     */
    initializePatterns() {
        /**
         * PATTERN MATCH 3 NGANG
         * Hình dạng: ● ● ●
         * Giá trị: 10 (cơ bản nhất)
         */
        this.addPattern('horizontal_3', [
            [1, 1, 1]
        ], 10);
        
        /**
         * PATTERN MATCH 3 DỌC
         * Hình dạng: ●
         *            ●
         *            ●
         * Giá trị: 10 (cơ bản nhất)
         */
        this.addPattern('vertical_3', [
            [1],
            [1],
            [1]
        ], 10);
        
        /**
         * PATTERN MATCH 4 NGANG
         * Hình dạng: ● ● ● ●
         * Giá trị: 25 (tạo Line gem ngang)
         */
        this.addPattern('horizontal_4', [
            [1, 1, 1, 1]
        ], 25);
        
        /**
         * PATTERN MATCH 4 DỌC
         * Hình dạng: ●
         *            ●
         *            ●
         *            ●
         * Giá trị: 25 (tạo Line gem dọc)
         */
        this.addPattern('vertical_4', [
            [1],
            [1],
            [1],
            [1]
        ], 25);
        
        /**
         * PATTERN T-SHAPE LOẠI 1 (Ngang)
         * Hình dạng:   ●
         *            ● ● ●
         * Giá trị: 50 (tạo gem đặc biệt)
         */
        this.addPattern('t_shape_1', [
            [0, 1, 0],
            [1, 1, 1]
        ], 50);
        
        /**
         * PATTERN T-SHAPE LOẠI 2 (Dọc)
         * Hình dạng: ●
         *            ● ●
         *            ●
         * Giá trị: 50 (tạo gem đặc biệt)
         */
        this.addPattern('t_shape_2', [
            [1, 0],
            [1, 1],
            [1, 0]
        ], 50);
        
        /**
         * PATTERN L-SHAPE LOẠI 1 (Dọc)
         * Hình dạng: ● ●
         *            ●
         *            ●
         * Giá trị: 30 (tiềm năng mở rộng)
         */
        this.addPattern('l_shape_1', [
            [1, 1],
            [1, 0],
            [1, 0]
        ], 30);
        
        /**
         * PATTERN L-SHAPE LOẠI 2 (Ngang)
         * Hình dạng: ● ● ●
         *            ●
         * Giá trị: 30 (tiềm năng mở rộng)
         */
        this.addPattern('l_shape_2', [
            [1, 1, 1],
            [1, 0, 0]
        ], 30);
        
        /**
         * PATTERN CROSS (Chữ thập)
         * Hình dạng:   ●
         *            ● ● ●
         *              ●
         * Giá trị: 75 (CAO NHẤT - tạo Bomb gem)
         */
        this.addPattern('cross', [
            [0, 1, 0],
            [1, 1, 1],
            [0, 1, 0]
        ], 75);
        
        /**
         * PATTERN SQUARE 2x2
         * Hình dạng: ● ●
         *            ● ●
         * Giá trị: 40 (pattern đặc biệt)
         */
        this.addPattern('square_2x2', [
            [1, 1],
            [1, 1]
        ], 40);
        
        console.log(`Đã khởi tạo ${this.patterns.size} patterns cơ bản`);
    }
    
    /**
     * ============================================================================
     * THÊM PATTERN VÀO HỆ THỐNG
     * ============================================================================
     * 
     * @param {string} name - Tên định danh pattern
     * @param {number[][]} matrix - Ma trận 2D định nghĩa pattern
     * @param {number} value - Điểm giá trị của pattern
     * 
     * TỰ ĐỘNG:
     * - Tạo 4 phiên bản xoay (0°, 90°, 180°, 270°)
     * - Lưu vào Map với key là tên
     */
    addPattern(name, matrix, value) {
        this.patterns.set(name, {
            matrix: matrix,           // Ma trận gốc
            value: value,             // Điểm giá trị
            rotations: this.generateRotations(matrix)  // 4 hướng xoay
        });
    }
    
    /**
     * ============================================================================
     * TẠO TẤT CẢ CÁC PHIÊN BẢN XOAY CỦA PATTERN
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Tạo 4 phiên bản của pattern ở các góc 0°, 90°, 180°, 270°
     * để có thể nhận diện pattern ở mọi hướng
     * 
     * VÍ DỤ VỚI T-SHAPE:
     * 0°:     90°:    180°:   270°:
     *   ●     ●         ● ● ●     ●
     * ● ● ●   ● ●         ●     ● ●
     *         ●                   ●
     * 
     * @param {number[][]} matrix - Ma trận gốc
     * @returns {number[][][]} - Mảng 4 ma trận xoay
     */
    generateRotations(matrix) {
        const rotations = [matrix];  // Bắt đầu với ma trận gốc (0°)
        let current = matrix;
        
        // Tạo 3 phiên bản xoay còn lại (90°, 180°, 270°)
        for (let i = 0; i < 3; i++) {
            current = this.rotateMatrix90(current);
            rotations.push(current);
        }
        
        return rotations;
    }
    
    /**
     * ============================================================================
     * XOAY MA TRẬN 90° THEO CHIỀU KIM ĐỒNG HỒ
     * ============================================================================
     * 
     * CÔNG THỨC TOÁN HỌC:
     * rotated[j][rows - 1 - i] = original[i][j]
     * 
     * GIẢI THÍCH:
     * - Cột j của ma trận gốc → Hàng j của ma trận mới
     * - Hàng i của ma trận gốc → Cột (rows-1-i) của ma trận mới
     * - Kích thước đảo ngược: rows×cols → cols×rows
     * 
     * VÍ DỤ:
     * Original (2×3):    Rotated (3×2):
     * [1, 2, 3]          [4, 1]
     * [4, 5, 6]    →     [5, 2]
     *                    [6, 3]
     * 
     * @param {number[][]} matrix - Ma trận cần xoay
     * @returns {number[][]} - Ma trận đã xoay 90°
     */
    rotateMatrix90(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        
        // Ma trận mới có kích thước cols × rows (đảo ngược)
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        // Áp dụng công thức xoay
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }
        
        return rotated;
    }
    
    /**
     * ============================================================================
     * NHẬN DIỆN TẤT CẢ PATTERNS TRÊN BOARD
     * ============================================================================
     * 
     * THUẬT TOÁN:
     * 1. Duyệt từng vị trí (row, col) trên grid
     * 2. Tại mỗi vị trí, kiểm tra tất cả patterns
     * 3. Mỗi pattern kiểm tra cả 4 hướng xoay
     * 4. Thu thập tất cả patterns tìm được
     * 5. Loại bỏ trùng lặp và sắp xếp theo value
     * 
     * ĐỘ PHỨC TẠP:
     * O(R × C × P × 4 × Pm × Pn)
     * - R×C: Kích thước grid (64 ô)
     * - P: Số patterns (10)
     * - 4: Số hướng xoay
     * - Pm×Pn: Kích thước pattern (~9)
     * → Khoảng 23,000 phép so sánh (rất nhanh)
     * 
     * @param {Grid} grid - Lưới game
     * @returns {Array} - Danh sách patterns được sắp xếp theo value
     */
    recognizePatterns(grid) {
        const recognizedPatterns = [];
        
        // Duyệt từng vị trí trên grid làm điểm bắt đầu
        for (let row = 0; row < grid.rows; row++) {
            for (let col = 0; col < grid.cols; col++) {
                // Tìm tất cả patterns bắt đầu từ vị trí này
                const patternsFound = this.findPatternsAt(grid, row, col);
                recognizedPatterns.push(...patternsFound);
            }
        }
        
        // Loại bỏ trùng lặp và sắp xếp theo giá trị giảm dần
        return this.deduplicateAndSort(recognizedPatterns);
    }
    
    /**
     * ============================================================================
     * TÌM PATTERNS TẠI MỘT VỊ TRÍ CỤ THỂ
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Kiểm tra tất cả patterns có thể bắt đầu từ vị trí (startRow, startCol)
     * 
     * QUY TRÌNH:
     * 1. Duyệt qua từng pattern trong Map
     * 2. Với mỗi pattern, kiểm tra cả 4 hướng xoay
     * 3. Nếu khớp → thêm vào danh sách kết quả
     * 
     * @param {Grid} grid - Lưới game
     * @param {number} startRow - Hàng bắt đầu
     * @param {number} startCol - Cột bắt đầu
     * @returns {Array} - Danh sách patterns tìm được
     */
    findPatternsAt(grid, startRow, startCol) {
        const found = [];
        
        // Duyệt qua từng pattern đã định nghĩa
        this.patterns.forEach((pattern, name) => {
            // Kiểm tra tất cả 4 hướng xoay của pattern
            pattern.rotations.forEach((rotation, rotIndex) => {
                // Thử so khớp pattern tại vị trí này
                const match = this.matchPattern(grid, startRow, startCol, rotation);
                
                if (match) {
                    // Tìm thấy match → lưu kết quả
                    found.push({
                        name: name,                           // Tên pattern
                        rotation: rotIndex,                   // Hướng xoay (0-3)
                        position: { row: startRow, col: startCol },  // Vị trí
                        value: pattern.value,                 // Điểm giá trị
                        gems: match.gems,                     // Danh sách gem
                        confidence: match.confidence          // Độ tin cậy
                    });
                }
            });
        });
        
        return found;
    }
    
    /**
     * ============================================================================
     * SO KHỚP PATTERN (Template Matching)
     * ============================================================================
     * 
     * THUẬT TOÁN TEMPLATE MATCHING:
     * 1. Kiểm tra pattern có vừa trong grid không
     * 2. Duyệt từng ô trong ma trận pattern
     * 3. Nếu pattern[i][j] = 1 → phải có gem tại grid[i][j]
     * 4. Tất cả gem phải CÙNG TYPE
     * 5. Tính confidence = matchCount / totalPositions
     * 
     * ĐIỀU KIỆN KHỚP:
     * - Pattern vừa trong bounds của grid
     * - Tất cả vị trí có giá trị 1 phải có gem
     * - Tất cả gem phải cùng type (màu)
     * - Confidence phải = 1.0 (perfect match)
     * 
     * @param {Grid} grid - Lưới game
     * @param {number} startRow - Hàng bắt đầu
     * @param {number} startCol - Cột bắt đầu
     * @param {number[][]} pattern - Ma trận pattern cần so khớp
     * @returns {Object|null} - { gems, confidence, type } hoặc null nếu không khớp
     */
    matchPattern(grid, startRow, startCol, pattern) {
        const rows = pattern.length;
        const cols = pattern[0].length;
        
        /**
         * BƯỚC 1: KIỂM TRA GIỚI HẠN
         * Pattern phải nằm hoàn toàn trong grid
         */
        if (startRow + rows > grid.rows || startCol + cols > grid.cols) {
            return null;  // Pattern vượt ra ngoài grid
        }
        
        const matchedGems = [];      // Danh sách gem khớp
        let referenceType = null;    // Type tham chiếu (gem đầu tiên)
        let matchCount = 0;          // Số gem đã khớp
        let totalPositions = 0;      // Tổng số vị trí cần khớp
        
        /**
         * BƯỚC 2: DUYỆT TỪNG Ô TRONG PATTERN
         */
        for (let pRow = 0; pRow < rows; pRow++) {
            for (let pCol = 0; pCol < cols; pCol++) {
                // Tính vị trí tương ứng trên grid
                const gridRow = startRow + pRow;
                const gridCol = startCol + pCol;
                const gem = grid.gems[gridRow][gridCol];
                
                /**
                 * BƯỚC 3: NẾU PATTERN YÊU CẦU GEM (value = 1)
                 */
                if (pattern[pRow][pCol] === 1) {
                    totalPositions++;
                    
                    // Không có gem → không khớp
                    if (!gem) {
                        return null;
                    }
                    
                    /**
                     * BƯỚC 4: KIỂM TRA CÙNG TYPE
                     * - Gem đầu tiên → set referenceType
                     * - Các gem sau → phải cùng type với referenceType
                     */
                    if (referenceType === null) {
                        referenceType = gem.type;  // Lưu type đầu tiên
                    } else if (gem.type !== referenceType) {
                        return null;  // Khác type → không khớp
                    }
                    
                    // Thêm gem vào danh sách khớp
                    matchedGems.push({ row: gridRow, col: gridCol, gem: gem });
                    matchCount++;
                }
            }
        }
        
        /**
         * BƯỚC 5: TÍNH CONFIDENCE (Độ tin cậy)
         * confidence = số gem khớp / tổng số vị trí cần khớp
         * = 1.0 nếu perfect match
         */
        const confidence = totalPositions > 0 ? (matchCount / totalPositions) : 0;
        
        /**
         * BƯỚC 6: YÊU CẦU PERFECT MATCH
         * Hiện tại yêu cầu confidence = 1.0
         * (Có thể điều chỉnh cho fuzzy matching sau)
         */
        if (confidence >= 1.0) {
            return {
                gems: matchedGems,        // Danh sách gem đã khớp
                confidence: confidence,   // Độ tin cậy (1.0)
                type: referenceType       // Type của pattern
            };
        }
        
        return null;  // Không đủ điều kiện khớp
    }
    
    /**
     * ============================================================================
     * LOẠI BỎ TRÙNG LẶP VÀ SẮP XẾP
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * - Loại bỏ các pattern trùng lặp (cùng vị trí gem)
     * - Giữ lại pattern có value cao nhất nếu trùng
     * - Sắp xếp theo value giảm dần
     * 
     * THUẬT TOÁN:
     * 1. Tạo Map với key = tên + vị trí các gem
     * 2. Nếu key trùng, giữ pattern có value cao hơn
     * 3. Sắp xếp theo value giảm dần
     * 
     * @param {Array} patterns - Danh sách patterns có thể trùng
     * @returns {Array} - Danh sách patterns duy nhất, sắp xếp
     */
    deduplicateAndSort(patterns) {
        const unique = new Map();
        
        patterns.forEach(pattern => {
            // Tạo key duy nhất từ tên và vị trí các gem
            const key = this.generatePatternKey(pattern);
            
            // Nếu chưa có hoặc pattern mới có value cao hơn
            if (!unique.has(key) || unique.get(key).value < pattern.value) {
                unique.set(key, pattern);
            }
        });
        
        // Chuyển thành mảng và sắp xếp theo value giảm dần
        return Array.from(unique.values()).sort((a, b) => b.value - a.value);
    }
    
    /**
     * ============================================================================
     * TẠO KEY DUY NHẤT CHO PATTERN
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Tạo chuỗi key duy nhất để phân biệt các pattern
     * Hai pattern cùng tên nhưng khác vị trí sẽ có key khác
     * 
     * FORMAT KEY:
     * "{tên pattern}_{row1,col1}_{row2,col2}_..."
     * 
     * VÍ DỤ:
     * "t_shape_1_1,2_2,1_2,2_2,3"
     * 
     * @param {Object} pattern - Pattern cần tạo key
     * @returns {string} - Key duy nhất
     */
    generatePatternKey(pattern) {
        // Lấy danh sách vị trí các gem và sắp xếp
        const positions = pattern.gems.map(g => `${g.row},${g.col}`).sort();
        // Ghép tên và các vị trí
        return `${pattern.name}_${positions.join('_')}`;
    }
    
    /**
     * ============================================================================
     * PHÂN TÍCH BOARD VÀ ĐỀ XUẤT NƯỚC ĐI
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Phân tích toàn bộ board để tìm:
     * 1. Các pattern hiện có trên board
     * 2. Nước đi có thể kích hoạt pattern
     * 3. Nước đi tạo pattern mới
     * 
     * QUY TRÌNH:
     * BƯỚC 1: Nhận diện patterns hiện có
     * BƯỚC 2: Tìm nước đi kích hoạt từng pattern
     * BƯỚC 3: Đánh giá tất cả nước đi có thể
     * BƯỚC 4: Sắp xếp theo patternValue giảm dần
     * 
     * @param {Grid} grid - Lưới game
     * @returns {Array} - Danh sách gợi ý nước đi theo pattern
     */
    analyzeBoard(grid) {
        // BƯỚC 1: Nhận diện tất cả patterns hiện có
        const patterns = this.recognizePatterns(grid);
        const suggestions = [];
        
        // BƯỚC 2: Tìm nước đi có thể kích hoạt từng pattern
        patterns.forEach(pattern => {
            const moves = this.findMovesToActivatePattern(grid, pattern);
            suggestions.push(...moves);
        });
        
        // BƯỚC 3: Tìm nước đi tạo pattern tiềm năng
        const potentialMoves = grid.findAllPossibleMoves();
        potentialMoves.forEach(move => {
            // Đánh giá nước đi theo khả năng tạo pattern
            const patternValue = this.evaluateMoveForPatterns(grid, move);
            
            // Nếu giá trị vượt ngưỡng (> 20) → đáng quan tâm
            if (patternValue > 20) {
                suggestions.push({
                    move: move,
                    patternValue: patternValue,
                    type: 'potential_pattern'  // Loại: pattern tiềm năng
                });
            }
        });
        
        // BƯỚC 4: Sắp xếp theo patternValue giảm dần
        return suggestions.sort((a, b) => b.patternValue - a.patternValue);
    }
    
    /**
     * ============================================================================
     * TÌM NƯỚC ĐI KÍCH HOẠT PATTERN
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Tìm các nước đi có thể kích hoạt (tạo match từ) một pattern
     * 
     * QUY TRÌNH:
     * 1. Kiểm tra pattern đã active chưa (tạo match)
     * 2. Nếu chưa active → tìm nước đi gần pattern
     * 3. Trả về danh sách nước đi có thể kích hoạt
     * 
     * @param {Grid} grid - Lưới game
     * @param {Object} pattern - Pattern cần kích hoạt
     * @returns {Array} - Danh sách nước đi gợi ý
     */
    findMovesToActivatePattern(grid, pattern) {
        const moves = [];
        
        // Kiểm tra pattern đã active chưa (tạo match)
        const isActive = this.isPatternActive(grid, pattern);
        
        if (!isActive) {
            // Pattern chưa active → tìm nước đi gần đó
            const nearbyMoves = this.findMovesNearPattern(grid, pattern);
            
            nearbyMoves.forEach(move => {
                moves.push({
                    move: move,
                    patternValue: pattern.value,
                    type: 'activate_pattern',  // Loại: kích hoạt pattern
                    pattern: pattern.name       // Tên pattern
                });
            });
        }
        
        return moves;
    }
    
    /**
     * ============================================================================
     * KIỂM TRA PATTERN ĐÃ ACTIVE CHƯA
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Kiểm tra xem pattern có tạo match hợp lệ không
     * Nếu đã tạo match → không cần tìm nước đi kích hoạt
     * 
     * THUẬT TOÁN:
     * 1. Lấy tất cả matches hiện tại trên grid
     * 2. Kiểm tra xem có gem nào của pattern nằm trong match không
     * 
     * @param {Grid} grid - Lưới game
     * @param {Object} pattern - Pattern cần kiểm tra
     * @returns {boolean} - true nếu pattern đã active
     */
    isPatternActive(grid, pattern) {
        // Lấy tất cả matches hiện có trên grid
        const matches = grid.findMatches();
        
        // Kiểm tra xem có gem nào của pattern nằm trong match không
        return pattern.gems.some(patternGem => {
            return matches.some(match => 
                match.row === patternGem.row && match.col === patternGem.col
            );
        });
    }
    
    /**
     * ============================================================================
     * TÌM NƯỚC ĐI GẦN PATTERN
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Tìm các nước đi có thể liên quan đến pattern
     * Nước đi "gần" = có gem trong phạm vi 2 ô
     * 
     * THUẬT TOÁN:
     * 1. Lấy tất cả nước đi có thể
     * 2. Với mỗi nước đi, tính Manhattan Distance đến pattern
     * 3. Nếu distance ≤ 2 → xem là "gần"
     * 
     * MANHATTAN DISTANCE:
     * distance = |row1 - row2| + |col1 - col2|
     * 
     * @param {Grid} grid - Lưới game
     * @param {Object} pattern - Pattern tham chiếu
     * @returns {Array} - Danh sách nước đi gần pattern
     */
    findMovesNearPattern(grid, pattern) {
        const moves = [];
        const possibleMoves = grid.findAllPossibleMoves();
        
        // Kiểm tra từng nước đi có gần pattern không
        possibleMoves.forEach(move => {
            const isNearPattern = pattern.gems.some(patternGem => {
                /**
                 * TÍNH MANHATTAN DISTANCE
                 * distance1: Khoảng cách từ gem1 của move đến gem của pattern
                 * distance2: Khoảng cách từ gem2 của move đến gem của pattern
                 */
                const distance1 = Math.abs(move.gem1.row - patternGem.row) + 
                                Math.abs(move.gem1.col - patternGem.col);
                const distance2 = Math.abs(move.gem2.row - patternGem.row) + 
                                Math.abs(move.gem2.col - patternGem.col);
                
                // Gần nếu distance ≤ 2
                return distance1 <= 2 || distance2 <= 2;
            });
            
            if (isNearPattern) {
                moves.push(move);
            }
        });
        
        return moves;
    }
    
    /**
     * ============================================================================
     * ĐÁNH GIÁ NƯỚC ĐI THEO PATTERN
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Đánh giá một nước đi dựa trên các pattern tạo ra sau đó
     * 
     * THUẬT TOÁN:
     * 1. Thực hiện swap tạm thời
     * 2. Nhận diện patterns sau khi swap
     * 3. Tính tổng value của tất cả patterns
     * 4. Hoàn tác swap
     * 5. Trả về tổng value
     * 
     * LƯU Ý: Sử dụng swap tạm thời, không ảnh hưởng state thật
     * 
     * @param {Grid} grid - Lưới game
     * @param {Object} move - Nước đi cần đánh giá
     * @returns {number} - Tổng giá trị patterns
     */
    evaluateMoveForPatterns(grid, move) {
        // Lấy 2 gem cần swap
        const gem1 = grid.gems[move.gem1.row][move.gem1.col];
        const gem2 = grid.gems[move.gem2.row][move.gem2.col];
        
        // Thực hiện swap tạm thời
        grid.swapGems(gem1, gem2);
        
        // Nhận diện patterns sau khi swap
        const patternsAfter = this.recognizePatterns(grid);
        
        // Tính tổng value của tất cả patterns
        const totalValue = patternsAfter.reduce((sum, p) => sum + p.value, 0);
        
        // Hoàn tác swap (trả về trạng thái ban đầu)
        grid.swapGems(gem1, gem2);
        
        return totalValue;
    }
    
    /**
     * ============================================================================
     * HUẤN LUYỆN (Machine Learning)
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Học hỏi từ dữ liệu game để cải thiện nhận diện pattern
     * 
     * CƠ CHẾ HỌC ĐƠN GIẢN:
     * - Nếu nước đi thành công → tăng value của patterns đã dùng
     * - Lưu training data cho phân tích sau
     * 
     * CẤU TRÚC GAME DATA:
     * {
     *   successful: boolean,      // Nước đi có thành công không
     *   patternsUsed: string[]    // Các pattern đã sử dụng
     * }
     * 
     * MỞ RỘNG TƯƠNG LAI:
     * - Neural Network để học pattern mới
     * - Q-Learning để tối ưu value
     * - Clustering để nhóm patterns tương tự
     * 
     * @param {Object} gameData - Dữ liệu từ game
     */
    train(gameData) {
        // Lưu training data cho phân tích sau
        this.trainingData.push(gameData);
        
        // Học đơn giản: tăng value nếu thành công
        if (gameData.successful && gameData.patternsUsed) {
            gameData.patternsUsed.forEach(patternName => {
                const pattern = this.patterns.get(patternName);
                if (pattern) {
                    // Tăng value cho pattern thành công
                    pattern.value += 1;
                }
            });
        }
        
        console.log(`Kích thước training data: ${this.trainingData.length}`);
    }
    
    /**
     * ============================================================================
     * LẤY THỐNG KÊ PATTERNS
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Trả về thông tin thống kê về hệ thống patterns
     * Dùng để debug và phân tích hiệu suất
     * 
     * @returns {Object} - Thống kê patterns
     *   - totalPatterns: Tổng số patterns
     *   - trainingDataSize: Kích thước training data
     *   - patterns: Chi tiết từng pattern
     */
    getStats() {
        const patternStats = new Map();
        
        // Thu thập thông tin từng pattern
        this.patterns.forEach((pattern, name) => {
            patternStats.set(name, {
                value: pattern.value,                              // Giá trị hiện tại
                rotations: pattern.rotations.length,               // Số hướng xoay (4)
                dimensions: `${pattern.matrix.length}x${pattern.matrix[0].length}`  // Kích thước
            });
        });
        
        return {
            totalPatterns: this.patterns.size,         // Tổng số patterns
            trainingDataSize: this.trainingData.length, // Số mẫu huấn luyện
            patterns: Object.fromEntries(patternStats)  // Chi tiết patterns
        };
    }
    
    /**
     * ============================================================================
     * XUẤT PATTERNS RA JSON
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Export tất cả patterns thành JSON string
     * Dùng để lưu trữ, chia sẻ, backup
     * 
     * FORMAT OUTPUT:
     * {
     *   "pattern_name": {
     *     "matrix": [[1,1,1]],
     *     "value": 10
     *   },
     *   ...
     * }
     * 
     * @returns {string} - JSON string của tất cả patterns
     */
    exportPatterns() {
        const exported = {};
        
        // Thu thập ma trận và value của từng pattern
        this.patterns.forEach((pattern, name) => {
            exported[name] = {
                matrix: pattern.matrix,  // Ma trận gốc
                value: pattern.value     // Giá trị hiện tại
            };
        });
        
        // Chuyển thành JSON với format đẹp
        return JSON.stringify(exported, null, 2);
    }
    
    /**
     * ============================================================================
     * NHẬP PATTERNS TỪ JSON
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Import patterns từ JSON string (export từ hệ thống khác)
     * Tự động tạo 4 hướng xoay cho mỗi pattern
     * 
     * FORMAT INPUT:
     * {
     *   "pattern_name": {
     *     "matrix": [[1,1,1]],
     *     "value": 10
     *   },
     *   ...
     * }
     * 
     * @param {string} patternsJson - JSON string của patterns
     */
    importPatterns(patternsJson) {
        try {
            // Parse JSON
            const imported = JSON.parse(patternsJson);
            
            // Thêm từng pattern vào hệ thống
            Object.entries(imported).forEach(([name, data]) => {
                // addPattern sẽ tự động tạo 4 hướng xoay
                this.addPattern(name, data.matrix, data.value);
            });
            
            console.log(`Đã import ${Object.keys(imported).length} patterns`);
        } catch (error) {
            console.error('Lỗi import patterns:', error);
        }
    }
}

/**
 * ============================================================================
 * EXPORT TOÀN CỤC
 * ============================================================================
 * Export class ra window object để sử dụng ở các file khác
 */
if (typeof window !== 'undefined') {
    window.PatternRecognizer = PatternRecognizer;
}