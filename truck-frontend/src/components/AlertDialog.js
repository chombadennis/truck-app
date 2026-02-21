
import React from 'react';

export default function AlertDialog({ isOpen, onClose, title, message, type }) {
  if (!isOpen) return null;

  const colorClasses = {
    success: {
      bg: 'bg-green-100',
      border: 'border-green-500',
      title: 'text-green-800',
      message: 'text-green-700',
      button: 'bg-green-500 hover:bg-green-600',
    },
    error: {
      bg: 'bg-red-100',
      border: 'border-red-500',
      title: 'text-red-800',
      message: 'text-red-700',
      button: 'bg-red-500 hover:bg-red-600',
    },
  };

  const colors = colorClasses[type] || colorClasses.error;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg shadow-xl p-6 w-full max-w-md mx-auto ${colors.bg} border-t-4 ${colors.border}`}>
        <h3 className={`text-xl font-bold ${colors.title}`}>{title}</h3>
        <p className={`mt-2 text-base ${colors.message}`}>{message}</p>
        <div className="mt-4 text-right">
          <button
            onClick={onClose}
            className={`text-white font-bold py-2 px-4 rounded transition duration-300 ${colors.button}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
