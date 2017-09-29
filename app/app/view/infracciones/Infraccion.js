
Ext.define('Electron.view.infracciones.Infraccion',{
    extend: 'Ext.panel.Panel',

    requires: [
        'Electron.view.infracciones.InfraccionController',
        'Electron.view.infracciones.InfraccionModel'
    ],

    controller: 'infracciones-infraccion',
    viewModel: {
        type: 'infracciones-infraccion'
    },

    html: 'Hello, World!!'
});
