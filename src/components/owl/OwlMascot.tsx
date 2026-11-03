"use client";

import React from "react";

export type OwlVariant =
  | "studious"     // Standard: graduation cap, round glasses, book
  | "reading"      // Reading open book attentively
  | "celebrating"  // Raising wings/diploma, golden stars
  | "thinking"     // Pondering with spectacles and feather quill
  | "cheering"     // Thumbs up / wing wave with encouraging smile
  | "badge";       // Compact round avatar for logo and small buttons

interface OwlMascotProps {
  variant?: OwlVariant;
  size?: "sm" | "md" | "lg" | "xl" | number;
  className?: string;
  animate?: boolean;
}

export function OwlMascot({
  variant = "studious",
  size = "md",
  className = "",
  animate = true,
}: OwlMascotProps) {
  // Determine pixel dimension
  let dim = 80;
  if (typeof size === "number") {
    dim = size;
  } else {
    switch (size) {
      case "sm":
        dim = 40;
        break;
      case "md":
        dim = 72;
        break;
      case "lg":
        dim = 120;
        break;
      case "xl":
        dim = 180;
        break;
    }
  }

  // Common SVG gradients & filters
  const defs = (
    <defs>
      {/* Body Gradient: Scholar Tawny Brown & Warm Amber */}
      <linearGradient id="owlBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#4A3728" />
        <stop offset="50%" stopColor="#3A281A" />
        <stop offset="100%" stopColor="#2A1B10" />
      </linearGradient>

      {/* Breast / Belly Gradient: Warm Cream Parchment */}
      <linearGradient id="owlBellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFDF7" />
        <stop offset="60%" stopColor="#F5EFE0" />
        <stop offset="100%" stopColor="#E6DCC8" />
      </linearGradient>

      {/* Mortarboard Academic Indigo/Navy */}
      <linearGradient id="owlCapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="50%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>

      {/* Golden Tassel & Glasses Gold */}
      <linearGradient id="owlGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>

      {/* Intelligent Golden Eyes */}
      <radialGradient id="owlEyeGrad" cx="40%" cy="40%" r="65%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="55%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </radialGradient>

      {/* Soft Glow Filter */}
      <filter id="owlGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  );

  // Compact Logo / Badge Variant
  if (variant === "badge") {
    return (
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block shrink-0 ${animate ? "transition-transform duration-300 hover:scale-105" : ""} ${className}`}
        aria-label="Cú Tri Thức"
      >
        {defs}
        {/* Circular background */}
        <circle cx="50" cy="50" r="46" fill="url(#owlCapGrad)" stroke="url(#owlGoldGrad)" strokeWidth="3" />
        
        {/* Owl Face Disk */}
        <ellipse cx="50" cy="56" rx="30" ry="26" fill="url(#owlBodyGrad)" />
        <ellipse cx="40" cy="54" rx="14" ry="15" fill="#FFFBEB" opacity="0.95" />
        <ellipse cx="60" cy="54" rx="14" ry="15" fill="#FFFBEB" opacity="0.95" />

        {/* Eyes */}
        <circle cx="41" cy="54" r="8" fill="url(#owlEyeGrad)" />
        <circle cx="59" cy="54" r="8" fill="url(#owlEyeGrad)" />
        <circle cx="42" cy="53" r="4.5" fill="#0F172A" />
        <circle cx="58" cy="53" r="4.5" fill="#0F172A" />
        <circle cx="44" cy="51" r="1.8" fill="#FFFFFF" />
        <circle cx="60" cy="51" r="1.8" fill="#FFFFFF" />

        {/* Scholarly Golden Glasses */}
        <circle cx="41" cy="54" r="11" fill="none" stroke="url(#owlGoldGrad)" strokeWidth="2.5" />
        <circle cx="59" cy="54" r="11" fill="none" stroke="url(#owlGoldGrad)" strokeWidth="2.5" />
        <path d="M52 54 H48" stroke="url(#owlGoldGrad)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Beak */}
        <path d="M47 58 Q50 67 53 58 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />

        {/* Graduation Cap (Mortarboard) */}
        <polygon points="50,15 82,27 50,37 18,27" fill="url(#owlCapGrad)" stroke="url(#owlGoldGrad)" strokeWidth="1.5" />
        <rect x="36" y="32" width="28" height="6" rx="2" fill="#0F172A" />
        {/* Cap Button & Tassel */}
        <circle cx="50" cy="26" r="2.5" fill="url(#owlGoldGrad)" />
        <path d="M50 26 Q64 28 68 40" stroke="url(#owlGoldGrad)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="68" cy="41" r="2.5" fill="url(#owlGoldGrad)" />
      </svg>
    );
  }

  // Full mascot with variations
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: dim, height: dim }}
    >
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full drop-shadow-sm ${animate ? "transition-all duration-300" : ""}`}
        aria-hidden="true"
      >
        {defs}

        {/* Celebration Aura Stars (if celebrating) */}
        {variant === "celebrating" && (
          <g className="animate-pulse">
            <path d="M30 40 L33 48 L41 51 L33 54 L30 62 L27 54 L19 51 L27 48 Z" fill="url(#owlGoldGrad)" opacity="0.9" />
            <path d="M170 45 L172 52 L179 54 L172 56 L170 63 L168 56 L161 54 L168 52 Z" fill="url(#owlGoldGrad)" opacity="0.9" />
            <path d="M100 15 L102 20 L107 22 L102 24 L100 29 L98 24 L93 22 L98 20 Z" fill="url(#owlGoldGrad)" opacity="0.9" />
          </g>
        )}

        {/* Perch / Wooden branch or book stand */}
        <path
          d="M35 178 Q100 182 165 178"
          stroke="#451A03"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M38 178 Q100 180 162 178"
          stroke="#78350F"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Owl Talons / Feet */}
        <g fill="#F59E0B" stroke="#B45309" strokeWidth="1.5">
          <rect x="75" y="169" width="8" height="12" rx="4" />
          <rect x="85" y="170" width="8" height="12" rx="4" />
          <rect x="107" y="170" width="8" height="12" rx="4" />
          <rect x="117" y="169" width="8" height="12" rx="4" />
        </g>

        {/* Owl Main Body */}
        <ellipse cx="100" cy="120" rx="55" ry="58" fill="url(#owlBodyGrad)" />

        {/* Fluffy Feathered Belly */}
        <ellipse cx="100" cy="126" rx="38" ry="42" fill="url(#owlBellyGrad)" />

        {/* Subtle Belly Feather scallops */}
        <g stroke="#CBB99E" strokeWidth="1.8" fill="none" opacity="0.75" strokeLinecap="round">
          <path d="M86 110 Q93 115 100 110 Q107 115 114 110" />
          <path d="M80 125 Q90 131 100 125 Q110 131 120 125" />
          <path d="M84 140 Q92 146 100 140 Q108 146 116 140" />
          <path d="M90 152 Q95 156 100 152 Q105 156 110 152" />
        </g>

        {/* Wings */}
        {variant === "celebrating" ? (
          // Joyful Wings spread upward
          <g>
            <path
              d="M50 120 C30 90 20 65 35 60 C50 55 65 85 62 120 Z"
              fill="url(#owlBodyGrad)"
              stroke="#2A1B10"
              strokeWidth="2"
            />
            <path
              d="M150 120 C170 90 180 65 165 60 C150 55 135 85 138 120 Z"
              fill="url(#owlBodyGrad)"
              stroke="#2A1B10"
              strokeWidth="2"
            />
          </g>
        ) : variant === "thinking" ? (
          // One wing tucked, one wing holding feather quill to chin
          <g>
            <path
              d="M48 105 C36 120 38 150 52 160 C58 150 62 130 58 108 Z"
              fill="url(#owlBodyGrad)"
              stroke="#2A1B10"
              strokeWidth="2"
            />
            {/* Wing raised to cheek */}
            <path
              d="M148 115 C158 125 150 145 130 135 C122 130 126 118 140 112 Z"
              fill="url(#owlBodyGrad)"
              stroke="#2A1B10"
              strokeWidth="1.5"
            />
            {/* Feather Quill */}
            <path
              d="M135 125 Q155 95 170 70 Q162 90 142 118"
              fill="url(#owlGoldGrad)"
              stroke="#B45309"
              strokeWidth="1.5"
            />
          </g>
        ) : (
          // Classic folded wings
          <g>
            <path
              d="M48 105 C36 120 38 150 55 158 C62 148 64 128 58 108 Z"
              fill="url(#owlBodyGrad)"
              stroke="#2A1B10"
              strokeWidth="2"
            />
            <path
              d="M152 105 C164 120 162 150 145 158 C138 148 136 128 142 108 Z"
              fill="url(#owlBodyGrad)"
              stroke="#2A1B10"
              strokeWidth="2"
            />
          </g>
        )}

        {/* Head / Facial Disc */}
        <ellipse cx="100" cy="85" rx="46" ry="38" fill="url(#owlBodyGrad)" />
        {/* Left & Right eye plumage patches (gives that distinctive scholarly owl look) */}
        <circle cx="82" cy="84" r="22" fill="#FFFDF5" />
        <circle cx="118" cy="84" r="22" fill="#FFFDF5" />

        {/* Eyes (Wise, focused, animated) */}
        <circle cx="82" cy="84" r="14" fill="url(#owlEyeGrad)" />
        <circle cx="118" cy="84" r="14" fill="url(#owlEyeGrad)" />

        {/* Pupil */}
        <circle cx="83" cy="83" r="8" fill="#0F172A" />
        <circle cx="117" cy="83" r="8" fill="#0F172A" />

        {/* Intelligent Eye Highlights (Catchlights) */}
        <circle cx="86" cy="79" r="3" fill="#FFFFFF" />
        <circle cx="88" cy="84" r="1.5" fill="#FFFFFF" />
        <circle cx="120" cy="79" r="3" fill="#FFFFFF" />
        <circle cx="122" cy="84" r="1.5" fill="#FFFFFF" />

        {/* Scholarly Golden Round Glasses */}
        <circle
          cx="82"
          cy="84"
          r="19"
          fill="none"
          stroke="url(#owlGoldGrad)"
          strokeWidth="3.2"
        />
        <circle
          cx="118"
          cy="84"
          r="19"
          fill="none"
          stroke="url(#owlGoldGrad)"
          strokeWidth="3.2"
        />
        {/* Glasses bridge */}
        <path
          d="M100 83 Q100 78 100 83"
          stroke="url(#owlGoldGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <line x1="97" y1="83" x2="103" y2="83" stroke="url(#owlGoldGrad)" strokeWidth="3.5" />
        {/* Spectacles temple tips */}
        <path d="M63 83 L55 80" stroke="url(#owlGoldGrad)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M137 83 L145 80" stroke="url(#owlGoldGrad)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Cute Beak */}
        <path
          d="M95 90 Q100 104 105 90 Z"
          fill="#F59E0B"
          stroke="#B45309"
          strokeWidth="1.5"
        />

        {/* Open Book or Diploma at front if reading/celebrating/studious */}
        {variant === "reading" || variant === "studious" ? (
          <g transform="translate(68, 142)">
            {/* Open Book */}
            <path
              d="M0 12 Q16 7 32 12 Q48 7 64 12 L60 32 Q46 27 32 30 Q18 27 4 32 Z"
              fill="#FBF8EF"
              stroke="#0F172A"
              strokeWidth="1.5"
            />
            {/* Book spine & pages */}
            <line x1="32" y1="12" x2="32" y2="30" stroke="#78350F" strokeWidth="1.8" />
            <path d="M7 17 H27 M7 21 H25 M7 25 H27" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M37 17 H57 M37 21 H55 M37 25 H57" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
            {/* Bookmark ribbon */}
            <path d="M32 30 Q36 37 34 42" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        ) : variant === "celebrating" ? (
          <g transform="translate(76, 142)">
            {/* Diploma Scroll */}
            <rect x="0" y="5" width="48" height="18" rx="4" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.8" />
            {/* Red Ribbon */}
            <rect x="20" y="3" width="8" height="22" rx="2" fill="#DC2626" />
            <circle cx="24" cy="14" r="5" fill="url(#owlGoldGrad)" />
          </g>
        ) : null}

        {/* Mortarboard Academic Graduation Cap */}
        <g>
          {/* Cap Skull cap base */}
          <ellipse cx="100" cy="54" rx="34" ry="10" fill="#0F172A" />
          {/* Diamond Cap Board */}
          <polygon
            points="100,26 156,44 100,60 44,44"
            fill="url(#owlCapGrad)"
            stroke="url(#owlGoldGrad)"
            strokeWidth="2"
          />
          {/* Gold Button */}
          <circle cx="100" cy="43" r="3.5" fill="url(#owlGoldGrad)" />
          {/* Tassel cord flowing to left side */}
          <path
            d="M100 43 Q125 45 136 65"
            stroke="url(#owlGoldGrad)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          {/* Tassel fringe */}
          <polygon points="134,65 138,65 141,77 132,77" fill="url(#owlGoldGrad)" />
        </g>
      </svg>
    </div>
  );
}

