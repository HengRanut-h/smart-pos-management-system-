<?php

require __DIR__ . '/../../../../../vendor/autoload.php';
$app = require_once __DIR__ . '/../../../../../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Modules\Settings\Persistence\Models\Company;
use App\Modules\Settings\Persistence\Models\SystemSetting;
use App\Modules\Settings\Persistence\Models\BranchSetting;
use App\Modules\Settings\Persistence\Models\BranchUser;
use App\Modules\Settings\Persistence\Models\BranchPosTerminal;
use App\Modules\Settings\Persistence\Models\BranchPrinter;
use App\Modules\Settings\Persistence\Models\BranchNumberSequence;
use App\Modules\Settings\Persistence\Models\BranchBusinessHour;
use App\Modules\Settings\Persistence\Models\BranchHoliday;
use App\Modules\Settings\Persistence\Models\SystemNotificationSetting;
use App\Modules\Settings\Persistence\Models\SystemAuditLog;
use App\Modules\Organization\Persistence\Models\Branch;
use App\Modules\Warehouse\Persistence\Models\Warehouse;
use App\Modules\User\Persistence\Models\User;

echo "Seeding System & Branch Settings...\n";

// 1. Company
$company = Company::updateOrCreate(
    ['code' => 'SMARTPOS-HQ'],
    [
        'name' => 'SmartPOS Global Retail Co., Ltd.',
        'legal_name' => 'SmartPOS Cambodia International Plc.',
        'tax_id' => 'K002-902100481',
        'email' => 'contact@smartpos.com.kh',
        'phone' => '+855 23 888 999',
        'website' => 'https://smartpos.com.kh',
        'address' => 'Monivong Blvd, Sangkat Boeung Keng Kang 1, Khan Boeng Keng Kang, Phnom Penh',
        'city' => 'Phnom Penh',
        'province' => 'Phnom Penh',
        'country' => 'Cambodia',
        'logo_url' => 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&auto=format&fit=crop&q=80',
        'currency_code' => 'USD',
        'currency_symbol' => '$',
        'timezone' => 'Asia/Phnom_Penh',
        'fiscal_year_start' => '01-01',
        'status_id' => 1,
    ]
);
echo "Company profile seeded: {$company->name}\n";

// 2. Multi-Branch Hierarchy
$branchesData = [
    [
        'code' => 'HQ-01',
        'name' => 'Phnom Penh Headquarters',
        'branch_type' => 'HEAD_OFFICE',
        'address' => 'Monivong Blvd, Sangkat Boeung Keng Kang 1, Phnom Penh',
        'city' => 'Phnom Penh',
        'province' => 'Phnom Penh',
        'country' => 'Cambodia',
        'phone' => '+855 23 888 999',
        'email' => 'hq@smartpos.com.kh',
        'manager_name' => 'Oknha Bun Seng',
        'opening_date' => '2024-01-01',
        'tax_rate' => 10.00,
        'tax_id' => 'K002-902100481',
        'currency_code' => 'USD',
        'working_hours_summary' => 'Mon-Fri: 08:00 - 17:30',
    ],
    [
        'code' => 'B-PP-01',
        'name' => 'Branch 001 — Phnom Penh Flagship',
        'branch_type' => 'RETAIL_STORE',
        'address' => 'Sothearos Blvd, Sangkat Tonle Bassac, Chamkarmon, Phnom Penh',
        'city' => 'Phnom Penh',
        'province' => 'Phnom Penh',
        'country' => 'Cambodia',
        'phone' => '+855 23 999 111',
        'email' => 'branch.pp@smartpos.com.kh',
        'manager_name' => 'Chanthy Prak',
        'opening_date' => '2024-06-15',
        'tax_rate' => 10.00,
        'tax_id' => 'K002-902100481-001',
        'currency_code' => 'USD',
        'working_hours_summary' => 'Mon-Sun: 07:30 - 22:00',
    ],
    [
        'code' => 'B-SR-02',
        'name' => 'Branch 002 — Siem Reap Angkor Store',
        'branch_type' => 'RETAIL_STORE',
        'address' => 'Sivutha Blvd, Svay Dangkum, Siem Reap City, Siem Reap',
        'city' => 'Siem Reap',
        'province' => 'Siem Reap',
        'country' => 'Cambodia',
        'phone' => '+855 63 777 222',
        'email' => 'branch.sr@smartpos.com.kh',
        'manager_name' => 'Sophea Vuth',
        'opening_date' => '2025-02-01',
        'tax_rate' => 10.00,
        'tax_id' => 'K002-902100481-002',
        'currency_code' => 'USD',
        'working_hours_summary' => 'Mon-Sun: 08:00 - 22:30',
    ],
    [
        'code' => 'B-BT-03',
        'name' => 'Branch 003 — Battambang Heritage Store',
        'branch_type' => 'RETAIL_STORE',
        'address' => 'Street 1, Sangkat Svay Pao, Battambang City, Battambang',
        'city' => 'Battambang',
        'province' => 'Battambang',
        'country' => 'Cambodia',
        'phone' => '+855 53 666 333',
        'email' => 'branch.bt@smartpos.com.kh',
        'manager_name' => 'Rathana Chea',
        'opening_date' => '2025-08-10',
        'tax_rate' => 10.00,
        'tax_id' => 'K002-902100481-003',
        'currency_code' => 'USD',
        'working_hours_summary' => 'Mon-Sun: 07:30 - 21:00',
    ],
];

$daysOfWeek = [
    0 => 'Sunday',
    1 => 'Monday',
    2 => 'Tuesday',
    3 => 'Wednesday',
    4 => 'Thursday',
    5 => 'Friday',
    6 => 'Saturday',
];

foreach ($branchesData as $bData) {
    $branch = Branch::updateOrCreate(
        ['code' => $bData['code']],
        array_merge($bData, ['status_id' => 1])
    );

    $codePrefix = strtoupper(substr(str_replace(['-', 'B', '_'], '', $bData['code']), 0, 2));
    if (empty($codePrefix)) $codePrefix = 'HQ';

    // 1. POS Terminals
    BranchPosTerminal::updateOrCreate(
        ['branch_id' => $branch->id, 'terminal_code' => "POS-{$codePrefix}-01"],
        [
            'terminal_name' => "{$branch->name} — Register 01",
            'ip_address' => '192.168.1.' . (10 + $branch->id),
            'status' => 'ONLINE',
            'cash_drawer_enabled' => true,
            'auto_print' => true,
            'receipt_copies' => 1,
            'last_active_at' => now(),
        ]
    );

    if ($branch->code === 'B-PP-01') {
        BranchPosTerminal::updateOrCreate(
            ['branch_id' => $branch->id, 'terminal_code' => "POS-PP-02"],
            [
                'terminal_name' => "{$branch->name} — Express Checkout 02",
                'ip_address' => '192.168.1.12',
                'status' => 'ONLINE',
                'cash_drawer_enabled' => true,
                'auto_print' => true,
                'receipt_copies' => 1,
                'last_active_at' => now(),
            ]
        );
    }

    // 2. Printers
    BranchPrinter::updateOrCreate(
        ['branch_id' => $branch->id, 'printer_name' => "Thermal Receipt 80mm ({$codePrefix})"],
        [
            'printer_type' => 'RECEIPT_80MM',
            'connection_type' => 'NETWORK_LAN',
            'ip_address' => '192.168.1.' . (50 + $branch->id),
            'port' => 9100,
            'paper_width_mm' => 80,
            'is_default' => true,
            'auto_cut' => true,
            'cash_drawer_kick' => true,
            'status' => 'ONLINE',
        ]
    );

    BranchPrinter::updateOrCreate(
        ['branch_id' => $branch->id, 'printer_name' => "Barcode Label Printer ({$codePrefix})"],
        [
            'printer_type' => 'LABEL_BARCODE',
            'connection_type' => 'USB',
            'port' => 9100,
            'paper_width_mm' => 50,
            'is_default' => false,
            'auto_cut' => false,
            'cash_drawer_kick' => false,
            'status' => 'ONLINE',
        ]
    );

    // 3. Number Sequences
    $seqs = [
        'INVOICE' => "INV-{$codePrefix}-",
        'RECEIPT' => "POS-{$codePrefix}-",
        'ORDER' => "ORD-{$codePrefix}-",
        'PURCHASE' => "PO-{$codePrefix}-",
        'RETURN' => "RET-{$codePrefix}-",
    ];
    foreach ($seqs as $type => $pfx) {
        BranchNumberSequence::updateOrCreate(
            ['branch_id' => $branch->id, 'document_type' => $type],
            [
                'prefix' => $pfx,
                'starting_number' => 1,
                'current_number' => 1,
                'zero_padding' => 6,
                'date_format_token' => 'YYYY',
                'preview_sample' => "{$pfx}" . date('Y') . "-000001",
            ]
        );
    }

    // 4. Business Hours
    foreach ($daysOfWeek as $dayNum => $dayName) {
        BranchBusinessHour::updateOrCreate(
            ['branch_id' => $branch->id, 'day_of_week' => $dayNum],
            [
                'day_name' => $dayName,
                'is_open' => $branch->branch_type === 'HEAD_OFFICE' ? ($dayNum > 0 && $dayNum < 6) : true,
                'open_time' => $branch->branch_type === 'HEAD_OFFICE' ? '08:00' : '07:30',
                'close_time' => $branch->branch_type === 'HEAD_OFFICE' ? '17:30' : '22:00',
            ]
        );
    }

    // 5. Branch Settings Overrides (e.g. custom footer per branch)
    BranchSetting::updateOrCreate(
        ['branch_id' => $branch->id, 'key' => 'receipt_footer_note'],
        [
            'value' => "Thank you for shopping at {$branch->name}! សូមអរគុណ!",
            'value_type' => 'string',
        ]
    );

    echo "Seeded Branch: {$branch->name} ({$branch->code})\n";
}

// 6. Warehouses for branches if missing
$whPP = Warehouse::firstOrCreate(
    ['code' => 'WH-PP-01'],
    [
        'branch_id' => 2,
        'name' => 'Phnom Penh Flagship Storehouse',
        'type' => 'RETAIL',
        'address' => 'Sothearos Blvd, Phnom Penh',
        'status_id' => 1,
    ]
);

$whSR = Warehouse::firstOrCreate(
    ['code' => 'WH-SR-02'],
    [
        'branch_id' => 3,
        'name' => 'Siem Reap Store Warehouse',
        'type' => 'RETAIL',
        'address' => 'Sivutha Blvd, Siem Reap',
        'status_id' => 1,
    ]
);

$whBT = Warehouse::firstOrCreate(
    ['code' => 'WH-BT-03'],
    [
        'branch_id' => 4,
        'name' => 'Battambang Depot',
        'type' => 'RETAIL',
        'address' => 'Street 1, Battambang',
        'status_id' => 1,
    ]
);

// 7. National Holidays
$holidays = [
    ['name' => 'International New Year Day', 'date' => '2026-01-01', 'note' => 'National Holiday'],
    ['name' => 'Victory Over Genocide Day', 'date' => '2026-01-07', 'note' => 'Commemoration'],
    ['name' => 'Khmer New Year (Day 1)', 'date' => '2026-04-14', 'note' => 'Maha Songkran'],
    ['name' => 'Khmer New Year (Day 2)', 'date' => '2026-04-15', 'note' => 'Virak Vanabat'],
    ['name' => 'Khmer New Year (Day 3)', 'date' => '2026-04-16', 'note' => 'Vearak Loeng Sak'],
    ['name' => 'Visak Bochea Day', 'date' => '2026-05-01', 'note' => 'Buddhist Celebration'],
    ['name' => 'King Norodom Sihamoni Birthday', 'date' => '2026-05-14', 'note' => 'Royal Holiday'],
    ['name' => 'Pchum Ben Festival (Day 1)', 'date' => '2026-10-09', 'note' => 'Ancestors Day'],
    ['name' => 'Pchum Ben Festival (Day 2)', 'date' => '2026-10-10', 'note' => 'Ancestors Day'],
    ['name' => 'Pchum Ben Festival (Day 3)', 'date' => '2026-10-11', 'note' => 'Ancestors Day'],
    ['name' => 'Water and Moon Festival', 'date' => '2026-11-23', 'note' => 'Bon Om Touk'],
    ['name' => 'National Independence Day', 'date' => '2026-11-09', 'note' => '73rd Independence Anniversary'],
];

foreach ($holidays as $h) {
    BranchHoliday::updateOrCreate(
        ['name' => $h['name'], 'holiday_date' => $h['date']],
        [
            'is_closed' => false, // Retail stores remain open with holiday shifts
            'note' => $h['note'],
        ]
    );
}
echo "Seeded " . count($holidays) . " National Holidays.\n";

// 8. Branch Users assignment
$adminUser = User::where('username', 'admin')->first();
$cashierUser = User::where('username', 'sokha_cashier')->first();
$supervisorUser = User::where('username', 'bopha_supervisor')->first();

if ($adminUser) {
    // Admin has access to all branches
    foreach (Branch::all() as $b) {
        BranchUser::updateOrCreate(
            ['branch_id' => $b->id, 'user_id' => $adminUser->id],
            [
                'assigned_role' => 'ADMIN',
                'permissions' => ['branch.view', 'branch.manage', 'branch.manage_pos', 'branch.manage_warehouse', 'branch.view_reports', 'branch.assign_users'],
                'is_active' => true,
            ]
        );
    }
}

if ($supervisorUser) {
    BranchUser::updateOrCreate(
        ['branch_id' => 2, 'user_id' => $supervisorUser->id],
        [
            'assigned_role' => 'BRANCH_MANAGER',
            'permissions' => ['branch.view', 'branch.manage_pos', 'branch.manage_warehouse', 'branch.view_reports'],
            'is_active' => true,
        ]
    );
}

if ($cashierUser) {
    BranchUser::updateOrCreate(
        ['branch_id' => 2, 'user_id' => $cashierUser->id],
        [
            'assigned_role' => 'CASHIER',
            'permissions' => ['branch.view', 'branch.manage_pos'],
            'is_active' => true,
        ]
    );
}

// 9. Initial Audit Trail
$seedAudits = [
    ['key' => 'system_name', 'old' => null, 'new' => 'SmartPOS & Business Management System'],
    ['key' => 'exchange_rate', 'old' => '4100', 'new' => '4150'],
    ['key' => 'default_vat_rate', 'old' => '10', 'new' => '10.00'],
    ['key' => 'bakong_merchant_id', 'old' => null, 'new' => 'bakong_pos_hq01@nbc'],
    ['key' => 'branches_initialized', 'old' => '1', 'new' => '4'],
];

foreach ($seedAudits as $sa) {
    SystemAuditLog::create([
        'user_id' => 1,
        'username' => 'admin',
        'branch_id' => 1,
        'module' => 'SETTINGS',
        'setting_key' => $sa['key'],
        'old_value' => $sa['old'],
        'new_value' => $sa['new'],
        'ip_address' => '127.0.0.1',
        'user_agent' => 'System Initializer / Seeder',
    ]);
}

echo "Seeded Audit Trail records.\n";
echo "Settings & Branch Seeding Completed Successfully!\n";
