var translatorclass = ["italian poetry","longfellow poetry","norton","wright poetry"];
var translatorname = ["Dante Alighieri","Henry Wadsworth Longfellow","Charles Eliot Norton","S. Fowler Wright"];
var text = [];

var translation = 0;
var translations = 4;
var canto = 0;
var cantos = 4;
var percentage = 0;
var initialtextwidth = 0;


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
		$(tofix).css("padding","0 "+(initialtextwidth - maxwidth)/2+"px");
	} else {
// this is prose, standardized padding
		$(tofix).css("padding","0 80px");
	}
}

function recalclenssize() {
	lensheight = document.window.height() - $("nav").height();
	lenswidth = document.window.width();
	if(lenswidth > lensheight) {
		$("#lens").addClass("landscape").removeClass("portrait");
	} else {
		$("#lens").addClass("portrait").removeClass("landscape");
	}
	$("#navbar").css("width",lenswidth);
	$("#lens").css({"width":lenswidth,"height":lensheight});

}


function setlens(newtrans, newcanto) {
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
}


$("document").ready(function() {
	initialtextwidth = parseInt($("#text").css("width"),0);
	setlens(0,0);
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
});