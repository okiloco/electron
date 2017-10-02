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
// var Schema = mongoose.Schema;
var config = require("./config");
var str2json = require("../helpers/str2json");
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

	this.virtuals = {};
	this.on("prebuild",function(name,config){
		console.log("prebuild: ",name,config);
	});
}
function Model(name,schema){
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
	
	return schema;
}

//para emitir Eventos personalizados
ManagerDB.prototype = new events.EventEmitter;
ManagerDB.prototype.setVirtual = function(name,callback){
	console.log(name,callback);
}

ManagerDB.prototype.ObjectId = function(_id){
	return ObjectId(_id);
};
ManagerDB.prototype.disconnect = function(callback) {
	mongoose.disconnect();
}

/**
* @params name, options, callback
* Si el esquema no existe lo crea en la base 
* de datos
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

ManagerDB.prototype.getFields = function(options,callback){
	var self = this;
	if(!self["fields"]) self["fields"]={};
	for(var s in options){
		var field = options[s];
		if(typeof(field)=='string'){
			console.log(s+" es un string simple.");
			self["fields"][s] = {type: "String"};
		}else if(typeof(field)=='object'){

			if(Array.isArray(field)){
				console.log(s+" es array.")

				self["fields"][s] = {type:"Array"};
				field.forEach(function(item,index){
					var fieldChild = self.getFields(item);
					// console.log("\titem:",fieldChild)

					if(fieldChild.hasOwnProperty("ref")){
						self["fields"][s]["ref"] = fieldChild.ref;
					}

				});
			}else{
				if(field.hasOwnProperty("ref")){
					console.log(s+" es object secundario",s)
					// self["fields"][s] = field["ref"];
				}else{
					self["fields"][s] = {type:(field.type!=undefined)?field.type:'object'};
					console.log(s+" es object principal",s)
				}
			}
		}
	}
	return field;
}
ManagerDB.prototype.createSchema = function(name,options,callback){
	var self = this;
	var fields = {};
	self["fields"] = {};
	if(typeof(options)=='string'){
		options = options.replace(/\\/g, "");
		try{
			options = JSON.parse(options);
		}catch(e){
			throw "Error al transformar JSON en: "+name+'\n'+e+'\n'+options;
		}
	}
	console.log("--- "+name+" ---")
	
	self.getFields(options);
	fields= self["fields"];

	console.log("------- Fields ------")
	console.log(fields);
	console.log("------- End Fields ------")
	

	options.timestamps ={
        createdAt: 'Date',
        updatedAt: 'Date'
    };
	options=this.parseObject(options);
	
	var virtuals ={};

	self.emit("pre-"+name,options);
	console.log("....................");
	var schema = this.getSchema(name) || Schema(name,options,virtuals);
	self.emit("register",name,schema);

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
	
	schema.statics.create = function(params,callback){

		var model = this;
		if(params.id){
			this.findById(params.id,function(err,doc){
				
				if(callback!=undefined) callback(err,doc);



				/*doc.name = params.name;
				doc.modules = [];

				if(typeof(params.modules)=='string'){
					doc.modules.push({"module":db.ObjectId(params.modules)});
				}else if(typeof(params.modules)=='object'){
					params.modules.forEach(function(m,index){
						doc.modules.push({"module":db.ObjectId(m)});
					});
				}*/

				/*doc.save(function(err,doc){
					if(err) throw err;
					res.send(JSON.stringify({
						success:true,
						msg:'Grupo actualizado con éxito. '
					}));
				});*/
			});
		}else{

			model = new model({});
			var fields = this.getFields();

			console.log("Fields:: ",fields);
			console.log("Params:: ",params);

			//Recorrer los parametros de entrada
			for(var key in params){

				var field = fields[key],//field del schema
				param = params[key]; //parametro de entrada

				if(field!=undefined){
					if(field.type=='object' || field.type=='Array'){
						if(field.hasOwnProperty("ref")){

							if(field.type=='Array'){
								if(typeof(param)=='object'){
									param.forEach(function(val,index){
										var item ={};
										item[field.ref]=ObjectId(val);
										model[key].push(item);
									});
								}else{
									var item ={};
									item[field.ref]=ObjectId(param);
									model[key].push(item);
								}
							}else{
								if(typeof(param)=='string'){
									var item ={};
									item[field.ref]=ObjectId(param);
									model[key].push(item);
								}
							}
						}else{
							if(field.type=='Array'){
								if(typeof(param)=='object'){
									param.forEach(function(val,index){
										var item ={};
										item[key]=ObjectId(val);
										model[key].push(item);
									});
								}else{
									var item ={};
									item[key]=ObjectId(param);
									model[key].push(item);
								}
							}else{
								if(typeof(param)=='string'){
									var item ={};
									item[key]=ObjectId(param);
									model[key].push(item);
								}
							}
						}
					}else{
						model[key] = param;
					}
				}
			}
			model.save(function(err,doc){
				if(err) throw err;
				if(callback!=undefined) callback(err,doc);
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
		this.remove(params,callback);
	}

	self.emit(name,schema);

	

	if(!schema) throw "No se pudo crear el Schema.";
	
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

				/*doc.config = JSON.stringify(options);
				doc.save(function(){
					if(callback!=undefined){
						callback((!doc),schema)
					}
				});*/
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

	schema.statics.getVirtual = function (name, callback) {
	    //schema.virtual(name).get.call(schema,callback);
	};
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
	// var model = this.getModel(name) || new Model(name,schema);
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
		return self;
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


