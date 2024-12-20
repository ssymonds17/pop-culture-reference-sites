type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  type: 'artist' | 'album' | 'song';
};

export const Modal = ({ isOpen, onClose, type }: ModalProps) => {
  if (!isOpen) return false;

  return (
    <div className="flex top-0 left-0 absolute justify-center items-center w-screen h-screen bg-gray-400 bg-opacity-75">
      <div className="w-1/2 h-1/2 border-2 bg-opacity-100 bg-white justify-between">
        <div className="flex justify-between m-2">
          <h1>Add {type}</h1>
          <button className="border-2" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
