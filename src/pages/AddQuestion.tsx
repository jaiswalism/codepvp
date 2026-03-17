import { useState } from "react";
import { db } from "../../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { Send, Info, Beaker, ShieldAlert, Tag } from "lucide-react";

const AddQuestion = () => {
  const [title, setTitle] = useState("");
  const [statement, setStatement] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [inputFormat, setInputFormat] = useState("");
  const [outputFormat, setOutputFormat] = useState("");
  const [constraints, setConstraints] = useState("");
  const [tags, setTags] = useState(""); 
  const [samples, setSamples] = useState([{ input: "", output: "" }]);
  const [hiddenTests, setHiddenTests] = useState([{ input: "", output: "" }]);

  const updateArrayField = (setter: any, array: any, index: number, field: string, value: string) => {
    const newArr = array.map((item: any, i: number) =>
      i === index ? { ...item, [field]: value } : item
    );
    setter(newArr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !statement) return alert("Please fill in Title and Statement.");
    
    try {
      await setDoc(doc(db, "ProblemsWithHTC", title), {
        title,
        statement,
        difficulty,
        inputFormat,
        outputFormat,
        constraints,
        samples,
        hiddenTests,
        tags: tags.split(",").map(t => t.trim()).filter(t => t !== ""),
        createdAt: new Date()
      });
      alert("Question Published to ProblemsWithHTC! 🚀");
    } catch (err) {
      console.error(err);
      alert("Error: Check Firestore rules.");
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#0a0a0c] min-h-screen text-gray-200 font-mono">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex items-center justify-between border-b border-cyan-500/20 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400 tracking-tighter uppercase italic">
            Admin Panel <span className="text-white"></span>
          </h1>
          <p className="text-gray-500 text-xs mt-1">Deploying to: ProblemsWithHTC</p>
        </div>
        <ShieldAlert className="text-cyan-500 w-8 h-8 opacity-50" />
      </div>

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Problem Definition */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-black/40 border border-white/5 p-6 rounded-xl backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2 mb-4 text-cyan-400 text-sm font-bold uppercase tracking-widest">
              <Info size={16} /> Core Metadata
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[16px] text-cyan-400 uppercase ml-1">Title</label>
                <input className="w-full bg-[#111114] border border-cyan-900/50 p-3 rounded-lg outline-none focus:border-cyan-500" placeholder="e.g. 3Sum" onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-[16px] text-purple-400 uppercase ml-1">Difficulty</label>
                <select 
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-[#111114] border border-purple-900/50 p-3.5 rounded-lg outline-none focus:border-purple-500 text-sm text-purple-400"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[16px] text-cyan-400 uppercase ml-1">Problem Statement</label>
              <textarea className="w-full bg-[#111114] border border-cyan-900/50 p-4 rounded-lg h-30 font-mono text-sm outline-none focus:border-cyan-500 resize-none whitespace-pre-wrap" placeholder="Describe the problem..." onChange={(e) => setStatement(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[16px] text-blue-400 uppercase ml-1">Input Format</label>
                <textarea className="w-full bg-[#111114] border border-blue-900/50 p-3 rounded-lg outline-none focus:border-blue-500 text-xs h-24 whitespace-pre-wrap" placeholder="Describe input structure..." onChange={(e) => setInputFormat(e.target.value)} />
              </div>
              <div>
                <label className="text-[16px] text-blue-400 uppercase ml-1">Output Format</label>
                <textarea className="w-full bg-[#111114] border border-blue-900/50 p-3 rounded-lg outline-none focus:border-blue-500 text-xs h-24 whitespace-pre-wrap" placeholder="Describe output expectation..." onChange={(e) => setOutputFormat(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-[15px] text-purple-400 uppercase ml-1">Constraints</label>
              <textarea className="w-full bg-[#111114] border border-purple-900/50 p-3 rounded-lg outline-none focus:border-purple-500 text-xs text-purple-400 h-20 whitespace-pre-wrap" placeholder="- 3 <= nums.length <= 3000" onChange={(e) => setConstraints(e.target.value)} />
            </div>

            <div>
              <label className="text-[16px] text-emerald-400 uppercase ml-1">Tags (Comma Separated)</label>
              <div className="relative">
                <Tag size={14} className="absolute left-3 top-3.5 text-emerald-500" />
                <input className="w-full bg-[#111114] border border-emerald-900/50 p-3 pl-10 rounded-lg outline-none focus:border-emerald-500 text-emerald-400 text-sm" placeholder="Arrays, Two Pointers, String" onChange={(e) => setTags(e.target.value)} />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Test Cases */}
        <div className="lg:col-span-5 space-y-6">
          {/* Public Samples */}
          <section className="bg-black/40 border border-amber-900/20 p-6 rounded-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-bold uppercase tracking-widest">
                <Beaker size={16} /> Samples
              </div>
              <button type="button" onClick={() => setSamples([...samples, {input: "", output: ""}])} className="text-[15px] text-amber-500 hover:underline font-bold">+ ADD CASE</button>
            </div>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {samples.map((s, i) => (
                <div key={i} className="flex flex-col gap-2 bg-white/5 p-3 rounded border border-amber-900/20">
                  <p className="hidden" >{s.input}</p>
                  <textarea className="bg-black/40 border border-amber-900/20 p-2 rounded text-[15px] outline-none h-15 whitespace-pre-wrap focus:border-amber-500" placeholder="Sample Input" onChange={(e) => updateArrayField(setSamples, samples, i, 'input', e.target.value)} />
                  <textarea className="bg-black/40 border border-amber-900/20 p-2 rounded text-[15px] outline-none h-15 text-amber-200 whitespace-pre-wrap focus:border-amber-500" placeholder="Expected Output" onChange={(e) => updateArrayField(setSamples, samples, i, 'output', e.target.value)} />
                </div>
              ))}
            </div>
          </section>

          {/* Hidden Tests */}
          <section className="bg-black/40 border border-rose-900/20 p-6 rounded-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-rose-400 text-sm font-bold uppercase tracking-widest">
                <ShieldAlert size={16} /> Hidden Tests
              </div>
              <button type="button" onClick={() => setHiddenTests([...hiddenTests, {input: "", output: ""}])} className="text-[15px] text-rose-500 hover:underline font-bold">+ ADD SECRET</button>
            </div>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {hiddenTests.map((s, i) => (
                <div key={i} className="flex flex-col gap-2 bg-white/5 p-3 rounded border border-rose-900/20">
                  <p className="hidden" >{s.input}</p>
                  <textarea className="bg-black/40 border border-rose-900/20 p-2 rounded text-[15px] outline-none h-15 whitespace-pre-wrap focus:border-rose-500" placeholder="Hidden Input" onChange={(e) => updateArrayField(setHiddenTests, hiddenTests, i, 'input', e.target.value)} />
                  <textarea className="bg-black/40 border border-rose-900/20 p-2 rounded text-[15px] outline-none h-15 text-rose-200 whitespace-pre-wrap focus:border-rose-500" placeholder="Hidden Output" onChange={(e) => updateArrayField(setHiddenTests, hiddenTests, i, 'output', e.target.value)} />
                </div>
              ))}
            </div>
          </section>

          <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-cyan-900/40 border border-cyan-400/50 flex items-center justify-center gap-2">
            <Send size={18} /> Deploy Challenge
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddQuestion;