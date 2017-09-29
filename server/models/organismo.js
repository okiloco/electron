'use strict'

const mongoose = require("mongoose");
const Scheme = mongoose.Scheme;

const Organismo = Scheme({
	nombre:String,
	codigo:String,
	id_ciudad:{type:Number},
	estado:{type:Number, default:1} //1:
});

mongoose.model("Organismo",Organismo);