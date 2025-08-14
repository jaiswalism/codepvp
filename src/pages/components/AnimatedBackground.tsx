import React, { useEffect, useRef } from 'react';

// --- Helper Functions ---
const random = (min: number, max: number): number => Math.random() * (max - min) + min;
const map = (n: number, start1: number, end1: number, start2: number, end2: number): number => {
  return ((n - start1) / (end1 - start1)) * (end2 - start2) + start2;
};

// --- 3D Code Particle Class ---
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

// --- Animated Background Component ---
const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: CodeParticle3D[] = [];
    let animationFrameId: number;

    const backgroundImage = new Image();
    backgroundImage.src = '/assets/homeScreenBG.jpeg'

    const setup = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      const particleCount = Math.floor(canvas.width / 4); 
      for (let i = 0; i < particleCount; i++) {
        particles.push(new CodeParticle3D(ctx, canvas.width, canvas.height));
      }
    };

    const animate = () => {
      // Draw the background image first, stretched to fit the canvas
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
      // Then draw a semi-transparent overlay for the trail effect and to blend the image
      ctx.fillStyle = 'rgba(10, 10, 25, 0.45)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      animationFrameId = window.requestAnimationFrame(animate);
    };

    const handleResize = () => {
      // Only re-run setup if the image has fully loaded
      if (backgroundImage.complete) {
        setup();
      }
    };
    
    // Wait for the image to load before starting the animation
    backgroundImage.onload = () => {
      setup();
      animate();
    };

    // Handle cases where the image is already cached by the browser
    if (backgroundImage.complete) {
      backgroundImage.onload = null; // Prevent re-triggering
      setup();
      animate();
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 bg-gray-900" />;
};

export default AnimatedBackground;