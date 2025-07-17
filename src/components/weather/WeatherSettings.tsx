import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface WeatherSettingsProps {
  farmerId: string;
  location: { latitude: number; longitude: number };
  onClose: () => void;
}

export const WeatherSettings: React.FC<WeatherSettingsProps> = ({ farmerId, location, onClose }) => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    temperature_min_alert: 5,
    temperature_max_alert: 40,
    wind_speed_alert_kmh: 25,
    enable_push_notifications: true,
    enable_sms_alerts: true
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('weather.alertSettings', 'Alert Settings')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="temp-min">{t('weather.minTempAlert', 'Min Temperature Alert')}</Label>
            <Input
              id="temp-min"
              type="number"
              value={settings.temperature_min_alert}
              onChange={(e) => setSettings({...settings, temperature_min_alert: Number(e.target.value)})}
            />
          </div>
          <div>
            <Label htmlFor="temp-max">{t('weather.maxTempAlert', 'Max Temperature Alert')}</Label>
            <Input
              id="temp-max"
              type="number"
              value={settings.temperature_max_alert}
              onChange={(e) => setSettings({...settings, temperature_max_alert: Number(e.target.value)})}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{t('weather.pushNotifications', 'Push Notifications')}</Label>
            <Switch
              checked={settings.enable_push_notifications}
              onCheckedChange={(checked) => setSettings({...settings, enable_push_notifications: checked})}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>{t('weather.smsAlerts', 'SMS Alerts')}</Label>
            <Switch
              checked={settings.enable_sms_alerts}
              onCheckedChange={(checked) => setSettings({...settings, enable_sms_alerts: checked})}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={onClose}>
            {t('common.save', 'Save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};