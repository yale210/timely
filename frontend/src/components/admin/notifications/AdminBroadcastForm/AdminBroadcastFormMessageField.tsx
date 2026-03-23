interface AdminBroadcastFormMessageFieldProps {
  message: string;
  messageLimit: number;
  isSubmitting: boolean;
  onMessageChange: (value: string) => void;
}

/**
 * Renders the message field for the broadcast form.
 * @param props - Message state and change callbacks.
 * @returns Message textarea component.
 */
export const AdminBroadcastFormMessageField = (props: AdminBroadcastFormMessageFieldProps) => {
  const isTooLong = props.message.trim().length > props.messageLimit;
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
        <span className={`text-xs ${isTooLong ? "text-red-600" : "text-gray-400"}`}>
          {props.message.trim().length}/{props.messageLimit}
        </span>
      </div>
      <textarea
        id="message"
        value={props.message}
        onChange={(event) => props.onMessageChange(event.target.value)}
        rows={6}
        className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
        placeholder="Share the latest update with the community."
        maxLength={props.messageLimit}
        required
        disabled={props.isSubmitting}
      />
    </div>
  );
};
