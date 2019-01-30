const mongoose = require('mongoose');
const EmployeeData = require('../model/employeeData');
const HolidayList = require('../model/holidayList');
const recentTransaction = require('../model/recentTransaction');
const dailyCount = require('../model/dailyCount');


exports.fetchAllEmployees = function () {
  return new Promise(function(resolve, reject) {
    EmployeeData.find({}, function(err, docs){
      if (err) {
        reject(err);
      }else{
        var allEmployeeData = [];
        docs.forEach(function(doc){
          var weeklyStatus = null;
          var weekDay = new Date(doc.transaction[0].time).getDay();
          var splittedName = doc.EmployeeName.split(/(\s+)/);
          console.log(splittedName[0]);
          if (splittedName.length == 1) {
            shortName = splittedName[0].substring(0,2)
          }else{
            shortName = splittedName[0].substring(0,1) + splittedName[2].substring(0,1)
          }
          if (doc.transaction[0].hoursWorked > 45) {
            weeklyStatus = "Overtime";
          }else{
            console.log(weekDay*9 <  doc.transaction[0].hoursWorked);
            weeklyStatus = (weekDay*9 >  doc.transaction[0].hoursWorked) ? "Undertime" : "On time"
          }
          allEmployeeData.push({
            name: doc.EmployeeName,
            id: doc._id.toString(),
            time: doc.transaction[0].time,
            status: doc.transaction[0].status,
            hoursWorked: doc.transaction[doc.transaction.length - 1].hoursWorked.toFixed(2),
            weeklyStatus: weeklyStatus,
            shortName: shortName.toUpperCase()
          });
        });

        resolve(allEmployeeData);
      }
    });
  });
}


exports.fetchEmployee = function (id) {
  return new Promise(function(resolve, reject) {
    EmployeeData.findById(id, function (err, employeeData) {
      if (err) {
        reject(err)
      }else{
        resolve(employeeData)
      }
    });

  });
};

exports.fetchEmployeeByUID = function (UID) {
  console.log(UID);
  return new Promise(function(resolve, reject) {

    // EmployeeData.find().sort({ createdAt: 1 }).exec(function(err, employeeData) {
    //
    //       console.log(employeeData);
    //  });


    EmployeeData.findOne({uid: UID}, function (err, employeeData) {
      if (err) {
        reject(err)
      }else{
        const recent = new recentTransaction({
          empName: employeeData.EmployeeName,
          dbId: employeeData._id.toString(),
          transactionTime: employeeData.transaction[employeeData.transaction.length - 1].swipeDate,
          transactionStatus: employeeData.transaction[employeeData.transaction.length - 1].status,
          hoursWorked: employeeData.transaction[employeeData.transaction.length - 1].hoursWorked
          });
          recent.save().then((result) => {

          }).catch((err) => {
            reject(err);
          });
        resolve(employeeData)
      }
    });

  });
}


exports.fetchRecentTransactions = function (id) {
  return new Promise(function(resolve, reject) {
    recentTransaction.find({}, function (err, recentTransactions) {
      if (err) {
        reject(err)
      }else{
        resolve(recentTransactions)
      }
    });

  });
};


exports.fetchWeeklyStatus = function () {
  return new Promise(function(resolve, reject) {
    dailyCount.find({}).sort({transactionDate: -1}).limit(7).exec(function (err, count) {
      if (err) {
        reject(err)
      }else{
        resolve(count)
      }
    });

  });
};



exports.employeeCount = function () {
  return new Promise(function(resolve, reject) {
    EmployeeData.find({}, function(err, employeeCount){
      if (err) {
        reject(err);
      }else{
        resolve(employeeCount.length);
      }
    });

  });
};

exports.holidayList = function () {
  return new Promise(function(resolve, reject) {
    HolidayList.find({}, function(err, list){
      if(err){
        reject(err)
      }else{

        resolve(list);
      }
    });

  });
}
