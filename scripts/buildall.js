// run this:
//
// shjs buildall.js
//
// this must be run from top of project!

"use strict";

var shell = require('shelljs');

var booknames = ["inferno","purgatorio","paradiso"];
var srcpath = "src/";
var distpath = "dist/";

// deal with css

shell.exec("node-sass --output-style compressed -o "+distpath+"css "+srcpath+"scss");
shell.exec("node-sass --output-style compressed -o "+srcpath+"css "+srcpath+"scss");
shell.exec("postcss -u autoprefixer --autoprefixer.browsers '> 5%, ie 9' -r "+distpath+"css/*");

// deal with javascript

for(let i = 0; i < booknames.length; i++) {
	let bookname = booknames[i];
	console.log("");
	console.log("Building "+bookname + " . . .");
	let srcjs = srcpath + "js/"+bookname+".js";
	let distjs = distpath + "js/" + bookname + ".js";
	let distminjs = distpath + "js/" + bookname + ".min.js";
	shell.exec("browserify --debug -d "+srcjs+" -t babelify > "+distjs);
	shell.exec("uglifyjs "+distjs+" -m -o "+distminjs);
}

console.log("Done!");
