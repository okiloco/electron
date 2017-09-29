Ext.define('Electron.view.ptz.PTZController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.ptz-ptz',
    capturarImagen:function(self,e,eOpts){
        Ext.Ajax.request({
        	scope: this,
        	url: Constants.URL_CAPTURAR_IMAGEN,
        	params: {
        		
        	},
        	success: function(response) {
        		var responseObject = Ext.decode(response.responseText);
        		Ext.Msg.show({
        		    title: 'Aviso',
        		    msg: responseObject.msg,
        		    buttons: Ext.Msg.OK,
        		    icon: Ext.Msg.INFO                    
        		});		
        	},
        	failure: function(response) {
        		Ext.Msg.show({
        			title: 'Error',
        			msg: 'Error al procesar la petición.',
        			buttons: Ext.Msg.OK,
        			icon: Ext.Msg.ERROR
        		});
        	}
        });
    },
    recordVideo:function(btn,params,playing){

		var me = this;
		var vm = me.getViewModel();
		var timer = Ext.fly('timer');

		if(params.duration!=undefined){
			var seg = params.duration;
			vm.set("time",seg);
			timer.setHtml("Grabando "+seg+"s");
			
			//Disparar Evento playing
			btn.fireEvent("playing",btn,playing);
			var interval = setInterval(function(){ 
				seg--;
				playing = (seg>=0);
				vm.set("playing",playing);
				
				if(!playing){
					timer.setHtml("");
					me.stopVideo(btn,playing);
				}else{
					vm.set("time",seg);
				}
				timer.setHtml("Grabando "+vm.get("time")+"s");
				//Disparar Evento playing
				btn.fireEvent("playing",btn,playing);
			}, 1000);
			vm.set("interval",interval);
		}else{
			vm.set("playing",playing);
			btn.fireEvent("playing",btn,playing);
			timer.setHtml("Grabando ");
		}

		Ext.create('Ext.form.Panel', {
	       standardSubmit: false
	    }).getForm().submit({
	       url: Constants.URL_GRABAR_VIDEO,
	       method:'GET',
	       params:params,
	       success: function(form, action) {
	       	console.log("Video terminado. ",playing,btn.name);
           },
           failure: function(form, action) {
               switch (action.failureType) {
                   case Ext.form.action.Action.CLIENT_INVALID:
                       Ext.Msg.alert('Failure', 'Form fields may not be submitted with invalid values');
                       break;
                   case Ext.form.action.Action.CONNECT_FAILURE:
                       Ext.Msg.alert('Failure', 'Ajax communication failed');
                       break;
                   case Ext.form.action.Action.SERVER_INVALID:
	                  me.stopVideo(btn,false);	
	                  Ext.Msg.show({
	                      title: 'Error',
	                      msg: action.result.msg,
	                      buttons: Ext.Msg.OK,
	                      icon: Ext.Msg.ERROR,
	                      fn:me.clearSesion                    
	                  });
              }
           }
	    });
		console.log("Grabar video",params);
    },
    clearSesion:function(){
    	localStorage.clear();
    	location.reload();
    },
    stopVideo:function(self,playing){
    	var me =this,
    	sign= Ext.fly("recIndicator");
    	var vm = this.getViewModel();

    	console.log("Detener Video.",playing);
    	// if(vm.set("playing")){
	    	vm.set("playing",false);
	    	Ext.Ajax.request({
	    		scope: this,
	    		method:'GET',
	    		url : Constants.URL_DETENER_VIDEO,
	    		success: function(response) {
	    			var responseObject = Ext.decode(response.responseText);
	    			me.enableButtons(self,playing,true);
	    			//Disparar Evento playing
	    			self.fireEvent("playing",self,playing);
	    		},
	    		failure: function(response) {
	    			me.stopVideo(self,playing);
	    		}
	    	});
    	// }
    },
    onPlaying:function(self,playing){

    	var sign= Ext.fly("recIndicator");
		var vm = this.getViewModel();
		vm.set("playing",playing);

    	if(playing){
			console.log(vm.get("time"));
    		sign.removeCls("recIndicator-hidden");
    	}else{
    		sign.addCls("recIndicator-hidden");
			clearInterval(vm.get("interval"));
    	}
    },
    onToggle:function(self, pressed, eOpts){
    	console.log("onToggle: ",pressed);
    },
    onRecorVideo:function(self, e, eOpts){

    	var vm = this.getViewModel();
    	var pressed = self.pressed;
    	
    	if(self.enableToggle){
	    	//Habilitar Botones
	    	this.enableButtons(self,pressed);
		 	if(pressed){
		 		var params ={action:"record"};
			    switch(self.name){
			    	case '8segundos':
			    		params["duration"] = 8;
			    		self["mode"] = 'auto';
			    	break;
			    	case 'grabar':
			    		console.log(self.name);
			    	break;
			    }
			    if(!vm.get("playing")){
				    this.recordVideo(self,params,pressed);
				}
		 	}else{
	 			this.stopVideo(self,pressed);
	 			return false;
		 	}
    	}
    },
    enableButtons:function(self,pressed,all){
    	var view = this.getView();
    	all = all || false;

	 	Ext.Array.each(view.down("toolbar[dock=top]").query("button"), function(btn, index, total) {
	 		if(!all){
		 		if(btn.enableToggle && btn !=self){
	    	      btn.setDisabled(pressed);
		 		}
		 	}else{
		 		if(btn.enableToggle){
		 			btn.setDisabled(pressed);
		 			btn.toggle(pressed);
		 		}
		 	}
	    });
    }
});
