const Testimonial = require('../models/Testimonial');
const User = require('../models/User');

const getPagination = (req, defaultLimit = 10) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || defaultLimit, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

const sanitizePublicTestimonial = (testimonial) => ({
  _id: testimonial._id,
  name: testimonial.name,
  roleTitle: testimonial.roleTitle,
  userRole: testimonial.userRole,
  message: testimonial.message,
  rating: testimonial.rating,
  avatar: testimonial.avatar,
  createdAt: testimonial.createdAt,
});

const getPublicTestimonials = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 6, 12);
    const featuredOnly = req.query.featured !== 'false';
    const filter = {
      status: 'approved',
      publicConsent: true,
      ...(featuredOnly ? { isFeatured: true } : {}),
    };

    let testimonials = await Testimonial.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

    if (testimonials.length === 0 && featuredOnly) {
      testimonials = await Testimonial.find({ status: 'approved', publicConsent: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    }

    res.json({
      success: true,
      testimonials: testimonials.map(sanitizePublicTestimonial),
    });
  } catch (error) {
    next(error);
  }
};

const createTestimonial = async (req, res, next) => {
  try {
    if (!['candidate', 'recruiter'].includes(req.userRole)) {
      return res.status(403).json({ success: false, message: 'Only candidates and recruiters can submit testimonials' });
    }

    const { name, roleTitle, message, rating, publicConsent } = req.body;
    if (!publicConsent) {
      return res.status(400).json({ success: false, message: 'Public display consent is required' });
    }

    const user = await User.findById(req.userId).select('name profileImage role');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const testimonial = await Testimonial.create({
      userId: req.userId,
      name: name || user.name,
      roleTitle,
      userRole: req.userRole,
      message,
      rating: Number(rating) || 5,
      avatar: user.profileImage || '',
      publicConsent: Boolean(publicConsent),
      status: 'pending',
      isFeatured: false,
    });

    res.status(201).json({
      success: true,
      message: 'Testimonial submitted for admin review',
      testimonial,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminTestimonials = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { status, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { roleTitle: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const [testimonials, total] = await Promise.all([
      Testimonial.find(filter)
        .populate('userId', 'name email role profileImage')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Testimonial.countDocuments(filter),
    ]);

    res.json({
      success: true,
      testimonials,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    next(error);
  }
};

const updateAdminTestimonial = async (req, res, next) => {
  try {
    const allowed = ['name', 'roleTitle', 'message', 'rating', 'status', 'isFeatured'];
    const updates = {};

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.status && !['pending', 'approved', 'rejected'].includes(updates.status)) {
      return res.status(400).json({ success: false, message: 'Invalid testimonial status' });
    }

    if (updates.status) {
      updates.reviewedBy = req.userId;
      updates.reviewedAt = new Date();
    }

    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('userId', 'name email role profileImage');

    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    res.json({ success: true, message: 'Testimonial updated', testimonial });
  } catch (error) {
    next(error);
  }
};

const setAdminTestimonialStatus = async (req, res, next) => {
  try {
    const statusByAction = {
      approve: 'approved',
      reject: 'rejected',
      pending: 'pending',
    };
    const status = statusByAction[req.params.action];

    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewedBy: req.userId,
        reviewedAt: new Date(),
        ...(status !== 'approved' ? { isFeatured: false } : {}),
      },
      { new: true, runValidators: true }
    ).populate('userId', 'name email role profileImage');

    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    res.json({ success: true, testimonial });
  } catch (error) {
    next(error);
  }
};

const deleteAdminTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    res.json({ success: true, message: 'Testimonial deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTestimonial,
  deleteAdminTestimonial,
  getAdminTestimonials,
  getPublicTestimonials,
  setAdminTestimonialStatus,
  updateAdminTestimonial,
};
