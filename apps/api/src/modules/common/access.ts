import type { AuthUser } from '../../plugins/auth.js';
import type { Db } from '../../db/client.js';
import { getStudent, type Student } from '../students/students.repo.js';
import { fail } from '../../core/errors.js';

// Parents may act for their own children, students for themselves, admins for anyone.
export async function studentFor(db: Db, user: AuthUser | null, studentId: string): Promise<Student> {
  const s = await getStudent(db, studentId);
  if (!s) return fail(404, 'Student not found');
  if (!user) return fail(401, 'Please sign in');
  if (user.role === 'admin') return s;
  if (user.role === 'parent' && s.parentId === user.id) return s;
  if (user.role === 'student' && user.id === s.id) return s;
  return fail(403, 'Not allowed');
}
