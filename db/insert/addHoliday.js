const mongoose = require('mongoose');
const HolidayList = require('../model/holidayList');


exports.addHoliday = function (listOfHolidays) {

  return new Promise(function(resolve, reject) {

    HolidayList.find({}, function (err, docs) {
        if (docs.length === 0) {
          const holidayList = new HolidayList({
            list: [listOfHolidays]
          });
          holidayList.save().then((result) => {
            resolve(result);
          }).catch((err) => {
            reject(err);
          });
        }else{
          HolidayList.updateOne({},{ $push: {"list": listOfHolidays}}, function (err, updatedList) {
            if (err) {
              reject(err);
            }else{
              resolve(updatedList);
            }
          })
        }
    });



  });
}
