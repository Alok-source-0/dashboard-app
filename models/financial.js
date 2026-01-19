const mongoose = require('mongoose');

const financialSchema = new mongoose.Schema({
    year: String,
    month: String,
    revenue: Number, // Website
    return: Number, // Website Return
    net_revenue: Number, // Revenue - Return
    spent: Number, // Spends/Burn
    percentage: Number, // (Spends/Burn) / Net Revenue
}, { timestamps: true });

// Compound index to speed up lookups and upserts by 'year' and 'month'
financialSchema.index({ year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Financial', financialSchema);
