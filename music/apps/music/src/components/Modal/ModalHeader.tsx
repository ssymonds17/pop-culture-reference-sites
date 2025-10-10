export const ModalHeader = ({
  label,
  onClose,
}: {
  label: string;
  onClose: () => void;
}) => (
  <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
    <h1 className="text-xl font-semibold text-neutral-900">{label}</h1>
    <button className="btn-ghost-sm" onClick={onClose}>
      Close
    </button>
  </div>
);
