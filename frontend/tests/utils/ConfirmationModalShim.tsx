interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  // optional text overrides to match the real modal API
  confirmText?: string;
  cancelText?: string;
}

/**
 * A tiny test shim for the confirmation modal.
 * @param props - Component properties.
 * @returns The confirmation modal.
 */
export default function ConfirmationModal(props: Props) {
  if (!props.isOpen) return null;
  return (
    <div data-testid="confirmation-modal">
      <h2>{props.title}</h2>
      <button onClick={props.onConfirm}>{props.confirmText ?? "Confirm"}</button>
      <button onClick={props.onClose}>{props.cancelText ?? "Cancel"}</button>
    </div>
  );
}
