import { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { Album, Artist, Song } from '../../types';

export const Rating = ({
  id,
  value,
  setFormValues,
  showLabel = true,
  size = 'md',
  error,
  required = false,
}: {
  id: string;
  setFormValues: Dispatch<SetStateAction<Partial<Artist | Album | Song>>>;
  value?: string | number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  required?: boolean;
}) => {
  const handleOnChange = (event: ChangeEvent<HTMLSelectElement>) =>
    setFormValues((prev) => ({ ...prev, [id]: event.target.value }));

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'form-select-sm';
      case 'lg':
        return 'form-select-lg';
      default:
        return 'form-select';
    }
  };

  const getSelectClass = () => {
    let baseClass = getSizeClass();
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
          Rating
        </label>
      )}
      <select
        name={id}
        id={id}
        onChange={handleOnChange}
        value={value ?? 'NONE'}
        className={getSelectClass()}
        required={required}
      >
        <option value="GOLD">Gold</option>
        <option value="SILVER">Silver</option>
        <option value="NONE">None</option>
      </select>
      {error && <div className="form-error">{error}</div>}
    </div>
  );
};
