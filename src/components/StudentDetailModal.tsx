import React, { useState, useEffect } from 'react';
import { X, User, BookOpen, AlertTriangle, CheckCircle, Clock, Send, Sparkles, Phone, Mail } from 'lucide-react';
import { Student, Course, StudentCourseGrade, StudentAssignmentRecord, Assignment, ReminderLog } from '../types';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string | null;
  onOpenCustomReminder: (studentId: string) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  studentId,
  onOpenCustomReminder,
}) => {
  const [data, setData] = useState<{
    student: Student;
    grades: (StudentCourseGrade & { course?: Course })[];
    assignments: (StudentAssignmentRecord & { assignment?: Assignment; course?: Course })[];
    reminders: ReminderLog[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && studentId) {
      fetchStudentDetails(studentId);
    }
  }, [isOpen, studentId]);

  const fetchStudentDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${id}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !studentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden text-gray-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center space-x-3">
            {data?.student.avatar && (
              <img
                src={data.student.avatar}
                alt={data.student.name}
                className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-gray-900">{data?.student.name || 'Loading...'}</h3>
                {data?.student.riskLevel && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border ${
                      data.student.riskLevel === 'CRITICAL'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : data.student.riskLevel === 'AT_RISK'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {data.student.riskLevel.replace('_', ' ')}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {data?.student.major} &bull; {data?.student.year} &bull; GPA: <strong className="text-gray-900">{data?.student.gpa.toFixed(2)}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {loading || !data ? (
            <div className="py-12 text-center text-gray-400">Loading student dossier...</div>
          ) : (
            <>
              {/* Quick Contact & Advisor Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Email & Phone</span>
                  <span className="text-gray-900 font-medium block">{data.student.email}</span>
                  <span className="text-gray-500 text-[11px] block">{data.student.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Assigned Academic Advisor</span>
                  <span className="text-indigo-600 font-semibold block">{data.student.advisorName}</span>
                  <span className="text-gray-500 text-[11px] block">{data.student.advisorEmail}</span>
                </div>
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => {
                      onOpenCustomReminder(data.student.id);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Custom Reminder</span>
                  </button>
                </div>
              </div>

              {/* Course Grades Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Current Semester Enrolled Courses & Gradebook Standings</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.grades.map((g) => (
                    <div
                      key={g.courseId}
                      className="p-3.5 rounded-xl bg-white border border-gray-200 shadow-2xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-900 text-sm">{g.course?.code}</span>
                          <span className="text-gray-500 text-[11px] truncate max-w-[140px]">{g.course?.title}</span>
                        </div>
                        <span className="text-[11px] text-gray-500 mt-0.5 block">Instructor: {g.course?.instructor}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-gray-900">
                          {g.currentPercentage.toFixed(1)}%
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            g.currentPercentage >= 85
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : g.currentPercentage >= 70
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          Grade: {g.letterGrade}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overdue / Missing & Pending Tasks */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Assignments & Task Submission Status</span>
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {data.assignments.map((sa) => (
                    <div
                      key={sa.id}
                      className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-900">{sa.course?.code}</span>
                          <span className="text-gray-700">{sa.assignment?.title}</span>
                          <span className="text-gray-400 text-[10px]">({sa.assignment?.weightPercentage}% wt)</span>
                        </div>
                        <span className="text-[10px] text-gray-500">Due: {sa.assignment ? new Date(sa.assignment.dueDate).toLocaleDateString() : ''}</span>
                      </div>
                      <div>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            sa.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : sa.status === 'MISSING'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : sa.status === 'SUBMITTED_LATE'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {sa.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reminders Dispatched History */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Automated Workflow Dispatch History ({data.reminders.length})</span>
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {data.reminders.length === 0 ? (
                    <p className="text-gray-400 italic">No automated reminders dispatched yet.</p>
                  ) : (
                    data.reminders.map((rem) => (
                      <div
                        key={rem.id}
                        className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-gray-900 block">{rem.subject}</span>
                          <span className="text-[10px] text-gray-500">
                            {rem.ruleName} &bull; {new Date(rem.createdAt).toLocaleString()} via {rem.channel}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                            rem.status === 'ACTION_TAKEN'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : rem.status === 'OPENED'
                              ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {rem.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/70 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
