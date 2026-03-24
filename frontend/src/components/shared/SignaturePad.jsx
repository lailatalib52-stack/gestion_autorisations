import { useRef, useEffect, useState } from 'react';

export default function SignaturePad({ onSave, onClear }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    // Set display size
    canvas.style.width = '100%';
    canvas.style.height = '150px';
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const start = (e) => {
    setIsDrawing(true);
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const end = () => {
    setIsDrawing(false);
    onSave(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  return (
    <div style={{ border: '2px dashed var(--gray-300)', borderRadius: 8, background: '#fff', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={start}
        onMouseMove={draw}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={draw}
        onTouchEnd={end}
        style={{ cursor: 'crosshair', display: 'block' }}
      />
      <button
        type="button"
        onClick={clear}
        style={{
          position: 'absolute', top: 5, right: 5,
          fontSize: 10, background: 'var(--gray-100)', border: 'none',
          padding: '2px 6px', borderRadius: 4, cursor: 'pointer'
        }}
      >
        Effacer
      </button>
    </div>
  );
}
