import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, executeAutomationEngine } from './server/automationEngine.js';
import { syncLMSProvider, importGradebookCSV } from './server/lmsConnector.js';
import { generatePersonalizedReminder, generateStudentRemediationPlan } from './server/gemini.js';
import { WorkflowRule } from './src/types.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Overview / Dashboard KPI Summary
  app.get('/api/overview', (req, res) => {
    const totalStudents = db.students.length;
    const atRiskCount = db.students.filter((s) => s.riskLevel === 'AT_RISK' || s.riskLevel === 'CRITICAL').length;
    const activeRulesCount = db.workflowRules.filter((r) => r.enabled).length;
    const totalRemindersDispatched = db.reminderLogs.length;
    const resolvedRemindersCount = db.reminderLogs.filter(
      (r) => r.status === 'ACTION_TAKEN' || r.status === 'OPENED'
    ).length;
    const lmsConnectedCount = db.lmsIntegrations.filter((i) => i.status === 'CONNECTED').length;

    res.json({
      totalStudents,
      atRiskCount,
      activeRulesCount,
      totalRemindersDispatched,
      resolvedRemindersCount,
      lmsConnectedCount,
      totalCourses: db.courses.length,
      totalAssignments: db.assignments.length,
    });
  });

  // Students
  app.get('/api/students', (req, res) => {
    res.json(db.students);
  });

  app.get('/api/students/:id', (req, res) => {
    const student = db.getStudent(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const grades = db.getGradesForStudent(student.id).map((g) => {
      const course = db.getCourse(g.courseId);
      return { ...g, course };
    });
    const assignments = db.getAssignmentsForStudent(student.id);
    const reminders = db.reminderLogs.filter((r) => r.studentId === student.id);

    res.json({
      student,
      grades,
      assignments,
      reminders,
    });
  });

  app.put('/api/students/:id', (req, res) => {
    const student = db.getStudent(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const { notificationPreferences, riskLevel } = req.body;
    if (notificationPreferences) {
      student.notificationPreferences = {
        ...student.notificationPreferences,
        ...notificationPreferences,
      };
    }
    if (riskLevel) {
      student.riskLevel = riskLevel;
    }
    db.updateStudentStats(student.id);
    res.json(student);
  });

  // Courses
  app.get('/api/courses', (req, res) => {
    res.json(db.courses);
  });

  // Assignments
  app.get('/api/assignments', (req, res) => {
    res.json(db.assignments);
  });

  app.post('/api/assignments', (req, res) => {
    const { courseId, title, description, type, dueDate, pointsPossible, weightPercentage, estimatedMinutes } = req.body;
    if (!courseId || !title || !dueDate) {
      return res.status(400).json({ error: 'Missing required assignment fields' });
    }
    const newAssignment = {
      id: `asg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      courseId,
      title,
      description: description || '',
      type: type || 'ASSIGNMENT',
      dueDate,
      pointsPossible: Number(pointsPossible) || 100,
      weightPercentage: Number(weightPercentage) || 10,
      estimatedMinutes: Number(estimatedMinutes) || 60,
    };
    db.assignments.push(newAssignment);

    // Create student records for all students
    for (const student of db.students) {
      db.studentAssignments.push({
        id: `sar_${Date.now()}_${student.id}`,
        studentId: student.id,
        assignmentId: newAssignment.id,
        courseId: newAssignment.courseId,
        status: 'PENDING',
        reminderSentCount: 0,
      });
      db.updateStudentStats(student.id);
    }

    res.status(201).json(newAssignment);
  });

  // Student Assignment Record (Get & Update/Submit)
  app.get('/api/student-assignments/:studentId', (req, res) => {
    const records = db.getAssignmentsForStudent(req.params.studentId);
    res.json(records);
  });

  app.post('/api/student-assignments/submit', (req, res) => {
    const { studentId, assignmentId, submissionNotes, submissionLink } = req.body;
    const record = db.studentAssignments.find(
      (sa) => sa.studentId === studentId && sa.assignmentId === assignmentId
    );
    if (!record) {
      return res.status(404).json({ error: 'Student assignment record not found' });
    }

    const assignment = db.getAssignment(assignmentId);
    const isLate = assignment && new Date().getTime() > new Date(assignment.dueDate).getTime();

    record.status = isLate ? 'SUBMITTED_LATE' : 'COMPLETED';
    record.submittedAt = new Date().toISOString();
    record.feedback = submissionNotes
      ? `Submission note: ${submissionNotes}`
      : 'Submitted by student via portal.';
    record.pointsEarned = Math.round((assignment?.pointsPossible || 100) * (isLate ? 0.85 : 0.95));

    // Resolve any pending reminders for this student and assignment
    for (const reminder of db.reminderLogs) {
      if (reminder.studentId === studentId && reminder.assignmentId === assignmentId && reminder.status !== 'ACTION_TAKEN') {
        reminder.status = 'ACTION_TAKEN';
        reminder.resolvedAt = new Date().toISOString();
        reminder.resolutionNote = `Task completed and submitted (${isLate ? 'Late' : 'On Time'}).`;
      }
    }

    db.updateStudentStats(studentId);
    res.json({ success: true, record });
  });

  // Grades for student
  app.get('/api/grades/:studentId', (req, res) => {
    const grades = db.getGradesForStudent(req.params.studentId).map((g) => {
      const course = db.getCourse(g.courseId);
      return { ...g, course };
    });
    res.json(grades);
  });

  // Workflow Rules
  app.get('/api/workflows', (req, res) => {
    res.json(db.workflowRules);
  });

  app.post('/api/workflows', (req, res) => {
    const { name, description, triggerType, conditions, actions, cooldownHours } = req.body;
    if (!name || !triggerType) {
      return res.status(400).json({ error: 'Name and triggerType are required' });
    }

    const newRule: WorkflowRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name,
      description: description || '',
      enabled: true,
      triggerType,
      conditions: conditions || {},
      actions: {
        channels: actions?.channels || ['EMAIL', 'IN_APP'],
        urgencyLevel: actions?.urgencyLevel || 'HIGH',
        templateSubject: actions?.templateSubject || '⚠️ Automated Task Notification',
        templateBody: actions?.templateBody || 'Hi {{studentName}}, please review your tasks for {{courseCode}}.',
        useAIPersonalization: actions?.useAIPersonalization ?? true,
        alertAdvisor: actions?.alertAdvisor ?? false,
        suggestStudyPlan: actions?.suggestStudyPlan ?? true,
      },
      cooldownHours: Number(cooldownHours) || 24,
      timesTriggered: 0,
      resolvedActionsCount: 0,
    };

    db.workflowRules.unshift(newRule);
    res.status(201).json(newRule);
  });

  app.put('/api/workflows/:id', (req, res) => {
    const rule = db.workflowRules.find((r) => r.id === req.params.id);
    if (!rule) {
      return res.status(404).json({ error: 'Workflow rule not found' });
    }

    Object.assign(rule, req.body);
    res.json(rule);
  });

  app.delete('/api/workflows/:id', (req, res) => {
    const index = db.workflowRules.findIndex((r) => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Workflow rule not found' });
    }
    db.workflowRules.splice(index, 1);
    res.json({ success: true, id: req.params.id });
  });

  // Execute single rule
  app.post('/api/workflows/:id/execute', async (req, res) => {
    try {
      const result = await executeAutomationEngine(req.params.id);
      res.json(result);
    } catch (error) {
      console.error('Error executing rule:', error);
      res.status(500).json({ error: 'Failed to execute rule' });
    }
  });

  // Run full automation daemon engine across all rules
  app.post('/api/workflows/run-all', async (req, res) => {
    try {
      const result = await executeAutomationEngine();
      res.json(result);
    } catch (error) {
      console.error('Error running automation engine:', error);
      res.status(500).json({ error: 'Failed to run automation engine' });
    }
  });

  // Reminder Logs
  app.get('/api/reminders', (req, res) => {
    const { studentId, status, limit } = req.query;
    let logs = [...db.reminderLogs];

    if (studentId) {
      logs = logs.filter((l) => l.studentId === String(studentId));
    }
    if (status) {
      logs = logs.filter((l) => l.status === String(status));
    }

    if (limit) {
      logs = logs.slice(0, Number(limit));
    }

    res.json(logs);
  });

  app.put('/api/reminders/:id/status', (req, res) => {
    const log = db.reminderLogs.find((l) => l.id === req.params.id);
    if (!log) {
      return res.status(404).json({ error: 'Reminder log not found' });
    }

    const { status, note } = req.body;
    if (status) {
      log.status = status;
      if (status === 'OPENED' && !log.openedAt) {
        log.openedAt = new Date().toISOString();
      }
      if (status === 'ACTION_TAKEN') {
        log.resolvedAt = new Date().toISOString();
        if (note) log.resolutionNote = note;
      }
    }

    db.updateStudentStats(log.studentId);
    res.json(log);
  });

  // Manual direct reminder dispatch
  app.post('/api/reminders/dispatch-custom', async (req, res) => {
    const { studentId, courseId, assignmentId, channel, urgencyLevel, subject, body, aiInsights } = req.body;
    const student = db.getStudent(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const course = courseId ? db.getCourse(courseId) : undefined;
    const assignment = assignmentId ? db.getAssignment(assignmentId) : undefined;

    const newReminder = {
      id: `rem_manual_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      ruleId: 'manual_dispatch',
      ruleName: 'Manual Instructor/Advisor Dispatch',
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      studentPhone: student.phone,
      courseId: course?.id || 'crs_gen',
      courseCode: course?.code || 'ACADEMIC',
      assignmentId: assignment?.id,
      assignmentTitle: assignment?.title,
      triggerType: 'UPCOMING_DEADLINE' as const,
      channel: channel || 'EMAIL',
      urgencyLevel: urgencyLevel || 'HIGH',
      subject: subject || 'Academic Task Reminder',
      body: body || 'Please review your upcoming course deadlines.',
      aiInsights: aiInsights || 'Manually initiated by academic advisor.',
      createdAt: new Date().toISOString(),
      status: 'DELIVERED' as const,
    };

    db.reminderLogs.unshift(newReminder);
    db.updateStudentStats(student.id);

    res.status(201).json(newReminder);
  });

  // LMS Integrations
  app.get('/api/integrations', (req, res) => {
    res.json(db.lmsIntegrations);
  });

  app.post('/api/integrations/:id/sync', (req, res) => {
    try {
      const syncResult = syncLMSProvider(req.params.id);
      res.json(syncResult);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Sync failed' });
    }
  });

  app.post('/api/integrations/import-csv', (req, res) => {
    const { rows } = req.body;
    if (!Array.isArray(rows)) {
      return res.status(400).json({ error: 'Payload must include rows array' });
    }
    const result = importGradebookCSV(rows);
    res.json(result);
  });

  // Gemini AI Endpoints
  app.post('/api/ai/personalized-reminder', async (req, res) => {
    try {
      const result = await generatePersonalizedReminder(req.body);
      res.json(result);
    } catch (error) {
      console.error('AI reminder generation error:', error);
      res.status(500).json({ error: 'Failed to generate personalized reminder' });
    }
  });

  app.post('/api/ai/remediation-plan', async (req, res) => {
    try {
      const result = await generateStudentRemediationPlan(req.body);
      res.json(result);
    } catch (error) {
      console.error('AI remediation plan error:', error);
      res.status(500).json({ error: 'Failed to generate remediation plan' });
    }
  });

  // ==========================================
  // VITE OR STATIC SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
