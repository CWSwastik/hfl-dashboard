type MetadataPanelProps = {
  metadata: Record<string, any>;
};

export default function MetadataPanel({ metadata }: MetadataPanelProps) {
  const entries = Object.entries(metadata);
  return (
    <div className="mb-4 p-4 bg-gray-800 rounded-xl">
      <h3 className="text-lg font-semibold mb-4">Metadata</h3>
      <div className="grid grid-cols-3 gap-4">
        {entries.map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <span className="text-sm font-medium text-gray-400 capitalize">
              {key}
            </span>
            <span className="mt-1 text-gray-200 break-words">
              {typeof value === "object"
                ? JSON.stringify(value)
                : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
