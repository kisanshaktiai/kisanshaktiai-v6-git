
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';

export const initializeCapacitor = async () => {
  if (Capacitor.isNativePlatform()) {
    // Configure status bar
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#10B981' });

    // Configure keyboard behavior
    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-open');
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open');
    });

    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active?', isActive);
    });
  }
};

export const isNativePlatform = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();
