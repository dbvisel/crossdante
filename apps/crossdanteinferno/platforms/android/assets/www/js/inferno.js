(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
/*! VelocityJS.org (1.3.1). (C) 2014 Julian Shapiro. MIT @license: en.wikipedia.org/wiki/MIT_License */

/*************************
 Velocity jQuery Shim
 *************************/

/*! VelocityJS.org jQuery Shim (1.0.1). (C) 2014 The jQuery Foundation. MIT @license: en.wikipedia.org/wiki/MIT_License. */

/* This file contains the jQuery functions that Velocity relies on, thereby removing Velocity's dependency on a full copy of jQuery, and allowing it to work in any environment. */
/* These shimmed functions are only used if jQuery isn't present. If both this shim and jQuery are loaded, Velocity defaults to jQuery proper. */
/* Browser support: Using this shim instead of jQuery proper removes support for IE8. */

(function(window) {
	"use strict";
	/***************
	 Setup
	 ***************/

	/* If jQuery is already loaded, there's no point in loading this shim. */
	if (window.jQuery) {
		return;
	}

	/* jQuery base. */
	var $ = function(selector, context) {
		return new $.fn.init(selector, context);
	};

	/********************
	 Private Methods
	 ********************/

	/* jQuery */
	$.isWindow = function(obj) {
		/* jshint eqeqeq: false */
		return obj && obj === obj.window;
	};

	/* jQuery */
	$.type = function(obj) {
		if (!obj) {
			return obj + "";
		}

		return typeof obj === "object" || typeof obj === "function" ?
				class2type[toString.call(obj)] || "object" :
				typeof obj;
	};

	/* jQuery */
	$.isArray = Array.isArray || function(obj) {
		return $.type(obj) === "array";
	};

	/* jQuery */
	function isArraylike(obj) {
		var length = obj.length,
				type = $.type(obj);

		if (type === "function" || $.isWindow(obj)) {
			return false;
		}

		if (obj.nodeType === 1 && length) {
			return true;
		}

		return type === "array" || length === 0 || typeof length === "number" && length > 0 && (length - 1) in obj;
	}

	/***************
	 $ Methods
	 ***************/

	/* jQuery: Support removed for IE<9. */
	$.isPlainObject = function(obj) {
		var key;

		if (!obj || $.type(obj) !== "object" || obj.nodeType || $.isWindow(obj)) {
			return false;
		}

		try {
			if (obj.constructor &&
					!hasOwn.call(obj, "constructor") &&
					!hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
				return false;
			}
		} catch (e) {
			return false;
		}

		for (key in obj) {
		}

		return key === undefined || hasOwn.call(obj, key);
	};

	/* jQuery */
	$.each = function(obj, callback, args) {
		var value,
				i = 0,
				length = obj.length,
				isArray = isArraylike(obj);

		if (args) {
			if (isArray) {
				for (; i < length; i++) {
					value = callback.apply(obj[i], args);

					if (value === false) {
						break;
					}
				}
			} else {
				for (i in obj) {
					if (!obj.hasOwnProperty(i)) {
						continue;
					}
					value = callback.apply(obj[i], args);

					if (value === false) {
						break;
					}
				}
			}

		} else {
			if (isArray) {
				for (; i < length; i++) {
					value = callback.call(obj[i], i, obj[i]);

					if (value === false) {
						break;
					}
				}
			} else {
				for (i in obj) {
					if (!obj.hasOwnProperty(i)) {
						continue;
					}
					value = callback.call(obj[i], i, obj[i]);

					if (value === false) {
						break;
					}
				}
			}
		}

		return obj;
	};

	/* Custom */
	$.data = function(node, key, value) {
		/* $.getData() */
		if (value === undefined) {
			var getId = node[$.expando],
					store = getId && cache[getId];

			if (key === undefined) {
				return store;
			} else if (store) {
				if (key in store) {
					return store[key];
				}
			}
			/* $.setData() */
		} else if (key !== undefined) {
			var setId = node[$.expando] || (node[$.expando] = ++$.uuid);

			cache[setId] = cache[setId] || {};
			cache[setId][key] = value;

			return value;
		}
	};

	/* Custom */
	$.removeData = function(node, keys) {
		var id = node[$.expando],
				store = id && cache[id];

		if (store) {
			// Cleanup the entire store if no keys are provided.
			if (!keys) {
				delete cache[id];
			} else {
				$.each(keys, function(_, key) {
					delete store[key];
				});
			}
		}
	};

	/* jQuery */
	$.extend = function() {
		var src, copyIsArray, copy, name, options, clone,
				target = arguments[0] || {},
				i = 1,
				length = arguments.length,
				deep = false;

		if (typeof target === "boolean") {
			deep = target;

			target = arguments[i] || {};
			i++;
		}

		if (typeof target !== "object" && $.type(target) !== "function") {
			target = {};
		}

		if (i === length) {
			target = this;
			i--;
		}

		for (; i < length; i++) {
			if ((options = arguments[i])) {
				for (name in options) {
					if (!options.hasOwnProperty(name)) {
						continue;
					}
					src = target[name];
					copy = options[name];

					if (target === copy) {
						continue;
					}

					if (deep && copy && ($.isPlainObject(copy) || (copyIsArray = $.isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && $.isArray(src) ? src : [];

						} else {
							clone = src && $.isPlainObject(src) ? src : {};
						}

						target[name] = $.extend(deep, clone, copy);

					} else if (copy !== undefined) {
						target[name] = copy;
					}
				}
			}
		}

		return target;
	};

	/* jQuery 1.4.3 */
	$.queue = function(elem, type, data) {
		function $makeArray(arr, results) {
			var ret = results || [];

			if (arr) {
				if (isArraylike(Object(arr))) {
					/* $.merge */
					(function(first, second) {
						var len = +second.length,
								j = 0,
								i = first.length;

						while (j < len) {
							first[i++] = second[j++];
						}

						if (len !== len) {
							while (second[j] !== undefined) {
								first[i++] = second[j++];
							}
						}

						first.length = i;

						return first;
					})(ret, typeof arr === "string" ? [arr] : arr);
				} else {
					[].push.call(ret, arr);
				}
			}

			return ret;
		}

		if (!elem) {
			return;
		}

		type = (type || "fx") + "queue";

		var q = $.data(elem, type);

		if (!data) {
			return q || [];
		}

		if (!q || $.isArray(data)) {
			q = $.data(elem, type, $makeArray(data));
		} else {
			q.push(data);
		}

		return q;
	};

	/* jQuery 1.4.3 */
	$.dequeue = function(elems, type) {
		/* Custom: Embed element iteration. */
		$.each(elems.nodeType ? [elems] : elems, function(i, elem) {
			type = type || "fx";

			var queue = $.queue(elem, type),
					fn = queue.shift();

			if (fn === "inprogress") {
				fn = queue.shift();
			}

			if (fn) {
				if (type === "fx") {
					queue.unshift("inprogress");
				}

				fn.call(elem, function() {
					$.dequeue(elem, type);
				});
			}
		});
	};

	/******************
	 $.fn Methods
	 ******************/

	/* jQuery */
	$.fn = $.prototype = {
		init: function(selector) {
			/* Just return the element wrapped inside an array; don't proceed with the actual jQuery node wrapping process. */
			if (selector.nodeType) {
				this[0] = selector;

				return this;
			} else {
				throw new Error("Not a DOM node.");
			}
		},
		offset: function() {
			/* jQuery altered code: Dropped disconnected DOM node checking. */
			var box = this[0].getBoundingClientRect ? this[0].getBoundingClientRect() : {top: 0, left: 0};

			return {
				top: box.top + (window.pageYOffset || document.scrollTop || 0) - (document.clientTop || 0),
				left: box.left + (window.pageXOffset || document.scrollLeft || 0) - (document.clientLeft || 0)
			};
		},
		position: function() {
			/* jQuery */
			function offsetParentFn(elem) {
				var offsetParent = elem.offsetParent || document;

				while (offsetParent && (offsetParent.nodeType.toLowerCase !== "html" && offsetParent.style.position === "static")) {
					offsetParent = offsetParent.offsetParent;
				}

				return offsetParent || document;
			}

			/* Zepto */
			var elem = this[0],
					offsetParent = offsetParentFn(elem),
					offset = this.offset(),
					parentOffset = /^(?:body|html)$/i.test(offsetParent.nodeName) ? {top: 0, left: 0} : $(offsetParent).offset();

			offset.top -= parseFloat(elem.style.marginTop) || 0;
			offset.left -= parseFloat(elem.style.marginLeft) || 0;

			if (offsetParent.style) {
				parentOffset.top += parseFloat(offsetParent.style.borderTopWidth) || 0;
				parentOffset.left += parseFloat(offsetParent.style.borderLeftWidth) || 0;
			}

			return {
				top: offset.top - parentOffset.top,
				left: offset.left - parentOffset.left
			};
		}
	};

	/**********************
	 Private Variables
	 **********************/

	/* For $.data() */
	var cache = {};
	$.expando = "velocity" + (new Date().getTime());
	$.uuid = 0;

	/* For $.queue() */
	var class2type = {},
			hasOwn = class2type.hasOwnProperty,
			toString = class2type.toString;

	var types = "Boolean Number String Function Array Date RegExp Object Error".split(" ");
	for (var i = 0; i < types.length; i++) {
		class2type["[object " + types[i] + "]"] = types[i].toLowerCase();
	}

	/* Makes $(node) possible, without having to call init. */
	$.fn.init.prototype = $.fn;

	/* Globalize Velocity onto the window, and assign its Utilities property. */
	window.Velocity = {Utilities: $};
})(window);

/******************
 Velocity.js
 ******************/

(function(factory) {
	"use strict";
	/* CommonJS module. */
	if (typeof module === "object" && typeof module.exports === "object") {
		module.exports = factory();
		/* AMD module. */
	} else if (typeof define === "function" && define.amd) {
		define(factory);
		/* Browser globals. */
	} else {
		factory();
	}
}(function() {
	"use strict";
	return function(global, window, document, undefined) {

		/***************
		 Summary
		 ***************/

		/*
		 - CSS: CSS stack that works independently from the rest of Velocity.
		 - animate(): Core animation method that iterates over the targeted elements and queues the incoming call onto each element individually.
		 - Pre-Queueing: Prepare the element for animation by instantiating its data cache and processing the call's options.
		 - Queueing: The logic that runs once the call has reached its point of execution in the element's $.queue() stack.
		 Most logic is placed here to avoid risking it becoming stale (if the element's properties have changed).
		 - Pushing: Consolidation of the tween data followed by its push onto the global in-progress calls container.
		 - tick(): The single requestAnimationFrame loop responsible for tweening all in-progress calls.
		 - completeCall(): Handles the cleanup process for each Velocity call.
		 */

		/*********************
		 Helper Functions
		 *********************/

		/* IE detection. Gist: https://gist.github.com/julianshapiro/9098609 */
		var IE = (function() {
			if (document.documentMode) {
				return document.documentMode;
			} else {
				for (var i = 7; i > 4; i--) {
					var div = document.createElement("div");

					div.innerHTML = "<!--[if IE " + i + "]><span></span><![endif]-->";

					if (div.getElementsByTagName("span").length) {
						div = null;

						return i;
					}
				}
			}

			return undefined;
		})();

		/* rAF shim. Gist: https://gist.github.com/julianshapiro/9497513 */
		var rAFShim = (function() {
			var timeLast = 0;

			return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(callback) {
				var timeCurrent = (new Date()).getTime(),
						timeDelta;

				/* Dynamically set delay on a per-tick basis to match 60fps. */
				/* Technique by Erik Moller. MIT license: https://gist.github.com/paulirish/1579671 */
				timeDelta = Math.max(0, 16 - (timeCurrent - timeLast));
				timeLast = timeCurrent + timeDelta;

				return setTimeout(function() {
					callback(timeCurrent + timeDelta);
				}, timeDelta);
			};
		})();

		/* Array compacting. Copyright Lo-Dash. MIT License: https://github.com/lodash/lodash/blob/master/LICENSE.txt */
		function compactSparseArray(array) {
			var index = -1,
					length = array ? array.length : 0,
					result = [];

			while (++index < length) {
				var value = array[index];

				if (value) {
					result.push(value);
				}
			}

			return result;
		}

		function sanitizeElements(elements) {
			/* Unwrap jQuery/Zepto objects. */
			if (Type.isWrapped(elements)) {
				elements = [].slice.call(elements);
				/* Wrap a single element in an array so that $.each() can iterate with the element instead of its node's children. */
			} else if (Type.isNode(elements)) {
				elements = [elements];
			}

			return elements;
		}

		var Type = {
			isString: function(variable) {
				return (typeof variable === "string");
			},
			isArray: Array.isArray || function(variable) {
				return Object.prototype.toString.call(variable) === "[object Array]";
			},
			isFunction: function(variable) {
				return Object.prototype.toString.call(variable) === "[object Function]";
			},
			isNode: function(variable) {
				return variable && variable.nodeType;
			},
			/* Copyright Martin Bohm. MIT License: https://gist.github.com/Tomalak/818a78a226a0738eaade */
			isNodeList: function(variable) {
				return typeof variable === "object" &&
						/^\[object (HTMLCollection|NodeList|Object)\]$/.test(Object.prototype.toString.call(variable)) &&
						variable.length !== undefined &&
						(variable.length === 0 || (typeof variable[0] === "object" && variable[0].nodeType > 0));
			},
			/* Determine if variable is a wrapped jQuery or Zepto element. */
			isWrapped: function(variable) {
				return variable && (variable.jquery || (window.Zepto && window.Zepto.zepto.isZ(variable)));
			},
			isSVG: function(variable) {
				return window.SVGElement && (variable instanceof window.SVGElement);
			},
			isEmptyObject: function(variable) {
				for (var name in variable) {
					if (variable.hasOwnProperty(name)) {
						return false;
					}
				}

				return true;
			}
		};

		/*****************
		 Dependencies
		 *****************/

		var $,
				isJQuery = false;

		if (global.fn && global.fn.jquery) {
			$ = global;
			isJQuery = true;
		} else {
			$ = window.Velocity.Utilities;
		}

		if (IE <= 8 && !isJQuery) {
			throw new Error("Velocity: IE8 and below require jQuery to be loaded before Velocity.");
		} else if (IE <= 7) {
			/* Revert to jQuery's $.animate(), and lose Velocity's extra features. */
			jQuery.fn.velocity = jQuery.fn.animate;

			/* Now that $.fn.velocity is aliased, abort this Velocity declaration. */
			return;
		}

		/*****************
		 Constants
		 *****************/

		var DURATION_DEFAULT = 400,
				EASING_DEFAULT = "swing";

		/*************
		 State
		 *************/

		var Velocity = {
			/* Container for page-wide Velocity state data. */
			State: {
				/* Detect mobile devices to determine if mobileHA should be turned on. */
				isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
				/* The mobileHA option's behavior changes on older Android devices (Gingerbread, versions 2.3.3-2.3.7). */
				isAndroid: /Android/i.test(navigator.userAgent),
				isGingerbread: /Android 2\.3\.[3-7]/i.test(navigator.userAgent),
				isChrome: window.chrome,
				isFirefox: /Firefox/i.test(navigator.userAgent),
				/* Create a cached element for re-use when checking for CSS property prefixes. */
				prefixElement: document.createElement("div"),
				/* Cache every prefix match to avoid repeating lookups. */
				prefixMatches: {},
				/* Cache the anchor used for animating window scrolling. */
				scrollAnchor: null,
				/* Cache the browser-specific property names associated with the scroll anchor. */
				scrollPropertyLeft: null,
				scrollPropertyTop: null,
				/* Keep track of whether our RAF tick is running. */
				isTicking: false,
				/* Container for every in-progress call to Velocity. */
				calls: []
			},
			/* Velocity's custom CSS stack. Made global for unit testing. */
			CSS: { /* Defined below. */},
			/* A shim of the jQuery utility functions used by Velocity -- provided by Velocity's optional jQuery shim. */
			Utilities: $,
			/* Container for the user's custom animation redirects that are referenced by name in place of the properties map argument. */
			Redirects: { /* Manually registered by the user. */},
			Easings: { /* Defined below. */},
			/* Attempt to use ES6 Promises by default. Users can override this with a third-party promises library. */
			Promise: window.Promise,
			/* Velocity option defaults, which can be overriden by the user. */
			defaults: {
				queue: "",
				duration: DURATION_DEFAULT,
				easing: EASING_DEFAULT,
				begin: undefined,
				complete: undefined,
				progress: undefined,
				display: undefined,
				visibility: undefined,
				loop: false,
				delay: false,
				mobileHA: true,
				/* Advanced: Set to false to prevent property values from being cached between consecutive Velocity-initiated chain calls. */
				_cacheValues: true
			},
			/* A design goal of Velocity is to cache data wherever possible in order to avoid DOM requerying. Accordingly, each element has a data cache. */
			init: function(element) {
				$.data(element, "velocity", {
					/* Store whether this is an SVG element, since its properties are retrieved and updated differently than standard HTML elements. */
					isSVG: Type.isSVG(element),
					/* Keep track of whether the element is currently being animated by Velocity.
					 This is used to ensure that property values are not transferred between non-consecutive (stale) calls. */
					isAnimating: false,
					/* A reference to the element's live computedStyle object. Learn more here: https://developer.mozilla.org/en/docs/Web/API/window.getComputedStyle */
					computedStyle: null,
					/* Tween data is cached for each animation on the element so that data can be passed across calls --
					 in particular, end values are used as subsequent start values in consecutive Velocity calls. */
					tweensContainer: null,
					/* The full root property values of each CSS hook being animated on this element are cached so that:
					 1) Concurrently-animating hooks sharing the same root can have their root values' merged into one while tweening.
					 2) Post-hook-injection root values can be transferred over to consecutively chained Velocity calls as starting root values. */
					rootPropertyValueCache: {},
					/* A cache for transform updates, which must be manually flushed via CSS.flushTransformCache(). */
					transformCache: {}
				});
			},
			/* A parallel to jQuery's $.css(), used for getting/setting Velocity's hooked CSS properties. */
			hook: null, /* Defined below. */
			/* Velocity-wide animation time remapping for testing purposes. */
			mock: false,
			version: {major: 1, minor: 3, patch: 1},
			/* Set to 1 or 2 (most verbose) to output debug info to console. */
			debug: false
		};

		/* Retrieve the appropriate scroll anchor and property name for the browser: https://developer.mozilla.org/en-US/docs/Web/API/Window.scrollY */
		if (window.pageYOffset !== undefined) {
			Velocity.State.scrollAnchor = window;
			Velocity.State.scrollPropertyLeft = "pageXOffset";
			Velocity.State.scrollPropertyTop = "pageYOffset";
		} else {
			Velocity.State.scrollAnchor = document.documentElement || document.body.parentNode || document.body;
			Velocity.State.scrollPropertyLeft = "scrollLeft";
			Velocity.State.scrollPropertyTop = "scrollTop";
		}

		/* Shorthand alias for jQuery's $.data() utility. */
		function Data(element) {
			/* Hardcode a reference to the plugin name. */
			var response = $.data(element, "velocity");

			/* jQuery <=1.4.2 returns null instead of undefined when no match is found. We normalize this behavior. */
			return response === null ? undefined : response;
		}

		/**************
		 Easing
		 **************/

		/* Step easing generator. */
		function generateStep(steps) {
			return function(p) {
				return Math.round(p * steps) * (1 / steps);
			};
		}

		/* Bezier curve function generator. Copyright Gaetan Renaudeau. MIT License: http://en.wikipedia.org/wiki/MIT_License */
		function generateBezier(mX1, mY1, mX2, mY2) {
			var NEWTON_ITERATIONS = 4,
					NEWTON_MIN_SLOPE = 0.001,
					SUBDIVISION_PRECISION = 0.0000001,
					SUBDIVISION_MAX_ITERATIONS = 10,
					kSplineTableSize = 11,
					kSampleStepSize = 1.0 / (kSplineTableSize - 1.0),
					float32ArraySupported = "Float32Array" in window;

			/* Must contain four arguments. */
			if (arguments.length !== 4) {
				return false;
			}

			/* Arguments must be numbers. */
			for (var i = 0; i < 4; ++i) {
				if (typeof arguments[i] !== "number" || isNaN(arguments[i]) || !isFinite(arguments[i])) {
					return false;
				}
			}

			/* X values must be in the [0, 1] range. */
			mX1 = Math.min(mX1, 1);
			mX2 = Math.min(mX2, 1);
			mX1 = Math.max(mX1, 0);
			mX2 = Math.max(mX2, 0);

			var mSampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);

			function A(aA1, aA2) {
				return 1.0 - 3.0 * aA2 + 3.0 * aA1;
			}
			function B(aA1, aA2) {
				return 3.0 * aA2 - 6.0 * aA1;
			}
			function C(aA1) {
				return 3.0 * aA1;
			}

			function calcBezier(aT, aA1, aA2) {
				return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
			}

			function getSlope(aT, aA1, aA2) {
				return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
			}

			function newtonRaphsonIterate(aX, aGuessT) {
				for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
					var currentSlope = getSlope(aGuessT, mX1, mX2);

					if (currentSlope === 0.0) {
						return aGuessT;
					}

					var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
					aGuessT -= currentX / currentSlope;
				}

				return aGuessT;
			}

			function calcSampleValues() {
				for (var i = 0; i < kSplineTableSize; ++i) {
					mSampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
				}
			}

			function binarySubdivide(aX, aA, aB) {
				var currentX, currentT, i = 0;

				do {
					currentT = aA + (aB - aA) / 2.0;
					currentX = calcBezier(currentT, mX1, mX2) - aX;
					if (currentX > 0.0) {
						aB = currentT;
					} else {
						aA = currentT;
					}
				} while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);

				return currentT;
			}

			function getTForX(aX) {
				var intervalStart = 0.0,
						currentSample = 1,
						lastSample = kSplineTableSize - 1;

				for (; currentSample !== lastSample && mSampleValues[currentSample] <= aX; ++currentSample) {
					intervalStart += kSampleStepSize;
				}

				--currentSample;

				var dist = (aX - mSampleValues[currentSample]) / (mSampleValues[currentSample + 1] - mSampleValues[currentSample]),
						guessForT = intervalStart + dist * kSampleStepSize,
						initialSlope = getSlope(guessForT, mX1, mX2);

				if (initialSlope >= NEWTON_MIN_SLOPE) {
					return newtonRaphsonIterate(aX, guessForT);
				} else if (initialSlope === 0.0) {
					return guessForT;
				} else {
					return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize);
				}
			}

			var _precomputed = false;

			function precompute() {
				_precomputed = true;
				if (mX1 !== mY1 || mX2 !== mY2) {
					calcSampleValues();
				}
			}

			var f = function(aX) {
				if (!_precomputed) {
					precompute();
				}
				if (mX1 === mY1 && mX2 === mY2) {
					return aX;
				}
				if (aX === 0) {
					return 0;
				}
				if (aX === 1) {
					return 1;
				}

				return calcBezier(getTForX(aX), mY1, mY2);
			};

			f.getControlPoints = function() {
				return [{x: mX1, y: mY1}, {x: mX2, y: mY2}];
			};

			var str = "generateBezier(" + [mX1, mY1, mX2, mY2] + ")";
			f.toString = function() {
				return str;
			};

			return f;
		}

		/* Runge-Kutta spring physics function generator. Adapted from Framer.js, copyright Koen Bok. MIT License: http://en.wikipedia.org/wiki/MIT_License */
		/* Given a tension, friction, and duration, a simulation at 60FPS will first run without a defined duration in order to calculate the full path. A second pass
		 then adjusts the time delta -- using the relation between actual time and duration -- to calculate the path for the duration-constrained animation. */
		var generateSpringRK4 = (function() {
			function springAccelerationForState(state) {
				return (-state.tension * state.x) - (state.friction * state.v);
			}

			function springEvaluateStateWithDerivative(initialState, dt, derivative) {
				var state = {
					x: initialState.x + derivative.dx * dt,
					v: initialState.v + derivative.dv * dt,
					tension: initialState.tension,
					friction: initialState.friction
				};

				return {dx: state.v, dv: springAccelerationForState(state)};
			}

			function springIntegrateState(state, dt) {
				var a = {
					dx: state.v,
					dv: springAccelerationForState(state)
				},
				b = springEvaluateStateWithDerivative(state, dt * 0.5, a),
						c = springEvaluateStateWithDerivative(state, dt * 0.5, b),
						d = springEvaluateStateWithDerivative(state, dt, c),
						dxdt = 1.0 / 6.0 * (a.dx + 2.0 * (b.dx + c.dx) + d.dx),
						dvdt = 1.0 / 6.0 * (a.dv + 2.0 * (b.dv + c.dv) + d.dv);

				state.x = state.x + dxdt * dt;
				state.v = state.v + dvdt * dt;

				return state;
			}

			return function springRK4Factory(tension, friction, duration) {

				var initState = {
					x: -1,
					v: 0,
					tension: null,
					friction: null
				},
				path = [0],
						time_lapsed = 0,
						tolerance = 1 / 10000,
						DT = 16 / 1000,
						have_duration, dt, last_state;

				tension = parseFloat(tension) || 500;
				friction = parseFloat(friction) || 20;
				duration = duration || null;

				initState.tension = tension;
				initState.friction = friction;

				have_duration = duration !== null;

				/* Calculate the actual time it takes for this animation to complete with the provided conditions. */
				if (have_duration) {
					/* Run the simulation without a duration. */
					time_lapsed = springRK4Factory(tension, friction);
					/* Compute the adjusted time delta. */
					dt = time_lapsed / duration * DT;
				} else {
					dt = DT;
				}

				while (true) {
					/* Next/step function .*/
					last_state = springIntegrateState(last_state || initState, dt);
					/* Store the position. */
					path.push(1 + last_state.x);
					time_lapsed += 16;
					/* If the change threshold is reached, break. */
					if (!(Math.abs(last_state.x) > tolerance && Math.abs(last_state.v) > tolerance)) {
						break;
					}
				}

				/* If duration is not defined, return the actual time required for completing this animation. Otherwise, return a closure that holds the
				 computed path and returns a snapshot of the position according to a given percentComplete. */
				return !have_duration ? time_lapsed : function(percentComplete) {
					return path[ (percentComplete * (path.length - 1)) | 0 ];
				};
			};
		}());

		/* jQuery easings. */
		Velocity.Easings = {
			linear: function(p) {
				return p;
			},
			swing: function(p) {
				return 0.5 - Math.cos(p * Math.PI) / 2;
			},
			/* Bonus "spring" easing, which is a less exaggerated version of easeInOutElastic. */
			spring: function(p) {
				return 1 - (Math.cos(p * 4.5 * Math.PI) * Math.exp(-p * 6));
			}
		};

		/* CSS3 and Robert Penner easings. */
		$.each(
				[
					["ease", [0.25, 0.1, 0.25, 1.0]],
					["ease-in", [0.42, 0.0, 1.00, 1.0]],
					["ease-out", [0.00, 0.0, 0.58, 1.0]],
					["ease-in-out", [0.42, 0.0, 0.58, 1.0]],
					["easeInSine", [0.47, 0, 0.745, 0.715]],
					["easeOutSine", [0.39, 0.575, 0.565, 1]],
					["easeInOutSine", [0.445, 0.05, 0.55, 0.95]],
					["easeInQuad", [0.55, 0.085, 0.68, 0.53]],
					["easeOutQuad", [0.25, 0.46, 0.45, 0.94]],
					["easeInOutQuad", [0.455, 0.03, 0.515, 0.955]],
					["easeInCubic", [0.55, 0.055, 0.675, 0.19]],
					["easeOutCubic", [0.215, 0.61, 0.355, 1]],
					["easeInOutCubic", [0.645, 0.045, 0.355, 1]],
					["easeInQuart", [0.895, 0.03, 0.685, 0.22]],
					["easeOutQuart", [0.165, 0.84, 0.44, 1]],
					["easeInOutQuart", [0.77, 0, 0.175, 1]],
					["easeInQuint", [0.755, 0.05, 0.855, 0.06]],
					["easeOutQuint", [0.23, 1, 0.32, 1]],
					["easeInOutQuint", [0.86, 0, 0.07, 1]],
					["easeInExpo", [0.95, 0.05, 0.795, 0.035]],
					["easeOutExpo", [0.19, 1, 0.22, 1]],
					["easeInOutExpo", [1, 0, 0, 1]],
					["easeInCirc", [0.6, 0.04, 0.98, 0.335]],
					["easeOutCirc", [0.075, 0.82, 0.165, 1]],
					["easeInOutCirc", [0.785, 0.135, 0.15, 0.86]]
				], function(i, easingArray) {
			Velocity.Easings[easingArray[0]] = generateBezier.apply(null, easingArray[1]);
		});

		/* Determine the appropriate easing type given an easing input. */
		function getEasing(value, duration) {
			var easing = value;

			/* The easing option can either be a string that references a pre-registered easing,
			 or it can be a two-/four-item array of integers to be converted into a bezier/spring function. */
			if (Type.isString(value)) {
				/* Ensure that the easing has been assigned to jQuery's Velocity.Easings object. */
				if (!Velocity.Easings[value]) {
					easing = false;
				}
			} else if (Type.isArray(value) && value.length === 1) {
				easing = generateStep.apply(null, value);
			} else if (Type.isArray(value) && value.length === 2) {
				/* springRK4 must be passed the animation's duration. */
				/* Note: If the springRK4 array contains non-numbers, generateSpringRK4() returns an easing
				 function generated with default tension and friction values. */
				easing = generateSpringRK4.apply(null, value.concat([duration]));
			} else if (Type.isArray(value) && value.length === 4) {
				/* Note: If the bezier array contains non-numbers, generateBezier() returns false. */
				easing = generateBezier.apply(null, value);
			} else {
				easing = false;
			}

			/* Revert to the Velocity-wide default easing type, or fall back to "swing" (which is also jQuery's default)
			 if the Velocity-wide default has been incorrectly modified. */
			if (easing === false) {
				if (Velocity.Easings[Velocity.defaults.easing]) {
					easing = Velocity.defaults.easing;
				} else {
					easing = EASING_DEFAULT;
				}
			}

			return easing;
		}

		/*****************
		 CSS Stack
		 *****************/

		/* The CSS object is a highly condensed and performant CSS stack that fully replaces jQuery's.
		 It handles the validation, getting, and setting of both standard CSS properties and CSS property hooks. */
		/* Note: A "CSS" shorthand is aliased so that our code is easier to read. */
		var CSS = Velocity.CSS = {
			/*************
			 RegEx
			 *************/

			RegEx: {
				isHex: /^#([A-f\d]{3}){1,2}$/i,
				/* Unwrap a property value's surrounding text, e.g. "rgba(4, 3, 2, 1)" ==> "4, 3, 2, 1" and "rect(4px 3px 2px 1px)" ==> "4px 3px 2px 1px". */
				valueUnwrap: /^[A-z]+\((.*)\)$/i,
				wrappedValueAlreadyExtracted: /[0-9.]+ [0-9.]+ [0-9.]+( [0-9.]+)?/,
				/* Split a multi-value property into an array of subvalues, e.g. "rgba(4, 3, 2, 1) 4px 3px 2px 1px" ==> [ "rgba(4, 3, 2, 1)", "4px", "3px", "2px", "1px" ]. */
				valueSplit: /([A-z]+\(.+\))|(([A-z0-9#-.]+?)(?=\s|$))/ig
			},
			/************
			 Lists
			 ************/

			Lists: {
				colors: ["fill", "stroke", "stopColor", "color", "backgroundColor", "borderColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor", "outlineColor"],
				transformsBase: ["translateX", "translateY", "scale", "scaleX", "scaleY", "skewX", "skewY", "rotateZ"],
				transforms3D: ["transformPerspective", "translateZ", "scaleZ", "rotateX", "rotateY"]
			},
			/************
			 Hooks
			 ************/

			/* Hooks allow a subproperty (e.g. "boxShadowBlur") of a compound-value CSS property
			 (e.g. "boxShadow: X Y Blur Spread Color") to be animated as if it were a discrete property. */
			/* Note: Beyond enabling fine-grained property animation, hooking is necessary since Velocity only
			 tweens properties with single numeric values; unlike CSS transitions, Velocity does not interpolate compound-values. */
			Hooks: {
				/********************
				 Registration
				 ********************/

				/* Templates are a concise way of indicating which subproperties must be individually registered for each compound-value CSS property. */
				/* Each template consists of the compound-value's base name, its constituent subproperty names, and those subproperties' default values. */
				templates: {
					"textShadow": ["Color X Y Blur", "black 0px 0px 0px"],
					"boxShadow": ["Color X Y Blur Spread", "black 0px 0px 0px 0px"],
					"clip": ["Top Right Bottom Left", "0px 0px 0px 0px"],
					"backgroundPosition": ["X Y", "0% 0%"],
					"transformOrigin": ["X Y Z", "50% 50% 0px"],
					"perspectiveOrigin": ["X Y", "50% 50%"]
				},
				/* A "registered" hook is one that has been converted from its template form into a live,
				 tweenable property. It contains data to associate it with its root property. */
				registered: {
					/* Note: A registered hook looks like this ==> textShadowBlur: [ "textShadow", 3 ],
					 which consists of the subproperty's name, the associated root property's name,
					 and the subproperty's position in the root's value. */
				},
				/* Convert the templates into individual hooks then append them to the registered object above. */
				register: function() {
					/* Color hooks registration: Colors are defaulted to white -- as opposed to black -- since colors that are
					 currently set to "transparent" default to their respective template below when color-animated,
					 and white is typically a closer match to transparent than black is. An exception is made for text ("color"),
					 which is almost always set closer to black than white. */
					for (var i = 0; i < CSS.Lists.colors.length; i++) {
						var rgbComponents = (CSS.Lists.colors[i] === "color") ? "0 0 0 1" : "255 255 255 1";
						CSS.Hooks.templates[CSS.Lists.colors[i]] = ["Red Green Blue Alpha", rgbComponents];
					}

					var rootProperty,
							hookTemplate,
							hookNames;

					/* In IE, color values inside compound-value properties are positioned at the end the value instead of at the beginning.
					 Thus, we re-arrange the templates accordingly. */
					if (IE) {
						for (rootProperty in CSS.Hooks.templates) {
							if (!CSS.Hooks.templates.hasOwnProperty(rootProperty)) {
								continue;
							}
							hookTemplate = CSS.Hooks.templates[rootProperty];
							hookNames = hookTemplate[0].split(" ");

							var defaultValues = hookTemplate[1].match(CSS.RegEx.valueSplit);

							if (hookNames[0] === "Color") {
								/* Reposition both the hook's name and its default value to the end of their respective strings. */
								hookNames.push(hookNames.shift());
								defaultValues.push(defaultValues.shift());

								/* Replace the existing template for the hook's root property. */
								CSS.Hooks.templates[rootProperty] = [hookNames.join(" "), defaultValues.join(" ")];
							}
						}
					}

					/* Hook registration. */
					for (rootProperty in CSS.Hooks.templates) {
						if (!CSS.Hooks.templates.hasOwnProperty(rootProperty)) {
							continue;
						}
						hookTemplate = CSS.Hooks.templates[rootProperty];
						hookNames = hookTemplate[0].split(" ");

						for (var j in hookNames) {
							if (!hookNames.hasOwnProperty(j)) {
								continue;
							}
							var fullHookName = rootProperty + hookNames[j],
									hookPosition = j;

							/* For each hook, register its full name (e.g. textShadowBlur) with its root property (e.g. textShadow)
							 and the hook's position in its template's default value string. */
							CSS.Hooks.registered[fullHookName] = [rootProperty, hookPosition];
						}
					}
				},
				/*****************************
				 Injection and Extraction
				 *****************************/

				/* Look up the root property associated with the hook (e.g. return "textShadow" for "textShadowBlur"). */
				/* Since a hook cannot be set directly (the browser won't recognize it), style updating for hooks is routed through the hook's root property. */
				getRoot: function(property) {
					var hookData = CSS.Hooks.registered[property];

					if (hookData) {
						return hookData[0];
					} else {
						/* If there was no hook match, return the property name untouched. */
						return property;
					}
				},
				/* Convert any rootPropertyValue, null or otherwise, into a space-delimited list of hook values so that
				 the targeted hook can be injected or extracted at its standard position. */
				cleanRootPropertyValue: function(rootProperty, rootPropertyValue) {
					/* If the rootPropertyValue is wrapped with "rgb()", "clip()", etc., remove the wrapping to normalize the value before manipulation. */
					if (CSS.RegEx.valueUnwrap.test(rootPropertyValue)) {
						rootPropertyValue = rootPropertyValue.match(CSS.RegEx.valueUnwrap)[1];
					}

					/* If rootPropertyValue is a CSS null-value (from which there's inherently no hook value to extract),
					 default to the root's default value as defined in CSS.Hooks.templates. */
					/* Note: CSS null-values include "none", "auto", and "transparent". They must be converted into their
					 zero-values (e.g. textShadow: "none" ==> textShadow: "0px 0px 0px black") for hook manipulation to proceed. */
					if (CSS.Values.isCSSNullValue(rootPropertyValue)) {
						rootPropertyValue = CSS.Hooks.templates[rootProperty][1];
					}

					return rootPropertyValue;
				},
				/* Extracted the hook's value from its root property's value. This is used to get the starting value of an animating hook. */
				extractValue: function(fullHookName, rootPropertyValue) {
					var hookData = CSS.Hooks.registered[fullHookName];

					if (hookData) {
						var hookRoot = hookData[0],
								hookPosition = hookData[1];

						rootPropertyValue = CSS.Hooks.cleanRootPropertyValue(hookRoot, rootPropertyValue);

						/* Split rootPropertyValue into its constituent hook values then grab the desired hook at its standard position. */
						return rootPropertyValue.toString().match(CSS.RegEx.valueSplit)[hookPosition];
					} else {
						/* If the provided fullHookName isn't a registered hook, return the rootPropertyValue that was passed in. */
						return rootPropertyValue;
					}
				},
				/* Inject the hook's value into its root property's value. This is used to piece back together the root property
				 once Velocity has updated one of its individually hooked values through tweening. */
				injectValue: function(fullHookName, hookValue, rootPropertyValue) {
					var hookData = CSS.Hooks.registered[fullHookName];

					if (hookData) {
						var hookRoot = hookData[0],
								hookPosition = hookData[1],
								rootPropertyValueParts,
								rootPropertyValueUpdated;

						rootPropertyValue = CSS.Hooks.cleanRootPropertyValue(hookRoot, rootPropertyValue);

						/* Split rootPropertyValue into its individual hook values, replace the targeted value with hookValue,
						 then reconstruct the rootPropertyValue string. */
						rootPropertyValueParts = rootPropertyValue.toString().match(CSS.RegEx.valueSplit);
						rootPropertyValueParts[hookPosition] = hookValue;
						rootPropertyValueUpdated = rootPropertyValueParts.join(" ");

						return rootPropertyValueUpdated;
					} else {
						/* If the provided fullHookName isn't a registered hook, return the rootPropertyValue that was passed in. */
						return rootPropertyValue;
					}
				}
			},
			/*******************
			 Normalizations
			 *******************/

			/* Normalizations standardize CSS property manipulation by pollyfilling browser-specific implementations (e.g. opacity)
			 and reformatting special properties (e.g. clip, rgba) to look like standard ones. */
			Normalizations: {
				/* Normalizations are passed a normalization target (either the property's name, its extracted value, or its injected value),
				 the targeted element (which may need to be queried), and the targeted property value. */
				registered: {
					clip: function(type, element, propertyValue) {
						switch (type) {
							case "name":
								return "clip";
								/* Clip needs to be unwrapped and stripped of its commas during extraction. */
							case "extract":
								var extracted;

								/* If Velocity also extracted this value, skip extraction. */
								if (CSS.RegEx.wrappedValueAlreadyExtracted.test(propertyValue)) {
									extracted = propertyValue;
								} else {
									/* Remove the "rect()" wrapper. */
									extracted = propertyValue.toString().match(CSS.RegEx.valueUnwrap);

									/* Strip off commas. */
									extracted = extracted ? extracted[1].replace(/,(\s+)?/g, " ") : propertyValue;
								}

								return extracted;
								/* Clip needs to be re-wrapped during injection. */
							case "inject":
								return "rect(" + propertyValue + ")";
						}
					},
					blur: function(type, element, propertyValue) {
						switch (type) {
							case "name":
								return Velocity.State.isFirefox ? "filter" : "-webkit-filter";
							case "extract":
								var extracted = parseFloat(propertyValue);

								/* If extracted is NaN, meaning the value isn't already extracted. */
								if (!(extracted || extracted === 0)) {
									var blurComponent = propertyValue.toString().match(/blur\(([0-9]+[A-z]+)\)/i);

									/* If the filter string had a blur component, return just the blur value and unit type. */
									if (blurComponent) {
										extracted = blurComponent[1];
										/* If the component doesn't exist, default blur to 0. */
									} else {
										extracted = 0;
									}
								}

								return extracted;
								/* Blur needs to be re-wrapped during injection. */
							case "inject":
								/* For the blur effect to be fully de-applied, it needs to be set to "none" instead of 0. */
								if (!parseFloat(propertyValue)) {
									return "none";
								} else {
									return "blur(" + propertyValue + ")";
								}
						}
					},
					/* <=IE8 do not support the standard opacity property. They use filter:alpha(opacity=INT) instead. */
					opacity: function(type, element, propertyValue) {
						if (IE <= 8) {
							switch (type) {
								case "name":
									return "filter";
								case "extract":
									/* <=IE8 return a "filter" value of "alpha(opacity=\d{1,3})".
									 Extract the value and convert it to a decimal value to match the standard CSS opacity property's formatting. */
									var extracted = propertyValue.toString().match(/alpha\(opacity=(.*)\)/i);

									if (extracted) {
										/* Convert to decimal value. */
										propertyValue = extracted[1] / 100;
									} else {
										/* When extracting opacity, default to 1 since a null value means opacity hasn't been set. */
										propertyValue = 1;
									}

									return propertyValue;
								case "inject":
									/* Opacified elements are required to have their zoom property set to a non-zero value. */
									element.style.zoom = 1;

									/* Setting the filter property on elements with certain font property combinations can result in a
									 highly unappealing ultra-bolding effect. There's no way to remedy this throughout a tween, but dropping the
									 value altogether (when opacity hits 1) at leasts ensures that the glitch is gone post-tweening. */
									if (parseFloat(propertyValue) >= 1) {
										return "";
									} else {
										/* As per the filter property's spec, convert the decimal value to a whole number and wrap the value. */
										return "alpha(opacity=" + parseInt(parseFloat(propertyValue) * 100, 10) + ")";
									}
							}
							/* With all other browsers, normalization is not required; return the same values that were passed in. */
						} else {
							switch (type) {
								case "name":
									return "opacity";
								case "extract":
									return propertyValue;
								case "inject":
									return propertyValue;
							}
						}
					}
				},
				/*****************************
				 Batched Registrations
				 *****************************/

				/* Note: Batched normalizations extend the CSS.Normalizations.registered object. */
				register: function() {

					/*****************
					 Transforms
					 *****************/

					/* Transforms are the subproperties contained by the CSS "transform" property. Transforms must undergo normalization
					 so that they can be referenced in a properties map by their individual names. */
					/* Note: When transforms are "set", they are actually assigned to a per-element transformCache. When all transform
					 setting is complete complete, CSS.flushTransformCache() must be manually called to flush the values to the DOM.
					 Transform setting is batched in this way to improve performance: the transform style only needs to be updated
					 once when multiple transform subproperties are being animated simultaneously. */
					/* Note: IE9 and Android Gingerbread have support for 2D -- but not 3D -- transforms. Since animating unsupported
					 transform properties results in the browser ignoring the *entire* transform string, we prevent these 3D values
					 from being normalized for these browsers so that tweening skips these properties altogether
					 (since it will ignore them as being unsupported by the browser.) */
					if ((!IE || IE > 9) && !Velocity.State.isGingerbread) {
						/* Note: Since the standalone CSS "perspective" property and the CSS transform "perspective" subproperty
						 share the same name, the latter is given a unique token within Velocity: "transformPerspective". */
						CSS.Lists.transformsBase = CSS.Lists.transformsBase.concat(CSS.Lists.transforms3D);
					}

					for (var i = 0; i < CSS.Lists.transformsBase.length; i++) {
						/* Wrap the dynamically generated normalization function in a new scope so that transformName's value is
						 paired with its respective function. (Otherwise, all functions would take the final for loop's transformName.) */
						(function() {
							var transformName = CSS.Lists.transformsBase[i];

							CSS.Normalizations.registered[transformName] = function(type, element, propertyValue) {
								switch (type) {
									/* The normalized property name is the parent "transform" property -- the property that is actually set in CSS. */
									case "name":
										return "transform";
										/* Transform values are cached onto a per-element transformCache object. */
									case "extract":
										/* If this transform has yet to be assigned a value, return its null value. */
										if (Data(element) === undefined || Data(element).transformCache[transformName] === undefined) {
											/* Scale CSS.Lists.transformsBase default to 1 whereas all other transform properties default to 0. */
											return /^scale/i.test(transformName) ? 1 : 0;
											/* When transform values are set, they are wrapped in parentheses as per the CSS spec.
											 Thus, when extracting their values (for tween calculations), we strip off the parentheses. */
										}
										return Data(element).transformCache[transformName].replace(/[()]/g, "");
									case "inject":
										var invalid = false;

										/* If an individual transform property contains an unsupported unit type, the browser ignores the *entire* transform property.
										 Thus, protect users from themselves by skipping setting for transform values supplied with invalid unit types. */
										/* Switch on the base transform type; ignore the axis by removing the last letter from the transform's name. */
										switch (transformName.substr(0, transformName.length - 1)) {
											/* Whitelist unit types for each transform. */
											case "translate":
												invalid = !/(%|px|em|rem|vw|vh|\d)$/i.test(propertyValue);
												break;
												/* Since an axis-free "scale" property is supported as well, a little hack is used here to detect it by chopping off its last letter. */
											case "scal":
											case "scale":
												/* Chrome on Android has a bug in which scaled elements blur if their initial scale
												 value is below 1 (which can happen with forcefeeding). Thus, we detect a yet-unset scale property
												 and ensure that its first value is always 1. More info: http://stackoverflow.com/questions/10417890/css3-animations-with-transform-causes-blurred-elements-on-webkit/10417962#10417962 */
												if (Velocity.State.isAndroid && Data(element).transformCache[transformName] === undefined && propertyValue < 1) {
													propertyValue = 1;
												}

												invalid = !/(\d)$/i.test(propertyValue);
												break;
											case "skew":
												invalid = !/(deg|\d)$/i.test(propertyValue);
												break;
											case "rotate":
												invalid = !/(deg|\d)$/i.test(propertyValue);
												break;
										}

										if (!invalid) {
											/* As per the CSS spec, wrap the value in parentheses. */
											Data(element).transformCache[transformName] = "(" + propertyValue + ")";
										}

										/* Although the value is set on the transformCache object, return the newly-updated value for the calling code to process as normal. */
										return Data(element).transformCache[transformName];
								}
							};
						})();
					}

					/*************
					 Colors
					 *************/

					/* Since Velocity only animates a single numeric value per property, color animation is achieved by hooking the individual RGBA components of CSS color properties.
					 Accordingly, color values must be normalized (e.g. "#ff0000", "red", and "rgb(255, 0, 0)" ==> "255 0 0 1") so that their components can be injected/extracted by CSS.Hooks logic. */
					for (var j = 0; j < CSS.Lists.colors.length; j++) {
						/* Wrap the dynamically generated normalization function in a new scope so that colorName's value is paired with its respective function.
						 (Otherwise, all functions would take the final for loop's colorName.) */
						(function() {
							var colorName = CSS.Lists.colors[j];

							/* Note: In IE<=8, which support rgb but not rgba, color properties are reverted to rgb by stripping off the alpha component. */
							CSS.Normalizations.registered[colorName] = function(type, element, propertyValue) {
								switch (type) {
									case "name":
										return colorName;
										/* Convert all color values into the rgb format. (Old IE can return hex values and color names instead of rgb/rgba.) */
									case "extract":
										var extracted;

										/* If the color is already in its hookable form (e.g. "255 255 255 1") due to having been previously extracted, skip extraction. */
										if (CSS.RegEx.wrappedValueAlreadyExtracted.test(propertyValue)) {
											extracted = propertyValue;
										} else {
											var converted,
													colorNames = {
														black: "rgb(0, 0, 0)",
														blue: "rgb(0, 0, 255)",
														gray: "rgb(128, 128, 128)",
														green: "rgb(0, 128, 0)",
														red: "rgb(255, 0, 0)",
														white: "rgb(255, 255, 255)"
													};

											/* Convert color names to rgb. */
											if (/^[A-z]+$/i.test(propertyValue)) {
												if (colorNames[propertyValue] !== undefined) {
													converted = colorNames[propertyValue];
												} else {
													/* If an unmatched color name is provided, default to black. */
													converted = colorNames.black;
												}
												/* Convert hex values to rgb. */
											} else if (CSS.RegEx.isHex.test(propertyValue)) {
												converted = "rgb(" + CSS.Values.hexToRgb(propertyValue).join(" ") + ")";
												/* If the provided color doesn't match any of the accepted color formats, default to black. */
											} else if (!(/^rgba?\(/i.test(propertyValue))) {
												converted = colorNames.black;
											}

											/* Remove the surrounding "rgb/rgba()" string then replace commas with spaces and strip
											 repeated spaces (in case the value included spaces to begin with). */
											extracted = (converted || propertyValue).toString().match(CSS.RegEx.valueUnwrap)[1].replace(/,(\s+)?/g, " ");
										}

										/* So long as this isn't <=IE8, add a fourth (alpha) component if it's missing and default it to 1 (visible). */
										if ((!IE || IE > 8) && extracted.split(" ").length === 3) {
											extracted += " 1";
										}

										return extracted;
									case "inject":
										/* If this is IE<=8 and an alpha component exists, strip it off. */
										if (IE <= 8) {
											if (propertyValue.split(" ").length === 4) {
												propertyValue = propertyValue.split(/\s+/).slice(0, 3).join(" ");
											}
											/* Otherwise, add a fourth (alpha) component if it's missing and default it to 1 (visible). */
										} else if (propertyValue.split(" ").length === 3) {
											propertyValue += " 1";
										}

										/* Re-insert the browser-appropriate wrapper("rgb/rgba()"), insert commas, and strip off decimal units
										 on all values but the fourth (R, G, and B only accept whole numbers). */
										return (IE <= 8 ? "rgb" : "rgba") + "(" + propertyValue.replace(/\s+/g, ",").replace(/\.(\d)+(?=,)/g, "") + ")";
								}
							};
						})();
					}
				}
			},
			/************************
			 CSS Property Names
			 ************************/

			Names: {
				/* Camelcase a property name into its JavaScript notation (e.g. "background-color" ==> "backgroundColor").
				 Camelcasing is used to normalize property names between and across calls. */
				camelCase: function(property) {
					return property.replace(/-(\w)/g, function(match, subMatch) {
						return subMatch.toUpperCase();
					});
				},
				/* For SVG elements, some properties (namely, dimensional ones) are GET/SET via the element's HTML attributes (instead of via CSS styles). */
				SVGAttribute: function(property) {
					var SVGAttributes = "width|height|x|y|cx|cy|r|rx|ry|x1|x2|y1|y2";

					/* Certain browsers require an SVG transform to be applied as an attribute. (Otherwise, application via CSS is preferable due to 3D support.) */
					if (IE || (Velocity.State.isAndroid && !Velocity.State.isChrome)) {
						SVGAttributes += "|transform";
					}

					return new RegExp("^(" + SVGAttributes + ")$", "i").test(property);
				},
				/* Determine whether a property should be set with a vendor prefix. */
				/* If a prefixed version of the property exists, return it. Otherwise, return the original property name.
				 If the property is not at all supported by the browser, return a false flag. */
				prefixCheck: function(property) {
					/* If this property has already been checked, return the cached value. */
					if (Velocity.State.prefixMatches[property]) {
						return [Velocity.State.prefixMatches[property], true];
					} else {
						var vendors = ["", "Webkit", "Moz", "ms", "O"];

						for (var i = 0, vendorsLength = vendors.length; i < vendorsLength; i++) {
							var propertyPrefixed;

							if (i === 0) {
								propertyPrefixed = property;
							} else {
								/* Capitalize the first letter of the property to conform to JavaScript vendor prefix notation (e.g. webkitFilter). */
								propertyPrefixed = vendors[i] + property.replace(/^\w/, function(match) {
									return match.toUpperCase();
								});
							}

							/* Check if the browser supports this property as prefixed. */
							if (Type.isString(Velocity.State.prefixElement.style[propertyPrefixed])) {
								/* Cache the match. */
								Velocity.State.prefixMatches[property] = propertyPrefixed;

								return [propertyPrefixed, true];
							}
						}

						/* If the browser doesn't support this property in any form, include a false flag so that the caller can decide how to proceed. */
						return [property, false];
					}
				}
			},
			/************************
			 CSS Property Values
			 ************************/

			Values: {
				/* Hex to RGB conversion. Copyright Tim Down: http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb */
				hexToRgb: function(hex) {
					var shortformRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
							longformRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i,
							rgbParts;

					hex = hex.replace(shortformRegex, function(m, r, g, b) {
						return r + r + g + g + b + b;
					});

					rgbParts = longformRegex.exec(hex);

					return rgbParts ? [parseInt(rgbParts[1], 16), parseInt(rgbParts[2], 16), parseInt(rgbParts[3], 16)] : [0, 0, 0];
				},
				isCSSNullValue: function(value) {
					/* The browser defaults CSS values that have not been set to either 0 or one of several possible null-value strings.
					 Thus, we check for both falsiness and these special strings. */
					/* Null-value checking is performed to default the special strings to 0 (for the sake of tweening) or their hook
					 templates as defined as CSS.Hooks (for the sake of hook injection/extraction). */
					/* Note: Chrome returns "rgba(0, 0, 0, 0)" for an undefined color whereas IE returns "transparent". */
					return (!value || /^(none|auto|transparent|(rgba\(0, ?0, ?0, ?0\)))$/i.test(value));
				},
				/* Retrieve a property's default unit type. Used for assigning a unit type when one is not supplied by the user. */
				getUnitType: function(property) {
					if (/^(rotate|skew)/i.test(property)) {
						return "deg";
					} else if (/(^(scale|scaleX|scaleY|scaleZ|alpha|flexGrow|flexHeight|zIndex|fontWeight)$)|((opacity|red|green|blue|alpha)$)/i.test(property)) {
						/* The above properties are unitless. */
						return "";
					} else {
						/* Default to px for all other properties. */
						return "px";
					}
				},
				/* HTML elements default to an associated display type when they're not set to display:none. */
				/* Note: This function is used for correctly setting the non-"none" display value in certain Velocity redirects, such as fadeIn/Out. */
				getDisplayType: function(element) {
					var tagName = element && element.tagName.toString().toLowerCase();

					if (/^(b|big|i|small|tt|abbr|acronym|cite|code|dfn|em|kbd|strong|samp|var|a|bdo|br|img|map|object|q|script|span|sub|sup|button|input|label|select|textarea)$/i.test(tagName)) {
						return "inline";
					} else if (/^(li)$/i.test(tagName)) {
						return "list-item";
					} else if (/^(tr)$/i.test(tagName)) {
						return "table-row";
					} else if (/^(table)$/i.test(tagName)) {
						return "table";
					} else if (/^(tbody)$/i.test(tagName)) {
						return "table-row-group";
						/* Default to "block" when no match is found. */
					} else {
						return "block";
					}
				},
				/* The class add/remove functions are used to temporarily apply a "velocity-animating" class to elements while they're animating. */
				addClass: function(element, className) {
					if (element.classList) {
						element.classList.add(className);
					} else {
						element.className += (element.className.length ? " " : "") + className;
					}
				},
				removeClass: function(element, className) {
					if (element.classList) {
						element.classList.remove(className);
					} else {
						element.className = element.className.toString().replace(new RegExp("(^|\\s)" + className.split(" ").join("|") + "(\\s|$)", "gi"), " ");
					}
				}
			},
			/****************************
			 Style Getting & Setting
			 ****************************/

			/* The singular getPropertyValue, which routes the logic for all normalizations, hooks, and standard CSS properties. */
			getPropertyValue: function(element, property, rootPropertyValue, forceStyleLookup) {
				/* Get an element's computed property value. */
				/* Note: Retrieving the value of a CSS property cannot simply be performed by checking an element's
				 style attribute (which only reflects user-defined values). Instead, the browser must be queried for a property's
				 *computed* value. You can read more about getComputedStyle here: https://developer.mozilla.org/en/docs/Web/API/window.getComputedStyle */
				function computePropertyValue(element, property) {
					/* When box-sizing isn't set to border-box, height and width style values are incorrectly computed when an
					 element's scrollbars are visible (which expands the element's dimensions). Thus, we defer to the more accurate
					 offsetHeight/Width property, which includes the total dimensions for interior, border, padding, and scrollbar.
					 We subtract border and padding to get the sum of interior + scrollbar. */
					var computedValue = 0;

					/* IE<=8 doesn't support window.getComputedStyle, thus we defer to jQuery, which has an extensive array
					 of hacks to accurately retrieve IE8 property values. Re-implementing that logic here is not worth bloating the
					 codebase for a dying browser. The performance repercussions of using jQuery here are minimal since
					 Velocity is optimized to rarely (and sometimes never) query the DOM. Further, the $.css() codepath isn't that slow. */
					if (IE <= 8) {
						computedValue = $.css(element, property); /* GET */
						/* All other browsers support getComputedStyle. The returned live object reference is cached onto its
						 associated element so that it does not need to be refetched upon every GET. */
					} else {
						/* Browsers do not return height and width values for elements that are set to display:"none". Thus, we temporarily
						 toggle display to the element type's default value. */
						var toggleDisplay = false;

						if (/^(width|height)$/.test(property) && CSS.getPropertyValue(element, "display") === 0) {
							toggleDisplay = true;
							CSS.setPropertyValue(element, "display", CSS.Values.getDisplayType(element));
						}

						var revertDisplay = function() {
							if (toggleDisplay) {
								CSS.setPropertyValue(element, "display", "none");
							}
						};

						if (!forceStyleLookup) {
							if (property === "height" && CSS.getPropertyValue(element, "boxSizing").toString().toLowerCase() !== "border-box") {
								var contentBoxHeight = element.offsetHeight - (parseFloat(CSS.getPropertyValue(element, "borderTopWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "borderBottomWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingTop")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingBottom")) || 0);
								revertDisplay();

								return contentBoxHeight;
							} else if (property === "width" && CSS.getPropertyValue(element, "boxSizing").toString().toLowerCase() !== "border-box") {
								var contentBoxWidth = element.offsetWidth - (parseFloat(CSS.getPropertyValue(element, "borderLeftWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "borderRightWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingLeft")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingRight")) || 0);
								revertDisplay();

								return contentBoxWidth;
							}
						}

						var computedStyle;

						/* For elements that Velocity hasn't been called on directly (e.g. when Velocity queries the DOM on behalf
						 of a parent of an element its animating), perform a direct getComputedStyle lookup since the object isn't cached. */
						if (Data(element) === undefined) {
							computedStyle = window.getComputedStyle(element, null); /* GET */
							/* If the computedStyle object has yet to be cached, do so now. */
						} else if (!Data(element).computedStyle) {
							computedStyle = Data(element).computedStyle = window.getComputedStyle(element, null); /* GET */
							/* If computedStyle is cached, use it. */
						} else {
							computedStyle = Data(element).computedStyle;
						}

						/* IE and Firefox do not return a value for the generic borderColor -- they only return individual values for each border side's color.
						 Also, in all browsers, when border colors aren't all the same, a compound value is returned that Velocity isn't setup to parse.
						 So, as a polyfill for querying individual border side colors, we just return the top border's color and animate all borders from that value. */
						if (property === "borderColor") {
							property = "borderTopColor";
						}

						/* IE9 has a bug in which the "filter" property must be accessed from computedStyle using the getPropertyValue method
						 instead of a direct property lookup. The getPropertyValue method is slower than a direct lookup, which is why we avoid it by default. */
						if (IE === 9 && property === "filter") {
							computedValue = computedStyle.getPropertyValue(property); /* GET */
						} else {
							computedValue = computedStyle[property];
						}

						/* Fall back to the property's style value (if defined) when computedValue returns nothing,
						 which can happen when the element hasn't been painted. */
						if (computedValue === "" || computedValue === null) {
							computedValue = element.style[property];
						}

						revertDisplay();
					}

					/* For top, right, bottom, and left (TRBL) values that are set to "auto" on elements of "fixed" or "absolute" position,
					 defer to jQuery for converting "auto" to a numeric value. (For elements with a "static" or "relative" position, "auto" has the same
					 effect as being set to 0, so no conversion is necessary.) */
					/* An example of why numeric conversion is necessary: When an element with "position:absolute" has an untouched "left"
					 property, which reverts to "auto", left's value is 0 relative to its parent element, but is often non-zero relative
					 to its *containing* (not parent) element, which is the nearest "position:relative" ancestor or the viewport (and always the viewport in the case of "position:fixed"). */
					if (computedValue === "auto" && /^(top|right|bottom|left)$/i.test(property)) {
						var position = computePropertyValue(element, "position"); /* GET */

						/* For absolute positioning, jQuery's $.position() only returns values for top and left;
						 right and bottom will have their "auto" value reverted to 0. */
						/* Note: A jQuery object must be created here since jQuery doesn't have a low-level alias for $.position().
						 Not a big deal since we're currently in a GET batch anyway. */
						if (position === "fixed" || (position === "absolute" && /top|left/i.test(property))) {
							/* Note: jQuery strips the pixel unit from its returned values; we re-add it here to conform with computePropertyValue's behavior. */
							computedValue = $(element).position()[property] + "px"; /* GET */
						}
					}

					return computedValue;
				}

				var propertyValue;

				/* If this is a hooked property (e.g. "clipLeft" instead of the root property of "clip"),
				 extract the hook's value from a normalized rootPropertyValue using CSS.Hooks.extractValue(). */
				if (CSS.Hooks.registered[property]) {
					var hook = property,
							hookRoot = CSS.Hooks.getRoot(hook);

					/* If a cached rootPropertyValue wasn't passed in (which Velocity always attempts to do in order to avoid requerying the DOM),
					 query the DOM for the root property's value. */
					if (rootPropertyValue === undefined) {
						/* Since the browser is now being directly queried, use the official post-prefixing property name for this lookup. */
						rootPropertyValue = CSS.getPropertyValue(element, CSS.Names.prefixCheck(hookRoot)[0]); /* GET */
					}

					/* If this root has a normalization registered, peform the associated normalization extraction. */
					if (CSS.Normalizations.registered[hookRoot]) {
						rootPropertyValue = CSS.Normalizations.registered[hookRoot]("extract", element, rootPropertyValue);
					}

					/* Extract the hook's value. */
					propertyValue = CSS.Hooks.extractValue(hook, rootPropertyValue);

					/* If this is a normalized property (e.g. "opacity" becomes "filter" in <=IE8) or "translateX" becomes "transform"),
					 normalize the property's name and value, and handle the special case of transforms. */
					/* Note: Normalizing a property is mutually exclusive from hooking a property since hook-extracted values are strictly
					 numerical and therefore do not require normalization extraction. */
				} else if (CSS.Normalizations.registered[property]) {
					var normalizedPropertyName,
							normalizedPropertyValue;

					normalizedPropertyName = CSS.Normalizations.registered[property]("name", element);

					/* Transform values are calculated via normalization extraction (see below), which checks against the element's transformCache.
					 At no point do transform GETs ever actually query the DOM; initial stylesheet values are never processed.
					 This is because parsing 3D transform matrices is not always accurate and would bloat our codebase;
					 thus, normalization extraction defaults initial transform values to their zero-values (e.g. 1 for scaleX and 0 for translateX). */
					if (normalizedPropertyName !== "transform") {
						normalizedPropertyValue = computePropertyValue(element, CSS.Names.prefixCheck(normalizedPropertyName)[0]); /* GET */

						/* If the value is a CSS null-value and this property has a hook template, use that zero-value template so that hooks can be extracted from it. */
						if (CSS.Values.isCSSNullValue(normalizedPropertyValue) && CSS.Hooks.templates[property]) {
							normalizedPropertyValue = CSS.Hooks.templates[property][1];
						}
					}

					propertyValue = CSS.Normalizations.registered[property]("extract", element, normalizedPropertyValue);
				}

				/* If a (numeric) value wasn't produced via hook extraction or normalization, query the DOM. */
				if (!/^[\d-]/.test(propertyValue)) {
					/* For SVG elements, dimensional properties (which SVGAttribute() detects) are tweened via
					 their HTML attribute values instead of their CSS style values. */
					var data = Data(element);

					if (data && data.isSVG && CSS.Names.SVGAttribute(property)) {
						/* Since the height/width attribute values must be set manually, they don't reflect computed values.
						 Thus, we use use getBBox() to ensure we always get values for elements with undefined height/width attributes. */
						if (/^(height|width)$/i.test(property)) {
							/* Firefox throws an error if .getBBox() is called on an SVG that isn't attached to the DOM. */
							try {
								propertyValue = element.getBBox()[property];
							} catch (error) {
								propertyValue = 0;
							}
							/* Otherwise, access the attribute value directly. */
						} else {
							propertyValue = element.getAttribute(property);
						}
					} else {
						propertyValue = computePropertyValue(element, CSS.Names.prefixCheck(property)[0]); /* GET */
					}
				}

				/* Since property lookups are for animation purposes (which entails computing the numeric delta between start and end values),
				 convert CSS null-values to an integer of value 0. */
				if (CSS.Values.isCSSNullValue(propertyValue)) {
					propertyValue = 0;
				}

				if (Velocity.debug >= 2) {
					console.log("Get " + property + ": " + propertyValue);
				}

				return propertyValue;
			},
			/* The singular setPropertyValue, which routes the logic for all normalizations, hooks, and standard CSS properties. */
			setPropertyValue: function(element, property, propertyValue, rootPropertyValue, scrollData) {
				var propertyName = property;

				/* In order to be subjected to call options and element queueing, scroll animation is routed through Velocity as if it were a standard CSS property. */
				if (property === "scroll") {
					/* If a container option is present, scroll the container instead of the browser window. */
					if (scrollData.container) {
						scrollData.container["scroll" + scrollData.direction] = propertyValue;
						/* Otherwise, Velocity defaults to scrolling the browser window. */
					} else {
						if (scrollData.direction === "Left") {
							window.scrollTo(propertyValue, scrollData.alternateValue);
						} else {
							window.scrollTo(scrollData.alternateValue, propertyValue);
						}
					}
				} else {
					/* Transforms (translateX, rotateZ, etc.) are applied to a per-element transformCache object, which is manually flushed via flushTransformCache().
					 Thus, for now, we merely cache transforms being SET. */
					if (CSS.Normalizations.registered[property] && CSS.Normalizations.registered[property]("name", element) === "transform") {
						/* Perform a normalization injection. */
						/* Note: The normalization logic handles the transformCache updating. */
						CSS.Normalizations.registered[property]("inject", element, propertyValue);

						propertyName = "transform";
						propertyValue = Data(element).transformCache[property];
					} else {
						/* Inject hooks. */
						if (CSS.Hooks.registered[property]) {
							var hookName = property,
									hookRoot = CSS.Hooks.getRoot(property);

							/* If a cached rootPropertyValue was not provided, query the DOM for the hookRoot's current value. */
							rootPropertyValue = rootPropertyValue || CSS.getPropertyValue(element, hookRoot); /* GET */

							propertyValue = CSS.Hooks.injectValue(hookName, propertyValue, rootPropertyValue);
							property = hookRoot;
						}

						/* Normalize names and values. */
						if (CSS.Normalizations.registered[property]) {
							propertyValue = CSS.Normalizations.registered[property]("inject", element, propertyValue);
							property = CSS.Normalizations.registered[property]("name", element);
						}

						/* Assign the appropriate vendor prefix before performing an official style update. */
						propertyName = CSS.Names.prefixCheck(property)[0];

						/* A try/catch is used for IE<=8, which throws an error when "invalid" CSS values are set, e.g. a negative width.
						 Try/catch is avoided for other browsers since it incurs a performance overhead. */
						if (IE <= 8) {
							try {
								element.style[propertyName] = propertyValue;
							} catch (error) {
								if (Velocity.debug) {
									console.log("Browser does not support [" + propertyValue + "] for [" + propertyName + "]");
								}
							}
							/* SVG elements have their dimensional properties (width, height, x, y, cx, etc.) applied directly as attributes instead of as styles. */
							/* Note: IE8 does not support SVG elements, so it's okay that we skip it for SVG animation. */
						} else {
							var data = Data(element);

							if (data && data.isSVG && CSS.Names.SVGAttribute(property)) {
								/* Note: For SVG attributes, vendor-prefixed property names are never used. */
								/* Note: Not all CSS properties can be animated via attributes, but the browser won't throw an error for unsupported properties. */
								element.setAttribute(property, propertyValue);
							} else {
								element.style[propertyName] = propertyValue;
							}
						}

						if (Velocity.debug >= 2) {
							console.log("Set " + property + " (" + propertyName + "): " + propertyValue);
						}
					}
				}

				/* Return the normalized property name and value in case the caller wants to know how these values were modified before being applied to the DOM. */
				return [propertyName, propertyValue];
			},
			/* To increase performance by batching transform updates into a single SET, transforms are not directly applied to an element until flushTransformCache() is called. */
			/* Note: Velocity applies transform properties in the same order that they are chronogically introduced to the element's CSS styles. */
			flushTransformCache: function(element) {
				var transformString = "",
						data = Data(element);

				/* Certain browsers require that SVG transforms be applied as an attribute. However, the SVG transform attribute takes a modified version of CSS's transform string
				 (units are dropped and, except for skewX/Y, subproperties are merged into their master property -- e.g. scaleX and scaleY are merged into scale(X Y). */
				if ((IE || (Velocity.State.isAndroid && !Velocity.State.isChrome)) && data && data.isSVG) {
					/* Since transform values are stored in their parentheses-wrapped form, we use a helper function to strip out their numeric values.
					 Further, SVG transform properties only take unitless (representing pixels) values, so it's okay that parseFloat() strips the unit suffixed to the float value. */
					var getTransformFloat = function(transformProperty) {
						return parseFloat(CSS.getPropertyValue(element, transformProperty));
					};

					/* Create an object to organize all the transforms that we'll apply to the SVG element. To keep the logic simple,
					 we process *all* transform properties -- even those that may not be explicitly applied (since they default to their zero-values anyway). */
					var SVGTransforms = {
						translate: [getTransformFloat("translateX"), getTransformFloat("translateY")],
						skewX: [getTransformFloat("skewX")], skewY: [getTransformFloat("skewY")],
						/* If the scale property is set (non-1), use that value for the scaleX and scaleY values
						 (this behavior mimics the result of animating all these properties at once on HTML elements). */
						scale: getTransformFloat("scale") !== 1 ? [getTransformFloat("scale"), getTransformFloat("scale")] : [getTransformFloat("scaleX"), getTransformFloat("scaleY")],
						/* Note: SVG's rotate transform takes three values: rotation degrees followed by the X and Y values
						 defining the rotation's origin point. We ignore the origin values (default them to 0). */
						rotate: [getTransformFloat("rotateZ"), 0, 0]
					};

					/* Iterate through the transform properties in the user-defined property map order.
					 (This mimics the behavior of non-SVG transform animation.) */
					$.each(Data(element).transformCache, function(transformName) {
						/* Except for with skewX/Y, revert the axis-specific transform subproperties to their axis-free master
						 properties so that they match up with SVG's accepted transform properties. */
						if (/^translate/i.test(transformName)) {
							transformName = "translate";
						} else if (/^scale/i.test(transformName)) {
							transformName = "scale";
						} else if (/^rotate/i.test(transformName)) {
							transformName = "rotate";
						}

						/* Check that we haven't yet deleted the property from the SVGTransforms container. */
						if (SVGTransforms[transformName]) {
							/* Append the transform property in the SVG-supported transform format. As per the spec, surround the space-delimited values in parentheses. */
							transformString += transformName + "(" + SVGTransforms[transformName].join(" ") + ")" + " ";

							/* After processing an SVG transform property, delete it from the SVGTransforms container so we don't
							 re-insert the same master property if we encounter another one of its axis-specific properties. */
							delete SVGTransforms[transformName];
						}
					});
				} else {
					var transformValue,
							perspective;

					/* Transform properties are stored as members of the transformCache object. Concatenate all the members into a string. */
					$.each(Data(element).transformCache, function(transformName) {
						transformValue = Data(element).transformCache[transformName];

						/* Transform's perspective subproperty must be set first in order to take effect. Store it temporarily. */
						if (transformName === "transformPerspective") {
							perspective = transformValue;
							return true;
						}

						/* IE9 only supports one rotation type, rotateZ, which it refers to as "rotate". */
						if (IE === 9 && transformName === "rotateZ") {
							transformName = "rotate";
						}

						transformString += transformName + transformValue + " ";
					});

					/* If present, set the perspective subproperty first. */
					if (perspective) {
						transformString = "perspective" + perspective + " " + transformString;
					}
				}

				CSS.setPropertyValue(element, "transform", transformString);
			}
		};

		/* Register hooks and normalizations. */
		CSS.Hooks.register();
		CSS.Normalizations.register();

		/* Allow hook setting in the same fashion as jQuery's $.css(). */
		Velocity.hook = function(elements, arg2, arg3) {
			var value;

			elements = sanitizeElements(elements);

			$.each(elements, function(i, element) {
				/* Initialize Velocity's per-element data cache if this element hasn't previously been animated. */
				if (Data(element) === undefined) {
					Velocity.init(element);
				}

				/* Get property value. If an element set was passed in, only return the value for the first element. */
				if (arg3 === undefined) {
					if (value === undefined) {
						value = Velocity.CSS.getPropertyValue(element, arg2);
					}
					/* Set property value. */
				} else {
					/* sPV returns an array of the normalized propertyName/propertyValue pair used to update the DOM. */
					var adjustedSet = Velocity.CSS.setPropertyValue(element, arg2, arg3);

					/* Transform properties don't automatically set. They have to be flushed to the DOM. */
					if (adjustedSet[0] === "transform") {
						Velocity.CSS.flushTransformCache(element);
					}

					value = adjustedSet;
				}
			});

			return value;
		};

		/*****************
		 Animation
		 *****************/

		var animate = function() {
			var opts;

			/******************
			 Call Chain
			 ******************/

			/* Logic for determining what to return to the call stack when exiting out of Velocity. */
			function getChain() {
				/* If we are using the utility function, attempt to return this call's promise. If no promise library was detected,
				 default to null instead of returning the targeted elements so that utility function's return value is standardized. */
				if (isUtility) {
					return promiseData.promise || null;
					/* Otherwise, if we're using $.fn, return the jQuery-/Zepto-wrapped element set. */
				} else {
					return elementsWrapped;
				}
			}

			/*************************
			 Arguments Assignment
			 *************************/

			/* To allow for expressive CoffeeScript code, Velocity supports an alternative syntax in which "elements" (or "e"), "properties" (or "p"), and "options" (or "o")
			 objects are defined on a container object that's passed in as Velocity's sole argument. */
			/* Note: Some browsers automatically populate arguments with a "properties" object. We detect it by checking for its default "names" property. */
			var syntacticSugar = (arguments[0] && (arguments[0].p || (($.isPlainObject(arguments[0].properties) && !arguments[0].properties.names) || Type.isString(arguments[0].properties)))),
					/* Whether Velocity was called via the utility function (as opposed to on a jQuery/Zepto object). */
					isUtility,
					/* When Velocity is called via the utility function ($.Velocity()/Velocity()), elements are explicitly
					 passed in as the first parameter. Thus, argument positioning varies. We normalize them here. */
					elementsWrapped,
					argumentIndex;

			var elements,
					propertiesMap,
					options;

			/* Detect jQuery/Zepto elements being animated via the $.fn method. */
			if (Type.isWrapped(this)) {
				isUtility = false;

				argumentIndex = 0;
				elements = this;
				elementsWrapped = this;
				/* Otherwise, raw elements are being animated via the utility function. */
			} else {
				isUtility = true;

				argumentIndex = 1;
				elements = syntacticSugar ? (arguments[0].elements || arguments[0].e) : arguments[0];
			}

			elements = sanitizeElements(elements);

			if (!elements) {
				return;
			}

			if (syntacticSugar) {
				propertiesMap = arguments[0].properties || arguments[0].p;
				options = arguments[0].options || arguments[0].o;
			} else {
				propertiesMap = arguments[argumentIndex];
				options = arguments[argumentIndex + 1];
			}

			/* The length of the element set (in the form of a nodeList or an array of elements) is defaulted to 1 in case a
			 single raw DOM element is passed in (which doesn't contain a length property). */
			var elementsLength = elements.length,
					elementsIndex = 0;

			/***************************
			 Argument Overloading
			 ***************************/

			/* Support is included for jQuery's argument overloading: $.animate(propertyMap [, duration] [, easing] [, complete]).
			 Overloading is detected by checking for the absence of an object being passed into options. */
			/* Note: The stop and finish actions do not accept animation options, and are therefore excluded from this check. */
			if (!/^(stop|finish|finishAll)$/i.test(propertiesMap) && !$.isPlainObject(options)) {
				/* The utility function shifts all arguments one position to the right, so we adjust for that offset. */
				var startingArgumentPosition = argumentIndex + 1;

				options = {};

				/* Iterate through all options arguments */
				for (var i = startingArgumentPosition; i < arguments.length; i++) {
					/* Treat a number as a duration. Parse it out. */
					/* Note: The following RegEx will return true if passed an array with a number as its first item.
					 Thus, arrays are skipped from this check. */
					if (!Type.isArray(arguments[i]) && (/^(fast|normal|slow)$/i.test(arguments[i]) || /^\d/.test(arguments[i]))) {
						options.duration = arguments[i];
						/* Treat strings and arrays as easings. */
					} else if (Type.isString(arguments[i]) || Type.isArray(arguments[i])) {
						options.easing = arguments[i];
						/* Treat a function as a complete callback. */
					} else if (Type.isFunction(arguments[i])) {
						options.complete = arguments[i];
					}
				}
			}

			/***************
			 Promises
			 ***************/

			var promiseData = {
				promise: null,
				resolver: null,
				rejecter: null
			};

			/* If this call was made via the utility function (which is the default method of invocation when jQuery/Zepto are not being used), and if
			 promise support was detected, create a promise object for this call and store references to its resolver and rejecter methods. The resolve
			 method is used when a call completes naturally or is prematurely stopped by the user. In both cases, completeCall() handles the associated
			 call cleanup and promise resolving logic. The reject method is used when an invalid set of arguments is passed into a Velocity call. */
			/* Note: Velocity employs a call-based queueing architecture, which means that stopping an animating element actually stops the full call that
			 triggered it -- not that one element exclusively. Similarly, there is one promise per call, and all elements targeted by a Velocity call are
			 grouped together for the purposes of resolving and rejecting a promise. */
			if (isUtility && Velocity.Promise) {
				promiseData.promise = new Velocity.Promise(function(resolve, reject) {
					promiseData.resolver = resolve;
					promiseData.rejecter = reject;
				});
			}

			/*********************
			 Action Detection
			 *********************/

			/* Velocity's behavior is categorized into "actions": Elements can either be specially scrolled into view,
			 or they can be started, stopped, or reversed. If a literal or referenced properties map is passed in as Velocity's
			 first argument, the associated action is "start". Alternatively, "scroll", "reverse", or "stop" can be passed in instead of a properties map. */
			var action;

			switch (propertiesMap) {
				case "scroll":
					action = "scroll";
					break;

				case "reverse":
					action = "reverse";
					break;

				case "finish":
				case "finishAll":
				case "stop":
					/*******************
					 Action: Stop
					 *******************/

					/* Clear the currently-active delay on each targeted element. */
					$.each(elements, function(i, element) {
						if (Data(element) && Data(element).delayTimer) {
							/* Stop the timer from triggering its cached next() function. */
							clearTimeout(Data(element).delayTimer.setTimeout);

							/* Manually call the next() function so that the subsequent queue items can progress. */
							if (Data(element).delayTimer.next) {
								Data(element).delayTimer.next();
							}

							delete Data(element).delayTimer;
						}

						/* If we want to finish everything in the queue, we have to iterate through it
						 and call each function. This will make them active calls below, which will
						 cause them to be applied via the duration setting. */
						if (propertiesMap === "finishAll" && (options === true || Type.isString(options))) {
							/* Iterate through the items in the element's queue. */
							$.each($.queue(element, Type.isString(options) ? options : ""), function(_, item) {
								/* The queue array can contain an "inprogress" string, which we skip. */
								if (Type.isFunction(item)) {
									item();
								}
							});

							/* Clearing the $.queue() array is achieved by resetting it to []. */
							$.queue(element, Type.isString(options) ? options : "", []);
						}
					});

					var callsToStop = [];

					/* When the stop action is triggered, the elements' currently active call is immediately stopped. The active call might have
					 been applied to multiple elements, in which case all of the call's elements will be stopped. When an element
					 is stopped, the next item in its animation queue is immediately triggered. */
					/* An additional argument may be passed in to clear an element's remaining queued calls. Either true (which defaults to the "fx" queue)
					 or a custom queue string can be passed in. */
					/* Note: The stop command runs prior to Velocity's Queueing phase since its behavior is intended to take effect *immediately*,
					 regardless of the element's current queue state. */

					/* Iterate through every active call. */
					$.each(Velocity.State.calls, function(i, activeCall) {
						/* Inactive calls are set to false by the logic inside completeCall(). Skip them. */
						if (activeCall) {
							/* Iterate through the active call's targeted elements. */
							$.each(activeCall[1], function(k, activeElement) {
								/* If true was passed in as a secondary argument, clear absolutely all calls on this element. Otherwise, only
								 clear calls associated with the relevant queue. */
								/* Call stopping logic works as follows:
								 - options === true --> stop current default queue calls (and queue:false calls), including remaining queued ones.
								 - options === undefined --> stop current queue:"" call and all queue:false calls.
								 - options === false --> stop only queue:false calls.
								 - options === "custom" --> stop current queue:"custom" call, including remaining queued ones (there is no functionality to only clear the currently-running queue:"custom" call). */
								var queueName = (options === undefined) ? "" : options;

								if (queueName !== true && (activeCall[2].queue !== queueName) && !(options === undefined && activeCall[2].queue === false)) {
									return true;
								}

								/* Iterate through the calls targeted by the stop command. */
								$.each(elements, function(l, element) {
									/* Check that this call was applied to the target element. */
									if (element === activeElement) {
										/* Optionally clear the remaining queued calls. If we're doing "finishAll" this won't find anything,
										 due to the queue-clearing above. */
										if (options === true || Type.isString(options)) {
											/* Iterate through the items in the element's queue. */
											$.each($.queue(element, Type.isString(options) ? options : ""), function(_, item) {
												/* The queue array can contain an "inprogress" string, which we skip. */
												if (Type.isFunction(item)) {
													/* Pass the item's callback a flag indicating that we want to abort from the queue call.
													 (Specifically, the queue will resolve the call's associated promise then abort.)  */
													item(null, true);
												}
											});

											/* Clearing the $.queue() array is achieved by resetting it to []. */
											$.queue(element, Type.isString(options) ? options : "", []);
										}

										if (propertiesMap === "stop") {
											/* Since "reverse" uses cached start values (the previous call's endValues), these values must be
											 changed to reflect the final value that the elements were actually tweened to. */
											/* Note: If only queue:false animations are currently running on an element, it won't have a tweensContainer
											 object. Also, queue:false animations can't be reversed. */
											var data = Data(element);
											if (data && data.tweensContainer && queueName !== false) {
												$.each(data.tweensContainer, function(m, activeTween) {
													activeTween.endValue = activeTween.currentValue;
												});
											}

											callsToStop.push(i);
										} else if (propertiesMap === "finish" || propertiesMap === "finishAll") {
											/* To get active tweens to finish immediately, we forcefully shorten their durations to 1ms so that
											 they finish upon the next rAf tick then proceed with normal call completion logic. */
											activeCall[2].duration = 1;
										}
									}
								});
							});
						}
					});

					/* Prematurely call completeCall() on each matched active call. Pass an additional flag for "stop" to indicate
					 that the complete callback and display:none setting should be skipped since we're completing prematurely. */
					if (propertiesMap === "stop") {
						$.each(callsToStop, function(i, j) {
							completeCall(j, true);
						});

						if (promiseData.promise) {
							/* Immediately resolve the promise associated with this stop call since stop runs synchronously. */
							promiseData.resolver(elements);
						}
					}

					/* Since we're stopping, and not proceeding with queueing, exit out of Velocity. */
					return getChain();

				default:
					/* Treat a non-empty plain object as a literal properties map. */
					if ($.isPlainObject(propertiesMap) && !Type.isEmptyObject(propertiesMap)) {
						action = "start";

						/****************
						 Redirects
						 ****************/

						/* Check if a string matches a registered redirect (see Redirects above). */
					} else if (Type.isString(propertiesMap) && Velocity.Redirects[propertiesMap]) {
						opts = $.extend({}, options);

						var durationOriginal = opts.duration,
								delayOriginal = opts.delay || 0;

						/* If the backwards option was passed in, reverse the element set so that elements animate from the last to the first. */
						if (opts.backwards === true) {
							elements = $.extend(true, [], elements).reverse();
						}

						/* Individually trigger the redirect for each element in the set to prevent users from having to handle iteration logic in their redirect. */
						$.each(elements, function(elementIndex, element) {
							/* If the stagger option was passed in, successively delay each element by the stagger value (in ms). Retain the original delay value. */
							if (parseFloat(opts.stagger)) {
								opts.delay = delayOriginal + (parseFloat(opts.stagger) * elementIndex);
							} else if (Type.isFunction(opts.stagger)) {
								opts.delay = delayOriginal + opts.stagger.call(element, elementIndex, elementsLength);
							}

							/* If the drag option was passed in, successively increase/decrease (depending on the presense of opts.backwards)
							 the duration of each element's animation, using floors to prevent producing very short durations. */
							if (opts.drag) {
								/* Default the duration of UI pack effects (callouts and transitions) to 1000ms instead of the usual default duration of 400ms. */
								opts.duration = parseFloat(durationOriginal) || (/^(callout|transition)/.test(propertiesMap) ? 1000 : DURATION_DEFAULT);

								/* For each element, take the greater duration of: A) animation completion percentage relative to the original duration,
								 B) 75% of the original duration, or C) a 200ms fallback (in case duration is already set to a low value).
								 The end result is a baseline of 75% of the redirect's duration that increases/decreases as the end of the element set is approached. */
								opts.duration = Math.max(opts.duration * (opts.backwards ? 1 - elementIndex / elementsLength : (elementIndex + 1) / elementsLength), opts.duration * 0.75, 200);
							}

							/* Pass in the call's opts object so that the redirect can optionally extend it. It defaults to an empty object instead of null to
							 reduce the opts checking logic required inside the redirect. */
							Velocity.Redirects[propertiesMap].call(element, element, opts || {}, elementIndex, elementsLength, elements, promiseData.promise ? promiseData : undefined);
						});

						/* Since the animation logic resides within the redirect's own code, abort the remainder of this call.
						 (The performance overhead up to this point is virtually non-existant.) */
						/* Note: The jQuery call chain is kept intact by returning the complete element set. */
						return getChain();
					} else {
						var abortError = "Velocity: First argument (" + propertiesMap + ") was not a property map, a known action, or a registered redirect. Aborting.";

						if (promiseData.promise) {
							promiseData.rejecter(new Error(abortError));
						} else {
							console.log(abortError);
						}

						return getChain();
					}
			}

			/**************************
			 Call-Wide Variables
			 **************************/

			/* A container for CSS unit conversion ratios (e.g. %, rem, and em ==> px) that is used to cache ratios across all elements
			 being animated in a single Velocity call. Calculating unit ratios necessitates DOM querying and updating, and is therefore
			 avoided (via caching) wherever possible. This container is call-wide instead of page-wide to avoid the risk of using stale
			 conversion metrics across Velocity animations that are not immediately consecutively chained. */
			var callUnitConversionData = {
				lastParent: null,
				lastPosition: null,
				lastFontSize: null,
				lastPercentToPxWidth: null,
				lastPercentToPxHeight: null,
				lastEmToPx: null,
				remToPx: null,
				vwToPx: null,
				vhToPx: null
			};

			/* A container for all the ensuing tween data and metadata associated with this call. This container gets pushed to the page-wide
			 Velocity.State.calls array that is processed during animation ticking. */
			var call = [];

			/************************
			 Element Processing
			 ************************/

			/* Element processing consists of three parts -- data processing that cannot go stale and data processing that *can* go stale (i.e. third-party style modifications):
			 1) Pre-Queueing: Element-wide variables, including the element's data storage, are instantiated. Call options are prepared. If triggered, the Stop action is executed.
			 2) Queueing: The logic that runs once this call has reached its point of execution in the element's $.queue() stack. Most logic is placed here to avoid risking it becoming stale.
			 3) Pushing: Consolidation of the tween data followed by its push onto the global in-progress calls container.
			 `elementArrayIndex` allows passing index of the element in the original array to value functions.
			 If `elementsIndex` were used instead the index would be determined by the elements' per-element queue.
			 */
			function processElement(element, elementArrayIndex) {

				/*************************
				 Part I: Pre-Queueing
				 *************************/

				/***************************
				 Element-Wide Variables
				 ***************************/

				var /* The runtime opts object is the extension of the current call's options and Velocity's page-wide option defaults. */
						opts = $.extend({}, Velocity.defaults, options),
						/* A container for the processed data associated with each property in the propertyMap.
						 (Each property in the map produces its own "tween".) */
						tweensContainer = {},
						elementUnitConversionData;

				/******************
				 Element Init
				 ******************/

				if (Data(element) === undefined) {
					Velocity.init(element);
				}

				/******************
				 Option: Delay
				 ******************/

				/* Since queue:false doesn't respect the item's existing queue, we avoid injecting its delay here (it's set later on). */
				/* Note: Velocity rolls its own delay function since jQuery doesn't have a utility alias for $.fn.delay()
				 (and thus requires jQuery element creation, which we avoid since its overhead includes DOM querying). */
				if (parseFloat(opts.delay) && opts.queue !== false) {
					$.queue(element, opts.queue, function(next) {
						/* This is a flag used to indicate to the upcoming completeCall() function that this queue entry was initiated by Velocity. See completeCall() for further details. */
						Velocity.velocityQueueEntryFlag = true;

						/* The ensuing queue item (which is assigned to the "next" argument that $.queue() automatically passes in) will be triggered after a setTimeout delay.
						 The setTimeout is stored so that it can be subjected to clearTimeout() if this animation is prematurely stopped via Velocity's "stop" command. */
						Data(element).delayTimer = {
							setTimeout: setTimeout(next, parseFloat(opts.delay)),
							next: next
						};
					});
				}

				/*********************
				 Option: Duration
				 *********************/

				/* Support for jQuery's named durations. */
				switch (opts.duration.toString().toLowerCase()) {
					case "fast":
						opts.duration = 200;
						break;

					case "normal":
						opts.duration = DURATION_DEFAULT;
						break;

					case "slow":
						opts.duration = 600;
						break;

					default:
						/* Remove the potential "ms" suffix and default to 1 if the user is attempting to set a duration of 0 (in order to produce an immediate style change). */
						opts.duration = parseFloat(opts.duration) || 1;
				}

				/************************
				 Global Option: Mock
				 ************************/

				if (Velocity.mock !== false) {
					/* In mock mode, all animations are forced to 1ms so that they occur immediately upon the next rAF tick.
					 Alternatively, a multiplier can be passed in to time remap all delays and durations. */
					if (Velocity.mock === true) {
						opts.duration = opts.delay = 1;
					} else {
						opts.duration *= parseFloat(Velocity.mock) || 1;
						opts.delay *= parseFloat(Velocity.mock) || 1;
					}
				}

				/*******************
				 Option: Easing
				 *******************/

				opts.easing = getEasing(opts.easing, opts.duration);

				/**********************
				 Option: Callbacks
				 **********************/

				/* Callbacks must functions. Otherwise, default to null. */
				if (opts.begin && !Type.isFunction(opts.begin)) {
					opts.begin = null;
				}

				if (opts.progress && !Type.isFunction(opts.progress)) {
					opts.progress = null;
				}

				if (opts.complete && !Type.isFunction(opts.complete)) {
					opts.complete = null;
				}

				/*********************************
				 Option: Display & Visibility
				 *********************************/

				/* Refer to Velocity's documentation (VelocityJS.org/#displayAndVisibility) for a description of the display and visibility options' behavior. */
				/* Note: We strictly check for undefined instead of falsiness because display accepts an empty string value. */
				if (opts.display !== undefined && opts.display !== null) {
					opts.display = opts.display.toString().toLowerCase();

					/* Users can pass in a special "auto" value to instruct Velocity to set the element to its default display value. */
					if (opts.display === "auto") {
						opts.display = Velocity.CSS.Values.getDisplayType(element);
					}
				}

				if (opts.visibility !== undefined && opts.visibility !== null) {
					opts.visibility = opts.visibility.toString().toLowerCase();
				}

				/**********************
				 Option: mobileHA
				 **********************/

				/* When set to true, and if this is a mobile device, mobileHA automatically enables hardware acceleration (via a null transform hack)
				 on animating elements. HA is removed from the element at the completion of its animation. */
				/* Note: Android Gingerbread doesn't support HA. If a null transform hack (mobileHA) is in fact set, it will prevent other tranform subproperties from taking effect. */
				/* Note: You can read more about the use of mobileHA in Velocity's documentation: VelocityJS.org/#mobileHA. */
				opts.mobileHA = (opts.mobileHA && Velocity.State.isMobile && !Velocity.State.isGingerbread);

				/***********************
				 Part II: Queueing
				 ***********************/

				/* When a set of elements is targeted by a Velocity call, the set is broken up and each element has the current Velocity call individually queued onto it.
				 In this way, each element's existing queue is respected; some elements may already be animating and accordingly should not have this current Velocity call triggered immediately. */
				/* In each queue, tween data is processed for each animating property then pushed onto the call-wide calls array. When the last element in the set has had its tweens processed,
				 the call array is pushed to Velocity.State.calls for live processing by the requestAnimationFrame tick. */
				function buildQueue(next) {
					var data, lastTweensContainer;

					/*******************
					 Option: Begin
					 *******************/

					/* The begin callback is fired once per call -- not once per elemenet -- and is passed the full raw DOM element set as both its context and its first argument. */
					if (opts.begin && elementsIndex === 0) {
						/* We throw callbacks in a setTimeout so that thrown errors don't halt the execution of Velocity itself. */
						try {
							opts.begin.call(elements, elements);
						} catch (error) {
							setTimeout(function() {
								throw error;
							}, 1);
						}
					}

					/*****************************************
					 Tween Data Construction (for Scroll)
					 *****************************************/

					/* Note: In order to be subjected to chaining and animation options, scroll's tweening is routed through Velocity as if it were a standard CSS property animation. */
					if (action === "scroll") {
						/* The scroll action uniquely takes an optional "offset" option -- specified in pixels -- that offsets the targeted scroll position. */
						var scrollDirection = (/^x$/i.test(opts.axis) ? "Left" : "Top"),
								scrollOffset = parseFloat(opts.offset) || 0,
								scrollPositionCurrent,
								scrollPositionCurrentAlternate,
								scrollPositionEnd;

						/* Scroll also uniquely takes an optional "container" option, which indicates the parent element that should be scrolled --
						 as opposed to the browser window itself. This is useful for scrolling toward an element that's inside an overflowing parent element. */
						if (opts.container) {
							/* Ensure that either a jQuery object or a raw DOM element was passed in. */
							if (Type.isWrapped(opts.container) || Type.isNode(opts.container)) {
								/* Extract the raw DOM element from the jQuery wrapper. */
								opts.container = opts.container[0] || opts.container;
								/* Note: Unlike other properties in Velocity, the browser's scroll position is never cached since it so frequently changes
								 (due to the user's natural interaction with the page). */
								scrollPositionCurrent = opts.container["scroll" + scrollDirection]; /* GET */

								/* $.position() values are relative to the container's currently viewable area (without taking into account the container's true dimensions
								 -- say, for example, if the container was not overflowing). Thus, the scroll end value is the sum of the child element's position *and*
								 the scroll container's current scroll position. */
								scrollPositionEnd = (scrollPositionCurrent + $(element).position()[scrollDirection.toLowerCase()]) + scrollOffset; /* GET */
								/* If a value other than a jQuery object or a raw DOM element was passed in, default to null so that this option is ignored. */
							} else {
								opts.container = null;
							}
						} else {
							/* If the window itself is being scrolled -- not a containing element -- perform a live scroll position lookup using
							 the appropriate cached property names (which differ based on browser type). */
							scrollPositionCurrent = Velocity.State.scrollAnchor[Velocity.State["scrollProperty" + scrollDirection]]; /* GET */
							/* When scrolling the browser window, cache the alternate axis's current value since window.scrollTo() doesn't let us change only one value at a time. */
							scrollPositionCurrentAlternate = Velocity.State.scrollAnchor[Velocity.State["scrollProperty" + (scrollDirection === "Left" ? "Top" : "Left")]]; /* GET */

							/* Unlike $.position(), $.offset() values are relative to the browser window's true dimensions -- not merely its currently viewable area --
							 and therefore end values do not need to be compounded onto current values. */
							scrollPositionEnd = $(element).offset()[scrollDirection.toLowerCase()] + scrollOffset; /* GET */
						}

						/* Since there's only one format that scroll's associated tweensContainer can take, we create it manually. */
						tweensContainer = {
							scroll: {
								rootPropertyValue: false,
								startValue: scrollPositionCurrent,
								currentValue: scrollPositionCurrent,
								endValue: scrollPositionEnd,
								unitType: "",
								easing: opts.easing,
								scrollData: {
									container: opts.container,
									direction: scrollDirection,
									alternateValue: scrollPositionCurrentAlternate
								}
							},
							element: element
						};

						if (Velocity.debug) {
							console.log("tweensContainer (scroll): ", tweensContainer.scroll, element);
						}

						/******************************************
						 Tween Data Construction (for Reverse)
						 ******************************************/

						/* Reverse acts like a "start" action in that a property map is animated toward. The only difference is
						 that the property map used for reverse is the inverse of the map used in the previous call. Thus, we manipulate
						 the previous call to construct our new map: use the previous map's end values as our new map's start values. Copy over all other data. */
						/* Note: Reverse can be directly called via the "reverse" parameter, or it can be indirectly triggered via the loop option. (Loops are composed of multiple reverses.) */
						/* Note: Reverse calls do not need to be consecutively chained onto a currently-animating element in order to operate on cached values;
						 there is no harm to reverse being called on a potentially stale data cache since reverse's behavior is simply defined
						 as reverting to the element's values as they were prior to the previous *Velocity* call. */
					} else if (action === "reverse") {
						data = Data(element);

						/* Abort if there is no prior animation data to reverse to. */
						if (!data) {
							return;
						}

						if (!data.tweensContainer) {
							/* Dequeue the element so that this queue entry releases itself immediately, allowing subsequent queue entries to run. */
							$.dequeue(element, opts.queue);

							return;
						} else {
							/*********************
							 Options Parsing
							 *********************/

							/* If the element was hidden via the display option in the previous call,
							 revert display to "auto" prior to reversal so that the element is visible again. */
							if (data.opts.display === "none") {
								data.opts.display = "auto";
							}

							if (data.opts.visibility === "hidden") {
								data.opts.visibility = "visible";
							}

							/* If the loop option was set in the previous call, disable it so that "reverse" calls aren't recursively generated.
							 Further, remove the previous call's callback options; typically, users do not want these to be refired. */
							data.opts.loop = false;
							data.opts.begin = null;
							data.opts.complete = null;

							/* Since we're extending an opts object that has already been extended with the defaults options object,
							 we remove non-explicitly-defined properties that are auto-assigned values. */
							if (!options.easing) {
								delete opts.easing;
							}

							if (!options.duration) {
								delete opts.duration;
							}

							/* The opts object used for reversal is an extension of the options object optionally passed into this
							 reverse call plus the options used in the previous Velocity call. */
							opts = $.extend({}, data.opts, opts);

							/*************************************
							 Tweens Container Reconstruction
							 *************************************/

							/* Create a deepy copy (indicated via the true flag) of the previous call's tweensContainer. */
							lastTweensContainer = $.extend(true, {}, data ? data.tweensContainer : null);

							/* Manipulate the previous tweensContainer by replacing its end values and currentValues with its start values. */
							for (var lastTween in lastTweensContainer) {
								/* In addition to tween data, tweensContainers contain an element property that we ignore here. */
								if (lastTweensContainer.hasOwnProperty(lastTween) && lastTween !== "element") {
									var lastStartValue = lastTweensContainer[lastTween].startValue;

									lastTweensContainer[lastTween].startValue = lastTweensContainer[lastTween].currentValue = lastTweensContainer[lastTween].endValue;
									lastTweensContainer[lastTween].endValue = lastStartValue;

									/* Easing is the only option that embeds into the individual tween data (since it can be defined on a per-property basis).
									 Accordingly, every property's easing value must be updated when an options object is passed in with a reverse call.
									 The side effect of this extensibility is that all per-property easing values are forcefully reset to the new value. */
									if (!Type.isEmptyObject(options)) {
										lastTweensContainer[lastTween].easing = opts.easing;
									}

									if (Velocity.debug) {
										console.log("reverse tweensContainer (" + lastTween + "): " + JSON.stringify(lastTweensContainer[lastTween]), element);
									}
								}
							}

							tweensContainer = lastTweensContainer;
						}

						/*****************************************
						 Tween Data Construction (for Start)
						 *****************************************/

					} else if (action === "start") {

						/*************************
						 Value Transferring
						 *************************/

						/* If this queue entry follows a previous Velocity-initiated queue entry *and* if this entry was created
						 while the element was in the process of being animated by Velocity, then this current call is safe to use
						 the end values from the prior call as its start values. Velocity attempts to perform this value transfer
						 process whenever possible in order to avoid requerying the DOM. */
						/* If values aren't transferred from a prior call and start values were not forcefed by the user (more on this below),
						 then the DOM is queried for the element's current values as a last resort. */
						/* Note: Conversely, animation reversal (and looping) *always* perform inter-call value transfers; they never requery the DOM. */

						data = Data(element);

						/* The per-element isAnimating flag is used to indicate whether it's safe (i.e. the data isn't stale)
						 to transfer over end values to use as start values. If it's set to true and there is a previous
						 Velocity call to pull values from, do so. */
						if (data && data.tweensContainer && data.isAnimating === true) {
							lastTweensContainer = data.tweensContainer;
						}

						/***************************
						 Tween Data Calculation
						 ***************************/

						/* This function parses property data and defaults endValue, easing, and startValue as appropriate. */
						/* Property map values can either take the form of 1) a single value representing the end value,
						 or 2) an array in the form of [ endValue, [, easing] [, startValue] ].
						 The optional third parameter is a forcefed startValue to be used instead of querying the DOM for
						 the element's current value. Read Velocity's docmentation to learn more about forcefeeding: VelocityJS.org/#forcefeeding */
						var parsePropertyValue = function(valueData, skipResolvingEasing) {
							var endValue, easing, startValue;

							/* Handle the array format, which can be structured as one of three potential overloads:
							 A) [ endValue, easing, startValue ], B) [ endValue, easing ], or C) [ endValue, startValue ] */
							if (Type.isArray(valueData)) {
								/* endValue is always the first item in the array. Don't bother validating endValue's value now
								 since the ensuing property cycling logic does that. */
								endValue = valueData[0];

								/* Two-item array format: If the second item is a number, function, or hex string, treat it as a
								 start value since easings can only be non-hex strings or arrays. */
								if ((!Type.isArray(valueData[1]) && /^[\d-]/.test(valueData[1])) || Type.isFunction(valueData[1]) || CSS.RegEx.isHex.test(valueData[1])) {
									startValue = valueData[1];
									/* Two or three-item array: If the second item is a non-hex string or an array, treat it as an easing. */
								} else if ((Type.isString(valueData[1]) && !CSS.RegEx.isHex.test(valueData[1])) || Type.isArray(valueData[1])) {
									easing = skipResolvingEasing ? valueData[1] : getEasing(valueData[1], opts.duration);

									/* Don't bother validating startValue's value now since the ensuing property cycling logic inherently does that. */
									if (valueData[2] !== undefined) {
										startValue = valueData[2];
									}
								}
								/* Handle the single-value format. */
							} else {
								endValue = valueData;
							}

							/* Default to the call's easing if a per-property easing type was not defined. */
							if (!skipResolvingEasing) {
								easing = easing || opts.easing;
							}

							/* If functions were passed in as values, pass the function the current element as its context,
							 plus the element's index and the element set's size as arguments. Then, assign the returned value. */
							if (Type.isFunction(endValue)) {
								endValue = endValue.call(element, elementArrayIndex, elementsLength);
							}

							if (Type.isFunction(startValue)) {
								startValue = startValue.call(element, elementArrayIndex, elementsLength);
							}

							/* Allow startValue to be left as undefined to indicate to the ensuing code that its value was not forcefed. */
							return [endValue || 0, easing, startValue];
						};

						/* Cycle through each property in the map, looking for shorthand color properties (e.g. "color" as opposed to "colorRed"). Inject the corresponding
						 colorRed, colorGreen, and colorBlue RGB component tweens into the propertiesMap (which Velocity understands) and remove the shorthand property. */
						$.each(propertiesMap, function(property, value) {
							/* Find shorthand color properties that have been passed a hex string. */
							if (RegExp("^" + CSS.Lists.colors.join("$|^") + "$").test(CSS.Names.camelCase(property))) {
								/* Parse the value data for each shorthand. */
								var valueData = parsePropertyValue(value, true),
										endValue = valueData[0],
										easing = valueData[1],
										startValue = valueData[2];

								if (CSS.RegEx.isHex.test(endValue)) {
									/* Convert the hex strings into their RGB component arrays. */
									var colorComponents = ["Red", "Green", "Blue"],
											endValueRGB = CSS.Values.hexToRgb(endValue),
											startValueRGB = startValue ? CSS.Values.hexToRgb(startValue) : undefined;

									/* Inject the RGB component tweens into propertiesMap. */
									for (var i = 0; i < colorComponents.length; i++) {
										var dataArray = [endValueRGB[i]];

										if (easing) {
											dataArray.push(easing);
										}

										if (startValueRGB !== undefined) {
											dataArray.push(startValueRGB[i]);
										}

										propertiesMap[CSS.Names.camelCase(property) + colorComponents[i]] = dataArray;
									}

									/* Remove the intermediary shorthand property entry now that we've processed it. */
									delete propertiesMap[property];
								}
							}
						});

						/* Create a tween out of each property, and append its associated data to tweensContainer. */
						for (var property in propertiesMap) {

							if (!propertiesMap.hasOwnProperty(property)) {
								continue;
							}
							/**************************
							 Start Value Sourcing
							 **************************/

							/* Parse out endValue, easing, and startValue from the property's data. */
							var valueData = parsePropertyValue(propertiesMap[property]),
									endValue = valueData[0],
									easing = valueData[1],
									startValue = valueData[2];

							/* Now that the original property name's format has been used for the parsePropertyValue() lookup above,
							 we force the property to its camelCase styling to normalize it for manipulation. */
							property = CSS.Names.camelCase(property);

							/* In case this property is a hook, there are circumstances where we will intend to work on the hook's root property and not the hooked subproperty. */
							var rootProperty = CSS.Hooks.getRoot(property),
									rootPropertyValue = false;

							/* Other than for the dummy tween property, properties that are not supported by the browser (and do not have an associated normalization) will
							 inherently produce no style changes when set, so they are skipped in order to decrease animation tick overhead.
							 Property support is determined via prefixCheck(), which returns a false flag when no supported is detected. */
							/* Note: Since SVG elements have some of their properties directly applied as HTML attributes,
							 there is no way to check for their explicit browser support, and so we skip skip this check for them. */
							if ((!data || !data.isSVG) && rootProperty !== "tween" && CSS.Names.prefixCheck(rootProperty)[1] === false && CSS.Normalizations.registered[rootProperty] === undefined) {
								if (Velocity.debug) {
									console.log("Skipping [" + rootProperty + "] due to a lack of browser support.");
								}
								continue;
							}

							/* If the display option is being set to a non-"none" (e.g. "block") and opacity (filter on IE<=8) is being
							 animated to an endValue of non-zero, the user's intention is to fade in from invisible, thus we forcefeed opacity
							 a startValue of 0 if its startValue hasn't already been sourced by value transferring or prior forcefeeding. */
							if (((opts.display !== undefined && opts.display !== null && opts.display !== "none") || (opts.visibility !== undefined && opts.visibility !== "hidden")) && /opacity|filter/.test(property) && !startValue && endValue !== 0) {
								startValue = 0;
							}

							/* If values have been transferred from the previous Velocity call, extract the endValue and rootPropertyValue
							 for all of the current call's properties that were *also* animated in the previous call. */
							/* Note: Value transferring can optionally be disabled by the user via the _cacheValues option. */
							if (opts._cacheValues && lastTweensContainer && lastTweensContainer[property]) {
								if (startValue === undefined) {
									startValue = lastTweensContainer[property].endValue + lastTweensContainer[property].unitType;
								}

								/* The previous call's rootPropertyValue is extracted from the element's data cache since that's the
								 instance of rootPropertyValue that gets freshly updated by the tweening process, whereas the rootPropertyValue
								 attached to the incoming lastTweensContainer is equal to the root property's value prior to any tweening. */
								rootPropertyValue = data.rootPropertyValueCache[rootProperty];
								/* If values were not transferred from a previous Velocity call, query the DOM as needed. */
							} else {
								/* Handle hooked properties. */
								if (CSS.Hooks.registered[property]) {
									if (startValue === undefined) {
										rootPropertyValue = CSS.getPropertyValue(element, rootProperty); /* GET */
										/* Note: The following getPropertyValue() call does not actually trigger a DOM query;
										 getPropertyValue() will extract the hook from rootPropertyValue. */
										startValue = CSS.getPropertyValue(element, property, rootPropertyValue);
										/* If startValue is already defined via forcefeeding, do not query the DOM for the root property's value;
										 just grab rootProperty's zero-value template from CSS.Hooks. This overwrites the element's actual
										 root property value (if one is set), but this is acceptable since the primary reason users forcefeed is
										 to avoid DOM queries, and thus we likewise avoid querying the DOM for the root property's value. */
									} else {
										/* Grab this hook's zero-value template, e.g. "0px 0px 0px black". */
										rootPropertyValue = CSS.Hooks.templates[rootProperty][1];
									}
									/* Handle non-hooked properties that haven't already been defined via forcefeeding. */
								} else if (startValue === undefined) {
									startValue = CSS.getPropertyValue(element, property); /* GET */
								}
							}

							/**************************
							 Value Data Extraction
							 **************************/

							var separatedValue,
									endValueUnitType,
									startValueUnitType,
									operator = false;

							/* Separates a property value into its numeric value and its unit type. */
							var separateValue = function(property, value) {
								var unitType,
										numericValue;

								numericValue = (value || "0")
										.toString()
										.toLowerCase()
										/* Match the unit type at the end of the value. */
										.replace(/[%A-z]+$/, function(match) {
											/* Grab the unit type. */
											unitType = match;

											/* Strip the unit type off of value. */
											return "";
										});

								/* If no unit type was supplied, assign one that is appropriate for this property (e.g. "deg" for rotateZ or "px" for width). */
								if (!unitType) {
									unitType = CSS.Values.getUnitType(property);
								}

								return [numericValue, unitType];
							};

							/* Separate startValue. */
							separatedValue = separateValue(property, startValue);
							startValue = separatedValue[0];
							startValueUnitType = separatedValue[1];

							/* Separate endValue, and extract a value operator (e.g. "+=", "-=") if one exists. */
							separatedValue = separateValue(property, endValue);
							endValue = separatedValue[0].replace(/^([+-\/*])=/, function(match, subMatch) {
								operator = subMatch;

								/* Strip the operator off of the value. */
								return "";
							});
							endValueUnitType = separatedValue[1];

							/* Parse float values from endValue and startValue. Default to 0 if NaN is returned. */
							startValue = parseFloat(startValue) || 0;
							endValue = parseFloat(endValue) || 0;

							/***************************************
							 Property-Specific Value Conversion
							 ***************************************/

							/* Custom support for properties that don't actually accept the % unit type, but where pollyfilling is trivial and relatively foolproof. */
							if (endValueUnitType === "%") {
								/* A %-value fontSize/lineHeight is relative to the parent's fontSize (as opposed to the parent's dimensions),
								 which is identical to the em unit's behavior, so we piggyback off of that. */
								if (/^(fontSize|lineHeight)$/.test(property)) {
									/* Convert % into an em decimal value. */
									endValue = endValue / 100;
									endValueUnitType = "em";
									/* For scaleX and scaleY, convert the value into its decimal format and strip off the unit type. */
								} else if (/^scale/.test(property)) {
									endValue = endValue / 100;
									endValueUnitType = "";
									/* For RGB components, take the defined percentage of 255 and strip off the unit type. */
								} else if (/(Red|Green|Blue)$/i.test(property)) {
									endValue = (endValue / 100) * 255;
									endValueUnitType = "";
								}
							}

							/***************************
							 Unit Ratio Calculation
							 ***************************/

							/* When queried, the browser returns (most) CSS property values in pixels. Therefore, if an endValue with a unit type of
							 %, em, or rem is animated toward, startValue must be converted from pixels into the same unit type as endValue in order
							 for value manipulation logic (increment/decrement) to proceed. Further, if the startValue was forcefed or transferred
							 from a previous call, startValue may also not be in pixels. Unit conversion logic therefore consists of two steps:
							 1) Calculating the ratio of %/em/rem/vh/vw relative to pixels
							 2) Converting startValue into the same unit of measurement as endValue based on these ratios. */
							/* Unit conversion ratios are calculated by inserting a sibling node next to the target node, copying over its position property,
							 setting values with the target unit type then comparing the returned pixel value. */
							/* Note: Even if only one of these unit types is being animated, all unit ratios are calculated at once since the overhead
							 of batching the SETs and GETs together upfront outweights the potential overhead
							 of layout thrashing caused by re-querying for uncalculated ratios for subsequently-processed properties. */
							/* Todo: Shift this logic into the calls' first tick instance so that it's synced with RAF. */
							var calculateUnitRatios = function() {

								/************************
								 Same Ratio Checks
								 ************************/

								/* The properties below are used to determine whether the element differs sufficiently from this call's
								 previously iterated element to also differ in its unit conversion ratios. If the properties match up with those
								 of the prior element, the prior element's conversion ratios are used. Like most optimizations in Velocity,
								 this is done to minimize DOM querying. */
								var sameRatioIndicators = {
									myParent: element.parentNode || document.body, /* GET */
									position: CSS.getPropertyValue(element, "position"), /* GET */
									fontSize: CSS.getPropertyValue(element, "fontSize") /* GET */
								},
								/* Determine if the same % ratio can be used. % is based on the element's position value and its parent's width and height dimensions. */
								samePercentRatio = ((sameRatioIndicators.position === callUnitConversionData.lastPosition) && (sameRatioIndicators.myParent === callUnitConversionData.lastParent)),
										/* Determine if the same em ratio can be used. em is relative to the element's fontSize. */
										sameEmRatio = (sameRatioIndicators.fontSize === callUnitConversionData.lastFontSize);

								/* Store these ratio indicators call-wide for the next element to compare against. */
								callUnitConversionData.lastParent = sameRatioIndicators.myParent;
								callUnitConversionData.lastPosition = sameRatioIndicators.position;
								callUnitConversionData.lastFontSize = sameRatioIndicators.fontSize;

								/***************************
								 Element-Specific Units
								 ***************************/

								/* Note: IE8 rounds to the nearest pixel when returning CSS values, thus we perform conversions using a measurement
								 of 100 (instead of 1) to give our ratios a precision of at least 2 decimal values. */
								var measurement = 100,
										unitRatios = {};

								if (!sameEmRatio || !samePercentRatio) {
									var dummy = data && data.isSVG ? document.createElementNS("http://www.w3.org/2000/svg", "rect") : document.createElement("div");

									Velocity.init(dummy);
									sameRatioIndicators.myParent.appendChild(dummy);

									/* To accurately and consistently calculate conversion ratios, the element's cascaded overflow and box-sizing are stripped.
									 Similarly, since width/height can be artificially constrained by their min-/max- equivalents, these are controlled for as well. */
									/* Note: Overflow must be also be controlled for per-axis since the overflow property overwrites its per-axis values. */
									$.each(["overflow", "overflowX", "overflowY"], function(i, property) {
										Velocity.CSS.setPropertyValue(dummy, property, "hidden");
									});
									Velocity.CSS.setPropertyValue(dummy, "position", sameRatioIndicators.position);
									Velocity.CSS.setPropertyValue(dummy, "fontSize", sameRatioIndicators.fontSize);
									Velocity.CSS.setPropertyValue(dummy, "boxSizing", "content-box");

									/* width and height act as our proxy properties for measuring the horizontal and vertical % ratios. */
									$.each(["minWidth", "maxWidth", "width", "minHeight", "maxHeight", "height"], function(i, property) {
										Velocity.CSS.setPropertyValue(dummy, property, measurement + "%");
									});
									/* paddingLeft arbitrarily acts as our proxy property for the em ratio. */
									Velocity.CSS.setPropertyValue(dummy, "paddingLeft", measurement + "em");

									/* Divide the returned value by the measurement to get the ratio between 1% and 1px. Default to 1 since working with 0 can produce Infinite. */
									unitRatios.percentToPxWidth = callUnitConversionData.lastPercentToPxWidth = (parseFloat(CSS.getPropertyValue(dummy, "width", null, true)) || 1) / measurement; /* GET */
									unitRatios.percentToPxHeight = callUnitConversionData.lastPercentToPxHeight = (parseFloat(CSS.getPropertyValue(dummy, "height", null, true)) || 1) / measurement; /* GET */
									unitRatios.emToPx = callUnitConversionData.lastEmToPx = (parseFloat(CSS.getPropertyValue(dummy, "paddingLeft")) || 1) / measurement; /* GET */

									sameRatioIndicators.myParent.removeChild(dummy);
								} else {
									unitRatios.emToPx = callUnitConversionData.lastEmToPx;
									unitRatios.percentToPxWidth = callUnitConversionData.lastPercentToPxWidth;
									unitRatios.percentToPxHeight = callUnitConversionData.lastPercentToPxHeight;
								}

								/***************************
								 Element-Agnostic Units
								 ***************************/

								/* Whereas % and em ratios are determined on a per-element basis, the rem unit only needs to be checked
								 once per call since it's exclusively dependant upon document.body's fontSize. If this is the first time
								 that calculateUnitRatios() is being run during this call, remToPx will still be set to its default value of null,
								 so we calculate it now. */
								if (callUnitConversionData.remToPx === null) {
									/* Default to browsers' default fontSize of 16px in the case of 0. */
									callUnitConversionData.remToPx = parseFloat(CSS.getPropertyValue(document.body, "fontSize")) || 16; /* GET */
								}

								/* Similarly, viewport units are %-relative to the window's inner dimensions. */
								if (callUnitConversionData.vwToPx === null) {
									callUnitConversionData.vwToPx = parseFloat(window.innerWidth) / 100; /* GET */
									callUnitConversionData.vhToPx = parseFloat(window.innerHeight) / 100; /* GET */
								}

								unitRatios.remToPx = callUnitConversionData.remToPx;
								unitRatios.vwToPx = callUnitConversionData.vwToPx;
								unitRatios.vhToPx = callUnitConversionData.vhToPx;

								if (Velocity.debug >= 1) {
									console.log("Unit ratios: " + JSON.stringify(unitRatios), element);
								}
								return unitRatios;
							};

							/********************
							 Unit Conversion
							 ********************/

							/* The * and / operators, which are not passed in with an associated unit, inherently use startValue's unit. Skip value and unit conversion. */
							if (/[\/*]/.test(operator)) {
								endValueUnitType = startValueUnitType;
								/* If startValue and endValue differ in unit type, convert startValue into the same unit type as endValue so that if endValueUnitType
								 is a relative unit (%, em, rem), the values set during tweening will continue to be accurately relative even if the metrics they depend
								 on are dynamically changing during the course of the animation. Conversely, if we always normalized into px and used px for setting values, the px ratio
								 would become stale if the original unit being animated toward was relative and the underlying metrics change during the animation. */
								/* Since 0 is 0 in any unit type, no conversion is necessary when startValue is 0 -- we just start at 0 with endValueUnitType. */
							} else if ((startValueUnitType !== endValueUnitType) && startValue !== 0) {
								/* Unit conversion is also skipped when endValue is 0, but *startValueUnitType* must be used for tween values to remain accurate. */
								/* Note: Skipping unit conversion here means that if endValueUnitType was originally a relative unit, the animation won't relatively
								 match the underlying metrics if they change, but this is acceptable since we're animating toward invisibility instead of toward visibility,
								 which remains past the point of the animation's completion. */
								if (endValue === 0) {
									endValueUnitType = startValueUnitType;
								} else {
									/* By this point, we cannot avoid unit conversion (it's undesirable since it causes layout thrashing).
									 If we haven't already, we trigger calculateUnitRatios(), which runs once per element per call. */
									elementUnitConversionData = elementUnitConversionData || calculateUnitRatios();

									/* The following RegEx matches CSS properties that have their % values measured relative to the x-axis. */
									/* Note: W3C spec mandates that all of margin and padding's properties (even top and bottom) are %-relative to the *width* of the parent element. */
									var axis = (/margin|padding|left|right|width|text|word|letter/i.test(property) || /X$/.test(property) || property === "x") ? "x" : "y";

									/* In order to avoid generating n^2 bespoke conversion functions, unit conversion is a two-step process:
									 1) Convert startValue into pixels. 2) Convert this new pixel value into endValue's unit type. */
									switch (startValueUnitType) {
										case "%":
											/* Note: translateX and translateY are the only properties that are %-relative to an element's own dimensions -- not its parent's dimensions.
											 Velocity does not include a special conversion process to account for this behavior. Therefore, animating translateX/Y from a % value
											 to a non-% value will produce an incorrect start value. Fortunately, this sort of cross-unit conversion is rarely done by users in practice. */
											startValue *= (axis === "x" ? elementUnitConversionData.percentToPxWidth : elementUnitConversionData.percentToPxHeight);
											break;

										case "px":
											/* px acts as our midpoint in the unit conversion process; do nothing. */
											break;

										default:
											startValue *= elementUnitConversionData[startValueUnitType + "ToPx"];
									}

									/* Invert the px ratios to convert into to the target unit. */
									switch (endValueUnitType) {
										case "%":
											startValue *= 1 / (axis === "x" ? elementUnitConversionData.percentToPxWidth : elementUnitConversionData.percentToPxHeight);
											break;

										case "px":
											/* startValue is already in px, do nothing; we're done. */
											break;

										default:
											startValue *= 1 / elementUnitConversionData[endValueUnitType + "ToPx"];
									}
								}
							}

							/*********************
							 Relative Values
							 *********************/

							/* Operator logic must be performed last since it requires unit-normalized start and end values. */
							/* Note: Relative *percent values* do not behave how most people think; while one would expect "+=50%"
							 to increase the property 1.5x its current value, it in fact increases the percent units in absolute terms:
							 50 points is added on top of the current % value. */
							switch (operator) {
								case "+":
									endValue = startValue + endValue;
									break;

								case "-":
									endValue = startValue - endValue;
									break;

								case "*":
									endValue = startValue * endValue;
									break;

								case "/":
									endValue = startValue / endValue;
									break;
							}

							/**************************
							 tweensContainer Push
							 **************************/

							/* Construct the per-property tween object, and push it to the element's tweensContainer. */
							tweensContainer[property] = {
								rootPropertyValue: rootPropertyValue,
								startValue: startValue,
								currentValue: startValue,
								endValue: endValue,
								unitType: endValueUnitType,
								easing: easing
							};

							if (Velocity.debug) {
								console.log("tweensContainer (" + property + "): " + JSON.stringify(tweensContainer[property]), element);
							}
						}

						/* Along with its property data, store a reference to the element itself onto tweensContainer. */
						tweensContainer.element = element;
					}

					/*****************
					 Call Push
					 *****************/

					/* Note: tweensContainer can be empty if all of the properties in this call's property map were skipped due to not
					 being supported by the browser. The element property is used for checking that the tweensContainer has been appended to. */
					if (tweensContainer.element) {
						/* Apply the "velocity-animating" indicator class. */
						CSS.Values.addClass(element, "velocity-animating");

						/* The call array houses the tweensContainers for each element being animated in the current call. */
						call.push(tweensContainer);

						data = Data(element);

						if (data) {
							/* Store the tweensContainer and options if we're working on the default effects queue, so that they can be used by the reverse command. */
							if (opts.queue === "") {

								data.tweensContainer = tweensContainer;
								data.opts = opts;
							}

							/* Switch on the element's animating flag. */
							data.isAnimating = true;
						}

						/* Once the final element in this call's element set has been processed, push the call array onto
						 Velocity.State.calls for the animation tick to immediately begin processing. */
						if (elementsIndex === elementsLength - 1) {
							/* Add the current call plus its associated metadata (the element set and the call's options) onto the global call container.
							 Anything on this call container is subjected to tick() processing. */
							Velocity.State.calls.push([call, elements, opts, null, promiseData.resolver]);

							/* If the animation tick isn't running, start it. (Velocity shuts it off when there are no active calls to process.) */
							if (Velocity.State.isTicking === false) {
								Velocity.State.isTicking = true;

								/* Start the tick loop. */
								tick();
							}
						} else {
							elementsIndex++;
						}
					}
				}

				/* When the queue option is set to false, the call skips the element's queue and fires immediately. */
				if (opts.queue === false) {
					/* Since this buildQueue call doesn't respect the element's existing queue (which is where a delay option would have been appended),
					 we manually inject the delay property here with an explicit setTimeout. */
					if (opts.delay) {
						setTimeout(buildQueue, opts.delay);
					} else {
						buildQueue();
					}
					/* Otherwise, the call undergoes element queueing as normal. */
					/* Note: To interoperate with jQuery, Velocity uses jQuery's own $.queue() stack for queuing logic. */
				} else {
					$.queue(element, opts.queue, function(next, clearQueue) {
						/* If the clearQueue flag was passed in by the stop command, resolve this call's promise. (Promises can only be resolved once,
						 so it's fine if this is repeatedly triggered for each element in the associated call.) */
						if (clearQueue === true) {
							if (promiseData.promise) {
								promiseData.resolver(elements);
							}

							/* Do not continue with animation queueing. */
							return true;
						}

						/* This flag indicates to the upcoming completeCall() function that this queue entry was initiated by Velocity.
						 See completeCall() for further details. */
						Velocity.velocityQueueEntryFlag = true;

						buildQueue(next);
					});
				}

				/*********************
				 Auto-Dequeuing
				 *********************/

				/* As per jQuery's $.queue() behavior, to fire the first non-custom-queue entry on an element, the element
				 must be dequeued if its queue stack consists *solely* of the current call. (This can be determined by checking
				 for the "inprogress" item that jQuery prepends to active queue stack arrays.) Regardless, whenever the element's
				 queue is further appended with additional items -- including $.delay()'s or even $.animate() calls, the queue's
				 first entry is automatically fired. This behavior contrasts that of custom queues, which never auto-fire. */
				/* Note: When an element set is being subjected to a non-parallel Velocity call, the animation will not begin until
				 each one of the elements in the set has reached the end of its individually pre-existing queue chain. */
				/* Note: Unfortunately, most people don't fully grasp jQuery's powerful, yet quirky, $.queue() function.
				 Lean more here: http://stackoverflow.com/questions/1058158/can-somebody-explain-jquery-queue-to-me */
				if ((opts.queue === "" || opts.queue === "fx") && $.queue(element)[0] !== "inprogress") {
					$.dequeue(element);
				}
			}

			/**************************
			 Element Set Iteration
			 **************************/

			/* If the "nodeType" property exists on the elements variable, we're animating a single element.
			 Place it in an array so that $.each() can iterate over it. */
			$.each(elements, function(i, element) {
				/* Ensure each element in a set has a nodeType (is a real element) to avoid throwing errors. */
				if (Type.isNode(element)) {
					processElement(element, i);
				}
			});

			/******************
			 Option: Loop
			 ******************/

			/* The loop option accepts an integer indicating how many times the element should loop between the values in the
			 current call's properties map and the element's property values prior to this call. */
			/* Note: The loop option's logic is performed here -- after element processing -- because the current call needs
			 to undergo its queue insertion prior to the loop option generating its series of constituent "reverse" calls,
			 which chain after the current call. Two reverse calls (two "alternations") constitute one loop. */
			opts = $.extend({}, Velocity.defaults, options);
			opts.loop = parseInt(opts.loop, 10);
			var reverseCallsCount = (opts.loop * 2) - 1;

			if (opts.loop) {
				/* Double the loop count to convert it into its appropriate number of "reverse" calls.
				 Subtract 1 from the resulting value since the current call is included in the total alternation count. */
				for (var x = 0; x < reverseCallsCount; x++) {
					/* Since the logic for the reverse action occurs inside Queueing and therefore this call's options object
					 isn't parsed until then as well, the current call's delay option must be explicitly passed into the reverse
					 call so that the delay logic that occurs inside *Pre-Queueing* can process it. */
					var reverseOptions = {
						delay: opts.delay,
						progress: opts.progress
					};

					/* If a complete callback was passed into this call, transfer it to the loop redirect's final "reverse" call
					 so that it's triggered when the entire redirect is complete (and not when the very first animation is complete). */
					if (x === reverseCallsCount - 1) {
						reverseOptions.display = opts.display;
						reverseOptions.visibility = opts.visibility;
						reverseOptions.complete = opts.complete;
					}

					animate(elements, "reverse", reverseOptions);
				}
			}

			/***************
			 Chaining
			 ***************/

			/* Return the elements back to the call chain, with wrapped elements taking precedence in case Velocity was called via the $.fn. extension. */
			return getChain();
		};

		/* Turn Velocity into the animation function, extended with the pre-existing Velocity object. */
		Velocity = $.extend(animate, Velocity);
		/* For legacy support, also expose the literal animate method. */
		Velocity.animate = animate;

		/**************
		 Timing
		 **************/

		/* Ticker function. */
		var ticker = window.requestAnimationFrame || rAFShim;

		/* Inactive browser tabs pause rAF, which results in all active animations immediately sprinting to their completion states when the tab refocuses.
		 To get around this, we dynamically switch rAF to setTimeout (which the browser *doesn't* pause) when the tab loses focus. We skip this for mobile
		 devices to avoid wasting battery power on inactive tabs. */
		/* Note: Tab focus detection doesn't work on older versions of IE, but that's okay since they don't support rAF to begin with. */
		if (!Velocity.State.isMobile && document.hidden !== undefined) {
			document.addEventListener("visibilitychange", function() {
				/* Reassign the rAF function (which the global tick() function uses) based on the tab's focus state. */
				if (document.hidden) {
					ticker = function(callback) {
						/* The tick function needs a truthy first argument in order to pass its internal timestamp check. */
						return setTimeout(function() {
							callback(true);
						}, 16);
					};

					/* The rAF loop has been paused by the browser, so we manually restart the tick. */
					tick();
				} else {
					ticker = window.requestAnimationFrame || rAFShim;
				}
			});
		}

		/************
		 Tick
		 ************/

		/* Note: All calls to Velocity are pushed to the Velocity.State.calls array, which is fully iterated through upon each tick. */
		function tick(timestamp) {
			/* An empty timestamp argument indicates that this is the first tick occurence since ticking was turned on.
			 We leverage this metadata to fully ignore the first tick pass since RAF's initial pass is fired whenever
			 the browser's next tick sync time occurs, which results in the first elements subjected to Velocity
			 calls being animated out of sync with any elements animated immediately thereafter. In short, we ignore
			 the first RAF tick pass so that elements being immediately consecutively animated -- instead of simultaneously animated
			 by the same Velocity call -- are properly batched into the same initial RAF tick and consequently remain in sync thereafter. */
			if (timestamp) {
				/* We ignore RAF's high resolution timestamp since it can be significantly offset when the browser is
				 under high stress; we opt for choppiness over allowing the browser to drop huge chunks of frames. */
				var timeCurrent = (new Date()).getTime();

				/********************
				 Call Iteration
				 ********************/

				var callsLength = Velocity.State.calls.length;

				/* To speed up iterating over this array, it is compacted (falsey items -- calls that have completed -- are removed)
				 when its length has ballooned to a point that can impact tick performance. This only becomes necessary when animation
				 has been continuous with many elements over a long period of time; whenever all active calls are completed, completeCall() clears Velocity.State.calls. */
				if (callsLength > 10000) {
					Velocity.State.calls = compactSparseArray(Velocity.State.calls);
					callsLength = Velocity.State.calls.length;
				}

				/* Iterate through each active call. */
				for (var i = 0; i < callsLength; i++) {
					/* When a Velocity call is completed, its Velocity.State.calls entry is set to false. Continue on to the next call. */
					if (!Velocity.State.calls[i]) {
						continue;
					}

					/************************
					 Call-Wide Variables
					 ************************/

					var callContainer = Velocity.State.calls[i],
							call = callContainer[0],
							opts = callContainer[2],
							timeStart = callContainer[3],
							firstTick = !!timeStart,
							tweenDummyValue = null;

					/* If timeStart is undefined, then this is the first time that this call has been processed by tick().
					 We assign timeStart now so that its value is as close to the real animation start time as possible.
					 (Conversely, had timeStart been defined when this call was added to Velocity.State.calls, the delay
					 between that time and now would cause the first few frames of the tween to be skipped since
					 percentComplete is calculated relative to timeStart.) */
					/* Further, subtract 16ms (the approximate resolution of RAF) from the current time value so that the
					 first tick iteration isn't wasted by animating at 0% tween completion, which would produce the
					 same style value as the element's current value. */
					if (!timeStart) {
						timeStart = Velocity.State.calls[i][3] = timeCurrent - 16;
					}

					/* The tween's completion percentage is relative to the tween's start time, not the tween's start value
					 (which would result in unpredictable tween durations since JavaScript's timers are not particularly accurate).
					 Accordingly, we ensure that percentComplete does not exceed 1. */
					var percentComplete = Math.min((timeCurrent - timeStart) / opts.duration, 1);

					/**********************
					 Element Iteration
					 **********************/

					/* For every call, iterate through each of the elements in its set. */
					for (var j = 0, callLength = call.length; j < callLength; j++) {
						var tweensContainer = call[j],
								element = tweensContainer.element;

						/* Check to see if this element has been deleted midway through the animation by checking for the
						 continued existence of its data cache. If it's gone, skip animating this element. */
						if (!Data(element)) {
							continue;
						}

						var transformPropertyExists = false;

						/**********************************
						 Display & Visibility Toggling
						 **********************************/

						/* If the display option is set to non-"none", set it upfront so that the element can become visible before tweening begins.
						 (Otherwise, display's "none" value is set in completeCall() once the animation has completed.) */
						if (opts.display !== undefined && opts.display !== null && opts.display !== "none") {
							if (opts.display === "flex") {
								var flexValues = ["-webkit-box", "-moz-box", "-ms-flexbox", "-webkit-flex"];

								$.each(flexValues, function(i, flexValue) {
									CSS.setPropertyValue(element, "display", flexValue);
								});
							}

							CSS.setPropertyValue(element, "display", opts.display);
						}

						/* Same goes with the visibility option, but its "none" equivalent is "hidden". */
						if (opts.visibility !== undefined && opts.visibility !== "hidden") {
							CSS.setPropertyValue(element, "visibility", opts.visibility);
						}

						/************************
						 Property Iteration
						 ************************/

						/* For every element, iterate through each property. */
						for (var property in tweensContainer) {
							/* Note: In addition to property tween data, tweensContainer contains a reference to its associated element. */
							if (tweensContainer.hasOwnProperty(property) && property !== "element") {
								var tween = tweensContainer[property],
										currentValue,
										/* Easing can either be a pre-genereated function or a string that references a pre-registered easing
										 on the Velocity.Easings object. In either case, return the appropriate easing *function*. */
										easing = Type.isString(tween.easing) ? Velocity.Easings[tween.easing] : tween.easing;

								/******************************
								 Current Value Calculation
								 ******************************/

								/* If this is the last tick pass (if we've reached 100% completion for this tween),
								 ensure that currentValue is explicitly set to its target endValue so that it's not subjected to any rounding. */
								if (percentComplete === 1) {
									currentValue = tween.endValue;
									/* Otherwise, calculate currentValue based on the current delta from startValue. */
								} else {
									var tweenDelta = tween.endValue - tween.startValue;
									currentValue = tween.startValue + (tweenDelta * easing(percentComplete, opts, tweenDelta));

									/* If no value change is occurring, don't proceed with DOM updating. */
									if (!firstTick && (currentValue === tween.currentValue)) {
										continue;
									}
								}

								tween.currentValue = currentValue;

								/* If we're tweening a fake 'tween' property in order to log transition values, update the one-per-call variable so that
								 it can be passed into the progress callback. */
								if (property === "tween") {
									tweenDummyValue = currentValue;
								} else {
									/******************
									 Hooks: Part I
									 ******************/
									var hookRoot;

									/* For hooked properties, the newly-updated rootPropertyValueCache is cached onto the element so that it can be used
									 for subsequent hooks in this call that are associated with the same root property. If we didn't cache the updated
									 rootPropertyValue, each subsequent update to the root property in this tick pass would reset the previous hook's
									 updates to rootPropertyValue prior to injection. A nice performance byproduct of rootPropertyValue caching is that
									 subsequently chained animations using the same hookRoot but a different hook can use this cached rootPropertyValue. */
									if (CSS.Hooks.registered[property]) {
										hookRoot = CSS.Hooks.getRoot(property);

										var rootPropertyValueCache = Data(element).rootPropertyValueCache[hookRoot];

										if (rootPropertyValueCache) {
											tween.rootPropertyValue = rootPropertyValueCache;
										}
									}

									/*****************
									 DOM Update
									 *****************/

									/* setPropertyValue() returns an array of the property name and property value post any normalization that may have been performed. */
									/* Note: To solve an IE<=8 positioning bug, the unit type is dropped when setting a property value of 0. */
									var adjustedSetData = CSS.setPropertyValue(element, /* SET */
											property,
											tween.currentValue + (parseFloat(currentValue) === 0 ? "" : tween.unitType),
											tween.rootPropertyValue,
											tween.scrollData);

									/*******************
									 Hooks: Part II
									 *******************/

									/* Now that we have the hook's updated rootPropertyValue (the post-processed value provided by adjustedSetData), cache it onto the element. */
									if (CSS.Hooks.registered[property]) {
										/* Since adjustedSetData contains normalized data ready for DOM updating, the rootPropertyValue needs to be re-extracted from its normalized form. ?? */
										if (CSS.Normalizations.registered[hookRoot]) {
											Data(element).rootPropertyValueCache[hookRoot] = CSS.Normalizations.registered[hookRoot]("extract", null, adjustedSetData[1]);
										} else {
											Data(element).rootPropertyValueCache[hookRoot] = adjustedSetData[1];
										}
									}

									/***************
									 Transforms
									 ***************/

									/* Flag whether a transform property is being animated so that flushTransformCache() can be triggered once this tick pass is complete. */
									if (adjustedSetData[0] === "transform") {
										transformPropertyExists = true;
									}

								}
							}
						}

						/****************
						 mobileHA
						 ****************/

						/* If mobileHA is enabled, set the translate3d transform to null to force hardware acceleration.
						 It's safe to override this property since Velocity doesn't actually support its animation (hooks are used in its place). */
						if (opts.mobileHA) {
							/* Don't set the null transform hack if we've already done so. */
							if (Data(element).transformCache.translate3d === undefined) {
								/* All entries on the transformCache object are later concatenated into a single transform string via flushTransformCache(). */
								Data(element).transformCache.translate3d = "(0px, 0px, 0px)";

								transformPropertyExists = true;
							}
						}

						if (transformPropertyExists) {
							CSS.flushTransformCache(element);
						}
					}

					/* The non-"none" display value is only applied to an element once -- when its associated call is first ticked through.
					 Accordingly, it's set to false so that it isn't re-processed by this call in the next tick. */
					if (opts.display !== undefined && opts.display !== "none") {
						Velocity.State.calls[i][2].display = false;
					}
					if (opts.visibility !== undefined && opts.visibility !== "hidden") {
						Velocity.State.calls[i][2].visibility = false;
					}

					/* Pass the elements and the timing data (percentComplete, msRemaining, timeStart, tweenDummyValue) into the progress callback. */
					if (opts.progress) {
						opts.progress.call(callContainer[1],
								callContainer[1],
								percentComplete,
								Math.max(0, (timeStart + opts.duration) - timeCurrent),
								timeStart,
								tweenDummyValue);
					}

					/* If this call has finished tweening, pass its index to completeCall() to handle call cleanup. */
					if (percentComplete === 1) {
						completeCall(i);
					}
				}
			}

			/* Note: completeCall() sets the isTicking flag to false when the last call on Velocity.State.calls has completed. */
			if (Velocity.State.isTicking) {
				ticker(tick);
			}
		}

		/**********************
		 Call Completion
		 **********************/

		/* Note: Unlike tick(), which processes all active calls at once, call completion is handled on a per-call basis. */
		function completeCall(callIndex, isStopped) {
			/* Ensure the call exists. */
			if (!Velocity.State.calls[callIndex]) {
				return false;
			}

			/* Pull the metadata from the call. */
			var call = Velocity.State.calls[callIndex][0],
					elements = Velocity.State.calls[callIndex][1],
					opts = Velocity.State.calls[callIndex][2],
					resolver = Velocity.State.calls[callIndex][4];

			var remainingCallsExist = false;

			/*************************
			 Element Finalization
			 *************************/

			for (var i = 0, callLength = call.length; i < callLength; i++) {
				var element = call[i].element;

				/* If the user set display to "none" (intending to hide the element), set it now that the animation has completed. */
				/* Note: display:none isn't set when calls are manually stopped (via Velocity("stop"). */
				/* Note: Display gets ignored with "reverse" calls and infinite loops, since this behavior would be undesirable. */
				if (!isStopped && !opts.loop) {
					if (opts.display === "none") {
						CSS.setPropertyValue(element, "display", opts.display);
					}

					if (opts.visibility === "hidden") {
						CSS.setPropertyValue(element, "visibility", opts.visibility);
					}
				}

				/* If the element's queue is empty (if only the "inprogress" item is left at position 0) or if its queue is about to run
				 a non-Velocity-initiated entry, turn off the isAnimating flag. A non-Velocity-initiatied queue entry's logic might alter
				 an element's CSS values and thereby cause Velocity's cached value data to go stale. To detect if a queue entry was initiated by Velocity,
				 we check for the existence of our special Velocity.queueEntryFlag declaration, which minifiers won't rename since the flag
				 is assigned to jQuery's global $ object and thus exists out of Velocity's own scope. */
				var data = Data(element);

				if (opts.loop !== true && ($.queue(element)[1] === undefined || !/\.velocityQueueEntryFlag/i.test($.queue(element)[1]))) {
					/* The element may have been deleted. Ensure that its data cache still exists before acting on it. */
					if (data) {
						data.isAnimating = false;
						/* Clear the element's rootPropertyValueCache, which will become stale. */
						data.rootPropertyValueCache = {};

						var transformHAPropertyExists = false;
						/* If any 3D transform subproperty is at its default value (regardless of unit type), remove it. */
						$.each(CSS.Lists.transforms3D, function(i, transformName) {
							var defaultValue = /^scale/.test(transformName) ? 1 : 0,
									currentValue = data.transformCache[transformName];

							if (data.transformCache[transformName] !== undefined && new RegExp("^\\(" + defaultValue + "[^.]").test(currentValue)) {
								transformHAPropertyExists = true;

								delete data.transformCache[transformName];
							}
						});

						/* Mobile devices have hardware acceleration removed at the end of the animation in order to avoid hogging the GPU's memory. */
						if (opts.mobileHA) {
							transformHAPropertyExists = true;
							delete data.transformCache.translate3d;
						}

						/* Flush the subproperty removals to the DOM. */
						if (transformHAPropertyExists) {
							CSS.flushTransformCache(element);
						}

						/* Remove the "velocity-animating" indicator class. */
						CSS.Values.removeClass(element, "velocity-animating");
					}
				}

				/*********************
				 Option: Complete
				 *********************/

				/* Complete is fired once per call (not once per element) and is passed the full raw DOM element set as both its context and its first argument. */
				/* Note: Callbacks aren't fired when calls are manually stopped (via Velocity("stop"). */
				if (!isStopped && opts.complete && !opts.loop && (i === callLength - 1)) {
					/* We throw callbacks in a setTimeout so that thrown errors don't halt the execution of Velocity itself. */
					try {
						opts.complete.call(elements, elements);
					} catch (error) {
						setTimeout(function() {
							throw error;
						}, 1);
					}
				}

				/**********************
				 Promise Resolving
				 **********************/

				/* Note: Infinite loops don't return promises. */
				if (resolver && opts.loop !== true) {
					resolver(elements);
				}

				/****************************
				 Option: Loop (Infinite)
				 ****************************/

				if (data && opts.loop === true && !isStopped) {
					/* If a rotateX/Y/Z property is being animated by 360 deg with loop:true, swap tween start/end values to enable
					 continuous iterative rotation looping. (Otherise, the element would just rotate back and forth.) */
					$.each(data.tweensContainer, function(propertyName, tweenContainer) {
						if (/^rotate/.test(propertyName) && ((parseFloat(tweenContainer.startValue) - parseFloat(tweenContainer.endValue)) % 360 === 0)) {
							var oldStartValue = tweenContainer.startValue;

							tweenContainer.startValue = tweenContainer.endValue;
							tweenContainer.endValue = oldStartValue;
						}

						if (/^backgroundPosition/.test(propertyName) && parseFloat(tweenContainer.endValue) === 100 && tweenContainer.unitType === "%") {
							tweenContainer.endValue = 0;
							tweenContainer.startValue = 100;
						}
					});

					Velocity(element, "reverse", {loop: true, delay: opts.delay});
				}

				/***************
				 Dequeueing
				 ***************/

				/* Fire the next call in the queue so long as this call's queue wasn't set to false (to trigger a parallel animation),
				 which would have already caused the next call to fire. Note: Even if the end of the animation queue has been reached,
				 $.dequeue() must still be called in order to completely clear jQuery's animation queue. */
				if (opts.queue !== false) {
					$.dequeue(element, opts.queue);
				}
			}

			/************************
			 Calls Array Cleanup
			 ************************/

			/* Since this call is complete, set it to false so that the rAF tick skips it. This array is later compacted via compactSparseArray().
			 (For performance reasons, the call is set to false instead of being deleted from the array: http://www.html5rocks.com/en/tutorials/speed/v8/) */
			Velocity.State.calls[callIndex] = false;

			/* Iterate through the calls array to determine if this was the final in-progress animation.
			 If so, set a flag to end ticking and clear the calls array. */
			for (var j = 0, callsLength = Velocity.State.calls.length; j < callsLength; j++) {
				if (Velocity.State.calls[j] !== false) {
					remainingCallsExist = true;

					break;
				}
			}

			if (remainingCallsExist === false) {
				/* tick() will detect this flag upon its next iteration and subsequently turn itself off. */
				Velocity.State.isTicking = false;

				/* Clear the calls array so that its length is reset. */
				delete Velocity.State.calls;
				Velocity.State.calls = [];
			}
		}

		/******************
		 Frameworks
		 ******************/

		/* Both jQuery and Zepto allow their $.fn object to be extended to allow wrapped elements to be subjected to plugin calls.
		 If either framework is loaded, register a "velocity" extension pointing to Velocity's core animate() method.  Velocity
		 also registers itself onto a global container (window.jQuery || window.Zepto || window) so that certain features are
		 accessible beyond just a per-element scope. This master object contains an .animate() method, which is later assigned to $.fn
		 (if jQuery or Zepto are present). Accordingly, Velocity can both act on wrapped DOM elements and stand alone for targeting raw DOM elements. */
		global.Velocity = Velocity;

		if (global !== window) {
			/* Assign the element function to Velocity's core animate() method. */
			global.fn.velocity = animate;
			/* Assign the object function's defaults to Velocity's global defaults object. */
			global.fn.velocity.defaults = Velocity.defaults;
		}

		/***********************
		 Packaged Redirects
		 ***********************/

		/* slideUp, slideDown */
		$.each(["Down", "Up"], function(i, direction) {
			Velocity.Redirects["slide" + direction] = function(element, options, elementsIndex, elementsSize, elements, promiseData) {
				var opts = $.extend({}, options),
						begin = opts.begin,
						complete = opts.complete,
						computedValues = {height: "", marginTop: "", marginBottom: "", paddingTop: "", paddingBottom: ""},
				inlineValues = {};

				if (opts.display === undefined) {
					/* Show the element before slideDown begins and hide the element after slideUp completes. */
					/* Note: Inline elements cannot have dimensions animated, so they're reverted to inline-block. */
					opts.display = (direction === "Down" ? (Velocity.CSS.Values.getDisplayType(element) === "inline" ? "inline-block" : "block") : "none");
				}

				opts.begin = function() {
					/* If the user passed in a begin callback, fire it now. */
					if (begin) {
						begin.call(elements, elements);
					}

					/* Cache the elements' original vertical dimensional property values so that we can animate back to them. */
					for (var property in computedValues) {
						if (!computedValues.hasOwnProperty(property)) {
							continue;
						}
						inlineValues[property] = element.style[property];

						/* For slideDown, use forcefeeding to animate all vertical properties from 0. For slideUp,
						 use forcefeeding to start from computed values and animate down to 0. */
						var propertyValue = Velocity.CSS.getPropertyValue(element, property);
						computedValues[property] = (direction === "Down") ? [propertyValue, 0] : [0, propertyValue];
					}

					/* Force vertical overflow content to clip so that sliding works as expected. */
					inlineValues.overflow = element.style.overflow;
					element.style.overflow = "hidden";
				};

				opts.complete = function() {
					/* Reset element to its pre-slide inline values once its slide animation is complete. */
					for (var property in inlineValues) {
						if (inlineValues.hasOwnProperty(property)) {
							element.style[property] = inlineValues[property];
						}
					}

					/* If the user passed in a complete callback, fire it now. */
					if (complete) {
						complete.call(elements, elements);
					}
					if (promiseData) {
						promiseData.resolver(elements);
					}
				};

				Velocity(element, computedValues, opts);
			};
		});

		/* fadeIn, fadeOut */
		$.each(["In", "Out"], function(i, direction) {
			Velocity.Redirects["fade" + direction] = function(element, options, elementsIndex, elementsSize, elements, promiseData) {
				var opts = $.extend({}, options),
						originalComplete = opts.complete,
						propertiesMap = {opacity: (direction === "In") ? 1 : 0};

				/* Since redirects are triggered individually for each element in the animated set, avoid repeatedly triggering
				 callbacks by firing them only when the final element has been reached. */
				if (elementsIndex !== elementsSize - 1) {
					opts.complete = opts.begin = null;
				} else {
					opts.complete = function() {
						if (originalComplete) {
							originalComplete.call(elements, elements);
						}

						if (promiseData) {
							promiseData.resolver(elements);
						}
					};
				}

				/* If a display was passed in, use it. Otherwise, default to "none" for fadeOut or the element-specific default for fadeIn. */
				/* Note: We allow users to pass in "null" to skip display setting altogether. */
				if (opts.display === undefined) {
					opts.display = (direction === "In" ? "auto" : "none");
				}

				Velocity(this, propertiesMap, opts);
			};
		});

		return Velocity;
	}((window.jQuery || window.Zepto || window), window, document);
}));

/******************
 Known Issues
 ******************/

/* The CSS spec mandates that the translateX/Y/Z transforms are %-relative to the element itself -- not its parent.
 Velocity, however, doesn't make this distinction. Thus, converting to or from the % unit with these subproperties
 will produce an inaccurate conversion value. The same issue exists with the cx/cy attributes of SVG circles and ellipses. */

},{}],4:[function(require,module,exports){
"use strict";

var app = require("./modules/app");
var bookdata = require("./inferno/bookdata");
var appdata = require("./modules/appdata");

appdata.textdata = bookdata.textdata;
appdata.translationdata = bookdata.translationdata;
appdata.cantotitles = bookdata.cantotitles;
appdata.translationcount = bookdata.translationdata.length;
appdata.cantocount = bookdata.cantotitles.length;
appdata.description = bookdata.description;
appdata.bookname = bookdata.bookname;
appdata.booktitle = bookdata.booktitle;
appdata.bookauthor = bookdata.bookauthor;

for (var i in appdata.textdata) {
	for (var j in appdata.translationdata) {
		if (appdata.translationdata[j].translationid == appdata.textdata[i].translationid) {
			appdata.translationdata[j].bookname = appdata.textdata[i].bookname;
			appdata.translationdata[j].author = appdata.textdata[i].author;
			appdata.translationdata[j].title = appdata.textdata[i].title;
			appdata.translationdata[j].translation = appdata.textdata[i].translation;
			appdata.translationdata[j].translationshortname = appdata.textdata[i].translationshortname;
			appdata.translationdata[j].translationfullname = appdata.textdata[i].translationfullname;
			appdata.translationdata[j].translationclass = appdata.textdata[i].translationclass;
			appdata.translationdata[j].source = appdata.textdata[i].source;
		}
	}
}

app.initialize();

},{"./inferno/bookdata":5,"./modules/app":10,"./modules/appdata":11}],5:[function(require,module,exports){
"use strict";

// the spine for the book

module.exports = {

	bookname: 'inferno',
	booktitle: "Inferno",
	bookauthor: "Dante Alighieri",
	description: "<p>What can one say about Dante\u2019s <em>Inferno</em> that hasn\u2019t already been said? Not very much. Obviously, there are better places to learn about Dante than the about page of an app; and you are probably smart enough to find them. Please note that the translations here aren\u2019t being presented as the best translations of the <em>Inferno</em> available: rather, they\u2019re here by virtue of being in the public domain.</p>",

	cantotitles: [// this is canto sequence
	"Title page", "Canto 1", "Canto 2", "Canto 3", "Canto 4", "Canto 5", "Canto 6", "Canto 7", "Canto 8", "Canto 9", "Canto 10", "Canto 11", "Canto 12", "Canto 13", "Canto 14", "Canto 15", "Canto 16", "Canto 17", "Canto 18", "Canto 19", "Canto 20", "Canto 21", "Canto 22", "Canto 23", "Canto 24", "Canto 25", "Canto 26", "Canto 27", "Canto 28", "Canto 29", "Canto 30", "Canto 31", "Canto 32", "Canto 33", "Canto 34"],

	translationdata: [// this is translation sequence
	{ "translationid": "dante",
		"order": 0 }, { "translationid": "longfellow",
		"order": 1 }, { "translationid": "norton",
		"order": 2 }, { "translationid": "cary",
		"order": 2 }],

	textdata: [// set up translations
	require("./translations/dante"), require("./translations/longfellow"), require("./translations/norton"), require("./translations/cary") /*,
                                                                                                                                         require("./translations/wright"),
                                                                                                                                         require("./translations/carlyle")*/
	]
};

},{"./translations/cary":6,"./translations/dante":7,"./translations/longfellow":8,"./translations/norton":9}],6:[function(require,module,exports){
// inferno/cary.js
"use strict";module.exports={bookname:'inferno',author:'Dante Alighieri',translationid:"cary",title:'Hell',translation:true,source:'<a href="http://www.gutenberg.org/ebooks/1005">Project Gutenberg</a>',translationshortname:"Cary",translationfullname:"Henry Francis Cary",translationclass:"poetry",text:['<p class="title">Hell</p>\n\t\t<p class="author">Henry Francis Cary</p>','<p class="cantohead">Canto I</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">In</span> the midway of this our mortal life,</p>\n\t\t<p>I found me in a gloomy wood, astray</p>\n\t\t<p>Gone from the path direct: and e&rsquo;en to tell</p>\n\t\t<p>It were no easy task, how savage wild</p>\n\t\t<p>That forest, how robust and rough its growth,</p>\n\t\t<p>Which to remember only, my dismay</p>\n\t\t<p>Renews, in bitterness not far from death.</p>\n\t\t<p>Yet to discourse of what there good befell,</p>\n\t\t<p>All else will I relate discover&rsquo;d there.</p>\n\t\t<p>How first I enter&rsquo;d it I scarce can say,</p>\n\t\t<p>Such sleepy dullness in that instant weigh&rsquo;d</p>\n\t\t<p>My senses down, when the true path I left,</p>\n\t\t<p>But when a mountain&rsquo;s foot I reach&rsquo;d, where clos&rsquo;d</p>\n\t\t<p>The valley, that had pierc&rsquo;d my heart with dread,</p>\n\t\t<p>I look&rsquo;d aloft, and saw his shoulders broad</p>\n\t\t<p>Already vested with that planet&rsquo;s beam,</p>\n\t\t<p>Who leads all wanderers safe through every way.</p>\n\t\t<p class="slindent">Then was a little respite to the fear,</p>\n\t\t<p>That in my heart&rsquo;s recesses deep had lain,</p>\n\t\t<p>All of that night, so pitifully pass&rsquo;d:</p>\n\t\t<p>And as a man, with difficult short breath,</p>\n\t\t<p>Forespent with toiling, &rsquo;scap&rsquo;d from sea to shore,</p>\n\t\t<p>Turns to the perilous wide waste, and stands</p>\n\t\t<p>At gaze; e&rsquo;en so my spirit, that yet fail&rsquo;d</p>\n\t\t<p>Struggling with terror, turn&rsquo;d to view the straits,</p>\n\t\t<p>That none hath pass&rsquo;d and liv&rsquo;d. My weary frame</p>\n\t\t<p>After short pause recomforted, again</p>\n\t\t<p>I journey&rsquo;d on over that lonely steep,</p>\n\t\t<p>The hinder foot still firmer. Scarce the ascent</p>\n\t\t<p>Began, when, lo! a panther, nimble, light,</p>\n\t\t<p>And cover&rsquo;d with a speckled skin, appear&rsquo;d,</p>\n\t\t<p>Nor, when it saw me, vanish&rsquo;d, rather strove</p>\n\t\t<p>To check my onward going; that ofttimes</p>\n\t\t<p>With purpose to retrace my steps I turn&rsquo;d.</p>\n\t\t<p class="slindent">The hour was morning&rsquo;s prime, and on his way</p>\n\t\t<p>Aloft the sun ascended with those stars,</p>\n\t\t<p>That with him rose, when Love divine first mov&rsquo;d</p>\n\t\t<p>Those its fair works: so that with joyous hope</p>\n\t\t<p>All things conspir&rsquo;d to fill me, the gay skin</p>\n\t\t<p>Of that swift animal, the matin dawn</p>\n\t\t<p>And the sweet season. Soon that joy was chas&rsquo;d,</p>\n\t\t<p>And by new dread succeeded, when in view</p>\n\t\t<p>A lion came, &rsquo;gainst me, as it appear&rsquo;d,</p>\n\t\t<p>With his head held aloft and hunger-mad,</p>\n\t\t<p>That e&rsquo;en the air was fear-struck. A she-wolf</p>\n\t\t<p>Was at his heels, who in her leanness seem&rsquo;d</p>\n\t\t<p>Full of all wants, and many a land hath made</p>\n\t\t<p>Disconsolate ere now. She with such fear</p>\n\t\t<p>O&rsquo;erwhelmed me, at the sight of her appall&rsquo;d,</p>\n\t\t<p>That of the height all hope I lost. As one,</p>\n\t\t<p>Who with his gain elated, sees the time</p>\n\t\t<p>When all unwares is gone, he inwardly</p>\n\t\t<p>Mourns with heart-griping anguish; such was I,</p>\n\t\t<p>Haunted by that fell beast, never at peace,</p>\n\t\t<p>Who coming o&rsquo;er against me, by degrees</p>\n\t\t<p>Impell&rsquo;d me where the sun in silence rests.</p>\n\t\t<p class="slindent">While to the lower space with backward step</p>\n\t\t<p>I fell, my ken discern&rsquo;d the form one of one,</p>\n\t\t<p>Whose voice seem&rsquo;d faint through long disuse of speech.</p>\n\t\t<p>When him in that great desert I espied,</p>\n\t\t<p>&ldquo;Have mercy on me!&rdquo; cried I out aloud,</p>\n\t\t<p>&ldquo;Spirit! or living man! what e&rsquo;er thou be!&rdquo;</p>\n\t\t<p class="slindent">He answer&rsquo;d:&ldquo;ow not man, man once I was,</p>\n\t\t<p>And born of Lombard parents, Mantuana both</p>\n\t\t<p>By country, when the power of Julius yet</p>\n\t\t<p>Was scarcely firm. At Rome my life was past</p>\n\t\t<p>Beneath the mild Augustus, in the time</p>\n\t\t<p>Of fabled deities and false. A bard</p>\n\t\t<p>Was I, and made Anchises&rsquo; upright son</p>\n\t\t<p>The subject of my song, who came from Troy,</p>\n\t\t<p>When the flames prey&rsquo;d on Ilium&rsquo;s haughty towers.</p>\n\t\t<p>But thou, say wherefore to such perils past</p>\n\t\t<p>Return&rsquo;st thou? wherefore not this pleasant mount</p>\n\t\t<p>Ascendest, cause and source of all delight?&rdquo;</p>\n\t\t<p>&ldquo;And art thou then that Virgil, that well-spring,</p>\n\t\t<p>From which such copious floods of eloquence</p>\n\t\t<p>Have issued?&rdquo; I with front abash&rsquo;d replied.</p>\n\t\t<p>&ldquo;Glory and light of all the tuneful train!</p>\n\t\t<p>May it avail me that I long with zeal</p>\n\t\t<p>Have sought thy volume, and with love immense</p>\n\t\t<p>Have conn&rsquo;d it o&rsquo;er. My master thou and guide!</p>\n\t\t<p>Thou he from whom alone I have deriv&rsquo;d</p>\n\t\t<p>That style, which for its beauty into fame</p>\n\t\t<p>Exalts me. See the beast, from whom I fled.</p>\n\t\t<p>O save me from her, thou illustrious sage!&rdquo;</p>\n\t\t<p>&ldquo;For every vein and pulse throughout my frame</p>\n\t\t<p>She hath made tremble.&rdquo; He, soon as he saw</p>\n\t\t<p>That I was weeping, answer&rsquo;d, &ldquo;Thou must needs</p>\n\t\t<p>Another way pursue, if thou wouldst &rsquo;scape</p>\n\t\t<p>From out that savage wilderness. This beast,</p>\n\t\t<p>At whom thou criest, her way will suffer none</p>\n\t\t<p>To pass, and no less hindrance makes than death:</p>\n\t\t<p>So bad and so accursed in her kind,</p>\n\t\t<p>That never sated is her ravenous will,</p>\n\t\t<p>Still after food more craving than before.</p>\n\t\t<p>To many an animal in wedlock vile</p>\n\t\t<p>She fastens, and shall yet to many more,</p>\n\t\t<p>Until that greyhound come, who shall destroy</p>\n\t\t<p>Her with sharp pain. He will not life support</p>\n\t\t<p>By earth nor its base metals, but by love,</p>\n\t\t<p>Wisdom, and virtue, and his land shall be</p>\n\t\t<p>The land &rsquo;twixt either Feltro. In his might</p>\n\t\t<p>Shall safety to Italia&rsquo;s plains arise,</p>\n\t\t<p>For whose fair realm, Camilla, virgin pure,</p>\n\t\t<p>Nisus, Euryalus, and Turnus fell.</p>\n\t\t<p>He with incessant chase through every town</p>\n\t\t<p>Shall worry, until he to hell at length</p>\n\t\t<p>Restore her, thence by envy first let loose.</p>\n\t\t<p>I for thy profit pond&rsquo;ring now devise,</p>\n\t\t<p>That thou mayst follow me, and I thy guide</p>\n\t\t<p>Will lead thee hence through an eternal space,</p>\n\t\t<p>Where thou shalt hear despairing shrieks, and see</p>\n\t\t<p>Spirits of old tormented, who invoke</p>\n\t\t<p>A second death; and those next view, who dwell</p>\n\t\t<p>Content in fire, for that they hope to come,</p>\n\t\t<p>Whene&rsquo;er the time may be, among the blest,</p>\n\t\t<p>Into whose regions if thou then desire</p>\n\t\t<p>T&rsquo; ascend, a spirit worthier then I</p>\n\t\t<p>Must lead thee, in whose charge, when I depart,</p>\n\t\t<p>Thou shalt be left: for that Almighty King,</p>\n\t\t<p>Who reigns above, a rebel to his law,</p>\n\t\t<p>Adjudges me, and therefore hath decreed,</p>\n\t\t<p>That to his city none through me should come.</p>\n\t\t<p>He in all parts hath sway; there rules, there holds</p>\n\t\t<p>His citadel and throne. O happy those,</p>\n\t\t<p>Whom there he chooses!&rdquo; I to him in few:</p>\n\t\t<p>&ldquo;Bard! by that God, whom thou didst not adore,</p>\n\t\t<p>I do beseech thee (that this ill and worse</p>\n\t\t<p>I may escape) to lead me, where thou saidst,</p>\n\t\t<p>That I Saint Peter&rsquo;s gate may view, and those</p>\n\t\t<p>Who as thou tell&rsquo;st, are in such dismal plight.&rdquo;</p>\n\t\t<p class="slindent">Onward he mov&rsquo;d, I close his steps pursu&rsquo;d.</p>\n\t\t</div>','<p class="cantohead">Canto II</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">Now</span> was the day departing, and the air,</p>\n\t\t<p>Imbrown&rsquo;d with shadows, from their toils releas&rsquo;d</p>\n\t\t<p>All animals on earth; and I alone</p>\n\t\t<p>Prepar&rsquo;d myself the conflict to sustain,</p>\n\t\t<p>Both of sad pity, and that perilous road,</p>\n\t\t<p>Which my unerring memory shall retrace.</p>\n\t\t<p class="slindent">O Muses! O high genius! now vouchsafe</p>\n\t\t<p>Your aid! O mind! that all I saw hast kept</p>\n\t\t<p>Safe in a written record, here thy worth</p>\n\t\t<p>And eminent endowments come to proof.</p>\n\t\t<p class="slindent">I thus began: &ldquo;Bard! thou who art my guide,</p>\n\t\t<p>Consider well, if virtue be in me</p>\n\t\t<p>Sufficient, ere to this high enterprise</p>\n\t\t<p>Thou trust me. Thou hast told that Silvius&rsquo; sire,</p>\n\t\t<p>Yet cloth&rsquo;d in corruptible flesh, among</p>\n\t\t<p>Th&rsquo; immortal tribes had entrance, and was there</p>\n\t\t<p>Sensible present. Yet if heaven&rsquo;s great Lord,</p>\n\t\t<p>Almighty foe to ill, such favour shew&rsquo;d,</p>\n\t\t<p>In contemplation of the high effect,</p>\n\t\t<p>Both what and who from him should issue forth,</p>\n\t\t<p>It seems in reason&rsquo;s judgment well deserv&rsquo;d:</p>\n\t\t<p>Sith he of Rome, and of Rome&rsquo;s empire wide,</p>\n\t\t<p>In heaven&rsquo;s empyreal height was chosen sire:</p>\n\t\t<p>Both which, if truth be spoken, were ordain&rsquo;d</p>\n\t\t<p>And &rsquo;stablish&rsquo;d for the holy place, where sits</p>\n\t\t<p>Who to great Peter&rsquo;s sacred chair succeeds.</p>\n\t\t<p>He from this journey, in thy song renown&rsquo;d,</p>\n\t\t<p>Learn&rsquo;d things, that to his victory gave rise</p>\n\t\t<p>And to the papal robe. In after-times</p>\n\t\t<p>The chosen vessel also travel&rsquo;d there,</p>\n\t\t<p>To bring us back assurance in that faith,</p>\n\t\t<p>Which is the entrance to salvation&rsquo;s way.</p>\n\t\t<p>But I, why should I there presume? or who</p>\n\t\t<p>Permits it? not, Aeneas I nor Paul.</p>\n\t\t<p>Myself I deem not worthy, and none else</p>\n\t\t<p>Will deem me. I, if on this voyage then</p>\n\t\t<p>I venture, fear it will in folly end.</p>\n\t\t<p>Thou, who art wise, better my meaning know&rsquo;st,</p>\n\t\t<p>Than I can speak.&rdquo; As one, who unresolves</p>\n\t\t<p>What he hath late resolv&rsquo;d, and with new thoughts</p>\n\t\t<p>Changes his purpose, from his first intent</p>\n\t\t<p>Remov&rsquo;d; e&rsquo;en such was I on that dun coast,</p>\n\t\t<p>Wasting in thought my enterprise, at first</p>\n\t\t<p>So eagerly embrac&rsquo;d. &ldquo;If right thy words</p>\n\t\t<p>I scan,&rdquo; replied that shade magnanimous,</p>\n\t\t<p>&ldquo;Thy soul is by vile fear assail&rsquo;d, which oft</p>\n\t\t<p>So overcasts a man, that he recoils</p>\n\t\t<p>From noblest resolution, like a beast</p>\n\t\t<p>At some false semblance in the twilight gloom.</p>\n\t\t<p>That from this terror thou mayst free thyself,</p>\n\t\t<p>I will instruct thee why I came, and what</p>\n\t\t<p>I heard in that same instant, when for thee</p>\n\t\t<p>Grief touch&rsquo;d me first. I was among the tribe,</p>\n\t\t<p>Who rest suspended, when a dame, so blest</p>\n\t\t<p>And lovely, I besought her to command,</p>\n\t\t<p>Call&rsquo;d me; her eyes were brighter than the star</p>\n\t\t<p>Of day; and she with gentle voice and soft</p>\n\t\t<p>Angelically tun&rsquo;d her speech address&rsquo;d:</p>\n\t\t<p>&ldquo;O courteous shade of Mantua! thou whose fame</p>\n\t\t<p>Yet lives, and shall live long as nature lasts!</p>\n\t\t<p>A friend, not of my fortune but myself,</p>\n\t\t<p>On the wide desert in his road has met</p>\n\t\t<p>Hindrance so great, that he through fear has turn&rsquo;d.</p>\n\t\t<p>Now much I dread lest he past help have stray&rsquo;d,</p>\n\t\t<p>And I be ris&rsquo;n too late for his relief,</p>\n\t\t<p>From what in heaven of him I heard. Speed now,</p>\n\t\t<p>And by thy eloquent persuasive tongue,</p>\n\t\t<p>And by all means for his deliverance meet,</p>\n\t\t<p>Assist him. So to me will comfort spring.</p>\n\t\t<p>I who now bid thee on this errand forth</p>\n\t\t<p>Am Beatrice<span class="note"><span class="noteno">1</span><span class="notetext">I use this word, as it is pronounced in the Italian, as consisting of four syllables, of which the third is a long one.</span></span>; from a place I come</p>\n\t\t<p>Revisited with joy. Love brought me thence,</p>\n\t\t<p>Who prompts my speech. When in my Master&rsquo;s sight</p>\n\t\t<p>I stand, thy praise to him I oft will tell.&rdquo;</p>\n\t\t<p class="slindent">She then was silent, and I thus began:</p>\n\t\t<p>&ldquo;O Lady! by whose influence alone,</p>\n\t\t<p>Mankind excels whatever is contain&rsquo;d</p>\n\t\t<p>Within that heaven which hath the smallest orb,</p>\n\t\t<p>So thy command delights me, that to obey,</p>\n\t\t<p>If it were done already, would seem late.</p>\n\t\t<p>No need hast thou farther to speak thy will;</p>\n\t\t<p>Yet tell the reason, why thou art not loth</p>\n\t\t<p>To leave that ample space, where to return</p>\n\t\t<p>Thou burnest, for this centre here beneath.&rdquo;</p>\n\t\t<p class="slindent">She then: &ldquo;Since thou so deeply wouldst inquire,</p>\n\t\t<p>I will instruct thee briefly, why no dread</p>\n\t\t<p>Hinders my entrance here. Those things alone</p>\n\t\t<p>Are to be fear&rsquo;d, whence evil may proceed,</p>\n\t\t<p>None else, for none are terrible beside.</p>\n\t\t<p>I am so fram&rsquo;d by God, thanks to his grace!</p>\n\t\t<p>That any suff&rsquo;rance of your misery</p>\n\t\t<p>Touches me not, nor flame of that fierce fire</p>\n\t\t<p>Assails me. In high heaven a blessed dame</p>\n\t\t<p>Besides, who mourns with such effectual grief</p>\n\t\t<p>That hindrance, which I send thee to remove,</p>\n\t\t<p>That God&rsquo;s stern judgment to her will inclines.&rdquo;</p>\n\t\t<p>To Lucia calling, her she thus bespake:</p>\n\t\t<p>&ldquo;Now doth thy faithful servant need thy aid</p>\n\t\t<p>And I commend him to thee.&rdquo; At her word</p>\n\t\t<p>Sped Lucia, of all cruelty the foe,</p>\n\t\t<p>And coming to the place, where I abode</p>\n\t\t<p>Seated with Rachel, her of ancient days,</p>\n\t\t<p>She thus address&rsquo;d me: &ldquo;Thou true praise of God!</p>\n\t\t<p>Beatrice! why is not thy succour lent</p>\n\t\t<p>To him, who so much lov&rsquo;d thee, as to leave</p>\n\t\t<p>For thy sake all the multitude admires?</p>\n\t\t<p>Dost thou not hear how pitiful his wail,</p>\n\t\t<p>Nor mark the death, which in the torrent flood,</p>\n\t\t<p>Swoln mightier than a sea, him struggling holds?&rdquo;</p>\n\t\t<p>&ldquo;Ne&rsquo;er among men did any with such speed</p>\n\t\t<p>Haste to their profit, flee from their annoy,</p>\n\t\t<p>As when these words were spoken, I came here,</p>\n\t\t<p>Down from my blessed seat, trusting the force</p>\n\t\t<p>Of thy pure eloquence, which thee, and all</p>\n\t\t<p>Who well have mark&rsquo;d it, into honour brings.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;When she had ended, her bright beaming eyes</p>\n\t\t<p>Tearful she turn&rsquo;d aside; whereat I felt</p>\n\t\t<p>Redoubled zeal to serve thee. As she will&rsquo;d,</p>\n\t\t<p>Thus am I come: I sav&rsquo;d thee from the beast,</p>\n\t\t<p>Who thy near way across the goodly mount</p>\n\t\t<p>Prevented. What is this comes o&rsquo;er thee then?</p>\n\t\t<p>Why, why dost thou hang back? why in thy breast</p>\n\t\t<p>Harbour vile fear? why hast not courage there</p>\n\t\t<p>And noble daring? Since three maids so blest</p>\n\t\t<p>Thy safety plan, e&rsquo;en in the court of heaven;</p>\n\t\t<p>And so much certain good my words forebode.&rdquo;</p>\n\t\t<p class="slindent">As florets, by the frosty air of night</p>\n\t\t<p>Bent down and clos&rsquo;d, when day has blanch&rsquo;d their leaves,</p>\n\t\t<p>Rise all unfolded on their spiry stems;</p>\n\t\t<p>So was my fainting vigour new restor&rsquo;d,</p>\n\t\t<p>And to my heart such kindly courage ran,</p>\n\t\t<p>That I as one undaunted soon replied:</p>\n\t\t<p>&ldquo;O full of pity she, who undertook</p>\n\t\t<p>My succour! and thou kind who didst perform</p>\n\t\t<p>So soon her true behest! With such desire</p>\n\t\t<p>Thou hast dispos&rsquo;d me to renew my voyage,</p>\n\t\t<p>That my first purpose fully is resum&rsquo;d.</p>\n\t\t<p>Lead on: one only will is in us both.</p>\n\t\t<p>Thou art my guide, my master thou, and lord.&rdquo;</p>\n\t\t<p class="slindent">So spake I; and when he had onward mov&rsquo;d,</p>\n\t\t<p>I enter&rsquo;d on the deep and woody way.</p>\n\t\t</div>','<p class="cantohead">Canto III</p>\n\t\t<div class="stanza">\n\t\t<p>&ldquo;<span class="sc">Through</span> me you pass into the city of woe:</p>\n\t\t<p>Through me you pass into eternal pain:</p>\n\t\t<p>Through me among the people lost for aye.</p>\n\t\t<p>Justice the founder of my fabric mov&rsquo;d:</p>\n\t\t<p>To rear me was the task of power divine,</p>\n\t\t<p>Supremest wisdom, and primeval love.</p>\n\t\t<p>Before me things create were none, save things</p>\n\t\t<p>Eternal, and eternal I endure.</p>\n\t\t<p>&ldquo;All hope abandon ye who enter here.&rdquo;</p>\n\t\t<p class="slindent">Such characters in colour dim I mark&rsquo;d</p>\n\t\t<p>Over a portal&rsquo;s lofty arch inscrib&rsquo;d:</p>\n\t\t<p>Whereat I thus: &ldquo;Master, these words import</p>\n\t\t<p>Hard meaning.&rdquo; He as one prepar&rsquo;d replied:</p>\n\t\t<p>&ldquo;Here thou must all distrust behind thee leave;</p>\n\t\t<p>Here be vile fear extinguish&rsquo;d. We are come</p>\n\t\t<p>Where I have told thee we shall see the souls</p>\n\t\t<p>To misery doom&rsquo;d, who intellectual good</p>\n\t\t<p>Have lost.&rdquo; And when his hand he had stretch&rsquo;d forth</p>\n\t\t<p>To mine, with pleasant looks, whence I was cheer&rsquo;d,</p>\n\t\t<p>Into that secret place he led me on.</p>\n\t\t<p class="slindent">Here sighs with lamentations and loud moans</p>\n\t\t<p>Resounded through the air pierc&rsquo;d by no star,</p>\n\t\t<p>That e&rsquo;en I wept at entering. Various tongues,</p>\n\t\t<p>Horrible languages, outcries of woe,</p>\n\t\t<p>Accents of anger, voices deep and hoarse,</p>\n\t\t<p>With hands together smote that swell&rsquo;d the sounds,</p>\n\t\t<p>Made up a tumult, that for ever whirls</p>\n\t\t<p>Round through that air with solid darkness stain&rsquo;d,</p>\n\t\t<p>Like to the sand that in the whirlwind flies.</p>\n\t\t<p class="slindent">I then, with error yet encompass&rsquo;d, cried:</p>\n\t\t<p>&ldquo;O master! What is this I hear? What race</p>\n\t\t<p>Are these, who seem so overcome with woe?&rdquo;</p>\n\t\t<p class="slindent">He thus to me: &ldquo;This miserable fate</p>\n\t\t<p>Suffer the wretched souls of those, who liv&rsquo;d</p>\n\t\t<p>Without or praise or blame, with that ill band</p>\n\t\t<p>Of angels mix&rsquo;d, who nor rebellious prov&rsquo;d</p>\n\t\t<p>Nor yet were true to God, but for themselves</p>\n\t\t<p>Were only. From his bounds Heaven drove them forth,</p>\n\t\t<p>Not to impair his lustre, nor the depth</p>\n\t\t<p>Of Hell receives them, lest th&rsquo; accursed tribe</p>\n\t\t<p>Should glory thence with exultation vain.&rdquo;</p>\n\t\t<p class="slindent">I then: &ldquo;Master! what doth aggrieve them thus,</p>\n\t\t<p>That they lament so loud?&rdquo; He straight replied:</p>\n\t\t<p>&ldquo;That will I tell thee briefly. These of death</p>\n\t\t<p>No hope may entertain: and their blind life</p>\n\t\t<p>So meanly passes, that all other lots</p>\n\t\t<p>They envy. Fame of them the world hath none,</p>\n\t\t<p>Nor suffers; mercy and justice scorn them both.</p>\n\t\t<p>Speak not of them, but look, and pass them by.&rdquo;</p>\n\t\t<p class="slindent">And I, who straightway look&rsquo;d, beheld a flag,</p>\n\t\t<p>Which whirling ran around so rapidly,</p>\n\t\t<p>That it no pause obtain&rsquo;d: and following came</p>\n\t\t<p>Such a long train of spirits, I should ne&rsquo;er</p>\n\t\t<p>Have thought, that death so many had despoil&rsquo;d.</p>\n\t\t<p class="slindent">When some of these I recogniz&rsquo;d, I saw</p>\n\t\t<p>And knew the shade of him, who to base fear</p>\n\t\t<p>Yielding, abjur&rsquo;d his high estate. Forthwith</p>\n\t\t<p>I understood for certain this the tribe</p>\n\t\t<p>Of those ill spirits both to God displeasing</p>\n\t\t<p>And to his foes. These wretches, who ne&rsquo;er lived,</p>\n\t\t<p>Went on in nakedness, and sorely stung</p>\n\t\t<p>By wasps and hornets, which bedew&rsquo;d their cheeks</p>\n\t\t<p>With blood, that mix&rsquo;d with tears dropp&rsquo;d to their feet,</p>\n\t\t<p>And by disgustful worms was gather&rsquo;d there.</p>\n\t\t<p class="slindent">Then looking farther onwards I beheld</p>\n\t\t<p>A throng upon the shore of a great stream:</p>\n\t\t<p>Whereat I thus: &ldquo;Sir! grant me now to know</p>\n\t\t<p>Whom here we view, and whence impell&rsquo;d they seem</p>\n\t\t<p>So eager to pass o&rsquo;er, as I discern</p>\n\t\t<p>Through the blear light?&rdquo; He thus to me in few:</p>\n\t\t<p>&ldquo;This shalt thou know, soon as our steps arrive</p>\n\t\t<p>Beside the woeful tide of Acheron.&rdquo;</p>\n\t\t<p class="slindent">Then with eyes downward cast and fill&rsquo;d with shame,</p>\n\t\t<p>Fearing my words offensive to his ear,</p>\n\t\t<p>Till we had reach&rsquo;d the river, I from speech</p>\n\t\t<p>Abstain&rsquo;d. And lo! toward us in a bark</p>\n\t\t<p>Comes on an old man hoary white with eld,</p>\n\t\t<p>Crying, &ldquo;Woe to you wicked spirits! hope not</p>\n\t\t<p>Ever to see the sky again. I come</p>\n\t\t<p>To take you to the other shore across,</p>\n\t\t<p>Into eternal darkness, there to dwell</p>\n\t\t<p>In fierce heat and in ice. And thou, who there</p>\n\t\t<p>Standest, live spirit! get thee hence, and leave</p>\n\t\t<p>These who are dead.&rdquo; But soon as he beheld</p>\n\t\t<p>I left them not, &ldquo;By other way,&rdquo; said he,</p>\n\t\t<p>&ldquo;By other haven shalt thou come to shore,</p>\n\t\t<p>Not by this passage; thee a nimbler boat</p>\n\t\t<p>Must carry.&rdquo; Then to him thus spake my guide:</p>\n\t\t<p>&ldquo;Charon! thyself torment not: so &rsquo;t is will&rsquo;d,</p>\n\t\t<p>Where will and power are one: ask thou no more.&rdquo;</p>\n\t\t<p class="slindent">Straightway in silence fell the shaggy cheeks</p>\n\t\t<p>Of him the boatman o&rsquo;er the livid lake,</p>\n\t\t<p>Around whose eyes glar&rsquo;d wheeling flames. Meanwhile</p>\n\t\t<p>Those spirits, faint and naked, color chang&rsquo;d,</p>\n\t\t<p>And gnash&rsquo;d their teeth, soon as the cruel words</p>\n\t\t<p>They heard. God and their parents they blasphem&rsquo;d,</p>\n\t\t<p>The human kind, the place, the time, and seed</p>\n\t\t<p>That did engender them and give them birth.</p>\n\t\t<p class="slindent">Then all together sorely wailing drew</p>\n\t\t<p>To the curs&rsquo;d strand, that every man must pass</p>\n\t\t<p>Who fears not God. Charon, demoniac form,</p>\n\t\t<p>With eyes of burning coal, collects them all,</p>\n\t\t<p>Beck&rsquo;ning, and each, that lingers, with his oar</p>\n\t\t<p>Strikes. As fall off the light autumnal leaves,</p>\n\t\t<p>One still another following, till the bough</p>\n\t\t<p>Strews all its honours on the earth beneath;</p>\n\t\t<p>E&rsquo;en in like manner Adam&rsquo;s evil brood</p>\n\t\t<p>Cast themselves one by one down from the shore,</p>\n\t\t<p>Each at a beck, as falcon at his call.</p>\n\t\t<p class="slindent">Thus go they over through the umber&rsquo;d wave,</p>\n\t\t<p>And ever they on the opposing bank</p>\n\t\t<p>Be landed, on this side another throng</p>\n\t\t<p>Still gathers. &ldquo;Son,&rdquo; thus spake the courteous guide,</p>\n\t\t<p>&ldquo;Those, who die subject to the wrath of God,</p>\n\t\t<p>All here together come from every clime,</p>\n\t\t<p>And to o&rsquo;erpass the river are not loth:</p>\n\t\t<p>For so heaven&rsquo;s justice goads them on, that fear</p>\n\t\t<p>Is turn&rsquo;d into desire. Hence ne&rsquo;er hath past</p>\n\t\t<p>Good spirit. If of thee Charon complain,</p>\n\t\t<p>Now mayst thou know the import of his words.&rdquo;</p>\n\t\t<p class="slindent">This said, the gloomy region trembling shook</p>\n\t\t<p>So terribly, that yet with clammy dews</p>\n\t\t<p>Fear chills my brow. The sad earth gave a blast,</p>\n\t\t<p>That, lightening, shot forth a vermilion flame,</p>\n\t\t<p>Which all my senses conquer&rsquo;d quite, and I</p>\n\t\t<p>Down dropp&rsquo;d, as one with sudden slumber seiz&rsquo;d.</p>\n\t\t</div>','<p class="cantohead">Canto IV</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">Broke</span> the deep slumber in my brain a crash</p>\n\t\t<p>Of heavy thunder, that I shook myself,</p>\n\t\t<p>As one by main force rous&rsquo;d. Risen upright,</p>\n\t\t<p>My rested eyes I mov&rsquo;d around, and search&rsquo;d</p>\n\t\t<p>With fixed ken to know what place it was,</p>\n\t\t<p>Wherein I stood. For certain on the brink</p>\n\t\t<p>I found me of the lamentable vale,</p>\n\t\t<p>The dread abyss, that joins a thund&rsquo;rous sound</p>\n\t\t<p>Of plaints innumerable. Dark and deep,</p>\n\t\t<p>And thick with clouds o&rsquo;erspread, mine eye in vain</p>\n\t\t<p>Explor&rsquo;d its bottom, nor could aught discern.</p>\n\t\t<p class="slindent">&ldquo;Now let us to the blind world there beneath</p>\n\t\t<p>Descend;&rdquo; the bard began all pale of look:</p>\n\t\t<p>&ldquo;I go the first, and thou shalt follow next.&rdquo;</p>\n\t\t<p class="slindent">Then I his alter&rsquo;d hue perceiving, thus:</p>\n\t\t<p>&ldquo;How may I speed, if thou yieldest to dread,</p>\n\t\t<p>Who still art wont to comfort me in doubt?&rdquo;</p>\n\t\t<p class="slindent">He then: &ldquo;The anguish of that race below</p>\n\t\t<p>With pity stains my cheek, which thou for fear</p>\n\t\t<p>Mistakest. Let us on. Our length of way</p>\n\t\t<p>Urges to haste.&rdquo; Onward, this said, he mov&rsquo;d;</p>\n\t\t<p>And ent&rsquo;ring led me with him on the bounds</p>\n\t\t<p>Of the first circle, that surrounds th&rsquo; abyss.</p>\n\t\t<p>Here, as mine ear could note, no plaint was heard</p>\n\t\t<p>Except of sighs, that made th&rsquo; eternal air</p>\n\t\t<p>Tremble, not caus&rsquo;d by tortures, but from grief</p>\n\t\t<p>Felt by those multitudes, many and vast,</p>\n\t\t<p>Of men, women, and infants. Then to me</p>\n\t\t<p>The gentle guide: &ldquo;Inquir&rsquo;st thou not what spirits</p>\n\t\t<p>Are these, which thou beholdest? Ere thou pass</p>\n\t\t<p>Farther, I would thou know, that these of sin</p>\n\t\t<p>Were blameless; and if aught they merited,</p>\n\t\t<p>It profits not, since baptism was not theirs,</p>\n\t\t<p>The portal to thy faith. If they before</p>\n\t\t<p>The Gospel liv&rsquo;d, they serv&rsquo;d not God aright;</p>\n\t\t<p>And among such am I. For these defects,</p>\n\t\t<p>And for no other evil, we are lost;&rdquo;</p>\n\t\t<p>&ldquo;Only so far afflicted, that we live</p>\n\t\t<p>Desiring without hope.&rdquo; So grief assail&rsquo;d</p>\n\t\t<p>My heart at hearing this, for well I knew</p>\n\t\t<p>Suspended in that Limbo many a soul</p>\n\t\t<p>Of mighty worth. &ldquo;O tell me, sire rever&rsquo;d!</p>\n\t\t<p>Tell me, my master!&rdquo; I began through wish</p>\n\t\t<p>Of full assurance in that holy faith,</p>\n\t\t<p>Which vanquishes all error; &ldquo;say, did e&rsquo;er</p>\n\t\t<p>Any, or through his own or other&rsquo;s merit,</p>\n\t\t<p>Come forth from thence, whom afterward was blest?&rdquo;</p>\n\t\t<p class="slindent">Piercing the secret purport of my speech,</p>\n\t\t<p>He answer&rsquo;d: &ldquo;I was new to that estate,</p>\n\t\t<p>When I beheld a puissant one arrive</p>\n\t\t<p>Amongst us, with victorious trophy crown&rsquo;d.</p>\n\t\t<p>He forth the shade of our first parent drew,</p>\n\t\t<p>Abel his child, and Noah righteous man,</p>\n\t\t<p>Of Moses lawgiver for faith approv&rsquo;d,</p>\n\t\t<p>Of patriarch Abraham, and David king,</p>\n\t\t<p>Israel with his sire and with his sons,</p>\n\t\t<p>Nor without Rachel whom so hard he won,</p>\n\t\t<p>And others many more, whom he to bliss</p>\n\t\t<p>Exalted. Before these, be thou assur&rsquo;d,</p>\n\t\t<p>No spirit of human kind was ever sav&rsquo;d.&rdquo;</p>\n\t\t<p class="slindent">We, while he spake, ceas&rsquo;d not our onward road,</p>\n\t\t<p>Still passing through the wood; for so I name</p>\n\t\t<p>Those spirits thick beset. We were not far</p>\n\t\t<p>On this side from the summit, when I kenn&rsquo;d</p>\n\t\t<p>A flame, that o&rsquo;er the darken&rsquo;d hemisphere</p>\n\t\t<p>Prevailing shin&rsquo;d. Yet we a little space</p>\n\t\t<p>Were distant, not so far but I in part</p>\n\t\t<p>Discover&rsquo;d, that a tribe in honour high</p>\n\t\t<p>That place possess&rsquo;d. &ldquo;O thou, who every art</p>\n\t\t<p>And science valu&rsquo;st! who are these, that boast</p>\n\t\t<p>Such honour, separate from all the rest?&rdquo;</p>\n\t\t<p class="slindent">He answer&rsquo;d: &ldquo;The renown of their great names</p>\n\t\t<p>That echoes through your world above, acquires</p>\n\t\t<p>Favour in heaven, which holds them thus advanc&rsquo;d.&rdquo;</p>\n\t\t<p>Meantime a voice I heard: &ldquo;Honour the bard</p>\n\t\t<p>Sublime! his shade returns that left us late!&rdquo;</p>\n\t\t<p>No sooner ceas&rsquo;d the sound, than I beheld</p>\n\t\t<p>Four mighty spirits toward us bend their steps,</p>\n\t\t<p>Of semblance neither sorrowful nor glad.</p>\n\t\t<p class="slindent">When thus my master kind began: &ldquo;Mark him,</p>\n\t\t<p>Who in his right hand bears that falchion keen,</p>\n\t\t<p>The other three preceding, as their lord.</p>\n\t\t<p>This is that Homer, of all bards supreme:</p>\n\t\t<p>Flaccus the next in satire&rsquo;s vein excelling;</p>\n\t\t<p>The third is Naso; Lucan is the last.</p>\n\t\t<p>Because they all that appellation own,</p>\n\t\t<p>With which the voice singly accosted me,</p>\n\t\t<p>Honouring they greet me thus, and well they judge.&rdquo;</p>\n\t\t<p class="slindent">So I beheld united the bright school</p>\n\t\t<p>Of him the monarch of sublimest song,</p>\n\t\t<p>That o&rsquo;er the others like an eagle soars.</p>\n\t\t<p>When they together short discourse had held,</p>\n\t\t<p>They turn&rsquo;d to me, with salutation kind</p>\n\t\t<p>Beck&rsquo;ning me; at the which my master smil&rsquo;d:</p>\n\t\t<p>Nor was this all; but greater honour still</p>\n\t\t<p>They gave me, for they made me of their tribe;</p>\n\t\t<p>And I was sixth amid so learn&rsquo;d a band.</p>\n\t\t<p class="slindent">Far as the luminous beacon on we pass&rsquo;d</p>\n\t\t<p>Speaking of matters, then befitting well</p>\n\t\t<p>To speak, now fitter left untold. At foot</p>\n\t\t<p>Of a magnificent castle we arriv&rsquo;d,</p>\n\t\t<p>Seven times with lofty walls begirt, and round</p>\n\t\t<p>Defended by a pleasant stream. O&rsquo;er this</p>\n\t\t<p>As o&rsquo;er dry land we pass&rsquo;d. Next through seven gates</p>\n\t\t<p>I with those sages enter&rsquo;d, and we came</p>\n\t\t<p>Into a mead with lively verdure fresh.</p>\n\t\t<p class="slindent">There dwelt a race, who slow their eyes around</p>\n\t\t<p>Majestically mov&rsquo;d, and in their port</p>\n\t\t<p>Bore eminent authority; they spake</p>\n\t\t<p>Seldom, but all their words were tuneful sweet.</p>\n\t\t<p class="slindent">We to one side retir&rsquo;d, into a place</p>\n\t\t<p>Open and bright and lofty, whence each one</p>\n\t\t<p>Stood manifest to view. Incontinent</p>\n\t\t<p>There on the green enamel of the plain</p>\n\t\t<p>Were shown me the great spirits, by whose sight</p>\n\t\t<p>I am exalted in my own esteem.</p>\n\t\t<p class="slindent">Electra there I saw accompanied</p>\n\t\t<p>By many, among whom Hector I knew,</p>\n\t\t<p>Anchises&rsquo; pious son, and with hawk&rsquo;s eye</p>\n\t\t<p>Caesar all arm&rsquo;d, and by Camilla there</p>\n\t\t<p>Penthesilea. On the other side</p>\n\t\t<p>Old King Latinus, seated by his child</p>\n\t\t<p>Lavinia, and that Brutus I beheld,</p>\n\t\t<p>Who Tarquin chas&rsquo;d, Lucretia, Cato&rsquo;s wife</p>\n\t\t<p>Marcia, with Julia and Cornelia there;</p>\n\t\t<p>And sole apart retir&rsquo;d, the Soldan fierce.</p>\n\t\t<p class="slindent">Then when a little more I rais&rsquo;d my brow,</p>\n\t\t<p>I spied the master of the sapient throng,</p>\n\t\t<p>Seated amid the philosophic train.</p>\n\t\t<p>Him all admire, all pay him rev&rsquo;rence due.</p>\n\t\t<p>There Socrates and Plato both I mark&rsquo;d,</p>\n\t\t<p>Nearest to him in rank; Democritus,</p>\n\t\t<p>Who sets the world at chance, Diogenes,</p>\n\t\t<p>With Heraclitus, and Empedocles,</p>\n\t\t<p>And Anaxagoras, and Thales sage,</p>\n\t\t<p>Zeno, and Dioscorides well read</p>\n\t\t<p>In nature&rsquo;s secret lore. Orpheus I mark&rsquo;d</p>\n\t\t<p>And Linus, Tully and moral Seneca,</p>\n\t\t<p>Euclid and Ptolemy, Hippocrates,</p>\n\t\t<p>Galenus, Avicen, and him who made</p>\n\t\t<p>That commentary vast, Averroes.</p>\n\t\t<p class="slindent">Of all to speak at full were vain attempt;</p>\n\t\t<p>For my wide theme so urges, that ofttimes</p>\n\t\t<p>My words fall short of what bechanc&rsquo;d. In two</p>\n\t\t<p>The six associates part. Another way</p>\n\t\t<p>My sage guide leads me, from that air serene,</p>\n\t\t<p>Into a climate ever vex&rsquo;d with storms:</p>\n\t\t<p>And to a part I come where no light shines.</p>\n\t\t</div>','<p class="cantohead">Canto V</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">From</span> the first circle I descended thus</p>\n\t\t<p>Down to the second, which, a lesser space</p>\n\t\t<p>Embracing, so much more of grief contains</p>\n\t\t<p>Provoking bitter moans. There, Minos stands</p>\n\t\t<p>Grinning with ghastly feature: he, of all</p>\n\t\t<p>Who enter, strict examining the crimes,</p>\n\t\t<p>Gives sentence, and dismisses them beneath,</p>\n\t\t<p>According as he foldeth him around:</p>\n\t\t<p>For when before him comes th&rsquo; ill fated soul,</p>\n\t\t<p>It all confesses; and that judge severe</p>\n\t\t<p>Of sins, considering what place in hell</p>\n\t\t<p>Suits the transgression, with his tail so oft</p>\n\t\t<p>Himself encircles, as degrees beneath</p>\n\t\t<p>He dooms it to descend. Before him stand</p>\n\t\t<p>Always a num&rsquo;rous throng; and in his turn</p>\n\t\t<p>Each one to judgment passing, speaks, and hears</p>\n\t\t<p>His fate, thence downward to his dwelling hurl&rsquo;d.</p>\n\t\t<p class="slindent">&ldquo;O thou! who to this residence of woe</p>\n\t\t<p>Approachest?&rdquo; when he saw me coming, cried</p>\n\t\t<p>Minos, relinquishing his dread employ,</p>\n\t\t<p>&ldquo;Look how thou enter here; beware in whom</p>\n\t\t<p>Thou place thy trust; let not the entrance broad</p>\n\t\t<p>Deceive thee to thy harm.&rdquo; To him my guide:</p>\n\t\t<p>&ldquo;Wherefore exclaimest? Hinder not his way</p>\n\t\t<p>By destiny appointed; so &rsquo;tis will&rsquo;d</p>\n\t\t<p>Where will and power are one. Ask thou no more.&rdquo;</p>\n\t\t<p class="slindent">Now &rsquo;gin the rueful wailings to be heard.</p>\n\t\t<p>Now am I come where many a plaining voice</p>\n\t\t<p>Smites on mine ear. Into a place I came</p>\n\t\t<p>Where light was silent all. Bellowing there groan&rsquo;d</p>\n\t\t<p>A noise as of a sea in tempest torn</p>\n\t\t<p>By warring winds. The stormy blast of hell</p>\n\t\t<p>With restless fury drives the spirits on</p>\n\t\t<p>Whirl&rsquo;d round and dash&rsquo;d amain with sore annoy.</p>\n\t\t<p>When they arrive before the ruinous sweep,</p>\n\t\t<p>There shrieks are heard, there lamentations, moans,</p>\n\t\t<p>And blasphemies &rsquo;gainst the good Power in heaven.</p>\n\t\t<p class="slindent">I understood that to this torment sad</p>\n\t\t<p>The carnal sinners are condemn&rsquo;d, in whom</p>\n\t\t<p>Reason by lust is sway&rsquo;d. As in large troops</p>\n\t\t<p>And multitudinous, when winter reigns,</p>\n\t\t<p>The starlings on their wings are borne abroad;</p>\n\t\t<p>So bears the tyrannous gust those evil souls.</p>\n\t\t<p>On this side and on that, above, below,</p>\n\t\t<p>It drives them: hope of rest to solace them</p>\n\t\t<p>Is none, nor e&rsquo;en of milder pang. As cranes,</p>\n\t\t<p>Chanting their dol&rsquo;rous notes, traverse the sky,</p>\n\t\t<p>Stretch&rsquo;d out in long array: so I beheld</p>\n\t\t<p>Spirits, who came loud wailing, hurried on</p>\n\t\t<p>By their dire doom. Then I: &ldquo;Instructor! who</p>\n\t\t<p>Are these, by the black air so scourg&rsquo;d?&rdquo;&mdash;&ldquo;The first</p>\n\t\t<p>&rsquo;Mong those, of whom thou question&rsquo;st,&rdquo; he replied,</p>\n\t\t<p>&ldquo;O&rsquo;er many tongues was empress. She in vice</p>\n\t\t<p>Of luxury was so shameless, that she made</p>\n\t\t<p>Liking be lawful by promulg&rsquo;d decree,</p>\n\t\t<p>To clear the blame she had herself incurr&rsquo;d.</p>\n\t\t<p>This is Semiramis, of whom &rsquo;tis writ,</p>\n\t\t<p>That she succeeded Ninus her espous&rsquo;d;</p>\n\t\t<p>And held the land, which now the Soldan rules.</p>\n\t\t<p>The next in amorous fury slew herself,</p>\n\t\t<p>And to Sicheus&rsquo; ashes broke her faith:</p>\n\t\t<p>Then follows Cleopatra, lustful queen.&rdquo;</p>\n\t\t<p class="slindent">There mark&rsquo;d I Helen, for whose sake so long</p>\n\t\t<p>The time was fraught with evil; there the great</p>\n\t\t<p>Achilles, who with love fought to the end.</p>\n\t\t<p>Paris I saw, and Tristan; and beside</p>\n\t\t<p>A thousand more he show&rsquo;d me, and by name</p>\n\t\t<p>Pointed them out, whom love bereav&rsquo;d of life.</p>\n\t\t<p class="slindent">When I had heard my sage instructor name</p>\n\t\t<p>Those dames and knights of antique days, o&rsquo;erpower&rsquo;d</p>\n\t\t<p>By pity, well-nigh in amaze my mind</p>\n\t\t<p>Was lost; and I began: &ldquo;Bard! willingly</p>\n\t\t<p>I would address those two together coming,</p>\n\t\t<p>Which seem so light before the wind.&rdquo; He thus:</p>\n\t\t<p>&ldquo;Note thou, when nearer they to us approach.&rdquo;</p>\n\t\t<p>&ldquo;Then by that love which carries them along,</p>\n\t\t<p>Entreat; and they will come.&rdquo; Soon as the wind</p>\n\t\t<p>Sway&rsquo;d them toward us, I thus fram&rsquo;d my speech:</p>\n\t\t<p>&ldquo;O wearied spirits! come, and hold discourse</p>\n\t\t<p>With us, if by none else restrain&rsquo;d.&rdquo; As doves</p>\n\t\t<p>By fond desire invited, on wide wings</p>\n\t\t<p>And firm, to their sweet nest returning home,</p>\n\t\t<p>Cleave the air, wafted by their will along;</p>\n\t\t<p>Thus issu&rsquo;d from that troop, where Dido ranks,</p>\n\t\t<p>They through the ill air speeding; with such force</p>\n\t\t<p>My cry prevail&rsquo;d by strong affection urg&rsquo;d.</p>\n\t\t<p class="slindent">&ldquo;O gracious creature and benign! who go&rsquo;st</p>\n\t\t<p>Visiting, through this element obscure,</p>\n\t\t<p>Us, who the world with bloody stain imbru&rsquo;d;</p>\n\t\t<p>If for a friend the King of all we own&rsquo;d,</p>\n\t\t<p>Our pray&rsquo;r to him should for thy peace arise,</p>\n\t\t<p>Since thou hast pity on our evil plight.</p>\n\t\t<p>()f whatsoe&rsquo;er to hear or to discourse</p>\n\t\t<p>It pleases thee, that will we hear, of that</p>\n\t\t<p>Freely with thee discourse, while e&rsquo;er the wind,</p>\n\t\t<p>As now, is mute. The land, that gave me birth,</p>\n\t\t<p>Is situate on the coast, where Po descends</p>\n\t\t<p>To rest in ocean with his sequent streams.</p>\n\t\t<p class="slindent">&ldquo;Love, that in gentle heart is quickly learnt,</p>\n\t\t<p>Entangled him by that fair form, from me</p>\n\t\t<p>Ta&rsquo;en in such cruel sort, as grieves me still:</p>\n\t\t<p>Love, that denial takes from none belov&rsquo;d,</p>\n\t\t<p>Caught me with pleasing him so passing well,</p>\n\t\t<p>That, as thou see&rsquo;st, he yet deserts me not.</p>\n\t\t<p>&ldquo;Love brought us to one death: Caina waits</p>\n\t\t<p>The soul, who spilt our life.&rdquo; Such were their words;</p>\n\t\t<p>At hearing which downward I bent my looks,</p>\n\t\t<p>And held them there so long, that the bard cried:</p>\n\t\t<p>&ldquo;What art thou pond&rsquo;ring?&rdquo; I in answer thus:</p>\n\t\t<p>&ldquo;Alas! by what sweet thoughts, what fond desire</p>\n\t\t<p>Must they at length to that ill pass have reach&rsquo;d!&rdquo;</p>\n\t\t<p class="slindent">Then turning, I to them my speech address&rsquo;d.</p>\n\t\t<p>And thus began: &ldquo;Francesca! your sad fate</p>\n\t\t<p>Even to tears my grief and pity moves.</p>\n\t\t<p>But tell me; in the time of your sweet sighs,</p>\n\t\t<p>By what, and how love granted, that ye knew</p>\n\t\t<p>Your yet uncertain wishes?&rdquo; She replied:</p>\n\t\t<p>&ldquo;No greater grief than to remember days</p>\n\t\t<p>Of joy, when mis&rsquo;ry is at hand! That kens</p>\n\t\t<p>Thy learn&rsquo;d instructor. Yet so eagerly</p>\n\t\t<p>If thou art bent to know the primal root,</p>\n\t\t<p>From whence our love gat being, I will do,</p>\n\t\t<p>As one, who weeps and tells his tale. One day</p>\n\t\t<p>For our delight we read of Lancelot,</p>\n\t\t<p>How him love thrall&rsquo;d. Alone we were, and no</p>\n\t\t<p>Suspicion near us. Ofttimes by that reading</p>\n\t\t<p>Our eyes were drawn together, and the hue</p>\n\t\t<p>Fled from our alter&rsquo;d cheek. But at one point</p>\n\t\t<p>Alone we fell. When of that smile we read,</p>\n\t\t<p>The wished smile, rapturously kiss&rsquo;d</p>\n\t\t<p>By one so deep in love, then he, who ne&rsquo;er</p>\n\t\t<p>From me shall separate, at once my lips</p>\n\t\t<p>All trembling kiss&rsquo;d. The book and writer both</p>\n\t\t<p>Were love&rsquo;s purveyors. In its leaves that day</p>\n\t\t<p>We read no more.&rdquo; While thus one spirit spake,</p>\n\t\t<p>The other wail&rsquo;d so sorely, that heartstruck</p>\n\t\t<p>I through compassion fainting, seem&rsquo;d not far</p>\n\t\t<p>From death, and like a corpse fell to the ground.</p>\n\t\t</div>','<p class="cantohead">Canto VI</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">My</span> sense reviving, that erewhile had droop&rsquo;d</p>\n\t\t<p>With pity for the kindred shades, whence grief</p>\n\t\t<p>O&rsquo;ercame me wholly, straight around I see</p>\n\t\t<p>New torments, new tormented souls, which way</p>\n\t\t<p>Soe&rsquo;er I move, or turn, or bend my sight.</p>\n\t\t<p>In the third circle I arrive, of show&rsquo;rs</p>\n\t\t<p>Ceaseless, accursed, heavy, and cold, unchang&rsquo;d</p>\n\t\t<p>For ever, both in kind and in degree.</p>\n\t\t<p>Large hail, discolour&rsquo;d water, sleety flaw</p>\n\t\t<p>Through the dun midnight air stream&rsquo;d down amain:</p>\n\t\t<p>Stank all the land whereon that tempest fell.</p>\n\t\t<p class="slindent">Cerberus, cruel monster, fierce and strange,</p>\n\t\t<p>Through his wide threefold throat barks as a dog</p>\n\t\t<p>Over the multitude immers&rsquo;d beneath.</p>\n\t\t<p>His eyes glare crimson, black his unctuous beard,</p>\n\t\t<p>His belly large, and claw&rsquo;d the hands, with which</p>\n\t\t<p>He tears the spirits, flays them, and their limbs</p>\n\t\t<p>Piecemeal disparts. Howling there spread, as curs,</p>\n\t\t<p>Under the rainy deluge, with one side</p>\n\t\t<p>The other screening, oft they roll them round,</p>\n\t\t<p>A wretched, godless crew. When that great worm</p>\n\t\t<p>Descried us, savage Cerberus, he op&rsquo;d</p>\n\t\t<p>His jaws, and the fangs show&rsquo;d us; not a limb</p>\n\t\t<p>Of him but trembled. Then my guide, his palms</p>\n\t\t<p>Expanding on the ground, thence filled with earth</p>\n\t\t<p>Rais&rsquo;d them, and cast it in his ravenous maw.</p>\n\t\t<p>E&rsquo;en as a dog, that yelling bays for food</p>\n\t\t<p>His keeper, when the morsel comes, lets fall</p>\n\t\t<p>His fury, bent alone with eager haste</p>\n\t\t<p>To swallow it; so dropp&rsquo;d the loathsome cheeks</p>\n\t\t<p>Of demon Cerberus, who thund&rsquo;ring stuns</p>\n\t\t<p>The spirits, that they for deafness wish in vain.</p>\n\t\t<p class="slindent">We, o&rsquo;er the shades thrown prostrate by the brunt</p>\n\t\t<p>Of the heavy tempest passing, set our feet</p>\n\t\t<p>Upon their emptiness, that substance seem&rsquo;d.</p>\n\t\t<p class="slindent">They all along the earth extended lay</p>\n\t\t<p>Save one, that sudden rais&rsquo;d himself to sit,</p>\n\t\t<p>Soon as that way he saw us pass. &ldquo;O thou!&rdquo;</p>\n\t\t<p>He cried, &ldquo;who through the infernal shades art led,</p>\n\t\t<p>Own, if again thou know&rsquo;st me. Thou wast fram&rsquo;d</p>\n\t\t<p>Or ere my frame was broken.&rdquo; I replied:</p>\n\t\t<p>&ldquo;The anguish thou endur&rsquo;st perchance so takes</p>\n\t\t<p>Thy form from my remembrance, that it seems</p>\n\t\t<p>As if I saw thee never. But inform</p>\n\t\t<p>Me who thou art, that in a place so sad</p>\n\t\t<p>Art set, and in such torment, that although</p>\n\t\t<p>Other be greater, more disgustful none</p>\n\t\t<p>Can be imagin&rsquo;d.&rdquo; He in answer thus:</p>\n\t\t<p>&ldquo;Thy city heap&rsquo;d with envy to the brim,</p>\n\t\t<p>Ay that the measure overflows its bounds,</p>\n\t\t<p>Held me in brighter days. Ye citizens</p>\n\t\t<p>Were wont to name me Ciacco. For the sin</p>\n\t\t<p>Of glutt&rsquo;ny, damned vice, beneath this rain,</p>\n\t\t<p>E&rsquo;en as thou see&rsquo;st, I with fatigue am worn;</p>\n\t\t<p>Nor I sole spirit in this woe: all these</p>\n\t\t<p>Have by like crime incurr&rsquo;d like punishment.&rdquo;</p>\n\t\t<p class="slindent">No more he said, and I my speech resum&rsquo;d:</p>\n\t\t<p>&ldquo;Ciacco! thy dire affliction grieves me much,</p>\n\t\t<p>Even to tears. But tell me, if thou know&rsquo;st,</p>\n\t\t<p>What shall at length befall the citizens</p>\n\t\t<p>Of the divided city; whether any just one</p>\n\t\t<p>Inhabit there: and tell me of the cause,</p>\n\t\t<p>Whence jarring discord hath assail&rsquo;d it thus?&rdquo;</p>\n\t\t<p class="slindent">He then: &ldquo;After long striving they will come</p>\n\t\t<p>To blood; and the wild party from the woods</p>\n\t\t<p>Will chase the other with much injury forth.</p>\n\t\t<p>Then it behoves, that this must fall, within</p>\n\t\t<p>Three solar circles; and the other rise</p>\n\t\t<p>By borrow&rsquo;d force of one, who under shore</p>\n\t\t<p>Now rests. It shall a long space hold aloof</p>\n\t\t<p>Its forehead, keeping under heavy weight</p>\n\t\t<p>The other oppress&rsquo;d, indignant at the load,</p>\n\t\t<p>And grieving sore. The just are two in number,</p>\n\t\t<p>But they neglected. Av&rsquo;rice, envy, pride,</p>\n\t\t<p>Three fatal sparks, have set the hearts of all</p>\n\t\t<p>On fire.&rdquo; Here ceas&rsquo;d the lamentable sound;</p>\n\t\t<p>And I continu&rsquo;d thus: &ldquo;Still would I learn</p>\n\t\t<p>More from thee, farther parley still entreat.</p>\n\t\t<p>Of Farinata and Tegghiaio say,</p>\n\t\t<p>They who so well deserv&rsquo;d, of Giacopo,</p>\n\t\t<p>Arrigo, Mosca, and the rest, who bent</p>\n\t\t<p>Their minds on working good. Oh! tell me where</p>\n\t\t<p>They bide, and to their knowledge let me come.</p>\n\t\t<p>For I am press&rsquo;d with keen desire to hear,</p>\n\t\t<p>If heaven&rsquo;s sweet cup or poisonous drug of hell</p>\n\t\t<p>Be to their lip assign&rsquo;d.&rdquo; He answer&rsquo;d straight:</p>\n\t\t<p>&ldquo;These are yet blacker spirits. Various crimes</p>\n\t\t<p>Have sunk them deeper in the dark abyss.</p>\n\t\t<p>If thou so far descendest, thou mayst see them.</p>\n\t\t<p>But to the pleasant world when thou return&rsquo;st,</p>\n\t\t<p>Of me make mention, I entreat thee, there.</p>\n\t\t<p>No more I tell thee, answer thee no more.&rdquo;</p>\n\t\t<p class="slindent">This said, his fixed eyes he turn&rsquo;d askance,</p>\n\t\t<p>A little ey&rsquo;d me, then bent down his head,</p>\n\t\t<p>And &rsquo;midst his blind companions with it fell.</p>\n\t\t<p class="slindent">When thus my guide: &ldquo;No more his bed he leaves,</p>\n\t\t<p>Ere the last angel-trumpet blow. The Power</p>\n\t\t<p>Adverse to these shall then in glory come,</p>\n\t\t<p>Each one forthwith to his sad tomb repair,</p>\n\t\t<p>Resume his fleshly vesture and his form,</p>\n\t\t<p>And hear the eternal doom re-echoing rend</p>\n\t\t<p>The vault.&rdquo; So pass&rsquo;d we through that mixture foul</p>\n\t\t<p>Of spirits and rain, with tardy steps; meanwhile</p>\n\t\t<p>Touching, though slightly, on the life to come.</p>\n\t\t<p>For thus I question&rsquo;d: &ldquo;Shall these tortures, Sir!</p>\n\t\t<p>When the great sentence passes, be increas&rsquo;d,</p>\n\t\t<p>Or mitigated, or as now severe?&rdquo;</p>\n\t\t<p class="slindent">He then: &ldquo;Consult thy knowledge; that decides</p>\n\t\t<p>That as each thing to more perfection grows,</p>\n\t\t<p>It feels more sensibly both good and pain.</p>\n\t\t<p>Though ne&rsquo;er to true perfection may arrive</p>\n\t\t<p>This race accurs&rsquo;d, yet nearer then than now</p>\n\t\t<p>They shall approach it.&rdquo; Compassing that path</p>\n\t\t<p>Circuitous we journeyed, and discourse</p>\n\t\t<p>Much more than I relate between us pass&rsquo;d:</p>\n\t\t<p>Till at the point, where the steps led below,</p>\n\t\t<p>Arriv&rsquo;d, there Plutus, the great foe, we found.</p>\n\t\t</div>','<p class="cantohead">Canto VII</p>\n\t\t<div class="stanza">\n\t\t<p>&ldquo;<span class="sc">Ah</span> me! O Satan! Satan!&rdquo; loud exclaim&rsquo;d</p>\n\t\t<p>Plutus, in accent hoarse of wild alarm:</p>\n\t\t<p>And the kind sage, whom no event surpris&rsquo;d,</p>\n\t\t<p>To comfort me thus spake: &ldquo;Let not thy fear</p>\n\t\t<p>Harm thee, for power in him, be sure, is none</p>\n\t\t<p>To hinder down this rock thy safe descent.&rdquo;</p>\n\t\t<p>Then to that sworn lip turning, &ldquo;Peace!&rdquo; he cried,</p>\n\t\t<p>&ldquo;Curs&rsquo;d wolf! thy fury inward on thyself</p>\n\t\t<p>Prey, and consume thee! Through the dark profound</p>\n\t\t<p>Not without cause he passes. So &rsquo;t is will&rsquo;d</p>\n\t\t<p>On high, there where the great Archangel pour&rsquo;d</p>\n\t\t<p>Heav&rsquo;n&rsquo;s vengeance on the first adulterer proud.&rdquo;</p>\n\t\t<p class="slindent">As sails full spread and bellying with the wind</p>\n\t\t<p>Drop suddenly collaps&rsquo;d, if the mast split;</p>\n\t\t<p>So to the ground down dropp&rsquo;d the cruel fiend.</p>\n\t\t<p class="slindent">Thus we, descending to the fourth steep ledge,</p>\n\t\t<p>Gain&rsquo;d on the dismal shore, that all the woe</p>\n\t\t<p>Hems in of all the universe. Ah me!</p>\n\t\t<p>Almighty Justice! in what store thou heap&rsquo;st</p>\n\t\t<p>New pains, new troubles, as I here beheld!</p>\n\t\t<p>Wherefore doth fault of ours bring us to this?</p>\n\t\t<p class="slindent">E&rsquo;en as a billow, on Charybdis rising,</p>\n\t\t<p>Against encounter&rsquo;d billow dashing breaks;</p>\n\t\t<p>Such is the dance this wretched race must lead,</p>\n\t\t<p>Whom more than elsewhere numerous here I found,</p>\n\t\t<p>From one side and the other, with loud voice,</p>\n\t\t<p>Both roll&rsquo;d on weights by main forge of their breasts,</p>\n\t\t<p>Then smote together, and each one forthwith</p>\n\t\t<p>Roll&rsquo;d them back voluble, turning again,</p>\n\t\t<p>Exclaiming these, &ldquo;Why holdest thou so fast?&rdquo;</p>\n\t\t<p>Those answering, &ldquo;And why castest thou away?&rdquo;</p>\n\t\t<p>So still repeating their despiteful song,</p>\n\t\t<p>They to the opposite point on either hand</p>\n\t\t<p>Travers&rsquo;d the horrid circle: then arriv&rsquo;d,</p>\n\t\t<p>Both turn&rsquo;d them round, and through the middle space</p>\n\t\t<p>Conflicting met again. At sight whereof</p>\n\t\t<p>I, stung with grief, thus spake: &ldquo;O say, my guide!</p>\n\t\t<p>What race is this? Were these, whose heads are shorn,</p>\n\t\t<p>On our left hand, all sep&rsquo;rate to the church?&rdquo;</p>\n\t\t<p class="slindent">He straight replied: &ldquo;In their first life these all</p>\n\t\t<p>In mind were so distorted, that they made,</p>\n\t\t<p>According to due measure, of their wealth,</p>\n\t\t<p>No use. This clearly from their words collect,</p>\n\t\t<p>Which they howl forth, at each extremity</p>\n\t\t<p>Arriving of the circle, where their crime</p>\n\t\t<p>Contrary&rsquo; in kind disparts them. To the church</p>\n\t\t<p>Were separate those, that with no hairy cowls</p>\n\t\t<p>Are crown&rsquo;d, both Popes and Cardinals, o&rsquo;er whom</p>\n\t\t<p>Av&rsquo;rice dominion absolute maintains.&rdquo;</p>\n\t\t<p class="slindent">I then: &ldquo;Mid such as these some needs must be,</p>\n\t\t<p>Whom I shall recognize, that with the blot</p>\n\t\t<p>Of these foul sins were stain&rsquo;d.&rdquo; He answering thus:</p>\n\t\t<p>&ldquo;Vain thought conceiv&rsquo;st thou. That ignoble life,</p>\n\t\t<p>Which made them vile before, now makes them dark,</p>\n\t\t<p>And to all knowledge indiscernible.</p>\n\t\t<p>Forever they shall meet in this rude shock:</p>\n\t\t<p>These from the tomb with clenched grasp shall rise,</p>\n\t\t<p>Those with close-shaven locks. That ill they gave,</p>\n\t\t<p>And ill they kept, hath of the beauteous world</p>\n\t\t<p>Depriv&rsquo;d, and set them at this strife, which needs</p>\n\t\t<p>No labour&rsquo;d phrase of mine to set if off.</p>\n\t\t<p>Now may&rsquo;st thou see, my son! how brief, how vain,</p>\n\t\t<p>The goods committed into fortune&rsquo;s hands,</p>\n\t\t<p>For which the human race keep such a coil!</p>\n\t\t<p>Not all the gold, that is beneath the moon,</p>\n\t\t<p>Or ever hath been, of these toil-worn souls</p>\n\t\t<p>Might purchase rest for one.&rdquo; I thus rejoin&rsquo;d:</p>\n\t\t<p class="slindent">&ldquo;My guide! of thee this also would I learn;</p>\n\t\t<p>This fortune, that thou speak&rsquo;st of, what it is,</p>\n\t\t<p>Whose talons grasp the blessings of the world?&rdquo;</p>\n\t\t<p class="slindent">He thus: &ldquo;O beings blind! what ignorance</p>\n\t\t<p>Besets you? Now my judgment hear and mark.</p>\n\t\t<p>He, whose transcendent wisdom passes all,</p>\n\t\t<p>The heavens creating, gave them ruling powers</p>\n\t\t<p>To guide them, so that each part shines to each,</p>\n\t\t<p>Their light in equal distribution pour&rsquo;d.</p>\n\t\t<p>By similar appointment he ordain&rsquo;d</p>\n\t\t<p>Over the world&rsquo;s bright images to rule.</p>\n\t\t<p>Superintendence of a guiding hand</p>\n\t\t<p>And general minister, which at due time</p>\n\t\t<p>May change the empty vantages of life</p>\n\t\t<p>From race to race, from one to other&rsquo;s blood,</p>\n\t\t<p>Beyond prevention of man&rsquo;s wisest care:</p>\n\t\t<p>Wherefore one nation rises into sway,</p>\n\t\t<p>Another languishes, e&rsquo;en as her will</p>\n\t\t<p>Decrees, from us conceal&rsquo;d, as in the grass</p>\n\t\t<p>The serpent train. Against her nought avails</p>\n\t\t<p>Your utmost wisdom. She with foresight plans,</p>\n\t\t<p>Judges, and carries on her reign, as theirs</p>\n\t\t<p>The other powers divine. Her changes know</p>\n\t\t<p>Nore intermission: by necessity</p>\n\t\t<p>She is made swift, so frequent come who claim</p>\n\t\t<p>Succession in her favours. This is she,</p>\n\t\t<p>So execrated e&rsquo;en by those, whose debt</p>\n\t\t<p>To her is rather praise; they wrongfully</p>\n\t\t<p>With blame requite her, and with evil word;</p>\n\t\t<p>But she is blessed, and for that recks not:</p>\n\t\t<p>Amidst the other primal beings glad</p>\n\t\t<p>Rolls on her sphere, and in her bliss exults.</p>\n\t\t<p>Now on our way pass we, to heavier woe</p>\n\t\t<p>Descending: for each star is falling now,</p>\n\t\t<p>That mounted at our entrance, and forbids</p>\n\t\t<p>Too long our tarrying.&rdquo; We the circle cross&rsquo;d</p>\n\t\t<p>To the next steep, arriving at a well,</p>\n\t\t<p>That boiling pours itself down to a foss</p>\n\t\t<p>Sluic&rsquo;d from its source. Far murkier was the wave</p>\n\t\t<p>Than sablest grain: and we in company</p>\n\t\t<p>Of the&rsquo; inky waters, journeying by their side,</p>\n\t\t<p>Enter&rsquo;d, though by a different track, beneath.</p>\n\t\t<p>Into a lake, the Stygian nam&rsquo;d, expands</p>\n\t\t<p>The dismal stream, when it hath reach&rsquo;d the foot</p>\n\t\t<p>Of the grey wither&rsquo;d cliffs. Intent I stood</p>\n\t\t<p>To gaze, and in the marish sunk descried</p>\n\t\t<p>A miry tribe, all naked, and with looks</p>\n\t\t<p>Betok&rsquo;ning rage. They with their hands alone</p>\n\t\t<p>Struck not, but with the head, the breast, the feet,</p>\n\t\t<p>Cutting each other piecemeal with their fangs.</p>\n\t\t<p class="slindent">The good instructor spake; &ldquo;Now seest thou, son!</p>\n\t\t<p>The souls of those, whom anger overcame.</p>\n\t\t<p>This too for certain know, that underneath</p>\n\t\t<p>The water dwells a multitude, whose sighs</p>\n\t\t<p>Into these bubbles make the surface heave,</p>\n\t\t<p>As thine eye tells thee wheresoe&rsquo;er it turn.&rdquo;</p>\n\t\t<p>Fix&rsquo;d in the slime they say: &ldquo;Sad once were we</p>\n\t\t<p>In the sweet air made gladsome by the sun,</p>\n\t\t<p>Carrying a foul and lazy mist within:</p>\n\t\t<p>Now in these murky settlings are we sad.&rdquo;</p>\n\t\t<p>Such dolorous strain they gurgle in their throats.</p>\n\t\t<p>But word distinct can utter none.&rdquo; Our route</p>\n\t\t<p>Thus compass&rsquo;d we, a segment widely stretch&rsquo;d</p>\n\t\t<p>Between the dry embankment, and the core</p>\n\t\t<p>Of the loath&rsquo;d pool, turning meanwhile our eyes</p>\n\t\t<p>Downward on those who gulp&rsquo;d its muddy lees;</p>\n\t\t<p>Nor stopp&rsquo;d, till to a tower&rsquo;s low base we came.</p>\n\t\t</div>','<p class="cantohead">Canto VIII</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">My</span> theme pursuing, I relate that ere</p>\n\t\t<p>We reach&rsquo;d the lofty turret&rsquo;s base, our eyes</p>\n\t\t<p>Its height ascended, where two cressets hung</p>\n\t\t<p>We mark&rsquo;d, and from afar another light</p>\n\t\t<p>Return the signal, so remote, that scarce</p>\n\t\t<p>The eye could catch its beam. I turning round</p>\n\t\t<p>To the deep source of knowledge, thus inquir&rsquo;d:</p>\n\t\t<p>&ldquo;Say what this means? and what that other light</p>\n\t\t<p>In answer set? what agency doth this?&rdquo;</p>\n\t\t<p class="slindent">&ldquo;There on the filthy waters,&rdquo; he replied,</p>\n\t\t<p>&ldquo;E&rsquo;en now what next awaits us mayst thou see,</p>\n\t\t<p>If the marsh-gender&rsquo;d fog conceal it not.&rdquo;</p>\n\t\t<p class="slindent">Never was arrow from the cord dismiss&rsquo;d,</p>\n\t\t<p>That ran its way so nimbly through the air,</p>\n\t\t<p>As a small bark, that through the waves I spied</p>\n\t\t<p>Toward us coming, under the sole sway</p>\n\t\t<p>Of one that ferried it, who cried aloud:</p>\n\t\t<p>&ldquo;Art thou arriv&rsquo;d, fell spirit?&rdquo;&mdash;&ldquo;Phlegyas, Phlegyas,</p>\n\t\t<p>This time thou criest in vain,&rdquo; my lord replied;</p>\n\t\t<p>&ldquo;No longer shalt thou have us, but while o&rsquo;er</p>\n\t\t<p>The slimy pool we pass.&rdquo; As one who hears</p>\n\t\t<p>Of some great wrong he hath sustain&rsquo;d, whereat</p>\n\t\t<p>Inly he pines; so Phlegyas inly pin&rsquo;d</p>\n\t\t<p>In his fierce ire. My guide descending stepp&rsquo;d</p>\n\t\t<p>Into the skiff, and bade me enter next</p>\n\t\t<p>Close at his side; nor till my entrance seem&rsquo;d</p>\n\t\t<p>The vessel freighted. Soon as both embark&rsquo;d,</p>\n\t\t<p>Cutting the waves, goes on the ancient prow,</p>\n\t\t<p>More deeply than with others it is wont.</p>\n\t\t<p class="slindent">While we our course o&rsquo;er the dead channel held.</p>\n\t\t<p>One drench&rsquo;d in mire before me came, and said;</p>\n\t\t<p>&ldquo;Who art thou, that thou comest ere thine hour?&rdquo;</p>\n\t\t<p class="slindent">I answer&rsquo;d: &ldquo;Though I come, I tarry not;</p>\n\t\t<p>But who art thou, that art become so foul?&rdquo;</p>\n\t\t<p class="slindent">&ldquo;One, as thou seest, who mourn:&rdquo; he straight replied.</p>\n\t\t<p class="slindent">To which I thus: &ldquo;In mourning and in woe,</p>\n\t\t<p>Curs&rsquo;d spirit! tarry thou.g I know thee well,</p>\n\t\t<p>E&rsquo;en thus in filth disguis&rsquo;d.&rdquo; Then stretch&rsquo;d he forth</p>\n\t\t<p>Hands to the bark; whereof my teacher sage</p>\n\t\t<p>Aware, thrusting him back: &ldquo;Away! down there;</p>\n\t\t<p>&ldquo;To the&rsquo; other dogs!&rdquo; then, with his arms my neck</p>\n\t\t<p>Encircling, kiss&rsquo;d my cheek, and spake: &ldquo;O soul</p>\n\t\t<p>Justly disdainful! blest was she in whom</p>\n\t\t<p>Thou was conceiv&rsquo;d! He in the world was one</p>\n\t\t<p>For arrogance noted; to his memory</p>\n\t\t<p>No virtue lends its lustre; even so</p>\n\t\t<p>Here is his shadow furious. There above</p>\n\t\t<p>How many now hold themselves mighty kings</p>\n\t\t<p>Who here like swine shall wallow in the mire,</p>\n\t\t<p>Leaving behind them horrible dispraise!&rdquo;</p>\n\t\t<p class="slindent">I then: &ldquo;Master! him fain would I behold</p>\n\t\t<p>Whelm&rsquo;d in these dregs, before we quit the lake.&rdquo;</p>\n\t\t<p class="slindent">He thus: &ldquo;Or ever to thy view the shore</p>\n\t\t<p>Be offer&rsquo;d, satisfied shall be that wish,</p>\n\t\t<p>Which well deserves completion.&rdquo; Scarce his words</p>\n\t\t<p>Were ended, when I saw the miry tribes</p>\n\t\t<p>Set on him with such violence, that yet</p>\n\t\t<p>For that render I thanks to God and praise</p>\n\t\t<p>&ldquo;To Filippo Argenti:&rdquo; cried they all:</p>\n\t\t<p>And on himself the moody Florentine</p>\n\t\t<p>Turn&rsquo;d his avenging fangs. Him here we left,</p>\n\t\t<p>Nor speak I of him more. But on mine ear</p>\n\t\t<p>Sudden a sound of lamentation smote,</p>\n\t\t<p>Whereat mine eye unbarr&rsquo;d I sent abroad.</p>\n\t\t<p class="slindent">And thus the good instructor: &ldquo;Now, my son!</p>\n\t\t<p>Draws near the city, that of Dis is nam&rsquo;d,</p>\n\t\t<p>With its grave denizens, a mighty throng.&rdquo;</p>\n\t\t<p class="slindent">I thus: &ldquo;The minarets already, Sir!</p>\n\t\t<p>There certes in the valley I descry,</p>\n\t\t<p>Gleaming vermilion, as if they from fire</p>\n\t\t<p>Had issu&rsquo;d.&rdquo; He replied: &ldquo;Eternal fire,</p>\n\t\t<p>That inward burns, shows them with ruddy flame</p>\n\t\t<p>Illum&rsquo;d; as in this nether hell thou seest.&rdquo;</p>\n\t\t<p class="slindent">We came within the fosses deep, that moat</p>\n\t\t<p>This region comfortless. The walls appear&rsquo;d</p>\n\t\t<p>As they were fram&rsquo;d of iron. We had made</p>\n\t\t<p>Wide circuit, ere a place we reach&rsquo;d, where loud</p>\n\t\t<p>The mariner cried vehement: &ldquo;Go forth!</p>\n\t\t<p>The&rsquo; entrance is here!&rdquo; Upon the gates I spied</p>\n\t\t<p>More than a thousand, who of old from heaven</p>\n\t\t<p>Were hurl&rsquo;d. With ireful gestures, &ldquo;Who is this,&rdquo;</p>\n\t\t<p>They cried, &ldquo;that without death first felt, goes through</p>\n\t\t<p>The regions of the dead?&rdquo; My sapient guide</p>\n\t\t<p>Made sign that he for secret parley wish&rsquo;d;</p>\n\t\t<p>Whereat their angry scorn abating, thus</p>\n\t\t<p>They spake: &ldquo;Come thou alone; and let him go</p>\n\t\t<p>Who hath so hardily enter&rsquo;d this realm.</p>\n\t\t<p>Alone return he by his witless way;</p>\n\t\t<p>If well he know it, let him prove. For thee,</p>\n\t\t<p>Here shalt thou tarry, who through clime so dark</p>\n\t\t<p>Hast been his escort.&rdquo; Now bethink thee, reader!</p>\n\t\t<p>What cheer was mine at sound of those curs&rsquo;d words.</p>\n\t\t<p>I did believe I never should return.</p>\n\t\t<p class="slindent">&ldquo;O my lov&rsquo;d guide! who more than seven times</p>\n\t\t<p>Security hast render&rsquo;d me, and drawn</p>\n\t\t<p>From peril deep, whereto I stood expos&rsquo;d,</p>\n\t\t<p>Desert me not,&rdquo; I cried, &ldquo;in this extreme.</p>\n\t\t<p>And if our onward going be denied,</p>\n\t\t<p>Together trace we back our steps with speed.&rdquo;</p>\n\t\t<p class="slindent">My liege, who thither had conducted me,</p>\n\t\t<p>Replied: &ldquo;Fear not: for of our passage none</p>\n\t\t<p>Hath power to disappoint us, by such high</p>\n\t\t<p>Authority permitted. But do thou</p>\n\t\t<p>Expect me here; meanwhile thy wearied spirit</p>\n\t\t<p>Comfort, and feed with kindly hope, assur&rsquo;d</p>\n\t\t<p>I will not leave thee in this lower world.&rdquo;</p>\n\t\t<p class="slindent">This said, departs the sire benevolent,</p>\n\t\t<p>And quits me. Hesitating I remain</p>\n\t\t<p>At war &rsquo;twixt will and will not in my thoughts.</p>\n\t\t<p class="slindent">I could not hear what terms he offer&rsquo;d them,</p>\n\t\t<p>But they conferr&rsquo;d not long, for all at once</p>\n\t\t<p>To trial fled within. Clos&rsquo;d were the gates</p>\n\t\t<p>By those our adversaries on the breast</p>\n\t\t<p>Of my liege lord: excluded he return&rsquo;d</p>\n\t\t<p>To me with tardy steps. Upon the ground</p>\n\t\t<p>His eyes were bent, and from his brow eras&rsquo;d</p>\n\t\t<p>All confidence, while thus with sighs he spake:</p>\n\t\t<p>&ldquo;Who hath denied me these abodes of woe?&rdquo;</p>\n\t\t<p>Then thus to me: &ldquo;That I am anger&rsquo;d, think</p>\n\t\t<p>No ground of terror: in this trial I</p>\n\t\t<p>Shall vanquish, use what arts they may within</p>\n\t\t<p>For hindrance. This their insolence, not new,</p>\n\t\t<p>Erewhile at gate less secret they display&rsquo;d,</p>\n\t\t<p>Which still is without bolt; upon its arch</p>\n\t\t<p>Thou saw&rsquo;st the deadly scroll: and even now</p>\n\t\t<p>On this side of its entrance, down the steep,</p>\n\t\t<p>Passing the circles, unescorted, comes</p>\n\t\t<p>One whose strong might can open us this land.&rdquo;</p>\n\t\t</div>','<p class="cantohead">Canto IX</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">The</span> hue, which coward dread on my pale cheeks</p>\n\t\t<p>Imprinted, when I saw my guide turn back,</p>\n\t\t<p>Chas&rsquo;d that from his which newly they had worn,</p>\n\t\t<p>And inwardly restrain&rsquo;d it. He, as one</p>\n\t\t<p>Who listens, stood attentive: for his eye</p>\n\t\t<p>Not far could lead him through the sable air,</p>\n\t\t<p>And the thick-gath&rsquo;ring cloud. &ldquo;It yet behooves</p>\n\t\t<p>We win this fight&rdquo;&mdash;thus he began&mdash;&ldquo;if not&mdash;</p>\n\t\t<p>Such aid to us is offer&rsquo;d.&mdash;Oh, how long</p>\n\t\t<p>Me seems it, ere the promis&rsquo;d help arrive!&rdquo;</p>\n\t\t<p class="slindent">I noted, how the sequel of his words</p>\n\t\t<p>Clok&rsquo;d their beginning; for the last he spake</p>\n\t\t<p>Agreed not with the first. But not the less</p>\n\t\t<p>My fear was at his saying; sith I drew</p>\n\t\t<p>To import worse perchance, than that he held,</p>\n\t\t<p>His mutilated speech. &ldquo;Doth ever any</p>\n\t\t<p>Into this rueful concave&rsquo;s extreme depth</p>\n\t\t<p>Descend, out of the first degree, whose pain</p>\n\t\t<p>Is deprivation merely of sweet hope?&rdquo;</p>\n\t\t<p class="slindent">Thus I inquiring. &ldquo;Rarely,&rdquo; he replied,</p>\n\t\t<p>&ldquo;It chances, that among us any makes</p>\n\t\t<p>This journey, which I wend. Erewhile &rsquo;tis true</p>\n\t\t<p>Once came I here beneath, conjur&rsquo;d by fell</p>\n\t\t<p>Erictho, sorceress, who compell&rsquo;d the shades</p>\n\t\t<p>Back to their bodies. No long space my flesh</p>\n\t\t<p>Was naked of me, when within these walls</p>\n\t\t<p>She made me enter, to draw forth a spirit</p>\n\t\t<p>From out of Judas&rsquo; circle. Lowest place</p>\n\t\t<p>Is that of all, obscurest, and remov&rsquo;d</p>\n\t\t<p>Farthest from heav&rsquo;n&rsquo;s all-circling orb. The road</p>\n\t\t<p>Full well I know: thou therefore rest secure.</p>\n\t\t<p>That lake, the noisome stench exhaling, round</p>\n\t\t<p>The city&rsquo; of grief encompasses, which now</p>\n\t\t<p>We may not enter without rage.&rdquo; Yet more</p>\n\t\t<p>He added: but I hold it not in mind,</p>\n\t\t<p>For that mine eye toward the lofty tower</p>\n\t\t<p>Had drawn me wholly, to its burning top.</p>\n\t\t<p>Where in an instant I beheld uprisen</p>\n\t\t<p>At once three hellish furies stain&rsquo;d with blood:</p>\n\t\t<p>In limb and motion feminine they seem&rsquo;d;</p>\n\t\t<p>Around them greenest hydras twisting roll&rsquo;d</p>\n\t\t<p>Their volumes; adders and cerastes crept</p>\n\t\t<p>Instead of hair, and their fierce temples bound.</p>\n\t\t<p class="slindent">He knowing well the miserable hags</p>\n\t\t<p>Who tend the queen of endless woe, thus spake:</p>\n\t\t<p>&ldquo;Mark thou each dire Erinnys. To the left</p>\n\t\t<p>This is Megaera; on the right hand she,</p>\n\t\t<p>Who wails, Alecto; and Tisiphone</p>\n\t\t<p>I&rsquo; th&rsquo; midst.&rdquo; This said, in silence he remain&rsquo;d</p>\n\t\t<p>Their breast they each one clawing tore; themselves</p>\n\t\t<p>Smote with their palms, and such shrill clamour rais&rsquo;d,</p>\n\t\t<p>That to the bard I clung, suspicion-bound.</p>\n\t\t<p>&ldquo;Hasten Medusa: so to adamant</p>\n\t\t<p>Him shall we change;&rdquo; all looking down exclaim&rsquo;d.</p>\n\t\t<p>&ldquo;e&rsquo;en when by Theseus&rsquo; might assail&rsquo;d, we took</p>\n\t\t<p>No ill revenge.&rdquo; &ldquo;Turn thyself round, and keep</p>\n\t\t<p>Thy count&rsquo;nance hid; for if the Gorgon dire</p>\n\t\t<p>Be shown, and thou shouldst view it, thy return</p>\n\t\t<p>Upwards would be for ever lost.&rdquo; This said,</p>\n\t\t<p>Himself my gentle master turn&rsquo;d me round,</p>\n\t\t<p>Nor trusted he my hands, but with his own</p>\n\t\t<p>He also hid me. Ye of intellect</p>\n\t\t<p>Sound and entire, mark well the lore conceal&rsquo;d</p>\n\t\t<p>Under close texture of the mystic strain!</p>\n\t\t<p class="slindent">And now there came o&rsquo;er the perturbed waves</p>\n\t\t<p>Loud-crashing, terrible, a sound that made</p>\n\t\t<p>Either shore tremble, as if of a wind</p>\n\t\t<p>Impetuous, from conflicting vapours sprung,</p>\n\t\t<p>That &rsquo;gainst some forest driving all its might,</p>\n\t\t<p>Plucks off the branches, beats them down and hurls</p>\n\t\t<p>Afar; then onward passing proudly sweeps</p>\n\t\t<p>Its whirlwind rage, while beasts and shepherds fly.</p>\n\t\t<p class="slindent">Mine eyes he loos&rsquo;d, and spake: &ldquo;And now direct</p>\n\t\t<p>Thy visual nerve along that ancient foam,</p>\n\t\t<p>There, thickest where the smoke ascends.&rdquo; As frogs</p>\n\t\t<p>Before their foe the serpent, through the wave</p>\n\t\t<p>Ply swiftly all, till at the ground each one</p>\n\t\t<p>Lies on a heap; more than a thousand spirits</p>\n\t\t<p>Destroy&rsquo;d, so saw I fleeing before one</p>\n\t\t<p>Who pass&rsquo;d with unwet feet the Stygian sound.</p>\n\t\t<p>He, from his face removing the gross air,</p>\n\t\t<p>Oft his left hand forth stretch&rsquo;d, and seem&rsquo;d alone</p>\n\t\t<p>By that annoyance wearied. I perceiv&rsquo;d</p>\n\t\t<p>That he was sent from heav&rsquo;n, and to my guide</p>\n\t\t<p>Turn&rsquo;d me, who signal made that I should stand</p>\n\t\t<p>Quiet, and bend to him. Ah me! how full</p>\n\t\t<p>Of noble anger seem&rsquo;d he! To the gate</p>\n\t\t<p>He came, and with his wand touch&rsquo;d it, whereat</p>\n\t\t<p>Open without impediment it flew.</p>\n\t\t<p class="slindent">&ldquo;Outcasts of heav&rsquo;n! O abject race and scorn&rsquo;d!&rdquo;</p>\n\t\t<p>Began he on the horrid grunsel standing,</p>\n\t\t<p>&ldquo;Whence doth this wild excess of insolence</p>\n\t\t<p>Lodge in you? wherefore kick you &rsquo;gainst that will</p>\n\t\t<p>Ne&rsquo;er frustrate of its end, and which so oft</p>\n\t\t<p>Hath laid on you enforcement of your pangs?</p>\n\t\t<p>What profits at the fays to but the horn?</p>\n\t\t<p>Your Cerberus, if ye remember, hence</p>\n\t\t<p>Bears still, peel&rsquo;d of their hair, his throat and maw.&rdquo;</p>\n\t\t<p class="slindent">This said, he turn&rsquo;d back o&rsquo;er the filthy way,</p>\n\t\t<p>And syllable to us spake none, but wore</p>\n\t\t<p>The semblance of a man by other care</p>\n\t\t<p>Beset, and keenly press&rsquo;d, than thought of him</p>\n\t\t<p>Who in his presence stands. Then we our steps</p>\n\t\t<p>Toward that territory mov&rsquo;d, secure</p>\n\t\t<p>After the hallow&rsquo;d words. We unoppos&rsquo;d</p>\n\t\t<p>There enter&rsquo;d; and my mind eager to learn</p>\n\t\t<p>What state a fortress like to that might hold,</p>\n\t\t<p>I soon as enter&rsquo;d throw mine eye around,</p>\n\t\t<p>And see on every part wide-stretching space</p>\n\t\t<p>Replete with bitter pain and torment ill.</p>\n\t\t<p class="slindent">As where Rhone stagnates on the plains of Arles,</p>\n\t\t<p>Or as at Pola, near Quarnaro&rsquo;s gulf,</p>\n\t\t<p>That closes Italy and laves her bounds,</p>\n\t\t<p>The place is all thick spread with sepulchres;</p>\n\t\t<p>So was it here, save what in horror here</p>\n\t\t<p>Excell&rsquo;d: for &rsquo;midst the graves were scattered flames,</p>\n\t\t<p>Wherewith intensely all throughout they burn&rsquo;d,</p>\n\t\t<p>That iron for no craft there hotter needs.</p>\n\t\t<p class="slindent">Their lids all hung suspended, and beneath</p>\n\t\t<p>From them forth issu&rsquo;d lamentable moans,</p>\n\t\t<p>Such as the sad and tortur&rsquo;d well might raise.</p>\n\t\t<p class="slindent">I thus: &ldquo;Master! say who are these, interr&rsquo;d</p>\n\t\t<p>Within these vaults, of whom distinct we hear</p>\n\t\t<p>The dolorous sighs?&rdquo; He answer thus return&rsquo;d:</p>\n\t\t<p class="slindent">&ldquo;The arch-heretics are here, accompanied</p>\n\t\t<p>By every sect their followers; and much more,</p>\n\t\t<p>Than thou believest, tombs are freighted: like</p>\n\t\t<p>With like is buried; and the monuments</p>\n\t\t<p>Are different in degrees of heat.&rdquo; This said,</p>\n\t\t<p>He to the right hand turning, on we pass&rsquo;d</p>\n\t\t<p>Betwixt the afflicted and the ramparts high.</p>\n\t\t</div>','<p class="cantohead">Canto X</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">Now</span> by a secret pathway we proceed,</p>\n\t\t<p>Between the walls, that hem the region round,</p>\n\t\t<p>And the tormented souls: my master first,</p>\n\t\t<p>I close behind his steps. &ldquo;Virtue supreme!&rdquo;</p>\n\t\t<p>I thus began; &ldquo;who through these ample orbs</p>\n\t\t<p>In circuit lead&rsquo;st me, even as thou will&rsquo;st,</p>\n\t\t<p>Speak thou, and satisfy my wish. May those,</p>\n\t\t<p>Who lie within these sepulchres, be seen?</p>\n\t\t<p>Already all the lids are rais&rsquo;d, and none</p>\n\t\t<p>O&rsquo;er them keeps watch.&rdquo; He thus in answer spake</p>\n\t\t<p>&ldquo;They shall be closed all, what-time they here</p>\n\t\t<p>From Josaphat return&rsquo;d shall come, and bring</p>\n\t\t<p>Their bodies, which above they now have left.</p>\n\t\t<p>The cemetery on this part obtain</p>\n\t\t<p>With Epicurus all his followers,</p>\n\t\t<p>Who with the body make the spirit die.</p>\n\t\t<p>Here therefore satisfaction shall be soon</p>\n\t\t<p>Both to the question ask&rsquo;d, and to the wish,</p>\n\t\t<p>Which thou conceal&rsquo;st in silence.&rdquo; I replied:</p>\n\t\t<p>&ldquo;I keep not, guide belov&rsquo;d! from thee my heart</p>\n\t\t<p>Secreted, but to shun vain length of words,</p>\n\t\t<p>A lesson erewhile taught me by thyself.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;O Tuscan! thou who through the city of fire</p>\n\t\t<p>Alive art passing, so discreet of speech!</p>\n\t\t<p>Here please thee stay awhile. Thy utterance</p>\n\t\t<p>Declares the place of thy nativity</p>\n\t\t<p>To be that noble land, with which perchance</p>\n\t\t<p>I too severely dealt.&rdquo; Sudden that sound</p>\n\t\t<p>Forth issu&rsquo;d from a vault, whereat in fear</p>\n\t\t<p>I somewhat closer to my leader&rsquo;s side</p>\n\t\t<p>Approaching, he thus spake: &ldquo;What dost thou? Turn.</p>\n\t\t<p>Lo, Farinata, there! who hath himself</p>\n\t\t<p>Uplifted: from his girdle upwards all</p>\n\t\t<p>Expos&rsquo;d behold him.&rdquo; On his face was mine</p>\n\t\t<p>Already fix&rsquo;d; his breast and forehead there</p>\n\t\t<p>Erecting, seem&rsquo;d as in high scorn he held</p>\n\t\t<p>E&rsquo;en hell. Between the sepulchres to him</p>\n\t\t<p>My guide thrust me with fearless hands and prompt,</p>\n\t\t<p>This warning added: &ldquo;See thy words be clear!&rdquo;</p>\n\t\t<p class="slindent">He, soon as there I stood at the tomb&rsquo;s foot,</p>\n\t\t<p>Ey&rsquo;d me a space, then in disdainful mood</p>\n\t\t<p>Address&rsquo;d me: &ldquo;Say, what ancestors were thine?&rdquo;</p>\n\t\t<p class="slindent">I, willing to obey him, straight reveal&rsquo;d</p>\n\t\t<p>The whole, nor kept back aught: whence he, his brow</p>\n\t\t<p>Somewhat uplifting, cried: &ldquo;Fiercely were they</p>\n\t\t<p>Adverse to me, my party, and the blood</p>\n\t\t<p>From whence I sprang: twice therefore I abroad</p>\n\t\t<p>Scatter&rsquo;d them.&rdquo; &ldquo;Though driv&rsquo;n out, yet they each time</p>\n\t\t<p>From all parts,&rdquo; answer&rsquo;d I, &ldquo;return&rsquo;d; an art</p>\n\t\t<p>Which yours have shown, they are not skill&rsquo;d to learn.&rdquo;</p>\n\t\t<p class="slindent">Then, peering forth from the unclosed jaw,</p>\n\t\t<p>Rose from his side a shade, high as the chin,</p>\n\t\t<p>Leaning, methought, upon its knees uprais&rsquo;d.</p>\n\t\t<p>It look&rsquo;d around, as eager to explore</p>\n\t\t<p>If there were other with me; but perceiving</p>\n\t\t<p>That fond imagination quench&rsquo;d, with tears</p>\n\t\t<p>Thus spake: &ldquo;If thou through this blind prison go&rsquo;st.</p>\n\t\t<p>Led by thy lofty genius and profound,</p>\n\t\t<p>Where is my son? and wherefore not with thee?&rdquo;</p>\n\t\t<p class="slindent">I straight replied: &ldquo;Not of myself I come,</p>\n\t\t<p>By him, who there expects me, through this clime</p>\n\t\t<p>Conducted, whom perchance Guido thy son</p>\n\t\t<p>Had in contempt.&rdquo; Already had his words</p>\n\t\t<p>And mode of punishment read me his name,</p>\n\t\t<p>Whence I so fully answer&rsquo;d. He at once</p>\n\t\t<p>Exclaim&rsquo;d, up starting, &ldquo;How! said&rsquo;st thou he HAD?</p>\n\t\t<p>No longer lives he? Strikes not on his eye</p>\n\t\t<p>The blessed daylight?&rdquo; Then of some delay</p>\n\t\t<p>I made ere my reply aware, down fell</p>\n\t\t<p>Supine, not after forth appear&rsquo;d he more.</p>\n\t\t<p class="slindent">Meanwhile the other, great of soul, near whom</p>\n\t\t<p>I yet was station&rsquo;d, chang&rsquo;d not count&rsquo;nance stern,</p>\n\t\t<p>Nor mov&rsquo;d the neck, nor bent his ribbed side.</p>\n\t\t<p>&ldquo;And if,&rdquo; continuing the first discourse,</p>\n\t\t<p>&ldquo;They in this art,&rdquo; he cried, &ldquo;small skill have shown,</p>\n\t\t<p>That doth torment me more e&rsquo;en than this bed.</p>\n\t\t<p>But not yet fifty times shall be relum&rsquo;d</p>\n\t\t<p>Her aspect, who reigns here Queen of this realm,</p>\n\t\t<p>Ere thou shalt know the full weight of that art.</p>\n\t\t<p>So to the pleasant world mayst thou return,</p>\n\t\t<p>As thou shalt tell me, why in all their laws,</p>\n\t\t<p>Against my kin this people is so fell?&rdquo;</p>\n\t\t<p class="slindent">&ldquo;The slaughter and great havoc,&rdquo; I replied,</p>\n\t\t<p>&ldquo;That colour&rsquo;d Arbia&rsquo;s flood with crimson stain&mdash;</p>\n\t\t<p>To these impute, that in our hallow&rsquo;d dome</p>\n\t\t<p>Such orisons ascend.&rdquo; Sighing he shook</p>\n\t\t<p>The head, then thus resum&rsquo;d: &ldquo;In that affray</p>\n\t\t<p>I stood not singly, nor without just cause</p>\n\t\t<p>Assuredly should with the rest have stirr&rsquo;d;</p>\n\t\t<p>But singly there I stood, when by consent</p>\n\t\t<p>Of all, Florence had to the ground been raz&rsquo;d,</p>\n\t\t<p>The one who openly forbad the deed.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;So may thy lineage find at last repose,&rdquo;</p>\n\t\t<p>I thus adjur&rsquo;d him, &ldquo;as thou solve this knot,</p>\n\t\t<p>Which now involves my mind. If right I hear,</p>\n\t\t<p>Ye seem to view beforehand, that which time</p>\n\t\t<p>Leads with him, of the present uninform&rsquo;d.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;We view, as one who hath an evil sight,&rdquo;</p>\n\t\t<p>He answer&rsquo;d, &ldquo;plainly, objects far remote:</p>\n\t\t<p>So much of his large spendour yet imparts</p>\n\t\t<p>The&rsquo; Almighty Ruler; but when they approach</p>\n\t\t<p>Or actually exist, our intellect</p>\n\t\t<p>Then wholly fails, nor of your human state</p>\n\t\t<p>Except what others bring us know we aught.</p>\n\t\t<p>Hence therefore mayst thou understand, that all</p>\n\t\t<p>Our knowledge in that instant shall expire,</p>\n\t\t<p>When on futurity the portals close.&rdquo;</p>\n\t\t<p class="slindent">Then conscious of my fault, and by remorse</p>\n\t\t<p>Smitten, I added thus: &ldquo;Now shalt thou say</p>\n\t\t<p>To him there fallen, that his offspring still</p>\n\t\t<p>Is to the living join&rsquo;d; and bid him know,</p>\n\t\t<p>That if from answer silent I abstain&rsquo;d,</p>\n\t\t<p>&rsquo;Twas that my thought was occupied intent</p>\n\t\t<p>Upon that error, which thy help hath solv&rsquo;d.&rdquo;</p>\n\t\t<p class="slindent">But now my master summoning me back</p>\n\t\t<p>I heard, and with more eager haste besought</p>\n\t\t<p>The spirit to inform me, who with him</p>\n\t\t<p>Partook his lot. He answer thus return&rsquo;d:</p>\n\t\t<p class="slindent">&ldquo;More than a thousand with me here are laid</p>\n\t\t<p>Within is Frederick, second of that name,</p>\n\t\t<p>And the Lord Cardinal, and of the rest</p>\n\t\t<p>I speak not.&rdquo; He, this said, from sight withdrew.</p>\n\t\t<p>But I my steps towards the ancient bard</p>\n\t\t<p>Reverting, ruminated on the words</p>\n\t\t<p>Betokening me such ill. Onward he mov&rsquo;d,</p>\n\t\t<p>And thus in going question&rsquo;d: &ldquo;Whence the&rsquo; amaze</p>\n\t\t<p>That holds thy senses wrapt?&rdquo; I satisfied</p>\n\t\t<p>The&rsquo; inquiry, and the sage enjoin&rsquo;d me straight:</p>\n\t\t<p>&ldquo;Let thy safe memory store what thou hast heard</p>\n\t\t<p>To thee importing harm; and note thou this,&rdquo;</p>\n\t\t<p>With his rais&rsquo;d finger bidding me take heed,</p>\n\t\t<p class="slindent">&ldquo;When thou shalt stand before her gracious beam,</p>\n\t\t<p>Whose bright eye all surveys, she of thy life</p>\n\t\t<p>The future tenour will to thee unfold.&rdquo;</p>\n\t\t<p class="slindent">Forthwith he to the left hand turn&rsquo;d his feet:</p>\n\t\t<p>We left the wall, and tow&rsquo;rds the middle space</p>\n\t\t<p>Went by a path, that to a valley strikes;</p>\n\t\t<p>Which e&rsquo;en thus high exhal&rsquo;d its noisome steam.</p>\n\t\t</div>','<p class="cantohead">Canto XI</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">Upon</span> the utmost verge of a high bank,</p>\n\t\t<p>By craggy rocks environ&rsquo;d round, we came,</p>\n\t\t<p>Where woes beneath more cruel yet were stow&rsquo;d:</p>\n\t\t<p>And here to shun the horrible excess</p>\n\t\t<p>Of fetid exhalation, upward cast</p>\n\t\t<p>From the profound abyss, behind the lid</p>\n\t\t<p>Of a great monument we stood retir&rsquo;d,</p>\n\t\t<p>Whereon this scroll I mark&rsquo;d: &ldquo;I have in charge</p>\n\t\t<p>Pope Anastasius, whom Photinus drew</p>\n\t\t<p>From the right path.&mdash;Ere our descent behooves</p>\n\t\t<p>We make delay, that somewhat first the sense,</p>\n\t\t<p>To the dire breath accustom&rsquo;d, afterward</p>\n\t\t<p>Regard it not.&rdquo; My master thus; to whom</p>\n\t\t<p>Answering I spake: &ldquo;Some compensation find</p>\n\t\t<p>That the time past not wholly lost.&rdquo; He then:</p>\n\t\t<p>&ldquo;Lo! how my thoughts e&rsquo;en to thy wishes tend!</p>\n\t\t<p>My son! within these rocks,&rdquo; he thus began,</p>\n\t\t<p>&ldquo;Are three close circles in gradation plac&rsquo;d,</p>\n\t\t<p>As these which now thou leav&rsquo;st. Each one is full</p>\n\t\t<p>Of spirits accurs&rsquo;d; but that the sight alone</p>\n\t\t<p>Hereafter may suffice thee, listen how</p>\n\t\t<p>And for what cause in durance they abide.</p>\n\t\t<p class="slindent">&ldquo;Of all malicious act abhorr&rsquo;d in heaven,</p>\n\t\t<p>The end is injury; and all such end</p>\n\t\t<p>Either by force or fraud works other&rsquo;s woe</p>\n\t\t<p>But fraud, because of man peculiar evil,</p>\n\t\t<p>To God is more displeasing; and beneath</p>\n\t\t<p>The fraudulent are therefore doom&rsquo;d to&rsquo; endure</p>\n\t\t<p>Severer pang. The violent occupy</p>\n\t\t<p>All the first circle; and because to force</p>\n\t\t<p>Three persons are obnoxious, in three rounds</p>\n\t\t<p>Hach within other sep&rsquo;rate is it fram&rsquo;d.</p>\n\t\t<p>To God, his neighbour, and himself, by man</p>\n\t\t<p>Force may be offer&rsquo;d; to himself I say</p>\n\t\t<p>And his possessions, as thou soon shalt hear</p>\n\t\t<p>At full. Death, violent death, and painful wounds</p>\n\t\t<p>Upon his neighbour he inflicts; and wastes</p>\n\t\t<p>By devastation, pillage, and the flames,</p>\n\t\t<p>His substance. Slayers, and each one that smites</p>\n\t\t<p>In malice, plund&rsquo;rers, and all robbers, hence</p>\n\t\t<p>The torment undergo of the first round</p>\n\t\t<p>In different herds. Man can do violence</p>\n\t\t<p>To himself and his own blessings: and for this</p>\n\t\t<p>He in the second round must aye deplore</p>\n\t\t<p>With unavailing penitence his crime,</p>\n\t\t<p>Whoe&rsquo;er deprives himself of life and light,</p>\n\t\t<p>In reckless lavishment his talent wastes,</p>\n\t\t<p>And sorrows there where he should dwell in joy.</p>\n\t\t<p>To God may force be offer&rsquo;d, in the heart</p>\n\t\t<p>Denying and blaspheming his high power,</p>\n\t\t<p>And nature with her kindly law contemning.</p>\n\t\t<p>And thence the inmost round marks with its seal</p>\n\t\t<p>Sodom and Cahors, and all such as speak</p>\n\t\t<p>Contemptuously&rsquo; of the Godhead in their hearts.</p>\n\t\t<p class="slindent">&ldquo;Fraud, that in every conscience leaves a sting,</p>\n\t\t<p>May be by man employ&rsquo;d on one, whose trust</p>\n\t\t<p>He wins, or on another who withholds</p>\n\t\t<p>Strict confidence. Seems as the latter way</p>\n\t\t<p>Broke but the bond of love which Nature makes.</p>\n\t\t<p>Whence in the second circle have their nest</p>\n\t\t<p>Dissimulation, witchcraft, flatteries,</p>\n\t\t<p>Theft, falsehood, simony, all who seduce</p>\n\t\t<p>To lust, or set their honesty at pawn,</p>\n\t\t<p>With such vile scum as these. The other way</p>\n\t\t<p>Forgets both Nature&rsquo;s general love, and that</p>\n\t\t<p>Which thereto added afterwards gives birth</p>\n\t\t<p>To special faith. Whence in the lesser circle,</p>\n\t\t<p>Point of the universe, dread seat of Dis,</p>\n\t\t<p>The traitor is eternally consum&rsquo;d.&rdquo;</p>\n\t\t<p class="slindent">I thus: &ldquo;Instructor, clearly thy discourse</p>\n\t\t<p>Proceeds, distinguishing the hideous chasm</p>\n\t\t<p>And its inhabitants with skill exact.</p>\n\t\t<p>But tell me this: they of the dull, fat pool,</p>\n\t\t<p>Whom the rain beats, or whom the tempest drives,</p>\n\t\t<p>Or who with tongues so fierce conflicting meet,</p>\n\t\t<p>Wherefore within the city fire-illum&rsquo;d</p>\n\t\t<p>Are not these punish&rsquo;d, if God&rsquo;s wrath be on them?</p>\n\t\t<p>And if it be not, wherefore in such guise</p>\n\t\t<p>Are they condemned?&rdquo; He answer thus return&rsquo;d:</p>\n\t\t<p>&ldquo;Wherefore in dotage wanders thus thy mind,</p>\n\t\t<p>Not so accustom&rsquo;d? or what other thoughts</p>\n\t\t<p>Possess it? Dwell not in thy memory</p>\n\t\t<p>The words, wherein thy ethic page describes</p>\n\t\t<p>Three dispositions adverse to Heav&rsquo;n&rsquo;s will,</p>\n\t\t<p>Incont&rsquo;nence, malice, and mad brutishness,</p>\n\t\t<p>And how incontinence the least offends</p>\n\t\t<p>God, and least guilt incurs? If well thou note</p>\n\t\t<p>This judgment, and remember who they are,</p>\n\t\t<p>Without these walls to vain repentance doom&rsquo;d,</p>\n\t\t<p>Thou shalt discern why they apart are plac&rsquo;d</p>\n\t\t<p>From these fell spirits, and less wreakful pours</p>\n\t\t<p>Justice divine on them its vengeance down.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;O Sun! who healest all imperfect sight,</p>\n\t\t<p>Thou so content&rsquo;st me, when thou solv&rsquo;st my doubt,</p>\n\t\t<p>That ignorance not less than knowledge charms.</p>\n\t\t<p>Yet somewhat turn thee back,&rdquo; I in these words</p>\n\t\t<p>Continu&rsquo;d, &ldquo;where thou saidst, that usury</p>\n\t\t<p>Offends celestial Goodness; and this knot</p>\n\t\t<p>Perplex&rsquo;d unravel.&rdquo; He thus made reply:</p>\n\t\t<p>&ldquo;Philosophy, to an attentive ear,</p>\n\t\t<p>Clearly points out, not in one part alone,</p>\n\t\t<p>How imitative nature takes her course</p>\n\t\t<p>From the celestial mind and from its art:</p>\n\t\t<p>And where her laws the Stagyrite unfolds,</p>\n\t\t<p>Not many leaves scann&rsquo;d o&rsquo;er, observing well</p>\n\t\t<p>Thou shalt discover, that your art on her</p>\n\t\t<p>Obsequious follows, as the learner treads</p>\n\t\t<p>In his instructor&rsquo;s step, so that your art</p>\n\t\t<p>Deserves the name of second in descent</p>\n\t\t<p>From God. These two, if thou recall to mind</p>\n\t\t<p>Creation&rsquo;s holy book, from the beginning</p>\n\t\t<p>Were the right source of life and excellence</p>\n\t\t<p>To human kind. But in another path</p>\n\t\t<p>The usurer walks; and Nature in herself</p>\n\t\t<p>And in her follower thus he sets at nought,</p>\n\t\t<p>Placing elsewhere his hope. But follow now</p>\n\t\t<p>My steps on forward journey bent; for now</p>\n\t\t<p>The Pisces play with undulating glance</p>\n\t\t<p>Along the&rsquo; horizon, and the Wain lies all</p>\n\t\t<p>O&rsquo;er the north-west; and onward there a space</p>\n\t\t<p>Is our steep passage down the rocky height.&rdquo;</p>\n\t\t</div>','<p class="cantohead">Canto XII</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">The</span> place where to descend the precipice</p>\n\t\t<p>We came, was rough as Alp, and on its verge</p>\n\t\t<p>Such object lay, as every eye would shun.</p>\n\t\t<p class="slindent">As is that ruin, which Adice&rsquo;s stream</p>\n\t\t<p>On this side Trento struck, should&rsquo;ring the wave,</p>\n\t\t<p>Or loos&rsquo;d by earthquake or for lack of prop;</p>\n\t\t<p>For from the mountain&rsquo;s summit, whence it mov&rsquo;d</p>\n\t\t<p>To the low level, so the headlong rock</p>\n\t\t<p>Is shiver&rsquo;d, that some passage it might give</p>\n\t\t<p>To him who from above would pass; e&rsquo;en such</p>\n\t\t<p>Into the chasm was that descent: and there</p>\n\t\t<p>At point of the disparted ridge lay stretch&rsquo;d</p>\n\t\t<p>The infamy of Crete, detested brood</p>\n\t\t<p>Of the feign&rsquo;d heifer: and at sight of us</p>\n\t\t<p>It gnaw&rsquo;d itself, as one with rage distract.</p>\n\t\t<p>To him my guide exclaim&rsquo;d: &ldquo;Perchance thou deem&rsquo;st</p>\n\t\t<p>The King of Athens here, who, in the world</p>\n\t\t<p>Above, thy death contriv&rsquo;d. Monster! avaunt!</p>\n\t\t<p>He comes not tutor&rsquo;d by thy sister&rsquo;s art,</p>\n\t\t<p>But to behold your torments is he come.&rdquo;</p>\n\t\t<p class="slindent">Like to a bull, that with impetuous spring</p>\n\t\t<p>Darts, at the moment when the fatal blow</p>\n\t\t<p>Hath struck him, but unable to proceed</p>\n\t\t<p>Plunges on either side; so saw I plunge</p>\n\t\t<p>The Minotaur; whereat the sage exclaim&rsquo;d:</p>\n\t\t<p>&ldquo;Run to the passage! while he storms, &rsquo;t is well</p>\n\t\t<p>That thou descend.&rdquo; Thus down our road we took</p>\n\t\t<p>Through those dilapidated crags, that oft</p>\n\t\t<p>Mov&rsquo;d underneath my feet, to weight like theirs</p>\n\t\t<p>Unus&rsquo;d. I pond&rsquo;ring went, and thus he spake:</p>\n\t\t<p class="slindent">&ldquo;Perhaps thy thoughts are of this ruin&rsquo;d steep,</p>\n\t\t<p>Guarded by the brute violence, which I</p>\n\t\t<p>Have vanquish&rsquo;d now. Know then, that when I erst</p>\n\t\t<p>Hither descended to the nether hell,</p>\n\t\t<p>This rock was not yet fallen. But past doubt</p>\n\t\t<p>(If well I mark) not long ere He arrived,</p>\n\t\t<p>Who carried off from Dis the mighty spoil</p>\n\t\t<p>Of the highest circle, then through all its bounds</p>\n\t\t<p>Such trembling seiz&rsquo;d the deep concave and foul,</p>\n\t\t<p>I thought the universe was thrill&rsquo;d with love,</p>\n\t\t<p>Whereby, there are who deem, the world hath oft</p>\n\t\t<p>Been into chaos turn&rsquo;d: and in that point,</p>\n\t\t<p>Here, and elsewhere, that old rock toppled down.</p>\n\t\t<p>But fix thine eyes beneath: the river of blood</p>\n\t\t<p>Approaches, in the which all those are steep&rsquo;d,</p>\n\t\t<p>Who have by violence injur&rsquo;d.&rdquo; O blind lust!</p>\n\t\t<p>O foolish wrath! who so dost goad us on</p>\n\t\t<p>In the brief life, and in the eternal then</p>\n\t\t<p>Thus miserably o&rsquo;erwhelm us. I beheld</p>\n\t\t<p>An ample foss, that in a bow was bent,</p>\n\t\t<p>As circling all the plain; for so my guide</p>\n\t\t<p>Had told. Between it and the rampart&rsquo;s base</p>\n\t\t<p>On trail ran Centaurs, with keen arrows arm&rsquo;d,</p>\n\t\t<p>As to the chase they on the earth were wont.</p>\n\t\t<p class="slindent">At seeing us descend they each one stood;</p>\n\t\t<p>And issuing from the troop, three sped with bows</p>\n\t\t<p>And missile weapons chosen first; of whom</p>\n\t\t<p>One cried from far: &ldquo;Say to what pain ye come</p>\n\t\t<p>Condemn&rsquo;d, who down this steep have journied? Speak</p>\n\t\t<p>From whence ye stand, or else the bow I draw.&rdquo;</p>\n\t\t<p class="slindent">To whom my guide: &ldquo;Our answer shall be made</p>\n\t\t<p>To Chiron, there, when nearer him we come.</p>\n\t\t<p>Ill was thy mind, thus ever quick and rash.&rdquo;</p>\n\t\t<p class="slindent">Then me he touch&rsquo;d, and spake: &ldquo;Nessus is this,</p>\n\t\t<p>Who for the fair Deianira died,</p>\n\t\t<p>And wrought himself revenge for his own fate.</p>\n\t\t<p>He in the midst, that on his breast looks down,</p>\n\t\t<p>Is the great Chiron who Achilles nurs&rsquo;d;</p>\n\t\t<p>That other Pholus, prone to wrath.&rdquo; Around</p>\n\t\t<p>The foss these go by thousands, aiming shafts</p>\n\t\t<p>At whatsoever spirit dares emerge</p>\n\t\t<p>From out the blood, more than his guilt allows.</p>\n\t\t<p class="slindent">We to those beasts, that rapid strode along,</p>\n\t\t<p>Drew near, when Chiron took an arrow forth,</p>\n\t\t<p>And with the notch push&rsquo;d back his shaggy beard</p>\n\t\t<p>To the cheek-bone, then his great mouth to view</p>\n\t\t<p>Exposing, to his fellows thus exclaim&rsquo;d:</p>\n\t\t<p>&ldquo;Are ye aware, that he who comes behind</p>\n\t\t<p>Moves what he touches? The feet of the dead</p>\n\t\t<p>Are not so wont.&rdquo; My trusty guide, who now</p>\n\t\t<p>Stood near his breast, where the two natures join,</p>\n\t\t<p>Thus made reply: &ldquo;He is indeed alive,</p>\n\t\t<p>And solitary so must needs by me</p>\n\t\t<p>Be shown the gloomy vale, thereto induc&rsquo;d</p>\n\t\t<p>By strict necessity, not by delight.</p>\n\t\t<p>She left her joyful harpings in the sky,</p>\n\t\t<p>Who this new office to my care consign&rsquo;d.</p>\n\t\t<p>He is no robber, no dark spirit I.</p>\n\t\t<p>But by that virtue, which empowers my step</p>\n\t\t<p>To treat so wild a path, grant us, I pray,</p>\n\t\t<p>One of thy band, whom we may trust secure,</p>\n\t\t<p>Who to the ford may lead us, and convey</p>\n\t\t<p>Across, him mounted on his back; for he</p>\n\t\t<p>Is not a spirit that may walk the air.&rdquo;</p>\n\t\t<p class="slindent">Then on his right breast turning, Chiron thus</p>\n\t\t<p>To Nessus spake: &ldquo;Return, and be their guide.</p>\n\t\t<p>And if ye chance to cross another troop,</p>\n\t\t<p>Command them keep aloof.&rdquo; Onward we mov&rsquo;d,</p>\n\t\t<p>The faithful escort by our side, along</p>\n\t\t<p>The border of the crimson-seething flood,</p>\n\t\t<p>Whence from those steep&rsquo;d within loud shrieks arose.</p>\n\t\t<p class="slindent">Some there I mark&rsquo;d, as high as to their brow</p>\n\t\t<p>Immers&rsquo;d, of whom the mighty Centaur thus:</p>\n\t\t<p>&ldquo;These are the souls of tyrants, who were given</p>\n\t\t<p>To blood and rapine. Here they wail aloud</p>\n\t\t<p>Their merciless wrongs. Here Alexander dwells,</p>\n\t\t<p>And Dionysius fell, who many a year</p>\n\t\t<p>Of woe wrought for fair Sicily. That brow</p>\n\t\t<p>Whereon the hair so jetty clust&rsquo;ring hangs,</p>\n\t\t<p>Is Azzolino; that with flaxen locks</p>\n\t\t<p>Obizzo&rsquo; of Este, in the world destroy&rsquo;d</p>\n\t\t<p>By his foul step-son.&rdquo; To the bard rever&rsquo;d</p>\n\t\t<p>I turned me round, and thus he spake; &ldquo;Let him</p>\n\t\t<p>Be to thee now first leader, me but next</p>\n\t\t<p>To him in rank.&rdquo; Then farther on a space</p>\n\t\t<p>The Centaur paus&rsquo;d, near some, who at the throat</p>\n\t\t<p>Were extant from the wave; and showing us</p>\n\t\t<p>A spirit by itself apart retir&rsquo;d,</p>\n\t\t<p>Exclaim&rsquo;d: &ldquo;He in God&rsquo;s bosom smote the heart,</p>\n\t\t<p>Which yet is honour&rsquo;d on the bank of Thames.&rdquo;</p>\n\t\t<p class="slindent">A race I next espied, who held the head,</p>\n\t\t<p>And even all the bust above the stream.</p>\n\t\t<p>&rsquo;Midst these I many a face remember&rsquo;d well.</p>\n\t\t<p>Thus shallow more and more the blood became,</p>\n\t\t<p>So that at last it but imbru&rsquo;d the feet;</p>\n\t\t<p>And there our passage lay athwart the foss.</p>\n\t\t<p class="slindent">&ldquo;As ever on this side the boiling wave</p>\n\t\t<p>Thou seest diminishing,&rdquo; the Centaur said,</p>\n\t\t<p>&ldquo;So on the other, be thou well assur&rsquo;d,</p>\n\t\t<p>It lower still and lower sinks its bed,</p>\n\t\t<p>Till in that part it reuniting join,</p>\n\t\t<p>Where &rsquo;t is the lot of tyranny to mourn.</p>\n\t\t<p>There Heav&rsquo;n&rsquo;s stern justice lays chastising hand</p>\n\t\t<p>On Attila, who was the scourge of earth,</p>\n\t\t<p>On Sextus, and on Pyrrhus, and extracts</p>\n\t\t<p>Tears ever by the seething flood unlock&rsquo;d</p>\n\t\t<p>From the Rinieri, of Corneto this,</p>\n\t\t<p>Pazzo the other nam&rsquo;d, who fill&rsquo;d the ways</p>\n\t\t<p>With violence and war.&rdquo; This said, he turn&rsquo;d,</p>\n\t\t<p>And quitting us, alone repass&rsquo;d the ford.</p>\n\t\t</div>','<p class="cantohead">Canto XIII</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">Ere</span> Nessus yet had reach&rsquo;d the other bank,</p>\n\t\t<p>We enter&rsquo;d on a forest, where no track</p>\n\t\t<p>Of steps had worn a way. Not verdant there</p>\n\t\t<p>The foliage, but of dusky hue; not light</p>\n\t\t<p>The boughs and tapering, but with knares deform&rsquo;d</p>\n\t\t<p>And matted thick: fruits there were none, but thorns</p>\n\t\t<p>Instead, with venom fill&rsquo;d. Less sharp than these,</p>\n\t\t<p>Less intricate the brakes, wherein abide</p>\n\t\t<p>Those animals, that hate the cultur&rsquo;d fields,</p>\n\t\t<p>Betwixt Corneto and Cecina&rsquo;s stream.</p>\n\t\t<p class="slindent">Here the brute Harpies make their nest, the same</p>\n\t\t<p>Who from the Strophades the Trojan band</p>\n\t\t<p>Drove with dire boding of their future woe.</p>\n\t\t<p>Broad are their pennons, of the human form</p>\n\t\t<p>Their neck and count&rsquo;nance, arm&rsquo;d with talons keen</p>\n\t\t<p>The feet, and the huge belly fledge with wings</p>\n\t\t<p>These sit and wail on the drear mystic wood.</p>\n\t\t<p class="slindent">The kind instructor in these words began:</p>\n\t\t<p>&ldquo;Ere farther thou proceed, know thou art now</p>\n\t\t<p>I&rsquo; th&rsquo; second round, and shalt be, till thou come</p>\n\t\t<p>Upon the horrid sand: look therefore well</p>\n\t\t<p>Around thee, and such things thou shalt behold,</p>\n\t\t<p>As would my speech discredit.&rdquo; On all sides</p>\n\t\t<p>I heard sad plainings breathe, and none could see</p>\n\t\t<p>From whom they might have issu&rsquo;d. In amaze</p>\n\t\t<p>Fast bound I stood. He, as it seem&rsquo;d, believ&rsquo;d,</p>\n\t\t<p>That I had thought so many voices came</p>\n\t\t<p>From some amid those thickets close conceal&rsquo;d,</p>\n\t\t<p>And thus his speech resum&rsquo;d: &ldquo;If thou lop off</p>\n\t\t<p>A single twig from one of those ill plants,</p>\n\t\t<p>The thought thou hast conceiv&rsquo;d shall vanish quite.&rdquo;</p>\n\t\t<p class="slindent">Thereat a little stretching forth my hand,</p>\n\t\t<p>From a great wilding gather&rsquo;d I a branch,</p>\n\t\t<p>And straight the trunk exclaim&rsquo;d: &ldquo;Why pluck&rsquo;st thou me?&rdquo;</p>\n\t\t<p>Then as the dark blood trickled down its side,</p>\n\t\t<p>These words it added: &ldquo;Wherefore tear&rsquo;st me thus?</p>\n\t\t<p>Is there no touch of mercy in thy breast?</p>\n\t\t<p>Men once were we, that now are rooted here.</p>\n\t\t<p>Thy hand might well have spar&rsquo;d us, had we been</p>\n\t\t<p>The souls of serpents.&rdquo; As a brand yet green,</p>\n\t\t<p>That burning at one end from the&rsquo; other sends</p>\n\t\t<p>A groaning sound, and hisses with the wind</p>\n\t\t<p>That forces out its way, so burst at once,</p>\n\t\t<p>Forth from the broken splinter words and blood.</p>\n\t\t<p class="slindent">I, letting fall the bough, remain&rsquo;d as one</p>\n\t\t<p>Assail&rsquo;d by terror, and the sage replied:</p>\n\t\t<p>&ldquo;If he, O injur&rsquo;d spirit! could have believ&rsquo;d</p>\n\t\t<p>What he hath seen but in my verse describ&rsquo;d,</p>\n\t\t<p>He never against thee had stretch&rsquo;d his hand.</p>\n\t\t<p>But I, because the thing surpass&rsquo;d belief,</p>\n\t\t<p>Prompted him to this deed, which even now</p>\n\t\t<p>Myself I rue. But tell me, who thou wast;</p>\n\t\t<p>That, for this wrong to do thee some amends,</p>\n\t\t<p>In the upper world (for thither to return</p>\n\t\t<p>Is granted him) thy fame he may revive.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;That pleasant word of thine,&rdquo; the trunk replied</p>\n\t\t<p>&ldquo;Hath so inveigled me, that I from speech</p>\n\t\t<p>Cannot refrain, wherein if I indulge</p>\n\t\t<p>A little longer, in the snare detain&rsquo;d,</p>\n\t\t<p>Count it not grievous. I it was, who held</p>\n\t\t<p>Both keys to Frederick&rsquo;s heart, and turn&rsquo;d the wards,</p>\n\t\t<p>Opening and shutting, with a skill so sweet,</p>\n\t\t<p>That besides me, into his inmost breast</p>\n\t\t<p>Scarce any other could admittance find.</p>\n\t\t<p>The faith I bore to my high charge was such,</p>\n\t\t<p>It cost me the life-blood that warm&rsquo;d my veins.</p>\n\t\t<p>The harlot, who ne&rsquo;er turn&rsquo;d her gloating eyes</p>\n\t\t<p>From Caesar&rsquo;s household, common vice and pest</p>\n\t\t<p>Of courts, &rsquo;gainst me inflam&rsquo;d the minds of all;</p>\n\t\t<p>And to Augustus they so spread the flame,</p>\n\t\t<p>That my glad honours chang&rsquo;d to bitter woes.</p>\n\t\t<p>My soul, disdainful and disgusted, sought</p>\n\t\t<p>Refuge in death from scorn, and I became,</p>\n\t\t<p>Just as I was, unjust toward myself.</p>\n\t\t<p>By the new roots, which fix this stem, I swear,</p>\n\t\t<p>That never faith I broke to my liege lord,</p>\n\t\t<p>Who merited such honour; and of you,</p>\n\t\t<p>If any to the world indeed return,</p>\n\t\t<p>Clear he from wrong my memory, that lies</p>\n\t\t<p>Yet prostrate under envy&rsquo;s cruel blow.&rdquo;</p>\n\t\t<p class="slindent">First somewhat pausing, till the mournful words</p>\n\t\t<p>Were ended, then to me the bard began:</p>\n\t\t<p>&ldquo;Lose not the time; but speak and of him ask,</p>\n\t\t<p>If more thou wish to learn.&rdquo; Whence I replied:</p>\n\t\t<p>&ldquo;Question thou him again of whatsoe&rsquo;er</p>\n\t\t<p>Will, as thou think&rsquo;st, content me; for no power</p>\n\t\t<p>Have I to ask, such pity&rsquo; is at my heart.&rdquo;</p>\n\t\t<p class="slindent">He thus resum&rsquo;d; &ldquo;So may he do for thee</p>\n\t\t<p>Freely what thou entreatest, as thou yet</p>\n\t\t<p>Be pleas&rsquo;d, imprison&rsquo;d Spirit! to declare,</p>\n\t\t<p>How in these gnarled joints the soul is tied;</p>\n\t\t<p>And whether any ever from such frame</p>\n\t\t<p>Be loosen&rsquo;d, if thou canst, that also tell.&rdquo;</p>\n\t\t<p class="slindent">Thereat the trunk breath&rsquo;d hard, and the wind soon</p>\n\t\t<p>Chang&rsquo;d into sounds articulate like these;</p>\n\t\t<p class="slindent">&ldquo;Briefly ye shall be answer&rsquo;d. When departs</p>\n\t\t<p>The fierce soul from the body, by itself</p>\n\t\t<p>Thence torn asunder, to the seventh gulf</p>\n\t\t<p>By Minos doom&rsquo;d, into the wood it falls,</p>\n\t\t<p>No place assign&rsquo;d, but wheresoever chance</p>\n\t\t<p>Hurls it, there sprouting, as a grain of spelt,</p>\n\t\t<p>It rises to a sapling, growing thence</p>\n\t\t<p>A savage plant. The Harpies, on its leaves</p>\n\t\t<p>Then feeding, cause both pain and for the pain</p>\n\t\t<p>A vent to grief. We, as the rest, shall come</p>\n\t\t<p>For our own spoils, yet not so that with them</p>\n\t\t<p>We may again be clad; for what a man</p>\n\t\t<p>Takes from himself it is not just he have.</p>\n\t\t<p>Here we perforce shall drag them; and throughout</p>\n\t\t<p>The dismal glade our bodies shall be hung,</p>\n\t\t<p>Each on the wild thorn of his wretched shade.&rdquo;</p>\n\t\t<p class="slindent">Attentive yet to listen to the trunk</p>\n\t\t<p>We stood, expecting farther speech, when us</p>\n\t\t<p>A noise surpris&rsquo;d, as when a man perceives</p>\n\t\t<p>The wild boar and the hunt approach his place</p>\n\t\t<p>Of station&rsquo;d watch, who of the beasts and boughs</p>\n\t\t<p>Loud rustling round him hears. And lo! there came</p>\n\t\t<p>Two naked, torn with briers, in headlong flight,</p>\n\t\t<p>That they before them broke each fan o&rsquo; th&rsquo; wood.</p>\n\t\t<p>&ldquo;Haste now,&rdquo; the foremost cried, &ldquo;now haste thee death!&rdquo;</p>\n\t\t<p>The&rsquo; other, as seem&rsquo;d, impatient of delay</p>\n\t\t<p>Exclaiming, &ldquo;Lano! not so bent for speed</p>\n\t\t<p>Thy sinews, in the lists of Toppo&rsquo;s field.&rdquo;</p>\n\t\t<p>And then, for that perchance no longer breath</p>\n\t\t<p>Suffic&rsquo;d him, of himself and of a bush</p>\n\t\t<p>One group he made. Behind them was the wood</p>\n\t\t<p>Full of black female mastiffs, gaunt and fleet,</p>\n\t\t<p>As greyhounds that have newly slipp&rsquo;d the leash.</p>\n\t\t<p>On him, who squatted down, they stuck their fangs,</p>\n\t\t<p>And having rent him piecemeal bore away</p>\n\t\t<p>The tortur&rsquo;d limbs. My guide then seiz&rsquo;d my hand,</p>\n\t\t<p>And led me to the thicket, which in vain</p>\n\t\t<p>Mourn&rsquo;d through its bleeding wounds: &ldquo;O Giacomo</p>\n\t\t<p>Of Sant&rsquo; Andrea! what avails it thee,&rdquo;</p>\n\t\t<p>It cried, &ldquo;that of me thou hast made thy screen?</p>\n\t\t<p>For thy ill life what blame on me recoils?&rdquo;</p>\n\t\t<p class="slindent">When o&rsquo;er it he had paus&rsquo;d, my master spake:</p>\n\t\t<p>&ldquo;Say who wast thou, that at so many points</p>\n\t\t<p>Breath&rsquo;st out with blood thy lamentable speech?&rdquo;</p>\n\t\t<p class="slindent">He answer&rsquo;d: &ldquo;Oh, ye spirits: arriv&rsquo;d in time</p>\n\t\t<p>To spy the shameful havoc, that from me</p>\n\t\t<p>My leaves hath sever&rsquo;d thus, gather them up,</p>\n\t\t<p>And at the foot of their sad parent-tree</p>\n\t\t<p>Carefully lay them. In that city&rsquo; I dwelt,</p>\n\t\t<p>Who for the Baptist her first patron chang&rsquo;d,</p>\n\t\t<p>Whence he for this shall cease not with his art</p>\n\t\t<p>To work her woe: and if there still remain&rsquo;d not</p>\n\t\t<p>On Arno&rsquo;s passage some faint glimpse of him,</p>\n\t\t<p>Those citizens, who rear&rsquo;d once more her walls</p>\n\t\t<p>Upon the ashes left by Attila,</p>\n\t\t<p>Had labour&rsquo;d without profit of their toil.</p>\n\t\t<p>I slung the fatal noose from my own roof.&rdquo;</p>\n\t\t</div>','<p class="cantohead">Canto XIV</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">Soon</span> as the charity of native land</p>\n\t\t<p>Wrought in my bosom, I the scatter&rsquo;d leaves</p>\n\t\t<p>Collected, and to him restor&rsquo;d, who now</p>\n\t\t<p>Was hoarse with utt&rsquo;rance. To the limit thence</p>\n\t\t<p>We came, which from the third the second round</p>\n\t\t<p>Divides, and where of justice is display&rsquo;d</p>\n\t\t<p>Contrivance horrible. Things then first seen</p>\n\t\t<p>Clearlier to manifest, I tell how next</p>\n\t\t<p>A plain we reach&rsquo;d, that from its sterile bed</p>\n\t\t<p>Each plant repell&rsquo;d. The mournful wood waves round</p>\n\t\t<p>Its garland on all sides, as round the wood</p>\n\t\t<p>Spreads the sad foss. There, on the very edge,</p>\n\t\t<p>Our steps we stay&rsquo;d. It was an area wide</p>\n\t\t<p>Of arid sand and thick, resembling most</p>\n\t\t<p>The soil that erst by Cato&rsquo;s foot was trod.</p>\n\t\t<p class="slindent">Vengeance of Heav&rsquo;n! Oh! how shouldst thou be fear&rsquo;d</p>\n\t\t<p>By all, who read what here my eyes beheld!</p>\n\t\t<p class="slindent">Of naked spirits many a flock I saw,</p>\n\t\t<p>All weeping piteously, to different laws</p>\n\t\t<p>Subjected: for on the&rsquo; earth some lay supine,</p>\n\t\t<p>Some crouching close were seated, others pac&rsquo;d</p>\n\t\t<p>Incessantly around; the latter tribe,</p>\n\t\t<p>More numerous, those fewer who beneath</p>\n\t\t<p>The torment lay, but louder in their grief.</p>\n\t\t<p class="slindent">O&rsquo;er all the sand fell slowly wafting down</p>\n\t\t<p>Dilated flakes of fire, as flakes of snow</p>\n\t\t<p>On Alpine summit, when the wind is hush&rsquo;d.</p>\n\t\t<p>As in the torrid Indian clime, the son</p>\n\t\t<p>Of Ammon saw upon his warrior band</p>\n\t\t<p>Descending, solid flames, that to the ground</p>\n\t\t<p>Came down: whence he bethought him with his troop</p>\n\t\t<p>To trample on the soil; for easier thus</p>\n\t\t<p>The vapour was extinguish&rsquo;d, while alone;</p>\n\t\t<p>So fell the eternal fiery flood, wherewith</p>\n\t\t<p>The marble glow&rsquo;d underneath, as under stove</p>\n\t\t<p>The viands, doubly to augment the pain.</p>\n\t\t<p>Unceasing was the play of wretched hands,</p>\n\t\t<p>Now this, now that way glancing, to shake off</p>\n\t\t<p>The heat, still falling fresh. I thus began:</p>\n\t\t<p>&ldquo;Instructor! thou who all things overcom&rsquo;st,</p>\n\t\t<p>Except the hardy demons, that rush&rsquo;d forth</p>\n\t\t<p>To stop our entrance at the gate, say who</p>\n\t\t<p>Is yon huge spirit, that, as seems, heeds not</p>\n\t\t<p>The burning, but lies writhen in proud scorn,</p>\n\t\t<p>As by the sultry tempest immatur&rsquo;d?&rdquo;</p>\n\t\t<p class="slindent">Straight he himself, who was aware I ask&rsquo;d</p>\n\t\t<p>My guide of him, exclaim&rsquo;d: &ldquo;Such as I was</p>\n\t\t<p>When living, dead such now I am. If Jove</p>\n\t\t<p>Weary his workman out, from whom in ire</p>\n\t\t<p>He snatch&rsquo;d the lightnings, that at my last day</p>\n\t\t<p>Transfix&rsquo;d me, if the rest be weary out</p>\n\t\t<p>At their black smithy labouring by turns</p>\n\t\t<p>In Mongibello, while he cries aloud;</p>\n\t\t<p>&ldquo;Help, help, good Mulciber!&rdquo; as erst he cried</p>\n\t\t<p>In the Phlegraean warfare, and the bolts</p>\n\t\t<p>Launch he full aim&rsquo;d at me with all his might,</p>\n\t\t<p>He never should enjoy a sweet revenge.&rdquo;</p>\n\t\t<p class="slindent">Then thus my guide, in accent higher rais&rsquo;d</p>\n\t\t<p>Than I before had heard him: &ldquo;Capaneus!</p>\n\t\t<p>Thou art more punish&rsquo;d, in that this thy pride</p>\n\t\t<p>Lives yet unquench&rsquo;d: no torrent, save thy rage,</p>\n\t\t<p>Were to thy fury pain proportion&rsquo;d full.&rdquo;</p>\n\t\t<p class="slindent">Next turning round to me with milder lip</p>\n\t\t<p>He spake: &ldquo;This of the seven kings was one,</p>\n\t\t<p>Who girt the Theban walls with siege, and held,</p>\n\t\t<p>As still he seems to hold, God in disdain,</p>\n\t\t<p>And sets his high omnipotence at nought.</p>\n\t\t<p>But, as I told him, his despiteful mood</p>\n\t\t<p>Is ornament well suits the breast that wears it.</p>\n\t\t<p>Follow me now; and look thou set not yet</p>\n\t\t<p>Thy foot in the hot sand, but to the wood</p>\n\t\t<p>Keep ever close.&rdquo; Silently on we pass&rsquo;d</p>\n\t\t<p>To where there gushes from the forest&rsquo;s bound</p>\n\t\t<p>A little brook, whose crimson&rsquo;d wave yet lifts</p>\n\t\t<p>My hair with horror. As the rill, that runs</p>\n\t\t<p>From Bulicame, to be portion&rsquo;d out</p>\n\t\t<p>Among the sinful women; so ran this</p>\n\t\t<p>Down through the sand, its bottom and each bank</p>\n\t\t<p>Stone-built, and either margin at its side,</p>\n\t\t<p>Whereon I straight perceiv&rsquo;d our passage lay.</p>\n\t\t<p class="slindent">&ldquo;Of all that I have shown thee, since that gate</p>\n\t\t<p>We enter&rsquo;d first, whose threshold is to none</p>\n\t\t<p>Denied, nought else so worthy of regard,</p>\n\t\t<p>As is this river, has thine eye discern&rsquo;d,</p>\n\t\t<p>O&rsquo;er which the flaming volley all is quench&rsquo;d.&rdquo;</p>\n\t\t<p class="slindent">So spake my guide; and I him thence besought,</p>\n\t\t<p>That having giv&rsquo;n me appetite to know,</p>\n\t\t<p>The food he too would give, that hunger crav&rsquo;d.</p>\n\t\t<p class="slindent">&ldquo;In midst of ocean,&rdquo; forthwith he began,</p>\n\t\t<p>&ldquo;A desolate country lies, which Crete is nam&rsquo;d,</p>\n\t\t<p>Under whose monarch in old times the world</p>\n\t\t<p>Liv&rsquo;d pure and chaste. A mountain rises there,</p>\n\t\t<p>Call&rsquo;d Ida, joyous once with leaves and streams,</p>\n\t\t<p>Deserted now like a forbidden thing.</p>\n\t\t<p>It was the spot which Rhea, Saturn&rsquo;s spouse,</p>\n\t\t<p>Chose for the secret cradle of her son;</p>\n\t\t<p>And better to conceal him, drown&rsquo;d in shouts</p>\n\t\t<p>His infant cries. Within the mount, upright</p>\n\t\t<p>An ancient form there stands and huge, that turns</p>\n\t\t<p>His shoulders towards Damiata, and at Rome</p>\n\t\t<p>As in his mirror looks. Of finest gold</p>\n\t\t<p>His head is shap&rsquo;d, pure silver are the breast</p>\n\t\t<p>And arms; thence to the middle is of brass.</p>\n\t\t<p>And downward all beneath well-temper&rsquo;d steel,</p>\n\t\t<p>Save the right foot of potter&rsquo;s clay, on which</p>\n\t\t<p>Than on the other more erect he stands,</p>\n\t\t<p>Each part except the gold, is rent throughout;</p>\n\t\t<p>And from the fissure tears distil, which join&rsquo;d</p>\n\t\t<p>Penetrate to that cave. They in their course</p>\n\t\t<p>Thus far precipitated down the rock</p>\n\t\t<p>Form Acheron, and Styx, and Phlegethon;</p>\n\t\t<p>Then by this straiten&rsquo;d channel passing hence</p>\n\t\t<p>Beneath, e&rsquo;en to the lowest depth of all,</p>\n\t\t<p>Form there Cocytus, of whose lake (thyself</p>\n\t\t<p>Shall see it) I here give thee no account.&rdquo;</p>\n\t\t<p class="slindent">Then I to him: &ldquo;If from our world this sluice</p>\n\t\t<p>Be thus deriv&rsquo;d; wherefore to us but now</p>\n\t\t<p>Appears it at this edge?&rdquo; He straight replied:</p>\n\t\t<p>&ldquo;The place, thou know&rsquo;st, is round; and though great part</p>\n\t\t<p>Thou have already pass&rsquo;d, still to the left</p>\n\t\t<p>Descending to the nethermost, not yet</p>\n\t\t<p>Hast thou the circuit made of the whole orb.</p>\n\t\t<p>Wherefore if aught of new to us appear,</p>\n\t\t<p>It needs not bring up wonder in thy looks.&rdquo;</p>\n\t\t<p class="slindent">Then I again inquir&rsquo;d: &ldquo;Where flow the streams</p>\n\t\t<p>Of Phlegethon and Lethe? for of one</p>\n\t\t<p>Thou tell&rsquo;st not, and the other of that shower,</p>\n\t\t<p>Thou say&rsquo;st, is form&rsquo;d.&rdquo; He answer thus return&rsquo;d:</p>\n\t\t<p>&ldquo;Doubtless thy questions all well pleas&rsquo;d I hear.</p>\n\t\t<p>Yet the red seething wave might have resolv&rsquo;d</p>\n\t\t<p>One thou proposest. Lethe thou shalt see,</p>\n\t\t<p>But not within this hollow, in the place,</p>\n\t\t<p>Whither to lave themselves the spirits go,</p>\n\t\t<p>Whose blame hath been by penitence remov&rsquo;d.&rdquo;</p>\n\t\t<p>He added: &ldquo;Time is now we quit the wood.</p>\n\t\t<p>Look thou my steps pursue: the margins give</p>\n\t\t<p>Safe passage, unimpeded by the flames;</p>\n\t\t<p>For over them all vapour is extinct.&rdquo;</p>\n\t\t</div>','<p class="cantohead">Canto XV</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">One</span> of the solid margins bears us now</p>\n\t\t<p>Envelop&rsquo;d in the mist, that from the stream</p>\n\t\t<p>Arising, hovers o&rsquo;er, and saves from fire</p>\n\t\t<p>Both piers and water. As the Flemings rear</p>\n\t\t<p>Their mound, &rsquo;twixt Ghent and Bruges, to chase back</p>\n\t\t<p>The ocean, fearing his tumultuous tide</p>\n\t\t<p>That drives toward them, or the Paduans theirs</p>\n\t\t<p>Along the Brenta, to defend their towns</p>\n\t\t<p>And castles, ere the genial warmth be felt</p>\n\t\t<p>On Chiarentana&rsquo;s top; such were the mounds,</p>\n\t\t<p>So fram&rsquo;d, though not in height or bulk to these</p>\n\t\t<p>Made equal, by the master, whosoe&rsquo;er</p>\n\t\t<p>He was, that rais&rsquo;d them here. We from the wood</p>\n\t\t<p>Were not so far remov&rsquo;d, that turning round</p>\n\t\t<p>I might not have discern&rsquo;d it, when we met</p>\n\t\t<p>A troop of spirits, who came beside the pier.</p>\n\t\t<p class="slindent">They each one ey&rsquo;d us, as at eventide</p>\n\t\t<p>One eyes another under a new moon,</p>\n\t\t<p>And toward us sharpen&rsquo;d their sight as keen,</p>\n\t\t<p>As an old tailor at his needle&rsquo;s eye.</p>\n\t\t<p class="slindent">Thus narrowly explor&rsquo;d by all the tribe,</p>\n\t\t<p>I was agniz&rsquo;d of one, who by the skirt</p>\n\t\t<p>Caught me, and cried, &ldquo;What wonder have we here!&rdquo;</p>\n\t\t<p class="slindent">And I, when he to me outstretch&rsquo;d his arm,</p>\n\t\t<p>Intently fix&rsquo;d my ken on his parch&rsquo;d looks,</p>\n\t\t<p>That although smirch&rsquo;d with fire, they hinder&rsquo;d not</p>\n\t\t<p>But I remember&rsquo;d him; and towards his face</p>\n\t\t<p>My hand inclining, answer&rsquo;d: &ldquo;Sir! Brunetto!</p>\n\t\t<p>&ldquo;And art thou here?&rdquo; He thus to me: &ldquo;My son!</p>\n\t\t<p>Oh let it not displease thee, if Brunetto</p>\n\t\t<p>Latini but a little space with thee</p>\n\t\t<p>Turn back, and leave his fellows to proceed.&rdquo;</p>\n\t\t<p class="slindent">I thus to him replied: &ldquo;Much as I can,</p>\n\t\t<p>I thereto pray thee; and if thou be willing,</p>\n\t\t<p>That I here seat me with thee, I consent;</p>\n\t\t<p>His leave, with whom I journey, first obtain&rsquo;d.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;O son!&rdquo; said he, &ldquo;whoever of this throng</p>\n\t\t<p>One instant stops, lies then a hundred years,</p>\n\t\t<p>No fan to ventilate him, when the fire</p>\n\t\t<p>Smites sorest. Pass thou therefore on. I close</p>\n\t\t<p>Will at thy garments walk, and then rejoin</p>\n\t\t<p>My troop, who go mourning their endless doom.&rdquo;</p>\n\t\t<p class="slindent">I dar&rsquo;d not from the path descend to tread</p>\n\t\t<p>On equal ground with him, but held my head</p>\n\t\t<p>Bent down, as one who walks in reverent guise.</p>\n\t\t<p class="slindent">&ldquo;What chance or destiny,&rdquo; thus he began,</p>\n\t\t<p>&ldquo;Ere the last day conducts thee here below?</p>\n\t\t<p>And who is this, that shows to thee the way?&rdquo;</p>\n\t\t<p class="slindent">&ldquo;There up aloft,&rdquo; I answer&rsquo;d, &ldquo;in the life</p>\n\t\t<p>Serene, I wander&rsquo;d in a valley lost,</p>\n\t\t<p>Before mine age had to its fullness reach&rsquo;d.</p>\n\t\t<p>But yester-morn I left it: then once more</p>\n\t\t<p>Into that vale returning, him I met;</p>\n\t\t<p>And by this path homeward he leads me back.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;If thou,&rdquo; he answer&rsquo;d, &ldquo;follow but thy star,</p>\n\t\t<p>Thou canst not miss at last a glorious haven:</p>\n\t\t<p>Unless in fairer days my judgment err&rsquo;d.</p>\n\t\t<p>And if my fate so early had not chanc&rsquo;d,</p>\n\t\t<p>Seeing the heav&rsquo;ns thus bounteous to thee, I</p>\n\t\t<p>Had gladly giv&rsquo;n thee comfort in thy work.</p>\n\t\t<p>But that ungrateful and malignant race,</p>\n\t\t<p>Who in old times came down from Fesole,</p>\n\t\t<p>Ay and still smack of their rough mountain-flint,</p>\n\t\t<p>Will for thy good deeds shew thee enmity.</p>\n\t\t<p>Nor wonder; for amongst ill-savour&rsquo;d crabs</p>\n\t\t<p>It suits not the sweet fig-tree lay her fruit.</p>\n\t\t<p>Old fame reports them in the world for blind,</p>\n\t\t<p>Covetous, envious, proud. Look to it well:</p>\n\t\t<p>Take heed thou cleanse thee of their ways. For thee</p>\n\t\t<p>Thy fortune hath such honour in reserve,</p>\n\t\t<p>That thou by either party shalt be crav&rsquo;d</p>\n\t\t<p>With hunger keen: but be the fresh herb far</p>\n\t\t<p>From the goat&rsquo;s tooth. The herd of Fesole</p>\n\t\t<p>May of themselves make litter, not touch the plant,</p>\n\t\t<p>If any such yet spring on their rank bed,</p>\n\t\t<p>In which the holy seed revives, transmitted</p>\n\t\t<p>From those true Romans, who still there remain&rsquo;d,</p>\n\t\t<p>When it was made the nest of so much ill.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;Were all my wish fulfill&rsquo;d,&rdquo; I straight replied,</p>\n\t\t<p>&ldquo;Thou from the confines of man&rsquo;s nature yet</p>\n\t\t<p>Hadst not been driven forth; for in my mind</p>\n\t\t<p>Is fix&rsquo;d, and now strikes full upon my heart</p>\n\t\t<p>The dear, benign, paternal image, such</p>\n\t\t<p>As thine was, when so lately thou didst teach me</p>\n\t\t<p>The way for man to win eternity;</p>\n\t\t<p>And how I priz&rsquo;d the lesson, it behooves,</p>\n\t\t<p>That, long as life endures, my tongue should speak,</p>\n\t\t<p>What of my fate thou tell&rsquo;st, that write I down:</p>\n\t\t<p>And with another text to comment on</p>\n\t\t<p>For her I keep it, the celestial dame,</p>\n\t\t<p>Who will know all, if I to her arrive.</p>\n\t\t<p>This only would I have thee clearly note:</p>\n\t\t<p>That so my conscience have no plea against me;</p>\n\t\t<p>Do fortune as she list, I stand prepar&rsquo;d.</p>\n\t\t<p>Not new or strange such earnest to mine ear.</p>\n\t\t<p>Speed fortune then her wheel, as likes her best,</p>\n\t\t<p>The clown his mattock; all things have their course.&rdquo;</p>\n\t\t<p class="slindent">Thereat my sapient guide upon his right</p>\n\t\t<p>Turn&rsquo;d himself back, then look&rsquo;d at me and spake:</p>\n\t\t<p>&ldquo;He listens to good purpose who takes note.&rdquo;</p>\n\t\t<p class="slindent">I not the less still on my way proceed,</p>\n\t\t<p>Discoursing with Brunetto, and inquire</p>\n\t\t<p>Who are most known and chief among his tribe.</p>\n\t\t<p class="slindent">&ldquo;To know of some is well;&rdquo; thus he replied,</p>\n\t\t<p>&ldquo;But of the rest silence may best beseem.</p>\n\t\t<p>Time would not serve us for report so long.</p>\n\t\t<p>In brief I tell thee, that all these were clerks,</p>\n\t\t<p>Men of great learning and no less renown,</p>\n\t\t<p>By one same sin polluted in the world.</p>\n\t\t<p>With them is Priscian, and Accorso&rsquo;s son</p>\n\t\t<p>Francesco herds among that wretched throng:</p>\n\t\t<p>And, if the wish of so impure a blotch</p>\n\t\t<p>Possess&rsquo;d thee, him thou also might&rsquo;st have seen,</p>\n\t\t<p>Who by the servants&rsquo; servant was transferr&rsquo;d</p>\n\t\t<p>From Arno&rsquo;s seat to Bacchiglione, where</p>\n\t\t<p>His ill-strain&rsquo;d nerves he left. I more would add,</p>\n\t\t<p>But must from farther speech and onward way</p>\n\t\t<p>Alike desist, for yonder I behold</p>\n\t\t<p>A mist new-risen on the sandy plain.</p>\n\t\t<p>A company, with whom I may not sort,</p>\n\t\t<p>Approaches. I commend my TREASURE to thee,</p>\n\t\t<p>Wherein I yet survive; my sole request.&rdquo;</p>\n\t\t<p class="slindent">This said he turn&rsquo;d, and seem&rsquo;d as one of those,</p>\n\t\t<p>Who o&rsquo;er Verona&rsquo;s champain try their speed</p>\n\t\t<p>For the green mantle, and of them he seem&rsquo;d,</p>\n\t\t<p>Not he who loses but who gains the prize.</p>\n\t\t</div>','<p class="cantohead">Canto XVI</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">Now</span> came I where the water&rsquo;s din was heard,</p>\n\t\t<p>As down it fell into the other round,</p>\n\t\t<p>Resounding like the hum of swarming bees:</p>\n\t\t<p>When forth together issu&rsquo;d from a troop,</p>\n\t\t<p>That pass&rsquo;d beneath the fierce tormenting storm,</p>\n\t\t<p>Three spirits, running swift. They towards us came,</p>\n\t\t<p>And each one cried aloud, &ldquo;Oh do thou stay!</p>\n\t\t<p>Whom by the fashion of thy garb we deem</p>\n\t\t<p>To be some inmate of our evil land.&rdquo;</p>\n\t\t<p class="slindent">Ah me! what wounds I mark&rsquo;d upon their limbs,</p>\n\t\t<p>Recent and old, inflicted by the flames!</p>\n\t\t<p>E&rsquo;en the remembrance of them grieves me yet.</p>\n\t\t<p class="slindent">Attentive to their cry my teacher paus&rsquo;d,</p>\n\t\t<p>And turn&rsquo;d to me his visage, and then spake;</p>\n\t\t<p>&ldquo;Wait now! our courtesy these merit well:</p>\n\t\t<p>And were &rsquo;t not for the nature of the place,</p>\n\t\t<p>Whence glide the fiery darts, I should have said,</p>\n\t\t<p>That haste had better suited thee than them.&rdquo;</p>\n\t\t<p class="slindent">They, when we stopp&rsquo;d, resum&rsquo;d their ancient wail,</p>\n\t\t<p>And soon as they had reach&rsquo;d us, all the three</p>\n\t\t<p>Whirl&rsquo;d round together in one restless wheel.</p>\n\t\t<p>As naked champions, smear&rsquo;d with slippery oil,</p>\n\t\t<p>Are wont intent to watch their place of hold</p>\n\t\t<p>And vantage, ere in closer strife they meet;</p>\n\t\t<p>Thus each one, as he wheel&rsquo;d, his countenance</p>\n\t\t<p>At me directed, so that opposite</p>\n\t\t<p>The neck mov&rsquo;d ever to the twinkling feet.</p>\n\t\t<p class="slindent">&ldquo;If misery of this drear wilderness,&rdquo;</p>\n\t\t<p>Thus one began, &ldquo;added to our sad cheer</p>\n\t\t<p>And destitute, do call forth scorn on us</p>\n\t\t<p>And our entreaties, let our great renown</p>\n\t\t<p>Incline thee to inform us who thou art,</p>\n\t\t<p>That dost imprint with living feet unharm&rsquo;d</p>\n\t\t<p>The soil of Hell. He, in whose track thou see&rsquo;st</p>\n\t\t<p>My steps pursuing, naked though he be</p>\n\t\t<p>And reft of all, was of more high estate</p>\n\t\t<p>Than thou believest; grandchild of the chaste</p>\n\t\t<p>Gualdrada, him they Guidoguerra call&rsquo;d,</p>\n\t\t<p>Who in his lifetime many a noble act</p>\n\t\t<p>Achiev&rsquo;d, both by his wisdom and his sword.</p>\n\t\t<p>The other, next to me that beats the sand,</p>\n\t\t<p>Is Aldobrandi, name deserving well,</p>\n\t\t<p>In the&rsquo; upper world, of honour; and myself</p>\n\t\t<p>Who in this torment do partake with them,</p>\n\t\t<p>Am Rusticucci, whom, past doubt, my wife</p>\n\t\t<p>Of savage temper, more than aught beside</p>\n\t\t<p>Hath to this evil brought.&rdquo; If from the fire</p>\n\t\t<p>I had been shelter&rsquo;d, down amidst them straight</p>\n\t\t<p>I then had cast me, nor my guide, I deem,</p>\n\t\t<p>Would have restrain&rsquo;d my going; but that fear</p>\n\t\t<p>Of the dire burning vanquish&rsquo;d the desire,</p>\n\t\t<p>Which made me eager of their wish&rsquo;d embrace.</p>\n\t\t<p class="slindent">I then began: &ldquo;Not scorn, but grief much more,</p>\n\t\t<p>Such as long time alone can cure, your doom</p>\n\t\t<p>Fix&rsquo;d deep within me, soon as this my lord</p>\n\t\t<p>Spake words, whose tenour taught me to expect</p>\n\t\t<p>That such a race, as ye are, was at hand.</p>\n\t\t<p>I am a countryman of yours, who still</p>\n\t\t<p>Affectionate have utter&rsquo;d, and have heard</p>\n\t\t<p>Your deeds and names renown&rsquo;d. Leaving the gall</p>\n\t\t<p>For the sweet fruit I go, that a sure guide</p>\n\t\t<p>Hath promis&rsquo;d to me. But behooves, that far</p>\n\t\t<p>As to the centre first I downward tend.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;So may long space thy spirit guide thy limbs,&rdquo;</p>\n\t\t<p>He answer straight return&rsquo;d; &ldquo;and so thy fame</p>\n\t\t<p>Shine bright, when thou art gone; as thou shalt tell,</p>\n\t\t<p>If courtesy and valour, as they wont,</p>\n\t\t<p>Dwell in our city, or have vanish&rsquo;d clean?</p>\n\t\t<p>For one amidst us late condemn&rsquo;d to wail,</p>\n\t\t<p>Borsiere, yonder walking with his peers,</p>\n\t\t<p>Grieves us no little by the news he brings.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;An upstart multitude and sudden gains,</p>\n\t\t<p>Pride and excess, O Florence! have in thee</p>\n\t\t<p>Engender&rsquo;d, so that now in tears thou mourn&rsquo;st!&rdquo;</p>\n\t\t<p>Thus cried I with my face uprais&rsquo;d, and they</p>\n\t\t<p>All three, who for an answer took my words,</p>\n\t\t<p>Look&rsquo;d at each other, as men look when truth</p>\n\t\t<p>Comes to their ear. &ldquo;If thou at other times,&rdquo;</p>\n\t\t<p>They all at once rejoin&rsquo;d, &ldquo;so easily</p>\n\t\t<p>Satisfy those, who question, happy thou,</p>\n\t\t<p>Gifted with words, so apt to speak thy thought!</p>\n\t\t<p>Wherefore if thou escape this darksome clime,</p>\n\t\t<p>Returning to behold the radiant stars,</p>\n\t\t<p>When thou with pleasure shalt retrace the past,</p>\n\t\t<p>See that of us thou speak among mankind.&rdquo;</p>\n\t\t<p class="slindent">This said, they broke the circle, and so swift</p>\n\t\t<p>Fled, that as pinions seem&rsquo;d their nimble feet.</p>\n\t\t<p class="slindent">Not in so short a time might one have said</p>\n\t\t<p>&ldquo;Amen,&rdquo; as they had vanish&rsquo;d. Straight my guide</p>\n\t\t<p>Pursu&rsquo;d his track. I follow&rsquo;d; and small space</p>\n\t\t<p>Had we pass&rsquo;d onward, when the water&rsquo;s sound</p>\n\t\t<p>Was now so near at hand, that we had scarce</p>\n\t\t<p>Heard one another&rsquo;s speech for the loud din.</p>\n\t\t<p class="slindent">E&rsquo;en as the river, that holds on its course</p>\n\t\t<p>Unmingled, from the mount of Vesulo,</p>\n\t\t<p>On the left side of Apennine, toward</p>\n\t\t<p>The east, which Acquacheta higher up</p>\n\t\t<p>They call, ere it descend into the vale,</p>\n\t\t<p>At Forli by that name no longer known,</p>\n\t\t<p>Rebellows o&rsquo;er Saint Benedict, roll&rsquo;d on</p>\n\t\t<p>From the&rsquo; Alpine summit down a precipice,</p>\n\t\t<p>Where space enough to lodge a thousand spreads;</p>\n\t\t<p>Thus downward from a craggy steep we found,</p>\n\t\t<p>That this dark wave resounded, roaring loud,</p>\n\t\t<p>So that the ear its clamour soon had stunn&rsquo;d.</p>\n\t\t<p class="slindent">I had a cord that brac&rsquo;d my girdle round,</p>\n\t\t<p>Wherewith I erst had thought fast bound to take</p>\n\t\t<p>The painted leopard. This when I had all</p>\n\t\t<p>Unloosen&rsquo;d from me (so my master bade)</p>\n\t\t<p>I gather&rsquo;d up, and stretch&rsquo;d it forth to him.</p>\n\t\t<p>Then to the right he turn&rsquo;d, and from the brink</p>\n\t\t<p>Standing few paces distant, cast it down</p>\n\t\t<p>Into the deep abyss. &ldquo;And somewhat strange,&rdquo;</p>\n\t\t<p>Thus to myself I spake, &ldquo;signal so strange</p>\n\t\t<p>Betokens, which my guide with earnest eye</p>\n\t\t<p>Thus follows.&rdquo; Ah! what caution must men use</p>\n\t\t<p>With those who look not at the deed alone,</p>\n\t\t<p>But spy into the thoughts with subtle skill!</p>\n\t\t<p class="slindent">&ldquo;Quickly shall come,&rdquo; he said, &ldquo;what I expect,</p>\n\t\t<p>Thine eye discover quickly, that whereof</p>\n\t\t<p>Thy thought is dreaming.&rdquo; Ever to that truth,</p>\n\t\t<p>Which but the semblance of a falsehood wears,</p>\n\t\t<p>A man, if possible, should bar his lip;</p>\n\t\t<p>Since, although blameless, he incurs reproach.</p>\n\t\t<p>But silence here were vain; and by these notes</p>\n\t\t<p>Which now I sing, reader! I swear to thee,</p>\n\t\t<p>So may they favour find to latest times!</p>\n\t\t<p>That through the gross and murky air I spied</p>\n\t\t<p>A shape come swimming up, that might have quell&rsquo;d</p>\n\t\t<p>The stoutest heart with wonder, in such guise</p>\n\t\t<p>As one returns, who hath been down to loose</p>\n\t\t<p>An anchor grappled fast against some rock,</p>\n\t\t<p>Or to aught else that in the salt wave lies,</p>\n\t\t<p>Who upward springing close draws in his feet.</p>\n\t\t</div>','<p class="cantohead">Canto XVII</p>\n\t\t<div class="stanza">\n\t\t<p>&ldquo;<span class="sc">Lo</span>! the fell monster with the deadly sting!</p>\n\t\t<p>Who passes mountains, breaks through fenced walls</p>\n\t\t<p>And firm embattled spears, and with his filth</p>\n\t\t<p>Taints all the world!&rdquo; Thus me my guide address&rsquo;d,</p>\n\t\t<p>And beckon&rsquo;d him, that he should come to shore,</p>\n\t\t<p>Near to the stony causeway&rsquo;s utmost edge.</p>\n\t\t<p class="slindent">Forthwith that image vile of fraud appear&rsquo;d,</p>\n\t\t<p>His head and upper part expos&rsquo;d on land,</p>\n\t\t<p>But laid not on the shore his bestial train.</p>\n\t\t<p>His face the semblance of a just man&rsquo;s wore,</p>\n\t\t<p>So kind and gracious was its outward cheer;</p>\n\t\t<p>The rest was serpent all: two shaggy claws</p>\n\t\t<p>Reach&rsquo;d to the armpits, and the back and breast,</p>\n\t\t<p>And either side, were painted o&rsquo;er with nodes</p>\n\t\t<p>And orbits. Colours variegated more</p>\n\t\t<p>Nor Turks nor Tartars e&rsquo;er on cloth of state</p>\n\t\t<p>With interchangeable embroidery wove,</p>\n\t\t<p>Nor spread Arachne o&rsquo;er her curious loom.</p>\n\t\t<p>As ofttimes a light skiff, moor&rsquo;d to the shore,</p>\n\t\t<p>Stands part in water, part upon the land;</p>\n\t\t<p>Or, as where dwells the greedy German boor,</p>\n\t\t<p>The beaver settles watching for his prey;</p>\n\t\t<p>So on the rim, that fenc&rsquo;d the sand with rock,</p>\n\t\t<p>Sat perch&rsquo;d the fiend of evil. In the void</p>\n\t\t<p>Glancing, his tail upturn&rsquo;d its venomous fork,</p>\n\t\t<p>With sting like scorpion&rsquo;s arm&rsquo;d. Then thus my guide:</p>\n\t\t<p>&ldquo;Now need our way must turn few steps apart,</p>\n\t\t<p>Far as to that ill beast, who couches there.&rdquo;</p>\n\t\t<p class="slindent">Thereat toward the right our downward course</p>\n\t\t<p>We shap&rsquo;d, and, better to escape the flame</p>\n\t\t<p>And burning marle, ten paces on the verge</p>\n\t\t<p>Proceeded. Soon as we to him arrive,</p>\n\t\t<p>A little further on mine eye beholds</p>\n\t\t<p>A tribe of spirits, seated on the sand</p>\n\t\t<p>Near the wide chasm. Forthwith my master spake:</p>\n\t\t<p>&ldquo;That to the full thy knowledge may extend</p>\n\t\t<p>Of all this round contains, go now, and mark</p>\n\t\t<p>The mien these wear: but hold not long discourse.</p>\n\t\t<p>Till thou returnest, I with him meantime</p>\n\t\t<p>Will parley, that to us he may vouchsafe</p>\n\t\t<p>The aid of his strong shoulders.&rdquo; Thus alone</p>\n\t\t<p>Yet forward on the&rsquo; extremity I pac&rsquo;d</p>\n\t\t<p>Of that seventh circle, where the mournful tribe</p>\n\t\t<p>Were seated. At the eyes forth gush&rsquo;d their pangs.</p>\n\t\t<p>Against the vapours and the torrid soil</p>\n\t\t<p>Alternately their shifting hands they plied.</p>\n\t\t<p>Thus use the dogs in summer still to ply</p>\n\t\t<p>Their jaws and feet by turns, when bitten sore</p>\n\t\t<p>By gnats, or flies, or gadflies swarming round.</p>\n\t\t<p class="slindent">Noting the visages of some, who lay</p>\n\t\t<p>Beneath the pelting of that dolorous fire,</p>\n\t\t<p>One of them all I knew not; but perceiv&rsquo;d,</p>\n\t\t<p>That pendent from his neck each bore a pouch</p>\n\t\t<p>With colours and with emblems various mark&rsquo;d,</p>\n\t\t<p>On which it seem&rsquo;d as if their eye did feed.</p>\n\t\t<p class="slindent">And when amongst them looking round I came,</p>\n\t\t<p>A yellow purse I saw with azure wrought,</p>\n\t\t<p>That wore a lion&rsquo;s countenance and port.</p>\n\t\t<p>Then still my sight pursuing its career,</p>\n\t\t<p>Another I beheld, than blood more red.</p>\n\t\t<p>A goose display of whiter wing than curd.</p>\n\t\t<p>And one, who bore a fat and azure swine</p>\n\t\t<p>Pictur&rsquo;d on his white scrip, addressed me thus:</p>\n\t\t<p>&ldquo;What dost thou in this deep? Go now and know,</p>\n\t\t<p>Since yet thou livest, that my neighbour here</p>\n\t\t<p>Vitaliano on my left shall sit.</p>\n\t\t<p>A Paduan with these Florentines am I.</p>\n\t\t<p>Ofttimes they thunder in mine ears, exclaiming</p>\n\t\t<p>&rsquo;O haste that noble knight! he who the pouch</p>\n\t\t<p>With the three beaks will bring!&rsquo;&nbsp;&rdquo; This said, he writh&rsquo;d</p>\n\t\t<p>The mouth, and loll&rsquo;d the tongue out, like an ox</p>\n\t\t<p>That licks his nostrils. I, lest longer stay</p>\n\t\t<p>He ill might brook, who bade me stay not long,</p>\n\t\t<p>Backward my steps from those sad spirits turn&rsquo;d.</p>\n\t\t<p class="slindent">My guide already seated on the haunch</p>\n\t\t<p>Of the fierce animal I found; and thus</p>\n\t\t<p>He me encourag&rsquo;d. &ldquo;Be thou stout; be bold.</p>\n\t\t<p>Down such a steep flight must we now descend!</p>\n\t\t<p>Mount thou before: for that no power the tail</p>\n\t\t<p>May have to harm thee, I will be i&rsquo; th&rsquo; midst.&rdquo;</p>\n\t\t<p class="slindent">As one, who hath an ague fit so near,</p>\n\t\t<p>His nails already are turn&rsquo;d blue, and he</p>\n\t\t<p>Quivers all o&rsquo;er, if he but eye the shade;</p>\n\t\t<p>Such was my cheer at hearing of his words.</p>\n\t\t<p>But shame soon interpos&rsquo;d her threat, who makes</p>\n\t\t<p>The servant bold in presence of his lord.</p>\n\t\t<p class="slindent">I settled me upon those shoulders huge,</p>\n\t\t<p>And would have said, but that the words to aid</p>\n\t\t<p>My purpose came not, &ldquo;Look thou clasp me firm!&rdquo;</p>\n\t\t<p class="slindent">But he whose succour then not first I prov&rsquo;d,</p>\n\t\t<p>Soon as I mounted, in his arms aloft,</p>\n\t\t<p>Embracing, held me up, and thus he spake:</p>\n\t\t<p>&ldquo;Geryon! now move thee! be thy wheeling gyres</p>\n\t\t<p>Of ample circuit, easy thy descent.</p>\n\t\t<p>Think on th&rsquo; unusual burden thou sustain&rsquo;st.&rdquo;</p>\n\t\t<p class="slindent">As a small vessel, back&rsquo;ning out from land,</p>\n\t\t<p>Her station quits; so thence the monster loos&rsquo;d,</p>\n\t\t<p>And when he felt himself at large, turn&rsquo;d round</p>\n\t\t<p>There where the breast had been, his forked tail.</p>\n\t\t<p>Thus, like an eel, outstretch&rsquo;d at length he steer&rsquo;d,</p>\n\t\t<p>Gath&rsquo;ring the air up with retractile claws.</p>\n\t\t<p class="slindent">Not greater was the dread when Phaeton</p>\n\t\t<p>The reins let drop at random, whence high heaven,</p>\n\t\t<p>Whereof signs yet appear, was wrapt in flames;</p>\n\t\t<p>Nor when ill-fated Icarus perceiv&rsquo;d,</p>\n\t\t<p>By liquefaction of the scalded wax,</p>\n\t\t<p>The trusted pennons loosen&rsquo;d from his loins,</p>\n\t\t<p>His sire exclaiming loud, &ldquo;Ill way thou keep&rsquo;st!&rdquo;</p>\n\t\t<p>Than was my dread, when round me on each part</p>\n\t\t<p>The air I view&rsquo;d, and other object none</p>\n\t\t<p>Save the fell beast. He slowly sailing, wheels</p>\n\t\t<p>His downward motion, unobserv&rsquo;d of me,</p>\n\t\t<p>But that the wind, arising to my face,</p>\n\t\t<p>Breathes on me from below. Now on our right</p>\n\t\t<p>I heard the cataract beneath us leap</p>\n\t\t<p>With hideous crash; whence bending down to&rsquo; explore,</p>\n\t\t<p>New terror I conceiv&rsquo;d at the steep plunge:</p>\n\t\t<p>For flames I saw, and wailings smote mine ear:</p>\n\t\t<p>So that all trembling close I crouch&rsquo;d my limbs,</p>\n\t\t<p>And then distinguish&rsquo;d, unperceiv&rsquo;d before,</p>\n\t\t<p>By the dread torments that on every side</p>\n\t\t<p>Drew nearer, how our downward course we wound.</p>\n\t\t<p class="slindent">As falcon, that hath long been on the wing,</p>\n\t\t<p>But lure nor bird hath seen, while in despair</p>\n\t\t<p>The falconer cries, &ldquo;Ah me! thou stoop&rsquo;st to earth!&rdquo;</p>\n\t\t<p>Wearied descends, and swiftly down the sky</p>\n\t\t<p>In many an orbit wheels, then lighting sits</p>\n\t\t<p>At distance from his lord in angry mood;</p>\n\t\t<p>So Geryon lighting places us on foot</p>\n\t\t<p>Low down at base of the deep-furrow&rsquo;d rock,</p>\n\t\t<p>And, of his burden there discharg&rsquo;d, forthwith</p>\n\t\t<p>Sprang forward, like an arrow from the string.</p>\n\t\t</div>','<p class="cantohead">Canto XVIII</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">There</span> is a place within the depths of hell</p>\n\t\t<p>Call&rsquo;d Malebolge, all of rock dark-stain&rsquo;d</p>\n\t\t<p>With hue ferruginous, e&rsquo;en as the steep</p>\n\t\t<p>That round it circling winds. Right in the midst</p>\n\t\t<p>Of that abominable region, yawns</p>\n\t\t<p>A spacious gulf profound, whereof the frame</p>\n\t\t<p>Due time shall tell. The circle, that remains,</p>\n\t\t<p>Throughout its round, between the gulf and base</p>\n\t\t<p>Of the high craggy banks, successive forms</p>\n\t\t<p>Ten trenches, in its hollow bottom sunk.</p>\n\t\t<p class="slindent">As where to guard the walls, full many a foss</p>\n\t\t<p>Begirds some stately castle, sure defence</p>\n\t\t<p>Affording to the space within, so here</p>\n\t\t<p>Were model&rsquo;d these; and as like fortresses</p>\n\t\t<p>E&rsquo;en from their threshold to the brink without,</p>\n\t\t<p>Are flank&rsquo;d with bridges; from the rock&rsquo;s low base</p>\n\t\t<p>Thus flinty paths advanc&rsquo;d, that &rsquo;cross the moles</p>\n\t\t<p>And dikes, struck onward far as to the gulf,</p>\n\t\t<p>That in one bound collected cuts them off.</p>\n\t\t<p>Such was the place, wherein we found ourselves</p>\n\t\t<p>From Geryon&rsquo;s back dislodg&rsquo;d. The bard to left</p>\n\t\t<p>Held on his way, and I behind him mov&rsquo;d.</p>\n\t\t<p class="slindent">On our right hand new misery I saw,</p>\n\t\t<p>New pains, new executioners of wrath,</p>\n\t\t<p>That swarming peopled the first chasm. Below</p>\n\t\t<p>Were naked sinners. Hitherward they came,</p>\n\t\t<p>Meeting our faces from the middle point,</p>\n\t\t<p>With us beyond but with a larger stride.</p>\n\t\t<p>E&rsquo;en thus the Romans, when the year returns</p>\n\t\t<p>Of Jubilee, with better speed to rid</p>\n\t\t<p>The thronging multitudes, their means devise</p>\n\t\t<p>For such as pass the bridge; that on one side</p>\n\t\t<p>All front toward the castle, and approach</p>\n\t\t<p>Saint Peter&rsquo;s fane, on th&rsquo; other towards the mount.</p>\n\t\t<p class="slindent">Each divers way along the grisly rock,</p>\n\t\t<p>Horn&rsquo;d demons I beheld, with lashes huge,</p>\n\t\t<p>That on their back unmercifully smote.</p>\n\t\t<p>Ah! how they made them bound at the first stripe!</p>\n\t\t<p>None for the second waited nor the third.</p>\n\t\t<p class="slindent">Meantime as on I pass&rsquo;d, one met my sight</p>\n\t\t<p>Whom soon as view&rsquo;d; &ldquo;Of him,&rdquo; cried I, &ldquo;not yet</p>\n\t\t<p>Mine eye hath had his fill.&rdquo; With fixed gaze</p>\n\t\t<p>I therefore scann&rsquo;d him. Straight the teacher kind</p>\n\t\t<p>Paus&rsquo;d with me, and consented I should walk</p>\n\t\t<p>Backward a space, and the tormented spirit,</p>\n\t\t<p>Who thought to hide him, bent his visage down.</p>\n\t\t<p>But it avail&rsquo;d him nought; for I exclaim&rsquo;d:</p>\n\t\t<p>&ldquo;Thou who dost cast thy eye upon the ground,</p>\n\t\t<p>Unless thy features do belie thee much,</p>\n\t\t<p>Venedico art thou. But what brings thee</p>\n\t\t<p>Into this bitter seas&rsquo;ning?&rdquo; He replied:</p>\n\t\t<p>&ldquo;Unwillingly I answer to thy words.</p>\n\t\t<p>But thy clear speech, that to my mind recalls</p>\n\t\t<p>The world I once inhabited, constrains me.</p>\n\t\t<p>Know then &rsquo;twas I who led fair Ghisola</p>\n\t\t<p>To do the Marquis&rsquo; will, however fame</p>\n\t\t<p>The shameful tale have bruited. Nor alone</p>\n\t\t<p>Bologna hither sendeth me to mourn</p>\n\t\t<p>Rather with us the place is so o&rsquo;erthrong&rsquo;d</p>\n\t\t<p>That not so many tongues this day are taught,</p>\n\t\t<p>Betwixt the Reno and Savena&rsquo;s stream,</p>\n\t\t<p>To answer SIPA in their country&rsquo;s phrase.</p>\n\t\t<p>And if of that securer proof thou need,</p>\n\t\t<p>Remember but our craving thirst for gold.&rdquo;</p>\n\t\t<p class="slindent">Him speaking thus, a demon with his thong</p>\n\t\t<p>Struck, and exclaim&rsquo;d, &ldquo;Away! corrupter! here</p>\n\t\t<p>Women are none for sale.&rdquo; Forthwith I join&rsquo;d</p>\n\t\t<p>My escort, and few paces thence we came</p>\n\t\t<p>To where a rock forth issued from the bank.</p>\n\t\t<p>That easily ascended, to the right</p>\n\t\t<p>Upon its splinter turning, we depart</p>\n\t\t<p>From those eternal barriers. When arriv&rsquo;d,</p>\n\t\t<p>Where underneath the gaping arch lets pass</p>\n\t\t<p>The scourged souls: &ldquo;Pause here,&rdquo; the teacher said,</p>\n\t\t<p>&ldquo;And let these others miserable, now</p>\n\t\t<p>Strike on thy ken, faces not yet beheld,</p>\n\t\t<p>For that together they with us have walk&rsquo;d.&rdquo;</p>\n\t\t<p class="slindent">From the old bridge we ey&rsquo;d the pack, who came</p>\n\t\t<p>From th&rsquo; other side towards us, like the rest,</p>\n\t\t<p>Excoriate from the lash. My gentle guide,</p>\n\t\t<p>By me unquestion&rsquo;d, thus his speech resum&rsquo;d:</p>\n\t\t<p>&ldquo;Behold that lofty shade, who this way tends,</p>\n\t\t<p>And seems too woe-begone to drop a tear.</p>\n\t\t<p>How yet the regal aspect he retains!</p>\n\t\t<p>Jason is he, whose skill and prowess won</p>\n\t\t<p>The ram from Colchos. To the Lemnian isle</p>\n\t\t<p>His passage thither led him, when those bold</p>\n\t\t<p>And pitiless women had slain all their males.</p>\n\t\t<p>There he with tokens and fair witching words</p>\n\t\t<p>Hypsipyle beguil&rsquo;d, a virgin young,</p>\n\t\t<p>Who first had all the rest herself beguil&rsquo;d.</p>\n\t\t<p>Impregnated he left her there forlorn.</p>\n\t\t<p>Such is the guilt condemns him to this pain.</p>\n\t\t<p>Here too Medea&rsquo;s inj&rsquo;ries are avenged.</p>\n\t\t<p>All bear him company, who like deceit</p>\n\t\t<p>To his have practis&rsquo;d. And thus much to know</p>\n\t\t<p>Of the first vale suffice thee, and of those</p>\n\t\t<p>Whom its keen torments urge.&rdquo; Now had we come</p>\n\t\t<p>Where, crossing the next pier, the straighten&rsquo;d path</p>\n\t\t<p>Bestrides its shoulders to another arch.</p>\n\t\t<p class="slindent">Hence in the second chasm we heard the ghosts,</p>\n\t\t<p>Who jibber in low melancholy sounds,</p>\n\t\t<p>With wide-stretch&rsquo;d nostrils snort, and on themselves</p>\n\t\t<p>Smite with their palms. Upon the banks a scurf</p>\n\t\t<p>From the foul steam condens&rsquo;d, encrusting hung,</p>\n\t\t<p>That held sharp combat with the sight and smell.</p>\n\t\t<p class="slindent">So hollow is the depth, that from no part,</p>\n\t\t<p>Save on the summit of the rocky span,</p>\n\t\t<p>Could I distinguish aught. Thus far we came;</p>\n\t\t<p>And thence I saw, within the foss below,</p>\n\t\t<p>A crowd immers&rsquo;d in ordure, that appear&rsquo;d</p>\n\t\t<p>Draff of the human body. There beneath</p>\n\t\t<p>Searching with eye inquisitive, I mark&rsquo;d</p>\n\t\t<p>One with his head so grim&rsquo;d, &rsquo;t were hard to deem,</p>\n\t\t<p>If he were clerk or layman. Loud he cried:</p>\n\t\t<p>&ldquo;Why greedily thus bendest more on me,</p>\n\t\t<p>Than on these other filthy ones, thy ken?&rdquo;</p>\n\t\t<p class="slindent">&ldquo;Because if true my mem&rsquo;ry,&rdquo; I replied,</p>\n\t\t<p>&ldquo;I heretofore have seen thee with dry locks,</p>\n\t\t<p>And thou Alessio art of Lucca sprung.</p>\n\t\t<p>Therefore than all the rest I scan thee more.&rdquo;</p>\n\t\t<p class="slindent">Then beating on his brain these words he spake:</p>\n\t\t<p>&ldquo;Me thus low down my flatteries have sunk,</p>\n\t\t<p>Wherewith I ne&rsquo;er enough could glut my tongue.&rdquo;</p>\n\t\t<p class="slindent">My leader thus: &ldquo;A little further stretch</p>\n\t\t<p>Thy face, that thou the visage well mayst note</p>\n\t\t<p>Of that besotted, sluttish courtezan,</p>\n\t\t<p>Who there doth rend her with defiled nails,</p>\n\t\t<p>Now crouching down, now risen on her feet.</p>\n\t\t<p>&ldquo;Thais is this, the harlot, whose false lip</p>\n\t\t<p>Answer&rsquo;d her doting paramour that ask&rsquo;d,</p>\n\t\t<p>&lsquo;Thankest me much!&rsquo;&mdash;&lsquo;say rather wondrously,&rsquo;</p>\n\t\t<p>And seeing this here satiate be our view.&rdquo;</p>\n\t\t</div>','<p class="cantohead">Canto XIX</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">Woe</span> to thee, Simon Magus! woe to you,</p>\n\t\t<p>His wretched followers! who the things of God,</p>\n\t\t<p>Which should be wedded unto goodness, them,</p>\n\t\t<p>Rapacious as ye are, do prostitute</p>\n\t\t<p>For gold and silver in adultery!</p>\n\t\t<p>Now must the trumpet sound for you, since yours</p>\n\t\t<p>Is the third chasm. Upon the following vault</p>\n\t\t<p>We now had mounted, where the rock impends</p>\n\t\t<p>Directly o&rsquo;er the centre of the foss.</p>\n\t\t<p class="slindent">Wisdom Supreme! how wonderful the art,</p>\n\t\t<p>Which thou dost manifest in heaven, in earth,</p>\n\t\t<p>And in the evil world, how just a meed</p>\n\t\t<p>Allotting by thy virtue unto all!</p>\n\t\t<p class="slindent">I saw the livid stone, throughout the sides</p>\n\t\t<p>And in its bottom full of apertures,</p>\n\t\t<p>All equal in their width, and circular each,</p>\n\t\t<p>Nor ample less nor larger they appear&rsquo;d</p>\n\t\t<p>Than in Saint John&rsquo;s fair dome of me belov&rsquo;d</p>\n\t\t<p>Those fram&rsquo;d to hold the pure baptismal streams,</p>\n\t\t<p>One of the which I brake, some few years past,</p>\n\t\t<p>To save a whelming infant; and be this</p>\n\t\t<p>A seal to undeceive whoever doubts</p>\n\t\t<p>The motive of my deed. From out the mouth</p>\n\t\t<p>Of every one, emerg&rsquo;d a sinner&rsquo;s feet</p>\n\t\t<p>And of the legs high upward as the calf</p>\n\t\t<p>The rest beneath was hid. On either foot</p>\n\t\t<p>The soles were burning, whence the flexile joints</p>\n\t\t<p>Glanc&rsquo;d with such violent motion, as had snapt</p>\n\t\t<p>Asunder cords or twisted withs. As flame,</p>\n\t\t<p>Feeding on unctuous matter, glides along</p>\n\t\t<p>The surface, scarcely touching where it moves;</p>\n\t\t<p>So here, from heel to point, glided the flames.</p>\n\t\t<p class="slindent">&ldquo;Master! say who is he, than all the rest</p>\n\t\t<p>Glancing in fiercer agony, on whom</p>\n\t\t<p>A ruddier flame doth prey?&rdquo; I thus inquir&rsquo;d.</p>\n\t\t<p class="slindent">&ldquo;If thou be willing,&rdquo; he replied, &ldquo;that I</p>\n\t\t<p>Carry thee down, where least the slope bank falls,</p>\n\t\t<p>He of himself shall tell thee and his wrongs.&rdquo;</p>\n\t\t<p class="slindent">I then: &ldquo;As pleases thee to me is best.</p>\n\t\t<p>Thou art my lord; and know&rsquo;st that ne&rsquo;er I quit</p>\n\t\t<p>Thy will: what silence hides that knowest thou.&rdquo;</p>\n\t\t<p>Thereat on the fourth pier we came, we turn&rsquo;d,</p>\n\t\t<p>And on our left descended to the depth,</p>\n\t\t<p>A narrow strait and perforated close.</p>\n\t\t<p>Nor from his side my leader set me down,</p>\n\t\t<p>Till to his orifice he brought, whose limb</p>\n\t\t<p>Quiv&rsquo;ring express&rsquo;d his pang. &ldquo;Whoe&rsquo;er thou art,</p>\n\t\t<p>Sad spirit! thus revers&rsquo;d, and as a stake</p>\n\t\t<p>Driv&rsquo;n in the soil!&rdquo; I in these words began,</p>\n\t\t<p>&ldquo;If thou be able, utter forth thy voice.&rdquo;</p>\n\t\t<p class="slindent">There stood I like the friar, that doth shrive</p>\n\t\t<p>A wretch for murder doom&rsquo;d, who e&rsquo;en when fix&rsquo;d,</p>\n\t\t<p>Calleth him back, whence death awhile delays.</p>\n\t\t<p class="slindent">He shouted: &ldquo;Ha! already standest there?</p>\n\t\t<p>Already standest there, O Boniface!</p>\n\t\t<p>By many a year the writing play&rsquo;d me false.</p>\n\t\t<p>So early dost thou surfeit with the wealth,</p>\n\t\t<p>For which thou fearedst not in guile to take</p>\n\t\t<p>The lovely lady, and then mangle her?&rdquo;</p>\n\t\t<p class="slindent">I felt as those who, piercing not the drift</p>\n\t\t<p>Of answer made them, stand as if expos&rsquo;d</p>\n\t\t<p>In mockery, nor know what to reply,</p>\n\t\t<p>When Virgil thus admonish&rsquo;d: &ldquo;Tell him quick,</p>\n\t\t<p>I am not he, not he, whom thou believ&rsquo;st.&rdquo;</p>\n\t\t<p class="slindent">And I, as was enjoin&rsquo;d me, straight replied.</p>\n\t\t<p class="slindent">That heard, the spirit all did wrench his feet,</p>\n\t\t<p>And sighing next in woeful accent spake:</p>\n\t\t<p>&ldquo;What then of me requirest? If to know</p>\n\t\t<p>So much imports thee, who I am, that thou</p>\n\t\t<p>Hast therefore down the bank descended, learn</p>\n\t\t<p>That in the mighty mantle I was rob&rsquo;d,</p>\n\t\t<p>And of a she-bear was indeed the son,</p>\n\t\t<p>So eager to advance my whelps, that there</p>\n\t\t<p>My having in my purse above I stow&rsquo;d,</p>\n\t\t<p>And here myself. Under my head are dragg&rsquo;d</p>\n\t\t<p>The rest, my predecessors in the guilt</p>\n\t\t<p>Of simony. Stretch&rsquo;d at their length they lie</p>\n\t\t<p>Along an opening in the rock. &rsquo;Midst them</p>\n\t\t<p>I also low shall fall, soon as he comes,</p>\n\t\t<p>For whom I took thee, when so hastily</p>\n\t\t<p>I question&rsquo;d. But already longer time</p>\n\t\t<p>Hath pass&rsquo;d, since my souls kindled, and I thus</p>\n\t\t<p>Upturn&rsquo;d have stood, than is his doom to stand</p>\n\t\t<p>Planted with fiery feet. For after him,</p>\n\t\t<p>One yet of deeds more ugly shall arrive,</p>\n\t\t<p>From forth the west, a shepherd without law,</p>\n\t\t<p>Fated to cover both his form and mine.</p>\n\t\t<p>He a new Jason shall be call&rsquo;d, of whom</p>\n\t\t<p>In Maccabees we read; and favour such</p>\n\t\t<p>As to that priest his king indulgent show&rsquo;d,</p>\n\t\t<p>Shall be of France&rsquo;s monarch shown to him.&rdquo;</p>\n\t\t<p class="slindent">I know not if I here too far presum&rsquo;d,</p>\n\t\t<p>But in this strain I answer&rsquo;d: &ldquo;Tell me now,</p>\n\t\t<p>What treasures from St. Peter at the first</p>\n\t\t<p>Our Lord demanded, when he put the keys</p>\n\t\t<p>Into his charge? Surely he ask&rsquo;d no more</p>\n\t\t<p>But, Follow me! Nor Peter nor the rest</p>\n\t\t<p>Or gold or silver of Matthias took,</p>\n\t\t<p>When lots were cast upon the forfeit place</p>\n\t\t<p>Of the condemned soul. Abide thou then;</p>\n\t\t<p>Thy punishment of right is merited:</p>\n\t\t<p>And look thou well to that ill-gotten coin,</p>\n\t\t<p>Which against Charles thy hardihood inspir&rsquo;d.</p>\n\t\t<p>If reverence of the keys restrain&rsquo;d me not,</p>\n\t\t<p>Which thou in happier time didst hold, I yet</p>\n\t\t<p>Severer speech might use. Your avarice</p>\n\t\t<p>O&rsquo;ercasts the world with mourning, under foot</p>\n\t\t<p>Treading the good, and raising bad men up.</p>\n\t\t<p>Of shepherds, like to you, th&rsquo; Evangelist</p>\n\t\t<p>Was ware, when her, who sits upon the waves,</p>\n\t\t<p>With kings in filthy whoredom he beheld,</p>\n\t\t<p>She who with seven heads tower&rsquo;d at her birth,</p>\n\t\t<p>And from ten horns her proof of glory drew,</p>\n\t\t<p>Long as her spouse in virtue took delight.</p>\n\t\t<p>Of gold and silver ye have made your god,</p>\n\t\t<p>Diff&rsquo;ring wherein from the idolater,</p>\n\t\t<p>But he that worships one, a hundred ye?</p>\n\t\t<p>Ah, Constantine! to how much ill gave birth,</p>\n\t\t<p>Not thy conversion, but that plenteous dower,</p>\n\t\t<p>Which the first wealthy Father gain&rsquo;d from thee!&rdquo;</p>\n\t\t<p class="slindent">Meanwhile, as thus I sung, he, whether wrath</p>\n\t\t<p>Or conscience smote him, violent upsprang</p>\n\t\t<p>Spinning on either sole. I do believe</p>\n\t\t<p>My teacher well was pleas&rsquo;d, with so compos&rsquo;d</p>\n\t\t<p>A lip, he listen&rsquo;d ever to the sound</p>\n\t\t<p>Of the true words I utter&rsquo;d. In both arms</p>\n\t\t<p>He caught, and to his bosom lifting me</p>\n\t\t<p>Upward retrac&rsquo;d the way of his descent.</p>\n\t\t<p class="slindent">Nor weary of his weight he press&rsquo;d me close,</p>\n\t\t<p>Till to the summit of the rock we came,</p>\n\t\t<p>Our passage from the fourth to the fifth pier.</p>\n\t\t<p>His cherish&rsquo;d burden there gently he plac&rsquo;d</p>\n\t\t<p>Upon the rugged rock and steep, a path</p>\n\t\t<p>Not easy for the clamb&rsquo;ring goat to mount.</p>\n\t\t<p class="slindent">Thence to my view another vale appear&rsquo;d</p>\n\t\t</div>','<p class="cantohead">Canto XX</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">And</span> now the verse proceeds to torments new,</p>\n\t\t<p>Fit argument of this the twentieth strain</p>\n\t\t<p>Of the first song, whose awful theme records</p>\n\t\t<p>The spirits whelm&rsquo;d in woe. Earnest I look&rsquo;d</p>\n\t\t<p>Into the depth, that open&rsquo;d to my view,</p>\n\t\t<p>Moisten&rsquo;d with tears of anguish, and beheld</p>\n\t\t<p>A tribe, that came along the hollow vale,</p>\n\t\t<p>In silence weeping: such their step as walk</p>\n\t\t<p>Quires chanting solemn litanies on earth.</p>\n\t\t<p class="slindent">As on them more direct mine eye descends,</p>\n\t\t<p>Each wondrously seem&rsquo;d to be revers&rsquo;d</p>\n\t\t<p>At the neck-bone, so that the countenance</p>\n\t\t<p>Was from the reins averted: and because</p>\n\t\t<p>None might before him look, they were compell&rsquo;d</p>\n\t\t<p>To&rsquo; advance with backward gait. Thus one perhaps</p>\n\t\t<p>Hath been by force of palsy clean transpos&rsquo;d,</p>\n\t\t<p>But I ne&rsquo;er saw it nor believe it so.</p>\n\t\t<p class="slindent">Now, reader! think within thyself, so God</p>\n\t\t<p>Fruit of thy reading give thee! how I long</p>\n\t\t<p>Could keep my visage dry, when I beheld</p>\n\t\t<p>Near me our form distorted in such guise,</p>\n\t\t<p>That on the hinder parts fall&rsquo;n from the face</p>\n\t\t<p>The tears down-streaming roll&rsquo;d. Against a rock</p>\n\t\t<p>I leant and wept, so that my guide exclaim&rsquo;d:</p>\n\t\t<p>&ldquo;What, and art thou too witless as the rest?</p>\n\t\t<p>Here pity most doth show herself alive,</p>\n\t\t<p>When she is dead. What guilt exceedeth his,</p>\n\t\t<p>Who with Heaven&rsquo;s judgment in his passion strives?</p>\n\t\t<p>Raise up thy head, raise up, and see the man,</p>\n\t\t<p>Before whose eyes earth gap&rsquo;d in Thebes, when all</p>\n\t\t<p>Cried out, &lsquo;Amphiaraus, whither rushest?</p>\n\t\t<p>&lsquo;Why leavest thou the war?&rsquo; He not the less</p>\n\t\t<p>Fell ruining far as to Minos down,</p>\n\t\t<p>Whose grapple none eludes. Lo! how he makes</p>\n\t\t<p>The breast his shoulders, and who once too far</p>\n\t\t<p>Before him wish&rsquo;d to see, now backward looks,</p>\n\t\t<p>And treads reverse his path. Tiresias note,</p>\n\t\t<p>Who semblance chang&rsquo;d, when woman he became</p>\n\t\t<p>Of male, through every limb transform&rsquo;d, and then</p>\n\t\t<p>Once more behov&rsquo;d him with his rod to strike</p>\n\t\t<p>The two entwining serpents, ere the plumes,</p>\n\t\t<p>That mark&rsquo;d the better sex, might shoot again.</p>\n\t\t<p class="slindent">&ldquo;Aruns, with more his belly facing, comes.</p>\n\t\t<p>On Luni&rsquo;s mountains &rsquo;midst the marbles white,</p>\n\t\t<p>Where delves Carrara&rsquo;s hind, who wons beneath,</p>\n\t\t<p>A cavern was his dwelling, whence the stars</p>\n\t\t<p>And main-sea wide in boundless view he held.</p>\n\t\t<p class="slindent">&ldquo;The next, whose loosen&rsquo;d tresses overspread</p>\n\t\t<p>Her bosom, which thou seest not (for each hair</p>\n\t\t<p>On that side grows) was Manto, she who search&rsquo;d</p>\n\t\t<p>Through many regions, and at length her seat</p>\n\t\t<p>Fix&rsquo;d in my native land, whence a short space</p>\n\t\t<p>My words detain thy audience. When her sire</p>\n\t\t<p>From life departed, and in servitude</p>\n\t\t<p>The city dedicate to Bacchus mourn&rsquo;d,</p>\n\t\t<p>Long time she went a wand&rsquo;rer through the world.</p>\n\t\t<p>Aloft in Italy&rsquo;s delightful land</p>\n\t\t<p>A lake there lies, at foot of that proud Alp,</p>\n\t\t<p>That o&rsquo;er the Tyrol locks Germania in,</p>\n\t\t<p>Its name Benacus, which a thousand rills,</p>\n\t\t<p>Methinks, and more, water between the vale</p>\n\t\t<p>Camonica and Garda and the height</p>\n\t\t<p>Of Apennine remote. There is a spot</p>\n\t\t<p>At midway of that lake, where he who bears</p>\n\t\t<p>Of Trento&rsquo;s flock the past&rsquo;ral staff, with him</p>\n\t\t<p>Of Brescia, and the Veronese, might each</p>\n\t\t<p>Passing that way his benediction give.</p>\n\t\t<p>A garrison of goodly site and strong</p>\n\t\t<p>Peschiera stands, to awe with front oppos&rsquo;d</p>\n\t\t<p>The Bergamese and Brescian, whence the shore</p>\n\t\t<p>More slope each way descends. There, whatsoev&rsquo;er</p>\n\t\t<p>Benacus&rsquo; bosom holds not, tumbling o&rsquo;er</p>\n\t\t<p>Down falls, and winds a river flood beneath</p>\n\t\t<p>Through the green pastures. Soon as in his course</p>\n\t\t<p>The steam makes head, Benacus then no more</p>\n\t\t<p>They call the name, but Mincius, till at last</p>\n\t\t<p>Reaching Governo into Po he falls.</p>\n\t\t<p>Not far his course hath run, when a wide flat</p>\n\t\t<p>It finds, which overstretchmg as a marsh</p>\n\t\t<p>It covers, pestilent in summer oft.</p>\n\t\t<p>Hence journeying, the savage maiden saw</p>\n\t\t<p>&rsquo;Midst of the fen a territory waste</p>\n\t\t<p>And naked of inhabitants. To shun</p>\n\t\t<p>All human converse, here she with her slaves</p>\n\t\t<p>Plying her arts remain&rsquo;d, and liv&rsquo;d, and left</p>\n\t\t<p>Her body tenantless. Thenceforth the tribes,</p>\n\t\t<p>Who round were scatter&rsquo;d, gath&rsquo;ring to that place</p>\n\t\t<p>Assembled; for its strength was great, enclos&rsquo;d</p>\n\t\t<p>On all parts by the fen. On those dead bones</p>\n\t\t<p>They rear&rsquo;d themselves a city, for her sake,</p>\n\t\t<p>Calling it Mantua, who first chose the spot,</p>\n\t\t<p>Nor ask&rsquo;d another omen for the name,</p>\n\t\t<p>Wherein more numerous the people dwelt,</p>\n\t\t<p>Ere Casalodi&rsquo;s madness by deceit</p>\n\t\t<p>Was wrong&rsquo;d of Pinamonte. If thou hear</p>\n\t\t<p>Henceforth another origin assign&rsquo;d</p>\n\t\t<p>Of that my country, I forewarn thee now,</p>\n\t\t<p>That falsehood none beguile thee of the truth.&rdquo;</p>\n\t\t<p class="slindent">I answer&rsquo;d: &ldquo;Teacher, I conclude thy words</p>\n\t\t<p>So certain, that all else shall be to me</p>\n\t\t<p>As embers lacking life. But now of these,</p>\n\t\t<p>Who here proceed, instruct me, if thou see</p>\n\t\t<p>Any that merit more especial note.</p>\n\t\t<p>For thereon is my mind alone intent.&rdquo;</p>\n\t\t<p class="slindent">He straight replied: &ldquo;That spirit, from whose cheek</p>\n\t\t<p>The beard sweeps o&rsquo;er his shoulders brown, what time</p>\n\t\t<p>Graecia was emptied of her males, that scarce</p>\n\t\t<p>The cradles were supplied, the seer was he</p>\n\t\t<p>In Aulis, who with Calchas gave the sign</p>\n\t\t<p>When first to cut the cable. Him they nam&rsquo;d</p>\n\t\t<p>Eurypilus: so sings my tragic strain,</p>\n\t\t<p>In which majestic measure well thou know&rsquo;st,</p>\n\t\t<p>Who know&rsquo;st it all. That other, round the loins</p>\n\t\t<p>So slender of his shape, was Michael Scot,</p>\n\t\t<p>Practis&rsquo;d in ev&rsquo;ry slight of magic wile.</p>\n\t\t<p class="slindent">&ldquo;Guido Bonatti see: Asdente mark,</p>\n\t\t<p>Who now were willing, he had tended still</p>\n\t\t<p>The thread and cordwain; and too late repents.</p>\n\t\t<p class="slindent">&ldquo;See next the wretches, who the needle left,</p>\n\t\t<p>The shuttle and the spindle, and became</p>\n\t\t<p>Diviners: baneful witcheries they wrought</p>\n\t\t<p>With images and herbs. But onward now:</p>\n\t\t<p>For now doth Cain with fork of thorns confine</p>\n\t\t<p>On either hemisphere, touching the wave</p>\n\t\t<p>Beneath the towers of Seville. Yesternight</p>\n\t\t<p>The moon was round. Thou mayst remember well:</p>\n\t\t<p>For she good service did thee in the gloom</p>\n\t\t<p>Of the deep wood.&rdquo; This said, both onward mov&rsquo;d.</p>\n\t\t</div>','<p class="cantohead">Canto XXI</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">Thus</span> we from bridge to bridge, with other talk,</p>\n\t\t<p>The which my drama cares not to rehearse,</p>\n\t\t<p>Pass&rsquo;d on; and to the summit reaching, stood</p>\n\t\t<p>To view another gap, within the round</p>\n\t\t<p>Of Malebolge, other bootless pangs.</p>\n\t\t<p class="slindent">Marvelous darkness shadow&rsquo;d o&rsquo;er the place.</p>\n\t\t<p class="slindent">In the Venetians&rsquo; arsenal as boils</p>\n\t\t<p>Through wintry months tenacious pitch, to smear</p>\n\t\t<p>Their unsound vessels; for th&rsquo; inclement time</p>\n\t\t<p>Sea-faring men restrains, and in that while</p>\n\t\t<p>His bark one builds anew, another stops</p>\n\t\t<p>The ribs of his, that hath made many a voyage;</p>\n\t\t<p>One hammers at the prow, one at the poop;</p>\n\t\t<p>This shapeth oars, that other cables twirls,</p>\n\t\t<p>The mizen one repairs and main-sail rent</p>\n\t\t<p>So not by force of fire but art divine</p>\n\t\t<p>Boil&rsquo;d here a glutinous thick mass, that round</p>\n\t\t<p>Lim&rsquo;d all the shore beneath. I that beheld,</p>\n\t\t<p>But therein nought distinguish&rsquo;d, save the surge,</p>\n\t\t<p>Rais&rsquo;d by the boiling, in one mighty swell</p>\n\t\t<p>Heave, and by turns subsiding and fall. While there</p>\n\t\t<p>I fix&rsquo;d my ken below, &ldquo;Mark! mark!&rdquo; my guide</p>\n\t\t<p>Exclaiming, drew me towards him from the place,</p>\n\t\t<p>Wherein I stood. I turn&rsquo;d myself as one,</p>\n\t\t<p>Impatient to behold that which beheld</p>\n\t\t<p>He needs must shun, whom sudden fear unmans,</p>\n\t\t<p>That he his flight delays not for the view.</p>\n\t\t<p>Behind me I discern&rsquo;d a devil black,</p>\n\t\t<p>That running, up advanc&rsquo;d along the rock.</p>\n\t\t<p>Ah! what fierce cruelty his look bespake!</p>\n\t\t<p>In act how bitter did he seem, with wings</p>\n\t\t<p>Buoyant outstretch&rsquo;d and feet of nimblest tread!</p>\n\t\t<p>His shoulder proudly eminent and sharp</p>\n\t\t<p>Was with a sinner charg&rsquo;d; by either haunch</p>\n\t\t<p>He held him, the foot&rsquo;s sinew griping fast.</p>\n\t\t<p class="slindent">&ldquo;Ye of our bridge!&rdquo; he cried, &ldquo;keen-talon&rsquo;d fiends!</p>\n\t\t<p>Lo! one of Santa Zita&rsquo;s elders! Him</p>\n\t\t<p>Whelm ye beneath, while I return for more.</p>\n\t\t<p>That land hath store of such. All men are there,</p>\n\t\t<p>Except Bonturo, barterers: of &lsquo;no&rsquo;</p>\n\t\t<p>For lucre there an &lsquo;aye&rsquo; is quickly made.&rdquo;</p>\n\t\t<p class="slindent">Him dashing down, o&rsquo;er the rough rock he turn&rsquo;d,</p>\n\t\t<p>Nor ever after thief a mastiff loos&rsquo;d</p>\n\t\t<p>Sped with like eager haste. That other sank</p>\n\t\t<p>And forthwith writing to the surface rose.</p>\n\t\t<p>But those dark demons, shrouded by the bridge,</p>\n\t\t<p>Cried &ldquo;Here the hallow&rsquo;d visage saves not: here</p>\n\t\t<p>Is other swimming than in Serchio&rsquo;s wave.</p>\n\t\t<p>Wherefore if thou desire we rend thee not,</p>\n\t\t<p>Take heed thou mount not o&rsquo;er the pitch.&rdquo; This said,</p>\n\t\t<p>They grappled him with more than hundred hooks,</p>\n\t\t<p>And shouted: &ldquo;Cover&rsquo;d thou must sport thee here;</p>\n\t\t<p>So, if thou canst, in secret mayst thou filch.&rdquo;</p>\n\t\t<p>E&rsquo;en thus the cook bestirs him, with his grooms,</p>\n\t\t<p>To thrust the flesh into the caldron down</p>\n\t\t<p>With flesh-hooks, that it float not on the top.</p>\n\t\t<p class="slindent">Me then my guide bespake: &ldquo;Lest they descry,</p>\n\t\t<p>That thou art here, behind a craggy rock</p>\n\t\t<p>Bend low and screen thee; and whate&rsquo;er of force</p>\n\t\t<p>Be offer&rsquo;d me, or insult, fear thou not:</p>\n\t\t<p>For I am well advis&rsquo;d, who have been erst</p>\n\t\t<p>In the like fray.&rdquo; Beyond the bridge&rsquo;s head</p>\n\t\t<p>Therewith he pass&rsquo;d, and reaching the sixth pier,</p>\n\t\t<p>Behov&rsquo;d him then a forehead terror-proof.</p>\n\t\t<p class="slindent">With storm and fury, as when dogs rush forth</p>\n\t\t<p>Upon the poor man&rsquo;s back, who suddenly</p>\n\t\t<p>From whence he standeth makes his suit; so rush&rsquo;d</p>\n\t\t<p>Those from beneath the arch, and against him</p>\n\t\t<p>Their weapons all they pointed. He aloud:</p>\n\t\t<p>&ldquo;Be none of you outrageous: ere your time</p>\n\t\t<p>Dare seize me, come forth from amongst you one,</p>\n\t\t<p>&ldquo;Who having heard my words, decide he then</p>\n\t\t<p>If he shall tear these limbs.&rdquo; They shouted loud,</p>\n\t\t<p>&ldquo;Go, Malacoda!&rdquo; Whereat one advanc&rsquo;d,</p>\n\t\t<p>The others standing firm, and as he came,</p>\n\t\t<p>&ldquo;What may this turn avail him?&rdquo; he exclaim&rsquo;d.</p>\n\t\t<p class="slindent">&ldquo;Believ&rsquo;st thou, Malacoda! I had come</p>\n\t\t<p>Thus far from all your skirmishing secure,&rdquo;</p>\n\t\t<p>My teacher answered, &ldquo;without will divine</p>\n\t\t<p>And destiny propitious? Pass we then</p>\n\t\t<p>For so Heaven&rsquo;s pleasure is, that I should lead</p>\n\t\t<p>Another through this savage wilderness.&rdquo;</p>\n\t\t<p class="slindent">Forthwith so fell his pride, that he let drop</p>\n\t\t<p>The instrument of torture at his feet,</p>\n\t\t<p>And to the rest exclaim&rsquo;d: &ldquo;We have no power</p>\n\t\t<p>To strike him.&rdquo; Then to me my guide: &ldquo;O thou!</p>\n\t\t<p>Who on the bridge among the crags dost sit</p>\n\t\t<p>Low crouching, safely now to me return.&rdquo;</p>\n\t\t<p class="slindent">I rose, and towards him moved with speed: the fiends</p>\n\t\t<p>Meantime all forward drew: me terror seiz&rsquo;d</p>\n\t\t<p>Lest they should break the compact they had made.</p>\n\t\t<p>Thus issuing from Caprona, once I saw</p>\n\t\t<p>Th&rsquo; infantry dreading, lest his covenant</p>\n\t\t<p>The foe should break; so close he hemm&rsquo;d them round.</p>\n\t\t<p class="slindent">I to my leader&rsquo;s side adher&rsquo;d, mine eyes</p>\n\t\t<p>With fixt and motionless observance bent</p>\n\t\t<p>On their unkindly visage. They their hooks</p>\n\t\t<p>Protruding, one the other thus bespake:</p>\n\t\t<p>&ldquo;Wilt thou I touch him on the hip?&rdquo; To whom</p>\n\t\t<p>Was answer&rsquo;d: &ldquo;Even so; nor miss thy aim.&rdquo;</p>\n\t\t<p class="slindent">But he, who was in conf&rsquo;rence with my guide,</p>\n\t\t<p>Turn&rsquo;d rapid round, and thus the demon spake:</p>\n\t\t<p>&ldquo;Stay, stay thee, Scarmiglione!&rdquo; Then to us</p>\n\t\t<p>He added: &ldquo;Further footing to your step</p>\n\t\t<p>This rock affords not, shiver&rsquo;d to the base</p>\n\t\t<p>Of the sixth arch. But would you still proceed,</p>\n\t\t<p>Up by this cavern go: not distant far,</p>\n\t\t<p>Another rock will yield you passage safe.</p>\n\t\t<p>Yesterday, later by five hours than now,</p>\n\t\t<p>Twelve hundred threescore years and six had fill&rsquo;d</p>\n\t\t<p>The circuit of their course, since here the way</p>\n\t\t<p>Was broken. Thitherward I straight dispatch</p>\n\t\t<p>Certain of these my scouts, who shall espy</p>\n\t\t<p>If any on the surface bask. With them</p>\n\t\t<p>Go ye: for ye shall find them nothing fell.</p>\n\t\t<p>Come Alichino forth,&rdquo; with that he cried,</p>\n\t\t<p>&ldquo;And Calcabrina, and Cagnazzo thou!</p>\n\t\t<p>The troop of ten let Barbariccia lead.</p>\n\t\t<p>With Libicocco Draghinazzo haste,</p>\n\t\t<p>Fang&rsquo;d Ciriatto, Grafflacane fierce,</p>\n\t\t<p>And Farfarello, and mad Rubicant.</p>\n\t\t<p>Search ye around the bubbling tar. For these,</p>\n\t\t<p>In safety lead them, where the other crag</p>\n\t\t<p>Uninterrupted traverses the dens.&rdquo;</p>\n\t\t<p class="slindent">I then: &ldquo;O master! what a sight is there!</p>\n\t\t<p>Ah! without escort, journey we alone,</p>\n\t\t<p>Which, if thou know the way, I covet not.</p>\n\t\t<p>Unless thy prudence fail thee, dost not mark</p>\n\t\t<p>How they do gnarl upon us, and their scowl</p>\n\t\t<p>Threatens us present tortures?&rdquo; He replied:</p>\n\t\t<p>&ldquo;I charge thee fear not: let them, as they will,</p>\n\t\t<p>Gnarl on: &rsquo;t is but in token of their spite</p>\n\t\t<p>Against the souls, who mourn in torment steep&rsquo;d.&rdquo;</p>\n\t\t<p class="slindent">To leftward o&rsquo;er the pier they turn&rsquo;d; but each</p>\n\t\t<p>Had first between his teeth prest close the tongue,</p>\n\t\t<p>Toward their leader for a signal looking,</p>\n\t\t<p>Which he with sound obscene triumphant gave.</p>\n\t\t</div>','<p class="cantohead">Canto XXII</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">It</span> hath been heretofore my chance to see</p>\n\t\t<p>Horsemen with martial order shifting camp,</p>\n\t\t<p>To onset sallying, or in muster rang&rsquo;d,</p>\n\t\t<p>Or in retreat sometimes outstretch&rsquo;d for flight;</p>\n\t\t<p>Light-armed squadrons and fleet foragers</p>\n\t\t<p>Scouring thy plains, Arezzo! have I seen,</p>\n\t\t<p>And clashing tournaments, and tilting jousts,</p>\n\t\t<p>Now with the sound of trumpets, now of bells,</p>\n\t\t<p>Tabors, or signals made from castled heights,</p>\n\t\t<p>And with inventions multiform, our own,</p>\n\t\t<p>Or introduc&rsquo;d from foreign land; but ne&rsquo;er</p>\n\t\t<p>To such a strange recorder I beheld,</p>\n\t\t<p>In evolution moving, horse nor foot,</p>\n\t\t<p>Nor ship, that tack&rsquo;d by sign from land or star.</p>\n\t\t<p class="slindent">With the ten demons on our way we went;</p>\n\t\t<p>Ah fearful company! but in the church</p>\n\t\t<p>With saints, with gluttons at the tavern&rsquo;s mess.</p>\n\t\t<p class="slindent">Still earnest on the pitch I gaz&rsquo;d, to mark</p>\n\t\t<p>All things whate&rsquo;er the chasm contain&rsquo;d, and those</p>\n\t\t<p>Who burn&rsquo;d within. As dolphins, that, in sign</p>\n\t\t<p>To mariners, heave high their arched backs,</p>\n\t\t<p>That thence forewarn&rsquo;d they may advise to save</p>\n\t\t<p>Their threaten&rsquo;d vessels; so, at intervals,</p>\n\t\t<p>To ease the pain his back some sinner show&rsquo;d,</p>\n\t\t<p>Then hid more nimbly than the lightning glance.</p>\n\t\t<p class="slindent">E&rsquo;en as the frogs, that of a wat&rsquo;ry moat</p>\n\t\t<p>Stand at the brink, with the jaws only out,</p>\n\t\t<p>Their feet and of the trunk all else concealed,</p>\n\t\t<p>Thus on each part the sinners stood, but soon</p>\n\t\t<p>As Barbariccia was at hand, so they</p>\n\t\t<p>Drew back under the wave. I saw, and yet</p>\n\t\t<p>My heart doth stagger, one, that waited thus,</p>\n\t\t<p>As it befalls that oft one frog remains,</p>\n\t\t<p>While the next springs away: and Graffiacan,</p>\n\t\t<p>Who of the fiends was nearest, grappling seiz&rsquo;d</p>\n\t\t<p>His clotted locks, and dragg&rsquo;d him sprawling up,</p>\n\t\t<p>That he appear&rsquo;d to me an otter. Each</p>\n\t\t<p>Already by their names I knew, so well</p>\n\t\t<p>When they were chosen, I observ&rsquo;d, and mark&rsquo;d</p>\n\t\t<p>How one the other call&rsquo;d. &ldquo;O Rubicant!</p>\n\t\t<p>See that his hide thou with thy talons flay,&rdquo;</p>\n\t\t<p>Shouted together all the cursed crew.</p>\n\t\t<p class="slindent">Then I: &ldquo;Inform thee, master! if thou may,</p>\n\t\t<p>What wretched soul is this, on whom their hand</p>\n\t\t<p>His foes have laid.&rdquo; My leader to his side</p>\n\t\t<p>Approach&rsquo;d, and whence he came inquir&rsquo;d, to whom</p>\n\t\t<p>Was answer&rsquo;d thus: &ldquo;Born in Navarre&rsquo;s domain</p>\n\t\t<p>My mother plac&rsquo;d me in a lord&rsquo;s retinue,</p>\n\t\t<p>For she had borne me to a losel vile,</p>\n\t\t<p>A spendthrift of his substance and himself.</p>\n\t\t<p>The good king Thibault after that I serv&rsquo;d,</p>\n\t\t<p>To peculating here my thoughts were turn&rsquo;d,</p>\n\t\t<p>Whereof I give account in this dire heat.&rdquo;</p>\n\t\t<p class="slindent">Straight Ciriatto, from whose mouth a tusk</p>\n\t\t<p>Issued on either side, as from a boar,</p>\n\t\t<p>Ript him with one of these. &rsquo;Twixt evil claws</p>\n\t\t<p>The mouse had fall&rsquo;n: but Barbariccia cried,</p>\n\t\t<p>Seizing him with both arms: &ldquo;Stand thou apart,</p>\n\t\t<p>While I do fix him on my prong transpierc&rsquo;d.&rdquo;</p>\n\t\t<p>Then added, turning to my guide his face,</p>\n\t\t<p>&ldquo;Inquire of him, if more thou wish to learn,</p>\n\t\t<p>Ere he again be rent.&rdquo; My leader thus:</p>\n\t\t<p>&ldquo;Then tell us of the partners in thy guilt;</p>\n\t\t<p>Knowest thou any sprung of Latian land</p>\n\t\t<p>Under the tar?&rdquo;&mdash;&ldquo;I parted,&rdquo; he replied,</p>\n\t\t<p>&ldquo;But now from one, who sojourn&rsquo;d not far thence;</p>\n\t\t<p>So were I under shelter now with him!</p>\n\t\t<p>Nor hook nor talon then should scare me more.&rdquo;&mdash;.</p>\n\t\t<p class="slindent">&ldquo;Too long we suffer,&rdquo; Libicocco cried,</p>\n\t\t<p>Then, darting forth a prong, seiz&rsquo;d on his arm,</p>\n\t\t<p>And mangled bore away the sinewy part.</p>\n\t\t<p>Him Draghinazzo by his thighs beneath</p>\n\t\t<p>Would next have caught, whence angrily their chief,</p>\n\t\t<p>Turning on all sides round, with threat&rsquo;ning brow</p>\n\t\t<p>Restrain&rsquo;d them. When their strife a little ceas&rsquo;d,</p>\n\t\t<p>Of him, who yet was gazing on his wound,</p>\n\t\t<p>My teacher thus without delay inquir&rsquo;d:</p>\n\t\t<p>&ldquo;Who was the spirit, from whom by evil hap</p>\n\t\t<p>Parting, as thou has told, thou cam&rsquo;st to shore?&rdquo;&mdash;</p>\n\t\t<p class="slindent">&ldquo;It was the friar Gomita,&rdquo; he rejoin&rsquo;d,</p>\n\t\t<p>&ldquo;He of Gallura, vessel of all guile,</p>\n\t\t<p>Who had his master&rsquo;s enemies in hand,</p>\n\t\t<p>And us&rsquo;d them so that they commend him well.</p>\n\t\t<p>Money he took, and them at large dismiss&rsquo;d.</p>\n\t\t<p>So he reports: and in each other charge</p>\n\t\t<p>Committed to his keeping, play&rsquo;d the part</p>\n\t\t<p>Of barterer to the height: with him doth herd</p>\n\t\t<p>The chief of Logodoro, Michel Zanche.</p>\n\t\t<p>Sardinia is a theme, whereof their tongue</p>\n\t\t<p>Is never weary. Out! alas! behold</p>\n\t\t<p>That other, how he grins! More would I say,</p>\n\t\t<p>But tremble lest he mean to maul me sore.&rdquo;</p>\n\t\t<p class="slindent">Their captain then to Farfarello turning,</p>\n\t\t<p>Who roll&rsquo;d his moony eyes in act to strike,</p>\n\t\t<p>Rebuk&rsquo;d him thus: &ldquo;Off! cursed bird! Avaunt!&rdquo;&mdash;</p>\n\t\t<p class="slindent">&ldquo;If ye desire to see or hear,&rdquo; he thus</p>\n\t\t<p>Quaking with dread resum&rsquo;d, &ldquo;or Tuscan spirits</p>\n\t\t<p>Or Lombard, I will cause them to appear.</p>\n\t\t<p>Meantime let these ill talons bate their fury,</p>\n\t\t<p>So that no vengeance they may fear from them,</p>\n\t\t<p>And I, remaining in this self-same place,</p>\n\t\t<p>Will for myself but one, make sev&rsquo;n appear,</p>\n\t\t<p>When my shrill whistle shall be heard; for so</p>\n\t\t<p>Our custom is to call each other up.&rdquo;</p>\n\t\t<p class="slindent">Cagnazzo at that word deriding grinn&rsquo;d,</p>\n\t\t<p>Then wagg&rsquo;d the head and spake: &ldquo;Hear his device,</p>\n\t\t<p>Mischievous as he is, to plunge him down.&rdquo;</p>\n\t\t<p class="slindent">Whereto he thus, who fail&rsquo;d not in rich store</p>\n\t\t<p>Of nice-wove toils; &ldquo;Mischief forsooth extreme,</p>\n\t\t<p>Meant only to procure myself more woe!&rdquo;</p>\n\t\t<p class="slindent">No longer Alichino then refrain&rsquo;d,</p>\n\t\t<p>But thus, the rest gainsaying, him bespake:</p>\n\t\t<p>&ldquo;If thou do cast thee down, I not on foot</p>\n\t\t<p>Will chase thee, but above the pitch will beat</p>\n\t\t<p>My plumes. Quit we the vantage ground, and let</p>\n\t\t<p>The bank be as a shield, that we may see</p>\n\t\t<p>If singly thou prevail against us all.&rdquo;</p>\n\t\t<p class="slindent">Now, reader, of new sport expect to hear!</p>\n\t\t<p class="slindent">They each one turn&rsquo;d his eyes to the&rsquo; other shore,</p>\n\t\t<p>He first, who was the hardest to persuade.</p>\n\t\t<p>The spirit of Navarre chose well his time,</p>\n\t\t<p>Planted his feet on land, and at one leap</p>\n\t\t<p>Escaping disappointed their resolve.</p>\n\t\t<p class="slindent">Them quick resentment stung, but him the most,</p>\n\t\t<p>Who was the cause of failure; in pursuit</p>\n\t\t<p>He therefore sped, exclaiming; &ldquo;Thou art caught.&rdquo;</p>\n\t\t<p class="slindent">But little it avail&rsquo;d: terror outstripp&rsquo;d</p>\n\t\t<p>His following flight: the other plung&rsquo;d beneath,</p>\n\t\t<p>And he with upward pinion rais&rsquo;d his breast:</p>\n\t\t<p>E&rsquo;en thus the water-fowl, when she perceives</p>\n\t\t<p>The falcon near, dives instant down, while he</p>\n\t\t<p>Enrag&rsquo;d and spent retires. That mockery</p>\n\t\t<p>In Calcabrina fury stirr&rsquo;d, who flew</p>\n\t\t<p>After him, with desire of strife inflam&rsquo;d;</p>\n\t\t<p>And, for the barterer had &rsquo;scap&rsquo;d, so turn&rsquo;d</p>\n\t\t<p>His talons on his comrade. O&rsquo;er the dyke</p>\n\t\t<p>In grapple close they join&rsquo;d; but the&rsquo; other prov&rsquo;d</p>\n\t\t<p>A goshawk able to rend well his foe;</p>\n\t\t<p>And in the boiling lake both fell. The heat</p>\n\t\t<p>Was umpire soon between them, but in vain</p>\n\t\t<p>To lift themselves they strove, so fast were glued</p>\n\t\t<p>Their pennons. Barbariccia, as the rest,</p>\n\t\t<p>That chance lamenting, four in flight dispatch&rsquo;d</p>\n\t\t<p>From the&rsquo; other coast, with all their weapons arm&rsquo;d.</p>\n\t\t<p>They, to their post on each side speedily</p>\n\t\t<p>Descending, stretch&rsquo;d their hooks toward the fiends,</p>\n\t\t<p>Who flounder&rsquo;d, inly burning from their scars:</p>\n\t\t<p>And we departing left them to that broil.</p>\n\t\t</div>','<p class="cantohead">Canto XXIII</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">In</span> silence and in solitude we went,</p>\n\t\t<p>One first, the other following his steps,</p>\n\t\t<p>As minor friars journeying on their road.</p>\n\t\t<p class="slindent">The present fray had turn&rsquo;d my thoughts to muse</p>\n\t\t<p>Upon old Aesop&rsquo;s fable, where he told</p>\n\t\t<p>What fate unto the mouse and frog befell.</p>\n\t\t<p>For language hath not sounds more like in sense,</p>\n\t\t<p>Than are these chances, if the origin</p>\n\t\t<p>And end of each be heedfully compar&rsquo;d.</p>\n\t\t<p>And as one thought bursts from another forth,</p>\n\t\t<p>So afterward from that another sprang,</p>\n\t\t<p>Which added doubly to my former fear.</p>\n\t\t<p>For thus I reason&rsquo;d: &ldquo;These through us have been</p>\n\t\t<p>So foil&rsquo;d, with loss and mock&rsquo;ry so complete,</p>\n\t\t<p>As needs must sting them sore. If anger then</p>\n\t\t<p>Be to their evil will conjoin&rsquo;d, more fell</p>\n\t\t<p>They shall pursue us, than the savage hound</p>\n\t\t<p>Snatches the leveret, panting &rsquo;twixt his jaws.&rdquo;</p>\n\t\t<p class="slindent">Already I perceiv&rsquo;d my hair stand all</p>\n\t\t<p>On end with terror, and look&rsquo;d eager back.</p>\n\t\t<p class="slindent">&ldquo;Teacher,&rdquo; I thus began, &ldquo;if speedily</p>\n\t\t<p>Thyself and me thou hide not, much I dread</p>\n\t\t<p>Those evil talons. Even now behind</p>\n\t\t<p>They urge us: quick imagination works</p>\n\t\t<p>So forcibly, that I already feel them.&rdquo;</p>\n\t\t<p class="slindent">He answer&rsquo;d: &ldquo;Were I form&rsquo;d of leaded glass,</p>\n\t\t<p>I should not sooner draw unto myself</p>\n\t\t<p>Thy outward image, than I now imprint</p>\n\t\t<p>That from within. This moment came thy thoughts</p>\n\t\t<p>Presented before mine, with similar act</p>\n\t\t<p>And count&rsquo;nance similar, so that from both</p>\n\t\t<p>I one design have fram&rsquo;d. If the right coast</p>\n\t\t<p>Incline so much, that we may thence descend</p>\n\t\t<p>Into the other chasm, we shall escape</p>\n\t\t<p>Secure from this imagined pursuit.&rdquo;</p>\n\t\t<p class="slindent">He had not spoke his purpose to the end,</p>\n\t\t<p>When I from far beheld them with spread wings</p>\n\t\t<p>Approach to take us. Suddenly my guide</p>\n\t\t<p>Caught me, ev&rsquo;n as a mother that from sleep</p>\n\t\t<p>Is by the noise arous&rsquo;d, and near her sees</p>\n\t\t<p>The climbing fires, who snatches up her babe</p>\n\t\t<p>And flies ne&rsquo;er pausing, careful more of him</p>\n\t\t<p>Than of herself, that but a single vest</p>\n\t\t<p>Clings round her limbs. Down from the jutting beach</p>\n\t\t<p>Supine he cast him, to that pendent rock,</p>\n\t\t<p>Which closes on one part the other chasm.</p>\n\t\t<p class="slindent">Never ran water with such hurrying pace</p>\n\t\t<p>Adown the tube to turn a landmill&rsquo;s wheel,</p>\n\t\t<p>When nearest it approaches to the spokes,</p>\n\t\t<p>As then along that edge my master ran,</p>\n\t\t<p>Carrying me in his bosom, as a child,</p>\n\t\t<p>Not a companion. Scarcely had his feet</p>\n\t\t<p>Reach&rsquo;d to the lowest of the bed beneath,</p>\n\t\t<p>When over us the steep they reach&rsquo;d; but fear</p>\n\t\t<p>In him was none; for that high Providence,</p>\n\t\t<p>Which plac&rsquo;d them ministers of the fifth foss,</p>\n\t\t<p>Power of departing thence took from them all.</p>\n\t\t<p class="slindent">There in the depth we saw a painted tribe,</p>\n\t\t<p>Who pac&rsquo;d with tardy steps around, and wept,</p>\n\t\t<p>Faint in appearance and o&rsquo;ercome with toil.</p>\n\t\t<p>Caps had they on, with hoods, that fell low down</p>\n\t\t<p>Before their eyes, in fashion like to those</p>\n\t\t<p>Worn by the monks in Cologne. Their outside</p>\n\t\t<p>Was overlaid with gold, dazzling to view,</p>\n\t\t<p>But leaden all within, and of such weight,</p>\n\t\t<p>That Frederick&rsquo;s compar&rsquo;d to these were straw.</p>\n\t\t<p>Oh, everlasting wearisome attire!</p>\n\t\t<p class="slindent">We yet once more with them together turn&rsquo;d</p>\n\t\t<p>To leftward, on their dismal moan intent.</p>\n\t\t<p>But by the weight oppress&rsquo;d, so slowly came</p>\n\t\t<p>The fainting people, that our company</p>\n\t\t<p>Was chang&rsquo;d at every movement of the step.</p>\n\t\t<p class="slindent">Whence I my guide address&rsquo;d: &ldquo;See that thou find</p>\n\t\t<p>Some spirit, whose name may by his deeds be known,</p>\n\t\t<p>And to that end look round thee as thou go&rsquo;st.&rdquo;</p>\n\t\t<p class="slindent">Then one, who understood the Tuscan voice,</p>\n\t\t<p>Cried after us aloud: &ldquo;Hold in your feet,</p>\n\t\t<p>Ye who so swiftly speed through the dusk air.</p>\n\t\t<p>Perchance from me thou shalt obtain thy wish.&rdquo;</p>\n\t\t<p class="slindent">Whereat my leader, turning, me bespake:</p>\n\t\t<p>&ldquo;Pause, and then onward at their pace proceed.&rdquo;</p>\n\t\t<p class="slindent">I staid, and saw two Spirits in whose look</p>\n\t\t<p>Impatient eagerness of mind was mark&rsquo;d</p>\n\t\t<p>To overtake me; but the load they bare</p>\n\t\t<p>And narrow path retarded their approach.</p>\n\t\t<p class="slindent">Soon as arriv&rsquo;d, they with an eye askance</p>\n\t\t<p>Perus&rsquo;d me, but spake not: then turning each</p>\n\t\t<p>To other thus conferring said: &ldquo;This one</p>\n\t\t<p>Seems, by the action of his throat, alive.</p>\n\t\t<p>And, be they dead, what privilege allows</p>\n\t\t<p>They walk unmantled by the cumbrous stole?&rdquo;</p>\n\t\t<p class="slindent">Then thus to me: &ldquo;Tuscan, who visitest</p>\n\t\t<p>The college of the mourning hypocrites,</p>\n\t\t<p>Disdain not to instruct us who thou art.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;By Arno&rsquo;s pleasant stream,&rdquo; I thus replied,</p>\n\t\t<p>&ldquo;In the great city I was bred and grew,</p>\n\t\t<p>And wear the body I have ever worn.</p>\n\t\t<p>but who are ye, from whom such mighty grief,</p>\n\t\t<p>As now I witness, courseth down your cheeks?</p>\n\t\t<p>What torment breaks forth in this bitter woe?&rdquo;</p>\n\t\t<p>&ldquo;Our bonnets gleaming bright with orange hue,&rdquo;</p>\n\t\t<p>One of them answer&rsquo;d, &ldquo;are so leaden gross,</p>\n\t\t<p>That with their weight they make the balances</p>\n\t\t<p>To crack beneath them. Joyous friars we were,</p>\n\t\t<p>Bologna&rsquo;s natives, Catalano I,</p>\n\t\t<p>He Loderingo nam&rsquo;d, and by thy land</p>\n\t\t<p>Together taken, as men used to take</p>\n\t\t<p>A single and indifferent arbiter,</p>\n\t\t<p>To reconcile their strifes. How there we sped,</p>\n\t\t<p>Gardingo&rsquo;s vicinage can best declare.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;O friars!&rdquo; I began, &ldquo;your miseries&mdash;&rdquo;</p>\n\t\t<p>But there brake off, for one had caught my eye,</p>\n\t\t<p>Fix&rsquo;d to a cross with three stakes on the ground:</p>\n\t\t<p>He, when he saw me, writh&rsquo;d himself, throughout</p>\n\t\t<p>Distorted, ruffling with deep sighs his beard.</p>\n\t\t<p>And Catalano, who thereof was &rsquo;ware,</p>\n\t\t<p>Thus spake: &ldquo;That pierced spirit, whom intent</p>\n\t\t<p>Thou view&rsquo;st, was he who gave the Pharisees</p>\n\t\t<p>Counsel, that it were fitting for one man</p>\n\t\t<p>To suffer for the people. He doth lie</p>\n\t\t<p>Transverse; nor any passes, but him first</p>\n\t\t<p>Behoves make feeling trial how each weighs.</p>\n\t\t<p>In straits like this along the foss are plac&rsquo;d</p>\n\t\t<p>The father of his consort, and the rest</p>\n\t\t<p>Partakers in that council, seed of ill</p>\n\t\t<p>And sorrow to the Jews.&rdquo; I noted then,</p>\n\t\t<p>How Virgil gaz&rsquo;d with wonder upon him,</p>\n\t\t<p>Thus abjectly extended on the cross</p>\n\t\t<p>In banishment eternal. To the friar</p>\n\t\t<p>He next his words address&rsquo;d: &ldquo;We pray ye tell,</p>\n\t\t<p>If so be lawful, whether on our right</p>\n\t\t<p>Lies any opening in the rock, whereby</p>\n\t\t<p>We both may issue hence, without constraint</p>\n\t\t<p>On the dark angels, that compell&rsquo;d they come</p>\n\t\t<p>To lead us from this depth.&rdquo; He thus replied:</p>\n\t\t<p>&ldquo;Nearer than thou dost hope, there is a rock</p>\n\t\t<p>From the next circle moving, which o&rsquo;ersteps</p>\n\t\t<p>Each vale of horror, save that here his cope</p>\n\t\t<p>Is shatter&rsquo;d. By the ruin ye may mount:</p>\n\t\t<p>For on the side it slants, and most the height</p>\n\t\t<p>Rises below.&rdquo; With head bent down awhile</p>\n\t\t<p>My leader stood, then spake: &ldquo;He warn&rsquo;d us ill,</p>\n\t\t<p>Who yonder hangs the sinners on his hook.&rdquo;</p>\n\t\t<p class="slindent">To whom the friar: At Bologna erst</p>\n\t\t<p>&ldquo;I many vices of the devil heard,</p>\n\t\t<p>Among the rest was said, &lsquo;He is a liar,</p>\n\t\t<p>And the father of lies!&rsquo;&nbsp;&rdquo; When he had spoke,</p>\n\t\t<p>My leader with large strides proceeded on,</p>\n\t\t<p>Somewhat disturb&rsquo;d with anger in his look.</p>\n\t\t<p class="slindent">I therefore left the spirits heavy laden,</p>\n\t\t<p>And following, his beloved footsteps mark&rsquo;d.</p>\n\t\t</div>','<p class="cantohead">Canto XXIV</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">In</span> the year&rsquo;s early nonage, when the sun</p>\n\t\t<p>Tempers his tresses in Aquarius&rsquo; urn,</p>\n\t\t<p>And now towards equal day the nights recede,</p>\n\t\t<p>When as the rime upon the earth puts on</p>\n\t\t<p>Her dazzling sister&rsquo;s image, but not long</p>\n\t\t<p>Her milder sway endures, then riseth up</p>\n\t\t<p>The village hind, whom fails his wintry store,</p>\n\t\t<p>And looking out beholds the plain around</p>\n\t\t<p>All whiten&rsquo;d, whence impatiently he smites</p>\n\t\t<p>His thighs, and to his hut returning in,</p>\n\t\t<p>There paces to and fro, wailing his lot,</p>\n\t\t<p>As a discomfited and helpless man;</p>\n\t\t<p>Then comes he forth again, and feels new hope</p>\n\t\t<p>Spring in his bosom, finding e&rsquo;en thus soon</p>\n\t\t<p>The world hath chang&rsquo;d its count&rsquo;nance, grasps his crook,</p>\n\t\t<p>And forth to pasture drives his little flock:</p>\n\t\t<p>So me my guide dishearten&rsquo;d when I saw</p>\n\t\t<p>His troubled forehead, and so speedily</p>\n\t\t<p>That ill was cur&rsquo;d; for at the fallen bridge</p>\n\t\t<p>Arriving, towards me with a look as sweet,</p>\n\t\t<p>He turn&rsquo;d him back, as that I first beheld</p>\n\t\t<p>At the steep mountain&rsquo;s foot. Regarding well</p>\n\t\t<p>The ruin, and some counsel first maintain&rsquo;d</p>\n\t\t<p>With his own thought, he open&rsquo;d wide his arm</p>\n\t\t<p>And took me up. As one, who, while he works,</p>\n\t\t<p>Computes his labour&rsquo;s issue, that he seems</p>\n\t\t<p>Still to foresee the&rsquo; effect, so lifting me</p>\n\t\t<p>Up to the summit of one peak, he fix&rsquo;d</p>\n\t\t<p>His eye upon another. &ldquo;Grapple that,&rdquo;</p>\n\t\t<p>Said he, &ldquo;but first make proof, if it be such</p>\n\t\t<p>As will sustain thee.&rdquo; For one capp&rsquo;d with lead</p>\n\t\t<p>This were no journey. Scarcely he, though light,</p>\n\t\t<p>And I, though onward push&rsquo;d from crag to crag,</p>\n\t\t<p>Could mount. And if the precinct of this coast</p>\n\t\t<p>Were not less ample than the last, for him</p>\n\t\t<p>I know not, but my strength had surely fail&rsquo;d.</p>\n\t\t<p>But Malebolge all toward the mouth</p>\n\t\t<p>Inclining of the nethermost abyss,</p>\n\t\t<p>The site of every valley hence requires,</p>\n\t\t<p>That one side upward slope, the other fall.</p>\n\t\t<p class="slindent">At length the point of our descent we reach&rsquo;d</p>\n\t\t<p>From the last flag: soon as to that arriv&rsquo;d,</p>\n\t\t<p>So was the breath exhausted from my lungs,</p>\n\t\t<p>I could no further, but did seat me there.</p>\n\t\t<p class="slindent">&ldquo;Now needs thy best of man;&rdquo; so spake my guide:</p>\n\t\t<p>&ldquo;For not on downy plumes, nor under shade</p>\n\t\t<p>Of canopy reposing, fame is won,</p>\n\t\t<p>Without which whosoe&rsquo;er consumes his days</p>\n\t\t<p>Leaveth such vestige of himself on earth,</p>\n\t\t<p>As smoke in air or foam upon the wave.</p>\n\t\t<p>Thou therefore rise: vanish thy weariness</p>\n\t\t<p>By the mind&rsquo;s effort, in each struggle form&rsquo;d</p>\n\t\t<p>To vanquish, if she suffer not the weight</p>\n\t\t<p>Of her corporeal frame to crush her down.</p>\n\t\t<p>A longer ladder yet remains to scale.</p>\n\t\t<p>From these to have escap&rsquo;d sufficeth not.</p>\n\t\t<p>If well thou note me, profit by my words.&rdquo;</p>\n\t\t<p class="slindent">I straightway rose, and show&rsquo;d myself less spent</p>\n\t\t<p>Than I in truth did feel me. &ldquo;On,&rdquo; I cried,</p>\n\t\t<p>&ldquo;For I am stout and fearless.&rdquo; Up the rock</p>\n\t\t<p>Our way we held, more rugged than before,</p>\n\t\t<p>Narrower and steeper far to climb. From talk</p>\n\t\t<p>I ceas&rsquo;d not, as we journey&rsquo;d, so to seem</p>\n\t\t<p>Least faint; whereat a voice from the other foss</p>\n\t\t<p>Did issue forth, for utt&rsquo;rance suited ill.</p>\n\t\t<p>Though on the arch that crosses there I stood,</p>\n\t\t<p>What were the words I knew not, but who spake</p>\n\t\t<p>Seem&rsquo;d mov&rsquo;d in anger. Down I stoop&rsquo;d to look,</p>\n\t\t<p>But my quick eye might reach not to the depth</p>\n\t\t<p>For shrouding darkness; wherefore thus I spake:</p>\n\t\t<p>&ldquo;To the next circle, Teacher, bend thy steps,</p>\n\t\t<p>And from the wall dismount we; for as hence</p>\n\t\t<p>I hear and understand not, so I see</p>\n\t\t<p>Beneath, and naught discern.&rdquo;&mdash;&ldquo;I answer not,&rdquo;</p>\n\t\t<p>Said he, &ldquo;but by the deed. To fair request</p>\n\t\t<p>Silent performance maketh best return.&rdquo;</p>\n\t\t<p class="slindent">We from the bridge&rsquo;s head descended, where</p>\n\t\t<p>To the eighth mound it joins, and then the chasm</p>\n\t\t<p>Opening to view, I saw a crowd within</p>\n\t\t<p>Of serpents terrible, so strange of shape</p>\n\t\t<p>And hideous, that remembrance in my veins</p>\n\t\t<p>Yet shrinks the vital current. Of her sands</p>\n\t\t<p>Let Lybia vaunt no more: if Jaculus,</p>\n\t\t<p>Pareas and Chelyder be her brood,</p>\n\t\t<p>Cenchris and Amphisboena, plagues so dire</p>\n\t\t<p>Or in such numbers swarming ne&rsquo;er she shew&rsquo;d,</p>\n\t\t<p>Not with all Ethiopia, and whate&rsquo;er</p>\n\t\t<p>Above the Erythraean sea is spawn&rsquo;d.</p>\n\t\t<p class="slindent">Amid this dread exuberance of woe</p>\n\t\t<p>Ran naked spirits wing&rsquo;d with horrid fear,</p>\n\t\t<p>Nor hope had they of crevice where to hide,</p>\n\t\t<p>Or heliotrope to charm them out of view.</p>\n\t\t<p>With serpents were their hands behind them bound,</p>\n\t\t<p>Which through their reins infix&rsquo;d the tail and head</p>\n\t\t<p>Twisted in folds before. And lo! on one</p>\n\t\t<p>Near to our side, darted an adder up,</p>\n\t\t<p>And, where the neck is on the shoulders tied,</p>\n\t\t<p>Transpierc&rsquo;d him. Far more quickly than e&rsquo;er pen</p>\n\t\t<p>Wrote O or I, he kindled, burn&rsquo;d, and chang&rsquo;d</p>\n\t\t<p>To ashes, all pour&rsquo;d out upon the earth.</p>\n\t\t<p>When there dissolv&rsquo;d he lay, the dust again</p>\n\t\t<p>Uproll&rsquo;d spontaneous, and the self-same form</p>\n\t\t<p>Instant resumed. So mighty sages tell,</p>\n\t\t<p>The&rsquo; Arabian Phoenix, when five hundred years</p>\n\t\t<p>Have well nigh circled, dies, and springs forthwith</p>\n\t\t<p>Renascent. Blade nor herb throughout his life</p>\n\t\t<p>He tastes, but tears of frankincense alone</p>\n\t\t<p>And odorous amomum: swaths of nard</p>\n\t\t<p>And myrrh his funeral shroud. As one that falls,</p>\n\t\t<p>He knows not how, by force demoniac dragg&rsquo;d</p>\n\t\t<p>To earth, or through obstruction fettering up</p>\n\t\t<p>In chains invisible the powers of man,</p>\n\t\t<p>Who, risen from his trance, gazeth around,</p>\n\t\t<p>Bewilder&rsquo;d with the monstrous agony</p>\n\t\t<p>He hath endur&rsquo;d, and wildly staring sighs;</p>\n\t\t<p>So stood aghast the sinner when he rose.</p>\n\t\t<p class="slindent">Oh! how severe God&rsquo;s judgment, that deals out</p>\n\t\t<p>Such blows in stormy vengeance! Who he was</p>\n\t\t<p>My teacher next inquir&rsquo;d, and thus in few</p>\n\t\t<p>He answer&rsquo;d: &ldquo;Vanni Fucci am I call&rsquo;d,</p>\n\t\t<p>Not long since rained down from Tuscany</p>\n\t\t<p>To this dire gullet. Me the beastial life</p>\n\t\t<p>And not the human pleas&rsquo;d, mule that I was,</p>\n\t\t<p>Who in Pistoia found my worthy den.&rdquo;</p>\n\t\t<p class="slindent">I then to Virgil: &ldquo;Bid him stir not hence,</p>\n\t\t<p>And ask what crime did thrust him hither: once</p>\n\t\t<p>A man I knew him choleric and bloody.&rdquo;</p>\n\t\t<p class="slindent">The sinner heard and feign&rsquo;d not, but towards me</p>\n\t\t<p>His mind directing and his face, wherein</p>\n\t\t<p>Was dismal shame depictur&rsquo;d, thus he spake:</p>\n\t\t<p>&ldquo;It grieves me more to have been caught by thee</p>\n\t\t<p>In this sad plight, which thou beholdest, than</p>\n\t\t<p>When I was taken from the other life.</p>\n\t\t<p>I have no power permitted to deny</p>\n\t\t<p>What thou inquirest. I am doom&rsquo;d thus low</p>\n\t\t<p>To dwell, for that the sacristy by me</p>\n\t\t<p>Was rifled of its goodly ornaments,</p>\n\t\t<p>And with the guilt another falsely charged.</p>\n\t\t<p>But that thou mayst not joy to see me thus,</p>\n\t\t<p>So as thou e&rsquo;er shalt &rsquo;scape this darksome realm</p>\n\t\t<p>Open thine ears and hear what I forebode.</p>\n\t\t<p>Reft of the Neri first Pistoia pines,</p>\n\t\t<p>Then Florence changeth citizens and laws.</p>\n\t\t<p>From Valdimagra, drawn by wrathful Mars,</p>\n\t\t<p>A vapour rises, wrapt in turbid mists,</p>\n\t\t<p>And sharp and eager driveth on the storm</p>\n\t\t<p>With arrowy hurtling o&rsquo;er Piceno&rsquo;s field,</p>\n\t\t<p>Whence suddenly the cloud shall burst, and strike</p>\n\t\t<p>Each helpless Bianco prostrate to the ground.</p>\n\t\t<p>This have I told, that grief may rend thy heart.&rdquo;</p>\n\t\t</div>','<p class="cantohead">Canto XXV</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">When</span> he had spoke, the sinner rais&rsquo;d his hands</p>\n\t\t<p>Pointed in mockery, and cried: &ldquo;Take them, God!</p>\n\t\t<p>I level them at thee!&rdquo; From that day forth</p>\n\t\t<p>The serpents were my friends; for round his neck</p>\n\t\t<p>One of then rolling twisted, as it said,</p>\n\t\t<p>&ldquo;Be silent, tongue!&rdquo; Another to his arms</p>\n\t\t<p>Upgliding, tied them, riveting itself</p>\n\t\t<p>So close, it took from them the power to move.</p>\n\t\t<p class="slindent">Pistoia! Ah Pistoia! why dost doubt</p>\n\t\t<p>To turn thee into ashes, cumb&rsquo;ring earth</p>\n\t\t<p>No longer, since in evil act so far</p>\n\t\t<p>Thou hast outdone thy seed? I did not mark,</p>\n\t\t<p>Through all the gloomy circles of the&rsquo; abyss,</p>\n\t\t<p>Spirit, that swell&rsquo;d so proudly &rsquo;gainst his God,</p>\n\t\t<p>Not him, who headlong fell from Thebes. He fled,</p>\n\t\t<p>Nor utter&rsquo;d more; and after him there came</p>\n\t\t<p>A centaur full of fury, shouting, &ldquo;Where</p>\n\t\t<p>Where is the caitiff?&rdquo; On Maremma&rsquo;s marsh</p>\n\t\t<p>Swarm not the serpent tribe, as on his haunch</p>\n\t\t<p>They swarm&rsquo;d, to where the human face begins.</p>\n\t\t<p>Behind his head upon the shoulders lay,</p>\n\t\t<p>With open wings, a dragon breathing fire</p>\n\t\t<p>On whomsoe&rsquo;er he met. To me my guide:</p>\n\t\t<p>&ldquo;Cacus is this, who underneath the rock</p>\n\t\t<p>Of Aventine spread oft a lake of blood.</p>\n\t\t<p>He, from his brethren parted, here must tread</p>\n\t\t<p>A different journey, for his fraudful theft</p>\n\t\t<p>Of the great herd, that near him stall&rsquo;d; whence found</p>\n\t\t<p>His felon deeds their end, beneath the mace</p>\n\t\t<p>Of stout Alcides, that perchance laid on</p>\n\t\t<p>A hundred blows, and not the tenth was felt.&rdquo;</p>\n\t\t<p class="slindent">While yet he spake, the centaur sped away:</p>\n\t\t<p>And under us three spirits came, of whom</p>\n\t\t<p>Nor I nor he was ware, till they exclaim&rsquo;d;</p>\n\t\t<p>&ldquo;Say who are ye?&rdquo; We then brake off discourse,</p>\n\t\t<p>Intent on these alone. I knew them not;</p>\n\t\t<p>But, as it chanceth oft, befell, that one</p>\n\t\t<p>Had need to name another. &ldquo;Where,&rdquo; said he,</p>\n\t\t<p>&ldquo;Doth Cianfa lurk?&rdquo; I, for a sign my guide</p>\n\t\t<p>Should stand attentive, plac&rsquo;d against my lips</p>\n\t\t<p>The finger lifted. If, O reader! now</p>\n\t\t<p>Thou be not apt to credit what I tell,</p>\n\t\t<p>No marvel; for myself do scarce allow</p>\n\t\t<p>The witness of mine eyes. But as I looked</p>\n\t\t<p>Toward them, lo! a serpent with six feet</p>\n\t\t<p>Springs forth on one, and fastens full upon him:</p>\n\t\t<p>His midmost grasp&rsquo;d the belly, a forefoot</p>\n\t\t<p>Seiz&rsquo;d on each arm (while deep in either cheek</p>\n\t\t<p>He flesh&rsquo;d his fangs); the hinder on the thighs</p>\n\t\t<p>Were spread, &rsquo;twixt which the tail inserted curl&rsquo;d</p>\n\t\t<p>Upon the reins behind. Ivy ne&rsquo;er clasp&rsquo;d</p>\n\t\t<p>A dodder&rsquo;d oak, as round the other&rsquo;s limbs</p>\n\t\t<p>The hideous monster intertwin&rsquo;d his own.</p>\n\t\t<p>Then, as they both had been of burning wax,</p>\n\t\t<p>Each melted into other, mingling hues,</p>\n\t\t<p>That which was either now was seen no more.</p>\n\t\t<p>Thus up the shrinking paper, ere it burns,</p>\n\t\t<p>A brown tint glides, not turning yet to black,</p>\n\t\t<p>And the clean white expires. The other two</p>\n\t\t<p>Look&rsquo;d on exclaiming: &ldquo;Ah, how dost thou change,</p>\n\t\t<p>Agnello! See! Thou art nor double now,</p>\n\t\t<p>&ldquo;Nor only one.&rdquo; The two heads now became</p>\n\t\t<p>One, and two figures blended in one form</p>\n\t\t<p>Appear&rsquo;d, where both were lost. Of the four lengths</p>\n\t\t<p>Two arms were made: the belly and the chest</p>\n\t\t<p>The thighs and legs into such members chang&rsquo;d,</p>\n\t\t<p>As never eye hath seen. Of former shape</p>\n\t\t<p>All trace was vanish&rsquo;d. Two yet neither seem&rsquo;d</p>\n\t\t<p>That image miscreate, and so pass&rsquo;d on</p>\n\t\t<p>With tardy steps. As underneath the scourge</p>\n\t\t<p>Of the fierce dog-star, that lays bare the fields,</p>\n\t\t<p>Shifting from brake to brake, the lizard seems</p>\n\t\t<p>A flash of lightning, if he thwart the road,</p>\n\t\t<p>So toward th&rsquo; entrails of the other two</p>\n\t\t<p>Approaching seem&rsquo;d, an adder all on fire,</p>\n\t\t<p>As the dark pepper-grain, livid and swart.</p>\n\t\t<p>In that part, whence our life is nourish&rsquo;d first,</p>\n\t\t<p>One he transpierc&rsquo;d; then down before him fell</p>\n\t\t<p>Stretch&rsquo;d out. The pierced spirit look&rsquo;d on him</p>\n\t\t<p>But spake not; yea stood motionless and yawn&rsquo;d,</p>\n\t\t<p>As if by sleep or fev&rsquo;rous fit assail&rsquo;d.</p>\n\t\t<p>He ey&rsquo;d the serpent, and the serpent him.</p>\n\t\t<p>One from the wound, the other from the mouth</p>\n\t\t<p>Breath&rsquo;d a thick smoke, whose vap&rsquo;ry columns join&rsquo;d.</p>\n\t\t<p class="slindent">Lucan in mute attention now may hear,</p>\n\t\t<p>Nor thy disastrous fate, Sabellus! tell,</p>\n\t\t<p>Nor shine, Nasidius! Ovid now be mute.</p>\n\t\t<p>What if in warbling fiction he record</p>\n\t\t<p>Cadmus and Arethusa, to a snake</p>\n\t\t<p>Him chang&rsquo;d, and her into a fountain clear,</p>\n\t\t<p>I envy not; for never face to face</p>\n\t\t<p>Two natures thus transmuted did he sing,</p>\n\t\t<p>Wherein both shapes were ready to assume</p>\n\t\t<p>The other&rsquo;s substance. They in mutual guise</p>\n\t\t<p>So answer&rsquo;d, that the serpent split his train</p>\n\t\t<p>Divided to a fork, and the pierc&rsquo;d spirit</p>\n\t\t<p>Drew close his steps together, legs and thighs</p>\n\t\t<p>Compacted, that no sign of juncture soon</p>\n\t\t<p>Was visible: the tail disparted took</p>\n\t\t<p>The figure which the spirit lost, its skin</p>\n\t\t<p>Soft&rsquo;ning, his indurated to a rind.</p>\n\t\t<p>The shoulders next I mark&rsquo;d, that ent&rsquo;ring join&rsquo;d</p>\n\t\t<p>The monster&rsquo;s arm-pits, whose two shorter feet</p>\n\t\t<p>So lengthen&rsquo;d, as the other&rsquo;s dwindling shrunk.</p>\n\t\t<p>The feet behind then twisting up became</p>\n\t\t<p>That part that man conceals, which in the wretch</p>\n\t\t<p>Was cleft in twain. While both the shadowy smoke</p>\n\t\t<p>With a new colour veils, and generates</p>\n\t\t<p>Th&rsquo; excrescent pile on one, peeling it off</p>\n\t\t<p>From th&rsquo; other body, lo! upon his feet</p>\n\t\t<p>One upright rose, and prone the other fell.</p>\n\t\t<p>Not yet their glaring and malignant lamps</p>\n\t\t<p>Were shifted, though each feature chang&rsquo;d beneath.</p>\n\t\t<p>Of him who stood erect, the mounting face</p>\n\t\t<p>Retreated towards the temples, and what there</p>\n\t\t<p>Superfluous matter came, shot out in ears</p>\n\t\t<p>From the smooth cheeks, the rest, not backward dragg&rsquo;d,</p>\n\t\t<p>Of its excess did shape the nose; and swell&rsquo;d</p>\n\t\t<p>Into due size protuberant the lips.</p>\n\t\t<p>He, on the earth who lay, meanwhile extends</p>\n\t\t<p>His sharpen&rsquo;d visage, and draws down the ears</p>\n\t\t<p>Into the head, as doth the slug his horns.</p>\n\t\t<p>His tongue continuous before and apt</p>\n\t\t<p>For utt&rsquo;rance, severs; and the other&rsquo;s fork</p>\n\t\t<p>Closing unites. That done the smoke was laid.</p>\n\t\t<p>The soul, transform&rsquo;d into the brute, glides off,</p>\n\t\t<p>Hissing along the vale, and after him</p>\n\t\t<p>The other talking sputters; but soon turn&rsquo;d</p>\n\t\t<p>His new-grown shoulders on him, and in few</p>\n\t\t<p>Thus to another spake: &ldquo;Along this path</p>\n\t\t<p>Crawling, as I have done, speed Buoso now!&rdquo;</p>\n\t\t<p class="slindent">So saw I fluctuate in successive change</p>\n\t\t<p>Th&rsquo; unsteady ballast of the seventh hold:</p>\n\t\t<p>And here if aught my tongue have swerv&rsquo;d, events</p>\n\t\t<p>So strange may be its warrant. O&rsquo;er mine eyes</p>\n\t\t<p>Confusion hung, and on my thoughts amaze.</p>\n\t\t<p class="slindent">Yet &rsquo;scap&rsquo;d they not so covertly, but well</p>\n\t\t<p>I mark&rsquo;d Sciancato: he alone it was</p>\n\t\t<p>Of the three first that came, who chang&rsquo;d not: thou,</p>\n\t\t<p>The other&rsquo;s fate, Gaville, still dost rue.</p>\n\t\t</div>','<p class="cantohead">Canto XXVI</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">Florence</span> exult! for thou so mightily</p>\n\t\t<p>Hast thriven, that o&rsquo;er land and sea thy wings</p>\n\t\t<p>Thou beatest, and thy name spreads over hell!</p>\n\t\t<p>Among the plund&rsquo;rers such the three I found</p>\n\t\t<p>Thy citizens, whence shame to me thy son,</p>\n\t\t<p>And no proud honour to thyself redounds.</p>\n\t\t<p class="slindent">But if our minds, when dreaming near the dawn,</p>\n\t\t<p>Are of the truth presageful, thou ere long</p>\n\t\t<p>Shalt feel what Prato, (not to say the rest)</p>\n\t\t<p>Would fain might come upon thee; and that chance</p>\n\t\t<p>Were in good time, if it befell thee now.</p>\n\t\t<p>Would so it were, since it must needs befall!</p>\n\t\t<p>For as time wears me, I shall grieve the more.</p>\n\t\t<p class="slindent">We from the depth departed; and my guide</p>\n\t\t<p>Remounting scal&rsquo;d the flinty steps, which late</p>\n\t\t<p>We downward trac&rsquo;d, and drew me up the steep.</p>\n\t\t<p>Pursuing thus our solitary way</p>\n\t\t<p>Among the crags and splinters of the rock,</p>\n\t\t<p>Sped not our feet without the help of hands.</p>\n\t\t<p class="slindent">Then sorrow seiz&rsquo;d me, which e&rsquo;en now revives,</p>\n\t\t<p>As my thought turns again to what I saw,</p>\n\t\t<p>And, more than I am wont, I rein and curb</p>\n\t\t<p>The powers of nature in me, lest they run</p>\n\t\t<p>Where Virtue guides not; that if aught of good</p>\n\t\t<p>My gentle star, or something better gave me,</p>\n\t\t<p>I envy not myself the precious boon.</p>\n\t\t<p class="slindent">As in that season, when the sun least veils</p>\n\t\t<p>His face that lightens all, what time the fly</p>\n\t\t<p>Gives way to the shrill gnat, the peasant then</p>\n\t\t<p>Upon some cliff reclin&rsquo;d, beneath him sees</p>\n\t\t<p>Fire-flies innumerous spangling o&rsquo;er the vale,</p>\n\t\t<p>Vineyard or tilth, where his day-labour lies:</p>\n\t\t<p>With flames so numberless throughout its space</p>\n\t\t<p>Shone the eighth chasm, apparent, when the depth</p>\n\t\t<p>Was to my view expos&rsquo;d. As he, whose wrongs</p>\n\t\t<p>The bears aveng&rsquo;d, at its departure saw</p>\n\t\t<p>Elijah&rsquo;s chariot, when the steeds erect</p>\n\t\t<p>Rais&rsquo;d their steep flight for heav&rsquo;n; his eyes meanwhile,</p>\n\t\t<p>Straining pursu&rsquo;d them, till the flame alone</p>\n\t\t<p>Upsoaring like a misty speck he kenn&rsquo;d;</p>\n\t\t<p>E&rsquo;en thus along the gulf moves every flame,</p>\n\t\t<p>A sinner so enfolded close in each,</p>\n\t\t<p>That none exhibits token of the theft.</p>\n\t\t<p class="slindent">Upon the bridge I forward bent to look,</p>\n\t\t<p>And grasp&rsquo;d a flinty mass, or else had fall&rsquo;n,</p>\n\t\t<p>Though push&rsquo;d not from the height. The guide, who mark&rsquo;d</p>\n\t\t<p>How I did gaze attentive, thus began:</p>\n\t\t<p>&ldquo;Within these ardours are the spirits, each</p>\n\t\t<p>Swath&rsquo;d in confining fire.&rdquo;&mdash;&ldquo;Master, thy word,&rdquo;</p>\n\t\t<p>I answer&rsquo;d, &ldquo;hath assur&rsquo;d me; yet I deem&rsquo;d</p>\n\t\t<p>Already of the truth, already wish&rsquo;d</p>\n\t\t<p>To ask thee, who is in yon fire, that comes</p>\n\t\t<p>So parted at the summit, as it seem&rsquo;d</p>\n\t\t<p>Ascending from that funeral pile, where lay</p>\n\t\t<p>The Theban brothers?&rdquo; He replied: &ldquo;Within</p>\n\t\t<p>Ulysses there and Diomede endure</p>\n\t\t<p>Their penal tortures, thus to vengeance now</p>\n\t\t<p>Together hasting, as erewhile to wrath.</p>\n\t\t<p>These in the flame with ceaseless groans deplore</p>\n\t\t<p>The ambush of the horse, that open&rsquo;d wide</p>\n\t\t<p>A portal for that goodly seed to pass,</p>\n\t\t<p>Which sow&rsquo;d imperial Rome; nor less the guile</p>\n\t\t<p>Lament they, whence of her Achilles &rsquo;reft</p>\n\t\t<p>Deidamia yet in death complains.</p>\n\t\t<p>And there is rued the stratagem, that Troy</p>\n\t\t<p>Of her Palladium spoil&rsquo;d.&rdquo;&mdash;&ldquo;If they have power</p>\n\t\t<p>Of utt&rsquo;rance from within these sparks,&rdquo; said I,</p>\n\t\t<p>&ldquo;O master! think my prayer a thousand fold</p>\n\t\t<p>In repetition urg&rsquo;d, that thou vouchsafe</p>\n\t\t<p>To pause, till here the horned flame arrive.</p>\n\t\t<p>See, how toward it with desire I bend.&rdquo;</p>\n\t\t<p class="slindent">He thus: &ldquo;Thy prayer is worthy of much praise,</p>\n\t\t<p>And I accept it therefore: but do thou</p>\n\t\t<p>Thy tongue refrain: to question them be mine,</p>\n\t\t<p>For I divine thy wish: and they perchance,</p>\n\t\t<p>For they were Greeks, might shun discourse with thee.&rdquo;</p>\n\t\t<p class="slindent">When there the flame had come, where time and place</p>\n\t\t<p>Seem&rsquo;d fitting to my guide, he thus began:</p>\n\t\t<p>&ldquo;O ye, who dwell two spirits in one fire!</p>\n\t\t<p>If living I of you did merit aught,</p>\n\t\t<p>Whate&rsquo;er the measure were of that desert,</p>\n\t\t<p>When in the world my lofty strain I pour&rsquo;d,</p>\n\t\t<p>Move ye not on, till one of you unfold</p>\n\t\t<p>In what clime death o&rsquo;ertook him self-destroy&rsquo;d.&rdquo;</p>\n\t\t<p class="slindent">Of the old flame forthwith the greater horn</p>\n\t\t<p>Began to roll, murmuring, as a fire</p>\n\t\t<p>That labours with the wind, then to and fro</p>\n\t\t<p>Wagging the top, as a tongue uttering sounds,</p>\n\t\t<p>Threw out its voice, and spake: &ldquo;When I escap&rsquo;d</p>\n\t\t<p>From Circe, who beyond a circling year</p>\n\t\t<p>Had held me near Caieta, by her charms,</p>\n\t\t<p>Ere thus Aeneas yet had nam&rsquo;d the shore,</p>\n\t\t<p>Nor fondness for my son, nor reverence</p>\n\t\t<p>Of my old father, nor return of love,</p>\n\t\t<p>That should have crown&rsquo;d Penelope with joy,</p>\n\t\t<p>Could overcome in me the zeal I had</p>\n\t\t<p>T&rsquo; explore the world, and search the ways of life,</p>\n\t\t<p>Man&rsquo;s evil and his virtue. Forth I sail&rsquo;d</p>\n\t\t<p>Into the deep illimitable main,</p>\n\t\t<p>With but one bark, and the small faithful band</p>\n\t\t<p>That yet cleav&rsquo;d to me. As Iberia far,</p>\n\t\t<p>Far as Morocco either shore I saw,</p>\n\t\t<p>And the Sardinian and each isle beside</p>\n\t\t<p>Which round that ocean bathes. Tardy with age</p>\n\t\t<p>Were I and my companions, when we came</p>\n\t\t<p>To the strait pass, where Hercules ordain&rsquo;d</p>\n\t\t<p>The bound&rsquo;ries not to be o&rsquo;erstepp&rsquo;d by man.</p>\n\t\t<p>The walls of Seville to my right I left,</p>\n\t\t<p>On the&rsquo; other hand already Ceuta past.</p>\n\t\t<p>&ldquo;O brothers!&rdquo; I began, &ldquo;who to the west</p>\n\t\t<p>Through perils without number now have reach&rsquo;d,</p>\n\t\t<p>To this the short remaining watch, that yet</p>\n\t\t<p>Our senses have to wake, refuse not proof</p>\n\t\t<p>Of the unpeopled world, following the track</p>\n\t\t<p>Of Phoebus. Call to mind from whence we sprang:</p>\n\t\t<p>Ye were not form&rsquo;d to live the life of brutes</p>\n\t\t<p>But virtue to pursue and knowledge high.</p>\n\t\t<p>With these few words I sharpen&rsquo;d for the voyage</p>\n\t\t<p>The mind of my associates, that I then</p>\n\t\t<p>Could scarcely have withheld them. To the dawn</p>\n\t\t<p>Our poop we turn&rsquo;d, and for the witless flight</p>\n\t\t<p>Made our oars wings, still gaining on the left.</p>\n\t\t<p>Each star of the&rsquo; other pole night now beheld,</p>\n\t\t<p>And ours so low, that from the ocean-floor</p>\n\t\t<p>It rose not. Five times re-illum&rsquo;d, as oft</p>\n\t\t<p>Vanish&rsquo;d the light from underneath the moon</p>\n\t\t<p>Since the deep way we enter&rsquo;d, when from far</p>\n\t\t<p>Appear&rsquo;d a mountain dim, loftiest methought</p>\n\t\t<p>Of all I e&rsquo;er beheld. Joy seiz&rsquo;d us straight,</p>\n\t\t<p>But soon to mourning changed. From the new land</p>\n\t\t<p>A whirlwind sprung, and at her foremost side</p>\n\t\t<p>Did strike the vessel. Thrice it whirl&rsquo;d her round</p>\n\t\t<p>With all the waves, the fourth time lifted up</p>\n\t\t<p>The poop, and sank the prow: so fate decreed:</p>\n\t\t<p>And over us the booming billow clos&rsquo;d.&rdquo;</p>\n\t\t</div>','<p class="cantohead">Canto XVII</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">Now</span> upward rose the flame, and still&rsquo;d its light</p>\n\t\t<p>To speak no more, and now pass&rsquo;d on with leave</p>\n\t\t<p>From the mild poet gain&rsquo;d, when following came</p>\n\t\t<p>Another, from whose top a sound confus&rsquo;d,</p>\n\t\t<p>Forth issuing, drew our eyes that way to look.</p>\n\t\t<p class="slindent">As the Sicilian bull, that rightfully</p>\n\t\t<p>His cries first echoed, who had shap&rsquo;d its mould,</p>\n\t\t<p>Did so rebellow, with the voice of him</p>\n\t\t<p>Tormented, that the brazen monster seem&rsquo;d</p>\n\t\t<p>Pierc&rsquo;d through with pain; thus while no way they found</p>\n\t\t<p>Nor avenue immediate through the flame,</p>\n\t\t<p>Into its language turn&rsquo;d the dismal words:</p>\n\t\t<p>But soon as they had won their passage forth,</p>\n\t\t<p>Up from the point, which vibrating obey&rsquo;d</p>\n\t\t<p>Their motion at the tongue, these sounds we heard:</p>\n\t\t<p>&ldquo;O thou! to whom I now direct my voice!</p>\n\t\t<p>That lately didst exclaim in Lombard phrase,</p>\n\t\t<p class="slindent">&ldquo;Depart thou, I solicit thee no more,</p>\n\t\t<p>Though somewhat tardy I perchance arrive</p>\n\t\t<p>Let it not irk thee here to pause awhile,</p>\n\t\t<p>And with me parley: lo! it irks not me</p>\n\t\t<p>And yet I burn. If but e&rsquo;en now thou fall</p>\n\t\t<p>into this blind world, from that pleasant land</p>\n\t\t<p>Of Latium, whence I draw my sum of guilt,</p>\n\t\t<p>Tell me if those, who in Romagna dwell,</p>\n\t\t<p>Have peace or war. For of the mountains there</p>\n\t\t<p>Was I, betwixt Urbino and the height,</p>\n\t\t<p>Whence Tyber first unlocks his mighty flood.&rdquo;</p>\n\t\t<p class="slindent">Leaning I listen&rsquo;d yet with heedful ear,</p>\n\t\t<p>When, as he touch&rsquo;d my side, the leader thus:</p>\n\t\t<p>&ldquo;Speak thou: he is a Latian.&rdquo; My reply</p>\n\t\t<p>Was ready, and I spake without delay:</p>\n\t\t<p class="slindent">&ldquo;O spirit! who art hidden here below!</p>\n\t\t<p>Never was thy Romagna without war</p>\n\t\t<p>In her proud tyrants&rsquo; bosoms, nor is now:</p>\n\t\t<p>But open war there left I none. The state,</p>\n\t\t<p>Ravenna hath maintain&rsquo;d this many a year,</p>\n\t\t<p>Is steadfast. There Polenta&rsquo;s eagle broods,</p>\n\t\t<p>And in his broad circumference of plume</p>\n\t\t<p>O&rsquo;ershadows Cervia. The green talons grasp</p>\n\t\t<p>The land, that stood erewhile the proof so long,</p>\n\t\t<p>And pil&rsquo;d in bloody heap the host of France.</p>\n\t\t<p class="slindent">&ldquo;The&rsquo; old mastiff of Verruchio and the young,</p>\n\t\t<p>That tore Montagna in their wrath, still make,</p>\n\t\t<p>Where they are wont, an augre of their fangs.</p>\n\t\t<p class="slindent">&ldquo;Lamone&rsquo;s city and Santerno&rsquo;s range</p>\n\t\t<p>Under the lion of the snowy lair.</p>\n\t\t<p>Inconstant partisan! that changeth sides,</p>\n\t\t<p>Or ever summer yields to winter&rsquo;s frost.</p>\n\t\t<p>And she, whose flank is wash&rsquo;d of Savio&rsquo;s wave,</p>\n\t\t<p>As &rsquo;twixt the level and the steep she lies,</p>\n\t\t<p>Lives so &rsquo;twixt tyrant power and liberty.</p>\n\t\t<p class="slindent">&ldquo;Now tell us, I entreat thee, who art thou?</p>\n\t\t<p>Be not more hard than others. In the world,</p>\n\t\t<p>So may thy name still rear its forehead high.&rdquo;</p>\n\t\t<p class="slindent">Then roar&rsquo;d awhile the fire, its sharpen&rsquo;d point</p>\n\t\t<p>On either side wav&rsquo;d, and thus breath&rsquo;d at last:</p>\n\t\t<p>&ldquo;If I did think, my answer were to one,</p>\n\t\t<p>Who ever could return unto the world,</p>\n\t\t<p>This flame should rest unshaken. But since ne&rsquo;er,</p>\n\t\t<p>If true be told me, any from this depth</p>\n\t\t<p>Has found his upward way, I answer thee,</p>\n\t\t<p>Nor fear lest infamy record the words.</p>\n\t\t<p class="slindent">&ldquo;A man of arms at first, I cloth&rsquo;d me then</p>\n\t\t<p>In good Saint Francis&rsquo; girdle, hoping so</p>\n\t\t<p>T&rsquo; have made amends. And certainly my hope</p>\n\t\t<p>Had fail&rsquo;d not, but that he, whom curses light on,</p>\n\t\t<p>The&rsquo; high priest again seduc&rsquo;d me into sin.</p>\n\t\t<p>And how and wherefore listen while I tell.</p>\n\t\t<p>Long as this spirit mov&rsquo;d the bones and pulp</p>\n\t\t<p>My mother gave me, less my deeds bespake</p>\n\t\t<p>The nature of the lion than the fox.</p>\n\t\t<p>All ways of winding subtlety I knew,</p>\n\t\t<p>And with such art conducted, that the sound</p>\n\t\t<p>Reach&rsquo;d the world&rsquo;s limit. Soon as to that part</p>\n\t\t<p>Of life I found me come, when each behoves</p>\n\t\t<p>To lower sails and gather in the lines;</p>\n\t\t<p>That which before had pleased me then I rued,</p>\n\t\t<p>And to repentance and confession turn&rsquo;d;</p>\n\t\t<p>Wretch that I was! and well it had bested me!</p>\n\t\t<p>The chief of the new Pharisees meantime,</p>\n\t\t<p>Waging his warfare near the Lateran,</p>\n\t\t<p>Not with the Saracens or Jews (his foes</p>\n\t\t<p>All Christians were, nor against Acre one</p>\n\t\t<p>Had fought, nor traffic&rsquo;d in the Soldan&rsquo;s land),</p>\n\t\t<p>He his great charge nor sacred ministry</p>\n\t\t<p>In himself, rev&rsquo;renc&rsquo;d, nor in me that cord,</p>\n\t\t<p>Which us&rsquo;d to mark with leanness whom it girded.</p>\n\t\t<p>As in Socrate, Constantine besought</p>\n\t\t<p>To cure his leprosy Sylvester&rsquo;s aid,</p>\n\t\t<p>So me to cure the fever of his pride</p>\n\t\t<p>This man besought: my counsel to that end</p>\n\t\t<p>He ask&rsquo;d: and I was silent: for his words</p>\n\t\t<p>Seem&rsquo;d drunken: but forthwith he thus resum&rsquo;d:</p>\n\t\t<p>&rsquo;From thy heart banish fear: of all offence</p>\n\t\t<p>I hitherto absolve thee. In return,</p>\n\t\t<p>Teach me my purpose so to execute,</p>\n\t\t<p>That Penestrino cumber earth no more.</p>\n\t\t<p>Heav&rsquo;n, as thou knowest, I have power to shut</p>\n\t\t<p>And open: and the keys are therefore twain,</p>\n\t\t<p>The which my predecessor meanly priz&rsquo;d.&rsquo;&nbsp;&rdquo;</p>\n\t\t<p class="slindent">Then, yielding to the forceful arguments,</p>\n\t\t<p>Of silence as more perilous I deem&rsquo;d,</p>\n\t\t<p>And answer&rsquo;d: &ldquo;Father! since thou washest me</p>\n\t\t<p>Clear of that guilt wherein I now must fall,</p>\n\t\t<p>Large promise with performance scant, be sure,</p>\n\t\t<p>Shall make thee triumph in thy lofty seat.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;When I was number&rsquo;d with the dead, then came</p>\n\t\t<p>Saint Francis for me; but a cherub dark</p>\n\t\t<p>He met, who cried: &lsquo;Wrong me not; he is mine,</p>\n\t\t<p>And must below to join the wretched crew,</p>\n\t\t<p>For the deceitful counsel which he gave.</p>\n\t\t<p>E&rsquo;er since I watch&rsquo;d him, hov&rsquo;ring at his hair,</p>\n\t\t<p>No power can the impenitent absolve;</p>\n\t\t<p>Nor to repent and will at once consist,</p>\n\t\t<p>By contradiction absolute forbid.&rsquo;&nbsp;&rdquo;</p>\n\t\t<p>Oh mis&rsquo;ry! how I shook myself, when he</p>\n\t\t<p>Seiz&rsquo;d me, and cried, &ldquo;Thou haply thought&rsquo;st me not</p>\n\t\t<p>A disputant in logic so exact.&rdquo;</p>\n\t\t<p>To Minos down he bore me, and the judge</p>\n\t\t<p>Twin&rsquo;d eight times round his callous back the tail,</p>\n\t\t<p>Which biting with excess of rage, he spake:</p>\n\t\t<p>&ldquo;This is a guilty soul, that in the fire</p>\n\t\t<p>Must vanish. Hence perdition-doom&rsquo;d I rove</p>\n\t\t<p>A prey to rankling sorrow in this garb.&rdquo;</p>\n\t\t<p class="slindent">When he had thus fulfill&rsquo;d his words, the flame</p>\n\t\t<p>In dolour parted, beating to and fro,</p>\n\t\t<p>And writhing its sharp horn. We onward went,</p>\n\t\t<p>I and my leader, up along the rock,</p>\n\t\t<p>Far as another arch, that overhangs</p>\n\t\t<p>The foss, wherein the penalty is paid</p>\n\t\t<p>Of those, who load them with committed sin.</p>\n\t\t</div>','<p class="cantohead">Canto XXVIII</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">Who</span>, e&rsquo;en in words unfetter&rsquo;d, might at full</p>\n\t\t<p>Tell of the wounds and blood that now I saw,</p>\n\t\t<p>Though he repeated oft the tale? No tongue</p>\n\t\t<p>So vast a theme could equal, speech and thought</p>\n\t\t<p>Both impotent alike. If in one band</p>\n\t\t<p>Collected, stood the people all, who e&rsquo;er</p>\n\t\t<p>Pour&rsquo;d on Apulia&rsquo;s happy soil their blood,</p>\n\t\t<p>Slain by the Trojans, and in that long war</p>\n\t\t<p>When of the rings the measur&rsquo;d booty made</p>\n\t\t<p>A pile so high, as Rome&rsquo;s historian writes</p>\n\t\t<p>Who errs not, with the multitude, that felt</p>\n\t\t<p>The grinding force of Guiscard&rsquo;s Norman steel,</p>\n\t\t<p>And those the rest, whose bones are gather&rsquo;d yet</p>\n\t\t<p>At Ceperano, there where treachery</p>\n\t\t<p>Branded th&rsquo; Apulian name, or where beyond</p>\n\t\t<p>Thy walls, O Tagliacozzo, without arms</p>\n\t\t<p>The old Alardo conquer&rsquo;d; and his limbs</p>\n\t\t<p>One were to show transpierc&rsquo;d, another his</p>\n\t\t<p>Clean lopt away; a spectacle like this</p>\n\t\t<p>Were but a thing of nought, to the&rsquo; hideous sight</p>\n\t\t<p>Of the ninth chasm. A rundlet, that hath lost</p>\n\t\t<p>Its middle or side stave, gapes not so wide,</p>\n\t\t<p>As one I mark&rsquo;d, torn from the chin throughout</p>\n\t\t<p>Down to the hinder passage: &rsquo;twixt the legs</p>\n\t\t<p>Dangling his entrails hung, the midriff lay</p>\n\t\t<p>Open to view, and wretched ventricle,</p>\n\t\t<p>That turns th&rsquo; englutted aliment to dross.</p>\n\t\t<p class="slindent">Whilst eagerly I fix on him my gaze,</p>\n\t\t<p>He ey&rsquo;d me, with his hands laid his breast bare,</p>\n\t\t<p>And cried; &ldquo;Now mark how I do rip me! lo!</p>\n\t\t<p>&ldquo;How is Mohammed mangled! before me</p>\n\t\t<p>Walks Ali weeping, from the chin his face</p>\n\t\t<p>Cleft to the forelock; and the others all</p>\n\t\t<p>Whom here thou seest, while they liv&rsquo;d, did sow</p>\n\t\t<p>Scandal and schism, and therefore thus are rent.</p>\n\t\t<p>A fiend is here behind, who with his sword</p>\n\t\t<p>Hacks us thus cruelly, slivering again</p>\n\t\t<p>Each of this ream, when we have compast round</p>\n\t\t<p>The dismal way, for first our gashes close</p>\n\t\t<p>Ere we repass before him. But say who</p>\n\t\t<p>Art thou, that standest musing on the rock,</p>\n\t\t<p>Haply so lingering to delay the pain</p>\n\t\t<p>Sentenc&rsquo;d upon thy crimes?&rdquo;&mdash;&ldquo;Him death not yet,&rdquo;</p>\n\t\t<p>My guide rejoin&rsquo;d, &ldquo;hath overta&rsquo;en, nor sin</p>\n\t\t<p>Conducts to torment; but, that he may make</p>\n\t\t<p>Full trial of your state, I who am dead</p>\n\t\t<p>Must through the depths of hell, from orb to orb,</p>\n\t\t<p>Conduct him. Trust my words, for they are true.&rdquo;</p>\n\t\t<p class="slindent">More than a hundred spirits, when that they heard,</p>\n\t\t<p>Stood in the foss to mark me, through amazed,</p>\n\t\t<p>Forgetful of their pangs. &ldquo;Thou, who perchance</p>\n\t\t<p>Shalt shortly view the sun, this warning thou</p>\n\t\t<p>Bear to Dolcino: bid him, if he wish not</p>\n\t\t<p>Here soon to follow me, that with good store</p>\n\t\t<p>Of food he arm him, lest impris&rsquo;ning snows</p>\n\t\t<p>Yield him a victim to Novara&rsquo;s power,</p>\n\t\t<p>No easy conquest else.&rdquo; With foot uprais&rsquo;d</p>\n\t\t<p>For stepping, spake Mohammed, on the ground</p>\n\t\t<p>Then fix&rsquo;d it to depart. Another shade,</p>\n\t\t<p>Pierc&rsquo;d in the throat, his nostrils mutilate</p>\n\t\t<p>E&rsquo;en from beneath the eyebrows, and one ear</p>\n\t\t<p>Lopt off, who with the rest through wonder stood</p>\n\t\t<p>Gazing, before the rest advanc&rsquo;d, and bar&rsquo;d</p>\n\t\t<p>His wind-pipe, that without was all o&rsquo;ersmear&rsquo;d</p>\n\t\t<p>With crimson stain. &ldquo;O thou!&rdquo; said he, &ldquo;whom sin</p>\n\t\t<p>Condemns not, and whom erst (unless too near</p>\n\t\t<p>Resemblance do deceive me) I aloft</p>\n\t\t<p>Have seen on Latian ground, call thou to mind</p>\n\t\t<p>Piero of Medicina, if again</p>\n\t\t<p>Returning, thou behold&rsquo;st the pleasant land</p>\n\t\t<p>That from Vercelli slopes to Mercabo;</p>\n\t\t<p>&ldquo;And there instruct the twain, whom Fano boasts</p>\n\t\t<p>Her worthiest sons, Guido and Angelo,</p>\n\t\t<p>That if &rsquo;t is giv&rsquo;n us here to scan aright</p>\n\t\t<p>The future, they out of life&rsquo;s tenement</p>\n\t\t<p>Shall be cast forth, and whelm&rsquo;d under the waves</p>\n\t\t<p>Near to Cattolica, through perfidy</p>\n\t\t<p>Of a fell tyrant. &rsquo;Twixt the Cyprian isle</p>\n\t\t<p>And Balearic, ne&rsquo;er hath Neptune seen</p>\n\t\t<p>An injury so foul, by pirates done</p>\n\t\t<p>Or Argive crew of old. That one-ey&rsquo;d traitor</p>\n\t\t<p>(Whose realm there is a spirit here were fain</p>\n\t\t<p>His eye had still lack&rsquo;d sight of) them shall bring</p>\n\t\t<p>To conf&rsquo;rence with him, then so shape his end,</p>\n\t\t<p>That they shall need not &rsquo;gainst Focara&rsquo;s wind</p>\n\t\t<p>Offer up vow nor pray&rsquo;r.&rdquo; I answering thus:</p>\n\t\t<p class="slindent">&ldquo;Declare, as thou dost wish that I above</p>\n\t\t<p>May carry tidings of thee, who is he,</p>\n\t\t<p>In whom that sight doth wake such sad remembrance?&rdquo;</p>\n\t\t<p class="slindent">Forthwith he laid his hand on the cheek-bone</p>\n\t\t<p>Of one, his fellow-spirit, and his jaws</p>\n\t\t<p>Expanding, cried: &ldquo;Lo! this is he I wot of;</p>\n\t\t<p>He speaks not for himself: the outcast this</p>\n\t\t<p>Who overwhelm&rsquo;d the doubt in Caesar&rsquo;s mind,</p>\n\t\t<p>Affirming that delay to men prepar&rsquo;d</p>\n\t\t<p>Was ever harmful.&rdquo; Oh how terrified</p>\n\t\t<p>Methought was Curio, from whose throat was cut</p>\n\t\t<p>The tongue, which spake that hardy word. Then one</p>\n\t\t<p>Maim&rsquo;d of each hand, uplifted in the gloom</p>\n\t\t<p>The bleeding stumps, that they with gory spots</p>\n\t\t<p>Sullied his face, and cried: &ldquo;&nbsp;&lsquo;Remember thee</p>\n\t\t<p>Of Mosca, too, I who, alas! exclaim&rsquo;d,</p>\n\t\t<p>&rsquo;The deed once done there is an end,&rsquo; that prov&rsquo;d</p>\n\t\t<p>A seed of sorrow to the Tuscan race.&rdquo;</p>\n\t\t<p class="slindent">I added: &ldquo;Ay, and death to thine own tribe.&rdquo;</p>\n\t\t<p class="slindent">Whence heaping woe on woe he hurried off,</p>\n\t\t<p>As one grief stung to madness. But I there</p>\n\t\t<p>Still linger&rsquo;d to behold the troop, and saw</p>\n\t\t<p>Things, such as I may fear without more proof</p>\n\t\t<p>To tell of, but that conscience makes me firm,</p>\n\t\t<p>The boon companion, who her strong breast-plate</p>\n\t\t<p>Buckles on him, that feels no guilt within</p>\n\t\t<p>And bids him on and fear not. Without doubt</p>\n\t\t<p>I saw, and yet it seems to pass before me,</p>\n\t\t<p>A headless trunk, that even as the rest</p>\n\t\t<p>Of the sad flock pac&rsquo;d onward. By the hair</p>\n\t\t<p>It bore the sever&rsquo;d member, lantern-wise</p>\n\t\t<p>Pendent in hand, which look&rsquo;d at us and said,</p>\n\t\t<p>&ldquo;Woe&rsquo;s me!&rdquo; The spirit lighted thus himself,</p>\n\t\t<p>And two there were in one, and one in two.</p>\n\t\t<p>How that may be he knows who ordereth so.</p>\n\t\t<p class="slindent">When at the bridge&rsquo;s foot direct he stood,</p>\n\t\t<p>His arm aloft he rear&rsquo;d, thrusting the head</p>\n\t\t<p>Full in our view, that nearer we might hear</p>\n\t\t<p>The words, which thus it utter&rsquo;d: &ldquo;Now behold</p>\n\t\t<p>This grievous torment, thou, who breathing go&rsquo;st</p>\n\t\t<p>To spy the dead; behold if any else</p>\n\t\t<p>Be terrible as this. And that on earth</p>\n\t\t<p>Thou mayst bear tidings of me, know that I</p>\n\t\t<p>Am Bertrand, he of Born, who gave King John</p>\n\t\t<p>The counsel mischievous. Father and son</p>\n\t\t<p>I set at mutual war. For Absalom</p>\n\t\t<p>And David more did not Ahitophel,</p>\n\t\t<p>Spurring them on maliciously to strife.</p>\n\t\t<p>For parting those so closely knit, my brain</p>\n\t\t<p>Parted, alas! I carry from its source,</p>\n\t\t<p>That in this trunk inhabits. Thus the law</p>\n\t\t<p>Of retribution fiercely works in me.&rdquo;</p>\n\t\t</div>','<p class="cantohead">Canto XXIX</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">So</span> were mine eyes inebriate with view</p>\n\t\t<p>Of the vast multitude, whom various wounds</p>\n\t\t<p>Disfigur&rsquo;d, that they long&rsquo;d to stay and weep.</p>\n\t\t<p class="slindent">But Virgil rous&rsquo;d me: &ldquo;What yet gazest on?</p>\n\t\t<p>Wherefore doth fasten yet thy sight below</p>\n\t\t<p>Among the maim&rsquo;d and miserable shades?</p>\n\t\t<p>Thou hast not shewn in any chasm beside</p>\n\t\t<p>This weakness. Know, if thou wouldst number them</p>\n\t\t<p>That two and twenty miles the valley winds</p>\n\t\t<p>Its circuit, and already is the moon</p>\n\t\t<p>Beneath our feet: the time permitted now</p>\n\t\t<p>Is short, and more not seen remains to see.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;If thou,&rdquo; I straight replied, &ldquo;hadst weigh&rsquo;d the cause</p>\n\t\t<p>For which I look&rsquo;d, thou hadst perchance excus&rsquo;d</p>\n\t\t<p>The tarrying still.&rdquo; My leader part pursu&rsquo;d</p>\n\t\t<p>His way, the while I follow&rsquo;d, answering him,</p>\n\t\t<p>And adding thus: &ldquo;Within that cave I deem,</p>\n\t\t<p>Whereon so fixedly I held my ken,</p>\n\t\t<p>There is a spirit dwells, one of my blood,</p>\n\t\t<p>Wailing the crime that costs him now so dear.&rdquo;</p>\n\t\t<p class="slindent">Then spake my master: &ldquo;Let thy soul no more</p>\n\t\t<p>Afflict itself for him. Direct elsewhere</p>\n\t\t<p>Its thought, and leave him. At the bridge&rsquo;s foot</p>\n\t\t<p>I mark&rsquo;d how he did point with menacing look</p>\n\t\t<p>At thee, and heard him by the others nam&rsquo;d</p>\n\t\t<p>Geri of Bello. Thou so wholly then</p>\n\t\t<p>Wert busied with his spirit, who once rul&rsquo;d</p>\n\t\t<p>The towers of Hautefort, that thou lookedst not</p>\n\t\t<p>That way, ere he was gone.&rdquo;&mdash;&ldquo;O guide belov&rsquo;d!</p>\n\t\t<p>His violent death yet unaveng&rsquo;d,&rdquo; said I,</p>\n\t\t<p>&ldquo;By any, who are partners in his shame,</p>\n\t\t<p>Made him contemptuous: therefore, as I think,</p>\n\t\t<p>He pass&rsquo;d me speechless by; and doing so</p>\n\t\t<p>Hath made me more compassionate his fate.&rdquo;</p>\n\t\t<p class="slindent">So we discours&rsquo;d to where the rock first show&rsquo;d</p>\n\t\t<p>The other valley, had more light been there,</p>\n\t\t<p>E&rsquo;en to the lowest depth. Soon as we came</p>\n\t\t<p>O&rsquo;er the last cloister in the dismal rounds</p>\n\t\t<p>Of Malebolge, and the brotherhood</p>\n\t\t<p>Were to our view expos&rsquo;d, then many a dart</p>\n\t\t<p>Of sore lament assail&rsquo;d me, headed all</p>\n\t\t<p>With points of thrilling pity, that I clos&rsquo;d</p>\n\t\t<p>Both ears against the volley with mine hands.</p>\n\t\t<p class="slindent">As were the torment, if each lazar-house</p>\n\t\t<p>Of Valdichiana, in the sultry time</p>\n\t\t<p>&rsquo;Twixt July and September, with the isle</p>\n\t\t<p>Sardinia and Maremma&rsquo;s pestilent fen,</p>\n\t\t<p>Had heap&rsquo;d their maladies all in one foss</p>\n\t\t<p>Together; such was here the torment: dire</p>\n\t\t<p>The stench, as issuing steams from fester&rsquo;d limbs.</p>\n\t\t<p class="slindent">We on the utmost shore of the long rock</p>\n\t\t<p>Descended still to leftward. Then my sight</p>\n\t\t<p>Was livelier to explore the depth, wherein</p>\n\t\t<p>The minister of the most mighty Lord,</p>\n\t\t<p>All-searching Justice, dooms to punishment</p>\n\t\t<p>The forgers noted on her dread record.</p>\n\t\t<p class="slindent">More rueful was it not methinks to see</p>\n\t\t<p>The nation in Aegina droop, what time</p>\n\t\t<p>Each living thing, e&rsquo;en to the little worm,</p>\n\t\t<p>All fell, so full of malice was the air</p>\n\t\t<p>(And afterward, as bards of yore have told,</p>\n\t\t<p>The ancient people were restor&rsquo;d anew</p>\n\t\t<p>From seed of emmets) than was here to see</p>\n\t\t<p>The spirits, that languish&rsquo;d through the murky vale</p>\n\t\t<p>Up-pil&rsquo;d on many a stack. Confus&rsquo;d they lay,</p>\n\t\t<p>One o&rsquo;er the belly, o&rsquo;er the shoulders one</p>\n\t\t<p>Roll&rsquo;d of another; sideling crawl&rsquo;d a third</p>\n\t\t<p>Along the dismal pathway. Step by step</p>\n\t\t<p>We journey&rsquo;d on, in silence looking round</p>\n\t\t<p>And list&rsquo;ning those diseas&rsquo;d, who strove in vain</p>\n\t\t<p>To lift their forms. Then two I mark&rsquo;d, that sat</p>\n\t\t<p>Propp&rsquo;d &rsquo;gainst each other, as two brazen pans</p>\n\t\t<p>Set to retain the heat. From head to foot,</p>\n\t\t<p>A tetter bark&rsquo;d them round. Nor saw I e&rsquo;er</p>\n\t\t<p>Groom currying so fast, for whom his lord</p>\n\t\t<p>Impatient waited, or himself perchance</p>\n\t\t<p>Tir&rsquo;d with long watching, as of these each one</p>\n\t\t<p>Plied quickly his keen nails, through furiousness</p>\n\t\t<p>Of ne&rsquo;er abated pruriency. The crust</p>\n\t\t<p>Came drawn from underneath in flakes, like scales</p>\n\t\t<p>Scrap&rsquo;d from the bream or fish of broader mail.</p>\n\t\t<p class="slindent">&ldquo;O thou, who with thy fingers rendest off</p>\n\t\t<p>Thy coat of proof,&rdquo; thus spake my guide to one,</p>\n\t\t<p>&ldquo;And sometimes makest tearing pincers of them,</p>\n\t\t<p>Tell me if any born of Latian land</p>\n\t\t<p>Be among these within: so may thy nails</p>\n\t\t<p>Serve thee for everlasting to this toil.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;Both are of Latium,&rdquo; weeping he replied,</p>\n\t\t<p>&ldquo;Whom tortur&rsquo;d thus thou seest: but who art thou</p>\n\t\t<p>That hast inquir&rsquo;d of us?&rdquo; To whom my guide:</p>\n\t\t<p>&ldquo;One that descend with this man, who yet lives,</p>\n\t\t<p>From rock to rock, and show him hell&rsquo;s abyss.&rdquo;</p>\n\t\t<p class="slindent">Then started they asunder, and each turn&rsquo;d</p>\n\t\t<p>Trembling toward us, with the rest, whose ear</p>\n\t\t<p>Those words redounding struck. To me my liege</p>\n\t\t<p>Address&rsquo;d him: &ldquo;Speak to them whate&rsquo;er thou list.&rdquo;</p>\n\t\t<p class="slindent">And I therewith began: &ldquo;So may no time</p>\n\t\t<p>Filch your remembrance from the thoughts of men</p>\n\t\t<p>In th&rsquo; upper world, but after many suns</p>\n\t\t<p>Survive it, as ye tell me, who ye are,</p>\n\t\t<p>And of what race ye come. Your punishment,</p>\n\t\t<p>Unseemly and disgustful in its kind,</p>\n\t\t<p>Deter you not from opening thus much to me.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;Arezzo was my dwelling,&rdquo; answer&rsquo;d one,</p>\n\t\t<p>&ldquo;And me Albero of Sienna brought</p>\n\t\t<p>To die by fire; but that, for which I died,</p>\n\t\t<p>Leads me not here. True is in sport I told him,</p>\n\t\t<p>That I had learn&rsquo;d to wing my flight in air.</p>\n\t\t<p>And he admiring much, as he was void</p>\n\t\t<p>Of wisdom, will&rsquo;d me to declare to him</p>\n\t\t<p>The secret of mine art: and only hence,</p>\n\t\t<p>Because I made him not a Daedalus,</p>\n\t\t<p>Prevail&rsquo;d on one suppos&rsquo;d his sire to burn me.</p>\n\t\t<p>But Minos to this chasm last of the ten,</p>\n\t\t<p>For that I practis&rsquo;d alchemy on earth,</p>\n\t\t<p>Has doom&rsquo;d me. Him no subterfuge eludes.&rdquo;</p>\n\t\t<p class="slindent">Then to the bard I spake: &ldquo;Was ever race</p>\n\t\t<p>Light as Sienna&rsquo;s? Sure not France herself</p>\n\t\t<p>Can show a tribe so frivolous and vain.&rdquo;</p>\n\t\t<p class="slindent">The other leprous spirit heard my words,</p>\n\t\t<p>And thus return&rsquo;d: &ldquo;Be Stricca from this charge</p>\n\t\t<p>Exempted, he who knew so temp&rsquo;rately</p>\n\t\t<p>To lay out fortune&rsquo;s gifts; and Niccolo</p>\n\t\t<p>Who first the spice&rsquo;s costly luxury</p>\n\t\t<p>Discover&rsquo;d in that garden, where such seed</p>\n\t\t<p>Roots deepest in the soil: and be that troop</p>\n\t\t<p>Exempted, with whom Caccia of Asciano</p>\n\t\t<p>Lavish&rsquo;d his vineyards and wide-spreading woods,</p>\n\t\t<p>And his rare wisdom Abbagliato show&rsquo;d</p>\n\t\t<p>A spectacle for all. That thou mayst know</p>\n\t\t<p>Who seconds thee against the Siennese</p>\n\t\t<p>Thus gladly, bend this way thy sharpen&rsquo;d sight,</p>\n\t\t<p>That well my face may answer to thy ken;</p>\n\t\t<p>So shalt thou see I am Capocchio&rsquo;s ghost,</p>\n\t\t<p>Who forg&rsquo;d transmuted metals by the power</p>\n\t\t<p>Of alchemy; and if I scan thee right,</p>\n\t\t<p>Thus needs must well remember how I aped</p>\n\t\t<p>Creative nature by my subtle art.&rdquo;</p>\n\t\t</div>','<p class="cantohead">Canto XXX</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">What</span> time resentment burn&rsquo;d in Juno&rsquo;s breast</p>\n\t\t<p>For Semele against the Theban blood,</p>\n\t\t<p>As more than once in dire mischance was rued,</p>\n\t\t<p>Such fatal frenzy seiz&rsquo;d on Athamas,</p>\n\t\t<p>That he his spouse beholding with a babe</p>\n\t\t<p>Laden on either arm, &ldquo;Spread out,&rdquo; he cried,</p>\n\t\t<p>&ldquo;The meshes, that I take the lioness</p>\n\t\t<p>And the young lions at the pass:&rdquo; then forth</p>\n\t\t<p>Stretch&rsquo;d he his merciless talons, grasping one,</p>\n\t\t<p>One helpless innocent, Learchus nam&rsquo;d,</p>\n\t\t<p>Whom swinging down he dash&rsquo;d upon a rock,</p>\n\t\t<p>And with her other burden self-destroy&rsquo;d</p>\n\t\t<p>The hapless mother plung&rsquo;d: and when the pride</p>\n\t\t<p>Of all-presuming Troy fell from its height,</p>\n\t\t<p>By fortune overwhelm&rsquo;d, and the old king</p>\n\t\t<p>With his realm perish&rsquo;d, then did Hecuba,</p>\n\t\t<p>A wretch forlorn and captive, when she saw</p>\n\t\t<p>Polyxena first slaughter&rsquo;d, and her son,</p>\n\t\t<p>Her Polydorus, on the wild sea-beach</p>\n\t\t<p>Next met the mourner&rsquo;s view, then reft of sense</p>\n\t\t<p>Did she run barking even as a dog;</p>\n\t\t<p>Such mighty power had grief to wrench her soul.</p>\n\t\t<p>Bet ne&rsquo;er the Furies or of Thebes or Troy</p>\n\t\t<p>With such fell cruelty were seen, their goads</p>\n\t\t<p>Infixing in the limbs of man or beast,</p>\n\t\t<p>As now two pale and naked ghost I saw</p>\n\t\t<p>That gnarling wildly scamper&rsquo;d, like the swine</p>\n\t\t<p>Excluded from his stye. One reach&rsquo;d Capocchio,</p>\n\t\t<p>And in the neck-joint sticking deep his fangs,</p>\n\t\t<p>Dragg&rsquo;d him, that o&rsquo;er the solid pavement rubb&rsquo;d</p>\n\t\t<p>His belly stretch&rsquo;d out prone. The other shape,</p>\n\t\t<p>He of Arezzo, there left trembling, spake;</p>\n\t\t<p>&ldquo;That sprite of air is Schicchi; in like mood</p>\n\t\t<p>Of random mischief vent he still his spite.&rdquo;</p>\n\t\t<p class="slindent">To whom I answ&rsquo;ring: &ldquo;Oh! as thou dost hope,</p>\n\t\t<p>The other may not flesh its jaws on thee,</p>\n\t\t<p>Be patient to inform us, who it is,</p>\n\t\t<p>Ere it speed hence.&rdquo;&mdash;&ldquo;That is the ancient soul</p>\n\t\t<p>Of wretched Myrrha,&rdquo; he replied, &ldquo;who burn&rsquo;d</p>\n\t\t<p>With most unholy flame for her own sire,</p>\n\t\t<p>&ldquo;And a false shape assuming, so perform&rsquo;d</p>\n\t\t<p>The deed of sin; e&rsquo;en as the other there,</p>\n\t\t<p>That onward passes, dar&rsquo;d to counterfeit</p>\n\t\t<p>Donati&rsquo;s features, to feign&rsquo;d testament</p>\n\t\t<p>The seal affixing, that himself might gain,</p>\n\t\t<p>For his own share, the lady of the herd.&rdquo;</p>\n\t\t<p class="slindent">When vanish&rsquo;d the two furious shades, on whom</p>\n\t\t<p>Mine eye was held, I turn&rsquo;d it back to view</p>\n\t\t<p>The other cursed spirits. One I saw</p>\n\t\t<p>In fashion like a lute, had but the groin</p>\n\t\t<p>Been sever&rsquo;d, where it meets the forked part.</p>\n\t\t<p>Swoln dropsy, disproportioning the limbs</p>\n\t\t<p>With ill-converted moisture, that the paunch</p>\n\t\t<p>Suits not the visage, open&rsquo;d wide his lips</p>\n\t\t<p>Gasping as in the hectic man for drought,</p>\n\t\t<p>One towards the chin, the other upward curl&rsquo;d.</p>\n\t\t<p class="slindent">&ldquo;O ye, who in this world of misery,</p>\n\t\t<p>Wherefore I know not, are exempt from pain,&rdquo;</p>\n\t\t<p>Thus he began, &ldquo;attentively regard</p>\n\t\t<p>Adamo&rsquo;s woe. When living, full supply</p>\n\t\t<p>Ne&rsquo;er lack&rsquo;d me of what most I coveted;</p>\n\t\t<p>One drop of water now, alas! I crave.</p>\n\t\t<p>The rills, that glitter down the grassy slopes</p>\n\t\t<p>Of Casentino, making fresh and soft</p>\n\t\t<p>The banks whereby they glide to Arno&rsquo;s stream,</p>\n\t\t<p>Stand ever in my view; and not in vain;</p>\n\t\t<p>For more the pictur&rsquo;d semblance dries me up,</p>\n\t\t<p>Much more than the disease, which makes the flesh</p>\n\t\t<p>Desert these shrivel&rsquo;d cheeks. So from the place,</p>\n\t\t<p>Where I transgress&rsquo;d, stern justice urging me,</p>\n\t\t<p>Takes means to quicken more my lab&rsquo;ring sighs.</p>\n\t\t<p>There is Romena, where I falsified</p>\n\t\t<p>The metal with the Baptist&rsquo;s form imprest,</p>\n\t\t<p>For which on earth I left my body burnt.</p>\n\t\t<p>But if I here might see the sorrowing soul</p>\n\t\t<p>Of Guido, Alessandro, or their brother,</p>\n\t\t<p>For Branda&rsquo;s limpid spring I would not change</p>\n\t\t<p>The welcome sight. One is e&rsquo;en now within,</p>\n\t\t<p>If truly the mad spirits tell, that round</p>\n\t\t<p>Are wand&rsquo;ring. But wherein besteads me that?</p>\n\t\t<p>My limbs are fetter&rsquo;d. Were I but so light,</p>\n\t\t<p>That I each hundred years might move one inch,</p>\n\t\t<p>I had set forth already on this path,</p>\n\t\t<p>Seeking him out amidst the shapeless crew,</p>\n\t\t<p>Although eleven miles it wind, not more</p>\n\t\t<p>Than half of one across. They brought me down</p>\n\t\t<p>Among this tribe; induc&rsquo;d by them I stamp&rsquo;d</p>\n\t\t<p>The florens with three carats of alloy.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;Who are that abject pair,&rdquo; I next inquir&rsquo;d,</p>\n\t\t<p>&ldquo;That closely bounding thee upon thy right</p>\n\t\t<p>Lie smoking, like a band in winter steep&rsquo;d</p>\n\t\t<p>In the chill stream?&rdquo;&mdash;&ldquo;When to this gulf I dropt,&rdquo;</p>\n\t\t<p>He answer&rsquo;d, &ldquo;here I found them; since that hour</p>\n\t\t<p>They have not turn&rsquo;d, nor ever shall, I ween,</p>\n\t\t<p>Till time hath run his course. One is that dame</p>\n\t\t<p>The false accuser of the Hebrew youth;</p>\n\t\t<p>Sinon the other, that false Greek from Troy.</p>\n\t\t<p>Sharp fever drains the reeky moistness out,</p>\n\t\t<p>In such a cloud upsteam&rsquo;d.&rdquo; When that he heard,</p>\n\t\t<p>One, gall&rsquo;d perchance to be so darkly nam&rsquo;d,</p>\n\t\t<p>With clench&rsquo;d hand smote him on the braced paunch,</p>\n\t\t<p>That like a drum resounded: but forthwith</p>\n\t\t<p>Adamo smote him on the face, the blow</p>\n\t\t<p>Returning with his arm, that seem&rsquo;d as hard.</p>\n\t\t<p class="slindent">&ldquo;Though my o&rsquo;erweighty limbs have ta&rsquo;en from me</p>\n\t\t<p>The power to move,&rdquo; said he, &ldquo;I have an arm</p>\n\t\t<p>At liberty for such employ.&rdquo; To whom</p>\n\t\t<p>Was answer&rsquo;d: &ldquo;When thou wentest to the fire,</p>\n\t\t<p>Thou hadst it not so ready at command,</p>\n\t\t<p>Then readier when it coin&rsquo;d th&rsquo; impostor gold.&rdquo;</p>\n\t\t<p class="slindent">And thus the dropsied: &ldquo;Ay, now speak&rsquo;st thou true.</p>\n\t\t<p>But there thou gav&rsquo;st not such true testimony,</p>\n\t\t<p>When thou wast question&rsquo;d of the truth, at Troy.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;If I spake false, thou falsely stamp&rsquo;dst the coin,&rdquo;</p>\n\t\t<p>Said Sinon; &ldquo;I am here but for one fault,</p>\n\t\t<p>And thou for more than any imp beside.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;Remember,&rdquo; he replied, &ldquo;O perjur&rsquo;d one,</p>\n\t\t<p>The horse remember, that did teem with death,</p>\n\t\t<p>And all the world be witness to thy guilt.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;To thine,&rdquo; return&rsquo;d the Greek, &ldquo;witness the thirst</p>\n\t\t<p>Whence thy tongue cracks, witness the fluid mound,</p>\n\t\t<p>Rear&rsquo;d by thy belly up before thine eyes,</p>\n\t\t<p>A mass corrupt.&rdquo; To whom the coiner thus:</p>\n\t\t<p>&ldquo;Thy mouth gapes wide as ever to let pass</p>\n\t\t<p>Its evil saying. Me if thirst assails,</p>\n\t\t<p>Yet I am stuff&rsquo;d with moisture. Thou art parch&rsquo;d,</p>\n\t\t<p>Pains rack thy head, no urging would&rsquo;st thou need</p>\n\t\t<p>To make thee lap Narcissus&rsquo; mirror up.&rdquo;</p>\n\t\t<p class="slindent">I was all fix&rsquo;d to listen, when my guide</p>\n\t\t<p>Admonish&rsquo;d: &ldquo;Now beware: a little more.</p>\n\t\t<p>And I do quarrel with thee.&rdquo; I perceiv&rsquo;d</p>\n\t\t<p>How angrily he spake, and towards him turn&rsquo;d</p>\n\t\t<p>With shame so poignant, as remember&rsquo;d yet</p>\n\t\t<p>Confounds me. As a man that dreams of harm</p>\n\t\t<p>Befall&rsquo;n him, dreaming wishes it a dream,</p>\n\t\t<p>And that which is, desires as if it were not,</p>\n\t\t<p>Such then was I, who wanting power to speak</p>\n\t\t<p>Wish&rsquo;d to excuse myself, and all the while</p>\n\t\t<p>Excus&rsquo;d me, though unweeting that I did.</p>\n\t\t<p class="slindent">&ldquo;More grievous fault than thine has been, less shame,&rdquo;</p>\n\t\t<p>My master cried, &ldquo;might expiate. Therefore cast</p>\n\t\t<p>All sorrow from thy soul; and if again</p>\n\t\t<p>Chance bring thee, where like conference is held,</p>\n\t\t<p>Think I am ever at thy side. To hear</p>\n\t\t<p>Such wrangling is a joy for vulgar minds.&rdquo;</p>\n\t\t</div>','<p class="cantohead">Canto XXXI</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">The</span> very tongue, whose keen reproof before</p>\n\t\t<p>Had wounded me, that either cheek was stain&rsquo;d,</p>\n\t\t<p>Now minister&rsquo;d my cure. So have I heard,</p>\n\t\t<p>Achilles and his father&rsquo;s javelin caus&rsquo;d</p>\n\t\t<p>Pain first, and then the boon of health restor&rsquo;d.</p>\n\t\t<p class="slindent">Turning our back upon the vale of woe,</p>\n\t\t<p>W cross&rsquo;d th&rsquo; encircled mound in silence. There</p>\n\t\t<p>Was twilight dim, that far long the gloom</p>\n\t\t<p>Mine eye advanc&rsquo;d not: but I heard a horn</p>\n\t\t<p>Sounded aloud. The peal it blew had made</p>\n\t\t<p>The thunder feeble. Following its course</p>\n\t\t<p>The adverse way, my strained eyes were bent</p>\n\t\t<p>On that one spot. So terrible a blast</p>\n\t\t<p>Orlando blew not, when that dismal rout</p>\n\t\t<p>O&rsquo;erthrew the host of Charlemagne, and quench&rsquo;d</p>\n\t\t<p>His saintly warfare. Thitherward not long</p>\n\t\t<p>My head was rais&rsquo;d, when many lofty towers</p>\n\t\t<p>Methought I spied. &ldquo;Master,&rdquo; said I, &ldquo;what land</p>\n\t\t<p>Is this?&rdquo; He answer&rsquo;d straight: &ldquo;Too long a space</p>\n\t\t<p>Of intervening darkness has thine eye</p>\n\t\t<p>To traverse: thou hast therefore widely err&rsquo;d</p>\n\t\t<p>In thy imagining. Thither arriv&rsquo;d</p>\n\t\t<p>Thou well shalt see, how distance can delude</p>\n\t\t<p>The sense. A little therefore urge thee on.&rdquo;</p>\n\t\t<p class="slindent">Then tenderly he caught me by the hand;</p>\n\t\t<p>&ldquo;Yet know,&rdquo; said he, &ldquo;ere farther we advance,</p>\n\t\t<p>That it less strange may seem, these are not towers,</p>\n\t\t<p>But giants. In the pit they stand immers&rsquo;d,</p>\n\t\t<p>Each from his navel downward, round the bank.&rdquo;</p>\n\t\t<p class="slindent">As when a fog disperseth gradually,</p>\n\t\t<p>Our vision traces what the mist involves</p>\n\t\t<p>Condens&rsquo;d in air; so piercing through the gross</p>\n\t\t<p>And gloomy atmosphere, as more and more</p>\n\t\t<p>We near&rsquo;d toward the brink, mine error fled,</p>\n\t\t<p>And fear came o&rsquo;er me. As with circling round</p>\n\t\t<p>Of turrets, Montereggion crowns his walls,</p>\n\t\t<p>E&rsquo;en thus the shore, encompassing th&rsquo; abyss,</p>\n\t\t<p>Was turreted with giants, half their length</p>\n\t\t<p>Uprearing, horrible, whom Jove from heav&rsquo;n</p>\n\t\t<p>Yet threatens, when his mutt&rsquo;ring thunder rolls.</p>\n\t\t<p class="slindent">Of one already I descried the face,</p>\n\t\t<p>Shoulders, and breast, and of the belly huge</p>\n\t\t<p>Great part, and both arms down along his ribs.</p>\n\t\t<p class="slindent">All-teeming nature, when her plastic hand</p>\n\t\t<p>Left framing of these monsters, did display</p>\n\t\t<p>Past doubt her wisdom, taking from mad War</p>\n\t\t<p>Such slaves to do his bidding; and if she</p>\n\t\t<p>Repent her not of th&rsquo; elephant and whale,</p>\n\t\t<p>Who ponders well confesses her therein</p>\n\t\t<p>Wiser and more discreet; for when brute force</p>\n\t\t<p>And evil will are back&rsquo;d with subtlety,</p>\n\t\t<p>Resistance none avails. His visage seem&rsquo;d</p>\n\t\t<p>In length and bulk, as doth the pine, that tops</p>\n\t\t<p>Saint Peter&rsquo;s Roman fane; and th&rsquo; other bones</p>\n\t\t<p>Of like proportion, so that from above</p>\n\t\t<p>The bank, which girdled him below, such height</p>\n\t\t<p>Arose his stature, that three Friezelanders</p>\n\t\t<p>Had striv&rsquo;n in vain to reach but to his hair.</p>\n\t\t<p>Full thirty ample palms was he expos&rsquo;d</p>\n\t\t<p>Downward from whence a man his garments loops.</p>\n\t\t<p>&ldquo;Raphel bai ameth sabi almi,&rdquo;</p>\n\t\t<p>So shouted his fierce lips, which sweeter hymns</p>\n\t\t<p>Became not; and my guide address&rsquo;d him thus:</p>\n\t\t<p>&ldquo;O senseless spirit! let thy horn for thee</p>\n\t\t<p>Interpret: therewith vent thy rage, if rage</p>\n\t\t<p>Or other passion wring thee. Search thy neck,</p>\n\t\t<p>There shalt thou find the belt that binds it on.</p>\n\t\t<p>Wild spirit! lo, upon thy mighty breast</p>\n\t\t<p>Where hangs the baldrick!&rdquo; Then to me he spake:</p>\n\t\t<p>&ldquo;He doth accuse himself. Nimrod is this,</p>\n\t\t<p>Through whose ill counsel in the world no more</p>\n\t\t<p>One tongue prevails. But pass we on, nor waste</p>\n\t\t<p>Our words; for so each language is to him,</p>\n\t\t<p>As his to others, understood by none.&rdquo;</p>\n\t\t<p class="slindent">Then to the leftward turning sped we forth,</p>\n\t\t<p>And at a sling&rsquo;s throw found another shade</p>\n\t\t<p>Far fiercer and more huge. I cannot say</p>\n\t\t<p>What master hand had girt him; but he held</p>\n\t\t<p>Behind the right arm fetter&rsquo;d, and before</p>\n\t\t<p>The other with a chain, that fasten&rsquo;d him</p>\n\t\t<p>From the neck down, and five times round his form</p>\n\t\t<p>Apparent met the wreathed links. &ldquo;This proud one</p>\n\t\t<p>Would of his strength against almighty Jove</p>\n\t\t<p>Make trial,&rdquo; said my guide; &ldquo;whence he is thus</p>\n\t\t<p>Requited: Ephialtes him they call.</p>\n\t\t<p>&ldquo;Great was his prowess, when the giants brought</p>\n\t\t<p>Fear on the gods: those arms, which then he piled,</p>\n\t\t<p>Now moves he never.&rdquo; Forthwith I return&rsquo;d:</p>\n\t\t<p>&ldquo;Fain would I, if &rsquo;t were possible, mine eyes</p>\n\t\t<p>Of Briareus immeasurable gain&rsquo;d</p>\n\t\t<p>Experience next.&rdquo; He answer&rsquo;d: &ldquo;Thou shalt see</p>\n\t\t<p>Not far from hence Antaeus, who both speaks</p>\n\t\t<p>And is unfetter&rsquo;d, who shall place us there</p>\n\t\t<p>Where guilt is at its depth. Far onward stands</p>\n\t\t<p>Whom thou wouldst fain behold, in chains, and made</p>\n\t\t<p>Like to this spirit, save that in his looks</p>\n\t\t<p>More fell he seems.&rdquo; By violent earthquake rock&rsquo;d</p>\n\t\t<p>Ne&rsquo;er shook a tow&rsquo;r, so reeling to its base,</p>\n\t\t<p>As Ephialtes. More than ever then</p>\n\t\t<p>I dreaded death, nor than the terror more</p>\n\t\t<p>Had needed, if I had not seen the cords</p>\n\t\t<p>That held him fast. We, straightway journeying on,</p>\n\t\t<p>Came to Antaeus, who five ells complete</p>\n\t\t<p>Without the head, forth issued from the cave.</p>\n\t\t<p class="slindent">&ldquo;O thou, who in the fortunate vale, that made</p>\n\t\t<p>Great Scipio heir of glory, when his sword</p>\n\t\t<p>Drove back the troop of Hannibal in flight,</p>\n\t\t<p>Who thence of old didst carry for thy spoil</p>\n\t\t<p>An hundred lions; and if thou hadst fought</p>\n\t\t<p>In the high conflict on thy brethren&rsquo;s side,</p>\n\t\t<p>Seems as men yet believ&rsquo;d, that through thine arm</p>\n\t\t<p>The sons of earth had conquer&rsquo;d, now vouchsafe</p>\n\t\t<p>To place us down beneath, where numbing cold</p>\n\t\t<p>Locks up Cocytus. Force not that we crave</p>\n\t\t<p>Or Tityus&rsquo; help or Typhon&rsquo;s. Here is one</p>\n\t\t<p>Can give what in this realm ye covet. Stoop</p>\n\t\t<p>Therefore, nor scornfully distort thy lip.</p>\n\t\t<p>He in the upper world can yet bestow</p>\n\t\t<p>Renown on thee, for he doth live, and looks</p>\n\t\t<p>For life yet longer, if before the time</p>\n\t\t<p>Grace call him not unto herself.&rdquo; Thus spake</p>\n\t\t<p>The teacher. He in haste forth stretch&rsquo;d his hands,</p>\n\t\t<p>And caught my guide. Alcides whilom felt</p>\n\t\t<p>That grapple straighten&rsquo;d score. Soon as my guide</p>\n\t\t<p>Had felt it, he bespake me thus: &ldquo;This way</p>\n\t\t<p>That I may clasp thee;&rdquo; then so caught me up,</p>\n\t\t<p>That we were both one burden. As appears</p>\n\t\t<p>The tower of Carisenda, from beneath</p>\n\t\t<p>Where it doth lean, if chance a passing cloud</p>\n\t\t<p>So sail across, that opposite it hangs,</p>\n\t\t<p>Such then Antaeus seem&rsquo;d, as at mine ease</p>\n\t\t<p>I mark&rsquo;d him stooping. I were fain at times</p>\n\t\t<p>T&rsquo; have pass&rsquo;d another way. Yet in th&rsquo; abyss,</p>\n\t\t<p>That Lucifer with Judas low ingulfs,</p>\n\t\t<p>Lightly he plac&rsquo;d us; nor there leaning stay&rsquo;d,</p>\n\t\t<p>But rose as in a bark the stately mast.</p>\n\t\t</div>','<p class="cantohead">Canto XXXII</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">Could</span> I command rough rhimes and hoarse, to suit</p>\n\t\t<p>That hole of sorrow, o&rsquo;er which ev&rsquo;ry rock</p>\n\t\t<p>His firm abutment rears, then might the vein</p>\n\t\t<p>Of fancy rise full springing: but not mine</p>\n\t\t<p>Such measures, and with falt&rsquo;ring awe I touch</p>\n\t\t<p>The mighty theme; for to describe the depth</p>\n\t\t<p>Of all the universe, is no emprize</p>\n\t\t<p>To jest with, and demands a tongue not us&rsquo;d</p>\n\t\t<p>To infant babbling. But let them assist</p>\n\t\t<p>My song, the tuneful maidens, by whose aid</p>\n\t\t<p>Amphion wall&rsquo;d in Thebes, so with the truth</p>\n\t\t<p>My speech shall best accord. Oh ill-starr&rsquo;d folk,</p>\n\t\t<p>Beyond all others wretched! who abide</p>\n\t\t<p>In such a mansion, as scarce thought finds words</p>\n\t\t<p>To speak of, better had ye here on earth</p>\n\t\t<p>Been flocks or mountain goats. As down we stood</p>\n\t\t<p>In the dark pit beneath the giants&rsquo; feet,</p>\n\t\t<p>But lower far than they, and I did gaze</p>\n\t\t<p>Still on the lofty battlement, a voice</p>\n\t\t<p>Bespoke me thus: &ldquo;Look how thou walkest. Take</p>\n\t\t<p>Good heed, thy soles do tread not on the heads</p>\n\t\t<p>Of thy poor brethren.&rdquo; Thereupon I turn&rsquo;d,</p>\n\t\t<p>And saw before and underneath my feet</p>\n\t\t<p>A lake, whose frozen surface liker seem&rsquo;d</p>\n\t\t<p>To glass than water. Not so thick a veil</p>\n\t\t<p>In winter e&rsquo;er hath Austrian Danube spread</p>\n\t\t<p>O&rsquo;er his still course, nor Tanais far remote</p>\n\t\t<p>Under the chilling sky. Roll&rsquo;d o&rsquo;er that mass</p>\n\t\t<p>Had Tabernich or Pietrapana fall&rsquo;n,</p>\n\t\t<p>Not e&rsquo;en its rim had creak&rsquo;d. As peeps the frog</p>\n\t\t<p>Croaking above the wave, what time in dreams</p>\n\t\t<p>The village gleaner oft pursues her toil,</p>\n\t\t<p>So, to where modest shame appears, thus low</p>\n\t\t<p>Blue pinch&rsquo;d and shrin&rsquo;d in ice the spirits stood,</p>\n\t\t<p>Moving their teeth in shrill note like the stork.</p>\n\t\t<p>His face each downward held; their mouth the cold,</p>\n\t\t<p>Their eyes express&rsquo;d the dolour of their heart.</p>\n\t\t<p class="slindent">A space I look&rsquo;d around, then at my feet</p>\n\t\t<p>Saw two so strictly join&rsquo;d, that of their head</p>\n\t\t<p>The very hairs were mingled. &ldquo;Tell me ye,</p>\n\t\t<p>Whose bosoms thus together press,&rdquo; said I,</p>\n\t\t<p>&ldquo;Who are ye?&rdquo; At that sound their necks they bent,</p>\n\t\t<p>And when their looks were lifted up to me,</p>\n\t\t<p>Straightway their eyes, before all moist within,</p>\n\t\t<p>Distill&rsquo;d upon their lips, and the frost bound</p>\n\t\t<p>The tears betwixt those orbs and held them there.</p>\n\t\t<p>Plank unto plank hath never cramp clos&rsquo;d up</p>\n\t\t<p>So stoutly. Whence like two enraged goats</p>\n\t\t<p>They clash&rsquo;d together; them such fury seiz&rsquo;d.</p>\n\t\t<p class="slindent">And one, from whom the cold both ears had reft,</p>\n\t\t<p>Exclaim&rsquo;d, still looking downward: &ldquo;Why on us</p>\n\t\t<p>Dost speculate so long? If thou wouldst know</p>\n\t\t<p>Who are these two, the valley, whence his wave</p>\n\t\t<p>Bisenzio slopes, did for its master own</p>\n\t\t<p>Their sire Alberto, and next him themselves.</p>\n\t\t<p>They from one body issued; and throughout</p>\n\t\t<p>Caina thou mayst search, nor find a shade</p>\n\t\t<p>More worthy in congealment to be fix&rsquo;d,</p>\n\t\t<p>Not him, whose breast and shadow Arthur&rsquo;s land</p>\n\t\t<p>At that one blow dissever&rsquo;d, not Focaccia,</p>\n\t\t<p>No not this spirit, whose o&rsquo;erjutting head</p>\n\t\t<p>Obstructs my onward view: he bore the name</p>\n\t\t<p>Of Mascheroni: Tuscan if thou be,</p>\n\t\t<p>Well knowest who he was: and to cut short</p>\n\t\t<p>All further question, in my form behold</p>\n\t\t<p>What once was Camiccione. I await</p>\n\t\t<p>Carlino here my kinsman, whose deep guilt</p>\n\t\t<p>Shall wash out mine.&rdquo; A thousand visages</p>\n\t\t<p>Then mark&rsquo;d I, which the keen and eager cold</p>\n\t\t<p>Had shap&rsquo;d into a doggish grin; whence creeps</p>\n\t\t<p>A shiv&rsquo;ring horror o&rsquo;er me, at the thought</p>\n\t\t<p>Of those frore shallows. While we journey&rsquo;d on</p>\n\t\t<p>Toward the middle, at whose point unites</p>\n\t\t<p>All heavy substance, and I trembling went</p>\n\t\t<p>Through that eternal chillness, I know not</p>\n\t\t<p>If will it were or destiny, or chance,</p>\n\t\t<p>But, passing &rsquo;midst the heads, my foot did strike</p>\n\t\t<p>With violent blow against the face of one.</p>\n\t\t<p class="slindent">&ldquo;Wherefore dost bruise me?&rdquo; weeping, he exclaim&rsquo;d,</p>\n\t\t<p>&ldquo;Unless thy errand be some fresh revenge</p>\n\t\t<p>For Montaperto, wherefore troublest me?&rdquo;</p>\n\t\t<p class="slindent">I thus: &ldquo;Instructor, now await me here,</p>\n\t\t<p>That I through him may rid me of my doubt.</p>\n\t\t<p>Thenceforth what haste thou wilt.&rdquo; The teacher paus&rsquo;d,</p>\n\t\t<p>And to that shade I spake, who bitterly</p>\n\t\t<p>Still curs&rsquo;d me in his wrath. &ldquo;What art thou, speak,</p>\n\t\t<p>That railest thus on others?&rdquo; He replied:</p>\n\t\t<p>&ldquo;Now who art thou, that smiting others&rsquo; cheeks</p>\n\t\t<p>Through Antenora roamest, with such force</p>\n\t\t<p>As were past suff&rsquo;rance, wert thou living still?&rdquo;</p>\n\t\t<p class="slindent">&ldquo;And I am living, to thy joy perchance,&rdquo;</p>\n\t\t<p>Was my reply, &ldquo;if fame be dear to thee,</p>\n\t\t<p>That with the rest I may thy name enrol.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;The contrary of what I covet most,&rdquo;</p>\n\t\t<p>Said he, &ldquo;thou tender&rsquo;st: hence; nor vex me more.</p>\n\t\t<p>Ill knowest thou to flatter in this vale.&rdquo;</p>\n\t\t<p class="slindent">Then seizing on his hinder scalp, I cried:</p>\n\t\t<p>&ldquo;Name thee, or not a hair shall tarry here.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;Rend all away,&rdquo; he answer&rsquo;d, &ldquo;yet for that</p>\n\t\t<p>I will not tell nor show thee who I am,</p>\n\t\t<p>Though at my head thou pluck a thousand times.&rdquo;</p>\n\t\t<p class="slindent">Now I had grasp&rsquo;d his tresses, and stript off</p>\n\t\t<p>More than one tuft, he barking, with his eyes</p>\n\t\t<p>Drawn in and downward, when another cried,</p>\n\t\t<p>&ldquo;What ails thee, Bocca? Sound not loud enough</p>\n\t\t<p>Thy chatt&rsquo;ring teeth, but thou must bark outright?</p>\n\t\t<p>What devil wrings thee?&rdquo;&mdash;&ldquo;Now,&rdquo; said I, &ldquo;be dumb,</p>\n\t\t<p>Accursed traitor! to thy shame of thee</p>\n\t\t<p>True tidings will I bear.&rdquo;&mdash;&ldquo;Off,&rdquo; he replied,</p>\n\t\t<p>&ldquo;Tell what thou list; but as thou escape from hence</p>\n\t\t<p>To speak of him whose tongue hath been so glib,</p>\n\t\t<p>Forget not: here he wails the Frenchman&rsquo;s gold.</p>\n\t\t<p>&rsquo;Him of Duera,&rsquo; thou canst say, &lsquo;I mark&rsquo;d,</p>\n\t\t<p>Where the starv&rsquo;d sinners pine.&rsquo; If thou be ask&rsquo;d</p>\n\t\t<p>What other shade was with them, at thy side</p>\n\t\t<p>Is Beccaria, whose red gorge distain&rsquo;d</p>\n\t\t<p>The biting axe of Florence. Farther on,</p>\n\t\t<p>If I misdeem not, Soldanieri bides,</p>\n\t\t<p>With Ganellon, and Tribaldello, him</p>\n\t\t<p>Who op&rsquo;d Faenza when the people slept.&rdquo;</p>\n\t\t<p class="slindent">We now had left him, passing on our way,</p>\n\t\t<p>When I beheld two spirits by the ice</p>\n\t\t<p>Pent in one hollow, that the head of one</p>\n\t\t<p>Was cowl unto the other; and as bread</p>\n\t\t<p>Is raven&rsquo;d up through hunger, th&rsquo; uppermost</p>\n\t\t<p>Did so apply his fangs to th&rsquo; other&rsquo;s brain,</p>\n\t\t<p>Where the spine joins it. Not more furiously</p>\n\t\t<p>On Menalippus&rsquo; temples Tydeus gnaw&rsquo;d,</p>\n\t\t<p>Than on that skull and on its garbage he.</p>\n\t\t<p class="slindent">&ldquo;O thou who show&rsquo;st so beastly sign of hate</p>\n\t\t<p>&rsquo;Gainst him thou prey&rsquo;st on, let me hear,&rdquo; said I</p>\n\t\t<p>&ldquo;The cause, on such condition, that if right</p>\n\t\t<p>Warrant thy grievance, knowing who ye are,</p>\n\t\t<p>And what the colour of his sinning was,</p>\n\t\t<p>I may repay thee in the world above,</p>\n\t\t<p>If that, wherewith I speak be moist so long.&rdquo;</p>\n\t\t</div>','<p class="cantohead">Canto XXXIII</p>\n\t\t<div class="stanza">\n\t\t<p><span class="sc">His</span> jaws uplifting from their fell repast,</p>\n\t\t<p>That sinner wip&rsquo;d them on the hairs o&rsquo; th&rsquo; head,</p>\n\t\t<p>Which he behind had mangled, then began:</p>\n\t\t<p>&ldquo;Thy will obeying, I call up afresh</p>\n\t\t<p>Sorrow past cure, which but to think of wrings</p>\n\t\t<p>My heart, or ere I tell on&rsquo;t. But if words,</p>\n\t\t<p>That I may utter, shall prove seed to bear</p>\n\t\t<p>Fruit of eternal infamy to him,</p>\n\t\t<p>The traitor whom I gnaw at, thou at once</p>\n\t\t<p>Shalt see me speak and weep. Who thou mayst be</p>\n\t\t<p>I know not, nor how here below art come:</p>\n\t\t<p>But Florentine thou seemest of a truth,</p>\n\t\t<p>When I do hear thee. Know I was on earth</p>\n\t\t<p>Count Ugolino, and th&rsquo; Archbishop he</p>\n\t\t<p>Ruggieri. Why I neighbour him so close,</p>\n\t\t<p>Now list. That through effect of his ill thoughts</p>\n\t\t<p>In him my trust reposing, I was ta&rsquo;en</p>\n\t\t<p>And after murder&rsquo;d, need is not I tell.</p>\n\t\t<p>What therefore thou canst not have heard, that is,</p>\n\t\t<p>How cruel was the murder, shalt thou hear,</p>\n\t\t<p>And know if he have wrong&rsquo;d me. A small grate</p>\n\t\t<p>Within that mew, which for my sake the name</p>\n\t\t<p>Of famine bears, where others yet must pine,</p>\n\t\t<p>Already through its opening sev&rsquo;ral moons</p>\n\t\t<p>Had shown me, when I slept the evil sleep,</p>\n\t\t<p>That from the future tore the curtain off.</p>\n\t\t<p>This one, methought, as master of the sport,</p>\n\t\t<p>Rode forth to chase the gaunt wolf and his whelps</p>\n\t\t<p>Unto the mountain, which forbids the sight</p>\n\t\t<p>Of Lucca to the Pisan. With lean brachs</p>\n\t\t<p>Inquisitive and keen, before him rang&rsquo;d</p>\n\t\t<p>Lanfranchi with Sismondi and Gualandi.</p>\n\t\t<p>After short course the father and the sons</p>\n\t\t<p>Seem&rsquo;d tir&rsquo;d and lagging, and methought I saw</p>\n\t\t<p>The sharp tusks gore their sides. When I awoke</p>\n\t\t<p>Before the dawn, amid their sleep I heard</p>\n\t\t<p>My sons (for they were with me) weep and ask</p>\n\t\t<p>For bread. Right cruel art thou, if no pang</p>\n\t\t<p>Thou feel at thinking what my heart foretold;</p>\n\t\t<p>And if not now, why use thy tears to flow?</p>\n\t\t<p>Now had they waken&rsquo;d; and the hour drew near</p>\n\t\t<p>When they were wont to bring us food; the mind</p>\n\t\t<p>Of each misgave him through his dream, and I</p>\n\t\t<p>Heard, at its outlet underneath lock&rsquo;d up</p>\n\t\t<p>The&rsquo; horrible tower: whence uttering not a word</p>\n\t\t<p>I look&rsquo;d upon the visage of my sons.</p>\n\t\t<p>I wept not: so all stone I felt within.</p>\n\t\t<p>They wept: and one, my little Anslem, cried:</p>\n\t\t<p>&ldquo;Thou lookest so! Father what ails thee?&rdquo; Yet</p>\n\t\t<p>I shed no tear, nor answer&rsquo;d all that day</p>\n\t\t<p>Nor the next night, until another sun</p>\n\t\t<p>Came out upon the world. When a faint beam</p>\n\t\t<p>Had to our doleful prison made its way,</p>\n\t\t<p>And in four countenances I descry&rsquo;d</p>\n\t\t<p>The image of my own, on either hand</p>\n\t\t<p>Through agony I bit, and they who thought</p>\n\t\t<p>I did it through desire of feeding, rose</p>\n\t\t<p>O&rsquo; th&rsquo; sudden, and cried, &lsquo;Father, we should grieve</p>\n\t\t<p>Far less, if thou wouldst eat of us: thou gav&rsquo;st</p>\n\t\t<p>These weeds of miserable flesh we wear,</p>\n\t\t<p>&rsquo;And do thou strip them off from us again.&rsquo;</p>\n\t\t<p>Then, not to make them sadder, I kept down</p>\n\t\t<p>My spirit in stillness. That day and the next</p>\n\t\t<p>We all were silent. Ah, obdurate earth!</p>\n\t\t<p>Why open&rsquo;dst not upon us? When we came</p>\n\t\t<p>To the fourth day, then Geddo at my feet</p>\n\t\t<p>Outstretch&rsquo;d did fling him, crying, &lsquo;Hast no help</p>\n\t\t<p>For me, my father!&rsquo; There he died, and e&rsquo;en</p>\n\t\t<p>Plainly as thou seest me, saw I the three</p>\n\t\t<p>Fall one by one &rsquo;twixt the fifth day and sixth:</p>\n\t\t<p>&ldquo;Whence I betook me now grown blind to grope</p>\n\t\t<p>Over them all, and for three days aloud</p>\n\t\t<p>Call&rsquo;d on them who were dead. Then fasting got</p>\n\t\t<p>The mastery of grief.&rdquo; Thus having spoke,</p>\n\t\t<p>Once more upon the wretched skull his teeth</p>\n\t\t<p>He fasten&rsquo;d, like a mastiff&rsquo;s &rsquo;gainst the bone</p>\n\t\t<p>Firm and unyielding. Oh thou Pisa! shame</p>\n\t\t<p>Of all the people, who their dwelling make</p>\n\t\t<p>In that fair region, where th&rsquo; Italian voice</p>\n\t\t<p>Is heard, since that thy neighbours are so slack</p>\n\t\t<p>To punish, from their deep foundations rise</p>\n\t\t<p>Capraia and Gorgona, and dam up</p>\n\t\t<p>The mouth of Arno, that each soul in thee</p>\n\t\t<p>May perish in the waters! What if fame</p>\n\t\t<p>Reported that thy castles were betray&rsquo;d</p>\n\t\t<p>By Ugolino, yet no right hadst thou</p>\n\t\t<p>To stretch his children on the rack. For them,</p>\n\t\t<p>Brigata, Ugaccione, and the pair</p>\n\t\t<p>Of gentle ones, of whom my song hath told,</p>\n\t\t<p>Their tender years, thou modern Thebes! did make</p>\n\t\t<p>Uncapable of guilt. Onward we pass&rsquo;d,</p>\n\t\t<p>Where others skarf&rsquo;d in rugged folds of ice</p>\n\t\t<p>Not on their feet were turn&rsquo;d, but each revers&rsquo;d.</p>\n\t\t<p class="slindent">There very weeping suffers not to weep;</p>\n\t\t<p>For at their eyes grief seeking passage finds</p>\n\t\t<p>Impediment, and rolling inward turns</p>\n\t\t<p>For increase of sharp anguish: the first tears</p>\n\t\t<p>Hang cluster&rsquo;d, and like crystal vizors show,</p>\n\t\t<p>Under the socket brimming all the cup.</p>\n\t\t<p class="slindent">Now though the cold had from my face dislodg&rsquo;d</p>\n\t\t<p>Each feeling, as &rsquo;t were callous, yet me seem&rsquo;d</p>\n\t\t<p>Some breath of wind I felt. &ldquo;Whence cometh this,&rdquo;</p>\n\t\t<p>Said I, &ldquo;my master? Is not here below</p>\n\t\t<p>All vapour quench&rsquo;d?&rdquo;&mdash;&ldquo;Thou shalt be speedily,&rdquo;</p>\n\t\t<p>He answer&rsquo;d, &ldquo;where thine eye shall tell thee whence</p>\n\t\t<p>The cause descrying of this airy shower.&rdquo;</p>\n\t\t<p class="slindent">Then cried out one in the chill crust who mourn&rsquo;d:</p>\n\t\t<p>&ldquo;O souls so cruel! that the farthest post</p>\n\t\t<p>Hath been assign&rsquo;d you, from this face remove</p>\n\t\t<p>The harden&rsquo;d veil, that I may vent the grief</p>\n\t\t<p>Impregnate at my heart, some little space</p>\n\t\t<p>Ere it congeal again!&rdquo; I thus replied:</p>\n\t\t<p>&ldquo;Say who thou wast, if thou wouldst have mine aid;</p>\n\t\t<p>And if I extricate thee not, far down</p>\n\t\t<p>As to the lowest ice may I descend!&rdquo;</p>\n\t\t<p class="slindent">&ldquo;The friar Alberigo,&rdquo; answered he,</p>\n\t\t<p>&ldquo;Am I, who from the evil garden pluck&rsquo;d</p>\n\t\t<p>Its fruitage, and am here repaid, the date</p>\n\t\t<p>More luscious for my fig.&rdquo;&mdash;&ldquo;Hah!&rdquo; I exclaim&rsquo;d,</p>\n\t\t<p>&ldquo;Art thou too dead!&rdquo;&mdash;&ldquo;How in the world aloft</p>\n\t\t<p>It fareth with my body,&rdquo; answer&rsquo;d he,</p>\n\t\t<p>&ldquo;I am right ignorant. Such privilege</p>\n\t\t<p>Hath Ptolomea, that ofttimes the soul</p>\n\t\t<p>Drops hither, ere by Atropos divorc&rsquo;d.</p>\n\t\t<p>And that thou mayst wipe out more willingly</p>\n\t\t<p>The glazed tear-drops that o&rsquo;erlay mine eyes,</p>\n\t\t<p>Know that the soul, that moment she betrays,</p>\n\t\t<p>As I did, yields her body to a fiend</p>\n\t\t<p>Who after moves and governs it at will,</p>\n\t\t<p>Till all its time be rounded; headlong she</p>\n\t\t<p>Falls to this cistern. And perchance above</p>\n\t\t<p>Doth yet appear the body of a ghost,</p>\n\t\t<p>Who here behind me winters. Him thou know&rsquo;st,</p>\n\t\t<p>If thou but newly art arriv&rsquo;d below.</p>\n\t\t<p>The years are many that have pass&rsquo;d away,</p>\n\t\t<p>Since to this fastness Branca Doria came.&rdquo;</p>\n\t\t<p class="slindent">&ldquo;Now,&rdquo; answer&rsquo;d I, &ldquo;methinks thou mockest me,</p>\n\t\t<p>For Branca Doria never yet hath died,</p>\n\t\t<p>But doth all natural functions of a man,</p>\n\t\t<p>Eats, drinks, and sleeps, and putteth raiment on.&rdquo;</p>\n\t\t<p class="slindent">He thus: &ldquo;Not yet unto that upper foss</p>\n\t\t<p>By th&rsquo; evil talons guarded, where the pitch</p>\n\t\t<p>Tenacious boils, had Michael Zanche reach&rsquo;d,</p>\n\t\t<p>When this one left a demon in his stead</p>\n\t\t<p>In his own body, and of one his kin,</p>\n\t\t<p>Who with him treachery wrought. But now put forth</p>\n\t\t<p>Thy hand, and ope mine eyes.&rdquo; I op&rsquo;d them not.</p>\n\t\t<p>Ill manners were best courtesy to him.</p>\n\t\t<p class="slindent">Ah Genoese! men perverse in every way,</p>\n\t\t<p>With every foulness stain&rsquo;d, why from the earth</p>\n\t\t<p>Are ye not cancel&rsquo;d? Such an one of yours</p>\n\t\t<p>I with Romagna&rsquo;s darkest spirit found,</p>\n\t\t<p>As for his doings even now in soul</p>\n\t\t<p>Is in Cocytus plung&rsquo;d, and yet doth seem</p>\n\t\t<p>In body still alive upon the earth.</p>\n\t\t</div>','<p class="cantohead">Canto XXXIV</p>\n\t\t<div class="stanza">\n\t\t<p>&ldquo;<span class="sc">The</span> banners of Hell&rsquo;s Monarch do come forth</p>\n\t\t<p>Towards us; therefore look,&rdquo; so spake my guide,</p>\n\t\t<p>&ldquo;If thou discern him.&rdquo; As, when breathes a cloud</p>\n\t\t<p>Heavy and dense, or when the shades of night</p>\n\t\t<p>Fall on our hemisphere, seems view&rsquo;d from far</p>\n\t\t<p>A windmill, which the blast stirs briskly round,</p>\n\t\t<p>Such was the fabric then methought I saw,</p>\n\t\t<p class="slindent">To shield me from the wind, forthwith I drew</p>\n\t\t<p>Behind my guide: no covert else was there.</p>\n\t\t<p class="slindent">Now came I (and with fear I bid my strain</p>\n\t\t<p>Record the marvel) where the souls were all</p>\n\t\t<p>Whelm&rsquo;d underneath, transparent, as through glass</p>\n\t\t<p>Pellucid the frail stem. Some prone were laid,</p>\n\t\t<p>Others stood upright, this upon the soles,</p>\n\t\t<p>That on his head, a third with face to feet</p>\n\t\t<p>Arch&rsquo;d like a bow. When to the point we came,</p>\n\t\t<p>Whereat my guide was pleas&rsquo;d that I should see</p>\n\t\t<p>The creature eminent in beauty once,</p>\n\t\t<p>He from before me stepp&rsquo;d and made me pause.</p>\n\t\t<p class="slindent">&ldquo;Lo!&rdquo; he exclaim&rsquo;d, &ldquo;lo Dis! and lo the place,</p>\n\t\t<p>Where thou hast need to arm thy heart with strength.&rdquo;</p>\n\t\t<p class="slindent">How frozen and how faint I then became,</p>\n\t\t<p>Ask me not, reader! for I write it not,</p>\n\t\t<p>Since words would fail to tell thee of my state.</p>\n\t\t<p>I was not dead nor living. Think thyself</p>\n\t\t<p>If quick conception work in thee at all,</p>\n\t\t<p>How I did feel. That emperor, who sways</p>\n\t\t<p>The realm of sorrow, at mid breast from th&rsquo; ice</p>\n\t\t<p>Stood forth; and I in stature am more like</p>\n\t\t<p>A giant, than the giants are in his arms.</p>\n\t\t<p>Mark now how great that whole must be, which suits</p>\n\t\t<p>With such a part. If he were beautiful</p>\n\t\t<p>As he is hideous now, and yet did dare</p>\n\t\t<p>To scowl upon his Maker, well from him</p>\n\t\t<p>May all our mis&rsquo;ry flow. Oh what a sight!</p>\n\t\t<p>How passing strange it seem&rsquo;d, when I did spy</p>\n\t\t<p>Upon his head three faces: one in front</p>\n\t\t<p>Of hue vermilion, th&rsquo; other two with this</p>\n\t\t<p>Midway each shoulder join&rsquo;d and at the crest;</p>\n\t\t<p>The right &rsquo;twixt wan and yellow seem&rsquo;d: the left</p>\n\t\t<p>To look on, such as come from whence old Nile</p>\n\t\t<p>Stoops to the lowlands. Under each shot forth</p>\n\t\t<p>Two mighty wings, enormous as became</p>\n\t\t<p>A bird so vast. Sails never such I saw</p>\n\t\t<p>Outstretch&rsquo;d on the wide sea. No plumes had they,</p>\n\t\t<p>But were in texture like a bat, and these</p>\n\t\t<p>He flapp&rsquo;d i&rsquo; th&rsquo; air, that from him issued still</p>\n\t\t<p>Three winds, wherewith Cocytus to its depth</p>\n\t\t<p>Was frozen. At six eyes he wept: the tears</p>\n\t\t<p>Adown three chins distill&rsquo;d with bloody foam.</p>\n\t\t<p>At every mouth his teeth a sinner champ&rsquo;d</p>\n\t\t<p>Bruis&rsquo;d as with pond&rsquo;rous engine, so that three</p>\n\t\t<p>Were in this guise tormented. But far more</p>\n\t\t<p>Than from that gnawing, was the foremost pang&rsquo;d</p>\n\t\t<p>By the fierce rending, whence ofttimes the back</p>\n\t\t<p>Was stript of all its skin. &ldquo;That upper spirit,</p>\n\t\t<p>Who hath worse punishment,&rdquo; so spake my guide,</p>\n\t\t<p>&ldquo;Is Judas, he that hath his head within</p>\n\t\t<p>And plies the feet without. Of th&rsquo; other two,</p>\n\t\t<p>Whose heads are under, from the murky jaw</p>\n\t\t<p>Who hangs, is Brutus: lo! how he doth writhe</p>\n\t\t<p>And speaks not! Th&rsquo; other Cassius, that appears</p>\n\t\t<p>So large of limb. But night now re-ascends,</p>\n\t\t<p>And it is time for parting. All is seen.&rdquo;</p>\n\t\t<p class="slindent">I clipp&rsquo;d him round the neck, for so he bade;</p>\n\t\t<p>And noting time and place, he, when the wings</p>\n\t\t<p>Enough were op&rsquo;d, caught fast the shaggy sides,</p>\n\t\t<p>And down from pile to pile descending stepp&rsquo;d</p>\n\t\t<p>Between the thick fell and the jagged ice.</p>\n\t\t<p class="slindent">Soon as he reach&rsquo;d the point, whereat the thigh</p>\n\t\t<p>Upon the swelling of the haunches turns,</p>\n\t\t<p>My leader there with pain and struggling hard</p>\n\t\t<p>Turn&rsquo;d round his head, where his feet stood before,</p>\n\t\t<p>And grappled at the fell, as one who mounts,</p>\n\t\t<p>That into hell methought we turn&rsquo;d again.</p>\n\t\t<p class="slindent">&ldquo;Expect that by such stairs as these,&rdquo; thus spake</p>\n\t\t<p>The teacher, panting like a man forespent,</p>\n\t\t<p>&ldquo;We must depart from evil so extreme.&rdquo;</p>\n\t\t<p>Then at a rocky opening issued forth,</p>\n\t\t<p>And plac&rsquo;d me on a brink to sit, next join&rsquo;d</p>\n\t\t<p>With wary step my side. I rais&rsquo;d mine eyes,</p>\n\t\t<p>Believing that I Lucifer should see</p>\n\t\t<p>Where he was lately left, but saw him now</p>\n\t\t<p>With legs held upward. Let the grosser sort,</p>\n\t\t<p>Who see not what the point was I had pass&rsquo;d,</p>\n\t\t<p>Bethink them if sore toil oppress&rsquo;d me then.</p>\n\t\t<p class="slindent">&ldquo;Arise,&rdquo; my master cried, &ldquo;upon thy feet.</p>\n\t\t<p>The way is long, and much uncouth the road;</p>\n\t\t<p>And now within one hour and half of noon</p>\n\t\t<p>The sun returns.&rdquo; It was no palace-hall</p>\n\t\t<p>Lofty and luminous wherein we stood,</p>\n\t\t<p>But natural dungeon where ill footing was</p>\n\t\t<p>And scant supply of light. &ldquo;Ere from th&rsquo; abyss</p>\n\t\t<p>I sep&rsquo;rate,&rdquo; thus when risen I began,</p>\n\t\t<p>&ldquo;My guide! vouchsafe few words to set me free</p>\n\t\t<p>From error&rsquo;s thralldom. Where is now the ice?</p>\n\t\t<p>How standeth he in posture thus revers&rsquo;d?</p>\n\t\t<p>And how from eve to morn in space so brief</p>\n\t\t<p>Hath the sun made his transit?&rdquo; He in few</p>\n\t\t<p>Thus answering spake: &ldquo;Thou deemest thou art still</p>\n\t\t<p>On th&rsquo; other side the centre, where I grasp&rsquo;d</p>\n\t\t<p>Th&rsquo; abhorred worm, that boreth through the world.</p>\n\t\t<p>Thou wast on th&rsquo; other side, so long as I</p>\n\t\t<p>Descended; when I turn&rsquo;d, thou didst o&rsquo;erpass</p>\n\t\t<p>That point, to which from ev&rsquo;ry part is dragg&rsquo;d</p>\n\t\t<p>All heavy substance. Thou art now arriv&rsquo;d</p>\n\t\t<p>Under the hemisphere opposed to that,</p>\n\t\t<p>Which the great continent doth overspread,</p>\n\t\t<p>And underneath whose canopy expir&rsquo;d</p>\n\t\t<p>The Man, that was born sinless, and so liv&rsquo;d.</p>\n\t\t<p>Thy feet are planted on the smallest sphere,</p>\n\t\t<p>Whose other aspect is Judecca. Morn</p>\n\t\t<p>Here rises, when there evening sets: and he,</p>\n\t\t<p>Whose shaggy pile was scal&rsquo;d, yet standeth fix&rsquo;d,</p>\n\t\t<p>As at the first. On this part he fell down</p>\n\t\t<p>From heav&rsquo;n; and th&rsquo; earth, here prominent before,</p>\n\t\t<p>Through fear of him did veil her with the sea,</p>\n\t\t<p>And to our hemisphere retir&rsquo;d. Perchance</p>\n\t\t<p>To shun him was the vacant space left here</p>\n\t\t<p>By what of firm land on this side appears,</p>\n\t\t<p>That sprang aloof.&rdquo; There is a place beneath,</p>\n\t\t<p>From Belzebub as distant, as extends</p>\n\t\t<p>The vaulted tomb, discover&rsquo;d not by sight,</p>\n\t\t<p>But by the sound of brooklet, that descends</p>\n\t\t<p>This way along the hollow of a rock,</p>\n\t\t<p>Which, as it winds with no precipitous course,</p>\n\t\t<p>The wave hath eaten. By that hidden way</p>\n\t\t<p>My guide and I did enter, to return</p>\n\t\t<p>To the fair world: and heedless of repose</p>\n\t\t<p>We climbed, he first, I following his steps,</p>\n\t\t<p>Till on our view the beautiful lights of heav&rsquo;n</p>\n\t\t<p>Dawn&rsquo;d through a circular opening in the cave:</p>\n\t\t<p>Thus issuing we again beheld the stars.</p>\n\t\t</div>']};

},{}],7:[function(require,module,exports){
// italian.js
"use strict";module.exports={bookname:'inferno',author:'Dante Alighieri',translationid:"dante",title:'Inferno',translation:false,source:'<a href="http://www.gutenberg.org/ebooks/1009">Project Gutenberg</a>',translationshortname:"Dante",translationfullname:"Dante Alighieri",translationclass:"poetry",text:['<p class="title">Inferno</p>\n\t<p class="author">Dante Alighieri</p>','<p class="cantohead">1</p>\n\t\t<div class="stanza">\n\t\t\t<p>Nel mezzo del cammin di nostra vita</p>\n\t\t\t<p>mi ritrovai per una selva oscura,</p>\n\t\t\t<p>ch&eacute; la diritta via era smarrita.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ahi quanto a dir qual era &egrave; cosa dura</p>\n\t\t\t<p>esta selva selvaggia e aspra e forte</p>\n\t\t\t<p>che nel pensier rinova la paura!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tant&rsquo; &egrave; amara che poco &egrave; pi&ugrave; morte;</p>\n\t\t\t<p>ma per trattar del ben ch&rsquo;i&rsquo; vi trovai,</p>\n\t\t\t<p>dir&ograve; de l&rsquo;altre cose ch&rsquo;i&rsquo; v&rsquo;ho scorte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io non so ben ridir com&rsquo; i&rsquo; v&rsquo;intrai,</p>\n\t\t\t<p>tant&rsquo; era pien di sonno a quel punto</p>\n\t\t\t<p>che la verace via abbandonai.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma poi ch&rsquo;i&rsquo; fui al pi&egrave; d&rsquo;un colle giunto,</p>\n\t\t\t<p>l&agrave; dove terminava quella valle</p>\n\t\t\t<p>che m&rsquo;avea di paura il cor compunto,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>guardai in alto e vidi le sue spalle</p>\n\t\t\t<p>vestite gi&agrave; de&rsquo; raggi del pianeta</p>\n\t\t\t<p>che mena dritto altrui per ogne calle.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor fu la paura un poco queta,</p>\n\t\t\t<p>che nel lago del cor m&rsquo;era durata</p>\n\t\t\t<p>la notte ch&rsquo;i&rsquo; passai con tanta pieta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E come quei che con lena affannata,</p>\n\t\t\t<p>uscito fuor del pelago a la riva,</p>\n\t\t\t<p>si volge a l&rsquo;acqua perigliosa e guata,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>cos&igrave; l&rsquo;animo mio, ch&rsquo;ancor fuggiva,</p>\n\t\t\t<p>si volse a retro a rimirar lo passo</p>\n\t\t\t<p>che non lasci&ograve; gi&agrave; mai persona viva.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi ch&rsquo;&egrave;i posato un poco il corpo lasso,</p>\n\t\t\t<p>ripresi via per la piaggia diserta,</p>\n\t\t\t<p>s&igrave; che &rsquo;l pi&egrave; fermo sempre era &rsquo;l pi&ugrave; basso.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed ecco, quasi al cominciar de l&rsquo;erta,</p>\n\t\t\t<p>una lonza leggera e presta molto,</p>\n\t\t\t<p>che di pel macolato era coverta;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e non mi si partia dinanzi al volto,</p>\n\t\t\t<p>anzi &rsquo;mpediva tanto il mio cammino,</p>\n\t\t\t<p>ch&rsquo;i&rsquo; fui per ritornar pi&ugrave; volte v&ograve;lto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Temp&rsquo; era dal principio del mattino,</p>\n\t\t\t<p>e &rsquo;l sol montava &rsquo;n s&ugrave; con quelle stelle</p>\n\t\t\t<p>ch&rsquo;eran con lui quando l&rsquo;amor divino</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>mosse di prima quelle cose belle;</p>\n\t\t\t<p>s&igrave; ch&rsquo;a bene sperar m&rsquo;era cagione</p>\n\t\t\t<p>di quella fiera a la gaetta pelle</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>l&rsquo;ora del tempo e la dolce stagione;</p>\n\t\t\t<p>ma non s&igrave; che paura non mi desse</p>\n\t\t\t<p>la vista che m&rsquo;apparve d&rsquo;un leone.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Questi parea che contra me venisse</p>\n\t\t\t<p>con la test&rsquo; alta e con rabbiosa fame,</p>\n\t\t\t<p>s&igrave; che parea che l&rsquo;aere ne tremesse.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed una lupa, che di tutte brame</p>\n\t\t\t<p>sembiava carca ne la sua magrezza,</p>\n\t\t\t<p>e molte genti f&eacute; gi&agrave; viver grame,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>questa mi porse tanto di gravezza</p>\n\t\t\t<p>con la paura ch&rsquo;uscia di sua vista,</p>\n\t\t\t<p>ch&rsquo;io perdei la speranza de l&rsquo;altezza.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E qual &egrave; quei che volontieri acquista,</p>\n\t\t\t<p>e giugne &rsquo;l tempo che perder lo face,</p>\n\t\t\t<p>che &rsquo;n tutti suoi pensier piange e s&rsquo;attrista;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>tal mi fece la bestia sanza pace,</p>\n\t\t\t<p>che, venendomi &rsquo;ncontro, a poco a poco</p>\n\t\t\t<p>mi ripigneva l&agrave; dove &rsquo;l sol tace.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Mentre ch&rsquo;i&rsquo; rovinava in basso loco,</p>\n\t\t\t<p>dinanzi a li occhi mi si fu offerto</p>\n\t\t\t<p>chi per lungo silenzio parea fioco.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quando vidi costui nel gran diserto,</p>\n\t\t\t<p>&laquo;Miserere di me&raquo;, gridai a lui,</p>\n\t\t\t<p>&laquo;qual che tu sii, od ombra od omo certo!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Rispuosemi: &laquo;Non omo, omo gi&agrave; fui,</p>\n\t\t\t<p>e li parenti miei furon lombardi,</p>\n\t\t\t<p>mantoani per patr&iuml;a ambedui.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Nacqui sub Iulio, ancor che fosse tardi,</p>\n\t\t\t<p>e vissi a Roma sotto &rsquo;l buono Augusto</p>\n\t\t\t<p>nel tempo de li d&egrave;i falsi e bugiardi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poeta fui, e cantai di quel giusto</p>\n\t\t\t<p>figliuol d&rsquo;Anchise che venne di Troia,</p>\n\t\t\t<p>poi che &rsquo;l superbo Il&iuml;&oacute;n fu combusto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma tu perch&eacute; ritorni a tanta noia?</p>\n\t\t\t<p>perch&eacute; non sali il dilettoso monte</p>\n\t\t\t<p>ch&rsquo;&egrave; principio e cagion di tutta gioia?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Or se&rsquo; tu quel Virgilio e quella fonte</p>\n\t\t\t<p>che spandi di parlar s&igrave; largo fiume?&raquo;,</p>\n\t\t\t<p>rispuos&rsquo; io lui con vergognosa fronte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;O de li altri poeti onore e lume,</p>\n\t\t\t<p>vagliami &rsquo;l lungo studio e &rsquo;l grande amore</p>\n\t\t\t<p>che m&rsquo;ha fatto cercar lo tuo volume.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tu se&rsquo; lo mio maestro e &rsquo;l mio autore,</p>\n\t\t\t<p>tu se&rsquo; solo colui da cu&rsquo; io tolsi</p>\n\t\t\t<p>lo bello stilo che m&rsquo;ha fatto onore.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Vedi la bestia per cu&rsquo; io mi volsi;</p>\n\t\t\t<p>aiutami da lei, famoso saggio,</p>\n\t\t\t<p>ch&rsquo;ella mi fa tremar le vene e i polsi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;A te convien tenere altro v&iuml;aggio&raquo;,</p>\n\t\t\t<p>rispuose, poi che lagrimar mi vide,</p>\n\t\t\t<p>&laquo;se vuo&rsquo; campar d&rsquo;esto loco selvaggio;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&eacute; questa bestia, per la qual tu gride,</p>\n\t\t\t<p>non lascia altrui passar per la sua via,</p>\n\t\t\t<p>ma tanto lo &rsquo;mpedisce che l&rsquo;uccide;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e ha natura s&igrave; malvagia e ria,</p>\n\t\t\t<p>che mai non empie la bramosa voglia,</p>\n\t\t\t<p>e dopo &rsquo;l pasto ha pi&ugrave; fame che pria.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Molti son li animali a cui s&rsquo;ammoglia,</p>\n\t\t\t<p>e pi&ugrave; saranno ancora, infin che &rsquo;l veltro</p>\n\t\t\t<p>verr&agrave;, che la far&agrave; morir con doglia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Questi non ciber&agrave; terra n&eacute; peltro,</p>\n\t\t\t<p>ma sap&iuml;enza, amore e virtute,</p>\n\t\t\t<p>e sua nazion sar&agrave; tra feltro e feltro.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Di quella umile Italia fia salute</p>\n\t\t\t<p>per cui mor&igrave; la vergine Cammilla,</p>\n\t\t\t<p>Eurialo e Turno e Niso di ferute.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Questi la caccer&agrave; per ogne villa,</p>\n\t\t\t<p>fin che l&rsquo;avr&agrave; rimessa ne lo &rsquo;nferno,</p>\n\t\t\t<p>l&agrave; onde &rsquo;nvidia prima dipartilla.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ond&rsquo; io per lo tuo me&rsquo; penso e discerno</p>\n\t\t\t<p>che tu mi segui, e io sar&ograve; tua guida,</p>\n\t\t\t<p>e trarrotti di qui per loco etterno;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ove udirai le disperate strida,</p>\n\t\t\t<p>vedrai li antichi spiriti dolenti,</p>\n\t\t\t<p>ch&rsquo;a la seconda morte ciascun grida;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e vederai color che son contenti</p>\n\t\t\t<p>nel foco, perch&eacute; speran di venire</p>\n\t\t\t<p>quando che sia a le beate genti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>A le quai poi se tu vorrai salire,</p>\n\t\t\t<p>anima fia a ci&ograve; pi&ugrave; di me degna:</p>\n\t\t\t<p>con lei ti lascer&ograve; nel mio partire;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&eacute; quello imperador che l&agrave; s&ugrave; regna,</p>\n\t\t\t<p>perch&rsquo; i&rsquo; fu&rsquo; ribellante a la sua legge,</p>\n\t\t\t<p>non vuol che &rsquo;n sua citt&agrave; per me si vegna.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>In tutte parti impera e quivi regge;</p>\n\t\t\t<p>quivi &egrave; la sua citt&agrave; e l&rsquo;alto seggio:</p>\n\t\t\t<p>oh felice colui cu&rsquo; ivi elegge!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io a lui: &laquo;Poeta, io ti richeggio</p>\n\t\t\t<p>per quello Dio che tu non conoscesti,</p>\n\t\t\t<p>acci&ograve; ch&rsquo;io fugga questo male e peggio,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che tu mi meni l&agrave; dov&rsquo; or dicesti,</p>\n\t\t\t<p>s&igrave; ch&rsquo;io veggia la porta di san Pietro</p>\n\t\t\t<p>e color cui tu fai cotanto mesti&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor si mosse, e io li tenni dietro.</p>\n\t\t</div>','<p class="cantohead">2</p>\n\t\t<div class="stanza">\n\t\t\t<p>Lo giorno se n&rsquo;andava, e l&rsquo;aere bruno</p>\n\t\t\t<p>toglieva li animai che sono in terra</p>\n\t\t\t<p>da le fatiche loro; e io sol uno</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>m&rsquo;apparecchiava a sostener la guerra</p>\n\t\t\t<p>s&igrave; del cammino e s&igrave; de la pietate,</p>\n\t\t\t<p>che ritrarr&agrave; la mente che non erra.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>O muse, o alto ingegno, or m&rsquo;aiutate;</p>\n\t\t\t<p>o mente che scrivesti ci&ograve; ch&rsquo;io vidi,</p>\n\t\t\t<p>qui si parr&agrave; la tua nobilitate.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io cominciai: &laquo;Poeta che mi guidi,</p>\n\t\t\t<p>guarda la mia virt&ugrave; s&rsquo;ell&rsquo; &egrave; possente,</p>\n\t\t\t<p>prima ch&rsquo;a l&rsquo;alto passo tu mi fidi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tu dici che di Silv&iuml;o il parente,</p>\n\t\t\t<p>corruttibile ancora, ad immortale</p>\n\t\t\t<p>secolo and&ograve;, e fu sensibilmente.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per&ograve;, se l&rsquo;avversario d&rsquo;ogne male</p>\n\t\t\t<p>cortese i fu, pensando l&rsquo;alto effetto</p>\n\t\t\t<p>ch&rsquo;uscir dovea di lui, e &rsquo;l chi e &rsquo;l quale</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>non pare indegno ad omo d&rsquo;intelletto;</p>\n\t\t\t<p>ch&rsquo;e&rsquo; fu de l&rsquo;alma Roma e di suo impero</p>\n\t\t\t<p>ne l&rsquo;empireo ciel per padre eletto:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>la quale e &rsquo;l quale, a voler dir lo vero,</p>\n\t\t\t<p>fu stabilita per lo loco santo</p>\n\t\t\t<p>u&rsquo; siede il successor del maggior Piero.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per quest&rsquo; andata onde li dai tu vanto,</p>\n\t\t\t<p>intese cose che furon cagione</p>\n\t\t\t<p>di sua vittoria e del papale ammanto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Andovvi poi lo Vas d&rsquo;elez&iuml;one,</p>\n\t\t\t<p>per recarne conforto a quella fede</p>\n\t\t\t<p>ch&rsquo;&egrave; principio a la via di salvazione.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma io, perch&eacute; venirvi? o chi &rsquo;l concede?</p>\n\t\t\t<p>Io non En\xEBa, io non Paulo sono;</p>\n\t\t\t<p>me degno a ci&ograve; n&eacute; io n&eacute; altri &rsquo;l crede.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per che, se del venire io m&rsquo;abbandono,</p>\n\t\t\t<p>temo che la venuta non sia folle.</p>\n\t\t\t<p>Se&rsquo; savio; intendi me&rsquo; ch&rsquo;i&rsquo; non ragiono&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E qual &egrave; quei che disvuol ci&ograve; che volle</p>\n\t\t\t<p>e per novi pensier cangia proposta,</p>\n\t\t\t<p>s&igrave; che dal cominciar tutto si tolle,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>tal mi fec&rsquo; &iuml;o &rsquo;n quella oscura costa,</p>\n\t\t\t<p>perch&eacute;, pensando, consumai la &rsquo;mpresa</p>\n\t\t\t<p>che fu nel cominciar cotanto tosta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;S&rsquo;i&rsquo; ho ben la parola tua intesa&raquo;,</p>\n\t\t\t<p>rispuose del magnanimo quell&rsquo; ombra,</p>\n\t\t\t<p>&laquo;l&rsquo;anima tua &egrave; da viltade offesa;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>la qual molte f&iuml;ate l&rsquo;omo ingombra</p>\n\t\t\t<p>s&igrave; che d&rsquo;onrata impresa lo rivolve,</p>\n\t\t\t<p>come falso veder bestia quand&rsquo; ombra.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Da questa tema acci&ograve; che tu ti solve,</p>\n\t\t\t<p>dirotti perch&rsquo; io venni e quel ch&rsquo;io &rsquo;ntesi</p>\n\t\t\t<p>nel primo punto che di te mi dolve.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io era tra color che son sospesi,</p>\n\t\t\t<p>e donna mi chiam&ograve; beata e bella,</p>\n\t\t\t<p>tal che di comandare io la richiesi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lucevan li occhi suoi pi&ugrave; che la stella;</p>\n\t\t\t<p>e cominciommi a dir soave e piana,</p>\n\t\t\t<p>con angelica voce, in sua favella:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>\u201CO anima cortese mantoana,</p>\n\t\t\t<p>di cui la fama ancor nel mondo dura,</p>\n\t\t\t<p>e durer&agrave; quanto &rsquo;l mondo lontana,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>l&rsquo;amico mio, e non de la ventura,</p>\n\t\t\t<p>ne la diserta piaggia &egrave; impedito</p>\n\t\t\t<p>s&igrave; nel cammin, che v&ograve;lt&rsquo; &egrave; per paura;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e temo che non sia gi&agrave; s&igrave; smarrito,</p>\n\t\t\t<p>ch&rsquo;io mi sia tardi al soccorso levata,</p>\n\t\t\t<p>per quel ch&rsquo;i&rsquo; ho di lui nel cielo udito.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Or movi, e con la tua parola ornata</p>\n\t\t\t<p>e con ci&ograve; c&rsquo;ha mestieri al suo campare,</p>\n\t\t\t<p>l&rsquo;aiuta s&igrave; ch&rsquo;i&rsquo; ne sia consolata.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>I&rsquo; son Beatrice che ti faccio andare;</p>\n\t\t\t<p>vegno del loco ove tornar disio;</p>\n\t\t\t<p>amor mi mosse, che mi fa parlare.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quando sar&ograve; dinanzi al segnor mio,</p>\n\t\t\t<p>di te mi loder&ograve; sovente a lui\u201D.</p>\n\t\t\t<p>Tacette allora, e poi comincia&rsquo; io:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>\u201CO donna di virt&ugrave; sola per cui</p>\n\t\t\t<p>l&rsquo;umana spezie eccede ogne contento</p>\n\t\t\t<p>di quel ciel c&rsquo;ha minor li cerchi sui,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>tanto m&rsquo;aggrada il tuo comandamento,</p>\n\t\t\t<p>che l&rsquo;ubidir, se gi&agrave; fosse, m&rsquo;&egrave; tardi;</p>\n\t\t\t<p>pi&ugrave; non t&rsquo;&egrave; uo&rsquo; ch&rsquo;aprirmi il tuo talento.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma dimmi la cagion che non ti guardi</p>\n\t\t\t<p>de lo scender qua giuso in questo centro</p>\n\t\t\t<p>de l&rsquo;ampio loco ove tornar tu ardi\u201D.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>\u201CDa che tu vuo&rsquo; saver cotanto a dentro,</p>\n\t\t\t<p>dirotti brievemente\u201D, mi rispuose,</p>\n\t\t\t<p>\u201Cperch&rsquo; i&rsquo; non temo di venir qua entro.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Temer si dee di sole quelle cose</p>\n\t\t\t<p>c&rsquo;hanno potenza di fare altrui male;</p>\n\t\t\t<p>de l&rsquo;altre no, ch&eacute; non son paurose.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>I&rsquo; son fatta da Dio, sua merc&eacute;, tale,</p>\n\t\t\t<p>che la vostra miseria non mi tange,</p>\n\t\t\t<p>n&eacute; fiamma d&rsquo;esto &rsquo;ncendio non m&rsquo;assale.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Donna &egrave; gentil nel ciel che si compiange</p>\n\t\t\t<p>di questo &rsquo;mpedimento ov&rsquo; io ti mando,</p>\n\t\t\t<p>s&igrave; che duro giudicio l&agrave; s&ugrave; frange.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Questa chiese Lucia in suo dimando</p>\n\t\t\t<p>e disse:\u2014Or ha bisogno il tuo fedele</p>\n\t\t\t<p>di te, e io a te lo raccomando\u2014.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lucia, nimica di ciascun crudele,</p>\n\t\t\t<p>si mosse, e venne al loco dov&rsquo; i&rsquo; era,</p>\n\t\t\t<p>che mi sedea con l&rsquo;antica Rachele.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Disse:\u2014Beatrice, loda di Dio vera,</p>\n\t\t\t<p>ch&eacute; non soccorri quei che t&rsquo;am&ograve; tanto,</p>\n\t\t\t<p>ch&rsquo;usc&igrave; per te de la volgare schiera?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non odi tu la pieta del suo pianto,</p>\n\t\t\t<p>non vedi tu la morte che &rsquo;l combatte</p>\n\t\t\t<p>su la fiumana ove &rsquo;l mar non ha vanto?\u2014.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Al mondo non fur mai persone ratte</p>\n\t\t\t<p>a far lor pro o a fuggir lor danno,</p>\n\t\t\t<p>com&rsquo; io, dopo cotai parole fatte,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>venni qua gi&ugrave; del mio beato scanno,</p>\n\t\t\t<p>fidandomi del tuo parlare onesto,</p>\n\t\t\t<p>ch&rsquo;onora te e quei ch&rsquo;udito l&rsquo;hanno\u201D.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poscia che m&rsquo;ebbe ragionato questo,</p>\n\t\t\t<p>li occhi lucenti lagrimando volse,</p>\n\t\t\t<p>per che mi fece del venir pi&ugrave; presto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E venni a te cos&igrave; com&rsquo; ella volse:</p>\n\t\t\t<p>d&rsquo;inanzi a quella fiera ti levai</p>\n\t\t\t<p>che del bel monte il corto andar ti tolse.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Dunque: che &egrave;? perch&eacute;, perch&eacute; restai,</p>\n\t\t\t<p>perch&eacute; tanta vilt&agrave; nel core allette,</p>\n\t\t\t<p>perch&eacute; ardire e franchezza non hai,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>poscia che tai tre donne benedette</p>\n\t\t\t<p>curan di te ne la corte del cielo,</p>\n\t\t\t<p>e &rsquo;l mio parlar tanto ben ti promette?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quali fioretti dal notturno gelo</p>\n\t\t\t<p>chinati e chiusi, poi che &rsquo;l sol li &rsquo;mbianca,</p>\n\t\t\t<p>si drizzan tutti aperti in loro stelo,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>tal mi fec&rsquo; io di mia virtude stanca,</p>\n\t\t\t<p>e tanto buono ardire al cor mi corse,</p>\n\t\t\t<p>ch&rsquo;i&rsquo; cominciai come persona franca:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Oh pietosa colei che mi soccorse!</p>\n\t\t\t<p>e te cortese ch&rsquo;ubidisti tosto</p>\n\t\t\t<p>a le vere parole che ti porse!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tu m&rsquo;hai con disiderio il cor disposto</p>\n\t\t\t<p>s&igrave; al venir con le parole tue,</p>\n\t\t\t<p>ch&rsquo;i&rsquo; son tornato nel primo proposto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Or va, ch&rsquo;un sol volere &egrave; d&rsquo;ambedue:</p>\n\t\t\t<p>tu duca, tu segnore e tu maestro&raquo;.</p>\n\t\t\t<p>Cos&igrave; li dissi; e poi che mosso fue,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>intrai per lo cammino alto e silvestro.</p>\n\t\t</div>','<p class="cantohead">3</p>\n\t\t<div class="stanza">\n\t\t\t<p>\u2018&lsquo;Per me si va ne la citt&agrave; dolente,</p>\n\t\t\t<p>per me si va ne l&rsquo;etterno dolore,</p>\n\t\t\t<p>per me si va tra la perduta gente.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Giustizia mosse il mio alto fattore;</p>\n\t\t\t<p>fecemi la divina podestate,</p>\n\t\t\t<p>la somma sap&iuml;enza e &rsquo;l primo amore.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Dinanzi a me non fuor cose create</p>\n\t\t\t<p>se non etterne, e io etterno duro.</p>\n\t\t\t<p>Lasciate ogne speranza, voi ch&rsquo;intrate&rsquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Queste parole di colore oscuro</p>\n\t\t\t<p>vid&rsquo; &iuml;o scritte al sommo d&rsquo;una porta;</p>\n\t\t\t<p>per ch&rsquo;io: &laquo;Maestro, il senso lor m&rsquo;&egrave; duro&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me, come persona accorta:</p>\n\t\t\t<p>&laquo;Qui si convien lasciare ogne sospetto;</p>\n\t\t\t<p>ogne vilt&agrave; convien che qui sia morta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Noi siam venuti al loco ov&rsquo; i&rsquo; t&rsquo;ho detto</p>\n\t\t\t<p>che tu vedrai le genti dolorose</p>\n\t\t\t<p>c&rsquo;hanno perduto il ben de l&rsquo;intelletto&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E poi che la sua mano a la mia puose</p>\n\t\t\t<p>con lieto volto, ond&rsquo; io mi confortai,</p>\n\t\t\t<p>mi mise dentro a le segrete cose.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quivi sospiri, pianti e alti guai</p>\n\t\t\t<p>risonavan per l&rsquo;aere sanza stelle,</p>\n\t\t\t<p>per ch&rsquo;io al cominciar ne lagrimai.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Diverse lingue, orribili favelle,</p>\n\t\t\t<p>parole di dolore, accenti d&rsquo;ira,</p>\n\t\t\t<p>voci alte e fioche, e suon di man con elle</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>facevano un tumulto, il qual s&rsquo;aggira</p>\n\t\t\t<p>sempre in quell&rsquo; aura sanza tempo tinta,</p>\n\t\t\t<p>come la rena quando turbo spira.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io ch&rsquo;avea d&rsquo;error la testa cinta,</p>\n\t\t\t<p>dissi: &laquo;Maestro, che &egrave; quel ch&rsquo;i&rsquo; odo?</p>\n\t\t\t<p>e che gent&rsquo; &egrave; che par nel duol s&igrave; vinta?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;Questo misero modo</p>\n\t\t\t<p>tegnon l&rsquo;anime triste di coloro</p>\n\t\t\t<p>che visser sanza &rsquo;nfamia e sanza lodo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Mischiate sono a quel cattivo coro</p>\n\t\t\t<p>de li angeli che non furon ribelli</p>\n\t\t\t<p>n&eacute; fur fedeli a Dio, ma per s&eacute; fuoro.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Caccianli i ciel per non esser men belli,</p>\n\t\t\t<p>n&eacute; lo profondo inferno li riceve,</p>\n\t\t\t<p>ch&rsquo;alcuna gloria i rei avrebber d&rsquo;elli&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io: &laquo;Maestro, che &egrave; tanto greve</p>\n\t\t\t<p>a lor che lamentar li fa s&igrave; forte?&raquo;.</p>\n\t\t\t<p>Rispuose: &laquo;Dicerolti molto breve.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Questi non hanno speranza di morte,</p>\n\t\t\t<p>e la lor cieca vita &egrave; tanto bassa,</p>\n\t\t\t<p>che &rsquo;nvid&iuml;osi son d&rsquo;ogne altra sorte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Fama di loro il mondo esser non lassa;</p>\n\t\t\t<p>misericordia e giustizia li sdegna:</p>\n\t\t\t<p>non ragioniam di lor, ma guarda e passa&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io, che riguardai, vidi una &rsquo;nsegna</p>\n\t\t\t<p>che girando correva tanto ratta,</p>\n\t\t\t<p>che d&rsquo;ogne posa mi parea indegna;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e dietro le ven&igrave;a s&igrave; lunga tratta</p>\n\t\t\t<p>di gente, ch&rsquo;i&rsquo; non averei creduto</p>\n\t\t\t<p>che morte tanta n&rsquo;avesse disfatta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poscia ch&rsquo;io v&rsquo;ebbi alcun riconosciuto,</p>\n\t\t\t<p>vidi e conobbi l&rsquo;ombra di colui</p>\n\t\t\t<p>che fece per viltade il gran rifiuto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Incontanente intesi e certo fui</p>\n\t\t\t<p>che questa era la setta d&rsquo;i cattivi,</p>\n\t\t\t<p>a Dio spiacenti e a&rsquo; nemici sui.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Questi sciaurati, che mai non fur vivi,</p>\n\t\t\t<p>erano ignudi e stimolati molto</p>\n\t\t\t<p>da mosconi e da vespe ch&rsquo;eran ivi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Elle rigavan lor di sangue il volto,</p>\n\t\t\t<p>che, mischiato di lagrime, a&rsquo; lor piedi</p>\n\t\t\t<p>da fastidiosi vermi era ricolto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E poi ch&rsquo;a riguardar oltre mi diedi,</p>\n\t\t\t<p>vidi genti a la riva d&rsquo;un gran fiume;</p>\n\t\t\t<p>per ch&rsquo;io dissi: &laquo;Maestro, or mi concedi</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&rsquo;i&rsquo; sappia quali sono, e qual costume</p>\n\t\t\t<p>le fa di trapassar parer s&igrave; pronte,</p>\n\t\t\t<p>com&rsquo; i&rsquo; discerno per lo fioco lume&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;Le cose ti fier conte</p>\n\t\t\t<p>quando noi fermerem li nostri passi</p>\n\t\t\t<p>su la trista riviera d&rsquo;Acheronte&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor con li occhi vergognosi e bassi,</p>\n\t\t\t<p>temendo no &rsquo;l mio dir li fosse grave,</p>\n\t\t\t<p>infino al fiume del parlar mi trassi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed ecco verso noi venir per nave</p>\n\t\t\t<p>un vecchio, bianco per antico pelo,</p>\n\t\t\t<p>gridando: &laquo;Guai a voi, anime prave!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non isperate mai veder lo cielo:</p>\n\t\t\t<p>i&rsquo; vegno per menarvi a l&rsquo;altra riva</p>\n\t\t\t<p>ne le tenebre etterne, in caldo e &rsquo;n gelo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E tu che se&rsquo; cost&igrave;, anima viva,</p>\n\t\t\t<p>p&agrave;rtiti da cotesti che son morti&raquo;.</p>\n\t\t\t<p>Ma poi che vide ch&rsquo;io non mi partiva,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>disse: &laquo;Per altra via, per altri porti</p>\n\t\t\t<p>verrai a piaggia, non qui, per passare:</p>\n\t\t\t<p>pi&ugrave; lieve legno convien che ti porti&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E &rsquo;l duca lui: &laquo;Caron, non ti crucciare:</p>\n\t\t\t<p>vuolsi cos&igrave; col&agrave; dove si puote</p>\n\t\t\t<p>ci&ograve; che si vuole, e pi&ugrave; non dimandare&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quinci fuor quete le lanose gote</p>\n\t\t\t<p>al nocchier de la livida palude,</p>\n\t\t\t<p>che &rsquo;ntorno a li occhi avea di fiamme rote.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma quell&rsquo; anime, ch&rsquo;eran lasse e nude,</p>\n\t\t\t<p>cangiar colore e dibattero i denti,</p>\n\t\t\t<p>ratto che &rsquo;nteser le parole crude.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Bestemmiavano Dio e lor parenti,</p>\n\t\t\t<p>l&rsquo;umana spezie e &rsquo;l loco e &rsquo;l tempo e &rsquo;l seme</p>\n\t\t\t<p>di lor semenza e di lor nascimenti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi si ritrasser tutte quante insieme,</p>\n\t\t\t<p>forte piangendo, a la riva malvagia</p>\n\t\t\t<p>ch&rsquo;attende ciascun uom che Dio non teme.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Caron dimonio, con occhi di bragia</p>\n\t\t\t<p>loro accennando, tutte le raccoglie;</p>\n\t\t\t<p>batte col remo qualunque s&rsquo;adagia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Come d&rsquo;autunno si levan le foglie</p>\n\t\t\t<p>l&rsquo;una appresso de l&rsquo;altra, fin che &rsquo;l ramo</p>\n\t\t\t<p>vede a la terra tutte le sue spoglie,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>similemente il mal seme d&rsquo;Adamo</p>\n\t\t\t<p>gittansi di quel lito ad una ad una,</p>\n\t\t\t<p>per cenni come augel per suo richiamo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; sen vanno su per l&rsquo;onda bruna,</p>\n\t\t\t<p>e avanti che sien di l&agrave; discese,</p>\n\t\t\t<p>anche di qua nuova schiera s&rsquo;auna.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Figliuol mio&raquo;, disse &rsquo;l maestro cortese,</p>\n\t\t\t<p>&laquo;quelli che muoion ne l&rsquo;ira di Dio</p>\n\t\t\t<p>tutti convegnon qui d&rsquo;ogne paese;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e pronti sono a trapassar lo rio,</p>\n\t\t\t<p>ch&eacute; la divina giustizia li sprona,</p>\n\t\t\t<p>s&igrave; che la tema si volve in disio.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quinci non passa mai anima buona;</p>\n\t\t\t<p>e per&ograve;, se Caron di te si lagna,</p>\n\t\t\t<p>ben puoi sapere omai che &rsquo;l suo dir suona&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Finito questo, la buia campagna</p>\n\t\t\t<p>trem&ograve; s&igrave; forte, che de lo spavento</p>\n\t\t\t<p>la mente di sudore ancor mi bagna.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>La terra lagrimosa diede vento,</p>\n\t\t\t<p>che balen&ograve; una luce vermiglia</p>\n\t\t\t<p>la qual mi vinse ciascun sentimento;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e caddi come l&rsquo;uom cui sonno piglia.</p>\n\t\t</div>','<p class="cantohead">4</p>\n\t\t<div class="stanza">\n\t\t\t<p>Ruppemi l&rsquo;alto sonno ne la testa</p>\n\t\t\t<p>un greve truono, s&igrave; ch&rsquo;io mi riscossi</p>\n\t\t\t<p>come persona ch&rsquo;&egrave; per forza desta;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e l&rsquo;occhio riposato intorno mossi,</p>\n\t\t<p>dritto levato, e fiso riguardai</p>\n\t\t<p>per conoscer lo loco dov&rsquo; io fossi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Vero &egrave; che &rsquo;n su la proda mi trovai</p>\n\t\t<p>de la valle d&rsquo;abisso dolorosa</p>\n\t\t<p>che &rsquo;ntrono accoglie d&rsquo;infiniti guai.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Oscura e profonda era e nebulosa</p>\n\t\t<p>tanto che, per ficcar lo viso a fondo,</p>\n\t\t<p>io non vi discernea alcuna cosa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Or discendiam qua gi&ugrave; nel cieco mondo&raquo;,</p>\n\t\t<p>cominci&ograve; il poeta tutto smorto.</p>\n\t\t<p>&laquo;Io sar&ograve; primo, e tu sarai secondo&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io, che del color mi fui accorto,</p>\n\t\t<p>dissi: &laquo;Come verr&ograve;, se tu paventi</p>\n\t\t<p>che suoli al mio dubbiare esser conforto?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;L&rsquo;angoscia de le genti</p>\n\t\t<p>che son qua gi&ugrave;, nel viso mi dipigne</p>\n\t\t<p>quella piet&agrave; che tu per tema senti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Andiam, ch&eacute; la via lunga ne sospigne&raquo;.</p>\n\t\t<p>Cos&igrave; si mise e cos&igrave; mi f&eacute; intrare</p>\n\t\t<p>nel primo cerchio che l&rsquo;abisso cigne.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quivi, secondo che per ascoltare,</p>\n\t\t<p>non avea pianto mai che di sospiri</p>\n\t\t<p>che l&rsquo;aura etterna facevan tremare;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ci&ograve; avvenia di duol sanza mart&igrave;ri,</p>\n\t\t<p>ch&rsquo;avean le turbe, ch&rsquo;eran molte e grandi,</p>\n\t\t<p>d&rsquo;infanti e di femmine e di viri.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo buon maestro a me: &laquo;Tu non dimandi</p>\n\t\t<p>che spiriti son questi che tu vedi?</p>\n\t\t<p>Or vo&rsquo; che sappi, innanzi che pi&ugrave; andi,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&rsquo;ei non peccaro; e s&rsquo;elli hanno mercedi,</p>\n\t\t<p>non basta, perch&eacute; non ebber battesmo,</p>\n\t\t<p>ch&rsquo;&egrave; porta de la fede che tu credi;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e s&rsquo;e&rsquo; furon dinanzi al cristianesmo,</p>\n\t\t<p>non adorar debitamente a Dio:</p>\n\t\t<p>e di questi cotai son io medesmo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per tai difetti, non per altro rio,</p>\n\t\t<p>semo perduti, e sol di tanto offesi</p>\n\t\t<p>che sanza speme vivemo in disio&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Gran duol mi prese al cor quando lo &rsquo;ntesi,</p>\n\t\t<p>per&ograve; che gente di molto valore</p>\n\t\t<p>conobbi che &rsquo;n quel limbo eran sospesi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Dimmi, maestro mio, dimmi, segnore&raquo;,</p>\n\t\t<p>comincia&rsquo; io per voler esser certo</p>\n\t\t<p>di quella fede che vince ogne errore:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;uscicci mai alcuno, o per suo merto</p>\n\t\t<p>o per altrui, che poi fosse beato?&raquo;.</p>\n\t\t<p>E quei che &rsquo;ntese il mio parlar coverto,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>rispuose: &laquo;Io era nuovo in questo stato,</p>\n\t\t<p>quando ci vidi venire un possente,</p>\n\t\t<p>con segno di vittoria coronato.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Trasseci l&rsquo;ombra del primo parente,</p>\n\t\t<p>d&rsquo;Ab&egrave;l suo figlio e quella di No&egrave;,</p>\n\t\t<p>di Mo&iuml;s&egrave; legista e ubidente;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Abra&agrave;m patr&iuml;arca e Dav&igrave;d re,</p>\n\t\t<p>Isra&egrave;l con lo padre e co&rsquo; suoi nati</p>\n\t\t<p>e con Rachele, per cui tanto f&eacute;,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e altri molti, e feceli beati.</p>\n\t\t<p>E vo&rsquo; che sappi che, dinanzi ad essi,</p>\n\t\t<p>spiriti umani non eran salvati&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non lasciavam l&rsquo;andar perch&rsquo; ei dicessi,</p>\n\t\t<p>ma passavam la selva tuttavia,</p>\n\t\t<p>la selva, dico, di spiriti spessi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non era lunga ancor la nostra via</p>\n\t\t<p>di qua dal sonno, quand&rsquo; io vidi un foco</p>\n\t\t<p>ch&rsquo;emisperio di tenebre vincia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Di lungi n&rsquo;eravamo ancora un poco,</p>\n\t\t<p>ma non s&igrave; ch&rsquo;io non discernessi in parte</p>\n\t\t<p>ch&rsquo;orrevol gente possedea quel loco.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;O tu ch&rsquo;onori sc&iuml;enz&iuml;a e arte,</p>\n\t\t<p>questi chi son c&rsquo;hanno cotanta onranza,</p>\n\t\t<p>che dal modo de li altri li diparte?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quelli a me: &laquo;L&rsquo;onrata nominanza</p>\n\t\t<p>che di lor suona s&ugrave; ne la tua vita,</p>\n\t\t<p>graz&iuml;a acquista in ciel che s&igrave; li avanza&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Intanto voce fu per me udita:</p>\n\t\t<p>&laquo;Onorate l&rsquo;altissimo poeta;</p>\n\t\t<p>l&rsquo;ombra sua torna, ch&rsquo;era dipartita&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi che la voce fu restata e queta,</p>\n\t\t<p>vidi quattro grand&rsquo; ombre a noi venire:</p>\n\t\t<p>sembianz&rsquo; avevan n&eacute; trista n&eacute; lieta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo buon maestro cominci&ograve; a dire:</p>\n\t\t<p>&laquo;Mira colui con quella spada in mano,</p>\n\t\t<p>che vien dinanzi ai tre s&igrave; come sire:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>quelli &egrave; Omero poeta sovrano;</p>\n\t\t<p>l&rsquo;altro &egrave; Orazio satiro che vene;</p>\n\t\t<p>Ovidio &egrave; &rsquo;l terzo, e l&rsquo;ultimo Lucano.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per&ograve; che ciascun meco si convene</p>\n\t\t<p>nel nome che son&ograve; la voce sola,</p>\n\t\t<p>fannomi onore, e di ci&ograve; fanno bene&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; vid&rsquo; i&rsquo; adunar la bella scola</p>\n\t\t<p>di quel segnor de l&rsquo;altissimo canto</p>\n\t\t<p>che sovra li altri com&rsquo; aquila vola.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Da ch&rsquo;ebber ragionato insieme alquanto,</p>\n\t\t<p>volsersi a me con salutevol cenno,</p>\n\t\t<p>e &rsquo;l mio maestro sorrise di tanto;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e pi&ugrave; d&rsquo;onore ancora assai mi fenno,</p>\n\t\t<p>ch&rsquo;e&rsquo; s&igrave; mi fecer de la loro schiera,</p>\n\t\t<p>s&igrave; ch&rsquo;io fui sesto tra cotanto senno.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; andammo infino a la lumera,</p>\n\t\t<p>parlando cose che &rsquo;l tacere &egrave; bello,</p>\n\t\t<p>s&igrave; com&rsquo; era &rsquo;l parlar col&agrave; dov&rsquo; era.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Venimmo al pi&egrave; d&rsquo;un nobile castello,</p>\n\t\t<p>sette volte cerchiato d&rsquo;alte mura,</p>\n\t\t<p>difeso intorno d&rsquo;un bel fiumicello.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Questo passammo come terra dura;</p>\n\t\t<p>per sette porte intrai con questi savi:</p>\n\t\t<p>giugnemmo in prato di fresca verdura.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Genti v&rsquo;eran con occhi tardi e gravi,</p>\n\t\t<p>di grande autorit&agrave; ne&rsquo; lor sembianti:</p>\n\t\t<p>parlavan rado, con voci soavi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Traemmoci cos&igrave; da l&rsquo;un de&rsquo; canti,</p>\n\t\t<p>in loco aperto, luminoso e alto,</p>\n\t\t<p>s&igrave; che veder si potien tutti quanti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Col&agrave; diritto, sovra &rsquo;l verde smalto,</p>\n\t\t<p>mi fuor mostrati li spiriti magni,</p>\n\t\t<p>che del vedere in me stesso m&rsquo;essalto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>I&rsquo; vidi Eletra con molti compagni,</p>\n\t\t<p>tra &rsquo; quai conobbi Ett&ograve;r ed Enea,</p>\n\t\t<p>Cesare armato con li occhi grifagni.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Vidi Cammilla e la Pantasilea;</p>\n\t\t<p>da l&rsquo;altra parte vidi &rsquo;l re Latino</p>\n\t\t<p>che con Lavina sua figlia sedea.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Vidi quel Bruto che cacci&ograve; Tarquino,</p>\n\t\t<p>Lucrezia, Iulia, Marz&iuml;a e Corniglia;</p>\n\t\t<p>e solo, in parte, vidi &rsquo;l Saladino.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi ch&rsquo;innalzai un poco pi&ugrave; le ciglia,</p>\n\t\t<p>vidi &rsquo;l maestro di color che sanno</p>\n\t\t<p>seder tra filosofica famiglia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tutti lo miran, tutti onor li fanno:</p>\n\t\t<p>quivi vid&rsquo; &iuml;o Socrate e Platone,</p>\n\t\t<p>che &rsquo;nnanzi a li altri pi&ugrave; presso li stanno;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Democrito che &rsquo;l mondo a caso pone,</p>\n\t\t<p>D&iuml;ogen&egrave;s, Anassagora e Tale,</p>\n\t\t<p>Empedocl&egrave;s, Eraclito e Zenone;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e vidi il buono accoglitor del quale,</p>\n\t\t<p>D&iuml;ascoride dico; e vidi Orfeo,</p>\n\t\t<p>Tul&iuml;o e Lino e Seneca morale;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Euclide geom&egrave;tra e Tolomeo,</p>\n\t\t<p>Ipocr&agrave;te, Avicenna e Gal&iuml;eno,</p>\n\t\t<p>Avero&igrave;s, che &rsquo;l gran comento feo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io non posso ritrar di tutti a pieno,</p>\n\t\t<p>per&ograve; che s&igrave; mi caccia il lungo tema,</p>\n\t\t<p>che molte volte al fatto il dir vien meno.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>La sesta compagnia in due si scema:</p>\n\t\t<p>per altra via mi mena il savio duca,</p>\n\t\t<p>fuor de la queta, ne l&rsquo;aura che trema.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E vegno in parte ove non &egrave; che luca.</p>\n\t\t</div>','<p class="cantohead">5</p>\n\t\t<div class="stanza">\n\t\t<p>Cos&igrave; discesi del cerchio primaio</p>\n\t\t<p>gi&ugrave; nel secondo, che men loco cinghia</p>\n\t\t<p>e tanto pi&ugrave; dolor, che punge a guaio.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Stavvi Min&ograve;s orribilmente, e ringhia:</p>\n\t\t<p>essamina le colpe ne l&rsquo;intrata;</p>\n\t\t<p>giudica e manda secondo ch&rsquo;avvinghia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Dico che quando l&rsquo;anima mal nata</p>\n\t\t<p>li vien dinanzi, tutta si confessa;</p>\n\t\t<p>e quel conoscitor de le peccata</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>vede qual loco d&rsquo;inferno &egrave; da essa;</p>\n\t\t<p>cignesi con la coda tante volte</p>\n\t\t<p>quantunque gradi vuol che gi&ugrave; sia messa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Sempre dinanzi a lui ne stanno molte:</p>\n\t\t<p>vanno a vicenda ciascuna al giudizio,</p>\n\t\t<p>dicono e odono e poi son gi&ugrave; volte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;O tu che vieni al doloroso ospizio&raquo;,</p>\n\t\t<p>disse Min&ograve;s a me quando mi vide,</p>\n\t\t<p>lasciando l&rsquo;atto di cotanto offizio,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;guarda com&rsquo; entri e di cui tu ti fide;</p>\n\t\t<p>non t&rsquo;inganni l&rsquo;ampiezza de l&rsquo;intrare!&raquo;.</p>\n\t\t<p>E &rsquo;l duca mio a lui: &laquo;Perch&eacute; pur gride?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non impedir lo suo fatale andare:</p>\n\t\t<p>vuolsi cos&igrave; col&agrave; dove si puote</p>\n\t\t<p>ci&ograve; che si vuole, e pi&ugrave; non dimandare&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Or incomincian le dolenti note</p>\n\t\t<p>a farmisi sentire; or son venuto</p>\n\t\t<p>l&agrave; dove molto pianto mi percuote.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io venni in loco d&rsquo;ogne luce muto,</p>\n\t\t<p>che mugghia come fa mar per tempesta,</p>\n\t\t<p>se da contrari venti &egrave; combattuto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>La bufera infernal, che mai non resta,</p>\n\t\t<p>mena li spirti con la sua rapina;</p>\n\t\t<p>voltando e percotendo li molesta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quando giungon davanti a la ruina,</p>\n\t\t<p>quivi le strida, il compianto, il lamento;</p>\n\t\t<p>bestemmian quivi la virt&ugrave; divina.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Intesi ch&rsquo;a cos&igrave; fatto tormento</p>\n\t\t<p>enno dannati i peccator carnali,</p>\n\t\t<p>che la ragion sommettono al talento.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E come li stornei ne portan l&rsquo;ali</p>\n\t\t<p>nel freddo tempo, a schiera larga e piena,</p>\n\t\t<p>cos&igrave; quel fiato li spiriti mali</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>di qua, di l&agrave;, di gi&ugrave;, di s&ugrave; li mena;</p>\n\t\t<p>nulla speranza li conforta mai,</p>\n\t\t<p>non che di posa, ma di minor pena.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E come i gru van cantando lor lai,</p>\n\t\t<p>faccendo in aere di s&eacute; lunga riga,</p>\n\t\t<p>cos&igrave; vid&rsquo; io venir, traendo guai,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ombre portate da la detta briga;</p>\n\t\t<p>per ch&rsquo;i&rsquo; dissi: &laquo;Maestro, chi son quelle</p>\n\t\t<p>genti che l&rsquo;aura nera s&igrave; gastiga?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;La prima di color di cui novelle</p>\n\t\t<p>tu vuo&rsquo; saper&raquo;, mi disse quelli allotta,</p>\n\t\t<p>&laquo;fu imperadrice di molte favelle.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>A vizio di lussuria fu s&igrave; rotta,</p>\n\t\t<p>che libito f&eacute; licito in sua legge,</p>\n\t\t<p>per t&ograve;rre il biasmo in che era condotta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ell&rsquo; &egrave; Semiram&igrave;s, di cui si legge</p>\n\t\t<p>che succedette a Nino e fu sua sposa:</p>\n\t\t<p>tenne la terra che &rsquo;l Soldan corregge.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>L&rsquo;altra &egrave; colei che s&rsquo;ancise amorosa,</p>\n\t\t<p>e ruppe fede al cener di Sicheo;</p>\n\t\t<p>poi &egrave; Cleopatr&agrave;s lussur&iuml;osa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Elena vedi, per cui tanto reo</p>\n\t\t<p>tempo si volse, e vedi &rsquo;l grande Achille,</p>\n\t\t<p>che con amore al fine combatteo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Vedi Par&igrave;s, Tristano&raquo;; e pi&ugrave; di mille</p>\n\t\t<p>ombre mostrommi e nominommi a dito,</p>\n\t\t<p>ch&rsquo;amor di nostra vita dipartille.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poscia ch&rsquo;io ebbi &rsquo;l mio dottore udito</p>\n\t\t<p>nomar le donne antiche e &rsquo; cavalieri,</p>\n\t\t<p>piet&agrave; mi giunse, e fui quasi smarrito.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>I&rsquo; cominciai: &laquo;Poeta, volontieri</p>\n\t\t<p>parlerei a quei due che &rsquo;nsieme vanno,</p>\n\t\t<p>e paion s&igrave; al vento esser leggeri&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;Vedrai quando saranno</p>\n\t\t<p>pi&ugrave; presso a noi; e tu allor li priega</p>\n\t\t<p>per quello amor che i mena, ed ei verranno&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>S&igrave; tosto come il vento a noi li piega,</p>\n\t\t<p>mossi la voce: &laquo;O anime affannate,</p>\n\t\t<p>venite a noi parlar, s&rsquo;altri nol niega!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quali colombe dal disio chiamate</p>\n\t\t<p>con l&rsquo;ali alzate e ferme al dolce nido</p>\n\t\t<p>vegnon per l&rsquo;aere, dal voler portate;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>cotali uscir de la schiera ov&rsquo; &egrave; Dido,</p>\n\t\t<p>a noi venendo per l&rsquo;aere maligno,</p>\n\t\t<p>s&igrave; forte fu l&rsquo;affett&uuml;oso grido.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;O animal graz&iuml;oso e benigno</p>\n\t\t<p>che visitando vai per l&rsquo;aere perso</p>\n\t\t<p>noi che tignemmo il mondo di sanguigno,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>se fosse amico il re de l&rsquo;universo,</p>\n\t\t<p>noi pregheremmo lui de la tua pace,</p>\n\t\t<p>poi c&rsquo;hai piet&agrave; del nostro mal perverso.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Di quel che udire e che parlar vi piace,</p>\n\t\t<p>noi udiremo e parleremo a voi,</p>\n\t\t<p>mentre che &rsquo;l vento, come fa, ci tace.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Siede la terra dove nata fui</p>\n\t\t<p>su la marina dove &rsquo;l Po discende</p>\n\t\t<p>per aver pace co&rsquo; seguaci sui.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Amor, ch&rsquo;al cor gentil ratto s&rsquo;apprende,</p>\n\t\t<p>prese costui de la bella persona</p>\n\t\t<p>che mi fu tolta; e &rsquo;l modo ancor m&rsquo;offende.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Amor, ch&rsquo;a nullo amato amar perdona,</p>\n\t\t<p>mi prese del costui piacer s&igrave; forte,</p>\n\t\t<p>che, come vedi, ancor non m&rsquo;abbandona.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Amor condusse noi ad una morte.</p>\n\t\t<p>Caina attende chi a vita ci spense&raquo;.</p>\n\t\t<p>Queste parole da lor ci fuor porte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quand&rsquo; io intesi quell&rsquo; anime offense,</p>\n\t\t<p>china&rsquo; il viso, e tanto il tenni basso,</p>\n\t\t<p>fin che &rsquo;l poeta mi disse: &laquo;Che pense?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quando rispuosi, cominciai: &laquo;Oh lasso,</p>\n\t\t<p>quanti dolci pensier, quanto disio</p>\n\t\t<p>men&ograve; costoro al doloroso passo!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi mi rivolsi a loro e parla&rsquo; io,</p>\n\t\t<p>e cominciai: &laquo;Francesca, i tuoi mart&igrave;ri</p>\n\t\t<p>a lagrimar mi fanno tristo e pio.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma dimmi: al tempo d&rsquo;i dolci sospiri,</p>\n\t\t<p>a che e come concedette amore</p>\n\t\t<p>che conosceste i dubbiosi disiri?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quella a me: &laquo;Nessun maggior dolore</p>\n\t\t<p>che ricordarsi del tempo felice</p>\n\t\t<p>ne la miseria; e ci&ograve; sa &rsquo;l tuo dottore.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma s&rsquo;a conoscer la prima radice</p>\n\t\t<p>del nostro amor tu hai cotanto affetto,</p>\n\t\t<p>dir&ograve; come colui che piange e dice.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Noi leggiavamo un giorno per diletto</p>\n\t\t<p>di Lancialotto come amor lo strinse;</p>\n\t\t<p>soli eravamo e sanza alcun sospetto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per pi&ugrave; f&iuml;ate li occhi ci sospinse</p>\n\t\t<p>quella lettura, e scolorocci il viso;</p>\n\t\t<p>ma solo un punto fu quel che ci vinse.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quando leggemmo il dis&iuml;ato riso</p>\n\t\t<p>esser basciato da cotanto amante,</p>\n\t\t<p>questi, che mai da me non fia diviso,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>la bocca mi basci&ograve; tutto tremante.</p>\n\t\t<p>Galeotto fu &rsquo;l libro e chi lo scrisse:</p>\n\t\t<p>quel giorno pi&ugrave; non vi leggemmo avante&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Mentre che l&rsquo;uno spirto questo disse,</p>\n\t\t<p>l&rsquo;altro piang\xEBa; s&igrave; che di pietade</p>\n\t\t<p>io venni men cos&igrave; com&rsquo; io morisse.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E caddi come corpo morto cade.</p>\n\t\t</div>','<p class="cantohead">6</p>\n\t\t<div class="stanza">\n\t\t\t<p>Al tornar de la mente, che si chiuse</p>\n\t\t<p>dinanzi a la piet&agrave; d&rsquo;i due cognati,</p>\n\t\t<p>che di trestizia tutto mi confuse,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>novi tormenti e novi tormentati</p>\n\t\t<p>mi veggio intorno, come ch&rsquo;io mi mova</p>\n\t\t<p>e ch&rsquo;io mi volga, e come che io guati.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io sono al terzo cerchio, de la piova</p>\n\t\t<p>etterna, maladetta, fredda e greve;</p>\n\t\t<p>regola e qualit&agrave; mai non l&rsquo;&egrave; nova.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Grandine grossa, acqua tinta e neve</p>\n\t\t<p>per l&rsquo;aere tenebroso si riversa;</p>\n\t\t<p>pute la terra che questo riceve.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cerbero, fiera crudele e diversa,</p>\n\t\t<p>con tre gole caninamente latra</p>\n\t\t<p>sovra la gente che quivi &egrave; sommersa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Li occhi ha vermigli, la barba unta e atra,</p>\n\t\t<p>e &rsquo;l ventre largo, e unghiate le mani;</p>\n\t\t<p>graffia li spirti ed iscoia ed isquatra.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Urlar li fa la pioggia come cani;</p>\n\t\t<p>de l&rsquo;un de&rsquo; lati fanno a l&rsquo;altro schermo;</p>\n\t\t<p>volgonsi spesso i miseri profani.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quando ci scorse Cerbero, il gran vermo,</p>\n\t\t<p>le bocche aperse e mostrocci le sanne;</p>\n\t\t<p>non avea membro che tenesse fermo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E &rsquo;l duca mio distese le sue spanne,</p>\n\t\t<p>prese la terra, e con piene le pugna</p>\n\t\t<p>la gitt&ograve; dentro a le bramose canne.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Qual &egrave; quel cane ch&rsquo;abbaiando agogna,</p>\n\t\t<p>e si racqueta poi che &rsquo;l pasto morde,</p>\n\t\t<p>ch&eacute; solo a divorarlo intende e pugna,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>cotai si fecer quelle facce lorde</p>\n\t\t<p>de lo demonio Cerbero, che &rsquo;ntrona</p>\n\t\t<p>l&rsquo;anime s&igrave;, ch&rsquo;esser vorrebber sorde.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Noi passavam su per l&rsquo;ombre che adona</p>\n\t\t<p>la greve pioggia, e ponavam le piante</p>\n\t\t<p>sovra lor vanit&agrave; che par persona.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Elle giacean per terra tutte quante,</p>\n\t\t<p>fuor d&rsquo;una ch&rsquo;a seder si lev&ograve;, ratto</p>\n\t\t<p>ch&rsquo;ella ci vide passarsi davante.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;O tu che se&rsquo; per questo &rsquo;nferno tratto&raquo;,</p>\n\t\t<p>mi disse, &laquo;riconoscimi, se sai:</p>\n\t\t<p>tu fosti, prima ch&rsquo;io disfatto, fatto&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io a lui: &laquo;L&rsquo;angoscia che tu hai</p>\n\t\t<p>forse ti tira fuor de la mia mente,</p>\n\t\t<p>s&igrave; che non par ch&rsquo;i&rsquo; ti vedessi mai.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma dimmi chi tu se&rsquo; che &rsquo;n s&igrave; dolente</p>\n\t\t<p>loco se&rsquo; messo, e hai s&igrave; fatta pena,</p>\n\t\t<p>che, s&rsquo;altra &egrave; maggio, nulla &egrave; s&igrave; spiacente&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;La tua citt&agrave;, ch&rsquo;&egrave; piena</p>\n\t\t<p>d&rsquo;invidia s&igrave; che gi&agrave; trabocca il sacco,</p>\n\t\t<p>seco mi tenne in la vita serena.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Voi cittadini mi chiamaste Ciacco:</p>\n\t\t<p>per la dannosa colpa de la gola,</p>\n\t\t<p>come tu vedi, a la pioggia mi fiacco.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io anima trista non son sola,</p>\n\t\t<p>ch&eacute; tutte queste a simil pena stanno</p>\n\t\t<p>per simil colpa&raquo;. E pi&ugrave; non f&eacute; parola.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io li rispuosi: &laquo;Ciacco, il tuo affanno</p>\n\t\t<p>mi pesa s&igrave;, ch&rsquo;a lagrimar mi &rsquo;nvita;</p>\n\t\t<p>ma dimmi, se tu sai, a che verranno</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>li cittadin de la citt&agrave; partita;</p>\n\t\t<p>s&rsquo;alcun v&rsquo;&egrave; giusto; e dimmi la cagione</p>\n\t\t<p>per che l&rsquo;ha tanta discordia assalita&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quelli a me: &laquo;Dopo lunga tencione</p>\n\t\t<p>verranno al sangue, e la parte selvaggia</p>\n\t\t<p>caccer&agrave; l&rsquo;altra con molta offensione.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi appresso convien che questa caggia</p>\n\t\t<p>infra tre soli, e che l&rsquo;altra sormonti</p>\n\t\t<p>con la forza di tal che test&eacute; piaggia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Alte terr&agrave; lungo tempo le fronti,</p>\n\t\t<p>tenendo l&rsquo;altra sotto gravi pesi,</p>\n\t\t<p>come che di ci&ograve; pianga o che n&rsquo;aonti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Giusti son due, e non vi sono intesi;</p>\n\t\t<p>superbia, invidia e avarizia sono</p>\n\t\t<p>le tre faville c&rsquo;hanno i cuori accesi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Qui puose fine al lagrimabil suono.</p>\n\t\t<p>E io a lui: &laquo;Ancor vo&rsquo; che mi &rsquo;nsegni</p>\n\t\t<p>e che di pi&ugrave; parlar mi facci dono.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Farinata e &rsquo;l Tegghiaio, che fuor s&igrave; degni,</p>\n\t\t<p>Iacopo Rusticucci, Arrigo e &rsquo;l Mosca</p>\n\t\t<p>e li altri ch&rsquo;a ben far puoser li &rsquo;ngegni,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>dimmi ove sono e fa ch&rsquo;io li conosca;</p>\n\t\t<p>ch&eacute; gran disio mi stringe di savere</p>\n\t\t<p>se &rsquo;l ciel li addolcia o lo &rsquo;nferno li attosca&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quelli: &laquo;Ei son tra l&rsquo;anime pi&ugrave; nere;</p>\n\t\t<p>diverse colpe gi&ugrave; li grava al fondo:</p>\n\t\t<p>se tanto scendi, l&agrave; i potrai vedere.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma quando tu sarai nel dolce mondo,</p>\n\t\t<p>priegoti ch&rsquo;a la mente altrui mi rechi:</p>\n\t\t<p>pi&ugrave; non ti dico e pi&ugrave; non ti rispondo&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Li diritti occhi torse allora in biechi;</p>\n\t\t<p>guardommi un poco e poi chin&ograve; la testa:</p>\n\t\t<p>cadde con essa a par de li altri ciechi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E &rsquo;l duca disse a me: &laquo;Pi&ugrave; non si desta</p>\n\t\t<p>di qua dal suon de l&rsquo;angelica tromba,</p>\n\t\t<p>quando verr&agrave; la nimica podesta:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ciascun riveder&agrave; la trista tomba,</p>\n\t\t<p>ripiglier&agrave; sua carne e sua figura,</p>\n\t\t<p>udir&agrave; quel ch&rsquo;in etterno rimbomba&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>S&igrave; trapassammo per sozza mistura</p>\n\t\t<p>de l&rsquo;ombre e de la pioggia, a passi lenti,</p>\n\t\t<p>toccando un poco la vita futura;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>per ch&rsquo;io dissi: &laquo;Maestro, esti tormenti</p>\n\t\t<p>crescerann&rsquo; ei dopo la gran sentenza,</p>\n\t\t<p>o fier minori, o saran s&igrave; cocenti?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;Ritorna a tua sc&iuml;enza,</p>\n\t\t<p>che vuol, quanto la cosa &egrave; pi&ugrave; perfetta,</p>\n\t\t<p>pi&ugrave; senta il bene, e cos&igrave; la doglienza.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tutto che questa gente maladetta</p>\n\t\t<p>in vera perfezion gi&agrave; mai non vada,</p>\n\t\t<p>di l&agrave; pi&ugrave; che di qua essere aspetta&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Noi aggirammo a tondo quella strada,</p>\n\t\t<p>parlando pi&ugrave; assai ch&rsquo;i&rsquo; non ridico;</p>\n\t\t<p>venimmo al punto dove si digrada:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>quivi trovammo Pluto, il gran nemico.</p>\n\t\t</div>','<p class="cantohead">7</p>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Pape Sat&agrave;n, pape Sat&agrave;n aleppe!&raquo;,</p>\n\t\t<p>cominci&ograve; Pluto con la voce chioccia;</p>\n\t\t<p>e quel savio gentil, che tutto seppe,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>disse per confortarmi: &laquo;Non ti noccia</p>\n\t\t<p>la tua paura; ch&eacute;, poder ch&rsquo;elli abbia,</p>\n\t\t<p>non ci torr&agrave; lo scender questa roccia&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi si rivolse a quella &rsquo;nfiata labbia,</p>\n\t\t<p>e disse: &laquo;Taci, maladetto lupo!</p>\n\t\t<p>consuma dentro te con la tua rabbia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non &egrave; sanza cagion l&rsquo;andare al cupo:</p>\n\t\t<p>vuolsi ne l&rsquo;alto, l&agrave; dove Michele</p>\n\t\t<p>f&eacute; la vendetta del superbo strupo&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quali dal vento le gonfiate vele</p>\n\t\t<p>caggiono avvolte, poi che l&rsquo;alber fiacca,</p>\n\t\t<p>tal cadde a terra la fiera crudele.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; scendemmo ne la quarta lacca,</p>\n\t\t<p>pigliando pi&ugrave; de la dolente ripa</p>\n\t\t<p>che &rsquo;l mal de l&rsquo;universo tutto insacca.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ahi giustizia di Dio! tante chi stipa</p>\n\t\t<p>nove travaglie e pene quant&rsquo; io viddi?</p>\n\t\t<p>e perch&eacute; nostra colpa s&igrave; ne scipa?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Come fa l&rsquo;onda l&agrave; sovra Cariddi,</p>\n\t\t<p>che si frange con quella in cui s&rsquo;intoppa,</p>\n\t\t<p>cos&igrave; convien che qui la gente riddi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Qui vid&rsquo; i&rsquo; gente pi&ugrave; ch&rsquo;altrove troppa,</p>\n\t\t<p>e d&rsquo;una parte e d&rsquo;altra, con grand&rsquo; urli,</p>\n\t\t<p>voltando pesi per forza di poppa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Percot\xEBansi &rsquo;ncontro; e poscia pur l&igrave;</p>\n\t\t<p>si rivolgea ciascun, voltando a retro,</p>\n\t\t<p>gridando: &laquo;Perch&eacute; tieni?&raquo; e &laquo;Perch&eacute; burli?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; tornavan per lo cerchio tetro</p>\n\t\t<p>da ogne mano a l&rsquo;opposito punto,</p>\n\t\t<p>gridandosi anche loro ontoso metro;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>poi si volgea ciascun, quand&rsquo; era giunto,</p>\n\t\t<p>per lo suo mezzo cerchio a l&rsquo;altra giostra.</p>\n\t\t<p>E io, ch&rsquo;avea lo cor quasi compunto,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>dissi: &laquo;Maestro mio, or mi dimostra</p>\n\t\t<p>che gente &egrave; questa, e se tutti fuor cherci</p>\n\t\t<p>questi chercuti a la sinistra nostra&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;Tutti quanti fuor guerci</p>\n\t\t<p>s&igrave; de la mente in la vita primaia,</p>\n\t\t<p>che con misura nullo spendio ferci.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Assai la voce lor chiaro l&rsquo;abbaia,</p>\n\t\t<p>quando vegnono a&rsquo; due punti del cerchio</p>\n\t\t<p>dove colpa contraria li dispaia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Questi fuor cherci, che non han coperchio</p>\n\t\t<p>piloso al capo, e papi e cardinali,</p>\n\t\t<p>in cui usa avarizia il suo soperchio&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io: &laquo;Maestro, tra questi cotali</p>\n\t\t<p>dovre&rsquo; io ben riconoscere alcuni</p>\n\t\t<p>che furo immondi di cotesti mali&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;Vano pensiero aduni:</p>\n\t\t<p>la sconoscente vita che i f&eacute; sozzi,</p>\n\t\t<p>ad ogne conoscenza or li fa bruni.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>In etterno verranno a li due cozzi:</p>\n\t\t<p>questi resurgeranno del sepulcro</p>\n\t\t<p>col pugno chiuso, e questi coi crin mozzi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Mal dare e mal tener lo mondo pulcro</p>\n\t\t<p>ha tolto loro, e posti a questa zuffa:</p>\n\t\t<p>qual ella sia, parole non ci appulcro.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Or puoi, figliuol, veder la corta buffa</p>\n\t\t<p>d&rsquo;i ben che son commessi a la fortuna,</p>\n\t\t<p>per che l&rsquo;umana gente si rabbuffa;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&eacute; tutto l&rsquo;oro ch&rsquo;&egrave; sotto la luna</p>\n\t\t<p>e che gi&agrave; fu, di quest&rsquo; anime stanche</p>\n\t\t<p>non poterebbe farne posare una&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Maestro mio&raquo;, diss&rsquo; io, &laquo;or mi d&igrave; anche:</p>\n\t\t<p>questa fortuna di che tu mi tocche,</p>\n\t\t<p>che &egrave;, che i ben del mondo ha s&igrave; tra branche?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quelli a me: &laquo;Oh creature sciocche,</p>\n\t\t<p>quanta ignoranza &egrave; quella che v&rsquo;offende!</p>\n\t\t<p>Or vo&rsquo; che tu mia sentenza ne &rsquo;mbocche.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Colui lo cui saver tutto trascende,</p>\n\t\t<p>fece li cieli e di&egrave; lor chi conduce</p>\n\t\t<p>s&igrave;, ch&rsquo;ogne parte ad ogne parte splende,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>distribuendo igualmente la luce.</p>\n\t\t<p>Similemente a li splendor mondani</p>\n\t\t<p>ordin&ograve; general ministra e duce</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che permutasse a tempo li ben vani</p>\n\t\t<p>di gente in gente e d&rsquo;uno in altro sangue,</p>\n\t\t<p>oltre la difension d&rsquo;i senni umani;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>per ch&rsquo;una gente impera e l&rsquo;altra langue,</p>\n\t\t<p>seguendo lo giudicio di costei,</p>\n\t\t<p>che &egrave; occulto come in erba l&rsquo;angue.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Vostro saver non ha contasto a lei:</p>\n\t\t<p>questa provede, giudica, e persegue</p>\n\t\t<p>suo regno come il loro li altri d&egrave;i.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Le sue permutazion non hanno triegue:</p>\n\t\t<p>necessit&agrave; la fa esser veloce;</p>\n\t\t<p>s&igrave; spesso vien chi vicenda consegue.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quest&rsquo; &egrave; colei ch&rsquo;&egrave; tanto posta in croce</p>\n\t\t<p>pur da color che le dovrien dar lode,</p>\n\t\t<p>dandole biasmo a torto e mala voce;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ma ella s&rsquo;&egrave; beata e ci&ograve; non ode:</p>\n\t\t<p>con l&rsquo;altre prime creature lieta</p>\n\t\t<p>volve sua spera e beata si gode.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Or discendiamo omai a maggior pieta;</p>\n\t\t<p>gi&agrave; ogne stella cade che saliva</p>\n\t\t<p>quand&rsquo; io mi mossi, e &rsquo;l troppo star si vieta&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Noi ricidemmo il cerchio a l&rsquo;altra riva</p>\n\t\t<p>sovr&rsquo; una fonte che bolle e riversa</p>\n\t\t<p>per un fossato che da lei deriva.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>L&rsquo;acqua era buia assai pi&ugrave; che persa;</p>\n\t\t<p>e noi, in compagnia de l&rsquo;onde bige,</p>\n\t\t<p>intrammo gi&ugrave; per una via diversa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>In la palude va c&rsquo;ha nome Stige</p>\n\t\t<p>questo tristo ruscel, quand&rsquo; &egrave; disceso</p>\n\t\t<p>al pi&egrave; de le maligne piagge grige.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io, che di mirare stava inteso,</p>\n\t\t<p>vidi genti fangose in quel pantano,</p>\n\t\t<p>ignude tutte, con sembiante offeso.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Queste si percotean non pur con mano,</p>\n\t\t<p>ma con la testa e col petto e coi piedi,</p>\n\t\t<p>troncandosi co&rsquo; denti a brano a brano.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo buon maestro disse: &laquo;Figlio, or vedi</p>\n\t\t<p>l&rsquo;anime di color cui vinse l&rsquo;ira;</p>\n\t\t<p>e anche vo&rsquo; che tu per certo credi</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che sotto l&rsquo;acqua &egrave; gente che sospira,</p>\n\t\t<p>e fanno pullular quest&rsquo; acqua al summo,</p>\n\t\t<p>come l&rsquo;occhio ti dice, u&rsquo; che s&rsquo;aggira.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Fitti nel limo dicon: \u201CTristi fummo</p>\n\t\t<p>ne l&rsquo;aere dolce che dal sol s&rsquo;allegra,</p>\n\t\t<p>portando dentro accid&iuml;oso fummo:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>or ci attristiam ne la belletta negra\u201D.</p>\n\t\t<p>Quest&rsquo; inno si gorgoglian ne la strozza,</p>\n\t\t<p>ch&eacute; dir nol posson con parola integra&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; girammo de la lorda pozza</p>\n\t\t<p>grand&rsquo; arco tra la ripa secca e &rsquo;l m&eacute;zzo,</p>\n\t\t<p>con li occhi v&ograve;lti a chi del fango ingozza.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Venimmo al pi&egrave; d&rsquo;una torre al da sezzo.</p>\n\t\t</div>','<p class="cantohead">8</p>\n\t\t<div class="stanza">\n\t\t\t<p>Io dico, seguitando, ch&rsquo;assai prima</p>\n\t\t<p>che noi fossimo al pi&egrave; de l&rsquo;alta torre,</p>\n\t\t<p>li occhi nostri n&rsquo;andar suso a la cima</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>per due fiammette che i vedemmo porre,</p>\n\t\t<p>e un&rsquo;altra da lungi render cenno,</p>\n\t\t<p>tanto ch&rsquo;a pena il potea l&rsquo;occhio t&ograve;rre.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io mi volsi al mar di tutto &rsquo;l senno;</p>\n\t\t<p>dissi: &laquo;Questo che dice? e che risponde</p>\n\t\t<p>quell&rsquo; altro foco? e chi son quei che &rsquo;l fenno?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;Su per le sucide onde</p>\n\t\t<p>gi&agrave; scorgere puoi quello che s&rsquo;aspetta,</p>\n\t\t<p>se &rsquo;l fummo del pantan nol ti nasconde&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Corda non pinse mai da s&eacute; saetta</p>\n\t\t<p>che s&igrave; corresse via per l&rsquo;aere snella,</p>\n\t\t<p>com&rsquo; io vidi una nave piccioletta</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>venir per l&rsquo;acqua verso noi in quella,</p>\n\t\t<p>sotto &rsquo;l governo d&rsquo;un sol galeoto,</p>\n\t\t<p>che gridava: &laquo;Or se&rsquo; giunta, anima fella!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Fleg&iuml;&agrave;s, Fleg&iuml;&agrave;s, tu gridi a v&ograve;to&raquo;,</p>\n\t\t<p>disse lo mio segnore, &laquo;a questa volta:</p>\n\t\t<p>pi&ugrave; non ci avrai che sol passando il loto&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Qual &egrave; colui che grande inganno ascolta</p>\n\t\t<p>che li sia fatto, e poi se ne rammarca,</p>\n\t\t<p>fecesi Fleg&iuml;&agrave;s ne l&rsquo;ira accolta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo duca mio discese ne la barca,</p>\n\t\t<p>e poi mi fece intrare appresso lui;</p>\n\t\t<p>e sol quand&rsquo; io fui dentro parve carca.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tosto che &rsquo;l duca e io nel legno fui,</p>\n\t\t<p>segando se ne va l&rsquo;antica prora</p>\n\t\t<p>de l&rsquo;acqua pi&ugrave; che non suol con altrui.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Mentre noi corravam la morta gora,</p>\n\t\t<p>dinanzi mi si fece un pien di fango,</p>\n\t\t<p>e disse: &laquo;Chi se&rsquo; tu che vieni anzi ora?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io a lui: &laquo;S&rsquo;i&rsquo; vegno, non rimango;</p>\n\t\t<p>ma tu chi se&rsquo;, che s&igrave; se&rsquo; fatto brutto?&raquo;.</p>\n\t\t<p>Rispuose: &laquo;Vedi che son un che piango&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io a lui: &laquo;Con piangere e con lutto,</p>\n\t\t<p>spirito maladetto, ti rimani;</p>\n\t\t<p>ch&rsquo;i&rsquo; ti conosco, ancor sie lordo tutto&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor distese al legno ambo le mani;</p>\n\t\t<p>per che &rsquo;l maestro accorto lo sospinse,</p>\n\t\t<p>dicendo: &laquo;Via cost&agrave; con li altri cani!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo collo poi con le braccia mi cinse;</p>\n\t\t<p>basciommi &rsquo;l volto e disse: &laquo;Alma sdegnosa,</p>\n\t\t<p>benedetta colei che &rsquo;n te s&rsquo;incinse!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quei fu al mondo persona orgogliosa;</p>\n\t\t<p>bont&agrave; non &egrave; che sua memoria fregi:</p>\n\t\t<p>cos&igrave; s&rsquo;&egrave; l&rsquo;ombra sua qui fur&iuml;osa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quanti si tegnon or l&agrave; s&ugrave; gran regi</p>\n\t\t<p>che qui staranno come porci in brago,</p>\n\t\t<p>di s&eacute; lasciando orribili dispregi!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io: &laquo;Maestro, molto sarei vago</p>\n\t\t<p>di vederlo attuffare in questa broda</p>\n\t\t<p>prima che noi uscissimo del lago&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;Avante che la proda</p>\n\t\t<p>ti si lasci veder, tu sarai sazio:</p>\n\t\t<p>di tal dis&iuml;o convien che tu goda&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Dopo ci&ograve; poco vid&rsquo; io quello strazio</p>\n\t\t<p>far di costui a le fangose genti,</p>\n\t\t<p>che Dio ancor ne lodo e ne ringrazio.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tutti gridavano: &laquo;A Filippo Argenti!&raquo;;</p>\n\t\t<p>e &rsquo;l fiorentino spirito bizzarro</p>\n\t\t<p>in s&eacute; medesmo si volvea co&rsquo; denti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quivi il lasciammo, che pi&ugrave; non ne narro;</p>\n\t\t<p>ma ne l&rsquo;orecchie mi percosse un duolo,</p>\n\t\t<p>per ch&rsquo;io avante l&rsquo;occhio intento sbarro.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo buon maestro disse: &laquo;Omai, figliuolo,</p>\n\t\t<p>s&rsquo;appressa la citt&agrave; c&rsquo;ha nome Dite,</p>\n\t\t<p>coi gravi cittadin, col grande stuolo&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io: &laquo;Maestro, gi&agrave; le sue meschite</p>\n\t\t<p>l&agrave; entro certe ne la valle cerno,</p>\n\t\t<p>vermiglie come se di foco uscite</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>fossero&raquo;. Ed ei mi disse: &laquo;Il foco etterno</p>\n\t\t<p>ch&rsquo;entro l&rsquo;affoca le dimostra rosse,</p>\n\t\t<p>come tu vedi in questo basso inferno&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Noi pur giugnemmo dentro a l&rsquo;alte fosse</p>\n\t\t<p>che vallan quella terra sconsolata:</p>\n\t\t<p>le mura mi parean che ferro fosse.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non sanza prima far grande aggirata,</p>\n\t\t<p>venimmo in parte dove il nocchier forte</p>\n\t\t<p>&laquo;Usciteci&raquo;, grid&ograve;: &laquo;qui &egrave; l&rsquo;intrata&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io vidi pi&ugrave; di mille in su le porte</p>\n\t\t<p>da ciel piovuti, che stizzosamente</p>\n\t\t<p>dicean: &laquo;Chi &egrave; costui che sanza morte</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>va per lo regno de la morta gente?&raquo;.</p>\n\t\t<p>E &rsquo;l savio mio maestro fece segno</p>\n\t\t<p>di voler lor parlar segretamente.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor chiusero un poco il gran disdegno</p>\n\t\t<p>e disser: &laquo;Vien tu solo, e quei sen vada</p>\n\t\t<p>che s&igrave; ardito intr&ograve; per questo regno.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Sol si ritorni per la folle strada:</p>\n\t\t<p>pruovi, se sa; ch&eacute; tu qui rimarrai,</p>\n\t\t<p>che li ha&rsquo; iscorta s&igrave; buia contrada&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Pensa, lettor, se io mi sconfortai</p>\n\t\t<p>nel suon de le parole maladette,</p>\n\t\t<p>ch&eacute; non credetti ritornarci mai.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;O caro duca mio, che pi&ugrave; di sette</p>\n\t\t<p>volte m&rsquo;hai sicurt&agrave; renduta e tratto</p>\n\t\t<p>d&rsquo;alto periglio che &rsquo;ncontra mi stette,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>non mi lasciar&raquo;, diss&rsquo; io, &laquo;cos&igrave; disfatto;</p>\n\t\t<p>e se &rsquo;l passar pi&ugrave; oltre ci &egrave; negato,</p>\n\t\t<p>ritroviam l&rsquo;orme nostre insieme ratto&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quel segnor che l&igrave; m&rsquo;avea menato,</p>\n\t\t<p>mi disse: &laquo;Non temer; ch&eacute; &rsquo;l nostro passo</p>\n\t\t<p>non ci pu&ograve; t&ograve;rre alcun: da tal n&rsquo;&egrave; dato.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma qui m&rsquo;attendi, e lo spirito lasso</p>\n\t\t<p>conforta e ciba di speranza buona,</p>\n\t\t<p>ch&rsquo;i&rsquo; non ti lascer&ograve; nel mondo basso&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; sen va, e quivi m&rsquo;abbandona</p>\n\t\t<p>lo dolce padre, e io rimagno in forse,</p>\n\t\t<p>che s&igrave; e no nel capo mi tenciona.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Udir non potti quello ch&rsquo;a lor porse;</p>\n\t\t<p>ma ei non stette l&agrave; con essi guari,</p>\n\t\t<p>che ciascun dentro a pruova si ricorse.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Chiuser le porte que&rsquo; nostri avversari</p>\n\t\t<p>nel petto al mio segnor, che fuor rimase</p>\n\t\t<p>e rivolsesi a me con passi rari.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Li occhi a la terra e le ciglia avea rase</p>\n\t\t<p>d&rsquo;ogne baldanza, e dicea ne&rsquo; sospiri:</p>\n\t\t<p>&laquo;Chi m&rsquo;ha negate le dolenti case!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E a me disse: &laquo;Tu, perch&rsquo; io m&rsquo;adiri,</p>\n\t\t<p>non sbigottir, ch&rsquo;io vincer&ograve; la prova,</p>\n\t\t<p>qual ch&rsquo;a la difension dentro s&rsquo;aggiri.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Questa lor tracotanza non &egrave; nova;</p>\n\t\t<p>ch&eacute; gi&agrave; l&rsquo;usaro a men segreta porta,</p>\n\t\t<p>la qual sanza serrame ancor si trova.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Sovr&rsquo; essa vedest&ugrave; la scritta morta:</p>\n\t\t<p>e gi&agrave; di qua da lei discende l&rsquo;erta,</p>\n\t\t<p>passando per li cerchi sanza scorta,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>tal che per lui ne fia la terra aperta&raquo;.</p>\n\t\t</div>','<p class="cantohead">9</p>\n\t\t<div class="stanza">\n\t\t\t<p>Quel color che vilt&agrave; di fuor mi pinse</p>\n\t\t<p>veggendo il duca mio tornare in volta,</p>\n\t\t<p>pi&ugrave; tosto dentro il suo novo ristrinse.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Attento si ferm&ograve; com&rsquo; uom ch&rsquo;ascolta;</p>\n\t\t<p>ch&eacute; l&rsquo;occhio nol potea menare a lunga</p>\n\t\t<p>per l&rsquo;aere nero e per la nebbia folta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Pur a noi converr&agrave; vincer la punga&raquo;,</p>\n\t\t<p>cominci&ograve; el, &laquo;se non . . . Tal ne s&rsquo;offerse.</p>\n\t\t<p>Oh quanto tarda a me ch&rsquo;altri qui giunga!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>I&rsquo; vidi ben s&igrave; com&rsquo; ei ricoperse</p>\n\t\t<p>lo cominciar con l&rsquo;altro che poi venne,</p>\n\t\t<p>che fur parole a le prime diverse;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ma nondimen paura il suo dir dienne,</p>\n\t\t<p>perch&rsquo; io traeva la parola tronca</p>\n\t\t<p>forse a peggior sentenzia che non tenne.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;In questo fondo de la trista conca</p>\n\t\t<p>discende mai alcun del primo grado,</p>\n\t\t<p>che sol per pena ha la speranza cionca?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Questa question fec&rsquo; io; e quei &laquo;Di rado</p>\n\t\t<p>incontra&raquo;, mi rispuose, &laquo;che di noi</p>\n\t\t<p>faccia il cammino alcun per qual io vado.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ver &egrave; ch&rsquo;altra f&iuml;ata qua gi&ugrave; fui,</p>\n\t\t<p>congiurato da quella Erit&oacute;n cruda</p>\n\t\t<p>che richiamava l&rsquo;ombre a&rsquo; corpi sui.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Di poco era di me la carne nuda,</p>\n\t\t<p>ch&rsquo;ella mi fece intrar dentr&rsquo; a quel muro,</p>\n\t\t<p>per trarne un spirto del cerchio di Giuda.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quell&rsquo; &egrave; &rsquo;l pi&ugrave; basso loco e &rsquo;l pi&ugrave; oscuro,</p>\n\t\t<p>e &rsquo;l pi&ugrave; lontan dal ciel che tutto gira:</p>\n\t\t<p>ben so &rsquo;l cammin; per&ograve; ti fa sicuro.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Questa palude che &rsquo;l gran puzzo spira</p>\n\t\t<p>cigne dintorno la citt&agrave; dolente,</p>\n\t\t<p>u&rsquo; non potemo intrare omai sanz&rsquo; ira&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E altro disse, ma non l&rsquo;ho a mente;</p>\n\t\t<p>per&ograve; che l&rsquo;occhio m&rsquo;avea tutto tratto</p>\n\t\t<p>ver&rsquo; l&rsquo;alta torre a la cima rovente,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>dove in un punto furon dritte ratto</p>\n\t\t<p>tre fur&iuml;e infernal di sangue tinte,</p>\n\t\t<p>che membra feminine avieno e atto,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e con idre verdissime eran cinte;</p>\n\t\t<p>serpentelli e ceraste avien per crine,</p>\n\t\t<p>onde le fiere tempie erano avvinte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quei, che ben conobbe le meschine</p>\n\t\t<p>de la regina de l&rsquo;etterno pianto,</p>\n\t\t<p>&laquo;Guarda&raquo;, mi disse, &laquo;le feroci Erine.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quest&rsquo; &egrave; Megera dal sinistro canto;</p>\n\t\t<p>quella che piange dal destro &egrave; Aletto;</p>\n\t\t<p>Tesif&oacute;n &egrave; nel mezzo&raquo;; e tacque a tanto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Con l&rsquo;unghie si fendea ciascuna il petto;</p>\n\t\t<p>battiensi a palme e gridavan s&igrave; alto,</p>\n\t\t<p>ch&rsquo;i&rsquo; mi strinsi al poeta per sospetto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Vegna Medusa: s&igrave; &rsquo;l farem di smalto&raquo;,</p>\n\t\t<p>dicevan tutte riguardando in giuso;</p>\n\t\t<p>&laquo;mal non vengiammo in Tes\xEBo l&rsquo;assalto&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Volgiti &rsquo;n dietro e tien lo viso chiuso;</p>\n\t\t<p>ch&eacute; se &rsquo;l Gorg&oacute;n si mostra e tu &rsquo;l vedessi,</p>\n\t\t<p>nulla sarebbe di tornar mai suso&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; disse &rsquo;l maestro; ed elli stessi</p>\n\t\t<p>mi volse, e non si tenne a le mie mani,</p>\n\t\t<p>che con le sue ancor non mi chiudessi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>O voi ch&rsquo;avete li &rsquo;ntelletti sani,</p>\n\t\t<p>mirate la dottrina che s&rsquo;asconde</p>\n\t\t<p>sotto &rsquo;l velame de li versi strani.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E gi&agrave; ven&igrave;a su per le torbide onde</p>\n\t\t<p>un fracasso d&rsquo;un suon, pien di spavento,</p>\n\t\t<p>per cui tremavano amendue le sponde,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>non altrimenti fatto che d&rsquo;un vento</p>\n\t\t<p>impet&uuml;oso per li avversi ardori,</p>\n\t\t<p>che fier la selva e sanz&rsquo; alcun rattento</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>li rami schianta, abbatte e porta fori;</p>\n\t\t<p>dinanzi polveroso va superbo,</p>\n\t\t<p>e fa fuggir le fiere e li pastori.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Li occhi mi sciolse e disse: &laquo;Or drizza il nerbo</p>\n\t\t<p>del viso su per quella schiuma antica</p>\n\t\t<p>per indi ove quel fummo &egrave; pi&ugrave; acerbo&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Come le rane innanzi a la nimica</p>\n\t\t<p>biscia per l&rsquo;acqua si dileguan tutte,</p>\n\t\t<p>fin ch&rsquo;a la terra ciascuna s&rsquo;abbica,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>vid&rsquo; io pi&ugrave; di mille anime distrutte</p>\n\t\t<p>fuggir cos&igrave; dinanzi ad un ch&rsquo;al passo</p>\n\t\t<p>passava Stige con le piante asciutte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Dal volto rimovea quell&rsquo; aere grasso,</p>\n\t\t<p>menando la sinistra innanzi spesso;</p>\n\t\t<p>e sol di quell&rsquo; angoscia parea lasso.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ben m&rsquo;accorsi ch&rsquo;elli era da ciel messo,</p>\n\t\t<p>e volsimi al maestro; e quei f&eacute; segno</p>\n\t\t<p>ch&rsquo;i&rsquo; stessi queto ed inchinassi ad esso.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ahi quanto mi parea pien di disdegno!</p>\n\t\t<p>Venne a la porta e con una verghetta</p>\n\t\t<p>l&rsquo;aperse, che non v&rsquo;ebbe alcun ritegno.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;O cacciati del ciel, gente dispetta&raquo;,</p>\n\t\t<p>cominci&ograve; elli in su l&rsquo;orribil soglia,</p>\n\t\t<p>&laquo;ond&rsquo; esta oltracotanza in voi s&rsquo;alletta?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Perch&eacute; recalcitrate a quella voglia</p>\n\t\t<p>a cui non puote il fin mai esser mozzo,</p>\n\t\t<p>e che pi&ugrave; volte v&rsquo;ha cresciuta doglia?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Che giova ne le fata dar di cozzo?</p>\n\t\t<p>Cerbero vostro, se ben vi ricorda,</p>\n\t\t<p>ne porta ancor pelato il mento e &rsquo;l gozzo&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi si rivolse per la strada lorda,</p>\n\t\t<p>e non f&eacute; motto a noi, ma f&eacute; sembiante</p>\n\t\t<p>d&rsquo;omo cui altra cura stringa e morda</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che quella di colui che li &egrave; davante;</p>\n\t\t<p>e noi movemmo i piedi inver&rsquo; la terra,</p>\n\t\t<p>sicuri appresso le parole sante.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Dentro li &rsquo;ntrammo sanz&rsquo; alcuna guerra;</p>\n\t\t<p>e io, ch&rsquo;avea di riguardar disio</p>\n\t\t<p>la condizion che tal fortezza serra,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>com&rsquo; io fui dentro, l&rsquo;occhio intorno invio:</p>\n\t\t<p>e veggio ad ogne man grande campagna,</p>\n\t\t<p>piena di duolo e di tormento rio.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>S&igrave; come ad Arli, ove Rodano stagna,</p>\n\t\t<p>s&igrave; com&rsquo; a Pola, presso del Carnaro</p>\n\t\t<p>ch&rsquo;Italia chiude e suoi termini bagna,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>fanno i sepulcri tutt&rsquo; il loco varo,</p>\n\t\t<p>cos&igrave; facevan quivi d&rsquo;ogne parte,</p>\n\t\t<p>salvo che &rsquo;l modo v&rsquo;era pi&ugrave; amaro;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&eacute; tra li avelli fiamme erano sparte,</p>\n\t\t<p>per le quali eran s&igrave; del tutto accesi,</p>\n\t\t<p>che ferro pi&ugrave; non chiede verun&rsquo; arte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tutti li lor coperchi eran sospesi,</p>\n\t\t<p>e fuor n&rsquo;uscivan s&igrave; duri lamenti,</p>\n\t\t<p>che ben parean di miseri e d&rsquo;offesi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io: &laquo;Maestro, quai son quelle genti</p>\n\t\t<p>che, seppellite dentro da quell&rsquo; arche,</p>\n\t\t<p>si fan sentir coi sospiri dolenti?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quelli a me: &laquo;Qui son li eres&iuml;arche</p>\n\t\t<p>con lor seguaci, d&rsquo;ogne setta, e molto</p>\n\t\t<p>pi&ugrave; che non credi son le tombe carche.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Simile qui con simile &egrave; sepolto,</p>\n\t\t<p>e i monimenti son pi&ugrave; e men caldi&raquo;.</p>\n\t\t<p>E poi ch&rsquo;a la man destra si fu v&ograve;lto,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>passammo tra i mart&igrave;ri e li alti spaldi.</p>\n\t\t</div>','<p class="cantohead">10</p>\n\t\t<div class="stanza">\n\t\t\t<p>Ora sen va per un secreto calle,</p>\n\t\t<p>tra &rsquo;l muro de la terra e li mart&igrave;ri,</p>\n\t\t<p>lo mio maestro, e io dopo le spalle.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;O virt&ugrave; somma, che per li empi giri</p>\n\t\t<p>mi volvi&raquo;, cominciai, &laquo;com&rsquo; a te piace,</p>\n\t\t<p>parlami, e sodisfammi a&rsquo; miei disiri.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>La gente che per li sepolcri giace</p>\n\t\t<p>potrebbesi veder? gi&agrave; son levati</p>\n\t\t<p>tutt&rsquo; i coperchi, e nessun guardia face&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quelli a me: &laquo;Tutti saran serrati</p>\n\t\t<p>quando di Iosaf&agrave;t qui torneranno</p>\n\t\t<p>coi corpi che l&agrave; s&ugrave; hanno lasciati.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Suo cimitero da questa parte hanno</p>\n\t\t<p>con Epicuro tutti suoi seguaci,</p>\n\t\t<p>che l&rsquo;anima col corpo morta fanno.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per&ograve; a la dimanda che mi faci</p>\n\t\t<p>quinc&rsquo; entro satisfatto sar&agrave; tosto,</p>\n\t\t<p>e al disio ancor che tu mi taci&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io: &laquo;Buon duca, non tegno riposto</p>\n\t\t<p>a te mio cuor se non per dicer poco,</p>\n\t\t<p>e tu m&rsquo;hai non pur mo a ci&ograve; disposto&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;O Tosco che per la citt&agrave; del foco</p>\n\t\t<p>vivo ten vai cos&igrave; parlando onesto,</p>\n\t\t<p>piacciati di restare in questo loco.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>La tua loquela ti fa manifesto</p>\n\t\t<p>di quella nobil patr&iuml;a natio,</p>\n\t\t<p>a la qual forse fui troppo molesto&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Subitamente questo suono usc&igrave;o</p>\n\t\t<p>d&rsquo;una de l&rsquo;arche; per&ograve; m&rsquo;accostai,</p>\n\t\t<p>temendo, un poco pi&ugrave; al duca mio.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed el mi disse: &laquo;Volgiti! Che fai?</p>\n\t\t<p>Vedi l&agrave; Farinata che s&rsquo;&egrave; dritto:</p>\n\t\t<p>da la cintola in s&ugrave; tutto &rsquo;l vedrai&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io avea gi&agrave; il mio viso nel suo fitto;</p>\n\t\t<p>ed el s&rsquo;ergea col petto e con la fronte</p>\n\t\t<p>com&rsquo; avesse l&rsquo;inferno a gran dispitto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E l&rsquo;animose man del duca e pronte</p>\n\t\t<p>mi pinser tra le sepulture a lui,</p>\n\t\t<p>dicendo: &laquo;Le parole tue sien conte&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Com&rsquo; io al pi&egrave; de la sua tomba fui,</p>\n\t\t<p>guardommi un poco, e poi, quasi sdegnoso,</p>\n\t\t<p>mi dimand&ograve;: &laquo;Chi fuor li maggior tui?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io ch&rsquo;era d&rsquo;ubidir disideroso,</p>\n\t\t<p>non gliel celai, ma tutto gliel&rsquo; apersi;</p>\n\t\t<p>ond&rsquo; ei lev&ograve; le ciglia un poco in suso;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>poi disse: &laquo;Fieramente furo avversi</p>\n\t\t<p>a me e a miei primi e a mia parte,</p>\n\t\t<p>s&igrave; che per due f&iuml;ate li dispersi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;S&rsquo;ei fur cacciati, ei tornar d&rsquo;ogne parte&raquo;,</p>\n\t\t<p>rispuos&rsquo; io lui, &laquo;l&rsquo;una e l&rsquo;altra f&iuml;ata;</p>\n\t\t<p>ma i vostri non appreser ben quell&rsquo; arte&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor surse a la vista scoperchiata</p>\n\t\t<p>un&rsquo;ombra, lungo questa, infino al mento:</p>\n\t\t<p>credo che s&rsquo;era in ginocchie levata.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Dintorno mi guard&ograve;, come talento</p>\n\t\t<p>avesse di veder s&rsquo;altri era meco;</p>\n\t\t<p>e poi che &rsquo;l sospecciar fu tutto spento,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>piangendo disse: &laquo;Se per questo cieco</p>\n\t\t<p>carcere vai per altezza d&rsquo;ingegno,</p>\n\t\t<p>mio figlio ov&rsquo; &egrave;? e perch&eacute; non &egrave; teco?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io a lui: &laquo;Da me stesso non vegno:</p>\n\t\t<p>colui ch&rsquo;attende l&agrave;, per qui mi mena</p>\n\t\t<p>forse cui Guido vostro ebbe a disdegno&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Le sue parole e &rsquo;l modo de la pena</p>\n\t\t<p>m&rsquo;avean di costui gi&agrave; letto il nome;</p>\n\t\t<p>per&ograve; fu la risposta cos&igrave; piena.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Di s&ugrave;bito drizzato grid&ograve;: &laquo;Come?</p>\n\t\t<p>dicesti \u201Celli ebbe\u201D? non viv&rsquo; elli ancora?</p>\n\t\t<p>non fiere li occhi suoi lo dolce lume?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quando s&rsquo;accorse d&rsquo;alcuna dimora</p>\n\t\t<p>ch&rsquo;io fac\xEBa dinanzi a la risposta,</p>\n\t\t<p>supin ricadde e pi&ugrave; non parve fora.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma quell&rsquo; altro magnanimo, a cui posta</p>\n\t\t<p>restato m&rsquo;era, non mut&ograve; aspetto,</p>\n\t\t<p>n&eacute; mosse collo, n&eacute; pieg&ograve; sua costa;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e s&eacute; contin&uuml;ando al primo detto,</p>\n\t\t<p>&laquo;S&rsquo;elli han quell&rsquo; arte&raquo;, disse, &laquo;male appresa,</p>\n\t\t<p>ci&ograve; mi tormenta pi&ugrave; che questo letto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma non cinquanta volte fia raccesa</p>\n\t\t<p>la faccia de la donna che qui regge,</p>\n\t\t<p>che tu saprai quanto quell&rsquo; arte pesa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E se tu mai nel dolce mondo regge,</p>\n\t\t<p>dimmi: perch&eacute; quel popolo &egrave; s&igrave; empio</p>\n\t\t<p>incontr&rsquo; a&rsquo; miei in ciascuna sua legge?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ond&rsquo; io a lui: &laquo;Lo strazio e &rsquo;l grande scempio</p>\n\t\t<p>che fece l&rsquo;Arbia colorata in rosso,</p>\n\t\t<p>tal orazion fa far nel nostro tempio&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi ch&rsquo;ebbe sospirando il capo mosso,</p>\n\t\t<p>&laquo;A ci&ograve; non fu&rsquo; io sol&raquo;, disse, &laquo;n&eacute; certo</p>\n\t\t<p>sanza cagion con li altri sarei mosso.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma fu&rsquo; io solo, l&agrave; dove sofferto</p>\n\t\t<p>fu per ciascun di t&ograve;rre via Fiorenza,</p>\n\t\t<p>colui che la difesi a viso aperto&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Deh, se riposi mai vostra semenza&raquo;,</p>\n\t\t<p>prega&rsquo; io lui, &laquo;solvetemi quel nodo</p>\n\t\t<p>che qui ha &rsquo;nviluppata mia sentenza.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>El par che voi veggiate, se ben odo,</p>\n\t\t<p>dinanzi quel che &rsquo;l tempo seco adduce,</p>\n\t\t<p>e nel presente tenete altro modo&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Noi veggiam, come quei c&rsquo;ha mala luce,</p>\n\t\t<p>le cose&raquo;, disse, &laquo;che ne son lontano;</p>\n\t\t<p>cotanto ancor ne splende il sommo duce.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quando s&rsquo;appressano o son, tutto &egrave; vano</p>\n\t\t<p>nostro intelletto; e s&rsquo;altri non ci apporta,</p>\n\t\t<p>nulla sapem di vostro stato umano.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per&ograve; comprender puoi che tutta morta</p>\n\t\t<p>fia nostra conoscenza da quel punto</p>\n\t\t<p>che del futuro fia chiusa la porta&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor, come di mia colpa compunto,</p>\n\t\t<p>dissi: &laquo;Or direte dunque a quel caduto</p>\n\t\t<p>che &rsquo;l suo nato &egrave; co&rsquo; vivi ancor congiunto;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e s&rsquo;i&rsquo; fui, dianzi, a la risposta muto,</p>\n\t\t<p>fate i saper che &rsquo;l fei perch&eacute; pensava</p>\n\t\t<p>gi&agrave; ne l&rsquo;error che m&rsquo;avete soluto&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E gi&agrave; &rsquo;l maestro mio mi richiamava;</p>\n\t\t<p>per ch&rsquo;i&rsquo; pregai lo spirto pi&ugrave; avaccio</p>\n\t\t<p>che mi dicesse chi con lu&rsquo; istava.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Dissemi: &laquo;Qui con pi&ugrave; di mille giaccio:</p>\n\t\t<p>qua dentro &egrave; &rsquo;l secondo Federico</p>\n\t\t<p>e &rsquo;l Cardinale; e de li altri mi taccio&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Indi s&rsquo;ascose; e io inver&rsquo; l&rsquo;antico</p>\n\t\t<p>poeta volsi i passi, ripensando</p>\n\t\t<p>a quel parlar che mi parea nemico.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Elli si mosse; e poi, cos&igrave; andando,</p>\n\t\t<p>mi disse: &laquo;Perch&eacute; se&rsquo; tu s&igrave; smarrito?&raquo;.</p>\n\t\t<p>E io li sodisfeci al suo dimando.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;La mente tua conservi quel ch&rsquo;udito</p>\n\t\t<p>hai contra te&raquo;, mi comand&ograve; quel saggio;</p>\n\t\t<p>&laquo;e ora attendi qui&raquo;, e drizz&ograve; &rsquo;l dito:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;quando sarai dinanzi al dolce raggio</p>\n\t\t<p>di quella il cui bell&rsquo; occhio tutto vede,</p>\n\t\t<p>da lei saprai di tua vita il v&iuml;aggio&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Appresso mosse a man sinistra il piede:</p>\n\t\t<p>lasciammo il muro e gimmo inver&rsquo; lo mezzo</p>\n\t\t<p>per un sentier ch&rsquo;a una valle fiede,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che &rsquo;nfin l&agrave; s&ugrave; facea spiacer suo lezzo.</p>\n\t\t</div>','<p class="cantohead">11</p>\n\t\t<div class="stanza">\n\t\t\t<p>In su l&rsquo;estremit&agrave; d&rsquo;un&rsquo;alta ripa</p>\n\t\t<p>che facevan gran pietre rotte in cerchio,</p>\n\t\t<p>venimmo sopra pi&ugrave; crudele stipa;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e quivi, per l&rsquo;orribile soperchio</p>\n\t\t<p>del puzzo che &rsquo;l profondo abisso gitta,</p>\n\t\t<p>ci raccostammo, in dietro, ad un coperchio</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>d&rsquo;un grand&rsquo; avello, ov&rsquo; io vidi una scritta</p>\n\t\t<p>che dicea: \u2018Anastasio papa guardo,</p>\n\t\t<p>lo qual trasse Fotin de la via dritta&rsquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Lo nostro scender conviene esser tardo,</p>\n\t\t<p>s&igrave; che s&rsquo;ausi un poco in prima il senso</p>\n\t\t<p>al tristo fiato; e poi no i fia riguardo&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; &rsquo;l maestro; e io &laquo;Alcun compenso&raquo;,</p>\n\t\t<p>dissi lui, &laquo;trova che &rsquo;l tempo non passi</p>\n\t\t<p>perduto&raquo;. Ed elli: &laquo;Vedi ch&rsquo;a ci&ograve; penso&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Figliuol mio, dentro da cotesti sassi&raquo;,</p>\n\t\t<p>cominci&ograve; poi a dir, &laquo;son tre cerchietti</p>\n\t\t<p>di grado in grado, come que&rsquo; che lassi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tutti son pien di spirti maladetti;</p>\n\t\t<p>ma perch&eacute; poi ti basti pur la vista,</p>\n\t\t<p>intendi come e perch&eacute; son costretti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>D&rsquo;ogne malizia, ch&rsquo;odio in cielo acquista,</p>\n\t\t<p>ingiuria &egrave; &rsquo;l fine, ed ogne fin cotale</p>\n\t\t<p>o con forza o con frode altrui contrista.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma perch&eacute; frode &egrave; de l&rsquo;uom proprio male,</p>\n\t\t<p>pi&ugrave; spiace a Dio; e per&ograve; stan di sotto</p>\n\t\t<p>li frodolenti, e pi&ugrave; dolor li assale.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Di v&iuml;olenti il primo cerchio &egrave; tutto;</p>\n\t\t<p>ma perch&eacute; si fa forza a tre persone,</p>\n\t\t<p>in tre gironi &egrave; distinto e costrutto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>A Dio, a s&eacute;, al prossimo si p&ograve;ne</p>\n\t\t<p>far forza, dico in loro e in lor cose,</p>\n\t\t<p>come udirai con aperta ragione.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Morte per forza e ferute dogliose</p>\n\t\t<p>nel prossimo si danno, e nel suo avere</p>\n\t\t<p>ruine, incendi e tollette dannose;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>onde omicide e ciascun che mal fiere,</p>\n\t\t<p>guastatori e predon, tutti tormenta</p>\n\t\t<p>lo giron primo per diverse schiere.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Puote omo avere in s&eacute; man v&iuml;olenta</p>\n\t\t<p>e ne&rsquo; suoi beni; e per&ograve; nel secondo</p>\n\t\t<p>giron convien che sanza pro si penta</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>qualunque priva s&eacute; del vostro mondo,</p>\n\t\t<p>biscazza e fonde la sua facultade,</p>\n\t\t<p>e piange l&agrave; dov&rsquo; esser de&rsquo; giocondo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Puossi far forza ne la de&iuml;tade,</p>\n\t\t<p>col cor negando e bestemmiando quella,</p>\n\t\t<p>e spregiando natura e sua bontade;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e per&ograve; lo minor giron suggella</p>\n\t\t<p>del segno suo e Soddoma e Caorsa</p>\n\t\t<p>e chi, spregiando Dio col cor, favella.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>La frode, ond&rsquo; ogne cosc&iuml;enza &egrave; morsa,</p>\n\t\t<p>pu&ograve; l&rsquo;omo usare in colui che &rsquo;n lui fida</p>\n\t\t<p>e in quel che fidanza non imborsa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Questo modo di retro par ch&rsquo;incida</p>\n\t\t<p>pur lo vinco d&rsquo;amor che fa natura;</p>\n\t\t<p>onde nel cerchio secondo s&rsquo;annida</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ipocresia, lusinghe e chi affattura,</p>\n\t\t<p>falsit&agrave;, ladroneccio e simonia,</p>\n\t\t<p>ruffian, baratti e simile lordura.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per l&rsquo;altro modo quell&rsquo; amor s&rsquo;oblia</p>\n\t\t<p>che fa natura, e quel ch&rsquo;&egrave; poi aggiunto,</p>\n\t\t<p>di che la fede spez&iuml;al si cria;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>onde nel cerchio minore, ov&rsquo; &egrave; &rsquo;l punto</p>\n\t\t<p>de l&rsquo;universo in su che Dite siede,</p>\n\t\t<p>qualunque trade in etterno &egrave; consunto&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io: &laquo;Maestro, assai chiara procede</p>\n\t\t<p>la tua ragione, e assai ben distingue</p>\n\t\t<p>questo bar&agrave;tro e &rsquo;l popol ch&rsquo;e&rsquo; possiede.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma dimmi: quei de la palude pingue,</p>\n\t\t<p>che mena il vento, e che batte la pioggia,</p>\n\t\t<p>e che s&rsquo;incontran con s&igrave; aspre lingue,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>perch&eacute; non dentro da la citt&agrave; roggia</p>\n\t\t<p>sono ei puniti, se Dio li ha in ira?</p>\n\t\t<p>e se non li ha, perch&eacute; sono a tal foggia?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me &laquo;Perch&eacute; tanto delira&raquo;,</p>\n\t\t<p>disse, &laquo;lo &rsquo;ngegno tuo da quel che s&ograve;le?</p>\n\t\t<p>o ver la mente dove altrove mira?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non ti rimembra di quelle parole</p>\n\t\t<p>con le quai la tua Etica pertratta</p>\n\t\t<p>le tre disposizion che &rsquo;l ciel non vole,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>incontenenza, malizia e la matta</p>\n\t\t<p>bestialitade? e come incontenenza</p>\n\t\t<p>men Dio offende e men biasimo accatta?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Se tu riguardi ben questa sentenza,</p>\n\t\t<p>e rechiti a la mente chi son quelli</p>\n\t\t<p>che s&ugrave; di fuor sostegnon penitenza,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>tu vedrai ben perch&eacute; da questi felli</p>\n\t\t<p>sien dipartiti, e perch&eacute; men crucciata</p>\n\t\t<p>la divina vendetta li martelli&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;O sol che sani ogne vista turbata,</p>\n\t\t<p>tu mi contenti s&igrave; quando tu solvi,</p>\n\t\t<p>che, non men che saver, dubbiar m&rsquo;aggrata.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ancora in dietro un poco ti rivolvi&raquo;,</p>\n\t\t<p>diss&rsquo; io, &laquo;l&agrave; dove di&rsquo; ch&rsquo;usura offende</p>\n\t\t<p>la divina bontade, e &rsquo;l groppo solvi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Filosofia&raquo;, mi disse, &laquo;a chi la &rsquo;ntende,</p>\n\t\t<p>nota, non pure in una sola parte,</p>\n\t\t<p>come natura lo suo corso prende</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>dal divino &rsquo;ntelletto e da sua arte;</p>\n\t\t<p>e se tu ben la tua Fisica note,</p>\n\t\t<p>tu troverai, non dopo molte carte,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che l&rsquo;arte vostra quella, quanto pote,</p>\n\t\t<p>segue, come &rsquo;l maestro fa &rsquo;l discente;</p>\n\t\t<p>s&igrave; che vostr&rsquo; arte a Dio quasi &egrave; nepote.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Da queste due, se tu ti rechi a mente</p>\n\t\t<p>lo Genes&igrave; dal principio, convene</p>\n\t\t<p>prender sua vita e avanzar la gente;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e perch&eacute; l&rsquo;usuriere altra via tene,</p>\n\t\t<p>per s&eacute; natura e per la sua seguace</p>\n\t\t<p>dispregia, poi ch&rsquo;in altro pon la spene.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma seguimi oramai che &rsquo;l gir mi piace;</p>\n\t\t<p>ch&eacute; i Pesci guizzan su per l&rsquo;orizzonta,</p>\n\t\t<p>e &rsquo;l Carro tutto sovra &rsquo;l Coro giace,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e &rsquo;l balzo via l&agrave; oltra si dismonta&raquo;.</p>\n\t\t</div>','<p class="cantohead">12</p>\n\t\t<div class="stanza">\n\t\t\t<p>Era lo loco ov&rsquo; a scender la riva</p>\n\t\t<p>venimmo, alpestro e, per quel che v&rsquo;er&rsquo; anco,</p>\n\t\t<p>tal, ch&rsquo;ogne vista ne sarebbe schiva.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Qual &egrave; quella ruina che nel fianco</p>\n\t\t<p>di qua da Trento l&rsquo;Adice percosse,</p>\n\t\t<p>o per tremoto o per sostegno manco,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che da cima del monte, onde si mosse,</p>\n\t\t<p>al piano &egrave; s&igrave; la roccia discoscesa,</p>\n\t\t<p>ch&rsquo;alcuna via darebbe a chi s&ugrave; fosse:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>cotal di quel burrato era la scesa;</p>\n\t\t<p>e &rsquo;n su la punta de la rotta lacca</p>\n\t\t<p>l&rsquo;infam&iuml;a di Creti era distesa</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che fu concetta ne la falsa vacca;</p>\n\t\t<p>e quando vide noi, s&eacute; stesso morse,</p>\n\t\t<p>s&igrave; come quei cui l&rsquo;ira dentro fiacca.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo savio mio inver&rsquo; lui grid&ograve;: &laquo;Forse</p>\n\t\t<p>tu credi che qui sia &rsquo;l duca d&rsquo;Atene,</p>\n\t\t<p>che s&ugrave; nel mondo la morte ti porse?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>P&agrave;rtiti, bestia, ch&eacute; questi non vene</p>\n\t\t<p>ammaestrato da la tua sorella,</p>\n\t\t<p>ma vassi per veder le vostre pene&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Qual &egrave; quel toro che si slaccia in quella</p>\n\t\t<p>c&rsquo;ha ricevuto gi&agrave; &rsquo;l colpo mortale,</p>\n\t\t<p>che gir non sa, ma qua e l&agrave; saltella,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>vid&rsquo; io lo Minotauro far cotale;</p>\n\t\t<p>e quello accorto grid&ograve;: &laquo;Corri al varco;</p>\n\t\t<p>mentre ch&rsquo;e&rsquo; &rsquo;nfuria, &egrave; buon che tu ti cale&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; prendemmo via gi&ugrave; per lo scarco</p>\n\t\t<p>di quelle pietre, che spesso moviensi</p>\n\t\t<p>sotto i miei piedi per lo novo carco.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io gia pensando; e quei disse: &laquo;Tu pensi</p>\n\t\t<p>forse a questa ruina, ch&rsquo;&egrave; guardata</p>\n\t\t<p>da quell&rsquo; ira bestial ch&rsquo;i&rsquo; ora spensi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Or vo&rsquo; che sappi che l&rsquo;altra f&iuml;ata</p>\n\t\t<p>ch&rsquo;i&rsquo; discesi qua gi&ugrave; nel basso inferno,</p>\n\t\t<p>questa roccia non era ancor cascata.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma certo poco pria, se ben discerno,</p>\n\t\t<p>che venisse colui che la gran preda</p>\n\t\t<p>lev&ograve; a Dite del cerchio superno,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>da tutte parti l&rsquo;alta valle feda</p>\n\t\t<p>trem&ograve; s&igrave;, ch&rsquo;i&rsquo; pensai che l&rsquo;universo</p>\n\t\t<p>sentisse amor, per lo qual &egrave; chi creda</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>pi&ugrave; volte il mondo in ca&ograve;sso converso;</p>\n\t\t<p>e in quel punto questa vecchia roccia,</p>\n\t\t<p>qui e altrove, tal fece riverso.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma ficca li occhi a valle, ch&eacute; s&rsquo;approccia</p>\n\t\t<p>la riviera del sangue in la qual bolle</p>\n\t\t<p>qual che per v&iuml;olenza in altrui noccia&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Oh cieca cupidigia e ira folle,</p>\n\t\t<p>che s&igrave; ci sproni ne la vita corta,</p>\n\t\t<p>e ne l&rsquo;etterna poi s&igrave; mal c&rsquo;immolle!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io vidi un&rsquo;ampia fossa in arco torta,</p>\n\t\t<p>come quella che tutto &rsquo;l piano abbraccia,</p>\n\t\t<p>secondo ch&rsquo;avea detto la mia scorta;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e tra &rsquo;l pi&egrave; de la ripa ed essa, in traccia</p>\n\t\t<p>corrien centauri, armati di saette,</p>\n\t\t<p>come solien nel mondo andare a caccia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Veggendoci calar, ciascun ristette,</p>\n\t\t<p>e de la schiera tre si dipartiro</p>\n\t\t<p>con archi e asticciuole prima elette;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e l&rsquo;un grid&ograve; da lungi: &laquo;A qual martiro</p>\n\t\t<p>venite voi che scendete la costa?</p>\n\t\t<p>Ditel costinci; se non, l&rsquo;arco tiro&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo mio maestro disse: &laquo;La risposta</p>\n\t\t<p>farem noi a Chir&oacute;n cost&agrave; di presso:</p>\n\t\t<p>mal fu la voglia tua sempre s&igrave; tosta&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi mi tent&ograve;, e disse: &laquo;Quelli &egrave; Nesso,</p>\n\t\t<p>che mor&igrave; per la bella Deianira,</p>\n\t\t<p>e f&eacute; di s&eacute; la vendetta elli stesso.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quel di mezzo, ch&rsquo;al petto si mira,</p>\n\t\t<p>&egrave; il gran Chir&oacute;n, il qual nodr&igrave; Achille;</p>\n\t\t<p>quell&rsquo; altro &egrave; Folo, che fu s&igrave; pien d&rsquo;ira.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Dintorno al fosso vanno a mille a mille,</p>\n\t\t<p>saettando qual anima si svelle</p>\n\t\t<p>del sangue pi&ugrave; che sua colpa sortille&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Noi ci appressammo a quelle fiere isnelle:</p>\n\t\t<p>Chir&oacute;n prese uno strale, e con la cocca</p>\n\t\t<p>fece la barba in dietro a le mascelle.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quando s&rsquo;ebbe scoperta la gran bocca,</p>\n\t\t<p>disse a&rsquo; compagni: &laquo;Siete voi accorti</p>\n\t\t<p>che quel di retro move ci&ograve; ch&rsquo;el tocca?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; non soglion far li pi&egrave; d&rsquo;i morti&raquo;.</p>\n\t\t<p>E &rsquo;l mio buon duca, che gi&agrave; li er&rsquo; al petto,</p>\n\t\t<p>dove le due nature son consorti,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>rispuose: &laquo;Ben &egrave; vivo, e s&igrave; soletto</p>\n\t\t<p>mostrar li mi convien la valle buia;</p>\n\t\t<p>necessit&agrave; &rsquo;l ci &rsquo;nduce, e non diletto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tal si part&igrave; da cantare alleluia</p>\n\t\t<p>che mi commise quest&rsquo; officio novo:</p>\n\t\t<p>non &egrave; ladron, n&eacute; io anima fuia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma per quella virt&ugrave; per cu&rsquo; io movo</p>\n\t\t<p>li passi miei per s&igrave; selvaggia strada,</p>\n\t\t<p>danne un de&rsquo; tuoi, a cui noi siamo a provo,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e che ne mostri l&agrave; dove si guada,</p>\n\t\t<p>e che porti costui in su la groppa,</p>\n\t\t<p>ch&eacute; non &egrave; spirto che per l&rsquo;aere vada&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Chir&oacute;n si volse in su la destra poppa,</p>\n\t\t<p>e disse a Nesso: &laquo;Torna, e s&igrave; li guida,</p>\n\t\t<p>e fa cansar s&rsquo;altra schiera v&rsquo;intoppa&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Or ci movemmo con la scorta fida</p>\n\t\t<p>lungo la proda del bollor vermiglio,</p>\n\t\t<p>dove i bolliti facieno alte strida.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io vidi gente sotto infino al ciglio;</p>\n\t\t<p>e &rsquo;l gran centauro disse: &laquo;E&rsquo; son tiranni</p>\n\t\t<p>che dier nel sangue e ne l&rsquo;aver di piglio.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quivi si piangon li spietati danni;</p>\n\t\t<p>quivi &egrave; Alessandro, e D&iuml;onisio fero</p>\n\t\t<p>che f&eacute; Cicilia aver dolorosi anni.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quella fronte c&rsquo;ha &rsquo;l pel cos&igrave; nero,</p>\n\t\t<p>&egrave; Azzolino; e quell&rsquo; altro ch&rsquo;&egrave; biondo,</p>\n\t\t<p>&egrave; Opizzo da Esti, il qual per vero</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>fu spento dal figliastro s&ugrave; nel mondo&raquo;.</p>\n\t\t<p>Allor mi volsi al poeta, e quei disse:</p>\n\t\t<p>&laquo;Questi ti sia or primo, e io secondo&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poco pi&ugrave; oltre il centauro s&rsquo;affisse</p>\n\t\t<p>sovr&rsquo; una gente che &rsquo;nfino a la gola</p>\n\t\t<p>parea che di quel bulicame uscisse.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Mostrocci un&rsquo;ombra da l&rsquo;un canto sola,</p>\n\t\t<p>dicendo: &laquo;Colui fesse in grembo a Dio</p>\n\t\t<p>lo cor che &rsquo;n su Tamisi ancor si cola&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi vidi gente che di fuor del rio</p>\n\t\t<p>tenean la testa e ancor tutto &rsquo;l casso;</p>\n\t\t<p>e di costoro assai riconobb&rsquo; io.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; a pi&ugrave; a pi&ugrave; si facea basso</p>\n\t\t<p>quel sangue, s&igrave; che cocea pur li piedi;</p>\n\t\t<p>e quindi fu del fosso il nostro passo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;S&igrave; come tu da questa parte vedi</p>\n\t\t<p>lo bulicame che sempre si scema&raquo;,</p>\n\t\t<p>disse &rsquo;l centauro, &laquo;voglio che tu credi</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che da quest&rsquo; altra a pi&ugrave; a pi&ugrave; gi&ugrave; prema</p>\n\t\t<p>lo fondo suo, infin ch&rsquo;el si raggiunge</p>\n\t\t<p>ove la tirannia convien che gema.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>La divina giustizia di qua punge</p>\n\t\t<p>quell&rsquo; Attila che fu flagello in terra,</p>\n\t\t<p>e Pirro e Sesto; e in etterno munge</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>le lagrime, che col bollor diserra,</p>\n\t\t<p>a Rinier da Corneto, a Rinier Pazzo,</p>\n\t\t<p>che fecero a le strade tanta guerra&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi si rivolse e ripassossi &rsquo;l guazzo.</p>\n\t\t</div>','<p class="cantohead">13</p>\n\t\t<div class="stanza">\n\t\t\t<p>Non era ancor di l&agrave; Nesso arrivato,</p>\n\t\t<p>quando noi ci mettemmo per un bosco</p>\n\t\t<p>che da neun sentiero era segnato.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non fronda verde, ma di color fosco;</p>\n\t\t<p>non rami schietti, ma nodosi e &rsquo;nvolti;</p>\n\t\t<p>non pomi v&rsquo;eran, ma stecchi con t&ograve;sco.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non han s&igrave; aspri sterpi n&eacute; s&igrave; folti</p>\n\t\t<p>quelle fiere selvagge che &rsquo;n odio hanno</p>\n\t\t<p>tra Cecina e Corneto i luoghi c&oacute;lti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quivi le brutte Arpie lor nidi fanno,</p>\n\t\t<p>che cacciar de le Strofade i Troiani</p>\n\t\t<p>con tristo annunzio di futuro danno.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ali hanno late, e colli e visi umani,</p>\n\t\t<p>pi&egrave; con artigli, e pennuto &rsquo;l gran ventre;</p>\n\t\t<p>fanno lamenti in su li alberi strani.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E &rsquo;l buon maestro &laquo;Prima che pi&ugrave; entre,</p>\n\t\t<p>sappi che se&rsquo; nel secondo girone&raquo;,</p>\n\t\t<p>mi cominci&ograve; a dire, &laquo;e sarai mentre</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che tu verrai ne l&rsquo;orribil sabbione.</p>\n\t\t<p>Per&ograve; riguarda ben; s&igrave; vederai</p>\n\t\t<p>cose che torrien fede al mio sermone&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io sentia d&rsquo;ogne parte trarre guai</p>\n\t\t<p>e non vedea persona che &rsquo;l facesse;</p>\n\t\t<p>per ch&rsquo;io tutto smarrito m&rsquo;arrestai.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cred&rsquo; &iuml;o ch&rsquo;ei credette ch&rsquo;io credesse</p>\n\t\t<p>che tante voci uscisser, tra quei bronchi,</p>\n\t\t<p>da gente che per noi si nascondesse.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per&ograve; disse &rsquo;l maestro: &laquo;Se tu tronchi</p>\n\t\t<p>qualche fraschetta d&rsquo;una d&rsquo;este piante,</p>\n\t\t<p>li pensier c&rsquo;hai si faran tutti monchi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor porsi la mano un poco avante</p>\n\t\t<p>e colsi un ramicel da un gran pruno;</p>\n\t\t<p>e &rsquo;l tronco suo grid&ograve;: &laquo;Perch&eacute; mi schiante?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Da che fatto fu poi di sangue bruno,</p>\n\t\t<p>ricominci&ograve; a dir: &laquo;Perch&eacute; mi scerpi?</p>\n\t\t<p>non hai tu spirto di pietade alcuno?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Uomini fummo, e or siam fatti sterpi:</p>\n\t\t<p>ben dovrebb&rsquo; esser la tua man pi&ugrave; pia,</p>\n\t\t<p>se state fossimo anime di serpi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Come d&rsquo;un stizzo verde ch&rsquo;arso sia</p>\n\t\t<p>da l&rsquo;un de&rsquo; capi, che da l&rsquo;altro geme</p>\n\t\t<p>e cigola per vento che va via,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>s&igrave; de la scheggia rotta usciva insieme</p>\n\t\t<p>parole e sangue; ond&rsquo; io lasciai la cima</p>\n\t\t<p>cadere, e stetti come l&rsquo;uom che teme.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;S&rsquo;elli avesse potuto creder prima&raquo;,</p>\n\t\t<p>rispuose &rsquo;l savio mio, &laquo;anima lesa,</p>\n\t\t<p>ci&ograve; c&rsquo;ha veduto pur con la mia rima,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>non averebbe in te la man distesa;</p>\n\t\t<p>ma la cosa incredibile mi fece</p>\n\t\t<p>indurlo ad ovra ch&rsquo;a me stesso pesa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma dilli chi tu fosti, s&igrave; che &rsquo;n vece</p>\n\t\t<p>d&rsquo;alcun&rsquo; ammenda tua fama rinfreschi</p>\n\t\t<p>nel mondo s&ugrave;, dove tornar li lece&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E &rsquo;l tronco: &laquo;S&igrave; col dolce dir m&rsquo;adeschi,</p>\n\t\t<p>ch&rsquo;i&rsquo; non posso tacere; e voi non gravi</p>\n\t\t<p>perch&rsquo; &iuml;o un poco a ragionar m&rsquo;inveschi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io son colui che tenni ambo le chiavi</p>\n\t\t<p>del cor di Federigo, e che le volsi,</p>\n\t\t<p>serrando e diserrando, s&igrave; soavi,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che dal secreto suo quasi ogn&rsquo; uom tolsi;</p>\n\t\t<p>fede portai al glor&iuml;oso offizio,</p>\n\t\t<p>tanto ch&rsquo;i&rsquo; ne perde&rsquo; li sonni e &rsquo; polsi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>La meretrice che mai da l&rsquo;ospizio</p>\n\t\t<p>di Cesare non torse li occhi putti,</p>\n\t\t<p>morte comune e de le corti vizio,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>infiamm&ograve; contra me li animi tutti;</p>\n\t\t<p>e li &rsquo;nfiammati infiammar s&igrave; Augusto,</p>\n\t\t<p>che &rsquo; lieti onor tornaro in tristi lutti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>L&rsquo;animo mio, per disdegnoso gusto,</p>\n\t\t<p>credendo col morir fuggir disdegno,</p>\n\t\t<p>ingiusto fece me contra me giusto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per le nove radici d&rsquo;esto legno</p>\n\t\t<p>vi giuro che gi&agrave; mai non ruppi fede</p>\n\t\t<p>al mio segnor, che fu d&rsquo;onor s&igrave; degno.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E se di voi alcun nel mondo riede,</p>\n\t\t<p>conforti la memoria mia, che giace</p>\n\t\t<p>ancor del colpo che &rsquo;nvidia le diede&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Un poco attese, e poi &laquo;Da ch&rsquo;el si tace&raquo;,</p>\n\t\t<p>disse &rsquo;l poeta a me, &laquo;non perder l&rsquo;ora;</p>\n\t\t<p>ma parla, e chiedi a lui, se pi&ugrave; ti piace&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ond&rsquo; &iuml;o a lui: &laquo;Domandal tu ancora</p>\n\t\t<p>di quel che credi ch&rsquo;a me satisfaccia;</p>\n\t\t<p>ch&rsquo;i&rsquo; non potrei, tanta piet&agrave; m&rsquo;accora&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Perci&ograve; ricominci&ograve;: &laquo;Se l&rsquo;om ti faccia</p>\n\t\t<p>liberamente ci&ograve; che &rsquo;l tuo dir priega,</p>\n\t\t<p>spirito incarcerato, ancor ti piaccia</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>di dirne come l&rsquo;anima si lega</p>\n\t\t<p>in questi nocchi; e dinne, se tu puoi,</p>\n\t\t<p>s&rsquo;alcuna mai di tai membra si spiega&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor soffi&ograve; il tronco forte, e poi</p>\n\t\t<p>si convert&igrave; quel vento in cotal voce:</p>\n\t\t<p>&laquo;Brievemente sar&agrave; risposto a voi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quando si parte l&rsquo;anima feroce</p>\n\t\t<p>dal corpo ond&rsquo; ella stessa s&rsquo;&egrave; disvelta,</p>\n\t\t<p>Min&ograve;s la manda a la settima foce.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cade in la selva, e non l&rsquo;&egrave; parte scelta;</p>\n\t\t<p>ma l&agrave; dove fortuna la balestra,</p>\n\t\t<p>quivi germoglia come gran di spelta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Surge in vermena e in pianta silvestra:</p>\n\t\t<p>l&rsquo;Arpie, pascendo poi de le sue foglie,</p>\n\t\t<p>fanno dolore, e al dolor fenestra.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Come l&rsquo;altre verrem per nostre spoglie,</p>\n\t\t<p>ma non per&ograve; ch&rsquo;alcuna sen rivesta,</p>\n\t\t<p>ch&eacute; non &egrave; giusto aver ci&ograve; ch&rsquo;om si toglie.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Qui le strascineremo, e per la mesta</p>\n\t\t<p>selva saranno i nostri corpi appesi,</p>\n\t\t<p>ciascuno al prun de l&rsquo;ombra sua molesta&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Noi eravamo ancora al tronco attesi,</p>\n\t\t<p>credendo ch&rsquo;altro ne volesse dire,</p>\n\t\t<p>quando noi fummo d&rsquo;un romor sorpresi,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>similemente a colui che venire</p>\n\t\t<p>sente &rsquo;l porco e la caccia a la sua posta,</p>\n\t\t<p>ch&rsquo;ode le bestie, e le frasche stormire.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed ecco due da la sinistra costa,</p>\n\t\t<p>nudi e graffiati, fuggendo s&igrave; forte,</p>\n\t\t<p>che de la selva rompieno ogne rosta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quel dinanzi: &laquo;Or accorri, accorri, morte!&raquo;.</p>\n\t\t<p>E l&rsquo;altro, cui pareva tardar troppo,</p>\n\t\t<p>gridava: &laquo;Lano, s&igrave; non furo accorte</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>le gambe tue a le giostre dal Toppo!&raquo;.</p>\n\t\t<p>E poi che forse li fallia la lena,</p>\n\t\t<p>di s&eacute; e d&rsquo;un cespuglio fece un groppo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Di rietro a loro era la selva piena</p>\n\t\t<p>di nere cagne, bramose e correnti</p>\n\t\t<p>come veltri ch&rsquo;uscisser di catena.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>In quel che s&rsquo;appiatt&ograve; miser li denti,</p>\n\t\t<p>e quel dilaceraro a brano a brano;</p>\n\t\t<p>poi sen portar quelle membra dolenti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Presemi allor la mia scorta per mano,</p>\n\t\t<p>e menommi al cespuglio che piangea</p>\n\t\t<p>per le rotture sanguinenti in vano.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;O Iacopo&raquo;, dicea, &laquo;da Santo Andrea,</p>\n\t\t<p>che t&rsquo;&egrave; giovato di me fare schermo?</p>\n\t\t<p>che colpa ho io de la tua vita rea?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quando &rsquo;l maestro fu sovr&rsquo; esso fermo,</p>\n\t\t<p>disse: &laquo;Chi fosti, che per tante punte</p>\n\t\t<p>soffi con sangue doloroso sermo?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a noi: &laquo;O anime che giunte</p>\n\t\t<p>siete a veder lo strazio disonesto</p>\n\t\t<p>c&rsquo;ha le mie fronde s&igrave; da me disgiunte,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>raccoglietele al pi&egrave; del tristo cesto.</p>\n\t\t<p>I&rsquo; fui de la citt&agrave; che nel Batista</p>\n\t\t<p>mut&ograve; &rsquo;l primo padrone; ond&rsquo; ei per questo</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>sempre con l&rsquo;arte sua la far&agrave; trista;</p>\n\t\t<p>e se non fosse che &rsquo;n sul passo d&rsquo;Arno</p>\n\t\t<p>rimane ancor di lui alcuna vista,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>que&rsquo; cittadin che poi la rifondarno</p>\n\t\t<p>sovra &rsquo;l cener che d&rsquo;Attila rimase,</p>\n\t\t<p>avrebber fatto lavorare indarno.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io fei gibetto a me de le mie case&raquo;.</p>\n\t\t</div>','<p class="cantohead">14</p>\n\t\t<div class="stanza">\n\t\t\t<p>Poi che la carit&agrave; del natio loco</p>\n\t\t<p>mi strinse, raunai le fronde sparte</p>\n\t\t<p>e rende&rsquo;le a colui, ch&rsquo;era gi&agrave; fioco.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Indi venimmo al fine ove si parte</p>\n\t\t<p>lo secondo giron dal terzo, e dove</p>\n\t\t<p>si vede di giustizia orribil arte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>A ben manifestar le cose nove,</p>\n\t\t<p>dico che arrivammo ad una landa</p>\n\t\t<p>che dal suo letto ogne pianta rimove.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>La dolorosa selva l&rsquo;&egrave; ghirlanda</p>\n\t\t<p>intorno, come &rsquo;l fosso tristo ad essa;</p>\n\t\t<p>quivi fermammo i passi a randa a randa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo spazzo era una rena arida e spessa,</p>\n\t\t<p>non d&rsquo;altra foggia fatta che colei</p>\n\t\t<p>che fu da&rsquo; pi&egrave; di Caton gi&agrave; soppressa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>O vendetta di Dio, quanto tu dei</p>\n\t\t<p>esser temuta da ciascun che legge</p>\n\t\t<p>ci&ograve; che fu manifesto a li occhi mei!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>D&rsquo;anime nude vidi molte gregge</p>\n\t\t<p>che piangean tutte assai miseramente,</p>\n\t\t<p>e parea posta lor diversa legge.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Supin giacea in terra alcuna gente,</p>\n\t\t<p>alcuna si sedea tutta raccolta,</p>\n\t\t<p>e altra andava contin&uuml;amente.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quella che giva &rsquo;ntorno era pi&ugrave; molta,</p>\n\t\t<p>e quella men che giac\xEBa al tormento,</p>\n\t\t<p>ma pi&ugrave; al duolo avea la lingua sciolta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Sovra tutto &rsquo;l sabbion, d&rsquo;un cader lento,</p>\n\t\t<p>piovean di foco dilatate falde,</p>\n\t\t<p>come di neve in alpe sanza vento.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quali Alessandro in quelle parti calde</p>\n\t\t<p>d&rsquo;Ind&iuml;a vide sopra &rsquo;l s&uuml;o stuolo</p>\n\t\t<p>fiamme cadere infino a terra salde,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>per ch&rsquo;ei provide a scalpitar lo suolo</p>\n\t\t<p>con le sue schiere, acci&ograve; che lo vapore</p>\n\t\t<p>mei si stingueva mentre ch&rsquo;era solo:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>tale scendeva l&rsquo;etternale ardore;</p>\n\t\t<p>onde la rena s&rsquo;accendea, com&rsquo; esca</p>\n\t\t<p>sotto focile, a doppiar lo dolore.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Sanza riposo mai era la tresca</p>\n\t\t<p>de le misere mani, or quindi or quinci</p>\n\t\t<p>escotendo da s&eacute; l&rsquo;arsura fresca.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>I&rsquo; cominciai: &laquo;Maestro, tu che vinci</p>\n\t\t<p>tutte le cose, fuor che &rsquo; demon duri</p>\n\t\t<p>ch&rsquo;a l&rsquo;intrar de la porta incontra uscinci,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>chi &egrave; quel grande che non par che curi</p>\n\t\t<p>lo &rsquo;ncendio e giace dispettoso e torto,</p>\n\t\t<p>s&igrave; che la pioggia non par che &rsquo;l marturi?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quel medesmo, che si fu accorto</p>\n\t\t<p>ch&rsquo;io domandava il mio duca di lui,</p>\n\t\t<p>grid&ograve;: &laquo;Qual io fui vivo, tal son morto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Se Giove stanchi &rsquo;l suo fabbro da cui</p>\n\t\t<p>crucciato prese la folgore aguta</p>\n\t\t<p>onde l&rsquo;ultimo d&igrave; percosso fui;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>o s&rsquo;elli stanchi li altri a muta a muta</p>\n\t\t<p>in Mongibello a la focina negra,</p>\n\t\t<p>chiamando \u201CBuon Vulcano, aiuta, aiuta!\u201D,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>s&igrave; com&rsquo; el fece a la pugna di Flegra,</p>\n\t\t<p>e me saetti con tutta sua forza:</p>\n\t\t<p>non ne potrebbe aver vendetta allegra&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allora il duca mio parl&ograve; di forza</p>\n\t\t<p>tanto, ch&rsquo;i&rsquo; non l&rsquo;avea s&igrave; forte udito:</p>\n\t\t<p>&laquo;O Capaneo, in ci&ograve; che non s&rsquo;ammorza</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>la tua superbia, se&rsquo; tu pi&ugrave; punito;</p>\n\t\t<p>nullo martiro, fuor che la tua rabbia,</p>\n\t\t<p>sarebbe al tuo furor dolor compito&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi si rivolse a me con miglior labbia,</p>\n\t\t<p>dicendo: &laquo;Quei fu l&rsquo;un d&rsquo;i sette regi</p>\n\t\t<p>ch&rsquo;assiser Tebe; ed ebbe e par ch&rsquo;elli abbia</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Dio in disdegno, e poco par che &rsquo;l pregi;</p>\n\t\t<p>ma, com&rsquo; io dissi lui, li suoi dispetti</p>\n\t\t<p>sono al suo petto assai debiti fregi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Or mi vien dietro, e guarda che non metti,</p>\n\t\t<p>ancor, li piedi ne la rena arsiccia;</p>\n\t\t<p>ma sempre al bosco tien li piedi stretti&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tacendo divenimmo l&agrave; &rsquo;ve spiccia</p>\n\t\t<p>fuor de la selva un picciol fiumicello,</p>\n\t\t<p>lo cui rossore ancor mi raccapriccia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quale del Bulicame esce ruscello</p>\n\t\t<p>che parton poi tra lor le peccatrici,</p>\n\t\t<p>tal per la rena gi&ugrave; sen giva quello.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo fondo suo e ambo le pendici</p>\n\t\t<p>fatt&rsquo; era &rsquo;n pietra, e &rsquo; margini dallato;</p>\n\t\t<p>per ch&rsquo;io m&rsquo;accorsi che &rsquo;l passo era lici.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Tra tutto l&rsquo;altro ch&rsquo;i&rsquo; t&rsquo;ho dimostrato,</p>\n\t\t<p>poscia che noi intrammo per la porta</p>\n\t\t<p>lo cui sogliare a nessuno &egrave; negato,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>cosa non fu da li tuoi occhi scorta</p>\n\t\t<p>notabile com&rsquo; &egrave; &rsquo;l presente rio,</p>\n\t\t<p>che sovra s&eacute; tutte fiammelle ammorta&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Queste parole fuor del duca mio;</p>\n\t\t<p>per ch&rsquo;io &rsquo;l pregai che mi largisse &rsquo;l pasto</p>\n\t\t<p>di cui largito m&rsquo;av\xEBa il disio.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;In mezzo mar siede un paese guasto&raquo;,</p>\n\t\t<p>diss&rsquo; elli allora, &laquo;che s&rsquo;appella Creta,</p>\n\t\t<p>sotto &rsquo;l cui rege fu gi&agrave; &rsquo;l mondo casto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Una montagna v&rsquo;&egrave; che gi&agrave; fu lieta</p>\n\t\t<p>d&rsquo;acqua e di fronde, che si chiam&ograve; Ida;</p>\n\t\t<p>or &egrave; diserta come cosa vieta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>R\xEBa la scelse gi&agrave; per cuna fida</p>\n\t\t<p>del suo figliuolo, e per celarlo meglio,</p>\n\t\t<p>quando piangea, vi facea far le grida.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Dentro dal monte sta dritto un gran veglio,</p>\n\t\t<p>che tien volte le spalle inver&rsquo; Dammiata</p>\n\t\t<p>e Roma guarda come s&uuml;o speglio.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>La sua testa &egrave; di fin oro formata,</p>\n\t\t<p>e puro argento son le braccia e &rsquo;l petto,</p>\n\t\t<p>poi &egrave; di rame infino a la forcata;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>da indi in giuso &egrave; tutto ferro eletto,</p>\n\t\t<p>salvo che &rsquo;l destro piede &egrave; terra cotta;</p>\n\t\t<p>e sta &rsquo;n su quel, pi&ugrave; che &rsquo;n su l&rsquo;altro, eretto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ciascuna parte, fuor che l&rsquo;oro, &egrave; rotta</p>\n\t\t<p>d&rsquo;una fessura che lagrime goccia,</p>\n\t\t<p>le quali, accolte, f&oacute;ran quella grotta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lor corso in questa valle si diroccia;</p>\n\t\t<p>fanno Acheronte, Stige e Flegetonta;</p>\n\t\t<p>poi sen van gi&ugrave; per questa stretta doccia,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>infin, l&agrave; ove pi&ugrave; non si dismonta,</p>\n\t\t<p>fanno Cocito; e qual sia quello stagno</p>\n\t\t<p>tu lo vedrai, per&ograve; qui non si conta&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io a lui: &laquo;Se &rsquo;l presente rigagno</p>\n\t\t<p>si diriva cos&igrave; dal nostro mondo,</p>\n\t\t<p>perch&eacute; ci appar pur a questo vivagno?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;Tu sai che &rsquo;l loco &egrave; tondo;</p>\n\t\t<p>e tutto che tu sie venuto molto,</p>\n\t\t<p>pur a sinistra, gi&ugrave; calando al fondo,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>non se&rsquo; ancor per tutto &rsquo;l cerchio v&ograve;lto;</p>\n\t\t<p>per che, se cosa n&rsquo;apparisce nova,</p>\n\t\t<p>non de&rsquo; addur maraviglia al tuo volto&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io ancor: &laquo;Maestro, ove si trova</p>\n\t\t<p>Flegetonta e Let&egrave;? ch&eacute; de l&rsquo;un taci,</p>\n\t\t<p>e l&rsquo;altro di&rsquo; che si fa d&rsquo;esta piova&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;In tutte tue question certo mi piaci&raquo;,</p>\n\t\t<p>rispuose, &laquo;ma &rsquo;l bollor de l&rsquo;acqua rossa</p>\n\t\t<p>dovea ben solver l&rsquo;una che tu faci.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Let&egrave; vedrai, ma fuor di questa fossa,</p>\n\t\t<p>l&agrave; dove vanno l&rsquo;anime a lavarsi</p>\n\t\t<p>quando la colpa pentuta &egrave; rimossa&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi disse: &laquo;Omai &egrave; tempo da scostarsi</p>\n\t\t<p>dal bosco; fa che di retro a me vegne:</p>\n\t\t<p>li margini fan via, che non son arsi,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e sopra loro ogne vapor si spegne&raquo;.</p>\n\t\t</div>','<p class="cantohead">15</p>\n\t\t<div class="stanza">\n\t\t\t<p>Ora cen porta l&rsquo;un de&rsquo; duri margini;</p>\n\t\t<p>e &rsquo;l fummo del ruscel di sopra aduggia,</p>\n\t\t<p>s&igrave; che dal foco salva l&rsquo;acqua e li argini.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quali Fiamminghi tra Guizzante e Bruggia,</p>\n\t\t<p>temendo &rsquo;l fiotto che &rsquo;nver&rsquo; lor s&rsquo;avventa,</p>\n\t\t<p>fanno lo schermo perch&eacute; &rsquo;l mar si fuggia;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e quali Padoan lungo la Brenta,</p>\n\t\t<p>per difender lor ville e lor castelli,</p>\n\t\t<p>anzi che Carentana il caldo senta:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>a tale imagine eran fatti quelli,</p>\n\t\t<p>tutto che n&eacute; s&igrave; alti n&eacute; s&igrave; grossi,</p>\n\t\t<p>qual che si fosse, lo maestro f&eacute;lli.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Gi&agrave; eravam da la selva rimossi</p>\n\t\t<p>tanto, ch&rsquo;i&rsquo; non avrei visto dov&rsquo; era,</p>\n\t\t<p>perch&rsquo; io in dietro rivolto mi fossi,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>quando incontrammo d&rsquo;anime una schiera</p>\n\t\t<p>che venian lungo l&rsquo;argine, e ciascuna</p>\n\t\t<p>ci riguardava come suol da sera</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>guardare uno altro sotto nuova luna;</p>\n\t\t<p>e s&igrave; ver&rsquo; noi aguzzavan le ciglia</p>\n\t\t<p>come &rsquo;l vecchio sartor fa ne la cruna.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; adocchiato da cotal famiglia,</p>\n\t\t<p>fui conosciuto da un, che mi prese</p>\n\t\t<p>per lo lembo e grid&ograve;: &laquo;Qual maraviglia!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io, quando &rsquo;l suo braccio a me distese,</p>\n\t\t<p>ficca&iuml; li occhi per lo cotto aspetto,</p>\n\t\t<p>s&igrave; che &rsquo;l viso abbrusciato non difese</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>la conoscenza s&uuml;a al mio &rsquo;ntelletto;</p>\n\t\t<p>e chinando la mano a la sua faccia,</p>\n\t\t<p>rispuosi: &laquo;Siete voi qui, ser Brunetto?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quelli: &laquo;O figliuol mio, non ti dispiaccia</p>\n\t\t<p>se Brunetto Latino un poco teco</p>\n\t\t<p>ritorna &rsquo;n dietro e lascia andar la traccia&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>I&rsquo; dissi lui: &laquo;Quanto posso, ven preco;</p>\n\t\t<p>e se volete che con voi m&rsquo;asseggia,</p>\n\t\t<p>far&ograve;l, se piace a costui che vo seco&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;O figliuol&raquo;, disse, &laquo;qual di questa greggia</p>\n\t\t<p>s&rsquo;arresta punto, giace poi cent&rsquo; anni</p>\n\t\t<p>sanz&rsquo; arrostarsi quando &rsquo;l foco il feggia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per&ograve; va oltre: i&rsquo; ti verr&ograve; a&rsquo; panni;</p>\n\t\t<p>e poi rigiugner&ograve; la mia masnada,</p>\n\t\t<p>che va piangendo i suoi etterni danni&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io non osava scender de la strada</p>\n\t\t<p>per andar par di lui; ma &rsquo;l capo chino</p>\n\t\t<p>tenea com&rsquo; uom che reverente vada.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>El cominci&ograve;: &laquo;Qual fortuna o destino</p>\n\t\t<p>anzi l&rsquo;ultimo d&igrave; qua gi&ugrave; ti mena?</p>\n\t\t<p>e chi &egrave; questi che mostra &rsquo;l cammino?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;L&agrave; s&ugrave; di sopra, in la vita serena&raquo;,</p>\n\t\t<p>rispuos&rsquo; io lui, &laquo;mi smarri&rsquo; in una valle,</p>\n\t\t<p>avanti che l&rsquo;et&agrave; mia fosse piena.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Pur ier mattina le volsi le spalle:</p>\n\t\t<p>questi m&rsquo;apparve, tornand&rsquo; &iuml;o in quella,</p>\n\t\t<p>e reducemi a ca per questo calle&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;Se tu segui tua stella,</p>\n\t\t<p>non puoi fallire a glor&iuml;oso porto,</p>\n\t\t<p>se ben m&rsquo;accorsi ne la vita bella;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e s&rsquo;io non fossi s&igrave; per tempo morto,</p>\n\t\t<p>veggendo il cielo a te cos&igrave; benigno,</p>\n\t\t<p>dato t&rsquo;avrei a l&rsquo;opera conforto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma quello ingrato popolo maligno</p>\n\t\t<p>che discese di Fiesole ab antico,</p>\n\t\t<p>e tiene ancor del monte e del macigno,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ti si far&agrave;, per tuo ben far, nimico;</p>\n\t\t<p>ed &egrave; ragion, ch&eacute; tra li lazzi sorbi</p>\n\t\t<p>si disconvien fruttare al dolce fico.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Vecchia fama nel mondo li chiama orbi;</p>\n\t\t<p>gent&rsquo; &egrave; avara, invidiosa e superba:</p>\n\t\t<p>dai lor costumi fa che tu ti forbi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>La tua fortuna tanto onor ti serba,</p>\n\t\t<p>che l&rsquo;una parte e l&rsquo;altra avranno fame</p>\n\t\t<p>di te; ma lungi fia dal becco l&rsquo;erba.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Faccian le bestie fiesolane strame</p>\n\t\t<p>di lor medesme, e non tocchin la pianta,</p>\n\t\t<p>s&rsquo;alcuna surge ancora in lor letame,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>in cui riviva la sementa santa</p>\n\t\t<p>di que&rsquo; Roman che vi rimaser quando</p>\n\t\t<p>fu fatto il nido di malizia tanta&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Se fosse tutto pieno il mio dimando&raquo;,</p>\n\t\t<p>rispuos&rsquo; io lui, &laquo;voi non sareste ancora</p>\n\t\t<p>de l&rsquo;umana natura posto in bando;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&eacute; &rsquo;n la mente m&rsquo;&egrave; fitta, e or m&rsquo;accora,</p>\n\t\t<p>la cara e buona imagine paterna</p>\n\t\t<p>di voi quando nel mondo ad ora ad ora</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>m&rsquo;insegnavate come l&rsquo;uom s&rsquo;etterna:</p>\n\t\t<p>e quant&rsquo; io l&rsquo;abbia in grado, mentr&rsquo; io vivo</p>\n\t\t<p>convien che ne la mia lingua si scerna.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ci&ograve; che narrate di mio corso scrivo,</p>\n\t\t<p>e serbolo a chiosar con altro testo</p>\n\t\t<p>a donna che sapr&agrave;, s&rsquo;a lei arrivo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tanto vogl&rsquo; io che vi sia manifesto,</p>\n\t\t<p>pur che mia cosc&iuml;enza non mi garra,</p>\n\t\t<p>ch&rsquo;a la Fortuna, come vuol, son presto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non &egrave; nuova a li orecchi miei tal arra:</p>\n\t\t<p>per&ograve; giri Fortuna la sua rota</p>\n\t\t<p>come le piace, e &rsquo;l villan la sua marra&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo mio maestro allora in su la gota</p>\n\t\t<p>destra si volse in dietro e riguardommi;</p>\n\t\t<p>poi disse: &laquo;Bene ascolta chi la nota&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>N&eacute; per tanto di men parlando vommi</p>\n\t\t<p>con ser Brunetto, e dimando chi sono</p>\n\t\t<p>li suoi compagni pi&ugrave; noti e pi&ugrave; sommi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;Saper d&rsquo;alcuno &egrave; buono;</p>\n\t\t<p>de li altri fia laudabile tacerci,</p>\n\t\t<p>ch&eacute; &rsquo;l tempo saria corto a tanto suono.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>In somma sappi che tutti fur cherci</p>\n\t\t<p>e litterati grandi e di gran fama,</p>\n\t\t<p>d&rsquo;un peccato medesmo al mondo lerci.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Priscian sen va con quella turba grama,</p>\n\t\t<p>e Francesco d&rsquo;Accorso anche; e vedervi,</p>\n\t\t<p>s&rsquo;avessi avuto di tal tigna brama,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>colui potei che dal servo de&rsquo; servi</p>\n\t\t<p>fu trasmutato d&rsquo;Arno in Bacchiglione,</p>\n\t\t<p>dove lasci&ograve; li mal protesi nervi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Di pi&ugrave; direi; ma &rsquo;l venire e &rsquo;l sermone</p>\n\t\t<p>pi&ugrave; lungo esser non pu&ograve;, per&ograve; ch&rsquo;i&rsquo; veggio</p>\n\t\t<p>l&agrave; surger nuovo fummo del sabbione.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Gente vien con la quale esser non deggio.</p>\n\t\t<p>Sieti raccomandato il mio Tesoro,</p>\n\t\t<p>nel qual io vivo ancora, e pi&ugrave; non cheggio&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi si rivolse, e parve di coloro</p>\n\t\t<p>che corrono a Verona il drappo verde</p>\n\t\t<p>per la campagna; e parve di costoro</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>quelli che vince, non colui che perde.</p>\n\t\t</div>','<p class="cantohead">16</p>\n\t\t<div class="stanza">\n\t\t\t<p>Gi&agrave; era in loco onde s&rsquo;udia &rsquo;l rimbombo</p>\n\t\t<p>de l&rsquo;acqua che cadea ne l&rsquo;altro giro,</p>\n\t\t<p>simile a quel che l&rsquo;arnie fanno rombo,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>quando tre ombre insieme si partiro,</p>\n\t\t<p>correndo, d&rsquo;una torma che passava</p>\n\t\t<p>sotto la pioggia de l&rsquo;aspro martiro.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Venian ver&rsquo; noi, e ciascuna gridava:</p>\n\t\t<p>&laquo;S&ograve;stati tu ch&rsquo;a l&rsquo;abito ne sembri</p>\n\t\t<p>esser alcun di nostra terra prava&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ahim&egrave;, che piaghe vidi ne&rsquo; lor membri,</p>\n\t\t<p>ricenti e vecchie, da le fiamme incese!</p>\n\t\t<p>Ancor men duol pur ch&rsquo;i&rsquo; me ne rimembri.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>A le lor grida il mio dottor s&rsquo;attese;</p>\n\t\t<p>volse &rsquo;l viso ver&rsquo; me, e &laquo;Or aspetta&raquo;,</p>\n\t\t<p>disse, &laquo;a costor si vuole esser cortese.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E se non fosse il foco che saetta</p>\n\t\t<p>la natura del loco, i&rsquo; dicerei</p>\n\t\t<p>che meglio stesse a te che a lor la fretta&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ricominciar, come noi restammo, ei</p>\n\t\t<p>l&rsquo;antico verso; e quando a noi fuor giunti,</p>\n\t\t<p>fenno una rota di s&eacute; tutti e trei.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Qual sogliono i campion far nudi e unti,</p>\n\t\t<p>avvisando lor presa e lor vantaggio,</p>\n\t\t<p>prima che sien tra lor battuti e punti,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>cos&igrave; rotando, ciascuno il visaggio</p>\n\t\t<p>drizzava a me, s&igrave; che &rsquo;n contraro il collo</p>\n\t\t<p>faceva ai pi&egrave; contin&uuml;o v&iuml;aggio.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E &laquo;Se miseria d&rsquo;esto loco sollo</p>\n\t\t<p>rende in dispetto noi e nostri prieghi&raquo;,</p>\n\t\t<p>cominci&ograve; l&rsquo;uno, &laquo;e &rsquo;l tinto aspetto e brollo,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>la fama nostra il tuo animo pieghi</p>\n\t\t<p>a dirne chi tu se&rsquo;, che i vivi piedi</p>\n\t\t<p>cos&igrave; sicuro per lo &rsquo;nferno freghi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Questi, l&rsquo;orme di cui pestar mi vedi,</p>\n\t\t<p>tutto che nudo e dipelato vada,</p>\n\t\t<p>fu di grado maggior che tu non credi:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>nepote fu de la buona Gualdrada;</p>\n\t\t<p>Guido Guerra ebbe nome, e in sua vita</p>\n\t\t<p>fece col senno assai e con la spada.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>L&rsquo;altro, ch&rsquo;appresso me la rena trita,</p>\n\t\t<p>&egrave; Tegghiaio Aldobrandi, la cui voce</p>\n\t\t<p>nel mondo s&ugrave; dovria esser gradita.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io, che posto son con loro in croce,</p>\n\t\t<p>Iacopo Rusticucci fui, e certo</p>\n\t\t<p>la fiera moglie pi&ugrave; ch&rsquo;altro mi nuoce&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>S&rsquo;i&rsquo; fossi stato dal foco coperto,</p>\n\t\t<p>gittato mi sarei tra lor di sotto,</p>\n\t\t<p>e credo che &rsquo;l dottor l&rsquo;avria sofferto;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ma perch&rsquo; io mi sarei brusciato e cotto,</p>\n\t\t<p>vinse paura la mia buona voglia</p>\n\t\t<p>che di loro abbracciar mi facea ghiotto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi cominciai: &laquo;Non dispetto, ma doglia</p>\n\t\t<p>la vostra condizion dentro mi fisse,</p>\n\t\t<p>tanta che tardi tutta si dispoglia,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>tosto che questo mio segnor mi disse</p>\n\t\t<p>parole per le quali i&rsquo; mi pensai</p>\n\t\t<p>che qual voi siete, tal gente venisse.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Di vostra terra sono, e sempre mai</p>\n\t\t<p>l&rsquo;ovra di voi e li onorati nomi</p>\n\t\t<p>con affezion ritrassi e ascoltai.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lascio lo fele e vo per dolci pomi</p>\n\t\t<p>promessi a me per lo verace duca;</p>\n\t\t<p>ma &rsquo;nfino al centro pria convien ch&rsquo;i&rsquo; tomi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Se lungamente l&rsquo;anima conduca</p>\n\t\t<p>le membra tue&raquo;, rispuose quelli ancora,</p>\n\t\t<p>&laquo;e se la fama tua dopo te luca,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>cortesia e valor d&igrave; se dimora</p>\n\t\t<p>ne la nostra citt&agrave; s&igrave; come suole,</p>\n\t\t<p>o se del tutto se n&rsquo;&egrave; gita fora;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&eacute; Guiglielmo Borsiere, il qual si duole</p>\n\t\t<p>con noi per poco e va l&agrave; coi compagni,</p>\n\t\t<p>assai ne cruccia con le sue parole&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;La gente nuova e i s&ugrave;biti guadagni</p>\n\t\t<p>orgoglio e dismisura han generata,</p>\n\t\t<p>Fiorenza, in te, s&igrave; che tu gi&agrave; ten piagni&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; gridai con la faccia levata;</p>\n\t\t<p>e i tre, che ci&ograve; inteser per risposta,</p>\n\t\t<p>guardar l&rsquo;un l&rsquo;altro com&rsquo; al ver si guata.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Se l&rsquo;altre volte s&igrave; poco ti costa&raquo;,</p>\n\t\t<p>rispuoser tutti, &laquo;il satisfare altrui,</p>\n\t\t<p>felice te se s&igrave; parli a tua posta!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per&ograve;, se campi d&rsquo;esti luoghi bui</p>\n\t\t<p>e torni a riveder le belle stelle,</p>\n\t\t<p>quando ti giover&agrave; dicere \u201CI&rsquo; fui\u201D,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>fa che di noi a la gente favelle&raquo;.</p>\n\t\t<p>Indi rupper la rota, e a fuggirsi</p>\n\t\t<p>ali sembiar le gambe loro isnelle.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Un amen non saria possuto dirsi</p>\n\t\t<p>tosto cos&igrave; com&rsquo; e&rsquo; fuoro spariti;</p>\n\t\t<p>per ch&rsquo;al maestro parve di partirsi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io lo seguiva, e poco eravam iti,</p>\n\t\t<p>che &rsquo;l suon de l&rsquo;acqua n&rsquo;era s&igrave; vicino,</p>\n\t\t<p>che per parlar saremmo a pena uditi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Come quel fiume c&rsquo;ha proprio cammino</p>\n\t\t<p>prima dal Monte Viso &rsquo;nver&rsquo; levante,</p>\n\t\t<p>da la sinistra costa d&rsquo;Apennino,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che si chiama Acquacheta suso, avante</p>\n\t\t<p>che si divalli gi&ugrave; nel basso letto,</p>\n\t\t<p>e a Forl&igrave; di quel nome &egrave; vacante,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>rimbomba l&agrave; sovra San Benedetto</p>\n\t\t<p>de l&rsquo;Alpe per cadere ad una scesa</p>\n\t\t<p>ove dovea per mille esser recetto;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>cos&igrave;, gi&ugrave; d&rsquo;una ripa discoscesa,</p>\n\t\t<p>trovammo risonar quell&rsquo; acqua tinta,</p>\n\t\t<p>s&igrave; che &rsquo;n poc&rsquo; ora avria l&rsquo;orecchia offesa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io avea una corda intorno cinta,</p>\n\t\t<p>e con essa pensai alcuna volta</p>\n\t\t<p>prender la lonza a la pelle dipinta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poscia ch&rsquo;io l&rsquo;ebbi tutta da me sciolta,</p>\n\t\t<p>s&igrave; come &rsquo;l duca m&rsquo;avea comandato,</p>\n\t\t<p>porsila a lui aggroppata e ravvolta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ond&rsquo; ei si volse inver&rsquo; lo destro lato,</p>\n\t\t<p>e alquanto di lunge da la sponda</p>\n\t\t<p>la gitt&ograve; giuso in quell&rsquo; alto burrato.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>\u2018E&rsquo; pur convien che novit&agrave; risponda&rsquo;,</p>\n\t\t<p>dicea fra me medesmo, \u2018al novo cenno</p>\n\t\t<p>che &rsquo;l maestro con l&rsquo;occhio s&igrave; seconda&rsquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ahi quanto cauti li uomini esser dienno</p>\n\t\t<p>presso a color che non veggion pur l&rsquo;ovra,</p>\n\t\t<p>ma per entro i pensier miran col senno!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>El disse a me: &laquo;Tosto verr&agrave; di sovra</p>\n\t\t<p>ci&ograve; ch&rsquo;io attendo e che il tuo pensier sogna;</p>\n\t\t<p>tosto convien ch&rsquo;al tuo viso si scovra&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Sempre a quel ver c&rsquo;ha faccia di menzogna</p>\n\t\t<p>de&rsquo; l&rsquo;uom chiuder le labbra fin ch&rsquo;el puote,</p>\n\t\t<p>per&ograve; che sanza colpa fa vergogna;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ma qui tacer nol posso; e per le note</p>\n\t\t<p>di questa comed&igrave;a, lettor, ti giuro,</p>\n\t\t<p>s&rsquo;elle non sien di lunga grazia v&ograve;te,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&rsquo;i&rsquo; vidi per quell&rsquo; aere grosso e scuro</p>\n\t\t<p>venir notando una figura in suso,</p>\n\t\t<p>maravigliosa ad ogne cor sicuro,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>s&igrave; come torna colui che va giuso</p>\n\t\t<p>talora a solver l&rsquo;&agrave;ncora ch&rsquo;aggrappa</p>\n\t\t<p>o scoglio o altro che nel mare &egrave; chiuso,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che &rsquo;n s&ugrave; si stende e da pi&egrave; si rattrappa.</p>\n\t\t</div>','<p class="cantohead">17</p>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Ecco la fiera con la coda aguzza,</p>\n\t\t<p>che passa i monti e rompe i muri e l\x92armi!</p>\n\t\t<p>Ecco colei che tutto \x92l mondo appuzza!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>S&igrave; cominci&ograve; lo mio duca a parlarmi;</p>\n\t\t<p>e accennolle che venisse a proda,</p>\n\t\t<p>vicino al fin d\x92i passeggiati marmi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quella sozza imagine di froda</p>\n\t\t<p>sen venne, e arriv&ograve; la testa e \x92l busto,</p>\n\t\t<p>ma \'\x92n su la riva non trasse la coda.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>La faccia sua era faccia d\x92uom giusto,</p>\n\t\t<p>tanto benigna avea di fuor la pelle,</p>\n\t\t<p>e d\x92\'un serpente tutto l\x92altro fusto;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>due branche avea pilose insin l\x92ascelle;</p>\n\t\t<p>lo dosso e \x92\'l petto e ambedue le coste</p>\n\t\t<p>dipinti avea di nodi e di rotelle.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Con pi&ugrave; color, sommesse e sovraposte</p>\n\t\t<p>non fer mai drappi Tartari n&eacute; Turchi,</p>\n\t\t<p>n&eacute; fuor tai tele per Aragne imposte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Come talvolta stanno a riva i burchi,</p>\n\t\t<p>che parte sono in acqua e parte in terra,</p>\n\t\t<p>e come l&agrave; tra li Tedeschi lurchi</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>lo bivero s\x92assetta a far sua guerra,</p>\n\t\t<p>cos&igrave; la fiera pessima si stava</p>\n\t\t<p>su l\x92orlo ch\x92&egrave; di pietra e \x92l sabbion serra.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Nel vano tutta sua coda guizzava,</p>\n\t\t<p>torcendo in s&ugrave; la venenosa forca</p>\n\t\t<p>ch\x92\'a guisa di scorpion la punta armava.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo duca disse: &laquo;Or convien che si torca</p>\n\t\t<p>la nostra via un poco insino a quella</p>\n\t\t<p>bestia malvagia che col&agrave; si corca&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per&ograve; scendemmo a la destra mammella,</p>\n\t\t<p>e diece passi femmo in su lo stremo,</p>\n\t\t<p>per ben cessar la rena e la fiammella.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quando noi a lei venuti semo,</p>\n\t\t<p>poco pi&ugrave; oltre veggio in su la rena</p>\n\t\t<p>gente seder propinqua al loco scemo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quivi \x92l maestro &laquo;Acci&ograve; che tutta piena</p>\n\t\t<p>esper&iuml;enza d\x92esto giron porti&raquo;,</p>\n\t\t<p>mi disse, &laquo;va, e vedi la lor mena.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Li tuoi ragionamenti sian l&agrave; corti;</p>\n\t\t<p>mentre che torni, parler&ograve; con questa,</p>\n\t\t<p>che ne conceda i suoi omeri forti&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; ancor su per la strema testa</p>\n\t\t<p>di quel settimo cerchio tutto solo</p>\n\t\t<p>andai, dove sedea la gente mesta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per li occhi fora scoppiava lor duolo;</p>\n\t\t<p>di qua, di l&agrave; soccorrien con le mani</p>\n\t\t<p>quando a\x92 vapori, e quando al caldo suolo:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>non altrimenti fan di state i cani</p>\n\t\t<p>or col ceffo or col pi&egrave;, quando son morsi</p>\n\t\t<p>o da pulci o da mosche o da tafani.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi che nel viso a certi li occhi porsi,</p>\n\t\t<p>ne\x92 quali \'\x92l doloroso foco casca,</p>\n\t\t<p>non ne conobbi alcun; ma io m\x92\'accorsi</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che dal collo a ciascun pendea una tasca</p>\n\t\t<p>ch\'\x92avea certo colore e certo segno,</p>\n\t\t<p>e quindi par che \x92\'l loro occhio si pasca.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E com\x92 io riguardando tra lor vegno,</p>\n\t\t<p>in una borsa gialla vidi azzurro</p>\n\t\t<p>che d\x92\'un leone avea faccia e contegno.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi, procedendo di mio sguardo il curro,</p>\n\t\t<p>vidine un\x92\'altra come sangue rossa,</p>\n\t\t<p>mostrando un\x92\'oca bianca pi&ugrave; che burro.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E un che d\x92\'una scrofa azzurra e grossa</p>\n\t\t<p>segnato avea lo suo sacchetto bianco,</p>\n\t\t<p>mi disse: &laquo;Che fai tu in questa fossa?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Or te ne va; e perch&eacute; se\x92 vivo anco,</p>\n\t\t<p>sappi che \x92l mio vicin Vital&iuml;ano</p>\n\t\t<p>seder&agrave; qui dal mio sinistro fianco.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Con questi Fiorentin son padoano:</p>\n\t\t<p>spesse f&iuml;ate mi \x92ntronan li orecchi</p>\n\t\t<p>gridando: \x93Vegna \'\x92l cavalier sovrano,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che recher&agrave; la tasca con tre becchi!\x94&raquo;.</p>\n\t\t<p>Qui distorse la bocca e di fuor trasse</p>\n\t\t<p>la lingua, come bue che \x92\'l naso lecchi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io, temendo no \x92l pi&ugrave; star crucciasse</p>\n\t\t<p>lui che di poco star m\x92avea \x92mmonito,</p>\n\t\t<p>torna\x92mi in dietro da l\x92anime lasse.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Trova\x92 il duca mio ch\x92era salito</p>\n\t\t<p>gi&agrave; su la groppa del fiero animale,</p>\n\t\t<p>e disse a me: &laquo;Or sie forte e ardito.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Omai si scende per s&igrave; fatte scale;</p>\n\t\t<p>monta dinanzi, ch\x92i\x92 voglio esser mezzo,</p>\n\t\t<p>s&igrave; che la coda non possa far male&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Qual &egrave; colui che s&igrave; presso ha \x92l riprezzo</p>\n\t\t<p>de la quartana, c\'\x92ha gi&agrave; l\x92unghie smorte,</p>\n\t\t<p>e triema tutto pur guardando \x92l rezzo,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>tal divenn\x92 io a le parole porte;</p>\n\t\t<p>ma vergogna mi f&eacute; le sue minacce,</p>\n\t\t<p>che innanzi a buon segnor fa servo forte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>I\x92 m\x92assettai in su quelle spallacce;</p>\n\t\t<p>s&igrave; volli dir, ma la voce non venne</p>\n\t\t<p>com\x92 io credetti: \x91Fa che tu m\x92\'abbracce\x92.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma esso, ch\x92\'altra volta mi sovvenne</p>\n\t\t<p>ad altro forse, tosto ch\x92i\x92 montai</p>\n\t\t<p>con le braccia m\x92avvinse e mi sostenne;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e disse: &laquo;Ger&iuml;on, moviti omai:</p>\n\t\t<p>le rote larghe, e lo scender sia poco;</p>\n\t\t<p>pensa la nova soma che tu hai&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Come la navicella esce di loco</p>\n\t\t<p>in dietro in dietro, s&igrave; quindi si tolse;</p>\n\t\t<p>e poi ch\x92al tutto si sent&igrave; a gioco,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>l&agrave; \x92v\x92 era \x92l petto, la coda rivolse,</p>\n\t\t<p>e quella tesa, come anguilla, mosse,</p>\n\t\t<p>e con le branche l\x92aere a s&eacute; raccolse.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Maggior paura non credo che fosse</p>\n\t\t<p>quando Fetonte abbandon&ograve; li freni,</p>\n\t\t<p>per che \'\x92l ciel, come pare ancor, si cosse;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>n&eacute; quando Icaro misero le reni</p>\n\t\t<p>sent&igrave; spennar per la scaldata cera,</p>\n\t\t<p>gridando il padre a lui &laquo;Mala via tieni!&raquo;,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che fu la mia, quando vidi ch\x92i\x92 era</p>\n\t\t<p>ne l\'\x92aere d\x92\'ogne parte, e vidi spenta</p>\n\t\t<p>ogne veduta fuor che de la fera.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ella sen va notando lenta lenta;</p>\n\t\t<p>rota e discende, ma non me n\x92accorgo</p>\n\t\t<p>se non che al viso e di sotto mi venta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io sentia gi&agrave; da la man destra il gorgo</p>\n\t\t<p>far sotto noi un orribile scroscio,</p>\n\t\t<p>per che con li occhi \x92n gi&ugrave; la testa sporgo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor fu\x92 io pi&ugrave; timido a lo stoscio,</p>\n\t\t<p>per&ograve; ch\x92i\x92 vidi fuochi e senti\x92 pianti;</p>\n\t\t<p>ond\x92 io tremando tutto mi raccoscio.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E vidi poi, ch&eacute; nol vedea davanti,</p>\n\t\t<p>lo scendere e \x92l girar per li gran mali</p>\n\t\t<p>che s\x92\'appressavan da diversi canti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Come \'\x92l falcon ch\x92&egrave; stato assai su l\'\x92ali,</p>\n\t\t<p>che sanza veder logoro o uccello</p>\n\t\t<p>fa dire al falconiere &laquo;Om&egrave;, tu cali!&raquo;,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>discende lasso onde si move isnello,</p>\n\t\t<p>per cento rote, e da lunge si pone</p>\n\t\t<p>dal suo maestro, disdegnoso e fello;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>cos&igrave; ne puose al fondo Ger&iuml;one</p>\n\t\t<p>al pi&egrave; al pi&egrave; de la stagliata rocca,</p>\n\t\t<p>e, discarcate le nostre persone,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>si dilegu&ograve; come da corda cocca.</p>\n\t\t</div>','<p class="cantohead">18</p>\n\t\t<div class="stanza">\n\t\t\t<p>Luogo &egrave; in inferno detto Malebolge,</p>\n\t\t<p>tutto di pietra di color ferrigno,</p>\n\t\t<p>come la cerchia che dintorno il volge.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Nel dritto mezzo del campo maligno</p>\n\t\t<p>vaneggia un pozzo assai largo e profondo,</p>\n\t\t<p>di cui suo loco dicer&ograve; l&rsquo;ordigno.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quel cinghio che rimane adunque &egrave; tondo</p>\n\t\t<p>tra &rsquo;l pozzo e &rsquo;l pi&egrave; de l&rsquo;alta ripa dura,</p>\n\t\t<p>e ha distinto in dieci valli il fondo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quale, dove per guardia de le mura</p>\n\t\t<p>pi&ugrave; e pi&ugrave; fossi cingon li castelli,</p>\n\t\t<p>la parte dove son rende figura,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>tale imagine quivi facean quelli;</p>\n\t\t<p>e come a tai fortezze da&rsquo; lor sogli</p>\n\t\t<p>a la ripa di fuor son ponticelli,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>cos&igrave; da imo de la roccia scogli</p>\n\t\t<p>movien che ricidien li argini e &rsquo; fossi</p>\n\t\t<p>infino al pozzo che i tronca e raccogli.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>In questo luogo, de la schiena scossi</p>\n\t\t<p>di Ger&iuml;on, trovammoci; e &rsquo;l poeta</p>\n\t\t<p>tenne a sinistra, e io dietro mi mossi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>A la man destra vidi nova pieta,</p>\n\t\t<p>novo tormento e novi frustatori,</p>\n\t\t<p>di che la prima bolgia era repleta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Nel fondo erano ignudi i peccatori;</p>\n\t\t<p>dal mezzo in qua ci venien verso &rsquo;l volto,</p>\n\t\t<p>di l&agrave; con noi, ma con passi maggiori,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>come i Roman per l&rsquo;essercito molto,</p>\n\t\t<p>l&rsquo;anno del giubileo, su per lo ponte</p>\n\t\t<p>hanno a passar la gente modo colto,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che da l&rsquo;un lato tutti hanno la fronte</p>\n\t\t<p>verso &rsquo;l castello e vanno a Santo Pietro,</p>\n\t\t<p>da l&rsquo;altra sponda vanno verso &rsquo;l monte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Di qua, di l&agrave;, su per lo sasso tetro</p>\n\t\t<p>vidi demon cornuti con gran ferze,</p>\n\t\t<p>che li battien crudelmente di retro.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ahi come facean lor levar le berze</p>\n\t\t<p>a le prime percosse! gi&agrave; nessuno</p>\n\t\t<p>le seconde aspettava n&eacute; le terze.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Mentr&rsquo; io andava, li occhi miei in uno</p>\n\t\t<p>furo scontrati; e io s&igrave; tosto dissi:</p>\n\t\t<p>&laquo;Gi&agrave; di veder costui non son digiuno&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per ch&rsquo;&iuml;o a figurarlo i piedi affissi;</p>\n\t\t<p>e &rsquo;l dolce duca meco si ristette,</p>\n\t\t<p>e assentio ch&rsquo;alquanto in dietro gissi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quel frustato celar si credette</p>\n\t\t<p>bassando &rsquo;l viso; ma poco li valse,</p>\n\t\t<p>ch&rsquo;io dissi: &laquo;O tu che l&rsquo;occhio a terra gette,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>se le fazion che porti non son false,</p>\n\t\t<p>Venedico se&rsquo; tu Caccianemico.</p>\n\t\t<p>Ma che ti mena a s&igrave; pungenti salse?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;Mal volontier lo dico;</p>\n\t\t<p>ma sforzami la tua chiara favella,</p>\n\t\t<p>che mi fa sovvenir del mondo antico.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>I&rsquo; fui colui che la Ghisolabella</p>\n\t\t<p>condussi a far la voglia del marchese,</p>\n\t\t<p>come che suoni la sconcia novella.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E non pur io qui piango bolognese;</p>\n\t\t<p>anzi n&rsquo;&egrave; questo loco tanto pieno,</p>\n\t\t<p>che tante lingue non son ora apprese</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>a dicer \u2018sipa&rsquo; tra S&agrave;vena e Reno;</p>\n\t\t<p>e se di ci&ograve; vuoi fede o testimonio,</p>\n\t\t<p>r&egrave;cati a mente il nostro avaro seno&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; parlando il percosse un demonio</p>\n\t\t<p>de la sua scur&iuml;ada, e disse: &laquo;Via,</p>\n\t\t<p>ruffian! qui non son femmine da conio&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>I&rsquo; mi raggiunsi con la scorta mia;</p>\n\t\t<p>poscia con pochi passi divenimmo</p>\n\t\t<p>l&agrave; &rsquo;v&rsquo; uno scoglio de la ripa uscia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Assai leggeramente quel salimmo;</p>\n\t\t<p>e v&ograve;lti a destra su per la sua scheggia,</p>\n\t\t<p>da quelle cerchie etterne ci partimmo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quando noi fummo l&agrave; dov&rsquo; el vaneggia</p>\n\t\t<p>di sotto per dar passo a li sferzati,</p>\n\t\t<p>lo duca disse: &laquo;Attienti, e fa che feggia</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>lo viso in te di quest&rsquo; altri mal nati,</p>\n\t\t<p>ai quali ancor non vedesti la faccia</p>\n\t\t<p>per&ograve; che son con noi insieme andati&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Del vecchio ponte guardavam la traccia</p>\n\t\t<p>che ven&igrave;a verso noi da l&rsquo;altra banda,</p>\n\t\t<p>e che la ferza similmente scaccia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E &rsquo;l buon maestro, sanza mia dimanda,</p>\n\t\t<p>mi disse: &laquo;Guarda quel grande che vene,</p>\n\t\t<p>e per dolor non par lagrime spanda:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>quanto aspetto reale ancor ritene!</p>\n\t\t<p>Quelli &egrave; Ias&oacute;n, che per cuore e per senno</p>\n\t\t<p>li Colchi del monton privati f&eacute;ne.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ello pass&ograve; per l&rsquo;isola di Lenno</p>\n\t\t<p>poi che l&rsquo;ardite femmine spietate</p>\n\t\t<p>tutti li maschi loro a morte dienno.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ivi con segni e con parole ornate</p>\n\t\t<p>Isifile ingann&ograve;, la giovinetta</p>\n\t\t<p>che prima avea tutte l&rsquo;altre ingannate.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lasciolla quivi, gravida, soletta;</p>\n\t\t<p>tal colpa a tal martiro lui condanna;</p>\n\t\t<p>e anche di Medea si fa vendetta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Con lui sen va chi da tal parte inganna;</p>\n\t\t<p>e questo basti de la prima valle</p>\n\t\t<p>sapere e di color che &rsquo;n s&eacute; assanna&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Gi&agrave; eravam l&agrave; &rsquo;ve lo stretto calle</p>\n\t\t<p>con l&rsquo;argine secondo s&rsquo;incrocicchia,</p>\n\t\t<p>e fa di quello ad un altr&rsquo; arco spalle.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quindi sentimmo gente che si nicchia</p>\n\t\t<p>ne l&rsquo;altra bolgia e che col muso scuffa,</p>\n\t\t<p>e s&eacute; medesma con le palme picchia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Le ripe eran grommate d&rsquo;una muffa,</p>\n\t\t<p>per l&rsquo;alito di gi&ugrave; che vi s&rsquo;appasta,</p>\n\t\t<p>che con li occhi e col naso facea zuffa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo fondo &egrave; cupo s&igrave;, che non ci basta</p>\n\t\t<p>loco a veder sanza montare al dosso</p>\n\t\t<p>de l&rsquo;arco, ove lo scoglio pi&ugrave; sovrasta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quivi venimmo; e quindi gi&ugrave; nel fosso</p>\n\t\t<p>vidi gente attuffata in uno sterco</p>\n\t\t<p>che da li uman privadi parea mosso.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E mentre ch&rsquo;io l&agrave; gi&ugrave; con l&rsquo;occhio cerco,</p>\n\t\t<p>vidi un col capo s&igrave; di merda lordo,</p>\n\t\t<p>che non par\xEBa s&rsquo;era laico o cherco.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quei mi sgrid&ograve;: &laquo;Perch&eacute; se&rsquo; tu s&igrave; gordo</p>\n\t\t<p>di riguardar pi&ugrave; me che li altri brutti?&raquo;.</p>\n\t\t<p>E io a lui: &laquo;Perch&eacute;, se ben ricordo,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>gi&agrave; t&rsquo;ho veduto coi capelli asciutti,</p>\n\t\t<p>e se&rsquo; Alessio Interminei da Lucca:</p>\n\t\t<p>per&ograve; t&rsquo;adocchio pi&ugrave; che li altri tutti&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli allor, battendosi la zucca:</p>\n\t\t<p>&laquo;Qua gi&ugrave; m&rsquo;hanno sommerso le lusinghe</p>\n\t\t<p>ond&rsquo; io non ebbi mai la lingua stucca&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Appresso ci&ograve; lo duca &laquo;Fa che pinghe&raquo;,</p>\n\t\t<p>mi disse, &laquo;il viso un poco pi&ugrave; avante,</p>\n\t\t<p>s&igrave; che la faccia ben con l&rsquo;occhio attinghe</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>di quella sozza e scapigliata fante</p>\n\t\t<p>che l&agrave; si graffia con l&rsquo;unghie merdose,</p>\n\t\t<p>e or s&rsquo;accoscia e ora &egrave; in piedi stante.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ta&iuml;de &egrave;, la puttana che rispuose</p>\n\t\t<p>al drudo suo quando disse \u201CHo io grazie</p>\n\t\t<p>grandi apo te?\u201D: \u201CAnzi maravigliose!\u201D.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quinci sian le nostre viste sazie&raquo;.</p>\n\t\t</div>','<p class="cantohead">19</p>\n\t\t<div class="stanza">\n\t\t\t<p>O Simon mago, o miseri seguaci</p>\n\t\t<p>che le cose di Dio, che di bontate</p>\n\t\t<p>deon essere spose, e voi rapaci</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>per oro e per argento avolterate,</p>\n\t\t<p>or convien che per voi suoni la tromba,</p>\n\t\t<p>per&ograve; che ne la terza bolgia state.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Gi&agrave; eravamo, a la seguente tomba,</p>\n\t\t<p>montati de lo scoglio in quella parte</p>\n\t\t<p>ch&rsquo;a punto sovra mezzo &rsquo;l fosso piomba.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>O somma sap&iuml;enza, quanta &egrave; l&rsquo;arte</p>\n\t\t<p>che mostri in cielo, in terra e nel mal mondo,</p>\n\t\t<p>e quanto giusto tua virt&ugrave; comparte!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io vidi per le coste e per lo fondo</p>\n\t\t<p>piena la pietra livida di f&oacute;ri,</p>\n\t\t<p>d&rsquo;un largo tutti e ciascun era tondo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non mi parean men ampi n&eacute; maggiori</p>\n\t\t<p>che que&rsquo; che son nel mio bel San Giovanni,</p>\n\t\t<p>fatti per loco d&rsquo;i battezzatori;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>l&rsquo;un de li quali, ancor non &egrave; molt&rsquo; anni,</p>\n\t\t<p>rupp&rsquo; io per un che dentro v&rsquo;annegava:</p>\n\t\t<p>e questo sia suggel ch&rsquo;ogn&rsquo; omo sganni.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Fuor de la bocca a ciascun soperchiava</p>\n\t\t<p>d&rsquo;un peccator li piedi e de le gambe</p>\n\t\t<p>infino al grosso, e l&rsquo;altro dentro stava.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Le piante erano a tutti accese intrambe;</p>\n\t\t<p>per che s&igrave; forte guizzavan le giunte,</p>\n\t\t<p>che spezzate averien ritorte e strambe.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Qual suole il fiammeggiar de le cose unte</p>\n\t\t<p>muoversi pur su per la strema buccia,</p>\n\t\t<p>tal era l&igrave; dai calcagni a le punte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Chi &egrave; colui, maestro, che si cruccia</p>\n\t\t<p>guizzando pi&ugrave; che li altri suoi consorti&raquo;,</p>\n\t\t<p>diss&rsquo; io, &laquo;e cui pi&ugrave; roggia fiamma succia?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;Se tu vuo&rsquo; ch&rsquo;i&rsquo; ti porti</p>\n\t\t<p>l&agrave; gi&ugrave; per quella ripa che pi&ugrave; giace,</p>\n\t\t<p>da lui saprai di s&eacute; e de&rsquo; suoi torti&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io: &laquo;Tanto m&rsquo;&egrave; bel, quanto a te piace:</p>\n\t\t<p>tu se&rsquo; segnore, e sai ch&rsquo;i&rsquo; non mi parto</p>\n\t\t<p>dal tuo volere, e sai quel che si tace&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor venimmo in su l&rsquo;argine quarto;</p>\n\t\t<p>volgemmo e discendemmo a mano stanca</p>\n\t\t<p>l&agrave; gi&ugrave; nel fondo foracchiato e arto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo buon maestro ancor de la sua anca</p>\n\t\t<p>non mi dipuose, s&igrave; mi giunse al rotto</p>\n\t\t<p>di quel che si piangeva con la zanca.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;O qual che se&rsquo; che &rsquo;l di s&ugrave; tien di sotto,</p>\n\t\t<p>anima trista come pal commessa&raquo;,</p>\n\t\t<p>comincia&rsquo; io a dir, &laquo;se puoi, fa motto&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io stava come &rsquo;l frate che confessa</p>\n\t\t<p>lo perfido assessin, che, poi ch&rsquo;&egrave; fitto,</p>\n\t\t<p>richiama lui per che la morte cessa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed el grid&ograve;: &laquo;Se&rsquo; tu gi&agrave; cost&igrave; ritto,</p>\n\t\t<p>se&rsquo; tu gi&agrave; cost&igrave; ritto, Bonifazio?</p>\n\t\t<p>Di parecchi anni mi ment&igrave; lo scritto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Se&rsquo; tu s&igrave; tosto di quell&rsquo; aver sazio</p>\n\t\t<p>per lo qual non temesti t&ograve;rre a &rsquo;nganno</p>\n\t\t<p>la bella donna, e poi di farne strazio?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tal mi fec&rsquo; io, quai son color che stanno,</p>\n\t\t<p>per non intender ci&ograve; ch&rsquo;&egrave; lor risposto,</p>\n\t\t<p>quasi scornati, e risponder non sanno.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor Virgilio disse: &laquo;Dilli tosto:</p>\n\t\t<p>\u201CNon son colui, non son colui che credi\u201D&raquo;;</p>\n\t\t<p>e io rispuosi come a me fu imposto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per che lo spirto tutti storse i piedi;</p>\n\t\t<p>poi, sospirando e con voce di pianto,</p>\n\t\t<p>mi disse: &laquo;Dunque che a me richiedi?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Se di saper ch&rsquo;i&rsquo; sia ti cal cotanto,</p>\n\t\t<p>che tu abbi per&ograve; la ripa corsa,</p>\n\t\t<p>sappi ch&rsquo;i&rsquo; fui vestito del gran manto;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e veramente fui figliuol de l&rsquo;orsa,</p>\n\t\t<p>cupido s&igrave; per avanzar li orsatti,</p>\n\t\t<p>che s&ugrave; l&rsquo;avere e qui me misi in borsa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Di sotto al capo mio son li altri tratti</p>\n\t\t<p>che precedetter me simoneggiando,</p>\n\t\t<p>per le fessure de la pietra piatti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>L&agrave; gi&ugrave; cascher&ograve; io altres&igrave; quando</p>\n\t\t<p>verr&agrave; colui ch&rsquo;i&rsquo; credea che tu fossi,</p>\n\t\t<p>allor ch&rsquo;i&rsquo; feci &rsquo;l s&ugrave;bito dimando.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma pi&ugrave; &egrave; &rsquo;l tempo gi&agrave; che i pi&egrave; mi cossi</p>\n\t\t<p>e ch&rsquo;i&rsquo; son stato cos&igrave; sottosopra,</p>\n\t\t<p>ch&rsquo;el non star&agrave; piantato coi pi&egrave; rossi:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&eacute; dopo lui verr&agrave; di pi&ugrave; laida opra,</p>\n\t\t<p>di ver&rsquo; ponente, un pastor sanza legge,</p>\n\t\t<p>tal che convien che lui e me ricuopra.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Nuovo Ias&oacute;n sar&agrave;, di cui si legge</p>\n\t\t<p>ne&rsquo; Maccabei; e come a quel fu molle</p>\n\t\t<p>suo re, cos&igrave; fia lui chi Francia regge&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io non so s&rsquo;i&rsquo; mi fui qui troppo folle,</p>\n\t\t<p>ch&rsquo;i&rsquo; pur rispuosi lui a questo metro:</p>\n\t\t<p>&laquo;Deh, or mi d&igrave;: quanto tesoro volle</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Nostro Segnore in prima da san Pietro</p>\n\t\t<p>ch&rsquo;ei ponesse le chiavi in sua bal&igrave;a?</p>\n\t\t<p>Certo non chiese se non \u201CViemmi retro\u201D.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>N&eacute; Pier n&eacute; li altri tolsero a Matia</p>\n\t\t<p>oro od argento, quando fu sortito</p>\n\t\t<p>al loco che perd&eacute; l&rsquo;anima ria.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per&ograve; ti sta, ch&eacute; tu se&rsquo; ben punito;</p>\n\t\t<p>e guarda ben la mal tolta moneta</p>\n\t\t<p>ch&rsquo;esser ti fece contra Carlo ardito.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E se non fosse ch&rsquo;ancor lo mi vieta</p>\n\t\t<p>la reverenza de le somme chiavi</p>\n\t\t<p>che tu tenesti ne la vita lieta,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>io userei parole ancor pi&ugrave; gravi;</p>\n\t\t<p>ch&eacute; la vostra avarizia il mondo attrista,</p>\n\t\t<p>calcando i buoni e sollevando i pravi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Di voi pastor s&rsquo;accorse il Vangelista,</p>\n\t\t<p>quando colei che siede sopra l&rsquo;acque</p>\n\t\t<p>puttaneggiar coi regi a lui fu vista;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>quella che con le sette teste nacque,</p>\n\t\t<p>e da le diece corna ebbe argomento,</p>\n\t\t<p>fin che virtute al suo marito piacque.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Fatto v&rsquo;avete dio d&rsquo;oro e d&rsquo;argento;</p>\n\t\t<p>e che altro &egrave; da voi a l&rsquo;idolatre,</p>\n\t\t<p>se non ch&rsquo;elli uno, e voi ne orate cento?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ahi, Costantin, di quanto mal fu matre,</p>\n\t\t<p>non la tua conversion, ma quella dote</p>\n\t\t<p>che da te prese il primo ricco patre!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E mentr&rsquo; io li cantava cotai note,</p>\n\t\t<p>o ira o cosc&iuml;enza che &rsquo;l mordesse,</p>\n\t\t<p>forte spingava con ambo le piote.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>I&rsquo; credo ben ch&rsquo;al mio duca piacesse,</p>\n\t\t<p>con s&igrave; contenta labbia sempre attese</p>\n\t\t<p>lo suon de le parole vere espresse.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per&ograve; con ambo le braccia mi prese;</p>\n\t\t<p>e poi che tutto su mi s&rsquo;ebbe al petto,</p>\n\t\t<p>rimont&ograve; per la via onde discese.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>N&eacute; si stanc&ograve; d&rsquo;avermi a s&eacute; distretto,</p>\n\t\t<p>s&igrave; men port&ograve; sovra &rsquo;l colmo de l&rsquo;arco</p>\n\t\t<p>che dal quarto al quinto argine &egrave; tragetto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quivi soavemente spuose il carco,</p>\n\t\t<p>soave per lo scoglio sconcio ed erto</p>\n\t\t<p>che sarebbe a le capre duro varco.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Indi un altro vallon mi fu scoperto.</p>\n\t\t</div>','<p class="cantohead">20</p>\n\t\t<div class="stanza">\n\t\t\t<p>Di nova pena mi conven far versi</p>\n\t\t<p>e dar matera al ventesimo canto</p>\n\t\t<p>de la prima canzon, ch&rsquo;&egrave; d&rsquo;i sommersi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io era gi&agrave; disposto tutto quanto</p>\n\t\t<p>a riguardar ne lo scoperto fondo,</p>\n\t\t<p>che si bagnava d&rsquo;angoscioso pianto;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e vidi gente per lo vallon tondo</p>\n\t\t<p>venir, tacendo e lagrimando, al passo</p>\n\t\t<p>che fanno le letane in questo mondo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Come &rsquo;l viso mi scese in lor pi&ugrave; basso,</p>\n\t\t<p>mirabilmente apparve esser travolto</p>\n\t\t<p>ciascun tra &rsquo;l mento e &rsquo;l principio del casso,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&eacute; da le reni era tornato &rsquo;l volto,</p>\n\t\t<p>e in dietro venir li convenia,</p>\n\t\t<p>perch&eacute; &rsquo;l veder dinanzi era lor tolto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Forse per forza gi&agrave; di parlasia</p>\n\t\t<p>si travolse cos&igrave; alcun del tutto;</p>\n\t\t<p>ma io nol vidi, n&eacute; credo che sia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Se Dio ti lasci, lettor, prender frutto</p>\n\t\t<p>di tua lezione, or pensa per te stesso</p>\n\t\t<p>com&rsquo; io potea tener lo viso asciutto,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>quando la nostra imagine di presso</p>\n\t\t<p>vidi s&igrave; torta, che &rsquo;l pianto de li occhi</p>\n\t\t<p>le natiche bagnava per lo fesso.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Certo io piangea, poggiato a un de&rsquo; rocchi</p>\n\t\t<p>del duro scoglio, s&igrave; che la mia scorta</p>\n\t\t<p>mi disse: &laquo;Ancor se&rsquo; tu de li altri sciocchi?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Qui vive la piet&agrave; quand&rsquo; &egrave; ben morta;</p>\n\t\t<p>chi &egrave; pi&ugrave; scellerato che colui</p>\n\t\t<p>che al giudicio divin passion comporta?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Drizza la testa, drizza, e vedi a cui</p>\n\t\t<p>s&rsquo;aperse a li occhi d&rsquo;i Teban la terra;</p>\n\t\t<p>per ch&rsquo;ei gridavan tutti: \u201CDove rui,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Anf&iuml;arao? perch&eacute; lasci la guerra?\u201D.</p>\n\t\t<p>E non rest&ograve; di ruinare a valle</p>\n\t\t<p>fino a Min&ograve;s che ciascheduno afferra.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Mira c&rsquo;ha fatto petto de le spalle;</p>\n\t\t<p>perch&eacute; volle veder troppo davante,</p>\n\t\t<p>di retro guarda e fa retroso calle.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Vedi Tiresia, che mut&ograve; sembiante</p>\n\t\t<p>quando di maschio femmina divenne,</p>\n\t\t<p>cangiandosi le membra tutte quante;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e prima, poi, ribatter li convenne</p>\n\t\t<p>li duo serpenti avvolti, con la verga,</p>\n\t\t<p>che r&iuml;avesse le maschili penne.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Aronta &egrave; quel ch&rsquo;al ventre li s&rsquo;atterga,</p>\n\t\t<p>che ne&rsquo; monti di Luni, dove ronca</p>\n\t\t<p>lo Carrarese che di sotto alberga,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ebbe tra &rsquo; bianchi marmi la spelonca</p>\n\t\t<p>per sua dimora; onde a guardar le stelle</p>\n\t\t<p>e &rsquo;l mar non li era la veduta tronca.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quella che ricuopre le mammelle,</p>\n\t\t<p>che tu non vedi, con le trecce sciolte,</p>\n\t\t<p>e ha di l&agrave; ogne pilosa pelle,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Manto fu, che cerc&ograve; per terre molte;</p>\n\t\t<p>poscia si puose l&agrave; dove nacqu&rsquo; io;</p>\n\t\t<p>onde un poco mi piace che m&rsquo;ascolte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poscia che &rsquo;l padre suo di vita usc&igrave;o</p>\n\t\t<p>e venne serva la citt&agrave; di Baco,</p>\n\t\t<p>questa gran tempo per lo mondo gio.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Suso in Italia bella giace un laco,</p>\n\t\t<p>a pi&egrave; de l&rsquo;Alpe che serra Lamagna</p>\n\t\t<p>sovra Tiralli, c&rsquo;ha nome Benaco.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per mille fonti, credo, e pi&ugrave; si bagna</p>\n\t\t<p>tra Garda e Val Camonica e Pennino</p>\n\t\t<p>de l&rsquo;acqua che nel detto laco stagna.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Loco &egrave; nel mezzo l&agrave; dove &rsquo;l trentino</p>\n\t\t<p>pastore e quel di Brescia e &rsquo;l veronese</p>\n\t\t<p>segnar poria, s&rsquo;e&rsquo; fesse quel cammino.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Siede Peschiera, bello e forte arnese</p>\n\t\t<p>da fronteggiar Bresciani e Bergamaschi,</p>\n\t\t<p>ove la riva &rsquo;ntorno pi&ugrave; discese.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ivi convien che tutto quanto caschi</p>\n\t\t<p>ci&ograve; che &rsquo;n grembo a Benaco star non pu&ograve;,</p>\n\t\t<p>e fassi fiume gi&ugrave; per verdi paschi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tosto che l&rsquo;acqua a correr mette co,</p>\n\t\t<p>non pi&ugrave; Benaco, ma Mencio si chiama</p>\n\t\t<p>fino a Governol, dove cade in Po.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non molto ha corso, ch&rsquo;el trova una lama,</p>\n\t\t<p>ne la qual si distende e la &rsquo;mpaluda;</p>\n\t\t<p>e suol di state talor essere grama.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quindi passando la vergine cruda</p>\n\t\t<p>vide terra, nel mezzo del pantano,</p>\n\t\t<p>sanza coltura e d&rsquo;abitanti nuda.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>L&igrave;, per fuggire ogne consorzio umano,</p>\n\t\t<p>ristette con suoi servi a far sue arti,</p>\n\t\t<p>e visse, e vi lasci&ograve; suo corpo vano.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Li uomini poi che &rsquo;ntorno erano sparti</p>\n\t\t<p>s&rsquo;accolsero a quel loco, ch&rsquo;era forte</p>\n\t\t<p>per lo pantan ch&rsquo;avea da tutte parti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Fer la citt&agrave; sovra quell&rsquo; ossa morte;</p>\n\t\t<p>e per colei che &rsquo;l loco prima elesse,</p>\n\t\t<p>Mant&uuml;a l&rsquo;appellar sanz&rsquo; altra sorte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Gi&agrave; fuor le genti sue dentro pi&ugrave; spesse,</p>\n\t\t<p>prima che la mattia da Casalodi</p>\n\t\t<p>da Pinamonte inganno ricevesse.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per&ograve; t&rsquo;assenno che, se tu mai odi</p>\n\t\t<p>originar la mia terra altrimenti,</p>\n\t\t<p>la verit&agrave; nulla menzogna frodi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io: &laquo;Maestro, i tuoi ragionamenti</p>\n\t\t<p>mi son s&igrave; certi e prendon s&igrave; mia fede,</p>\n\t\t<p>che li altri mi sarien carboni spenti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma dimmi, de la gente che procede,</p>\n\t\t<p>se tu ne vedi alcun degno di nota;</p>\n\t\t<p>ch&eacute; solo a ci&ograve; la mia mente rifiede&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor mi disse: &laquo;Quel che da la gota</p>\n\t\t<p>porge la barba in su le spalle brune,</p>\n\t\t<p>fu\u2014quando Grecia fu di maschi v&ograve;ta,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>s&igrave; ch&rsquo;a pena rimaser per le cune\u2014</p>\n\t\t<p>augure, e diede &rsquo;l punto con Calcanta</p>\n\t\t<p>in Aulide a tagliar la prima fune.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Euripilo ebbe nome, e cos&igrave; &rsquo;l canta</p>\n\t\t<p>l&rsquo;alta mia traged&igrave;a in alcun loco:</p>\n\t\t<p>ben lo sai tu che la sai tutta quanta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quell&rsquo; altro che ne&rsquo; fianchi &egrave; cos&igrave; poco,</p>\n\t\t<p>Michele Scotto fu, che veramente</p>\n\t\t<p>de le magiche frode seppe &rsquo;l gioco.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Vedi Guido Bonatti; vedi Asdente,</p>\n\t\t<p>ch&rsquo;avere inteso al cuoio e a lo spago</p>\n\t\t<p>ora vorrebbe, ma tardi si pente.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Vedi le triste che lasciaron l&rsquo;ago,</p>\n\t\t<p>la spuola e &rsquo;l fuso, e fecersi &rsquo;ndivine;</p>\n\t\t<p>fecer malie con erbe e con imago.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma vienne omai, ch&eacute; gi&agrave; tiene &rsquo;l confine</p>\n\t\t<p>d&rsquo;amendue li emisperi e tocca l&rsquo;onda</p>\n\t\t<p>sotto Sobilia Caino e le spine;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e gi&agrave; iernotte fu la luna tonda:</p>\n\t\t<p>ben ten de&rsquo; ricordar, ch&eacute; non ti nocque</p>\n\t\t<p>alcuna volta per la selva fonda&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>S&igrave; mi parlava, e andavamo introcque.</p>\n\t\t</div>','<p class="cantohead">21</p>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; di ponte in ponte, altro parlando</p>\n\t\t<p>che la mia comed&igrave;a cantar non cura,</p>\n\t\t<p>venimmo; e tenavamo &rsquo;l colmo, quando</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>restammo per veder l&rsquo;altra fessura</p>\n\t\t<p>di Malebolge e li altri pianti vani;</p>\n\t\t<p>e vidila mirabilmente oscura.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quale ne l&rsquo;arzan&agrave; de&rsquo; Viniziani</p>\n\t\t<p>bolle l&rsquo;inverno la tenace pece</p>\n\t\t<p>a rimpalmare i legni lor non sani,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&eacute; navicar non ponno\u2014in quella vece</p>\n\t\t<p>chi fa suo legno novo e chi ristoppa</p>\n\t\t<p>le coste a quel che pi&ugrave; v&iuml;aggi fece;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>chi ribatte da proda e chi da poppa;</p>\n\t\t<p>altri fa remi e altri volge sarte;</p>\n\t\t<p>chi terzeruolo e artimon rintoppa\u2014:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>tal, non per foco ma per divin&rsquo; arte,</p>\n\t\t<p>bollia l&agrave; giuso una pegola spessa,</p>\n\t\t<p>che &rsquo;nviscava la ripa d&rsquo;ogne parte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>I&rsquo; vedea lei, ma non ved\xEBa in essa</p>\n\t\t<p>mai che le bolle che &rsquo;l bollor levava,</p>\n\t\t<p>e gonfiar tutta, e riseder compressa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Mentr&rsquo; io l&agrave; gi&ugrave; fisamente mirava,</p>\n\t\t<p>lo duca mio, dicendo &laquo;Guarda, guarda!&raquo;,</p>\n\t\t<p>mi trasse a s&eacute; del loco dov&rsquo; io stava.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor mi volsi come l&rsquo;uom cui tarda</p>\n\t\t<p>di veder quel che li convien fuggire</p>\n\t\t<p>e cui paura s&ugrave;bita sgagliarda,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che, per veder, non indugia &rsquo;l partire:</p>\n\t\t<p>e vidi dietro a noi un diavol nero</p>\n\t\t<p>correndo su per lo scoglio venire.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ahi quant&rsquo; elli era ne l&rsquo;aspetto fero!</p>\n\t\t<p>e quanto mi parea ne l&rsquo;atto acerbo,</p>\n\t\t<p>con l&rsquo;ali aperte e sovra i pi&egrave; leggero!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>L&rsquo;omero suo, ch&rsquo;era aguto e superbo,</p>\n\t\t<p>carcava un peccator con ambo l&rsquo;anche,</p>\n\t\t<p>e quei tenea de&rsquo; pi&egrave; ghermito &rsquo;l nerbo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Del nostro ponte disse: &laquo;O Malebranche,</p>\n\t\t<p>ecco un de li anz&iuml;an di Santa Zita!</p>\n\t\t<p>Mettetel sotto, ch&rsquo;i&rsquo; torno per anche</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>a quella terra, che n&rsquo;&egrave; ben fornita:</p>\n\t\t<p>ogn&rsquo; uom v&rsquo;&egrave; barattier, fuor che Bonturo;</p>\n\t\t<p>del no, per li denar, vi si fa ita&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>L&agrave; gi&ugrave; &rsquo;l butt&ograve;, e per lo scoglio duro</p>\n\t\t<p>si volse; e mai non fu mastino sciolto</p>\n\t\t<p>con tanta fretta a seguitar lo furo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quel s&rsquo;attuff&ograve;, e torn&ograve; s&ugrave; convolto;</p>\n\t\t<p>ma i demon che del ponte avean coperchio,</p>\n\t\t<p>gridar: &laquo;Qui non ha loco il Santo Volto!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>qui si nuota altrimenti che nel Serchio!</p>\n\t\t<p>Per&ograve;, se tu non vuo&rsquo; di nostri graffi,</p>\n\t\t<p>non far sopra la pegola soverchio&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi l&rsquo;addentar con pi&ugrave; di cento raffi,</p>\n\t\t<p>disser: &laquo;Coverto convien che qui balli,</p>\n\t\t<p>s&igrave; che, se puoi, nascosamente accaffi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non altrimenti i cuoci a&rsquo; lor vassalli</p>\n\t\t<p>fanno attuffare in mezzo la caldaia</p>\n\t\t<p>la carne con li uncin, perch&eacute; non galli.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo buon maestro &laquo;Acci&ograve; che non si paia</p>\n\t\t<p>che tu ci sia&raquo;, mi disse, &laquo;gi&ugrave; t&rsquo;acquatta</p>\n\t\t<p>dopo uno scheggio, ch&rsquo;alcun schermo t&rsquo;aia;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e per nulla offension che mi sia fatta,</p>\n\t\t<p>non temer tu, ch&rsquo;i&rsquo; ho le cose conte,</p>\n\t\t<p>perch&rsquo; altra volta fui a tal baratta&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poscia pass&ograve; di l&agrave; dal co del ponte;</p>\n\t\t<p>e com&rsquo; el giunse in su la ripa sesta,</p>\n\t\t<p>mestier li fu d&rsquo;aver sicura fronte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Con quel furore e con quella tempesta</p>\n\t\t<p>ch&rsquo;escono i cani a dosso al poverello</p>\n\t\t<p>che di s&ugrave;bito chiede ove s&rsquo;arresta,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>usciron quei di sotto al ponticello,</p>\n\t\t<p>e volser contra lui tutt&rsquo; i runcigli;</p>\n\t\t<p>ma el grid&ograve;: &laquo;Nessun di voi sia fello!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Innanzi che l&rsquo;uncin vostro mi pigli,</p>\n\t\t<p>traggasi avante l&rsquo;un di voi che m&rsquo;oda,</p>\n\t\t<p>e poi d&rsquo;arruncigliarmi si consigli&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tutti gridaron: &laquo;Vada Malacoda!&raquo;;</p>\n\t\t<p>per ch&rsquo;un si mosse\u2014e li altri stetter fermi\u2014</p>\n\t\t<p>e venne a lui dicendo: &laquo;Che li approda?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Credi tu, Malacoda, qui vedermi</p>\n\t\t<p>esser venuto&raquo;, disse &rsquo;l mio maestro,</p>\n\t\t<p>&laquo;sicuro gi&agrave; da tutti vostri schermi,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>sanza voler divino e fato destro?</p>\n\t\t<p>Lascian&rsquo; andar, ch&eacute; nel cielo &egrave; voluto</p>\n\t\t<p>ch&rsquo;i&rsquo; mostri altrui questo cammin silvestro&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor li fu l&rsquo;orgoglio s&igrave; caduto,</p>\n\t\t<p>ch&rsquo;e&rsquo; si lasci&ograve; cascar l&rsquo;uncino a&rsquo; piedi,</p>\n\t\t<p>e disse a li altri: &laquo;Omai non sia feruto&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E &rsquo;l duca mio a me: &laquo;O tu che siedi</p>\n\t\t<p>tra li scheggion del ponte quatto quatto,</p>\n\t\t<p>sicuramente omai a me ti riedi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per ch&rsquo;io mi mossi e a lui venni ratto;</p>\n\t\t<p>e i diavoli si fecer tutti avanti,</p>\n\t\t<p>s&igrave; ch&rsquo;io temetti ch&rsquo;ei tenesser patto;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>cos&igrave; vid&rsquo; &iuml;o gi&agrave; temer li fanti</p>\n\t\t<p>ch&rsquo;uscivan patteggiati di Caprona,</p>\n\t\t<p>veggendo s&eacute; tra nemici cotanti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>I&rsquo; m&rsquo;accostai con tutta la persona</p>\n\t\t<p>lungo &rsquo;l mio duca, e non torceva li occhi</p>\n\t\t<p>da la sembianza lor ch&rsquo;era non buona.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ei chinavan li raffi e &laquo;Vuo&rsquo; che &rsquo;l tocchi&raquo;,</p>\n\t\t<p>diceva l&rsquo;un con l&rsquo;altro, &laquo;in sul groppone?&raquo;.</p>\n\t\t<p>E rispondien: &laquo;S&igrave;, fa che gliel&rsquo; accocchi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma quel demonio che tenea sermone</p>\n\t\t<p>col duca mio, si volse tutto presto</p>\n\t\t<p>e disse: &laquo;Posa, posa, Scarmiglione!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi disse a noi: &laquo;Pi&ugrave; oltre andar per questo</p>\n\t\t<p>iscoglio non si pu&ograve;, per&ograve; che giace</p>\n\t\t<p>tutto spezzato al fondo l&rsquo;arco sesto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E se l&rsquo;andare avante pur vi piace,</p>\n\t\t<p>andatevene su per questa grotta;</p>\n\t\t<p>presso &egrave; un altro scoglio che via face.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ier, pi&ugrave; oltre cinqu&rsquo; ore che quest&rsquo; otta,</p>\n\t\t<p>mille dugento con sessanta sei</p>\n\t\t<p>anni compi&eacute; che qui la via fu rotta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io mando verso l&agrave; di questi miei</p>\n\t\t<p>a riguardar s&rsquo;alcun se ne sciorina;</p>\n\t\t<p>gite con lor, che non saranno rei&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Tra&rsquo;ti avante, Alichino, e Calcabrina&raquo;,</p>\n\t\t<p>cominci&ograve; elli a dire, &laquo;e tu, Cagnazzo;</p>\n\t\t<p>e Barbariccia guidi la decina.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Libicocco vegn&rsquo; oltre e Draghignazzo,</p>\n\t\t<p>Cir&iuml;atto sannuto e Graffiacane</p>\n\t\t<p>e Farfarello e Rubicante pazzo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cercate &rsquo;ntorno le boglienti pane;</p>\n\t\t<p>costor sian salvi infino a l&rsquo;altro scheggio</p>\n\t\t<p>che tutto intero va sovra le tane&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Om&egrave;, maestro, che &egrave; quel ch&rsquo;i&rsquo; veggio?&raquo;,</p>\n\t\t<p>diss&rsquo; io, &laquo;deh, sanza scorta andianci soli,</p>\n\t\t<p>se tu sa&rsquo; ir; ch&rsquo;i&rsquo; per me non la cheggio.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Se tu se&rsquo; s&igrave; accorto come suoli,</p>\n\t\t<p>non vedi tu ch&rsquo;e&rsquo; digrignan li denti</p>\n\t\t<p>e con le ciglia ne minaccian duoli?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;Non vo&rsquo; che tu paventi;</p>\n\t\t<p>lasciali digrignar pur a lor senno,</p>\n\t\t<p>ch&rsquo;e&rsquo; fanno ci&ograve; per li lessi dolenti&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per l&rsquo;argine sinistro volta dienno;</p>\n\t\t<p>ma prima avea ciascun la lingua stretta</p>\n\t\t<p>coi denti, verso lor duca, per cenno;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ed elli avea del cul fatto trombetta.</p>\n\t\t</div>','<p class="cantohead">22</p>\n\t\t<div class="stanza">\n\t\t\t<p>Io vidi gi&agrave; cavalier muover campo,</p>\n\t\t<p>e cominciare stormo e far lor mostra,</p>\n\t\t<p>e talvolta partir per loro scampo;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>corridor vidi per la terra vostra,</p>\n\t\t<p>o Aretini, e vidi gir gualdane,</p>\n\t\t<p>fedir torneamenti e correr giostra;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>quando con trombe, e quando con campane,</p>\n\t\t<p>con tamburi e con cenni di castella,</p>\n\t\t<p>e con cose nostrali e con istrane;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>n&eacute; gi&agrave; con s&igrave; diversa cennamella</p>\n\t\t<p>cavalier vidi muover n&eacute; pedoni,</p>\n\t\t<p>n&eacute; nave a segno di terra o di stella.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Noi andavam con li diece demoni.</p>\n\t\t<p>Ahi fiera compagnia! ma ne la chiesa</p>\n\t\t<p>coi santi, e in taverna coi ghiottoni.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Pur a la pegola era la mia &rsquo;ntesa,</p>\n\t\t<p>per veder de la bolgia ogne contegno</p>\n\t\t<p>e de la gente ch&rsquo;entro v&rsquo;era incesa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Come i dalfini, quando fanno segno</p>\n\t\t<p>a&rsquo; marinar con l&rsquo;arco de la schiena</p>\n\t\t<p>che s&rsquo;argomentin di campar lor legno,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>talor cos&igrave;, ad alleggiar la pena,</p>\n\t\t<p>mostrav&rsquo; alcun de&rsquo; peccatori &rsquo;l dosso</p>\n\t\t<p>e nascondea in men che non balena.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E come a l&rsquo;orlo de l&rsquo;acqua d&rsquo;un fosso</p>\n\t\t<p>stanno i ranocchi pur col muso fuori,</p>\n\t\t<p>s&igrave; che celano i piedi e l&rsquo;altro grosso,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>s&igrave; stavan d&rsquo;ogne parte i peccatori;</p>\n\t\t<p>ma come s&rsquo;appressava Barbariccia,</p>\n\t\t<p>cos&igrave; si ritra&eacute;n sotto i bollori.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>I&rsquo; vidi, e anco il cor me n&rsquo;accapriccia,</p>\n\t\t<p>uno aspettar cos&igrave;, com&rsquo; elli &rsquo;ncontra</p>\n\t\t<p>ch&rsquo;una rana rimane e l&rsquo;altra spiccia;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e Graffiacan, che li era pi&ugrave; di contra,</p>\n\t\t<p>li arruncigli&ograve; le &rsquo;mpegolate chiome</p>\n\t\t<p>e trassel s&ugrave;, che mi parve una lontra.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>I&rsquo; sapea gi&agrave; di tutti quanti &rsquo;l nome,</p>\n\t\t<p>s&igrave; li notai quando fuorono eletti,</p>\n\t\t<p>e poi ch&rsquo;e&rsquo; si chiamaro, attesi come.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;O Rubicante, fa che tu li metti</p>\n\t\t<p>li unghioni a dosso, s&igrave; che tu lo scuoi!&raquo;,</p>\n\t\t<p>gridavan tutti insieme i maladetti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io: &laquo;Maestro mio, fa, se tu puoi,</p>\n\t\t<p>che tu sappi chi &egrave; lo sciagurato</p>\n\t\t<p>venuto a man de li avversari suoi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo duca mio li s&rsquo;accost&ograve; allato;</p>\n\t\t<p>domandollo ond&rsquo; ei fosse, e quei rispuose:</p>\n\t\t<p>&laquo;I&rsquo; fui del regno di Navarra nato.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Mia madre a servo d&rsquo;un segnor mi puose,</p>\n\t\t<p>che m&rsquo;avea generato d&rsquo;un ribaldo,</p>\n\t\t<p>distruggitor di s&eacute; e di sue cose.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi fui famiglia del buon re Tebaldo;</p>\n\t\t<p>quivi mi misi a far baratteria,</p>\n\t\t<p>di ch&rsquo;io rendo ragione in questo caldo&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E Cir&iuml;atto, a cui di bocca uscia</p>\n\t\t<p>d&rsquo;ogne parte una sanna come a porco,</p>\n\t\t<p>li f&eacute; sentir come l&rsquo;una sdruscia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tra male gatte era venuto &rsquo;l sorco;</p>\n\t\t<p>ma Barbariccia il chiuse con le braccia</p>\n\t\t<p>e disse: &laquo;State in l&agrave;, mentr&rsquo; io lo &rsquo;nforco&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E al maestro mio volse la faccia;</p>\n\t\t<p>&laquo;Domanda&raquo;, disse, &laquo;ancor, se pi&ugrave; disii</p>\n\t\t<p>saper da lui, prima ch&rsquo;altri &rsquo;l disfaccia&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo duca dunque: &laquo;Or d&igrave;: de li altri rii</p>\n\t\t<p>conosci tu alcun che sia latino</p>\n\t\t<p>sotto la pece?&raquo;. E quelli: &laquo;I&rsquo; mi partii,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>poco &egrave;, da un che fu di l&agrave; vicino.</p>\n\t\t<p>Cos&igrave; foss&rsquo; io ancor con lui coperto,</p>\n\t\t<p>ch&rsquo;i&rsquo; non temerei unghia n&eacute; uncino!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E Libicocco &laquo;Troppo avem sofferto&raquo;,</p>\n\t\t<p>disse; e preseli &rsquo;l braccio col runciglio,</p>\n\t\t<p>s&igrave; che, stracciando, ne port&ograve; un lacerto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Draghignazzo anco i volle dar di piglio</p>\n\t\t<p>giuso a le gambe; onde &rsquo;l decurio loro</p>\n\t\t<p>si volse intorno intorno con mal piglio.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quand&rsquo; elli un poco rappaciati fuoro,</p>\n\t\t<p>a lui, ch&rsquo;ancor mirava sua ferita,</p>\n\t\t<p>domand&ograve; &rsquo;l duca mio sanza dimoro:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Chi fu colui da cui mala partita</p>\n\t\t<p>di&rsquo; che facesti per venire a proda?&raquo;.</p>\n\t\t<p>Ed ei rispuose: &laquo;Fu frate Gomita,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>quel di Gallura, vasel d&rsquo;ogne froda,</p>\n\t\t<p>ch&rsquo;ebbe i nemici di suo donno in mano,</p>\n\t\t<p>e f&eacute; s&igrave; lor, che ciascun se ne loda.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Danar si tolse e lasciolli di piano,</p>\n\t\t<p>s&igrave; com&rsquo; e&rsquo; dice; e ne li altri offici anche</p>\n\t\t<p>barattier fu non picciol, ma sovrano.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Usa con esso donno Michel Zanche</p>\n\t\t<p>di Logodoro; e a dir di Sardigna</p>\n\t\t<p>le lingue lor non si sentono stanche.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Om&egrave;, vedete l&rsquo;altro che digrigna;</p>\n\t\t<p>i&rsquo; direi anche, ma i&rsquo; temo ch&rsquo;ello</p>\n\t\t<p>non s&rsquo;apparecchi a grattarmi la tigna&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E &rsquo;l gran proposto, v&ograve;lto a Farfarello</p>\n\t\t<p>che stralunava li occhi per fedire,</p>\n\t\t<p>disse: &laquo;Fatti &rsquo;n cost&agrave;, malvagio uccello!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Se voi volete vedere o udire&raquo;,</p>\n\t\t<p>ricominci&ograve; lo spa&uuml;rato appresso,</p>\n\t\t<p>&laquo;Toschi o Lombardi, io ne far&ograve; venire;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ma stieno i Malebranche un poco in cesso,</p>\n\t\t<p>s&igrave; ch&rsquo;ei non teman de le lor vendette;</p>\n\t\t<p>e io, seggendo in questo loco stesso,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>per un ch&rsquo;io son, ne far&ograve; venir sette</p>\n\t\t<p>quand&rsquo; io suffoler&ograve;, com&rsquo; &egrave; nostro uso</p>\n\t\t<p>di fare allor che fori alcun si mette&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cagnazzo a cotal motto lev&ograve; &rsquo;l muso,</p>\n\t\t<p>crollando &rsquo;l capo, e disse: &laquo;Odi malizia</p>\n\t\t<p>ch&rsquo;elli ha pensata per gittarsi giuso!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ond&rsquo; ei, ch&rsquo;avea lacciuoli a gran divizia,</p>\n\t\t<p>rispuose: &laquo;Malizioso son io troppo,</p>\n\t\t<p>quand&rsquo; io procuro a&rsquo; mia maggior trestizia&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Alichin non si tenne e, di rintoppo</p>\n\t\t<p>a li altri, disse a lui: &laquo;Se tu ti cali,</p>\n\t\t<p>io non ti verr&ograve; dietro di gualoppo,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ma batter&ograve; sovra la pece l&rsquo;ali.</p>\n\t\t<p>Lascisi &rsquo;l collo, e sia la ripa scudo,</p>\n\t\t<p>a veder se tu sol pi&ugrave; di noi vali&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>O tu che leggi, udirai nuovo ludo:</p>\n\t\t<p>ciascun da l&rsquo;altra costa li occhi volse,</p>\n\t\t<p>quel prima, ch&rsquo;a ci&ograve; fare era pi&ugrave; crudo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo Navarrese ben suo tempo colse;</p>\n\t\t<p>ferm&ograve; le piante a terra, e in un punto</p>\n\t\t<p>salt&ograve; e dal proposto lor si sciolse.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Di che ciascun di colpa fu compunto,</p>\n\t\t<p>ma quei pi&ugrave; che cagion fu del difetto;</p>\n\t\t<p>per&ograve; si mosse e grid&ograve;: &laquo;Tu se&rsquo; giunto!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma poco i valse: ch&eacute; l&rsquo;ali al sospetto</p>\n\t\t<p>non potero avanzar; quelli and&ograve; sotto,</p>\n\t\t<p>e quei drizz&ograve; volando suso il petto:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>non altrimenti l&rsquo;anitra di botto,</p>\n\t\t<p>quando &rsquo;l falcon s&rsquo;appressa, gi&ugrave; s&rsquo;attuffa,</p>\n\t\t<p>ed ei ritorna s&ugrave; crucciato e rotto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Irato Calcabrina de la buffa,</p>\n\t\t<p>volando dietro li tenne, invaghito</p>\n\t\t<p>che quei campasse per aver la zuffa;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e come &rsquo;l barattier fu disparito,</p>\n\t\t<p>cos&igrave; volse li artigli al suo compagno,</p>\n\t\t<p>e fu con lui sopra &rsquo;l fosso ghermito.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma l&rsquo;altro fu bene sparvier grifagno</p>\n\t\t<p>ad artigliar ben lui, e amendue</p>\n\t\t<p>cadder nel mezzo del bogliente stagno.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo caldo sghermitor s&ugrave;bito fue;</p>\n\t\t<p>ma per&ograve; di levarsi era neente,</p>\n\t\t<p>s&igrave; avieno inviscate l&rsquo;ali sue.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Barbariccia, con li altri suoi dolente,</p>\n\t\t<p>quattro ne f&eacute; volar da l&rsquo;altra costa</p>\n\t\t<p>con tutt&rsquo; i raffi, e assai prestamente</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>di qua, di l&agrave; discesero a la posta;</p>\n\t\t<p>porser li uncini verso li &rsquo;mpaniati,</p>\n\t\t<p>ch&rsquo;eran gi&agrave; cotti dentro da la crosta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E noi lasciammo lor cos&igrave; &rsquo;mpacciati.</p>\n\t\t</div>','<p class="cantohead">23</p>\n\t\t<div class="stanza">\n\t\t\t<p>Taciti, soli, sanza compagnia</p>\n\t\t<p>n&rsquo;andavam l&rsquo;un dinanzi e l&rsquo;altro dopo,</p>\n\t\t<p>come frati minor vanno per via.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>V&ograve;lt&rsquo; era in su la favola d&rsquo;Isopo</p>\n\t\t<p>lo mio pensier per la presente rissa,</p>\n\t\t<p>dov&rsquo; el parl&ograve; de la rana e del topo;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&eacute; pi&ugrave; non si pareggia \u2018mo&rsquo; e \u2018issa&rsquo;</p>\n\t\t<p>che l&rsquo;un con l&rsquo;altro fa, se ben s&rsquo;accoppia</p>\n\t\t<p>principio e fine con la mente fissa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E come l&rsquo;un pensier de l&rsquo;altro scoppia,</p>\n\t\t<p>cos&igrave; nacque di quello un altro poi,</p>\n\t\t<p>che la prima paura mi f&eacute; doppia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io pensava cos&igrave;: \u2018Questi per noi</p>\n\t\t<p>sono scherniti con danno e con beffa</p>\n\t\t<p>s&igrave; fatta, ch&rsquo;assai credo che lor n&ograve;i.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Se l&rsquo;ira sovra &rsquo;l mal voler s&rsquo;aggueffa,</p>\n\t\t<p>ei ne verranno dietro pi&ugrave; crudeli</p>\n\t\t<p>che &rsquo;l cane a quella lievre ch&rsquo;elli acceffa&rsquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Gi&agrave; mi sentia tutti arricciar li peli</p>\n\t\t<p>de la paura e stava in dietro intento,</p>\n\t\t<p>quand&rsquo; io dissi: &laquo;Maestro, se non celi</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>te e me tostamente, i&rsquo; ho pavento</p>\n\t\t<p>d&rsquo;i Malebranche. Noi li avem gi&agrave; dietro;</p>\n\t\t<p>io li &rsquo;magino s&igrave;, che gi&agrave; li sento&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quei: &laquo;S&rsquo;i&rsquo; fossi di piombato vetro,</p>\n\t\t<p>l&rsquo;imagine di fuor tua non trarrei</p>\n\t\t<p>pi&ugrave; tosto a me, che quella dentro &rsquo;mpetro.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Pur mo venieno i tuo&rsquo; pensier tra &rsquo; miei,</p>\n\t\t<p>con simile atto e con simile faccia,</p>\n\t\t<p>s&igrave; che d&rsquo;intrambi un sol consiglio fei.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>S&rsquo;elli &egrave; che s&igrave; la destra costa giaccia,</p>\n\t\t<p>che noi possiam ne l&rsquo;altra bolgia scendere,</p>\n\t\t<p>noi fuggirem l&rsquo;imaginata caccia&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Gi&agrave; non compi&eacute; di tal consiglio rendere,</p>\n\t\t<p>ch&rsquo;io li vidi venir con l&rsquo;ali tese</p>\n\t\t<p>non molto lungi, per volerne prendere.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo duca mio di s&ugrave;bito mi prese,</p>\n\t\t<p>come la madre ch&rsquo;al romore &egrave; desta</p>\n\t\t<p>e vede presso a s&eacute; le fiamme accese,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che prende il figlio e fugge e non s&rsquo;arresta,</p>\n\t\t<p>avendo pi&ugrave; di lui che di s&eacute; cura,</p>\n\t\t<p>tanto che solo una camiscia vesta;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e gi&ugrave; dal collo de la ripa dura</p>\n\t\t<p>supin si diede a la pendente roccia,</p>\n\t\t<p>che l&rsquo;un de&rsquo; lati a l&rsquo;altra bolgia tura.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non corse mai s&igrave; tosto acqua per doccia</p>\n\t\t<p>a volger ruota di molin terragno,</p>\n\t\t<p>quand&rsquo; ella pi&ugrave; verso le pale approccia,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>come &rsquo;l maestro mio per quel vivagno,</p>\n\t\t<p>portandosene me sovra &rsquo;l suo petto,</p>\n\t\t<p>come suo figlio, non come compagno.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>A pena fuoro i pi&egrave; suoi giunti al letto</p>\n\t\t<p>del fondo gi&ugrave;, ch&rsquo;e&rsquo; furon in sul colle</p>\n\t\t<p>sovresso noi; ma non l&igrave; era sospetto:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&eacute; l&rsquo;alta provedenza che lor volle</p>\n\t\t<p>porre ministri de la fossa quinta,</p>\n\t\t<p>poder di partirs&rsquo; indi a tutti tolle.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>L&agrave; gi&ugrave; trovammo una gente dipinta</p>\n\t\t<p>che giva intorno assai con lenti passi,</p>\n\t\t<p>piangendo e nel sembiante stanca e vinta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Elli avean cappe con cappucci bassi</p>\n\t\t<p>dinanzi a li occhi, fatte de la taglia</p>\n\t\t<p>che in Clugn&igrave; per li monaci fassi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Di fuor dorate son, s&igrave; ch&rsquo;elli abbaglia;</p>\n\t\t<p>ma dentro tutte piombo, e gravi tanto,</p>\n\t\t<p>che Federigo le mettea di paglia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Oh in etterno faticoso manto!</p>\n\t\t<p>Noi ci volgemmo ancor pur a man manca</p>\n\t\t<p>con loro insieme, intenti al tristo pianto;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ma per lo peso quella gente stanca</p>\n\t\t<p>ven&igrave;a s&igrave; pian, che noi eravam nuovi</p>\n\t\t<p>di compagnia ad ogne mover d&rsquo;anca.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per ch&rsquo;io al duca mio: &laquo;Fa che tu trovi</p>\n\t\t<p>alcun ch&rsquo;al fatto o al nome si conosca,</p>\n\t\t<p>e li occhi, s&igrave; andando, intorno movi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E un che &rsquo;ntese la parola tosca,</p>\n\t\t<p>di retro a noi grid&ograve;: &laquo;Tenete i piedi,</p>\n\t\t<p>voi che correte s&igrave; per l&rsquo;aura fosca!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Forse ch&rsquo;avrai da me quel che tu chiedi&raquo;.</p>\n\t\t<p>Onde &rsquo;l duca si volse e disse: &laquo;Aspetta,</p>\n\t\t<p>e poi secondo il suo passo procedi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ristetti, e vidi due mostrar gran fretta</p>\n\t\t<p>de l&rsquo;animo, col viso, d&rsquo;esser meco;</p>\n\t\t<p>ma tardavali &rsquo;l carco e la via stretta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quando fuor giunti, assai con l&rsquo;occhio bieco</p>\n\t\t<p>mi rimiraron sanza far parola;</p>\n\t\t<p>poi si volsero in s&eacute;, e dicean seco:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Costui par vivo a l&rsquo;atto de la gola;</p>\n\t\t<p>e s&rsquo;e&rsquo; son morti, per qual privilegio</p>\n\t\t<p>vanno scoperti de la grave stola?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi disser me: &laquo;O Tosco, ch&rsquo;al collegio</p>\n\t\t<p>de l&rsquo;ipocriti tristi se&rsquo; venuto,</p>\n\t\t<p>dir chi tu se&rsquo; non avere in dispregio&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io a loro: &laquo;I&rsquo; fui nato e cresciuto</p>\n\t\t<p>sovra &rsquo;l bel fiume d&rsquo;Arno a la gran villa,</p>\n\t\t<p>e son col corpo ch&rsquo;i&rsquo; ho sempre avuto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma voi chi siete, a cui tanto distilla</p>\n\t\t<p>quant&rsquo; i&rsquo; veggio dolor gi&ugrave; per le guance?</p>\n\t\t<p>e che pena &egrave; in voi che s&igrave; sfavilla?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E l&rsquo;un rispuose a me: &laquo;Le cappe rance</p>\n\t\t<p>son di piombo s&igrave; grosse, che li pesi</p>\n\t\t<p>fan cos&igrave; cigolar le lor bilance.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Frati godenti fummo, e bolognesi;</p>\n\t\t<p>io Catalano e questi Loderingo</p>\n\t\t<p>nomati, e da tua terra insieme presi</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>come suole esser tolto un uom solingo,</p>\n\t\t<p>per conservar sua pace; e fummo tali,</p>\n\t\t<p>ch&rsquo;ancor si pare intorno dal Gardingo&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io cominciai: &laquo;O frati, i vostri mali . . . &raquo;;</p>\n\t\t<p>ma pi&ugrave; non dissi, ch&rsquo;a l&rsquo;occhio mi corse</p>\n\t\t<p>un, crucifisso in terra con tre pali.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quando mi vide, tutto si distorse,</p>\n\t\t<p>soffiando ne la barba con sospiri;</p>\n\t\t<p>e &rsquo;l frate Catalan, ch&rsquo;a ci&ograve; s&rsquo;accorse,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>mi disse: &laquo;Quel confitto che tu miri,</p>\n\t\t<p>consigli&ograve; i Farisei che convenia</p>\n\t\t<p>porre un uom per lo popolo a&rsquo; mart&igrave;ri.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Attraversato &egrave;, nudo, ne la via,</p>\n\t\t<p>come tu vedi, ed &egrave; mestier ch&rsquo;el senta</p>\n\t\t<p>qualunque passa, come pesa, pria.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E a tal modo il socero si stenta</p>\n\t\t<p>in questa fossa, e li altri dal concilio</p>\n\t\t<p>che fu per li Giudei mala sementa&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor vid&rsquo; io maravigliar Virgilio</p>\n\t\t<p>sovra colui ch&rsquo;era disteso in croce</p>\n\t\t<p>tanto vilmente ne l&rsquo;etterno essilio.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poscia drizz&ograve; al frate cotal voce:</p>\n\t\t<p>&laquo;Non vi dispiaccia, se vi lece, dirci</p>\n\t\t<p>s&rsquo;a la man destra giace alcuna foce</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>onde noi amendue possiamo uscirci,</p>\n\t\t<p>sanza costrigner de li angeli neri</p>\n\t\t<p>che vegnan d&rsquo;esto fondo a dipartirci&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Rispuose adunque: &laquo;Pi&ugrave; che tu non speri</p>\n\t\t<p>s&rsquo;appressa un sasso che da la gran cerchia</p>\n\t\t<p>si move e varca tutt&rsquo; i vallon feri,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>salvo che &rsquo;n questo &egrave; rotto e nol coperchia;</p>\n\t\t<p>montar potrete su per la ruina,</p>\n\t\t<p>che giace in costa e nel fondo soperchia&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo duca stette un poco a testa china;</p>\n\t\t<p>poi disse: &laquo;Mal contava la bisogna</p>\n\t\t<p>colui che i peccator di qua uncina&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E &rsquo;l frate: &laquo;Io udi&rsquo; gi&agrave; dire a Bologna</p>\n\t\t<p>del diavol vizi assai, tra &rsquo; quali udi&rsquo;</p>\n\t\t<p>ch&rsquo;elli &egrave; bugiardo, e padre di menzogna&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Appresso il duca a gran passi sen g&igrave;,</p>\n\t\t<p>turbato un poco d&rsquo;ira nel sembiante;</p>\n\t\t<p>ond&rsquo; io da li &rsquo;ncarcati mi parti&rsquo;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>dietro a le poste de le care piante.</p>\n\t\t</div>','<p class="cantohead">24</p>\n\t\t<div class="stanza">\n\t\t\t<p>In quella parte del giovanetto anno</p>\n\t\t<p>che &rsquo;l sole i crin sotto l&rsquo;Aquario tempra</p>\n\t\t<p>e gi&agrave; le notti al mezzo d&igrave; sen vanno,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>quando la brina in su la terra assempra</p>\n\t\t<p>l&rsquo;imagine di sua sorella bianca,</p>\n\t\t<p>ma poco dura a la sua penna tempra,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>lo villanello a cui la roba manca,</p>\n\t\t<p>si leva, e guarda, e vede la campagna</p>\n\t\t<p>biancheggiar tutta; ond&rsquo; ei si batte l&rsquo;anca,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ritorna in casa, e qua e l&agrave; si lagna,</p>\n\t\t<p>come &rsquo;l tapin che non sa che si faccia;</p>\n\t\t<p>poi riede, e la speranza ringavagna,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>veggendo &rsquo;l mondo aver cangiata faccia</p>\n\t\t<p>in poco d&rsquo;ora, e prende suo vincastro</p>\n\t\t<p>e fuor le pecorelle a pascer caccia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; mi fece sbigottir lo mastro</p>\n\t\t<p>quand&rsquo; io li vidi s&igrave; turbar la fronte,</p>\n\t\t<p>e cos&igrave; tosto al mal giunse lo &rsquo;mpiastro;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&eacute;, come noi venimmo al guasto ponte,</p>\n\t\t<p>lo duca a me si volse con quel piglio</p>\n\t\t<p>dolce ch&rsquo;io vidi prima a pi&egrave; del monte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Le braccia aperse, dopo alcun consiglio</p>\n\t\t<p>eletto seco riguardando prima</p>\n\t\t<p>ben la ruina, e diedemi di piglio.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E come quei ch&rsquo;adopera ed estima,</p>\n\t\t<p>che sempre par che &rsquo;nnanzi si proveggia,</p>\n\t\t<p>cos&igrave;, levando me s&ugrave; ver&rsquo; la cima</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>d&rsquo;un ronchione, avvisava un&rsquo;altra scheggia</p>\n\t\t<p>dicendo: &laquo;Sovra quella poi t&rsquo;aggrappa;</p>\n\t\t<p>ma tenta pria s&rsquo;&egrave; tal ch&rsquo;ella ti reggia&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non era via da vestito di cappa,</p>\n\t\t<p>ch&eacute; noi a pena, ei lieve e io sospinto,</p>\n\t\t<p>potavam s&ugrave; montar di chiappa in chiappa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E se non fosse che da quel precinto</p>\n\t\t<p>pi&ugrave; che da l&rsquo;altro era la costa corta,</p>\n\t\t<p>non so di lui, ma io sarei ben vinto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma perch&eacute; Malebolge inver&rsquo; la porta</p>\n\t\t<p>del bassissimo pozzo tutta pende,</p>\n\t\t<p>lo sito di ciascuna valle porta</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che l&rsquo;una costa surge e l&rsquo;altra scende;</p>\n\t\t<p>noi pur venimmo al fine in su la punta</p>\n\t\t<p>onde l&rsquo;ultima pietra si scoscende.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>La lena m&rsquo;era del polmon s&igrave; munta</p>\n\t\t<p>quand&rsquo; io fui s&ugrave;, ch&rsquo;i&rsquo; non potea pi&ugrave; oltre,</p>\n\t\t<p>anzi m&rsquo;assisi ne la prima giunta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Omai convien che tu cos&igrave; ti spoltre&raquo;,</p>\n\t\t<p>disse &rsquo;l maestro; &laquo;ch&eacute;, seggendo in piuma,</p>\n\t\t<p>in fama non si vien, n&eacute; sotto coltre;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>sanza la qual chi sua vita consuma,</p>\n\t\t<p>cotal vestigio in terra di s&eacute; lascia,</p>\n\t\t<p>qual fummo in aere e in acqua la schiuma.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E per&ograve; leva s&ugrave;; vinci l&rsquo;ambascia</p>\n\t\t<p>con l&rsquo;animo che vince ogne battaglia,</p>\n\t\t<p>se col suo grave corpo non s&rsquo;accascia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Pi&ugrave; lunga scala convien che si saglia;</p>\n\t\t<p>non basta da costoro esser partito.</p>\n\t\t<p>Se tu mi &rsquo;ntendi, or fa s&igrave; che ti vaglia&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Leva&rsquo;mi allor, mostrandomi fornito</p>\n\t\t<p>meglio di lena ch&rsquo;i&rsquo; non mi sentia,</p>\n\t\t<p>e dissi: &laquo;Va, ch&rsquo;i&rsquo; son forte e ardito&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Su per lo scoglio prendemmo la via,</p>\n\t\t<p>ch&rsquo;era ronchioso, stretto e malagevole,</p>\n\t\t<p>ed erto pi&ugrave; assai che quel di pria.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Parlando andava per non parer fievole;</p>\n\t\t<p>onde una voce usc&igrave; de l&rsquo;altro fosso,</p>\n\t\t<p>a parole formar disconvenevole.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non so che disse, ancor che sovra &rsquo;l dosso</p>\n\t\t<p>fossi de l&rsquo;arco gi&agrave; che varca quivi;</p>\n\t\t<p>ma chi parlava ad ire parea mosso.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io era v&ograve;lto in gi&ugrave;, ma li occhi vivi</p>\n\t\t<p>non poteano ire al fondo per lo scuro;</p>\n\t\t<p>per ch&rsquo;io: &laquo;Maestro, fa che tu arrivi</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>da l&rsquo;altro cinghio e dismontiam lo muro;</p>\n\t\t<p>ch&eacute;, com&rsquo; i&rsquo; odo quinci e non intendo,</p>\n\t\t<p>cos&igrave; gi&ugrave; veggio e neente affiguro&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Altra risposta&raquo;, disse, &laquo;non ti rendo</p>\n\t\t<p>se non lo far; ch&eacute; la dimanda onesta</p>\n\t\t<p>si de&rsquo; seguir con l&rsquo;opera tacendo&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Noi discendemmo il ponte da la testa</p>\n\t\t<p>dove s&rsquo;aggiugne con l&rsquo;ottava ripa,</p>\n\t\t<p>e poi mi fu la bolgia manifesta:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e vidivi entro terribile stipa</p>\n\t\t<p>di serpenti, e di s&igrave; diversa mena</p>\n\t\t<p>che la memoria il sangue ancor mi scipa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Pi&ugrave; non si vanti Libia con sua rena;</p>\n\t\t<p>ch&eacute; se chelidri, iaculi e faree</p>\n\t\t<p>produce, e cencri con anfisibena,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>n&eacute; tante pestilenzie n&eacute; s&igrave; ree</p>\n\t\t<p>mostr&ograve; gi&agrave; mai con tutta l&rsquo;Et&iuml;opia</p>\n\t\t<p>n&eacute; con ci&ograve; che di sopra al Mar Rosso &egrave;e.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tra questa cruda e tristissima copia</p>\n\t\t<p>corr\xEBan genti nude e spaventate,</p>\n\t\t<p>sanza sperar pertugio o elitropia:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>con serpi le man dietro avean legate;</p>\n\t\t<p>quelle ficcavan per le ren la coda</p>\n\t\t<p>e &rsquo;l capo, ed eran dinanzi aggroppate.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed ecco a un ch&rsquo;era da nostra proda,</p>\n\t\t<p>s&rsquo;avvent&ograve; un serpente che &rsquo;l trafisse</p>\n\t\t<p>l&agrave; dove &rsquo;l collo a le spalle s&rsquo;annoda.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>N&eacute; O s&igrave; tosto mai n&eacute; I si scrisse,</p>\n\t\t<p>com&rsquo; el s&rsquo;accese e arse, e cener tutto</p>\n\t\t<p>convenne che cascando divenisse;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e poi che fu a terra s&igrave; distrutto,</p>\n\t\t<p>la polver si raccolse per s&eacute; stessa</p>\n\t\t<p>e &rsquo;n quel medesmo ritorn&ograve; di butto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; per li gran savi si confessa</p>\n\t\t<p>che la fenice more e poi rinasce,</p>\n\t\t<p>quando al cinquecentesimo anno appressa;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>erba n&eacute; biado in sua vita non pasce,</p>\n\t\t<p>ma sol d&rsquo;incenso lagrime e d&rsquo;amomo,</p>\n\t\t<p>e nardo e mirra son l&rsquo;ultime fasce.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E qual &egrave; quel che cade, e non sa como,</p>\n\t\t<p>per forza di demon ch&rsquo;a terra il tira,</p>\n\t\t<p>o d&rsquo;altra oppilazion che lega l&rsquo;omo,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>quando si leva, che &rsquo;ntorno si mira</p>\n\t\t<p>tutto smarrito de la grande angoscia</p>\n\t\t<p>ch&rsquo;elli ha sofferta, e guardando sospira:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>tal era &rsquo;l peccator levato poscia.</p>\n\t\t<p>Oh potenza di Dio, quant&rsquo; &egrave; severa,</p>\n\t\t<p>che cotai colpi per vendetta croscia!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo duca il domand&ograve; poi chi ello era;</p>\n\t\t<p>per ch&rsquo;ei rispuose: &laquo;Io piovvi di Toscana,</p>\n\t\t<p>poco tempo &egrave;, in questa gola fiera.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Vita bestial mi piacque e non umana,</p>\n\t\t<p>s&igrave; come a mul ch&rsquo;i&rsquo; fui; son Vanni Fucci</p>\n\t\t<p>bestia, e Pistoia mi fu degna tana&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E &iuml;o al duca: &laquo;Dilli che non mucci,</p>\n\t\t<p>e domanda che colpa qua gi&ugrave; &rsquo;l pinse;</p>\n\t\t<p>ch&rsquo;io &rsquo;l vidi uomo di sangue e di crucci&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E &rsquo;l peccator, che &rsquo;ntese, non s&rsquo;infinse,</p>\n\t\t<p>ma drizz&ograve; verso me l&rsquo;animo e &rsquo;l volto,</p>\n\t\t<p>e di trista vergogna si dipinse;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>poi disse: &laquo;Pi&ugrave; mi duol che tu m&rsquo;hai colto</p>\n\t\t<p>ne la miseria dove tu mi vedi,</p>\n\t\t<p>che quando fui de l&rsquo;altra vita tolto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io non posso negar quel che tu chiedi;</p>\n\t\t<p>in gi&ugrave; son messo tanto perch&rsquo; io fui</p>\n\t\t<p>ladro a la sagrestia d&rsquo;i belli arredi,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e falsamente gi&agrave; fu apposto altrui.</p>\n\t\t<p>Ma perch&eacute; di tal vista tu non godi,</p>\n\t\t<p>se mai sarai di fuor da&rsquo; luoghi bui,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>apri li orecchi al mio annunzio, e odi.</p>\n\t\t<p>Pistoia in pria d&rsquo;i Neri si dimagra;</p>\n\t\t<p>poi Fiorenza rinova gente e modi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tragge Marte vapor di Val di Magra</p>\n\t\t<p>ch&rsquo;&egrave; di torbidi nuvoli involuto;</p>\n\t\t<p>e con tempesta impet&uuml;osa e agra</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>sovra Campo Picen fia combattuto;</p>\n\t\t<p>ond&rsquo; ei repente spezzer&agrave; la nebbia,</p>\n\t\t<p>s&igrave; ch&rsquo;ogne Bianco ne sar&agrave; feruto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E detto l&rsquo;ho perch&eacute; doler ti debbia!&raquo;.</p>\n\t\t</div>','<p class="cantohead">25</p>\n\t\t<div class="stanza">\n\t\t\t<p>Al fine de le sue parole il ladro</p>\n\t\t<p>le mani alz&ograve; con amendue le fiche,</p>\n\t\t<p>gridando: &laquo;Togli, Dio, ch&rsquo;a te le squadro!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Da indi in qua mi fuor le serpi amiche,</p>\n\t\t<p>perch&rsquo; una li s&rsquo;avvolse allora al collo,</p>\n\t\t<p>come dicesse \u2018Non vo&rsquo; che pi&ugrave; diche&rsquo;;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e un&rsquo;altra a le braccia, e rilegollo,</p>\n\t\t<p>ribadendo s&eacute; stessa s&igrave; dinanzi,</p>\n\t\t<p>che non potea con esse dare un crollo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ahi Pistoia, Pistoia, ch&eacute; non stanzi</p>\n\t\t<p>d&rsquo;incenerarti s&igrave; che pi&ugrave; non duri,</p>\n\t\t<p>poi che &rsquo;n mal fare il seme tuo avanzi?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per tutt&rsquo; i cerchi de lo &rsquo;nferno scuri</p>\n\t\t<p>non vidi spirto in Dio tanto superbo,</p>\n\t\t<p>non quel che cadde a Tebe gi&ugrave; da&rsquo; muri.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>El si fugg&igrave; che non parl&ograve; pi&ugrave; verbo;</p>\n\t\t<p>e io vidi un centauro pien di rabbia</p>\n\t\t<p>venir chiamando: &laquo;Ov&rsquo; &egrave;, ov&rsquo; &egrave; l&rsquo;acerbo?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Maremma non cred&rsquo; io che tante n&rsquo;abbia,</p>\n\t\t<p>quante bisce elli avea su per la groppa</p>\n\t\t<p>infin ove comincia nostra labbia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Sovra le spalle, dietro da la coppa,</p>\n\t\t<p>con l&rsquo;ali aperte li giacea un draco;</p>\n\t\t<p>e quello affuoca qualunque s&rsquo;intoppa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo mio maestro disse: &laquo;Questi &egrave; Caco,</p>\n\t\t<p>che, sotto &rsquo;l sasso di monte Aventino,</p>\n\t\t<p>di sangue fece spesse volte laco.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non va co&rsquo; suoi fratei per un cammino,</p>\n\t\t<p>per lo furto che frodolente fece</p>\n\t\t<p>del grande armento ch&rsquo;elli ebbe a vicino;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>onde cessar le sue opere biece</p>\n\t\t<p>sotto la mazza d&rsquo;Ercule, che forse</p>\n\t\t<p>gliene di&egrave; cento, e non sent&igrave; le diece&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Mentre che s&igrave; parlava, ed el trascorse,</p>\n\t\t<p>e tre spiriti venner sotto noi,</p>\n\t\t<p>de&rsquo; quai n&eacute; io n&eacute; &rsquo;l duca mio s&rsquo;accorse,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>se non quando gridar: &laquo;Chi siete voi?&raquo;;</p>\n\t\t<p>per che nostra novella si ristette,</p>\n\t\t<p>e intendemmo pur ad essi poi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io non li conoscea; ma ei seguette,</p>\n\t\t<p>come suol seguitar per alcun caso,</p>\n\t\t<p>che l&rsquo;un nomar un altro convenette,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>dicendo: &laquo;Cianfa dove fia rimaso?&raquo;;</p>\n\t\t<p>per ch&rsquo;io, acci&ograve; che &rsquo;l duca stesse attento,</p>\n\t\t<p>mi puosi &rsquo;l dito su dal mento al naso.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Se tu se&rsquo; or, lettore, a creder lento</p>\n\t\t<p>ci&ograve; ch&rsquo;io dir&ograve;, non sar&agrave; maraviglia,</p>\n\t\t<p>ch&eacute; io che &rsquo;l vidi, a pena il mi consento.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Com&rsquo; io tenea levate in lor le ciglia,</p>\n\t\t<p>e un serpente con sei pi&egrave; si lancia</p>\n\t\t<p>dinanzi a l&rsquo;uno, e tutto a lui s&rsquo;appiglia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Co&rsquo; pi&egrave; di mezzo li avvinse la pancia</p>\n\t\t<p>e con li anter&iuml;or le braccia prese;</p>\n\t\t<p>poi li addent&ograve; e l&rsquo;una e l&rsquo;altra guancia;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>li diretani a le cosce distese,</p>\n\t\t<p>e miseli la coda tra &rsquo;mbedue</p>\n\t\t<p>e dietro per le ren s&ugrave; la ritese.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ellera abbarbicata mai non fue</p>\n\t\t<p>ad alber s&igrave;, come l&rsquo;orribil fiera</p>\n\t\t<p>per l&rsquo;altrui membra avviticchi&ograve; le sue.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi s&rsquo;appiccar, come di calda cera</p>\n\t\t<p>fossero stati, e mischiar lor colore,</p>\n\t\t<p>n&eacute; l&rsquo;un n&eacute; l&rsquo;altro gi&agrave; parea quel ch&rsquo;era:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>come procede innanzi da l&rsquo;ardore,</p>\n\t\t<p>per lo papiro suso, un color bruno</p>\n\t\t<p>che non &egrave; nero ancora e &rsquo;l bianco more.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Li altri due &rsquo;l riguardavano, e ciascuno</p>\n\t\t<p>gridava: &laquo;Om&egrave;, Agnel, come ti muti!</p>\n\t\t<p>Vedi che gi&agrave; non se&rsquo; n&eacute; due n&eacute; uno&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Gi&agrave; eran li due capi un divenuti,</p>\n\t\t<p>quando n&rsquo;apparver due figure miste</p>\n\t\t<p>in una faccia, ov&rsquo; eran due perduti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Fersi le braccia due di quattro liste;</p>\n\t\t<p>le cosce con le gambe e &rsquo;l ventre e &rsquo;l casso</p>\n\t\t<p>divenner membra che non fuor mai viste.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ogne primaio aspetto ivi era casso:</p>\n\t\t<p>due e nessun l&rsquo;imagine perversa</p>\n\t\t<p>parea; e tal sen gio con lento passo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Come &rsquo;l ramarro sotto la gran fersa</p>\n\t\t<p>dei d&igrave; canicular, cangiando sepe,</p>\n\t\t<p>folgore par se la via attraversa,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>s&igrave; pareva, venendo verso l&rsquo;epe</p>\n\t\t<p>de li altri due, un serpentello acceso,</p>\n\t\t<p>livido e nero come gran di pepe;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e quella parte onde prima &egrave; preso</p>\n\t\t<p>nostro alimento, a l&rsquo;un di lor trafisse;</p>\n\t\t<p>poi cadde giuso innanzi lui disteso.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo trafitto &rsquo;l mir&ograve;, ma nulla disse;</p>\n\t\t<p>anzi, co&rsquo; pi&egrave; fermati, sbadigliava</p>\n\t\t<p>pur come sonno o febbre l&rsquo;assalisse.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Elli &rsquo;l serpente e quei lui riguardava;</p>\n\t\t<p>l&rsquo;un per la piaga e l&rsquo;altro per la bocca</p>\n\t\t<p>fummavan forte, e &rsquo;l fummo si scontrava.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Taccia Lucano ormai l&agrave; dov&rsquo; e&rsquo; tocca</p>\n\t\t<p>del misero Sabello e di Nasidio,</p>\n\t\t<p>e attenda a udir quel ch&rsquo;or si scocca.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Taccia di Cadmo e d&rsquo;Aretusa Ovidio,</p>\n\t\t<p>ch&eacute; se quello in serpente e quella in fonte</p>\n\t\t<p>converte poetando, io non lo &rsquo;nvidio;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&eacute; due nature mai a fronte a fronte</p>\n\t\t<p>non trasmut&ograve; s&igrave; ch&rsquo;amendue le forme</p>\n\t\t<p>a cambiar lor matera fosser pronte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Insieme si rispuosero a tai norme,</p>\n\t\t<p>che &rsquo;l serpente la coda in forca fesse,</p>\n\t\t<p>e &rsquo;l feruto ristrinse insieme l&rsquo;orme.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Le gambe con le cosce seco stesse</p>\n\t\t<p>s&rsquo;appiccar s&igrave;, che &rsquo;n poco la giuntura</p>\n\t\t<p>non facea segno alcun che si paresse.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Togliea la coda fessa la figura</p>\n\t\t<p>che si perdeva l&agrave;, e la sua pelle</p>\n\t\t<p>si facea molle, e quella di l&agrave; dura.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io vidi intrar le braccia per l&rsquo;ascelle,</p>\n\t\t<p>e i due pi&egrave; de la fiera, ch&rsquo;eran corti,</p>\n\t\t<p>tanto allungar quanto accorciavan quelle.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poscia li pi&egrave; di rietro, insieme attorti,</p>\n\t\t<p>diventaron lo membro che l&rsquo;uom cela,</p>\n\t\t<p>e &rsquo;l misero del suo n&rsquo;avea due porti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Mentre che &rsquo;l fummo l&rsquo;uno e l&rsquo;altro vela</p>\n\t\t<p>di color novo, e genera &rsquo;l pel suso</p>\n\t\t<p>per l&rsquo;una parte e da l&rsquo;altra il dipela,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>l&rsquo;un si lev&ograve; e l&rsquo;altro cadde giuso,</p>\n\t\t<p>non torcendo per&ograve; le lucerne empie,</p>\n\t\t<p>sotto le quai ciascun cambiava muso.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quel ch&rsquo;era dritto, il trasse ver&rsquo; le tempie,</p>\n\t\t<p>e di troppa matera ch&rsquo;in l&agrave; venne</p>\n\t\t<p>uscir li orecchi de le gote scempie;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ci&ograve; che non corse in dietro e si ritenne</p>\n\t\t<p>di quel soverchio, f&eacute; naso a la faccia</p>\n\t\t<p>e le labbra ingross&ograve; quanto convenne.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quel che giac\xEBa, il muso innanzi caccia,</p>\n\t\t<p>e li orecchi ritira per la testa</p>\n\t\t<p>come face le corna la lumaccia;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e la lingua, ch&rsquo;av\xEBa unita e presta</p>\n\t\t<p>prima a parlar, si fende, e la forcuta</p>\n\t\t<p>ne l&rsquo;altro si richiude; e &rsquo;l fummo resta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>L&rsquo;anima ch&rsquo;era fiera divenuta,</p>\n\t\t<p>suffolando si fugge per la valle,</p>\n\t\t<p>e l&rsquo;altro dietro a lui parlando sputa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poscia li volse le novelle spalle,</p>\n\t\t<p>e disse a l&rsquo;altro: &laquo;I&rsquo; vo&rsquo; che Buoso corra,</p>\n\t\t<p>com&rsquo; ho fatt&rsquo; io, carpon per questo calle&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; vid&rsquo; io la settima zavorra</p>\n\t\t<p>mutare e trasmutare; e qui mi scusi</p>\n\t\t<p>la novit&agrave; se fior la penna abborra.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E avvegna che li occhi miei confusi</p>\n\t\t<p>fossero alquanto e l&rsquo;animo smagato,</p>\n\t\t<p>non poter quei fuggirsi tanto chiusi,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&rsquo;i&rsquo; non scorgessi ben Puccio Sciancato;</p>\n\t\t<p>ed era quel che sol, di tre compagni</p>\n\t\t<p>che venner prima, non era mutato;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>l&rsquo;altr&rsquo; era quel che tu, Gaville, piagni.</p>\n\t\t</div>','<p class="cantohead">26</p>\n\t\t<div class="stanza">\n\t\t\t<p>Godi, Fiorenza, poi che se&rsquo; s&igrave; grande</p>\n\t\t<p>che per mare e per terra batti l&rsquo;ali,</p>\n\t\t<p>e per lo &rsquo;nferno tuo nome si spande!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tra li ladron trovai cinque cotali</p>\n\t\t<p>tuoi cittadini onde mi ven vergogna,</p>\n\t\t<p>e tu in grande orranza non ne sali.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma se presso al mattin del ver si sogna,</p>\n\t\t<p>tu sentirai, di qua da picciol tempo,</p>\n\t\t<p>di quel che Prato, non ch&rsquo;altri, t&rsquo;agogna.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E se gi&agrave; fosse, non saria per tempo.</p>\n\t\t<p>Cos&igrave; foss&rsquo; ei, da che pur esser dee!</p>\n\t\t<p>ch&eacute; pi&ugrave; mi graver&agrave;, com&rsquo; pi&ugrave; m&rsquo;attempo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Noi ci partimmo, e su per le scalee</p>\n\t\t<p>che n&rsquo;avea fatto iborni a scender pria,</p>\n\t\t<p>rimont&ograve; &rsquo;l duca mio e trasse mee;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e proseguendo la solinga via,</p>\n\t\t<p>tra le schegge e tra &rsquo; rocchi de lo scoglio</p>\n\t\t<p>lo pi&egrave; sanza la man non si spedia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor mi dolsi, e ora mi ridoglio</p>\n\t\t<p>quando drizzo la mente a ci&ograve; ch&rsquo;io vidi,</p>\n\t\t<p>e pi&ugrave; lo &rsquo;ngegno affreno ch&rsquo;i&rsquo; non soglio,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>perch&eacute; non corra che virt&ugrave; nol guidi;</p>\n\t\t<p>s&igrave; che, se stella bona o miglior cosa</p>\n\t\t<p>m&rsquo;ha dato &rsquo;l ben, ch&rsquo;io stessi nol m&rsquo;invidi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quante &rsquo;l villan ch&rsquo;al poggio si riposa,</p>\n\t\t<p>nel tempo che colui che &rsquo;l mondo schiara</p>\n\t\t<p>la faccia sua a noi tien meno ascosa,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>come la mosca cede a la zanzara,</p>\n\t\t<p>vede lucciole gi&ugrave; per la vallea,</p>\n\t\t<p>forse col&agrave; dov&rsquo; e&rsquo; vendemmia e ara:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>di tante fiamme tutta risplendea</p>\n\t\t<p>l&rsquo;ottava bolgia, s&igrave; com&rsquo; io m&rsquo;accorsi</p>\n\t\t<p>tosto che fui l&agrave; &rsquo;ve &rsquo;l fondo parea.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E qual colui che si vengi&ograve; con li orsi</p>\n\t\t<p>vide &rsquo;l carro d&rsquo;Elia al dipartire,</p>\n\t\t<p>quando i cavalli al cielo erti levorsi,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che nol potea s&igrave; con li occhi seguire,</p>\n\t\t<p>ch&rsquo;el vedesse altro che la fiamma sola,</p>\n\t\t<p>s&igrave; come nuvoletta, in s&ugrave; salire:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>tal si move ciascuna per la gola</p>\n\t\t<p>del fosso, ch&eacute; nessuna mostra &rsquo;l furto,</p>\n\t\t<p>e ogne fiamma un peccatore invola.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io stava sovra &rsquo;l ponte a veder surto,</p>\n\t\t<p>s&igrave; che s&rsquo;io non avessi un ronchion preso,</p>\n\t\t<p>caduto sarei gi&ugrave; sanz&rsquo; esser urto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E &rsquo;l duca che mi vide tanto atteso,</p>\n\t\t<p>disse: &laquo;Dentro dai fuochi son li spirti;</p>\n\t\t<p>catun si fascia di quel ch&rsquo;elli &egrave; inceso&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Maestro mio&raquo;, rispuos&rsquo; io, &laquo;per udirti</p>\n\t\t<p>son io pi&ugrave; certo; ma gi&agrave; m&rsquo;era avviso</p>\n\t\t<p>che cos&igrave; fosse, e gi&agrave; voleva dirti:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>chi &egrave; &rsquo;n quel foco che vien s&igrave; diviso</p>\n\t\t<p>di sopra, che par surger de la pira</p>\n\t\t<p>dov&rsquo; Ete&ograve;cle col fratel fu miso?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Rispuose a me: &laquo;L&agrave; dentro si martira</p>\n\t\t<p>Ulisse e D&iuml;omede, e cos&igrave; insieme</p>\n\t\t<p>a la vendetta vanno come a l&rsquo;ira;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e dentro da la lor fiamma si geme</p>\n\t\t<p>l&rsquo;agguato del caval che f&eacute; la porta</p>\n\t\t<p>onde usc&igrave; de&rsquo; Romani il gentil seme.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Piangevisi entro l&rsquo;arte per che, morta,</p>\n\t\t<p>De&iuml;dam&igrave;a ancor si duol d&rsquo;Achille,</p>\n\t\t<p>e del Palladio pena vi si porta&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;S&rsquo;ei posson dentro da quelle faville</p>\n\t\t<p>parlar&raquo;, diss&rsquo; io, &laquo;maestro, assai ten priego</p>\n\t\t<p>e ripriego, che &rsquo;l priego vaglia mille,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che non mi facci de l&rsquo;attender niego</p>\n\t\t<p>fin che la fiamma cornuta qua vegna;</p>\n\t\t<p>vedi che del disio ver&rsquo; lei mi piego!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;La tua preghiera &egrave; degna</p>\n\t\t<p>di molta loda, e io per&ograve; l&rsquo;accetto;</p>\n\t\t<p>ma fa che la tua lingua si sostegna.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lascia parlare a me, ch&rsquo;i&rsquo; ho concetto</p>\n\t\t<p>ci&ograve; che tu vuoi; ch&rsquo;ei sarebbero schivi,</p>\n\t\t<p>perch&rsquo; e&rsquo; fuor greci, forse del tuo detto&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi che la fiamma fu venuta quivi</p>\n\t\t<p>dove parve al mio duca tempo e loco,</p>\n\t\t<p>in questa forma lui parlare audivi:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;O voi che siete due dentro ad un foco,</p>\n\t\t<p>s&rsquo;io meritai di voi mentre ch&rsquo;io vissi,</p>\n\t\t<p>s&rsquo;io meritai di voi assai o poco</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>quando nel mondo li alti versi scrissi,</p>\n\t\t<p>non vi movete; ma l&rsquo;un di voi dica</p>\n\t\t<p>dove, per lui, perduto a morir gissi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo maggior corno de la fiamma antica</p>\n\t\t<p>cominci&ograve; a crollarsi mormorando,</p>\n\t\t<p>pur come quella cui vento affatica;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>indi la cima qua e l&agrave; menando,</p>\n\t\t<p>come fosse la lingua che parlasse,</p>\n\t\t<p>gitt&ograve; voce di fuori e disse: &laquo;Quando</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>mi diparti&rsquo; da Circe, che sottrasse</p>\n\t\t<p>me pi&ugrave; d&rsquo;un anno l&agrave; presso a Gaeta,</p>\n\t\t<p>prima che s&igrave; En\xEBa la nomasse,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>n&eacute; dolcezza di figlio, n&eacute; la pieta</p>\n\t\t<p>del vecchio padre, n&eacute; &rsquo;l debito amore</p>\n\t\t<p>lo qual dovea Penelop&egrave; far lieta,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>vincer potero dentro a me l&rsquo;ardore</p>\n\t\t<p>ch&rsquo;i&rsquo; ebbi a divenir del mondo esperto</p>\n\t\t<p>e de li vizi umani e del valore;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ma misi me per l&rsquo;alto mare aperto</p>\n\t\t<p>sol con un legno e con quella compagna</p>\n\t\t<p>picciola da la qual non fui diserto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>L&rsquo;un lito e l&rsquo;altro vidi infin la Spagna,</p>\n\t\t<p>fin nel Morrocco, e l&rsquo;isola d&rsquo;i Sardi,</p>\n\t\t<p>e l&rsquo;altre che quel mare intorno bagna.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io e &rsquo; compagni eravam vecchi e tardi</p>\n\t\t<p>quando venimmo a quella foce stretta</p>\n\t\t<p>dov&rsquo; Ercule segn&ograve; li suoi riguardi</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>acci&ograve; che l&rsquo;uom pi&ugrave; oltre non si metta;</p>\n\t\t<p>da la man destra mi lasciai Sibilia,</p>\n\t\t<p>da l&rsquo;altra gi&agrave; m&rsquo;avea lasciata Setta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>\u201CO frati\u201D, dissi \u201Cche per cento milia</p>\n\t\t<p>perigli siete giunti a l&rsquo;occidente,</p>\n\t\t<p>a questa tanto picciola vigilia</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>d&rsquo;i nostri sensi ch&rsquo;&egrave; del rimanente</p>\n\t\t<p>non vogliate negar l&rsquo;esper&iuml;enza,</p>\n\t\t<p>di retro al sol, del mondo sanza gente.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Considerate la vostra semenza:</p>\n\t\t<p>fatti non foste a viver come bruti,</p>\n\t\t<p>ma per seguir virtute e canoscenza\u201D.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Li miei compagni fec&rsquo; io s&igrave; aguti,</p>\n\t\t<p>con questa orazion picciola, al cammino,</p>\n\t\t<p>che a pena poscia li avrei ritenuti;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e volta nostra poppa nel mattino,</p>\n\t\t<p>de&rsquo; remi facemmo ali al folle volo,</p>\n\t\t<p>sempre acquistando dal lato mancino.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tutte le stelle gi&agrave; de l&rsquo;altro polo</p>\n\t\t<p>vedea la notte, e &rsquo;l nostro tanto basso,</p>\n\t\t<p>che non surg\xEBa fuor del marin suolo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cinque volte racceso e tante casso</p>\n\t\t<p>lo lume era di sotto da la luna,</p>\n\t\t<p>poi che &rsquo;ntrati eravam ne l&rsquo;alto passo,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>quando n&rsquo;apparve una montagna, bruna</p>\n\t\t<p>per la distanza, e parvemi alta tanto</p>\n\t\t<p>quanto veduta non av\xEBa alcuna.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Noi ci allegrammo, e tosto torn&ograve; in pianto;</p>\n\t\t<p>ch&eacute; de la nova terra un turbo nacque</p>\n\t\t<p>e percosse del legno il primo canto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tre volte il f&eacute; girar con tutte l&rsquo;acque;</p>\n\t\t<p>a la quarta levar la poppa in suso</p>\n\t\t<p>e la prora ire in gi&ugrave;, com&rsquo; altrui piacque,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>infin che &rsquo;l mar fu sovra noi richiuso&raquo;.</p>\n\t\t</div>','<p class="cantohead">27</p>\n\t\t<div class="stanza">\n\t\t\t<p>Gi&agrave; era dritta in s&ugrave; la fiamma e queta</p>\n\t\t<p>per non dir pi&ugrave;, e gi&agrave; da noi sen gia</p>\n\t\t<p>con la licenza del dolce poeta,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>quand&rsquo; un&rsquo;altra, che dietro a lei ven&igrave;a,</p>\n\t\t<p>ne fece volger li occhi a la sua cima</p>\n\t\t<p>per un confuso suon che fuor n&rsquo;uscia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Come &rsquo;l bue cicilian che mugghi&ograve; prima</p>\n\t\t<p>col pianto di colui, e ci&ograve; fu dritto,</p>\n\t\t<p>che l&rsquo;avea temperato con sua lima,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>mugghiava con la voce de l&rsquo;afflitto,</p>\n\t\t<p>s&igrave; che, con tutto che fosse di rame,</p>\n\t\t<p>pur el pareva dal dolor trafitto;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>cos&igrave;, per non aver via n&eacute; forame</p>\n\t\t<p>dal principio nel foco, in suo linguaggio</p>\n\t\t<p>si convert&iuml;an le parole grame.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma poscia ch&rsquo;ebber colto lor v&iuml;aggio</p>\n\t\t<p>su per la punta, dandole quel guizzo</p>\n\t\t<p>che dato avea la lingua in lor passaggio,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>udimmo dire: &laquo;O tu a cu&rsquo; io drizzo</p>\n\t\t<p>la voce e che parlavi mo lombardo,</p>\n\t\t<p>dicendo \u201CIstra ten va, pi&ugrave; non t&rsquo;adizzo\u201D,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>perch&rsquo; io sia giunto forse alquanto tardo,</p>\n\t\t<p>non t&rsquo;incresca restare a parlar meco;</p>\n\t\t<p>vedi che non incresce a me, e ardo!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Se tu pur mo in questo mondo cieco</p>\n\t\t<p>caduto se&rsquo; di quella dolce terra</p>\n\t\t<p>latina ond&rsquo; io mia colpa tutta reco,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>dimmi se Romagnuoli han pace o guerra;</p>\n\t\t<p>ch&rsquo;io fui d&rsquo;i monti l&agrave; intra Orbino</p>\n\t\t<p>e &rsquo;l giogo di che Tever si diserra&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io era in giuso ancora attento e chino,</p>\n\t\t<p>quando il mio duca mi tent&ograve; di costa,</p>\n\t\t<p>dicendo: &laquo;Parla tu; questi &egrave; latino&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io, ch&rsquo;avea gi&agrave; pronta la risposta,</p>\n\t\t<p>sanza indugio a parlare incominciai:</p>\n\t\t<p>&laquo;O anima che se&rsquo; l&agrave; gi&ugrave; nascosta,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Romagna tua non &egrave;, e non fu mai,</p>\n\t\t<p>sanza guerra ne&rsquo; cuor de&rsquo; suoi tiranni;</p>\n\t\t<p>ma &rsquo;n palese nessuna or vi lasciai.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ravenna sta come stata &egrave; molt&rsquo; anni:</p>\n\t\t<p>l&rsquo;aguglia da Polenta la si cova,</p>\n\t\t<p>s&igrave; che Cervia ricuopre co&rsquo; suoi vanni.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>La terra che f&eacute; gi&agrave; la lunga prova</p>\n\t\t<p>e di Franceschi sanguinoso mucchio,</p>\n\t\t<p>sotto le branche verdi si ritrova.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E &rsquo;l mastin vecchio e &rsquo;l nuovo da Verrucchio,</p>\n\t\t<p>che fecer di Montagna il mal governo,</p>\n\t\t<p>l&agrave; dove soglion fan d&rsquo;i denti succhio.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Le citt&agrave; di Lamone e di Santerno</p>\n\t\t<p>conduce il l&iuml;oncel dal nido bianco,</p>\n\t\t<p>che muta parte da la state al verno.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quella cu&rsquo; il Savio bagna il fianco,</p>\n\t\t<p>cos&igrave; com&rsquo; ella sie&rsquo; tra &rsquo;l piano e &rsquo;l monte,</p>\n\t\t<p>tra tirannia si vive e stato franco.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ora chi se&rsquo;, ti priego che ne conte;</p>\n\t\t<p>non esser duro pi&ugrave; ch&rsquo;altri sia stato,</p>\n\t\t<p>se &rsquo;l nome tuo nel mondo tegna fronte&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poscia che &rsquo;l foco alquanto ebbe rugghiato</p>\n\t\t<p>al modo suo, l&rsquo;aguta punta mosse</p>\n\t\t<p>di qua, di l&agrave;, e poi di&egrave; cotal fiato:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;S&rsquo;i&rsquo; credesse che mia risposta fosse</p>\n\t\t<p>a persona che mai tornasse al mondo,</p>\n\t\t<p>questa fiamma staria sanza pi&ugrave; scosse;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ma per&ograve; che gi&agrave; mai di questo fondo</p>\n\t\t<p>non torn&ograve; vivo alcun, s&rsquo;i&rsquo; odo il vero,</p>\n\t\t<p>sanza tema d&rsquo;infamia ti rispondo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io fui uom d&rsquo;arme, e poi fui cordigliero,</p>\n\t\t<p>credendomi, s&igrave; cinto, fare ammenda;</p>\n\t\t<p>e certo il creder mio ven&igrave;a intero,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>se non fosse il gran prete, a cui mal prenda!,</p>\n\t\t<p>che mi rimise ne le prime colpe;</p>\n\t\t<p>e come e quare, voglio che m&rsquo;intenda.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Mentre ch&rsquo;io forma fui d&rsquo;ossa e di polpe</p>\n\t\t<p>che la madre mi di&egrave;, l&rsquo;opere mie</p>\n\t\t<p>non furon leonine, ma di volpe.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Li accorgimenti e le coperte vie</p>\n\t\t<p>io seppi tutte, e s&igrave; menai lor arte,</p>\n\t\t<p>ch&rsquo;al fine de la terra il suono uscie.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quando mi vidi giunto in quella parte</p>\n\t\t<p>di mia etade ove ciascun dovrebbe</p>\n\t\t<p>calar le vele e raccoglier le sarte,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ci&ograve; che pria mi piac\xEBa, allor m&rsquo;increbbe,</p>\n\t\t<p>e pentuto e confesso mi rendei;</p>\n\t\t<p>ahi miser lasso! e giovato sarebbe.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo principe d&rsquo;i novi Farisei,</p>\n\t\t<p>avendo guerra presso a Laterano,</p>\n\t\t<p>e non con Saracin n&eacute; con Giudei,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&eacute; ciascun suo nimico era cristiano,</p>\n\t\t<p>e nessun era stato a vincer Acri</p>\n\t\t<p>n&eacute; mercatante in terra di Soldano,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>n&eacute; sommo officio n&eacute; ordini sacri</p>\n\t\t<p>guard&ograve; in s&eacute;, n&eacute; in me quel capestro</p>\n\t\t<p>che solea fare i suoi cinti pi&ugrave; macri.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma come Costantin chiese Silvestro</p>\n\t\t<p>d&rsquo;entro Siratti a guerir de la lebbre,</p>\n\t\t<p>cos&igrave; mi chiese questi per maestro</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>a guerir de la sua superba febbre;</p>\n\t\t<p>domandommi consiglio, e io tacetti</p>\n\t\t<p>perch&eacute; le sue parole parver ebbre.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E&rsquo; poi ridisse: \u201CTuo cuor non sospetti;</p>\n\t\t<p>finor t&rsquo;assolvo, e tu m&rsquo;insegna fare</p>\n\t\t<p>s&igrave; come Penestrino in terra getti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo ciel poss&rsquo; io serrare e diserrare,</p>\n\t\t<p>come tu sai; per&ograve; son due le chiavi</p>\n\t\t<p>che &rsquo;l mio antecessor non ebbe care\u201D.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor mi pinser li argomenti gravi</p>\n\t\t<p>l&agrave; &rsquo;ve &rsquo;l tacer mi fu avviso &rsquo;l peggio,</p>\n\t\t<p>e dissi: \u201CPadre, da che tu mi lavi</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>di quel peccato ov&rsquo; io mo cader deggio,</p>\n\t\t<p>lunga promessa con l&rsquo;attender corto</p>\n\t\t<p>ti far&agrave; tr&iuml;unfar ne l&rsquo;alto seggio\u201D.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Francesco venne poi, com&rsquo; io fu&rsquo; morto,</p>\n\t\t<p>per me; ma un d&rsquo;i neri cherubini</p>\n\t\t<p>li disse: \u201CNon portar: non mi far torto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Venir se ne dee gi&ugrave; tra &rsquo; miei meschini</p>\n\t\t<p>perch&eacute; diede &rsquo;l consiglio frodolente,</p>\n\t\t<p>dal quale in qua stato li sono a&rsquo; crini;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&rsquo;assolver non si pu&ograve; chi non si pente,</p>\n\t\t<p>n&eacute; pentere e volere insieme puossi</p>\n\t\t<p>per la contradizion che nol consente\u201D.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Oh me dolente! come mi riscossi</p>\n\t\t<p>quando mi prese dicendomi: \u201CForse</p>\n\t\t<p>tu non pensavi ch&rsquo;io l\xF6ico fossi!\u201D.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>A Min&ograve;s mi port&ograve;; e quelli attorse</p>\n\t\t<p>otto volte la coda al dosso duro;</p>\n\t\t<p>e poi che per gran rabbia la si morse,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>disse: \u201CQuesti &egrave; d&rsquo;i rei del foco furo\u201D;</p>\n\t\t<p>per ch&rsquo;io l&agrave; dove vedi son perduto,</p>\n\t\t<p>e s&igrave; vestito, andando, mi rancuro&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quand&rsquo; elli ebbe &rsquo;l suo dir cos&igrave; compiuto,</p>\n\t\t<p>la fiamma dolorando si partio,</p>\n\t\t<p>torcendo e dibattendo &rsquo;l corno aguto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Noi passamm&rsquo; oltre, e io e &rsquo;l duca mio,</p>\n\t\t<p>su per lo scoglio infino in su l&rsquo;altr&rsquo; arco</p>\n\t\t<p>che cuopre &rsquo;l fosso in che si paga il fio</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>a quei che scommettendo acquistan carco.</p>\n\t\t</div>','<p class="cantohead">28</p>\n\t\t<div class="stanza">\n\t\t\t<p>Chi poria mai pur con parole sciolte</p>\n\t\t<p>dicer del sangue e de le piaghe a pieno</p>\n\t\t<p>ch&rsquo;i&rsquo; ora vidi, per narrar pi&ugrave; volte?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ogne lingua per certo verria meno</p>\n\t\t<p>per lo nostro sermone e per la mente</p>\n\t\t<p>c&rsquo;hanno a tanto comprender poco seno.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>S&rsquo;el s&rsquo;aunasse ancor tutta la gente</p>\n\t\t<p>che gi&agrave;, in su la fortunata terra</p>\n\t\t<p>di Puglia, fu del suo sangue dolente</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>per li Troiani e per la lunga guerra</p>\n\t\t<p>che de l&rsquo;anella f&eacute; s&igrave; alte spoglie,</p>\n\t\t<p>come Liv&iuml;o scrive, che non erra,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>con quella che sentio di colpi doglie</p>\n\t\t<p>per contastare a Ruberto Guiscardo;</p>\n\t\t<p>e l&rsquo;altra il cui ossame ancor s&rsquo;accoglie</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>a Ceperan, l&agrave; dove fu bugiardo</p>\n\t\t<p>ciascun Pugliese, e l&agrave; da Tagliacozzo,</p>\n\t\t<p>dove sanz&rsquo; arme vinse il vecchio Alardo;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e qual forato suo membro e qual mozzo</p>\n\t\t<p>mostrasse, d&rsquo;aequar sarebbe nulla</p>\n\t\t<p>il modo de la nona bolgia sozzo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Gi&agrave; veggia, per mezzul perdere o lulla,</p>\n\t\t<p>com&rsquo; io vidi un, cos&igrave; non si pertugia,</p>\n\t\t<p>rotto dal mento infin dove si trulla.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tra le gambe pendevan le minugia;</p>\n\t\t<p>la corata pareva e &rsquo;l tristo sacco</p>\n\t\t<p>che merda fa di quel che si trangugia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Mentre che tutto in lui veder m&rsquo;attacco,</p>\n\t\t<p>guardommi e con le man s&rsquo;aperse il petto,</p>\n\t\t<p>dicendo: &laquo;Or vedi com&rsquo; io mi dilacco!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>vedi come storpiato &egrave; M\xE4ometto!</p>\n\t\t<p>Dinanzi a me sen va piangendo Al&igrave;,</p>\n\t\t<p>fesso nel volto dal mento al ciuffetto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E tutti li altri che tu vedi qui,</p>\n\t\t<p>seminator di scandalo e di scisma</p>\n\t\t<p>fuor vivi, e per&ograve; son fessi cos&igrave;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Un diavolo &egrave; qua dietro che n&rsquo;accisma</p>\n\t\t<p>s&igrave; crudelmente, al taglio de la spada</p>\n\t\t<p>rimettendo ciascun di questa risma,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>quand&rsquo; avem volta la dolente strada;</p>\n\t\t<p>per&ograve; che le ferite son richiuse</p>\n\t\t<p>prima ch&rsquo;altri dinanzi li rivada.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma tu chi se&rsquo; che &rsquo;n su lo scoglio muse,</p>\n\t\t<p>forse per indugiar d&rsquo;ire a la pena</p>\n\t\t<p>ch&rsquo;&egrave; giudicata in su le tue accuse?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;N&eacute; morte &rsquo;l giunse ancor, n&eacute; colpa &rsquo;l mena&raquo;,</p>\n\t\t<p>rispuose &rsquo;l mio maestro, &laquo;a tormentarlo;</p>\n\t\t<p>ma per dar lui esper&iuml;enza piena,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>a me, che morto son, convien menarlo</p>\n\t\t<p>per lo &rsquo;nferno qua gi&ugrave; di giro in giro;</p>\n\t\t<p>e quest&rsquo; &egrave; ver cos&igrave; com&rsquo; io ti parlo&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Pi&ugrave; fuor di cento che, quando l&rsquo;udiro,</p>\n\t\t<p>s&rsquo;arrestaron nel fosso a riguardarmi</p>\n\t\t<p>per maraviglia, obl&iuml;ando il martiro.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Or d&igrave; a fra Dolcin dunque che s&rsquo;armi,</p>\n\t\t<p>tu che forse vedra&rsquo; il sole in breve,</p>\n\t\t<p>s&rsquo;ello non vuol qui tosto seguitarmi,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>s&igrave; di vivanda, che stretta di neve</p>\n\t\t<p>non rechi la vittoria al Noarese,</p>\n\t\t<p>ch&rsquo;altrimenti acquistar non saria leve&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi che l&rsquo;un pi&egrave; per girsene sospese,</p>\n\t\t<p>M\xE4ometto mi disse esta parola;</p>\n\t\t<p>indi a partirsi in terra lo distese.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Un altro, che forata avea la gola</p>\n\t\t<p>e tronco &rsquo;l naso infin sotto le ciglia,</p>\n\t\t<p>e non avea mai ch&rsquo;una orecchia sola,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ristato a riguardar per maraviglia</p>\n\t\t<p>con li altri, innanzi a li altri apr&igrave; la canna,</p>\n\t\t<p>ch&rsquo;era di fuor d&rsquo;ogne parte vermiglia,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e disse: &laquo;O tu cui colpa non condanna</p>\n\t\t<p>e cu&rsquo; io vidi su in terra latina,</p>\n\t\t<p>se troppa simiglianza non m&rsquo;inganna,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>rimembriti di Pier da Medicina,</p>\n\t\t<p>se mai torni a veder lo dolce piano</p>\n\t\t<p>che da Vercelli a Marcab&ograve; dichina.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E fa saper a&rsquo; due miglior da Fano,</p>\n\t\t<p>a messer Guido e anco ad Angiolello,</p>\n\t\t<p>che, se l&rsquo;antiveder qui non &egrave; vano,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>gittati saran fuor di lor vasello</p>\n\t\t<p>e mazzerati presso a la Cattolica</p>\n\t\t<p>per tradimento d&rsquo;un tiranno fello.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tra l&rsquo;isola di Cipri e di Maiolica</p>\n\t\t<p>non vide mai s&igrave; gran fallo Nettuno,</p>\n\t\t<p>non da pirate, non da gente argolica.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quel traditor che vede pur con l&rsquo;uno,</p>\n\t\t<p>e tien la terra che tale qui meco</p>\n\t\t<p>vorrebbe di vedere esser digiuno,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>far&agrave; venirli a parlamento seco;</p>\n\t\t<p>poi far&agrave; s&igrave;, ch&rsquo;al vento di Focara</p>\n\t\t<p>non sar&agrave; lor mestier voto n&eacute; preco&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io a lui: &laquo;Dimostrami e dichiara,</p>\n\t\t<p>se vuo&rsquo; ch&rsquo;i&rsquo; porti s&ugrave; di te novella,</p>\n\t\t<p>chi &egrave; colui da la veduta amara&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor puose la mano a la mascella</p>\n\t\t<p>d&rsquo;un suo compagno e la bocca li aperse,</p>\n\t\t<p>gridando: &laquo;Questi &egrave; desso, e non favella.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Questi, scacciato, il dubitar sommerse</p>\n\t\t<p>in Cesare, affermando che &rsquo;l fornito</p>\n\t\t<p>sempre con danno l&rsquo;attender sofferse&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Oh quanto mi pareva sbigottito</p>\n\t\t<p>con la lingua tagliata ne la strozza</p>\n\t\t<p>Cur&iuml;o, ch&rsquo;a dir fu cos&igrave; ardito!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E un ch&rsquo;avea l&rsquo;una e l&rsquo;altra man mozza,</p>\n\t\t<p>levando i moncherin per l&rsquo;aura fosca,</p>\n\t\t<p>s&igrave; che &rsquo;l sangue facea la faccia sozza,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>grid&ograve;: &laquo;Ricordera&rsquo;ti anche del Mosca,</p>\n\t\t<p>che disse, lasso!, \u201CCapo ha cosa fatta\u201D,</p>\n\t\t<p>che fu mal seme per la gente tosca&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io li aggiunsi: &laquo;E morte di tua schiatta&raquo;;</p>\n\t\t<p>per ch&rsquo;elli, accumulando duol con duolo,</p>\n\t\t<p>sen gio come persona trista e matta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma io rimasi a riguardar lo stuolo,</p>\n\t\t<p>e vidi cosa ch&rsquo;io avrei paura,</p>\n\t\t<p>sanza pi&ugrave; prova, di contarla solo;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>se non che cosc&iuml;enza m&rsquo;assicura,</p>\n\t\t<p>la buona compagnia che l&rsquo;uom francheggia</p>\n\t\t<p>sotto l&rsquo;asbergo del sentirsi pura.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io vidi certo, e ancor par ch&rsquo;io &rsquo;l veggia,</p>\n\t\t<p>un busto sanza capo andar s&igrave; come</p>\n\t\t<p>andavan li altri de la trista greggia;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e &rsquo;l capo tronco tenea per le chiome,</p>\n\t\t<p>pesol con mano a guisa di lanterna:</p>\n\t\t<p>e quel mirava noi e dicea: &laquo;Oh me!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Di s&eacute; facea a s&eacute; stesso lucerna,</p>\n\t\t<p>ed eran due in uno e uno in due;</p>\n\t\t<p>com&rsquo; esser pu&ograve;, quei sa che s&igrave; governa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quando diritto al pi&egrave; del ponte fue,</p>\n\t\t<p>lev&ograve; &rsquo;l braccio alto con tutta la testa</p>\n\t\t<p>per appressarne le parole sue,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che fuoro: &laquo;Or vedi la pena molesta,</p>\n\t\t<p>tu che, spirando, vai veggendo i morti:</p>\n\t\t<p>vedi s&rsquo;alcuna &egrave; grande come questa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E perch&eacute; tu di me novella porti,</p>\n\t\t<p>sappi ch&rsquo;i&rsquo; son Bertram dal Bornio, quelli</p>\n\t\t<p>che diedi al re giovane i ma&rsquo; conforti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io feci il padre e &rsquo;l figlio in s&eacute; ribelli;</p>\n\t\t<p>Achitof&egrave;l non f&eacute; pi&ugrave; d&rsquo;Absalone</p>\n\t\t<p>e di Dav&igrave;d coi malvagi punzelli.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Perch&rsquo; io parti&rsquo; cos&igrave; giunte persone,</p>\n\t\t<p>partito porto il mio cerebro, lasso!,</p>\n\t\t<p>dal suo principio ch&rsquo;&egrave; in questo troncone.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; s&rsquo;osserva in me lo contrapasso&raquo;.</p>\n\t\t</div>','<p class="cantohead">29</p>\n\t\t<div class="stanza">\n\t\t\t<p>La molta gente e le diverse piaghe</p>\n\t\t<p>avean le luci mie s&igrave; inebr&iuml;ate,</p>\n\t\t<p>che de lo stare a piangere eran vaghe.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma Virgilio mi disse: &laquo;Che pur guate?</p>\n\t\t<p>perch&eacute; la vista tua pur si soffolge</p>\n\t\t<p>l&agrave; gi&ugrave; tra l&rsquo;ombre triste smozzicate?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tu non hai fatto s&igrave; a l&rsquo;altre bolge;</p>\n\t\t<p>pensa, se tu annoverar le credi,</p>\n\t\t<p>che miglia ventidue la valle volge.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E gi&agrave; la luna &egrave; sotto i nostri piedi;</p>\n\t\t<p>lo tempo &egrave; poco omai che n&rsquo;&egrave; concesso,</p>\n\t\t<p>e altro &egrave; da veder che tu non vedi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Se tu avessi&raquo;, rispuos&rsquo; io appresso,</p>\n\t\t<p>&laquo;atteso a la cagion per ch&rsquo;io guardava,</p>\n\t\t<p>forse m&rsquo;avresti ancor lo star dimesso&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Parte sen giva, e io retro li andava,</p>\n\t\t<p>lo duca, gi&agrave; faccendo la risposta,</p>\n\t\t<p>e soggiugnendo: &laquo;Dentro a quella cava</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>dov&rsquo; io tenea or li occhi s&igrave; a posta,</p>\n\t\t<p>credo ch&rsquo;un spirto del mio sangue pianga</p>\n\t\t<p>la colpa che l&agrave; gi&ugrave; cotanto costa&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor disse &rsquo;l maestro: &laquo;Non si franga</p>\n\t\t<p>lo tuo pensier da qui innanzi sovr&rsquo; ello.</p>\n\t\t<p>Attendi ad altro, ed ei l&agrave; si rimanga;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&rsquo;io vidi lui a pi&egrave; del ponticello</p>\n\t\t<p>mostrarti e minacciar forte col dito,</p>\n\t\t<p>e udi&rsquo; &rsquo;l nominar Geri del Bello.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tu eri allor s&igrave; del tutto impedito</p>\n\t\t<p>sovra colui che gi&agrave; tenne Altaforte,</p>\n\t\t<p>che non guardasti in l&agrave;, s&igrave; fu partito&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;O duca mio, la v&iuml;olenta morte</p>\n\t\t<p>che non li &egrave; vendicata ancor&raquo;, diss&rsquo; io,</p>\n\t\t<p>&laquo;per alcun che de l&rsquo;onta sia consorte,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>fece lui disdegnoso; ond&rsquo; el sen gio</p>\n\t\t<p>sanza parlarmi, s&igrave; com&rsquo; &iuml;o estimo:</p>\n\t\t<p>e in ci&ograve; m&rsquo;ha el fatto a s&eacute; pi&ugrave; pio&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; parlammo infino al loco primo</p>\n\t\t<p>che de lo scoglio l&rsquo;altra valle mostra,</p>\n\t\t<p>se pi&ugrave; lume vi fosse, tutto ad imo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quando noi fummo sor l&rsquo;ultima chiostra</p>\n\t\t<p>di Malebolge, s&igrave; che i suoi conversi</p>\n\t\t<p>potean parere a la veduta nostra,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>lamenti saettaron me diversi,</p>\n\t\t<p>che di piet&agrave; ferrati avean li strali;</p>\n\t\t<p>ond&rsquo; io li orecchi con le man copersi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Qual dolor fora, se de li spedali</p>\n\t\t<p>di Valdichiana tra &rsquo;l luglio e &rsquo;l settembre</p>\n\t\t<p>e di Maremma e di Sardigna i mali</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>fossero in una fossa tutti &rsquo;nsembre,</p>\n\t\t<p>tal era quivi, e tal puzzo n&rsquo;usciva</p>\n\t\t<p>qual suol venir de le marcite membre.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Noi discendemmo in su l&rsquo;ultima riva</p>\n\t\t<p>del lungo scoglio, pur da man sinistra;</p>\n\t\t<p>e allor fu la mia vista pi&ugrave; viva</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>gi&ugrave; ver&rsquo; lo fondo, la &rsquo;ve la ministra</p>\n\t\t<p>de l&rsquo;alto Sire infallibil giustizia</p>\n\t\t<p>punisce i falsador che qui registra.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non credo ch&rsquo;a veder maggior tristizia</p>\n\t\t<p>fosse in Egina il popol tutto infermo,</p>\n\t\t<p>quando fu l&rsquo;aere s&igrave; pien di malizia,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che li animali, infino al picciol vermo,</p>\n\t\t<p>cascaron tutti, e poi le genti antiche,</p>\n\t\t<p>secondo che i poeti hanno per fermo,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>si ristorar di seme di formiche;</p>\n\t\t<p>ch&rsquo;era a veder per quella oscura valle</p>\n\t\t<p>languir li spirti per diverse biche.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Qual sovra &rsquo;l ventre e qual sovra le spalle</p>\n\t\t<p>l&rsquo;un de l&rsquo;altro giacea, e qual carpone</p>\n\t\t<p>si trasmutava per lo tristo calle.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Passo passo andavam sanza sermone,</p>\n\t\t<p>guardando e ascoltando li ammalati,</p>\n\t\t<p>che non potean levar le lor persone.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io vidi due sedere a s&eacute; poggiati,</p>\n\t\t<p>com&rsquo; a scaldar si poggia tegghia a tegghia,</p>\n\t\t<p>dal capo al pi&egrave; di schianze macolati;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e non vidi gi&agrave; mai menare stregghia</p>\n\t\t<p>a ragazzo aspettato dal segnorso,</p>\n\t\t<p>n&eacute; a colui che mal volontier vegghia,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>come ciascun menava spesso il morso</p>\n\t\t<p>de l&rsquo;unghie sopra s&eacute; per la gran rabbia</p>\n\t\t<p>del pizzicor, che non ha pi&ugrave; soccorso;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e s&igrave; traevan gi&ugrave; l&rsquo;unghie la scabbia,</p>\n\t\t<p>come coltel di scardova le scaglie</p>\n\t\t<p>o d&rsquo;altro pesce che pi&ugrave; larghe l&rsquo;abbia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;O tu che con le dita ti dismaglie&raquo;,</p>\n\t\t<p>cominci&ograve; &rsquo;l duca mio a l&rsquo;un di loro,</p>\n\t\t<p>&laquo;e che fai d&rsquo;esse talvolta tanaglie,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>dinne s&rsquo;alcun Latino &egrave; tra costoro</p>\n\t\t<p>che son quinc&rsquo; entro, se l&rsquo;unghia ti basti</p>\n\t\t<p>etternalmente a cotesto lavoro&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Latin siam noi, che tu vedi s&igrave; guasti</p>\n\t\t<p>qui ambedue&raquo;, rispuose l&rsquo;un piangendo;</p>\n\t\t<p>&laquo;ma tu chi se&rsquo; che di noi dimandasti?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E &rsquo;l duca disse: &laquo;I&rsquo; son un che discendo</p>\n\t\t<p>con questo vivo gi&ugrave; di balzo in balzo,</p>\n\t\t<p>e di mostrar lo &rsquo;nferno a lui intendo&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor si ruppe lo comun rincalzo;</p>\n\t\t<p>e tremando ciascuno a me si volse</p>\n\t\t<p>con altri che l&rsquo;udiron di rimbalzo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo buon maestro a me tutto s&rsquo;accolse,</p>\n\t\t<p>dicendo: &laquo;D&igrave; a lor ci&ograve; che tu vuoli&raquo;;</p>\n\t\t<p>e io incominciai, poscia ch&rsquo;ei volse:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Se la vostra memoria non s&rsquo;imboli</p>\n\t\t<p>nel primo mondo da l&rsquo;umane menti,</p>\n\t\t<p>ma s&rsquo;ella viva sotto molti soli,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ditemi chi voi siete e di che genti;</p>\n\t\t<p>la vostra sconcia e fastidiosa pena</p>\n\t\t<p>di palesarvi a me non vi spaventi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Io fui d&rsquo;Arezzo, e Albero da Siena&raquo;,</p>\n\t\t<p>rispuose l&rsquo;un, &laquo;mi f&eacute; mettere al foco;</p>\n\t\t<p>ma quel per ch&rsquo;io mori&rsquo; qui non mi mena.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Vero &egrave; ch&rsquo;i&rsquo; dissi lui, parlando a gioco:</p>\n\t\t<p>\u201CI&rsquo; mi saprei levar per l&rsquo;aere a volo\u201D;</p>\n\t\t<p>e quei, ch&rsquo;avea vaghezza e senno poco,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>volle ch&rsquo;i&rsquo; li mostrassi l&rsquo;arte; e solo</p>\n\t\t<p>perch&rsquo; io nol feci Dedalo, mi fece</p>\n\t\t<p>ardere a tal che l&rsquo;avea per figliuolo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma ne l&rsquo;ultima bolgia de le diece</p>\n\t\t<p>me per l&rsquo;alch&igrave;mia che nel mondo usai</p>\n\t\t<p>dann&ograve; Min&ograve;s, a cui fallar non lece&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io dissi al poeta: &laquo;Or fu gi&agrave; mai</p>\n\t\t<p>gente s&igrave; vana come la sanese?</p>\n\t\t<p>Certo non la francesca s&igrave; d&rsquo;assai!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Onde l&rsquo;altro lebbroso, che m&rsquo;intese,</p>\n\t\t<p>rispuose al detto mio: &laquo;Tra&rsquo;mene Stricca</p>\n\t\t<p>che seppe far le temperate spese,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e Niccol&ograve; che la costuma ricca</p>\n\t\t<p>del garofano prima discoverse</p>\n\t\t<p>ne l&rsquo;orto dove tal seme s&rsquo;appicca;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e tra&rsquo;ne la brigata in che disperse</p>\n\t\t<p>Caccia d&rsquo;Ascian la vigna e la gran fonda,</p>\n\t\t<p>e l&rsquo;Abbagliato suo senno proferse.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma perch&eacute; sappi chi s&igrave; ti seconda</p>\n\t\t<p>contra i Sanesi, aguzza ver&rsquo; me l&rsquo;occhio,</p>\n\t\t<p>s&igrave; che la faccia mia ben ti risponda:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>s&igrave; vedrai ch&rsquo;io son l&rsquo;ombra di Capocchio,</p>\n\t\t<p>che falsai li metalli con l&rsquo;alch&igrave;mia;</p>\n\t\t<p>e te dee ricordar, se ben t&rsquo;adocchio,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>com&rsquo; io fui di natura buona scimia&raquo;.</p>\n\t\t</div>','<p class="cantohead">30</p>\n\t\t<div class="stanza">\n\t\t\t<p>Nel tempo che Iunone era crucciata</p>\n\t\t<p>per Semel&egrave; contra &rsquo;l sangue tebano,</p>\n\t\t<p>come mostr&ograve; una e altra f&iuml;ata,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Atamante divenne tanto insano,</p>\n\t\t<p>che veggendo la moglie con due figli</p>\n\t\t<p>andar carcata da ciascuna mano,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>grid&ograve;: &laquo;Tendiam le reti, s&igrave; ch&rsquo;io pigli</p>\n\t\t<p>la leonessa e &rsquo; leoncini al varco&raquo;;</p>\n\t\t<p>e poi distese i dispietati artigli,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>prendendo l&rsquo;un ch&rsquo;avea nome Learco,</p>\n\t\t<p>e rotollo e percosselo ad un sasso;</p>\n\t\t<p>e quella s&rsquo;anneg&ograve; con l&rsquo;altro carco.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quando la fortuna volse in basso</p>\n\t\t<p>l&rsquo;altezza de&rsquo; Troian che tutto ardiva,</p>\n\t\t<p>s&igrave; che &rsquo;nsieme col regno il re fu casso,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ecuba trista, misera e cattiva,</p>\n\t\t<p>poscia che vide Polissena morta,</p>\n\t\t<p>e del suo Polidoro in su la riva</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>del mar si fu la dolorosa accorta,</p>\n\t\t<p>forsennata latr&ograve; s&igrave; come cane;</p>\n\t\t<p>tanto il dolor le f&eacute; la mente torta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma n&eacute; di Tebe furie n&eacute; troiane</p>\n\t\t<p>si vider m\xE4i in alcun tanto crude,</p>\n\t\t<p>non punger bestie, nonch&eacute; membra umane,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>quant&rsquo; io vidi in due ombre smorte e nude,</p>\n\t\t<p>che mordendo correvan di quel modo</p>\n\t\t<p>che &rsquo;l porco quando del porcil si schiude.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>L&rsquo;una giunse a Capocchio, e in sul nodo</p>\n\t\t<p>del collo l&rsquo;assann&ograve;, s&igrave; che, tirando,</p>\n\t\t<p>grattar li fece il ventre al fondo sodo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E l&rsquo;Aretin che rimase, tremando</p>\n\t\t<p>mi disse: &laquo;Quel folletto &egrave; Gianni Schicchi,</p>\n\t\t<p>e va rabbioso altrui cos&igrave; conciando&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Oh&raquo;, diss&rsquo; io lui, &laquo;se l&rsquo;altro non ti ficchi</p>\n\t\t<p>li denti a dosso, non ti sia fatica</p>\n\t\t<p>a dir chi &egrave;, pria che di qui si spicchi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;Quell&rsquo; &egrave; l&rsquo;anima antica</p>\n\t\t<p>di Mirra scellerata, che divenne</p>\n\t\t<p>al padre, fuor del dritto amore, amica.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Questa a peccar con esso cos&igrave; venne,</p>\n\t\t<p>falsificando s&eacute; in altrui forma,</p>\n\t\t<p>come l&rsquo;altro che l&agrave; sen va, sostenne,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>per guadagnar la donna de la torma,</p>\n\t\t<p>falsificare in s&eacute; Buoso Donati,</p>\n\t\t<p>testando e dando al testamento norma&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E poi che i due rabbiosi fuor passati</p>\n\t\t<p>sovra cu&rsquo; io avea l&rsquo;occhio tenuto,</p>\n\t\t<p>rivolsilo a guardar li altri mal nati.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io vidi un, fatto a guisa di l\xEButo,</p>\n\t\t<p>pur ch&rsquo;elli avesse avuta l&rsquo;anguinaia</p>\n\t\t<p>tronca da l&rsquo;altro che l&rsquo;uomo ha forcuto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>La grave idropes&igrave;, che s&igrave; dispaia</p>\n\t\t<p>le membra con l&rsquo;omor che mal converte,</p>\n\t\t<p>che &rsquo;l viso non risponde a la ventraia,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>faceva lui tener le labbra aperte</p>\n\t\t<p>come l&rsquo;etico fa, che per la sete</p>\n\t\t<p>l&rsquo;un verso &rsquo;l mento e l&rsquo;altro in s&ugrave; rinverte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;O voi che sanz&rsquo; alcuna pena siete,</p>\n\t\t<p>e non so io perch&eacute;, nel mondo gramo&raquo;,</p>\n\t\t<p>diss&rsquo; elli a noi, &laquo;guardate e attendete</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>a la miseria del maestro Adamo;</p>\n\t\t<p>io ebbi, vivo, assai di quel ch&rsquo;i&rsquo; volli,</p>\n\t\t<p>e ora, lasso!, un gocciol d&rsquo;acqua bramo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Li ruscelletti che d&rsquo;i verdi colli</p>\n\t\t<p>del Casentin discendon giuso in Arno,</p>\n\t\t<p>faccendo i lor canali freddi e molli,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>sempre mi stanno innanzi, e non indarno,</p>\n\t\t<p>ch&eacute; l&rsquo;imagine lor vie pi&ugrave; m&rsquo;asciuga</p>\n\t\t<p>che &rsquo;l male ond&rsquo; io nel volto mi discarno.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>La rigida giustizia che mi fruga</p>\n\t\t<p>tragge cagion del loco ov&rsquo; io peccai</p>\n\t\t<p>a metter pi&ugrave; li miei sospiri in fuga.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ivi &egrave; Romena, l&agrave; dov&rsquo; io falsai</p>\n\t\t<p>la lega suggellata del Batista;</p>\n\t\t<p>per ch&rsquo;io il corpo s&ugrave; arso lasciai.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma s&rsquo;io vedessi qui l&rsquo;anima trista</p>\n\t\t<p>di Guido o d&rsquo;Alessandro o di lor frate,</p>\n\t\t<p>per Fonte Branda non darei la vista.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Dentro c&rsquo;&egrave; l&rsquo;una gi&agrave;, se l&rsquo;arrabbiate</p>\n\t\t<p>ombre che vanno intorno dicon vero;</p>\n\t\t<p>ma che mi val, c&rsquo;ho le membra legate?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>S&rsquo;io fossi pur di tanto ancor leggero</p>\n\t\t<p>ch&rsquo;i&rsquo; potessi in cent&rsquo; anni andare un&rsquo;oncia,</p>\n\t\t<p>io sarei messo gi&agrave; per lo sentiero,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>cercando lui tra questa gente sconcia,</p>\n\t\t<p>con tutto ch&rsquo;ella volge undici miglia,</p>\n\t\t<p>e men d&rsquo;un mezzo di traverso non ci ha.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io son per lor tra s&igrave; fatta famiglia;</p>\n\t\t<p>e&rsquo; m&rsquo;indussero a batter li fiorini</p>\n\t\t<p>ch&rsquo;avevan tre carati di mondiglia&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io a lui: &laquo;Chi son li due tapini</p>\n\t\t<p>che fumman come man bagnate &rsquo;l verno,</p>\n\t\t<p>giacendo stretti a&rsquo; tuoi destri confini?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Qui li trovai\u2014e poi volta non dierno\u2014&raquo;,</p>\n\t\t<p>rispuose, &laquo;quando piovvi in questo greppo,</p>\n\t\t<p>e non credo che dieno in sempiterno.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>L&rsquo;una &egrave; la falsa ch&rsquo;accus&ograve; Gioseppo;</p>\n\t\t<p>l&rsquo;altr&rsquo; &egrave; &rsquo;l falso Sinon greco di Troia:</p>\n\t\t<p>per febbre aguta gittan tanto leppo&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E l&rsquo;un di lor, che si rec&ograve; a noia</p>\n\t\t<p>forse d&rsquo;esser nomato s&igrave; oscuro,</p>\n\t\t<p>col pugno li percosse l&rsquo;epa croia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quella son&ograve; come fosse un tamburo;</p>\n\t\t<p>e mastro Adamo li percosse il volto</p>\n\t\t<p>col braccio suo, che non parve men duro,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>dicendo a lui: &laquo;Ancor che mi sia tolto</p>\n\t\t<p>lo muover per le membra che son gravi,</p>\n\t\t<p>ho io il braccio a tal mestiere sciolto&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ond&rsquo; ei rispuose: &laquo;Quando tu andavi</p>\n\t\t<p>al fuoco, non l&rsquo;avei tu cos&igrave; presto;</p>\n\t\t<p>ma s&igrave; e pi&ugrave; l&rsquo;avei quando coniavi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E l&rsquo;idropico: &laquo;Tu di&rsquo; ver di questo:</p>\n\t\t<p>ma tu non fosti s&igrave; ver testimonio</p>\n\t\t<p>l&agrave; &rsquo;ve del ver fosti a Troia richesto&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;S&rsquo;io dissi falso, e tu falsasti il conio&raquo;,</p>\n\t\t<p>disse Sinon; &laquo;e son qui per un fallo,</p>\n\t\t<p>e tu per pi&ugrave; ch&rsquo;alcun altro demonio!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Ricorditi, spergiuro, del cavallo&raquo;,</p>\n\t\t<p>rispuose quel ch&rsquo;av\xEBa infiata l&rsquo;epa;</p>\n\t\t<p>&laquo;e sieti reo che tutto il mondo sallo!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;E te sia rea la sete onde ti crepa&raquo;,</p>\n\t\t<p>disse &rsquo;l Greco, &laquo;la lingua, e l&rsquo;acqua marcia</p>\n\t\t<p>che &rsquo;l ventre innanzi a li occhi s&igrave; t&rsquo;assiepa!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allora il monetier: &laquo;Cos&igrave; si squarcia</p>\n\t\t<p>la bocca tua per tuo mal come suole;</p>\n\t\t<p>ch&eacute;, s&rsquo;i&rsquo; ho sete e omor mi rinfarcia,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>tu hai l&rsquo;arsura e &rsquo;l capo che ti duole,</p>\n\t\t<p>e per leccar lo specchio di Narcisso,</p>\n\t\t<p>non vorresti a &rsquo;nvitar molte parole&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ad ascoltarli er&rsquo; io del tutto fisso,</p>\n\t\t<p>quando &rsquo;l maestro mi disse: &laquo;Or pur mira,</p>\n\t\t<p>che per poco che teco non mi risso!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quand&rsquo; io &rsquo;l senti&rsquo; a me parlar con ira,</p>\n\t\t<p>volsimi verso lui con tal vergogna,</p>\n\t\t<p>ch&rsquo;ancor per la memoria mi si gira.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Qual &egrave; colui che suo dannaggio sogna,</p>\n\t\t<p>che sognando desidera sognare,</p>\n\t\t<p>s&igrave; che quel ch&rsquo;&egrave;, come non fosse, agogna,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>tal mi fec&rsquo; io, non possendo parlare,</p>\n\t\t<p>che dis&iuml;ava scusarmi, e scusava</p>\n\t\t<p>me tuttavia, e nol mi credea fare.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Maggior difetto men vergogna lava&raquo;,</p>\n\t\t<p>disse &rsquo;l maestro, &laquo;che &rsquo;l tuo non &egrave; stato;</p>\n\t\t<p>per&ograve; d&rsquo;ogne trestizia ti disgrava.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E fa ragion ch&rsquo;io ti sia sempre allato,</p>\n\t\t<p>se pi&ugrave; avvien che fortuna t&rsquo;accoglia</p>\n\t\t<p>dove sien genti in simigliante piato:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&eacute; voler ci&ograve; udire &egrave; bassa voglia&raquo;.</p>\n\t\t</div>','<p class="cantohead">31</p>\n\t\t<div class="stanza">\n\t\t\t<p>Una medesma lingua pria mi morse,</p>\n\t\t<p>s&igrave; che mi tinse l&rsquo;una e l&rsquo;altra guancia,</p>\n\t\t<p>e poi la medicina mi riporse;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>cos&igrave; od&rsquo; io che solea far la lancia</p>\n\t\t<p>d&rsquo;Achille e del suo padre esser cagione</p>\n\t\t<p>prima di trista e poi di buona mancia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Noi demmo il dosso al misero vallone</p>\n\t\t<p>su per la ripa che &rsquo;l cinge dintorno,</p>\n\t\t<p>attraversando sanza alcun sermone.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quiv&rsquo; era men che notte e men che giorno,</p>\n\t\t<p>s&igrave; che &rsquo;l viso m&rsquo;andava innanzi poco;</p>\n\t\t<p>ma io senti&rsquo; sonare un alto corno,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>tanto ch&rsquo;avrebbe ogne tuon fatto fioco,</p>\n\t\t<p>che, contra s&eacute; la sua via seguitando,</p>\n\t\t<p>dirizz&ograve; li occhi miei tutti ad un loco.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Dopo la dolorosa rotta, quando</p>\n\t\t<p>Carlo Magno perd&eacute; la santa gesta,</p>\n\t\t<p>non son&ograve; s&igrave; terribilmente Orlando.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poco port\xE4i in l&agrave; volta la testa,</p>\n\t\t<p>che me parve veder molte alte torri;</p>\n\t\t<p>ond&rsquo; io: &laquo;Maestro, d&igrave;, che terra &egrave; questa?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;Per&ograve; che tu trascorri</p>\n\t\t<p>per le tenebre troppo da la lungi,</p>\n\t\t<p>avvien che poi nel maginare abborri.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tu vedrai ben, se tu l&agrave; ti congiungi,</p>\n\t\t<p>quanto &rsquo;l senso s&rsquo;inganna di lontano;</p>\n\t\t<p>per&ograve; alquanto pi&ugrave; te stesso pungi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi caramente mi prese per mano</p>\n\t\t<p>e disse: &laquo;Pria che noi siam pi&ugrave; avanti,</p>\n\t\t<p>acci&ograve; che &rsquo;l fatto men ti paia strano,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>sappi che non son torri, ma giganti,</p>\n\t\t<p>e son nel pozzo intorno da la ripa</p>\n\t\t<p>da l&rsquo;umbilico in giuso tutti quanti&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Come quando la nebbia si dissipa,</p>\n\t\t<p>lo sguardo a poco a poco raffigura</p>\n\t\t<p>ci&ograve; che cela &rsquo;l vapor che l&rsquo;aere stipa,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>cos&igrave; forando l&rsquo;aura grossa e scura,</p>\n\t\t<p>pi&ugrave; e pi&ugrave; appressando ver&rsquo; la sponda,</p>\n\t\t<p>fuggiemi errore e cresciemi paura;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>per&ograve; che, come su la cerchia tonda</p>\n\t\t<p>Montereggion di torri si corona,</p>\n\t\t<p>cos&igrave; la proda che &rsquo;l pozzo circonda</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>torreggiavan di mezza la persona</p>\n\t\t<p>li orribili giganti, cui minaccia</p>\n\t\t<p>Giove del cielo ancora quando tuona.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io scorgeva gi&agrave; d&rsquo;alcun la faccia,</p>\n\t\t<p>le spalle e &rsquo;l petto e del ventre gran parte,</p>\n\t\t<p>e per le coste gi&ugrave; ambo le braccia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Natura certo, quando lasci&ograve; l&rsquo;arte</p>\n\t\t<p>di s&igrave; fatti animali, assai f&eacute; bene</p>\n\t\t<p>per t&ograve;rre tali essecutori a Marte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E s&rsquo;ella d&rsquo;elefanti e di balene</p>\n\t\t<p>non si pente, chi guarda sottilmente,</p>\n\t\t<p>pi&ugrave; giusta e pi&ugrave; discreta la ne tene;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&eacute; dove l&rsquo;argomento de la mente</p>\n\t\t<p>s&rsquo;aggiugne al mal volere e a la possa,</p>\n\t\t<p>nessun riparo vi pu&ograve; far la gente.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>La faccia sua mi parea lunga e grossa</p>\n\t\t<p>come la pina di San Pietro a Roma,</p>\n\t\t<p>e a sua proporzione eran l&rsquo;altre ossa;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>s&igrave; che la ripa, ch&rsquo;era perizoma</p>\n\t\t<p>dal mezzo in gi&ugrave;, ne mostrava ben tanto</p>\n\t\t<p>di sovra, che di giugnere a la chioma</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>tre Frison s&rsquo;averien dato mal vanto;</p>\n\t\t<p>per&ograve; ch&rsquo;i&rsquo; ne vedea trenta gran palmi</p>\n\t\t<p>dal loco in gi&ugrave; dov&rsquo; omo affibbia &rsquo;l manto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Raph&egrave;l ma&igrave; am&egrave;cche zab&igrave; almi&raquo;,</p>\n\t\t<p>cominci&ograve; a gridar la fiera bocca,</p>\n\t\t<p>cui non si convenia pi&ugrave; dolci salmi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E &rsquo;l duca mio ver&rsquo; lui: &laquo;Anima sciocca,</p>\n\t\t<p>tienti col corno, e con quel ti disfoga</p>\n\t\t<p>quand&rsquo; ira o altra pass&iuml;on ti tocca!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>C&eacute;rcati al collo, e troverai la soga</p>\n\t\t<p>che &rsquo;l tien legato, o anima confusa,</p>\n\t\t<p>e vedi lui che &rsquo;l gran petto ti doga&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi disse a me: &laquo;Elli stessi s&rsquo;accusa;</p>\n\t\t<p>questi &egrave; Nembrotto per lo cui mal coto</p>\n\t\t<p>pur un linguaggio nel mondo non s&rsquo;usa.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lasci&agrave;nlo stare e non parliamo a v&ograve;to;</p>\n\t\t<p>ch&eacute; cos&igrave; &egrave; a lui ciascun linguaggio</p>\n\t\t<p>come &rsquo;l suo ad altrui, ch&rsquo;a nullo &egrave; noto&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Facemmo adunque pi&ugrave; lungo v&iuml;aggio,</p>\n\t\t<p>v&ograve;lti a sinistra; e al trar d&rsquo;un balestro</p>\n\t\t<p>trovammo l&rsquo;altro assai pi&ugrave; fero e maggio.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>A cigner lui qual che fosse &rsquo;l maestro,</p>\n\t\t<p>non so io dir, ma el tenea soccinto</p>\n\t\t<p>dinanzi l&rsquo;altro e dietro il braccio destro</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>d&rsquo;una catena che &rsquo;l tenea avvinto</p>\n\t\t<p>dal collo in gi&ugrave;, s&igrave; che &rsquo;n su lo scoperto</p>\n\t\t<p>si ravvolg\xEBa infino al giro quinto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Questo superbo volle esser esperto</p>\n\t\t<p>di sua potenza contra &rsquo;l sommo Giove&raquo;,</p>\n\t\t<p>disse &rsquo;l mio duca, &laquo;ond&rsquo; elli ha cotal merto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>F&iuml;alte ha nome, e fece le gran prove</p>\n\t\t<p>quando i giganti fer paura a&rsquo; d&egrave;i;</p>\n\t\t<p>le braccia ch&rsquo;el men&ograve;, gi&agrave; mai non move&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io a lui: &laquo;S&rsquo;esser puote, io vorrei</p>\n\t\t<p>che de lo smisurato Br&iuml;areo</p>\n\t\t<p>esper&iuml;enza avesser li occhi mei&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ond&rsquo; ei rispuose: &laquo;Tu vedrai Anteo</p>\n\t\t<p>presso di qui che parla ed &egrave; disciolto,</p>\n\t\t<p>che ne porr&agrave; nel fondo d&rsquo;ogne reo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quel che tu vuo&rsquo; veder, pi&ugrave; l&agrave; &egrave; molto</p>\n\t\t<p>ed &egrave; legato e fatto come questo,</p>\n\t\t<p>salvo che pi&ugrave; feroce par nel volto&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non fu tremoto gi&agrave; tanto rubesto,</p>\n\t\t<p>che scotesse una torre cos&igrave; forte,</p>\n\t\t<p>come F&iuml;alte a scuotersi fu presto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor temett&rsquo; io pi&ugrave; che mai la morte,</p>\n\t\t<p>e non v&rsquo;era mestier pi&ugrave; che la dotta,</p>\n\t\t<p>s&rsquo;io non avessi viste le ritorte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Noi procedemmo pi&ugrave; avante allotta,</p>\n\t\t<p>e venimmo ad Anteo, che ben cinque alle,</p>\n\t\t<p>sanza la testa, uscia fuor de la grotta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;O tu che ne la fortunata valle</p>\n\t\t<p>che fece Scip&iuml;on di gloria reda,</p>\n\t\t<p>quand&rsquo; Anib&agrave;l co&rsquo; suoi diede le spalle,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>recasti gi&agrave; mille leon per preda,</p>\n\t\t<p>e che, se fossi stato a l&rsquo;alta guerra</p>\n\t\t<p>de&rsquo; tuoi fratelli, ancor par che si creda</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&rsquo;avrebber vinto i figli de la terra:</p>\n\t\t<p>mettine gi&ugrave;, e non ten vegna schifo,</p>\n\t\t<p>dove Cocito la freddura serra.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non ci fare ire a Tizio n&eacute; a Tifo:</p>\n\t\t<p>questi pu&ograve; dar di quel che qui si brama;</p>\n\t\t<p>per&ograve; ti china e non torcer lo grifo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ancor ti pu&ograve; nel mondo render fama,</p>\n\t\t<p>ch&rsquo;el vive, e lunga vita ancor aspetta</p>\n\t\t<p>se &rsquo;nnanzi tempo grazia a s&eacute; nol chiama&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cos&igrave; disse &rsquo;l maestro; e quelli in fretta</p>\n\t\t<p>le man distese, e prese &rsquo;l duca mio,</p>\n\t\t<p>ond&rsquo; Ercule sent&igrave; gi&agrave; grande stretta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Virgilio, quando prender si sentio,</p>\n\t\t<p>disse a me: &laquo;Fatti qua, s&igrave; ch&rsquo;io ti prenda&raquo;;</p>\n\t\t<p>poi fece s&igrave; ch&rsquo;un fascio era elli e io.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Qual pare a riguardar la Carisenda</p>\n\t\t<p>sotto &rsquo;l chinato, quando un nuvol vada</p>\n\t\t<p>sovr&rsquo; essa s&igrave;, ched ella incontro penda:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>tal parve Ant\xEBo a me che stava a bada</p>\n\t\t<p>di vederlo chinare, e fu tal ora</p>\n\t\t<p>ch&rsquo;i&rsquo; avrei voluto ir per altra strada.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma lievemente al fondo che divora</p>\n\t\t<p>Lucifero con Giuda, ci spos&ograve;;</p>\n\t\t<p>n&eacute;, s&igrave; chinato, l&igrave; fece dimora,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e come albero in nave si lev&ograve;.</p>\n\t\t</div>','<p class="cantohead">32</p>\n\t\t<div class="stanza">\n\t\t\t<p>S&rsquo;&iuml;o avessi le rime aspre e chiocce,</p>\n\t\t<p>come si converrebbe al tristo buco</p>\n\t\t<p>sovra &rsquo;l qual pontan tutte l&rsquo;altre rocce,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>io premerei di mio concetto il suco</p>\n\t\t<p>pi&ugrave; pienamente; ma perch&rsquo; io non l&rsquo;abbo,</p>\n\t\t<p>non sanza tema a dicer mi conduco;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&eacute; non &egrave; impresa da pigliare a gabbo</p>\n\t\t<p>discriver fondo a tutto l&rsquo;universo,</p>\n\t\t<p>n&eacute; da lingua che chiami mamma o babbo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma quelle donne aiutino il mio verso</p>\n\t\t<p>ch&rsquo;aiutaro Anf&iuml;one a chiuder Tebe,</p>\n\t\t<p>s&igrave; che dal fatto il dir non sia diverso.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Oh sovra tutte mal creata plebe</p>\n\t\t<p>che stai nel loco onde parlare &egrave; duro,</p>\n\t\t<p>mei foste state qui pecore o zebe!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Come noi fummo gi&ugrave; nel pozzo scuro</p>\n\t\t<p>sotto i pi&egrave; del gigante assai pi&ugrave; bassi,</p>\n\t\t<p>e io mirava ancora a l&rsquo;alto muro,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>dicere udi&rsquo;mi: &laquo;Guarda come passi:</p>\n\t\t<p>va s&igrave;, che tu non calchi con le piante</p>\n\t\t<p>le teste de&rsquo; fratei miseri lassi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per ch&rsquo;io mi volsi, e vidimi davante</p>\n\t\t<p>e sotto i piedi un lago che per gelo</p>\n\t\t<p>avea di vetro e non d&rsquo;acqua sembiante.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non fece al corso suo s&igrave; grosso velo</p>\n\t\t<p>di verno la Danoia in Osterlicchi,</p>\n\t\t<p>n&eacute; Tana&iuml; l&agrave; sotto &rsquo;l freddo cielo,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>com&rsquo; era quivi; che se Tambernicchi</p>\n\t\t<p>vi fosse s&ugrave; caduto, o Pietrapana,</p>\n\t\t<p>non avria pur da l&rsquo;orlo fatto cricchi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E come a gracidar si sta la rana</p>\n\t\t<p>col muso fuor de l&rsquo;acqua, quando sogna</p>\n\t\t<p>di spigolar sovente la villana,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>livide, insin l&agrave; dove appar vergogna</p>\n\t\t<p>eran l&rsquo;ombre dolenti ne la ghiaccia,</p>\n\t\t<p>mettendo i denti in nota di cicogna.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ognuna in gi&ugrave; tenea volta la faccia;</p>\n\t\t<p>da bocca il freddo, e da li occhi il cor tristo</p>\n\t\t<p>tra lor testimonianza si procaccia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quand&rsquo; io m&rsquo;ebbi dintorno alquanto visto,</p>\n\t\t<p>volsimi a&rsquo; piedi, e vidi due s&igrave; stretti,</p>\n\t\t<p>che &rsquo;l pel del capo avieno insieme misto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Ditemi, voi che s&igrave; strignete i petti&raquo;,</p>\n\t\t<p>diss&rsquo; io, &laquo;chi siete?&raquo;. E quei piegaro i colli;</p>\n\t\t<p>e poi ch&rsquo;ebber li visi a me eretti,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>li occhi lor, ch&rsquo;eran pria pur dentro molli,</p>\n\t\t<p>gocciar su per le labbra, e &rsquo;l gelo strinse</p>\n\t\t<p>le lagrime tra essi e riserrolli.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Con legno legno spranga mai non cinse</p>\n\t\t<p>forte cos&igrave;; ond&rsquo; ei come due becchi</p>\n\t\t<p>cozzaro insieme, tanta ira li vinse.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E un ch&rsquo;avea perduti ambo li orecchi</p>\n\t\t<p>per la freddura, pur col viso in gi&ugrave;e,</p>\n\t\t<p>disse: &laquo;Perch&eacute; cotanto in noi ti specchi?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Se vuoi saper chi son cotesti due,</p>\n\t\t<p>la valle onde Bisenzo si dichina</p>\n\t\t<p>del padre loro Alberto e di lor fue.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>D&rsquo;un corpo usciro; e tutta la Caina</p>\n\t\t<p>potrai cercare, e non troverai ombra</p>\n\t\t<p>degna pi&ugrave; d&rsquo;esser fitta in gelatina:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>non quelli a cui fu rotto il petto e l&rsquo;ombra</p>\n\t\t<p>con esso un colpo per la man d&rsquo;Art&ugrave;;</p>\n\t\t<p>non Focaccia; non questi che m&rsquo;ingombra</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>col capo s&igrave;, ch&rsquo;i&rsquo; non veggio oltre pi&ugrave;,</p>\n\t\t<p>e fu nomato Sassol Mascheroni;</p>\n\t\t<p>se tosco se&rsquo;, ben sai omai chi fu.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E perch&eacute; non mi metti in pi&ugrave; sermoni,</p>\n\t\t<p>sappi ch&rsquo;i&rsquo; fu&rsquo; il Camiscion de&rsquo; Pazzi;</p>\n\t\t<p>e aspetto Carlin che mi scagioni&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poscia vid&rsquo; io mille visi cagnazzi</p>\n\t\t<p>fatti per freddo; onde mi vien riprezzo,</p>\n\t\t<p>e verr&agrave; sempre, de&rsquo; gelati guazzi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E mentre ch&rsquo;andavamo inver&rsquo; lo mezzo</p>\n\t\t<p>al quale ogne gravezza si rauna,</p>\n\t\t<p>e io tremava ne l&rsquo;etterno rezzo;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>se voler fu o destino o fortuna,</p>\n\t\t<p>non so; ma, passeggiando tra le teste,</p>\n\t\t<p>forte percossi &rsquo;l pi&egrave; nel viso ad una.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Piangendo mi sgrid&ograve;: &laquo;Perch&eacute; mi peste?</p>\n\t\t<p>se tu non vieni a crescer la vendetta</p>\n\t\t<p>di Montaperti, perch&eacute; mi moleste?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E io: &laquo;Maestro mio, or qui m&rsquo;aspetta,</p>\n\t\t<p>s&igrave; ch&rsquo;io esca d&rsquo;un dubbio per costui;</p>\n\t\t<p>poi mi farai, quantunque vorrai, fretta&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo duca stette, e io dissi a colui</p>\n\t\t<p>che bestemmiava duramente ancora:</p>\n\t\t<p>&laquo;Qual se&rsquo; tu che cos&igrave; rampogni altrui?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Or tu chi se&rsquo; che vai per l&rsquo;Antenora,</p>\n\t\t<p>percotendo&raquo;, rispuose, &laquo;altrui le gote,</p>\n\t\t<p>s&igrave; che, se fossi vivo, troppo fora?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Vivo son io, e caro esser ti puote&raquo;,</p>\n\t\t<p>fu mia risposta, &laquo;se dimandi fama,</p>\n\t\t<p>ch&rsquo;io metta il nome tuo tra l&rsquo;altre note&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;Del contrario ho io brama.</p>\n\t\t<p>L&egrave;vati quinci e non mi dar pi&ugrave; lagna,</p>\n\t\t<p>ch&eacute; mal sai lusingar per questa lama!&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Allor lo presi per la cuticagna</p>\n\t\t<p>e dissi: &laquo;El converr&agrave; che tu ti nomi,</p>\n\t\t<p>o che capel qui s&ugrave; non ti rimagna&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ond&rsquo; elli a me: &laquo;Perch&eacute; tu mi dischiomi,</p>\n\t\t<p>n&eacute; ti dir&ograve; ch&rsquo;io sia, n&eacute; mosterrolti,</p>\n\t\t<p>se mille fiate in sul capo mi tomi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io avea gi&agrave; i capelli in mano avvolti,</p>\n\t\t<p>e tratti glien&rsquo; avea pi&ugrave; d&rsquo;una ciocca,</p>\n\t\t<p>latrando lui con li occhi in gi&ugrave; raccolti,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>quando un altro grid&ograve;: &laquo;Che hai tu, Bocca?</p>\n\t\t<p>non ti basta sonar con le mascelle,</p>\n\t\t<p>se tu non latri? qual diavol ti tocca?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Omai&raquo;, diss&rsquo; io, &laquo;non vo&rsquo; che pi&ugrave; favelle,</p>\n\t\t<p>malvagio traditor; ch&rsquo;a la tua onta</p>\n\t\t<p>io porter&ograve; di te vere novelle&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Va via&raquo;, rispuose, &laquo;e ci&ograve; che tu vuoi conta;</p>\n\t\t<p>ma non tacer, se tu di qua entro eschi,</p>\n\t\t<p>di quel ch&rsquo;ebbe or cos&igrave; la lingua pronta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>El piange qui l&rsquo;argento de&rsquo; Franceschi:</p>\n\t\t<p>\u201CIo vidi\u201D, potrai dir, \u201Cquel da Duera</p>\n\t\t<p>l&agrave; dove i peccatori stanno freschi\u201D.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Se fossi domandato \u201CAltri chi v&rsquo;era?\u201D,</p>\n\t\t<p>tu hai dallato quel di Beccheria</p>\n\t\t<p>di cui seg&ograve; Fiorenza la gorgiera.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Gianni de&rsquo; Soldanier credo che sia</p>\n\t\t<p>pi&ugrave; l&agrave; con Ganellone e Tebaldello,</p>\n\t\t<p>ch&rsquo;apr&igrave; Faenza quando si dormia&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Noi eravam partiti gi&agrave; da ello,</p>\n\t\t<p>ch&rsquo;io vidi due ghiacciati in una buca,</p>\n\t\t<p>s&igrave; che l&rsquo;un capo a l&rsquo;altro era cappello;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e come &rsquo;l pan per fame si manduca,</p>\n\t\t<p>cos&igrave; &rsquo;l sovran li denti a l&rsquo;altro pose</p>\n\t\t<p>l&agrave; &rsquo;ve &rsquo;l cervel s&rsquo;aggiugne con la nuca:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>non altrimenti Tid\xEBo si rose</p>\n\t\t<p>le tempie a Menalippo per disdegno,</p>\n\t\t<p>che quei faceva il teschio e l&rsquo;altre cose.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;O tu che mostri per s&igrave; bestial segno</p>\n\t\t<p>odio sovra colui che tu ti mangi,</p>\n\t\t<p>dimmi &rsquo;l perch&eacute;&raquo;, diss&rsquo; io, &laquo;per tal convegno,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che se tu a ragion di lui ti piangi,</p>\n\t\t<p>sappiendo chi voi siete e la sua pecca,</p>\n\t\t<p>nel mondo suso ancora io te ne cangi,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>se quella con ch&rsquo;io parlo non si secca&raquo;.</p>\n\t\t</div>','<p class="cantohead">33</p>\n\t\t<div class="stanza">\n\t\t\t<p>La bocca sollev&ograve; dal fiero pasto</p>\n\t\t<p>quel peccator, forbendola a&rsquo; capelli</p>\n\t\t<p>del capo ch&rsquo;elli avea di retro guasto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi cominci&ograve;: &laquo;Tu vuo&rsquo; ch&rsquo;io rinovelli</p>\n\t\t<p>disperato dolor che &rsquo;l cor mi preme</p>\n\t\t<p>gi&agrave; pur pensando, pria ch&rsquo;io ne favelli.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma se le mie parole esser dien seme</p>\n\t\t<p>che frutti infamia al traditor ch&rsquo;i&rsquo; rodo,</p>\n\t\t<p>parlar e lagrimar vedrai insieme.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io non so chi tu se&rsquo; n&eacute; per che modo</p>\n\t\t<p>venuto se&rsquo; qua gi&ugrave;; ma fiorentino</p>\n\t\t<p>mi sembri veramente quand&rsquo; io t&rsquo;odo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tu dei saper ch&rsquo;i&rsquo; fui conte Ugolino,</p>\n\t\t<p>e questi &egrave; l&rsquo;arcivescovo Ruggieri:</p>\n\t\t<p>or ti dir&ograve; perch&eacute; i son tal vicino.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Che per l&rsquo;effetto de&rsquo; suo&rsquo; mai pensieri,</p>\n\t\t<p>fidandomi di lui, io fossi preso</p>\n\t\t<p>e poscia morto, dir non &egrave; mestieri;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>per&ograve; quel che non puoi avere inteso,</p>\n\t\t<p>cio&egrave; come la morte mia fu cruda,</p>\n\t\t<p>udirai, e saprai s&rsquo;e&rsquo; m&rsquo;ha offeso.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Breve pertugio dentro da la Muda,</p>\n\t\t<p>la qual per me ha &rsquo;l titol de la fame,</p>\n\t\t<p>e che conviene ancor ch&rsquo;altrui si chiuda,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>m&rsquo;avea mostrato per lo suo forame</p>\n\t\t<p>pi&ugrave; lune gi&agrave;, quand&rsquo; io feci &rsquo;l mal sonno</p>\n\t\t<p>che del futuro mi squarci&ograve; &rsquo;l velame.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Questi pareva a me maestro e donno,</p>\n\t\t<p>cacciando il lupo e &rsquo; lupicini al monte</p>\n\t\t<p>per che i Pisan veder Lucca non ponno.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Con cagne magre, stud&iuml;ose e conte</p>\n\t\t<p>Gualandi con Sismondi e con Lanfranchi</p>\n\t\t<p>s&rsquo;avea messi dinanzi da la fronte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>In picciol corso mi parieno stanchi</p>\n\t\t<p>lo padre e &rsquo; figli, e con l&rsquo;agute scane</p>\n\t\t<p>mi parea lor veder fender li fianchi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quando fui desto innanzi la dimane,</p>\n\t\t<p>pianger senti&rsquo; fra &rsquo;l sonno i miei figliuoli</p>\n\t\t<p>ch&rsquo;eran con meco, e dimandar del pane.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ben se&rsquo; crudel, se tu gi&agrave; non ti duoli</p>\n\t\t<p>pensando ci&ograve; che &rsquo;l mio cor s&rsquo;annunziava;</p>\n\t\t<p>e se non piangi, di che pianger suoli?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Gi&agrave; eran desti, e l&rsquo;ora s&rsquo;appressava</p>\n\t\t<p>che &rsquo;l cibo ne sol\xEBa essere addotto,</p>\n\t\t<p>e per suo sogno ciascun dubitava;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e io senti&rsquo; chiavar l&rsquo;uscio di sotto</p>\n\t\t<p>a l&rsquo;orribile torre; ond&rsquo; io guardai</p>\n\t\t<p>nel viso a&rsquo; mie&rsquo; figliuoi sanza far motto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io non piang\xEBa, s&igrave; dentro impetrai:</p>\n\t\t<p>piangevan elli; e Anselmuccio mio</p>\n\t\t<p>disse: \u201CTu guardi s&igrave;, padre! che hai?\u201D.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Perci&ograve; non lagrimai n&eacute; rispuos&rsquo; io</p>\n\t\t<p>tutto quel giorno n&eacute; la notte appresso,</p>\n\t\t<p>infin che l&rsquo;altro sol nel mondo usc&igrave;o.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Come un poco di raggio si fu messo</p>\n\t\t<p>nel doloroso carcere, e io scorsi</p>\n\t\t<p>per quattro visi il mio aspetto stesso,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ambo le man per lo dolor mi morsi;</p>\n\t\t<p>ed ei, pensando ch&rsquo;io &rsquo;l fessi per voglia</p>\n\t\t<p>di manicar, di s&ugrave;bito levorsi</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e disser: \u201CPadre, assai ci fia men doglia</p>\n\t\t<p>se tu mangi di noi: tu ne vestisti</p>\n\t\t<p>queste misere carni, e tu le spoglia\u201D.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Queta&rsquo;mi allor per non farli pi&ugrave; tristi;</p>\n\t\t<p>lo d&igrave; e l&rsquo;altro stemmo tutti muti;</p>\n\t\t<p>ahi dura terra, perch&eacute; non t&rsquo;apristi?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poscia che fummo al quarto d&igrave; venuti,</p>\n\t\t<p>Gaddo mi si gitt&ograve; disteso a&rsquo; piedi,</p>\n\t\t<p>dicendo: \u201CPadre mio, ch&eacute; non m&rsquo;aiuti?\u201D.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quivi mor&igrave;; e come tu mi vedi,</p>\n\t\t<p>vid&rsquo; io cascar li tre ad uno ad uno</p>\n\t\t<p>tra &rsquo;l quinto d&igrave; e &rsquo;l sesto; ond&rsquo; io mi diedi,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>gi&agrave; cieco, a brancolar sovra ciascuno,</p>\n\t\t<p>e due d&igrave; li chiamai, poi che fur morti.</p>\n\t\t<p>Poscia, pi&ugrave; che &rsquo;l dolor, pot&eacute; &rsquo;l digiuno&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quand&rsquo; ebbe detto ci&ograve;, con li occhi torti</p>\n\t\t<p>riprese &rsquo;l teschio misero co&rsquo; denti,</p>\n\t\t<p>che furo a l&rsquo;osso, come d&rsquo;un can, forti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ahi Pisa, vituperio de le genti</p>\n\t\t<p>del bel paese l&agrave; dove &rsquo;l s&igrave; suona,</p>\n\t\t<p>poi che i vicini a te punir son lenti,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>muovasi la Capraia e la Gorgona,</p>\n\t\t<p>e faccian siepe ad Arno in su la foce,</p>\n\t\t<p>s&igrave; ch&rsquo;elli annieghi in te ogne persona!</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Che se &rsquo;l conte Ugolino aveva voce</p>\n\t\t<p>d&rsquo;aver tradita te de le castella,</p>\n\t\t<p>non dovei tu i figliuoi porre a tal croce.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Innocenti facea l&rsquo;et&agrave; novella,</p>\n\t\t<p>novella Tebe, Uguiccione e &rsquo;l Brigata</p>\n\t\t<p>e li altri due che &rsquo;l canto suso appella.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Noi passammo oltre, l&agrave; &rsquo;ve la gelata</p>\n\t\t<p>ruvidamente un&rsquo;altra gente fascia,</p>\n\t\t<p>non volta in gi&ugrave;, ma tutta riversata.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo pianto stesso l&igrave; pianger non lascia,</p>\n\t\t<p>e &rsquo;l duol che truova in su li occhi rintoppo,</p>\n\t\t<p>si volge in entro a far crescer l&rsquo;ambascia;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ch&eacute; le lagrime prime fanno groppo,</p>\n\t\t<p>e s&igrave; come visiere di cristallo,</p>\n\t\t<p>r&iuml;empion sotto &rsquo;l ciglio tutto il coppo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E avvegna che, s&igrave; come d&rsquo;un callo,</p>\n\t\t<p>per la freddura ciascun sentimento</p>\n\t\t<p>cessato avesse del mio viso stallo,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>gi&agrave; mi parea sentire alquanto vento;</p>\n\t\t<p>per ch&rsquo;io: &laquo;Maestro mio, questo chi move?</p>\n\t\t<p>non &egrave; qua gi&ugrave; ogne vapore spento?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ond&rsquo; elli a me: &laquo;Avaccio sarai dove</p>\n\t\t<p>di ci&ograve; ti far&agrave; l&rsquo;occhio la risposta,</p>\n\t\t<p>veggendo la cagion che &rsquo;l fiato piove&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E un de&rsquo; tristi de la fredda crosta</p>\n\t\t<p>grid&ograve; a noi: &laquo;O anime crudeli</p>\n\t\t<p>tanto che data v&rsquo;&egrave; l&rsquo;ultima posta,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>levatemi dal viso i duri veli,</p>\n\t\t<p>s&igrave; ch&rsquo;&iuml;o sfoghi &rsquo;l duol che &rsquo;l cor m&rsquo;impregna,</p>\n\t\t<p>un poco, pria che &rsquo;l pianto si raggeli&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Per ch&rsquo;io a lui: &laquo;Se vuo&rsquo; ch&rsquo;i&rsquo; ti sovvegna,</p>\n\t\t<p>dimmi chi se&rsquo;, e s&rsquo;io non ti disbrigo,</p>\n\t\t<p>al fondo de la ghiaccia ir mi convegna&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Rispuose adunque: &laquo;I&rsquo; son frate Alberigo;</p>\n\t\t<p>i&rsquo; son quel da le frutta del mal orto,</p>\n\t\t<p>che qui riprendo dattero per figo&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Oh&raquo;, diss&rsquo; io lui, &laquo;or se&rsquo; tu ancor morto?&raquo;.</p>\n\t\t<p>Ed elli a me: &laquo;Come &rsquo;l mio corpo stea</p>\n\t\t<p>nel mondo s&ugrave;, nulla sc&iuml;enza porto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Cotal vantaggio ha questa Tolomea,</p>\n\t\t<p>che spesse volte l&rsquo;anima ci cade</p>\n\t\t<p>innanzi ch&rsquo;Atrop&ograve;s mossa le dea.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E perch&eacute; tu pi&ugrave; volentier mi rade</p>\n\t\t<p>le &rsquo;nvetr&iuml;ate lagrime dal volto,</p>\n\t\t<p>sappie che, tosto che l&rsquo;anima trade</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>come fec&rsquo; &iuml;o, il corpo suo l&rsquo;&egrave; tolto</p>\n\t\t<p>da un demonio, che poscia il governa</p>\n\t\t<p>mentre che &rsquo;l tempo suo tutto sia v&ograve;lto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ella ruina in s&igrave; fatta cisterna;</p>\n\t\t<p>e forse pare ancor lo corpo suso</p>\n\t\t<p>de l&rsquo;ombra che di qua dietro mi verna.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Tu &rsquo;l dei saper, se tu vien pur mo giuso:</p>\n\t\t<p>elli &egrave; ser Branca Doria, e son pi&ugrave; anni</p>\n\t\t<p>poscia passati ch&rsquo;el fu s&igrave; racchiuso&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Io credo&raquo;, diss&rsquo; io lui, &laquo;che tu m&rsquo;inganni;</p>\n\t\t<p>ch&eacute; Branca Doria non mor&igrave; unquanche,</p>\n\t\t<p>e mangia e bee e dorme e veste panni&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Nel fosso s&ugrave;&raquo;, diss&rsquo; el, &laquo;de&rsquo; Malebranche,</p>\n\t\t<p>l&agrave; dove bolle la tenace pece,</p>\n\t\t<p>non era ancora giunto Michel Zanche,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che questi lasci&ograve; il diavolo in sua vece</p>\n\t\t<p>nel corpo suo, ed un suo prossimano</p>\n\t\t<p>che &rsquo;l tradimento insieme con lui fece.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ma distendi oggimai in qua la mano;</p>\n\t\t<p>aprimi li occhi&raquo;. E io non gliel&rsquo; apersi;</p>\n\t\t<p>e cortesia fu lui esser villano.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ahi Genovesi, uomini diversi</p>\n\t\t<p>d&rsquo;ogne costume e pien d&rsquo;ogne magagna,</p>\n\t\t<p>perch&eacute; non siete voi del mondo spersi?</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ch&eacute; col peggiore spirto di Romagna</p>\n\t\t<p>trovai di voi un tal, che per sua opra</p>\n\t\t<p>in anima in Cocito gi&agrave; si bagna,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e in corpo par vivo ancor di sopra.</p>\n\t\t</div>','<p class="cantohead">34</p>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Vexilla regis prodeunt inferni</p>\n\t\t<p>verso di noi; per&ograve; dinanzi mira&raquo;,</p>\n\t\t<p>disse &rsquo;l maestro mio, &laquo;se tu &rsquo;l discerni&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Come quando una grossa nebbia spira,</p>\n\t\t<p>o quando l&rsquo;emisperio nostro annotta,</p>\n\t\t<p>par di lungi un molin che &rsquo;l vento gira,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>veder mi parve un tal dificio allotta;</p>\n\t\t<p>poi per lo vento mi ristrinsi retro</p>\n\t\t<p>al duca mio, ch&eacute; non l&igrave; era altra grotta.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Gi&agrave; era, e con paura il metto in metro,</p>\n\t\t<p>l&agrave; dove l&rsquo;ombre tutte eran coperte,</p>\n\t\t<p>e trasparien come festuca in vetro.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Altre sono a giacere; altre stanno erte,</p>\n\t\t<p>quella col capo e quella con le piante;</p>\n\t\t<p>altra, com&rsquo; arco, il volto a&rsquo; pi&egrave; rinverte.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quando noi fummo fatti tanto avante,</p>\n\t\t<p>ch&rsquo;al mio maestro piacque di mostrarmi</p>\n\t\t<p>la creatura ch&rsquo;ebbe il bel sembiante,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>d&rsquo;innanzi mi si tolse e f&eacute; restarmi,</p>\n\t\t<p>&laquo;Ecco Dite&raquo;, dicendo, &laquo;ed ecco il loco</p>\n\t\t<p>ove convien che di fortezza t&rsquo;armi&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Com&rsquo; io divenni allor gelato e fioco,</p>\n\t\t<p>nol dimandar, lettor, ch&rsquo;i&rsquo; non lo scrivo,</p>\n\t\t<p>per&ograve; ch&rsquo;ogne parlar sarebbe poco.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io non mori&rsquo; e non rimasi vivo;</p>\n\t\t<p>pensa oggimai per te, s&rsquo;hai fior d&rsquo;ingegno,</p>\n\t\t<p>qual io divenni, d&rsquo;uno e d&rsquo;altro privo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo &rsquo;mperador del doloroso regno</p>\n\t\t<p>da mezzo &rsquo;l petto uscia fuor de la ghiaccia;</p>\n\t\t<p>e pi&ugrave; con un gigante io mi convegno,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>che i giganti non fan con le sue braccia:</p>\n\t\t<p>vedi oggimai quant&rsquo; esser dee quel tutto</p>\n\t\t<p>ch&rsquo;a cos&igrave; fatta parte si confaccia.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>S&rsquo;el fu s&igrave; bel com&rsquo; elli &egrave; ora brutto,</p>\n\t\t<p>e contra &rsquo;l suo fattore alz&ograve; le ciglia,</p>\n\t\t<p>ben dee da lui procedere ogne lutto.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Oh quanto parve a me gran maraviglia</p>\n\t\t<p>quand&rsquo; io vidi tre facce a la sua testa!</p>\n\t\t<p>L&rsquo;una dinanzi, e quella era vermiglia;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>l&rsquo;altr&rsquo; eran due, che s&rsquo;aggiugnieno a questa</p>\n\t\t<p>sovresso &rsquo;l mezzo di ciascuna spalla,</p>\n\t\t<p>e s&eacute; giugnieno al loco de la cresta:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e la destra parea tra bianca e gialla;</p>\n\t\t<p>la sinistra a vedere era tal, quali</p>\n\t\t<p>vegnon di l&agrave; onde &rsquo;l Nilo s&rsquo;avvalla.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Sotto ciascuna uscivan due grand&rsquo; ali,</p>\n\t\t<p>quanto si convenia a tanto uccello:</p>\n\t\t<p>vele di mar non vid&rsquo; io mai cotali.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non avean penne, ma di vispistrello</p>\n\t\t<p>era lor modo; e quelle svolazzava,</p>\n\t\t<p>s&igrave; che tre venti si movean da ello:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>quindi Cocito tutto s&rsquo;aggelava.</p>\n\t\t<p>Con sei occhi piang\xEBa, e per tre menti</p>\n\t\t<p>gocciava &rsquo;l pianto e sanguinosa bava.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Da ogne bocca dirompea co&rsquo; denti</p>\n\t\t<p>un peccatore, a guisa di maciulla,</p>\n\t\t<p>s&igrave; che tre ne facea cos&igrave; dolenti.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>A quel dinanzi il mordere era nulla</p>\n\t\t<p>verso &rsquo;l graffiar, che talvolta la schiena</p>\n\t\t<p>rimanea de la pelle tutta brulla.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Quell&rsquo; anima l&agrave; s&ugrave; c&rsquo;ha maggior pena&raquo;,</p>\n\t\t<p>disse &rsquo;l maestro, &laquo;&egrave; Giuda Scar&iuml;otto,</p>\n\t\t<p>che &rsquo;l capo ha dentro e fuor le gambe mena.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>De li altri due c&rsquo;hanno il capo di sotto,</p>\n\t\t<p>quel che pende dal nero ceffo &egrave; Bruto:</p>\n\t\t<p>vedi come si storce, e non fa motto!;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e l&rsquo;altro &egrave; Cassio, che par s&igrave; membruto.</p>\n\t\t<p>Ma la notte risurge, e oramai</p>\n\t\t<p>&egrave; da partir, ch&eacute; tutto avem veduto&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Com&rsquo; a lui piacque, il collo li avvinghiai;</p>\n\t\t<p>ed el prese di tempo e loco poste,</p>\n\t\t<p>e quando l&rsquo;ali fuoro aperte assai,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>appigli&ograve; s&eacute; a le vellute coste;</p>\n\t\t<p>di vello in vello gi&ugrave; discese poscia</p>\n\t\t<p>tra &rsquo;l folto pelo e le gelate croste.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Quando noi fummo l&agrave; dove la coscia</p>\n\t\t<p>si volge, a punto in sul grosso de l&rsquo;anche,</p>\n\t\t<p>lo duca, con fatica e con angoscia,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>volse la testa ov&rsquo; elli avea le zanche,</p>\n\t\t<p>e aggrappossi al pel com&rsquo; om che sale,</p>\n\t\t<p>s&igrave; che &rsquo;n inferno i&rsquo; credea tornar anche.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Attienti ben, ch&eacute; per cotali scale&raquo;,</p>\n\t\t<p>disse &rsquo;l maestro, ansando com&rsquo; uom lasso,</p>\n\t\t<p>&laquo;conviensi dipartir da tanto male&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Poi usc&igrave; fuor per lo f&oacute;ro d&rsquo;un sasso</p>\n\t\t<p>e puose me in su l&rsquo;orlo a sedere;</p>\n\t\t<p>appresso porse a me l&rsquo;accorto passo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Io levai li occhi e credetti vedere</p>\n\t\t<p>Lucifero com&rsquo; io l&rsquo;avea lasciato,</p>\n\t\t<p>e vidili le gambe in s&ugrave; tenere;</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e s&rsquo;io divenni allora travagliato,</p>\n\t\t<p>la gente grossa il pensi, che non vede</p>\n\t\t<p>qual &egrave; quel punto ch&rsquo;io avea passato.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;L&egrave;vati s&ugrave;&raquo;, disse &rsquo;l maestro, &laquo;in piede:</p>\n\t\t<p>la via &egrave; lunga e &rsquo;l cammino &egrave; malvagio,</p>\n\t\t<p>e gi&agrave; il sole a mezza terza riede&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Non era camminata di palagio</p>\n\t\t<p>l&agrave; &rsquo;v&rsquo; eravam, ma natural burella</p>\n\t\t<p>ch&rsquo;avea mal suolo e di lume disagio.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>&laquo;Prima ch&rsquo;io de l&rsquo;abisso mi divella,</p>\n\t\t<p>maestro mio&raquo;, diss&rsquo; io quando fui dritto,</p>\n\t\t<p>&laquo;a trarmi d&rsquo;erro un poco mi favella:</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>ov&rsquo; &egrave; la ghiaccia? e questi com&rsquo; &egrave; fitto</p>\n\t\t<p>s&igrave; sottosopra? e come, in s&igrave; poc&rsquo; ora,</p>\n\t\t<p>da sera a mane ha fatto il sol tragitto?&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Ed elli a me: &laquo;Tu imagini ancora</p>\n\t\t<p>d&rsquo;esser di l&agrave; dal centro, ov&rsquo; io mi presi</p>\n\t\t<p>al pel del vermo reo che &rsquo;l mondo f&oacute;ra.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Di l&agrave; fosti cotanto quant&rsquo; io scesi;</p>\n\t\t<p>quand&rsquo; io mi volsi, tu passasti &rsquo;l punto</p>\n\t\t<p>al qual si traggon d&rsquo;ogne parte i pesi.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E se&rsquo; or sotto l&rsquo;emisperio giunto</p>\n\t\t<p>ch&rsquo;&egrave; contraposto a quel che la gran secca</p>\n\t\t<p>coverchia, e sotto &rsquo;l cui colmo consunto</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>fu l&rsquo;uom che nacque e visse sanza pecca;</p>\n\t\t<p>tu ha&iuml; i piedi in su picciola spera</p>\n\t\t<p>che l&rsquo;altra faccia fa de la Giudecca.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Qui &egrave; da man, quando di l&agrave; &egrave; sera;</p>\n\t\t<p>e questi, che ne f&eacute; scala col pelo,</p>\n\t\t<p>fitto &egrave; ancora s&igrave; come prim&rsquo; era.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Da questa parte cadde gi&ugrave; dal cielo;</p>\n\t\t<p>e la terra, che pria di qua si sporse,</p>\n\t\t<p>per paura di lui f&eacute; del mar velo,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>e venne a l&rsquo;emisperio nostro; e forse</p>\n\t\t<p>per fuggir lui lasci&ograve; qui loco v&ograve;to</p>\n\t\t<p>quella ch&rsquo;appar di qua, e s&ugrave; ricorse&raquo;.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Luogo &egrave; l&agrave; gi&ugrave; da Belzeb&ugrave; remoto</p>\n\t\t<p>tanto quanto la tomba si distende,</p>\n\t\t<p>che non per vista, ma per suono &egrave; noto</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>d&rsquo;un ruscelletto che quivi discende</p>\n\t\t<p>per la buca d&rsquo;un sasso, ch&rsquo;elli ha roso,</p>\n\t\t<p>col corso ch&rsquo;elli avvolge, e poco pende.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>Lo duca e io per quel cammino ascoso</p>\n\t\t<p>intrammo a ritornar nel chiaro mondo;</p>\n\t\t<p>e sanza cura aver d&rsquo;alcun riposo,</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>salimmo s&ugrave;, el primo e io secondo,</p>\n\t\t<p>tanto ch&rsquo;i&rsquo; vidi de le cose belle</p>\n\t\t<p>che porta &rsquo;l ciel, per un pertugio tondo.</p>\n\t\t</div>\n\t\t<div class="stanza">\n\t\t\t<p>E quindi uscimmo a riveder le stelle.</p>\n\t\t</div>']};

},{}],8:[function(require,module,exports){
// inferno/longfellow.js

},{}],9:[function(require,module,exports){
// norton.js

},{}],10:[function(require,module,exports){
// version 4: now going to ES6 & Babel

"use strict";

var Hammer = require("hammerjs");
var Fastclick = require("fastclick");
var Velocity = require("velocity-animate");

var dom = require("./dom");
var appdata = require("./appdata");

var app = {
	initialize: function initialize() {
		console.log("initializing!");
		this.bindEvents();

		// check to see if there are saved localstorage, if so, take those values
	},
	bindEvents: function bindEvents() {
		console.log("binding events!");
		var testapp = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
		var testcordova = !(window.cordova === undefined); // need this as well for dev
		if (testapp && testcordova) {
			document.addEventListener('deviceready', app.onDeviceReady, false);
		} else {
			app.setup();
		}

		window.addEventListener("resize", this.resize, false);

		// start fastclick

		if ('addEventListener' in document) {
			document.addEventListener('DOMContentLoaded', function () {
				Fastclick(document.body);
			}, false);
		}
	},
	helpers: {

		// this wouldn't work as a real module! refactor?

		gosettings: function gosettings(element) {
			element.onclick = function () {
				app.setpage("settings");
			};
		},
		setupnote: function setupnote(el) {
			el.onclick = function (e) {
				e.stopPropagation();

				var thisnote = this.getAttribute("data-notenumber");
				var notetext = document.querySelector(".notetext[data-notenumber=\"" + thisnote + "\"]").innerHTML;
				app.hidenotes();
				var insert = dom.create("<div class=\"notewindow\" id=\"notewindow\">\n\t\t\t\t\t\t" + notetext + "\n\t\t\t\t\t</div>");
				appdata.elements.main.appendChild(insert);
				document.getElementById("notewindow").onclick = function () {
					app.hidenotes();
				};
			};
		},
		checkboxgo: function checkboxgo(el) {
			el.onclick = function () {
				app.changetranslation(this.id.replace("check-", ""), document.getElementById(this.id).checked);
			};
		},
		checkboxspango: function checkboxspango(el) {
			el.onclick = function () {
				document.getElementById("check-" + this.id).checked = !document.getElementById("check-" + this.id).checked;
				app.changetranslation(this.id, document.getElementById("check-" + this.id).checked);
			};
		}
	},
	setupcontrols: function setupcontrols() {

		// button controls
		document.getElementById("navprev").onclick = function () {
			app.setlens(app.nexttrans(appdata.currenttranslation), appdata.currentcanto);
		};
		document.getElementById("navnext").onclick = function () {
			app.setlens(app.prevtrans(appdata.currenttranslation), appdata.currentcanto);
		};
		document.getElementById("navup").onclick = function () {
			app.setlens(appdata.currenttranslation, appdata.currentcanto - 1, 0);
		};
		document.getElementById("navdown").onclick = function () {
			app.setlens(appdata.currenttranslation, appdata.currentcanto + 1, 0);
		};
		// initial settings

		document.getElementById("aboutlink").onclick = function () {
			app.setpage("about");
		};
		document.getElementById("helplink").onclick = function () {
			app.setpage("help");
		};
		document.getElementById("daymode").onclick = function () {
			dom.removeclass("body", "nightmode");
			dom.addclass("#nightmode", "off");
			dom.removeclass("#daymode", "off");
			appdata.nightmode = false;
		};
		document.querySelector("#nightmode").onclick = function () {
			dom.addclass("body", "nightmode");
			dom.removeclass("#nightmode", "off");
			dom.addclass("#daymode", "off");
			appdata.nightmode = true;
		};

		// document.querySelectorAll(".backtosettings").forEach(app.helpers.gosettings);

		// or try something like this: Array.from(querySelectorAll('img')).forEach(img => doStuff);


		var backtosettings = document.querySelectorAll(".backtosettings");
		for (var i = 0; i < backtosettings.length; ++i) {
			app.helpers.gosettings(backtosettings[i]);
		}

		// swipe controls

		var hammertime = new Hammer(appdata.elements.lens); // does this need to be a global?
		hammertime.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
		hammertime.on('swipeleft', function (e) {
			e.preventDefault(); // attempt to fix android swipe down = reload behavior
			app.setlens(app.nexttrans(appdata.currenttranslation), appdata.currentcanto);
		}).on('swiperight', function (e) {
			app.setlens(app.prevtrans(appdata.currenttranslation), appdata.currentcanto);
		});

		hammertime.on('swipedown', function (e) {
			e.preventDefault(); // attempt to fix android swipe down = reload behavior
			if (appdata.elements.text.scollTop === 0) {
				app.setlens(appdata.currenttranslation, appdata.currentcanto - 1, 1); // this needs to be at the bottom!
			}
		}).on('swipeup', function (e) {
			// if difference between current scroll position + height of frame & complete height
			// of column is less than 8, go to the next one
			if (Math.abs(appdata.elements.text.scrollTop + appdata.elements.text.clientHeight - appdata.elements.text.scrollHeight) < 4) {
				app.setlens(appdata.currenttranslation, appdata.currentcanto + 1);
			}
		});

		// key controls

		document.body.onkeydown = function (e) {
			e.preventDefault();
			if ((e.keyCode || e.which) === 37) {
				dom.addclass("#navprev", "on");
				app.setlens(app.prevtrans(appdata.currenttranslation), appdata.currentcanto);
			}
			if ((e.keyCode || e.which) === 39) {
				dom.addclass("#navnext", "on");
				app.setlens(app.nexttrans(appdata.currenttranslation), appdata.currentcanto);
			}
			if ((e.keyCode || e.which) === 38) {
				dom.addclass("#navup", "on");
				app.setlens(appdata.currenttranslation, appdata.currentcanto - 1);
			}
			if ((e.keyCode || e.which) === 40) {
				dom.addclass("#navdown", "on");
				app.setlens(appdata.currenttranslation, appdata.currentcanto + 1, 0);
			}
		};
		document.body.onkeyup = function (e) {
			e.preventDefault();
			dom.removeclass(".button", "on");
		};

		// page controls

		document.querySelector("#navtitle").onclick = function () {
			app.setpage("lens");
		};
		document.querySelector("#navsettings").onclick = function () {
			if (appdata.currentpage == "settings") {
				//      if(appdata.currenttranslationlist.indexOf(appdata.translationdata[appdata.currenttranslation].translationid) > -1 ) {}
				app.setpage("lens");
			} else {
				app.updatesettings();
				app.setpage("settings");
			}
		};
		appdata.elements.main.onclick = function () {
			app.hidenotes();
		};
	},
	setupnotes: function setupnotes() {
		var count = 0;
		var notes = document.querySelectorAll(".note");

		for (var i = 0; i < notes.length; i++) {
			var children = notes[i].children;
			for (var j = 0; j < children.length; j++) {
				if (dom.hasclass(children[j], "notetext")) {
					children[j].setAttribute("data-notenumber", count);
				}
				if (dom.hasclass(children[j], "noteno")) {
					children[j].setAttribute("data-notenumber", count);
					app.helpers.setupnote(children[j]);
				}
			}
			count++;
		}
	},
	resize: function resize() {

		console.log("Navbar: " + document.getElementById("navbar").clientWidth);
		console.log("Navtitle: " + document.getElementById("navtitle").clientWidth);
		console.log("button width: " + document.getElementById("navprev").clientWidth);

		appdata.windowwidth = window.innerWidth;
		appdata.windowheight = window.innerHeight;
		var titlewidth = document.getElementById("navbar").clientWidth - 5 * 40;

		console.log("titlewidth: " + titlewidth);

		document.getElementById("navtitle").style.width = titlewidth + "px";
		document.getElementById("navtitle").setAttribute("style", "width:" + titlewidth + "px");

		console.log("The window has been resized! New width: " + appdata.windowwidth + "," + appdata.windowheight);
		appdata.lenswidth = appdata.windowwidth;
		appdata.lensheight = appdata.windowheight - document.getElementById("navbar").clientHeight;

		dom.addclass(".page", appdata.lenswidth > appdata.lensheight ? "landscape" : "portrait");
		dom.removeclass(".page", appdata.lenswidth > appdata.lensheight ? "portrait" : "landscape");
		/*
  		appdata.elements.main.style.width = appdata.lenswidth+"px";
  		appdata.elements.content.style.width = appdata.lenswidth+"px";
  */
		appdata.elements.main.style.height = appdata.windowheight + "px";
		appdata.elements.content.style.height = appdata.lensheight + "px";

		if (appdata.responsive) {
			if (appdata.windowwidth < 640) {
				appdata.lineheight = 20;
			} else {
				if (appdata.windowwidth < 768) {
					appdata.lineheight = 24;
				} else {
					if (appdata.windowwidth < 1024) {
						appdata.lineheight = 28;
					} else {
						appdata.lineheight = 32;
					}
				}
			}
		} else {
			appdata.lineheight = appdata.windowwidth / 25;
		}

		appdata.textwidth = appdata.windowwidth;
		app.setlens(appdata.currenttranslation, appdata.currentcanto);
	},
	nexttrans: function nexttrans(giventranslation) {
		if (appdata.currenttranslationlist.length > 1) {
			if (appdata.currenttranslationlist.indexOf(giventranslation) + 1 == appdata.currenttranslationlist.length) {
				return appdata.currenttranslationlist[0];
			} else {
				return appdata.currenttranslationlist[appdata.currenttranslationlist.indexOf(giventranslation) + 1];
			}
		} else {
			return giventranslation;
		}
	},
	prevtrans: function prevtrans(giventranslation) {
		if (appdata.currenttranslationlist.length > 1) {
			if (appdata.currenttranslationlist.indexOf(giventranslation) == 0) {
				return appdata.currenttranslationlist[appdata.currenttranslationlist.length - 1];
			} else {
				return appdata.currenttranslationlist[appdata.currenttranslationlist.indexOf(giventranslation) - 1];
			}
		} else {
			return giventranslation;
		}
	},
	setlens: function setlens(newtrans, newcanto, percentage) {
		console.log("\nSetlens called for " + newtrans + ", canto " + newcanto);
		dom.removebyselector("#oldtext"); // attempt to fix flickering if too fast change

		var changetrans = false;
		var oldindex = appdata.currenttranslationlist.indexOf(appdata.currenttranslation); // the number of the old translation
		var newindex = appdata.currenttranslationlist.indexOf(newtrans); // the number of the trans we're going to

		if (appdata.currentpage == "lens") {

			// if page isn't set to "lens" this doesn't do anything

			if (newindex - oldindex !== 0) {
				changetrans = true;
				percentage = appdata.elements.text.scrollTop /*+ appdata.elements.text.clientHeight*/ / appdata.elements.text.scrollHeight;
				console.log("\u2014>Current percentage: " + percentage);
			}

			if (newcanto >= appdata.cantocount) {
				newcanto = 0;
			} else {
				if (newcanto < 0) {
					newcanto = appdata.cantocount - 1;
				}
			}

			// need to figure which translationdata we need

			var newdata = 0;
			var olddata = 0;

			for (var j in appdata.translationdata) {
				if (newtrans == appdata.translationdata[j].translationid) {
					newdata = j;
				}
				if (appdata.currenttranslation == appdata.translationdata[j].translationid) {
					olddata = j;
				}
			}

			if (newindex !== oldindex) {

				// console.log("Change in translation!");

				appdata.elements.text.id = "oldtext";
				appdata.elements.textinsideframe.id = "oldtextinsideframe";

				// if new is bigger than old AND ( old is not 0 OR new is not the last one )
				// OR if new is 0 and old is the last one

				if (newindex > oldindex && (oldindex > 0 || newindex !== appdata.currenttranslationlist.length - 1) || newindex == 0 && oldindex == appdata.currenttranslationlist.length - 1) {

					// console.log("Going right");  // we are inserting to the right

					var insert = dom.create("<div id=\"text\" class=\"textframe " + appdata.translationdata[newdata].translationclass + "\" style=\"left:100%;\"><div class=\"textinsideframe\" id=\"textinsideframe\">" + appdata.textdata[newdata].text[newcanto] + "</div></div>");
					appdata.elements.slider.appendChild(insert);
					Velocity(appdata.elements.slider, { 'left': "-100%" }, {
						duration: appdata.delay,
						mobileHA: false,
						complete: function complete() {
							dom.removebyselector("#oldtext");
							appdata.elements.slider.style.left = "0";
							appdata.elements.text.style.left = "0";
						}
					});
				} else {

					// console.log("Going left"); // we are inserting to the left

					var _insert = dom.create("<div id=\"text\" class=\"textframe " + appdata.translationdata[newdata].translationclass + "\" style=\"left:-100%;\"><div class=\"textinsideframe\" id=\"textinsideframe\">" + appdata.textdata[newdata].text[newcanto] + "</div></div>");
					appdata.elements.slider.insertBefore(_insert, appdata.elements.slider.childNodes[0]);
					Velocity(appdata.elements.slider, { 'left': "100%" }, {
						duration: appdata.delay,
						mobileHA: false,
						complete: function complete() {
							dom.removebyselector("#oldtext");
							appdata.elements.slider.style.left = "0";
							appdata.elements.text.style.left = "0";
						}
					});
				}
				appdata.elements.text = document.getElementById("text");
				appdata.elements.textinsideframe = document.getElementById("textinsideframe");
			} else {

				// console.log("No change in translation!"); // not shift left/shift right – do normal thing

				for (var _j in appdata.translationdata) {
					if (newtrans == appdata.translationdata[_j].translationid) {
						newdata = _j;
					}
					if (appdata.currenttranslation == appdata.translationdata[_j].translationid) {
						olddata = _j;
					}
				}

				appdata.elements.textinsideframe.innerHTML = appdata.textdata[newdata].text[newcanto];
				dom.removeclass("#text", appdata.translationdata[olddata].translationclass); // is this not working for multiple classes?
				dom.addclass("#text", appdata.translationdata[newdata].translationclass); // is this not working for multiple classes?
			}

			app.setupnotes();
			appdata.currenttranslation = newtrans;
			appdata.currentcanto = newcanto;

			if (appdata.responsive) {
				app.fixpaddingresponsive();
			} else {
				app.fixpadding();
			}

			// set percentage: this is terrible! fix this!
			// first: try to figure out how many lines we have? Can we do that?

			if (changetrans) {

				// this method still isn't great! it tries to round to current lineheight
				// to avoid cutting off lines

				var scrollto = app.rounded(percentage * appdata.elements.text.scrollHeight);
				appdata.elements.text.scrollTop = scrollto;
			} else {
				if (percentage > 0) {
					appdata.elements.text.scrollTop = appdata.elements.text.scrollHeight;
				} else {
					appdata.elements.text.scrollTop = 0;
				}
			}

			if (appdata.currentcanto > 0) {
				document.getElementById("navtitle").innerHTML = appdata.translationdata[newdata].translationshortname + " \xB7 <strong>Canto " + appdata.currentcanto + "</strong>";
			} else {
				document.getElementById("navtitle").innerHTML = "&nbsp;";
			}
		}
		app.savecurrentdata();
	},
	rounded: function rounded(pixels) {

		// this is still a mess, fix this

		return appdata.lineheight * Math.floor(pixels / appdata.lineheight);
	},
	fixpadding: function fixpadding() {
		var divs = document.querySelectorAll("#text p");
		var div, padding, desiredwidth;
		var maxwidth = 0;

		if (dom.hasclass(appdata.elements.text, "poetry")) {

			// this is poetry, figure out longest line

			appdata.elements.text.style.paddingLeft = 0;
			for (var i = 0; i < divs.length; i++) {
				div = divs[i];
				div.style.display = "inline-block";
				if (div.clientWidth > maxwidth) {
					maxwidth = div.clientWidth + 90;
				}
				div.style.display = "block";
			}

			console.log("—>text width: " + appdata.textwidth);
			console.log("—>max width: " + maxwidth);

			appdata.elements.text.style.paddingLeft = (appdata.textwidth - maxwidth) / 2 + "px";
			appdata.elements.text.style.paddingRight = (appdata.textwidth - maxwidth) / 2 + "px";
		} else {

			// this is prose, standardized padding

			desiredwidth = 75; // this is in vw

			console.log("—>text width: " + appdata.textwidth);
			console.log("—>desired width: " + desiredwidth);
			console.log("—>lineheight: " + appdata.lineheight);

			//		console.log(lenswidth + " "+desiredwidth);
			//		var padding = (lenswidth - desiredwidth)/2;

			padding = (100 - desiredwidth) / 2;
			/*
   if((desiredwidth + 2) > lenswidth) {
   	appdata.elements.text.style.paddingLeft = "1vw";
   	appdata.elements.text.style.paddingRight = "1vw";
   } else {
   	*/
			appdata.elements.text.style.paddingLeft = padding + "vw";
			appdata.elements.text.style.paddingRight = padding + "vw";
			//		}
		}
	},
	fixpaddingresponsive: function fixpaddingresponsive() {
		var divs = document.querySelectorAll("#text p");
		var div;
		var maxwidth = 0;

		if (dom.hasclass(appdata.elements.text, "poetry")) {

			// this is poetry, figure out longest line

			appdata.elements.text.style.paddingLeft = 0;
			appdata.elements.text.style.paddingRight = 0;
			appdata.elements.textinsideframe.style.marginLeft = 0;
			appdata.elements.textinsideframe.style.marginRight = 0;
			appdata.elements.textinsideframe.style.paddingLeft = 0;
			appdata.elements.textinsideframe.style.paddingRight = 0;
			for (var i = 0; i < divs.length; i++) {
				div = divs[i];
				div.style.display = "inline-block";

				// this is not picking up indents, I think – maybe div.clientWidth + (div.style.marginLeft + div.style.textIndent)

				if (div.clientWidth > maxwidth) {
					maxwidth = div.clientWidth + 90;
				}
				div.style.display = "block";
			}

			if (appdata.textwidth - 16 > maxwidth) {
				console.log("Text width: " + appdata.textwidth + "; max line width: " + maxwidth + "; calculated padding: " + (appdata.textwidth - maxwidth - 16 - 16) / 2 + "px");
				appdata.elements.text.style.paddingLeft = 0;
				appdata.elements.text.style.paddingRight = 0;
				appdata.elements.textinsideframe.style.paddingLeft = 0;
				appdata.elements.textinsideframe.style.paddingRight = 0;
				appdata.elements.textinsideframe.style.marginLeft = (appdata.textwidth - maxwidth - 16 - 16) / 2 + "px";
				appdata.elements.textinsideframe.style.marginRight = (appdata.textwidth - maxwidth - 16 - 16) / 2 + "px";
			} else {
				console.log("Too wide! Text width: " + appdata.textwidth + "; max line width: " + maxwidth + ".");
				appdata.elements.text.style.paddingLeft = 8 + "px";
				appdata.elements.text.style.paddingRight = 8 + "px";
				appdata.elements.textinsideframe.style.marginLeft = 0;
				appdata.elements.textinsideframe.style.marginRight = 0;
			}
		} else {
			console.log("Prose, not doing anything.");
		}
	},
	hidenotes: function hidenotes() {
		dom.removebyselector(".notewindow");
	},
	updatesettings: function updatesettings() {

		// add in translation chooser

		dom.removebyselector("#translatorlist");
		var insert = dom.create('<ul id="translatorlist"></ul>');
		document.getElementById("translationchoose").appendChild(insert);
		var translatorlist = document.querySelector("#translatorlist");
		for (var i in appdata.translationdata) {
			insert = dom.create("<li>\n\t\t\t\t\t\t<input type=\"checkbox\" id=\"check-" + appdata.translationdata[i].translationid + "\" />\n\t\t\t\t\t\t<label for=\"" + appdata.translationdata[i].translationid + "\" id=\"" + appdata.translationdata[i].translationid + "\" ><span><span></span></span>" + appdata.translationdata[i].translationfullname + "</label>\n\t\t\t\t\t</li>");
			translatorlist.appendChild(insert);
			document.getElementById("check-" + appdata.translationdata[i].translationid).checked = appdata.currenttranslationlist.indexOf(appdata.translationdata[i].translationid) > -1;
		}

		//		for(let i of document.querySelectorAll("#translatorlist input[type=checkbox]")) {
		var inputcheckbox = document.querySelectorAll("#translatorlist input[type=checkbox]");
		for (var _i = 0; _i < inputcheckbox.length; _i++) {
			app.helpers.checkboxgo(inputcheckbox[_i]);
		}
		var translatorlistlabel = document.querySelectorAll("#translatorlist label");
		//		for(let i of document.querySelectorAll("#translatorlist label")) {
		for (var _i2 = 0; _i2 < translatorlistlabel.length; _i2++) {
			app.helpers.checkboxspango(translatorlistlabel[_i2]);
		}

		// add in toc

		dom.removebyselector("#selectors");
		insert = dom.create("<div id=\"selectors\">\n\t\t\t\t<p>Canto: <select id=\"selectcanto\"></select></p>\n\t\t\t\t<p>Translation: <select id=\"selecttranslator\"></select></p>\n\t\t\t\t<p><span id=\"selectgo\">Go</span></p>\n\t\t\t</div>");
		document.getElementById("translationgo").appendChild(insert);
		for (var _i3 = 0; _i3 < appdata.cantocount; _i3++) {
			insert = dom.create("<option id=\"canto" + _i3 + "\" " + (appdata.currentcanto == _i3 ? "selected" : "") + ">" + appdata.cantotitles[_i3] + "</option>");
			document.getElementById("selectcanto").appendChild(insert);
		}
		for (var _i4 in appdata.currenttranslationlist) {
			for (var j = 0; j < appdata.translationdata.length; j++) {
				if (appdata.translationdata[j].translationid == appdata.currenttranslationlist[_i4]) {
					insert = dom.create("<option id=\"tr_" + appdata.translationdata[j].translationid + "\" " + (appdata.currenttranslationlist.indexOf(appdata.currenttranslation) == _i4 ? "selected" : "") + ">" + appdata.translationdata[j].translationfullname + "</option>");
					document.getElementById("selecttranslator").appendChild(insert);
				}
			}
		}

		document.querySelector("#selectgo").onclick = function () {
			var selected = document.getElementById("selecttranslator");
			var thistrans = selected.options[selected.selectedIndex].id.substr(3);
			selected = document.getElementById("selectcanto");
			var thiscanto = selected.options[selected.selectedIndex].id.substr(5);
			for (var _j2 = 0; _j2 < appdata.translationdata.length; _j2++) {
				if (appdata.currenttranslationlist[_j2] == thistrans) {
					app.setpage("lens");
					app.setlens(appdata.currenttranslationlist[_j2], thiscanto, 0);
				}
			}
		};
	},
	savecurrentdata: function savecurrentdata() {

		// this should store appdate on localstorage (does that work for mobile?)
		// also if we're not on mobile, set canto/translation in hash


	},
	changetranslation: function changetranslation(thisid, isset) {
		for (var i in appdata.translationdata) {
			if (thisid == appdata.translationdata[i].translationid) {
				if (isset) {
					appdata.currenttranslationlist.push(thisid);
					appdata.translationcount++;
				} else {
					if (appdata.translationcount > 1) {
						var j = appdata.currenttranslationlist.indexOf(thisid);
						if (j > -1) {
							appdata.currenttranslationlist.splice(j, 1);
						}
						appdata.translationcount--;
					} else {
						// there's only one translation in the list, do not delete last
						document.getElementById("check-" + thisid.toLowerCase()).checked = true;
					}
				}
			}
			app.savecurrentdata();
		}

		var newlist = [];
		for (var _i5 in appdata.translationdata) {
			if (appdata.currenttranslationlist.indexOf(appdata.translationdata[_i5].translationid) > -1) {
				newlist.push(appdata.translationdata[_i5].translationid);
			}
		}
		appdata.currenttranslationlist = newlist.slice();

		if (appdata.currenttranslationlist.indexOf(appdata.currenttranslation) < 0) {
			appdata.currenttranslation = appdata.currenttranslationlist[0];
		}

		app.updatesettings();
	},
	setpage: function setpage(newpage) {
		dom.removeclass(".page", "on");
		dom.addclass(".page#" + newpage, "on");
		appdata.currentpage = newpage;
		if (newpage !== "lens") {
			// set title to be whatever the h1 is

			var newtitle = document.querySelector("#" + newpage + " h1").innerHTML;
			document.getElementById("navtitle").innerHTML = newtitle;
		} else {
			app.resize();
		}
	},
	onDeviceReady: function onDeviceReady() {
		appdata.oncordova = true; // we're running on cordova
		console.log("Device ready fired!");
		console.log(device.cordova);
		app.setup();
	},
	setup: function setup() {
		console.log("In setup");

		// basic doc setup

		appdata.elements.lens = document.getElementById("lens");
		appdata.elements.main = document.getElementById("main");
		appdata.elements.content = document.getElementById("content");
		appdata.elements.text = document.getElementById("text");
		appdata.elements.textinsideframe = document.getElementById("textinsideframe");
		appdata.elements.slider = document.getElementById("slider");

		// set up about page

		document.title = "Cross Dante " + appdata.booktitle;
		document.getElementById("abouttext").innerHTML = appdata.description;

		// set up current translation list (initially use all of them)

		for (var i in appdata.translationdata) {
			appdata.currenttranslationlist.push(appdata.translationdata[i].translationid);
			document.getElementById("textsources").innerHTML += "<li>" + appdata.translationdata[i].translationfullname + ", <em>" + appdata.translationdata[i].title + ":</em> " + appdata.translationdata[i].source + "</li>";
		}

		appdata.currenttranslation = appdata.currenttranslationlist[0];

		if (!appdata.oncordova) {
			// attempt to fix android pull down to refresh
			// code from http://stackoverflow.com/questions/29008194/disabling-androids-chrome-pull-down-to-refresh-feature
			window.addEventListener('load', function () {
				var maybePreventPullToRefresh = false;
				var lastTouchY = 0;
				var touchstartHandler = function touchstartHandler(e) {
					if (e.touches.length != 1) return;
					lastTouchY = e.touches[0].clientY;
					// Pull-to-refresh will only trigger if the scroll begins when the
					// document's Y offset is zero.
					maybePreventPullToRefresh = window.pageYOffset == 0;
				};

				var touchmoveHandler = function touchmoveHandler(e) {
					var touchY = e.touches[0].clientY;
					var touchYDelta = touchY - lastTouchY;
					lastTouchY = touchY;

					if (maybePreventPullToRefresh) {
						// To suppress pull-to-refresh it is sufficient to preventDefault the
						// first overscrolling touchmove.
						maybePreventPullToRefresh = false;
						if (touchYDelta > 0) {
							e.preventDefault();

							if (appdata.currentpage == "lens" && appdata.elements.text.scrollTop === 0) {
								app.setlens(appdata.currenttranslation, appdata.currentcanto - 1, 1);
							}
							return;
						}
					}
				};
				document.addEventListener('touchstart', touchstartHandler, false);
				document.addEventListener('touchmove', touchmoveHandler, false);
			});
		}

		app.setupnotes();
		app.setupcontrols();
		dom.addclass("body", appdata.bookname);
		dom.addclass("body", appdata.oncordova ? "cordova" : "web");
		dom.removebyselector("#loadingscrim");
		app.setpage("lens");
	}
};

module.exports = app;

},{"./appdata":11,"./dom":12,"fastclick":1,"hammerjs":2,"velocity-animate":3}],11:[function(require,module,exports){
"use strict";

// appdata.js

module.exports = {
	currenttranslationlist: [], // list of ids of translations we're currently using
	currenttranslation: "", // this was an index, changing it to a member of currenttranslationlist
	currentcanto: 0,
	lineheight: 24,
	lenswidth: window.innerWidth, // do these numbers dynamically update? This could be screwing us up.
	lensheight: window.innerHeight - 40,
	windowwidth: window.innerWidth,
	windowheight: window.innerHeight,
	textwidth: window.innerWidth,
	currentpage: "lens",
	nightmode: false,
	currentpercentage: 0, // this is current percentage of page (maybe this should be in terms of lines on page?)
	currentlines: 0, // this is the number of lines calculated to be on the page
	elements: {},
	delay: 600,
	responsive: true,
	oncordova: false
};

},{}],12:[function(require,module,exports){
// dom.js

"use strict";

var dom = {
	create: function create(htmlStr) {
		var frag = document.createDocumentFragment();
		var temp = document.createElement('div');
		temp.innerHTML = htmlStr;
		while (temp.firstChild) {
			frag.appendChild(temp.firstChild);
		}
		return frag;
	},
	removebyselector: function removebyselector(selectorstring) {
		var selector = document.querySelector(selectorstring);
		if (selector !== null) {
			selector.parentNode.removeChild(selector);
		}
	},
	addclass: function addclass(selectorstring, myclass) {
		var myelement = document.querySelectorAll(selectorstring);
		if (myclass.indexOf(" ") > -1) {
			var classes = myclass.split(" ");
			for (var j = 0; j < classes.length; j++) {
				dom.addclass(selectorstring, classes[j]);
			}
		} else {
			for (var i = 0; i < myelement.length; i++) {
				myelement[i].classList.add(myclass);
			}
		}
	},
	removeclass: function removeclass(selectorstring, myclass) {
		var myelement = document.querySelectorAll(selectorstring);
		if (myclass.indexOf(" ") > -1) {
			var classes = myclass.split(" ");
			for (var j = 0; j < classes.length; j++) {
				dom.removeclass(selectorstring, classes[j]);
			}
		} else {
			for (var i = 0; i < myelement.length; i++) {
				myelement[i].classList.remove(myclass);
			}
		}
	},
	hasclass: function hasclass(element, cls) {
		return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
	}
};

module.exports = dom;

},{}]},{},[4])