import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Volume2, VolumeX } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import socketService from '../api/socket';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const { user, token } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('tastifyy-notification-sound') !== 'off');
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof window !== 'undefined' && 'Notification' in window
      ? window.Notification.permission
      : 'unsupported'
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const seenNotificationIdsRef = useRef(new Set<string>());

  const unlockNotificationSound = useCallback(() => {
    try {
      const context = audioContextRef.current || new window.AudioContext();
      audioContextRef.current = context;
      if (context.state === 'suspended') {
        void context.resume().catch((error) => console.warn('Notification audio could not be enabled', error));
      }
    } catch (error) {
      console.warn('Notification audio is unavailable', error);
    }
  }, []);

  const playNotificationSound = useCallback((type: string) => {
    if (!soundEnabled) return;
    try {
      const context = audioContextRef.current;
      if (!context) return;
      audioContextRef.current = context;
      if (context.state === 'suspended') return;
      const notes = type === 'order_created' ? [740, 988] : [880, 660];
      notes.forEach((frequency, index) => {
        const startAt = context.currentTime + index * 0.16;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.06, startAt);
        gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.14);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.14);
      });
    } catch (error) {
      console.warn('Notification sound could not be played', error);
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (!user || !token) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications');
        if (response.data.success) {
          const fetched: Notification[] = Array.isArray(response.data.data) ? response.data.data : [];
          fetched.forEach((notification) => seenNotificationIdsRef.current.add(notification.id));
          setNotifications((current) => {
            const merged = new Map([...fetched, ...current].map((notification) => [notification.id, notification]));
            return [...merged.values()]
              .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
              .slice(0, 50);
          });
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    fetchNotifications();

    const unlockOnInteraction = () => unlockNotificationSound();
    document.addEventListener('pointerdown', unlockOnInteraction, { once: true });

    const socket = socketService.getSocket();
    if (!socket) {
      document.removeEventListener('pointerdown', unlockOnInteraction);
      return;
    }

    const handleNotification = (notification: Notification) => {
      if (!notification?.id || seenNotificationIdsRef.current.has(notification.id)) return;
      seenNotificationIdsRef.current.add(notification.id);
      setNotifications((current) => [notification, ...current].slice(0, 50));
      playNotificationSound(notification.type);

      if (document.visibilityState === 'hidden' && browserPermission === 'granted') {
        const isNewOrder = user.role === 'admin' && notification.type === 'order_created';
        const title = isNewOrder ? 'New Tastifyy order' : 'Tastifyy order update';
        const body = isNewOrder
          ? 'A new order is ready to review.'
          : user.role === 'customer'
            ? 'Your order status has changed. Open Tastifyy for details.'
            : 'There is a new order update. Open Tastifyy to review it.';
        try {
          new window.Notification(title, { body, tag: notification.id });
        } catch (error) {
          console.error('Browser notification could not be displayed', error);
        }
      }
    };

    socket.on('notification:new', handleNotification);

    return () => {
      socket.off('notification:new', handleNotification);
      document.removeEventListener('pointerdown', unlockOnInteraction);
    };
  }, [user, token, browserPermission, soundEnabled, unlockNotificationSound, playNotificationSound]);

  const requestBrowserNotifications = async () => {
    if (!('Notification' in window)) {
      setBrowserPermission('unsupported');
      return;
    }

    try {
      const permission = await window.Notification.requestPermission();
      setBrowserPermission(permission);
    } catch (error) {
      console.error('Could not request browser notification permission', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const toggleSound = () => {
    setSoundEnabled((enabled) => {
      const next = !enabled;
      localStorage.setItem('tastifyy-notification-sound', next ? 'on' : 'off');
      return next;
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onPointerDown={unlockNotificationSound}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:bg-gray-50 rounded-full transition-colors focus:outline-none"
      >
        <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 sm:w-4.5 sm:h-4.5 bg-brand-primary text-white text-[9px] sm:text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 transition-all transform origin-top-right z-50 overflow-hidden ${
          isOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'
        }`}
      >
        <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black text-gray-900">Notifications</h3>
            <button onClick={toggleSound} aria-label={soundEnabled ? 'Turn notification sound off' : 'Turn notification sound on'} className="text-gray-500 hover:text-brand-primary">
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-xs font-bold text-brand-primary hover:text-brand-secondary transition-colors">Mark all as read</button>
          )}
        </div>
        {browserPermission === 'default' && (
          <button
            onClick={requestBrowserNotifications}
            className="w-full px-4 py-2 text-left text-xs font-bold text-brand-primary border-b border-gray-100 hover:bg-orange-50"
          >
            Enable browser notifications
          </button>
        )}
        {browserPermission === 'denied' && (
          <p className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
            Browser alerts are blocked. Allow them in your browser settings.
          </p>
        )}
        <div className="max-h-[320px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">No notifications yet</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.is_read) markAsRead(n.id);
                  }}
                  className={`px-4 py-3 border-b border-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-3 ${
                    !n.is_read ? 'bg-orange-50/30' : ''
                  }`}
                >
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-brand-primary shrink-0 mt-1.5" />
                  )}
                  <div className={`flex flex-col ${n.is_read ? 'ml-5' : ''}`}>
                    <p className={`text-sm ${!n.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-gray-400 mt-1.5 font-medium uppercase tracking-wider">
                      {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
