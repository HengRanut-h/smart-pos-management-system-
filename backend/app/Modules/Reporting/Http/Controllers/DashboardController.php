<?php

namespace App\Modules\Reporting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reporting\Application\Actions\GetDashboardMetricsAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function metrics(Request $request, GetDashboardMetricsAction $action): JsonResponse
    {
        $metrics = $action->execute($request->input('branch_id'));

        return response()->json([
            'success' => true,
            'data' => $metrics,
        ]);
    }
}
