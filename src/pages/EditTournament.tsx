import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { Save, Info, Trophy, Calendar, Gift, ShieldAlert, Globe, Lock, Trash2, ChevronLeft } from "lucide-react";
import LoadingScreen from "./components/LoadingScreen"; // Adjust path if needed

const EditTournament = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Upcoming");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rules, setRules] = useState("");
  const [visibility, setVisibility] = useState("Public");
  const [joinCode, setJoinCode] = useState("");
  const [prizes, setPrizes] = useState([{ rank: "", reward: "" }]);

  // Helper to format Firestore Timestamp to HTML datetime-local string (YYYY-MM-DDThh:mm)
  const formatForInput = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    // Adjust for timezone offset so it displays correctly in local time
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  // Fetch Existing Data
  useEffect(() => {
    const fetchTournament = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "Tournaments", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || "");
          setDescription(data.description || "");
          setStatus(data.status || "Upcoming");
          setStartDate(formatForInput(data.startDate));
          setEndDate(formatForInput(data.endDate));
          setRules(data.rules || "");
          setVisibility(data.visibility || "Public");
          setJoinCode(data.joinCode || "");
          setPrizes(data.prizes && data.prizes.length > 0 ? data.prizes : [{ rank: "", reward: "" }]);
        } else {
          alert("Tournament not found!");
          navigate("/admin/dashboard"); // Or wherever your admin list is
        }
      } catch (err) {
        console.error("Error fetching tournament:", err);
        alert("Failed to load tournament data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournament();
  }, [id, navigate]);

  const updateArrayField = (setter: any, array: any, index: number, field: string, value: string) => {
    const newArr = array.map((item: any, i: number) =>
      i === index ? { ...item, [field]: value } : item
    );
    setter(newArr);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!name || !startDate || !endDate) return alert("Please fill in Tournament Name and Dates.");
    if (visibility === "Private" && !joinCode.trim()) return alert("Please provide a Join Code for private tournaments.");
    
    setIsSaving(true);
    try {
      const docRef = doc(db, "Tournaments", id);
      await updateDoc(docRef, {
        name,
        description,
        status,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rules,
        visibility,
        joinCode: visibility === "Private" ? joinCode : null,
        prizes,
        updatedAt: new Date() // Track when it was last modified
      });
      alert("Tournament Successfully Updated! 🛠️");
    } catch (err) {
      console.error(err);
      alert("Error updating tournament. Check permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmDelete = window.confirm(`Are you absolutely sure you want to delete "${name}"? This action cannot be undone and will erase all participant data.`);
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "Tournaments", id));
      alert("Tournament deleted permanently.");
      navigate("/admin/tournaments"); // Redirect to your admin list
    } catch (err) {
      console.error("Error deleting tournament:", err);
      alert("Failed to delete tournament.");
    }
  };

  if (isLoading) return <LoadingScreen message="Loading Configuration..." />;

  return (
    <div className="p-4 md:p-8 bg-[#0a0a0c] min-h-screen text-gray-200 font-mono">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="text-cyan-500 hover:text-white transition-colors duration-300 text-sm flex items-center gap-2 mb-4"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400 tracking-tighter uppercase italic">
              Edit <span className="text-white">Tournament</span>
            </h1>
            <p className="text-gray-500 text-xs mt-1">Modifying Document ID: {id}</p>
          </div>
          <Trophy className="text-cyan-500 w-8 h-8 opacity-50" />
        </div>
      </div>

      <form onSubmit={handleUpdate} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Tournament Definition */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-black/40 border border-white/5 p-6 rounded-xl backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2 mb-4 text-cyan-400 text-sm font-bold uppercase tracking-widest">
              <Info size={16} /> Tournament Metadata
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[16px] text-cyan-400 uppercase ml-1">Tournament Name</label>
                <input className="w-full bg-[#111114] border border-cyan-900/50 p-3 rounded-lg outline-none focus:border-cyan-500 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
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
                    if (e.target.value === "Public") setJoinCode("");
                  }}
                  className="w-full bg-[#111114] border border-emerald-900/50 p-3.5 rounded-lg outline-none focus:border-emerald-500 text-sm text-emerald-400"
                >
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
              </div>
              
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
              <textarea className="w-full bg-[#111114] border border-cyan-900/50 p-4 rounded-lg h-32 font-mono text-sm outline-none focus:border-cyan-500 resize-none whitespace-pre-wrap" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div>
              <label className="text-[15px] text-emerald-400 uppercase ml-1 flex items-center gap-2"><ShieldAlert size={14}/> Rules & Guidelines</label>
              <textarea className="w-full bg-[#111114] border border-emerald-900/50 p-3 rounded-lg outline-none focus:border-emerald-500 text-xs text-emerald-400 h-28 whitespace-pre-wrap" value={rules} onChange={(e) => setRules(e.target.value)} />
            </div>
          </section>
        </div>

        {/* Right Column: Prizes & Actions */}
        <div className="lg:col-span-5 space-y-6">
          
          <section className="bg-black/40 border border-amber-900/20 p-6 rounded-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-bold uppercase tracking-widest">
                <Gift size={16} /> Prize Pool
              </div>
              <button type="button" onClick={() => setPrizes([...prizes, {rank: "", reward: ""}])} className="text-[15px] text-amber-500 hover:underline font-bold">+ ADD PRIZE</button>
            </div>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {prizes.map((p, i) => (
                <div key={i} className="flex gap-2 bg-white/5 p-3 rounded border border-amber-900/20 relative group">
                  <input className="w-1/3 bg-black/40 border border-amber-900/20 p-2 rounded text-[14px] outline-none focus:border-amber-500" placeholder="Rank (e.g. 1st)" value={p.rank} onChange={(e) => updateArrayField(setPrizes, prizes, i, 'rank', e.target.value)} />
                  <input className="w-2/3 bg-black/40 border border-amber-900/20 p-2 rounded text-[14px] outline-none text-amber-200 focus:border-amber-500" placeholder="Reward (e.g. $500)" value={p.reward} onChange={(e) => updateArrayField(setPrizes, prizes, i, 'reward', e.target.value)} />
                  {/* Remove Prize Button */}
                  <button type="button" onClick={() => setPrizes(prizes.filter((_, idx) => idx !== i))} className="absolute -right-2 -top-2 bg-red-500/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Submit Action */}
          <button type="submit" disabled={isSaving} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-cyan-900/40 border border-cyan-400/50 flex items-center justify-center gap-2 mt-4 disabled:opacity-50">
            <Save size={18} /> {isSaving ? "Saving..." : "Save Changes"}
          </button>

          {/* Danger Zone */}
          <div className="border border-red-900/50 bg-red-900/10 rounded-xl p-6 mt-8">
            <h3 className="text-red-500 font-bold uppercase flex items-center gap-2 mb-2"><ShieldAlert size={16}/> Danger Zone</h3>
            <p className="text-red-400/70 text-sm mb-4">Deleting this tournament will permanently remove it from the database and wipe all participant records.</p>
            <button type="button" onClick={handleDelete} className="w-full bg-red-900/50 hover:bg-red-600 border border-red-500/50 text-white font-bold py-3 rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-2">
              <Trash2 size={16} /> Delete Tournament
            </button>
          </div>

        </div>
      </form>
    </div>
  );
};

export default EditTournament;