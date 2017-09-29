'use strict'
//db.usuario.insert({ username:'fvargas', password:'202cb962ac59075b964b07152d234b70',usrgroup: 1 })
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UsuarioSchema = Schema({
	username:String,
	password:String,
	usrgroup:{type:Number, default:1} //1:
});


var Usuario = mongoose.model("usuario",UsuarioSchema);

module.exports.Usuario = Usuario;