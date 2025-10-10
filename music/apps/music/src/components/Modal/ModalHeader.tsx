export const ModalHeader = ({
  label,
  onClose,
}: {
  label: string;
  onClose: () => void;
}) => (
  <div className="flex justify-between items-center">
    <h1>{label}</h1>
    <button className="btn-ghost-sm" onClick={onClose}>
      Close
    </button>
  </div>
);
