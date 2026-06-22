import './ErrorScreen.css';

/**
 * @param {string} title
 * @param {string} message
 * @param {string|null} actionLabel — label for retry / action button
 * @param {function|null} onAction
 * @param {string} emoji
 */
export default function ErrorScreen({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  actionLabel = null,
  onAction = null,
  emoji = '⚠️',
  fullScreen = true,
}) {
  return (
    <div className={`error-screen ${fullScreen ? 'error-screen--fullscreen' : ''}`}>
      <div className="error-screen__card">
        <div className="error-screen__emoji">{emoji}</div>
        <h2 className="error-screen__title">{title}</h2>
        <p className="error-screen__msg">{message}</p>
        {actionLabel && onAction && (
          <button className="btn btn--primary" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
