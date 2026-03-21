import ConfirmationModal from "@/components/modals/ConfirmationModal";

interface AdminNotificationsConfirmModalProps {
  /**
   * Whether the modal is visible.
   */
  isOpen: boolean;
  /**
   * Estimated number of recipients.
   */
  targetAudienceCount: number;
  /**
   * Callback to close the modal.
   */
  onClose: () => void;
  /**
   * Callback to trigger the broadcast sending.
   */
  onConfirm: () => void;
}

/**
 * Renders a confirmation modal for sending a broadcast.
 * @param props - Modal state and action callbacks.
 * @returns A confirmation modal component.
 */
export const AdminNotificationsConfirmModal = (props: AdminNotificationsConfirmModalProps) => {
  const { isOpen, targetAudienceCount, onClose, onConfirm } = props;

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Send this broadcast?"
      message={`You are about to notify ${targetAudienceCount} recipients.`}
      confirmText="Send now"
    />
  );
};
