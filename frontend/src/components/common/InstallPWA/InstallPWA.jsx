import { useState, useEffect } from 'react';
import './InstallPWA.css';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      console.log('✅ App already installed');
      return;
    }

    // Check if iOS (doesn't support beforeinstallprompt)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      console.log('📱 iOS detected - manual install instructions needed');
      // Don't show install prompt on iOS (they need to use Safari's "Add to Home Screen")
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('📱 beforeinstallprompt event fired');
      
      // Prevent the default browser install prompt
      e.preventDefault();
      
      // Save the event for later use
      setDeferredPrompt(e);
      
      // Don't show immediately - wait a bit
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000); // Show after 3 seconds
      
      console.log('📱 PWA install prompt ready');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('✅ PWA installed successfully');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.warn('⚠️ No install prompt available');
      return;
    }

    console.log('📱 Showing install prompt...');

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
      setShowInstallPrompt(false);
    } else {
      console.log('❌ User dismissed the install prompt');
      // Don't dismiss immediately - let them try again
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    console.log('👋 Install prompt dismissed by user');
    setShowInstallPrompt(false);
    
    // Don't show again for 24 hours
    const dismissedUntil = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    localStorage.setItem('pwa-install-dismissed-until', dismissedUntil);
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Don't show if not ready
  if (!showInstallPrompt) {
    return null;
  }

  // Don't show if dismissed recently
  const dismissedUntil = localStorage.getItem('pwa-install-dismissed-until');
  if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) {
    return null;
  }

  return (
    <div className="install-pwa-banner">
      <div className="install-pwa-content">
        <div className="install-pwa-icon">📱</div>
        <div className="install-pwa-text">
          <h3>Install Fadila Sales App</h3>
          <p>Install our app for faster access and offline functionality</p>
        </div>
        <div className="install-pwa-actions">
          <button className="install-btn" onClick={handleInstallClick}>
            Install
          </button>
          <button className="dismiss-btn" onClick={handleDismiss}>
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;