var session = require("express-session");
const mongoose = require("mongoose");
var md5 = require('md5');
mongoose.Promise = global.Promise;
var Schema = mongoose.Schema;
var db = {};

//var User = require("./usuario").Usuario;

function Model(options,callback){
	var self = this;
	this.models = {};
	this.schemas = {};
	this.dbname = options.dbname;
	this.host = (options.host!=undefined)?options.host:'localhost';
	this.port = (options.port!=undefined)?options.port:'27017';

	this.linkconex = "mongodb://"+this.host+':'+this.port+'/'+this.dbname;
	
} 

Model.prototype.connect = function(callback){
	var self = this;
	// if(mongoose.connection.readyState!=2){
		db = mongoose.createConnection(self.linkconex,(err,res)=>{
			if(callback!=undefined){
				callback(err,res);
			}
		});
	// }
}
Model.prototype.model = function({name,params},callback){
	var self = this;
	var model = db.model(name, self.schemas[name]);

	self.models[name] = model;
	if(callback!=undefined){
		callback(model);
	}
	return model;
}
Model.prototype.schema = function(name,options,callback){
	var self = this;
	var schema = self.schemas[name] || Schema(options);
	schema["name"] = name;
	self.schemas[name] = schema;

	if(callback!=undefined){
		callback(schema);
	}
	return schema;
}
Model.prototype.create = function({name,options}){

}
Model.prototype.login = function({name,params}){
	var self = this;
	var user = this.schema("user",{username:"String", password:"String"},function(schema){

		var model = self.model(schema.name,schema);
		model.findOne(params,function(err,user){
			if(!user){
				/*self.create({
					name:"user",
					options:{
						username:"fvargas",
						password:md5('123')
					}
				}).on("save",function(doc){
					console.log("Se creó el usuario: ",doc);			
				});*/
			}
			
			if(callback!=undefined){
				callback(err,user);
			}
		});
	});
}


module.exports = Model;