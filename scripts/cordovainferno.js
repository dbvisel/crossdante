// run this:
//
// shjs cordovainferno.js
//
// this must be run from top of project!

var shell = require('shelljs');

var bookname = "inferno";

var distpath = "dist/";
var jsfile = "js/"+bookname+".js";
var cssfile = "css/styles.css";

var cpath = "apps/crossdante"+bookname+"/www/";
var candroidpath = "apps/crossdante"+bookname+"/platforms/android/assets/www/";

shell.echo("Updating files for "+bookname+"...")
shell.exec("cp "+distpath+jsfile+" "+cpath+jsfile);
shell.exec("cp "+distpath+jsfile+" "+candroidpath+jsfile);
shell.exec("cp "+distpath+cssfile+" "+cpath+cssfile);
shell.exec("cp "+distpath+cssfile+" "+candroidpath+cssfile);

shell.echo("Building "+bookname+"...")
shell.exec("cd apps/crossdante"+bookname+" && cordova build android --release");
