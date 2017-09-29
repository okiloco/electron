//var camera = require('./vapix/videoStreaming.js').camera;
var http = require('http');

const videoshow = require('videoshow');
var fs = require('fs'),
path = require('path');

var bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
var app = express();

app.use("/public",express.static("public"));
app.use(bodyParser.json());//para peticiones aplication/json
app.use(bodyParser.urlencoded({extended:true}));

var ffmpeg = require('ffmpeg');
var Recorder = require('rtsp-recorder');
var options = {
	resolution: '800x450',
	compression: 90,
	duration: 8,
	fps: 25,
	videocodec:'h264'
};

var Stream = require('node-rtsp-stream');


var streaming = require("./js/videoStreaming");
var camera = streaming({
	address: '192.168.1.155',
	port: '80',
	username: 'root',
	password: 'root'
}); 

var video = camera.createRecord({
	resolution: '800x450',
	videocodec:'h264',
	audio:0,
	fps:25,
});

app.get("/video",(req,res,next)=>{
	var action = req.query.action;

 	video.record(req.query,function(){
		console.log("end.");
		res.send(JSON.stringify({
			success:true,
			url:video.filename
		}));
		video.stop();
 	});
 	
});

app.get("/stop",(req,res)=>{
	var rec = video.stop(function(record){
		res.send("end.");
	});
	// video.stop();
});

app.get("/pause",(req,res)=>{
	video.pause(function(){
		res.send("ok");
	});
});

app.get("/video8s",function(req,res){
	
	var video = camera.video8s(options);

	if (!fs.existsSync('frames')) {
	  fs.mkdirSync('frames');
	}

	var archivos =[];
	fs.readdir("./frames", function(err, files) {
	 	if(err){
	 		//throw err;
	 		console.log(err);
	 	}
	 	var count =0;
	 	
	 	files.map(function(file) {
	 		return "./frames/"+file;
	 	}).filter(function(file){
	 		return fs.statSync(file).isFile();
	 	}).forEach(function(file){
	 		var ext =path.extname(file);
	 		var name=path.basename(file);
	 		var namesimple=name.replace(ext,"");
	 		// if(count<5){
	 			archivos.push(file);
	 		// }
	 		count++;
	 		//console.log("name:%s name_simple:%s ext: %s",name,namesimple,ext);
	 	});
	 	
	});

 	var videoOptions = {
 	  fps: 25,
 	  loop:0.2,
 	  transition:false,
 	  videoBitrate: 1024,
 	  disableFadeIn:true,
 	  disableFadeOut:true,
 	  videoCodec: 'libx264',
 	  size: '640x?',
 	  format: 'mp4',
 	  pixelFormat: 'yuv420p'
 	}
 	videoshow(archivos,videoOptions)
 	  .save('video.mp4')
 	  .on('start', function (command) {
 	      console.log('ffmpeg process started:', command)
       })
 	  .on('error', function (err) {
 	  	res.send('Error al crear video!',err);
 	  })
 	  .on('end', function () {
 	  	res.send('Video creado!');
	  });	
	
	/*video.on('data', function(chunk) {
		fs.writeFile('frames/' + counter + ".jpg", data, function(err) {
			if (err) throw err;
		});
		
	})
	.on('end', function() {
		res.send('Finished. Processed ' + counter / options.duration + ' frames per second')
	});*/
});

app.get("/streamvideo",function(req,res){
	var video = camera.StreamVideo({
		videocodec:'h264',
		resolution:'800x450'
	},function(){
		console.log("Bacano!")
	});
});

app.get("/stream",function(req,res){
	
	var rec = new Recorder({
	    url:'rtsp://192.168.1.155/axis-media/media.amp?videocodec=h264&resolution=800x450',
	    timeLimit: 10, //length of one video file (seconds) 
	    folder: 'videos/', //path to video folder 
	    prefix: 'vid-', //prefix for video files 
	    movieWidth: 1280, //width of video 
	    movieHeight: 720, //height of video 
	    maxDirSize: 1024*20, //max size of folder with videos (MB), when size of folder more than limit folder will be cleared 
	    maxTryReconnect: 1 //max count for reconnects 	 
	});
	//axrtsp://http://192.168.1.155/mpeg4/1/media.amp
	
	
	//start recording 
	/*var stream = rec.recordVideo({
		filename:'./videos/mivideo.mp4',
		duration:8
	}).on("finish",function(){
		console.log("video creado con éxito!");
		res.send("Finalizado!");
	})*/
	var stream = rec.play();
	stream.on('readStart', function(){

		console.log("ready")	
		this.writeStream.on('finish', function(){
			// stream._readStarted = false;
			//stream._readStarted = false;
			//stream.stop(); 
			
			/*setTimeout(function(){
				stream.stop(); 
			    res.send("stoped!");
			}, 5*1000);*/
			
	
			res.send("end!");
			
		})
	});
	
	
})

app.get("/play",function(req,res){
	console.log("play ",camera.playing)
	if(!camera.playing){

		var rtsp = camera.play({
			action:'record',
			resolution: '800x450',
			videocodec:'h264',
			audio:0,
			fps:25,
			duration:5,
			videokeyframeinterval:30
		},function(rtsp){
			//rtsp._readStarted = false;
			camera.playing=false;
			res.send("end");
		});
	}
})

app.get("/capture",function(req,res){
	camera.requestImage(options, function(err, data) {
		if (err) throw err;
		// Write returned image data to file
		fs.writeFile("out.jpg", data, function(err) {
			if (err) throw err;
			res.send('Imagen capturada!');
		});
	});
});
app.get("/loadVideo",function(req,res){
		
	var video = camera.loadVideo({
		action:'record',
		media:'video',
		ftps:25,
		name:'MyVideo',
		duration:8,
		videocodec:'h264',
		audio:0
	},function(data){

		console.log(data);
		res.send("Ok");
		/*try {
			var process = new ffmpeg(data);
			process.then(function (video) {
				video
				.save('_video.mp4', function (error, file) {
					if (!error)
						console.log('Video file: ' + file);
					res.send("Ok");
				});		

			}, function (err) {
				console.log('Error: ' + err);
			});
		} catch (e) {
			console.log(e);
			res.send("Error");
		}*/

	});
})

app.get("/getvideo",function(req,res){
	//action=record&media=video&name=My%20new%20clip3&duration=2
	var video = camera.getVideo({
		action:'record',
		media:'video',
		fps:25,
		name:'MyVideo',
		duration:8,
		nbrofframes:0
	},function(err,rq){
		
		//var data = fs.createReadStream('video.mp4').pipe(body);
		res.send("END");
		// fs.writeFile('video.mp4', body, function(err) {
		// 	if (err) throw err;
		// 	res.send("OK");
		// });		
	});
})
app.get("/frames",function(req,res){
	
	fs.readdir("./frames", function(err, files) {
	 	if(err){
	 		//throw err;
	 		console.log(err);
	 	}
	 	var count =0;
	 	var archivos =[];
	 	files.map(function(file) {
	 		return "./frames/"+file;
	 	}).filter(function(file){
	 		return fs.statSync(file).isFile();
	 	}).forEach(function(file){
	 		var ext =path.extname(file);
	 		var name=path.basename(file);
	 		var namesimple=name.replace(ext,"");
	 		// if(count<5){
	 			archivos.push(file);
	 		// }
	 		count++;
	 		//console.log("name:%s name_simple:%s ext: %s",name,namesimple,ext);
	 	});

	 	var videoOptions = {
	 	  fps: 25,
	 	  loop:0.4166666666666667,
	 	  videoBitrate: 1024,
	 	  transition: false,
	 	  disableFadeIn:true,
	 	  disableFadeOut:true,
	 	  videoCodec: 'libx264',
	 	  size: '640x?',
	 	  format: 'mp4',
	 	  pixelFormat: 'yuv420p'
	 	}
	 	console.log(archivos);
	 	videoshow(archivos,videoOptions)
	 	  .save('video.mp4')
	 	  .on('start', function (command) {
	 	      console.log('ffmpeg process started:', command)
	       })
	 	  .on('error', function () {
	 	  	res.send('Error al crear video!');
	 	  })
	 	  .on('end', function () {
	 	  	res.send('Video creado!');
	 	  })
	});
})

app.get("/savevideo",function(req,res){
	try {
		var process = new ffmpeg('./video.mp4');

		process.then(function (video) {
			video
			.save('_video.mp4', function (error, file) {
				if (!error)
					console.log('Video file: ' + file);
				res.send("Ok");
			});		

		}, function (err) {
			console.log('Error: ' + err);
		});
	} catch (e) {
		console.log(e);
		res.send("Error");
	}

})

mongoose.connect("mongodb://localhost:27017/canguro-app",(err,res)=>{
	if(err){
		console.log('Error al conectarse a la base de datos. ${err}');
	}
	console.log("conexión exitosa.");
	app.listen(9001,function(){
	  console.log("Arrancoo el Server");
	});
})