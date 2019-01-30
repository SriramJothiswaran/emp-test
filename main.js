// Modules to control application life and create native browser window
const config = require('./config.json');

const {app, BrowserWindow, ipcMain, Menu} = require('electron');
const fs = require('fs');
const moment = require('moment');
const mongoose = require('mongoose');
const db = require('./db/db');
const auth = require('./auth/auth');
const addEmployee = require('./db/insert/addEmployee');
const addHoliday = require('./db/insert/addHoliday');
const find = require('./db/find/find');
const update = require('./db/update/update');
const deleteDb = require('./db/delete/delete');
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline');
const port = new SerialPort('COM7', {
  baudRate: 9600,
  autoOpen: false
});

const parser = port.pipe(new Readline());


//Configure mongoose's promise to global promise
mongoose.promise = global.Promise;


//establish database connection
db.dbConnection();




function employeeSwipe(){
  port.open(function (err) {
  if (err) {
    return console.log('Error opening port: ', err.message)
  }else{
    console.log('port opnened once');
    var i = 0
    port.on('readable', function () {
      console.log('Data:', port.read())
    });
    var uidData = "";
    parser.on('data', function (data) {
      console.log('this is the actual data');
      console.log(data);
      uidData = uidData + data.toString('hex');
      if (uidData.trim().length === 8) {
        console.log('inside card uid');
        // let UID = data.substring(9,21);
        var UIDforSearch =  uidData.trim();
        if(uidData.trim().replace(/\s/g,'').length === 8 && i === 0){
          i = i + 1;
          console.log('uid for search');
          console.log(UIDforSearch);
            update.updateTransaction(UIDforSearch).then((employeeTransactionData) => {
              console.log('after update');
              find.fetchEmployeeByUID(UIDforSearch).then((data) => {
                  var employeeData = {
                    data: data,
                    employeeDataTime: employeeTransactionData.time,
                    employeeDataStatus: employeeTransactionData.status
                  }

                  port.close(function (err) {

                    if (!err) {
                      console.log('port closed');
                      mainWindow.webContents.send('after:swipe', employeeData);
                    }else
                    {

                      console.log('error on closing the port');
                      console.log(err);
                    }
                });

              })
            }).catch((err) => {
              console.log('error  while fetching details');
              console.log(err);
            })
        }
      }
    });
  }
  });
}


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

    employeeSwipe();

    // const mainMenu = Menu.buildFromTemplate(menuTemplate);
    // Menu.setApplicationMenu(mainMenu);

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

const menuTemplate = [
  {
    label: 'User',
    submenu: [
      {label: 'Admin',
        click(){
          port.close(function (err) {
            if (err) {
              console.log(err);
            }else{
              console.log('not error');
            }
        });
          mainWindow.loadFile('adminview/admin.html');
        }
      },
      {label: 'Employee',
        click(){
          mainWindow.loadFile('index.html');
        }
      }
    ]
  }
];


if (process.platform === 'darwin') {
  menuTemplate.unshift({});
}

ipcMain.on('exit:profile', () => {
  mainWindow.loadFile('index.html');
  console.log('no of times executed');
  employeeSwipe();

});

ipcMain.on('show:checkInStatus', () => {
  mainWindow.loadFile('employeeview/afterswipe.html')
});

ipcMain.on('show:viewProfile', () => {
  mainWindow.loadFile('employeeview/viewprofile.html')
});

ipcMain.on('show:viewHistory', () => {
  mainWindow.loadFile('employeeview/viewhistory.html')
});

ipcMain.on('show:requestLeave', () => {
  mainWindow.loadFile('employeeview/requestleave.html')
});





//Loading Admin Signup Page
ipcMain.on('load:adminSignup', () => {
  mainWindow.loadFile('adminview/signup.html')
});

//Receive data entered by admin and store in database
ipcMain.on('send:userData', (event,userData) => {
  auth.hashPassword(userData.password, userData.email, userData.name);
});



//Loading Admin Signin Page
ipcMain.on('load:adminLogin', () => {

  mainWindow.loadFile('adminview/admin.html');
});



//Validating admin login
ipcMain.on('send:loginData', (event,loginData) => {
  auth.compareHash(loginData.email, loginData.password)
  .then((value) => { if (value.result){
    let userData = {
      name: value.name ,
      email: value.email
    }
    mainWindow.loadFile('adminview/dashboard.html');
    mainWindow.webContents.once('dom-ready', () => {
      mainWindow.webContents.send('login:valid', userData);
    });
  }else{
    mainWindow.webContents.send('login:invalid');
  }})
  .catch((err) => {console.log(err);})
});


//Add new employee - scanning the card placed to get uid
ipcMain.on('send:validateCard', (event) => {
  console.log('inside card validate');
  port.close();
  console.log('port closed');
  port.open(function(err){
    if (err) {
      mainWindow.webContents.send('error:portOpen');

    }else{
      port.on('readable', function () {
        console.log('Data:', port.read())
      });
      var uidData = "";
      parser.on('data', function (data) {
        console.log('insise this function for uid searg');
        console.log(data);
        if (uidData.trim().length === 8) {
          console.log('found the index');
          // let UID = data.substring(9,21);
          if (uidData.trim().replace(/\s/g,'').length === 8) {
              console.log('success');
              port.close(function (err) {
                mainWindow.webContents.send('error:portClose');
                if (!err) {
                  mainWindow.webContents.send('send:cardValid', uidData);
                }
            });
          }
        }
      });
    }
  });
});


//Writing primary key to the rfid tag
// ipcMain.on('write:primaryKey', (event,primaryKey) => {
//
// });



//change admin password from dashboard
ipcMain.on('change:password', (event,changePassword) => {
  auth.compareHash(changePassword.email, changePassword.old)
    .then((value) => {
      console.log(value.result);
      if (value.result) {
        mainWindow.webContents.send('valid:oldPassword');
        auth.changePassword(changePassword.email, changePassword.new).then((value) => {
          mainWindow.webContents.send('changed:password', "Password change successful !");
        }).catch((err) => {
          console.log('error');
          console.log(err);
        })
      }else{
        mainWindow.webContents.send('invalid:oldPassword', "Password doesn't match with the old password");
      }
    })
});



//add employee data to db
ipcMain.on('add:employee', (event,employeeData) => {
  addEmployee.addEmployee(employeeData).then((value) => {
    mainWindow.webContents.send('addEmployee:success', "Employee added successfully !");
  }).catch((err) => {
    mainWindow.webContents.send('addEmployee:error', "error occured while adding employee !");
  })
});


// Fetch all Employee Details
ipcMain.on('fetch:allEmployees', (event) => {
  find.fetchAllEmployees().then((allEmployeeData) => {
    mainWindow.webContents.send('fetch:allEmployeesSuccess', allEmployeeData);
  }).catch((err) => {
    mainWindow.webContents.send('fetch:allEmployeesError', "error occured while fetching employee details !");
  })
});


//View Employee Profile
ipcMain.on('view:employeeProfile', (event, id) => {
  find.fetchEmployee(id).then((EmployeeData) => {
    mainWindow.webContents.send('view:EmployeeSuccess', EmployeeData);
  }).catch((err) => {
    mainWindow.webContents.send('view:EmployeeError', "error occured while fetching employee details !");
  })
});


ipcMain.on('edit:employeeProfile', (event, id) => {
  find.fetchEmployee(id).then((EmployeeData) => {
    mainWindow.webContents.send('edit:EmployeeSuccess', EmployeeData);
  }).catch((err) => {
    mainWindow.webContents.send('edit:EmployeeError', "error occured while fetching employee details !");
  })
});

ipcMain.on('update:employeeProfile', (event, viewEmp) => {
  update.updateEmployeeDetails(viewEmp).then((updateEmployeeProfile) => {
    console.log('before update');
    mainWindow.webContents.send('update:EmployeeSuccess', updateEmployeeProfile);
  }).catch((err) => {
    mainWindow.webContents.send('update:EmployeeError', "error occured while updating employee details !");
  })
});


ipcMain.on('fetch:recentTransactions', () => {
  find.fetchRecentTransactions().then((recentTransactions) => {
    mainWindow.webContents.send('find:recentTransactionsSuccess', recentTransactions);
  }).catch((err) => {
    mainWindow.webContents.send('find:recentTransactionsError', 'Error occured while fetching details');
  })
});


ipcMain.on('fetch:weeklyStatus', () => {
  find.fetchWeeklyStatus().then((dailyCount) => {
    console.log('daily count');
    mainWindow.webContents.send('find:dailyCountSuccess', dailyCount);
  }).catch((err) => {
    mainWindow.webContents.send('find:dailyCountError', 'Error occured while fetching details');
  })
});

ipcMain.on('fetch:employeeCount', () => {
  find.employeeCount().then((employeeCount) => {
    mainWindow.webContents.send('fetch:employeeCountSuccess', employeeCount);
  }).catch((err) => {
    mainWindow.webContents.send('fetch:employeeCountError', "Error occured while fetching employee count");
  })
});


ipcMain.on('fetch:holidayCount', () => {
  find.holidayList().then((holidayList) => {
    var holidayData = {
      count:holidayList[0].list.length,
      list: holidayList[0].list
    }
    mainWindow.webContents.send('fetch:holidayCountSuccess', holidayData);
  }).catch((err) => {
    mainWindow.webContents.send('fetch:holidayCountError', "Error occured while fetching holiday count");
  })
});



ipcMain.on('add:holiday', (event, holidayList) => {
  addHoliday.addHoliday(JSON.parse(holidayList)).then((value) => {
    console.log('value');
    console.log(value);
    mainWindow.webContents.send('add:holidaySuccess');
  }).catch((err) => {
    mainWindow.webContents.send('add:holidayError', 'Error occured while updating holiday list');
  })
});



ipcMain.on('load:holidayList', () => {
  find.holidayList().then((loadedHolidayList) => {
    mainWindow.webContents.send('load:holidayListSuccess', loadedHolidayList);
  }).catch((err) => {
    mainWindow.webContents.send('load:holidayListError');
  })
});



ipcMain.on('modify:holiday', (event, holidayList) => {
  update.modifyHolidayList(JSON.parse(holidayList)).then((value) => {
    console.log(value);
    mainWindow.webContents.send('modify:holidaySuccess', value);
  }).catch((err) => {
    mainWindow.webContents.send('modify:holidayError');
  })
});


ipcMain.on('employee:holidayList', () => {
  find.holidayList().then((holidayList) => {
    mainWindow.webContents.send('employee:holidayListSuccess', holidayList);
  }).catch((err) => {
    mainWindow.webContents.send('employee:holidayListError');
  })
});

ipcMain.on('load:settings', () => {

  var portsList = [];

  var settingMethod = () => {
    var settingsList = {
      portList: portsList,
      selectedPort: config.port,
      baudRate: config.baudRate,
      language: config.language
    };

    mainWindow.webContents.send('loaded:settings', settingsList);
  };

  var getPortsList = (settingMethod) => {
    SerialPort.list((err, ports) => {
      ports.forEach((port) => {
        portsList.push(port.comName);
      });
      settingMethod();
    });
  }

  getPortsList(settingMethod);


});


ipcMain.on('update:settings', (event,portValue) => {
  var updateSettings = JSON.parse(fs.readFileSync('config.json'));
  updateSettings.port = portValue;
  console.log(updateSettings);
  fs.writeFile('config.json', JSON.stringify(updateSettings), function (err, data) {
    if (!err) {
      console.log('updated');
    }
  });

});






function compareDates(dbDate){
var today = new Date();
var dd = today.getDate();
var mm = today.getMonth() + 1; //January is 0!
var yyyy = today.getFullYear();

var dbDate = new Date(dbDate);
var dbDatedd = dbDate.getDate();
var dbDatemm = dbDate.getMonth() + 1;
var dbDateyyyy = dbDate.getFullYear();

if (dd < 10) {
  dd = '0' + dd;
}

if (dbDatedd < 10) {
  dbDatedd = '0' + dbDatedd;
}

if (mm < 10) {
  mm = '0' + mm;
}


if (dbDatemm < 10) {
  dbDatemm = '0' + dbDatemm;
}

today = mm + '/' + dd + '/' + yyyy;
dbDate = dbDatemm + '/' + dbDatedd + '/' + dbDateyyyy;


if (today == dbDate) {
  return false;
}else{
  return true;
}

}

//function for removing count of previous day
setInterval(function () {
    find.fetchRecentTransactions().then((recentTransactions) => {
      if (recentTransactions.length > 0) {
        if (compareDates(recentTransactions[0].transactionTime)) {
          var unique = [...new Set(recentTransactions.map(item => item.dbId))];
          deleteDb.deleteRecentTransactions(unique).then(() => {
            console.log('deleted recent transactions');
          }).catch((err) => {
            console.log('error in recent transactions');
            console.log(err);
          })
        }else{
          console.log(false);
        }
      }
    }).catch((err) => {
      console.log('error while updating recentTransactions');
    });
}, 10000);




// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
