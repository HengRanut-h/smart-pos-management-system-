import React, { useState } from 'react';
import { X, Hash, Check } from 'lucide-react';
import { EnterpriseProduct } from '../../foundation/types/productEnterprise';
import { productEnterpriseApi } from '../../data-access/productEnterpriseApi';
import { useApp } from '../../application/context/AppContext';

interface SerialNumberModalProps {
  product: EnterpriseProduct;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const SerialNumberModal: React.FC<SerialNumberModalProps> = ({
  product,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { lang, notify } = useApp();
  const [serialNumber, setSerialNumber] = useState(`SN-${product.sku || 'ITEM'}-${Math.floor(100000 + Math.random() * 900000)}`);
  const [imei, setImei] = useState(`86${Math.floor(1000000000000 + Math.random() * 9000000000000)}`);
  const [macAddress, setMacAddress] = useState('00:1B:44:11:3A:B7');
  const [warrantyMonths, setWarrantyMonths] = useState(12);
  const [status, setStatus] = useState<'AVAILABLE' | 'ALLOCATED' | 'SOLD' | 'DEFECTIVE'>('AVAILABLE');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await productEnterpriseApi.saveSerialNumber({
        product_id: product.id,
        serial_number: serialNumber,
        imei,
        mac_address: macAddress,
        warranty_months: warrantyMonths,
        status,
      });
      notify.success(
        lang === 'kh' ? `បានចុះបញ្ជីលេខស៊េរី "${serialNumber}" ជោគជ័យ!` : `Serial number "${serialNumber}" registered successfully!`,
        'Serial Number Saved'
      );
      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      notify.error(err?.response?.data?.message || 'Error registering serial number');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-cyan-50 via-white to-blue-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-cyan-600 text-white rounded-xl shadow-md">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {lang === 'kh' ? 'ចុះបញ្ជីលេខស៊េរី \u0026 IMEI' : 'Serial \u0026 IMEI Register'}
              </h3>
              <p className="text-xs text-gray-500">
                {lang === 'kh' ? 'ទំនិញ៖' : 'Product:'} {product.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {lang === 'kh' ? 'លេខស៊េរី (មិនច្រឡំគ្នា)' : 'Serial Number (Unique)'}
            </label>
            <input
              type="text"
              value={serialNumber}
              onChange={e => setSerialNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {lang === 'kh' ? 'លេខ IMEI (ជម្រើស)' : 'IMEI Number (Optional)'}
            </label>
            <input
              type="text"
              value={imei}
              onChange={e => setImei(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {lang === 'kh' ? 'អាសយដ្ឋាន MAC (ជម្រើស)' : 'MAC Address (Optional)'}
            </label>
            <input
              type="text"
              value={macAddress}
              onChange={e => setMacAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {lang === 'kh' ? 'ធានា (ខែ)' : 'Warranty (Months)'}
              </label>
              <input
                type="number"
                value={warrantyMonths}
                onChange={e => setWarrantyMonths(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {lang === 'kh' ? 'ស្ថានភាព' : 'Status'}
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none bg-white"
              >
                <option value="AVAILABLE">{lang === 'kh' ? 'ទំនេរអាចលក់បាន' : 'AVAILABLE'}</option>
                <option value="ALLOCATED">{lang === 'kh' ? 'បានបែងចែក' : 'ALLOCATED'}</option>
                <option value="SOLD">{lang === 'kh' ? 'បានលក់រួច' : 'SOLD'}</option>
                <option value="DEFECTIVE">{lang === 'kh' ? 'ខូច/មានបញ្ហា' : 'DEFECTIVE'}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg">
            {lang === 'kh' ? 'បោះបង់' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 rounded-lg shadow-md flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>
              {isSaving
                ? (lang === 'kh' ? 'កំពុងរក្សាទុក...' : 'Saving...')
                : (lang === 'kh' ? 'ចុះបញ្ជីលេខស៊េរី' : 'Register Serial')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
