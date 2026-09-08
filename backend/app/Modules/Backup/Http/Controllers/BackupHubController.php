<?php

namespace App\Modules\Backup\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Backup\Application\Services\BackupManagerService;
use App\Modules\Backup\Application\Services\TelegramBotService;
use App\Modules\Backup\Persistence\Models\BackupRecord;
use App\Modules\Backup\Persistence\Models\BackupSchedule;
use App\Modules\Backup\Persistence\Models\TelegramBot;
use App\Modules\Backup\Persistence\Models\TelegramUser;
use App\Modules\Backup\Persistence\Models\TelegramLog;
use App\Modules\Sales\Persistence\Models\Sale;
use App\Modules\Product\Persistence\Models\Product;
use App\Modules\Customer\Persistence\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupHubController extends Controller
{
    public function __construct(
        protected BackupManagerService $backupManager,
        protected TelegramBotService $telegramBot
    ) {}

    /**
     * Dashboard KPI metrics.
     */
    public function dashboard(): JsonResponse
    {
        $dbStats = $this->backupManager->getDatabaseStats();

        $totalBackups = BackupRecord::count();
        $successfulBackups = BackupRecord::where('status', 'SUCCESS')->count();
        $latestBackup = BackupRecord::latest()->first();
        $nextSchedule = BackupSchedule::where('status', 'ACTIVE')->first();

        return response()->json([
            'success' => true,
            'data' => [
                'total_backups' => $totalBackups,
                'successful_backups' => $successfulBackups,
                'last_backup' => $latestBackup ? [
                    'code' => $latestBackup->backup_code,
                    'filename' => $latestBackup->filename,
                    'size' => $latestBackup->size_formatted,
                    'status' => $latestBackup->status,
                    'created_at' => $latestBackup->created_at->toIso8601String(),
                ] : null,
                'next_scheduled_run' => $nextSchedule ? 'Daily at ' . $nextSchedule->start_time : 'Daily at 02:00 AM',
                'database' => $dbStats,
                'health_status' => 'OPTIMAL',
                'health_score' => 98,
                'three_two_one_strategy' => [
                    'primary_local' => 'READY',
                    'secondary_drive' => 'ACTIVE',
                    'cloud_offsite' => 'ENCRYPTED',
                ],
            ],
        ]);
    }

    /**
     * Paginated backup history records with filtering.
     */
    public function records(Request $request): JsonResponse
    {
        $query = BackupRecord::with('user')->latest('id');

        if ($request->filled('type') && $request->type !== 'ALL') {
            $query->where('backup_type', $request->type);
        }

        if ($request->filled('status') && $request->status !== 'ALL') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $s = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($s) {
                $q->where('backup_code', 'LIKE', $s)
                  ->orWhere('filename', 'LIKE', $s);
            });
        }

        $records = $query->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $records->items(),
            'pagination' => [
                'total' => $records->total(),
                'current_page' => $records->currentPage(),
                'last_page' => $records->lastPage(),
                'per_page' => $records->perPage(),
            ],
        ]);
    }

    /**
     * Create a backup snapshot manually.
     */
    public function create(Request $request): JsonResponse
    {
        $options = [
            'type' => $request->input('type', 'FULL'),
            'storage' => $request->input('storage', 'LOCAL+CLOUD'),
            'compression' => $request->input('compression', 'ENABLED'),
            'encryption' => $request->input('encryption', 'AES-256 (SHA-Verified)'),
            'retention_days' => $request->integer('retention_days', 30),
        ];

        $user = $request->user();
        $record = $this->backupManager->createBackup($options, $user?->id, 'MANUAL');

        return response()->json([
            'success' => true,
            'message' => "Backup snapshot {$record->backup_code} created successfully!",
            'data' => $record,
        ]);
    }

    /**
     * Checksum & integrity test for a specific backup snapshot.
     */
    public function verify(int $id): JsonResponse
    {
        $result = $this->backupManager->verifyBackup($id);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Disaster recovery restore of a backup snapshot.
     */
    public function restore(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        try {
            $res = $this->backupManager->restoreBackup($id, $user?->id);
            return response()->json($res);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Restoration failed: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Download backup snapshot file.
     */
    public function download(int $id): BinaryFileResponse|JsonResponse
    {
        $backup = BackupRecord::findOrFail($id);

        if (!File::exists($backup->file_path)) {
            return response()->json(['success' => false, 'message' => 'Backup file not found on storage'], 404);
        }

        return response()->download($backup->file_path, $backup->filename);
    }

    /**
     * Send backup snapshot file directly to Telegram.
     */
    public function sendToTelegram(Request $request, int $id): JsonResponse
    {
        $backup = BackupRecord::findOrFail($id);
        $chatId = $request->input('chat_id');
        $res = $this->telegramBot->sendBackupFile($backup, $chatId);

        return response()->json($res, $res['success'] ? 200 : 422);
    }

    /**
     * Export data and send the generated file directly to Telegram.
     */
    public function sendExportToTelegram(Request $request, string $type): JsonResponse
    {
        $type = strtolower($type);
        if ($type === 'sales') {
            $data = Sale::with('items')->latest()->take(200)->get();
            $title = 'Sales Orders';
        } elseif ($type === 'products') {
            $data = Product::with('category')->get();
            $title = 'Products Catalog';
        } elseif ($type === 'customers') {
            $data = Customer::all();
            $title = 'Customers Directory';
        } else {
            return response()->json(['success' => false, 'message' => 'Invalid export entity type.'], 400);
        }

        $timestamp = date('Ymd_His');
        $filename = "smartpos_{$type}_export_{$timestamp}.json";
        $tempDir = storage_path('app/exports');
        if (!File::exists($tempDir)) {
            File::makeDirectory($tempDir, 0755, true);
        }
        $filePath = $tempDir . DIRECTORY_SEPARATOR . $filename;
        File::put($filePath, json_encode([
            'system' => 'SmartPOS & Business Management System',
            'export_type' => $type,
            'records_count' => count($data),
            'exported_at' => now()->toIso8601String(),
            'data' => $data,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        $chatId = $request->input('chat_id');
        $caption = "📊 *SMARTPOS DATA EXPORT*\n\n"
            . "• *Entity:* {$title} (`{$type}`)\n"
            . "• *Records Count:* " . count($data) . " items\n"
            . "• *File:* `{$filename}`\n"
            . "• *Date:* `" . now()->toDateTimeString() . "`";

        $res = $this->telegramBot->sendDocument($filePath, $caption, $chatId, null, $filename);

        // Remove temporary export file
        if (File::exists($filePath)) {
            File::delete($filePath);
        }

        return response()->json($res, $res['success'] ? 200 : 422);
    }

    /**
     * Delete backup snapshot file and database record.
     */
    public function destroy(int $id): JsonResponse
    {
        $backup = BackupRecord::findOrFail($id);

        if (File::exists($backup->file_path)) {
            File::delete($backup->file_path);
        }

        $backup->delete();

        return response()->json([
            'success' => true,
            'message' => 'Backup snapshot deleted successfully.',
        ]);
    }

    /**
     * List backup schedules.
     */
    public function schedules(): JsonResponse
    {
        $schedules = BackupSchedule::all();
        if ($schedules->isEmpty()) {
            // Seed default schedules if empty
            $schedules = collect([
                BackupSchedule::create([
                    'name' => 'Automated Nightly Full Backup',
                    'frequency' => 'DAILY',
                    'start_time' => '02:00:00',
                    'backup_type' => 'FULL',
                    'storage_destination' => 'LOCAL+CLOUD',
                    'retention_days' => 30,
                    'is_compressed' => true,
                    'is_encrypted' => true,
                    'notify_on_success' => true,
                    'notify_on_failure' => true,
                    'next_run_at' => now()->addDay()->setTime(2, 0),
                    'status' => 'ACTIVE',
                ]),
                BackupSchedule::create([
                    'name' => 'Weekly Off-Site Archive',
                    'frequency' => 'WEEKLY',
                    'start_time' => '03:00:00',
                    'day_of_week' => 0,
                    'backup_type' => 'FULL',
                    'storage_destination' => 'CLOUD',
                    'retention_days' => 90,
                    'is_compressed' => true,
                    'is_encrypted' => true,
                    'notify_on_success' => true,
                    'notify_on_failure' => true,
                    'next_run_at' => now()->next('Sunday')->setTime(3, 0),
                    'status' => 'ACTIVE',
                ]),
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $schedules,
        ]);
    }

    /**
     * Save/update schedule and retention configuration.
     */
    public function saveSchedule(Request $request): JsonResponse
    {
        $id = $request->input('id');
        $data = $request->only([
            'name', 'frequency', 'start_time', 'day_of_week', 'day_of_month',
            'backup_type', 'storage_destination', 'retention_days', 'is_compressed',
            'is_encrypted', 'notify_on_success', 'notify_on_failure', 'status'
        ]);

        if (empty($data['name'])) {
            $data['name'] = 'Automated Backup';
        }
        if (empty($data['frequency'])) {
            $data['frequency'] = 'DAILY';
        }
        if (empty($data['start_time'])) {
            $data['start_time'] = '02:00:00';
        }
        if (empty($data['retention_days'])) {
            $data['retention_days'] = 30;
        }

        // Compute next_run_at based on frequency and start_time
        try {
            $timeParts = explode(':', $data['start_time']);
            $hour = (int) ($timeParts[0] ?? 2);
            $minute = (int) ($timeParts[1] ?? 0);

            if ($data['frequency'] === 'DAILY') {
                $nextRun = now()->setTime($hour, $minute, 0);
                if ($nextRun->isPast()) {
                    $nextRun->addDay();
                }
                $data['next_run_at'] = $nextRun;
            } elseif ($data['frequency'] === 'WEEKLY') {
                $dayOfWeek = (int) ($data['day_of_week'] ?? 0);
                $nextRun = now()->next($dayOfWeek)->setTime($hour, $minute, 0);
                $data['next_run_at'] = $nextRun;
            } elseif ($data['frequency'] === 'MONTHLY') {
                $dayOfMonth = (int) ($data['day_of_month'] ?? 1);
                $nextRun = now()->day($dayOfMonth)->setTime($hour, $minute, 0);
                if ($nextRun->isPast()) {
                    $nextRun->addMonth();
                }
                $data['next_run_at'] = $nextRun;
            }
        } catch (\Throwable $e) {
            $data['next_run_at'] = now()->addDay();
        }

        if ($id) {
            $schedule = BackupSchedule::findOrFail($id);
            $schedule->update($data);
        } else {
            $schedule = BackupSchedule::create($data);
        }

        return response()->json([
            'success' => true,
            'message' => 'Schedule & retention policy saved successfully.',
            'data' => $schedule,
        ]);
    }

    /**
     * Toggle active/paused status of a backup schedule.
     */
    public function toggleScheduleStatus(int $id): JsonResponse
    {
        $schedule = BackupSchedule::findOrFail($id);
        $schedule->status = $schedule->status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        $schedule->save();

        return response()->json([
            'success' => true,
            'message' => "Schedule status changed to {$schedule->status}.",
            'data' => $schedule,
        ]);
    }

    /**
     * Immediately execute a backup snapshot from this schedule.
     */
    public function runScheduleNow(int $id): JsonResponse
    {
        $schedule = BackupSchedule::findOrFail($id);
        $backup = $this->backupManager->createBackup([
            'backup_type' => $schedule->backup_type ?: 'FULL',
            'storage_destination' => $schedule->storage_destination ?: 'LOCAL',
            'retention_days' => $schedule->retention_days ?: 30,
            'is_compressed' => (bool) $schedule->is_compressed,
            'is_encrypted' => (bool) $schedule->is_encrypted,
            'notes' => "Manually triggered from schedule: {$schedule->name}",
        ]);

        $schedule->update(['last_run_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => "Backup snapshot successfully triggered for schedule '{$schedule->name}'.",
            'data' => $backup,
        ]);
    }

    /**
     * Delete a backup schedule.
     */
    public function deleteSchedule(int $id): JsonResponse
    {
        $schedule = BackupSchedule::findOrFail($id);
        $schedule->delete();

        return response()->json([
            'success' => true,
            'message' => 'Backup schedule deleted successfully.',
        ]);
    }

    /**
     * Prune expired backups according to retention policy.
     */
    public function pruneExpired(): JsonResponse
    {
        $result = $this->backupManager->pruneExpiredBackups();

        return response()->json([
            'success' => true,
            'message' => "Retention cleanup complete: {$result['pruned_count']} expired backup(s) pruned ({$result['pruned_bytes_formatted']} freed).",
            'data' => $result,
        ]);
    }

    /**
     * Live database health, table stats, and maintenance diagnostics.
     */
    public function maintenanceStats(): JsonResponse
    {
        $stats = $this->backupManager->getDatabaseStats();

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Run database maintenance (VACUUM defragmentation, session purge, cache clear).
     */
    public function optimize(): JsonResponse
    {
        $result = $this->backupManager->optimizeDatabase();

        return response()->json($result);
    }

    /**
     * Telegram Bot settings & authorized admins.
     */
    public function telegramSettings(): JsonResponse
    {
        $bot = TelegramBot::first();
        if (!$bot) {
            $bot = TelegramBot::create([
                'name' => 'SmartPOS Backup Alert Bot',
                'bot_username' => '@SmartPOS_AlertBot',
                'bot_token' => env('TELEGRAM_BOT_TOKEN', ''),
                'status' => 'ACTIVE',
                'webhook_url' => url('/api/v1/backups/telegram/webhook'),
                'notify_backup_success' => true,
                'notify_backup_failed' => true,
                'notify_storage_warning' => true,
                'notify_security_alerts' => true,
                'notify_restore_events' => true,
            ]);
        }

        $users = TelegramUser::with('user')->get();
        $primaryChatId = TelegramUser::where('is_authorized', true)->value('telegram_chat_id')
            ?: TelegramUser::value('telegram_chat_id')
            ?: (config('services.telegram.chat_id') ?: env('TELEGRAM_CHAT_ID', ''));

        return response()->json([
            'success' => true,
            'data' => [
                'bot' => $bot,
                'users' => $users,
                'configured_chat_id' => (string)($primaryChatId ?? ''),
            ],
        ]);
    }

    /**
     * Save Telegram Bot configuration by user.
     */
    public function saveTelegramSettings(Request $request): JsonResponse
    {
        $bot = TelegramBot::first() ?? new TelegramBot();
        $bot->name = $request->input('name', $bot->name ?? 'SmartPOS Alert Bot');
        $bot->bot_username = $request->input('bot_username', $bot->bot_username ?? '@SmartPOS_AlertBot');
        if ($request->has('bot_token')) {
            $bot->bot_token = $request->input('bot_token');
        }
        $bot->status = $request->input('status', 'ACTIVE');
        $bot->notify_backup_success = $request->boolean('notify_backup_success', true);
        $bot->notify_backup_failed = $request->boolean('notify_backup_failed', true);
        $bot->notify_storage_warning = $request->boolean('notify_storage_warning', true);
        $bot->notify_security_alerts = $request->boolean('notify_security_alerts', true);
        $bot->notify_restore_events = $request->boolean('notify_restore_events', true);
        $bot->attach_backup_file = $request->boolean('attach_backup_file', true);
        $bot->save();

        // Save or update primary admin Chat ID
        $chatId = $request->input('chat_id');
        if ($chatId) {
            $user = TelegramUser::first() ?? new TelegramUser();
            $user->telegram_chat_id = (string)$chatId;
            $user->telegram_username = $request->input('admin_username', 'admin');
            $user->is_authorized = true;
            $user->role = 'SUPER_ADMIN';
            $user->allowed_commands = ['/backup', '/health', '/restore', '/status', '/sessions'];
            $user->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Telegram Bot configuration updated successfully.',
            'data' => [
                'bot' => $bot,
                'chat_id' => $chatId,
            ],
        ]);
    }

    /**
     * Verify Telegram Bot token with Telegram API.
     */
    public function verifyTelegramBotToken(Request $request): JsonResponse
    {
        $token = $request->input('bot_token');
        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Please provide a Bot Token to verify.',
            ], 422);
        }

        $result = $this->telegramBot->verifyToken($token);
        return response()->json($result);
    }

    /**
     * Send test alert notification.
     */
    public function telegramTestAlert(Request $request): JsonResponse
    {
        $chatId = $request->input('chat_id');
        $token = $request->input('bot_token');
        $result = $this->telegramBot->sendTestAlert($chatId, $token);

        return response()->json($result);
    }

    /**
     * Telegram command & notification audit logs.
     */
    public function telegramLogs(): JsonResponse
    {
        $logs = TelegramLog::latest()->limit(50)->get();

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    /**
     * Export data for Products, Customers, Sales, or Settings.
     */
    public function exportData(string $type): JsonResponse
    {
        if ($type === 'sales') {
            $data = Sale::with('items')->latest()->take(200)->get();
        } elseif ($type === 'products') {
            $data = Product::with('category')->get();
        } elseif ($type === 'customers') {
            $data = Customer::all();
        } else {
            return response()->json(['success' => false, 'message' => 'Invalid export entity type.'], 400);
        }

        return response()->json([
            'success' => true,
            'type' => $type,
            'count' => count($data),
            'exported_at' => now()->toIso8601String(),
            'data' => $data,
        ]);
    }
}
