import { useState } from "react";
import { db } from "../../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { Send, Info, Trophy, Calendar, Gift, ShieldAlert, Globe, Lock } from "lucide-react";

const AddTournament = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Upcoming");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rules, setRules] = useState("");
  
  // Visibility & Access
  const [visibility, setVisibility] = useState("Public");
  const [joinCode, setJoinCode] = useState("");
  
  // Prize configuration
  const [prizes, setPrizes] = useState([{ rank: "1st", reward: "" }]);

  const updateArrayField = (setter: any, array: any, index: number, field: string, value: string) => {
    const newArr = array.map((item: any, i: number) =>
      i === index ? { ...item, [field]: value } : item
    );
    setter(newArr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) return alert("Please fill in Tournament Name and Dates.");
    if (visibility === "Private" && !joinCode.trim()) return alert("Please provide a Join Code for private tournaments.");
    
    try {
      await setDoc(doc(db, "Tournaments", name.replace(/\s+/g, '-')), {
        name,
        description,
        status,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rules,
        visibility,
        joinCode: visibility === "Private" ? joinCode : null, // Only save code if private
        prizes,
        createdAt: new Date()
      });
      alert("Tournament Successfully Created! 🏆");
      
      // Reset form (Optional)
      setName("");
      setDescription("");
      setJoinCode("");
      setPrizes([{ rank: "1st", reward: "" }]);
    } catch (err) {
      console.error(err);
      alert("Error: Check Firestore rules or database connection.");
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#0a0a0c] min-h-screen text-gray-200 font-mono">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between border-b border-cyan-500/20 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400 tracking-tighter uppercase italic">
            Tournament Admin <span className="text-white">Panel</span>
          </h1>
          <p className="text-gray-500 text-xs mt-1">Deploying to: Tournaments</p>
        </div>
        <Trophy className="text-cyan-500 w-8 h-8 opacity-50" />
      </div>

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Tournament Definition */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-black/40 border border-white/5 p-6 rounded-xl backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2 mb-4 text-cyan-400 text-sm font-bold uppercase tracking-widest">
              <Info size={16} /> Tournament Metadata
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[16px] text-cyan-400 uppercase ml-1">Tournament Name</label>
                <input className="w-full bg-[#111114] border border-cyan-900/50 p-3 rounded-lg outline-none focus:border-cyan-500 text-sm" placeholder="e.g. Winter Code Jam 2026" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-[16px] text-purple-400 uppercase ml-1">Status</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-[#111114] border border-purple-900/50 p-3.5 rounded-lg outline-none focus:border-purple-500 text-sm text-purple-400"
                >
                  <option value="Draft">Draft</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Visibility & Access */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[16px] text-emerald-400 uppercase ml-1 flex items-center gap-2"><Globe size={14}/> Visibility</label>
                <select 
                  value={visibility}
                  onChange={(e) => {
                    setVisibility(e.target.value);
                    if (e.target.value === "Public") setJoinCode(""); // clear code if switched back
                  }}
                  className="w-full bg-[#111114] border border-emerald-900/50 p-3.5 rounded-lg outline-none focus:border-emerald-500 text-sm text-emerald-400"
                >
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
              </div>
              
              {/* Conditional Join Code Input */}
              {visibility === "Private" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[16px] text-rose-400 uppercase ml-1 flex items-center gap-2"><Lock size={14}/> Join Code</label>
                  <input 
                    className="w-full bg-[#111114] border border-rose-900/50 p-3 rounded-lg outline-none focus:border-rose-500 text-sm text-rose-200 placeholder-rose-900" 
                    placeholder="e.g. SECRET2026" 
                    value={joinCode} 
                    onChange={(e) => setJoinCode(e.target.value)} 
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[16px] text-blue-400 uppercase ml-1 flex items-center gap-2"><Calendar size={14}/> Start Time</label>
                <input type="datetime-local" className="w-full bg-[#111114] border border-blue-900/50 p-3 rounded-lg outline-none focus:border-blue-500 text-sm text-gray-300" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-[16px] text-blue-400 uppercase ml-1 flex items-center gap-2"><Calendar size={14}/> End Time</label>
                <input type="datetime-local" className="w-full bg-[#111114] border border-blue-900/50 p-3 rounded-lg outline-none focus:border-blue-500 text-sm text-gray-300" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-[16px] text-cyan-400 uppercase ml-1">Description</label>
              <textarea className="w-full bg-[#111114] border border-cyan-900/50 p-4 rounded-lg h-32 font-mono text-sm outline-none focus:border-cyan-500 resize-none whitespace-pre-wrap" placeholder="Describe the tournament theme, target audience, and overview..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div>
              <label className="text-[15px] text-emerald-400 uppercase ml-1 flex items-center gap-2"><ShieldAlert size={14}/> Rules & Guidelines</label>
              <textarea className="w-full bg-[#111114] border border-emerald-900/50 p-3 rounded-lg outline-none focus:border-emerald-500 text-xs text-emerald-400 h-28 whitespace-pre-wrap" placeholder="- Plagiarism will result in immediate ban&#10;- Max team size: 3" value={rules} onChange={(e) => setRules(e.target.value)} />
            </div>
          </section>
        </div>

        {/* Right Column: Prizes */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Prize Pool */}
          <section className="bg-black/40 border border-amber-900/20 p-6 rounded-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-bold uppercase tracking-widest">
                <Gift size={16} /> Prize Pool
              </div>
              <button type="button" onClick={() => setPrizes([...prizes, {rank: "", reward: ""}])} className="text-[15px] text-amber-500 hover:underline font-bold">+ ADD PRIZE</button>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {prizes.map((p, i) => (
                <div key={i} className="flex gap-2 bg-white/5 p-3 rounded border border-amber-900/20">
                  <input className="w-1/3 bg-black/40 border border-amber-900/20 p-2 rounded text-[14px] outline-none focus:border-amber-500" placeholder="Rank (e.g. 1st)" value={p.rank} onChange={(e) => updateArrayField(setPrizes, prizes, i, 'rank', e.target.value)} />
                  <input className="w-2/3 bg-black/40 border border-amber-900/20 p-2 rounded text-[14px] outline-none text-amber-200 focus:border-amber-500" placeholder="Reward (e.g. $500 + T-Shirt)" value={p.reward} onChange={(e) => updateArrayField(setPrizes, prizes, i, 'reward', e.target.value)} />
                </div>
              ))}
            </div>
          </section>

          {/* Submit Action */}
          <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-cyan-900/40 border border-cyan-400/50 flex items-center justify-center gap-2 mt-4">
            <Send size={18} /> Launch Tournament
          </button>

        </div>
      </form>
    </div>
  );
};

export default AddTournament;