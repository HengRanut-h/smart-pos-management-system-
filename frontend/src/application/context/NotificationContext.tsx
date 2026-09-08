import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  NotificationItem,
  NotificationPolicyConfig,
  NotificationType,
  NotifyOptions,
  DEFAULT_NOTIFICATION_POLICY,
} from '../../foundation/types/notification';
import { updateSystemSettingsDetailed } from '../../data-access/posApi';

export interface NotificationMethods {
  success: (message: string, options?: NotifyOptions | string) => string;
  info: (message: string, options?: NotifyOptions | string) => string;
  warning: (message: string, options?: NotifyOptions | string) => string;
  error: (message: string, options?: NotifyOptions | string) => string;
  critical: (message: string, options?: NotifyOptions | string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  policyConfig: NotificationPolicyConfig;
  updatePolicyConfig: (newConfig: NotificationPolicyConfig) => Promise<void>;
  resetPolicyConfig: () => Promise<void>;
  notify: NotificationMethods;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const STORAGE_KEY = 'smartpos_notification_policy';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Load policy config from localStorage or defaults
  const [policyConfig, setPolicyConfig] = useState<NotificationPolicyConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_NOTIFICATION_POLICY,
          ...parsed,
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_NOTIFICATION_POLICY;
  });

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const addNotification = useCallback(
    (type: NotificationType, message: string, opts?: NotifyOptions | string): string => {
      const options: NotifyOptions = typeof opts === 'string' ? { title: opts } : opts || {};
      const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const rule = policyConfig[type] || DEFAULT_NOTIFICATION_POLICY[type];

      const auto_close = options.auto_close !== undefined ? options.auto_close : rule.auto_close;
      const duration = options.duration !== undefined ? options.duration : rule.duration;
      const progress_bar = options.progress_bar !== undefined ? options.progress_bar : rule.progress_bar;

      const newItem: NotificationItem = {
        id,
        type,
        title: options.title,
        message,
        auto_close,
        duration,
        progress_bar,
        timestamp: new Date(),
        action: options.action,
      };

      setNotifications((prev) => {
        // Limit max active visible toasts to 5, newest on top or bottom
        const updated = [...prev, newItem];
        if (updated.length > 5) {
          return updated.slice(updated.length - 5);
        }
        return updated;
      });

      return id;
    },
    [policyConfig]
  );

  const notify = useMemo<NotificationMethods>(
    () => ({
      success: (msg, opts) => addNotification('success', msg, opts),
      info: (msg, opts) => addNotification('information', msg, opts),
      warning: (msg, opts) => addNotification('warning', msg, opts),
      error: (msg, opts) => addNotification('error', msg, opts),
      critical: (msg, opts) => addNotification('critical', msg, opts),
      dismiss,
      dismissAll,
    }),
    [addNotification, dismiss, dismissAll]
  );

  const updatePolicyConfig = useCallback(async (newConfig: NotificationPolicyConfig) => {
    setPolicyConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      // Persist to backend system settings as well
      await updateSystemSettingsDetailed({
        notification_toast_config: JSON.stringify(newConfig),
      } as any);
    } catch (err) {
      console.error('Failed to persist notification policy config', err);
    }
  }, []);

  const resetPolicyConfig = useCallback(async () => {
    await updatePolicyConfig(DEFAULT_NOTIFICATION_POLICY);
  }, [updatePolicyConfig]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        policyConfig,
        updatePolicyConfig,
        resetPolicyConfig,
        notify,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
