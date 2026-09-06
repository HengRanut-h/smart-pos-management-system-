<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Event;
use App\Modules\Product\Domain\Contracts\ProductRepositoryInterface;
use App\Modules\Product\Infrastructure\Repositories\EloquentProductRepository;
use App\Modules\Sales\Domain\Contracts\SaleRepositoryInterface;
use App\Modules\Sales\Infrastructure\Repositories\EloquentSaleRepository;
use App\Modules\Purchasing\Domain\Contracts\PurchaseRepositoryInterface;
use App\Modules\Purchasing\Infrastructure\Repositories\EloquentPurchaseRepository;
use App\Modules\Return\Domain\Contracts\ReturnRepositoryInterface;
use App\Modules\Return\Infrastructure\Repositories\EloquentReturnRepository;
use App\Modules\Payment\Domain\Contracts\PaymentGatewayInterface;
use App\Modules\Payment\Infrastructure\Payment\KHQRPaymentGateway;
use App\Modules\Invoice\Domain\Contracts\InvoiceRepositoryInterface;
use App\Modules\Invoice\Infrastructure\Repositories\EloquentInvoiceRepository;
use App\Modules\Notification\Domain\Contracts\TelegramNotifierInterface;
use App\Modules\Notification\Infrastructure\Telegram\TelegramNotifier;
use App\Modules\Audit\Application\Subscribers\AuditSubscriber;

class ModuleServiceProvider extends ServiceProvider
{
    /**
     * Register services and contracts.
     */
    public function register(): void
    {
        $this->app->bind(ProductRepositoryInterface::class, EloquentProductRepository::class);
        $this->app->bind(SaleRepositoryInterface::class, EloquentSaleRepository::class);
        $this->app->bind(PurchaseRepositoryInterface::class, EloquentPurchaseRepository::class);
        $this->app->bind(ReturnRepositoryInterface::class, EloquentReturnRepository::class);
        $this->app->bind(PaymentGatewayInterface::class, KHQRPaymentGateway::class);
        $this->app->bind(InvoiceRepositoryInterface::class, EloquentInvoiceRepository::class);
        $this->app->bind(TelegramNotifierInterface::class, TelegramNotifier::class);
    }

    /**
     * Bootstrap module routes, migrations, and event subscribers.
     */
    public function boot(): void
    {
        // Event Subscribers
        Event::subscribe(AuditSubscriber::class);

        $this->bootModules();
    }

    protected function bootModules(): void
    {
        $modulesPath = app_path('Modules');

        if (!is_dir($modulesPath)) {
            return;
        }

        $modules = scandir($modulesPath);

        foreach ($modules as $module) {
            if ($module === '.' || $module === '..') continue;

            $moduleDir = $modulesPath . '/' . $module;

            if (is_dir($moduleDir)) {
                // API Routes: /api/v1/{module-routes}
                $apiRoutesPath = $moduleDir . '/Routes/api.php';
                if (file_exists($apiRoutesPath)) {
                    Route::middleware('api')
                        ->prefix('api/v1')
                        ->group($apiRoutesPath);
                }

                // Migrations
                $migrationsPath = $moduleDir . '/Database/Migrations';
                if (is_dir($migrationsPath)) {
                    $this->loadMigrationsFrom($migrationsPath);
                }
            }
        }
    }
}
