exports.updateTransaction = function (UID) {
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
    function newStatus(todaysDate, statusToUpdate) {
      //if employee swiping IN
      if (statusToUpdate === "checkedIn") {
      var transactionInfo = {
        swipeDate: todaysDate,
        time: todaysDate,
        status: statusToUpdate,
        hoursWorked: employeeData.transaction[0].hoursWorked
      }

        pushStatusToDB(transactionInfo);

        //if employee is swiping OUT
      }else if (statusToUpdate === "checkedOut") {

        //finding hour difference between checkIN and the checkOut which is gonna happen
        var hours = Math.abs(new Date(employeeData.transaction[0].swipeDate) - new Date(todaysDate)) / 36e5;
        hours = employeeData.transaction[0].hoursWorked + hours;
        var transactionInfo = {
          swipeDate: todaysDate,
          time: todaysDate,
          status: statusToUpdate,
          hoursWorked: hours
        }

        pushStatusToDB(transactionInfo);

      }

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
    EmployeeData.findOne({uid: UID}).sort({transaction.time: -1}).exec(function(err, employeeData){
      if (err){
        var error = {
          err: err,
          authorised: true
        }
        reject(error)
      }else{
        // if the swiped UID is present in the database, get the employee data and proceed
        if (employeeData.length > 0) {

          //check if card has been swiped before, if swiping for first time then he should be checkedIn
          if (employeeData.transaction[0].length > 0) {
            //checking if the week of swiping is same. if new week then hours worked should start from zero,
            //if not then hours worked should be added
            if (getWeekNumber(todaysDate) === getWeekNumber(employeeData.transaction[0].swipeDate)) {
              //if previous transaction status is checkedIn, new transaction status should be checkedOut
              //before updating we are finding time difference between two transaction
              //if time difference is less than 40secs don't update the new transaction
              if (employeeData.transaction[0].status === "checkedIn") {
                var differenceInSeconds = (new Date(employeeData.transaction[0].time).getTime() - todaysDate.getTime()) / 1000;
                differenceInSeconds > 40 ? newStatus(todaysDate, "checkedOut") : oldStatus();
              }else if (employeeData.transaction[0].status === "checkedOut") {
                var differenceInSeconds = (new Date(employeeData.transaction[0].time).getTime() - todaysDate.getTime()) / 1000;
                differenceInSeconds > 40 ? newStatus(todaysDate, "checkedIn") : oldStatus();
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
