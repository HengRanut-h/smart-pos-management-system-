import React, { useState } from 'react';
import { LifeBuoy, X, Send, AlertCircle } from 'lucide-react';
import { Delivery } from '../../foundation/types/delivery';

interface DeliveryTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  onSubmit: (payload: { issue_type: string; priority: string; description: string }) => Promise<void>;
}

export const DeliveryTicketModal: React.FC<DeliveryTicketModalProps> = ({
  isOpen,
  onClose,
  delivery,
  onSubmit,
}) => {
  const [issueType, setIssueType] = useState('LATE_DELIVERY');
  const [priority, setPriority] = useState('HIGH');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !delivery) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide issue details');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        issue_type: issueType,
        priority,
        description: description.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-rose-600 to-red-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Open Support Ticket</h3>
              <p className="text-xs text-white/80">{delivery.delivery_number} &bull; {delivery.recipient_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Issue Category</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white font-medium"
            >
              <option value="LATE_DELIVERY">Late Delivery / Traffic Delay</option>
              <option value="DAMAGED_PACKAGE">Damaged Package / Spill</option>
              <option value="WRONG_ITEMS">Wrong Items In Bag</option>
              <option value="PAYMENT_DISPUTE">COD / Payment Dispute</option>
              <option value="RIDER_UNREACHABLE">Rider Unreachable / Lost</option>
              <option value="CUSTOMER_UNREACHABLE">Customer Not Answering Gate</option>
              <option value="OTHER">Other Discrepancy</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {(['LOW', 'MEDIUM', 'URGENT'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={'py-2 text-xs font-bold rounded-xl border transition cursor-pointer ' + (
                    priority === p
                      ? p === 'URGENT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Incident Notes / Customer Details</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem, caller name, or what resolution is needed..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Logging...' : 'Submit Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
