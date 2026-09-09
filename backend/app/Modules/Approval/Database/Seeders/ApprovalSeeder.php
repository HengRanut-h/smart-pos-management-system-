<?php

namespace App\Modules\Approval\Database\Seeders;

use Illuminate\Database\Seeder;
use App\Modules\Approval\Persistence\Models\ApprovalWorkflow;
use App\Modules\Approval\Persistence\Models\ApprovalRequest;
use App\Modules\Approval\Persistence\Models\ApprovalAction;
use App\Modules\Approval\Persistence\Models\BusinessRule;

class ApprovalSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Approval Workflows
        $wfPO = ApprovalWorkflow::updateOrCreate(
            ['code' => 'WF_PO_OVER_500'],
            [
                'name' => 'High-Value Purchase Order Approval',
                'module' => 'PURCHASES',
                'trigger_event' => 'PURCHASE_ORDER',
                'threshold_amount' => 500.00,
                'required_role' => 'BRANCH_MANAGER',
                'description' => 'Supplier purchase orders exceeding $500 require branch manager signoff before dispatch.',
                'escalation_timeout_hours' => 24,
                'auto_notify_telegram' => true,
                'is_active' => true,
            ]
        );

        $wfRefund = ApprovalWorkflow::updateOrCreate(
            ['code' => 'WF_REFUND_OVER_50'],
            [
                'name' => 'POS Customer Refund Authorization',
                'module' => 'SALES',
                'trigger_event' => 'HIGH_REFUND',
                'threshold_amount' => 50.00,
                'required_role' => 'STORE_MANAGER',
                'description' => 'Customer returns or cash refunds over $50 require manager passcode confirmation.',
                'escalation_timeout_hours' => 12,
                'auto_notify_telegram' => true,
                'is_active' => true,
            ]
        );

        $wfDiscount = ApprovalWorkflow::updateOrCreate(
            ['code' => 'WF_DISCOUNT_OVER_15'],
            [
                'name' => 'Excessive Manual Discount Override',
                'module' => 'SALES',
                'trigger_event' => 'HIGH_DISCOUNT',
                'threshold_amount' => 15.00, // 15%
                'required_role' => 'STORE_MANAGER',
                'description' => 'Discounts greater than 15% on checkout require supervisory override.',
                'escalation_timeout_hours' => 6,
                'auto_notify_telegram' => true,
                'is_active' => true,
            ]
        );

        $wfStock = ApprovalWorkflow::updateOrCreate(
            ['code' => 'WF_STOCK_WRITEOFF'],
            [
                'name' => 'Inventory Damage & Loss Write-Off',
                'module' => 'INVENTORY',
                'trigger_event' => 'STOCK_ADJUSTMENT',
                'threshold_amount' => 100.00,
                'required_role' => 'WAREHOUSE_MANAGER',
                'description' => 'Damaged, expired, or shrinkage stock write-offs over $100 require warehouse audit.',
                'escalation_timeout_hours' => 48,
                'auto_notify_telegram' => true,
                'is_active' => true,
            ]
        );

        $wfCredit = ApprovalWorkflow::updateOrCreate(
            ['code' => 'WF_CUSTOMER_CREDIT_2000'],
            [
                'name' => 'Corporate Customer Credit Line Approval',
                'module' => 'FINANCE',
                'trigger_event' => 'CREDIT_LIMIT',
                'threshold_amount' => 2000.00,
                'required_role' => 'FINANCE_DIRECTOR',
                'description' => 'Granting customer accounts payment terms or credit exceeding $2,000.',
                'escalation_timeout_hours' => 48,
                'auto_notify_telegram' => true,
                'is_active' => true,
            ]
        );

        // 2. Seed Initial Pending Requests
        $req1 = ApprovalRequest::updateOrCreate(
            ['request_code' => 'REQ-202609-001'],
            [
                'workflow_id' => $wfPO->id,
                'requestable_type' => 'PurchaseOrder',
                'requestable_id' => 104,
                'title' => 'Purchase Order #PO-2026-088 - Nestlé Beverage Restock',
                'reason' => 'Quarterly bulk replenishment for Arabica Coffee and Barista Oat Milk supply.',
                'amount' => 1850.00,
                'currency' => 'USD',
                'status' => 'PENDING',
                'payload_snapshot' => [
                    'supplier' => 'Nestlé Cambodia Distribution Ltd.',
                    'items_count' => 12,
                    'delivery_date' => '2026-09-15',
                    'terms' => 'Net 30 Days',
                ],
                'requested_by' => 1,
                'branch_id' => 1,
            ]
        );

        ApprovalAction::firstOrCreate([
            'request_id' => $req1->id,
            'actor_id' => 1,
            'action' => 'SUBMIT',
        ], [
            'comments' => 'Submitted purchase requisition for approval.',
            'ip_address' => '127.0.0.1',
        ]);

        $req2 = ApprovalRequest::updateOrCreate(
            ['request_code' => 'REQ-202609-002'],
            [
                'workflow_id' => $wfRefund->id,
                'requestable_type' => 'Sale',
                'requestable_id' => 88,
                'title' => 'Sale Refund #POS-202609-0088 - Broken Packaging Return',
                'reason' => 'Customer brought back 3 cartons of milk damaged during transit; requested instant cash refund.',
                'amount' => 75.00,
                'currency' => 'USD',
                'status' => 'PENDING',
                'payload_snapshot' => [
                    'customer' => 'Sokha Meng (VIP Retailer)',
                    'original_receipt' => 'INV-2026-0042',
                    'refund_method' => 'CASH',
                ],
                'requested_by' => 1,
                'branch_id' => 1,
            ]
        );

        ApprovalAction::firstOrCreate([
            'request_id' => $req2->id,
            'actor_id' => 1,
            'action' => 'SUBMIT',
        ], [
            'comments' => 'Cashier requested customer refund approval.',
            'ip_address' => '127.0.0.1',
        ]);

        $req3 = ApprovalRequest::updateOrCreate(
            ['request_code' => 'REQ-202609-003'],
            [
                'workflow_id' => $wfStock->id,
                'requestable_type' => 'InventoryMovement',
                'requestable_id' => 312,
                'title' => 'Damaged Inventory Scrapping - Central Warehouse',
                'reason' => 'Water leak in aisle 4 caused moisture damage to dry syrup cartons.',
                'amount' => 240.00,
                'currency' => 'USD',
                'status' => 'PENDING',
                'payload_snapshot' => [
                    'warehouse' => 'Main Logistics Hub - Toul Kork',
                    'damaged_skus' => ['SYR-VAN-02', 'SYR-CAR-01'],
                    'units_to_discard' => 20,
                ],
                'requested_by' => 1,
                'branch_id' => 1,
            ]
        );

        // 3. Seed Enterprise Business Rules
        BusinessRule::updateOrCreate(
            ['rule_code' => 'BR_ORDER_TOTAL_1000'],
            [
                'name' => 'High-Value Sale Authorization',
                'domain' => 'SALES',
                'event_hook' => 'BEFORE_CHECKOUT',
                'condition_expression' => ['field' => 'cart.total', 'operator' => '>=', 'value' => 1000],
                'action_type' => 'REQUIRE_APPROVAL',
                'action_payload' => ['role' => 'BRANCH_MANAGER', 'message' => 'Orders >= $1,000 require manager approval.'],
                'priority' => 10,
                'is_active' => true,
            ]
        );

        BusinessRule::updateOrCreate(
            ['rule_code' => 'BR_AUTO_REORDER_ALERT'],
            [
                'name' => 'Automated Reorder Threshold Notification',
                'domain' => 'INVENTORY',
                'event_hook' => 'STOCK_BELOW_REORDER',
                'condition_expression' => ['field' => 'stock.available', 'operator' => '<=', 'value' => 'stock.reorder_point'],
                'action_type' => 'SEND_ALERT',
                'action_payload' => ['channel' => 'TELEGRAM', 'template' => 'Low stock critical: Requisition drafted.'],
                'priority' => 8,
                'is_active' => true,
            ]
        );

        BusinessRule::updateOrCreate(
            ['rule_code' => 'BR_GOLD_VIP_DISCOUNT'],
            [
                'name' => 'Gold Tier Customer Auto-Discount',
                'domain' => 'PRICING',
                'event_hook' => 'ON_CUSTOMER_SELECTED',
                'condition_expression' => ['field' => 'customer.tier', 'operator' => '===', 'value' => 'GOLD'],
                'action_type' => 'AUTO_DISCOUNT',
                'action_payload' => ['percent' => 10.0, 'note' => 'Gold VIP Loyalty Reward 10%'],
                'priority' => 5,
                'is_active' => true,
            ]
        );
    }
}
