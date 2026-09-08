import React, { useState, useEffect } from 'react';
import { useApp } from '../../application/context/AppContext';
import { TelegramBotConfig, TelegramUserItem, TelegramLogItem } from '../../foundation/types/backup';
import {
  getTelegramBotSettings,
  saveTelegramBotSettings,
  verifyTelegramBotToken,
  sendTelegramTestAlert,
  sendExportDataToTelegram,
  getTelegramLogs,
} from '../../data-access/posApi';
import {
  Bot,
  Send,
  Sliders,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  Bell,
  X,
  Check,
  Radio,
  ChevronDown,
  ChevronUp,
  Paperclip,
  FileText,
} from 'lucide-react';

interface TelegramBotConfigSectionProps {
  onSaved?: () => void;
}

export const TelegramBotConfigSection: React.FC<TelegramBotConfigSectionProps> = ({ onSaved }) => {
  const { lang } = useApp();

  // Telegram Config State
  const [botConfig, setBotConfig] = useState<TelegramBotConfig | null>(null);
  const [tgUsers, setTgUsers] = useState<TelegramUserItem[]>([]);
  const [tgLogs, setTgLogs] = useState<TelegramLogItem[]>([]);

  // Form Fields
  const [botName, setBotName] = useState('SmartPOS Alert Bot');
  const [botUsername, setBotUsername] = useState('');
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [notifySuccess, setNotifySuccess] = useState(true);
  const [notifyFailure, setNotifyFailure] = useState(true);
  const [notifyStorage, setNotifyStorage] = useState(true);
  const [notifySecurity, setNotifySecurity] = useState(true);
  const [notifyRestore, setNotifyRestore] = useState(true);
  const [attachBackupFile, setAttachBackupFile] = useState(true);

  // UI helpers
  const [showToken, setShowToken] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSendingTestFile, setIsSendingTestFile] = useState(false);
  const [testPreview, setTestPreview] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<{
    verified: boolean;
    bot?: { id: number; username: string; first_name: string };
    error?: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch settings & logs
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, logsRes] = await Promise.all([
        getTelegramBotSettings().catch(() => null),
        getTelegramLogs().catch(() => []),
      ]);

      if (settingsRes?.bot) {
        setBotConfig(settingsRes.bot);
        setBotName(settingsRes.bot.name || 'SmartPOS Alert Bot');
        setBotUsername(settingsRes.bot.bot_username || '');
        setBotToken(settingsRes.bot.bot_token || '');
        setStatus(settingsRes.bot.status || 'ACTIVE');
        setNotifySuccess(settingsRes.bot.notify_backup_success !== undefined ? Boolean(settingsRes.bot.notify_backup_success) : true);
        setNotifyFailure(settingsRes.bot.notify_backup_failed !== undefined ? Boolean(settingsRes.bot.notify_backup_failed) : true);
        setNotifyStorage(settingsRes.bot.notify_storage_warning !== undefined ? Boolean(settingsRes.bot.notify_storage_warning) : true);
        setNotifySecurity(settingsRes.bot.notify_security_alerts !== undefined ? Boolean(settingsRes.bot.notify_security_alerts) : true);
        setNotifyRestore(settingsRes.bot.notify_restore_events !== undefined ? Boolean(settingsRes.bot.notify_restore_events) : true);
        setAttachBackupFile(settingsRes.bot.attach_backup_file !== undefined ? Boolean(settingsRes.bot.attach_backup_file) : true);

        if (settingsRes.bot.bot_token) {
          setTokenStatus({
            verified: true,
            bot: {
              id: 0,
              username: settingsRes.bot.bot_username?.replace(/^@/, '') || '',
              first_name: settingsRes.bot.name || 'SmartPOS Alert Bot',
            },
          });
        }
      }

      const resolvedChatId =
        (settingsRes?.users && settingsRes.users.length > 0 && settingsRes.users[0].telegram_chat_id)
          ? settingsRes.users[0].telegram_chat_id
          : (settingsRes?.configured_chat_id || '');

      setChatId(resolvedChatId);

      if (settingsRes?.users) {
        setTgUsers(settingsRes.users);
      }

      if (logsRes) {
        setTgLogs(logsRes);
      }
    } catch (err) {
      console.error('Failed to load Telegram configuration', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Verify Bot Token with Telegram
  const handleVerifyToken = async () => {
    if (!botToken.trim()) {
      alert(lang === 'kh' ? 'សូមបញ្ចូល Bot Token ជាមុនសិន!' : 'Please enter a Telegram Bot Token first!');
      return;
    }
    setIsVerifying(true);
    setTokenStatus(null);
    try {
      const res = await verifyTelegramBotToken(botToken.trim());
      if (res.success && res.bot) {
        setTokenStatus({
          verified: true,
          bot: res.bot,
        });
        if (res.bot.username) {
          setBotUsername(`@${res.bot.username.replace(/^@/, '')}`);
        }
        if (res.bot.first_name && (!botName || botName === 'SmartPOS Alert Bot')) {
          setBotName(res.bot.first_name);
        }
        showToast(
          lang === 'kh'
            ? `Bot Token ត្រឹមត្រូវ! បានភ្ជាប់ជាមួយ @${res.bot.username}`
            : `Token verified successfully! Live Telegram Bot: @${res.bot.username}`
        );
      } else {
        setTokenStatus({
          verified: false,
          error: res.message || 'Verification failed. Please check the token.',
        });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to communicate with Telegram API.';
      setTokenStatus({
        verified: false,
        error: msg,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Save Settings
  const handleSave = async () => {
    if (!botToken.trim()) {
      alert(lang === 'kh' ? 'សូមបញ្ចូល Bot Token មុនពេលរក្សាទុក!' : 'Please enter a Telegram Bot Token before saving!');
      return;
    }
    setIsSaving(true);
    try {
      await saveTelegramBotSettings({
        name: botName.trim() || 'SmartPOS Alert Bot',
        bot_username: botUsername.trim(),
        bot_token: botToken.trim(),
        status,
        notify_backup_success: notifySuccess,
        notify_backup_failed: notifyFailure,
        notify_storage_warning: notifyStorage,
        notify_security_alerts: notifySecurity,
        notify_restore_events: notifyRestore,
        attach_backup_file: attachBackupFile,
        chat_id: chatId.trim(),
      });
      showToast(
        lang === 'kh'
          ? 'ការកំណត់ Telegram Bot ត្រូវបានរក្សាទុកដោយជោគជ័យ!'
          : 'Telegram Bot settings saved successfully!'
      );
      if (onSaved) onSaved();
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Test Alert Dispatch
  const handleTestAlert = async () => {
    setIsTesting(true);
    try {
      const res = await sendTelegramTestAlert(chatId.trim() || undefined, botToken.trim() || undefined);
      setTestPreview(res.preview_text);
      showToast(
        lang === 'kh'
          ? 'សារតេស្តតេឡេក្រាមត្រូវបានផ្ញើជោគជ័យ!'
          : 'Telegram test alert dispatched successfully!'
      );
      await loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to send Telegram test alert.';
      alert(msg);
    } finally {
      setIsTesting(false);
    }
  };

  // Test Document Transfer Dispatch
  const handleSendTestFile = async () => {
    setIsSendingTestFile(true);
    try {
      const res = await sendExportDataToTelegram('products', chatId.trim() || undefined);
      showToast(
        lang === 'kh'
          ? `ឯកសារ '${res.file_name || 'smartpos_products_export.json'}' ត្រូវបានផ្ញើទៅកាន់ Telegram ដោយជោគជ័យ!`
          : `Document '${res.file_name || 'smartpos_products_export.json'}' delivered to Telegram successfully!`
      );
      await loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to send test document to Telegram.';
      alert(msg);
    } finally {
      setIsSendingTestFile(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-3 text-xs font-semibold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-700 p-6 rounded-3xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-sky-200" />
            </div>
            <h3 className="font-bold text-base">
              {lang === 'kh' ? 'កំណត់រចនាសម្ព័ន្ធ Telegram Bot ដោយខ្លួនឯង' : 'Telegram Bot Self-Configuration & Emergency Alerts'}
            </h3>
          </div>
          <p className="text-xs text-sky-100 max-w-2xl leading-relaxed">
            {lang === 'kh'
              ? 'អ្នកអាចប្រើប្រាស់ Telegram Bot ផ្ទាល់ខ្លួនរបស់អ្នក ដោយគ្រាន់តែបញ្ចូល Bot Token ពី @BotFather និង Admin Chat ID។ ប្រព័ន្ធនឹងផ្ញើរបាយការណ៍បម្រុងទុក ការជូនដំណឹងគ្រោះអាសន្ន និងការត្រួតពិនិត្យពីចម្ងាយដោយស្វ័យប្រវត្តិ។'
              : 'Configure your own personal or business Telegram Bot in seconds. Simply input your Bot Token from @BotFather and your Chat ID to receive automated backup digests, storage warnings, and remote command access.'}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleTestAlert}
            disabled={isTesting || (!botToken && !botConfig?.bot_token)}
            className="px-4 py-2.5 bg-white text-sky-700 hover:bg-sky-50 disabled:opacity-50 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer shadow-xs"
          >
            <Send className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{lang === 'kh' ? 'ផ្ញើសារតេស្តឥឡូវនេះ' : 'Send Test Alert'}</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer shadow-xs"
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{lang === 'kh' ? 'រក្សាទុកការកំណត់' : 'Save Config'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible 4-Step Setup Guide */}
      <div className="bg-white rounded-2xl border border-sky-100 overflow-hidden shadow-xs">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full p-4 bg-sky-50/70 hover:bg-sky-50 flex items-center justify-between transition cursor-pointer text-left"
        >
          <div className="flex items-center space-x-2.5">
            <HelpCircle className="w-5 h-5 text-sky-600" />
            <div>
              <span className="text-xs font-bold text-sky-900 block">
                {lang === 'kh'
                  ? '📖 របៀបបង្កើត និងកំណត់ Telegram Bot ដោយខ្លួនឯងក្នុងរយៈពេល ១ នាទី'
                  : '📖 How to Create & Configure Your Telegram Bot in 1 Minute (Step-by-Step)'}
              </span>
              <span className="text-[11px] text-sky-600 font-medium">
                {lang === 'kh'
                  ? 'ចុចទីនេះដើម្បីមើលការណែនាំលម្អិតមួយជំហានម្តងៗ'
                  : 'Click to expand/collapse setup instructions for @BotFather and Chat ID'}
              </span>
            </div>
          </div>
          {showGuide ? <ChevronUp className="w-4 h-4 text-sky-700" /> : <ChevronDown className="w-4 h-4 text-sky-700" />}
        </button>

        {showGuide && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4 bg-white text-xs">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center space-x-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[11px] flex items-center justify-center">1</span>
                  <span className="font-bold text-slate-800">
                    {lang === 'kh' ? 'បង្កើត Bot ជាមួយ @BotFather' : 'Create Bot via @BotFather'}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {lang === 'kh'
                    ? 'បើកកម្មវិធី Telegram ស្វែងរក @BotFather រួចចុច Start និងផ្ញើពាក្យ /newbot។ ដាក់ឈ្មោះ Bot និង Username (ត្រូវបញ្ចប់ដោយ bot)។'
                    : 'Open Telegram, search for @BotFather, press Start, and send /newbot. Enter your bot name and a username ending in "bot".'}
                </p>
              </div>
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-sky-600 hover:text-sky-800 font-semibold text-[11px] pt-1"
              >
                <span>Open @BotFather</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center space-x-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[11px] flex items-center justify-center">2</span>
                  <span className="font-bold text-slate-800">
                    {lang === 'kh' ? 'ចម្លង Bot Token' : 'Copy API Bot Token'}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {lang === 'kh'
                    ? 'BotFather នឹងផ្ញើ HTTP API Token មកអ្នក (ឧ. 123456:ABC-DEF...)។ ចម្លងវាហើយបិទភ្ជាប់ (Paste) ក្នុងប្រអប់ "Bot Token" ខាងក្រោម។'
                    : 'BotFather will reply with an HTTP API token (e.g. 123456:ABC-DEF...). Copy and paste it into the Bot Token field below.'}
                </p>
              </div>
              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded font-medium">
                {lang === 'kh' ? '🔒 រក្សាទុក Token ជាការសម្ងាត់' : '🔒 Keep token private'}
              </span>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center space-x-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[11px] flex items-center justify-center">3</span>
                  <span className="font-bold text-slate-800">
                    {lang === 'kh' ? 'រកលេខ Chat ID' : 'Find Your Chat ID'}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {lang === 'kh'
                    ? 'ស្វែងរក @userinfobot ក្នុង Telegram រួចចុច Start ដើម្បីទទួលបានលេខ Id ផ្ទាល់ខ្លួនរបស់អ្នក (ឧ. 987654321) រួចបញ្ចូលក្នុងប្រអប់ Admin Chat ID។'
                    : 'Search @userinfobot or @RawDataBot in Telegram, click Start to copy your numeric user Id (e.g. 987654321) into Admin Chat ID.'}
                </p>
              </div>
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-sky-600 hover:text-sky-800 font-semibold text-[11px] pt-1"
              >
                <span>Open @userinfobot</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center space-x-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center">4</span>
                  <span className="font-bold text-emerald-950">
                    {lang === 'kh' ? 'ចុច START & តេស្ត' : 'Press START & Test Alert'}
                  </span>
                </div>
                <p className="text-emerald-900 text-[11px] leading-relaxed">
                  {lang === 'kh'
                    ? 'សំខាន់បំផុត៖ បើក Telegram Bot ដែលអ្នកទើបបង្កើត រួចចុចប៊ូតុង START (/start) មុនគេ! បន្ទាប់មកចុច "ផ្ញើសារតេស្តឥឡូវនេះ"។'
                    : 'CRITICAL: Open your newly created bot in Telegram and click START (/start) first! Then click "Send Test Alert" to verify delivery.'}
                </p>
              </div>
              <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100/70 px-2 py-0.5 rounded w-fit">
                {lang === 'kh' ? '✅ រួចរាល់ក្នុងការប្រើប្រាស់' : '✅ Ready to deploy'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Test Alert Payload Preview if active */}
      {testPreview && (
        <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-semibold">Telegram Live Message Dispatched</span>
            </div>
            <button onClick={() => setTestPreview(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-300">{testPreview}</pre>
        </div>
      )}

      {/* Main Self-Configuration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hidden decoy fields to divert aggressive browser password managers */}
        <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, overflow: 'hidden', zIndex: -1 }} aria-hidden="true">
          <input type="text" name="fake_username_to_prevent_autofill" tabIndex={-1} autoComplete="off" />
          <input type="password" name="fake_password_to_prevent_autofill" tabIndex={-1} autoComplete="off" />
        </div>

        {/* Left 2 Columns: Credentials & Setup */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-sky-600" />
                <span>{lang === 'kh' ? 'ព័ត៌មានសម្គាល់ និងការតភ្ជាប់ Bot' : 'Bot Credentials & Connection'}</span>
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 font-medium">{lang === 'kh' ? 'ស្ថានភាព:' : 'Status:'}</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-hidden ${
                    status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  <option value="ACTIVE">{lang === 'kh' ? '🟢 បើកដំណើរការ (Active)' : '🟢 Active & Listening'}</option>
                  <option value="INACTIVE">{lang === 'kh' ? '⚪ បិទដំណើរការ (Inactive)' : '⚪ Inactive'}</option>
                </select>
              </div>
            </div>

            {/* Token Input with Show/Hide & Verify Button */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>{lang === 'kh' ? 'Telegram Bot Token (ទទួលបានពី @BotFather)' : 'Telegram Bot Token (from @BotFather)'}</span>
                  <span className="text-rose-500">*</span>
                </label>
                {botUsername && (
                  <a
                    href={`https://t.me/${botUsername.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-sky-600 hover:underline flex items-center space-x-1 font-semibold"
                  >
                    <span>{botUsername}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showToken ? 'text' : 'password'}
                    name="telegram_bot_token_secret"
                    id="telegram_bot_token_secret"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    value={botToken}
                    onChange={(e) => {
                      setBotToken(e.target.value);
                      setTokenStatus(null);
                    }}
                    placeholder="e.g. 7123456789:AAFk93kLkq0wkd98..."
                    className="w-full pl-3 pr-10 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    title={showToken ? 'Hide token' : 'Show token'}
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyToken}
                  disabled={isVerifying || !botToken.trim()}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                  <span>{lang === 'kh' ? 'ផ្ទៀងផ្ទាត់ Token' : 'Verify Token'}</span>
                </button>
              </div>

              {/* Verification status pill */}
              {tokenStatus && (
                <div
                  className={`mt-2 p-3 rounded-xl border flex items-center space-x-2 text-xs ${
                    tokenStatus.verified
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {tokenStatus.verified ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold">
                          {lang === 'kh' ? 'Token ត្រឹមត្រូវ និងដំណើរការ!' : 'Valid Telegram Bot Connected:'}{' '}
                        </span>
                        <span>
                          @{tokenStatus.bot?.username} ({tokenStatus.bot?.first_name})
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <div>
                        <span className="font-bold">{lang === 'kh' ? 'ការផ្ទៀងផ្ទាត់បរាជ័យ:' : 'Token Verification Error:'} </span>
                        <span>{tokenStatus.error}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Bot Name & Bot Username */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  {lang === 'kh' ? 'ឈ្មោះសម្គាល់ Bot (Bot Display Name)' : 'Bot Display Name'}
                </label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="e.g. SmartPOS Store Alert Bot"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:border-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  {lang === 'kh' ? 'Bot Username (ពី BotFather)' : 'Bot Username'}
                </label>
                <input
                  type="text"
                  value={botUsername}
                  onChange={(e) => setBotUsername(e.target.value)}
                  placeholder="e.g. @MyStore_POS_bot"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:border-sky-500 font-mono text-sky-800"
                />
              </div>
            </div>

            {/* Admin Chat ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-700 flex items-center space-x-1">
                  <span>{lang === 'kh' ? 'លេខសម្គាល់ Admin Chat ID' : 'Admin Chat ID / Group Chat ID'}</span>
                  <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-gray-400">
                  {lang === 'kh' ? 'អាចប្រើ Chat ផ្ទាល់ខ្លួន ឬ Group' : 'Personal user ID or group ID'}
                </span>
              </div>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="e.g. 589123456 (or -100123456789 for groups)"
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:border-sky-500 font-mono text-slate-800 font-bold"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                {lang === 'kh'
                  ? '💡 របៀបយកលេខ Chat ID: បើក Telegram ផ្ញើសារ /start ទៅ @userinfobot រួចចម្លងលេខ "Id" មកដាក់ទីនេះ។'
                  : '💡 Quick tip: Open Telegram, send /start to @userinfobot, and copy your numerical "Id". For groups, add the bot to the group and use group chat ID.'}
              </p>
            </div>

            {/* Save Button in Box */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center space-x-2 cursor-pointer shadow-xs"
              >
                <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                <span>{lang === 'kh' ? 'រក្សាទុកការកំណត់ Telegram Bot' : 'Save Telegram Configuration'}</span>
              </button>
            </div>
          </div>

          {/* Authorized Commands Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>{lang === 'kh' ? 'ពាក្យបញ្ជាបញ្ជាការពីចម្ងាយ (Remote Bot Commands)' : 'Authorized Remote Commands'}</span>
            </h3>
            <p className="text-xs text-gray-500">
              {lang === 'kh'
                ? 'អ្នកគ្រប់គ្រងអាចផ្ញើពាក្យបញ្ជាទាំងនេះដោយផ្ទាល់នៅក្នុង Telegram ទៅកាន់ Bot របស់អ្នក ដើម្បីគ្រប់គ្រងប្រព័ន្ធ៖'
                : 'Authorized admins can issue these commands directly in Telegram to interact with the SmartPOS system securely:'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start space-x-2.5">
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">/backup</span>
                <span className="text-gray-600 text-[11px]">
                  {lang === 'kh' ? 'ដំណើរការបង្កើតច្បាប់ចម្លងបម្រុងទុកទិន្នន័យភ្លាមៗ' : 'Trigger an immediate full database backup snapshot'}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start space-x-2.5">
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">/health</span>
                <span className="text-gray-600 text-[11px]">
                  {lang === 'kh' ? 'ពិនិត្យមើលសុខភាព Database និងទំហំផ្ទុក Disk' : 'Inspect live database status, integrity & storage threshold'}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start space-x-2.5">
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">/backups</span>
                <span className="text-gray-600 text-[11px]">
                  {lang === 'kh' ? 'បង្ហាញបញ្ជី ៥ ច្បាប់ចម្លងដែលបានផ្ទៀងផ្ទាត់ចុងក្រោយ' : 'List latest 5 verified snapshots with sizes and checksums'}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-start space-x-2.5">
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">/sessions</span>
                <span className="text-gray-600 text-[11px]">
                  {lang === 'kh' ? 'មើលវេនលក់ Cashier ដែលកំពុងបើកដំណើរការ' : 'View active cashier shifts and security status'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Notification Triggers */}
        <div className="space-y-6">
          {/* Notification Triggers Checkboxes */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>{lang === 'kh' ? 'ព្រឹត្តិការណ៍ដាស់តឿន (Notification Triggers)' : 'Alert Triggers & Events'}</span>
            </h3>
            <p className="text-xs text-gray-500">
              {lang === 'kh'
                ? 'ជ្រើសរើសព្រឹត្តិការណ៍ដែលត្រូវផ្ញើដំណឹងស្វ័យប្រវត្តិតាម Telegram:'
                : 'Select which events trigger automated notifications to your configured Chat ID:'}
            </p>

            <div className="space-y-3 text-xs">
              <label className="flex items-start space-x-3 p-3 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={notifySuccess}
                  onChange={(e) => setNotifySuccess(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 mt-0.5 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-gray-900 block">
                    {lang === 'kh' ? '✅ បម្រុងទុកជោគជ័យ (Backup Success)' : '✅ Backup Succeeded'}
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    {lang === 'kh' ? 'ផ្ញើរបាយការណ៍សង្ខេបពេលបង្កើតចម្លងជោគជ័យ' : 'Send snapshot digest, file size, and duration'}
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3 rounded-xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50/70 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={notifyFailure}
                  onChange={(e) => setNotifyFailure(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-gray-300 mt-0.5 focus:ring-rose-500"
                />
                <div>
                  <span className="font-bold text-rose-900 block">
                    {lang === 'kh' ? '🚨 បម្រុងទុកបរាជ័យ (Backup Failed)' : '🚨 Backup Failed'}
                  </span>
                  <span className="text-rose-700 text-[11px]">
                    {lang === 'kh' ? 'ជូនដំណឹងបន្ទាន់ភ្លាមៗពេលមានកំហុសបម្រុងទុក' : 'Urgent notification with failure reason & error traceback'}
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3 rounded-xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50/70 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={notifyStorage}
                  onChange={(e) => setNotifyStorage(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-gray-300 mt-0.5 focus:ring-amber-500"
                />
                <div>
                  <span className="font-bold text-amber-900 block">
                    {lang === 'kh' ? '⚠️ ការដាស់តឿនទំហំ Disk (Low Storage)' : '⚠️ Low Storage Warning'}
                  </span>
                  <span className="text-amber-700 text-[11px]">
                    {lang === 'kh' ? 'ជូនដំណឹងនៅពេលទំហំផ្ទុកលើស 85%' : 'Alert when server disk usage exceeds 85%'}
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={notifySecurity}
                  onChange={(e) => setNotifySecurity(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-gray-300 mt-0.5 focus:ring-purple-500"
                />
                <div>
                  <span className="font-bold text-gray-900 block">
                    {lang === 'kh' ? '🛡️ ការចូលប្រើប្រព័ន្ធសង្ស័យ (Security Alerts)' : '🛡️ Security & Login Alerts'}
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    {lang === 'kh' ? 'ជូនដំណឹងពេលមានការចូលបរាជ័យច្រើនដង ឬឧបករណ៍មិនស្គាល់' : 'Notify on multiple failed logins or foreign IP accesses'}
                  </span>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={notifyRestore}
                  onChange={(e) => setNotifyRestore(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 mt-0.5 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-gray-900 block">
                    {lang === 'kh' ? '🔄 ការស្តារប្រព័ន្ធ (Restore Events)' : '🔄 Restore & Recovery Events'}
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    {lang === 'kh' ? 'ជូនដំណឹងនៅពេលមានការចាប់ផ្តើម ឬបញ្ចប់ការស្តារទិន្នន័យ' : 'Notify when a database restore begins or concludes'}
                  </span>
                </div>
              </label>

              {/* Attach & Send File checkbox */}
              <label className="flex items-start space-x-3 p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50/80 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={attachBackupFile}
                  onChange={(e) => setAttachBackupFile(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 mt-0.5 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-bold text-indigo-950 block flex items-center space-x-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>{lang === 'kh' ? '📎 ផ្ញើភ្ជាប់ឯកសារ Backup ដោយស្វ័យប្រវត្តិ' : '📎 Attach & Send Backup Files (sendDocument)'}</span>
                  </span>
                  <span className="text-indigo-800 text-[11px]">
                    {lang === 'kh'
                      ? 'ផ្ញើភ្ជាប់ឯកសារចម្លង SQLite / ZIP ទៅ Telegram ដោយស្វ័យប្រវត្តិនូវរាល់ពេលបង្កើត Backup (ទំហំរហូតដល់ 50 MB)'
                      : 'Automatically deliver the raw backup database file (.sqlite) directly to Telegram on every backup'}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Test & Webhook Status Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wider">
              {lang === 'kh' ? 'សាកល្បងការផ្ញើជូនដំណឹង និងឯកសារ' : 'Test Dispatch & File Transfer'}
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              {lang === 'kh'
                ? 'សាកល្បងការផ្ញើសារអត្ថបទ និងការផ្ញើឯកសារភ្ជាប់ (Document) ទៅកាន់ Telegram Chat ID របស់អ្នក៖'
                : 'Test text message alert dispatch and raw file document delivery to your configured Telegram Chat ID:'}
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleTestAlert}
                disabled={isTesting}
                className="w-full py-2.5 px-4 bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-xs rounded-xl border border-sky-200 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Send className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{lang === 'kh' ? 'ផ្ញើសារតេស្តឥឡូវនេះ' : 'Send Test Alert Text'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendTestFile}
                disabled={isSendingTestFile || (!botToken && !botConfig?.bot_token)}
                className="w-full py-2.5 px-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs rounded-xl border border-indigo-200 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <FileText className={`w-3.5 h-3.5 ${isSendingTestFile ? 'animate-spin' : ''}`} />
                <span>{lang === 'kh' ? 'ផ្ញើឯកសារតេស្តទៅ Telegram' : 'Send Test File / Document to Telegram'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Telegram Notification & Command Audit Log */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-sky-600" />
            <h3 className="font-bold text-sm text-gray-900">
              {lang === 'kh' ? 'កំណត់ហេតុសកម្មភាព និងការផ្ញើ Telegram (Audit Log)' : 'Telegram Notification & Command Audit Log'}
            </h3>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-400 font-mono">{tgLogs.length} events</span>
            <button
              onClick={loadData}
              className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition"
              title="Refresh log"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">{lang === 'kh' ? 'កាលបរិច្ឆេទ & ម៉ោង' : 'Timestamp'}</th>
                <th className="py-3 px-4">{lang === 'kh' ? 'សកម្មភាព / ពាក្យបញ្ជា' : 'Action / Command'}</th>
                <th className="py-3 px-4">{lang === 'kh' ? 'Chat ID គោលដៅ' : 'Target Chat ID'}</th>
                <th className="py-3 px-4">{lang === 'kh' ? 'ស្ថានភាព' : 'Status'}</th>
                <th className="py-3 px-4">{lang === 'kh' ? 'ខ្លឹមសារសង្ខេប' : 'Summary'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tgLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                    {lang === 'kh'
                      ? 'មិនទាន់មានកំណត់ហេតុផ្ញើ Telegram នៅឡើយទេ។ សាកល្បងចុច "ផ្ញើសារតេស្តឥឡូវនេះ"។'
                      : 'No Telegram activities logged yet. Click "Send Test Alert Now" to test the pipeline.'}
                  </td>
                </tr>
              ) : (
                tgLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                        {log.command || log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600">
                      {log.telegram_chat_id || chatId || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {log.status === 'SENT' || log.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3" />
                          <span>Delivered</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <X className="w-3 h-3" />
                          <span>{log.status}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate font-mono text-[11px]">
                      {log.response_text || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
