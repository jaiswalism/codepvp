import React, { useEffect, useState } from 'react';


// --- Helper Functions ---
const random = (min: number, max: number): number => Math.random() * (max - min) + min;
const map = (n: number, start1: number, end1: number, start2: number, end2: number): number => {
  return ((n - start1) / (end1 - start1)) * (end2 - start2) + start2;
};

class CodeParticle3D {
  x: number;
  y: number;
  z: number;
  character: string;
  color: string;
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  
  // A pool of characters for the digital rain effect
  static characters = "{}[]()</>01|&^%;:!*+=-_?#$@";

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.x = random(-this.canvasWidth, this.canvasWidth);
    this.y = random(-this.canvasHeight, this.canvasHeight);
    this.z = random(0, this.canvasWidth); // Z-axis for depth
    this.character = CodeParticle3D.characters[Math.floor(Math.random() * CodeParticle3D.characters.length)];
    this.color = `hsl(${random(160, 220)}, 90%, 65%)`;
  }

  draw() {
    this.ctx.save();
    const scale = this.canvasWidth / (this.canvasWidth + this.z);
    const screenX = this.x * scale + this.canvasWidth / 2;
    const screenY = this.y * scale + this.canvasHeight / 2;
    const fontSize = Math.max(1, scale * 25);
    const alpha = map(this.z, 0, this.canvasWidth, 1, 0.1);

    this.ctx.font = `${fontSize}px "monospace"`;
    this.ctx.fillStyle = `hsla(${random(160, 220)}, 90%, 65%, ${alpha})`;
    this.ctx.fillText(this.character, screenX, screenY);
    this.ctx.restore();
  }

  update() {
    // Move particle towards the viewer
    this.z -= 4;

    // Reset particle when it moves past the viewer
    if (this.z < 1) {
      this.z = this.canvasWidth;
      this.x = random(-this.canvasWidth, this.canvasWidth);
      this.y = random(-this.canvasHeight, this.canvasHeight);
    }
    
    // Occasionally change character for a glitchy feel
    if (Math.random() > 0.99) {
       this.character = CodeParticle3D.characters[Math.floor(Math.random() * CodeParticle3D.characters.length)];
    }
  }
}

// --- Glitchy Title Component ---
const GlitchTitle: React.FC<{ text: string }> = ({ text }) => {
    const [glitchText, setGlitchText] = useState(text);

    useEffect(() => {
        const interval = setInterval(() => {
            let newText = "";
            for (let i = 0; i < text.length; i++) {
                if (Math.random() > 0.85) {
                    newText += CodeParticle3D.characters[Math.floor(Math.random() * CodeParticle3D.characters.length)];
                } else {
                    newText += text[i];
                }
            }
            setGlitchText(newText);
        }, 100);

        return () => clearInterval(interval);
    }, [text]);

    return (
        <h1 
          className="text-7xl md:text-9xl font-extrabold mb-4 text-cyan-300 relative"
          style={{ textShadow: `0 0 10px #0ff, 0 0 20px #0ff, 0 0 40px #f0f` }}
        >
          {glitchText}
          <span className="absolute top-0 left-0 w-full h-full text-red-500 opacity-80" style={{ clipPath: 'inset(50% 0 0 0)', textShadow: '-2px -2px 5px #f00' }}>{glitchText}</span>
          <span className="absolute top-0 left-0 w-full h-full text-blue-500 opacity-80" style={{ clipPath: 'inset(0 0 50% 0)', textShadow: '2px 2px 5px #00f' }}>{glitchText}</span>
        </h1>
    );
};

export default GlitchTitle