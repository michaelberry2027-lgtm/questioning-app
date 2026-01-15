export default function QuestionCard({
  title,
  description,
  footer,
}: {
  title: string;
  description: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-gray-700 whitespace-pre-wrap mt-2">
        {description}
      </div>
      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}
