<?php

namespace App\Modules\POS\Application\Actions;

use App\Modules\POS\Persistence\Models\Shift;
use App\Modules\POS\Persistence\Models\CashMovement;
use App\Modules\POS\Persistence\Models\CashDrawer;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class RecordCashMovementAction
{
    public function execute(int $shiftId, string $type, float $amount, string $reason, int $cashierId): CashMovement
    {
        return DB::transaction(function () use ($shiftId, $type, $amount, $reason, $cashierId) {
            $shift = Shift::findOrFail($shiftId);

            if ($shift->status !== 'OPEN') {
                throw new InvalidArgumentException("Cannot record cash movement on a closed shift.");
            }

            $drawer = CashDrawer::where('register_id', $shift->register_id)->first();

            if (in_array($type, ['CASH_OUT', 'SAFE_DROP', 'EXPENSE'])) {
                if ($drawer && (float) $drawer->current_balance < $amount) {
                    throw new InvalidArgumentException("Insufficient cash in drawer. Current: {$drawer->current_balance}, Requested: {$amount}");
                }
                if ($drawer) {
                    $drawer->current_balance -= $amount;
                    $drawer->save();
                }
            } elseif ($type === 'CASH_IN') {
                if ($drawer) {
                    $drawer->current_balance += $amount;
                    $drawer->save();
                }
            }

            $movement = CashMovement::create([
                'shift_id' => $shiftId,
                'register_id' => $shift->register_id,
                'cashier_id' => $cashierId,
                'type' => $type,
                'amount' => $amount,
                'reason' => $reason,
                'created_at' => now(),
            ]);

            return $movement;
        });
    }
}
