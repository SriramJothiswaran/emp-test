var app = angular.module('employoApp', ['ngRoute', 'ui.calendar']);

const electron = require('electron');
const { ipcRenderer } = electron;




app.config(function($routeProvider) {
    $routeProvider
    .when("/", {
        templateUrl : "employeeview/home.html"
    })
    .when("/afterswipe", {
        templateUrl : "employeeview/afterswipe.html"
    })
    .when("/requestleave", {
        templateUrl : "employeeview/requestleave.html"
    })
    .when("/viewprofile", {
        templateUrl : "employeeview/viewprofile.html"
    })
    .when("/viewhistory", {
        templateUrl : "employeeview/viewhistory.html"
    })
    .when("/leavecalendar", {
        templateUrl : "employeeview/leaveCalendar.html"
    });
});

app.filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    }
});

app.controller('dashboardCtrl', function ($scope, $timeout, $location,$interval) {
  $scope.employeeName = null;
  $scope.employeeStatus = null;
  $scope.employeeStatusTime = null;
  $scope.employeeID = null;
  $scope.employeeData = null;
  $scope.eventSources = [];
  $scope.currentPage = 0;
  $scope.pageSize = 10;
  $scope.numberOfPages=function(){
      $scope.totalPages = Math.ceil($scope.employeeData.transaction.length/$scope.pageSize);
    }

  /* config object */
      $scope.uiConfig = {
        calendar:{
          height: 450,
          editable: true,
          header:{
            left: 'month basicWeek basicDay agendaWeek agendaDay',
            center: 'title',
            right: 'today prev,next'
          },
          eventClick: $scope.alertEventOnClick,
          eventDrop: $scope.alertOnDrop,
          eventResize: $scope.alertOnResize
        }
      };




  ipcRenderer.on('after:swipe', (event, employeeData) => {
    $timeout(function(){
      $scope.employeeData = employeeData.data._doc;
      $scope.employeeName = employeeData.data._doc.EmployeeName;
      $scope.employeeStatus = employeeData.employeeDataStatus;
      $scope.employeeStatusTime = employeeData.employeeDataTime;
      $scope.employeeID = employeeData.data._doc.EmployeeID;
      location.href="#!afterswipe";
      $scope.countDownTimer = 15;
      $interval(function(){
        $scope.countDownTimer--;
        // if ($scope.countDownTimer === 0) {
        //   ipcRenderer.send('exit:profile');
        // }
        },1000,0);
              }, 0);
  });

  $scope.viewProfile = function (employeeData) {
    console.log(employeeData);
    $scope.employee = employeeData;
    location.href="#!viewprofile";
    $scope.countDownTimer = 15;
  }

  $scope.viewHistory = function (employeeData) {
    $scope.employee = employeeData;
    location.href="#!viewhistory";
    $scope.countDownTimer = 15;
  }

  $scope.getStatus = function (time, workedHours) {
    return (new Date(time).getDay()*9 > workedHours) ? "Undertime" : "On time";
  }

  ipcRenderer.on('employee:holidayListSuccess', (event, loadedHolidayList) => {
    $timeout(function(){
      $scope.loadedHolidayList = loadedHolidayList[0]._doc.list;
    }, 0);
  });

  $scope.leaveCalendar = function () {
    ipcRenderer.send('employee:holidayList');
    location.href = "#!leavecalendar";
    $scope.countDownTimer = 15;

  }


  $scope.exitProfile = function () {
    ipcRenderer.send('exit:profile');
  }




});
