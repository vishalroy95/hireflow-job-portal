const mongoose = require('mongoose');

const supportReplySchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    authorRole: {
      type: String,
      enum: ['admin', 'candidate', 'recruiter', 'guest'],
      default: 'admin',
    },
  },
  { timestamps: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      lowercase: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please provide a valid email',
      ],
    },
    subject: {
      type: String,
      required: [true, 'Please provide a subject'],
      trim: true,
      maxlength: 140,
    },
    category: {
      type: String,
      enum: ['Account', 'Job Application', 'Recruiter', 'Technical Issue', 'Payment', 'Other'],
      default: 'Other',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    message: {
      type: String,
      required: [true, 'Please provide a message'],
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open',
    },
    replies: {
      type: [supportReplySchema],
      default: [],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

supportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });
supportTicketSchema.index({ email: 1, createdAt: -1 });
supportTicketSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
