import React, { useState } from 'react';
import {
  Student,
  Course,
  StudentCourseGrade,
  Assignment,
  StudentAssignmentRecord,
  ReminderLog,
} from '../types';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  Calculator,
  UploadCloud,
  TrendingUp,
  TrendingDown,
  Mail,
  MessageSquare,
  Bell,
  Send,
  ExternalLink,
  ChevronRight,
  Filter,
  Flame,
} from 'lucide-react';

interface StudentPortalProps {
  student: Student;
  grades: (StudentCourseGrade & { course?: Course })[];
  assignments: (StudentAssignmentRecord & { assignment?: Assignment; course?: Course })[];
  reminders: ReminderLog[];
  courses: Course[];
  onOpenSubmitModal: (assignment: Assignment, course: Course) => void;
  onOpenSimulatorModal: (course: Course, grade: StudentCourseGrade, upcomingAssignments: Assignment[]) => void;
  onOpenAIStudyPlanModal: () => void;
  onOpenReminderModal: (reminder: ReminderLog) => void;
  onResolveReminder: (id: string) => Promise<void>;
  onUpdatePreferences: (preferences: any) => Promise<void>;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  student,
  grades,
  assignments,
  reminders,
  courses,
  onOpenSubmitModal,
  onOpenSimulatorModal,
  onOpenAIStudyPlanModal,
  onOpenReminderModal,
  onResolveReminder,
  onUpdatePreferences,
}) => {
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'MISSING' | 'PENDING' | 'COMPLETED'>('ALL');

  // Filter unresolved/active reminders for the action feed
  const activeReminders = reminders.filter((r) => r.status !== 'ACTION_TAKEN');
  const missingAssignments = assignments.filter((a) => a.status === 'MISSING');
  const pendingAssignments = assignments.filter((a) => a.status === 'PENDING');

  const filteredTasks = assignments.filter((item) => {
    if (taskFilter === 'MISSING') return item.status === 'MISSING';
    if (taskFilter === 'PENDING') return item.status === 'PENDING';
    if (taskFilter === 'COMPLETED') return item.status === 'COMPLETED' || item.status === 'SUBMITTED_LATE';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Student Profile & Academic Summary Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <img
              src={student.avatar}
              alt={student.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
            />
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{student.name}</h1>
                <span
                  className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                    student.riskLevel === 'CRITICAL'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : student.riskLevel === 'AT_RISK'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {student.riskLevel === 'CRITICAL'
                    ? '⚠️ Critical Grade Risk'
                    : student.riskLevel === 'AT_RISK'
                    ? '⚡ Needs Attention'
                    : '✅ On Track'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {student.major} &bull; {student.year} &bull; Advisor: <span className="text-gray-700 font-medium">{student.advisorName}</span>
              </p>
            </div>
          </div>

          {/* Quick Academic KPIs */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 text-center min-w-[100px] shadow-xs">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">Cumulative GPA</span>
              <span className="text-lg font-bold text-gray-900 mt-0.5 block">{student.gpa.toFixed(2)}</span>
            </div>

            <div className="bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 text-center min-w-[100px] shadow-xs">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">Overdue Tasks</span>
              <span className={`text-lg font-bold mt-0.5 block ${missingAssignments.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {missingAssignments.length}
              </span>
            </div>

            <div className="bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 text-center min-w-[100px] shadow-xs">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">Pending Due</span>
              <span className="text-lg font-bold text-indigo-600 mt-0.5 block">{pendingAssignments.length}</span>
            </div>

            <button
              onClick={onOpenAIStudyPlanModal}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>AI Study Sprint Copilot</span>
            </button>
          </div>
        </div>
      </div>

      {/* Automated Task Reminders Action Tray (HIGH PRIORITY) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                <span>Automated Workflow Reminders & Urgent Actions</span>
                {activeReminders.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                    {activeReminders.length} Active
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-500">Triggered automatically by university LMS gradebook events & deadlines</p>
            </div>
          </div>
        </div>

        {activeReminders.length === 0 ? (
          <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-sm font-semibold text-gray-900">All automated reminders resolved!</p>
            <p className="text-xs text-gray-500">You are completely up to date with your current course deadlines.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeReminders.map((rem) => {
              const matchedAssignment = assignments.find((a) => a.assignmentId === rem.assignmentId)?.assignment;
              const matchedCourse = courses.find((c) => c.id === rem.courseId);

              return (
                <div
                  key={rem.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                    rem.urgencyLevel === 'URGENT'
                      ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                      : rem.urgencyLevel === 'HIGH'
                      ? 'bg-amber-50/50 border-amber-200 hover:border-amber-300'
                      : 'bg-indigo-50/40 border-indigo-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header line */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-white text-gray-800 border border-gray-200 font-mono">
                          {rem.courseCode}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                            rem.urgencyLevel === 'URGENT'
                              ? 'bg-rose-100 text-rose-700'
                              : rem.urgencyLevel === 'HIGH'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {rem.urgencyLevel}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        via {rem.channel} &bull; {new Date(rem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 leading-snug">{rem.subject}</h3>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{rem.body}</p>

                    {rem.aiInsights && (
                      <div className="p-2.5 rounded-lg bg-white border border-indigo-100 text-[11px] text-indigo-900 flex items-start space-x-1.5 shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <span className="leading-tight">{rem.aiInsights}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200/80 text-xs">
                    <button
                      onClick={() => onOpenReminderModal(rem)}
                      className="text-gray-600 hover:text-gray-900 transition font-medium flex items-center space-x-1"
                    >
                      <span>View Full Reminder</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center space-x-2">
                      {matchedAssignment && matchedCourse && (
                        <button
                          onClick={() => onOpenSubmitModal(matchedAssignment, matchedCourse)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition active:scale-95"
                        >
                          Submit Work
                        </button>
                      )}
                      <button
                        onClick={() => onResolveReminder(rem.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold transition shadow-2xs"
                        title="Mark as reviewed"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gradebook Course Cards & Syllabus Weights */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
            <span>Enrolled Courses & Gradebook Standings</span>
          </h2>
          <span className="text-xs text-gray-500">Synced with university LMS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {grades.map((gradeRecord) => {
            const course = gradeRecord.course;
            if (!course) return null;

            const courseUpcoming = assignments
              .filter((a) => a.courseId === course.id && (a.status === 'PENDING' || a.status === 'MISSING') && a.assignment)
              .map((a) => a.assignment!);

            return (
              <div
                key={gradeRecord.courseId}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-gray-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: course.color }} />
                      <span className="font-bold text-gray-900 text-sm">{course.code}</span>
                    </div>
                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                      {course.lmsSource}
                    </span>
                  </div>

                  <h3 className="text-xs text-gray-700 font-medium line-clamp-1">{course.title}</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">{course.instructor}</p>

                  {/* Big Grade Number */}
                  <div className="flex items-baseline justify-between mt-4">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {gradeRecord.currentPercentage.toFixed(1)}%
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          gradeRecord.currentPercentage >= 85
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : gradeRecord.currentPercentage >= 70
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        Grade: {gradeRecord.letterGrade}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 text-xs">
                      {gradeRecord.trend === 'UP' ? (
                        <span className="text-emerald-600 flex items-center font-bold">
                          <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> Up
                        </span>
                      ) : gradeRecord.trend === 'DOWN' ? (
                        <span className="text-rose-600 flex items-center font-bold">
                          <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> Down
                        </span>
                      ) : (
                        <span className="text-gray-500 font-medium">Stable</span>
                      )}
                    </div>
                  </div>

                  {/* Syllabus Weight Breakdown Bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[10px] text-gray-500">
                      <span>Syllabus Weights</span>
                      <span>{course.credits} Credits</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full flex overflow-hidden">
                      <div className="bg-indigo-500" style={{ width: `${course.weights.exams}%` }} title={`Exams: ${course.weights.exams}%`} />
                      <div className="bg-cyan-500" style={{ width: `${course.weights.homework}%` }} title={`Homework: ${course.weights.homework}%`} />
                      <div className="bg-emerald-500" style={{ width: `${course.weights.projects}%` }} title={`Projects: ${course.weights.projects}%`} />
                      <div className="bg-amber-500" style={{ width: `${course.weights.quizzes}%` }} title={`Quizzes: ${course.weights.quizzes}%`} />
                    </div>
                  </div>
                </div>

                {/* Simulator Action Button */}
                <button
                  onClick={() => onOpenSimulatorModal(course, gradeRecord, courseUpcoming)}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-2xs"
                >
                  <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Simulate "What-If" Grade</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task & Assignment Schedule Feed */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Assignment Deadlines & Submission Tracker</span>
            </h2>
            <p className="text-xs text-gray-500">Track deliverables, late policies, and automated reminders</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
            {(['ALL', 'MISSING', 'PENDING', 'COMPLETED'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTaskFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  taskFilter === filter
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filter === 'ALL'
                  ? 'All Tasks'
                  : filter === 'MISSING'
                  ? `Missing (${missingAssignments.length})`
                  : filter === 'PENDING'
                  ? `Pending (${pendingAssignments.length})`
                  : 'Completed'}
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-2.5">
          {filteredTasks.length === 0 ? (
            <p className="text-center py-8 text-xs text-gray-500">No assignments match this filter.</p>
          ) : (
            filteredTasks.map((sa) => {
              const asg = sa.assignment;
              const course = sa.course;
              if (!asg || !course) return null;

              const isOverdue = new Date().getTime() > new Date(asg.dueDate).getTime();

              return (
                <div
                  key={sa.id}
                  className="p-4 rounded-xl bg-gray-50/70 border border-gray-200/80 hover:border-gray-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900 text-sm">{asg.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-indigo-700 border border-indigo-100 font-mono">
                        {course.code}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
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

                    <p className="text-xs text-gray-600 line-clamp-1">{asg.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 pt-1 font-medium">
                      <span>Due: <strong className="text-gray-700">{new Date(asg.dueDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</strong></span>
                      <span>&bull;</span>
                      <span>Weight: <strong className="text-indigo-600">{asg.weightPercentage}%</strong></span>
                      <span>&bull;</span>
                      <span>Points: <strong className="text-gray-700">{asg.pointsPossible} pts</strong></span>
                      {sa.pointsEarned !== undefined && (
                        <>
                          <span>&bull;</span>
                          <span className="text-emerald-600 font-bold">Earned: {sa.pointsEarned} pts</span>
                        </>
                      )}
                      {sa.reminderSentCount > 0 && (
                        <>
                          <span>&bull;</span>
                          <span className="text-amber-700 flex items-center space-x-1">
                            <Bell className="w-3 h-3" />
                            <span>{sa.reminderSentCount} automated reminder(s) sent</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Submission Action */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {sa.status !== 'COMPLETED' && (
                      <button
                        onClick={() => onOpenSubmitModal(asg, course)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition active:scale-95"
                      >
                        {sa.status === 'MISSING' ? 'Submit Late Work' : 'Turn In Work'}
                      </button>
                    )}
                    {sa.status === 'COMPLETED' && (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Submitted</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
