/**
* @types:
* String, Number, Date, Buffer, Boolean, Mixed, Objectid, Array
*/
var session = require("express-session");
const mongoose = require("mongoose");
var md5 = require('md5');
mongoose.Promise = global.Promise;
var Schema = mongoose.Schema;

exports.createManagerDB = function(options) {
  return new ManagerDB(options);
};
function ManagerDB(options){

	//"mongodb://localhost:27017/canguro-app"
	this.models = {};
	this.schemas = {};
	this.dbname = options.dbname;
	this.host = (options.host!=undefined)?options.host:'localhost';
	this.port = (options.port!=undefined)?options.port:'27017';

	this.linkconex = "mongodb://"+this.host+':'+this.port+'/'+this.dbname;
}
function Model(name,schema){
	var model = mongoose.model(name,schema);
	
	for(var s in schema){
		// console.log(s);
	}

	return model;
}
ManagerDB.prototype.connect = function(callback) {
	var self = this;
	mongoose.connect(this.linkconex,(err,res)=>{
		if(err){
			console.log('Error al conectarse a la base de datos. ${err}');
			return;
		}
		console.log("conexión exitosa.");

		/*var user = this.create({
			name:"user",
			options:{"name":"fvargas", "email":"test@test.com"}
		}).on("save",function(doc){

			self.select({name:"user", _id:doc._id},function(err,doc){
				console.log("ok",doc);
			});
		});*/

		var sch = this.createSchema("schema",{name:"String", config:"String"},function(schema){
			self.createModel(schema.name,schema);
		});
		if(callback!=undefined){
			callback(err,res);
		}
		//this.login(callback);
		/*this.create({
			name:"schema", 
			options:{
				name:name,
				options:options
			}
		}).on("save",function(){
			console.log("Se guardó. ",name);
		});*/

		

	})
}
ManagerDB.prototype.login = function(params,callback){
	var self = this;
	var test = this.createSchema("user",{username:"String", password:"String"},function(schema){

		var model = self.createModel(schema.name,schema);
		model.findOne(params,function(err,user){
			if(!user){
				self.create({
					name:"user",
					options:{
						username:"fvargas",
						password:md5('123')
					}
				}).on("save",function(doc){
					console.log("Se creó el usuario: ",doc);			
				});
			}
			
			if(callback!=undefined){
				callback(err,user);
			}
		});
	});
}
ManagerDB.prototype.createSchema = function(name,options,callback){
	var self = this;
	var schema = this.getSchema(name) || Schema(options);
	this.schemas[name] = schema;
	this.schemas[name]["name"] = name;
	
	if(callback!=undefined){
		callback(schema)
	}
	//Registra esquema en la tabla schema
	if(name!="schema"){
		var model = this.getModel("schema");
		
		model.findOne({"name":name},function(err,doc){
			if(!doc){
				self.create({
					name:"schema", 
					options:{"name":name,"config":JSON.stringify(options)}
				});
				console.log("Se registró el esquema: ",name+".")
			}else{
				console.log("ya existe un esquema con el nombre ",name+":",JSON.parse(doc.config))
			}
		});
	}
	return schema;
}
ManagerDB.prototype.getSchema = function(name){
	return this.schemas[name];
}
ManagerDB.prototype.getModel = function(name){
	return this.models[name];
}
ManagerDB.prototype.createModel = function(name,schema){
	var model = this.getModel(name) || new Model(name,schema);
	this.models[name] = model; 
	this.models[name]["name"] = name;
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
ManagerDB.prototype.select = function({name,options},callback){
	var model = this.getModel(name);
	if(callback!=undefined){
		model.find(callback)
	}else{
		model.find();
	}
};
ManagerDB.prototype.selectOne = function({name,options},callback){
	var model = this.getModel(name);
	if(callback!=undefined){
		model.findOne(options,callback)
	}else{
		model.findOne(options);
	}
};


