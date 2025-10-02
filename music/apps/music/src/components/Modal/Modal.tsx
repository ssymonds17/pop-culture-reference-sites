'use client';

import { useState, useEffect } from 'react';
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
  console.log('defaultValues:', defaultValues);
  const [formValues, setFormValues] = useState<Partial<Artist | Album | Song>>(
    defaultValues || {}
  );

  useEffect(() => {
    setFormValues(defaultValues || {});
  }, [isOpen, defaultValues]);

  if (!isOpen) return false;

  const formFields = renderFormFields(
    variation,
    formValues,
    setFormValues,
    isQuickAdd
  );
  const handleOnClose = () => {
    setFormValues({});
    onClose();
  };

  return (
    <div className="flex z-50 top-0 left-0 absolute justify-center items-center w-screen h-screen bg-gray-400 bg-opacity-75">
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
