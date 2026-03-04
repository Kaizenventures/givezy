import React from 'react';

interface StoryIllustrationProps {
  className?: string;
}

export default function StoryIllustration({ className = '' }: StoryIllustrationProps) {
  return (
    <svg
      viewBox="0 0 400 350"
      className={`w-full h-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="100%" stopColor="#FECACA" />
        </linearGradient>

        <linearGradient id="treeGreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        <linearGradient id="trunkBrown" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#92400E" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        {/* Soft shadow filter */}
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

        {/* Glow filter for book */}
        <filter id="bookGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>
      </defs>

      {/* Sky background */}
      <rect width="400" height="350" fill="url(#skyGradient)" />

      {/* Soft background circles */}
      <circle cx="350" cy="50" r="60" fill="#F59E0B" opacity="0.2" />
      <circle cx="50" cy="300" r="50" fill="#059669" opacity="0.15" />

      {/* Tree trunk - sturdy and rounded */}
      <g filter="url(#softShadow)">
        <ellipse
          cx="280"
          cy="200"
          rx="45"
          ry="85"
          fill="url(#trunkBrown)"
        />
        <ellipse
          cx="285"
          cy="190"
          rx="35"
          ry="20"
          fill="#A0633A"
          opacity="0.6"
        />
      </g>

      {/* Tree foliage - large and welcoming */}
      <g filter="url(#softShadow)">
        {/* Main canopy - multiple overlapping circles for organic shape */}
        <circle cx="260" cy="80" r="70" fill="url(#treeGreen)" />
        <circle cx="320" cy="75" r="65" fill="#059669" opacity="0.9" />
        <circle cx="290" cy="30" r="55" fill="#10B981" opacity="0.85" />
        <circle cx="250" cy="50" r="60" fill="#047857" opacity="0.8" />
        <circle cx="330" cy="120" r="50" fill="#10B981" opacity="0.8" />

        {/* Light highlights on foliage */}
        <circle cx="280" cy="60" r="20" fill="#A7F3D0" opacity="0.4" />
        <circle cx="310" cy="100" r="25" fill="#A7F3D0" opacity="0.3" />
      </g>

      {/* Child sitting under tree */}
      <g filter="url(#softShadow)">
        {/* Body/torso */}
        <ellipse
          cx="120"
          cy="160"
          rx="25"
          ry="35"
          fill="#D4A574"
        />

        {/* Head */}
        <circle cx="120" cy="110" r="20" fill="#E8C4A0" />

        {/* Hair */}
        <ellipse cx="120" cy="100" rx="22" ry="18" fill="#3E2723" />

        {/* Simple facial features */}
        <circle cx="115" cy="108" r="2.5" fill="#1F1F1F" />
        <circle cx="125" cy="108" r="2.5" fill="#1F1F1F" />
        <path
          d="M 120 118 Q 118 120 120 122"
          stroke="#3E2723"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Arms */}
        <ellipse
          cx="90"
          cy="150"
          rx="15"
          ry="28"
          fill="#E8C4A0"
          transform="rotate(-30 90 150)"
        />
        <ellipse
          cx="150"
          cy="150"
          rx="15"
          ry="28"
          fill="#E8C4A0"
          transform="rotate(30 150 150)"
        />

        {/* Legs */}
        <ellipse
          cx="110"
          cy="210"
          rx="12"
          ry="32"
          fill="#9B7A62"
        />
        <ellipse
          cx="130"
          cy="210"
          rx="12"
          ry="32"
          fill="#9B7A62"
        />

        {/* Simple feet */}
        <ellipse cx="110" cy="245" rx="10" ry="8" fill="#8B6F47" />
        <ellipse cx="130" cy="245" rx="10" ry="8" fill="#8B6F47" />
      </g>

      {/* Book being read - prominent and warm */}
      <g filter="url(#softShadow)">
        {/* Book cover - saffron */}
        <rect
          x="140"
          y="140"
          width="60"
          height="70"
          rx="6"
          fill="#F59E0B"
          opacity="0.95"
          transform="rotate(-20 170 175)"
        />

        {/* Book spine/depth */}
        <rect
          x="198"
          y="142"
          width="8"
          height="70"
          fill="#D97706"
          opacity="0.8"
          transform="rotate(-20 202 177)"
        />

        {/* Book details - decorative elements */}
        <circle cx="160" cy="160" r="5" fill="#FED7AA" opacity="0.7" />
        <circle cx="180" cy="175" r="4" fill="#A7F3D0" opacity="0.6" />
        <line
          x1="155"
          y1="190"
          x2="195"
          y2="190"
          stroke="#FED7AA"
          strokeWidth="2"
          opacity="0.6"
          transform="rotate(-20 170 175)"
        />
      </g>

      {/* Pages with text lines - suggesting reading */}
      <g opacity="0.5">
        <line x1="150" y1="155" x2="180" y2="160" stroke="#92400E" strokeWidth="1.5" />
        <line x1="150" y1="165" x2="175" y2="170" stroke="#92400E" strokeWidth="1.5" />
        <line x1="150" y1="175" x2="180" y2="182" stroke="#92400E" strokeWidth="1.5" />
        <line x1="155" y1="185" x2="175" y2="192" stroke="#92400E" strokeWidth="1.5" />
      </g>

      {/* Floating elements - joy and wonder */}
      {/* Floating leaves */}
      <g opacity="0.6">
        <ellipse
          cx="60"
          cy="80"
          rx="8"
          ry="12"
          fill="#10B981"
          transform="rotate(25 60 80)"
        />
        <ellipse
          cx="340"
          cy="200"
          rx="8"
          ry="12"
          fill="#059669"
          transform="rotate(-45 340 200)"
        />
        <ellipse
          cx="100"
          cy="280"
          rx="8"
          ry="12"
          fill="#047857"
          transform="rotate(60 100 280)"
        />
      </g>

      {/* Floating hearts - representing happiness */}
      <g opacity="0.7">
        <path
          d="M 320 140 Q 315 135 310 140 Q 305 145 315 155 Q 320 150 320 150 Q 325 150 330 145 Q 340 135 335 140 Q 330 135 320 140"
          fill="#E11D48"
          opacity="0.6"
        />
        <path
          d="M 70 180 Q 65 175 60 180 Q 55 185 65 195 Q 70 190 70 190 Q 75 190 80 185 Q 90 175 85 180 Q 80 175 70 180"
          fill="#EC4899"
          opacity="0.5"
        />
      </g>

      {/* Decorative stars - wonder and magic */}
      <g opacity="0.7">
        <path
          d="M 350 240 L 353 250 L 364 250 L 355 256 L 358 266 L 350 260 L 342 266 L 345 256 L 336 250 L 347 250 Z"
          fill="#F59E0B"
          opacity="0.6"
        />
        <path
          d="M 40 120 L 43 128 L 52 128 L 45 133 L 48 141 L 40 136 L 32 141 L 35 133 L 28 128 L 37 128 Z"
          fill="#FBBF24"
          opacity="0.5"
        />
      </g>

      {/* Soft ground indicator */}
      <ellipse
        cx="120"
        cy="260"
        rx="50"
        ry="15"
        fill="#92400E"
        opacity="0.15"
      />
    </svg>
  );
}
