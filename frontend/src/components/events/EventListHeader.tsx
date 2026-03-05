interface EventListHeaderProps {
  onNewEvent: () => void;
}

const EventListHeader = ({ onNewEvent }: EventListHeaderProps) => {
  return (
    <div className="px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-black">My Events</h2>
        <p className="text-sm text-gray-500 mt-1">Keep track of your scheduled events.</p>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={onNewEvent}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm transition-colors"
        >
          <span className="material-icons text-lg mr-1">add</span>
          New Event
        </button>
      </div>
    </div>
  );
};

export default EventListHeader;
