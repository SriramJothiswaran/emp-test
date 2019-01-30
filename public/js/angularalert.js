
 angular
  .module('sweetalert', [])
  .factory('swal', SweetAlert);

function SweetAlert() {
  return window.swal;
};
