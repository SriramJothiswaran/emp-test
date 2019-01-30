require('../renderer.js')

var app = angular.module('employoApp', ["ngRoute", "720kb.datepicker", "oitozero.ngSweetAlert"]);


app.directive('onDocumentClick', ['$document',
  function($document) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {

        var onClick = function() {
          scope.$apply(function() {
            scope.$eval(attrs.onDocumentClick);
          });
        };

        $document.on('click', onClick);

        scope.$on('$destroy', function() {
          $document.off('click', onClick);
        });
      }
    };
  }
]);

app.filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    }
});

app.filter('range', function() {
  return function(input, total) {
    total = parseInt(total);
    for (var i=0; i<total; i++)
      input.push(i);
    return input;
  };
});



app.config(function($routeProvider) {
    $routeProvider
    .when("/", {
        templateUrl : "templates/home.html"
    })
    .when("/employees", {
        templateUrl : "templates/employees.html"
    })
    .when("/leaverequest", {
        templateUrl : "templates/leave-request.html"
    })
    .when("/profile", {
        templateUrl : "templates/profile.html"
    })
    .when("/step1", {
        templateUrl : "templates/addEmployee/step-1.html"
    })
    .when("/step2", {
        templateUrl : "templates/addEmployee/step-2.html"
    })
    .when("/step3", {
        templateUrl : "templates/addEmployee/step-3.html"
    })
    .when("/step4", {
        templateUrl : "templates/addEmployee/step-4.html"
    })
    .when("/viewemployeeprofile", {
        templateUrl : "templates/viewEmployeeProfile.html"
    })
    .when("/editemployeeprofile", {
        templateUrl : "templates/editEmployeeProfile.html"
    })
    .when("/addHoliday", {
        templateUrl : "templates/addHoliday.html"
    })
    .when("/modifyholidaylist", {
        templateUrl : "templates/modifyHolidayList.html"
    })
    .when("/settings", {
        templateUrl : "templates/settings.html"
    })
    .when("/reports", {
        templateUrl : "templates/reports.html"
    });
});



app.controller('loginCtrl', function($scope, $location) {
  $scope.emailFormat = /^[a-z]+[a-z0-9._]+@[a-z]+\.[a-z.]{2,5}$/;
  var absUrl = $location.absUrl();
});

app.controller('dashboardCtrl', function ($scope, $timeout, $location, $window) {
    $scope.loader = true;
    $scope.currentPage = 0;
    $scope.pageSize = 10;
    $scope.totalPages = null;
    $scope.adminName = null;
    $scope.portError = null;
    $scope.cardUID = null;
    $scope.primaryKey = null;
    $scope.adminEmail = null;
    $scope.changePasswordFormData = {};
    $scope.changePasswordError = null;
    $scope.changePasswordSuccess = null;
    $scope.employeeAddSuccess = null;
    $scope.employeeAddError = null;
    $scope.employee = {};
    $scope.showAllEmployees = false;
    $scope.allEmployeeDetails = [];
    $scope.profileOptions= false;
    $scope.holidayList = [{date: null, description: null}];
    $scope.loadedHolidayList = [];
    $scope.portsList = [];
    $scope.selectedPort = null;
    $scope.baudRate = null;
    $scope.language = null;
    $scope.holidayCount = null;



    //Employee DOB must not be less than 18years
    $scope.dateLimit = function () {
        var today = new Date();
        today.setFullYear(today.getFullYear()-18);
        return today.toISOString().split('T')[0];
    }


    //Setting up side menus of admin dashboard
    $scope.menus = [
      {name: "Dashboard", href: "#/!", iclass: "fe fe-home", disabled: false},
      {name: "Employees", href: "#!employees", iclass: "fe fe-user", disabled: false},
      {name: "Reports & Analytics", href: "#!reports", iclass: "fe fe-file-text", disabled: false},
      {name: "Leave Requests", href: "#!leaverequest", iclass: "fe fe-check-square", disabled: false},
      {name: "Admin profile", href: "#!profile", iclass: "fe fe-server", disabled: false},
      {name: "Settings", href: "#!settings", iclass: "fe fe-settings", disabled: false},
      {name: "Files", href: "#", iclass: "fe fe-file", disabled: true},
      {name: "Payroll", href: "#", iclass: "fe fe-dollar-sign", disabled: true}
    ];
    $scope.activeMenu = $scope.menus[0].name;
    $scope.setActive = function(menuItem) {
    $scope.activeMenu = menuItem
    }


    const electron = require('electron');
    const { ipcRenderer } = electron;
    ipcRenderer.on('login:valid', (event, userData) => {
      $timeout(function(){
        $scope.adminName = userData.name;
        $scope.adminEmail = userData.email;
                }, 0);
    });

    $scope.validateCard = function () {
      ipcRenderer.send('send:validateCard');
    };
    ipcRenderer.on('error:portOpen', (event, userData) => {
      $timeout(function(){
        $scope.portError = 'error occured while opening port !';
                }, 0);
    });
    ipcRenderer.on('error:portClose', (event, userData) => {
      $timeout(function(){
        // $scope.portError = 'error occured while closing the port !';
                }, 0);
    });

    ipcRenderer.on('send:cardValid', (event, UID) => {
      $timeout(function(){
        $scope.cardUID = UID;
        $window.location.href = '#!step3';

                }, 0);
    });

    $scope.setPrimaryKey = function () {
      // ipcRenderer.send('write:primaryKey', $scope.primaryKey);
      $window.location.href = '#!step3';
    }

    $scope.changePassword = function () {
      var changePassword = {
        email: $scope.adminEmail,
        old: $scope.changePasswordFormData.oldPassword,
        new: $scope.changePasswordFormData.newPassword
      };
        ipcRenderer.send('change:password', changePassword);
    };


    ipcRenderer.on('invalid:oldPassword', (event, errorMessage) => {
      $timeout(function(){
        swal({
        title: "Error!",
        text: errorMessage,
        type: "error"
           });
           $scope.changePasswordFormData.oldPassword = null;
           $scope.changePasswordFormData.newPassword = null;
                }, 0);
    });

    ipcRenderer.on('valid:oldPassword', (event) => {
      $timeout(function(){
        $scope.changePasswordError = null;
                }, 0);
    });


    ipcRenderer.on('changed:password', (event, successMessage) => {
      $timeout(function(){
        $scope.changePasswordError = null;
        $scope.changePasswordFormData = {};
        swal({
        title: "Updated!",
        text: "Password changed  successfully",
        type: "success"
           },
     function(){
       $window.location.href = '#!'
       });
                }, 0);
    });


    $scope.addEmployee = function () {
      var employeeData = {
        name: $scope.employee.name,
        employeeId: $scope.employee.id,
        dob: $scope.employee.dob,
        gender: $scope.employee.gender,
        contactNo: $scope.employee.contactNo,
        email: $scope.employee.email,
        address: $scope.employee.address,
        uid: $scope.cardUID
      }
      console.log(employeeData);
      ipcRenderer.send('add:employee', employeeData);
    }

    ipcRenderer.on('addEmployee:success', (event, successMessage) => {
      $timeout(function(){
        $scope.employee = {};
        $scope.employeeAddError = null;
        $window.location.href = '#!step4';
                }, 0);
    });

    ipcRenderer.on('addEmployee:error', (event, errorMessage) => {
      $timeout(function(){
        $scope.employeeAddSuccess = null;
        $scope.employeeAddError = errorMessage;
                }, 0);
    });

    $scope.onloadDashboard = function(){
      ipcRenderer.send('fetch:recentTransactions');
      ipcRenderer.send('fetch:employeeCount');
      ipcRenderer.send('fetch:weeklyStatus');
      ipcRenderer.send('fetch:holidayCount');
    }

    $scope.onloadEmployee = function(){
      ipcRenderer.send('fetch:allEmployees');
    }

    ipcRenderer.on('find:recentTransactionsSuccess', (event, recentTransactions) => {
      $timeout(function(){
        $scope.recentTransactions = recentTransactions;
        console.log($scope.recentTransactions);
      }, 0);
    });

    ipcRenderer.on('find:dailyCountSuccess', (event, dailyCount) => {
      $timeout(function(){
        $window.dateAxis = [];
        $window.countValue = [];
        dailyCount.forEach(function(element) {
          $window.dateAxis.push(moment(new Date(element._doc.transactionDate)).format("MMM Do YY"));
          $window.countValue.push(element._doc.count)
        });
      }, 0);
    });

    ipcRenderer.on('fetch:holidayCountSuccess', (event, holidayData) => {
      $timeout(function(){
        $scope.holidayCount =  holidayData.count;
        $scope.monthlyHolidayCount = function(){
          var holidayListData = holidayData.list;
          var todayDate = new Date();
          var oneMonthDate = new Date();
          $scope.oneMonthDate = oneMonthDate.setDate(oneMonthDate.getDate() - todayDate.getDate());
          $scope.monthCount = [];
          var maxDaysInMonth = new Date(todayDate.getFullYear(),todayDate.getMonth()+1, 0).getDate();
          $scope.futureMonthDate = oneMonthDate.setDate(oneMonthDate.getDate() + maxDaysInMonth);
          holidayListData.forEach(function(element) {
            if((new Date(element._doc.leaveDate) > $scope.oneMonthDate) && (new Date(element._doc.leaveDate) < $scope.futureMonthDate)){
                $scope.monthCount.push(element);
            }
          });
        }

        $scope.monthlyHolidayCount();
      }, 0);
    });


    ipcRenderer.on('fetch:allEmployeesSuccess', (event, allEmployeeData) => {
      $timeout(function(){
        $scope.allEmployeeDetails = allEmployeeData;
        $scope.showAllEmployees = true;
        console.log($scope.allEmployeeDetails);
      }, 0);
    });



    $scope.showEdit = function () {
        $scope.profileOptions= !$scope.profileOptions;

    }

    $scope.employeeProfileView = function (id) {
      $scope.profileOptions= !$scope.profileOptions;
      ipcRenderer.send('view:employeeProfile', id);

    }

    $scope.employeeProfileEdit = function (id) {
      ipcRenderer.send('edit:employeeProfile', id);
    }

    ipcRenderer.on('view:EmployeeSuccess', (event, EmployeeData) => {
      $timeout(function(){
        console.log(EmployeeData);
        $scope.viewEmp = {
          name: EmployeeData._doc.EmployeeName,
          id: EmployeeData._doc.EmployeeID,
          dob: EmployeeData._doc.dob,
          gender: EmployeeData._doc.gender,
          contactNo: EmployeeData._doc.contactNumber,
          email: EmployeeData._doc.email,
          address: EmployeeData._doc.address,
          transactions: EmployeeData._doc.transaction
        }
        $scope.profileOptions = false;

        $window.location.href = '#!viewemployeeprofile'
      }, 0);
    });


    $scope.closeMenus = function () {

    }



    ipcRenderer.on('edit:EmployeeSuccess', (event, EmployeeData) => {
      $timeout(function(){
        $scope.profileOptions = false;
        $scope.viewEmp = {
          name: EmployeeData._doc.EmployeeName,
          id: EmployeeData._doc.EmployeeID,
          dob: EmployeeData._doc.dob,
          gender: EmployeeData._doc.gender,
          contactNo: EmployeeData._doc.contactNumber,
          email: EmployeeData._doc.email,
          address: EmployeeData._doc.address
        }

        $window.location.href = '#!editemployeeprofile'
      }, 0);
    });


    $scope.employeeProfileUpdate = function (viewEmp) {
      ipcRenderer.send('update:employeeProfile', viewEmp);
    }

    ipcRenderer.on('update:EmployeeSuccess', (event, EmployeeData) => {
      $timeout(function(){
         swal({
         title: "Updated!",
         text: "Employee details updated successfully",
         type: "success"
            },
      function(){
        $window.location.href = '#!employees'
        });
      }, 0);
    });


    ipcRenderer.on('update:EmployeeError', (event, errorMessage) => {
      $timeout(function(){
         swal({
         title: "Something went wrong !",
         text:  errorMessage + ". Try again, if problem persists contact technical team.",
         type: "error"
            });
      }, 0);
    });

    $scope.getStatus = function (time, workedHours) {
      return (new Date(time).getDay()*9 > workedHours) ? "Undertime" : "On time";
    }

    $scope.getShortName = function (empName) {
      var shortName = null;
      var splittedName = empName.split(/(\s+)/);
      if (splittedName.length == 1) {
        shortName = splittedName[0].substring(0,2);
        return shortName;
      }else{
        shortName = splittedName[0].substring(0,1) + splittedName[2].substring(0,1)
        return shortName;
      }
    }

    $scope.getPresentCount = function () {
      let unique = [...new Set($scope.recentTransactions.map(item => item._doc.dbId))];
      console.log(unique);
      return unique.length;
    };

    ipcRenderer.on('fetch:employeeCountSuccess', (event, employeeCount) => {
      $timeout(function(){
        $scope.employeeCount = employeeCount;
      }, 0);
    });

    $scope.numberOfPages=function(){
      $scope.totalPages = Math.ceil($scope.allEmployeeDetails.length/$scope.pageSize);
    }

    $scope.pageChange = function (n) {
      $scope.currentPage = n;
    }

    $scope.addHoliday = function () {
      $window.location.href='#!addHoliday';
    }

    $scope.navigateToAddHoliday = function(){
      $scope.holidayList = [{leaveDate: null, description: null}];
      $window.location.href='#!addHoliday';
    }

    $scope.addMoreHoliday = function (){
      $scope.holidayList.push({leaveDate: null, description: null});
    }

    $scope.holidaySubmit = function(){
      ipcRenderer.send('add:holiday', angular.toJson($scope.holidayList));
    }

    ipcRenderer.on('add:holidaySuccess', (event, errorMessage) => {
      $timeout(function(){
        swal({
        title: "Updated !",
        text:  "Holiday List updated successfully",
        type: "success"
      },
      function(){
        $scope.holidayList = [{date: null, description: null}];
        $window.location.href = '#!leaverequest'
        });
      }, 0);
    });

    ipcRenderer.on('add:holidayError', (event, errorMessage) => {
      $timeout(function(){

        swal({
        title: "Something went wrong !",
        text:  errorMessage + ". Try again, if problem persists contact technical team.",
        type: "error"
           });
      }, 0);
    });


    $scope.holidayListLoad = function(){
      ipcRenderer.send('load:holidayList');
    }


    ipcRenderer.on('load:holidayListSuccess', (event, loadedHolidayList) => {
      $timeout(function(){
        $scope.loadedHolidayList = loadedHolidayList[0]._doc.list;
      }, 0);
    });

    $scope.removeHoliday = function(index){
      $scope.loadedHolidayList.splice(index, 1);
    }

    $scope.modifyHoliday = function(){
      console.log($scope.loadedHolidayList);
      ipcRenderer.send('modify:holiday', angular.toJson($scope.loadedHolidayList));
    }

    ipcRenderer.on('modify:holidaySuccess', (event, modifiedValue) => {
      $timeout(function(){
        console.log(modifiedValue);
        swal({
        title: "Updated !",
        text:  "Holiday List updated successfully",
        type: "success"
      },
      function(){
        $scope.holidayList = [{date: null, description: null}];
        $window.location.href = '#!leaverequest'
        });
      }, 0);
    });


    $scope.onloadSettings = function(){
      ipcRenderer.send('load:settings');
    }


    ipcRenderer.on('loaded:settings', (event, settingsList) => {
      $timeout(function(){
        $scope.portsList = settingsList.portList;
        $scope.selectedPort = settingsList.selectedPort;
        $scope.baudRate = settingsList.baudRate;
        $scope.language = settingsList.language;
      }, 0);
    });

    $scope.updateSettings = function(portValue){
      ipcRenderer.send('update:settings', portValue);
    }



});
