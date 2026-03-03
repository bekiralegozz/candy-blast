import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export class HapticService {
    static light(): void {
        if (!isNative) return;
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }

    static medium(): void {
        if (!isNative) return;
        Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    }

    static heavy(): void {
        if (!isNative) return;
        Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    }

    static success(): void {
        if (!isNative) return;
        Haptics.notification({ type: NotificationType.Success }).catch(() => {});
    }

    static error(): void {
        if (!isNative) return;
        Haptics.notification({ type: NotificationType.Error }).catch(() => {});
    }
}
