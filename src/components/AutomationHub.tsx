import React, { useState } from 'react';
import {
  WorkflowRule,
  Student,
  Course,
  ReminderLog,
  ExecutionResult,
} from '../types';
import {
  Sliders,
  Zap,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Mail,
  MessageSquare,
  Bell,
  Send,
  Sparkles,
  Search,
  Filter,
  Eye,
  Trash2,
  Edit2,
  Clock,
  Check,
  RefreshCw,
} from 'lucide-react';

interface AutomationHubProps {
  rules: WorkflowRule[];
  students: Student[];
  courses: Course[];
  reminderLogs: ReminderLog[];
  onToggleRule: (ruleId: string, enabled: boolean) => Promise<void>;
  onExecuteRule: (ruleId: string) => Promise<void>;
  onDeleteRule: (ruleId: string) => Promise<void>;
  onOpenCreateRuleModal: () => void;
  onOpenEditRuleModal: (rule: WorkflowRule) => void;
  onOpenStudentDetailModal: (studentId: string) => void;
  onOpenCustomReminderModal: (studentId: string) => void;
  onOpenReminderPreviewModal: (reminder: ReminderLog) => void;
  onRunAllRules: () => Promise<void>;
  isEngineRunning: boolean;
}

export const AutomationHub: React.FC<AutomationHubProps> = ({
  rules,
  students,
  courses,
  reminderLogs,
  onToggleRule,
  onExecuteRule,
  onDeleteRule,
  onOpenCreateRuleModal,
  onOpenEditRuleModal,
  onOpenStudentDetailModal,
  onOpenCustomReminderModal,
  onOpenReminderPreviewModal,
  onRunAllRules,
  isEngineRunning,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'RULES' | 'ROSTER' | 'LOGS'>('RULES');
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL' | 'AT_RISK' | 'ON_TRACK'>('ALL');
  const [executingRuleId, setExecutingRuleId] = useState<string | null>(null);

  const atRiskStudents = students.filter((s) => s.riskLevel === 'AT_RISK' || s.riskLevel === 'CRITICAL');
  const resolvedLogsCount = reminderLogs.filter((r) => r.status === 'ACTION_TAKEN' || r.status === 'OPENED').length;
  const resolutionRate = reminderLogs.length > 0 ? Math.round((resolvedLogsCount / reminderLogs.length) * 100) : 100;

  const filteredStudents = students.filter((stu) => {
    const matchesSearch =
      stu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stu.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stu.major.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || stu.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const handleTestRule = async (ruleId: string) => {
    setExecutingRuleId(ruleId);
    try {
      await onExecuteRule(ruleId);
    } finally {
      setExecutingRuleId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Command Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">Automation Daemon</span>
            <div className="flex items-center space-x-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-lg font-bold text-gray-900">Active</span>
            </div>
            <span className="text-xs text-gray-500 mt-0.5 block">{rules.filter((r) => r.enabled).length} of {rules.length} Rules Active</span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">Students at Risk</span>
            <div className="text-xl font-bold text-rose-600 mt-1">{atRiskStudents.length} Students</div>
            <span className="text-xs text-gray-500 mt-0.5 block">{students.length} Total Monitored</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">Reminders Dispatched</span>
            <div className="text-xl font-bold text-indigo-600 mt-1">{reminderLogs.length} Total</div>
            <span className="text-xs text-gray-500 mt-0.5 block">Email, SMS, Push & Webhooks</span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
            <Send className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">Resolution Rate</span>
            <div className="text-xl font-bold text-emerald-600 mt-1">{resolutionRate}%</div>
            <span className="text-xs text-gray-500 mt-0.5 block">{resolvedLogsCount} Actions Resolved</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Hub Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('RULES')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeSubTab === 'RULES'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Automation Workflow Rules ({rules.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ROSTER')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeSubTab === 'ROSTER'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Student Risk & Roster Matrix ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('LOGS')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-2 ${
              activeSubTab === 'LOGS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Delivery & Dispatch Logs ({reminderLogs.length})</span>
          </button>
        </div>

        {activeSubTab === 'RULES' && (
          <button
            onClick={onOpenCreateRuleModal}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Automation Rule</span>
          </button>
        )}
      </div>

      {/* SUB-VIEW 1: AUTOMATION RULES */}
      {activeSubTab === 'RULES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => {
              const isExecuting = executingRuleId === rule.id;

              return (
                <div
                  key={rule.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition shadow-sm ${
                    rule.enabled
                      ? 'bg-white border-gray-200 hover:border-gray-300'
                      : 'bg-gray-50 border-gray-200/60 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border ${
                              rule.actions.urgencyLevel === 'URGENT'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : rule.actions.urgencyLevel === 'HIGH'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            }`}
                          >
                            {rule.actions.urgencyLevel}
                          </span>
                          <span className="text-[10px] font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                            {rule.triggerType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mt-1.5">{rule.name}</h3>
                      </div>

                      {/* Enable/Disable Toggle */}
                      <button
                        onClick={() => onToggleRule(rule.id, !rule.enabled)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          rule.enabled ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            rule.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed">{rule.description}</p>

                    {/* Trigger criteria tags */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                      <div className="bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700 font-medium">
                        Channels: <strong className="text-indigo-600">{rule.actions.channels.join(', ')}</strong>
                      </div>
                      <div className="bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700 font-medium">
                        Cooldown: <strong className="text-gray-900">{rule.cooldownHours}h</strong>
                      </div>
                      {rule.actions.useAIPersonalization && (
                        <div className="bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 text-indigo-700 flex items-center space-x-1 font-semibold">
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          <span>Gemini AI Copy</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                    <div className="text-gray-500 text-[11px]">
                      Triggered <strong>{rule.timesTriggered}</strong> times &bull; {rule.resolvedActionsCount} resolved
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTestRule(rule.id)}
                        disabled={isExecuting || !rule.enabled}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg font-semibold transition disabled:opacity-40 shadow-2xs"
                        title="Evaluate this rule now"
                      >
                        {isExecuting ? (
                          <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                        ) : (
                          <Play className="w-3 h-3 text-emerald-600 fill-current" />
                        )}
                        <span>Test Run</span>
                      </button>

                      <button
                        onClick={() => onOpenEditRuleModal(rule)}
                        className="p-1.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 transition shadow-2xs"
                        title="Edit rule"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteRule(rule.id)}
                        className="p-1.5 rounded-lg bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-200 text-gray-400 hover:text-rose-600 transition shadow-2xs"
                        title="Delete rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: STUDENT RISK & ROSTER MATRIX */}
      {activeSubTab === 'ROSTER' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search students by name, email, major..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Risk Filters */}
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
              {(['ALL', 'CRITICAL', 'AT_RISK', 'ON_TRACK'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskFilter(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    riskFilter === r ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {r === 'ALL'
                    ? 'All'
                    : r === 'CRITICAL'
                    ? 'Critical'
                    : r === 'AT_RISK'
                    ? 'At Risk'
                    : 'On Track'}
                </button>
              ))}
            </div>
          </div>

          {/* Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Major / Year</th>
                  <th className="px-4 py-3">GPA</th>
                  <th className="px-4 py-3">Academic Risk</th>
                  <th className="px-4 py-3">Task Health</th>
                  <th className="px-4 py-3">Advisor</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((stu) => (
                  <tr key={stu.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-3">
                        <img
                          src={stu.avatar}
                          alt={stu.name}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                        <div>
                          <span className="font-bold text-gray-900 block">{stu.name}</span>
                          <span className="text-[11px] text-gray-500">{stu.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-gray-700">
                      <span className="block font-medium">{stu.major}</span>
                      <span className="text-[11px] text-gray-500">{stu.year}</span>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-gray-900">
                      {stu.gpa.toFixed(2)}
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          stu.riskLevel === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : stu.riskLevel === 'AT_RISK'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {stu.riskLevel.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="text-[11px] space-y-0.5">
                        <span className="text-gray-700 block">{stu.stats.completedTasks} Completed</span>
                        {stu.stats.missingTasks > 0 ? (
                          <span className="text-rose-600 font-bold block">{stu.stats.missingTasks} Overdue / Missing</span>
                        ) : (
                          <span className="text-emerald-600 block font-medium">0 Missing</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-gray-700">
                      <span className="block font-medium">{stu.advisorName}</span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onOpenCustomReminderModal(stu.id)}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center space-x-1 shadow-xs transition"
                          title="Dispatch tailored task reminder"
                        >
                          <Send className="w-3 h-3" />
                          <span>Nudge</span>
                        </button>

                        <button
                          onClick={() => onOpenStudentDetailModal(stu.id)}
                          className="px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg font-semibold flex items-center space-x-1 transition shadow-2xs"
                          title="View full gradebook dossier"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Dossier</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: LIVE DISPATCH & DELIVERY LOGS */}
      {activeSubTab === 'LOGS' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Automated Reminder Dispatch Logs</h3>
              <p className="text-xs text-gray-500">Real-time audit trail of all automated student workflow communications</p>
            </div>
            <span className="text-xs text-gray-500 font-mono">{reminderLogs.length} Total Records</span>
          </div>

          <div className="space-y-2.5">
            {reminderLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => onOpenReminderPreviewModal(log)}
                className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200/80 hover:border-indigo-300 hover:bg-white cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-900 text-xs">{log.studentName}</span>
                    <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {log.courseCode}
                    </span>
                    <span className="text-[10px] font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                      {log.channel}
                    </span>
                    <span
                      className={`px-2 py-0.2 text-[10px] font-extrabold rounded-full border ${
                        log.urgencyLevel === 'URGENT'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : log.urgencyLevel === 'HIGH'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      {log.urgencyLevel}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-gray-900">{log.subject}</h4>
                  <p className="text-[11px] text-gray-600 line-clamp-1">{log.body}</p>
                </div>

                <div className="flex items-center space-x-3 shrink-0 text-right">
                  <div className="text-[11px]">
                    <span className="text-gray-500 block">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span
                      className={`font-semibold ${
                        log.status === 'ACTION_TAKEN'
                          ? 'text-emerald-600'
                          : log.status === 'OPENED'
                          ? 'text-cyan-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {log.status.replace('_', ' ')}
                    </span>
                  </div>
                  <Eye className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
