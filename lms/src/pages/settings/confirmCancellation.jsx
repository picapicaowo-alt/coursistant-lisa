import React from 'react';

const ConfirmCancellation = ({ onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white shadow-xl rounded-2xl max-w-md w-full mx-4 relative">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-light"
        >
          ✕
        </button>

        <div className="p-6">
          {/* Header */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Confirm Cancellation
          </h2>

          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">
              On April 20, 2025, you will be downgraded to our 
              Starter plan and will lose access to all Coursistant Pro 
              content and tools.
            </p>
          </div>

          <p className="text-gray-600 mb-6 leading-relaxed">
          Are you sure you'd like to continue with the cancelation of your subscription?
          </p>

         

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1 cursor-pointer text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors text-sm font-medium"
            >
              Don't Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-1 cursor-pointer bg-[#F56565] hover:bg-red-600 text-white rounded-md transition-colors text-sm font-medium"
            >
              Yes, Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmCancellation; 