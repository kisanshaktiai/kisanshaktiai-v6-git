import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Eye, 
  Type, 
  Zap, 
  Volume2, 
  Hand, 
  Smartphone, 
  Palette,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AccessibilityService, AccessibilitySettings } from '@/services/AccessibilityService';
import { useToast } from '@/hooks/use-toast';

interface AccessibilityPanelProps {
  className?: string;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({ className }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [accessibilityService] = useState(() => AccessibilityService.getInstance());
  const [settings, setSettings] = useState<AccessibilitySettings>(accessibilityService.getSettings());

  useEffect(() => {
    setSettings(accessibilityService.getSettings());
  }, [accessibilityService]);

  const updateSetting = (key: keyof AccessibilitySettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    accessibilityService.updateSettings({ [key]: value });
    
    // Provide feedback
    accessibilityService.provideFeedback(`${key} ${value ? 'enabled' : 'disabled'}`);
  };

  const resetToDefaults = () => {
    const defaultSettings: AccessibilitySettings = {
      highContrast: false,
      largeText: false,
      reduceMotion: false,
      screenReader: false,
      gestureControls: true,
      vibrationFeedback: true,
      simpleMode: false,
      voiceNavigation: false,
      fontSize: 16,
      colorScheme: 'default'
    };
    
    setSettings(defaultSettings);
    accessibilityService.updateSettings(defaultSettings);
    
    toast({
      title: t('Settings Reset'),
      description: t('Accessibility settings restored to defaults'),
    });
  };

  const testScreenReader = () => {
    accessibilityService.readCurrentPage();
  };

  const showGestureHelp = () => {
    const commands = accessibilityService.getGestureCommands();
    const helpText = commands.map(cmd => `${cmd.gesture}: ${cmd.description}`).join('. ');
    accessibilityService.provideFeedback(`Gesture commands: ${helpText}`);
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {t('Accessibility Settings')}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Visual Settings */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Palette className="h-4 w-4" />
              {t('Visual Settings')}
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">{t('High Contrast Mode')}</label>
                  <p className="text-xs text-muted-foreground">{t('Better visibility in bright light')}</p>
                </div>
                <Switch
                  checked={settings.highContrast}
                  onCheckedChange={(value) => updateSetting('highContrast', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">{t('Large Text')}</label>
                  <p className="text-xs text-muted-foreground">{t('Easier to read text')}</p>
                </div>
                <Switch
                  checked={settings.largeText}
                  onCheckedChange={(value) => updateSetting('largeText', value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('Font Size')}: {settings.fontSize}px
                </label>
                <Slider
                  value={[settings.fontSize]}
                  onValueChange={([value]) => updateSetting('fontSize', value)}
                  min={12}
                  max={24}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('Color Scheme')}</label>
                <Select
                  value={settings.colorScheme}
                  onValueChange={(value) => updateSetting('colorScheme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        {t('Default')}
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        {t('Dark')}
                      </div>
                    </SelectItem>
                    <SelectItem value="high-contrast">{t('High Contrast')}</SelectItem>
                    <SelectItem value="sepia">{t('Sepia')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">{t('Reduce Motion')}</label>
                  <p className="text-xs text-muted-foreground">{t('Minimize animations')}</p>
                </div>
                <Switch
                  checked={settings.reduceMotion}
                  onCheckedChange={(value) => updateSetting('reduceMotion', value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Audio Settings */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              {t('Audio Settings')}
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">{t('Screen Reader')}</label>
                  <p className="text-xs text-muted-foreground">{t('Read page content aloud')}</p>
                </div>
                <Switch
                  checked={settings.screenReader}
                  onCheckedChange={(value) => updateSetting('screenReader', value)}
                />
              </div>

              {settings.screenReader && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testScreenReader}
                  className="w-full"
                >
                  {t('Test Screen Reader')}
                </Button>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">{t('Voice Navigation')}</label>
                  <p className="text-xs text-muted-foreground">{t('Control with voice commands')}</p>
                </div>
                <Switch
                  checked={settings.voiceNavigation}
                  onCheckedChange={(value) => updateSetting('voiceNavigation', value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Input Settings */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Hand className="h-4 w-4" />
              {t('Input Settings')}
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">{t('Gesture Controls')}</label>
                  <p className="text-xs text-muted-foreground">{t('Navigate with touch gestures')}</p>
                </div>
                <Switch
                  checked={settings.gestureControls}
                  onCheckedChange={(value) => updateSetting('gestureControls', value)}
                />
              </div>

              {settings.gestureControls && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={showGestureHelp}
                  className="w-full"
                >
                  {t('Show Gesture Commands')}
                </Button>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">{t('Vibration Feedback')}</label>
                  <p className="text-xs text-muted-foreground">{t('Haptic feedback for actions')}</p>
                </div>
                <Switch
                  checked={settings.vibrationFeedback}
                  onCheckedChange={(value) => updateSetting('vibrationFeedback', value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Interface Settings */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              {t('Interface Settings')}
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">{t('Simple Mode')}</label>
                  <p className="text-xs text-muted-foreground">{t('Simplified interface for basic users')}</p>
                </div>
                <Switch
                  checked={settings.simpleMode}
                  onCheckedChange={(value) => updateSetting('simpleMode', value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {t('Quick Actions')}
            </h4>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => accessibilityService.announceHelp()}
              >
                {t('Help')}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefaults}
              >
                {t('Reset')}
              </Button>
            </div>
          </div>

          {/* Keyboard Shortcuts Help */}
          <div className="p-3 bg-accent/50 rounded-lg">
            <p className="text-sm font-medium mb-2">{t('Keyboard Shortcuts:')}</p>
            <div className="text-xs space-y-1">
              <div>F1 - {t('Accessibility help')}</div>
              <div>F2 - {t('Read current page')}</div>
              <div>F3 - {t('Toggle voice navigation')}</div>
              <div>Esc - {t('Stop voice output')}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};