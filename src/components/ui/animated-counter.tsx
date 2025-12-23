'use client';

import { useState, useEffect, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  style?: React.CSSProperties;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 800,
  decimals = 0,
  prefix = '',
  suffix = '',
  style,
  className,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousValue = useRef(value);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (previousValue.current === value) {
      setDisplayValue(value);
      return;
    }

    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    setIsAnimating(true);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setIsAnimating(false);
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  const formattedValue = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span
      className={className}
      style={{
        ...style,
        fontVariantNumeric: 'tabular-nums',
        transition: isAnimating ? 'none' : 'color 0.2s ease',
      }}
    >
      {prefix}{formattedValue}{suffix}
    </span>
  );
}

interface AnimatedPercentageProps {
  value: number;
  duration?: number;
  showSign?: boolean;
  positiveColor?: string;
  negativeColor?: string;
  neutralColor?: string;
  style?: React.CSSProperties;
}

export function AnimatedPercentage({
  value,
  duration = 600,
  showSign = true,
  positiveColor = '#22c55e',
  negativeColor = '#ef4444',
  neutralColor = '#888888',
  style,
}: AnimatedPercentageProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (previousValue.current === value) {
      setDisplayValue(value);
      return;
    }

    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  const color = displayValue > 0 ? positiveColor : displayValue < 0 ? negativeColor : neutralColor;
  const sign = showSign && displayValue > 0 ? '+' : '';

  return (
    <span
      style={{
        ...style,
        color,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {sign}{displayValue.toFixed(2)}%
    </span>
  );
}

interface AnimatedBytesProps {
  value: number;
  duration?: number;
  style?: React.CSSProperties;
}

export function AnimatedBytes({ value, duration = 800, style }: AnimatedBytesProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (previousValue.current === value) {
      setDisplayValue(value);
      return;
    }

    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <span style={{ ...style, fontVariantNumeric: 'tabular-nums' }}>
      {formatBytes(displayValue)}
    </span>
  );
}

interface AnimatedUptimeProps {
  seconds: number;
  style?: React.CSSProperties;
}

export function AnimatedUptime({ seconds, style }: AnimatedUptimeProps) {
  const formatUptime = (s: number): string => {
    if (s <= 0) return '0s';
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const minutes = Math.floor((s % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <span style={{ ...style, fontVariantNumeric: 'tabular-nums' }}>
      {formatUptime(seconds)}
    </span>
  );
}
