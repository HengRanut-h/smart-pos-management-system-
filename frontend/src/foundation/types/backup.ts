export interface BackupRecordItem {
  id: number;
  backup_code: string;
  backup_type: 'FULL' | 'INCREMENTAL' | 'DIFFERENTIAL' | 'SETTINGS_ONLY' | 'DATABASE_UPLOADS';
  filename: string;
  file_path: string;
  size_bytes: number;
  size_formatted: string;
  checksum_sha256?: string;
  is_compressed: boolean;
  is_encrypted: boolean;
  is_verified: boolean;
  storage_destinations: string;
  status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS' | 'CORRUPTED';
  error_message?: string;
  duration_seconds: number;
  retention_days: number;
  expires_at?: string;
  created_by_type: string;
  metadata?: {
    database_type?: string;
    tables_count?: number;
    total_records?: number;
    compression?: string;
    encryption?: string;
    checksum_sha256?: string;
  };
  created_at: string;
  user?: {
    id: number;
    username: string;
  };
}

export interface BackupScheduleItem {
  id: number;
  name: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'PRE_MIGRATION';
  start_time: string;
  day_of_week?: number;
  day_of_month?: number;
  backup_type: string;
  storage_destination: string;
  retention_days: number;
  is_compressed: boolean;
  is_encrypted: boolean;
  notify_on_success: boolean;
  notify_on_failure: boolean;
  last_run_at?: string;
  next_run_at?: string;
  status: 'ACTIVE' | 'PAUSED';
}

export interface DatabaseHealthStats {
  engine: string;
  database_size_bytes: number;
  database_size_formatted: string;
  total_tables: number;
  total_records: number;
  table_breakdown: Record<string, number>;
  backup_storage: {
    total_files: number;
    total_bytes: number;
    total_formatted: string;
    storage_health: string;
  };
  last_optimized_at?: string;
}

export interface BackupDashboardData {
  total_backups: number;
  successful_backups: number;
  last_backup?: {
    code: string;
    filename: string;
    size: string;
    status: string;
    created_at: string;
  } | null;
  next_scheduled_run: string;
  database: DatabaseHealthStats;
  health_status: string;
  health_score: number;
  three_two_one_strategy: {
    primary_local: string;
    secondary_drive: string;
    cloud_offsite: string;
  };
}

export interface TelegramBotConfig {
  id: number;
  name: string;
  bot_username: string;
  bot_token?: string;
  status: 'ACTIVE' | 'INACTIVE';
  webhook_url?: string;
  notify_backup_success: boolean;
  notify_backup_failed: boolean;
  notify_storage_warning: boolean;
  notify_security_alerts: boolean;
  notify_restore_events: boolean;
  attach_backup_file?: boolean;
}

export interface TelegramUserItem {
  id: number;
  telegram_chat_id: string;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  is_authorized: boolean;
  role: string;
  allowed_commands?: string[];
}

export interface TelegramLogItem {
  id: number;
  telegram_chat_id?: string;
  telegram_username?: string;
  command?: string;
  action: string;
  status: string;
  response_text?: string;
  created_at: string;
}
