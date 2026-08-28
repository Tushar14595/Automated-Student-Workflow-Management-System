import {
  Student,
  Course,
  StudentCourseGrade,
  Assignment,
  StudentAssignmentRecord,
  WorkflowRule,
  ReminderLog,
  LMSIntegrationConfig,
  ExecutionResult,
  ReminderChannel,
} from '../src/types.js';
import {
  initialStudents,
  initialCourses,
  initialStudentGrades,
  initialAssignments,
  initialStudentAssignments,
  initialWorkflowRules,
  initialReminderLogs,
  initialLMSIntegrations,
} from './mockData.js';
import { generatePersonalizedReminder } from './gemini.js';

// In-memory data store with live state mutation
export class Store {
  public students: Student[] = [...initialStudents];
  public courses: Course[] = [...initialCourses];
  public studentGrades: StudentCourseGrade[] = [...initialStudentGrades];
  public assignments: Assignment[] = [...initialAssignments];
  public studentAssignments: StudentAssignmentRecord[] = [...initialStudentAssignments];
  public workflowRules: WorkflowRule[] = [...initialWorkflowRules];
  public reminderLogs: ReminderLog[] = [...initialReminderLogs];
  public lmsIntegrations: LMSIntegrationConfig[] = [...initialLMSIntegrations];

  // Helper getters
  public getStudent(id: string) {
    return this.students.find((s) => s.id === id);
  }

  public getCourse(id: string) {
    return this.courses.find((c) => c.id === id);
  }

  public getAssignment(id: string) {
    return this.assignments.find((a) => a.id === id);
  }

  public getGradesForStudent(studentId: string) {
    return this.studentGrades.filter((g) => g.studentId === studentId);
  }

  public getAssignmentsForStudent(studentId: string) {
    return this.studentAssignments
      .filter((sa) => sa.studentId === studentId)
      .map((sa) => {
        const assignment = this.getAssignment(sa.assignmentId);
        const course = assignment ? this.getCourse(assignment.courseId) : undefined;
        return {
          ...sa,
          assignment,
          course,
        };
      });
  }

  public updateStudentStats(studentId: string) {
    const student = this.getStudent(studentId);
    if (!student) return;

    const records = this.studentAssignments.filter((sa) => sa.studentId === studentId);
    const completed = records.filter((r) => r.status === 'COMPLETED').length;
    const missing = records.filter((r) => r.status === 'MISSING').length;
    const pending = records.filter((r) => r.status === 'PENDING').length;
    const resolved = this.reminderLogs.filter(
      (rl) => rl.studentId === studentId && (rl.status === 'ACTION_TAKEN' || rl.status === 'OPENED')
    ).length;

    student.stats = {
      completedTasks: completed,
      pendingTasks: pending,
      missingTasks: missing,
      resolvedReminders: resolved,
    };

    // Calculate dynamic risk level based on grades and missing assignments
    const grades = this.getGradesForStudent(studentId);
    const avgGrade = grades.length > 0
      ? grades.reduce((sum, g) => sum + g.currentPercentage, 0) / grades.length
      : 85;

    if (missing >= 3 || avgGrade < 65) {
      student.riskLevel = 'CRITICAL';
    } else if (missing >= 1 || avgGrade < 75) {
      student.riskLevel = 'AT_RISK';
    } else {
      student.riskLevel = 'ON_TRACK';
    }
  }
}

export const db = new Store();

// Core Automated Evaluation Engine
export async function executeAutomationEngine(specificRuleId?: string): Promise<ExecutionResult> {
  const rulesToEvaluate = specificRuleId
    ? db.workflowRules.filter((r) => r.id === specificRuleId && r.enabled)
    : db.workflowRules.filter((r) => r.enabled);

  const now = new Date('2026-08-28T09:40:00Z'); // normalized simulation anchor or new Date()
  const result: ExecutionResult = {
    triggeredRulesCount: 0,
    dispatchedRemindersCount: 0,
    studentsEvaluatedCount: db.students.length,
    details: [],
    timestamp: new Date().toISOString(),
  };

  for (const rule of rulesToEvaluate) {
    let ruleFiredForAnyStudent = false;

    for (const student of db.students) {
      // Find candidate triggers
      switch (rule.triggerType) {
        case 'MISSING_ASSIGNMENT': {
          const missingRecords = db.studentAssignments.filter(
            (sa) => sa.studentId === student.id && sa.status === 'MISSING'
          );

          for (const rec of missingRecords) {
            const assignment = db.getAssignment(rec.assignmentId);
            const course = assignment ? db.getCourse(assignment.courseId) : undefined;
            if (!assignment || !course) continue;

            if (rule.conditions.courseId && rule.conditions.courseId !== course.id) {
              continue;
            }

            // Cooldown check: has this rule fired for this student & assignment within rule.cooldownHours?
            const recentLog = db.reminderLogs.find((l) => {
              if (l.ruleId !== rule.id || l.studentId !== student.id || l.assignmentId !== assignment.id) return false;
              const logTime = new Date(l.createdAt).getTime();
              const hoursAgo = (now.getTime() - logTime) / (1000 * 60 * 60);
              return hoursAgo < rule.cooldownHours;
            });

            if (recentLog) continue; // within cooldown

            // Generate reminder
            const studentGrade = db.studentGrades.find(
              (g) => g.studentId === student.id && g.courseId === course.id
            )?.currentPercentage || 70;

            let reminderContent: { subject: string; body: string; aiInsights: string };
            if (rule.actions.useAIPersonalization) {
              reminderContent = await generatePersonalizedReminder({
                studentName: student.name,
                courseCode: course.code,
                courseTitle: course.title,
                assignmentTitle: assignment.title,
                assignmentType: assignment.type,
                dueDate: assignment.dueDate,
                weightPercentage: assignment.weightPercentage,
                currentGrade: studentGrade,
                triggerReason: `Missing assignment overdue since ${assignment.dueDate}`,
                urgencyLevel: rule.actions.urgencyLevel,
              });
            } else {
              reminderContent = {
                subject: rule.actions.templateSubject
                  .replace('{{courseCode}}', course.code)
                  .replace('{{studentName}}', student.name)
                  .replace('{{assignmentTitle}}', assignment.title),
                body: rule.actions.templateBody
                  .replace('{{courseCode}}', course.code)
                  .replace('{{studentName}}', student.name)
                  .replace('{{assignmentTitle}}', assignment.title)
                  .replace('{{instructorName}}', course.instructor),
                aiInsights: `Calculated late submission value: up to 80% credit available.`,
              };
            }

            for (const channel of rule.actions.channels) {
              const log: ReminderLog = {
                id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                ruleId: rule.id,
                ruleName: rule.name,
                studentId: student.id,
                studentName: student.name,
                studentEmail: student.email,
                studentPhone: student.phone,
                courseId: course.id,
                courseCode: course.code,
                assignmentId: assignment.id,
                assignmentTitle: assignment.title,
                triggerType: rule.triggerType,
                channel,
                urgencyLevel: rule.actions.urgencyLevel,
                subject: reminderContent.subject,
                body: reminderContent.body,
                aiInsights: reminderContent.aiInsights,
                createdAt: new Date().toISOString(),
                status: 'DELIVERED',
              };

              db.reminderLogs.unshift(log);
              result.dispatchedRemindersCount++;
              result.details.push({
                ruleName: rule.name,
                studentName: student.name,
                courseCode: course.code,
                reason: `Missing assignment "${assignment.title}"`,
                channel,
              });
            }

            rec.reminderSentCount++;
            rec.lastReminderSentAt = new Date().toISOString();
            ruleFiredForAnyStudent = true;
          }
          break;
        }

        case 'GRADE_BELOW_THRESHOLD': {
          const threshold = rule.conditions.gradeThresholdPercentage || 70;
          const lowGrades = db.studentGrades.filter(
            (g) => g.studentId === student.id && g.currentPercentage < threshold
          );

          for (const sg of lowGrades) {
            const course = db.getCourse(sg.courseId);
            if (!course) continue;
            if (rule.conditions.courseId && rule.conditions.courseId !== course.id) continue;

            const recentLog = db.reminderLogs.find((l) => {
              if (l.ruleId !== rule.id || l.studentId !== student.id || l.courseId !== course.id) return false;
              const logTime = new Date(l.createdAt).getTime();
              const hoursAgo = (now.getTime() - logTime) / (1000 * 60 * 60);
              return hoursAgo < rule.cooldownHours;
            });

            if (recentLog) continue;

            for (const channel of rule.actions.channels) {
              const log: ReminderLog = {
                id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                ruleId: rule.id,
                ruleName: rule.name,
                studentId: student.id,
                studentName: student.name,
                studentEmail: student.email,
                studentPhone: student.phone,
                courseId: course.id,
                courseCode: course.code,
                triggerType: rule.triggerType,
                channel,
                urgencyLevel: rule.actions.urgencyLevel,
                subject: `🚨 Academic Support: ${course.code} Grade Alert (${sg.currentPercentage.toFixed(1)}%)`,
                body: `Hello ${student.name},\n\nYour current average in ${course.code} (${course.title}) has fallen below ${threshold}% to ${sg.currentPercentage.toFixed(1)}% (${sg.letterGrade}). We strongly encourage you to schedule an academic counseling session with ${student.advisorName} (${student.advisorEmail}) or visit ${course.instructor}'s office hours.`,
                aiInsights: `Course grade is ${sg.currentPercentage.toFixed(1)}%. Completing upcoming assessments with score >= 80% will restore standing.`,
                createdAt: new Date().toISOString(),
                status: 'DELIVERED',
              };

              db.reminderLogs.unshift(log);
              result.dispatchedRemindersCount++;
              result.details.push({
                ruleName: rule.name,
                studentName: student.name,
                courseCode: course.code,
                reason: `Grade ${sg.currentPercentage.toFixed(1)}% < ${threshold}% threshold`,
                channel,
              });
            }

            ruleFiredForAnyStudent = true;
          }
          break;
        }

        case 'HIGH_WEIGHT_ASSESSMENT': {
          const minWeight = rule.conditions.minWeightPercentage || 20;
          const leadHours = rule.conditions.deadlineHoursBefore || 48;

          const pendingRecords = db.studentAssignments.filter(
            (sa) => sa.studentId === student.id && sa.status === 'PENDING'
          );

          for (const rec of pendingRecords) {
            const assignment = db.getAssignment(rec.assignmentId);
            const course = assignment ? db.getCourse(assignment.courseId) : undefined;
            if (!assignment || !course) continue;

            if (assignment.weightPercentage < minWeight) continue;

            const dueTime = new Date(assignment.dueDate).getTime();
            const hoursUntilDue = (dueTime - now.getTime()) / (1000 * 60 * 60);

            if (hoursUntilDue < 0 || hoursUntilDue > leadHours) continue;

            const recentLog = db.reminderLogs.find((l) => {
              if (l.ruleId !== rule.id || l.studentId !== student.id || l.assignmentId !== assignment.id) return false;
              const logTime = new Date(l.createdAt).getTime();
              const hoursAgo = (now.getTime() - logTime) / (1000 * 60 * 60);
              return hoursAgo < rule.cooldownHours;
            });

            if (recentLog) continue;

            const studentGrade = db.studentGrades.find(
              (g) => g.studentId === student.id && g.courseId === course.id
            )?.currentPercentage || 80;

            for (const channel of rule.actions.channels) {
              const log: ReminderLog = {
                id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                ruleId: rule.id,
                ruleName: rule.name,
                studentId: student.id,
                studentName: student.name,
                studentEmail: student.email,
                studentPhone: student.phone,
                courseId: course.id,
                courseCode: course.code,
                assignmentId: assignment.id,
                assignmentTitle: assignment.title,
                triggerType: rule.triggerType,
                channel,
                urgencyLevel: rule.actions.urgencyLevel,
                subject: `🎯 High-Impact Task: ${assignment.title} in ${course.code} (Worth ${assignment.weightPercentage}%)`,
                body: `Hi ${student.name},\n\nYour ${assignment.type.toLowerCase().replace('_', ' ')} "${assignment.title}" in ${course.code} is coming up in approximately ${Math.round(hoursUntilDue)} hours. Because this item carries ${assignment.weightPercentage}% of your total semester grade, we recommend beginning your final review sprint today.`,
                aiInsights: `Heavyweight assessment (${assignment.weightPercentage}%). Scoring 85%+ can lift overall GPA by up to 0.15 points.`,
                createdAt: new Date().toISOString(),
                status: 'DELIVERED',
              };

              db.reminderLogs.unshift(log);
              result.dispatchedRemindersCount++;
              result.details.push({
                ruleName: rule.name,
                studentName: student.name,
                courseCode: course.code,
                reason: `Upcoming ${assignment.weightPercentage}% exam due in ${Math.round(hoursUntilDue)}h`,
                channel,
              });
            }

            rec.reminderSentCount++;
            ruleFiredForAnyStudent = true;
          }
          break;
        }

        case 'UPCOMING_DEADLINE': {
          const leadHours = rule.conditions.deadlineHoursBefore || 24;
          const pendingRecords = db.studentAssignments.filter(
            (sa) => sa.studentId === student.id && sa.status === 'PENDING'
          );

          for (const rec of pendingRecords) {
            const assignment = db.getAssignment(rec.assignmentId);
            const course = assignment ? db.getCourse(assignment.courseId) : undefined;
            if (!assignment || !course) continue;

            const dueTime = new Date(assignment.dueDate).getTime();
            const hoursUntilDue = (dueTime - now.getTime()) / (1000 * 60 * 60);

            if (hoursUntilDue < 0 || hoursUntilDue > leadHours) continue;

            const recentLog = db.reminderLogs.find((l) => {
              if (l.ruleId !== rule.id || l.studentId !== student.id || l.assignmentId !== assignment.id) return false;
              const logTime = new Date(l.createdAt).getTime();
              const hoursAgo = (now.getTime() - logTime) / (1000 * 60 * 60);
              return hoursAgo < rule.cooldownHours;
            });

            if (recentLog) continue;

            for (const channel of rule.actions.channels) {
              const log: ReminderLog = {
                id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                ruleId: rule.id,
                ruleName: rule.name,
                studentId: student.id,
                studentName: student.name,
                studentEmail: student.email,
                studentPhone: student.phone,
                courseId: course.id,
                courseCode: course.code,
                assignmentId: assignment.id,
                assignmentTitle: assignment.title,
                triggerType: rule.triggerType,
                channel,
                urgencyLevel: rule.actions.urgencyLevel,
                subject: `⏰ 24h Countdown: ${assignment.title} (${course.code})`,
                body: `Hi ${student.name},\n\nQuick reminder that "${assignment.title}" for ${course.code} is due in ${Math.round(hoursUntilDue)} hours. Est. time to complete: ${assignment.estimatedMinutes} minutes. Link: ${assignment.submissionLink || 'LMS portal'}`,
                createdAt: new Date().toISOString(),
                status: 'DELIVERED',
              };

              db.reminderLogs.unshift(log);
              result.dispatchedRemindersCount++;
              result.details.push({
                ruleName: rule.name,
                studentName: student.name,
                courseCode: course.code,
                reason: `Assignment due within ${Math.round(hoursUntilDue)} hours`,
                channel,
              });
            }

            rec.reminderSentCount++;
            ruleFiredForAnyStudent = true;
          }
          break;
        }

        case 'PREREQUISITE_INCOMPLETE': {
          const pendingRecords = db.studentAssignments.filter(
            (sa) => sa.studentId === student.id && sa.status === 'PENDING'
          );

          for (const rec of pendingRecords) {
            const assignment = db.getAssignment(rec.assignmentId);
            if (!assignment || !assignment.prerequisiteId) continue;
            const course = db.getCourse(assignment.courseId);
            if (!course) continue;

            const prereqRec = db.studentAssignments.find(
              (sa) => sa.studentId === student.id && sa.assignmentId === assignment.prerequisiteId
            );
            const prereqAssignment = db.getAssignment(assignment.prerequisiteId);

            if (prereqRec && prereqRec.status !== 'COMPLETED') {
              const recentLog = db.reminderLogs.find((l) => {
                if (l.ruleId !== rule.id || l.studentId !== student.id || l.assignmentId !== assignment.id) return false;
                const logTime = new Date(l.createdAt).getTime();
                const hoursAgo = (now.getTime() - logTime) / (1000 * 60 * 60);
                return hoursAgo < rule.cooldownHours;
              });

              if (recentLog) continue;

              for (const channel of rule.actions.channels) {
                const log: ReminderLog = {
                  id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                  ruleId: rule.id,
                  ruleName: rule.name,
                  studentId: student.id,
                  studentName: student.name,
                  studentEmail: student.email,
                  studentPhone: student.phone,
                  courseId: course.id,
                  courseCode: course.code,
                  assignmentId: assignment.id,
                  assignmentTitle: assignment.title,
                  triggerType: rule.triggerType,
                  channel,
                  urgencyLevel: rule.actions.urgencyLevel,
                  subject: `🔗 Prerequisite Blocker: ${assignment.title} (${course.code})`,
                  body: `Hi ${student.name}, to successfully complete "${assignment.title}", please finish prerequisite "${prereqAssignment?.title || 'Prior Task'}" first to stay on track.`,
                  aiInsights: `Sequential learning dependency flagged. Completing prerequisite ensures foundation for subsequent work.`,
                  createdAt: new Date().toISOString(),
                  status: 'DELIVERED',
                };

                db.reminderLogs.unshift(log);
                result.dispatchedRemindersCount++;
                result.details.push({
                  ruleName: rule.name,
                  studentName: student.name,
                  courseCode: course.code,
                  reason: `Prerequisite "${prereqAssignment?.title}" not finished`,
                  channel,
                });
              }

              ruleFiredForAnyStudent = true;
            }
          }
          break;
        }

        case 'GRADE_IMPROVEMENT': {
          const highGrades = db.studentGrades.filter(
            (g) => g.studentId === student.id && g.currentPercentage >= (rule.conditions.gradeThresholdPercentage || 90)
          );

          for (const sg of highGrades) {
            const course = db.getCourse(sg.courseId);
            if (!course) continue;

            const recentLog = db.reminderLogs.find((l) => {
              if (l.ruleId !== rule.id || l.studentId !== student.id || l.courseId !== course.id) return false;
              const logTime = new Date(l.createdAt).getTime();
              const hoursAgo = (now.getTime() - logTime) / (1000 * 60 * 60);
              return hoursAgo < rule.cooldownHours;
            });

            if (recentLog) continue;

            for (const channel of rule.actions.channels) {
              const log: ReminderLog = {
                id: `rem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                ruleId: rule.id,
                ruleName: rule.name,
                studentId: student.id,
                studentName: student.name,
                studentEmail: student.email,
                studentPhone: student.phone,
                courseId: course.id,
                courseCode: course.code,
                triggerType: rule.triggerType,
                channel,
                urgencyLevel: rule.actions.urgencyLevel,
                subject: `🎉 Commendation: Outstanding Performance in ${course.code}`,
                body: `Congratulations ${student.name}! Your grade in ${course.code} is currently ${sg.currentPercentage.toFixed(1)}% (${sg.letterGrade}). Keep up the exemplary effort!`,
                createdAt: new Date().toISOString(),
                status: 'DELIVERED',
              };

              db.reminderLogs.unshift(log);
              result.dispatchedRemindersCount++;
              result.details.push({
                ruleName: rule.name,
                studentName: student.name,
                courseCode: course.code,
                reason: `Grade ${sg.currentPercentage.toFixed(1)}% in high performance bracket`,
                channel,
              });
            }

            ruleFiredForAnyStudent = true;
          }
          break;
        }
      }

      // Update student stats after potential triggers
      db.updateStudentStats(student.id);
    }

    if (ruleFiredForAnyStudent) {
      rule.timesTriggered++;
      rule.lastTriggeredAt = new Date().toISOString();
      result.triggeredRulesCount++;
    }
  }

  return result;
}
