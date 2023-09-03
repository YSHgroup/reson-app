import React, { useRef, useEffect } from 'react';

const MyComponent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const newElement = document.createElement('div');
      newElement.textContent = 'New child element';
      containerRef.current.appendChild(newElement);
    }
  }, []);

  return <div ref={containerRef}>Container Element</div>;
};

export default MyComponent;