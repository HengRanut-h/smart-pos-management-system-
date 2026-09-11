import React, { useState, useEffect } from 'react';
import { StaffBadgeTemplate, StaffBadgeTemplateVersion, BadgeOrientation, BadgeCardSize, PhotoShape, BadgeBackDesign } from './types';
import { StaffBadgeCardPreview } from './StaffBadgeCardPreview';
import { saveStaffBadgeTemplate, restoreStaffBadgeTemplateVersion } from '../../data-access/posApi';
import { useApp } from '../../application/context/AppContext';
import {
  Save,
  Printer,
  Undo2,
  Layers,
  Palette,
  Sliders,
  Sparkles,
  History,
  X,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  CreditCard,
  Wifi,
  QrCode,
  Barcode,
  Image as ImageIcon,
  Check,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface StaffBadgeDesignerStudioProps {
  template: StaffBadgeTemplate;
  onSave: (updated: StaffBadgeTemplate) => void;
  onBackToList: () => void;
}

export const StaffBadgeDesignerStudio: React.FC<StaffBadgeDesignerStudioProps> = ({
  template,
  onSave,
  onBackToList,
}) => {
  const { lang, notify } = useApp();

  const [activeTab, setActiveTab] = useState<'LAYOUT' | 'STYLING' | 'BACK_SIDE' | 'VERSIONS'>('LAYOUT');
  const [activeSide, setActiveSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [zoom, setZoom] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');
  const [isMobileInspectorOpen, setIsMobileInspectorOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setZoom(0.75);
    }
  }, []);

  // Local Template Editing State
  const [name, setName] = useState(template.name);
  const [badgeType, setBadgeType] = useState(template.badge_type || 'STAFF');
  const [orientation, setOrientation] = useState<BadgeOrientation>(template.orientation || 'VERTICAL');
  const [cardSize, setCardSize] = useState<BadgeCardSize>(template.card_size || 'CR80_PVC');
  const [isDefault, setIsDefault] = useState(template.is_default || false);

  const [frontDesign, setFrontDesign] = useState(template.front_design);
  const [backDesign, setBackDesign] = useState<BadgeBackDesign>(template.back_design || {
    background_color: '#ffffff',
    text_color: '#1e293b',
    instructions: "This card is the property of SmartPOS Solutions Co., Ltd.\nIf found, please return to any SmartPOS branch or call +855 23 999 888.\nUnauthorized use or duplication is strictly prohibited.",
    instructions_kh: "ប័ណ្ណសម្គាល់ខ្លួននេះជាកម្មសិទ្ធិរបស់ក្រុមហ៊ុន ស្មាតភីអូអេស។ បើបានរើសបាន សូមប្រគល់ជូនសាខាជិតបំផុត។",
    show_emergency_contact: true,
    emergency_phone: '+855 12 999 111',
    show_barcode: true,
    barcode_type: 'CODE_128' as const,
    show_signature_strip: true,
  });

  // Background Presets
  const bgPresets = [
    { label: 'Executive Navy', gradient: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)', theme: '#1e3a8a', accent: '#f59e0b' },
    { label: 'Retail Emerald', gradient: 'linear-gradient(135deg, #065f46 0%, #047857 100%)', theme: '#059669', accent: '#10b981' },
    { label: 'Warehouse Amber', gradient: 'linear-gradient(180deg, #b45309 0%, #1e293b 100%)', theme: '#d97706', accent: '#f59e0b' },
    { label: 'Charcoal Minimal', gradient: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)', theme: '#1e293b', accent: '#38bdf8' },
    { label: 'Crimson Luxury', gradient: 'linear-gradient(135deg, #881337 0%, #4c0519 100%)', theme: '#9f1239', accent: '#fbbf24' },
    { label: 'Clean White / Light', gradient: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', theme: '#0f172a', accent: '#059669' },
  ];

  const currentTemplateState: StaffBadgeTemplate = {
    ...template,
    name,
    badge_type: badgeType,
    orientation,
    card_size: cardSize,
    is_default: isDefault,
    front_design: frontDesign,
    back_design: backDesign,
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        name,
        code: template.code,
        badge_type: badgeType,
        orientation,
        card_size: cardSize,
        is_default: isDefault,
        front_design: frontDesign,
        back_design: backDesign,
        change_summary: changeSummary.trim() || 'Updated in Staff Badge Designer Studio',
      };

      const res = await saveStaffBadgeTemplate(payload, template.id);
      notify.success(
        lang === 'kh'
          ? 'គំរូប័ណ្ណបុគ្គលិកត្រូវបានរក្សាទុកជោគជ័យ!'
          : 'Staff badge template saved and version recorded!',
        'Template Saved'
      );
      setChangeSummary('');
      if (res.data) onSave(res.data);
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to save badge template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreVersion = async (versionId: number) => {
    try {
      const res = await restoreStaffBadgeTemplateVersion(template.id, versionId);
      notify.success(lang === 'kh' ? 'បានស្ដារកំណែមុនជោគជ័យ!' : 'Restored previous template version!');
      if (res.data) {
        setFrontDesign(res.data.front_design);
        if (res.data.back_design) setBackDesign(res.data.back_design);
      }
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to restore template version');
    }
  };

  const handleTestPrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] bg-slate-100 font-sans select-none overflow-hidden">
      {/* Studio Header */}
      <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between z-30 shrink-0 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToList}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition"
            title="Back to Badges Hub"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-black text-base text-gray-900 bg-transparent hover:bg-gray-100 px-2 py-0.5 rounded-lg border border-transparent focus:border-emerald-500 focus:bg-white focus:outline-hidden transition"
              />
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                Visual Studio
              </span>
            </div>
            <p className="text-[11px] text-gray-500 px-2">
              {template.code} • {orientation} {cardSize}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Default Badge Toggle */}
          <label className="flex items-center space-x-1.5 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <span className="font-semibold">{lang === 'kh' ? 'គំរូដើម' : 'Default Template'}</span>
          </label>

          {/* Test Print */}
          <button
            onClick={handleTestPrint}
            className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            <span>Test Print</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save & Publish'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Visual Interactive Preview Stage */}
        <div className="flex-1 flex flex-col items-center justify-between p-6 overflow-y-auto relative bg-slate-900/5 backdrop-blur-xs">
          {/* Stage Controls Toolbar */}
          <div className="flex items-center justify-between w-full max-w-xl bg-white/90 backdrop-blur-md p-2 rounded-2xl border border-gray-200 shadow-sm z-20">
            {/* Front / Back Toggle */}
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveSide('FRONT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeSide === 'FRONT' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Front Side
              </button>
              <button
                onClick={() => setActiveSide('BACK')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeSide === 'BACK' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Back Side
              </button>
            </div>

            {/* Orientation Quick Switcher */}
            <div className="flex items-center space-x-2 text-xs font-semibold text-gray-600">
              <button
                onClick={() => setOrientation(orientation === 'VERTICAL' ? 'HORIZONTAL' : 'VERTICAL')}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                ↻ Rotate ({orientation})
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold w-12 text-center text-gray-700">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Real-time Badge Preview Canvas */}
          <div className="my-auto py-8 flex items-center justify-center">
            <StaffBadgeCardPreview
              template={currentTemplateState}
              side={activeSide}
              scale={zoom}
              showLanyardHole={true}
            />
          </div>

          {/* Footer Guide Note */}
          <div className="text-center text-[11px] text-gray-400">
            Standard CR80 PVC (85.60 × 53.98 mm) • Dynamic employee variables automatically populate when printed
          </div>

          {/* Mobile Bottom Sheet Trigger Button */}
          <div className="lg:hidden w-full max-w-sm mt-3 px-2 z-20">
            <button
              type="button"
              onClick={() => setIsMobileInspectorOpen(true)}
              className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl flex items-center justify-center space-x-2 active:scale-98 transition cursor-pointer"
            >
              <Palette className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'kh' ? 'កែប្រែទម្រង់ & ការរចនា' : 'Customize Design & Elements'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Backdrop */}
        {isMobileInspectorOpen && (
          <div
            onClick={() => setIsMobileInspectorOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          />
        )}

        {/* Right Side / Mobile Bottom Drawer: Configuration Inspector Tabs */}
        <aside
          className={`bg-white border-l border-gray-200 flex flex-col shrink-0 shadow-2xl lg:shadow-lg transition-transform duration-300 z-50 lg:z-20 ${
            isMobileInspectorOpen
              ? 'fixed inset-x-0 bottom-0 top-16 rounded-t-3xl border-t lg:static lg:top-0 lg:rounded-none lg:border-t-0 w-full lg:w-96'
              : 'hidden lg:flex lg:w-96'
          }`}
        >
          {/* Mobile Drawer Header with Close Button */}
          <div className="lg:hidden p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-3xl">
            <span className="font-bold text-xs text-gray-800 flex items-center space-x-2">
              <Palette className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'kh' ? 'កែប្រែទម្រង់ប័ណ្ណ' : 'Badge Customizer'}</span>
            </span>
            <button
              onClick={() => setIsMobileInspectorOpen(false)}
              className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-500 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-100 bg-gray-50/70 p-1.5 gap-1 shrink-0">
            {[
              { id: 'LAYOUT', label: 'Layout', icon: <Layers className="w-3.5 h-3.5" /> },
              { id: 'STYLING', label: 'Styles', icon: <Palette className="w-3.5 h-3.5" /> },
              { id: 'BACK_SIDE', label: 'Back Side', icon: <CreditCard className="w-3.5 h-3.5" /> },
              { id: 'VERSIONS', label: 'History', icon: <History className="w-3.5 h-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                  activeTab === tab.id
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-gray-700">
            {/* TAB 1: LAYOUT */}
            {activeTab === 'LAYOUT' && (
              <div className="space-y-4">
                {/* Badge Type */}
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Badge Classification
                  </label>
                  <select
                    value={badgeType}
                    onChange={(e) => setBadgeType(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs"
                  >
                    <option value="STAFF">STAFF (បុគ្គលិកទូទៅ)</option>
                    <option value="MANAGER">MANAGER (ប្រធានគ្រប់គ្រង)</option>
                    <option value="CASHIER">CASHIER (បេឡាករ)</option>
                    <option value="WAREHOUSE">WAREHOUSE (ឃ្លាំង & ភស្តុភារ)</option>
                    <option value="DRIVER">DRIVER (អ្នកដឹកជញ្ជូន)</option>
                    <option value="SECURITY">SECURITY (សន្តិសុខ)</option>
                    <option value="CONTRACTOR">CONTRACTOR (អ្នកម៉ៅការ)</option>
                    <option value="VISITOR">VISITOR (ភ្ញៀវបណ្តោះអាសន្ន)</option>
                  </select>
                </div>

                {/* Card Orientation & Size */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Orientation
                    </label>
                    <select
                      value={orientation}
                      onChange={(e) => setOrientation(e.target.value as any)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs"
                    >
                      <option value="VERTICAL">Vertical (បញ្ឈរ)</option>
                      <option value="HORIZONTAL">Horizontal (ផ្តេក)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Card Size
                    </label>
                    <select
                      value={cardSize}
                      onChange={(e) => setCardSize(e.target.value as any)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs"
                    >
                      <option value="CR80_PVC">CR80 PVC (85.6 × 54 mm)</option>
                      <option value="LANYARD_CARD">Lanyard (70 × 100 mm)</option>
                    </select>
                  </div>
                </div>

                {/* Header Text */}
                <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider">
                    Badge Header Strip
                  </span>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 block mb-1">Khmer Title</label>
                    <input
                      type="text"
                      value={frontDesign.header_text_kh || ''}
                      onChange={(e) => setFrontDesign({ ...frontDesign, header_text_kh: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 block mb-1">English Title</label>
                    <input
                      type="text"
                      value={frontDesign.header_text || ''}
                      onChange={(e) => setFrontDesign({ ...frontDesign, header_text: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Visible Elements Toggles */}
                <div className="space-y-2">
                  <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider">
                    Element Visibility
                  </span>

                  {[
                    { key: 'show_logo', label: 'Company Logo Badge' },
                    { key: 'show_qr_code', label: 'Scannable QR Code Token' },
                    { key: 'show_barcode', label: 'Code 128 Linear Barcode' },
                    { key: 'show_nfc_badge', label: 'NFC / RFID Chip Indicator' },
                    { key: 'show_security_watermark', label: 'Security Micro-watermark' },
                  ].map((el) => (
                    <label
                      key={el.key}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition"
                    >
                      <span className="font-bold text-xs text-gray-800">{el.label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean((frontDesign as any)[el.key])}
                        onChange={(e) => setFrontDesign({ ...frontDesign, [el.key]: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: STYLING */}
            {activeTab === 'STYLING' && (
              <div className="space-y-4">
                {/* Background Theme Presets */}
                <div>
                  <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider mb-2">
                    Card Background Palette
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {bgPresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          setFrontDesign({
                            ...frontDesign,
                            background_gradient: preset.gradient,
                            theme_color: preset.theme,
                            accent_color: preset.accent,
                          })
                        }
                        className={`p-2.5 rounded-xl border flex items-center space-x-2 text-left transition ${
                          frontDesign.background_gradient === preset.gradient
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-lg shrink-0 shadow-xs"
                          style={{ background: preset.gradient }}
                        />
                        <span className="font-bold text-[11px] truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Staff Photo Styling */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider">
                    Staff Photo Styling
                  </span>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 block mb-1.5">Photo Frame Shape</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['circle', 'rounded', 'square'] as PhotoShape[]).map((shape) => (
                        <button
                          key={shape}
                          type="button"
                          onClick={() => setFrontDesign({ ...frontDesign, photo_shape: shape })}
                          className={`p-2 rounded-xl border text-center text-xs font-bold uppercase transition ${
                            frontDesign.photo_shape === shape
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-gray-700 border-gray-200'
                          }`}
                        >
                          {shape}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">Border Width</label>
                      <input
                        type="range"
                        min="0"
                        max="6"
                        value={frontDesign.photo_border_width}
                        onChange={(e) =>
                          setFrontDesign({ ...frontDesign, photo_border_width: Number(e.target.value) })
                        }
                        className="w-full accent-emerald-600"
                      />
                      <span className="text-[10px] text-gray-500 font-mono">{frontDesign.photo_border_width}px</span>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 block mb-1">Border Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={frontDesign.photo_border_color}
                          onChange={(e) =>
                            setFrontDesign({ ...frontDesign, photo_border_color: e.target.value })
                          }
                          className="w-7 h-7 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                        />
                        <span className="font-mono text-[11px] text-gray-600">{frontDesign.photo_border_color}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typography & Fonts */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider">
                    Typography & Fonts
                  </span>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 block mb-1">Card Font</label>
                    <select
                      value={frontDesign.font_family}
                      onChange={(e) => setFrontDesign({ ...frontDesign, font_family: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold text-xs"
                    >
                      <option value="Battambang, sans-serif">Khmer Battambang (Official Clean)</option>
                      <option value="Hanuman, serif">Khmer Hanuman (Traditional Serif)</option>
                      <option value="Inter, sans-serif">Inter Modern Sans-Serif</option>
                      <option value="monospace">Monospace Security Font</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: BACK SIDE */}
            {activeTab === 'BACK_SIDE' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Return Instructions (Khmer)
                  </label>
                  <textarea
                    rows={3}
                    value={backDesign.instructions_kh || ''}
                    onChange={(e) => setBackDesign({ ...backDesign, instructions_kh: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Return Instructions (English)
                  </label>
                  <textarea
                    rows={3}
                    value={backDesign.instructions || ''}
                    onChange={(e) => setBackDesign({ ...backDesign, instructions: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="text"
                    value={backDesign.emergency_phone || ''}
                    onChange={(e) => setBackDesign({ ...backDesign, emergency_phone: e.target.value })}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                    <span className="font-bold text-xs text-gray-800">Cardholder Signature Strip</span>
                    <input
                      type="checkbox"
                      checked={backDesign.show_signature_strip}
                      onChange={(e) => setBackDesign({ ...backDesign, show_signature_strip: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                    <span className="font-bold text-xs text-gray-800">Show Emergency Contact Block</span>
                    <input
                      type="checkbox"
                      checked={backDesign.show_emergency_contact}
                      onChange={(e) => setBackDesign({ ...backDesign, show_emergency_contact: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 4: VERSION HISTORY */}
            {activeTab === 'VERSIONS' && (
              <div className="space-y-3">
                <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider">
                  Template Version History
                </span>
                <p className="text-[11px] text-gray-500">
                  Every publish action generates an immutable version checkpoint.
                </p>

                {template.versions && template.versions.length > 0 ? (
                  template.versions.map((v) => (
                    <div
                      key={v.id}
                      className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-gray-900 font-mono">
                          v{v.version_number}.0
                        </span>
                        <button
                          onClick={() => handleRestoreVersion(v.id)}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 rounded-lg text-[10px] font-bold border border-gray-200 transition"
                        >
                          Restore
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-600">{v.change_summary || 'No description provided'}</p>
                      <span className="text-[10px] text-gray-400 font-mono block">
                        {new Date(v.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-400">
                    <History className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">Initial release version</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
