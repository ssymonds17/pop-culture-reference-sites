import _ from 'lodash';

export const InputField = ({ id }: { id: string }) => {
  return (
    <>
      <label htmlFor={id}>{_.upperFirst(id)}</label>
      <br />
      <input className="border-2 w-full" type="text" id={id} name={id} />
    </>
  );
};
