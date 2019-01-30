const moment = require('moment');
const mongoose = require('mongoose');
const EmployeeData = require('../model/employeeData');
const HolidayList = require('../model/holidayList');


exports.updateEmployeeDetails = function (viewEmp) {
  return new Promise(function(resolve, reject) {
    var updateEmployeeProfile = {
        EmployeeName: viewEmp.name,
        dob: viewEmp.dob,
        gender: viewEmp.gender,
        contactNumber: viewEmp.contactNo,
        email: viewEmp.email,
        address: viewEmp.address,

    };
    EmployeeData.update({EmployeeID: viewEmp.id }, { $set: updateEmployeeProfile}, function (err, updatedEmployeeData) {
      if (err) {
        reject(err)
      }else{
        resolve(updatedEmployeeData)
      }
    });
  });
};



exports.modifyHolidayList = function(holidayList){
  return new Promise(function(resolve, reject) {
    var tempList = [];
    holidayList.forEach(function(element) {
      tempList.push({leaveDate: element._doc.leaveDate, description: element._doc.description});
    });

    console.log(tempList);

    HolidayList.update({}, { $set: {list:tempList}}, function(err, updatedHolidayList){
      if (err) {
        console.log(err);
        reject(err)
      }else{
        console.log('success');
        resolve(updatedHolidayList);
      }
    });
  });
}






exports.updateTransaction = function (UID) {
  console.log('inside update function');
  return new Promise(function(resolve, reject) {
    var todaysDate = new Date();

    //Converting date to mm/dd/yyyy format
    var getFullDate = function (date) {
      var convertedDate = new Date(date);
      var dd = convertedDate.getDate();
      var mm = convertedDate.getMonth()+1;
      var yyyy = convertedDate.getFullYear();

      if(dd<10) {
          dd = '0'+dd
      }

      if(mm<10) {
          mm = '0'+mm
      }

      convertedDate = mm + '/' + dd + '/' + yyyy;
      return convertedDate;
    }

    //Converting todays date to mm/dd/yyyy format
    var getTodaysDate = function () {
      var today = todaysDate
      var dd = today.getDate();
      var mm = today.getMonth()+1; //January is 0!
      var yyyy = today.getFullYear();

      if(dd<10) {
          dd = '0'+dd
      }

      if(mm<10) {
          mm = '0'+mm
      }

      today = mm + '/' + dd + '/' + yyyy;
      return today;
    }

    function getWeekNumber(d) {
        // Copy date so don't modify original
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        // Set to nearest Thursday: current date + 4 - current day number
        // Make Sunday's day number 7
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        // Get first day of year
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        // Calculate full weeks to nearest Thursday
        var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
        // Return array of year and week number
        return [d.getUTCFullYear(), weekNo];
    }


    //new status
    function newStatus(empData, todaysDate, statusToUpdate) {
      var transactionArrayLength = empData.transaction.length - 1;
      console.log('inside new status');
      //if employee swiping IN
      if (statusToUpdate === "checkedIn") {
      var transactionInfo = {
        swipeDate: todaysDate,
        time: todaysDate,
        status: statusToUpdate,
        hoursWorked: empData.transaction[transactionArrayLength].hoursWorked
      }

        pushStatusToDB(transactionInfo);

        //if employee is swiping OUT
      }else if (statusToUpdate === "checkedOut") {

        //finding hour difference between checkIN and the checkOut which is gonna happen
        var hours = Math.abs(new Date(empData.transaction[transactionArrayLength].swipeDate) - new Date(todaysDate)) / 36e5;
        hours = empData.transaction[transactionArrayLength].hoursWorked + hours;
        var transactionInfo = {
          swipeDate: todaysDate,
          time: todaysDate,
          status: statusToUpdate,
          hoursWorked: hours
        }

        pushStatusToDB(transactionInfo);

      }

      }

      function oldStatus(empData) {
        console.log('inside old status');
        var transactionArrayLength = empData.transaction.length - 1;
        var transactionInfo = {
          swipeDate: empData.transaction[transactionArrayLength].swipeDate,
          time: empData.transaction[transactionArrayLength].time,
          status: empData.transaction[transactionArrayLength].status,
          hoursWorked: empData.transaction[transactionArrayLength].hoursWorked
        }

        resolve(transactionInfo)

      }





    function pushStatusToDB (transactionInfo){
      EmployeeData.updateOne({uid: UID}, { $push: {"transaction": transactionInfo }}, function (err, updatedEmployeeData) {
        if (err) {
          var error = {
            err: err,
            authorised: true
          }
          reject(error)
        }else{
          resolve(transactionInfo)
        }
      });
    }

    //Finding employee and his details based on the swiped UID
    console.log(UID.trim());
    EmployeeData.findOne({uid: UID}).sort({'transaction.time': 1}).exec(function(err, employeeData){
      if (err){
        var error = {
          err: err,
          authorised: true
        }
        reject(error)
      }else{
        console.log('this is the swiped card data');
        console.log(employeeData);
        // if the swiped UID is present in the database, get the employee data and proceed
        if (employeeData) {

          //check if card has been swiped before, if swiping for first time then he should be checkedIn
          if (employeeData.transaction.length > 0) {
            //checking if the week of swiping is same. if new week then hours worked should start from zero,
            //if not then hours worked should be added
            var transactionArrayLength = employeeData.transaction.length - 1;
            console.log('test');
            console.log(getWeekNumber(todaysDate)[1]);
            console.log(getWeekNumber(employeeData.transaction[transactionArrayLength].swipeDate));
            console.log(getWeekNumber(employeeData.transaction[transactionArrayLength].swipeDate)[1]);
            if (getWeekNumber(todaysDate)[1] === getWeekNumber(employeeData.transaction[transactionArrayLength].swipeDate)[1]) {
              //if previous transaction status is checkedIn, new transaction status should be checkedOut
              //before updating we are finding time difference between two transaction
              //if time difference is less than 40secs don't update the new transaction
              if (employeeData.transaction[transactionArrayLength].status === "checkedIn") {
                console.log('date difference');
                var differenceInSeconds = moment(todaysDate).diff(moment(new Date(employeeData.transaction[transactionArrayLength].time)), 'seconds');
                console.log('in difference');
                console.log(differenceInSeconds);
                differenceInSeconds > 40 ? newStatus(employeeData, todaysDate, "checkedOut") : oldStatus(employeeData);
              }else if (employeeData.transaction[transactionArrayLength].status === "checkedOut") {
                var differenceInSeconds = moment(todaysDate).diff(moment(new Date(employeeData.transaction[transactionArrayLength].time)), 'seconds');
                console.log('out difference');
                console.log(differenceInSeconds);
                differenceInSeconds > 40 ? newStatus(employeeData, todaysDate, "checkedIn") : oldStatus(employeeData);
              }


            }else{
              //if the old swipe data week and the new one is different
              //hoursWorked will be zero and status will be checkedIn
              var transactionInfo = {
                swipeDate: todaysDate,
                time: todaysDate,
                status: "checkedIn",
                hoursWorked: 0
              }
              //updating the status to DB
              pushStatusToDB(transactionInfo);
            }



          }else{
            //user is swiping for the first time
            var transactionInfo = {
              swipeDate: new Date(),
              time: new Date(),
              status: "checkedIn",
              hoursWorked: 0
            };

            //updating the status to DB
            pushStatusToDB(transactionInfo);

          }

        }else{
          //swiped card UID is not present in the database, card is not authorised
          var error = {
            authorised: false
          }
          reject(error);
        }

      }
    });




  });

}
