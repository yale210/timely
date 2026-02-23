import type React from "react";
import { Popover, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { type Notification } from "../types/notification";
import { NotificationCard } from "./NotificationCard";
import { NotificationBell } from "./NotificationBell";
import { Link } from "react-router-dom";
import { CheckCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import ConfirmationModal from "./ConfirmationModal";

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => Promise<void> | void;
  onDeleteAll: () => Promise<void> | void;
  onItemClick: (notification: Notification) => void;
  onToggleRead: (notification: Notification) => Promise<void> | void;
  onDeleteItem: (notification: Notification) => Promise<void> | void;
}

type DropdownConfirmationAction = "mark_all_read" | "delete_all" | null;

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  onMarkAllRead,
  onDeleteAll,
  onItemClick,
  onToggleRead,
  onDeleteItem,
}) => {
  const [confirmationAction, setConfirmationAction] =
    useState<DropdownConfirmationAction>(null);
  const displayNotifications = notifications.slice(0, 5);

  const handleConfirm = () => {
    if (confirmationAction === "mark_all_read") {
      void onMarkAllRead();
    }
    if (confirmationAction === "delete_all") {
      void onDeleteAll();
    }
  };

  return (
    <>
      <Popover className="relative">
        {() => (
          <>
            <Popover.Button as="div" className="focus:outline-none cursor-pointer">
              <NotificationBell unreadCount={unreadCount} />
            </Popover.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute right-0 z-10 mt-3 w-96 transform px-4 sm:px-0">
                <div className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5 bg-white">
                  <div className="border-b px-4 py-3 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">
                      Notifications ({unreadCount})
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Mark all as read"
                        aria-label="Mark all as read"
                        onClick={() => setConfirmationAction("mark_all_read")}
                        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Delete all"
                        aria-label="Delete all"
                        onClick={() => setConfirmationAction("delete_all")}
                        className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto">
                    {displayNotifications.length > 0 ? (
                      displayNotifications.map((notification) => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          onClick={onItemClick}
                          onToggleRead={(item) => {
                            void onToggleRead(item);
                          }}
                          onDelete={(item) => {
                            void onDeleteItem(item);
                          }}
                          showActions
                          compact
                        />
                      ))
                    ) : (
                      <div className="px-6 py-12 text-center text-sm text-gray-500">
                        No notifications
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 p-3 text-center border-t">
                    <Link
                      to="/notifications"
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>

      <ConfirmationModal
        isOpen={confirmationAction !== null}
        onClose={() => setConfirmationAction(null)}
        onConfirm={handleConfirm}
        title={confirmationAction === "delete_all" ? "Delete all notifications?" : "Mark all as read?"}
        message={
          confirmationAction === "delete_all"
            ? "This will permanently remove all of your notifications."
            : "This will mark every notification as read."
        }
        confirmText={confirmationAction === "delete_all" ? "Delete all" : "Mark all"}
      />
    </>
  );
};
