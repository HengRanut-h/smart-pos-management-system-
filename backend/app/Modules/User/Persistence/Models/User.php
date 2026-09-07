<?php

namespace App\Modules\User\Persistence\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Modules\Employee\Persistence\Models\Employee;
use App\Modules\Role\Persistence\Models\Role;
use App\Modules\Permission\Persistence\Models\Permission;
use App\Modules\Authentication\Persistence\Models\SocialAccount;
use App\Modules\Authentication\Persistence\Models\OtpVerification;
use App\Modules\Authentication\Persistence\Models\AuthSession;
use App\Modules\Customer\Persistence\Models\Customer;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, SoftDeletes, Notifiable;

    protected $table = 'users';
    protected $guarded = ['id'];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles', 'user_id', 'role_id')
                    ->withPivot('assigned_by', 'assigned_at');
    }

    public function socialAccounts()
    {
        return $this->hasMany(SocialAccount::class, 'user_id');
    }

    public function otpVerifications()
    {
        return $this->hasMany(OtpVerification::class, 'user_id');
    }

    public function authSessions()
    {
        return $this->hasMany(AuthSession::class, 'user_id');
    }

    public function permissions()
    {
        return $this->roles->flatMap(fn($role) => $role->permissions)->unique('id');
    }

    public function hasPermission(string $code): bool
    {
        return $this->permissions()->contains('code', $code);
    }

    public function hasRole(string $code): bool
    {
        return $this->roles->contains(fn($r) => strtoupper($r->code) === strtoupper($code));
    }

    public function isCustomer(): bool
    {
        return $this->hasRole('CUSTOMER') && !$this->isStaff();
    }

    public function isStaff(): bool
    {
        return $this->roles->contains(fn($r) => in_array(strtoupper($r->code), [
            'CASHIER', 'MANAGER', 'STOCK_MANAGER', 'ACCOUNTANT', 'HR', 'EMPLOYEE', 'ADMIN', 'SUPER_ADMIN'
        ]));
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('ADMIN') || $this->hasRole('SUPER_ADMIN');
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole('SUPER_ADMIN');
    }
}
