/**
* @author: Fabian Vargas Fontalvo
* email: f_varga@hotmail.com
*/
var events = require('events');//Events administra eventos
var session = require("express-session");
const mongoose = require("mongoose");
var md5 = require('md5');
mongoose.Promise = global.Promise;
var ObjectId = mongoose.Types.ObjectId;

var fs = require("fs");
var path = require("path");

// var Schema = mongoose.Schema;
var config = require("./config.json");
var str2json = require("../helpers/str2json");
var Helper = require("../helpers/helper");

var jsonfile = require("jsonfile");
exports.createManagerDB = function(options,callback) {
  return new ManagerDB(options,callback);
};

/*
* @params: options
* Tiene la responsabilidad de
* Conectarse con la base de datos,
* Cargar y crear los esquemas de la base de datos
* Registra los Esquemas y Modelos
* Administra los Eventos y funciones básicas de un Modelo.
*/
function ManagerDB(options){

	var self = this;

	this.active_group = options.active_group;
	this.url = options.url;
	//"mongodb://localhost:27017/canguro-app"
	this.setConfig = function(config){
		console.log("setConfig:: ",config,self.active_group);
		self.active_group = config[options.active_group];
		self.models = {};
		self.schemas = {};
		self.dbname = self.active_group.dbname;

		self.host = self.active_group.host;
		self.port = self.active_group.port;

		self.linkconex = "mongodb://"+self.host+':'+self.port+'/'+self.dbname;
		self.conn = mongoose.connection;
	}
	self.virtuals = options.virtuals;
	self.emit("loaded",self,config);
}

/**
* @params: name,schema
* Crea una instancia de Model de mongoose
* Devuelve el Model
+ name: String Nombre del Schema
+ schema: Object instancia de mongoose.Schema
*/
function Model(name,schema){
	console.log("new model ",name);
	var model = mongoose.model(name,schema);
	
	for(var s in schema){
		// console.log(s);
	}
	model["schema"] = schema;
	model["getSchema"] =  function(){
		return schema;
	}
	return model;
}
/**
* @params: name,config,virtuals
* Crea una instancia de Schema de mongoose
* Devuelve el Schema
+ name: String Nombre del Schema
+ config: Object Campos del Schema
+ virtuals: function (Sin uso por ahora)
*/
function Schema(name,config,virtuals){
	
	function Password(key,options){
		mongoose.SchemaType.call(this,key,options,"Password");
	}
	Password.prototype = Object.create(mongoose.SchemaType.prototype);
	Password.prototype.cast = function(val){
		var _val = md5(val);
		return _val;
	}
	mongoose.Schema.Types.Password = Password;

	//NOTA: Importante establecer las propiedades toObject y toJSON para que funcione.
	var schema = new mongoose.Schema(config,{
	    toObject: { virtuals: true },
	    toJSON: { virtuals: true }
	});
	if(virtuals!=undefined){
		if(virtuals[name]!=undefined){
			for(var key in virtuals[name]){
				var _v = virtuals[name][key];
				if(_v!=undefined){
					/*schema.virtual(_v).get(_v["get"]);
					schema.set(_v["set"]);*/	
				}
			}
		}
	}
	return schema;
}

/*Permite emitir Eventos personalizados*/
ManagerDB.prototype = new events.EventEmitter;
/*
* @params:_id
* Util para utilizar en los documentos como primary key o
* referencia de oto modelo.
* this.ObjectId(some_id);
*/
ManagerDB.prototype.ObjectId = function(_id){
	return ObjectId(_id);
};

/**
* @params options,callback
* Convierte un objeto relación con clave valor y tipo
* para campos de esquemas.  
* Los campos estan disponibles en el objeto {this.fieds}
*/
ManagerDB.prototype.parseObject = function(obj){

	var self = this;	
	for(var s in obj){
		var field = obj[s];
		// console.log("field:: ",s,":"+obj[s]);
		if(typeof(field)=='object'){
			if(Array.isArray(field)){
				// console.log("\nisArray: ",field,typeof(field));
				field.forEach(function(item,index){
					// console.log("\tindex"+index,item);
					self.parseObject(item);
				});
			}else{
				if(field.hasOwnProperty("type")){
					if(field.type=='ObjectId'){
						field.type=mongoose.Schema.Types.ObjectId;
					}
				}
				for(var k in field){
					var fieldChild = field[k];
					if(typeof(fieldChild)=='object'){
						// console.log("\tfield:: ",s);
						self.parseObject(field[s]);
					}
				}
			}

			//convert function
			if(typeof(field)=='function'){
				if(s=='convert'){
					console.log("Tiene funcion convert.");
				}
			}
		}
	}
	return obj;
}
ManagerDB.prototype.setFields = function(options,callback){
	var self = this;
	if(!self["fields"]) self["fields"]={};
	for(var s in options){
		var field = options[s];
		if(typeof(field)=='string'){
			// console.log(s+" es un string simple.");
			self["fields"][s] = {type: "String"};
		}else if(typeof(field)=='object'){

			if(Array.isArray(field)){
				// console.log(s+" es array.")
				self["fields"][s] = {type:"Array"};
				field.forEach(function(item,index){
					var fieldChild = self.setFields(item);
					// console.log("\titem:",fieldChild)
					if(fieldChild.hasOwnProperty("ref")){
						self["fields"][s]["ref"] = fieldChild.ref;
					}
				});
			}else{
				if(field.hasOwnProperty("ref")){
					// console.log(s+" es object secundario",s)
					self["fields"][s] = {type:'Object',ref:field["ref"]};
				}else{
					self["fields"][s] = {type:(field.type!=undefined)?field.type:'Object'};
					// console.log(s+" es object principal",s)
				}
			}
		}
	}
	return field;
}
/**
* @params name,options,callback
* Crea esquemas, inicializa funciones Estaticas 
* para ser usadas en el modelo para CRUD
* Esta función define los metodos search, create y delete
* Una vez instanciado el schema se emite un evento con el nombre de éste.
* Ejemplo:
* on("NOMBRE_SCHEMA",callback);
*/
ManagerDB.prototype.createSchema = function(name,options,callback){
	var self = this;
	var fields = {};
	self["fields"] = {};
	if(typeof(options)=='string'){
		options=options.replace("\n"," ");
		options = options.replace(/\\/g, "");
		try{
			options = JSON.parse(options);
		}catch(e){
			throw "Error al transformar JSON en: "+name+'\n'+e+'\n'+options;
		}
	}
	options.timestamps ={
        createdAt: 'Date',
        updatedAt: 'Date'
    };

    /*Mapping de campos del eschema*/
    var tmp_fields = this.setFields(options);
	fields = self["fields"];
	/*Objeto convertido con parametros de Schema validos para mongoose*/
	options=this.parseObject(options);

	self.emit("pre-"+name,options);
	var schema = this.getSchema(name) || Schema(name,options,self.virtuals);
	if(!schema) throw "No se pudo crear el Schema.";

	

	schema.statics.getFields = function(){
		return fields;
	};
	schema.statics.search = function(params,callback){
		if(params.id){
			this.findById(params.id,function(err,doc){
				if(!doc){
					if(callback!=undefined) callback(err,doc);
					return;
				}
				if(callback!=undefined) callback(err,doc);
				return doc;
			});
		}else{
			this.find(params,function(err,docs){
				if(callback!=undefined) callback(err,docs);
				return docs;
			});
		}
	}
	/**
	* @map: params,model,callback
	* Se encarga de mapear los parametros de entrada
	* relacionandolos con los campos del esquema.
	* Devuelve el modelo con los datos pasados.
	*/
	schema.statics.set = function(name,value){
		this[name] = value;
	}
	schema.statics.get = function(name){
		return this[name];
	}
	schema.statics.map = function(params,model,callback){
		var fields = this.getFields();
		console.log(fields);
		console.log(params);

		if(!Helper.isEmpty(fields)){
			for(var key in params){
				var field = fields[key];
				var val = params[key];
				if(field!=undefined){
					var item = {};
					if(field.type == 'Array' || field.type=='Object'){

						if(field.ref!=undefined){
							model[field.ref] = (field.type == 'Array')?[]:{};
							if(typeof(val)=='string'){
								if(field.type=='Array'){
									model[key] = [];
									item[field.ref] = ObjectId(val);
									model[key].push(item)
								}else{
									model[key]=ObjectId(val);
								}
							}else if(typeof(val)=='object'){
								model[key] = (field.type == 'Array')?[]:{};;
								val.forEach(function(record,index){
									item = {};
									item[field.ref] = ObjectId(record);
									if(field.type=='Array'){
										model[key].push(item)
									}else{
										model[key]=item;
									}
								});
							}
						}
					}else if(field.type=='String'){
						model[key] = val;
					}
				}
			}
			if(callback!=undefined) callback(model);
		}else{
			throw "Debe especificar los parametros de entrada."; 
			if(callback!=undefined) callback(model);
		}
		return model;
	}
	schema.statics.create = function(params,callback){
		var model = this;
		if(params.id){
			this.findById(params.id,function(err,doc){
				if(!doc){ if(callback!=undefined) callback("No existe registro.",doc); return;};
				model.map(params,doc,function(model){
					model.save(function(err,doc){
						if(err) throw err;
						if(callback!=undefined) callback(err,doc);
					});
				});
			});
		}else{
			model = new model({});
			this.map(params,model,function(model){
				model.save(function(err,doc){
					if(err) throw err;
					if(callback!=undefined) callback(err,doc);
				});
			});
		}
	}	
	schema.statics.query = function(params,callback){
		var query = null;
		if(params.id){
			query = this.findById(params.id,function(err,doc){
				if(!doc){
					if(callback!=undefined) callback(err,query);
					return;
				}
				if(callback!=undefined) callback(err,query);
				return query;
			});
		}else{
			query = this.find(params,function(err,docs){
				if(callback!=undefined) callback(err,query);
				return query;
			});
		}
	}
	schema.statics.remove = function(params,callback){

		if(params.id){
			this.findByIdAndRemove(params.id,function(err,doc){
				if(!doc){
					if(callback!=undefined) callback("No existe registro."); 
				}else{
					if(callback!=undefined) callback("Registro eliminado.",doc);
				}
			});
		}else{
			this.remove(params,function(err,doc){
				if(!doc){
					if(callback!=undefined) callback("No existe registro."); 
				}else{
					if(callback!=undefined) callback("Registro eliminado.",doc);
				}
			});
		}

	}
		
	this.schemas[name] = schema;
	this.schemas[name]["name"] = name;
	
	//Registra esquema en la collection schema
	if(name!="schema"){
		var model = this.getModel("schema");//obtener modelo Schema
		var params ={"name":name,"config":JSON.stringify(options)};

		model.findOne({"name":name},function(err,doc){

			if(!doc){
				//Crear Schema en base de datos
				self.create({
					name:"schema",
					lang:"es", 
					options:{"name":name,"config":JSON.stringify(options)}
				},function(){
					//Actualizar los esquemas de la base de datos
					self.refresh(function(){
						/*Event: Emite el evento Register con nombre del Schema*/
						self.emit(name,schema);
						self.emit("register",name,schema);

						console.log("Se registró el esquema: ",name+".")
						if(callback!=undefined){
							callback((!doc),schema)
						}
					});
				});
				
			}else{
				//Establecer el lenguaje del Schema
				schema["lang"] = (doc.lang!=undefined)?doc.lang:undefined;
				if(callback!=undefined){
					callback((!doc),schema)
				}
				/*Event: Emite el evento Register con nombre del Schema*/
				self.emit(name,schema);
				self.emit("register",name,schema);	
				console.log(name,"registrado.")
			}
					
		});
	}else{
		if(callback!=undefined){
			callback(false,schema)
		}
		/*Event: Emite el evento Register con nombre del Schema*/
		self.emit(name,schema);
		self.emit("register",name,schema);
	}
	return schema;
}

/**
* @params: name,schema,callback
* Crea modelos, los modelos manejan la relación con la base 
* de datos, proporcianan todos los eventos y metodos accesibles 
* en la API de mongoose.
*/
ManagerDB.prototype.createModel = function(name,schema,callback){
	console.log("\t-->",(this.getModel(name)==undefined))
	var model = this.getModel(name) || new Model(name,schema);
	this.models[name] = model; 
	this.models[name]["name"] = name;

	this[name] = model;
	if(callback!=undefined){
		callback(model);
	}
	this.emit("created");
	return model;
}
/*
* @params: {name,options},callback
+ name:String Nombre del Modelo
+ options:object Parametros del Modelo
+ callback:function Funcion de Devolución
* Crea una instancia de un modelo y guarda sus valores.
* Devuelve la instancia creada del modelo.
* Útil par crear un Schema inexistente en la base de datos.
**/
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

ManagerDB.prototype.load =  function(callback) {
	var self = this;
	jsonfile.readFile(self.url,function(err,config){
		self.setConfig(config);
		if(typeof(callback)!=undefined) callback();
	});
}
ManagerDB.prototype.register =  function(callback) {
	var self = this;
	//Crear el Esquema principal de la base de datos, que contiene todos los esquemas.
	self.createSchema("schema",{name:"String",lang:"String", config:"String"},function(err,schema){

		var model = self.createModel(schema.name,schema);

		if(err) throw err;

		//cargar Schemas de la base de Datos y generar Modelos
		model.find(function(e,docs){
			if(docs.length>0)
			{
				docs.forEach(function (doc,index) {
					//#Error Schema
					self.createSchema(doc.name,doc.config,function(err,sch){
						self.createModel(doc.name,sch,function(m){
							if(index==docs.length - 1){
								self.emit("ready",err,schema);
								if(callback!=undefined){
									callback(err,schema);
								}
							}
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
}
ManagerDB.prototype.refresh =  function(callback) {
	var self = this;

	//Registrar los schemas de la base de datos
	self.register(function(){
		console.log("refresh.");
		if(callback!=undefined){
			callback();
		}
	});
}

/**
* @params: callback
* Conecta con la base de datos MongoDB
* utilizando la propiedad linkconex de ManagerDB.
* Una vez conectado, procede a crear el esquema base
* "schema", luego crea una instancia del modelo schema.
* consulta los registros, para crear los esquemas
* y modelos de cada registro.
* La composición base de un esquema es:
+ name:String
+ config: String
* name: Representa el nombre del Schema
* config: Almacena un String en formato Json, con la
* configuración del schema.
*/
ManagerDB.prototype.connect =  function(callback) {
	var self = this;

	self.load(function(){
		mongoose.connect(self.linkconex,(err,res)=>{
			if(err){
				console.log('Error al conectarse a la base de datos.',err);
				return;
			}
			//Registrar los schemas de la base de datos
			self.register(callback);
			return self;
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
/**
*@params: callback
* Desconecta de la base de datos
*/
ManagerDB.prototype.disconnect = function(callback) {
	mongoose.disconnect(callback);
}
/**
* @params: name
* Devuelve un Schema registrado en la colección schemas de ManagerDB.
*/ 
ManagerDB.prototype.getSchema = function(name){
	var schema = this.schemas[name];
	return schema;
}
/**
* @params: name
* Devuelve un Modelo registrado en la colección models de ManagerDB.
*/ 
ManagerDB.prototype.getModel = function(name){
	return this[name];
}