import { findUserByEmail, createUser } from '../services/userService.js';
import { verifyPassword, hashPassword } from '../utils/passwordUtils.js';
import { createAccessToken } from '../utils/tokenUtils.js';

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const user = await findUserByEmail(email);

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = createAccessToken(user.id);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred.'
    });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const user = await (await import('../services/userService.js'))
      .findUserById(req.user.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.'
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Current user error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred.'
    });
  }
}

export async function register(req, res) {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 8 characters.'
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({ email, passwordHash });

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    if (error.code === 'EMAIL_EXISTS') {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered.'
      });
    }

    console.error('Registration error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred.'
    });
  }
}
