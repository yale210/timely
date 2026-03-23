import { AdminBroadcastFormTitleField } from "./AdminBroadcastFormTitleField";
import { AdminBroadcastFormMessageField } from "./AdminBroadcastFormMessageField";

interface AdminBroadcastFormFieldsProps {
  title: string;
  message: string;
  titleLimit: number;
  messageLimit: number;
  isSubmitting: boolean;
  onTitleChange: (value: string) => void;
  onMessageChange: (value: string) => void;
}

/**
 * Renders title and message fields for the broadcast form.
 * @param props - Field state and change callbacks.
 * @returns Form input components for title and message.
 */
export const AdminBroadcastFormFields = (props: AdminBroadcastFormFieldsProps) => {
  return (
    <>
      <AdminBroadcastFormTitleField
        title={props.title}
        titleLimit={props.titleLimit}
        isSubmitting={props.isSubmitting}
        onTitleChange={props.onTitleChange}
      />
      <AdminBroadcastFormMessageField
        message={props.message}
        messageLimit={props.messageLimit}
        isSubmitting={props.isSubmitting}
        onMessageChange={props.onMessageChange}
      />
    </>
  );
};
