<?php

namespace App\Modules\Product\Application\Actions;

use App\Modules\Product\Domain\Contracts\ProductRepositoryInterface;
use App\Modules\Product\Application\DTOs\CreateProductDTO;
use App\Modules\Product\Persistence\Models\Product;

class CreateProductAction
{
    public function __construct(
        private readonly ProductRepositoryInterface $repository
    ) {}

    public function execute(CreateProductDTO $dto): Product
    {
        return $this->repository->create($dto->toArray());
    }
}
