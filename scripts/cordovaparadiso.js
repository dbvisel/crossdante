// run this:
//
// shjs cordovaparadiso.js
//
// this must be run from top of project!

var shell = require('shelljs');

var bookname = "paradiso";

var distpath = "dist/";
var jsfile = "js/"+bookname+".js";
var cssfile = "css/styles.css";

var cpath = "apps/crossdante"+bookname+"/www/";
var candroidpath = "apps/crossdante"+bookname+"/platforms/android/assets/www/";

var incordovadir = shell.pwd().indexOf(cpath);

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
	shell.exec("cd apps/crossdante"+bookname+" && cordova build android --release --inc-version");
}
