const mongoose = require('mongoose');

const employeeDataSchema = mongoose.Schema({
  EmployeeName: String,
  EmployeeID: String,
  dob: String,
  gender: String,
  contactNumber: String,
  email: String,
  address: String,
  uid: String,
  checkedIn: [{ date: Date }],
  checkedOut: [{ date: Date }],
  transaction: [{
    swipeDate: { type : Date, default: Date.now },
    status: String,
    time: { type : Date, default: Date.now },
    hoursWorked: Number
  }]
}, {timestamps: true});


module.exports = mongoose.model('employeeData', employeeDataSchema);
