<?php

namespace App\Modules\Notification\Infrastructure\Telegram;

use App\Modules\Notification\Domain\Contracts\TelegramNotifierInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramNotifier implements TelegramNotifierInterface
{
    public function sendMessage(string $message, ?string $chatId = null): bool
    {
        $botToken = config('services.telegram.bot_token') ?? env('TELEGRAM_BOT_TOKEN');
        $targetChat = $chatId ?? config('services.telegram.chat_id') ?? env('TELEGRAM_CHAT_ID');

        if (! $botToken || ! $targetChat) {
            Log::info("Telegram notification simulated (Token/ChatId not set): " . $message);
            return true;
        }

        try {
            $response = Http::withoutVerifying()->post("https://api.telegram.org/bot{$botToken}/sendMessage", [
                'chat_id' => $targetChat,
                'text' => $message,
                'parse_mode' => 'Markdown',
            ]);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::error("Failed to send Telegram message: " . $e->getMessage());
            return false;
        }
    }
}
