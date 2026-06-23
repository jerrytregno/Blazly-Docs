export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
      <p className="mt-2 text-base text-gray-500">{description}</p>
    </div>
  );
}
