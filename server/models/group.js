'use strict'

const mongoose = require("mongoose");
const Scheme = mongoose.Scheme;

const Group = Scheme({
	name:String,
	estado:{type:Number, default:1} //1:
});

mongoose.model("Group",Group);