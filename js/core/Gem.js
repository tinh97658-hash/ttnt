/**
 * Gem Class - Represents individual diamond gems
 * Contains properties for color, position, and state
 */
class Gem {
    constructor(row, col, type = null) {
        this.row = row;
        this.col = col;
        this.type = type || this.generateRandomType();
        this.x = col * 60; // Pixel position
        this.y = row * 60;
        this.size = 50;
        this.selected = false;
        this.matched = false;
        this.falling = false;
        
        // Animation properties
        this.targetX = this.x;
        this.targetY = this.y;
        this.animating = false;
        
        // Destruction properties
        this.destroying = false;
        this.destructionStartTime = 0;
        this.destructionType = null; // 'bomb', 'lightning', 'rainbow'
        
        // Gem types với colors
        this.colors = {
            1: '#e11d48', // Red diamond
            2: '#0ea5e9', // Blue diamond  
            3: '#22c55e', // Green diamond
            4: '#f59e0b', // Yellow diamond
            5: '#a855f7', // Purple diamond
            6: '#f97316', // Orange diamond
        };
        
        // Special gem types for AI features
        this.isSpecial = false;
        this.specialType = null; // 'bomb', 'lightning', 'rainbow'
    }
    
    generateRandomType() {
        return Math.floor(Math.random() * 6) + 1;
    }
    
    getColor() {
        return this.colors[this.type] || '#64748b';
    }
    
    // Drawing method for canvas rendering
    draw(ctx) {
        // Draw destruction animation if destroying
        if (this.destroying) {
            this.drawDestructionEffect(ctx);
            return; // Don't draw normal gem while destroying
        }
        
        const color = this.getColor();
        
        // Draw shadow
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x + 25, this.y + 25 + 3, 22, 18, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
        
        // Draw gem body
        ctx.save();
        
        // Selection highlight
        if (this.selected) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - 2, this.y - 2, this.size + 4, this.size + 4);
        }
        
        // AI Hint highlight - subtle pulse only
        if (this.isHinted) {
            const time = Date.now();
            const pulse = Math.sin(time / 400) * 0.25 + 0.5; // softer range 0.25..0.75
            ctx.save();
            ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
            ctx.lineWidth = 4;
            ctx.strokeRect(this.x - 3, this.y - 3, this.size + 6, this.size + 6);
            ctx.restore();
        }
        
        // Gem gradient
        const gradient = ctx.createRadialGradient(
            this.x + 15, this.y + 15, 5,
            this.x + 25, this.y + 25, 25
        );
        gradient.addColorStop(0, this.lightenColor(color, 40));
        gradient.addColorStop(0.7, color);
        gradient.addColorStop(1, this.darkenColor(color, 20));
        
        ctx.fillStyle = gradient;
        
        // Draw diamond shape
        this.drawDiamond(ctx);
        
        // Special gem border/outline
        if (this.isSpecial) {
            const centerX = this.x + this.size / 2;
            const centerY = this.y + this.size / 2;
            const time = Date.now();
            const pulse = Math.sin(time * 0.003) * 0.3 + 0.7;
            
            ctx.strokeStyle = this.specialType === 'bomb' ? `rgba(255, 50, 50, ${pulse})` :
                             this.specialType === 'lightning' ? `rgba(100, 200, 255, ${pulse})` :
                             this.specialType === 'rainbow' ? `rgba(255, 255, 255, ${pulse})` :
                             `rgba(255, 255, 255, ${pulse})`;
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - 3, this.y - 3, this.size + 6, this.size + 6);
            
            // Draw special effect animation
            this.drawSpecialEffect(ctx);
        }
        
        // Matched animation
        if (this.matched) {
            ctx.globalAlpha = 0.7;
            ctx.filter = 'brightness(150%)';
        }
        
        ctx.restore();
    }
    
    drawDiamond(ctx) {
        const centerX = this.x + this.size / 2;
        const centerY = this.y + this.size / 2;
        const radius = this.size * 0.4;
        
        ctx.beginPath();
        // Diamond points
        ctx.moveTo(centerX, centerY - radius); // Top
        ctx.lineTo(centerX + radius * 0.7, centerY - radius * 0.3); // Top right
        ctx.lineTo(centerX + radius, centerY + radius * 0.3); // Bottom right
        ctx.lineTo(centerX, centerY + radius); // Bottom
        ctx.lineTo(centerX - radius, centerY + radius * 0.3); // Bottom left
        ctx.lineTo(centerX - radius * 0.7, centerY - radius * 0.3); // Top left
        ctx.closePath();
        ctx.fill();
        
        // Inner highlight
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius);
        ctx.lineTo(centerX + radius * 0.3, centerY - radius * 0.1);
        ctx.lineTo(centerX, centerY + radius * 0.2);
        ctx.lineTo(centerX - radius * 0.3, centerY - radius * 0.1);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
    }
    
    drawSpecialEffect(ctx) {
        // Skip rendering if gem is off-screen (performance optimization)
        if (this.y < -60 || this.y > 540 || this.x < -60 || this.x > 540) {
            return;
        }
        
        const centerX = this.x + this.size / 2;
        const centerY = this.y + this.size / 2;
        const time = Date.now();
        
        ctx.save();
        
        if (this.specialType === 'bomb') {
            // Bomb: pulsing red glow with spark particles
            const pulse = Math.sin(time * 0.005) * 0.3 + 0.7;
            ctx.strokeStyle = `rgba(255, 50, 50, ${pulse})`;
            ctx.fillStyle = `rgba(255, 100, 0, ${pulse * 0.3})`;
            ctx.lineWidth = 3;
            
            // Draw explosive circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Draw explosion particles
            for (let i = 0; i < 6; i++) {
                const angle = (time * 0.003) + (i * Math.PI / 3);
                const dist = 18 + Math.sin(time * 0.008 + i) * 5;
                const x = centerX + Math.cos(angle) * dist;
                const y = centerY + Math.sin(angle) * dist;
                
                ctx.fillStyle = `rgba(255, ${100 + i * 20}, 0, ${pulse})`;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
        } else if (this.specialType === 'lightning') {
            // Lightning: electric blue with zigzag bolts
            const pulse = Math.sin(time * 0.008) * 0.4 + 0.6;
            ctx.strokeStyle = `rgba(100, 200, 255, ${pulse})`;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.9;
            
            // Draw lightning bolts
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI / 2) + (time * 0.002);
                const startX = centerX + Math.cos(angle) * 8;
                const startY = centerY + Math.sin(angle) * 8;
                const endX = centerX + Math.cos(angle) * 25;
                const endY = centerY + Math.sin(angle) * 25;
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                
                // Zigzag effect
                const midX = (startX + endX) / 2 + Math.sin(time * 0.01 + i) * 5;
                const midY = (startY + endY) / 2 + Math.cos(time * 0.01 + i) * 5;
                ctx.lineTo(midX, midY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
            
            // Central glow
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 15);
            gradient.addColorStop(0, `rgba(200, 230, 255, ${pulse * 0.8})`);
            gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(centerX - 15, centerY - 15, 30, 30);
            
        } else if (this.specialType === 'rainbow') {
            // Rainbow: cycling colors with shimmer
            ctx.globalAlpha = 0.8;
            
            // Draw rainbow ring
            for (let i = 0; i < 6; i++) {
                const angle = (time * 0.002) + (i * Math.PI / 3);
                const hue = (time * 0.1 + i * 60) % 360;
                const x = centerX + Math.cos(angle) * 18;
                const y = centerY + Math.sin(angle) * 18;
                
                ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Central star
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = `hsl(${(time * 0.2) % 360}, 100%, 70%)`;
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI / 5) - Math.PI / 2 + (time * 0.003);
                const outerRadius = 12;
                const innerRadius = 6;
                
                const x1 = centerX + Math.cos(angle) * outerRadius;
                const y1 = centerY + Math.sin(angle) * outerRadius;
                const x2 = centerX + Math.cos(angle + Math.PI / 5) * innerRadius;
                const y2 = centerY + Math.sin(angle + Math.PI / 5) * innerRadius;
                
                if (i === 0) ctx.moveTo(x1, y1);
                else ctx.lineTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
        } else {
            // Default special effect (original sparkle)
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8;
            
            // Rotating sparkle effect
            const rotation = time * 0.003;
            for (let i = 0; i < 4; i++) {
                const angle = rotation + (i * Math.PI / 2);
                const x1 = centerX + Math.cos(angle) * 15;
                const y1 = centerY + Math.sin(angle) * 15;
                const x2 = centerX + Math.cos(angle) * 25;
                const y2 = centerY + Math.sin(angle) * 25;
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
    
    drawDestructionEffect(ctx) {
        const elapsed = Date.now() - this.destructionStartTime;
        const duration = 400; // 400ms destruction animation
        const progress = Math.min(elapsed / duration, 1);
        
        if (progress >= 1) return; // Animation complete
        
        const centerX = this.x + this.size / 2;
        const centerY = this.y + this.size / 2;
        
        ctx.save();
        
        // Different effects based on destruction type
        switch (this.destructionType) {
            case 'bomb':
                // Explosive shatter with fire particles
                const explodeScale = 1 + progress * 2;
                const explodeAlpha = 1 - progress;
                
                ctx.globalAlpha = explodeAlpha;
                
                // Draw exploding gem
                const color = this.colors[this.type];
                ctx.fillStyle = color;
                ctx.translate(centerX, centerY);
                ctx.scale(explodeScale, explodeScale);
                ctx.translate(-centerX, -centerY);
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
                ctx.fill();
                
                // Fire particles
                for (let i = 0; i < 8; i++) {
                    const angle = (i * Math.PI / 4);
                    const dist = progress * 40;
                    const px = centerX + Math.cos(angle) * dist;
                    const py = centerY + Math.sin(angle) * dist;
                    
                    ctx.fillStyle = `rgba(255, ${150 - progress * 100}, 0, ${explodeAlpha})`;
                    ctx.beginPath();
                    ctx.arc(px, py, 4 * (1 - progress), 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'lightning':
                // Electric dissolution with spark trails
                ctx.globalAlpha = 1 - progress;
                
                // Draw gem fading with electric glow
                const gemColor = this.colors[this.type];
                ctx.fillStyle = gemColor;
                ctx.beginPath();
                ctx.arc(centerX, centerY, 20 * (1 - progress * 0.5), 0, Math.PI * 2);
                ctx.fill();
                
                // Electric sparks (reduced from 6 to 4 for performance)
                const sparkCount = 4;
                for (let i = 0; i < sparkCount; i++) {
                    const angle = (i * Math.PI * 2 / sparkCount) + (progress * Math.PI);
                    const dist = progress * 30;
                    const sx = centerX + Math.cos(angle) * dist;
                    const sy = centerY + Math.sin(angle) * dist;
                    
                    ctx.strokeStyle = `rgba(100, 200, 255, ${1 - progress})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.lineTo(sx, sy);
                    ctx.stroke();
                }
                break;
                
            case 'rainbow':
                // Color-shifting fade with rainbow particles
                const fadeAlpha = 1 - progress;
                const hueShift = progress * 360;
                
                ctx.globalAlpha = fadeAlpha;
                
                // Rainbow ring expanding (reduced from 6 to 4 for performance)
                for (let i = 0; i < 4; i++) {
                    const angle = (i * Math.PI / 2);
                    const radius = 20 + progress * 30;
                    const px = centerX + Math.cos(angle) * radius;
                    const py = centerY + Math.sin(angle) * radius;
                    const hue = (hueShift + i * 60) % 360;
                    
                    ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
                    ctx.beginPath();
                    ctx.arc(px, py, 6 * (1 - progress), 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Center gem fading with color shift
                ctx.fillStyle = `hsl(${hueShift}, 80%, 60%)`;
                ctx.beginPath();
                ctx.arc(centerX, centerY, 15 * (1 - progress), 0, Math.PI * 2);
                ctx.fill();
                break;
                
            default:
                // Default destruction: simple fade and shrink
                const defAlpha = 1 - progress;
                const defScale = 1 - progress * 0.7;
                
                ctx.globalAlpha = defAlpha;
                ctx.fillStyle = this.colors[this.type];
                ctx.translate(centerX, centerY);
                ctx.scale(defScale, defScale);
                ctx.translate(-centerX, -centerY);
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
    
    // Start destruction animation
    startDestruction(type = null) {
        this.destroying = true;
        this.destructionStartTime = Date.now();
        this.destructionType = type;
    }
    
    // Check if destruction animation is complete
    isDestructionComplete() {
        if (!this.destroying) return true;
        const elapsed = Date.now() - this.destructionStartTime;
        return elapsed >= 400;
    }
    
    // Utility methods for color manipulation
    lightenColor(color, amount) {
        const usePound = color[0] === '#';
        const col = usePound ? color.slice(1) : color;
        const num = parseInt(col, 16);
        let r = (num >> 16) + amount;
        let g = (num >> 8 & 0x00FF) + amount;
        let b = (num & 0x0000FF) + amount;
        r = r > 255 ? 255 : r;
        g = g > 255 ? 255 : g;
        b = b > 255 ? 255 : b;
        return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
    }
    
    darkenColor(color, amount) {
        const usePound = color[0] === '#';
        const col = usePound ? color.slice(1) : color;
        const num = parseInt(col, 16);
        let r = (num >> 16) - amount;
        let g = (num >> 8 & 0x00FF) - amount;
        let b = (num & 0x0000FF) - amount;
        r = r < 0 ? 0 : r;
        g = g < 0 ? 0 : g;
        b = b < 0 ? 0 : b;
        return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
    }
    
    // Animation methods
    animateTo(x, y, duration = 300) {
        this.targetX = x;
        this.targetY = y;
        this.animating = true;
        
        const startTime = Date.now();
        const startX = this.x;
        const startY = this.y;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            this.x = startX + (this.targetX - startX) * easeProgress;
            this.y = startY + (this.targetY - startY) * easeProgress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.animating = false;
                this.x = this.targetX;
                this.y = this.targetY;
            }
        };
        
        animate();
    }
    
    // Check if gem contains a point (for mouse interaction)
    contains(x, y) {
        return x >= this.x && x <= this.x + this.size &&
               y >= this.y && y <= this.y + this.size;
    }
    
    // Create a copy of this gem
    clone() {
        const newGem = new Gem(this.row, this.col, this.type);
        newGem.x = this.x;
        newGem.y = this.y;
        newGem.isSpecial = this.isSpecial;
        newGem.specialType = this.specialType;
        return newGem;
    }
    
    // AI utility methods
    equals(otherGem) {
        return otherGem && this.type === otherGem.type;
    }
    
    // Get serializable data for AI algorithms
    serialize() {
        return {
            row: this.row,
            col: this.col,
            type: this.type,
            isSpecial: this.isSpecial,
            specialType: this.specialType
        };
    }
    
    // Create gem from serialized data
    static deserialize(data) {
        const gem = new Gem(data.row, data.col, data.type);
        gem.isSpecial = data.isSpecial;
        gem.specialType = data.specialType;
        return gem;
    }
}

// Explicitly export to window
if (typeof window !== 'undefined') {
    window.Gem = Gem;
}