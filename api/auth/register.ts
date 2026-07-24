import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser } from '../_lib/store.js';
import { signToken, jsonError } from '../_lib/auth.js';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return jsonError('Email, password, and name are required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonError('Invalid email format');
    }
    if (password.length < 6) {
      return jsonError('Password must be at least 6 characters');
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return jsonError('User already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: crypto.randomUUID(),
      email,
      name,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    await createUser(user);

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
