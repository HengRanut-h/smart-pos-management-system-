<?php

namespace App\Modules\Authentication\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Modules\Authentication\Application\DTOs\LoginDTO;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    public function toDTO(): LoginDTO
    {
        return new LoginDTO(
            username: $this->validated('username'),
            password: $this->validated('password'),
            ipAddress: $this->ip()
        );
    }
}
