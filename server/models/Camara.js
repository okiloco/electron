'use strict'

const mongoose = require("mongoose");
const Scheme = mongoose.Scheme;
const Camara = Scheme({
	address:String,
	port:{type:String,default:'80'},
	username:String,
	password:String,
	resolution:{type:String, default:'800x450'},
	fps:{type:Number, default:25},
	audio:{type:Number,default:0},
	videocodec:{type:String,default:'h264'},
	estado:{type:Number, default:1} //1:
});

mongoose.model("Camara",Camara);