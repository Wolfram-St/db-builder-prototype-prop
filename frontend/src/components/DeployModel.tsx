import { useState, useMemo } from "react";
import { toast } from "sonner"; 
import { Loader2, Terminal, Play, X, CheckCircle2, AlertTriangle } from "lucide-react"; // Added AlertTriangle
import { useDBStore } from "../store/dbStore";
import { generateSQL } from "../lib/sqlGenerator"; 

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function DeployModal({ onClose }: { onClose: () => void }) {
  const { tables, relations } = useDBStore();
  const [targetDbUrl, setTargetDbUrl] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // --- SMART ANALYSIS: Detect Destructive Changes ---
  const warnings = useMemo(() => {
    if (!plan) return [];
    const warns: string[] = [];
    // Check for keywords in the generated SQL plan
    if (plan.includes("DROP TABLE")) warns.push("This plan will DELETE tables.");
    if (plan.includes("DROP COLUMN")) warns.push("This plan will DELETE columns.");
    if (plan.includes("TRUNCATE")) warns.push("This plan will WIPE data.");
    return warns;
  }, [plan]);

  const handleCalculatePlan = async () => {
    if (!targetDbUrl) {
      toast.error("Please enter a Connection String");
      return;
    }
    
    const fetchPlan = async () => {
      const desiredSql = generateSQL(tables, relations);

      const response = await fetch(`${BACKEND_URL}/deploy/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desiredSql, targetDbUrl }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to calculate plan");
      return data;
    };

    setLoading(true);
    // Reset previous plan
    setPlan(null); 

    toast.promise(fetchPlan(), {
      loading: 'Inspecting existing database...', // <--- User feedback
      success: (data) => {
        setLoading(false);
        if (!data.plan) {
          setPlan("-- Database is up to date");
          return "No changes detected";
        } else {
          setPlan(data.plan);
          return "Changes detected!";
        }
      },
      error: (err) => {
        setLoading(false);
        return err.message; 
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-white/5 bg-zinc-900/50 flex justify-between items-center">
          <h2 className="text-zinc-100 font-medium flex items-center gap-2">
            <Terminal className="text-violet-500" size={18} />
            Schema Deployment
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Input */}
          <div className="space-y-3">
            <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider">
              Target Database
            </label>
            <input
              type="text"
              value={targetDbUrl}
              onChange={(e) => setTargetDbUrl(e.target.value)}
              placeholder="postgres://user:pass@host:6543/db"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-200 font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 outline-none transition-all"
            />
          </div>

          {/* Results Area */}
          {plan && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
              
              {/* --- NEW: Destructive Change Warning --- */}
              {warnings.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-red-400">Destructive Changes Detected</p>
                    <ul className="text-xs text-red-400/80 list-disc list-inside">
                      {warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="text-xs uppercase text-zinc-500 font-bold tracking-wider">
                  Migration Plan
                </label>
                {!warnings.length && (
                   <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                     <CheckCircle2 size={10} /> Safe to Apply
                   </span>
                )}
              </div>
              
              <div className="h-64 bg-black rounded-lg p-4 overflow-auto border border-white/10 shadow-inner group">
                <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {plan}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-900/50 border-t border-white/5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
            Cancel
          </button>
          
          <button
            onClick={handleCalculatePlan}
            disabled={loading}
            className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
            {plan ? "Recalculate" : "Calculate Diff"}
          </button>
        </div>
      </div>
    </div>
  );
}