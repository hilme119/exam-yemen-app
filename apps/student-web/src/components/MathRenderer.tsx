import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content?: string;
  text?: string;
  className?: string;
  inline?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  text: textProp,
  className = '',
  inline = false,
}) => {
  const rawText = content || textProp || '';

  const renderedContent = useMemo(() => {
    if (!rawText) return '';

    // Handle block formulas $$ ... $$
    let text = rawText.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: true,
          throwOnError: false,
        });
      } catch (err) {
        return math;
      }
    });

    // Handle inline formulas $ ... $
    text = text.replace(/\$([^\$]+?)\$/g, (_, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false,
        });
      } catch (err) {
        return math;
      }
    });

    // Convert newlines to <br/>
    return text.replace(/\n/g, '<br />');
  }, [rawText]);

  if (inline) {
    return (
      <span
        className={`math-content ${className}`}
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />
    );
  }

  return (
    <div
      className={`math-content leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};
