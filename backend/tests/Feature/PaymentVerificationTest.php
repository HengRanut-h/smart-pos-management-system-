<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Modules\Settings\Persistence\Models\SysStatus;
use App\Modules\Organization\Persistence\Models\Branch;
use App\Modules\Warehouse\Persistence\Models\Warehouse;
use App\Modules\Employee\Persistence\Models\Employee;
use App\Modules\User\Persistence\Models\User;
use App\Modules\Payment\Persistence\Models\PaymentMethod;
use App\Modules\Payment\Persistence\Models\Payment;
use App\Modules\Payment\Domain\Contracts\PaymentGatewayInterface;
use App\Modules\Payment\Application\Actions\VerifyPaymentAction;
use App\Modules\Payment\Domain\Events\PaymentCompletedEvent;
use Illuminate\Support\Facades\Event;

class PaymentVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_khqr_payload_generation(): void
    {
        $gateway = app(PaymentGatewayInterface::class);

        $qrData = $gateway->generateQR('INV-1001', 25.50, 'USD');

        $this->assertArrayHasKey('qr_string', $qrData);
        $this->assertArrayHasKey('md5', $qrData);
        $this->assertEquals(25.50, $qrData['amount']);
        $this->assertEquals('USD', $qrData['currency']);
    }

    public function test_idempotent_payment_verification(): void
    {
        Event::fake([PaymentCompletedEvent::class]);

        $statusPending = SysStatus::create(['domain' => 'PAYMENT', 'code' => 'PENDING', 'name' => 'Pending']);
        $statusPaid = SysStatus::create(['domain' => 'PAYMENT', 'code' => 'PAID', 'name' => 'Paid']);
        $branch = Branch::create(['code' => 'BR-PAY', 'name' => 'Pay Branch', 'status_id' => 1]);
        $emp = Employee::create(['employee_code' => 'EMP-P', 'branch_id' => $branch->id, 'first_name' => 'A', 'last_name' => 'B', 'status_id' => 1]);
        $user = User::create(['username' => 'pay_user', 'password' => 'secret', 'employee_id' => $emp->id, 'status_id' => 1]);
        $method = PaymentMethod::create(['code' => 'KHQR', 'name' => 'Bakong KHQR', 'type' => 'KHQR']);

        $payment = Payment::create([
            'payment_number' => 'PAY-TEST-99',
            'payment_method_id' => $method->id,
            'amount' => 50.0,
            'currency' => 'USD',
            'status_id' => $statusPending->id,
            'paid_at' => now(),
            'created_by' => $user->id,
        ]);

        $action = app(VerifyPaymentAction::class);

        // 1. First verification
        $verifiedPayment = $action->execute($payment->id, 'BAKONG-TXN-12345');
        $this->assertEquals($statusPaid->id, $verifiedPayment->status_id);
        $this->assertEquals('BAKONG-TXN-12345', $verifiedPayment->transaction_id);

        Event::assertDispatched(PaymentCompletedEvent::class, 1);

        // 2. Second verification (Idempotency test: should not fail or duplicate event)
        $reverifiedPayment = $action->execute($payment->id, 'BAKONG-TXN-12345');
        $this->assertEquals($statusPaid->id, $reverifiedPayment->status_id);

        // Event should still only have fired once
        Event::assertDispatched(PaymentCompletedEvent::class, 1);
    }
}
