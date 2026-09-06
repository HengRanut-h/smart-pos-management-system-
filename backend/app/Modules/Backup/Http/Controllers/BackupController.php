<?php

namespace App\Modules\Backup\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Sales\Persistence\Models\Sale;
use App\Modules\Product\Persistence\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class BackupController extends Controller
{
    public function status(): JsonResponse
    {
        $backupDir = storage_path('backups');
        if (!File::exists($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        $files = File::files($backupDir);
        $backups = [];
        foreach ($files as $file) {
            $backups[] = [
                'filename' => $file->getFilename(),
                'size_kb' => round($file->getSize() / 1024, 2),
                'created_at' => date('Y-m-d H:i:s', $file->getMTime()),
            ];
        }

        $dbPath = database_path('database.sqlite');
        $dbSizeKb = File::exists($dbPath) ? round(File::size($dbPath) / 1024, 2) : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'database_type' => 'SQLite (Production Store Ledger)',
                'database_size_kb' => $dbSizeKb,
                'backup_directory' => $backupDir,
                'total_backups' => count($backups),
                'backups' => array_reverse($backups),
                'system_status' => 'HEALTHY',
                'auto_backup_enabled' => true,
                'last_backup' => count($backups) > 0 ? end($backups)['created_at'] : null,
            ],
        ]);
    }

    public function create(): JsonResponse
    {
        $backupDir = storage_path('backups');
        if (!File::exists($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        $timestamp = date('Y-m-d_His');
        $filename = "smartpos_backup_{$timestamp}.sqlite";
        $dest = $backupDir . DIRECTORY_SEPARATOR . $filename;

        $dbPath = database_path('database.sqlite');
        if (File::exists($dbPath)) {
            File::copy($dbPath, $dest);
        }

        return response()->json([
            'success' => true,
            'message' => 'Database snapshot created successfully',
            'data' => [
                'filename' => $filename,
                'size_kb' => round(File::size($dest) / 1024, 2),
                'created_at' => date('Y-m-d H:i:s'),
            ],
        ]);
    }

    public function export(string $type): JsonResponse
    {
        if ($type === 'sales') {
            $data = Sale::with('items')->latest()->take(100)->get();
        } elseif ($type === 'products') {
            $data = Product::with('category')->get();
        } else {
            return response()->json(['success' => false, 'message' => 'Invalid export type'], 400);
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
