'use client';
import { useState } from 'react';
import { Modal } from '../Modal';

type AddElementItemProps = {
  label: string;
  actionType: 'artist' | 'album' | 'song';
};

export const AddElementItem = ({ label, actionType }: AddElementItemProps) => {
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
      <Modal isOpen={isOpen} onClose={handleOnClose} type={actionType} />
    </>
  );
};
