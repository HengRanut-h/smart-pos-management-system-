<?php

namespace App\Modules\Invoice\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Invoice\Persistence\Models\InvoiceTemplate;
use App\Modules\Invoice\Persistence\Models\InvoiceTemplateVersion;
use App\Modules\Invoice\Persistence\Models\InvoiceTemplateAssignment;
use App\Modules\Invoice\Persistence\Models\InvoiceSequence;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class InvoiceTemplateController extends Controller
{
    // ==========================================
    // 1. TEMPLATES CRUD & ACTIONS
    // ==========================================

    public function index(Request $request): JsonResponse
    {
        $query = InvoiceTemplate::with(['branch', 'creator'])->withCount('assignments');

        if ($request->filled('document_type') && $request->document_type !== 'ALL') {
            $query->where('document_type', $request->document_type);
        }

        if ($request->filled('paper_size') && $request->paper_size !== 'ALL') {
            $query->where('paper_size', $request->paper_size);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('code', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%");
            });
        }

        $templates = $query->orderBy('is_default', 'desc')->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $templates,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $template = InvoiceTemplate::with(['versions.creator', 'assignments.branch', 'branch'])->find($id);
        if (!$template) {
            return response()->json(['success' => false, 'message' => 'Template not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $template,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'code' => 'nullable|string|max:100|unique:invoice_templates,code',
            'document_type' => 'required|string',
            'paper_size' => 'required|string',
            'orientation' => 'nullable|string',
            'is_default' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string',
            'layout_config' => 'required|array',
            'styles_config' => 'required|array',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        if (empty($validated['code'])) {
            $validated['code'] = Str::slug($validated['name']) . '-' . Str::random(5);
        }

        $userId = $request->user()?->id ?? 1;
        $validated['created_by'] = $userId;

        return DB::transaction(function () use ($validated, $userId) {
            // If marked as default, unset existing default for document_type
            if (!empty($validated['is_default']) && $validated['is_default']) {
                InvoiceTemplate::where('document_type', $validated['document_type'])->update(['is_default' => false]);
            }

            $template = InvoiceTemplate::create($validated);

            // Create initial version 1
            InvoiceTemplateVersion::create([
                'template_id' => $template->id,
                'version_number' => 1,
                'change_summary' => 'Initial template creation',
                'layout_config' => $template->layout_config,
                'styles_config' => $template->styles_config,
                'created_by' => $userId,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Template created successfully',
                'data' => $template->load('versions'),
            ], 201);
        });
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $template = InvoiceTemplate::find($id);
        if (!$template) {
            return response()->json(['success' => false, 'message' => 'Template not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:150',
            'document_type' => 'sometimes|string',
            'paper_size' => 'sometimes|string',
            'orientation' => 'nullable|string',
            'is_default' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'description' => 'nullable|string',
            'layout_config' => 'sometimes|array',
            'styles_config' => 'sometimes|array',
            'branch_id' => 'nullable|exists:branches,id',
            'change_summary' => 'nullable|string|max:255',
        ]);

        $userId = $request->user()?->id ?? 1;

        return DB::transaction(function () use ($template, $validated, $userId) {
            if (!empty($validated['is_default']) && $validated['is_default']) {
                InvoiceTemplate::where('document_type', $template->document_type)
                    ->where('id', '!=', $template->id)
                    ->update(['is_default' => false]);
            }

            $changeSummary = $validated['change_summary'] ?? 'Updated styling & layout';
            unset($validated['change_summary']);

            $template->update($validated);

            // Record new version
            $latestVersion = InvoiceTemplateVersion::where('template_id', $template->id)->max('version_number') ?? 0;
            InvoiceTemplateVersion::create([
                'template_id' => $template->id,
                'version_number' => $latestVersion + 1,
                'change_summary' => $changeSummary,
                'layout_config' => $template->layout_config,
                'styles_config' => $template->styles_config,
                'created_by' => $userId,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Template updated and new version saved',
                'data' => $template->fresh(['versions', 'branch']),
            ]);
        });
    }

    public function duplicate(int $id): JsonResponse
    {
        $template = InvoiceTemplate::find($id);
        if (!$template) {
            return response()->json(['success' => false, 'message' => 'Template not found'], 404);
        }

        $new = $template->replicate(['code', 'is_default']);
        $new->name = $template->name . ' (Copy)';
        $new->code = Str::slug($new->name) . '-' . Str::random(5);
        $new->is_default = false;
        $new->save();

        InvoiceTemplateVersion::create([
            'template_id' => $new->id,
            'version_number' => 1,
            'change_summary' => 'Cloned from ' . $template->name,
            'layout_config' => $new->layout_config,
            'styles_config' => $new->styles_config,
            'created_by' => 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Template duplicated successfully',
            'data' => $new->load('versions'),
        ], 201);
    }

    public function setDefault(int $id): JsonResponse
    {
        $template = InvoiceTemplate::find($id);
        if (!$template) {
            return response()->json(['success' => false, 'message' => 'Template not found'], 404);
        }

        InvoiceTemplate::where('document_type', $template->document_type)->update(['is_default' => false]);
        $template->update(['is_default' => true]);

        return response()->json([
            'success' => true,
            'message' => "'{$template->name}' set as default for {$template->document_type}",
            'data' => $template,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $template = InvoiceTemplate::find($id);
        if (!$template) {
            return response()->json(['success' => false, 'message' => 'Template not found'], 404);
        }

        if ($template->is_default) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete the default template. Please set another template as default first.',
            ], 422);
        }

        $template->delete();

        return response()->json([
            'success' => true,
            'message' => 'Template deleted successfully',
        ]);
    }

    public function restoreVersion(int $id, int $versionId): JsonResponse
    {
        $template = InvoiceTemplate::find($id);
        if (!$template) {
            return response()->json(['success' => false, 'message' => 'Template not found'], 404);
        }

        $version = InvoiceTemplateVersion::where('template_id', $template->id)->find($versionId);
        if (!$version) {
            return response()->json(['success' => false, 'message' => 'Version snapshot not found'], 404);
        }

        $template->update([
            'layout_config' => $version->layout_config,
            'styles_config' => $version->styles_config,
        ]);

        // Record a new version recording the rollback
        $latestVersion = InvoiceTemplateVersion::where('template_id', $template->id)->max('version_number') ?? 0;
        InvoiceTemplateVersion::create([
            'template_id' => $template->id,
            'version_number' => $latestVersion + 1,
            'change_summary' => "Restored from Version #{$version->version_number}",
            'layout_config' => $version->layout_config,
            'styles_config' => $version->styles_config,
            'created_by' => 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Successfully restored layout from Version #{$version->version_number}",
            'data' => $template->fresh('versions'),
        ]);
    }

    // ==========================================
    // 2. ASSIGNMENTS MATRIX
    // ==========================================

    public function getAssignments(): JsonResponse
    {
        $assignments = InvoiceTemplateAssignment::with(['template', 'branch'])
            ->orderBy('document_type', 'asc')
            ->orderBy('priority', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $assignments,
        ]);
    }

    public function saveAssignments(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'assignments' => 'required|array',
            'assignments.*.template_id' => 'required|exists:invoice_templates,id',
            'assignments.*.document_type' => 'required|string',
            'assignments.*.branch_id' => 'nullable|exists:branches,id',
            'assignments.*.pos_terminal_code' => 'nullable|string',
            'assignments.*.sales_channel' => 'nullable|string',
            'assignments.*.customer_group' => 'nullable|string',
            'assignments.*.priority' => 'nullable|integer',
            'assignments.*.is_active' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($validated) {
            InvoiceTemplateAssignment::truncate();
            foreach ($validated['assignments'] as $item) {
                InvoiceTemplateAssignment::create($item);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Assignments updated successfully',
            'data' => InvoiceTemplateAssignment::with(['template', 'branch'])->get(),
        ]);
    }

    // ==========================================
    // 3. NUMBERING SEQUENCES
    // ==========================================

    public function getSequences(): JsonResponse
    {
        $sequences = InvoiceSequence::with('branch')->orderBy('document_type', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $sequences,
        ]);
    }

    public function saveSequence(Request $request, ?int $id = null): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'document_type' => 'required|string|max:50',
            'pattern' => 'required|string|max:100',
            'prefix' => 'nullable|string|max:30',
            'suffix' => 'nullable|string|max:30',
            'current_number' => 'nullable|integer|min:0',
            'padding' => 'nullable|integer|min:1|max:10',
            'reset_frequency' => 'nullable|string|in:NEVER,YEARLY,MONTHLY,DAILY',
            'branch_id' => 'nullable|exists:branches,id',
            'is_active' => 'nullable|boolean',
        ]);

        if ($id) {
            $seq = InvoiceSequence::findOrFail($id);
            $seq->update($validated);
        } else {
            $seq = InvoiceSequence::create($validated);
        }

        return response()->json([
            'success' => true,
            'message' => 'Numbering sequence saved successfully',
            'data' => $seq->fresh('branch'),
        ]);
    }

    public function previewSequence(Request $request): JsonResponse
    {
        $pattern = $request->input('pattern', 'INV-{YYYY}-{####}');
        $padding = (int) $request->input('padding', 4);
        $current = (int) $request->input('current_number', 1);
        $branchCode = $request->input('branch_code', 'HQ');

        $now = now();
        $numStr = str_pad((string)$current, $padding, '0', STR_PAD_LEFT);

        $replacements = [
            '{YYYY}' => $now->format('Y'),
            '{YY}' => $now->format('y'),
            '{MM}' => $now->format('m'),
            '{DD}' => $now->format('d'),
            '{YYYYMM}' => $now->format('Ym'),
            '{BRANCH}' => strtoupper($branchCode),
            '{####}' => $numStr,
            '{###}' => str_pad((string)$current, 3, '0', STR_PAD_LEFT),
            '{#####}' => str_pad((string)$current, 5, '0', STR_PAD_LEFT),
            '{######}' => str_pad((string)$current, 6, '0', STR_PAD_LEFT),
        ];

        $result = str_replace(array_keys($replacements), array_values($replacements), $pattern);

        return response()->json([
            'success' => true,
            'pattern' => $pattern,
            'sample_output' => $result,
        ]);
    }
}
