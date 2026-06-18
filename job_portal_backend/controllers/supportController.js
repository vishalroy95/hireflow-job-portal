const jwt = require('jsonwebtoken');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendTemplateEmail } = require('../utils/emailService');
const { logEvent } = require('../utils/systemLogger');

const getPagination = (req, defaultLimit = 10) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || defaultLimit, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

const getOptionalUser = async (req) => {
  try {
    let token = req.cookies?.token;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7);
    }
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return User.findById(decoded.id).select('name email role');
  } catch {
    return null;
  }
};

const createSupportTicket = async (req, res, next) => {
  try {
    const user = await getOptionalUser(req);
    const ticket = await SupportTicket.create({
      userId: user?._id || null,
      name: req.body.name || user?.name,
      email: req.body.email || user?.email,
      subject: req.body.subject,
      category: req.body.category || 'Other',
      priority: req.body.priority || 'medium',
      message: req.body.message,
      status: 'open',
    });

    await logEvent({
      req,
      actor: user || { actorEmail: ticket.email, actorRole: 'guest' },
      action: 'support.ticket_created',
      category: 'support',
      message: `Support ticket created: ${ticket.subject}`,
      metadata: {
        ticketId: ticket._id.toString(),
        category: ticket.category,
        priority: ticket.priority,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully',
      ticket,
    });
  } catch (error) {
    next(error);
  }
};

const getMySupportTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(25);

    res.json({ success: true, tickets });
  } catch (error) {
    next(error);
  }
};

const getAdminSupportTickets = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { status, priority, category, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('userId', 'name email role')
        .populate('assignedTo', 'name email')
        .populate('replies.authorId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SupportTicket.countDocuments(filter),
    ]);

    res.json({
      success: true,
      tickets,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    next(error);
  }
};

const updateAdminSupportTicket = async (req, res, next) => {
  try {
    const allowed = ['status', 'priority', 'category', 'subject'];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.status === 'resolved' || updates.status === 'closed') {
      updates.resolvedAt = new Date();
    }

    const existingTicket = await SupportTicket.findById(req.params.id).select('status userId subject');
    if (!existingTicket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found' });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (updates.status && updates.status !== existingTicket.status && existingTicket.userId) {
      await Notification.create({
        userId: existingTicket.userId,
        type: 'system',
        title: 'Support ticket status changed',
        message: `Your ticket "${ticket.subject}" is now ${ticket.status}.`,
        metadata: {
          ticketId: ticket._id,
          status: ticket.status,
        },
      });
    }

    await logEvent({
      req,
      action: 'support.ticket_updated',
      category: 'admin',
      message: `Admin updated support ticket: ${ticket.subject}`,
      metadata: {
        ticketId: ticket._id.toString(),
        updates,
      },
    });

    res.json({ success: true, message: 'Support ticket updated', ticket });
  } catch (error) {
    next(error);
  }
};

const replyToSupportTicket = async (req, res, next) => {
  try {
    const { message, status = 'in-progress' } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found' });
    }

    ticket.replies.push({
      message,
      authorId: req.userId,
      authorRole: 'admin',
    });
    ticket.status = status;
    ticket.assignedTo = req.userId;
    if (status === 'resolved' || status === 'closed') ticket.resolvedAt = new Date();
    await ticket.save();

    if (ticket.userId) {
      await Notification.create({
        userId: ticket.userId,
        type: 'system',
        title: 'Support ticket updated',
        message: `Admin replied to your ticket: ${ticket.subject}`,
        metadata: {
          ticketId: ticket._id,
          status: ticket.status,
        },
      });
    }

    await Promise.allSettled([
      sendTemplateEmail('supportReply', ticket.email, {
        name: ticket.name || 'there',
        subject: ticket.subject,
        message,
      }),
    ]);

    await logEvent({
      req,
      action: 'support.ticket_replied',
      category: 'admin',
      message: `Admin replied to support ticket: ${ticket.subject}`,
      metadata: {
        ticketId: ticket._id.toString(),
        status: ticket.status,
      },
    });

    res.json({ success: true, message: 'Reply added', ticket });
  } catch (error) {
    next(error);
  }
};

const deleteAdminSupportTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Support ticket not found' });
    }

    await logEvent({
      req,
      action: 'support.ticket_deleted',
      category: 'admin',
      severity: 'warning',
      message: `Admin deleted support ticket: ${ticket.subject}`,
      metadata: {
        ticketId: ticket._id.toString(),
      },
    });

    res.json({ success: true, message: 'Support ticket deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSupportTicket,
  deleteAdminSupportTicket,
  getAdminSupportTickets,
  getMySupportTickets,
  replyToSupportTicket,
  updateAdminSupportTicket,
};
