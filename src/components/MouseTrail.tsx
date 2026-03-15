import React, { useEffect, useState } from 'react';

type Point = {
  x: number;
  y: number;
  id: number;
};

export default function MouseTrail({ color }: { color: string }) {
  const [trail, setTrail] = useState<Point[]>([]);

  useEffect(() => {
    let idCounter = 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      const newPoint = { x: e.clientX, y: e.clientY, id: idCounter++ };
      
      setTrail((prev) => {
        const newTrail = [...prev, newPoint];
        if (newTrail.length > 20) {
          newTrail.shift();
        }
        return newTrail;
      });

      // Remove the point after a short delay to create the fading effect
      setTimeout(() => {
        setTrail((prev) => prev.filter((p) => p.id !== newPoint.id));
      }, 500);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {trail.map((point, index) => {
        const size = (index / 20) * 12 + 4; // Size from 4px to 16px
        const opacity = index / 20;
        
        return (
          <div
            key={point.id}
            className="absolute rounded-full mix-blend-screen"
            style={{
              left: point.x - size / 2,
              top: point.y - size / 2,
              width: size,
              height: size,
              backgroundColor: color,
              opacity: opacity * 0.8,
              boxShadow: `0 0 ${size}px ${color}`,
              transition: 'opacity 0.5s ease-out',
            }}
          />
        );
      })}
    </div>
  );
}
