const mongoose = require('mongoose');

const dailyCountSchema = mongoose.Schema({
  transactionDate: Date,
  count: Number,
  idList: [String]
}, {timestamps: true});


module.exports = mongoose.model('dailyCount', dailyCountSchema);
