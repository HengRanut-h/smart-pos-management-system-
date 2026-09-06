<?php

namespace App\Modules\Category\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Category\Persistence\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::all(['id', 'name', 'code', 'is_active']);
        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }
}
