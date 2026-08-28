import React from 'react';
import { X, Zap, CheckCircle2, AlertTriangle, Send, Bell, ArrowRight } from 'lucide-react';
import { ExecutionResult } from '../types';

interface ExecutionResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ExecutionResult | null;
}

export const ExecutionResultModal: React.FC<ExecutionResultModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden text-gray-900 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Workflow Automation Engine Execution</h3>
              <p className="text-xs text-gray-500">Automated Gradebook Daemon Run Completed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 p-6 bg-gray-50/50 border-b border-gray-100 text-center">
          <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Students Evaluated</span>
            <span className="text-xl font-bold text-gray-900 mt-0.5 block">{result.studentsEvaluatedCount}</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Active Rules Evaluated</span>
            <span className="text-xl font-bold text-indigo-600 mt-0.5 block">{result.triggeredRulesCount}</span>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <span className="text-[10px] text-emerald-800 uppercase tracking-wider block">Dispatched Reminders</span>
            <span className="text-xl font-bold text-emerald-700 mt-0.5 block">{result.dispatchedRemindersCount}</span>
          </div>
        </div>

        {/* Dispatch Log Entries */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 text-xs">
          <h4 className="font-bold text-gray-700 uppercase tracking-wider text-[11px] mb-2">
            Execution Log & Dispatched Actions
          </h4>

          {result.details.length === 0 ? (
            <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="font-semibold text-gray-900">No New Actions Required</p>
              <p className="text-gray-500 text-[11px]">
                All active students are currently within configured cooldown windows or have no pending trigger conditions.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {result.details.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-start justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900">{item.studentName}</span>
                      <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono text-[10px]">
                        {item.courseCode}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-white text-gray-600 border border-gray-200 font-mono text-[10px]">
                        via {item.channel}
                      </span>
                    </div>
                    <span className="text-gray-500 mt-0.5 block text-[11px]">{item.reason}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Dispatched
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/70 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
