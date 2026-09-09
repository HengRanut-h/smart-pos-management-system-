import React, { useState, useRef } from 'react';
import { X, CheckCircle, PenTool, Camera, KeyRound, AlertCircle } from 'lucide-react';
import { Delivery } from '../../foundation/types/delivery';
import { submitProofOfDelivery } from '../../data-access/deliveryApi';
import { useApp } from '../../application/context/AppContext';

interface ProofOfDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  delivery: Delivery | null;
}

export const ProofOfDeliveryModal: React.FC<ProofOfDeliveryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  delivery,
}) => {
  const { lang, notify } = useApp();
  const [receiverName, setReceiverName] = useState(delivery?.recipient_name || '');
  const [relationship, setRelationship] = useState('SELF');
  const [otpCode, setOtpCode] = useState('');
  const [codCollected, setCodCollected] = useState<number>(Number(delivery?.cod_amount_due) || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Digital Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  if (!isOpen || !delivery) return null;

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverName.trim()) {
      setError('Please provide receiver name.');
      return;
    }

    let sigDataUrl = undefined;
    if (canvasRef.current && hasSignature) {
      sigDataUrl = canvasRef.current.toDataURL('image/png');
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await submitProofOfDelivery(delivery.id, {
        receiver_name: receiverName,
        receiver_relationship: relationship,
        signature_image_url: sigDataUrl,
        otp_code: otpCode || undefined,
        cod_collected: delivery.payment_type === 'COD' ? codCollected : 0,
      });

      notify.success(
        lang === 'kh' ? 'ភស្តុតាងនៃការប្រគល់ត្រូវបានបញ្ជូនដោយជោគជ័យ!' : 'Proof of delivery submitted successfully!',
        lang === 'kh' ? 'ដឹកជញ្ជូនរួចរាល់' : 'Delivery Complete'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || (lang === 'kh' ? 'បរាជ័យក្នុងការបញ្ជូនភស្តុតាងប្រគល់ទំនិញ' : 'Failed to submit proof of delivery.');
      setError(errMsg);
      notify.error(errMsg, lang === 'kh' ? 'កំហុស' : 'Delivery Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Proof of Delivery (POD)</h2>
              <p className="text-[11px] text-slate-400">{delivery.delivery_number}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-700 block mb-1">Receiver Name *</label>
              <input
                type="text"
                required
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Receiver name"
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-700 block mb-1">Relationship</label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="SELF">Self (Recipient)</option>
                <option value="FAMILY">Family Member</option>
                <option value="RECEPTIONIST">Receptionist / Desk</option>
                <option value="SECURITY">Security Guard</option>
                <option value="NEIGHBOR">Neighbor</option>
              </select>
            </div>
          </div>

          {delivery.payment_type === 'COD' && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl">
              <label className="text-[11px] font-bold text-amber-900 block mb-1">COD Cash Collected ($)</label>
              <input
                type="number"
                step="0.01"
                value={codCollected}
                onChange={(e) => setCodCollected(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono font-bold text-amber-900 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-amber-700 block mt-1">Due: ${Number(delivery.cod_amount_due).toFixed(2)} USD</span>
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-gray-700 block mb-1">Customer OTP / Passcode (Optional)</label>
            <div className="flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="4-digit OTP from customer SMS"
                className="flex-1 px-3 py-2 text-xs font-mono tracking-wider rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-gray-700 flex items-center gap-1">
                <PenTool className="w-3.5 h-3.5 text-emerald-600" />
                Digital Signature Capture
              </label>
              <button
                type="button"
                onClick={clearSignature}
                className="text-[10px] text-rose-500 hover:underline font-semibold"
              >
                Clear Pad
              </button>
            </div>

            <div className="border border-gray-300 rounded-2xl overflow-hidden bg-slate-50 relative touch-none">
              <canvas
                ref={canvasRef}
                width={440}
                height={140}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
                className="w-full h-36 cursor-crosshair bg-white"
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-xs font-medium">
                  Draw customer signature here
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="p-4 border-t border-gray-100 flex justify-end space-x-2 bg-gray-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Complete & Mark Delivered'}
          </button>
        </div>
      </div>
    </div>
  );
};
