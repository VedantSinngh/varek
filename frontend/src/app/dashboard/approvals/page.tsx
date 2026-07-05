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
  Clock
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

  // Poll approvals every 5 seconds
  useEffect(() => {
    fetchApprovals(true);
    
    let intervalId: any;
    if (polling) {
      intervalId = setInterval(() => {
        fetchApprovals(false);
      }, 5000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [polling]);

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleAction = async (taskId: string, decision: "approve" | "reject") => {
    setActioning(prev => ({ ...prev, [taskId]: true }));
    try {
      const endpoint = `/tasks/${taskId}/${decision}`;
      await api.post(endpoint);
      
      // Update local state to immediately remove task
      setApprovals(prev => prev.filter(app => app.task_id !== taskId));
      alert(`Task successfully ${decision}d!`);
    } catch (err: any) {
      console.error(`Error during task ${decision}:`, err);
      alert(`Action failed: ${err.response?.data?.detail || "Connection error"}`);
    } finally {
      setActioning(prev => ({ ...prev, [taskId]: false }));
      fetchApprovals(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Header controls */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#111827] px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchApprovals(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 px-3 py-1.5 text-xs text-slate-300 font-semibold transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Queue
          </button>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 select-none">
            <input
              type="checkbox"
              checked={polling}
              onChange={(e) => setPolling(e.target.checked)}
              className="rounded border-slate-800 bg-[#1f2937] text-indigo-600 focus:ring-indigo-500"
            />
            Auto-refresh (5s)
          </label>
        </div>
        <div className="text-xs text-slate-400">
          Awaiting Action: <span className="font-bold text-amber-400">{approvals.length}</span>
        </div>
      </div>

      {/* Approvals Listing */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : approvals.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 p-8 text-slate-400">
          <Clock className="h-8 w-8 text-slate-600 mb-2" />
          <p className="text-sm font-semibold">No pending approvals</p>
          <p className="text-xs text-slate-500 mt-1">All agent tasks are flowing smoothly or have been validated.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((task) => {
            const isExpanded = !!expandedTasks[task.task_id];
            const isProcessing = !!actioning[task.task_id];
            const agentName = task.proposed_action_log?.agent_name || task.target_agent || "executive";
            
            // Generate action summaries based on tool arguments
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
                actionSummary = `Send compensation/refund support message to ${args.customer_email}`;
              }
            }

            return (
              <div 
                key={task.task_id} 
                className="rounded-xl border border-slate-800 bg-[#111827] overflow-hidden flex flex-col transition-all hover:border-slate-700"
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 border-b border-slate-800/60 bg-[#1e293b]/20">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400 shrink-0">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Agent: {agentName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Task: {task.task_id}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{task.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleAction(task.task_id, "reject")}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500 hover:text-white px-4 py-2 text-xs font-bold text-red-400 disabled:opacity-50 transition-all"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(task.task_id, "approve")}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-bold text-[#0b0f19] disabled:opacity-50 transition-all"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </button>
                  </div>
                </div>

                {/* Body Row (Proposals & Collapsible Details) */}
                <div className="px-6 py-4 bg-slate-900/10 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 uppercase tracking-wider font-bold text-[10px] block">Proposed Action</span>
                      <span className="text-white font-semibold">{actionSummary}</span>
                    </div>
                    <button
                      onClick={() => toggleExpand(task.task_id)}
                      className="text-slate-500 hover:text-white flex items-center gap-1 text-[11px] font-semibold"
                    >
                      {isExpanded ? (
                        <>Hide Details <ChevronUp className="h-3 w-3" /></>
                      ) : (
                        <>Inspect Details <ChevronDown className="h-3 w-3" /></>
                      )}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="rounded-lg border border-slate-800 bg-[#0b0f19] p-4 font-mono text-[11px] text-slate-400 space-y-3">
                      <div>
                        <span className="text-indigo-400 font-bold uppercase text-[9px] block mb-1">Raw Payload</span>
                        <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(task.payload, null, 2)}</pre>
                      </div>
                      {toolCall && (
                        <div>
                          <span className="text-indigo-400 font-bold uppercase text-[9px] block mb-1">Tool Input</span>
                          <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(toolCall, null, 2)}</pre>
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
