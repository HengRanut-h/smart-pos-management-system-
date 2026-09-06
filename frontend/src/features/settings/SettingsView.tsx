import { SmartPosLogo } from '../../presentation/components/SmartPosLogo';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../application/context/AppContext';
import { SystemSettings } from '../../foundation/types';
import { getSystemSettings, updateSystemSettings } from '../../data-access/posApi';
import {
  Settings,
  Building2,
  DollarSign,
  Printer,
  QrCode,
  Save,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { lang, setLang } = useApp();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getSystemSettings();
      setSettings(data);
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
      await updateSystemSettings(settings);
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
    </div>
  );
};
