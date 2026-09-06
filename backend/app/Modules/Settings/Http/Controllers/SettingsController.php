<?php

namespace App\Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    protected static array $settings = [
        'store_name' => 'SmartPOS Flagship Store',
        'branch_code' => 'HQ-01',
        'address' => 'Monivong Blvd, Sangkat Boeung Keng Kang 1, Phnom Penh, Cambodia',
        'tax_identification_number' => 'K002-902100481',
        'phone_number' => '+855 23 888 999',
        'email' => 'support@smartpos.com.kh',
        'currency_code' => 'USD',
        'secondary_currency_code' => 'KHR',
        'exchange_rate' => 4100.0,
        'default_vat_rate' => 10.0,
        'vat_enabled' => true,
        'bakong_merchant_id' => 'bakong_pos_hq01@nbc',
        'bakong_account_name' => 'SMARTPOS HQ STORE CO., LTD',
        'receipt_printer_type' => '80mm',
        'auto_print_receipt' => true,
        'receipt_footer_note' => 'Thank you for shopping at SmartPOS! សូមអរគុណ!',
    ];

    public function getSettings(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => self::$settings,
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_name' => 'nullable|string',
            'branch_code' => 'nullable|string',
            'address' => 'nullable|string',
            'tax_identification_number' => 'nullable|string',
            'phone_number' => 'nullable|string',
            'exchange_rate' => 'nullable|numeric',
            'default_vat_rate' => 'nullable|numeric',
            'bakong_merchant_id' => 'nullable|string',
            'receipt_footer_note' => 'nullable|string',
        ]);

        foreach ($validated as $k => $v) {
            if ($v !== null) {
                self::$settings[$k] = $v;
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
            'data' => self::$settings,
        ]);
    }
}
