import asyncHandler from 'express-async-handler';
import { ActivityLog, LoginLog } from '../models/ActivityLog.js';

// @desc    Get all activity logs
// @route   GET /api/activities
// @access  Private/CEO
export const getActivityLogs = asyncHandler(async (req, res) => {
  const { userId, startDate, endDate } = req.query;

  let query = {};

  if (userId) {
    query.user = userId;
  }

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const logs = await ActivityLog.find(query)
    .populate('user', 'name email role')
    .sort({ createdAt: -1 });

  res.json(logs);
});

// @desc    Get all login logs
// @route   GET /api/activities/logins
// @access  Private/CEO
export const getLoginLogs = asyncHandler(async (req, res) => {
  const { userId } = req.query;

  let query = {};

  if (userId) {
    query.user = userId;
  }

  const logs = await LoginLog.find(query)
    .populate('user', 'name email role')
    .sort({ loginTime: -1 });

  res.json(logs);
});

// @desc    Get activity logs for current user
// @route   GET /api/activities/my-activity
// @access  Private
export const getMyActivity = asyncHandler(async (req, res) => {
  const logs = await ActivityLog.find({ user: req.user._id })
    .sort({ createdAt: -1 });

  res.json(logs);
});

// @desc    Get login logs for current user
// @route   GET /api/activities/my-logins
// @access  Private
export const getMyLogins = asyncHandler(async (req, res) => {
  const logs = await LoginLog.find({ user: req.user._id })
    .sort({ loginTime: -1 });

  res.json(logs);
});