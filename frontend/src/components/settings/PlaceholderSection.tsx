interface PlaceholderSectionProps {
  title: string;
  description: string;
}

const PlaceholderSection = ({ title, description }: PlaceholderSectionProps) => (
  <>
    <h2 className="text-lg font-semibold">{title}</h2>
    <p className="mt-2 text-sm text-gray-600">
      {description}
    </p>
  </>
);

export default PlaceholderSection;
