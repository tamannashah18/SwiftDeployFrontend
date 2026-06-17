import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

const HUB_URL = 'http://localhost:5280/deploymentHub';

/**
 * Custom React hook to listen for real-time deployment status updates via SignalR.
 * 
 * @param {string} projectId - The active client-side project GUID
 * @param {string} mongoDeploymentId - The active MongoDB 24-character deployment ID
 * @param {string} userId - The authenticated user's ID to listen for
 * @param {function} onUpdate - Callback function triggered upon receiving a matching status update
 */
export function useRealTimeDeployment(projectId, mongoDeploymentId, userId, onUpdate) {
  const onUpdateRef = useRef(onUpdate);

  // Keep callback reference updated to prevent infinite rendering loops
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!userId) return;

    console.log('[SignalR] Initializing connection for user:', userId);

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { withCredentials: true })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    const start = async () => {
      try {
        await connection.start();
        await connection.invoke('Subscribe', userId);
        console.log('[SignalR] Connected and subscribed to group:', userId);
      } catch (err) {
        console.warn('[SignalR] Connection or subscription failed:', err);
      }
    };

    connection.on('DeploymentStatusUpdated', (payload) => {
      if (!payload) return;
      
      console.log('[SignalR] Received DeploymentStatusUpdated payload:', payload);

      const matchesProject = projectId && (payload.projectId === projectId);
      const matchesMongo = mongoDeploymentId && (
        payload.mongoDeploymentId === mongoDeploymentId || 
        payload.deploymentId === mongoDeploymentId
      );

      if (matchesProject || matchesMongo) {
        console.log('[SignalR] Matches active deployment. Invoking onUpdate callback...');
        if (onUpdateRef.current) {
          onUpdateRef.current(payload);
        }
      }
    });

    connection.onreconnecting(() => {
      console.log('[SignalR] Connection lost. Reconnecting...');
    });

    connection.onreconnected(() => {
      console.log('[SignalR] Reconnected. Re-subscribing...');
      connection.invoke('Subscribe', userId).catch((err) => {
        console.warn('[SignalR] Resubscribe invocation failed:', err);
      });
    });

    start();

    return () => {
      console.log('[SignalR] Cleaning up connection...');
      connection.invoke('Unsubscribe', userId)
        .catch(() => {})
        .finally(() => {
          connection.stop();
        });
    };
  }, [projectId, mongoDeploymentId, userId]);
}
