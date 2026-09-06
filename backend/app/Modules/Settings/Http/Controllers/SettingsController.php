<?php

namespace App\Modules\Settings\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    protected static array $defaultSettings = [
        'store_name' => 'SmartPOS Flagship Store',
        'store_logo_url' => '',
        'logo_shape' => 'rounded',
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
        'security_pin_length' => 4,
        'master_security_pin' => '1234',
    ];

    protected function getSettingsFile(): string
    {
        return storage_path('app/settings.json');
    }

    protected function loadSettings(): array
    {
        $file = $this->getSettingsFile();
        if (file_exists($file)) {
            $content = file_get_contents($file);
            $decoded = json_decode($content, true);
            if (is_array($decoded)) {
                return array_merge(self::$defaultSettings, $decoded);
            }
        }
        return self::$defaultSettings;
    }

    protected function saveSettings(array $settings): void
    {
        $file = $this->getSettingsFile();
        $dir = dirname($file);
        if (!file_exists($dir)) {
            mkdir($dir, 0755, true);
        }
        file_put_contents($file, json_encode($settings, JSON_PRETTY_PRINT));
    }

    public function getSettings(): JsonResponse
    {
        $settings = $this->loadSettings();

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_name' => 'nullable|string',
            'store_logo_url' => 'nullable|string',
            'logo_shape' => 'nullable|string',
            'branch_code' => 'nullable|string',
            'address' => 'nullable|string',
            'tax_identification_number' => 'nullable|string',
            'phone_number' => 'nullable|string',
            'email' => 'nullable|email',
            'exchange_rate' => 'nullable|numeric',
            'default_vat_rate' => 'nullable|numeric',
            'bakong_merchant_id' => 'nullable|string',
            'receipt_footer_note' => 'nullable|string',
            'security_pin_length' => 'nullable|integer|in:4,6,8',
            'master_security_pin' => 'nullable|string',
        ]);

        $current = $this->loadSettings();

        foreach ($validated as $k => $v) {
            if ($v !== null) {
                $current[$k] = $v;
            }
        }

        $this->saveSettings($current);

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
            'data' => $current,
        ]);
    }

    /**
     * Upload store logo/branding photo from local machine
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp,svg|max:5120',
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . \Illuminate\Support\Str::random(10) . '.' . $file->getClientOriginalExtension();
            
            $destinationPath = public_path('storage/store');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            $file->move($destinationPath, $filename);
            
            $relativeUrl = '/storage/store/' . $filename;
            $fullUrl = url($relativeUrl);

            $current = $this->loadSettings();
            $current['store_logo_url'] = $fullUrl;
            $this->saveSettings($current);

            return response()->json([
                'success' => true,
                'message' => 'Store logo uploaded successfully',
                'image_url' => $fullUrl,
                'store_logo_url' => $fullUrl,
                'relative_url' => $relativeUrl,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No image file provided',
        ], 400);
    }
}
