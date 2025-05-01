import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { markNotificationAsRead, fetchUnreadNotifications } from '../../store/slices/notificationSlice';
import { formatDistanceToNow } from 'date-fns';
import { FaTimes, FaCheckCircle, FaTimesCircle, FaBell, FaUtensils, FaTruck } from 'react-icons/fa';

const NotificationList = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { unreadNotifications, loading } = useSelector((state) => state.notifications);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Fetch notifications when the dropdown is opened
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchUnreadNotifications());
    }
  }, [isOpen, dispatch]);

  const handleNotificationClick = (notification) => {
    dispatch(markNotificationAsRead(notification.id));
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

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto"
    >
      <div className="py-2 px-4 bg-gray-100 flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">
          Notifications ({unreadNotifications.length})
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <FaTimes />
        </button>
      </div>
      
      {loading ? (
        <div className="p-4 text-center">
          <p>Loading notifications...</p>
        </div>
      ) : unreadNotifications.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <p>No new notifications</p>
        </div>
      ) : (
        <div>
          {unreadNotifications.map((notification) => (
            <Link 
              key={notification.id} 
              to={notification.order ? `/orders/${notification.order}` : '/notifications'}
              className="block px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition duration-150 ease-in-out"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3 mt-1">
                  {getNotificationIcon(notification.notification_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
          <div className="px-4 py-2 text-center border-t border-gray-200">
            <Link 
              to="/notifications" 
              className="text-sm text-blue-500 hover:text-blue-700 font-medium"
              onClick={onClose}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationList;
