'use client';

import { useState } from 'react';
import { Album, Artist, Song, Variation } from '../../types';
import { ModalFooter } from './ModalFooter';
import { ModalHeader } from './ModalHeader';
import { renderFormFields } from './FormFields';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  variation: Variation;
  label: string;
};

export const Modal = ({ isOpen, onClose, variation, label }: ModalProps) => {
  const [formValues, setFormValues] = useState<Partial<Artist | Album | Song>>(
    {}
  );

  if (!isOpen) return false;

  const formFields = renderFormFields(variation, formValues, setFormValues);
  const handleOnClose = () => {
    setFormValues({});
    onClose();
  };

  return (
    <div className="flex top-0 left-0 absolute justify-center items-center w-screen h-screen bg-gray-400 bg-opacity-75">
      <div className="flex w-1/2 h-min border-2 bg-opacity-100 bg-white p-2">
        <div className="flex flex-col relative h-full w-full">
          <ModalHeader label={label} onClose={handleOnClose} />
          {formFields}
          <ModalFooter
            formValues={formValues}
            setFormValues={setFormValues}
            variation={variation}
            isDisabled={Object.keys(formValues).length === 0}
          />
        </div>
      </div>
    </div>
  );
};
