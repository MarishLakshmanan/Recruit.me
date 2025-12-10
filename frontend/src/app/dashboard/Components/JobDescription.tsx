const JobDescription = ({
  description,
}: {
  description: string | undefined | null;
}) => {
  const displayText =
    description && description.trim()
      ? description.trim()
      : "This is where job description will be shown";

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Job Description:</h3>
      <p className="text-gray-700 whitespace-pre-wrap">{displayText}</p>
    </div>
  );
};

export default JobDescription;
