/**
 * Kosmos Astro — Custom SVG Icon Library
 * 50+ stroke-based icons for astrology app
 * Design: 1.8 strokeWidth, round caps, transparent fill, 24x24 viewBox
 */
import React from 'react';
import Svg, { Path, Circle, Rect, Line, Ellipse, G, Polyline, Defs, ClipPath } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const D = { size: 24, color: 'rgba(255,255,255,0.7)', sw: 1.8 };

// ─── Navigation / Tab Bar Icons ─────────────────────────────────────────────

export function HomeIcon({ size = D.size, color = D.color, strokeWidth = 1.5 }: IconProps) {
  // Vuesax outline/home — rounded house with center door line
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M9.02 2.84L3.63 7.04C2.73 7.74 2 9.23 2 10.36v7.41c0 2.32 1.91 4.23 4.25 4.23h11.5c2.34 0 4.25-1.91 4.25-4.23v-7.28c0-1.21-.81-2.76-1.8-3.45l-6.18-4.33c-1.4-.98-3.65-.93-5 .13z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="transparent"
      />
      <Path
        d="M12 17.99v-3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="transparent"
      />
    </Svg>
  );
}

export function CalendarIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={4} width={18} height={18} rx={2} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M16 2V6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M8 2V6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M3 10H21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Circle cx={12} cy={16} r={1.5} fill={color} />
    </Svg>
  );
}

export function ChatBubbleIcon({ size = D.size, color = D.color, strokeWidth = 1.5 }: IconProps) {
  // Vuesax linear/sms — envelope with V-flap
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M17 20.5H7c-3 0-5-1.5-5-5v-7c0-3.5 2-5 5-5h10c3 0 5 1.5 5 5v7c0 3.5-2 5-5 5z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="transparent"
      />
      <Path
        d="M17 9l-3.13 2.5c-1.03.82-2.72.82-3.75 0L7 9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="transparent"
      />
    </Svg>
  );
}

export function UserIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M5 20C5 16.13 8.13 14 12 14C15.87 14 19 16.13 19 20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
    </Svg>
  );
}

// ─── Vuesax Icons ───────────────────────────────────────────────────────────

export function ArrowCircleLeftIcon({ size = D.size, color = D.color, strokeWidth = 1.5 }: IconProps) {
  // Vuesax linear/arrow-circle-left
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="transparent"
      />
      <Path
        d="M13.26 15.53L9.74 12l3.52-3.53"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="transparent"
      />
    </Svg>
  );
}

export function AddCircleIcon({ size = D.size, color = D.color, strokeWidth = 1.5 }: IconProps) {
  // Vuesax linear/add-circle
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="transparent"
      />
      <Path
        d="M8 12h8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="transparent"
      />
      <Path
        d="M12 16V8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="transparent"
      />
    </Svg>
  );
}

export function TickCircleIcon({ size = D.size, color = D.color, strokeWidth = 1.5 }: IconProps) {
  // Vuesax linear/tick-circle
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="transparent"
      />
      <Path
        d="M7.75 12l2.83 2.83 5.67-5.66"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="transparent"
      />
    </Svg>
  );
}

export function MagicStarIcon({ size = D.size, color = D.color, strokeWidth = 1.5 }: IconProps) {
  // Vuesax linear/magic-star — star with small sparkle
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M6.03 18.7c-1.15.46-2.2-.59-1.74-1.74l1.57-3.92c.14-.36.14-.76 0-1.12L4.29 7.99c-.46-1.15.59-2.2 1.74-1.74l3.92 1.57c.36.14.76.14 1.12 0l3.92-1.57c1.15-.46 2.2.59 1.74 1.74L15.16 11.9c-.14.36-.14.76 0 1.12l1.57 3.93c.46 1.15-.59 2.2-1.74 1.74l-3.92-1.57a1.5 1.5 0 00-1.12 0l-3.92 1.58z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="transparent"
      />
      <Path
        d="M19.2 9.8l.6-1.5.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="transparent"
      />
    </Svg>
  );
}

export function LikeIcon({ size = D.size, color = D.color, strokeWidth = 1.5 }: IconProps) {
  // Vuesax linear/like — thumbs up
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M7.48 18.35l-3.27-2.17c-.61-.41-.91-1.17-.91-1.78V9.28c0-1.29.86-2.43 2.09-2.74l5.21-1.32c.69-.17 1.41.04 1.89.56l.57.63c.34.37.52.86.52 1.37v.42l-.53 2.3h3.1c1.55 0 2.83 1.25 2.87 2.8l.11 4.12c.04 1.57-1.18 2.88-2.74 2.95l-6.26.28a2.99 2.99 0 01-2.65-1.3z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="transparent"
      />
      <Path
        d="M5.97 18.51V8.35c0-.94-.68-1.75-1.61-1.9-.1-.01-.2-.02-.3-.02h-.04c-1.09 0-1.98.89-1.98 1.99v8.26c0 1.08.86 1.97 1.94 1.99l1.99.04v-.2z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="transparent"
      />
    </Svg>
  );
}

export function DislikeIcon({ size = D.size, color = D.color, strokeWidth = 1.5 }: IconProps) {
  // Vuesax linear/dislike — thumbs down
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M16.52 5.65l3.27 2.17c.61.41.91 1.17.91 1.78v5.12c0 1.29-.86 2.43-2.09 2.74l-5.21 1.32c-.69.17-1.41-.04-1.89-.56l-.57-.63a1.86 1.86 0 01-.52-1.37v-.42l.53-2.3h-3.1c-1.55 0-2.83-1.25-2.87-2.8L4.87 6.58c-.04-1.57 1.18-2.88 2.74-2.95l6.26-.28a2.99 2.99 0 012.65 1.3z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="transparent"
      />
      <Path
        d="M18.03 5.49v10.16c0 .94.68 1.75 1.61 1.9.1.01.2.02.3.02h.04c1.09 0 1.98-.89 1.98-1.99V7.32c0-1.08-.86-1.97-1.94-1.99l-1.99-.04v.2z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="transparent"
      />
    </Svg>
  );
}

export function BriefcaseIcon({ size = D.size, color = D.color, strokeWidth = 1.5 }: IconProps) {
  // Vuesax linear/briefcase
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8 22h8c4.02 0 4.74-1.61 4.98-3.56l.6-8c.3-2.44-.48-4.44-4.58-4.44H7c-4.1 0-4.88 2-4.58 4.44l.6 8C3.26 20.39 3.98 22 8 22z" stroke={color} strokeWidth={strokeWidth} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M8 6v-.8C8 3.43 8 2 11.2 2h1.6C16 2 16 3.43 16 5.2V6" stroke={color} strokeWidth={strokeWidth} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M14 13v1.02c0 1.09-.01 1.98-2 1.98-1.98 0-2-.88-2-1.97V13" stroke={color} strokeWidth={strokeWidth} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M21.65 11c-1.8 1.26-3.87 2.08-6.05 2.44" stroke={color} strokeWidth={strokeWidth} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M2.62 11.27c1.74 1.18 3.72 1.94 5.79 2.27" stroke={color} strokeWidth={strokeWidth} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function VerifyIcon({ size = D.size, color = D.color, strokeWidth = 1.5 }: IconProps) {
  // Vuesax linear/verify — shield-star badge with checkmark
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M21.56 10.74l-1.35-1.58c-.25-.29-.46-.84-.46-1.23v-1.7c0-1.06-.87-1.93-1.93-1.93h-1.7c-.38 0-.94-.21-1.23-.46L13.31 2.5c-.71-.59-1.88-.59-2.6 0L9.14 3.84c-.29.25-.84.46-1.23.46h-1.7c-1.06 0-1.93.87-1.93 1.93v1.71c0 .38-.21.93-.46 1.22L2.47 10.74c-.58.71-.58 1.87 0 2.58l1.35 1.58c.25.29.46.84.46 1.23v1.7c0 1.06.87 1.93 1.93 1.93h1.7c.38 0 .94.21 1.23.46l1.58 1.35c.71.59 1.88.59 2.6 0l1.58-1.35c.29-.25.85-.46 1.23-.46h1.7c1.06 0 1.93-.87 1.93-1.93v-1.71c0-.38.21-.93.46-1.22l1.35-1.58c.57-.7.57-1.87-.01-2.58z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M8.38 12l2.41 2.42 4.83-4.84" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function CoinIcon({ size = D.size }: IconProps) {
  // Gold coin — flat design with half-shadow, self-colored (matches money-icon-vector)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <ClipPath id="coinLeft">
          <Rect x={0} y={0} width={12} height={24} />
        </ClipPath>
      </Defs>
      {/* Outer ring — light gold */}
      <Circle cx={12} cy={12} r={11} fill="#FFD54F" />
      {/* Left half shadow on outer */}
      <Circle cx={12} cy={12} r={11} fill="#FBC02D" clipPath="url(#coinLeft)" />
      {/* Inner face — gold */}
      <Circle cx={12} cy={12} r={8.2} fill="#FFA726" />
      {/* Left half shadow on inner */}
      <Circle cx={12} cy={12} r={8.2} fill="#F57C00" clipPath="url(#coinLeft)" />
      {/* $ vertical stem */}
      <Line x1={12} y1={6.8} x2={12} y2={17.2} stroke="#E65100" strokeWidth={1.5} strokeLinecap="round" />
      {/* $ top curve (right to left) */}
      <Path d="M14.2 9.2C14.2 8.1 13.2 7.5 12 7.5C10.8 7.5 9.8 8.1 9.8 9.2C9.8 10.3 10.8 10.7 12 11C13.2 11.3 14.2 11.7 14.2 12.8C14.2 13.9 13.2 14.5 12 14.5C10.8 14.5 9.8 13.9 9.8 12.8" stroke="#E65100" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function ShieldTickIcon({ size = D.size, color = D.color, strokeWidth = 1.5 }: IconProps) {
  // Vuesax linear/shield-tick
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M10.49 2.23l-5.18 2.15C4.35 4.79 3.59 5.98 3.59 7.04v7.35c0 1.03.63 2.37 1.4 2.99l5.18 4.15c1.14.91 3 .91 4.14 0l5.18-4.15c.77-.62 1.4-1.96 1.4-2.99V7.04c0-1.07-.76-2.26-1.72-2.66l-5.18-2.15c-.78-.32-2.07-.32-2.5 0z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M9.05 11.87l1.61 1.61 4.3-4.3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function DocumentTextIcon({ size = D.size, color = D.color, strokeWidth = 1.5 }: IconProps) {
  // Vuesax linear/document-text
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M21 7v10c0 3-1.5 5-5 5H8c-3.5 0-5-2-5-5V7c0-3 1.5-5 5-5h8c3.5 0 5 2 5 5z" stroke={color} strokeWidth={strokeWidth} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M14.5 4.5v2c0 1.1.9 2 2 2h2" stroke={color} strokeWidth={strokeWidth} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M8 13h4" stroke={color} strokeWidth={strokeWidth} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M8 17h8" stroke={color} strokeWidth={strokeWidth} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function Setting2Icon({ size = D.size, color = D.color, strokeWidth = 1.5 }: IconProps) {
  // Vuesax linear/setting-2
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={strokeWidth} strokeMiterlimit={10} fill="transparent" />
      <Path d="M2 12.88v-1.76c0-1.04.85-1.9 1.9-1.9 1.81 0 2.55-1.28 1.64-2.85-.52-.9-.21-2.07.7-2.59l1.73-.99c.79-.47 1.81-.19 2.28.6l.11.19c.9 1.57 2.38 1.57 3.29 0l.11-.19c.47-.79 1.49-1.07 2.28-.6l1.73.99c.91.52 1.22 1.69.7 2.59-.91 1.57-.17 2.85 1.64 2.85 1.04 0 1.9.85 1.9 1.9v1.76c0 1.04-.85 1.9-1.9 1.9-1.81 0-2.55 1.28-1.64 2.85.52.91.21 2.07-.7 2.59l-1.73.99c-.79.47-1.81.19-2.28-.6l-.11-.19c-.9-1.57-2.38-1.57-3.29 0l-.11.19c-.47.79-1.49 1.07-2.28.6l-1.73-.99a1.899 1.899 0 01-.7-2.59c.91-1.57.17-2.85-1.64-2.85-1.05 0-1.9-.86-1.9-1.9z" stroke={color} strokeWidth={strokeWidth} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function VolumeHighIcon({ size = D.size, color = D.color, strokeWidth = 1.5 }: IconProps) {
  // Vuesax linear/volume-high
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M2 9.93v4.14c0 1.14.64 1.78 1.78 1.78h1.44c.35 0 .7.12.99.34l2.6 2.04c1.76 1.38 3.19.53 3.19-1.88V7.65c0-2.42-1.43-3.27-3.19-1.88l-2.6 2.04c-.29.22-.64.34-.99.34H3.78C2.64 8.15 2 8.79 2 9.93z" stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M18 8c1.78 1.79 1.78 4.71 0 6.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M19.83 5.5c3.11 3.13 3.11 8.21 0 11.34" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function VolumeSlashIcon({ size = D.size, color = D.color, strokeWidth = 1.5 }: IconProps) {
  // Vuesax linear/volume-slash
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 8.37v-.72c0-2.42-1.43-3.27-3.19-1.88l-2.6 2.04c-.29.22-.64.34-.99.34H6.78C5.64 8.15 5 8.79 5 9.93v4.14c0 .63.19 1.14.5 1.47" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M10.42 16.77c.43.54 1.21.88 2.58-.18v-4.52" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M18.81 9.42c.72 1.55.72 3.34 0 4.88" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M20.63 7.08c1.46 2.76 1.46 6.08 0 8.84" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M22 2L2 22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

// ─── Astrology Feature Icons ────────────────────────────────────────────────

export function SparklesIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" fill="transparent" />
      <Path d="M19 15L19.75 17.25L22 18L19.75 18.75L19 21L18.25 18.75L16 18L18.25 17.25L19 15Z" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function PlanetIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={7} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Ellipse cx={12} cy={12} rx={11} ry={4} stroke={color} strokeWidth={strokeWidth} fill="transparent" transform="rotate(-20 12 12)" />
    </Svg>
  );
}

export function BrushIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M18.37 2.63C19.95 4.2 20 5.94 18.37 7.56L12.87 13.06C12.87 13.06 10.56 11.44 9.43 10.31C8.31 9.19 6.94 7.13 6.94 7.13L12.44 1.63C14.06 0 15.8 0.05 17.37 1.63L18.37 2.63Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M12.87 13.06C11.19 14.75 9 18 7.5 19.5C5.5 21.5 3 22 2 21C1 20 1.5 17.5 3.5 15.5C5 14 8.25 11.81 9.93 10.12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function BirthChartIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={strokeWidth * 0.7} fill="transparent" />
      <Line x1={12} y1={3} x2={12} y2={7} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={12} y1={17} x2={12} y2={21} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={3} y1={12} x2={7} y2={12} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={17} y1={12} x2={21} y2={12} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Circle cx={12} cy={12} r={1.5} fill={color} />
    </Svg>
  );
}

export function FaceIcon({ size = D.size, color = D.color }: IconProps) {
  // face-id.svg — face scanning icon
  return (
    <Svg width={size} height={size} viewBox="0 0 5120 5120">
      <G transform="translate(0,5120) scale(1,-1)" fill={color} stroke="none">
        <Path d="M1262 4469 c-285 -49 -519 -263 -599 -549 -16 -56 -18 -105 -18 -363 l0 -299 33 -29 c52 -47 137 -32 160 28 7 17 13 135 15 298 3 243 6 276 25 336 54 163 189 298 352 351 58 19 95 21 345 26 304 5 312 6 335 62 17 40 5 91 -26 121 l-26 24 -271 2 c-150 0 -296 -3 -325 -8z" />
        <Path d="M3054 4471 c-66 -28 -85 -121 -36 -171 l28 -28 285 -4 c273 -4 287 -5 355 -30 165 -58 274 -168 342 -342 13 -33 17 -101 21 -333 6 -276 7 -293 27 -320 47 -64 150 -50 181 24 13 32 14 79 10 308 -5 310 -12 347 -84 495 -39 80 -61 110 -137 186 -77 77 -106 98 -186 137 -156 77 -176 80 -500 84 -157 1 -295 -1 -306 -6z" />
        <Path d="M1741 3381 l-31 -29 0 -255 0 -255 25 -30 c32 -38 72 -48 118 -28 63 26 67 45 67 317 l0 241 -34 34 c-46 46 -99 47 -145 5z" />
        <Path d="M2381 3381 l-31 -29 0 -346 c0 -277 -3 -353 -14 -381 -15 -35 -59 -65 -96 -65 -37 0 -81 -30 -96 -65 -19 -46 -8 -90 29 -121 29 -24 37 -26 97 -22 111 8 207 74 257 176 l28 57 3 378 3 378 -35 35 c-46 46 -99 48 -145 5z" />
        <Path d="M3021 3381 l-31 -29 0 -255 0 -255 25 -30 c32 -38 72 -48 118 -28 63 26 67 45 67 317 l0 241 -34 34 c-46 46 -99 47 -145 5z" />
        <Path d="M674 2096 l-34 -34 0 -266 c0 -282 9 -361 51 -470 59 -150 203 -309 346 -384 146 -76 192 -84 497 -89 304 -6 335 -1 366 50 25 41 25 73 0 114 -13 21 -31 35 -57 42 -22 6 -144 11 -288 11 -176 0 -265 4 -300 14 -174 46 -321 185 -377 355 -19 59 -22 97 -27 354 l-6 289 -30 24 c-46 37 -98 33 -141 -10z" />
        <Path d="M1857 2110 c-38 -30 -52 -80 -33 -123 32 -78 239 -210 396 -254 52 -14 101 -18 240 -18 170 1 178 2 270 33 102 34 186 80 276 152 64 51 84 84 84 135 0 75 -96 122 -160 78 -14 -9 -45 -34 -69 -55 -99 -86 -252 -138 -406 -138 -162 0 -304 51 -429 153 -78 64 -122 74 -169 37z" />
        <Path d="M4101 2114 c-46 -33 -51 -65 -51 -337 0 -195 -4 -266 -15 -312 -46 -176 -186 -321 -364 -375 -56 -18 -93 -20 -315 -20 -141 0 -267 -5 -288 -10 -79 -22 -104 -111 -49 -172 l29 -33 251 -3 c276 -3 384 8 493 52 180 73 329 216 408 390 55 121 62 168 67 455 6 287 1 325 -44 360 -31 25 -89 27 -122 5z" />
      </G>
    </Svg>
  );
}

export function StarIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function StarFilledIcon({ size = D.size, color = D.color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={color} stroke={color} strokeWidth={0.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HeartCircleIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M12 17C12 17 7.5 13.5 7.5 10.5C7.5 9 8.5 8 10 8C11 8 11.7 8.5 12 9C12.3 8.5 13 8 14 8C15.5 8 16.5 9 16.5 10.5C16.5 13.5 12 17 12 17Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function TarotIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Back card (tilted left) */}
      <Rect x={3} y={2.5} width={11.5} height={17} rx={1.8} stroke={color} strokeWidth={strokeWidth * 0.7} fill="transparent" transform="rotate(-8 8.75 11)" opacity={0.45} />
      {/* Front card */}
      <Rect x={7.5} y={3} width={11.5} height={17} rx={1.8} stroke={color} strokeWidth={strokeWidth} fill="transparent" transform="rotate(4 13.25 11.5)" />
      {/* Star on front card */}
      <Path d="M13.5 8.5L14.3 10.5L16.4 10.8L14.9 12.2L15.3 14.3L13.5 13.2L11.7 14.3L12.1 12.2L10.6 10.8L12.7 10.5Z" stroke={color} strokeWidth={strokeWidth * 0.65} strokeLinejoin="round" fill="transparent" />
      {/* Small diamond below star */}
      <Path d="M13.5 15.5L14.3 16.5L13.5 17.5L12.7 16.5Z" stroke={color} strokeWidth={strokeWidth * 0.5} strokeLinejoin="round" fill="transparent" opacity={0.6} />
    </Svg>
  );
}

export function AngelIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={7} r={3} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M12 10V16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M8 20L12 16L16 20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M5 12C7 9 9 10 12 10C15 10 17 9 19 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
      <Ellipse cx={12} cy={4} rx={5} ry={1.5} stroke={color} strokeWidth={strokeWidth * 0.7} fill="transparent" />
    </Svg>
  );
}

export function PeopleIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={9} cy={7} r={3} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M3 19C3 15.69 5.69 14 9 14C10.23 14 11.37 14.27 12.35 14.75" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
      <Circle cx={17} cy={9} r={2.5} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M21 20C21 17.24 19.21 15.5 17 15.5C14.79 15.5 13 17.24 13 20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
    </Svg>
  );
}

export function PalmIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M18 11V6.5C18 5.67 17.33 5 16.5 5C15.67 5 15 5.67 15 6.5V3.5C15 2.67 14.33 2 13.5 2C12.67 2 12 2.67 12 3.5V6.5C12 5.67 11.33 5 10.5 5C9.67 5 9 5.67 9 6.5V11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M18 11C19.1 11 20 11.9 20 13V14C20 18.42 16.42 22 12 22C7.58 22 4 18.42 4 14V13C4 12.45 4.45 12 5 12H6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M9 11V6.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function CoffeeIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M17 8H18C19.66 8 21 9.34 21 11C21 12.66 19.66 14 18 14H17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M3 8H17V15C17 17.76 14.76 20 12 20H8C5.24 20 3 17.76 3 15V8Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M7 3V5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M10 3V5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M13 3V5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function NumerologyIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={3} width={18} height={18} rx={3} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M9 8V16" stroke={color} strokeWidth={strokeWidth + 0.5} strokeLinecap="round" />
      <Path d="M7 8H9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M14 8C15.66 8 17 9.12 17 10.5C17 11.88 15.66 13 14 13C15.66 13 17 14.12 17 15.5C17 16.88 15.66 18 14 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
    </Svg>
  );
}

export function RisingSignIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 20V4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M5 11L12 4L19 11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M3 20H21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Circle cx={12} cy={4} r={2} stroke={color} strokeWidth={strokeWidth * 0.8} fill="transparent" />
    </Svg>
  );
}

export function CloudDreamIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6.34 15C4.49 14.73 3 13.21 3 11.32C3 9.26 4.73 7.58 6.86 7.58C7.2 7.58 7.53 7.63 7.84 7.71C8.65 5.56 10.73 4 13.19 4C16.28 4 18.78 6.46 18.78 9.5C18.78 9.58 18.78 9.66 18.77 9.74C20.06 10.34 21 11.64 21 13.15C21 15.19 19.32 16.84 17.24 16.84H6.76" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M8 19L10 17L12 19L14 17L16 19" stroke={color} strokeWidth={strokeWidth * 0.8} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function ClockIcon({ size = D.size, color = D.color, strokeWidth = 1.5 }: IconProps) {
  // Vuesax linear/clock
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="transparent"
      />
      <Path
        d="M15.71 15.18l-3.1-1.85c-.54-.32-.98-1.09-.98-1.72v-4.1"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="transparent"
      />
    </Svg>
  );
}

// ─── Zodiac Icons ───────────────────────────────────────────────────────────

export function AriesIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 20C5 13 8 6 12 4C16 6 19 13 19 20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
      <Path d="M12 4V20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function TaurusIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={15} r={6} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M4 4C6 7 8 9 12 9C16 9 18 7 20 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
    </Svg>
  );
}

export function GeminiIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 3C8 5 16 5 19 3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
      <Path d="M5 21C8 19 16 19 19 21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
      <Path d="M8 3V21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M16 3V21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function CancerIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M20 9C20 9 17 6 12 6C7 6 4 9 4 12C4 15 7 17 9 17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
      <Path d="M4 15C4 15 7 18 12 18C17 18 20 15 20 12C20 9 17 7 15 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
      <Circle cx={7} cy={9} r={2} fill={color} />
      <Circle cx={17} cy={15} r={2} fill={color} />
    </Svg>
  );
}

export function LeoIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={10} cy={10} r={4} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M14 10C14 10 18 10 18 14C18 16.5 16 18 14 18C12 18 11 17 11 17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
      <Circle cx={14} cy={18} r={2} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
    </Svg>
  );
}

export function VirgoIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 3V15C6 18 8 21 12 21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
      <Path d="M10 3V15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M14 3V15C14 18 16 20 19 20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
      <Path d="M19 16V22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M17 20H21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function LibraIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 20H21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M3 14H21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M6 14C6 10.69 8.69 8 12 8C15.31 8 18 10.69 18 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
      <Path d="M12 8V3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function ScorpioIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 3V15C5 18 7 21 10 21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
      <Path d="M10 3V15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M15 3V18L19 15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M15 18L19 21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function SagittariusIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 21L21 3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M13 3H21V11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M7 15L15 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function CapricornIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 4V16C5 19 7 21 10 21C13 21 15 19 15 16V4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M15 14C15 14 17 12 19 14C21 16 19 21 17 21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
    </Svg>
  );
}

export function AquariusIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 8L6 5L9 8L12 5L15 8L18 5L21 8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M3 16L6 13L9 16L12 13L15 16L18 13L21 16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function PiscesIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 12C6 6 9 4 12 4C15 4 18 6 21 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
      <Path d="M3 12C6 18 9 20 12 20C15 20 18 18 21 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
      <Path d="M3 12H21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

// ─── UI / Action Icons ──────────────────────────────────────────────────────

export function BellIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M18 8C18 6.41 17.37 4.88 16.24 3.76C15.12 2.63 13.59 2 12 2C10.41 2 8.88 2.63 7.76 3.76C6.63 4.88 6 6.41 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M13.73 21C13.55 21.3 13.3 21.55 13 21.73C12.69 21.9 12.35 22 12 22C11.65 22 11.31 21.9 11 21.73C10.7 21.55 10.45 21.3 10.27 21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function MoonIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function SunIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function CompassIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M16.24 7.76L14.12 14.12L7.76 16.24L9.88 9.88L16.24 7.76Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = D.size, color = D.color, strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 6L15 12L9 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function ChevronBackIcon({ size = D.size, color = D.color, strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 18L9 12L15 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function PlusIcon({ size = D.size, color = D.color, strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 5V19M5 12H19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function SearchIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M21 21L16.5 16.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function SendIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M22 2L11 13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function CameraIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M23 19C23 19.53 22.79 20.04 22.41 20.41C22.04 20.79 21.53 21 21 21H3C2.47 21 1.96 20.79 1.59 20.41C1.21 20.04 1 19.53 1 19V8C1 7.47 1.21 6.96 1.59 6.59C1.96 6.21 2.47 6 3 6H7L9 3H15L17 6H21C21.53 6 22.04 6.21 22.41 6.59C22.79 6.96 23 7.47 23 8V19Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Circle cx={12} cy={13} r={4} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
    </Svg>
  );
}

/** Mic Bold — filled variant, best on dark backgrounds */
export function MicBoldIcon({ size = D.size, color = D.color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21.93C6.96 21.93 2.85 17.83 2.85 12.78V10.9C2.85 10.51 3.17 10.2 3.55 10.2C3.93 10.2 4.25 10.52 4.25 10.9V12.78C4.25 17.05 7.72 20.52 11.99 20.52C16.26 20.52 19.73 17.05 19.73 12.78V10.9C19.73 10.51 20.05 10.2 20.43 10.2C20.81 10.2 21.13 10.52 21.13 10.9V12.78C21.15 17.83 17.04 21.93 12 21.93Z" fill={color} />
      <Path d="M12 2C8.64 2 5.9 4.74 5.9 8.1V12.79C5.9 16.15 8.64 18.89 12 18.89C15.36 18.89 18.1 16.15 18.1 12.79V8.1C18.1 4.74 15.36 2 12 2ZM14.18 10.59C14.11 10.86 13.86 11.04 13.59 11.04C13.54 11.04 13.48 11.03 13.43 11.02C12.41 10.74 11.33 10.74 10.31 11.02C9.98 11.11 9.65 10.92 9.56 10.59C9.47 10.27 9.66 9.93 9.99 9.84C11.22 9.5 12.52 9.5 13.75 9.84C14.08 9.93 14.27 10.26 14.18 10.59ZM15.03 7.82C14.94 8.07 14.71 8.22 14.46 8.22C14.39 8.22 14.32 8.21 14.25 8.18C12.72 7.62 11.04 7.62 9.51 8.18C9.19 8.3 8.84 8.14 8.72 7.82C8.61 7.51 8.77 7.16 9.09 7.04C10.89 6.39 12.87 6.39 14.66 7.04C14.98 7.16 15.14 7.51 15.03 7.82Z" fill={color} />
    </Svg>
  );
}

/** Mic Linear — stroke variant, best on light backgrounds */
export function MicLinearIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 19C15.31 19 18 16.31 18 13V8C18 4.69 15.31 2 12 2C8.69 2 6 4.69 6 8V13C6 16.31 8.69 19 12 19Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M3 11V13C3 17.97 7.03 22 12 22C16.97 22 21 17.97 21 13V11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M9.11 7.48C10.89 6.83 12.83 6.83 14.61 7.48" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M10.03 10.48C11.23 10.15 12.5 10.15 13.7 10.48" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

/** Mic Icon — legacy export, same as MicLinearIcon */
export function MicIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return <MicLinearIcon size={size} color={color} strokeWidth={strokeWidth} />;
}

/** Add Square Bold — filled variant (two overlapping squares with +) */
export function AddSquareBoldIcon({ size = D.size, color = D.color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 9V18C20.6569 18 22 16.6569 22 15V5C22 3.34315 20.6569 2 19 2H9C7.34315 2 6 3.34315 6 5H15C17.2091 5 19 6.79086 19 9Z" fill={color} />
      <Path fillRule="evenodd" clipRule="evenodd" d="M2 19C2 20.6569 3.34315 22 5 22H15C16.6569 22 18 20.6569 18 19V9C18 7.34315 16.6569 6 15 6H5C3.34315 6 2 7.34315 2 9V19ZM6 14C6 13.4477 6.44772 13 7 13H9V11C9 10.4477 9.44772 10 10 10C10.5523 10 11 10.4477 11 11V13H13C13.5523 13 14 13.4477 14 14C14 14.5523 13.5523 15 13 15H11V17C11 17.5523 10.5523 18 10 18C9.44771 18 9 17.5523 9 17V15H7C6.44772 15 6 14.5523 6 14Z" fill={color} />
    </Svg>
  );
}

/** Add Square Linear — stroke variant (two overlapping squares with +) */
export function AddSquareLinearIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 14C6 13.4477 6.44772 13 7 13H9V11C9 10.4477 9.44772 10 10 10C10.5523 10 11 10.4477 11 11V13H13C13.5523 13 14 13.4477 14 14C14 14.5523 13.5523 15 13 15H11V17C11 17.5523 10.5523 18 10 18C9.44771 18 9 17.5523 9 17V15H7C6.44772 15 6 14.5523 6 14Z" fill={color} />
      <Path fillRule="evenodd" clipRule="evenodd" d="M18 18V19C18 20.6569 16.6569 22 15 22H5C3.34315 22 2 20.6569 2 19V9C2 7.34315 3.34315 6 5 6H6V5C6 3.34315 7.34315 2 9 2H19C20.6569 2 22 3.34315 22 5V15C22 16.6569 20.6569 18 19 18H18ZM8 6V5C8 4.44771 8.44772 4 9 4H19C19.5523 4 20 4.44772 20 5V15C20 15.5523 19.5523 16 19 16H18V9C18 7.34315 16.6569 6 15 6H8ZM4 19C4 19.5523 4.44772 20 5 20H15C15.5523 20 16 19.5523 16 19V9C16 8.44772 15.5523 8 15 8H5C4.44772 8 4 8.44771 4 9V19Z" stroke={color} strokeWidth={strokeWidth} fill="transparent" />
    </Svg>
  );
}

export function ImageIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={3} width={18} height={18} rx={2} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Circle cx={8.5} cy={8.5} r={1.5} fill={color} />
      <Path d="M21 15L16 10L5 21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function GiftIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={8} width={18} height={4} rx={1} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M12 8V22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M19 12V20C19 21.1 18.1 22 17 22H7C5.9 22 5 21.1 5 20V12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M7.5 8C6.12 8 5 6.88 5 5.5C5 4.12 6.12 3 7.5 3C9.5 3 12 5 12 8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
      <Path d="M16.5 8C17.88 8 19 6.88 19 5.5C19 4.12 17.88 3 16.5 3C14.5 3 12 5 12 8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
    </Svg>
  );
}

// Based on assets/svg/giftbox_1139982.svg — filled gift box with ribbon & bow
export function GiftBoxIcon({ size = D.size, color = D.color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <G transform="translate(0,512) scale(0.1,-0.1)">
        <Path
          d="M874 5109 c-109 -14 -219 -90 -266 -183 -37 -72 -157 -406 -168 -467 -27 -147 59 -314 192 -377 26 -12 229 -72 450 -133 222 -61 404 -112 405 -113 1 0 -23 -39 -53 -86 -311 -481 -547 -1010 -692 -1555 -61 -228 -132 -578 -119 -591 2 -3 33 20 68 50 149 128 473 367 482 355 2 -2 21 -35 43 -74 82 -149 301 -481 311 -472 2 2 12 53 23 113 55 300 134 580 243 859 47 120 139 322 184 404 111 204 155 280 168 291 12 10 14 -25 12 -252 -1 -144 -1 -849 1 -1565 l2 -1303 400 0 400 0 1 1268 c1 697 5 1400 8 1562 l6 295 33 -54 c57 -92 179 -325 233 -444 146 -324 261 -691 323 -1031 14 -76 27 -140 29 -142 11 -11 329 480 350 540 7 20 308 -196 486 -350 35 -30 66 -53 68 -50 6 6 -20 166 -53 321 -134 629 -396 1263 -746 1805 -37 57 -66 105 -65 106 1 1 183 52 405 113 222 61 424 121 450 133 133 63 219 230 192 377 -10 59 -130 394 -165 461 -60 118 -180 190 -316 192 -36 0 -84 -5 -105 -12 -22 -7 -286 -129 -587 -272 l-549 -260 -21 20 c-51 48 -78 52 -377 52 -299 0 -326 -4 -377 -52 l-22 -20 -548 260 c-301 143 -564 264 -583 270 -54 16 -100 19 -156 11z"
          fill={color}
        />
      </G>
    </Svg>
  );
}

// Based on assets/svg/icons8-premium-32.svg — premium crown/gem badge
export function PremiumCrownIcon({ size = D.size, color = D.color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <G transform="translate(0,32) scale(0.1,-0.1)">
        <Path
          d="M145 280 c-4 -6 -11 -8 -16 -4 -12 7 -65 -43 -56 -53 4 -3 2 -12 -4 -19 -6 -7 -7 -19 -3 -26 14 -22 12 -52 -3 -70 -17 -19 -10 -38 16 -38 10 0 24 -12 31 -26 l14 -25 18 23 18 23 18 -21 18 -21 17 24 c10 12 24 23 32 23 22 0 27 17 13 42 -15 26 -17 47 -4 66 4 7 3 19 -3 26 -6 7 -8 16 -4 19 9 10 -44 60 -56 53 -5 -4 -12 -2 -16 4 -3 5 -10 10 -15 10 -5 0 -12 -5 -15 -10z m62 -42 c23 -17 25 -45 7 -84 -13 -27 -20 -31 -49 -28 -66 5 -87 41 -59 100 13 27 20 31 49 28 19 -1 42 -8 52 -16z m-78 -134 c15 10 24 -13 11 -29 -10 -12 -15 -12 -35 3 -12 9 -20 23 -18 30 4 9 9 10 19 1 7 -6 18 -8 23 -5z m90 -23 c-20 -16 -26 -18 -38 -6 -16 15 -6 36 13 29 8 -3 17 0 21 6 5 8 10 9 18 1 7 -7 3 -16 -14 -30z"
          fill={color}
        />
        <Path
          d="M170 205 c-7 -9 -21 -13 -31 -10 -23 8 -25 -8 -4 -25 13 -11 20 -9 40 10 14 13 25 27 25 32 0 13 -17 9 -30 -7z"
          fill={color}
        />
      </G>
    </Svg>
  );
}

// Streak fire icon — filled, more impactful than FlameIcon
export function StreakFireIcon({ size = D.size, color = D.color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 23C7.58 23 4 19.42 4 15C4 12.76 4.95 10.55 6.64 8.86L10.29 5.21C10.68 4.82 11.32 4.82 11.71 5.21L15.36 8.86C17.05 10.55 18 12.76 18 15C18 19.42 14.42 23 12 23ZM12 7.04L9.05 10C7.73 11.32 7 13.12 7 15C7 17.76 9.24 20 12 20C14.76 20 17 17.76 17 15C17 13.12 16.27 11.32 14.95 10L12 7.04Z"
        fill={color}
      />
      <Path
        d="M12 19C10.34 19 9 17.66 9 16C9 14.87 9.5 13.81 10.35 13.1L12 11.69L13.65 13.1C14.5 13.81 15 14.87 15 16C15 17.66 13.66 19 12 19Z"
        fill={color}
      />
    </Svg>
  );
}

export function SettingsIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
    </Svg>
  );
}

export function ShareIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={18} cy={5} r={3} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Circle cx={6} cy={12} r={3} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Circle cx={18} cy={19} r={3} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M8.59 13.51L15.42 17.49" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M15.41 6.51L8.59 10.49" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function ShieldIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3L4 7V12C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12V7L12 3Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M9 12L11 14L15 10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function DocumentIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M14 2H6C5.47 2 4.96 2.21 4.59 2.59C4.21 2.96 4 3.47 4 4V20C4 20.53 4.21 21.04 4.59 21.41C4.96 21.79 5.47 22 6 22H18C18.53 22 19.04 21.79 19.41 21.41C19.79 21.04 20 20.53 20 20V8L14 2Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M14 2V8H20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M16 13H8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M16 17H8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function GlobeIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M2 12H22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M12 2C14.5 4.74 15.92 8.29 16 12C15.92 15.71 14.5 19.26 12 22C9.5 19.26 8.08 15.71 8 12C8.08 8.29 9.5 4.74 12 2Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function LanguageIcon({ size = D.size, color = D.color }: IconProps) {
  // Based on assets/burc/language.svg — two chat bubbles with "A" and translate icon
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        d="M41 17H23a5.006 5.006 0 0 0-5 5V34a5.006 5.006 0 0 0 5 5H33.086l4.353 4.354A1.5 1.5 0 0 0 40 42.293V39h1a5.006 5.006 0 0 0 5-5V22A5.006 5.006 0 0 0 41 17Zm-4 9.5h-.559a8.973 8.973 0 0 1-2.661 5.434 6.949 6.949 0 0 0 2.72.566 1.031 1.031 0 0 1 1.036 1 .97.97 0 0 1-.965 1 9.127 9.127 0 0 1-4.551-1.23A8.932 8.932 0 0 1 27.5 34.5a1.031 1.031 0 0 1-1.036-1 .97.97 0 0 1 .965-1 7.128 7.128 0 0 0 2.811-.574 8.855 8.855 0 0 1-1.875-2.573 1 1 0 1 1 1.806-.857 6.974 6.974 0 0 0 1.823 2.352A6.96 6.96 0 0 0 34.42 26.5H27a1 1 0 0 1 0-2h4v-2a1 1 0 0 1 2 0v2h4a1 1 0 0 1 0 2Z"
        fill={color}
      />
      <Path
        d="M25,6H7a5.006,5.006,0,0,0-5,5V23a5.006,5.006,0,0,0,5,5H8v3.293a1.5,1.5,0,0,0,2.561,1.061L14.914,28H16V22a6.956,6.956,0,0,1,.3-2H13.462L11.91,23.414a1,1,0,0,1-1.82-.828l5-11a1,1,0,0,1,1.82,0l2.117,4.657h0A6.952,6.952,0,0,1,23,15h7V11A5.006,5.006,0,0,0,25,6Z"
        fill={color}
      />
    </Svg>
  );
}

export function DiamondIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 3H18L22 9L12 21L2 9L6 3Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M2 9H22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M12 21L9 9L6 3" stroke={color} strokeWidth={strokeWidth * 0.8} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M12 21L15 9L18 3" stroke={color} strokeWidth={strokeWidth * 0.8} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function FlameIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 22C16.42 22 20 18.42 20 14C20 8 12 2 12 2C12 2 4 8 4 14C4 18.42 7.58 22 12 22Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M12 22C14.21 22 16 19.31 16 16C16 12 12 8 12 8C12 8 8 12 8 16C8 19.31 9.79 22 12 22Z" stroke={color} strokeWidth={strokeWidth * 0.8} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function TelescopeIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 21L12 13L18 21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M12 13V8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M3 6L21 2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M6 5L4.5 8.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M18 3L16.5 6.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Circle cx={12} cy={5} r={2.5} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
    </Svg>
  );
}

export function XIcon({ size = D.size, color = D.color, strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function CheckIcon({ size = D.size, color = D.color, strokeWidth = 2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 13L9 17L19 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function CheckCircleIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M9 12L11 14L15 10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function InfoIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M12 16V12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Circle cx={12} cy={8} r={1} fill={color} />
    </Svg>
  );
}

export function AlertIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M10.29 3.86L1.82 18C1.64 18.32 1.55 18.68 1.55 19.04C1.55 20.13 2.42 21 3.53 21H20.47C21.58 21 22.45 20.13 22.45 19.04C22.45 18.68 22.36 18.32 22.18 18L13.71 3.86C13.08 2.71 11.92 2.71 10.29 3.86Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M12 9V13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Circle cx={12} cy={17} r={1} fill={color} />
    </Svg>
  );
}

export function TrashIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 6H21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M8 6V4C8 3.45 8.45 3 9 3H15C15.55 3 16 3.45 16 4V6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M19 6V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M10 10V17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M14 10V17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function LogoutIcon({ size = D.size, color = D.color }: IconProps) {
  // Based on assets/svg/logout-svgrepo-com.svg — filled door + arrow
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M13 2C10.2386 2 8 4.23858 8 7C8 7.55228 8.44772 8 9 8C9.55228 8 10 7.55228 10 7C10 5.34315 11.3431 4 13 4H17C18.6569 4 20 5.34315 20 7V17C20 18.6569 18.6569 20 17 20H13C11.3431 20 10 18.6569 10 17C10 16.4477 9.55228 16 9 16C8.44772 16 8 16.4477 8 17C8 19.7614 10.2386 22 13 22H17C19.7614 22 22 19.7614 22 17V7C22 4.23858 19.7614 2 17 2H13Z" fill={color} />
      <Path d="M14 11C14.5523 11 15 11.4477 15 12C15 12.5523 14.5523 13 14 13V11Z" fill={color} />
      <Path d="M5.71783 11C5.80685 10.8902 5.89214 10.7837 5.97282 10.682C6.21831 10.3723 6.42615 10.1004 6.57291 9.90549C6.64636 9.80795 6.70468 9.72946 6.74495 9.67492L6.79152 9.61162L6.804 9.59454L6.80842 9.58848C7.13304 9.14167 7.0345 8.51561 6.58769 8.19098C6.14091 7.86637 5.51558 7.9654 5.19094 8.41215L5.18812 8.41602L5.17788 8.43002L5.13612 8.48679C5.09918 8.53682 5.04456 8.61033 4.97516 8.7025C4.83623 8.88702 4.63874 9.14542 4.40567 9.43937C3.93443 10.0337 3.33759 10.7481 2.7928 11.2929L2.08569 12L2.7928 12.7071C3.33759 13.2519 3.93443 13.9663 4.40567 14.5606C4.63874 14.8546 4.83623 15.113 4.97516 15.2975C5.04456 15.3897 5.09918 15.4632 5.13612 15.5132L5.17788 15.57L5.18812 15.584L5.19045 15.5872C5.51509 16.0339 6.14091 16.1336 6.58769 15.809C7.0345 15.4844 7.13355 14.859 6.80892 14.4122L6.804 14.4055L6.79152 14.3884L6.74495 14.3251C6.70468 14.2705 6.64636 14.1921 6.57291 14.0945C6.42615 13.8996 6.21831 13.6277 5.97282 13.318C5.89214 13.2163 5.80685 13.1098 5.71783 13H14V11H5.71783Z" fill={color} />
    </Svg>
  );
}

export function LockIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={5} y={11} width={14} height={10} rx={2} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M8 11V7C8 4.79 9.79 3 12 3C14.21 3 16 4.79 16 7V11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
      <Circle cx={12} cy={16} r={1.5} fill={color} />
    </Svg>
  );
}

export function EyeIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
    </Svg>
  );
}

export function EyeOffIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 3L21 21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M10.5 10.68C10.18 11.03 9.99 11.5 9.99 12C9.99 13.1 10.88 14 11.99 14C12.49 14 12.95 13.81 13.31 13.49" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
      <Path d="M17.36 17.35C15.73 18.45 13.94 19 12 19C5.5 19 2 12 2 12C2 12 3.36 9.35 5.76 7.35" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
      <Path d="M9.75 5.27C10.47 5.09 11.23 5 12 5C18.5 5 22 12 22 12C22 12 21.31 13.4 19.94 15.04" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
    </Svg>
  );
}

export function MailIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={5} width={18} height={14} rx={2} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M3 7L12 13L21 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function WalletIcon({ size = D.size, color = D.color, strokeWidth = 1.5 }: IconProps) {
  // Vuesax linear/wallet
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M13 9h6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M22 10.97v2.06c0 .55-.44 1-.99 1.02h-1.96c-1.08 0-2.07-.79-2.16-1.87-.06-.63.18-1.22.6-1.63.37-.38.88-.58 1.44-.58H21c.56.02 1 .47 1 1z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M17.48 10.55c-.42.41-.66 1-.6 1.63.09 1.08 1.08 1.87 2.16 1.87H21v1.45c0 3-2 5-5 5H7c-3 0-5-2-5-5v-7c0-2.72 1.64-4.62 4.19-4.94.26-.04.53-.06.81-.06h9c.26 0 .51.01.75.05C19.33 3.85 21 5.76 21 8.5v1.45h-2.08c-.56 0-1.07.2-1.44.6z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function EditIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 20H21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M16.5 3.5C16.9 3.1 17.44 2.88 18 2.88C18.56 2.88 19.1 3.1 19.5 3.5C19.9 3.9 20.12 4.44 20.12 5C20.12 5.56 19.9 6.1 19.5 6.5L7 19L3 20L4 16L16.5 3.5Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function CrystalBallIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={10} r={7} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Path d="M7 19H17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M8 21H16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M9 17V19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M15 17V19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M9 7C10.5 7 11.5 8 12 9.5" stroke={color} strokeWidth={strokeWidth * 0.8} strokeLinecap="round" fill="transparent" />
    </Svg>
  );
}

export function ConstellationIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={5} cy={5} r={1.5} fill={color} />
      <Circle cx={12} cy={3} r={1.5} fill={color} />
      <Circle cx={19} cy={7} r={1.5} fill={color} />
      <Circle cx={8} cy={12} r={1.5} fill={color} />
      <Circle cx={16} cy={14} r={1.5} fill={color} />
      <Circle cx={10} cy={20} r={1.5} fill={color} />
      <Circle cx={18} cy={20} r={1.5} fill={color} />
      <Path d="M5 5L12 3L19 7" stroke={color} strokeWidth={strokeWidth * 0.7} strokeLinecap="round" fill="transparent" />
      <Path d="M12 3L8 12L16 14" stroke={color} strokeWidth={strokeWidth * 0.7} strokeLinecap="round" fill="transparent" />
      <Path d="M16 14L10 20M16 14L18 20" stroke={color} strokeWidth={strokeWidth * 0.7} strokeLinecap="round" fill="transparent" />
    </Svg>
  );
}

export function InfinityIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M18.18 8C19.76 8 21 9.79 21 12C21 14.21 19.76 16 18.18 16C15.5 16 13.5 12 12 12C10.5 12 8.5 16 5.82 16C4.24 16 3 14.21 3 12C3 9.79 4.24 8 5.82 8C8.5 8 10.5 12 12 12C13.5 12 15.5 8 18.18 8Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function HourglassIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 3H19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M5 21H19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M7 3V8L12 12L7 16V21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M17 3V8L12 12L17 16V21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
    </Svg>
  );
}

export function BellSlashIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  // Bell with diagonal slash — notifications off
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M13.73 21C13.55 21.3 13.3 21.55 13 21.73C12.69 21.9 12.35 22 12 22C11.65 22 11.31 21.9 11 21.73C10.7 21.55 10.45 21.3 10.27 21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M18 8C18 6.41 17.37 4.88 16.24 3.76C15.12 2.63 13.59 2 12 2C10.41 2 8.88 2.63 7.76 3.76C6.63 4.88 6 6.41 6 8C6 15 3 17 3 17H17.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M3 3L21 21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function LoginIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  // Arrow pointing into door — sign in
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V19C21 19.53 20.79 20.04 20.41 20.41C20.04 20.79 19.53 21 19 21H15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M10 17L15 12L10 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M15 12H3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function MusicNoteIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 18V5L21 3V16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Circle cx={6} cy={18} r={3} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
      <Circle cx={18} cy={16} r={3} stroke={color} strokeWidth={strokeWidth} fill="transparent" />
    </Svg>
  );
}

export function PinIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 17V21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M15.5 3.5L19 7L16.5 9.5L17 14L10 7L14.5 6.5L15.5 3.5Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M6 18L10 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function ChatBubblesIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M8 9H16" stroke={color} strokeWidth={strokeWidth * 0.9} strokeLinecap="round" />
      <Path d="M8 13H13" stroke={color} strokeWidth={strokeWidth * 0.9} strokeLinecap="round" />
    </Svg>
  );
}

export function RefreshIcon({ size = D.size, color = D.color, strokeWidth = D.sw }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M1 4V10H7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M23 20V14H17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="transparent" />
      <Path d="M20.49 9C19.84 7.19 18.66 5.63 17.12 4.53C15.58 3.43 13.74 2.83 11.86 2.82C9.97 2.8 8.13 3.37 6.57 4.44C5.01 5.51 3.81 7.05 3.12 8.85" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
      <Path d="M3.51 15C4.16 16.81 5.34 18.37 6.88 19.47C8.42 20.57 10.26 21.17 12.14 21.18C14.03 21.2 15.87 20.63 17.43 19.56C18.99 18.49 20.19 16.95 20.88 15.15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" />
    </Svg>
  );
}
