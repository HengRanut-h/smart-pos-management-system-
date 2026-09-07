<?php

namespace App\Modules\Authentication\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Modules\Authentication\Application\DTOs\OtpDTO;

class VerifyOtpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'destination' => ['required_without_all:email,phone', 'string'],
            'email' => ['sometimes', 'email'],
            'phone' => ['sometimes', 'string'],
            'purpose' => ['required', 'string', 'in:REGISTRATION,PASSWORD_RESET,PHONE_LOGIN'],
            'otp' => ['required', 'string', 'min:4', 'max:8'],
        ];
    }

    public function toDTO(): OtpDTO
    {
        return OtpDTO::fromArray($this->validated());
    }
}
