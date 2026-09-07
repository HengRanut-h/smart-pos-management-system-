<?php

namespace App\Modules\Authentication\Application\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class EmailOtpService
{
    public function send(string $email, string $otp, string $purpose): bool
    {
        Log::info("Dispatching Real Email OTP [{$otp}] for [{$purpose}] to: {$email}");

        $subject = match ($purpose) {
            'REGISTRATION' => 'SmartPOS - Account Verification Code: ' . $otp,
            'PASSWORD_RESET' => 'SmartPOS - Password Reset Code: ' . $otp,
            default => 'SmartPOS - Security Verification Code: ' . $otp,
        };

        $purposeLabel = match ($purpose) {
            'REGISTRATION' => 'Account Registration & Verification',
            'PASSWORD_RESET' => 'Password Reset Request',
            default => 'Security Verification',
        };

        $appName = config('app.name', 'SmartPOS');
        $year = date('Y');

        $htmlContent = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$subject}</title>
</head>
<body style="margin: 0; padding: 30px 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center; background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);">
                <div style="display: inline-block; padding: 10px 16px; background: rgba(255,255,255,0.15); border-radius: 12px; margin-bottom: 12px;">
                    <span style="font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: 1px;">SmartPOS</span>
                </div>
                <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">{$purposeLabel}</h2>
            </td>
        </tr>
        <tr>
            <td style="padding: 32px 36px; text-align: center;">
                <p style="color: #475569; font-size: 15px; margin: 0 0 20px 0; line-height: 1.5;">
                    Please use the following 6-digit verification code to complete your request:
                </p>
                <div style="display: inline-block; background-color: #f8fafc; border: 2px dashed #93c5fd; border-radius: 12px; padding: 16px 32px; margin: 8px 0 20px 0;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #1e293b;">{$otp}</span>
                </div>
                <div style="background-color: #fef2f2; border-radius: 8px; padding: 10px; display: inline-block; margin-bottom: 20px;">
                    <span style="color: #dc2626; font-size: 13px; font-weight: 600;">&#9201; Valid for 5 minutes</span>
                </div>
                <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
                    If you did not request this verification code, please ignore this email or contact support. Do not share this code with anyone.
                </p>
            </td>
        </tr>
        <tr>
            <td style="padding: 20px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    &copy; {$year} {$appName} Business Management System. All rights reserved.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;

        try {
            Mail::html($htmlContent, function ($message) use ($email, $subject) {
                $message->to($email)->subject($subject);
            });
            Log::info("Real Email OTP successfully sent to: {$email}");
            return true;
        } catch (\Throwable $e) {
            Log::error("HTML email delivery error, attempting plain text fallback: " . $e->getMessage());
            try {
                $body = "Your SmartPOS verification code is: {$otp}\n\nThis code will expire in 5 minutes.";
                Mail::raw($body, function ($message) use ($email, $subject) {
                    $message->to($email)->subject($subject);
                });
                return true;
            } catch (\Throwable $ex) {
                Log::error("Email delivery failed completely: " . $ex->getMessage());
                return false;
            }
        }
    }
}
