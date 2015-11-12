var translatorclass = ["italian poetry","longfellow poetry","norton","wright poetry"];
var translatorname = ["Dante","Longfellow","Norton","Wright"];
var text = [];

var translation = 0;
var translations = 4;
var canto = 0;
var cantos = 4;
var percentage = 0;
var initialtextwidth = 0;

var lineheight = 24;
var lenswidth = 768; // assuming ipad in portrait
var lensheight = 984; // assuming ipad in portrait


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

function setpage(pageid) {
	$(".page").removeClass("on");
	$(".page#"+pageid).addClass("on");
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

function rounded(h) {
	return lineheight * Math.floor(h / lineheight);
}


function setlens(newtrans, newcanto) {
//	var currentpercentage = ($("#text").scrollTop())/($("#text")[0].scrollHeight);
	var currentpercentage = rounded($("#text").scrollTop())/($("#text").prop('scrollHeight'));

	if((newtrans - translation) === 0) {
		currentpercentage = 0;
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

// this method still isn't great! it tries to round to current lineheight 
// to avoid cutting off lines
//var scrollto = rounded((currentpercentage * ($("#text")[0].scrollHeight)));
	var scrollto = rounded((currentpercentage * ($("#text").prop('scrollHeight'))));
	$("#text").scrollTop(scrollto);
}


$("document").ready(function() {
	setpage("lens");
	resize();
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
	$(window).resize(function() {
		resize();
	});
});