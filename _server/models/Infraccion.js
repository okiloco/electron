'use strict'

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Infraccion = Schema({
	codigo:String,
	lote:String,
	placa:String,
	direccion_infraccion:String,
	codigo_municipio:String,
	id_dispositivo:String,
	port:{type:String,default:'80'},
	username:String,
	password:String,
	resolution:{type:String, default:'800x450'},
	fps:{type:Number, default:25},
	audio:{type:Number,default:0},
	videocodec:{type:String,default:'h264'},
	estado:{type:Number, default:1} //1:
});

mongoose.model("Infraccion",Infraccion);