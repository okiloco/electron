/*
 * This file is generated and updated by Sencha Cmd. You can edit this file as
 * needed for your application, but these edits will have to be merged by
 * Sencha Cmd when upgrading.
 */
Ext.Ajax.on('requestcomplete', function(conn, response, options, eOpts) {
    try{
        var responseObject = Ext.JSON.decode(response.responseText);
    }catch(e){
        return Ext.Msg.alert('Error', e);
    }
});

Ext.Ajax.on('requestexception', function(conn, response, options, eOpts) {
    try{
        var responseObject = Ext.JSON.decode(response.responseText);
    }catch(e){
        return Ext.Msg.alert('Error', e);
    }
});
Ext.application({
    name: 'Electron',

    extend: 'Electron.Application',

    requires: [
        'Electron.model.Base',
        'Electron.view.main.Main',
        'Electron.helpers.Constants',
        'Electron.view.ptz.PTZ',
        'Electron.view.login.Login'
    ],
    launch: function () {

    },
    // The name of the initial view to create. With the classic toolkit this class
    // will gain a "viewport" plugin if it does not extend Ext.Viewport. With the
    // modern toolkit, the main view will be added to the Viewport.
    //
    mainView: (localStorage.user_id!=undefined)?'Electron.view.ptz.PTZ':'Electron.view.login.Login'
	
    //-------------------------------------------------------------------------
    // Most customizations should be made to Electron.Application. If you need to
    // customize this file, doing so below this section reduces the likelihood
    // of merge conflicts when upgrading to new versions of Sencha Cmd.
    //-------------------------------------------------------------------------
});
