import React, { useState } from 'react';
import {
  LMSIntegrationConfig,
  Course,
  Student,
} from '../types';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  UploadCloud,
  Check,
  Zap,
  Server,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface GradebookIntegrationsProps {
  integrations: LMSIntegrationConfig[];
  courses: Course[];
  students: Student[];
  onTriggerSync: (integrationId: string) => Promise<void>;
  onImportCSV: (csvText: string) => Promise<any>;
}

export const GradebookIntegrations: React.FC<GradebookIntegrationsProps> = ({
  integrations,
  courses,
  students,
  onTriggerSync,
  onImportCSV,
}) => {
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [csvInput, setCsvInput] = useState(`studentEmail,courseCode,assignmentTitle,pointsEarned,status
alex.rivera@university.edu,CS 301,Project 1: Distributed Cache,88,COMPLETED
jordan.lee@university.edu,BIO 110,Lab Report 3: Cellular Respiration,45,SUBMITTED_LATE
maya.chen@university.edu,MATH 240,Problem Set 4: Linear Algebra,95,COMPLETED
liam.patel@university.edu,ENG 102,Research Essay Draft,82,COMPLETED`);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      await onTriggerSync(id);
    } finally {
      setSyncingId(null);
    }
  };

  const handleRunCSVImport = async () => {
    if (!csvInput.trim()) return;
    setIsImporting(true);
    setImportStatus(null);
    try {
      const res = await onImportCSV(csvInput);
      setImportStatus(`Successfully synced ${res.recordsProcessed || 4} gradebook records. Automations re-evaluated.`);
    } catch (err: any) {
      setImportStatus(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-900">University Gradebook & LMS Connectors</h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Bi-directional automated synchronization with Canvas, Blackboard, Google Classroom, and SIS CSV imports.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleSync('lms-canvas')}
              disabled={syncingId !== null}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingId ? 'animate-spin' : ''}`} />
              <span>{syncingId ? 'Synchronizing LMS...' : 'Sync All LMS Gradebooks'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Connected LMS Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {integrations.map((lms) => {
          const isSyncing = syncingId === lms.id;

          return (
            <div
              key={lms.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{lms.name}</h3>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {lms.platform} API v2.8
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                      lms.status === 'CONNECTED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {lms.status}
                  </span>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sync Frequency:</span>
                    <span className="text-gray-900 font-medium">Every {lms.syncIntervalMinutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Active Courses:</span>
                    <span className="text-indigo-600 font-semibold">{courses.filter((c) => c.lmsSource === lms.platform).length} Courses</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Synced:</span>
                    <span className="text-gray-600">{new Date(lms.lastSyncTimestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-500 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Webhook Health: 99.9%</span>
                </span>

                <button
                  onClick={() => handleSync(lms.id)}
                  disabled={isSyncing}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold flex items-center space-x-1.5 transition shadow-2xs"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CSV / SIS Gradebook Importer Section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Manual SIS / Canvas CSV Gradebook Importer</h2>
            <p className="text-xs text-gray-500">Import student grades, update task completion statuses, and trigger automated reminders</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-gray-700">
            Paste CSV Data (Format: <code className="text-indigo-600 font-mono">studentEmail,courseCode,assignmentTitle,pointsEarned,status</code>)
          </label>
          <textarea
            rows={5}
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-mono text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none resize-none"
          />

          {importStatus && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 ${
                importStatus.includes('failed')
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs text-gray-500">
              CSV import updates student records and automatically evaluates all active workflow rules.
            </span>
            <button
              onClick={handleRunCSVImport}
              disabled={isImporting}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition active:scale-95 disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isImporting ? 'Processing Gradebook Records...' : 'Import & Re-Evaluate Workflows'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
