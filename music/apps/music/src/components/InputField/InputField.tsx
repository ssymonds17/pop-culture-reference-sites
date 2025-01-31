'use client';

import _ from 'lodash';
import { ChangeEvent, Dispatch, SetStateAction, useState } from 'react';
import { Artist } from '../../types';

export const InputField = ({
  id,
  setFormValues,
}: {
  id: string;
  setFormValues: Dispatch<SetStateAction<Artist>>;
}) => {
  const [inputValue, setInputValue] = useState<string | number | null>(null);

  const handleOnChange = (event: ChangeEvent<HTMLInputElement>) =>
    setInputValue(event.target.value);

  const handleOnBlur = () =>
    setFormValues((prev) => ({ ...prev, [id]: inputValue }));

  return (
    <>
      <label htmlFor={id}>{_.upperFirst(id)}</label>
      <br />
      <input
        className="border-2 w-full"
        onChange={handleOnChange}
        onBlur={handleOnBlur}
        value={inputValue ?? ''}
        type="text"
        id={id}
        name={id}
      />
    </>
  );
};
