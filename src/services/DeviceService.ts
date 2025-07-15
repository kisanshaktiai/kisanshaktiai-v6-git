
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';

export class DeviceService {
  private static instance: DeviceService;
  
  static getInstance(): DeviceService {
    if (!DeviceService.instance) {
      DeviceService.instance = new DeviceService();
    }
    return DeviceService.instance;
  }

  async getDeviceId(): Promise<string> {
    try {
      let { value: deviceId } = await Preferences.get({ key: 'deviceId' });
      
      if (!deviceId) {
        const info = await Device.getId();
        deviceId = info.identifier || this.generateDeviceId();
        
        await Preferences.set({
          key: 'deviceId',
          value: deviceId,
        });
      }
      
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      return this.generateDeviceId();
    }
  }

  async getDeviceInfo(): Promise<{
    platform: string;
    model: string;
    osVersion: string;
    manufacturer: string;
  }> {
    try {
      const info = await Device.getInfo();
      return {
        platform: info.platform,
        model: info.model,
        osVersion: info.osVersion,
        manufacturer: info.manufacturer,
      };
    } catch (error) {
      console.error('Error getting device info:', error);
      return {
        platform: 'unknown',
        model: 'unknown',
        osVersion: 'unknown',
        manufacturer: 'unknown',
      };
    }
  }

  private generateDeviceId(): string {
    return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}
