const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test');


exports.dbConnection = function() {

  var db = mongoose.connection;

  db.on('error', console.error.bind(console, 'connection error:'));

  db.once('open', function() {
    console.log('We are connected');
  });

}
