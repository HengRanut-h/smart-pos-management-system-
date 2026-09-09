import React from 'react';
import {
  InvoiceCustomizationState,
  BACKGROUND_TONE_PRESETS,
  WATERMARK_PRESETS,
  THEME_COLOR_PRESETS,
  DEFAULT_INVOICE_CUSTOMIZATION,
  saveInvoiceCustomization,
} from './invoiceCustomization';
import {
  Palette,
  X,
  RotateCcw,
  Check,
  Stamp,
  FileText,
  Sliders,
  Type,
  Layers,
  Sparkles,
  QrCode,
  DollarSign,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { useApp } from '../../application/context/AppContext';

interface InvoiceBackgroundCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: InvoiceCustomizationState;
  onChange: (updated: InvoiceCustomizationState) => void;
}

export const InvoiceBackgroundCustomizerModal: React.FC<InvoiceBackgroundCustomizerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onChange,
}) => {
  const { lang, notify } = useApp();

  if (!isOpen) return null;

  const handleSaveAsDefault = () => {
    saveInvoiceCustomization(settings);
    notify.success(
      lang === 'kh'
        ? 'ការកំណត់ផ្ទៃខាងក្រោយវិក្កយបត្រត្រូវបានរក្សាទុកជាទម្រង់ដើម!'
        : 'Invoice background & styling saved as default for all invoices!',
      'Preferences Saved'
    );
    onClose();
  };

  const handleReset = () => {
    onChange(DEFAULT_INVOICE_CUSTOMIZATION);
    saveInvoiceCustomization(DEFAULT_INVOICE_CUSTOMIZATION);
    notify.info(
      lang === 'kh'
        ? 'បានកំណត់ទម្រង់វិក្កយបត្រមកដើមវិញ'
        : 'Invoice visual settings reset to standard GDT defaults',
      'Reset Defaults'
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60] overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50/70 to-teal-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-sm text-gray-900 flex items-center space-x-2">
                <span>{lang === 'kh' ? 'កែសម្រួលផ្ទៃខាងក្រោយ & រចនាប័ទ្មវិក្កយបត្រ' : 'Tax Invoice Background & Visual Customizer'}</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  Live Customizer
                </span>
              </h2>
              <p className="text-[11px] text-gray-500">
                {lang === 'kh'
                  ? 'ប្តូរពណ៌ផ្ទៃខាងក្រោយ ត្រាផ្លូវការ ឡូហ្គោទឹក និងទម្រង់បោះពុម្ព'
                  : 'Customize paper background tone, official watermark, rubber stamp & branding'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Configuration Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-700">
          {/* 1. Paper Background Tone & Color */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs uppercase tracking-wider text-gray-900">
                  {lang === 'kh' ? 'ពណ៌ផ្ទៃក្រដាស (Paper Tone / Background)' : 'Paper Background Tone'}
                </span>
              </div>
              <span className="text-[11px] text-gray-400 font-mono">
                {settings.backgroundColor}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {BACKGROUND_TONE_PRESETS.map((preset) => {
                const isSelected = settings.backgroundColor.toLowerCase() === preset.bg.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...settings,
                        backgroundColor: preset.bg,
                        backgroundTone: preset.id as any,
                      })
                    }
                    className={`p-3 rounded-2xl border flex items-center space-x-3 text-left transition relative ${
                      isSelected
                        ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: preset.bg }}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-black/10 shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: preset.bg }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-emerald-700" />}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-gray-900 truncate">{preset.label}</p>
                      <p className="text-[10px] text-gray-500 truncate">{preset.labelKh}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Input */}
            <div className="flex items-center space-x-3 pt-1">
              <label className="text-[11px] font-semibold text-gray-500">
                {lang === 'kh' ? 'ពណ៌ផ្សេងទៀត (Custom Hex):' : 'Custom Background Hex:'}
              </label>
              <input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    backgroundColor: e.target.value,
                    backgroundTone: 'custom',
                  })
                }
                className="w-7 h-7 rounded-lg border border-gray-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={settings.backgroundColor}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    backgroundColor: e.target.value,
                    backgroundTone: 'custom',
                  })
                }
                className="w-24 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg font-mono text-xs uppercase"
              />
            </div>
          </div>

          {/* 2. Official Watermark Overlay */}
          <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-200/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs uppercase tracking-wider text-gray-900">
                  {lang === 'kh' ? 'ឡូហ្គោទឹកលើផ្ទៃក្រដាស (Watermark Overlay)' : 'Document Watermark Overlay'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showWatermark}
                  onChange={(e) => onChange({ ...settings, showWatermark: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {settings.showWatermark && (
              <div className="space-y-3 pt-1 border-t border-gray-200/60">
                {/* Watermark Preset Buttons */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1.5">
                    {lang === 'kh' ? 'អត្ថបទគំរូឡូហ្គោទឹក' : 'Watermark Presets'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {WATERMARK_PRESETS.filter((p) => p.id !== 'NONE').map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onChange({ ...settings, watermarkText: p.text })}
                        className={`px-2.5 py-1.5 rounded-xl border text-left text-[11px] font-bold transition truncate ${
                          settings.watermarkText === p.text
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Watermark Text */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    {lang === 'kh' ? 'អក្សរឡូហ្គោទឹកដោយខ្លួនឯង' : 'Custom Watermark Text'}
                  </label>
                  <input
                    type="text"
                    value={settings.watermarkText}
                    onChange={(e) => onChange({ ...settings, watermarkText: e.target.value })}
                    placeholder="e.g. ច្បាប់ដើម • ORIGINAL"
                    className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl font-bold text-xs"
                  />
                </div>

                {/* Watermark Opacity & Color */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-gray-600 mb-1">
                      <span>{lang === 'kh' ? 'កម្រិតព្រាល (Opacity)' : 'Watermark Opacity'}</span>
                      <span className="font-mono text-emerald-700 font-bold">
                        {Math.round(settings.watermarkOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.03"
                      max="0.25"
                      step="0.01"
                      value={settings.watermarkOpacity}
                      onChange={(e) => onChange({ ...settings, watermarkOpacity: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                      {lang === 'kh' ? 'ពណ៌ឡូហ្គោទឹក' : 'Watermark Tone Color'}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={settings.watermarkColor}
                        onChange={(e) => onChange({ ...settings, watermarkColor: e.target.value })}
                        className="w-7 h-7 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                      />
                      <span className="font-mono text-[11px] text-gray-500">{settings.watermarkColor}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Official Tax Stamp / Seal */}
          <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-200/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Stamp className="w-4 h-4 text-rose-600" />
                <span className="font-bold text-xs uppercase tracking-wider text-gray-900">
                  {lang === 'kh' ? 'ត្រាក្រហមផ្លូវការ (Official Cambodia GDT Seal)' : 'Official GDT Fiscal Rubber Stamp'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showOfficialStamp}
                  onChange={(e) => onChange({ ...settings, showOfficialStamp: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {settings.showOfficialStamp && (
              <div className="space-y-3 pt-1 border-t border-gray-200/60">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1.5">
                    {lang === 'kh' ? 'ប្រភេទត្រាអនុម័ត' : 'Stamp Status Text'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'PAID', label: 'PAID (បានទូទាត់)' },
                      { id: 'VERIFIED', label: 'VERIFIED (ផ្ទៀងផ្ទាត់)' },
                      { id: 'APPROVED', label: 'APPROVED (អនុម័ត)' },
                      { id: 'OFFICIAL', label: 'OFFICIAL (ផ្លូវការ)' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => onChange({ ...settings, stampType: st.id as any })}
                        className={`p-2 rounded-xl border text-center text-[11px] font-bold transition ${
                          settings.stampType === st.id
                            ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <label className="text-[11px] font-semibold text-gray-600">
                    {lang === 'kh' ? 'ពណ៌ទឹកថ្នាំត្រា' : 'Stamp Ink Color:'}
                  </label>
                  <input
                    type="color"
                    value={settings.stampColor}
                    onChange={(e) => onChange({ ...settings, stampColor: e.target.value })}
                    className="w-7 h-7 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                  />
                  <span className="font-mono text-[11px] text-gray-500">{settings.stampColor}</span>
                </div>
              </div>
            )}
          </div>

          {/* 4. Branding & Accent Colors */}
          <div className="space-y-2.5">
            <span className="font-bold text-xs uppercase tracking-wider text-gray-900 block">
              {lang === 'kh' ? 'ពណ៌ប្រធានបទម៉ាកយីហោ (Branding Palette)' : 'Header & Accent Theme'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {THEME_COLOR_PRESETS.map((t) => {
                const isSelected = settings.primaryColor === t.primary;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...settings,
                        primaryColor: t.primary,
                        headerBg: t.bg,
                      })
                    }
                    className={`p-2.5 rounded-xl border flex items-center space-x-2.5 text-left transition ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: t.primary }}
                    />
                    <span className="font-bold text-xs text-gray-800">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Document & Layout Controls */}
          <div className="space-y-2.5">
            <span className="font-bold text-xs uppercase tracking-wider text-gray-900 block">
              {lang === 'kh' ? 'ទម្រង់ និងធាតុបន្ថែម (Document & Layout Elements)' : 'Document & Layout Options'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                <div>
                  <p className="font-bold text-xs text-gray-900">National Kingdom Header</p>
                  <p className="text-[10px] text-gray-500">ព្រះរាជាណាចក្រកម្ពុជា ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showNationalHeader}
                  onChange={(e) => onChange({ ...settings, showNationalHeader: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                <div>
                  <p className="font-bold text-xs text-gray-900">Dual Currency (USD + KHR)</p>
                  <p className="text-[10px] text-gray-500">Auto convert at official exchange rate</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showDualCurrency}
                  onChange={(e) => onChange({ ...settings, showDualCurrency: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                <div>
                  <p className="font-bold text-xs text-gray-900">Bakong KHQR / Verification</p>
                  <p className="text-[10px] text-gray-500">QR code for instant payment & verification</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showPaymentQr}
                  onChange={(e) => onChange({ ...settings, showPaymentQr: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                <div>
                  <p className="font-bold text-xs text-gray-900">Signature & Official Stamp Lines</p>
                  <p className="text-[10px] text-gray-500">Buyer and Seller authorization signatures</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showSignatures}
                  onChange={(e) => onChange({ ...settings, showSignatures: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/70">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'kh' ? 'កំណត់ឡើងវិញ' : 'Reset Defaults'}</span>
          </button>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition"
            >
              {lang === 'kh' ? 'បិទ' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSaveAsDefault}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition"
            >
              <Check className="w-4 h-4" />
              <span>{lang === 'kh' ? 'រក្សាទុកជាទម្រង់ដើម' : 'Save as Default'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
