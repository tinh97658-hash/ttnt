/**
 * ============================================================================
 * MINIMAX SOLVER - AI SỬ DỤNG THUẬT TOÁN MINIMAX VỚI ALPHA-BETA PRUNING
 * ============================================================================
 * 
 * MỤC ĐÍCH:
 * - Tìm nước đi tối ưu bằng cách phân tích cây game (game tree)
 * - Sử dụng thuật toán Minimax kết hợp Alpha-Beta Pruning để tối ưu
 * - Dùng cho Auto-Solve và làm fallback khi HintSystem không đủ
 * 
 * THUẬT TOÁN MINIMAX:
 * - MAX player: Cố gắng TỐI ĐA HÓA điểm số (người chơi)
 * - MIN player: Cố gắng TỐI THIỂU HÓA điểm số (đối thủ/game)
 * - Duyệt cây game theo chiều sâu (DFS) với giới hạn depth
 * 
 * ALPHA-BETA PRUNING:
 * - Alpha (α): Giá trị TỐT NHẤT mà MAX đã tìm thấy
 * - Beta (β): Giá trị TỐT NHẤT mà MIN đã tìm thấy
 * - Cắt tỉa khi β ≤ α (không cần xét thêm)
 * 
 * ĐỘ PHỨC TẠP:
 * - Không pruning: O(b^d) với b = branching factor, d = depth
 * - Có pruning: O(b^(d/2)) trong trường hợp tốt nhất
 * 
 * ============================================================================
 */
class MinimaxSolver {
    /**
     * KHỞI TẠO MINIMAX SOLVER
     * 
     * @param {number} maxDepth - Độ sâu tìm kiếm tối đa (mặc định: 3)
     * 
     * CÁC THAM SỐ CẤU HÌNH:
     * - maxDepth: Số bước nhìn trước (depth 3 = nhìn trước 3 nước)
     * - timeBudgetMs: Giới hạn thời gian để tránh lag game
     * - maxNodes: Giới hạn số nodes để tránh tràn bộ nhớ
     */
    constructor(maxDepth = 3) {
        /**
         * ĐỘ SÂU TÌM KIẾM TỐI ĐA
         * - depth = 2: Dễ (nhanh, ít chính xác)
         * - depth = 3: Trung bình (cân bằng)
         * - depth = 4: Khó (chậm, chính xác hơn)
         */
        this.maxDepth = maxDepth;
        
        /**
         * BỘ ĐẾM NODES ĐÃ XÉT
         * Dùng để theo dõi hiệu suất và giới hạn tìm kiếm
         */
        this.nodeCount = 0;
        
        /**
         * THỜI GIAN ĐÁNH GIÁ (ms)
         * Lưu lại để báo cáo hiệu suất
         */
        this.evaluationTime = 0;
        
        /**
         * GIỚI HẠN THỜI GIAN (Time Budget)
         * - 2000ms (2 giây) để AI có thời gian suy nghĩ sâu
         * - Với depth cao (>5), cần thêm thời gian
         */
        this.timeBudgetMs = 2000;
        
        /**
         * GIỚI HẠN SỐ NODES TỐI ĐA
         * - 50000 nodes để cho phép tìm kiếm sâu hơn
         * - Với Alpha-Beta pruning, thường không cần đến giới hạn này
         */
        this.maxNodes = 50000;
        
        /**
         * THỜI ĐIỂM BẮT ĐẦU TÌM KIẾM
         * Dùng để tính thời gian đã trôi qua
         */
        this.startTime = 0;
        
        /**
         * HỆ THỐNG TRỌNG SỐ ĐÁNH GIÁ (Evaluation Weights)
         * ================================================
         * Định nghĩa mức độ quan trọng của từng yếu tố khi đánh giá board
         * 
         * CÔNG THỨC TỔNG ĐIỂM:
         * Score = simulationScore × score
         *       + cascadeCount × 50 × score
         *       + min(moveCount, 30) × possibleMoves
         *       + specialGemCount × specialGems
         *       + centerControlValue × centerControl
         *       + patternBonus
         */
        this.weights = {
            /**
             * TRỌNG SỐ ĐIỂM TỪ SIMULATION (score: 1.0)
             * - Điểm trực tiếp từ việc xóa matches
             * - Trọng số cơ bản, nhân trực tiếp
             */
            score: 1.0,
            
            /**
             * TRỌNG SỐ SỐ NƯỚC ĐI (moves: 0.5)
             * - Hiện không được sử dụng trong code
             * - Dự phòng cho các tính năng sau
             */
            moves: 0.5,
            
            /**
             * TRỌNG SỐ SỐ NƯỚC ĐI KHẢ THI (possibleMoves: 0.3)
             * - Ưu tiên trạng thái có nhiều lựa chọn
             * - Nhiều nước đi = linh hoạt hơn = điểm cao hơn
             * - Giới hạn tối đa 30 để tránh ảnh hưởng quá lớn
             */
            possibleMoves: 0.3,
            
            /**
             * TRỌNG SỐ GEM ĐẶC BIỆT (specialGems: 2.0)
             * - Ưu tiên CAO cho việc giữ/tạo gem đặc biệt
             * - Gem đặc biệt có sức mạnh lớn trong game
             * - Trọng số cao nhất (2.0)
             */
            specialGems: 2.0,
            
            /**
             * TRỌNG SỐ KIỂM SOÁT TRUNG TÂM (centerControl: 0.2)
             * - Bonus nhỏ cho gem ở vùng trung tâm
             * - Trung tâm có nhiều cơ hội combo hơn
             * - Trọng số thấp vì chỉ là yếu tố phụ
             */
            centerControl: 0.2
        };
        
        /**
         * BẢNG TRANSPOSITION (Transposition Table)
         * =========================================
         * Kỹ thuật MEMOIZATION để lưu kết quả đã tính
         * - Key: hash của board + depth + isMaximizing
         * - Value: {score, move} đã tính
         * - Tránh tính lại các trạng thái giống nhau
         */
        this.transpositionTable = new Map();
        
        /**
         * KÍCH THƯỚC TỐI ĐA BẢNG TRANSPOSITION
         * - Giới hạn 1000 entries để tiết kiệm bộ nhớ
         * - Khi đầy → xóa entry cũ nhất (FIFO)
         */
        this.maxTableSize = 1000;
    }
    
    /**
     * ============================================================================
     * PHƯƠNG THỨC CHÍNH: TÌM NƯỚC ĐI TỐT NHẤT
     * ============================================================================
     * 
     * THUẬT TOÁN: Minimax với Alpha-Beta Pruning
     * 
     * CÁC BƯỚC THỰC HIỆN:
     * 1. Khởi tạo timer và counter
     * 2. Xóa transposition table cũ
     * 3. Gọi minimax() với α=-∞, β=+∞
     * 4. Xử lý exception nếu timeout/node limit
     * 5. Trả về kết quả đầy đủ
     * 
     * @param {Grid} grid - Lưới game hiện tại
     * @param {number} depth - Độ sâu tìm kiếm (null = dùng maxDepth)
     * @param {boolean} isMaximizing - true = MAX player, false = MIN player
     * @returns {Object} - {move, score, nodesExplored, evaluationTime, depth, aborted}
     */
    findBestMove(grid, depth = null, isMaximizing = true) {
        /**
         * BƯỚC 1: KHỞI TẠO
         * - Ghi nhận thời điểm bắt đầu để tính timeout
         * - Reset bộ đếm nodes
         * - Xác định độ sâu tìm kiếm
         */
        this.startTime = performance.now();
        this.nodeCount = 0;
        const searchDepth = depth || this.maxDepth;
        
        console.log(`🧠 Minimax START: depth=${searchDepth}, timeBudget=${this.timeBudgetMs}ms, maxNodes=${this.maxNodes}`);
        
        /**
         * BƯỚC 2: XÓA TRANSPOSITION TABLE
         * - Mỗi lần tìm kiếm mới cần table sạch
         * - Vì trạng thái board đã thay đổi
         */
        this.transpositionTable.clear();

        let result;
        try {
            /**
             * BƯỚC 3: GỌI THUẬT TOÁN MINIMAX
             * - alpha = -Infinity: MAX chưa tìm được gì
             * - beta = +Infinity: MIN chưa tìm được gì
             * - isMaximizing = true: Bắt đầu với MAX player
             */
            result = this.minimax(grid, searchDepth, -Infinity, Infinity, isMaximizing);
        } catch (e) {
            /**
             * BƯỚC 4: XỬ LÝ EXCEPTION (Timeout/Node limit)
             * - Khi vượt quá giới hạn → abort tìm kiếm
             * - Fallback: Chọn nước đi đầu tiên có thể
             */
            console.warn('Minimax aborted:', e.message);
            const fallbackMoves = grid.findAllPossibleMoves();
            result = { move: fallbackMoves[0] || null, score: 0 };
        }

        /**
         * BƯỚC 5: TRẢ VỀ KẾT QUẢ ĐẦY ĐỦ
         */
        this.evaluationTime = performance.now() - this.startTime;
        
        console.log(`🧠 Minimax END: ${this.evaluationTime.toFixed(0)}ms, nodes=${this.nodeCount}, aborted=${this.evaluationTime > this.timeBudgetMs || this.nodeCount >= this.maxNodes}`);
        
        return {
            move: result.move,                    // Nước đi tốt nhất
            score: result.score,                   // Điểm đánh giá
            nodesExplored: this.nodeCount,         // Số nodes đã xét
            evaluationTime: this.evaluationTime,   // Thời gian (ms)
            depth: searchDepth,                    // Độ sâu đã dùng
            aborted: this.evaluationTime > this.timeBudgetMs || this.nodeCount >= this.maxNodes
        };
    }
    
    /**
     * ============================================================================
     * THUẬT TOÁN MINIMAX VỚI ALPHA-BETA PRUNING
     * ============================================================================
     * 
     * NGUYÊN LÝ:
     * - MAX player cố gắng TỐI ĐA HÓA điểm
     * - MIN player cố gắng TỐI THIỂU HÓA điểm
     * - Alpha-Beta cắt tỉa các nhánh không cần thiết
     * 
     * PSEUDOCODE:
     * ```
     * function minimax(node, depth, α, β, isMaximizing):
     *     if depth == 0: return evaluate(node)
     *     
     *     if isMaximizing:
     *         maxScore = -∞
     *         for each child:
     *             score = minimax(child, depth-1, α, β, false)
     *             maxScore = max(maxScore, score)
     *             α = max(α, score)
     *             if β ≤ α: break  // Cắt tỉa
     *         return maxScore
     *     else:
     *         minScore = +∞
     *         for each child:
     *             score = minimax(child, depth-1, α, β, true)
     *             minScore = min(minScore, score)
     *             β = min(β, score)
     *             if β ≤ α: break  // Cắt tỉa
     *         return minScore
     * ```
     * 
     * @param {Grid} grid - Lưới game
     * @param {number} depth - Độ sâu còn lại
     * @param {number} alpha - Giá trị tốt nhất của MAX
     * @param {number} beta - Giá trị tốt nhất của MIN
     * @param {boolean} isMaximizing - true = MAX, false = MIN
     * @returns {Object} - {score, move}
     */
    minimax(grid, depth, alpha, beta, isMaximizing) {
        /**
         * KIỂM TRA GIỚI HẠN THỜI GIAN
         * - Nếu vượt quá timeBudget → throw exception để abort
         */
        if (performance.now() - this.startTime > this.timeBudgetMs) {
            throw new Error('time_budget_exceeded');
        }
        
        /**
         * KIỂM TRA GIỚI HẠN SỐ NODES
         * - Tăng counter và kiểm tra
         * - Nếu vượt quá maxNodes → throw exception
         */
        if (++this.nodeCount >= this.maxNodes) {
            throw new Error('node_limit_exceeded');
        }
        
        /**
         * KIỂM TRA TRANSPOSITION TABLE
         * - Tạo key từ hash + depth + isMaximizing
         * - Nếu đã có kết quả → trả về ngay (memoization)
         */
        const boardHash = grid.getBoardHash ? grid.getBoardHash() : this.getSimpleHash(grid);
        const tableKey = `${boardHash}-${depth}-${isMaximizing}`;
        if (this.transpositionTable.has(tableKey)) {
            return this.transpositionTable.get(tableKey);
        }
        
        /**
         * BASE CASE: ĐẠT ĐỘ SÂU TỐI ĐA
         * - Không đi sâu hơn nữa
         * - Đánh giá trạng thái hiện tại bằng heuristics
         */
        if (depth === 0) {
            const result = {
                score: this.evaluateBoard(grid),
                move: null
            };
            this.storeInTable(tableKey, result);
            return result;
        }

        /**
         * LẤY TẤT CẢ NƯỚC ĐI CÓ THỂ
         * - Nếu không có nước đi → đánh giá trạng thái hiện tại
         */
        const possibleMoves = grid.findAllPossibleMoves();
        if (possibleMoves.length === 0) {
            const result = { score: this.evaluateBoard(grid), move: null };
            this.storeInTable(tableKey, result);
            return result;
        }
        
        let bestMove = null;
        
        /**
         * ============================================================
         * TRƯỜNG HỢP 1: MAX PLAYER (isMaximizing = true)
         * ============================================================
         * - Cố gắng TỐI ĐA HÓA điểm số
         * - Cập nhật alpha khi tìm được điểm cao hơn
         * - Cắt tỉa (β cutoff) khi β ≤ α
         */
        if (isMaximizing) {
            let maxScore = -Infinity;
            
            for (const move of possibleMoves) {
                /**
                 * CLONE GRID VÀ MÔ PHỎNG NƯỚC ĐI
                 * - Tạo bản sao nhẹ của grid
                 * - Thực hiện swap trên bản sao
                 * - Mô phỏng matches và gravity
                 */
                const cloned = this.shallowCloneGrid(grid);
                const cGem1 = cloned.gems[move.gem1.row][move.gem1.col];
                const cGem2 = cloned.gems[move.gem2.row][move.gem2.col];
                cloned.swapGemsData(cGem1, cGem2);
                this.fastSimulate(cloned);
                
                /**
                 * ĐỆ QUY MINIMAX
                 * - depth - 1: Giảm độ sâu
                 * - isMaximizing = false: Đến lượt MIN
                 */
                const result = this.minimax(cloned, depth - 1, alpha, beta, false);
                
                /**
                 * CẬP NHẬT ĐIỂM TỐT NHẤT
                 */
                if (result.score > maxScore) {
                    maxScore = result.score;
                    bestMove = move;
                }
                
                /**
                 * CẬP NHẬT ALPHA
                 * Alpha = giá trị tốt nhất mà MAX đã tìm được
                 */
                alpha = Math.max(alpha, result.score);
                
                /**
                 * ALPHA-BETA PRUNING (β cutoff)
                 * - Nếu β ≤ α: MIN sẽ không chọn nhánh này
                 * - Không cần xét thêm → break
                 */
                if (beta <= alpha) {
                    break;
                }
            }
            
            const result = { score: maxScore, move: bestMove };
            this.storeInTable(tableKey, result);
            return result;
            
        /**
         * ============================================================
         * TRƯỜNG HỢP 2: MIN PLAYER (isMaximizing = false)
         * ============================================================
         * - Cố gắng TỐI THIỂU HÓA điểm số
         * - Cập nhật beta khi tìm được điểm thấp hơn
         * - Cắt tỉa (α cutoff) khi β ≤ α
         */
        } else {
            let minScore = Infinity;
            
            for (const move of possibleMoves) {
                /**
                 * CLONE GRID VÀ MÔ PHỎNG NƯỚC ĐI
                 */
                const cloned = this.shallowCloneGrid(grid);
                const cGem1 = cloned.gems[move.gem1.row][move.gem1.col];
                const cGem2 = cloned.gems[move.gem2.row][move.gem2.col];
                cloned.swapGemsData(cGem1, cGem2);
                this.fastSimulate(cloned);
                
                /**
                 * ĐỆ QUY MINIMAX
                 * - isMaximizing = true: Đến lượt MAX
                 */
                const result = this.minimax(cloned, depth - 1, alpha, beta, true);
                
                /**
                 * CẬP NHẬT ĐIỂM TỐT NHẤT (MIN tìm điểm thấp nhất)
                 */
                if (result.score < minScore) {
                    minScore = result.score;
                    bestMove = move;
                }
                
                /**
                 * CẬP NHẬT BETA
                 * Beta = giá trị tốt nhất mà MIN đã tìm được
                 */
                beta = Math.min(beta, result.score);
                
                /**
                 * ALPHA-BETA PRUNING (α cutoff)
                 * - Nếu β ≤ α: MAX sẽ không chọn nhánh này
                 * - Không cần xét thêm → break
                 */
                if (beta <= alpha) {
                    break;
                }
            }
            
            const result = { score: minScore, move: bestMove };
            this.storeInTable(tableKey, result);
            return result;
        }
    }
    
    /**
     * ============================================================================
     * MÔ PHỎNG NHANH (Fast Simulate)
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Mô phỏng nhanh một bước match + gravity để đánh giá nước đi
     * 
     * ĐẶC ĐIỂM:
     * - Chỉ xét 1 cascade (không loop vô hạn)
     * - Tốc độ nhanh, phù hợp cho minimax
     * 
     * @param {Grid} grid - Lưới đã được clone
     */
    fastSimulate(grid) {
        // Tìm tất cả matches sau khi swap
        const matches = grid.findMatches();
        
        // Nếu không có match → kết thúc
        if (matches.length === 0) {
            grid.simulationScore = 0;
            grid.cascadeCount = 0;
            return;
        }
        
        // Xóa matches và tính điểm
        const gained = grid.removeMatches(matches);
        
        // Áp dụng gravity (gem rơi xuống)
        grid.applyGravity();
        
        // Lưu kết quả mô phỏng
        grid.simulationScore = gained;
        grid.cascadeCount = 1; // Chỉ tính 1 cascade để tăng tốc
    }
    
    /**
     * ============================================================================
     * CLONE NHANH GRID (Shallow Clone)
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Tạo bản sao nhẹ của grid để mô phỏng nước đi
     * Không ảnh hưởng đến grid gốc
     * 
     * ĐẶC ĐIỂM:
     * - Chỉ clone dữ liệu cần thiết (rows, cols, gems)
     * - Bật simulationMode để tránh animation
     * - Bind các method từ original
     * - Hiệu quả hơn deep clone
     * 
     * @param {Grid} original - Grid gốc cần clone
     * @returns {Grid} - Bản sao nhẹ của grid
     */
    shallowCloneGrid(original) {
        /**
         * TẠO OBJECT MỚI VỚI CÙNG PROTOTYPE
         * - Cho phép sử dụng các method của Grid
         */
        const cloned = Object.create(Object.getPrototypeOf(original));
        
        /**
         * COPY CÁC THUỘC TÍNH CƠ BẢN
         */
        cloned.rows = original.rows;
        cloned.cols = original.cols;
        cloned.simulationScore = 0;
        cloned.cascadeCount = 0;
        cloned.simulationMode = true; // Tắt animation/timeout
        
        /**
         * CLONE MA TRẬN GEM
         * - Clone từng gem object
         * - Giữ cấu trúc 2D array
         */
        cloned.gems = [];
        for (let r = 0; r < original.rows; r++) {
            const rowArr = [];
            for (let c = 0; c < original.cols; c++) {
                const g = original.gems[r][c];
                if (g) {
                    // Clone gem với các field cần thiết
                    const cg = g.clone();
                    rowArr[c] = cg;
                } else {
                    rowArr[c] = null;
                }
            }
            cloned.gems[r] = rowArr;
        }
        
        /**
         * BIND CÁC METHOD TỪ ORIGINAL
         * - Sử dụng lại các hàm của Grid
         * - Bind với context của cloned object
         */
        cloned.findMatches = original.findMatches.bind(cloned);
        cloned.removeMatches = original.removeMatches.bind(cloned);
        cloned.applyGravity = original.applyGravity.bind(cloned);
        cloned.swapGemsData = original.swapGemsData.bind(cloned);
        cloned.swapGems = cloned.swapGemsData; // Alias tương thích
        cloned.findAllPossibleMoves = original.findAllPossibleMoves.bind(cloned);
        
        return cloned;
    }
    
    /**
     * ============================================================================
     * ĐÁNH GIÁ BOARD (Heuristic Evaluation)
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Đánh giá trạng thái board bằng nhiều heuristics kết hợp
     * Trả về điểm số ước lượng cho minimax
     * 
     * CÔNG THỨC TỔNG ĐIỂM:
     * Score = simulationScore × score
     *       + cascadeCount × 50 × score  
     *       + min(moveCount, 30) × possibleMoves
     *       + specialGemCount × specialGems
     *       + centerControlValue × centerControl
     *       + patternBonus
     * 
     * @param {Grid} grid - Lưới game cần đánh giá
     * @returns {number} - Điểm heuristic của board
     */
    evaluateBoard(grid) {
        let score = 0;
        
        /**
         * ĐIỂM TỪ SIMULATION
         * - Điểm trực tiếp từ việc xóa matches
         */
        if (grid.simulationScore) {
            score += grid.simulationScore * this.weights.score;
        }
        
        /**
         * BONUS CHO CASCADE
         * - Mỗi cascade thêm 50 điểm
         * - Cascade = chuỗi matches liên tiếp
         */
        if (grid.cascadeCount) {
            score += grid.cascadeCount * 50 * this.weights.score;
        }
        
        /**
         * SỐ NƯỚC ĐI KHẢ THI
         * - Nhiều lựa chọn = vị trí tốt hơn
         * - Giới hạn max 30 để tránh ảnh hưởng quá lớn
         */
        let moveCount = 0;
        try {
            moveCount = grid.findAllPossibleMoves().length;
        } catch (e) {
            // Trường hợp hiếm: lỗi clone → bỏ qua
            moveCount = 0;
        }
        score += Math.min(moveCount, 30) * this.weights.possibleMoves;
        
        /**
         * SỐ GEM ĐẶC BIỆT
         * - Gem đặc biệt có sức mạnh lớn
         * - Ưu tiên giữ gem đặc biệt trên board
         */
        score += this.countSpecialGems(grid) * this.weights.specialGems;
        
        /**
         * KIỂM SOÁT TRUNG TÂM
         * - Gem ở trung tâm có nhiều cơ hội combo
         */
        score += this.evaluateCenterControl(grid) * this.weights.centerControl;
        
        /**
         * BONUS PATTERN
         * - Nhận diện các pattern đặc biệt (T, L, Square)
         */
        score += this.evaluatePatterns(grid);
        
        return score;
    }
    
    /**
     * ============================================================================
     * ĐẾM GEM ĐẶC BIỆT
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Đếm số gem đặc biệt có trên board
     * 
     * CÁC LOẠI GEM ĐẶC BIỆT:
     * - Line (horizontal/vertical): Xóa cả hàng/cột
     * - Bomb: Xóa vùng 3x3
     * - Color: Xóa tất cả gem cùng màu
     * 
     * @param {Grid} grid - Lưới game
     * @returns {number} - Số gem đặc biệt
     */
    countSpecialGems(grid) {
        let count = 0;
        
        // Duyệt toàn bộ board
        for (let row = 0; row < grid.rows; row++) {
            for (let col = 0; col < grid.cols; col++) {
                const gem = grid.gems[row][col];
                // Kiểm tra gem có special không
                if (gem && gem.isSpecial) {
                    count++;
                }
            }
        }
        
        return count;
    }
    
    /**
     * ============================================================================
     * ĐÁNH GIÁ KIỂM SOÁT TRUNG TÂM
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Tính giá trị của các gem ở vùng trung tâm board
     * 
     * NGUYÊN LÝ:
     * - Gem ở trung tâm có nhiều gem lân cận hơn
     * - Nhiều gem lân cận = nhiều cơ hội tạo match
     * - Dùng Manhattan Distance để tính khoảng cách
     * 
     * CÔNG THỨC:
     * centerValue = Σ (radius - distance + 1) × 10
     * với distance = |row - centerRow| + |col - centerCol|
     * 
     * @param {Grid} grid - Lưới game
     * @returns {number} - Giá trị kiểm soát trung tâm
     */
    evaluateCenterControl(grid) {
        let centerValue = 0;
        
        // Tìm tâm board
        const centerRow = Math.floor(grid.rows / 2);
        const centerCol = Math.floor(grid.cols / 2);
        
        // Bán kính vùng trung tâm
        const radius = 2;
        
        // Duyệt vùng trung tâm (5x5 với radius=2)
        for (let row = Math.max(0, centerRow - radius); row <= Math.min(grid.rows - 1, centerRow + radius); row++) {
            for (let col = Math.max(0, centerCol - radius); col <= Math.min(grid.cols - 1, centerCol + radius); col++) {
                const gem = grid.gems[row][col];
                if (gem) {
                    /**
                     * TÍNH KHOẢNG CÁCH MANHATTAN
                     * distance = |row - centerRow| + |col - centerCol|
                     * Càng gần tâm → distance càng nhỏ → giá trị càng cao
                     */
                    const distance = Math.abs(row - centerRow) + Math.abs(col - centerCol);
                    centerValue += (radius - distance + 1) * 10;
                }
            }
        }
        
        return centerValue;
    }
    
    /**
     * ============================================================================
     * ĐÁNH GIÁ CÁC PATTERN ĐẶC BIỆT
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Nhận diện và tính điểm cho các pattern chiến lược
     * 
     * CÁC PATTERN:
     * - T-shape (30 điểm): Có thể tạo gem Line
     * - L-shape (25 điểm): Có thể tạo gem đặc biệt
     * - Square (20 điểm): 4 gem cùng màu 2x2
     * 
     * @param {Grid} grid - Lưới game
     * @returns {number} - Tổng điểm pattern
     */
    evaluatePatterns(grid) {
        let patternScore = 0;
        
        // Duyệt từng ô trên board
        for (let row = 0; row < grid.rows; row++) {
            for (let col = 0; col < grid.cols; col++) {
                const gem = grid.gems[row][col];
                if (!gem) continue;
                
                /**
                 * KIỂM TRA T-SHAPE
                 * Pattern hình chữ T (4-5 gem)
                 * → Có thể tạo gem Line đặc biệt
                 */
                if (this.isTShape(grid, row, col)) {
                    patternScore += 30;
                }
                
                /**
                 * KIỂM TRA L-SHAPE
                 * Pattern hình chữ L (3-4 gem)
                 * → Có tiềm năng tạo match lớn
                 */
                if (this.isLShape(grid, row, col)) {
                    patternScore += 25;
                }
                
                /**
                 * KIỂM TRA SQUARE PATTERN
                 * Pattern 2x2 (4 gem cùng màu)
                 * → Đặc biệt trong một số game
                 */
                if (this.isSquarePattern(grid, row, col)) {
                    patternScore += 20;
                }
            }
        }
        
        return patternScore;
    }
    
    /**
     * ============================================================================
     * NHẬN DIỆN T-SHAPE PATTERN
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Kiểm tra xem vị trí có tạo thành hình chữ T không
     * 
     * HÌNH DẠNG T-SHAPE:
     *     ●
     *   ● ● ●    (Hoặc các biến thể xoay)
     *     ●
     * 
     * ĐIỀU KIỆN:
     * - Có gem ở trên, dưới (vertical line)
     * - Có gem ở trái hoặc phải (horizontal cross)
     * - Tất cả phải cùng type
     * 
     * @param {Grid} grid - Lưới game
     * @param {number} row - Hàng của gem
     * @param {number} col - Cột của gem
     * @returns {boolean} - true nếu là T-shape
     */
    isTShape(grid, row, col) {
        const gem = grid.gems[row][col];
        if (!gem) return false;
        
        // Kiểm tra giới hạn: cần có không gian cho T-shape
        if (row > 0 && row < grid.rows - 1 && col > 0 && col < grid.cols - 1) {
            // Lấy các gem lân cận
            const up = grid.gems[row - 1][col];
            const down = grid.gems[row + 1][col];
            const left = grid.gems[row][col - 1];
            const right = grid.gems[row][col + 1];
            
            /**
             * KIỂM TRA T-SHAPE
             * Điều kiện:
             * 1. Có gem trên và dưới (vertical line)
             * 2. Có gem trái HOẶC phải (horizontal cross)
             * 3. Tất cả phải cùng type với gem trung tâm
             */
            if (up && down && (left || right) &&
                up.type === gem.type && down.type === gem.type &&
                ((left && left.type === gem.type) || (right && right.type === gem.type))) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * ============================================================================
     * NHẬN DIỆN L-SHAPE PATTERN
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Kiểm tra xem vị trí có tạo thành hình chữ L không
     * 
     * HÌNH DẠNG L-SHAPE (4 hướng):
     * ● ●       ● ●         ●           ●
     * ●           ●       ● ●         ● ●
     * 
     * 4 BIẾN THỂ:
     * - Right-Down: →↓
     * - Left-Down:  ←↓
     * - Right-Up:   →↑
     * - Left-Up:    ←↑
     * 
     * @param {Grid} grid - Lưới game
     * @param {number} row - Hàng của gem
     * @param {number} col - Cột của gem
     * @returns {boolean} - true nếu là L-shape
     */
    isLShape(grid, row, col) {
        const gem = grid.gems[row][col];
        if (!gem) return false;
        
        /**
         * ĐỊNH NGHĨA 4 HƯỚNG L-SHAPE
         * Mỗi hướng có 2 vector: [row_offset, col_offset]
         */
        const directions = [
            [[0, 1], [1, 0]],   // Right-Down L: phải + xuống
            [[0, -1], [1, 0]],  // Left-Down L:  trái + xuống
            [[0, 1], [-1, 0]],  // Right-Up L:   phải + lên
            [[0, -1], [-1, 0]]  // Left-Up L:    trái + lên
        ];
        
        // Kiểm tra từng hướng
        for (const [dir1, dir2] of directions) {
            const gem1 = this.getGemAt(grid, row + dir1[0], col + dir1[1]);
            const gem2 = this.getGemAt(grid, row + dir2[0], col + dir2[1]);
            
            // Nếu cả 2 gem lân cận tồn tại và cùng type → là L-shape
            if (gem1 && gem2 && gem1.type === gem.type && gem2.type === gem.type) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * ============================================================================
     * NHẬN DIỆN SQUARE PATTERN (2x2)
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Kiểm tra xem 4 gem tạo thành hình vuông 2x2 không
     * 
     * HÌNH DẠNG:
     * ● ●
     * ● ●
     * 
     * ĐẶC ĐIỂM:
     * - 4 gem cùng type
     * - Tạo thành hình vuông 2x2
     * - Một số game có special cho pattern này
     * 
     * @param {Grid} grid - Lưới game
     * @param {number} row - Hàng góc trên trái
     * @param {number} col - Cột góc trên trái
     * @returns {boolean} - true nếu là Square pattern
     */
    isSquarePattern(grid, row, col) {
        // Kiểm tra giới hạn: cần có không gian 2x2
        if (row >= grid.rows - 1 || col >= grid.cols - 1) return false;
        
        const gem = grid.gems[row][col];
        if (!gem) return false;
        
        // Lấy 3 gem còn lại của hình vuông
        const topRight = grid.gems[row][col + 1];       // Góc trên phải
        const bottomLeft = grid.gems[row + 1][col];     // Góc dưới trái
        const bottomRight = grid.gems[row + 1][col + 1]; // Góc dưới phải
        
        // Kiểm tra tất cả tồn tại và cùng type
        return topRight && bottomLeft && bottomRight &&
               topRight.type === gem.type &&
               bottomLeft.type === gem.type &&
               bottomRight.type === gem.type;
    }
    
    /**
     * ============================================================================
     * HÀM HELPER: LẤY GEM TẠI VỊ TRÍ (An toàn)
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Lấy gem tại vị trí với kiểm tra giới hạn an toàn
     * Tránh lỗi index out of bounds
     * 
     * @param {Grid} grid - Lưới game
     * @param {number} row - Hàng
     * @param {number} col - Cột
     * @returns {Gem|null} - Gem hoặc null nếu ngoài giới hạn
     */
    getGemAt(grid, row, col) {
        // Kiểm tra giới hạn
        if (row < 0 || row >= grid.rows || col < 0 || col >= grid.cols) {
            return null;
        }
        return grid.gems[row][col];
    }
    
    /**
     * ============================================================================
     * LƯU VÀO TRANSPOSITION TABLE
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Lưu kết quả đã tính vào bảng transposition
     * Có giới hạn kích thước để tiết kiệm bộ nhớ
     * 
     * CHIẾN LƯỢC FIFO:
     * - Khi đầy → xóa entry cũ nhất
     * - Sử dụng Map để giữ thứ tự insert
     * 
     * @param {string} key - Key dạng "hash-depth-isMaximizing"
     * @param {Object} result - {score, move} cần lưu
     */
    storeInTable(key, result) {
        // Kiểm tra giới hạn kích thước
        if (this.transpositionTable.size >= this.maxTableSize) {
            // Xóa entry đầu tiên (cũ nhất) theo FIFO
            const firstKey = this.transpositionTable.keys().next().value;
            this.transpositionTable.delete(firstKey);
        }
        // Lưu entry mới
        this.transpositionTable.set(key, result);
    }
    
    /**
     * ============================================================================
     * TẠO HASH ĐƠN GIẢN CHO GRID
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Tạo chuỗi hash đại diện cho trạng thái grid
     * Dùng làm key cho transposition table
     * 
     * CÁCH HOẠT ĐỘNG:
     * - Ghép type của từng gem thành chuỗi
     * - Vị trí trống = '0'
     * 
     * VÍ DỤ:
     * Grid 3x3:
     * [R][G][B]     hash = "RGBBGRRGB"
     * [B][G][R]
     * [R][G][B]
     * 
     * @param {Grid} grid - Lưới game
     * @returns {string} - Hash string
     */
    getSimpleHash(grid) {
        let hash = '';
        for (let r = 0; r < grid.rows; r++) {
            for (let c = 0; c < grid.cols; c++) {
                const gem = grid.gems[r]?.[c];
                // Ghép type hoặc '0' nếu rỗng
                hash += gem ? gem.type : '0';
            }
        }
        return hash;
    }
    
    /**
     * ============================================================================
     * THIẾT LẬP ĐỘ KHÓ
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Điều chỉnh độ sâu tìm kiếm theo độ khó
     * 
     * ĐỘ SÂU THEO ĐỘ KHÓ:
     * - easy: depth = 2 (nhanh, ít chính xác)
     * - medium: depth = 3 (cân bằng) [mặc định]
     * - hard: depth = 4 (chậm, chính xác)
     * 
     * TÁC ĐỘNG:
     * - Depth cao → xét nhiều nước hơn → thông minh hơn
     * - Depth cao → thời gian tính lâu hơn
     * 
     * @param {string} difficulty - 'easy', 'medium', 'hard'
     */
    setDifficulty(difficulty) {
        switch (difficulty) {
            case 'easy':
                this.maxDepth = 2;
                break;
            case 'medium':
                this.maxDepth = 3;
                break;
            case 'hard':
                this.maxDepth = 4;
                break;
            default:
                this.maxDepth = 3; // Mặc định = medium
        }
    }
    
    /**
     * ============================================================================
     * LẤY THỐNG KÊ HIỆU SUẤT
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Trả về các số liệu thống kê về lần tìm kiếm gần nhất
     * Dùng để debug và tối ưu hiệu suất
     * 
     * @returns {Object} - Thống kê hiệu suất
     *   - nodesExplored: Số nodes đã xét
     *   - evaluationTime: Thời gian tính (ms)
     *   - maxDepth: Độ sâu tối đa đã dùng
     *   - avgTimePerNode: Thời gian trung bình mỗi node (ms)
     */
    getPerformanceStats() {
        return {
            nodesExplored: this.nodeCount,
            evaluationTime: this.evaluationTime,
            maxDepth: this.maxDepth,
            avgTimePerNode: this.nodeCount > 0 ? this.evaluationTime / this.nodeCount : 0
        };
    }
}

/**
 * ============================================================================
 * EXPORT TOÀN CỤC
 * ============================================================================
 * Export class ra window object để sử dụng ở các file khác
 */
if (typeof window !== 'undefined') {
    window.MinimaxSolver = MinimaxSolver;
}