const mongoose = require('mongoose');

const holidayListSchema = mongoose.Schema({
  list: [{leaveDate: Date, description: String}]

}, {timestamps: true});


module.exports = mongoose.model('holidayList', holidayListSchema);
