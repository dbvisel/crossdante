# crossdante

An app for facing-page translation. This still needs a great deal of work! Where things are:

 * _app/_ are the raw application files
  * _app/js/modules_ is the general code
  * _app/js/[bookname]_ is where individual book files live right now
	 * _app/js/[bookname]/bookdata.js_ is the book data spine
	 * _app/js/[bookname]/translations/_ is where the book's translations are
	 * _app/js/[bookname].js_ is the code for a particular book
 * _dist/_ are the files for the web (demo version at https://danvisel.net/tempo/dante/inferno.html)
 * _crossdante/_ is the Cordova project (needs to be updated)

The only book right now is _inferno_. More soon!

NPM build scripts are in _package.json_.
