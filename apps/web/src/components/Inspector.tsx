import { useEditorStore } from '../store/editorStore';
import { nodeTypeRegistry } from '@ygrecon/core';
import { useCallback, useEffect, useState } from 'react';

function getSchemaFieldType(schema: unknown): 'string' | 'number' | 'boolean' | 'enum' | 'unknown' {
  // This is a simplified type checker for Zod schemas
  // In a real implementation, you'd use zod's introspection API
  const schemaObj = schema as { _def?: { typeName?: string; values?: unknown[] } };
  if (schemaObj._def?.typeName === 'ZodString') return 'string';
  if (schemaObj._def?.typeName === 'ZodNumber') return 'number';
  if (schemaObj._def?.typeName === 'ZodBoolean') return 'boolean';
  if (schemaObj._def?.typeName === 'ZodEnum') return 'enum';
  if (schemaObj._def?.typeName === 'ZodOptional') {
    const optionalDef = schemaObj._def as { innerType?: unknown };
    return getSchemaFieldType(optionalDef.innerType);
  }
  return 'unknown';
}

function getEnumValues(schema: unknown): string[] {
  const schemaObj = schema as { _def?: { values?: unknown[] } };
  return (schemaObj._def?.values || []) as string[];
}

function ParamField({
  name,
  schema,
  value,
  onChange,
}: {
  name: string;
  schema: unknown;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const fieldType = getSchemaFieldType(schema);
  const enumValues = fieldType === 'enum' ? getEnumValues(schema) : [];
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (fieldType === 'number') {
      onChange(Number(e.target.value));
    } else if (fieldType === 'boolean') {
      onChange(e.target.value === 'true');
    } else {
      onChange(e.target.value);
    }
  };
  
  if (fieldType === 'boolean') {
    return (
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
          {name}
        </label>
        <select
          value={String(value ?? '')}
          onChange={handleChange}
          style={{ width: '100%', padding: '4px' }}
        >
          <option value="">(not set)</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </div>
    );
  }
  
  if (fieldType === 'enum') {
    return (
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
          {name}
        </label>
        <select
          value={String(value ?? '')}
          onChange={handleChange}
          style={{ width: '100%', padding: '4px' }}
        >
          <option value="">(not set)</option>
          {enumValues.map((val) => (
            <option key={String(val)} value={String(val)}>
              {String(val)}
            </option>
          ))}
        </select>
      </div>
    );
  }
  
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
        {name}
      </label>
      <input
        type={fieldType === 'number' ? 'number' : 'text'}
        value={String(value ?? '')}
        onChange={handleChange}
        style={{ width: '100%', padding: '4px' }}
        placeholder={fieldType === 'number' ? '0' : ''}
      />
    </div>
  );
}

export function Inspector() {
  const {
    selectedNodeId,
    selectedEdgeId,
    nodes,
    edges,
    setNodes,
    setEdges,
    dsl,
    setDSL,
  } = useEditorStore();
  
  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;
  const selectedEdge = selectedEdgeId ? edges.find((e) => e.id === selectedEdgeId) : null;
  
  const nodeType = selectedNode
    ? nodeTypeRegistry.get(selectedNode.data.type as string)
    : null;
  
  const [localParams, setLocalParams] = useState<Record<string, unknown>>({});
  
  useEffect(() => {
    if (selectedNode) {
      setLocalParams(selectedNode.data.params as Record<string, unknown> || {});
    } else if (selectedEdge) {
      setLocalParams(selectedEdge.data?.params as Record<string, unknown> || {});
    } else {
      setLocalParams({});
    }
  }, [selectedNode, selectedEdge]);
  
  const handleParamChange = useCallback(
    (key: string, value: unknown) => {
      const newParams = { ...localParams, [key]: value };
      setLocalParams(newParams);
      
      if (selectedNode) {
        const newNodes = nodes.map((n) =>
          n.id === selectedNodeId
            ? { ...n, data: { ...n.data, params: newParams } }
            : n
        );
        setNodes(newNodes);
        
        if (dsl) {
          const newDSL = {
            ...dsl,
            nodes: dsl.nodes.map((n) =>
              n.id === selectedNodeId ? { ...n, params: newParams } : n
            ),
          };
          setDSL(newDSL);
        }
      } else if (selectedEdge) {
        const newEdges = edges.map((e) =>
          e.id === selectedEdgeId
            ? { ...e, data: { ...e.data, params: newParams } }
            : e
        );
        setEdges(newEdges);
        
        if (dsl) {
          const newDSL = {
            ...dsl,
            edges: dsl.edges.map((e) =>
              e.id === selectedEdgeId ? { ...e, params: newParams } : e
            ),
          };
          setDSL(newDSL);
        }
      }
    },
    [
      localParams,
      selectedNode,
      selectedEdge,
      selectedNodeId,
      selectedEdgeId,
      nodes,
      edges,
      setNodes,
      setEdges,
      dsl,
      setDSL,
    ]
  );
  
  if (!selectedNode && !selectedEdge) {
    return (
      <div
        style={{
          width: '250px',
          backgroundColor: '#f5f5f5',
          borderLeft: '1px solid #ddd',
          padding: '16px',
          height: '100vh',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Inspector</h3>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Select a node or edge to edit its parameters.
        </p>
      </div>
    );
  }
  
  if (selectedNode && nodeType) {
    const schema = nodeType.paramsSchema as { shape?: Record<string, unknown> };
    const shape = schema.shape || {};
    
    return (
      <div
        style={{
          width: '250px',
          backgroundColor: '#f5f5f5',
          borderLeft: '1px solid #ddd',
          padding: '16px',
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Inspector</h3>
        <div style={{ marginBottom: '16px' }}>
          <strong>{nodeType.display.label}</strong>
          <div style={{ fontSize: '12px', color: '#666' }}>{selectedNode.id}</div>
        </div>
        
        <div style={{ marginTop: '16px' }}>
          <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>Parameters</h4>
          {Object.entries(shape).map(([key, fieldSchema]) => (
            <ParamField
              key={key}
              name={key}
              schema={fieldSchema}
              value={localParams[key]}
              onChange={(value) => handleParamChange(key, value)}
            />
          ))}
        </div>
      </div>
    );
  }
  
  if (selectedEdge) {
    const edgeParams = (selectedEdge.data?.params as Record<string, unknown>) || {};
    const edgeLabel = (edgeParams.label as string) || '';
    const edgeFormula = (edgeParams.formula as string) || '';
    
    return (
      <div
        style={{
          width: '250px',
          backgroundColor: '#f5f5f5',
          borderLeft: '1px solid #ddd',
          padding: '16px',
          height: '100vh',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Inspector</h3>
        <div style={{ marginBottom: '16px' }}>
          <strong>Edge</strong>
          <div style={{ fontSize: '12px', color: '#666' }}>{selectedEdge.id}</div>
        </div>
        
        <div style={{ marginTop: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
              From: {selectedEdge.source}
            </label>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
              To: {selectedEdge.target}
            </label>
          </div>
          
          {/* Label field */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
              Label
            </label>
            <input
              type="text"
              value={edgeLabel}
              onChange={(e) => {
                handleParamChange('label', e.target.value);
              }}
              placeholder="Edge label (empty to hide)"
              style={{ width: '100%', padding: '4px', fontSize: '12px' }}
            />
          </div>
          
          {/* Formula field */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
              Formula
            </label>
            <input
              type="text"
              value={edgeFormula}
              onChange={(e) => {
                handleParamChange('formula', e.target.value);
              }}
              placeholder="Formula expression (empty to hide)"
              style={{ width: '100%', padding: '4px', fontSize: '12px' }}
            />
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              Drag the formula block along the edge to reposition it
            </div>
          </div>
          
          <h4 style={{ fontSize: '14px', marginBottom: '12px', marginTop: '16px' }}>Other Parameters</h4>
          {Object.entries(localParams)
            .filter(([key]) => key !== 'label' && key !== 'formula' && key !== 'formulaPosition')
            .map(([key, value]) => (
              <ParamField
                key={key}
                name={key}
                schema={{ _def: { typeName: 'ZodString' } }}
                value={value}
                onChange={(val) => handleParamChange(key, val)}
              />
            ))}
        </div>
      </div>
    );
  }
  
  return null;
}

