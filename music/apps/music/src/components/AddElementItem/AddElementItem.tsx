type AddElementItemProps = {
  label: string;
  actionType: 'artist' | 'album' | 'song';
};

export const AddElementItem = ({ label, actionType }: AddElementItemProps) => {
  const handleClick = () => {
    console.log('actionType', actionType);
  };
  return (
    <button type="button" onClick={handleClick}>
      {label}
    </button>
  );
};
