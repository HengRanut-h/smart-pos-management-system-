import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Mail,
  MessageSquare,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
} from 'lucide-react';

interface OtpVerificationModalProps {
  isOpen: boolean;
  purpose: 'register' | 'forgot_password' | 'phone_login';
  identifier: string;
  initialChannel?: 'EMAIL' | 'SMS';
  initialOtpCode?: string;
  onVerify: (otpCode: string, channel: 'EMAIL' | 'SMS') => Promise<void>;
  onResend: (channel: 'EMAIL' | 'SMS') => Promise<string | void>;
  onCancel: () => void;
  lang?: 'en' | 'kh';
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  purpose,
  identifier,
  initialChannel = 'EMAIL',
  initialOtpCode = '',
  onVerify,
  onResend,
  onCancel,
  lang = 'en',
}) => {
  const [channel, setChannel] = useState<'EMAIL' | 'SMS'>(initialChannel);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState<number>(300);
  const [cooldown, setCooldown] = useState<number>(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [debugOtpCode, setDebugOtpCode] = useState(initialOtpCode);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update initial debug code if passed
  useEffect(() => {
    if (initialOtpCode) {
      setDebugOtpCode(initialOtpCode);
    }
  }, [initialOtpCode]);

  // Main countdown timer (5 mins)
  useEffect(() => {
    let timer: any;
    if (isOpen && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  // Resend cooldown timer (60s)
  useEffect(() => {
    let timer: any;
    if (isOpen && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, cooldown]);

  // Auto focus first input box when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setErrorMsg('');

    // Auto-focus next input box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pasted.length === 6) {
      const pasteDigits = pasted.split('');
      setDigits(pasteDigits);
      setErrorMsg('');
      inputRefs.current[5]?.focus();
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = digits.join('');
    if (fullOtp.length < 6) {
      setErrorMsg(
        lang === 'kh'
          ? 'សូមបញ្ចូលកូដ OTP 6 ខ្ទង់ឱ្យគ្រប់'
          : 'Please enter all 6 digits of the OTP code'
      );
      return;
    }

    if (countdown <= 0) {
      setErrorMsg(
        lang === 'kh'
          ? 'កូដ OTP ផុតកំណត់ហើយ! សូមចុច ផ្ញើកូដឡើងវិញ'
          : 'OTP code has expired! Please click Resend OTP.'
      );
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await onVerify(fullOtp, channel);
      setSuccessMsg(
        lang === 'kh' ? 'ផ្ទៀងផ្ទាត់ OTP បានជោគជ័យ!' : 'OTP Verified Successfully!'
      );
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          (lang === 'kh'
            ? 'កូដ OTP មិនត្រឹមត្រូវទេ! សូមពិនិត្យមើលម្ដងទៀត'
            : 'Invalid OTP code! Please check the code and try again.')
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendClick = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const newCode = await onResend(channel);
      if (typeof newCode === 'string') {
        setDebugOtpCode(newCode);
      }
      setDigits(['', '', '', '', '', '']);
      setCountdown(300);
      setCooldown(60);
      setSuccessMsg(
        lang === 'kh'
          ? 'កូដ OTP ថ្មីត្រូវបានផ្ញើដោយជោគជ័យ!'
          : 'New OTP code sent successfully!'
      );
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          (lang === 'kh' ? 'មិនអាចផ្ញើកូដ OTP បានទេ' : 'Failed to resend OTP code')
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden select-none animate-fadeIn">
        {/* Top Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-black text-white tracking-tight">
            {purpose === 'register' &&
              (lang === 'kh' ? 'ផ្ទៀងផ្ទាត់គណនីចុះឈ្មោះ' : 'Verify Registration Account')}
            {purpose === 'forgot_password' &&
              (lang === 'kh' ? 'ផ្ទៀងផ្ទាត់ការប្តូរពាក្យសម្ងាត់' : 'Verify Password Reset')}
            {purpose === 'phone_login' &&
              (lang === 'kh' ? 'ផ្ទៀងផ្ទាត់លេខទូរស័ព្ទ' : 'Verify Phone Number Login')}
          </h3>

          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {lang === 'kh'
              ? `កូដ OTP 6 ខ្ទង់ត្រូវបានផ្ញើទៅកាន់ ${channel === 'EMAIL' ? 'អ៊ីមែល' : 'លេខទូរស័ព្ទ'}`
              : `6-digit security OTP code sent to standard `}
            <span className="font-mono text-emerald-300 font-bold">{identifier}</span>
          </p>
        </div>

        {/* Channel Switcher (Email OTP vs SMS OTP) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setChannel('EMAIL');
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
              channel === 'EMAIL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email OTP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setChannel('SMS');
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
              channel === 'SMS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>SMS OTP</span>
          </button>
        </div>

        {/* Error & Success Feedback Banners */}
        {errorMsg && (
          <div className="bg-rose-950/90 border border-rose-800 text-rose-200 p-3 rounded-2xl flex items-center space-x-2.5 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/90 border border-emerald-800 text-emerald-200 p-3 rounded-2xl flex items-center space-x-2.5 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Real OTP 6 Digit Inputs Form */}
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="flex justify-between items-center max-w-[320px] mx-auto gap-1.5">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className={`w-11 h-14 text-center text-2xl font-black rounded-2xl border transition focus:outline-hidden font-mono ${
                  digit
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-slate-950/90 border-slate-800 text-white focus:border-emerald-500'
                }`}
              />
            ))}
          </div>

          {/* Timers & Resend Controls */}
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center space-x-1.5 text-slate-400">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>
                {lang === 'kh' ? 'ផុតកំណត់ក្នុងរយៈពេល:' : 'Expires in:'}{' '}
                <span className="font-mono font-bold text-emerald-300">
                  {formatTime(countdown)}
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleResendClick}
              disabled={cooldown > 0 || isResending}
              className="text-xs font-bold text-emerald-400 hover:underline disabled:text-slate-600 disabled:no-underline transition flex items-center space-x-1"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              <span>
                {cooldown > 0
                  ? lang === 'kh'
                    ? `ផ្ញើឡើងវិញ (${cooldown}s)`
                    : `Resend in (${cooldown}s)`
                  : lang === 'kh'
                  ? 'ផ្ញើកូដឡើងវិញ'
                  : 'Resend OTP'}
              </span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-2xl transition"
            >
              {lang === 'kh' ? 'បោះបង់' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isVerifying || digits.join('').length < 6}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-950/50 transition flex items-center justify-center space-x-1.5"
            >
              {isVerifying ? (
                <span className="inline-block animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{lang === 'kh' ? 'ផ្ទៀងផ្ទាត់ OTP' : 'Verify OTP Code'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
