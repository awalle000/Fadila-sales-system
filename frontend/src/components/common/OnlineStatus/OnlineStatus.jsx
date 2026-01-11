import { useOnlineStatus } from '../../../hooks/useOnlineStatus';
import './OnlineStatus.css';

const OnlineStatus = () => {
  const { isOnline, wasOffline } = useOnlineStatus();

  // Don't show anything if online and never went offline
  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div className={`online-status ${isOnline ? 'online' : 'offline'}`}>
      <div className="online-status-content">
        {isOnline ? (
          <>
            <span className="status-icon">🟢</span>
            <span>Back online - Syncing data...</span>
          </>
        ) : (
          <>
            <span className="status-icon">🔴</span>
            <span>You're offline - Data will sync when connected</span>
          </>
        )}
      </div>
    </div>
  );
};

export default OnlineStatus;