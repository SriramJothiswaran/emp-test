const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const AdminAuth = require('../db/model/adminAuth');


//admin entered signin data are getting stored in database and password is getting hashed before storing
exports.hashPassword = function (password,email,name) {
  bcrypt.hash(password, saltRounds, function(err, hash) {
    const adminAuth = new AdminAuth({
        name: name,
        password: hash,
        email: email
    });
    adminAuth.save().then((result) => {
      console.log('admin signed up successfully');
    }).catch((err) => {
      console.log(err);
    });
    console.log(hash);
  });
};


//login data entered are compared with data in database
//access to dashboard is provided only if comparison returns true
exports.compareHash = function (email, password) {

  return new Promise(function(resolve, reject) {
    AdminAuth.findOne({'email': email}, 'email password name', function (err, adminData) {
      if(err){
        reject(err);
      }else{
        if (adminData) {
          let data = {
            result: bcrypt.compareSync(password, adminData.password),
            email: adminData.email,
            name: adminData.name
          }
          resolve(data);
        }else{
          let data = {
            result:false
          }
          resolve(data)
        }
      }
    });
  });
};


exports.changePassword = function(email, newPassword){

  return new Promise(function(resolve, reject) {
    bcrypt.hash(newPassword, saltRounds, function(err, hash) {
        AdminAuth.update({ email: email }, { $set: { password: hash }}, (err, doc) => {
          if (err) {
            console.log(err);
            reject(err)
          }else{
            console.log(doc);
            resolve(doc);
          }

        });
    });
   });
};
