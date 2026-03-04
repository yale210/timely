/**
 * A tiny test shim for the confirmation modal. Tests sometimes assert on the
 * accessible button text, so we accept `confirmText`/`cancelText` and render
 * them (falling back to values used in tests).
 * @param props.isOpen - whether the modal is visible
 * @param props.onClose - called when the modal cancel/close action occurs
 * @param props.onConfirm - called when the confirm action is triggered
 * @param props.title - dialog title text
 * @param props.confirmText - optional override for confirm button text
 * @param props.cancelText - optional override for cancel button text
 */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  // optional text overrides to match the real modal API
  confirmText?: string;
  cancelText?: string;
}

// Minimal confirmation modal used by tests/pages. Keeps same API shape.
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  confirmText,
  cancelText,
}: Props) {
  if (!isOpen) return null;
  return (
    <div data-testid="confirmation-modal">
      <h2>{title}</h2>
      <button onClick={onConfirm}>{confirmText ?? "Confirm"}</button>
      <button onClick={onClose}>{cancelText ?? "Cancel"}</button>
    </div>
  );
}
