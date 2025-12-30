import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ActivityLog, LoginLog } from '../models/ActivityLog.js';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account has been deactivated. Please contact the CEO.');
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Log login activity
  const loginLog = await LoginLog.create({
    user: user._id,
    userName: user.name,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  await ActivityLog.create({
    user: user._id,
    userName: user.name,
    action: 'LOGIN',
    details: `User logged in from IP: ${req.ip}`,
    ipAddress: req.ip
  });

  const token = generateToken(user._id, user.role);

  // ✅ Updated response format
  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    loginLogId: loginLog._id
  });

  console.log(`✅ ${user.name} (${user.role}) logged in`);
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  const { loginLogId } = req.body;

  if (loginLogId) {
    await LoginLog.findByIdAndUpdate(loginLogId, {
      logoutTime: new Date()
    });
  }

  await ActivityLog.create({
    user: req.user._id,
    userName: req.user.name,
    action: 'LOGOUT',
    details: 'User logged out',
    ipAddress: req.ip
  });

  res.json({ message: 'Logged out successfully' });

  console.log(`👋 ${req.user.name} logged out`);
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// @desc    Register new user (CEO only)
// @route   POST /api/auth/register
// @access  Private/CEO
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  if (!['ceo', 'manager'].includes(role)) {
    res.status(400);
    throw new Error('Invalid role. Must be "ceo" or "manager"');
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role
  });

  await ActivityLog.create({
    user: req.user._id,
    userName: req.user.name,
    action: 'USER_CREATED',
    details: `Created new user: ${name} (${role})`,
    ipAddress: req.ip
  });

  res.status(201).json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    message: 'User registered successfully'
  });

  console.log(`✅ New user created: ${user.name} (${user.role})`);
});

// @desc    Get all users (CEO only)
// @route   GET /api/auth/users
// @access  Private/CEO
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});

// @desc    Update user (CEO only)
// @route   PUT /api/auth/users/:id
// @access  Private/CEO
export const updateUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).select('-password');

  await ActivityLog.create({
    user: req.user._id,
    userName: req.user.name,
    action: 'USER_UPDATED',
    details: `Updated user: ${updatedUser.name}`,
    ipAddress: req.ip
  });

  res.json(updatedUser);
});

// @desc    Delete user (CEO only)
// @route   DELETE /api/auth/users/:id
// @access  Private/CEO
export const deleteUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }

  await User.findByIdAndDelete(req.params.id);

  await ActivityLog.create({
    user: req.user._id,
    userName: req.user.name,
    action: 'USER_DELETED',
    details: `Deleted user: ${user.name}`,
    ipAddress: req.ip
  });

  res.json({ message: 'User deleted successfully' });
});

// @desc    Toggle user active status (CEO only)
// @route   PATCH /api/auth/users/:id/toggle-status
// @access  Private/CEO
export const toggleStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot deactivate your own account');
  }

  user.isActive = !user.isActive;
  await user.save();

  await ActivityLog.create({
    user: req.user._id,
    userName: req.user.name,
    action: 'USER_STATUS_CHANGED',
    details: `${user.isActive ? 'Activated' : 'Deactivated'} user: ${user.name}`,
    ipAddress: req.ip
  });

  res.json(user);
});