export const DeleteIcon = ({
  id,
  handleDelete,
}: {
  id: string;
  handleDelete: (id: string) => Promise<void>;
}) => {
  return (
    <button
      className="ml-2 w-6 h-6 rounded-full border-2 border-black flex justify-center items-center hover:cursor-pointer hover:text-red-600 hover:border-red-600"
      type="button"
      onClick={() => handleDelete(id)}
    >
      <p>X</p>
    </button>
  );
};
