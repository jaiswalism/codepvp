import React, { useEffect, useRef, useState } from 'react';

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

// --- Navigation Button with Icon ---
const NavButton: React.FC<{ children: React.ReactNode; href?: string; icon: React.ReactNode }> = ({ children, href = '#', icon }) => (
  <a
    href={href}
    className="
      group relative flex items-center justify-center gap-4
      text-xl font-bold text-cyan-300 
      border-2 border-cyan-400/50 rounded-lg 
      px-6 py-3
      transition-all duration-300 
      hover:border-cyan-300
      hover:shadow-[0_0_20px_rgba(56,189,248,0.7)]
      focus:outline-none focus:ring-4 focus:ring-cyan-500
      transform hover:scale-105
    "
  >
    <span className="absolute top-0 left-0 w-full h-full bg-cyan-400/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
    <span className="relative flex items-center gap-3">
        {icon}
        {children}
    </span>
  </a>
);

// --- Main App Component ---
export default function Home() {
  return (
    <div className="relative min-h-screen bg-gray-900 text-white flex items-center justify-center overflow-hidden font-mono">
      <AnimatedBackground />
      
      <div className="z-10 flex flex-col items-center text-center p-8 max-w-4xl
        bg-black/30 backdrop-blur-md 
        border border-cyan-400/20 rounded-xl
        shadow-2xl shadow-cyan-500/10">

        <GlitchTitle text="CodePvP" />
        
        <p className="text-lg md:text-xl text-purple-300 mb-12 max-w-2xl">
          The ultimate competitive coding arena. Challenge your mind, crush the competition.
        </p>

        <nav className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <NavButton icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 12v-1"></path><path d="M12 8v1"></path></svg>}>
            Single Player
          </NavButton>
          <NavButton icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7.5" r="4.5"></circle><path d="M22 11v-2a4 4 0 0 0-4-4H7"></path></svg>}>
            Multiplayer
          </NavButton>
          <NavButton icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>}>
            About Us
          </NavButton>
          <NavButton href="https://github.com" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>}>
            Github
          </NavButton>
        </nav>
      </div>
    </div>
  );
}
