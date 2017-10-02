var md5 = require("md5");

module.exports.controller = function(app,db){

	app.get("/login",function(req,res){

		if(!db.user){
			res.send(JSON.stringify({
				success:false,
				msg:'No se ha creado el esquema user <br>Contacte con el administrador.'
			}));
		}else{

			db.user.findOne({
				"username":req.query.username,
				"password":md5(req.query.password)
			},'_id username usergroup')
			.populate('usergroup')
			.exec(function(err,user){
				if(user!=null){
					req.session.user_id =user._id;
					res.locals.user = user;
					/*db.set("user_id",user._id);
					db.set("_user",user);*/
				}
				res.send(JSON.stringify({
					success:(user!=null),
					msg:(user!=null)?'Acceso permitido.':'Usuario o contraseña son inválidos.',
					user
				}));
			});
		};		
	});

	app.get("/logout",function(req,res){
		req.session.destroy(function(err){
			if(err) res.send(err);
			res.send(JSON.stringify({
				success:true,
				msg:"Session finalizada."
			}));
		});
	});
}