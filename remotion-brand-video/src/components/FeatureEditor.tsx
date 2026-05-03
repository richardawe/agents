import type { Feature } from '../types';

interface Props {
  features: Feature[];
  onChange: (features: Feature[]) => void;
}

export function FeatureEditor({ features, onChange }: Props) {
  function update(index: number, patch: Partial<Feature>) {
    onChange(features.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function remove(index: number) {
    onChange(features.filter((_, i) => i !== index));
  }

  if (features.length === 0) {
    return (
      <div className="text-center py-6 text-gray-600 text-sm">
        No sections were detected. The video will use a single zoom-pan animation of your screenshot.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {features.map((feature, i) => (
        <div
          key={feature.id}
          className="flex gap-3 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
        >
          {/* Thumbnail */}
          <div className="relative flex-shrink-0 w-28 overflow-hidden bg-gray-800">
            <img
              src={feature.screenshot}
              alt=""
              className="w-full h-full object-cover object-top"
              style={{ aspectRatio: '16/9' }}
            />
            {/* Feature number badge */}
            <div className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              {i + 1}
            </div>
          </div>

          {/* Editable fields */}
          <div className="flex-1 py-3 pr-3 space-y-2 min-w-0">
            <input
              type="text"
              value={feature.title}
              onChange={(e) => update(i, { title: e.target.value })}
              placeholder="Feature title"
              className="w-full bg-transparent text-white text-sm font-semibold placeholder-gray-600 border-b border-gray-700 focus:border-indigo-500 focus:outline-none pb-1 transition-colors"
            />
            <textarea
              value={feature.description}
              onChange={(e) => update(i, { description: e.target.value })}
              placeholder="Short description (optional)"
              rows={2}
              className="w-full bg-transparent text-gray-400 text-xs placeholder-gray-700 resize-none focus:outline-none focus:text-gray-300 leading-relaxed transition-colors"
            />
          </div>

          {/* Delete */}
          <button
            onClick={() => remove(i)}
            title="Remove feature"
            className="flex-shrink-0 self-start mt-3 mr-3 text-gray-700 hover:text-red-400 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}

      {features.length < 5 && (
        <button
          onClick={() =>
            onChange([
              ...features,
              {
                id: `feat-custom-${Date.now()}`,
                title: 'New Feature',
                description: '',
                screenshot: features[features.length - 1]?.screenshot ?? '',
                scrollY: 0,
              },
            ])
          }
          className="w-full border border-dashed border-gray-700 hover:border-gray-500 text-gray-500 hover:text-gray-300 text-sm rounded-xl py-2.5 transition-colors"
        >
          + Add feature slide
        </button>
      )}
    </div>
  );
}
