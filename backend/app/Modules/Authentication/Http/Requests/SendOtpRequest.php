<?php

namespace App\Modules\Authentication\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Modules\Authentication\Application\DTOs\OtpDTO;

class SendOtpRequest extends FormRequest
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
            'channel' => ['sometimes', 'string', 'in:EMAIL,SMS'],
        ];
    }

    public function toDTO(): OtpDTO
    {
        return OtpDTO::fromArray($this->validated());
    }
}
