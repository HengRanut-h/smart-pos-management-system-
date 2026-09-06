<?php

namespace App\Modules\Invoice\Infrastructure\Repositories;

use App\Modules\Invoice\Domain\Contracts\InvoiceRepositoryInterface;
use App\Modules\Invoice\Persistence\Models\Invoice;
use App\Modules\Invoice\Persistence\Models\InvoiceItem;
use App\Modules\Sales\Persistence\Models\Sale;
use App\Modules\Settings\Persistence\Models\SysStatus;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class EloquentInvoiceRepository implements InvoiceRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return Invoice::with(['sale', 'customer', 'branch', 'items.product'])->latest()->paginate($perPage);
    }

    public function findById(int $id): ?Invoice
    {
        return Invoice::with(['sale', 'customer', 'branch', 'items.product'])->find($id);
    }

    public function generateFromSale(Sale $sale, int $userId): Invoice
    {
        return DB::transaction(function () use ($sale, $userId) {
            // Check if invoice already exists for this sale
            $existing = Invoice::where('sale_id', $sale->id)->first();
            if ($existing) {
                return $existing->load('items.product');
            }

            $year = date('Y');
            $count = Invoice::whereYear('created_at', $year)->count() + 1;
            $invoiceNumber = sprintf("INV-%s-%06d", $year, $count);

            $statusIssued = SysStatus::where('domain', 'INVOICE')->where('code', 'ISSUED')->value('id') ?? 1;

            $balance = max(0.0, (float) $sale->total_amount - (float) $sale->paid_amount);

            $invoice = Invoice::create([
                'invoice_number' => $invoiceNumber,
                'sale_id' => $sale->id,
                'customer_id' => $sale->customer_id,
                'branch_id' => $sale->branch_id,
                'invoice_date' => now(),
                'due_date' => now()->addDays(30),
                'subtotal' => $sale->subtotal,
                'discount_amount' => $sale->discount_amount,
                'tax_amount' => $sale->tax_amount,
                'total_amount' => $sale->total_amount,
                'paid_amount' => $sale->paid_amount,
                'balance_amount' => $balance,
                'status_id' => $statusIssued,
                'created_by' => $userId,
            ]);

            foreach ($sale->items as $item) {
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'product_id' => $item->product_id,
                    'description' => $item->product->name ?? 'Sale Item',
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'tax_amount' => $item->tax_amount,
                    'discount_amount' => $item->discount_amount,
                    'total_amount' => $item->total_amount,
                ]);
            }

            return $invoice->load('items.product');
        });
    }
}
