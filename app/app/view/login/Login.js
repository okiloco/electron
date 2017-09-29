
Ext.define('Electron.view.login.Login',{
    extend: 'Ext.panel.Panel',
    requires: [
        'Electron.view.login.LoginController',
        'Electron.view.login.LoginModel'
    ],
    controller: 'login-login',
    viewModel: {
        type: 'login-login'
    },
    items:[
        {
            xtype: 'form',
            url: Constants.URL_LOGIN,
            method:'GET',
            bodyPadding: 10,    
            layout: 'anchor',
            defaults: {
                anchor: '100%'
            },
            items: [
                {
                    xtype:'fieldset',
                    title:'<h2>Acceder</h2>',
                    border:0,
                    centered: true,
                    width: '80%',
                    defaults:{
                        width:'100%',
                        padding: '5 0 5',
                    },
                    fieldDefaults: {
                        allowBlank:false
                    },  
                    items:[
                        {
                            xtype: 'textfield',
                            name: 'username',
                            height:35,
                            emptyText: 'Usuario'
                        },
                        {
                            xtype: 'textfield',
                            name: 'password',
                            height:35,
                            inputType:'password',
                            emptyText: 'Contraseña',
                            listeners: {
                                specialkey:'accederKeyEnter'
                            }
                        }
                    ]
                }
            ],

            bodyPadding: '5 5 0', 
            //bodyPadding: 10,
            width: 270,
            layout: 'anchor',
            buttonAlign: 'center',
            defaults: {
                anchor: '100%',
                allowBlank: false
            },  
            buttons: [
                {
                    text: 'Iniciar',
                    formBind: true, 
                    disabled: true,
                    columnWidth:1,
                    scale:'large',
                    cls:'btn-green',
                    submitButton:true,
                    width:'100%',
                    //iconCls:'save-icon',
                    handler: 'acceder'
                }
            ]
        }
    ]
});
