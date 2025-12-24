import { useEditorStore } from '../store/editorStore';
import { validateDSL } from '@ygrecon/dsl';
import { compileGraph } from '@ygrecon/core';
import { dslToXYFlow, xyFlowToDSL } from '../utils/dslConverter';
import { useCallback } from 'react';

export function ImportExport() {
  const {
    nodes,
    edges,
    dsl,
    setDSL,
    setNodes,
    setEdges,
    setValidationErrors,
    validationErrors,
  } = useEditorStore();
  
  const handleExport = useCallback(() => {
    if (!dsl) return;
    
    const currentDSL = xyFlowToDSL(nodes, edges, dsl);
    const json = JSON.stringify(currentDSL, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dsl.meta.name || 'graph'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [nodes, edges, dsl]);
  
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;
        
        // Validate DSL
        const result = validateDSL(text);
        if (!result.ok) {
          setValidationErrors([result.error.message]);
          return;
        }
        
        const validatedDSL = result.value;
        
        // Compile and check for issues
        const { issues } = compileGraph(validatedDSL);
        if (issues.length > 0) {
          const errorMessages = issues.map(
            (issue) => `${issue.code}: ${issue.message}${issue.nodeId ? ` (node: ${issue.nodeId})` : ''}${issue.edgeId ? ` (edge: ${issue.edgeId})` : ''}`
          );
          setValidationErrors(errorMessages);
          // Still import, but show warnings
        } else {
          setValidationErrors([]);
        }
        
        // Convert to XYFlow format
        const { nodes: newNodes, edges: newEdges } = dslToXYFlow(validatedDSL);
        
        // Update state
        setDSL(validatedDSL);
        setNodes(newNodes);
        setEdges(newEdges);
      };
      reader.readAsText(file);
    };
    input.click();
  }, [setDSL, setNodes, setEdges, setValidationErrors]);
  
  return (
    <div style={{ padding: '8px', borderBottom: '1px solid #ddd', backgroundColor: '#fff' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: validationErrors.length > 0 ? '8px' : '0' }}>
        <button
          onClick={handleImport}
          style={{
            padding: '6px 12px',
            border: '1px solid #007bff',
            borderRadius: '4px',
            backgroundColor: '#007bff',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Import
        </button>
        <button
          onClick={handleExport}
          disabled={!dsl}
          style={{
            padding: '6px 12px',
            border: '1px solid #28a745',
            borderRadius: '4px',
            backgroundColor: '#28a745',
            color: '#fff',
            cursor: dsl ? 'pointer' : 'not-allowed',
            opacity: dsl ? 1 : 0.5,
          }}
        >
          Export
        </button>
      </div>
      {validationErrors.length > 0 && (
        <div
          style={{
            padding: '8px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            color: '#721c24',
            fontSize: '12px',
          }}
        >
          <strong>Validation Errors:</strong>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
            {validationErrors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

