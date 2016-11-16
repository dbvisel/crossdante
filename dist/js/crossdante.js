(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// appdata.js
//
// basic appdata – there's also a translationdata array (metadata) and textdata (texts)
// is it worth folding this into app? Is there a value in keeping this separate?
//
// this probably needs some reworking?

var translationdata = require("./bookdata").translationdata;
var cantotitles = require("./bookdata").cantotitles;

var appdata = {
	currenttranslationlist: [],    // list of ids of translations we're currently using
	currenttranslation: 0,
	translationcount: translationdata.length,
	currentcanto: 0,
	cantocount: cantotitles.length,
	lineheight: 24,
	lenswidth: window.innerWidth,
	lensheight: window.innerHeight - 40,
	windowwidth: window.innerWidth,
	windowheight: window.innerHeight,
	textwidth: window.innerWidth,
	currentpage: "lens",
	nightmode: false,
	currentpercentage: 0, // this is current percentage of page (maybe this should be in terms of lines on page?)
	currentlines: 0       // this is the number of lines calculated to be on the page
};

module.exports = appdata;

},{"./bookdata":2}],2:[function(require,module,exports){
var cantotitles = ["Title page","Canto 1","Canto 2","Canto 3"];

var translationdata = [
	{"translationid":"dante",
		"translationshortname":"Dante",
		"translationfullname":"Dante Alighieri",
		"translationclass":"poetry original",
		"order":0},
	{"translationid":"longfellow",
		"translationshortname":"Longfellow",
		"translationfullname":"Henry Wordsworth Longfellow",
		"translationclass":"poetry longfellow",
		"order":1},
	{"translationid":"norton",
		"translationshortname":"Norton",
		"translationfullname":"Charles Eliot Norton",
		"translationclass":"norton prose",
		"order":2},
	{"translationid":"wright",
		"translationshortname":"Wright",
		"translationfullname":"S. Fowler Wright",
		"translationclass":"poetry wright",
		"order":3},
	{"translationid":"carlyle",
		"translationshortname":"Carlyle",
		"translationfullname":"Carlyle/Okey/Wiksteed",
		"translationclass":"prose carlyle",
		"order":4}
];

module.exports.cantotitles = cantotitles;
module.exports.translationdata = translationdata;

},{}],3:[function(require,module,exports){
// version 3: no jQuery, more appish

//
//// polyfills
//

// for each, from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach

if (!Array.prototype.forEach) {
	Array.prototype.forEach = function(callback, thisArg) {
		var T, k;
		if (this === null) {
			throw new TypeError(' this is null or not defined');
		}
		var O = Object(this);
		var len = O.length >>> 0;
		if (typeof callback !== "function") {
			throw new TypeError(callback + ' is not a function');
		}
		if (arguments.length > 1) {
			T = thisArg;
		}
		k = 0;
		while (k < len) {
			var kValue;
			if (k in O) {
				kValue = O[k];
				callback.call(T, kValue, k, O);
			}
			k++;
		}
	};
}

var Hammer = require("hammerjs");
var Fastclick = require("fastclick");	// why is this not working?

var dom = require("./dom");
var translationdata = require("./bookdata").translationdata;
var cantotitles = require("./bookdata").cantotitles;
var appdata = require("./appdata");

var textdata = {};
textdata[0] = [];
textdata[1] = [];
textdata[2] = [];
textdata[3] = [];
textdata[4] = [];

textdata[0] = require("./translations/italian.js");
textdata[1] = require("./translations/longfellow.js");
textdata[2] = require("./translations/norton.js");
textdata[3] = require("./translations/wright.js");
textdata[4] = require("./translations/carlyle.js");

var lens = document.querySelector("#lens");

var app = {
	initialize: function() {
		console.log("initializing!");
		this.bindEvents();

// set up current translation list (initially use all of them)

		for(var i in translationdata) {
			appdata.currenttranslationlist.push(translationdata[i].translationid);
		}

// check to see if there are saved localstorage, if so, take those values

	},
	bindEvents: function() {
		console.log("binding events!");
		document.addEventListener('deviceready', this.onDeviceReady, false);
		window.addEventListener("resize", this.resize, false);

		// start fastclick

		if ('addEventListener' in document) {
			document.addEventListener('DOMContentLoaded', function() {
				Fastclick.attach(document.body);
			}, false);
		}
	},
	helpers: {
		gosettings: function(element) {
			element.onclick = function() {
				app.setpage("settings");
			};
		},
		setupnote: function(el) {
			el.onclick = function(e) {
				e.stopPropagation();
				var thisnote = this.getAttribute("data-notenumber");
				var notetext = document.querySelector('.notetext[data-notenumber="'+thisnote+'"]').innerHTML;
				app.hidenotes();
				var insert = dom.create('<div class="notewindow" id="notewindow">'+notetext+'</div');
				document.getElementById("main").appendChild(insert);
				document.getElementById("notewindow").onclick = function() {
					app.hidenotes();
				};
			};
		},
		checkboxgo: function(el) {
			el.onclick = function() {
				app.changetranslation(this.id.replace("check-",""),document.getElementById(this.id).checked);
			};
		},
		checkboxspango: function(el) {
			el.onclick = function() {
				document.getElementById("check-"+this.id).checked = !document.getElementById("check-"+this.id).checked;
				app.changetranslation(this.id,document.getElementById("check-"+this.id).checked);
			};
		}
	},
	setupcontrols: function() {
		var hammertime;

		// button controls
		document.getElementById("navprev").onclick = function () {
			app.setlens(appdata.currenttranslation-1,appdata.currentcanto);
		};
		document.getElementById("navnext").onclick = function () {
			app.setlens(appdata.currenttranslation+1,appdata.currentcanto);
		};
		document.getElementById("navup").onclick = function () {
			app.setlens(appdata.currenttranslation,appdata.currentcanto-1,0);
		};
		document.getElementById("navdown").onclick = function () {
			app.setlens(appdata.currenttranslation,appdata.currentcanto+1,0);
		};
		// initial settings

		document.getElementById("aboutlink").onclick = function() {
			app.setpage("about");
		};
		document.getElementById("helplink").onclick = function() {
			app.setpage("help");
		};
		document.getElementById("daymode").onclick = function() {
			dom.removeclass("body","nightmode");
			dom.addclass("#nightmode","off");
			dom.removeclass("#daymode","off");
			appdata.nightmode = false;
		};
		document.querySelector("#nightmode").onclick = function() {
			dom.addclass("body","nightmode");
			dom.removeclass("#nightmode","off");
			dom.addclass("#daymode","off");
			appdata.nightmode = true;
		};

		document.querySelectorAll(".backtosettings").forEach(app.helpers.gosettings);

	// swipe controls

		hammertime = new Hammer(lens);
		hammertime.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
		hammertime.on('swipeleft',function() {
			app.setlens(appdata.currenttranslation+1,appdata.currentcanto);
		}).on('swiperight',function() {
			app.setlens(appdata.currenttranslation-1,appdata.currentcanto);
		});

		hammertime.on('swipedown',function() {
			var textelelement = document.getElementById("text");
			if(textelelement.scollTop === 0) {
				app.setlens(appdata.currenttranslation,appdata.currentcanto-1,1);  // this needs to be at the bottom!
			}
		}).on('swipeup',function() {
			var textelement = document.getElementById("text");

// if difference between current scroll position + height of frame & complete height
// of column is less than 8, go to the next one

			if(Math.abs(textelement.scrollTop + textelement.clientHeight - textelement.scrollHeight) < 8) {
				app.setlens(appdata.currenttranslation,appdata.currentcanto+1);
			}
		});

	// key controls

		document.body.onkeydown = function(e) {
			e.preventDefault();
			if((e.keyCode || e.which) === 37) {
				dom.addclass("#navprev","on");
				app.setlens(appdata.currenttranslation-1,appdata.currentcanto);
			}
			if((e.keyCode || e.which) === 39) {
				dom.addclass("#navnext","on");
				app.setlens(appdata.currenttranslation+1,appdata.currentcanto);
			}
			if((e.keyCode || e.which) === 38) {
				dom.addclass("#navup","on");
				app.setlens(appdata.currenttranslation,appdata.currentcanto-1);
			}
			if((e.keyCode || e.which) === 40) {
				dom.addclass("#navdown","on");
				app.setlens(appdata.currenttranslation,appdata.currentcanto+1,0);
			}
		};
		document.body.onkeyup = function(e) {
			e.preventDefault();
			dom.removeclass(".button","on");
		};

	// page controls

		document.querySelector("#navtitle").onclick = function () {
			app.setpage("lens");
		};
		document.querySelector("#navsettings").onclick = function () {
			if(appdata.currentpage == "settings") {
//      if(appdata.currenttranslationlist.indexOf(translationdata[appdata.currenttranslation].translationid) > -1 ) {}
				app.setpage("lens");
			} else {
				app.updatesettings();
				app.setpage("settings");
			}
		};
		document.querySelector("#main").onclick = function () {
			app.hidenotes();
		};
	},
	setupnotes: function() {
		var count = 0;
		var notes = document.querySelectorAll(".note");

		for(var i = 0; i < notes.length; i++) {
			var children = notes[i].children;
			for(var j=0; j < children.length; j++) {
				if(dom.hasclass(children[j],"notetext")) {
					console.log("notetext "+count);
					children[j].setAttribute("data-notenumber", count);
				}
				if(dom.hasclass(children[j],"noteno")) {
					console.log("noteno "+count);
					children[j].setAttribute("data-notenumber", count);
					app.helpers.setupnote(children[j]);
				}
			}
			count++;
		}
	},
	resize: function() {
		appdata.windowwidth = window.innerWidth;
		appdata.windowheight = window.innerHeight;
		console.log("The window has been resized! New width: " + appdata.windowwidth+","+appdata.windowheight);
		appdata.lenswidth = appdata.windowwidth;
		appdata.lensheight = appdata.windowheight - document.getElementById("navbar").clientHeight;

		dom.addclass(".page",appdata.lenswidth > appdata.lensheight ? "landscape" : "portrait");
		dom.removeclass(".page",appdata.lenswidth > appdata.lensheight ? "portrait" : "landscape");

		document.getElementById("main").style.width = appdata.lenswidth+"px";
		document.getElementById("main").style.height = appdata.windowheight+"px";
		document.getElementById("content").style.width = appdata.lenswidth+"px";
		document.getElementById("content").style.height = appdata.lensheight+"px";

		appdata.lineheight = appdata.windowwidth/25;
		appdata.textwidth = appdata.windowwidth;
		app.setlens(appdata.currenttranslation,appdata.currentcanto);
	},
	setlens: function(newtrans, newcanto, percentage) {
		console.log("Setlens called for "+newtrans + ", canto "+newcanto);
		var textelement = document.getElementById("text");
		var changetrans = false;

	// if page isn't set to "lens" this doesn't do anything

		if(appdata.currentpage == "lens") {
			if(newtrans - appdata.currenttranslation !== 0) {
				changetrans = true;
				percentage = (textelement.scrollTop /*+ textelement.clientHeight*/)/textelement.scrollHeight;
				console.log(percentage);
			}

			if(newtrans >= appdata.translationcount) {
				newtrans = 0;
			}
			if(newtrans < 0) {
				newtrans = appdata.translationcount-1;
			}
			if(newcanto >= appdata.cantocount) {
				newcanto = 0;
			}
			if(newcanto < 0) {
				newcanto = appdata.cantocount-1;
			}

	// figure out which translation is the current translation

			for(var i=0; i < translationdata.length; i++) {
				if(appdata.currenttranslationlist[newtrans] == translationdata[i].translationid) {
					newtrans = i;
				}
			}
			textelement.innerHTML = textdata[newtrans][newcanto];
			dom.removeclass("#text",translationdata[appdata.currenttranslation].translationclass);
			dom.addclass("#text",translationdata[newtrans].translationclass);
			app.setupnotes();
			appdata.currenttranslation = newtrans;
			appdata.currentcanto = newcanto;

			if(appdata.currentcanto > 0) {
				document.getElementById("navtitle").innerHTML = translationdata[appdata.currenttranslation].translationshortname+" · <strong>Canto "+appdata.currentcanto+"</strong>";
			} else {
				document.getElementById("navtitle").innerHTML = "&nbsp;";
			}

			app.fixpadding();

// set percentage: this is terrible! fix this!
// first: try to figure out how many lines we have? Can we do that?

			if(changetrans) {

		// this method still isn't great! it tries to round to current lineheight
		// to avoid cutting off lines

				var scrollto = app.rounded(percentage * textelement.scrollHeight);
				textelement.scrollTop = scrollto;
			} else {
				if(percentage > 0) {
					textelement.scrollTop = textelement.scrollHeight;
				} else {
					textelement.scrollTop = 0;
				}
			}
		}
		app.savecurrentdata();
	},
	rounded: function(pixels) {

		// this is still a mess, fix this

		return appdata.lineheight * Math.floor(pixels / appdata.lineheight);

	},
	fixpadding: function() {

		var textelement = document.getElementById("text");
		var divs = document.querySelectorAll("#text p");
		var i, div, padding, desiredwidth;
		var maxwidth = 0;

		if(dom.hasclass(textelement,"poetry")) {

// this is poetry, figure out longest line

			textelement.style.paddingLeft = 0;
			for(i=0; i<divs.length; i++) {
				div = divs[i];
				div.style.display = "inline-block";
				if(div.clientWidth > maxwidth) {
					maxwidth = div.clientWidth + 90;
				}
				div.style.display = "block";
			}

			console.log("text width: " + appdata.textwidth);
			console.log("max width: " + maxwidth);

			textelement.style.paddingLeft = (appdata.textwidth - maxwidth)/2+"px";
			textelement.style.paddingRight = (appdata.textwidth - maxwidth)/2+"px";
		} else {

	// this is prose, standardized padding

			desiredwidth = 75; // this is in vw

			console.log("text width: " + appdata.textwidth);
			console.log("desired width: " + desiredwidth);
			console.log("lineheight: " + appdata.lineheight);

	//		console.log(lenswidth + " "+desiredwidth);
	//		var padding = (lenswidth - desiredwidth)/2;

			padding = (100 - desiredwidth)/2;
	/*
			if((desiredwidth + 2) > lenswidth) {
				textelement.style.paddingLeft = "1vw";
				textelement.style.paddingRight = "1vw";
			} else {
				*/
			textelement.style.paddingLeft = padding+"vw";
			textelement.style.paddingRight = padding+"vw";
	//		}
		}

	},
	hidenotes: function() {
		dom.removebyselector(".notewindow");
	},
	updatesettings: function() {
		var insert, i, j, translatorlist;

	// add in translation chooser

		dom.removebyselector("#translatorlist");
		insert = dom.create('<ul id="translatorlist"></ul>');
		document.getElementById("translationchoose").appendChild(insert);
		translatorlist = document.querySelector("#translatorlist");
		for(i in translationdata) {
			insert = dom.create('<li><input type="checkbox" id="check-' + translationdata[i].translationid + '" /><span id="'+translationdata[i].translationid+'" >' + translationdata[i].translationfullname + '</span></li>');
			translatorlist.appendChild(insert);
			document.getElementById("check-"+translationdata[i].translationid).checked = (appdata.currenttranslationlist.indexOf(translationdata[i].translationid) > -1);
		}

		document.querySelectorAll("#translatorlist input[type=checkbox]").forEach(app.helpers.checkboxgo);
		document.querySelectorAll("#translatorlist span").forEach(app.helpers.checkboxspango);

	// add in toc

		dom.removebyselector("#selectors");
		insert = dom.create('<div id="selectors"><p>Canto: <select id="selectcanto"></select></p><p>Translation: <select id="selecttranslator"></select></p><p><span id="selectgo">Go</span></p></div>');
		document.getElementById("translationgo").appendChild(insert);
		for(i = 0; i < appdata.cantocount; i++) {
			insert = dom.create('<option id="canto'+i+'" '+((appdata.currentcanto == i) ? "selected" : "")+'>'+cantotitles[i]+"</option>");
			document.getElementById("selectcanto").appendChild(insert);
		}
		for(i in appdata.currenttranslationlist) {
			for(j = 0; j < translationdata.length; j++) {
				if(translationdata[j].translationid == appdata.currenttranslationlist[i]) {
					insert = dom.create('<option id="tr_'+translationdata[j].translationid+'" ' + ((appdata.currenttranslation == i) ? "selected" : "") + '>' + translationdata[j].translationfullname+"</option>");
					document.getElementById("selecttranslator").appendChild(insert);
				}
			}
		}

		document.querySelector("#selectgo").onclick = function () {
			var selected = document.getElementById("selecttranslator");
			var thistrans = selected.options[selected.selectedIndex].id.substr(3);
			selected = document.getElementById("selectcanto");
			var thiscanto = selected.options[selected.selectedIndex].id.substr(5);
			for(j = 0; j < translationdata.length; j++) {
				if(appdata.currenttranslationlist[j] == thistrans) {
					app.setpage("lens");
					app.setlens(j,thiscanto,0);
				}
			}
		};
	},
	savecurrentdata: function() {
// this should store appdate on localstorage (does that work for mobile?)
		console.log("Storing preferences! TK");
	},
	changetranslation: function(thisid, isset) {
		console.log("changetranslation fired!");
		for(var i in translationdata) {
			if(thisid == translationdata[i].translationid) {
				if(isset) {
					appdata.currenttranslationlist.push(thisid);
					appdata.translationcount++;
				} else {
					if(appdata.translationcount > 1) {
						var j = appdata.currenttranslationlist.indexOf(thisid);
						if (j > -1) {
							appdata.currenttranslationlist.splice(j, 1);
						}
						appdata.translationcount--;
					} else {
						// there's only one translation in the list, do not delete last
						document.getElementById("check-"+thisid.toLowerCase()).checked = true;
					}
				}
			}
			app.savecurrentdata();
		}

		var newlist = [];
		for(i in translationdata) {
			if(appdata.currenttranslationlist.indexOf(translationdata[i].translationid) > -1) {
				newlist.push(translationdata[i].translationid);
			}
		}
		appdata.currenttranslationlist = newlist.slice();
		// also what do we do when one is deleted?
		app.updatesettings();
	},
	setpage: function(newpage) {
		dom.removeclass(".page","on");
		dom.addclass(".page#"+newpage,"on");
		appdata.currentpage = newpage;
		app.resize();
	},
	onDeviceReady: function() {
		console.log("device ready!");
		app.setup();
	},
	setup: function() {
		app.setupnotes();
		app.setupcontrols();
		app.setpage("lens");
	}
};

app.initialize();
if (!('onDeviceReady' in document)) {
	console.log("Running non-Cordova code!");
	app.setup(); // (hopefully this doesn't fire in real version?)
}

},{"./appdata":1,"./bookdata":2,"./dom":4,"./translations/carlyle.js":5,"./translations/italian.js":6,"./translations/longfellow.js":7,"./translations/norton.js":8,"./translations/wright.js":9,"fastclick":10,"hammerjs":11}],4:[function(require,module,exports){
// dom.js

var dom = {
	create: function(htmlStr) {
		var frag = document.createDocumentFragment();
		var temp = document.createElement('div');
		temp.innerHTML = htmlStr;
		while (temp.firstChild) {
			frag.appendChild(temp.firstChild);
		}
		return frag;
	},
	removebyselector: function(selectorstring) {
		var selector = document.querySelector(selectorstring);
		if(selector !== null) {
			selector.parentNode.removeChild(selector);
		}
	},
	addclass: function(selectorstring, myclass) {
		var myelement = document.querySelectorAll(selectorstring);
		if(myclass.indexOf(" ") > -1) {
			var classes = myclass.split(" ");
			for(var j = 0; j < classes.length; j++) {
				dom.addclass(selectorstring, classes[j]);
			}
		} else {
			for (var i = 0; i < myelement.length; i++) {
				myelement[i].classList.add(myclass);
			}
		}
	},
	removeclass: function(selectorstring, myclass) {
		var myelement = document.querySelectorAll(selectorstring);
		if(myclass.indexOf(" ") > -1) {
			var classes = myclass.split(" ");
			for(var j = 0; j < classes.length; j++) {
				dom.removeclass(selectorstring, classes[j]);
			}
		} else {
			for (var i = 0; i < myelement.length; i++) {
				myelement[i].classList.remove(myclass);
			}
		}
	},
	hasclass: function(element, cls) {
		return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
	}
};

module.exports = dom;

},{}],5:[function(require,module,exports){
// carlyle.js

var carlyle = ['<p class="title">Inferno</p><p class="author">John Aitken Carlyle, Thomas Okey &amp; P. H. Wiksteed</p>',

	'<p class="cantohead">CANTO I</p><p class="summary">Dante finds himself astray in a dark Wood, where he spends a night of great misery. He says that death is hardly more bitter, than it is to recall what he suffered there; but that he will tell the fearful things he saw, in order that he may also tell how he found guidance, and first began to discern the real causes of all misery. He comes to a Hill; and seeing its summit already bright with the rays of the Sun, he begins to ascend it. The way to it looks quite deserted. He is met by a beautiful Leopard, which keeps distracting his attention from the Hill, and makes him turn back several times. The hour of the morning, the season, and the gay outward aspect of that animal, give him good hopes at first; but he is driven down and terrified by a Lion and a She-wolf. Virgil comes to his aid, and tells him that the Wolf lets none pass her way, but entangles and slays every one that tries to get up the mountain by the road on which she stands. He says a time will come when a swift and strong Greyhound shall clear the earth of her, and chase her into Hell. And he offers to conduct Dante by another road; to show him the eternal roots of misery and of joy, and leave him with a higher guide that will lead him up to Heaven.</p><p>In the middle of the journey of our life<span class="note"><span class="noteno">1</span><span class="notetext">The Vision takes place at Eastertide of the year 1300, that is to say, when Dante was thirty-five years old. <em>Cf.</em> <em>Psalms</em> xc. 10: &ldquo;The days of our years are threescore years and ten.&rdquo; See also <em>Convito</em> iv: &ldquo;Where the top of this arch of life may be, it is difficult to know.&nbsp;.&nbsp;.&nbsp;. I believe that in the perfectly natural man, it is at the thirty-fifth year.&rdquo;</span></span> I came to myself in a dark wood<span class="note"><span class="noteno">2</span><span class="notetext"><em>Cf.</em> <em>Convito</em> iv: &ldquo;.&nbsp;.&nbsp;.&nbsp;the adolescent who wenters into the Wood of Error of this life would not know how to keep to the good path if it were not pointed out to him by his elders.&rdquo; <em>Politically</em>: the <em>wood</em> stands for the troubled state of Italy in Dante&rsquo;s time.</span></span> where the straight way was lost.</p><p>Ah! how hard a thing it is to tell what a wild, and rough, and stubborn wood this was, which in my thought renews the fear!</p><p>So bitter is it, that scarsely more is death: but to treat of the good that there I found, I will relate the other things that I discerned.</p><p>I cannot rightly tell how I entered it, so full of sleep was I about the moment that I left the true way.</p><p>But after I had reached the foot of a Hill<span class="note"><span class="noteno">3</span><span class="notetext">The &ldquo;holy Hill&rdquo; of the Bible; Bunyan&rsquo;s &ldquo;Delectable Mountains.&rdquo;</span></span> there, where that valley ended, which had pierced my heart with fear,</p><p>I looked up and saw its shoulders already clothed with the rays of the Planet<span class="note"><span class="noteno">4</span><span class="notetext"><em>Planet</em>, the sun, which was a planet according to the Ptolemaic system. Dante speaks elsewhere (<em>Conv.</em> iv) of the &ldquo;spiritual Sun, which is God.&rdquo;</span></span> that leads men straight on every road.</p><p>Then the fear was somewhat calmed, which had continued in the lake of my heart the night that I passed so piteously.</p><p>And as he, who with panting breath has escaped from the deep sea to the shore, turns to the dangerous water and gazes:</p><p>so my mind, which still was fleeing, turned back to see the pass that no one ever left alive.</p><p>After I had rested my wearied body a short while, I took the way again along the desert strand, so that the right foot always was the lower.<span class="note"><span class="noteno">5</span><span class="notetext">Any one who is ascending a hill, and whose left foot is always the lower, must be bearing to the <em>right</em>.</span></span></p><p>And behold, almost at the commencement of the steep, a Leopard,<span class="note"><span class="noteno">6</span><span class="notetext">Worldly Pleasure; <em>politically</em>: Florence.</span></span> light and very nimble, which was covered with spotted hair.</p><p>And it went not from before my face; nay, so impeded my way, that I had often turned to go back.</p><p>The time was at the beginning of the morning; and the sun was mounting up with those stars,<span class="note"><span class="noteno">7</span><span class="notetext">According to tradition, the sun was in Aries at the time of the Creation.</span></span> which were with him when Divine Love</p><p>first moved those fair things: so that the hour of time and the sweet season caused me to have good hope</p><p>of that animal with the gay skin; yet not so, but that I feared at the sight, which appeared to me, of a Lion.<span class="note"><span class="noteno">8</span><span class="notetext">Ambition; <em>politically</em>: the Royal House of France.</span></span></p><p>He seemed coming upon me with head erect, and furious hunger; so that the air seemed to have fear thereat;</p><p>and a She-wolf,<span class="note"><span class="noteno">9</span><span class="notetext"><em>Avarice</em>; <em>politically</em>: the Papal See. The three beasts are obviously taken from <em>Jeremiah</em> v.&nbsp;6.</span></span> that looked full of all cravings in her leanness; and has ere now made many live in sorrow.</p><p>She brought such heaviness upon me with the terror of her aspect, that I lost the hope of ascending.</p><p>And as one who is eager in gaining, and, when the time arrives that makes him lose, weeps and afflicts himself in all his thoughts:</p><p>such that restless beast made me, which coming against me, by little and little drove me back to where the Sun is silent.</p><p>Whilst I was rushing downwards, there appeared before my eyes one<span class="note"><span class="noteno">10</span><span class="notetext">Virgil, who stands for Worldly Wisdom, and is Dante&rsquo;s guide through Hell and Purgatory (see Gardner, pp. 87, 88).<br /><br /><em>hoarse</em>, perhaps because the study of Virgil had been long neglected</span></span> who seemed hoarse from long silence.</p><p>When I saw him in the great desert, I cried: &ldquo;Have pity on me, whate&rsquo;er thou be, whether shade or veritable man!&rdquo;</p><p>He answered me: &ldquo;Not man, a man I once was; and my parents were Lombards, and both of Mantua by country.</p><p>TK!</p>',

	'<p class="cantohead">CANTO II</p><p class="summary">End of the first day. Brief Invocation. Danet is discouraged at the outset, when he begins seriously to reflect upon what he has undertaken. That very day, his own strength had miserably failed before the Lion and the She-Wolf. He bids Virgil consider well whether there be sufficient virtue in him, before committing him to so dreadful a passage. He recalls the great errands of &AElig;neas and of Paul, and the great results of their going to the immortal world; and comparing himself with them, he feels his heart quail, and is ready to turn back. Virgil discerns the fear that has come over him; and in order to remove it, tells him how a blessed Spirit has descended from Heaven expressly to command the journey. On hearing this, Dante immediately casts off pusillanimity, and at once accepts the Freedom and the Mission that are given him.</p><p>TK!</p>',

	'<p class="cantohead">CANTO III</p><p class="summary">Inscription over the Gate of Hell, and the impression it produces upon Dante. Virgil takes him by the hand, and leads him in. The dismal sounds make him burst into tears. His head is quite bewildered. Upon a Dark Plain, which goes around the confines, he sees a vast multitude of spirits running behind a flag in great haste and confusion, urged on by furious wasps and hornets. These are the unhappy people, who never were alive&mdash;never awakened to take any part in either good or evil, to care for anything but themselves. They are mixed with a similar class of fallen angels. After passing through the crowd of them, the Poets come to a great River, which flows round the brim of Hell; and then descends to form the other rivers, the marshes, and the ice that we shall meet with. It is the river Acheron; and on its Shore all that die under the wrath of God assemble from every country to be ferried over by the demon Charon. He makes them enter his boat by glaring on them with his burning eyes. Having seen these, and being refused a passage by Charon, Dante is suddenly stunned by a violent trembling of the ground, accompanied with wind and lightning, and falls down in a state of insensibility.</p><p>TK!</p>'];

module.exports = carlyle;

},{}],6:[function(require,module,exports){
// italian.js

var italian = ['<p class="title">Inferno</p><p class="author">Dante Alighieri</p>',

	'<p class="cantohead">1</p><div class="stanza"><p>Nel mezzo del cammin di nostra vita</p><p>mi ritrovai per una selva oscura,</p><p>ch&eacute; la diritta via era smarrita.</p></div><div class="stanza"><p>Ahi quanto a dir qual era &egrave; cosa dura</p><p>esta selva selvaggia e aspra e forte</p><p>che nel pensier rinova la paura!</p></div><div class="stanza"><p>Tant&rsquo; &egrave; amara che poco &egrave; pi&ugrave; morte;</p><p>ma per trattar del ben ch&rsquo;i&rsquo; vi trovai,</p><p>dir&ograve; de l&rsquo;altre cose ch&rsquo;i&rsquo; v&rsquo;ho scorte.</p></div><div class="stanza"><p>Io non so ben ridir com&rsquo; i&rsquo; v&rsquo;intrai,</p><p>tant&rsquo; era pien di sonno a quel punto</p><p>che la verace via abbandonai.</p></div><div class="stanza"><p>Ma poi ch&rsquo;i&rsquo; fui al pi&egrave; d&rsquo;un colle giunto,</p><p>l&agrave; dove terminava quella valle</p><p>che m&rsquo;avea di paura il cor compunto,</p></div><div class="stanza"><p>guardai in alto e vidi le sue spalle</p><p>vestite gi&agrave; de&rsquo; raggi del pianeta</p><p>che mena dritto altrui per ogne calle.</p></div><div class="stanza"><p>Allor fu la paura un poco queta,</p><p>che nel lago del cor m&rsquo;era durata</p><p>la notte ch&rsquo;i&rsquo; passai con tanta pieta.</p></div><div class="stanza"><p>E come quei che con lena affannata,</p><p>uscito fuor del pelago a la riva,</p><p>si volge a l&rsquo;acqua perigliosa e guata,</p></div><div class="stanza"><p>cos&igrave; l&rsquo;animo mio, ch&rsquo;ancor fuggiva,</p><p>si volse a retro a rimirar lo passo</p><p>che non lasci&ograve; gi&agrave; mai persona viva.</p></div><div class="stanza"><p>Poi ch&rsquo;&egrave;i posato un poco il corpo lasso,</p><p>ripresi via per la piaggia diserta,</p><p>s&igrave; che &rsquo;l pi&egrave; fermo sempre era &rsquo;l pi&ugrave; basso.</p></div><div class="stanza"><p>Ed ecco, quasi al cominciar de l&rsquo;erta,</p><p>una lonza leggera e presta molto,</p><p>che di pel macolato era coverta;</p></div><div class="stanza"><p>e non mi si partia dinanzi al volto,</p><p>anzi &rsquo;mpediva tanto il mio cammino,</p><p>ch&rsquo;i&rsquo; fui per ritornar pi&ugrave; volte v&ograve;lto.</p></div><div class="stanza"><p>Temp&rsquo; era dal principio del mattino,</p><p>e &rsquo;l sol montava &rsquo;n s&ugrave; con quelle stelle</p><p>ch&rsquo;eran con lui quando l&rsquo;amor divino</p></div><div class="stanza"><p>mosse di prima quelle cose belle;</p><p>s&igrave; ch&rsquo;a bene sperar m&rsquo;era cagione</p><p>di quella fiera a la gaetta pelle</p></div><div class="stanza"><p>l&rsquo;ora del tempo e la dolce stagione;</p><p>ma non s&igrave; che paura non mi desse</p><p>la vista che m&rsquo;apparve d&rsquo;un leone.</p></div><div class="stanza"><p>Questi parea che contra me venisse</p><p>con la test&rsquo; alta e con rabbiosa fame,</p><p>s&igrave; che parea che l&rsquo;aere ne tremesse.</p></div><div class="stanza"><p>Ed una lupa, che di tutte brame</p><p>sembiava carca ne la sua magrezza,</p><p>e molte genti f&eacute; gi&agrave; viver grame,</p></div><div class="stanza"><p>questa mi porse tanto di gravezza</p><p>con la paura ch&rsquo;uscia di sua vista,</p><p>ch&rsquo;io perdei la speranza de l&rsquo;altezza.</p></div><div class="stanza"><p>E qual &egrave; quei che volontieri acquista,</p><p>e giugne &rsquo;l tempo che perder lo face,</p><p>che &rsquo;n tutti suoi pensier piange e s&rsquo;attrista;</p></div><div class="stanza"><p>tal mi fece la bestia sanza pace,</p><p>che, venendomi &rsquo;ncontro, a poco a poco</p><p>mi ripigneva l&agrave; dove &rsquo;l sol tace.</p></div><div class="stanza"><p>Mentre ch&rsquo;i&rsquo; rovinava in basso loco,</p><p>dinanzi a li occhi mi si fu offerto</p><p>chi per lungo silenzio parea fioco.</p></div><div class="stanza"><p>Quando vidi costui nel gran diserto,</p><p>&laquo;Miserere di me&raquo;, gridai a lui,</p><p>&laquo;qual che tu sii, od ombra od omo certo!&raquo;.</p></div><div class="stanza"><p>Rispuosemi: &laquo;Non omo, omo gi&agrave; fui,</p><p>e li parenti miei furon lombardi,</p><p>mantoani per patr&iuml;a ambedui.</p></div><div class="stanza"><p>Nacqui sub Iulio, ancor che fosse tardi,</p><p>e vissi a Roma sotto &rsquo;l buono Augusto</p><p>nel tempo de li d&egrave;i falsi e bugiardi.</p></div><div class="stanza"><p>Poeta fui, e cantai di quel giusto</p><p>figliuol d&rsquo;Anchise che venne di Troia,</p><p>poi che &rsquo;l superbo Il&iuml;&oacute;n fu combusto.</p></div><div class="stanza"><p>Ma tu perch&eacute; ritorni a tanta noia?</p><p>perch&eacute; non sali il dilettoso monte</p><p>ch&rsquo;&egrave; principio e cagion di tutta gioia?&raquo;.</p></div><div class="stanza"><p>&laquo;Or se&rsquo; tu quel Virgilio e quella fonte</p><p>che spandi di parlar s&igrave; largo fiume?&raquo;,</p><p>rispuos&rsquo; io lui con vergognosa fronte.</p></div><div class="stanza"><p>&laquo;O de li altri poeti onore e lume,</p><p>vagliami &rsquo;l lungo studio e &rsquo;l grande amore</p><p>che m&rsquo;ha fatto cercar lo tuo volume.</p></div><div class="stanza"><p>Tu se&rsquo; lo mio maestro e &rsquo;l mio autore,</p><p>tu se&rsquo; solo colui da cu&rsquo; io tolsi</p><p>lo bello stilo che m&rsquo;ha fatto onore.</p></div><div class="stanza"><p>Vedi la bestia per cu&rsquo; io mi volsi;</p><p>aiutami da lei, famoso saggio,</p><p>ch&rsquo;ella mi fa tremar le vene e i polsi&raquo;.</p></div><div class="stanza"><p>&laquo;A te convien tenere altro v&iuml;aggio&raquo;,</p><p>rispuose, poi che lagrimar mi vide,</p><p>&laquo;se vuo&rsquo; campar d&rsquo;esto loco selvaggio;</p></div><div class="stanza"><p>ch&eacute; questa bestia, per la qual tu gride,</p><p>non lascia altrui passar per la sua via,</p><p>ma tanto lo &rsquo;mpedisce che l&rsquo;uccide;</p></div><div class="stanza"><p>e ha natura s&igrave; malvagia e ria,</p><p>che mai non empie la bramosa voglia,</p><p>e dopo &rsquo;l pasto ha pi&ugrave; fame che pria.</p></div><div class="stanza"><p>Molti son li animali a cui s&rsquo;ammoglia,</p><p>e pi&ugrave; saranno ancora, infin che &rsquo;l veltro</p><p>verr&agrave;, che la far&agrave; morir con doglia.</p></div><div class="stanza"><p>Questi non ciber&agrave; terra n&eacute; peltro,</p><p>ma sap&iuml;enza, amore e virtute,</p><p>e sua nazion sar&agrave; tra feltro e feltro.</p></div><div class="stanza"><p>Di quella umile Italia fia salute</p><p>per cui mor&igrave; la vergine Cammilla,</p><p>Eurialo e Turno e Niso di ferute.</p></div><div class="stanza"><p>Questi la caccer&agrave; per ogne villa,</p><p>fin che l&rsquo;avr&agrave; rimessa ne lo &rsquo;nferno,</p><p>l&agrave; onde &rsquo;nvidia prima dipartilla.</p></div><div class="stanza"><p>Ond&rsquo; io per lo tuo me&rsquo; penso e discerno</p><p>che tu mi segui, e io sar&ograve; tua guida,</p><p>e trarrotti di qui per loco etterno;</p></div><div class="stanza"><p>ove udirai le disperate strida,</p><p>vedrai li antichi spiriti dolenti,</p><p>ch&rsquo;a la seconda morte ciascun grida;</p></div><div class="stanza"><p>e vederai color che son contenti</p><p>nel foco, perch&eacute; speran di venire</p><p>quando che sia a le beate genti.</p></div><div class="stanza"><p>A le quai poi se tu vorrai salire,</p><p>anima fia a ci&ograve; pi&ugrave; di me degna:</p><p>con lei ti lascer&ograve; nel mio partire;</p></div><div class="stanza"><p>ch&eacute; quello imperador che l&agrave; s&ugrave; regna,</p><p>perch&rsquo; i&rsquo; fu&rsquo; ribellante a la sua legge,</p><p>non vuol che &rsquo;n sua citt&agrave; per me si vegna.</p></div><div class="stanza"><p>In tutte parti impera e quivi regge;</p><p>quivi &egrave; la sua citt&agrave; e l&rsquo;alto seggio:</p><p>oh felice colui cu&rsquo; ivi elegge!&raquo;.</p></div><div class="stanza"><p>E io a lui: &laquo;Poeta, io ti richeggio</p><p>per quello Dio che tu non conoscesti,</p><p>acci&ograve; ch&rsquo;io fugga questo male e peggio,</p></div><div class="stanza"><p>che tu mi meni l&agrave; dov&rsquo; or dicesti,</p><p>s&igrave; ch&rsquo;io veggia la porta di san Pietro</p><p>e color cui tu fai cotanto mesti&raquo;.</p></div><div class="stanza"><p>Allor si mosse, e io li tenni dietro.</p></div>',

	'<p class="cantohead">2</p>	<div class="stanza"><p>Lo giorno se n&rsquo;andava, e l&rsquo;aere bruno</p><p>toglieva li animai che sono in terra</p><p>da le fatiche loro; e io sol uno</p></div><div class="stanza"><p>m&rsquo;apparecchiava a sostener la guerra</p><p>s&igrave; del cammino e s&igrave; de la pietate,</p><p>che ritrarr&agrave; la mente che non erra.</p></div><div class="stanza"><p>O muse, o alto ingegno, or m&rsquo;aiutate;</p><p>o mente che scrivesti ci&ograve; ch&rsquo;io vidi,</p><p>qui si parr&agrave; la tua nobilitate.</p></div><div class="stanza"><p>Io cominciai: &laquo;Poeta che mi guidi,</p><p>guarda la mia virt&ugrave; s&rsquo;ell&rsquo; &egrave; possente,</p><p>prima ch&rsquo;a l&rsquo;alto passo tu mi fidi.</p></div><div class="stanza"><p>Tu dici che di Silv&iuml;o il parente,</p><p>corruttibile ancora, ad immortale</p><p>secolo and&ograve;, e fu sensibilmente.</p></div><div class="stanza"><p>Per&ograve;, se l&rsquo;avversario d&rsquo;ogne male</p><p>cortese i fu, pensando l&rsquo;alto effetto</p><p>ch&rsquo;uscir dovea di lui, e &rsquo;l chi e &rsquo;l quale</p></div><div class="stanza"><p>non pare indegno ad omo d&rsquo;intelletto;</p><p>ch&rsquo;e&rsquo; fu de l&rsquo;alma Roma e di suo impero</p><p>ne l&rsquo;empireo ciel per padre eletto:</p></div><div class="stanza"><p>la quale e &rsquo;l quale, a voler dir lo vero,</p><p>fu stabilita per lo loco santo</p><p>u&rsquo; siede il successor del maggior Piero.</p></div><div class="stanza"><p>Per quest&rsquo; andata onde li dai tu vanto,</p><p>intese cose che furon cagione</p><p>di sua vittoria e del papale ammanto.</p></div><div class="stanza"><p>Andovvi poi lo Vas d&rsquo;elez&iuml;one,</p><p>per recarne conforto a quella fede</p><p>ch&rsquo;&egrave; principio a la via di salvazione.</p></div><div class="stanza"><p>Ma io, perch&eacute; venirvi? o chi &rsquo;l concede?</p><p>Io non Enëa, io non Paulo sono;</p><p>me degno a ci&ograve; n&eacute; io n&eacute; altri &rsquo;l crede.</p></div><div class="stanza"><p>Per che, se del venire io m&rsquo;abbandono,</p><p>temo che la venuta non sia folle.</p><p>Se&rsquo; savio; intendi me&rsquo; ch&rsquo;i&rsquo; non ragiono&raquo;.</p></div><div class="stanza"><p>E qual &egrave; quei che disvuol ci&ograve; che volle</p><p>e per novi pensier cangia proposta,</p><p>s&igrave; che dal cominciar tutto si tolle,</p></div><div class="stanza"><p>tal mi fec&rsquo; &iuml;o &rsquo;n quella oscura costa,</p><p>perch&eacute;, pensando, consumai la &rsquo;mpresa</p><p>che fu nel cominciar cotanto tosta.</p></div><div class="stanza"><p>&laquo;S&rsquo;i&rsquo; ho ben la parola tua intesa&raquo;,</p><p>rispuose del magnanimo quell&rsquo; ombra,</p><p>&laquo;l&rsquo;anima tua &egrave; da viltade offesa;</p></div><div class="stanza"><p>la qual molte f&iuml;ate l&rsquo;omo ingombra</p><p>s&igrave; che d&rsquo;onrata impresa lo rivolve,</p><p>come falso veder bestia quand&rsquo; ombra.</p></div><div class="stanza"><p>Da questa tema acci&ograve; che tu ti solve,</p><p>dirotti perch&rsquo; io venni e quel ch&rsquo;io &rsquo;ntesi</p><p>nel primo punto che di te mi dolve.</p></div><div class="stanza"><p>Io era tra color che son sospesi,</p><p>e donna mi chiam&ograve; beata e bella,</p><p>tal che di comandare io la richiesi.</p></div><div class="stanza"><p>Lucevan li occhi suoi pi&ugrave; che la stella;</p><p>e cominciommi a dir soave e piana,</p><p>con angelica voce, in sua favella:</p></div><div class="stanza"><p>“O anima cortese mantoana,</p><p>di cui la fama ancor nel mondo dura,</p><p>e durer&agrave; quanto &rsquo;l mondo lontana,</p></div><div class="stanza"><p>l&rsquo;amico mio, e non de la ventura,</p><p>ne la diserta piaggia &egrave; impedito</p><p>s&igrave; nel cammin, che v&ograve;lt&rsquo; &egrave; per paura;</p></div><div class="stanza"><p>e temo che non sia gi&agrave; s&igrave; smarrito,</p><p>ch&rsquo;io mi sia tardi al soccorso levata,</p><p>per quel ch&rsquo;i&rsquo; ho di lui nel cielo udito.</p></div><div class="stanza"><p>Or movi, e con la tua parola ornata</p><p>e con ci&ograve; c&rsquo;ha mestieri al suo campare,</p><p>l&rsquo;aiuta s&igrave; ch&rsquo;i&rsquo; ne sia consolata.</p></div><div class="stanza"><p>I&rsquo; son Beatrice che ti faccio andare;</p><p>vegno del loco ove tornar disio;</p><p>amor mi mosse, che mi fa parlare.</p></div><div class="stanza"><p>Quando sar&ograve; dinanzi al segnor mio,</p><p>di te mi loder&ograve; sovente a lui”.</p><p>Tacette allora, e poi comincia&rsquo; io:</p></div><div class="stanza"><p>“O donna di virt&ugrave; sola per cui</p><p>l&rsquo;umana spezie eccede ogne contento</p><p>di quel ciel c&rsquo;ha minor li cerchi sui,</p></div><div class="stanza"><p>tanto m&rsquo;aggrada il tuo comandamento,</p><p>che l&rsquo;ubidir, se gi&agrave; fosse, m&rsquo;&egrave; tardi;</p><p>pi&ugrave; non t&rsquo;&egrave; uo&rsquo; ch&rsquo;aprirmi il tuo talento.</p></div><div class="stanza"><p>Ma dimmi la cagion che non ti guardi</p><p>de lo scender qua giuso in questo centro</p><p>de l&rsquo;ampio loco ove tornar tu ardi”.</p></div><div class="stanza"><p>“Da che tu vuo&rsquo; saver cotanto a dentro,</p><p>dirotti brievemente”, mi rispuose,</p><p>“perch&rsquo; i&rsquo; non temo di venir qua entro.</p></div><div class="stanza"><p>Temer si dee di sole quelle cose</p><p>c&rsquo;hanno potenza di fare altrui male;</p><p>de l&rsquo;altre no, ch&eacute; non son paurose.</p></div><div class="stanza"><p>I&rsquo; son fatta da Dio, sua merc&eacute;, tale,</p><p>che la vostra miseria non mi tange,</p><p>n&eacute; fiamma d&rsquo;esto &rsquo;ncendio non m&rsquo;assale.</p></div><div class="stanza"><p>Donna &egrave; gentil nel ciel che si compiange</p><p>di questo &rsquo;mpedimento ov&rsquo; io ti mando,</p><p>s&igrave; che duro giudicio l&agrave; s&ugrave; frange.</p></div><div class="stanza"><p>Questa chiese Lucia in suo dimando</p><p>e disse:—Or ha bisogno il tuo fedele</p><p>di te, e io a te lo raccomando—.</p></div><div class="stanza"><p>Lucia, nimica di ciascun crudele,</p><p>si mosse, e venne al loco dov&rsquo; i&rsquo; era,</p><p>che mi sedea con l&rsquo;antica Rachele.</p></div><div class="stanza"><p>Disse:—Beatrice, loda di Dio vera,</p><p>ch&eacute; non soccorri quei che t&rsquo;am&ograve; tanto,</p><p>ch&rsquo;usc&igrave; per te de la volgare schiera?</p></div><div class="stanza"><p>Non odi tu la pieta del suo pianto,</p><p>non vedi tu la morte che &rsquo;l combatte</p><p>su la fiumana ove &rsquo;l mar non ha vanto?—.</p></div><div class="stanza"><p>Al mondo non fur mai persone ratte</p><p>a far lor pro o a fuggir lor danno,</p><p>com&rsquo; io, dopo cotai parole fatte,</p></div><div class="stanza"><p>venni qua gi&ugrave; del mio beato scanno,</p><p>fidandomi del tuo parlare onesto,</p><p>ch&rsquo;onora te e quei ch&rsquo;udito l&rsquo;hanno”.</p></div><div class="stanza"><p>Poscia che m&rsquo;ebbe ragionato questo,</p><p>li occhi lucenti lagrimando volse,</p><p>per che mi fece del venir pi&ugrave; presto.</p></div><div class="stanza"><p>E venni a te cos&igrave; com&rsquo; ella volse:</p><p>d&rsquo;inanzi a quella fiera ti levai</p><p>che del bel monte il corto andar ti tolse.</p></div><div class="stanza"><p>Dunque: che &egrave;? perch&eacute;, perch&eacute; restai,</p><p>perch&eacute; tanta vilt&agrave; nel core allette,</p><p>perch&eacute; ardire e franchezza non hai,</p></div><div class="stanza"><p>poscia che tai tre donne benedette</p><p>curan di te ne la corte del cielo,</p><p>e &rsquo;l mio parlar tanto ben ti promette?&raquo;.</p></div><div class="stanza"><p>Quali fioretti dal notturno gelo</p><p>chinati e chiusi, poi che &rsquo;l sol li &rsquo;mbianca,</p><p>si drizzan tutti aperti in loro stelo,</p></div><div class="stanza"><p>tal mi fec&rsquo; io di mia virtude stanca,</p><p>e tanto buono ardire al cor mi corse,</p><p>ch&rsquo;i&rsquo; cominciai come persona franca:</p></div><div class="stanza"><p>&laquo;Oh pietosa colei che mi soccorse!</p><p>e te cortese ch&rsquo;ubidisti tosto</p><p>a le vere parole che ti porse!</p></div><div class="stanza"><p>Tu m&rsquo;hai con disiderio il cor disposto</p><p>s&igrave; al venir con le parole tue,</p><p>ch&rsquo;i&rsquo; son tornato nel primo proposto.</p></div><div class="stanza"><p>Or va, ch&rsquo;un sol volere &egrave; d&rsquo;ambedue:</p><p>tu duca, tu segnore e tu maestro&raquo;.</p><p>Cos&igrave; li dissi; e poi che mosso fue,</p></div><div class="stanza"><p>intrai per lo cammino alto e silvestro.</p></div>',

	'<p class="cantohead">3</p><div class="stanza"><p>‘&lsquo;Per me si va ne la citt&agrave; dolente,</p><p>per me si va ne l&rsquo;etterno dolore,</p><p>per me si va tra la perduta gente.</p></div><div class="stanza"><p>Giustizia mosse il mio alto fattore;</p><p>fecemi la divina podestate,</p><p>la somma sap&iuml;enza e &rsquo;l primo amore.</p></div><div class="stanza"><p>Dinanzi a me non fuor cose create</p><p>se non etterne, e io etterno duro.</p><p>Lasciate ogne speranza, voi ch&rsquo;intrate&rsquo;.</p></div><div class="stanza"><p>Queste parole di colore oscuro</p><p>vid&rsquo; &iuml;o scritte al sommo d&rsquo;una porta;</p><p>per ch&rsquo;io: &laquo;Maestro, il senso lor m&rsquo;&egrave; duro&raquo;.</p></div><div class="stanza"><p>Ed elli a me, come persona accorta:</p><p>&laquo;Qui si convien lasciare ogne sospetto;</p><p>ogne vilt&agrave; convien che qui sia morta.</p></div><div class="stanza"><p>Noi siam venuti al loco ov&rsquo; i&rsquo; t&rsquo;ho detto</p><p>che tu vedrai le genti dolorose</p><p>c&rsquo;hanno perduto il ben de l&rsquo;intelletto&raquo;.</p></div><div class="stanza"><p>E poi che la sua mano a la mia puose</p><p>con lieto volto, ond&rsquo; io mi confortai,</p><p>mi mise dentro a le segrete cose.</p></div><div class="stanza"><p>Quivi sospiri, pianti e alti guai</p><p>risonavan per l&rsquo;aere sanza stelle,</p><p>per ch&rsquo;io al cominciar ne lagrimai.</p></div><div class="stanza"><p>Diverse lingue, orribili favelle,</p><p>parole di dolore, accenti d&rsquo;ira,</p><p>voci alte e fioche, e suon di man con elle</p></div><div class="stanza"><p>facevano un tumulto, il qual s&rsquo;aggira</p><p>sempre in quell&rsquo; aura sanza tempo tinta,</p><p>come la rena quando turbo spira.</p></div><div class="stanza"><p>E io ch&rsquo;avea d&rsquo;error la testa cinta,</p><p>dissi: &laquo;Maestro, che &egrave; quel ch&rsquo;i&rsquo; odo?</p><p>e che gent&rsquo; &egrave; che par nel duol s&igrave; vinta?&raquo;.</p></div><div class="stanza"><p>Ed elli a me: &laquo;Questo misero modo</p><p>tegnon l&rsquo;anime triste di coloro</p><p>che visser sanza &rsquo;nfamia e sanza lodo.</p></div><div class="stanza"><p>Mischiate sono a quel cattivo coro</p><p>de li angeli che non furon ribelli</p><p>n&eacute; fur fedeli a Dio, ma per s&eacute; fuoro.</p></div><div class="stanza"><p>Caccianli i ciel per non esser men belli,</p><p>n&eacute; lo profondo inferno li riceve,</p><p>ch&rsquo;alcuna gloria i rei avrebber d&rsquo;elli&raquo;.</p></div><div class="stanza"><p>E io: &laquo;Maestro, che &egrave; tanto greve</p><p>a lor che lamentar li fa s&igrave; forte?&raquo;.</p><p>Rispuose: &laquo;Dicerolti molto breve.</p></div><div class="stanza"><p>Questi non hanno speranza di morte,</p><p>e la lor cieca vita &egrave; tanto bassa,</p><p>che &rsquo;nvid&iuml;osi son d&rsquo;ogne altra sorte.</p></div><div class="stanza"><p>Fama di loro il mondo esser non lassa;</p><p>misericordia e giustizia li sdegna:</p><p>non ragioniam di lor, ma guarda e passa&raquo;.</p></div><div class="stanza"><p>E io, che riguardai, vidi una &rsquo;nsegna</p><p>che girando correva tanto ratta,</p><p>che d&rsquo;ogne posa mi parea indegna;</p></div><div class="stanza"><p>e dietro le ven&igrave;a s&igrave; lunga tratta</p><p>di gente, ch&rsquo;i&rsquo; non averei creduto</p><p>che morte tanta n&rsquo;avesse disfatta.</p></div><div class="stanza"><p>Poscia ch&rsquo;io v&rsquo;ebbi alcun riconosciuto,</p><p>vidi e conobbi l&rsquo;ombra di colui</p><p>che fece per viltade il gran rifiuto.</p></div><div class="stanza"><p>Incontanente intesi e certo fui</p><p>che questa era la setta d&rsquo;i cattivi,</p><p>a Dio spiacenti e a&rsquo; nemici sui.</p></div><div class="stanza"><p>Questi sciaurati, che mai non fur vivi,</p><p>erano ignudi e stimolati molto</p><p>da mosconi e da vespe ch&rsquo;eran ivi.</p></div><div class="stanza"><p>Elle rigavan lor di sangue il volto,</p><p>che, mischiato di lagrime, a&rsquo; lor piedi</p><p>da fastidiosi vermi era ricolto.</p></div><div class="stanza"><p>E poi ch&rsquo;a riguardar oltre mi diedi,</p><p>vidi genti a la riva d&rsquo;un gran fiume;</p><p>per ch&rsquo;io dissi: &laquo;Maestro, or mi concedi</p></div><div class="stanza"><p>ch&rsquo;i&rsquo; sappia quali sono, e qual costume</p><p>le fa di trapassar parer s&igrave; pronte,</p><p>com&rsquo; i&rsquo; discerno per lo fioco lume&raquo;.</p></div><div class="stanza"><p>Ed elli a me: &laquo;Le cose ti fier conte</p><p>quando noi fermerem li nostri passi</p><p>su la trista riviera d&rsquo;Acheronte&raquo;.</p></div><div class="stanza"><p>Allor con li occhi vergognosi e bassi,</p><p>temendo no &rsquo;l mio dir li fosse grave,</p><p>infino al fiume del parlar mi trassi.</p></div><div class="stanza"><p>Ed ecco verso noi venir per nave</p><p>un vecchio, bianco per antico pelo,</p><p>gridando: &laquo;Guai a voi, anime prave!</p></div><div class="stanza"><p>Non isperate mai veder lo cielo:</p><p>i&rsquo; vegno per menarvi a l&rsquo;altra riva</p><p>ne le tenebre etterne, in caldo e &rsquo;n gelo.</p></div><div class="stanza"><p>E tu che se&rsquo; cost&igrave;, anima viva,</p><p>p&agrave;rtiti da cotesti che son morti&raquo;.</p><p>Ma poi che vide ch&rsquo;io non mi partiva,</p></div><div class="stanza"><p>disse: &laquo;Per altra via, per altri porti</p><p>verrai a piaggia, non qui, per passare:</p><p>pi&ugrave; lieve legno convien che ti porti&raquo;.</p></div><div class="stanza"><p>E &rsquo;l duca lui: &laquo;Caron, non ti crucciare:</p><p>vuolsi cos&igrave; col&agrave; dove si puote</p><p>ci&ograve; che si vuole, e pi&ugrave; non dimandare&raquo;.</p></div><div class="stanza"><p>Quinci fuor quete le lanose gote</p><p>al nocchier de la livida palude,</p><p>che &rsquo;ntorno a li occhi avea di fiamme rote.</p></div><div class="stanza"><p>Ma quell&rsquo; anime, ch&rsquo;eran lasse e nude,</p><p>cangiar colore e dibattero i denti,</p><p>ratto che &rsquo;nteser le parole crude.</p></div><div class="stanza"><p>Bestemmiavano Dio e lor parenti,</p><p>l&rsquo;umana spezie e &rsquo;l loco e &rsquo;l tempo e &rsquo;l seme</p><p>di lor semenza e di lor nascimenti.</p></div><div class="stanza"><p>Poi si ritrasser tutte quante insieme,</p><p>forte piangendo, a la riva malvagia</p><p>ch&rsquo;attende ciascun uom che Dio non teme.</p></div><div class="stanza"><p>Caron dimonio, con occhi di bragia</p><p>loro accennando, tutte le raccoglie;</p><p>batte col remo qualunque s&rsquo;adagia.</p></div><div class="stanza"><p>Come d&rsquo;autunno si levan le foglie</p><p>l&rsquo;una appresso de l&rsquo;altra, fin che &rsquo;l ramo</p><p>vede a la terra tutte le sue spoglie,</p></div><div class="stanza"><p>similemente il mal seme d&rsquo;Adamo</p><p>gittansi di quel lito ad una ad una,</p><p>per cenni come augel per suo richiamo.</p></div><div class="stanza"><p>Cos&igrave; sen vanno su per l&rsquo;onda bruna,</p><p>e avanti che sien di l&agrave; discese,</p><p>anche di qua nuova schiera s&rsquo;auna.</p></div><div class="stanza"><p>&laquo;Figliuol mio&raquo;, disse &rsquo;l maestro cortese,</p><p>&laquo;quelli che muoion ne l&rsquo;ira di Dio</p><p>tutti convegnon qui d&rsquo;ogne paese;</p></div><div class="stanza"><p>e pronti sono a trapassar lo rio,</p><p>ch&eacute; la divina giustizia li sprona,</p><p>s&igrave; che la tema si volve in disio.</p></div><div class="stanza"><p>Quinci non passa mai anima buona;</p><p>e per&ograve;, se Caron di te si lagna,</p><p>ben puoi sapere omai che &rsquo;l suo dir suona&raquo;.</p></div><div class="stanza"><p>Finito questo, la buia campagna</p><p>trem&ograve; s&igrave; forte, che de lo spavento</p><p>la mente di sudore ancor mi bagna.</p></div><div class="stanza"><p>La terra lagrimosa diede vento,</p><p>che balen&ograve; una luce vermiglia</p><p>la qual mi vinse ciascun sentimento;</p></div><div class="stanza"><p>e caddi come l&rsquo;uom cui sonno piglia.</p></div>'];

module.exports = italian;

},{}],7:[function(require,module,exports){
// longfellow.js

var longfellow = ['<p class="title">Inferno</p><p class="author">Henry Wadsworth Longfellow</p>',

	'<p class="cantohead">Inferno: Canto I</p><div class="stanza"><p>Midway upon the journey of our life</p><p class="slindent">I found myself within a forest dark,</p><p class="slindent">For the straightforward pathway had been lost.</p></div><div class="stanza"><p>Ah me! how hard a thing it is to say</p><p class="slindent">What was this forest savage, rough, and stern,</p><p class="slindent">Which in the very thought renews the fear.</p></div><div class="stanza"><p>So bitter is it, death is little more;</p><p class="slindent">But of the good to treat, which there I found,</p><p class="slindent">Speak will I of the other things I saw there.</p></div><div class="stanza"><p>I cannot well repeat how there I entered,</p><p class="slindent">So full was I of slumber at the moment</p><p class="slindent">In which I had abandoned the true way.</p></div><div class="stanza"><p>But after I had reached a mountain&rsquo;s foot,</p><p class="slindent">At that point where the valley terminated,</p><p class="slindent">Which had with consternation pierced my heart,</p></div><div class="stanza"><p>Upward I looked, and I beheld its shoulders,</p><p class="slindent">Vested already with that planet&rsquo;s rays</p><p class="slindent">Which leadeth others right by every road.</p></div><div class="stanza"><p>Then was the fear a little quieted</p><p class="slindent">That in my heart&rsquo;s lake had endured throughout</p><p class="slindent">The night, which I had passed so piteously.</p></div><div class="stanza"><p>And even as he, who, with distressful breath,</p><p class="slindent">Forth issued from the sea upon the shore,</p><p class="slindent">Turns to the water perilous and gazes;</p></div><div class="stanza"><p>So did my soul, that still was fleeing onward,</p><p class="slindent">Turn itself back to re-behold the pass</p><p class="slindent">Which never yet a living person left.</p></div><div class="stanza"><p>After my weary body I had rested,</p><p class="slindent">The way resumed I on the desert slope,</p><p class="slindent">So that the firm foot ever was the lower.</p></div><div class="stanza"><p>And lo! almost where the ascent began,</p><p class="slindent">A panther light and swift exceedingly,</p><p class="slindent">Which with a spotted skin was covered o&rsquo;er!</p></div><div class="stanza"><p>And never moved she from before my face,</p><p class="slindent">Nay, rather did impede so much my way,</p><p class="slindent">That many times I to return had turned.</p></div><div class="stanza"><p>The time was the beginning of the morning,</p><p class="slindent">And up the sun was mounting with those stars</p><p class="slindent">That with him were, what time the Love Divine</p></div><div class="stanza"><p>At first in motion set those beauteous things;</p><p class="slindent">So were to me occasion of good hope,</p><p class="slindent">The variegated skin of that wild beast,</p></div><div class="stanza"><p>The hour of time, and the delicious season;</p><p class="slindent">But not so much, that did not give me fear</p><p class="slindent">A lion&rsquo;s aspect which appeared to me.</p></div><div class="stanza"><p>He seemed as if against me he were coming</p><p class="slindent">With head uplifted, and with ravenous hunger,</p><p class="slindent">So that it seemed the air was afraid of him;</p></div><div class="stanza"><p>And a she-wolf, that with all hungerings</p><p class="slindent">Seemed to be laden in her meagreness,</p><p class="slindent">And many folk has caused to live forlorn!</p></div><div class="stanza"><p>She brought upon me so much heaviness,</p><p class="slindent">With the affright that from her aspect came,</p><p class="slindent">That I the hope relinquished of the height.</p></div><div class="stanza"><p>And as he is who willingly acquires,</p><p class="slindent">And the time comes that causes him to lose,</p><p class="slindent">Who weeps in all his thoughts and is despondent,</p></div><div class="stanza"><p>E&rsquo;en such made me that beast withouten peace,</p><p class="slindent">Which, coming on against me by degrees</p><p class="slindent">Thrust me back thither where the sun is silent.</p></div><div class="stanza"><p>While I was rushing downward to the lowland,</p><p class="slindent">Before mine eyes did one present himself,</p><p class="slindent">Who seemed from long-continued silence hoarse.</p></div><div class="stanza"><p>When I beheld him in the desert vast,</p><p class="slindent">&ldquo;Have pity on me,&rdquo; unto him I cried,</p><p class="slindent">&ldquo;Whiche&rsquo;er thou art, or shade or real man!&rdquo;</p></div><div class="stanza"><p>He answered me: &ldquo;Not man; man once I was,</p><p class="slindent">And both my parents were of Lombardy,</p><p class="slindent">And Mantuans by country both of them.</p></div><div class="stanza"><p>&lsquo;Sub Julio&rsquo; was I born, though it was late,</p><p class="slindent">And lived at Rome under the good Augustus,</p><p class="slindent">During the time of false and lying gods.</p></div><div class="stanza"><p>A poet was I, and I sang that just</p><p class="slindent">Son of Anchises, who came forth from Troy,</p><p class="slindent">After that Ilion the superb was burned.</p></div><div class="stanza"><p>But thou, why goest thou back to such annoyance?</p><p class="slindent">Why climb&rsquo;st thou not the Mount Delectable,</p><p class="slindent">Which is the source and cause of every joy?&rdquo;</p></div><div class="stanza"><p>&ldquo;Now, art thou that Virgilius and that fountain</p><p class="slindent">Which spreads abroad so wide a river of speech?&rdquo;</p><p class="slindent">I made response to him with bashful forehead.</p></div><div class="stanza"><p>&ldquo;O, of the other poets honour and light,</p><p class="slindent">Avail me the long study and great love</p><p class="slindent">That have impelled me to explore thy volume!</p></div><div class="stanza"><p>Thou art my master, and my author thou,</p><p class="slindent">Thou art alone the one from whom I took</p><p class="slindent">The beautiful style that has done honour to me.</p></div><div class="stanza"><p>Behold the beast, for which I have turned back;</p><p class="slindent">Do thou protect me from her, famous Sage,</p><p class="slindent">For she doth make my veins and pulses tremble.&rdquo;</p></div><div class="stanza"><p>&ldquo;Thee it behoves to take another road,&rdquo;</p><p class="slindent">Responded he, when he beheld me weeping,</p><p class="slindent">&ldquo;If from this savage place thou wouldst escape;</p></div><div class="stanza"><p>Because this beast, at which thou criest out,</p><p class="slindent">Suffers not any one to pass her way,</p><p class="slindent">But so doth harass him, that she destroys him;</p></div><div class="stanza"><p>And has a nature so malign and ruthless,</p><p class="slindent">That never doth she glut her greedy will,</p><p class="slindent">And after food is hungrier than before.</p></div><div class="stanza"><p>Many the animals with whom she weds,</p><p class="slindent">And more they shall be still, until the Greyhound</p><p class="slindent">Comes, who shall make her perish in her pain.</p></div><div class="stanza"><p>He shall not feed on either earth or pelf,</p><p class="slindent">But upon wisdom, and on love and virtue;</p><p class="slindent">&rsquo;Twixt Feltro and Feltro shall his nation be;</p></div><div class="stanza"><p>Of that low Italy shall he be the saviour,</p><p class="slindent">On whose account the maid Camilla died,</p><p class="slindent">Euryalus, Turnus, Nisus, of their wounds;</p></div><div class="stanza"><p>Through every city shall he hunt her down,</p><p class="slindent">Until he shall have driven her back to Hell,</p><p class="slindent">There from whence envy first did let her loose.</p></div><div class="stanza"><p>Therefore I think and judge it for thy best</p><p class="slindent">Thou follow me, and I will be thy guide,</p><p class="slindent">And lead thee hence through the eternal place,</p></div><div class="stanza"><p>Where thou shalt hear the desperate lamentations,</p><p class="slindent">Shalt see the ancient spirits disconsolate,</p><p class="slindent">Who cry out each one for the second death;</p></div><div class="stanza"><p>And thou shalt see those who contented are</p><p class="slindent">Within the fire, because they hope to come,</p><p class="slindent">Whene&rsquo;er it may be, to the blessed people;</p></div><div class="stanza"><p>To whom, then, if thou wishest to ascend,</p><p class="slindent">A soul shall be for that than I more worthy;</p><p class="slindent">With her at my departure I will leave thee;</p></div><div class="stanza"><p>Because that Emperor, who reigns above,</p><p class="slindent">In that I was rebellious to his law,</p><p class="slindent">Wills that through me none come into his city.</p></div><div class="stanza"><p>He governs everywhere, and there he reigns;</p><p class="slindent">There is his city and his lofty throne;</p><p class="slindent">O happy he whom thereto he elects!&rdquo;</p></div><div class="stanza"><p>And I to him: &ldquo;Poet, I thee entreat,</p><p class="slindent">By that same God whom thou didst never know,</p><p class="slindent">So that I may escape this woe and worse,</p></div><div class="stanza"><p>Thou wouldst conduct me there where thou hast said,</p><p class="slindent">That I may see the portal of Saint Peter,</p><p class="slindent">And those thou makest so disconsolate.&rdquo;</p></div><div class="stanza"><p>Then he moved on, and I behind him followed.</p></div>',

	'<p class="cantohead">Inferno: Canto II</p><div class="stanza"><p>Day was departing, and the embrowned air</p><p class="slindent">Released the animals that are on earth</p><p class="slindent">From their fatigues; and I the only one</p></div><div class="stanza"><p>Made myself ready to sustain the war,</p><p class="slindent">Both of the way and likewise of the woe,</p><p class="slindent">Which memory that errs not shall retrace.</p></div><div class="stanza"><p>O Muses, O high genius, now assist me!</p><p class="slindent">O memory, that didst write down what I saw,</p><p class="slindent">Here thy nobility shall be manifest!</p></div><div class="stanza"><p>And I began: &ldquo;Poet, who guidest me,</p><p class="slindent">Regard my manhood, if it be sufficient,</p><p class="slindent">Ere to the arduous pass thou dost confide me.</p></div><div class="stanza"><p>Thou sayest, that of Silvius the parent,</p><p class="slindent">While yet corruptible, unto the world</p><p class="slindent">Immortal went, and was there bodily.</p></div><div class="stanza"><p>But if the adversary of all evil</p><p class="slindent">Was courteous, thinking of the high effect</p><p class="slindent">That issue would from him, and who, and what,</p></div><div class="stanza"><p>To men of intellect unmeet it seems not;</p><p class="slindent">For he was of great Rome, and of her empire</p><p class="slindent">In the empyreal heaven as father chosen;</p></div><div class="stanza"><p>The which and what, wishing to speak the truth,</p><p class="slindent">Were stablished as the holy place, wherein</p><p class="slindent">Sits the successor of the greatest Peter.</p></div><div class="stanza"><p>Upon this journey, whence thou givest him vaunt,</p><p class="slindent">Things did he hear, which the occasion were</p><p class="slindent">Both of his victory and the papal mantle.</p></div><div class="stanza"><p>Thither went afterwards the Chosen Vessel,</p><p class="slindent">To bring back comfort thence unto that Faith,</p><p class="slindent">Which of salvation&rsquo;s way is the beginning.</p></div><div class="stanza"><p>But I, why thither come, or who concedes it?</p><p class="slindent">I not Aeneas am, I am not Paul,</p><p class="slindent">Nor I, nor others, think me worthy of it.</p></div><div class="stanza"><p>Therefore, if I resign myself to come,</p><p class="slindent">I fear the coming may be ill-advised;</p><p class="slindent">Thou&rsquo;rt wise, and knowest better than I speak.&rdquo;</p></div><div class="stanza"><p>And as he is, who unwills what he willed,</p><p class="slindent">And by new thoughts doth his intention change,</p><p class="slindent">So that from his design he quite withdraws,</p></div><div class="stanza"><p>Such I became, upon that dark hillside,</p><p class="slindent">Because, in thinking, I consumed the emprise,</p><p class="slindent">Which was so very prompt in the beginning.</p></div><div class="stanza"><p>&ldquo;If I have well thy language understood,&rdquo;</p><p class="slindent">Replied that shade of the Magnanimous,</p><p class="slindent">&ldquo;Thy soul attainted is with cowardice,</p></div><div class="stanza"><p>Which many times a man encumbers so,</p><p class="slindent">It turns him back from honoured enterprise,</p><p class="slindent">As false sight doth a beast, when he is shy.</p></div><div class="stanza"><p>That thou mayst free thee from this apprehension,</p><p class="slindent">I&rsquo;ll tell thee why I came, and what I heard</p><p class="slindent">At the first moment when I grieved for thee.</p></div><div class="stanza"><p>Among those was I who are in suspense,</p><p class="slindent">And a fair, saintly Lady called to me</p><p class="slindent">In such wise, I besought her to command me.</p></div><div class="stanza"><p>Her eyes where shining brighter than the Star;</p><p class="slindent">And she began to say, gentle and low,</p><p class="slindent">With voice angelical, in her own language:</p></div><div class="stanza"><p>&lsquo;O spirit courteous of Mantua,</p><p class="slindent">Of whom the fame still in the world endures,</p><p class="slindent">And shall endure, long-lasting as the world;</p></div><div class="stanza"><p>A friend of mine, and not the friend of fortune,</p><p class="slindent">Upon the desert slope is so impeded</p><p class="slindent">Upon his way, that he has turned through terror,</p></div><div class="stanza"><p>And may, I fear, already be so lost,</p><p class="slindent">That I too late have risen to his succour,</p><p class="slindent">From that which I have heard of him in Heaven.</p></div><div class="stanza"><p>Bestir thee now, and with thy speech ornate,</p><p class="slindent">And with what needful is for his release,</p><p class="slindent">Assist him so, that I may be consoled.</p></div><div class="stanza"><p>Beatrice am I, who do bid thee go;</p><p class="slindent">I come from there, where I would fain return;</p><p class="slindent">Love moved me, which compelleth me to speak.</p></div><div class="stanza"><p>When I shall be in presence of my Lord,</p><p class="slindent">Full often will I praise thee unto him.&rsquo;</p><p class="slindent">Then paused she, and thereafter I began:</p></div><div class="stanza"><p>&lsquo;O Lady of virtue, thou alone through whom</p><p class="slindent">The human race exceedeth all contained</p><p class="slindent">Within the heaven that has the lesser circles,</p></div><div class="stanza"><p>So grateful unto me is thy commandment,</p><p class="slindent">To obey, if &lsquo;twere already done, were late;</p><p class="slindent">No farther need&lsquo;st thou ope to me thy wish.</p></div><div class="stanza"><p>But the cause tell me why thou dost not shun</p><p class="slindent">The here descending down into this centre,</p><p class="slindent">From the vast place thou burnest to return to.&rsquo;</p></div><div class="stanza"><p>&lsquo;Since thou wouldst fain so inwardly discern,</p><p class="slindent">Briefly will I relate,&rsquo; she answered me,</p><p class="slindent">&lsquo;Why I am not afraid to enter here.</p></div><div class="stanza"><p>Of those things only should one be afraid</p><p class="slindent">Which have the power of doing others harm;</p><p class="slindent">Of the rest, no; because they are not fearful.</p></div><div class="stanza"><p>God in his mercy such created me</p><p class="slindent">That misery of yours attains me not,</p><p class="slindent">Nor any flame assails me of this burning.</p></div><div class="stanza"><p>A gentle Lady is in Heaven, who grieves</p><p class="slindent">At this impediment, to which I send thee,</p><p class="slindent">So that stern judgment there above is broken.</p></div><div class="stanza"><p>In her entreaty she besought Lucia,</p><p class="slindent">And said, &ldquo;Thy faithful one now stands in need</p><p class="slindent">Of thee, and unto thee I recommend him.&rdquo;</p></div><div class="stanza"><p>Lucia, foe of all that cruel is,</p><p class="slindent">Hastened away, and came unto the place</p><p class="slindent">Where I was sitting with the ancient Rachel.</p></div><div class="stanza"><p>&ldquo;Beatrice&rdquo; said she, &ldquo;the true praise of God,</p><p class="slindent">Why succourest thou not him, who loved thee so,</p><p class="slindent">For thee he issued from the vulgar herd?</p></div><div class="stanza"><p>Dost thou not hear the pity of his plaint?</p><p class="slindent">Dost thou not see the death that combats him</p><p class="slindent">Beside that flood, where ocean has no vaunt?&rdquo;</p></div><div class="stanza"><p>Never were persons in the world so swift</p><p class="slindent">To work their weal and to escape their woe,</p><p class="slindent">As I, after such words as these were uttered,</p></div><div class="stanza"><p>Came hither downward from my blessed seat,</p><p class="slindent">Confiding in thy dignified discourse,</p><p class="slindent">Which honours thee, and those who&rsquo;ve listened to it.&rsquo;</p></div><div class="stanza"><p>After she thus had spoken unto me,</p><p class="slindent">Weeping, her shining eyes she turned away;</p><p class="slindent">Whereby she made me swifter in my coming;</p></div><div class="stanza"><p>And unto thee I came, as she desired;</p><p class="slindent">I have delivered thee from that wild beast,</p><p class="slindent">Which barred the beautiful mountain&rsquo;s short ascent.</p></div><div class="stanza"><p>What is it, then?  Why, why dost thou delay?</p><p class="slindent">Why is such baseness bedded in thy heart?</p><p class="slindent">Daring and hardihood why hast thou not,</p></div><div class="stanza"><p>Seeing that three such Ladies benedight</p><p class="slindent">Are caring for thee in the court of Heaven,</p><p class="slindent">And so much good my speech doth promise thee?&rdquo;</p></div><div class="stanza"><p>Even as the flowerets, by nocturnal chill,</p><p class="slindent">Bowed down and closed, when the sun whitens them,</p><p class="slindent">Uplift themselves all open on their stems;</p></div><div class="stanza"><p>Such I became with my exhausted strength,</p><p class="slindent">And such good courage to my heart there coursed,</p><p class="slindent">That I began, like an intrepid person:</p></div><div class="stanza"><p>&ldquo;O she compassionate, who succoured me,</p><p class="slindent">And courteous thou, who hast obeyed so soon</p><p class="slindent">The words of truth which she addressed to thee!</p></div><div class="stanza"><p>Thou hast my heart so with desire disposed</p><p class="slindent">To the adventure, with these words of thine,</p><p class="slindent">That to my first intent I have returned.</p></div><div class="stanza"><p>Now go, for one sole will is in us both,</p><p class="slindent">Thou Leader, and thou Lord, and Master thou.&rdquo;</p><p class="slindent">Thus said I to him; and when he had moved,</p></div><div class="stanza"><p>I entered on the deep and savage way.</p></div>',

	'<p class="cantohead">Inferno: Canto III</p><div class="stanza"><p>&ldquo;Through me the way is to the city dolent;</p><p class="slindent">Through me the way is to eternal dole;</p><p class="slindent">Through me the way among the people lost.</p></div><div class="stanza"><p>Justice incited my sublime Creator;</p><p class="slindent">Created me divine Omnipotence,</p><p class="slindent">The highest Wisdom and the primal Love.</p></div><div class="stanza"><p>Before me there were no created things,</p><p class="slindent">Only eterne, and I eternal last.</p><p class="slindent">All hope abandon, ye who enter in!&rdquo;</p></div><div class="stanza"><p>These words in sombre colour I beheld</p><p class="slindent">Written upon the summit of a gate;</p><p class="slindent">Whence I: &ldquo;Their sense is, Master, hard to me!&rdquo;</p></div><div class="stanza"><p>And he to me, as one experienced:</p><p class="slindent">&ldquo;Here all suspicion needs must be abandoned,</p><p class="slindent">All cowardice must needs be here extinct.</p></div><div class="stanza"><p>We to the place have come, where I have told thee</p><p class="slindent">Thou shalt behold the people dolorous</p><p class="slindent">Who have foregone the good of intellect.&rdquo;</p></div><div class="stanza"><p>And after he had laid his hand on mine</p><p class="slindent">With joyful mien, whence I was comforted,</p><p class="slindent">He led me in among the secret things.</p></div><div class="stanza"><p>There sighs, complaints, and ululations loud</p><p class="slindent">Resounded through the air without a star,</p><p class="slindent">Whence I, at the beginning, wept thereat.</p></div><div class="stanza"><p>Languages diverse, horrible dialects,</p><p class="slindent">Accents of anger, words of agony,</p><p class="slindent">And voices high and hoarse, with sound of hands,</p></div><div class="stanza"><p>Made up a tumult that goes whirling on</p><p class="slindent">For ever in that air for ever black,</p><p class="slindent">Even as the sand doth, when the whirlwind breathes.</p></div><div class="stanza"><p>And I, who had my head with horror bound,</p><p class="slindent">Said: &ldquo;Master, what is this which now I hear?</p><p class="slindent">What folk is this, which seems by pain so vanquished?&rdquo;</p></div><div class="stanza"><p>And he to me: &ldquo;This miserable mode</p><p class="slindent">Maintain the melancholy souls of those</p><p class="slindent">Who lived withouten infamy or praise.</p></div><div class="stanza"><p>Commingled are they with that caitiff choir</p><p class="slindent">Of Angels, who have not rebellious been,</p><p class="slindent">Nor faithful were to God, but were for self.</p></div><div class="stanza"><p>The heavens expelled them, not to be less fair;</p><p class="slindent">Nor them the nethermore abyss receives,</p><p class="slindent">For glory none the damned would have from them.&rdquo;</p></div><div class="stanza"><p>And I: &ldquo;O Master, what so grievous is</p><p class="slindent">To these, that maketh them lament so sore?&rdquo;</p><p class="slindent">He answered: &ldquo;I will tell thee very briefly.</p></div><div class="stanza"><p>These have no longer any hope of death;</p><p class="slindent">And this blind life of theirs is so debased,</p><p class="slindent">They envious are of every other fate.</p></div><div class="stanza"><p>No fame of them the world permits to be;</p><p class="slindent">Misericord and Justice both disdain them.</p><p class="slindent">Let us not speak of them, but look, and pass.&rdquo;</p></div><div class="stanza"><p>And I, who looked again, beheld a banner,</p><p class="slindent">Which, whirling round, ran on so rapidly,</p><p class="slindent">That of all pause it seemed to me indignant;</p></div><div class="stanza"><p>And after it there came so long a train</p><p class="slindent">Of people, that I ne&rsquo;er would have believed</p><p class="slindent">That ever Death so many had undone.</p></div><div class="stanza"><p>When some among them I had recognised,</p><p class="slindent">I looked, and I beheld the shade of him</p><p class="slindent">Who made through cowardice the great refusal.</p></div><div class="stanza"><p>Forthwith I comprehended, and was certain,</p><p class="slindent">That this the sect was of the caitiff wretches</p><p class="slindent">Hateful to God and to his enemies.</p></div><div class="stanza"><p>These miscreants, who never were alive,</p><p class="slindent">Were naked, and were stung exceedingly</p><p class="slindent">By gadflies and by hornets that were there.</p></div><div class="stanza"><p>These did their faces irrigate with blood,</p><p class="slindent">Which, with their tears commingled, at their feet</p><p class="slindent">By the disgusting worms was gathered up.</p></div><div class="stanza"><p>And when to gazing farther I betook me.</p><p class="slindent">People I saw on a great river&rsquo;s bank;</p><p class="slindent">Whence said I: &ldquo;Master, now vouchsafe to me,</p></div><div class="stanza"><p>That I may know who these are, and what law</p><p class="slindent">Makes them appear so ready to pass over,</p><p class="slindent">As I discern athwart the dusky light.&rdquo;</p></div><div class="stanza"><p>And he to me: &ldquo;These things shall all be known</p><p class="slindent">To thee, as soon as we our footsteps stay</p><p class="slindent">Upon the dismal shore of Acheron.&rdquo;</p></div><div class="stanza"><p>Then with mine eyes ashamed and downward cast,</p><p class="slindent">Fearing my words might irksome be to him,</p><p class="slindent">From speech refrained I till we reached the river.</p></div><div class="stanza"><p>And lo! towards us coming in a boat</p><p class="slindent">An old man, hoary with the hair of eld,</p><p class="slindent">Crying: &ldquo;Woe unto you, ye souls depraved!</p></div><div class="stanza"><p>Hope nevermore to look upon the heavens;</p><p class="slindent">I come to lead you to the other shore,</p><p class="slindent">To the eternal shades in heat and frost.</p></div><div class="stanza"><p>And thou, that yonder standest, living soul,</p><p class="slindent">Withdraw thee from these people, who are dead!&rdquo;</p><p class="slindent">But when he saw that I did not withdraw,</p></div><div class="stanza"><p>He said: &ldquo;By other ways, by other ports</p><p class="slindent">Thou to the shore shalt come, not here, for passage;</p><p class="slindent">A lighter vessel needs must carry thee.&rdquo;</p></div><div class="stanza"><p>And unto him the Guide: &ldquo;Vex thee not, Charon;</p><p class="slindent">It is so willed there where is power to do</p><p class="slindent">That which is willed; and farther question not.&rdquo;</p></div><div class="stanza"><p>Thereat were quieted the fleecy cheeks</p><p class="slindent">Of him the ferryman of the livid fen,</p><p class="slindent">Who round about his eyes had wheels of flame.</p></div><div class="stanza"><p>But all those souls who weary were and naked</p><p class="slindent">Their colour changed and gnashed their teeth together,</p><p class="slindent">As soon as they had heard those cruel words.</p></div><div class="stanza"><p>God they blasphemed and their progenitors,</p><p class="slindent">The human race, the place, the time, the seed</p><p class="slindent">Of their engendering and of their birth!</p></div><div class="stanza"><p>Thereafter all together they drew back,</p><p class="slindent">Bitterly weeping, to the accursed shore,</p><p class="slindent">Which waiteth every man who fears not God.</p></div><div class="stanza"><p>Charon the demon, with the eyes of glede,</p><p class="slindent">Beckoning to them, collects them all together,</p><p class="slindent">Beats with his oar whoever lags behind.</p></div><div class="stanza"><p>As in the autumn-time the leaves fall off,</p><p class="slindent">First one and then another, till the branch</p><p class="slindent">Unto the earth surrenders all its spoils;</p></div><div class="stanza"><p>In similar wise the evil seed of Adam</p><p class="slindent">Throw themselves from that margin one by one,</p><p class="slindent">At signals, as a bird unto its lure.</p></div><div class="stanza"><p>So they depart across the dusky wave,</p><p class="slindent">And ere upon the other side they land,</p><p class="slindent">Again on this side a new troop assembles.</p></div><div class="stanza"><p>&ldquo;My son,&rdquo; the courteous Master said to me,</p><p class="slindent">&ldquo;All those who perish in the wrath of God</p><p class="slindent">Here meet together out of every land;</p></div><div class="stanza"><p>And ready are they to pass o&rsquo;er the river,</p><p class="slindent">Because celestial Justice spurs them on,</p><p class="slindent">So that their fear is turned into desire.</p></div><div class="stanza"><p>This way there never passes a good soul;</p><p class="slindent">And hence if Charon doth complain of thee,</p><p class="slindent">Well mayst thou know now what his speech imports.&rdquo;</p></div><div class="stanza"><p>This being finished, all the dusk champaign</p><p class="slindent">Trembled so violently, that of that terror</p><p class="slindent">The recollection bathes me still with sweat.</p></div><div class="stanza"><p>The land of tears gave forth a blast of wind,</p><p class="slindent">And fulminated a vermilion light,</p><p class="slindent">Which overmastered in me every sense,</p></div><div class="stanza"><p>And as a man whom sleep hath seized I fell.</p></div>'];

module.exports = longfellow;

},{}],8:[function(require,module,exports){
// norton.js

var norton = ['<p class="title">Hell</p><p class="author">Charles Eliot Norton</p>',

	'<p class="cantohead">CANTO I</p><p class="summary">Dante, astray in a wood, reaches the foot of a hill which he begins to ascend; he is hindered by three beasts; he turns back and is met by Virgil, who proposes to guide him into the eternal world.</p><p>Midway upon the road of our life I found myself within a dark wood, for the right way had been missed. Ah! how hard a thing it is to tell what this wild and rough and dense wood was, which in thought renews the fear! So bitter is it that death is little more. But in order to treat of the good that there I found, I will tell of the other things that I have seen there. I cannot well recount how I entered it, so full was I of slumber at that point where I abandoned the true way. But after I had arrived at the foot of a hill, where that valley ended which had pierced my heart with fear, I looked on high, and saw its shoulders clothed already with the rays of the planet<span class="note"><span class="noteno">1</span><span class="notetext">The sun, a planet according to the Ptolemaic system.</span></span> that leadeth men aright along every path. Then was the fear a little quieted which in the lake of my heart had lasted through the night that I passed so piteously. And even as one who with spent breath, issued out of the sea upon the shore, turns to the perilous water and gazes, so did my soul, which still was flying, turn back to look again upon the pass which never had a living person left.</p><p>After I had rested a little my weary body I took my way again along the desert slope, so that the firm foot was always the lower. And ho! almost at the beginning of the steep a she-leopard, light and very nimble, which was covered with a spotted coat. And she did not move from before my face, nay, rather hindered so my road that to return I oftentimes had turned.</p><p>The time was at the beginning of the morning, and the Sun was mounting upward with those stars that were with him when Love Divine first set in motion those beautiful things;<span class="note"><span class="noteno">1</span><span class="notetext">According to old tradition the spring was the season of the creation.</span></span> so that the hour of the time and the sweet season were occasion of good hope to me concerning that wild beast with the dappled skin. But not so that the sight which appeared to me of a lion did not give me fear. He seemed to be coming against me, with head high and with ravening hunger, so that it seemed that the air was affrighted at him. And a she-wolf,<span class="note"><span class="noteno">2</span><span class="notetext">These three beasts correspond to the triple division of sins into those of incontinence, of violence, and of fraud. See Canto XI.</span></span> who with all cravings seemed laden in her meagreness, and already had made many folk to live forlorn,&mdash;she caused me so much heaviness, with the fear that came from sight of her, that I lost hope of the height. And such as he is who gaineth willingly, and the time arrives that makes him lose, who in all his thoughts weeps and is sad,&mdash;such made me the beast without repose that, coming on against me, little by little was pushing me back thither where the Sun is silent.</p><p>While I was falling back to the low place, before mine eyes appeared one who through long silence seemed hoarse. When I saw him in the great desert, &ldquo;Have pity on me!&rdquo; I cried to him, &ldquo;whatso thou art, or shade or real man.&rdquo; He answered me: &ldquo;Not man; man once I was, and my parents were Lombards, and Mantuans by country both. I was born sub Julio, though late, and I lived at Rome under the good Augustus, in the time of the false and lying gods. Poet was I, and sang of that just son of Anchises who came from Troy after proud Ilion had been burned. But thou, why returnest thou to so great annoy? Why dost thou not ascend the delectable mountain which is the source and cause of every joy?&rdquo;</p><p>&ldquo;Art thou then that Virgil and that fount which poureth forth so large a stream of speech?&rdquo; replied I to him with bashful front: &ldquo;O honor and light of the other poem I may the long seal avail me, and the great love, which have made me search thy volume! Thou art my master and my author; thou alone art he from whom I took the fair style that hath done me honor. Behold the beast because of which I turned; help me against her, famous sage, for she makes any veins and pulses tremble.&rdquo; &ldquo;Thee it behoves to hold another course,&rdquo; he replied, when he saw me weeping, &ldquo;if thou wishest to escape from this savage place; for this beast, because of which thou criest out, lets not any one pass along her way, but so hinders him that she kills him! and she has a nature so malign and evil that she never sates her greedy will, and after food is hungrier than before. Many are the animals with which she wives, and there shall be more yet, till the hound<span class="note"><span class="noteno">1</span><span class="notetext">Of whom the hound is the symbol, and to whom Dante looked for the deliverance of Italy from the discorda and misrule that made her wretched, is still matter of doubt, after centuries of controversy.</span></span> shall come that will make her die of grief. He shall not feed on land or goods, but wisdom and love and valor, and his birthplace shall be between Feltro and Feltro. Of that humble<span class="note"><span class="noteno">2</span><span class="notetext">Fallen, humiliated.</span></span> Italy shall he be the salvation, for which the virgin Camilla died, and Euryalus, Turnus and Nisus of their wounds. He shall hunt her through every town till he shall have set her back in hell, there whence envy first sent her forth. Wherefore I think and deem it for thy best that thou follow me, and I will be thy guide, and will lead thee hence through the eternal place where thou shalt hear the despairing shrieks, shalt see the ancient spirits woeful who each proclaim the second death. And then thou shalt see those who are contented in the fire, because they hope to come, whenever it may be, to the blessed folk; to whom if thou wilt thereafter ascend, them shall be a soul more worthy than I for that. With her I will leave thee at my departure; for that Emperor who reigneth them above, because I was rebellious to His law, wills not that into His city any one should come through me. In all parts He governs and them He reigns: there in His city and His lofty seat. O happy he whom thereto He elects!&rdquo; And I to him, &ldquo;Poet, I beseech thee by that God whom thou didst not know, in order that I may escape this ill and worse, that thou lead me thither whom thou now hest said, so that I may see the gate of St. Peter, and those whom thou makest so afflicted.&rdquo;</p><p>Then he moved on, and I behind him kept.</p>',

	'<p class="cantohead">CANTO II</p><p class="summary">Dante, doubtful of his own powers, is discouraged at the outset.&mdash;Virgil cheers him by telling him that he has been sent to his aid by a blessed Spirit from Heaven.&mdash;Dante casts off fear, and the poets proceed.</p><p>The day was going, and the dusky air was taking the living things that are on earth from their fatigues, and I alone was preparing to sustain the war alike of the road, and of the woe which the mind that erreth not shall retrace. O Muses, O lofty genius, now assist me! O mind that didst inscribe that which I saw, here shall thy nobility appear! I began:&mdash;&ldquo;Poet, that guidest me, consider my virtue, if it is sufficient, ere to the deep pass thou trustest me. Thou sayest that the parent of Silvius while still corruptible went to the immortal world and was there in the body. Wherefore if the Adversary of every ill was then courteous, thinking on the high effect that should proceed from him, and on the Who and the What,<span class="note"><span class="noteno">1</span><span class="notetext">Who he was, and what should result.</span></span> it seemeth not unmeet to the man of understanding; for in the empyreal heaven he had been chosen for father of revered Rome and of her empire; both which (to say truth indeed) were ordained for the holy place where the successor of the greater Peter hath his seat. Through this going, whereof thou givest him vaunt, he learned things which were the cause of his victory and of the papal mantle. Afterward the Chosen Vessel went thither to bring thence comfort to that faith which is the beginning of the way of salvation. But I, why go I thither? or who concedes it? I am not Aeneas, I am not Paul; me worthy of this, neither I nor others think; wherefore if I give myself up to go, I fear lest the going may be mad. Thou art wise, thou understandest better than I speak.&rdquo;</p><p>And as is he who unwills what he willed, and because of new thoughts changes his design, so that he quite withdraws from beginning, such I became on that dark hillside: wherefore in my thought I abandoned the enterprise which had been so hasty in the beginning.</p><p>&ldquo;If I have rightly understood thy speech,&rdquo; replied that shade of the magnanimous one, &ldquo;thy soul is hurt by cowardice, which oftentimes encumbereth a man so that it turns him back from honorable enterprise, as false seeing does a beast when it is startled. In order that thou loose thee from this fear I will tell thee wherefore I have come, and what I heard at the first moment that I grieved for thee. I was among those who are suspended,<span class="note"><span class="noteno">1</span><span class="notetext">In Limbo, neither in Hell nor Heaven.</span></span> and a Lady called me, so blessed and beautiful that I besought her to command. Her eyes were more lucent than the star, and she began to speak to me sweet and low, with angelic voice, in her own tongue: &lsquo;O courteous Mantuan soul, of whom the fame yet lasteth in the world, and shall last so long as the world endureth! a friend of mine and not of fortune upon the desert hillside is so hindered on his road that he has turned for fear, and I am afraid, through that which I have heard of him in heaven, lest already he be so astray that I may have risen late to his succor. Now do thou move, and with thy speech ornate, and with whatever is needful for his deliverance, assist him so that I may be consoled for him. I am Beatrice who make thee go. I come from a place whither I desire to return. Love moved me, and makes me speak. When I shall be before my Lord, I will commend thee often unto Him.&rsquo; Then she was silent, and thereon I began: &lsquo;O Lady of Virtue, thou alone through whom the human race surpasseth all contained within that heaven which hath the smallest circles!<span class="note"><span class="noteno">2</span><span class="notetext">The heaven of the moon, nearest to the earth.</span></span> so pleasing unto me is thy command that to obey it, were it already done, were slow to me. Thou hast no need further to open unto me thy will; but tell me the cause why thou guardest not thyself from descending down here into this centre, from the ample place whither thou burnest to return.&lsquo; &rsquo;Since thou wishest to know so inwardly, I will tell thee briefly,&rsquo; she replied to me, &lsquo;wherefore I fear not to come here within. One ought to fear those things only that have power of doing harm, the others not, for they are not dreadful. I am made by God, thanks be to Him, such that your misery toucheth me not, nor doth the flame of this burning assail me. A gentle Lady<span class="note"><span class="noteno">3</span><span class="notetext">The Virgin.</span></span> is in heaven who hath pity for this hindrance whereto I send thee, so that stern judgment there above she breaketh. She summoned Lucia in her request, and said, &ldquo;Thy faithful one now hath need of thee, and unto thee I commend him.&rdquo; Lucia, the foe of every cruel one, rose and came to the place where I was, seated with the ancient Rachel. She said, &ldquo;Beatrice, true praise of God, why dost thou not succor him who so loved thee that for thee he came forth from the vulgar throng? Dost thou not hear the pity of his plaint? Dost thou not see the death that combats him beside the stream whereof the sea hath no vaunt?&rdquo; In the world never were persons swift to seek their good, and to fly their harm, as I, after these words were uttered, came here below, from my blessed seat, putting my trust in thy upright speech, which honors thee and them who have heard it.&rsquo; After she had said this to me, weeping she turned her lucent eyes, whereby she made me more speedy in coming. And I came to thee as she willed. Thee have I delivered from that wild beast that took from thee the short ascent of the beautiful mountain. What is it then? Why, why dost thou hold back? why dost thou harbor such cowardice in thy heart? why hast thou not daring and boldness, since three blessed Ladies care for thee in the court of Heaven, and my speech pledges thee such good?&rdquo;</p><p>As flowerets, bent and closed by the chill of night, after the sun shines on them straighten themselves all open on their stem, so I became with my weak virtue, and such good daring hastened to my heart that I began like one enfranchised: &ldquo;Oh compassionate she who succored me! and thou courteous who didst speedily obey the true words that she addressed to thee! Thou by thy words hast so disposed my heart with desire of going, that I have returned unto my first intent. Go on now, for one sole will is in us both: Thou Leader, thou Lord, and thou Master.&rdquo; Thus I said to him; and when he had moved on, I entered along the deep and savage road.</p>',

	'<p class="cantohead">CANTO III</p><p class="summary">The gate of Hell.&mdash;Virgil lends Dante in.&mdash;The punishment of the neither good nor bad.&mdash;Acheron, and the sinners on its bank.&mdash;Charon.&mdash;Earthquake.&mdash;Dante swoons.</p><p>&ldquo;Through me is the way into the woeful city; through me is the way into eternal woe; through me is the way among the lost people. Justice moved my lofty maker: the divine Power, the supreme Wisdom and the primal Love made me. Before me were no things created, unless eternal, and I eternal last. Leave every hope, ye who enter!&rdquo;</p><p>These words of color obscure I saw written at the top of a gate; whereat I, &ldquo;Master, their meaning is dire to me.&rdquo;</p><p>And he to me, like one who knew, &ldquo;Here it behoves to leave every fear; it behoves that all cowardice should here be dead. We have come to the place where I have told thee that thou shalt see the woeful people, who have lost the good of the understanding.&rdquo;</p><p>And when he had put his hand on mine, with a glad countenance, wherefrom I took courage, he brought me within the secret things. Here sighs, laments, and deep wailings were resounding though the starless air; wherefore at first I wept thereat. Strange tongues, horrible cries, words of woe, accents of anger, voices high and hoarse, and sounds of hands with them, were making a tumult which whirls forever in that air dark without change, like the sand when the whirlwind breathes.</p><p>And I, who had my head girt with horror, said, &ldquo;Master, what is it that I hear? and what folk are they who seem in woe so vanquished?&rdquo;</p><p>And he to me, &ldquo;This miserable measure the wretched souls maintain of those who lived without infamy and without praise. Mingled are they with that caitiff choir of the angels, who were not rebels, nor were faithful to God, but were for themselves. The heavens chased them out in order to be not less beautiful, nor doth the depth of Hell receive them, because the damned would have some glory from them.&rdquo;</p><p>And I, &ldquo;Master, what is so grievous to them, that makes them lament so bitterly?&rdquo;</p><p>He answered, &ldquo;I will tell thee very briefly. These have no hope of death; and their blind life is so debased, that they are envious of every other lot. Fame of them the world permitteth not to be; mercy and justice disdain them. Let us not speak of them, but do thou look and pass on.&rdquo;</p><p>And I, who was gazing, saw a banner, that whirling ran so swiftly that it seemed to me to scorn all repose, and behind it came so long a train of folk, that I could never have believed death had undone so many. After I had distinguished some among them, I saw and knew the shade of him who made, through cowardice, the great refusal. <span class="note"><span class="noteno">1</span><span class="notetext">Who is intended by these words is uncertain.</span></span> At once I understood and was certain, that this was the sect of the caitiffs displeasing unto God, and unto his enemies. These wretches, who never were alive, were naked, and much stung by gad-flies and by wasps that were there. These streaked their faces with blood, which, mingled with tears, was harvested at their feet by loathsome worms.</p><p>And when I gave myself to looking onward, I saw people on the bank of a great river; wherefore I said, &ldquo;Master, now grant to me that I may know who these are, and what rule makes them appear so ready to pass over, as I discern through the faint light.&rdquo; And he to me, &ldquo;The things will be clear to thee, when we shall set our steps on the sad marge of Acheron.&rdquo; Then with eyes bashful and cast down, fearing lest my speech had been irksome to him, far as to the river I refrained from speaking.</p><p>And lo! coming toward us in a boat, an old man, white with ancient hair, crying, &ldquo;Woe to you, wicked souls! hope not ever to see Heaven! I come to carry you to the other bank, into eternal darkness, to heat and frost. And thou who art there, living soul, depart from these that are dead.&rdquo; But when he saw that I did not depart, he said, &ldquo;By another way, by other ports thou shalt come to the shore, not here, for passage; it behoves that a lighter bark bear thee.&rdquo;<span class="note"><span class="noteno">1</span><span class="notetext">The boat that bears the souls to Purgatory. Charon recognizes that Dante is not among the damned.</span></span></p><p>And my Leader to him, &ldquo;Charon, vex not thyself, it is thus willed there where is power to do that which is willed; and farther ask not.&rdquo; Then the fleecy cheeks were quiet of the pilot of the livid marsh, who round about his eyes had wheels of flame.</p><p>But those souls, who were weary and naked, changed color, and gnashed their teeth soon as they heard his cruel words. They blasphemed God and their parents, the human race, the place, the time and the seed of their sowing and of their birth. Then, bitterly weeping, they drew back all of them together to the evil bank, that waits for every man who fears not God. Charon the demon, with eyes of glowing coal, beckoning them, collects them all; he beats with his oar whoever lingers.</p><p>As in autumn the leaves fall off one after the other, till the bough sees all its spoils upon the earth, in like wise the evil seed of Adam throw themselves from that shore one by one at signals, as the bird at his call. Thus they go over the dusky wave, and before they have landed on the farther side, already on this a new throng is gathered.</p><p>&ldquo;My son,&rdquo; said the courteous Master, &ldquo;those who die in the wrath of God, all meet together here from every land. And they are eager to pass over the stream, for the divine justice spurs them, so that fear is turned to desire. This way a good soul never passes; and therefore if Charon snarleth at thee, thou now mayest well know what his speech signifies.&rdquo; This ended, the dark plain trembled so mightily, that the memory of the terror even now bathes me with sweat. The tearful land gave forth a wind that flashed a vermilion light which vanquished every sense of mine, and I fell as a man whom slumber seizes.</p>'];

module.exports = norton;

},{}],9:[function(require,module,exports){
// wright.js

var wright = ['<p class="title">Inferno</p><p class="author">S. Fowler Wright</p>',

	'<p class="cantohead">Canto I</p><div class="stanza"><p>ONE night, when half my life behind me lay,</p><p>I wandered from the straight lost path afar.</p><p>Through the great dark was no releasing way;</p><p>Above that dark was no relieving star.</p><p>If yet that terrored night I think or say,</p><p>As death&rsquo;s cold hands its fears resuming are.</p></div><div class="stanza"><p>Gladly the dreads I felt, too dire to tell,</p><p>The hopeless, pathless, lightless hours forgot,</p><p>I turn my tale to that which next befell,</p><p>When the dawn opened, and the night was not.</p><p>The hollowed blackness of that waste, God wot,</p><p>Shrank, thinned, and ceased. A blinding splendour hot</p><p>Flushed the great height toward which my footsteps fell,</p><p>And though it kindled from the nether hell,</p><p>Or from the Star that all men leads, alike</p><p>It showed me where the great dawn-glories strike</p><p>The wide east, and the utmost peaks of snow.</p></div><div class="stanza"><p>How first I entered on that path astray,</p><p>Beset with sleep, I know not. This I know.</p><p>When gained my feet the upward, lighted way,</p><p>I backward gazed, as one the drowning sea,</p><p>The deep strong tides, has baffled, and panting lies,</p><p>On the shelved shore, and turns his eyes to see</p><p>The league-wide wastes that held him. So mine eyes</p><p>Surveyed that fear, the while my wearied frame</p><p>Rested, and ever my heart&rsquo;s tossed lake became</p><p>More quiet.</p><p>Then from that pass released, which yet</p><p>With living feet had no man left, I set</p><p>My forward steps aslant the steep, that so,</p><p>My right foot still the lower, I climbed.</p><p class="slindent8em">Below</p><p>No more I gazed. Around, a slope of sand</p><p>Was sterile of all growth on either hand,</p><p>Or moving life, a spotted pard except,</p><p>That yawning rose, and stretched, and purred and leapt</p><p>So closely round my feet, that scarce I kept</p><p>The course I would.</p><p class="slindent4em">That sleek and lovely thing,</p><p>The broadening light, the breath of morn and spring,</p><p>The sun, that with his stars in Aries lay,</p><p>As when Divine Love on Creation&rsquo;s day</p><p>First gave these fair things motion, all at one</p><p>Made lightsome hope; but lightsome hope was none</p><p>When down the slope there came with lifted head</p><p>And back-blown mane and caverned mouth and red,</p><p>A lion, roaring, all the air ashake</p><p>That heard his hunger. Upward flight to take</p><p>No heart was mine, for where the further way</p><p>Mine anxious eyes explored, a she-wolf lay,</p><p>That licked lean flanks, and waited. Such was she</p><p>In aspect ruthless that I quaked to see,</p><p>And where she lay among her bones had brought</p><p>So many to grief before, that all my thought</p><p>Aghast turned backward to the sunless night</p><p>I left. But while I plunged in headlong flight</p><p>To that most feared before, a shade, or man</p><p>(Either he seemed), obstructing where I ran,</p><p>Called to me with a voice that few should know,</p><p>Faint from forgetful silence, &ldquo;Where ye go,</p><p>Take heed. Why turn ye from the upward way?&rdquo;</p></div><div class="stanza"><p>I cried, &ldquo;Or come ye from warm earth, or they</p><p>The grave hath taken, in my mortal need</p><p>Have mercy thou!&rdquo;</p><p class="slindent4em">He answered, &ldquo;Shade am I,</p><p>That once was man; beneath the Lombard sky,</p><p>In the late years of Julius born, and bred</p><p>In Mantua, till my youthful steps were led</p><p>To Rome, where yet the false gods lied to man;</p><p>And when the great Augustan age began,</p><p>I wrote the tale of Ilium burnt, and how</p><p>Anchises&rsquo; son forth-pushed a venturous prow,</p><p>Seeking unknown seas. But in what mood art thou</p><p>To thus return to all the ills ye fled,</p><p>The while the mountain of thy hope ahead</p><p>Lifts into light, the source and cause of all</p><p>Delectable things that may to man befall?&rdquo;</p></div><div class="stanza"><p>I answered, &ldquo;Art thou then that Virgil, he</p><p>From whom all grace of measured speech in me</p><p>Derived? O glorious and far-guiding star!</p><p>Now may the love-led studious hours and long</p><p>In which I learnt how rich thy wonders are,</p><p>Master and Author mine of Light and Song,</p><p>Befriend me now, who knew thy voice, that few</p><p>Yet hearken. All the name my work hath won</p><p>Is thine of right, from whom I learned. To thee,</p><p>Abashed, I grant it. . . Why the mounting sun</p><p>No more I seek, ye scarce should ask, who see</p><p>The beast that turned me, nor faint hope have I</p><p>To force that passage if thine aid deny.&ldquo;</p><p>He answered, &ldquo;Would ye leave this wild and live,</p><p>Strange road is ours, for where the she-wolf lies</p><p>Shall no man pass, except the path he tries</p><p>Her craft entangle. No way fugitive</p><p>Avoids the seeking of her greeds, that give</p><p>Insatiate hunger, and such vice perverse</p><p>As makes her leaner while she feeds, and worse</p><p>Her craving. And the beasts with which she breed</p><p>The noisome numerous beasts her lusts require,</p><p>Bare all the desirable lands in which she feeds;</p><p>Nor shall lewd feasts and lewder matings tire</p><p>Until she woos, in evil hour for her,</p><p>The wolfhound that shall rend her. His desire</p><p>Is not for rapine, as the promptings stir</p><p>Of her base heart; but wisdoms, and devoirs</p><p>Of manhood, and love&rsquo;s rule, his thoughts prefer.</p><p>The Italian lowlands he shall reach and save,</p><p>For which Camilla of old, the virgin brave,</p><p>Turnus and Nisus died in strife. His chase</p><p>He shall not cease, nor any cowering-place</p><p>Her fear shall find her, till he drive her back,</p><p>From city to city exiled, from wrack to wrack</p><p>Slain out of life, to find the native hell</p><p>Whence envy loosed her.</p><p class="slindent6em">For thyself were well</p><p>To follow where I lead, and thou shalt see</p><p>The spirits in pain, and hear the hopeless woe,</p><p>The unending cries, of those whose only plea</p><p>Is judgment, that the second death to be</p><p>Fall quickly. Further shalt thou climb, and go</p><p>To those who burn, but in their pain content</p><p>With hope of pardon; still beyond, more high,</p><p>Holier than opens to such souls as I,</p><p>The Heavens uprear; but if thou wilt, is one</p><p>Worthier, and she shall guide thee there, where none</p><p>Who did the Lord of those fair realms deny</p><p>May enter. There in his city He dwells, and there</p><p>Rules and pervades in every part, and calls</p><p>His chosen ever within the sacred walls.</p><p>O happiest, they!&rdquo;</p><p class="slindent4em">I answered, &ldquo;By that God</p><p>Thou didst not know, I do thine aid entreat,</p><p>And guidance, that beyond the ills I meet</p><p>I safety find, within the Sacred Gate</p><p>That Peter guards, and those sad souls to see</p><p>Who look with longing for their end to be.&rdquo;</p></div><div class="stanza"><p>Then he moved forward, and behind I trod.</p></div>',

	'<div class="canto"><p class="cantohead">Canto II</p></p><p><div class="stanza">THE day was falling, and the darkening air</p><p>Released earth&rsquo;s creatures from their toils, while I,</p><p>I only, faced the bitter road and bare</p><p>My Master led. I only, must defy</p><p>The powers of pity, and the night to be.</p><p>So thought I, but the things I came to see,</p><p>Which memory holds, could never thought forecast.</p><p>O Muses high! O Genius, first and last!</p><p>Memories intense! Your utmost powers combine</p><p>To meet this need. For never theme as mine</p><p>Strained vainly, where your loftiest nobleness</p><p>Must fail to be sufficient.</p><p class="slindent10em">First I said,</p><p>Fearing, to him who through the darkness led,</p><p>&ldquo;O poet, ere the arduous path ye press</p><p>Too far, look in me, if the worth there be</p><p>To make this transit. &AElig;neas once, I know,</p><p>Went down in life, and crossed the infernal sea;</p><p>And if the Lord of All Things Lost Below</p><p>Allowed it, reason seems, to those who see</p><p>The enduring greatness of his destiny,</p><p>Who in the Empyrean Heaven elect was called</p><p>Sire of the Eternal City, that throned and walled</p><p>Made Empire of the world beyond, to be</p><p>The Holy Place at last, by God&rsquo;s decree,</p><p>Where the great Peter&rsquo;s follower rules. For he</p><p>Learned there the causes of his victory.</p></div><div class="stanza"><p>&ldquo;And later to the third great Heaven was caught</p><p>The last Apostle, and thence returning brought</p><p>The proofs of our salvation. But, for me,</p><p>I am not &AElig;neas, nay, nor Paul, to see</p><p>Unspeakable things that depths or heights can show,</p><p>And if this road for no sure end I go</p><p>What folly is mine? But any words are weak.</p><p>Thy wisdom further than the things I speak</p><p>Can search the event that would be.&rdquo;</p><p class="slindent10em">Here I stayed</p><p>My steps amid the darkness, and the Shade</p><p>That led me heard and turned, magnanimous,</p><p>And saw me drained of purpose halting thus,</p><p>And answered, &ldquo;If thy coward-born thoughts be clear,</p><p>And all thy once intent, infirmed of fear,</p><p>Broken, then art thou as scared beasts that shy</p><p>From shadows, surely that they know not why</p><p>Nor wherefore. . . Hearken, to confound thy fear,</p><p>The things which first I heard, and brought me here.</p><p>One came where, in the Outer Place, I dwell,</p><p>Suspense from hope of Heaven or fear of Hell,</p><p>Radiant in light that native round her clung,</p><p>And cast her eyes our hopeless Shades among</p><p>(Eyes with no earthly like but heaven&rsquo;s own blue),</p><p>And called me to her in such voice as few</p><p>In that grim place had heard, so low, so clear,</p><p>So toned and cadenced from the Utmost Sphere,</p><p>The Unattainable Heaven from which she came.</p><p>&lsquo;O Mantuan Spirit,&rsquo; she said, &lsquo;whose lasting fame</p><p>Continues on the earth ye left, and still</p><p>With Time shall stand, an earthly friend to me,</p><p>- My friend, not fortune&rsquo;s&nbsp;&ndash; climbs a path so ill</p><p>That all the night-bred fears he hastes to flee</p><p>Were kindly to the thing he nears. The tale</p><p>Moved through the peace of I leaven, and swift I sped</p><p>Downward, to aid my friend in love&rsquo;s avail,</p><p>With scanty time therefor, that half I dread</p><p>Too late I came. But thou shalt haste, and go</p><p>With golden wisdom of thy speech, that so</p><p>For me be consolation. Thou shalt say,</p><p>&ldquo;I come from Beatricë.&rdquo; Downward far,</p><p>From Heaven to I leaven I sank, from star to star,</p><p>To find thee, and to point his rescuing way.</p><p>Fain would I to my place of light return;</p><p>Love moved me from it, and gave me power to learn</p><p>Thy speech. When next before my Lord I stand</p><p>I very oft shall praise thee.&rsquo;</p><p class="slindent10em">Here she ceased,</p><p>And I gave answer to that dear command,</p><p>&lsquo;Lady, alone through whom the whole race of those</p><p>The smallest Heaven the moon&rsquo;s short orbits hold</p><p>Excels in its creation, not thy least,</p><p>Thy lightest wish in this dark realm were told</p><p>Vainly. But show me why the Heavens unclose</p><p>To loose thee from them, and thyself content</p><p>Couldst thus continue in such strange descent</p><p>From that most Spacious Place for which ye burn,</p><p>And while ye further left, would fain return.&rsquo;</p></div><div class="stanza"><p>&ldquo; &lsquo;That which thou wouldst,&rsquo; she said, &lsquo;I briefly tell.</p><p>There is no fear nor any hurt in Hell,</p><p>Except that it be powerful. God in me</p><p>Is gracious, that the piteous sights I see</p><p>I share not, nor myself can shrink to feel</p><p>The flame of all this burning. One there is</p><p>In height among the Holiest placed, and she</p><p>- Mercy her name&nbsp;&ndash; among God&rsquo;s mysteries</p><p>Dwells in the midst, and hath the power to see</p><p>His judgments, and to break them. This sharp</p><p>I tell thee, when she saw, she called, that so</p><p>Leaned Lucia toward her while she spake&nbsp;&ndash; and said,</p><p>&ldquo;One that is faithful to thy name is sped,</p><p>Except that now ye aid him.&rdquo; She thereat,</p><p>- Lucia, to all men&rsquo;s wrongs inimical -</p><p>Left her High Place, and crossed to where I sat</p><p>In speech with Rachel (of the first of all</p><p>God saved). &ldquo;O Beatrice, Praise of God,&rdquo;</p><p>- So said she to me&nbsp;&ndash; &ldquo;sitt&rsquo;st thou here so slow</p><p>To aid him, once on earth that loved thee so</p><p>That all he left to serve thee? Hear&rsquo;st thou not</p><p>The anguish of his plaint? and dost not see,</p><p>By that dark stream that never seeks a sea,</p><p>The death that threats him?&rdquo;</p><p class="slindent8em">None, as thus she said,</p><p>None ever was swift on earth his good to chase,</p><p>None ever on earth was swift to leave his dread,</p><p>As came I downward from that sacred place</p><p>To find thee and invoke thee, confident</p><p>Not vainly for his need the gold were spent</p><p>Of thy word-wisdom.&rsquo; Here she turned away,</p><p>Her bright eyes clouded with their tears, and I,</p><p>Who saw them, therefore made more haste to reach</p><p>The place she told, and found thee. Canst thou say</p><p>I failed thy rescue? Is the beast anigh</p><p>From which ye quailed? When such dear saints beseech</p><p>- Three from the Highest&nbsp;&ndash; that Heaven thy course allow</p><p>Why halt ye fearful? In such guards as thou</p><p>The faintest-hearted might be bold.&rdquo;</p><p class="slindent14em">As flowers,</p><p>Close-folded through the cold and lightless hours,</p><p>Their bended stems erect, and opening fair</p><p>Accept the white light and the warmer air</p><p>Of morning, so my fainting heart anew</p><p>Lifted, that heard his comfort. Swift I spake,</p><p>&ldquo;O courteous thou, and she compassionate!</p><p>Thy haste that saved me, and her warning true,</p><p>Beyond my worth exalt me. Thine I make</p><p>My will. In concord of one mind from now,</p><p>O Master and my Guide, where leadest thou</p><p>I follow.&rdquo;</p><p class="slindent2em">And we, with no more words&rsquo; delay,</p><p>Went forward on that hard and dreadful way.</p></div>',

	'<p class="cantohead">Canto III</p></p><p><div class="stanza">THE gateway to the city of Doom. Through me</p><p>The entrance to the Everlasting Pain.</p><p>The Gateway of the Lost. The Eternal Three</p><p>Justice impelled to build me. Here ye see</p><p>Wisdom Supreme at work, and Primal Power,</p><p>And Love Supernal in their dawnless day.</p><p>Ere from their thought creation rose in flower</p><p>Eternal first were all things fixed as they.</p><p>Of Increate Power infinite formed am I</p><p>That deathless as themselves I do not die.</p><p>Justice divine has weighed: the doom is clear.</p><p>All hope renounce, ye lost, who enter here.</p><p>This scroll in gloom above the gate I read,</p><p>And found it fearful. &ldquo;Master, hard,&rdquo; I said,</p><p>&ldquo;This saying to me." And he, as one that long</p><p>Was customed, answered, &ldquo;No distrust must wrong</p><p>Its Maker, nor thy cowarder mood resume</p><p>If here ye enter. This the place of doom</p><p>I told thee, where the lost in darkness dwell.</p><p>Here, by themselves divorced from light, they fell,</p><p>And are as ye shall see them.&rdquo; Here he lent</p><p>A hand to draw me through the gate, and bent</p><p>A glance upon my fear so confident</p><p>That I, too nearly to my former dread</p><p>Returned, through all my heart was comforted,</p><p>And downward to the secret things we went.</p></div><div class="stanza"><p>Downward to night, but not of moon and cloud,</p><p>Not night with all its stars, as night we know,</p><p>But burdened with an ocean-weight of woe</p><p>The darkness closed us.</p><p class="slindent6em">Sighs, and wailings loud,</p><p>Outcries perpetual of recruited pain,</p><p>Sounds of strange tongues, and angers that remain</p><p>Vengeless for ever, the thick and clamorous crowd</p><p>Of discords pressed, that needs I wept to hear,</p><p>First hearing. There, with reach of hands anear,</p><p>And voices passion-hoarse, or shrilled with fright,</p><p>The tumult of the everlasting night,</p><p>As sand that dances in continual wind,</p><p>Turns on itself for ever.</p><p class="slindent8em">And I, my head</p><p>Begirt with movements, and my ears bedinned</p><p>With outcries round me, to my leader said,</p><p>&ldquo;Master, what hear I? Who so overborne</p><p>With woes are these?&rdquo;</p><p class="slindent6em">He answered, &ldquo;These be they</p><p>That praiseless lived and blameless. Now the scorn</p><p>Of Height and Depth alike, abortions drear;</p><p>Cast with those abject angels whose delay</p><p>To join rebellion, or their Lord defend,</p><p>Waiting their proved advantage, flung them here. -</p><p>Chased forth from Heaven, lest else its beauties end</p><p>The pure perfection of their stainless claim,</p><p>Out-herded from the shining gate they came,</p><p>Where the deep hells refused them, lest the lost</p><p>Boast something baser than themselves.&rdquo;</p><p class="slindent14em">And I,</p><p>&ldquo;Master, what grievance hath their failure cost,</p><p>That through the lamentable dark they cry?&rdquo;</p></div><div class="stanza"><p>He answered, &ldquo;Briefly at a thing not worth</p><p>We glance, and pass forgetful. Hope in death</p><p>They have not. Memory of them on the earth</p><p>Where once they lived remains not. Nor the breath</p><p>Of Justice shall condemn, nor Mercy plead,</p><p>But all alike disdain them. That they know</p><p>Themselves so mean beneath aught else constrains</p><p>The envious outcries that too long ye heed.</p><p>Move past, but speak not.&rdquo;</p><p class="slindent8em">Then I looked, and lo,</p><p>Were souls in ceaseless and unnumbered trains</p><p>That past me whirled unending, vainly led</p><p>Nowhither, in useless and unpausing haste.</p><p>A fluttering ensign all their guide, they chased</p><p>Themselves for ever. I had not thought the dead,</p><p>The whole world&rsquo;s dead, so many as these. I saw</p><p>The shadow of him elect to Peter&rsquo;s seat</p><p>Who made the great refusal, and the law,</p><p>The unswerving law that left them this retreat</p><p>To seal the abortion of their lives, became</p><p>Illumined to me, and themselves I knew,</p><p>To God and all his foes the futile crew</p><p>How hateful in their everlasting shame.</p></div><div class="stanza"><p>I saw these victims of continued death</p><p>- For lived they never&nbsp;&ndash; were naked all, and loud</p><p>Around them closed a never-ceasing cloud</p><p>Of hornets and great wasps, that buzzed and clung,</p><p>- Weak pain for weaklings meet,&nbsp;&ndash; and where they stung,</p><p>Blood from their faces streamed, with sobbing breath,</p><p>And all the ground beneath with tears and blood</p><p>Was drenched, and crawling in that loathsome mud</p><p>There were great worms that drank it.</p><p class="slindent10em">Gladly thence</p><p>I gazed far forward. Dark and wide the flood</p><p>That flowed before us. On the nearer shore</p><p>Were people waiting. &ldquo;Master, show me whence</p><p>These came, and who they be, and passing hence</p><p>Where go they? Wherefore wait they there content,</p><p>- The faint light shows it,&nbsp;&ndash; for their transit o&rsquo;er</p><p>The unbridged abyss?&rdquo;</p><p class="slindent6em">He answered, &ldquo;When we stand</p><p>Together, waiting on the joyless strand,</p><p>In all it shall be told thee.&rdquo; If he meant</p><p>Reproof I know not, but with shame I bent</p><p>My downward eyes, and no more spake until</p><p>The bank we reached, and on the stream beheld</p><p>A bark ply toward us.</p><p class="slindent8em">Of exceeding eld,</p><p>And hoary showed the steersman, screaming shrill,</p><p>With horrid glee the while he neared us, &ldquo;Woe</p><p>To ye, depraved!&nbsp;&ndash; Is here no Heaven, but ill</p><p>The place where I shall herd ye. Ice and fire</p><p>And darkness are the wages of their hire</p><p>Who serve unceasing here&nbsp;&ndash; But thou that there</p><p>Dost wait though live, depart ye. Yea, forbear!</p><p>A different passage and a lighter fare</p><p>Is destined thine.&rdquo;</p><p class="slindent6em">But here my guide replied,</p><p>&ldquo;Nay, Charon, cease; or to thy grief ye chide.</p><p>It There is willed, where that is willed shall be,</p><p>That ye shall pass him to the further side,</p><p>Nor question more.&rdquo;</p><p class="slindent6em">The fleecy cheeks thereat,</p><p>Blown with fierce speech before, were drawn and flat,</p><p>And his flame-circled eyes subdued, to hear</p><p>That mandate given. But those of whom he spake</p><p>In bitter glee, with naked limbs ashake,</p><p>And chattering teeth received it. Seemed that then</p><p>They first were conscious where they came, and fear</p><p>Abject and frightful shook them; curses burst</p><p>In clamorous discords forth; the race of men,</p><p>Their parents, and their God, the place, the time,</p><p>Of their conceptions and their births, accursed</p><p>Alike they called, blaspheming Heaven. But yet</p><p>Slow steps toward the waiting bark they set,</p><p>With terrible wailing while they moved. And so</p><p>They came reluctant to the shore of woe</p><p>That waits for all who fear not God, and not</p><p>Them only.</p><p class="slindent4em">Then the demon Charon rose</p><p>To herd them in, with eyes that furnace-hot</p><p>Glowed at the task, and lifted oar to smite</p><p>Who lingered.</p><p class="slindent4em">As the leaves, when autumn shows,</p><p>One after one descending, leave the bough,</p><p>Or doves come downward to the call, so now</p><p>The evil seed of Adam to endless night,</p><p>As Charon signalled, from the shore&rsquo;s bleak height,</p><p>Cast themselves downward to the bark. The brown</p><p>And bitter flood received them, and while they passed</p><p>Were others gathering, patient as the last,</p><p>Not conscious of their nearing doom.</p><p class="slindent14em">&ldquo;My son,&rdquo;</p><p>- Replied my guide the unspoken thought&nbsp;&ndash; &ldquo;is none</p><p>Beneath God&rsquo;s wrath who dies in field or town,</p><p>Or earth&rsquo;s wide space, or whom the waters drown,</p><p>But here he cometh at last, and that so spurred</p><p>By Justice, that his fear, as those ye heard,</p><p>Impels him forward like desire. Is not</p><p>One spirit of all to reach the fatal spot</p><p>That God&rsquo;s love holdeth, and hence, if Char</p><p>chide,</p><p>Ye well may take it.&nbsp;&ndash; Raise thy heart, for now,</p><p>Constrained of Heaven, he must thy course allow."</p></div><div class="stanza"><p>Yet how I passed I know not. For the ground</p><p>Trembled that heard him, and a fearful sound</p><p>Of issuing wind arose, and blood-red light</p><p>Broke from beneath our feet, and sense and sight</p><p>Left me. The memory with cold sweat once more</p><p>Reminds me of the sudden-crimsoned night,</p><p>As sank I senseless by the dreadful shore.</p></div>'];

module.exports = wright;

},{}],10:[function(require,module,exports){
;(function () {
	'use strict';

	/**
	 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
	 *
	 * @codingstandard ftlabs-jsv2
	 * @copyright The Financial Times Limited [All Rights Reserved]
	 * @license MIT License (see LICENSE.txt)
	 */

	/*jslint browser:true, node:true*/
	/*global define, Event, Node*/


	/**
	 * Instantiate fast-clicking listeners on the specified layer.
	 *
	 * @constructor
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	function FastClick(layer, options) {
		var oldOnClick;

		options = options || {};

		/**
		 * Whether a click is currently being tracked.
		 *
		 * @type boolean
		 */
		this.trackingClick = false;


		/**
		 * Timestamp for when click tracking started.
		 *
		 * @type number
		 */
		this.trackingClickStart = 0;


		/**
		 * The element being tracked for a click.
		 *
		 * @type EventTarget
		 */
		this.targetElement = null;


		/**
		 * X-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartX = 0;


		/**
		 * Y-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartY = 0;


		/**
		 * ID of the last touch, retrieved from Touch.identifier.
		 *
		 * @type number
		 */
		this.lastTouchIdentifier = 0;


		/**
		 * Touchmove boundary, beyond which a click will be cancelled.
		 *
		 * @type number
		 */
		this.touchBoundary = options.touchBoundary || 10;


		/**
		 * The FastClick layer.
		 *
		 * @type Element
		 */
		this.layer = layer;

		/**
		 * The minimum time between tap(touchstart and touchend) events
		 *
		 * @type number
		 */
		this.tapDelay = options.tapDelay || 200;

		/**
		 * The maximum time for a tap
		 *
		 * @type number
		 */
		this.tapTimeout = options.tapTimeout || 700;

		if (FastClick.notNeeded(layer)) {
			return;
		}

		// Some old versions of Android don't have Function.prototype.bind
		function bind(method, context) {
			return function() { return method.apply(context, arguments); };
		}


		var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
		var context = this;
		for (var i = 0, l = methods.length; i < l; i++) {
			context[methods[i]] = bind(context[methods[i]], context);
		}

		// Set up event handlers as required
		if (deviceIsAndroid) {
			layer.addEventListener('mouseover', this.onMouse, true);
			layer.addEventListener('mousedown', this.onMouse, true);
			layer.addEventListener('mouseup', this.onMouse, true);
		}

		layer.addEventListener('click', this.onClick, true);
		layer.addEventListener('touchstart', this.onTouchStart, false);
		layer.addEventListener('touchmove', this.onTouchMove, false);
		layer.addEventListener('touchend', this.onTouchEnd, false);
		layer.addEventListener('touchcancel', this.onTouchCancel, false);

		// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
		// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
		// layer when they are cancelled.
		if (!Event.prototype.stopImmediatePropagation) {
			layer.removeEventListener = function(type, callback, capture) {
				var rmv = Node.prototype.removeEventListener;
				if (type === 'click') {
					rmv.call(layer, type, callback.hijacked || callback, capture);
				} else {
					rmv.call(layer, type, callback, capture);
				}
			};

			layer.addEventListener = function(type, callback, capture) {
				var adv = Node.prototype.addEventListener;
				if (type === 'click') {
					adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
						if (!event.propagationStopped) {
							callback(event);
						}
					}), capture);
				} else {
					adv.call(layer, type, callback, capture);
				}
			};
		}

		// If a handler is already declared in the element's onclick attribute, it will be fired before
		// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
		// adding it as listener.
		if (typeof layer.onclick === 'function') {

			// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
			// - the old one won't work if passed to addEventListener directly.
			oldOnClick = layer.onclick;
			layer.addEventListener('click', function(event) {
				oldOnClick(event);
			}, false);
			layer.onclick = null;
		}
	}

	/**
	* Windows Phone 8.1 fakes user agent string to look like Android and iPhone.
	*
	* @type boolean
	*/
	var deviceIsWindowsPhone = navigator.userAgent.indexOf("Windows Phone") >= 0;

	/**
	 * Android requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0 && !deviceIsWindowsPhone;


	/**
	 * iOS requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !deviceIsWindowsPhone;


	/**
	 * iOS 4 requires an exception for select elements.
	 *
	 * @type boolean
	 */
	var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


	/**
	 * iOS 6.0-7.* requires the target element to be manually derived
	 *
	 * @type boolean
	 */
	var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS [6-7]_\d/).test(navigator.userAgent);

	/**
	 * BlackBerry requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;

	/**
	 * Determine whether a given element requires a native click.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element needs a native click
	 */
	FastClick.prototype.needsClick = function(target) {
		switch (target.nodeName.toLowerCase()) {

		// Don't send a synthetic click to disabled inputs (issue #62)
		case 'button':
		case 'select':
		case 'textarea':
			if (target.disabled) {
				return true;
			}

			break;
		case 'input':

			// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
			if ((deviceIsIOS && target.type === 'file') || target.disabled) {
				return true;
			}

			break;
		case 'label':
		case 'iframe': // iOS8 homescreen apps can prevent events bubbling into frames
		case 'video':
			return true;
		}

		return (/\bneedsclick\b/).test(target.className);
	};


	/**
	 * Determine whether a given element requires a call to focus to simulate click into element.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
	 */
	FastClick.prototype.needsFocus = function(target) {
		switch (target.nodeName.toLowerCase()) {
		case 'textarea':
			return true;
		case 'select':
			return !deviceIsAndroid;
		case 'input':
			switch (target.type) {
			case 'button':
			case 'checkbox':
			case 'file':
			case 'image':
			case 'radio':
			case 'submit':
				return false;
			}

			// No point in attempting to focus disabled inputs
			return !target.disabled && !target.readOnly;
		default:
			return (/\bneedsfocus\b/).test(target.className);
		}
	};


	/**
	 * Send a click event to the specified element.
	 *
	 * @param {EventTarget|Element} targetElement
	 * @param {Event} event
	 */
	FastClick.prototype.sendClick = function(targetElement, event) {
		var clickEvent, touch;

		// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
		if (document.activeElement && document.activeElement !== targetElement) {
			document.activeElement.blur();
		}

		touch = event.changedTouches[0];

		// Synthesise a click event, with an extra attribute so it can be tracked
		clickEvent = document.createEvent('MouseEvents');
		clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
		clickEvent.forwardedTouchEvent = true;
		targetElement.dispatchEvent(clickEvent);
	};

	FastClick.prototype.determineEventType = function(targetElement) {

		//Issue #159: Android Chrome Select Box does not open with a synthetic click event
		if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
			return 'mousedown';
		}

		return 'click';
	};


	/**
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.focus = function(targetElement) {
		var length;

		// Issue #160: on iOS 7, some input elements (e.g. date datetime month) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
		if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month') {
			length = targetElement.value.length;
			targetElement.setSelectionRange(length, length);
		} else {
			targetElement.focus();
		}
	};


	/**
	 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
	 *
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.updateScrollParent = function(targetElement) {
		var scrollParent, parentElement;

		scrollParent = targetElement.fastClickScrollParent;

		// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
		// target element was moved to another parent.
		if (!scrollParent || !scrollParent.contains(targetElement)) {
			parentElement = targetElement;
			do {
				if (parentElement.scrollHeight > parentElement.offsetHeight) {
					scrollParent = parentElement;
					targetElement.fastClickScrollParent = parentElement;
					break;
				}

				parentElement = parentElement.parentElement;
			} while (parentElement);
		}

		// Always update the scroll top tracker if possible.
		if (scrollParent) {
			scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
		}
	};


	/**
	 * @param {EventTarget} targetElement
	 * @returns {Element|EventTarget}
	 */
	FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {

		// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
		if (eventTarget.nodeType === Node.TEXT_NODE) {
			return eventTarget.parentNode;
		}

		return eventTarget;
	};


	/**
	 * On touch start, record the position and scroll offset.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchStart = function(event) {
		var targetElement, touch, selection;

		// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
		if (event.targetTouches.length > 1) {
			return true;
		}

		targetElement = this.getTargetElementFromEventTarget(event.target);
		touch = event.targetTouches[0];

		if (deviceIsIOS) {

			// Only trusted events will deselect text on iOS (issue #49)
			selection = window.getSelection();
			if (selection.rangeCount && !selection.isCollapsed) {
				return true;
			}

			if (!deviceIsIOS4) {

				// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
				// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
				// with the same identifier as the touch event that previously triggered the click that triggered the alert.
				// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
				// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
				// Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
				// which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
				// random integers, it's safe to to continue if the identifier is 0 here.
				if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
					event.preventDefault();
					return false;
				}

				this.lastTouchIdentifier = touch.identifier;

				// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
				// 1) the user does a fling scroll on the scrollable layer
				// 2) the user stops the fling scroll with another tap
				// then the event.target of the last 'touchend' event will be the element that was under the user's finger
				// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
				// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
				this.updateScrollParent(targetElement);
			}
		}

		this.trackingClick = true;
		this.trackingClickStart = event.timeStamp;
		this.targetElement = targetElement;

		this.touchStartX = touch.pageX;
		this.touchStartY = touch.pageY;

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			event.preventDefault();
		}

		return true;
	};


	/**
	 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.touchHasMoved = function(event) {
		var touch = event.changedTouches[0], boundary = this.touchBoundary;

		if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
			return true;
		}

		return false;
	};


	/**
	 * Update the last position.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchMove = function(event) {
		if (!this.trackingClick) {
			return true;
		}

		// If the touch has moved, cancel the click tracking
		if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
			this.trackingClick = false;
			this.targetElement = null;
		}

		return true;
	};


	/**
	 * Attempt to find the labelled control for the given label element.
	 *
	 * @param {EventTarget|HTMLLabelElement} labelElement
	 * @returns {Element|null}
	 */
	FastClick.prototype.findControl = function(labelElement) {

		// Fast path for newer browsers supporting the HTML5 control attribute
		if (labelElement.control !== undefined) {
			return labelElement.control;
		}

		// All browsers under test that support touch events also support the HTML5 htmlFor attribute
		if (labelElement.htmlFor) {
			return document.getElementById(labelElement.htmlFor);
		}

		// If no for attribute exists, attempt to retrieve the first labellable descendant element
		// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
		return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
	};


	/**
	 * On touch end, determine whether to send a click event at once.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchEnd = function(event) {
		var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

		if (!this.trackingClick) {
			return true;
		}

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			this.cancelNextClick = true;
			return true;
		}

		if ((event.timeStamp - this.trackingClickStart) > this.tapTimeout) {
			return true;
		}

		// Reset to prevent wrong click cancel on input (issue #156).
		this.cancelNextClick = false;

		this.lastClickTime = event.timeStamp;

		trackingClickStart = this.trackingClickStart;
		this.trackingClick = false;
		this.trackingClickStart = 0;

		// On some iOS devices, the targetElement supplied with the event is invalid if the layer
		// is performing a transition or scroll, and has to be re-detected manually. Note that
		// for this to function correctly, it must be called *after* the event target is checked!
		// See issue #57; also filed as rdar://13048589 .
		if (deviceIsIOSWithBadTarget) {
			touch = event.changedTouches[0];

			// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
			targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
			targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
		}

		targetTagName = targetElement.tagName.toLowerCase();
		if (targetTagName === 'label') {
			forElement = this.findControl(targetElement);
			if (forElement) {
				this.focus(targetElement);
				if (deviceIsAndroid) {
					return false;
				}

				targetElement = forElement;
			}
		} else if (this.needsFocus(targetElement)) {

			// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
			// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
			if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
				this.targetElement = null;
				return false;
			}

			this.focus(targetElement);
			this.sendClick(targetElement, event);

			// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
			// Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
			if (!deviceIsIOS || targetTagName !== 'select') {
				this.targetElement = null;
				event.preventDefault();
			}

			return false;
		}

		if (deviceIsIOS && !deviceIsIOS4) {

			// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
			// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
			scrollParent = targetElement.fastClickScrollParent;
			if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
				return true;
			}
		}

		// Prevent the actual click from going though - unless the target node is marked as requiring
		// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
		if (!this.needsClick(targetElement)) {
			event.preventDefault();
			this.sendClick(targetElement, event);
		}

		return false;
	};


	/**
	 * On touch cancel, stop tracking the click.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.onTouchCancel = function() {
		this.trackingClick = false;
		this.targetElement = null;
	};


	/**
	 * Determine mouse events which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onMouse = function(event) {

		// If a target element was never set (because a touch event was never fired) allow the event
		if (!this.targetElement) {
			return true;
		}

		if (event.forwardedTouchEvent) {
			return true;
		}

		// Programmatically generated events targeting a specific element should be permitted
		if (!event.cancelable) {
			return true;
		}

		// Derive and check the target element to see whether the mouse event needs to be permitted;
		// unless explicitly enabled, prevent non-touch click events from triggering actions,
		// to prevent ghost/doubleclicks.
		if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

			// Prevent any user-added listeners declared on FastClick element from being fired.
			if (event.stopImmediatePropagation) {
				event.stopImmediatePropagation();
			} else {

				// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
				event.propagationStopped = true;
			}

			// Cancel the event
			event.stopPropagation();
			event.preventDefault();

			return false;
		}

		// If the mouse event is permitted, return true for the action to go through.
		return true;
	};


	/**
	 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
	 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
	 * an actual click which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onClick = function(event) {
		var permitted;

		// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
		if (this.trackingClick) {
			this.targetElement = null;
			this.trackingClick = false;
			return true;
		}

		// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
		if (event.target.type === 'submit' && event.detail === 0) {
			return true;
		}

		permitted = this.onMouse(event);

		// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
		if (!permitted) {
			this.targetElement = null;
		}

		// If clicks are permitted, return true for the action to go through.
		return permitted;
	};


	/**
	 * Remove all FastClick's event listeners.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.destroy = function() {
		var layer = this.layer;

		if (deviceIsAndroid) {
			layer.removeEventListener('mouseover', this.onMouse, true);
			layer.removeEventListener('mousedown', this.onMouse, true);
			layer.removeEventListener('mouseup', this.onMouse, true);
		}

		layer.removeEventListener('click', this.onClick, true);
		layer.removeEventListener('touchstart', this.onTouchStart, false);
		layer.removeEventListener('touchmove', this.onTouchMove, false);
		layer.removeEventListener('touchend', this.onTouchEnd, false);
		layer.removeEventListener('touchcancel', this.onTouchCancel, false);
	};


	/**
	 * Check whether FastClick is needed.
	 *
	 * @param {Element} layer The layer to listen on
	 */
	FastClick.notNeeded = function(layer) {
		var metaViewport;
		var chromeVersion;
		var blackberryVersion;
		var firefoxVersion;

		// Devices that don't support touch don't need FastClick
		if (typeof window.ontouchstart === 'undefined') {
			return true;
		}

		// Chrome version - zero for other browsers
		chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (chromeVersion) {

			if (deviceIsAndroid) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// Chrome 32 and above with width=device-width or less don't need FastClick
					if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}

			// Chrome desktop doesn't need FastClick (issue #15)
			} else {
				return true;
			}
		}

		if (deviceIsBlackBerry10) {
			blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);

			// BlackBerry 10.3+ does not require Fastclick library.
			// https://github.com/ftlabs/fastclick/issues/251
			if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// user-scalable=no eliminates click delay.
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// width=device-width (or less than device-width) eliminates click delay.
					if (document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}
			}
		}

		// IE10 with -ms-touch-action: none or manipulation, which disables double-tap-to-zoom (issue #97)
		if (layer.style.msTouchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		// Firefox version - zero for other browsers
		firefoxVersion = +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (firefoxVersion >= 27) {
			// Firefox 27+ does not have tap delay if the content is not zoomable - https://bugzilla.mozilla.org/show_bug.cgi?id=922896

			metaViewport = document.querySelector('meta[name=viewport]');
			if (metaViewport && (metaViewport.content.indexOf('user-scalable=no') !== -1 || document.documentElement.scrollWidth <= window.outerWidth)) {
				return true;
			}
		}

		// IE11: prefixed -ms-touch-action is no longer supported and it's recomended to use non-prefixed version
		// http://msdn.microsoft.com/en-us/library/windows/apps/Hh767313.aspx
		if (layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		return false;
	};


	/**
	 * Factory method for creating a FastClick object
	 *
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	FastClick.attach = function(layer, options) {
		return new FastClick(layer, options);
	};


	if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {

		// AMD. Register as an anonymous module.
		define(function() {
			return FastClick;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = FastClick.attach;
		module.exports.FastClick = FastClick;
	} else {
		window.FastClick = FastClick;
	}
}());

},{}],11:[function(require,module,exports){
/*! Hammer.JS - v2.0.7 - 2016-04-22
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2016 Jorik Tangelder;
 * Licensed under the MIT license */
(function(window, document, exportName, undefined) {
  'use strict';

var VENDOR_PREFIXES = ['', 'webkit', 'Moz', 'MS', 'ms', 'o'];
var TEST_ELEMENT = document.createElement('div');

var TYPE_FUNCTION = 'function';

var round = Math.round;
var abs = Math.abs;
var now = Date.now;

/**
 * set a timeout with a given scope
 * @param {Function} fn
 * @param {Number} timeout
 * @param {Object} context
 * @returns {number}
 */
function setTimeoutContext(fn, timeout, context) {
    return setTimeout(bindFn(fn, context), timeout);
}

/**
 * if the argument is an array, we want to execute the fn on each entry
 * if it aint an array we don't want to do a thing.
 * this is used by all the methods that accept a single and array argument.
 * @param {*|Array} arg
 * @param {String} fn
 * @param {Object} [context]
 * @returns {Boolean}
 */
function invokeArrayArg(arg, fn, context) {
    if (Array.isArray(arg)) {
        each(arg, context[fn], context);
        return true;
    }
    return false;
}

/**
 * walk objects and arrays
 * @param {Object} obj
 * @param {Function} iterator
 * @param {Object} context
 */
function each(obj, iterator, context) {
    var i;

    if (!obj) {
        return;
    }

    if (obj.forEach) {
        obj.forEach(iterator, context);
    } else if (obj.length !== undefined) {
        i = 0;
        while (i < obj.length) {
            iterator.call(context, obj[i], i, obj);
            i++;
        }
    } else {
        for (i in obj) {
            obj.hasOwnProperty(i) && iterator.call(context, obj[i], i, obj);
        }
    }
}

/**
 * wrap a method with a deprecation warning and stack trace
 * @param {Function} method
 * @param {String} name
 * @param {String} message
 * @returns {Function} A new function wrapping the supplied method.
 */
function deprecate(method, name, message) {
    var deprecationMessage = 'DEPRECATED METHOD: ' + name + '\n' + message + ' AT \n';
    return function() {
        var e = new Error('get-stack-trace');
        var stack = e && e.stack ? e.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@') : 'Unknown Stack Trace';

        var log = window.console && (window.console.warn || window.console.log);
        if (log) {
            log.call(window.console, deprecationMessage, stack);
        }
        return method.apply(this, arguments);
    };
}

/**
 * extend object.
 * means that properties in dest will be overwritten by the ones in src.
 * @param {Object} target
 * @param {...Object} objects_to_assign
 * @returns {Object} target
 */
var assign;
if (typeof Object.assign !== 'function') {
    assign = function assign(target) {
        if (target === undefined || target === null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }

        var output = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source !== undefined && source !== null) {
                for (var nextKey in source) {
                    if (source.hasOwnProperty(nextKey)) {
                        output[nextKey] = source[nextKey];
                    }
                }
            }
        }
        return output;
    };
} else {
    assign = Object.assign;
}

/**
 * extend object.
 * means that properties in dest will be overwritten by the ones in src.
 * @param {Object} dest
 * @param {Object} src
 * @param {Boolean} [merge=false]
 * @returns {Object} dest
 */
var extend = deprecate(function extend(dest, src, merge) {
    var keys = Object.keys(src);
    var i = 0;
    while (i < keys.length) {
        if (!merge || (merge && dest[keys[i]] === undefined)) {
            dest[keys[i]] = src[keys[i]];
        }
        i++;
    }
    return dest;
}, 'extend', 'Use `assign`.');

/**
 * merge the values from src in the dest.
 * means that properties that exist in dest will not be overwritten by src
 * @param {Object} dest
 * @param {Object} src
 * @returns {Object} dest
 */
var merge = deprecate(function merge(dest, src) {
    return extend(dest, src, true);
}, 'merge', 'Use `assign`.');

/**
 * simple class inheritance
 * @param {Function} child
 * @param {Function} base
 * @param {Object} [properties]
 */
function inherit(child, base, properties) {
    var baseP = base.prototype,
        childP;

    childP = child.prototype = Object.create(baseP);
    childP.constructor = child;
    childP._super = baseP;

    if (properties) {
        assign(childP, properties);
    }
}

/**
 * simple function bind
 * @param {Function} fn
 * @param {Object} context
 * @returns {Function}
 */
function bindFn(fn, context) {
    return function boundFn() {
        return fn.apply(context, arguments);
    };
}

/**
 * let a boolean value also be a function that must return a boolean
 * this first item in args will be used as the context
 * @param {Boolean|Function} val
 * @param {Array} [args]
 * @returns {Boolean}
 */
function boolOrFn(val, args) {
    if (typeof val == TYPE_FUNCTION) {
        return val.apply(args ? args[0] || undefined : undefined, args);
    }
    return val;
}

/**
 * use the val2 when val1 is undefined
 * @param {*} val1
 * @param {*} val2
 * @returns {*}
 */
function ifUndefined(val1, val2) {
    return (val1 === undefined) ? val2 : val1;
}

/**
 * addEventListener with multiple events at once
 * @param {EventTarget} target
 * @param {String} types
 * @param {Function} handler
 */
function addEventListeners(target, types, handler) {
    each(splitStr(types), function(type) {
        target.addEventListener(type, handler, false);
    });
}

/**
 * removeEventListener with multiple events at once
 * @param {EventTarget} target
 * @param {String} types
 * @param {Function} handler
 */
function removeEventListeners(target, types, handler) {
    each(splitStr(types), function(type) {
        target.removeEventListener(type, handler, false);
    });
}

/**
 * find if a node is in the given parent
 * @method hasParent
 * @param {HTMLElement} node
 * @param {HTMLElement} parent
 * @return {Boolean} found
 */
function hasParent(node, parent) {
    while (node) {
        if (node == parent) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
}

/**
 * small indexOf wrapper
 * @param {String} str
 * @param {String} find
 * @returns {Boolean} found
 */
function inStr(str, find) {
    return str.indexOf(find) > -1;
}

/**
 * split string on whitespace
 * @param {String} str
 * @returns {Array} words
 */
function splitStr(str) {
    return str.trim().split(/\s+/g);
}

/**
 * find if a array contains the object using indexOf or a simple polyFill
 * @param {Array} src
 * @param {String} find
 * @param {String} [findByKey]
 * @return {Boolean|Number} false when not found, or the index
 */
function inArray(src, find, findByKey) {
    if (src.indexOf && !findByKey) {
        return src.indexOf(find);
    } else {
        var i = 0;
        while (i < src.length) {
            if ((findByKey && src[i][findByKey] == find) || (!findByKey && src[i] === find)) {
                return i;
            }
            i++;
        }
        return -1;
    }
}

/**
 * convert array-like objects to real arrays
 * @param {Object} obj
 * @returns {Array}
 */
function toArray(obj) {
    return Array.prototype.slice.call(obj, 0);
}

/**
 * unique array with objects based on a key (like 'id') or just by the array's value
 * @param {Array} src [{id:1},{id:2},{id:1}]
 * @param {String} [key]
 * @param {Boolean} [sort=False]
 * @returns {Array} [{id:1},{id:2}]
 */
function uniqueArray(src, key, sort) {
    var results = [];
    var values = [];
    var i = 0;

    while (i < src.length) {
        var val = key ? src[i][key] : src[i];
        if (inArray(values, val) < 0) {
            results.push(src[i]);
        }
        values[i] = val;
        i++;
    }

    if (sort) {
        if (!key) {
            results = results.sort();
        } else {
            results = results.sort(function sortUniqueArray(a, b) {
                return a[key] > b[key];
            });
        }
    }

    return results;
}

/**
 * get the prefixed property
 * @param {Object} obj
 * @param {String} property
 * @returns {String|Undefined} prefixed
 */
function prefixed(obj, property) {
    var prefix, prop;
    var camelProp = property[0].toUpperCase() + property.slice(1);

    var i = 0;
    while (i < VENDOR_PREFIXES.length) {
        prefix = VENDOR_PREFIXES[i];
        prop = (prefix) ? prefix + camelProp : property;

        if (prop in obj) {
            return prop;
        }
        i++;
    }
    return undefined;
}

/**
 * get a unique id
 * @returns {number} uniqueId
 */
var _uniqueId = 1;
function uniqueId() {
    return _uniqueId++;
}

/**
 * get the window object of an element
 * @param {HTMLElement} element
 * @returns {DocumentView|Window}
 */
function getWindowForElement(element) {
    var doc = element.ownerDocument || element;
    return (doc.defaultView || doc.parentWindow || window);
}

var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;

var SUPPORT_TOUCH = ('ontouchstart' in window);
var SUPPORT_POINTER_EVENTS = prefixed(window, 'PointerEvent') !== undefined;
var SUPPORT_ONLY_TOUCH = SUPPORT_TOUCH && MOBILE_REGEX.test(navigator.userAgent);

var INPUT_TYPE_TOUCH = 'touch';
var INPUT_TYPE_PEN = 'pen';
var INPUT_TYPE_MOUSE = 'mouse';
var INPUT_TYPE_KINECT = 'kinect';

var COMPUTE_INTERVAL = 25;

var INPUT_START = 1;
var INPUT_MOVE = 2;
var INPUT_END = 4;
var INPUT_CANCEL = 8;

var DIRECTION_NONE = 1;
var DIRECTION_LEFT = 2;
var DIRECTION_RIGHT = 4;
var DIRECTION_UP = 8;
var DIRECTION_DOWN = 16;

var DIRECTION_HORIZONTAL = DIRECTION_LEFT | DIRECTION_RIGHT;
var DIRECTION_VERTICAL = DIRECTION_UP | DIRECTION_DOWN;
var DIRECTION_ALL = DIRECTION_HORIZONTAL | DIRECTION_VERTICAL;

var PROPS_XY = ['x', 'y'];
var PROPS_CLIENT_XY = ['clientX', 'clientY'];

/**
 * create new input type manager
 * @param {Manager} manager
 * @param {Function} callback
 * @returns {Input}
 * @constructor
 */
function Input(manager, callback) {
    var self = this;
    this.manager = manager;
    this.callback = callback;
    this.element = manager.element;
    this.target = manager.options.inputTarget;

    // smaller wrapper around the handler, for the scope and the enabled state of the manager,
    // so when disabled the input events are completely bypassed.
    this.domHandler = function(ev) {
        if (boolOrFn(manager.options.enable, [manager])) {
            self.handler(ev);
        }
    };

    this.init();

}

Input.prototype = {
    /**
     * should handle the inputEvent data and trigger the callback
     * @virtual
     */
    handler: function() { },

    /**
     * bind the events
     */
    init: function() {
        this.evEl && addEventListeners(this.element, this.evEl, this.domHandler);
        this.evTarget && addEventListeners(this.target, this.evTarget, this.domHandler);
        this.evWin && addEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
    },

    /**
     * unbind the events
     */
    destroy: function() {
        this.evEl && removeEventListeners(this.element, this.evEl, this.domHandler);
        this.evTarget && removeEventListeners(this.target, this.evTarget, this.domHandler);
        this.evWin && removeEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
    }
};

/**
 * create new input type manager
 * called by the Manager constructor
 * @param {Hammer} manager
 * @returns {Input}
 */
function createInputInstance(manager) {
    var Type;
    var inputClass = manager.options.inputClass;

    if (inputClass) {
        Type = inputClass;
    } else if (SUPPORT_POINTER_EVENTS) {
        Type = PointerEventInput;
    } else if (SUPPORT_ONLY_TOUCH) {
        Type = TouchInput;
    } else if (!SUPPORT_TOUCH) {
        Type = MouseInput;
    } else {
        Type = TouchMouseInput;
    }
    return new (Type)(manager, inputHandler);
}

/**
 * handle input events
 * @param {Manager} manager
 * @param {String} eventType
 * @param {Object} input
 */
function inputHandler(manager, eventType, input) {
    var pointersLen = input.pointers.length;
    var changedPointersLen = input.changedPointers.length;
    var isFirst = (eventType & INPUT_START && (pointersLen - changedPointersLen === 0));
    var isFinal = (eventType & (INPUT_END | INPUT_CANCEL) && (pointersLen - changedPointersLen === 0));

    input.isFirst = !!isFirst;
    input.isFinal = !!isFinal;

    if (isFirst) {
        manager.session = {};
    }

    // source event is the normalized value of the domEvents
    // like 'touchstart, mouseup, pointerdown'
    input.eventType = eventType;

    // compute scale, rotation etc
    computeInputData(manager, input);

    // emit secret event
    manager.emit('hammer.input', input);

    manager.recognize(input);
    manager.session.prevInput = input;
}

/**
 * extend the data with some usable properties like scale, rotate, velocity etc
 * @param {Object} manager
 * @param {Object} input
 */
function computeInputData(manager, input) {
    var session = manager.session;
    var pointers = input.pointers;
    var pointersLength = pointers.length;

    // store the first input to calculate the distance and direction
    if (!session.firstInput) {
        session.firstInput = simpleCloneInputData(input);
    }

    // to compute scale and rotation we need to store the multiple touches
    if (pointersLength > 1 && !session.firstMultiple) {
        session.firstMultiple = simpleCloneInputData(input);
    } else if (pointersLength === 1) {
        session.firstMultiple = false;
    }

    var firstInput = session.firstInput;
    var firstMultiple = session.firstMultiple;
    var offsetCenter = firstMultiple ? firstMultiple.center : firstInput.center;

    var center = input.center = getCenter(pointers);
    input.timeStamp = now();
    input.deltaTime = input.timeStamp - firstInput.timeStamp;

    input.angle = getAngle(offsetCenter, center);
    input.distance = getDistance(offsetCenter, center);

    computeDeltaXY(session, input);
    input.offsetDirection = getDirection(input.deltaX, input.deltaY);

    var overallVelocity = getVelocity(input.deltaTime, input.deltaX, input.deltaY);
    input.overallVelocityX = overallVelocity.x;
    input.overallVelocityY = overallVelocity.y;
    input.overallVelocity = (abs(overallVelocity.x) > abs(overallVelocity.y)) ? overallVelocity.x : overallVelocity.y;

    input.scale = firstMultiple ? getScale(firstMultiple.pointers, pointers) : 1;
    input.rotation = firstMultiple ? getRotation(firstMultiple.pointers, pointers) : 0;

    input.maxPointers = !session.prevInput ? input.pointers.length : ((input.pointers.length >
        session.prevInput.maxPointers) ? input.pointers.length : session.prevInput.maxPointers);

    computeIntervalInputData(session, input);

    // find the correct target
    var target = manager.element;
    if (hasParent(input.srcEvent.target, target)) {
        target = input.srcEvent.target;
    }
    input.target = target;
}

function computeDeltaXY(session, input) {
    var center = input.center;
    var offset = session.offsetDelta || {};
    var prevDelta = session.prevDelta || {};
    var prevInput = session.prevInput || {};

    if (input.eventType === INPUT_START || prevInput.eventType === INPUT_END) {
        prevDelta = session.prevDelta = {
            x: prevInput.deltaX || 0,
            y: prevInput.deltaY || 0
        };

        offset = session.offsetDelta = {
            x: center.x,
            y: center.y
        };
    }

    input.deltaX = prevDelta.x + (center.x - offset.x);
    input.deltaY = prevDelta.y + (center.y - offset.y);
}

/**
 * velocity is calculated every x ms
 * @param {Object} session
 * @param {Object} input
 */
function computeIntervalInputData(session, input) {
    var last = session.lastInterval || input,
        deltaTime = input.timeStamp - last.timeStamp,
        velocity, velocityX, velocityY, direction;

    if (input.eventType != INPUT_CANCEL && (deltaTime > COMPUTE_INTERVAL || last.velocity === undefined)) {
        var deltaX = input.deltaX - last.deltaX;
        var deltaY = input.deltaY - last.deltaY;

        var v = getVelocity(deltaTime, deltaX, deltaY);
        velocityX = v.x;
        velocityY = v.y;
        velocity = (abs(v.x) > abs(v.y)) ? v.x : v.y;
        direction = getDirection(deltaX, deltaY);

        session.lastInterval = input;
    } else {
        // use latest velocity info if it doesn't overtake a minimum period
        velocity = last.velocity;
        velocityX = last.velocityX;
        velocityY = last.velocityY;
        direction = last.direction;
    }

    input.velocity = velocity;
    input.velocityX = velocityX;
    input.velocityY = velocityY;
    input.direction = direction;
}

/**
 * create a simple clone from the input used for storage of firstInput and firstMultiple
 * @param {Object} input
 * @returns {Object} clonedInputData
 */
function simpleCloneInputData(input) {
    // make a simple copy of the pointers because we will get a reference if we don't
    // we only need clientXY for the calculations
    var pointers = [];
    var i = 0;
    while (i < input.pointers.length) {
        pointers[i] = {
            clientX: round(input.pointers[i].clientX),
            clientY: round(input.pointers[i].clientY)
        };
        i++;
    }

    return {
        timeStamp: now(),
        pointers: pointers,
        center: getCenter(pointers),
        deltaX: input.deltaX,
        deltaY: input.deltaY
    };
}

/**
 * get the center of all the pointers
 * @param {Array} pointers
 * @return {Object} center contains `x` and `y` properties
 */
function getCenter(pointers) {
    var pointersLength = pointers.length;

    // no need to loop when only one touch
    if (pointersLength === 1) {
        return {
            x: round(pointers[0].clientX),
            y: round(pointers[0].clientY)
        };
    }

    var x = 0, y = 0, i = 0;
    while (i < pointersLength) {
        x += pointers[i].clientX;
        y += pointers[i].clientY;
        i++;
    }

    return {
        x: round(x / pointersLength),
        y: round(y / pointersLength)
    };
}

/**
 * calculate the velocity between two points. unit is in px per ms.
 * @param {Number} deltaTime
 * @param {Number} x
 * @param {Number} y
 * @return {Object} velocity `x` and `y`
 */
function getVelocity(deltaTime, x, y) {
    return {
        x: x / deltaTime || 0,
        y: y / deltaTime || 0
    };
}

/**
 * get the direction between two points
 * @param {Number} x
 * @param {Number} y
 * @return {Number} direction
 */
function getDirection(x, y) {
    if (x === y) {
        return DIRECTION_NONE;
    }

    if (abs(x) >= abs(y)) {
        return x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
    }
    return y < 0 ? DIRECTION_UP : DIRECTION_DOWN;
}

/**
 * calculate the absolute distance between two points
 * @param {Object} p1 {x, y}
 * @param {Object} p2 {x, y}
 * @param {Array} [props] containing x and y keys
 * @return {Number} distance
 */
function getDistance(p1, p2, props) {
    if (!props) {
        props = PROPS_XY;
    }
    var x = p2[props[0]] - p1[props[0]],
        y = p2[props[1]] - p1[props[1]];

    return Math.sqrt((x * x) + (y * y));
}

/**
 * calculate the angle between two coordinates
 * @param {Object} p1
 * @param {Object} p2
 * @param {Array} [props] containing x and y keys
 * @return {Number} angle
 */
function getAngle(p1, p2, props) {
    if (!props) {
        props = PROPS_XY;
    }
    var x = p2[props[0]] - p1[props[0]],
        y = p2[props[1]] - p1[props[1]];
    return Math.atan2(y, x) * 180 / Math.PI;
}

/**
 * calculate the rotation degrees between two pointersets
 * @param {Array} start array of pointers
 * @param {Array} end array of pointers
 * @return {Number} rotation
 */
function getRotation(start, end) {
    return getAngle(end[1], end[0], PROPS_CLIENT_XY) + getAngle(start[1], start[0], PROPS_CLIENT_XY);
}

/**
 * calculate the scale factor between two pointersets
 * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
 * @param {Array} start array of pointers
 * @param {Array} end array of pointers
 * @return {Number} scale
 */
function getScale(start, end) {
    return getDistance(end[0], end[1], PROPS_CLIENT_XY) / getDistance(start[0], start[1], PROPS_CLIENT_XY);
}

var MOUSE_INPUT_MAP = {
    mousedown: INPUT_START,
    mousemove: INPUT_MOVE,
    mouseup: INPUT_END
};

var MOUSE_ELEMENT_EVENTS = 'mousedown';
var MOUSE_WINDOW_EVENTS = 'mousemove mouseup';

/**
 * Mouse events input
 * @constructor
 * @extends Input
 */
function MouseInput() {
    this.evEl = MOUSE_ELEMENT_EVENTS;
    this.evWin = MOUSE_WINDOW_EVENTS;

    this.pressed = false; // mousedown state

    Input.apply(this, arguments);
}

inherit(MouseInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function MEhandler(ev) {
        var eventType = MOUSE_INPUT_MAP[ev.type];

        // on start we want to have the left mouse button down
        if (eventType & INPUT_START && ev.button === 0) {
            this.pressed = true;
        }

        if (eventType & INPUT_MOVE && ev.which !== 1) {
            eventType = INPUT_END;
        }

        // mouse must be down
        if (!this.pressed) {
            return;
        }

        if (eventType & INPUT_END) {
            this.pressed = false;
        }

        this.callback(this.manager, eventType, {
            pointers: [ev],
            changedPointers: [ev],
            pointerType: INPUT_TYPE_MOUSE,
            srcEvent: ev
        });
    }
});

var POINTER_INPUT_MAP = {
    pointerdown: INPUT_START,
    pointermove: INPUT_MOVE,
    pointerup: INPUT_END,
    pointercancel: INPUT_CANCEL,
    pointerout: INPUT_CANCEL
};

// in IE10 the pointer types is defined as an enum
var IE10_POINTER_TYPE_ENUM = {
    2: INPUT_TYPE_TOUCH,
    3: INPUT_TYPE_PEN,
    4: INPUT_TYPE_MOUSE,
    5: INPUT_TYPE_KINECT // see https://twitter.com/jacobrossi/status/480596438489890816
};

var POINTER_ELEMENT_EVENTS = 'pointerdown';
var POINTER_WINDOW_EVENTS = 'pointermove pointerup pointercancel';

// IE10 has prefixed support, and case-sensitive
if (window.MSPointerEvent && !window.PointerEvent) {
    POINTER_ELEMENT_EVENTS = 'MSPointerDown';
    POINTER_WINDOW_EVENTS = 'MSPointerMove MSPointerUp MSPointerCancel';
}

/**
 * Pointer events input
 * @constructor
 * @extends Input
 */
function PointerEventInput() {
    this.evEl = POINTER_ELEMENT_EVENTS;
    this.evWin = POINTER_WINDOW_EVENTS;

    Input.apply(this, arguments);

    this.store = (this.manager.session.pointerEvents = []);
}

inherit(PointerEventInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function PEhandler(ev) {
        var store = this.store;
        var removePointer = false;

        var eventTypeNormalized = ev.type.toLowerCase().replace('ms', '');
        var eventType = POINTER_INPUT_MAP[eventTypeNormalized];
        var pointerType = IE10_POINTER_TYPE_ENUM[ev.pointerType] || ev.pointerType;

        var isTouch = (pointerType == INPUT_TYPE_TOUCH);

        // get index of the event in the store
        var storeIndex = inArray(store, ev.pointerId, 'pointerId');

        // start and mouse must be down
        if (eventType & INPUT_START && (ev.button === 0 || isTouch)) {
            if (storeIndex < 0) {
                store.push(ev);
                storeIndex = store.length - 1;
            }
        } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
            removePointer = true;
        }

        // it not found, so the pointer hasn't been down (so it's probably a hover)
        if (storeIndex < 0) {
            return;
        }

        // update the event in the store
        store[storeIndex] = ev;

        this.callback(this.manager, eventType, {
            pointers: store,
            changedPointers: [ev],
            pointerType: pointerType,
            srcEvent: ev
        });

        if (removePointer) {
            // remove from the store
            store.splice(storeIndex, 1);
        }
    }
});

var SINGLE_TOUCH_INPUT_MAP = {
    touchstart: INPUT_START,
    touchmove: INPUT_MOVE,
    touchend: INPUT_END,
    touchcancel: INPUT_CANCEL
};

var SINGLE_TOUCH_TARGET_EVENTS = 'touchstart';
var SINGLE_TOUCH_WINDOW_EVENTS = 'touchstart touchmove touchend touchcancel';

/**
 * Touch events input
 * @constructor
 * @extends Input
 */
function SingleTouchInput() {
    this.evTarget = SINGLE_TOUCH_TARGET_EVENTS;
    this.evWin = SINGLE_TOUCH_WINDOW_EVENTS;
    this.started = false;

    Input.apply(this, arguments);
}

inherit(SingleTouchInput, Input, {
    handler: function TEhandler(ev) {
        var type = SINGLE_TOUCH_INPUT_MAP[ev.type];

        // should we handle the touch events?
        if (type === INPUT_START) {
            this.started = true;
        }

        if (!this.started) {
            return;
        }

        var touches = normalizeSingleTouches.call(this, ev, type);

        // when done, reset the started state
        if (type & (INPUT_END | INPUT_CANCEL) && touches[0].length - touches[1].length === 0) {
            this.started = false;
        }

        this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
        });
    }
});

/**
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function normalizeSingleTouches(ev, type) {
    var all = toArray(ev.touches);
    var changed = toArray(ev.changedTouches);

    if (type & (INPUT_END | INPUT_CANCEL)) {
        all = uniqueArray(all.concat(changed), 'identifier', true);
    }

    return [all, changed];
}

var TOUCH_INPUT_MAP = {
    touchstart: INPUT_START,
    touchmove: INPUT_MOVE,
    touchend: INPUT_END,
    touchcancel: INPUT_CANCEL
};

var TOUCH_TARGET_EVENTS = 'touchstart touchmove touchend touchcancel';

/**
 * Multi-user touch events input
 * @constructor
 * @extends Input
 */
function TouchInput() {
    this.evTarget = TOUCH_TARGET_EVENTS;
    this.targetIds = {};

    Input.apply(this, arguments);
}

inherit(TouchInput, Input, {
    handler: function MTEhandler(ev) {
        var type = TOUCH_INPUT_MAP[ev.type];
        var touches = getTouches.call(this, ev, type);
        if (!touches) {
            return;
        }

        this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
        });
    }
});

/**
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function getTouches(ev, type) {
    var allTouches = toArray(ev.touches);
    var targetIds = this.targetIds;

    // when there is only one touch, the process can be simplified
    if (type & (INPUT_START | INPUT_MOVE) && allTouches.length === 1) {
        targetIds[allTouches[0].identifier] = true;
        return [allTouches, allTouches];
    }

    var i,
        targetTouches,
        changedTouches = toArray(ev.changedTouches),
        changedTargetTouches = [],
        target = this.target;

    // get target touches from touches
    targetTouches = allTouches.filter(function(touch) {
        return hasParent(touch.target, target);
    });

    // collect touches
    if (type === INPUT_START) {
        i = 0;
        while (i < targetTouches.length) {
            targetIds[targetTouches[i].identifier] = true;
            i++;
        }
    }

    // filter changed touches to only contain touches that exist in the collected target ids
    i = 0;
    while (i < changedTouches.length) {
        if (targetIds[changedTouches[i].identifier]) {
            changedTargetTouches.push(changedTouches[i]);
        }

        // cleanup removed touches
        if (type & (INPUT_END | INPUT_CANCEL)) {
            delete targetIds[changedTouches[i].identifier];
        }
        i++;
    }

    if (!changedTargetTouches.length) {
        return;
    }

    return [
        // merge targetTouches with changedTargetTouches so it contains ALL touches, including 'end' and 'cancel'
        uniqueArray(targetTouches.concat(changedTargetTouches), 'identifier', true),
        changedTargetTouches
    ];
}

/**
 * Combined touch and mouse input
 *
 * Touch has a higher priority then mouse, and while touching no mouse events are allowed.
 * This because touch devices also emit mouse events while doing a touch.
 *
 * @constructor
 * @extends Input
 */

var DEDUP_TIMEOUT = 2500;
var DEDUP_DISTANCE = 25;

function TouchMouseInput() {
    Input.apply(this, arguments);

    var handler = bindFn(this.handler, this);
    this.touch = new TouchInput(this.manager, handler);
    this.mouse = new MouseInput(this.manager, handler);

    this.primaryTouch = null;
    this.lastTouches = [];
}

inherit(TouchMouseInput, Input, {
    /**
     * handle mouse and touch events
     * @param {Hammer} manager
     * @param {String} inputEvent
     * @param {Object} inputData
     */
    handler: function TMEhandler(manager, inputEvent, inputData) {
        var isTouch = (inputData.pointerType == INPUT_TYPE_TOUCH),
            isMouse = (inputData.pointerType == INPUT_TYPE_MOUSE);

        if (isMouse && inputData.sourceCapabilities && inputData.sourceCapabilities.firesTouchEvents) {
            return;
        }

        // when we're in a touch event, record touches to  de-dupe synthetic mouse event
        if (isTouch) {
            recordTouches.call(this, inputEvent, inputData);
        } else if (isMouse && isSyntheticEvent.call(this, inputData)) {
            return;
        }

        this.callback(manager, inputEvent, inputData);
    },

    /**
     * remove the event listeners
     */
    destroy: function destroy() {
        this.touch.destroy();
        this.mouse.destroy();
    }
});

function recordTouches(eventType, eventData) {
    if (eventType & INPUT_START) {
        this.primaryTouch = eventData.changedPointers[0].identifier;
        setLastTouch.call(this, eventData);
    } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
        setLastTouch.call(this, eventData);
    }
}

function setLastTouch(eventData) {
    var touch = eventData.changedPointers[0];

    if (touch.identifier === this.primaryTouch) {
        var lastTouch = {x: touch.clientX, y: touch.clientY};
        this.lastTouches.push(lastTouch);
        var lts = this.lastTouches;
        var removeLastTouch = function() {
            var i = lts.indexOf(lastTouch);
            if (i > -1) {
                lts.splice(i, 1);
            }
        };
        setTimeout(removeLastTouch, DEDUP_TIMEOUT);
    }
}

function isSyntheticEvent(eventData) {
    var x = eventData.srcEvent.clientX, y = eventData.srcEvent.clientY;
    for (var i = 0; i < this.lastTouches.length; i++) {
        var t = this.lastTouches[i];
        var dx = Math.abs(x - t.x), dy = Math.abs(y - t.y);
        if (dx <= DEDUP_DISTANCE && dy <= DEDUP_DISTANCE) {
            return true;
        }
    }
    return false;
}

var PREFIXED_TOUCH_ACTION = prefixed(TEST_ELEMENT.style, 'touchAction');
var NATIVE_TOUCH_ACTION = PREFIXED_TOUCH_ACTION !== undefined;

// magical touchAction value
var TOUCH_ACTION_COMPUTE = 'compute';
var TOUCH_ACTION_AUTO = 'auto';
var TOUCH_ACTION_MANIPULATION = 'manipulation'; // not implemented
var TOUCH_ACTION_NONE = 'none';
var TOUCH_ACTION_PAN_X = 'pan-x';
var TOUCH_ACTION_PAN_Y = 'pan-y';
var TOUCH_ACTION_MAP = getTouchActionProps();

/**
 * Touch Action
 * sets the touchAction property or uses the js alternative
 * @param {Manager} manager
 * @param {String} value
 * @constructor
 */
function TouchAction(manager, value) {
    this.manager = manager;
    this.set(value);
}

TouchAction.prototype = {
    /**
     * set the touchAction value on the element or enable the polyfill
     * @param {String} value
     */
    set: function(value) {
        // find out the touch-action by the event handlers
        if (value == TOUCH_ACTION_COMPUTE) {
            value = this.compute();
        }

        if (NATIVE_TOUCH_ACTION && this.manager.element.style && TOUCH_ACTION_MAP[value]) {
            this.manager.element.style[PREFIXED_TOUCH_ACTION] = value;
        }
        this.actions = value.toLowerCase().trim();
    },

    /**
     * just re-set the touchAction value
     */
    update: function() {
        this.set(this.manager.options.touchAction);
    },

    /**
     * compute the value for the touchAction property based on the recognizer's settings
     * @returns {String} value
     */
    compute: function() {
        var actions = [];
        each(this.manager.recognizers, function(recognizer) {
            if (boolOrFn(recognizer.options.enable, [recognizer])) {
                actions = actions.concat(recognizer.getTouchAction());
            }
        });
        return cleanTouchActions(actions.join(' '));
    },

    /**
     * this method is called on each input cycle and provides the preventing of the browser behavior
     * @param {Object} input
     */
    preventDefaults: function(input) {
        var srcEvent = input.srcEvent;
        var direction = input.offsetDirection;

        // if the touch action did prevented once this session
        if (this.manager.session.prevented) {
            srcEvent.preventDefault();
            return;
        }

        var actions = this.actions;
        var hasNone = inStr(actions, TOUCH_ACTION_NONE) && !TOUCH_ACTION_MAP[TOUCH_ACTION_NONE];
        var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_Y];
        var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_X];

        if (hasNone) {
            //do not prevent defaults if this is a tap gesture

            var isTapPointer = input.pointers.length === 1;
            var isTapMovement = input.distance < 2;
            var isTapTouchTime = input.deltaTime < 250;

            if (isTapPointer && isTapMovement && isTapTouchTime) {
                return;
            }
        }

        if (hasPanX && hasPanY) {
            // `pan-x pan-y` means browser handles all scrolling/panning, do not prevent
            return;
        }

        if (hasNone ||
            (hasPanY && direction & DIRECTION_HORIZONTAL) ||
            (hasPanX && direction & DIRECTION_VERTICAL)) {
            return this.preventSrc(srcEvent);
        }
    },

    /**
     * call preventDefault to prevent the browser's default behavior (scrolling in most cases)
     * @param {Object} srcEvent
     */
    preventSrc: function(srcEvent) {
        this.manager.session.prevented = true;
        srcEvent.preventDefault();
    }
};

/**
 * when the touchActions are collected they are not a valid value, so we need to clean things up. *
 * @param {String} actions
 * @returns {*}
 */
function cleanTouchActions(actions) {
    // none
    if (inStr(actions, TOUCH_ACTION_NONE)) {
        return TOUCH_ACTION_NONE;
    }

    var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);
    var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);

    // if both pan-x and pan-y are set (different recognizers
    // for different directions, e.g. horizontal pan but vertical swipe?)
    // we need none (as otherwise with pan-x pan-y combined none of these
    // recognizers will work, since the browser would handle all panning
    if (hasPanX && hasPanY) {
        return TOUCH_ACTION_NONE;
    }

    // pan-x OR pan-y
    if (hasPanX || hasPanY) {
        return hasPanX ? TOUCH_ACTION_PAN_X : TOUCH_ACTION_PAN_Y;
    }

    // manipulation
    if (inStr(actions, TOUCH_ACTION_MANIPULATION)) {
        return TOUCH_ACTION_MANIPULATION;
    }

    return TOUCH_ACTION_AUTO;
}

function getTouchActionProps() {
    if (!NATIVE_TOUCH_ACTION) {
        return false;
    }
    var touchMap = {};
    var cssSupports = window.CSS && window.CSS.supports;
    ['auto', 'manipulation', 'pan-y', 'pan-x', 'pan-x pan-y', 'none'].forEach(function(val) {

        // If css.supports is not supported but there is native touch-action assume it supports
        // all values. This is the case for IE 10 and 11.
        touchMap[val] = cssSupports ? window.CSS.supports('touch-action', val) : true;
    });
    return touchMap;
}

/**
 * Recognizer flow explained; *
 * All recognizers have the initial state of POSSIBLE when a input session starts.
 * The definition of a input session is from the first input until the last input, with all it's movement in it. *
 * Example session for mouse-input: mousedown -> mousemove -> mouseup
 *
 * On each recognizing cycle (see Manager.recognize) the .recognize() method is executed
 * which determines with state it should be.
 *
 * If the recognizer has the state FAILED, CANCELLED or RECOGNIZED (equals ENDED), it is reset to
 * POSSIBLE to give it another change on the next cycle.
 *
 *               Possible
 *                  |
 *            +-----+---------------+
 *            |                     |
 *      +-----+-----+               |
 *      |           |               |
 *   Failed      Cancelled          |
 *                          +-------+------+
 *                          |              |
 *                      Recognized       Began
 *                                         |
 *                                      Changed
 *                                         |
 *                                  Ended/Recognized
 */
var STATE_POSSIBLE = 1;
var STATE_BEGAN = 2;
var STATE_CHANGED = 4;
var STATE_ENDED = 8;
var STATE_RECOGNIZED = STATE_ENDED;
var STATE_CANCELLED = 16;
var STATE_FAILED = 32;

/**
 * Recognizer
 * Every recognizer needs to extend from this class.
 * @constructor
 * @param {Object} options
 */
function Recognizer(options) {
    this.options = assign({}, this.defaults, options || {});

    this.id = uniqueId();

    this.manager = null;

    // default is enable true
    this.options.enable = ifUndefined(this.options.enable, true);

    this.state = STATE_POSSIBLE;

    this.simultaneous = {};
    this.requireFail = [];
}

Recognizer.prototype = {
    /**
     * @virtual
     * @type {Object}
     */
    defaults: {},

    /**
     * set options
     * @param {Object} options
     * @return {Recognizer}
     */
    set: function(options) {
        assign(this.options, options);

        // also update the touchAction, in case something changed about the directions/enabled state
        this.manager && this.manager.touchAction.update();
        return this;
    },

    /**
     * recognize simultaneous with an other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    recognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'recognizeWith', this)) {
            return this;
        }

        var simultaneous = this.simultaneous;
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        if (!simultaneous[otherRecognizer.id]) {
            simultaneous[otherRecognizer.id] = otherRecognizer;
            otherRecognizer.recognizeWith(this);
        }
        return this;
    },

    /**
     * drop the simultaneous link. it doesnt remove the link on the other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    dropRecognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'dropRecognizeWith', this)) {
            return this;
        }

        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        delete this.simultaneous[otherRecognizer.id];
        return this;
    },

    /**
     * recognizer can only run when an other is failing
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    requireFailure: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'requireFailure', this)) {
            return this;
        }

        var requireFail = this.requireFail;
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        if (inArray(requireFail, otherRecognizer) === -1) {
            requireFail.push(otherRecognizer);
            otherRecognizer.requireFailure(this);
        }
        return this;
    },

    /**
     * drop the requireFailure link. it does not remove the link on the other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    dropRequireFailure: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'dropRequireFailure', this)) {
            return this;
        }

        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        var index = inArray(this.requireFail, otherRecognizer);
        if (index > -1) {
            this.requireFail.splice(index, 1);
        }
        return this;
    },

    /**
     * has require failures boolean
     * @returns {boolean}
     */
    hasRequireFailures: function() {
        return this.requireFail.length > 0;
    },

    /**
     * if the recognizer can recognize simultaneous with an other recognizer
     * @param {Recognizer} otherRecognizer
     * @returns {Boolean}
     */
    canRecognizeWith: function(otherRecognizer) {
        return !!this.simultaneous[otherRecognizer.id];
    },

    /**
     * You should use `tryEmit` instead of `emit` directly to check
     * that all the needed recognizers has failed before emitting.
     * @param {Object} input
     */
    emit: function(input) {
        var self = this;
        var state = this.state;

        function emit(event) {
            self.manager.emit(event, input);
        }

        // 'panstart' and 'panmove'
        if (state < STATE_ENDED) {
            emit(self.options.event + stateStr(state));
        }

        emit(self.options.event); // simple 'eventName' events

        if (input.additionalEvent) { // additional event(panleft, panright, pinchin, pinchout...)
            emit(input.additionalEvent);
        }

        // panend and pancancel
        if (state >= STATE_ENDED) {
            emit(self.options.event + stateStr(state));
        }
    },

    /**
     * Check that all the require failure recognizers has failed,
     * if true, it emits a gesture event,
     * otherwise, setup the state to FAILED.
     * @param {Object} input
     */
    tryEmit: function(input) {
        if (this.canEmit()) {
            return this.emit(input);
        }
        // it's failing anyway
        this.state = STATE_FAILED;
    },

    /**
     * can we emit?
     * @returns {boolean}
     */
    canEmit: function() {
        var i = 0;
        while (i < this.requireFail.length) {
            if (!(this.requireFail[i].state & (STATE_FAILED | STATE_POSSIBLE))) {
                return false;
            }
            i++;
        }
        return true;
    },

    /**
     * update the recognizer
     * @param {Object} inputData
     */
    recognize: function(inputData) {
        // make a new copy of the inputData
        // so we can change the inputData without messing up the other recognizers
        var inputDataClone = assign({}, inputData);

        // is is enabled and allow recognizing?
        if (!boolOrFn(this.options.enable, [this, inputDataClone])) {
            this.reset();
            this.state = STATE_FAILED;
            return;
        }

        // reset when we've reached the end
        if (this.state & (STATE_RECOGNIZED | STATE_CANCELLED | STATE_FAILED)) {
            this.state = STATE_POSSIBLE;
        }

        this.state = this.process(inputDataClone);

        // the recognizer has recognized a gesture
        // so trigger an event
        if (this.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED | STATE_CANCELLED)) {
            this.tryEmit(inputDataClone);
        }
    },

    /**
     * return the state of the recognizer
     * the actual recognizing happens in this method
     * @virtual
     * @param {Object} inputData
     * @returns {Const} STATE
     */
    process: function(inputData) { }, // jshint ignore:line

    /**
     * return the preferred touch-action
     * @virtual
     * @returns {Array}
     */
    getTouchAction: function() { },

    /**
     * called when the gesture isn't allowed to recognize
     * like when another is being recognized or it is disabled
     * @virtual
     */
    reset: function() { }
};

/**
 * get a usable string, used as event postfix
 * @param {Const} state
 * @returns {String} state
 */
function stateStr(state) {
    if (state & STATE_CANCELLED) {
        return 'cancel';
    } else if (state & STATE_ENDED) {
        return 'end';
    } else if (state & STATE_CHANGED) {
        return 'move';
    } else if (state & STATE_BEGAN) {
        return 'start';
    }
    return '';
}

/**
 * direction cons to string
 * @param {Const} direction
 * @returns {String}
 */
function directionStr(direction) {
    if (direction == DIRECTION_DOWN) {
        return 'down';
    } else if (direction == DIRECTION_UP) {
        return 'up';
    } else if (direction == DIRECTION_LEFT) {
        return 'left';
    } else if (direction == DIRECTION_RIGHT) {
        return 'right';
    }
    return '';
}

/**
 * get a recognizer by name if it is bound to a manager
 * @param {Recognizer|String} otherRecognizer
 * @param {Recognizer} recognizer
 * @returns {Recognizer}
 */
function getRecognizerByNameIfManager(otherRecognizer, recognizer) {
    var manager = recognizer.manager;
    if (manager) {
        return manager.get(otherRecognizer);
    }
    return otherRecognizer;
}

/**
 * This recognizer is just used as a base for the simple attribute recognizers.
 * @constructor
 * @extends Recognizer
 */
function AttrRecognizer() {
    Recognizer.apply(this, arguments);
}

inherit(AttrRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof AttrRecognizer
     */
    defaults: {
        /**
         * @type {Number}
         * @default 1
         */
        pointers: 1
    },

    /**
     * Used to check if it the recognizer receives valid input, like input.distance > 10.
     * @memberof AttrRecognizer
     * @param {Object} input
     * @returns {Boolean} recognized
     */
    attrTest: function(input) {
        var optionPointers = this.options.pointers;
        return optionPointers === 0 || input.pointers.length === optionPointers;
    },

    /**
     * Process the input and return the state for the recognizer
     * @memberof AttrRecognizer
     * @param {Object} input
     * @returns {*} State
     */
    process: function(input) {
        var state = this.state;
        var eventType = input.eventType;

        var isRecognized = state & (STATE_BEGAN | STATE_CHANGED);
        var isValid = this.attrTest(input);

        // on cancel input and we've recognized before, return STATE_CANCELLED
        if (isRecognized && (eventType & INPUT_CANCEL || !isValid)) {
            return state | STATE_CANCELLED;
        } else if (isRecognized || isValid) {
            if (eventType & INPUT_END) {
                return state | STATE_ENDED;
            } else if (!(state & STATE_BEGAN)) {
                return STATE_BEGAN;
            }
            return state | STATE_CHANGED;
        }
        return STATE_FAILED;
    }
});

/**
 * Pan
 * Recognized when the pointer is down and moved in the allowed direction.
 * @constructor
 * @extends AttrRecognizer
 */
function PanRecognizer() {
    AttrRecognizer.apply(this, arguments);

    this.pX = null;
    this.pY = null;
}

inherit(PanRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof PanRecognizer
     */
    defaults: {
        event: 'pan',
        threshold: 10,
        pointers: 1,
        direction: DIRECTION_ALL
    },

    getTouchAction: function() {
        var direction = this.options.direction;
        var actions = [];
        if (direction & DIRECTION_HORIZONTAL) {
            actions.push(TOUCH_ACTION_PAN_Y);
        }
        if (direction & DIRECTION_VERTICAL) {
            actions.push(TOUCH_ACTION_PAN_X);
        }
        return actions;
    },

    directionTest: function(input) {
        var options = this.options;
        var hasMoved = true;
        var distance = input.distance;
        var direction = input.direction;
        var x = input.deltaX;
        var y = input.deltaY;

        // lock to axis?
        if (!(direction & options.direction)) {
            if (options.direction & DIRECTION_HORIZONTAL) {
                direction = (x === 0) ? DIRECTION_NONE : (x < 0) ? DIRECTION_LEFT : DIRECTION_RIGHT;
                hasMoved = x != this.pX;
                distance = Math.abs(input.deltaX);
            } else {
                direction = (y === 0) ? DIRECTION_NONE : (y < 0) ? DIRECTION_UP : DIRECTION_DOWN;
                hasMoved = y != this.pY;
                distance = Math.abs(input.deltaY);
            }
        }
        input.direction = direction;
        return hasMoved && distance > options.threshold && direction & options.direction;
    },

    attrTest: function(input) {
        return AttrRecognizer.prototype.attrTest.call(this, input) &&
            (this.state & STATE_BEGAN || (!(this.state & STATE_BEGAN) && this.directionTest(input)));
    },

    emit: function(input) {

        this.pX = input.deltaX;
        this.pY = input.deltaY;

        var direction = directionStr(input.direction);

        if (direction) {
            input.additionalEvent = this.options.event + direction;
        }
        this._super.emit.call(this, input);
    }
});

/**
 * Pinch
 * Recognized when two or more pointers are moving toward (zoom-in) or away from each other (zoom-out).
 * @constructor
 * @extends AttrRecognizer
 */
function PinchRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(PinchRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof PinchRecognizer
     */
    defaults: {
        event: 'pinch',
        threshold: 0,
        pointers: 2
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
    },

    attrTest: function(input) {
        return this._super.attrTest.call(this, input) &&
            (Math.abs(input.scale - 1) > this.options.threshold || this.state & STATE_BEGAN);
    },

    emit: function(input) {
        if (input.scale !== 1) {
            var inOut = input.scale < 1 ? 'in' : 'out';
            input.additionalEvent = this.options.event + inOut;
        }
        this._super.emit.call(this, input);
    }
});

/**
 * Press
 * Recognized when the pointer is down for x ms without any movement.
 * @constructor
 * @extends Recognizer
 */
function PressRecognizer() {
    Recognizer.apply(this, arguments);

    this._timer = null;
    this._input = null;
}

inherit(PressRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof PressRecognizer
     */
    defaults: {
        event: 'press',
        pointers: 1,
        time: 251, // minimal time of the pointer to be pressed
        threshold: 9 // a minimal movement is ok, but keep it low
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_AUTO];
    },

    process: function(input) {
        var options = this.options;
        var validPointers = input.pointers.length === options.pointers;
        var validMovement = input.distance < options.threshold;
        var validTime = input.deltaTime > options.time;

        this._input = input;

        // we only allow little movement
        // and we've reached an end event, so a tap is possible
        if (!validMovement || !validPointers || (input.eventType & (INPUT_END | INPUT_CANCEL) && !validTime)) {
            this.reset();
        } else if (input.eventType & INPUT_START) {
            this.reset();
            this._timer = setTimeoutContext(function() {
                this.state = STATE_RECOGNIZED;
                this.tryEmit();
            }, options.time, this);
        } else if (input.eventType & INPUT_END) {
            return STATE_RECOGNIZED;
        }
        return STATE_FAILED;
    },

    reset: function() {
        clearTimeout(this._timer);
    },

    emit: function(input) {
        if (this.state !== STATE_RECOGNIZED) {
            return;
        }

        if (input && (input.eventType & INPUT_END)) {
            this.manager.emit(this.options.event + 'up', input);
        } else {
            this._input.timeStamp = now();
            this.manager.emit(this.options.event, this._input);
        }
    }
});

/**
 * Rotate
 * Recognized when two or more pointer are moving in a circular motion.
 * @constructor
 * @extends AttrRecognizer
 */
function RotateRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(RotateRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof RotateRecognizer
     */
    defaults: {
        event: 'rotate',
        threshold: 0,
        pointers: 2
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
    },

    attrTest: function(input) {
        return this._super.attrTest.call(this, input) &&
            (Math.abs(input.rotation) > this.options.threshold || this.state & STATE_BEGAN);
    }
});

/**
 * Swipe
 * Recognized when the pointer is moving fast (velocity), with enough distance in the allowed direction.
 * @constructor
 * @extends AttrRecognizer
 */
function SwipeRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(SwipeRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof SwipeRecognizer
     */
    defaults: {
        event: 'swipe',
        threshold: 10,
        velocity: 0.3,
        direction: DIRECTION_HORIZONTAL | DIRECTION_VERTICAL,
        pointers: 1
    },

    getTouchAction: function() {
        return PanRecognizer.prototype.getTouchAction.call(this);
    },

    attrTest: function(input) {
        var direction = this.options.direction;
        var velocity;

        if (direction & (DIRECTION_HORIZONTAL | DIRECTION_VERTICAL)) {
            velocity = input.overallVelocity;
        } else if (direction & DIRECTION_HORIZONTAL) {
            velocity = input.overallVelocityX;
        } else if (direction & DIRECTION_VERTICAL) {
            velocity = input.overallVelocityY;
        }

        return this._super.attrTest.call(this, input) &&
            direction & input.offsetDirection &&
            input.distance > this.options.threshold &&
            input.maxPointers == this.options.pointers &&
            abs(velocity) > this.options.velocity && input.eventType & INPUT_END;
    },

    emit: function(input) {
        var direction = directionStr(input.offsetDirection);
        if (direction) {
            this.manager.emit(this.options.event + direction, input);
        }

        this.manager.emit(this.options.event, input);
    }
});

/**
 * A tap is ecognized when the pointer is doing a small tap/click. Multiple taps are recognized if they occur
 * between the given interval and position. The delay option can be used to recognize multi-taps without firing
 * a single tap.
 *
 * The eventData from the emitted event contains the property `tapCount`, which contains the amount of
 * multi-taps being recognized.
 * @constructor
 * @extends Recognizer
 */
function TapRecognizer() {
    Recognizer.apply(this, arguments);

    // previous time and center,
    // used for tap counting
    this.pTime = false;
    this.pCenter = false;

    this._timer = null;
    this._input = null;
    this.count = 0;
}

inherit(TapRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof PinchRecognizer
     */
    defaults: {
        event: 'tap',
        pointers: 1,
        taps: 1,
        interval: 300, // max time between the multi-tap taps
        time: 250, // max time of the pointer to be down (like finger on the screen)
        threshold: 9, // a minimal movement is ok, but keep it low
        posThreshold: 10 // a multi-tap can be a bit off the initial position
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_MANIPULATION];
    },

    process: function(input) {
        var options = this.options;

        var validPointers = input.pointers.length === options.pointers;
        var validMovement = input.distance < options.threshold;
        var validTouchTime = input.deltaTime < options.time;

        this.reset();

        if ((input.eventType & INPUT_START) && (this.count === 0)) {
            return this.failTimeout();
        }

        // we only allow little movement
        // and we've reached an end event, so a tap is possible
        if (validMovement && validTouchTime && validPointers) {
            if (input.eventType != INPUT_END) {
                return this.failTimeout();
            }

            var validInterval = this.pTime ? (input.timeStamp - this.pTime < options.interval) : true;
            var validMultiTap = !this.pCenter || getDistance(this.pCenter, input.center) < options.posThreshold;

            this.pTime = input.timeStamp;
            this.pCenter = input.center;

            if (!validMultiTap || !validInterval) {
                this.count = 1;
            } else {
                this.count += 1;
            }

            this._input = input;

            // if tap count matches we have recognized it,
            // else it has began recognizing...
            var tapCount = this.count % options.taps;
            if (tapCount === 0) {
                // no failing requirements, immediately trigger the tap event
                // or wait as long as the multitap interval to trigger
                if (!this.hasRequireFailures()) {
                    return STATE_RECOGNIZED;
                } else {
                    this._timer = setTimeoutContext(function() {
                        this.state = STATE_RECOGNIZED;
                        this.tryEmit();
                    }, options.interval, this);
                    return STATE_BEGAN;
                }
            }
        }
        return STATE_FAILED;
    },

    failTimeout: function() {
        this._timer = setTimeoutContext(function() {
            this.state = STATE_FAILED;
        }, this.options.interval, this);
        return STATE_FAILED;
    },

    reset: function() {
        clearTimeout(this._timer);
    },

    emit: function() {
        if (this.state == STATE_RECOGNIZED) {
            this._input.tapCount = this.count;
            this.manager.emit(this.options.event, this._input);
        }
    }
});

/**
 * Simple way to create a manager with a default set of recognizers.
 * @param {HTMLElement} element
 * @param {Object} [options]
 * @constructor
 */
function Hammer(element, options) {
    options = options || {};
    options.recognizers = ifUndefined(options.recognizers, Hammer.defaults.preset);
    return new Manager(element, options);
}

/**
 * @const {string}
 */
Hammer.VERSION = '2.0.7';

/**
 * default settings
 * @namespace
 */
Hammer.defaults = {
    /**
     * set if DOM events are being triggered.
     * But this is slower and unused by simple implementations, so disabled by default.
     * @type {Boolean}
     * @default false
     */
    domEvents: false,

    /**
     * The value for the touchAction property/fallback.
     * When set to `compute` it will magically set the correct value based on the added recognizers.
     * @type {String}
     * @default compute
     */
    touchAction: TOUCH_ACTION_COMPUTE,

    /**
     * @type {Boolean}
     * @default true
     */
    enable: true,

    /**
     * EXPERIMENTAL FEATURE -- can be removed/changed
     * Change the parent input target element.
     * If Null, then it is being set the to main element.
     * @type {Null|EventTarget}
     * @default null
     */
    inputTarget: null,

    /**
     * force an input class
     * @type {Null|Function}
     * @default null
     */
    inputClass: null,

    /**
     * Default recognizer setup when calling `Hammer()`
     * When creating a new Manager these will be skipped.
     * @type {Array}
     */
    preset: [
        // RecognizerClass, options, [recognizeWith, ...], [requireFailure, ...]
        [RotateRecognizer, {enable: false}],
        [PinchRecognizer, {enable: false}, ['rotate']],
        [SwipeRecognizer, {direction: DIRECTION_HORIZONTAL}],
        [PanRecognizer, {direction: DIRECTION_HORIZONTAL}, ['swipe']],
        [TapRecognizer],
        [TapRecognizer, {event: 'doubletap', taps: 2}, ['tap']],
        [PressRecognizer]
    ],

    /**
     * Some CSS properties can be used to improve the working of Hammer.
     * Add them to this method and they will be set when creating a new Manager.
     * @namespace
     */
    cssProps: {
        /**
         * Disables text selection to improve the dragging gesture. Mainly for desktop browsers.
         * @type {String}
         * @default 'none'
         */
        userSelect: 'none',

        /**
         * Disable the Windows Phone grippers when pressing an element.
         * @type {String}
         * @default 'none'
         */
        touchSelect: 'none',

        /**
         * Disables the default callout shown when you touch and hold a touch target.
         * On iOS, when you touch and hold a touch target such as a link, Safari displays
         * a callout containing information about the link. This property allows you to disable that callout.
         * @type {String}
         * @default 'none'
         */
        touchCallout: 'none',

        /**
         * Specifies whether zooming is enabled. Used by IE10>
         * @type {String}
         * @default 'none'
         */
        contentZooming: 'none',

        /**
         * Specifies that an entire element should be draggable instead of its contents. Mainly for desktop browsers.
         * @type {String}
         * @default 'none'
         */
        userDrag: 'none',

        /**
         * Overrides the highlight color shown when the user taps a link or a JavaScript
         * clickable element in iOS. This property obeys the alpha value, if specified.
         * @type {String}
         * @default 'rgba(0,0,0,0)'
         */
        tapHighlightColor: 'rgba(0,0,0,0)'
    }
};

var STOP = 1;
var FORCED_STOP = 2;

/**
 * Manager
 * @param {HTMLElement} element
 * @param {Object} [options]
 * @constructor
 */
function Manager(element, options) {
    this.options = assign({}, Hammer.defaults, options || {});

    this.options.inputTarget = this.options.inputTarget || element;

    this.handlers = {};
    this.session = {};
    this.recognizers = [];
    this.oldCssProps = {};

    this.element = element;
    this.input = createInputInstance(this);
    this.touchAction = new TouchAction(this, this.options.touchAction);

    toggleCssProps(this, true);

    each(this.options.recognizers, function(item) {
        var recognizer = this.add(new (item[0])(item[1]));
        item[2] && recognizer.recognizeWith(item[2]);
        item[3] && recognizer.requireFailure(item[3]);
    }, this);
}

Manager.prototype = {
    /**
     * set options
     * @param {Object} options
     * @returns {Manager}
     */
    set: function(options) {
        assign(this.options, options);

        // Options that need a little more setup
        if (options.touchAction) {
            this.touchAction.update();
        }
        if (options.inputTarget) {
            // Clean up existing event listeners and reinitialize
            this.input.destroy();
            this.input.target = options.inputTarget;
            this.input.init();
        }
        return this;
    },

    /**
     * stop recognizing for this session.
     * This session will be discarded, when a new [input]start event is fired.
     * When forced, the recognizer cycle is stopped immediately.
     * @param {Boolean} [force]
     */
    stop: function(force) {
        this.session.stopped = force ? FORCED_STOP : STOP;
    },

    /**
     * run the recognizers!
     * called by the inputHandler function on every movement of the pointers (touches)
     * it walks through all the recognizers and tries to detect the gesture that is being made
     * @param {Object} inputData
     */
    recognize: function(inputData) {
        var session = this.session;
        if (session.stopped) {
            return;
        }

        // run the touch-action polyfill
        this.touchAction.preventDefaults(inputData);

        var recognizer;
        var recognizers = this.recognizers;

        // this holds the recognizer that is being recognized.
        // so the recognizer's state needs to be BEGAN, CHANGED, ENDED or RECOGNIZED
        // if no recognizer is detecting a thing, it is set to `null`
        var curRecognizer = session.curRecognizer;

        // reset when the last recognizer is recognized
        // or when we're in a new session
        if (!curRecognizer || (curRecognizer && curRecognizer.state & STATE_RECOGNIZED)) {
            curRecognizer = session.curRecognizer = null;
        }

        var i = 0;
        while (i < recognizers.length) {
            recognizer = recognizers[i];

            // find out if we are allowed try to recognize the input for this one.
            // 1.   allow if the session is NOT forced stopped (see the .stop() method)
            // 2.   allow if we still haven't recognized a gesture in this session, or the this recognizer is the one
            //      that is being recognized.
            // 3.   allow if the recognizer is allowed to run simultaneous with the current recognized recognizer.
            //      this can be setup with the `recognizeWith()` method on the recognizer.
            if (session.stopped !== FORCED_STOP && ( // 1
                    !curRecognizer || recognizer == curRecognizer || // 2
                    recognizer.canRecognizeWith(curRecognizer))) { // 3
                recognizer.recognize(inputData);
            } else {
                recognizer.reset();
            }

            // if the recognizer has been recognizing the input as a valid gesture, we want to store this one as the
            // current active recognizer. but only if we don't already have an active recognizer
            if (!curRecognizer && recognizer.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED)) {
                curRecognizer = session.curRecognizer = recognizer;
            }
            i++;
        }
    },

    /**
     * get a recognizer by its event name.
     * @param {Recognizer|String} recognizer
     * @returns {Recognizer|Null}
     */
    get: function(recognizer) {
        if (recognizer instanceof Recognizer) {
            return recognizer;
        }

        var recognizers = this.recognizers;
        for (var i = 0; i < recognizers.length; i++) {
            if (recognizers[i].options.event == recognizer) {
                return recognizers[i];
            }
        }
        return null;
    },

    /**
     * add a recognizer to the manager
     * existing recognizers with the same event name will be removed
     * @param {Recognizer} recognizer
     * @returns {Recognizer|Manager}
     */
    add: function(recognizer) {
        if (invokeArrayArg(recognizer, 'add', this)) {
            return this;
        }

        // remove existing
        var existing = this.get(recognizer.options.event);
        if (existing) {
            this.remove(existing);
        }

        this.recognizers.push(recognizer);
        recognizer.manager = this;

        this.touchAction.update();
        return recognizer;
    },

    /**
     * remove a recognizer by name or instance
     * @param {Recognizer|String} recognizer
     * @returns {Manager}
     */
    remove: function(recognizer) {
        if (invokeArrayArg(recognizer, 'remove', this)) {
            return this;
        }

        recognizer = this.get(recognizer);

        // let's make sure this recognizer exists
        if (recognizer) {
            var recognizers = this.recognizers;
            var index = inArray(recognizers, recognizer);

            if (index !== -1) {
                recognizers.splice(index, 1);
                this.touchAction.update();
            }
        }

        return this;
    },

    /**
     * bind event
     * @param {String} events
     * @param {Function} handler
     * @returns {EventEmitter} this
     */
    on: function(events, handler) {
        if (events === undefined) {
            return;
        }
        if (handler === undefined) {
            return;
        }

        var handlers = this.handlers;
        each(splitStr(events), function(event) {
            handlers[event] = handlers[event] || [];
            handlers[event].push(handler);
        });
        return this;
    },

    /**
     * unbind event, leave emit blank to remove all handlers
     * @param {String} events
     * @param {Function} [handler]
     * @returns {EventEmitter} this
     */
    off: function(events, handler) {
        if (events === undefined) {
            return;
        }

        var handlers = this.handlers;
        each(splitStr(events), function(event) {
            if (!handler) {
                delete handlers[event];
            } else {
                handlers[event] && handlers[event].splice(inArray(handlers[event], handler), 1);
            }
        });
        return this;
    },

    /**
     * emit event to the listeners
     * @param {String} event
     * @param {Object} data
     */
    emit: function(event, data) {
        // we also want to trigger dom events
        if (this.options.domEvents) {
            triggerDomEvent(event, data);
        }

        // no handlers, so skip it all
        var handlers = this.handlers[event] && this.handlers[event].slice();
        if (!handlers || !handlers.length) {
            return;
        }

        data.type = event;
        data.preventDefault = function() {
            data.srcEvent.preventDefault();
        };

        var i = 0;
        while (i < handlers.length) {
            handlers[i](data);
            i++;
        }
    },

    /**
     * destroy the manager and unbinds all events
     * it doesn't unbind dom events, that is the user own responsibility
     */
    destroy: function() {
        this.element && toggleCssProps(this, false);

        this.handlers = {};
        this.session = {};
        this.input.destroy();
        this.element = null;
    }
};

/**
 * add/remove the css properties as defined in manager.options.cssProps
 * @param {Manager} manager
 * @param {Boolean} add
 */
function toggleCssProps(manager, add) {
    var element = manager.element;
    if (!element.style) {
        return;
    }
    var prop;
    each(manager.options.cssProps, function(value, name) {
        prop = prefixed(element.style, name);
        if (add) {
            manager.oldCssProps[prop] = element.style[prop];
            element.style[prop] = value;
        } else {
            element.style[prop] = manager.oldCssProps[prop] || '';
        }
    });
    if (!add) {
        manager.oldCssProps = {};
    }
}

/**
 * trigger dom event
 * @param {String} event
 * @param {Object} data
 */
function triggerDomEvent(event, data) {
    var gestureEvent = document.createEvent('Event');
    gestureEvent.initEvent(event, true, true);
    gestureEvent.gesture = data;
    data.target.dispatchEvent(gestureEvent);
}

assign(Hammer, {
    INPUT_START: INPUT_START,
    INPUT_MOVE: INPUT_MOVE,
    INPUT_END: INPUT_END,
    INPUT_CANCEL: INPUT_CANCEL,

    STATE_POSSIBLE: STATE_POSSIBLE,
    STATE_BEGAN: STATE_BEGAN,
    STATE_CHANGED: STATE_CHANGED,
    STATE_ENDED: STATE_ENDED,
    STATE_RECOGNIZED: STATE_RECOGNIZED,
    STATE_CANCELLED: STATE_CANCELLED,
    STATE_FAILED: STATE_FAILED,

    DIRECTION_NONE: DIRECTION_NONE,
    DIRECTION_LEFT: DIRECTION_LEFT,
    DIRECTION_RIGHT: DIRECTION_RIGHT,
    DIRECTION_UP: DIRECTION_UP,
    DIRECTION_DOWN: DIRECTION_DOWN,
    DIRECTION_HORIZONTAL: DIRECTION_HORIZONTAL,
    DIRECTION_VERTICAL: DIRECTION_VERTICAL,
    DIRECTION_ALL: DIRECTION_ALL,

    Manager: Manager,
    Input: Input,
    TouchAction: TouchAction,

    TouchInput: TouchInput,
    MouseInput: MouseInput,
    PointerEventInput: PointerEventInput,
    TouchMouseInput: TouchMouseInput,
    SingleTouchInput: SingleTouchInput,

    Recognizer: Recognizer,
    AttrRecognizer: AttrRecognizer,
    Tap: TapRecognizer,
    Pan: PanRecognizer,
    Swipe: SwipeRecognizer,
    Pinch: PinchRecognizer,
    Rotate: RotateRecognizer,
    Press: PressRecognizer,

    on: addEventListeners,
    off: removeEventListeners,
    each: each,
    merge: merge,
    extend: extend,
    assign: assign,
    inherit: inherit,
    bindFn: bindFn,
    prefixed: prefixed
});

// this prevents errors when Hammer is loaded in the presence of an AMD
//  style loader but by script tag, not by the loader.
var freeGlobal = (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {})); // jshint ignore:line
freeGlobal.Hammer = Hammer;

if (typeof define === 'function' && define.amd) {
    define(function() {
        return Hammer;
    });
} else if (typeof module != 'undefined' && module.exports) {
    module.exports = Hammer;
} else {
    window[exportName] = Hammer;
}

})(window, document, 'Hammer');

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvanMvYXBwZGF0YS5qcyIsImFwcC9qcy9ib29rZGF0YS5qcyIsImFwcC9qcy9jcm9zc2RhbnRlLmpzIiwiYXBwL2pzL2RvbS5qcyIsImFwcC9qcy90cmFuc2xhdGlvbnMvY2FybHlsZS5qcyIsImFwcC9qcy90cmFuc2xhdGlvbnMvaXRhbGlhbi5qcyIsImFwcC9qcy90cmFuc2xhdGlvbnMvbG9uZ2ZlbGxvdy5qcyIsImFwcC9qcy90cmFuc2xhdGlvbnMvbm9ydG9uLmpzIiwiYXBwL2pzL3RyYW5zbGF0aW9ucy93cmlnaHQuanMiLCJub2RlX21vZHVsZXMvZmFzdGNsaWNrL2xpYi9mYXN0Y2xpY2suanMiLCJub2RlX21vZHVsZXMvaGFtbWVyanMvaGFtbWVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdGZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3owQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gYXBwZGF0YS5qc1xuLy9cbi8vIGJhc2ljIGFwcGRhdGEg4oCTIHRoZXJlJ3MgYWxzbyBhIHRyYW5zbGF0aW9uZGF0YSBhcnJheSAobWV0YWRhdGEpIGFuZCB0ZXh0ZGF0YSAodGV4dHMpXG4vLyBpcyBpdCB3b3J0aCBmb2xkaW5nIHRoaXMgaW50byBhcHA/IElzIHRoZXJlIGEgdmFsdWUgaW4ga2VlcGluZyB0aGlzIHNlcGFyYXRlP1xuLy9cbi8vIHRoaXMgcHJvYmFibHkgbmVlZHMgc29tZSByZXdvcmtpbmc/XG5cbnZhciB0cmFuc2xhdGlvbmRhdGEgPSByZXF1aXJlKFwiLi9ib29rZGF0YVwiKS50cmFuc2xhdGlvbmRhdGE7XG52YXIgY2FudG90aXRsZXMgPSByZXF1aXJlKFwiLi9ib29rZGF0YVwiKS5jYW50b3RpdGxlcztcblxudmFyIGFwcGRhdGEgPSB7XG5cdGN1cnJlbnR0cmFuc2xhdGlvbmxpc3Q6IFtdLCAgICAvLyBsaXN0IG9mIGlkcyBvZiB0cmFuc2xhdGlvbnMgd2UncmUgY3VycmVudGx5IHVzaW5nXG5cdGN1cnJlbnR0cmFuc2xhdGlvbjogMCxcblx0dHJhbnNsYXRpb25jb3VudDogdHJhbnNsYXRpb25kYXRhLmxlbmd0aCxcblx0Y3VycmVudGNhbnRvOiAwLFxuXHRjYW50b2NvdW50OiBjYW50b3RpdGxlcy5sZW5ndGgsXG5cdGxpbmVoZWlnaHQ6IDI0LFxuXHRsZW5zd2lkdGg6IHdpbmRvdy5pbm5lcldpZHRoLFxuXHRsZW5zaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQgLSA0MCxcblx0d2luZG93d2lkdGg6IHdpbmRvdy5pbm5lcldpZHRoLFxuXHR3aW5kb3doZWlnaHQ6IHdpbmRvdy5pbm5lckhlaWdodCxcblx0dGV4dHdpZHRoOiB3aW5kb3cuaW5uZXJXaWR0aCxcblx0Y3VycmVudHBhZ2U6IFwibGVuc1wiLFxuXHRuaWdodG1vZGU6IGZhbHNlLFxuXHRjdXJyZW50cGVyY2VudGFnZTogMCwgLy8gdGhpcyBpcyBjdXJyZW50IHBlcmNlbnRhZ2Ugb2YgcGFnZSAobWF5YmUgdGhpcyBzaG91bGQgYmUgaW4gdGVybXMgb2YgbGluZXMgb24gcGFnZT8pXG5cdGN1cnJlbnRsaW5lczogMCAgICAgICAvLyB0aGlzIGlzIHRoZSBudW1iZXIgb2YgbGluZXMgY2FsY3VsYXRlZCB0byBiZSBvbiB0aGUgcGFnZVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBhcHBkYXRhO1xuIiwidmFyIGNhbnRvdGl0bGVzID0gW1wiVGl0bGUgcGFnZVwiLFwiQ2FudG8gMVwiLFwiQ2FudG8gMlwiLFwiQ2FudG8gM1wiXTtcblxudmFyIHRyYW5zbGF0aW9uZGF0YSA9IFtcblx0e1widHJhbnNsYXRpb25pZFwiOlwiZGFudGVcIixcblx0XHRcInRyYW5zbGF0aW9uc2hvcnRuYW1lXCI6XCJEYW50ZVwiLFxuXHRcdFwidHJhbnNsYXRpb25mdWxsbmFtZVwiOlwiRGFudGUgQWxpZ2hpZXJpXCIsXG5cdFx0XCJ0cmFuc2xhdGlvbmNsYXNzXCI6XCJwb2V0cnkgb3JpZ2luYWxcIixcblx0XHRcIm9yZGVyXCI6MH0sXG5cdHtcInRyYW5zbGF0aW9uaWRcIjpcImxvbmdmZWxsb3dcIixcblx0XHRcInRyYW5zbGF0aW9uc2hvcnRuYW1lXCI6XCJMb25nZmVsbG93XCIsXG5cdFx0XCJ0cmFuc2xhdGlvbmZ1bGxuYW1lXCI6XCJIZW5yeSBXb3Jkc3dvcnRoIExvbmdmZWxsb3dcIixcblx0XHRcInRyYW5zbGF0aW9uY2xhc3NcIjpcInBvZXRyeSBsb25nZmVsbG93XCIsXG5cdFx0XCJvcmRlclwiOjF9LFxuXHR7XCJ0cmFuc2xhdGlvbmlkXCI6XCJub3J0b25cIixcblx0XHRcInRyYW5zbGF0aW9uc2hvcnRuYW1lXCI6XCJOb3J0b25cIixcblx0XHRcInRyYW5zbGF0aW9uZnVsbG5hbWVcIjpcIkNoYXJsZXMgRWxpb3QgTm9ydG9uXCIsXG5cdFx0XCJ0cmFuc2xhdGlvbmNsYXNzXCI6XCJub3J0b24gcHJvc2VcIixcblx0XHRcIm9yZGVyXCI6Mn0sXG5cdHtcInRyYW5zbGF0aW9uaWRcIjpcIndyaWdodFwiLFxuXHRcdFwidHJhbnNsYXRpb25zaG9ydG5hbWVcIjpcIldyaWdodFwiLFxuXHRcdFwidHJhbnNsYXRpb25mdWxsbmFtZVwiOlwiUy4gRm93bGVyIFdyaWdodFwiLFxuXHRcdFwidHJhbnNsYXRpb25jbGFzc1wiOlwicG9ldHJ5IHdyaWdodFwiLFxuXHRcdFwib3JkZXJcIjozfSxcblx0e1widHJhbnNsYXRpb25pZFwiOlwiY2FybHlsZVwiLFxuXHRcdFwidHJhbnNsYXRpb25zaG9ydG5hbWVcIjpcIkNhcmx5bGVcIixcblx0XHRcInRyYW5zbGF0aW9uZnVsbG5hbWVcIjpcIkNhcmx5bGUvT2tleS9XaWtzdGVlZFwiLFxuXHRcdFwidHJhbnNsYXRpb25jbGFzc1wiOlwicHJvc2UgY2FybHlsZVwiLFxuXHRcdFwib3JkZXJcIjo0fVxuXTtcblxubW9kdWxlLmV4cG9ydHMuY2FudG90aXRsZXMgPSBjYW50b3RpdGxlcztcbm1vZHVsZS5leHBvcnRzLnRyYW5zbGF0aW9uZGF0YSA9IHRyYW5zbGF0aW9uZGF0YTtcbiIsIi8vIHZlcnNpb24gMzogbm8galF1ZXJ5LCBtb3JlIGFwcGlzaFxuXG4vL1xuLy8vLyBwb2x5ZmlsbHNcbi8vXG5cbi8vIGZvciBlYWNoLCBmcm9tIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2ZvckVhY2hcblxuaWYgKCFBcnJheS5wcm90b3R5cGUuZm9yRWFjaCkge1xuXHRBcnJheS5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG5cdFx0dmFyIFQsIGs7XG5cdFx0aWYgKHRoaXMgPT09IG51bGwpIHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJyB0aGlzIGlzIG51bGwgb3Igbm90IGRlZmluZWQnKTtcblx0XHR9XG5cdFx0dmFyIE8gPSBPYmplY3QodGhpcyk7XG5cdFx0dmFyIGxlbiA9IE8ubGVuZ3RoID4+PiAwO1xuXHRcdGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcihjYWxsYmFjayArICcgaXMgbm90IGEgZnVuY3Rpb24nKTtcblx0XHR9XG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG5cdFx0XHRUID0gdGhpc0FyZztcblx0XHR9XG5cdFx0ayA9IDA7XG5cdFx0d2hpbGUgKGsgPCBsZW4pIHtcblx0XHRcdHZhciBrVmFsdWU7XG5cdFx0XHRpZiAoayBpbiBPKSB7XG5cdFx0XHRcdGtWYWx1ZSA9IE9ba107XG5cdFx0XHRcdGNhbGxiYWNrLmNhbGwoVCwga1ZhbHVlLCBrLCBPKTtcblx0XHRcdH1cblx0XHRcdGsrKztcblx0XHR9XG5cdH07XG59XG5cbnZhciBIYW1tZXIgPSByZXF1aXJlKFwiaGFtbWVyanNcIik7XG52YXIgRmFzdGNsaWNrID0gcmVxdWlyZShcImZhc3RjbGlja1wiKTtcdC8vIHdoeSBpcyB0aGlzIG5vdCB3b3JraW5nP1xuXG52YXIgZG9tID0gcmVxdWlyZShcIi4vZG9tXCIpO1xudmFyIHRyYW5zbGF0aW9uZGF0YSA9IHJlcXVpcmUoXCIuL2Jvb2tkYXRhXCIpLnRyYW5zbGF0aW9uZGF0YTtcbnZhciBjYW50b3RpdGxlcyA9IHJlcXVpcmUoXCIuL2Jvb2tkYXRhXCIpLmNhbnRvdGl0bGVzO1xudmFyIGFwcGRhdGEgPSByZXF1aXJlKFwiLi9hcHBkYXRhXCIpO1xuXG52YXIgdGV4dGRhdGEgPSB7fTtcbnRleHRkYXRhWzBdID0gW107XG50ZXh0ZGF0YVsxXSA9IFtdO1xudGV4dGRhdGFbMl0gPSBbXTtcbnRleHRkYXRhWzNdID0gW107XG50ZXh0ZGF0YVs0XSA9IFtdO1xuXG50ZXh0ZGF0YVswXSA9IHJlcXVpcmUoXCIuL3RyYW5zbGF0aW9ucy9pdGFsaWFuLmpzXCIpO1xudGV4dGRhdGFbMV0gPSByZXF1aXJlKFwiLi90cmFuc2xhdGlvbnMvbG9uZ2ZlbGxvdy5qc1wiKTtcbnRleHRkYXRhWzJdID0gcmVxdWlyZShcIi4vdHJhbnNsYXRpb25zL25vcnRvbi5qc1wiKTtcbnRleHRkYXRhWzNdID0gcmVxdWlyZShcIi4vdHJhbnNsYXRpb25zL3dyaWdodC5qc1wiKTtcbnRleHRkYXRhWzRdID0gcmVxdWlyZShcIi4vdHJhbnNsYXRpb25zL2Nhcmx5bGUuanNcIik7XG5cbnZhciBsZW5zID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNsZW5zXCIpO1xuXG52YXIgYXBwID0ge1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZyhcImluaXRpYWxpemluZyFcIik7XG5cdFx0dGhpcy5iaW5kRXZlbnRzKCk7XG5cbi8vIHNldCB1cCBjdXJyZW50IHRyYW5zbGF0aW9uIGxpc3QgKGluaXRpYWxseSB1c2UgYWxsIG9mIHRoZW0pXG5cblx0XHRmb3IodmFyIGkgaW4gdHJhbnNsYXRpb25kYXRhKSB7XG5cdFx0XHRhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3QucHVzaCh0cmFuc2xhdGlvbmRhdGFbaV0udHJhbnNsYXRpb25pZCk7XG5cdFx0fVxuXG4vLyBjaGVjayB0byBzZWUgaWYgdGhlcmUgYXJlIHNhdmVkIGxvY2Fsc3RvcmFnZSwgaWYgc28sIHRha2UgdGhvc2UgdmFsdWVzXG5cblx0fSxcblx0YmluZEV2ZW50czogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coXCJiaW5kaW5nIGV2ZW50cyFcIik7XG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZGV2aWNlcmVhZHknLCB0aGlzLm9uRGV2aWNlUmVhZHksIGZhbHNlKTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCB0aGlzLnJlc2l6ZSwgZmFsc2UpO1xuXG5cdFx0Ly8gc3RhcnQgZmFzdGNsaWNrXG5cblx0XHRpZiAoJ2FkZEV2ZW50TGlzdGVuZXInIGluIGRvY3VtZW50KSB7XG5cdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdEZhc3RjbGljay5hdHRhY2goZG9jdW1lbnQuYm9keSk7XG5cdFx0XHR9LCBmYWxzZSk7XG5cdFx0fVxuXHR9LFxuXHRoZWxwZXJzOiB7XG5cdFx0Z29zZXR0aW5nczogZnVuY3Rpb24oZWxlbWVudCkge1xuXHRcdFx0ZWxlbWVudC5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGFwcC5zZXRwYWdlKFwic2V0dGluZ3NcIik7XG5cdFx0XHR9O1xuXHRcdH0sXG5cdFx0c2V0dXBub3RlOiBmdW5jdGlvbihlbCkge1xuXHRcdFx0ZWwub25jbGljayA9IGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdFx0dmFyIHRoaXNub3RlID0gdGhpcy5nZXRBdHRyaWJ1dGUoXCJkYXRhLW5vdGVudW1iZXJcIik7XG5cdFx0XHRcdHZhciBub3RldGV4dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5ub3RldGV4dFtkYXRhLW5vdGVudW1iZXI9XCInK3RoaXNub3RlKydcIl0nKS5pbm5lckhUTUw7XG5cdFx0XHRcdGFwcC5oaWRlbm90ZXMoKTtcblx0XHRcdFx0dmFyIGluc2VydCA9IGRvbS5jcmVhdGUoJzxkaXYgY2xhc3M9XCJub3Rld2luZG93XCIgaWQ9XCJub3Rld2luZG93XCI+Jytub3RldGV4dCsnPC9kaXYnKTtcblx0XHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYWluXCIpLmFwcGVuZENoaWxkKGluc2VydCk7XG5cdFx0XHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibm90ZXdpbmRvd1wiKS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0YXBwLmhpZGVub3RlcygpO1xuXHRcdFx0XHR9O1xuXHRcdFx0fTtcblx0XHR9LFxuXHRcdGNoZWNrYm94Z286IGZ1bmN0aW9uKGVsKSB7XG5cdFx0XHRlbC5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGFwcC5jaGFuZ2V0cmFuc2xhdGlvbih0aGlzLmlkLnJlcGxhY2UoXCJjaGVjay1cIixcIlwiKSxkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLmlkKS5jaGVja2VkKTtcblx0XHRcdH07XG5cdFx0fSxcblx0XHRjaGVja2JveHNwYW5nbzogZnVuY3Rpb24oZWwpIHtcblx0XHRcdGVsLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaGVjay1cIit0aGlzLmlkKS5jaGVja2VkID0gIWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2hlY2stXCIrdGhpcy5pZCkuY2hlY2tlZDtcblx0XHRcdFx0YXBwLmNoYW5nZXRyYW5zbGF0aW9uKHRoaXMuaWQsZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaGVjay1cIit0aGlzLmlkKS5jaGVja2VkKTtcblx0XHRcdH07XG5cdFx0fVxuXHR9LFxuXHRzZXR1cGNvbnRyb2xzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgaGFtbWVydGltZTtcblxuXHRcdC8vIGJ1dHRvbiBjb250cm9sc1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2cHJldlwiKS5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0YXBwLnNldGxlbnMoYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb24tMSxhcHBkYXRhLmN1cnJlbnRjYW50byk7XG5cdFx0fTtcblx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hdm5leHRcIikub25jbGljayA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGFwcC5zZXRsZW5zKGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uKzEsYXBwZGF0YS5jdXJyZW50Y2FudG8pO1xuXHRcdH07XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXZ1cFwiKS5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0YXBwLnNldGxlbnMoYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb24sYXBwZGF0YS5jdXJyZW50Y2FudG8tMSwwKTtcblx0XHR9O1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2ZG93blwiKS5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0YXBwLnNldGxlbnMoYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb24sYXBwZGF0YS5jdXJyZW50Y2FudG8rMSwwKTtcblx0XHR9O1xuXHRcdC8vIGluaXRpYWwgc2V0dGluZ3NcblxuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWJvdXRsaW5rXCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdGFwcC5zZXRwYWdlKFwiYWJvdXRcIik7XG5cdFx0fTtcblx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlbHBsaW5rXCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdGFwcC5zZXRwYWdlKFwiaGVscFwiKTtcblx0XHR9O1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGF5bW9kZVwiKS5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRkb20ucmVtb3ZlY2xhc3MoXCJib2R5XCIsXCJuaWdodG1vZGVcIik7XG5cdFx0XHRkb20uYWRkY2xhc3MoXCIjbmlnaHRtb2RlXCIsXCJvZmZcIik7XG5cdFx0XHRkb20ucmVtb3ZlY2xhc3MoXCIjZGF5bW9kZVwiLFwib2ZmXCIpO1xuXHRcdFx0YXBwZGF0YS5uaWdodG1vZGUgPSBmYWxzZTtcblx0XHR9O1xuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmlnaHRtb2RlXCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdGRvbS5hZGRjbGFzcyhcImJvZHlcIixcIm5pZ2h0bW9kZVwiKTtcblx0XHRcdGRvbS5yZW1vdmVjbGFzcyhcIiNuaWdodG1vZGVcIixcIm9mZlwiKTtcblx0XHRcdGRvbS5hZGRjbGFzcyhcIiNkYXltb2RlXCIsXCJvZmZcIik7XG5cdFx0XHRhcHBkYXRhLm5pZ2h0bW9kZSA9IHRydWU7XG5cdFx0fTtcblxuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuYmFja3Rvc2V0dGluZ3NcIikuZm9yRWFjaChhcHAuaGVscGVycy5nb3NldHRpbmdzKTtcblxuXHQvLyBzd2lwZSBjb250cm9sc1xuXG5cdFx0aGFtbWVydGltZSA9IG5ldyBIYW1tZXIobGVucyk7XG5cdFx0aGFtbWVydGltZS5nZXQoJ3N3aXBlJykuc2V0KHsgZGlyZWN0aW9uOiBIYW1tZXIuRElSRUNUSU9OX0FMTCB9KTtcblx0XHRoYW1tZXJ0aW1lLm9uKCdzd2lwZWxlZnQnLGZ1bmN0aW9uKCkge1xuXHRcdFx0YXBwLnNldGxlbnMoYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb24rMSxhcHBkYXRhLmN1cnJlbnRjYW50byk7XG5cdFx0fSkub24oJ3N3aXBlcmlnaHQnLGZ1bmN0aW9uKCkge1xuXHRcdFx0YXBwLnNldGxlbnMoYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb24tMSxhcHBkYXRhLmN1cnJlbnRjYW50byk7XG5cdFx0fSk7XG5cblx0XHRoYW1tZXJ0aW1lLm9uKCdzd2lwZWRvd24nLGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHRleHRlbGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRleHRcIik7XG5cdFx0XHRpZih0ZXh0ZWxlbGVtZW50LnNjb2xsVG9wID09PSAwKSB7XG5cdFx0XHRcdGFwcC5zZXRsZW5zKGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uLGFwcGRhdGEuY3VycmVudGNhbnRvLTEsMSk7ICAvLyB0aGlzIG5lZWRzIHRvIGJlIGF0IHRoZSBib3R0b20hXG5cdFx0XHR9XG5cdFx0fSkub24oJ3N3aXBldXAnLGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHRleHRlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0ZXh0XCIpO1xuXG4vLyBpZiBkaWZmZXJlbmNlIGJldHdlZW4gY3VycmVudCBzY3JvbGwgcG9zaXRpb24gKyBoZWlnaHQgb2YgZnJhbWUgJiBjb21wbGV0ZSBoZWlnaHRcbi8vIG9mIGNvbHVtbiBpcyBsZXNzIHRoYW4gOCwgZ28gdG8gdGhlIG5leHQgb25lXG5cblx0XHRcdGlmKE1hdGguYWJzKHRleHRlbGVtZW50LnNjcm9sbFRvcCArIHRleHRlbGVtZW50LmNsaWVudEhlaWdodCAtIHRleHRlbGVtZW50LnNjcm9sbEhlaWdodCkgPCA4KSB7XG5cdFx0XHRcdGFwcC5zZXRsZW5zKGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uLGFwcGRhdGEuY3VycmVudGNhbnRvKzEpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdC8vIGtleSBjb250cm9sc1xuXG5cdFx0ZG9jdW1lbnQuYm9keS5vbmtleWRvd24gPSBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRpZigoZS5rZXlDb2RlIHx8IGUud2hpY2gpID09PSAzNykge1xuXHRcdFx0XHRkb20uYWRkY2xhc3MoXCIjbmF2cHJldlwiLFwib25cIik7XG5cdFx0XHRcdGFwcC5zZXRsZW5zKGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uLTEsYXBwZGF0YS5jdXJyZW50Y2FudG8pO1xuXHRcdFx0fVxuXHRcdFx0aWYoKGUua2V5Q29kZSB8fCBlLndoaWNoKSA9PT0gMzkpIHtcblx0XHRcdFx0ZG9tLmFkZGNsYXNzKFwiI25hdm5leHRcIixcIm9uXCIpO1xuXHRcdFx0XHRhcHAuc2V0bGVucyhhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbisxLGFwcGRhdGEuY3VycmVudGNhbnRvKTtcblx0XHRcdH1cblx0XHRcdGlmKChlLmtleUNvZGUgfHwgZS53aGljaCkgPT09IDM4KSB7XG5cdFx0XHRcdGRvbS5hZGRjbGFzcyhcIiNuYXZ1cFwiLFwib25cIik7XG5cdFx0XHRcdGFwcC5zZXRsZW5zKGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uLGFwcGRhdGEuY3VycmVudGNhbnRvLTEpO1xuXHRcdFx0fVxuXHRcdFx0aWYoKGUua2V5Q29kZSB8fCBlLndoaWNoKSA9PT0gNDApIHtcblx0XHRcdFx0ZG9tLmFkZGNsYXNzKFwiI25hdmRvd25cIixcIm9uXCIpO1xuXHRcdFx0XHRhcHAuc2V0bGVucyhhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbixhcHBkYXRhLmN1cnJlbnRjYW50bysxLDApO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0ZG9jdW1lbnQuYm9keS5vbmtleXVwID0gZnVuY3Rpb24oZSkge1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0ZG9tLnJlbW92ZWNsYXNzKFwiLmJ1dHRvblwiLFwib25cIik7XG5cdFx0fTtcblxuXHQvLyBwYWdlIGNvbnRyb2xzXG5cblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25hdnRpdGxlXCIpLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRhcHAuc2V0cGFnZShcImxlbnNcIik7XG5cdFx0fTtcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25hdnNldHRpbmdzXCIpLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRpZihhcHBkYXRhLmN1cnJlbnRwYWdlID09IFwic2V0dGluZ3NcIikge1xuLy8gICAgICBpZihhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3QuaW5kZXhPZih0cmFuc2xhdGlvbmRhdGFbYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb25dLnRyYW5zbGF0aW9uaWQpID4gLTEgKSB7fVxuXHRcdFx0XHRhcHAuc2V0cGFnZShcImxlbnNcIik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhcHAudXBkYXRlc2V0dGluZ3MoKTtcblx0XHRcdFx0YXBwLnNldHBhZ2UoXCJzZXR0aW5nc1wiKTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbWFpblwiKS5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0YXBwLmhpZGVub3RlcygpO1xuXHRcdH07XG5cdH0sXG5cdHNldHVwbm90ZXM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb3VudCA9IDA7XG5cdFx0dmFyIG5vdGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5ub3RlXCIpO1xuXG5cdFx0Zm9yKHZhciBpID0gMDsgaSA8IG5vdGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgY2hpbGRyZW4gPSBub3Rlc1tpXS5jaGlsZHJlbjtcblx0XHRcdGZvcih2YXIgaj0wOyBqIDwgY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0aWYoZG9tLmhhc2NsYXNzKGNoaWxkcmVuW2pdLFwibm90ZXRleHRcIikpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcIm5vdGV0ZXh0IFwiK2NvdW50KTtcblx0XHRcdFx0XHRjaGlsZHJlbltqXS5zZXRBdHRyaWJ1dGUoXCJkYXRhLW5vdGVudW1iZXJcIiwgY291bnQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKGRvbS5oYXNjbGFzcyhjaGlsZHJlbltqXSxcIm5vdGVub1wiKSkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwibm90ZW5vIFwiK2NvdW50KTtcblx0XHRcdFx0XHRjaGlsZHJlbltqXS5zZXRBdHRyaWJ1dGUoXCJkYXRhLW5vdGVudW1iZXJcIiwgY291bnQpO1xuXHRcdFx0XHRcdGFwcC5oZWxwZXJzLnNldHVwbm90ZShjaGlsZHJlbltqXSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGNvdW50Kys7XG5cdFx0fVxuXHR9LFxuXHRyZXNpemU6IGZ1bmN0aW9uKCkge1xuXHRcdGFwcGRhdGEud2luZG93d2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcblx0XHRhcHBkYXRhLndpbmRvd2hlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcblx0XHRjb25zb2xlLmxvZyhcIlRoZSB3aW5kb3cgaGFzIGJlZW4gcmVzaXplZCEgTmV3IHdpZHRoOiBcIiArIGFwcGRhdGEud2luZG93d2lkdGgrXCIsXCIrYXBwZGF0YS53aW5kb3doZWlnaHQpO1xuXHRcdGFwcGRhdGEubGVuc3dpZHRoID0gYXBwZGF0YS53aW5kb3d3aWR0aDtcblx0XHRhcHBkYXRhLmxlbnNoZWlnaHQgPSBhcHBkYXRhLndpbmRvd2hlaWdodCAtIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2YmFyXCIpLmNsaWVudEhlaWdodDtcblxuXHRcdGRvbS5hZGRjbGFzcyhcIi5wYWdlXCIsYXBwZGF0YS5sZW5zd2lkdGggPiBhcHBkYXRhLmxlbnNoZWlnaHQgPyBcImxhbmRzY2FwZVwiIDogXCJwb3J0cmFpdFwiKTtcblx0XHRkb20ucmVtb3ZlY2xhc3MoXCIucGFnZVwiLGFwcGRhdGEubGVuc3dpZHRoID4gYXBwZGF0YS5sZW5zaGVpZ2h0ID8gXCJwb3J0cmFpdFwiIDogXCJsYW5kc2NhcGVcIik7XG5cblx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1haW5cIikuc3R5bGUud2lkdGggPSBhcHBkYXRhLmxlbnN3aWR0aCtcInB4XCI7XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYWluXCIpLnN0eWxlLmhlaWdodCA9IGFwcGRhdGEud2luZG93aGVpZ2h0K1wicHhcIjtcblx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRlbnRcIikuc3R5bGUud2lkdGggPSBhcHBkYXRhLmxlbnN3aWR0aCtcInB4XCI7XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250ZW50XCIpLnN0eWxlLmhlaWdodCA9IGFwcGRhdGEubGVuc2hlaWdodCtcInB4XCI7XG5cblx0XHRhcHBkYXRhLmxpbmVoZWlnaHQgPSBhcHBkYXRhLndpbmRvd3dpZHRoLzI1O1xuXHRcdGFwcGRhdGEudGV4dHdpZHRoID0gYXBwZGF0YS53aW5kb3d3aWR0aDtcblx0XHRhcHAuc2V0bGVucyhhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbixhcHBkYXRhLmN1cnJlbnRjYW50byk7XG5cdH0sXG5cdHNldGxlbnM6IGZ1bmN0aW9uKG5ld3RyYW5zLCBuZXdjYW50bywgcGVyY2VudGFnZSkge1xuXHRcdGNvbnNvbGUubG9nKFwiU2V0bGVucyBjYWxsZWQgZm9yIFwiK25ld3RyYW5zICsgXCIsIGNhbnRvIFwiK25ld2NhbnRvKTtcblx0XHR2YXIgdGV4dGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRleHRcIik7XG5cdFx0dmFyIGNoYW5nZXRyYW5zID0gZmFsc2U7XG5cblx0Ly8gaWYgcGFnZSBpc24ndCBzZXQgdG8gXCJsZW5zXCIgdGhpcyBkb2Vzbid0IGRvIGFueXRoaW5nXG5cblx0XHRpZihhcHBkYXRhLmN1cnJlbnRwYWdlID09IFwibGVuc1wiKSB7XG5cdFx0XHRpZihuZXd0cmFucyAtIGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uICE9PSAwKSB7XG5cdFx0XHRcdGNoYW5nZXRyYW5zID0gdHJ1ZTtcblx0XHRcdFx0cGVyY2VudGFnZSA9ICh0ZXh0ZWxlbWVudC5zY3JvbGxUb3AgLyorIHRleHRlbGVtZW50LmNsaWVudEhlaWdodCovKS90ZXh0ZWxlbWVudC5zY3JvbGxIZWlnaHQ7XG5cdFx0XHRcdGNvbnNvbGUubG9nKHBlcmNlbnRhZ2UpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZihuZXd0cmFucyA+PSBhcHBkYXRhLnRyYW5zbGF0aW9uY291bnQpIHtcblx0XHRcdFx0bmV3dHJhbnMgPSAwO1xuXHRcdFx0fVxuXHRcdFx0aWYobmV3dHJhbnMgPCAwKSB7XG5cdFx0XHRcdG5ld3RyYW5zID0gYXBwZGF0YS50cmFuc2xhdGlvbmNvdW50LTE7XG5cdFx0XHR9XG5cdFx0XHRpZihuZXdjYW50byA+PSBhcHBkYXRhLmNhbnRvY291bnQpIHtcblx0XHRcdFx0bmV3Y2FudG8gPSAwO1xuXHRcdFx0fVxuXHRcdFx0aWYobmV3Y2FudG8gPCAwKSB7XG5cdFx0XHRcdG5ld2NhbnRvID0gYXBwZGF0YS5jYW50b2NvdW50LTE7XG5cdFx0XHR9XG5cblx0Ly8gZmlndXJlIG91dCB3aGljaCB0cmFuc2xhdGlvbiBpcyB0aGUgY3VycmVudCB0cmFuc2xhdGlvblxuXG5cdFx0XHRmb3IodmFyIGk9MDsgaSA8IHRyYW5zbGF0aW9uZGF0YS5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZihhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3RbbmV3dHJhbnNdID09IHRyYW5zbGF0aW9uZGF0YVtpXS50cmFuc2xhdGlvbmlkKSB7XG5cdFx0XHRcdFx0bmV3dHJhbnMgPSBpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHR0ZXh0ZWxlbWVudC5pbm5lckhUTUwgPSB0ZXh0ZGF0YVtuZXd0cmFuc11bbmV3Y2FudG9dO1xuXHRcdFx0ZG9tLnJlbW92ZWNsYXNzKFwiI3RleHRcIix0cmFuc2xhdGlvbmRhdGFbYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb25dLnRyYW5zbGF0aW9uY2xhc3MpO1xuXHRcdFx0ZG9tLmFkZGNsYXNzKFwiI3RleHRcIix0cmFuc2xhdGlvbmRhdGFbbmV3dHJhbnNdLnRyYW5zbGF0aW9uY2xhc3MpO1xuXHRcdFx0YXBwLnNldHVwbm90ZXMoKTtcblx0XHRcdGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uID0gbmV3dHJhbnM7XG5cdFx0XHRhcHBkYXRhLmN1cnJlbnRjYW50byA9IG5ld2NhbnRvO1xuXG5cdFx0XHRpZihhcHBkYXRhLmN1cnJlbnRjYW50byA+IDApIHtcblx0XHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXZ0aXRsZVwiKS5pbm5lckhUTUwgPSB0cmFuc2xhdGlvbmRhdGFbYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb25dLnRyYW5zbGF0aW9uc2hvcnRuYW1lK1wiIMK3IDxzdHJvbmc+Q2FudG8gXCIrYXBwZGF0YS5jdXJyZW50Y2FudG8rXCI8L3N0cm9uZz5cIjtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2dGl0bGVcIikuaW5uZXJIVE1MID0gXCImbmJzcDtcIjtcblx0XHRcdH1cblxuXHRcdFx0YXBwLmZpeHBhZGRpbmcoKTtcblxuLy8gc2V0IHBlcmNlbnRhZ2U6IHRoaXMgaXMgdGVycmlibGUhIGZpeCB0aGlzIVxuLy8gZmlyc3Q6IHRyeSB0byBmaWd1cmUgb3V0IGhvdyBtYW55IGxpbmVzIHdlIGhhdmU/IENhbiB3ZSBkbyB0aGF0P1xuXG5cdFx0XHRpZihjaGFuZ2V0cmFucykge1xuXG5cdFx0Ly8gdGhpcyBtZXRob2Qgc3RpbGwgaXNuJ3QgZ3JlYXQhIGl0IHRyaWVzIHRvIHJvdW5kIHRvIGN1cnJlbnQgbGluZWhlaWdodFxuXHRcdC8vIHRvIGF2b2lkIGN1dHRpbmcgb2ZmIGxpbmVzXG5cblx0XHRcdFx0dmFyIHNjcm9sbHRvID0gYXBwLnJvdW5kZWQocGVyY2VudGFnZSAqIHRleHRlbGVtZW50LnNjcm9sbEhlaWdodCk7XG5cdFx0XHRcdHRleHRlbGVtZW50LnNjcm9sbFRvcCA9IHNjcm9sbHRvO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYocGVyY2VudGFnZSA+IDApIHtcblx0XHRcdFx0XHR0ZXh0ZWxlbWVudC5zY3JvbGxUb3AgPSB0ZXh0ZWxlbWVudC5zY3JvbGxIZWlnaHQ7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGV4dGVsZW1lbnQuc2Nyb2xsVG9wID0gMDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRhcHAuc2F2ZWN1cnJlbnRkYXRhKCk7XG5cdH0sXG5cdHJvdW5kZWQ6IGZ1bmN0aW9uKHBpeGVscykge1xuXG5cdFx0Ly8gdGhpcyBpcyBzdGlsbCBhIG1lc3MsIGZpeCB0aGlzXG5cblx0XHRyZXR1cm4gYXBwZGF0YS5saW5laGVpZ2h0ICogTWF0aC5mbG9vcihwaXhlbHMgLyBhcHBkYXRhLmxpbmVoZWlnaHQpO1xuXG5cdH0sXG5cdGZpeHBhZGRpbmc6IGZ1bmN0aW9uKCkge1xuXG5cdFx0dmFyIHRleHRlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0ZXh0XCIpO1xuXHRcdHZhciBkaXZzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIiN0ZXh0IHBcIik7XG5cdFx0dmFyIGksIGRpdiwgcGFkZGluZywgZGVzaXJlZHdpZHRoO1xuXHRcdHZhciBtYXh3aWR0aCA9IDA7XG5cblx0XHRpZihkb20uaGFzY2xhc3ModGV4dGVsZW1lbnQsXCJwb2V0cnlcIikpIHtcblxuLy8gdGhpcyBpcyBwb2V0cnksIGZpZ3VyZSBvdXQgbG9uZ2VzdCBsaW5lXG5cblx0XHRcdHRleHRlbGVtZW50LnN0eWxlLnBhZGRpbmdMZWZ0ID0gMDtcblx0XHRcdGZvcihpPTA7IGk8ZGl2cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRkaXYgPSBkaXZzW2ldO1xuXHRcdFx0XHRkaXYuc3R5bGUuZGlzcGxheSA9IFwiaW5saW5lLWJsb2NrXCI7XG5cdFx0XHRcdGlmKGRpdi5jbGllbnRXaWR0aCA+IG1heHdpZHRoKSB7XG5cdFx0XHRcdFx0bWF4d2lkdGggPSBkaXYuY2xpZW50V2lkdGggKyA5MDtcblx0XHRcdFx0fVxuXHRcdFx0XHRkaXYuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcblx0XHRcdH1cblxuXHRcdFx0Y29uc29sZS5sb2coXCJ0ZXh0IHdpZHRoOiBcIiArIGFwcGRhdGEudGV4dHdpZHRoKTtcblx0XHRcdGNvbnNvbGUubG9nKFwibWF4IHdpZHRoOiBcIiArIG1heHdpZHRoKTtcblxuXHRcdFx0dGV4dGVsZW1lbnQuc3R5bGUucGFkZGluZ0xlZnQgPSAoYXBwZGF0YS50ZXh0d2lkdGggLSBtYXh3aWR0aCkvMitcInB4XCI7XG5cdFx0XHR0ZXh0ZWxlbWVudC5zdHlsZS5wYWRkaW5nUmlnaHQgPSAoYXBwZGF0YS50ZXh0d2lkdGggLSBtYXh3aWR0aCkvMitcInB4XCI7XG5cdFx0fSBlbHNlIHtcblxuXHQvLyB0aGlzIGlzIHByb3NlLCBzdGFuZGFyZGl6ZWQgcGFkZGluZ1xuXG5cdFx0XHRkZXNpcmVkd2lkdGggPSA3NTsgLy8gdGhpcyBpcyBpbiB2d1xuXG5cdFx0XHRjb25zb2xlLmxvZyhcInRleHQgd2lkdGg6IFwiICsgYXBwZGF0YS50ZXh0d2lkdGgpO1xuXHRcdFx0Y29uc29sZS5sb2coXCJkZXNpcmVkIHdpZHRoOiBcIiArIGRlc2lyZWR3aWR0aCk7XG5cdFx0XHRjb25zb2xlLmxvZyhcImxpbmVoZWlnaHQ6IFwiICsgYXBwZGF0YS5saW5laGVpZ2h0KTtcblxuXHQvL1x0XHRjb25zb2xlLmxvZyhsZW5zd2lkdGggKyBcIiBcIitkZXNpcmVkd2lkdGgpO1xuXHQvL1x0XHR2YXIgcGFkZGluZyA9IChsZW5zd2lkdGggLSBkZXNpcmVkd2lkdGgpLzI7XG5cblx0XHRcdHBhZGRpbmcgPSAoMTAwIC0gZGVzaXJlZHdpZHRoKS8yO1xuXHQvKlxuXHRcdFx0aWYoKGRlc2lyZWR3aWR0aCArIDIpID4gbGVuc3dpZHRoKSB7XG5cdFx0XHRcdHRleHRlbGVtZW50LnN0eWxlLnBhZGRpbmdMZWZ0ID0gXCIxdndcIjtcblx0XHRcdFx0dGV4dGVsZW1lbnQuc3R5bGUucGFkZGluZ1JpZ2h0ID0gXCIxdndcIjtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCovXG5cdFx0XHR0ZXh0ZWxlbWVudC5zdHlsZS5wYWRkaW5nTGVmdCA9IHBhZGRpbmcrXCJ2d1wiO1xuXHRcdFx0dGV4dGVsZW1lbnQuc3R5bGUucGFkZGluZ1JpZ2h0ID0gcGFkZGluZytcInZ3XCI7XG5cdC8vXHRcdH1cblx0XHR9XG5cblx0fSxcblx0aGlkZW5vdGVzOiBmdW5jdGlvbigpIHtcblx0XHRkb20ucmVtb3ZlYnlzZWxlY3RvcihcIi5ub3Rld2luZG93XCIpO1xuXHR9LFxuXHR1cGRhdGVzZXR0aW5nczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGluc2VydCwgaSwgaiwgdHJhbnNsYXRvcmxpc3Q7XG5cblx0Ly8gYWRkIGluIHRyYW5zbGF0aW9uIGNob29zZXJcblxuXHRcdGRvbS5yZW1vdmVieXNlbGVjdG9yKFwiI3RyYW5zbGF0b3JsaXN0XCIpO1xuXHRcdGluc2VydCA9IGRvbS5jcmVhdGUoJzx1bCBpZD1cInRyYW5zbGF0b3JsaXN0XCI+PC91bD4nKTtcblx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRyYW5zbGF0aW9uY2hvb3NlXCIpLmFwcGVuZENoaWxkKGluc2VydCk7XG5cdFx0dHJhbnNsYXRvcmxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RyYW5zbGF0b3JsaXN0XCIpO1xuXHRcdGZvcihpIGluIHRyYW5zbGF0aW9uZGF0YSkge1xuXHRcdFx0aW5zZXJ0ID0gZG9tLmNyZWF0ZSgnPGxpPjxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBpZD1cImNoZWNrLScgKyB0cmFuc2xhdGlvbmRhdGFbaV0udHJhbnNsYXRpb25pZCArICdcIiAvPjxzcGFuIGlkPVwiJyt0cmFuc2xhdGlvbmRhdGFbaV0udHJhbnNsYXRpb25pZCsnXCIgPicgKyB0cmFuc2xhdGlvbmRhdGFbaV0udHJhbnNsYXRpb25mdWxsbmFtZSArICc8L3NwYW4+PC9saT4nKTtcblx0XHRcdHRyYW5zbGF0b3JsaXN0LmFwcGVuZENoaWxkKGluc2VydCk7XG5cdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNoZWNrLVwiK3RyYW5zbGF0aW9uZGF0YVtpXS50cmFuc2xhdGlvbmlkKS5jaGVja2VkID0gKGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdC5pbmRleE9mKHRyYW5zbGF0aW9uZGF0YVtpXS50cmFuc2xhdGlvbmlkKSA+IC0xKTtcblx0XHR9XG5cblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiI3RyYW5zbGF0b3JsaXN0IGlucHV0W3R5cGU9Y2hlY2tib3hdXCIpLmZvckVhY2goYXBwLmhlbHBlcnMuY2hlY2tib3hnbyk7XG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIiN0cmFuc2xhdG9ybGlzdCBzcGFuXCIpLmZvckVhY2goYXBwLmhlbHBlcnMuY2hlY2tib3hzcGFuZ28pO1xuXG5cdC8vIGFkZCBpbiB0b2NcblxuXHRcdGRvbS5yZW1vdmVieXNlbGVjdG9yKFwiI3NlbGVjdG9yc1wiKTtcblx0XHRpbnNlcnQgPSBkb20uY3JlYXRlKCc8ZGl2IGlkPVwic2VsZWN0b3JzXCI+PHA+Q2FudG86IDxzZWxlY3QgaWQ9XCJzZWxlY3RjYW50b1wiPjwvc2VsZWN0PjwvcD48cD5UcmFuc2xhdGlvbjogPHNlbGVjdCBpZD1cInNlbGVjdHRyYW5zbGF0b3JcIj48L3NlbGVjdD48L3A+PHA+PHNwYW4gaWQ9XCJzZWxlY3Rnb1wiPkdvPC9zcGFuPjwvcD48L2Rpdj4nKTtcblx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRyYW5zbGF0aW9uZ29cIikuYXBwZW5kQ2hpbGQoaW5zZXJ0KTtcblx0XHRmb3IoaSA9IDA7IGkgPCBhcHBkYXRhLmNhbnRvY291bnQ7IGkrKykge1xuXHRcdFx0aW5zZXJ0ID0gZG9tLmNyZWF0ZSgnPG9wdGlvbiBpZD1cImNhbnRvJytpKydcIiAnKygoYXBwZGF0YS5jdXJyZW50Y2FudG8gPT0gaSkgPyBcInNlbGVjdGVkXCIgOiBcIlwiKSsnPicrY2FudG90aXRsZXNbaV0rXCI8L29wdGlvbj5cIik7XG5cdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNlbGVjdGNhbnRvXCIpLmFwcGVuZENoaWxkKGluc2VydCk7XG5cdFx0fVxuXHRcdGZvcihpIGluIGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdCkge1xuXHRcdFx0Zm9yKGogPSAwOyBqIDwgdHJhbnNsYXRpb25kYXRhLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGlmKHRyYW5zbGF0aW9uZGF0YVtqXS50cmFuc2xhdGlvbmlkID09IGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdFtpXSkge1xuXHRcdFx0XHRcdGluc2VydCA9IGRvbS5jcmVhdGUoJzxvcHRpb24gaWQ9XCJ0cl8nK3RyYW5zbGF0aW9uZGF0YVtqXS50cmFuc2xhdGlvbmlkKydcIiAnICsgKChhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbiA9PSBpKSA/IFwic2VsZWN0ZWRcIiA6IFwiXCIpICsgJz4nICsgdHJhbnNsYXRpb25kYXRhW2pdLnRyYW5zbGF0aW9uZnVsbG5hbWUrXCI8L29wdGlvbj5cIik7XG5cdFx0XHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWxlY3R0cmFuc2xhdG9yXCIpLmFwcGVuZENoaWxkKGluc2VydCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3NlbGVjdGdvXCIpLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHR2YXIgc2VsZWN0ZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNlbGVjdHRyYW5zbGF0b3JcIik7XG5cdFx0XHR2YXIgdGhpc3RyYW5zID0gc2VsZWN0ZWQub3B0aW9uc1tzZWxlY3RlZC5zZWxlY3RlZEluZGV4XS5pZC5zdWJzdHIoMyk7XG5cdFx0XHRzZWxlY3RlZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2VsZWN0Y2FudG9cIik7XG5cdFx0XHR2YXIgdGhpc2NhbnRvID0gc2VsZWN0ZWQub3B0aW9uc1tzZWxlY3RlZC5zZWxlY3RlZEluZGV4XS5pZC5zdWJzdHIoNSk7XG5cdFx0XHRmb3IoaiA9IDA7IGogPCB0cmFuc2xhdGlvbmRhdGEubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0aWYoYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0W2pdID09IHRoaXN0cmFucykge1xuXHRcdFx0XHRcdGFwcC5zZXRwYWdlKFwibGVuc1wiKTtcblx0XHRcdFx0XHRhcHAuc2V0bGVucyhqLHRoaXNjYW50bywwKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cdHNhdmVjdXJyZW50ZGF0YTogZnVuY3Rpb24oKSB7XG4vLyB0aGlzIHNob3VsZCBzdG9yZSBhcHBkYXRlIG9uIGxvY2Fsc3RvcmFnZSAoZG9lcyB0aGF0IHdvcmsgZm9yIG1vYmlsZT8pXG5cdFx0Y29uc29sZS5sb2coXCJTdG9yaW5nIHByZWZlcmVuY2VzISBUS1wiKTtcblx0fSxcblx0Y2hhbmdldHJhbnNsYXRpb246IGZ1bmN0aW9uKHRoaXNpZCwgaXNzZXQpIHtcblx0XHRjb25zb2xlLmxvZyhcImNoYW5nZXRyYW5zbGF0aW9uIGZpcmVkIVwiKTtcblx0XHRmb3IodmFyIGkgaW4gdHJhbnNsYXRpb25kYXRhKSB7XG5cdFx0XHRpZih0aGlzaWQgPT0gdHJhbnNsYXRpb25kYXRhW2ldLnRyYW5zbGF0aW9uaWQpIHtcblx0XHRcdFx0aWYoaXNzZXQpIHtcblx0XHRcdFx0XHRhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3QucHVzaCh0aGlzaWQpO1xuXHRcdFx0XHRcdGFwcGRhdGEudHJhbnNsYXRpb25jb3VudCsrO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGlmKGFwcGRhdGEudHJhbnNsYXRpb25jb3VudCA+IDEpIHtcblx0XHRcdFx0XHRcdHZhciBqID0gYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0LmluZGV4T2YodGhpc2lkKTtcblx0XHRcdFx0XHRcdGlmIChqID4gLTEpIHtcblx0XHRcdFx0XHRcdFx0YXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0LnNwbGljZShqLCAxKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGFwcGRhdGEudHJhbnNsYXRpb25jb3VudC0tO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHQvLyB0aGVyZSdzIG9ubHkgb25lIHRyYW5zbGF0aW9uIGluIHRoZSBsaXN0LCBkbyBub3QgZGVsZXRlIGxhc3Rcblx0XHRcdFx0XHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2hlY2stXCIrdGhpc2lkLnRvTG93ZXJDYXNlKCkpLmNoZWNrZWQgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0YXBwLnNhdmVjdXJyZW50ZGF0YSgpO1xuXHRcdH1cblxuXHRcdHZhciBuZXdsaXN0ID0gW107XG5cdFx0Zm9yKGkgaW4gdHJhbnNsYXRpb25kYXRhKSB7XG5cdFx0XHRpZihhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3QuaW5kZXhPZih0cmFuc2xhdGlvbmRhdGFbaV0udHJhbnNsYXRpb25pZCkgPiAtMSkge1xuXHRcdFx0XHRuZXdsaXN0LnB1c2godHJhbnNsYXRpb25kYXRhW2ldLnRyYW5zbGF0aW9uaWQpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3QgPSBuZXdsaXN0LnNsaWNlKCk7XG5cdFx0Ly8gYWxzbyB3aGF0IGRvIHdlIGRvIHdoZW4gb25lIGlzIGRlbGV0ZWQ/XG5cdFx0YXBwLnVwZGF0ZXNldHRpbmdzKCk7XG5cdH0sXG5cdHNldHBhZ2U6IGZ1bmN0aW9uKG5ld3BhZ2UpIHtcblx0XHRkb20ucmVtb3ZlY2xhc3MoXCIucGFnZVwiLFwib25cIik7XG5cdFx0ZG9tLmFkZGNsYXNzKFwiLnBhZ2UjXCIrbmV3cGFnZSxcIm9uXCIpO1xuXHRcdGFwcGRhdGEuY3VycmVudHBhZ2UgPSBuZXdwYWdlO1xuXHRcdGFwcC5yZXNpemUoKTtcblx0fSxcblx0b25EZXZpY2VSZWFkeTogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coXCJkZXZpY2UgcmVhZHkhXCIpO1xuXHRcdGFwcC5zZXR1cCgpO1xuXHR9LFxuXHRzZXR1cDogZnVuY3Rpb24oKSB7XG5cdFx0YXBwLnNldHVwbm90ZXMoKTtcblx0XHRhcHAuc2V0dXBjb250cm9scygpO1xuXHRcdGFwcC5zZXRwYWdlKFwibGVuc1wiKTtcblx0fVxufTtcblxuYXBwLmluaXRpYWxpemUoKTtcbmlmICghKCdvbkRldmljZVJlYWR5JyBpbiBkb2N1bWVudCkpIHtcblx0Y29uc29sZS5sb2coXCJSdW5uaW5nIG5vbi1Db3Jkb3ZhIGNvZGUhXCIpO1xuXHRhcHAuc2V0dXAoKTsgLy8gKGhvcGVmdWxseSB0aGlzIGRvZXNuJ3QgZmlyZSBpbiByZWFsIHZlcnNpb24/KVxufVxuIiwiLy8gZG9tLmpzXG5cbnZhciBkb20gPSB7XG5cdGNyZWF0ZTogZnVuY3Rpb24oaHRtbFN0cikge1xuXHRcdHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXHRcdHZhciB0ZW1wID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0dGVtcC5pbm5lckhUTUwgPSBodG1sU3RyO1xuXHRcdHdoaWxlICh0ZW1wLmZpcnN0Q2hpbGQpIHtcblx0XHRcdGZyYWcuYXBwZW5kQ2hpbGQodGVtcC5maXJzdENoaWxkKTtcblx0XHR9XG5cdFx0cmV0dXJuIGZyYWc7XG5cdH0sXG5cdHJlbW92ZWJ5c2VsZWN0b3I6IGZ1bmN0aW9uKHNlbGVjdG9yc3RyaW5nKSB7XG5cdFx0dmFyIHNlbGVjdG9yID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcnN0cmluZyk7XG5cdFx0aWYoc2VsZWN0b3IgIT09IG51bGwpIHtcblx0XHRcdHNlbGVjdG9yLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2VsZWN0b3IpO1xuXHRcdH1cblx0fSxcblx0YWRkY2xhc3M6IGZ1bmN0aW9uKHNlbGVjdG9yc3RyaW5nLCBteWNsYXNzKSB7XG5cdFx0dmFyIG15ZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3JzdHJpbmcpO1xuXHRcdGlmKG15Y2xhc3MuaW5kZXhPZihcIiBcIikgPiAtMSkge1xuXHRcdFx0dmFyIGNsYXNzZXMgPSBteWNsYXNzLnNwbGl0KFwiIFwiKTtcblx0XHRcdGZvcih2YXIgaiA9IDA7IGogPCBjbGFzc2VzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGRvbS5hZGRjbGFzcyhzZWxlY3RvcnN0cmluZywgY2xhc3Nlc1tqXSk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbXllbGVtZW50Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdG15ZWxlbWVudFtpXS5jbGFzc0xpc3QuYWRkKG15Y2xhc3MpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0cmVtb3ZlY2xhc3M6IGZ1bmN0aW9uKHNlbGVjdG9yc3RyaW5nLCBteWNsYXNzKSB7XG5cdFx0dmFyIG15ZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3JzdHJpbmcpO1xuXHRcdGlmKG15Y2xhc3MuaW5kZXhPZihcIiBcIikgPiAtMSkge1xuXHRcdFx0dmFyIGNsYXNzZXMgPSBteWNsYXNzLnNwbGl0KFwiIFwiKTtcblx0XHRcdGZvcih2YXIgaiA9IDA7IGogPCBjbGFzc2VzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGRvbS5yZW1vdmVjbGFzcyhzZWxlY3RvcnN0cmluZywgY2xhc3Nlc1tqXSk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbXllbGVtZW50Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdG15ZWxlbWVudFtpXS5jbGFzc0xpc3QucmVtb3ZlKG15Y2xhc3MpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0aGFzY2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQsIGNscykge1xuXHRcdHJldHVybiAoJyAnICsgZWxlbWVudC5jbGFzc05hbWUgKyAnICcpLmluZGV4T2YoJyAnICsgY2xzICsgJyAnKSA+IC0xO1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRvbTtcbiIsIi8vIGNhcmx5bGUuanNcblxudmFyIGNhcmx5bGUgPSBbJzxwIGNsYXNzPVwidGl0bGVcIj5JbmZlcm5vPC9wPjxwIGNsYXNzPVwiYXV0aG9yXCI+Sm9obiBBaXRrZW4gQ2FybHlsZSwgVGhvbWFzIE9rZXkgJmFtcDsgUC4gSC4gV2lrc3RlZWQ8L3A+JyxcblxuXHQnPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5DQU5UTyBJPC9wPjxwIGNsYXNzPVwic3VtbWFyeVwiPkRhbnRlIGZpbmRzIGhpbXNlbGYgYXN0cmF5IGluIGEgZGFyayBXb29kLCB3aGVyZSBoZSBzcGVuZHMgYSBuaWdodCBvZiBncmVhdCBtaXNlcnkuIEhlIHNheXMgdGhhdCBkZWF0aCBpcyBoYXJkbHkgbW9yZSBiaXR0ZXIsIHRoYW4gaXQgaXMgdG8gcmVjYWxsIHdoYXQgaGUgc3VmZmVyZWQgdGhlcmU7IGJ1dCB0aGF0IGhlIHdpbGwgdGVsbCB0aGUgZmVhcmZ1bCB0aGluZ3MgaGUgc2F3LCBpbiBvcmRlciB0aGF0IGhlIG1heSBhbHNvIHRlbGwgaG93IGhlIGZvdW5kIGd1aWRhbmNlLCBhbmQgZmlyc3QgYmVnYW4gdG8gZGlzY2VybiB0aGUgcmVhbCBjYXVzZXMgb2YgYWxsIG1pc2VyeS4gSGUgY29tZXMgdG8gYSBIaWxsOyBhbmQgc2VlaW5nIGl0cyBzdW1taXQgYWxyZWFkeSBicmlnaHQgd2l0aCB0aGUgcmF5cyBvZiB0aGUgU3VuLCBoZSBiZWdpbnMgdG8gYXNjZW5kIGl0LiBUaGUgd2F5IHRvIGl0IGxvb2tzIHF1aXRlIGRlc2VydGVkLiBIZSBpcyBtZXQgYnkgYSBiZWF1dGlmdWwgTGVvcGFyZCwgd2hpY2gga2VlcHMgZGlzdHJhY3RpbmcgaGlzIGF0dGVudGlvbiBmcm9tIHRoZSBIaWxsLCBhbmQgbWFrZXMgaGltIHR1cm4gYmFjayBzZXZlcmFsIHRpbWVzLiBUaGUgaG91ciBvZiB0aGUgbW9ybmluZywgdGhlIHNlYXNvbiwgYW5kIHRoZSBnYXkgb3V0d2FyZCBhc3BlY3Qgb2YgdGhhdCBhbmltYWwsIGdpdmUgaGltIGdvb2QgaG9wZXMgYXQgZmlyc3Q7IGJ1dCBoZSBpcyBkcml2ZW4gZG93biBhbmQgdGVycmlmaWVkIGJ5IGEgTGlvbiBhbmQgYSBTaGUtd29sZi4gVmlyZ2lsIGNvbWVzIHRvIGhpcyBhaWQsIGFuZCB0ZWxscyBoaW0gdGhhdCB0aGUgV29sZiBsZXRzIG5vbmUgcGFzcyBoZXIgd2F5LCBidXQgZW50YW5nbGVzIGFuZCBzbGF5cyBldmVyeSBvbmUgdGhhdCB0cmllcyB0byBnZXQgdXAgdGhlIG1vdW50YWluIGJ5IHRoZSByb2FkIG9uIHdoaWNoIHNoZSBzdGFuZHMuIEhlIHNheXMgYSB0aW1lIHdpbGwgY29tZSB3aGVuIGEgc3dpZnQgYW5kIHN0cm9uZyBHcmV5aG91bmQgc2hhbGwgY2xlYXIgdGhlIGVhcnRoIG9mIGhlciwgYW5kIGNoYXNlIGhlciBpbnRvIEhlbGwuIEFuZCBoZSBvZmZlcnMgdG8gY29uZHVjdCBEYW50ZSBieSBhbm90aGVyIHJvYWQ7IHRvIHNob3cgaGltIHRoZSBldGVybmFsIHJvb3RzIG9mIG1pc2VyeSBhbmQgb2Ygam95LCBhbmQgbGVhdmUgaGltIHdpdGggYSBoaWdoZXIgZ3VpZGUgdGhhdCB3aWxsIGxlYWQgaGltIHVwIHRvIEhlYXZlbi48L3A+PHA+SW4gdGhlIG1pZGRsZSBvZiB0aGUgam91cm5leSBvZiBvdXIgbGlmZTxzcGFuIGNsYXNzPVwibm90ZVwiPjxzcGFuIGNsYXNzPVwibm90ZW5vXCI+MTwvc3Bhbj48c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+VGhlIFZpc2lvbiB0YWtlcyBwbGFjZSBhdCBFYXN0ZXJ0aWRlIG9mIHRoZSB5ZWFyIDEzMDAsIHRoYXQgaXMgdG8gc2F5LCB3aGVuIERhbnRlIHdhcyB0aGlydHktZml2ZSB5ZWFycyBvbGQuIDxlbT5DZi48L2VtPiA8ZW0+UHNhbG1zPC9lbT4geGMuIDEwOiAmbGRxdW87VGhlIGRheXMgb2Ygb3VyIHllYXJzIGFyZSB0aHJlZXNjb3JlIHllYXJzIGFuZCB0ZW4uJnJkcXVvOyBTZWUgYWxzbyA8ZW0+Q29udml0bzwvZW0+IGl2OiAmbGRxdW87V2hlcmUgdGhlIHRvcCBvZiB0aGlzIGFyY2ggb2YgbGlmZSBtYXkgYmUsIGl0IGlzIGRpZmZpY3VsdCB0byBrbm93LiZuYnNwOy4mbmJzcDsuJm5ic3A7LiBJIGJlbGlldmUgdGhhdCBpbiB0aGUgcGVyZmVjdGx5IG5hdHVyYWwgbWFuLCBpdCBpcyBhdCB0aGUgdGhpcnR5LWZpZnRoIHllYXIuJnJkcXVvOzwvc3Bhbj48L3NwYW4+IEkgY2FtZSB0byBteXNlbGYgaW4gYSBkYXJrIHdvb2Q8c3BhbiBjbGFzcz1cIm5vdGVcIj48c3BhbiBjbGFzcz1cIm5vdGVub1wiPjI8L3NwYW4+PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPjxlbT5DZi48L2VtPiA8ZW0+Q29udml0bzwvZW0+IGl2OiAmbGRxdW87LiZuYnNwOy4mbmJzcDsuJm5ic3A7dGhlIGFkb2xlc2NlbnQgd2hvIHdlbnRlcnMgaW50byB0aGUgV29vZCBvZiBFcnJvciBvZiB0aGlzIGxpZmUgd291bGQgbm90IGtub3cgaG93IHRvIGtlZXAgdG8gdGhlIGdvb2QgcGF0aCBpZiBpdCB3ZXJlIG5vdCBwb2ludGVkIG91dCB0byBoaW0gYnkgaGlzIGVsZGVycy4mcmRxdW87IDxlbT5Qb2xpdGljYWxseTwvZW0+OiB0aGUgPGVtPndvb2Q8L2VtPiBzdGFuZHMgZm9yIHRoZSB0cm91YmxlZCBzdGF0ZSBvZiBJdGFseSBpbiBEYW50ZSZyc3F1bztzIHRpbWUuPC9zcGFuPjwvc3Bhbj4gd2hlcmUgdGhlIHN0cmFpZ2h0IHdheSB3YXMgbG9zdC48L3A+PHA+QWghIGhvdyBoYXJkIGEgdGhpbmcgaXQgaXMgdG8gdGVsbCB3aGF0IGEgd2lsZCwgYW5kIHJvdWdoLCBhbmQgc3R1YmJvcm4gd29vZCB0aGlzIHdhcywgd2hpY2ggaW4gbXkgdGhvdWdodCByZW5ld3MgdGhlIGZlYXIhPC9wPjxwPlNvIGJpdHRlciBpcyBpdCwgdGhhdCBzY2Fyc2VseSBtb3JlIGlzIGRlYXRoOiBidXQgdG8gdHJlYXQgb2YgdGhlIGdvb2QgdGhhdCB0aGVyZSBJIGZvdW5kLCBJIHdpbGwgcmVsYXRlIHRoZSBvdGhlciB0aGluZ3MgdGhhdCBJIGRpc2Nlcm5lZC48L3A+PHA+SSBjYW5ub3QgcmlnaHRseSB0ZWxsIGhvdyBJIGVudGVyZWQgaXQsIHNvIGZ1bGwgb2Ygc2xlZXAgd2FzIEkgYWJvdXQgdGhlIG1vbWVudCB0aGF0IEkgbGVmdCB0aGUgdHJ1ZSB3YXkuPC9wPjxwPkJ1dCBhZnRlciBJIGhhZCByZWFjaGVkIHRoZSBmb290IG9mIGEgSGlsbDxzcGFuIGNsYXNzPVwibm90ZVwiPjxzcGFuIGNsYXNzPVwibm90ZW5vXCI+Mzwvc3Bhbj48c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+VGhlICZsZHF1bztob2x5IEhpbGwmcmRxdW87IG9mIHRoZSBCaWJsZTsgQnVueWFuJnJzcXVvO3MgJmxkcXVvO0RlbGVjdGFibGUgTW91bnRhaW5zLiZyZHF1bzs8L3NwYW4+PC9zcGFuPiB0aGVyZSwgd2hlcmUgdGhhdCB2YWxsZXkgZW5kZWQsIHdoaWNoIGhhZCBwaWVyY2VkIG15IGhlYXJ0IHdpdGggZmVhciw8L3A+PHA+SSBsb29rZWQgdXAgYW5kIHNhdyBpdHMgc2hvdWxkZXJzIGFscmVhZHkgY2xvdGhlZCB3aXRoIHRoZSByYXlzIG9mIHRoZSBQbGFuZXQ8c3BhbiBjbGFzcz1cIm5vdGVcIj48c3BhbiBjbGFzcz1cIm5vdGVub1wiPjQ8L3NwYW4+PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPjxlbT5QbGFuZXQ8L2VtPiwgdGhlIHN1biwgd2hpY2ggd2FzIGEgcGxhbmV0IGFjY29yZGluZyB0byB0aGUgUHRvbGVtYWljIHN5c3RlbS4gRGFudGUgc3BlYWtzIGVsc2V3aGVyZSAoPGVtPkNvbnYuPC9lbT4gaXYpIG9mIHRoZSAmbGRxdW87c3Bpcml0dWFsIFN1biwgd2hpY2ggaXMgR29kLiZyZHF1bzs8L3NwYW4+PC9zcGFuPiB0aGF0IGxlYWRzIG1lbiBzdHJhaWdodCBvbiBldmVyeSByb2FkLjwvcD48cD5UaGVuIHRoZSBmZWFyIHdhcyBzb21ld2hhdCBjYWxtZWQsIHdoaWNoIGhhZCBjb250aW51ZWQgaW4gdGhlIGxha2Ugb2YgbXkgaGVhcnQgdGhlIG5pZ2h0IHRoYXQgSSBwYXNzZWQgc28gcGl0ZW91c2x5LjwvcD48cD5BbmQgYXMgaGUsIHdobyB3aXRoIHBhbnRpbmcgYnJlYXRoIGhhcyBlc2NhcGVkIGZyb20gdGhlIGRlZXAgc2VhIHRvIHRoZSBzaG9yZSwgdHVybnMgdG8gdGhlIGRhbmdlcm91cyB3YXRlciBhbmQgZ2F6ZXM6PC9wPjxwPnNvIG15IG1pbmQsIHdoaWNoIHN0aWxsIHdhcyBmbGVlaW5nLCB0dXJuZWQgYmFjayB0byBzZWUgdGhlIHBhc3MgdGhhdCBubyBvbmUgZXZlciBsZWZ0IGFsaXZlLjwvcD48cD5BZnRlciBJIGhhZCByZXN0ZWQgbXkgd2VhcmllZCBib2R5IGEgc2hvcnQgd2hpbGUsIEkgdG9vayB0aGUgd2F5IGFnYWluIGFsb25nIHRoZSBkZXNlcnQgc3RyYW5kLCBzbyB0aGF0IHRoZSByaWdodCBmb290IGFsd2F5cyB3YXMgdGhlIGxvd2VyLjxzcGFuIGNsYXNzPVwibm90ZVwiPjxzcGFuIGNsYXNzPVwibm90ZW5vXCI+NTwvc3Bhbj48c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+QW55IG9uZSB3aG8gaXMgYXNjZW5kaW5nIGEgaGlsbCwgYW5kIHdob3NlIGxlZnQgZm9vdCBpcyBhbHdheXMgdGhlIGxvd2VyLCBtdXN0IGJlIGJlYXJpbmcgdG8gdGhlIDxlbT5yaWdodDwvZW0+Ljwvc3Bhbj48L3NwYW4+PC9wPjxwPkFuZCBiZWhvbGQsIGFsbW9zdCBhdCB0aGUgY29tbWVuY2VtZW50IG9mIHRoZSBzdGVlcCwgYSBMZW9wYXJkLDxzcGFuIGNsYXNzPVwibm90ZVwiPjxzcGFuIGNsYXNzPVwibm90ZW5vXCI+Njwvc3Bhbj48c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+V29ybGRseSBQbGVhc3VyZTsgPGVtPnBvbGl0aWNhbGx5PC9lbT46IEZsb3JlbmNlLjwvc3Bhbj48L3NwYW4+IGxpZ2h0IGFuZCB2ZXJ5IG5pbWJsZSwgd2hpY2ggd2FzIGNvdmVyZWQgd2l0aCBzcG90dGVkIGhhaXIuPC9wPjxwPkFuZCBpdCB3ZW50IG5vdCBmcm9tIGJlZm9yZSBteSBmYWNlOyBuYXksIHNvIGltcGVkZWQgbXkgd2F5LCB0aGF0IEkgaGFkIG9mdGVuIHR1cm5lZCB0byBnbyBiYWNrLjwvcD48cD5UaGUgdGltZSB3YXMgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgbW9ybmluZzsgYW5kIHRoZSBzdW4gd2FzIG1vdW50aW5nIHVwIHdpdGggdGhvc2Ugc3RhcnMsPHNwYW4gY2xhc3M9XCJub3RlXCI+PHNwYW4gY2xhc3M9XCJub3Rlbm9cIj43PC9zcGFuPjxzcGFuIGNsYXNzPVwibm90ZXRleHRcIj5BY2NvcmRpbmcgdG8gdHJhZGl0aW9uLCB0aGUgc3VuIHdhcyBpbiBBcmllcyBhdCB0aGUgdGltZSBvZiB0aGUgQ3JlYXRpb24uPC9zcGFuPjwvc3Bhbj4gd2hpY2ggd2VyZSB3aXRoIGhpbSB3aGVuIERpdmluZSBMb3ZlPC9wPjxwPmZpcnN0IG1vdmVkIHRob3NlIGZhaXIgdGhpbmdzOiBzbyB0aGF0IHRoZSBob3VyIG9mIHRpbWUgYW5kIHRoZSBzd2VldCBzZWFzb24gY2F1c2VkIG1lIHRvIGhhdmUgZ29vZCBob3BlPC9wPjxwPm9mIHRoYXQgYW5pbWFsIHdpdGggdGhlIGdheSBza2luOyB5ZXQgbm90IHNvLCBidXQgdGhhdCBJIGZlYXJlZCBhdCB0aGUgc2lnaHQsIHdoaWNoIGFwcGVhcmVkIHRvIG1lLCBvZiBhIExpb24uPHNwYW4gY2xhc3M9XCJub3RlXCI+PHNwYW4gY2xhc3M9XCJub3Rlbm9cIj44PC9zcGFuPjxzcGFuIGNsYXNzPVwibm90ZXRleHRcIj5BbWJpdGlvbjsgPGVtPnBvbGl0aWNhbGx5PC9lbT46IHRoZSBSb3lhbCBIb3VzZSBvZiBGcmFuY2UuPC9zcGFuPjwvc3Bhbj48L3A+PHA+SGUgc2VlbWVkIGNvbWluZyB1cG9uIG1lIHdpdGggaGVhZCBlcmVjdCwgYW5kIGZ1cmlvdXMgaHVuZ2VyOyBzbyB0aGF0IHRoZSBhaXIgc2VlbWVkIHRvIGhhdmUgZmVhciB0aGVyZWF0OzwvcD48cD5hbmQgYSBTaGUtd29sZiw8c3BhbiBjbGFzcz1cIm5vdGVcIj48c3BhbiBjbGFzcz1cIm5vdGVub1wiPjk8L3NwYW4+PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPjxlbT5BdmFyaWNlPC9lbT47IDxlbT5wb2xpdGljYWxseTwvZW0+OiB0aGUgUGFwYWwgU2VlLiBUaGUgdGhyZWUgYmVhc3RzIGFyZSBvYnZpb3VzbHkgdGFrZW4gZnJvbSA8ZW0+SmVyZW1pYWg8L2VtPiB2LiZuYnNwOzYuPC9zcGFuPjwvc3Bhbj4gdGhhdCBsb29rZWQgZnVsbCBvZiBhbGwgY3JhdmluZ3MgaW4gaGVyIGxlYW5uZXNzOyBhbmQgaGFzIGVyZSBub3cgbWFkZSBtYW55IGxpdmUgaW4gc29ycm93LjwvcD48cD5TaGUgYnJvdWdodCBzdWNoIGhlYXZpbmVzcyB1cG9uIG1lIHdpdGggdGhlIHRlcnJvciBvZiBoZXIgYXNwZWN0LCB0aGF0IEkgbG9zdCB0aGUgaG9wZSBvZiBhc2NlbmRpbmcuPC9wPjxwPkFuZCBhcyBvbmUgd2hvIGlzIGVhZ2VyIGluIGdhaW5pbmcsIGFuZCwgd2hlbiB0aGUgdGltZSBhcnJpdmVzIHRoYXQgbWFrZXMgaGltIGxvc2UsIHdlZXBzIGFuZCBhZmZsaWN0cyBoaW1zZWxmIGluIGFsbCBoaXMgdGhvdWdodHM6PC9wPjxwPnN1Y2ggdGhhdCByZXN0bGVzcyBiZWFzdCBtYWRlIG1lLCB3aGljaCBjb21pbmcgYWdhaW5zdCBtZSwgYnkgbGl0dGxlIGFuZCBsaXR0bGUgZHJvdmUgbWUgYmFjayB0byB3aGVyZSB0aGUgU3VuIGlzIHNpbGVudC48L3A+PHA+V2hpbHN0IEkgd2FzIHJ1c2hpbmcgZG93bndhcmRzLCB0aGVyZSBhcHBlYXJlZCBiZWZvcmUgbXkgZXllcyBvbmU8c3BhbiBjbGFzcz1cIm5vdGVcIj48c3BhbiBjbGFzcz1cIm5vdGVub1wiPjEwPC9zcGFuPjxzcGFuIGNsYXNzPVwibm90ZXRleHRcIj5WaXJnaWwsIHdobyBzdGFuZHMgZm9yIFdvcmxkbHkgV2lzZG9tLCBhbmQgaXMgRGFudGUmcnNxdW87cyBndWlkZSB0aHJvdWdoIEhlbGwgYW5kIFB1cmdhdG9yeSAoc2VlIEdhcmRuZXIsIHBwLiA4NywgODgpLjxiciAvPjxiciAvPjxlbT5ob2Fyc2U8L2VtPiwgcGVyaGFwcyBiZWNhdXNlIHRoZSBzdHVkeSBvZiBWaXJnaWwgaGFkIGJlZW4gbG9uZyBuZWdsZWN0ZWQ8L3NwYW4+PC9zcGFuPiB3aG8gc2VlbWVkIGhvYXJzZSBmcm9tIGxvbmcgc2lsZW5jZS48L3A+PHA+V2hlbiBJIHNhdyBoaW0gaW4gdGhlIGdyZWF0IGRlc2VydCwgSSBjcmllZDogJmxkcXVvO0hhdmUgcGl0eSBvbiBtZSwgd2hhdGUmcnNxdW87ZXIgdGhvdSBiZSwgd2hldGhlciBzaGFkZSBvciB2ZXJpdGFibGUgbWFuISZyZHF1bzs8L3A+PHA+SGUgYW5zd2VyZWQgbWU6ICZsZHF1bztOb3QgbWFuLCBhIG1hbiBJIG9uY2Ugd2FzOyBhbmQgbXkgcGFyZW50cyB3ZXJlIExvbWJhcmRzLCBhbmQgYm90aCBvZiBNYW50dWEgYnkgY291bnRyeS48L3A+PHA+VEshPC9wPicsXG5cblx0JzxwIGNsYXNzPVwiY2FudG9oZWFkXCI+Q0FOVE8gSUk8L3A+PHAgY2xhc3M9XCJzdW1tYXJ5XCI+RW5kIG9mIHRoZSBmaXJzdCBkYXkuIEJyaWVmIEludm9jYXRpb24uIERhbmV0IGlzIGRpc2NvdXJhZ2VkIGF0IHRoZSBvdXRzZXQsIHdoZW4gaGUgYmVnaW5zIHNlcmlvdXNseSB0byByZWZsZWN0IHVwb24gd2hhdCBoZSBoYXMgdW5kZXJ0YWtlbi4gVGhhdCB2ZXJ5IGRheSwgaGlzIG93biBzdHJlbmd0aCBoYWQgbWlzZXJhYmx5IGZhaWxlZCBiZWZvcmUgdGhlIExpb24gYW5kIHRoZSBTaGUtV29sZi4gSGUgYmlkcyBWaXJnaWwgY29uc2lkZXIgd2VsbCB3aGV0aGVyIHRoZXJlIGJlIHN1ZmZpY2llbnQgdmlydHVlIGluIGhpbSwgYmVmb3JlIGNvbW1pdHRpbmcgaGltIHRvIHNvIGRyZWFkZnVsIGEgcGFzc2FnZS4gSGUgcmVjYWxscyB0aGUgZ3JlYXQgZXJyYW5kcyBvZiAmQUVsaWc7bmVhcyBhbmQgb2YgUGF1bCwgYW5kIHRoZSBncmVhdCByZXN1bHRzIG9mIHRoZWlyIGdvaW5nIHRvIHRoZSBpbW1vcnRhbCB3b3JsZDsgYW5kIGNvbXBhcmluZyBoaW1zZWxmIHdpdGggdGhlbSwgaGUgZmVlbHMgaGlzIGhlYXJ0IHF1YWlsLCBhbmQgaXMgcmVhZHkgdG8gdHVybiBiYWNrLiBWaXJnaWwgZGlzY2VybnMgdGhlIGZlYXIgdGhhdCBoYXMgY29tZSBvdmVyIGhpbTsgYW5kIGluIG9yZGVyIHRvIHJlbW92ZSBpdCwgdGVsbHMgaGltIGhvdyBhIGJsZXNzZWQgU3Bpcml0IGhhcyBkZXNjZW5kZWQgZnJvbSBIZWF2ZW4gZXhwcmVzc2x5IHRvIGNvbW1hbmQgdGhlIGpvdXJuZXkuIE9uIGhlYXJpbmcgdGhpcywgRGFudGUgaW1tZWRpYXRlbHkgY2FzdHMgb2ZmIHB1c2lsbGFuaW1pdHksIGFuZCBhdCBvbmNlIGFjY2VwdHMgdGhlIEZyZWVkb20gYW5kIHRoZSBNaXNzaW9uIHRoYXQgYXJlIGdpdmVuIGhpbS48L3A+PHA+VEshPC9wPicsXG5cblx0JzxwIGNsYXNzPVwiY2FudG9oZWFkXCI+Q0FOVE8gSUlJPC9wPjxwIGNsYXNzPVwic3VtbWFyeVwiPkluc2NyaXB0aW9uIG92ZXIgdGhlIEdhdGUgb2YgSGVsbCwgYW5kIHRoZSBpbXByZXNzaW9uIGl0IHByb2R1Y2VzIHVwb24gRGFudGUuIFZpcmdpbCB0YWtlcyBoaW0gYnkgdGhlIGhhbmQsIGFuZCBsZWFkcyBoaW0gaW4uIFRoZSBkaXNtYWwgc291bmRzIG1ha2UgaGltIGJ1cnN0IGludG8gdGVhcnMuIEhpcyBoZWFkIGlzIHF1aXRlIGJld2lsZGVyZWQuIFVwb24gYSBEYXJrIFBsYWluLCB3aGljaCBnb2VzIGFyb3VuZCB0aGUgY29uZmluZXMsIGhlIHNlZXMgYSB2YXN0IG11bHRpdHVkZSBvZiBzcGlyaXRzIHJ1bm5pbmcgYmVoaW5kIGEgZmxhZyBpbiBncmVhdCBoYXN0ZSBhbmQgY29uZnVzaW9uLCB1cmdlZCBvbiBieSBmdXJpb3VzIHdhc3BzIGFuZCBob3JuZXRzLiBUaGVzZSBhcmUgdGhlIHVuaGFwcHkgcGVvcGxlLCB3aG8gbmV2ZXIgd2VyZSBhbGl2ZSZtZGFzaDtuZXZlciBhd2FrZW5lZCB0byB0YWtlIGFueSBwYXJ0IGluIGVpdGhlciBnb29kIG9yIGV2aWwsIHRvIGNhcmUgZm9yIGFueXRoaW5nIGJ1dCB0aGVtc2VsdmVzLiBUaGV5IGFyZSBtaXhlZCB3aXRoIGEgc2ltaWxhciBjbGFzcyBvZiBmYWxsZW4gYW5nZWxzLiBBZnRlciBwYXNzaW5nIHRocm91Z2ggdGhlIGNyb3dkIG9mIHRoZW0sIHRoZSBQb2V0cyBjb21lIHRvIGEgZ3JlYXQgUml2ZXIsIHdoaWNoIGZsb3dzIHJvdW5kIHRoZSBicmltIG9mIEhlbGw7IGFuZCB0aGVuIGRlc2NlbmRzIHRvIGZvcm0gdGhlIG90aGVyIHJpdmVycywgdGhlIG1hcnNoZXMsIGFuZCB0aGUgaWNlIHRoYXQgd2Ugc2hhbGwgbWVldCB3aXRoLiBJdCBpcyB0aGUgcml2ZXIgQWNoZXJvbjsgYW5kIG9uIGl0cyBTaG9yZSBhbGwgdGhhdCBkaWUgdW5kZXIgdGhlIHdyYXRoIG9mIEdvZCBhc3NlbWJsZSBmcm9tIGV2ZXJ5IGNvdW50cnkgdG8gYmUgZmVycmllZCBvdmVyIGJ5IHRoZSBkZW1vbiBDaGFyb24uIEhlIG1ha2VzIHRoZW0gZW50ZXIgaGlzIGJvYXQgYnkgZ2xhcmluZyBvbiB0aGVtIHdpdGggaGlzIGJ1cm5pbmcgZXllcy4gSGF2aW5nIHNlZW4gdGhlc2UsIGFuZCBiZWluZyByZWZ1c2VkIGEgcGFzc2FnZSBieSBDaGFyb24sIERhbnRlIGlzIHN1ZGRlbmx5IHN0dW5uZWQgYnkgYSB2aW9sZW50IHRyZW1ibGluZyBvZiB0aGUgZ3JvdW5kLCBhY2NvbXBhbmllZCB3aXRoIHdpbmQgYW5kIGxpZ2h0bmluZywgYW5kIGZhbGxzIGRvd24gaW4gYSBzdGF0ZSBvZiBpbnNlbnNpYmlsaXR5LjwvcD48cD5USyE8L3A+J107XG5cbm1vZHVsZS5leHBvcnRzID0gY2FybHlsZTtcbiIsIi8vIGl0YWxpYW4uanNcblxudmFyIGl0YWxpYW4gPSBbJzxwIGNsYXNzPVwidGl0bGVcIj5JbmZlcm5vPC9wPjxwIGNsYXNzPVwiYXV0aG9yXCI+RGFudGUgQWxpZ2hpZXJpPC9wPicsXG5cblx0JzxwIGNsYXNzPVwiY2FudG9oZWFkXCI+MTwvcD48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+TmVsIG1lenpvIGRlbCBjYW1taW4gZGkgbm9zdHJhIHZpdGE8L3A+PHA+bWkgcml0cm92YWkgcGVyIHVuYSBzZWx2YSBvc2N1cmEsPC9wPjxwPmNoJmVhY3V0ZTsgbGEgZGlyaXR0YSB2aWEgZXJhIHNtYXJyaXRhLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QWhpIHF1YW50byBhIGRpciBxdWFsIGVyYSAmZWdyYXZlOyBjb3NhIGR1cmE8L3A+PHA+ZXN0YSBzZWx2YSBzZWx2YWdnaWEgZSBhc3ByYSBlIGZvcnRlPC9wPjxwPmNoZSBuZWwgcGVuc2llciByaW5vdmEgbGEgcGF1cmEhPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5UYW50JnJzcXVvOyAmZWdyYXZlOyBhbWFyYSBjaGUgcG9jbyAmZWdyYXZlOyBwaSZ1Z3JhdmU7IG1vcnRlOzwvcD48cD5tYSBwZXIgdHJhdHRhciBkZWwgYmVuIGNoJnJzcXVvO2kmcnNxdW87IHZpIHRyb3ZhaSw8L3A+PHA+ZGlyJm9ncmF2ZTsgZGUgbCZyc3F1bzthbHRyZSBjb3NlIGNoJnJzcXVvO2kmcnNxdW87IHYmcnNxdW87aG8gc2NvcnRlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+SW8gbm9uIHNvIGJlbiByaWRpciBjb20mcnNxdW87IGkmcnNxdW87IHYmcnNxdW87aW50cmFpLDwvcD48cD50YW50JnJzcXVvOyBlcmEgcGllbiBkaSBzb25ubyBhIHF1ZWwgcHVudG88L3A+PHA+Y2hlIGxhIHZlcmFjZSB2aWEgYWJiYW5kb25haS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk1hIHBvaSBjaCZyc3F1bztpJnJzcXVvOyBmdWkgYWwgcGkmZWdyYXZlOyBkJnJzcXVvO3VuIGNvbGxlIGdpdW50byw8L3A+PHA+bCZhZ3JhdmU7IGRvdmUgdGVybWluYXZhIHF1ZWxsYSB2YWxsZTwvcD48cD5jaGUgbSZyc3F1bzthdmVhIGRpIHBhdXJhIGlsIGNvciBjb21wdW50byw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPmd1YXJkYWkgaW4gYWx0byBlIHZpZGkgbGUgc3VlIHNwYWxsZTwvcD48cD52ZXN0aXRlIGdpJmFncmF2ZTsgZGUmcnNxdW87IHJhZ2dpIGRlbCBwaWFuZXRhPC9wPjxwPmNoZSBtZW5hIGRyaXR0byBhbHRydWkgcGVyIG9nbmUgY2FsbGUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbGxvciBmdSBsYSBwYXVyYSB1biBwb2NvIHF1ZXRhLDwvcD48cD5jaGUgbmVsIGxhZ28gZGVsIGNvciBtJnJzcXVvO2VyYSBkdXJhdGE8L3A+PHA+bGEgbm90dGUgY2gmcnNxdW87aSZyc3F1bzsgcGFzc2FpIGNvbiB0YW50YSBwaWV0YS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkUgY29tZSBxdWVpIGNoZSBjb24gbGVuYSBhZmZhbm5hdGEsPC9wPjxwPnVzY2l0byBmdW9yIGRlbCBwZWxhZ28gYSBsYSByaXZhLDwvcD48cD5zaSB2b2xnZSBhIGwmcnNxdW87YWNxdWEgcGVyaWdsaW9zYSBlIGd1YXRhLDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+Y29zJmlncmF2ZTsgbCZyc3F1bzthbmltbyBtaW8sIGNoJnJzcXVvO2FuY29yIGZ1Z2dpdmEsPC9wPjxwPnNpIHZvbHNlIGEgcmV0cm8gYSByaW1pcmFyIGxvIHBhc3NvPC9wPjxwPmNoZSBub24gbGFzY2kmb2dyYXZlOyBnaSZhZ3JhdmU7IG1haSBwZXJzb25hIHZpdmEuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5Qb2kgY2gmcnNxdW87JmVncmF2ZTtpIHBvc2F0byB1biBwb2NvIGlsIGNvcnBvIGxhc3NvLDwvcD48cD5yaXByZXNpIHZpYSBwZXIgbGEgcGlhZ2dpYSBkaXNlcnRhLDwvcD48cD5zJmlncmF2ZTsgY2hlICZyc3F1bztsIHBpJmVncmF2ZTsgZmVybW8gc2VtcHJlIGVyYSAmcnNxdW87bCBwaSZ1Z3JhdmU7IGJhc3NvLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RWQgZWNjbywgcXVhc2kgYWwgY29taW5jaWFyIGRlIGwmcnNxdW87ZXJ0YSw8L3A+PHA+dW5hIGxvbnphIGxlZ2dlcmEgZSBwcmVzdGEgbW9sdG8sPC9wPjxwPmNoZSBkaSBwZWwgbWFjb2xhdG8gZXJhIGNvdmVydGE7PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5lIG5vbiBtaSBzaSBwYXJ0aWEgZGluYW56aSBhbCB2b2x0byw8L3A+PHA+YW56aSAmcnNxdW87bXBlZGl2YSB0YW50byBpbCBtaW8gY2FtbWlubyw8L3A+PHA+Y2gmcnNxdW87aSZyc3F1bzsgZnVpIHBlciByaXRvcm5hciBwaSZ1Z3JhdmU7IHZvbHRlIHYmb2dyYXZlO2x0by48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRlbXAmcnNxdW87IGVyYSBkYWwgcHJpbmNpcGlvIGRlbCBtYXR0aW5vLDwvcD48cD5lICZyc3F1bztsIHNvbCBtb250YXZhICZyc3F1bztuIHMmdWdyYXZlOyBjb24gcXVlbGxlIHN0ZWxsZTwvcD48cD5jaCZyc3F1bztlcmFuIGNvbiBsdWkgcXVhbmRvIGwmcnNxdW87YW1vciBkaXZpbm88L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPm1vc3NlIGRpIHByaW1hIHF1ZWxsZSBjb3NlIGJlbGxlOzwvcD48cD5zJmlncmF2ZTsgY2gmcnNxdW87YSBiZW5lIHNwZXJhciBtJnJzcXVvO2VyYSBjYWdpb25lPC9wPjxwPmRpIHF1ZWxsYSBmaWVyYSBhIGxhIGdhZXR0YSBwZWxsZTwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+bCZyc3F1bztvcmEgZGVsIHRlbXBvIGUgbGEgZG9sY2Ugc3RhZ2lvbmU7PC9wPjxwPm1hIG5vbiBzJmlncmF2ZTsgY2hlIHBhdXJhIG5vbiBtaSBkZXNzZTwvcD48cD5sYSB2aXN0YSBjaGUgbSZyc3F1bzthcHBhcnZlIGQmcnNxdW87dW4gbGVvbmUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5RdWVzdGkgcGFyZWEgY2hlIGNvbnRyYSBtZSB2ZW5pc3NlPC9wPjxwPmNvbiBsYSB0ZXN0JnJzcXVvOyBhbHRhIGUgY29uIHJhYmJpb3NhIGZhbWUsPC9wPjxwPnMmaWdyYXZlOyBjaGUgcGFyZWEgY2hlIGwmcnNxdW87YWVyZSBuZSB0cmVtZXNzZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkVkIHVuYSBsdXBhLCBjaGUgZGkgdHV0dGUgYnJhbWU8L3A+PHA+c2VtYmlhdmEgY2FyY2EgbmUgbGEgc3VhIG1hZ3JlenphLDwvcD48cD5lIG1vbHRlIGdlbnRpIGYmZWFjdXRlOyBnaSZhZ3JhdmU7IHZpdmVyIGdyYW1lLDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+cXVlc3RhIG1pIHBvcnNlIHRhbnRvIGRpIGdyYXZlenphPC9wPjxwPmNvbiBsYSBwYXVyYSBjaCZyc3F1bzt1c2NpYSBkaSBzdWEgdmlzdGEsPC9wPjxwPmNoJnJzcXVvO2lvIHBlcmRlaSBsYSBzcGVyYW56YSBkZSBsJnJzcXVvO2FsdGV6emEuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5FIHF1YWwgJmVncmF2ZTsgcXVlaSBjaGUgdm9sb250aWVyaSBhY3F1aXN0YSw8L3A+PHA+ZSBnaXVnbmUgJnJzcXVvO2wgdGVtcG8gY2hlIHBlcmRlciBsbyBmYWNlLDwvcD48cD5jaGUgJnJzcXVvO24gdHV0dGkgc3VvaSBwZW5zaWVyIHBpYW5nZSBlIHMmcnNxdW87YXR0cmlzdGE7PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD50YWwgbWkgZmVjZSBsYSBiZXN0aWEgc2FuemEgcGFjZSw8L3A+PHA+Y2hlLCB2ZW5lbmRvbWkgJnJzcXVvO25jb250cm8sIGEgcG9jbyBhIHBvY288L3A+PHA+bWkgcmlwaWduZXZhIGwmYWdyYXZlOyBkb3ZlICZyc3F1bztsIHNvbCB0YWNlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+TWVudHJlIGNoJnJzcXVvO2kmcnNxdW87IHJvdmluYXZhIGluIGJhc3NvIGxvY28sPC9wPjxwPmRpbmFuemkgYSBsaSBvY2NoaSBtaSBzaSBmdSBvZmZlcnRvPC9wPjxwPmNoaSBwZXIgbHVuZ28gc2lsZW56aW8gcGFyZWEgZmlvY28uPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5RdWFuZG8gdmlkaSBjb3N0dWkgbmVsIGdyYW4gZGlzZXJ0byw8L3A+PHA+JmxhcXVvO01pc2VyZXJlIGRpIG1lJnJhcXVvOywgZ3JpZGFpIGEgbHVpLDwvcD48cD4mbGFxdW87cXVhbCBjaGUgdHUgc2lpLCBvZCBvbWJyYSBvZCBvbW8gY2VydG8hJnJhcXVvOy48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlJpc3B1b3NlbWk6ICZsYXF1bztOb24gb21vLCBvbW8gZ2kmYWdyYXZlOyBmdWksPC9wPjxwPmUgbGkgcGFyZW50aSBtaWVpIGZ1cm9uIGxvbWJhcmRpLDwvcD48cD5tYW50b2FuaSBwZXIgcGF0ciZpdW1sO2EgYW1iZWR1aS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk5hY3F1aSBzdWIgSXVsaW8sIGFuY29yIGNoZSBmb3NzZSB0YXJkaSw8L3A+PHA+ZSB2aXNzaSBhIFJvbWEgc290dG8gJnJzcXVvO2wgYnVvbm8gQXVndXN0bzwvcD48cD5uZWwgdGVtcG8gZGUgbGkgZCZlZ3JhdmU7aSBmYWxzaSBlIGJ1Z2lhcmRpLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UG9ldGEgZnVpLCBlIGNhbnRhaSBkaSBxdWVsIGdpdXN0bzwvcD48cD5maWdsaXVvbCBkJnJzcXVvO0FuY2hpc2UgY2hlIHZlbm5lIGRpIFRyb2lhLDwvcD48cD5wb2kgY2hlICZyc3F1bztsIHN1cGVyYm8gSWwmaXVtbDsmb2FjdXRlO24gZnUgY29tYnVzdG8uPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5NYSB0dSBwZXJjaCZlYWN1dGU7IHJpdG9ybmkgYSB0YW50YSBub2lhPzwvcD48cD5wZXJjaCZlYWN1dGU7IG5vbiBzYWxpIGlsIGRpbGV0dG9zbyBtb250ZTwvcD48cD5jaCZyc3F1bzsmZWdyYXZlOyBwcmluY2lwaW8gZSBjYWdpb24gZGkgdHV0dGEgZ2lvaWE/JnJhcXVvOy48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPiZsYXF1bztPciBzZSZyc3F1bzsgdHUgcXVlbCBWaXJnaWxpbyBlIHF1ZWxsYSBmb250ZTwvcD48cD5jaGUgc3BhbmRpIGRpIHBhcmxhciBzJmlncmF2ZTsgbGFyZ28gZml1bWU/JnJhcXVvOyw8L3A+PHA+cmlzcHVvcyZyc3F1bzsgaW8gbHVpIGNvbiB2ZXJnb2dub3NhIGZyb250ZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPiZsYXF1bztPIGRlIGxpIGFsdHJpIHBvZXRpIG9ub3JlIGUgbHVtZSw8L3A+PHA+dmFnbGlhbWkgJnJzcXVvO2wgbHVuZ28gc3R1ZGlvIGUgJnJzcXVvO2wgZ3JhbmRlIGFtb3JlPC9wPjxwPmNoZSBtJnJzcXVvO2hhIGZhdHRvIGNlcmNhciBsbyB0dW8gdm9sdW1lLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VHUgc2UmcnNxdW87IGxvIG1pbyBtYWVzdHJvIGUgJnJzcXVvO2wgbWlvIGF1dG9yZSw8L3A+PHA+dHUgc2UmcnNxdW87IHNvbG8gY29sdWkgZGEgY3UmcnNxdW87IGlvIHRvbHNpPC9wPjxwPmxvIGJlbGxvIHN0aWxvIGNoZSBtJnJzcXVvO2hhIGZhdHRvIG9ub3JlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VmVkaSBsYSBiZXN0aWEgcGVyIGN1JnJzcXVvOyBpbyBtaSB2b2xzaTs8L3A+PHA+YWl1dGFtaSBkYSBsZWksIGZhbW9zbyBzYWdnaW8sPC9wPjxwPmNoJnJzcXVvO2VsbGEgbWkgZmEgdHJlbWFyIGxlIHZlbmUgZSBpIHBvbHNpJnJhcXVvOy48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPiZsYXF1bztBIHRlIGNvbnZpZW4gdGVuZXJlIGFsdHJvIHYmaXVtbDthZ2dpbyZyYXF1bzssPC9wPjxwPnJpc3B1b3NlLCBwb2kgY2hlIGxhZ3JpbWFyIG1pIHZpZGUsPC9wPjxwPiZsYXF1bztzZSB2dW8mcnNxdW87IGNhbXBhciBkJnJzcXVvO2VzdG8gbG9jbyBzZWx2YWdnaW87PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5jaCZlYWN1dGU7IHF1ZXN0YSBiZXN0aWEsIHBlciBsYSBxdWFsIHR1IGdyaWRlLDwvcD48cD5ub24gbGFzY2lhIGFsdHJ1aSBwYXNzYXIgcGVyIGxhIHN1YSB2aWEsPC9wPjxwPm1hIHRhbnRvIGxvICZyc3F1bzttcGVkaXNjZSBjaGUgbCZyc3F1bzt1Y2NpZGU7PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5lIGhhIG5hdHVyYSBzJmlncmF2ZTsgbWFsdmFnaWEgZSByaWEsPC9wPjxwPmNoZSBtYWkgbm9uIGVtcGllIGxhIGJyYW1vc2Egdm9nbGlhLDwvcD48cD5lIGRvcG8gJnJzcXVvO2wgcGFzdG8gaGEgcGkmdWdyYXZlOyBmYW1lIGNoZSBwcmlhLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+TW9sdGkgc29uIGxpIGFuaW1hbGkgYSBjdWkgcyZyc3F1bzthbW1vZ2xpYSw8L3A+PHA+ZSBwaSZ1Z3JhdmU7IHNhcmFubm8gYW5jb3JhLCBpbmZpbiBjaGUgJnJzcXVvO2wgdmVsdHJvPC9wPjxwPnZlcnImYWdyYXZlOywgY2hlIGxhIGZhciZhZ3JhdmU7IG1vcmlyIGNvbiBkb2dsaWEuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5RdWVzdGkgbm9uIGNpYmVyJmFncmF2ZTsgdGVycmEgbiZlYWN1dGU7IHBlbHRybyw8L3A+PHA+bWEgc2FwJml1bWw7ZW56YSwgYW1vcmUgZSB2aXJ0dXRlLDwvcD48cD5lIHN1YSBuYXppb24gc2FyJmFncmF2ZTsgdHJhIGZlbHRybyBlIGZlbHRyby48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkRpIHF1ZWxsYSB1bWlsZSBJdGFsaWEgZmlhIHNhbHV0ZTwvcD48cD5wZXIgY3VpIG1vciZpZ3JhdmU7IGxhIHZlcmdpbmUgQ2FtbWlsbGEsPC9wPjxwPkV1cmlhbG8gZSBUdXJubyBlIE5pc28gZGkgZmVydXRlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UXVlc3RpIGxhIGNhY2NlciZhZ3JhdmU7IHBlciBvZ25lIHZpbGxhLDwvcD48cD5maW4gY2hlIGwmcnNxdW87YXZyJmFncmF2ZTsgcmltZXNzYSBuZSBsbyAmcnNxdW87bmZlcm5vLDwvcD48cD5sJmFncmF2ZTsgb25kZSAmcnNxdW87bnZpZGlhIHByaW1hIGRpcGFydGlsbGEuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5PbmQmcnNxdW87IGlvIHBlciBsbyB0dW8gbWUmcnNxdW87IHBlbnNvIGUgZGlzY2Vybm88L3A+PHA+Y2hlIHR1IG1pIHNlZ3VpLCBlIGlvIHNhciZvZ3JhdmU7IHR1YSBndWlkYSw8L3A+PHA+ZSB0cmFycm90dGkgZGkgcXVpIHBlciBsb2NvIGV0dGVybm87PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5vdmUgdWRpcmFpIGxlIGRpc3BlcmF0ZSBzdHJpZGEsPC9wPjxwPnZlZHJhaSBsaSBhbnRpY2hpIHNwaXJpdGkgZG9sZW50aSw8L3A+PHA+Y2gmcnNxdW87YSBsYSBzZWNvbmRhIG1vcnRlIGNpYXNjdW4gZ3JpZGE7PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5lIHZlZGVyYWkgY29sb3IgY2hlIHNvbiBjb250ZW50aTwvcD48cD5uZWwgZm9jbywgcGVyY2gmZWFjdXRlOyBzcGVyYW4gZGkgdmVuaXJlPC9wPjxwPnF1YW5kbyBjaGUgc2lhIGEgbGUgYmVhdGUgZ2VudGkuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BIGxlIHF1YWkgcG9pIHNlIHR1IHZvcnJhaSBzYWxpcmUsPC9wPjxwPmFuaW1hIGZpYSBhIGNpJm9ncmF2ZTsgcGkmdWdyYXZlOyBkaSBtZSBkZWduYTo8L3A+PHA+Y29uIGxlaSB0aSBsYXNjZXImb2dyYXZlOyBuZWwgbWlvIHBhcnRpcmU7PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5jaCZlYWN1dGU7IHF1ZWxsbyBpbXBlcmFkb3IgY2hlIGwmYWdyYXZlOyBzJnVncmF2ZTsgcmVnbmEsPC9wPjxwPnBlcmNoJnJzcXVvOyBpJnJzcXVvOyBmdSZyc3F1bzsgcmliZWxsYW50ZSBhIGxhIHN1YSBsZWdnZSw8L3A+PHA+bm9uIHZ1b2wgY2hlICZyc3F1bztuIHN1YSBjaXR0JmFncmF2ZTsgcGVyIG1lIHNpIHZlZ25hLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+SW4gdHV0dGUgcGFydGkgaW1wZXJhIGUgcXVpdmkgcmVnZ2U7PC9wPjxwPnF1aXZpICZlZ3JhdmU7IGxhIHN1YSBjaXR0JmFncmF2ZTsgZSBsJnJzcXVvO2FsdG8gc2VnZ2lvOjwvcD48cD5vaCBmZWxpY2UgY29sdWkgY3UmcnNxdW87IGl2aSBlbGVnZ2UhJnJhcXVvOy48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkUgaW8gYSBsdWk6ICZsYXF1bztQb2V0YSwgaW8gdGkgcmljaGVnZ2lvPC9wPjxwPnBlciBxdWVsbG8gRGlvIGNoZSB0dSBub24gY29ub3NjZXN0aSw8L3A+PHA+YWNjaSZvZ3JhdmU7IGNoJnJzcXVvO2lvIGZ1Z2dhIHF1ZXN0byBtYWxlIGUgcGVnZ2lvLDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+Y2hlIHR1IG1pIG1lbmkgbCZhZ3JhdmU7IGRvdiZyc3F1bzsgb3IgZGljZXN0aSw8L3A+PHA+cyZpZ3JhdmU7IGNoJnJzcXVvO2lvIHZlZ2dpYSBsYSBwb3J0YSBkaSBzYW4gUGlldHJvPC9wPjxwPmUgY29sb3IgY3VpIHR1IGZhaSBjb3RhbnRvIG1lc3RpJnJhcXVvOy48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFsbG9yIHNpIG1vc3NlLCBlIGlvIGxpIHRlbm5pIGRpZXRyby48L3A+PC9kaXY+JyxcblxuXHQnPHAgY2xhc3M9XCJjYW50b2hlYWRcIj4yPC9wPlx0PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkxvIGdpb3JubyBzZSBuJnJzcXVvO2FuZGF2YSwgZSBsJnJzcXVvO2FlcmUgYnJ1bm88L3A+PHA+dG9nbGlldmEgbGkgYW5pbWFpIGNoZSBzb25vIGluIHRlcnJhPC9wPjxwPmRhIGxlIGZhdGljaGUgbG9ybzsgZSBpbyBzb2wgdW5vPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5tJnJzcXVvO2FwcGFyZWNjaGlhdmEgYSBzb3N0ZW5lciBsYSBndWVycmE8L3A+PHA+cyZpZ3JhdmU7IGRlbCBjYW1taW5vIGUgcyZpZ3JhdmU7IGRlIGxhIHBpZXRhdGUsPC9wPjxwPmNoZSByaXRyYXJyJmFncmF2ZTsgbGEgbWVudGUgY2hlIG5vbiBlcnJhLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+TyBtdXNlLCBvIGFsdG8gaW5nZWdubywgb3IgbSZyc3F1bzthaXV0YXRlOzwvcD48cD5vIG1lbnRlIGNoZSBzY3JpdmVzdGkgY2kmb2dyYXZlOyBjaCZyc3F1bztpbyB2aWRpLDwvcD48cD5xdWkgc2kgcGFyciZhZ3JhdmU7IGxhIHR1YSBub2JpbGl0YXRlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+SW8gY29taW5jaWFpOiAmbGFxdW87UG9ldGEgY2hlIG1pIGd1aWRpLDwvcD48cD5ndWFyZGEgbGEgbWlhIHZpcnQmdWdyYXZlOyBzJnJzcXVvO2VsbCZyc3F1bzsgJmVncmF2ZTsgcG9zc2VudGUsPC9wPjxwPnByaW1hIGNoJnJzcXVvO2EgbCZyc3F1bzthbHRvIHBhc3NvIHR1IG1pIGZpZGkuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5UdSBkaWNpIGNoZSBkaSBTaWx2Jml1bWw7byBpbCBwYXJlbnRlLDwvcD48cD5jb3JydXR0aWJpbGUgYW5jb3JhLCBhZCBpbW1vcnRhbGU8L3A+PHA+c2Vjb2xvIGFuZCZvZ3JhdmU7LCBlIGZ1IHNlbnNpYmlsbWVudGUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5QZXImb2dyYXZlOywgc2UgbCZyc3F1bzthdnZlcnNhcmlvIGQmcnNxdW87b2duZSBtYWxlPC9wPjxwPmNvcnRlc2UgaSBmdSwgcGVuc2FuZG8gbCZyc3F1bzthbHRvIGVmZmV0dG88L3A+PHA+Y2gmcnNxdW87dXNjaXIgZG92ZWEgZGkgbHVpLCBlICZyc3F1bztsIGNoaSBlICZyc3F1bztsIHF1YWxlPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5ub24gcGFyZSBpbmRlZ25vIGFkIG9tbyBkJnJzcXVvO2ludGVsbGV0dG87PC9wPjxwPmNoJnJzcXVvO2UmcnNxdW87IGZ1IGRlIGwmcnNxdW87YWxtYSBSb21hIGUgZGkgc3VvIGltcGVybzwvcD48cD5uZSBsJnJzcXVvO2VtcGlyZW8gY2llbCBwZXIgcGFkcmUgZWxldHRvOjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+bGEgcXVhbGUgZSAmcnNxdW87bCBxdWFsZSwgYSB2b2xlciBkaXIgbG8gdmVybyw8L3A+PHA+ZnUgc3RhYmlsaXRhIHBlciBsbyBsb2NvIHNhbnRvPC9wPjxwPnUmcnNxdW87IHNpZWRlIGlsIHN1Y2Nlc3NvciBkZWwgbWFnZ2lvciBQaWVyby48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlBlciBxdWVzdCZyc3F1bzsgYW5kYXRhIG9uZGUgbGkgZGFpIHR1IHZhbnRvLDwvcD48cD5pbnRlc2UgY29zZSBjaGUgZnVyb24gY2FnaW9uZTwvcD48cD5kaSBzdWEgdml0dG9yaWEgZSBkZWwgcGFwYWxlIGFtbWFudG8uPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbmRvdnZpIHBvaSBsbyBWYXMgZCZyc3F1bztlbGV6Jml1bWw7b25lLDwvcD48cD5wZXIgcmVjYXJuZSBjb25mb3J0byBhIHF1ZWxsYSBmZWRlPC9wPjxwPmNoJnJzcXVvOyZlZ3JhdmU7IHByaW5jaXBpbyBhIGxhIHZpYSBkaSBzYWx2YXppb25lLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+TWEgaW8sIHBlcmNoJmVhY3V0ZTsgdmVuaXJ2aT8gbyBjaGkgJnJzcXVvO2wgY29uY2VkZT88L3A+PHA+SW8gbm9uIEVuw6thLCBpbyBub24gUGF1bG8gc29ubzs8L3A+PHA+bWUgZGVnbm8gYSBjaSZvZ3JhdmU7IG4mZWFjdXRlOyBpbyBuJmVhY3V0ZTsgYWx0cmkgJnJzcXVvO2wgY3JlZGUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5QZXIgY2hlLCBzZSBkZWwgdmVuaXJlIGlvIG0mcnNxdW87YWJiYW5kb25vLDwvcD48cD50ZW1vIGNoZSBsYSB2ZW51dGEgbm9uIHNpYSBmb2xsZS48L3A+PHA+U2UmcnNxdW87IHNhdmlvOyBpbnRlbmRpIG1lJnJzcXVvOyBjaCZyc3F1bztpJnJzcXVvOyBub24gcmFnaW9ubyZyYXF1bzsuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5FIHF1YWwgJmVncmF2ZTsgcXVlaSBjaGUgZGlzdnVvbCBjaSZvZ3JhdmU7IGNoZSB2b2xsZTwvcD48cD5lIHBlciBub3ZpIHBlbnNpZXIgY2FuZ2lhIHByb3Bvc3RhLDwvcD48cD5zJmlncmF2ZTsgY2hlIGRhbCBjb21pbmNpYXIgdHV0dG8gc2kgdG9sbGUsPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD50YWwgbWkgZmVjJnJzcXVvOyAmaXVtbDtvICZyc3F1bztuIHF1ZWxsYSBvc2N1cmEgY29zdGEsPC9wPjxwPnBlcmNoJmVhY3V0ZTssIHBlbnNhbmRvLCBjb25zdW1haSBsYSAmcnNxdW87bXByZXNhPC9wPjxwPmNoZSBmdSBuZWwgY29taW5jaWFyIGNvdGFudG8gdG9zdGEuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD4mbGFxdW87UyZyc3F1bztpJnJzcXVvOyBobyBiZW4gbGEgcGFyb2xhIHR1YSBpbnRlc2EmcmFxdW87LDwvcD48cD5yaXNwdW9zZSBkZWwgbWFnbmFuaW1vIHF1ZWxsJnJzcXVvOyBvbWJyYSw8L3A+PHA+JmxhcXVvO2wmcnNxdW87YW5pbWEgdHVhICZlZ3JhdmU7IGRhIHZpbHRhZGUgb2ZmZXNhOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+bGEgcXVhbCBtb2x0ZSBmJml1bWw7YXRlIGwmcnNxdW87b21vIGluZ29tYnJhPC9wPjxwPnMmaWdyYXZlOyBjaGUgZCZyc3F1bztvbnJhdGEgaW1wcmVzYSBsbyByaXZvbHZlLDwvcD48cD5jb21lIGZhbHNvIHZlZGVyIGJlc3RpYSBxdWFuZCZyc3F1bzsgb21icmEuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5EYSBxdWVzdGEgdGVtYSBhY2NpJm9ncmF2ZTsgY2hlIHR1IHRpIHNvbHZlLDwvcD48cD5kaXJvdHRpIHBlcmNoJnJzcXVvOyBpbyB2ZW5uaSBlIHF1ZWwgY2gmcnNxdW87aW8gJnJzcXVvO250ZXNpPC9wPjxwPm5lbCBwcmltbyBwdW50byBjaGUgZGkgdGUgbWkgZG9sdmUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5JbyBlcmEgdHJhIGNvbG9yIGNoZSBzb24gc29zcGVzaSw8L3A+PHA+ZSBkb25uYSBtaSBjaGlhbSZvZ3JhdmU7IGJlYXRhIGUgYmVsbGEsPC9wPjxwPnRhbCBjaGUgZGkgY29tYW5kYXJlIGlvIGxhIHJpY2hpZXNpLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+THVjZXZhbiBsaSBvY2NoaSBzdW9pIHBpJnVncmF2ZTsgY2hlIGxhIHN0ZWxsYTs8L3A+PHA+ZSBjb21pbmNpb21taSBhIGRpciBzb2F2ZSBlIHBpYW5hLDwvcD48cD5jb24gYW5nZWxpY2Egdm9jZSwgaW4gc3VhIGZhdmVsbGE6PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD7igJxPIGFuaW1hIGNvcnRlc2UgbWFudG9hbmEsPC9wPjxwPmRpIGN1aSBsYSBmYW1hIGFuY29yIG5lbCBtb25kbyBkdXJhLDwvcD48cD5lIGR1cmVyJmFncmF2ZTsgcXVhbnRvICZyc3F1bztsIG1vbmRvIGxvbnRhbmEsPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5sJnJzcXVvO2FtaWNvIG1pbywgZSBub24gZGUgbGEgdmVudHVyYSw8L3A+PHA+bmUgbGEgZGlzZXJ0YSBwaWFnZ2lhICZlZ3JhdmU7IGltcGVkaXRvPC9wPjxwPnMmaWdyYXZlOyBuZWwgY2FtbWluLCBjaGUgdiZvZ3JhdmU7bHQmcnNxdW87ICZlZ3JhdmU7IHBlciBwYXVyYTs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPmUgdGVtbyBjaGUgbm9uIHNpYSBnaSZhZ3JhdmU7IHMmaWdyYXZlOyBzbWFycml0byw8L3A+PHA+Y2gmcnNxdW87aW8gbWkgc2lhIHRhcmRpIGFsIHNvY2NvcnNvIGxldmF0YSw8L3A+PHA+cGVyIHF1ZWwgY2gmcnNxdW87aSZyc3F1bzsgaG8gZGkgbHVpIG5lbCBjaWVsbyB1ZGl0by48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk9yIG1vdmksIGUgY29uIGxhIHR1YSBwYXJvbGEgb3JuYXRhPC9wPjxwPmUgY29uIGNpJm9ncmF2ZTsgYyZyc3F1bztoYSBtZXN0aWVyaSBhbCBzdW8gY2FtcGFyZSw8L3A+PHA+bCZyc3F1bzthaXV0YSBzJmlncmF2ZTsgY2gmcnNxdW87aSZyc3F1bzsgbmUgc2lhIGNvbnNvbGF0YS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkkmcnNxdW87IHNvbiBCZWF0cmljZSBjaGUgdGkgZmFjY2lvIGFuZGFyZTs8L3A+PHA+dmVnbm8gZGVsIGxvY28gb3ZlIHRvcm5hciBkaXNpbzs8L3A+PHA+YW1vciBtaSBtb3NzZSwgY2hlIG1pIGZhIHBhcmxhcmUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5RdWFuZG8gc2FyJm9ncmF2ZTsgZGluYW56aSBhbCBzZWdub3IgbWlvLDwvcD48cD5kaSB0ZSBtaSBsb2RlciZvZ3JhdmU7IHNvdmVudGUgYSBsdWnigJ0uPC9wPjxwPlRhY2V0dGUgYWxsb3JhLCBlIHBvaSBjb21pbmNpYSZyc3F1bzsgaW86PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD7igJxPIGRvbm5hIGRpIHZpcnQmdWdyYXZlOyBzb2xhIHBlciBjdWk8L3A+PHA+bCZyc3F1bzt1bWFuYSBzcGV6aWUgZWNjZWRlIG9nbmUgY29udGVudG88L3A+PHA+ZGkgcXVlbCBjaWVsIGMmcnNxdW87aGEgbWlub3IgbGkgY2VyY2hpIHN1aSw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPnRhbnRvIG0mcnNxdW87YWdncmFkYSBpbCB0dW8gY29tYW5kYW1lbnRvLDwvcD48cD5jaGUgbCZyc3F1bzt1YmlkaXIsIHNlIGdpJmFncmF2ZTsgZm9zc2UsIG0mcnNxdW87JmVncmF2ZTsgdGFyZGk7PC9wPjxwPnBpJnVncmF2ZTsgbm9uIHQmcnNxdW87JmVncmF2ZTsgdW8mcnNxdW87IGNoJnJzcXVvO2FwcmlybWkgaWwgdHVvIHRhbGVudG8uPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5NYSBkaW1taSBsYSBjYWdpb24gY2hlIG5vbiB0aSBndWFyZGk8L3A+PHA+ZGUgbG8gc2NlbmRlciBxdWEgZ2l1c28gaW4gcXVlc3RvIGNlbnRybzwvcD48cD5kZSBsJnJzcXVvO2FtcGlvIGxvY28gb3ZlIHRvcm5hciB0dSBhcmRp4oCdLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+4oCcRGEgY2hlIHR1IHZ1byZyc3F1bzsgc2F2ZXIgY290YW50byBhIGRlbnRybyw8L3A+PHA+ZGlyb3R0aSBicmlldmVtZW50ZeKAnSwgbWkgcmlzcHVvc2UsPC9wPjxwPuKAnHBlcmNoJnJzcXVvOyBpJnJzcXVvOyBub24gdGVtbyBkaSB2ZW5pciBxdWEgZW50cm8uPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5UZW1lciBzaSBkZWUgZGkgc29sZSBxdWVsbGUgY29zZTwvcD48cD5jJnJzcXVvO2hhbm5vIHBvdGVuemEgZGkgZmFyZSBhbHRydWkgbWFsZTs8L3A+PHA+ZGUgbCZyc3F1bzthbHRyZSBubywgY2gmZWFjdXRlOyBub24gc29uIHBhdXJvc2UuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5JJnJzcXVvOyBzb24gZmF0dGEgZGEgRGlvLCBzdWEgbWVyYyZlYWN1dGU7LCB0YWxlLDwvcD48cD5jaGUgbGEgdm9zdHJhIG1pc2VyaWEgbm9uIG1pIHRhbmdlLDwvcD48cD5uJmVhY3V0ZTsgZmlhbW1hIGQmcnNxdW87ZXN0byAmcnNxdW87bmNlbmRpbyBub24gbSZyc3F1bzthc3NhbGUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5Eb25uYSAmZWdyYXZlOyBnZW50aWwgbmVsIGNpZWwgY2hlIHNpIGNvbXBpYW5nZTwvcD48cD5kaSBxdWVzdG8gJnJzcXVvO21wZWRpbWVudG8gb3YmcnNxdW87IGlvIHRpIG1hbmRvLDwvcD48cD5zJmlncmF2ZTsgY2hlIGR1cm8gZ2l1ZGljaW8gbCZhZ3JhdmU7IHMmdWdyYXZlOyBmcmFuZ2UuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5RdWVzdGEgY2hpZXNlIEx1Y2lhIGluIHN1byBkaW1hbmRvPC9wPjxwPmUgZGlzc2U64oCUT3IgaGEgYmlzb2dubyBpbCB0dW8gZmVkZWxlPC9wPjxwPmRpIHRlLCBlIGlvIGEgdGUgbG8gcmFjY29tYW5kb+KAlC48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkx1Y2lhLCBuaW1pY2EgZGkgY2lhc2N1biBjcnVkZWxlLDwvcD48cD5zaSBtb3NzZSwgZSB2ZW5uZSBhbCBsb2NvIGRvdiZyc3F1bzsgaSZyc3F1bzsgZXJhLDwvcD48cD5jaGUgbWkgc2VkZWEgY29uIGwmcnNxdW87YW50aWNhIFJhY2hlbGUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5EaXNzZTrigJRCZWF0cmljZSwgbG9kYSBkaSBEaW8gdmVyYSw8L3A+PHA+Y2gmZWFjdXRlOyBub24gc29jY29ycmkgcXVlaSBjaGUgdCZyc3F1bzthbSZvZ3JhdmU7IHRhbnRvLDwvcD48cD5jaCZyc3F1bzt1c2MmaWdyYXZlOyBwZXIgdGUgZGUgbGEgdm9sZ2FyZSBzY2hpZXJhPzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+Tm9uIG9kaSB0dSBsYSBwaWV0YSBkZWwgc3VvIHBpYW50byw8L3A+PHA+bm9uIHZlZGkgdHUgbGEgbW9ydGUgY2hlICZyc3F1bztsIGNvbWJhdHRlPC9wPjxwPnN1IGxhIGZpdW1hbmEgb3ZlICZyc3F1bztsIG1hciBub24gaGEgdmFudG8/4oCULjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QWwgbW9uZG8gbm9uIGZ1ciBtYWkgcGVyc29uZSByYXR0ZTwvcD48cD5hIGZhciBsb3IgcHJvIG8gYSBmdWdnaXIgbG9yIGRhbm5vLDwvcD48cD5jb20mcnNxdW87IGlvLCBkb3BvIGNvdGFpIHBhcm9sZSBmYXR0ZSw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPnZlbm5pIHF1YSBnaSZ1Z3JhdmU7IGRlbCBtaW8gYmVhdG8gc2Nhbm5vLDwvcD48cD5maWRhbmRvbWkgZGVsIHR1byBwYXJsYXJlIG9uZXN0byw8L3A+PHA+Y2gmcnNxdW87b25vcmEgdGUgZSBxdWVpIGNoJnJzcXVvO3VkaXRvIGwmcnNxdW87aGFubm/igJ0uPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5Qb3NjaWEgY2hlIG0mcnNxdW87ZWJiZSByYWdpb25hdG8gcXVlc3RvLDwvcD48cD5saSBvY2NoaSBsdWNlbnRpIGxhZ3JpbWFuZG8gdm9sc2UsPC9wPjxwPnBlciBjaGUgbWkgZmVjZSBkZWwgdmVuaXIgcGkmdWdyYXZlOyBwcmVzdG8uPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5FIHZlbm5pIGEgdGUgY29zJmlncmF2ZTsgY29tJnJzcXVvOyBlbGxhIHZvbHNlOjwvcD48cD5kJnJzcXVvO2luYW56aSBhIHF1ZWxsYSBmaWVyYSB0aSBsZXZhaTwvcD48cD5jaGUgZGVsIGJlbCBtb250ZSBpbCBjb3J0byBhbmRhciB0aSB0b2xzZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkR1bnF1ZTogY2hlICZlZ3JhdmU7PyBwZXJjaCZlYWN1dGU7LCBwZXJjaCZlYWN1dGU7IHJlc3RhaSw8L3A+PHA+cGVyY2gmZWFjdXRlOyB0YW50YSB2aWx0JmFncmF2ZTsgbmVsIGNvcmUgYWxsZXR0ZSw8L3A+PHA+cGVyY2gmZWFjdXRlOyBhcmRpcmUgZSBmcmFuY2hlenphIG5vbiBoYWksPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5wb3NjaWEgY2hlIHRhaSB0cmUgZG9ubmUgYmVuZWRldHRlPC9wPjxwPmN1cmFuIGRpIHRlIG5lIGxhIGNvcnRlIGRlbCBjaWVsbyw8L3A+PHA+ZSAmcnNxdW87bCBtaW8gcGFybGFyIHRhbnRvIGJlbiB0aSBwcm9tZXR0ZT8mcmFxdW87LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UXVhbGkgZmlvcmV0dGkgZGFsIG5vdHR1cm5vIGdlbG88L3A+PHA+Y2hpbmF0aSBlIGNoaXVzaSwgcG9pIGNoZSAmcnNxdW87bCBzb2wgbGkgJnJzcXVvO21iaWFuY2EsPC9wPjxwPnNpIGRyaXp6YW4gdHV0dGkgYXBlcnRpIGluIGxvcm8gc3RlbG8sPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD50YWwgbWkgZmVjJnJzcXVvOyBpbyBkaSBtaWEgdmlydHVkZSBzdGFuY2EsPC9wPjxwPmUgdGFudG8gYnVvbm8gYXJkaXJlIGFsIGNvciBtaSBjb3JzZSw8L3A+PHA+Y2gmcnNxdW87aSZyc3F1bzsgY29taW5jaWFpIGNvbWUgcGVyc29uYSBmcmFuY2E6PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD4mbGFxdW87T2ggcGlldG9zYSBjb2xlaSBjaGUgbWkgc29jY29yc2UhPC9wPjxwPmUgdGUgY29ydGVzZSBjaCZyc3F1bzt1YmlkaXN0aSB0b3N0bzwvcD48cD5hIGxlIHZlcmUgcGFyb2xlIGNoZSB0aSBwb3JzZSE8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlR1IG0mcnNxdW87aGFpIGNvbiBkaXNpZGVyaW8gaWwgY29yIGRpc3Bvc3RvPC9wPjxwPnMmaWdyYXZlOyBhbCB2ZW5pciBjb24gbGUgcGFyb2xlIHR1ZSw8L3A+PHA+Y2gmcnNxdW87aSZyc3F1bzsgc29uIHRvcm5hdG8gbmVsIHByaW1vIHByb3Bvc3RvLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+T3IgdmEsIGNoJnJzcXVvO3VuIHNvbCB2b2xlcmUgJmVncmF2ZTsgZCZyc3F1bzthbWJlZHVlOjwvcD48cD50dSBkdWNhLCB0dSBzZWdub3JlIGUgdHUgbWFlc3RybyZyYXF1bzsuPC9wPjxwPkNvcyZpZ3JhdmU7IGxpIGRpc3NpOyBlIHBvaSBjaGUgbW9zc28gZnVlLDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+aW50cmFpIHBlciBsbyBjYW1taW5vIGFsdG8gZSBzaWx2ZXN0cm8uPC9wPjwvZGl2PicsXG5cblx0JzxwIGNsYXNzPVwiY2FudG9oZWFkXCI+MzwvcD48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+4oCYJmxzcXVvO1BlciBtZSBzaSB2YSBuZSBsYSBjaXR0JmFncmF2ZTsgZG9sZW50ZSw8L3A+PHA+cGVyIG1lIHNpIHZhIG5lIGwmcnNxdW87ZXR0ZXJubyBkb2xvcmUsPC9wPjxwPnBlciBtZSBzaSB2YSB0cmEgbGEgcGVyZHV0YSBnZW50ZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkdpdXN0aXppYSBtb3NzZSBpbCBtaW8gYWx0byBmYXR0b3JlOzwvcD48cD5mZWNlbWkgbGEgZGl2aW5hIHBvZGVzdGF0ZSw8L3A+PHA+bGEgc29tbWEgc2FwJml1bWw7ZW56YSBlICZyc3F1bztsIHByaW1vIGFtb3JlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RGluYW56aSBhIG1lIG5vbiBmdW9yIGNvc2UgY3JlYXRlPC9wPjxwPnNlIG5vbiBldHRlcm5lLCBlIGlvIGV0dGVybm8gZHVyby48L3A+PHA+TGFzY2lhdGUgb2duZSBzcGVyYW56YSwgdm9pIGNoJnJzcXVvO2ludHJhdGUmcnNxdW87LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UXVlc3RlIHBhcm9sZSBkaSBjb2xvcmUgb3NjdXJvPC9wPjxwPnZpZCZyc3F1bzsgJml1bWw7byBzY3JpdHRlIGFsIHNvbW1vIGQmcnNxdW87dW5hIHBvcnRhOzwvcD48cD5wZXIgY2gmcnNxdW87aW86ICZsYXF1bztNYWVzdHJvLCBpbCBzZW5zbyBsb3IgbSZyc3F1bzsmZWdyYXZlOyBkdXJvJnJhcXVvOy48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkVkIGVsbGkgYSBtZSwgY29tZSBwZXJzb25hIGFjY29ydGE6PC9wPjxwPiZsYXF1bztRdWkgc2kgY29udmllbiBsYXNjaWFyZSBvZ25lIHNvc3BldHRvOzwvcD48cD5vZ25lIHZpbHQmYWdyYXZlOyBjb252aWVuIGNoZSBxdWkgc2lhIG1vcnRhLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+Tm9pIHNpYW0gdmVudXRpIGFsIGxvY28gb3YmcnNxdW87IGkmcnNxdW87IHQmcnNxdW87aG8gZGV0dG88L3A+PHA+Y2hlIHR1IHZlZHJhaSBsZSBnZW50aSBkb2xvcm9zZTwvcD48cD5jJnJzcXVvO2hhbm5vIHBlcmR1dG8gaWwgYmVuIGRlIGwmcnNxdW87aW50ZWxsZXR0byZyYXF1bzsuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5FIHBvaSBjaGUgbGEgc3VhIG1hbm8gYSBsYSBtaWEgcHVvc2U8L3A+PHA+Y29uIGxpZXRvIHZvbHRvLCBvbmQmcnNxdW87IGlvIG1pIGNvbmZvcnRhaSw8L3A+PHA+bWkgbWlzZSBkZW50cm8gYSBsZSBzZWdyZXRlIGNvc2UuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5RdWl2aSBzb3NwaXJpLCBwaWFudGkgZSBhbHRpIGd1YWk8L3A+PHA+cmlzb25hdmFuIHBlciBsJnJzcXVvO2FlcmUgc2FuemEgc3RlbGxlLDwvcD48cD5wZXIgY2gmcnNxdW87aW8gYWwgY29taW5jaWFyIG5lIGxhZ3JpbWFpLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RGl2ZXJzZSBsaW5ndWUsIG9ycmliaWxpIGZhdmVsbGUsPC9wPjxwPnBhcm9sZSBkaSBkb2xvcmUsIGFjY2VudGkgZCZyc3F1bztpcmEsPC9wPjxwPnZvY2kgYWx0ZSBlIGZpb2NoZSwgZSBzdW9uIGRpIG1hbiBjb24gZWxsZTwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+ZmFjZXZhbm8gdW4gdHVtdWx0bywgaWwgcXVhbCBzJnJzcXVvO2FnZ2lyYTwvcD48cD5zZW1wcmUgaW4gcXVlbGwmcnNxdW87IGF1cmEgc2FuemEgdGVtcG8gdGludGEsPC9wPjxwPmNvbWUgbGEgcmVuYSBxdWFuZG8gdHVyYm8gc3BpcmEuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5FIGlvIGNoJnJzcXVvO2F2ZWEgZCZyc3F1bztlcnJvciBsYSB0ZXN0YSBjaW50YSw8L3A+PHA+ZGlzc2k6ICZsYXF1bztNYWVzdHJvLCBjaGUgJmVncmF2ZTsgcXVlbCBjaCZyc3F1bztpJnJzcXVvOyBvZG8/PC9wPjxwPmUgY2hlIGdlbnQmcnNxdW87ICZlZ3JhdmU7IGNoZSBwYXIgbmVsIGR1b2wgcyZpZ3JhdmU7IHZpbnRhPyZyYXF1bzsuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5FZCBlbGxpIGEgbWU6ICZsYXF1bztRdWVzdG8gbWlzZXJvIG1vZG88L3A+PHA+dGVnbm9uIGwmcnNxdW87YW5pbWUgdHJpc3RlIGRpIGNvbG9ybzwvcD48cD5jaGUgdmlzc2VyIHNhbnphICZyc3F1bztuZmFtaWEgZSBzYW56YSBsb2RvLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+TWlzY2hpYXRlIHNvbm8gYSBxdWVsIGNhdHRpdm8gY29ybzwvcD48cD5kZSBsaSBhbmdlbGkgY2hlIG5vbiBmdXJvbiByaWJlbGxpPC9wPjxwPm4mZWFjdXRlOyBmdXIgZmVkZWxpIGEgRGlvLCBtYSBwZXIgcyZlYWN1dGU7IGZ1b3JvLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+Q2FjY2lhbmxpIGkgY2llbCBwZXIgbm9uIGVzc2VyIG1lbiBiZWxsaSw8L3A+PHA+biZlYWN1dGU7IGxvIHByb2ZvbmRvIGluZmVybm8gbGkgcmljZXZlLDwvcD48cD5jaCZyc3F1bzthbGN1bmEgZ2xvcmlhIGkgcmVpIGF2cmViYmVyIGQmcnNxdW87ZWxsaSZyYXF1bzsuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5FIGlvOiAmbGFxdW87TWFlc3RybywgY2hlICZlZ3JhdmU7IHRhbnRvIGdyZXZlPC9wPjxwPmEgbG9yIGNoZSBsYW1lbnRhciBsaSBmYSBzJmlncmF2ZTsgZm9ydGU/JnJhcXVvOy48L3A+PHA+UmlzcHVvc2U6ICZsYXF1bztEaWNlcm9sdGkgbW9sdG8gYnJldmUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5RdWVzdGkgbm9uIGhhbm5vIHNwZXJhbnphIGRpIG1vcnRlLDwvcD48cD5lIGxhIGxvciBjaWVjYSB2aXRhICZlZ3JhdmU7IHRhbnRvIGJhc3NhLDwvcD48cD5jaGUgJnJzcXVvO252aWQmaXVtbDtvc2kgc29uIGQmcnNxdW87b2duZSBhbHRyYSBzb3J0ZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkZhbWEgZGkgbG9ybyBpbCBtb25kbyBlc3NlciBub24gbGFzc2E7PC9wPjxwPm1pc2VyaWNvcmRpYSBlIGdpdXN0aXppYSBsaSBzZGVnbmE6PC9wPjxwPm5vbiByYWdpb25pYW0gZGkgbG9yLCBtYSBndWFyZGEgZSBwYXNzYSZyYXF1bzsuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5FIGlvLCBjaGUgcmlndWFyZGFpLCB2aWRpIHVuYSAmcnNxdW87bnNlZ25hPC9wPjxwPmNoZSBnaXJhbmRvIGNvcnJldmEgdGFudG8gcmF0dGEsPC9wPjxwPmNoZSBkJnJzcXVvO29nbmUgcG9zYSBtaSBwYXJlYSBpbmRlZ25hOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+ZSBkaWV0cm8gbGUgdmVuJmlncmF2ZTthIHMmaWdyYXZlOyBsdW5nYSB0cmF0dGE8L3A+PHA+ZGkgZ2VudGUsIGNoJnJzcXVvO2kmcnNxdW87IG5vbiBhdmVyZWkgY3JlZHV0bzwvcD48cD5jaGUgbW9ydGUgdGFudGEgbiZyc3F1bzthdmVzc2UgZGlzZmF0dGEuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5Qb3NjaWEgY2gmcnNxdW87aW8gdiZyc3F1bztlYmJpIGFsY3VuIHJpY29ub3NjaXV0byw8L3A+PHA+dmlkaSBlIGNvbm9iYmkgbCZyc3F1bztvbWJyYSBkaSBjb2x1aTwvcD48cD5jaGUgZmVjZSBwZXIgdmlsdGFkZSBpbCBncmFuIHJpZml1dG8uPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5JbmNvbnRhbmVudGUgaW50ZXNpIGUgY2VydG8gZnVpPC9wPjxwPmNoZSBxdWVzdGEgZXJhIGxhIHNldHRhIGQmcnNxdW87aSBjYXR0aXZpLDwvcD48cD5hIERpbyBzcGlhY2VudGkgZSBhJnJzcXVvOyBuZW1pY2kgc3VpLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UXVlc3RpIHNjaWF1cmF0aSwgY2hlIG1haSBub24gZnVyIHZpdmksPC9wPjxwPmVyYW5vIGlnbnVkaSBlIHN0aW1vbGF0aSBtb2x0bzwvcD48cD5kYSBtb3Njb25pIGUgZGEgdmVzcGUgY2gmcnNxdW87ZXJhbiBpdmkuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5FbGxlIHJpZ2F2YW4gbG9yIGRpIHNhbmd1ZSBpbCB2b2x0byw8L3A+PHA+Y2hlLCBtaXNjaGlhdG8gZGkgbGFncmltZSwgYSZyc3F1bzsgbG9yIHBpZWRpPC9wPjxwPmRhIGZhc3RpZGlvc2kgdmVybWkgZXJhIHJpY29sdG8uPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5FIHBvaSBjaCZyc3F1bzthIHJpZ3VhcmRhciBvbHRyZSBtaSBkaWVkaSw8L3A+PHA+dmlkaSBnZW50aSBhIGxhIHJpdmEgZCZyc3F1bzt1biBncmFuIGZpdW1lOzwvcD48cD5wZXIgY2gmcnNxdW87aW8gZGlzc2k6ICZsYXF1bztNYWVzdHJvLCBvciBtaSBjb25jZWRpPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5jaCZyc3F1bztpJnJzcXVvOyBzYXBwaWEgcXVhbGkgc29ubywgZSBxdWFsIGNvc3R1bWU8L3A+PHA+bGUgZmEgZGkgdHJhcGFzc2FyIHBhcmVyIHMmaWdyYXZlOyBwcm9udGUsPC9wPjxwPmNvbSZyc3F1bzsgaSZyc3F1bzsgZGlzY2Vybm8gcGVyIGxvIGZpb2NvIGx1bWUmcmFxdW87LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RWQgZWxsaSBhIG1lOiAmbGFxdW87TGUgY29zZSB0aSBmaWVyIGNvbnRlPC9wPjxwPnF1YW5kbyBub2kgZmVybWVyZW0gbGkgbm9zdHJpIHBhc3NpPC9wPjxwPnN1IGxhIHRyaXN0YSByaXZpZXJhIGQmcnNxdW87QWNoZXJvbnRlJnJhcXVvOy48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFsbG9yIGNvbiBsaSBvY2NoaSB2ZXJnb2dub3NpIGUgYmFzc2ksPC9wPjxwPnRlbWVuZG8gbm8gJnJzcXVvO2wgbWlvIGRpciBsaSBmb3NzZSBncmF2ZSw8L3A+PHA+aW5maW5vIGFsIGZpdW1lIGRlbCBwYXJsYXIgbWkgdHJhc3NpLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RWQgZWNjbyB2ZXJzbyBub2kgdmVuaXIgcGVyIG5hdmU8L3A+PHA+dW4gdmVjY2hpbywgYmlhbmNvIHBlciBhbnRpY28gcGVsbyw8L3A+PHA+Z3JpZGFuZG86ICZsYXF1bztHdWFpIGEgdm9pLCBhbmltZSBwcmF2ZSE8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk5vbiBpc3BlcmF0ZSBtYWkgdmVkZXIgbG8gY2llbG86PC9wPjxwPmkmcnNxdW87IHZlZ25vIHBlciBtZW5hcnZpIGEgbCZyc3F1bzthbHRyYSByaXZhPC9wPjxwPm5lIGxlIHRlbmVicmUgZXR0ZXJuZSwgaW4gY2FsZG8gZSAmcnNxdW87biBnZWxvLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RSB0dSBjaGUgc2UmcnNxdW87IGNvc3QmaWdyYXZlOywgYW5pbWEgdml2YSw8L3A+PHA+cCZhZ3JhdmU7cnRpdGkgZGEgY290ZXN0aSBjaGUgc29uIG1vcnRpJnJhcXVvOy48L3A+PHA+TWEgcG9pIGNoZSB2aWRlIGNoJnJzcXVvO2lvIG5vbiBtaSBwYXJ0aXZhLDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+ZGlzc2U6ICZsYXF1bztQZXIgYWx0cmEgdmlhLCBwZXIgYWx0cmkgcG9ydGk8L3A+PHA+dmVycmFpIGEgcGlhZ2dpYSwgbm9uIHF1aSwgcGVyIHBhc3NhcmU6PC9wPjxwPnBpJnVncmF2ZTsgbGlldmUgbGVnbm8gY29udmllbiBjaGUgdGkgcG9ydGkmcmFxdW87LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RSAmcnNxdW87bCBkdWNhIGx1aTogJmxhcXVvO0Nhcm9uLCBub24gdGkgY3J1Y2NpYXJlOjwvcD48cD52dW9sc2kgY29zJmlncmF2ZTsgY29sJmFncmF2ZTsgZG92ZSBzaSBwdW90ZTwvcD48cD5jaSZvZ3JhdmU7IGNoZSBzaSB2dW9sZSwgZSBwaSZ1Z3JhdmU7IG5vbiBkaW1hbmRhcmUmcmFxdW87LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UXVpbmNpIGZ1b3IgcXVldGUgbGUgbGFub3NlIGdvdGU8L3A+PHA+YWwgbm9jY2hpZXIgZGUgbGEgbGl2aWRhIHBhbHVkZSw8L3A+PHA+Y2hlICZyc3F1bztudG9ybm8gYSBsaSBvY2NoaSBhdmVhIGRpIGZpYW1tZSByb3RlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+TWEgcXVlbGwmcnNxdW87IGFuaW1lLCBjaCZyc3F1bztlcmFuIGxhc3NlIGUgbnVkZSw8L3A+PHA+Y2FuZ2lhciBjb2xvcmUgZSBkaWJhdHRlcm8gaSBkZW50aSw8L3A+PHA+cmF0dG8gY2hlICZyc3F1bztudGVzZXIgbGUgcGFyb2xlIGNydWRlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QmVzdGVtbWlhdmFubyBEaW8gZSBsb3IgcGFyZW50aSw8L3A+PHA+bCZyc3F1bzt1bWFuYSBzcGV6aWUgZSAmcnNxdW87bCBsb2NvIGUgJnJzcXVvO2wgdGVtcG8gZSAmcnNxdW87bCBzZW1lPC9wPjxwPmRpIGxvciBzZW1lbnphIGUgZGkgbG9yIG5hc2NpbWVudGkuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5Qb2kgc2kgcml0cmFzc2VyIHR1dHRlIHF1YW50ZSBpbnNpZW1lLDwvcD48cD5mb3J0ZSBwaWFuZ2VuZG8sIGEgbGEgcml2YSBtYWx2YWdpYTwvcD48cD5jaCZyc3F1bzthdHRlbmRlIGNpYXNjdW4gdW9tIGNoZSBEaW8gbm9uIHRlbWUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5DYXJvbiBkaW1vbmlvLCBjb24gb2NjaGkgZGkgYnJhZ2lhPC9wPjxwPmxvcm8gYWNjZW5uYW5kbywgdHV0dGUgbGUgcmFjY29nbGllOzwvcD48cD5iYXR0ZSBjb2wgcmVtbyBxdWFsdW5xdWUgcyZyc3F1bzthZGFnaWEuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5Db21lIGQmcnNxdW87YXV0dW5ubyBzaSBsZXZhbiBsZSBmb2dsaWU8L3A+PHA+bCZyc3F1bzt1bmEgYXBwcmVzc28gZGUgbCZyc3F1bzthbHRyYSwgZmluIGNoZSAmcnNxdW87bCByYW1vPC9wPjxwPnZlZGUgYSBsYSB0ZXJyYSB0dXR0ZSBsZSBzdWUgc3BvZ2xpZSw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPnNpbWlsZW1lbnRlIGlsIG1hbCBzZW1lIGQmcnNxdW87QWRhbW88L3A+PHA+Z2l0dGFuc2kgZGkgcXVlbCBsaXRvIGFkIHVuYSBhZCB1bmEsPC9wPjxwPnBlciBjZW5uaSBjb21lIGF1Z2VsIHBlciBzdW8gcmljaGlhbW8uPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5Db3MmaWdyYXZlOyBzZW4gdmFubm8gc3UgcGVyIGwmcnNxdW87b25kYSBicnVuYSw8L3A+PHA+ZSBhdmFudGkgY2hlIHNpZW4gZGkgbCZhZ3JhdmU7IGRpc2Nlc2UsPC9wPjxwPmFuY2hlIGRpIHF1YSBudW92YSBzY2hpZXJhIHMmcnNxdW87YXVuYS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPiZsYXF1bztGaWdsaXVvbCBtaW8mcmFxdW87LCBkaXNzZSAmcnNxdW87bCBtYWVzdHJvIGNvcnRlc2UsPC9wPjxwPiZsYXF1bztxdWVsbGkgY2hlIG11b2lvbiBuZSBsJnJzcXVvO2lyYSBkaSBEaW88L3A+PHA+dHV0dGkgY29udmVnbm9uIHF1aSBkJnJzcXVvO29nbmUgcGFlc2U7PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5lIHByb250aSBzb25vIGEgdHJhcGFzc2FyIGxvIHJpbyw8L3A+PHA+Y2gmZWFjdXRlOyBsYSBkaXZpbmEgZ2l1c3RpemlhIGxpIHNwcm9uYSw8L3A+PHA+cyZpZ3JhdmU7IGNoZSBsYSB0ZW1hIHNpIHZvbHZlIGluIGRpc2lvLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UXVpbmNpIG5vbiBwYXNzYSBtYWkgYW5pbWEgYnVvbmE7PC9wPjxwPmUgcGVyJm9ncmF2ZTssIHNlIENhcm9uIGRpIHRlIHNpIGxhZ25hLDwvcD48cD5iZW4gcHVvaSBzYXBlcmUgb21haSBjaGUgJnJzcXVvO2wgc3VvIGRpciBzdW9uYSZyYXF1bzsuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5GaW5pdG8gcXVlc3RvLCBsYSBidWlhIGNhbXBhZ25hPC9wPjxwPnRyZW0mb2dyYXZlOyBzJmlncmF2ZTsgZm9ydGUsIGNoZSBkZSBsbyBzcGF2ZW50bzwvcD48cD5sYSBtZW50ZSBkaSBzdWRvcmUgYW5jb3IgbWkgYmFnbmEuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5MYSB0ZXJyYSBsYWdyaW1vc2EgZGllZGUgdmVudG8sPC9wPjxwPmNoZSBiYWxlbiZvZ3JhdmU7IHVuYSBsdWNlIHZlcm1pZ2xpYTwvcD48cD5sYSBxdWFsIG1pIHZpbnNlIGNpYXNjdW4gc2VudGltZW50bzs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPmUgY2FkZGkgY29tZSBsJnJzcXVvO3VvbSBjdWkgc29ubm8gcGlnbGlhLjwvcD48L2Rpdj4nXTtcblxubW9kdWxlLmV4cG9ydHMgPSBpdGFsaWFuO1xuIiwiLy8gbG9uZ2ZlbGxvdy5qc1xuXG52YXIgbG9uZ2ZlbGxvdyA9IFsnPHAgY2xhc3M9XCJ0aXRsZVwiPkluZmVybm88L3A+PHAgY2xhc3M9XCJhdXRob3JcIj5IZW5yeSBXYWRzd29ydGggTG9uZ2ZlbGxvdzwvcD4nLFxuXG5cdCc8cCBjbGFzcz1cImNhbnRvaGVhZFwiPkluZmVybm86IENhbnRvIEk8L3A+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk1pZHdheSB1cG9uIHRoZSBqb3VybmV5IG9mIG91ciBsaWZlPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5JIGZvdW5kIG15c2VsZiB3aXRoaW4gYSBmb3Jlc3QgZGFyayw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkZvciB0aGUgc3RyYWlnaHRmb3J3YXJkIHBhdGh3YXkgaGFkIGJlZW4gbG9zdC48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFoIG1lISBob3cgaGFyZCBhIHRoaW5nIGl0IGlzIHRvIHNheTwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hhdCB3YXMgdGhpcyBmb3Jlc3Qgc2F2YWdlLCByb3VnaCwgYW5kIHN0ZXJuLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hpY2ggaW4gdGhlIHZlcnkgdGhvdWdodCByZW5ld3MgdGhlIGZlYXIuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5TbyBiaXR0ZXIgaXMgaXQsIGRlYXRoIGlzIGxpdHRsZSBtb3JlOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QnV0IG9mIHRoZSBnb29kIHRvIHRyZWF0LCB3aGljaCB0aGVyZSBJIGZvdW5kLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+U3BlYWsgd2lsbCBJIG9mIHRoZSBvdGhlciB0aGluZ3MgSSBzYXcgdGhlcmUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5JIGNhbm5vdCB3ZWxsIHJlcGVhdCBob3cgdGhlcmUgSSBlbnRlcmVkLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+U28gZnVsbCB3YXMgSSBvZiBzbHVtYmVyIGF0IHRoZSBtb21lbnQ8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkluIHdoaWNoIEkgaGFkIGFiYW5kb25lZCB0aGUgdHJ1ZSB3YXkuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5CdXQgYWZ0ZXIgSSBoYWQgcmVhY2hlZCBhIG1vdW50YWluJnJzcXVvO3MgZm9vdCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkF0IHRoYXQgcG9pbnQgd2hlcmUgdGhlIHZhbGxleSB0ZXJtaW5hdGVkLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hpY2ggaGFkIHdpdGggY29uc3Rlcm5hdGlvbiBwaWVyY2VkIG15IGhlYXJ0LDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VXB3YXJkIEkgbG9va2VkLCBhbmQgSSBiZWhlbGQgaXRzIHNob3VsZGVycyw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlZlc3RlZCBhbHJlYWR5IHdpdGggdGhhdCBwbGFuZXQmcnNxdW87cyByYXlzPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCBsZWFkZXRoIG90aGVycyByaWdodCBieSBldmVyeSByb2FkLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhlbiB3YXMgdGhlIGZlYXIgYSBsaXR0bGUgcXVpZXRlZDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhhdCBpbiBteSBoZWFydCZyc3F1bztzIGxha2UgaGFkIGVuZHVyZWQgdGhyb3VnaG91dDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhlIG5pZ2h0LCB3aGljaCBJIGhhZCBwYXNzZWQgc28gcGl0ZW91c2x5LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QW5kIGV2ZW4gYXMgaGUsIHdobywgd2l0aCBkaXN0cmVzc2Z1bCBicmVhdGgsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5Gb3J0aCBpc3N1ZWQgZnJvbSB0aGUgc2VhIHVwb24gdGhlIHNob3JlLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VHVybnMgdG8gdGhlIHdhdGVyIHBlcmlsb3VzIGFuZCBnYXplczs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlNvIGRpZCBteSBzb3VsLCB0aGF0IHN0aWxsIHdhcyBmbGVlaW5nIG9ud2FyZCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlR1cm4gaXRzZWxmIGJhY2sgdG8gcmUtYmVob2xkIHRoZSBwYXNzPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCBuZXZlciB5ZXQgYSBsaXZpbmcgcGVyc29uIGxlZnQuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BZnRlciBteSB3ZWFyeSBib2R5IEkgaGFkIHJlc3RlZCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoZSB3YXkgcmVzdW1lZCBJIG9uIHRoZSBkZXNlcnQgc2xvcGUsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5TbyB0aGF0IHRoZSBmaXJtIGZvb3QgZXZlciB3YXMgdGhlIGxvd2VyLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QW5kIGxvISBhbG1vc3Qgd2hlcmUgdGhlIGFzY2VudCBiZWdhbiw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkEgcGFudGhlciBsaWdodCBhbmQgc3dpZnQgZXhjZWVkaW5nbHksPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCB3aXRoIGEgc3BvdHRlZCBza2luIHdhcyBjb3ZlcmVkIG8mcnNxdW87ZXIhPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbmQgbmV2ZXIgbW92ZWQgc2hlIGZyb20gYmVmb3JlIG15IGZhY2UsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5OYXksIHJhdGhlciBkaWQgaW1wZWRlIHNvIG11Y2ggbXkgd2F5LDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhhdCBtYW55IHRpbWVzIEkgdG8gcmV0dXJuIGhhZCB0dXJuZWQuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5UaGUgdGltZSB3YXMgdGhlIGJlZ2lubmluZyBvZiB0aGUgbW9ybmluZyw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCB1cCB0aGUgc3VuIHdhcyBtb3VudGluZyB3aXRoIHRob3NlIHN0YXJzPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGF0IHdpdGggaGltIHdlcmUsIHdoYXQgdGltZSB0aGUgTG92ZSBEaXZpbmU8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkF0IGZpcnN0IGluIG1vdGlvbiBzZXQgdGhvc2UgYmVhdXRlb3VzIHRoaW5nczs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlNvIHdlcmUgdG8gbWUgb2NjYXNpb24gb2YgZ29vZCBob3BlLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhlIHZhcmllZ2F0ZWQgc2tpbiBvZiB0aGF0IHdpbGQgYmVhc3QsPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5UaGUgaG91ciBvZiB0aW1lLCBhbmQgdGhlIGRlbGljaW91cyBzZWFzb247PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5CdXQgbm90IHNvIG11Y2gsIHRoYXQgZGlkIG5vdCBnaXZlIG1lIGZlYXI8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkEgbGlvbiZyc3F1bztzIGFzcGVjdCB3aGljaCBhcHBlYXJlZCB0byBtZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkhlIHNlZW1lZCBhcyBpZiBhZ2FpbnN0IG1lIGhlIHdlcmUgY29taW5nPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaXRoIGhlYWQgdXBsaWZ0ZWQsIGFuZCB3aXRoIHJhdmVub3VzIGh1bmdlciw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlNvIHRoYXQgaXQgc2VlbWVkIHRoZSBhaXIgd2FzIGFmcmFpZCBvZiBoaW07PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbmQgYSBzaGUtd29sZiwgdGhhdCB3aXRoIGFsbCBodW5nZXJpbmdzPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5TZWVtZWQgdG8gYmUgbGFkZW4gaW4gaGVyIG1lYWdyZW5lc3MsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BbmQgbWFueSBmb2xrIGhhcyBjYXVzZWQgdG8gbGl2ZSBmb3Jsb3JuITwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+U2hlIGJyb3VnaHQgdXBvbiBtZSBzbyBtdWNoIGhlYXZpbmVzcyw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldpdGggdGhlIGFmZnJpZ2h0IHRoYXQgZnJvbSBoZXIgYXNwZWN0IGNhbWUsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGF0IEkgdGhlIGhvcGUgcmVsaW5xdWlzaGVkIG9mIHRoZSBoZWlnaHQuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbmQgYXMgaGUgaXMgd2hvIHdpbGxpbmdseSBhY3F1aXJlcyw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCB0aGUgdGltZSBjb21lcyB0aGF0IGNhdXNlcyBoaW0gdG8gbG9zZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldobyB3ZWVwcyBpbiBhbGwgaGlzIHRob3VnaHRzIGFuZCBpcyBkZXNwb25kZW50LDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RSZyc3F1bztlbiBzdWNoIG1hZGUgbWUgdGhhdCBiZWFzdCB3aXRob3V0ZW4gcGVhY2UsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCwgY29taW5nIG9uIGFnYWluc3QgbWUgYnkgZGVncmVlczwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhydXN0IG1lIGJhY2sgdGhpdGhlciB3aGVyZSB0aGUgc3VuIGlzIHNpbGVudC48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPldoaWxlIEkgd2FzIHJ1c2hpbmcgZG93bndhcmQgdG8gdGhlIGxvd2xhbmQsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5CZWZvcmUgbWluZSBleWVzIGRpZCBvbmUgcHJlc2VudCBoaW1zZWxmLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hvIHNlZW1lZCBmcm9tIGxvbmctY29udGludWVkIHNpbGVuY2UgaG9hcnNlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+V2hlbiBJIGJlaGVsZCBoaW0gaW4gdGhlIGRlc2VydCB2YXN0LDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+JmxkcXVvO0hhdmUgcGl0eSBvbiBtZSwmcmRxdW87IHVudG8gaGltIEkgY3JpZWQsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj4mbGRxdW87V2hpY2hlJnJzcXVvO2VyIHRob3UgYXJ0LCBvciBzaGFkZSBvciByZWFsIG1hbiEmcmRxdW87PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5IZSBhbnN3ZXJlZCBtZTogJmxkcXVvO05vdCBtYW47IG1hbiBvbmNlIEkgd2FzLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIGJvdGggbXkgcGFyZW50cyB3ZXJlIG9mIExvbWJhcmR5LDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIE1hbnR1YW5zIGJ5IGNvdW50cnkgYm90aCBvZiB0aGVtLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+JmxzcXVvO1N1YiBKdWxpbyZyc3F1bzsgd2FzIEkgYm9ybiwgdGhvdWdoIGl0IHdhcyBsYXRlLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIGxpdmVkIGF0IFJvbWUgdW5kZXIgdGhlIGdvb2QgQXVndXN0dXMsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5EdXJpbmcgdGhlIHRpbWUgb2YgZmFsc2UgYW5kIGx5aW5nIGdvZHMuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BIHBvZXQgd2FzIEksIGFuZCBJIHNhbmcgdGhhdCBqdXN0PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5Tb24gb2YgQW5jaGlzZXMsIHdobyBjYW1lIGZvcnRoIGZyb20gVHJveSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFmdGVyIHRoYXQgSWxpb24gdGhlIHN1cGVyYiB3YXMgYnVybmVkLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QnV0IHRob3UsIHdoeSBnb2VzdCB0aG91IGJhY2sgdG8gc3VjaCBhbm5veWFuY2U/PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaHkgY2xpbWImcnNxdW87c3QgdGhvdSBub3QgdGhlIE1vdW50IERlbGVjdGFibGUsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCBpcyB0aGUgc291cmNlIGFuZCBjYXVzZSBvZiBldmVyeSBqb3k/JnJkcXVvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+JmxkcXVvO05vdywgYXJ0IHRob3UgdGhhdCBWaXJnaWxpdXMgYW5kIHRoYXQgZm91bnRhaW48L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldoaWNoIHNwcmVhZHMgYWJyb2FkIHNvIHdpZGUgYSByaXZlciBvZiBzcGVlY2g/JnJkcXVvOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+SSBtYWRlIHJlc3BvbnNlIHRvIGhpbSB3aXRoIGJhc2hmdWwgZm9yZWhlYWQuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD4mbGRxdW87Tywgb2YgdGhlIG90aGVyIHBvZXRzIGhvbm91ciBhbmQgbGlnaHQsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BdmFpbCBtZSB0aGUgbG9uZyBzdHVkeSBhbmQgZ3JlYXQgbG92ZTwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhhdCBoYXZlIGltcGVsbGVkIG1lIHRvIGV4cGxvcmUgdGh5IHZvbHVtZSE8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRob3UgYXJ0IG15IG1hc3RlciwgYW5kIG15IGF1dGhvciB0aG91LDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhvdSBhcnQgYWxvbmUgdGhlIG9uZSBmcm9tIHdob20gSSB0b29rPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGUgYmVhdXRpZnVsIHN0eWxlIHRoYXQgaGFzIGRvbmUgaG9ub3VyIHRvIG1lLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QmVob2xkIHRoZSBiZWFzdCwgZm9yIHdoaWNoIEkgaGF2ZSB0dXJuZWQgYmFjazs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkRvIHRob3UgcHJvdGVjdCBtZSBmcm9tIGhlciwgZmFtb3VzIFNhZ2UsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5Gb3Igc2hlIGRvdGggbWFrZSBteSB2ZWlucyBhbmQgcHVsc2VzIHRyZW1ibGUuJnJkcXVvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+JmxkcXVvO1RoZWUgaXQgYmVob3ZlcyB0byB0YWtlIGFub3RoZXIgcm9hZCwmcmRxdW87PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5SZXNwb25kZWQgaGUsIHdoZW4gaGUgYmVoZWxkIG1lIHdlZXBpbmcsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj4mbGRxdW87SWYgZnJvbSB0aGlzIHNhdmFnZSBwbGFjZSB0aG91IHdvdWxkc3QgZXNjYXBlOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QmVjYXVzZSB0aGlzIGJlYXN0LCBhdCB3aGljaCB0aG91IGNyaWVzdCBvdXQsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5TdWZmZXJzIG5vdCBhbnkgb25lIHRvIHBhc3MgaGVyIHdheSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkJ1dCBzbyBkb3RoIGhhcmFzcyBoaW0sIHRoYXQgc2hlIGRlc3Ryb3lzIGhpbTs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFuZCBoYXMgYSBuYXR1cmUgc28gbWFsaWduIGFuZCBydXRobGVzcyw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoYXQgbmV2ZXIgZG90aCBzaGUgZ2x1dCBoZXIgZ3JlZWR5IHdpbGwsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BbmQgYWZ0ZXIgZm9vZCBpcyBodW5ncmllciB0aGFuIGJlZm9yZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk1hbnkgdGhlIGFuaW1hbHMgd2l0aCB3aG9tIHNoZSB3ZWRzLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIG1vcmUgdGhleSBzaGFsbCBiZSBzdGlsbCwgdW50aWwgdGhlIEdyZXlob3VuZDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+Q29tZXMsIHdobyBzaGFsbCBtYWtlIGhlciBwZXJpc2ggaW4gaGVyIHBhaW4uPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5IZSBzaGFsbCBub3QgZmVlZCBvbiBlaXRoZXIgZWFydGggb3IgcGVsZiw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkJ1dCB1cG9uIHdpc2RvbSwgYW5kIG9uIGxvdmUgYW5kIHZpcnR1ZTs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPiZyc3F1bztUd2l4dCBGZWx0cm8gYW5kIEZlbHRybyBzaGFsbCBoaXMgbmF0aW9uIGJlOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+T2YgdGhhdCBsb3cgSXRhbHkgc2hhbGwgaGUgYmUgdGhlIHNhdmlvdXIsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5PbiB3aG9zZSBhY2NvdW50IHRoZSBtYWlkIENhbWlsbGEgZGllZCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkV1cnlhbHVzLCBUdXJudXMsIE5pc3VzLCBvZiB0aGVpciB3b3VuZHM7PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5UaHJvdWdoIGV2ZXJ5IGNpdHkgc2hhbGwgaGUgaHVudCBoZXIgZG93biw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlVudGlsIGhlIHNoYWxsIGhhdmUgZHJpdmVuIGhlciBiYWNrIHRvIEhlbGwsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGVyZSBmcm9tIHdoZW5jZSBlbnZ5IGZpcnN0IGRpZCBsZXQgaGVyIGxvb3NlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhlcmVmb3JlIEkgdGhpbmsgYW5kIGp1ZGdlIGl0IGZvciB0aHkgYmVzdDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhvdSBmb2xsb3cgbWUsIGFuZCBJIHdpbGwgYmUgdGh5IGd1aWRlLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIGxlYWQgdGhlZSBoZW5jZSB0aHJvdWdoIHRoZSBldGVybmFsIHBsYWNlLDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+V2hlcmUgdGhvdSBzaGFsdCBoZWFyIHRoZSBkZXNwZXJhdGUgbGFtZW50YXRpb25zLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+U2hhbHQgc2VlIHRoZSBhbmNpZW50IHNwaXJpdHMgZGlzY29uc29sYXRlLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hvIGNyeSBvdXQgZWFjaCBvbmUgZm9yIHRoZSBzZWNvbmQgZGVhdGg7PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbmQgdGhvdSBzaGFsdCBzZWUgdGhvc2Ugd2hvIGNvbnRlbnRlZCBhcmU8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldpdGhpbiB0aGUgZmlyZSwgYmVjYXVzZSB0aGV5IGhvcGUgdG8gY29tZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldoZW5lJnJzcXVvO2VyIGl0IG1heSBiZSwgdG8gdGhlIGJsZXNzZWQgcGVvcGxlOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VG8gd2hvbSwgdGhlbiwgaWYgdGhvdSB3aXNoZXN0IHRvIGFzY2VuZCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkEgc291bCBzaGFsbCBiZSBmb3IgdGhhdCB0aGFuIEkgbW9yZSB3b3J0aHk7PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaXRoIGhlciBhdCBteSBkZXBhcnR1cmUgSSB3aWxsIGxlYXZlIHRoZWU7PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5CZWNhdXNlIHRoYXQgRW1wZXJvciwgd2hvIHJlaWducyBhYm92ZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkluIHRoYXQgSSB3YXMgcmViZWxsaW91cyB0byBoaXMgbGF3LDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2lsbHMgdGhhdCB0aHJvdWdoIG1lIG5vbmUgY29tZSBpbnRvIGhpcyBjaXR5LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+SGUgZ292ZXJucyBldmVyeXdoZXJlLCBhbmQgdGhlcmUgaGUgcmVpZ25zOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhlcmUgaXMgaGlzIGNpdHkgYW5kIGhpcyBsb2Z0eSB0aHJvbmU7PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5PIGhhcHB5IGhlIHdob20gdGhlcmV0byBoZSBlbGVjdHMhJnJkcXVvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QW5kIEkgdG8gaGltOiAmbGRxdW87UG9ldCwgSSB0aGVlIGVudHJlYXQsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5CeSB0aGF0IHNhbWUgR29kIHdob20gdGhvdSBkaWRzdCBuZXZlciBrbm93LDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+U28gdGhhdCBJIG1heSBlc2NhcGUgdGhpcyB3b2UgYW5kIHdvcnNlLDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhvdSB3b3VsZHN0IGNvbmR1Y3QgbWUgdGhlcmUgd2hlcmUgdGhvdSBoYXN0IHNhaWQsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGF0IEkgbWF5IHNlZSB0aGUgcG9ydGFsIG9mIFNhaW50IFBldGVyLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIHRob3NlIHRob3UgbWFrZXN0IHNvIGRpc2NvbnNvbGF0ZS4mcmRxdW87PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5UaGVuIGhlIG1vdmVkIG9uLCBhbmQgSSBiZWhpbmQgaGltIGZvbGxvd2VkLjwvcD48L2Rpdj4nLFxuXG5cdCc8cCBjbGFzcz1cImNhbnRvaGVhZFwiPkluZmVybm86IENhbnRvIElJPC9wPjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5EYXkgd2FzIGRlcGFydGluZywgYW5kIHRoZSBlbWJyb3duZWQgYWlyPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5SZWxlYXNlZCB0aGUgYW5pbWFscyB0aGF0IGFyZSBvbiBlYXJ0aDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+RnJvbSB0aGVpciBmYXRpZ3VlczsgYW5kIEkgdGhlIG9ubHkgb25lPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5NYWRlIG15c2VsZiByZWFkeSB0byBzdXN0YWluIHRoZSB3YXIsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5Cb3RoIG9mIHRoZSB3YXkgYW5kIGxpa2V3aXNlIG9mIHRoZSB3b2UsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCBtZW1vcnkgdGhhdCBlcnJzIG5vdCBzaGFsbCByZXRyYWNlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+TyBNdXNlcywgTyBoaWdoIGdlbml1cywgbm93IGFzc2lzdCBtZSE8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPk8gbWVtb3J5LCB0aGF0IGRpZHN0IHdyaXRlIGRvd24gd2hhdCBJIHNhdyw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkhlcmUgdGh5IG5vYmlsaXR5IHNoYWxsIGJlIG1hbmlmZXN0ITwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QW5kIEkgYmVnYW46ICZsZHF1bztQb2V0LCB3aG8gZ3VpZGVzdCBtZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlJlZ2FyZCBteSBtYW5ob29kLCBpZiBpdCBiZSBzdWZmaWNpZW50LDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+RXJlIHRvIHRoZSBhcmR1b3VzIHBhc3MgdGhvdSBkb3N0IGNvbmZpZGUgbWUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5UaG91IHNheWVzdCwgdGhhdCBvZiBTaWx2aXVzIHRoZSBwYXJlbnQsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGlsZSB5ZXQgY29ycnVwdGlibGUsIHVudG8gdGhlIHdvcmxkPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5JbW1vcnRhbCB3ZW50LCBhbmQgd2FzIHRoZXJlIGJvZGlseS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkJ1dCBpZiB0aGUgYWR2ZXJzYXJ5IG9mIGFsbCBldmlsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XYXMgY291cnRlb3VzLCB0aGlua2luZyBvZiB0aGUgaGlnaCBlZmZlY3Q8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoYXQgaXNzdWUgd291bGQgZnJvbSBoaW0sIGFuZCB3aG8sIGFuZCB3aGF0LDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VG8gbWVuIG9mIGludGVsbGVjdCB1bm1lZXQgaXQgc2VlbXMgbm90OzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+Rm9yIGhlIHdhcyBvZiBncmVhdCBSb21lLCBhbmQgb2YgaGVyIGVtcGlyZTwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+SW4gdGhlIGVtcHlyZWFsIGhlYXZlbiBhcyBmYXRoZXIgY2hvc2VuOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhlIHdoaWNoIGFuZCB3aGF0LCB3aXNoaW5nIHRvIHNwZWFrIHRoZSB0cnV0aCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldlcmUgc3RhYmxpc2hlZCBhcyB0aGUgaG9seSBwbGFjZSwgd2hlcmVpbjwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+U2l0cyB0aGUgc3VjY2Vzc29yIG9mIHRoZSBncmVhdGVzdCBQZXRlci48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlVwb24gdGhpcyBqb3VybmV5LCB3aGVuY2UgdGhvdSBnaXZlc3QgaGltIHZhdW50LDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhpbmdzIGRpZCBoZSBoZWFyLCB3aGljaCB0aGUgb2NjYXNpb24gd2VyZTwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+Qm90aCBvZiBoaXMgdmljdG9yeSBhbmQgdGhlIHBhcGFsIG1hbnRsZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRoaXRoZXIgd2VudCBhZnRlcndhcmRzIHRoZSBDaG9zZW4gVmVzc2VsLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VG8gYnJpbmcgYmFjayBjb21mb3J0IHRoZW5jZSB1bnRvIHRoYXQgRmFpdGgsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCBvZiBzYWx2YXRpb24mcnNxdW87cyB3YXkgaXMgdGhlIGJlZ2lubmluZy48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkJ1dCBJLCB3aHkgdGhpdGhlciBjb21lLCBvciB3aG8gY29uY2VkZXMgaXQ/PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5JIG5vdCBBZW5lYXMgYW0sIEkgYW0gbm90IFBhdWwsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5Ob3IgSSwgbm9yIG90aGVycywgdGhpbmsgbWUgd29ydGh5IG9mIGl0LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhlcmVmb3JlLCBpZiBJIHJlc2lnbiBteXNlbGYgdG8gY29tZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkkgZmVhciB0aGUgY29taW5nIG1heSBiZSBpbGwtYWR2aXNlZDs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRob3UmcnNxdW87cnQgd2lzZSwgYW5kIGtub3dlc3QgYmV0dGVyIHRoYW4gSSBzcGVhay4mcmRxdW87PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbmQgYXMgaGUgaXMsIHdobyB1bndpbGxzIHdoYXQgaGUgd2lsbGVkLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIGJ5IG5ldyB0aG91Z2h0cyBkb3RoIGhpcyBpbnRlbnRpb24gY2hhbmdlLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+U28gdGhhdCBmcm9tIGhpcyBkZXNpZ24gaGUgcXVpdGUgd2l0aGRyYXdzLDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+U3VjaCBJIGJlY2FtZSwgdXBvbiB0aGF0IGRhcmsgaGlsbHNpZGUsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5CZWNhdXNlLCBpbiB0aGlua2luZywgSSBjb25zdW1lZCB0aGUgZW1wcmlzZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldoaWNoIHdhcyBzbyB2ZXJ5IHByb21wdCBpbiB0aGUgYmVnaW5uaW5nLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+JmxkcXVvO0lmIEkgaGF2ZSB3ZWxsIHRoeSBsYW5ndWFnZSB1bmRlcnN0b29kLCZyZHF1bzs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlJlcGxpZWQgdGhhdCBzaGFkZSBvZiB0aGUgTWFnbmFuaW1vdXMsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj4mbGRxdW87VGh5IHNvdWwgYXR0YWludGVkIGlzIHdpdGggY293YXJkaWNlLDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+V2hpY2ggbWFueSB0aW1lcyBhIG1hbiBlbmN1bWJlcnMgc28sPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5JdCB0dXJucyBoaW0gYmFjayBmcm9tIGhvbm91cmVkIGVudGVycHJpc2UsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BcyBmYWxzZSBzaWdodCBkb3RoIGEgYmVhc3QsIHdoZW4gaGUgaXMgc2h5LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhhdCB0aG91IG1heXN0IGZyZWUgdGhlZSBmcm9tIHRoaXMgYXBwcmVoZW5zaW9uLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+SSZyc3F1bztsbCB0ZWxsIHRoZWUgd2h5IEkgY2FtZSwgYW5kIHdoYXQgSSBoZWFyZDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QXQgdGhlIGZpcnN0IG1vbWVudCB3aGVuIEkgZ3JpZXZlZCBmb3IgdGhlZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFtb25nIHRob3NlIHdhcyBJIHdobyBhcmUgaW4gc3VzcGVuc2UsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BbmQgYSBmYWlyLCBzYWludGx5IExhZHkgY2FsbGVkIHRvIG1lPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5JbiBzdWNoIHdpc2UsIEkgYmVzb3VnaHQgaGVyIHRvIGNvbW1hbmQgbWUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5IZXIgZXllcyB3aGVyZSBzaGluaW5nIGJyaWdodGVyIHRoYW4gdGhlIFN0YXI7PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BbmQgc2hlIGJlZ2FuIHRvIHNheSwgZ2VudGxlIGFuZCBsb3csPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaXRoIHZvaWNlIGFuZ2VsaWNhbCwgaW4gaGVyIG93biBsYW5ndWFnZTo8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPiZsc3F1bztPIHNwaXJpdCBjb3VydGVvdXMgb2YgTWFudHVhLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+T2Ygd2hvbSB0aGUgZmFtZSBzdGlsbCBpbiB0aGUgd29ybGQgZW5kdXJlcyw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBzaGFsbCBlbmR1cmUsIGxvbmctbGFzdGluZyBhcyB0aGUgd29ybGQ7PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BIGZyaWVuZCBvZiBtaW5lLCBhbmQgbm90IHRoZSBmcmllbmQgb2YgZm9ydHVuZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlVwb24gdGhlIGRlc2VydCBzbG9wZSBpcyBzbyBpbXBlZGVkPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5VcG9uIGhpcyB3YXksIHRoYXQgaGUgaGFzIHR1cm5lZCB0aHJvdWdoIHRlcnJvciw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFuZCBtYXksIEkgZmVhciwgYWxyZWFkeSBiZSBzbyBsb3N0LDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhhdCBJIHRvbyBsYXRlIGhhdmUgcmlzZW4gdG8gaGlzIHN1Y2NvdXIsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5Gcm9tIHRoYXQgd2hpY2ggSSBoYXZlIGhlYXJkIG9mIGhpbSBpbiBIZWF2ZW4uPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5CZXN0aXIgdGhlZSBub3csIGFuZCB3aXRoIHRoeSBzcGVlY2ggb3JuYXRlLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIHdpdGggd2hhdCBuZWVkZnVsIGlzIGZvciBoaXMgcmVsZWFzZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFzc2lzdCBoaW0gc28sIHRoYXQgSSBtYXkgYmUgY29uc29sZWQuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5CZWF0cmljZSBhbSBJLCB3aG8gZG8gYmlkIHRoZWUgZ287PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5JIGNvbWUgZnJvbSB0aGVyZSwgd2hlcmUgSSB3b3VsZCBmYWluIHJldHVybjs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkxvdmUgbW92ZWQgbWUsIHdoaWNoIGNvbXBlbGxldGggbWUgdG8gc3BlYWsuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5XaGVuIEkgc2hhbGwgYmUgaW4gcHJlc2VuY2Ugb2YgbXkgTG9yZCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkZ1bGwgb2Z0ZW4gd2lsbCBJIHByYWlzZSB0aGVlIHVudG8gaGltLiZyc3F1bzs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoZW4gcGF1c2VkIHNoZSwgYW5kIHRoZXJlYWZ0ZXIgSSBiZWdhbjo8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPiZsc3F1bztPIExhZHkgb2YgdmlydHVlLCB0aG91IGFsb25lIHRocm91Z2ggd2hvbTwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhlIGh1bWFuIHJhY2UgZXhjZWVkZXRoIGFsbCBjb250YWluZWQ8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldpdGhpbiB0aGUgaGVhdmVuIHRoYXQgaGFzIHRoZSBsZXNzZXIgY2lyY2xlcyw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlNvIGdyYXRlZnVsIHVudG8gbWUgaXMgdGh5IGNvbW1hbmRtZW50LDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VG8gb2JleSwgaWYgJmxzcXVvO3R3ZXJlIGFscmVhZHkgZG9uZSwgd2VyZSBsYXRlOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+Tm8gZmFydGhlciBuZWVkJmxzcXVvO3N0IHRob3Ugb3BlIHRvIG1lIHRoeSB3aXNoLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QnV0IHRoZSBjYXVzZSB0ZWxsIG1lIHdoeSB0aG91IGRvc3Qgbm90IHNodW48L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoZSBoZXJlIGRlc2NlbmRpbmcgZG93biBpbnRvIHRoaXMgY2VudHJlLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+RnJvbSB0aGUgdmFzdCBwbGFjZSB0aG91IGJ1cm5lc3QgdG8gcmV0dXJuIHRvLiZyc3F1bzs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPiZsc3F1bztTaW5jZSB0aG91IHdvdWxkc3QgZmFpbiBzbyBpbndhcmRseSBkaXNjZXJuLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QnJpZWZseSB3aWxsIEkgcmVsYXRlLCZyc3F1bzsgc2hlIGFuc3dlcmVkIG1lLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+JmxzcXVvO1doeSBJIGFtIG5vdCBhZnJhaWQgdG8gZW50ZXIgaGVyZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk9mIHRob3NlIHRoaW5ncyBvbmx5IHNob3VsZCBvbmUgYmUgYWZyYWlkPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCBoYXZlIHRoZSBwb3dlciBvZiBkb2luZyBvdGhlcnMgaGFybTs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPk9mIHRoZSByZXN0LCBubzsgYmVjYXVzZSB0aGV5IGFyZSBub3QgZmVhcmZ1bC48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkdvZCBpbiBoaXMgbWVyY3kgc3VjaCBjcmVhdGVkIG1lPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGF0IG1pc2VyeSBvZiB5b3VycyBhdHRhaW5zIG1lIG5vdCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPk5vciBhbnkgZmxhbWUgYXNzYWlscyBtZSBvZiB0aGlzIGJ1cm5pbmcuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BIGdlbnRsZSBMYWR5IGlzIGluIEhlYXZlbiwgd2hvIGdyaWV2ZXM8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkF0IHRoaXMgaW1wZWRpbWVudCwgdG8gd2hpY2ggSSBzZW5kIHRoZWUsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5TbyB0aGF0IHN0ZXJuIGp1ZGdtZW50IHRoZXJlIGFib3ZlIGlzIGJyb2tlbi48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkluIGhlciBlbnRyZWF0eSBzaGUgYmVzb3VnaHQgTHVjaWEsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BbmQgc2FpZCwgJmxkcXVvO1RoeSBmYWl0aGZ1bCBvbmUgbm93IHN0YW5kcyBpbiBuZWVkPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5PZiB0aGVlLCBhbmQgdW50byB0aGVlIEkgcmVjb21tZW5kIGhpbS4mcmRxdW87PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5MdWNpYSwgZm9lIG9mIGFsbCB0aGF0IGNydWVsIGlzLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+SGFzdGVuZWQgYXdheSwgYW5kIGNhbWUgdW50byB0aGUgcGxhY2U8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldoZXJlIEkgd2FzIHNpdHRpbmcgd2l0aCB0aGUgYW5jaWVudCBSYWNoZWwuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD4mbGRxdW87QmVhdHJpY2UmcmRxdW87IHNhaWQgc2hlLCAmbGRxdW87dGhlIHRydWUgcHJhaXNlIG9mIEdvZCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldoeSBzdWNjb3VyZXN0IHRob3Ugbm90IGhpbSwgd2hvIGxvdmVkIHRoZWUgc28sPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5Gb3IgdGhlZSBoZSBpc3N1ZWQgZnJvbSB0aGUgdnVsZ2FyIGhlcmQ/PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5Eb3N0IHRob3Ugbm90IGhlYXIgdGhlIHBpdHkgb2YgaGlzIHBsYWludD88L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkRvc3QgdGhvdSBub3Qgc2VlIHRoZSBkZWF0aCB0aGF0IGNvbWJhdHMgaGltPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5CZXNpZGUgdGhhdCBmbG9vZCwgd2hlcmUgb2NlYW4gaGFzIG5vIHZhdW50PyZyZHF1bzs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk5ldmVyIHdlcmUgcGVyc29ucyBpbiB0aGUgd29ybGQgc28gc3dpZnQ8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRvIHdvcmsgdGhlaXIgd2VhbCBhbmQgdG8gZXNjYXBlIHRoZWlyIHdvZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFzIEksIGFmdGVyIHN1Y2ggd29yZHMgYXMgdGhlc2Ugd2VyZSB1dHRlcmVkLDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+Q2FtZSBoaXRoZXIgZG93bndhcmQgZnJvbSBteSBibGVzc2VkIHNlYXQsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5Db25maWRpbmcgaW4gdGh5IGRpZ25pZmllZCBkaXNjb3Vyc2UsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCBob25vdXJzIHRoZWUsIGFuZCB0aG9zZSB3aG8mcnNxdW87dmUgbGlzdGVuZWQgdG8gaXQuJnJzcXVvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QWZ0ZXIgc2hlIHRodXMgaGFkIHNwb2tlbiB1bnRvIG1lLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2VlcGluZywgaGVyIHNoaW5pbmcgZXllcyBzaGUgdHVybmVkIGF3YXk7PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGVyZWJ5IHNoZSBtYWRlIG1lIHN3aWZ0ZXIgaW4gbXkgY29taW5nOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QW5kIHVudG8gdGhlZSBJIGNhbWUsIGFzIHNoZSBkZXNpcmVkOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+SSBoYXZlIGRlbGl2ZXJlZCB0aGVlIGZyb20gdGhhdCB3aWxkIGJlYXN0LDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hpY2ggYmFycmVkIHRoZSBiZWF1dGlmdWwgbW91bnRhaW4mcnNxdW87cyBzaG9ydCBhc2NlbnQuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5XaGF0IGlzIGl0LCB0aGVuPyAgV2h5LCB3aHkgZG9zdCB0aG91IGRlbGF5PzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2h5IGlzIHN1Y2ggYmFzZW5lc3MgYmVkZGVkIGluIHRoeSBoZWFydD88L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkRhcmluZyBhbmQgaGFyZGlob29kIHdoeSBoYXN0IHRob3Ugbm90LDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+U2VlaW5nIHRoYXQgdGhyZWUgc3VjaCBMYWRpZXMgYmVuZWRpZ2h0PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BcmUgY2FyaW5nIGZvciB0aGVlIGluIHRoZSBjb3VydCBvZiBIZWF2ZW4sPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BbmQgc28gbXVjaCBnb29kIG15IHNwZWVjaCBkb3RoIHByb21pc2UgdGhlZT8mcmRxdW87PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5FdmVuIGFzIHRoZSBmbG93ZXJldHMsIGJ5IG5vY3R1cm5hbCBjaGlsbCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkJvd2VkIGRvd24gYW5kIGNsb3NlZCwgd2hlbiB0aGUgc3VuIHdoaXRlbnMgdGhlbSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlVwbGlmdCB0aGVtc2VsdmVzIGFsbCBvcGVuIG9uIHRoZWlyIHN0ZW1zOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+U3VjaCBJIGJlY2FtZSB3aXRoIG15IGV4aGF1c3RlZCBzdHJlbmd0aCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBzdWNoIGdvb2QgY291cmFnZSB0byBteSBoZWFydCB0aGVyZSBjb3Vyc2VkLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhhdCBJIGJlZ2FuLCBsaWtlIGFuIGludHJlcGlkIHBlcnNvbjo8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPiZsZHF1bztPIHNoZSBjb21wYXNzaW9uYXRlLCB3aG8gc3VjY291cmVkIG1lLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIGNvdXJ0ZW91cyB0aG91LCB3aG8gaGFzdCBvYmV5ZWQgc28gc29vbjwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhlIHdvcmRzIG9mIHRydXRoIHdoaWNoIHNoZSBhZGRyZXNzZWQgdG8gdGhlZSE8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRob3UgaGFzdCBteSBoZWFydCBzbyB3aXRoIGRlc2lyZSBkaXNwb3NlZDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VG8gdGhlIGFkdmVudHVyZSwgd2l0aCB0aGVzZSB3b3JkcyBvZiB0aGluZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoYXQgdG8gbXkgZmlyc3QgaW50ZW50IEkgaGF2ZSByZXR1cm5lZC48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk5vdyBnbywgZm9yIG9uZSBzb2xlIHdpbGwgaXMgaW4gdXMgYm90aCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRob3UgTGVhZGVyLCBhbmQgdGhvdSBMb3JkLCBhbmQgTWFzdGVyIHRob3UuJnJkcXVvOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGh1cyBzYWlkIEkgdG8gaGltOyBhbmQgd2hlbiBoZSBoYWQgbW92ZWQsPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5JIGVudGVyZWQgb24gdGhlIGRlZXAgYW5kIHNhdmFnZSB3YXkuPC9wPjwvZGl2PicsXG5cblx0JzxwIGNsYXNzPVwiY2FudG9oZWFkXCI+SW5mZXJubzogQ2FudG8gSUlJPC9wPjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD4mbGRxdW87VGhyb3VnaCBtZSB0aGUgd2F5IGlzIHRvIHRoZSBjaXR5IGRvbGVudDs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRocm91Z2ggbWUgdGhlIHdheSBpcyB0byBldGVybmFsIGRvbGU7PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaHJvdWdoIG1lIHRoZSB3YXkgYW1vbmcgdGhlIHBlb3BsZSBsb3N0LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+SnVzdGljZSBpbmNpdGVkIG15IHN1YmxpbWUgQ3JlYXRvcjs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkNyZWF0ZWQgbWUgZGl2aW5lIE9tbmlwb3RlbmNlLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhlIGhpZ2hlc3QgV2lzZG9tIGFuZCB0aGUgcHJpbWFsIExvdmUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5CZWZvcmUgbWUgdGhlcmUgd2VyZSBubyBjcmVhdGVkIHRoaW5ncyw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPk9ubHkgZXRlcm5lLCBhbmQgSSBldGVybmFsIGxhc3QuPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BbGwgaG9wZSBhYmFuZG9uLCB5ZSB3aG8gZW50ZXIgaW4hJnJkcXVvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhlc2Ugd29yZHMgaW4gc29tYnJlIGNvbG91ciBJIGJlaGVsZDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V3JpdHRlbiB1cG9uIHRoZSBzdW1taXQgb2YgYSBnYXRlOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hlbmNlIEk6ICZsZHF1bztUaGVpciBzZW5zZSBpcywgTWFzdGVyLCBoYXJkIHRvIG1lISZyZHF1bzs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFuZCBoZSB0byBtZSwgYXMgb25lIGV4cGVyaWVuY2VkOjwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+JmxkcXVvO0hlcmUgYWxsIHN1c3BpY2lvbiBuZWVkcyBtdXN0IGJlIGFiYW5kb25lZCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFsbCBjb3dhcmRpY2UgbXVzdCBuZWVkcyBiZSBoZXJlIGV4dGluY3QuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5XZSB0byB0aGUgcGxhY2UgaGF2ZSBjb21lLCB3aGVyZSBJIGhhdmUgdG9sZCB0aGVlPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaG91IHNoYWx0IGJlaG9sZCB0aGUgcGVvcGxlIGRvbG9yb3VzPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaG8gaGF2ZSBmb3JlZ29uZSB0aGUgZ29vZCBvZiBpbnRlbGxlY3QuJnJkcXVvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QW5kIGFmdGVyIGhlIGhhZCBsYWlkIGhpcyBoYW5kIG9uIG1pbmU8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldpdGggam95ZnVsIG1pZW4sIHdoZW5jZSBJIHdhcyBjb21mb3J0ZWQsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5IZSBsZWQgbWUgaW4gYW1vbmcgdGhlIHNlY3JldCB0aGluZ3MuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5UaGVyZSBzaWdocywgY29tcGxhaW50cywgYW5kIHVsdWxhdGlvbnMgbG91ZDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+UmVzb3VuZGVkIHRocm91Z2ggdGhlIGFpciB3aXRob3V0IGEgc3Rhciw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldoZW5jZSBJLCBhdCB0aGUgYmVnaW5uaW5nLCB3ZXB0IHRoZXJlYXQuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5MYW5ndWFnZXMgZGl2ZXJzZSwgaG9ycmlibGUgZGlhbGVjdHMsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BY2NlbnRzIG9mIGFuZ2VyLCB3b3JkcyBvZiBhZ29ueSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCB2b2ljZXMgaGlnaCBhbmQgaG9hcnNlLCB3aXRoIHNvdW5kIG9mIGhhbmRzLDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+TWFkZSB1cCBhIHR1bXVsdCB0aGF0IGdvZXMgd2hpcmxpbmcgb248L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkZvciBldmVyIGluIHRoYXQgYWlyIGZvciBldmVyIGJsYWNrLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+RXZlbiBhcyB0aGUgc2FuZCBkb3RoLCB3aGVuIHRoZSB3aGlybHdpbmQgYnJlYXRoZXMuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbmQgSSwgd2hvIGhhZCBteSBoZWFkIHdpdGggaG9ycm9yIGJvdW5kLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+U2FpZDogJmxkcXVvO01hc3Rlciwgd2hhdCBpcyB0aGlzIHdoaWNoIG5vdyBJIGhlYXI/PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGF0IGZvbGsgaXMgdGhpcywgd2hpY2ggc2VlbXMgYnkgcGFpbiBzbyB2YW5xdWlzaGVkPyZyZHF1bzs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFuZCBoZSB0byBtZTogJmxkcXVvO1RoaXMgbWlzZXJhYmxlIG1vZGU8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPk1haW50YWluIHRoZSBtZWxhbmNob2x5IHNvdWxzIG9mIHRob3NlPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaG8gbGl2ZWQgd2l0aG91dGVuIGluZmFteSBvciBwcmFpc2UuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5Db21taW5nbGVkIGFyZSB0aGV5IHdpdGggdGhhdCBjYWl0aWZmIGNob2lyPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5PZiBBbmdlbHMsIHdobyBoYXZlIG5vdCByZWJlbGxpb3VzIGJlZW4sPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5Ob3IgZmFpdGhmdWwgd2VyZSB0byBHb2QsIGJ1dCB3ZXJlIGZvciBzZWxmLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhlIGhlYXZlbnMgZXhwZWxsZWQgdGhlbSwgbm90IHRvIGJlIGxlc3MgZmFpcjs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPk5vciB0aGVtIHRoZSBuZXRoZXJtb3JlIGFieXNzIHJlY2VpdmVzLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+Rm9yIGdsb3J5IG5vbmUgdGhlIGRhbW5lZCB3b3VsZCBoYXZlIGZyb20gdGhlbS4mcmRxdW87PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbmQgSTogJmxkcXVvO08gTWFzdGVyLCB3aGF0IHNvIGdyaWV2b3VzIGlzPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UbyB0aGVzZSwgdGhhdCBtYWtldGggdGhlbSBsYW1lbnQgc28gc29yZT8mcmRxdW87PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5IZSBhbnN3ZXJlZDogJmxkcXVvO0kgd2lsbCB0ZWxsIHRoZWUgdmVyeSBicmllZmx5LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhlc2UgaGF2ZSBubyBsb25nZXIgYW55IGhvcGUgb2YgZGVhdGg7PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BbmQgdGhpcyBibGluZCBsaWZlIG9mIHRoZWlycyBpcyBzbyBkZWJhc2VkLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhleSBlbnZpb3VzIGFyZSBvZiBldmVyeSBvdGhlciBmYXRlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+Tm8gZmFtZSBvZiB0aGVtIHRoZSB3b3JsZCBwZXJtaXRzIHRvIGJlOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+TWlzZXJpY29yZCBhbmQgSnVzdGljZSBib3RoIGRpc2RhaW4gdGhlbS48L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkxldCB1cyBub3Qgc3BlYWsgb2YgdGhlbSwgYnV0IGxvb2ssIGFuZCBwYXNzLiZyZHF1bzs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFuZCBJLCB3aG8gbG9va2VkIGFnYWluLCBiZWhlbGQgYSBiYW5uZXIsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCwgd2hpcmxpbmcgcm91bmQsIHJhbiBvbiBzbyByYXBpZGx5LDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhhdCBvZiBhbGwgcGF1c2UgaXQgc2VlbWVkIHRvIG1lIGluZGlnbmFudDs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFuZCBhZnRlciBpdCB0aGVyZSBjYW1lIHNvIGxvbmcgYSB0cmFpbjwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+T2YgcGVvcGxlLCB0aGF0IEkgbmUmcnNxdW87ZXIgd291bGQgaGF2ZSBiZWxpZXZlZDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhhdCBldmVyIERlYXRoIHNvIG1hbnkgaGFkIHVuZG9uZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPldoZW4gc29tZSBhbW9uZyB0aGVtIEkgaGFkIHJlY29nbmlzZWQsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5JIGxvb2tlZCwgYW5kIEkgYmVoZWxkIHRoZSBzaGFkZSBvZiBoaW08L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldobyBtYWRlIHRocm91Z2ggY293YXJkaWNlIHRoZSBncmVhdCByZWZ1c2FsLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+Rm9ydGh3aXRoIEkgY29tcHJlaGVuZGVkLCBhbmQgd2FzIGNlcnRhaW4sPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGF0IHRoaXMgdGhlIHNlY3Qgd2FzIG9mIHRoZSBjYWl0aWZmIHdyZXRjaGVzPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5IYXRlZnVsIHRvIEdvZCBhbmQgdG8gaGlzIGVuZW1pZXMuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5UaGVzZSBtaXNjcmVhbnRzLCB3aG8gbmV2ZXIgd2VyZSBhbGl2ZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldlcmUgbmFrZWQsIGFuZCB3ZXJlIHN0dW5nIGV4Y2VlZGluZ2x5PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5CeSBnYWRmbGllcyBhbmQgYnkgaG9ybmV0cyB0aGF0IHdlcmUgdGhlcmUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5UaGVzZSBkaWQgdGhlaXIgZmFjZXMgaXJyaWdhdGUgd2l0aCBibG9vZCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldoaWNoLCB3aXRoIHRoZWlyIHRlYXJzIGNvbW1pbmdsZWQsIGF0IHRoZWlyIGZlZXQ8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkJ5IHRoZSBkaXNndXN0aW5nIHdvcm1zIHdhcyBnYXRoZXJlZCB1cC48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFuZCB3aGVuIHRvIGdhemluZyBmYXJ0aGVyIEkgYmV0b29rIG1lLjwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+UGVvcGxlIEkgc2F3IG9uIGEgZ3JlYXQgcml2ZXImcnNxdW87cyBiYW5rOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hlbmNlIHNhaWQgSTogJmxkcXVvO01hc3Rlciwgbm93IHZvdWNoc2FmZSB0byBtZSw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRoYXQgSSBtYXkga25vdyB3aG8gdGhlc2UgYXJlLCBhbmQgd2hhdCBsYXc8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPk1ha2VzIHRoZW0gYXBwZWFyIHNvIHJlYWR5IHRvIHBhc3Mgb3Zlciw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFzIEkgZGlzY2VybiBhdGh3YXJ0IHRoZSBkdXNreSBsaWdodC4mcmRxdW87PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbmQgaGUgdG8gbWU6ICZsZHF1bztUaGVzZSB0aGluZ3Mgc2hhbGwgYWxsIGJlIGtub3duPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UbyB0aGVlLCBhcyBzb29uIGFzIHdlIG91ciBmb290c3RlcHMgc3RheTwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VXBvbiB0aGUgZGlzbWFsIHNob3JlIG9mIEFjaGVyb24uJnJkcXVvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhlbiB3aXRoIG1pbmUgZXllcyBhc2hhbWVkIGFuZCBkb3dud2FyZCBjYXN0LDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+RmVhcmluZyBteSB3b3JkcyBtaWdodCBpcmtzb21lIGJlIHRvIGhpbSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkZyb20gc3BlZWNoIHJlZnJhaW5lZCBJIHRpbGwgd2UgcmVhY2hlZCB0aGUgcml2ZXIuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbmQgbG8hIHRvd2FyZHMgdXMgY29taW5nIGluIGEgYm9hdDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QW4gb2xkIG1hbiwgaG9hcnkgd2l0aCB0aGUgaGFpciBvZiBlbGQsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5Dcnlpbmc6ICZsZHF1bztXb2UgdW50byB5b3UsIHllIHNvdWxzIGRlcHJhdmVkITwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+SG9wZSBuZXZlcm1vcmUgdG8gbG9vayB1cG9uIHRoZSBoZWF2ZW5zOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+SSBjb21lIHRvIGxlYWQgeW91IHRvIHRoZSBvdGhlciBzaG9yZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRvIHRoZSBldGVybmFsIHNoYWRlcyBpbiBoZWF0IGFuZCBmcm9zdC48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFuZCB0aG91LCB0aGF0IHlvbmRlciBzdGFuZGVzdCwgbGl2aW5nIHNvdWwsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaXRoZHJhdyB0aGVlIGZyb20gdGhlc2UgcGVvcGxlLCB3aG8gYXJlIGRlYWQhJnJkcXVvOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QnV0IHdoZW4gaGUgc2F3IHRoYXQgSSBkaWQgbm90IHdpdGhkcmF3LDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+SGUgc2FpZDogJmxkcXVvO0J5IG90aGVyIHdheXMsIGJ5IG90aGVyIHBvcnRzPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaG91IHRvIHRoZSBzaG9yZSBzaGFsdCBjb21lLCBub3QgaGVyZSwgZm9yIHBhc3NhZ2U7PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BIGxpZ2h0ZXIgdmVzc2VsIG5lZWRzIG11c3QgY2FycnkgdGhlZS4mcmRxdW87PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbmQgdW50byBoaW0gdGhlIEd1aWRlOiAmbGRxdW87VmV4IHRoZWUgbm90LCBDaGFyb247PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5JdCBpcyBzbyB3aWxsZWQgdGhlcmUgd2hlcmUgaXMgcG93ZXIgdG8gZG88L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoYXQgd2hpY2ggaXMgd2lsbGVkOyBhbmQgZmFydGhlciBxdWVzdGlvbiBub3QuJnJkcXVvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhlcmVhdCB3ZXJlIHF1aWV0ZWQgdGhlIGZsZWVjeSBjaGVla3M8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPk9mIGhpbSB0aGUgZmVycnltYW4gb2YgdGhlIGxpdmlkIGZlbiw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldobyByb3VuZCBhYm91dCBoaXMgZXllcyBoYWQgd2hlZWxzIG9mIGZsYW1lLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QnV0IGFsbCB0aG9zZSBzb3VscyB3aG8gd2Vhcnkgd2VyZSBhbmQgbmFrZWQ8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoZWlyIGNvbG91ciBjaGFuZ2VkIGFuZCBnbmFzaGVkIHRoZWlyIHRlZXRoIHRvZ2V0aGVyLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QXMgc29vbiBhcyB0aGV5IGhhZCBoZWFyZCB0aG9zZSBjcnVlbCB3b3Jkcy48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkdvZCB0aGV5IGJsYXNwaGVtZWQgYW5kIHRoZWlyIHByb2dlbml0b3JzLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhlIGh1bWFuIHJhY2UsIHRoZSBwbGFjZSwgdGhlIHRpbWUsIHRoZSBzZWVkPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5PZiB0aGVpciBlbmdlbmRlcmluZyBhbmQgb2YgdGhlaXIgYmlydGghPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5UaGVyZWFmdGVyIGFsbCB0b2dldGhlciB0aGV5IGRyZXcgYmFjayw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkJpdHRlcmx5IHdlZXBpbmcsIHRvIHRoZSBhY2N1cnNlZCBzaG9yZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldoaWNoIHdhaXRldGggZXZlcnkgbWFuIHdobyBmZWFycyBub3QgR29kLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+Q2hhcm9uIHRoZSBkZW1vbiwgd2l0aCB0aGUgZXllcyBvZiBnbGVkZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkJlY2tvbmluZyB0byB0aGVtLCBjb2xsZWN0cyB0aGVtIGFsbCB0b2dldGhlciw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkJlYXRzIHdpdGggaGlzIG9hciB3aG9ldmVyIGxhZ3MgYmVoaW5kLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QXMgaW4gdGhlIGF1dHVtbi10aW1lIHRoZSBsZWF2ZXMgZmFsbCBvZmYsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5GaXJzdCBvbmUgYW5kIHRoZW4gYW5vdGhlciwgdGlsbCB0aGUgYnJhbmNoPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5VbnRvIHRoZSBlYXJ0aCBzdXJyZW5kZXJzIGFsbCBpdHMgc3BvaWxzOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+SW4gc2ltaWxhciB3aXNlIHRoZSBldmlsIHNlZWQgb2YgQWRhbTwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhyb3cgdGhlbXNlbHZlcyBmcm9tIHRoYXQgbWFyZ2luIG9uZSBieSBvbmUsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BdCBzaWduYWxzLCBhcyBhIGJpcmQgdW50byBpdHMgbHVyZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlNvIHRoZXkgZGVwYXJ0IGFjcm9zcyB0aGUgZHVza3kgd2F2ZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBlcmUgdXBvbiB0aGUgb3RoZXIgc2lkZSB0aGV5IGxhbmQsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BZ2FpbiBvbiB0aGlzIHNpZGUgYSBuZXcgdHJvb3AgYXNzZW1ibGVzLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+JmxkcXVvO015IHNvbiwmcmRxdW87IHRoZSBjb3VydGVvdXMgTWFzdGVyIHNhaWQgdG8gbWUsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj4mbGRxdW87QWxsIHRob3NlIHdobyBwZXJpc2ggaW4gdGhlIHdyYXRoIG9mIEdvZDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+SGVyZSBtZWV0IHRvZ2V0aGVyIG91dCBvZiBldmVyeSBsYW5kOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QW5kIHJlYWR5IGFyZSB0aGV5IHRvIHBhc3MgbyZyc3F1bztlciB0aGUgcml2ZXIsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5CZWNhdXNlIGNlbGVzdGlhbCBKdXN0aWNlIHNwdXJzIHRoZW0gb24sPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5TbyB0aGF0IHRoZWlyIGZlYXIgaXMgdHVybmVkIGludG8gZGVzaXJlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhpcyB3YXkgdGhlcmUgbmV2ZXIgcGFzc2VzIGEgZ29vZCBzb3VsOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIGhlbmNlIGlmIENoYXJvbiBkb3RoIGNvbXBsYWluIG9mIHRoZWUsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XZWxsIG1heXN0IHRob3Uga25vdyBub3cgd2hhdCBoaXMgc3BlZWNoIGltcG9ydHMuJnJkcXVvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhpcyBiZWluZyBmaW5pc2hlZCwgYWxsIHRoZSBkdXNrIGNoYW1wYWlnbjwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VHJlbWJsZWQgc28gdmlvbGVudGx5LCB0aGF0IG9mIHRoYXQgdGVycm9yPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGUgcmVjb2xsZWN0aW9uIGJhdGhlcyBtZSBzdGlsbCB3aXRoIHN3ZWF0LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhlIGxhbmQgb2YgdGVhcnMgZ2F2ZSBmb3J0aCBhIGJsYXN0IG9mIHdpbmQsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BbmQgZnVsbWluYXRlZCBhIHZlcm1pbGlvbiBsaWdodCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldoaWNoIG92ZXJtYXN0ZXJlZCBpbiBtZSBldmVyeSBzZW5zZSw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFuZCBhcyBhIG1hbiB3aG9tIHNsZWVwIGhhdGggc2VpemVkIEkgZmVsbC48L3A+PC9kaXY+J107XG5cbm1vZHVsZS5leHBvcnRzID0gbG9uZ2ZlbGxvdztcbiIsIi8vIG5vcnRvbi5qc1xuXG52YXIgbm9ydG9uID0gWyc8cCBjbGFzcz1cInRpdGxlXCI+SGVsbDwvcD48cCBjbGFzcz1cImF1dGhvclwiPkNoYXJsZXMgRWxpb3QgTm9ydG9uPC9wPicsXG5cblx0JzxwIGNsYXNzPVwiY2FudG9oZWFkXCI+Q0FOVE8gSTwvcD48cCBjbGFzcz1cInN1bW1hcnlcIj5EYW50ZSwgYXN0cmF5IGluIGEgd29vZCwgcmVhY2hlcyB0aGUgZm9vdCBvZiBhIGhpbGwgd2hpY2ggaGUgYmVnaW5zIHRvIGFzY2VuZDsgaGUgaXMgaGluZGVyZWQgYnkgdGhyZWUgYmVhc3RzOyBoZSB0dXJucyBiYWNrIGFuZCBpcyBtZXQgYnkgVmlyZ2lsLCB3aG8gcHJvcG9zZXMgdG8gZ3VpZGUgaGltIGludG8gdGhlIGV0ZXJuYWwgd29ybGQuPC9wPjxwPk1pZHdheSB1cG9uIHRoZSByb2FkIG9mIG91ciBsaWZlIEkgZm91bmQgbXlzZWxmIHdpdGhpbiBhIGRhcmsgd29vZCwgZm9yIHRoZSByaWdodCB3YXkgaGFkIGJlZW4gbWlzc2VkLiBBaCEgaG93IGhhcmQgYSB0aGluZyBpdCBpcyB0byB0ZWxsIHdoYXQgdGhpcyB3aWxkIGFuZCByb3VnaCBhbmQgZGVuc2Ugd29vZCB3YXMsIHdoaWNoIGluIHRob3VnaHQgcmVuZXdzIHRoZSBmZWFyISBTbyBiaXR0ZXIgaXMgaXQgdGhhdCBkZWF0aCBpcyBsaXR0bGUgbW9yZS4gQnV0IGluIG9yZGVyIHRvIHRyZWF0IG9mIHRoZSBnb29kIHRoYXQgdGhlcmUgSSBmb3VuZCwgSSB3aWxsIHRlbGwgb2YgdGhlIG90aGVyIHRoaW5ncyB0aGF0IEkgaGF2ZSBzZWVuIHRoZXJlLiBJIGNhbm5vdCB3ZWxsIHJlY291bnQgaG93IEkgZW50ZXJlZCBpdCwgc28gZnVsbCB3YXMgSSBvZiBzbHVtYmVyIGF0IHRoYXQgcG9pbnQgd2hlcmUgSSBhYmFuZG9uZWQgdGhlIHRydWUgd2F5LiBCdXQgYWZ0ZXIgSSBoYWQgYXJyaXZlZCBhdCB0aGUgZm9vdCBvZiBhIGhpbGwsIHdoZXJlIHRoYXQgdmFsbGV5IGVuZGVkIHdoaWNoIGhhZCBwaWVyY2VkIG15IGhlYXJ0IHdpdGggZmVhciwgSSBsb29rZWQgb24gaGlnaCwgYW5kIHNhdyBpdHMgc2hvdWxkZXJzIGNsb3RoZWQgYWxyZWFkeSB3aXRoIHRoZSByYXlzIG9mIHRoZSBwbGFuZXQ8c3BhbiBjbGFzcz1cIm5vdGVcIj48c3BhbiBjbGFzcz1cIm5vdGVub1wiPjE8L3NwYW4+PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPlRoZSBzdW4sIGEgcGxhbmV0IGFjY29yZGluZyB0byB0aGUgUHRvbGVtYWljIHN5c3RlbS48L3NwYW4+PC9zcGFuPiB0aGF0IGxlYWRldGggbWVuIGFyaWdodCBhbG9uZyBldmVyeSBwYXRoLiBUaGVuIHdhcyB0aGUgZmVhciBhIGxpdHRsZSBxdWlldGVkIHdoaWNoIGluIHRoZSBsYWtlIG9mIG15IGhlYXJ0IGhhZCBsYXN0ZWQgdGhyb3VnaCB0aGUgbmlnaHQgdGhhdCBJIHBhc3NlZCBzbyBwaXRlb3VzbHkuIEFuZCBldmVuIGFzIG9uZSB3aG8gd2l0aCBzcGVudCBicmVhdGgsIGlzc3VlZCBvdXQgb2YgdGhlIHNlYSB1cG9uIHRoZSBzaG9yZSwgdHVybnMgdG8gdGhlIHBlcmlsb3VzIHdhdGVyIGFuZCBnYXplcywgc28gZGlkIG15IHNvdWwsIHdoaWNoIHN0aWxsIHdhcyBmbHlpbmcsIHR1cm4gYmFjayB0byBsb29rIGFnYWluIHVwb24gdGhlIHBhc3Mgd2hpY2ggbmV2ZXIgaGFkIGEgbGl2aW5nIHBlcnNvbiBsZWZ0LjwvcD48cD5BZnRlciBJIGhhZCByZXN0ZWQgYSBsaXR0bGUgbXkgd2VhcnkgYm9keSBJIHRvb2sgbXkgd2F5IGFnYWluIGFsb25nIHRoZSBkZXNlcnQgc2xvcGUsIHNvIHRoYXQgdGhlIGZpcm0gZm9vdCB3YXMgYWx3YXlzIHRoZSBsb3dlci4gQW5kIGhvISBhbG1vc3QgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgc3RlZXAgYSBzaGUtbGVvcGFyZCwgbGlnaHQgYW5kIHZlcnkgbmltYmxlLCB3aGljaCB3YXMgY292ZXJlZCB3aXRoIGEgc3BvdHRlZCBjb2F0LiBBbmQgc2hlIGRpZCBub3QgbW92ZSBmcm9tIGJlZm9yZSBteSBmYWNlLCBuYXksIHJhdGhlciBoaW5kZXJlZCBzbyBteSByb2FkIHRoYXQgdG8gcmV0dXJuIEkgb2Z0ZW50aW1lcyBoYWQgdHVybmVkLjwvcD48cD5UaGUgdGltZSB3YXMgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgbW9ybmluZywgYW5kIHRoZSBTdW4gd2FzIG1vdW50aW5nIHVwd2FyZCB3aXRoIHRob3NlIHN0YXJzIHRoYXQgd2VyZSB3aXRoIGhpbSB3aGVuIExvdmUgRGl2aW5lIGZpcnN0IHNldCBpbiBtb3Rpb24gdGhvc2UgYmVhdXRpZnVsIHRoaW5nczs8c3BhbiBjbGFzcz1cIm5vdGVcIj48c3BhbiBjbGFzcz1cIm5vdGVub1wiPjE8L3NwYW4+PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPkFjY29yZGluZyB0byBvbGQgdHJhZGl0aW9uIHRoZSBzcHJpbmcgd2FzIHRoZSBzZWFzb24gb2YgdGhlIGNyZWF0aW9uLjwvc3Bhbj48L3NwYW4+IHNvIHRoYXQgdGhlIGhvdXIgb2YgdGhlIHRpbWUgYW5kIHRoZSBzd2VldCBzZWFzb24gd2VyZSBvY2Nhc2lvbiBvZiBnb29kIGhvcGUgdG8gbWUgY29uY2VybmluZyB0aGF0IHdpbGQgYmVhc3Qgd2l0aCB0aGUgZGFwcGxlZCBza2luLiBCdXQgbm90IHNvIHRoYXQgdGhlIHNpZ2h0IHdoaWNoIGFwcGVhcmVkIHRvIG1lIG9mIGEgbGlvbiBkaWQgbm90IGdpdmUgbWUgZmVhci4gSGUgc2VlbWVkIHRvIGJlIGNvbWluZyBhZ2FpbnN0IG1lLCB3aXRoIGhlYWQgaGlnaCBhbmQgd2l0aCByYXZlbmluZyBodW5nZXIsIHNvIHRoYXQgaXQgc2VlbWVkIHRoYXQgdGhlIGFpciB3YXMgYWZmcmlnaHRlZCBhdCBoaW0uIEFuZCBhIHNoZS13b2xmLDxzcGFuIGNsYXNzPVwibm90ZVwiPjxzcGFuIGNsYXNzPVwibm90ZW5vXCI+Mjwvc3Bhbj48c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+VGhlc2UgdGhyZWUgYmVhc3RzIGNvcnJlc3BvbmQgdG8gdGhlIHRyaXBsZSBkaXZpc2lvbiBvZiBzaW5zIGludG8gdGhvc2Ugb2YgaW5jb250aW5lbmNlLCBvZiB2aW9sZW5jZSwgYW5kIG9mIGZyYXVkLiBTZWUgQ2FudG8gWEkuPC9zcGFuPjwvc3Bhbj4gd2hvIHdpdGggYWxsIGNyYXZpbmdzIHNlZW1lZCBsYWRlbiBpbiBoZXIgbWVhZ3JlbmVzcywgYW5kIGFscmVhZHkgaGFkIG1hZGUgbWFueSBmb2xrIHRvIGxpdmUgZm9ybG9ybiwmbWRhc2g7c2hlIGNhdXNlZCBtZSBzbyBtdWNoIGhlYXZpbmVzcywgd2l0aCB0aGUgZmVhciB0aGF0IGNhbWUgZnJvbSBzaWdodCBvZiBoZXIsIHRoYXQgSSBsb3N0IGhvcGUgb2YgdGhlIGhlaWdodC4gQW5kIHN1Y2ggYXMgaGUgaXMgd2hvIGdhaW5ldGggd2lsbGluZ2x5LCBhbmQgdGhlIHRpbWUgYXJyaXZlcyB0aGF0IG1ha2VzIGhpbSBsb3NlLCB3aG8gaW4gYWxsIGhpcyB0aG91Z2h0cyB3ZWVwcyBhbmQgaXMgc2FkLCZtZGFzaDtzdWNoIG1hZGUgbWUgdGhlIGJlYXN0IHdpdGhvdXQgcmVwb3NlIHRoYXQsIGNvbWluZyBvbiBhZ2FpbnN0IG1lLCBsaXR0bGUgYnkgbGl0dGxlIHdhcyBwdXNoaW5nIG1lIGJhY2sgdGhpdGhlciB3aGVyZSB0aGUgU3VuIGlzIHNpbGVudC48L3A+PHA+V2hpbGUgSSB3YXMgZmFsbGluZyBiYWNrIHRvIHRoZSBsb3cgcGxhY2UsIGJlZm9yZSBtaW5lIGV5ZXMgYXBwZWFyZWQgb25lIHdobyB0aHJvdWdoIGxvbmcgc2lsZW5jZSBzZWVtZWQgaG9hcnNlLiBXaGVuIEkgc2F3IGhpbSBpbiB0aGUgZ3JlYXQgZGVzZXJ0LCAmbGRxdW87SGF2ZSBwaXR5IG9uIG1lISZyZHF1bzsgSSBjcmllZCB0byBoaW0sICZsZHF1bzt3aGF0c28gdGhvdSBhcnQsIG9yIHNoYWRlIG9yIHJlYWwgbWFuLiZyZHF1bzsgSGUgYW5zd2VyZWQgbWU6ICZsZHF1bztOb3QgbWFuOyBtYW4gb25jZSBJIHdhcywgYW5kIG15IHBhcmVudHMgd2VyZSBMb21iYXJkcywgYW5kIE1hbnR1YW5zIGJ5IGNvdW50cnkgYm90aC4gSSB3YXMgYm9ybiBzdWIgSnVsaW8sIHRob3VnaCBsYXRlLCBhbmQgSSBsaXZlZCBhdCBSb21lIHVuZGVyIHRoZSBnb29kIEF1Z3VzdHVzLCBpbiB0aGUgdGltZSBvZiB0aGUgZmFsc2UgYW5kIGx5aW5nIGdvZHMuIFBvZXQgd2FzIEksIGFuZCBzYW5nIG9mIHRoYXQganVzdCBzb24gb2YgQW5jaGlzZXMgd2hvIGNhbWUgZnJvbSBUcm95IGFmdGVyIHByb3VkIElsaW9uIGhhZCBiZWVuIGJ1cm5lZC4gQnV0IHRob3UsIHdoeSByZXR1cm5lc3QgdGhvdSB0byBzbyBncmVhdCBhbm5veT8gV2h5IGRvc3QgdGhvdSBub3QgYXNjZW5kIHRoZSBkZWxlY3RhYmxlIG1vdW50YWluIHdoaWNoIGlzIHRoZSBzb3VyY2UgYW5kIGNhdXNlIG9mIGV2ZXJ5IGpveT8mcmRxdW87PC9wPjxwPiZsZHF1bztBcnQgdGhvdSB0aGVuIHRoYXQgVmlyZ2lsIGFuZCB0aGF0IGZvdW50IHdoaWNoIHBvdXJldGggZm9ydGggc28gbGFyZ2UgYSBzdHJlYW0gb2Ygc3BlZWNoPyZyZHF1bzsgcmVwbGllZCBJIHRvIGhpbSB3aXRoIGJhc2hmdWwgZnJvbnQ6ICZsZHF1bztPIGhvbm9yIGFuZCBsaWdodCBvZiB0aGUgb3RoZXIgcG9lbSBJIG1heSB0aGUgbG9uZyBzZWFsIGF2YWlsIG1lLCBhbmQgdGhlIGdyZWF0IGxvdmUsIHdoaWNoIGhhdmUgbWFkZSBtZSBzZWFyY2ggdGh5IHZvbHVtZSEgVGhvdSBhcnQgbXkgbWFzdGVyIGFuZCBteSBhdXRob3I7IHRob3UgYWxvbmUgYXJ0IGhlIGZyb20gd2hvbSBJIHRvb2sgdGhlIGZhaXIgc3R5bGUgdGhhdCBoYXRoIGRvbmUgbWUgaG9ub3IuIEJlaG9sZCB0aGUgYmVhc3QgYmVjYXVzZSBvZiB3aGljaCBJIHR1cm5lZDsgaGVscCBtZSBhZ2FpbnN0IGhlciwgZmFtb3VzIHNhZ2UsIGZvciBzaGUgbWFrZXMgYW55IHZlaW5zIGFuZCBwdWxzZXMgdHJlbWJsZS4mcmRxdW87ICZsZHF1bztUaGVlIGl0IGJlaG92ZXMgdG8gaG9sZCBhbm90aGVyIGNvdXJzZSwmcmRxdW87IGhlIHJlcGxpZWQsIHdoZW4gaGUgc2F3IG1lIHdlZXBpbmcsICZsZHF1bztpZiB0aG91IHdpc2hlc3QgdG8gZXNjYXBlIGZyb20gdGhpcyBzYXZhZ2UgcGxhY2U7IGZvciB0aGlzIGJlYXN0LCBiZWNhdXNlIG9mIHdoaWNoIHRob3UgY3JpZXN0IG91dCwgbGV0cyBub3QgYW55IG9uZSBwYXNzIGFsb25nIGhlciB3YXksIGJ1dCBzbyBoaW5kZXJzIGhpbSB0aGF0IHNoZSBraWxscyBoaW0hIGFuZCBzaGUgaGFzIGEgbmF0dXJlIHNvIG1hbGlnbiBhbmQgZXZpbCB0aGF0IHNoZSBuZXZlciBzYXRlcyBoZXIgZ3JlZWR5IHdpbGwsIGFuZCBhZnRlciBmb29kIGlzIGh1bmdyaWVyIHRoYW4gYmVmb3JlLiBNYW55IGFyZSB0aGUgYW5pbWFscyB3aXRoIHdoaWNoIHNoZSB3aXZlcywgYW5kIHRoZXJlIHNoYWxsIGJlIG1vcmUgeWV0LCB0aWxsIHRoZSBob3VuZDxzcGFuIGNsYXNzPVwibm90ZVwiPjxzcGFuIGNsYXNzPVwibm90ZW5vXCI+MTwvc3Bhbj48c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+T2Ygd2hvbSB0aGUgaG91bmQgaXMgdGhlIHN5bWJvbCwgYW5kIHRvIHdob20gRGFudGUgbG9va2VkIGZvciB0aGUgZGVsaXZlcmFuY2Ugb2YgSXRhbHkgZnJvbSB0aGUgZGlzY29yZGEgYW5kIG1pc3J1bGUgdGhhdCBtYWRlIGhlciB3cmV0Y2hlZCwgaXMgc3RpbGwgbWF0dGVyIG9mIGRvdWJ0LCBhZnRlciBjZW50dXJpZXMgb2YgY29udHJvdmVyc3kuPC9zcGFuPjwvc3Bhbj4gc2hhbGwgY29tZSB0aGF0IHdpbGwgbWFrZSBoZXIgZGllIG9mIGdyaWVmLiBIZSBzaGFsbCBub3QgZmVlZCBvbiBsYW5kIG9yIGdvb2RzLCBidXQgd2lzZG9tIGFuZCBsb3ZlIGFuZCB2YWxvciwgYW5kIGhpcyBiaXJ0aHBsYWNlIHNoYWxsIGJlIGJldHdlZW4gRmVsdHJvIGFuZCBGZWx0cm8uIE9mIHRoYXQgaHVtYmxlPHNwYW4gY2xhc3M9XCJub3RlXCI+PHNwYW4gY2xhc3M9XCJub3Rlbm9cIj4yPC9zcGFuPjxzcGFuIGNsYXNzPVwibm90ZXRleHRcIj5GYWxsZW4sIGh1bWlsaWF0ZWQuPC9zcGFuPjwvc3Bhbj4gSXRhbHkgc2hhbGwgaGUgYmUgdGhlIHNhbHZhdGlvbiwgZm9yIHdoaWNoIHRoZSB2aXJnaW4gQ2FtaWxsYSBkaWVkLCBhbmQgRXVyeWFsdXMsIFR1cm51cyBhbmQgTmlzdXMgb2YgdGhlaXIgd291bmRzLiBIZSBzaGFsbCBodW50IGhlciB0aHJvdWdoIGV2ZXJ5IHRvd24gdGlsbCBoZSBzaGFsbCBoYXZlIHNldCBoZXIgYmFjayBpbiBoZWxsLCB0aGVyZSB3aGVuY2UgZW52eSBmaXJzdCBzZW50IGhlciBmb3J0aC4gV2hlcmVmb3JlIEkgdGhpbmsgYW5kIGRlZW0gaXQgZm9yIHRoeSBiZXN0IHRoYXQgdGhvdSBmb2xsb3cgbWUsIGFuZCBJIHdpbGwgYmUgdGh5IGd1aWRlLCBhbmQgd2lsbCBsZWFkIHRoZWUgaGVuY2UgdGhyb3VnaCB0aGUgZXRlcm5hbCBwbGFjZSB3aGVyZSB0aG91IHNoYWx0IGhlYXIgdGhlIGRlc3BhaXJpbmcgc2hyaWVrcywgc2hhbHQgc2VlIHRoZSBhbmNpZW50IHNwaXJpdHMgd29lZnVsIHdobyBlYWNoIHByb2NsYWltIHRoZSBzZWNvbmQgZGVhdGguIEFuZCB0aGVuIHRob3Ugc2hhbHQgc2VlIHRob3NlIHdobyBhcmUgY29udGVudGVkIGluIHRoZSBmaXJlLCBiZWNhdXNlIHRoZXkgaG9wZSB0byBjb21lLCB3aGVuZXZlciBpdCBtYXkgYmUsIHRvIHRoZSBibGVzc2VkIGZvbGs7IHRvIHdob20gaWYgdGhvdSB3aWx0IHRoZXJlYWZ0ZXIgYXNjZW5kLCB0aGVtIHNoYWxsIGJlIGEgc291bCBtb3JlIHdvcnRoeSB0aGFuIEkgZm9yIHRoYXQuIFdpdGggaGVyIEkgd2lsbCBsZWF2ZSB0aGVlIGF0IG15IGRlcGFydHVyZTsgZm9yIHRoYXQgRW1wZXJvciB3aG8gcmVpZ25ldGggdGhlbSBhYm92ZSwgYmVjYXVzZSBJIHdhcyByZWJlbGxpb3VzIHRvIEhpcyBsYXcsIHdpbGxzIG5vdCB0aGF0IGludG8gSGlzIGNpdHkgYW55IG9uZSBzaG91bGQgY29tZSB0aHJvdWdoIG1lLiBJbiBhbGwgcGFydHMgSGUgZ292ZXJucyBhbmQgdGhlbSBIZSByZWlnbnM6IHRoZXJlIGluIEhpcyBjaXR5IGFuZCBIaXMgbG9mdHkgc2VhdC4gTyBoYXBweSBoZSB3aG9tIHRoZXJldG8gSGUgZWxlY3RzISZyZHF1bzsgQW5kIEkgdG8gaGltLCAmbGRxdW87UG9ldCwgSSBiZXNlZWNoIHRoZWUgYnkgdGhhdCBHb2Qgd2hvbSB0aG91IGRpZHN0IG5vdCBrbm93LCBpbiBvcmRlciB0aGF0IEkgbWF5IGVzY2FwZSB0aGlzIGlsbCBhbmQgd29yc2UsIHRoYXQgdGhvdSBsZWFkIG1lIHRoaXRoZXIgd2hvbSB0aG91IG5vdyBoZXN0IHNhaWQsIHNvIHRoYXQgSSBtYXkgc2VlIHRoZSBnYXRlIG9mIFN0LiBQZXRlciwgYW5kIHRob3NlIHdob20gdGhvdSBtYWtlc3Qgc28gYWZmbGljdGVkLiZyZHF1bzs8L3A+PHA+VGhlbiBoZSBtb3ZlZCBvbiwgYW5kIEkgYmVoaW5kIGhpbSBrZXB0LjwvcD4nLFxuXG5cdCc8cCBjbGFzcz1cImNhbnRvaGVhZFwiPkNBTlRPIElJPC9wPjxwIGNsYXNzPVwic3VtbWFyeVwiPkRhbnRlLCBkb3VidGZ1bCBvZiBoaXMgb3duIHBvd2VycywgaXMgZGlzY291cmFnZWQgYXQgdGhlIG91dHNldC4mbWRhc2g7VmlyZ2lsIGNoZWVycyBoaW0gYnkgdGVsbGluZyBoaW0gdGhhdCBoZSBoYXMgYmVlbiBzZW50IHRvIGhpcyBhaWQgYnkgYSBibGVzc2VkIFNwaXJpdCBmcm9tIEhlYXZlbi4mbWRhc2g7RGFudGUgY2FzdHMgb2ZmIGZlYXIsIGFuZCB0aGUgcG9ldHMgcHJvY2VlZC48L3A+PHA+VGhlIGRheSB3YXMgZ29pbmcsIGFuZCB0aGUgZHVza3kgYWlyIHdhcyB0YWtpbmcgdGhlIGxpdmluZyB0aGluZ3MgdGhhdCBhcmUgb24gZWFydGggZnJvbSB0aGVpciBmYXRpZ3VlcywgYW5kIEkgYWxvbmUgd2FzIHByZXBhcmluZyB0byBzdXN0YWluIHRoZSB3YXIgYWxpa2Ugb2YgdGhlIHJvYWQsIGFuZCBvZiB0aGUgd29lIHdoaWNoIHRoZSBtaW5kIHRoYXQgZXJyZXRoIG5vdCBzaGFsbCByZXRyYWNlLiBPIE11c2VzLCBPIGxvZnR5IGdlbml1cywgbm93IGFzc2lzdCBtZSEgTyBtaW5kIHRoYXQgZGlkc3QgaW5zY3JpYmUgdGhhdCB3aGljaCBJIHNhdywgaGVyZSBzaGFsbCB0aHkgbm9iaWxpdHkgYXBwZWFyISBJIGJlZ2FuOiZtZGFzaDsmbGRxdW87UG9ldCwgdGhhdCBndWlkZXN0IG1lLCBjb25zaWRlciBteSB2aXJ0dWUsIGlmIGl0IGlzIHN1ZmZpY2llbnQsIGVyZSB0byB0aGUgZGVlcCBwYXNzIHRob3UgdHJ1c3Rlc3QgbWUuIFRob3Ugc2F5ZXN0IHRoYXQgdGhlIHBhcmVudCBvZiBTaWx2aXVzIHdoaWxlIHN0aWxsIGNvcnJ1cHRpYmxlIHdlbnQgdG8gdGhlIGltbW9ydGFsIHdvcmxkIGFuZCB3YXMgdGhlcmUgaW4gdGhlIGJvZHkuIFdoZXJlZm9yZSBpZiB0aGUgQWR2ZXJzYXJ5IG9mIGV2ZXJ5IGlsbCB3YXMgdGhlbiBjb3VydGVvdXMsIHRoaW5raW5nIG9uIHRoZSBoaWdoIGVmZmVjdCB0aGF0IHNob3VsZCBwcm9jZWVkIGZyb20gaGltLCBhbmQgb24gdGhlIFdobyBhbmQgdGhlIFdoYXQsPHNwYW4gY2xhc3M9XCJub3RlXCI+PHNwYW4gY2xhc3M9XCJub3Rlbm9cIj4xPC9zcGFuPjxzcGFuIGNsYXNzPVwibm90ZXRleHRcIj5XaG8gaGUgd2FzLCBhbmQgd2hhdCBzaG91bGQgcmVzdWx0Ljwvc3Bhbj48L3NwYW4+IGl0IHNlZW1ldGggbm90IHVubWVldCB0byB0aGUgbWFuIG9mIHVuZGVyc3RhbmRpbmc7IGZvciBpbiB0aGUgZW1weXJlYWwgaGVhdmVuIGhlIGhhZCBiZWVuIGNob3NlbiBmb3IgZmF0aGVyIG9mIHJldmVyZWQgUm9tZSBhbmQgb2YgaGVyIGVtcGlyZTsgYm90aCB3aGljaCAodG8gc2F5IHRydXRoIGluZGVlZCkgd2VyZSBvcmRhaW5lZCBmb3IgdGhlIGhvbHkgcGxhY2Ugd2hlcmUgdGhlIHN1Y2Nlc3NvciBvZiB0aGUgZ3JlYXRlciBQZXRlciBoYXRoIGhpcyBzZWF0LiBUaHJvdWdoIHRoaXMgZ29pbmcsIHdoZXJlb2YgdGhvdSBnaXZlc3QgaGltIHZhdW50LCBoZSBsZWFybmVkIHRoaW5ncyB3aGljaCB3ZXJlIHRoZSBjYXVzZSBvZiBoaXMgdmljdG9yeSBhbmQgb2YgdGhlIHBhcGFsIG1hbnRsZS4gQWZ0ZXJ3YXJkIHRoZSBDaG9zZW4gVmVzc2VsIHdlbnQgdGhpdGhlciB0byBicmluZyB0aGVuY2UgY29tZm9ydCB0byB0aGF0IGZhaXRoIHdoaWNoIGlzIHRoZSBiZWdpbm5pbmcgb2YgdGhlIHdheSBvZiBzYWx2YXRpb24uIEJ1dCBJLCB3aHkgZ28gSSB0aGl0aGVyPyBvciB3aG8gY29uY2VkZXMgaXQ/IEkgYW0gbm90IEFlbmVhcywgSSBhbSBub3QgUGF1bDsgbWUgd29ydGh5IG9mIHRoaXMsIG5laXRoZXIgSSBub3Igb3RoZXJzIHRoaW5rOyB3aGVyZWZvcmUgaWYgSSBnaXZlIG15c2VsZiB1cCB0byBnbywgSSBmZWFyIGxlc3QgdGhlIGdvaW5nIG1heSBiZSBtYWQuIFRob3UgYXJ0IHdpc2UsIHRob3UgdW5kZXJzdGFuZGVzdCBiZXR0ZXIgdGhhbiBJIHNwZWFrLiZyZHF1bzs8L3A+PHA+QW5kIGFzIGlzIGhlIHdobyB1bndpbGxzIHdoYXQgaGUgd2lsbGVkLCBhbmQgYmVjYXVzZSBvZiBuZXcgdGhvdWdodHMgY2hhbmdlcyBoaXMgZGVzaWduLCBzbyB0aGF0IGhlIHF1aXRlIHdpdGhkcmF3cyBmcm9tIGJlZ2lubmluZywgc3VjaCBJIGJlY2FtZSBvbiB0aGF0IGRhcmsgaGlsbHNpZGU6IHdoZXJlZm9yZSBpbiBteSB0aG91Z2h0IEkgYWJhbmRvbmVkIHRoZSBlbnRlcnByaXNlIHdoaWNoIGhhZCBiZWVuIHNvIGhhc3R5IGluIHRoZSBiZWdpbm5pbmcuPC9wPjxwPiZsZHF1bztJZiBJIGhhdmUgcmlnaHRseSB1bmRlcnN0b29kIHRoeSBzcGVlY2gsJnJkcXVvOyByZXBsaWVkIHRoYXQgc2hhZGUgb2YgdGhlIG1hZ25hbmltb3VzIG9uZSwgJmxkcXVvO3RoeSBzb3VsIGlzIGh1cnQgYnkgY293YXJkaWNlLCB3aGljaCBvZnRlbnRpbWVzIGVuY3VtYmVyZXRoIGEgbWFuIHNvIHRoYXQgaXQgdHVybnMgaGltIGJhY2sgZnJvbSBob25vcmFibGUgZW50ZXJwcmlzZSwgYXMgZmFsc2Ugc2VlaW5nIGRvZXMgYSBiZWFzdCB3aGVuIGl0IGlzIHN0YXJ0bGVkLiBJbiBvcmRlciB0aGF0IHRob3UgbG9vc2UgdGhlZSBmcm9tIHRoaXMgZmVhciBJIHdpbGwgdGVsbCB0aGVlIHdoZXJlZm9yZSBJIGhhdmUgY29tZSwgYW5kIHdoYXQgSSBoZWFyZCBhdCB0aGUgZmlyc3QgbW9tZW50IHRoYXQgSSBncmlldmVkIGZvciB0aGVlLiBJIHdhcyBhbW9uZyB0aG9zZSB3aG8gYXJlIHN1c3BlbmRlZCw8c3BhbiBjbGFzcz1cIm5vdGVcIj48c3BhbiBjbGFzcz1cIm5vdGVub1wiPjE8L3NwYW4+PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPkluIExpbWJvLCBuZWl0aGVyIGluIEhlbGwgbm9yIEhlYXZlbi48L3NwYW4+PC9zcGFuPiBhbmQgYSBMYWR5IGNhbGxlZCBtZSwgc28gYmxlc3NlZCBhbmQgYmVhdXRpZnVsIHRoYXQgSSBiZXNvdWdodCBoZXIgdG8gY29tbWFuZC4gSGVyIGV5ZXMgd2VyZSBtb3JlIGx1Y2VudCB0aGFuIHRoZSBzdGFyLCBhbmQgc2hlIGJlZ2FuIHRvIHNwZWFrIHRvIG1lIHN3ZWV0IGFuZCBsb3csIHdpdGggYW5nZWxpYyB2b2ljZSwgaW4gaGVyIG93biB0b25ndWU6ICZsc3F1bztPIGNvdXJ0ZW91cyBNYW50dWFuIHNvdWwsIG9mIHdob20gdGhlIGZhbWUgeWV0IGxhc3RldGggaW4gdGhlIHdvcmxkLCBhbmQgc2hhbGwgbGFzdCBzbyBsb25nIGFzIHRoZSB3b3JsZCBlbmR1cmV0aCEgYSBmcmllbmQgb2YgbWluZSBhbmQgbm90IG9mIGZvcnR1bmUgdXBvbiB0aGUgZGVzZXJ0IGhpbGxzaWRlIGlzIHNvIGhpbmRlcmVkIG9uIGhpcyByb2FkIHRoYXQgaGUgaGFzIHR1cm5lZCBmb3IgZmVhciwgYW5kIEkgYW0gYWZyYWlkLCB0aHJvdWdoIHRoYXQgd2hpY2ggSSBoYXZlIGhlYXJkIG9mIGhpbSBpbiBoZWF2ZW4sIGxlc3QgYWxyZWFkeSBoZSBiZSBzbyBhc3RyYXkgdGhhdCBJIG1heSBoYXZlIHJpc2VuIGxhdGUgdG8gaGlzIHN1Y2Nvci4gTm93IGRvIHRob3UgbW92ZSwgYW5kIHdpdGggdGh5IHNwZWVjaCBvcm5hdGUsIGFuZCB3aXRoIHdoYXRldmVyIGlzIG5lZWRmdWwgZm9yIGhpcyBkZWxpdmVyYW5jZSwgYXNzaXN0IGhpbSBzbyB0aGF0IEkgbWF5IGJlIGNvbnNvbGVkIGZvciBoaW0uIEkgYW0gQmVhdHJpY2Ugd2hvIG1ha2UgdGhlZSBnby4gSSBjb21lIGZyb20gYSBwbGFjZSB3aGl0aGVyIEkgZGVzaXJlIHRvIHJldHVybi4gTG92ZSBtb3ZlZCBtZSwgYW5kIG1ha2VzIG1lIHNwZWFrLiBXaGVuIEkgc2hhbGwgYmUgYmVmb3JlIG15IExvcmQsIEkgd2lsbCBjb21tZW5kIHRoZWUgb2Z0ZW4gdW50byBIaW0uJnJzcXVvOyBUaGVuIHNoZSB3YXMgc2lsZW50LCBhbmQgdGhlcmVvbiBJIGJlZ2FuOiAmbHNxdW87TyBMYWR5IG9mIFZpcnR1ZSwgdGhvdSBhbG9uZSB0aHJvdWdoIHdob20gdGhlIGh1bWFuIHJhY2Ugc3VycGFzc2V0aCBhbGwgY29udGFpbmVkIHdpdGhpbiB0aGF0IGhlYXZlbiB3aGljaCBoYXRoIHRoZSBzbWFsbGVzdCBjaXJjbGVzITxzcGFuIGNsYXNzPVwibm90ZVwiPjxzcGFuIGNsYXNzPVwibm90ZW5vXCI+Mjwvc3Bhbj48c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+VGhlIGhlYXZlbiBvZiB0aGUgbW9vbiwgbmVhcmVzdCB0byB0aGUgZWFydGguPC9zcGFuPjwvc3Bhbj4gc28gcGxlYXNpbmcgdW50byBtZSBpcyB0aHkgY29tbWFuZCB0aGF0IHRvIG9iZXkgaXQsIHdlcmUgaXQgYWxyZWFkeSBkb25lLCB3ZXJlIHNsb3cgdG8gbWUuIFRob3UgaGFzdCBubyBuZWVkIGZ1cnRoZXIgdG8gb3BlbiB1bnRvIG1lIHRoeSB3aWxsOyBidXQgdGVsbCBtZSB0aGUgY2F1c2Ugd2h5IHRob3UgZ3VhcmRlc3Qgbm90IHRoeXNlbGYgZnJvbSBkZXNjZW5kaW5nIGRvd24gaGVyZSBpbnRvIHRoaXMgY2VudHJlLCBmcm9tIHRoZSBhbXBsZSBwbGFjZSB3aGl0aGVyIHRob3UgYnVybmVzdCB0byByZXR1cm4uJmxzcXVvOyAmcnNxdW87U2luY2UgdGhvdSB3aXNoZXN0IHRvIGtub3cgc28gaW53YXJkbHksIEkgd2lsbCB0ZWxsIHRoZWUgYnJpZWZseSwmcnNxdW87IHNoZSByZXBsaWVkIHRvIG1lLCAmbHNxdW87d2hlcmVmb3JlIEkgZmVhciBub3QgdG8gY29tZSBoZXJlIHdpdGhpbi4gT25lIG91Z2h0IHRvIGZlYXIgdGhvc2UgdGhpbmdzIG9ubHkgdGhhdCBoYXZlIHBvd2VyIG9mIGRvaW5nIGhhcm0sIHRoZSBvdGhlcnMgbm90LCBmb3IgdGhleSBhcmUgbm90IGRyZWFkZnVsLiBJIGFtIG1hZGUgYnkgR29kLCB0aGFua3MgYmUgdG8gSGltLCBzdWNoIHRoYXQgeW91ciBtaXNlcnkgdG91Y2hldGggbWUgbm90LCBub3IgZG90aCB0aGUgZmxhbWUgb2YgdGhpcyBidXJuaW5nIGFzc2FpbCBtZS4gQSBnZW50bGUgTGFkeTxzcGFuIGNsYXNzPVwibm90ZVwiPjxzcGFuIGNsYXNzPVwibm90ZW5vXCI+Mzwvc3Bhbj48c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+VGhlIFZpcmdpbi48L3NwYW4+PC9zcGFuPiBpcyBpbiBoZWF2ZW4gd2hvIGhhdGggcGl0eSBmb3IgdGhpcyBoaW5kcmFuY2Ugd2hlcmV0byBJIHNlbmQgdGhlZSwgc28gdGhhdCBzdGVybiBqdWRnbWVudCB0aGVyZSBhYm92ZSBzaGUgYnJlYWtldGguIFNoZSBzdW1tb25lZCBMdWNpYSBpbiBoZXIgcmVxdWVzdCwgYW5kIHNhaWQsICZsZHF1bztUaHkgZmFpdGhmdWwgb25lIG5vdyBoYXRoIG5lZWQgb2YgdGhlZSwgYW5kIHVudG8gdGhlZSBJIGNvbW1lbmQgaGltLiZyZHF1bzsgTHVjaWEsIHRoZSBmb2Ugb2YgZXZlcnkgY3J1ZWwgb25lLCByb3NlIGFuZCBjYW1lIHRvIHRoZSBwbGFjZSB3aGVyZSBJIHdhcywgc2VhdGVkIHdpdGggdGhlIGFuY2llbnQgUmFjaGVsLiBTaGUgc2FpZCwgJmxkcXVvO0JlYXRyaWNlLCB0cnVlIHByYWlzZSBvZiBHb2QsIHdoeSBkb3N0IHRob3Ugbm90IHN1Y2NvciBoaW0gd2hvIHNvIGxvdmVkIHRoZWUgdGhhdCBmb3IgdGhlZSBoZSBjYW1lIGZvcnRoIGZyb20gdGhlIHZ1bGdhciB0aHJvbmc/IERvc3QgdGhvdSBub3QgaGVhciB0aGUgcGl0eSBvZiBoaXMgcGxhaW50PyBEb3N0IHRob3Ugbm90IHNlZSB0aGUgZGVhdGggdGhhdCBjb21iYXRzIGhpbSBiZXNpZGUgdGhlIHN0cmVhbSB3aGVyZW9mIHRoZSBzZWEgaGF0aCBubyB2YXVudD8mcmRxdW87IEluIHRoZSB3b3JsZCBuZXZlciB3ZXJlIHBlcnNvbnMgc3dpZnQgdG8gc2VlayB0aGVpciBnb29kLCBhbmQgdG8gZmx5IHRoZWlyIGhhcm0sIGFzIEksIGFmdGVyIHRoZXNlIHdvcmRzIHdlcmUgdXR0ZXJlZCwgY2FtZSBoZXJlIGJlbG93LCBmcm9tIG15IGJsZXNzZWQgc2VhdCwgcHV0dGluZyBteSB0cnVzdCBpbiB0aHkgdXByaWdodCBzcGVlY2gsIHdoaWNoIGhvbm9ycyB0aGVlIGFuZCB0aGVtIHdobyBoYXZlIGhlYXJkIGl0LiZyc3F1bzsgQWZ0ZXIgc2hlIGhhZCBzYWlkIHRoaXMgdG8gbWUsIHdlZXBpbmcgc2hlIHR1cm5lZCBoZXIgbHVjZW50IGV5ZXMsIHdoZXJlYnkgc2hlIG1hZGUgbWUgbW9yZSBzcGVlZHkgaW4gY29taW5nLiBBbmQgSSBjYW1lIHRvIHRoZWUgYXMgc2hlIHdpbGxlZC4gVGhlZSBoYXZlIEkgZGVsaXZlcmVkIGZyb20gdGhhdCB3aWxkIGJlYXN0IHRoYXQgdG9vayBmcm9tIHRoZWUgdGhlIHNob3J0IGFzY2VudCBvZiB0aGUgYmVhdXRpZnVsIG1vdW50YWluLiBXaGF0IGlzIGl0IHRoZW4/IFdoeSwgd2h5IGRvc3QgdGhvdSBob2xkIGJhY2s/IHdoeSBkb3N0IHRob3UgaGFyYm9yIHN1Y2ggY293YXJkaWNlIGluIHRoeSBoZWFydD8gd2h5IGhhc3QgdGhvdSBub3QgZGFyaW5nIGFuZCBib2xkbmVzcywgc2luY2UgdGhyZWUgYmxlc3NlZCBMYWRpZXMgY2FyZSBmb3IgdGhlZSBpbiB0aGUgY291cnQgb2YgSGVhdmVuLCBhbmQgbXkgc3BlZWNoIHBsZWRnZXMgdGhlZSBzdWNoIGdvb2Q/JnJkcXVvOzwvcD48cD5BcyBmbG93ZXJldHMsIGJlbnQgYW5kIGNsb3NlZCBieSB0aGUgY2hpbGwgb2YgbmlnaHQsIGFmdGVyIHRoZSBzdW4gc2hpbmVzIG9uIHRoZW0gc3RyYWlnaHRlbiB0aGVtc2VsdmVzIGFsbCBvcGVuIG9uIHRoZWlyIHN0ZW0sIHNvIEkgYmVjYW1lIHdpdGggbXkgd2VhayB2aXJ0dWUsIGFuZCBzdWNoIGdvb2QgZGFyaW5nIGhhc3RlbmVkIHRvIG15IGhlYXJ0IHRoYXQgSSBiZWdhbiBsaWtlIG9uZSBlbmZyYW5jaGlzZWQ6ICZsZHF1bztPaCBjb21wYXNzaW9uYXRlIHNoZSB3aG8gc3VjY29yZWQgbWUhIGFuZCB0aG91IGNvdXJ0ZW91cyB3aG8gZGlkc3Qgc3BlZWRpbHkgb2JleSB0aGUgdHJ1ZSB3b3JkcyB0aGF0IHNoZSBhZGRyZXNzZWQgdG8gdGhlZSEgVGhvdSBieSB0aHkgd29yZHMgaGFzdCBzbyBkaXNwb3NlZCBteSBoZWFydCB3aXRoIGRlc2lyZSBvZiBnb2luZywgdGhhdCBJIGhhdmUgcmV0dXJuZWQgdW50byBteSBmaXJzdCBpbnRlbnQuIEdvIG9uIG5vdywgZm9yIG9uZSBzb2xlIHdpbGwgaXMgaW4gdXMgYm90aDogVGhvdSBMZWFkZXIsIHRob3UgTG9yZCwgYW5kIHRob3UgTWFzdGVyLiZyZHF1bzsgVGh1cyBJIHNhaWQgdG8gaGltOyBhbmQgd2hlbiBoZSBoYWQgbW92ZWQgb24sIEkgZW50ZXJlZCBhbG9uZyB0aGUgZGVlcCBhbmQgc2F2YWdlIHJvYWQuPC9wPicsXG5cblx0JzxwIGNsYXNzPVwiY2FudG9oZWFkXCI+Q0FOVE8gSUlJPC9wPjxwIGNsYXNzPVwic3VtbWFyeVwiPlRoZSBnYXRlIG9mIEhlbGwuJm1kYXNoO1ZpcmdpbCBsZW5kcyBEYW50ZSBpbi4mbWRhc2g7VGhlIHB1bmlzaG1lbnQgb2YgdGhlIG5laXRoZXIgZ29vZCBub3IgYmFkLiZtZGFzaDtBY2hlcm9uLCBhbmQgdGhlIHNpbm5lcnMgb24gaXRzIGJhbmsuJm1kYXNoO0NoYXJvbi4mbWRhc2g7RWFydGhxdWFrZS4mbWRhc2g7RGFudGUgc3dvb25zLjwvcD48cD4mbGRxdW87VGhyb3VnaCBtZSBpcyB0aGUgd2F5IGludG8gdGhlIHdvZWZ1bCBjaXR5OyB0aHJvdWdoIG1lIGlzIHRoZSB3YXkgaW50byBldGVybmFsIHdvZTsgdGhyb3VnaCBtZSBpcyB0aGUgd2F5IGFtb25nIHRoZSBsb3N0IHBlb3BsZS4gSnVzdGljZSBtb3ZlZCBteSBsb2Z0eSBtYWtlcjogdGhlIGRpdmluZSBQb3dlciwgdGhlIHN1cHJlbWUgV2lzZG9tIGFuZCB0aGUgcHJpbWFsIExvdmUgbWFkZSBtZS4gQmVmb3JlIG1lIHdlcmUgbm8gdGhpbmdzIGNyZWF0ZWQsIHVubGVzcyBldGVybmFsLCBhbmQgSSBldGVybmFsIGxhc3QuIExlYXZlIGV2ZXJ5IGhvcGUsIHllIHdobyBlbnRlciEmcmRxdW87PC9wPjxwPlRoZXNlIHdvcmRzIG9mIGNvbG9yIG9ic2N1cmUgSSBzYXcgd3JpdHRlbiBhdCB0aGUgdG9wIG9mIGEgZ2F0ZTsgd2hlcmVhdCBJLCAmbGRxdW87TWFzdGVyLCB0aGVpciBtZWFuaW5nIGlzIGRpcmUgdG8gbWUuJnJkcXVvOzwvcD48cD5BbmQgaGUgdG8gbWUsIGxpa2Ugb25lIHdobyBrbmV3LCAmbGRxdW87SGVyZSBpdCBiZWhvdmVzIHRvIGxlYXZlIGV2ZXJ5IGZlYXI7IGl0IGJlaG92ZXMgdGhhdCBhbGwgY293YXJkaWNlIHNob3VsZCBoZXJlIGJlIGRlYWQuIFdlIGhhdmUgY29tZSB0byB0aGUgcGxhY2Ugd2hlcmUgSSBoYXZlIHRvbGQgdGhlZSB0aGF0IHRob3Ugc2hhbHQgc2VlIHRoZSB3b2VmdWwgcGVvcGxlLCB3aG8gaGF2ZSBsb3N0IHRoZSBnb29kIG9mIHRoZSB1bmRlcnN0YW5kaW5nLiZyZHF1bzs8L3A+PHA+QW5kIHdoZW4gaGUgaGFkIHB1dCBoaXMgaGFuZCBvbiBtaW5lLCB3aXRoIGEgZ2xhZCBjb3VudGVuYW5jZSwgd2hlcmVmcm9tIEkgdG9vayBjb3VyYWdlLCBoZSBicm91Z2h0IG1lIHdpdGhpbiB0aGUgc2VjcmV0IHRoaW5ncy4gSGVyZSBzaWdocywgbGFtZW50cywgYW5kIGRlZXAgd2FpbGluZ3Mgd2VyZSByZXNvdW5kaW5nIHRob3VnaCB0aGUgc3Rhcmxlc3MgYWlyOyB3aGVyZWZvcmUgYXQgZmlyc3QgSSB3ZXB0IHRoZXJlYXQuIFN0cmFuZ2UgdG9uZ3VlcywgaG9ycmlibGUgY3JpZXMsIHdvcmRzIG9mIHdvZSwgYWNjZW50cyBvZiBhbmdlciwgdm9pY2VzIGhpZ2ggYW5kIGhvYXJzZSwgYW5kIHNvdW5kcyBvZiBoYW5kcyB3aXRoIHRoZW0sIHdlcmUgbWFraW5nIGEgdHVtdWx0IHdoaWNoIHdoaXJscyBmb3JldmVyIGluIHRoYXQgYWlyIGRhcmsgd2l0aG91dCBjaGFuZ2UsIGxpa2UgdGhlIHNhbmQgd2hlbiB0aGUgd2hpcmx3aW5kIGJyZWF0aGVzLjwvcD48cD5BbmQgSSwgd2hvIGhhZCBteSBoZWFkIGdpcnQgd2l0aCBob3Jyb3IsIHNhaWQsICZsZHF1bztNYXN0ZXIsIHdoYXQgaXMgaXQgdGhhdCBJIGhlYXI/IGFuZCB3aGF0IGZvbGsgYXJlIHRoZXkgd2hvIHNlZW0gaW4gd29lIHNvIHZhbnF1aXNoZWQ/JnJkcXVvOzwvcD48cD5BbmQgaGUgdG8gbWUsICZsZHF1bztUaGlzIG1pc2VyYWJsZSBtZWFzdXJlIHRoZSB3cmV0Y2hlZCBzb3VscyBtYWludGFpbiBvZiB0aG9zZSB3aG8gbGl2ZWQgd2l0aG91dCBpbmZhbXkgYW5kIHdpdGhvdXQgcHJhaXNlLiBNaW5nbGVkIGFyZSB0aGV5IHdpdGggdGhhdCBjYWl0aWZmIGNob2lyIG9mIHRoZSBhbmdlbHMsIHdobyB3ZXJlIG5vdCByZWJlbHMsIG5vciB3ZXJlIGZhaXRoZnVsIHRvIEdvZCwgYnV0IHdlcmUgZm9yIHRoZW1zZWx2ZXMuIFRoZSBoZWF2ZW5zIGNoYXNlZCB0aGVtIG91dCBpbiBvcmRlciB0byBiZSBub3QgbGVzcyBiZWF1dGlmdWwsIG5vciBkb3RoIHRoZSBkZXB0aCBvZiBIZWxsIHJlY2VpdmUgdGhlbSwgYmVjYXVzZSB0aGUgZGFtbmVkIHdvdWxkIGhhdmUgc29tZSBnbG9yeSBmcm9tIHRoZW0uJnJkcXVvOzwvcD48cD5BbmQgSSwgJmxkcXVvO01hc3Rlciwgd2hhdCBpcyBzbyBncmlldm91cyB0byB0aGVtLCB0aGF0IG1ha2VzIHRoZW0gbGFtZW50IHNvIGJpdHRlcmx5PyZyZHF1bzs8L3A+PHA+SGUgYW5zd2VyZWQsICZsZHF1bztJIHdpbGwgdGVsbCB0aGVlIHZlcnkgYnJpZWZseS4gVGhlc2UgaGF2ZSBubyBob3BlIG9mIGRlYXRoOyBhbmQgdGhlaXIgYmxpbmQgbGlmZSBpcyBzbyBkZWJhc2VkLCB0aGF0IHRoZXkgYXJlIGVudmlvdXMgb2YgZXZlcnkgb3RoZXIgbG90LiBGYW1lIG9mIHRoZW0gdGhlIHdvcmxkIHBlcm1pdHRldGggbm90IHRvIGJlOyBtZXJjeSBhbmQganVzdGljZSBkaXNkYWluIHRoZW0uIExldCB1cyBub3Qgc3BlYWsgb2YgdGhlbSwgYnV0IGRvIHRob3UgbG9vayBhbmQgcGFzcyBvbi4mcmRxdW87PC9wPjxwPkFuZCBJLCB3aG8gd2FzIGdhemluZywgc2F3IGEgYmFubmVyLCB0aGF0IHdoaXJsaW5nIHJhbiBzbyBzd2lmdGx5IHRoYXQgaXQgc2VlbWVkIHRvIG1lIHRvIHNjb3JuIGFsbCByZXBvc2UsIGFuZCBiZWhpbmQgaXQgY2FtZSBzbyBsb25nIGEgdHJhaW4gb2YgZm9saywgdGhhdCBJIGNvdWxkIG5ldmVyIGhhdmUgYmVsaWV2ZWQgZGVhdGggaGFkIHVuZG9uZSBzbyBtYW55LiBBZnRlciBJIGhhZCBkaXN0aW5ndWlzaGVkIHNvbWUgYW1vbmcgdGhlbSwgSSBzYXcgYW5kIGtuZXcgdGhlIHNoYWRlIG9mIGhpbSB3aG8gbWFkZSwgdGhyb3VnaCBjb3dhcmRpY2UsIHRoZSBncmVhdCByZWZ1c2FsLiA8c3BhbiBjbGFzcz1cIm5vdGVcIj48c3BhbiBjbGFzcz1cIm5vdGVub1wiPjE8L3NwYW4+PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPldobyBpcyBpbnRlbmRlZCBieSB0aGVzZSB3b3JkcyBpcyB1bmNlcnRhaW4uPC9zcGFuPjwvc3Bhbj4gQXQgb25jZSBJIHVuZGVyc3Rvb2QgYW5kIHdhcyBjZXJ0YWluLCB0aGF0IHRoaXMgd2FzIHRoZSBzZWN0IG9mIHRoZSBjYWl0aWZmcyBkaXNwbGVhc2luZyB1bnRvIEdvZCwgYW5kIHVudG8gaGlzIGVuZW1pZXMuIFRoZXNlIHdyZXRjaGVzLCB3aG8gbmV2ZXIgd2VyZSBhbGl2ZSwgd2VyZSBuYWtlZCwgYW5kIG11Y2ggc3R1bmcgYnkgZ2FkLWZsaWVzIGFuZCBieSB3YXNwcyB0aGF0IHdlcmUgdGhlcmUuIFRoZXNlIHN0cmVha2VkIHRoZWlyIGZhY2VzIHdpdGggYmxvb2QsIHdoaWNoLCBtaW5nbGVkIHdpdGggdGVhcnMsIHdhcyBoYXJ2ZXN0ZWQgYXQgdGhlaXIgZmVldCBieSBsb2F0aHNvbWUgd29ybXMuPC9wPjxwPkFuZCB3aGVuIEkgZ2F2ZSBteXNlbGYgdG8gbG9va2luZyBvbndhcmQsIEkgc2F3IHBlb3BsZSBvbiB0aGUgYmFuayBvZiBhIGdyZWF0IHJpdmVyOyB3aGVyZWZvcmUgSSBzYWlkLCAmbGRxdW87TWFzdGVyLCBub3cgZ3JhbnQgdG8gbWUgdGhhdCBJIG1heSBrbm93IHdobyB0aGVzZSBhcmUsIGFuZCB3aGF0IHJ1bGUgbWFrZXMgdGhlbSBhcHBlYXIgc28gcmVhZHkgdG8gcGFzcyBvdmVyLCBhcyBJIGRpc2Nlcm4gdGhyb3VnaCB0aGUgZmFpbnQgbGlnaHQuJnJkcXVvOyBBbmQgaGUgdG8gbWUsICZsZHF1bztUaGUgdGhpbmdzIHdpbGwgYmUgY2xlYXIgdG8gdGhlZSwgd2hlbiB3ZSBzaGFsbCBzZXQgb3VyIHN0ZXBzIG9uIHRoZSBzYWQgbWFyZ2Ugb2YgQWNoZXJvbi4mcmRxdW87IFRoZW4gd2l0aCBleWVzIGJhc2hmdWwgYW5kIGNhc3QgZG93biwgZmVhcmluZyBsZXN0IG15IHNwZWVjaCBoYWQgYmVlbiBpcmtzb21lIHRvIGhpbSwgZmFyIGFzIHRvIHRoZSByaXZlciBJIHJlZnJhaW5lZCBmcm9tIHNwZWFraW5nLjwvcD48cD5BbmQgbG8hIGNvbWluZyB0b3dhcmQgdXMgaW4gYSBib2F0LCBhbiBvbGQgbWFuLCB3aGl0ZSB3aXRoIGFuY2llbnQgaGFpciwgY3J5aW5nLCAmbGRxdW87V29lIHRvIHlvdSwgd2lja2VkIHNvdWxzISBob3BlIG5vdCBldmVyIHRvIHNlZSBIZWF2ZW4hIEkgY29tZSB0byBjYXJyeSB5b3UgdG8gdGhlIG90aGVyIGJhbmssIGludG8gZXRlcm5hbCBkYXJrbmVzcywgdG8gaGVhdCBhbmQgZnJvc3QuIEFuZCB0aG91IHdobyBhcnQgdGhlcmUsIGxpdmluZyBzb3VsLCBkZXBhcnQgZnJvbSB0aGVzZSB0aGF0IGFyZSBkZWFkLiZyZHF1bzsgQnV0IHdoZW4gaGUgc2F3IHRoYXQgSSBkaWQgbm90IGRlcGFydCwgaGUgc2FpZCwgJmxkcXVvO0J5IGFub3RoZXIgd2F5LCBieSBvdGhlciBwb3J0cyB0aG91IHNoYWx0IGNvbWUgdG8gdGhlIHNob3JlLCBub3QgaGVyZSwgZm9yIHBhc3NhZ2U7IGl0IGJlaG92ZXMgdGhhdCBhIGxpZ2h0ZXIgYmFyayBiZWFyIHRoZWUuJnJkcXVvOzxzcGFuIGNsYXNzPVwibm90ZVwiPjxzcGFuIGNsYXNzPVwibm90ZW5vXCI+MTwvc3Bhbj48c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+VGhlIGJvYXQgdGhhdCBiZWFycyB0aGUgc291bHMgdG8gUHVyZ2F0b3J5LiBDaGFyb24gcmVjb2duaXplcyB0aGF0IERhbnRlIGlzIG5vdCBhbW9uZyB0aGUgZGFtbmVkLjwvc3Bhbj48L3NwYW4+PC9wPjxwPkFuZCBteSBMZWFkZXIgdG8gaGltLCAmbGRxdW87Q2hhcm9uLCB2ZXggbm90IHRoeXNlbGYsIGl0IGlzIHRodXMgd2lsbGVkIHRoZXJlIHdoZXJlIGlzIHBvd2VyIHRvIGRvIHRoYXQgd2hpY2ggaXMgd2lsbGVkOyBhbmQgZmFydGhlciBhc2sgbm90LiZyZHF1bzsgVGhlbiB0aGUgZmxlZWN5IGNoZWVrcyB3ZXJlIHF1aWV0IG9mIHRoZSBwaWxvdCBvZiB0aGUgbGl2aWQgbWFyc2gsIHdobyByb3VuZCBhYm91dCBoaXMgZXllcyBoYWQgd2hlZWxzIG9mIGZsYW1lLjwvcD48cD5CdXQgdGhvc2Ugc291bHMsIHdobyB3ZXJlIHdlYXJ5IGFuZCBuYWtlZCwgY2hhbmdlZCBjb2xvciwgYW5kIGduYXNoZWQgdGhlaXIgdGVldGggc29vbiBhcyB0aGV5IGhlYXJkIGhpcyBjcnVlbCB3b3Jkcy4gVGhleSBibGFzcGhlbWVkIEdvZCBhbmQgdGhlaXIgcGFyZW50cywgdGhlIGh1bWFuIHJhY2UsIHRoZSBwbGFjZSwgdGhlIHRpbWUgYW5kIHRoZSBzZWVkIG9mIHRoZWlyIHNvd2luZyBhbmQgb2YgdGhlaXIgYmlydGguIFRoZW4sIGJpdHRlcmx5IHdlZXBpbmcsIHRoZXkgZHJldyBiYWNrIGFsbCBvZiB0aGVtIHRvZ2V0aGVyIHRvIHRoZSBldmlsIGJhbmssIHRoYXQgd2FpdHMgZm9yIGV2ZXJ5IG1hbiB3aG8gZmVhcnMgbm90IEdvZC4gQ2hhcm9uIHRoZSBkZW1vbiwgd2l0aCBleWVzIG9mIGdsb3dpbmcgY29hbCwgYmVja29uaW5nIHRoZW0sIGNvbGxlY3RzIHRoZW0gYWxsOyBoZSBiZWF0cyB3aXRoIGhpcyBvYXIgd2hvZXZlciBsaW5nZXJzLjwvcD48cD5BcyBpbiBhdXR1bW4gdGhlIGxlYXZlcyBmYWxsIG9mZiBvbmUgYWZ0ZXIgdGhlIG90aGVyLCB0aWxsIHRoZSBib3VnaCBzZWVzIGFsbCBpdHMgc3BvaWxzIHVwb24gdGhlIGVhcnRoLCBpbiBsaWtlIHdpc2UgdGhlIGV2aWwgc2VlZCBvZiBBZGFtIHRocm93IHRoZW1zZWx2ZXMgZnJvbSB0aGF0IHNob3JlIG9uZSBieSBvbmUgYXQgc2lnbmFscywgYXMgdGhlIGJpcmQgYXQgaGlzIGNhbGwuIFRodXMgdGhleSBnbyBvdmVyIHRoZSBkdXNreSB3YXZlLCBhbmQgYmVmb3JlIHRoZXkgaGF2ZSBsYW5kZWQgb24gdGhlIGZhcnRoZXIgc2lkZSwgYWxyZWFkeSBvbiB0aGlzIGEgbmV3IHRocm9uZyBpcyBnYXRoZXJlZC48L3A+PHA+JmxkcXVvO015IHNvbiwmcmRxdW87IHNhaWQgdGhlIGNvdXJ0ZW91cyBNYXN0ZXIsICZsZHF1bzt0aG9zZSB3aG8gZGllIGluIHRoZSB3cmF0aCBvZiBHb2QsIGFsbCBtZWV0IHRvZ2V0aGVyIGhlcmUgZnJvbSBldmVyeSBsYW5kLiBBbmQgdGhleSBhcmUgZWFnZXIgdG8gcGFzcyBvdmVyIHRoZSBzdHJlYW0sIGZvciB0aGUgZGl2aW5lIGp1c3RpY2Ugc3B1cnMgdGhlbSwgc28gdGhhdCBmZWFyIGlzIHR1cm5lZCB0byBkZXNpcmUuIFRoaXMgd2F5IGEgZ29vZCBzb3VsIG5ldmVyIHBhc3NlczsgYW5kIHRoZXJlZm9yZSBpZiBDaGFyb24gc25hcmxldGggYXQgdGhlZSwgdGhvdSBub3cgbWF5ZXN0IHdlbGwga25vdyB3aGF0IGhpcyBzcGVlY2ggc2lnbmlmaWVzLiZyZHF1bzsgVGhpcyBlbmRlZCwgdGhlIGRhcmsgcGxhaW4gdHJlbWJsZWQgc28gbWlnaHRpbHksIHRoYXQgdGhlIG1lbW9yeSBvZiB0aGUgdGVycm9yIGV2ZW4gbm93IGJhdGhlcyBtZSB3aXRoIHN3ZWF0LiBUaGUgdGVhcmZ1bCBsYW5kIGdhdmUgZm9ydGggYSB3aW5kIHRoYXQgZmxhc2hlZCBhIHZlcm1pbGlvbiBsaWdodCB3aGljaCB2YW5xdWlzaGVkIGV2ZXJ5IHNlbnNlIG9mIG1pbmUsIGFuZCBJIGZlbGwgYXMgYSBtYW4gd2hvbSBzbHVtYmVyIHNlaXplcy48L3A+J107XG5cbm1vZHVsZS5leHBvcnRzID0gbm9ydG9uO1xuIiwiLy8gd3JpZ2h0LmpzXG5cbnZhciB3cmlnaHQgPSBbJzxwIGNsYXNzPVwidGl0bGVcIj5JbmZlcm5vPC9wPjxwIGNsYXNzPVwiYXV0aG9yXCI+Uy4gRm93bGVyIFdyaWdodDwvcD4nLFxuXG5cdCc8cCBjbGFzcz1cImNhbnRvaGVhZFwiPkNhbnRvIEk8L3A+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk9ORSBuaWdodCwgd2hlbiBoYWxmIG15IGxpZmUgYmVoaW5kIG1lIGxheSw8L3A+PHA+SSB3YW5kZXJlZCBmcm9tIHRoZSBzdHJhaWdodCBsb3N0IHBhdGggYWZhci48L3A+PHA+VGhyb3VnaCB0aGUgZ3JlYXQgZGFyayB3YXMgbm8gcmVsZWFzaW5nIHdheTs8L3A+PHA+QWJvdmUgdGhhdCBkYXJrIHdhcyBubyByZWxpZXZpbmcgc3Rhci48L3A+PHA+SWYgeWV0IHRoYXQgdGVycm9yZWQgbmlnaHQgSSB0aGluayBvciBzYXksPC9wPjxwPkFzIGRlYXRoJnJzcXVvO3MgY29sZCBoYW5kcyBpdHMgZmVhcnMgcmVzdW1pbmcgYXJlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+R2xhZGx5IHRoZSBkcmVhZHMgSSBmZWx0LCB0b28gZGlyZSB0byB0ZWxsLDwvcD48cD5UaGUgaG9wZWxlc3MsIHBhdGhsZXNzLCBsaWdodGxlc3MgaG91cnMgZm9yZ290LDwvcD48cD5JIHR1cm4gbXkgdGFsZSB0byB0aGF0IHdoaWNoIG5leHQgYmVmZWxsLDwvcD48cD5XaGVuIHRoZSBkYXduIG9wZW5lZCwgYW5kIHRoZSBuaWdodCB3YXMgbm90LjwvcD48cD5UaGUgaG9sbG93ZWQgYmxhY2tuZXNzIG9mIHRoYXQgd2FzdGUsIEdvZCB3b3QsPC9wPjxwPlNocmFuaywgdGhpbm5lZCwgYW5kIGNlYXNlZC4gQSBibGluZGluZyBzcGxlbmRvdXIgaG90PC9wPjxwPkZsdXNoZWQgdGhlIGdyZWF0IGhlaWdodCB0b3dhcmQgd2hpY2ggbXkgZm9vdHN0ZXBzIGZlbGwsPC9wPjxwPkFuZCB0aG91Z2ggaXQga2luZGxlZCBmcm9tIHRoZSBuZXRoZXIgaGVsbCw8L3A+PHA+T3IgZnJvbSB0aGUgU3RhciB0aGF0IGFsbCBtZW4gbGVhZHMsIGFsaWtlPC9wPjxwPkl0IHNob3dlZCBtZSB3aGVyZSB0aGUgZ3JlYXQgZGF3bi1nbG9yaWVzIHN0cmlrZTwvcD48cD5UaGUgd2lkZSBlYXN0LCBhbmQgdGhlIHV0bW9zdCBwZWFrcyBvZiBzbm93LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+SG93IGZpcnN0IEkgZW50ZXJlZCBvbiB0aGF0IHBhdGggYXN0cmF5LDwvcD48cD5CZXNldCB3aXRoIHNsZWVwLCBJIGtub3cgbm90LiBUaGlzIEkga25vdy48L3A+PHA+V2hlbiBnYWluZWQgbXkgZmVldCB0aGUgdXB3YXJkLCBsaWdodGVkIHdheSw8L3A+PHA+SSBiYWNrd2FyZCBnYXplZCwgYXMgb25lIHRoZSBkcm93bmluZyBzZWEsPC9wPjxwPlRoZSBkZWVwIHN0cm9uZyB0aWRlcywgaGFzIGJhZmZsZWQsIGFuZCBwYW50aW5nIGxpZXMsPC9wPjxwPk9uIHRoZSBzaGVsdmVkIHNob3JlLCBhbmQgdHVybnMgaGlzIGV5ZXMgdG8gc2VlPC9wPjxwPlRoZSBsZWFndWUtd2lkZSB3YXN0ZXMgdGhhdCBoZWxkIGhpbS4gU28gbWluZSBleWVzPC9wPjxwPlN1cnZleWVkIHRoYXQgZmVhciwgdGhlIHdoaWxlIG15IHdlYXJpZWQgZnJhbWU8L3A+PHA+UmVzdGVkLCBhbmQgZXZlciBteSBoZWFydCZyc3F1bztzIHRvc3NlZCBsYWtlIGJlY2FtZTwvcD48cD5Nb3JlIHF1aWV0LjwvcD48cD5UaGVuIGZyb20gdGhhdCBwYXNzIHJlbGVhc2VkLCB3aGljaCB5ZXQ8L3A+PHA+V2l0aCBsaXZpbmcgZmVldCBoYWQgbm8gbWFuIGxlZnQsIEkgc2V0PC9wPjxwPk15IGZvcndhcmQgc3RlcHMgYXNsYW50IHRoZSBzdGVlcCwgdGhhdCBzbyw8L3A+PHA+TXkgcmlnaHQgZm9vdCBzdGlsbCB0aGUgbG93ZXIsIEkgY2xpbWJlZC48L3A+PHAgY2xhc3M9XCJzbGluZGVudDhlbVwiPkJlbG93PC9wPjxwPk5vIG1vcmUgSSBnYXplZC4gQXJvdW5kLCBhIHNsb3BlIG9mIHNhbmQ8L3A+PHA+V2FzIHN0ZXJpbGUgb2YgYWxsIGdyb3d0aCBvbiBlaXRoZXIgaGFuZCw8L3A+PHA+T3IgbW92aW5nIGxpZmUsIGEgc3BvdHRlZCBwYXJkIGV4Y2VwdCw8L3A+PHA+VGhhdCB5YXduaW5nIHJvc2UsIGFuZCBzdHJldGNoZWQsIGFuZCBwdXJyZWQgYW5kIGxlYXB0PC9wPjxwPlNvIGNsb3NlbHkgcm91bmQgbXkgZmVldCwgdGhhdCBzY2FyY2UgSSBrZXB0PC9wPjxwPlRoZSBjb3Vyc2UgSSB3b3VsZC48L3A+PHAgY2xhc3M9XCJzbGluZGVudDRlbVwiPlRoYXQgc2xlZWsgYW5kIGxvdmVseSB0aGluZyw8L3A+PHA+VGhlIGJyb2FkZW5pbmcgbGlnaHQsIHRoZSBicmVhdGggb2YgbW9ybiBhbmQgc3ByaW5nLDwvcD48cD5UaGUgc3VuLCB0aGF0IHdpdGggaGlzIHN0YXJzIGluIEFyaWVzIGxheSw8L3A+PHA+QXMgd2hlbiBEaXZpbmUgTG92ZSBvbiBDcmVhdGlvbiZyc3F1bztzIGRheTwvcD48cD5GaXJzdCBnYXZlIHRoZXNlIGZhaXIgdGhpbmdzIG1vdGlvbiwgYWxsIGF0IG9uZTwvcD48cD5NYWRlIGxpZ2h0c29tZSBob3BlOyBidXQgbGlnaHRzb21lIGhvcGUgd2FzIG5vbmU8L3A+PHA+V2hlbiBkb3duIHRoZSBzbG9wZSB0aGVyZSBjYW1lIHdpdGggbGlmdGVkIGhlYWQ8L3A+PHA+QW5kIGJhY2stYmxvd24gbWFuZSBhbmQgY2F2ZXJuZWQgbW91dGggYW5kIHJlZCw8L3A+PHA+QSBsaW9uLCByb2FyaW5nLCBhbGwgdGhlIGFpciBhc2hha2U8L3A+PHA+VGhhdCBoZWFyZCBoaXMgaHVuZ2VyLiBVcHdhcmQgZmxpZ2h0IHRvIHRha2U8L3A+PHA+Tm8gaGVhcnQgd2FzIG1pbmUsIGZvciB3aGVyZSB0aGUgZnVydGhlciB3YXk8L3A+PHA+TWluZSBhbnhpb3VzIGV5ZXMgZXhwbG9yZWQsIGEgc2hlLXdvbGYgbGF5LDwvcD48cD5UaGF0IGxpY2tlZCBsZWFuIGZsYW5rcywgYW5kIHdhaXRlZC4gU3VjaCB3YXMgc2hlPC9wPjxwPkluIGFzcGVjdCBydXRobGVzcyB0aGF0IEkgcXVha2VkIHRvIHNlZSw8L3A+PHA+QW5kIHdoZXJlIHNoZSBsYXkgYW1vbmcgaGVyIGJvbmVzIGhhZCBicm91Z2h0PC9wPjxwPlNvIG1hbnkgdG8gZ3JpZWYgYmVmb3JlLCB0aGF0IGFsbCBteSB0aG91Z2h0PC9wPjxwPkFnaGFzdCB0dXJuZWQgYmFja3dhcmQgdG8gdGhlIHN1bmxlc3MgbmlnaHQ8L3A+PHA+SSBsZWZ0LiBCdXQgd2hpbGUgSSBwbHVuZ2VkIGluIGhlYWRsb25nIGZsaWdodDwvcD48cD5UbyB0aGF0IG1vc3QgZmVhcmVkIGJlZm9yZSwgYSBzaGFkZSwgb3IgbWFuPC9wPjxwPihFaXRoZXIgaGUgc2VlbWVkKSwgb2JzdHJ1Y3Rpbmcgd2hlcmUgSSByYW4sPC9wPjxwPkNhbGxlZCB0byBtZSB3aXRoIGEgdm9pY2UgdGhhdCBmZXcgc2hvdWxkIGtub3csPC9wPjxwPkZhaW50IGZyb20gZm9yZ2V0ZnVsIHNpbGVuY2UsICZsZHF1bztXaGVyZSB5ZSBnbyw8L3A+PHA+VGFrZSBoZWVkLiBXaHkgdHVybiB5ZSBmcm9tIHRoZSB1cHdhcmQgd2F5PyZyZHF1bzs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkkgY3JpZWQsICZsZHF1bztPciBjb21lIHllIGZyb20gd2FybSBlYXJ0aCwgb3IgdGhleTwvcD48cD5UaGUgZ3JhdmUgaGF0aCB0YWtlbiwgaW4gbXkgbW9ydGFsIG5lZWQ8L3A+PHA+SGF2ZSBtZXJjeSB0aG91ISZyZHF1bzs8L3A+PHAgY2xhc3M9XCJzbGluZGVudDRlbVwiPkhlIGFuc3dlcmVkLCAmbGRxdW87U2hhZGUgYW0gSSw8L3A+PHA+VGhhdCBvbmNlIHdhcyBtYW47IGJlbmVhdGggdGhlIExvbWJhcmQgc2t5LDwvcD48cD5JbiB0aGUgbGF0ZSB5ZWFycyBvZiBKdWxpdXMgYm9ybiwgYW5kIGJyZWQ8L3A+PHA+SW4gTWFudHVhLCB0aWxsIG15IHlvdXRoZnVsIHN0ZXBzIHdlcmUgbGVkPC9wPjxwPlRvIFJvbWUsIHdoZXJlIHlldCB0aGUgZmFsc2UgZ29kcyBsaWVkIHRvIG1hbjs8L3A+PHA+QW5kIHdoZW4gdGhlIGdyZWF0IEF1Z3VzdGFuIGFnZSBiZWdhbiw8L3A+PHA+SSB3cm90ZSB0aGUgdGFsZSBvZiBJbGl1bSBidXJudCwgYW5kIGhvdzwvcD48cD5BbmNoaXNlcyZyc3F1bzsgc29uIGZvcnRoLXB1c2hlZCBhIHZlbnR1cm91cyBwcm93LDwvcD48cD5TZWVraW5nIHVua25vd24gc2Vhcy4gQnV0IGluIHdoYXQgbW9vZCBhcnQgdGhvdTwvcD48cD5UbyB0aHVzIHJldHVybiB0byBhbGwgdGhlIGlsbHMgeWUgZmxlZCw8L3A+PHA+VGhlIHdoaWxlIHRoZSBtb3VudGFpbiBvZiB0aHkgaG9wZSBhaGVhZDwvcD48cD5MaWZ0cyBpbnRvIGxpZ2h0LCB0aGUgc291cmNlIGFuZCBjYXVzZSBvZiBhbGw8L3A+PHA+RGVsZWN0YWJsZSB0aGluZ3MgdGhhdCBtYXkgdG8gbWFuIGJlZmFsbD8mcmRxdW87PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5JIGFuc3dlcmVkLCAmbGRxdW87QXJ0IHRob3UgdGhlbiB0aGF0IFZpcmdpbCwgaGU8L3A+PHA+RnJvbSB3aG9tIGFsbCBncmFjZSBvZiBtZWFzdXJlZCBzcGVlY2ggaW4gbWU8L3A+PHA+RGVyaXZlZD8gTyBnbG9yaW91cyBhbmQgZmFyLWd1aWRpbmcgc3RhciE8L3A+PHA+Tm93IG1heSB0aGUgbG92ZS1sZWQgc3R1ZGlvdXMgaG91cnMgYW5kIGxvbmc8L3A+PHA+SW4gd2hpY2ggSSBsZWFybnQgaG93IHJpY2ggdGh5IHdvbmRlcnMgYXJlLDwvcD48cD5NYXN0ZXIgYW5kIEF1dGhvciBtaW5lIG9mIExpZ2h0IGFuZCBTb25nLDwvcD48cD5CZWZyaWVuZCBtZSBub3csIHdobyBrbmV3IHRoeSB2b2ljZSwgdGhhdCBmZXc8L3A+PHA+WWV0IGhlYXJrZW4uIEFsbCB0aGUgbmFtZSBteSB3b3JrIGhhdGggd29uPC9wPjxwPklzIHRoaW5lIG9mIHJpZ2h0LCBmcm9tIHdob20gSSBsZWFybmVkLiBUbyB0aGVlLDwvcD48cD5BYmFzaGVkLCBJIGdyYW50IGl0LiAuIC4gV2h5IHRoZSBtb3VudGluZyBzdW48L3A+PHA+Tm8gbW9yZSBJIHNlZWssIHllIHNjYXJjZSBzaG91bGQgYXNrLCB3aG8gc2VlPC9wPjxwPlRoZSBiZWFzdCB0aGF0IHR1cm5lZCBtZSwgbm9yIGZhaW50IGhvcGUgaGF2ZSBJPC9wPjxwPlRvIGZvcmNlIHRoYXQgcGFzc2FnZSBpZiB0aGluZSBhaWQgZGVueS4mbGRxdW87PC9wPjxwPkhlIGFuc3dlcmVkLCAmbGRxdW87V291bGQgeWUgbGVhdmUgdGhpcyB3aWxkIGFuZCBsaXZlLDwvcD48cD5TdHJhbmdlIHJvYWQgaXMgb3VycywgZm9yIHdoZXJlIHRoZSBzaGUtd29sZiBsaWVzPC9wPjxwPlNoYWxsIG5vIG1hbiBwYXNzLCBleGNlcHQgdGhlIHBhdGggaGUgdHJpZXM8L3A+PHA+SGVyIGNyYWZ0IGVudGFuZ2xlLiBObyB3YXkgZnVnaXRpdmU8L3A+PHA+QXZvaWRzIHRoZSBzZWVraW5nIG9mIGhlciBncmVlZHMsIHRoYXQgZ2l2ZTwvcD48cD5JbnNhdGlhdGUgaHVuZ2VyLCBhbmQgc3VjaCB2aWNlIHBlcnZlcnNlPC9wPjxwPkFzIG1ha2VzIGhlciBsZWFuZXIgd2hpbGUgc2hlIGZlZWRzLCBhbmQgd29yc2U8L3A+PHA+SGVyIGNyYXZpbmcuIEFuZCB0aGUgYmVhc3RzIHdpdGggd2hpY2ggc2hlIGJyZWVkPC9wPjxwPlRoZSBub2lzb21lIG51bWVyb3VzIGJlYXN0cyBoZXIgbHVzdHMgcmVxdWlyZSw8L3A+PHA+QmFyZSBhbGwgdGhlIGRlc2lyYWJsZSBsYW5kcyBpbiB3aGljaCBzaGUgZmVlZHM7PC9wPjxwPk5vciBzaGFsbCBsZXdkIGZlYXN0cyBhbmQgbGV3ZGVyIG1hdGluZ3MgdGlyZTwvcD48cD5VbnRpbCBzaGUgd29vcywgaW4gZXZpbCBob3VyIGZvciBoZXIsPC9wPjxwPlRoZSB3b2xmaG91bmQgdGhhdCBzaGFsbCByZW5kIGhlci4gSGlzIGRlc2lyZTwvcD48cD5JcyBub3QgZm9yIHJhcGluZSwgYXMgdGhlIHByb21wdGluZ3Mgc3RpcjwvcD48cD5PZiBoZXIgYmFzZSBoZWFydDsgYnV0IHdpc2RvbXMsIGFuZCBkZXZvaXJzPC9wPjxwPk9mIG1hbmhvb2QsIGFuZCBsb3ZlJnJzcXVvO3MgcnVsZSwgaGlzIHRob3VnaHRzIHByZWZlci48L3A+PHA+VGhlIEl0YWxpYW4gbG93bGFuZHMgaGUgc2hhbGwgcmVhY2ggYW5kIHNhdmUsPC9wPjxwPkZvciB3aGljaCBDYW1pbGxhIG9mIG9sZCwgdGhlIHZpcmdpbiBicmF2ZSw8L3A+PHA+VHVybnVzIGFuZCBOaXN1cyBkaWVkIGluIHN0cmlmZS4gSGlzIGNoYXNlPC9wPjxwPkhlIHNoYWxsIG5vdCBjZWFzZSwgbm9yIGFueSBjb3dlcmluZy1wbGFjZTwvcD48cD5IZXIgZmVhciBzaGFsbCBmaW5kIGhlciwgdGlsbCBoZSBkcml2ZSBoZXIgYmFjayw8L3A+PHA+RnJvbSBjaXR5IHRvIGNpdHkgZXhpbGVkLCBmcm9tIHdyYWNrIHRvIHdyYWNrPC9wPjxwPlNsYWluIG91dCBvZiBsaWZlLCB0byBmaW5kIHRoZSBuYXRpdmUgaGVsbDwvcD48cD5XaGVuY2UgZW52eSBsb29zZWQgaGVyLjwvcD48cCBjbGFzcz1cInNsaW5kZW50NmVtXCI+Rm9yIHRoeXNlbGYgd2VyZSB3ZWxsPC9wPjxwPlRvIGZvbGxvdyB3aGVyZSBJIGxlYWQsIGFuZCB0aG91IHNoYWx0IHNlZTwvcD48cD5UaGUgc3Bpcml0cyBpbiBwYWluLCBhbmQgaGVhciB0aGUgaG9wZWxlc3Mgd29lLDwvcD48cD5UaGUgdW5lbmRpbmcgY3JpZXMsIG9mIHRob3NlIHdob3NlIG9ubHkgcGxlYTwvcD48cD5JcyBqdWRnbWVudCwgdGhhdCB0aGUgc2Vjb25kIGRlYXRoIHRvIGJlPC9wPjxwPkZhbGwgcXVpY2tseS4gRnVydGhlciBzaGFsdCB0aG91IGNsaW1iLCBhbmQgZ288L3A+PHA+VG8gdGhvc2Ugd2hvIGJ1cm4sIGJ1dCBpbiB0aGVpciBwYWluIGNvbnRlbnQ8L3A+PHA+V2l0aCBob3BlIG9mIHBhcmRvbjsgc3RpbGwgYmV5b25kLCBtb3JlIGhpZ2gsPC9wPjxwPkhvbGllciB0aGFuIG9wZW5zIHRvIHN1Y2ggc291bHMgYXMgSSw8L3A+PHA+VGhlIEhlYXZlbnMgdXByZWFyOyBidXQgaWYgdGhvdSB3aWx0LCBpcyBvbmU8L3A+PHA+V29ydGhpZXIsIGFuZCBzaGUgc2hhbGwgZ3VpZGUgdGhlZSB0aGVyZSwgd2hlcmUgbm9uZTwvcD48cD5XaG8gZGlkIHRoZSBMb3JkIG9mIHRob3NlIGZhaXIgcmVhbG1zIGRlbnk8L3A+PHA+TWF5IGVudGVyLiBUaGVyZSBpbiBoaXMgY2l0eSBIZSBkd2VsbHMsIGFuZCB0aGVyZTwvcD48cD5SdWxlcyBhbmQgcGVydmFkZXMgaW4gZXZlcnkgcGFydCwgYW5kIGNhbGxzPC9wPjxwPkhpcyBjaG9zZW4gZXZlciB3aXRoaW4gdGhlIHNhY3JlZCB3YWxscy48L3A+PHA+TyBoYXBwaWVzdCwgdGhleSEmcmRxdW87PC9wPjxwIGNsYXNzPVwic2xpbmRlbnQ0ZW1cIj5JIGFuc3dlcmVkLCAmbGRxdW87QnkgdGhhdCBHb2Q8L3A+PHA+VGhvdSBkaWRzdCBub3Qga25vdywgSSBkbyB0aGluZSBhaWQgZW50cmVhdCw8L3A+PHA+QW5kIGd1aWRhbmNlLCB0aGF0IGJleW9uZCB0aGUgaWxscyBJIG1lZXQ8L3A+PHA+SSBzYWZldHkgZmluZCwgd2l0aGluIHRoZSBTYWNyZWQgR2F0ZTwvcD48cD5UaGF0IFBldGVyIGd1YXJkcywgYW5kIHRob3NlIHNhZCBzb3VscyB0byBzZWU8L3A+PHA+V2hvIGxvb2sgd2l0aCBsb25naW5nIGZvciB0aGVpciBlbmQgdG8gYmUuJnJkcXVvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhlbiBoZSBtb3ZlZCBmb3J3YXJkLCBhbmQgYmVoaW5kIEkgdHJvZC48L3A+PC9kaXY+JyxcblxuXHQnPGRpdiBjbGFzcz1cImNhbnRvXCI+PHAgY2xhc3M9XCJjYW50b2hlYWRcIj5DYW50byBJSTwvcD48L3A+PHA+PGRpdiBjbGFzcz1cInN0YW56YVwiPlRIRSBkYXkgd2FzIGZhbGxpbmcsIGFuZCB0aGUgZGFya2VuaW5nIGFpcjwvcD48cD5SZWxlYXNlZCBlYXJ0aCZyc3F1bztzIGNyZWF0dXJlcyBmcm9tIHRoZWlyIHRvaWxzLCB3aGlsZSBJLDwvcD48cD5JIG9ubHksIGZhY2VkIHRoZSBiaXR0ZXIgcm9hZCBhbmQgYmFyZTwvcD48cD5NeSBNYXN0ZXIgbGVkLiBJIG9ubHksIG11c3QgZGVmeTwvcD48cD5UaGUgcG93ZXJzIG9mIHBpdHksIGFuZCB0aGUgbmlnaHQgdG8gYmUuPC9wPjxwPlNvIHRob3VnaHQgSSwgYnV0IHRoZSB0aGluZ3MgSSBjYW1lIHRvIHNlZSw8L3A+PHA+V2hpY2ggbWVtb3J5IGhvbGRzLCBjb3VsZCBuZXZlciB0aG91Z2h0IGZvcmVjYXN0LjwvcD48cD5PIE11c2VzIGhpZ2ghIE8gR2VuaXVzLCBmaXJzdCBhbmQgbGFzdCE8L3A+PHA+TWVtb3JpZXMgaW50ZW5zZSEgWW91ciB1dG1vc3QgcG93ZXJzIGNvbWJpbmU8L3A+PHA+VG8gbWVldCB0aGlzIG5lZWQuIEZvciBuZXZlciB0aGVtZSBhcyBtaW5lPC9wPjxwPlN0cmFpbmVkIHZhaW5seSwgd2hlcmUgeW91ciBsb2Z0aWVzdCBub2JsZW5lc3M8L3A+PHA+TXVzdCBmYWlsIHRvIGJlIHN1ZmZpY2llbnQuPC9wPjxwIGNsYXNzPVwic2xpbmRlbnQxMGVtXCI+Rmlyc3QgSSBzYWlkLDwvcD48cD5GZWFyaW5nLCB0byBoaW0gd2hvIHRocm91Z2ggdGhlIGRhcmtuZXNzIGxlZCw8L3A+PHA+JmxkcXVvO08gcG9ldCwgZXJlIHRoZSBhcmR1b3VzIHBhdGggeWUgcHJlc3M8L3A+PHA+VG9vIGZhciwgbG9vayBpbiBtZSwgaWYgdGhlIHdvcnRoIHRoZXJlIGJlPC9wPjxwPlRvIG1ha2UgdGhpcyB0cmFuc2l0LiAmQUVsaWc7bmVhcyBvbmNlLCBJIGtub3csPC9wPjxwPldlbnQgZG93biBpbiBsaWZlLCBhbmQgY3Jvc3NlZCB0aGUgaW5mZXJuYWwgc2VhOzwvcD48cD5BbmQgaWYgdGhlIExvcmQgb2YgQWxsIFRoaW5ncyBMb3N0IEJlbG93PC9wPjxwPkFsbG93ZWQgaXQsIHJlYXNvbiBzZWVtcywgdG8gdGhvc2Ugd2hvIHNlZTwvcD48cD5UaGUgZW5kdXJpbmcgZ3JlYXRuZXNzIG9mIGhpcyBkZXN0aW55LDwvcD48cD5XaG8gaW4gdGhlIEVtcHlyZWFuIEhlYXZlbiBlbGVjdCB3YXMgY2FsbGVkPC9wPjxwPlNpcmUgb2YgdGhlIEV0ZXJuYWwgQ2l0eSwgdGhhdCB0aHJvbmVkIGFuZCB3YWxsZWQ8L3A+PHA+TWFkZSBFbXBpcmUgb2YgdGhlIHdvcmxkIGJleW9uZCwgdG8gYmU8L3A+PHA+VGhlIEhvbHkgUGxhY2UgYXQgbGFzdCwgYnkgR29kJnJzcXVvO3MgZGVjcmVlLDwvcD48cD5XaGVyZSB0aGUgZ3JlYXQgUGV0ZXImcnNxdW87cyBmb2xsb3dlciBydWxlcy4gRm9yIGhlPC9wPjxwPkxlYXJuZWQgdGhlcmUgdGhlIGNhdXNlcyBvZiBoaXMgdmljdG9yeS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPiZsZHF1bztBbmQgbGF0ZXIgdG8gdGhlIHRoaXJkIGdyZWF0IEhlYXZlbiB3YXMgY2F1Z2h0PC9wPjxwPlRoZSBsYXN0IEFwb3N0bGUsIGFuZCB0aGVuY2UgcmV0dXJuaW5nIGJyb3VnaHQ8L3A+PHA+VGhlIHByb29mcyBvZiBvdXIgc2FsdmF0aW9uLiBCdXQsIGZvciBtZSw8L3A+PHA+SSBhbSBub3QgJkFFbGlnO25lYXMsIG5heSwgbm9yIFBhdWwsIHRvIHNlZTwvcD48cD5VbnNwZWFrYWJsZSB0aGluZ3MgdGhhdCBkZXB0aHMgb3IgaGVpZ2h0cyBjYW4gc2hvdyw8L3A+PHA+QW5kIGlmIHRoaXMgcm9hZCBmb3Igbm8gc3VyZSBlbmQgSSBnbzwvcD48cD5XaGF0IGZvbGx5IGlzIG1pbmU/IEJ1dCBhbnkgd29yZHMgYXJlIHdlYWsuPC9wPjxwPlRoeSB3aXNkb20gZnVydGhlciB0aGFuIHRoZSB0aGluZ3MgSSBzcGVhazwvcD48cD5DYW4gc2VhcmNoIHRoZSBldmVudCB0aGF0IHdvdWxkIGJlLiZyZHF1bzs8L3A+PHAgY2xhc3M9XCJzbGluZGVudDEwZW1cIj5IZXJlIEkgc3RheWVkPC9wPjxwPk15IHN0ZXBzIGFtaWQgdGhlIGRhcmtuZXNzLCBhbmQgdGhlIFNoYWRlPC9wPjxwPlRoYXQgbGVkIG1lIGhlYXJkIGFuZCB0dXJuZWQsIG1hZ25hbmltb3VzLDwvcD48cD5BbmQgc2F3IG1lIGRyYWluZWQgb2YgcHVycG9zZSBoYWx0aW5nIHRodXMsPC9wPjxwPkFuZCBhbnN3ZXJlZCwgJmxkcXVvO0lmIHRoeSBjb3dhcmQtYm9ybiB0aG91Z2h0cyBiZSBjbGVhciw8L3A+PHA+QW5kIGFsbCB0aHkgb25jZSBpbnRlbnQsIGluZmlybWVkIG9mIGZlYXIsPC9wPjxwPkJyb2tlbiwgdGhlbiBhcnQgdGhvdSBhcyBzY2FyZWQgYmVhc3RzIHRoYXQgc2h5PC9wPjxwPkZyb20gc2hhZG93cywgc3VyZWx5IHRoYXQgdGhleSBrbm93IG5vdCB3aHk8L3A+PHA+Tm9yIHdoZXJlZm9yZS4gLiAuIEhlYXJrZW4sIHRvIGNvbmZvdW5kIHRoeSBmZWFyLDwvcD48cD5UaGUgdGhpbmdzIHdoaWNoIGZpcnN0IEkgaGVhcmQsIGFuZCBicm91Z2h0IG1lIGhlcmUuPC9wPjxwPk9uZSBjYW1lIHdoZXJlLCBpbiB0aGUgT3V0ZXIgUGxhY2UsIEkgZHdlbGwsPC9wPjxwPlN1c3BlbnNlIGZyb20gaG9wZSBvZiBIZWF2ZW4gb3IgZmVhciBvZiBIZWxsLDwvcD48cD5SYWRpYW50IGluIGxpZ2h0IHRoYXQgbmF0aXZlIHJvdW5kIGhlciBjbHVuZyw8L3A+PHA+QW5kIGNhc3QgaGVyIGV5ZXMgb3VyIGhvcGVsZXNzIFNoYWRlcyBhbW9uZzwvcD48cD4oRXllcyB3aXRoIG5vIGVhcnRobHkgbGlrZSBidXQgaGVhdmVuJnJzcXVvO3Mgb3duIGJsdWUpLDwvcD48cD5BbmQgY2FsbGVkIG1lIHRvIGhlciBpbiBzdWNoIHZvaWNlIGFzIGZldzwvcD48cD5JbiB0aGF0IGdyaW0gcGxhY2UgaGFkIGhlYXJkLCBzbyBsb3csIHNvIGNsZWFyLDwvcD48cD5TbyB0b25lZCBhbmQgY2FkZW5jZWQgZnJvbSB0aGUgVXRtb3N0IFNwaGVyZSw8L3A+PHA+VGhlIFVuYXR0YWluYWJsZSBIZWF2ZW4gZnJvbSB3aGljaCBzaGUgY2FtZS48L3A+PHA+JmxzcXVvO08gTWFudHVhbiBTcGlyaXQsJnJzcXVvOyBzaGUgc2FpZCwgJmxzcXVvO3dob3NlIGxhc3RpbmcgZmFtZTwvcD48cD5Db250aW51ZXMgb24gdGhlIGVhcnRoIHllIGxlZnQsIGFuZCBzdGlsbDwvcD48cD5XaXRoIFRpbWUgc2hhbGwgc3RhbmQsIGFuIGVhcnRobHkgZnJpZW5kIHRvIG1lLDwvcD48cD4tIE15IGZyaWVuZCwgbm90IGZvcnR1bmUmcnNxdW87cyZuYnNwOyZuZGFzaDsgY2xpbWJzIGEgcGF0aCBzbyBpbGw8L3A+PHA+VGhhdCBhbGwgdGhlIG5pZ2h0LWJyZWQgZmVhcnMgaGUgaGFzdGVzIHRvIGZsZWU8L3A+PHA+V2VyZSBraW5kbHkgdG8gdGhlIHRoaW5nIGhlIG5lYXJzLiBUaGUgdGFsZTwvcD48cD5Nb3ZlZCB0aHJvdWdoIHRoZSBwZWFjZSBvZiBJIGxlYXZlbiwgYW5kIHN3aWZ0IEkgc3BlZDwvcD48cD5Eb3dud2FyZCwgdG8gYWlkIG15IGZyaWVuZCBpbiBsb3ZlJnJzcXVvO3MgYXZhaWwsPC9wPjxwPldpdGggc2NhbnR5IHRpbWUgdGhlcmVmb3IsIHRoYXQgaGFsZiBJIGRyZWFkPC9wPjxwPlRvbyBsYXRlIEkgY2FtZS4gQnV0IHRob3Ugc2hhbHQgaGFzdGUsIGFuZCBnbzwvcD48cD5XaXRoIGdvbGRlbiB3aXNkb20gb2YgdGh5IHNwZWVjaCwgdGhhdCBzbzwvcD48cD5Gb3IgbWUgYmUgY29uc29sYXRpb24uIFRob3Ugc2hhbHQgc2F5LDwvcD48cD4mbGRxdW87SSBjb21lIGZyb20gQmVhdHJpY8OrLiZyZHF1bzsgRG93bndhcmQgZmFyLDwvcD48cD5Gcm9tIEhlYXZlbiB0byBJIGxlYXZlbiBJIHNhbmssIGZyb20gc3RhciB0byBzdGFyLDwvcD48cD5UbyBmaW5kIHRoZWUsIGFuZCB0byBwb2ludCBoaXMgcmVzY3Vpbmcgd2F5LjwvcD48cD5GYWluIHdvdWxkIEkgdG8gbXkgcGxhY2Ugb2YgbGlnaHQgcmV0dXJuOzwvcD48cD5Mb3ZlIG1vdmVkIG1lIGZyb20gaXQsIGFuZCBnYXZlIG1lIHBvd2VyIHRvIGxlYXJuPC9wPjxwPlRoeSBzcGVlY2guIFdoZW4gbmV4dCBiZWZvcmUgbXkgTG9yZCBJIHN0YW5kPC9wPjxwPkkgdmVyeSBvZnQgc2hhbGwgcHJhaXNlIHRoZWUuJnJzcXVvOzwvcD48cCBjbGFzcz1cInNsaW5kZW50MTBlbVwiPkhlcmUgc2hlIGNlYXNlZCw8L3A+PHA+QW5kIEkgZ2F2ZSBhbnN3ZXIgdG8gdGhhdCBkZWFyIGNvbW1hbmQsPC9wPjxwPiZsc3F1bztMYWR5LCBhbG9uZSB0aHJvdWdoIHdob20gdGhlIHdob2xlIHJhY2Ugb2YgdGhvc2U8L3A+PHA+VGhlIHNtYWxsZXN0IEhlYXZlbiB0aGUgbW9vbiZyc3F1bztzIHNob3J0IG9yYml0cyBob2xkPC9wPjxwPkV4Y2VscyBpbiBpdHMgY3JlYXRpb24sIG5vdCB0aHkgbGVhc3QsPC9wPjxwPlRoeSBsaWdodGVzdCB3aXNoIGluIHRoaXMgZGFyayByZWFsbSB3ZXJlIHRvbGQ8L3A+PHA+VmFpbmx5LiBCdXQgc2hvdyBtZSB3aHkgdGhlIEhlYXZlbnMgdW5jbG9zZTwvcD48cD5UbyBsb29zZSB0aGVlIGZyb20gdGhlbSwgYW5kIHRoeXNlbGYgY29udGVudDwvcD48cD5Db3VsZHN0IHRodXMgY29udGludWUgaW4gc3VjaCBzdHJhbmdlIGRlc2NlbnQ8L3A+PHA+RnJvbSB0aGF0IG1vc3QgU3BhY2lvdXMgUGxhY2UgZm9yIHdoaWNoIHllIGJ1cm4sPC9wPjxwPkFuZCB3aGlsZSB5ZSBmdXJ0aGVyIGxlZnQsIHdvdWxkIGZhaW4gcmV0dXJuLiZyc3F1bzs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPiZsZHF1bzsgJmxzcXVvO1RoYXQgd2hpY2ggdGhvdSB3b3VsZHN0LCZyc3F1bzsgc2hlIHNhaWQsICZsc3F1bztJIGJyaWVmbHkgdGVsbC48L3A+PHA+VGhlcmUgaXMgbm8gZmVhciBub3IgYW55IGh1cnQgaW4gSGVsbCw8L3A+PHA+RXhjZXB0IHRoYXQgaXQgYmUgcG93ZXJmdWwuIEdvZCBpbiBtZTwvcD48cD5JcyBncmFjaW91cywgdGhhdCB0aGUgcGl0ZW91cyBzaWdodHMgSSBzZWU8L3A+PHA+SSBzaGFyZSBub3QsIG5vciBteXNlbGYgY2FuIHNocmluayB0byBmZWVsPC9wPjxwPlRoZSBmbGFtZSBvZiBhbGwgdGhpcyBidXJuaW5nLiBPbmUgdGhlcmUgaXM8L3A+PHA+SW4gaGVpZ2h0IGFtb25nIHRoZSBIb2xpZXN0IHBsYWNlZCwgYW5kIHNoZTwvcD48cD4tIE1lcmN5IGhlciBuYW1lJm5ic3A7Jm5kYXNoOyBhbW9uZyBHb2QmcnNxdW87cyBteXN0ZXJpZXM8L3A+PHA+RHdlbGxzIGluIHRoZSBtaWRzdCwgYW5kIGhhdGggdGhlIHBvd2VyIHRvIHNlZTwvcD48cD5IaXMganVkZ21lbnRzLCBhbmQgdG8gYnJlYWsgdGhlbS4gVGhpcyBzaGFycDwvcD48cD5JIHRlbGwgdGhlZSwgd2hlbiBzaGUgc2F3LCBzaGUgY2FsbGVkLCB0aGF0IHNvPC9wPjxwPkxlYW5lZCBMdWNpYSB0b3dhcmQgaGVyIHdoaWxlIHNoZSBzcGFrZSZuYnNwOyZuZGFzaDsgYW5kIHNhaWQsPC9wPjxwPiZsZHF1bztPbmUgdGhhdCBpcyBmYWl0aGZ1bCB0byB0aHkgbmFtZSBpcyBzcGVkLDwvcD48cD5FeGNlcHQgdGhhdCBub3cgeWUgYWlkIGhpbS4mcmRxdW87IFNoZSB0aGVyZWF0LDwvcD48cD4tIEx1Y2lhLCB0byBhbGwgbWVuJnJzcXVvO3Mgd3JvbmdzIGluaW1pY2FsIC08L3A+PHA+TGVmdCBoZXIgSGlnaCBQbGFjZSwgYW5kIGNyb3NzZWQgdG8gd2hlcmUgSSBzYXQ8L3A+PHA+SW4gc3BlZWNoIHdpdGggUmFjaGVsIChvZiB0aGUgZmlyc3Qgb2YgYWxsPC9wPjxwPkdvZCBzYXZlZCkuICZsZHF1bztPIEJlYXRyaWNlLCBQcmFpc2Ugb2YgR29kLCZyZHF1bzs8L3A+PHA+LSBTbyBzYWlkIHNoZSB0byBtZSZuYnNwOyZuZGFzaDsgJmxkcXVvO3NpdHQmcnNxdW87c3QgdGhvdSBoZXJlIHNvIHNsb3c8L3A+PHA+VG8gYWlkIGhpbSwgb25jZSBvbiBlYXJ0aCB0aGF0IGxvdmVkIHRoZWUgc288L3A+PHA+VGhhdCBhbGwgaGUgbGVmdCB0byBzZXJ2ZSB0aGVlPyBIZWFyJnJzcXVvO3N0IHRob3Ugbm90PC9wPjxwPlRoZSBhbmd1aXNoIG9mIGhpcyBwbGFpbnQ/IGFuZCBkb3N0IG5vdCBzZWUsPC9wPjxwPkJ5IHRoYXQgZGFyayBzdHJlYW0gdGhhdCBuZXZlciBzZWVrcyBhIHNlYSw8L3A+PHA+VGhlIGRlYXRoIHRoYXQgdGhyZWF0cyBoaW0/JnJkcXVvOzwvcD48cCBjbGFzcz1cInNsaW5kZW50OGVtXCI+Tm9uZSwgYXMgdGh1cyBzaGUgc2FpZCw8L3A+PHA+Tm9uZSBldmVyIHdhcyBzd2lmdCBvbiBlYXJ0aCBoaXMgZ29vZCB0byBjaGFzZSw8L3A+PHA+Tm9uZSBldmVyIG9uIGVhcnRoIHdhcyBzd2lmdCB0byBsZWF2ZSBoaXMgZHJlYWQsPC9wPjxwPkFzIGNhbWUgSSBkb3dud2FyZCBmcm9tIHRoYXQgc2FjcmVkIHBsYWNlPC9wPjxwPlRvIGZpbmQgdGhlZSBhbmQgaW52b2tlIHRoZWUsIGNvbmZpZGVudDwvcD48cD5Ob3QgdmFpbmx5IGZvciBoaXMgbmVlZCB0aGUgZ29sZCB3ZXJlIHNwZW50PC9wPjxwPk9mIHRoeSB3b3JkLXdpc2RvbS4mcnNxdW87IEhlcmUgc2hlIHR1cm5lZCBhd2F5LDwvcD48cD5IZXIgYnJpZ2h0IGV5ZXMgY2xvdWRlZCB3aXRoIHRoZWlyIHRlYXJzLCBhbmQgSSw8L3A+PHA+V2hvIHNhdyB0aGVtLCB0aGVyZWZvcmUgbWFkZSBtb3JlIGhhc3RlIHRvIHJlYWNoPC9wPjxwPlRoZSBwbGFjZSBzaGUgdG9sZCwgYW5kIGZvdW5kIHRoZWUuIENhbnN0IHRob3Ugc2F5PC9wPjxwPkkgZmFpbGVkIHRoeSByZXNjdWU/IElzIHRoZSBiZWFzdCBhbmlnaDwvcD48cD5Gcm9tIHdoaWNoIHllIHF1YWlsZWQ/IFdoZW4gc3VjaCBkZWFyIHNhaW50cyBiZXNlZWNoPC9wPjxwPi0gVGhyZWUgZnJvbSB0aGUgSGlnaGVzdCZuYnNwOyZuZGFzaDsgdGhhdCBIZWF2ZW4gdGh5IGNvdXJzZSBhbGxvdzwvcD48cD5XaHkgaGFsdCB5ZSBmZWFyZnVsPyBJbiBzdWNoIGd1YXJkcyBhcyB0aG91PC9wPjxwPlRoZSBmYWludGVzdC1oZWFydGVkIG1pZ2h0IGJlIGJvbGQuJnJkcXVvOzwvcD48cCBjbGFzcz1cInNsaW5kZW50MTRlbVwiPkFzIGZsb3dlcnMsPC9wPjxwPkNsb3NlLWZvbGRlZCB0aHJvdWdoIHRoZSBjb2xkIGFuZCBsaWdodGxlc3MgaG91cnMsPC9wPjxwPlRoZWlyIGJlbmRlZCBzdGVtcyBlcmVjdCwgYW5kIG9wZW5pbmcgZmFpcjwvcD48cD5BY2NlcHQgdGhlIHdoaXRlIGxpZ2h0IGFuZCB0aGUgd2FybWVyIGFpcjwvcD48cD5PZiBtb3JuaW5nLCBzbyBteSBmYWludGluZyBoZWFydCBhbmV3PC9wPjxwPkxpZnRlZCwgdGhhdCBoZWFyZCBoaXMgY29tZm9ydC4gU3dpZnQgSSBzcGFrZSw8L3A+PHA+JmxkcXVvO08gY291cnRlb3VzIHRob3UsIGFuZCBzaGUgY29tcGFzc2lvbmF0ZSE8L3A+PHA+VGh5IGhhc3RlIHRoYXQgc2F2ZWQgbWUsIGFuZCBoZXIgd2FybmluZyB0cnVlLDwvcD48cD5CZXlvbmQgbXkgd29ydGggZXhhbHQgbWUuIFRoaW5lIEkgbWFrZTwvcD48cD5NeSB3aWxsLiBJbiBjb25jb3JkIG9mIG9uZSBtaW5kIGZyb20gbm93LDwvcD48cD5PIE1hc3RlciBhbmQgbXkgR3VpZGUsIHdoZXJlIGxlYWRlc3QgdGhvdTwvcD48cD5JIGZvbGxvdy4mcmRxdW87PC9wPjxwIGNsYXNzPVwic2xpbmRlbnQyZW1cIj5BbmQgd2UsIHdpdGggbm8gbW9yZSB3b3JkcyZyc3F1bzsgZGVsYXksPC9wPjxwPldlbnQgZm9yd2FyZCBvbiB0aGF0IGhhcmQgYW5kIGRyZWFkZnVsIHdheS48L3A+PC9kaXY+JyxcblxuXHQnPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5DYW50byBJSUk8L3A+PC9wPjxwPjxkaXYgY2xhc3M9XCJzdGFuemFcIj5USEUgZ2F0ZXdheSB0byB0aGUgY2l0eSBvZiBEb29tLiBUaHJvdWdoIG1lPC9wPjxwPlRoZSBlbnRyYW5jZSB0byB0aGUgRXZlcmxhc3RpbmcgUGFpbi48L3A+PHA+VGhlIEdhdGV3YXkgb2YgdGhlIExvc3QuIFRoZSBFdGVybmFsIFRocmVlPC9wPjxwPkp1c3RpY2UgaW1wZWxsZWQgdG8gYnVpbGQgbWUuIEhlcmUgeWUgc2VlPC9wPjxwPldpc2RvbSBTdXByZW1lIGF0IHdvcmssIGFuZCBQcmltYWwgUG93ZXIsPC9wPjxwPkFuZCBMb3ZlIFN1cGVybmFsIGluIHRoZWlyIGRhd25sZXNzIGRheS48L3A+PHA+RXJlIGZyb20gdGhlaXIgdGhvdWdodCBjcmVhdGlvbiByb3NlIGluIGZsb3dlcjwvcD48cD5FdGVybmFsIGZpcnN0IHdlcmUgYWxsIHRoaW5ncyBmaXhlZCBhcyB0aGV5LjwvcD48cD5PZiBJbmNyZWF0ZSBQb3dlciBpbmZpbml0ZSBmb3JtZWQgYW0gSTwvcD48cD5UaGF0IGRlYXRobGVzcyBhcyB0aGVtc2VsdmVzIEkgZG8gbm90IGRpZS48L3A+PHA+SnVzdGljZSBkaXZpbmUgaGFzIHdlaWdoZWQ6IHRoZSBkb29tIGlzIGNsZWFyLjwvcD48cD5BbGwgaG9wZSByZW5vdW5jZSwgeWUgbG9zdCwgd2hvIGVudGVyIGhlcmUuPC9wPjxwPlRoaXMgc2Nyb2xsIGluIGdsb29tIGFib3ZlIHRoZSBnYXRlIEkgcmVhZCw8L3A+PHA+QW5kIGZvdW5kIGl0IGZlYXJmdWwuICZsZHF1bztNYXN0ZXIsIGhhcmQsJnJkcXVvOyBJIHNhaWQsPC9wPjxwPiZsZHF1bztUaGlzIHNheWluZyB0byBtZS5cIiBBbmQgaGUsIGFzIG9uZSB0aGF0IGxvbmc8L3A+PHA+V2FzIGN1c3RvbWVkLCBhbnN3ZXJlZCwgJmxkcXVvO05vIGRpc3RydXN0IG11c3Qgd3Jvbmc8L3A+PHA+SXRzIE1ha2VyLCBub3IgdGh5IGNvd2FyZGVyIG1vb2QgcmVzdW1lPC9wPjxwPklmIGhlcmUgeWUgZW50ZXIuIFRoaXMgdGhlIHBsYWNlIG9mIGRvb208L3A+PHA+SSB0b2xkIHRoZWUsIHdoZXJlIHRoZSBsb3N0IGluIGRhcmtuZXNzIGR3ZWxsLjwvcD48cD5IZXJlLCBieSB0aGVtc2VsdmVzIGRpdm9yY2VkIGZyb20gbGlnaHQsIHRoZXkgZmVsbCw8L3A+PHA+QW5kIGFyZSBhcyB5ZSBzaGFsbCBzZWUgdGhlbS4mcmRxdW87IEhlcmUgaGUgbGVudDwvcD48cD5BIGhhbmQgdG8gZHJhdyBtZSB0aHJvdWdoIHRoZSBnYXRlLCBhbmQgYmVudDwvcD48cD5BIGdsYW5jZSB1cG9uIG15IGZlYXIgc28gY29uZmlkZW50PC9wPjxwPlRoYXQgSSwgdG9vIG5lYXJseSB0byBteSBmb3JtZXIgZHJlYWQ8L3A+PHA+UmV0dXJuZWQsIHRocm91Z2ggYWxsIG15IGhlYXJ0IHdhcyBjb21mb3J0ZWQsPC9wPjxwPkFuZCBkb3dud2FyZCB0byB0aGUgc2VjcmV0IHRoaW5ncyB3ZSB3ZW50LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RG93bndhcmQgdG8gbmlnaHQsIGJ1dCBub3Qgb2YgbW9vbiBhbmQgY2xvdWQsPC9wPjxwPk5vdCBuaWdodCB3aXRoIGFsbCBpdHMgc3RhcnMsIGFzIG5pZ2h0IHdlIGtub3csPC9wPjxwPkJ1dCBidXJkZW5lZCB3aXRoIGFuIG9jZWFuLXdlaWdodCBvZiB3b2U8L3A+PHA+VGhlIGRhcmtuZXNzIGNsb3NlZCB1cy48L3A+PHAgY2xhc3M9XCJzbGluZGVudDZlbVwiPlNpZ2hzLCBhbmQgd2FpbGluZ3MgbG91ZCw8L3A+PHA+T3V0Y3JpZXMgcGVycGV0dWFsIG9mIHJlY3J1aXRlZCBwYWluLDwvcD48cD5Tb3VuZHMgb2Ygc3RyYW5nZSB0b25ndWVzLCBhbmQgYW5nZXJzIHRoYXQgcmVtYWluPC9wPjxwPlZlbmdlbGVzcyBmb3IgZXZlciwgdGhlIHRoaWNrIGFuZCBjbGFtb3JvdXMgY3Jvd2Q8L3A+PHA+T2YgZGlzY29yZHMgcHJlc3NlZCwgdGhhdCBuZWVkcyBJIHdlcHQgdG8gaGVhciw8L3A+PHA+Rmlyc3QgaGVhcmluZy4gVGhlcmUsIHdpdGggcmVhY2ggb2YgaGFuZHMgYW5lYXIsPC9wPjxwPkFuZCB2b2ljZXMgcGFzc2lvbi1ob2Fyc2UsIG9yIHNocmlsbGVkIHdpdGggZnJpZ2h0LDwvcD48cD5UaGUgdHVtdWx0IG9mIHRoZSBldmVybGFzdGluZyBuaWdodCw8L3A+PHA+QXMgc2FuZCB0aGF0IGRhbmNlcyBpbiBjb250aW51YWwgd2luZCw8L3A+PHA+VHVybnMgb24gaXRzZWxmIGZvciBldmVyLjwvcD48cCBjbGFzcz1cInNsaW5kZW50OGVtXCI+QW5kIEksIG15IGhlYWQ8L3A+PHA+QmVnaXJ0IHdpdGggbW92ZW1lbnRzLCBhbmQgbXkgZWFycyBiZWRpbm5lZDwvcD48cD5XaXRoIG91dGNyaWVzIHJvdW5kIG1lLCB0byBteSBsZWFkZXIgc2FpZCw8L3A+PHA+JmxkcXVvO01hc3Rlciwgd2hhdCBoZWFyIEk/IFdobyBzbyBvdmVyYm9ybmU8L3A+PHA+V2l0aCB3b2VzIGFyZSB0aGVzZT8mcmRxdW87PC9wPjxwIGNsYXNzPVwic2xpbmRlbnQ2ZW1cIj5IZSBhbnN3ZXJlZCwgJmxkcXVvO1RoZXNlIGJlIHRoZXk8L3A+PHA+VGhhdCBwcmFpc2VsZXNzIGxpdmVkIGFuZCBibGFtZWxlc3MuIE5vdyB0aGUgc2Nvcm48L3A+PHA+T2YgSGVpZ2h0IGFuZCBEZXB0aCBhbGlrZSwgYWJvcnRpb25zIGRyZWFyOzwvcD48cD5DYXN0IHdpdGggdGhvc2UgYWJqZWN0IGFuZ2VscyB3aG9zZSBkZWxheTwvcD48cD5UbyBqb2luIHJlYmVsbGlvbiwgb3IgdGhlaXIgTG9yZCBkZWZlbmQsPC9wPjxwPldhaXRpbmcgdGhlaXIgcHJvdmVkIGFkdmFudGFnZSwgZmx1bmcgdGhlbSBoZXJlLiAtPC9wPjxwPkNoYXNlZCBmb3J0aCBmcm9tIEhlYXZlbiwgbGVzdCBlbHNlIGl0cyBiZWF1dGllcyBlbmQ8L3A+PHA+VGhlIHB1cmUgcGVyZmVjdGlvbiBvZiB0aGVpciBzdGFpbmxlc3MgY2xhaW0sPC9wPjxwPk91dC1oZXJkZWQgZnJvbSB0aGUgc2hpbmluZyBnYXRlIHRoZXkgY2FtZSw8L3A+PHA+V2hlcmUgdGhlIGRlZXAgaGVsbHMgcmVmdXNlZCB0aGVtLCBsZXN0IHRoZSBsb3N0PC9wPjxwPkJvYXN0IHNvbWV0aGluZyBiYXNlciB0aGFuIHRoZW1zZWx2ZXMuJnJkcXVvOzwvcD48cCBjbGFzcz1cInNsaW5kZW50MTRlbVwiPkFuZCBJLDwvcD48cD4mbGRxdW87TWFzdGVyLCB3aGF0IGdyaWV2YW5jZSBoYXRoIHRoZWlyIGZhaWx1cmUgY29zdCw8L3A+PHA+VGhhdCB0aHJvdWdoIHRoZSBsYW1lbnRhYmxlIGRhcmsgdGhleSBjcnk/JnJkcXVvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+SGUgYW5zd2VyZWQsICZsZHF1bztCcmllZmx5IGF0IGEgdGhpbmcgbm90IHdvcnRoPC9wPjxwPldlIGdsYW5jZSwgYW5kIHBhc3MgZm9yZ2V0ZnVsLiBIb3BlIGluIGRlYXRoPC9wPjxwPlRoZXkgaGF2ZSBub3QuIE1lbW9yeSBvZiB0aGVtIG9uIHRoZSBlYXJ0aDwvcD48cD5XaGVyZSBvbmNlIHRoZXkgbGl2ZWQgcmVtYWlucyBub3QuIE5vciB0aGUgYnJlYXRoPC9wPjxwPk9mIEp1c3RpY2Ugc2hhbGwgY29uZGVtbiwgbm9yIE1lcmN5IHBsZWFkLDwvcD48cD5CdXQgYWxsIGFsaWtlIGRpc2RhaW4gdGhlbS4gVGhhdCB0aGV5IGtub3c8L3A+PHA+VGhlbXNlbHZlcyBzbyBtZWFuIGJlbmVhdGggYXVnaHQgZWxzZSBjb25zdHJhaW5zPC9wPjxwPlRoZSBlbnZpb3VzIG91dGNyaWVzIHRoYXQgdG9vIGxvbmcgeWUgaGVlZC48L3A+PHA+TW92ZSBwYXN0LCBidXQgc3BlYWsgbm90LiZyZHF1bzs8L3A+PHAgY2xhc3M9XCJzbGluZGVudDhlbVwiPlRoZW4gSSBsb29rZWQsIGFuZCBsbyw8L3A+PHA+V2VyZSBzb3VscyBpbiBjZWFzZWxlc3MgYW5kIHVubnVtYmVyZWQgdHJhaW5zPC9wPjxwPlRoYXQgcGFzdCBtZSB3aGlybGVkIHVuZW5kaW5nLCB2YWlubHkgbGVkPC9wPjxwPk5vd2hpdGhlciwgaW4gdXNlbGVzcyBhbmQgdW5wYXVzaW5nIGhhc3RlLjwvcD48cD5BIGZsdXR0ZXJpbmcgZW5zaWduIGFsbCB0aGVpciBndWlkZSwgdGhleSBjaGFzZWQ8L3A+PHA+VGhlbXNlbHZlcyBmb3IgZXZlci4gSSBoYWQgbm90IHRob3VnaHQgdGhlIGRlYWQsPC9wPjxwPlRoZSB3aG9sZSB3b3JsZCZyc3F1bztzIGRlYWQsIHNvIG1hbnkgYXMgdGhlc2UuIEkgc2F3PC9wPjxwPlRoZSBzaGFkb3cgb2YgaGltIGVsZWN0IHRvIFBldGVyJnJzcXVvO3Mgc2VhdDwvcD48cD5XaG8gbWFkZSB0aGUgZ3JlYXQgcmVmdXNhbCwgYW5kIHRoZSBsYXcsPC9wPjxwPlRoZSB1bnN3ZXJ2aW5nIGxhdyB0aGF0IGxlZnQgdGhlbSB0aGlzIHJldHJlYXQ8L3A+PHA+VG8gc2VhbCB0aGUgYWJvcnRpb24gb2YgdGhlaXIgbGl2ZXMsIGJlY2FtZTwvcD48cD5JbGx1bWluZWQgdG8gbWUsIGFuZCB0aGVtc2VsdmVzIEkga25ldyw8L3A+PHA+VG8gR29kIGFuZCBhbGwgaGlzIGZvZXMgdGhlIGZ1dGlsZSBjcmV3PC9wPjxwPkhvdyBoYXRlZnVsIGluIHRoZWlyIGV2ZXJsYXN0aW5nIHNoYW1lLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+SSBzYXcgdGhlc2UgdmljdGltcyBvZiBjb250aW51ZWQgZGVhdGg8L3A+PHA+LSBGb3IgbGl2ZWQgdGhleSBuZXZlciZuYnNwOyZuZGFzaDsgd2VyZSBuYWtlZCBhbGwsIGFuZCBsb3VkPC9wPjxwPkFyb3VuZCB0aGVtIGNsb3NlZCBhIG5ldmVyLWNlYXNpbmcgY2xvdWQ8L3A+PHA+T2YgaG9ybmV0cyBhbmQgZ3JlYXQgd2FzcHMsIHRoYXQgYnV6emVkIGFuZCBjbHVuZyw8L3A+PHA+LSBXZWFrIHBhaW4gZm9yIHdlYWtsaW5ncyBtZWV0LCZuYnNwOyZuZGFzaDsgYW5kIHdoZXJlIHRoZXkgc3R1bmcsPC9wPjxwPkJsb29kIGZyb20gdGhlaXIgZmFjZXMgc3RyZWFtZWQsIHdpdGggc29iYmluZyBicmVhdGgsPC9wPjxwPkFuZCBhbGwgdGhlIGdyb3VuZCBiZW5lYXRoIHdpdGggdGVhcnMgYW5kIGJsb29kPC9wPjxwPldhcyBkcmVuY2hlZCwgYW5kIGNyYXdsaW5nIGluIHRoYXQgbG9hdGhzb21lIG11ZDwvcD48cD5UaGVyZSB3ZXJlIGdyZWF0IHdvcm1zIHRoYXQgZHJhbmsgaXQuPC9wPjxwIGNsYXNzPVwic2xpbmRlbnQxMGVtXCI+R2xhZGx5IHRoZW5jZTwvcD48cD5JIGdhemVkIGZhciBmb3J3YXJkLiBEYXJrIGFuZCB3aWRlIHRoZSBmbG9vZDwvcD48cD5UaGF0IGZsb3dlZCBiZWZvcmUgdXMuIE9uIHRoZSBuZWFyZXIgc2hvcmU8L3A+PHA+V2VyZSBwZW9wbGUgd2FpdGluZy4gJmxkcXVvO01hc3Rlciwgc2hvdyBtZSB3aGVuY2U8L3A+PHA+VGhlc2UgY2FtZSwgYW5kIHdobyB0aGV5IGJlLCBhbmQgcGFzc2luZyBoZW5jZTwvcD48cD5XaGVyZSBnbyB0aGV5PyBXaGVyZWZvcmUgd2FpdCB0aGV5IHRoZXJlIGNvbnRlbnQsPC9wPjxwPi0gVGhlIGZhaW50IGxpZ2h0IHNob3dzIGl0LCZuYnNwOyZuZGFzaDsgZm9yIHRoZWlyIHRyYW5zaXQgbyZyc3F1bztlcjwvcD48cD5UaGUgdW5icmlkZ2VkIGFieXNzPyZyZHF1bzs8L3A+PHAgY2xhc3M9XCJzbGluZGVudDZlbVwiPkhlIGFuc3dlcmVkLCAmbGRxdW87V2hlbiB3ZSBzdGFuZDwvcD48cD5Ub2dldGhlciwgd2FpdGluZyBvbiB0aGUgam95bGVzcyBzdHJhbmQsPC9wPjxwPkluIGFsbCBpdCBzaGFsbCBiZSB0b2xkIHRoZWUuJnJkcXVvOyBJZiBoZSBtZWFudDwvcD48cD5SZXByb29mIEkga25vdyBub3QsIGJ1dCB3aXRoIHNoYW1lIEkgYmVudDwvcD48cD5NeSBkb3dud2FyZCBleWVzLCBhbmQgbm8gbW9yZSBzcGFrZSB1bnRpbDwvcD48cD5UaGUgYmFuayB3ZSByZWFjaGVkLCBhbmQgb24gdGhlIHN0cmVhbSBiZWhlbGQ8L3A+PHA+QSBiYXJrIHBseSB0b3dhcmQgdXMuPC9wPjxwIGNsYXNzPVwic2xpbmRlbnQ4ZW1cIj5PZiBleGNlZWRpbmcgZWxkLDwvcD48cD5BbmQgaG9hcnkgc2hvd2VkIHRoZSBzdGVlcnNtYW4sIHNjcmVhbWluZyBzaHJpbGwsPC9wPjxwPldpdGggaG9ycmlkIGdsZWUgdGhlIHdoaWxlIGhlIG5lYXJlZCB1cywgJmxkcXVvO1dvZTwvcD48cD5UbyB5ZSwgZGVwcmF2ZWQhJm5ic3A7Jm5kYXNoOyBJcyBoZXJlIG5vIEhlYXZlbiwgYnV0IGlsbDwvcD48cD5UaGUgcGxhY2Ugd2hlcmUgSSBzaGFsbCBoZXJkIHllLiBJY2UgYW5kIGZpcmU8L3A+PHA+QW5kIGRhcmtuZXNzIGFyZSB0aGUgd2FnZXMgb2YgdGhlaXIgaGlyZTwvcD48cD5XaG8gc2VydmUgdW5jZWFzaW5nIGhlcmUmbmJzcDsmbmRhc2g7IEJ1dCB0aG91IHRoYXQgdGhlcmU8L3A+PHA+RG9zdCB3YWl0IHRob3VnaCBsaXZlLCBkZXBhcnQgeWUuIFllYSwgZm9yYmVhciE8L3A+PHA+QSBkaWZmZXJlbnQgcGFzc2FnZSBhbmQgYSBsaWdodGVyIGZhcmU8L3A+PHA+SXMgZGVzdGluZWQgdGhpbmUuJnJkcXVvOzwvcD48cCBjbGFzcz1cInNsaW5kZW50NmVtXCI+QnV0IGhlcmUgbXkgZ3VpZGUgcmVwbGllZCw8L3A+PHA+JmxkcXVvO05heSwgQ2hhcm9uLCBjZWFzZTsgb3IgdG8gdGh5IGdyaWVmIHllIGNoaWRlLjwvcD48cD5JdCBUaGVyZSBpcyB3aWxsZWQsIHdoZXJlIHRoYXQgaXMgd2lsbGVkIHNoYWxsIGJlLDwvcD48cD5UaGF0IHllIHNoYWxsIHBhc3MgaGltIHRvIHRoZSBmdXJ0aGVyIHNpZGUsPC9wPjxwPk5vciBxdWVzdGlvbiBtb3JlLiZyZHF1bzs8L3A+PHAgY2xhc3M9XCJzbGluZGVudDZlbVwiPlRoZSBmbGVlY3kgY2hlZWtzIHRoZXJlYXQsPC9wPjxwPkJsb3duIHdpdGggZmllcmNlIHNwZWVjaCBiZWZvcmUsIHdlcmUgZHJhd24gYW5kIGZsYXQsPC9wPjxwPkFuZCBoaXMgZmxhbWUtY2lyY2xlZCBleWVzIHN1YmR1ZWQsIHRvIGhlYXI8L3A+PHA+VGhhdCBtYW5kYXRlIGdpdmVuLiBCdXQgdGhvc2Ugb2Ygd2hvbSBoZSBzcGFrZTwvcD48cD5JbiBiaXR0ZXIgZ2xlZSwgd2l0aCBuYWtlZCBsaW1icyBhc2hha2UsPC9wPjxwPkFuZCBjaGF0dGVyaW5nIHRlZXRoIHJlY2VpdmVkIGl0LiBTZWVtZWQgdGhhdCB0aGVuPC9wPjxwPlRoZXkgZmlyc3Qgd2VyZSBjb25zY2lvdXMgd2hlcmUgdGhleSBjYW1lLCBhbmQgZmVhcjwvcD48cD5BYmplY3QgYW5kIGZyaWdodGZ1bCBzaG9vayB0aGVtOyBjdXJzZXMgYnVyc3Q8L3A+PHA+SW4gY2xhbW9yb3VzIGRpc2NvcmRzIGZvcnRoOyB0aGUgcmFjZSBvZiBtZW4sPC9wPjxwPlRoZWlyIHBhcmVudHMsIGFuZCB0aGVpciBHb2QsIHRoZSBwbGFjZSwgdGhlIHRpbWUsPC9wPjxwPk9mIHRoZWlyIGNvbmNlcHRpb25zIGFuZCB0aGVpciBiaXJ0aHMsIGFjY3Vyc2VkPC9wPjxwPkFsaWtlIHRoZXkgY2FsbGVkLCBibGFzcGhlbWluZyBIZWF2ZW4uIEJ1dCB5ZXQ8L3A+PHA+U2xvdyBzdGVwcyB0b3dhcmQgdGhlIHdhaXRpbmcgYmFyayB0aGV5IHNldCw8L3A+PHA+V2l0aCB0ZXJyaWJsZSB3YWlsaW5nIHdoaWxlIHRoZXkgbW92ZWQuIEFuZCBzbzwvcD48cD5UaGV5IGNhbWUgcmVsdWN0YW50IHRvIHRoZSBzaG9yZSBvZiB3b2U8L3A+PHA+VGhhdCB3YWl0cyBmb3IgYWxsIHdobyBmZWFyIG5vdCBHb2QsIGFuZCBub3Q8L3A+PHA+VGhlbSBvbmx5LjwvcD48cCBjbGFzcz1cInNsaW5kZW50NGVtXCI+VGhlbiB0aGUgZGVtb24gQ2hhcm9uIHJvc2U8L3A+PHA+VG8gaGVyZCB0aGVtIGluLCB3aXRoIGV5ZXMgdGhhdCBmdXJuYWNlLWhvdDwvcD48cD5HbG93ZWQgYXQgdGhlIHRhc2ssIGFuZCBsaWZ0ZWQgb2FyIHRvIHNtaXRlPC9wPjxwPldobyBsaW5nZXJlZC48L3A+PHAgY2xhc3M9XCJzbGluZGVudDRlbVwiPkFzIHRoZSBsZWF2ZXMsIHdoZW4gYXV0dW1uIHNob3dzLDwvcD48cD5PbmUgYWZ0ZXIgb25lIGRlc2NlbmRpbmcsIGxlYXZlIHRoZSBib3VnaCw8L3A+PHA+T3IgZG92ZXMgY29tZSBkb3dud2FyZCB0byB0aGUgY2FsbCwgc28gbm93PC9wPjxwPlRoZSBldmlsIHNlZWQgb2YgQWRhbSB0byBlbmRsZXNzIG5pZ2h0LDwvcD48cD5BcyBDaGFyb24gc2lnbmFsbGVkLCBmcm9tIHRoZSBzaG9yZSZyc3F1bztzIGJsZWFrIGhlaWdodCw8L3A+PHA+Q2FzdCB0aGVtc2VsdmVzIGRvd253YXJkIHRvIHRoZSBiYXJrLiBUaGUgYnJvd248L3A+PHA+QW5kIGJpdHRlciBmbG9vZCByZWNlaXZlZCB0aGVtLCBhbmQgd2hpbGUgdGhleSBwYXNzZWQ8L3A+PHA+V2VyZSBvdGhlcnMgZ2F0aGVyaW5nLCBwYXRpZW50IGFzIHRoZSBsYXN0LDwvcD48cD5Ob3QgY29uc2Npb3VzIG9mIHRoZWlyIG5lYXJpbmcgZG9vbS48L3A+PHAgY2xhc3M9XCJzbGluZGVudDE0ZW1cIj4mbGRxdW87TXkgc29uLCZyZHF1bzs8L3A+PHA+LSBSZXBsaWVkIG15IGd1aWRlIHRoZSB1bnNwb2tlbiB0aG91Z2h0Jm5ic3A7Jm5kYXNoOyAmbGRxdW87aXMgbm9uZTwvcD48cD5CZW5lYXRoIEdvZCZyc3F1bztzIHdyYXRoIHdobyBkaWVzIGluIGZpZWxkIG9yIHRvd24sPC9wPjxwPk9yIGVhcnRoJnJzcXVvO3Mgd2lkZSBzcGFjZSwgb3Igd2hvbSB0aGUgd2F0ZXJzIGRyb3duLDwvcD48cD5CdXQgaGVyZSBoZSBjb21ldGggYXQgbGFzdCwgYW5kIHRoYXQgc28gc3B1cnJlZDwvcD48cD5CeSBKdXN0aWNlLCB0aGF0IGhpcyBmZWFyLCBhcyB0aG9zZSB5ZSBoZWFyZCw8L3A+PHA+SW1wZWxzIGhpbSBmb3J3YXJkIGxpa2UgZGVzaXJlLiBJcyBub3Q8L3A+PHA+T25lIHNwaXJpdCBvZiBhbGwgdG8gcmVhY2ggdGhlIGZhdGFsIHNwb3Q8L3A+PHA+VGhhdCBHb2QmcnNxdW87cyBsb3ZlIGhvbGRldGgsIGFuZCBoZW5jZSwgaWYgQ2hhcjwvcD48cD5jaGlkZSw8L3A+PHA+WWUgd2VsbCBtYXkgdGFrZSBpdC4mbmJzcDsmbmRhc2g7IFJhaXNlIHRoeSBoZWFydCwgZm9yIG5vdyw8L3A+PHA+Q29uc3RyYWluZWQgb2YgSGVhdmVuLCBoZSBtdXN0IHRoeSBjb3Vyc2UgYWxsb3cuXCI8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPllldCBob3cgSSBwYXNzZWQgSSBrbm93IG5vdC4gRm9yIHRoZSBncm91bmQ8L3A+PHA+VHJlbWJsZWQgdGhhdCBoZWFyZCBoaW0sIGFuZCBhIGZlYXJmdWwgc291bmQ8L3A+PHA+T2YgaXNzdWluZyB3aW5kIGFyb3NlLCBhbmQgYmxvb2QtcmVkIGxpZ2h0PC9wPjxwPkJyb2tlIGZyb20gYmVuZWF0aCBvdXIgZmVldCwgYW5kIHNlbnNlIGFuZCBzaWdodDwvcD48cD5MZWZ0IG1lLiBUaGUgbWVtb3J5IHdpdGggY29sZCBzd2VhdCBvbmNlIG1vcmU8L3A+PHA+UmVtaW5kcyBtZSBvZiB0aGUgc3VkZGVuLWNyaW1zb25lZCBuaWdodCw8L3A+PHA+QXMgc2FuayBJIHNlbnNlbGVzcyBieSB0aGUgZHJlYWRmdWwgc2hvcmUuPC9wPjwvZGl2PiddO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHdyaWdodDtcbiIsIjsoZnVuY3Rpb24gKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0LyoqXG5cdCAqIEBwcmVzZXJ2ZSBGYXN0Q2xpY2s6IHBvbHlmaWxsIHRvIHJlbW92ZSBjbGljayBkZWxheXMgb24gYnJvd3NlcnMgd2l0aCB0b3VjaCBVSXMuXG5cdCAqXG5cdCAqIEBjb2RpbmdzdGFuZGFyZCBmdGxhYnMtanN2MlxuXHQgKiBAY29weXJpZ2h0IFRoZSBGaW5hbmNpYWwgVGltZXMgTGltaXRlZCBbQWxsIFJpZ2h0cyBSZXNlcnZlZF1cblx0ICogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKHNlZSBMSUNFTlNFLnR4dClcblx0ICovXG5cblx0Lypqc2xpbnQgYnJvd3Nlcjp0cnVlLCBub2RlOnRydWUqL1xuXHQvKmdsb2JhbCBkZWZpbmUsIEV2ZW50LCBOb2RlKi9cblxuXG5cdC8qKlxuXHQgKiBJbnN0YW50aWF0ZSBmYXN0LWNsaWNraW5nIGxpc3RlbmVycyBvbiB0aGUgc3BlY2lmaWVkIGxheWVyLlxuXHQgKlxuXHQgKiBAY29uc3RydWN0b3Jcblx0ICogQHBhcmFtIHtFbGVtZW50fSBsYXllciBUaGUgbGF5ZXIgdG8gbGlzdGVuIG9uXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gVGhlIG9wdGlvbnMgdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHRzXG5cdCAqL1xuXHRmdW5jdGlvbiBGYXN0Q2xpY2sobGF5ZXIsIG9wdGlvbnMpIHtcblx0XHR2YXIgb2xkT25DbGljaztcblxuXHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG5cdFx0LyoqXG5cdFx0ICogV2hldGhlciBhIGNsaWNrIGlzIGN1cnJlbnRseSBiZWluZyB0cmFja2VkLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgYm9vbGVhblxuXHRcdCAqL1xuXHRcdHRoaXMudHJhY2tpbmdDbGljayA9IGZhbHNlO1xuXG5cblx0XHQvKipcblx0XHQgKiBUaW1lc3RhbXAgZm9yIHdoZW4gY2xpY2sgdHJhY2tpbmcgc3RhcnRlZC5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudHJhY2tpbmdDbGlja1N0YXJ0ID0gMDtcblxuXG5cdFx0LyoqXG5cdFx0ICogVGhlIGVsZW1lbnQgYmVpbmcgdHJhY2tlZCBmb3IgYSBjbGljay5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIEV2ZW50VGFyZ2V0XG5cdFx0ICovXG5cdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblxuXG5cdFx0LyoqXG5cdFx0ICogWC1jb29yZGluYXRlIG9mIHRvdWNoIHN0YXJ0IGV2ZW50LlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50b3VjaFN0YXJ0WCA9IDA7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFktY29vcmRpbmF0ZSBvZiB0b3VjaCBzdGFydCBldmVudC5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudG91Y2hTdGFydFkgPSAwO1xuXG5cblx0XHQvKipcblx0XHQgKiBJRCBvZiB0aGUgbGFzdCB0b3VjaCwgcmV0cmlldmVkIGZyb20gVG91Y2guaWRlbnRpZmllci5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMubGFzdFRvdWNoSWRlbnRpZmllciA9IDA7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFRvdWNobW92ZSBib3VuZGFyeSwgYmV5b25kIHdoaWNoIGEgY2xpY2sgd2lsbCBiZSBjYW5jZWxsZWQuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRvdWNoQm91bmRhcnkgPSBvcHRpb25zLnRvdWNoQm91bmRhcnkgfHwgMTA7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBGYXN0Q2xpY2sgbGF5ZXIuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBFbGVtZW50XG5cdFx0ICovXG5cdFx0dGhpcy5sYXllciA9IGxheWVyO1xuXG5cdFx0LyoqXG5cdFx0ICogVGhlIG1pbmltdW0gdGltZSBiZXR3ZWVuIHRhcCh0b3VjaHN0YXJ0IGFuZCB0b3VjaGVuZCkgZXZlbnRzXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRhcERlbGF5ID0gb3B0aW9ucy50YXBEZWxheSB8fCAyMDA7XG5cblx0XHQvKipcblx0XHQgKiBUaGUgbWF4aW11bSB0aW1lIGZvciBhIHRhcFxuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50YXBUaW1lb3V0ID0gb3B0aW9ucy50YXBUaW1lb3V0IHx8IDcwMDtcblxuXHRcdGlmIChGYXN0Q2xpY2subm90TmVlZGVkKGxheWVyKSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFNvbWUgb2xkIHZlcnNpb25zIG9mIEFuZHJvaWQgZG9uJ3QgaGF2ZSBGdW5jdGlvbi5wcm90b3R5cGUuYmluZFxuXHRcdGZ1bmN0aW9uIGJpbmQobWV0aG9kLCBjb250ZXh0KSB7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7IHJldHVybiBtZXRob2QuYXBwbHkoY29udGV4dCwgYXJndW1lbnRzKTsgfTtcblx0XHR9XG5cblxuXHRcdHZhciBtZXRob2RzID0gWydvbk1vdXNlJywgJ29uQ2xpY2snLCAnb25Ub3VjaFN0YXJ0JywgJ29uVG91Y2hNb3ZlJywgJ29uVG91Y2hFbmQnLCAnb25Ub3VjaENhbmNlbCddO1xuXHRcdHZhciBjb250ZXh0ID0gdGhpcztcblx0XHRmb3IgKHZhciBpID0gMCwgbCA9IG1ldGhvZHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG5cdFx0XHRjb250ZXh0W21ldGhvZHNbaV1dID0gYmluZChjb250ZXh0W21ldGhvZHNbaV1dLCBjb250ZXh0KTtcblx0XHR9XG5cblx0XHQvLyBTZXQgdXAgZXZlbnQgaGFuZGxlcnMgYXMgcmVxdWlyZWRcblx0XHRpZiAoZGV2aWNlSXNBbmRyb2lkKSB7XG5cdFx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCB0aGlzLm9uTW91c2UsIHRydWUpO1xuXHRcdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLm9uTW91c2UsIHRydWUpO1xuXHRcdH1cblxuXHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5vbkNsaWNrLCB0cnVlKTtcblx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5vblRvdWNoU3RhcnQsIGZhbHNlKTtcblx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLm9uVG91Y2hNb3ZlLCBmYWxzZSk7XG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLm9uVG91Y2hFbmQsIGZhbHNlKTtcblx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRoaXMub25Ub3VjaENhbmNlbCwgZmFsc2UpO1xuXG5cdFx0Ly8gSGFjayBpcyByZXF1aXJlZCBmb3IgYnJvd3NlcnMgdGhhdCBkb24ndCBzdXBwb3J0IEV2ZW50I3N0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiAoZS5nLiBBbmRyb2lkIDIpXG5cdFx0Ly8gd2hpY2ggaXMgaG93IEZhc3RDbGljayBub3JtYWxseSBzdG9wcyBjbGljayBldmVudHMgYnViYmxpbmcgdG8gY2FsbGJhY2tzIHJlZ2lzdGVyZWQgb24gdGhlIEZhc3RDbGlja1xuXHRcdC8vIGxheWVyIHdoZW4gdGhleSBhcmUgY2FuY2VsbGVkLlxuXHRcdGlmICghRXZlbnQucHJvdG90eXBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbikge1xuXHRcdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGNhbGxiYWNrLCBjYXB0dXJlKSB7XG5cdFx0XHRcdHZhciBybXYgPSBOb2RlLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyO1xuXHRcdFx0XHRpZiAodHlwZSA9PT0gJ2NsaWNrJykge1xuXHRcdFx0XHRcdHJtdi5jYWxsKGxheWVyLCB0eXBlLCBjYWxsYmFjay5oaWphY2tlZCB8fCBjYWxsYmFjaywgY2FwdHVyZSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cm12LmNhbGwobGF5ZXIsIHR5cGUsIGNhbGxiYWNrLCBjYXB0dXJlKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGNhbGxiYWNrLCBjYXB0dXJlKSB7XG5cdFx0XHRcdHZhciBhZHYgPSBOb2RlLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyO1xuXHRcdFx0XHRpZiAodHlwZSA9PT0gJ2NsaWNrJykge1xuXHRcdFx0XHRcdGFkdi5jYWxsKGxheWVyLCB0eXBlLCBjYWxsYmFjay5oaWphY2tlZCB8fCAoY2FsbGJhY2suaGlqYWNrZWQgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHRcdFx0aWYgKCFldmVudC5wcm9wYWdhdGlvblN0b3BwZWQpIHtcblx0XHRcdFx0XHRcdFx0Y2FsbGJhY2soZXZlbnQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pLCBjYXB0dXJlKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRhZHYuY2FsbChsYXllciwgdHlwZSwgY2FsbGJhY2ssIGNhcHR1cmUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdC8vIElmIGEgaGFuZGxlciBpcyBhbHJlYWR5IGRlY2xhcmVkIGluIHRoZSBlbGVtZW50J3Mgb25jbGljayBhdHRyaWJ1dGUsIGl0IHdpbGwgYmUgZmlyZWQgYmVmb3JlXG5cdFx0Ly8gRmFzdENsaWNrJ3Mgb25DbGljayBoYW5kbGVyLiBGaXggdGhpcyBieSBwdWxsaW5nIG91dCB0aGUgdXNlci1kZWZpbmVkIGhhbmRsZXIgZnVuY3Rpb24gYW5kXG5cdFx0Ly8gYWRkaW5nIGl0IGFzIGxpc3RlbmVyLlxuXHRcdGlmICh0eXBlb2YgbGF5ZXIub25jbGljayA9PT0gJ2Z1bmN0aW9uJykge1xuXG5cdFx0XHQvLyBBbmRyb2lkIGJyb3dzZXIgb24gYXQgbGVhc3QgMy4yIHJlcXVpcmVzIGEgbmV3IHJlZmVyZW5jZSB0byB0aGUgZnVuY3Rpb24gaW4gbGF5ZXIub25jbGlja1xuXHRcdFx0Ly8gLSB0aGUgb2xkIG9uZSB3b24ndCB3b3JrIGlmIHBhc3NlZCB0byBhZGRFdmVudExpc3RlbmVyIGRpcmVjdGx5LlxuXHRcdFx0b2xkT25DbGljayA9IGxheWVyLm9uY2xpY2s7XG5cdFx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0XHRcdG9sZE9uQ2xpY2soZXZlbnQpO1xuXHRcdFx0fSwgZmFsc2UpO1xuXHRcdFx0bGF5ZXIub25jbGljayA9IG51bGw7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCogV2luZG93cyBQaG9uZSA4LjEgZmFrZXMgdXNlciBhZ2VudCBzdHJpbmcgdG8gbG9vayBsaWtlIEFuZHJvaWQgYW5kIGlQaG9uZS5cblx0KlxuXHQqIEB0eXBlIGJvb2xlYW5cblx0Ki9cblx0dmFyIGRldmljZUlzV2luZG93c1Bob25lID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiV2luZG93cyBQaG9uZVwiKSA+PSAwO1xuXG5cdC8qKlxuXHQgKiBBbmRyb2lkIHJlcXVpcmVzIGV4Y2VwdGlvbnMuXG5cdCAqXG5cdCAqIEB0eXBlIGJvb2xlYW5cblx0ICovXG5cdHZhciBkZXZpY2VJc0FuZHJvaWQgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0FuZHJvaWQnKSA+IDAgJiYgIWRldmljZUlzV2luZG93c1Bob25lO1xuXG5cblx0LyoqXG5cdCAqIGlPUyByZXF1aXJlcyBleGNlcHRpb25zLlxuXHQgKlxuXHQgKiBAdHlwZSBib29sZWFuXG5cdCAqL1xuXHR2YXIgZGV2aWNlSXNJT1MgPSAvaVAoYWR8aG9uZXxvZCkvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgJiYgIWRldmljZUlzV2luZG93c1Bob25lO1xuXG5cblx0LyoqXG5cdCAqIGlPUyA0IHJlcXVpcmVzIGFuIGV4Y2VwdGlvbiBmb3Igc2VsZWN0IGVsZW1lbnRzLlxuXHQgKlxuXHQgKiBAdHlwZSBib29sZWFuXG5cdCAqL1xuXHR2YXIgZGV2aWNlSXNJT1M0ID0gZGV2aWNlSXNJT1MgJiYgKC9PUyA0X1xcZChfXFxkKT8vKS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuXG5cblx0LyoqXG5cdCAqIGlPUyA2LjAtNy4qIHJlcXVpcmVzIHRoZSB0YXJnZXQgZWxlbWVudCB0byBiZSBtYW51YWxseSBkZXJpdmVkXG5cdCAqXG5cdCAqIEB0eXBlIGJvb2xlYW5cblx0ICovXG5cdHZhciBkZXZpY2VJc0lPU1dpdGhCYWRUYXJnZXQgPSBkZXZpY2VJc0lPUyAmJiAoL09TIFs2LTddX1xcZC8pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG5cblx0LyoqXG5cdCAqIEJsYWNrQmVycnkgcmVxdWlyZXMgZXhjZXB0aW9ucy5cblx0ICpcblx0ICogQHR5cGUgYm9vbGVhblxuXHQgKi9cblx0dmFyIGRldmljZUlzQmxhY2tCZXJyeTEwID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdCQjEwJykgPiAwO1xuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmUgd2hldGhlciBhIGdpdmVuIGVsZW1lbnQgcmVxdWlyZXMgYSBuYXRpdmUgY2xpY2suXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RWxlbWVudH0gdGFyZ2V0IFRhcmdldCBET00gZWxlbWVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIHRoZSBlbGVtZW50IG5lZWRzIGEgbmF0aXZlIGNsaWNrXG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm5lZWRzQ2xpY2sgPSBmdW5jdGlvbih0YXJnZXQpIHtcblx0XHRzd2l0Y2ggKHRhcmdldC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKSB7XG5cblx0XHQvLyBEb24ndCBzZW5kIGEgc3ludGhldGljIGNsaWNrIHRvIGRpc2FibGVkIGlucHV0cyAoaXNzdWUgIzYyKVxuXHRcdGNhc2UgJ2J1dHRvbic6XG5cdFx0Y2FzZSAnc2VsZWN0Jzpcblx0XHRjYXNlICd0ZXh0YXJlYSc6XG5cdFx0XHRpZiAodGFyZ2V0LmRpc2FibGVkKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdpbnB1dCc6XG5cblx0XHRcdC8vIEZpbGUgaW5wdXRzIG5lZWQgcmVhbCBjbGlja3Mgb24gaU9TIDYgZHVlIHRvIGEgYnJvd3NlciBidWcgKGlzc3VlICM2OClcblx0XHRcdGlmICgoZGV2aWNlSXNJT1MgJiYgdGFyZ2V0LnR5cGUgPT09ICdmaWxlJykgfHwgdGFyZ2V0LmRpc2FibGVkKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdsYWJlbCc6XG5cdFx0Y2FzZSAnaWZyYW1lJzogLy8gaU9TOCBob21lc2NyZWVuIGFwcHMgY2FuIHByZXZlbnQgZXZlbnRzIGJ1YmJsaW5nIGludG8gZnJhbWVzXG5cdFx0Y2FzZSAndmlkZW8nOlxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuICgvXFxibmVlZHNjbGlja1xcYi8pLnRlc3QodGFyZ2V0LmNsYXNzTmFtZSk7XG5cdH07XG5cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lIHdoZXRoZXIgYSBnaXZlbiBlbGVtZW50IHJlcXVpcmVzIGEgY2FsbCB0byBmb2N1cyB0byBzaW11bGF0ZSBjbGljayBpbnRvIGVsZW1lbnQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RWxlbWVudH0gdGFyZ2V0IFRhcmdldCBET00gZWxlbWVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIHRoZSBlbGVtZW50IHJlcXVpcmVzIGEgY2FsbCB0byBmb2N1cyB0byBzaW11bGF0ZSBuYXRpdmUgY2xpY2suXG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm5lZWRzRm9jdXMgPSBmdW5jdGlvbih0YXJnZXQpIHtcblx0XHRzd2l0Y2ggKHRhcmdldC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0Y2FzZSAndGV4dGFyZWEnOlxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0Y2FzZSAnc2VsZWN0Jzpcblx0XHRcdHJldHVybiAhZGV2aWNlSXNBbmRyb2lkO1xuXHRcdGNhc2UgJ2lucHV0Jzpcblx0XHRcdHN3aXRjaCAodGFyZ2V0LnR5cGUpIHtcblx0XHRcdGNhc2UgJ2J1dHRvbic6XG5cdFx0XHRjYXNlICdjaGVja2JveCc6XG5cdFx0XHRjYXNlICdmaWxlJzpcblx0XHRcdGNhc2UgJ2ltYWdlJzpcblx0XHRcdGNhc2UgJ3JhZGlvJzpcblx0XHRcdGNhc2UgJ3N1Ym1pdCc6XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gTm8gcG9pbnQgaW4gYXR0ZW1wdGluZyB0byBmb2N1cyBkaXNhYmxlZCBpbnB1dHNcblx0XHRcdHJldHVybiAhdGFyZ2V0LmRpc2FibGVkICYmICF0YXJnZXQucmVhZE9ubHk7XG5cdFx0ZGVmYXVsdDpcblx0XHRcdHJldHVybiAoL1xcYm5lZWRzZm9jdXNcXGIvKS50ZXN0KHRhcmdldC5jbGFzc05hbWUpO1xuXHRcdH1cblx0fTtcblxuXG5cdC8qKlxuXHQgKiBTZW5kIGEgY2xpY2sgZXZlbnQgdG8gdGhlIHNwZWNpZmllZCBlbGVtZW50LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEVsZW1lbnR9IHRhcmdldEVsZW1lbnRcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUuc2VuZENsaWNrID0gZnVuY3Rpb24odGFyZ2V0RWxlbWVudCwgZXZlbnQpIHtcblx0XHR2YXIgY2xpY2tFdmVudCwgdG91Y2g7XG5cblx0XHQvLyBPbiBzb21lIEFuZHJvaWQgZGV2aWNlcyBhY3RpdmVFbGVtZW50IG5lZWRzIHRvIGJlIGJsdXJyZWQgb3RoZXJ3aXNlIHRoZSBzeW50aGV0aWMgY2xpY2sgd2lsbCBoYXZlIG5vIGVmZmVjdCAoIzI0KVxuXHRcdGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50ICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgIT09IHRhcmdldEVsZW1lbnQpIHtcblx0XHRcdGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpO1xuXHRcdH1cblxuXHRcdHRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF07XG5cblx0XHQvLyBTeW50aGVzaXNlIGEgY2xpY2sgZXZlbnQsIHdpdGggYW4gZXh0cmEgYXR0cmlidXRlIHNvIGl0IGNhbiBiZSB0cmFja2VkXG5cdFx0Y2xpY2tFdmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdNb3VzZUV2ZW50cycpO1xuXHRcdGNsaWNrRXZlbnQuaW5pdE1vdXNlRXZlbnQodGhpcy5kZXRlcm1pbmVFdmVudFR5cGUodGFyZ2V0RWxlbWVudCksIHRydWUsIHRydWUsIHdpbmRvdywgMSwgdG91Y2guc2NyZWVuWCwgdG91Y2guc2NyZWVuWSwgdG91Y2guY2xpZW50WCwgdG91Y2guY2xpZW50WSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIDAsIG51bGwpO1xuXHRcdGNsaWNrRXZlbnQuZm9yd2FyZGVkVG91Y2hFdmVudCA9IHRydWU7XG5cdFx0dGFyZ2V0RWxlbWVudC5kaXNwYXRjaEV2ZW50KGNsaWNrRXZlbnQpO1xuXHR9O1xuXG5cdEZhc3RDbGljay5wcm90b3R5cGUuZGV0ZXJtaW5lRXZlbnRUeXBlID0gZnVuY3Rpb24odGFyZ2V0RWxlbWVudCkge1xuXG5cdFx0Ly9Jc3N1ZSAjMTU5OiBBbmRyb2lkIENocm9tZSBTZWxlY3QgQm94IGRvZXMgbm90IG9wZW4gd2l0aCBhIHN5bnRoZXRpYyBjbGljayBldmVudFxuXHRcdGlmIChkZXZpY2VJc0FuZHJvaWQgJiYgdGFyZ2V0RWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdzZWxlY3QnKSB7XG5cdFx0XHRyZXR1cm4gJ21vdXNlZG93bic7XG5cdFx0fVxuXG5cdFx0cmV0dXJuICdjbGljayc7XG5cdH07XG5cblxuXHQvKipcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxFbGVtZW50fSB0YXJnZXRFbGVtZW50XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLmZvY3VzID0gZnVuY3Rpb24odGFyZ2V0RWxlbWVudCkge1xuXHRcdHZhciBsZW5ndGg7XG5cblx0XHQvLyBJc3N1ZSAjMTYwOiBvbiBpT1MgNywgc29tZSBpbnB1dCBlbGVtZW50cyAoZS5nLiBkYXRlIGRhdGV0aW1lIG1vbnRoKSB0aHJvdyBhIHZhZ3VlIFR5cGVFcnJvciBvbiBzZXRTZWxlY3Rpb25SYW5nZS4gVGhlc2UgZWxlbWVudHMgZG9uJ3QgaGF2ZSBhbiBpbnRlZ2VyIHZhbHVlIGZvciB0aGUgc2VsZWN0aW9uU3RhcnQgYW5kIHNlbGVjdGlvbkVuZCBwcm9wZXJ0aWVzLCBidXQgdW5mb3J0dW5hdGVseSB0aGF0IGNhbid0IGJlIHVzZWQgZm9yIGRldGVjdGlvbiBiZWNhdXNlIGFjY2Vzc2luZyB0aGUgcHJvcGVydGllcyBhbHNvIHRocm93cyBhIFR5cGVFcnJvci4gSnVzdCBjaGVjayB0aGUgdHlwZSBpbnN0ZWFkLiBGaWxlZCBhcyBBcHBsZSBidWcgIzE1MTIyNzI0LlxuXHRcdGlmIChkZXZpY2VJc0lPUyAmJiB0YXJnZXRFbGVtZW50LnNldFNlbGVjdGlvblJhbmdlICYmIHRhcmdldEVsZW1lbnQudHlwZS5pbmRleE9mKCdkYXRlJykgIT09IDAgJiYgdGFyZ2V0RWxlbWVudC50eXBlICE9PSAndGltZScgJiYgdGFyZ2V0RWxlbWVudC50eXBlICE9PSAnbW9udGgnKSB7XG5cdFx0XHRsZW5ndGggPSB0YXJnZXRFbGVtZW50LnZhbHVlLmxlbmd0aDtcblx0XHRcdHRhcmdldEVsZW1lbnQuc2V0U2VsZWN0aW9uUmFuZ2UobGVuZ3RoLCBsZW5ndGgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0YXJnZXRFbGVtZW50LmZvY3VzKCk7XG5cdFx0fVxuXHR9O1xuXG5cblx0LyoqXG5cdCAqIENoZWNrIHdoZXRoZXIgdGhlIGdpdmVuIHRhcmdldCBlbGVtZW50IGlzIGEgY2hpbGQgb2YgYSBzY3JvbGxhYmxlIGxheWVyIGFuZCBpZiBzbywgc2V0IGEgZmxhZyBvbiBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxFbGVtZW50fSB0YXJnZXRFbGVtZW50XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLnVwZGF0ZVNjcm9sbFBhcmVudCA9IGZ1bmN0aW9uKHRhcmdldEVsZW1lbnQpIHtcblx0XHR2YXIgc2Nyb2xsUGFyZW50LCBwYXJlbnRFbGVtZW50O1xuXG5cdFx0c2Nyb2xsUGFyZW50ID0gdGFyZ2V0RWxlbWVudC5mYXN0Q2xpY2tTY3JvbGxQYXJlbnQ7XG5cblx0XHQvLyBBdHRlbXB0IHRvIGRpc2NvdmVyIHdoZXRoZXIgdGhlIHRhcmdldCBlbGVtZW50IGlzIGNvbnRhaW5lZCB3aXRoaW4gYSBzY3JvbGxhYmxlIGxheWVyLiBSZS1jaGVjayBpZiB0aGVcblx0XHQvLyB0YXJnZXQgZWxlbWVudCB3YXMgbW92ZWQgdG8gYW5vdGhlciBwYXJlbnQuXG5cdFx0aWYgKCFzY3JvbGxQYXJlbnQgfHwgIXNjcm9sbFBhcmVudC5jb250YWlucyh0YXJnZXRFbGVtZW50KSkge1xuXHRcdFx0cGFyZW50RWxlbWVudCA9IHRhcmdldEVsZW1lbnQ7XG5cdFx0XHRkbyB7XG5cdFx0XHRcdGlmIChwYXJlbnRFbGVtZW50LnNjcm9sbEhlaWdodCA+IHBhcmVudEVsZW1lbnQub2Zmc2V0SGVpZ2h0KSB7XG5cdFx0XHRcdFx0c2Nyb2xsUGFyZW50ID0gcGFyZW50RWxlbWVudDtcblx0XHRcdFx0XHR0YXJnZXRFbGVtZW50LmZhc3RDbGlja1Njcm9sbFBhcmVudCA9IHBhcmVudEVsZW1lbnQ7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRwYXJlbnRFbGVtZW50ID0gcGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50O1xuXHRcdFx0fSB3aGlsZSAocGFyZW50RWxlbWVudCk7XG5cdFx0fVxuXG5cdFx0Ly8gQWx3YXlzIHVwZGF0ZSB0aGUgc2Nyb2xsIHRvcCB0cmFja2VyIGlmIHBvc3NpYmxlLlxuXHRcdGlmIChzY3JvbGxQYXJlbnQpIHtcblx0XHRcdHNjcm9sbFBhcmVudC5mYXN0Q2xpY2tMYXN0U2Nyb2xsVG9wID0gc2Nyb2xsUGFyZW50LnNjcm9sbFRvcDtcblx0XHR9XG5cdH07XG5cblxuXHQvKipcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldH0gdGFyZ2V0RWxlbWVudFxuXHQgKiBAcmV0dXJucyB7RWxlbWVudHxFdmVudFRhcmdldH1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUuZ2V0VGFyZ2V0RWxlbWVudEZyb21FdmVudFRhcmdldCA9IGZ1bmN0aW9uKGV2ZW50VGFyZ2V0KSB7XG5cblx0XHQvLyBPbiBzb21lIG9sZGVyIGJyb3dzZXJzIChub3RhYmx5IFNhZmFyaSBvbiBpT1MgNC4xIC0gc2VlIGlzc3VlICM1NikgdGhlIGV2ZW50IHRhcmdldCBtYXkgYmUgYSB0ZXh0IG5vZGUuXG5cdFx0aWYgKGV2ZW50VGFyZ2V0Lm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuXHRcdFx0cmV0dXJuIGV2ZW50VGFyZ2V0LnBhcmVudE5vZGU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGV2ZW50VGFyZ2V0O1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIE9uIHRvdWNoIHN0YXJ0LCByZWNvcmQgdGhlIHBvc2l0aW9uIGFuZCBzY3JvbGwgb2Zmc2V0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUub25Ub3VjaFN0YXJ0ID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR2YXIgdGFyZ2V0RWxlbWVudCwgdG91Y2gsIHNlbGVjdGlvbjtcblxuXHRcdC8vIElnbm9yZSBtdWx0aXBsZSB0b3VjaGVzLCBvdGhlcndpc2UgcGluY2gtdG8tem9vbSBpcyBwcmV2ZW50ZWQgaWYgYm90aCBmaW5nZXJzIGFyZSBvbiB0aGUgRmFzdENsaWNrIGVsZW1lbnQgKGlzc3VlICMxMTEpLlxuXHRcdGlmIChldmVudC50YXJnZXRUb3VjaGVzLmxlbmd0aCA+IDEpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHRhcmdldEVsZW1lbnQgPSB0aGlzLmdldFRhcmdldEVsZW1lbnRGcm9tRXZlbnRUYXJnZXQoZXZlbnQudGFyZ2V0KTtcblx0XHR0b3VjaCA9IGV2ZW50LnRhcmdldFRvdWNoZXNbMF07XG5cblx0XHRpZiAoZGV2aWNlSXNJT1MpIHtcblxuXHRcdFx0Ly8gT25seSB0cnVzdGVkIGV2ZW50cyB3aWxsIGRlc2VsZWN0IHRleHQgb24gaU9TIChpc3N1ZSAjNDkpXG5cdFx0XHRzZWxlY3Rpb24gPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCk7XG5cdFx0XHRpZiAoc2VsZWN0aW9uLnJhbmdlQ291bnQgJiYgIXNlbGVjdGlvbi5pc0NvbGxhcHNlZCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFkZXZpY2VJc0lPUzQpIHtcblxuXHRcdFx0XHQvLyBXZWlyZCB0aGluZ3MgaGFwcGVuIG9uIGlPUyB3aGVuIGFuIGFsZXJ0IG9yIGNvbmZpcm0gZGlhbG9nIGlzIG9wZW5lZCBmcm9tIGEgY2xpY2sgZXZlbnQgY2FsbGJhY2sgKGlzc3VlICMyMyk6XG5cdFx0XHRcdC8vIHdoZW4gdGhlIHVzZXIgbmV4dCB0YXBzIGFueXdoZXJlIGVsc2Ugb24gdGhlIHBhZ2UsIG5ldyB0b3VjaHN0YXJ0IGFuZCB0b3VjaGVuZCBldmVudHMgYXJlIGRpc3BhdGNoZWRcblx0XHRcdFx0Ly8gd2l0aCB0aGUgc2FtZSBpZGVudGlmaWVyIGFzIHRoZSB0b3VjaCBldmVudCB0aGF0IHByZXZpb3VzbHkgdHJpZ2dlcmVkIHRoZSBjbGljayB0aGF0IHRyaWdnZXJlZCB0aGUgYWxlcnQuXG5cdFx0XHRcdC8vIFNhZGx5LCB0aGVyZSBpcyBhbiBpc3N1ZSBvbiBpT1MgNCB0aGF0IGNhdXNlcyBzb21lIG5vcm1hbCB0b3VjaCBldmVudHMgdG8gaGF2ZSB0aGUgc2FtZSBpZGVudGlmaWVyIGFzIGFuXG5cdFx0XHRcdC8vIGltbWVkaWF0ZWx5IHByZWNlZWRpbmcgdG91Y2ggZXZlbnQgKGlzc3VlICM1MiksIHNvIHRoaXMgZml4IGlzIHVuYXZhaWxhYmxlIG9uIHRoYXQgcGxhdGZvcm0uXG5cdFx0XHRcdC8vIElzc3VlIDEyMDogdG91Y2guaWRlbnRpZmllciBpcyAwIHdoZW4gQ2hyb21lIGRldiB0b29scyAnRW11bGF0ZSB0b3VjaCBldmVudHMnIGlzIHNldCB3aXRoIGFuIGlPUyBkZXZpY2UgVUEgc3RyaW5nLFxuXHRcdFx0XHQvLyB3aGljaCBjYXVzZXMgYWxsIHRvdWNoIGV2ZW50cyB0byBiZSBpZ25vcmVkLiBBcyB0aGlzIGJsb2NrIG9ubHkgYXBwbGllcyB0byBpT1MsIGFuZCBpT1MgaWRlbnRpZmllcnMgYXJlIGFsd2F5cyBsb25nLFxuXHRcdFx0XHQvLyByYW5kb20gaW50ZWdlcnMsIGl0J3Mgc2FmZSB0byB0byBjb250aW51ZSBpZiB0aGUgaWRlbnRpZmllciBpcyAwIGhlcmUuXG5cdFx0XHRcdGlmICh0b3VjaC5pZGVudGlmaWVyICYmIHRvdWNoLmlkZW50aWZpZXIgPT09IHRoaXMubGFzdFRvdWNoSWRlbnRpZmllcikge1xuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhpcy5sYXN0VG91Y2hJZGVudGlmaWVyID0gdG91Y2guaWRlbnRpZmllcjtcblxuXHRcdFx0XHQvLyBJZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgYSBjaGlsZCBvZiBhIHNjcm9sbGFibGUgbGF5ZXIgKHVzaW5nIC13ZWJraXQtb3ZlcmZsb3ctc2Nyb2xsaW5nOiB0b3VjaCkgYW5kOlxuXHRcdFx0XHQvLyAxKSB0aGUgdXNlciBkb2VzIGEgZmxpbmcgc2Nyb2xsIG9uIHRoZSBzY3JvbGxhYmxlIGxheWVyXG5cdFx0XHRcdC8vIDIpIHRoZSB1c2VyIHN0b3BzIHRoZSBmbGluZyBzY3JvbGwgd2l0aCBhbm90aGVyIHRhcFxuXHRcdFx0XHQvLyB0aGVuIHRoZSBldmVudC50YXJnZXQgb2YgdGhlIGxhc3QgJ3RvdWNoZW5kJyBldmVudCB3aWxsIGJlIHRoZSBlbGVtZW50IHRoYXQgd2FzIHVuZGVyIHRoZSB1c2VyJ3MgZmluZ2VyXG5cdFx0XHRcdC8vIHdoZW4gdGhlIGZsaW5nIHNjcm9sbCB3YXMgc3RhcnRlZCwgY2F1c2luZyBGYXN0Q2xpY2sgdG8gc2VuZCBhIGNsaWNrIGV2ZW50IHRvIHRoYXQgbGF5ZXIgLSB1bmxlc3MgYSBjaGVja1xuXHRcdFx0XHQvLyBpcyBtYWRlIHRvIGVuc3VyZSB0aGF0IGEgcGFyZW50IGxheWVyIHdhcyBub3Qgc2Nyb2xsZWQgYmVmb3JlIHNlbmRpbmcgYSBzeW50aGV0aWMgY2xpY2sgKGlzc3VlICM0MikuXG5cdFx0XHRcdHRoaXMudXBkYXRlU2Nyb2xsUGFyZW50KHRhcmdldEVsZW1lbnQpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMudHJhY2tpbmdDbGljayA9IHRydWU7XG5cdFx0dGhpcy50cmFja2luZ0NsaWNrU3RhcnQgPSBldmVudC50aW1lU3RhbXA7XG5cdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gdGFyZ2V0RWxlbWVudDtcblxuXHRcdHRoaXMudG91Y2hTdGFydFggPSB0b3VjaC5wYWdlWDtcblx0XHR0aGlzLnRvdWNoU3RhcnRZID0gdG91Y2gucGFnZVk7XG5cblx0XHQvLyBQcmV2ZW50IHBoYW50b20gY2xpY2tzIG9uIGZhc3QgZG91YmxlLXRhcCAoaXNzdWUgIzM2KVxuXHRcdGlmICgoZXZlbnQudGltZVN0YW1wIC0gdGhpcy5sYXN0Q2xpY2tUaW1lKSA8IHRoaXMudGFwRGVsYXkpIHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH07XG5cblxuXHQvKipcblx0ICogQmFzZWQgb24gYSB0b3VjaG1vdmUgZXZlbnQgb2JqZWN0LCBjaGVjayB3aGV0aGVyIHRoZSB0b3VjaCBoYXMgbW92ZWQgcGFzdCBhIGJvdW5kYXJ5IHNpbmNlIGl0IHN0YXJ0ZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS50b3VjaEhhc01vdmVkID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR2YXIgdG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXSwgYm91bmRhcnkgPSB0aGlzLnRvdWNoQm91bmRhcnk7XG5cblx0XHRpZiAoTWF0aC5hYnModG91Y2gucGFnZVggLSB0aGlzLnRvdWNoU3RhcnRYKSA+IGJvdW5kYXJ5IHx8IE1hdGguYWJzKHRvdWNoLnBhZ2VZIC0gdGhpcy50b3VjaFN0YXJ0WSkgPiBib3VuZGFyeSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIFVwZGF0ZSB0aGUgbGFzdCBwb3NpdGlvbi5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uVG91Y2hNb3ZlID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRpZiAoIXRoaXMudHJhY2tpbmdDbGljaykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgdGhlIHRvdWNoIGhhcyBtb3ZlZCwgY2FuY2VsIHRoZSBjbGljayB0cmFja2luZ1xuXHRcdGlmICh0aGlzLnRhcmdldEVsZW1lbnQgIT09IHRoaXMuZ2V0VGFyZ2V0RWxlbWVudEZyb21FdmVudFRhcmdldChldmVudC50YXJnZXQpIHx8IHRoaXMudG91Y2hIYXNNb3ZlZChldmVudCkpIHtcblx0XHRcdHRoaXMudHJhY2tpbmdDbGljayA9IGZhbHNlO1xuXHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBBdHRlbXB0IHRvIGZpbmQgdGhlIGxhYmVsbGVkIGNvbnRyb2wgZm9yIHRoZSBnaXZlbiBsYWJlbCBlbGVtZW50LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEhUTUxMYWJlbEVsZW1lbnR9IGxhYmVsRWxlbWVudFxuXHQgKiBAcmV0dXJucyB7RWxlbWVudHxudWxsfVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5maW5kQ29udHJvbCA9IGZ1bmN0aW9uKGxhYmVsRWxlbWVudCkge1xuXG5cdFx0Ly8gRmFzdCBwYXRoIGZvciBuZXdlciBicm93c2VycyBzdXBwb3J0aW5nIHRoZSBIVE1MNSBjb250cm9sIGF0dHJpYnV0ZVxuXHRcdGlmIChsYWJlbEVsZW1lbnQuY29udHJvbCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZXR1cm4gbGFiZWxFbGVtZW50LmNvbnRyb2w7XG5cdFx0fVxuXG5cdFx0Ly8gQWxsIGJyb3dzZXJzIHVuZGVyIHRlc3QgdGhhdCBzdXBwb3J0IHRvdWNoIGV2ZW50cyBhbHNvIHN1cHBvcnQgdGhlIEhUTUw1IGh0bWxGb3IgYXR0cmlidXRlXG5cdFx0aWYgKGxhYmVsRWxlbWVudC5odG1sRm9yKSB7XG5cdFx0XHRyZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobGFiZWxFbGVtZW50Lmh0bWxGb3IpO1xuXHRcdH1cblxuXHRcdC8vIElmIG5vIGZvciBhdHRyaWJ1dGUgZXhpc3RzLCBhdHRlbXB0IHRvIHJldHJpZXZlIHRoZSBmaXJzdCBsYWJlbGxhYmxlIGRlc2NlbmRhbnQgZWxlbWVudFxuXHRcdC8vIHRoZSBsaXN0IG9mIHdoaWNoIGlzIGRlZmluZWQgaGVyZTogaHR0cDovL3d3dy53My5vcmcvVFIvaHRtbDUvZm9ybXMuaHRtbCNjYXRlZ29yeS1sYWJlbFxuXHRcdHJldHVybiBsYWJlbEVsZW1lbnQucXVlcnlTZWxlY3RvcignYnV0dG9uLCBpbnB1dDpub3QoW3R5cGU9aGlkZGVuXSksIGtleWdlbiwgbWV0ZXIsIG91dHB1dCwgcHJvZ3Jlc3MsIHNlbGVjdCwgdGV4dGFyZWEnKTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBPbiB0b3VjaCBlbmQsIGRldGVybWluZSB3aGV0aGVyIHRvIHNlbmQgYSBjbGljayBldmVudCBhdCBvbmNlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUub25Ub3VjaEVuZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIGZvckVsZW1lbnQsIHRyYWNraW5nQ2xpY2tTdGFydCwgdGFyZ2V0VGFnTmFtZSwgc2Nyb2xsUGFyZW50LCB0b3VjaCwgdGFyZ2V0RWxlbWVudCA9IHRoaXMudGFyZ2V0RWxlbWVudDtcblxuXHRcdGlmICghdGhpcy50cmFja2luZ0NsaWNrKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBQcmV2ZW50IHBoYW50b20gY2xpY2tzIG9uIGZhc3QgZG91YmxlLXRhcCAoaXNzdWUgIzM2KVxuXHRcdGlmICgoZXZlbnQudGltZVN0YW1wIC0gdGhpcy5sYXN0Q2xpY2tUaW1lKSA8IHRoaXMudGFwRGVsYXkpIHtcblx0XHRcdHRoaXMuY2FuY2VsTmV4dENsaWNrID0gdHJ1ZTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdGlmICgoZXZlbnQudGltZVN0YW1wIC0gdGhpcy50cmFja2luZ0NsaWNrU3RhcnQpID4gdGhpcy50YXBUaW1lb3V0KSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBSZXNldCB0byBwcmV2ZW50IHdyb25nIGNsaWNrIGNhbmNlbCBvbiBpbnB1dCAoaXNzdWUgIzE1NikuXG5cdFx0dGhpcy5jYW5jZWxOZXh0Q2xpY2sgPSBmYWxzZTtcblxuXHRcdHRoaXMubGFzdENsaWNrVGltZSA9IGV2ZW50LnRpbWVTdGFtcDtcblxuXHRcdHRyYWNraW5nQ2xpY2tTdGFydCA9IHRoaXMudHJhY2tpbmdDbGlja1N0YXJ0O1xuXHRcdHRoaXMudHJhY2tpbmdDbGljayA9IGZhbHNlO1xuXHRcdHRoaXMudHJhY2tpbmdDbGlja1N0YXJ0ID0gMDtcblxuXHRcdC8vIE9uIHNvbWUgaU9TIGRldmljZXMsIHRoZSB0YXJnZXRFbGVtZW50IHN1cHBsaWVkIHdpdGggdGhlIGV2ZW50IGlzIGludmFsaWQgaWYgdGhlIGxheWVyXG5cdFx0Ly8gaXMgcGVyZm9ybWluZyBhIHRyYW5zaXRpb24gb3Igc2Nyb2xsLCBhbmQgaGFzIHRvIGJlIHJlLWRldGVjdGVkIG1hbnVhbGx5LiBOb3RlIHRoYXRcblx0XHQvLyBmb3IgdGhpcyB0byBmdW5jdGlvbiBjb3JyZWN0bHksIGl0IG11c3QgYmUgY2FsbGVkICphZnRlciogdGhlIGV2ZW50IHRhcmdldCBpcyBjaGVja2VkIVxuXHRcdC8vIFNlZSBpc3N1ZSAjNTc7IGFsc28gZmlsZWQgYXMgcmRhcjovLzEzMDQ4NTg5IC5cblx0XHRpZiAoZGV2aWNlSXNJT1NXaXRoQmFkVGFyZ2V0KSB7XG5cdFx0XHR0b3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdO1xuXG5cdFx0XHQvLyBJbiBjZXJ0YWluIGNhc2VzIGFyZ3VtZW50cyBvZiBlbGVtZW50RnJvbVBvaW50IGNhbiBiZSBuZWdhdGl2ZSwgc28gcHJldmVudCBzZXR0aW5nIHRhcmdldEVsZW1lbnQgdG8gbnVsbFxuXHRcdFx0dGFyZ2V0RWxlbWVudCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQodG91Y2gucGFnZVggLSB3aW5kb3cucGFnZVhPZmZzZXQsIHRvdWNoLnBhZ2VZIC0gd2luZG93LnBhZ2VZT2Zmc2V0KSB8fCB0YXJnZXRFbGVtZW50O1xuXHRcdFx0dGFyZ2V0RWxlbWVudC5mYXN0Q2xpY2tTY3JvbGxQYXJlbnQgPSB0aGlzLnRhcmdldEVsZW1lbnQuZmFzdENsaWNrU2Nyb2xsUGFyZW50O1xuXHRcdH1cblxuXHRcdHRhcmdldFRhZ05hbWUgPSB0YXJnZXRFbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRpZiAodGFyZ2V0VGFnTmFtZSA9PT0gJ2xhYmVsJykge1xuXHRcdFx0Zm9yRWxlbWVudCA9IHRoaXMuZmluZENvbnRyb2wodGFyZ2V0RWxlbWVudCk7XG5cdFx0XHRpZiAoZm9yRWxlbWVudCkge1xuXHRcdFx0XHR0aGlzLmZvY3VzKHRhcmdldEVsZW1lbnQpO1xuXHRcdFx0XHRpZiAoZGV2aWNlSXNBbmRyb2lkKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGFyZ2V0RWxlbWVudCA9IGZvckVsZW1lbnQ7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmICh0aGlzLm5lZWRzRm9jdXModGFyZ2V0RWxlbWVudCkpIHtcblxuXHRcdFx0Ly8gQ2FzZSAxOiBJZiB0aGUgdG91Y2ggc3RhcnRlZCBhIHdoaWxlIGFnbyAoYmVzdCBndWVzcyBpcyAxMDBtcyBiYXNlZCBvbiB0ZXN0cyBmb3IgaXNzdWUgIzM2KSB0aGVuIGZvY3VzIHdpbGwgYmUgdHJpZ2dlcmVkIGFueXdheS4gUmV0dXJuIGVhcmx5IGFuZCB1bnNldCB0aGUgdGFyZ2V0IGVsZW1lbnQgcmVmZXJlbmNlIHNvIHRoYXQgdGhlIHN1YnNlcXVlbnQgY2xpY2sgd2lsbCBiZSBhbGxvd2VkIHRocm91Z2guXG5cdFx0XHQvLyBDYXNlIDI6IFdpdGhvdXQgdGhpcyBleGNlcHRpb24gZm9yIGlucHV0IGVsZW1lbnRzIHRhcHBlZCB3aGVuIHRoZSBkb2N1bWVudCBpcyBjb250YWluZWQgaW4gYW4gaWZyYW1lLCB0aGVuIGFueSBpbnB1dHRlZCB0ZXh0IHdvbid0IGJlIHZpc2libGUgZXZlbiB0aG91Z2ggdGhlIHZhbHVlIGF0dHJpYnV0ZSBpcyB1cGRhdGVkIGFzIHRoZSB1c2VyIHR5cGVzIChpc3N1ZSAjMzcpLlxuXHRcdFx0aWYgKChldmVudC50aW1lU3RhbXAgLSB0cmFja2luZ0NsaWNrU3RhcnQpID4gMTAwIHx8IChkZXZpY2VJc0lPUyAmJiB3aW5kb3cudG9wICE9PSB3aW5kb3cgJiYgdGFyZ2V0VGFnTmFtZSA9PT0gJ2lucHV0JykpIHtcblx0XHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmZvY3VzKHRhcmdldEVsZW1lbnQpO1xuXHRcdFx0dGhpcy5zZW5kQ2xpY2sodGFyZ2V0RWxlbWVudCwgZXZlbnQpO1xuXG5cdFx0XHQvLyBTZWxlY3QgZWxlbWVudHMgbmVlZCB0aGUgZXZlbnQgdG8gZ28gdGhyb3VnaCBvbiBpT1MgNCwgb3RoZXJ3aXNlIHRoZSBzZWxlY3RvciBtZW51IHdvbid0IG9wZW4uXG5cdFx0XHQvLyBBbHNvIHRoaXMgYnJlYWtzIG9wZW5pbmcgc2VsZWN0cyB3aGVuIFZvaWNlT3ZlciBpcyBhY3RpdmUgb24gaU9TNiwgaU9TNyAoYW5kIHBvc3NpYmx5IG90aGVycylcblx0XHRcdGlmICghZGV2aWNlSXNJT1MgfHwgdGFyZ2V0VGFnTmFtZSAhPT0gJ3NlbGVjdCcpIHtcblx0XHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGlmIChkZXZpY2VJc0lPUyAmJiAhZGV2aWNlSXNJT1M0KSB7XG5cblx0XHRcdC8vIERvbid0IHNlbmQgYSBzeW50aGV0aWMgY2xpY2sgZXZlbnQgaWYgdGhlIHRhcmdldCBlbGVtZW50IGlzIGNvbnRhaW5lZCB3aXRoaW4gYSBwYXJlbnQgbGF5ZXIgdGhhdCB3YXMgc2Nyb2xsZWRcblx0XHRcdC8vIGFuZCB0aGlzIHRhcCBpcyBiZWluZyB1c2VkIHRvIHN0b3AgdGhlIHNjcm9sbGluZyAodXN1YWxseSBpbml0aWF0ZWQgYnkgYSBmbGluZyAtIGlzc3VlICM0MikuXG5cdFx0XHRzY3JvbGxQYXJlbnQgPSB0YXJnZXRFbGVtZW50LmZhc3RDbGlja1Njcm9sbFBhcmVudDtcblx0XHRcdGlmIChzY3JvbGxQYXJlbnQgJiYgc2Nyb2xsUGFyZW50LmZhc3RDbGlja0xhc3RTY3JvbGxUb3AgIT09IHNjcm9sbFBhcmVudC5zY3JvbGxUb3ApIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gUHJldmVudCB0aGUgYWN0dWFsIGNsaWNrIGZyb20gZ29pbmcgdGhvdWdoIC0gdW5sZXNzIHRoZSB0YXJnZXQgbm9kZSBpcyBtYXJrZWQgYXMgcmVxdWlyaW5nXG5cdFx0Ly8gcmVhbCBjbGlja3Mgb3IgaWYgaXQgaXMgaW4gdGhlIHdoaXRlbGlzdCBpbiB3aGljaCBjYXNlIG9ubHkgbm9uLXByb2dyYW1tYXRpYyBjbGlja3MgYXJlIHBlcm1pdHRlZC5cblx0XHRpZiAoIXRoaXMubmVlZHNDbGljayh0YXJnZXRFbGVtZW50KSkge1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdHRoaXMuc2VuZENsaWNrKHRhcmdldEVsZW1lbnQsIGV2ZW50KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH07XG5cblxuXHQvKipcblx0ICogT24gdG91Y2ggY2FuY2VsLCBzdG9wIHRyYWNraW5nIHRoZSBjbGljay5cblx0ICpcblx0ICogQHJldHVybnMge3ZvaWR9XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uVG91Y2hDYW5jZWwgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIERldGVybWluZSBtb3VzZSBldmVudHMgd2hpY2ggc2hvdWxkIGJlIHBlcm1pdHRlZC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uTW91c2UgPSBmdW5jdGlvbihldmVudCkge1xuXG5cdFx0Ly8gSWYgYSB0YXJnZXQgZWxlbWVudCB3YXMgbmV2ZXIgc2V0IChiZWNhdXNlIGEgdG91Y2ggZXZlbnQgd2FzIG5ldmVyIGZpcmVkKSBhbGxvdyB0aGUgZXZlbnRcblx0XHRpZiAoIXRoaXMudGFyZ2V0RWxlbWVudCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKGV2ZW50LmZvcndhcmRlZFRvdWNoRXZlbnQpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIFByb2dyYW1tYXRpY2FsbHkgZ2VuZXJhdGVkIGV2ZW50cyB0YXJnZXRpbmcgYSBzcGVjaWZpYyBlbGVtZW50IHNob3VsZCBiZSBwZXJtaXR0ZWRcblx0XHRpZiAoIWV2ZW50LmNhbmNlbGFibGUpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIERlcml2ZSBhbmQgY2hlY2sgdGhlIHRhcmdldCBlbGVtZW50IHRvIHNlZSB3aGV0aGVyIHRoZSBtb3VzZSBldmVudCBuZWVkcyB0byBiZSBwZXJtaXR0ZWQ7XG5cdFx0Ly8gdW5sZXNzIGV4cGxpY2l0bHkgZW5hYmxlZCwgcHJldmVudCBub24tdG91Y2ggY2xpY2sgZXZlbnRzIGZyb20gdHJpZ2dlcmluZyBhY3Rpb25zLFxuXHRcdC8vIHRvIHByZXZlbnQgZ2hvc3QvZG91YmxlY2xpY2tzLlxuXHRcdGlmICghdGhpcy5uZWVkc0NsaWNrKHRoaXMudGFyZ2V0RWxlbWVudCkgfHwgdGhpcy5jYW5jZWxOZXh0Q2xpY2spIHtcblxuXHRcdFx0Ly8gUHJldmVudCBhbnkgdXNlci1hZGRlZCBsaXN0ZW5lcnMgZGVjbGFyZWQgb24gRmFzdENsaWNrIGVsZW1lbnQgZnJvbSBiZWluZyBmaXJlZC5cblx0XHRcdGlmIChldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24pIHtcblx0XHRcdFx0ZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdC8vIFBhcnQgb2YgdGhlIGhhY2sgZm9yIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBFdmVudCNzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gKGUuZy4gQW5kcm9pZCAyKVxuXHRcdFx0XHRldmVudC5wcm9wYWdhdGlvblN0b3BwZWQgPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBDYW5jZWwgdGhlIGV2ZW50XG5cdFx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBJZiB0aGUgbW91c2UgZXZlbnQgaXMgcGVybWl0dGVkLCByZXR1cm4gdHJ1ZSBmb3IgdGhlIGFjdGlvbiB0byBnbyB0aHJvdWdoLlxuXHRcdHJldHVybiB0cnVlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIE9uIGFjdHVhbCBjbGlja3MsIGRldGVybWluZSB3aGV0aGVyIHRoaXMgaXMgYSB0b3VjaC1nZW5lcmF0ZWQgY2xpY2ssIGEgY2xpY2sgYWN0aW9uIG9jY3VycmluZ1xuXHQgKiBuYXR1cmFsbHkgYWZ0ZXIgYSBkZWxheSBhZnRlciBhIHRvdWNoICh3aGljaCBuZWVkcyB0byBiZSBjYW5jZWxsZWQgdG8gYXZvaWQgZHVwbGljYXRpb24pLCBvclxuXHQgKiBhbiBhY3R1YWwgY2xpY2sgd2hpY2ggc2hvdWxkIGJlIHBlcm1pdHRlZC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uQ2xpY2sgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdHZhciBwZXJtaXR0ZWQ7XG5cblx0XHQvLyBJdCdzIHBvc3NpYmxlIGZvciBhbm90aGVyIEZhc3RDbGljay1saWtlIGxpYnJhcnkgZGVsaXZlcmVkIHdpdGggdGhpcmQtcGFydHkgY29kZSB0byBmaXJlIGEgY2xpY2sgZXZlbnQgYmVmb3JlIEZhc3RDbGljayBkb2VzIChpc3N1ZSAjNDQpLiBJbiB0aGF0IGNhc2UsIHNldCB0aGUgY2xpY2stdHJhY2tpbmcgZmxhZyBiYWNrIHRvIGZhbHNlIGFuZCByZXR1cm4gZWFybHkuIFRoaXMgd2lsbCBjYXVzZSBvblRvdWNoRW5kIHRvIHJldHVybiBlYXJseS5cblx0XHRpZiAodGhpcy50cmFja2luZ0NsaWNrKSB7XG5cdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXHRcdFx0dGhpcy50cmFja2luZ0NsaWNrID0gZmFsc2U7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBWZXJ5IG9kZCBiZWhhdmlvdXIgb24gaU9TIChpc3N1ZSAjMTgpOiBpZiBhIHN1Ym1pdCBlbGVtZW50IGlzIHByZXNlbnQgaW5zaWRlIGEgZm9ybSBhbmQgdGhlIHVzZXIgaGl0cyBlbnRlciBpbiB0aGUgaU9TIHNpbXVsYXRvciBvciBjbGlja3MgdGhlIEdvIGJ1dHRvbiBvbiB0aGUgcG9wLXVwIE9TIGtleWJvYXJkIHRoZSBhIGtpbmQgb2YgJ2Zha2UnIGNsaWNrIGV2ZW50IHdpbGwgYmUgdHJpZ2dlcmVkIHdpdGggdGhlIHN1Ym1pdC10eXBlIGlucHV0IGVsZW1lbnQgYXMgdGhlIHRhcmdldC5cblx0XHRpZiAoZXZlbnQudGFyZ2V0LnR5cGUgPT09ICdzdWJtaXQnICYmIGV2ZW50LmRldGFpbCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cGVybWl0dGVkID0gdGhpcy5vbk1vdXNlKGV2ZW50KTtcblxuXHRcdC8vIE9ubHkgdW5zZXQgdGFyZ2V0RWxlbWVudCBpZiB0aGUgY2xpY2sgaXMgbm90IHBlcm1pdHRlZC4gVGhpcyB3aWxsIGVuc3VyZSB0aGF0IHRoZSBjaGVjayBmb3IgIXRhcmdldEVsZW1lbnQgaW4gb25Nb3VzZSBmYWlscyBhbmQgdGhlIGJyb3dzZXIncyBjbGljayBkb2Vzbid0IGdvIHRocm91Z2guXG5cdFx0aWYgKCFwZXJtaXR0ZWQpIHtcblx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgY2xpY2tzIGFyZSBwZXJtaXR0ZWQsIHJldHVybiB0cnVlIGZvciB0aGUgYWN0aW9uIHRvIGdvIHRocm91Z2guXG5cdFx0cmV0dXJuIHBlcm1pdHRlZDtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBSZW1vdmUgYWxsIEZhc3RDbGljaydzIGV2ZW50IGxpc3RlbmVycy5cblx0ICpcblx0ICogQHJldHVybnMge3ZvaWR9XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgbGF5ZXIgPSB0aGlzLmxheWVyO1xuXG5cdFx0aWYgKGRldmljZUlzQW5kcm9pZCkge1xuXHRcdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHR9XG5cblx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMub25DbGljaywgdHJ1ZSk7XG5cdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMub25Ub3VjaFN0YXJ0LCBmYWxzZSk7XG5cdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5vblRvdWNoTW92ZSwgZmFsc2UpO1xuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5vblRvdWNoRW5kLCBmYWxzZSk7XG5cdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0aGlzLm9uVG91Y2hDYW5jZWwsIGZhbHNlKTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBDaGVjayB3aGV0aGVyIEZhc3RDbGljayBpcyBuZWVkZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RWxlbWVudH0gbGF5ZXIgVGhlIGxheWVyIHRvIGxpc3RlbiBvblxuXHQgKi9cblx0RmFzdENsaWNrLm5vdE5lZWRlZCA9IGZ1bmN0aW9uKGxheWVyKSB7XG5cdFx0dmFyIG1ldGFWaWV3cG9ydDtcblx0XHR2YXIgY2hyb21lVmVyc2lvbjtcblx0XHR2YXIgYmxhY2tiZXJyeVZlcnNpb247XG5cdFx0dmFyIGZpcmVmb3hWZXJzaW9uO1xuXG5cdFx0Ly8gRGV2aWNlcyB0aGF0IGRvbid0IHN1cHBvcnQgdG91Y2ggZG9uJ3QgbmVlZCBGYXN0Q2xpY2tcblx0XHRpZiAodHlwZW9mIHdpbmRvdy5vbnRvdWNoc3RhcnQgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBDaHJvbWUgdmVyc2lvbiAtIHplcm8gZm9yIG90aGVyIGJyb3dzZXJzXG5cdFx0Y2hyb21lVmVyc2lvbiA9ICsoL0Nocm9tZVxcLyhbMC05XSspLy5leGVjKG5hdmlnYXRvci51c2VyQWdlbnQpIHx8IFssMF0pWzFdO1xuXG5cdFx0aWYgKGNocm9tZVZlcnNpb24pIHtcblxuXHRcdFx0aWYgKGRldmljZUlzQW5kcm9pZCkge1xuXHRcdFx0XHRtZXRhVmlld3BvcnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtZXRhW25hbWU9dmlld3BvcnRdJyk7XG5cblx0XHRcdFx0aWYgKG1ldGFWaWV3cG9ydCkge1xuXHRcdFx0XHRcdC8vIENocm9tZSBvbiBBbmRyb2lkIHdpdGggdXNlci1zY2FsYWJsZT1cIm5vXCIgZG9lc24ndCBuZWVkIEZhc3RDbGljayAoaXNzdWUgIzg5KVxuXHRcdFx0XHRcdGlmIChtZXRhVmlld3BvcnQuY29udGVudC5pbmRleE9mKCd1c2VyLXNjYWxhYmxlPW5vJykgIT09IC0xKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gQ2hyb21lIDMyIGFuZCBhYm92ZSB3aXRoIHdpZHRoPWRldmljZS13aWR0aCBvciBsZXNzIGRvbid0IG5lZWQgRmFzdENsaWNrXG5cdFx0XHRcdFx0aWYgKGNocm9tZVZlcnNpb24gPiAzMSAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsV2lkdGggPD0gd2luZG93Lm91dGVyV2lkdGgpIHtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHQvLyBDaHJvbWUgZGVza3RvcCBkb2Vzbid0IG5lZWQgRmFzdENsaWNrIChpc3N1ZSAjMTUpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoZGV2aWNlSXNCbGFja0JlcnJ5MTApIHtcblx0XHRcdGJsYWNrYmVycnlWZXJzaW9uID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvVmVyc2lvblxcLyhbMC05XSopXFwuKFswLTldKikvKTtcblxuXHRcdFx0Ly8gQmxhY2tCZXJyeSAxMC4zKyBkb2VzIG5vdCByZXF1aXJlIEZhc3RjbGljayBsaWJyYXJ5LlxuXHRcdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL2Z0bGFicy9mYXN0Y2xpY2svaXNzdWVzLzI1MVxuXHRcdFx0aWYgKGJsYWNrYmVycnlWZXJzaW9uWzFdID49IDEwICYmIGJsYWNrYmVycnlWZXJzaW9uWzJdID49IDMpIHtcblx0XHRcdFx0bWV0YVZpZXdwb3J0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWV0YVtuYW1lPXZpZXdwb3J0XScpO1xuXG5cdFx0XHRcdGlmIChtZXRhVmlld3BvcnQpIHtcblx0XHRcdFx0XHQvLyB1c2VyLXNjYWxhYmxlPW5vIGVsaW1pbmF0ZXMgY2xpY2sgZGVsYXkuXG5cdFx0XHRcdFx0aWYgKG1ldGFWaWV3cG9ydC5jb250ZW50LmluZGV4T2YoJ3VzZXItc2NhbGFibGU9bm8nKSAhPT0gLTEpIHtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyB3aWR0aD1kZXZpY2Utd2lkdGggKG9yIGxlc3MgdGhhbiBkZXZpY2Utd2lkdGgpIGVsaW1pbmF0ZXMgY2xpY2sgZGVsYXkuXG5cdFx0XHRcdFx0aWYgKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxXaWR0aCA8PSB3aW5kb3cub3V0ZXJXaWR0aCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gSUUxMCB3aXRoIC1tcy10b3VjaC1hY3Rpb246IG5vbmUgb3IgbWFuaXB1bGF0aW9uLCB3aGljaCBkaXNhYmxlcyBkb3VibGUtdGFwLXRvLXpvb20gKGlzc3VlICM5Nylcblx0XHRpZiAobGF5ZXIuc3R5bGUubXNUb3VjaEFjdGlvbiA9PT0gJ25vbmUnIHx8IGxheWVyLnN0eWxlLnRvdWNoQWN0aW9uID09PSAnbWFuaXB1bGF0aW9uJykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gRmlyZWZveCB2ZXJzaW9uIC0gemVybyBmb3Igb3RoZXIgYnJvd3NlcnNcblx0XHRmaXJlZm94VmVyc2lvbiA9ICsoL0ZpcmVmb3hcXC8oWzAtOV0rKS8uZXhlYyhuYXZpZ2F0b3IudXNlckFnZW50KSB8fCBbLDBdKVsxXTtcblxuXHRcdGlmIChmaXJlZm94VmVyc2lvbiA+PSAyNykge1xuXHRcdFx0Ly8gRmlyZWZveCAyNysgZG9lcyBub3QgaGF2ZSB0YXAgZGVsYXkgaWYgdGhlIGNvbnRlbnQgaXMgbm90IHpvb21hYmxlIC0gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9OTIyODk2XG5cblx0XHRcdG1ldGFWaWV3cG9ydCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21ldGFbbmFtZT12aWV3cG9ydF0nKTtcblx0XHRcdGlmIChtZXRhVmlld3BvcnQgJiYgKG1ldGFWaWV3cG9ydC5jb250ZW50LmluZGV4T2YoJ3VzZXItc2NhbGFibGU9bm8nKSAhPT0gLTEgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFdpZHRoIDw9IHdpbmRvdy5vdXRlcldpZHRoKSkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBJRTExOiBwcmVmaXhlZCAtbXMtdG91Y2gtYWN0aW9uIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQgYW5kIGl0J3MgcmVjb21lbmRlZCB0byB1c2Ugbm9uLXByZWZpeGVkIHZlcnNpb25cblx0XHQvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvd2luZG93cy9hcHBzL0hoNzY3MzEzLmFzcHhcblx0XHRpZiAobGF5ZXIuc3R5bGUudG91Y2hBY3Rpb24gPT09ICdub25lJyB8fCBsYXllci5zdHlsZS50b3VjaEFjdGlvbiA9PT0gJ21hbmlwdWxhdGlvbicpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBGYWN0b3J5IG1ldGhvZCBmb3IgY3JlYXRpbmcgYSBGYXN0Q2xpY2sgb2JqZWN0XG5cdCAqXG5cdCAqIEBwYXJhbSB7RWxlbWVudH0gbGF5ZXIgVGhlIGxheWVyIHRvIGxpc3RlbiBvblxuXHQgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIFRoZSBvcHRpb25zIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0c1xuXHQgKi9cblx0RmFzdENsaWNrLmF0dGFjaCA9IGZ1bmN0aW9uKGxheWVyLCBvcHRpb25zKSB7XG5cdFx0cmV0dXJuIG5ldyBGYXN0Q2xpY2sobGF5ZXIsIG9wdGlvbnMpO1xuXHR9O1xuXG5cblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGRlZmluZS5hbWQgPT09ICdvYmplY3QnICYmIGRlZmluZS5hbWQpIHtcblxuXHRcdC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS5cblx0XHRkZWZpbmUoZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gRmFzdENsaWNrO1xuXHRcdH0pO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBGYXN0Q2xpY2suYXR0YWNoO1xuXHRcdG1vZHVsZS5leHBvcnRzLkZhc3RDbGljayA9IEZhc3RDbGljaztcblx0fSBlbHNlIHtcblx0XHR3aW5kb3cuRmFzdENsaWNrID0gRmFzdENsaWNrO1xuXHR9XG59KCkpO1xuIiwiLyohIEhhbW1lci5KUyAtIHYyLjAuNyAtIDIwMTYtMDQtMjJcbiAqIGh0dHA6Ly9oYW1tZXJqcy5naXRodWIuaW8vXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE2IEpvcmlrIFRhbmdlbGRlcjtcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSAqL1xuKGZ1bmN0aW9uKHdpbmRvdywgZG9jdW1lbnQsIGV4cG9ydE5hbWUsIHVuZGVmaW5lZCkge1xuICAndXNlIHN0cmljdCc7XG5cbnZhciBWRU5ET1JfUFJFRklYRVMgPSBbJycsICd3ZWJraXQnLCAnTW96JywgJ01TJywgJ21zJywgJ28nXTtcbnZhciBURVNUX0VMRU1FTlQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxudmFyIFRZUEVfRlVOQ1RJT04gPSAnZnVuY3Rpb24nO1xuXG52YXIgcm91bmQgPSBNYXRoLnJvdW5kO1xudmFyIGFicyA9IE1hdGguYWJzO1xudmFyIG5vdyA9IERhdGUubm93O1xuXG4vKipcbiAqIHNldCBhIHRpbWVvdXQgd2l0aCBhIGdpdmVuIHNjb3BlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHBhcmFtIHtOdW1iZXJ9IHRpbWVvdXRcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0XG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiBzZXRUaW1lb3V0Q29udGV4dChmbiwgdGltZW91dCwgY29udGV4dCkge1xuICAgIHJldHVybiBzZXRUaW1lb3V0KGJpbmRGbihmbiwgY29udGV4dCksIHRpbWVvdXQpO1xufVxuXG4vKipcbiAqIGlmIHRoZSBhcmd1bWVudCBpcyBhbiBhcnJheSwgd2Ugd2FudCB0byBleGVjdXRlIHRoZSBmbiBvbiBlYWNoIGVudHJ5XG4gKiBpZiBpdCBhaW50IGFuIGFycmF5IHdlIGRvbid0IHdhbnQgdG8gZG8gYSB0aGluZy5cbiAqIHRoaXMgaXMgdXNlZCBieSBhbGwgdGhlIG1ldGhvZHMgdGhhdCBhY2NlcHQgYSBzaW5nbGUgYW5kIGFycmF5IGFyZ3VtZW50LlxuICogQHBhcmFtIHsqfEFycmF5fSBhcmdcbiAqIEBwYXJhbSB7U3RyaW5nfSBmblxuICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XVxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGludm9rZUFycmF5QXJnKGFyZywgZm4sIGNvbnRleHQpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShhcmcpKSB7XG4gICAgICAgIGVhY2goYXJnLCBjb250ZXh0W2ZuXSwgY29udGV4dCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogd2FsayBvYmplY3RzIGFuZCBhcnJheXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdG9yXG4gKiBAcGFyYW0ge09iamVjdH0gY29udGV4dFxuICovXG5mdW5jdGlvbiBlYWNoKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcbiAgICB2YXIgaTtcblxuICAgIGlmICghb2JqKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAob2JqLmZvckVhY2gpIHtcbiAgICAgICAgb2JqLmZvckVhY2goaXRlcmF0b3IsIGNvbnRleHQpO1xuICAgIH0gZWxzZSBpZiAob2JqLmxlbmd0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IG9iai5sZW5ndGgpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChpIGluIG9iaikge1xuICAgICAgICAgICAgb2JqLmhhc093blByb3BlcnR5KGkpICYmIGl0ZXJhdG9yLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIHdyYXAgYSBtZXRob2Qgd2l0aCBhIGRlcHJlY2F0aW9uIHdhcm5pbmcgYW5kIHN0YWNrIHRyYWNlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge1N0cmluZ30gbWVzc2FnZVxuICogQHJldHVybnMge0Z1bmN0aW9ufSBBIG5ldyBmdW5jdGlvbiB3cmFwcGluZyB0aGUgc3VwcGxpZWQgbWV0aG9kLlxuICovXG5mdW5jdGlvbiBkZXByZWNhdGUobWV0aG9kLCBuYW1lLCBtZXNzYWdlKSB7XG4gICAgdmFyIGRlcHJlY2F0aW9uTWVzc2FnZSA9ICdERVBSRUNBVEVEIE1FVEhPRDogJyArIG5hbWUgKyAnXFxuJyArIG1lc3NhZ2UgKyAnIEFUIFxcbic7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZSA9IG5ldyBFcnJvcignZ2V0LXN0YWNrLXRyYWNlJyk7XG4gICAgICAgIHZhciBzdGFjayA9IGUgJiYgZS5zdGFjayA/IGUuc3RhY2sucmVwbGFjZSgvXlteXFwoXSs/W1xcbiRdL2dtLCAnJylcbiAgICAgICAgICAgIC5yZXBsYWNlKC9eXFxzK2F0XFxzKy9nbSwgJycpXG4gICAgICAgICAgICAucmVwbGFjZSgvXk9iamVjdC48YW5vbnltb3VzPlxccypcXCgvZ20sICd7YW5vbnltb3VzfSgpQCcpIDogJ1Vua25vd24gU3RhY2sgVHJhY2UnO1xuXG4gICAgICAgIHZhciBsb2cgPSB3aW5kb3cuY29uc29sZSAmJiAod2luZG93LmNvbnNvbGUud2FybiB8fCB3aW5kb3cuY29uc29sZS5sb2cpO1xuICAgICAgICBpZiAobG9nKSB7XG4gICAgICAgICAgICBsb2cuY2FsbCh3aW5kb3cuY29uc29sZSwgZGVwcmVjYXRpb25NZXNzYWdlLCBzdGFjayk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1ldGhvZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG59XG5cbi8qKlxuICogZXh0ZW5kIG9iamVjdC5cbiAqIG1lYW5zIHRoYXQgcHJvcGVydGllcyBpbiBkZXN0IHdpbGwgYmUgb3ZlcndyaXR0ZW4gYnkgdGhlIG9uZXMgaW4gc3JjLlxuICogQHBhcmFtIHtPYmplY3R9IHRhcmdldFxuICogQHBhcmFtIHsuLi5PYmplY3R9IG9iamVjdHNfdG9fYXNzaWduXG4gKiBAcmV0dXJucyB7T2JqZWN0fSB0YXJnZXRcbiAqL1xudmFyIGFzc2lnbjtcbmlmICh0eXBlb2YgT2JqZWN0LmFzc2lnbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIGFzc2lnbiA9IGZ1bmN0aW9uIGFzc2lnbih0YXJnZXQpIHtcbiAgICAgICAgaWYgKHRhcmdldCA9PT0gdW5kZWZpbmVkIHx8IHRhcmdldCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNvbnZlcnQgdW5kZWZpbmVkIG9yIG51bGwgdG8gb2JqZWN0Jyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgb3V0cHV0ID0gT2JqZWN0KHRhcmdldCk7XG4gICAgICAgIGZvciAodmFyIGluZGV4ID0gMTsgaW5kZXggPCBhcmd1bWVudHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gYXJndW1lbnRzW2luZGV4XTtcbiAgICAgICAgICAgIGlmIChzb3VyY2UgIT09IHVuZGVmaW5lZCAmJiBzb3VyY2UgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBuZXh0S2V5IGluIHNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KG5leHRLZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRbbmV4dEtleV0gPSBzb3VyY2VbbmV4dEtleV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9O1xufSBlbHNlIHtcbiAgICBhc3NpZ24gPSBPYmplY3QuYXNzaWduO1xufVxuXG4vKipcbiAqIGV4dGVuZCBvYmplY3QuXG4gKiBtZWFucyB0aGF0IHByb3BlcnRpZXMgaW4gZGVzdCB3aWxsIGJlIG92ZXJ3cml0dGVuIGJ5IHRoZSBvbmVzIGluIHNyYy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBkZXN0XG4gKiBAcGFyYW0ge09iamVjdH0gc3JjXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFttZXJnZT1mYWxzZV1cbiAqIEByZXR1cm5zIHtPYmplY3R9IGRlc3RcbiAqL1xudmFyIGV4dGVuZCA9IGRlcHJlY2F0ZShmdW5jdGlvbiBleHRlbmQoZGVzdCwgc3JjLCBtZXJnZSkge1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoc3JjKTtcbiAgICB2YXIgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBrZXlzLmxlbmd0aCkge1xuICAgICAgICBpZiAoIW1lcmdlIHx8IChtZXJnZSAmJiBkZXN0W2tleXNbaV1dID09PSB1bmRlZmluZWQpKSB7XG4gICAgICAgICAgICBkZXN0W2tleXNbaV1dID0gc3JjW2tleXNbaV1dO1xuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICB9XG4gICAgcmV0dXJuIGRlc3Q7XG59LCAnZXh0ZW5kJywgJ1VzZSBgYXNzaWduYC4nKTtcblxuLyoqXG4gKiBtZXJnZSB0aGUgdmFsdWVzIGZyb20gc3JjIGluIHRoZSBkZXN0LlxuICogbWVhbnMgdGhhdCBwcm9wZXJ0aWVzIHRoYXQgZXhpc3QgaW4gZGVzdCB3aWxsIG5vdCBiZSBvdmVyd3JpdHRlbiBieSBzcmNcbiAqIEBwYXJhbSB7T2JqZWN0fSBkZXN0XG4gKiBAcGFyYW0ge09iamVjdH0gc3JjXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBkZXN0XG4gKi9cbnZhciBtZXJnZSA9IGRlcHJlY2F0ZShmdW5jdGlvbiBtZXJnZShkZXN0LCBzcmMpIHtcbiAgICByZXR1cm4gZXh0ZW5kKGRlc3QsIHNyYywgdHJ1ZSk7XG59LCAnbWVyZ2UnLCAnVXNlIGBhc3NpZ25gLicpO1xuXG4vKipcbiAqIHNpbXBsZSBjbGFzcyBpbmhlcml0YW5jZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2hpbGRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGJhc2VcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcHJvcGVydGllc11cbiAqL1xuZnVuY3Rpb24gaW5oZXJpdChjaGlsZCwgYmFzZSwgcHJvcGVydGllcykge1xuICAgIHZhciBiYXNlUCA9IGJhc2UucHJvdG90eXBlLFxuICAgICAgICBjaGlsZFA7XG5cbiAgICBjaGlsZFAgPSBjaGlsZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKGJhc2VQKTtcbiAgICBjaGlsZFAuY29uc3RydWN0b3IgPSBjaGlsZDtcbiAgICBjaGlsZFAuX3N1cGVyID0gYmFzZVA7XG5cbiAgICBpZiAocHJvcGVydGllcykge1xuICAgICAgICBhc3NpZ24oY2hpbGRQLCBwcm9wZXJ0aWVzKTtcbiAgICB9XG59XG5cbi8qKlxuICogc2ltcGxlIGZ1bmN0aW9uIGJpbmRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge09iamVjdH0gY29udGV4dFxuICogQHJldHVybnMge0Z1bmN0aW9ufVxuICovXG5mdW5jdGlvbiBiaW5kRm4oZm4sIGNvbnRleHQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gYm91bmRGbigpIHtcbiAgICAgICAgcmV0dXJuIGZuLmFwcGx5KGNvbnRleHQsIGFyZ3VtZW50cyk7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBsZXQgYSBib29sZWFuIHZhbHVlIGFsc28gYmUgYSBmdW5jdGlvbiB0aGF0IG11c3QgcmV0dXJuIGEgYm9vbGVhblxuICogdGhpcyBmaXJzdCBpdGVtIGluIGFyZ3Mgd2lsbCBiZSB1c2VkIGFzIHRoZSBjb250ZXh0XG4gKiBAcGFyYW0ge0Jvb2xlYW58RnVuY3Rpb259IHZhbFxuICogQHBhcmFtIHtBcnJheX0gW2FyZ3NdXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gYm9vbE9yRm4odmFsLCBhcmdzKSB7XG4gICAgaWYgKHR5cGVvZiB2YWwgPT0gVFlQRV9GVU5DVElPTikge1xuICAgICAgICByZXR1cm4gdmFsLmFwcGx5KGFyZ3MgPyBhcmdzWzBdIHx8IHVuZGVmaW5lZCA6IHVuZGVmaW5lZCwgYXJncyk7XG4gICAgfVxuICAgIHJldHVybiB2YWw7XG59XG5cbi8qKlxuICogdXNlIHRoZSB2YWwyIHdoZW4gdmFsMSBpcyB1bmRlZmluZWRcbiAqIEBwYXJhbSB7Kn0gdmFsMVxuICogQHBhcmFtIHsqfSB2YWwyXG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuZnVuY3Rpb24gaWZVbmRlZmluZWQodmFsMSwgdmFsMikge1xuICAgIHJldHVybiAodmFsMSA9PT0gdW5kZWZpbmVkKSA/IHZhbDIgOiB2YWwxO1xufVxuXG4vKipcbiAqIGFkZEV2ZW50TGlzdGVuZXIgd2l0aCBtdWx0aXBsZSBldmVudHMgYXQgb25jZVxuICogQHBhcmFtIHtFdmVudFRhcmdldH0gdGFyZ2V0XG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZXNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXJcbiAqL1xuZnVuY3Rpb24gYWRkRXZlbnRMaXN0ZW5lcnModGFyZ2V0LCB0eXBlcywgaGFuZGxlcikge1xuICAgIGVhY2goc3BsaXRTdHIodHlwZXMpLCBmdW5jdGlvbih0eXBlKSB7XG4gICAgICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiByZW1vdmVFdmVudExpc3RlbmVyIHdpdGggbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2VcbiAqIEBwYXJhbSB7RXZlbnRUYXJnZXR9IHRhcmdldFxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyXG4gKi9cbmZ1bmN0aW9uIHJlbW92ZUV2ZW50TGlzdGVuZXJzKHRhcmdldCwgdHlwZXMsIGhhbmRsZXIpIHtcbiAgICBlYWNoKHNwbGl0U3RyKHR5cGVzKSwgZnVuY3Rpb24odHlwZSkge1xuICAgICAgICB0YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogZmluZCBpZiBhIG5vZGUgaXMgaW4gdGhlIGdpdmVuIHBhcmVudFxuICogQG1ldGhvZCBoYXNQYXJlbnRcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IG5vZGVcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IHBhcmVudFxuICogQHJldHVybiB7Qm9vbGVhbn0gZm91bmRcbiAqL1xuZnVuY3Rpb24gaGFzUGFyZW50KG5vZGUsIHBhcmVudCkge1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmIChub2RlID09IHBhcmVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50Tm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIHNtYWxsIGluZGV4T2Ygd3JhcHBlclxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHBhcmFtIHtTdHJpbmd9IGZpbmRcbiAqIEByZXR1cm5zIHtCb29sZWFufSBmb3VuZFxuICovXG5mdW5jdGlvbiBpblN0cihzdHIsIGZpbmQpIHtcbiAgICByZXR1cm4gc3RyLmluZGV4T2YoZmluZCkgPiAtMTtcbn1cblxuLyoqXG4gKiBzcGxpdCBzdHJpbmcgb24gd2hpdGVzcGFjZVxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybnMge0FycmF5fSB3b3Jkc1xuICovXG5mdW5jdGlvbiBzcGxpdFN0cihzdHIpIHtcbiAgICByZXR1cm4gc3RyLnRyaW0oKS5zcGxpdCgvXFxzKy9nKTtcbn1cblxuLyoqXG4gKiBmaW5kIGlmIGEgYXJyYXkgY29udGFpbnMgdGhlIG9iamVjdCB1c2luZyBpbmRleE9mIG9yIGEgc2ltcGxlIHBvbHlGaWxsXG4gKiBAcGFyYW0ge0FycmF5fSBzcmNcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaW5kXG4gKiBAcGFyYW0ge1N0cmluZ30gW2ZpbmRCeUtleV1cbiAqIEByZXR1cm4ge0Jvb2xlYW58TnVtYmVyfSBmYWxzZSB3aGVuIG5vdCBmb3VuZCwgb3IgdGhlIGluZGV4XG4gKi9cbmZ1bmN0aW9uIGluQXJyYXkoc3JjLCBmaW5kLCBmaW5kQnlLZXkpIHtcbiAgICBpZiAoc3JjLmluZGV4T2YgJiYgIWZpbmRCeUtleSkge1xuICAgICAgICByZXR1cm4gc3JjLmluZGV4T2YoZmluZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHNyYy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmICgoZmluZEJ5S2V5ICYmIHNyY1tpXVtmaW5kQnlLZXldID09IGZpbmQpIHx8ICghZmluZEJ5S2V5ICYmIHNyY1tpXSA9PT0gZmluZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxufVxuXG4vKipcbiAqIGNvbnZlcnQgYXJyYXktbGlrZSBvYmplY3RzIHRvIHJlYWwgYXJyYXlzXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJucyB7QXJyYXl9XG4gKi9cbmZ1bmN0aW9uIHRvQXJyYXkob2JqKSB7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKG9iaiwgMCk7XG59XG5cbi8qKlxuICogdW5pcXVlIGFycmF5IHdpdGggb2JqZWN0cyBiYXNlZCBvbiBhIGtleSAobGlrZSAnaWQnKSBvciBqdXN0IGJ5IHRoZSBhcnJheSdzIHZhbHVlXG4gKiBAcGFyYW0ge0FycmF5fSBzcmMgW3tpZDoxfSx7aWQ6Mn0se2lkOjF9XVxuICogQHBhcmFtIHtTdHJpbmd9IFtrZXldXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtzb3J0PUZhbHNlXVxuICogQHJldHVybnMge0FycmF5fSBbe2lkOjF9LHtpZDoyfV1cbiAqL1xuZnVuY3Rpb24gdW5pcXVlQXJyYXkoc3JjLCBrZXksIHNvcnQpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIHZhciB2YWx1ZXMgPSBbXTtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICB3aGlsZSAoaSA8IHNyYy5sZW5ndGgpIHtcbiAgICAgICAgdmFyIHZhbCA9IGtleSA/IHNyY1tpXVtrZXldIDogc3JjW2ldO1xuICAgICAgICBpZiAoaW5BcnJheSh2YWx1ZXMsIHZhbCkgPCAwKSB7XG4gICAgICAgICAgICByZXN1bHRzLnB1c2goc3JjW2ldKTtcbiAgICAgICAgfVxuICAgICAgICB2YWx1ZXNbaV0gPSB2YWw7XG4gICAgICAgIGkrKztcbiAgICB9XG5cbiAgICBpZiAoc29ydCkge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuc29ydCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuc29ydChmdW5jdGlvbiBzb3J0VW5pcXVlQXJyYXkoYSwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhW2tleV0gPiBiW2tleV07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRzO1xufVxuXG4vKipcbiAqIGdldCB0aGUgcHJlZml4ZWQgcHJvcGVydHlcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eVxuICogQHJldHVybnMge1N0cmluZ3xVbmRlZmluZWR9IHByZWZpeGVkXG4gKi9cbmZ1bmN0aW9uIHByZWZpeGVkKG9iaiwgcHJvcGVydHkpIHtcbiAgICB2YXIgcHJlZml4LCBwcm9wO1xuICAgIHZhciBjYW1lbFByb3AgPSBwcm9wZXJ0eVswXS50b1VwcGVyQ2FzZSgpICsgcHJvcGVydHkuc2xpY2UoMSk7XG5cbiAgICB2YXIgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBWRU5ET1JfUFJFRklYRVMubGVuZ3RoKSB7XG4gICAgICAgIHByZWZpeCA9IFZFTkRPUl9QUkVGSVhFU1tpXTtcbiAgICAgICAgcHJvcCA9IChwcmVmaXgpID8gcHJlZml4ICsgY2FtZWxQcm9wIDogcHJvcGVydHk7XG5cbiAgICAgICAgaWYgKHByb3AgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvcDtcbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogZ2V0IGEgdW5pcXVlIGlkXG4gKiBAcmV0dXJucyB7bnVtYmVyfSB1bmlxdWVJZFxuICovXG52YXIgX3VuaXF1ZUlkID0gMTtcbmZ1bmN0aW9uIHVuaXF1ZUlkKCkge1xuICAgIHJldHVybiBfdW5pcXVlSWQrKztcbn1cblxuLyoqXG4gKiBnZXQgdGhlIHdpbmRvdyBvYmplY3Qgb2YgYW4gZWxlbWVudFxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuICogQHJldHVybnMge0RvY3VtZW50Vmlld3xXaW5kb3d9XG4gKi9cbmZ1bmN0aW9uIGdldFdpbmRvd0ZvckVsZW1lbnQoZWxlbWVudCkge1xuICAgIHZhciBkb2MgPSBlbGVtZW50Lm93bmVyRG9jdW1lbnQgfHwgZWxlbWVudDtcbiAgICByZXR1cm4gKGRvYy5kZWZhdWx0VmlldyB8fCBkb2MucGFyZW50V2luZG93IHx8IHdpbmRvdyk7XG59XG5cbnZhciBNT0JJTEVfUkVHRVggPSAvbW9iaWxlfHRhYmxldHxpcChhZHxob25lfG9kKXxhbmRyb2lkL2k7XG5cbnZhciBTVVBQT1JUX1RPVUNIID0gKCdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdyk7XG52YXIgU1VQUE9SVF9QT0lOVEVSX0VWRU5UUyA9IHByZWZpeGVkKHdpbmRvdywgJ1BvaW50ZXJFdmVudCcpICE9PSB1bmRlZmluZWQ7XG52YXIgU1VQUE9SVF9PTkxZX1RPVUNIID0gU1VQUE9SVF9UT1VDSCAmJiBNT0JJTEVfUkVHRVgudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcblxudmFyIElOUFVUX1RZUEVfVE9VQ0ggPSAndG91Y2gnO1xudmFyIElOUFVUX1RZUEVfUEVOID0gJ3Blbic7XG52YXIgSU5QVVRfVFlQRV9NT1VTRSA9ICdtb3VzZSc7XG52YXIgSU5QVVRfVFlQRV9LSU5FQ1QgPSAna2luZWN0JztcblxudmFyIENPTVBVVEVfSU5URVJWQUwgPSAyNTtcblxudmFyIElOUFVUX1NUQVJUID0gMTtcbnZhciBJTlBVVF9NT1ZFID0gMjtcbnZhciBJTlBVVF9FTkQgPSA0O1xudmFyIElOUFVUX0NBTkNFTCA9IDg7XG5cbnZhciBESVJFQ1RJT05fTk9ORSA9IDE7XG52YXIgRElSRUNUSU9OX0xFRlQgPSAyO1xudmFyIERJUkVDVElPTl9SSUdIVCA9IDQ7XG52YXIgRElSRUNUSU9OX1VQID0gODtcbnZhciBESVJFQ1RJT05fRE9XTiA9IDE2O1xuXG52YXIgRElSRUNUSU9OX0hPUklaT05UQUwgPSBESVJFQ1RJT05fTEVGVCB8IERJUkVDVElPTl9SSUdIVDtcbnZhciBESVJFQ1RJT05fVkVSVElDQUwgPSBESVJFQ1RJT05fVVAgfCBESVJFQ1RJT05fRE9XTjtcbnZhciBESVJFQ1RJT05fQUxMID0gRElSRUNUSU9OX0hPUklaT05UQUwgfCBESVJFQ1RJT05fVkVSVElDQUw7XG5cbnZhciBQUk9QU19YWSA9IFsneCcsICd5J107XG52YXIgUFJPUFNfQ0xJRU5UX1hZID0gWydjbGllbnRYJywgJ2NsaWVudFknXTtcblxuLyoqXG4gKiBjcmVhdGUgbmV3IGlucHV0IHR5cGUgbWFuYWdlclxuICogQHBhcmFtIHtNYW5hZ2VyfSBtYW5hZ2VyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybnMge0lucHV0fVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIElucHV0KG1hbmFnZXIsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMubWFuYWdlciA9IG1hbmFnZXI7XG4gICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgIHRoaXMuZWxlbWVudCA9IG1hbmFnZXIuZWxlbWVudDtcbiAgICB0aGlzLnRhcmdldCA9IG1hbmFnZXIub3B0aW9ucy5pbnB1dFRhcmdldDtcblxuICAgIC8vIHNtYWxsZXIgd3JhcHBlciBhcm91bmQgdGhlIGhhbmRsZXIsIGZvciB0aGUgc2NvcGUgYW5kIHRoZSBlbmFibGVkIHN0YXRlIG9mIHRoZSBtYW5hZ2VyLFxuICAgIC8vIHNvIHdoZW4gZGlzYWJsZWQgdGhlIGlucHV0IGV2ZW50cyBhcmUgY29tcGxldGVseSBieXBhc3NlZC5cbiAgICB0aGlzLmRvbUhhbmRsZXIgPSBmdW5jdGlvbihldikge1xuICAgICAgICBpZiAoYm9vbE9yRm4obWFuYWdlci5vcHRpb25zLmVuYWJsZSwgW21hbmFnZXJdKSkge1xuICAgICAgICAgICAgc2VsZi5oYW5kbGVyKGV2KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmluaXQoKTtcblxufVxuXG5JbnB1dC5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogc2hvdWxkIGhhbmRsZSB0aGUgaW5wdXRFdmVudCBkYXRhIGFuZCB0cmlnZ2VyIHRoZSBjYWxsYmFja1xuICAgICAqIEB2aXJ0dWFsXG4gICAgICovXG4gICAgaGFuZGxlcjogZnVuY3Rpb24oKSB7IH0sXG5cbiAgICAvKipcbiAgICAgKiBiaW5kIHRoZSBldmVudHNcbiAgICAgKi9cbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5ldkVsICYmIGFkZEV2ZW50TGlzdGVuZXJzKHRoaXMuZWxlbWVudCwgdGhpcy5ldkVsLCB0aGlzLmRvbUhhbmRsZXIpO1xuICAgICAgICB0aGlzLmV2VGFyZ2V0ICYmIGFkZEV2ZW50TGlzdGVuZXJzKHRoaXMudGFyZ2V0LCB0aGlzLmV2VGFyZ2V0LCB0aGlzLmRvbUhhbmRsZXIpO1xuICAgICAgICB0aGlzLmV2V2luICYmIGFkZEV2ZW50TGlzdGVuZXJzKGdldFdpbmRvd0ZvckVsZW1lbnQodGhpcy5lbGVtZW50KSwgdGhpcy5ldldpbiwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogdW5iaW5kIHRoZSBldmVudHNcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5ldkVsICYmIHJlbW92ZUV2ZW50TGlzdGVuZXJzKHRoaXMuZWxlbWVudCwgdGhpcy5ldkVsLCB0aGlzLmRvbUhhbmRsZXIpO1xuICAgICAgICB0aGlzLmV2VGFyZ2V0ICYmIHJlbW92ZUV2ZW50TGlzdGVuZXJzKHRoaXMudGFyZ2V0LCB0aGlzLmV2VGFyZ2V0LCB0aGlzLmRvbUhhbmRsZXIpO1xuICAgICAgICB0aGlzLmV2V2luICYmIHJlbW92ZUV2ZW50TGlzdGVuZXJzKGdldFdpbmRvd0ZvckVsZW1lbnQodGhpcy5lbGVtZW50KSwgdGhpcy5ldldpbiwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIGNyZWF0ZSBuZXcgaW5wdXQgdHlwZSBtYW5hZ2VyXG4gKiBjYWxsZWQgYnkgdGhlIE1hbmFnZXIgY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7SGFtbWVyfSBtYW5hZ2VyXG4gKiBAcmV0dXJucyB7SW5wdXR9XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUlucHV0SW5zdGFuY2UobWFuYWdlcikge1xuICAgIHZhciBUeXBlO1xuICAgIHZhciBpbnB1dENsYXNzID0gbWFuYWdlci5vcHRpb25zLmlucHV0Q2xhc3M7XG5cbiAgICBpZiAoaW5wdXRDbGFzcykge1xuICAgICAgICBUeXBlID0gaW5wdXRDbGFzcztcbiAgICB9IGVsc2UgaWYgKFNVUFBPUlRfUE9JTlRFUl9FVkVOVFMpIHtcbiAgICAgICAgVHlwZSA9IFBvaW50ZXJFdmVudElucHV0O1xuICAgIH0gZWxzZSBpZiAoU1VQUE9SVF9PTkxZX1RPVUNIKSB7XG4gICAgICAgIFR5cGUgPSBUb3VjaElucHV0O1xuICAgIH0gZWxzZSBpZiAoIVNVUFBPUlRfVE9VQ0gpIHtcbiAgICAgICAgVHlwZSA9IE1vdXNlSW5wdXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgVHlwZSA9IFRvdWNoTW91c2VJbnB1dDtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyAoVHlwZSkobWFuYWdlciwgaW5wdXRIYW5kbGVyKTtcbn1cblxuLyoqXG4gKiBoYW5kbGUgaW5wdXQgZXZlbnRzXG4gKiBAcGFyYW0ge01hbmFnZXJ9IG1hbmFnZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFR5cGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICovXG5mdW5jdGlvbiBpbnB1dEhhbmRsZXIobWFuYWdlciwgZXZlbnRUeXBlLCBpbnB1dCkge1xuICAgIHZhciBwb2ludGVyc0xlbiA9IGlucHV0LnBvaW50ZXJzLmxlbmd0aDtcbiAgICB2YXIgY2hhbmdlZFBvaW50ZXJzTGVuID0gaW5wdXQuY2hhbmdlZFBvaW50ZXJzLmxlbmd0aDtcbiAgICB2YXIgaXNGaXJzdCA9IChldmVudFR5cGUgJiBJTlBVVF9TVEFSVCAmJiAocG9pbnRlcnNMZW4gLSBjaGFuZ2VkUG9pbnRlcnNMZW4gPT09IDApKTtcbiAgICB2YXIgaXNGaW5hbCA9IChldmVudFR5cGUgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSAmJiAocG9pbnRlcnNMZW4gLSBjaGFuZ2VkUG9pbnRlcnNMZW4gPT09IDApKTtcblxuICAgIGlucHV0LmlzRmlyc3QgPSAhIWlzRmlyc3Q7XG4gICAgaW5wdXQuaXNGaW5hbCA9ICEhaXNGaW5hbDtcblxuICAgIGlmIChpc0ZpcnN0KSB7XG4gICAgICAgIG1hbmFnZXIuc2Vzc2lvbiA9IHt9O1xuICAgIH1cblxuICAgIC8vIHNvdXJjZSBldmVudCBpcyB0aGUgbm9ybWFsaXplZCB2YWx1ZSBvZiB0aGUgZG9tRXZlbnRzXG4gICAgLy8gbGlrZSAndG91Y2hzdGFydCwgbW91c2V1cCwgcG9pbnRlcmRvd24nXG4gICAgaW5wdXQuZXZlbnRUeXBlID0gZXZlbnRUeXBlO1xuXG4gICAgLy8gY29tcHV0ZSBzY2FsZSwgcm90YXRpb24gZXRjXG4gICAgY29tcHV0ZUlucHV0RGF0YShtYW5hZ2VyLCBpbnB1dCk7XG5cbiAgICAvLyBlbWl0IHNlY3JldCBldmVudFxuICAgIG1hbmFnZXIuZW1pdCgnaGFtbWVyLmlucHV0JywgaW5wdXQpO1xuXG4gICAgbWFuYWdlci5yZWNvZ25pemUoaW5wdXQpO1xuICAgIG1hbmFnZXIuc2Vzc2lvbi5wcmV2SW5wdXQgPSBpbnB1dDtcbn1cblxuLyoqXG4gKiBleHRlbmQgdGhlIGRhdGEgd2l0aCBzb21lIHVzYWJsZSBwcm9wZXJ0aWVzIGxpa2Ugc2NhbGUsIHJvdGF0ZSwgdmVsb2NpdHkgZXRjXG4gKiBAcGFyYW0ge09iamVjdH0gbWFuYWdlclxuICogQHBhcmFtIHtPYmplY3R9IGlucHV0XG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVJbnB1dERhdGEobWFuYWdlciwgaW5wdXQpIHtcbiAgICB2YXIgc2Vzc2lvbiA9IG1hbmFnZXIuc2Vzc2lvbjtcbiAgICB2YXIgcG9pbnRlcnMgPSBpbnB1dC5wb2ludGVycztcbiAgICB2YXIgcG9pbnRlcnNMZW5ndGggPSBwb2ludGVycy5sZW5ndGg7XG5cbiAgICAvLyBzdG9yZSB0aGUgZmlyc3QgaW5wdXQgdG8gY2FsY3VsYXRlIHRoZSBkaXN0YW5jZSBhbmQgZGlyZWN0aW9uXG4gICAgaWYgKCFzZXNzaW9uLmZpcnN0SW5wdXQpIHtcbiAgICAgICAgc2Vzc2lvbi5maXJzdElucHV0ID0gc2ltcGxlQ2xvbmVJbnB1dERhdGEoaW5wdXQpO1xuICAgIH1cblxuICAgIC8vIHRvIGNvbXB1dGUgc2NhbGUgYW5kIHJvdGF0aW9uIHdlIG5lZWQgdG8gc3RvcmUgdGhlIG11bHRpcGxlIHRvdWNoZXNcbiAgICBpZiAocG9pbnRlcnNMZW5ndGggPiAxICYmICFzZXNzaW9uLmZpcnN0TXVsdGlwbGUpIHtcbiAgICAgICAgc2Vzc2lvbi5maXJzdE11bHRpcGxlID0gc2ltcGxlQ2xvbmVJbnB1dERhdGEoaW5wdXQpO1xuICAgIH0gZWxzZSBpZiAocG9pbnRlcnNMZW5ndGggPT09IDEpIHtcbiAgICAgICAgc2Vzc2lvbi5maXJzdE11bHRpcGxlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIGZpcnN0SW5wdXQgPSBzZXNzaW9uLmZpcnN0SW5wdXQ7XG4gICAgdmFyIGZpcnN0TXVsdGlwbGUgPSBzZXNzaW9uLmZpcnN0TXVsdGlwbGU7XG4gICAgdmFyIG9mZnNldENlbnRlciA9IGZpcnN0TXVsdGlwbGUgPyBmaXJzdE11bHRpcGxlLmNlbnRlciA6IGZpcnN0SW5wdXQuY2VudGVyO1xuXG4gICAgdmFyIGNlbnRlciA9IGlucHV0LmNlbnRlciA9IGdldENlbnRlcihwb2ludGVycyk7XG4gICAgaW5wdXQudGltZVN0YW1wID0gbm93KCk7XG4gICAgaW5wdXQuZGVsdGFUaW1lID0gaW5wdXQudGltZVN0YW1wIC0gZmlyc3RJbnB1dC50aW1lU3RhbXA7XG5cbiAgICBpbnB1dC5hbmdsZSA9IGdldEFuZ2xlKG9mZnNldENlbnRlciwgY2VudGVyKTtcbiAgICBpbnB1dC5kaXN0YW5jZSA9IGdldERpc3RhbmNlKG9mZnNldENlbnRlciwgY2VudGVyKTtcblxuICAgIGNvbXB1dGVEZWx0YVhZKHNlc3Npb24sIGlucHV0KTtcbiAgICBpbnB1dC5vZmZzZXREaXJlY3Rpb24gPSBnZXREaXJlY3Rpb24oaW5wdXQuZGVsdGFYLCBpbnB1dC5kZWx0YVkpO1xuXG4gICAgdmFyIG92ZXJhbGxWZWxvY2l0eSA9IGdldFZlbG9jaXR5KGlucHV0LmRlbHRhVGltZSwgaW5wdXQuZGVsdGFYLCBpbnB1dC5kZWx0YVkpO1xuICAgIGlucHV0Lm92ZXJhbGxWZWxvY2l0eVggPSBvdmVyYWxsVmVsb2NpdHkueDtcbiAgICBpbnB1dC5vdmVyYWxsVmVsb2NpdHlZID0gb3ZlcmFsbFZlbG9jaXR5Lnk7XG4gICAgaW5wdXQub3ZlcmFsbFZlbG9jaXR5ID0gKGFicyhvdmVyYWxsVmVsb2NpdHkueCkgPiBhYnMob3ZlcmFsbFZlbG9jaXR5LnkpKSA/IG92ZXJhbGxWZWxvY2l0eS54IDogb3ZlcmFsbFZlbG9jaXR5Lnk7XG5cbiAgICBpbnB1dC5zY2FsZSA9IGZpcnN0TXVsdGlwbGUgPyBnZXRTY2FsZShmaXJzdE11bHRpcGxlLnBvaW50ZXJzLCBwb2ludGVycykgOiAxO1xuICAgIGlucHV0LnJvdGF0aW9uID0gZmlyc3RNdWx0aXBsZSA/IGdldFJvdGF0aW9uKGZpcnN0TXVsdGlwbGUucG9pbnRlcnMsIHBvaW50ZXJzKSA6IDA7XG5cbiAgICBpbnB1dC5tYXhQb2ludGVycyA9ICFzZXNzaW9uLnByZXZJbnB1dCA/IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA6ICgoaW5wdXQucG9pbnRlcnMubGVuZ3RoID5cbiAgICAgICAgc2Vzc2lvbi5wcmV2SW5wdXQubWF4UG9pbnRlcnMpID8gaW5wdXQucG9pbnRlcnMubGVuZ3RoIDogc2Vzc2lvbi5wcmV2SW5wdXQubWF4UG9pbnRlcnMpO1xuXG4gICAgY29tcHV0ZUludGVydmFsSW5wdXREYXRhKHNlc3Npb24sIGlucHV0KTtcblxuICAgIC8vIGZpbmQgdGhlIGNvcnJlY3QgdGFyZ2V0XG4gICAgdmFyIHRhcmdldCA9IG1hbmFnZXIuZWxlbWVudDtcbiAgICBpZiAoaGFzUGFyZW50KGlucHV0LnNyY0V2ZW50LnRhcmdldCwgdGFyZ2V0KSkge1xuICAgICAgICB0YXJnZXQgPSBpbnB1dC5zcmNFdmVudC50YXJnZXQ7XG4gICAgfVxuICAgIGlucHV0LnRhcmdldCA9IHRhcmdldDtcbn1cblxuZnVuY3Rpb24gY29tcHV0ZURlbHRhWFkoc2Vzc2lvbiwgaW5wdXQpIHtcbiAgICB2YXIgY2VudGVyID0gaW5wdXQuY2VudGVyO1xuICAgIHZhciBvZmZzZXQgPSBzZXNzaW9uLm9mZnNldERlbHRhIHx8IHt9O1xuICAgIHZhciBwcmV2RGVsdGEgPSBzZXNzaW9uLnByZXZEZWx0YSB8fCB7fTtcbiAgICB2YXIgcHJldklucHV0ID0gc2Vzc2lvbi5wcmV2SW5wdXQgfHwge307XG5cbiAgICBpZiAoaW5wdXQuZXZlbnRUeXBlID09PSBJTlBVVF9TVEFSVCB8fCBwcmV2SW5wdXQuZXZlbnRUeXBlID09PSBJTlBVVF9FTkQpIHtcbiAgICAgICAgcHJldkRlbHRhID0gc2Vzc2lvbi5wcmV2RGVsdGEgPSB7XG4gICAgICAgICAgICB4OiBwcmV2SW5wdXQuZGVsdGFYIHx8IDAsXG4gICAgICAgICAgICB5OiBwcmV2SW5wdXQuZGVsdGFZIHx8IDBcbiAgICAgICAgfTtcblxuICAgICAgICBvZmZzZXQgPSBzZXNzaW9uLm9mZnNldERlbHRhID0ge1xuICAgICAgICAgICAgeDogY2VudGVyLngsXG4gICAgICAgICAgICB5OiBjZW50ZXIueVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlucHV0LmRlbHRhWCA9IHByZXZEZWx0YS54ICsgKGNlbnRlci54IC0gb2Zmc2V0LngpO1xuICAgIGlucHV0LmRlbHRhWSA9IHByZXZEZWx0YS55ICsgKGNlbnRlci55IC0gb2Zmc2V0LnkpO1xufVxuXG4vKipcbiAqIHZlbG9jaXR5IGlzIGNhbGN1bGF0ZWQgZXZlcnkgeCBtc1xuICogQHBhcmFtIHtPYmplY3R9IHNlc3Npb25cbiAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICovXG5mdW5jdGlvbiBjb21wdXRlSW50ZXJ2YWxJbnB1dERhdGEoc2Vzc2lvbiwgaW5wdXQpIHtcbiAgICB2YXIgbGFzdCA9IHNlc3Npb24ubGFzdEludGVydmFsIHx8IGlucHV0LFxuICAgICAgICBkZWx0YVRpbWUgPSBpbnB1dC50aW1lU3RhbXAgLSBsYXN0LnRpbWVTdGFtcCxcbiAgICAgICAgdmVsb2NpdHksIHZlbG9jaXR5WCwgdmVsb2NpdHlZLCBkaXJlY3Rpb247XG5cbiAgICBpZiAoaW5wdXQuZXZlbnRUeXBlICE9IElOUFVUX0NBTkNFTCAmJiAoZGVsdGFUaW1lID4gQ09NUFVURV9JTlRFUlZBTCB8fCBsYXN0LnZlbG9jaXR5ID09PSB1bmRlZmluZWQpKSB7XG4gICAgICAgIHZhciBkZWx0YVggPSBpbnB1dC5kZWx0YVggLSBsYXN0LmRlbHRhWDtcbiAgICAgICAgdmFyIGRlbHRhWSA9IGlucHV0LmRlbHRhWSAtIGxhc3QuZGVsdGFZO1xuXG4gICAgICAgIHZhciB2ID0gZ2V0VmVsb2NpdHkoZGVsdGFUaW1lLCBkZWx0YVgsIGRlbHRhWSk7XG4gICAgICAgIHZlbG9jaXR5WCA9IHYueDtcbiAgICAgICAgdmVsb2NpdHlZID0gdi55O1xuICAgICAgICB2ZWxvY2l0eSA9IChhYnModi54KSA+IGFicyh2LnkpKSA/IHYueCA6IHYueTtcbiAgICAgICAgZGlyZWN0aW9uID0gZ2V0RGlyZWN0aW9uKGRlbHRhWCwgZGVsdGFZKTtcblxuICAgICAgICBzZXNzaW9uLmxhc3RJbnRlcnZhbCA9IGlucHV0O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHVzZSBsYXRlc3QgdmVsb2NpdHkgaW5mbyBpZiBpdCBkb2Vzbid0IG92ZXJ0YWtlIGEgbWluaW11bSBwZXJpb2RcbiAgICAgICAgdmVsb2NpdHkgPSBsYXN0LnZlbG9jaXR5O1xuICAgICAgICB2ZWxvY2l0eVggPSBsYXN0LnZlbG9jaXR5WDtcbiAgICAgICAgdmVsb2NpdHlZID0gbGFzdC52ZWxvY2l0eVk7XG4gICAgICAgIGRpcmVjdGlvbiA9IGxhc3QuZGlyZWN0aW9uO1xuICAgIH1cblxuICAgIGlucHV0LnZlbG9jaXR5ID0gdmVsb2NpdHk7XG4gICAgaW5wdXQudmVsb2NpdHlYID0gdmVsb2NpdHlYO1xuICAgIGlucHV0LnZlbG9jaXR5WSA9IHZlbG9jaXR5WTtcbiAgICBpbnB1dC5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG59XG5cbi8qKlxuICogY3JlYXRlIGEgc2ltcGxlIGNsb25lIGZyb20gdGhlIGlucHV0IHVzZWQgZm9yIHN0b3JhZ2Ugb2YgZmlyc3RJbnB1dCBhbmQgZmlyc3RNdWx0aXBsZVxuICogQHBhcmFtIHtPYmplY3R9IGlucHV0XG4gKiBAcmV0dXJucyB7T2JqZWN0fSBjbG9uZWRJbnB1dERhdGFcbiAqL1xuZnVuY3Rpb24gc2ltcGxlQ2xvbmVJbnB1dERhdGEoaW5wdXQpIHtcbiAgICAvLyBtYWtlIGEgc2ltcGxlIGNvcHkgb2YgdGhlIHBvaW50ZXJzIGJlY2F1c2Ugd2Ugd2lsbCBnZXQgYSByZWZlcmVuY2UgaWYgd2UgZG9uJ3RcbiAgICAvLyB3ZSBvbmx5IG5lZWQgY2xpZW50WFkgZm9yIHRoZSBjYWxjdWxhdGlvbnNcbiAgICB2YXIgcG9pbnRlcnMgPSBbXTtcbiAgICB2YXIgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBpbnB1dC5wb2ludGVycy5sZW5ndGgpIHtcbiAgICAgICAgcG9pbnRlcnNbaV0gPSB7XG4gICAgICAgICAgICBjbGllbnRYOiByb3VuZChpbnB1dC5wb2ludGVyc1tpXS5jbGllbnRYKSxcbiAgICAgICAgICAgIGNsaWVudFk6IHJvdW5kKGlucHV0LnBvaW50ZXJzW2ldLmNsaWVudFkpXG4gICAgICAgIH07XG4gICAgICAgIGkrKztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0aW1lU3RhbXA6IG5vdygpLFxuICAgICAgICBwb2ludGVyczogcG9pbnRlcnMsXG4gICAgICAgIGNlbnRlcjogZ2V0Q2VudGVyKHBvaW50ZXJzKSxcbiAgICAgICAgZGVsdGFYOiBpbnB1dC5kZWx0YVgsXG4gICAgICAgIGRlbHRhWTogaW5wdXQuZGVsdGFZXG4gICAgfTtcbn1cblxuLyoqXG4gKiBnZXQgdGhlIGNlbnRlciBvZiBhbGwgdGhlIHBvaW50ZXJzXG4gKiBAcGFyYW0ge0FycmF5fSBwb2ludGVyc1xuICogQHJldHVybiB7T2JqZWN0fSBjZW50ZXIgY29udGFpbnMgYHhgIGFuZCBgeWAgcHJvcGVydGllc1xuICovXG5mdW5jdGlvbiBnZXRDZW50ZXIocG9pbnRlcnMpIHtcbiAgICB2YXIgcG9pbnRlcnNMZW5ndGggPSBwb2ludGVycy5sZW5ndGg7XG5cbiAgICAvLyBubyBuZWVkIHRvIGxvb3Agd2hlbiBvbmx5IG9uZSB0b3VjaFxuICAgIGlmIChwb2ludGVyc0xlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogcm91bmQocG9pbnRlcnNbMF0uY2xpZW50WCksXG4gICAgICAgICAgICB5OiByb3VuZChwb2ludGVyc1swXS5jbGllbnRZKVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciB4ID0gMCwgeSA9IDAsIGkgPSAwO1xuICAgIHdoaWxlIChpIDwgcG9pbnRlcnNMZW5ndGgpIHtcbiAgICAgICAgeCArPSBwb2ludGVyc1tpXS5jbGllbnRYO1xuICAgICAgICB5ICs9IHBvaW50ZXJzW2ldLmNsaWVudFk7XG4gICAgICAgIGkrKztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB4OiByb3VuZCh4IC8gcG9pbnRlcnNMZW5ndGgpLFxuICAgICAgICB5OiByb3VuZCh5IC8gcG9pbnRlcnNMZW5ndGgpXG4gICAgfTtcbn1cblxuLyoqXG4gKiBjYWxjdWxhdGUgdGhlIHZlbG9jaXR5IGJldHdlZW4gdHdvIHBvaW50cy4gdW5pdCBpcyBpbiBweCBwZXIgbXMuXG4gKiBAcGFyYW0ge051bWJlcn0gZGVsdGFUaW1lXG4gKiBAcGFyYW0ge051bWJlcn0geFxuICogQHBhcmFtIHtOdW1iZXJ9IHlcbiAqIEByZXR1cm4ge09iamVjdH0gdmVsb2NpdHkgYHhgIGFuZCBgeWBcbiAqL1xuZnVuY3Rpb24gZ2V0VmVsb2NpdHkoZGVsdGFUaW1lLCB4LCB5KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgeDogeCAvIGRlbHRhVGltZSB8fCAwLFxuICAgICAgICB5OiB5IC8gZGVsdGFUaW1lIHx8IDBcbiAgICB9O1xufVxuXG4vKipcbiAqIGdldCB0aGUgZGlyZWN0aW9uIGJldHdlZW4gdHdvIHBvaW50c1xuICogQHBhcmFtIHtOdW1iZXJ9IHhcbiAqIEBwYXJhbSB7TnVtYmVyfSB5XG4gKiBAcmV0dXJuIHtOdW1iZXJ9IGRpcmVjdGlvblxuICovXG5mdW5jdGlvbiBnZXREaXJlY3Rpb24oeCwgeSkge1xuICAgIGlmICh4ID09PSB5KSB7XG4gICAgICAgIHJldHVybiBESVJFQ1RJT05fTk9ORTtcbiAgICB9XG5cbiAgICBpZiAoYWJzKHgpID49IGFicyh5KSkge1xuICAgICAgICByZXR1cm4geCA8IDAgPyBESVJFQ1RJT05fTEVGVCA6IERJUkVDVElPTl9SSUdIVDtcbiAgICB9XG4gICAgcmV0dXJuIHkgPCAwID8gRElSRUNUSU9OX1VQIDogRElSRUNUSU9OX0RPV047XG59XG5cbi8qKlxuICogY2FsY3VsYXRlIHRoZSBhYnNvbHV0ZSBkaXN0YW5jZSBiZXR3ZWVuIHR3byBwb2ludHNcbiAqIEBwYXJhbSB7T2JqZWN0fSBwMSB7eCwgeX1cbiAqIEBwYXJhbSB7T2JqZWN0fSBwMiB7eCwgeX1cbiAqIEBwYXJhbSB7QXJyYXl9IFtwcm9wc10gY29udGFpbmluZyB4IGFuZCB5IGtleXNcbiAqIEByZXR1cm4ge051bWJlcn0gZGlzdGFuY2VcbiAqL1xuZnVuY3Rpb24gZ2V0RGlzdGFuY2UocDEsIHAyLCBwcm9wcykge1xuICAgIGlmICghcHJvcHMpIHtcbiAgICAgICAgcHJvcHMgPSBQUk9QU19YWTtcbiAgICB9XG4gICAgdmFyIHggPSBwMltwcm9wc1swXV0gLSBwMVtwcm9wc1swXV0sXG4gICAgICAgIHkgPSBwMltwcm9wc1sxXV0gLSBwMVtwcm9wc1sxXV07XG5cbiAgICByZXR1cm4gTWF0aC5zcXJ0KCh4ICogeCkgKyAoeSAqIHkpKTtcbn1cblxuLyoqXG4gKiBjYWxjdWxhdGUgdGhlIGFuZ2xlIGJldHdlZW4gdHdvIGNvb3JkaW5hdGVzXG4gKiBAcGFyYW0ge09iamVjdH0gcDFcbiAqIEBwYXJhbSB7T2JqZWN0fSBwMlxuICogQHBhcmFtIHtBcnJheX0gW3Byb3BzXSBjb250YWluaW5nIHggYW5kIHkga2V5c1xuICogQHJldHVybiB7TnVtYmVyfSBhbmdsZVxuICovXG5mdW5jdGlvbiBnZXRBbmdsZShwMSwgcDIsIHByb3BzKSB7XG4gICAgaWYgKCFwcm9wcykge1xuICAgICAgICBwcm9wcyA9IFBST1BTX1hZO1xuICAgIH1cbiAgICB2YXIgeCA9IHAyW3Byb3BzWzBdXSAtIHAxW3Byb3BzWzBdXSxcbiAgICAgICAgeSA9IHAyW3Byb3BzWzFdXSAtIHAxW3Byb3BzWzFdXTtcbiAgICByZXR1cm4gTWF0aC5hdGFuMih5LCB4KSAqIDE4MCAvIE1hdGguUEk7XG59XG5cbi8qKlxuICogY2FsY3VsYXRlIHRoZSByb3RhdGlvbiBkZWdyZWVzIGJldHdlZW4gdHdvIHBvaW50ZXJzZXRzXG4gKiBAcGFyYW0ge0FycmF5fSBzdGFydCBhcnJheSBvZiBwb2ludGVyc1xuICogQHBhcmFtIHtBcnJheX0gZW5kIGFycmF5IG9mIHBvaW50ZXJzXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHJvdGF0aW9uXG4gKi9cbmZ1bmN0aW9uIGdldFJvdGF0aW9uKHN0YXJ0LCBlbmQpIHtcbiAgICByZXR1cm4gZ2V0QW5nbGUoZW5kWzFdLCBlbmRbMF0sIFBST1BTX0NMSUVOVF9YWSkgKyBnZXRBbmdsZShzdGFydFsxXSwgc3RhcnRbMF0sIFBST1BTX0NMSUVOVF9YWSk7XG59XG5cbi8qKlxuICogY2FsY3VsYXRlIHRoZSBzY2FsZSBmYWN0b3IgYmV0d2VlbiB0d28gcG9pbnRlcnNldHNcbiAqIG5vIHNjYWxlIGlzIDEsIGFuZCBnb2VzIGRvd24gdG8gMCB3aGVuIHBpbmNoZWQgdG9nZXRoZXIsIGFuZCBiaWdnZXIgd2hlbiBwaW5jaGVkIG91dFxuICogQHBhcmFtIHtBcnJheX0gc3RhcnQgYXJyYXkgb2YgcG9pbnRlcnNcbiAqIEBwYXJhbSB7QXJyYXl9IGVuZCBhcnJheSBvZiBwb2ludGVyc1xuICogQHJldHVybiB7TnVtYmVyfSBzY2FsZVxuICovXG5mdW5jdGlvbiBnZXRTY2FsZShzdGFydCwgZW5kKSB7XG4gICAgcmV0dXJuIGdldERpc3RhbmNlKGVuZFswXSwgZW5kWzFdLCBQUk9QU19DTElFTlRfWFkpIC8gZ2V0RGlzdGFuY2Uoc3RhcnRbMF0sIHN0YXJ0WzFdLCBQUk9QU19DTElFTlRfWFkpO1xufVxuXG52YXIgTU9VU0VfSU5QVVRfTUFQID0ge1xuICAgIG1vdXNlZG93bjogSU5QVVRfU1RBUlQsXG4gICAgbW91c2Vtb3ZlOiBJTlBVVF9NT1ZFLFxuICAgIG1vdXNldXA6IElOUFVUX0VORFxufTtcblxudmFyIE1PVVNFX0VMRU1FTlRfRVZFTlRTID0gJ21vdXNlZG93bic7XG52YXIgTU9VU0VfV0lORE9XX0VWRU5UUyA9ICdtb3VzZW1vdmUgbW91c2V1cCc7XG5cbi8qKlxuICogTW91c2UgZXZlbnRzIGlucHV0XG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIElucHV0XG4gKi9cbmZ1bmN0aW9uIE1vdXNlSW5wdXQoKSB7XG4gICAgdGhpcy5ldkVsID0gTU9VU0VfRUxFTUVOVF9FVkVOVFM7XG4gICAgdGhpcy5ldldpbiA9IE1PVVNFX1dJTkRPV19FVkVOVFM7XG5cbiAgICB0aGlzLnByZXNzZWQgPSBmYWxzZTsgLy8gbW91c2Vkb3duIHN0YXRlXG5cbiAgICBJbnB1dC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KE1vdXNlSW5wdXQsIElucHV0LCB7XG4gICAgLyoqXG4gICAgICogaGFuZGxlIG1vdXNlIGV2ZW50c1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICAgICAqL1xuICAgIGhhbmRsZXI6IGZ1bmN0aW9uIE1FaGFuZGxlcihldikge1xuICAgICAgICB2YXIgZXZlbnRUeXBlID0gTU9VU0VfSU5QVVRfTUFQW2V2LnR5cGVdO1xuXG4gICAgICAgIC8vIG9uIHN0YXJ0IHdlIHdhbnQgdG8gaGF2ZSB0aGUgbGVmdCBtb3VzZSBidXR0b24gZG93blxuICAgICAgICBpZiAoZXZlbnRUeXBlICYgSU5QVVRfU1RBUlQgJiYgZXYuYnV0dG9uID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnByZXNzZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV2ZW50VHlwZSAmIElOUFVUX01PVkUgJiYgZXYud2hpY2ggIT09IDEpIHtcbiAgICAgICAgICAgIGV2ZW50VHlwZSA9IElOUFVUX0VORDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG1vdXNlIG11c3QgYmUgZG93blxuICAgICAgICBpZiAoIXRoaXMucHJlc3NlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGV2ZW50VHlwZSAmIElOUFVUX0VORCkge1xuICAgICAgICAgICAgdGhpcy5wcmVzc2VkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrKHRoaXMubWFuYWdlciwgZXZlbnRUeXBlLCB7XG4gICAgICAgICAgICBwb2ludGVyczogW2V2XSxcbiAgICAgICAgICAgIGNoYW5nZWRQb2ludGVyczogW2V2XSxcbiAgICAgICAgICAgIHBvaW50ZXJUeXBlOiBJTlBVVF9UWVBFX01PVVNFLFxuICAgICAgICAgICAgc3JjRXZlbnQ6IGV2XG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG52YXIgUE9JTlRFUl9JTlBVVF9NQVAgPSB7XG4gICAgcG9pbnRlcmRvd246IElOUFVUX1NUQVJULFxuICAgIHBvaW50ZXJtb3ZlOiBJTlBVVF9NT1ZFLFxuICAgIHBvaW50ZXJ1cDogSU5QVVRfRU5ELFxuICAgIHBvaW50ZXJjYW5jZWw6IElOUFVUX0NBTkNFTCxcbiAgICBwb2ludGVyb3V0OiBJTlBVVF9DQU5DRUxcbn07XG5cbi8vIGluIElFMTAgdGhlIHBvaW50ZXIgdHlwZXMgaXMgZGVmaW5lZCBhcyBhbiBlbnVtXG52YXIgSUUxMF9QT0lOVEVSX1RZUEVfRU5VTSA9IHtcbiAgICAyOiBJTlBVVF9UWVBFX1RPVUNILFxuICAgIDM6IElOUFVUX1RZUEVfUEVOLFxuICAgIDQ6IElOUFVUX1RZUEVfTU9VU0UsXG4gICAgNTogSU5QVVRfVFlQRV9LSU5FQ1QgLy8gc2VlIGh0dHBzOi8vdHdpdHRlci5jb20vamFjb2Jyb3NzaS9zdGF0dXMvNDgwNTk2NDM4NDg5ODkwODE2XG59O1xuXG52YXIgUE9JTlRFUl9FTEVNRU5UX0VWRU5UUyA9ICdwb2ludGVyZG93bic7XG52YXIgUE9JTlRFUl9XSU5ET1dfRVZFTlRTID0gJ3BvaW50ZXJtb3ZlIHBvaW50ZXJ1cCBwb2ludGVyY2FuY2VsJztcblxuLy8gSUUxMCBoYXMgcHJlZml4ZWQgc3VwcG9ydCwgYW5kIGNhc2Utc2Vuc2l0aXZlXG5pZiAod2luZG93Lk1TUG9pbnRlckV2ZW50ICYmICF3aW5kb3cuUG9pbnRlckV2ZW50KSB7XG4gICAgUE9JTlRFUl9FTEVNRU5UX0VWRU5UUyA9ICdNU1BvaW50ZXJEb3duJztcbiAgICBQT0lOVEVSX1dJTkRPV19FVkVOVFMgPSAnTVNQb2ludGVyTW92ZSBNU1BvaW50ZXJVcCBNU1BvaW50ZXJDYW5jZWwnO1xufVxuXG4vKipcbiAqIFBvaW50ZXIgZXZlbnRzIGlucHV0XG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIElucHV0XG4gKi9cbmZ1bmN0aW9uIFBvaW50ZXJFdmVudElucHV0KCkge1xuICAgIHRoaXMuZXZFbCA9IFBPSU5URVJfRUxFTUVOVF9FVkVOVFM7XG4gICAgdGhpcy5ldldpbiA9IFBPSU5URVJfV0lORE9XX0VWRU5UUztcblxuICAgIElucHV0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLnN0b3JlID0gKHRoaXMubWFuYWdlci5zZXNzaW9uLnBvaW50ZXJFdmVudHMgPSBbXSk7XG59XG5cbmluaGVyaXQoUG9pbnRlckV2ZW50SW5wdXQsIElucHV0LCB7XG4gICAgLyoqXG4gICAgICogaGFuZGxlIG1vdXNlIGV2ZW50c1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICAgICAqL1xuICAgIGhhbmRsZXI6IGZ1bmN0aW9uIFBFaGFuZGxlcihldikge1xuICAgICAgICB2YXIgc3RvcmUgPSB0aGlzLnN0b3JlO1xuICAgICAgICB2YXIgcmVtb3ZlUG9pbnRlciA9IGZhbHNlO1xuXG4gICAgICAgIHZhciBldmVudFR5cGVOb3JtYWxpemVkID0gZXYudHlwZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoJ21zJywgJycpO1xuICAgICAgICB2YXIgZXZlbnRUeXBlID0gUE9JTlRFUl9JTlBVVF9NQVBbZXZlbnRUeXBlTm9ybWFsaXplZF07XG4gICAgICAgIHZhciBwb2ludGVyVHlwZSA9IElFMTBfUE9JTlRFUl9UWVBFX0VOVU1bZXYucG9pbnRlclR5cGVdIHx8IGV2LnBvaW50ZXJUeXBlO1xuXG4gICAgICAgIHZhciBpc1RvdWNoID0gKHBvaW50ZXJUeXBlID09IElOUFVUX1RZUEVfVE9VQ0gpO1xuXG4gICAgICAgIC8vIGdldCBpbmRleCBvZiB0aGUgZXZlbnQgaW4gdGhlIHN0b3JlXG4gICAgICAgIHZhciBzdG9yZUluZGV4ID0gaW5BcnJheShzdG9yZSwgZXYucG9pbnRlcklkLCAncG9pbnRlcklkJyk7XG5cbiAgICAgICAgLy8gc3RhcnQgYW5kIG1vdXNlIG11c3QgYmUgZG93blxuICAgICAgICBpZiAoZXZlbnRUeXBlICYgSU5QVVRfU1RBUlQgJiYgKGV2LmJ1dHRvbiA9PT0gMCB8fCBpc1RvdWNoKSkge1xuICAgICAgICAgICAgaWYgKHN0b3JlSW5kZXggPCAwKSB7XG4gICAgICAgICAgICAgICAgc3RvcmUucHVzaChldik7XG4gICAgICAgICAgICAgICAgc3RvcmVJbmRleCA9IHN0b3JlLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnRUeXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkpIHtcbiAgICAgICAgICAgIHJlbW92ZVBvaW50ZXIgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaXQgbm90IGZvdW5kLCBzbyB0aGUgcG9pbnRlciBoYXNuJ3QgYmVlbiBkb3duIChzbyBpdCdzIHByb2JhYmx5IGEgaG92ZXIpXG4gICAgICAgIGlmIChzdG9yZUluZGV4IDwgMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdXBkYXRlIHRoZSBldmVudCBpbiB0aGUgc3RvcmVcbiAgICAgICAgc3RvcmVbc3RvcmVJbmRleF0gPSBldjtcblxuICAgICAgICB0aGlzLmNhbGxiYWNrKHRoaXMubWFuYWdlciwgZXZlbnRUeXBlLCB7XG4gICAgICAgICAgICBwb2ludGVyczogc3RvcmUsXG4gICAgICAgICAgICBjaGFuZ2VkUG9pbnRlcnM6IFtldl0sXG4gICAgICAgICAgICBwb2ludGVyVHlwZTogcG9pbnRlclR5cGUsXG4gICAgICAgICAgICBzcmNFdmVudDogZXZcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJlbW92ZVBvaW50ZXIpIHtcbiAgICAgICAgICAgIC8vIHJlbW92ZSBmcm9tIHRoZSBzdG9yZVxuICAgICAgICAgICAgc3RvcmUuc3BsaWNlKHN0b3JlSW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbnZhciBTSU5HTEVfVE9VQ0hfSU5QVVRfTUFQID0ge1xuICAgIHRvdWNoc3RhcnQ6IElOUFVUX1NUQVJULFxuICAgIHRvdWNobW92ZTogSU5QVVRfTU9WRSxcbiAgICB0b3VjaGVuZDogSU5QVVRfRU5ELFxuICAgIHRvdWNoY2FuY2VsOiBJTlBVVF9DQU5DRUxcbn07XG5cbnZhciBTSU5HTEVfVE9VQ0hfVEFSR0VUX0VWRU5UUyA9ICd0b3VjaHN0YXJ0JztcbnZhciBTSU5HTEVfVE9VQ0hfV0lORE9XX0VWRU5UUyA9ICd0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCB0b3VjaGNhbmNlbCc7XG5cbi8qKlxuICogVG91Y2ggZXZlbnRzIGlucHV0XG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIElucHV0XG4gKi9cbmZ1bmN0aW9uIFNpbmdsZVRvdWNoSW5wdXQoKSB7XG4gICAgdGhpcy5ldlRhcmdldCA9IFNJTkdMRV9UT1VDSF9UQVJHRVRfRVZFTlRTO1xuICAgIHRoaXMuZXZXaW4gPSBTSU5HTEVfVE9VQ0hfV0lORE9XX0VWRU5UUztcbiAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcblxuICAgIElucHV0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5cbmluaGVyaXQoU2luZ2xlVG91Y2hJbnB1dCwgSW5wdXQsIHtcbiAgICBoYW5kbGVyOiBmdW5jdGlvbiBURWhhbmRsZXIoZXYpIHtcbiAgICAgICAgdmFyIHR5cGUgPSBTSU5HTEVfVE9VQ0hfSU5QVVRfTUFQW2V2LnR5cGVdO1xuXG4gICAgICAgIC8vIHNob3VsZCB3ZSBoYW5kbGUgdGhlIHRvdWNoIGV2ZW50cz9cbiAgICAgICAgaWYgKHR5cGUgPT09IElOUFVUX1NUQVJUKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLnN0YXJ0ZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0b3VjaGVzID0gbm9ybWFsaXplU2luZ2xlVG91Y2hlcy5jYWxsKHRoaXMsIGV2LCB0eXBlKTtcblxuICAgICAgICAvLyB3aGVuIGRvbmUsIHJlc2V0IHRoZSBzdGFydGVkIHN0YXRlXG4gICAgICAgIGlmICh0eXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkgJiYgdG91Y2hlc1swXS5sZW5ndGggLSB0b3VjaGVzWzFdLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrKHRoaXMubWFuYWdlciwgdHlwZSwge1xuICAgICAgICAgICAgcG9pbnRlcnM6IHRvdWNoZXNbMF0sXG4gICAgICAgICAgICBjaGFuZ2VkUG9pbnRlcnM6IHRvdWNoZXNbMV0sXG4gICAgICAgICAgICBwb2ludGVyVHlwZTogSU5QVVRfVFlQRV9UT1VDSCxcbiAgICAgICAgICAgIHNyY0V2ZW50OiBldlxuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBAdGhpcyB7VG91Y2hJbnB1dH1cbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICogQHBhcmFtIHtOdW1iZXJ9IHR5cGUgZmxhZ1xuICogQHJldHVybnMge3VuZGVmaW5lZHxBcnJheX0gW2FsbCwgY2hhbmdlZF1cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplU2luZ2xlVG91Y2hlcyhldiwgdHlwZSkge1xuICAgIHZhciBhbGwgPSB0b0FycmF5KGV2LnRvdWNoZXMpO1xuICAgIHZhciBjaGFuZ2VkID0gdG9BcnJheShldi5jaGFuZ2VkVG91Y2hlcyk7XG5cbiAgICBpZiAodHlwZSAmIChJTlBVVF9FTkQgfCBJTlBVVF9DQU5DRUwpKSB7XG4gICAgICAgIGFsbCA9IHVuaXF1ZUFycmF5KGFsbC5jb25jYXQoY2hhbmdlZCksICdpZGVudGlmaWVyJywgdHJ1ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIFthbGwsIGNoYW5nZWRdO1xufVxuXG52YXIgVE9VQ0hfSU5QVVRfTUFQID0ge1xuICAgIHRvdWNoc3RhcnQ6IElOUFVUX1NUQVJULFxuICAgIHRvdWNobW92ZTogSU5QVVRfTU9WRSxcbiAgICB0b3VjaGVuZDogSU5QVVRfRU5ELFxuICAgIHRvdWNoY2FuY2VsOiBJTlBVVF9DQU5DRUxcbn07XG5cbnZhciBUT1VDSF9UQVJHRVRfRVZFTlRTID0gJ3RvdWNoc3RhcnQgdG91Y2htb3ZlIHRvdWNoZW5kIHRvdWNoY2FuY2VsJztcblxuLyoqXG4gKiBNdWx0aS11c2VyIHRvdWNoIGV2ZW50cyBpbnB1dFxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBJbnB1dFxuICovXG5mdW5jdGlvbiBUb3VjaElucHV0KCkge1xuICAgIHRoaXMuZXZUYXJnZXQgPSBUT1VDSF9UQVJHRVRfRVZFTlRTO1xuICAgIHRoaXMudGFyZ2V0SWRzID0ge307XG5cbiAgICBJbnB1dC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFRvdWNoSW5wdXQsIElucHV0LCB7XG4gICAgaGFuZGxlcjogZnVuY3Rpb24gTVRFaGFuZGxlcihldikge1xuICAgICAgICB2YXIgdHlwZSA9IFRPVUNIX0lOUFVUX01BUFtldi50eXBlXTtcbiAgICAgICAgdmFyIHRvdWNoZXMgPSBnZXRUb3VjaGVzLmNhbGwodGhpcywgZXYsIHR5cGUpO1xuICAgICAgICBpZiAoIXRvdWNoZXMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FsbGJhY2sodGhpcy5tYW5hZ2VyLCB0eXBlLCB7XG4gICAgICAgICAgICBwb2ludGVyczogdG91Y2hlc1swXSxcbiAgICAgICAgICAgIGNoYW5nZWRQb2ludGVyczogdG91Y2hlc1sxXSxcbiAgICAgICAgICAgIHBvaW50ZXJUeXBlOiBJTlBVVF9UWVBFX1RPVUNILFxuICAgICAgICAgICAgc3JjRXZlbnQ6IGV2XG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIEB0aGlzIHtUb3VjaElucHV0fVxuICogQHBhcmFtIHtPYmplY3R9IGV2XG4gKiBAcGFyYW0ge051bWJlcn0gdHlwZSBmbGFnXG4gKiBAcmV0dXJucyB7dW5kZWZpbmVkfEFycmF5fSBbYWxsLCBjaGFuZ2VkXVxuICovXG5mdW5jdGlvbiBnZXRUb3VjaGVzKGV2LCB0eXBlKSB7XG4gICAgdmFyIGFsbFRvdWNoZXMgPSB0b0FycmF5KGV2LnRvdWNoZXMpO1xuICAgIHZhciB0YXJnZXRJZHMgPSB0aGlzLnRhcmdldElkcztcblxuICAgIC8vIHdoZW4gdGhlcmUgaXMgb25seSBvbmUgdG91Y2gsIHRoZSBwcm9jZXNzIGNhbiBiZSBzaW1wbGlmaWVkXG4gICAgaWYgKHR5cGUgJiAoSU5QVVRfU1RBUlQgfCBJTlBVVF9NT1ZFKSAmJiBhbGxUb3VjaGVzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICB0YXJnZXRJZHNbYWxsVG91Y2hlc1swXS5pZGVudGlmaWVyXSA9IHRydWU7XG4gICAgICAgIHJldHVybiBbYWxsVG91Y2hlcywgYWxsVG91Y2hlc107XG4gICAgfVxuXG4gICAgdmFyIGksXG4gICAgICAgIHRhcmdldFRvdWNoZXMsXG4gICAgICAgIGNoYW5nZWRUb3VjaGVzID0gdG9BcnJheShldi5jaGFuZ2VkVG91Y2hlcyksXG4gICAgICAgIGNoYW5nZWRUYXJnZXRUb3VjaGVzID0gW10sXG4gICAgICAgIHRhcmdldCA9IHRoaXMudGFyZ2V0O1xuXG4gICAgLy8gZ2V0IHRhcmdldCB0b3VjaGVzIGZyb20gdG91Y2hlc1xuICAgIHRhcmdldFRvdWNoZXMgPSBhbGxUb3VjaGVzLmZpbHRlcihmdW5jdGlvbih0b3VjaCkge1xuICAgICAgICByZXR1cm4gaGFzUGFyZW50KHRvdWNoLnRhcmdldCwgdGFyZ2V0KTtcbiAgICB9KTtcblxuICAgIC8vIGNvbGxlY3QgdG91Y2hlc1xuICAgIGlmICh0eXBlID09PSBJTlBVVF9TVEFSVCkge1xuICAgICAgICBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCB0YXJnZXRUb3VjaGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgdGFyZ2V0SWRzW3RhcmdldFRvdWNoZXNbaV0uaWRlbnRpZmllcl0gPSB0cnVlO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gZmlsdGVyIGNoYW5nZWQgdG91Y2hlcyB0byBvbmx5IGNvbnRhaW4gdG91Y2hlcyB0aGF0IGV4aXN0IGluIHRoZSBjb2xsZWN0ZWQgdGFyZ2V0IGlkc1xuICAgIGkgPSAwO1xuICAgIHdoaWxlIChpIDwgY2hhbmdlZFRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICAgIGlmICh0YXJnZXRJZHNbY2hhbmdlZFRvdWNoZXNbaV0uaWRlbnRpZmllcl0pIHtcbiAgICAgICAgICAgIGNoYW5nZWRUYXJnZXRUb3VjaGVzLnB1c2goY2hhbmdlZFRvdWNoZXNbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2xlYW51cCByZW1vdmVkIHRvdWNoZXNcbiAgICAgICAgaWYgKHR5cGUgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSkge1xuICAgICAgICAgICAgZGVsZXRlIHRhcmdldElkc1tjaGFuZ2VkVG91Y2hlc1tpXS5pZGVudGlmaWVyXTtcbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgaWYgKCFjaGFuZ2VkVGFyZ2V0VG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJldHVybiBbXG4gICAgICAgIC8vIG1lcmdlIHRhcmdldFRvdWNoZXMgd2l0aCBjaGFuZ2VkVGFyZ2V0VG91Y2hlcyBzbyBpdCBjb250YWlucyBBTEwgdG91Y2hlcywgaW5jbHVkaW5nICdlbmQnIGFuZCAnY2FuY2VsJ1xuICAgICAgICB1bmlxdWVBcnJheSh0YXJnZXRUb3VjaGVzLmNvbmNhdChjaGFuZ2VkVGFyZ2V0VG91Y2hlcyksICdpZGVudGlmaWVyJywgdHJ1ZSksXG4gICAgICAgIGNoYW5nZWRUYXJnZXRUb3VjaGVzXG4gICAgXTtcbn1cblxuLyoqXG4gKiBDb21iaW5lZCB0b3VjaCBhbmQgbW91c2UgaW5wdXRcbiAqXG4gKiBUb3VjaCBoYXMgYSBoaWdoZXIgcHJpb3JpdHkgdGhlbiBtb3VzZSwgYW5kIHdoaWxlIHRvdWNoaW5nIG5vIG1vdXNlIGV2ZW50cyBhcmUgYWxsb3dlZC5cbiAqIFRoaXMgYmVjYXVzZSB0b3VjaCBkZXZpY2VzIGFsc28gZW1pdCBtb3VzZSBldmVudHMgd2hpbGUgZG9pbmcgYSB0b3VjaC5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIElucHV0XG4gKi9cblxudmFyIERFRFVQX1RJTUVPVVQgPSAyNTAwO1xudmFyIERFRFVQX0RJU1RBTkNFID0gMjU7XG5cbmZ1bmN0aW9uIFRvdWNoTW91c2VJbnB1dCgpIHtcbiAgICBJbnB1dC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdmFyIGhhbmRsZXIgPSBiaW5kRm4odGhpcy5oYW5kbGVyLCB0aGlzKTtcbiAgICB0aGlzLnRvdWNoID0gbmV3IFRvdWNoSW5wdXQodGhpcy5tYW5hZ2VyLCBoYW5kbGVyKTtcbiAgICB0aGlzLm1vdXNlID0gbmV3IE1vdXNlSW5wdXQodGhpcy5tYW5hZ2VyLCBoYW5kbGVyKTtcblxuICAgIHRoaXMucHJpbWFyeVRvdWNoID0gbnVsbDtcbiAgICB0aGlzLmxhc3RUb3VjaGVzID0gW107XG59XG5cbmluaGVyaXQoVG91Y2hNb3VzZUlucHV0LCBJbnB1dCwge1xuICAgIC8qKlxuICAgICAqIGhhbmRsZSBtb3VzZSBhbmQgdG91Y2ggZXZlbnRzXG4gICAgICogQHBhcmFtIHtIYW1tZXJ9IG1hbmFnZXJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaW5wdXRFdmVudFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dERhdGFcbiAgICAgKi9cbiAgICBoYW5kbGVyOiBmdW5jdGlvbiBUTUVoYW5kbGVyKG1hbmFnZXIsIGlucHV0RXZlbnQsIGlucHV0RGF0YSkge1xuICAgICAgICB2YXIgaXNUb3VjaCA9IChpbnB1dERhdGEucG9pbnRlclR5cGUgPT0gSU5QVVRfVFlQRV9UT1VDSCksXG4gICAgICAgICAgICBpc01vdXNlID0gKGlucHV0RGF0YS5wb2ludGVyVHlwZSA9PSBJTlBVVF9UWVBFX01PVVNFKTtcblxuICAgICAgICBpZiAoaXNNb3VzZSAmJiBpbnB1dERhdGEuc291cmNlQ2FwYWJpbGl0aWVzICYmIGlucHV0RGF0YS5zb3VyY2VDYXBhYmlsaXRpZXMuZmlyZXNUb3VjaEV2ZW50cykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gd2hlbiB3ZSdyZSBpbiBhIHRvdWNoIGV2ZW50LCByZWNvcmQgdG91Y2hlcyB0byAgZGUtZHVwZSBzeW50aGV0aWMgbW91c2UgZXZlbnRcbiAgICAgICAgaWYgKGlzVG91Y2gpIHtcbiAgICAgICAgICAgIHJlY29yZFRvdWNoZXMuY2FsbCh0aGlzLCBpbnB1dEV2ZW50LCBpbnB1dERhdGEpO1xuICAgICAgICB9IGVsc2UgaWYgKGlzTW91c2UgJiYgaXNTeW50aGV0aWNFdmVudC5jYWxsKHRoaXMsIGlucHV0RGF0YSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FsbGJhY2sobWFuYWdlciwgaW5wdXRFdmVudCwgaW5wdXREYXRhKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogcmVtb3ZlIHRoZSBldmVudCBsaXN0ZW5lcnNcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbiBkZXN0cm95KCkge1xuICAgICAgICB0aGlzLnRvdWNoLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5tb3VzZS5kZXN0cm95KCk7XG4gICAgfVxufSk7XG5cbmZ1bmN0aW9uIHJlY29yZFRvdWNoZXMoZXZlbnRUeXBlLCBldmVudERhdGEpIHtcbiAgICBpZiAoZXZlbnRUeXBlICYgSU5QVVRfU1RBUlQpIHtcbiAgICAgICAgdGhpcy5wcmltYXJ5VG91Y2ggPSBldmVudERhdGEuY2hhbmdlZFBvaW50ZXJzWzBdLmlkZW50aWZpZXI7XG4gICAgICAgIHNldExhc3RUb3VjaC5jYWxsKHRoaXMsIGV2ZW50RGF0YSk7XG4gICAgfSBlbHNlIGlmIChldmVudFR5cGUgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSkge1xuICAgICAgICBzZXRMYXN0VG91Y2guY2FsbCh0aGlzLCBldmVudERhdGEpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0TGFzdFRvdWNoKGV2ZW50RGF0YSkge1xuICAgIHZhciB0b3VjaCA9IGV2ZW50RGF0YS5jaGFuZ2VkUG9pbnRlcnNbMF07XG5cbiAgICBpZiAodG91Y2guaWRlbnRpZmllciA9PT0gdGhpcy5wcmltYXJ5VG91Y2gpIHtcbiAgICAgICAgdmFyIGxhc3RUb3VjaCA9IHt4OiB0b3VjaC5jbGllbnRYLCB5OiB0b3VjaC5jbGllbnRZfTtcbiAgICAgICAgdGhpcy5sYXN0VG91Y2hlcy5wdXNoKGxhc3RUb3VjaCk7XG4gICAgICAgIHZhciBsdHMgPSB0aGlzLmxhc3RUb3VjaGVzO1xuICAgICAgICB2YXIgcmVtb3ZlTGFzdFRvdWNoID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgaSA9IGx0cy5pbmRleE9mKGxhc3RUb3VjaCk7XG4gICAgICAgICAgICBpZiAoaSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgbHRzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgc2V0VGltZW91dChyZW1vdmVMYXN0VG91Y2gsIERFRFVQX1RJTUVPVVQpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNTeW50aGV0aWNFdmVudChldmVudERhdGEpIHtcbiAgICB2YXIgeCA9IGV2ZW50RGF0YS5zcmNFdmVudC5jbGllbnRYLCB5ID0gZXZlbnREYXRhLnNyY0V2ZW50LmNsaWVudFk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxhc3RUb3VjaGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB0ID0gdGhpcy5sYXN0VG91Y2hlc1tpXTtcbiAgICAgICAgdmFyIGR4ID0gTWF0aC5hYnMoeCAtIHQueCksIGR5ID0gTWF0aC5hYnMoeSAtIHQueSk7XG4gICAgICAgIGlmIChkeCA8PSBERURVUF9ESVNUQU5DRSAmJiBkeSA8PSBERURVUF9ESVNUQU5DRSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG52YXIgUFJFRklYRURfVE9VQ0hfQUNUSU9OID0gcHJlZml4ZWQoVEVTVF9FTEVNRU5ULnN0eWxlLCAndG91Y2hBY3Rpb24nKTtcbnZhciBOQVRJVkVfVE9VQ0hfQUNUSU9OID0gUFJFRklYRURfVE9VQ0hfQUNUSU9OICE9PSB1bmRlZmluZWQ7XG5cbi8vIG1hZ2ljYWwgdG91Y2hBY3Rpb24gdmFsdWVcbnZhciBUT1VDSF9BQ1RJT05fQ09NUFVURSA9ICdjb21wdXRlJztcbnZhciBUT1VDSF9BQ1RJT05fQVVUTyA9ICdhdXRvJztcbnZhciBUT1VDSF9BQ1RJT05fTUFOSVBVTEFUSU9OID0gJ21hbmlwdWxhdGlvbic7IC8vIG5vdCBpbXBsZW1lbnRlZFxudmFyIFRPVUNIX0FDVElPTl9OT05FID0gJ25vbmUnO1xudmFyIFRPVUNIX0FDVElPTl9QQU5fWCA9ICdwYW4teCc7XG52YXIgVE9VQ0hfQUNUSU9OX1BBTl9ZID0gJ3Bhbi15JztcbnZhciBUT1VDSF9BQ1RJT05fTUFQID0gZ2V0VG91Y2hBY3Rpb25Qcm9wcygpO1xuXG4vKipcbiAqIFRvdWNoIEFjdGlvblxuICogc2V0cyB0aGUgdG91Y2hBY3Rpb24gcHJvcGVydHkgb3IgdXNlcyB0aGUganMgYWx0ZXJuYXRpdmVcbiAqIEBwYXJhbSB7TWFuYWdlcn0gbWFuYWdlclxuICogQHBhcmFtIHtTdHJpbmd9IHZhbHVlXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVG91Y2hBY3Rpb24obWFuYWdlciwgdmFsdWUpIHtcbiAgICB0aGlzLm1hbmFnZXIgPSBtYW5hZ2VyO1xuICAgIHRoaXMuc2V0KHZhbHVlKTtcbn1cblxuVG91Y2hBY3Rpb24ucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIHNldCB0aGUgdG91Y2hBY3Rpb24gdmFsdWUgb24gdGhlIGVsZW1lbnQgb3IgZW5hYmxlIHRoZSBwb2x5ZmlsbFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZVxuICAgICAqL1xuICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgLy8gZmluZCBvdXQgdGhlIHRvdWNoLWFjdGlvbiBieSB0aGUgZXZlbnQgaGFuZGxlcnNcbiAgICAgICAgaWYgKHZhbHVlID09IFRPVUNIX0FDVElPTl9DT01QVVRFKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHRoaXMuY29tcHV0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKE5BVElWRV9UT1VDSF9BQ1RJT04gJiYgdGhpcy5tYW5hZ2VyLmVsZW1lbnQuc3R5bGUgJiYgVE9VQ0hfQUNUSU9OX01BUFt2YWx1ZV0pIHtcbiAgICAgICAgICAgIHRoaXMubWFuYWdlci5lbGVtZW50LnN0eWxlW1BSRUZJWEVEX1RPVUNIX0FDVElPTl0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFjdGlvbnMgPSB2YWx1ZS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICoganVzdCByZS1zZXQgdGhlIHRvdWNoQWN0aW9uIHZhbHVlXG4gICAgICovXG4gICAgdXBkYXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5zZXQodGhpcy5tYW5hZ2VyLm9wdGlvbnMudG91Y2hBY3Rpb24pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjb21wdXRlIHRoZSB2YWx1ZSBmb3IgdGhlIHRvdWNoQWN0aW9uIHByb3BlcnR5IGJhc2VkIG9uIHRoZSByZWNvZ25pemVyJ3Mgc2V0dGluZ3NcbiAgICAgKiBAcmV0dXJucyB7U3RyaW5nfSB2YWx1ZVxuICAgICAqL1xuICAgIGNvbXB1dGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYWN0aW9ucyA9IFtdO1xuICAgICAgICBlYWNoKHRoaXMubWFuYWdlci5yZWNvZ25pemVycywgZnVuY3Rpb24ocmVjb2duaXplcikge1xuICAgICAgICAgICAgaWYgKGJvb2xPckZuKHJlY29nbml6ZXIub3B0aW9ucy5lbmFibGUsIFtyZWNvZ25pemVyXSkpIHtcbiAgICAgICAgICAgICAgICBhY3Rpb25zID0gYWN0aW9ucy5jb25jYXQocmVjb2duaXplci5nZXRUb3VjaEFjdGlvbigpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBjbGVhblRvdWNoQWN0aW9ucyhhY3Rpb25zLmpvaW4oJyAnKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHRoaXMgbWV0aG9kIGlzIGNhbGxlZCBvbiBlYWNoIGlucHV0IGN5Y2xlIGFuZCBwcm92aWRlcyB0aGUgcHJldmVudGluZyBvZiB0aGUgYnJvd3NlciBiZWhhdmlvclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICAgICAqL1xuICAgIHByZXZlbnREZWZhdWx0czogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIHNyY0V2ZW50ID0gaW5wdXQuc3JjRXZlbnQ7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSBpbnB1dC5vZmZzZXREaXJlY3Rpb247XG5cbiAgICAgICAgLy8gaWYgdGhlIHRvdWNoIGFjdGlvbiBkaWQgcHJldmVudGVkIG9uY2UgdGhpcyBzZXNzaW9uXG4gICAgICAgIGlmICh0aGlzLm1hbmFnZXIuc2Vzc2lvbi5wcmV2ZW50ZWQpIHtcbiAgICAgICAgICAgIHNyY0V2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYWN0aW9ucyA9IHRoaXMuYWN0aW9ucztcbiAgICAgICAgdmFyIGhhc05vbmUgPSBpblN0cihhY3Rpb25zLCBUT1VDSF9BQ1RJT05fTk9ORSkgJiYgIVRPVUNIX0FDVElPTl9NQVBbVE9VQ0hfQUNUSU9OX05PTkVdO1xuICAgICAgICB2YXIgaGFzUGFuWSA9IGluU3RyKGFjdGlvbnMsIFRPVUNIX0FDVElPTl9QQU5fWSkgJiYgIVRPVUNIX0FDVElPTl9NQVBbVE9VQ0hfQUNUSU9OX1BBTl9ZXTtcbiAgICAgICAgdmFyIGhhc1BhblggPSBpblN0cihhY3Rpb25zLCBUT1VDSF9BQ1RJT05fUEFOX1gpICYmICFUT1VDSF9BQ1RJT05fTUFQW1RPVUNIX0FDVElPTl9QQU5fWF07XG5cbiAgICAgICAgaWYgKGhhc05vbmUpIHtcbiAgICAgICAgICAgIC8vZG8gbm90IHByZXZlbnQgZGVmYXVsdHMgaWYgdGhpcyBpcyBhIHRhcCBnZXN0dXJlXG5cbiAgICAgICAgICAgIHZhciBpc1RhcFBvaW50ZXIgPSBpbnB1dC5wb2ludGVycy5sZW5ndGggPT09IDE7XG4gICAgICAgICAgICB2YXIgaXNUYXBNb3ZlbWVudCA9IGlucHV0LmRpc3RhbmNlIDwgMjtcbiAgICAgICAgICAgIHZhciBpc1RhcFRvdWNoVGltZSA9IGlucHV0LmRlbHRhVGltZSA8IDI1MDtcblxuICAgICAgICAgICAgaWYgKGlzVGFwUG9pbnRlciAmJiBpc1RhcE1vdmVtZW50ICYmIGlzVGFwVG91Y2hUaW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhc1BhblggJiYgaGFzUGFuWSkge1xuICAgICAgICAgICAgLy8gYHBhbi14IHBhbi15YCBtZWFucyBicm93c2VyIGhhbmRsZXMgYWxsIHNjcm9sbGluZy9wYW5uaW5nLCBkbyBub3QgcHJldmVudFxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhc05vbmUgfHxcbiAgICAgICAgICAgIChoYXNQYW5ZICYmIGRpcmVjdGlvbiAmIERJUkVDVElPTl9IT1JJWk9OVEFMKSB8fFxuICAgICAgICAgICAgKGhhc1BhblggJiYgZGlyZWN0aW9uICYgRElSRUNUSU9OX1ZFUlRJQ0FMKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJldmVudFNyYyhzcmNFdmVudCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogY2FsbCBwcmV2ZW50RGVmYXVsdCB0byBwcmV2ZW50IHRoZSBicm93c2VyJ3MgZGVmYXVsdCBiZWhhdmlvciAoc2Nyb2xsaW5nIGluIG1vc3QgY2FzZXMpXG4gICAgICogQHBhcmFtIHtPYmplY3R9IHNyY0V2ZW50XG4gICAgICovXG4gICAgcHJldmVudFNyYzogZnVuY3Rpb24oc3JjRXZlbnQpIHtcbiAgICAgICAgdGhpcy5tYW5hZ2VyLnNlc3Npb24ucHJldmVudGVkID0gdHJ1ZTtcbiAgICAgICAgc3JjRXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIHdoZW4gdGhlIHRvdWNoQWN0aW9ucyBhcmUgY29sbGVjdGVkIHRoZXkgYXJlIG5vdCBhIHZhbGlkIHZhbHVlLCBzbyB3ZSBuZWVkIHRvIGNsZWFuIHRoaW5ncyB1cC4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGFjdGlvbnNcbiAqIEByZXR1cm5zIHsqfVxuICovXG5mdW5jdGlvbiBjbGVhblRvdWNoQWN0aW9ucyhhY3Rpb25zKSB7XG4gICAgLy8gbm9uZVxuICAgIGlmIChpblN0cihhY3Rpb25zLCBUT1VDSF9BQ1RJT05fTk9ORSkpIHtcbiAgICAgICAgcmV0dXJuIFRPVUNIX0FDVElPTl9OT05FO1xuICAgIH1cblxuICAgIHZhciBoYXNQYW5YID0gaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX1BBTl9YKTtcbiAgICB2YXIgaGFzUGFuWSA9IGluU3RyKGFjdGlvbnMsIFRPVUNIX0FDVElPTl9QQU5fWSk7XG5cbiAgICAvLyBpZiBib3RoIHBhbi14IGFuZCBwYW4teSBhcmUgc2V0IChkaWZmZXJlbnQgcmVjb2duaXplcnNcbiAgICAvLyBmb3IgZGlmZmVyZW50IGRpcmVjdGlvbnMsIGUuZy4gaG9yaXpvbnRhbCBwYW4gYnV0IHZlcnRpY2FsIHN3aXBlPylcbiAgICAvLyB3ZSBuZWVkIG5vbmUgKGFzIG90aGVyd2lzZSB3aXRoIHBhbi14IHBhbi15IGNvbWJpbmVkIG5vbmUgb2YgdGhlc2VcbiAgICAvLyByZWNvZ25pemVycyB3aWxsIHdvcmssIHNpbmNlIHRoZSBicm93c2VyIHdvdWxkIGhhbmRsZSBhbGwgcGFubmluZ1xuICAgIGlmIChoYXNQYW5YICYmIGhhc1BhblkpIHtcbiAgICAgICAgcmV0dXJuIFRPVUNIX0FDVElPTl9OT05FO1xuICAgIH1cblxuICAgIC8vIHBhbi14IE9SIHBhbi15XG4gICAgaWYgKGhhc1BhblggfHwgaGFzUGFuWSkge1xuICAgICAgICByZXR1cm4gaGFzUGFuWCA/IFRPVUNIX0FDVElPTl9QQU5fWCA6IFRPVUNIX0FDVElPTl9QQU5fWTtcbiAgICB9XG5cbiAgICAvLyBtYW5pcHVsYXRpb25cbiAgICBpZiAoaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX01BTklQVUxBVElPTikpIHtcbiAgICAgICAgcmV0dXJuIFRPVUNIX0FDVElPTl9NQU5JUFVMQVRJT047XG4gICAgfVxuXG4gICAgcmV0dXJuIFRPVUNIX0FDVElPTl9BVVRPO1xufVxuXG5mdW5jdGlvbiBnZXRUb3VjaEFjdGlvblByb3BzKCkge1xuICAgIGlmICghTkFUSVZFX1RPVUNIX0FDVElPTikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciB0b3VjaE1hcCA9IHt9O1xuICAgIHZhciBjc3NTdXBwb3J0cyA9IHdpbmRvdy5DU1MgJiYgd2luZG93LkNTUy5zdXBwb3J0cztcbiAgICBbJ2F1dG8nLCAnbWFuaXB1bGF0aW9uJywgJ3Bhbi15JywgJ3Bhbi14JywgJ3Bhbi14IHBhbi15JywgJ25vbmUnXS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCkge1xuXG4gICAgICAgIC8vIElmIGNzcy5zdXBwb3J0cyBpcyBub3Qgc3VwcG9ydGVkIGJ1dCB0aGVyZSBpcyBuYXRpdmUgdG91Y2gtYWN0aW9uIGFzc3VtZSBpdCBzdXBwb3J0c1xuICAgICAgICAvLyBhbGwgdmFsdWVzLiBUaGlzIGlzIHRoZSBjYXNlIGZvciBJRSAxMCBhbmQgMTEuXG4gICAgICAgIHRvdWNoTWFwW3ZhbF0gPSBjc3NTdXBwb3J0cyA/IHdpbmRvdy5DU1Muc3VwcG9ydHMoJ3RvdWNoLWFjdGlvbicsIHZhbCkgOiB0cnVlO1xuICAgIH0pO1xuICAgIHJldHVybiB0b3VjaE1hcDtcbn1cblxuLyoqXG4gKiBSZWNvZ25pemVyIGZsb3cgZXhwbGFpbmVkOyAqXG4gKiBBbGwgcmVjb2duaXplcnMgaGF2ZSB0aGUgaW5pdGlhbCBzdGF0ZSBvZiBQT1NTSUJMRSB3aGVuIGEgaW5wdXQgc2Vzc2lvbiBzdGFydHMuXG4gKiBUaGUgZGVmaW5pdGlvbiBvZiBhIGlucHV0IHNlc3Npb24gaXMgZnJvbSB0aGUgZmlyc3QgaW5wdXQgdW50aWwgdGhlIGxhc3QgaW5wdXQsIHdpdGggYWxsIGl0J3MgbW92ZW1lbnQgaW4gaXQuICpcbiAqIEV4YW1wbGUgc2Vzc2lvbiBmb3IgbW91c2UtaW5wdXQ6IG1vdXNlZG93biAtPiBtb3VzZW1vdmUgLT4gbW91c2V1cFxuICpcbiAqIE9uIGVhY2ggcmVjb2duaXppbmcgY3ljbGUgKHNlZSBNYW5hZ2VyLnJlY29nbml6ZSkgdGhlIC5yZWNvZ25pemUoKSBtZXRob2QgaXMgZXhlY3V0ZWRcbiAqIHdoaWNoIGRldGVybWluZXMgd2l0aCBzdGF0ZSBpdCBzaG91bGQgYmUuXG4gKlxuICogSWYgdGhlIHJlY29nbml6ZXIgaGFzIHRoZSBzdGF0ZSBGQUlMRUQsIENBTkNFTExFRCBvciBSRUNPR05JWkVEIChlcXVhbHMgRU5ERUQpLCBpdCBpcyByZXNldCB0b1xuICogUE9TU0lCTEUgdG8gZ2l2ZSBpdCBhbm90aGVyIGNoYW5nZSBvbiB0aGUgbmV4dCBjeWNsZS5cbiAqXG4gKiAgICAgICAgICAgICAgIFBvc3NpYmxlXG4gKiAgICAgICAgICAgICAgICAgIHxcbiAqICAgICAgICAgICAgKy0tLS0tKy0tLS0tLS0tLS0tLS0tLStcbiAqICAgICAgICAgICAgfCAgICAgICAgICAgICAgICAgICAgIHxcbiAqICAgICAgKy0tLS0tKy0tLS0tKyAgICAgICAgICAgICAgIHxcbiAqICAgICAgfCAgICAgICAgICAgfCAgICAgICAgICAgICAgIHxcbiAqICAgRmFpbGVkICAgICAgQ2FuY2VsbGVkICAgICAgICAgIHxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICArLS0tLS0tLSstLS0tLS0rXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICAgfFxuICogICAgICAgICAgICAgICAgICAgICAgUmVjb2duaXplZCAgICAgICBCZWdhblxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDaGFuZ2VkXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRW5kZWQvUmVjb2duaXplZFxuICovXG52YXIgU1RBVEVfUE9TU0lCTEUgPSAxO1xudmFyIFNUQVRFX0JFR0FOID0gMjtcbnZhciBTVEFURV9DSEFOR0VEID0gNDtcbnZhciBTVEFURV9FTkRFRCA9IDg7XG52YXIgU1RBVEVfUkVDT0dOSVpFRCA9IFNUQVRFX0VOREVEO1xudmFyIFNUQVRFX0NBTkNFTExFRCA9IDE2O1xudmFyIFNUQVRFX0ZBSUxFRCA9IDMyO1xuXG4vKipcbiAqIFJlY29nbml6ZXJcbiAqIEV2ZXJ5IHJlY29nbml6ZXIgbmVlZHMgdG8gZXh0ZW5kIGZyb20gdGhpcyBjbGFzcy5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqL1xuZnVuY3Rpb24gUmVjb2duaXplcihvcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gYXNzaWduKHt9LCB0aGlzLmRlZmF1bHRzLCBvcHRpb25zIHx8IHt9KTtcblxuICAgIHRoaXMuaWQgPSB1bmlxdWVJZCgpO1xuXG4gICAgdGhpcy5tYW5hZ2VyID0gbnVsbDtcblxuICAgIC8vIGRlZmF1bHQgaXMgZW5hYmxlIHRydWVcbiAgICB0aGlzLm9wdGlvbnMuZW5hYmxlID0gaWZVbmRlZmluZWQodGhpcy5vcHRpb25zLmVuYWJsZSwgdHJ1ZSk7XG5cbiAgICB0aGlzLnN0YXRlID0gU1RBVEVfUE9TU0lCTEU7XG5cbiAgICB0aGlzLnNpbXVsdGFuZW91cyA9IHt9O1xuICAgIHRoaXMucmVxdWlyZUZhaWwgPSBbXTtcbn1cblxuUmVjb2duaXplci5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogQHZpcnR1YWxcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7fSxcblxuICAgIC8qKlxuICAgICAqIHNldCBvcHRpb25zXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICAgKiBAcmV0dXJuIHtSZWNvZ25pemVyfVxuICAgICAqL1xuICAgIHNldDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICBhc3NpZ24odGhpcy5vcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAvLyBhbHNvIHVwZGF0ZSB0aGUgdG91Y2hBY3Rpb24sIGluIGNhc2Ugc29tZXRoaW5nIGNoYW5nZWQgYWJvdXQgdGhlIGRpcmVjdGlvbnMvZW5hYmxlZCBzdGF0ZVxuICAgICAgICB0aGlzLm1hbmFnZXIgJiYgdGhpcy5tYW5hZ2VyLnRvdWNoQWN0aW9uLnVwZGF0ZSgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogcmVjb2duaXplIHNpbXVsdGFuZW91cyB3aXRoIGFuIG90aGVyIHJlY29nbml6ZXIuXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfSBvdGhlclJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7UmVjb2duaXplcn0gdGhpc1xuICAgICAqL1xuICAgIHJlY29nbml6ZVdpdGg6IGZ1bmN0aW9uKG90aGVyUmVjb2duaXplcikge1xuICAgICAgICBpZiAoaW52b2tlQXJyYXlBcmcob3RoZXJSZWNvZ25pemVyLCAncmVjb2duaXplV2l0aCcsIHRoaXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzaW11bHRhbmVvdXMgPSB0aGlzLnNpbXVsdGFuZW91cztcbiAgICAgICAgb3RoZXJSZWNvZ25pemVyID0gZ2V0UmVjb2duaXplckJ5TmFtZUlmTWFuYWdlcihvdGhlclJlY29nbml6ZXIsIHRoaXMpO1xuICAgICAgICBpZiAoIXNpbXVsdGFuZW91c1tvdGhlclJlY29nbml6ZXIuaWRdKSB7XG4gICAgICAgICAgICBzaW11bHRhbmVvdXNbb3RoZXJSZWNvZ25pemVyLmlkXSA9IG90aGVyUmVjb2duaXplcjtcbiAgICAgICAgICAgIG90aGVyUmVjb2duaXplci5yZWNvZ25pemVXaXRoKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBkcm9wIHRoZSBzaW11bHRhbmVvdXMgbGluay4gaXQgZG9lc250IHJlbW92ZSB0aGUgbGluayBvbiB0aGUgb3RoZXIgcmVjb2duaXplci5cbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ9IG90aGVyUmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfSB0aGlzXG4gICAgICovXG4gICAgZHJvcFJlY29nbml6ZVdpdGg6IGZ1bmN0aW9uKG90aGVyUmVjb2duaXplcikge1xuICAgICAgICBpZiAoaW52b2tlQXJyYXlBcmcob3RoZXJSZWNvZ25pemVyLCAnZHJvcFJlY29nbml6ZVdpdGgnLCB0aGlzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBvdGhlclJlY29nbml6ZXIgPSBnZXRSZWNvZ25pemVyQnlOYW1lSWZNYW5hZ2VyKG90aGVyUmVjb2duaXplciwgdGhpcyk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnNpbXVsdGFuZW91c1tvdGhlclJlY29nbml6ZXIuaWRdO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogcmVjb2duaXplciBjYW4gb25seSBydW4gd2hlbiBhbiBvdGhlciBpcyBmYWlsaW5nXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfSBvdGhlclJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7UmVjb2duaXplcn0gdGhpc1xuICAgICAqL1xuICAgIHJlcXVpcmVGYWlsdXJlOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKG90aGVyUmVjb2duaXplciwgJ3JlcXVpcmVGYWlsdXJlJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlcXVpcmVGYWlsID0gdGhpcy5yZXF1aXJlRmFpbDtcbiAgICAgICAgb3RoZXJSZWNvZ25pemVyID0gZ2V0UmVjb2duaXplckJ5TmFtZUlmTWFuYWdlcihvdGhlclJlY29nbml6ZXIsIHRoaXMpO1xuICAgICAgICBpZiAoaW5BcnJheShyZXF1aXJlRmFpbCwgb3RoZXJSZWNvZ25pemVyKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJlcXVpcmVGYWlsLnB1c2gob3RoZXJSZWNvZ25pemVyKTtcbiAgICAgICAgICAgIG90aGVyUmVjb2duaXplci5yZXF1aXJlRmFpbHVyZSh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZHJvcCB0aGUgcmVxdWlyZUZhaWx1cmUgbGluay4gaXQgZG9lcyBub3QgcmVtb3ZlIHRoZSBsaW5rIG9uIHRoZSBvdGhlciByZWNvZ25pemVyLlxuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gb3RoZXJSZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge1JlY29nbml6ZXJ9IHRoaXNcbiAgICAgKi9cbiAgICBkcm9wUmVxdWlyZUZhaWx1cmU6IGZ1bmN0aW9uKG90aGVyUmVjb2duaXplcikge1xuICAgICAgICBpZiAoaW52b2tlQXJyYXlBcmcob3RoZXJSZWNvZ25pemVyLCAnZHJvcFJlcXVpcmVGYWlsdXJlJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgb3RoZXJSZWNvZ25pemVyID0gZ2V0UmVjb2duaXplckJ5TmFtZUlmTWFuYWdlcihvdGhlclJlY29nbml6ZXIsIHRoaXMpO1xuICAgICAgICB2YXIgaW5kZXggPSBpbkFycmF5KHRoaXMucmVxdWlyZUZhaWwsIG90aGVyUmVjb2duaXplcik7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICB0aGlzLnJlcXVpcmVGYWlsLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGhhcyByZXF1aXJlIGZhaWx1cmVzIGJvb2xlYW5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBoYXNSZXF1aXJlRmFpbHVyZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZXF1aXJlRmFpbC5sZW5ndGggPiAwO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBpZiB0aGUgcmVjb2duaXplciBjYW4gcmVjb2duaXplIHNpbXVsdGFuZW91cyB3aXRoIGFuIG90aGVyIHJlY29nbml6ZXJcbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ9IG90aGVyUmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgICAqL1xuICAgIGNhblJlY29nbml6ZVdpdGg6IGZ1bmN0aW9uKG90aGVyUmVjb2duaXplcikge1xuICAgICAgICByZXR1cm4gISF0aGlzLnNpbXVsdGFuZW91c1tvdGhlclJlY29nbml6ZXIuaWRdO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBZb3Ugc2hvdWxkIHVzZSBgdHJ5RW1pdGAgaW5zdGVhZCBvZiBgZW1pdGAgZGlyZWN0bHkgdG8gY2hlY2tcbiAgICAgKiB0aGF0IGFsbCB0aGUgbmVlZGVkIHJlY29nbml6ZXJzIGhhcyBmYWlsZWQgYmVmb3JlIGVtaXR0aW5nLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICAgICAqL1xuICAgIGVtaXQ6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHN0YXRlID0gdGhpcy5zdGF0ZTtcblxuICAgICAgICBmdW5jdGlvbiBlbWl0KGV2ZW50KSB7XG4gICAgICAgICAgICBzZWxmLm1hbmFnZXIuZW1pdChldmVudCwgaW5wdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gJ3BhbnN0YXJ0JyBhbmQgJ3Bhbm1vdmUnXG4gICAgICAgIGlmIChzdGF0ZSA8IFNUQVRFX0VOREVEKSB7XG4gICAgICAgICAgICBlbWl0KHNlbGYub3B0aW9ucy5ldmVudCArIHN0YXRlU3RyKHN0YXRlKSk7XG4gICAgICAgIH1cblxuICAgICAgICBlbWl0KHNlbGYub3B0aW9ucy5ldmVudCk7IC8vIHNpbXBsZSAnZXZlbnROYW1lJyBldmVudHNcblxuICAgICAgICBpZiAoaW5wdXQuYWRkaXRpb25hbEV2ZW50KSB7IC8vIGFkZGl0aW9uYWwgZXZlbnQocGFubGVmdCwgcGFucmlnaHQsIHBpbmNoaW4sIHBpbmNob3V0Li4uKVxuICAgICAgICAgICAgZW1pdChpbnB1dC5hZGRpdGlvbmFsRXZlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcGFuZW5kIGFuZCBwYW5jYW5jZWxcbiAgICAgICAgaWYgKHN0YXRlID49IFNUQVRFX0VOREVEKSB7XG4gICAgICAgICAgICBlbWl0KHNlbGYub3B0aW9ucy5ldmVudCArIHN0YXRlU3RyKHN0YXRlKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgdGhhdCBhbGwgdGhlIHJlcXVpcmUgZmFpbHVyZSByZWNvZ25pemVycyBoYXMgZmFpbGVkLFxuICAgICAqIGlmIHRydWUsIGl0IGVtaXRzIGEgZ2VzdHVyZSBldmVudCxcbiAgICAgKiBvdGhlcndpc2UsIHNldHVwIHRoZSBzdGF0ZSB0byBGQUlMRUQuXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlucHV0XG4gICAgICovXG4gICAgdHJ5RW1pdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgaWYgKHRoaXMuY2FuRW1pdCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lbWl0KGlucHV0KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBpdCdzIGZhaWxpbmcgYW55d2F5XG4gICAgICAgIHRoaXMuc3RhdGUgPSBTVEFURV9GQUlMRUQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGNhbiB3ZSBlbWl0P1xuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIGNhbkVtaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5yZXF1aXJlRmFpbC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmICghKHRoaXMucmVxdWlyZUZhaWxbaV0uc3RhdGUgJiAoU1RBVEVfRkFJTEVEIHwgU1RBVEVfUE9TU0lCTEUpKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogdXBkYXRlIHRoZSByZWNvZ25pemVyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlucHV0RGF0YVxuICAgICAqL1xuICAgIHJlY29nbml6ZTogZnVuY3Rpb24oaW5wdXREYXRhKSB7XG4gICAgICAgIC8vIG1ha2UgYSBuZXcgY29weSBvZiB0aGUgaW5wdXREYXRhXG4gICAgICAgIC8vIHNvIHdlIGNhbiBjaGFuZ2UgdGhlIGlucHV0RGF0YSB3aXRob3V0IG1lc3NpbmcgdXAgdGhlIG90aGVyIHJlY29nbml6ZXJzXG4gICAgICAgIHZhciBpbnB1dERhdGFDbG9uZSA9IGFzc2lnbih7fSwgaW5wdXREYXRhKTtcblxuICAgICAgICAvLyBpcyBpcyBlbmFibGVkIGFuZCBhbGxvdyByZWNvZ25pemluZz9cbiAgICAgICAgaWYgKCFib29sT3JGbih0aGlzLm9wdGlvbnMuZW5hYmxlLCBbdGhpcywgaW5wdXREYXRhQ2xvbmVdKSkge1xuICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFNUQVRFX0ZBSUxFRDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlc2V0IHdoZW4gd2UndmUgcmVhY2hlZCB0aGUgZW5kXG4gICAgICAgIGlmICh0aGlzLnN0YXRlICYgKFNUQVRFX1JFQ09HTklaRUQgfCBTVEFURV9DQU5DRUxMRUQgfCBTVEFURV9GQUlMRUQpKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfUE9TU0lCTEU7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0YXRlID0gdGhpcy5wcm9jZXNzKGlucHV0RGF0YUNsb25lKTtcblxuICAgICAgICAvLyB0aGUgcmVjb2duaXplciBoYXMgcmVjb2duaXplZCBhIGdlc3R1cmVcbiAgICAgICAgLy8gc28gdHJpZ2dlciBhbiBldmVudFxuICAgICAgICBpZiAodGhpcy5zdGF0ZSAmIChTVEFURV9CRUdBTiB8IFNUQVRFX0NIQU5HRUQgfCBTVEFURV9FTkRFRCB8IFNUQVRFX0NBTkNFTExFRCkpIHtcbiAgICAgICAgICAgIHRoaXMudHJ5RW1pdChpbnB1dERhdGFDbG9uZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogcmV0dXJuIHRoZSBzdGF0ZSBvZiB0aGUgcmVjb2duaXplclxuICAgICAqIHRoZSBhY3R1YWwgcmVjb2duaXppbmcgaGFwcGVucyBpbiB0aGlzIG1ldGhvZFxuICAgICAqIEB2aXJ0dWFsXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlucHV0RGF0YVxuICAgICAqIEByZXR1cm5zIHtDb25zdH0gU1RBVEVcbiAgICAgKi9cbiAgICBwcm9jZXNzOiBmdW5jdGlvbihpbnB1dERhdGEpIHsgfSwgLy8ganNoaW50IGlnbm9yZTpsaW5lXG5cbiAgICAvKipcbiAgICAgKiByZXR1cm4gdGhlIHByZWZlcnJlZCB0b3VjaC1hY3Rpb25cbiAgICAgKiBAdmlydHVhbFxuICAgICAqIEByZXR1cm5zIHtBcnJheX1cbiAgICAgKi9cbiAgICBnZXRUb3VjaEFjdGlvbjogZnVuY3Rpb24oKSB7IH0sXG5cbiAgICAvKipcbiAgICAgKiBjYWxsZWQgd2hlbiB0aGUgZ2VzdHVyZSBpc24ndCBhbGxvd2VkIHRvIHJlY29nbml6ZVxuICAgICAqIGxpa2Ugd2hlbiBhbm90aGVyIGlzIGJlaW5nIHJlY29nbml6ZWQgb3IgaXQgaXMgZGlzYWJsZWRcbiAgICAgKiBAdmlydHVhbFxuICAgICAqL1xuICAgIHJlc2V0OiBmdW5jdGlvbigpIHsgfVxufTtcblxuLyoqXG4gKiBnZXQgYSB1c2FibGUgc3RyaW5nLCB1c2VkIGFzIGV2ZW50IHBvc3RmaXhcbiAqIEBwYXJhbSB7Q29uc3R9IHN0YXRlXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBzdGF0ZVxuICovXG5mdW5jdGlvbiBzdGF0ZVN0cihzdGF0ZSkge1xuICAgIGlmIChzdGF0ZSAmIFNUQVRFX0NBTkNFTExFRCkge1xuICAgICAgICByZXR1cm4gJ2NhbmNlbCc7XG4gICAgfSBlbHNlIGlmIChzdGF0ZSAmIFNUQVRFX0VOREVEKSB7XG4gICAgICAgIHJldHVybiAnZW5kJztcbiAgICB9IGVsc2UgaWYgKHN0YXRlICYgU1RBVEVfQ0hBTkdFRCkge1xuICAgICAgICByZXR1cm4gJ21vdmUnO1xuICAgIH0gZWxzZSBpZiAoc3RhdGUgJiBTVEFURV9CRUdBTikge1xuICAgICAgICByZXR1cm4gJ3N0YXJ0JztcbiAgICB9XG4gICAgcmV0dXJuICcnO1xufVxuXG4vKipcbiAqIGRpcmVjdGlvbiBjb25zIHRvIHN0cmluZ1xuICogQHBhcmFtIHtDb25zdH0gZGlyZWN0aW9uXG4gKiBAcmV0dXJucyB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBkaXJlY3Rpb25TdHIoZGlyZWN0aW9uKSB7XG4gICAgaWYgKGRpcmVjdGlvbiA9PSBESVJFQ1RJT05fRE9XTikge1xuICAgICAgICByZXR1cm4gJ2Rvd24nO1xuICAgIH0gZWxzZSBpZiAoZGlyZWN0aW9uID09IERJUkVDVElPTl9VUCkge1xuICAgICAgICByZXR1cm4gJ3VwJztcbiAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiA9PSBESVJFQ1RJT05fTEVGVCkge1xuICAgICAgICByZXR1cm4gJ2xlZnQnO1xuICAgIH0gZWxzZSBpZiAoZGlyZWN0aW9uID09IERJUkVDVElPTl9SSUdIVCkge1xuICAgICAgICByZXR1cm4gJ3JpZ2h0JztcbiAgICB9XG4gICAgcmV0dXJuICcnO1xufVxuXG4vKipcbiAqIGdldCBhIHJlY29nbml6ZXIgYnkgbmFtZSBpZiBpdCBpcyBib3VuZCB0byBhIG1hbmFnZXJcbiAqIEBwYXJhbSB7UmVjb2duaXplcnxTdHJpbmd9IG90aGVyUmVjb2duaXplclxuICogQHBhcmFtIHtSZWNvZ25pemVyfSByZWNvZ25pemVyXG4gKiBAcmV0dXJucyB7UmVjb2duaXplcn1cbiAqL1xuZnVuY3Rpb24gZ2V0UmVjb2duaXplckJ5TmFtZUlmTWFuYWdlcihvdGhlclJlY29nbml6ZXIsIHJlY29nbml6ZXIpIHtcbiAgICB2YXIgbWFuYWdlciA9IHJlY29nbml6ZXIubWFuYWdlcjtcbiAgICBpZiAobWFuYWdlcikge1xuICAgICAgICByZXR1cm4gbWFuYWdlci5nZXQob3RoZXJSZWNvZ25pemVyKTtcbiAgICB9XG4gICAgcmV0dXJuIG90aGVyUmVjb2duaXplcjtcbn1cblxuLyoqXG4gKiBUaGlzIHJlY29nbml6ZXIgaXMganVzdCB1c2VkIGFzIGEgYmFzZSBmb3IgdGhlIHNpbXBsZSBhdHRyaWJ1dGUgcmVjb2duaXplcnMuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIFJlY29nbml6ZXJcbiAqL1xuZnVuY3Rpb24gQXR0clJlY29nbml6ZXIoKSB7XG4gICAgUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KEF0dHJSZWNvZ25pemVyLCBSZWNvZ25pemVyLCB7XG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBBdHRyUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgKiBAZGVmYXVsdCAxXG4gICAgICAgICAqL1xuICAgICAgICBwb2ludGVyczogMVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVc2VkIHRvIGNoZWNrIGlmIGl0IHRoZSByZWNvZ25pemVyIHJlY2VpdmVzIHZhbGlkIGlucHV0LCBsaWtlIGlucHV0LmRpc3RhbmNlID4gMTAuXG4gICAgICogQG1lbWJlcm9mIEF0dHJSZWNvZ25pemVyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlucHV0XG4gICAgICogQHJldHVybnMge0Jvb2xlYW59IHJlY29nbml6ZWRcbiAgICAgKi9cbiAgICBhdHRyVGVzdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIG9wdGlvblBvaW50ZXJzID0gdGhpcy5vcHRpb25zLnBvaW50ZXJzO1xuICAgICAgICByZXR1cm4gb3B0aW9uUG9pbnRlcnMgPT09IDAgfHwgaW5wdXQucG9pbnRlcnMubGVuZ3RoID09PSBvcHRpb25Qb2ludGVycztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHJvY2VzcyB0aGUgaW5wdXQgYW5kIHJldHVybiB0aGUgc3RhdGUgZm9yIHRoZSByZWNvZ25pemVyXG4gICAgICogQG1lbWJlcm9mIEF0dHJSZWNvZ25pemVyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlucHV0XG4gICAgICogQHJldHVybnMgeyp9IFN0YXRlXG4gICAgICovXG4gICAgcHJvY2VzczogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIHN0YXRlID0gdGhpcy5zdGF0ZTtcbiAgICAgICAgdmFyIGV2ZW50VHlwZSA9IGlucHV0LmV2ZW50VHlwZTtcblxuICAgICAgICB2YXIgaXNSZWNvZ25pemVkID0gc3RhdGUgJiAoU1RBVEVfQkVHQU4gfCBTVEFURV9DSEFOR0VEKTtcbiAgICAgICAgdmFyIGlzVmFsaWQgPSB0aGlzLmF0dHJUZXN0KGlucHV0KTtcblxuICAgICAgICAvLyBvbiBjYW5jZWwgaW5wdXQgYW5kIHdlJ3ZlIHJlY29nbml6ZWQgYmVmb3JlLCByZXR1cm4gU1RBVEVfQ0FOQ0VMTEVEXG4gICAgICAgIGlmIChpc1JlY29nbml6ZWQgJiYgKGV2ZW50VHlwZSAmIElOUFVUX0NBTkNFTCB8fCAhaXNWYWxpZCkpIHtcbiAgICAgICAgICAgIHJldHVybiBzdGF0ZSB8IFNUQVRFX0NBTkNFTExFRDtcbiAgICAgICAgfSBlbHNlIGlmIChpc1JlY29nbml6ZWQgfHwgaXNWYWxpZCkge1xuICAgICAgICAgICAgaWYgKGV2ZW50VHlwZSAmIElOUFVUX0VORCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZSB8IFNUQVRFX0VOREVEO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghKHN0YXRlICYgU1RBVEVfQkVHQU4pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFNUQVRFX0JFR0FOO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0YXRlIHwgU1RBVEVfQ0hBTkdFRDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU1RBVEVfRkFJTEVEO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIFBhblxuICogUmVjb2duaXplZCB3aGVuIHRoZSBwb2ludGVyIGlzIGRvd24gYW5kIG1vdmVkIGluIHRoZSBhbGxvd2VkIGRpcmVjdGlvbi5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgQXR0clJlY29nbml6ZXJcbiAqL1xuZnVuY3Rpb24gUGFuUmVjb2duaXplcigpIHtcbiAgICBBdHRyUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5wWCA9IG51bGw7XG4gICAgdGhpcy5wWSA9IG51bGw7XG59XG5cbmluaGVyaXQoUGFuUmVjb2duaXplciwgQXR0clJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFBhblJlY29nbml6ZXJcbiAgICAgKi9cbiAgICBkZWZhdWx0czoge1xuICAgICAgICBldmVudDogJ3BhbicsXG4gICAgICAgIHRocmVzaG9sZDogMTAsXG4gICAgICAgIHBvaW50ZXJzOiAxLFxuICAgICAgICBkaXJlY3Rpb246IERJUkVDVElPTl9BTExcbiAgICB9LFxuXG4gICAgZ2V0VG91Y2hBY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gdGhpcy5vcHRpb25zLmRpcmVjdGlvbjtcbiAgICAgICAgdmFyIGFjdGlvbnMgPSBbXTtcbiAgICAgICAgaWYgKGRpcmVjdGlvbiAmIERJUkVDVElPTl9IT1JJWk9OVEFMKSB7XG4gICAgICAgICAgICBhY3Rpb25zLnB1c2goVE9VQ0hfQUNUSU9OX1BBTl9ZKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGlyZWN0aW9uICYgRElSRUNUSU9OX1ZFUlRJQ0FMKSB7XG4gICAgICAgICAgICBhY3Rpb25zLnB1c2goVE9VQ0hfQUNUSU9OX1BBTl9YKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWN0aW9ucztcbiAgICB9LFxuXG4gICAgZGlyZWN0aW9uVGVzdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICAgIHZhciBoYXNNb3ZlZCA9IHRydWU7XG4gICAgICAgIHZhciBkaXN0YW5jZSA9IGlucHV0LmRpc3RhbmNlO1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gaW5wdXQuZGlyZWN0aW9uO1xuICAgICAgICB2YXIgeCA9IGlucHV0LmRlbHRhWDtcbiAgICAgICAgdmFyIHkgPSBpbnB1dC5kZWx0YVk7XG5cbiAgICAgICAgLy8gbG9jayB0byBheGlzP1xuICAgICAgICBpZiAoIShkaXJlY3Rpb24gJiBvcHRpb25zLmRpcmVjdGlvbikpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmRpcmVjdGlvbiAmIERJUkVDVElPTl9IT1JJWk9OVEFMKSB7XG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gKHggPT09IDApID8gRElSRUNUSU9OX05PTkUgOiAoeCA8IDApID8gRElSRUNUSU9OX0xFRlQgOiBESVJFQ1RJT05fUklHSFQ7XG4gICAgICAgICAgICAgICAgaGFzTW92ZWQgPSB4ICE9IHRoaXMucFg7XG4gICAgICAgICAgICAgICAgZGlzdGFuY2UgPSBNYXRoLmFicyhpbnB1dC5kZWx0YVgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSAoeSA9PT0gMCkgPyBESVJFQ1RJT05fTk9ORSA6ICh5IDwgMCkgPyBESVJFQ1RJT05fVVAgOiBESVJFQ1RJT05fRE9XTjtcbiAgICAgICAgICAgICAgICBoYXNNb3ZlZCA9IHkgIT0gdGhpcy5wWTtcbiAgICAgICAgICAgICAgICBkaXN0YW5jZSA9IE1hdGguYWJzKGlucHV0LmRlbHRhWSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaW5wdXQuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuICAgICAgICByZXR1cm4gaGFzTW92ZWQgJiYgZGlzdGFuY2UgPiBvcHRpb25zLnRocmVzaG9sZCAmJiBkaXJlY3Rpb24gJiBvcHRpb25zLmRpcmVjdGlvbjtcbiAgICB9LFxuXG4gICAgYXR0clRlc3Q6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBBdHRyUmVjb2duaXplci5wcm90b3R5cGUuYXR0clRlc3QuY2FsbCh0aGlzLCBpbnB1dCkgJiZcbiAgICAgICAgICAgICh0aGlzLnN0YXRlICYgU1RBVEVfQkVHQU4gfHwgKCEodGhpcy5zdGF0ZSAmIFNUQVRFX0JFR0FOKSAmJiB0aGlzLmRpcmVjdGlvblRlc3QoaW5wdXQpKSk7XG4gICAgfSxcblxuICAgIGVtaXQ6IGZ1bmN0aW9uKGlucHV0KSB7XG5cbiAgICAgICAgdGhpcy5wWCA9IGlucHV0LmRlbHRhWDtcbiAgICAgICAgdGhpcy5wWSA9IGlucHV0LmRlbHRhWTtcblxuICAgICAgICB2YXIgZGlyZWN0aW9uID0gZGlyZWN0aW9uU3RyKGlucHV0LmRpcmVjdGlvbik7XG5cbiAgICAgICAgaWYgKGRpcmVjdGlvbikge1xuICAgICAgICAgICAgaW5wdXQuYWRkaXRpb25hbEV2ZW50ID0gdGhpcy5vcHRpb25zLmV2ZW50ICsgZGlyZWN0aW9uO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3N1cGVyLmVtaXQuY2FsbCh0aGlzLCBpbnB1dCk7XG4gICAgfVxufSk7XG5cbi8qKlxuICogUGluY2hcbiAqIFJlY29nbml6ZWQgd2hlbiB0d28gb3IgbW9yZSBwb2ludGVycyBhcmUgbW92aW5nIHRvd2FyZCAoem9vbS1pbikgb3IgYXdheSBmcm9tIGVhY2ggb3RoZXIgKHpvb20tb3V0KS5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgQXR0clJlY29nbml6ZXJcbiAqL1xuZnVuY3Rpb24gUGluY2hSZWNvZ25pemVyKCkge1xuICAgIEF0dHJSZWNvZ25pemVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5cbmluaGVyaXQoUGluY2hSZWNvZ25pemVyLCBBdHRyUmVjb2duaXplciwge1xuICAgIC8qKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgUGluY2hSZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICdwaW5jaCcsXG4gICAgICAgIHRocmVzaG9sZDogMCxcbiAgICAgICAgcG9pbnRlcnM6IDJcbiAgICB9LFxuXG4gICAgZ2V0VG91Y2hBY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gW1RPVUNIX0FDVElPTl9OT05FXTtcbiAgICB9LFxuXG4gICAgYXR0clRlc3Q6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdXBlci5hdHRyVGVzdC5jYWxsKHRoaXMsIGlucHV0KSAmJlxuICAgICAgICAgICAgKE1hdGguYWJzKGlucHV0LnNjYWxlIC0gMSkgPiB0aGlzLm9wdGlvbnMudGhyZXNob2xkIHx8IHRoaXMuc3RhdGUgJiBTVEFURV9CRUdBTik7XG4gICAgfSxcblxuICAgIGVtaXQ6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIGlmIChpbnB1dC5zY2FsZSAhPT0gMSkge1xuICAgICAgICAgICAgdmFyIGluT3V0ID0gaW5wdXQuc2NhbGUgPCAxID8gJ2luJyA6ICdvdXQnO1xuICAgICAgICAgICAgaW5wdXQuYWRkaXRpb25hbEV2ZW50ID0gdGhpcy5vcHRpb25zLmV2ZW50ICsgaW5PdXQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc3VwZXIuZW1pdC5jYWxsKHRoaXMsIGlucHV0KTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBQcmVzc1xuICogUmVjb2duaXplZCB3aGVuIHRoZSBwb2ludGVyIGlzIGRvd24gZm9yIHggbXMgd2l0aG91dCBhbnkgbW92ZW1lbnQuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIFJlY29nbml6ZXJcbiAqL1xuZnVuY3Rpb24gUHJlc3NSZWNvZ25pemVyKCkge1xuICAgIFJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMuX3RpbWVyID0gbnVsbDtcbiAgICB0aGlzLl9pbnB1dCA9IG51bGw7XG59XG5cbmluaGVyaXQoUHJlc3NSZWNvZ25pemVyLCBSZWNvZ25pemVyLCB7XG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBQcmVzc1JlY29nbml6ZXJcbiAgICAgKi9cbiAgICBkZWZhdWx0czoge1xuICAgICAgICBldmVudDogJ3ByZXNzJyxcbiAgICAgICAgcG9pbnRlcnM6IDEsXG4gICAgICAgIHRpbWU6IDI1MSwgLy8gbWluaW1hbCB0aW1lIG9mIHRoZSBwb2ludGVyIHRvIGJlIHByZXNzZWRcbiAgICAgICAgdGhyZXNob2xkOiA5IC8vIGEgbWluaW1hbCBtb3ZlbWVudCBpcyBvaywgYnV0IGtlZXAgaXQgbG93XG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFtUT1VDSF9BQ1RJT05fQVVUT107XG4gICAgfSxcblxuICAgIHByb2Nlc3M6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgICB2YXIgdmFsaWRQb2ludGVycyA9IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA9PT0gb3B0aW9ucy5wb2ludGVycztcbiAgICAgICAgdmFyIHZhbGlkTW92ZW1lbnQgPSBpbnB1dC5kaXN0YW5jZSA8IG9wdGlvbnMudGhyZXNob2xkO1xuICAgICAgICB2YXIgdmFsaWRUaW1lID0gaW5wdXQuZGVsdGFUaW1lID4gb3B0aW9ucy50aW1lO1xuXG4gICAgICAgIHRoaXMuX2lucHV0ID0gaW5wdXQ7XG5cbiAgICAgICAgLy8gd2Ugb25seSBhbGxvdyBsaXR0bGUgbW92ZW1lbnRcbiAgICAgICAgLy8gYW5kIHdlJ3ZlIHJlYWNoZWQgYW4gZW5kIGV2ZW50LCBzbyBhIHRhcCBpcyBwb3NzaWJsZVxuICAgICAgICBpZiAoIXZhbGlkTW92ZW1lbnQgfHwgIXZhbGlkUG9pbnRlcnMgfHwgKGlucHV0LmV2ZW50VHlwZSAmIChJTlBVVF9FTkQgfCBJTlBVVF9DQU5DRUwpICYmICF2YWxpZFRpbWUpKSB7XG4gICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5wdXQuZXZlbnRUeXBlICYgSU5QVVRfU1RBUlQpIHtcbiAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgICAgIHRoaXMuX3RpbWVyID0gc2V0VGltZW91dENvbnRleHQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFNUQVRFX1JFQ09HTklaRUQ7XG4gICAgICAgICAgICAgICAgdGhpcy50cnlFbWl0KCk7XG4gICAgICAgICAgICB9LCBvcHRpb25zLnRpbWUsIHRoaXMpO1xuICAgICAgICB9IGVsc2UgaWYgKGlucHV0LmV2ZW50VHlwZSAmIElOUFVUX0VORCkge1xuICAgICAgICAgICAgcmV0dXJuIFNUQVRFX1JFQ09HTklaRUQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFNUQVRFX0ZBSUxFRDtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fdGltZXIpO1xuICAgIH0sXG5cbiAgICBlbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPT0gU1RBVEVfUkVDT0dOSVpFRCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlucHV0ICYmIChpbnB1dC5ldmVudFR5cGUgJiBJTlBVVF9FTkQpKSB7XG4gICAgICAgICAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm9wdGlvbnMuZXZlbnQgKyAndXAnLCBpbnB1dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9pbnB1dC50aW1lU3RhbXAgPSBub3coKTtcbiAgICAgICAgICAgIHRoaXMubWFuYWdlci5lbWl0KHRoaXMub3B0aW9ucy5ldmVudCwgdGhpcy5faW5wdXQpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbi8qKlxuICogUm90YXRlXG4gKiBSZWNvZ25pemVkIHdoZW4gdHdvIG9yIG1vcmUgcG9pbnRlciBhcmUgbW92aW5nIGluIGEgY2lyY3VsYXIgbW90aW9uLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBBdHRyUmVjb2duaXplclxuICovXG5mdW5jdGlvbiBSb3RhdGVSZWNvZ25pemVyKCkge1xuICAgIEF0dHJSZWNvZ25pemVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5cbmluaGVyaXQoUm90YXRlUmVjb2duaXplciwgQXR0clJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFJvdGF0ZVJlY29nbml6ZXJcbiAgICAgKi9cbiAgICBkZWZhdWx0czoge1xuICAgICAgICBldmVudDogJ3JvdGF0ZScsXG4gICAgICAgIHRocmVzaG9sZDogMCxcbiAgICAgICAgcG9pbnRlcnM6IDJcbiAgICB9LFxuXG4gICAgZ2V0VG91Y2hBY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gW1RPVUNIX0FDVElPTl9OT05FXTtcbiAgICB9LFxuXG4gICAgYXR0clRlc3Q6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdXBlci5hdHRyVGVzdC5jYWxsKHRoaXMsIGlucHV0KSAmJlxuICAgICAgICAgICAgKE1hdGguYWJzKGlucHV0LnJvdGF0aW9uKSA+IHRoaXMub3B0aW9ucy50aHJlc2hvbGQgfHwgdGhpcy5zdGF0ZSAmIFNUQVRFX0JFR0FOKTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBTd2lwZVxuICogUmVjb2duaXplZCB3aGVuIHRoZSBwb2ludGVyIGlzIG1vdmluZyBmYXN0ICh2ZWxvY2l0eSksIHdpdGggZW5vdWdoIGRpc3RhbmNlIGluIHRoZSBhbGxvd2VkIGRpcmVjdGlvbi5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgQXR0clJlY29nbml6ZXJcbiAqL1xuZnVuY3Rpb24gU3dpcGVSZWNvZ25pemVyKCkge1xuICAgIEF0dHJSZWNvZ25pemVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5cbmluaGVyaXQoU3dpcGVSZWNvZ25pemVyLCBBdHRyUmVjb2duaXplciwge1xuICAgIC8qKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgU3dpcGVSZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICdzd2lwZScsXG4gICAgICAgIHRocmVzaG9sZDogMTAsXG4gICAgICAgIHZlbG9jaXR5OiAwLjMsXG4gICAgICAgIGRpcmVjdGlvbjogRElSRUNUSU9OX0hPUklaT05UQUwgfCBESVJFQ1RJT05fVkVSVElDQUwsXG4gICAgICAgIHBvaW50ZXJzOiAxXG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFBhblJlY29nbml6ZXIucHJvdG90eXBlLmdldFRvdWNoQWN0aW9uLmNhbGwodGhpcyk7XG4gICAgfSxcblxuICAgIGF0dHJUZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gdGhpcy5vcHRpb25zLmRpcmVjdGlvbjtcbiAgICAgICAgdmFyIHZlbG9jaXR5O1xuXG4gICAgICAgIGlmIChkaXJlY3Rpb24gJiAoRElSRUNUSU9OX0hPUklaT05UQUwgfCBESVJFQ1RJT05fVkVSVElDQUwpKSB7XG4gICAgICAgICAgICB2ZWxvY2l0eSA9IGlucHV0Lm92ZXJhbGxWZWxvY2l0eTtcbiAgICAgICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gJiBESVJFQ1RJT05fSE9SSVpPTlRBTCkge1xuICAgICAgICAgICAgdmVsb2NpdHkgPSBpbnB1dC5vdmVyYWxsVmVsb2NpdHlYO1xuICAgICAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiAmIERJUkVDVElPTl9WRVJUSUNBTCkge1xuICAgICAgICAgICAgdmVsb2NpdHkgPSBpbnB1dC5vdmVyYWxsVmVsb2NpdHlZO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3N1cGVyLmF0dHJUZXN0LmNhbGwodGhpcywgaW5wdXQpICYmXG4gICAgICAgICAgICBkaXJlY3Rpb24gJiBpbnB1dC5vZmZzZXREaXJlY3Rpb24gJiZcbiAgICAgICAgICAgIGlucHV0LmRpc3RhbmNlID4gdGhpcy5vcHRpb25zLnRocmVzaG9sZCAmJlxuICAgICAgICAgICAgaW5wdXQubWF4UG9pbnRlcnMgPT0gdGhpcy5vcHRpb25zLnBvaW50ZXJzICYmXG4gICAgICAgICAgICBhYnModmVsb2NpdHkpID4gdGhpcy5vcHRpb25zLnZlbG9jaXR5ICYmIGlucHV0LmV2ZW50VHlwZSAmIElOUFVUX0VORDtcbiAgICB9LFxuXG4gICAgZW1pdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IGRpcmVjdGlvblN0cihpbnB1dC5vZmZzZXREaXJlY3Rpb24pO1xuICAgICAgICBpZiAoZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm9wdGlvbnMuZXZlbnQgKyBkaXJlY3Rpb24sIGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubWFuYWdlci5lbWl0KHRoaXMub3B0aW9ucy5ldmVudCwgaW5wdXQpO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIEEgdGFwIGlzIGVjb2duaXplZCB3aGVuIHRoZSBwb2ludGVyIGlzIGRvaW5nIGEgc21hbGwgdGFwL2NsaWNrLiBNdWx0aXBsZSB0YXBzIGFyZSByZWNvZ25pemVkIGlmIHRoZXkgb2NjdXJcbiAqIGJldHdlZW4gdGhlIGdpdmVuIGludGVydmFsIGFuZCBwb3NpdGlvbi4gVGhlIGRlbGF5IG9wdGlvbiBjYW4gYmUgdXNlZCB0byByZWNvZ25pemUgbXVsdGktdGFwcyB3aXRob3V0IGZpcmluZ1xuICogYSBzaW5nbGUgdGFwLlxuICpcbiAqIFRoZSBldmVudERhdGEgZnJvbSB0aGUgZW1pdHRlZCBldmVudCBjb250YWlucyB0aGUgcHJvcGVydHkgYHRhcENvdW50YCwgd2hpY2ggY29udGFpbnMgdGhlIGFtb3VudCBvZlxuICogbXVsdGktdGFwcyBiZWluZyByZWNvZ25pemVkLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFRhcFJlY29nbml6ZXIoKSB7XG4gICAgUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgLy8gcHJldmlvdXMgdGltZSBhbmQgY2VudGVyLFxuICAgIC8vIHVzZWQgZm9yIHRhcCBjb3VudGluZ1xuICAgIHRoaXMucFRpbWUgPSBmYWxzZTtcbiAgICB0aGlzLnBDZW50ZXIgPSBmYWxzZTtcblxuICAgIHRoaXMuX3RpbWVyID0gbnVsbDtcbiAgICB0aGlzLl9pbnB1dCA9IG51bGw7XG4gICAgdGhpcy5jb3VudCA9IDA7XG59XG5cbmluaGVyaXQoVGFwUmVjb2duaXplciwgUmVjb2duaXplciwge1xuICAgIC8qKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgUGluY2hSZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICd0YXAnLFxuICAgICAgICBwb2ludGVyczogMSxcbiAgICAgICAgdGFwczogMSxcbiAgICAgICAgaW50ZXJ2YWw6IDMwMCwgLy8gbWF4IHRpbWUgYmV0d2VlbiB0aGUgbXVsdGktdGFwIHRhcHNcbiAgICAgICAgdGltZTogMjUwLCAvLyBtYXggdGltZSBvZiB0aGUgcG9pbnRlciB0byBiZSBkb3duIChsaWtlIGZpbmdlciBvbiB0aGUgc2NyZWVuKVxuICAgICAgICB0aHJlc2hvbGQ6IDksIC8vIGEgbWluaW1hbCBtb3ZlbWVudCBpcyBvaywgYnV0IGtlZXAgaXQgbG93XG4gICAgICAgIHBvc1RocmVzaG9sZDogMTAgLy8gYSBtdWx0aS10YXAgY2FuIGJlIGEgYml0IG9mZiB0aGUgaW5pdGlhbCBwb3NpdGlvblxuICAgIH0sXG5cbiAgICBnZXRUb3VjaEFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBbVE9VQ0hfQUNUSU9OX01BTklQVUxBVElPTl07XG4gICAgfSxcblxuICAgIHByb2Nlc3M6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuXG4gICAgICAgIHZhciB2YWxpZFBvaW50ZXJzID0gaW5wdXQucG9pbnRlcnMubGVuZ3RoID09PSBvcHRpb25zLnBvaW50ZXJzO1xuICAgICAgICB2YXIgdmFsaWRNb3ZlbWVudCA9IGlucHV0LmRpc3RhbmNlIDwgb3B0aW9ucy50aHJlc2hvbGQ7XG4gICAgICAgIHZhciB2YWxpZFRvdWNoVGltZSA9IGlucHV0LmRlbHRhVGltZSA8IG9wdGlvbnMudGltZTtcblxuICAgICAgICB0aGlzLnJlc2V0KCk7XG5cbiAgICAgICAgaWYgKChpbnB1dC5ldmVudFR5cGUgJiBJTlBVVF9TVEFSVCkgJiYgKHRoaXMuY291bnQgPT09IDApKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mYWlsVGltZW91dCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gd2Ugb25seSBhbGxvdyBsaXR0bGUgbW92ZW1lbnRcbiAgICAgICAgLy8gYW5kIHdlJ3ZlIHJlYWNoZWQgYW4gZW5kIGV2ZW50LCBzbyBhIHRhcCBpcyBwb3NzaWJsZVxuICAgICAgICBpZiAodmFsaWRNb3ZlbWVudCAmJiB2YWxpZFRvdWNoVGltZSAmJiB2YWxpZFBvaW50ZXJzKSB7XG4gICAgICAgICAgICBpZiAoaW5wdXQuZXZlbnRUeXBlICE9IElOUFVUX0VORCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZhaWxUaW1lb3V0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB2YWxpZEludGVydmFsID0gdGhpcy5wVGltZSA/IChpbnB1dC50aW1lU3RhbXAgLSB0aGlzLnBUaW1lIDwgb3B0aW9ucy5pbnRlcnZhbCkgOiB0cnVlO1xuICAgICAgICAgICAgdmFyIHZhbGlkTXVsdGlUYXAgPSAhdGhpcy5wQ2VudGVyIHx8IGdldERpc3RhbmNlKHRoaXMucENlbnRlciwgaW5wdXQuY2VudGVyKSA8IG9wdGlvbnMucG9zVGhyZXNob2xkO1xuXG4gICAgICAgICAgICB0aGlzLnBUaW1lID0gaW5wdXQudGltZVN0YW1wO1xuICAgICAgICAgICAgdGhpcy5wQ2VudGVyID0gaW5wdXQuY2VudGVyO1xuXG4gICAgICAgICAgICBpZiAoIXZhbGlkTXVsdGlUYXAgfHwgIXZhbGlkSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvdW50ID0gMTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudCArPSAxO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9pbnB1dCA9IGlucHV0O1xuXG4gICAgICAgICAgICAvLyBpZiB0YXAgY291bnQgbWF0Y2hlcyB3ZSBoYXZlIHJlY29nbml6ZWQgaXQsXG4gICAgICAgICAgICAvLyBlbHNlIGl0IGhhcyBiZWdhbiByZWNvZ25pemluZy4uLlxuICAgICAgICAgICAgdmFyIHRhcENvdW50ID0gdGhpcy5jb3VudCAlIG9wdGlvbnMudGFwcztcbiAgICAgICAgICAgIGlmICh0YXBDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIC8vIG5vIGZhaWxpbmcgcmVxdWlyZW1lbnRzLCBpbW1lZGlhdGVseSB0cmlnZ2VyIHRoZSB0YXAgZXZlbnRcbiAgICAgICAgICAgICAgICAvLyBvciB3YWl0IGFzIGxvbmcgYXMgdGhlIG11bHRpdGFwIGludGVydmFsIHRvIHRyaWdnZXJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaGFzUmVxdWlyZUZhaWx1cmVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFNUQVRFX1JFQ09HTklaRUQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdGltZXIgPSBzZXRUaW1lb3V0Q29udGV4dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTVEFURV9SRUNPR05JWkVEO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cnlFbWl0KCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIG9wdGlvbnMuaW50ZXJ2YWwsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gU1RBVEVfQkVHQU47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTVEFURV9GQUlMRUQ7XG4gICAgfSxcblxuICAgIGZhaWxUaW1lb3V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fdGltZXIgPSBzZXRUaW1lb3V0Q29udGV4dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTVEFURV9GQUlMRUQ7XG4gICAgICAgIH0sIHRoaXMub3B0aW9ucy5pbnRlcnZhbCwgdGhpcyk7XG4gICAgICAgIHJldHVybiBTVEFURV9GQUlMRUQ7XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RpbWVyKTtcbiAgICB9LFxuXG4gICAgZW1pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlID09IFNUQVRFX1JFQ09HTklaRUQpIHtcbiAgICAgICAgICAgIHRoaXMuX2lucHV0LnRhcENvdW50ID0gdGhpcy5jb3VudDtcbiAgICAgICAgICAgIHRoaXMubWFuYWdlci5lbWl0KHRoaXMub3B0aW9ucy5ldmVudCwgdGhpcy5faW5wdXQpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5cbi8qKlxuICogU2ltcGxlIHdheSB0byBjcmVhdGUgYSBtYW5hZ2VyIHdpdGggYSBkZWZhdWx0IHNldCBvZiByZWNvZ25pemVycy5cbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBIYW1tZXIoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIG9wdGlvbnMucmVjb2duaXplcnMgPSBpZlVuZGVmaW5lZChvcHRpb25zLnJlY29nbml6ZXJzLCBIYW1tZXIuZGVmYXVsdHMucHJlc2V0KTtcbiAgICByZXR1cm4gbmV3IE1hbmFnZXIoZWxlbWVudCwgb3B0aW9ucyk7XG59XG5cbi8qKlxuICogQGNvbnN0IHtzdHJpbmd9XG4gKi9cbkhhbW1lci5WRVJTSU9OID0gJzIuMC43JztcblxuLyoqXG4gKiBkZWZhdWx0IHNldHRpbmdzXG4gKiBAbmFtZXNwYWNlXG4gKi9cbkhhbW1lci5kZWZhdWx0cyA9IHtcbiAgICAvKipcbiAgICAgKiBzZXQgaWYgRE9NIGV2ZW50cyBhcmUgYmVpbmcgdHJpZ2dlcmVkLlxuICAgICAqIEJ1dCB0aGlzIGlzIHNsb3dlciBhbmQgdW51c2VkIGJ5IHNpbXBsZSBpbXBsZW1lbnRhdGlvbnMsIHNvIGRpc2FibGVkIGJ5IGRlZmF1bHQuXG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICogQGRlZmF1bHQgZmFsc2VcbiAgICAgKi9cbiAgICBkb21FdmVudHM6IGZhbHNlLFxuXG4gICAgLyoqXG4gICAgICogVGhlIHZhbHVlIGZvciB0aGUgdG91Y2hBY3Rpb24gcHJvcGVydHkvZmFsbGJhY2suXG4gICAgICogV2hlbiBzZXQgdG8gYGNvbXB1dGVgIGl0IHdpbGwgbWFnaWNhbGx5IHNldCB0aGUgY29ycmVjdCB2YWx1ZSBiYXNlZCBvbiB0aGUgYWRkZWQgcmVjb2duaXplcnMuXG4gICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgKiBAZGVmYXVsdCBjb21wdXRlXG4gICAgICovXG4gICAgdG91Y2hBY3Rpb246IFRPVUNIX0FDVElPTl9DT01QVVRFLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICogQGRlZmF1bHQgdHJ1ZVxuICAgICAqL1xuICAgIGVuYWJsZTogdHJ1ZSxcblxuICAgIC8qKlxuICAgICAqIEVYUEVSSU1FTlRBTCBGRUFUVVJFIC0tIGNhbiBiZSByZW1vdmVkL2NoYW5nZWRcbiAgICAgKiBDaGFuZ2UgdGhlIHBhcmVudCBpbnB1dCB0YXJnZXQgZWxlbWVudC5cbiAgICAgKiBJZiBOdWxsLCB0aGVuIGl0IGlzIGJlaW5nIHNldCB0aGUgdG8gbWFpbiBlbGVtZW50LlxuICAgICAqIEB0eXBlIHtOdWxsfEV2ZW50VGFyZ2V0fVxuICAgICAqIEBkZWZhdWx0IG51bGxcbiAgICAgKi9cbiAgICBpbnB1dFRhcmdldDogbnVsbCxcblxuICAgIC8qKlxuICAgICAqIGZvcmNlIGFuIGlucHV0IGNsYXNzXG4gICAgICogQHR5cGUge051bGx8RnVuY3Rpb259XG4gICAgICogQGRlZmF1bHQgbnVsbFxuICAgICAqL1xuICAgIGlucHV0Q2xhc3M6IG51bGwsXG5cbiAgICAvKipcbiAgICAgKiBEZWZhdWx0IHJlY29nbml6ZXIgc2V0dXAgd2hlbiBjYWxsaW5nIGBIYW1tZXIoKWBcbiAgICAgKiBXaGVuIGNyZWF0aW5nIGEgbmV3IE1hbmFnZXIgdGhlc2Ugd2lsbCBiZSBza2lwcGVkLlxuICAgICAqIEB0eXBlIHtBcnJheX1cbiAgICAgKi9cbiAgICBwcmVzZXQ6IFtcbiAgICAgICAgLy8gUmVjb2duaXplckNsYXNzLCBvcHRpb25zLCBbcmVjb2duaXplV2l0aCwgLi4uXSwgW3JlcXVpcmVGYWlsdXJlLCAuLi5dXG4gICAgICAgIFtSb3RhdGVSZWNvZ25pemVyLCB7ZW5hYmxlOiBmYWxzZX1dLFxuICAgICAgICBbUGluY2hSZWNvZ25pemVyLCB7ZW5hYmxlOiBmYWxzZX0sIFsncm90YXRlJ11dLFxuICAgICAgICBbU3dpcGVSZWNvZ25pemVyLCB7ZGlyZWN0aW9uOiBESVJFQ1RJT05fSE9SSVpPTlRBTH1dLFxuICAgICAgICBbUGFuUmVjb2duaXplciwge2RpcmVjdGlvbjogRElSRUNUSU9OX0hPUklaT05UQUx9LCBbJ3N3aXBlJ11dLFxuICAgICAgICBbVGFwUmVjb2duaXplcl0sXG4gICAgICAgIFtUYXBSZWNvZ25pemVyLCB7ZXZlbnQ6ICdkb3VibGV0YXAnLCB0YXBzOiAyfSwgWyd0YXAnXV0sXG4gICAgICAgIFtQcmVzc1JlY29nbml6ZXJdXG4gICAgXSxcblxuICAgIC8qKlxuICAgICAqIFNvbWUgQ1NTIHByb3BlcnRpZXMgY2FuIGJlIHVzZWQgdG8gaW1wcm92ZSB0aGUgd29ya2luZyBvZiBIYW1tZXIuXG4gICAgICogQWRkIHRoZW0gdG8gdGhpcyBtZXRob2QgYW5kIHRoZXkgd2lsbCBiZSBzZXQgd2hlbiBjcmVhdGluZyBhIG5ldyBNYW5hZ2VyLlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKi9cbiAgICBjc3NQcm9wczoge1xuICAgICAgICAvKipcbiAgICAgICAgICogRGlzYWJsZXMgdGV4dCBzZWxlY3Rpb24gdG8gaW1wcm92ZSB0aGUgZHJhZ2dpbmcgZ2VzdHVyZS4gTWFpbmx5IGZvciBkZXNrdG9wIGJyb3dzZXJzLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAnbm9uZSdcbiAgICAgICAgICovXG4gICAgICAgIHVzZXJTZWxlY3Q6ICdub25lJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGlzYWJsZSB0aGUgV2luZG93cyBQaG9uZSBncmlwcGVycyB3aGVuIHByZXNzaW5nIGFuIGVsZW1lbnQuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqIEBkZWZhdWx0ICdub25lJ1xuICAgICAgICAgKi9cbiAgICAgICAgdG91Y2hTZWxlY3Q6ICdub25lJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGlzYWJsZXMgdGhlIGRlZmF1bHQgY2FsbG91dCBzaG93biB3aGVuIHlvdSB0b3VjaCBhbmQgaG9sZCBhIHRvdWNoIHRhcmdldC5cbiAgICAgICAgICogT24gaU9TLCB3aGVuIHlvdSB0b3VjaCBhbmQgaG9sZCBhIHRvdWNoIHRhcmdldCBzdWNoIGFzIGEgbGluaywgU2FmYXJpIGRpc3BsYXlzXG4gICAgICAgICAqIGEgY2FsbG91dCBjb250YWluaW5nIGluZm9ybWF0aW9uIGFib3V0IHRoZSBsaW5rLiBUaGlzIHByb3BlcnR5IGFsbG93cyB5b3UgdG8gZGlzYWJsZSB0aGF0IGNhbGxvdXQuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqIEBkZWZhdWx0ICdub25lJ1xuICAgICAgICAgKi9cbiAgICAgICAgdG91Y2hDYWxsb3V0OiAnbm9uZScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNwZWNpZmllcyB3aGV0aGVyIHpvb21pbmcgaXMgZW5hYmxlZC4gVXNlZCBieSBJRTEwPlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAnbm9uZSdcbiAgICAgICAgICovXG4gICAgICAgIGNvbnRlbnRab29taW5nOiAnbm9uZScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNwZWNpZmllcyB0aGF0IGFuIGVudGlyZSBlbGVtZW50IHNob3VsZCBiZSBkcmFnZ2FibGUgaW5zdGVhZCBvZiBpdHMgY29udGVudHMuIE1haW5seSBmb3IgZGVza3RvcCBicm93c2Vycy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ25vbmUnXG4gICAgICAgICAqL1xuICAgICAgICB1c2VyRHJhZzogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPdmVycmlkZXMgdGhlIGhpZ2hsaWdodCBjb2xvciBzaG93biB3aGVuIHRoZSB1c2VyIHRhcHMgYSBsaW5rIG9yIGEgSmF2YVNjcmlwdFxuICAgICAgICAgKiBjbGlja2FibGUgZWxlbWVudCBpbiBpT1MuIFRoaXMgcHJvcGVydHkgb2JleXMgdGhlIGFscGhhIHZhbHVlLCBpZiBzcGVjaWZpZWQuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqIEBkZWZhdWx0ICdyZ2JhKDAsMCwwLDApJ1xuICAgICAgICAgKi9cbiAgICAgICAgdGFwSGlnaGxpZ2h0Q29sb3I6ICdyZ2JhKDAsMCwwLDApJ1xuICAgIH1cbn07XG5cbnZhciBTVE9QID0gMTtcbnZhciBGT1JDRURfU1RPUCA9IDI7XG5cbi8qKlxuICogTWFuYWdlclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudFxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIE1hbmFnZXIoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IGFzc2lnbih7fSwgSGFtbWVyLmRlZmF1bHRzLCBvcHRpb25zIHx8IHt9KTtcblxuICAgIHRoaXMub3B0aW9ucy5pbnB1dFRhcmdldCA9IHRoaXMub3B0aW9ucy5pbnB1dFRhcmdldCB8fCBlbGVtZW50O1xuXG4gICAgdGhpcy5oYW5kbGVycyA9IHt9O1xuICAgIHRoaXMuc2Vzc2lvbiA9IHt9O1xuICAgIHRoaXMucmVjb2duaXplcnMgPSBbXTtcbiAgICB0aGlzLm9sZENzc1Byb3BzID0ge307XG5cbiAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMuaW5wdXQgPSBjcmVhdGVJbnB1dEluc3RhbmNlKHRoaXMpO1xuICAgIHRoaXMudG91Y2hBY3Rpb24gPSBuZXcgVG91Y2hBY3Rpb24odGhpcywgdGhpcy5vcHRpb25zLnRvdWNoQWN0aW9uKTtcblxuICAgIHRvZ2dsZUNzc1Byb3BzKHRoaXMsIHRydWUpO1xuXG4gICAgZWFjaCh0aGlzLm9wdGlvbnMucmVjb2duaXplcnMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgdmFyIHJlY29nbml6ZXIgPSB0aGlzLmFkZChuZXcgKGl0ZW1bMF0pKGl0ZW1bMV0pKTtcbiAgICAgICAgaXRlbVsyXSAmJiByZWNvZ25pemVyLnJlY29nbml6ZVdpdGgoaXRlbVsyXSk7XG4gICAgICAgIGl0ZW1bM10gJiYgcmVjb2duaXplci5yZXF1aXJlRmFpbHVyZShpdGVtWzNdKTtcbiAgICB9LCB0aGlzKTtcbn1cblxuTWFuYWdlci5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogc2V0IG9wdGlvbnNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgICAqIEByZXR1cm5zIHtNYW5hZ2VyfVxuICAgICAqL1xuICAgIHNldDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICBhc3NpZ24odGhpcy5vcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAvLyBPcHRpb25zIHRoYXQgbmVlZCBhIGxpdHRsZSBtb3JlIHNldHVwXG4gICAgICAgIGlmIChvcHRpb25zLnRvdWNoQWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnRvdWNoQWN0aW9uLnVwZGF0ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmlucHV0VGFyZ2V0KSB7XG4gICAgICAgICAgICAvLyBDbGVhbiB1cCBleGlzdGluZyBldmVudCBsaXN0ZW5lcnMgYW5kIHJlaW5pdGlhbGl6ZVxuICAgICAgICAgICAgdGhpcy5pbnB1dC5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLmlucHV0LnRhcmdldCA9IG9wdGlvbnMuaW5wdXRUYXJnZXQ7XG4gICAgICAgICAgICB0aGlzLmlucHV0LmluaXQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogc3RvcCByZWNvZ25pemluZyBmb3IgdGhpcyBzZXNzaW9uLlxuICAgICAqIFRoaXMgc2Vzc2lvbiB3aWxsIGJlIGRpc2NhcmRlZCwgd2hlbiBhIG5ldyBbaW5wdXRdc3RhcnQgZXZlbnQgaXMgZmlyZWQuXG4gICAgICogV2hlbiBmb3JjZWQsIHRoZSByZWNvZ25pemVyIGN5Y2xlIGlzIHN0b3BwZWQgaW1tZWRpYXRlbHkuXG4gICAgICogQHBhcmFtIHtCb29sZWFufSBbZm9yY2VdXG4gICAgICovXG4gICAgc3RvcDogZnVuY3Rpb24oZm9yY2UpIHtcbiAgICAgICAgdGhpcy5zZXNzaW9uLnN0b3BwZWQgPSBmb3JjZSA/IEZPUkNFRF9TVE9QIDogU1RPUDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogcnVuIHRoZSByZWNvZ25pemVycyFcbiAgICAgKiBjYWxsZWQgYnkgdGhlIGlucHV0SGFuZGxlciBmdW5jdGlvbiBvbiBldmVyeSBtb3ZlbWVudCBvZiB0aGUgcG9pbnRlcnMgKHRvdWNoZXMpXG4gICAgICogaXQgd2Fsa3MgdGhyb3VnaCBhbGwgdGhlIHJlY29nbml6ZXJzIGFuZCB0cmllcyB0byBkZXRlY3QgdGhlIGdlc3R1cmUgdGhhdCBpcyBiZWluZyBtYWRlXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGlucHV0RGF0YVxuICAgICAqL1xuICAgIHJlY29nbml6ZTogZnVuY3Rpb24oaW5wdXREYXRhKSB7XG4gICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5zZXNzaW9uO1xuICAgICAgICBpZiAoc2Vzc2lvbi5zdG9wcGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBydW4gdGhlIHRvdWNoLWFjdGlvbiBwb2x5ZmlsbFxuICAgICAgICB0aGlzLnRvdWNoQWN0aW9uLnByZXZlbnREZWZhdWx0cyhpbnB1dERhdGEpO1xuXG4gICAgICAgIHZhciByZWNvZ25pemVyO1xuICAgICAgICB2YXIgcmVjb2duaXplcnMgPSB0aGlzLnJlY29nbml6ZXJzO1xuXG4gICAgICAgIC8vIHRoaXMgaG9sZHMgdGhlIHJlY29nbml6ZXIgdGhhdCBpcyBiZWluZyByZWNvZ25pemVkLlxuICAgICAgICAvLyBzbyB0aGUgcmVjb2duaXplcidzIHN0YXRlIG5lZWRzIHRvIGJlIEJFR0FOLCBDSEFOR0VELCBFTkRFRCBvciBSRUNPR05JWkVEXG4gICAgICAgIC8vIGlmIG5vIHJlY29nbml6ZXIgaXMgZGV0ZWN0aW5nIGEgdGhpbmcsIGl0IGlzIHNldCB0byBgbnVsbGBcbiAgICAgICAgdmFyIGN1clJlY29nbml6ZXIgPSBzZXNzaW9uLmN1clJlY29nbml6ZXI7XG5cbiAgICAgICAgLy8gcmVzZXQgd2hlbiB0aGUgbGFzdCByZWNvZ25pemVyIGlzIHJlY29nbml6ZWRcbiAgICAgICAgLy8gb3Igd2hlbiB3ZSdyZSBpbiBhIG5ldyBzZXNzaW9uXG4gICAgICAgIGlmICghY3VyUmVjb2duaXplciB8fCAoY3VyUmVjb2duaXplciAmJiBjdXJSZWNvZ25pemVyLnN0YXRlICYgU1RBVEVfUkVDT0dOSVpFRCkpIHtcbiAgICAgICAgICAgIGN1clJlY29nbml6ZXIgPSBzZXNzaW9uLmN1clJlY29nbml6ZXIgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHJlY29nbml6ZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmVjb2duaXplciA9IHJlY29nbml6ZXJzW2ldO1xuXG4gICAgICAgICAgICAvLyBmaW5kIG91dCBpZiB3ZSBhcmUgYWxsb3dlZCB0cnkgdG8gcmVjb2duaXplIHRoZSBpbnB1dCBmb3IgdGhpcyBvbmUuXG4gICAgICAgICAgICAvLyAxLiAgIGFsbG93IGlmIHRoZSBzZXNzaW9uIGlzIE5PVCBmb3JjZWQgc3RvcHBlZCAoc2VlIHRoZSAuc3RvcCgpIG1ldGhvZClcbiAgICAgICAgICAgIC8vIDIuICAgYWxsb3cgaWYgd2Ugc3RpbGwgaGF2ZW4ndCByZWNvZ25pemVkIGEgZ2VzdHVyZSBpbiB0aGlzIHNlc3Npb24sIG9yIHRoZSB0aGlzIHJlY29nbml6ZXIgaXMgdGhlIG9uZVxuICAgICAgICAgICAgLy8gICAgICB0aGF0IGlzIGJlaW5nIHJlY29nbml6ZWQuXG4gICAgICAgICAgICAvLyAzLiAgIGFsbG93IGlmIHRoZSByZWNvZ25pemVyIGlzIGFsbG93ZWQgdG8gcnVuIHNpbXVsdGFuZW91cyB3aXRoIHRoZSBjdXJyZW50IHJlY29nbml6ZWQgcmVjb2duaXplci5cbiAgICAgICAgICAgIC8vICAgICAgdGhpcyBjYW4gYmUgc2V0dXAgd2l0aCB0aGUgYHJlY29nbml6ZVdpdGgoKWAgbWV0aG9kIG9uIHRoZSByZWNvZ25pemVyLlxuICAgICAgICAgICAgaWYgKHNlc3Npb24uc3RvcHBlZCAhPT0gRk9SQ0VEX1NUT1AgJiYgKCAvLyAxXG4gICAgICAgICAgICAgICAgICAgICFjdXJSZWNvZ25pemVyIHx8IHJlY29nbml6ZXIgPT0gY3VyUmVjb2duaXplciB8fCAvLyAyXG4gICAgICAgICAgICAgICAgICAgIHJlY29nbml6ZXIuY2FuUmVjb2duaXplV2l0aChjdXJSZWNvZ25pemVyKSkpIHsgLy8gM1xuICAgICAgICAgICAgICAgIHJlY29nbml6ZXIucmVjb2duaXplKGlucHV0RGF0YSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlY29nbml6ZXIucmVzZXQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgdGhlIHJlY29nbml6ZXIgaGFzIGJlZW4gcmVjb2duaXppbmcgdGhlIGlucHV0IGFzIGEgdmFsaWQgZ2VzdHVyZSwgd2Ugd2FudCB0byBzdG9yZSB0aGlzIG9uZSBhcyB0aGVcbiAgICAgICAgICAgIC8vIGN1cnJlbnQgYWN0aXZlIHJlY29nbml6ZXIuIGJ1dCBvbmx5IGlmIHdlIGRvbid0IGFscmVhZHkgaGF2ZSBhbiBhY3RpdmUgcmVjb2duaXplclxuICAgICAgICAgICAgaWYgKCFjdXJSZWNvZ25pemVyICYmIHJlY29nbml6ZXIuc3RhdGUgJiAoU1RBVEVfQkVHQU4gfCBTVEFURV9DSEFOR0VEIHwgU1RBVEVfRU5ERUQpKSB7XG4gICAgICAgICAgICAgICAgY3VyUmVjb2duaXplciA9IHNlc3Npb24uY3VyUmVjb2duaXplciA9IHJlY29nbml6ZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZ2V0IGEgcmVjb2duaXplciBieSBpdHMgZXZlbnQgbmFtZS5cbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ8U3RyaW5nfSByZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge1JlY29nbml6ZXJ8TnVsbH1cbiAgICAgKi9cbiAgICBnZXQ6IGZ1bmN0aW9uKHJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKHJlY29nbml6ZXIgaW5zdGFuY2VvZiBSZWNvZ25pemVyKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVjb2duaXplcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZWNvZ25pemVycyA9IHRoaXMucmVjb2duaXplcnM7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVjb2duaXplcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChyZWNvZ25pemVyc1tpXS5vcHRpb25zLmV2ZW50ID09IHJlY29nbml6ZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVjb2duaXplcnNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGFkZCBhIHJlY29nbml6ZXIgdG8gdGhlIG1hbmFnZXJcbiAgICAgKiBleGlzdGluZyByZWNvZ25pemVycyB3aXRoIHRoZSBzYW1lIGV2ZW50IG5hbWUgd2lsbCBiZSByZW1vdmVkXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfSByZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge1JlY29nbml6ZXJ8TWFuYWdlcn1cbiAgICAgKi9cbiAgICBhZGQ6IGZ1bmN0aW9uKHJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKHJlY29nbml6ZXIsICdhZGQnLCB0aGlzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZW1vdmUgZXhpc3RpbmdcbiAgICAgICAgdmFyIGV4aXN0aW5nID0gdGhpcy5nZXQocmVjb2duaXplci5vcHRpb25zLmV2ZW50KTtcbiAgICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZShleGlzdGluZyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlY29nbml6ZXJzLnB1c2gocmVjb2duaXplcik7XG4gICAgICAgIHJlY29nbml6ZXIubWFuYWdlciA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy50b3VjaEFjdGlvbi51cGRhdGUoKTtcbiAgICAgICAgcmV0dXJuIHJlY29nbml6ZXI7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlbW92ZSBhIHJlY29nbml6ZXIgYnkgbmFtZSBvciBpbnN0YW5jZVxuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcnxTdHJpbmd9IHJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7TWFuYWdlcn1cbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uKHJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKHJlY29nbml6ZXIsICdyZW1vdmUnLCB0aGlzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICByZWNvZ25pemVyID0gdGhpcy5nZXQocmVjb2duaXplcik7XG5cbiAgICAgICAgLy8gbGV0J3MgbWFrZSBzdXJlIHRoaXMgcmVjb2duaXplciBleGlzdHNcbiAgICAgICAgaWYgKHJlY29nbml6ZXIpIHtcbiAgICAgICAgICAgIHZhciByZWNvZ25pemVycyA9IHRoaXMucmVjb2duaXplcnM7XG4gICAgICAgICAgICB2YXIgaW5kZXggPSBpbkFycmF5KHJlY29nbml6ZXJzLCByZWNvZ25pemVyKTtcblxuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJlY29nbml6ZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgdGhpcy50b3VjaEFjdGlvbi51cGRhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBiaW5kIGV2ZW50XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50c1xuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXJcbiAgICAgKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSB0aGlzXG4gICAgICovXG4gICAgb246IGZ1bmN0aW9uKGV2ZW50cywgaGFuZGxlcikge1xuICAgICAgICBpZiAoZXZlbnRzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaGFuZGxlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaGFuZGxlcnMgPSB0aGlzLmhhbmRsZXJzO1xuICAgICAgICBlYWNoKHNwbGl0U3RyKGV2ZW50cyksIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBoYW5kbGVyc1tldmVudF0gPSBoYW5kbGVyc1tldmVudF0gfHwgW107XG4gICAgICAgICAgICBoYW5kbGVyc1tldmVudF0ucHVzaChoYW5kbGVyKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiB1bmJpbmQgZXZlbnQsIGxlYXZlIGVtaXQgYmxhbmsgdG8gcmVtb3ZlIGFsbCBoYW5kbGVyc1xuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudHNcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbaGFuZGxlcl1cbiAgICAgKiBAcmV0dXJucyB7RXZlbnRFbWl0dGVyfSB0aGlzXG4gICAgICovXG4gICAgb2ZmOiBmdW5jdGlvbihldmVudHMsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGV2ZW50cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaGFuZGxlcnMgPSB0aGlzLmhhbmRsZXJzO1xuICAgICAgICBlYWNoKHNwbGl0U3RyKGV2ZW50cyksIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoIWhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgaGFuZGxlcnNbZXZlbnRdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBoYW5kbGVyc1tldmVudF0gJiYgaGFuZGxlcnNbZXZlbnRdLnNwbGljZShpbkFycmF5KGhhbmRsZXJzW2V2ZW50XSwgaGFuZGxlciksIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGVtaXQgZXZlbnQgdG8gdGhlIGxpc3RlbmVyc1xuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gICAgICovXG4gICAgZW1pdDogZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcbiAgICAgICAgLy8gd2UgYWxzbyB3YW50IHRvIHRyaWdnZXIgZG9tIGV2ZW50c1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRvbUV2ZW50cykge1xuICAgICAgICAgICAgdHJpZ2dlckRvbUV2ZW50KGV2ZW50LCBkYXRhKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG5vIGhhbmRsZXJzLCBzbyBza2lwIGl0IGFsbFxuICAgICAgICB2YXIgaGFuZGxlcnMgPSB0aGlzLmhhbmRsZXJzW2V2ZW50XSAmJiB0aGlzLmhhbmRsZXJzW2V2ZW50XS5zbGljZSgpO1xuICAgICAgICBpZiAoIWhhbmRsZXJzIHx8ICFoYW5kbGVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGRhdGEudHlwZSA9IGV2ZW50O1xuICAgICAgICBkYXRhLnByZXZlbnREZWZhdWx0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkYXRhLnNyY0V2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IGhhbmRsZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgaGFuZGxlcnNbaV0oZGF0YSk7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZGVzdHJveSB0aGUgbWFuYWdlciBhbmQgdW5iaW5kcyBhbGwgZXZlbnRzXG4gICAgICogaXQgZG9lc24ndCB1bmJpbmQgZG9tIGV2ZW50cywgdGhhdCBpcyB0aGUgdXNlciBvd24gcmVzcG9uc2liaWxpdHlcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ICYmIHRvZ2dsZUNzc1Byb3BzKHRoaXMsIGZhbHNlKTtcblxuICAgICAgICB0aGlzLmhhbmRsZXJzID0ge307XG4gICAgICAgIHRoaXMuc2Vzc2lvbiA9IHt9O1xuICAgICAgICB0aGlzLmlucHV0LmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gbnVsbDtcbiAgICB9XG59O1xuXG4vKipcbiAqIGFkZC9yZW1vdmUgdGhlIGNzcyBwcm9wZXJ0aWVzIGFzIGRlZmluZWQgaW4gbWFuYWdlci5vcHRpb25zLmNzc1Byb3BzXG4gKiBAcGFyYW0ge01hbmFnZXJ9IG1hbmFnZXJcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gYWRkXG4gKi9cbmZ1bmN0aW9uIHRvZ2dsZUNzc1Byb3BzKG1hbmFnZXIsIGFkZCkge1xuICAgIHZhciBlbGVtZW50ID0gbWFuYWdlci5lbGVtZW50O1xuICAgIGlmICghZWxlbWVudC5zdHlsZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBwcm9wO1xuICAgIGVhY2gobWFuYWdlci5vcHRpb25zLmNzc1Byb3BzLCBmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICBwcm9wID0gcHJlZml4ZWQoZWxlbWVudC5zdHlsZSwgbmFtZSk7XG4gICAgICAgIGlmIChhZGQpIHtcbiAgICAgICAgICAgIG1hbmFnZXIub2xkQ3NzUHJvcHNbcHJvcF0gPSBlbGVtZW50LnN0eWxlW3Byb3BdO1xuICAgICAgICAgICAgZWxlbWVudC5zdHlsZVtwcm9wXSA9IHZhbHVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5zdHlsZVtwcm9wXSA9IG1hbmFnZXIub2xkQ3NzUHJvcHNbcHJvcF0gfHwgJyc7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoIWFkZCkge1xuICAgICAgICBtYW5hZ2VyLm9sZENzc1Byb3BzID0ge307XG4gICAgfVxufVxuXG4vKipcbiAqIHRyaWdnZXIgZG9tIGV2ZW50XG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXG4gKi9cbmZ1bmN0aW9uIHRyaWdnZXJEb21FdmVudChldmVudCwgZGF0YSkge1xuICAgIHZhciBnZXN0dXJlRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnRXZlbnQnKTtcbiAgICBnZXN0dXJlRXZlbnQuaW5pdEV2ZW50KGV2ZW50LCB0cnVlLCB0cnVlKTtcbiAgICBnZXN0dXJlRXZlbnQuZ2VzdHVyZSA9IGRhdGE7XG4gICAgZGF0YS50YXJnZXQuZGlzcGF0Y2hFdmVudChnZXN0dXJlRXZlbnQpO1xufVxuXG5hc3NpZ24oSGFtbWVyLCB7XG4gICAgSU5QVVRfU1RBUlQ6IElOUFVUX1NUQVJULFxuICAgIElOUFVUX01PVkU6IElOUFVUX01PVkUsXG4gICAgSU5QVVRfRU5EOiBJTlBVVF9FTkQsXG4gICAgSU5QVVRfQ0FOQ0VMOiBJTlBVVF9DQU5DRUwsXG5cbiAgICBTVEFURV9QT1NTSUJMRTogU1RBVEVfUE9TU0lCTEUsXG4gICAgU1RBVEVfQkVHQU46IFNUQVRFX0JFR0FOLFxuICAgIFNUQVRFX0NIQU5HRUQ6IFNUQVRFX0NIQU5HRUQsXG4gICAgU1RBVEVfRU5ERUQ6IFNUQVRFX0VOREVELFxuICAgIFNUQVRFX1JFQ09HTklaRUQ6IFNUQVRFX1JFQ09HTklaRUQsXG4gICAgU1RBVEVfQ0FOQ0VMTEVEOiBTVEFURV9DQU5DRUxMRUQsXG4gICAgU1RBVEVfRkFJTEVEOiBTVEFURV9GQUlMRUQsXG5cbiAgICBESVJFQ1RJT05fTk9ORTogRElSRUNUSU9OX05PTkUsXG4gICAgRElSRUNUSU9OX0xFRlQ6IERJUkVDVElPTl9MRUZULFxuICAgIERJUkVDVElPTl9SSUdIVDogRElSRUNUSU9OX1JJR0hULFxuICAgIERJUkVDVElPTl9VUDogRElSRUNUSU9OX1VQLFxuICAgIERJUkVDVElPTl9ET1dOOiBESVJFQ1RJT05fRE9XTixcbiAgICBESVJFQ1RJT05fSE9SSVpPTlRBTDogRElSRUNUSU9OX0hPUklaT05UQUwsXG4gICAgRElSRUNUSU9OX1ZFUlRJQ0FMOiBESVJFQ1RJT05fVkVSVElDQUwsXG4gICAgRElSRUNUSU9OX0FMTDogRElSRUNUSU9OX0FMTCxcblxuICAgIE1hbmFnZXI6IE1hbmFnZXIsXG4gICAgSW5wdXQ6IElucHV0LFxuICAgIFRvdWNoQWN0aW9uOiBUb3VjaEFjdGlvbixcblxuICAgIFRvdWNoSW5wdXQ6IFRvdWNoSW5wdXQsXG4gICAgTW91c2VJbnB1dDogTW91c2VJbnB1dCxcbiAgICBQb2ludGVyRXZlbnRJbnB1dDogUG9pbnRlckV2ZW50SW5wdXQsXG4gICAgVG91Y2hNb3VzZUlucHV0OiBUb3VjaE1vdXNlSW5wdXQsXG4gICAgU2luZ2xlVG91Y2hJbnB1dDogU2luZ2xlVG91Y2hJbnB1dCxcblxuICAgIFJlY29nbml6ZXI6IFJlY29nbml6ZXIsXG4gICAgQXR0clJlY29nbml6ZXI6IEF0dHJSZWNvZ25pemVyLFxuICAgIFRhcDogVGFwUmVjb2duaXplcixcbiAgICBQYW46IFBhblJlY29nbml6ZXIsXG4gICAgU3dpcGU6IFN3aXBlUmVjb2duaXplcixcbiAgICBQaW5jaDogUGluY2hSZWNvZ25pemVyLFxuICAgIFJvdGF0ZTogUm90YXRlUmVjb2duaXplcixcbiAgICBQcmVzczogUHJlc3NSZWNvZ25pemVyLFxuXG4gICAgb246IGFkZEV2ZW50TGlzdGVuZXJzLFxuICAgIG9mZjogcmVtb3ZlRXZlbnRMaXN0ZW5lcnMsXG4gICAgZWFjaDogZWFjaCxcbiAgICBtZXJnZTogbWVyZ2UsXG4gICAgZXh0ZW5kOiBleHRlbmQsXG4gICAgYXNzaWduOiBhc3NpZ24sXG4gICAgaW5oZXJpdDogaW5oZXJpdCxcbiAgICBiaW5kRm46IGJpbmRGbixcbiAgICBwcmVmaXhlZDogcHJlZml4ZWRcbn0pO1xuXG4vLyB0aGlzIHByZXZlbnRzIGVycm9ycyB3aGVuIEhhbW1lciBpcyBsb2FkZWQgaW4gdGhlIHByZXNlbmNlIG9mIGFuIEFNRFxuLy8gIHN0eWxlIGxvYWRlciBidXQgYnkgc2NyaXB0IHRhZywgbm90IGJ5IHRoZSBsb2FkZXIuXG52YXIgZnJlZUdsb2JhbCA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6ICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcgPyBzZWxmIDoge30pKTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG5mcmVlR2xvYmFsLkhhbW1lciA9IEhhbW1lcjtcblxuaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIEhhbW1lcjtcbiAgICB9KTtcbn0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gSGFtbWVyO1xufSBlbHNlIHtcbiAgICB3aW5kb3dbZXhwb3J0TmFtZV0gPSBIYW1tZXI7XG59XG5cbn0pKHdpbmRvdywgZG9jdW1lbnQsICdIYW1tZXInKTtcbiJdfQ==
