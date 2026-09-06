<?php

namespace App\Modules\Product\Infrastructure\Repositories;

use App\Modules\Product\Domain\Contracts\ProductRepositoryInterface;
use App\Modules\Product\Persistence\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentProductRepository implements ProductRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return Product::with(['category', 'brand', 'unit', 'stocks'])->latest()->paginate($perPage);
    }

    public function findById(int $id): ?Product
    {
        return Product::with(['category', 'brand', 'unit', 'stocks'])->find($id);
    }

    public function create(array $data): Product
    {
        return Product::create($data);
    }

    public function update(int $id, array $data): Product
    {
        $product = Product::findOrFail($id);
        $product->update($data);
        return $product;
    }

    public function delete(int $id): bool
    {
        $product = Product::findOrFail($id);
        return (bool) $product->delete();
    }
}
