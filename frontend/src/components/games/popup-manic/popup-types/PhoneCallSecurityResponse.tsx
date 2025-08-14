import React from 'react';
import { motion } from 'framer-motion';
import { X, Phone, Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface PhoneCallExplanation {
  why_this_popup_is_X_type?: string;
  what_to_look_for?: string[];
  real_world_impact?: string;
  prevention_tips?: string[];
}

interface PhoneCallSecurityResponseProps {
  isOpen: boolean;
  onClose: () => void;
  callerName: string;
  phoneNumber: string;
  message: string;
  explanation: PhoneCallExplanation;
  isMalicious: boolean;
  userAction: 'answered' | 'declined';
}

const PhoneCallSecurityResponse: React.FC<PhoneCallSecurityResponseProps> = ({
  isOpen,
  onClose,
  callerName,
  phoneNumber,
  message,
  explanation,
  isMalicious,
  userAction
}) => {
  if (!isOpen) return null;

  const getActionFeedback = () => {
    if (isMalicious) {
      return userAction === 'declined' ? {
        icon: <CheckCircle className="w-6 h-6 text-green-400" />,
        title: "✅ Correct Action!",
        message: "You correctly declined this suspicious call.",
        bgColor: "bg-green-900/20 border-green-500/30"
      } : {
        icon: <AlertTriangle className="w-6 h-6 text-red-400" />,
        title: "⚠️ Risky Action!",
        message: "Answering this call could have exposed you to a scam.",
        bgColor: "bg-red-900/20 border-red-500/30"
      };
    } else {
      return userAction === 'answered' ? {
        icon: <CheckCircle className="w-6 h-6 text-green-400" />,
        title: "✅ Safe Action!",
        message: "This was a legitimate call - answering was appropriate.",
        bgColor: "bg-green-900/20 border-green-500/30"
      } : {
        icon: <Info className="w-6 h-6 text-blue-400" />,
        title: "ℹ️ Cautious Approach",
        message: "You declined a legitimate call - being cautious is often wise.",
        bgColor: "bg-blue-900/20 border-blue-500/30"
      };
    }
  };

  const actionFeedback = getActionFeedback();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Phone className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Phone Call Security Analysis</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Call Details */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Phone className="w-5 h-5 text-cyan-400" />
              Call Details
            </h3>
            <div className="space-y-2 text-gray-300">
              <p><strong>Caller:</strong> {callerName}</p>
              <p><strong>Number:</strong> {phoneNumber}</p>
              <p><strong>Message:</strong> "{message}"</p>
            </div>
          </div>

          {/* Action Feedback */}
          <div className={`rounded-lg p-4 border ${actionFeedback.bgColor}`}>
            <div className="flex items-center gap-3 mb-2">
              {actionFeedback.icon}
              <h3 className="text-lg font-semibold text-white">{actionFeedback.title}</h3>
            </div>
            <p className="text-gray-300">{actionFeedback.message}</p>
          </div>

          {/* Why This Call is Malicious/Safe */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              {isMalicious ? (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              ) : (
                <Shield className="w-5 h-5 text-green-400" />
              )}
              {isMalicious ? 'Why This Call is Malicious' : 'Why This Call is Legitimate'}
            </h3>
            <p className="text-gray-300 leading-relaxed">{explanation.why_this_popup_is_X_type || 'No explanation available.'}</p>
          </div>

          {/* Warning Signs / What to Look For */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-yellow-400" />
              Key Indicators to Recognize
            </h3>
            <ul className="space-y-2">
              {explanation.what_to_look_for?.map((indicator, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-300">
                  <span className="text-yellow-400 mt-1">•</span>
                  <span>{indicator}</span>
                </li>
              )) || <li className="text-gray-400">No indicators available.</li>}
            </ul>
          </div>

          {/* Real-World Impact */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Real-World Impact
            </h3>
            <p className="text-gray-300 leading-relaxed">{explanation.real_world_impact || 'No impact information available.'}</p>
          </div>

          {/* Prevention Tips */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              Prevention & Best Practices
            </h3>
            <ul className="space-y-2">
              {explanation.prevention_tips?.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-300">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>{tip}</span>
                </li>
              )) || <li className="text-gray-400">No prevention tips available.</li>}
            </ul>
          </div>

          {/* Close Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              Continue Training
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PhoneCallSecurityResponse;
