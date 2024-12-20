type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  type: 'artist' | 'album' | 'song';
};

export const Modal = ({ isOpen, onClose, type }: ModalProps) => {
  if (!isOpen) return false;

  return (
    <div className="flex top-0 left-0 absolute justify-center items-center w-screen h-screen bg-gray-200 bg-opacity-25">
      <div className="flex w-1/4 h-1/4 border-2 bg-opacity-100 bg-white">
        <button onClick={onClose}>Close</button>
        <h1>Add {type}</h1>
      </div>
    </div>
  );
};
