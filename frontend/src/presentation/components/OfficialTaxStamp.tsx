import React from 'react';

interface OfficialTaxStampProps {
  type?: 'PAID' | 'VERIFIED' | 'APPROVED' | 'OFFICIAL' | string;
  size?: 'sm' | 'md' | 'lg';
  date?: string;
  companyName?: string;
  className?: string;
  color?: string;
}

export const OfficialTaxStamp: React.FC<OfficialTaxStampProps> = ({
  type = 'PAID',
  size = 'md',
  date,
  companyName = 'SMARTPOS SOLUTIONS (CAMBODIA) CO., LTD.',
  className = '',
  color = '#dc2626', // Authentic red ink
}) => {
  const sizePixels = size === 'sm' ? 120 : size === 'lg' ? 180 : 145;

  const getStampLabel = () => {
    switch (type.toUpperCase()) {
      case 'PAID':
        return { kh: 'បានទូទាត់រួច', en: 'PAID & SETTLED', sub: 'GDT COMPLIANT' };
      case 'VERIFIED':
        return { kh: 'បានផ្ទៀងផ្ទាត់', en: 'VERIFIED FISCAL', sub: 'E-INVOICE AUDIT' };
      case 'APPROVED':
        return { kh: 'បានអនុម័ត', en: 'OFFICIALLY APPROVED', sub: 'AUTHORISED' };
      case 'OFFICIAL':
      default:
        return { kh: 'ឯកសារផ្លូវការ', en: 'OFFICIAL DOCUMENT', sub: 'TAX REGISTERED' };
    }
  };

  const labels = getStampLabel();
  const formattedDate = date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div
      className={`inline-block select-none transform -rotate-12 transition-transform hover:rotate-0 duration-300 ${className}`}
      style={{ width: `${sizePixels}px`, height: `${sizePixels}px` }}
      title="Official Cambodia GDT Fiscal Seal"
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-xs"
        style={{ color: color }}
      >
        {/* Outer Heavy Circular Ink Border */}
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray="900"
          opacity="0.9"
        />

        {/* Inner Dashed Ring */}
        <circle
          cx="100"
          cy="100"
          r="84"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          opacity="0.8"
        />

        {/* Circular Curved Text Paths */}
        <defs>
          {/* Top curve */}
          <path
            id="stampTopArc"
            d="M 28 100 A 72 72 0 0 1 172 100"
            fill="none"
          />
          {/* Bottom curve */}
          <path
            id="stampBottomArc"
            d="M 172 100 A 72 72 0 0 1 28 100"
            fill="none"
          />
        </defs>

        {/* Top Text along arc */}
        <text
          fill="currentColor"
          fontSize="9"
          fontWeight="bold"
          letterSpacing="1.2"
          opacity="0.92"
        >
          <textPath href="#stampTopArc" startOffset="50%" textAnchor="middle">
            ★ SMARTPOS SOLUTIONS CO., LTD. ★
          </textPath>
        </text>

        {/* Bottom Text along arc */}
        <text
          fill="currentColor"
          fontSize="8"
          fontWeight="bold"
          letterSpacing="1.1"
          opacity="0.88"
        >
          <textPath href="#stampBottomArc" startOffset="50%" textAnchor="middle">
            KINGDOM OF CAMBODIA • GDT TAX
          </textPath>
        </text>

        {/* Center Box with Main Stamp Badge */}
        <g transform="translate(0, 0)">
          {/* Center Box Background */}
          <rect
            x="24"
            y="76"
            width="152"
            height="48"
            rx="5"
            fill="currentColor"
            fillOpacity="0.10"
            stroke="currentColor"
            strokeWidth="2.5"
          />

          {/* Inner double border of center box */}
          <rect
            x="27"
            y="79"
            width="146"
            height="42"
            rx="3"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="3 2"
            opacity="0.8"
          />

          {/* Primary Khmer Text */}
          <text
            x="100"
            y="95"
            textAnchor="middle"
            fill="currentColor"
            fontSize="12.5"
            fontWeight="900"
            letterSpacing="0.8"
          >
            {labels.kh}
          </text>

          {/* Primary English Text */}
          <text
            x="100"
            y="112"
            textAnchor="middle"
            fill="currentColor"
            fontSize="10"
            fontWeight="900"
            letterSpacing="1.5"
          >
            {labels.en}
          </text>
        </g>

        {/* Date line under center box */}
        <text
          x="100"
          y="138"
          textAnchor="middle"
          fill="currentColor"
          fontSize="7.5"
          fontWeight="bold"
          letterSpacing="0.8"
          opacity="0.85"
        >
          DATE: {formattedDate}
        </text>

        {/* Tax Registration Code at top of center box */}
        <text
          x="100"
          y="70"
          textAnchor="middle"
          fill="currentColor"
          fontSize="7"
          fontWeight="bold"
          letterSpacing="0.8"
          opacity="0.85"
        >
          TIN: K001-902100888
        </text>

        {/* Small 5-Point Stars */}
        <polygon
          points="100,24 102,29 107,29 103,32 105,37 100,34 95,37 97,32 93,29 98,29"
          fill="currentColor"
          opacity="0.8"
        />
        <polygon
          points="100,174 102,179 107,179 103,182 105,187 100,184 95,187 97,182 93,179 98,179"
          fill="currentColor"
          opacity="0.8"
        />
      </svg>
    </div>
  );
};
