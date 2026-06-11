"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[#0c1722]/90 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variants = {
    primary:
      "border-cyan-300/30 bg-cyan-300 text-[#061219] hover:bg-cyan-200 shadow-[0_8px_30px_rgba(75,209,229,0.15)]",
    secondary:
      "border-white/12 bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]",
    ghost:
      "border-transparent bg-transparent text-slate-300 hover:bg-white/[0.06] hover:text-white",
    danger:
      "border-rose-400/20 bg-rose-400/10 text-rose-200 hover:bg-rose-400/15",
  };

  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: "cyan" | "blue" | "emerald" | "amber" | "red" | "slate";
  className?: string;
}) {
  const tones = {
    cyan: "border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
    blue: "border-blue-400/20 bg-blue-400/10 text-blue-200",
    emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    amber: "border-amber-300/20 bg-amber-300/10 text-amber-100",
    red: "border-rose-400/20 bg-rose-400/10 text-rose-200",
    slate: "border-slate-400/15 bg-slate-400/10 text-slate-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300">
      <span className="h-px w-5 bg-cyan-300/60" />
      {children}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  accent = "cyan",
}: {
  label: string;
  value: string;
  detail: string;
  accent?: "cyan" | "emerald" | "amber" | "blue" | "red";
}) {
  const colors = {
    cyan: "text-cyan-300",
    emerald: "text-emerald-300",
    amber: "text-amber-200",
    blue: "text-blue-300",
    red: "text-rose-300",
  };
  return (
    <Card className="min-h-36 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">
        {label}
      </p>
      <p className={cn("mt-3 text-3xl font-semibold tracking-tight", colors[accent])}>
        {value}
      </p>
      <p className="mt-2 text-sm leading-5 text-slate-400">{detail}</p>
    </Card>
  );
}

export function EmptyValue({ children = "Not provided" }: { children?: ReactNode }) {
  return <span className="italic text-slate-600">{children}</span>;
}
