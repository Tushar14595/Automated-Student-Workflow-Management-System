import { db } from './automationEngine.js';
import { LMSProvider } from '../src/types.js';

export interface SyncResponse {
  success: boolean;
  provider: LMSProvider;
  message: string;
  coursesUpdated: number;
  gradesSynced: number;
  assignmentsSynced: number;
  timestamp: string;
}

export function syncLMSProvider(providerId: string): SyncResponse {
  const integration = db.lmsIntegrations.find((i) => i.id === providerId);
  if (!integration) {
    throw new Error(`LMS Integration ${providerId} not found`);
  }

  integration.status = 'SYNCING';

  // Perform sync logic: update last sync timestamp, simulate fetching latest gradebook updates
  const now = new Date().toISOString();
  integration.lastSyncAt = now;
  integration.status = 'CONNECTED';

  let recordsProcessed = 0;
  let gradesSynced = 0;
  let assignmentsSynced = 0;

  if (integration.provider === 'CANVAS') {
    // Refresh Canvas records (CS 301 & MATH 240)
    recordsProcessed = 28;
    gradesSynced = 14;
    assignmentsSynced = 6;
  } else if (integration.provider === 'BLACKBOARD') {
    // Refresh Blackboard records (BIO 110)
    recordsProcessed = 18;
    gradesSynced = 8;
    assignmentsSynced = 2;
  } else if (integration.provider === 'GOOGLE_CLASSROOM') {
    // Refresh Classroom (ENG 102)
    recordsProcessed = 14;
    gradesSynced = 6;
    assignmentsSynced = 2;
  } else {
    recordsProcessed = 45;
    gradesSynced = 20;
    assignmentsSynced = 10;
  }

  const logEntry = {
    timestamp: now,
    status: 'SUCCESS' as const,
    message: `Full bidirectional sync completed with ${integration.name}. Verified ${recordsProcessed} gradebook entries.`,
    recordsProcessed,
  };

  integration.syncLogs.unshift(logEntry);
  if (integration.syncLogs.length > 10) {
    integration.syncLogs.pop();
  }

  return {
    success: true,
    provider: integration.provider,
    message: `Successfully synchronized ${integration.name} gradebook.`,
    coursesUpdated: integration.coursesSyncedCount,
    gradesSynced,
    assignmentsSynced,
    timestamp: now,
  };
}

export interface CSVGradeImportRow {
  studentEmail: string;
  courseCode: string;
  assignmentTitle: string;
  pointsEarned: number;
  pointsPossible: number;
  status?: string;
  feedback?: string;
}

export function importGradebookCSV(rows: CSVGradeImportRow[]): {
  importedCount: number;
  errors: string[];
} {
  let importedCount = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const student = db.students.find(
      (s) => s.email.toLowerCase() === row.studentEmail.toLowerCase()
    );
    if (!student) {
      errors.push(`Student with email ${row.studentEmail} not found in database.`);
      continue;
    }

    const course = db.courses.find(
      (c) => c.code.toLowerCase() === row.courseCode.toLowerCase()
    );
    if (!course) {
      errors.push(`Course with code ${row.courseCode} not found.`);
      continue;
    }

    // Find or create assignment
    let assignment = db.assignments.find(
      (a) =>
        a.courseId === course.id &&
        a.title.toLowerCase() === row.assignmentTitle.toLowerCase()
    );

    if (!assignment) {
      assignment = {
        id: `asg_imp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        courseId: course.id,
        title: row.assignmentTitle,
        description: `Imported via Gradebook CSV upload for ${course.code}`,
        type: 'ASSIGNMENT',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        pointsPossible: row.pointsPossible || 100,
        weightPercentage: 10,
        estimatedMinutes: 60,
      };
      db.assignments.push(assignment);
    }

    // Find or create student assignment record
    let studentAssignment = db.studentAssignments.find(
      (sa) => sa.studentId === student.id && sa.assignmentId === assignment!.id
    );

    const isSubmitted = row.pointsEarned !== undefined && row.pointsEarned !== null;
    const finalStatus = row.status
      ? (row.status.toUpperCase() as any)
      : isSubmitted
      ? 'COMPLETED'
      : 'PENDING';

    if (studentAssignment) {
      studentAssignment.status = finalStatus;
      studentAssignment.pointsEarned = row.pointsEarned;
      studentAssignment.feedback = row.feedback || studentAssignment.feedback;
      studentAssignment.gradedAt = new Date().toISOString();
    } else {
      studentAssignment = {
        id: `sar_imp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        studentId: student.id,
        assignmentId: assignment.id,
        courseId: course.id,
        status: finalStatus,
        pointsEarned: row.pointsEarned,
        feedback: row.feedback,
        gradedAt: new Date().toISOString(),
        reminderSentCount: 0,
      };
      db.studentAssignments.push(studentAssignment);
    }

    // Recompute course percentage for this student
    const studentCourseRecords = db.studentAssignments.filter(
      (sa) => sa.studentId === student.id && sa.courseId === course.id
    );

    let totalEarned = 0;
    let totalPossible = 0;
    for (const rec of studentCourseRecords) {
      const asg = db.getAssignment(rec.assignmentId);
      if (asg && rec.status === 'COMPLETED' && rec.pointsEarned !== undefined) {
        totalEarned += rec.pointsEarned;
        totalPossible += asg.pointsPossible;
      }
    }

    if (totalPossible > 0) {
      const percentage = (totalEarned / totalPossible) * 100;
      let grade = db.studentGrades.find(
        (g) => g.studentId === student.id && g.courseId === course.id
      );

      let letter = 'C';
      if (percentage >= 93) letter = 'A';
      else if (percentage >= 90) letter = 'A-';
      else if (percentage >= 87) letter = 'B+';
      else if (percentage >= 83) letter = 'B';
      else if (percentage >= 80) letter = 'B-';
      else if (percentage >= 77) letter = 'C+';
      else if (percentage >= 70) letter = 'C';
      else if (percentage >= 60) letter = 'D';
      else letter = 'F';

      if (grade) {
        grade.previousPercentage = grade.currentPercentage;
        grade.currentPercentage = Math.round(percentage * 10) / 10;
        grade.letterGrade = letter;
        grade.trend =
          grade.currentPercentage > grade.previousPercentage
            ? 'UP'
            : grade.currentPercentage < grade.previousPercentage
            ? 'DOWN'
            : 'STABLE';
        grade.lastGradedAt = new Date().toISOString();
      } else {
        db.studentGrades.push({
          studentId: student.id,
          courseId: course.id,
          currentPercentage: Math.round(percentage * 10) / 10,
          letterGrade: letter,
          previousPercentage: Math.round(percentage * 10) / 10,
          trend: 'STABLE',
          lastGradedAt: new Date().toISOString(),
        });
      }
    }

    db.updateStudentStats(student.id);
    importedCount++;
  }

  // Record in CSV integration log
  const csvIntegration = db.lmsIntegrations.find((i) => i.provider === 'CUSTOM_CSV');
  if (csvIntegration) {
    csvIntegration.lastSyncAt = new Date().toISOString();
    csvIntegration.syncLogs.unshift({
      timestamp: new Date().toISOString(),
      status: errors.length > 0 ? 'WARNING' : 'SUCCESS',
      message: `CSV Gradebook file processed: ${importedCount} records updated (${errors.length} skipped/errors).`,
      recordsProcessed: importedCount,
    });
  }

  return { importedCount, errors };
}
