import React from 'react';
import {
  Bell,
  GraduationCap,
  Sliders,
  Database,
  Zap,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { Student } from '../types';

interface NavbarProps {
  activeTab: 'student' | 'advisor' | 'integrations';
  setActiveTab: (tab: 'student' | 'advisor' | 'integrations') => void;
  students: Student[];
  currentStudentId: string;
  setCurrentStudentId: (id: string) => void;
  onRunEngine: () => void;
  isEngineRunning: boolean;
  unresolvedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  students,
  currentStudentId,
  setCurrentStudentId,
  onRunEngine,
  isEngineRunning,
  unresolvedCount,
}) => {
  const currentStudent = students.find((s) => s.id === currentStudentId) || students[0];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 text-gray-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-gray-900">StudentSync <span className="text-indigo-600">AI</span></span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  LMS Connected
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden md:block">Automated Gradebook Sync & Student Task Reminders</p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center space-x-1 bg-gray-100/90 p-1 rounded-xl border border-gray-200">
            <button
              id="nav-student-portal"
              onClick={() => setActiveTab('student')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'student'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Student Portal</span>
              {unresolvedCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 text-[11px] font-bold bg-amber-500 text-white rounded-full">
                  {unresolvedCount}
                </span>
              )}
            </button>

            <button
              id="nav-advisor-hub"
              onClick={() => setActiveTab('advisor')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'advisor'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Advisor & Automations</span>
            </button>

            <button
              id="nav-gradebook-sync"
              onClick={() => setActiveTab('integrations')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'integrations'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>LMS Gradebook Sync</span>
            </button>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-3">
            {/* Student View Switcher (when on Student Tab) */}
            {activeTab === 'student' && students.length > 0 && (
              <div className="flex items-center space-x-2 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200 shadow-xs">
                <span className="text-xs text-gray-500 font-medium hidden md:inline">View as:</span>
                <select
                  id="student-selector"
                  value={currentStudentId}
                  onChange={(e) => setCurrentStudentId(e.target.value)}
                  className="bg-white text-xs font-semibold text-gray-800 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
                >
                  {students.map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      {stu.name} ({stu.riskLevel === 'CRITICAL' ? '⚠️ Critical' : stu.riskLevel === 'AT_RISK' ? '⚡ At Risk' : '✅ On Track'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Run Engine Instant Button */}
            <button
              id="trigger-automation-engine-btn"
              onClick={onRunEngine}
              disabled={isEngineRunning}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs active:scale-95 transition-all disabled:opacity-50"
              title="Manually trigger workflow evaluation daemon"
            >
              {isEngineRunning ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 fill-current" />
              )}
              <span className="hidden sm:inline">Evaluate Workflows</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
