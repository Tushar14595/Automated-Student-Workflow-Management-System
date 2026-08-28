export type RiskLevel = 'ON_TRACK' | 'AT_RISK' | 'CRITICAL';

export type AssignmentStatus = 'COMPLETED' | 'PENDING' | 'MISSING' | 'SUBMITTED_LATE' | 'AT_RISK';

export type AssessmentType = 'ASSIGNMENT' | 'QUIZ' | 'MIDTERM' | 'FINAL_EXAM' | 'PROJECT' | 'LAB' | 'DISCUSSION';

export type TriggerType =
  | 'MISSING_ASSIGNMENT'
  | 'GRADE_BELOW_THRESHOLD'
  | 'UPCOMING_DEADLINE'
  | 'HIGH_WEIGHT_ASSESSMENT'
  | 'PREREQUISITE_INCOMPLETE'
  | 'GRADE_IMPROVEMENT';

export type ReminderChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'DISCORD_WEBHOOK' | 'IN_APP';

export type ReminderStatus = 'QUEUED' | 'DELIVERED' | 'OPENED' | 'ACTION_TAKEN' | 'FAILED';

export type LMSProvider = 'CANVAS' | 'BLACKBOARD' | 'GOOGLE_CLASSROOM' | 'BRIGHTSPACE' | 'MOODLE' | 'CUSTOM_CSV';

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  major: string;
  year: 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Graduate';
  gpa: number;
  riskLevel: RiskLevel;
  advisorName: string;
  advisorEmail: string;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
    webhookUrl?: string;
  };
  stats: {
    completedTasks: number;
    pendingTasks: number;
    missingTasks: number;
    resolvedReminders: number;
  };
}

export interface Course {
  id: string;
  code: string;
  title: string;
  term: string;
  instructor: string;
  instructorEmail: string;
  credits: number;
  color: string;
  schedule: string;
  lmsSource: LMSProvider;
  weights: {
    homework: number;
    quizzes: number;
    exams: number;
    projects: number;
    participation: number;
  };
}

export interface StudentCourseGrade {
  studentId: string;
  courseId: string;
  currentPercentage: number;
  letterGrade: string;
  previousPercentage: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  lastGradedAt: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  type: AssessmentType;
  dueDate: string;
  pointsPossible: number;
  weightPercentage: number;
  prerequisiteId?: string;
  estimatedMinutes: number;
  submissionLink?: string;
}

export interface StudentAssignmentRecord {
  id: string;
  studentId: string;
  assignmentId: string;
  courseId: string;
  status: AssignmentStatus;
  pointsEarned?: number;
  submittedAt?: string;
  gradedAt?: string;
  feedback?: string;
  reminderSentCount: number;
  lastReminderSentAt?: string;
}

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggerType: TriggerType;
  conditions: {
    courseId?: string; // specific course or all
    gradeThresholdPercentage?: number; // e.g., < 75%
    deadlineHoursBefore?: number; // e.g. 24, 48, 72 hours before due
    minWeightPercentage?: number; // e.g. weight >= 15%
    requirePrerequisite?: boolean;
  };
  actions: {
    channels: ReminderChannel[];
    urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    templateSubject: string;
    templateBody: string;
    useAIPersonalization: boolean;
    alertAdvisor: boolean;
    suggestStudyPlan: boolean;
  };
  cooldownHours: number;
  lastTriggeredAt?: string;
  timesTriggered: number;
  resolvedActionsCount: number;
}

export interface ReminderLog {
  id: string;
  ruleId: string;
  ruleName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  courseId: string;
  courseCode: string;
  assignmentId?: string;
  assignmentTitle?: string;
  triggerType: TriggerType;
  channel: ReminderChannel;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  subject: string;
  body: string;
  aiInsights?: string;
  createdAt: string;
  status: ReminderStatus;
  openedAt?: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface LMSIntegrationConfig {
  id: string;
  provider: LMSProvider;
  name: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING' | 'ERROR';
  apiUrl: string;
  apiKeyMasked: string;
  coursesSyncedCount: number;
  studentsSyncedCount: number;
  lastSyncAt: string;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
  syncLogs: {
    timestamp: string;
    status: 'SUCCESS' | 'WARNING' | 'ERROR';
    message: string;
    recordsProcessed: number;
  }[];
}

export interface ExecutionResult {
  triggeredRulesCount: number;
  dispatchedRemindersCount: number;
  studentsEvaluatedCount: number;
  details: {
    ruleName: string;
    studentName: string;
    courseCode: string;
    reason: string;
    channel: string;
  }[];
  timestamp: string;
}
