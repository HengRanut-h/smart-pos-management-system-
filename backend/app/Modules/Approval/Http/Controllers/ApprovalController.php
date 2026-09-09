<?php

namespace App\Modules\Approval\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Approval\Persistence\Models\ApprovalWorkflow;
use App\Modules\Approval\Persistence\Models\ApprovalRequest;
use App\Modules\Approval\Persistence\Models\ApprovalAction;
use App\Modules\Approval\Persistence\Models\BusinessRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApprovalController extends Controller
{
    // ==========================================
    // 1. APPROVAL REQUESTS INBOX
    // ==========================================

    public function index(Request $request): JsonResponse
    {
        $query = ApprovalRequest::with(['workflow', 'requester', 'decider', 'branch'])
            ->withCount('actions');

        if ($request->filled('status') && $request->status !== 'ALL') {
            $query->where('status', $request->status);
        }

        if ($request->filled('module') && $request->module !== 'ALL') {
            $query->whereHas('workflow', function ($q) use ($request) {
                $q->where('module', $request->module);
            });
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('request_code', 'like', "%{$s}%")
                  ->orWhere('title', 'like', "%{$s}%")
                  ->orWhere('reason', 'like', "%{$s}%");
            });
        }

        $requests = $query->orderBy('created_at', 'desc')->paginate($request->integer('per_page', 25));

        return response()->json([
            'success' => true,
            'data' => $requests,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $item = ApprovalRequest::with(['workflow', 'requester', 'decider', 'branch', 'actions.actor'])->find($id);
        if (!$item) {
            return response()->json(['success' => false, 'message' => 'Approval request not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $item,
        ]);
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $item = ApprovalRequest::findOrFail($id);
        if ($item->status !== 'PENDING' && $item->status !== 'ESCALATED') {
            return response()->json(['success' => false, 'message' => 'Request is already processed'], 422);
        }

        $userId = $request->user()?->id ?? 1;
        $notes = $request->input('notes', 'Approved by authorized manager');

        DB::transaction(function () use ($item, $userId, $notes, $request) {
            $item->update([
                'status' => 'APPROVED',
                'decided_by' => $userId,
                'decided_at' => now(),
                'decision_notes' => $notes,
            ]);

            ApprovalAction::create([
                'request_id' => $item->id,
                'actor_id' => $userId,
                'action' => 'APPROVE',
                'comments' => $notes,
                'ip_address' => $request->ip(),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => "Request #{$item->request_code} has been approved successfully",
            'data' => $item->fresh(['decider', 'actions']),
        ]);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:3',
        ]);

        $item = ApprovalRequest::findOrFail($id);
        if ($item->status !== 'PENDING' && $item->status !== 'ESCALATED') {
            return response()->json(['success' => false, 'message' => 'Request is already processed'], 422);
        }

        $userId = $request->user()?->id ?? 1;

        DB::transaction(function () use ($item, $userId, $validated, $request) {
            $item->update([
                'status' => 'REJECTED',
                'decided_by' => $userId,
                'decided_at' => now(),
                'decision_notes' => $validated['reason'],
            ]);

            ApprovalAction::create([
                'request_id' => $item->id,
                'actor_id' => $userId,
                'action' => 'REJECT',
                'comments' => $validated['reason'],
                'ip_address' => $request->ip(),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => "Request #{$item->request_code} was rejected",
            'data' => $item->fresh(['decider', 'actions']),
        ]);
    }

    public function escalate(Request $request, int $id): JsonResponse
    {
        $item = ApprovalRequest::findOrFail($id);
        $userId = $request->user()?->id ?? 1;
        $notes = $request->input('notes', 'Escalated to Executive Committee / Super Admin');

        DB::transaction(function () use ($item, $userId, $notes, $request) {
            $item->update([
                'status' => 'ESCALATED',
            ]);

            ApprovalAction::create([
                'request_id' => $item->id,
                'actor_id' => $userId,
                'action' => 'ESCALATE',
                'comments' => $notes,
                'ip_address' => $request->ip(),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => "Request #{$item->request_code} has been escalated to Executive tier",
            'data' => $item->fresh('actions'),
        ]);
    }

    public function summaryMetrics(): JsonResponse
    {
        $pendingCount = ApprovalRequest::where('status', 'PENDING')->count();
        $approvedToday = ApprovalRequest::where('status', 'APPROVED')->whereDate('decided_at', now()->toDateString())->count();
        $rejectedTotal = ApprovalRequest::where('status', 'REJECTED')->count();
        $pendingAmountUsd = ApprovalRequest::where('status', 'PENDING')->sum('amount');

        $byModule = ApprovalRequest::where('status', 'PENDING')
            ->join('approval_workflows', 'approval_requests.workflow_id', '=', 'approval_workflows.id')
            ->select('approval_workflows.module', DB::raw('count(*) as count'), DB::raw('sum(approval_requests.amount) as total_amount'))
            ->groupBy('approval_workflows.module')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'pending_count' => $pendingCount,
                'approved_today' => $approvedToday,
                'rejected_total' => $rejectedTotal,
                'pending_amount_usd' => (float)$pendingAmountUsd,
                'by_module' => $byModule,
            ],
        ]);
    }

    // ==========================================
    // 2. WORKFLOW RULES & THRESHOLDS
    // ==========================================

    public function workflows(): JsonResponse
    {
        $workflows = ApprovalWorkflow::with('branch')->orderBy('module')->get();

        return response()->json([
            'success' => true,
            'data' => $workflows,
        ]);
    }

    public function updateWorkflow(Request $request, int $id): JsonResponse
    {
        $wf = ApprovalWorkflow::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'threshold_amount' => 'sometimes|numeric|min:0',
            'required_role' => 'sometimes|string',
            'escalation_timeout_hours' => 'sometimes|integer|min:1',
            'auto_notify_telegram' => 'sometimes|boolean',
            'is_active' => 'sometimes|boolean',
        ]);

        $wf->update($validated);

        return response()->json([
            'success' => true,
            'message' => "Workflow '{$wf->name}' updated successfully",
            'data' => $wf,
        ]);
    }

    // ==========================================
    // 3. ENTERPRISE BUSINESS RULES ENGINE
    // ==========================================

    public function businessRules(): JsonResponse
    {
        $rules = BusinessRule::orderBy('priority', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $rules,
        ]);
    }

    public function saveBusinessRule(Request $request, ?int $id = null): JsonResponse
    {
        $validated = $request->validate([
            'rule_code' => 'required|string|max:100',
            'name' => 'required|string|max:150',
            'domain' => 'required|string',
            'event_hook' => 'required|string',
            'condition_expression' => 'required|array',
            'action_type' => 'required|string',
            'action_payload' => 'nullable|array',
            'priority' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        if ($id) {
            $rule = BusinessRule::findOrFail($id);
            $rule->update($validated);
        } else {
            $rule = BusinessRule::create($validated);
        }

        return response()->json([
            'success' => true,
            'message' => "Business Rule '{$rule->name}' saved successfully",
            'data' => $rule,
        ]);
    }

    public function toggleBusinessRule(int $id): JsonResponse
    {
        $rule = BusinessRule::findOrFail($id);
        $rule->is_active = !$rule->is_active;
        $rule->save();

        return response()->json([
            'success' => true,
            'message' => "Rule '{$rule->name}' is now " . ($rule->is_active ? 'Active' : 'Disabled'),
            'data' => $rule,
        ]);
    }
}
