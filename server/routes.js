var express = require("express");
var router = express.Router();
var dateFormat = require('dateformat');
var streaming = require("./js/videoStreaming");
var str2json = require("./helpers/str2json");
var md5 = require('md5');
var pluralizeES= require('pluralize-es');
var pluralizeEN = require('pluralize');
module.exports = function(app,db){

	function pluralize(lang,val){
		var _val = val;
		switch(lang){
			case "es":
				_val=pluralizeES(_val);
			break;
			case "en":
				_val=pluralizeEN(_val);
			break;
		}
		return _val;
	}
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

	/**
	* @params: name, schema
	* Crea dinamicamente las rutas para
	* Acceder a las funciones CRUD de modelos de manera Simple.
	* Se desea agregar nueva funcionalidad, debe sobre escribir las rutas
	* o crear rutas personalizadas, los esquemas estan disponibles
	* En el evento on("NOMBRE_SCHEMA",callback);
	*/
	db.on("register",function(name,schema){
		
		//Ceate / Update
		router.route("/"+name).post(function(req,res){
			var params = req.body;
			
			db[name].create(params,function(err,doc){
				if(!doc){
					res.send(JSON.stringify({"success":false,"msg":err}));
				}else{
					res.send(JSON.stringify({
						"success":true,
						"msg":(!params.id)?"Registro creado con éxito.":"Registro actualizado con éxito."
					}));
				}
			});
		});
		//Delete
		router.route("/"+name+"/delete/:id").get(function(req,res){
			db[name].remove(req.params,function(msg,doc){
				res.send(JSON.stringify({
					success:true,
					msg:msg
				}));
			});
		});
		//List
		router.route("/"+pluralize(schema.lang || "es",name)).get(function(req,res){
			db[name].search(req.query,function(err,docs){
				res.send(JSON.stringify(docs));
			});
		});
	});

	//RECURSOS
	router.route("/test").get(function(req,res){
		var group = db.getModel("group");
		var params = req.query;
		var id_modules = params.modules;
		
		var modules = [];


		if(typeof(id_modules)=='object'){
			id_modules.forEach(function(module_id,index){
				modules.push({"module":db.ObjectId(module_id)});
			});
		}else if(typeof(id_modules)=='string'){
			modules.push({"module":db.ObjectId(id_modules)});
		}
		params.modules = modules;

		if(params.id){

			db.group.findById(params.id,function(err,group){
				
				group.name = params.name;
				group.modules = params.modules;


				//59cd6b6e2a312ffac85fac88

				group.save(function(err,doc){
					res.send(JSON.stringify({
						success:true,
						msg:'Grupo actualizado con éxito. '
					}));
				});
			});
		}else{
			var model = db.group;
			
			console.log(params.modules);
			var group = new model(params);
			group.save(function(err,doc){
				res.send(JSON.stringify({
					success:true,
					msg:'Grupo creado con éxito. '
				}));
			});
		}

		/*group.findOneById({"name":"user"},function(err,user_schema){
			console.log("USER:: ",user_schema);
			res.send(JSON.stringify(user_schema));
		});*/
	});

	//Schemas
	db.on("schema",function(schema){

		router.route("/schema").post(function(req,res){
			
			var params = req.body;
			
			if(params.id){
				db.schema.findById(params.id,function(err,schema){
					
					if(!schema){
						res.send(JSON.stringify({
							success:false,
							msg:'Esquema no existe.',
						}));
						return;
					}

					schema.name = params.name;
					schema.config = params.config;

					schema.save(function(err,doc){
						res.send(JSON.stringify({
							success:true,
							msg:'Esquema actualizado con éxito. ',
							url:doc.url
						}));
					});
				});
			}else{
				db.createSchema(params.name,params.config,function(success,schema){
					res.send(JSON.stringify({
						success:success,
						msg:(success)?'Esquema creado':'ya existe un esquema con el nombre '+params.name
					}));
				});	
			}	
		});
		router.route("/schemas").get(function(req,res){
			db.schema.search(req.query,function(err,docs){
				res.send(JSON.stringify(docs));
			});
		});
		router.route("/schema/delete").get(function(req,res){
			var model = db.getModel("schema");

			model.remove(req.query,function(err,data){
				res.send(JSON.stringify(data));
			});
		});
	});

	//Videos
	db.on("video",function(schema){
		router.route("/video").post(function(req,res){
			var params = req.body;
			
			db[name].create(params,function(err,doc){
				if(!doc){
					res.send(JSON.stringify({"success":false,"msg":err}));
				}else{
					res.send(JSON.stringify({
						"success":true,
						"msg":(!params.id)?"Registro creado con éxito.":"Registro actualizado con éxito."
					}));
				}
			});
		});
		router.route("/videos").get(function(req,res){
			var params = req.query;
			db.video.query(req.query,function(err,query){
				query.populate('creator','_id')
				.select('_id filename creator url')
				.exec(function(err,data){
					res.send(JSON.stringify(data));
				});
			});
		});
	});

	//Modules
	db.on("module",function(schema){
		//Ejemplo de Virtual
		schema.virtual("alias").get(function(){
			return (this.name)?"widget-"+this.name:undefined;
		});
		router.route("/modules").get(function(req,res){
			var params = req.query;
			db.module.find(params,function(err,data){
				res.send(JSON.stringify(data));
			});
		});
	});

	//Users
	db.on("user",function(schema){
		router.route("/users").get(function(req,res){
			db.user.query(req.query,function(err,query){
				query.populate('usergroup')
				.select('username usergroup modules')
				.exec(function(err,data){
					res.send(JSON.stringify(data));
				});
			});
		});
		router.route("/user").post(function(req,res){
			var params = req.body;
			
			if(params.password!=undefined){
				params.password=md5(params.password)
			};
			db.user.create(params,function(err,doc){
				if(!doc){
					res.send(JSON.stringify({"success":false,"msg":err}));
				}else{
					res.send(JSON.stringify({
						"success":true,
						"msg":(!params.id)?"Usuario creado con éxito.":"Usuario actualizado con éxito."
					}));
				}
			});
		});
	});

	//Groups
	db.on("group",function(schema){

		router.route("/groups").get(function(req,res){
			
			db.group.query(req.query,function(err,query){
				
				query.populate('modules')
				.populate('modules.module')
				.exec(function(err,data){
					res.send(JSON.stringify(data));
				});
			});
		});

		router.route("/group/new").post(function(req,res){
			
			db.group.create(req.body,function(err,doc){
				console.log("Creación callback.")
				res.send(JSON.stringify({
					success:true,
					msg:"Created testing"
				}));
			});
		});
	});
	
	/*
	* Recurso para crear y editar modelos dinamicamente
	* @params
	* model (nombre del modelo)
	* Campos dinamicos del modelo
	*/
	router.route("/create/model").post(function(req,res){
		var params = req.body;

		db[req.body.model].create(params,function(err,doc){
			console.log("Creación callback.")
			res.send(JSON.stringify({
				success:true,
				msg:"Created testing"
			}));
		});
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