// Copyright (c) 2013-2014 Brandon Cheng <gluxon@gluxon.com> (http://gluxon.com)
// node-vapix: Node.js implementation of VAPIX
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var http = require('http');
var util = require('util');
var request = require('request');
var fs = require('fs');
var MjpegConsumer = require('mjpeg-consumer');
var ffmpeg = require('ffmpeg');

var Recorder = require('rtsp-recorder');

exports.createCamera = function(options) {
  return new Camera(options);
};

function Camera(options) {
  this.address = options.address;
  this.port = options.port;

  this.username = options.username;
  this.password = options.password;

  this.cameraURI = 'http://' + this.address + ':' + this.port;
  this.cameraIP = this.address;
  this.folder = options.folder;
  this.prefix = options.prefix;

  this.auth = {
    'user': this.username,
    'pass': this.password,
    'sendImmediately': false
  };
  this.playing = false;
}

/**
 * Date to string
 * @param date {Date|undefined}
 * @returns {string}
 */
function dateString(date){
    var dt = date || (new Date());
    return [dt.getDate(), dt.getMonth(), dt.getFullYear()].join('-')+' '
        +[dt.getHours(), dt.getMinutes(), dt.getSeconds()].join('-');
}


/**
 * Date to string
 * @param date {Date|undefined}
 * @returns {string}
 */
Camera.prototype.dateString = function(date){
  var dt = date || (new Date());
  return [dt.getDate(), dt.getMonth(), dt.getFullYear()].join('-')+' '
    +[dt.getHours(), dt.getMinutes(), dt.getSeconds()].join('-');
}

Camera.prototype.generateGET = function(options) {
  // Create string for GET requests in a url
  var arguments = '?';

  var i = 1;
  for (var key in options) {
    arguments += key + '=' + options[key];

    // Append & separator to all but last value
    if (i != Object.keys(options).length)
      arguments += '&';

    i++;
  }

  return arguments;
};



Camera.prototype.requestImage = function(options, callback) {
  var path = this.cameraURI;
  if (typeof options === 'object') {
    path += '/axis-cgi/jpg/image.cgi' + this.generateGET(options);
  } else {
    // Options was never passed, only the callback. Use default.
    path += '/axis-cgi/jpg/image.cgi';
    callback = options;
  }

  var req_opt = {
    'auth': this.auth,
    'encoding': null // buffer
  }
  request.get(path, req_opt, function(err, response, body) {
    callback(err, body);
  });
};

//Fachada para Imagenes
Camera.prototype.captureImage = function(options,callback){

  this.requestImage(options,function(err,data){
    var path = this.folder+''+this.prefix;

    console.log(path);
    var filename = path+''+dateString()+'.jpg';

    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }

    callback(err,data);
    fs.writeFile(filename, data, function(err) {
          if (err) throw err;
    });
  });
};

Camera.prototype.getImageResolution = function(callback) {
  var path = this.cameraURI + '/axis-cgi/imagesize.cgi?camera=1';

  request(path, {'auth': this.auth}, function(err, response, body) {
    if (err) {
      callback(err, null);
    } else {
      // Parse the string data
      data = body.toString('ascii').split("\n");
      width = data[0].split(' = ')[1];
      height = data[1].split(' = ')[1];

      // Return object with width and height elements
      callback(null, { 'width': width, 'height': height } );
    }
  }); 
};

Camera.prototype.createVideoStream = function(options) {
  var GET_request = this.generateGET(options);
  var path = this.cameraURI + '/axis-cgi/mjpg/video.cgi' + GET_request;

  var mjpg = new MjpegConsumer();

  request(path, {'auth': this.auth}).pipe(mjpg);

  return mjpg;
};



Camera.prototype.play = function(options,callback){
 //videocodec=h264&resolution=800x450
 var path = 'rtsp://'+this.cameraIP+'/axis-media/media.amp'+this.generateGET(options);
 // var path = this.cameraURI + '/axis-cgi/mjpg/video.cgi' + this.generateGET(options);
 var self = this;

 
  var rtsp = new Recorder({
      // url:'rtsp://192.168.1.155/axis-media/media.amp?videocodec=h264&resolution=800x450',
      url:path,
      timeLimit: options.duration, //length of one video file (seconds) 
      folder: 'videos/', //path to video folder 
      prefix: 'vid-', //prefix for video files 
      movieWidth: 1280, //width of video 
      movieHeight: 720, //height of video 
      maxDirSize: 1024*20, //max size of folder with videos (MB), when size of folder more than limit folder will be cleared 
      maxTryReconnect: 5 //max count for reconnects    
  });

  var filename = rtsp.folder+rtsp.prefix+dateString()+'.mp4';
  rtsp.on('readStart', function(){
      if(self.playing){
        rtsp.writeStream = fs.createWriteStream(filename);
        rtsp.readStream.stdout.pipe(rtsp.writeStream);

        setTimeout(function(){
          rtsp.writeStream.end(); 
        },((rtsp.timeLimit-0.01)*1000));

        rtsp.writeStream.on('finish',function(){
          callback(rtsp);
        });
      }
  });

  if(!rtsp._readStarted){
    self.playing = true;
    rtsp.connect();
  }
  return rtsp;
}

Camera.prototype.StreamVideo = function(options,callback){
  
  var url = 'rtsp://'+this.cameraIP+'/axis-media/media.amp'+this.generateGET(options)
  var rec = new Recorder({
      // url:'rtsp://192.168.1.155/axis-media/media.amp?videocodec=h264&resolution=800x450',
      url:url,
      timeLimit: options.duration, //length of one video file (seconds) 
      folder: 'videos/', //path to video folder 
      prefix: 'vid-', //prefix for video files 
      movieWidth: 1280, //width of video 
      movieHeight: 720, //height of video 
      maxDirSize: 1024*20, //max size of folder with videos (MB), when size of folder more than limit folder will be cleared 
      maxTryReconnect: 5 //max count for reconnects    
  });

  rec.on("readStart",function(){
    
  });

  streamVideo = function(){

            //options = options || {};
            rec.reconnect();
            var filename = rec.folder+rec.prefix+dateString()+'.mp4';
            var duration = (options.duration!=undefined)?(options.duration):this.timeLimit;
            
            if(!rec._recording){

                rec.writeStream = fs.createWriteStream(filename);
                rec.readStream.stdout.pipe(rec.writeStream);

                rec.writeStream.on('finish', function(){
                    console.log("finish.");
                    // rec._recording =false;
                    rec.readStream.stdout.unpipe(rec.writeStream);
                    // rec.emit("finish");
                    rec.writeStream.end();
                });

                setTimeout(function(){
                    // rec.emit("timeout");
                    rec._recording =false;
                    // rec._readStarted = false;
                    rec.readStream.stdout.unpipe(rec.writeStream);
                    console.log("Time out.")
                    rec.writeStream.end();
                }, duration*1000);

                console.log("--> Start record: "+filename+"\r\n");
                rec._recording=true;
            }
            return this;
  };

  
  streamVideo();

};

Camera.prototype.video8s = function(options) {
  var GET_request = this.generateGET(options);
  var path = this.cameraURI + '/axis-cgi/mjpg/video.cgi' + GET_request;

  var mjpg = new MjpegConsumer();

  request(path, {'auth': this.auth}).pipe(mjpg);

  return mjpg;
};

Camera.prototype.getVideo=function(options,callback){

  //http://<servername>/axis-cgi/mjpg/video.cgi

  var GET_request = this.generateGET(options);
  // var path = this.cameraURI + '/mjpg/video.mjpg'+GET_request;
  var path = this.cameraURI + '/axis-cgi/mjpg/video.cgi'+GET_request;
  var downloaded=0;
  let body = [];

  request(path, {'auth': this.auth}, function(err, response, body) {
      if (err) {
        callback(err, null);
      } else {
        //console.log(body);
        // Return object with width and height elements
        //callback(err, response)
        
      }
    }).
    on('data', function(chunk){
      downloaded += chunk.length;
      body.push(chunk);
    }).
    on('end',function(){
      body = Buffer.concat(body).toString();
      //fs.createWriteStream('video.mp4',body)

    })
    .pipe(fs.createWriteStream('video.mp4'));
}

Camera.prototype.loadVideo=function(options,callback){

  var GET_request = this.generateGET(options);

  //axis-media/media.amp?videocodec=h264&audio=0
  //var path = this.cameraURI + '/mjpg/video.mjpg'+GET_request;
  var path = this.cameraURI + '/axis-media/media.amp'+GET_request;
  var downloaded=0;
  let body = [];

  var mjpg = new MjpegConsumer();

  request(path, {'auth': this.auth})
  .on('data', function(chunk){
    body.push(chunk);
  }).on('end',function(){
    body = Buffer.concat(body).toString();
     
      console.log('File Downloaded!');
      /*try {
        var process = new ffmpeg("video.mp4");
        process.then(function (video) {
          video
          .save('_video.mp4', function (error, file) {
            if (!error)
              console.log('Video file: ' + file);
              //res.send("Ok");
          });   

        }, function (err) {
          console.log('Error: ' + err);
        });
      } catch (e) {
        console.log(e);
        //res.send("Error");
      }*/
    
    //callback(body)
    // at this point, `body` has the entire request body stored in it as a string
  }).pipe(fs.createWriteStream('video.mp4'));

  return mjpg;
}