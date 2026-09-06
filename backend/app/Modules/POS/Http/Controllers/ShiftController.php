<?php

namespace App\Modules\POS\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\POS\Persistence\Models\PosRegister;
use App\Modules\POS\Persistence\Models\Shift;
use App\Modules\POS\Persistence\Models\CashDrawer;
use App\Modules\POS\Persistence\Models\CashMovement;
use App\Modules\POS\Application\Actions\OpenShiftAction;
use App\Modules\POS\Application\Actions\RecordCashMovementAction;
use App\Modules\POS\Application\Actions\CloseShiftAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    public function registers(): JsonResponse
    {
        $registers = PosRegister::with('branch')->where('status', 'ACTIVE')->get();

        return response()->json([
            'success' => true,
            'data' => $registers,
        ]);
    }

    public function currentShift(Request $request): JsonResponse
    {
        $registerId = $request->integer('register_id', 1);

        $shift = Shift::with(['register', 'cashier', 'cashMovements'])
            ->where('register_id', $registerId)
            ->where('status', 'OPEN')
            ->latest('opened_at')
            ->first();

        $drawer = CashDrawer::where('register_id', $registerId)->first();

        return response()->json([
            'success' => true,
            'data' => [
                'active_shift' => $shift,
                'drawer' => $drawer,
            ],
        ]);
    }

    public function open(Request $request, OpenShiftAction $action): JsonResponse
    {
        $validated = $request->validate([
            'register_id' => ['required', 'integer', 'exists:registers,id'],
            'opening_cash' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $shift = $action->execute(
            $validated['register_id'],
            $request->user()?->id ?? 1,
            (float) $validated['opening_cash'],
            $validated['notes'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => "Shift #{$shift->shift_number} opened successfully",
            'data' => $shift,
        ], 201);
    }

    public function movement(Request $request, RecordCashMovementAction $action): JsonResponse
    {
        $validated = $request->validate([
            'shift_id' => ['required', 'integer', 'exists:shifts,id'],
            'type' => ['required', 'string', 'in:CASH_IN,CASH_OUT,SAFE_DROP,EXPENSE'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $movement = $action->execute(
            $validated['shift_id'],
            $validated['type'],
            (float) $validated['amount'],
            $validated['reason'],
            $request->user()?->id ?? 1
        );

        return response()->json([
            'success' => true,
            'message' => "Cash movement recorded successfully",
            'data' => $movement,
        ], 201);
    }

    public function close(Request $request, CloseShiftAction $action): JsonResponse
    {
        $validated = $request->validate([
            'shift_id' => ['required', 'integer', 'exists:shifts,id'],
            'actual_cash' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $zReport = $action->execute(
            $validated['shift_id'],
            (float) $validated['actual_cash'],
            $validated['notes'] ?? null,
            $request->user()?->id ?? 1
        );

        return response()->json([
            'success' => true,
            'message' => 'Shift closed and Z-Report generated',
            'data' => $zReport,
        ]);
    }

    public function history(): JsonResponse
    {
        $shifts = Shift::with(['register', 'cashier', 'closedBy'])
            ->latest('opened_at')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $shifts,
        ]);
    }
}
