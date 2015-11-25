// current problems:
//
// text centering needs to be reworked probably

var text = [];
var currenttranslationlist = [];

var translation = 0;
var translations = translationdata.length;
var canto = 0;
var cantos = cantotitles.length;
var currentpage = "lens";

var textwidth = 0;

var lineheight = 24;
var lenswidth = 768; // assuming ipad in portrait
var lensheight = 984; // assuming ipad in portrait

// borrowed

$.fn.textWidth = function(text) {
  var org = $(this);
  var html = $('<span style="postion:absolute;width:auto;left:-9999px">' + (text || org.html()) + '</span>');
  if (!text) {
    html.css("font-family", org.css("font-family"));
    html.css("font-size", org.css("font-size"));
  }
  $('body').append(html);
  var width = html.width();
  html.remove();
  return width;
};

// setup 

function settranslationlist() {
	for(var i in translationdata) {
		currenttranslationlist.push(translationdata[i].translationid);
	}
}

function setupnotes() {
	var count = 0;
	$(".note").each(function() {
		$(this).children(".notetext").attr("data-notenumber",count);
		$(this).children(".noteno").attr("data-notenumber",count).click(function(e) {
			e.stopPropagation();
			var thisnote = $(this).attr("data-notenumber");
			var notetext = $(".notetext[data-notenumber="+thisnote+"]").html();
			hidenotes();
			$('<div class="notewindow">'+notetext+'</div>')
				.appendTo("#main")
				.click( hidenotes );
		});
		count++;
	});
}

function hidenotes() {
	$(".notewindow").remove();
}

// general

function setpage(pageid) {
	$(".page").removeClass("on");
	$(".page#"+pageid).addClass("on");
	currentpage = pageid;
}

function resize() {
	var windowwidth = window.innerWidth;
	var windowheight = window.innerHeight;
	lenswidth = windowwidth;
	lensheight = windowheight - $("nav").height();

	if(lenswidth > lensheight) {
		$(".page").addClass("landscape").removeClass("portrait");
	} else {
		$(".page").addClass("portrait").removeClass("landscape");
	}
	$("#main").css({"width":lenswidth+"px","height":windowheight+"px"});
	$("#content").css({"width":lenswidth+"px","height":lensheight+"px"});

	textwidth = parseInt($("#text").css("width"),0);


	setlens(translation,canto);

}

// settings

// this needs to have some logic:
// 1) if current translation is deleted, current translation needs to be set to something else

function settings() {
	var thisid, insert;

// add in translation chooser

	$("#translatorlist").remove();
	$("#translationchoose").append('<ul id="translatorlist"></div>');
	for(var i in translationdata) {
		$("#translatorlist").append('<li><input type="checkbox" id="'+translationdata[i].translationid+'" /><span id="'+translationdata[i].translationid+'" >'+translationdata[i].translationfullname+'</span></li>');
		$("input#"+translationdata[i].translationid).prop("checked", (currenttranslationlist.indexOf(translationdata[i].translationid) > -1));
	}

	$('#translatorlist :checkbox').click(function() {
		var $this = $(this);
		changetranslation(this.id,$this.is(':checked'));
	});

	$("#translatorlist span").click(function(e) {
		$("input#"+ this.id).prop("checked", !$("input#"+ this.id).prop("checked"));
		changetranslation(this.id,$("input#"+ this.id).prop("checked"));
	});

// add in toc

	$("#selectors").remove();
	$("#translationgo").append('<div id="selectors"><p>Canto: <select id="selectcanto"></select></p><p>Translation: <select id="selecttranslator"></select></p><p><span id="selectgo">Go</span></p></div>');
	for(i = 0; i < cantos; i++) {
		insert = (canto == i) ? "selected" : "";
		$("select#selectcanto").append('<option id="canto'+i+'" '+insert+'>'+cantotitles[i]+"</option>");
	}
	for(i in currenttranslationlist) {
		insert = (translation == i) ? "selected" : "";
		for(var j = 0; j < translationdata.length; j++) {
			if(translationdata[j].translationid == currenttranslationlist[i]) {
				$("select#selecttranslator").append('<option id="tr_'+translationdata[j].translationid+'" '+insert+'>'+translationdata[j].translationfullname+"</option>");
			}
		}
	}
	$("#selectgo").click(function() {
		var thistrans = $("#selecttranslator option:selected").attr("id").substr(3);
		var thiscanto = parseInt($("#selectcanto option:selected").attr("id").substr(5));
		for(var j = 0; j < translationdata.length; j++) {
			if(currenttranslationlist[j] == thistrans) {
				setpage("lens");
				setlens(j,thiscanto,0);
			}
		}
	});
}

function changetranslation(thisid,isset) {
	for(var i in translationdata) {
		if(thisid == translationdata[i].translationid) {
			if(isset) {
				currenttranslationlist.push(thisid);
				translations++;
			} else {
				if(translations > 1) {
					var j = currenttranslationlist.indexOf(thisid);
					if (j > -1) {
						currenttranslationlist.splice(j, 1);
					}
					translations--;
				} else {
					// there's only one translation in the list, do not delete last
					$("input#"+ thisid.toLowerCase()).prop("checked", true);
				}
			}
		}
	}

	var newlist = [];
	for(i in translationdata) {
		if(currenttranslationlist.indexOf(translationdata[i].translationid) > -1) {
			newlist.push(translationdata[i].translationid);
		}
	}
	currenttranslationlist = newlist.slice();
// also what do we do when one is deleted?
	settings();
}

// lens-specific

function fixpadding(tofix) {
	if($(tofix).hasClass("poetry")) {
		var maxwidth = 0;
		$(tofix+" p").each(function() {
			if($(this).textWidth() > maxwidth ) {
				maxwidth = $(this).textWidth() + 90; // some padding is necessary 
			}
		});

console.log("text width: " + textwidth);
console.log("max width: " + maxwidth);

		$(tofix).css({"padding-left":(textwidth - maxwidth)/2+"px","padding-right":(textwidth - maxwidth)/2+"px"});
	} else {
// this is prose, standardized padding

		var desiredwidth = 75; // this is in vw

console.log("text width: " + textwidth);
console.log("desired width: " + desiredwidth);
console.log("lineheight: " + lineheight);

//		console.log(lenswidth + " "+desiredwidth);
//		var padding = (lenswidth - desiredwidth)/2;
		var padding = (100 - desiredwidth)/2;
/*
		if((desiredwidth + 2) > lenswidth) {
			$(tofix).css({"padding-left":"1vw","padding-right":"1vw"});
		} else {
			*/
			$(tofix).css({"padding-left":padding+"vw","padding-right":padding + "vw"});
//		}
	}
}


function rounded(h) {
	return lineheight * Math.floor(h / lineheight);
}


function setlens(newtrans, newcanto, percentage) {
	var changetrans = false;
	var currenttranslations = currenttranslationlist.length;


// if page isn't set to "lens" this doesn't do anything

	if(currentpage == "lens") {
		if(newtrans - translation !== 0) {
			changetrans = true;
	//	var percentage = ($("#text").scrollTop())/($("#text")[0].scrollHeight);
			percentage = rounded($("#text").scrollTop())/($("#text").prop('scrollHeight'));
		}

		if(newtrans >= currenttranslations) {
			newtrans = 0;
		}
		if(newtrans < 0) {
			newtrans = currenttranslations-1;
		}
		if(newcanto >= cantos) {
			newcanto = 0;
		}
		if(newcanto < 0) {
			newcanto = cantos-1;
		}

// figure out which translation is the current translation

		for(var i=0; i < translationdata.length; i++) {
			if(currenttranslationlist[newtrans] == translationdata[i].translationid) {
				newtrans = i;
			}
		}

		$("#text").html(text[newtrans][newcanto]).removeClass(translationdata[translation].translationclass).addClass(translationdata[newtrans].translationclass);
		setupnotes();
		translation = newtrans;
		canto = newcanto;

		if(canto > 0) {
			$("#navtitle").html(translationdata[translation].translationshortname+" · <strong>Canto "+canto+"</strong>");
		} else {
			$("#navtitle").html("&nbsp;");
		}

		fixpadding("#text");

		if(changetrans) {
	// this method still isn't great! it tries to round to current lineheight 
	// to avoid cutting off lines
	//var scrollto = rounded((currentpercentage * ($("#text")[0].scrollHeight)));
			var scrollto = rounded((percentage * ($("#text").prop('scrollHeight'))));
			$("#text").scrollTop(scrollto);
		} else {
			if(percentage > 0) {
				$('#text').scrollTop($('#text')[0].scrollHeight);
			} else {
				$('#text').scrollTop(0);
			}
		}
	}
}

// now start

if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisp*/)
  {
    var len = this.length;
    if (typeof fun != "function")
      throw new TypeError();

    var res = new Array();
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
      {
        var val = this[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, this))
          res.push(val);
      }
    }

    return res;
  };
}

$("document").ready(function() {
	settranslationlist();
	setupnotes();
	setpage("lens");
	resize();

// button controls

	$("#navprev").click(function() {
		setlens(translation-1,canto);
	});
	$("#navnext").click(function() {
		setlens(translation+1,canto);
	});
	$("#navup").click(function() {
		setlens(translation,canto-1);
	});
	$("#navdown").click(function() {
		setlens(translation,canto+1);
	});

// swipe controls

	$("#lens").touchwipe({
		wipeLeft: function() { setlens(translation+1,canto); },
		wipeRight: function() { setlens(translation-1,canto); },

// these need to check if you're at the start/end of section

		wipeUp: function() { 
			if($("#text").scrollTop() === 0) {
				setlens(translation,canto-1,1);  // this needs to be at the bottom!
			}
		},
		wipeDown: function() { 
			if(($("#text").scrollTop() + $("#text").outerHeight())/($("#text").prop('scrollHeight')) >= 1) {
				setlens(translation,canto+1); 
			} 
		}, 
		min_move_x: 40,
		min_move_y: 40,
		preventDefaultEvents: false
	});


// key controls

	$(document).keydown(function(e) {
		e.preventDefault();
		if((e.keyCode || e.which) === 37) {
			$("#navprev").addClass('on');
			setlens(translation-1,canto);
		}
		if((e.keyCode || e.which) === 39) {
			$("#navnext").addClass('on');
			setlens(translation+1,canto);
		}
		if((e.keyCode || e.which) === 38) {
			$("#navup").addClass('on');
			setlens(translation,canto-1);
		}
		if((e.keyCode || e.which) === 40) {
			$("#navdown").addClass('on');
			setlens(translation,canto+1);
		}
	}).keyup(function(e) {
		e.preventDefault();
		$(".button").removeClass("on");
	});

// page controls

	$("#navtitle").click(function() {
		setpage("lens");
	});
	$("#navsettings").click(function() {
		if(currentpage == "settings") {
			setpage("lens");
		} else {
			settings();
			setpage("settings");
		}
	});

$("#main").click( hidenotes );

// resize listener

	$(window).resize( resize );

});