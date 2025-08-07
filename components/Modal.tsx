import React from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: '2xl' | '4xl' | '6xl';
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children, size = '2xl' }) => {
  const sizeClasses = {
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
  };

  const sizeClass = sizeClasses[size] || sizeClasses['2xl'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className={`bg-gray-800 text-white rounded-lg shadow-xl w-full ${sizeClass} mx-4 border border-white/30`}>
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            &times;
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;