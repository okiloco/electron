var express = require("express");
var router = express.Router();

var streaming = require("./js/videoStreaming");
var camera = streaming({
	address: '192.168.1.155',
	folder:'/public/',
	prefix:'',
	port: '80',
	username: 'root',
	password: 'root'
}); 

//DESPLIEGUE
router.get("/image/new",(req,res)=>{
	camera.requestImage({
		resolution: '1920x1080',
		compression: 30,
		rotation: 0,
		folder:'/public/images/'
	}, function(err, data) {
		if (err) throw err;
		res.send(JSON.stringify({
			success:true,
			msg:'Imagen capturada!'
		}));
	});
});
router.get("/",(req,res)=>{
	res.send("app root. "+req.session.user_id );
});
router.get("/app",(req,res)=>{
	res.send("Imagen nueva.");
});

//RECURSOS
router.route("/image/:id")
.get(function(req,res){
	res.send("Get image."+req.params.id);
});
router.route("/images")
.get(function(req,res){

});

router.get("/login",function(req,res){
	
	db.login(function(err,user){
		if(err) res.send(err);
		req.session.user_id =user._id;
		res.send("ok")
	})
});



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
	folder:'/public/videos/',
	audio:0,
	fps:25,
});

router.get("/video",(req,res,next)=>{
	var action = req.query.action;

 	video.record(req.query,function(){
		console.log("end.");
		res.send(JSON.stringify({
			success:true,
			msg:'Video creado con éxito',
			url:video.filename
		}));
		video.stop();
 	});
 	
});
router.route("/video/:action")
.get(function(req,res){
	var params = req.params,
	action = params.action;

	switch(action){
		case 'stop':
			var rec = video.stop(function(record){
				res.send(JSON.stringify({
					success:true,
					msg:'Video detenido.'
				}));
			});
		break;
	}
});

module.exports = router;