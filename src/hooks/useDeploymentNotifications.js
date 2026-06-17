import { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

const HUB_URL = 'http://localhost:5280/deploymentHub';

/**
 * Connects to the SwiftDeploy SignalR hub and listens for
 * ScheduledDeploymentCompleted events for the given userId.
 *
 * Returns an array of notification objects (newest first).
 * Call clearNotifications() to dismiss all.
 */
export function useDeploymentNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const connectionRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { withCredentials: true })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    const start = async () => {
      try {
        await connection.start();
        await connection.invoke('Subscribe', userId);
        console.log('[SignalR] Connected and subscribed for user:', userId);
      } catch (err) {
        console.warn('[SignalR] Connection failed:', err);
      }
    };

    connection.on('ScheduledDeploymentCompleted', (payload) => {
      const notification = {
        id: `${payload.jobId}-${Date.now()}`,
        ...payload,
        receivedAt: new Date(),
      };
      setNotifications((prev) => [notification, ...prev]);
    });

    connection.on('DeploymentStatusUpdated', (payload) => {
      const notification = {
        id: `${payload.deploymentId}-${Date.now()}`,
        ...payload,
        receivedAt: new Date(),
      };
      setNotifications((prev) => [notification, ...prev]);
    });

    connection.onreconnecting(() =>
      console.log('[SignalR] Reconnecting...')
    );
    connection.onreconnected(() => {
      console.log('[SignalR] Reconnected, re-subscribing...');
      connection.invoke('Subscribe', userId).catch(console.warn);
    });

    start();

    return () => {
      connection
        .invoke('Unsubscribe', userId)
        .catch(() => {})
        .finally(() => connection.stop());
    };
  }, [userId]);

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearNotifications = () => setNotifications([]);

  return { notifications, dismissNotification, clearNotifications };
}
