<?php

namespace App\Modules\Sales\Domain\Exceptions;

use Exception;

class InsufficientStockException extends Exception
{
    public function __construct(int $productId, float $available, float $requested)
    {
        parent::__construct("Insufficient stock for product ID {$productId}. Available: {$available}, Requested: {$requested}.");
    }
}
