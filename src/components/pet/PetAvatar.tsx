"use client";

import React from "react";
import { PetStage, PetSpeciesId } from "@/db/schema";

interface PetAvatarProps {
  species?: PetSpeciesId | string;
  stage?: PetStage | string;
  size?: "sm" | "md" | "lg" | "xl" | number;
  className?: string;
  animate?: boolean;
}

export function PetAvatar({
  species = "owl",
  stage = "egg",
  size = "md",
  className = "",
  animate = true,
}: PetAvatarProps) {
  let dim = 80;
  if (typeof size === "number") {
    dim = size;
  } else {
    switch (size) {
      case "sm":
        dim = 40;
        break;
      case "md":
        dim = 80;
        break;
      case "lg":
        dim = 140;
        break;
      case "xl":
        dim = 200;
        break;
    }
  }

  // Common Gradients
  const defs = (
    <defs>
      {/* Egg & Shell Gradients */}
      <linearGradient id="eggOwlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFDF5" />
        <stop offset="60%" stopColor="#F5E6CA" />
        <stop offset="100%" stopColor="#D4A76A" />
      </linearGradient>
      <linearGradient id="eggCatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="60%" stopColor="#F5E8E0" />
        <stop offset="100%" stopColor="#E0B8A2" />
      </linearGradient>
      <linearGradient id="eggBunnyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF5F7" />
        <stop offset="60%" stopColor="#FDE2E4" />
        <stop offset="100%" stopColor="#FAC0C8" />
      </linearGradient>
      <linearGradient id="eggDragonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="50%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#DC2626" />
      </linearGradient>
      <linearGradient id="eggFoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFBEB" />
        <stop offset="60%" stopColor="#FDBA74" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
      <linearGradient id="eggPhoenixGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="50%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#881337" />
      </linearGradient>

      {/* Owl Body Palette */}
      <linearGradient id="owlBody" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#4A3728" />
        <stop offset="50%" stopColor="#3A281A" />
        <stop offset="100%" stopColor="#2A1B10" />
      </linearGradient>
      <linearGradient id="owlBelly" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFDF7" />
        <stop offset="60%" stopColor="#F5EFE0" />
        <stop offset="100%" stopColor="#E6DCC8" />
      </linearGradient>
      <linearGradient id="goldAcc" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <radialGradient id="eyeGrad" cx="40%" cy="40%" r="65%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="55%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </radialGradient>

      {/* Cat Palette */}
      <linearGradient id="catBody" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#64748B" />
        <stop offset="50%" stopColor="#475569" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>

      {/* Bunny Palette */}
      <linearGradient id="bunnyBody" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="60%" stopColor="#F1F5F9" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>

      {/* Dragon Palette */}
      <linearGradient id="dragonBody" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#059669" />
        <stop offset="50%" stopColor="#047857" />
        <stop offset="100%" stopColor="#064E3B" />
      </linearGradient>

      {/* Fox Palette */}
      <linearGradient id="foxBody" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FB923C" />
        <stop offset="60%" stopColor="#EA580C" />
        <stop offset="100%" stopColor="#C2410C" />
      </linearGradient>

      {/* Phoenix Palette */}
      <linearGradient id="phoenixBody" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#F43F5E" />
        <stop offset="50%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#BE123C" />
      </linearGradient>

      {/* Legendary Glow */}
      <filter id="legendaryGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  );

  // 1. GIAI ĐOẠN: EGG (QUẢ TRỨNG) CHO MỌI LOÀI
  if (stage === "egg") {
    let eggGrad = "url(#eggOwlGrad)";
    let patternColor = "#D97706";
    let iconSymbol = "★";

    if (species === "cat") {
      eggGrad = "url(#eggCatGrad)";
      patternColor = "#A8836F";
      iconSymbol = "🐾";
    } else if (species === "bunny") {
      eggGrad = "url(#eggBunnyGrad)";
      patternColor = "#FB7185";
      iconSymbol = "☘";
    } else if (species === "dragon") {
      eggGrad = "url(#eggDragonGrad)";
      patternColor = "#7F1D1D";
      iconSymbol = "🔥";
    } else if (species === "fox") {
      eggGrad = "url(#eggFoxGrad)";
      patternColor = "#9A3412";
      iconSymbol = "🍂";
    } else if (species === "phoenix") {
      eggGrad = "url(#eggPhoenixGrad)";
      patternColor = "#FBBF24";
      iconSymbol = "✨";
    }

    return (
      <div
        className={`relative inline-flex items-center justify-center select-none ${className}`}
        style={{ width: dim, height: dim }}
      >
        <svg
          width={dim}
          height={dim}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={animate ? "transition-transform hover:scale-105 duration-300" : ""}
        >
          {defs}
          {/* Nest / Base */}
          <path
            d="M20 82 Q50 94 80 82 Q50 88 20 82 Z"
            fill="#78350F"
            stroke="#451A03"
            strokeWidth="1.5"
          />
          <path d="M25 80 Q50 86 75 80" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
          <path d="M30 84 Q50 90 70 84" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />

          {/* Egg Oval */}
          <ellipse
            cx="50"
            cy="52"
            rx="27"
            ry="34"
            fill={eggGrad}
            stroke={patternColor}
            strokeWidth="2.5"
            className={animate ? "animate-bounce" : ""}
            style={{ animationDuration: "3s" }}
          />

          {/* Egg Speckles / Patterns */}
          <circle cx="42" cy="40" r="3" fill={patternColor} opacity="0.4" />
          <circle cx="58" cy="46" r="4" fill={patternColor} opacity="0.3" />
          <circle cx="46" cy="62" r="3.5" fill={patternColor} opacity="0.4" />
          <circle cx="38" cy="54" r="2.5" fill={patternColor} opacity="0.3" />
          <circle cx="56" cy="60" r="2" fill={patternColor} opacity="0.4" />

          {/* Center Emblem Motif */}
          <circle cx="50" cy="50" r="10" fill="#FFFFFF" opacity="0.6" />
          <text
            x="50"
            y="54"
            textAnchor="middle"
            fontSize="10"
            fill={patternColor}
            fontWeight="bold"
          >
            {iconSymbol}
          </text>

          {/* Tiny cute crack indicator */}
          <path
            d="M48 24 L52 28 L49 32 L54 36"
            stroke={patternColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  // 2. GIAI ĐOẠN: HATCHLING (VỪA NỞ)
  if (stage === "hatchling") {
    return (
      <div
        className={`relative inline-flex items-center justify-center select-none ${className}`}
        style={{ width: dim, height: dim }}
      >
        <svg
          width={dim}
          height={dim}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={animate ? "transition-transform hover:scale-105 duration-300" : ""}
        >
          {defs}
          {/* Eggshell Bottom */}
          <path
            d="M24 55 Q24 84 50 84 Q76 84 76 55 L70 59 L62 53 L54 59 L46 53 L38 59 L30 53 Z"
            fill="url(#eggOwlGrad)"
            stroke="#D97706"
            strokeWidth="2"
          />

          {/* Baby Head peeking out */}
          <circle cx="50" cy="45" r="20" fill="url(#owlBody)" />
          <circle cx="43" cy="43" r="10" fill="#FFFDF5" />
          <circle cx="57" cy="43" r="10" fill="#FFFDF5" />

          {/* Big curious eyes */}
          <circle cx="43" cy="43" r="6" fill="url(#eyeGrad)" />
          <circle cx="57" cy="43" r="6" fill="url(#eyeGrad)" />
          <circle cx="44" cy="42" r="3" fill="#0F172A" />
          <circle cx="56" cy="42" r="3" fill="#0F172A" />
          <circle cx="45" cy="40" r="1.5" fill="#FFFFFF" />
          <circle cx="57" cy="40" r="1.5" fill="#FFFFFF" />

          {/* Tiny Beak */}
          <polygon points="48,47 52,47 50,52" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />

          {/* Little eggshell hat on head */}
          <path
            d="M38 34 Q50 20 62 34 L56 31 L50 35 L44 31 Z"
            fill="url(#eggOwlGrad)"
            stroke="#D97706"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    );
  }

  // 3. GIAI ĐOẠN: BABY (BÉ CON)
  if (stage === "baby") {
    return (
      <div
        className={`relative inline-flex items-center justify-center select-none ${className}`}
        style={{ width: dim, height: dim }}
      >
        <svg
          width={dim}
          height={dim}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={animate ? "transition-transform hover:scale-105 duration-300" : ""}
        >
          {defs}
          {/* Little Feet */}
          <ellipse cx="44" cy="84" rx="4" ry="2.5" fill="#F59E0B" />
          <ellipse cx="56" cy="84" rx="4" ry="2.5" fill="#F59E0B" />

          {/* Chubby Round Body */}
          <ellipse cx="50" cy="58" rx="26" ry="26" fill="url(#owlBody)" />
          <ellipse cx="50" cy="62" rx="18" ry="18" fill="url(#owlBelly)" />

          {/* Fluffy little wings */}
          <ellipse cx="26" cy="60" rx="5" ry="10" fill="url(#owlBody)" />
          <ellipse cx="74" cy="60" rx="5" ry="10" fill="url(#owlBody)" />

          {/* Round Eyes */}
          <circle cx="42" cy="46" r="11" fill="#FFFDF5" />
          <circle cx="58" cy="46" r="11" fill="#FFFDF5" />
          <circle cx="42" cy="46" r="7" fill="url(#eyeGrad)" />
          <circle cx="58" cy="46" r="7" fill="url(#eyeGrad)" />
          <circle cx="43" cy="45" r="4" fill="#0F172A" />
          <circle cx="57" cy="45" r="4" fill="#0F172A" />
          <circle cx="44" cy="43" r="1.8" fill="#FFFFFF" />
          <circle cx="58" cy="43" r="1.8" fill="#FFFFFF" />

          {/* Baby Round Glasses */}
          <circle cx="42" cy="46" r="10" fill="none" stroke="url(#goldAcc)" strokeWidth="2" />
          <circle cx="58" cy="46" r="10" fill="none" stroke="url(#goldAcc)" strokeWidth="2" />
          <line x1="52" y1="46" x2="48" y2="46" stroke="url(#goldAcc)" strokeWidth="2" />

          {/* Beak */}
          <polygon points="48,51 52,51 50,56" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  // 4. GIAI ĐOẠN: TEEN (THIẾU NIÊN)
  if (stage === "teen") {
    return (
      <div
        className={`relative inline-flex items-center justify-center select-none ${className}`}
        style={{ width: dim, height: dim }}
      >
        <svg
          width={dim}
          height={dim}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={animate ? "transition-transform hover:scale-105 duration-300" : ""}
        >
          {defs}
          {/* Perch */}
          <path d="M20 88 Q50 90 80 88" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" />
          <ellipse cx="44" cy="86" rx="4" ry="2" fill="#F59E0B" />
          <ellipse cx="56" cy="86" rx="4" ry="2" fill="#F59E0B" />

          {/* Main Body */}
          <ellipse cx="50" cy="56" rx="28" ry="28" fill="url(#owlBody)" />
          <ellipse cx="50" cy="60" rx="19" ry="20" fill="url(#owlBelly)" />

          {/* Folded Wings */}
          <path d="M24 50 C20 60 22 74 30 78 C33 72 32 60 28 50 Z" fill="url(#owlBody)" />
          <path d="M76 50 C80 60 78 74 70 78 C67 72 68 60 72 50 Z" fill="url(#owlBody)" />

          {/* Face Disc & Eyes */}
          <circle cx="41" cy="42" r="12" fill="#FFFDF5" />
          <circle cx="59" cy="42" r="12" fill="#FFFDF5" />
          <circle cx="41" cy="42" r="7.5" fill="url(#eyeGrad)" />
          <circle cx="59" cy="42" r="7.5" fill="url(#eyeGrad)" />
          <circle cx="42" cy="41" r="4" fill="#0F172A" />
          <circle cx="58" cy="41" r="4" fill="#0F172A" />
          <circle cx="44" cy="39" r="1.6" fill="#FFFFFF" />
          <circle cx="60" cy="39" r="1.6" fill="#FFFFFF" />

          {/* Scholarly Spectacles */}
          <circle cx="41" cy="42" r="10.5" fill="none" stroke="url(#goldAcc)" strokeWidth="2.2" />
          <circle cx="59" cy="42" r="10.5" fill="none" stroke="url(#goldAcc)" strokeWidth="2.2" />
          <line x1="51.5" y1="42" x2="48.5" y2="42" stroke="url(#goldAcc)" strokeWidth="2.2" />

          {/* Beak */}
          <polygon points="48,47 52,47 50,53" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />

          {/* Book Held by Teen Owl */}
          <path d="M36 68 Q50 64 64 68 L62 78 Q50 74 38 78 Z" fill="#FBF8EF" stroke="#1E293B" strokeWidth="1.2" />
          <line x1="50" y1="65" x2="50" y2="76" stroke="#92400E" strokeWidth="1.2" />
        </svg>
      </div>
    );
  }

  // 5. GIAI ĐOẠN: ADULT (TRƯỞNG THÀNH)
  if (stage === "adult") {
    return (
      <div
        className={`relative inline-flex items-center justify-center select-none ${className}`}
        style={{ width: dim, height: dim }}
      >
        <svg
          width={dim}
          height={dim}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={animate ? "transition-transform hover:scale-105 duration-300" : ""}
        >
          {defs}
          {/* Perch */}
          <path d="M18 90 Q50 92 82 90" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" />
          <ellipse cx="43" cy="88" rx="4" ry="2" fill="#F59E0B" />
          <ellipse cx="57" cy="88" rx="4" ry="2" fill="#F59E0B" />

          {/* Main Body */}
          <ellipse cx="50" cy="60" rx="28" ry="29" fill="url(#owlBody)" />
          <ellipse cx="50" cy="63" rx="19" ry="21" fill="url(#owlBelly)" />

          {/* Face Disk */}
          <circle cx="41" cy="46" r="12" fill="#FFFDF5" />
          <circle cx="59" cy="46" r="12" fill="#FFFDF5" />
          <circle cx="41" cy="46" r="7.5" fill="url(#eyeGrad)" />
          <circle cx="59" cy="46" r="7.5" fill="url(#eyeGrad)" />
          <circle cx="42" cy="45" r="4" fill="#0F172A" />
          <circle cx="58" cy="45" r="4" fill="#0F172A" />
          <circle cx="44" cy="43" r="1.6" fill="#FFFFFF" />
          <circle cx="60" cy="43" r="1.6" fill="#FFFFFF" />

          {/* Gold Glasses */}
          <circle cx="41" cy="46" r="10.5" fill="none" stroke="url(#goldAcc)" strokeWidth="2.2" />
          <circle cx="59" cy="46" r="10.5" fill="none" stroke="url(#goldAcc)" strokeWidth="2.2" />
          <line x1="51.5" y1="46" x2="48.5" y2="46" stroke="url(#goldAcc)" strokeWidth="2.2" />

          {/* Beak */}
          <polygon points="48,51 52,51 50,57" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />

          {/* Open Book */}
          <path d="M34 72 Q50 68 66 72 L64 82 Q50 78 36 82 Z" fill="#FBF8EF" stroke="#1E293B" strokeWidth="1.2" />
          <line x1="50" y1="69" x2="50" y2="80" stroke="#92400E" strokeWidth="1.2" />

          {/* Graduation Mortarboard */}
          <polygon points="50,14 76,24 50,33 24,24" fill="#0F172A" stroke="url(#goldAcc)" strokeWidth="1.5" />
          <rect x="38" y="27" width="24" height="5" rx="1.5" fill="#0F172A" />
          <circle cx="50" cy="23" r="2" fill="url(#goldAcc)" />
          <path d="M50 23 Q62 25 65 35" stroke="url(#goldAcc)" strokeWidth="1.5" fill="none" />
          <circle cx="65" cy="35" r="2" fill="url(#goldAcc)" />
        </svg>
      </div>
    );
  }

  // 6. GIAI ĐOẠN: LEGENDARY (HUYỀN THOẠI 60+ NGÀY)
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: dim, height: dim }}
    >
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={animate ? "transition-transform hover:scale-105 duration-300" : ""}
      >
        {defs}
        {/* Golden Halo Aura with Filter */}
        <ellipse cx="50" cy="46" rx="42" ry="42" fill="none" stroke="url(#goldAcc)" strokeWidth="2" strokeDasharray="4 3" opacity="0.8" filter="url(#legendaryGlow)" />
        <ellipse cx="50" cy="22" rx="30" ry="7" fill="none" stroke="url(#goldAcc)" strokeWidth="2.5" filter="url(#legendaryGlow)" />

        {/* Floating Magic Stars */}
        <polygon points="18,30 20,35 25,36 21,39 22,44 18,41 14,44 15,39 11,36 16,35" fill="url(#goldAcc)" />
        <polygon points="82,30 84,35 89,36 85,39 86,44 82,41 78,44 79,39 75,36 80,35" fill="url(#goldAcc)" />

        {/* Royal Mantle Cape */}
        <path d="M22 62 C16 75 22 92 34 92 L66 92 C78 92 84 75 78 62 Z" fill="#881337" stroke="url(#goldAcc)" strokeWidth="1.5" />

        {/* Main Body */}
        <ellipse cx="50" cy="62" rx="27" ry="28" fill="url(#owlBody)" />
        <ellipse cx="50" cy="65" rx="18" ry="20" fill="url(#owlBelly)" />

        {/* Eyes & Glasses */}
        <circle cx="41" cy="48" r="11" fill="#FFFDF5" />
        <circle cx="59" cy="48" r="11" fill="#FFFDF5" />
        <circle cx="41" cy="48" r="7" fill="url(#eyeGrad)" />
        <circle cx="59" cy="48" r="7" fill="url(#eyeGrad)" />
        <circle cx="42" cy="47" r="4" fill="#0F172A" />
        <circle cx="58" cy="47" r="4" fill="#0F172A" />
        <circle cx="44" cy="45" r="1.6" fill="#FFFFFF" />
        <circle cx="60" cy="45" r="1.6" fill="#FFFFFF" />

        <circle cx="41" cy="48" r="10" fill="none" stroke="url(#goldAcc)" strokeWidth="2.5" />
        <circle cx="59" cy="48" r="10" fill="none" stroke="url(#goldAcc)" strokeWidth="2.5" />
        <line x1="51" y1="48" x2="49" y2="48" stroke="url(#goldAcc)" strokeWidth="2.5" />

        <polygon points="48,53 52,53 50,59" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />

        {/* Golden Imperial Crown on top of cap */}
        <polygon points="50,18 76,28 50,37 24,28" fill="#0F172A" stroke="url(#goldAcc)" strokeWidth="1.8" />
        <path d="M38 18 L44 12 L50 18 L56 12 L62 18 Z" fill="url(#goldAcc)" stroke="#B45309" strokeWidth="1" />
        <circle cx="44" cy="11" r="1.5" fill="#EF4444" />
        <circle cx="50" cy="11" r="1.8" fill="#3B82F6" />
        <circle cx="56" cy="11" r="1.5" fill="#10B981" />
      </svg>
    </div>
  );
}

