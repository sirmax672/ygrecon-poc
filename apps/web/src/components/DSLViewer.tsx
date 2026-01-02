import { useEditorStore } from '../store/editorStore';
import { useMemo } from 'react';

export function DSLViewer() {
  const { dsl } = useEditorStore();
  
  const dslJson = useMemo(() => {
    if (!dsl) return 'No DSL data';
    try {
      return JSON.stringify(dsl, null, 2);
    } catch (error) {
      return `Error formatting DSL: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }, [dsl]);
  
  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        padding: '12px',
        fontFamily: 'monospace',
        fontSize: '12px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        backgroundColor: '#f5f5f5',
      }}
    >
      {dslJson}
    </div>
  );
}

