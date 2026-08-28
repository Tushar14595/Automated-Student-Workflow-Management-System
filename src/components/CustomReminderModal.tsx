import React, { useState } from 'react';
import { X, Send, Sparkles, RefreshCw, Mail, MessageSquare, Bell } from 'lucide-react';
import { Student, Course, Assignment, ReminderChannel } from '../types';

interface CustomReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  courses: Course[];
  assignments: Assignment[];
  onSendReminder: (reminderData: any) => Promise<void>;
}

export const CustomReminderModal: React.FC<CustomReminderModalProps> = ({
  isOpen,
  onClose,
  student,
  courses,
  assignments,
  onSendReminder,
}) => {
  if (!isOpen || !student) return null;

  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [channel, setChannel] = useState<ReminderChannel>('EMAIL');
  const [urgencyLevel, setUrgencyLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('HIGH');
  const [subject, setSubject] = useState(`⚠️ Task Check-in: Academic Update for ${student.name}`);
  const [body, setBody] = useState(
    `Hi ${student.name},\n\nThis is a personalized reminder from your academic team. Please ensure you are keeping up with your upcoming course deliverables and office hours.`
  );
  const [aiInsights, setAiInsights] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const courseAssignments = assignments.filter((a) => a.courseId === selectedCourseId);

  const handleGenerateWithAI = async (tone: string) => {
    setAiGenerating(true);
    try {
      const asg = assignments.find((a) => a.id === selectedAssignmentId);
      const res = await fetch('/api/ai/personalized-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: student.name,
          courseCode: selectedCourse?.code || 'CS 301',
          courseTitle: selectedCourse?.title || 'Course',
          assignmentTitle: asg?.title || 'Upcoming Semester Milestones',
          assignmentType: asg?.type || 'ASSIGNMENT',
          dueDate: asg?.dueDate || new Date(Date.now() + 86400000 * 2).toISOString(),
          weightPercentage: asg?.weightPercentage || 15,
          currentGrade: 72,
          triggerReason: 'Instructor / Advisor initiated check-in',
          urgencyLevel,
          tone,
        }),
      });

      const data = await res.json();
      if (data.subject) setSubject(data.subject);
      if (data.body) setBody(data.body);
      if (data.aiInsights) setAiInsights(data.aiInsights);
    } catch (err) {
      console.error(err);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await onSendReminder({
        studentId: student.id,
        courseId: selectedCourseId,
        assignmentId: selectedAssignmentId || undefined,
        channel,
        urgencyLevel,
        subject,
        body,
        aiInsights,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-xl shadow-xl overflow-hidden text-gray-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Dispatch Custom Task Reminder</h3>
              <p className="text-xs text-gray-500">Recipient: {student.name} ({student.email})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSend} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Target Course & Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Target Task / Assignment</label>
              <select
                value={selectedAssignmentId}
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              >
                <option value="">General Course Workload Reminder</option>
                {courseAssignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.weightPercentage}% wt)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* AI One-Click Draft Assistance */}
          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-700 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI Tone Drafter (Gemini 3.7 Flash)</span>
              </span>
              {aiGenerating && <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleGenerateWithAI('SUPPORTIVE_COACH')}
                disabled={aiGenerating}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium text-[11px] transition shadow-2xs"
              >
                🤝 Encouraging Coach
              </button>
              <button
                type="button"
                onClick={() => handleGenerateWithAI('URGENT_ACTION')}
                disabled={aiGenerating}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium text-[11px] transition shadow-2xs"
              >
                🚨 Urgent Deadline Alert
              </button>
              <button
                type="button"
                onClick={() => handleGenerateWithAI('SOCRATIC_STRATEGIC')}
                disabled={aiGenerating}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium text-[11px] transition shadow-2xs"
              >
                🧠 Step-by-Step Study Sprint
              </button>
            </div>
          </div>

          {/* Channel & Urgency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Dispatch Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as ReminderChannel)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              >
                <option value="EMAIL">Email ({student.email})</option>
                <option value="SMS">SMS ({student.phone})</option>
                <option value="PUSH">In-App Push Notification</option>
                <option value="DISCORD_WEBHOOK">Student Webhook</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Urgency Priority</label>
              <select
                value={urgencyLevel}
                onChange={(e) => setUrgencyLevel(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High Priority</option>
                <option value="URGENT">Urgent Action</option>
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Message Body */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Message Content</label>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 font-sans resize-none leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* AI Insights */}
          {aiInsights && (
            <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-[11px] text-indigo-800 font-mono">
              <strong>Attached Insight:</strong> {aiInsights}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-900 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Sending...' : 'Send Automated Notification'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
