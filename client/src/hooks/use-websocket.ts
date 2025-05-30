import { useEffect, useRef, useState } from 'react';

export interface UseWebSocketOptions {
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export const useWebSocket = (url: string, options: UseWebSocketOptions = {}) => {
  const [connectionStatus, setConnectionStatus] = useState<'Connecting' | 'Open' | 'Closed' | 'Error'>('Connecting');
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const { reconnectAttempts = 3, reconnectInterval = 3000 } = options;

  const connect = () => {
    try {
      wsRef.current = new WebSocket(url);
      
      wsRef.current.onopen = () => {
        setConnectionStatus('Open');
        reconnectAttemptsRef.current = 0;
      };
      
      wsRef.current.onmessage = (event) => {
        setLastMessage(event);
      };
      
      wsRef.current.onclose = () => {
        setConnectionStatus('Closed');
        
        // Attempt to reconnect
        if (reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++;
          setTimeout(connect, reconnectInterval);
        }
      };
      
      wsRef.current.onerror = () => {
        setConnectionStatus('Error');
      };
    } catch (error) {
      setConnectionStatus('Error');
    }
  };

  useEffect(() => {
    connect();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url]);

  const sendMessage = (message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    }
  };

  return {
    connectionStatus,
    lastMessage,
    sendMessage,
  };
};
