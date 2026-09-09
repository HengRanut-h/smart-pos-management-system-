import React, { useState, useEffect, useMemo } from 'react';
import {
  QrCode,
  Plus,
  RefreshCw,
  Printer,
  Download,
  Search,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Eye,
  ShieldCheck,
  Filter,
  Copy,
  Check,
  X,
  ArrowLeft
} from 'lucide-react';
import {
  getAttendanceQrCodes,
  createAttendanceQrCode,
  regenerateAttendanceQrCode,
  updateAttendanceQrCodeStatus,
  deleteAttendanceQrCode
} from '../../data-access/posApi';
import { AttendanceQrCode } from '../../foundation/types';
import { useApp } from '../../application/context/AppContext';

interface StoreQrManagementViewProps {
  onBack?: () => void;
}

export const StoreQrManagementView: React.FC<StoreQrManagementViewProps> = ({ onBack }) => {
  const { lang, notify } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [qrCodes, setQrCodes] = useState<AttendanceQrCode[]>([]);
  const [stores, setStores] = useState<any[]>([]);

  // Filter state
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [previewQrCode, setPreviewQrCode] = useState<AttendanceQrCode | null>(null);

  // Create form state
  const [newStoreId, setNewStoreId] = useState<number>(1);
  const [newName, setNewName] = useState<string>('');
  const [newExpiresAt, setNewExpiresAt] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Copy notification
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAttendanceQrCodes();
      if (res.success) {
        setQrCodes(res.data);
        setStores(res.stores || []);
        if (res.stores && res.stores.length > 0) {
          setNewStoreId(res.stores[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch store QR codes', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreId) return;

    setIsSubmitting(true);
    try {
      const res = await createAttendanceQrCode({
        store_id: newStoreId,
        name: newName.trim() || undefined,
        expires_at: newExpiresAt || undefined,
      });

      if (res.success) {
        notify.success(
          lang === 'kh' ? 'កូដ QR ហាងត្រូវបានបង្កើតដោយជោគជ័យ!' : 'Store attendance QR code created successfully!',
          lang === 'kh' ? 'វត្តមាន QR' : 'Store QR'
        );
        setIsCreateModalOpen(false);
        setNewName('');
        setNewExpiresAt('');
        fetchData();
      } else {
        notify.error(res.message || (lang === 'kh' ? 'បរាជ័យក្នុងការបង្កើតកូដ QR' : 'Failed to create QR code'), lang === 'kh' ? 'កំហុស' : 'QR Error');
      }
    } catch (err: any) {
      console.error('Failed to create store QR code', err);
      notify.error(err.response?.data?.message || (lang === 'kh' ? 'បរាជ័យក្នុងការបង្កើតកូដ QR' : 'Failed to create QR code'), lang === 'kh' ? 'កំហុស' : 'QR Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerate = async (id: number) => {
    if (!window.confirm(lang === 'kh' ? 'តើអ្នកពិតជាចង់បង្កើតកូដ QR ថ្មីមែនទេ? កូដចាស់នឹងលែងដំណើរការទៀតហើយ។' : 'Regenerate secure QR token? The previous QR code will immediately become invalid for employee check-in.')) {
      return;
    }

    try {
      const res = await regenerateAttendanceQrCode(id);
      if (res.success) {
        notify.success(
          lang === 'kh' ? 'កូដសម្ងាត់ QR ត្រូវបានផ្លាស់ប្តូរថ្មីដោយជោគជ័យ!' : 'QR token regenerated successfully!',
          lang === 'kh' ? 'វត្តមាន QR' : 'QR Regenerated'
        );
        fetchData();
        if (previewQrCode && previewQrCode.id === id) {
          setPreviewQrCode(res.data);
        }
      } else {
        notify.error(res.message || (lang === 'kh' ? 'បរាជ័យក្នុងការបង្កើតកូដ QR ថ្មី' : 'Failed to regenerate QR token'), lang === 'kh' ? 'កំហុស' : 'QR Error');
      }
    } catch (err: any) {
      console.error('Failed to regenerate QR token', err);
      notify.error(err.response?.data?.message || (lang === 'kh' ? 'បរាជ័យក្នុងការបង្កើតកូដ QR ថ្មី' : 'Failed to regenerate QR token'), lang === 'kh' ? 'កំហុស' : 'QR Error');
    }
  };

  const handleToggleStatus = async (qr: AttendanceQrCode) => {
    const nextStatus = qr.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await updateAttendanceQrCodeStatus(qr.id, nextStatus);
      if (res.success) {
        notify.success(
          lang === 'kh' ? `ស្ថានភាពកូដ QR ត្រូវបានផ្លាស់ប្តូរទៅជា ${nextStatus}` : `QR code status updated to ${nextStatus}`,
          lang === 'kh' ? 'វត្តមាន QR' : 'QR Status'
        );
        fetchData();
      } else {
        notify.error(res.message || (lang === 'kh' ? 'បរាជ័យក្នុងការផ្លាស់ប្តូរស្ថានភាព' : 'Failed to update status'), lang === 'kh' ? 'កំហុស' : 'QR Error');
      }
    } catch (err: any) {
      console.error('Failed to update QR status', err);
      notify.error(err.response?.data?.message || (lang === 'kh' ? 'បរាជ័យក្នុងការផ្លាស់ប្តូរស្ថានភាព' : 'Failed to update status'), lang === 'kh' ? 'កំហុស' : 'QR Error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(lang === 'kh' ? 'តើអ្នកពិតជាចង់លុបកូដ QR នេះមែនទេ?' : 'Are you sure you want to delete this Store QR Code?')) {
      return;
    }

    try {
      const res = await deleteAttendanceQrCode(id);
      if (res.success) {
        notify.success(
          lang === 'kh' ? 'កូដ QR ហាងត្រូវបានលុបដោយជោគជ័យ!' : 'Store QR code deleted successfully!',
          lang === 'kh' ? 'លុបកូដ QR' : 'QR Deleted'
        );
        if (previewQrCode && previewQrCode.id === id) {
          setPreviewQrCode(null);
        }
        fetchData();
      } else {
        notify.error(res.message || (lang === 'kh' ? 'បរាជ័យក្នុងការលុបកូដ QR' : 'Failed to delete QR code'), lang === 'kh' ? 'កំហុស' : 'QR Error');
      }
    } catch (err: any) {
      console.error('Failed to delete QR code', err);
      notify.error(err.response?.data?.message || (lang === 'kh' ? 'បរាជ័យក្នុងការលុបកូដ QR' : 'Failed to delete QR code'), lang === 'kh' ? 'កំហុស' : 'QR Error');
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    notify.info(
      lang === 'kh' ? 'បានចម្លងកូដសម្ងាត់ Token រួចរាល់!' : 'QR security token copied to clipboard!',
      lang === 'kh' ? 'ចម្លង' : 'Copied'
    );
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Filtered List
  const filteredQrCodes = useMemo(() => {
    return qrCodes.filter((qr) => {
      if (selectedStoreId && qr.store_id !== Number(selectedStoreId)) return false;
      if (selectedStatus !== 'ALL' && qr.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (qr.name || '').toLowerCase();
        const token = (qr.qr_token || '').toLowerCase();
        const storeName = (qr.store?.name || '').toLowerCase();
        if (!name.includes(q) && !token.includes(q) && !storeName.includes(q)) return false;
      }
      return true;
    });
  }, [qrCodes, selectedStoreId, selectedStatus, searchQuery]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* 1. Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-md shadow-indigo-200">
            <QrCode className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {lang === 'kh' ? 'កូដ QR វត្តមានតាមហាង' : 'Store / Shop Attendance QR Codes'}
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                SECURE TOKENS
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {lang === 'kh' ? 'បង្កើត និងគ្រប់គ្រងកូដ QR សុវត្ថិភាពសម្រាប់បុគ្គលិកស្កេនវត្តមានតាមហាង' : 'Generate unique secure QR tokens per store, manage active standees, set expiration, and print posters'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-2xl text-sm shadow-lg shadow-indigo-200 flex items-center justify-center space-x-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'kh' ? 'បង្កើតកូដ QR ហាងថ្មី' : 'Create Store QR Code'}</span>
        </button>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-gray-600">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>{lang === 'kh' ? 'តម្រងស្វែងរក' : 'Filters & Search'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 max-w-3xl">
          {/* Store dropdown */}
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">{lang === 'kh' ? 'ហាងទាំងអស់ (All Stores)' : 'All Stores'}</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} - {s.name}
              </option>
            ))}
          </select>

          {/* Status dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">{lang === 'kh' ? 'គ្រប់ស្ថានភាព (All Statuses)' : 'All Statuses'}</option>
            <option value="ACTIVE">{lang === 'kh' ? 'កំពុងដំណើរការ (Active)' : 'Active Only'}</option>
            <option value="INACTIVE">{lang === 'kh' ? 'បិទដំណើរការ (Inactive)' : 'Inactive Only'}</option>
            <option value="EXPIRED">{lang === 'kh' ? 'ហួសកំណត់ (Expired)' : 'Expired Only'}</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={lang === 'kh' ? 'ស្វែងរកតាមឈ្មោះ ឬ កូដ...' : 'Search name or token...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 3. Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500">{lang === 'kh' ? 'កំពុងទាញយកទិន្នន័យកូដ QR...' : 'Loading Store QR Codes...'}</p>
        </div>
      ) : filteredQrCodes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
          <QrCode className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-sm font-semibold text-gray-700">
            {lang === 'kh' ? 'មិនទាន់មានកូដ QR ហាងនៅឡើយទេ' : 'No Store QR Codes found'}
          </p>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            {lang === 'kh' ? 'សូមចុចប៊ូតុង "បង្កើតកូដ QR ហាងថ្មី" ខាងលើដើម្បីបង្កើតកូដ QR សម្រាប់ច្រកចូលហាង។' : 'Click the button above to generate secure QR codes for your storefronts and entrance standees.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQrCodes.map((qr) => (
            <div
              key={qr.id}
              className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              {/* Card Top */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-gray-100 text-gray-700 rounded-md uppercase tracking-wider inline-flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-indigo-600" />
                      {qr.store?.code || 'HQ-01'}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 mt-1 line-clamp-1">{qr.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{qr.store?.name || 'SmartPOS Store'}</p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      qr.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : qr.status === 'EXPIRED'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {qr.status}
                  </span>
                </div>

                {/* QR Token Box */}
                <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <span>Secure Token</span>
                    <button
                      onClick={() => handleCopyToken(qr.qr_token)}
                      className="text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
                    >
                      {copiedToken === qr.qr_token ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-xs font-black text-indigo-900 break-all bg-white p-2 rounded-xl border border-gray-200">
                    {qr.qr_token}
                  </div>
                </div>

                {/* Meta stats */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{qr.total_scans || 0} scans</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">
                      {qr.expires_at ? new Date(qr.expires_at).toLocaleDateString() : 'Never expires'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-1.5">
                <button
                  onClick={() => setPreviewQrCode(qr)}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition flex-1 justify-center"
                  title="Preview & Print Standee Poster"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Standee</span>
                </button>

                <button
                  onClick={() => handleRegenerate(qr.id)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
                  title="Regenerate Secure Token"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                </button>

                <button
                  onClick={() => handleToggleStatus(qr)}
                  className={`p-2 rounded-xl transition ${
                    qr.status === 'ACTIVE'
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                  }`}
                  title={qr.status === 'ACTIVE' ? 'Deactivate QR' : 'Activate QR'}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(qr.id)}
                  className="p-2 bg-gray-100 hover:bg-rose-100 text-gray-500 hover:text-rose-600 rounded-xl transition"
                  title="Delete QR Code"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Create QR Code Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {lang === 'kh' ? 'បង្កើតកូដ QR ហាងថ្មី' : 'Create Store QR Code'}
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Select Store */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {lang === 'kh' ? 'ជ្រើសរើសហាង / សាខា *' : 'Select Store / Branch *'}
                </label>
                <select
                  value={newStoreId}
                  onChange={(e) => setNewStoreId(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:border-indigo-500"
                  required
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name} ({s.city || 'Store'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Name / Label */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {lang === 'kh' ? 'ឈ្មោះ ឬ ទីតាំង QR (ជម្រើស)' : 'QR Code Name / Label (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Front Gate Standee QR, Register 1 Standee"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {lang === 'kh' ? 'កាលបរិច្ឆេទផុតកំណត់ (ជម្រើស)' : 'Expiration Date (Optional)'}
                </label>
                <input
                  type="datetime-local"
                  value={newExpiresAt}
                  onChange={(e) => setNewExpiresAt(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">Leave empty for a permanent non-expiring QR code.</p>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Generating...' : 'Generate Secure QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. High-Resolution Poster Standee Preview Modal */}
      {previewQrCode && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => setPreviewQrCode(null)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition no-print"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Poster Container */}
            <div id="printable-qr-standee" className="p-6 border-4 border-indigo-600 rounded-3xl bg-gradient-to-b from-slate-900 to-indigo-950 text-white text-center space-y-6 shadow-xl">
              <div className="space-y-1">
                <div className="inline-block bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-400/30">
                  SMARTPOS STOREFRONT ATTENDANCE
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  {previewQrCode.store?.name || 'SmartPOS Official Storefront'}
                </h2>
                <p className="text-xs text-indigo-200 font-medium">
                  {previewQrCode.name}
                </p>
              </div>

              {/* QR Image Frame */}
              <div className="bg-white p-6 rounded-3xl inline-block shadow-2xl mx-auto border-4 border-indigo-400">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(previewQrCode.qr_token)}`}
                  alt="Storefront Attendance QR"
                  className="w-52 h-52 mx-auto object-contain"
                />
                <div className="mt-2 font-mono text-[11px] font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-lg break-all">
                  {previewQrCode.qr_token}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10 space-y-1 text-xs">
                <p className="font-bold text-emerald-400">
                  📲 STAFF INSTRUCTIONS:
                </p>
                <p className="text-slate-200 leading-snug">
                  1. Open Employee Portal on your Smartphone<br />
                  2. Go to Attendance → Scan Store QR<br />
                  3. Point Camera to Check In / Check Out instantly
                </p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between gap-3 no-print">
              <button
                onClick={() => handleRegenerate(previewQrCode.id)}
                className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-4 h-4 text-indigo-600" />
                <span>Regenerate Token</span>
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(previewQrCode.qr_token)}`}
                  target="_blank"
                  rel="noreferrer"
                  download="Storefront_Attendance_QR.png"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Image</span>
                </a>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Poster</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
