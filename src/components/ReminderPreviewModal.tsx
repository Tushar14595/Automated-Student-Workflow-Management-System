import React from 'react';
import { X, Mail, MessageSquare, Bell, Send, CheckCircle2, Clock, Sparkles, ExternalLink } from 'lucide-react';
import { ReminderLog } from '../types';

interface ReminderPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder: ReminderLog | null;
  onMarkResolved: (reminderId: string) => Promise<void>;
}

export const ReminderPreviewModal: React.FC<ReminderPreviewModalProps> = ({
  isOpen,
  onClose,
  reminder,
  onMarkResolved,
}) => {
  if (!isOpen || !reminder) return null;

  const getChannelIcon = () => {
    switch (reminder.channel) {
      case 'EMAIL':
        return <Mail className="w-5 h-5 text-indigo-400" />;
      case 'SMS':
        return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case 'PUSH':
        return <Bell className="w-5 h-5 text-amber-400" />;
      default:
        return <Send className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
              {getChannelIcon()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">Automated Task Reminder</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                  {reminder.channel}
                </span>
                <span
                  className={`px-2 py-0.2 text-[10px] font-extrabold rounded-full ${
                    reminder.urgencyLevel === 'URGENT'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : reminder.urgencyLevel === 'HIGH'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  }`}
                >
                  {reminder.urgencyLevel}
                </span>
              </div>
              <p className="text-xs text-slate-400">{reminder.ruleName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Rendering Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Metadata Card */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Recipient:</span>
              <span className="text-slate-200 font-semibold">{reminder.studentName} ({reminder.studentEmail})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Course / Task:</span>
              <span className="text-indigo-300 font-semibold">{reminder.courseCode} &bull; {reminder.assignmentTitle || 'General Advisory'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Timestamp:</span>
              <span className="text-slate-400">{new Date(reminder.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Delivery Status:</span>
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{reminder.status}</span>
              </span>
            </div>
          </div>

          {/* Email / SMS Render Box */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="pb-2 border-b border-slate-800">
              <span className="text-xs text-slate-400 block font-semibold">Subject</span>
              <h4 className="text-sm font-bold text-white mt-0.5">{reminder.subject}</h4>
            </div>

            <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
              {reminder.body}
            </div>
          </div>

          {/* AI Insights Box if available */}
          {reminder.aiInsights && (
            <div className="bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-500/20 text-xs space-y-1">
              <div className="flex items-center space-x-1 text-indigo-300 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Automated Gradebook Insight</span>
              </div>
              <p className="text-slate-300 leading-normal">{reminder.aiInsights}</p>
            </div>
          )}

          {/* Resolution info if resolved */}
          {reminder.resolvedAt && (
            <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/20 text-xs text-emerald-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Resolved on {new Date(reminder.resolvedAt).toLocaleString()}: {reminder.resolutionNote}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Close
          </button>
          {reminder.status !== 'ACTION_TAKEN' && (
            <button
              onClick={async () => {
                await onMarkResolved(reminder.id);
                onClose();
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Acknowledge & Mark Resolved</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
