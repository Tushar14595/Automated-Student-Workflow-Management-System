import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    return aiClient;
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI client:', err);
    return null;
  }
}

export interface PersonalizedReminderPrompt {
  studentName: string;
  courseCode: string;
  courseTitle: string;
  assignmentTitle: string;
  assignmentType: string;
  dueDate: string;
  weightPercentage: number;
  currentGrade: number;
  triggerReason: string;
  urgencyLevel: string;
  tone?: 'SUPPORTIVE_COACH' | 'URGENT_ACTION' | 'SOCRATIC_STRATEGIC' | 'FORMAL_ADVISORY';
}

export async function generatePersonalizedReminder(params: PersonalizedReminderPrompt): Promise<{
  subject: string;
  body: string;
  aiInsights: string;
  actionChecklist: string[];
}> {
  const ai = getAIClient();

  if (!ai) {
    // High-quality deterministic fallback if no API key
    const isUrgent = params.urgencyLevel === 'URGENT' || params.urgencyLevel === 'HIGH';
    const lateCreditNote = params.triggerReason.includes('MISSING')
      ? ' Late submissions are accepted with reduced deduction if turned in within 48h.'
      : '';

    return {
      subject: `${isUrgent ? '⚠️ Action Needed: ' : '📋 Reminder: '} ${params.courseCode} - ${params.assignmentTitle}`,
      body: `Hi ${params.studentName},\n\nThis is an automated workflow notification regarding your ${params.courseCode} (${params.courseTitle}) course. "${params.assignmentTitle}" (${params.assignmentType}, weight: ${params.weightPercentage}%) is due on ${new Date(params.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}.${lateCreditNote}\n\nYour current grade in this course is ${params.currentGrade.toFixed(1)}%. Keeping up with this task is vital for maintaining your target academic standing. Please reach out to your instructor or course TAs if you need help.`,
      aiInsights: `Target task (${params.assignmentTitle}) carries a ${params.weightPercentage}% weight. Submitting this on time stabilizes course standing above ${Math.max(params.currentGrade, 75)}%.`,
      actionChecklist: [
        `Review the assignment prompt and rubric requirements for ${params.assignmentTitle}`,
        `Draft solution framework or outline`,
        `Run self-assessment or test cases before final submission`,
        `Submit before deadline to avoid late penalty deductions`,
      ],
    };
  }

  try {
    const prompt = `You are an intelligent university academic workflow advisor and automated student success assistant.
Generate an automated, personalized task reminder for a student based on their gradebook status:

Student Name: ${params.studentName}
Course: ${params.courseCode} - ${params.courseTitle}
Target Task: ${params.assignmentTitle} (${params.assignmentType})
Due Date: ${params.dueDate}
Weight in Course: ${params.weightPercentage}%
Student Current Grade: ${params.currentGrade}%
Trigger Reason: ${params.triggerReason}
Urgency Level: ${params.urgencyLevel}
Desired Tone: ${params.tone || 'SUPPORTIVE_COACH'}

Respond in valid JSON with:
- "subject": Engaging, clear email/message subject line with suitable status emoji
- "body": 2-3 paragraph personalized message explaining what is due, why it matters for their current grade trajectory, and concrete next steps.
- "aiInsights": 1-2 sentence analytical summary of the academic impact.
- "actionChecklist": Array of 3-4 concise, highly actionable micro-steps the student can check off.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    return {
      subject: parsed.subject || `Reminder: ${params.courseCode} ${params.assignmentTitle}`,
      body: parsed.body || `Hi ${params.studentName}, here is a reminder for ${params.assignmentTitle}.`,
      aiInsights: parsed.aiInsights || `Weight: ${params.weightPercentage}% of course grade.`,
      actionChecklist: Array.isArray(parsed.actionChecklist) ? parsed.actionChecklist : ['Review prompt', 'Complete draft', 'Submit'],
    };
  } catch (error) {
    console.error('Gemini API generation error:', error);
    return {
      subject: `[Automated] ${params.courseCode}: ${params.assignmentTitle}`,
      body: `Hi ${params.studentName},\n\nReminder regarding ${params.assignmentTitle} for ${params.courseCode}. Current course standing: ${params.currentGrade}%. Due date: ${params.dueDate}.`,
      aiInsights: `Calculated ${params.weightPercentage}% grade weight impact.`,
      actionChecklist: ['Review assignment guidelines', 'Work on draft', 'Submit through LMS portal'],
    };
  }
}

export async function generateStudentRemediationPlan(params: {
  studentName: string;
  major: string;
  gpa: number;
  coursesWithGrades: { code: string; title: string; grade: number; letter: string }[];
  missingAssignments: { course: string; title: string; weight: number; dueDate: string }[];
  upcomingDeadlines: { course: string; title: string; weight: number; dueDate: string }[];
}): Promise<{
  overallDiagnosis: string;
  riskRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priorityFocusAreas: string[];
  threeDayActionSprint: { day: string; tasks: string[]; targetMinutes: number }[];
  estimatedGpaImprovement: string;
}> {
  const ai = getAIClient();

  if (!ai) {
    const isHighRisk = params.missingAssignments.length > 1 || params.coursesWithGrades.some((c) => c.grade < 70);
    return {
      overallDiagnosis: `${params.studentName} has ${params.missingAssignments.length} overdue task(s) impacting course trajectories in ${params.coursesWithGrades.map((c) => c.code).join(', ')}. Addressing high-weight items can rapidly recover course standing.`,
      riskRating: isHighRisk ? 'HIGH' : 'MEDIUM',
      priorityFocusAreas: [
        `Submit overdue assignments for partial credit (${params.missingAssignments.map((m) => m.title).slice(0, 2).join(', ')})`,
        `Prepare 48h in advance for upcoming exams with weight >= 20%`,
        `Schedule 15-minute instructor office hours to clarify missing concepts`,
      ],
      threeDayActionSprint: [
        {
          day: 'Day 1 (Immediate Recovery)',
          tasks: [
            `Complete overdue ${params.missingAssignments[0]?.title || 'course homework'} (estimated 90 mins)`,
            `Review lecture notes and create a 1-page formula sheet`,
          ],
          targetMinutes: 120,
        },
        {
          day: 'Day 2 (Core Preparation)',
          tasks: [
            `Work on ${params.upcomingDeadlines[0]?.title || 'upcoming weekly assignment'}`,
            `Do 3 practice problems under timed conditions`,
          ],
          targetMinutes: 110,
        },
        {
          day: 'Day 3 (Final Review & Polish)',
          tasks: [
            `Submit all pending lab and quiz items`,
            `Confirm gradebook sync status in LMS`,
          ],
          targetMinutes: 80,
        },
      ],
      estimatedGpaImprovement: '+0.25 to +0.40 GPA lift upon completing missing assignments.',
    };
  }

  try {
    const prompt = `You are a university academic retention specialist and automated student workflow coach.
Analyze the following student profile and generate a structured recovery & workflow optimization plan:

Student: ${params.studentName} (${params.major}, Current GPA: ${params.gpa})
Courses & Current Grades: ${JSON.stringify(params.coursesWithGrades)}
Missing Assignments: ${JSON.stringify(params.missingAssignments)}
Upcoming Deadlines (next 7 days): ${JSON.stringify(params.upcomingDeadlines)}

Respond in valid JSON with:
- "overallDiagnosis": 2-3 sentence strategic analysis of the student's workload & risk bottlenecks.
- "riskRating": one of ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
- "priorityFocusAreas": array of 3 concrete priority recommendations
- "threeDayActionSprint": array of 3 objects with { "day": "Day 1 ...", "tasks": string[], "targetMinutes": number }
- "estimatedGpaImprovement": short encouraging sentence on potential grade/GPA outcome.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    return {
      overallDiagnosis: parsed.overallDiagnosis || 'Active intervention plan created.',
      riskRating: parsed.riskRating || 'MEDIUM',
      priorityFocusAreas: parsed.priorityFocusAreas || ['Submit missing work', 'Review upcoming tests'],
      threeDayActionSprint: parsed.threeDayActionSprint || [],
      estimatedGpaImprovement: parsed.estimatedGpaImprovement || 'Potential +0.3 GPA improvement.',
    };
  } catch (error) {
    console.error('Gemini remediation plan error:', error);
    return {
      overallDiagnosis: 'Automated study schedule synthesized from gradebook deadlines.',
      riskRating: 'MEDIUM',
      priorityFocusAreas: ['Tackle highest weight assignment first', 'Attend office hours', 'Verify LMS submission links'],
      threeDayActionSprint: [
        { day: 'Day 1', tasks: ['Complete missing tasks'], targetMinutes: 90 },
        { day: 'Day 2', tasks: ['Prepare for midterm'], targetMinutes: 120 },
        { day: 'Day 3', tasks: ['Review & submit lab report'], targetMinutes: 60 },
      ],
      estimatedGpaImprovement: '+0.30 GPA projected with full completion.',
    };
  }
}
