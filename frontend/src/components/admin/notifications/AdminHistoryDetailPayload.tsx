interface AdminHistoryDetailPayloadProps {
  message: string;
}

/**
 * Displays the message payload for a broadcast entry.
 * @param props - Payload display props.
 * @returns A card containing the broadcast message text.
 */
export const AdminHistoryDetailPayload = (props: AdminHistoryDetailPayloadProps) => {
  const { message } = props;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Payload</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{message}</p>
    </div>
  );
};
