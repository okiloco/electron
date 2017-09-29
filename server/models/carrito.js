'use strict'

const mongoose = require("mongoose");
const Scheme = mongoose.Scheme;
const Carrito = Scheme({
	codigo:String,
	placa:String,
	id_dispositivo:String,
	estado:{type:Number, default:1} //1:
});

mongoose.model("Carrito",Carrito);

module.exports.Carrito = Carrito;