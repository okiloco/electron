Ext.define('Electron.view.login.LoginController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.login-login',
    acceder:function(self){
    	var form = self.up('form');
    	if (form.isValid()) {
    	    form.submit({
    	        waitMsg: 'Procesando solicitud...',
    	        success: function(f, action) {
    	            var res = action.result;
                    console.log(res);
    	            localStorage.user_id =res.user._id;
    	            location.reload();
    	        },
    	        failure: function(f, action) {
    	            Ext.Msg.show({
    	                title: 'Error',
    	                msg: action.result.msg,
    	                buttons: Ext.Msg.OK,
    	                icon: Ext.Msg.ERROR                    
    	            });
    	        }
    	    });
    	}
    },
    accederKeyEnter:function(field,e){
        if (e.getKey() == e.ENTER) {
           this.acceder(field);
        }
    }
});
