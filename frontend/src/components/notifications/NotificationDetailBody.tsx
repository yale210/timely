interface NotificationDetailBodyProps {
  message: string;
}

/**
 * Renders the message body for a notification detail view.
 * @param props - Notification body props.
 * @returns The formatted notification message body.
 */
export const NotificationDetailBody = (props: NotificationDetailBodyProps) => {
  const { message } = props;

  return (
    <div className="border-t border-gray-100 px-6 py-6">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{message}</p>
    </div>
  );
};
