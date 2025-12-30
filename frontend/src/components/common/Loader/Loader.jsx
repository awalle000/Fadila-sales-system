import './Loader.css';

const Loader = ({ size = 'medium', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="loader-fullscreen">
        <div className={`loader loader-${size}`}>
          <div className="spinner"></div>
        </div>
        <p className="loader-text">Loading...</p>
      </div>
    );
  }

  return (
    <div className="loader-container">
      <div className={`loader loader-${size}`}>
        <div className="spinner"></div>
      </div>
    </div>
  );
};

export default Loader;