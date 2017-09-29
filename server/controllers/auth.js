var md5 = require("md5");

module.exports.controller = function(app,db){

	app.get("/login",function(req,res){

		if(req.query.username!=undefined){
			
			db.login({
				"username":req.query.username,
				"password":md5(req.query.password)
			},function(err,user){
				if(err) res.send(err);

				req.session.user_id =user._id;
				res.send(JSON.stringify({
					success:true,
					user_id:user._id
				}));
			});
		}else{
			res.send("Debe iniciar session.");
		}
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