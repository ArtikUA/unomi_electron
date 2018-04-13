const {app, BrowserWindow, Tray, nativeImage, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
const AutoLaunch = require('auto-launch');
const { autoUpdater } = require('electron-updater');
const isDev = require('electron-is-dev');

// setup loger

autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

autoUpdater.on('checking-for-update', () => {

})

autoUpdater.on('update-avelable', (info) => {

})

autoUpdater.on('update-downloaded', (info) => {
  autoUpdater.quitAndInstall();
})

autoUpdater.on('error', (error) => {

})


let win = null;
let trayWin = null;
let tray = null;

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
}


function createAppWindow() {
    // Create the browser window.
    win = new BrowserWindow({
      minWidth: 320,
      minHeight: 500,
      width: 900,
      height: 600
    });
    win.loadURL('https://unomi-develop.enkonix.com/');
}


app.on('ready', function() {
    app.dock.hide();
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
        })
        trayWin.show();
      }
    })
    trayWin.on('blur', () => {
      trayWin.hide();
    })
});


app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true
  })

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
  createAppWindow();
});

ipcMain.on('signout', () => {
  app.quit();
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
