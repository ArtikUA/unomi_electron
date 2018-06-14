const {app, BrowserWindow, dialog,  Tray, nativeImage, ipcMain, Menu, shell} = require('electron');
const path = require('path');
const url = require('url');
const AutoLaunch = require('auto-launch');
const { autoUpdater } = require('electron-updater');
const isDev = require('electron-is-dev');
const fs = require('fs');


process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;


autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update');
});

autoUpdater.on('update-avelable', (info) => {
    console.log("avaliable updates", info.version)

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
    trayWin.on('close', () => {
        trayWin = null;
    });
}


function createAppWindow() {
    if (win){
        if (win.isMinimized()) win.restore();
        win.focus();
        return
    }
    // Create the browser window.
    // dialog.showErrorBox(title='er', content=process.env.SITE);
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
        let site = require('./site');
        win.loadURL(site.url);
    } else {
        win.loadURL(process.env.SITE);
    }

    win.on('close', () => {
        win = null;
    });
    win.webContents.on('will-navigate', function(event, url) {
        console.log('URL will navigate', url);
        event.preventDefault();
        console.log(win.webContents.getURL());
    });
    win.webContents.on('did-navigate-in-page', function(event, url) {
        if (url === 'https://unomi-develop.enkonix.com/signup' ||
        url === 'https://unomi-develop.enkonix.com/accountinformation' ||
        url === 'https://getunomi.com/accountinformation' ||
        url === 'https://getunomi.com/signup') {
            shell.openExternal('https://getunomi.com/accountinformation');
            win.webContents.goBack();
        }
        console.log('URL did navigate', url);
        event.preventDefault();
        console.log(win.webContents.getURL());
    });

    // win.loadURL('https://unomi-develop.enkonix.com/');
    // win.webContents.openDevTools();
}

function noInternetWindow() {
    // Create the browser window.
    if (noInternet){
        if(noInternet.isMinimized()) { noInternet.restore(); }
        noInternet.focus();
    }
    noInternet = new BrowserWindow({
      minWidth: 320,
      minHeight: 500,
      width: 820,
      height: 640
    });
    noInternet.loadURL(`file://${__dirname}/no_internet.html`);
    noInternet.on('close', () => {
        noInternet = null;
    });
}


app.on('ready', function() {
    createAppWindow();
    if (process.platform === 'darwin'){
        app.dock.hide();
    }
    const isSecondWin = app.makeSingleInstance((commandLine, workingDirectory) => {
        if (trayWin) {
          if (trayWin.isMinimized()) { trayWin.restore(); }
          trayWin.focus();
        }
    });

    if (isSecondWin) {
        app.quit();
        return
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



    // minecraftAutoLauncher.disable();
    let unomiAutoLauncher;

    if (process.platform === 'darwin'){
        unomiAutoLauncher = new AutoLaunch({
          name: 'Unomi',
          path: '/Applications/Unomi.app',
        });
    } else {
        unomiAutoLauncher = new AutoLaunch({
            name: app.getName(),
            path: app.getPath('exe'),
        });
        unomiAutoLauncher.enable();
    }

    unomiAutoLauncher.isEnabled()
    .then(function(isEnabled){
        if(isEnabled){
            return;
        }
        unomiAutoLauncher.enable();
    })
    .catch(function(err){
        console.log(err);
    });

    if (process.platform === 'darwin') {
      let template = [{
        label: 'FromScratch',
        submenu: [{
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: function() {
            app.quit();
          }
        }]
      }, {
        label: 'Edit',
        submenu: [{
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          selector: 'undo:'
        }, {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          selector: 'redo:'
        }, {
          type: 'separator'
        }, {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          selector: 'cut:'
        }, {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          selector: 'copy:'
        }, {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          selector: 'paste:'
        }, {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          selector: 'selectAll:'
        }]
      }];
      let osxMenu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(osxMenu);
    }
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
