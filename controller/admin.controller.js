const User = require('../models/user');
const Financial = require('../models/financial');

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const getStats = async (req, res) => {
    try {
        const count = await Financial.countDocuments({});
        res.json({ count });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const promoteUser = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { role: 'admin' });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const deleteAllData = async (req, res) => {
    try {
        await Financial.deleteMany({});
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

module.exports = { getAllUsers, getStats, promoteUser, deleteAllData };
