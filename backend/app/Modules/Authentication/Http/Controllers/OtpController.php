<?php

namespace App\Modules\Authentication\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Authentication\Application\Actions\SendOtpAction;
use App\Modules\Authentication\Application\Actions\VerifyOtpAction;
use App\Modules\Authentication\Application\Actions\ResetPasswordAction;
use App\Modules\Authentication\Http\Requests\SendOtpRequest;
use App\Modules\Authentication\Http\Requests\VerifyOtpRequest;
use App\Modules\Authentication\Http\Requests\ResetPasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OtpController extends Controller
{
    public function __construct(
        protected SendOtpAction $sendOtpAction,
        protected VerifyOtpAction $verifyOtpAction,
        protected ResetPasswordAction $resetPasswordAction
    ) {}

    public function send(SendOtpRequest $request): JsonResponse
    {
        $result = $this->sendOtpAction->execute($request->toDTO());

        $statusCode = ($result['success'] ?? true) ? 200 : 422;
        return response()->json($result, $statusCode);
    }

    public function verify(VerifyOtpRequest $request): JsonResponse
    {
        $result = $this->verifyOtpAction->execute($request->toDTO());

        $statusCode = ($result['success'] ?? true) ? 200 : 422;
        return response()->json($result, $statusCode);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $result = $this->resetPasswordAction->execute(
            $request->validated('reset_token'),
            $request->validated('password')
        );

        return response()->json($result);
    }
}
