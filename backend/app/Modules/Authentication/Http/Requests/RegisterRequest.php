<?php

namespace App\Modules\Authentication\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Modules\Authentication\Application\DTOs\RegisterDTO;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:100', 'unique:users,username'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30', 'unique:users,phone'],
            'password' => ['required', 'string', 'min:6'],
            'accept_terms' => ['sometimes', 'boolean'],
        ];
    }

    public function toDTO(): RegisterDTO
    {
        return RegisterDTO::fromArray(
            $this->validated(),
            ipAddress: $this->ip(),
            userAgent: $this->userAgent()
        );
    }
}
