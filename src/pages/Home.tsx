import React from 'react';
import AnimatedBackground from './components/AnimatedBackground';
import GlitchTitle from './components/GlitchTitle';
import { Link } from 'react-router-dom';
import { Trophy, User, Users, LayoutDashboard, Atom, Flame, ChevronRight } from 'lucide-react';

// Unified styling logic for the Bento Cards
const colorMap = {
  amber: 'group-hover:border-amber-500/50 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] text-amber-400',
  orange: 'group-hover:border-orange-500/50 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.2)] text-orange-500',
  cyan: 'group-hover:border-cyan-500/50 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] text-cyan-400',
  purple: 'group-hover:border-purple-500/50 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] text-purple-400',
  emerald: 'group-hover:border-emerald-500/50 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] text-emerald-400',
  pink: 'group-hover:border-pink-500/50 group-hover:shadow-[0_0_30px_rgba(236,72,153,0.2)] text-pink-400',
};

const bgGlowMap = {
  amber: 'from-amber-500/0 via-amber-500/5 to-amber-500/0',
  orange: 'from-orange-500/0 via-orange-500/5 to-orange-500/0',
  cyan: 'from-cyan-500/0 via-cyan-500/5 to-cyan-500/0',
  purple: 'from-purple-500/0 via-purple-500/5 to-purple-500/0',
  emerald: 'from-emerald-500/0 via-emerald-500/5 to-emerald-500/0',
  pink: 'from-pink-500/0 via-pink-500/5 to-pink-500/0',
};

interface BentoCardProps {
  to: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  theme: keyof typeof colorMap;
  className?: string;
  isLarge?: boolean;
}

const BentoCard: React.FC<BentoCardProps> = ({ to, icon: Icon, title, subtitle, theme, className = "", isLarge = false }) => {
  return (
    <Link to={to} className={`block w-full h-full ${className}`}>
      <div className={`relative w-full h-full flex flex-col justify-between overflow-hidden rounded-2xl bg-black/40 backdrop-blur-md border border-white/5 transition-all duration-500 group cursor-pointer ${colorMap[theme]}`}>
        
        {/* Animated Hover Background */}
        <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${bgGlowMap[theme]}`}></div>
        
        {/* Shimmer Effect */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:animate-[shimmer_2s_infinite]"></div>

        <div className={`relative z-10 flex flex-col h-full ${isLarge ? 'p-8 gap-6' : 'p-6 gap-4'}`}>
          <div className="flex justify-between items-start w-full">
            <div className={`bg-white/5 p-3 rounded-xl border border-white/5 group-hover:border-white/20 transition-colors`}>
              <Icon className={`${isLarge ? 'w-10 h-10' : 'w-8 h-8'} drop-shadow-lg`} />
            </div>
            <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors duration-300 transform group-hover:translate-x-1" />
          </div>

          <div className="flex flex-col mt-auto">
            <h3 className={`${isLarge ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'} font-black uppercase italic tracking-widest text-white group-hover:${colorMap[theme].split(' ').pop()} transition-colors`}>
              {title}
            </h3>
            <p className={`${isLarge ? 'text-sm md:text-base mt-2' : 'text-xs md:text-sm mt-1'} text-gray-400 font-medium group-hover:text-gray-300 transition-colors`}>
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function Home() {
  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center overflow-x-hidden font-mono py-12 px-4 md:px-8">
      <AnimatedBackground />
      
      {/* Header Section */}
      <div className="z-10 flex flex-col items-center text-center mb-10 w-full max-w-5xl animate-in slide-in-from-top-8 duration-700">
        <GlitchTitle text="CodePvP" />
        <p className="text-lg md:text-xl text-cyan-200/70 mt-4 max-w-2xl bg-black/30 px-6 py-2 rounded-full border border-cyan-500/20 backdrop-blur-sm">
          The ultimate competitive coding arena.
        </p>
      </div>

      {/* BENTO GRID LAYOUT */}
      <div className="z-10 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-[200px] md:auto-rows-[240px] gap-4 md:gap-6">
        
        {/* 1. TOURNAMENTS (Spans 2 columns, 2 rows on Desktop) */}
        <BentoCard 
          to="/tournaments" 
          icon={Trophy} 
          title="Tournaments" 
          subtitle="High stakes, cash prizes, and ultimate glory. Prove you are the best hacker alive." 
          theme="amber" 
          className="md:col-span-2 lg:col-span-2 lg:row-span-2"
          isLarge={true}
        />

        {/* 2. FFA CONTESTS (Spans 2 columns, 1 row on Desktop) */}
        <BentoCard 
          to="/contests" 
          icon={Flame} 
          title="FFA Contests" 
          subtitle="Chaotic free-for-all bloodbaths. Drop in and survive." 
          theme="orange" 
          className="md:col-span-2 lg:col-span-2 lg:row-span-1"
        />

        {/* 3. MULTIPLAYER (Standard Square) */}
        <BentoCard 
          to="/MultiPlayer" 
          icon={Users} 
          title="Multiplayer" 
          subtitle="1v1s & Team Battles" 
          theme="purple" 
          className="col-span-1 lg:col-span-1 lg:row-span-1"
        />

        {/* 4. SINGLE PLAYER (Standard Square) */}
        <BentoCard 
          to="/SinglePlayer" 
          icon={User} 
          title="Training" 
          subtitle="Sharpen your skills" 
          theme="cyan" 
          className="col-span-1 lg:col-span-1 lg:row-span-1"
        />

        {/* 5. PIXEL PVP (Spans 2 columns, 1 row) */}
        <BentoCard 
          to="/PixelPvP" 
          icon={Atom} 
          title="Pixel PvP" 
          subtitle="Experimental physics-based coding modes." 
          theme="pink" 
          className="md:col-span-1 lg:col-span-2 lg:row-span-1"
        />

        {/* 6. DASHBOARD (Spans 2 columns, 1 row) */}
        <BentoCard 
          to="/Dashboard" 
          icon={LayoutDashboard} 
          title="Dashboard" 
          subtitle="View your global rank and loadouts." 
          theme="emerald" 
          className="md:col-span-1 lg:col-span-2 lg:row-span-1"
        />
        
      </div>
    </div>
  );
}