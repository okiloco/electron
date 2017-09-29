var Recorder = require('rtsp-recorder');
var fs = require('fs');
var MjpegConsumer = require('mjpeg-consumer');
var path = require('path'); 
/**
* @params:
* cameraIP,
* url,
* timeLimit//length of one video file (seconds) 
* folder: 'videos/', //path to video folder 
* prefix: 'vid-', //prefix for video files 
* movieWidth: 1280, //width of video 
* movieHeight: 720, //height of video 
* maxDirSize: 1024*20, //max size of folder with videos (MB), when size of folder more than limit folder will be cleared 
* maxTryReconnect: 5 //max count for reconnects    
*/



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

function generateGET(options) {
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


Recorder.prototype.setConfig = function(options){
	console.log("timeLimit: ",this.timeLimit);

	if(options.duration==undefined){
		options["duration"] = 600;
	}
	for(var key in options){
		
		if(key=="duration"){
			this["timeLimit"] = options[key];
		}else{
			this[key] = options[key];
		}
	}
}

Recorder.prototype.pause = function(callback){
	var self = this;
	self.playing = (!self.playing);
	self._readStarted = (!self._readStarted);

	self.emit("pause",self.playing,callback);
	if(callback!=undefined){
		callback(self); 
	}
	
	
	return self;
}

Recorder.prototype.stop = function(callback){
	var self = this;
	self.emit("end");
	if(callback!=undefined){
		callback(self); 
	}
	self.writeStream.end();
	self.readStream.stdout.unpipe(this.writeStream);
	return self;
}

Recorder.prototype.record = function(options,callback){
	
	var self = this;
	this._action = options.action;
	this.filename = this.folder+this.prefix+dateString()+'.mp4';

	if(typeof(options)!=undefined){
		console.log(typeof(options));
		if(typeof(options)=='function' && callback == undefined){
			callback = options;
		}else{
			this.setConfig(options);
		}
	}
	this.once('readStart', function(){
		if(self.playing){
			if (!fs.existsSync(self.filename)) {
			    this.writeStream = fs.createWriteStream(self.filename);
    			this.readStream.stdout.pipe(this.writeStream);

    			console.log("duration: ",this.timeLimit);
    			setTimeout(function(){
    			  console.log("time out.");
    			  self.emit("end");
    			},((self.timeLimit)*1000));

    			this.once("end",function(){
    				self._readStarted = false;
    				self.playing = false;
    				if(callback!=undefined){
    					callback(self);
    				} 
    			});



    			console.log("Start record "+self.filename+"\r\n");
		  	}
		}
	});

	this.on('readStart', function(){
			
		this.on("pause",function(playing,callback){
			if(!self.playing){
				this.readStream.stdin.pause();
				this.readStream.stdout.pause();
				//this.readStream.stdout.unpipe(this.writeStream);
			}else{
				// this.readStream.stdout.resume();
			    this.readStream.stdout.pipe(this.writeStream);
			}
			console.log("playing",playing)
		});
		
	});

	this.on('readStart', function(){
		if(this.readStream!=null){
			self.on('camData', function(chunk) {
				//console.log(self.playing);
			});
		}
	});
	
	if(!self._readStarted){
		this.writeStream = null;
        //stream to read video from ffmpeg
        this.readStream = null;
		//width of movie clip
        this.movieWidth = 0;
        //height of movie clip
        this.movieHeight = 0;
        self.playing = true;
		this.connect();
	}
	
	return this;
}

exports.createRecorder = function(options) {
	var path = 'rtsp://'+options.cameraIP+'/axis-media/media.amp'+generateGET({
		videocodec:options.videocodec,
		resolution:options.resolution
	});
	this.folder = options.folder;
	
	var config = {
		url:path,
		// timeLimit: (options.duration!=undefined)?options.duration:this.timeLimit, //length of one video file (seconds) 
		folder: this.folder, //path to video folder 
		prefix: 'vid-', //prefix for video files 
		movieWidth: 1280, //width of video 
		movieHeight: 720, //height of video 
		maxDirSize: 1024*20, //max size of folder with videos (MB), when size of folder more than limit folder will be cleared 
		//maxTryReconnect: 5 //max count for reconnects    
	};

	if(options.duration!=undefined){
		config["timeLimit"]=options.duration;
	}
	var rec = new Recorder(config);
	
	return rec;
};