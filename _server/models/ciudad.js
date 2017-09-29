'use strict'

const mongoose = require("mongoose");
const Scheme = mongoose.Scheme;

const Ciudad = Scheme({
	nombre:String,
	codigo:String,
	estado:{type:Number, default:1} //1:
});

mongoose.model("Ciudad",Ciudad);