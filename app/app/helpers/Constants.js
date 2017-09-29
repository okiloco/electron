Ext.define('Electron.helpers.Constants', {
	alternateClassName: 'Constants',
	singleton: true,
	
	//Login
	URL_LOGIN:BASE_PATH+'login',
	URL_VIEWER:IP_CAMERA+'mjpg/video.mjpg',

	//Iconos
	URL_ICON_IMAGEN_EMPTY:'resources/images/icons/64/camera.png',
	
	//PTZ
	URL_GRABAR_VIDEO:BASE_PATH+'app/video',
	URL_DETENER_VIDEO:BASE_PATH+'app/video/stop',
	URL_CAPTURAR_IMAGEN:BASE_PATH+'app/image/new'
});