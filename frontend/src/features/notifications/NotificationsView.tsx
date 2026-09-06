import React, { useState, useEffect } from 'react';
import { useApp } from '../../application/context/AppContext';
import { NotificationItem } from '../../foundation/types';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../data-access/posApi';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Info,
  Clock,
  Package,
  Coins,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const { lang } = useApp();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'HIGH' | 'STOCK'>('ALL');

  const fetchList = async () => {
    setIsLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'UNREAD') return !n.read_at;
    if (activeFilter === 'HIGH') return n.priority === 'HIGH';
    if (activeFilter === 'STOCK') return n.type.includes('STOCK');
    return true;
  });

  const getIcon = (type: string, priority: string) => {
    if (priority === 'HIGH') return <AlertTriangle className="w-5 h-5 text-rose-600" />;
    if (type.includes('STOCK')) return <Package className="w-5 h-5 text-amber-600" />;
    if (type.includes('SHIFT')) return <Coins className="w-5 h-5 text-emerald-600" />;
    if (type.includes('SECURITY')) return <ShieldCheck className="w-5 h-5 text-blue-600" />;
    return <Info className="w-5 h-5 text-indigo-600" />;
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {lang === 'kh' ? 'មជ្ឈមណ្ឌលដំណឹង & ការជូនដំណឹង' : 'Notification Center'}
              </h1>
              <p className="text-xs text-gray-500">
                {lang === 'kh'
                  ? 'ការព្រមានកម្រិតស្តុក វេនលក់ និងព្រឹត្តិការណ៍សុវត្ថិភាពប្រព័ន្ធ'
                  : 'System alerts, low stock warnings, cash shifts, and audit activity'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchList}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-sm transition"
            >
              <CheckCheck className="w-4 h-4" />
              <span>{lang === 'kh' ? 'សម្គាល់ថាបានអានទាំងអស់' : 'Mark All as Read'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl w-full mx-auto">
        {/* Filter Pills */}
        <div className="flex items-center space-x-2">
          {[
            { id: 'ALL', label: 'All Alerts', count: notifications.length },
            { id: 'UNREAD', label: 'Unread', count: unreadCount },
            { id: 'HIGH', label: 'High Priority', count: notifications.filter(n => n.priority === 'HIGH').length },
            { id: 'STOCK', label: 'Stock Alerts', count: notifications.filter(n => n.type.includes('STOCK')).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition ${
                activeFilter === tab.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                activeFilter === tab.id ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-200">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
              Loading notifications...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-200">
              <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              No notifications matching your filter.
            </div>
          ) : (
            filtered.map((item) => {
              const isUnread = !item.read_at;
              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition flex items-start justify-between gap-4 ${
                    isUnread
                      ? 'bg-white border-emerald-300 shadow-xs ring-1 ring-emerald-200'
                      : 'bg-white border-gray-200 opacity-80'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                      {getIcon(item.type, item.priority)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            item.priority === 'HIGH'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : item.priority === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {item.priority}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.message}</p>
                      <div className="flex items-center space-x-4 mt-2 text-[11px] text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(item.created_at).toLocaleString()}</span>
                        </span>
                        <span className="font-mono uppercase text-gray-500">Channel: {item.channel}</span>
                      </div>
                    </div>
                  </div>

                  {isUnread && (
                    <button
                      onClick={() => handleMarkRead(item.id)}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl whitespace-nowrap transition"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
