export const ModalHeader = ({
  label,
  onClose,
}: {
  label: string;
  onClose: () => void;
}) => (
  <div className="modal-header">
    <h1 id="modal-title" className="modal-title">
      {label}
    </h1>
    <button
      className="modal-close"
      onClick={onClose}
      aria-label="Close modal"
      type="button"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M15 5L5 15M5 5L15 15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  </div>
);
