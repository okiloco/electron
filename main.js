const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
require('./server/app');
let win
function createWindow(){
	win = new BrowserWindow({width:1280,height:720, title:'SnapShot Stream', icon:__dirname+'/assests/icon.png'})

	win.loadURL(url.format({
		pathname:path.join(__dirname,'/app/index.html'),
		protocol:'file:',
		slashes:true
	}));
	// win.loadURL('http://localhost:1841');

	//Abrir inspector de elementos
	win.webContents.openDevTools();

	win.on("closed",()=>{
		win = null;
	})

	const ses = win.webContents.session;
	

    var hasGP = false;
    var repGP;

    //console.log(win.webContents);
}


exports.canGame = function(){
    return "getGamepads" in win;
}
app.on("ready",createWindow)

app.on("window-all-closed",()=>{

	if(process.platform !== 'drawin'){
		app.quit()
	}
})

app.on("active",()=>{
	if(win===null){
		createWindow()
	}
})