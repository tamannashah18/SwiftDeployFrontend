import React, { useEffect, useRef } from 'react';
import { useAuth } from '../Contexts/AuthContext';
import { useDeploymentNotifications } from '../hooks/useDeploymentNotifications';
import '../css/DeploymentToast.css';

const AUTO_DISMISS_MS = 8000;

function ToastItem({ notification, onDismiss }) {
  const timerRef = useRef(null);
  const status = notification.status?.toLowerCase();
  const isSuccess = status === 'completed';
  const isFailed  = status === 'failed';

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(notification.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timerRef.current);
  }, [notification.id, onDismiss]);

  const platformLabel =
    notification.platform
      ? notification.platform.charAt(0).toUpperCase() + notification.platform.slice(1)
      : 'Unknown';

  const timeLabel = notification.completedAt
    ? new Date(notification.completedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className={`sd-toast ${isSuccess ? 'sd-toast--success' : isFailed ? 'sd-toast--error' : 'sd-toast--info'}`} role="alert">
      {/* Progress bar */}
      <div className="sd-toast__progress" />

      <div className="sd-toast__header">
        <span className="sd-toast__icon">{isSuccess ? '✅' : isFailed ? '❌' : 'ℹ️'}</span>
        <span className="sd-toast__title">
          Scheduled Deployment — {platformLabel}
        </span>
        <span className="sd-toast__time">{timeLabel}</span>
        <button
          className="sd-toast__close"
          onClick={() => onDismiss(notification.id)}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>

      <p className="sd-toast__message">{notification.message}</p>

      {isSuccess && notification.deploymentUrl && (
        <a
          href={notification.deploymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sd-toast__link"
        >
          View live site →
        </a>
      )}
    </div>
  );
}

/**
 * Global provider — drop this once anywhere in the component tree (e.g. App.jsx).
 * It connects to SignalR and renders toasts in a fixed overlay.
 */
export default function DeploymentToastProvider() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const { notifications, dismissNotification } = useDeploymentNotifications(userId);

  if (!userId || notifications.length === 0) return null;

  return (
    <div className="sd-toast-container" aria-live="polite">
      {notifications.map((n) => (
        <ToastItem key={n.id} notification={n} onDismiss={dismissNotification} />
      ))}
    </div>
  );
}
