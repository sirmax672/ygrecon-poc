import { useState } from 'react';
import { Inspector } from './Inspector';
import { DSLViewer } from './DSLViewer';

type Tab = 'inspector' | 'dsl';

export function RightPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('inspector');
  
  return (
    <div
      style={{
        width: '300px',
        height: '100%',
        borderLeft: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
      }}
    >
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #ddd',
        }}
      >
        <button
          onClick={() => setActiveTab('inspector')}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            borderBottom: activeTab === 'inspector' ? '2px solid #007bff' : '2px solid transparent',
            backgroundColor: activeTab === 'inspector' ? '#fff' : '#f5f5f5',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'inspector' ? 'bold' : 'normal',
            color: activeTab === 'inspector' ? '#007bff' : '#666',
          }}
        >
          Inspector
        </button>
        <button
          onClick={() => setActiveTab('dsl')}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            borderBottom: activeTab === 'dsl' ? '2px solid #007bff' : '2px solid transparent',
            backgroundColor: activeTab === 'dsl' ? '#fff' : '#f5f5f5',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === 'dsl' ? 'bold' : 'normal',
            color: activeTab === 'dsl' ? '#007bff' : '#666',
          }}
        >
          DSL
        </button>
      </div>
      
      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'inspector' && <Inspector />}
        {activeTab === 'dsl' && <DSLViewer />}
      </div>
    </div>
  );
}

