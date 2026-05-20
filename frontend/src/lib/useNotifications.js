import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { API_BASE, api, getCurrentUser } from './api';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 1. Fetch initial unread on mount
  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setNotifications(list);
      setUnreadCount(list.length);
    } catch {
      // Slient fail if no connection
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUnread();
  }, [fetchUnread]);

  // 2. Setup Server-Sent Events (SSE) stream
  useEffect(() => {
    let sse;
    
    // Attempt connection
    getCurrentUser().then(user => {
      if (!user) return;
      
      // SSE connection using EventSource. Native browser API.
      // withCredentials sends auth cookies automatically.
      sse = new EventSource(`${API_BASE}/notifications/stream`, {
        withCredentials: true 
      });

      sse.onmessage = (event) => {
        try {
          const newNotif = JSON.parse(event.data);
          
          setNotifications(prev => {
            // Prevent duplicates
            if (prev.find(n => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
          setUnreadCount(c => c + 1);

          // Pop Toast Alert
          const toastStyles = {
            clinical: { icon: '🚨', style: { border: '1px solid #fecdd3', color: '#881337' } },
            billing: { icon: '💳', style: { border: '1px solid #fef3c7', color: '#78350f' } },
            adt: { icon: '🛏️', style: { border: '1px solid #dbeafe', color: '#1e3a8a' } },
            system: { icon: 'ℹ️', style: { border: '1px solid #f1f5f9', color: '#334155' } },
          };
          const config = toastStyles[newNotif.type] || toastStyles.system;

          toast(newNotif.title, {
            icon: config.icon,
            style: config.style,
            duration: 6000,
          });

        } catch (parseErr) {
          console.error("SSE Parsing error", parseErr);
        }
      };

      sse.onerror = () => {
        // SSE auto-reconnects, but if we need manual fallback, handle here
      };
    }).catch(() => {});

    return () => {
      if (sse) sse.close();
    };
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {
      toast.error('Could not mark as read');
    }
  };

  const markAllRead = async () => {
    // In a real system, we'd have a bulk endpoint. For UI purposes, we'll clear local state.
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllRead
  };
}
