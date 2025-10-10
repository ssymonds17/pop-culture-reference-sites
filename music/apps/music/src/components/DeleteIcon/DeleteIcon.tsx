export const DeleteIcon = ({
  id,
  handleDelete,
}: {
  id: string;
  handleDelete: (id: string) => Promise<void>;
}) => {
  return (
    <button
      className="btn-icon-xs btn-danger ml-2"
      type="button"
      onClick={() => handleDelete(id)}
    >
      ×
    </button>
  );
};
