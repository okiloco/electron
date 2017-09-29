'use strict'

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Schemas = Schema({
	name:String,
	options:String,
	estado:{type:Number, default:1} //1:
});

var Schema = mongoose.model("Schemas",Schemas);

module.exports.Schemas = Schemas;