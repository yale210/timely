import type React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { type Notification } from '../types/notification';
import { 
  ArrowLeftIcon, 
  TrashIcon
} from '@heroicons/react/24/outline';

/**
 * A page component that displays the full details of a single notification.
 *
 * This component fetches the notification by ID from the URL parameters
 * and allows users to view its content or delete it.
 * @returns The rendered notification detail page.
 */
export const NotificationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const response = await axios.get<Notification>(`/api/notifications/${id}/`);
        setNotification(response.data);
        
        if (!response.data.is_read) {
          await axios.post(`/api/notifications/${id}/mark_read/`);
        }
      } catch (err) {
        setError('Failed to fetch notification details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void fetchNotification();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await axios.delete(`/api/notifications/${id}/`);
        await navigate('/notifications');
      } catch (err) {
        console.error('Failed to delete notification', err);
      }
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error || !notification) return <div className="p-8 text-center text-red-500">{error ?? 'Notification not found'}</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link to="/notifications" className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to notifications
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {notification.title}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {new Date(notification.timestamp).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => void handleDelete()}
            className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="text-sm text-gray-900 whitespace-pre-wrap">
            {notification.message}
          </div>
          
          {notification.sender_username && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Sent by: <span className="font-medium text-gray-700">{notification.sender_username}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
