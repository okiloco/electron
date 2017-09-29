var express = require("express");
var router = express.Router();
var dateFormat = require('dateformat');
var streaming = require("./js/videoStreaming");

module.exports = function(app,db){


	db.on("ready",function(err,res){
		console.log("Ready!");
	});

	var camera = streaming({
		id_dispositivo:2,
		address: '192.168.1.155',
		folder:'/public/',
		prefix:'',
		port: '80',
		username: 'root',
		password: 'root'
	}); 

	var video = camera.createRecord({
		resolution: '800x450',
		videocodec:'h264',
		folder:'./public/videos/',
		prefix:'czbq',
		audio:0,
		fps:25,
	});

	router.get("/",(req,res)=>{
		res.send("app root. "+req.session.user_id );
	});
	router.get("/app",(req,res)=>{
		res.send("Imagen nueva.");
	});

	//RECURSOS
	router.route("/test").get(function(req,res){
		var schema = db.getModel("schema");
		schema.findOne({"name":"user"},function(err,user_schema){
			console.log("USER:: ",user_schema);
			res.send(JSON.stringify(user_schema));
		});
	});

	//Schemas
	router.route("/schema").post(function(req,res){
		
		var params = req.body;
		
		if(params.id){
			db.schema.findById(params.id,function(err,schema){
				
				schema.name = params.name;
				schema.config = JSON.stringify(params.config);

				schema.save(function(err,doc){
					res.send(JSON.stringify({
						success:true,
						msg:'Esquema actualizado con éxito. ',
						url:doc.url
					}));
				});
			});
		}else{
			db.createSchema(params.name,JSON.parse(params.config),function(success,schema){
				res.send(JSON.stringify({
					success:success,
					msg:(success)?'Esquema creado':'ya existe un esquema con el nombre '+params.name
				}));
			});	
		}	
	});
	router.route("/schemas").get(function(req,res){
		var model = db.getModel("schema");

		model.find(req.query,function(err,data){
			res.send(JSON.stringify(data));
		});
	});
	router.route("/schema/delete").get(function(req,res){
		var model = db.getModel("schema");

		model.remove(req.query,function(err,data){
			res.send(JSON.stringify(data));
		});
	});
	//Videos
	router.route("/videos").get(function(req,res){
		db.video.diHola();
		db.video.find(function(err,data){
			res.send(JSON.stringify(data));
		});
	});
	router.route("/video").post(function(req,res){
		var params = req.body;
		
		if(params.id){

			db.video.findById(params.id,function(err,video){
				
				video.filename = params.filename;
				video.url = params.url;

				video.save(function(err,doc){
					res.send(JSON.stringify({
						success:true,
						msg:'Video actualizado con éxito. ',
						url:doc.url
					}));
				});
			});
		}else{
			var model = db.video;
			var video = new model(params);
			video.save(function(err,doc){
				res.send(JSON.stringify({
					success:true,
					msg:'Video creado con éxito. ',
					url:doc.url
				}));
			});
		}
	});

	router.route("/video/delete/:id").get(function(req,res){
		if(req.params.id!=undefined){
			db.video.findByIdAndRemove(req.params.id,function(err,data){
				res.send(JSON.stringify(data));
			});
		}else{
			db.video.remove(req.query,function(err,data){
				res.send(JSON.stringify(data));
			});
		}
	});



	//Users
	router.route("/users").get(function(req,res){

		db.user.find({})
		.populate('usergroup')
		.exec(function(err,data){
			res.send(JSON.stringify(data));
		});
	});
	router.route("/user").post(function(req,res){
		var params = req.body;
		
		if(params.id){

			db.user.findById(params.id,function(err,user){
				
				user.username = params.username;
				user.password = md5(params.password);

				db.group.findById(params.usergroup,function(err,group){

				});

				//59cd6b6e2a312ffac85fac88

				user.save(function(err,doc){
					res.send(JSON.stringify({
						success:true,
						msg:'Video actualizado con éxito. ',
						url:doc.url
					}));
				});
			});
		}else{
			var model = db.user;
			var user = new model(params);
			user.save(function(err,doc){
				res.send(JSON.stringify({
					success:true,
					msg:'Video creado con éxito. ',
					url:doc.url
				}));
			});
		}
	});

	router.route("/image/:id")
	.get(function(req,res){
		res.send("Get image."+req.params.id);
	});
	router.route("/images")
	.get(function(req,res){

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


	router.get("/video",(req,res)=>{
		var action = req.query.action;
		var params = req.query;


		/*var model = db.model("user",db.getSchema("user"));

		var result = db.select({name:"user"},function(err,data){
			console.log("users: ",data);
		});*/

		
		
	 	video.record(params,function(){
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
	return router;
};