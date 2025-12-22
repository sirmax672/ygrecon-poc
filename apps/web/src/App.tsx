import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './App.css';

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Placeholder Canvas' },
    position: { x: 250, y: 100 },
  },
];

const initialEdges: never[] = [];

function App() {
  return (
    <div className="app">
      <ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

export default App;


