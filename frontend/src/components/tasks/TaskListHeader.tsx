interface TaskListHeaderProps {
  onNewTask: () => void;
}

const TaskListHeader = ({ onNewTask }: TaskListHeaderProps) => {
  return (
    <div className="px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-black">My Tasks</h2>
        <p className="text-sm text-gray-500 mt-1">Keep track of your daily goals and schedule.</p>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={onNewTask}
          className="bg-primary hover:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm transition-colors"
        >
          <span className="material-icons text-lg mr-1">add</span>
          New Task
        </button>
      </div>
    </div>
  );
};

export default TaskListHeader;
