const mongoose = require('mongoose');

const adminAuthSchema = mongoose.Schema({
  name: String,
  password: String,
  email: String
});


module.exports = mongoose.model('AdminAuth', adminAuthSchema);
