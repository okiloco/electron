'use strict'

const mongoose = require("mongoose");
const Scheme = mongoose.Scheme;

const UsuarioScheme = Scheme({
	username:String,
	password:String,
	usrgroup:{type:Number, default:1} //1:
});

mongoose.model("Usuario",UsuarioScheme);