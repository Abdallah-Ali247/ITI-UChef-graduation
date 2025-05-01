import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import { fetchUnreadNotifications } from '../../store/slices/notificationSlice';

const NotificationIcon = () => {
  const dispatch = useDispatch();
  const { unreadNotifications } = useSelector((state) => state.notifications);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Fetch unread notifications on component mount and when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUnreadNotifications());
      
      // Set up polling to fetch notifications every 30 seconds
      const interval = setInterval(() => {
        dispatch(fetchUnreadNotifications());
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [dispatch, isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div className="notification-icon relative">
      <Link to="/notifications" className="relative">
        <FaBell size={24} className="text-gray-600 hover:text-amber-500 transition-colors" />
        {unreadNotifications.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
          </span>
        )}
      </Link>
    </div>
  );
};

export default NotificationIcon;
