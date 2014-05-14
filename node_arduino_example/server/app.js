var fs = require('fs');
var http = require('http');
var express = require('express');
var util = require('util');
var SerialPort = require('serialport').SerialPort;
var xbee_api = require('./lib/xbee-api.js');

// 데이터베이스와 연결합니다.
var client = require('mysql').createConnection({
  user: 'coach',
  password: 'coach',
  database: 'C'
});


//ORDER_CODE
var SYNC = 0x10;
var DELAY_RESP = 0x14;
var GET_STATUS = 0x20;
var SET_STATUS = 0x22;
var DRILL_READY = 0x30;
var DRILL_RESET = 0x31;

//RESPONSE_CODE
var RESP = 0x12;
var DELAY_REQ = 0x18;
var DELAY_FEEDBACK = 0x15;
var MEASURE_START = 0x41;
var MEASURE_END = 0x42;
var MEASURE_OK = 0x44;
var MEASURE_READYD = 0x45;
var MEASURE_RESETTED = 0x46;
var STATUS = 0x21;


// 웹 서버를 생성합니다.
var app = express();
var server = http.createServer(app);

// Xbee Serial Port
var C = xbee_api.constants;

var xbeeAPI = new xbee_api.XBeeAPI({
  api_mode: 1
});

var serialport = new SerialPort("/dev/ttyUSB0", {
  baudrate: 9600,
  parser: xbeeAPI.rawParser()
});

var frame_RESET = {
  type: C.FRAME_TYPE.TX_REQUEST_16,
  //   id: 0x01,
  //   options: 0x01,
  destination16: "FFFF",
  data: [DRILL_RESET]

};

var frame_SYNC = {
  type: C.FRAME_TYPE.TX_REQUEST_16,
  //  id: 0x01,
  //  options: 0x01,
  destination16: "FFFF",
  data: [SYNC]
};

var frame_DELAY_RESP = {
  type: C.FRAME_TYPE.TX_REQUEST_16,
  destination16: "0000",
  data: [DELAY_RESP]
};

var frame_TEST_DRILL = {
  type: C.FRAME_TYPE.TX_REQUEST_16,
  destination16: "0000",
  data: [DRILL_READY, 0x40, 0x02, 0x02, 0x02]
};
function delay()
   {
   setTimeout(delay, 400);
   }


xbeeAPI.on("frame_object", function (frame) {
  var TX16 = 0x81;
  //var 
  //  console.log("OBJ> "+util.inspect(frame));
  if (frame.type == TX16) {
    var resp_code = Number(frame.data[0]);

    console.log("Remote16 : " + frame.remote16 + "  Response : 0x" + resp_code.toString(16));
    switch (resp_code) {
    case RESP:
      var t4 = new Date().getTime();
      console.log("***RESP: " + frame.remote16);
      client.query('UPDATE device SET status=?, updated_at=now() WHERE dest=?', [1, frame.remote16]);
      client.query('SELECT * FROM device WHERE dest=?', [frame.remote16], function (error, data) {
        io.sockets.emit('status_receive', data);
      });

      client.query('UPDATE sync_data SET t4=? WHERE iddrill=? AND iddevice=(SELECT iddevice FROM device WHERE dest=?)', [t4, 1, frame.remote16]);
      break;


    case DELAY_REQ:
      var t6 = new Date().getTime();
      frame_DELAY_RESP.destination16 = frame.remote16;
      serialport.write(xbeeAPI.buildFrame(frame_DELAY_RESP), function (err, res) {
        if (err) throw (err);
        //else console.log("DELAY_RESP: " + util.inspect(res));
      });
      console.log("***DELAY_REQ(" + frame.remote16 + "): " + frame.data);
      var t2 = Number(Number(frame.data[1]) + Number(Number(frame.data[2]) << 8) + Number(Number(frame.data[3]) << 16) + Number(Number(frame.data[4]) << 24));
      client.query('UPDATE sync_data SET t2=?, t6=? WHERE iddrill=? AND iddevice=(SELECT iddevice FROM device WHERE dest=?)', [t2, t6, 1, frame.remote16]);
      break;

    case DELAY_FEEDBACK:
      var t10 = new Date().getTime();
      console.log("***DELAY_FEEDBACK(" + frame.remote16 + "): " + frame.data);
      var t9 = Number(Number(frame.data[1]) + Number(Number(frame.data[2]) << 8) + Number(Number(frame.data[3]) << 16) + Number(Number(frame.data[4]) << 24));
      client.query('UPDATE sync_data SET t9=?, t10=?, sync_at=now() WHERE iddrill=? AND iddevice=(SELECT iddevice FROM device WHERE dest=?)', [t9, t10, 1, frame.remote16]);
      client.query('UPDATE device D SET offset=(SELECT ((t2-t1)-((t4-t1)/2)) FROM sync_data WHERE iddrill=? AND iddevice=D.iddevice) WHERE dest=?', [1, frame.remote16, frame.remote16]);
      client.query('SELECT iddrill,iddevice FROM device WHERE dest=?', [frame.remote16], function (error, data) {
        for (var i in data) {
          io.sockets.emit('sync_updated', {
            iddrill: data[i].iddrill,
            iddevice: data[i].iddevice,
            offset: offset
          });
        }
      });
      break;

    case MEASURE_START:
      //CHANGE STATUS
      console.log("***MEASURE START" + frame.data);
      //Measure Start
      io.sockets.emit('start_measure');
      break;

    case MEASURE_END:
      //Save DB - record
      console.log("***MEASURE END" + frame.data);
      //Measure End, Result..
      client.query('SELECT iddrill,iddevice,sensor_type,data,(raw_timestamp - (SELECT offset FROM device WHERE iddevice=R.iddevice))AS at FROM record R WHERE iddrill=?', [1], function (error, data) {
        io.sockets.emit('end_measure', data);
      });
      break;

    case MEASURE_OK:
      //Save DB - record
      for (i = 0; i < Number(frame.data[1]); i++) {
        k = 2 + i * 5;
        console.log(frame.data);
        client.query('INSERT INTO record(sensor_type, data, raw_timestamp, iddevice, iddrill, received_at) VALUES(?, ?, ?, (SELECT iddevice FROM device WHERE dest=?), 1, now())', [
          frame.data[k] | 0x0F,
          frame.data[k] | 0xF0,
          Number(frame.data[k + 1]) + Number(Number(frame.data[k + 2]) << 8) + Number(Number(frame.data[k + 3]) << 16) + Number(Number(frame.data[k + 4]) << 24),
          frame.remote16
          ], function(err,res){
                  if (err) throw (err);
      else {
         //   console.log(res.insertId);
      client.query('SELECT iddrill,iddevice,sensor_type,data,(raw_timestamp - (SELECT offset FROM device WHERE iddevice=R.iddevice))AS at FROM record R WHERE idrecord=?', [res.insertId], function (error, data) {
        io.sockets.emit('result_receive', data);
      });
      }
          });
      }


      break;

    case MEASURE_READYD:
      //Update Status - device
      break;
    case MEASURE_RESETTED:
      //Update Status - device
      break;
    case STATUS:
      //Update Status - device
      break;

    }
  }
});


app.get('/enroll', function (request, response) {
  fs.readFile('enroll.html', function (error, data) {
    response.send(data.toString());
  });
});

app.get('/', function (request, response) {
  fs.readFile('index.html', function (error, data) {
    response.send(data.toString());
  });
});

/*
// GET - /ShowData
app.get('/showtrainee', function (request, response) {
  // 데이터베이스의 데이터를 제공합니다.
  client.query('SELECT * FROM trainee WHERE name=?', [request.param('name')], function (error, data) {
    response.send(data);
  });
});

app.get('/showrecord', function (request, response) {
  client.query('SELECT * FROM record WHERE fk_trainee=?', [request.param('traineeid')], function (error, data) {
    response.send(data);
  });
});
*/
// 웹 서버를 실행합니다.
server.listen(52273, function () {
  console.log('Server Running at http://127.0.0.1:52273');
});

// 소켓 서버를 생성 및 실행합니다.
var io = require('socket.io').listen(server);
io.sockets.on('connection', function (socket) {
  socket.on('enroll_trainee', function (data) {
    client.query('INSERT INTO trainee(name, age, gender, type, created_time) VALUES (?, ?, ?, ?,NOW())', [data.name, data.age, data.gender, data.type]);
    io.sockets.emit('trainee_receive', {
      name: data.name,
      age: data.age,
      gender: data.gender,
      type: data.type
    });
  });

  // enroll_device Event
  socket.on('enroll_device', function (data) {
    console.log("ENROLL DEVICE");
    client.query('INSERT INTO device(dest, status, time) VALUES (?, 0, NOW())', [data.dest]);    
    io.sockets.emit('device_receive', {
      dest: data.dest
    });
  });

  // Enroll Drill
  socket.on('enroll_drill', function (data) {
    client.query('INSERT INTO drill(name, time) VALUES (?, NOW())', [data.name]);       
    io.sockets.emit('drill_receive', {
      name: data.name
    });
  });


  // device_sync
  socket.on('device_sync', function (data) {
    client.query('SELECT * FROM device ', function (error, data) { //WHERE use=1
      for (var i in data) {
        frame_SYNC.destination16 = data[i].dest;
        console.log(frame_SYNC);
        var t1 = new Date().getTime();
        serialport.write(xbeeAPI.buildFrame(frame_SYNC), function (err, res) {
          if (err) throw (err);
          else {
            //  console.log("SEND SYNC ");
          }
        });
        client.query('UPDATE sync_data SET t1=? WHERE iddrill=? AND iddevice=(SELECT iddevice FROM device WHERE dest=?)', [t1, 1, data[i].dest]);
        console.log("***SEND SYNC " + i + "  " + data[i].dest + "   " + t1);
      delay();
      }
    });

    client.query('SELECT * FROM drill', function (err, data){
      io.sockets.emit('drill_receive', data);
    });    

  });


  socket.on('drill_set', function (data) {
    client.query('SELECT * FROM device ', function (error, data) { //WHERE use=1
      for (var i in data) {
        frame_TEST_DRILL.destination16 = data[i].dest;

        if (i == 0) {
          frame_TEST_DRILL.data = [DRILL_READY, 0x40, 0x01, 0x02, 0x02, 0x10, 0x10];
        } else if (i == 1) {
          frame_TEST_DRILL.data = [DRILL_READY, 0x40, 0x01, 0x02, 0x02, 0x10, 0x30];
        }

        serialport.write(xbeeAPI.buildFrame(frame_TEST_DRILL), function (err, res) {
          if (err) throw (err);
          else console.log("***DRILL SET:" + util.inspect(res));
        });
      }
    });

  });

  socket.on('device_reset', function (data) {
    console.log(frame_RESET);
    serialport.write(xbeeAPI.buildFrame(frame_RESET), function (err, res) {
      if (err) throw (err);
      else {

        client.query('SELECT * FROM device ', function (error, data) { //WHERE use=1
          for (var i in data) {
            client.query('UPDATE device SET status=?, updated_at=now() WHERE dest=?', [0, data[i].dest]);
            client.query('UPDATE sync_data SET t1=NULL, t2=NULL, t4=NULL, t6=NULL, t9=NULL, t10=NULL, sync_at=NULL WHERE iddevice=(SELECT iddevice FROM device WHERE dest=?)', [data[i].dest]);
          }
        });

        console.log("***RESET");
      }
    });
  });


});