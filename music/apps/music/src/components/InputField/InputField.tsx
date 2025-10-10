'use client';

import _ from 'lodash';
import { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { Album, Artist, Song } from '../../types';

export const InputField = ({
  id,
  value,
  setFormValues,
  showLabel = true,
  placeholder,
  type = 'text',
  size = 'md',
  error,
  required = false,
}: {
  id: string;
  setFormValues: Dispatch<SetStateAction<Partial<Artist | Album | Song>>>;
  value?: string | number;
  showLabel?: boolean;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  required?: boolean;
}) => {
  const handleOnChange = (event: ChangeEvent<HTMLInputElement>) =>
    setFormValues((prev) => ({ ...prev, [id]: event.target.value }));

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'form-control-sm';
      case 'lg':
        return 'form-control-lg';
      default:
        return 'form-control-md';
    }
  };

  const getInputClass = () => {
    let baseClass = getSizeClass();
    if (type === 'search') {
      baseClass = baseClass.replace('form-control', 'form-search');
    }
    if (error) {
      baseClass += ' form-control-error';
    }
    return baseClass;
  };

  return (
    <div className="form-group">
      {showLabel && (
        <label
          htmlFor={id}
          className={`form-label${
            size === 'sm' ? '-sm' : size === 'lg' ? '-lg' : ''
          }${required ? ' form-label-required' : ''}`}
        >
          {_.upperFirst(id)}
        </label>
      )}
      <input
        className={getInputClass()}
        onChange={handleOnChange}
        value={value ?? ''}
        type={type}
        id={id}
        name={id}
        placeholder={placeholder}
        required={required}
      />
      {error && <div className="form-error">{error}</div>}
    </div>
  );
};
