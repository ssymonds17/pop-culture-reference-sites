import { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { Album, Artist, Song } from '../../types';

export const Rating = ({
  id,
  value,
  setFormValues,
  showLabel = true,
}: {
  id: string;
  setFormValues: Dispatch<SetStateAction<Partial<Artist | Album | Song>>>;
  value?: string | number;
  showLabel?: boolean;
}) => {
  const handleOnChange = (event: ChangeEvent<HTMLSelectElement>) =>
    setFormValues((prev) => ({ ...prev, [id]: event.target.value }));
  return (
    <div>
      {showLabel && <label htmlFor="rating">Rating</label>}

      <select
        name="ratings"
        id="ratings"
        onChange={handleOnChange}
        value={value ?? 'NONE'}
        className="border-2 w-full"
      >
        <option value="GOLD">Gold</option>
        <option value="SILVER">Silver</option>
        <option value="NONE">None</option>
      </select>
    </div>
  );
};
