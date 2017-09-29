Ext.define('Electron.view.ptz.PTZModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.ptz-ptz',
    data: {
        name: 'Electron',
        time:0,
        interval:null,
        playing:false,
        images:[
        	{
        		name:'Imagen 01',
        		src:Constants.URL_ICON_IMAGEN_EMPTY,
        		iconCls:"empty"
        	},
        	{
        		name:'Imagen 02',
        		src:Constants.URL_ICON_IMAGEN_EMPTY,
        		iconCls:"empty"
        	},
        	{
        		name:'Imagen 03',
        		src:Constants.URL_ICON_IMAGEN_EMPTY,
        		iconCls:"empty"
        	},
        	{
        		name:'Imagen 04',
        		src:Constants.URL_ICON_IMAGEN_EMPTY,
        		iconCls:"empty"
        	}
        ],
    },
    stores:{
    	imagenStore: {
    		model: 'Base',
    		autoLoad: false,
    		pageSize: 4,
			data:'{images}',
    		/*proxy: {
    			type: 'ajax',
    			timeout:600000,
    			url: constants.URL_LISTAR_SEGUIMIENTO_COMPARENDOS,
    			reader: {
    				type:'json',
    				rootProperty:'data',
    			},
    			actionMethods:{
    				read:'POST'
    			}
    		},*/
    		listeners: {
    			// load: 'onLoadistadoinfraccionrechazadasstore'
    		}
    	},
    	toolStore: {
    		model: 'Base',
    		autoLoad: false,
			data:[
				/*{
					text:'8s...',
					cls:'time'
				},*/
			],
    		listeners: {
    			// load: 'onLoadistadoinfraccionrechazadasstore'
    		}
    	}
    }

});
