'use client';
import { useState } from 'react';
import { Modal } from '../Modal';
import { Variation } from '../../types';

type AddElementItemProps = {
  label: string;
  variation: Variation;
};

export const AddElementItem = ({ label, variation }: AddElementItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleClick = () => {
    setIsOpen(true);
  };
  const handleOnClose = () => {
    setIsOpen(false);
  };
  return (
    <>
      <button type="button" onClick={handleClick}>
        {label}
      </button>
      <Modal
        isOpen={isOpen}
        onClose={handleOnClose}
        variation={variation}
        label={label}
      />
    </>
  );
};
