// Service Worker for KisanShakti AI
// Implements offline-first caching with intelligent prefetching

const CACHE_NAME = 'kisanshakti-v1';
const RUNTIME_CACHE = 'kisanshakti-runtime';
const ASSETS_CACHE = 'kisanshakti-assets';
const API_CACHE = 'kisanshakti-api';

// Assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  // Add more critical assets
];

// API endpoints to cache
const CACHEABLE_API_PATTERNS = [
  /\/rest\/v1\/weather_current/,
  /\/rest\/v1\/crops/,
  /\/rest\/v1\/tenant_branding/,
  /\/rest\/v1\/user_profiles/,
  /\/functions\/v1\/translate-text/,
];

// Network-first patterns (always try network first)
const NETWORK_FIRST_PATTERNS = [
  /\/functions\/v1\/ai-orchestrator/,
  /\/functions\/v1\/weather-sync/,
  /\/rest\/v1\/ai_conversations/,
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  console.log('SW: Installing service worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('SW: Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activating service worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== RUNTIME_CACHE && 
                cacheName !== ASSETS_CACHE && 
                cacheName !== API_CACHE) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('SW: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isAssetRequest(url)) {
    event.respondWith(handleAssetRequest(request));
  } else {
    event.respondWith(handleNavigationRequest(request));
  }
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('SW: Background sync triggered:', event.tag);
  
  if (event.tag === 'weather-sync') {
    event.waitUntil(syncWeatherData());
  } else if (event.tag === 'ai-responses-sync') {
    event.waitUntil(syncAIResponses());
  } else if (event.tag === 'user-data-sync') {
    event.waitUntil(syncUserData());
  }
});

// Push notifications for weather alerts
self.addEventListener('push', (event) => {
  console.log('SW: Push notification received');
  
  const options = {
    body: 'You have new weather alerts',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: '/?notification=weather-alert'
    },
    actions: [
      {
        action: 'view',
        title: 'View Details'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      options.body = payload.message || options.body;
      options.data = { ...options.data, ...payload.data };
    } catch (error) {
      console.warn('SW: Invalid push payload:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification('KisanShakti AI', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'view') {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

// Helper functions
function isAPIRequest(url) {
  return url.hostname.includes('supabase') || 
         url.pathname.startsWith('/rest/') || 
         url.pathname.startsWith('/functions/');
}

function isAssetRequest(url) {
  return url.pathname.includes('.') && 
         (url.pathname.endsWith('.js') || 
          url.pathname.endsWith('.css') || 
          url.pathname.endsWith('.png') || 
          url.pathname.endsWith('.jpg') || 
          url.pathname.endsWith('.jpeg') || 
          url.pathname.endsWith('.webp') || 
          url.pathname.endsWith('.svg'));
}

async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  // Check if this is a network-first endpoint
  const isNetworkFirst = NETWORK_FIRST_PATTERNS.some(pattern => 
    pattern.test(url.pathname)
  );
  
  if (isNetworkFirst) {
    return handleNetworkFirst(request);
  }
  
  // Check if this is cacheable
  const isCacheable = CACHEABLE_API_PATTERNS.some(pattern => 
    pattern.test(url.pathname)
  );
  
  if (isCacheable) {
    return handleCacheFirst(request, API_CACHE);
  }
  
  // Default to network-only for API requests
  return fetch(request);
}

async function handleAssetRequest(request) {
  return handleCacheFirst(request, ASSETS_CACHE);
}

async function handleNavigationRequest(request) {
  return handleNetworkFirst(request, RUNTIME_CACHE);
}

async function handleNetworkFirst(request, cacheName = RUNTIME_CACHE) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok && cacheName) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('SW: Network failed, trying cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache and it's a navigation request, return offline page
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    
    throw error;
  }
}

async function handleCacheFirst(request, cacheName) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Update cache in background
    updateCacheInBackground(request, cacheName);
    return cachedResponse;
  }
  
  // Fallback to network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('SW: Both cache and network failed:', error);
    throw error;
  }
}

function updateCacheInBackground(request, cacheName) {
  // Update cache in background without blocking the response
  fetch(request)
    .then(response => {
      if (response.ok) {
        return caches.open(cacheName)
          .then(cache => cache.put(request, response));
      }
    })
    .catch(error => {
      console.warn('SW: Background cache update failed:', error);
    });
}

async function syncWeatherData() {
  console.log('SW: Syncing weather data');
  
  try {
    // Get pending weather sync items from IndexedDB
    const pendingSync = await getPendingSyncItems('weather');
    
    for (const item of pendingSync) {
      await fetch('/functions/v1/weather-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item.data)
      });
      
      // Remove from pending sync
      await removeSyncItem('weather', item.id);
    }
    
    console.log('SW: Weather sync completed');
  } catch (error) {
    console.error('SW: Weather sync failed:', error);
    throw error;
  }
}

async function syncAIResponses() {
  console.log('SW: Syncing AI responses');
  
  try {
    const pendingSync = await getPendingSyncItems('ai-responses');
    
    for (const item of pendingSync) {
      await fetch('/functions/v1/ai-orchestrator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item.data)
      });
      
      await removeSyncItem('ai-responses', item.id);
    }
    
    console.log('SW: AI responses sync completed');
  } catch (error) {
    console.error('SW: AI responses sync failed:', error);
    throw error;
  }
}

async function syncUserData() {
  console.log('SW: Syncing user data');
  
  try {
    const pendingSync = await getPendingSyncItems('user-data');
    
    for (const item of pendingSync) {
      const { tableName, operation, data } = item.data;
      
      let response;
      if (operation === 'INSERT') {
        response = await fetch(`/rest/v1/${tableName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(data)
        });
      } else if (operation === 'UPDATE') {
        response = await fetch(`/rest/v1/${tableName}?id=eq.${data.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(data)
        });
      }
      
      if (response?.ok) {
        await removeSyncItem('user-data', item.id);
      }
    }
    
    console.log('SW: User data sync completed');
  } catch (error) {
    console.error('SW: User data sync failed:', error);
    throw error;
  }
}

// IndexedDB helpers for background sync
async function getPendingSyncItems(type) {
  // This would integrate with the existing Dexie database
  // For now, return empty array
  return [];
}

async function removeSyncItem(type, id) {
  // This would remove the item from IndexedDB
  console.log(`SW: Removing sync item ${id} from ${type}`);
}

// Cleanup old caches periodically
setInterval(() => {
  cleanupOldCaches();
}, 60 * 60 * 1000); // Every hour

async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
      name.startsWith('kisanshakti-') && name !== CACHE_NAME
    );
    
    await Promise.all(oldCaches.map(name => caches.delete(name)));
    console.log('SW: Old caches cleaned up');
  } catch (error) {
    console.error('SW: Cache cleanup failed:', error);
  }
}