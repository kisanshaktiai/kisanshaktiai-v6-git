
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private isOnline = true;

  private constructor() {
    this.setupNetworkListeners();
  }

  static getInstance(): ServiceWorkerManager {
    if (!this.instance) {
      this.instance = new ServiceWorkerManager();
    }
    return this.instance;
  }

  async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', this.registration);

      // Listen for service worker updates
      this.registration.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker update found');
      });

      // Handle messages from service worker
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage);

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    const permission = await Notification.requestPermission();
    console.log('📢 Notification permission:', permission);
    return permission;
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.registration || Notification.permission !== 'granted') {
      return;
    }

    try {
      await this.registration.showNotification(title, {
        badge: '/favicon.ico',
        icon: '/favicon.ico',
        ...options,
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  getNetworkStatus(): boolean {
    return this.isOnline;
  }

  onNetworkChange(callback: (isOnline: boolean) => void): () => void {
    const handler = () => callback(this.isOnline);
    
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);

    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }

  private setupNetworkListeners(): void {
    const updateOnlineStatus = () => {
      this.isOnline = navigator.onLine;
      console.log(`🌐 Network status: ${this.isOnline ? 'Online' : 'Offline'}`);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial check
    updateOnlineStatus();
  }

  private handleServiceWorkerMessage = (event: MessageEvent): void => {
    console.log('📨 Message from Service Worker:', event.data);
    
    switch (event.data.type) {
      case 'CACHE_UPDATED':
        console.log('✅ Cache updated');
        break;
      case 'BACKGROUND_SYNC':
        console.log('🔄 Background sync completed');
        break;
      default:
        console.log('Unknown message type:', event.data.type);
    }
  };

  cleanup(): void {
    if (this.registration) {
      navigator.serviceWorker.removeEventListener('message', this.handleServiceWorkerMessage);
    }
  }
}
