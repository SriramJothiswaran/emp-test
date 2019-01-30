const mongoose = require('mongoose');
const recentTransaction = require('../model/recentTransaction');
const DailyCount = require('../model/dailyCount');
const moment = require('moment');

exports.deleteRecentTransactions = function (unique) {
  return new Promise(function(resolve, reject) {
    const dailyCount = new DailyCount({
      transactionDate: moment(new Date()).subtract(1, 'days'),
      count:unique.length,
      idList: unique
    });
    dailyCount.save().then((result) => {
      recentTransaction.deleteMany({}, function (err) {
        if (err) {
          reject(err);
        }else{
          resolve();
        }
      });
    }).catch((err) => {
      reject(err);
    });

  });

}
