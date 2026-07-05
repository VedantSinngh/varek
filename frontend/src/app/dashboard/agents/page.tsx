"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Terminal,
  Search,
  CheckCircle,
  XCircle,
  Clock,
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
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl border border-adminBorder bg-adminCard px-6 py-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-adminMuted">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchTaskId}
              onChange={(e) => setSearchTaskId(e.target.value)}
              placeholder="Search Task ID (UUID)..."
              className="rounded-lg border border-adminBorder bg-adminBg py-2 pl-9 pr-4 text-xs text-adminText placeholder-adminMuted/50 focus:outline-none focus:ring-1 focus:ring-adminGold/40 min-w-[220px]"
            />
          </div>
          <button
            type="submit"
            className="btn-admin"
          >
            Find
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <label className="font-mono-brand text-[10px] font-bold text-adminMuted uppercase tracking-widest">
              Agent:
            </label>
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="rounded-lg border border-adminBorder bg-adminBg px-2.5 py-1.5 text-xs text-adminText focus:outline-none focus:ring-1 focus:ring-adminGold/40"
            >
              <option value="">All Agents</option>
              {agentOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-mono-brand text-[10px] font-bold text-adminMuted uppercase tracking-widest">
              Status:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-adminBorder bg-adminBg px-2.5 py-1.5 text-xs text-adminText focus:outline-none focus:ring-1 focus:ring-adminGold/40"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-adminBorder bg-adminCard overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-adminGold border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-adminMuted">
            <Terminal className="h-8 w-8 text-adminBorder mb-3" />
            <span className="font-mono-brand text-[11px] uppercase tracking-widest">
              No agent activities found.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-adminText">
              <thead className="border-b border-adminBorder bg-adminBg text-[10px] font-bold text-adminMuted uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Agent</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Task ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-adminBorder font-mono text-xs">
                {logs.map((log) => (
                  <tr
                    key={log._id}
                    className="hover:bg-adminBorder/20 transition-colors"
                  >
                    <td className="px-6 py-3 text-adminMuted">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 font-bold tracking-wide text-adminGold">
                      {log.agent_name.toUpperCase()}
                    </td>
                    <td className="px-6 py-3 font-semibold text-adminText">
                      {log.action}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          log.status === "success"
                            ? "text-emerald-400"
                            : log.status === "failed"
                            ? "text-red-400"
                            : "text-amber-400"
                        }`}
                      >
                        {log.status === "success" && (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        {log.status === "failed" && (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        {log.status === "pending_approval" && (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-adminMuted max-w-[150px] truncate">
                      {log.related_task_id || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
