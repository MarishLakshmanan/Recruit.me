import { ButtonType } from "schema/schema";

const Button = ({
  label,
  onClick,
  type,
}: {
  label: string;
  onClick?: () => void;
  type: ButtonType;
}) => {
  const typeClasses: Record<ButtonType, string> = {
    primary: "bg-primary hover:opacity-90",
    secondary: "bg-secondary hover:opacity-90",
    danger: "bg-danger hover:opacity-90",
    warning: "bg-yellow-500 hover:bg-yellow-600",
    info: "bg-blue-500 hover:bg-blue-600",
    light: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    dark: "bg-gray-800 hover:bg-gray-900",
  };

  return (
    <button
      className={`px-4 py-2 rounded-md ${typeClasses[type]} w-full text-white cursor-pointer`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default Button;
