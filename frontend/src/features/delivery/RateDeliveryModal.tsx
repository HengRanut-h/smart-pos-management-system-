import React, { useState } from 'react';
import { Star, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Delivery } from '../../foundation/types/delivery';

interface RateDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
  onSubmit: (payload: {
    overall_rating: number;
    driver_rating: number;
    speed_rating: number;
    communication_rating: number;
    package_rating: number;
    review_text?: string;
  }) => Promise<void>;
}

export const RateDeliveryModal: React.FC<RateDeliveryModalProps> = ({
  isOpen,
  onClose,
  delivery,
  onSubmit,
}) => {
  const [overall, setOverall] = useState(5);
  const [driverScore, setDriverScore] = useState(5);
  const [speedScore, setSpeedScore] = useState(5);
  const [commScore, setCommScore] = useState(5);
  const [packageScore, setPackageScore] = useState(5);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !delivery) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        overall_rating: overall,
        driver_rating: driverScore,
        speed_rating: speedScore,
        communication_rating: commScore,
        package_rating: packageScore,
        review_text: review.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (current: number, setter: (val: number) => void) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setter(star)}
          className="p-1 hover:scale-110 transition cursor-pointer"
        >
          <Star
            className={'w-5 h-5 ' + (
              star <= current ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            )}
          />
        </button>
      ))}
      <span className="text-xs font-bold text-gray-700 ml-1.5">{current}.0</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Star className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Rate Delivery Service</h3>
              <p className="text-xs text-white/80">{delivery.delivery_number} &bull; {delivery.driver?.name || 'Assigned Rider'}</p>
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

          <div className="space-y-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">⭐ Overall Experience</span>
              {renderStars(overall, setOverall)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">🏍️ Driver Courteousness</span>
              {renderStars(driverScore, setDriverScore)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">⚡ Delivery Speed</span>
              {renderStars(speedScore, setSpeedScore)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">📞 Communication</span>
              {renderStars(commScore, setCommScore)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">📦 Package Condition</span>
              {renderStars(packageScore, setPackageScore)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Review Notes</label>
            <textarea
              rows={3}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="e.g. Prompt arrival, driver was polite and called ahead..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Submit Rating'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
