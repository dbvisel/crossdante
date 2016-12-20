# crossdante

An app for facing-page translation. Online version here: https://danvisel.net/crossdante/. This still needs a great deal of work! Where things are:

 * _src/_ are the raw application files
 	* _src/[bookname]-debug.html_ is the dev version of the page for a particular book (uses non-minned scripts, nothing else special)
  * _src/js/modules/_ is the general code – _app.js_ is the entry point.
  * _src/js/[bookname].js_ is the main JavaScript file for a particular book. These files are identical, but they point to different _[bookname]/bookdata.js_ files.
  * _src/js/[bookname]_/ is where individual book files live right now
	 * _src/js/[bookname]/bookdata.js_ is the spine for a particular book, pointing to translations
	 * _src/js/[bookname]/translations/_ is where a particular book's translations are
 * _dist/_ are the files for the web
  * _dist/index.html_ is the main page
  * _dist/[bookname].html_ is the page for a particular book
 * _apps/_ contains the Cordova projects for Android/iOS apps

Current books are _inferno_, _purgatorio_, and _paradiso_. More soon!

NPM build scripts are in _package.json_. Change variables in the "config" section to make build scripts for different books. It would be nice to have a smarter build system, but this works.

To build for Cordova: _npm run cordova[bookname]_
