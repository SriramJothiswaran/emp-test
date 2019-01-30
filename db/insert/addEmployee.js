const mongoose = require('mongoose');
const EmployeeData = require('../model/employeeData');


exports.addEmployee = function (employee) {
  return new Promise(function(resolve, reject) {
    const employeeData = new EmployeeData({
      EmployeeName: employee.name,
      EmployeeID: employee.employeeId,
      dob: employee.dob,
      gender: employee.gender,
      contactNumber: employee.contactNo,
      email: employee.email,
      address: employee.address,
      uid: employee.uid,
      checkedIn: new Date().now,
      transaction: [{
        swipeDate: new Date().now,
        status: "checkedIn",
        time: new Date().now,
        hoursWorked: 55
      }]
    });

    employeeData.save().then((result) => {
      console.log(result);
      resolve(result);
    }).catch((err) => {
      reject(err);
    });

  });
}
