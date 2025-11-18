const Tag = ({
  children,
  onRemove,
}: {
  children: string;
  onRemove?: () => void;
}) => {
  return (
    <span className="inline-flex mr-1 items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm">
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 text-indigo-600 hover:text-indigo-800"
          aria-label={`Remove ${children}`}
        >
          ×
        </button>
      )}
    </span>
  );
};

export default Tag;
