import './StatusBar.css';

const STEPS = [
  { id: 'info',    label: 'Info' },
  { id: 'wait',    label: 'Wait' },
  { id: 'menu',    label: 'Menu' },
  { id: 'order',   label: 'Order' },
];

/**
 * Responsive order progress nav bar.
 * @param {'info'|'wait'|'menu'|'order'} currentStep
 * @param {string} restaurantName — shown as top header
 */
export default function StatusBar({ currentStep, restaurantName }) {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <header className="status-bar">
      {restaurantName && (
        <p className="status-bar__brand">{restaurantName}</p>
      )}
      <nav className="status-bar__steps" aria-label="Order progress">
        {STEPS.map((step, idx) => {
          const isDone   = idx < currentIdx;
          const isActive = idx === currentIdx;
          return (
            // Fragment holds: step + (if not last) connector
            <div key={step.id} style={{ display: 'contents' }}>
              <div
                className={[
                  'status-bar__step',
                  isActive ? 'status-bar__step--active' : '',
                  isDone   ? 'status-bar__step--done'   : '',
                ].join(' ')}
                aria-current={isActive ? 'step' : undefined}
              >
                <div className="status-bar__dot">
                  {isDone ? '✓' : idx + 1}
                </div>
                <span className="status-bar__label">{step.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={[
                    'status-bar__connector',
                    isDone ? 'status-bar__connector--done' : '',
                  ].join(' ')}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </nav>
    </header>
  );
}
