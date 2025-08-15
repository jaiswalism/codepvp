import AnimatedBackground from './components/AnimatedBackground';
import GlitchTitle from './components/GlitchTitle';
import NavButton from './components/NavButton';


// --- Main App Component ---
export default function Home() {
  return (
    <div className="min-h-screen text-white flex items-center justify-center overflow-hidden font-mono">
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
          <NavButton href="/SinglePlayer" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 12v-1"></path><path d="M12 8v1"></path></svg>}>
            Single Player
          </NavButton>
          <NavButton icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7.5" r="4.5"></circle><path d="M22 11v-2a4 4 0 0 0-4-4H7"></path></svg>}>
            Multiplayer
          </NavButton>
          <NavButton icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>}>
            About Us
          </NavButton>
          <NavButton href="https://github.com/DevanshuTripathi/codepvp" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>}>
            Github
          </NavButton>
        </nav>
      </div>
    </div>
  );
}
