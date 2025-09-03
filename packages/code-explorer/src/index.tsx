import React from 'react';
import { createRoot } from 'react-dom/client';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';

type FuncInfo = { file: string; functions: { name: string; params: string[]; returnType: string }[] };

function App() {
  const [data, setData] = React.useState<FuncInfo[]>([]);
  const [items, setItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData);
  }, []);

  const handleDragEnd = (event: any) => {
    if (event.over && event.over.id === 'canvas') {
      setItems([...items, event.active.data.current]);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: 300, overflowY: 'auto', maxHeight: '80vh' }}>
          {data.map((f) => (
            <div key={f.file} style={{ marginBottom: 8 }}>
              <strong>{f.file}</strong>
              {f.functions.map(func => (
                <DraggableFunc key={f.file + func.name} func={func} />
              ))}
            </div>
          ))}
        </div>
        <Canvas items={items} />
      </div>
    </DndContext>
  );
}

function DraggableFunc({ func }: { func: any }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: func.name, data: func });
  const style = { transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined };
  return (
    <div ref={setNodeRef} style={{ padding: 4, border: '1px solid #ccc', marginTop: 4, cursor: 'grab', ...style }} {...listeners} {...attributes}>
      {func.name}({func.params.join(', ')})
    </div>
  );
}

function Canvas({ items }: { items: any[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: 'canvas' });
  const exportConfig = () => {
    const json = JSON.stringify(items, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'structure.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div ref={setNodeRef} style={{ flex: 1, padding: 16, border: '2px dashed #999', background: isOver ? '#f0f0f0' : '#fff' }}>
      <h3>Canvas</h3>
      {items.map((func, idx) => (
        <div key={idx} style={{ padding: 4, border: '1px solid #ddd', marginBottom: 4 }}>
          {func.name}
        </div>
      ))}
      <button onClick={exportConfig} style={{ marginTop: 8 }}>Export JSON</button>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
