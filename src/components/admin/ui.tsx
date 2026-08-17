'use client';

import type { ReactNode } from 'react';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-body text-[0.8125rem] font-bold uppercase tracking-[0.07em] text-[#6d6494]">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block font-body text-xs text-[#9990b8]">{hint}</span> : null}
    </label>
  );
}

const inputBase =
  'w-full rounded-2xl border border-[#ded5f2] bg-white px-4 py-3 font-body text-[1rem] text-[#3b3357] outline-none transition placeholder:text-[#b6adcf] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} min-h-[48px] ${props.className ?? ''}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} leading-relaxed ${props.className ?? ''}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputBase} min-h-[48px] ${props.className ?? ''}`} />;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[22px] bg-white/90 p-5 shadow-card ring-1 ring-white/70 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-[1.35rem] font-extrabold text-[#2f2850]">{children}</h2>
      {sub ? <p className="mt-1 font-body text-sm text-[#8b83ad]">{sub}</p> : null}
    </div>
  );
}

export function Button({
  children,
  onClick,
  tone = 'primary',
  disabled,
  type = 'button',
  className = '',
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: 'primary' | 'neutral' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
  ariaLabel?: string;
}) {
  const tones = {
    primary: 'bg-[var(--accent)] text-white shadow-button hover:brightness-105',
    neutral: 'bg-white text-[#544c7c] ring-1 ring-inset ring-[#ded5f2] hover:bg-[#faf7ff]',
    danger: 'bg-[#e11d48] text-white shadow-soft hover:brightness-105',
  } as const;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex min-h-[48px] select-none items-center justify-center gap-2 rounded-full px-5 font-display text-[0.9375rem] font-bold transition active:scale-[0.97] disabled:opacity-50 ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

/** Small round icon button, big enough to tap comfortably on a phone. */
export function IconButton({
  children,
  onClick,
  ariaLabel,
  disabled,
  tone = 'neutral',
}: {
  children: ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  disabled?: boolean;
  tone?: 'neutral' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`grid h-11 w-11 place-items-center rounded-full text-lg transition active:scale-95 disabled:opacity-40 ${
        tone === 'danger'
          ? 'bg-[#fee2e6] text-[#b3123a] hover:bg-[#fdccd4]'
          : 'bg-white text-[#544c7c] ring-1 ring-inset ring-[#ded5f2] hover:bg-[#faf7ff]'
      }`}
    >
      {children}
    </button>
  );
}

export type StatusKind = 'idle' | 'busy' | 'ok' | 'error';

export function StatusLine({ kind, message }: { kind: StatusKind; message: string }) {
  if (kind === 'idle' || !message) return null;
  const tones = {
    busy: 'bg-[#eef2ff] text-[#3c4fa8]',
    ok: 'bg-[#e8f8ee] text-[#1c7a45]',
    error: 'bg-[#fdecef] text-[#a3123a]',
    idle: '',
  } as const;
  return (
    <p
      role="status"
      aria-live="polite"
      className={`mt-3 rounded-2xl px-4 py-2.5 font-body text-sm font-semibold ${tones[kind]}`}
    >
      {kind === 'busy' ? '⏳ ' : kind === 'ok' ? '✅ ' : '⚠️ '}
      {message}
    </p>
  );
}
