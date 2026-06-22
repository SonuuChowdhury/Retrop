import './LoadingSpinner.css';

export default function LoadingSpinner({ message = 'Loading…', fullScreen = false }) {
  return (
    <div className={`spinner-wrap ${fullScreen ? 'spinner-wrap--fullscreen' : ''}`}>
      <div className="spinner-ring" aria-hidden="true">
        <div /><div /><div /><div />
      </div>
      {message && <p className="spinner-msg">{message}</p>}
    </div>
  );
}
