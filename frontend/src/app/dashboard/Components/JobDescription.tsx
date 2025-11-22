const JobDescription = ({
  description,
}: {
  description: string | undefined;
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Job Description:</h3>
      <p className="text-gray-700 whitespace-pre-wrap">
        {description || "This is where job description will be shown"}
      </p>
    </div>
  );
};

export default JobDescription;
