import React, { Fragment, useState } from "react";
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";
import TaskForm from "./TaskForm";
import ConfirmationModal from "./ConfirmationModal";
import { type Category, type Task, type TaskSubmission } from "../types";

interface TaskSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSubmit: (data: TaskSubmission) => void;
  onDelete?: (id: number) => void;
  initialData?: Task;
}

const TaskSidebar: React.FC<TaskSidebarProps> = ({
  isOpen,
  onClose,
  categories,
  onSubmit,
  onDelete,
  initialData,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <>
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          {/* Backdrop */}
          <TransitionChild
            as={Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <TransitionChild
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300 sm:duration-500"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300 sm:duration-500"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <DialogPanel className="pointer-events-auto w-screen max-w-[400px]">
                    <div className="flex h-full flex-col bg-white shadow-xl">
                      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-4">
                          <DialogTitle className="text-lg font-bold text-black">
                            {initialData && initialData.id ? "Edit Task" : "Add New Task"}
                          </DialogTitle>
                          {initialData && !!initialData.id && onDelete && (
                            <button
                              onClick={() => setIsDeleteModalOpen(true)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-md hover:bg-red-50"
                              title="Delete Task"
                            >
                              <span className="material-icons text-xl">delete</span>
                            </button>
                          )}
                        </div>
                        <button
                          onClick={onClose}
                          className="text-gray-400 hover:text-red-500 transition-colors rounded-full p-1 hover:bg-gray-100"
                        >
                          <span className="material-icons">close</span>
                        </button>
                      </div>

                      <div className="relative flex-1 overflow-y-auto bg-white">
                        <TaskForm
                          initialData={initialData}
                          categories={categories}
                          onSubmit={(data) => {
                            onSubmit(data);
                            onClose();
                          }}
                          onCancel={onClose}
                        />
                      </div>
                    </div>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          if (initialData?.id && onDelete) {
            onDelete(initialData.id);
            onClose();
          }
        }}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
      />
    </>
  );
};

export default TaskSidebar;