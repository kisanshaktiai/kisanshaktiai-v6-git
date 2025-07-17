import { VoiceService } from './VoiceService';
import { LanguageService } from './LanguageService';

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  gestureControls: boolean;
  vibrationFeedback: boolean;
  simpleMode: boolean;
  voiceNavigation: boolean;
  fontSize: number;
  colorScheme: 'default' | 'high-contrast' | 'dark' | 'sepia';
}

export interface GestureCommand {
  gesture: string;
  action: string;
  description: string;
}

export class AccessibilityService {
  private static instance: AccessibilityService;
  private settings: AccessibilitySettings;
  private voiceService: VoiceService;
  private languageService: LanguageService;
  private gestureCommands: GestureCommand[] = [];
  private isScreenReaderActive = false;

  static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }

  constructor() {
    this.voiceService = VoiceService.getInstance();
    this.languageService = LanguageService.getInstance();
    this.settings = this.getDefaultSettings();
    this.loadSettings();
    this.initializeGestureCommands();
    this.setupKeyboardNavigation();
  }

  private getDefaultSettings(): AccessibilitySettings {
    return {
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
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('accessibility_settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
        this.applySettings();
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('accessibility_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
    }
  }

  private applySettings(): void {
    const root = document.documentElement;

    // High contrast mode
    if (this.settings.highContrast) {
      root.setAttribute('data-theme', 'high-contrast');
    } else {
      root.removeAttribute('data-theme');
    }

    // Font size
    root.style.setProperty('--accessibility-font-scale', `${this.settings.fontSize / 16}`);

    // Large text
    if (this.settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Reduce motion
    if (this.settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Simple mode
    if (this.settings.simpleMode) {
      root.classList.add('simple-mode');
    } else {
      root.classList.remove('simple-mode');
    }

    // Color scheme
    root.setAttribute('data-color-scheme', this.settings.colorScheme);

    // Screen reader
    if (this.settings.screenReader && !this.isScreenReaderActive) {
      this.enableScreenReader();
    } else if (!this.settings.screenReader && this.isScreenReaderActive) {
      this.disableScreenReader();
    }
  }

  private initializeGestureCommands(): void {
    this.gestureCommands = [
      { gesture: 'swipe-left', action: 'navigate-back', description: 'Go back' },
      { gesture: 'swipe-right', action: 'navigate-forward', description: 'Go forward' },
      { gesture: 'swipe-up', action: 'scroll-up', description: 'Scroll up' },
      { gesture: 'swipe-down', action: 'scroll-down', description: 'Scroll down' },
      { gesture: 'double-tap', action: 'activate', description: 'Activate element' },
      { gesture: 'long-press', action: 'context-menu', description: 'Open context menu' },
      { gesture: 'pinch', action: 'zoom', description: 'Zoom in/out' },
      { gesture: 'shake', action: 'help', description: 'Get help' }
    ];

    if (this.settings.gestureControls) {
      this.enableGestureControls();
    }
  }

  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', (event) => {
      if (!this.settings.voiceNavigation) return;

      switch (event.key) {
        case 'F1':
          event.preventDefault();
          this.announceHelp();
          break;
        case 'F2':
          event.preventDefault();
          this.readCurrentPage();
          break;
        case 'F3':
          event.preventDefault();
          this.toggleVoiceNavigation();
          break;
        case 'Escape':
          this.voiceService.stop();
          break;
      }
    });
  }

  private enableScreenReader(): void {
    this.isScreenReaderActive = true;
    
    // Announce page load
    this.announcePageLoad();
    
    // Add focus management
    this.setupFocusManagement();
    
    // Add aria-live regions
    this.setupLiveRegions();
  }

  private disableScreenReader(): void {
    this.isScreenReaderActive = false;
    this.voiceService.stop();
  }

  private announcePageLoad(): void {
    const pageTitle = document.title || 'Page loaded';
    this.voiceService.speak(`${pageTitle}. Page loaded successfully.`);
  }

  private setupFocusManagement(): void {
    let lastFocusedElement: Element | null = null;

    document.addEventListener('focusin', (event) => {
      if (!this.isScreenReaderActive) return;

      const target = event.target as Element;
      if (target === lastFocusedElement) return;

      lastFocusedElement = target;
      this.announceElement(target);
    });
  }

  private announceElement(element: Element): void {
    let announcement = '';
    const tagName = element.tagName.toLowerCase();
    const ariaLabel = element.getAttribute('aria-label');
    const text = element.textContent?.trim();
    const role = element.getAttribute('role');

    if (ariaLabel) {
      announcement = ariaLabel;
    } else if (text) {
      announcement = text;
    } else {
      announcement = this.getElementDescription(tagName, role);
    }

    if (element.hasAttribute('disabled')) {
      announcement += ', disabled';
    }

    if (announcement) {
      this.voiceService.speak(announcement);
    }
  }

  private getElementDescription(tagName: string, role?: string | null): string {
    const descriptions: Record<string, string> = {
      'button': 'Button',
      'input': 'Input field',
      'textarea': 'Text area',
      'select': 'Select box',
      'a': 'Link',
      'h1': 'Heading level 1',
      'h2': 'Heading level 2',
      'h3': 'Heading level 3',
      'img': 'Image',
      'nav': 'Navigation',
      'main': 'Main content',
      'aside': 'Sidebar',
      'footer': 'Footer',
      'header': 'Header'
    };

    if (role) {
      return role;
    }

    return descriptions[tagName] || tagName;
  }

  private setupLiveRegions(): void {
    // Create announcement region if it doesn't exist
    if (!document.getElementById('accessibility-announcements')) {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'accessibility-announcements';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }
  }

  private enableGestureControls(): void {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    document.addEventListener('touchstart', (event) => {
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      startTime = Date.now();
    });

    document.addEventListener('touchend', (event) => {
      if (!this.settings.gestureControls) return;

      const endX = event.changedTouches[0].clientX;
      const endY = event.changedTouches[0].clientY;
      const endTime = Date.now();

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;

      this.processGesture(deltaX, deltaY, deltaTime);
    });
  }

  private processGesture(deltaX: number, deltaY: number, deltaTime: number): void {
    const minSwipeDistance = 50;
    const maxSwipeTime = 500;

    if (deltaTime > maxSwipeTime) return;

    let gestureType = '';

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        gestureType = deltaX > 0 ? 'swipe-right' : 'swipe-left';
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        gestureType = deltaY > 0 ? 'swipe-down' : 'swipe-up';
      }
    }

    if (gestureType) {
      this.handleGesture(gestureType);
    }
  }

  private handleGesture(gestureType: string): void {
    const command = this.gestureCommands.find(cmd => cmd.gesture === gestureType);
    if (!command) return;

    this.provideFeedback(`${command.description}`);

    switch (command.action) {
      case 'navigate-back':
        window.history.back();
        break;
      case 'scroll-up':
        window.scrollBy(0, -100);
        break;
      case 'scroll-down':
        window.scrollBy(0, 100);
        break;
      case 'help':
        this.announceHelp();
        break;
    }
  }

  updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.applySettings();
    this.saveSettings();
  }

  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  provideFeedback(message: string): void {
    if (this.settings.vibrationFeedback && 'vibrate' in navigator) {
      navigator.vibrate(100);
    }

    if (this.settings.screenReader) {
      this.voiceService.speak(message);
    }

    // Visual feedback for hearing impaired
    this.showVisualFeedback(message);
  }

  private showVisualFeedback(message: string): void {
    const feedback = document.createElement('div');
    feedback.className = 'accessibility-feedback';
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--primary);
      color: var(--primary-foreground);
      padding: 8px 16px;
      border-radius: 4px;
      z-index: 10000;
      font-size: 14px;
      pointer-events: none;
    `;

    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.remove();
    }, 3000);
  }

  announceHelp(): void {
    const helpText = `KisanShakti accessibility help. 
      Press F1 for help, F2 to read current page, F3 to toggle voice navigation.
      Use gesture controls: swipe left to go back, swipe right to go forward,
      swipe up to scroll up, swipe down to scroll down.
      Shake device for help.`;
    
    this.voiceService.speak(helpText);
  }

  readCurrentPage(): void {
    const main = document.querySelector('main');
    const content = main?.textContent || document.body.textContent || '';
    
    if (content.trim()) {
      this.voiceService.speak(`Reading page content: ${content}`);
    } else {
      this.voiceService.speak('No readable content found on this page');
    }
  }

  toggleVoiceNavigation(): void {
    this.settings.voiceNavigation = !this.settings.voiceNavigation;
    this.saveSettings();
    
    const status = this.settings.voiceNavigation ? 'enabled' : 'disabled';
    this.voiceService.speak(`Voice navigation ${status}`);
  }

  getGestureCommands(): GestureCommand[] {
    return [...this.gestureCommands];
  }

  isHighContrastMode(): boolean {
    return this.settings.highContrast;
  }

  isSimpleMode(): boolean {
    return this.settings.simpleMode;
  }
}