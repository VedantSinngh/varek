"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  Terminal, 
  Search, 
  HelpCircle,
  Play,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

export default function AgentLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAgent, setFilterAgent] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTaskId, setSearchTaskId] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (filterAgent) params.append("agent_name", filterAgent);
      if (filterStatus) params.append("status", filterStatus);
      if (searchTaskId) params.append("task_id", searchTaskId);

      const res = await api.get(`/agent-logs?${params.toString()}`);
      setLogs(res.data);
    } catch (err) {
      console.error("Error fetching agent logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAgent, filterStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const agentOptions = ["executive", "inventory", "support", "dummy_agent"];
  const statusOptions = ["success", "failed", "pending_approval"];

  return (
    <div className="space-y-6">
      {/* Filters bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#111827] px-6 py-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchTaskId}
              onChange={(e) => setSearchTaskId(e.target.value)}
              placeholder="Search Task ID (UUID)..."
              className="rounded-lg border border-slate-800 bg-[#1f2937] py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-600 min-w-[220px]"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-all"
          >
            Find
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Agent:</label>
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="rounded-lg border border-slate-800 bg-[#1f2937] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Agents</option>
              {agentOptions.map(opt => (
                <option key={opt} value={opt}>{opt.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-slate-800 bg-[#1f2937] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              {statusOptions.map(opt => (
                <option key={opt} value={opt}>{opt.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Log Viewer Table */}
      <div className="rounded-xl border border-slate-800 bg-[#111827] overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-500 text-xs">
            <Terminal className="h-8 w-8 text-slate-600 mb-2" />
            No agent activities found in audit logs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#1f2937]/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Agent</th>
                  <th className="px-6 py-3.5">Action Executed</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Related Task ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
                {logs.map((log) => {
                  return (
                    <tr key={log._id} className="hover:bg-slate-800/10">
                      <td className="px-6 py-3 text-[11px] text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-indigo-400 font-bold tracking-wide">
                        {log.agent_name.toUpperCase()}
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-200">
                        {log.action}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1 font-bold ${
                          log.status === "success" ? "text-emerald-400" :
                          log.status === "failed" ? "text-red-400" :
                          "text-amber-400"
                        }`}>
                          {log.status === "success" && <CheckCircle className="h-3.5 w-3.5" />}
                          {log.status === "failed" && <XCircle className="h-3.5 w-3.5" />}
                          {log.status === "pending_approval" && <Clock className="h-3.5 w-3.5" />}
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-500 max-w-[150px] truncate">
                        {log.related_task_id || "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
