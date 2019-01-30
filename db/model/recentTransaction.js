const mongoose = require('mongoose');

const recentTransaction = mongoose.Schema({
  empName: String,
  dbId: String,
  transactionTime: Date,
  transactionStatus: String,
  hoursWorked: Number,
  hoursWorkedStatus: String
}, {timestamps: true});


module.exports = mongoose.model('recentTransaction', recentTransaction);
