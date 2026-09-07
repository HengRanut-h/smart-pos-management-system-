<?php

namespace App\Modules\Authentication\Application\Services;

use Illuminate\Support\Facades\Log;

class SmsOtpService
{
    public function send(string $phone, string $otp, string $purpose): bool
    {
        Log::info("Dispatching SMS OTP [{$otp}] for [{$purpose}] to: {$phone}");

        // Ready for SMS provider integration (Twilio / AWS SNS / Infobip / Telegram Gateway)
        return true;
    }
}
