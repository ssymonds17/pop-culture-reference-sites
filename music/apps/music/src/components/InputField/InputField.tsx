'use client';

import _ from 'lodash';
import { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { Artist } from '../../types';

export const InputField = ({
  id,
  value,
  setFormValues,
  showLabel = true,
}: {
  id: string;
  setFormValues: Dispatch<SetStateAction<Partial<Artist>>>;
  value?: string | number;
  showLabel?: boolean;
}) => {
  const handleOnChange = (event: ChangeEvent<HTMLInputElement>) =>
    setFormValues((prev) => ({ ...prev, [id]: event.target.value }));

  return (
    <>
      {showLabel && (
        <>
          <label htmlFor={id}>{_.upperFirst(id)}</label>
          <br />
        </>
      )}
      <input
        className="border-2 w-full"
        onChange={handleOnChange}
        value={value ?? ''}
        type="text"
        id={id}
        name={id}
      />
    </>
  );
};
