import React, { useState, useEffect } from 'react';
import { 
  ApprovalRequestItem, 
  ApprovalWorkflowItem, 
  BusinessRuleItem, 
  ApprovalSummaryMetrics 
} from './types';
import { 
  getApprovalRequests, 
  getApprovalRequestById, 
  approveApprovalRequest, 
  rejectApprovalRequest, 
  escalateApprovalRequest, 
  getApprovalMetrics, 
  getApprovalWorkflows, 
  updateApprovalWorkflow, 
  getBusinessRules, 
  saveBusinessRule, 
  toggleBusinessRule 
} from '../../data-access/posApi';
import { useApp } from '../../application/context/AppContext';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Layers, 
  SlidersHorizontal, 
  Search, 
  Filter, 
  DollarSign, 
  Building2, 
  UserCheck, 
  FileText, 
  ArrowUpRight, 
  Sparkles, 
  RefreshCw, 
  Plus, 
  ChevronRight,
  TrendingUp,
  X,
  MessageSquare
} from 'lucide-react';

export const ApprovalManagementHub: React.FC = () => {
  const { lang, notify, confirmAction } = useApp();

  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'WORKFLOWS' | 'RULES'>('REQUESTS');
  const [requests, setRequests] = useState<ApprovalRequestItem[]>([]);
  const [workflows, setWorkflows] = useState<ApprovalWorkflowItem[]>([]);
  const [rules, setRules] = useState<BusinessRuleItem[]>([]);
  const [metrics, setMetrics] = useState<ApprovalSummaryMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Selected for Detailed Review Modal
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequestItem | null>(null);
  const [decisionNotes, setDecisionNotes] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  // Workflow Threshold Editing
  const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflowItem | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [reqData, wfData, rulesData, metricData] = await Promise.all([
        getApprovalRequests({
          status: statusFilter,
          module: moduleFilter !== 'ALL' ? moduleFilter : undefined,
          search: search || undefined,
        }),
        getApprovalWorkflows(),
        getBusinessRules(),
        getApprovalMetrics(),
      ]);
      setRequests(reqData?.data || reqData || []);
      setWorkflows(wfData);
      setRules(rulesData);
      setMetrics(metricData);
    } catch (err) {
      console.error('Failed to load approval data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [statusFilter, moduleFilter]);

  // Handle Approve
  const handleApprove = async (req: ApprovalRequestItem) => {
    const confirmed = await confirmAction({
      title: lang === 'kh' ? 'យល់ព្រមលើសំណើនេះ?' : 'Approve Request?',
      message: lang === 'kh' 
        ? `តើអ្នកប្រាកដជាចង់អនុម័តសំណើ #${req.request_code} ($${Number(req.amount).toFixed(2)}) ទេ?`
        : `Are you sure you want to approve request #${req.request_code} ($${Number(req.amount).toFixed(2)})?`,
      confirmText: lang === 'kh' ? 'យល់ព្រម' : 'Approve',
      cancelText: lang === 'kh' ? 'បោះបង់' : 'Cancel',
      variant: 'info',
    });
    if (!confirmed) return;

    setIsProcessingAction(true);
    try {
      await approveApprovalRequest(req.id, decisionNotes || 'Approved by authorized manager');
      notify.success(
        lang === 'kh' ? `សំណើ #${req.request_code} ត្រូវបានអនុម័ត!` : `Request #${req.request_code} approved successfully!`,
        'Approved'
      );
      setSelectedRequest(null);
      setDecisionNotes('');
      await loadAllData();
    } catch (err: any) {
      notify.error('Approval failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Reject
  const handleReject = async (req: ApprovalRequestItem) => {
    if (!decisionNotes.trim()) {
      notify.warning('Please enter a rejection reason.');
      return;
    }

    setIsProcessingAction(true);
    try {
      await rejectApprovalRequest(req.id, decisionNotes.trim());
      notify.info(
        lang === 'kh' ? `សំណើ #${req.request_code} ត្រូវបានបដិសេធ` : `Request #${req.request_code} was rejected.`,
        'Rejected'
      );
      setSelectedRequest(null);
      setIsRejecting(false);
      setDecisionNotes('');
      await loadAllData();
    } catch (err: any) {
      notify.error('Rejection failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Escalate
  const handleEscalate = async (req: ApprovalRequestItem) => {
    setIsProcessingAction(true);
    try {
      await escalateApprovalRequest(req.id, decisionNotes || 'Escalated to Executive tier');
      notify.warning(
        lang === 'kh' ? `សំណើត្រូវបានបញ្ជូនបន្តទៅថ្នាក់ដឹកនាំ` : `Request escalated to Executive Committee tier.`,
        'Escalated'
      );
      setSelectedRequest(null);
      setDecisionNotes('');
      await loadAllData();
    } catch (err: any) {
      notify.error('Escalation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Save Workflow Threshold
  const handleSaveWorkflow = async () => {
    if (!editingWorkflow) return;
    try {
      await updateApprovalWorkflow(editingWorkflow.id, editingWorkflow);
      notify.success(
        lang === 'kh' ? 'លក្ខខណ្ឌការងារត្រូវបានកែប្រែជោគជ័យ!' : 'Workflow threshold updated successfully!',
        'Workflow Updated'
      );
      setEditingWorkflow(null);
      await loadAllData();
    } catch (err: any) {
      notify.error('Failed to update workflow: ' + (err.response?.data?.message || err.message));
    }
  };

  // Toggle Rule
  const handleToggleRule = async (ruleId: number) => {
    try {
      await toggleBusinessRule(ruleId);
      await loadAllData();
    } catch (err: any) {
      notify.error('Failed to toggle rule: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-2xl">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {lang === 'kh' ? 'មជ្ឈមណ្ឌលអនុម័ត និងអភិបាលកិច្ច' : 'Enterprise Approval & Workflow Governance'}
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Centralized signoff authority for high-value purchase orders, customer refunds, excessive discounts, and inventory write-offs.
          </p>
        </div>

        <button
          onClick={loadAllData}
          className="p-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-2xs transition self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Overview Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Signoffs</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {metrics?.pending_count ?? 0}
          </div>
          <p className="text-[11px] text-gray-500">Awaiting manager authorization</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Volume</span>
            <DollarSign className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 font-mono">
            ${(metrics?.pending_amount_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-gray-500">Total requested transaction value</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Approved Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {metrics?.approved_today ?? 0}
          </div>
          <p className="text-[11px] text-gray-500">Signoffs completed today</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Rejections</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 font-mono">
            {metrics?.rejected_total ?? 0}
          </div>
          <p className="text-[11px] text-gray-500">Denied governance requests</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-2xl p-1.5 shadow-2xs gap-1">
        {[
          { id: 'REQUESTS', label: lang === 'kh' ? 'សំណើកំពុងរង់ចាំ' : 'Approval Queue', icon: <Clock className="w-4 h-4" />, count: metrics?.pending_count },
          { id: 'WORKFLOWS', label: lang === 'kh' ? 'កម្រិតលក្ខខណ្ឌការងារ' : 'Workflow Thresholds', icon: <Layers className="w-4 h-4" /> },
          { id: 'RULES', label: lang === 'kh' ? 'វិធានអាជីវកម្មស្វ័យប្រវត្តិ' : 'Business Rules Engine (No-Code)', icon: <Sparkles className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition ${
              activeTab === tab.id
                ? 'bg-indigo-50 text-indigo-800 border border-indigo-200/60 shadow-xs'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: APPROVAL QUEUE LIST                                                */}
      {/* ========================================================================= */}
      {activeTab === 'REQUESTS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search requests by code, title..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
              {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {st}
                </button>
              ))}

              <div className="h-4 w-px bg-gray-300 mx-1" />

              {['ALL', 'SALES', 'PURCHASES', 'INVENTORY', 'FINANCE'].map((mod) => (
                <button
                  key={mod}
                  onClick={() => setModuleFilter(mod)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition shrink-0 ${
                    moduleFilter === mod
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>

          {/* Requests List Cards */}
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-gray-200 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto stroke-1" />
                <h3 className="font-bold text-gray-900 text-sm">All clear! No pending approval requests</h3>
                <p className="text-xs text-gray-500">Transactions exceeding workflow thresholds will appear here automatically.</p>
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className="p-5 bg-white rounded-2xl border border-gray-200 shadow-2xs hover:border-indigo-400 hover:shadow-md transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                        {req.request_code}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                        {req.workflow?.module || req.requestable_type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                        req.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition">
                      {req.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{req.reason}</p>

                    <div className="flex items-center space-x-4 text-[11px] text-gray-400 pt-1">
                      <span>Requested by: <strong className="text-gray-700">{req.requester?.name || 'Staff'}</strong></span>
                      <span>•</span>
                      <span>Branch: <strong className="text-gray-700">{req.branch?.name || 'Headquarters'}</strong></span>
                      <span>•</span>
                      <span className="font-mono">{new Date(req.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Requested Value</span>
                      <span className="font-mono font-black text-lg text-gray-900">
                        ${Number(req.amount).toFixed(2)}
                      </span>
                    </div>

                    {req.status === 'PENDING' && (
                      <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleApprove(req)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setIsRejecting(true);
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WORKFLOW THRESHOLDS & TRIGGER CONFIG                                */}
      {/* ========================================================================= */}
      {activeTab === 'WORKFLOWS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Approval Governance Policies & Threshold Limits</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Adjust the monetary values that automatically intercept transactions and require supervisory passcode or managerial signoff.
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {workflows.map((wf) => (
                <div key={wf.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-gray-50/50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {wf.module}
                      </span>
                      <h4 className="font-bold text-gray-900 text-sm">{wf.name}</h4>
                    </div>
                    <p className="text-xs text-gray-500">{wf.description}</p>
                    <div className="flex items-center space-x-3 text-[11px] text-gray-400 pt-1">
                      <span>Required Role: <strong className="text-indigo-700">{wf.required_role.replace('_', ' ')}</strong></span>
                      <span>•</span>
                      <span>Escalation: <strong>{wf.escalation_timeout_hours}h</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block uppercase">Trigger Threshold</span>
                      <span className="font-mono text-base font-black text-indigo-900">
                        {wf.trigger_event === 'HIGH_DISCOUNT' ? `${wf.threshold_amount}%` : `$${Number(wf.threshold_amount).toFixed(2)}`}
                      </span>
                    </div>

                    <button
                      onClick={() => setEditingWorkflow({ ...wf })}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
                    >
                      Configure
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BUSINESS RULES ENGINE (DOMAIN 41)                                  */}
      {/* ========================================================================= */}
      {activeTab === 'RULES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Enterprise Business Rules Engine (No-Code)</h3>
              <p className="text-xs text-gray-500">Automate actions triggered before checkout, on low inventory, or customer VIP levels.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => (
              <div key={rule.id} className="p-5 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                    {rule.rule_code}
                  </span>
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition ${
                      rule.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {rule.is_active ? 'Active' : 'Disabled'}
                  </button>
                </div>

                <h4 className="font-bold text-gray-900 text-sm">{rule.name}</h4>

                {/* IF - THEN Condition Pill */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-purple-700 uppercase text-[10px]">IF:</span>
                    <span className="font-mono text-gray-800">
                      {rule.condition_expression.field} {rule.condition_expression.operator} {rule.condition_expression.value}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-emerald-700 uppercase text-[10px]">THEN:</span>
                    <span className="font-semibold text-gray-900">{rule.action_type.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                  <span>Hook: <strong className="text-gray-600">{rule.event_hook}</strong></span>
                  <span>Priority: <strong className="text-gray-600">#{rule.priority}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILED REQUEST REVIEW DRAWER / MODAL                                    */}
      {/* ========================================================================= */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-gray-100 animate-scale-up my-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="font-mono font-bold text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {selectedRequest.request_code}
                </span>
                <h3 className="font-extrabold text-gray-900 text-base mt-1">{selectedRequest.title}</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setIsRejecting(false);
                  setDecisionNotes('');
                }}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Requested Amount Banner */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Requested Amount</span>
                <span className="font-mono text-2xl font-black text-indigo-950">${Number(selectedRequest.amount).toFixed(2)}</span>
              </div>
              <div className="text-right text-xs text-indigo-800">
                <span className="block font-semibold">Status: <strong>{selectedRequest.status}</strong></span>
                <span>Branch: {selectedRequest.branch?.name || 'All'}</span>
              </div>
            </div>

            {/* Justification / Reason */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Business Justification</span>
              <p className="p-3 bg-gray-50 rounded-xl text-xs text-gray-700 border border-gray-200 leading-relaxed">
                {selectedRequest.reason || 'No justification provided.'}
              </p>
            </div>

            {/* Snapshot Payload Details */}
            {selectedRequest.payload_snapshot && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Transaction Snapshot</span>
                <div className="p-3 bg-gray-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-40">
                  <pre>{JSON.stringify(selectedRequest.payload_snapshot, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Decision Notes Input */}
            {selectedRequest.status === 'PENDING' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  {isRejecting ? 'Rejection Reason (Required)' : 'Manager Notes / Instructions (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder={isRejecting ? 'Please explain why this request is rejected...' : 'Add any review comments or instructions...'}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Actions Toolbar */}
            <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setIsRejecting(false);
                }}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
              >
                Close
              </button>

              {selectedRequest.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleEscalate(selectedRequest)}
                    disabled={isProcessingAction}
                    className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition"
                  >
                    Escalate
                  </button>

                  {isRejecting ? (
                    <button
                      onClick={() => handleReject(selectedRequest)}
                      disabled={isProcessingAction}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
                    >
                      Confirm Rejection
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsRejecting(true)}
                        className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition"
                      >
                        Reject...
                      </button>
                      <button
                        onClick={() => handleApprove(selectedRequest)}
                        disabled={isProcessingAction}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
                      >
                        {isProcessingAction ? 'Approving...' : 'Approve Request'}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIGURE WORKFLOW THRESHOLD MODAL                                        */}
      {/* ========================================================================= */}
      {editingWorkflow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm">Configure Workflow Threshold</h3>
              <button onClick={() => setEditingWorkflow(null)} className="p-1 text-gray-400 hover:text-gray-700 rounded-xl">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Workflow Name</label>
                <input
                  type="text"
                  value={editingWorkflow.name}
                  onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Threshold Limit ({editingWorkflow.trigger_event === 'HIGH_DISCOUNT' ? 'Percent %' : 'Amount USD $'})
                </label>
                <input
                  type="number"
                  value={editingWorkflow.threshold_amount}
                  onChange={(e) => setEditingWorkflow({ ...editingWorkflow, threshold_amount: Number(e.target.value) })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm font-black"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Required Approver Role</label>
                <select
                  value={editingWorkflow.required_role}
                  onChange={(e) => setEditingWorkflow({ ...editingWorkflow, required_role: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold"
                >
                  <option value="STORE_MANAGER">Store Manager</option>
                  <option value="BRANCH_MANAGER">Branch Manager</option>
                  <option value="FINANCE_DIRECTOR">Finance Director</option>
                  <option value="SUPER_ADMIN">Super Administrator</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Escalation Timeout (Hours)</label>
                <input
                  type="number"
                  value={editingWorkflow.escalation_timeout_hours}
                  onChange={(e) => setEditingWorkflow({ ...editingWorkflow, escalation_timeout_hours: Number(e.target.value) })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono"
                />
              </div>

              <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingWorkflow.auto_notify_telegram}
                  onChange={(e) => setEditingWorkflow({ ...editingWorkflow, auto_notify_telegram: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="font-semibold text-gray-700">Dispatch Telegram alert upon trigger</span>
              </label>
            </div>

            <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setEditingWorkflow(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWorkflow}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                Save Threshold
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
