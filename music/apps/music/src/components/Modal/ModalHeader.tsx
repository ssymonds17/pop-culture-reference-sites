import { Variation } from '../../types';

export const ModalHeader = ({
  variation,
  onClose,
}: {
  variation: Variation;
  onClose: () => void;
}) => (
  <div className="flex justify-between">
    <h1>Add {variation}</h1>
    <button className="border-2" onClick={onClose}>
      Close
    </button>
  </div>
);
