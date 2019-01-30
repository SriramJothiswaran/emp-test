const mongoose = require('mongoose');

const adminSchema = mongoose.Schema({
  name: String,
  password: String,
  email: String
});

const employeeSchema = mongoose.Schema({
  name: String,
  password: String,
  email: String
});
