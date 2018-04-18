const {app, BrowserWindow, dialog,  Tray, nativeImage, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
const AutoLaunch = require('auto-launch');
const { autoUpdater } = require('electron-updater');
const isDev = require('electron-is-dev');
var fs = require('fs');


if(process.platform === 'win32'){
    if(process.env.SITE){
        let site = process.env.SITE;
        fs.writeFile('site.js', 'export let site = "'+site+'"', function (err) {
          if (err) return console.log(err);
          console.log('write site');
        });
    }
}




console.log(process.env.SITE);
console.log('process.argv', process.argv[process.argv.length - 1]);

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;

// setup loger

autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

autoUpdater.on('checking-for-update', () => {

});

autoUpdater.on('update-avelable', (info) => {

});

autoUpdater.on('update-downloaded', (info) => {
  autoUpdater.quitAndInstall();
});

autoUpdater.on('error', (error) => {

});





let win = null;
let trayWin = null;
let tray = null;

let onlineStatusWindow = '';
let onlineStatus = '';
let noInternet = null;

let unomiAutoLauncher = new AutoLaunch({
    name: 'Unomi',
    path: '/Applications/unomi.app',
});

unomiAutoLauncher.enable();

//minecraftAutoLauncher.disable();


unomiAutoLauncher.isEnabled()
.then(function(isEnabled){
    if(isEnabled){
        return;
    }
    unomiAutoLauncher.enable();
})
.catch(function(err){
    // handle error
});


function createTrayWindow(){
    trayWin = new BrowserWindow({
        width: 350,
        height: 250,
        frame: false,
        resizable: false,
        movable: false,
        show: false,
        transparent: true
    });
    trayWin.loadURL(`file://${__dirname}/tray_window.html`);
    //trayWin.webContents.openDevTools()
}


function createAppWindow() {
    // Create the browser window.
    //dialog.showErrorBox(title='er', content=process.env.SITE);
    win = new BrowserWindow({
      minWidth: 320,
      minHeight: 500,
      width: 900,
      height: 600,
        webPreferences:{
          nodeIntegration:false
        }
    });
    if(!process.env.SITE){
        let url = require('site');
        win.loadURL(url);

    } else {
        win.loadURL(process.env.SITE);
    }

    //win.loadURL('https://unomi-develop.enkonix.com/');
    //win.webContents.openDevTools();


}

function noInternetWindow() {
    // Create the browser window.
    noInternet = new BrowserWindow({
      minWidth: 320,
      minHeight: 500,
      width: 820,
      height: 640
    });
    noInternet.loadURL(`file://${__dirname}/no_internet.html`);
}


app.on('ready', function() {
    if (process.platform === 'darwin'){
        app.dock.hide();
    }

    onlineStatusWindow = new BrowserWindow({ width: 0, height: 0, show: false })
    onlineStatusWindow.loadURL(`file://${__dirname}/online-status.html`)

    if (!isDev){
      autoUpdater.checkForUpdates();
    }
    tray = new Tray(path.join(__dirname,'images/electron-icon24.png'));
    tray.setToolTip('Unomi');
    createTrayWindow();
    tray.on('click', (event, bounds) => {
      const {x, y} = bounds;
      const {height, width} = trayWin.getBounds();
      if (trayWin.isVisible()) {
        trayWin.hide();
      } else {
        const yPosition = process.platform === 'darwin' ? y : y - height;
        trayWin.setBounds({
          x: x - (width / 2) + 10,
          y: yPosition,
          width: width,
          height: height
        });
        trayWin.show();
      }
    });
    trayWin.on('blur', () => {
      trayWin.hide();
    });
/*
    if (process.platform !== 'darwin'){
        let autoLaunch = new AutoLaunch({
            name: 'Unomi',
            path: app.getPath('exe'),
          });
          autoLaunch.isEnabled().then((isEnabled) => {
            if (!isEnabled) autoLaunch.enable();
          });
    }
    */
});





app.on('close', () => {
    win = null;
});


app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});



ipcMain.on('app:open', () => {
    if (onlineStatus == 'online'){
        createAppWindow();
    } else {
        noInternetWindow();
    }

});

ipcMain.on('signout', () => {
  app.quit();
});

ipcMain.on('online-status-changed', (event, status) => {
    onlineStatus = status;
    console.log(status);
    if (status == 'online'){
        if(noInternet){
            noInternet.hide();
            noInternet = null;
            createAppWindow();
        }
    }
});




/*

var unomiAutoLauncher = new AutoLaunch({
  name: 'Unomi',
  path: '/Applications/unomi.app',
});

unomiAutoLauncher.enable();

//minecraftAutoLauncher.disable();


unomiAutoLauncher.isEnabled()
  .then(function(isEnabled){
    if(isEnabled){
      return;
    }
    unomiAutoLauncher.enable();
  })
  .catch(function(err){
    // handle error
  });


*/
