var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var control = require('./routes/control');
var app = express();


var server = http.createServer(app);

var io = require('socket.io').listen(server);

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
    //console.log('received: ' + data);
    
    onoff = data[0];
    state_r = data[1];
    state_y = data[2];
    state_g = data[3];

  io.sockets.emit('status', { "onoff": onoff, "red": state_r,"yellow": state_y,"green": state_g });
});


io.sockets.on('connection', function (socket) {
  
  // enroll_device Event
  socket.on('on', function (data) {
    sp.write("2000\n\r");
  });
  socket.on('off', function (data) {
    sp.write("1000\n\r");
  });

  socket.on('status', function (data) {
    sp.write("0000\n\r");
  });
    socket.on('red', function (data) {
    if(data['status']=="toggle"){
        if(state_r=='1') sp.write("0100\n\r");
        else sp.write("0200\n\r");
    }else if(data['status']=="on"){
        sp.write("0200\n\r");   
    }else if(data['status']=="off"){
        sp.write("0100\n\r");
    }
  });
    socket.on('yellow', function (data) {
    if(data['status']=="toggle"){
        if(state_y=='1') sp.write("0010\n\r");
        else sp.write("0020\n\r");
    }else if(data['status']=="on"){
        sp.write("0020\n\r");   
    }else if(data['status']=="off"){
        sp.write("0020\n\r");
    }
  });

    socket.on('green', function (data) {
    if(data['status']=="toggle"){
        if(state_g=='1') sp.write("0001\n\r");
        else sp.write("0002\n\r");
    }else if(data['status']=="on"){
        sp.write("0002\n\r");   
    }else if(data['status']=="off"){
        sp.write("0001\n\r");
    }
  });

  socket.emit('status', { "red": state_r,"yellow": state_y,"green": state_g });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/control', control);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.get('/', function (request, response) {
  fs.readFile('index.html', function (error, data) {
    response.send(data.toString());
  });
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

server.listen(52273, function () {
  console.log('Server Running at http://127.0.0.1:52273');
});

module.exports = app;
