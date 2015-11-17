# current problems:
#
# text centering needs to be reworked probably


text = []
currenttranslationlist = []

translation = 0
translations = translationdata.length
canto = 0
cantos = cantotitles.length
currentpage = "lens"

initialtextwidth = 0

lineheight = 24
lenswidth = 768  # assuming ipad in portrait
lensheight = 984 # assuming ipad in portrait


# borrowed

$.fn.textWidth = (text) ->
  org = $(this)
  html = $('<span style="postion:absolute;width:auto;left:-9999px">' + (text or org.html()) + '</span>')
  if !text
    html.css 'font-family', org.css('font-family')
    html.css 'font-size', org.css('font-size')
  $('body').append html
  width = html.width()
  html.remove()
  width


# setup

settranslationlist = ->
  for i of translationdata
    currenttranslationlist.push translationdata[i].translationid
  return


# general

setpage = (pageid) ->
  $('.page').removeClass 'on'
  $('.page#' + pageid).addClass 'on'
  currentpage = pageid
  return

resize = ->
  windowwidth = window.innerWidth
  windowheight = window.innerHeight
  lenswidth = windowwidth
  lensheight = windowheight - $('nav').height()
  if lenswidth > lensheight
    $('.page').addClass('landscape').removeClass 'portrait'
  else
    $('.page').addClass('portrait').removeClass 'landscape'
  $('#main').css
    'width': lenswidth + 'px'
    'height': windowheight + 'px'
  $('#content').css
    'width': lenswidth + 'px'
    'height': lensheight + 'px'
  initialtextwidth = parseInt($('#text').css('width'), 0)
  setlens translation, canto
  return


# settings

settings = ->
  thisid = undefined
  insert = undefined
  # add in translation chooser
  $('#translatorlist').remove()
  $('#translationchoose').append '<ul id="translatorlist"></div>'
  for i of translationdata
    $('#translatorlist').append '<li><input type="checkbox" id="' + translationdata[i].translationid + '" /><span id="' + translationdata[i].translationid + '" >' + translationdata[i].translationfullname + '</span></li>'
    $('input#' + translationdata[i].translationid).prop 'checked', currenttranslationlist.indexOf(translationdata[i].translationid) > -1
  $('#translatorlist :checkbox').click ->
    $this = $(this)
    changetranslation @id, $this.is(':checked')
    return
  $('#translatorlist span').click (e) ->
    $('input#' + @id).prop 'checked', !$('input#' + @id).prop('checked')
    changetranslation @id, $('input#' + @id).prop('checked')
    return
  # add in toc
  $('#selectors').remove()
  $('#translationgo').append '<div id="selectors"><p>Canto: <select id="selectcanto"></select></p><p>Translation: <select id="selecttranslator"></select></p><p><span id="selectgo">Go</span></p></div>'
  i = 0
  while i < cantos
    insert = if canto == i then 'selected' else ''
    $('select#selectcanto').append '<option id="canto' + i + '" ' + insert + '>' + cantotitles[i] + '</option>'
    i++
  for i of currenttranslationlist
    `i = i`
    insert = if translation == i then 'selected' else ''
    j = 0
    while j < translationdata.length
      if translationdata[j].translationid == currenttranslationlist[i]
        $('select#selecttranslator').append '<option id="tr_' + translationdata[j].translationid + '" ' + insert + '>' + translationdata[j].translationfullname + '</option>'
      j++
  $('#selectgo').click ->
    `var j`
    thistrans = $('#selecttranslator option:selected').attr('id').substr(3)
    thiscanto = parseInt($('#selectcanto option:selected').attr('id').substr(5))
    j = 0
    while j < translationdata.length
      if currenttranslationlist[j] == thistrans
        setpage 'lens'
        setlens j, thiscanto, 0
      j++
    return
  return

changetranslation = (thisid, isset) ->
  for i of translationdata
    if thisid == translationdata[i].translationid
      if isset
        currenttranslationlist.push thisid
        translations++
      else
        if translations > 1
          j = currenttranslationlist.indexOf(thisid)
          if j > -1
            currenttranslationlist.splice j, 1
          translations--
        else
          # there's only one translation in the list, do not delete last
          $('input#' + thisid.toLowerCase()).prop 'checked', true
  newlist = []
  for i of translationdata
    `i = i`
    if currenttranslationlist.indexOf(translationdata[i].translationid) > -1
      newlist.push translationdata[i].translationid
  currenttranslationlist = newlist.slice()
  # also what do we do when one is deleted?
  settings()
  return


# lens-specific

fixpadding = (tofix) ->
  if $(tofix).hasClass('poetry')
    maxwidth = 0
    $(tofix + ' p').each ->
      if $(this).textWidth() > maxwidth
        maxwidth = $(this).textWidth() + 18
        # a little padding is necessary (~font size?)
      return
    $(tofix).css
      'padding-left': (initialtextwidth - maxwidth) / 2 + 'px'
      'padding-right': (initialtextwidth - maxwidth) / 2 + 'px'
  else
    # this is prose, standardized padding
    desiredwidth = lineheight * 24
    # was 16
    #		console.log(lenswidth + " "+desiredwidth);
    padding = (lenswidth - desiredwidth) / 2
    #		console.log(padding);
    if desiredwidth + 20 > lenswidth
      $(tofix).css
        'padding-left': '10px'
        'padding-right': '10px'
    else
      $(tofix).css
        'padding-left': padding + 'px'
        'padding-right': padding + 'px'
  return

rounded = (h) ->
  lineheight * Math.floor(h / lineheight)

setlens = (newtrans, newcanto, percentage) ->
  changetrans = false
  currenttranslations = currenttranslationlist.length
  # if page isn't set to "lens" this doesn't do anything
  if currentpage == 'lens'
    if newtrans - translation != 0
      changetrans = true
      #	var percentage = ($("#text").scrollTop())/($("#text")[0].scrollHeight);
      percentage = rounded($('#text').scrollTop()) / $('#text').prop('scrollHeight')
    if newtrans >= currenttranslations
      newtrans = 0
    if newtrans < 0
      newtrans = currenttranslations - 1
    if newcanto >= cantos
      newcanto = 0
    if newcanto < 0
      newcanto = cantos - 1
    # figure out which translation is the current translation
    i = 0
    while i < translationdata.length
      if currenttranslationlist[newtrans] == translationdata[i].translationid
        newtrans = i
      i++
    $('#text').html(text[newtrans][newcanto]).removeClass(translationdata[translation].translationclass).addClass translationdata[newtrans].translationclass
    translation = newtrans
    canto = newcanto
    if canto > 0
      $('#navtitle').html translationdata[translation].translationshortname + ' · <strong>Canto ' + canto + '</strong>'
    else
      $('#navtitle').html '&nbsp;'
    fixpadding '#text', initialtextwidth
    if changetrans
      # this method still isn't great! it tries to round to current lineheight 
      # to avoid cutting off lines
      #var scrollto = rounded((currentpercentage * ($("#text")[0].scrollHeight)));
      scrollto = rounded(percentage * $('#text').prop('scrollHeight'))
      $('#text').scrollTop scrollto
    else
      if percentage > 0
        $('#text').scrollTop $('#text')[0].scrollHeight
      else
        $('#text').scrollTop 0
  return


# now start

$('document').ready ->
  settranslationlist()
  setpage 'lens'
  resize()
  # button controls
  $('#navprev').click ->
    setlens translation - 1, canto
    return
  $('#navnext').click ->
    setlens translation + 1, canto
    return
  $('#navup').click ->
    setlens translation, canto - 1
    return
  $('#navdown').click ->
    setlens translation, canto + 1
    return
  # swipe controls
  $('#lens').touchwipe
    wipeLeft: ->
      setlens translation + 1, canto
      return
    wipeRight: ->
      setlens translation - 1, canto
      return
    wipeUp: ->
      if $('#text').scrollTop() == 0
        setlens translation, canto - 1, 1
        # this needs to be at the bottom!
      return
    wipeDown: ->
      if ($('#text').scrollTop() + $('#text').outerHeight()) / $('#text').prop('scrollHeight') >= 1
        setlens translation, canto + 1
      return
    min_move_x: 40
    min_move_y: 40
    preventDefaultEvents: false
  # key controls
  $(document).keydown((e) ->
    e.preventDefault()
    if (e.keyCode or e.which) == 37
      $('#navprev').addClass 'on'
      setlens translation - 1, canto
    if (e.keyCode or e.which) == 39
      $('#navnext').addClass 'on'
      setlens translation + 1, canto
    if (e.keyCode or e.which) == 38
      $('#navup').addClass 'on'
      setlens translation, canto - 1
    if (e.keyCode or e.which) == 40
      $('#navdown').addClass 'on'
      setlens translation, canto + 1
    return
  ).keyup (e) ->
    e.preventDefault()
    $('.button').removeClass 'on'
    return
  # page controls
  $('#navtitle').click ->
    setpage 'lens'
    return
  $('#navsettings').click ->
    if currentpage == 'settings'
      setpage 'lens'
    else
      settings()
      setpage 'settings'
    return
  # resize listener
  $(window).resize ->
    resize()
    return
  return
