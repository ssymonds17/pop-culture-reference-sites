import { Variation } from '../../types';
import { InputField } from '../InputField';
import { ModalFooter } from './ModalFooter';
import { ModalHeader } from './ModalHeader';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  type: Variation;
};

export const Modal = ({ isOpen, onClose, type }: ModalProps) => {
  if (!isOpen) return false;

  return (
    <div className="flex top-0 left-0 absolute justify-center items-center w-screen h-screen bg-gray-400 bg-opacity-75">
      <div className="flex w-1/2 h-1/2 border-2 bg-opacity-100 bg-white p-2">
        <div className="flex flex-col relative h-full w-full">
          <ModalHeader type={type} onClose={onClose} />
          <div>
            <InputField id="name" />
          </div>
          <ModalFooter />
        </div>
      </div>
    </div>
  );
};
