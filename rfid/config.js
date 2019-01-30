
exports.portOpen = function () {
  return new Promise(function(resolve, reject){
    const SerialPort = require('serialport')
    const Readline = require('@serialport/parser-readline')




    port.open(function (err) {
      if (err) {
        reject(err)
      }
      // Because there's no callback to write, write errors will be emitted on the port:
      resolve(port, parser);
    });

  });
}

exports.portClose = function (port) {

}
