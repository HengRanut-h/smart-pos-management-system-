<?php

namespace App\Modules\Settings\Application\Services;

use App\Modules\Organization\Persistence\Models\Branch;
use App\Modules\Settings\Persistence\Models\BranchSetting;
use App\Modules\Settings\Persistence\Models\BranchUser;
use App\Modules\Settings\Persistence\Models\BranchPosTerminal;
use App\Modules\Settings\Persistence\Models\BranchPrinter;
use App\Modules\Settings\Persistence\Models\BranchNumberSequence;
use App\Modules\Settings\Persistence\Models\BranchBusinessHour;
use App\Modules\Settings\Persistence\Models\BranchHoliday;
use App\Modules\Warehouse\Persistence\Models\Warehouse;

class BranchManagementService
{
    protected SystemSettingsService $systemService;

    public function __construct(SystemSettingsService $systemService)
    {
        $this->systemService = $systemService;
    }

    public function getAllBranches(): array
    {
        return Branch::withCount(['warehouses', 'posTerminals', 'employees', 'branchUsers', 'printers'])
            ->orderBy('id')
            ->get()
            ->toArray();
    }

    public function getBranchDetails(int $id): ?Branch
    {
        return Branch::with([
            'warehouses',
            'posTerminals.assignedCashier',
            'printers',
            'numberSequences',
            'businessHours',
            'holidays',
            'branchUsers.user',
            'branchSettings',
        ])->find($id);
    }

    public function createBranch(array $data): Branch
    {
        $branch = Branch::create([
            'code' => $data['code'],
            'name' => $data['name'],
            'branch_type' => $data['branch_type'] ?? 'RETAIL_STORE',
            'address' => $data['address'] ?? null,
            'city' => $data['city'] ?? 'Phnom Penh',
            'province' => $data['province'] ?? 'Phnom Penh',
            'country' => $data['country'] ?? 'Cambodia',
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'manager_name' => $data['manager_name'] ?? null,
            'manager_phone' => $data['manager_phone'] ?? null,
            'manager_email' => $data['manager_email'] ?? null,
            'opening_date' => $data['opening_date'] ?? date('Y-m-d'),
            'logo_url' => $data['logo_url'] ?? null,
            'tax_rate' => $data['tax_rate'] ?? 10.00,
            'tax_id' => $data['tax_id'] ?? null,
            'currency_code' => $data['currency_code'] ?? 'USD',
            'timezone' => $data['timezone'] ?? 'Asia/Phnom_Penh',
            'working_hours_summary' => $data['working_hours_summary'] ?? 'Mon-Sun: 07:30 - 21:30',
            'status_id' => $data['status_id'] ?? 1,
        ]);

        // Initialize default numbering sequences for new branch
        $this->initDefaultSequences($branch->id, $branch->code);

        // Initialize 7 days operating hours
        $this->initDefaultBusinessHours($branch->id);

        // Initialize default POS Terminal
        BranchPosTerminal::create([
            'branch_id' => $branch->id,
            'terminal_code' => 'POS-' . strtoupper(substr(str_replace('-', '', $branch->code), 0, 4)) . '-01',
            'terminal_name' => $branch->name . ' - POS Terminal 1',
            'status' => 'ONLINE',
            'cash_drawer_enabled' => true,
            'auto_print' => true,
            'receipt_copies' => 1,
        ]);

        // Initialize default receipt printer
        BranchPrinter::create([
            'branch_id' => $branch->id,
            'printer_name' => 'Main Receipt Printer (80mm)',
            'printer_type' => 'RECEIPT_80MM',
            'connection_type' => 'NETWORK_LAN',
            'ip_address' => '192.168.1.200',
            'port' => 9100,
            'paper_width_mm' => 80,
            'is_default' => true,
            'auto_cut' => true,
            'cash_drawer_kick' => true,
            'status' => 'ONLINE',
        ]);

        return $branch;
    }

    public function updateBranch(int $id, array $data, ?int $userId = null, ?string $ip = null, ?string $agent = null): ?Branch
    {
        $branch = Branch::find($id);
        if (!$branch) return null;

        $oldData = $branch->toArray();
        $branch->update($data);

        foreach ($data as $k => $v) {
            $oldVal = $oldData[$k] ?? null;
            if ($oldVal != $v) {
                $this->systemService->logAudit($userId, null, $branch->id, 'BRANCH', $k, (string)$oldVal, (string)$v, $ip, $agent);
            }
        }

        return $branch;
    }

    public function deleteBranch(int $id): bool
    {
        $branch = Branch::find($id);
        if (!$branch) return false;
        return (bool)$branch->delete();
    }

    public function getBranchOverrides(int $branchId): array
    {
        return BranchSetting::where('branch_id', $branchId)->pluck('value', 'key')->toArray();
    }

    public function saveBranchOverrides(int $branchId, array $overrides, ?int $userId = null, ?string $ip = null, ?string $agent = null): array
    {
        $current = $this->getBranchOverrides($branchId);

        foreach ($overrides as $k => $v) {
            $oldVal = $current[$k] ?? null;
            $newValStr = is_bool($v) ? ($v ? 'true' : 'false') : (is_array($v) ? json_encode($v) : (string)$v);

            BranchSetting::updateOrCreate(
                ['branch_id' => $branchId, 'key' => $k],
                [
                    'value' => $newValStr,
                    'value_type' => is_bool($v) ? 'boolean' : (is_numeric($v) ? 'float' : 'string'),
                ]
            );

            if ($oldVal !== $newValStr) {
                $this->systemService->logAudit($userId, null, $branchId, 'BRANCH_SETTING', $k, (string)$oldVal, (string)$newValStr, $ip, $agent);
            }

            $current[$k] = $newValStr;
        }

        return $current;
    }

    public function getMergedSettingsForBranch(int $branchId): array
    {
        $global = $this->systemService->getGlobalSettings();
        $overrides = $this->getBranchOverrides($branchId);

        $branch = Branch::find($branchId);
        $branchDefaults = [];
        if ($branch) {
            $branchDefaults['store_name'] = $branch->name;
            $branchDefaults['branch_code'] = $branch->code;
            $branchDefaults['address'] = $branch->address;
            $branchDefaults['phone_number'] = $branch->phone;
            $branchDefaults['email'] = $branch->email;
            $branchDefaults['default_vat_rate'] = $branch->tax_rate;
            $branchDefaults['currency_code'] = $branch->currency_code;
            $branchDefaults['timezone'] = $branch->timezone;
        }

        return array_merge($global, $branchDefaults, $overrides);
    }

    public function initDefaultSequences(int $branchId, string $branchCode): void
    {
        $codeTag = strtoupper(substr(str_replace('-', '', $branchCode), 0, 4));
        $types = [
            'INVOICE' => ['prefix' => 'INV-' . $codeTag . '-', 'padding' => 6],
            'RECEIPT' => ['prefix' => 'POS-' . $codeTag . '-', 'padding' => 6],
            'ORDER' => ['prefix' => 'ORD-' . $codeTag . '-', 'padding' => 6],
            'PURCHASE' => ['prefix' => 'PO-' . $codeTag . '-', 'padding' => 6],
            'RETURN' => ['prefix' => 'RET-' . $codeTag . '-', 'padding' => 6],
        ];

        foreach ($types as $docType => $cfg) {
            BranchNumberSequence::updateOrCreate(
                ['branch_id' => $branchId, 'document_type' => $docType],
                [
                    'prefix' => $cfg['prefix'],
                    'starting_number' => 1,
                    'current_number' => 1,
                    'zero_padding' => $cfg['padding'],
                    'date_format_token' => 'YYYY',
                    'preview_sample' => $cfg['prefix'] . date('Y') . '-000001',
                ]
            );
        }
    }

    public function initDefaultBusinessHours(int $branchId): void
    {
        $days = [
            0 => 'Sunday',
            1 => 'Monday',
            2 => 'Tuesday',
            3 => 'Wednesday',
            4 => 'Thursday',
            5 => 'Friday',
            6 => 'Saturday',
        ];

        foreach ($days as $dayNum => $dayName) {
            BranchBusinessHour::updateOrCreate(
                ['branch_id' => $branchId, 'day_of_week' => $dayNum],
                [
                    'day_name' => $dayName,
                    'is_open' => true,
                    'open_time' => '07:30',
                    'close_time' => '21:30',
                    'break_start' => null,
                    'break_end' => null,
                ]
            );
        }
    }

    // POS Terminals Management
    public function getTerminals(int $branchId): array
    {
        return BranchPosTerminal::with('assignedCashier')
            ->where('branch_id', $branchId)
            ->get()
            ->toArray();
    }

    public function saveTerminal(array $data): BranchPosTerminal
    {
        if (!empty($data['id'])) {
            $t = BranchPosTerminal::findOrFail($data['id']);
            $t->update($data);
            return $t;
        }
        return BranchPosTerminal::create($data);
    }

    public function deleteTerminal(int $id): bool
    {
        $t = BranchPosTerminal::find($id);
        return $t ? (bool)$t->delete() : false;
    }

    // Printers Management
    public function getPrinters(int $branchId): array
    {
        return BranchPrinter::where('branch_id', $branchId)->get()->toArray();
    }

    public function savePrinter(array $data): BranchPrinter
    {
        if (!empty($data['id'])) {
            $p = BranchPrinter::findOrFail($data['id']);
            $p->update($data);
            return $p;
        }
        return BranchPrinter::create($data);
    }

    public function deletePrinter(int $id): bool
    {
        $p = BranchPrinter::find($id);
        return $p ? (bool)$p->delete() : false;
    }

    // Number Sequences
    public function getSequences(int $branchId): array
    {
        return BranchNumberSequence::where('branch_id', $branchId)->get()->toArray();
    }

    public function saveSequence(array $data): BranchNumberSequence
    {
        $seq = BranchNumberSequence::updateOrCreate(
            [
                'branch_id' => $data['branch_id'],
                'document_type' => $data['document_type'],
            ],
            $data
        );
        $sample = $seq->prefix . ($seq->date_format_token !== 'NONE' ? date('Y') . '-' : '') . str_pad((string)$seq->current_number, $seq->zero_padding, '0', STR_PAD_LEFT);
        $seq->update(['preview_sample' => $sample]);
        return $seq;
    }

    // Business Hours
    public function getBusinessHours(int $branchId): array
    {
        return BranchBusinessHour::where('branch_id', $branchId)->orderBy('day_of_week')->get()->toArray();
    }

    public function saveBusinessHours(int $branchId, array $hours): void
    {
        foreach ($hours as $h) {
            BranchBusinessHour::updateOrCreate(
                [
                    'branch_id' => $branchId,
                    'day_of_week' => $h['day_of_week'],
                ],
                $h
            );
        }
    }

    // Holidays
    public function getHolidays(?int $branchId = null): array
    {
        $q = BranchHoliday::query();
        if ($branchId) {
            $q->where(fn($query) => $query->where('branch_id', $branchId)->orWhereNull('branch_id'));
        }
        return $q->orderBy('holiday_date')->get()->toArray();
    }

    public function saveHoliday(array $data): BranchHoliday
    {
        if (!empty($data['id'])) {
            $h = BranchHoliday::findOrFail($data['id']);
            $h->update($data);
            return $h;
        }
        return BranchHoliday::create($data);
    }

    public function deleteHoliday(int $id): bool
    {
        $h = BranchHoliday::find($id);
        return $h ? (bool)$h->delete() : false;
    }

    // Branch Users
    public function getBranchUsers(int $branchId): array
    {
        return BranchUser::with('user')
            ->where('branch_id', $branchId)
            ->get()
            ->toArray();
    }

    public function assignUser(array $data): BranchUser
    {
        return BranchUser::updateOrCreate(
            [
                'branch_id' => $data['branch_id'],
                'user_id' => $data['user_id'],
            ],
            $data
        );
    }

    public function removeUser(int $id): bool
    {
        $u = BranchUser::find($id);
        return $u ? (bool)$u->delete() : false;
    }
}
