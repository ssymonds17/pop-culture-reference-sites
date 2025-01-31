import _ from 'lodash';

export const InputField = ({ id }: { id: string }) => {
  return (
    <>
      <label htmlFor={id}>{_.upperFirst(id)}</label>
      <input className="border-2 ml-2" type="text" id={id} name={id} />
    </>
  );
};
