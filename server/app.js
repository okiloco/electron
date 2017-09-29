const express =require('express');
var md5 = require("md5");
var fs = require("fs");
var path = require("path");
var remote = require('remote');
const main = remote.require('../index.js');

/*var Model = require("./models/Model");
const db = new Model({
	dbname:'falcon-db'
}); */
var bodyParser = require("body-parser");
var session = require("express-session");
var routes = require("./routes");
var session_middleware = require("./middlewares/session");
var app = express();


const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

var User = require("./models/usuario").Usuario;

//Middlewares
app.use(bodyParser.json());//para peticiones aplication/json
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
	secret:"8e52fe2a97340624bfd3e93caf3409bf",
	resave:false,
	saveUninitialized:false
}));

//Conectarse a base de datos
const ManagerDB = require("./js/ManagerDB");
const db = ManagerDB.createManagerDB({
	dbname:'falcon-db'
});


app.use("/public",express.static("public"));
app.use("/controllers",express.static("controllers"));
// app.use("/app",session_middleware);
app.use("/app",routes(app,db));

var port = process.env.PORT || 3000;
db.connect((err,res)=>{
	if(err) throw err;
	app.listen(port,function(){
		
		//Cargar Controladores 
		var dir = './server/controllers';
		fs.readdirSync(dir).forEach(function(file){
			route = require('./controllers/'+file);
			route.controller(app,db);
		});
		console.log(main.canGame());
	  	console.log("Arranco el Server localhost:"+port);
    });
});

