<?php

namespace App\Modules\Barcode\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Modules\Product\Persistence\Models\Product;

class BarcodeController extends Controller
{
    /**
     * Resolve scanned barcode or QR string to corresponding entity.
     * POST /api/v1/barcode/resolve
     */
    public function resolve(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:128',
            'branch_id' => 'nullable|integer',
        ]);

        $code = trim($validated['code']);

        // 1. Search in Product barcode or SKU
        $product = Product::where('barcode', $code)
            ->orWhere('sku', $code)
            ->first();

        if ($product) {
            return response()->json([
                'success' => true,
                'type' => 'product',
                'matched' => true,
                'entity' => [
                    'id' => $product->id,
                    'sku' => $product->sku,
                    'barcode' => $product->barcode,
                    'name' => $product->name,
                    'selling_price' => (float) $product->selling_price,
                    'cost_price' => (float) $product->cost_price,
                    'category' => $product->category ? $product->category->name : 'General',
                    'available_quantity' => (int) $product->available_quantity,
                    'unit' => $product->unit ? $product->unit->name : 'unit',
                ],
                'message' => 'Product identified successfully.',
            ]);
        }

        // 2. Search in Cheatsheet / Common Service barcodes
        $cheatsheet = [
            '2900001000105' => ['name' => 'Plastic Carrier Bag', 'price' => 0.10, 'category' => 'Packaging'],
            '2900001000204' => ['name' => 'Premium Eco Shopping Bag', 'price' => 1.00, 'category' => 'Packaging'],
            '2900001000303' => ['name' => 'City Express Delivery Fee', 'price' => 2.00, 'category' => 'Services'],
            '2900001000402' => ['name' => 'Party Ice Bag 5kg', 'price' => 0.75, 'category' => 'Consumables'],
            '2900001000501' => ['name' => 'Luxury Gift Box & Wrap', 'price' => 1.50, 'category' => 'Services'],
            '2900001000600' => ['name' => '$0.50 Instant Cash Voucher', 'price' => -0.50, 'category' => 'Promotions'],
        ];

        if (isset($cheatsheet[$code])) {
            $item = $cheatsheet[$code];
            return response()->json([
                'success' => true,
                'type' => 'service_fee',
                'matched' => true,
                'entity' => [
                    'id' => 9000 + abs(crc32($code) % 1000),
                    'sku' => $code,
                    'barcode' => $code,
                    'name' => $item['name'],
                    'selling_price' => $item['price'],
                    'cost_price' => 0.0,
                    'category' => $item['category'],
                    'available_quantity' => 999,
                    'unit' => 'service',
                ],
                'message' => 'Service or fee barcode recognized.',
            ]);
        }

        // 3. Unregistered barcode
        return response()->json([
            'success' => false,
            'type' => 'unknown',
            'matched' => false,
            'code' => $code,
            'message' => 'No product or record registered with this barcode.',
        ], 404);
    }

    /**
     * Generate unique valid barcode (EAN-13 with Modulo-10 check digit or Code-128).
     * POST /api/v1/barcode/generate
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'format' => 'nullable|string|in:EAN_13,CODE_128,INTERNAL',
            'prefix' => 'nullable|string|max:4',
        ]);

        $format = $validated['format'] ?? 'EAN_13';

        if ($format === 'EAN_13' || $format === 'INTERNAL') {
            // EAN-13 Internal retail range (prefix 200 to 299 or custom prefix)
            $prefix = $validated['prefix'] ?? '200';
            do {
                $middle = str_pad(mt_rand(10000000, 99999999), 9, '0', STR_PAD_LEFT);
                $twelveDigits = substr($prefix . $middle, 0, 12);
                $checkDigit = $this->calculateEan13CheckDigit($twelveDigits);
                $barcode = $twelveDigits . $checkDigit;
                $exists = Product::where('barcode', $barcode)->exists();
            } while ($exists);

            return response()->json([
                'success' => true,
                'format' => 'EAN_13',
                'barcode' => $barcode,
                'check_digit' => $checkDigit,
                'message' => 'Unique EAN-13 generated with valid Modulo-10 checksum.',
            ]);
        }

        // CODE_128
        do {
            $barcode = 'PRD-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8));
            $exists = Product::where('barcode', $barcode)->orWhere('sku', $barcode)->exists();
        } while ($exists);

        return response()->json([
            'success' => true,
            'format' => 'CODE_128',
            'barcode' => $barcode,
            'message' => 'Unique Code-128 generated.',
        ]);
    }

    /**
     * Assign a barcode to a product.
     * POST /api/v1/barcode/assign
     */
    public function assign(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'barcode' => 'required|string|max:128',
        ]);

        $barcode = trim($validated['barcode']);

        // Check if barcode is used by another product
        $conflict = Product::where('barcode', $barcode)
            ->where('id', '!=', $validated['product_id'])
            ->first();

        if ($conflict) {
            return response()->json([
                'success' => false,
                'message' => "Barcode '{$barcode}' is already assigned to '{$conflict->name}' (SKU: {$conflict->sku}).",
            ], 422);
        }

        $product = Product::findOrFail($validated['product_id']);
        $product->barcode = $barcode;
        $product->save();

        return response()->json([
            'success' => true,
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'barcode' => $product->barcode,
            ],
            'message' => "Barcode '{$barcode}' assigned to {$product->name}.",
        ]);
    }

    /**
     * Helper: Calculate EAN-13 Modulo-10 checksum digit.
     */
    private function calculateEan13CheckDigit(string $twelveDigits): int
    {
        $sum = 0;
        for ($i = 0; $i < 12; $i++) {
            $digit = (int) $twelveDigits[$i];
            // Odd positions (1-indexed) weight 1, even positions weight 3
            $weight = ($i % 2 === 0) ? 1 : 3;
            $sum += $digit * $weight;
        }
        $remainder = $sum % 10;
        return ($remainder === 0) ? 0 : (10 - $remainder);
    }
}
