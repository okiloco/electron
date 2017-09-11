const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')

let win
function createWindow(){
	win = new BrowserWindow({width:800,height:600, title:'SnapShot Stream', icon:__dirname+'/assests/icon.png'})

	win.loadURL(url.format({
		pathname:path.join(__dirname,'./index.html'),
		protocol:'file:',
		slashes:true
	}))
	//win.loadURL('http://localhost:3000');

	win.webContents.openDevTools();

	win.on("closed",()=>{
		win = null;
	})

    var hasGP = false;
    var repGP;

    console.log(win.webContents);
}
exports.canGame = () => {
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