/**
 * ============================================================================
 * HỆ THỐNG GỢI Ý AI (AI Hint System)
 * ============================================================================
 * 
 * MỤC ĐÍCH:
 * - Phân tích bàn cờ Match-3 và gợi ý nước đi tốt nhất cho người chơi
 * - Sử dụng thuật toán Greedy Search kết hợp với đánh giá Heuristic
 * 
 * THUẬT TOÁN CHÍNH: Greedy Search (Tìm kiếm tham lam)
 * - Duyệt qua TẤT CẢ các nước đi có thể
 * - Đánh giá điểm số cho TỪNG nước đi
 * - Chọn nước đi có điểm CAO NHẤT
 * 
 * ĐỘ PHỨC TẠP:
 * - Thời gian: O(M × N) với M = số nước đi, N = kích thước lưới
 * - Không gian: O(N) cho các cấu trúc dữ liệu tạm thời
 * 
 * ============================================================================
 */
class HintSystem {
    /**
     * KHỞI TẠO HỆ THỐNG GỢI Ý
     * 
     * Thiết lập các tham số cấu hình cho thuật toán đánh giá
     */
    constructor() {
        /**
         * ĐỘ SÂU ĐÁNH GIÁ (Evaluation Depth)
         * - Giá trị 1: Chỉ nhìn trước 1 bước (nước đi hiện tại)
         * - Giá trị cao hơn: Xét thêm các nước đi tiếp theo (chưa implement)
         * 
         * LƯU Ý: Tăng độ sâu sẽ tăng độ chính xác nhưng giảm hiệu suất
         */
        this.evaluationDepth = 1;
        
        /**
         * ★ CASCADE PREDICTION FLAG
         * - Khi true: Mô phỏng cascade thực sự để đánh giá chính xác hơn
         * - Khi false: Chỉ ước lượng tiềm năng cascade (nhanh hơn)
         * - Được điều khiển từ UI checkbox "Cascade Prediction"
         */
        this.cascadePredictionEnabled = false;
        
        /**
         * HỆ THỐNG TRỌNG SỐ (Weights System)
         * ============================================
         * Định nghĩa mức độ quan trọng của từng yếu tố khi đánh giá nước đi
         * 
         * CÔNG THỨC TỔNG ĐIỂM:
         * Score = (số_gem_match × matchSize) 
         *       + (số_match_lớn × specialGemBonus)
         *       + (tiềm_năng_cascade × cascadePotential)
         *       + (điểm_vị_trí × positionValue)
         *       + (★ cascade_thực_tế × cascadeActual) // Khi bật Cascade Prediction
         */
        this.weights = {
            /**
             * TRỌNG SỐ KÍCH THƯỚC MATCH (matchSize: 10)
             * - Mỗi gem trong match được tính 10 điểm
             * - Ví dụ: Match 3 gem = 30 điểm, Match 5 gem = 50 điểm
             * - Ý nghĩa: Ưu tiên các nước đi tạo nhiều match
             */
            matchSize: 10,
            
            /**
             * TRỌNG SỐ TIỀM NĂNG CASCADE (cascadePotential: 5)
             * - Cascade = combo liên tiếp khi gem rơi xuống tạo match mới
             * - Mỗi điểm tiềm năng cascade được nhân với 5
             * - Ý nghĩa: Khuyến khích tạo chuỗi combo dài
             */
            cascadePotential: 5,
            
            /**
             * ★ TRỌNG SỐ CASCADE THỰC TẾ (cascadeActual: 25)
             * - Chỉ được dùng khi Cascade Prediction = ON
             * - Mỗi cascade thực sự (từ simulation) được cộng 25 điểm
             * - Cao hơn cascadePotential vì đây là kết quả chính xác, không phải ước lượng
             */
            cascadeActual: 25,
            
            /**
             * TRỌNG SỐ GEM ĐẶC BIỆT (specialGemBonus: 15)
             * - Bonus khi tạo được match ≥ 4 viên (tạo gem đặc biệt)
             * - Match 4 viên → Striped Gem (xóa cả hàng/cột)
             * - Match 5 viên → Rainbow Gem (xóa tất cả gem cùng màu)
             * - Ý nghĩa: Ưu tiên tạo gem đặc biệt vì chúng có sức mạnh lớn
             */
            specialGemBonus: 15,
            
            /**
             * TRỌNG SỐ VỊ TRÍ (positionValue: 2)
             * - Đánh giá dựa trên vị trí của nước đi trên bàn cờ
             * - Vị trí trung tâm được ưu tiên hơn vị trí góc/cạnh
             * - Ý nghĩa: Gem ở trung tâm có nhiều cơ hội tạo combo hơn
             */
            positionValue: 2
        };
    }
    
    /**
     * ★ BẬT/TẮT CASCADE PREDICTION
     * Được gọi từ UIManager khi người dùng toggle checkbox
     * 
     * @param {boolean} enabled - true để bật, false để tắt
     */
    setCascadePrediction(enabled) {
        this.cascadePredictionEnabled = enabled;
        console.log(`🔮 Cascade Prediction: ${enabled ? 'ON' : 'OFF'}`);
    }
    
    /**
     * ★ SO SÁNH KẾT QUẢ CÓ/KHÔNG CASCADE PREDICTION
     * Chạy AI với cả 2 chế độ để người dùng thấy sự khác biệt
     * 
     * @param {Grid} grid - Lưới game
     * @returns {Object} - Kết quả so sánh 2 phương pháp
     */
    compareWithAndWithoutCascade(grid) {
        const startTimeWithout = performance.now();
        
        // 1. Chạy KHÔNG có Cascade Prediction (ước lượng)
        const prevState = this.cascadePredictionEnabled;
        this.cascadePredictionEnabled = false;
        const resultWithout = this.suggestMove(grid);
        const timeWithout = performance.now() - startTimeWithout;
        
        const startTimeWith = performance.now();
        
        // 2. Chạy CÓ Cascade Prediction (mô phỏng)
        this.cascadePredictionEnabled = true;
        const resultWith = this.suggestMove(grid);
        const timeWith = performance.now() - startTimeWith;
        
        // 3. Khôi phục trạng thái
        this.cascadePredictionEnabled = prevState;
        
        // 4. Kiểm tra nước đi có khác nhau không
        const sameMove = resultWithout && resultWith && 
            resultWithout.gem1.row === resultWith.gem1.row &&
            resultWithout.gem1.col === resultWith.gem1.col &&
            resultWithout.gem2.row === resultWith.gem2.row &&
            resultWithout.gem2.col === resultWith.gem2.col;
        
        // 5. Lấy thông tin cascade từ move
        const cascadeInfo = resultWith && resultWith.matchInfo ? 
            (grid.simulateCascades ? grid.simulateCascades({
                gem1: resultWith.gem1,
                gem2: resultWith.gem2
            }, 5) : null) : null;
        
        return {
            // Kết quả không có Cascade Prediction
            without: {
                move: resultWithout,
                score: resultWithout ? resultWithout.evaluationScore : 0,
                time: timeWithout,
                method: 'Ước lượng (Estimate)'
            },
            // Kết quả có Cascade Prediction  
            with: {
                move: resultWith,
                score: resultWith ? resultWith.evaluationScore : 0,
                time: timeWith,
                method: 'Mô phỏng (Simulate)',
                cascadeCount: cascadeInfo ? cascadeInfo.cascadeCount : 0,
                cascadeScore: cascadeInfo ? cascadeInfo.totalScore : 0
            },
            // So sánh
            comparison: {
                sameMove: sameMove,
                scoreDifference: resultWith && resultWithout ? 
                    resultWith.evaluationScore - resultWithout.evaluationScore : 0,
                timeDifference: timeWith - timeWithout,
                recommendation: sameMove ? 
                    '✅ Cả 2 phương pháp chọn cùng nước đi' : 
                    '⚠️ Cascade Prediction tìm ra nước đi tốt hơn!'
            }
        };
    }
    
    /**
     * ============================================================================
     * PHƯƠNG THỨC CHÍNH: GỢI Ý NƯỚC ĐI TỐT NHẤT
     * ============================================================================
     * 
     * THUẬT TOÁN: Greedy Search (Tìm kiếm tham lam)
     * 
     * CÁC BƯỚC THỰC HIỆN:
     * 1. Lấy danh sách TẤT CẢ nước đi có thể từ Grid
     * 2. Khởi tạo nước đi tốt nhất = nước đi đầu tiên
     * 3. Duyệt qua TỪNG nước đi:
     *    - Đánh giá điểm số
     *    - ★ Nếu Cascade Prediction ON: Mô phỏng cascade thực sự
     *    - Nếu điểm > điểm tốt nhất → cập nhật
     * 4. Trả về nước đi có điểm cao nhất kèm thông tin chi tiết
     * 
     * ĐỘ PHỨC TẠP: O(M × N)
     * - M = số nước đi có thể
     * - N = chi phí đánh giá mỗi nước đi
     * 
     * @param {Grid} grid - Đối tượng lưới chứa trạng thái bàn cờ
     * @returns {Object|null} - Thông tin nước đi tốt nhất hoặc null nếu không có
     */
    suggestMove(grid) {
        /**
         * BƯỚC 1: LẤY TẤT CẢ NƯỚC ĐI CÓ THỂ
         * ----------------------------------
         * Gọi phương thức của Grid để tìm tất cả các cặp gem
         * có thể hoán đổi để tạo match hợp lệ
         * 
         * Mỗi move có cấu trúc:
         * {
         *   gem1: {row: số_hàng, col: số_cột},  // Vị trí gem thứ 1
         *   gem2: {row: số_hàng, col: số_cột}   // Vị trí gem thứ 2
         * }
         */
        const possibleMoves = grid.findAllPossibleMoves();
        
        /**
         * KIỂM TRA TRƯỜNG HỢP ĐẶC BIỆT
         * ----------------------------------
         * Nếu không có nước đi nào → bàn cờ bị "bế tắc"
         * Game cần shuffle (xáo trộn) lại bàn cờ
         */
        if (possibleMoves.length === 0) {
            return null;
        }
        
        /**
         * BƯỚC 2: KHỞI TẠO VỚI NƯỚC ĐI ĐẦU TIÊN
         * ----------------------------------
         * Giả định nước đi đầu tiên là tốt nhất
         * Sẽ được cập nhật nếu tìm thấy nước đi tốt hơn
         */
        let bestMove = possibleMoves[0];
        let bestScore = this.evaluateMove(grid, bestMove);
        let bestMatchInfo = this.getMatchInfo(grid, bestMove);
        
        /**
         * BƯỚC 3: DUYỆT VÀ SO SÁNH TẤT CẢ NƯỚC ĐI
         * ----------------------------------
         * Thuật toán Greedy: Chọn nước đi có điểm CAO NHẤT
         * 
         * Với mỗi nước đi:
         * 1. Tính điểm đánh giá
         * 2. So sánh với điểm tốt nhất hiện tại
         * 3. Nếu cao hơn → cập nhật best
         */
        for (let i = 1; i < possibleMoves.length; i++) {
            const moveScore = this.evaluateMove(grid, possibleMoves[i]);
            
            // Nếu điểm cao hơn → cập nhật nước đi tốt nhất
            if (moveScore > bestScore) {
                bestScore = moveScore;
                bestMove = possibleMoves[i];
                bestMatchInfo = this.getMatchInfo(grid, possibleMoves[i]);
            }
        }
        
        /**
         * BƯỚC 4: TRẢ VỀ KẾT QUẢ ĐẦY ĐỦ
         * ----------------------------------
         * Trả về object chứa tất cả thông tin cần thiết cho UI
         */
        return {
            gem1: bestMove.gem1,              // Vị trí gem thứ 1 cần hoán đổi
            gem2: bestMove.gem2,              // Vị trí gem thứ 2 cần hoán đổi
            evaluationScore: bestScore,        // Điểm đánh giá (càng cao càng tốt)
            confidence: this.calculateConfidence(bestScore, possibleMoves.length), // Độ tin cậy (0-100%)
            matchInfo: bestMatchInfo,          // Thông tin chi tiết về matches sẽ được tạo
            reason: this.generateReason(bestMatchInfo)  // Giải thích dạng text cho người chơi
        };
    }
    
    /**
     * ============================================================================
     * PHƯƠNG THỨC ĐÁNH GIÁ NƯỚC ĐI
     * ============================================================================
     * 
     * THUẬT TOÁN: Heuristic Evaluation (Đánh giá dựa trên kinh nghiệm)
     * 
     * CÔNG THỨC TÍNH ĐIỂM:
     * Score = (matches.length × 10)           // Điểm cơ bản từ số gem match
     *       + (count(matchSize ≥ 4) × 15)     // Bonus cho match lớn
     *       + (cascadePotential × 5)          // Điểm từ tiềm năng combo
     *       + (positionScore × 2)             // Điểm từ vị trí
     * 
     * NGUYÊN LÝ MÔ PHỎNG:
     * 1. Thực hiện swap TẠM THỜI để xem kết quả
     * 2. Đánh giá trạng thái sau swap
     * 3. Swap LẠI để khôi phục trạng thái ban đầu
     * 
     * @param {Grid} grid - Lưới game
     * @param {Object} move - Nước đi cần đánh giá {gem1, gem2}
     * @returns {number} - Điểm đánh giá (số càng lớn = nước đi càng tốt)
     */
    evaluateMove(grid, move) {
        /**
         * BƯỚC 1: LẤY THAM CHIẾU ĐẾN 2 GEM
         * ----------------------------------
         * Lấy đối tượng gem từ lưới dựa trên tọa độ row, col
         */
        const gem1 = grid.gems[move.gem1.row][move.gem1.col];
        const gem2 = grid.gems[move.gem2.row][move.gem2.col];
        
        /**
         * BƯỚC 2: BẬT CHẾ ĐỘ MÔ PHỎNG (Simulation Mode)
         * ----------------------------------
         * Simulation mode = true:
         * - Tránh kích hoạt animation khi swap
         * - Tránh phát âm thanh
         * - Đảm bảo tính toán nhanh và không ảnh hưởng UI
         */
        const prevSim = grid.simulationMode;  // Lưu trạng thái cũ
        grid.simulationMode = true;            // Bật mô phỏng
        
        /**
         * BƯỚC 3: THỰC HIỆN SWAP TẠM THỜI
         * ----------------------------------
         * Hoán đổi dữ liệu của 2 gem để đánh giá kết quả
         * LƯU Ý: Chỉ swap dữ liệu, không thay đổi vị trí thực tế
         */
        grid.swapGemsData(gem1, gem2);
        
        /**
         * BƯỚC 4: TÌM CÁC MATCH SAU KHI SWAP
         * ----------------------------------
         * Tìm tất cả các vị trí gem tạo thành match (≥3 gem liên tiếp)
         * Trả về mảng các vị trí: [{row, col}, {row, col}, ...]
         */
        const matches = grid.findMatches();
        
        /**
         * BƯỚC 5: TÍNH ĐIỂM ĐÁNH GIÁ
         * ----------------------------------
         */
        let score = 0;
        
        /**
         * 5a. ĐIỂM CƠ BẢN TỪ SỐ GEM MATCH
         * Công thức: số_gem × trọng_số_matchSize
         * Ví dụ: 5 gems × 10 = 50 điểm
         */
        score += matches.length * this.weights.matchSize;
        
        /**
         * 5b. BONUS CHO MATCH LỚN (≥4 viên)
         * ----------------------------------
         * Match 4 viên = tạo Striped Gem
         * Match 5 viên = tạo Rainbow Gem
         * 
         * Với mỗi match, kiểm tra kích thước:
         * - Nếu ≥ 4 viên → cộng thêm specialGemBonus (15 điểm)
         */
        matches.forEach(match => {
            const matchSize = this.getMatchSize(grid, match);
            if (matchSize >= 4) {
                score += this.weights.specialGemBonus;
            }
        });
        
        /**
         * ★ 5c. CASCADE PREDICTION (Nếu được bật)
         * ----------------------------------
         * Khi Cascade Prediction = ON:
         * - Mô phỏng thực sự cascade bằng Grid.simulateCascades()
         * - Cộng điểm dựa trên số cascade thực tế (chính xác hơn)
         * 
         * Khi Cascade Prediction = OFF:
         * - Chỉ ước lượng tiềm năng cascade (nhanh hơn, ít chính xác)
         */
        if (this.cascadePredictionEnabled && grid.simulateCascades) {
            // ★ MÔ PHỎNG CASCADE THỰC SỰ
            const cascadeResult = grid.simulateCascades(move, 5); // Giới hạn 5 cascade để tối ưu
            
            // Cộng điểm từ cascade thực tế
            score += cascadeResult.cascadeCount * this.weights.cascadeActual;
            
            // Bonus cho gem đặc biệt được tạo từ cascade
            score += cascadeResult.specialGemsCreated * this.weights.specialGemBonus;
            
            // Lưu kết quả cascade vào move để hiển thị
            move._cascadeResult = cascadeResult;
            
            // Debug log
            if (cascadeResult.cascadeCount > 0) {
                console.log(`🔮 Cascade Prediction: Move (${move.gem1.row},${move.gem1.col})↔(${move.gem2.row},${move.gem2.col}) → ${cascadeResult.cascadeCount} cascades, ${cascadeResult.totalScore} pts`);
            }
        } else {
            /**
             * 5c (Fallback). ĐIỂM TỪ TIỀM NĂNG CASCADE (COMBO) - Ước lượng
             * ----------------------------------
             * Cascade xảy ra khi:
             * 1. Gem bị xóa → tạo ô trống
             * 2. Gem phía trên rơi xuống
             * 3. Gem rơi tạo thêm match mới
             * 4. Lặp lại...
             * 
             * Công thức: tiềm_năng × trọng_số_cascadePotential
             */
            score += this.estimateCascades(grid) * this.weights.cascadePotential;
        }
        
        /**
         * 5d. ĐIỂM TỪ VỊ TRÍ NƯỚC ĐI
         * ----------------------------------
         * Vị trí trung tâm bàn cờ được ưu tiên vì:
         * - Có nhiều gem xung quanh hơn
         * - Dễ tạo combo hơn
         * - Ảnh hưởng nhiều gem hơn khi cascade
         * 
         * Công thức: điểm_vị_trí × trọng_số_positionValue
         */
        score += this.evaluatePosition(move) * this.weights.positionValue;
        
        /**
         * BƯỚC 6: KHÔI PHỤC TRẠNG THÁI BAN ĐẦU
         * ----------------------------------
         * QUAN TRỌNG: Phải swap lại để không ảnh hưởng game state
         * Đây là nguyên tắc của mô phỏng: thử nghiệm rồi hoàn tác
         */
        grid.swapGemsData(gem1, gem2);       // Swap lại vị trí ban đầu
        grid.simulationMode = prevSim;        // Khôi phục simulation mode
        
        return score;
    }
    
    /**
     * ============================================================================
     * PHƯƠNG THỨC ĐẾM KÍCH THƯỚC MATCH
     * ============================================================================
     * 
     * THUẬT TOÁN: DFS (Depth-First Search - Tìm kiếm theo chiều sâu)
     * 
     * MỤC ĐÍCH:
     * Đếm số lượng gem liên kết cùng loại từ một vị trí cho trước
     * 
     * NGUYÊN LÝ DFS:
     * 1. Bắt đầu từ gem gốc, đưa vào stack
     * 2. Lặp: lấy gem từ stack, kiểm tra 4 hướng
     * 3. Nếu gem lân cận cùng loại → đưa vào stack
     * 4. Đánh dấu đã thăm để tránh lặp vô hạn
     * 5. Đếm tổng số gem đã thăm
     * 
     * VÍ DỤ MINH HỌA:
     *     🔴 🔵 🔴
     *     🔴 🔴 🔵  → Gọi getMatchSize() tại (0,0)
     *     🔵 🔴 🔵     Kết quả: 4 (có 4 gem đỏ liên kết)
     * 
     * ĐỘ PHỨC TẠP:
     * - Thời gian: O(N) với N = số ô trong lưới
     * - Không gian: O(N) cho visited set và stack
     * 
     * @param {Grid} grid - Lưới game
     * @param {Object} match - Vị trí bắt đầu {row, col}
     * @returns {number} - Số lượng gem liên kết cùng loại
     */
    getMatchSize(grid, match) {
        /**
         * KHỞI TẠO CẤU TRÚC DỮ LIỆU CHO DFS
         */
        const visited = new Set();  // Set lưu các ô đã thăm (tránh lặp)
        const stack = [match];      // Stack cho DFS (LIFO - Last In First Out)
        let count = 0;              // Đếm số gem liên kết
        
        /**
         * VÒNG LẶP DFS CHÍNH
         * Tiếp tục cho đến khi stack rỗng
         */
        while (stack.length > 0) {
            // Lấy phần tử cuối từ stack (đặc trưng của DFS)
            const current = stack.pop();
            
            // Tạo key duy nhất cho mỗi ô: "row,col"
            const key = `${current.row},${current.col}`;
            
            // Bỏ qua nếu đã thăm ô này
            if (visited.has(key)) continue;
            
            // Đánh dấu đã thăm và tăng counter
            visited.add(key);
            count++;
            
            /**
             * KIỂM TRA 4 HƯỚNG LÂN CẬN
             * ----------------------------------
             * directions = [Lên, Xuống, Trái, Phải]
             * [dr, dc] = [thay đổi row, thay đổi col]
             */
            const directions = [
                [-1, 0],  // Lên:    row - 1, col giữ nguyên
                [1, 0],   // Xuống:  row + 1, col giữ nguyên
                [0, -1],  // Trái:   row giữ nguyên, col - 1
                [0, 1]    // Phải:   row giữ nguyên, col + 1
            ];
            
            directions.forEach(([dr, dc]) => {
                const newRow = current.row + dr;
                const newCol = current.col + dc;
                
                // Kiểm tra tọa độ mới có hợp lệ (trong phạm vi lưới)
                if (newRow >= 0 && newRow < grid.rows && 
                    newCol >= 0 && newCol < grid.cols) {
                    
                    const gem = grid.gems[newRow][newCol];          // Gem ở vị trí mới
                    const targetGem = grid.gems[current.row][current.col]; // Gem hiện tại
                    
                    // Nếu gem mới cùng loại → thêm vào stack để xét tiếp
                    if (gem && targetGem && gem.type === targetGem.type) {
                        stack.push({row: newRow, col: newCol});
                    }
                }
            });
        }
        
        return count;
    }
    
    /**
     * ============================================================================
     * PHƯƠNG THỨC ƯỚC LƯỢNG TIỀM NĂNG CASCADE (COMBO)
     * ============================================================================
     * 
     * THUẬT TOÁN: Column Scanning (Quét theo cột)
     * 
     * NGUYÊN LÝ CASCADE:
     * 1. Sau khi match, các gem bị xóa → tạo ô trống
     * 2. Gem phía trên "rơi" xuống lấp đầy ô trống
     * 3. Nếu gem rơi xuống tạo match mới → cascade tiếp
     * 
     * CÁCH ƯỚC LƯỢNG:
     * - Duyệt từng cột từ dưới lên
     * - Đếm số ô trống
     * - Với mỗi gem sẽ rơi, đánh giá tiềm năng tạo match tại vị trí mới
     * 
     * VÍ DỤ:
     * Cột trước:    Cột sau khi rơi:
     *   🔴            ⬜  (gem mới rơi vào)
     *   ⬜            🔴  (rơi xuống 1 ô)
     *   ⬜      →     🔵  (rơi xuống 2 ô)
     *   🔵            🔴
     *   🔴            🔴
     * 
     * @param {Grid} grid - Lưới game
     * @returns {number} - Điểm tiềm năng cascade (số càng cao = tiềm năng combo càng lớn)
     */
    estimateCascades(grid) {
        let cascadePotential = 0;
        
        /**
         * DUYỆT TỪNG CỘT
         * Xét từ cột 0 đến cột cuối
         */
        for (let col = 0; col < grid.cols; col++) {
            let emptySpaces = 0;  // Đếm số ô trống trong cột
            
            /**
             * DUYỆT TỪNG HÀNG TRONG CỘT (TỪ DƯỚI LÊN)
             * Lý do duyệt từ dưới lên:
             * - Ô trống ở dưới → gem ở trên sẽ rơi xuống
             * - Cần biết có bao nhiêu ô trống để tính khoảng cách rơi
             */
            for (let row = grid.rows - 1; row >= 0; row--) {
                if (!grid.gems[row][col]) {
                    // Ô trống → tăng counter
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    // Có gem VÀ có ô trống phía dưới → gem này sẽ rơi
                    // Đánh giá tiềm năng tạo match tại vị trí mới
                    cascadePotential += this.evaluateFallingGem(grid, row, col, emptySpaces);
                }
            }
        }
        
        return cascadePotential;
    }
    
    /**
     * ============================================================================
     * PHƯƠNG THỨC ĐÁNH GIÁ GEM RƠI
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Đánh giá tiềm năng tạo match khi một gem rơi xuống vị trí mới
     * 
     * CÁCH ĐÁNH GIÁ:
     * Kiểm tra 4 hướng tại vị trí MỚI (sau khi rơi):
     * - Nếu có gem cùng loại → +5 điểm mỗi hướng
     * - Nhiều gem cùng loại = tiềm năng tạo match cao
     * 
     * SƠ ĐỒ VỊ TRÍ MỚI:
     *           ↑ (newRow - 1)
     *           |
     *     ← ── GEM ── →
     *           |
     *           ↓ (newRow + 1)
     * 
     * @param {Grid} grid - Lưới game
     * @param {number} row - Hàng hiện tại của gem
     * @param {number} col - Cột của gem
     * @param {number} fallDistance - Khoảng cách rơi (số ô)
     * @returns {number} - Điểm tiềm năng (0-20, mỗi hướng +5)
     */
    evaluateFallingGem(grid, row, col, fallDistance) {
        const gem = grid.gems[row][col];
        if (!gem) return 0;
        
        let potential = 0;
        const newRow = row + fallDistance;  // Vị trí mới sau khi rơi
        
        // Kiểm tra vị trí mới có hợp lệ
        if (newRow < grid.rows) {
            /**
             * KIỂM TRA HÀNG NGANG (TRÁI - PHẢI)
             */
            // Kiểm tra bên TRÁI
            if (col > 0 && grid.gems[newRow][col - 1] && 
                grid.gems[newRow][col - 1].type === gem.type) {
                potential += 5;  // Gem bên trái cùng loại → +5 điểm
            }
            // Kiểm tra bên PHẢI
            if (col < grid.cols - 1 && grid.gems[newRow][col + 1] && 
                grid.gems[newRow][col + 1].type === gem.type) {
                potential += 5;  // Gem bên phải cùng loại → +5 điểm
            }
            
            /**
             * KIỂM TRA HÀNG DỌC (TRÊN - DƯỚI)
             */
            // Kiểm tra phía TRÊN
            if (newRow > 0 && grid.gems[newRow - 1][col] && 
                grid.gems[newRow - 1][col].type === gem.type) {
                potential += 5;  // Gem phía trên cùng loại → +5 điểm
            }
            // Kiểm tra phía DƯỚI
            if (newRow < grid.rows - 1 && grid.gems[newRow + 1][col] && 
                grid.gems[newRow + 1][col].type === gem.type) {
                potential += 5;  // Gem phía dưới cùng loại → +5 điểm
            }
        }
        
        return potential;  // Tối đa 20 điểm (4 hướng × 5 điểm)
    }
    
    /**
     * ============================================================================
     * PHƯƠNG THỨC ĐÁNH GIÁ VỊ TRÍ
     * ============================================================================
     * 
     * THUẬT TOÁN: Manhattan Distance (Khoảng cách Manhattan)
     * 
     * CÔNG THỨC MANHATTAN DISTANCE:
     * d = |x1 - x2| + |y1 - y2|
     * 
     * NGUYÊN LÝ:
     * - Vị trí TRUNG TÂM được ưu tiên cao hơn vị trí GÓC/CẠNH
     * - Lý do: Gem ở trung tâm có nhiều gem xung quanh hơn
     *          → nhiều cơ hội tạo match và combo hơn
     * 
     * CÔNG THỨC ĐIỂM VỊ TRÍ:
     * positionScore = 16 - distance1 - distance2
     * 
     * Trong đó:
     * - distance1 = Manhattan distance từ gem1 đến trung tâm
     * - distance2 = Manhattan distance từ gem2 đến trung tâm
     * 
     * BẢN ĐỒ ĐIỂM VỊ TRÍ (lưới 8x8):
     *    0  1  2  3  4  5  6  7
     *   ┌──────────────────────┐
     * 0 │ 0  1  2  3  4  3  2  1│  ← Điểm thấp (xa trung tâm)
     * 1 │ 1  2  3  4  5  4  3  2│
     * 2 │ 2  3  4  5  6  5  4  3│
     * 3 │ 3  4  5  6  7  6  5  4│
     * 4 │ 4  5  6  7  8  7  6  5│  ← Điểm cao nhất (trung tâm)
     * 5 │ 3  4  5  6  7  6  5  4│
     * 6 │ 2  3  4  5  6  5  4  3│
     * 7 │ 1  2  3  4  5  4  3  2│
     *   └──────────────────────┘
     * 
     * @param {Object} move - Nước đi {gem1: {row, col}, gem2: {row, col}}
     * @returns {number} - Điểm vị trí (0-16, số cao = vị trí tốt)
     */
    evaluatePosition(move) {
        // Tọa độ trung tâm (giả sử lưới 8x8)
        const centerRow = 4;
        const centerCol = 4;
        
        // Tính Manhattan distance cho gem1
        const distance1 = Math.abs(move.gem1.row - centerRow) + Math.abs(move.gem1.col - centerCol);
        
        // Tính Manhattan distance cho gem2
        const distance2 = Math.abs(move.gem2.row - centerRow) + Math.abs(move.gem2.col - centerCol);
        
        // Điểm = 16 - tổng khoảng cách
        // Khoảng cách nhỏ → điểm cao (gần trung tâm)
        // Khoảng cách lớn → điểm thấp (xa trung tâm)
        return (16 - distance1 - distance2);
    }
    
    /**
     * ============================================================================
     * PHƯƠNG THỨC LẤY THÔNG TIN CHI TIẾT MATCH
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Thu thập thông tin chi tiết về các match sẽ được tạo khi thực hiện nước đi
     * 
     * THÔNG TIN TRẢ VỀ:
     * - totalMatches: Tổng số gem trong tất cả matches
     * - matchedGems: Chi tiết từng gem (vị trí, loại)
     * - gemTypes: Các loại gem được match (Set)
     * - estimatedScore: Điểm ước tính
     * - matchSizes: Kích thước từng nhóm match
     * 
     * @param {Grid} grid - Lưới game
     * @param {Object} move - Nước đi cần phân tích
     * @returns {Object} - Thông tin chi tiết về matches
     */
    getMatchInfo(grid, move) {
        /**
         * BƯỚC 1: MÔ PHỎNG NƯỚC ĐI
         * Tương tự như evaluateMove(), swap tạm thời để xem kết quả
         */
        const gem1 = grid.gems[move.gem1.row][move.gem1.col];
        const gem2 = grid.gems[move.gem2.row][move.gem2.col];
        const prevSim = grid.simulationMode;
        grid.simulationMode = true;
        grid.swapGemsData(gem1, gem2);
        
        /**
         * BƯỚC 2: TÌM MATCHES SAU KHI SWAP
         */
        const matches = grid.findMatches();
        
        /**
         * BƯỚC 3: KHỞI TẠO OBJECT THÔNG TIN
         */
        let matchInfo = {
            totalMatches: matches.length,    // Tổng số gem match
            matchedGems: [],                 // Chi tiết từng gem
            gemTypes: new Set(),             // Các loại gem (không trùng lặp)
            estimatedScore: 0,               // Điểm ước tính
            matchSizes: []                   // Kích thước từng nhóm match
        };
        
        /**
         * BƯỚC 4: THU THẬP THÔNG TIN TỪNG GEM
         */
        matches.forEach(match => {
            const gem = grid.gems[match.row][match.col];
            if (gem) {
                // Thêm thông tin chi tiết gem
                matchInfo.matchedGems.push({
                    row: match.row,
                    col: match.col,
                    type: gem.type
                });
                // Thêm loại gem vào Set (tự động loại bỏ trùng lặp)
                matchInfo.gemTypes.add(gem.type);
            }
        });
        
        /**
         * BƯỚC 5: NHÓM MATCHES VÀ TÍNH KÍCH THƯỚC
         * Sử dụng BFS để nhóm các gem liên kết thành từng nhóm riêng
         */
        const matchGroups = this.groupMatches(matches, grid);
        matchInfo.matchSizes = matchGroups.map(group => group.length);
        
        // Tính điểm ước tính: mỗi gem = 10 điểm
        matchInfo.estimatedScore = matchInfo.matchSizes.reduce((sum, size) => sum + size * 10, 0);
        
        /**
         * BƯỚC 6: KHÔI PHỤC TRẠNG THÁI
         */
        grid.swapGemsData(gem1, gem2);
        grid.simulationMode = prevSim;
        
        return matchInfo;
    }
    
    /**
     * ============================================================================
     * PHƯƠNG THỨC TẠO LÝ DO GỢI Ý (DẠNG TEXT)
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Tạo giải thích dạng văn bản cho người chơi hiểu tại sao nên chọn nước đi này
     * 
     * VÍ DỤ KẾT QUẢ:
     * - "Tạo 5 match (bao gồm match 4 viên!) với 💎 → ~50 điểm"
     * - "Tạo 3 match với 🔥 → ~30 điểm"
     * 
     * @param {Object} matchInfo - Thông tin match từ getMatchInfo()
     * @returns {string} - Lý do dạng text tiếng Việt
     */
    generateReason(matchInfo) {
        // Trường hợp không có match
        if (!matchInfo || matchInfo.totalMatches === 0) {
            return "Không có match được tạo";
        }
        
        // Tìm kích thước match lớn nhất
        const maxMatchSize = Math.max(...matchInfo.matchSizes);
        
        // Chuyển Set thành Array để truy cập
        const gemTypeArray = Array.from(matchInfo.gemTypes);
        
        // Biểu tượng emoji cho từng loại gem
        const gemTypeNames = ['💎', '💰', '⭐', '🔥', '💜', '🎯'];
        
        // Xây dựng câu giải thích
        let reason = `Tạo ${matchInfo.totalMatches} match`;
        
        // Thêm thông tin nếu có match lớn (≥4 viên = tạo gem đặc biệt)
        if (maxMatchSize >= 4) {
            reason += ` (bao gồm match ${maxMatchSize} viên!)`;
        }
        
        // Thêm loại gem nếu chỉ có 1 loại
        if (gemTypeArray.length === 1) {
            const gemName = gemTypeNames[gemTypeArray[0] - 1] || '💎';
            reason += ` với ${gemName}`;
        }
        
        // Thêm điểm ước tính
        reason += ` → ~${matchInfo.estimatedScore} điểm`;
        
        return reason;
    }
    
    /**
     * ============================================================================
     * PHƯƠNG THỨC NHÓM MATCHES
     * ============================================================================
     * 
     * THUẬT TOÁN: BFS (Breadth-First Search - Tìm kiếm theo chiều rộng)
     * 
     * MỤC ĐÍCH:
     * Nhóm các gem match liền kề thành các nhóm riêng biệt
     * 
     * VÍ DỤ:
     * Matches = [{0,0}, {0,1}, {0,2}, {3,3}, {3,4}, {3,5}]
     * 
     * Grid:
     *     0   1   2   3   4   5
     * 0   🔴  🔴  🔴  -   -   -    ← Nhóm 1: 3 gem đỏ liền kề
     * 1   -   -   -   -   -   -
     * 2   -   -   -   -   -   -
     * 3   -   -   -   🔵  🔵  🔵  ← Nhóm 2: 3 gem xanh liền kề
     * 
     * Kết quả: groups = [[{0,0},{0,1},{0,2}], [{3,3},{3,4},{3,5}]]
     * 
     * SO SÁNH DFS vs BFS:
     * | Thuật toán | Cấu trúc    | Thao tác | Thứ tự duyệt |
     * |------------|-------------|----------|--------------|
     * | DFS        | Stack       | pop()    | Sâu trước    |
     * | BFS        | Queue       | shift()  | Rộng trước   |
     * 
     * @param {Array} matches - Danh sách vị trí gem match
     * @param {Grid} grid - Lưới game
     * @returns {Array} - Mảng các nhóm, mỗi nhóm là mảng các vị trí
     */
    groupMatches(matches, grid) {
        const groups = [];          // Kết quả: mảng các nhóm
        const visited = new Set();  // Theo dõi gem đã được nhóm
        
        /**
         * DUYỆT TỪNG MATCH
         * Nếu match chưa được nhóm → tạo nhóm mới bằng BFS
         */
        matches.forEach(match => {
            const key = `${match.row},${match.col}`;
            
            // Bỏ qua nếu đã thuộc nhóm khác
            if (visited.has(key)) return;
            
            /**
             * BFS ĐỂ TÌM TẤT CẢ GEM LIÊN KẾT
             */
            const group = [];                                    // Nhóm hiện tại
            const queue = [match];                               // Queue cho BFS (FIFO)
            const targetType = grid.gems[match.row][match.col]?.type;  // Loại gem cần tìm
            
            while (queue.length > 0) {
                // Lấy phần tử đầu từ queue (đặc trưng của BFS)
                const current = queue.shift();
                const currentKey = `${current.row},${current.col}`;
                
                // Bỏ qua nếu đã thăm
                if (visited.has(currentKey)) continue;
                
                // Đánh dấu đã thăm và thêm vào nhóm
                visited.add(currentKey);
                group.push(current);
                
                /**
                 * KIỂM TRA 4 HƯỚNG LÂN CẬN
                 */
                const directions = [[-1,0], [1,0], [0,-1], [0,1]];
                directions.forEach(([dr, dc]) => {
                    const newRow = current.row + dr;
                    const newCol = current.col + dc;
                    const newKey = `${newRow},${newCol}`;
                    
                    // Điều kiện để thêm vào queue:
                    // 1. Chưa được thăm
                    // 2. Nằm trong danh sách matches
                    // 3. Cùng loại gem
                    if (!visited.has(newKey) && 
                        matches.some(m => m.row === newRow && m.col === newCol) &&
                        grid.gems[newRow]?.[newCol]?.type === targetType) {
                        queue.push({ row: newRow, col: newCol });
                    }
                });
            }
            
            // Thêm nhóm vào kết quả (nếu không rỗng)
            if (group.length > 0) {
                groups.push(group);
            }
        });
        
        return groups;
    }
    
    /**
     * ============================================================================
     * PHƯƠNG THỨC TÍNH ĐỘ TIN CẬY
     * ============================================================================
     * 
     * MỤC ĐÍCH:
     * Tính độ tin cậy (0-100%) cho gợi ý, giúp người chơi biết nên tin tưởng bao nhiêu
     * 
     * CÔNG THỨC:
     * Confidence = min(0.7 × baseConf + 0.3 × choiceConf, 100)
     * 
     * Trong đó:
     * - baseConf = min(bestScore / 50, 1) × 100
     *   → Điểm cao = tin cậy cao
     * 
     * - choiceConf = max(0, 100 - (totalMoves - 1) × 5)
     *   → Ít lựa chọn = tin cậy cao (nước đi rõ ràng)
     *   → Nhiều lựa chọn = tin cậy thấp (có thể có nước tốt hơn)
     * 
     * BẢNG VÍ DỤ:
     * | bestScore | totalMoves | baseConf | choiceConf | Confidence |
     * |-----------|------------|----------|------------|------------|
     * | 30        | 5          | 60%      | 80%        | 66%        |
     * | 50        | 3          | 100%     | 90%        | 97%        |
     * | 80        | 10         | 100%     | 55%        | 86.5%      |
     * | 20        | 20         | 40%      | 5%         | 29.5%      |
     * 
     * @param {number} bestScore - Điểm của nước đi tốt nhất
     * @param {number} totalMoves - Tổng số nước đi có thể
     * @returns {number} - Độ tin cậy (0-100%)
     */
    calculateConfidence(bestScore, totalMoves) {
        // Trường hợp đặc biệt: không có nước đi
        if (totalMoves === 0) return 0;
        
        /**
         * THÀNH PHẦN 1: Độ tin cậy dựa trên điểm số (70% trọng số)
         * - Điểm cao → tin cậy cao
         * - Đạt 100% khi bestScore ≥ 50
         */
        const baseConfidence = Math.min(bestScore / 50, 1) * 100;
        
        /**
         * THÀNH PHẦN 2: Độ tin cậy dựa trên số lựa chọn (30% trọng số)
         * - Ít lựa chọn → tin cậy cao (nước đi rõ ràng nhất)
         * - Mỗi lựa chọn thêm giảm 5%
         * - Tối thiểu 0%
         */
        const choiceConfidence = Math.max(0, 100 - (totalMoves - 1) * 5);
        
        /**
         * KẾT HỢP 2 THÀNH PHẦN
         * - 70% từ điểm số
         * - 30% từ số lựa chọn
         * - Giới hạn tối đa 100%
         */
        return Math.min(baseConfidence * 0.7 + choiceConfidence * 0.3, 100);
    }
}

/**
 * ============================================================================
 * EXPORT MODULE
 * ============================================================================
 * Xuất class ra window để có thể sử dụng từ các file JavaScript khác
 */
if (typeof window !== 'undefined') {
    window.HintSystem = HintSystem;
}