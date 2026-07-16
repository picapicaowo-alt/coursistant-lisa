import React, { useState } from 'react';

const CancellationModal = ({ onClose, onShowConfirm }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [researchConsent, setResearchConsent] = useState('');
  const [additionalFeedback, setAdditionalFeedback] = useState('');

  const reasons = [
    "There's too little learning content",
    "I didn't find any value in Coursistant",
    "It's too expensive",
    "The features I expected were missing",
    "Technical difficulties",
    "I do not want the plan to auto-renew",
    "I no longer need it"
  ];

  return (
    <div className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 relative">
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
            Before You Go
          </h2>

          <p className="text-gray-600 mb-6 leading-relaxed">
            We're sorry to see you go, but could you please tell us why? We might be able to help.
          </p>

          {/* Cancellation reason section */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-4">
              Why are you canceling your subscription? <span className="text-red-500">*</span>
            </label>
            
            <div className="space-y-3">
              {reasons.map((reason, index) => (
                <label key={index} className="flex items-start cursor-pointer group">
                  <input
                    type="radio"
                    name="cancellation-reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mt-1 mr-3 w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 text-sm leading-relaxed group-hover:text-gray-900">
                    {reason}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Research consent section */}
          <div className="mb-6">
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Would you mind if someone from our research team contacted you to learn more about how we could have been better for your needs? This is not a sales call, we promise.
            </p>
            
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="research-consent"
                  value="yes"
                  checked={researchConsent === 'yes'}
                  onChange={(e) => setResearchConsent(e.target.value)}
                  className="mr-3 w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700 text-sm group-hover:text-gray-900">
                  Yes, I'm fine with that
                </span>
              </label>
              
              <label className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="research-consent"
                  value="no"
                  checked={researchConsent === 'no'}
                  onChange={(e) => setResearchConsent(e.target.value)}
                  className="mr-3 w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700 text-sm group-hover:text-gray-900">
                  No, thank you
                </span>
              </label>
            </div>
          </div>

          {/* Additional feedback section */}
          <div className="mb-8">
            <label className="block text-gray-700 text-sm font-medium mb-3">
              Is there anything else you'd like to add?
            </label>
            <textarea
              value={additionalFeedback}
              onChange={(e) => setAdditionalFeedback(e.target.value)}
              placeholder="Tell us more"
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              disabled={!selectedReason}
              onClick={() => {
                console.log({
                  reason: selectedReason,
                  researchConsent,
                  additionalFeedback
                });
                onShowConfirm();
              }}
              className={`px-6 py-2 text-white rounded-md transition-colors text-sm font-medium ${
                selectedReason 
                  ? 'bg-[#F56565] hover:bg-red-600 cursor-pointer' 
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              Continue Cancellation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationModal;