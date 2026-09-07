<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Modules\Settings\Persistence\Models\SysStatus;
use App\Modules\Role\Persistence\Models\Role;
use App\Modules\Permission\Persistence\Models\Permission;
use App\Modules\Payment\Persistence\Models\PaymentMethod;
use App\Modules\Organization\Persistence\Models\Branch;
use App\Modules\Warehouse\Persistence\Models\Warehouse;
use App\Modules\Employee\Persistence\Models\Employee;
use App\Modules\User\Persistence\Models\User;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed System Statuses
        $statuses = [
            ['domain' => 'SYSTEM', 'code' => 'ACTIVE', 'name' => 'Active'],
            ['domain' => 'SYSTEM', 'code' => 'INACTIVE', 'name' => 'Inactive'],
            ['domain' => 'USER', 'code' => 'ACTIVE', 'name' => 'Active'],
            ['domain' => 'USER', 'code' => 'PENDING_VERIFICATION', 'name' => 'Pending Verification'],
            ['domain' => 'USER', 'code' => 'DISABLED', 'name' => 'Disabled'],
            ['domain' => 'USER', 'code' => 'LOCKED', 'name' => 'Locked'],
            ['domain' => 'USER', 'code' => 'SUSPENDED', 'name' => 'Suspended'],
            ['domain' => 'SALE', 'code' => 'COMPLETED', 'name' => 'Completed'],
            ['domain' => 'SALE', 'code' => 'PARTIALLY_RETURNED', 'name' => 'Partially Returned'],
            ['domain' => 'SALE', 'code' => 'FULLY_RETURNED', 'name' => 'Fully Returned'],
            ['domain' => 'SALE', 'code' => 'VOIDED', 'name' => 'Voided'],
            ['domain' => 'PAYMENT', 'code' => 'PENDING', 'name' => 'Pending'],
            ['domain' => 'PAYMENT', 'code' => 'PAID', 'name' => 'Paid'],
            ['domain' => 'PAYMENT', 'code' => 'REFUNDED', 'name' => 'Refunded'],
            ['domain' => 'PURCHASE', 'code' => 'DRAFT', 'name' => 'Draft'],
            ['domain' => 'PURCHASE', 'code' => 'PENDING_APPROVAL', 'name' => 'Pending Approval'],
            ['domain' => 'PURCHASE', 'code' => 'APPROVED', 'name' => 'Approved'],
            ['domain' => 'PURCHASE', 'code' => 'PARTIALLY_RECEIVED', 'name' => 'Partially Received'],
            ['domain' => 'PURCHASE', 'code' => 'FULLY_RECEIVED', 'name' => 'Fully Received'],
            ['domain' => 'RETURN', 'code' => 'COMPLETED', 'name' => 'Completed'],
            ['domain' => 'INVOICE', 'code' => 'ISSUED', 'name' => 'Issued'],
            ['domain' => 'INVOICE', 'code' => 'PAID', 'name' => 'Paid'],
        ];

        foreach ($statuses as $st) {
            SysStatus::firstOrCreate(['domain' => $st['domain'], 'code' => $st['code']], $st);
        }

        $activeStatusId = SysStatus::where('domain', 'SYSTEM')->where('code', 'ACTIVE')->value('id') ?? 1;

        // 2. Seed Payment Methods
        $methods = [
            ['code' => 'CASH', 'name' => 'Cash', 'type' => 'CASH'],
            ['code' => 'KHQR', 'name' => 'Bakong KHQR', 'type' => 'KHQR'],
            ['code' => 'CARD', 'name' => 'Credit / Debit Card', 'type' => 'CARD'],
        ];
        foreach ($methods as $m) {
            PaymentMethod::firstOrCreate(['code' => $m['code']], $m);
        }

        // 3. Seed Canonical Roles
        $roles = [
            ['code' => 'SUPER_ADMIN', 'name' => 'Super Administrator', 'description' => 'Unrestricted system access'],
            ['code' => 'ADMIN', 'name' => 'Administrator', 'description' => 'System administration and reporting'],
            ['code' => 'MANAGER', 'name' => 'Branch Manager', 'description' => 'Branch management, approvals and voids'],
            ['code' => 'CASHIER', 'name' => 'Cashier', 'description' => 'POS operations and sales'],
            ['code' => 'STOCK_MANAGER', 'name' => 'Stock Manager', 'description' => 'Warehouse, inventory and receiving'],
            ['code' => 'ACCOUNTANT', 'name' => 'Accountant', 'description' => 'Financial reporting and invoices'],
            ['code' => 'HR', 'name' => 'Human Resources', 'description' => 'Employee and attendance management'],
            ['code' => 'EMPLOYEE', 'name' => 'Employee', 'description' => 'Standard employee access'],
            ['code' => 'CUSTOMER', 'name' => 'Customer', 'description' => 'Public registered customer with access to customer portal'],
        ];

        $createdRoles = [];
        foreach ($roles as $r) {
            $createdRoles[$r['code']] = Role::firstOrCreate(
                ['code' => $r['code']],
                array_merge($r, ['status_id' => $activeStatusId])
            );
        }

        // 4. Seed Permissions
        $permissions = [
            ['module' => 'Product', 'code' => 'product.view', 'name' => 'View Products', 'action' => 'view'],
            ['module' => 'Product', 'code' => 'product.create', 'name' => 'Create Product', 'action' => 'create'],
            ['module' => 'Product', 'code' => 'product.update', 'name' => 'Update Product', 'action' => 'update'],
            ['module' => 'Product', 'code' => 'product.delete', 'name' => 'Delete Product', 'action' => 'delete'],
            ['module' => 'Sales', 'code' => 'sale.view', 'name' => 'View Sales', 'action' => 'view'],
            ['module' => 'Sales', 'code' => 'sale.create', 'name' => 'Create Sale', 'action' => 'create'],
            ['module' => 'Sales', 'code' => 'sale.refund', 'name' => 'Process Refund', 'action' => 'refund'],
            ['module' => 'Sales', 'code' => 'sale.void', 'name' => 'Void Sale', 'action' => 'void'],
            ['module' => 'Purchasing', 'code' => 'purchase.view', 'name' => 'View Purchases', 'action' => 'view'],
            ['module' => 'Purchasing', 'code' => 'purchase.create', 'name' => 'Create Purchase', 'action' => 'create'],
            ['module' => 'Purchasing', 'code' => 'purchase.approve', 'name' => 'Approve Purchase', 'action' => 'approve'],
            ['module' => 'Purchasing', 'code' => 'purchase.receive', 'name' => 'Receive Goods', 'action' => 'receive'],
            ['module' => 'Inventory', 'code' => 'inventory.view', 'name' => 'View Inventory', 'action' => 'view'],
            ['module' => 'Inventory', 'code' => 'inventory.adjust', 'name' => 'Adjust Inventory', 'action' => 'adjust'],
            ['module' => 'Invoice', 'code' => 'invoice.view', 'name' => 'View Invoices', 'action' => 'view'],
            ['module' => 'Invoice', 'code' => 'invoice.generate', 'name' => 'Generate Invoice', 'action' => 'generate'],
            ['module' => 'Report', 'code' => 'report.view', 'name' => 'View Reports', 'action' => 'view'],
            ['module' => 'Audit', 'code' => 'audit.view', 'name' => 'View Audit Logs', 'action' => 'view'],
            ['module' => 'Customer', 'code' => 'customer.portal', 'name' => 'Access Customer Portal', 'action' => 'view'],
            ['module' => 'Customer', 'code' => 'order.view_own', 'name' => 'View Own Orders', 'action' => 'view'],
            ['module' => 'Customer', 'code' => 'invoice.view_own', 'name' => 'View Own Invoices', 'action' => 'view'],
            ['module' => 'User', 'code' => 'role.assign', 'name' => 'Assign Roles to Users', 'action' => 'assign'],
            ['module' => 'User', 'code' => 'user.manage', 'name' => 'Manage System Users', 'action' => 'manage'],
        ];

        $createdPermissions = [];
        foreach ($permissions as $p) {
            $createdPermissions[$p['code']] = Permission::firstOrCreate(
                ['code' => $p['code']],
                array_merge($p, ['status_id' => $activeStatusId])
            );
        }

        // 5. Assign all permissions to SUPER_ADMIN
        $superAdminRole = $createdRoles['SUPER_ADMIN'];
        $superAdminRole->permissions()->sync(array_column($createdPermissions, 'id'));

        // Assign permissions to ADMIN
        $adminRole = $createdRoles['ADMIN'];
        $adminRole->permissions()->sync(array_column($createdPermissions, 'id'));

        // Assign POS permissions to CASHIER
        $cashierRole = $createdRoles['CASHIER'];
        $cashierRole->permissions()->sync([
            $createdPermissions['product.view']->id,
            $createdPermissions['sale.view']->id,
            $createdPermissions['sale.create']->id,
            $createdPermissions['invoice.view']->id,
        ]);

        // Assign Customer Portal permissions to CUSTOMER
        $customerRole = $createdRoles['CUSTOMER'];
        $customerRole->permissions()->sync([
            $createdPermissions['customer.portal']->id,
            $createdPermissions['order.view_own']->id,
            $createdPermissions['invoice.view_own']->id,
        ]);

        // 6. Seed Default Branch & Warehouse
        $branch = Branch::firstOrCreate(
            ['code' => 'HQ-01'],
            [
                'name' => 'Phnom Penh Headquarters',
                'phone' => '+855 23 888 999',
                'email' => 'hq@smartpos.com',
                'city' => 'Phnom Penh',
                'country' => 'Cambodia',
                'status_id' => $activeStatusId,
            ]
        );

        $warehouse = Warehouse::firstOrCreate(
            ['code' => 'WH-MAIN'],
            [
                'branch_id' => $branch->id,
                'name' => 'Central Warehouse',
                'type' => 'CENTRAL',
                'status_id' => $activeStatusId,
            ]
        );

        // 7. Seed Default Employee & Super Admin User
        $employee = Employee::firstOrCreate(
            ['employee_code' => 'EMP-001'],
            [
                'branch_id' => $branch->id,
                'first_name' => 'Lead',
                'last_name' => 'Admin',
                'phone' => '+855 12 345 678',
                'email' => 'admin@smartpos.com',
                'status_id' => $activeStatusId,
            ]
        );

        $superAdminUser = User::firstOrCreate(
            ['username' => 'superadmin'],
            [
                'email' => 'superadmin@smartpos.com',
                'password' => Hash::make('SuperAdmin@123456'),
                'employee_id' => $employee->id,
                'status_id' => $activeStatusId,
            ]
        );
        $superAdminUser->roles()->syncWithoutDetaching([$superAdminRole->id]);

        $adminUser = User::firstOrCreate(
            ['username' => 'admin'],
            [
                'email' => 'admin@smartpos.com',
                'password' => Hash::make('Admin@123456'),
                'employee_id' => $employee->id,
                'status_id' => $activeStatusId,
            ]
        );
        $adminUser->roles()->syncWithoutDetaching([$adminRole->id]);
    }
}
