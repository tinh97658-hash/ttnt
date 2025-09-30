/**
 * MathUtils - Utility functions for mathematical operations
 * Used throughout the game for calculations and algorithms
 */
class MathUtils {
    // Linear interpolation
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    
    // Clamp value between min and max
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    // Distance between two points
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Random integer between min and max (inclusive)
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    // Random float between min and max
    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    // Convert degrees to radians
    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }
    
    // Convert radians to degrees
    static radToDeg(radians) {
        return radians * 180 / Math.PI;
    }
    
    // Easing functions for animations
    static easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    static easeIn(t) {
        return t * t;
    }
    
    static easeOut(t) {
        return t * (2 - t);
    }
    
    // Normalize value from one range to another
    static normalize(value, min, max, newMin = 0, newMax = 1) {
        const normalized = (value - min) / (max - min);
        return newMin + normalized * (newMax - newMin);
    }
    
    // Check if point is in rectangle
    static pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    }
    
    // Manhattan distance (for grid-based games)
    static manhattanDistance(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }
    
    // Array shuffle (Fisher-Yates)
    static shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    // Get random element from array
    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    // Simple hash function for state representation
    static simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash;
    }
    
    // Sigmoid function (useful for AI)
    static sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }
    
    // Softmax function (useful for AI decision making)
    static softmax(values) {
        const maxVal = Math.max(...values);
        const expValues = values.map(v => Math.exp(v - maxVal));
        const sum = expValues.reduce((a, b) => a + b, 0);
        return expValues.map(v => v / sum);
    }
    
    // Matrix operations for AI algorithms
    static matrixMultiply(a, b) {
        const rows = a.length;
        const cols = b[0].length;
        const result = Array(rows).fill().map(() => Array(cols).fill(0));
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                for (let k = 0; k < b.length; k++) {
                    result[i][j] += a[i][k] * b[k][j];
                }
            }
        }
        
        return result;
    }
    
    // Create identity matrix
    static identityMatrix(size) {
        const matrix = Array(size).fill().map(() => Array(size).fill(0));
        for (let i = 0; i < size; i++) {
            matrix[i][i] = 1;
        }
        return matrix;
    }
    
    // Performance timing utilities
    static timeFunction(func, iterations = 1) {
        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
            func();
        }
        const end = performance.now();
        return (end - start) / iterations;
    }
    
    // Weighted random selection
    static weightedRandom(items, weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return items[i];
            }
        }
        
        return items[items.length - 1];
    }
}