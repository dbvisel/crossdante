var translatorclass = ["italian poetry","longfellow poetry","norton","wright poetry"];
var translatorname = ["Dante","Longfellow","Norton","Wright"];
var text = [];

var translation = 0;
var translations = 4;
var canto = 0;
var cantos = 4;
var currentpage = "lens";
var currenttranslationlist = translatorname.slice();

var initialtextwidth = 0;

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

	initialtextwidth = parseInt($("#text").css("width"),0);
	setlens(translation,canto);
}

// settings

// this needs to have some logic:
// 1) if current translation is deleted, current translation needs to be set to something else

function settings() {
	var thisid;
	$("#translatorlist").remove();
	$("#settings").append('<ul id="translatorlist"></div>');
	for(var i in translatorname) {
		thisid = translatorname[i].toLowerCase();
		$("#translatorlist").append('<li><input type="checkbox" id="'+thisid+'" /><span id="'+thisid+'" >'+translatorname[i]+'</span></li>');
		$("input#"+thisid).prop("checked", (currenttranslationlist.indexOf(translatorname[i]) > -1));
	}

	$('#translatorlist :checkbox').click(function() {
		var $this = $(this);
		changetranslation(this.id,$this.is(':checked'));
	});

	$("#translatorlist span").click(function(e) {
		$("input#"+ this.id).prop("checked", !$("input#"+ this.id).prop("checked"));
		changetranslation(this.id,$("input#"+ this.id).prop("checked"));
	});
}

function changetranslation(thisid,isset) {
	for(var i in translatorname) {
		if(thisid == translatorname[i].toLowerCase()) {
			thisid = translatorname[i];
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

// also we need to sort current array to match old order
// also what do we do when one is deleted?

}

// lens-specific

function fixpadding(tofix) {
	if($(tofix).hasClass("poetry")) {
		var maxwidth = 0;
		$(tofix+" p").each(function() {
			if($(this).textWidth() > maxwidth ) {
				maxwidth = $(this).textWidth() + 18; // a little padding is necessary (~font size?)
			}
		});
		$(tofix).css({"padding-left":(initialtextwidth - maxwidth)/2+"px","padding-right":(initialtextwidth - maxwidth)/2+"px"});
	} else {
// this is prose, standardized padding
		var desiredwidth = lineheight * 16;
		console.log(lenswidth + " "+desiredwidth);
		var padding = (lenswidth - desiredwidth)/2;
		console.log(padding);
		if((desiredwidth + 20) > lenswidth) {
			$(tofix).css({"padding-left":"10px","padding-right":"10px"});
		} else {
			$(tofix).css({"padding-left":padding+"px","padding-right":padding + "px"});
		}
	}
}


function rounded(h) {
	return lineheight * Math.floor(h / lineheight);
}


function setlens(newtrans, newcanto, percentage) {
	var changetrans = false;

// if page isn't set to "lens" this doesn't do anything

	if(currentpage == "lens") {
		if(newtrans - translation !== 0) {
			changetrans = true;
	//	var percentage = ($("#text").scrollTop())/($("#text")[0].scrollHeight);
			percentage = rounded($("#text").scrollTop())/($("#text").prop('scrollHeight'));
		}

		if(newtrans >= translations) {
			newtrans = 0;
		}
		if(newtrans < 0) {
			newtrans = translations-1;
		}
		if(newcanto >= cantos) {
			newcanto = 0;
		}
		if(newcanto < 0) {
			newcanto = cantos-1;
		}
		$("#text").html(text[newtrans][newcanto]).removeClass(translatorclass[translation]).addClass(translatorclass[newtrans]);

		translation = newtrans;
		canto = newcanto;

		if(canto > 0) {
			$("#navtitle").html(translatorname[translation]+" · <strong>Canto "+canto+"</strong>");
		} else {
			$("#navtitle").html("&nbsp;");
		}

		fixpadding("#text",initialtextwidth);

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

$("document").ready(function() {
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
		min_move_x: 20,
		min_move_y: 20,
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


// resize listener

	$(window).resize(function() {
		resize();
	});
});