import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FaCheckCircle, FaTimesCircle, FaBell, FaUtensils, FaTruck, FaCheck } from 'react-icons/fa';

import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../store/slices/notificationSlice';

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const { notifications, loading, error } = useSelector((state) => state.notifications);
  const [activeTab, setActiveTab] = useState('all');
  const [filteredNotifications, setFilteredNotifications] = useState([]);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredNotifications(notifications);
    } else if (activeTab === 'unread') {
      setFilteredNotifications(notifications.filter(notification => !notification.is_read));
    } else if (activeTab === 'read') {
      setFilteredNotifications(notifications.filter(notification => notification.is_read));
    }
  }, [activeTab, notifications]);

  const handleMarkAsRead = (notificationId) => {
    dispatch(markNotificationAsRead(notificationId));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order':
        return <FaBell className="text-blue-500" />;
      case 'order_accepted':
        return <FaCheckCircle className="text-green-500" />;
      case 'order_rejected':
        return <FaTimesCircle className="text-red-500" />;
      case 'order_ready':
        return <FaUtensils className="text-amber-500" />;
      case 'order_delivered':
        return <FaTruck className="text-green-600" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        <div className="text-center py-10">
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        <div className="text-center py-10">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        
        {notifications.some(notification => !notification.is_read) && (
          <button
            onClick={handleMarkAllAsRead}
            className="mt-2 md:mt-0 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center"
          >
            <FaCheck className="mr-2" /> Mark all as read
          </button>
        )}
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 font-medium text-sm border-b-2 ${activeTab === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`py-4 px-1 font-medium text-sm border-b-2 ${activeTab === 'unread' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Unread
          </button>
          <button
            onClick={() => setActiveTab('read')}
            className={`py-4 px-1 font-medium text-sm border-b-2 ${activeTab === 'read' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Read
          </button>
        </nav>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No notifications found</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <li key={notification.id} className={notification.is_read ? 'bg-white' : 'bg-blue-50'}>
                <Link 
                  to={notification.order ? `/orders/${notification.order}` : '#'}
                  className="block hover:bg-gray-50"
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 p-2">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          {notification.message}
                        </p>
                        {notification.order && (
                          <div className="mt-2">
                            <span className="px-2 py-1 text-xs font-semibold rounded-md bg-blue-100 text-blue-800">
                              Order #{notification.order}
                            </span>
                          </div>
                        )}
                        {!notification.is_read && (
                          <div className="mt-2">
                            <button 
                              className="text-xs text-blue-600 hover:text-blue-800"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                            >
                              Mark as read
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
