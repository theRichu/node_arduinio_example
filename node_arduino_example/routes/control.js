var express = require('express');
var control = express.Router();
/*
var serialport = require("serialport");
var SerialPort = serialport.SerialPort; // localize object constructor

var sp = new SerialPort("/dev/ttyACM1", {
  baudrate: 9600,
  parser: serialport.parsers.readline("\n")
}); // this is the openImmediately flag [default is true]

var onoff = 0;
var state_r = 0;
var state_y = 0;
var state_g = 0;

sp.on("data", function (data) {
	console.log('received: ' + data);
   	
   //console.log('onoff received: ' + data[0]);
   //console.log('state received: ' + data[1]);
	onoff = data[0];
	state_r = data[1];
	state_y = data[2];
	state_g = data[3];

	io.sockets.emit('status', data);

});
*/
/* GET users listing. */
/*
control.get('/', function(req, res) {
	sp.write("0000\n\r");
	var str = 'red :'+state_r + 'yellow :'+state_y  +'green :'+state_g;
	res.send(str);

});

control.get('/on', function(req, res) {
	sp.write("2000\n\r");
 	res.send('on');
});

control.get('/off', function(req, res) {
  sp.write("1000\n\r");
  res.send('off');
});

control.get('/red', function(req, res) {
  res.send('red :'+state_r);
});

control.get('/red/on', function(req, res) {
	sp.write("2200\n\r");
  res.send('red :'+state_r);
});

control.get('/red/off', function(req, res) {
	sp.write("2100\n\r");
  res.send('red :'+state_r);
});

control.get('/yellow', function(req, res) {
  res.send('yellow :'+state_y);
});

control.get('/yellow/on', function(req, res) {
	sp.write("2020\n\r");
  res.send('yellow :'+state_r);
});

control.get('/yellow/off', function(req, res) {
	sp.write("2010\n\r");
  res.send('yellow :'+state_r);
});
control.get('/green', function(req, res) {
  res.send('green :'+state_g);
});

control.get('/green/on', function(req, res) {
	sp.write("2002\n\r");
  res.send('green :'+state_r);
});

control.get('/green/off', function(req, res) {
	sp.write("2001\n\r");
  res.send('green :'+state_r);
});
*/
module.exports = control;
