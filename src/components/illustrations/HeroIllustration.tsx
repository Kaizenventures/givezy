import React from 'react';

interface HeroIllustrationProps {
  className?: string;
}

export default function HeroIllustration({ className = '' }: HeroIllustrationProps) {
  return (
    <svg
      viewBox="0 0 400 300"
      className={`w-full h-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="warmSunset" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        <linearGradient id="emeraldGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        <linearGradient id="earthTone" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#92400E" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        {/* Soft shadows */}
        <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="2" dy="3" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.15" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background soft shapes */}
      <circle
        cx="350"
        cy="30"
        r="80"
        fill="#FED7AA"
        opacity="0.4"
      />
      <circle
        cx="50"
        cy="250"
        r="70"
        fill="#E8D5C4"
        opacity="0.35"
      />

      {/* Left hand giving (earth tones) */}
      <g filter="url(#softShadow)">
        {/* Forearm */}
        <ellipse
          cx="85"
          cy="180"
          rx="35"
          ry="28"
          fill="#D4A574"
          transform="rotate(-25 85 180)"
        />

        {/* Hand base */}
        <ellipse
          cx="120"
          cy="155"
          rx="32"
          ry="28"
          fill="#E8C4A0"
          transform="rotate(-20 120 155)"
        />

        {/* Fingers - rounded */}
        <circle cx="130" cy="135" r="10" fill="#E8C4A0" />
        <circle cx="145" cy="130" r="11" fill="#E8C4A0" />
        <circle cx="155" cy="145" r="10" fill="#E8C4A0" />
        <circle cx="148" cy="160" r="9" fill="#DDB896" />
      </g>

      {/* Right hand receiving (darker earth tones) */}
      <g filter="url(#softShadow)">
        {/* Forearm */}
        <ellipse
          cx="315"
          cy="180"
          rx="35"
          ry="28"
          fill="#9B7A62"
          transform="rotate(25 315 180)"
        />

        {/* Hand base */}
        <ellipse
          cx="280"
          cy="155"
          rx="32"
          ry="28"
          fill="#B89968"
          transform="rotate(20 280 155)"
        />

        {/* Fingers - rounded */}
        <circle cx="270" cy="135" r="10" fill="#B89968" />
        <circle cx="255" cy="130" r="11" fill="#B89968" />
        <circle cx="245" cy="145" r="10" fill="#B89968" />
        <circle cx="252" cy="160" r="9" fill="#A6876F" />
      </g>

      {/* Books being passed - Stack in middle */}
      {/* Book 1 - Saffron */}
      <g filter="url(#softShadow)">
        <rect
          x="165"
          y="140"
          width="70"
          height="50"
          rx="8"
          fill="#F59E0B"
          opacity="0.9"
          transform="rotate(-8 200 165)"
        />
        <circle cx="175" cy="155" r="6" fill="#FED7AA" opacity="0.6" />
        <circle cx="220" cy="160" r="5" fill="#FED7AA" opacity="0.5" />
      </g>

      {/* Book 2 - Emerald */}
      <g filter="url(#softShadow)">
        <rect
          x="160"
          y="165"
          width="75"
          height="45"
          rx="8"
          fill="#059669"
          opacity="0.85"
          transform="rotate(5 197 187)"
        />
        <circle cx="175" cy="180" r="5" fill="#A7F3D0" opacity="0.5" />
        <circle cx="225" cy="185" r="6" fill="#A7F3D0" opacity="0.6" />
      </g>

      {/* Clothing item - flowing cloth */}
      <g filter="url(#softShadow)">
        <path
          d="M 150 120 Q 170 110 190 125 Q 200 130 195 150 Q 175 145 150 140 Z"
          fill="#FED7AA"
          opacity="0.9"
        />
        <path
          d="M 210 115 Q 230 105 250 120 Q 260 125 255 145 Q 235 140 210 135 Z"
          fill="#F59E0B"
          opacity="0.85"
        />
      </g>

      {/* Floating hearts - decorative accents */}
      <g opacity="0.7">
        {/* Heart 1 */}
        <path
          d="M 60 80 Q 55 75 50 80 Q 45 85 55 95 Q 60 90 60 90 Q 65 90 70 85 Q 80 75 75 80 Q 70 75 60 80"
          fill="#F59E0B"
        />

        {/* Heart 2 */}
        <path
          d="M 330 100 Q 325 95 320 100 Q 315 105 325 115 Q 330 110 330 110 Q 335 110 340 105 Q 350 95 345 100 Q 340 95 330 100"
          fill="#E11D48"
          opacity="0.6"
        />

        {/* Heart 3 */}
        <path
          d="M 100 220 Q 95 215 90 220 Q 85 225 95 235 Q 100 230 100 230 Q 105 230 110 225 Q 120 215 115 220 Q 110 215 100 220"
          fill="#EC4899"
          opacity="0.5"
        />
      </g>

      {/* Floating stars - celebratory */}
      <g opacity="0.8">
        {/* Star 1 */}
        <path
          d="M 280 60 L 285 75 L 300 75 L 290 83 L 295 98 L 280 90 L 265 98 L 270 83 L 260 75 L 275 75 Z"
          fill="#F59E0B"
        />

        {/* Star 2 */}
        <path
          d="M 340 140 L 343 150 L 354 150 L 345 156 L 348 166 L 340 160 L 332 166 L 335 156 L 326 150 L 337 150 Z"
          fill="#FBBF24"
          opacity="0.7"
        />

        {/* Star 3 */}
        <path
          d="M 50 160 L 53 170 L 64 170 L 55 176 L 58 186 L 50 180 L 42 186 L 45 176 L 36 170 L 47 170 Z"
          fill="#F59E0B"
          opacity="0.6"
        />
      </g>

      {/* Small connecting arc showing energy/movement */}
      <path
        d="M 140 150 Q 200 140 260 150"
        stroke="#F59E0B"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />

      {/* Text/label area (optional for future use) */}
      <text
        x="200"
        y="280"
        textAnchor="middle"
        fontSize="14"
        fill="#92400E"
        opacity="0"
      >
        Share Kindness
      </text>
    </svg>
  );
}
