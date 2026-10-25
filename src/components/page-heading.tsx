type PageHeadingProps = {
  title: string;
  description: string;
};

export function PageHeading({ title, description }: PageHeadingProps) {
  return (
    <div className="app-heading">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
