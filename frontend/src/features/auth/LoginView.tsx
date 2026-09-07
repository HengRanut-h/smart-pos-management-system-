import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../application/context/AppContext';
import { SmartPosLogo } from '../../presentation/components/SmartPosLogo';
import { OtpVerificationModal } from '../../presentation/components/OtpVerificationModal';
import {
  loginApi,
  registerApi,
  forgotPasswordApi,
  resetPasswordApi,
  sendOtpApi,
  verifyOtpApi,
  verifyRegistrationOtpApi,
  resendRegistrationOtpApi,
  verifyResetOtpApi,
  resendResetOtpApi,
  oauthLoginApi,
} from '../../data-access/posApi';
import { UserProfile } from '../../foundation/types';
import {
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  Globe,
  AlertCircle,
  CheckCircle2,
  Mail,
  UserPlus,
  ArrowLeft,
  Phone,
  Briefcase,
  Send,
  RotateCcw,
  Clock,
  Key,
  X,
  Check,
  Smartphone,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { lang, setLang, loginUser, setActiveTab, storeSettings } = useApp();

  // Navigation View State: 'login' | 'register' | 'forgot' | 'reset_password'
  const [viewState, setViewState] = useState<'login' | 'register' | 'forgot' | 'reset_password'>('login');
  
  // Login Sub-mode: 'password' | 'phone' | 'pin'
  const [loginMode, setLoginMode] = useState<'password' | 'phone' | 'pin'>('password');

  // Form State - Login Password
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form State - Phone Login
  const [loginPhone, setLoginPhone] = useState('');

  // Form State - Quick PIN Login
  const [pin, setPin] = useState('');

  // Form State - Register
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regChannel, setRegChannel] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAcceptTerms, setRegAcceptTerms] = useState(true);

  // Form State - Forgot Password & Reset Token
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // --- Real OTP Modal State ---
  const [otpModal, setOtpModal] = useState<{
    isOpen: boolean;
    type: 'register' | 'forgot_password' | 'phone_login';
    identifier: string;
    code: string;
  } | null>(null);

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState<number>(180);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Global UI Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // OTP Countdown Timer Tick
  useEffect(() => {
    let timer: any;
    if (otpModal?.isOpen && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpModal?.isOpen, otpCountdown]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setErrorMsg('');

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // --- Helper to Build UserProfile and Login with strict Role-based Routing ---
  const buildUserProfileAndLogin = (user: any) => {
    const roleCodes = user.roles?.map((r: any) => r.code?.toUpperCase()) || [];
    const hasStaffRole = roleCodes.some((code: string) =>
      ['ADMIN', 'SUPER_ADMIN', 'MANAGER', 'CASHIER', 'STOCK_MANAGER', 'ACCOUNTANT', 'HR', 'EMPLOYEE'].includes(code)
    );
    const isCust = !hasStaffRole && (roleCodes.includes('CUSTOMER') || user.registration_source === 'public' || !!user.customer);

    const firstName = user.employee?.first_name
      || (user.customer?.name ? user.customer.name.split(' ')[0] : user.username);
    const lastName = user.employee?.last_name
      || (user.customer?.name && user.customer.name.includes(' ') ? user.customer.name.split(' ').slice(1).join(' ') : '');
    const fullName = user.employee
      ? `${user.employee.first_name} ${user.employee.last_name}`.trim()
      : (user.customer?.name || user.username);

    const defaultCustomerRole = [{ id: 9, name: 'Customer', code: 'CUSTOMER' }];
    const defaultStaffRole = [{ id: 4, name: 'Cashier', code: 'CASHIER' }];

    const profile: UserProfile = {
      id: user.id,
      username: user.username,
      email: user.email || `${user.username}@smartpos.com`,
      phone: user.phone,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      employee_code: user.employee?.employee_code || user.customer?.customer_code || (isCust ? `CUST-${user.id}` : `EMP-${user.id}`),
      branch: user.employee?.branch || { id: 1, name: 'Phnom Penh Headquarters', code: 'HQ-01', address: 'Monivong Blvd, Phnom Penh' },
      roles: user.roles && user.roles.length > 0 ? user.roles : (isCust ? defaultCustomerRole : defaultStaffRole),
      primary_role: user.roles?.[0]?.name || (isCust ? 'Customer' : 'Staff Member'),
      permissions: user.roles?.[0]?.permissions?.map((p: any) => p.code) || (isCust ? ['customer.portal', 'order.view_own', 'invoice.view_own'] : ['ALL_PERMISSIONS']),
      status: 'ACTIVE',
    };

    loginUser(profile);
    setActiveTab(isCust ? 'dashboard' : 'pos');
  };

  // --- Check for Real OAuth Callback / Session in URL ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauth = urlParams.get('oauth');
    const token = urlParams.get('token');
    const code = urlParams.get('code');
    const oauthError = urlParams.get('error');

    if (oauthError) {
      setErrorMsg(decodeURIComponent(oauthError));
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (oauth) {
      setIsSubmitting(true);
      setSuccessMsg(lang === 'kh' ? 'កំពុងផ្ទៀងផ្ទាត់គណនី...' : 'Verifying authenticated session...');

      fetch('/api/v1/user/profile', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setSuccessMsg(lang === 'kh' ? 'ចូលប្រព័ន្ធបានជោគជ័យ!' : 'Logged in successfully!');
            buildUserProfileAndLogin(data.data);
          } else {
            setErrorMsg('Failed to initialize session profile.');
          }
        })
        .catch((err) => {
          setErrorMsg('Authentication error: ' + err.message);
        })
        .finally(() => {
          setIsSubmitting(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    } else if (code) {
      setIsSubmitting(true);
      setSuccessMsg(lang === 'kh' ? 'កំពុងផ្ទៀងផ្ទាត់ជាមួយ Google...' : 'Exchanging Google authorization code...');
      const currentRedirect = window.location.origin + window.location.pathname;

      fetch('/api/v1/auth/google/callback', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          code,
          redirect_uri: currentRedirect,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.user) {
            setSuccessMsg(lang === 'kh' ? 'ចូលប្រព័ន្ធជាមួយ Google បានជោគជ័យ!' : 'Logged in successfully with Google!');
            buildUserProfileAndLogin(data.data.user);
          } else {
            setErrorMsg(data.message || 'Google authorization failed.');
          }
        })
        .catch((err) => {
          setErrorMsg('Google login error: ' + err.message);
        })
        .finally(() => {
          setIsSubmitting(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    } else if (token) {
      setIsSubmitting(true);
      setSuccessMsg(lang === 'kh' ? 'កំពុងទាញយកព័ត៌មានគណនី...' : 'Authenticated successfully! Loading profile...');

      fetch('/api/v1/auth/me', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setSuccessMsg(lang === 'kh' ? 'ចូលប្រព័ន្ធបានជោគជ័យ!' : 'Logged in successfully!');
            buildUserProfileAndLogin(data.data);
          } else {
            setErrorMsg('Failed to initialize session profile.');
          }
        })
        .catch((err) => {
          setErrorMsg('Authentication error: ' + err.message);
        })
        .finally(() => {
          setIsSubmitting(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, []);

  // --- 1. Password Login Handler (Real Database Authentication) ---
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg(lang === 'kh' ? 'សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ និងពាក្យសម្ងាត់' : 'Please enter username and password');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await loginApi({ username, password });
      if (res.success && res.data?.user) {
        setSuccessMsg(lang === 'kh' ? 'ចូលប្រព័ន្ធបានជោគជ័យ!' : 'Login successful! Redirecting...');
        setTimeout(() => {
          buildUserProfileAndLogin(res.data.user);
        }, 400);
        return;
      }
    } catch (err: any) {
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.errors?.username?.[0] ||
        (lang === 'kh' ? 'ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ' : 'Invalid username or password');
      setErrorMsg(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 2. Phone OTP Login Trigger ---
  const handleInitiatePhoneLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone) {
      setErrorMsg(lang === 'kh' ? 'សូមបញ្ចូលលេខទូរស័ព្ទដៃ' : 'Please enter your mobile phone number');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await sendOtpApi({
        purpose: 'PHONE_LOGIN',
        destination: loginPhone,
        channel: 'SMS',
      });

      setOtpDigits(['', '', '', '', '', '']);
      setOtpCountdown(180);
      setOtpModal({
        isOpen: true,
        type: 'phone_login',
        identifier: loginPhone,
        code: res.otp_code || '',
      });
      setSuccessMsg(lang === 'kh' ? `កូដ OTP ត្រូវបានផ្ញើទៅកាន់ ${loginPhone}` : `OTP code sent to phone ${loginPhone}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || (lang === 'kh' ? 'លេខទូរស័ព្ទនេះមិនទាន់បានចុះឈ្មោះក្នុងប្រព័ន្ធទេ' : 'No account associated with this phone number. Please register first.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 3. PIN Login Handler ---
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const requiredLength = storeSettings?.security_pin_length || 4;
    const masterPin = storeSettings?.master_security_pin || '1234';

    if (!pin || pin.length < requiredLength) {
      setErrorMsg(
        lang === 'kh'
          ? `សូមបញ្ចូលកូដ PIN ឲ្យគ្រប់ ${requiredLength} ខ្ទង់`
          : `Please enter full ${requiredLength}-digit PIN`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    setTimeout(() => {
      if (pin === masterPin) {
        const stationUser: UserProfile = {
          id: 1,
          username: 'cashier_terminal',
          email: 'terminal@smartpos.com',
          phone: '+855 12 345 678',
          first_name: 'POS',
          last_name: 'Cashier',
          full_name: 'Cashier Terminal',
          employee_code: 'POS-TERM',
          branch: { id: 1, name: 'Phnom Penh Headquarters', code: 'HQ-01', address: 'Monivong Blvd, Phnom Penh' },
          roles: [{ id: 3, name: 'Cashier', code: 'CASHIER' }],
          primary_role: 'Cashier',
          permissions: ['pos.view', 'sales.create'],
          status: 'ACTIVE',
        };
        setSuccessMsg(lang === 'kh' ? 'ផ្ទៀងផ្ទាត់ PIN ជោគជ័យ!' : 'PIN verified successfully!');
        setTimeout(() => {
          loginUser(stationUser);
          setActiveTab('pos');
          setIsSubmitting(false);
        }, 400);
      } else {
        setErrorMsg(lang === 'kh' ? 'កូដ PIN មិនត្រឹមត្រូវទេ' : 'Invalid security PIN');
        setIsSubmitting(false);
      }
    }, 300);
  };

  // --- 4. Real OAuth2 (Google & Telegram) Handler ---
  const handleOauthLogin = async (provider: 'google' | 'telegram') => {
    setIsSubmitting(true);
    setErrorMsg('');
    const providerTitle = provider === 'google' ? 'Google' : 'Telegram';
    setSuccessMsg(lang === 'kh' ? `កំពុងភ្ជាប់ទៅកាន់ ${providerTitle}...` : `Connecting to ${providerTitle}...`);

    try {
      if (provider === 'google') {
        const res = await fetch('/api/v1/auth/google', {
          headers: { Accept: 'application/json' },
        }).then((r) => r.json());

        if (res.success && res.auth_url) {
          window.location.href = res.auth_url;
          return;
        }
        throw new Error(res.message || 'Failed to obtain Google login URL');
      } else if (provider === 'telegram') {
        const res = await fetch('/api/v1/auth/telegram/bot-info', {
          headers: { Accept: 'application/json' },
        }).then((r) => r.json());

        if (res.success && res.auth_url) {
          window.location.href = res.auth_url;
          return;
        }
        throw new Error(res.message || 'Failed to obtain Telegram login URL');
      }
    } catch (err: any) {
      setErrorMsg(err.message || (lang === 'kh' ? 'ការភ្ជាប់បានបរាជ័យ' : 'Connection failed'));
      setIsSubmitting(false);
    }
  };

  // --- 5. Register Account & Trigger OTP ---
  const handleInitiateRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFirstName || !regLastName || !regUsername || !regEmail || !regPassword) {
      setErrorMsg(lang === 'kh' ? 'សូមបញ្ចូលព័ត៌មានដែលតម្រូវទាំងអស់' : 'Please fill in all required fields');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg(lang === 'kh' ? 'ពាក្យសម្ងាត់ទាំងពីរមិនដូចគ្នាទេ' : 'Passwords do not match');
      return;
    }

    if (!regAcceptTerms) {
      setErrorMsg(lang === 'kh' ? 'សូមយល់ព្រមតាមលក្ខខណ្ឌប្រើប្រាស់' : 'Please accept terms and conditions');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const targetDestination = regChannel === 'SMS' && regPhone.trim() ? regPhone.trim() : regEmail.trim();

      const regRes = await registerApi({
        username: regUsername,
        email: regEmail,
        password: regPassword,
        confirm_password: regConfirmPassword,
        first_name: regFirstName,
        last_name: regLastName,
        phone: regPhone,
        channel: regChannel,
        accept_terms: regAcceptTerms,
      });

      const otpCode = regRes.otp_code || '';
      setOtpModal({
        isOpen: true,
        type: 'register',
        identifier: targetDestination,
        code: otpCode,
      });
      setSuccessMsg(lang === 'kh' ? `កូដ OTP ត្រូវបានផ្ញើទៅកាន់ ${targetDestination}` : `Real OTP code sent to ${targetDestination}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || (lang === 'kh' ? 'ការចុះឈ្មោះបរាជ័យ' : 'Registration failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 6. Forgot Password & Trigger OTP ---
  const handleInitiateForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setErrorMsg(lang === 'kh' ? 'សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែល ឬលេខទូរស័ព្ទ' : 'Please enter your email or phone number');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await forgotPasswordApi(forgotEmail);
      const otpCode = res.otp_code || '';

      setOtpModal({
        isOpen: true,
        type: 'forgot_password',
        identifier: forgotEmail,
        code: otpCode,
      });
      setSuccessMsg(lang === 'kh' ? `កូដ OTP ត្រូវបានផ្ញើទៅកាន់ ${forgotEmail}` : `OTP verification code sent to ${forgotEmail}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || (lang === 'kh' ? 'បរាជ័យក្នុងការផ្ញើកូដ OTP' : 'Failed to send OTP code'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 7. Modal OTP Verification Handler ---
  const handleModalVerify = async (otpCode: string, selectedChannel: 'EMAIL' | 'SMS') => {
    if (!otpModal) return;

    if (otpModal.type === 'register') {
      await verifyRegistrationOtpApi({
        identifier: otpModal.identifier,
        otp_code: otpCode,
      });
      setOtpModal(null);
      setViewState('login');
      setUsername(regUsername);
      setPassword(regPassword);
      setSuccessMsg(lang === 'kh' ? 'ផ្ទៀងផ្ទាត់ OTP បានជោគជ័យ! គណនីរបស់អ្នកដំណើរការហើយ សូមចូលប្រព័ន្ធ' : 'Account activated successfully! Please sign in.');
    } else if (otpModal.type === 'forgot_password') {
      const res = await verifyResetOtpApi({
        identifier: otpModal.identifier,
        otp_code: otpCode,
      });
      setOtpModal(null);
      setResetToken(res.reset_token);
      setViewState('reset_password');
      setSuccessMsg(lang === 'kh' ? 'ផ្ទៀងផ្ទាត់ OTP បានជោគជ័យ! សូមបង្កើតពាក្យសម្ងាត់ថ្មី' : 'OTP verified successfully! Please enter your new password.');
    } else if (otpModal.type === 'phone_login') {
      const verifyRes = await verifyOtpApi({
        destination: otpModal.identifier,
        purpose: 'PHONE_LOGIN',
        otp: otpCode,
      });

      if (verifyRes.success && verifyRes.user) {
        setOtpModal(null);
        setSuccessMsg(lang === 'kh' ? 'ចូលប្រព័ន្ធបានជោគជ័យ!' : 'Signed in successfully with Phone OTP!');
        setTimeout(() => {
          buildUserProfileAndLogin(verifyRes.user);
        }, 400);
      } else {
        throw new Error(verifyRes.message || 'OTP verification failed');
      }
    }
  };

  // --- 8. Modal OTP Resend Handler ---
  const handleModalResend = async (selectedChannel: 'EMAIL' | 'SMS') => {
    if (!otpModal) return;

    if (otpModal.type === 'register') {
      const res = await resendRegistrationOtpApi({
        identifier: otpModal.identifier,
        channel: selectedChannel,
      });
      return res.otp_code;
    } else {
      const res = await resendResetOtpApi({
        identifier: otpModal.identifier,
        channel: selectedChannel,
      });
      return res.otp_code;
    }
  };

  // --- 9. Reset Password Submit with Validated Token ---
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) {
      setErrorMsg(lang === 'kh' ? 'សូមបញ្ចូល និងផ្ទៀងផ្ទាត់ពាក្យសម្ងាត់ថ្មី' : 'Please enter and confirm your new password');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg(lang === 'kh' ? 'ពាក្យសម្ងាត់ទាំងពីរមិនដូចគ្នាទេ' : 'Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await resetPasswordApi({
        email: forgotEmail,
        reset_token: resetToken,
        new_password: newPassword,
        confirm_password: confirmNewPassword,
      });

      setSuccessMsg(lang === 'kh' ? 'ប្តូរពាក្យសម្ងាត់បានជោគជ័យ! សូមចូលប្រព័ន្ធជាមួយពាក្យសម្ងាត់ថ្មី' : 'Password reset successfully! Please sign in with your new password.');
      setTimeout(() => {
        setViewState('login');
        setUsername(forgotEmail);
        setPassword(newPassword);
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || (lang === 'kh' ? 'បរាជ័យក្នុងការប្តូរពាក្យសម្ងាត់' : 'Password reset failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePinKeyPress = (num: string) => {
    const maxLen = storeSettings?.security_pin_length || 4;
    if (pin.length < maxLen) {
      setPin((prev) => prev + num);
      setErrorMsg('');
    }
  };

  const handlePinClear = () => {
    setPin('');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Background Ambient Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-teal-600/20 blur-[120px] pointer-events-none" />

      {/* Top Header Bar */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg flex items-center justify-between px-4 mb-4 z-10">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>SmartPOS Enterprise v2.5</span>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center bg-slate-800/90 border border-slate-700/80 p-1 rounded-xl shadow-xs">
          <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
          <button
            onClick={() => setLang('en')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              lang === 'en' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLang('kh')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              lang === 'kh' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            ខ្មែរ
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg z-10 px-4">
        <div className="bg-slate-800/85 backdrop-blur-xl border border-slate-700/80 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 space-y-6">
          
          {/* Logo Header - Centered & No Hover */}
          <div className="text-center space-y-3">
            <div className="flex justify-center text-center">
              <SmartPosLogo variant="full" size="xl" align="center" disableHover={true} isDarkTheme={true} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {viewState === 'login' && (lang === 'kh' ? 'ចូលប្រើប្រាស់ប្រព័ន្ធ POS' : 'Sign in to SmartPOS Terminal')}
                {viewState === 'register' && (lang === 'kh' ? 'ចុះឈ្មោះគណនីបុគ្គលិកថ្មី' : 'Create Staff Account')}
                {viewState === 'forgot' && (lang === 'kh' ? 'ស្វែងរក / ផ្លាស់ប្តូរពាក្យសម្ងាត់' : 'Reset Account Password')}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {storeSettings?.branch_code || 'HQ-01 PHNOM PENH'} &bull; {lang === 'kh' ? 'ស្ថានីយ៍បង់ប្រាក់ & គ្រប់គ្រងស្តុក' : 'Point of Sale & Store Portal'}
              </p>
            </div>
          </div>

          {/* Error & Success Banners */}
          {errorMsg && (
            <div className="bg-rose-950/80 border border-rose-800 text-rose-200 p-3.5 rounded-2xl flex items-center space-x-2.5 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-200 p-3.5 rounded-2xl flex items-center space-x-2.5 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* 1. LOGIN VIEW */}
          {/* ============================================================ */}
          {viewState === 'login' && (
            <div className="space-y-5">
              {/* Mode Switcher Tabs: Password vs Phone SMS vs Quick PIN */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/80 rounded-2xl border border-slate-700/50">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('password');
                    setErrorMsg('');
                  }}
                  className={`py-2 text-[11px] sm:text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                    loginMode === 'password'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Password</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('phone');
                    setErrorMsg('');
                  }}
                  className={`py-2 text-[11px] sm:text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                    loginMode === 'phone'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Phone OTP</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('pin');
                    setErrorMsg('');
                  }}
                  className={`py-2 text-[11px] sm:text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                    loginMode === 'pin'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Quick PIN</span>
                </button>
              </div>

              {loginMode === 'password' && (
                /* Password Form */
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      {lang === 'kh' ? 'ឈ្មោះអ្នកប្រើប្រាស់ / អ៊ីមែល' : 'Username or Email'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="admin or cashier@smartpos.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 text-white text-sm rounded-xl focus:outline-hidden focus:border-emerald-500 font-medium placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-300 uppercase">
                        {lang === 'kh' ? 'ពាក្យសម្ងាត់' : 'Password'}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setViewState('forgot');
                          setErrorMsg('');
                          setSuccessMsg('');
                        }}
                        className="text-xs font-bold text-emerald-400 hover:underline hover:text-emerald-300 transition"
                      >
                        {lang === 'kh' ? 'ភ្លេចពាក្យសម្ងាត់?' : 'Forgot password?'}
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 text-white text-sm rounded-xl focus:outline-hidden focus:border-emerald-500 font-medium placeholder-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition transform active:scale-98 flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>{lang === 'kh' ? 'ចូលប្រើប្រាស់ប្រព័ន្ធ' : 'Sign In to Terminal'}</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {loginMode === 'phone' && (
                /* Phone Number Login Form */
                <form onSubmit={handleInitiatePhoneLoginOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                      {lang === 'kh' ? 'លេខទូរស័ព្ទដៃ' : 'Mobile Phone Number'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Phone className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        placeholder="+855 12 345 678 or 012 345 678"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 text-white text-sm rounded-xl focus:outline-hidden focus:border-emerald-500 font-mono placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition transform active:scale-98 flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{lang === 'kh' ? 'ផ្ញើកូដ OTP ចូលប្រព័ន្ធ' : 'Send Phone OTP & Sign In'}</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {loginMode === 'pin' && (
                /* PIN Form */
                <form onSubmit={handlePinSubmit} className="space-y-4">
                  <div className="text-center">
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                      {lang === 'kh'
                        ? `បញ្ចូលកូដ PIN សម្ងាត់ ${storeSettings?.security_pin_length || 4} ខ្ទង់`
                        : `Enter Cashier ${storeSettings?.security_pin_length || 4}-Digit PIN`}
                    </label>
                    <div className="flex justify-center space-x-2 mb-4">
                      {Array.from({ length: storeSettings?.security_pin_length || 4 }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-10 h-12 rounded-xl border flex items-center justify-center text-xl font-black transition ${
                            pin.length > idx
                              ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                              : 'bg-slate-900/90 border-slate-700 text-slate-600'
                          }`}
                        >
                          {pin.length > idx ? '●' : ''}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handlePinKeyPress(num)}
                        className="py-3 bg-slate-900 hover:bg-slate-700 text-white font-bold text-lg rounded-xl border border-slate-700/80 transition active:scale-95 shadow-xs"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handlePinClear}
                      className="py-3 bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold text-xs rounded-xl border border-rose-800/80 transition active:scale-95"
                    >
                      CLEAR
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePinKeyPress('0')}
                      className="py-3 bg-slate-900 hover:bg-slate-700 text-white font-bold text-lg rounded-xl border border-slate-700/80 transition active:scale-95"
                    >
                      0
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || pin.length < (storeSettings?.security_pin_length || 4)}
                      className="py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl border border-emerald-500 transition active:scale-95"
                    >
                      OK
                    </button>
                  </div>
                </form>
              )}

              {/* Telegram, Google, and Phone Number Quick Options */}
              <div className="pt-3 border-t border-slate-700/80 space-y-3">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700/80" />
                  </div>
                  <div className="relative px-3 bg-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {lang === 'kh' ? 'ឬ ចូលប្រព័ន្ធតាមរយៈ:' : 'Or sign in with:'}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Google OAuth */}
                  <button
                    type="button"
                    onClick={() => handleOauthLogin('google')}
                    disabled={isSubmitting}
                    className="p-2.5 bg-slate-900/90 hover:bg-slate-700/90 border border-slate-700 rounded-xl text-xs font-bold text-white transition flex items-center justify-center space-x-2 shadow-xs group"
                    title="Sign in with Google Account"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z" />
                      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                      <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.4-.4-2.2s.2-1.5.4-2.2L1.6 7.4C.6 9.4 0 11.6 0 14s.6 4.6 1.6 6.6l3.7-2.9c-.2-.7-.4-1.5-.4-3z" />
                      <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z" />
                    </svg>
                    <span>Google</span>
                  </button>

                  {/* Telegram SSO */}
                  <button
                    type="button"
                    onClick={() => handleOauthLogin('telegram')}
                    disabled={isSubmitting}
                    className="p-2.5 bg-slate-900/90 hover:bg-slate-700/90 border border-slate-700 rounded-xl text-xs font-bold text-white transition flex items-center justify-center space-x-2 shadow-xs"
                    title="Sign in with Telegram"
                  >
                    <svg className="w-4 h-4 text-[#2AABEE] fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-2.02 9.51c-.15.68-.55.85-1.12.53l-3.08-2.27-1.49 1.43c-.16.16-.3.3-.61.3l.22-3.14 5.73-5.18c.25-.22-.05-.34-.39-.12l-7.08 4.46-3.04-.95c-.66-.21-.67-.66.14-.98l11.89-4.58c.55-.2 1.03.13.85.99z" />
                    </svg>
                    <span>Telegram</span>
                  </button>

                  {/* Phone Number Login Switcher */}
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('phone');
                      setErrorMsg('');
                    }}
                    disabled={isSubmitting}
                    className="p-2.5 bg-slate-900/90 hover:bg-slate-700/90 border border-slate-700 rounded-xl text-xs font-bold text-white transition flex items-center justify-center space-x-2 shadow-xs"
                    title="Sign in with Mobile Phone Number"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Phone</span>
                  </button>
                </div>
              </div>

              {/* Bottom Register Switch Footer */}
              <div className="pt-4 border-t border-slate-700/80 text-center">
                <p className="text-xs text-slate-400">
                  {lang === 'kh' ? 'មិនទាន់មានគណនីបុគ្គលិកមែនទេ?' : "Don't have an account yet?"}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setViewState('register');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition inline-flex items-center space-x-1"
                  >
                    <UserPlus className="w-3.5 h-3.5 ml-1" />
                    <span>{lang === 'kh' ? 'ចុះឈ្មោះបង្កើតគណនីថ្មី' : 'Register Account'}</span>
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 2. REGISTER VIEW */}
          {/* ============================================================ */}
          {viewState === 'register' && (
            <form onSubmit={handleInitiateRegisterOtp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {lang === 'kh' ? 'នាមត្រកូល (First Name)' : 'First Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    placeholder="Sok"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 text-white text-xs rounded-xl focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {lang === 'kh' ? 'នាមខ្លួន (Last Name)' : 'Last Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    placeholder="Dara"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 text-white text-xs rounded-xl focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  {lang === 'kh' ? 'ឈ្មោះអ្នកប្រើប្រាស់ (Username)' : 'Username'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="sokdara"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 text-white text-xs rounded-xl focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {lang === 'kh' ? 'អ៊ីមែល' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="user@smartpos.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 text-white text-xs rounded-xl focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {lang === 'kh' ? 'លេខទូរស័ព្ទ' : 'Mobile Phone'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+855 12 345 678"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 text-white text-xs rounded-xl focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  {lang === 'kh' ? 'វិធីសាស្ត្រទទួលកូដ OTP' : 'OTP Verification Channel'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegChannel('EMAIL')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                      regChannel === 'EMAIL'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-xs'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{lang === 'kh' ? 'តាមអ៊ីមែល' : 'Verify by Email'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegChannel('SMS')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-2 transition ${
                      regChannel === 'SMS'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-xs'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{lang === 'kh' ? 'តាមសារ SMS' : 'Verify by SMS'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {lang === 'kh' ? 'ពាក្យសម្ងាត់' : 'Password'}
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 text-white text-xs rounded-xl focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {lang === 'kh' ? 'បញ្ជាក់ពាក្យសម្ងាត់' : 'Confirm Password'}
                  </label>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 text-white text-xs rounded-xl focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Accept Terms & Conditions Checkbox */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={regAcceptTerms}
                  onChange={(e) => setRegAcceptTerms(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 bg-slate-900 border-slate-700 rounded-sm focus:ring-emerald-500"
                />
                <label htmlFor="acceptTerms" className="text-xs text-slate-300 select-none cursor-pointer">
                  {lang === 'kh' ? 'ខ្ញុំយល់ព្រមតាមលក្ខខណ្ឌប្រើប្រាស់ និងគោលការណ៍ឯកជនភាព' : 'I accept SmartPOS Terms of Service & Privacy Policy'}
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition transform active:scale-98 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{lang === 'kh' ? 'ផ្ញើកូដ OTP ផ្ទៀងផ្ទាត់' : 'Send OTP Code & Register'}</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setViewState('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-white transition flex items-center justify-center space-x-1 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{lang === 'kh' ? 'ត្រឡប់ទៅទំព័រចូលប្រព័ន្ធ' : 'Back to Sign In'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* 3. FORGOT PASSWORD VIEW */}
          {/* ============================================================ */}
          {viewState === 'forgot' && (
            <div className="space-y-4">
              <form onSubmit={handleInitiateForgotOtp} className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lang === 'kh'
                    ? 'សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែល ឬលេខទូរស័ព្ទរបស់អ្នកដើម្បីទទួលបានកូដ OTP 6 ខ្ទង់សម្រាប់ផ្ទៀងផ្ទាត់ និងប្តូរពាក្យសម្ងាត់។'
                    : 'Enter your registered email address or phone number to receive a 6-digit OTP code to reset your password.'}
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    {lang === 'kh' ? 'អាសយដ្ឋានអ៊ីមែល / លេខទូរស័ព្ទ' : 'Email Address or Phone'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="user@smartpos.com or +85512345678"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 text-white text-sm rounded-xl focus:outline-hidden focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition transform active:scale-98 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{lang === 'kh' ? 'ផ្ញើកូដ OTP ផ្ទៀងផ្ទាត់' : 'Send OTP Code & Verify'}</span>
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setViewState('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-white transition flex items-center justify-center space-x-1 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{lang === 'kh' ? 'ត្រឡប់ទៅទំព័រចូលប្រព័ន្ធ' : 'Back to Sign In'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 4. RESET PASSWORD VIEW (Requires Verified Reset Token) */}
          {/* ============================================================ */}
          {viewState === 'reset_password' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-2xl text-xs space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'kh' ? 'កូដ OTP បានផ្ទៀងផ្ទាត់ជោគជ័យ' : 'OTP Verified Successfully'}</span>
                </div>
                <p className="text-[11px] opacity-90">
                  {lang === 'kh'
                    ? 'សូមបញ្ចូលពាក្យសម្ងាត់ថ្មីរបស់អ្នកដើម្បីបញ្ចប់ការប្តូរពាក្យសម្ងាត់។'
                    : 'Issued short-lived reset token. Please enter and confirm your new account password.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  {lang === 'kh' ? 'ពាក្យសម្ងាត់ថ្មី' : 'New Password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 text-white text-sm rounded-xl focus:outline-hidden focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  {lang === 'kh' ? 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី' : 'Confirm New Password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 text-white text-sm rounded-xl focus:outline-hidden focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition transform active:scale-98 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{lang === 'kh' ? 'រក្សាទុកពាក្យសម្ងាត់ថ្មី' : 'Reset Password & Sign In'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* System Footer */}
          <div className="text-center pt-2 border-t border-slate-700/50">
            <span className="text-[10px] text-slate-500">
              SmartPOS Business Management System &bull; Secure OTP & Token Authentication
            </span>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* REUSABLE REAL OTP VERIFICATION OVERLAY MODAL */}
      {/* ============================================================ */}
      {otpModal && otpModal.isOpen && (
        <OtpVerificationModal
          isOpen={otpModal.isOpen}
          purpose={otpModal.type}
          identifier={otpModal.identifier}
          initialOtpCode={otpModal.code}
          onVerify={handleModalVerify}
          onResend={handleModalResend}
          onCancel={() => setOtpModal(null)}
          lang={lang}
        />
      )}

    </div>
  );
};
