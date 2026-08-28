import React, { useState } from 'react';
import { X, Calculator, TrendingUp, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { Course, StudentCourseGrade, Assignment } from '../types';

interface GradeSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  currentGrade: StudentCourseGrade | null;
  upcomingAssignments: Assignment[];
}

export const GradeSimulatorModal: React.FC<GradeSimulatorModalProps> = ({
  isOpen,
  onClose,
  course,
  currentGrade,
  upcomingAssignments,
}) => {
  if (!isOpen || !course || !currentGrade) return null;

  // Initialize simulated scores for upcoming assignments
  const [simulatedScores, setSimulatedScores] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    upcomingAssignments.forEach((asg) => {
      map[asg.id] = 85; // default 85%
    });
    return map;
  });

  const handleSliderChange = (asgId: string, value: number) => {
    setSimulatedScores((prev) => ({
      ...prev,
      [asgId]: value,
    }));
  };

  // Calculate projected new course grade percentage
  const currentPct = currentGrade.currentPercentage;
  const remainingWeightSum = upcomingAssignments.reduce((sum, a) => sum + a.weightPercentage, 0);
  const currentWeightBasis = Math.max(1, 100 - remainingWeightSum);

  // Projected grade calculation: (currentPct * currentWeightBasis + sum(simulatedScore * weight)) / 100
  let simulatedAddedWeightValue = 0;
  upcomingAssignments.forEach((asg) => {
    const score = simulatedScores[asg.id] ?? 85;
    simulatedAddedWeightValue += (score * asg.weightPercentage) / 100;
  });

  const currentContribution = (currentPct * currentWeightBasis) / 100;
  const totalProjected = Math.min(100, Math.max(0, currentContribution + simulatedAddedWeightValue));

  const getLetterGrade = (pct: number) => {
    if (pct >= 93) return 'A';
    if (pct >= 90) return 'A-';
    if (pct >= 87) return 'B+';
    if (pct >= 83) return 'B';
    if (pct >= 80) return 'B-';
    if (pct >= 77) return 'C+';
    if (pct >= 70) return 'C';
    if (pct >= 60) return 'D';
    return 'F';
  };

  const projectedLetter = getLetterGrade(totalProjected);
  const delta = totalProjected - currentPct;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Gradebook "What-If" Simulator</h3>
              <p className="text-xs text-slate-400">{course.code} &bull; {course.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Projection Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800">
          <div className="grid grid-cols-3 gap-4 text-center items-center">
            {/* Current Grade */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Current</span>
              <div className="text-xl font-extrabold text-slate-200 mt-0.5">
                {currentPct.toFixed(1)}%
              </div>
              <span className="text-xs font-semibold text-slate-400">({currentGrade.letterGrade})</span>
            </div>

            {/* Transition Arrow */}
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center space-x-1 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{delta >= 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`}</span>
              </div>
              <ArrowRight className="w-5 h-5 text-indigo-400" />
            </div>

            {/* Projected Grade */}
            <div className="bg-indigo-950/80 p-3 rounded-xl border border-indigo-500/40 shadow-lg shadow-indigo-500/10">
              <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider block">Projected</span>
              <div className="text-2xl font-black text-indigo-200 mt-0.5">
                {totalProjected.toFixed(1)}%
              </div>
              <span className="text-xs font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full">
                Grade: {projectedLetter}
              </span>
            </div>
          </div>
        </div>

        {/* Sliders for remaining tasks */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Adjust Target Scores on Upcoming Tasks
            </h4>
            <span className="text-xs text-slate-400">
              Remaining Syllabus Weight: {remainingWeightSum}%
            </span>
          </div>

          {upcomingAssignments.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-4">
              All coursework for this term is currently completed.
            </p>
          ) : (
            upcomingAssignments.map((asg) => {
              const score = simulatedScores[asg.id] ?? 85;
              return (
                <div key={asg.id} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-white block">{asg.title}</span>
                      <span className="text-xs text-slate-400">
                        {asg.type} &bull; Weight: <strong className="text-indigo-300">{asg.weightPercentage}%</strong> &bull; {asg.pointsPossible} pts
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold text-indigo-300">{score}%</span>
                      <span className="text-xs text-slate-400 block">{Math.round((score / 100) * asg.pointsPossible)} / {asg.pointsPossible} pts</span>
                    </div>
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min="40"
                    max="100"
                    step="1"
                    value={score}
                    onChange={(e) => handleSliderChange(asg.id, Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>40% (Fail)</span>
                    <span>70% (Pass)</span>
                    <span>85% (Target)</span>
                    <span>100% (Perfect)</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Simulations update automatically and do not alter official gradebook records.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
