import ConfirmationModal from "@/components/modals/ConfirmationModal";

interface AdminNotificationHistoryDetailRetryModalProps {
  /**
   * Whether the modal is visible.
   */
  isOpen: boolean;
  /**
   * Number of recipients that will be retried.
   */
  failedRecipientsCount: number;
  /**
   * Callback to close the modal.
   */
  onClose: () => void;
  /**
   * Callback to trigger the retry action.
   */
  onConfirm: () => void;
}

/**
 * Renders a confirmation modal for retrying failed recipients.
 * @param props - Modal state and action callbacks.
 * @returns A confirmation modal component.
 */
export const AdminNotificationHistoryDetailRetryModal = (
  props: AdminNotificationHistoryDetailRetryModalProps
) => {
  const { isOpen, failedRecipientsCount, onClose, onConfirm } = props;

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Retry failed recipients?"
      message={`This will re-send to ${failedRecipientsCount} failed recipients only.`}
      confirmText="Retry failed"
    />
  );
};
