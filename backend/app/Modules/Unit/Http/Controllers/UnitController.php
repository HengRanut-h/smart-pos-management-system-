<?php

namespace App\Modules\Unit\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Unit\Persistence\Models\Unit;
use Illuminate\Http\JsonResponse;

class UnitController extends Controller
{
    public function index(): JsonResponse
    {
        $units = Unit::all(['id', 'name', 'symbol']);
        return response()->json([
            'success' => true,
            'data' => $units,
        ]);
    }
}
