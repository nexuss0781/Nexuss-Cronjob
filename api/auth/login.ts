import bcrypt from 'bcryptjs';
import { getUserByEmail } from '../_lib/store.js';
import { signToken, jsonError } from '../_lib/auth.js';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return jsonError('Email and password are required');
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return jsonError('Invalid credentials', 401);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return jsonError('Invalid credentials', 401);
    }

    const token = await signToken({ userId: user.id, email: user.email });

    return Response.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.includes('not configured')) {
      return jsonError('Database initialization failed.', 503);
    }
    return jsonError(msg || 'Internal server error', 500);
  }
}
