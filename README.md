# crossdante

An app for facing-page translation. This still needs a great deal of work! Where things are:

 * _app/_ are the raw application files
 	* _app/[bookname]-debug.html_ is the dev version of the page for a particular book
  * _app/js/modules/_ is the general code – _app.js_ is the entry point.
  * _app/js/[bookname].js_ is the main JavaScript file for a particular book. These files are identical, but they point to different _[bookname]/bookdata.js_ files.
  * _app/js/[bookname]_/ is where individual book files live right now
	 * _app/js/[bookname]/bookdata.js_ is the spine for a particular book, pointing to translations
	 * _app/js/[bookname]/translations/_ is where a particular book's translations are
 * _dist/_ are the files for the web
  * _dist/index.html_ is the main page (online version at https://danvisel.net/crossdante)
  * _dist/[bookname].html_ is the page for a particular book
 * _crossdante/_ is the Cordova project (needs to be updated)

Current books are _inferno_, _purgatorio_, and _paradiso_. More soon!

NPM build scripts are in _package.json_. Change variables in the "config" section to make build scripts for different books. It would be nice to have a smarter build system, but this works.
