import React from 'react';
import { createRoot } from 'react-dom/client';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';

const globalDataElements = [
  { id: 'text', label: 'Text' },
  { id: 'number', label: 'Number' }
];

const computableContracts = [
  { id: 'sum', label: 'Sum' },
  { id: 'average', label: 'Average' }
];

function DraggableItem({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = { transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined };
  return (
    <div ref={setNodeRef} style={{ padding: 8, border: '1px solid #ccc', marginBottom: 4, cursor: 'grab', ...style }} {...listeners} {...attributes}>
      {label}
    </div>
  );
}

function Canvas({ items }: { items: string[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: 'canvas' });
  return (
    <div ref={setNodeRef} style={{ flex: 1, padding: 16, border: '2px dashed #999', background: isOver ? '#f0f0f0' : '#fff' }}>
      <h3>Preview</h3>
      {items.map((id, idx) => (
        <div key={idx} style={{ padding: 8, border: '1px solid #ddd', marginBottom: 4 }}>{id}</div>
      ))}
    </div>
  );
}

function App() {
  const [items, setItems] = React.useState<string[]>([]);
  const handleDragEnd = (event: any) => {
    if (event.over && event.over.id === 'canvas') {
      setItems([...items, event.active.id]);
    }
  };
  const exportConfig = () => {
    const json = JSON.stringify(items, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'card.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 200 }}>
          <h3>Global Data</h3>
          {globalDataElements.map((el) => (
            <DraggableItem key={el.id} id={el.id} label={el.label} />
          ))}
          <h3>Contracts</h3>
          {computableContracts.map((el) => (
            <DraggableItem key={el.id} id={el.id} label={el.label} />
          ))}
          <button onClick={exportConfig} style={{ marginTop: 8 }}>Export JSON</button>
        </div>
        <Canvas items={items} />
      </div>
    </DndContext>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
