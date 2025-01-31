import { Variation } from '../../types';

export const ModalHeader = ({
  type,
  onClose,
}: {
  type: Variation;
  onClose: () => void;
}) => {
  return (
    <div className="flex justify-between">
      <h1>Add {type}</h1>
      <button className="border-2" onClick={onClose}>
        Close
      </button>
    </div>
  );
};
