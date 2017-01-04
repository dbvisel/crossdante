# FAQ

## Can I do this with my own text?

Absolutely! There should be more readable translations in the world. The code's all in Github and it shouldn't be very complicated to figure out if you have a basic understanding of JavaScript. 

If that sounds too complicated, talk to me and I might be able to help you! Basically all it takes is texts that are in HTML; some work might be needed to get them into shape – typesetting poetry is always a little tricky! – but it's not that hard.

Eventually I'd like to make this simpler – translators shouldn't need to learn to code – but that's in the future.

## What kind of texts does this work with?

This is basically designed for poetry in reasonably sized (around 200 lines) chunks – e.g. the length of one of Dante's cantos. You could stick longer texts in it and they might work, but they're liable to get more visibly out of synch if you're dealing with a 2000-line canto. (Eventually, I'd like line synching to be stronger, but that requires more marking up of texts, which slows things down.) It would work well – maybe even better! – for things that are shorter than 200 lines.

This will work if you only have a single translation, though currently it's not optimized for it. Theoretically, there's no maximum on the number of translations you can use. Nor is there a limit on the number of chunks you put in it.

This will work with prose – take a look at the Norton translations of Dante – but it probably wouldn't be a great environment for working with multiple prose translations of a longer texts. Scrolling isn't the best way to read something long because you tend to lose your place; pages are a little more useful mentally. (If there's demand, I might make a version of this that's designed to work with prose – it would paginate texts and look a little more like a standard e-reader app – swiping left or right would turn the page, swiping up or down would change the translation.) 

And right now this hasn't been designed to work with much typographic complexity – if it's in one of the translations of Dante I've been using, I've added the functionality in, if it isn't, I haven't. That's not hard to expand though.

## How does this work internally?

So in the _src/_ directory are the raw texts. I've separated them out by book and then internally by translation. For example:

 * _src/inferno/_ is where you'd find the files for Inferno.
 * _src/inferno/translations/_ is where you'd find the translations used in Inferno.
 * _src/inferno/translations/norton.js_ is one particular translation, in this case the Charles Eliot Norton translation of Inferno. 
 * _src/inferno/bookdata.js_ is the main spine of the book – it tells the application what's in the book. 

### First, the _bookdata.js_ file

Let's start by looking at what's in _bookdata.js_. This is a JavaScript module – it contains data that can be used by the main app. Basically it's a list of information about the book:

 * _bookname_ is the book name that's used internally: "inferno" is the code that's used for the book. All lowercase; it's what's used in directories. 
 * _booktitle_ is the title of the work as a whole.
 * _bookauthor_ is the author of the work as a whole.
 * _description_ is a description of the work. This appears on the **About** page.
 * _versionhistory_ is an array that holds a list of changes that have happened in the book. Whenever I add a new translation (or make a significant change to a translation), a new entry is made here. This appears on the **About** page.
 * _comingsoon_ is text that appears in the _Coming Soon_ area on the **About** page.
 * _cantotitles_ are the titles for each section that appear at the top of a page. For Dante, they're "Canto 1", "Canto 2", "Canto 3" etc. Note that different translations might use different titles for different sections! This is a single unified name. But every section needs to have a title (even if it's blank).
 * _translationdata_ is a list of the translation IDs that are being used and the order in  which they appear. The translation with order 0 appears first – right now, that's the Italian original. But if you gave "norton" the order 0, it would appear first.
 * And finally, _textdata_ tells the app where to look for the actual translations – this is a pointer to the chunk of JavaScript that includes the translation. There should be one of these for each translation you're using.
 
### What happens in a translation file
 
 Now, let's look at what's in an actual translation file – I'm going to use the Norton translation of Inferno because it's complex enough to show most of the features. The file is at _src/inferno/translations/norton.js_. Technical note: if you open that up, you'll note that although it looks very much like JSON (and doesn't really contain anything that couldn't be done in JSON) it's a JavaScript module. The reason for this is that JSON is horrible for editing text in. Keeping this file in JavaScript allows us to use ES6 syntax, which lets us use line breaks, which, in turn, makes everything much more legible. You can send one of these files to an editor and there's a decent chance that they wouldn't utterly destroy it, which certainly wouldn't happen with JSON.
 
But the translation file is basically a list of metadata about the translation, then the translation itself, and finally notes to the translation, if any exist. 

#### Translation metadata

Let's start with the metadata. What's in there?

 * _bookname_ is the book codename – here we're using "inferno". This keeps the translation tied to a book – I didn't want my Norton Hell confused with my Norton Purgatory.
 * _author_ is the work's author as given in the translation. I don't think this is actually used at the moment (the value in the bookfile is used), though it might be used in the future. You might get some variation from translation to translation: "Dante" vs. "Dante Alighieri", for example.
 * _translationid_ is the ID of the translation ("norton" here). This is the same as the filename (which adds a _.js_) and the same as is found in the bookname. If this isn't the same everywhere, everything would fall apart.
 * _title_ is the title of the translation. Norton uses "Hell", other people use "Inferno"; each translator gets a chance to title their translation.
 * _source_ is where the text is from; currently, it's a link to the Gutenberg texts that I took the translations from. This appears on the **About** page. 
 * _translation_ is a Boolean: this is _true_ if it's a translation, and _false_ if it's the original. I don't know if this is currently used, but it will probably be used in the future (if we wanted to make an editable version of the original, for example). 
 * _translationshortname_ is the short version of the author's name ("Norton") which appears in the title bar. The reason for this is that "Charles Eliot Norton" doesn't legibly fit in the title bar on a phone.
 * _translationfullname_ is the full name of the translator. 
 * _translationclass_ contains extra classes that are added to the text; this is a list separated by spaces. For Norton, this is "norton prose". A list of these classes and what they do:
		* _prose_ tells it to display paragraphs as prose rather than as poem lines.
		* _poetry_ tells it to display paragraphs as poem lines rather than as prose. This also makes the app center things differently: it attempts to center poetry to the width of the longest line, which prose just runs from margin to margin.
		* _norton_ and _carlyle_ tell the CSS to apply particular fixes for particular translations. These can be found in _src/scss/_poets.scss_; there were a lot of these rules, but I've tried to get rid of them. Basically, I wanted to provide a way for overrides for weird translations. I don't know if this is sustainable.

There's some more metadata that should probably be added in here (translation date, for example, seems important). Maybe I'll put that in at some point.

#### Translation text

Now. Next up is _text_, which is an array where each member is a canto. The first entry is the title page and is treated as special (probably this should be generated automatically?); after that the regular cantos proceed.

I've used ES6 syntax so that everything can be put inside of ugly single back quotes (`); what's inside is HTML. For Norton, this is pretty straightforward! There are display classes that are defined in SCSS; most everything, however, is just inside of `<p>` tags. Because this has been defined as "prose", the paragraphs show up as prose; if it were defined as "poetry" the paragraphs would show up as properly-formatted poetry. A couple of special things. First, paragraph styles:

 * `<p class="cantohead">` makes a canto header.
 * `<p class="summary">` makes an italicized summary – this is specific to Norton so far. 
 * For poetry, `<p class="slindent">` indents a line by 1 em; I think you can also use `<p class="slindent2em">` for a 2-em indent (and so on). 

Next, character styles:

 * Italics are signaled by `<em>`, bold by `<strong>`. I don't remember if it turns up in Norton, but text that is italicized because it is in a foreign language should be wrapped in `<span class="italian">` or `<span class="latin">` – that seems like useful information to have in the future even if right now it's only being used to italicize.
 * Small caps can be made with `<span class="sc">`

And other things:

 * In poetry with stanzas, stanzas are wrapped with a `<div class="stanza">`; div.stanzas are separated by a blank line.
 * The numbers in mustaches ({{1}}) are callouts to notes which get replaced by superscripted numbers by the app itself. 
 * To include a 1-em space inside a line, use `<span class="indent"></span>`
   
There is more complicated formatting in poetry! I'll come back and describe those later.

#### Translation notes

Following all the text are notes, if the translation has any notes. This is an array the same length as the text – if you have 33 sections, you should have 33 sections of notes. Each section is a list of notes. Each note consists of two things:

 * _noteno_, which is the note's number.
 * _notetext_, which is the note's text.

If you look at the Norton notes, you'll see that the numbering scheme seems to involves a lot of 1s and 2s; I think it used footnotes and started over on each page. This is not particularly helpful when it's being displayed any other way; so the app renumbers notes for each canto, starting at 1, going to however many notes there are. (Other numbering systems are imaginable!) When a canto is displayed, the app goes through the list of notes and tries to sequentially match each note with something in the text. It does not matter what the number is (it doesn't actually even have to be a number), but it does need to appear in the text or the note won't show up. (Or, if you have a callout and no note with that callout, you'll see the braces in the text.) 

Notes are currently displayed inside a single paragraph; you can have multiple lines by sticking in a `<br />`.  I don't love this system, but it's what there is right now. The current notes, for what it's worth, are mostly garbage – notes in the Gutenberg texts are even more wildly corrupt than the texts. A lot of Greek, for example, was simply thrown out. 

## How do I get from translation files to a text? 

_(This section assumes some knowledge of NPM! I'll explain all of this in more detail at some later point.)_

Once you have a translation (probably while you're making that!) you need to make a new HTML file and a main JavaScript file. In _src/_, you'll see _template-debug.html_; that's the shell for the application. It calls out _js/template.js_. _template.js_ pulls together the book text modules with the app modules. In there, you'll see the line

    let bookdata = require("./inferno/bookdata");

Point that at your new book (instead of at "inferno"). That's the only thing you need to change. Save it with a new name; make a copy of _src/template-debug.html_ and _dist/template.html_  and change the references in them: 

    <script type="text/javascript" src="../dist/js/template.js"></script> _(in template-debug.html)_
     <script type="text/javascript" src="js/template.min.js"></script> _(in template.html)_
  
to your new JavaScript file. (The debug version makes it a little easier to track down problems in your text markup.)

And you're almost ready! Go to _package.json_ and change the variables in "config" to match your new bookname. Then to build your book:

    npm run build-js
 
 To make it ready to go:
 
    npm run production

While you're debugging, you might run the watch task:

    npm run watch

to find errors in what you're doing; you could also use the serve task to have the debug version show up in your browser.

When you're ready, upload what's in the _dist/_ directory to your site; or use Cordova to turn the whole thing into an app. 