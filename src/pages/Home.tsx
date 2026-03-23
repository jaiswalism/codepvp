import AnimatedBackground from './components/AnimatedBackground';
import GlitchTitle from './components/GlitchTitle';
import NavButton from './components/NavButton';
import { Link } from 'react-router-dom';
import { Trophy, User, Users, LayoutDashboard, Atom } from 'lucide-react'; // Suggested: Standardize icons

export default function Home() {
  return (
    <div className="min-h-screen text-white flex items-center justify-center overflow-hidden font-mono">
      <AnimatedBackground />
      
      <div className="z-10 flex flex-col items-center text-center p-8 max-w-4xl w-full
        bg-black/30 backdrop-blur-md 
        border border-cyan-400/20 rounded-xl
        shadow-2xl shadow-cyan-500/10">

        <GlitchTitle text="CodePvP" />
        
        <p className="text-lg md:text-xl text-purple-300 mb-10 max-w-2xl">
          The ultimate competitive coding arena. Challenge your mind, crush the competition.
        </p>

        <div className="w-full flex flex-col gap-6">
          
          {/* TOURNAMENT HERO BUTTON */}
          <Link to="/tournaments" className="w-full">
            <button className="w-full relative overflow-hidden group bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-amber-500/10 border-2 border-amber-500/50 rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:border-amber-400 flex items-center justify-center gap-4">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <Trophy className="w-8 h-8 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              <div className="flex flex-col items-start">
                <span className="text-2xl font-black text-amber-400 tracking-widest uppercase italic">Tournaments</span>
                <span className="text-sm text-amber-200/70 font-medium">Compete for glory and prizes</span>
              </div>
            </button>
          </Link>

          {/* STANDARD GRID */}
          <nav className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <Link to="/SinglePlayer" className="w-full">
              <NavButton icon={<User className="w-6 h-6" />}>
                Single Player
              </NavButton>
            </Link>

            <Link to="/MultiPlayer" className="w-full">
              <NavButton icon={<Users className="w-6 h-6" />}>
                Multiplayer
              </NavButton>
            </Link>

            <Link to="/Dashboard" className="w-full">
              <NavButton icon={<LayoutDashboard className="w-6 h-6" />}>
                Dashboard
              </NavButton>
            </Link>

            <Link to="/PixelPvP" className="w-full">
              <NavButton icon={<Atom className="w-6 h-6" />}>
                Pixel PvP
              </NavButton>
            </Link>
          </nav>
          
        </div>
      </div>
    </div>
  );
}