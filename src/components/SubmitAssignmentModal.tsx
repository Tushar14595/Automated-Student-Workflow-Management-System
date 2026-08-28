import React, { useState } from 'react';
import { X, CheckCircle, UploadCloud, Link as LinkIcon, FileText, Sparkles } from 'lucide-react';
import { Assignment, Course } from '../types';

interface SubmitAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  course: Course | null;
  studentId: string;
  onSubmitWork: (assignmentId: string, notes: string, link: string) => Promise<void>;
}

export const SubmitAssignmentModal: React.FC<SubmitAssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  course,
  studentId,
  onSubmitWork,
}) => {
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !assignment || !course) return null;

  const isOverdue = new Date().getTime() > new Date(assignment.dueDate).getTime();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmitWork(assignment.id, submissionNotes, submissionLink);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: course.color }}
            />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {course.code} &bull; {course.title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white">{assignment.title}</h3>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{assignment.description}</p>
          </div>

          {/* Assessment Badges */}
          <div className="flex flex-wrap gap-2 py-2 border-y border-slate-800/80 text-xs">
            <div className="bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300 font-medium">
              Weight: <span className="text-indigo-300 font-bold">{assignment.weightPercentage}%</span>
            </div>
            <div className="bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300 font-medium">
              Points: <span className="text-emerald-300 font-bold">{assignment.pointsPossible} pts</span>
            </div>
            <div className="bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300 font-medium">
              Due: <span className="text-slate-200">{new Date(assignment.dueDate).toLocaleString()}</span>
            </div>
            {isOverdue && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1">
                <span>Late Submission (Up to 80% credit)</span>
              </div>
            )}
          </div>

          {/* Submission URL / Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
              <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Project Repository or File Link (Google Drive / GitHub / PDF)</span>
            </label>
            <input
              type="url"
              placeholder="https://github.com/student/assignment or https://drive.google.com/..."
              value={submissionLink}
              onChange={(e) => setSubmissionLink(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Submission Notes / Clarifications for Instructor</span>
            </label>
            <textarea
              rows={3}
              placeholder="Completed all core requirements and unit test benchmarks..."
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording Submission...' : 'Submit & Resolve Reminder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
