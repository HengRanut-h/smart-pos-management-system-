<?php

namespace App\Modules\Settings\Application\Services;

use App\Modules\Settings\Persistence\Models\Company;
use App\Modules\Settings\Persistence\Models\SystemSetting;
use App\Modules\Settings\Persistence\Models\SystemAuditLog;
use App\Modules\Settings\Persistence\Models\SystemNotificationSetting;
use App\Modules\User\Persistence\Models\User;

class SystemSettingsService
{
    protected static array $defaultKeys = [
        // General System
        'system_name' => 'SmartPOS & Business Management System',
        'system_code' => 'SMARTPOS-PRO',
        'company_name' => 'SmartPOS Global Retail Co., Ltd.',
        'company_legal_name' => 'SmartPOS Cambodia International Plc.',
        'company_tax_id' => 'K002-902100481',
        'company_email' => 'contact@smartpos.com.kh',
        'company_phone' => '+855 23 888 999',
        'company_website' => 'https://smartpos.com.kh',
        'company_address' => 'Monivong Blvd, Sangkat Boeung Keng Kang 1, Khan Boeng Keng Kang, Phnom Penh',
        'company_city' => 'Phnom Penh',
        'company_country' => 'Cambodia',
        'company_logo_url' => 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&auto=format&fit=crop&q=80',
        'company_favicon_url' => '',
        
        // Localization
        'default_language' => 'en',
        'available_languages' => '["en","kh"]',
        'default_currency' => 'USD',
        'currency_symbol' => '$',
        'currency_position' => 'BEFORE', // BEFORE, AFTER
        'secondary_currency' => 'KHR',
        'secondary_currency_symbol' => '៛',
        'exchange_rate' => '4150',
        'decimal_places' => '2',
        'date_format' => 'YYYY-MM-DD',
        'time_format' => '24H',
        'timezone' => 'Asia/Phnom_Penh',
        'week_start_day' => 'MONDAY',
        'fiscal_year_start' => '01-01',

        // Tax & Financial
        'default_tax_rate' => '10',
        'vat_enabled' => 'true',
        'tax_identification_number' => 'K002-902100481',
        'default_payment_method' => 'CASH',
        'bakong_merchant_id' => 'bakong_pos_hq01@nbc',
        'bakong_account_name' => 'SMARTPOS HQ STORE CO., LTD',
        'cash_drawer_starting_float' => '100.00',

        // POS & Printing
        'receipt_printer_type' => '80mm',
        'auto_print_receipt' => 'true',
        'receipt_copies' => '1',
        'show_tax_on_receipt' => 'true',
        'show_discount_on_receipt' => 'true',
        'show_qr_on_receipt' => 'true',
        'receipt_header_note' => 'SmartPOS Flagship Store - Official Receipt',
        'receipt_footer_note' => 'Thank you for shopping at SmartPOS! សូមអរគុណ!',

        // Inventory
        'default_unit' => 'Pcs',
        'stock_valuation_method' => 'FIFO', // FIFO, AVCO, LIFO
        'default_low_stock_threshold' => '10',
        'allow_negative_stock' => 'false',
        'enable_batch_tracking' => 'true',
        'enable_expiry_tracking' => 'true',
        'enable_serial_tracking' => 'false',
        'barcode_format' => 'EAN13',

        // Security
        'session_timeout_minutes' => '60',
        'max_login_attempts' => '5',
        'account_lock_duration_minutes' => '15',
        'password_expiration_days' => '90',
        'require_two_factor' => 'false',
        'otp_expiration_minutes' => '5',
        'device_tracking_enabled' => 'true',
        'security_pin_length' => '4',
        'master_security_pin' => '1234',

        // Notification Policy Architecture
        'notification_toast_config' => '{"success":{"auto_close":true,"duration":4000,"progress_bar":true},"information":{"auto_close":true,"duration":5000,"progress_bar":true},"warning":{"auto_close":true,"duration":7000,"progress_bar":true},"error":{"auto_close":true,"duration":8000,"progress_bar":true},"critical":{"auto_close":false,"duration":null,"progress_bar":false}}',

        // Defaults
        'default_warehouse_id' => '1',
        'default_branch_id' => '1',
    ];

    public function getCompany(): Company
    {
        $company = Company::first();
        if (!$company) {
            $company = Company::create([
                'name' => 'SmartPOS Global Retail Co., Ltd.',
                'code' => 'SMARTPOS-HQ',
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
            ]);
        }
        return $company;
    }

    public function updateCompany(array $data, ?int $userId = null, ?string $ip = null, ?string $agent = null): Company
    {
        $company = $this->getCompany();
        $oldData = $company->toArray();
        $company->update($data);

        // Audit changes
        foreach ($data as $k => $v) {
            $oldVal = $oldData[$k] ?? null;
            if ($oldVal != $v) {
                $this->logAudit($userId, null, null, 'COMPANY', $k, (string)$oldVal, (string)$v, $ip, $agent);
            }
        }

        return $company;
    }

    public function getGlobalSettings(): array
    {
        $dbSettings = SystemSetting::all()->pluck('value', 'key')->toArray();
        
        // Check settings.json for backward compatibility
        $fileSettings = [];
        $file = storage_path('app/settings.json');
        if (file_exists($file)) {
            $decoded = json_decode(file_get_contents($file), true);
            if (is_array($decoded)) {
                $fileSettings = $decoded;
            }
        }

        return array_merge(self::$defaultKeys, $fileSettings, $dbSettings);
    }

    public function updateGlobalSettings(array $data, ?int $userId = null, ?string $ip = null, ?string $agent = null): array
    {
        $current = $this->getGlobalSettings();

        foreach ($data as $k => $v) {
            $oldVal = $current[$k] ?? null;
            $newValStr = is_bool($v) ? ($v ? 'true' : 'false') : (is_array($v) ? json_encode($v) : (string)$v);

            SystemSetting::updateOrCreate(
                ['key' => $k],
                [
                    'value' => $newValStr,
                    'category' => $this->inferCategory($k),
                    'value_type' => is_bool($v) ? 'boolean' : (is_numeric($v) ? 'float' : 'string'),
                ]
            );

            if ($oldVal !== $newValStr) {
                $this->logAudit($userId, null, null, 'SYSTEM', $k, (string)$oldVal, (string)$newValStr, $ip, $agent);
            }

            $current[$k] = $newValStr;
        }

        // Keep storage/app/settings.json in sync for backward compatibility
        $this->syncSettingsJson($current);

        return $current;
    }

    protected function inferCategory(string $key): string
    {
        if (str_contains($key, 'currency') || str_contains($key, 'tax') || str_contains($key, 'rate') || str_contains($key, 'bakong') || str_contains($key, 'vat')) {
            return 'financial';
        }
        if (str_contains($key, 'lang') || str_contains($key, 'date') || str_contains($key, 'time') || str_contains($key, 'zone')) {
            return 'localization';
        }
        if (str_contains($key, 'stock') || str_contains($key, 'inventory') || str_contains($key, 'barcode') || str_contains($key, 'unit')) {
            return 'inventory';
        }
        if (str_contains($key, 'receipt') || str_contains($key, 'printer') || str_contains($key, 'pos')) {
            return 'pos';
        }
        if (str_contains($key, 'security') || str_contains($key, 'pin') || str_contains($key, 'login') || str_contains($key, 'password') || str_contains($key, 'lock')) {
            return 'security';
        }
        return 'general';
    }

    protected function syncSettingsJson(array $settings): void
    {
        $file = storage_path('app/settings.json');
        $dir = dirname($file);
        if (!file_exists($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents($file, json_encode($settings, JSON_PRETTY_PRINT));
    }

    public function getAuditLogs(int $limit = 100): array
    {
        return SystemAuditLog::with(['user', 'branch'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    public function logAudit(?int $userId, ?string $username, ?int $branchId, string $module, string $key, ?string $oldVal, ?string $newVal, ?string $ip, ?string $agent): void
    {
        if (!$username && $userId) {
            $u = User::find($userId);
            $username = $u ? $u->username : null;
        }

        SystemAuditLog::create([
            'user_id' => $userId,
            'username' => $username ?? 'Administrator',
            'branch_id' => $branchId,
            'module' => $module,
            'setting_key' => $key,
            'old_value' => $oldVal,
            'new_value' => $newVal,
            'ip_address' => $ip ?? request()->ip(),
            'user_agent' => $agent ?? substr((string)request()->userAgent(), 0, 250),
        ]);
    }

    public function getNotificationSettings(?int $branchId = null): array
    {
        $events = [
            'NEW_ORDER' => 'New Customer Order Placed',
            'PAYMENT_RECEIVED' => 'Payment & Invoice Settled',
            'LOW_STOCK' => 'Item Reached Low Stock Warning Threshold',
            'OUT_OF_STOCK' => 'Critical Item Out of Stock',
            'FAILED_LOGIN' => 'Consecutive Failed Login Attempts Detected',
            'SUSPICIOUS_LOGIN' => 'Suspicious Login from Unknown Device/IP',
            'BACKUP_COMPLETED' => 'Database Backup Created Successfully',
            'BACKUP_FAILED' => 'Scheduled Backup Process Failed',
            'SYSTEM_ERROR' => 'System Critical Exceptions Logged',
            'NEW_EMPLOYEE' => 'New Staff/Cashier Registered',
            'BRANCH_CREATED' => 'New Branch Location Initialized',
        ];

        $channels = ['EMAIL', 'TELEGRAM', 'SMS', 'PUSH', 'IN_APP'];

        $existing = SystemNotificationSetting::where('branch_id', $branchId)->get();

        $matrix = [];
        foreach ($events as $eventCode => $eventName) {
            $row = [
                'event_code' => $eventCode,
                'event_name' => $eventName,
                'channels' => [],
            ];
            foreach ($channels as $channel) {
                $setting = $existing->first(fn($s) => $s->event_name === $eventCode && $s->channel === $channel);
                $row['channels'][$channel] = $setting ? (bool)$setting->is_enabled : in_array($channel, ['EMAIL', 'TELEGRAM', 'IN_APP']);
            }
            $matrix[] = $row;
        }

        return $matrix;
    }

    public function saveNotificationMatrix(array $matrix, ?int $branchId = null): void
    {
        foreach ($matrix as $item) {
            $eventCode = $item['event_code'];
            foreach ($item['channels'] as $channel => $enabled) {
                SystemNotificationSetting::updateOrCreate(
                    [
                        'branch_id' => $branchId,
                        'event_name' => $eventCode,
                        'channel' => $channel,
                    ],
                    [
                        'is_enabled' => (bool)$enabled,
                    ]
                );
            }
        }
    }
}
