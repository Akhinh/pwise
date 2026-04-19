// ============================================================
// PrepWise — Shared UI Components
// ============================================================

import { ReactNode } from 'react';
import Link from 'next/link';

// ── Button ────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-[#0D2137] text-white hover:bg-[#1A3A5C]',
    gold:    'bg-[#F59E0B] text-[#0D2137] hover:bg-[#FCD34D] font-bold',
    outline: 'bg-white border border-[#E2E8F0] text-[#1E293B] hover:border-blue-400 hover:bg-blue-50',
    ghost:   'bg-transparent text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]',
    danger:  'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-5 py-2.5 text-sm rounded-xl',
    lg: 'px-8 py-4 text-base rounded-xl',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 cursor-pointer border-0 outline-none disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? <Spinner size={16} /> : null}
      {children}
    </button>
  );
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`rounded-full border-2 border-[#E2E8F0] border-t-[#0D2137] animate-spin ${className}`}
      style={{ width: size, height: size, flexShrink: 0 }}
    />
  );
}

// ── Badge ─────────────────────────────────────────────────────
interface BadgeProps { children: ReactNode; variant?: 'gold' | 'green' | 'red' | 'blue' | 'navy' | 'muted'; }

export function Badge({ children, variant = 'muted' }: BadgeProps) {
  const variants = {
    gold:  'bg-[#FEF3C7] text-amber-800',
    green: 'bg-[#DCFCE7] text-green-800',
    red:   'bg-[#FEE2E2] text-red-800',
    blue:  'bg-blue-50 text-blue-800',
    navy:  'bg-[#0D2137] text-white',
    muted: 'bg-[#F8FAFC] text-[#64748B]',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, className = '', hover = false, onClick }: {
  children: ReactNode; className?: string; hover?: boolean; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-[#E2E8F0] rounded-[14px] p-5 ${hover ? 'transition-all duration-150 hover:border-blue-300 hover:shadow-md cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon: string; title: string; description: string;
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <div className="text-center py-16 px-6">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-display text-lg font-bold text-[#0D2137] mb-2">{title}</h3>
      <p className="text-[#64748B] text-sm mb-6 max-w-xs mx-auto">{description}</p>
      {action && (
        action.href
          ? <Link href={action.href} className="inline-flex items-center gap-2 bg-[#0D2137] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1A3A5C] transition-colors">{action.label}</Link>
          : <button onClick={action.onClick} className="inline-flex items-center gap-2 bg-[#0D2137] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1A3A5C] transition-colors">{action.label}</button>
      )}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = '#3B82F6', height = 8 }: {
  value: number; max?: number; color?: string; height?: number;
}) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className="rounded-full overflow-hidden bg-[#E2E8F0]" style={{ height }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ── Score Ring ────────────────────────────────────────────────
export function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
  const grade = score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold text-[#0D2137]">{score}%</span>
        <span className="text-xs font-semibold" style={{ color }}>{grade}</span>
      </div>
    </div>
  );
}

// ── Tier label helper ─────────────────────────────────────────
export function TierBadge({ tier }: { tier: string }) {
  const config: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    FREE:    { label: 'Free',    variant: 'muted' },
    STUDENT: { label: 'Student', variant: 'blue' },
    PREMIUM: { label: 'Premium', variant: 'navy' },
    SCHOOL:  { label: 'School',  variant: 'green' },
  };
  const c = config[tier] ?? config.FREE;
  return <Badge variant={c.variant}>{c.label}</Badge>;
}
