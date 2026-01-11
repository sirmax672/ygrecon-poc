import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import { nodeTypeRegistry } from '@ygrecon/core';
import { connectionTypeRegistry } from '@ygrecon/connection-types-core';
import { getWebSocketClient } from '../services/websocket';

function getSchemaFieldType(schema: unknown): 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'unknown' {
  const schemaObj = schema as { _def?: { typeName?: string; values?: unknown[]; innerType?: unknown } };
  if (schemaObj._def?.typeName === 'ZodString') return 'string';
  if (schemaObj._def?.typeName === 'ZodNumber') return 'number';
  if (schemaObj._def?.typeName === 'ZodBoolean') return 'boolean';
  if (schemaObj._def?.typeName === 'ZodEnum') return 'enum';
  if (schemaObj._def?.typeName === 'ZodArray') return 'array';
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
  onBlur,
}: {
  name: string;
  schema: unknown;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
}) {
  const fieldType = getSchemaFieldType(schema);
  const enumValues = fieldType === 'enum' ? getEnumValues(schema) : [];
  const [arrayError, setArrayError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (fieldType === 'number') {
      onChange(Number(e.target.value));
    } else if (fieldType === 'boolean') {
      onChange(e.target.value === 'true');
    } else if (fieldType === 'array') {
      // Try to parse JSON array
      const textValue = e.target.value.trim();
      if (textValue === '') {
        onChange(undefined);
        setArrayError(null);
        return;
      }
      try {
        const parsed = JSON.parse(textValue);
        if (Array.isArray(parsed)) {
          onChange(parsed);
          setArrayError(null);
        } else {
          setArrayError('Value must be a JSON array');
        }
      } catch (err) {
        setArrayError('Invalid JSON array format');
      }
    } else {
      onChange(e.target.value);
    }
  };
  
  const handleBlur = () => {
    if (onBlur) {
      onBlur();
    }
  };
  
  if (fieldType === 'boolean') {
    return (
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
          {name}
        </label>
        <select
          value={value === undefined ? '' : String(value)}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{ width: '100%', padding: '4px', fontSize: '12px' }}
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
          value={value === undefined ? '' : String(value)}
          onChange={handleChange}
          onBlur={handleBlur}
          style={{ width: '100%', padding: '4px', fontSize: '12px' }}
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
  
  if (fieldType === 'array') {
    return (
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
          {name}
        </label>
        <input
          type="text"
          value={value === undefined ? '' : JSON.stringify(value)}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="JSON array (e.g., [1, 2, 3])"
          style={{ 
            width: '100%', 
            padding: '4px', 
            fontSize: '12px',
            border: arrayError ? '1px solid red' : '1px solid #ddd',
          }}
        />
        {arrayError && (
          <div style={{ fontSize: '11px', color: 'red', marginTop: '4px' }}>
            {arrayError}
          </div>
        )}
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
        value={value === undefined ? '' : String(value)}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={fieldType === 'number' ? '0' : ''}
        style={{ width: '100%', padding: '4px', fontSize: '12px' }}
      />
    </div>
  );
}

export function Inspector() {
  const {
    selectedNodeId,
    selectedEdgeId, // Keep for ReactFlow compatibility (maps to connectionId)
    nodes,
    edges, // ReactFlow Edge type (internal alias for connections)
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
  
  // Get connection type from edge.data.type (default to "resource" for backward compatibility)
  const connectionType = selectedEdge ? ((selectedEdge.data as any)?.type || 'resource') : null;
  const connectionTypeDef = connectionType ? connectionTypeRegistry.get(connectionType) : null;
  
  const [localParams, setLocalParams] = useState<Record<string, unknown>>({});
  
  // Debounce timer for param updates
  const paramUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Ref to store current params for onBlur handler
  const currentParamsRef = useRef<Record<string, unknown>>({});
  
  useEffect(() => {
    if (selectedNode) {
      const params = (selectedNode.data.params as Record<string, unknown>) || {};
      setLocalParams(params);
      currentParamsRef.current = params;
    } else if (selectedEdge) {
      const params = (selectedEdge.data?.params as Record<string, unknown>) || {};
      setLocalParams(params);
      currentParamsRef.current = params;
    } else {
      setLocalParams({});
      currentParamsRef.current = {};
    }
    
    // Clear any pending updates when selection changes
    if (paramUpdateTimerRef.current) {
      clearTimeout(paramUpdateTimerRef.current);
      paramUpdateTimerRef.current = null;
    }
  }, [selectedNode, selectedEdge]);
  
  // Function to send params to server immediately (called on blur)
  const sendParamsToServer = useCallback(async () => {
    const currentParams = currentParamsRef.current;
    
    if (!currentParams || Object.keys(currentParams).length === 0) {
      return;
    }
    
    // Clear any pending debounced update since we're sending immediately
    if (paramUpdateTimerRef.current) {
      clearTimeout(paramUpdateTimerRef.current);
      paramUpdateTimerRef.current = null;
    }
    
    const wsClient = getWebSocketClient();
    
    try {
      if (selectedNode && selectedNodeId) {
        await wsClient.updateNode(selectedNodeId, currentParams);
      } else if (selectedEdge && selectedEdgeId) {
        await wsClient.updateConnection(selectedEdgeId, currentParams);
      }
    } catch (error) {
      console.error('Failed to update params on server:', error);
    }
  }, [selectedNode, selectedEdge, selectedNodeId, selectedEdgeId]);

  const handleParamChange = useCallback(
    (key: string, value: unknown) => {
      setLocalParams((prevParams) => {
        const newParams = { ...prevParams, [key]: value };
        currentParamsRef.current = newParams;
        
        // Update local state immediately for responsive UI
        if (selectedNode && selectedNodeId) {
          const newNodes = nodes.map((n) =>
            n.id === selectedNodeId
              ? { ...n, data: { ...n.data, params: newParams } }
              : n
          );
          setNodes(newNodes);
          
          // Update DSL
          if (dsl) {
            const newDSL = {
              ...dsl,
              nodes: dsl.nodes.map((n) =>
                n.id === selectedNodeId ? { ...n, params: newParams } : n
              ),
            };
            setDSL(newDSL);
          }
        } else if (selectedEdge && selectedEdgeId) {
          const newEdges = edges.map((e) =>
            e.id === selectedEdgeId
              ? { ...e, data: { ...e.data, params: newParams } }
              : e
          );
          setEdges(newEdges);
          
          // Update DSL
          if (dsl) {
            const newDSL = {
              ...dsl,
              connections: (dsl.connections || []).map((c) =>
                c.id === selectedEdgeId ? { ...c, params: newParams } : c
              ),
            };
            setDSL(newDSL);
          }
        }
        
        // Debounce server update
        if (paramUpdateTimerRef.current) {
          clearTimeout(paramUpdateTimerRef.current);
        }
        
        paramUpdateTimerRef.current = setTimeout(async () => {
          const wsClient = getWebSocketClient();
          
          try {
            if (selectedNode && selectedNodeId) {
              await wsClient.updateNode(selectedNodeId, newParams);
            } else if (selectedEdge && selectedEdgeId) {
              await wsClient.updateConnection(selectedEdgeId, newParams);
            }
          } catch (error) {
            console.error('Failed to update params on server:', error);
          } finally {
            paramUpdateTimerRef.current = null;
          }
        }, 300);
        
        return newParams;
      });
    },
    [
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
          flex: 1,
          overflow: 'auto',
          padding: '16px',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Inspector</h3>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Select a node or connection to edit its parameters.
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
          flex: 1,
          overflow: 'auto',
          padding: '16px',
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
              onBlur={sendParamsToServer}
            />
          ))}
        </div>
      </div>
    );
  }
  
  if (selectedEdge && connectionTypeDef) {
    const schema = connectionTypeDef.paramsSchema as { shape?: Record<string, unknown> };
    const shape = schema.shape || {};
    
    return (
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Inspector</h3>
        <div style={{ marginBottom: '16px' }}>
          <strong>{connectionTypeDef.display.label}</strong>
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
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
              Type: {connectionType}
            </label>
          </div>
          
          <h4 style={{ fontSize: '14px', marginBottom: '12px', marginTop: '16px' }}>
            {connectionTypeDef.display.label} Parameters
          </h4>
          {Object.entries(shape).map(([key, fieldSchema]) => (
            <ParamField
              key={key}
              name={key}
              schema={fieldSchema}
              value={localParams[key]}
              onChange={(value) => handleParamChange(key, value)}
              onBlur={sendParamsToServer}
            />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        fontSize: '14px',
      }}
    >
      Select a node or connection to inspect
    </div>
  );
}
