<?php

namespace App\Modules\POS\Application\Actions;

use App\Modules\POS\Persistence\Models\Shift;
use App\Modules\POS\Persistence\Models\CashDrawer;
use App\Modules\POS\Persistence\Models\PosRegister;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class OpenShiftAction
{
    public function execute(int $registerId, int $cashierId, float $openingCash, ?string $notes = null): Shift
    {
        return DB::transaction(function () use ($registerId, $cashierId, $openingCash, $notes) {
            $register = PosRegister::findOrFail($registerId);

            // Check for existing active shift on this register
            $activeShift = Shift::where('register_id', $registerId)
                ->where('status', 'OPEN')
                ->first();

            if ($activeShift) {
                throw new InvalidArgumentException("Register {$register->code} already has an active open shift (#{$activeShift->shift_number}). Please close it first.");
            }

            $shift = Shift::create([
                'branch_id' => $register->branch_id,
                'register_id' => $registerId,
                'cashier_id' => $cashierId,
                'shift_number' => 'SHF-' . strtoupper(uniqid()),
                'opened_at' => now(),
                'opening_cash' => $openingCash,
                'status' => 'OPEN',
                'notes' => $notes,
            ]);

            // Update or create CashDrawer
            $drawer = CashDrawer::firstOrNew(['register_id' => $registerId]);
            $drawer->shift_id = $shift->id;
            $drawer->opening_balance = $openingCash;
            $drawer->current_balance = $openingCash;
            $drawer->status = 'OPEN';
            $drawer->opened_at = now();
            $drawer->closed_at = null;
            $drawer->save();

            return $shift->load(['register', 'cashier']);
        });
    }
}
