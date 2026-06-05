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
    <div
      className="modal-backdrop"
      onClick={handleOnClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="modal-container modal-md flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader label={label} onClose={handleOnClose} />
        <div className="modal-body modal-form flex-1">
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
  );
};
