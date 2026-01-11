import { useState, useEffect } from 'react';

// Custom hook to detect online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      
      // If was offline, trigger sync
      if (wasOffline) {
        console.log('🌐 Back online! Triggering sync...');
        
        // Trigger background sync
        if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
          navigator.serviceWorker.ready.then(registration => {
            registration.sync.register('sync-sales');
          });
        }
        
        setWasOffline(false);
      }
    }

    function handleOffline() {
      setIsOnline(false);
      setWasOffline(true);
      console.log('📡 Gone offline');
    }

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
}