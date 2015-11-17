var canto, cantos, changetranslation, currentpage, currenttranslationlist, fixpadding, initialtextwidth, lensheight, lenswidth, lineheight, resize, rounded, setlens, setpage, settings, settranslationlist, text, translation, translations;

text = [];

currenttranslationlist = [];

translation = 0;

translations = translationdata.length;

canto = 0;

cantos = cantotitles.length;

currentpage = "lens";

initialtextwidth = 0;

lineheight = 24;

lenswidth = 768;

lensheight = 984;

$.fn.textWidth = function(text) {
  var html, org, width;
  org = $(this);
  html = $('<span style="postion:absolute;width:auto;left:-9999px">' + (text || org.html()) + '</span>');
  if (!text) {
    html.css('font-family', org.css('font-family'));
    html.css('font-size', org.css('font-size'));
  }
  $('body').append(html);
  width = html.width();
  html.remove();
  return width;
};

settranslationlist = function() {
  var i;
  for (i in translationdata) {
    currenttranslationlist.push(translationdata[i].translationid);
  }
};

setpage = function(pageid) {
  $('.page').removeClass('on');
  $('.page#' + pageid).addClass('on');
  currentpage = pageid;
};

resize = function() {
  var windowheight, windowwidth;
  windowwidth = window.innerWidth;
  windowheight = window.innerHeight;
  lenswidth = windowwidth;
  lensheight = windowheight - $('nav').height();
  if (lenswidth > lensheight) {
    $('.page').addClass('landscape').removeClass('portrait');
  } else {
    $('.page').addClass('portrait').removeClass('landscape');
  }
  $('#main').css({
    'width': lenswidth + 'px',
    'height': windowheight + 'px'
  });
  $('#content').css({
    'width': lenswidth + 'px',
    'height': lensheight + 'px'
  });
  initialtextwidth = parseInt($('#text').css('width'), 0);
  setlens(translation, canto);
};

settings = function() {
  var i, insert, j, thisid;
  thisid = void 0;
  insert = void 0;
  $('#translatorlist').remove();
  $('#translationchoose').append('<ul id="translatorlist"></div>');
  for (i in translationdata) {
    $('#translatorlist').append('<li><input type="checkbox" id="' + translationdata[i].translationid + '" /><span id="' + translationdata[i].translationid + '" >' + translationdata[i].translationfullname + '</span></li>');
    $('input#' + translationdata[i].translationid).prop('checked', currenttranslationlist.indexOf(translationdata[i].translationid) > -1);
  }
  $('#translatorlist :checkbox').click(function() {
    var $this;
    $this = $(this);
    changetranslation(this.id, $this.is(':checked'));
  });
  $('#translatorlist span').click(function(e) {
    $('input#' + this.id).prop('checked', !$('input#' + this.id).prop('checked'));
    changetranslation(this.id, $('input#' + this.id).prop('checked'));
  });
  $('#selectors').remove();
  $('#translationgo').append('<div id="selectors"><p>Canto: <select id="selectcanto"></select></p><p>Translation: <select id="selecttranslator"></select></p><p><span id="selectgo">Go</span></p></div>');
  i = 0;
  while (i < cantos) {
    insert = canto === i ? 'selected' : '';
    $('select#selectcanto').append('<option id="canto' + i + '" ' + insert + '>' + cantotitles[i] + '</option>');
    i++;
  }
  for (i in currenttranslationlist) {
    i = i;
    insert = translation === i ? 'selected' : '';
    j = 0;
    while (j < translationdata.length) {
      if (translationdata[j].translationid === currenttranslationlist[i]) {
        $('select#selecttranslator').append('<option id="tr_' + translationdata[j].translationid + '" ' + insert + '>' + translationdata[j].translationfullname + '</option>');
      }
      j++;
    }
  }
  $('#selectgo').click(function() {
    var j;
    var thiscanto, thistrans;
    thistrans = $('#selecttranslator option:selected').attr('id').substr(3);
    thiscanto = parseInt($('#selectcanto option:selected').attr('id').substr(5));
    j = 0;
    while (j < translationdata.length) {
      if (currenttranslationlist[j] === thistrans) {
        setpage('lens');
        setlens(j, thiscanto, 0);
      }
      j++;
    }
  });
};

changetranslation = function(thisid, isset) {
  var i, j, newlist;
  for (i in translationdata) {
    if (thisid === translationdata[i].translationid) {
      if (isset) {
        currenttranslationlist.push(thisid);
        translations++;
      } else {
        if (translations > 1) {
          j = currenttranslationlist.indexOf(thisid);
          if (j > -1) {
            currenttranslationlist.splice(j, 1);
          }
          translations--;
        } else {
          $('input#' + thisid.toLowerCase()).prop('checked', true);
        }
      }
    }
  }
  newlist = [];
  for (i in translationdata) {
    i = i;
    if (currenttranslationlist.indexOf(translationdata[i].translationid) > -1) {
      newlist.push(translationdata[i].translationid);
    }
  }
  currenttranslationlist = newlist.slice();
  settings();
};

fixpadding = function(tofix) {
  var desiredwidth, maxwidth, padding;
  if ($(tofix).hasClass('poetry')) {
    maxwidth = 0;
    $(tofix + ' p').each(function() {
      if ($(this).textWidth() > maxwidth) {
        maxwidth = $(this).textWidth() + 18;
      }
    });
    $(tofix).css({
      'padding-left': (initialtextwidth - maxwidth) / 2 + 'px',
      'padding-right': (initialtextwidth - maxwidth) / 2 + 'px'
    });
  } else {
    desiredwidth = lineheight * 24;
    padding = (lenswidth - desiredwidth) / 2;
    if (desiredwidth + 20 > lenswidth) {
      $(tofix).css({
        'padding-left': '10px',
        'padding-right': '10px'
      });
    } else {
      $(tofix).css({
        'padding-left': padding + 'px',
        'padding-right': padding + 'px'
      });
    }
  }
};

rounded = function(h) {
  return lineheight * Math.floor(h / lineheight);
};

setlens = function(newtrans, newcanto, percentage) {
  var changetrans, currenttranslations, i, scrollto;
  changetrans = false;
  currenttranslations = currenttranslationlist.length;
  if (currentpage === 'lens') {
    if (newtrans - translation !== 0) {
      changetrans = true;
      percentage = rounded($('#text').scrollTop()) / $('#text').prop('scrollHeight');
    }
    if (newtrans >= currenttranslations) {
      newtrans = 0;
    }
    if (newtrans < 0) {
      newtrans = currenttranslations - 1;
    }
    if (newcanto >= cantos) {
      newcanto = 0;
    }
    if (newcanto < 0) {
      newcanto = cantos - 1;
    }
    i = 0;
    while (i < translationdata.length) {
      if (currenttranslationlist[newtrans] === translationdata[i].translationid) {
        newtrans = i;
      }
      i++;
    }
    $('#text').html(text[newtrans][newcanto]).removeClass(translationdata[translation].translationclass).addClass(translationdata[newtrans].translationclass);
    translation = newtrans;
    canto = newcanto;
    if (canto > 0) {
      $('#navtitle').html(translationdata[translation].translationshortname + ' · <strong>Canto ' + canto + '</strong>');
    } else {
      $('#navtitle').html('&nbsp;');
    }
    fixpadding('#text', initialtextwidth);
    if (changetrans) {
      scrollto = rounded(percentage * $('#text').prop('scrollHeight'));
      $('#text').scrollTop(scrollto);
    } else {
      if (percentage > 0) {
        $('#text').scrollTop($('#text')[0].scrollHeight);
      } else {
        $('#text').scrollTop(0);
      }
    }
  }
};

$('document').ready(function() {
  settranslationlist();
  setpage('lens');
  resize();
  $('#navprev').click(function() {
    setlens(translation - 1, canto);
  });
  $('#navnext').click(function() {
    setlens(translation + 1, canto);
  });
  $('#navup').click(function() {
    setlens(translation, canto - 1);
  });
  $('#navdown').click(function() {
    setlens(translation, canto + 1);
  });
  $('#lens').touchwipe({
    wipeLeft: function() {
      setlens(translation + 1, canto);
    },
    wipeRight: function() {
      setlens(translation - 1, canto);
    },
    wipeUp: function() {
      if ($('#text').scrollTop() === 0) {
        setlens(translation, canto - 1, 1);
      }
    },
    wipeDown: function() {
      if (($('#text').scrollTop() + $('#text').outerHeight()) / $('#text').prop('scrollHeight') >= 1) {
        setlens(translation, canto + 1);
      }
    },
    min_move_x: 40,
    min_move_y: 40,
    preventDefaultEvents: false
  });
  $(document).keydown(function(e) {
    e.preventDefault();
    if ((e.keyCode || e.which) === 37) {
      $('#navprev').addClass('on');
      setlens(translation - 1, canto);
    }
    if ((e.keyCode || e.which) === 39) {
      $('#navnext').addClass('on');
      setlens(translation + 1, canto);
    }
    if ((e.keyCode || e.which) === 38) {
      $('#navup').addClass('on');
      setlens(translation, canto - 1);
    }
    if ((e.keyCode || e.which) === 40) {
      $('#navdown').addClass('on');
      setlens(translation, canto + 1);
    }
  }).keyup(function(e) {
    e.preventDefault();
    $('.button').removeClass('on');
  });
  $('#navtitle').click(function() {
    setpage('lens');
  });
  $('#navsettings').click(function() {
    if (currentpage === 'settings') {
      setpage('lens');
    } else {
      settings();
      setpage('settings');
    }
  });
  $(window).resize(function() {
    resize();
  });
});
