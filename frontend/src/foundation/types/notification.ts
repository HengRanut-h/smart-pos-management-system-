export type NotificationType = 'success' | 'information' | 'warning' | 'error' | 'critical';

export interface NotificationTypeRule {
  auto_close: boolean;
  duration: number | null; // Milliseconds, or null for manual only
  progress_bar: boolean;
}

export interface NotificationPolicyConfig {
  success: NotificationTypeRule;
  information: NotificationTypeRule;
  warning: NotificationTypeRule;
  error: NotificationTypeRule;
  critical: NotificationTypeRule;
}

export interface NotificationAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  auto_close: boolean;
  duration: number | null;
  progress_bar: boolean;
  timestamp: Date;
  action?: NotificationAction;
}

export interface NotifyOptions {
  title?: string;
  duration?: number | null;
  auto_close?: boolean;
  progress_bar?: boolean;
  action?: NotificationAction;
}

export const DEFAULT_NOTIFICATION_POLICY: NotificationPolicyConfig = {
  success: {
    auto_close: true,
    duration: 4000,
    progress_bar: true,
  },
  information: {
    auto_close: true,
    duration: 5000,
    progress_bar: true,
  },
  warning: {
    auto_close: true,
    duration: 7000,
    progress_bar: true,
  },
  error: {
    auto_close: true,
    duration: 8000,
    progress_bar: true,
  },
  critical: {
    auto_close: false,
    duration: null,
    progress_bar: false,
  },
};
