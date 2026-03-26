const express = require('express');
const router = express.Router();
const Skill = require('../models/Skill');

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const { auth } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  IMPORTANT: Specific routes like /my-skills MUST come BEFORE /:id routes
//     If /:id comes first, Express treats "my-skills" as an ID → infinite loading bug!
// ─────────────────────────────────────────────────────────────────────────────

// ── GET /api/skills/my-skills ─────────────────────────────────────────────────
// Returns all skills that the logged-in user has added (their teaching skills)
router.get('/my-skills', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const skills = await Skill.find({ offeredBy: userId }).sort({ createdAt: -1 });
    return res.json({ skills });
  } catch (err) {
    console.error('Error in GET /my-skills:', err);
    return res.status(500).json({ message: 'Server error fetching your skills' });
  }
});

// ── GET /api/skills ───────────────────────────────────────────────────────────
// Returns all skills with optional filters (for the marketplace/search page)
router.get('/', async (req, res) => {
  try {
    const {
      search, category, level, availability,
      sortBy = 'createdAt', sortOrder = 'desc',
      page = 1, limit = 20
    } = req.query;

    const filter = {};
    if (category)    filter.category     = category;
    if (level)       filter.level        = level;
    if (availability) filter.availability = availability;
    if (search) {
      filter.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags:        { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skills = await Skill.find(filter)
      .populate('offeredBy', 'name email avatar')
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Skill.countDocuments(filter);

    return res.json({
      skills,
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (err) {
    console.error('Error in GET /skills:', err);
    return res.status(500).json({ message: 'Server error fetching skills' });
  }
});

// ── POST /api/skills ──────────────────────────────────────────────────────────
// Creates a new skill for the logged-in user
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const skill = new Skill({
      ...req.body,
      offeredBy: userId
    });
    await skill.save();
    return res.status(201).json(skill);
  } catch (err) {
    console.error('Error in POST /skills:', err);
    return res.status(400).json({ message: err.message || 'Error creating skill' });
  }
});

// ── GET /api/skills/:id ───────────────────────────────────────────────────────
// ⚠️  This MUST come AFTER /my-skills — otherwise "my-skills" is treated as an ID!
router.get('/:id', async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
      .populate('offeredBy', 'name email avatar');
    if (!skill) return res.status(404).json({ message: 'Skill not found' });
    return res.json(skill);
  } catch (err) {
    console.error('Error in GET /skills/:id:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ── PUT /api/skills/:id ───────────────────────────────────────────────────────
// Updates a skill (only the owner can update)
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const skill = await Skill.findOneAndUpdate(
      { _id: req.params.id, offeredBy: userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!skill) return res.status(404).json({ message: 'Skill not found or you are not the owner' });
    return res.json(skill);
  } catch (err) {
    console.error('Error in PUT /skills/:id:', err);
    return res.status(400).json({ message: err.message || 'Error updating skill' });
  }
});

// ── DELETE /api/skills/:id ────────────────────────────────────────────────────
// Deletes a skill (only the owner can delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const skill = await Skill.findOneAndDelete({ _id: req.params.id, offeredBy: userId });
    if (!skill) return res.status(404).json({ message: 'Skill not found or you are not the owner' });
    return res.json({ message: 'Skill deleted successfully' });
  } catch (err) {
    console.error('Error in DELETE /skills/:id:', err);
    return res.status(500).json({ message: 'Server error deleting skill' });
  }
});

module.exports = router;
