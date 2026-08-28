import React, { useState } from 'react';
import { X, Sliders, Zap, Sparkles, Bell, Mail, MessageSquare, Plus, Check } from 'lucide-react';
import { WorkflowRule, TriggerType, ReminderChannel, Course } from '../types';

interface WorkflowBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRule: (ruleData: Partial<WorkflowRule>) => Promise<void>;
  courses: Course[];
  initialRule?: WorkflowRule | null;
}

export const WorkflowBuilderModal: React.FC<WorkflowBuilderModalProps> = ({
  isOpen,
  onClose,
  onSaveRule,
  courses,
  initialRule,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(initialRule?.name || '');
  const [description, setDescription] = useState(initialRule?.description || '');
  const [triggerType, setTriggerType] = useState<TriggerType>(initialRule?.triggerType || 'MISSING_ASSIGNMENT');
  const [selectedCourseId, setSelectedCourseId] = useState(initialRule?.conditions.courseId || '');
  const [gradeThreshold, setGradeThreshold] = useState(initialRule?.conditions.gradeThresholdPercentage || 70);
  const [deadlineHours, setDeadlineHours] = useState(initialRule?.conditions.deadlineHoursBefore || 24);
  const [minWeight, setMinWeight] = useState(initialRule?.conditions.minWeightPercentage || 15);
  const [cooldownHours, setCooldownHours] = useState(initialRule?.cooldownHours || 24);

  // Actions
  const [channels, setChannels] = useState<ReminderChannel[]>(initialRule?.actions.channels || ['EMAIL', 'IN_APP']);
  const [urgencyLevel, setUrgencyLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>(
    initialRule?.actions.urgencyLevel || 'HIGH'
  );
  const [templateSubject, setTemplateSubject] = useState(
    initialRule?.actions.templateSubject || '⚠️ Automated Task Notification: {{assignmentTitle}}'
  );
  const [templateBody, setTemplateBody] = useState(
    initialRule?.actions.templateBody ||
      'Hi {{studentName}}, this is an automated alert for {{courseCode}}. Please review "{{assignmentTitle}}" and submit before the deadline.'
  );
  const [useAI, setUseAI] = useState(initialRule?.actions.useAIPersonalization ?? true);
  const [alertAdvisor, setAlertAdvisor] = useState(initialRule?.actions.alertAdvisor ?? false);
  const [suggestStudyPlan, setSuggestStudyPlan] = useState(initialRule?.actions.suggestStudyPlan ?? true);
  const [saving, setSaving] = useState(false);

  const toggleChannel = (channel: ReminderChannel) => {
    if (channels.includes(channel)) {
      if (channels.length > 1) {
        setChannels(channels.filter((c) => c !== channel));
      }
    } else {
      setChannels([...channels, channel]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSaveRule({
        ...(initialRule ? { id: initialRule.id } : {}),
        name,
        description,
        triggerType,
        conditions: {
          courseId: selectedCourseId || undefined,
          gradeThresholdPercentage:
            triggerType === 'GRADE_BELOW_THRESHOLD' || triggerType === 'GRADE_IMPROVEMENT'
              ? Number(gradeThreshold)
              : undefined,
          deadlineHoursBefore:
            triggerType === 'UPCOMING_DEADLINE' || triggerType === 'HIGH_WEIGHT_ASSESSMENT'
              ? Number(deadlineHours)
              : undefined,
          minWeightPercentage:
            triggerType === 'HIGH_WEIGHT_ASSESSMENT' ? Number(minWeight) : undefined,
          requirePrerequisite: triggerType === 'PREREQUISITE_INCOMPLETE',
        },
        actions: {
          channels,
          urgencyLevel,
          templateSubject,
          templateBody,
          useAIPersonalization: useAI,
          alertAdvisor,
          suggestStudyPlan,
        },
        cooldownHours: Number(cooldownHours),
        enabled: initialRule ? initialRule.enabled : true,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save rule:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden text-gray-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {initialRule ? 'Edit Automation Rule' : 'Create Automated Workflow Trigger'}
              </h3>
              <p className="text-xs text-gray-500">Configure university gradebook triggers & automated student task dispatch</p>
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Rule Name & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Rule Name *</label>
              <input
                type="text"
                required
                placeholder="e.g., 24h Midterm Exam Reminder"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Target Course Scope</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              >
                <option value="">All Active Courses (Global Rule)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Trigger Condition Selector */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
            <label className="block font-bold text-indigo-700 uppercase tracking-wider text-[11px]">
              Step 1: Select Gradebook Event Trigger
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'MISSING_ASSIGNMENT', label: 'Overdue / Missing Task', desc: 'Fires when an item is past due without submission' },
                { id: 'GRADE_BELOW_THRESHOLD', label: 'Grade Drop Alert', desc: 'Fires when course percentage falls below threshold' },
                { id: 'HIGH_WEIGHT_ASSESSMENT', label: 'High-Weight Exam Prep', desc: 'Fires for exams/projects with weight >= X%' },
                { id: 'UPCOMING_DEADLINE', label: 'Countdown (X hours)', desc: 'Fires X hours before pending submission deadline' },
                { id: 'PREREQUISITE_INCOMPLETE', label: 'Prerequisite Blocker', desc: 'Fires when dependency assignment is missing' },
                { id: 'GRADE_IMPROVEMENT', label: 'Honor Commendation', desc: 'Fires when student reaches >= 90% in course' },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTriggerType(t.id as TriggerType)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    triggerType === t.id
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-950 shadow-2xs'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="font-bold text-xs block text-gray-900">{t.label}</span>
                  <span className="text-[10px] text-gray-500 leading-tight block mt-0.5">{t.desc}</span>
                </button>
              ))}
            </div>

            {/* Dynamic Threshold Inputs */}
            {(triggerType === 'GRADE_BELOW_THRESHOLD' || triggerType === 'GRADE_IMPROVEMENT') && (
              <div className="pt-2 flex items-center space-x-3">
                <span className="text-gray-700 font-semibold">Grade Threshold Percentage:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gradeThreshold}
                  onChange={(e) => setGradeThreshold(Number(e.target.value))}
                  className="w-24 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-gray-900"
                />
                <span className="text-gray-500">%</span>
              </div>
            )}

            {(triggerType === 'UPCOMING_DEADLINE' || triggerType === 'HIGH_WEIGHT_ASSESSMENT') && (
              <div className="pt-2 flex items-center space-x-3">
                <span className="text-gray-700 font-semibold">Lead Hours Before Deadline:</span>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={deadlineHours}
                  onChange={(e) => setDeadlineHours(Number(e.target.value))}
                  className="w-24 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-gray-900"
                />
                <span className="text-gray-500">hours before</span>
              </div>
            )}

            {triggerType === 'HIGH_WEIGHT_ASSESSMENT' && (
              <div className="pt-2 flex items-center space-x-3">
                <span className="text-gray-700 font-semibold">Minimum Syllabus Weight:</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={minWeight}
                  onChange={(e) => setMinWeight(Number(e.target.value))}
                  className="w-24 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-gray-900"
                />
                <span className="text-gray-500">% course weight</span>
              </div>
            )}
          </div>

          {/* Action Dispatch & Channels */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
            <label className="block font-bold text-indigo-700 uppercase tracking-wider text-[11px]">
              Step 2: Automated Dispatch Channels & Urgency
            </label>
            <div className="flex flex-wrap gap-2">
              {(['EMAIL', 'SMS', 'PUSH', 'IN_APP', 'DISCORD_WEBHOOK'] as ReminderChannel[]).map((ch) => (
                <button
                  type="button"
                  key={ch}
                  onClick={() => toggleChannel(ch)}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition ${
                    channels.includes(ch)
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {channels.includes(ch) && <Check className="w-3.5 h-3.5" />}
                  <span>{ch}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Urgency Level</label>
                <select
                  value={urgencyLevel}
                  onChange={(e) => setUrgencyLevel(e.target.value as any)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                >
                  <option value="LOW">Low (Informational Commendation)</option>
                  <option value="MEDIUM">Medium (Standard 48h Notice)</option>
                  <option value="HIGH">High (Urgent 24h Warning)</option>
                  <option value="URGENT">Urgent (Immediate Grade Risk)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Cooldown Interval (Hours)</label>
                <input
                  type="number"
                  min="1"
                  max="720"
                  value={cooldownHours}
                  onChange={(e) => setCooldownHours(Number(e.target.value))}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">Prevents duplicate spam to same student</span>
              </div>
            </div>
          </div>

          {/* AI Intelligence & Automated Features */}
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
            <label className="block font-bold text-indigo-700 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step 3: Intelligent AI Enhancements</span>
            </label>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="rounded bg-white border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Dynamically tailor reminder message tone and grade impact breakdown using Gemini AI</span>
              </label>

              <label className="flex items-center space-x-2 text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertAdvisor}
                  onChange={(e) => setAlertAdvisor(e.target.checked)}
                  className="rounded bg-white border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Automatically CC Student's Academic Advisor if triggered</span>
              </label>

              <label className="flex items-center space-x-2 text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={suggestStudyPlan}
                  onChange={(e) => setSuggestStudyPlan(e.target.checked)}
                  className="rounded bg-white border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Attach AI 3-Day Recovery Action Plan link to notification</span>
              </label>
            </div>
          </div>

          {/* Template Format Preview */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Notification Subject Template</label>
            <input
              type="text"
              value={templateSubject}
              onChange={(e) => setTemplateSubject(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-900"
            />
            <span className="text-[10px] text-gray-500 font-mono mt-1 block">
              Available tags: {'{{studentName}}, {{courseCode}}, {{assignmentTitle}}, {{weightPercentage}}'}
            </span>
          </div>

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
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : initialRule ? 'Update Rule' : 'Activate Automation Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
