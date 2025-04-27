import React from 'react';

interface CustomJsonViewerProps {
  src: any; // The JSON object/array/primitive to display
  level?: number; // Indentation level (for recursion)
}

const CustomJsonViewer: React.FC<CustomJsonViewerProps> = ({ src, level = 0 }) => {
  const indent = '  '.repeat(level); // Two spaces per indentation level

  if (src === null) {
    return <span style={{ color: '#905' }}>null</span>; // Style for null
  }

  if (typeof src === 'string') {
    return <span style={{ color: '#690' }}>"{src}"</span>; // Style for strings
  }

  if (typeof src === 'number') {
    return <span style={{ color: '#07a' }}>{src}</span>; // Style for numbers
  }

  if (typeof src === 'boolean') {
    return <span style={{ color: '#d14' }}>{String(src)}</span>; // Style for booleans
  }

  if (Array.isArray(src)) {
    if (src.length === 0) {
      return <span>[]</span>;
    }
    return (
      <span>
        [
        {src.map((item, index) => (
          <div key={index} style={{ paddingLeft: '2em' }}>
            {indent}
            <CustomJsonViewer src={item} level={level + 1} />
            {index < src.length - 1 ? ',' : ''}
          </div>
        ))}
        {indent}]
      </span>
    );
  }

  if (typeof src === 'object') {
    const keys = Object.keys(src);
    if (keys.length === 0) {
      return <span>{"{}"}</span>;
    }
    return (
      <span>
        {"{"}
        {keys.map((key, index) => (
          <div key={key} style={{ paddingLeft: '2em' }}>
            {indent}
            <span style={{ color: '#905', fontWeight: 'bold' }}>"{key}"</span>: {/* Style for keys */}
            <CustomJsonViewer src={src[key]} level={level + 1} />
            {index < keys.length - 1 ? ',' : ''}
          </div>
        ))}
        {indent}{"}"}
      </span>
    );
  }

  // Fallback for unexpected types
  return <span>{String(src)}</span>;
};

export default CustomJsonViewer;
