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

export default NavButton