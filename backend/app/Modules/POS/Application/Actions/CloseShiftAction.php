<?php

namespace App\Modules\POS\Application\Actions;

use App\Modules\POS\Persistence\Models\Shift;
use App\Modules\POS\Persistence\Models\CashDrawer;
use App\Modules\POS\Persistence\Models\CashMovement;
use App\Modules\Sales\Persistence\Models\Sale;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CloseShiftAction
{
    public function execute(int $shiftId, float $actualCash, ?string $notes, int $closedBy): array
    {
        return DB::transaction(function () use ($shiftId, $actualCash, $notes, $closedBy) {
            $shift = Shift::with(['register', 'cashier'])->findOrFail($shiftId);

            if ($shift->status !== 'OPEN') {
                throw new InvalidArgumentException("Shift #{$shift->shift_number} is already closed.");
            }

            // 1. Calculate Total Cash Sales during this shift
            $cashSalesQuery = Sale::where('created_by', $shift->cashier_id)
                ->where('created_at', '>=', $shift->opened_at)
                ->where('created_at', '<=', now());

            $totalSalesCount = (clone $cashSalesQuery)->count();
            $totalSalesAmount = (float) (clone $cashSalesQuery)->sum('grand_total');

            // Cash movements
            $cashIn = (float) CashMovement::where('shift_id', $shiftId)->where('type', 'CASH_IN')->sum('amount');
            $cashOut = (float) CashMovement::where('shift_id', $shiftId)->whereIn('type', ['CASH_OUT', 'SAFE_DROP', 'EXPENSE'])->sum('amount');

            // Expected Cash Formula according to Section 21.149.29:
            // expected_cash = opening_cash + cash_sales + cash_in - cash_out - cash_refunds - cash_voids
            $openingCash = (float) $shift->opening_cash;
            $expectedCash = $openingCash + $totalSalesAmount + $cashIn - $cashOut;
            $cashDifference = $actualCash - $expectedCash;

            $shift->update([
                'closed_at' => now(),
                'expected_cash' => $expectedCash,
                'actual_cash' => $actualCash,
                'cash_difference' => $cashDifference,
                'status' => 'CLOSED',
                'closed_by' => $closedBy,
                'notes' => $notes,
            ]);

            // Update drawer
            $drawer = CashDrawer::where('register_id', $shift->register_id)->first();
            if ($drawer) {
                $drawer->update([
                    'current_balance' => $actualCash,
                    'status' => 'CLOSED',
                    'closed_at' => now(),
                ]);
            }

            // Return Z-Report payload
            return [
                'shift_id' => $shift->id,
                'shift_number' => $shift->shift_number,
                'register' => $shift->register->name ?? "Register #{$shift->register_id}",
                'cashier' => $shift->cashier->username ?? "Cashier #{$shift->cashier_id}",
                'opened_at' => $shift->opened_at->toIso8601String(),
                'closed_at' => now()->toIso8601String(),
                'opening_cash' => $openingCash,
                'total_sales_count' => $totalSalesCount,
                'total_sales_amount' => $totalSalesAmount,
                'cash_in' => $cashIn,
                'cash_out' => $cashOut,
                'expected_cash' => $expectedCash,
                'actual_cash' => $actualCash,
                'cash_difference' => $cashDifference,
                'reconciliation_result' => $cashDifference === 0.0 ? 'BALANCED' : ($cashDifference < 0 ? 'SHORT' : 'OVER'),
                'notes' => $notes,
            ];
        });
    }
}
