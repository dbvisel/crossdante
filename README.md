# crossdante

An app for facing-page translation. This still needs a great deal of work! Where things are:

 * _app/_ are the raw application files
  * _app/js/modules_ is the general code
  * _app/js/[bookname]_ is where individual book files live right now
	 * _app/js/[bookname]/bookdata.js_ is the book data spine
	 * _app/js/[bookname]/translations/_ is where a particular book's translations are
	 * _app/js/[bookname].js_ is the main JavaScript file for a particular book (only difference between them is that they point to a different _bookdata.js_ file)
 * _dist/_ are the files for the web
  * _index.html_ is the main page (online version at https://danvisel.net/crossdante)
	* _[bookname.html]_ is the page for a particular book
	* _[bookname]-debug.html_ is the dev version of the page for a particular book (uses non-minified JavaScript)
 * _crossdante/_ is the Cordova project (needs to be updated)

Current books are _inferno_, _purgatorio_, and _paradiso_. More soon!

NPM build scripts are in _package.json_.
