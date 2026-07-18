import React, { useEffect } from 'react';

interface ToastProps {
  id?: string;
  message: string;
  duration?: number;
  onClose?: () => void;
}

export default function Toast({ message, duration = 2000, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div className="fixed right-4 bottom-6 z-50">
      <div className="bg-slate-900 text-white px-4 py-2 rounded-lg shadow-md text-sm">
        {message}
      </div>
    </div>
  );
}
