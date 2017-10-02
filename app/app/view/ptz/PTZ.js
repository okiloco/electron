
Ext.define('Electron.view.ptz.PTZ',{
    extend: 'Ext.panel.Panel',
    alias:['widget.ptz'],
    requires: [
        'Electron.view.ptz.PTZController',
        'Electron.view.ptz.PTZModel'
    ],

    controller: 'ptz-ptz',
    viewModel: {
        type: 'ptz-ptz'
    },
    flex:1,
    layout: {
        type:'border',
    },
    margin:5,
    bodyPadding:5,
    initComponent: function() {
        var me = this;

        Ext.apply(me, {
            items:[
                {
                    xtype:'dataview',
                    region:'center',
                    cls:'viewer',
                    itemSelector: 'div.viewer-tools .item',
                    bind:{
                        store:'{toolStore}',
                    },
                    tpl: new Ext.XTemplate(
                        '<div class="viewer-tools">',
                        '<div id="recIndicator" class="rec recIndicator-hidden">',
                           '<div class="sign">',
                            '<span id="timer">Grabando</span>',
                            '<span class="circle"></span>',
                           '</div>',
                        '</div>',
                        '<tpl for=".">',
                            '<div class="item">',
                                '<span class="text">{text}</span>',
                            '</div>',
                        '</tpl>',
                        '</div>',
                        '<div class="image">',
                            '<img src="'+ Constants.URL_VIEWER+'" style="width:100%; height:100%;" frameborder="0"/>',
                        '</div>',
                        '<div class="viewer-footer">',
                            '<span id="timer">{time}</span>',
                        '</div>'
                    )
                },
                {
                    xtype:'dataview',
                    cls:'preview',
                    itemSelector: 'div.thumb-wrap',
                    region:'east',
                    emptyText: 'No se han capturado fotografias',
                    bind:{
                        store:'{imagenStore}'
                    },
                    flex:.3,
                    layout:{
                        type:'hbox',
                        pack:'center'
                    },
                    tpl:new Ext.XTemplate(
                        '<h2>Vista previa</h2>',
                        '<tpl for=".">',
                            '<div style="margin-bottom: 10px;" class="thumb-wrap">',
                              '<input class="check x-form-type-checkbox" type="checkbox" name="vehicle" value="Bike"><span>Imagen Principal</span></input>',
                              '<img class="image {[this.getClass(values)]}" src="{src}" />',
                            '</div>',
                        '</tpl>',
                        {
                            getClass:function(values){
                                return values.iconCls;
                            }
                        }
                    ),
                    listeners:{
                        itemclick:'itemClick'
                    }

                }
            ],
            dockedItems:[
                {
                    xtype:'toolbar',
                    dock:'top',
                    defaults:{
                        listeners:{
                            toggle:'onToggle',
                            click:'onRecorVideo',
                            playing:'onPlaying'
                        }
                    },
                    items:[
                        {
                            xtype: 'button',
                            text: 'Nueva <br> Infracción',
                            iconCls:'fa fa-hand-paper-o',
                            iconAlign: 'top',
                            name: 'infraccion'
                        },
                        {
                            xtype: 'button',
                            text: 'Capturar <br> Nueva Imagen',
                            iconCls:'fa fa-camera',
                            iconAlign: 'top',
                            name: 'capture',
                            handler:'capturarImagen'
                        },
                        {
                            xtype: 'button',
                            text: 'Iniciar <br> Grabación',
                            iconCls:'fa fa-video-camera',
                            iconAlign: 'top',
                            enableToggle: true,
                            name: 'grabar'
                        },
                        {
                            xtype: 'button',
                            text: 'Grabar 8<br>  segundos',
                            iconCls:'fa fa-video-camera',
                            enableToggle: true,
                            iconAlign: 'top',
                            name: '8segundos'
                        },
                        '->',
                        {
                            xtype: 'button',
                            tooltip: 'Salir',
                            iconCls: 'fa fa-sign-out',
                            name: 'logout'
                        },

                    ]
                },
                {
                    xtype:'toolbar',
                    dock:'bottom',
                    layout: {
                        pack: 'left'
                    },
                    items:[
                        {
                            xtype: 'button',
                            tooltip: 'Capturar <br> Nueva Imagen',
                            iconCls:'fa fa-camera',
                            name: 'capture',
                            handler:'capturarImagen'
                        },
                        {
                            xtype: 'button',
                            tooltip: 'Detener<br>Grabación',
                            iconCls:'fa fa-stop',
                            name: 'stop'
                        }
                    ]
                }
            ],
            listeners:{
                afterrender:function(self){
                }
            }
        });

        me.callParent(arguments);
    }
});

