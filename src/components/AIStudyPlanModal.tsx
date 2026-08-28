import React, { useState, useEffect } from 'react';
import { X, Sparkles, Calendar, Clock, CheckCircle2, AlertCircle, RefreshCw, Trophy } from 'lucide-react';
import { Student, StudentCourseGrade, Assignment, StudentAssignmentRecord } from '../types';

interface AIStudyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  grades: (StudentCourseGrade & { course?: any })[];
  assignments: (StudentAssignmentRecord & { assignment?: Assignment; course?: any })[];
}

export const AIStudyPlanModal: React.FC<AIStudyPlanModalProps> = ({
  isOpen,
  onClose,
  student,
  grades,
  assignments,
}) => {
  const [loading, setLoading] = useState(false);
  const [studyPlan, setStudyPlan] = useState<any>(null);

  useEffect(() => {
    if (isOpen && student) {
      fetchAIPlan();
    }
  }, [isOpen, student?.id]);

  const fetchAIPlan = async () => {
    if (!student) return;
    setLoading(true);
    try {
      const coursesWithGrades = grades.map((g) => ({
        code: g.course?.code || 'Course',
        title: g.course?.title || '',
        grade: g.currentPercentage,
        letter: g.letterGrade,
      }));

      const missingAssignments = assignments
        .filter((a) => a.status === 'MISSING' && a.assignment)
        .map((a) => ({
          course: a.course?.code || '',
          title: a.assignment!.title,
          weight: a.assignment!.weightPercentage,
          dueDate: a.assignment!.dueDate,
        }));

      const upcomingDeadlines = assignments
        .filter((a) => a.status === 'PENDING' && a.assignment)
        .map((a) => ({
          course: a.course?.code || '',
          title: a.assignment!.title,
          weight: a.assignment!.weightPercentage,
          dueDate: a.assignment!.dueDate,
        }));

      const res = await fetch('/api/ai/remediation-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: student.name,
          major: student.major,
          gpa: student.gpa,
          coursesWithGrades,
          missingAssignments,
          upcomingDeadlines,
        }),
      });

      const data = await res.json();
      setStudyPlan(data);
    } catch (err) {
      console.error('Failed to generate AI study plan:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>AI Automated Study & Remediation Sprint</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                  Gemini 3.7 Flash
                </span>
              </h3>
              <p className="text-xs text-slate-400">Personalized workflow recovery for {student.name} ({student.major})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Synthesizing Gradebook Deadlines & Syllabus Weights...</p>
                <p className="text-xs text-slate-400">Analyzing missing submissions, assessment risk curves, and cognitive pacing.</p>
              </div>
            </div>
          ) : studyPlan ? (
            <div className="space-y-5">
              {/* Diagnosis Alert */}
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Academic Trajectory Assessment</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[11px] font-extrabold rounded-full ${
                      studyPlan.riskRating === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : studyPlan.riskRating === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    Risk Level: {studyPlan.riskRating}
                  </span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{studyPlan.overallDiagnosis}</p>
                <div className="pt-2 flex items-center space-x-2 text-xs text-emerald-300 font-semibold">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  <span>{studyPlan.estimatedGpaImprovement}</span>
                </div>
              </div>

              {/* Priority Focus Areas */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  High-Impact Recovery Actions
                </h4>
                <div className="space-y-2">
                  {studyPlan.priorityFocusAreas?.map((item: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800"
                    >
                      <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <span className="text-xs text-slate-200 font-medium leading-normal">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3-Day Action Sprint */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>Structured 3-Day Execution Sprint</span>
                  <span className="text-[11px] font-normal text-slate-500">Paced Daily Milestones</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {studyPlan.threeDayActionSprint?.map((sprint: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
                          <span className="text-xs font-bold text-indigo-300">{sprint.day}</span>
                          <span className="text-[10px] font-mono text-slate-400 flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{sprint.targetMinutes} min</span>
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {sprint.tasks?.map((task: string, tIdx: number) => (
                            <li key={tIdx} className="text-xs text-slate-300 flex items-start space-x-1.5 leading-snug">
                              <span className="text-indigo-400 font-bold">&bull;</span>
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-xs text-slate-400">Failed to load study plan.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={fetchAIPlan}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regenerate Plan</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
          >
            Close & Begin Tasks
          </button>
        </div>
      </div>
    </div>
  );
};
