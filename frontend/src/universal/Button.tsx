import { FormEvent, MouseEventHandler } from "react";
import { ButtonType } from "schema/shcema";

const Button = ({
  label,
  onClick,
  type,
}: {
  label: string;
  onClick?: () => void;
  type: ButtonType;
}) => {
  return (
    <button
      className={`px-4 py-2 rounded-md bg-${type} w-full text-white cursor-pointer`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default Button;
