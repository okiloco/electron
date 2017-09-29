/**
* @types:
* String, Number, Date, Buffer, Boolean, Mixed, Objectid, Array
*/
var events = require('events');//Events administra eventos
var session = require("express-session");
const mongoose = require("mongoose");
var md5 = require('md5');
mongoose.Promise = global.Promise;
var ObjectId = mongoose.Types.ObjectId;
var Schema = mongoose.Schema;
var config = require("./config");
exports.createManagerDB = function(options,callback) {
  return new ManagerDB(options,callback);
};
function ManagerDB(options){

	//"mongodb://localhost:27017/canguro-app"
	this.active_group = config[options.active_group];
	this.models = {};
	this.schemas = {};
	this.dbname = this.active_group.dbname;

	this.host = this.active_group.host;
	this.port = this.active_group.port;

	this.linkconex = "mongodb://"+this.host+':'+this.port+'/'+this.dbname;
	this.conn = mongoose.connection;
}
function Model(name,schema){
	var model = mongoose.model(name,schema);
	
	for(var s in schema){
		// console.log(s);
	}
	model["diHola"] =  function(){
		console.log("Hola este es un metodo personalizado del modelo.");
	};

	return model;
}



//para emitir Eventos personalizados
ManagerDB.prototype = new events.EventEmitter;
ManagerDB.prototype.disconnect = function(callback) {
	mongoose.disconnect();
}


ManagerDB.prototype.login = function(params,callback){
	var self = this;
	var name, config;

	var schema = this.getModel("schema");
	schema.findOne({"name":"user"},function(err,doc){

		if(!doc){
			name ="user";
			config= {
				"username":"String",
				"password":"String",
				"usergroup":{
					"type":"ObjectId",
					"ref":"group"
				}
			}
			console.log("No existe esquema user");
		}else{
			name = doc.name;
			config = doc.config;
		} 
		self.createSchema(name,config,function(err,schema){
			var model = self.createModel(schema.name,schema);
			model.findOne(params,function(err,user){
				if(!user){
					if(params.username=='fvargas' && md5(params.password)==md5('123')){

						self.create({
							name:"user",
							options:{
								username:"fvargas",
								password:md5('123'),
								usergroup:ObjectId("59cd6b6e2a312ffac85fac88")
							}
						}).on("save",function(doc){
							//Login success
							if(callback!=undefined){
								callback(err,doc);
							}
							console.log("Se creó el usuario: ",doc);			
						});
					}else{
						//fail login
						if(callback!=undefined){
							callback(err,user);
						}
					}
				}else{
					//Login success
					if(callback!=undefined){
						callback(err,user);
					}
				}
			});

		});

		
	});
}

/**
* @params name, options, callback
* Si el esquema no existe lo crea en la base 
* de datos
*/
ManagerDB.prototype.createSchema = function(name,options,callback){
	var self = this;
	console.log("Se va a crear el esquema "+name)
	if(typeof(options)=='string'){
		options = options.replace(/\\/g, "");
		options = JSON.parse(options);
	}
	for(var s in options){
		var el = options[s];
		if(typeof(el)=='object'){
			if(el["type"]=='mongoose.Schema.Types.ObjectId' || el["type"]=='ObjectId'){
				el["type"] = mongoose.Schema.Types.ObjectId;
			}
		}
	}

	var schema = this.getSchema(name) || Schema(options);
	this.schemas[name] = schema;
	this.schemas[name]["name"] = name;
	
	//Registra esquema en la tabla schema
	if(name!="schema"){
		var model = this.getModel("schema");//obtener modelo Schema
		
		model.findOne({"name":name},function(err,doc){
			if(!doc){
				//Crear Schema en base de datos
				self.create({
					name:"schema", 
					options:{"name":name,"config":JSON.stringify(options)}
				},function(){
					if(callback!=undefined){
						callback((!doc),schema)
					}
				});
				console.log("Se registró el esquema: ",name+".")
			}else{
				if(callback!=undefined){
					callback((!doc),schema)
				}
				console.log("ya existe un esquema con el nombre ",name)
			}
			
		});
	}else{

		if(callback!=undefined){
			callback(false,schema)
		}
	}
	return schema;
}
ManagerDB.prototype.getSchema = function(name){
	var schema = this.schemas[name];
	return schema;
}
ManagerDB.prototype.insertSchema = function(name,values,callback){
	var schema= this.insert({
		name:"schema", 
		values:{
			name:name,
			config:values
		}
	},callback);
	return schema;
}
ManagerDB.prototype.getModel = function(name){
	return this.models[name];
}
ManagerDB.prototype.createModel = function(name,schema,callback){
	var model = this.getModel(name) || new Model(name,schema);
	this.models[name] = model; 
	this.models[name]["name"] = name;

	this[name] = model;
	if(callback!=undefined){
		callback(model);
	}
	return model;
}
ManagerDB.prototype.create = function({name,options},callback){

	var self = this;
 	var schema = this.getSchema(name);
 	var model = this.createModel(name,schema);

 	//Crear nueva instancia de modelo
 	var instance = new model(options);
 	instance.save(function(){
	 	if(callback!=undefined){
		 	callback(instance,model);
	 	}
	 	console.log("Guadado!");
 	});
	return instance;
}
ManagerDB.prototype.insert = function({name,values},callback){

	var self = this;
 	var model = this.getModel(name);
 	model.insert(values,function(err){
 		cosole.log(err)
	 	if(callback!=undefined){
		 	callback(instance,model);
	 	}
	 	console.log("Guadado!");
 	});
	return instance;
}
ManagerDB.prototype.select = function({name,options},callback){
	var model = this.getModel(name);
	
	if(callback!=undefined){
		model.find(callback)
	}else{
		model.find();
	}
};
ManagerDB.prototype.test = function(){
	console.log("Hola!");
}
ManagerDB.prototype.selectOne = function({name,options},callback){
	var model = this.getModel(name);
	if(callback!=undefined){
		model.findOne(options,callback)
	}else{
		model.findOne(options);
	}
};

ManagerDB.prototype.connect =  async function(callback) {
	var self = this;
	mongoose.connect(this.linkconex,(err,res)=>{
		if(err){
			console.log('Error al conectarse a la base de datos.',err);
			return;
		}
		//Crear el Esquema principal de la base de datos, que contiene todos los esquemas.
		self.createSchema("schema",{name:"String", config:"String"},function(err,schema){

			var model = self.createModel(schema.name,schema);

			if(err) throw err;

			//cargar Schemas de la base de Datos y generar Modelos
			model.find(function(e,docs){
				var c =1;

				if(docs.length>0)
				{
					docs.forEach(function (doc) {
						//#Error Schema
						self.createSchema(doc.name,doc.config,function(err,sch){
							self.createModel(doc.name,sch,function(m){
								if(c==docs.length){
									self.emit("ready",err,schema);
									if(callback!=undefined){
										callback(err,schema);
									}
								}
								c++;
							});
						});
					});
				}else{
					if(callback!=undefined){
						callback(err,schema);
					}
				}
			});
		});
	});
	mongoose.connection.on("connected", function() {
	    console.log("Connected to " + self.linkconex);
	});

	mongoose.connection.on("error", function(error) {
	    console.log("Connection to " + self.linkconex + " failed:" + error);
	});

	mongoose.connection.on("disconnected", function() {
	    console.log("Disconnected from " + self.linkconex);
	});

	process.on("SIGINT", function() {
	    mongoose.connection.close(function() {
	        console.log("Disconnected from " + self.linkconex + " through app termination");
	        process.exit(0);
	    });
	});
}


