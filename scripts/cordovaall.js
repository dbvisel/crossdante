// run this:
//
// shjs cordovaall.js
//
// this must be run from top of project!

"use strict";

var shell = require('shelljs');

var booknames = ["inferno","purgatorio","paradiso"];
var distpath = "dist/";
var cssfile = "css/styles.css";

for(let i = 0; i < booknames.length; i++) {
	let bookname = booknames[i];
	let jsfile = "js/"+bookname+".js";
	let cpath = "apps/crossdante"+bookname+"/www/";
	let candroidpath = "apps/crossdante"+bookname+"/platforms/android/assets/www/";
	let incordovadir = shell.pwd().indexOf(cpath);

	shell.echo("Updating files for "+bookname+"...")
	shell.exec("cp "+distpath+jsfile+" "+cpath+jsfile);
	shell.exec("cp "+distpath+jsfile+" "+candroidpath+jsfile);
	shell.exec("cp "+distpath+cssfile+" "+cpath+cssfile);
	shell.exec("cp "+distpath+cssfile+" "+candroidpath+cssfile);

	shell.echo("Building "+bookname+"...")
	if(incordovadir > -1) {
		// assuming that we're in the cordova directory
		shell.exec("cordova build android --release");
	} else {
		// assuming that we are in the main directory
		shell.exec("cd apps/crossdante"+bookname+" && cordova build android --release");
	}
}
