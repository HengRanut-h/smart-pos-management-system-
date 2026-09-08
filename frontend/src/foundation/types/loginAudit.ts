export interface UserLoginAuditItem {
  id: number;
  user_id?: number | null;
  username: string;
  session_id?: string | null;
  event_type: 'LOGIN' | 'LOGOUT' | 'LOCK' | 'UNLOCK' | 'PASSWORD_RESET' | '2FA';
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'SUSPICIOUS';
  ip_address: string;
  user_agent?: string;
  device_type: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'UNKNOWN';
  browser?: string;
  operating_system?: string;
  country?: string;
  city?: string;
  authentication_method: 'PASSWORD' | 'PIN' | 'OTP' | 'BIOMETRIC' | 'GOOGLE' | 'TELEGRAM';
  failure_reason?: string | null;
  is_suspicious: boolean;
  remember_me: boolean;
  two_factor_verified: boolean;
  login_at?: string | null;
  logout_at?: string | null;
  last_activity_at?: string | null;
  logout_reason?: string | null;
  created_at: string;
  user?: {
    id: number;
    username: string;
    email: string;
    phone?: string;
    employee?: {
      id: number;
      first_name: string;
      last_name: string;
      avatar_url?: string;
      branch?: {
        id: number;
        name: string;
      };
    };
    roles?: Array<{ id: number; name: string; code: string }>;
  };
}

export interface LoginAuditStats {
  total_logins: number;
  successful_logins: number;
  failed_attempts: number;
  suspicious_logins: number;
  active_sessions: number;
  success_rate: number;
  today_total: number;
  today_failed: number;
}

export interface LoginAuditFilterParams {
  page?: number;
  per_page?: number;
  status?: string;
  event_type?: string;
  device_type?: string;
  auth_method?: string;
  suspicious_only?: boolean;
  active_sessions_only?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
}
