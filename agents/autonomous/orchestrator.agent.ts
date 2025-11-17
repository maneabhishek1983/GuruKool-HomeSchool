/**
 * Orchestrator Agent (Autonomous Project Manager)
 *
 * Mission: Act as the single point of coordination for all agents. Plan the entire
 * development lifecycle autonomously, assign tasks, monitor progress, and make decisions
 * on scope and sequencing.
 *
 * System Mindset: Self-governing project manager with no human scrum master dependency.
 */

import { BaseAgent, AgentContext, AgentResult } from '../base.agent';

interface Task {
  id: string;
  title: string;
  description: string;
  assignedAgent: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  dependencies: string[];
  estimatedHours: number;
  actualHours?: number;
  blockers?: string[];
  createdAt: Date;
  completedAt?: Date;
}

interface Sprint {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  goals: string[];
  tasks: Task[];
  status: 'planning' | 'active' | 'completed';
}

interface AgentStatus {
  agentId: string;
  currentTask?: Task;
  completedTasks: number;
  blockedTasks: number;
  healthStatus: 'healthy' | 'degraded' | 'failed';
  lastHeartbeat: Date;
}

export class OrchestratorAgent extends BaseAgent {
  id = 'orchestrator';
  name = 'Orchestrator Agent';
  capabilities = [
    'sprint_planning',
    'task_assignment',
    'progress_monitoring',
    'risk_management',
    'cross_platform_coordination',
    'ci_cd_orchestration',
    'stakeholder_reporting',
  ];
  priority = 10; // Highest priority

  private sprints: Sprint[] = [];
  private tasks: Map<string, Task> = new Map();
  private agentStatuses: Map<string, AgentStatus> = new Map();
  private backlog: Task[] = [];

  async execute(context: AgentContext): Promise<AgentResult> {
    const { action, payload } = context;

    switch (action) {
      case 'initialize_project':
        return await this.initializeProject(payload);
      case 'plan_sprint':
        return await this.planSprint(payload);
      case 'assign_task':
        return await this.assignTask(payload);
      case 'update_task_status':
        return await this.updateTaskStatus(payload);
      case 'check_agent_health':
        return await this.checkAgentHealth();
      case 'generate_progress_report':
        return await this.generateProgressReport();
      case 'handle_blocker':
        return await this.handleBlocker(payload);
      case 'rebalance_workload':
        return await this.rebalanceWorkload();
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Initialize project with Week 1-6 tasks from FLUTTER_DEVELOPMENT_PLAN.md
   */
  private async initializeProject(payload: any): Promise<AgentResult> {
    this.log('Initializing GuruKool HomeSchool Flutter project...');

    // Create initial backlog from development plan
    const initialTasks: Task[] = [
      // Week 1: Authentication & Foundation
      {
        id: 'WEEK1-001',
        title: 'Create Flutter project structure',
        description:
          'Initialize Flutter project, set up folder structure, add dependencies',
        assignedAgent: 'devops',
        priority: 'P0',
        status: 'pending',
        dependencies: [],
        estimatedHours: 4,
        createdAt: new Date(),
      },
      {
        id: 'WEEK1-002',
        title: 'Migrate design tokens (Tailwind → Flutter)',
        description:
          'Create colors.dart, spacing.dart, typography.dart from src/config/theme.ts',
        assignedAgent: 'ui_designer',
        priority: 'P0',
        status: 'pending',
        dependencies: ['WEEK1-001'],
        estimatedHours: 8,
        createdAt: new Date(),
      },
      {
        id: 'WEEK1-003',
        title: 'Implement Supabase authentication',
        description: 'Create SupabaseService, AuthService, and auth providers',
        assignedAgent: 'backend_integration',
        priority: 'P0',
        status: 'pending',
        dependencies: ['WEEK1-001'],
        estimatedHours: 12,
        createdAt: new Date(),
      },
      {
        id: 'WEEK1-004',
        title: 'Build login screen UI',
        description:
          'Implement LoginScreen with email/password fields, loading states',
        assignedAgent: 'ui_designer',
        priority: 'P0',
        status: 'pending',
        dependencies: ['WEEK1-002', 'WEEK1-003'],
        estimatedHours: 8,
        createdAt: new Date(),
      },
      {
        id: 'WEEK1-005',
        title: 'Write auth service unit tests',
        description: 'Create test suite for AuthService with 90%+ coverage',
        assignedAgent: 'testing_qa',
        priority: 'P1',
        status: 'pending',
        dependencies: ['WEEK1-003'],
        estimatedHours: 6,
        createdAt: new Date(),
      },

      // Week 2: QR Scanner & Check-In Flow
      {
        id: 'WEEK2-001',
        title: 'Implement native QR scanner',
        description:
          'Use mobile_scanner, camera permissions, scan area overlay',
        assignedAgent: 'qr_specialist',
        priority: 'P0',
        status: 'pending',
        dependencies: ['WEEK1-004'],
        estimatedHours: 16,
        createdAt: new Date(),
      },
      {
        id: 'WEEK2-002',
        title: 'Integrate check-in/out API',
        description:
          'Call POST /api/teacher-sessions/scan, create TeacherSession model',
        assignedAgent: 'backend_integration',
        priority: 'P0',
        status: 'pending',
        dependencies: ['WEEK2-001'],
        estimatedHours: 10,
        createdAt: new Date(),
      },
      {
        id: 'WEEK2-003',
        title: 'Create session state providers',
        description:
          'Build sessionNotifierProvider, handle state updates on scan',
        assignedAgent: 'state_management',
        priority: 'P0',
        status: 'pending',
        dependencies: ['WEEK2-002'],
        estimatedHours: 8,
        createdAt: new Date(),
      },
      {
        id: 'WEEK2-004',
        title: 'Set up CI/CD pipeline',
        description:
          'Configure GitHub Actions, Fastlane for TestFlight/Play Store',
        assignedAgent: 'devops',
        priority: 'P1',
        status: 'pending',
        dependencies: ['WEEK1-001'],
        estimatedHours: 12,
        createdAt: new Date(),
      },

      // Week 3: Session History & MVP Polish
      {
        id: 'WEEK3-001',
        title: 'Build session history screen',
        description: 'List sessions, filters (date range), empty states',
        assignedAgent: 'ui_designer',
        priority: 'P0',
        status: 'pending',
        dependencies: ['WEEK2-003'],
        estimatedHours: 10,
        createdAt: new Date(),
      },
      {
        id: 'WEEK3-002',
        title: 'Create home screen & navigation',
        description:
          'Home screen with stats, bottom navigation (Home, History, Profile)',
        assignedAgent: 'ui_designer',
        priority: 'P0',
        status: 'pending',
        dependencies: ['WEEK3-001'],
        estimatedHours: 8,
        createdAt: new Date(),
      },
      {
        id: 'WEEK3-003',
        title: 'Run comprehensive test suite',
        description:
          'Unit + widget + integration tests, accessibility audit, performance benchmarks',
        assignedAgent: 'testing_qa',
        priority: 'P0',
        status: 'pending',
        dependencies: ['WEEK3-002'],
        estimatedHours: 16,
        createdAt: new Date(),
      },
      {
        id: 'WEEK3-004',
        title: 'Deploy to TestFlight & Google Play Internal',
        description:
          'Build release APK/IPA, upload to stores, invite 10 testers',
        assignedAgent: 'devops',
        priority: 'P0',
        status: 'pending',
        dependencies: ['WEEK3-003'],
        estimatedHours: 8,
        createdAt: new Date(),
      },

      // Week 4: Offline Support
      {
        id: 'WEEK4-001',
        title: 'Implement Hive offline storage',
        description: 'Cache sessions, offline queue, settings storage',
        assignedAgent: 'state_management',
        priority: 'P1',
        status: 'pending',
        dependencies: ['WEEK3-004'],
        estimatedHours: 12,
        createdAt: new Date(),
      },
      {
        id: 'WEEK4-002',
        title: 'Build offline sync service',
        description:
          'Connectivity monitoring, auto-sync queue, conflict resolution',
        assignedAgent: 'state_management',
        priority: 'P1',
        status: 'pending',
        dependencies: ['WEEK4-001'],
        estimatedHours: 10,
        createdAt: new Date(),
      },

      // Week 5: Push Notifications & GPS
      {
        id: 'WEEK5-001',
        title: 'Integrate Firebase Cloud Messaging',
        description:
          'FCM setup, notification permissions, foreground/background handling',
        assignedAgent: 'devops',
        priority: 'P2',
        status: 'pending',
        dependencies: ['WEEK4-002'],
        estimatedHours: 10,
        createdAt: new Date(),
      },
      {
        id: 'WEEK5-002',
        title: 'Add GPS tracking',
        description:
          'Geolocator integration, location permissions, capture on check-in',
        assignedAgent: 'backend_integration',
        priority: 'P2',
        status: 'pending',
        dependencies: ['WEEK4-002'],
        estimatedHours: 8,
        createdAt: new Date(),
      },

      // Week 6: Final Polish & Production
      {
        id: 'WEEK6-001',
        title: 'Build monthly reports screen',
        description:
          'Total hours, session count, charts (fl_chart), PDF export',
        assignedAgent: 'ui_designer',
        priority: 'P2',
        status: 'pending',
        dependencies: ['WEEK5-001', 'WEEK5-002'],
        estimatedHours: 10,
        createdAt: new Date(),
      },
      {
        id: 'WEEK6-002',
        title: 'Implement biometric authentication',
        description: 'Face ID, Touch ID, Fingerprint login with fallback',
        assignedAgent: 'backend_integration',
        priority: 'P2',
        status: 'pending',
        dependencies: ['WEEK6-001'],
        estimatedHours: 8,
        createdAt: new Date(),
      },
      {
        id: 'WEEK6-003',
        title: 'Submit to App Store & Play Store',
        description: 'Final QA, metadata update, production submission',
        assignedAgent: 'devops',
        priority: 'P0',
        status: 'pending',
        dependencies: ['WEEK6-002'],
        estimatedHours: 12,
        createdAt: new Date(),
      },
    ];

    // Add tasks to backlog
    initialTasks.forEach(task => {
      this.tasks.set(task.id, task);
      this.backlog.push(task);
    });

    this.log(`✅ Project initialized with ${initialTasks.length} tasks`);

    return this.createInsight(
      'project_initialized',
      {
        totalTasks: initialTasks.length,
        breakdown: {
          week1: initialTasks.filter(t => t.id.startsWith('WEEK1')).length,
          week2: initialTasks.filter(t => t.id.startsWith('WEEK2')).length,
          week3: initialTasks.filter(t => t.id.startsWith('WEEK3')).length,
          week4: initialTasks.filter(t => t.id.startsWith('WEEK4')).length,
          week5: initialTasks.filter(t => t.id.startsWith('WEEK5')).length,
          week6: initialTasks.filter(t => t.id.startsWith('WEEK6')).length,
        },
        priorityBreakdown: {
          P0: initialTasks.filter(t => t.priority === 'P0').length,
          P1: initialTasks.filter(t => t.priority === 'P1').length,
          P2: initialTasks.filter(t => t.priority === 'P2').length,
        },
      },
      1.0
    );
  }

  /**
   * Plan a new sprint (1-week duration)
   */
  private async planSprint(payload: {
    weekNumber: number;
  }): Promise<AgentResult> {
    const { weekNumber } = payload;
    const sprintId = `SPRINT-WEEK${weekNumber}`;

    this.log(`Planning Sprint for Week ${weekNumber}...`);

    // Get tasks for this week that have dependencies met
    const weekTasks = this.backlog.filter(task => {
      const isWeekTask = task.id.startsWith(`WEEK${weekNumber}`);
      const dependenciesMet = task.dependencies.every(depId => {
        const depTask = this.tasks.get(depId);
        return depTask?.status === 'completed';
      });
      return isWeekTask && dependenciesMet;
    });

    // Sort by priority (P0 > P1 > P2 > P3)
    weekTasks.sort((a, b) => {
      const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const sprint: Sprint = {
      id: sprintId,
      name: `Week ${weekNumber} - ${this.getWeekGoal(weekNumber)}`,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      goals: this.getWeekGoals(weekNumber),
      tasks: weekTasks,
      status: 'planning',
    };

    this.sprints.push(sprint);

    this.log(
      `✅ Sprint planned: ${sprint.name} with ${weekTasks.length} tasks`
    );

    return this.createInsight(
      'sprint_planned',
      {
        sprintId,
        weekNumber,
        taskCount: weekTasks.length,
        totalEstimatedHours: weekTasks.reduce(
          (sum, t) => sum + t.estimatedHours,
          0
        ),
        goals: sprint.goals,
        tasks: weekTasks.map(t => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
        })),
      },
      1.0
    );
  }

  /**
   * Assign task to an agent autonomously
   */
  private async assignTask(payload: { taskId: string }): Promise<AgentResult> {
    const { taskId } = payload;
    const task = this.tasks.get(taskId);

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Check if dependencies are met
    const dependenciesMet = task.dependencies.every(depId => {
      const depTask = this.tasks.get(depId);
      return depTask?.status === 'completed';
    });

    if (!dependenciesMet) {
      this.log(
        `⚠️ Task ${taskId} blocked by dependencies: ${task.dependencies.join(', ')}`
      );
      task.status = 'blocked';
      task.blockers = task.dependencies.filter(depId => {
        const depTask = this.tasks.get(depId);
        return depTask?.status !== 'completed';
      });
      return this.createInsight(
        'task_blocked',
        { taskId, blockers: task.blockers },
        0.3
      );
    }

    // Assign to agent
    task.status = 'in_progress';
    const agentStatus = this.agentStatuses.get(task.assignedAgent);
    if (agentStatus) {
      agentStatus.currentTask = task;
    }

    this.log(`✅ Task ${taskId} assigned to ${task.assignedAgent}`);

    return this.createInsight(
      'task_assigned',
      {
        taskId,
        title: task.title,
        assignedAgent: task.assignedAgent,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
      },
      1.0
    );
  }

  /**
   * Update task status (called by agents on completion/failure)
   */
  private async updateTaskStatus(payload: {
    taskId: string;
    status: Task['status'];
    actualHours?: number;
  }): Promise<AgentResult> {
    const { taskId, status, actualHours } = payload;
    const task = this.tasks.get(taskId);

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const previousStatus = task.status;
    task.status = status;

    if (status === 'completed') {
      task.completedAt = new Date();
      if (actualHours !== undefined) {
        task.actualHours = actualHours;
      }

      // Update agent status
      const agentStatus = this.agentStatuses.get(task.assignedAgent);
      if (agentStatus) {
        agentStatus.completedTasks++;
        delete agentStatus.currentTask;
      }

      // Check if this unblocks other tasks
      const unblockedTasks = Array.from(this.tasks.values()).filter(
        t => t.status === 'blocked' && t.dependencies.includes(taskId)
      );

      unblockedTasks.forEach(t => {
        const allDepsMet = t.dependencies.every(depId => {
          const depTask = this.tasks.get(depId);
          return depTask?.status === 'completed';
        });
        if (allDepsMet) {
          t.status = 'pending';
          delete t.blockers;
          this.log(`✅ Task ${t.id} unblocked by completion of ${taskId}`);
        }
      });
    }

    this.log(`📊 Task ${taskId} status: ${previousStatus} → ${status}`);

    return this.createInsight(
      'task_status_updated',
      {
        taskId,
        previousStatus,
        newStatus: status,
        actualHours,
        variance:
          actualHours && task.estimatedHours
            ? actualHours - task.estimatedHours
            : undefined,
      },
      1.0
    );
  }

  /**
   * Check health of all agents
   */
  private async checkAgentHealth(): Promise<AgentResult> {
    const now = new Date();
    const healthyThreshold = 5 * 60 * 1000; // 5 minutes

    const unhealthyAgents = Array.from(this.agentStatuses.values()).filter(
      status => {
        const timeSinceHeartbeat =
          now.getTime() - status.lastHeartbeat.getTime();
        return timeSinceHeartbeat > healthyThreshold;
      }
    );

    if (unhealthyAgents.length > 0) {
      this.log(`⚠️ ${unhealthyAgents.length} agents are unhealthy`);
      unhealthyAgents.forEach(agent => {
        agent.healthStatus = 'degraded';
        // Reassign tasks if needed
        if (agent.currentTask) {
          this.log(
            `🔄 Reassigning task ${agent.currentTask.id} from ${agent.agentId}`
          );
          agent.currentTask.status = 'pending';
          delete agent.currentTask;
        }
      });
    }

    return this.createInsight(
      'agent_health_check',
      {
        totalAgents: this.agentStatuses.size,
        healthyAgents: this.agentStatuses.size - unhealthyAgents.length,
        unhealthyAgents: unhealthyAgents.map(a => a.agentId),
      },
      unhealthyAgents.length === 0 ? 1.0 : 0.5
    );
  }

  /**
   * Generate weekly progress report for stakeholders
   */
  private async generateProgressReport(): Promise<AgentResult> {
    const completedTasks = Array.from(this.tasks.values()).filter(
      t => t.status === 'completed'
    );
    const inProgressTasks = Array.from(this.tasks.values()).filter(
      t => t.status === 'in_progress'
    );
    const blockedTasks = Array.from(this.tasks.values()).filter(
      t => t.status === 'blocked'
    );
    const pendingTasks = Array.from(this.tasks.values()).filter(
      t => t.status === 'pending'
    );

    const totalEstimatedHours = Array.from(this.tasks.values()).reduce(
      (sum, t) => sum + t.estimatedHours,
      0
    );
    const completedHours = completedTasks.reduce(
      (sum, t) => sum + (t.actualHours || t.estimatedHours),
      0
    );

    const progressPercentage = Math.round(
      (completedHours / totalEstimatedHours) * 100
    );

    const report = {
      timestamp: new Date(),
      summary: {
        totalTasks: this.tasks.size,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        blockedTasks: blockedTasks.length,
        pendingTasks: pendingTasks.length,
        progressPercentage,
      },
      timeTracking: {
        totalEstimatedHours,
        completedHours,
        variance: completedTasks.reduce((sum, t) => {
          return sum + ((t.actualHours || 0) - t.estimatedHours);
        }, 0),
      },
      blockers: blockedTasks.map(t => ({
        taskId: t.id,
        title: t.title,
        blockedBy: t.blockers || [],
      })),
      upcomingMilestones: this.getUpcomingMilestones(),
    };

    this.log(`📊 Progress Report Generated: ${progressPercentage}% complete`);

    return this.createInsight('progress_report', report, 1.0);
  }

  /**
   * Handle blockers autonomously (reassign, re-prioritize, or escalate)
   */
  private async handleBlocker(payload: {
    taskId: string;
  }): Promise<AgentResult> {
    const task = this.tasks.get(payload.taskId);

    if (!task || task.status !== 'blocked') {
      return this.createInsight('no_blocker', { taskId: payload.taskId }, 0.5);
    }

    // Strategy 1: Check if dependencies can be fast-tracked
    const blockerTasks =
      task.blockers?.map(id => this.tasks.get(id)).filter(Boolean) || [];
    const canFastTrack = blockerTasks.every(t => t?.priority !== 'P0');

    if (canFastTrack && blockerTasks.length > 0) {
      // Escalate blocker tasks to P0
      blockerTasks.forEach(t => {
        if (t) {
          this.log(`⬆️ Escalating ${t.id} to P0 to unblock ${task.id}`);
          t.priority = 'P0';
        }
      });
      return this.createInsight(
        'blocker_escalated',
        {
          taskId: task.id,
          escalatedTasks: blockerTasks.map(t => t?.id),
        },
        0.8
      );
    }

    // Strategy 2: Re-sequence tasks if possible
    // (Implementation would analyze dependency graph and find alternative paths)

    // Strategy 3: Escalate to human if critical path blocked
    if (task.priority === 'P0') {
      this.log(
        `🚨 ESCALATION: P0 task ${task.id} blocked, requires human intervention`
      );
      return this.createInsight(
        'blocker_escalated_to_human',
        {
          taskId: task.id,
          title: task.title,
          blockers: task.blockers,
          reason: 'Critical path blocked',
        },
        0.3
      );
    }

    return this.createInsight('blocker_analyzed', { taskId: task.id }, 0.6);
  }

  /**
   * Rebalance workload across agents
   */
  private async rebalanceWorkload(): Promise<AgentResult> {
    // Calculate workload per agent
    const workloadMap = new Map<string, number>();

    Array.from(this.tasks.values())
      .filter(t => t.status === 'in_progress' || t.status === 'pending')
      .forEach(task => {
        const current = workloadMap.get(task.assignedAgent) || 0;
        workloadMap.set(task.assignedAgent, current + task.estimatedHours);
      });

    // Find agents with unbalanced workload (>20 hours difference)
    const avgWorkload =
      Array.from(workloadMap.values()).reduce((a, b) => a + b, 0) /
      workloadMap.size;
    const overloadedAgents = Array.from(workloadMap.entries()).filter(
      ([_, hours]) => hours > avgWorkload + 20
    );

    if (overloadedAgents.length > 0) {
      this.log(`⚖️ Rebalancing workload for ${overloadedAgents.length} agents`);
      // (Implementation would reassign tasks from overloaded to underloaded agents)
    }

    return this.createInsight(
      'workload_balanced',
      {
        avgWorkload,
        overloadedAgents: overloadedAgents.map(([id]) => id),
      },
      1.0
    );
  }

  // Helper methods
  private getWeekGoal(weekNumber: number): string {
    const goals = [
      'Authentication & Foundation',
      'QR Scanner & Check-In Flow',
      'Session History & MVP Polish',
      'Offline Support',
      'Push Notifications & GPS Tracking',
      'Final Polish & Production Launch',
    ];
    return goals[weekNumber - 1] || 'Unknown';
  }

  private getWeekGoals(weekNumber: number): string[] {
    const goalsMap: Record<number, string[]> = {
      1: [
        'Login/logout working',
        'Design system migrated',
        'Unit tests passing',
      ],
      2: [
        'QR scanner 95%+ detection',
        'Check-in/out API working',
        'CI/CD pipeline live',
      ],
      3: [
        'Session history complete',
        'MVP on TestFlight/Play',
        '80% code coverage',
      ],
      4: [
        'Offline cache working',
        'Sync queue implemented',
        'No data loss offline',
      ],
      5: ['Push notifications working', 'GPS tracking enabled'],
      6: [
        'Monthly reports available',
        'Biometric auth enabled',
        'App Store/Play Store live',
      ],
    };
    return goalsMap[weekNumber] || [];
  }

  private getUpcomingMilestones(): Array<{ date: Date; milestone: string }> {
    return [
      {
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        milestone: 'Week 1 Complete: Auth & Foundation',
      },
      {
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        milestone: 'Week 2 Complete: QR Scanner Working',
      },
      {
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        milestone: 'Week 3 Complete: MVP on TestFlight/Play',
      },
      {
        date: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
        milestone: 'Week 6 Complete: Production Launch',
      },
    ];
  }

  protected validateContext(context: AgentContext): AgentResult | null {
    if (!context.action) {
      return {
        success: false,
        message: 'Action is required for orchestrator',
        errors: ['Missing required field: action'],
      };
    }
    return null; // Validation passed
  }
}
