import { eventBus } from './EventBus';
import { getSystemMetrics } from './systemInfo';

export class ObserverEngine {
  private isObserving = false;
  private intervalId: NodeJS.Timeout | null = null;
  private lastBatteryState: number | null = null;

  public startObservation() {
    if (this.isObserving) return;
    this.isObserving = true;
    console.log('[ObserverEngine] Ambient desktop observation active.');

    this.intervalId = setInterval(async () => {
      const metrics = await getSystemMetrics();

      // Detect Battery Low event
      if (metrics.batteryPercent !== null && metrics.batteryPercent <= 20 && this.lastBatteryState !== metrics.batteryPercent) {
        this.lastBatteryState = metrics.batteryPercent;
        eventBus.publish('BATTERY_LOW', { percentage: metrics.batteryPercent, isCharging: metrics.isCharging }, 'CRITICAL');
      }
    }, 4000);
  }

  public stopObservation() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.isObserving = false;
  }
}

export const observerEngine = new ObserverEngine();
