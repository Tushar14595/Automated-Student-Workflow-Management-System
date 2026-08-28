import React, { useState, useEffect } from 'react';
import {
  Student,
  Course,
  WorkflowRule,
  ReminderLog,
  LMSIntegrationConfig,
  StudentCourseGrade,
  StudentAssignmentRecord,
  Assignment,
  ExecutionResult,
} from './types';
import { Navbar } from './components/Navbar';
import { StudentPortal } from './components/StudentPortal';
import { AutomationHub } from './components/AutomationHub';
import { GradebookIntegrations } from './components/GradebookIntegrations';
import { SubmitAssignmentModal } from './components/SubmitAssignmentModal';
import { GradeSimulatorModal } from './components/GradeSimulatorModal';
import { AIStudyPlanModal } from './components/AIStudyPlanModal';
import { ReminderPreviewModal } from './components/ReminderPreviewModal';
import { WorkflowBuilderModal } from './components/WorkflowBuilderModal';
import { StudentDetailModal } from './components/StudentDetailModal';
import { CustomReminderModal } from './components/CustomReminderModal';
import { ExecutionResultModal } from './components/ExecutionResultModal';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'student' | 'advisor' | 'integrations'>('student');
  const [loading, setLoading] = useState(true);

  // Core State
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [studentGrades, setStudentGrades] = useState<StudentCourseGrade[]>([]);
  const [studentAssignments, setStudentAssignments] = useState<StudentAssignmentRecord[]>([]);
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([]);
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [lmsIntegrations, setLmsIntegrations] = useState<LMSIntegrationConfig[]>([]);

  // Selected Student
  const [currentStudentId, setCurrentStudentId] = useState<string>('');

  // Modals
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [submittingCourse, setSubmittingCourse] = useState<Course | null>(null);

  const [simulatorModalOpen, setSimulatorModalOpen] = useState(false);
  const [simulatingCourse, setSimulatingCourse] = useState<Course | null>(null);
  const [simulatingGrade, setSimulatingGrade] = useState<StudentCourseGrade | null>(null);
  const [simulatingUpcoming, setSimulatingUpcoming] = useState<Assignment[]>([]);

  const [aiStudyPlanOpen, setAiStudyPlanOpen] = useState(false);

  const [reminderPreviewOpen, setReminderPreviewOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<ReminderLog | null>(null);

  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null);

  const [studentDetailOpen, setStudentDetailOpen] = useState(false);
  const [selectedStudentDetailId, setSelectedStudentDetailId] = useState<string | null>(null);

  const [customReminderOpen, setCustomReminderOpen] = useState(false);
  const [customReminderStudentId, setCustomReminderStudentId] = useState<string | null>(null);

  const [executionResultOpen, setExecutionResultOpen] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isEngineRunning, setIsEngineRunning] = useState(false);

  // Toast banner
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initial Data Fetch
  const fetchAllData = async () => {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error('Failed to fetch state');
      const data = await res.json();

      setStudents(data.students || []);
      setCourses(data.courses || []);
      setAssignments(data.assignments || []);
      setStudentGrades(data.studentGrades || []);
      setStudentAssignments(data.studentAssignments || []);
      setWorkflowRules(data.workflowRules || []);
      setReminderLogs(data.reminderLogs || []);
      setLmsIntegrations(data.lmsIntegrations || []);

      if (!currentStudentId && data.students?.length > 0) {
        setCurrentStudentId(data.students[0].id);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Helpers for current student
  const currentStudent = students.find((s) => s.id === currentStudentId) || students[0];

  const currentStudentGrades = studentGrades
    .filter((g) => g.studentId === currentStudent?.id)
    .map((g) => ({
      ...g,
      course: courses.find((c) => c.id === g.courseId),
    }));

  const currentStudentAssignments = studentAssignments
    .filter((sa) => sa.studentId === currentStudent?.id)
    .map((sa) => ({
      ...sa,
      assignment: assignments.find((a) => a.id === sa.assignmentId),
      course: courses.find((c) => c.id === sa.courseId),
    }));

  const currentStudentReminders = reminderLogs.filter((r) => r.studentId === currentStudent?.id);

  // Actions
  const handleRunEngine = async () => {
    setIsEngineRunning(true);
    try {
      const res = await fetch('/api/automation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result: ExecutionResult = await res.json();
      setExecutionResult(result);
      setExecutionResultOpen(true);
      await fetchAllData();
      showToast(`Evaluated ${result.studentsEvaluatedCount} students. Dispatched ${result.dispatchedRemindersCount} automated notifications.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Engine run failed', 'error');
    } finally {
      setIsEngineRunning(false);
    }
  };

  const handleSubmitWork = async (assignmentId: string, notes: string, link: string) => {
    if (!currentStudent) return;
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentStudent.id,
          submissionNotes: notes,
          submissionLink: link,
        }),
      });
      if (!res.ok) throw new Error('Submission failed');
      await fetchAllData();
      showToast('Assignment submitted successfully! Gradebook recalculated.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to record submission', 'error');
    }
  };

  const handleResolveReminder = async (reminderId: string) => {
    try {
      await fetch(`/api/reminders/${reminderId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionNote: 'Acknowledged & reviewed by student in portal' }),
      });
      await fetchAllData();
      showToast('Reminder acknowledged and marked resolved.', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await fetch(`/api/automation/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      await fetchAllData();
      showToast(`Rule ${enabled ? 'activated' : 'paused'}.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecuteSingleRule = async (ruleId: string) => {
    try {
      const res = await fetch(`/api/automation/rules/${ruleId}/execute`, { method: 'POST' });
      const result: ExecutionResult = await res.json();
      setExecutionResult(result);
      setExecutionResultOpen(true);
      await fetchAllData();
      showToast(`Rule evaluated. ${result.dispatchedRemindersCount} reminder(s) generated.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this automated workflow rule?')) return;
    try {
      await fetch(`/api/automation/rules/${ruleId}`, { method: 'DELETE' });
      await fetchAllData();
      showToast('Rule deleted.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveRule = async (ruleData: Partial<WorkflowRule>) => {
    try {
      if (ruleData.id) {
        await fetch(`/api/automation/rules/${ruleData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ruleData),
        });
        showToast('Rule updated successfully.');
      } else {
        await fetch('/api/automation/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ruleData),
        });
        showToast('New workflow rule activated.');
      }
      await fetchAllData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save rule', 'error');
    }
  };

  const handleSendCustomReminder = async (reminderData: any) => {
    try {
      const res = await fetch('/api/reminders/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminderData),
      });
      if (!res.ok) throw new Error('Failed to send reminder');
      await fetchAllData();
      showToast('Custom reminder dispatched to student successfully.');
    } catch (err) {
      console.error(err);
      showToast('Failed to send reminder', 'error');
    }
  };

  const handleTriggerLMSSync = async (integrationId: string) => {
    try {
      const res = await fetch('/api/lms/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId }),
      });
      const data = await res.json();
      await fetchAllData();
      showToast(`LMS Gradebook synced. ${data.recordsUpdated || 0} records updated.`);
    } catch (err) {
      console.error(err);
      showToast('LMS sync failed', 'error');
    }
  };

  const handleImportCSV = async (csvText: string) => {
    const res = await fetch('/api/lms/import-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvText }),
    });
    if (!res.ok) throw new Error('CSV Import failed');
    const data = await res.json();
    await fetchAllData();
    showToast(`Imported ${data.recordsProcessed} gradebook rows.`);
    return data;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] text-gray-900 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-gray-600">Initializing StudentSync & Syncing Gradebooks...</p>
      </div>
    );
  }

  const customReminderStudent = students.find((s) => s.id === customReminderStudentId) || null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans antialiased pb-16">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        students={students}
        currentStudentId={currentStudentId}
        setCurrentStudentId={setCurrentStudentId}
        onRunEngine={handleRunEngine}
        isEngineRunning={isEngineRunning}
        unresolvedCount={currentStudentReminders.filter((r) => r.status !== 'ACTION_TAKEN').length}
      />

      {/* Main Content View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Toast Banner */}
        {toastMessage && (
          <div className="mb-6 p-4 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-gray-800">{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-xs text-gray-400 hover:text-gray-600 font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab 1: Student Workspace & Reminders Portal */}
        {activeTab === 'student' && currentStudent && (
          <StudentPortal
            student={currentStudent}
            grades={currentStudentGrades}
            assignments={currentStudentAssignments}
            reminders={currentStudentReminders}
            courses={courses}
            onOpenSubmitModal={(asg, course) => {
              setSubmittingAssignment(asg);
              setSubmittingCourse(course);
              setSubmitModalOpen(true);
            }}
            onOpenSimulatorModal={(course, grade, upcoming) => {
              setSimulatingCourse(course);
              setSimulatingGrade(grade);
              setSimulatingUpcoming(upcoming);
              setSimulatorModalOpen(true);
            }}
            onOpenAIStudyPlanModal={() => setAiStudyPlanOpen(true)}
            onOpenReminderModal={(rem) => {
              setSelectedReminder(rem);
              setReminderPreviewOpen(true);
            }}
            onResolveReminder={handleResolveReminder}
            onUpdatePreferences={async (prefs) => {
              console.log(prefs);
            }}
          />
        )}

        {/* Tab 2: Advisor & Automation Daemon Hub */}
        {activeTab === 'advisor' && (
          <AutomationHub
            rules={workflowRules}
            students={students}
            courses={courses}
            reminderLogs={reminderLogs}
            onToggleRule={handleToggleRule}
            onExecuteRule={handleExecuteSingleRule}
            onDeleteRule={handleDeleteRule}
            onOpenCreateRuleModal={() => {
              setEditingRule(null);
              setWorkflowModalOpen(true);
            }}
            onOpenEditRuleModal={(rule) => {
              setEditingRule(rule);
              setWorkflowModalOpen(true);
            }}
            onOpenStudentDetailModal={(id) => {
              setSelectedStudentDetailId(id);
              setStudentDetailOpen(true);
            }}
            onOpenCustomReminderModal={(id) => {
              setCustomReminderStudentId(id);
              setCustomReminderOpen(true);
            }}
            onOpenReminderPreviewModal={(rem) => {
              setSelectedReminder(rem);
              setReminderPreviewOpen(true);
            }}
            onRunAllRules={handleRunEngine}
            isEngineRunning={isEngineRunning}
          />
        )}

        {/* Tab 3: LMS Gradebook Integrations */}
        {activeTab === 'integrations' && (
          <GradebookIntegrations
            integrations={lmsIntegrations}
            courses={courses}
            students={students}
            onTriggerSync={handleTriggerLMSSync}
            onImportCSV={handleImportCSV}
          />
        )}
      </main>

      {/* Modals */}
      <SubmitAssignmentModal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        assignment={submittingAssignment}
        course={submittingCourse}
        studentId={currentStudentId}
        onSubmitWork={handleSubmitWork}
      />

      <GradeSimulatorModal
        isOpen={simulatorModalOpen}
        onClose={() => setSimulatorModalOpen(false)}
        course={simulatingCourse}
        currentGrade={simulatingGrade}
        upcomingAssignments={simulatingUpcoming}
      />

      <AIStudyPlanModal
        isOpen={aiStudyPlanOpen}
        onClose={() => setAiStudyPlanOpen(false)}
        student={currentStudent}
        grades={currentStudentGrades}
        assignments={currentStudentAssignments}
      />

      <ReminderPreviewModal
        isOpen={reminderPreviewOpen}
        onClose={() => setReminderPreviewOpen(false)}
        reminder={selectedReminder}
        onMarkResolved={handleResolveReminder}
      />

      <WorkflowBuilderModal
        isOpen={workflowModalOpen}
        onClose={() => setWorkflowModalOpen(false)}
        onSaveRule={handleSaveRule}
        courses={courses}
        initialRule={editingRule}
      />

      <StudentDetailModal
        isOpen={studentDetailOpen}
        onClose={() => setStudentDetailOpen(false)}
        studentId={selectedStudentDetailId}
        onOpenCustomReminder={(id) => {
          setStudentDetailOpen(false);
          setCustomReminderStudentId(id);
          setCustomReminderOpen(true);
        }}
      />

      <CustomReminderModal
        isOpen={customReminderOpen}
        onClose={() => setCustomReminderOpen(false)}
        student={customReminderStudent}
        courses={courses}
        assignments={assignments}
        onSendReminder={handleSendCustomReminder}
      />

      <ExecutionResultModal
        isOpen={executionResultOpen}
        onClose={() => setExecutionResultOpen(false)}
        result={executionResult}
      />
    </div>
  );
}

export default App;
