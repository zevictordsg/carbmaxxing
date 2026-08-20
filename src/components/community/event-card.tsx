"use client";

import { useEffect, useState } from "react";

type CountdownParts = { days: number; hours: number; minutes: number; seconds: number };

function getCountdown(target: number): CountdownParts {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="heading-tight-2 text-3xl text-white tabular-nums sm:text-4xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="label-loose text-[9px] text-white/50 mt-1">{label}</span>
    </div>
  );
}

/**
 * Featured "next call" card with a live countdown. External link only --
 * there's no native voice/video, joining happens on Zoom/Meet/etc.
 */
export function EventCard({
  title,
  description,
  scheduledAt,
  externalUrl,
}: {
  title: string;
  description: string | null;
  scheduledAt: string;
  externalUrl: string;
}) {
  const target = new Date(scheduledAt).getTime();
  const [countdown, setCountdown] = useState<CountdownParts>(() => getCountdown(target));
  const [isLive, setIsLive] = useState(() => Date.now() >= target);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(target));
      setIsLive(Date.now() >= target);
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  const formattedDate = new Date(scheduledAt).toLocaleString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8">
      <p className="label-loose text-[10px] text-muted-dim mb-2 flex items-center gap-1.5">
        <span aria-hidden>🎥</span> {isLive ? "Ao vivo agora" : "Próxima call"}
      </p>
      <h2 className="heading-tight-2 text-2xl text-white sm:text-3xl">{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-muted-dim leading-relaxed max-w-md">{description}</p>
      )}
      <p className="mt-2 text-xs text-muted-dim capitalize">{formattedDate}</p>

      {!isLive && (
        <div className="mt-6 flex items-center gap-4 sm:gap-6">
          <CountdownUnit value={countdown.days} label="dias" />
          <CountdownUnit value={countdown.hours} label="horas" />
          <CountdownUnit value={countdown.minutes} label="min" />
          <CountdownUnit value={countdown.seconds} label="seg" />
        </div>
      )}

      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-white text-black px-6 py-3 text-sm font-semibold tracking-tight hover:opacity-90 transition-opacity"
      >
        {isLive ? "Entrar na call" : "Salvar link da call"}
      </a>
    </div>
  );
}
