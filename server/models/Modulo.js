'use strict'

const mongoose = require("mongoose");
const Scheme = mongoose.Scheme;
const Modulo = Scheme({
	"name":String,
	"config":String,
	"estado":{"type":Number, default:1} //1:
});

mongoose.model("Modulo",Modulo);