var express = require("express");
var router = express.Router();
var dateFormat = require('dateformat');
var streaming = require("./js/videoStreaming");
var str2json = require("./helpers/str2json");
var md5 = require('md5');
module.exports = function(app,db){

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

		console.log(schema.obj);



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
		router.route("/video").post(function(req,res){
			var params = req.body;
			
			if(params.id){

				db.video.findById(params.id,function(err,video){
					
					if(!video){
						res.send(JSON.stringify({
							success:false,
							msg:'Video no existe.',
						}));
						return;
					}

					video.filename = params.filename;
					video.url = params.url;
					video.creator = db.ObjectId(params.creator);

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
				video.creator = db.ObjectId(req.session.user_id);

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
					if(!data) res.send(JSON.stringify({success:false, msg:"El registro no existe."}));
					res.send(JSON.stringify({
						success:true,
						msg:"Registro eliminado."
					}));
				});
			}else{
				db.video.remove(req.query,function(err,data){
					if(!data) res.send(JSON.stringify({success:false, msg:"El registro no existe."}));
					res.send(JSON.stringify({
						success:true,
						msg:"Registro eliminado."
					}));
				});
			}
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
		router.route("/module").post(function(req,res){
			var params = req.body;
			
			if(params.id){

				db.module.findById(params.id,function(err,module){
					
					if(!module){
						res.send(JSON.stringify({
							success:false,
							msg:'Modulo no existe.',
						}));
						return;
					}

					module.name = params.name;
					module.config = params.config;

					module.save(function(err,doc){
						res.send(JSON.stringify({
							success:true,
							msg:'Modulo actualizado con éxito. ',
							url:doc.url
						}));
					});
				});
			}else{
				var model = db.module;
				var module = new model(params);
				module.save(function(err,doc){
					res.send(JSON.stringify({
						success:true,
						msg:'Modulo creado con éxito. ',
						url:doc.url
					}));
				});
			}	
		});
		router.route("/module/delete/:id").get(function(req,res){
			if(req.params.id!=undefined){
				db.module.findByIdAndRemove(req.params.id,function(err,data){
					if(!data) res.send(JSON.stringify({success:false, msg:"El registro no existe."}));
					res.send(JSON.stringify({
						success:true,
						msg:"Registro eliminado."
					}));
				});
			}else{
				db.module.remove(req.query,function(err,data){
					if(!data) res.send(JSON.stringify({success:false, msg:"El registro no existe."}));
					res.send(JSON.stringify({
						success:true,
						msg:"Registro eliminado."
					}));
				});
			}
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
			
			//OTRAS FORMAS DE USO
			/*var params = req.query;
			db.user.find(params)
			.populate('usergroup')
			.populate('modules usergroup.modules')
			.exec(function(err,data){
				res.send(JSON.stringify(data));
			});*/

			/*db.user.find({}, function(err, users) {
		    	db.group.populate(users, {path: "usergroup"},function(err, users){
		    		db.module.populate(users,{path:"usergroup modules"},function(err,users){
		        		res.send(JSON.stringify(users));
		    		})
		        }); 
		    });*/
		});
		router.route("/user").post(function(req,res){
			var params = req.body;
			
			if(params.password!=undefined){params.password=md5(params.password)};
			if(params.id){

				db.user.findById(params.id,function(err,user){

					if(!user){
						res.send(JSON.stringify({
							success:false,
							msg:'Usuario no existe.',
						}));
						return;
					}

					user.username = params.username;
					user.password = md5(params.password);

					db.group.findById(params.usergroup,function(err,group){

					});

					//59cd6b6e2a312ffac85fac88

					user.save(function(err,doc){
						res.send(JSON.stringify({
							success:true,
							msg:'Usuario actualizado con éxito. ',
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
						msg:'Usuario creado con éxito. ',
						url:doc.url
					}));
				});
			}
		});
		router.route("/user/delete/:id").get(function(req,res){
			if(req.params.id){
				db.user.findByIdAndRemove(req.params.id,function(err,data){
					if(!data) res.send(JSON.stringify({success:false, msg:"El registro no existe."}));
					res.send(JSON.stringify({
						success:true,
						msg:"Registro eliminado."
					}));
				});
			}else{
				db.user.remove(req.query,function(err,data){
					if(!data) res.send(JSON.stringify({success:false, msg:"El registro no existe."}));
					res.send(JSON.stringify({
						success:true,
						msg:"Registro eliminado."
					}));
				});
			}
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
		router.route("/group").post(function(req,res){
			var params = req.body;
			
			if(params.id){
				db.group.findById(params.id,function(err,group){
					group.name = params.name;
					group.modules = [];
					if(typeof(params.modules)=='string'){
						group.modules.push({"module":db.ObjectId(params.modules)});
					}else if(typeof(params.modules)=='object'){
						params.modules.forEach(function(m,index){
							group.modules.push({"module":db.ObjectId(m)});
						});
					}
					group.save(function(err,doc){
						if(err) throw err;
						res.send(JSON.stringify({
							success:true,
							msg:'Grupo actualizado con éxito. '
						}));
					});
				});
			}else{
				var model = db.group;
				var group = new model({name:params.name});
				if(typeof(params.modules)=='string'){
					group.modules.push({"module":db.ObjectId(params.modules)});
				}else if(typeof(params.modules)=='object'){
					params.modules.forEach(function(m,index){
						group.modules.push({"module":db.ObjectId(m)});
					});
				}

				group.save(function(err,doc){
					if(err) throw err;
					res.send(JSON.stringify({
						success:true,
						msg:'Grupo creado con éxito. '
					}));
				});
			}
		});
		router.route("/group/delete/:id").get(function(req,res){
			if(req.params.id!=undefined){
				db.group.findByIdAndRemove(req.params.id,function(err,data){
					res.send(JSON.stringify({
						success:true,
						msg:"Registro eliminado."
					}));
				});
			}else{
				db.group.remove(req.query,function(err,data){
					res.send(JSON.stringify({
						success:true,
						msg:"Registro eliminado."
					}));
				});
			}
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
	});

	//Image
	db.on("image",function(schema){

		router.route("/image/delete/:id")
		.get(function(req,res){
			if(req.params.id!=undefined){
				db.image.findByIdAndRemove(req.params.id,function(err,data){
					res.send(JSON.stringify({
						success:true,
						msg:"Registro eliminado."
					}));
				});
			}else{
				db.image.remove(req.query,function(err,data){
					res.send(JSON.stringify({
						success:true,
						msg:"Registro eliminado."
					}));
				});
			}
		});

		router.route("/image")
		.post(function(req,res){

			var params = req.body;
			// params["creator"] = db.ObjectId(req.session.user_id);
			
			if(params.id){

				db.image.findById(params.id,function(err,image){

					if(!image){
						res.send(JSON.stringify({
							success:false,
							msg:'Registro no existe.',
						}));
						return;
					}

					image.filename = params.filename;
					image.url = params.url;

					image.save(function(err,doc){
						res.send(JSON.stringify({
							success:true,
							msg:'Registro actualizado con éxito. ',
							url:doc.url
						}));
					});
				});
			}else{
				var model = db.image;
				var image = new model(params);
				image.save(function(err,doc){
					res.send(JSON.stringify({
						success:true,
						msg:'Registro creado con éxito. ',
						url:doc.url
					}));
				});
			}
		});

		router.route("/images")
		.get(function(req,res){

			db.image.query(req.query,function(err,query){
				query.populate('creator','_id')
				.select('_id filename creator url')
				.exec(function(err,data){
					res.send(JSON.stringify(data));
				});
			});
			/*db.image.que(req.query,function(err,data){
				res.send(JSON.stringify(data));
			});*/
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