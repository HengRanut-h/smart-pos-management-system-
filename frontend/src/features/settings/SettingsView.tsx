import { SmartPosLogo } from '../../presentation/components/SmartPosLogo';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../application/context/AppContext';
import { SystemSettings } from '../../foundation/types';
import { getSystemSettings, updateSystemSettings, uploadStoreLogo } from '../../data-access/posApi';
import {
  Settings,
  Building2,
  DollarSign,
  Printer,
  QrCode,
  Save,
  CheckCircle2,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Eye,
  ExternalLink,
  Download,
  Sparkles,
  ZoomIn,
  ZoomOut,
  X,
  Lock,
} from 'lucide-react';

const SAMPLE_STORE_LOGOS = [
  { label: 'Flagship Coffee & Retail', url: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=400&auto=format&fit=crop&q=80' },
  { label: 'Supermarket Express', url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&auto=format&fit=crop&q=80' },
  { label: 'Tech & Gadget Store', url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=400&auto=format&fit=crop&q=80' },
  { label: 'Boutique & Apparel', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&auto=format&fit=crop&q=80' },
];

export const SettingsView: React.FC = () => {
  const { lang, setLang, updateStoreSettingsState } = useApp();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Lightbox Modal state
  const [previewImageModal, setPreviewImageModal] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
  } | null>(null);
  const [previewZoomLevel, setPreviewZoomLevel] = useState<number>(1);

  const handlePreviewImage = (url: string, title: string) => {
    if (!url) return;
    setPreviewZoomLevel(1);
    setPreviewImageModal({
      isOpen: true,
      url,
      title,
    });
  };

  const handleLocalLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Logo image file size must be less than 5 MB.');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const res = await uploadStoreLogo(file);
      if (res.success && res.image_url) {
        const updated = { ...settings, store_logo_url: res.image_url };
        setSettings(updated);
        updateStoreSettingsState(updated);
      }
    } catch (err: any) {
      console.error('Failed to upload store logo', err);
      alert(err.response?.data?.message || 'Failed to upload store logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getSystemSettings();
      setSettings(data);
      updateStoreSettingsState(data);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    try {
      const savedData = await updateSystemSettings(settings);
      setSettings(savedData);
      updateStoreSettingsState(savedData);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } catch (err) {
      console.error('Failed to save settings', err);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {lang === 'kh' ? 'ការកំណត់ប្រព័ន្ធ & សាខា' : 'System & Branch Settings'}
              </h1>
              <p className="text-xs text-gray-500">
                {lang === 'kh'
                  ? 'ព័ត៌មានហាង អត្រាប្តូរប្រាក់ ពន្ធអាករ និងម៉ាស៊ីនបោះពុម្ពវិក្កយបត្រ'
                  : 'Store profile, currency exchange rate, GDT VAT tax, Bakong merchant, and printer setup'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchSettings}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Form Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl w-full mx-auto space-y-6">
        {savedMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center space-x-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">Settings updated and applied successfully!</span>
          </div>
        )}

        {isLoading || !settings ? (
          <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            Loading settings...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Store Profile Card */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
                <SmartPosLogo variant="icon" size="sm" />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Store Profile & Branch Info</h3>
                  <span className="text-[10px] text-emerald-600 font-semibold uppercase">SmartPOS Business Entity</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Store Name</label>
                  <input
                    type="text"
                    value={settings.store_name}
                    onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Branch Code</label>
                  <input
                    type="text"
                    value={settings.branch_code}
                    onChange={(e) => setSettings({ ...settings, branch_code: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tax TIN (GDT)</label>
                  <input
                    type="text"
                    value={settings.tax_identification_number}
                    onChange={(e) => setSettings({ ...settings, tax_identification_number: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Store Phone</label>
                  <input
                    type="text"
                    value={settings.phone_number}
                    onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Store Physical Address</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                {/* Store Logo & Branding Upload */}
                <div className="md:col-span-2 pt-3 border-t border-gray-100 space-y-3">
                  <label className="block text-xs font-bold text-gray-700 uppercase flex items-center justify-between">
                    <span>Store Logo & Branding Image</span>
                    <span className="text-[10px] text-gray-400 font-normal normal-case">Upload local image file (PNG, JPG, WEBP up to 5MB)</span>
                  </label>

                  {/* Dropzone for Uploading from Local Computer */}
                  <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-300 space-y-2 text-center">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                      <label className="cursor-pointer px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-2 shrink-0">
                        {isUploadingLogo ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Uploading Logo...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Upload Store Image from Local Computer</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLocalLogoUpload}
                          disabled={isUploadingLogo}
                          className="hidden"
                        />
                      </label>

                      <span className="text-[11px] text-gray-400 font-medium">or enter URL / pick preset below</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Web Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or /storage/store/..."
                      value={settings.store_logo_url || ''}
                      onChange={(e) => setSettings({ ...settings, store_logo_url: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-hidden focus:border-emerald-500 font-mono"
                    />
                  </div>

                  {/* Logo Shape & Styling Controls */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1.5">
                      Logo Badge Shape & Framing
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'rounded', label: 'Rounded Box', shapeClass: 'rounded-xl' },
                        { id: 'circle', label: 'Circle Badge', shapeClass: 'rounded-full' },
                        { id: 'squircle', label: 'Squircle', shapeClass: 'rounded-3xl' },
                        { id: 'square', label: 'Sharp Square', shapeClass: 'rounded-none' },
                      ].map((shape) => {
                        const isSelected = (settings.logo_shape || 'rounded') === shape.id;
                        return (
                          <button
                            key={shape.id}
                            type="button"
                            onClick={() => {
                              const updated = { ...settings, logo_shape: shape.id as any };
                              setSettings(updated);
                              updateStoreSettingsState(updated);
                            }}
                            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-5 h-5 bg-emerald-600 ${shape.shapeClass} shrink-0`} />
                            <span className="truncate">{shape.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sample Store Logo Presets */}
                  <div>
                    <span className="text-[11px] font-semibold text-gray-500 block mb-1.5 flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Quick Sample Store Logos:</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {SAMPLE_STORE_LOGOS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const updated = { ...settings, store_logo_url: preset.url };
                            setSettings(updated);
                            updateStoreSettingsState(updated);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border ${
                            settings.store_logo_url === preset.url
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}

                      {/* Reset to Default System Logo */}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...settings, store_logo_url: '', logo_shape: 'rounded' as const };
                          setSettings(updated);
                          updateStoreSettingsState(updated);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition flex items-center space-x-1"
                        title="Revert back to default SmartPOS vector icon"
                      >
                        <RefreshCw className="w-3 h-3 text-amber-600" />
                        <span>Reset to Default System Logo</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Store Logo Preview */}
                  {settings.store_logo_url && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-200">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div
                          onClick={() => handlePreviewImage(settings.store_logo_url!, settings.store_name || 'Store Logo')}
                          className="w-14 h-14 rounded-xl overflow-hidden bg-white shrink-0 border border-emerald-300 relative group/storethumb cursor-pointer hover:ring-2 hover:ring-emerald-300 transition shadow-xs"
                          title="Click to view full image preview"
                        >
                          <img
                            src={settings.store_logo_url}
                            alt="Store Logo"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as any).src = 'https://placehold.co/100x100?text=Invalid+Logo';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/storethumb:opacity-100 transition flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-gray-900 block truncate">Active Store Logo</span>
                            <button
                              type="button"
                              onClick={() => handlePreviewImage(settings.store_logo_url!, settings.store_name || 'Store Logo')}
                              className="text-[10px] text-emerald-600 hover:underline font-bold flex items-center space-x-0.5"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Preview</span>
                            </button>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-700 block truncate max-w-xs">{settings.store_logo_url}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...settings, store_logo_url: '' };
                          setSettings(updated);
                          updateStoreSettingsState(updated);
                        }}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition flex items-center space-x-1 text-xs font-semibold"
                        title="Clear logo image"
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">Clear</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Currency & Financial Configuration */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-gray-100">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-gray-900 text-sm">Currency & Tax Rates</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Exchange Rate (1 USD to KHR)</label>
                  <input
                    type="number"
                    step="1"
                    value={settings.exchange_rate}
                    onChange={(e) => setSettings({ ...settings, exchange_rate: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-purple-500 font-mono font-bold text-purple-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Standard VAT Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.default_vat_rate}
                    onChange={(e) => setSettings({ ...settings, default_vat_rate: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Language</label>
                  <div className="flex space-x-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setLang('en')}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                        lang === 'en' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLang('kh')}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                        lang === 'kh' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      ភាសាខ្មែរ
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bakong KHQR Settings */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-gray-100">
                <QrCode className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-gray-900 text-sm">Bakong KHQR Merchant Credentials</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Bakong Account ID</label>
                  <input
                    type="text"
                    value={settings.bakong_merchant_id}
                    onChange={(e) => setSettings({ ...settings, bakong_merchant_id: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-rose-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Merchant Business Name</label>
                  <input
                    type="text"
                    value={settings.bakong_account_name}
                    onChange={(e) => setSettings({ ...settings, bakong_account_name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Receipt Printer Settings */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-gray-100">
                <Printer className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-sm">Thermal Receipt Printer</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Paper Width</label>
                  <select
                    value={settings.receipt_printer_type}
                    onChange={(e) => setSettings({ ...settings, receipt_printer_type: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="80mm">80mm Standard POS Thermal Paper</option>
                    <option value="58mm">58mm Compact Mobile Printer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Receipt Footer Note</label>
                  <input
                    type="text"
                    value={settings.receipt_footer_note}
                    onChange={(e) => setSettings({ ...settings, receipt_footer_note: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Security PIN & Terminal Access Control */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-gray-100">
                <Lock className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Security PIN & Terminal Access</h3>
                  <p className="text-[10px] text-gray-500">Customize Quick PIN digits (4, 6, or 8) and master security PIN</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Security PIN Length
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[4, 6, 8].map((length) => {
                      const isSelected = (settings.security_pin_length || 4) === length;
                      return (
                        <button
                          key={length}
                          type="button"
                          onClick={() => {
                            const updated = { ...settings, security_pin_length: length as 4 | 6 | 8 };
                            setSettings(updated);
                            updateStoreSettingsState(updated);
                          }}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center space-y-0.5 ${
                            isSelected
                              ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20 shadow-xs'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-sm font-black">{length} Digits</span>
                          <span className="text-[10px] opacity-75 font-normal">
                            {length === 4 ? 'Standard' : length === 6 ? 'Enhanced' : 'High Security'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Master Security PIN
                  </label>
                  <input
                    type="text"
                    maxLength={settings.security_pin_length || 4}
                    value={settings.master_security_pin || '1234'}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, settings.security_pin_length || 4);
                      const updated = { ...settings, master_security_pin: val };
                      setSettings(updated);
                      updateStoreSettingsState(updated);
                    }}
                    placeholder="Enter Master PIN"
                    className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-amber-500 font-mono tracking-widest font-bold text-amber-800"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Used by Admins & Managers for terminal unlock and overrides (Default: 1234)
                  </span>
                </div>
              </div>

              {/* Live Keypad Box Preview */}
              <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/60">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                    {settings.security_pin_length || 4}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Live Keypad Preview</span>
                    <span className="text-[10px] text-gray-500">Terminal login screen will display this digit layout</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  {Array.from({ length: settings.security_pin_length || 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="w-7 h-9 rounded-lg bg-white border border-amber-300 flex items-center justify-center text-amber-600 font-bold text-sm shadow-2xs font-mono"
                    >
                      {idx < (settings.master_security_pin || '1234').length ? '●' : '○'}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-200 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Settings...' : 'Save Configuration'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Store Logo Lightbox Image Preview Modal */}
      {previewImageModal && previewImageModal.isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 transition-all duration-300"
          onClick={() => setPreviewImageModal(null)}
        >
          {/* Header Bar */}
          <div
            className="w-full max-w-5xl flex items-center justify-between text-white border-b border-white/10 pb-4 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white truncate">{previewImageModal.title}</h3>
                <span className="text-xs text-emerald-400 font-mono">Store Logo & Branding Asset</span>
              </div>
            </div>

            {/* Lightbox Controls & Actions */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setPreviewZoomLevel((prev) => Math.max(0.6, prev - 0.2))}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition border border-white/10"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setPreviewZoomLevel(1)}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold rounded-xl transition border border-white/10"
                title="Reset Zoom"
              >
                {Math.round(previewZoomLevel * 100)}%
              </button>

              <button
                type="button"
                onClick={() => setPreviewZoomLevel((prev) => Math.min(2.5, prev + 0.2))}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition border border-white/10"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="h-5 w-px bg-white/20 mx-1" />

              <a
                href={previewImageModal.url}
                download={`${previewImageModal.title || 'store_logo'}.jpg`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition shadow-lg shadow-emerald-900/50 flex items-center space-x-1.5 text-xs font-bold"
                title="Download store logo"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </a>

              <a
                href={previewImageModal.url}
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition border border-white/10"
                title="Open logo in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="p-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl transition shadow-md"
                title="Close preview (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Logo Display Area */}
          <div
            className="flex-1 w-full max-w-5xl flex items-center justify-center overflow-auto py-4 my-auto relative select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImageModal.url}
              alt={previewImageModal.title}
              style={{ transform: `scale(${previewZoomLevel})` }}
              className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/15 transition-transform duration-200"
              onError={(e) => {
                (e.target as any).src = 'https://placehold.co/600x400?text=Logo+Load+Error';
              }}
            />
          </div>

          {/* Footer Info Strip */}
          <div
            className="w-full max-w-5xl bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center justify-between text-white z-10 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3">
              <SmartPosLogo variant="icon" size="sm" />
              <span className="font-bold text-white text-xs">{settings?.store_name}</span>
            </div>

            <div className="text-right min-w-0 max-w-xs sm:max-w-md">
              <span className="text-gray-400 block text-[10px] font-semibold">Image URL:</span>
              <span className="font-mono text-[10px] text-emerald-300 block truncate">{previewImageModal.url}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
