export const ModalHeader = ({
  label,
  onClose,
}: {
  label: string;
  onClose: () => void;
}) => (
  <div className="flex justify-between">
    <h1>{label}</h1>
    <button className="border-2" onClick={onClose}>
      Close
    </button>
  </div>
);
