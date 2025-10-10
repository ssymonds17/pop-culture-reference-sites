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
  defaultValues?: Partial<Artist | Album | Song>;
  isQuickAdd?: boolean;
};

export const Modal = ({
  isOpen,
  onClose,
  variation,
  label,
  defaultValues,
  isQuickAdd,
}: ModalProps) => {
  const [formValues, setFormValues] = useState<Partial<Artist | Album | Song>>(
    defaultValues || {}
  );

  if (!isOpen) return false;

  const formFields = renderFormFields(
    variation,
    formValues,
    setFormValues,
    isQuickAdd
  );
  const handleOnClose = () => {
    setFormValues(defaultValues || {});
    onClose();
  };

  return (
    <div className="flex z-50 top-0 left-0 absolute justify-center items-center w-screen h-screen bg-gray-400 bg-opacity-75">
      <div className="flex w-1/2 h-min bg-white rounded-lg shadow-xl">
        <div className="flex flex-col relative h-full w-full p-6">
          <ModalHeader label={label} onClose={handleOnClose} />
          <div className="flex-1 py-4 modal-form">
            {formFields}
          </div>
          <ModalFooter
            formValues={formValues}
            setFormValues={setFormValues}
            variation={variation}
            isDisabled={Object.keys(formValues).length === 0}
            defaultValues={defaultValues}
          />
        </div>
      </div>
    </div>
  );
};
