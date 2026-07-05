"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Cpu,
  RefreshCw,
  Clock,
} from "lucide-react";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [actioning, setActioning] = useState<Record<string, boolean>>({});

  const fetchApprovals = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get("/tasks/detailed-approvals");
      setApprovals(res.data);
    } catch (err) {
      console.error("Error fetching approvals:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals(true);
    let intervalId: any;
    if (polling) {
      intervalId = setInterval(() => fetchApprovals(false), 5000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [polling]);

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleAction = async (taskId: string, decision: "approve" | "reject") => {
    setActioning((prev) => ({ ...prev, [taskId]: true }));
    try {
      await api.post(`/tasks/${taskId}/${decision}`);
      setApprovals((prev) => prev.filter((app) => app.task_id !== taskId));
      alert(`Task successfully ${decision}d!`);
    } catch (err: any) {
      alert(`Action failed: ${err.response?.data?.detail || "Connection error"}`);
    } finally {
      setActioning((prev) => ({ ...prev, [taskId]: false }));
      fetchApprovals(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls bar */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-adminBorder bg-adminCard px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchApprovals(true)}
            className="flex items-center gap-1.5 rounded-lg border border-adminBorder bg-adminBorder/40 hover:border-adminGold/40 hover:text-adminGold px-3 py-1.5 font-mono-brand text-[10px] uppercase tracking-widest text-adminMuted transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Queue
          </button>
          <label className="flex items-center gap-2 font-mono-brand text-[10px] uppercase tracking-widest text-adminMuted select-none cursor-pointer">
            <input
              type="checkbox"
              checked={polling}
              onChange={(e) => setPolling(e.target.checked)}
              className="rounded border-adminBorder bg-adminBg text-adminGold focus:ring-adminGold/40"
            />
            Auto-refresh (5s)
          </label>
        </div>
        <div className="font-mono-brand text-[10px] uppercase tracking-widest text-adminMuted">
          Awaiting:{" "}
          <span className="font-bold text-amber-400">{approvals.length}</span>
        </div>
      </div>

      {/* Approvals Listing */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-adminGold border-t-transparent" />
        </div>
      ) : approvals.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-adminBorder p-8 text-adminMuted">
          <Clock className="h-8 w-8 text-adminBorder mb-3" />
          <p className="font-mono-brand text-[11px] uppercase tracking-widest font-bold">
            No pending approvals
          </p>
          <p className="font-mono-brand text-[10px] uppercase tracking-widest text-adminMuted/60 mt-1">
            All agent tasks are flowing smoothly.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((task) => {
            const isExpanded = !!expandedTasks[task.task_id];
            const isProcessing = !!actioning[task.task_id];
            const agentName =
              task.proposed_action_log?.agent_name ||
              task.target_agent ||
              "executive";

            const toolCall = task.pending_tool_call;
            let actionSummary = "Proposing unknown action";
            if (toolCall) {
              const args = toolCall.arguments;
              if (toolCall.tool_name === "create_restock_request") {
                actionSummary = `Create Restock request of ${args.quantity} units for SKU ${args.sku}`;
              } else if (toolCall.tool_name === "issue_refund") {
                actionSummary = `Issue refund of $${args.amount} for Order #${args.order_id}`;
              } else if (toolCall.tool_name === "update_stock") {
                actionSummary = `Adjust stock levels for SKU ${args.sku} by ${args.quantity_delta}`;
              } else if (toolCall.tool_name === "send_response") {
                actionSummary = `Send compensation message to ${args.customer_email}`;
              }
            }

            return (
              <div
                key={task.task_id}
                className="rounded-xl border border-adminBorder bg-adminCard overflow-hidden transition-all hover:border-adminGold/20"
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-adminBorder/60 bg-adminBg/40">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-adminGold/10 p-2 text-adminGold shrink-0 border border-adminGold/20">
                      <Cpu className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono-brand text-[10px] font-bold text-adminGold uppercase tracking-widest">
                          Agent: {agentName}
                        </span>
                        <span className="font-mono text-[10px] text-adminMuted">
                          {task.task_id}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-adminText mt-1">
                        {task.title}
                      </h4>
                      <p className="text-xs text-adminMuted mt-0.5">
                        {task.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleAction(task.task_id, "reject")}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500 hover:text-white px-4 py-2 text-xs font-bold text-red-400 disabled:opacity-50 transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(task.task_id, "approve")}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-adminBg disabled:opacity-50 transition-all"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </button>
                  </div>
                </div>

                {/* Body Row */}
                <div className="px-6 py-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono-brand text-[10px] font-bold text-adminMuted uppercase tracking-widest block">
                        Proposed Action
                      </span>
                      <span className="text-adminText font-semibold">{actionSummary}</span>
                    </div>
                    <button
                      onClick={() => toggleExpand(task.task_id)}
                      className="font-mono-brand text-[10px] uppercase tracking-widest text-adminMuted hover:text-adminGold flex items-center gap-1 transition-colors"
                    >
                      {isExpanded ? (
                        <>Hide Details <ChevronUp className="h-3 w-3" /></>
                      ) : (
                        <>Inspect <ChevronDown className="h-3 w-3" /></>
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="rounded-lg border border-adminBorder bg-adminBg p-4 font-mono text-[11px] text-adminMuted space-y-3">
                      <div>
                        <span className="font-mono-brand text-[9px] font-bold text-adminGold uppercase tracking-widest block mb-1">
                          Raw Payload
                        </span>
                        <pre className="overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(task.payload, null, 2)}
                        </pre>
                      </div>
                      {toolCall && (
                        <div>
                          <span className="font-mono-brand text-[9px] font-bold text-adminGold uppercase tracking-widest block mb-1">
                            Tool Input
                          </span>
                          <pre className="overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(toolCall, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
