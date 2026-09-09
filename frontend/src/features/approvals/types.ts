export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'ESCALATED';

export interface ApprovalWorkflowItem {
  id: number;
  code: string;
  name: string;
  module: 'SALES' | 'PURCHASES' | 'INVENTORY' | 'FINANCE' | 'CUSTOMER';
  description?: string;
  trigger_event: string;
  threshold_amount: number;
  required_role: string;
  escalation_timeout_hours: number;
  auto_notify_telegram: boolean;
  is_active: boolean;
  branch?: { id: number; name: string };
}

export interface ApprovalActionItem {
  id: number;
  request_id: number;
  actor_id: number;
  action: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'ESCALATE' | 'COMMENT';
  comments?: string;
  ip_address?: string;
  created_at: string;
  actor?: { id: number; name: string; username?: string };
}

export interface ApprovalRequestItem {
  id: number;
  request_code: string;
  workflow_id: number;
  requestable_type: string;
  requestable_id?: number;
  title: string;
  reason?: string;
  amount: number;
  currency: string;
  status: ApprovalStatus;
  payload_snapshot?: Record<string, any>;
  requested_by: number;
  decided_by?: number | null;
  decided_at?: string | null;
  decision_notes?: string | null;
  branch_id?: number | null;
  created_at: string;
  updated_at: string;
  workflow?: ApprovalWorkflowItem;
  requester?: { id: number; name: string; email?: string };
  decider?: { id: number; name: string };
  branch?: { id: number; name: string; code: string };
  actions?: ApprovalActionItem[];
}

export interface BusinessRuleItem {
  id: number;
  rule_code: string;
  name: string;
  domain: 'SALES' | 'INVENTORY' | 'PRICING' | 'CUSTOMER' | 'PROCUREMENT';
  event_hook: string;
  condition_expression: Record<string, any>;
  action_type: string;
  action_payload?: Record<string, any>;
  priority: number;
  is_active: boolean;
}

export interface ApprovalSummaryMetrics {
  pending_count: number;
  approved_today: number;
  rejected_total: number;
  pending_amount_usd: number;
  by_module: Array<{ module: string; count: number; total_amount: number }>;
}
