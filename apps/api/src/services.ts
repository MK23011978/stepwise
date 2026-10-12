// Service container — built once per process from injected dependencies (no module-level state).
import type { Deps } from './core/deps.js';
import { createAuthTokens } from './plugins/auth.js';
import { createAuthService } from './modules/auth/auth.service.js';
import { createStudentService } from './modules/students/students.service.js';
import { createBillingService } from './modules/billing/billing.service.js';
import { createRewardsService } from './modules/rewards/rewards.service.js';
import { createTaskService } from './modules/tasks/tasks.service.js';
import { createLessonService } from './modules/lessons/lessons.service.js';
import { createExamService } from './modules/exams/exams.service.js';
import { createMissionService } from './modules/missions/missions.service.js';
import { createGiftService } from './modules/gifts/gifts.service.js';
import { createFamilyService } from './modules/family/family.service.js';
import { createReportService } from './modules/report/report.service.js';
import { createAdminService } from './modules/admin/admin.service.js';
import { createSocialService } from './modules/social/social.service.js';

export function createServices(deps: Deps) {
  const tokens = createAuthTokens(deps);
  const students = createStudentService(deps);
  const auth = createAuthService(deps);
  const billing = createBillingService(deps);
  const rewards = createRewardsService(deps, students, billing);
  const tasks = createTaskService(deps);
  const lessons = createLessonService(deps, students, billing, rewards, tasks);
  const exams = createExamService(deps, billing, rewards, tasks, lessons);
  const missions = createMissionService(deps, students);
  const gifts = createGiftService();
  const family = createFamilyService(deps);
  const report = createReportService(deps, students, exams, tasks, missions);
  const admin = createAdminService(deps, students, billing, tokens, family);
  const social = createSocialService(deps);
  return { deps, social, tokens, students, auth, billing, rewards, tasks, lessons, exams, missions, gifts, family, report, admin };
}
export type Services = ReturnType<typeof createServices>;
