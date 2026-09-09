<?php

namespace App\Modules\StaffBadge\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Modules\StaffBadge\Persistence\Models\StaffBadgeTemplate;
use App\Modules\StaffBadge\Persistence\Models\StaffBadgeTemplateVersion;
use App\Modules\StaffBadge\Persistence\Models\StaffBadge;
use App\Modules\Employee\Persistence\Models\Employee;

class StaffBadgeSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Template: Executive Navy Portrait (CR80 Vertical)
        $t1 = StaffBadgeTemplate::updateOrCreate(
            ['code' => 'TMPL_EXEC_VERTICAL'],
            [
                'name' => 'Corporate Executive & Manager Badge',
                'badge_type' => 'MANAGER',
                'orientation' => 'VERTICAL',
                'card_size' => 'CR80_PVC',
                'width_mm' => 53.98,
                'height_mm' => 85.60,
                'is_default' => true,
                'is_active' => true,
                'front_design' => [
                    'theme_color' => '#1e3a8a',
                    'accent_color' => '#f59e0b',
                    'background_gradient' => 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
                    'header_text' => 'SMARTPOS ENTERPRISE',
                    'header_text_kh' => 'សហគ្រាស ស្មាតភីអូអេស',
                    'photo_shape' => 'circle', // circle, rounded, square
                    'photo_border_color' => '#f59e0b',
                    'photo_border_width' => 3,
                    'show_logo' => true,
                    'show_qr_code' => true,
                    'qr_size_px' => 90,
                    'show_barcode' => false,
                    'show_nfc_badge' => true,
                    'font_family' => 'Battambang, sans-serif',
                    'security_watermark' => 'OFFICIAL IDENTITY • SECURITY VERIFIED',
                    'show_security_watermark' => true,
                ],
                'back_design' => [
                    'background_color' => '#f8fafc',
                    'text_color' => '#1e293b',
                    'instructions' => "This card is the property of SmartPOS Solutions Co., Ltd.
If found, please return to any SmartPOS branch or call +855 23 999 888.
Unauthorized use or duplication is strictly prohibited.",
                    'instructions_kh' => "ប័ណ្ណសម្គាល់ខ្លួននេះជាកម្មសិទ្ធិរបស់ក្រុមហ៊ុន ស្មាតភីអូអេស។ បើបានរើសបាន សូមប្រគល់ជូនសាខាជិតបំផុត ឬទាក់ទងទូរស័ព្ទ +855 23 999 888។",
                    'show_emergency_contact' => true,
                    'emergency_phone' => '+855 12 999 111',
                    'show_barcode' => true,
                    'barcode_type' => 'CODE_128',
                    'show_signature_strip' => true,
                ],
            ]
        );

        // Version record for T1
        StaffBadgeTemplateVersion::firstOrCreate(
            ['template_id' => $t1->id, 'version_number' => 1],
            [
                'change_summary' => 'Initial Executive Navy Portrait standard release',
                'front_design' => $t1->front_design,
                'back_design' => $t1->back_design,
                'created_by' => 1,
            ]
        );

        // 2. Template: Retail Store Cashier Horizontal (CR80 Landscape)
        $t2 = StaffBadgeTemplate::updateOrCreate(
            ['code' => 'TMPL_CASHIER_HORIZONTAL'],
            [
                'name' => 'Retail Store Cashier & POS Badge',
                'badge_type' => 'CASHIER',
                'orientation' => 'HORIZONTAL',
                'card_size' => 'CR80_PVC',
                'width_mm' => 85.60,
                'height_mm' => 53.98,
                'is_default' => false,
                'is_active' => true,
                'front_design' => [
                    'theme_color' => '#059669',
                    'accent_color' => '#10b981',
                    'background_gradient' => 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                    'header_text' => 'RETAIL POS CASHIER',
                    'header_text_kh' => 'បេឡាករហាងទំនិញ',
                    'photo_shape' => 'rounded',
                    'photo_border_color' => '#ffffff',
                    'photo_border_width' => 2,
                    'show_logo' => true,
                    'show_qr_code' => true,
                    'qr_size_px' => 80,
                    'show_barcode' => true,
                    'show_nfc_badge' => true,
                    'font_family' => 'Battambang, sans-serif',
                    'security_watermark' => 'AUTHORIZED CASHIER ACCESS',
                    'show_security_watermark' => true,
                ],
                'back_design' => [
                    'background_color' => '#ffffff',
                    'text_color' => '#0f172a',
                    'instructions' => 'Scan at cashier register to unlock POS checkout terminal and punch attendance.',
                    'instructions_kh' => 'ស្កេននៅម៉ាស៊ីនគិតប្រាក់ដើម្បីចូលប្រើប្រាស់ និងកត់ត្រាវត្តមាន។',
                    'show_emergency_contact' => true,
                    'emergency_phone' => '+855 23 888 777',
                    'show_barcode' => true,
                    'barcode_type' => 'CODE_128',
                    'show_signature_strip' => true,
                ],
            ]
        );

        // 3. Template: Warehouse Logistics Lanyard Card
        $t3 = StaffBadgeTemplate::updateOrCreate(
            ['code' => 'TMPL_WAREHOUSE_LANYARD'],
            [
                'name' => 'Warehouse & Supply Chain Lanyard Badge',
                'badge_type' => 'WAREHOUSE',
                'orientation' => 'VERTICAL',
                'card_size' => 'LANYARD_CARD',
                'width_mm' => 70.00,
                'height_mm' => 100.00,
                'is_default' => false,
                'is_active' => true,
                'front_design' => [
                    'theme_color' => '#d97706',
                    'accent_color' => '#1e293b',
                    'background_gradient' => 'linear-gradient(180deg, #b45309 0%, #1e293b 100%)',
                    'header_text' => 'LOGISTICS & DEPOT',
                    'header_text_kh' => 'ឃ្លាំងទំនិញ & ភស្តុភារ',
                    'photo_shape' => 'square',
                    'photo_border_color' => '#f59e0b',
                    'photo_border_width' => 3,
                    'show_logo' => true,
                    'show_qr_code' => true,
                    'qr_size_px' => 95,
                    'show_barcode' => true,
                    'show_nfc_badge' => true,
                    'font_family' => 'Inter, sans-serif',
                    'security_watermark' => 'WAREHOUSE DISPATCH ACCREDITED',
                    'show_security_watermark' => true,
                ],
                'back_design' => [
                    'background_color' => '#fffbeb',
                    'text_color' => '#451a03',
                    'instructions' => 'Mandatory PPE area. Card must be visibly displayed on safety lanyard at all times.',
                    'instructions_kh' => 'តំបន់តម្រូវឱ្យពាក់ឧបករណ៍សុវត្ថិភាព។ ត្រូវពាក់ប័ណ្ណនេះជាប់ជានិច្ច។',
                    'show_emergency_contact' => true,
                    'emergency_phone' => '+855 12 777 666',
                    'show_barcode' => true,
                    'barcode_type' => 'CODE_128',
                    'show_signature_strip' => false,
                ],
            ]
        );

        // 4. Template: Contractor & Temporary Visitor Badge
        $t4 = StaffBadgeTemplate::updateOrCreate(
            ['code' => 'TMPL_VISITOR_BADGE'],
            [
                'name' => 'Temporary Contractor & Visitor Badge',
                'badge_type' => 'VISITOR',
                'orientation' => 'HORIZONTAL',
                'card_size' => 'CR80_PVC',
                'width_mm' => 85.60,
                'height_mm' => 53.98,
                'is_default' => false,
                'is_active' => true,
                'front_design' => [
                    'theme_color' => '#475569',
                    'accent_color' => '#dc2626',
                    'background_gradient' => 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
                    'header_text' => 'VISITOR / CONTRACTOR',
                    'header_text_kh' => 'ភ្ញៀវ / អ្នកម៉ៅការបណ្តោះអាសន្ន',
                    'photo_shape' => 'rounded',
                    'photo_border_color' => '#ef4444',
                    'photo_border_width' => 2,
                    'show_logo' => true,
                    'show_qr_code' => true,
                    'qr_size_px' => 80,
                    'show_barcode' => true,
                    'show_nfc_badge' => false,
                    'font_family' => 'Inter, sans-serif',
                    'security_watermark' => 'TEMPORARY ESCORT REQUIRED',
                    'show_security_watermark' => true,
                ],
                'back_design' => [
                    'background_color' => '#ffffff',
                    'text_color' => '#334155',
                    'instructions' => 'Visitor must be accompanied by authorized personnel. Return badge to reception upon departure.',
                    'instructions_kh' => 'ភ្ញៀវត្រូវតែមានបុគ្គលិកអមដំណើរ។ សូមប្រគល់ប័ណ្ណវិញនៅតុទទួលភ្ញៀវពេលចាកចេញ។',
                    'show_emergency_contact' => true,
                    'emergency_phone' => '+855 23 999 888',
                    'show_barcode' => true,
                    'barcode_type' => 'CODE_128',
                    'show_signature_strip' => false,
                ],
            ]
        );

        // 5. Seed Badges for Existing Employees
        $employees = Employee::with('branch')->take(10)->get();
        $templates = [$t1, $t2, $t3, $t1, $t2];

        foreach ($employees as $idx => $emp) {
            $tmpl = $templates[$idx % count($templates)];
            $badgeSeq = str_pad($idx + 1, 4, '0', STR_PAD_LEFT);
            $badgeNum = 'BDG-2026-' . $badgeSeq;
            $cardNum = 'CRD-' . strtoupper(Str::random(6)) . ($idx + 1);
            $qrToken = 'STF-TK-' . md5("EMP_{$emp->id}_{$badgeNum}_SMARTPOS");
            $nfcUid = sprintf('04:%02X:%02X:%02X:%02X:%02X:%02X', ($idx * 7) % 255, ($idx * 13) % 255, ($idx * 29) % 255, ($idx * 43) % 255, ($idx * 67) % 255, ($idx * 97) % 255);

            $badgeType = 'STAFF';
            if (stripos($emp->position ?? '', 'manager') !== false || stripos($emp->first_name ?? '', 'admin') !== false) {
                $badgeType = 'MANAGER';
            } elseif (stripos($emp->position ?? '', 'cashier') !== false) {
                $badgeType = 'CASHIER';
            }

            StaffBadge::updateOrCreate(
                ['employee_id' => $emp->id],
                [
                    'template_id' => $tmpl->id,
                    'badge_number' => $badgeNum,
                    'card_number' => $cardNum,
                    'qr_token' => $qrToken,
                    'barcode_value' => $emp->employee_code ?? ('EMP' . str_pad($emp->id, 5, '0', STR_PAD_LEFT)),
                    'nfc_uid' => $nfcUid,
                    'status' => $idx === 4 ? 'BLOCKED' : ($idx === 5 ? 'LOST' : 'ACTIVE'),
                    'badge_type' => $badgeType,
                    'issued_at' => now()->subMonths(3),
                    'activated_at' => now()->subMonths(3),
                    'expires_at' => now()->addMonths(21),
                    'custom_fields' => [
                        'blood_type' => 'O+',
                        'emergency_contact_name' => 'Sokha Ly',
                        'emergency_contact_phone' => '+855 12 334 455',
                    ],
                    'created_by' => 1,
                ]
            );
        }
    }
}
