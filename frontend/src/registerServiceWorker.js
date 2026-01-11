// Register Service Worker for PWA functionality
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('✅ Service Worker registered:', registration.scope);

          // Check for updates periodically (every 5 minutes)
          setInterval(() => {
            registration.update();
          }, 5 * 60 * 1000); // 5 minutes instead of 1 minute

          // Handle updates - NO AUTO PROMPT
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                console.log('🔄 New version available');
                
                // Store that update is available (don't prompt immediately)
                sessionStorage.setItem('sw-update-available', 'true');
                
                // Optional: Show a subtle notification instead of blocking popup
                const updateBanner = document.createElement('div');
                updateBanner.id = 'sw-update-banner';
                updateBanner.innerHTML = `
                  <div style="
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: #007bff;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    z-index: 10000;
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                  ">
                    <span>🔄 New version available</span>
                    <button onclick="window.location.reload()" style="
                      background: white;
                      color: #007bff;
                      border: none;
                      padding: 6px 12px;
                      border-radius: 4px;
                      cursor: pointer;
                      font-weight: 600;
                    ">Update</button>
                    <button onclick="this.parentElement.remove()" style="
                      background: transparent;
                      color: white;
                      border: 1px solid white;
                      padding: 6px 12px;
                      border-radius: 4px;
                      cursor: pointer;
                    ">Later</button>
                  </div>
                `;
                
                // Remove existing banner if any
                const existingBanner = document.getElementById('sw-update-banner');
                if (existingBanner) {
                  existingBanner.remove();
                }
                
                document.body.appendChild(updateBanner);
              }
            });
          });
        })
        .catch(error => {
          console.error('❌ Service Worker registration failed:', error);
        });

      // NO controller change listener to prevent auto-reload loop
    });
  } else {
    console.warn('⚠️ Service Workers not supported in this browser');
  }
}

// Unregister service worker (for development/testing)
export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
        console.log('✅ Service Worker unregistered');
      })
      .catch(error => {
        console.error('❌ Service Worker unregistration failed:', error);
      });
  }
}

// Request notification permission
export async function requestNotificationPermission() {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      return true;
    } else {
      console.warn('⚠️ Notification permission denied');
      return false;
    }
  }
  return false;
}

// Show notification (for low stock alerts, etc.)
export async function showNotification(title, options = {}) {
  if ('serviceWorker' in navigator && Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      ...options
    });
  }
}

// Register background sync
export async function registerBackgroundSync(tag) {
  if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('✅ Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('❌ Background sync registration failed:', error);
      return false;
    }
  }
  return false;
}