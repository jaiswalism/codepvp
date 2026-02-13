import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";

type Difficulty = "Easy" | "Medium" | "Hard";
type TopicChip =
  | "All Topics"
  | "Arrays & Hashing"
  | "Two Pointers"
  | "Sliding Window"
  | "Stack"
  | "Binary Search"
  | "Linked List"
  | "Trees & Tries"
  | "Dynamic Programming";


type ProblemRow = {
    id: number;
    title: string;
  acceptance: number; // %
    difficulty: Difficulty;
    solved?: boolean;
    topic: Exclude<TopicChip, "All Topics">;
};

const SinglePlayer: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useUser();

    useEffect(() => {
    if (!user) navigate("/login");
    }, [user, navigate]);

   const heroCards = [
  {
    title: "Dashboard",
    subtitle: "Track progress, streaks & stats",
    button: "Open Dashboard",
    bg: "from-[#e8f7ff] via-[#c8f0ff] to-[#f7e7ff]",
    text: "text-slate-900",
    btn: "bg-black text-white hover:bg-black/80",
    to: "/dashboard",
  },
  {
    title: "30 Days Challenge",
    subtitle: "Beginner friendly daily streak",
    button: "Start Learning",
    bg: "from-[#ffcf6a] via-[#ff8a3d] to-[#ff4d4d]",
    text: "text-slate-900",
    btn: "bg-white text-black hover:bg-white/80",
    to: "/SinglePlayer",
  },
  {
    title: "Single Player",
    subtitle: "Practice DSA problems solo",
    button: "Start Solving",
    bg: "from-[#2e7dff] via-[#3b50ff] to-[#00c2ff]",
    text: "text-white",
    btn: "bg-white text-black hover:bg-white/80",
    to: "/SinglePlayer",
  },
  {
    title: "Multi Player",
    subtitle: "Compete live with friends",
    button: "Play Now",
    bg: "from-[#8a5bff] via-[#6f4dff] to-[#ff4dcf]",
    text: "text-white",
    btn: "bg-white text-black hover:bg-white/80",
    to: "/MultiPlayer",
  },
];


  // ✅ Replace with API data later
   const problems: ProblemRow[] = [
  { id: 1, title: "Two Sum", acceptance: 57.0, difficulty: "Easy", solved: true, topic: "Arrays & Hashing" },
  { id: 2, title: "Add Two Numbers", acceptance: 47.9, difficulty: "Medium", topic: "Linked List" },
  { id: 3, title: "Longest Substring Without Repeating Characters", acceptance: 38.4, difficulty: "Medium", topic: "Sliding Window" },
  { id: 4, title: "Median of Two Sorted Arrays", acceptance: 45.8, difficulty: "Hard", topic: "Binary Search" },
  { id: 5, title: "Valid Parentheses", acceptance: 62.1, difficulty: "Easy", topic: "Stack" },
  { id: 6, title: "Two Sum II", acceptance: 59.0, difficulty: "Medium", topic: "Two Pointers" },
  { id: 7, title: "Invert Binary Tree", acceptance: 76.0, difficulty: "Easy", topic: "Trees & Tries" },
  { id: 8, title: "Climbing Stairs", acceptance: 55.2, difficulty: "Easy", topic: "Dynamic Programming" },
];



    const topicChips: TopicChip[] = [
    "All Topics",
    "Arrays & Hashing",
    "Two Pointers",
    "Sliding Window",
    "Stack",
    "Binary Search",
    "Linked List",
    "Trees & Tries",
    "Dynamic Programming",
];


    const [topic, setTopic] = useState<TopicChip>("All Topics");
    const [difficulty, setDifficulty] = useState<"All" | Difficulty>("All");
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return problems.filter((p) => {
        const matchQ = q === "" || p.title.toLowerCase().includes(q);
        const matchD = difficulty === "All" ? true : p.difficulty === difficulty;
        const matchT = topic === "All Topics" ? true : p.topic === topic;
        return matchQ && matchD && matchT;
    });
    }, [problems, query, difficulty, topic]);

  const solvedCount = useMemo(() => filtered.filter((p) => p.solved).length, [filtered]);

  const diffClass = (d: Difficulty) => {
    if (d === "Easy") return "text-emerald-300";
    if (d === "Medium") return "text-amber-300";
    return "text-rose-300";
  };

  const openProblem = (problemId: number) => {
    // ✅ This matches the new App.tsx route:
    navigate(`/practice/${problemId}`);
  };

  return (
    <div className="min-h-screen bg-[#0b0f14] text-slate-200 
    bg-gradient-to-br 
  from-[#071329] 
  via-[#0b1e35] 
  to-[#0d2342]">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-white/5 bg-[#0b0f14]/80 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 grid place-items-center font-bold">
              CP
            </div>
            <div className="text-sm text-slate-400">
              <span className="text-slate-200 font-semibold">Problems</span>
              <span className="mx-2 text-slate-600">/</span>
              <span>Single Player</span>
            </div>
          </div>

          <button
            onClick={() => navigate("/")}
            className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="mx-auto max-w-[1400px] px-4 py-6 grid grid-cols-12 gap-6">
        
        

        {/* Main content */}
        <main className="col-span-12 lg:col-span-12">
            {/* Hero Cards (LeetCode-style colorful banners) */}
<div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {heroCards.map((c) => (
    <div
      key={c.title}
      className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-r ${c.bg} shadow-lg`}
    >
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/30 blur-2xl" />

      <div className={`${c.text}`}>
        <div className="text-xl font-bold">{c.title}</div>
        <div className="mt-2 text-sm opacity-80">{c.subtitle}</div>

        <button
          className={`mt-4 rounded-lg px-4 py-2 text-sm font-semibold transition ${c.btn}`}
          onClick={() => navigate(c.to)}

        >
          {c.button}
        </button>
      </div>
    </div>
  ))}
</div>

          {/* Topic chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {topicChips.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className={`px-4 py-2 rounded-full text-sm border transition ${
                  topic === t
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Search + solved count */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span className="text-slate-500">🔎</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search questions"
                  className="w-full bg-transparent outline-none text-sm placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="text-xs text-slate-400">
              {solvedCount}/{filtered.length} Solved
            </div>
          </div>

          {/* Difficulty chips */}
          <div className="flex gap-2 mb-4">
            {(["All", "Easy", "Medium", "Hard"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-4 py-2 rounded-full text-sm border transition ${
                  difficulty === d
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Problems table */}
          <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="grid grid-cols-12 px-4 py-3 text-xs text-slate-400 border-b border-white/10">
              <div className="col-span-1"></div>
              <div className="col-span-7">Title</div>
              <div className="col-span-2 text-right">Acceptance</div>
              <div className="col-span-2 text-right">Difficulty</div>
            </div>

            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => openProblem(p.id)}
                className="w-full grid grid-cols-12 px-4 py-3 text-sm hover:bg-white/5 transition border-b border-white/5 last:border-b-0 text-left"
              >
                <div className="col-span-1">
                  {p.solved ? <span className="text-emerald-300">✓</span> : <span className="text-slate-600">•</span>}
                </div>

                <div className="col-span-7 text-slate-200">
                  {p.id}. {p.title}
                </div>

                <div className="col-span-2 text-right text-slate-400">
                  {p.acceptance.toFixed(1)}%
                </div>

                <div className={`col-span-2 text-right font-semibold ${diffClass(p.difficulty)}`}>
                  {p.difficulty}
                </div>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-slate-400">No problems found.</div>
            )}
          </div>
        </main>

        {/* Right sidebar */}
      </div>
    </div>
  );
};

export default SinglePlayer;
