import React from 'react';
import {
  Cpu,
  MemoryStick,
  Wifi,
  BatteryCharging,
  Battery,
  HardDrive,
  Gauge,
  Thermometer,
  Globe,
} from 'lucide-react';
import { SystemMetrics } from '../types/assistant';

interface SystemMetricsGaugesProps {
  metrics: SystemMetrics;
}

interface CircularGaugeProps {
  percentage: number;
  label: string;
  subLabel: string;
  tooltipText: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
}

const CircularGauge: React.FC<CircularGaugeProps> = ({
  percentage,
  label,
  subLabel,
  tooltipText,
  icon,
  color,
  glowColor,
}) => {
  const radius = 30;
  const stroke = 3.5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div
      className="group relative flex flex-col items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-900/90 transition-all hover:border-cyan-500/30 hover:bg-slate-950/90"
      title={tooltipText}
    >
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* SVG Circle */}
        <svg className="w-16 h-16 -rotate-90 transform">
          <circle
            className="text-slate-900"
            strokeWidth={stroke}
            stroke="currentColor"
            fill="transparent"
            r={normalizedRadius}
            cx="32"
            cy="32"
          />
          <circle
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              filter: `drop-shadow(0 0 6px ${glowColor})`,
            }}
            strokeLinecap="round"
            fill="transparent"
            r={normalizedRadius}
            cx="32"
            cy="32"
          />
        </svg>

        {/* Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>

      <div className="text-center mt-1.5">
        <div className="text-[9px] uppercase font-mono tracking-widest text-slate-500 font-bold">
          {label}
        </div>
        <div className="text-xs font-display font-extrabold text-slate-100">{subLabel}</div>
      </div>
    </div>
  );
};

export const SystemMetricsGauges: React.FC<SystemMetricsGaugesProps> = ({ metrics }) => {
  const gpuVal = metrics.gpuPercent ?? 24;
  const diskVal = metrics.diskPercent ?? 42;
  const tempVal = metrics.cpuTempC ?? 48;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {/* 1. CPU */}
      <CircularGauge
        percentage={metrics.cpuLoad}
        label="CPU"
        subLabel={`${metrics.cpuLoad}%`}
        tooltipText={`CPU Load: ${metrics.cpuLoad}% across 8 Cores`}
        icon={<Cpu className="w-3.5 h-3.5 text-cyan-400" />}
        color="#00f0ff"
        glowColor="rgba(0, 240, 255, 0.6)"
      />

      {/* 2. RAM */}
      <CircularGauge
        percentage={metrics.ramPercent}
        label="RAM"
        subLabel={`${metrics.ramPercent}%`}
        tooltipText={`RAM Usage: ${metrics.ramUsedGB} GB / ${metrics.ramTotalGB} GB`}
        icon={<MemoryStick className="w-3.5 h-3.5 text-purple-400" />}
        color="#a855f7"
        glowColor="rgba(168, 85, 247, 0.6)"
      />

      {/* 3. GPU */}
      <CircularGauge
        percentage={gpuVal}
        label="GPU"
        subLabel={`${gpuVal}%`}
        tooltipText={`GPU Acceleration: ${gpuVal}% utilization`}
        icon={<Gauge className="w-3.5 h-3.5 text-blue-400" />}
        color="#0077ff"
        glowColor="rgba(0, 119, 255, 0.6)"
      />

      {/* 4. DISK */}
      <CircularGauge
        percentage={diskVal}
        label="DISK"
        subLabel={`${diskVal}%`}
        tooltipText={`SSD Storage: ${diskVal}% used`}
        icon={<HardDrive className="w-3.5 h-3.5 text-emerald-400" />}
        color="#10b981"
        glowColor="rgba(16, 185, 129, 0.6)"
      />

      {/* 5. BATTERY */}
      <CircularGauge
        percentage={metrics.batteryPercent ?? 100}
        label="BATTERY"
        subLabel={`${metrics.batteryPercent ?? 100}%`}
        tooltipText={`Battery Level: ${metrics.batteryPercent ?? 100}% ${metrics.isCharging ? '(Charging)' : ''}`}
        icon={
          metrics.isCharging ? (
            <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Battery className="w-3.5 h-3.5 text-slate-300" />
          )
        }
        color={metrics.batteryPercent && metrics.batteryPercent <= 20 ? '#ef4444' : '#f59e0b'}
        glowColor={
          metrics.batteryPercent && metrics.batteryPercent <= 20
            ? 'rgba(239, 68, 68, 0.6)'
            : 'rgba(245, 158, 11, 0.6)'
        }
      />

      {/* 6. LATENCY */}
      <CircularGauge
        percentage={Math.min(100, (metrics.networkLatencyMs / 200) * 100)}
        label="LATENCY"
        subLabel={`${metrics.networkLatencyMs}ms`}
        tooltipText={`Network Latency: ${metrics.networkLatencyMs}ms ping`}
        icon={<Wifi className="w-3.5 h-3.5 text-cyan-400" />}
        color="#06b6d4"
        glowColor="rgba(6, 182, 212, 0.6)"
      />

      {/* 7. TEMP */}
      <CircularGauge
        percentage={Math.min(100, (tempVal / 100) * 100)}
        label="TEMP"
        subLabel={`${tempVal}°C`}
        tooltipText={`Processor Thermal Temp: ${tempVal}°C`}
        icon={<Thermometer className="w-3.5 h-3.5 text-rose-400" />}
        color={tempVal > 75 ? '#ef4444' : '#f43f5e'}
        glowColor="rgba(244, 63, 94, 0.6)"
      />

      {/* 8. INTERNET */}
      <CircularGauge
        percentage={metrics.networkOnline ? 100 : 0}
        label="NET"
        subLabel={metrics.networkOnline ? '100%' : 'OFF'}
        tooltipText={`Internet Connectivity: ${metrics.networkOnline ? 'Online' : 'Offline'}`}
        icon={<Globe className="w-3.5 h-3.5 text-emerald-400" />}
        color={metrics.networkOnline ? '#10b981' : '#64748b'}
        glowColor="rgba(16, 185, 129, 0.6)"
      />
    </div>
  );
};
