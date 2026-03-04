import React from 'react';

interface GivingIllustrationProps {
  className?: string;
}

export default function GivingIllustration({ className = '' }: GivingIllustrationProps) {
  return (
    <svg
      viewBox="0 0 300 300"
      className={`w-full h-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Warm gradient background */}
        <linearGradient id="warmBackground" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Gift box gradient */}
        <linearGradient id="giftRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>

        {/* Ribbon gradient */}
        <linearGradient id="ribbonGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* Emerald accent */}
        <linearGradient id="emeraldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Soft shadow filter */}
        <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" />
          <feOffset dx="1.5" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Glow effect */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
        </filter>
      </defs>

      {/* Background warm shape - organic and flowing */}
      <ellipse
        cx="150"
        cy="160"
        rx="130"
        ry="120"
        fill="url(#warmBackground)"
        opacity="0.5"
      />

      {/* Decorative background circles */}
      <circle cx="250" cy="80" r="40" fill="#F59E0B" opacity="0.2" />
      <circle cx="50" cy="220" r="45" fill="#059669" opacity="0.15" />
      <circle cx="80" cy="60" r="35" fill="#EC4899" opacity="0.1" />

      {/* Main gift box */}
      <g filter="url(#softShadow)">
        {/* Box base */}
        <rect
          x="90"
          y="100"
          width="120"
          height="100"
          rx="12"
          fill="url(#giftRed)"
        />

        {/* Box highlight/shine */}
        <rect
          x="95"
          y="105"
          width="35"
          height="35"
          rx="6"
          fill="#FCA5A5"
          opacity="0.7"
        />

        {/* Lid/top of box */}
        <ellipse
          cx="150"
          cy="100"
          rx="65"
          ry="20"
          fill="#F87171"
          opacity="0.9"
        />

        {/* Lid highlight */}
        <ellipse
          cx="150"
          cy="95"
          rx="55"
          ry="12"
          fill="#FCA5A5"
          opacity="0.6"
        />
      </g>

      {/* Ribbon bow - horizontal and vertical */}
      <g filter="url(#softShadow)">
        {/* Vertical ribbon */}
        <rect
          x="140"
          y="90"
          width="20"
          height="130"
          rx="3"
          fill="url(#ribbonGold)"
        />

        {/* Horizontal ribbon */}
        <rect
          x="85"
          y="155"
          width="130"
          height="18"
          rx="3"
          fill="url(#ribbonGold)"
          opacity="0.95"
        />

        {/* Bow left loop */}
        <ellipse
          cx="115"
          cy="130"
          rx="22"
          ry="28"
          fill="#FBBF24"
          opacity="0.9"
          transform="rotate(-25 115 130)"
        />

        {/* Bow right loop */}
        <ellipse
          cx="185"
          cy="130"
          rx="22"
          ry="28"
          fill="#FBBF24"
          opacity="0.9"
          transform="rotate(25 185 130)"
        />

        {/* Bow center knot */}
        <circle cx="150" cy="130" r="12" fill="#F59E0B" />
      </g>

      {/* Items flowing out - celebratory */}

      {/* Book 1 - upper left */}
      <g filter="url(#softShadow)">
        <rect
          x="30"
          y="70"
          width="45"
          height="55"
          rx="5"
          fill="url(#emeraldAccent)"
          opacity="0.9"
          transform="rotate(-35 52 97)"
        />
        <circle cx="45" cy="85" r="4" fill="#A7F3D0" opacity="0.6" />
        <circle cx="65" cy="95" r="3" fill="#A7F3D0" opacity="0.5" />
      </g>

      {/* Shirt/clothing - upper right */}
      <g filter="url(#softShadow)">
        <path
          d="M 210 50 Q 240 40 260 60 Q 270 70 260 90 Q 240 85 210 80 Z"
          fill="#F59E0B"
          opacity="0.85"
        />
        <path
          d="M 255 65 Q 275 55 290 75 Q 295 85 285 100 Q 270 90 255 85 Z"
          fill="#FED7AA"
          opacity="0.8"
        />
      </g>

      {/* Book 2 - lower left */}
      <g filter="url(#softShadow)">
        <rect
          x="20"
          y="180"
          width="48"
          height="60"
          rx="5"
          fill="#F59E0B"
          opacity="0.85"
          transform="rotate(-45 44 210)"
        />
        <circle cx="35" cy="200" r="4" fill="#FED7AA" opacity="0.7" />
        <line
          x1="30"
          y1="220"
          x2="55"
          y2="225"
          stroke="#92400E"
          strokeWidth="1.5"
          opacity="0.5"
        />
      </g>

      {/* Clothing item 2 - lower right */}
      <g filter="url(#softShadow)">
        <ellipse
          cx="250"
          cy="220"
          rx="35"
          ry="25"
          fill="#10B981"
          opacity="0.8"
          transform="rotate(40 250 220)"
        />
        <ellipse
          cx="275"
          cy="230"
          rx="25"
          ry="18"
          fill="#059669"
          opacity="0.75"
          transform="rotate(30 275 230)"
        />
      </g>

      {/* Floating confetti-like elements - celebratory */}

      {/* Star bursts */}
      <g opacity="0.7" filter="url(#glow)">
        <path
          d="M 100 40 L 102 48 L 110 48 L 104 52 L 106 60 L 100 56 L 94 60 L 96 52 L 90 48 L 98 48 Z"
          fill="#F59E0B"
        />
        <path
          d="M 220 270 L 222 278 L 230 278 L 224 282 L 226 290 L 220 286 L 214 290 L 216 282 L 210 278 L 218 278 Z"
          fill="#FBBF24"
          opacity="0.8"
        />
        <path
          d="M 280 160 L 282 166 L 288 166 L 284 169 L 286 175 L 280 171 L 274 175 L 276 169 L 272 166 L 278 166 Z"
          fill="#F59E0B"
          opacity="0.7"
        />
      </g>

      {/* Floating hearts - joy */}
      <g opacity="0.6">
        <path
          d="M 70 150 Q 65 145 60 150 Q 55 155 65 165 Q 70 160 70 160 Q 75 160 80 155 Q 90 145 85 150 Q 80 145 70 150"
          fill="#E11D48"
          opacity="0.7"
        />
        <path
          d="M 240 110 Q 235 105 230 110 Q 225 115 235 125 Q 240 120 240 120 Q 245 120 250 115 Q 260 105 255 110 Q 250 105 240 110"
          fill="#EC4899"
          opacity="0.55"
        />
        <path
          d="M 150 260 Q 145 255 140 260 Q 135 265 145 275 Q 150 270 150 270 Q 155 270 160 265 Q 170 255 165 260 Q 160 255 150 260"
          fill="#F472B6"
          opacity="0.5"
        />
      </g>

      {/* Floating circles - sparkles */}
      <g opacity="0.5">
        <circle cx="55" cy="130" r="3" fill="#FBBF24" />
        <circle cx="260" cy="200" r="2.5" fill="#F59E0B" />
        <circle cx="120" cy="280" r="2" fill="#FBBF24" />
        <circle cx="200" cy="50" r="2.5" fill="#F59E0B" />
      </g>

      {/* Flowing movement lines - suggesting energy and action */}
      <g opacity="0.3">
        <path
          d="M 140 160 Q 100 140 60 150"
          stroke="#92400E"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 160 160 Q 200 140 240 130"
          stroke="#92400E"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 150 200 Q 120 230 80 260"
          stroke="#92400E"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 150 200 Q 190 240 250 260"
          stroke="#92400E"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
