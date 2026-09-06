<?php

namespace App\Modules\Notification\Domain\Contracts;

interface TelegramNotifierInterface
{
    public function sendMessage(string $message, ?string $chatId = null): bool;
}
