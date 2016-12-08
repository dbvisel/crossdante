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

		var hammertime = new Hammer(appdata.elements.lens, {
			touchAction: 'auto'
		}); // does this need to be a global?
		hammertime.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
		hammertime.on('swipeleft', function (e) {
			e.preventDefault(); // attempt to fix android swipe down = reload behavior
			app.setlens(app.nexttrans(appdata.currenttranslation), appdata.currentcanto);
		}).on('swiperight', function (e) {
			e.preventDefault(); // attempt to fix android swipe down = reload behavior
			app.setlens(app.prevtrans(appdata.currenttranslation), appdata.currentcanto);
		});

		hammertime.on('swipedown', function (e) {
			e.preventDefault(); // attempt to fix android swipe down = reload behavior
			console.log("swipe down called");
			if (appdata.elements.text.scollTop === 0) {
				app.setlens(appdata.currenttranslation, appdata.currentcanto - 1, 1); // this needs to be at the bottom!
			}
		}).on('swipeup', function (e) {
			e.preventDefault(); // attempt to fix android swipe down = reload behavior
			console.log("swipe up called");
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
				dom.addclass("#text", "makescroll");
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
		//		var platform = device.platform;
		//		console.log(platform);
		//		if(device.platform === "iOS") {
		//			var mytop = document.getElementById("navbar");
		//			mytop.style.backgroundColor = green;
		//		}
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

},{"./appdata":5,"./dom":6,"fastclick":1,"hammerjs":2,"velocity-animate":3}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
"use strict";

var app = require("./modules/app");
var bookdata = require("./paradiso/bookdata");
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

},{"./modules/app":4,"./modules/appdata":5,"./paradiso/bookdata":8}],8:[function(require,module,exports){
"use strict";

// the spine for the book

module.exports = {

	bookname: 'paradiso',
	booktitle: "Paradiso",
	bookauthor: "Dante Alighieri",
	description: "<p>The thrilling conclusion to <em>The Divine Comedy</em>.",

	cantotitles: [// this is canto sequence
	"Title page", "Canto 1", "Canto 2", "Canto 3", "Canto 4", "Canto 5", "Canto 6", "Canto 7", "Canto 8", "Canto 9", "Canto 10", "Canto 11", "Canto 12", "Canto 13", "Canto 14", "Canto 15", "Canto 16", "Canto 17", "Canto 18", "Canto 19", "Canto 20", "Canto 21", "Canto 22", "Canto 23", "Canto 24", "Canto 25", "Canto 26", "Canto 27", "Canto 28", "Canto 29", "Canto 30", "Canto 31", "Canto 32", "Canto 33"],

	translationdata: [// this is translation sequence
	{ "translationid": "dante",
		"order": 0 }, { "translationid": "longfellow",
		"order": 1 }, { "translationid": "cary",
		"order": 2 } /*,
               {"translationid":"wright",
               "order":3},
               {"translationid":"carlyle",
               "order":4}*/
	],

	textdata: [// set up translations
	require("./translations/dante"), require("./translations/longfellow"), require("./translations/cary") /*,
                                                                                                       require("./translations/norton"),
                                                                                                       require("./translations/wright"),
                                                                                                       require("./translations/carlyle")*/
	]
};

},{"./translations/cary":9,"./translations/dante":10,"./translations/longfellow":11}],9:[function(require,module,exports){
// inferno/cary.js
"use strict";module.exports={bookname:'paradiso',author:'Dante Alighieri',translationid:"cary",title:'Paradise',translation:true,source:'<a href="http://www.gutenberg.org/ebooks/1007">Project Gutenberg</a>',translationshortname:"Cary",translationfullname:"Henry Francis Cary",translationclass:"poetry",text:['<p class="title">Paradise</p>\n\t\t<p class="author">Henry Francis Cary</p>','<p class="cantohead">Canto I</p>\n<div class="stanza"><p>His glory, by whose might all things are mov&rsquo;d,</p>\n<p>Pierces the universe, and in one part</p>\n<p>Sheds more resplendence, elsewhere less. In heav&rsquo;n,</p>\n<p>That largeliest of his light partakes, was I,</p>\n<p>Witness of things, which to relate again</p>\n<p>Surpasseth power of him who comes from thence;</p>\n<p>For that, so near approaching its desire</p>\n<p>Our intellect is to such depth absorb&rsquo;d,</p>\n<p>That memory cannot follow. Nathless all,</p>\n<p>That in my thoughts I of that sacred realm</p>\n<p>Could store, shall now be matter of my song.</p>\n<p class="slindent">Benign Apollo! this last labour aid,</p>\n<p>And make me such a vessel of thy worth,</p>\n<p>As thy own laurel claims of me belov&rsquo;d.</p>\n<p>Thus far hath one of steep Parnassus&rsquo; brows</p>\n<p>Suffic&rsquo;d me; henceforth there is need of both</p>\n<p>For my remaining enterprise Do thou</p>\n<p>Enter into my bosom, and there breathe</p>\n<p>So, as when Marsyas by thy hand was dragg&rsquo;d</p>\n<p>Forth from his limbs unsheath&rsquo;d. O power divine!</p>\n<p>If thou to me of shine impart so much,</p>\n<p>That of that happy realm the shadow&rsquo;d form</p>\n<p>Trac&rsquo;d in my thoughts I may set forth to view,</p>\n<p>Thou shalt behold me of thy favour&rsquo;d tree</p>\n<p>Come to the foot, and crown myself with leaves;</p>\n<p>For to that honour thou, and my high theme</p>\n<p>Will fit me. If but seldom, mighty Sire!</p>\n<p>To grace his triumph gathers thence a wreath</p>\n<p>Caesar or bard (more shame for human wills</p>\n<p>Deprav&rsquo;d) joy to the Delphic god must spring</p>\n<p>From the Pierian foliage, when one breast</p>\n<p>Is with such thirst inspir&rsquo;d. From a small spark</p>\n<p>Great flame hath risen: after me perchance</p>\n<p>Others with better voice may pray, and gain</p>\n<p>From the Cirrhaean city answer kind.</p>\n<p class="slindent">Through diver passages, the world&rsquo;s bright lamp</p>\n<p>Rises to mortals, but through that which joins</p>\n<p>Four circles with the threefold cross, in best</p>\n<p>Course, and in happiest constellation set</p>\n<p>He comes, and to the worldly wax best gives</p>\n<p>Its temper and impression. Morning there,</p>\n<p>Here eve was by almost such passage made;</p>\n<p>And whiteness had o&rsquo;erspread that hemisphere,</p>\n<p>Blackness the other part; when to the left</p>\n<p>I saw Beatrice turn&rsquo;d, and on the sun</p>\n<p>Gazing, as never eagle fix&rsquo;d his ken.</p>\n<p>As from the first a second beam is wont</p>\n<p>To issue, and reflected upwards rise,</p>\n<p>E&rsquo;en as a pilgrim bent on his return,</p>\n<p>So of her act, that through the eyesight pass&rsquo;d</p>\n<p>Into my fancy, mine was form&rsquo;d; and straight,</p>\n<p>Beyond our mortal wont, I fix&rsquo;d mine eyes</p>\n<p>Upon the sun. Much is allowed us there,</p>\n<p>That here exceeds our pow&rsquo;r; thanks to the place</p>\n<p>Made for the dwelling of the human kind</p>\n<p class="slindent">I suffer&rsquo;d it not long, and yet so long</p>\n<p>That I beheld it bick&rsquo;ring sparks around,</p>\n<p>As iron that comes boiling from the fire.</p>\n<p>And suddenly upon the day appear&rsquo;d</p>\n<p>A day new-ris&rsquo;n, as he, who hath the power,</p>\n<p>Had with another sun bedeck&rsquo;d the sky.</p>\n<p class="slindent">Her eyes fast fix&rsquo;d on the eternal wheels,</p>\n<p>Beatrice stood unmov&rsquo;d; and I with ken</p>\n<p>Fix&rsquo;d upon her, from upward gaze remov&rsquo;d</p>\n<p>At her aspect, such inwardly became</p>\n<p>As Glaucus, when he tasted of the herb,</p>\n<p>That made him peer among the ocean gods;</p>\n<p>Words may not tell of that transhuman change:</p>\n<p>And therefore let the example serve, though weak,</p>\n<p>For those whom grace hath better proof in store</p>\n<p class="slindent">If I were only what thou didst create,</p>\n<p>Then newly, Love! by whom the heav&rsquo;n is rul&rsquo;d,</p>\n<p>Thou know&rsquo;st, who by thy light didst bear me up.</p>\n<p>Whenas the wheel which thou dost ever guide,</p>\n<p>Desired Spirit! with its harmony</p>\n<p>Temper&rsquo;d of thee and measur&rsquo;d, charm&rsquo;d mine ear,</p>\n<p>Then seem&rsquo;d to me so much of heav&rsquo;n to blaze</p>\n<p>With the sun&rsquo;s flame, that rain or flood ne&rsquo;er made</p>\n<p>A lake so broad. The newness of the sound,</p>\n<p>And that great light, inflam&rsquo;d me with desire,</p>\n<p>Keener than e&rsquo;er was felt, to know their cause.</p>\n<p class="slindent">Whence she who saw me, clearly as myself,</p>\n<p>To calm my troubled mind, before I ask&rsquo;d,</p>\n<p>Open&rsquo;d her lips, and gracious thus began:</p>\n<p>&ldquo;With false imagination thou thyself</p>\n<p>Mak&rsquo;st dull, so that thou seest not the thing,</p>\n<p>Which thou hadst seen, had that been shaken off.</p>\n<p>Thou art not on the earth as thou believ&rsquo;st;</p>\n<p>For light&rsquo;ning scap&rsquo;d from its own proper place</p>\n<p>Ne&rsquo;er ran, as thou hast hither now return&rsquo;d.&rdquo;</p>\n<p class="slindent">Although divested of my first-rais&rsquo;d doubt,</p>\n<p>By those brief words, accompanied with smiles,</p>\n<p>Yet in new doubt was I entangled more,</p>\n<p>And said: &ldquo;Already satisfied, I rest</p>\n<p>From admiration deep, but now admire</p>\n<p>How I above those lighter bodies rise.&rdquo;</p>\n<p class="slindent">Whence, after utt&rsquo;rance of a piteous sigh,</p>\n<p>She tow&rsquo;rds me bent her eyes, with such a look,</p>\n<p>As on her frenzied child a mother casts;</p>\n<p>Then thus began: &ldquo;Among themselves all things</p>\n<p>Have order; and from hence the form, which makes</p>\n<p>The universe resemble God. In this</p>\n<p>The higher creatures see the printed steps</p>\n<p>Of that eternal worth, which is the end</p>\n<p>Whither the line is drawn. All natures lean,</p>\n<p>In this their order, diversely, some more,</p>\n<p>Some less approaching to their primal source.</p>\n<p>Thus they to different havens are mov&rsquo;d on</p>\n<p>Through the vast sea of being, and each one</p>\n<p>With instinct giv&rsquo;n, that bears it in its course;</p>\n<p>This to the lunar sphere directs the fire,</p>\n<p>This prompts the hearts of mortal animals,</p>\n<p>This the brute earth together knits, and binds.</p>\n<p>Nor only creatures, void of intellect,</p>\n<p>Are aim&rsquo;d at by this bow; hut even those,</p>\n<p>That have intelligence and love, are pierc&rsquo;d.</p>\n<p>That Providence, who so well orders all,</p>\n<p>With her own light makes ever calm the heaven,</p>\n<p>In which the substance, that hath greatest speed,</p>\n<p>Is turn&rsquo;d: and thither now, as to our seat</p>\n<p>Predestin&rsquo;d, we are carried by the force</p>\n<p>Of that strong cord, that never looses dart,</p>\n<p>But at fair aim and glad. Yet is it true,</p>\n<p>That as ofttimes but ill accords the form</p>\n<p>To the design of art, through sluggishness</p>\n<p>Of unreplying matter, so this course</p>\n<p>Is sometimes quitted by the creature, who</p>\n<p>Hath power, directed thus, to bend elsewhere;</p>\n<p>As from a cloud the fire is seen to fall,</p>\n<p>From its original impulse warp&rsquo;d, to earth,</p>\n<p>By vicious fondness. Thou no more admire</p>\n<p>Thy soaring, (if I rightly deem,) than lapse</p>\n<p>Of torrent downwards from a mountain&rsquo;s height.</p>\n<p>There would in thee for wonder be more cause,</p>\n<p>If, free of hind&rsquo;rance, thou hadst fix&rsquo;d thyself</p>\n<p>Below, like fire unmoving on the earth.&rdquo;</p>\n<p class="slindent">So said, she turn&rsquo;d toward the heav&rsquo;n her face.</p>\n</div>','<p class="cantohead">Canto II</p>\n<div class="stanza"><p>All ye, who in small bark have following sail&rsquo;d,</p>\n<p>Eager to listen, on the advent&rsquo;rous track</p>\n<p>Of my proud keel, that singing cuts its way,</p>\n<p>Backward return with speed, and your own shores</p>\n<p>Revisit, nor put out to open sea,</p>\n<p>Where losing me, perchance ye may remain</p>\n<p>Bewilder&rsquo;d in deep maze. The way I pass</p>\n<p>Ne&rsquo;er yet was run: Minerva breathes the gale,</p>\n<p>Apollo guides me, and another Nine</p>\n<p>To my rapt sight the arctic beams reveal.</p>\n<p>Ye other few, who have outstretch&rsquo;d the neck.</p>\n<p>Timely for food of angels, on which here</p>\n<p>They live, yet never know satiety,</p>\n<p>Through the deep brine ye fearless may put out</p>\n<p>Your vessel, marking, well the furrow broad</p>\n<p>Before you in the wave, that on both sides</p>\n<p>Equal returns. Those, glorious, who pass&rsquo;d o&rsquo;er</p>\n<p>To Colchos, wonder&rsquo;d not as ye will do,</p>\n<p>When they saw Jason following the plough.</p>\n<p class="slindent">The increate perpetual thirst, that draws</p>\n<p>Toward the realm of God&rsquo;s own form, bore us</p>\n<p>Swift almost as the heaven ye behold.</p>\n<p class="slindent">Beatrice upward gaz&rsquo;d, and I on her,</p>\n<p>And in such space as on the notch a dart</p>\n<p>Is plac&rsquo;d, then loosen&rsquo;d flies, I saw myself</p>\n<p>Arriv&rsquo;d, where wond&rsquo;rous thing engag&rsquo;d my sight.</p>\n<p>Whence she, to whom no work of mine was hid,</p>\n<p>Turning to me, with aspect glad as fair,</p>\n<p>Bespake me: &ldquo;Gratefully direct thy mind</p>\n<p>To God, through whom to this first star we come.&rdquo;</p>\n<p class="slindent">Me seem&rsquo;d as if a cloud had cover&rsquo;d us,</p>\n<p>Translucent, solid, firm, and polish&rsquo;d bright,</p>\n<p>Like adamant, which the sun&rsquo;s beam had smit</p>\n<p>Within itself the ever-during pearl</p>\n<p>Receiv&rsquo;d us, as the wave a ray of light</p>\n<p>Receives, and rests unbroken. If I then</p>\n<p>Was of corporeal frame, and it transcend</p>\n<p>Our weaker thought, how one dimension thus</p>\n<p>Another could endure, which needs must be</p>\n<p>If body enter body, how much more</p>\n<p>Must the desire inflame us to behold</p>\n<p>That essence, which discovers by what means</p>\n<p>God and our nature join&rsquo;d! There will be seen</p>\n<p>That which we hold through faith, not shown by proof,</p>\n<p>But in itself intelligibly plain,</p>\n<p>E&rsquo;en as the truth that man at first believes.</p>\n<p class="slindent">I answered: &ldquo;Lady! I with thoughts devout,</p>\n<p>Such as I best can frame, give thanks to Him,</p>\n<p>Who hath remov&rsquo;d me from the mortal world.</p>\n<p>But tell, I pray thee, whence the gloomy spots</p>\n<p>Upon this body, which below on earth</p>\n<p>Give rise to talk of Cain in fabling quaint?&rdquo;</p>\n<p class="slindent">She somewhat smil&rsquo;d, then spake: &ldquo;If mortals err</p>\n<p>In their opinion, when the key of sense</p>\n<p>Unlocks not, surely wonder&rsquo;s weapon keen</p>\n<p>Ought not to pierce thee; since thou find&rsquo;st, the wings</p>\n<p>Of reason to pursue the senses&rsquo; flight</p>\n<p>Are short. But what thy own thought is, declare.&rdquo;</p>\n<p class="slindent">Then I: &ldquo;What various here above appears,</p>\n<p>Is caus&rsquo;d, I deem, by bodies dense or rare.&rdquo;</p>\n<p class="slindent">She then resum&rsquo;d: &ldquo;Thou certainly wilt see</p>\n<p>In falsehood thy belief o&rsquo;erwhelm&rsquo;d, if well</p>\n<p>Thou listen to the arguments, which I</p>\n<p>Shall bring to face it. The eighth sphere displays</p>\n<p>Numberless lights, the which in kind and size</p>\n<p>May be remark&rsquo;d of different aspects;</p>\n<p>If rare or dense of that were cause alone,</p>\n<p>One single virtue then would be in all,</p>\n<p>Alike distributed, or more, or less.</p>\n<p>Different virtues needs must be the fruits</p>\n<p>Of formal principles, and these, save one,</p>\n<p>Will by thy reasoning be destroy&rsquo;d. Beside,</p>\n<p>If rarity were of that dusk the cause,</p>\n<p>Which thou inquirest, either in some part</p>\n<p>That planet must throughout be void, nor fed</p>\n<p>With its own matter; or, as bodies share</p>\n<p>Their fat and leanness, in like manner this</p>\n<p>Must in its volume change the leaves. The first,</p>\n<p>If it were true, had through the sun&rsquo;s eclipse</p>\n<p>Been manifested, by transparency</p>\n<p>Of light, as through aught rare beside effus&rsquo;d.</p>\n<p>But this is not. Therefore remains to see</p>\n<p>The other cause: and if the other fall,</p>\n<p>Erroneous so must prove what seem&rsquo;d to thee.</p>\n<p>If not from side to side this rarity</p>\n<p>Pass through, there needs must be a limit, whence</p>\n<p>Its contrary no further lets it pass.</p>\n<p>And hence the beam, that from without proceeds,</p>\n<p>Must be pour&rsquo;d back, as colour comes, through glass</p>\n<p>Reflected, which behind it lead conceals.</p>\n<p>Now wilt thou say, that there of murkier hue</p>\n<p>Than in the other part the ray is shown,</p>\n<p>By being thence refracted farther back.</p>\n<p>From this perplexity will free thee soon</p>\n<p>Experience, if thereof thou trial make,</p>\n<p>The fountain whence your arts derive their streame.</p>\n<p>Three mirrors shalt thou take, and two remove</p>\n<p>From thee alike, and more remote the third.</p>\n<p>Betwixt the former pair, shall meet thine eyes;</p>\n<p>Then turn&rsquo;d toward them, cause behind thy back</p>\n<p>A light to stand, that on the three shall shine,</p>\n<p>And thus reflected come to thee from all.</p>\n<p>Though that beheld most distant do not stretch</p>\n<p>A space so ample, yet in brightness thou</p>\n<p>Will own it equaling the rest. But now,</p>\n<p>As under snow the ground, if the warm ray</p>\n<p>Smites it, remains dismantled of the hue</p>\n<p>And cold, that cover&rsquo;d it before, so thee,</p>\n<p>Dismantled in thy mind, I will inform</p>\n<p>With light so lively, that the tremulous beam</p>\n<p>Shall quiver where it falls. Within the heaven,</p>\n<p>Where peace divine inhabits, circles round</p>\n<p>A body, in whose virtue dies the being</p>\n<p>Of all that it contains. The following heaven,</p>\n<p>That hath so many lights, this being divides,</p>\n<p>Through different essences, from it distinct,</p>\n<p>And yet contain&rsquo;d within it. The other orbs</p>\n<p>Their separate distinctions variously</p>\n<p>Dispose, for their own seed and produce apt.</p>\n<p>Thus do these organs of the world proceed,</p>\n<p>As thou beholdest now, from step to step,</p>\n<p>Their influences from above deriving,</p>\n<p>And thence transmitting downwards. Mark me well,</p>\n<p>How through this passage to the truth I ford,</p>\n<p>The truth thou lov&rsquo;st, that thou henceforth alone,</p>\n<p>May&rsquo;st know to keep the shallows, safe, untold.</p>\n<p class="slindent">&ldquo;The virtue and motion of the sacred orbs,</p>\n<p>As mallet by the workman&rsquo;s hand, must needs</p>\n<p>By blessed movers be inspir&rsquo;d. This heaven,</p>\n<p>Made beauteous by so many luminaries,</p>\n<p>From the deep spirit, that moves its circling sphere,</p>\n<p>Its image takes an impress as a seal:</p>\n<p>And as the soul, that dwells within your dust,</p>\n<p>Through members different, yet together form&rsquo;d,</p>\n<p>In different pow&rsquo;rs resolves itself; e&rsquo;en so</p>\n<p>The intellectual efficacy unfolds</p>\n<p>Its goodness multiplied throughout the stars;</p>\n<p>On its own unity revolving still.</p>\n<p>Different virtue compact different</p>\n<p>Makes with the precious body it enlivens,</p>\n<p>With which it knits, as life in you is knit.</p>\n<p>From its original nature full of joy,</p>\n<p>The virtue mingled through the body shines,</p>\n<p>As joy through pupil of the living eye.</p>\n<p>From hence proceeds, that which from light to light</p>\n<p>Seems different, and not from dense or rare.</p>\n<p>This is the formal cause, that generates</p>\n<p>Proportion&rsquo;d to its power, the dusk or clear.&rdquo;</p>\n</div>','<p class="cantohead">Canto III</p>\n<div class="stanza"><p>That sun, which erst with love my bosom warm&rsquo;d</p>\n<p>Had of fair truth unveil&rsquo;d the sweet aspect,</p>\n<p>By proof of right, and of the false reproof;</p>\n<p>And I, to own myself convinc&rsquo;d and free</p>\n<p>Of doubt, as much as needed, rais&rsquo;d my head</p>\n<p>Erect for speech. But soon a sight appear&rsquo;d,</p>\n<p>Which, so intent to mark it, held me fix&rsquo;d,</p>\n<p>That of confession I no longer thought.</p>\n<p class="slindent">As through translucent and smooth glass, or wave</p>\n<p>Clear and unmov&rsquo;d, and flowing not so deep</p>\n<p>As that its bed is dark, the shape returns</p>\n<p>So faint of our impictur&rsquo;d lineaments,</p>\n<p>That on white forehead set a pearl as strong</p>\n<p>Comes to the eye: such saw I many a face,</p>\n<p>All stretch&rsquo;d to speak, from whence I straight conceiv&rsquo;d</p>\n<p>Delusion opposite to that, which rais&rsquo;d</p>\n<p>Between the man and fountain, amorous flame.</p>\n<p class="slindent">Sudden, as I perceiv&rsquo;d them, deeming these</p>\n<p>Reflected semblances to see of whom</p>\n<p>They were, I turn&rsquo;d mine eyes, and nothing saw;</p>\n<p>Then turn&rsquo;d them back, directed on the light</p>\n<p>Of my sweet guide, who smiling shot forth beams</p>\n<p>From her celestial eyes. &ldquo;Wonder not thou,&rdquo;</p>\n<p>She cry&rsquo;d, &ldquo;at this my smiling, when I see</p>\n<p>Thy childish judgment; since not yet on truth</p>\n<p>It rests the foot, but, as it still is wont,</p>\n<p>Makes thee fall back in unsound vacancy.</p>\n<p>True substances are these, which thou behold&rsquo;st,</p>\n<p>Hither through failure of their vow exil&rsquo;d.</p>\n<p>But speak thou with them; listen, and believe,</p>\n<p>That the true light, which fills them with desire,</p>\n<p>Permits not from its beams their feet to stray.&rdquo;</p>\n<p class="slindent">Straight to the shadow which for converse seem&rsquo;d</p>\n<p>Most earnest, I addressed me, and began,</p>\n<p>As one by over-eagerness perplex&rsquo;d:</p>\n<p>&ldquo;O spirit, born for joy! who in the rays</p>\n<p>Of life eternal, of that sweetness know&rsquo;st</p>\n<p>The flavour, which, not tasted, passes far</p>\n<p>All apprehension, me it well would please,</p>\n<p>If thou wouldst tell me of thy name, and this</p>\n<p>Your station here.&rdquo; Whence she, with kindness prompt,</p>\n<p>And eyes glist&rsquo;ning with smiles: &ldquo;Our charity,</p>\n<p>To any wish by justice introduc&rsquo;d,</p>\n<p>Bars not the door, no more than she above,</p>\n<p>Who would have all her court be like herself.</p>\n<p>I was a virgin sister in the earth;</p>\n<p>And if thy mind observe me well, this form,</p>\n<p>With such addition grac&rsquo;d of loveliness,</p>\n<p>Will not conceal me long, but thou wilt know</p>\n<p>Piccarda, in the tardiest sphere thus plac&rsquo;d,</p>\n<p>Here &rsquo;mid these other blessed also blest.</p>\n<p>Our hearts, whose high affections burn alone</p>\n<p>With pleasure, from the Holy Spirit conceiv&rsquo;d,</p>\n<p>Admitted to his order dwell in joy.</p>\n<p>And this condition, which appears so low,</p>\n<p>Is for this cause assign&rsquo;d us, that our vows</p>\n<p>Were in some part neglected and made void.&rdquo;</p>\n<p class="slindent">Whence I to her replied: &ldquo;Something divine</p>\n<p>Beams in your countenance, wond&rsquo;rous fair,</p>\n<p>From former knowledge quite transmuting you.</p>\n<p>Therefore to recollect was I so slow.</p>\n<p>But what thou sayst hath to my memory</p>\n<p>Given now such aid, that to retrace your forms</p>\n<p>Is easier. Yet inform me, ye, who here</p>\n<p>Are happy, long ye for a higher place</p>\n<p>More to behold, and more in love to dwell?&rdquo;</p>\n<p class="slindent">She with those other spirits gently smil&rsquo;d,</p>\n<p>Then answer&rsquo;d with such gladness, that she seem&rsquo;d</p>\n<p>With love&rsquo;s first flame to glow: &ldquo;Brother! our will</p>\n<p>Is in composure settled by the power</p>\n<p>Of charity, who makes us will alone</p>\n<p>What we possess, and nought beyond desire;</p>\n<p>If we should wish to be exalted more,</p>\n<p>Then must our wishes jar with the high will</p>\n<p>Of him, who sets us here, which in these orbs</p>\n<p>Thou wilt confess not possible, if here</p>\n<p>To be in charity must needs befall,</p>\n<p>And if her nature well thou contemplate.</p>\n<p>Rather it is inherent in this state</p>\n<p>Of blessedness, to keep ourselves within</p>\n<p>The divine will, by which our wills with his</p>\n<p>Are one. So that as we from step to step</p>\n<p>Are plac&rsquo;d throughout this kingdom, pleases all,</p>\n<p>E&rsquo;en as our King, who in us plants his will;</p>\n<p>And in his will is our tranquillity;</p>\n<p>It is the mighty ocean, whither tends</p>\n<p>Whatever it creates and nature makes.&rdquo;</p>\n<p class="slindent">Then saw I clearly how each spot in heav&rsquo;n</p>\n<p>Is Paradise, though with like gracious dew</p>\n<p>The supreme virtue show&rsquo;r not over all.</p>\n<p class="slindent">But as it chances, if one sort of food</p>\n<p>Hath satiated, and of another still</p>\n<p>The appetite remains, that this is ask&rsquo;d,</p>\n<p>And thanks for that return&rsquo;d; e&rsquo;en so did I</p>\n<p>In word and motion, bent from her to learn</p>\n<p>What web it was, through which she had not drawn</p>\n<p>The shuttle to its point. She thus began:</p>\n<p>&ldquo;Exalted worth and perfectness of life</p>\n<p>The Lady higher up enshrine in heaven,</p>\n<p>By whose pure laws upon your nether earth</p>\n<p>The robe and veil they wear, to that intent,</p>\n<p>That e&rsquo;en till death they may keep watch or sleep</p>\n<p>With their great bridegroom, who accepts each vow,</p>\n<p>Which to his gracious pleasure love conforms.</p>\n<p>from the world, to follow her, when young</p>\n<p>Escap&rsquo;d; and, in her vesture mantling me,</p>\n<p>Made promise of the way her sect enjoins.</p>\n<p>Thereafter men, for ill than good more apt,</p>\n<p>Forth snatch&rsquo;d me from the pleasant cloister&rsquo;s pale.</p>\n<p>God knows how after that my life was fram&rsquo;d.</p>\n<p>This other splendid shape, which thou beholdst</p>\n<p>At my right side, burning with all the light</p>\n<p>Of this our orb, what of myself I tell</p>\n<p>May to herself apply. From her, like me</p>\n<p>A sister, with like violence were torn</p>\n<p>The saintly folds, that shaded her fair brows.</p>\n<p>E&rsquo;en when she to the world again was brought</p>\n<p>In spite of her own will and better wont,</p>\n<p>Yet not for that the bosom&rsquo;s inward veil</p>\n<p>Did she renounce. This is the luminary</p>\n<p>Of mighty Constance, who from that loud blast,</p>\n<p>Which blew the second over Suabia&rsquo;s realm,</p>\n<p>That power produc&rsquo;d, which was the third and last.&rdquo;</p>\n<p class="slindent">She ceas&rsquo;d from further talk, and then began</p>\n<p>&ldquo;Ave Maria&rdquo; singing, and with that song</p>\n<p>Vanish&rsquo;d, as heavy substance through deep wave.</p>\n<p class="slindent">Mine eye, that far as it was capable,</p>\n<p>Pursued her, when in dimness she was lost,</p>\n<p>Turn&rsquo;d to the mark where greater want impell&rsquo;d,</p>\n<p>And bent on Beatrice all its gaze.</p>\n<p>But she as light&rsquo;ning beam&rsquo;d upon my looks:</p>\n<p>So that the sight sustain&rsquo;d it not at first.</p>\n<p>Whence I to question her became less prompt.</p>\n</div>','<p class="cantohead">Canto IV</p>\n<div class="stanza"><p>Between two kinds of food, both equally</p>\n<p>Remote and tempting, first a man might die</p>\n<p>Of hunger, ere he one could freely choose.</p>\n<p>E&rsquo;en so would stand a lamb between the maw</p>\n<p>Of two fierce wolves, in dread of both alike:</p>\n<p>E&rsquo;en so between two deer a dog would stand,</p>\n<p>Wherefore, if I was silent, fault nor praise</p>\n<p>I to myself impute, by equal doubts</p>\n<p>Held in suspense, since of necessity</p>\n<p>It happen&rsquo;d. Silent was I, yet desire</p>\n<p>Was painted in my looks; and thus I spake</p>\n<p>My wish more earnestly than language could.</p>\n<p class="slindent">As Daniel, when the haughty king he freed</p>\n<p>From ire, that spurr&rsquo;d him on to deeds unjust</p>\n<p>And violent; so look&rsquo;d Beatrice then.</p>\n<p class="slindent">&ldquo;Well I discern,&rdquo; she thus her words address&rsquo;d,</p>\n<p>&ldquo;How contrary desires each way constrain thee,</p>\n<p>So that thy anxious thought is in itself</p>\n<p>Bound up and stifled, nor breathes freely forth.</p>\n<p>Thou arguest; if the good intent remain;</p>\n<p>What reason that another&rsquo;s violence</p>\n<p>Should stint the measure of my fair desert?</p>\n<p class="slindent">&ldquo;Cause too thou findst for doubt, in that it seems,</p>\n<p>That spirits to the stars, as Plato deem&rsquo;d,</p>\n<p>Return. These are the questions which thy will</p>\n<p>Urge equally; and therefore I the first</p>\n<p>Of that will treat which hath the more of gall.</p>\n<p>Of seraphim he who is most ensky&rsquo;d,</p>\n<p>Moses and Samuel, and either John,</p>\n<p>Choose which thou wilt, nor even Mary&rsquo;s self,</p>\n<p>Have not in any other heav&rsquo;n their seats,</p>\n<p>Than have those spirits which so late thou saw&rsquo;st;</p>\n<p>Nor more or fewer years exist; but all</p>\n<p>Make the first circle beauteous, diversely</p>\n<p>Partaking of sweet life, as more or less</p>\n<p>Afflation of eternal bliss pervades them.</p>\n<p>Here were they shown thee, not that fate assigns</p>\n<p>This for their sphere, but for a sign to thee</p>\n<p>Of that celestial furthest from the height.</p>\n<p>Thus needs, that ye may apprehend, we speak:</p>\n<p>Since from things sensible alone ye learn</p>\n<p>That, which digested rightly after turns</p>\n<p>To intellectual. For no other cause</p>\n<p>The scripture, condescending graciously</p>\n<p>To your perception, hands and feet to God</p>\n<p>Attributes, nor so means: and holy church</p>\n<p>Doth represent with human countenance</p>\n<p>Gabriel, and Michael, and him who made</p>\n<p>Tobias whole. Unlike what here thou seest,</p>\n<p>The judgment of Timaeus, who affirms</p>\n<p>Each soul restor&rsquo;d to its particular star,</p>\n<p>Believing it to have been taken thence,</p>\n<p>When nature gave it to inform her mold:</p>\n<p>Since to appearance his intention is</p>\n<p>E&rsquo;en what his words declare: or else to shun</p>\n<p>Derision, haply thus he hath disguis&rsquo;d</p>\n<p>His true opinion. If his meaning be,</p>\n<p>That to the influencing of these orbs revert</p>\n<p>The honour and the blame in human acts,</p>\n<p>Perchance he doth not wholly miss the truth.</p>\n<p>This principle, not understood aright,</p>\n<p>Erewhile perverted well nigh all the world;</p>\n<p>So that it fell to fabled names of Jove,</p>\n<p>And Mercury, and Mars. That other doubt,</p>\n<p>Which moves thee, is less harmful; for it brings</p>\n<p>No peril of removing thee from me.</p>\n<p class="slindent">&ldquo;That, to the eye of man, our justice seems</p>\n<p>Unjust, is argument for faith, and not</p>\n<p>For heretic declension. To the end</p>\n<p>This truth may stand more clearly in your view,</p>\n<p>I will content thee even to thy wish</p>\n<p class="slindent">&ldquo;If violence be, when that which suffers, nought</p>\n<p>Consents to that which forceth, not for this</p>\n<p>These spirits stood exculpate. For the will,</p>\n<p>That will not, still survives unquench&rsquo;d, and doth</p>\n<p>As nature doth in fire, tho&rsquo; violence</p>\n<p>Wrest it a thousand times; for, if it yield</p>\n<p>Or more or less, so far it follows force.</p>\n<p>And thus did these, whom they had power to seek</p>\n<p>The hallow&rsquo;d place again. In them, had will</p>\n<p>Been perfect, such as once upon the bars</p>\n<p>Held Laurence firm, or wrought in Scaevola</p>\n<p>To his own hand remorseless, to the path,</p>\n<p>Whence they were drawn, their steps had hasten&rsquo;d back,</p>\n<p>When liberty return&rsquo;d: but in too few</p>\n<p>Resolve so steadfast dwells. And by these words</p>\n<p>If duly weigh&rsquo;d, that argument is void,</p>\n<p>Which oft might have perplex&rsquo;d thee still. But now</p>\n<p>Another question thwarts thee, which to solve</p>\n<p>Might try thy patience without better aid.</p>\n<p>I have, no doubt, instill&rsquo;d into thy mind,</p>\n<p>That blessed spirit may not lie; since near</p>\n<p>The source of primal truth it dwells for aye:</p>\n<p>And thou might&rsquo;st after of Piccarda learn</p>\n<p>That Constance held affection to the veil;</p>\n<p>So that she seems to contradict me here.</p>\n<p>Not seldom, brother, it hath chanc&rsquo;d for men</p>\n<p>To do what they had gladly left undone,</p>\n<p>Yet to shun peril they have done amiss:</p>\n<p>E&rsquo;en as Alcmaeon, at his father&rsquo;s suit</p>\n<p>Slew his own mother, so made pitiless</p>\n<p>Not to lose pity. On this point bethink thee,</p>\n<p>That force and will are blended in such wise</p>\n<p>As not to make the&rsquo; offence excusable.</p>\n<p>Absolute will agrees not to the wrong,</p>\n<p>That inasmuch as there is fear of woe</p>\n<p>From non-compliance, it agrees. Of will</p>\n<p>Thus absolute Piccarda spake, and I</p>\n<p>Of th&rsquo; other; so that both have truly said.&rdquo;</p>\n<p class="slindent">Such was the flow of that pure rill, that well&rsquo;d</p>\n<p>From forth the fountain of all truth; and such</p>\n<p>The rest, that to my wond&rsquo;ring thoughts l found.</p>\n<p class="slindent">\xA0&ldquo;O thou of primal love the prime delight!</p>\n<p>Goddess! &ldquo;I straight reply&rsquo;d, &ldquo;whose lively words</p>\n<p>Still shed new heat and vigour through my soul!</p>\n<p>Affection fails me to requite thy grace</p>\n<p>With equal sum of gratitude: be his</p>\n<p>To recompense, who sees and can reward thee.</p>\n<p>Well I discern, that by that truth alone</p>\n<p>Enlighten&rsquo;d, beyond which no truth may roam,</p>\n<p>Our mind can satisfy her thirst to know:</p>\n<p>Therein she resteth, e&rsquo;en as in his lair</p>\n<p>The wild beast, soon as she hath reach&rsquo;d that bound,</p>\n<p>And she hath power to reach it; else desire</p>\n<p>Were given to no end. And thence doth doubt</p>\n<p>Spring, like a shoot, around the stock of truth;</p>\n<p>And it is nature which from height to height</p>\n<p>On to the summit prompts us. This invites,</p>\n<p>This doth assure me, lady, rev&rsquo;rently</p>\n<p>To ask thee of other truth, that yet</p>\n<p>Is dark to me. I fain would know, if man</p>\n<p>By other works well done may so supply</p>\n<p>The failure of his vows, that in your scale</p>\n<p>They lack not weight.&rdquo; I spake; and on me straight</p>\n<p>Beatrice look&rsquo;d with eyes that shot forth sparks</p>\n<p>Of love celestial in such copious stream,</p>\n<p>That, virtue sinking in me overpower&rsquo;d,</p>\n<p>I turn&rsquo;d, and downward bent confus&rsquo;d my sight.</p>\n</div>','<p class="cantohead">Canto V</p>\n<div class="stanza"><p>&ldquo;If beyond earthly wont, the flame of love</p>\n<p>Illume me, so that I o&rsquo;ercome thy power</p>\n<p>Of vision, marvel not: but learn the cause</p>\n<p>In that perfection of the sight, which soon</p>\n<p>As apprehending, hasteneth on to reach</p>\n<p>The good it apprehends. I well discern,</p>\n<p>How in thine intellect already shines</p>\n<p>The light eternal, which to view alone</p>\n<p>Ne&rsquo;er fails to kindle love; and if aught else</p>\n<p>Your love seduces, &rsquo;t is but that it shows</p>\n<p>Some ill-mark&rsquo;d vestige of that primal beam.</p>\n<p class="slindent">&ldquo;This would&rsquo;st thou know, if failure of the vow</p>\n<p>By other service may be so supplied,</p>\n<p>As from self-question to assure the soul.&rdquo;</p>\n<p class="slindent">Thus she her words, not heedless of my wish,</p>\n<p>Began; and thus, as one who breaks not off</p>\n<p>Discourse, continued in her saintly strain.</p>\n<p>&ldquo;Supreme of gifts, which God creating gave</p>\n<p>Of his free bounty, sign most evident</p>\n<p>Of goodness, and in his account most priz&rsquo;d,</p>\n<p>Was liberty of will, the boon wherewith</p>\n<p>All intellectual creatures, and them sole</p>\n<p>He hath endow&rsquo;d. Hence now thou mayst infer</p>\n<p>Of what high worth the vow, which so is fram&rsquo;d</p>\n<p>That when man offers, God well-pleas&rsquo;d accepts;</p>\n<p>For in the compact between God and him,</p>\n<p>This treasure, such as I describe it to thee,</p>\n<p>He makes the victim, and of his own act.</p>\n<p>What compensation therefore may he find?</p>\n<p>If that, whereof thou hast oblation made,</p>\n<p>By using well thou think&rsquo;st to consecrate,</p>\n<p>Thou would&rsquo;st of theft do charitable deed.</p>\n<p>Thus I resolve thee of the greater point.</p>\n<p class="slindent">&ldquo;But forasmuch as holy church, herein</p>\n<p>Dispensing, seems to contradict the truth</p>\n<p>I have discover&rsquo;d to thee, yet behooves</p>\n<p>Thou rest a little longer at the board,</p>\n<p>Ere the crude aliment, which thou hast taken,</p>\n<p>Digested fitly to nutrition turn.</p>\n<p>Open thy mind to what I now unfold,</p>\n<p>And give it inward keeping. Knowledge comes</p>\n<p>Of learning well retain&rsquo;d, unfruitful else.</p>\n<p class="slindent">&ldquo;This sacrifice in essence of two things</p>\n<p>Consisteth; one is that, whereof &rsquo;t is made,</p>\n<p>The covenant the other. For the last,</p>\n<p>It ne&rsquo;er is cancell&rsquo;d if not kept: and hence</p>\n<p>I spake erewhile so strictly of its force.</p>\n<p>For this it was enjoin&rsquo;d the Israelites,</p>\n<p>Though leave were giv&rsquo;n them, as thou know&rsquo;st, to change</p>\n<p>The offering, still to offer. Th&rsquo; other part,</p>\n<p>The matter and the substance of the vow,</p>\n<p>May well be such, to that without offence</p>\n<p>It may for other substance be exchang&rsquo;d.</p>\n<p>But at his own discretion none may shift</p>\n<p>The burden on his shoulders, unreleas&rsquo;d</p>\n<p>By either key, the yellow and the white.</p>\n<p>Nor deem of any change, as less than vain,</p>\n<p>If the last bond be not within the new</p>\n<p>Included, as the quatre in the six.</p>\n<p>No satisfaction therefore can be paid</p>\n<p>For what so precious in the balance weighs,</p>\n<p>That all in counterpoise must kick the beam.</p>\n<p>Take then no vow at random: ta&rsquo;en, with faith</p>\n<p>Preserve it; yet not bent, as Jephthah once,</p>\n<p>Blindly to execute a rash resolve,</p>\n<p>Whom better it had suited to exclaim,</p>\n<p>&lsquo;I have done ill,&rsquo; than to redeem his pledge</p>\n<p>By doing worse or, not unlike to him</p>\n<p>In folly, that great leader of the Greeks:</p>\n<p>Whence, on the alter, Iphigenia mourn&rsquo;d</p>\n<p>Her virgin beauty, and hath since made mourn</p>\n<p>Both wise and simple, even all, who hear</p>\n<p>Of so fell sacrifice. Be ye more staid,</p>\n<p>O Christians, not, like feather, by each wind</p>\n<p>Removable: nor think to cleanse ourselves</p>\n<p>In every water. Either testament,</p>\n<p>The old and new, is yours: and for your guide</p>\n<p>The shepherd of the church let this suffice</p>\n<p>To save you. When by evil lust entic&rsquo;d,</p>\n<p>Remember ye be men, not senseless beasts;</p>\n<p>Nor let the Jew, who dwelleth in your streets,</p>\n<p>Hold you in mock&rsquo;ry. Be not, as the lamb,</p>\n<p>That, fickle wanton, leaves its mother&rsquo;s milk,</p>\n<p>To dally with itself in idle play.&rdquo;</p>\n<p class="slindent">Such were the words that Beatrice spake:</p>\n<p>These ended, to that region, where the world</p>\n<p>Is liveliest, full of fond desire she turn&rsquo;d.</p>\n<p class="slindent">Though mainly prompt new question to propose,</p>\n<p>Her silence and chang&rsquo;d look did keep me dumb.</p>\n<p>And as the arrow, ere the cord is still,</p>\n<p>Leapeth unto its mark; so on we sped</p>\n<p>Into the second realm. There I beheld</p>\n<p>The dame, so joyous enter, that the orb</p>\n<p>Grew brighter at her smiles; and, if the star</p>\n<p>Were mov&rsquo;d to gladness, what then was my cheer,</p>\n<p>Whom nature hath made apt for every change!</p>\n<p class="slindent">As in a quiet and clear lake the fish,</p>\n<p>If aught approach them from without, do draw</p>\n<p>Towards it, deeming it their food; so drew</p>\n<p>Full more than thousand splendours towards us,</p>\n<p>And in each one was heard: &ldquo;Lo! one arriv&rsquo;d</p>\n<p>To multiply our loves!&rdquo; and as each came</p>\n<p>The shadow, streaming forth effulgence new,</p>\n<p>Witness&rsquo;d augmented joy. Here, reader! think,</p>\n<p>If thou didst miss the sequel of my tale,</p>\n<p>To know the rest how sorely thou wouldst crave;</p>\n<p>And thou shalt see what vehement desire</p>\n<p>Possess&rsquo;d me, as soon as these had met my view,</p>\n<p>To know their state. &ldquo;O born in happy hour!</p>\n<p>Thou to whom grace vouchsafes, or ere thy close</p>\n<p>Of fleshly warfare, to behold the thrones</p>\n<p>Of that eternal triumph, know to us</p>\n<p>The light communicated, which through heaven</p>\n<p>Expatiates without bound. Therefore, if aught</p>\n<p>Thou of our beams wouldst borrow for thine aid,</p>\n<p>Spare not; and of our radiance take thy fill.&rdquo;</p>\n<p class="slindent">Thus of those piteous spirits one bespake me;</p>\n<p>And Beatrice next: &ldquo;Say on; and trust</p>\n<p>As unto gods!&rdquo;&mdash;&ldquo;How in the light supreme</p>\n<p>Thou harbour&rsquo;st, and from thence the virtue bring&rsquo;st,</p>\n<p>That, sparkling in thine eyes, denotes thy joy,</p>\n<p>l mark; but, who thou art, am still to seek;</p>\n<p>Or wherefore, worthy spirit! for thy lot</p>\n<p>This sphere assign&rsquo;d, that oft from mortal ken</p>\n<p>Is veil&rsquo;d by others&rsquo; beams.&rdquo; I said, and turn&rsquo;d</p>\n<p>Toward the lustre, that with greeting, kind</p>\n<p>Erewhile had hail&rsquo;d me. Forthwith brighter far</p>\n<p>Than erst, it wax&rsquo;d: and, as himself the sun</p>\n<p>Hides through excess of light, when his warm gaze</p>\n<p>Hath on the mantle of thick vapours prey&rsquo;d;</p>\n<p>Within its proper ray the saintly shape</p>\n<p>Was, through increase of gladness, thus conceal&rsquo;d;</p>\n<p>And, shrouded so in splendour answer&rsquo;d me,</p>\n<p>E&rsquo;en as the tenour of my song declares.</p>\n</div>','<p class="cantohead">Canto VI</p>\n<div class="stanza"><p>&ldquo;After that Constantine the eagle turn&rsquo;d</p>\n<p>Against the motions of the heav&rsquo;n, that roll&rsquo;d</p>\n<p>Consenting with its course, when he of yore,</p>\n<p>Lavinia&rsquo;s spouse, was leader of the flight,</p>\n<p>A hundred years twice told and more, his seat</p>\n<p>At Europe&rsquo;s extreme point, the bird of Jove</p>\n<p>Held, near the mountains, whence he issued first.</p>\n<p>There, under shadow of his sacred plumes</p>\n<p>Swaying the world, till through successive hands</p>\n<p>To mine he came devolv&rsquo;d. Caesar I was,</p>\n<p>And am Justinian; destin&rsquo;d by the will</p>\n<p>Of that prime love, whose influence I feel,</p>\n<p>From vain excess to clear th&rsquo; encumber&rsquo;d laws.</p>\n<p>Or ere that work engag&rsquo;d me, I did hold</p>\n<p>Christ&rsquo;s nature merely human, with such faith</p>\n<p>Contented. But the blessed Agapete,</p>\n<p>Who was chief shepherd, he with warning voice</p>\n<p>To the true faith recall&rsquo;d me. I believ&rsquo;d</p>\n<p>His words: and what he taught, now plainly see,</p>\n<p>As thou in every contradiction seest</p>\n<p>The true and false oppos&rsquo;d. Soon as my feet</p>\n<p>Were to the church reclaim&rsquo;d, to my great task,</p>\n<p>By inspiration of God&rsquo;s grace impell&rsquo;d,</p>\n<p>I gave me wholly, and consign&rsquo;d mine arms</p>\n<p>To Belisarius, with whom heaven&rsquo;s right hand</p>\n<p>Was link&rsquo;d in such conjointment, &rsquo;t was a sign</p>\n<p>That I should rest. To thy first question thus</p>\n<p>I shape mine answer, which were ended here,</p>\n<p>But that its tendency doth prompt perforce</p>\n<p>To some addition; that thou well, mayst mark</p>\n<p>What reason on each side they have to plead,</p>\n<p>By whom that holiest banner is withstood,</p>\n<p>Both who pretend its power and who oppose.</p>\n<p>&ldquo;Beginning from that hour, when Pallas died</p>\n<p>To give it rule, behold the valorous deeds</p>\n<p>Have made it worthy reverence. Not unknown</p>\n<p>To thee, how for three hundred years and more</p>\n<p>It dwelt in Alba, up to those fell lists</p>\n<p>Where for its sake were met the rival three;</p>\n<p>Nor aught unknown to thee, which it achiev&rsquo;d</p>\n<p>Down to the Sabines&rsquo; wrong to Lucrece&rsquo; woe,</p>\n<p>With its sev&rsquo;n kings conqu&rsquo;ring the nation round;</p>\n<p>Nor all it wrought, by Roman worthies home</p>\n<p>&rsquo;Gainst Brennus and th&rsquo; Epirot prince, and hosts</p>\n<p>Of single chiefs, or states in league combin&rsquo;d</p>\n<p>Of social warfare; hence Torquatus stern,</p>\n<p>And Quintius nam&rsquo;d of his neglected locks,</p>\n<p>The Decii, and the Fabii hence acquir&rsquo;d</p>\n<p>Their fame, which I with duteous zeal embalm.</p>\n<p>By it the pride of Arab hordes was quell&rsquo;d,</p>\n<p>When they led on by Hannibal o&rsquo;erpass&rsquo;d</p>\n<p>The Alpine rocks, whence glide thy currents, Po!</p>\n<p>Beneath its guidance, in their prime of days</p>\n<p>Scipio and Pompey triumph&rsquo;d; and that hill,</p>\n<p>Under whose summit thou didst see the light,</p>\n<p>Rued its stern bearing. After, near the hour,</p>\n<p>When heav&rsquo;n was minded that o&rsquo;er all the world</p>\n<p>His own deep calm should brood, to Caesar&rsquo;s hand</p>\n<p>Did Rome consign it; and what then it wrought</p>\n<p>From Var unto the Rhine, saw Isere&rsquo;s flood,</p>\n<p>Saw Loire and Seine, and every vale, that fills</p>\n<p>The torrent Rhone. What after that it wrought,</p>\n<p>When from Ravenna it came forth, and leap&rsquo;d</p>\n<p>The Rubicon, was of so bold a flight,</p>\n<p>That tongue nor pen may follow it. Tow&rsquo;rds Spain</p>\n<p>It wheel&rsquo;d its bands, then tow&rsquo;rd Dyrrachium smote,</p>\n<p>And on Pharsalia with so fierce a plunge,</p>\n<p>E&rsquo;en the warm Nile was conscious to the pang;</p>\n<p>Its native shores Antandros, and the streams</p>\n<p>Of Simois revisited, and there</p>\n<p>Where Hector lies; then ill for Ptolemy</p>\n<p>His pennons shook again; lightning thence fell</p>\n<p>On Juba; and the next upon your west,</p>\n<p>At sound of the Pompeian trump, return&rsquo;d.</p>\n<p class="slindent">&ldquo;What following and in its next bearer&rsquo;s gripe</p>\n<p>It wrought, is now by Cassius and Brutus</p>\n<p>Bark&rsquo;d off in hell, and by Perugia&rsquo;s sons</p>\n<p>And Modena&rsquo;s was mourn&rsquo;d. Hence weepeth still</p>\n<p>Sad Cleopatra, who, pursued by it,</p>\n<p>Took from the adder black and sudden death.</p>\n<p>With him it ran e&rsquo;en to the Red Sea coast;</p>\n<p>With him compos&rsquo;d the world to such a peace,</p>\n<p>That of his temple Janus barr&rsquo;d the door.</p>\n<p class="slindent">&ldquo;But all the mighty standard yet had wrought,</p>\n<p>And was appointed to perform thereafter,</p>\n<p>Throughout the mortal kingdom which it sway&rsquo;d,</p>\n<p>Falls in appearance dwindled and obscur&rsquo;d,</p>\n<p>If one with steady eye and perfect thought</p>\n<p>On the third Caesar look; for to his hands,</p>\n<p>The living Justice, in whose breath I move,</p>\n<p>Committed glory, e&rsquo;en into his hands,</p>\n<p>To execute the vengeance of its wrath.</p>\n<p class="slindent">&ldquo;Hear now and wonder at what next I tell.</p>\n<p>After with Titus it was sent to wreak</p>\n<p>Vengeance for vengeance of the ancient sin,</p>\n<p>And, when the Lombard tooth, with fangs impure,</p>\n<p>Did gore the bosom of the holy church,</p>\n<p>Under its wings victorious, Charlemagne</p>\n<p>Sped to her rescue. Judge then for thyself</p>\n<p>Of those, whom I erewhile accus&rsquo;d to thee,</p>\n<p>What they are, and how grievous their offending,</p>\n<p>Who are the cause of all your ills. The one</p>\n<p>Against the universal ensign rears</p>\n<p>The yellow lilies, and with partial aim</p>\n<p>That to himself the other arrogates:</p>\n<p>So that &rsquo;t is hard to see which more offends.</p>\n<p>Be yours, ye Ghibellines, to veil your arts</p>\n<p>Beneath another standard: ill is this</p>\n<p>Follow&rsquo;d of him, who severs it and justice:</p>\n<p>And let not with his Guelphs the new-crown&rsquo;d Charles</p>\n<p>Assail it, but those talons hold in dread,</p>\n<p>Which from a lion of more lofty port</p>\n<p>Have rent the easing. Many a time ere now</p>\n<p>The sons have for the sire&rsquo;s transgression wail&rsquo;d;</p>\n<p>Nor let him trust the fond belief, that heav&rsquo;n</p>\n<p>Will truck its armour for his lilied shield.</p>\n<p class="slindent">&ldquo;This little star is furnish&rsquo;d with good spirits,</p>\n<p>Whose mortal lives were busied to that end,</p>\n<p>That honour and renown might wait on them:</p>\n<p>And, when desires thus err in their intention,</p>\n<p>True love must needs ascend with slacker beam.</p>\n<p>But it is part of our delight, to measure</p>\n<p>Our wages with the merit; and admire</p>\n<p>The close proportion. Hence doth heav&rsquo;nly justice</p>\n<p>Temper so evenly affection in us,</p>\n<p>It ne&rsquo;er can warp to any wrongfulness.</p>\n<p>Of diverse voices is sweet music made:</p>\n<p>So in our life the different degrees</p>\n<p>Render sweet harmony among these wheels.</p>\n<p class="slindent">&ldquo;Within the pearl, that now encloseth us,</p>\n<p>Shines Romeo&rsquo;s light, whose goodly deed and fair</p>\n<p>Met ill acceptance. But the Provencals,</p>\n<p>That were his foes, have little cause for mirth.</p>\n<p>Ill shapes that man his course, who makes his wrong</p>\n<p>Of other&rsquo;s worth. Four daughters were there born</p>\n<p>To Raymond Berenger, and every one</p>\n<p>Became a queen; and this for him did Romeo,</p>\n<p>Though of mean state and from a foreign land.</p>\n<p>Yet envious tongues incited him to ask</p>\n<p>A reckoning of that just one, who return&rsquo;d</p>\n<p>Twelve fold to him for ten. Aged and poor</p>\n<p>He parted thence: and if the world did know</p>\n<p>The heart he had, begging his life by morsels,</p>\n<p>&rsquo;T would deem the praise, it yields him, scantly dealt.&rdquo;</p>\n</div>','<p class="cantohead">Canto VII</p>\n<div class="stanza"><p>&ldquo;Hosanna Sanctus Deus Sabaoth</p>\n<p>Superillustrans claritate tua</p>\n<p>Felices ignes horum malahoth!&rdquo;</p>\n<p>Thus chanting saw I turn that substance bright</p>\n<p>With fourfold lustre to its orb again,</p>\n<p>Revolving; and the rest unto their dance</p>\n<p>With it mov&rsquo;d also; and like swiftest sparks,</p>\n<p>In sudden distance from my sight were veil&rsquo;d.</p>\n<p class="slindent">Me doubt possess&rsquo;d, and &ldquo;Speak,&rdquo; it whisper&rsquo;d me,</p>\n<p>&ldquo;Speak, speak unto thy lady, that she quench</p>\n<p>Thy thirst with drops of sweetness.&rdquo; Yet blank awe,</p>\n<p>Which lords it o&rsquo;er me, even at the sound</p>\n<p>Of Beatrice&rsquo;s name, did bow me down</p>\n<p>As one in slumber held. Not long that mood</p>\n<p>Beatrice suffer&rsquo;d: she, with such a smile,</p>\n<p>As might have made one blest amid the flames,</p>\n<p>Beaming upon me, thus her words began:</p>\n<p>&ldquo;Thou in thy thought art pond&rsquo;ring (as I deem,</p>\n<p>And what I deem is truth how just revenge</p>\n<p>Could be with justice punish&rsquo;d: from which doubt</p>\n<p>I soon will free thee; so thou mark my words;</p>\n<p>For they of weighty matter shall possess thee.</p>\n<p class="slindent">&ldquo;That man, who was unborn, himself condemn&rsquo;d,</p>\n<p>And, in himself, all, who since him have liv&rsquo;d,</p>\n<p>His offspring: whence, below, the human kind</p>\n<p>Lay sick in grievous error many an age;</p>\n<p>Until it pleas&rsquo;d the Word of God to come</p>\n<p>Amongst them down, to his own person joining</p>\n<p>The nature, from its Maker far estrang&rsquo;d,</p>\n<p>By the mere act of his eternal love.</p>\n<p>Contemplate here the wonder I unfold.</p>\n<p>The nature with its Maker thus conjoin&rsquo;d,</p>\n<p>Created first was blameless, pure and good;</p>\n<p>But through itself alone was driven forth</p>\n<p>From Paradise, because it had eschew&rsquo;d</p>\n<p>The way of truth and life, to evil turn&rsquo;d.</p>\n<p>Ne&rsquo;er then was penalty so just as that</p>\n<p>Inflicted by the cross, if thou regard</p>\n<p>The nature in assumption doom&rsquo;d: ne&rsquo;er wrong</p>\n<p>So great, in reference to him, who took</p>\n<p>Such nature on him, and endur&rsquo;d the doom.</p>\n<p>God therefore and the Jews one sentence pleased:</p>\n<p>So different effects flow&rsquo;d from one act,</p>\n<p>And heav&rsquo;n was open&rsquo;d, though the earth did quake.</p>\n<p>Count it not hard henceforth, when thou dost hear</p>\n<p>That a just vengeance was by righteous court</p>\n<p>Justly reveng&rsquo;d. But yet I see thy mind</p>\n<p>By thought on thought arising sore perplex&rsquo;d,</p>\n<p>And with how vehement desire it asks</p>\n<p>Solution of the maze. What I have heard,</p>\n<p>Is plain, thou sayst: but wherefore God this way</p>\n<p>For our redemption chose, eludes my search.</p>\n<p class="slindent">&ldquo;Brother! no eye of man not perfected,</p>\n<p>Nor fully ripen&rsquo;d in the flame of love,</p>\n<p>May fathom this decree. It is a mark,</p>\n<p>In sooth, much aim&rsquo;d at, and but little kenn&rsquo;d:</p>\n<p>And I will therefore show thee why such way</p>\n<p>Was worthiest. The celestial love, that spume</p>\n<p>All envying in its bounty, in itself</p>\n<p>With such effulgence blazeth, as sends forth</p>\n<p>All beauteous things eternal. What distils</p>\n<p>Immediate thence, no end of being knows,</p>\n<p>Bearing its seal immutably impress&rsquo;d.</p>\n<p>Whatever thence immediate falls, is free,</p>\n<p>Free wholly, uncontrollable by power</p>\n<p>Of each thing new: by such conformity</p>\n<p>More grateful to its author, whose bright beams,</p>\n<p>Though all partake their shining, yet in those</p>\n<p>Are liveliest, which resemble him the most.</p>\n<p>These tokens of pre-eminence on man</p>\n<p>Largely bestow&rsquo;d, if any of them fail,</p>\n<p>He needs must forfeit his nobility,</p>\n<p>No longer stainless. Sin alone is that,</p>\n<p>Which doth disfranchise him, and make unlike</p>\n<p>To the chief good; for that its light in him</p>\n<p>Is darken&rsquo;d. And to dignity thus lost</p>\n<p>Is no return; unless, where guilt makes void,</p>\n<p>He for ill pleasure pay with equal pain.</p>\n<p>Your nature, which entirely in its seed</p>\n<p>Trangress&rsquo;d, from these distinctions fell, no less</p>\n<p>Than from its state in Paradise; nor means</p>\n<p>Found of recovery (search all methods out</p>\n<p>As strickly as thou may) save one of these,</p>\n<p>The only fords were left through which to wade,</p>\n<p>Either that God had of his courtesy</p>\n<p>Releas&rsquo;d him merely, or else man himself</p>\n<p>For his own folly by himself aton&rsquo;d.</p>\n<p class="slindent">&ldquo;Fix now thine eye, intently as thou canst,</p>\n<p>On th&rsquo; everlasting counsel, and explore,</p>\n<p>Instructed by my words, the dread abyss.</p>\n<p class="slindent">&ldquo;Man in himself had ever lack&rsquo;d the means</p>\n<p>Of satisfaction, for he could not stoop</p>\n<p>Obeying, in humility so low,</p>\n<p>As high he, disobeying, thought to soar:</p>\n<p>And for this reason he had vainly tried</p>\n<p>Out of his own sufficiency to pay</p>\n<p>The rigid satisfaction. Then behooved</p>\n<p>That God should by his own ways lead him back</p>\n<p>Unto the life, from whence he fell, restor&rsquo;d:</p>\n<p>By both his ways, I mean, or one alone.</p>\n<p>But since the deed is ever priz&rsquo;d the more,</p>\n<p>The more the doer&rsquo;s good intent appears,</p>\n<p>Goodness celestial, whose broad signature</p>\n<p>Is on the universe, of all its ways</p>\n<p>To raise ye up, was fain to leave out none,</p>\n<p>Nor aught so vast or so magnificent,</p>\n<p>Either for him who gave or who receiv&rsquo;d</p>\n<p>Between the last night and the primal day,</p>\n<p>Was or can be. For God more bounty show&rsquo;d.</p>\n<p>Giving himself to make man capable</p>\n<p>Of his return to life, than had the terms</p>\n<p>Been mere and unconditional release.</p>\n<p>And for his justice, every method else</p>\n<p>Were all too scant, had not the Son of God</p>\n<p>Humbled himself to put on mortal flesh.</p>\n<p class="slindent">&ldquo;Now, to fulfil each wish of thine, remains</p>\n<p>I somewhat further to thy view unfold.</p>\n<p>That thou mayst see as clearly as myself.</p>\n<p class="slindent">&ldquo;I see, thou sayst, the air, the fire I see,</p>\n<p>The earth and water, and all things of them</p>\n<p>Compounded, to corruption turn, and soon</p>\n<p>Dissolve. Yet these were also things create,</p>\n<p>Because, if what were told me, had been true</p>\n<p>They from corruption had been therefore free.</p>\n<p class="slindent">&ldquo;The angels, O my brother! and this clime</p>\n<p>Wherein thou art, impassible and pure,</p>\n<p>I call created, as indeed they are</p>\n<p>In their whole being. But the elements,</p>\n<p>Which thou hast nam&rsquo;d, and what of them is made,</p>\n<p>Are by created virtue&rsquo; inform&rsquo;d: create</p>\n<p>Their substance, and create the&rsquo; informing virtue</p>\n<p>In these bright stars, that round them circling move</p>\n<p>The soul of every brute and of each plant,</p>\n<p>The ray and motion of the sacred lights,</p>\n<p>With complex potency attract and turn.</p>\n<p>But this our life the&rsquo; eternal good inspires</p>\n<p>Immediate, and enamours of itself;</p>\n<p>So that our wishes rest for ever here.</p>\n<p class="slindent">&ldquo;And hence thou mayst by inference conclude</p>\n<p>Our resurrection certain, if thy mind</p>\n<p>Consider how the human flesh was fram&rsquo;d,</p>\n<p>When both our parents at the first were made.&rdquo;</p>\n</div>','<p class="cantohead">Canto VIII</p>\n<div class="stanza"><p>The world was in its day of peril dark</p>\n<p>Wont to believe the dotage of fond love</p>\n<p>From the fair Cyprian deity, who rolls</p>\n<p>In her third epicycle, shed on men</p>\n<p>By stream of potent radiance: therefore they</p>\n<p>Of elder time, in their old error blind,</p>\n<p>Not her alone with sacrifice ador&rsquo;d</p>\n<p>And invocation, but like honours paid</p>\n<p>To Cupid and Dione, deem&rsquo;d of them</p>\n<p>Her mother, and her son, him whom they feign&rsquo;d</p>\n<p>To sit in Dido&rsquo;s bosom: and from her,</p>\n<p>Whom I have sung preluding, borrow&rsquo;d they</p>\n<p>The appellation of that star, which views,</p>\n<p>Now obvious and now averse, the sun.</p>\n<p class="slindent">I was not ware that I was wafted up</p>\n<p>Into its orb; but the new loveliness</p>\n<p>That grac&rsquo;d my lady, gave me ample proof</p>\n<p>That we had entered there. And as in flame</p>\n<p>A sparkle is distinct, or voice in voice</p>\n<p>Discern&rsquo;d, when one its even tenour keeps,</p>\n<p>The other comes and goes; so in that light</p>\n<p>I other luminaries saw, that cours&rsquo;d</p>\n<p>In circling motion. rapid more or less,</p>\n<p>As their eternal phases each impels.</p>\n<p class="slindent">Never was blast from vapour charged with cold,</p>\n<p>Whether invisible to eye or no,</p>\n<p>Descended with such speed, it had not seem&rsquo;d</p>\n<p>To linger in dull tardiness, compar&rsquo;d</p>\n<p>To those celestial lights, that tow&rsquo;rds us came,</p>\n<p>Leaving the circuit of their joyous ring,</p>\n<p>Conducted by the lofty seraphim.</p>\n<p>And after them, who in the van appear&rsquo;d,</p>\n<p>Such an hosanna sounded, as hath left</p>\n<p>Desire, ne&rsquo;er since extinct in me, to hear</p>\n<p>Renew&rsquo;d the strain. Then parting from the rest</p>\n<p>One near us drew, and sole began: &ldquo;We all</p>\n<p>Are ready at thy pleasure, well dispos&rsquo;d</p>\n<p>To do thee gentle service. We are they,</p>\n<p>To whom thou in the world erewhile didst Sing</p>\n<p>&lsquo;O ye! whose intellectual ministry</p>\n<p>Moves the third heaven!&rsquo; and in one orb we roll,</p>\n<p>One motion, one impulse, with those who rule</p>\n<p>Princedoms in heaven; yet are of love so full,</p>\n<p>That to please thee &rsquo;t will be as sweet to rest.&rdquo;</p>\n<p class="slindent">After mine eyes had with meek reverence</p>\n<p>Sought the celestial guide, and were by her</p>\n<p>Assur&rsquo;d, they turn&rsquo;d again unto the light</p>\n<p>Who had so largely promis&rsquo;d, and with voice</p>\n<p>That bare the lively pressure of my zeal,</p>\n<p>&ldquo;Tell who ye are,&rdquo; I cried. Forthwith it grew</p>\n<p>In size and splendour, through augmented joy;</p>\n<p>And thus it answer&rsquo;d: &ldquo;A short date below</p>\n<p>The world possess&rsquo;d me. Had the time been more,</p>\n<p>Much evil, that will come, had never chanc&rsquo;d.</p>\n<p>My gladness hides thee from me, which doth shine .</p>\n<p>Around, and shroud me, as an animal</p>\n<p>In its own silk enswath&rsquo;d. Thou lov&rsquo;dst me well,</p>\n<p>And had&rsquo;st good cause; for had my sojourning</p>\n<p>Been longer on the earth, the love I bare thee</p>\n<p>Had put forth more than blossoms. The left bank,</p>\n<p>That Rhone, when he hath mix&rsquo;d with Sorga, laves.</p>\n<p>In me its lord expected, and that horn</p>\n<p>Of fair Ausonia, with its boroughs old,</p>\n<p>Bari, and Croton, and Gaeta pil&rsquo;d,</p>\n<p>From where the Trento disembogues his waves,</p>\n<p>With Verde mingled, to the salt sea-flood.</p>\n<p>Already on my temples beam&rsquo;d the crown,</p>\n<p>Which gave me sov&rsquo;reignty over the land</p>\n<p>By Danube wash&rsquo;d, whenas he strays beyond</p>\n<p>The limits of his German shores. The realm,</p>\n<p>Where, on the gulf by stormy Eurus lash&rsquo;d,</p>\n<p>Betwixt Pelorus and Pachynian heights,</p>\n<p>The beautiful Trinacria lies in gloom</p>\n<p>(Not through Typhaeus, but the vap&rsquo;ry cloud</p>\n<p>Bituminous upsteam&rsquo;d), THAT too did look</p>\n<p>To have its scepter wielded by a race</p>\n<p>Of monarchs, sprung through me from Charles and Rodolph;</p>\n<p>had not ill lording which doth spirit up</p>\n<p>The people ever, in Palermo rais&rsquo;d</p>\n<p>The shout of &lsquo;death,&rsquo; re-echo&rsquo;d loud and long.</p>\n<p>Had but my brother&rsquo;s foresight kenn&rsquo;d as much,</p>\n<p>He had been warier that the greedy want</p>\n<p>Of Catalonia might not work his bale.</p>\n<p>And truly need there is, that he forecast,</p>\n<p>Or other for him, lest more freight be laid</p>\n<p>On his already over-laden bark.</p>\n<p>Nature in him, from bounty fall&rsquo;n to thrift,</p>\n<p>Would ask the guard of braver arms, than such</p>\n<p>As only care to have their coffers fill&rsquo;d.&rdquo;</p>\n<p class="slindent">&ldquo;My liege, it doth enhance the joy thy words</p>\n<p>Infuse into me, mighty as it is,</p>\n<p>To think my gladness manifest to thee,</p>\n<p>As to myself, who own it, when thou lookst</p>\n<p>Into the source and limit of all good,</p>\n<p>There, where thou markest that which thou dost speak,</p>\n<p>Thence priz&rsquo;d of me the more. Glad thou hast made me.</p>\n<p>Now make intelligent, clearing the doubt</p>\n<p>Thy speech hath raised in me; for much I muse,</p>\n<p>How bitter can spring up, when sweet is sown.&rdquo;</p>\n<p class="slindent">I thus inquiring; he forthwith replied:</p>\n<p>&ldquo;If I have power to show one truth, soon that</p>\n<p>Shall face thee, which thy questioning declares</p>\n<p>Behind thee now conceal&rsquo;d. The Good, that guides</p>\n<p>And blessed makes this realm, which thou dost mount,</p>\n<p>Ordains its providence to be the virtue</p>\n<p>In these great bodies: nor th&rsquo; all perfect Mind</p>\n<p>Upholds their nature merely, but in them</p>\n<p>Their energy to save: for nought, that lies</p>\n<p>Within the range of that unerring bow,</p>\n<p>But is as level with the destin&rsquo;d aim,</p>\n<p>As ever mark to arrow&rsquo;s point oppos&rsquo;d.</p>\n<p>Were it not thus, these heavens, thou dost visit,</p>\n<p>Would their effect so work, it would not be</p>\n<p>Art, but destruction; and this may not chance,</p>\n<p>If th&rsquo; intellectual powers, that move these stars,</p>\n<p>Fail not, or who, first faulty made them fail.</p>\n<p>Wilt thou this truth more clearly evidenc&rsquo;d?&rdquo;</p>\n<p class="slindent">To whom I thus: &ldquo;It is enough: no fear,</p>\n<p>I see, lest nature in her part should tire.&rdquo;</p>\n<p class="slindent">He straight rejoin&rsquo;d: &ldquo;Say, were it worse for man,</p>\n<p>If he liv&rsquo;d not in fellowship on earth?&rdquo;</p>\n<p class="slindent">&ldquo;Yea,&rdquo; answer&rsquo;d I; &ldquo;nor here a reason needs.&rdquo;</p>\n<p class="slindent">&ldquo;And may that be, if different estates</p>\n<p>Grow not of different duties in your life?</p>\n<p>Consult your teacher, and he tells you &lsquo;no.&rsquo;&nbsp;&rdquo;</p>\n<p class="slindent">Thus did he come, deducing to this point,</p>\n<p>And then concluded: &ldquo;For this cause behooves,</p>\n<p>The roots, from whence your operations come,</p>\n<p>Must differ. Therefore one is Solon born;</p>\n<p>Another, Xerxes; and Melchisidec</p>\n<p>A third; and he a fourth, whose airy voyage</p>\n<p>Cost him his son. In her circuitous course,</p>\n<p>Nature, that is the seal to mortal wax,</p>\n<p>Doth well her art, but no distinctions owns</p>\n<p>&rsquo;Twixt one or other household. Hence befalls</p>\n<p>That Esau is so wide of Jacob: hence</p>\n<p>Quirinus of so base a father springs,</p>\n<p>He dates from Mars his lineage. Were it not</p>\n<p>That providence celestial overrul&rsquo;d,</p>\n<p>Nature, in generation, must the path</p>\n<p>Trac&rsquo;d by the generator, still pursue</p>\n<p>Unswervingly. Thus place I in thy sight</p>\n<p>That, which was late behind thee. But, in sign</p>\n<p>Of more affection for thee, &rsquo;t is my will</p>\n<p>Thou wear this corollary. Nature ever</p>\n<p>Finding discordant fortune, like all seed</p>\n<p>Out of its proper climate, thrives but ill.</p>\n<p>And were the world below content to mark</p>\n<p>And work on the foundation nature lays,</p>\n<p>It would not lack supply of excellence.</p>\n<p>But ye perversely to religion strain</p>\n<p>Him, who was born to gird on him the sword,</p>\n<p>And of the fluent phrasemen make your king;</p>\n<p>Therefore your steps have wander&rsquo;d from the paths.&rdquo;</p>\n</div>','<p class="cantohead">Canto IX</p>\n<div class="stanza"><p>After solution of my doubt, thy Charles,</p>\n<p>O fair Clemenza, of the treachery spake</p>\n<p>That must befall his seed: but, &ldquo;Tell it not,&rdquo;</p>\n<p>Said he, &ldquo;and let the destin&rsquo;d years come round.&rdquo;</p>\n<p>Nor may I tell thee more, save that the meed</p>\n<p>Of sorrow well-deserv&rsquo;d shall quit your wrongs.</p>\n<p class="slindent">And now the visage of that saintly light</p>\n<p>Was to the sun, that fills it, turn&rsquo;d again,</p>\n<p>As to the good, whose plenitude of bliss</p>\n<p>Sufficeth all. O ye misguided souls!</p>\n<p>Infatuate, who from such a good estrange</p>\n<p>Your hearts, and bend your gaze on vanity,</p>\n<p>Alas for you!&mdash;And lo! toward me, next,</p>\n<p>Another of those splendent forms approach&rsquo;d,</p>\n<p>That, by its outward bright&rsquo;ning, testified</p>\n<p>The will it had to pleasure me. The eyes</p>\n<p>Of Beatrice, resting, as before,</p>\n<p>Firmly upon me, manifested forth</p>\n<p>Approva1 of my wish. &ldquo;And O,&rdquo; I cried,</p>\n<p>Blest spirit! quickly be my will perform&rsquo;d;</p>\n<p>And prove thou to me, that my inmost thoughts</p>\n<p>I can reflect on thee.&rdquo; Thereat the light,</p>\n<p>That yet was new to me, from the recess,</p>\n<p>Where it before was singing, thus began,</p>\n<p>As one who joys in kindness: &ldquo;In that part</p>\n<p>Of the deprav&rsquo;d Italian land, which lies</p>\n<p>Between Rialto, and the fountain-springs</p>\n<p>Of Brenta and of Piava, there doth rise,</p>\n<p>But to no lofty eminence, a hill,</p>\n<p>From whence erewhile a firebrand did descend,</p>\n<p>That sorely sheet the region. From one root</p>\n<p>I and it sprang; my name on earth Cunizza:</p>\n<p>And here I glitter, for that by its light</p>\n<p>This star o&rsquo;ercame me. Yet I naught repine,</p>\n<p>Nor grudge myself the cause of this my lot,</p>\n<p>Which haply vulgar hearts can scarce conceive.</p>\n<p class="slindent">&ldquo;This jewel, that is next me in our heaven,</p>\n<p>Lustrous and costly, great renown hath left,</p>\n<p>And not to perish, ere these hundred years</p>\n<p>Five times absolve their round. Consider thou,</p>\n<p>If to excel be worthy man&rsquo;s endeavour,</p>\n<p>When such life may attend the first. Yet they</p>\n<p>Care not for this, the crowd that now are girt</p>\n<p>By Adice and Tagliamento, still</p>\n<p>Impenitent, tho&rsquo; scourg&rsquo;d. The hour is near,</p>\n<p>When for their stubbornness at Padua&rsquo;s marsh</p>\n<p>The water shall be chang&rsquo;d, that laves Vicena</p>\n<p>And where Cagnano meets with Sile, one</p>\n<p>Lords it, and bears his head aloft, for whom</p>\n<p>The web is now a-warping. Feltro too</p>\n<p>Shall sorrow for its godless shepherd&rsquo;s fault,</p>\n<p>Of so deep stain, that never, for the like,</p>\n<p>Was Malta&rsquo;s bar unclos&rsquo;d. Too large should be</p>\n<p>The skillet, that would hold Ferrara&rsquo;s blood,</p>\n<p>And wearied he, who ounce by ounce would weight it,</p>\n<p>The which this priest, in show of party-zeal,</p>\n<p>Courteous will give; nor will the gift ill suit</p>\n<p>The country&rsquo;s custom. We descry above,</p>\n<p>Mirrors, ye call them thrones, from which to us</p>\n<p>Reflected shine the judgments of our God:</p>\n<p>Whence these our sayings we avouch for good.&rdquo;</p>\n<p class="slindent">She ended, and appear&rsquo;d on other thoughts</p>\n<p>Intent, re-ent&rsquo;ring on the wheel she late</p>\n<p>Had left. That other joyance meanwhile wax&rsquo;d</p>\n<p>A thing to marvel at, in splendour glowing,</p>\n<p>Like choicest ruby stricken by the sun,</p>\n<p>For, in that upper clime, effulgence comes</p>\n<p>Of gladness, as here laughter: and below,</p>\n<p>As the mind saddens, murkier grows the shade.</p>\n<p class="slindent">&ldquo;God seeth all: and in him is thy sight,&rdquo;</p>\n<p>Said I, &ldquo;blest Spirit! Therefore will of his</p>\n<p>Cannot to thee be dark. Why then delays</p>\n<p>Thy voice to satisfy my wish untold,</p>\n<p>That voice which joins the inexpressive song,</p>\n<p>Pastime of heav&rsquo;n, the which those ardours sing,</p>\n<p>That cowl them with six shadowing wings outspread?</p>\n<p>I would not wait thy asking, wert thou known</p>\n<p>To me, as thoroughly I to thee am known.&rsquo;&rsquo;</p>\n<p class="slindent">He forthwith answ&rsquo;ring, thus his words began:</p>\n<p>&ldquo;The valley&rsquo; of waters, widest next to that</p>\n<p>Which doth the earth engarland, shapes its course,</p>\n<p>Between discordant shores, against the sun</p>\n<p>Inward so far, it makes meridian there,</p>\n<p>Where was before th&rsquo; horizon. Of that vale</p>\n<p>Dwelt I upon the shore, &rsquo;twixt Ebro&rsquo;s stream</p>\n<p>And Macra&rsquo;s, that divides with passage brief</p>\n<p>Genoan bounds from Tuscan. East and west</p>\n<p>Are nearly one to Begga and my land,</p>\n<p>Whose haven erst was with its own blood warm.</p>\n<p>Who knew my name were wont to call me Folco:</p>\n<p>And I did bear impression of this heav&rsquo;n,</p>\n<p>That now bears mine: for not with fiercer flame</p>\n<p>Glow&rsquo;d Belus&rsquo; daughter, injuring alike</p>\n<p>Sichaeus and Creusa, than did I,</p>\n<p>Long as it suited the unripen&rsquo;d down</p>\n<p>That fledg&rsquo;d my cheek: nor she of Rhodope,</p>\n<p>That was beguiled of Demophoon;</p>\n<p>Nor Jove&rsquo;s son, when the charms of Iole</p>\n<p>Were shrin&rsquo;d within his heart. And yet there hides</p>\n<p>No sorrowful repentance here, but mirth,</p>\n<p>Not for the fault (that doth not come to mind),</p>\n<p>But for the virtue, whose o&rsquo;erruling sway</p>\n<p>And providence have wrought thus quaintly. Here</p>\n<p>The skill is look&rsquo;d into, that fashioneth</p>\n<p>With such effectual working, and the good</p>\n<p>Discern&rsquo;d, accruing to this upper world</p>\n<p>From that below. But fully to content</p>\n<p>Thy wishes, all that in this sphere have birth,</p>\n<p>Demands my further parle. Inquire thou wouldst,</p>\n<p>Who of this light is denizen, that here</p>\n<p>Beside me sparkles, as the sun-beam doth</p>\n<p>On the clear wave. Know then, the soul of Rahab</p>\n<p>Is in that gladsome harbour, to our tribe</p>\n<p>United, and the foremost rank assign&rsquo;d.</p>\n<p>He to that heav&rsquo;n, at which the shadow ends</p>\n<p>Of your sublunar world, was taken up,</p>\n<p>First, in Christ&rsquo;s triumph, of all souls redeem&rsquo;d:</p>\n<p>For well behoov&rsquo;d, that, in some part of heav&rsquo;n,</p>\n<p>She should remain a trophy, to declare</p>\n<p>The mighty contest won with either palm;</p>\n<p>For that she favour&rsquo;d first the high exploit</p>\n<p>Of Joshua on the holy land, whereof</p>\n<p>The Pope recks little now. Thy city, plant</p>\n<p>Of him, that on his Maker turn&rsquo;d the back,</p>\n<p>And of whose envying so much woe hath sprung,</p>\n<p>Engenders and expands the cursed flower,</p>\n<p>That hath made wander both the sheep and lambs,</p>\n<p>Turning the shepherd to a wolf. For this,</p>\n<p>The gospel and great teachers laid aside,</p>\n<p>The decretals, as their stuft margins show,</p>\n<p>Are the sole study. Pope and Cardinals,</p>\n<p>Intent on these, ne&rsquo;er journey but in thought</p>\n<p>To Nazareth, where Gabriel op&rsquo;d his wings.</p>\n<p>Yet it may chance, erelong, the Vatican,</p>\n<p>And other most selected parts of Rome,</p>\n<p>That were the grave of Peter&rsquo;s soldiery,</p>\n<p>Shall be deliver&rsquo;d from the adult&rsquo;rous bond.&rdquo;</p>\n</div>','<p class="cantohead">Canto X</p>\n<div class="stanza"><p>Looking into his first-born with the love,</p>\n<p>Which breathes from both eternal, the first Might</p>\n<p>Ineffable, whence eye or mind</p>\n<p>Can roam, hath in such order all dispos&rsquo;d,</p>\n<p>As none may see and fail to&rsquo; enjoy. Raise, then,</p>\n<p>O reader! to the lofty wheels, with me,</p>\n<p>Thy ken directed to the point, whereat</p>\n<p>One motion strikes on th&rsquo; other. There begin</p>\n<p>Thy wonder of the mighty Architect,</p>\n<p>Who loves his work so inwardly, his eye</p>\n<p>Doth ever watch it. See, how thence oblique</p>\n<p>Brancheth the circle, where the planets roll</p>\n<p>To pour their wished influence on the world;</p>\n<p>Whose path not bending thus, in heav&rsquo;n above</p>\n<p>Much virtue would be lost, and here on earth,</p>\n<p>All power well nigh extinct: or, from direct</p>\n<p>Were its departure distant more or less,</p>\n<p>I&rsquo; th&rsquo; universal order, great defect</p>\n<p>Must, both in heav&rsquo;n and here beneath, ensue.</p>\n<p class="slindent">Now rest thee, reader! on thy bench, and muse</p>\n<p>Anticipative of the feast to come;</p>\n<p>So shall delight make thee not feel thy toil.</p>\n<p>Lo! I have set before thee, for thyself</p>\n<p>Feed now: the matter I indite, henceforth</p>\n<p>Demands entire my thought. Join&rsquo;d with the part,</p>\n<p>Which late we told of, the great minister</p>\n<p>Of nature, that upon the world imprints</p>\n<p>The virtue of the heaven, and doles out</p>\n<p>Time for us with his beam, went circling on</p>\n<p>Along the spires, where each hour sooner comes;</p>\n<p>And I was with him, weetless of ascent,</p>\n<p>As one, who till arriv&rsquo;d, weets not his coming.</p>\n<p class="slindent">For Beatrice, she who passeth on</p>\n<p>So suddenly from good to better, time</p>\n<p>Counts not the act, oh then how great must needs</p>\n<p>Have been her brightness! What she was i&rsquo; th&rsquo; sun</p>\n<p>(Where I had enter&rsquo;d), not through change of hue,</p>\n<p>But light transparent&mdash;did I summon up</p>\n<p>Genius, art, practice&mdash;I might not so speak,</p>\n<p>It should be e&rsquo;er imagin&rsquo;d: yet believ&rsquo;d</p>\n<p>It may be, and the sight be justly crav&rsquo;d.</p>\n<p>And if our fantasy fail of such height,</p>\n<p>What marvel, since no eye above the sun</p>\n<p>Hath ever travel&rsquo;d? Such are they dwell here,</p>\n<p>Fourth family of the Omnipotent Sire,</p>\n<p>Who of his spirit and of his offspring shows;</p>\n<p>And holds them still enraptur&rsquo;d with the view.</p>\n<p>And thus to me Beatrice: &ldquo;Thank, oh thank,</p>\n<p>The Sun of angels, him, who by his grace</p>\n<p>To this perceptible hath lifted thee.&rdquo;</p>\n<p class="slindent">Never was heart in such devotion bound,</p>\n<p>And with complacency so absolute</p>\n<p>Dispos&rsquo;d to render up itself to God,</p>\n<p>As mine was at those words: and so entire</p>\n<p>The love for Him, that held me, it eclips&rsquo;d</p>\n<p>Beatrice in oblivion. Naught displeas&rsquo;d</p>\n<p>Was she, but smil&rsquo;d thereat so joyously,</p>\n<p>That of her laughing eyes the radiance brake</p>\n<p>And scatter&rsquo;d my collected mind abroad.</p>\n<p class="slindent">Then saw I a bright band, in liveliness</p>\n<p>Surpassing, who themselves did make the crown,</p>\n<p>And us their centre: yet more sweet in voice,</p>\n<p>Than in their visage beaming. Cinctur&rsquo;d thus,</p>\n<p>Sometime Latona&rsquo;s daughter we behold,</p>\n<p>When the impregnate air retains the thread,</p>\n<p>That weaves her zone. In the celestial court,</p>\n<p>Whence I return, are many jewels found,</p>\n<p>So dear and beautiful, they cannot brook</p>\n<p>Transporting from that realm: and of these lights</p>\n<p>Such was the song. Who doth not prune his wing</p>\n<p>To soar up thither, let him look from thence</p>\n<p>For tidings from the dumb. When, singing thus,</p>\n<p>Those burning suns that circled round us thrice,</p>\n<p>As nearest stars around the fixed pole,</p>\n<p>Then seem&rsquo;d they like to ladies, from the dance</p>\n<p>Not ceasing, but suspense, in silent pause,</p>\n<p>List&rsquo;ning, till they have caught the strain anew:</p>\n<p>Suspended so they stood: and, from within,</p>\n<p>Thus heard I one, who spake: &ldquo;Since with its beam</p>\n<p>The grace, whence true love lighteth first his flame,</p>\n<p>That after doth increase by loving, shines</p>\n<p>So multiplied in thee, it leads thee up</p>\n<p>Along this ladder, down whose hallow&rsquo;d steps</p>\n<p>None e&rsquo;er descend, and mount them not again,</p>\n<p>Who from his phial should refuse thee wine</p>\n<p>To slake thy thirst, no less constrained were,</p>\n<p>Than water flowing not unto the sea.</p>\n<p>Thou fain wouldst hear, what plants are these, that bloom</p>\n<p>In the bright garland, which, admiring, girds</p>\n<p>This fair dame round, who strengthens thee for heav&rsquo;n.</p>\n<p>I then was of the lambs, that Dominic</p>\n<p>Leads, for his saintly flock, along the way,</p>\n<p>Where well they thrive, not sworn with vanity.</p>\n<p>He, nearest on my right hand, brother was,</p>\n<p>And master to me: Albert of Cologne</p>\n<p>Is this: and of Aquinum, Thomas I.</p>\n<p>If thou of all the rest wouldst be assur&rsquo;d,</p>\n<p>Let thine eye, waiting on the words I speak,</p>\n<p>In circuit journey round the blessed wreath.</p>\n<p>That next resplendence issues from the smile</p>\n<p>Of Gratian, who to either forum lent</p>\n<p>Such help, as favour wins in Paradise.</p>\n<p>The other, nearest, who adorns our quire,</p>\n<p>Was Peter, he that with the widow gave</p>\n<p>To holy church his treasure. The fifth light,</p>\n<p>Goodliest of all, is by such love inspired,</p>\n<p>That all your world craves tidings of its doom:</p>\n<p>Within, there is the lofty light, endow&rsquo;d</p>\n<p>With sapience so profound, if truth be truth,</p>\n<p>That with a ken of such wide amplitude</p>\n<p>No second hath arisen. Next behold</p>\n<p>That taper&rsquo;s radiance, to whose view was shown,</p>\n<p>Clearliest, the nature and the ministry</p>\n<p>Angelical, while yet in flesh it dwelt.</p>\n<p>In the other little light serenely smiles</p>\n<p>That pleader for the Christian temples, he</p>\n<p>Who did provide Augustin of his lore.</p>\n<p>Now, if thy mind&rsquo;s eye pass from light to light,</p>\n<p>Upon my praises following, of the eighth</p>\n<p>Thy thirst is next. The saintly soul, that shows</p>\n<p>The world&rsquo;s deceitfulness, to all who hear him,</p>\n<p>Is, with the sight of all the good, that is,</p>\n<p>Blest there. The limbs, whence it was driven, lie</p>\n<p>Down in Cieldauro, and from martyrdom</p>\n<p>And exile came it here. Lo! further on,</p>\n<p>Where flames the arduous Spirit of Isidore,</p>\n<p>Of Bede, and Richard, more than man, erewhile,</p>\n<p>In deep discernment. Lastly this, from whom</p>\n<p>Thy look on me reverteth, was the beam</p>\n<p>Of one, whose spirit, on high musings bent,</p>\n<p>Rebuk&rsquo;d the ling&rsquo;ring tardiness of death.</p>\n<p>It is the eternal light of Sigebert,</p>\n<p>Who &rsquo;scap&rsquo;d not envy, when of truth he argued,</p>\n<p>Reading in the straw-litter&rsquo;d street.&rdquo; Forthwith,</p>\n<p>As clock, that calleth up the spouse of God</p>\n<p>To win her bridegroom&rsquo;s love at matin&rsquo;s hour,</p>\n<p>Each part of other fitly drawn and urg&rsquo;d,</p>\n<p>Sends out a tinkling sound, of note so sweet,</p>\n<p>Affection springs in well-disposed breast;</p>\n<p>Thus saw I move the glorious wheel, thus heard</p>\n<p>Voice answ&rsquo;ring voice, so musical and soft,</p>\n<p>It can be known but where day endless shines.</p>\n</div>','<p class="cantohead">Canto XI</p>\n<div class="stanza"><p>O fond anxiety of mortal men!</p>\n<p>How vain and inconclusive arguments</p>\n<p>Are those, which make thee beat thy wings below</p>\n<p>For statues one, and one for aphorisms</p>\n<p>Was hunting; this the priesthood follow&rsquo;d, that</p>\n<p>By force or sophistry aspir&rsquo;d to rule;</p>\n<p>To rob another, and another sought</p>\n<p>By civil business wealth; one moiling lay</p>\n<p>Tangled in net of sensual delight,</p>\n<p>And one to witless indolence resign&rsquo;d;</p>\n<p>What time from all these empty things escap&rsquo;d,</p>\n<p>With Beatrice, I thus gloriously</p>\n<p>Was rais&rsquo;d aloft, and made the guest of heav&rsquo;n.</p>\n<p class="slindent">They of the circle to that point, each one.</p>\n<p>Where erst it was, had turn&rsquo;d; and steady glow&rsquo;d,</p>\n<p>As candle in his socket. Then within</p>\n<p>The lustre, that erewhile bespake me, smiling</p>\n<p>With merer gladness, heard I thus begin:</p>\n<p class="slindent">&ldquo;E&rsquo;en as his beam illumes me, so I look</p>\n<p>Into the eternal light, and clearly mark</p>\n<p>Thy thoughts, from whence they rise. Thou art in doubt,</p>\n<p>And wouldst, that I should bolt my words afresh</p>\n<p>In such plain open phrase, as may be smooth</p>\n<p>To thy perception, where I told thee late</p>\n<p>That &lsquo;well they thrive;&rsquo; and that &lsquo;no second such</p>\n<p>Hath risen,&rsquo; which no small distinction needs.</p>\n<p class="slindent">&ldquo;The providence, that governeth the world,</p>\n<p>In depth of counsel by created ken</p>\n<p>Unfathomable, to the end that she,</p>\n<p>Who with loud cries was &rsquo;spous&rsquo;d in precious blood,</p>\n<p>Might keep her footing towards her well-belov&rsquo;d,</p>\n<p>Safe in herself and constant unto him,</p>\n<p>Hath two ordain&rsquo;d, who should on either hand</p>\n<p>In chief escort her: one seraphic all</p>\n<p>In fervency; for wisdom upon earth,</p>\n<p>The other splendour of cherubic light.</p>\n<p>I but of one will tell: he tells of both,</p>\n<p>Who one commendeth. which of them so&rsquo;er</p>\n<p>Be taken: for their deeds were to one end.</p>\n<p class="slindent">&ldquo;Between Tupino, and the wave, that falls</p>\n<p>From blest Ubaldo&rsquo;s chosen hill, there hangs</p>\n<p>Rich slope of mountain high, whence heat and cold</p>\n<p>Are wafted through Perugia&rsquo;s eastern gate:</p>\n<p>And Norcera with Gualdo, in its rear</p>\n<p>Mourn for their heavy yoke. Upon that side,</p>\n<p>Where it doth break its steepness most, arose</p>\n<p>A sun upon the world, as duly this</p>\n<p>From Ganges doth: therefore let none, who speak</p>\n<p>Of that place, say Ascesi; for its name</p>\n<p>Were lamely so deliver&rsquo;d; but the East,</p>\n<p>To call things rightly, be it henceforth styl&rsquo;d.</p>\n<p>He was not yet much distant from his rising,</p>\n<p>When his good influence &rsquo;gan to bless the earth.</p>\n<p>A dame to whom none openeth pleasure&rsquo;s gate</p>\n<p>More than to death, was, &rsquo;gainst his father&rsquo;s will,</p>\n<p>His stripling choice: and he did make her his,</p>\n<p>Before the Spiritual court, by nuptial bonds,</p>\n<p>And in his father&rsquo;s sight: from day to day,</p>\n<p>Then lov&rsquo;d her more devoutly. She, bereav&rsquo;d</p>\n<p>Of her first husband, slighted and obscure,</p>\n<p>Thousand and hundred years and more, remain&rsquo;d</p>\n<p>Without a single suitor, till he came.</p>\n<p>Nor aught avail&rsquo;d, that, with Amyclas, she</p>\n<p>Was found unmov&rsquo;d at rumour of his voice,</p>\n<p>Who shook the world: nor aught her constant boldness</p>\n<p>Whereby with Christ she mounted on the cross,</p>\n<p>When Mary stay&rsquo;d beneath. But not to deal</p>\n<p>Thus closely with thee longer, take at large</p>\n<p>The rovers&rsquo; titles&mdash;Poverty and Francis.</p>\n<p>Their concord and glad looks, wonder and love,</p>\n<p>And sweet regard gave birth to holy thoughts,</p>\n<p>So much, that venerable Bernard first</p>\n<p>Did bare his feet, and, in pursuit of peace</p>\n<p>So heavenly, ran, yet deem&rsquo;d his footing slow.</p>\n<p>O hidden riches! O prolific good!</p>\n<p>Egidius bares him next, and next Sylvester,</p>\n<p>And follow both the bridegroom; so the bride</p>\n<p>Can please them. Thenceforth goes he on his way,</p>\n<p>The father and the master, with his spouse,</p>\n<p>And with that family, whom now the cord</p>\n<p>Girt humbly: nor did abjectness of heart</p>\n<p>Weigh down his eyelids, for that he was son</p>\n<p>Of Pietro Bernardone, and by men</p>\n<p>In wond&rsquo;rous sort despis&rsquo;d. But royally</p>\n<p>His hard intention he to Innocent</p>\n<p>Set forth, and from him first receiv&rsquo;d the seal</p>\n<p>On his religion. Then, when numerous flock&rsquo;d</p>\n<p>The tribe of lowly ones, that trac&rsquo;d HIS steps,</p>\n<p>Whose marvellous life deservedly were sung</p>\n<p>In heights empyreal, through Honorius&rsquo; hand</p>\n<p>A second crown, to deck their Guardian&rsquo;s virtues,</p>\n<p>Was by the eternal Spirit inwreath&rsquo;d: and when</p>\n<p>He had, through thirst of martyrdom, stood up</p>\n<p>In the proud Soldan&rsquo;s presence, and there preach&rsquo;d</p>\n<p>Christ and his followers; but found the race</p>\n<p>Unripen&rsquo;d for conversion: back once more</p>\n<p>He hasted (not to intermit his toil),</p>\n<p>And reap&rsquo;d Ausonian lands. On the hard rock,</p>\n<p>&rsquo;Twixt Arno and the Tyber, he from Christ</p>\n<p>Took the last Signet, which his limbs two years</p>\n<p>Did carry. Then the season come, that he,</p>\n<p>Who to such good had destin&rsquo;d him, was pleas&rsquo;d</p>\n<p>T&rsquo; advance him to the meed, which he had earn&rsquo;d</p>\n<p>By his self-humbling, to his brotherhood,</p>\n<p>As their just heritage, he gave in charge</p>\n<p>His dearest lady, and enjoin&rsquo;d their love</p>\n<p>And faith to her: and, from her bosom, will&rsquo;d</p>\n<p>His goodly spirit should move forth, returning</p>\n<p>To its appointed kingdom, nor would have</p>\n<p>His body laid upon another bier.</p>\n<p class="slindent">&ldquo;Think now of one, who were a fit colleague,</p>\n<p>To keep the bark of Peter in deep sea</p>\n<p>Helm&rsquo;d to right point; and such our Patriarch was.</p>\n<p>Therefore who follow him, as he enjoins,</p>\n<p>Thou mayst be certain, take good lading in.</p>\n<p>But hunger of new viands tempts his flock,</p>\n<p>So that they needs into strange pastures wide</p>\n<p>Must spread them: and the more remote from him</p>\n<p>The stragglers wander, so much mole they come</p>\n<p>Home to the sheep-fold, destitute of milk.</p>\n<p>There are of them, in truth, who fear their harm,</p>\n<p>And to the shepherd cleave; but these so few,</p>\n<p>A little stuff may furnish out their cloaks.</p>\n<p class="slindent">&ldquo;Now, if my words be clear, if thou have ta&rsquo;en</p>\n<p>Good heed, if that, which I have told, recall</p>\n<p>To mind, thy wish may be in part fulfill&rsquo;d:</p>\n<p>For thou wilt see the point from whence they split,</p>\n<p>Nor miss of the reproof, which that implies,</p>\n<p>&lsquo;That well they thrive not sworn with vanity.&rsquo;&nbsp;&rdquo;</p>\n</div>','<p class="cantohead">Canto XII</p>\n<div class="stanza"><p>Soon as its final word the blessed flame</p>\n<p>Had rais&rsquo;d for utterance, straight the holy mill</p>\n<p>Began to wheel, nor yet had once revolv&rsquo;d,</p>\n<p>Or ere another, circling, compass&rsquo;d it,</p>\n<p>Motion to motion, song to song, conjoining,</p>\n<p>Song, that as much our muses doth excel,</p>\n<p>Our Sirens with their tuneful pipes, as ray</p>\n<p>Of primal splendour doth its faint reflex.</p>\n<p class="slindent">As when, if Juno bid her handmaid forth,</p>\n<p>Two arches parallel, and trick&rsquo;d alike,</p>\n<p>Span the thin cloud, the outer taking birth</p>\n<p>From that within (in manner of that voice</p>\n<p>Whom love did melt away, as sun the mist),</p>\n<p>And they who gaze, presageful call to mind</p>\n<p>The compact, made with Noah, of the world</p>\n<p>No more to be o&rsquo;erflow&rsquo;d; about us thus</p>\n<p>Of sempiternal roses, bending, wreath&rsquo;d</p>\n<p>Those garlands twain, and to the innermost</p>\n<p>E&rsquo;en thus th&rsquo; external answered. When the footing,</p>\n<p>And other great festivity, of song,</p>\n<p>And radiance, light with light accordant, each</p>\n<p>Jocund and blythe, had at their pleasure still&rsquo;d</p>\n<p>(E&rsquo;en as the eyes by quick volition mov&rsquo;d,</p>\n<p>Are shut and rais&rsquo;d together), from the heart</p>\n<p>Of one amongst the new lights mov&rsquo;d a voice,</p>\n<p>That made me seem like needle to the star,</p>\n<p>In turning to its whereabout, and thus</p>\n<p>Began: &ldquo;The love, that makes me beautiful,</p>\n<p>Prompts me to tell of th&rsquo; other guide, for whom</p>\n<p>Such good of mine is spoken. Where one is,</p>\n<p>The other worthily should also be;</p>\n<p>That as their warfare was alike, alike</p>\n<p>Should be their glory. Slow, and full of doubt,</p>\n<p>And with thin ranks, after its banner mov&rsquo;d</p>\n<p>The army of Christ (which it so clearly cost</p>\n<p>To reappoint), when its imperial Head,</p>\n<p>Who reigneth ever, for the drooping host</p>\n<p>Did make provision, thorough grace alone,</p>\n<p>And not through its deserving. As thou heard&rsquo;st,</p>\n<p>Two champions to the succour of his spouse</p>\n<p>He sent, who by their deeds and words might join</p>\n<p>Again his scatter&rsquo;d people. In that clime,</p>\n<p>Where springs the pleasant west-wind to unfold</p>\n<p>The fresh leaves, with which Europe sees herself</p>\n<p>New-garmented; nor from those billows far,</p>\n<p>Beyond whose chiding, after weary course,</p>\n<p>The sun doth sometimes hide him, safe abides</p>\n<p>The happy Callaroga, under guard</p>\n<p>Of the great shield, wherein the lion lies</p>\n<p>Subjected and supreme. And there was born</p>\n<p>The loving million of the Christian faith,</p>\n<p>The hollow&rsquo;d wrestler, gentle to his own,</p>\n<p>And to his enemies terrible. So replete</p>\n<p>His soul with lively virtue, that when first</p>\n<p>Created, even in the mother&rsquo;s womb,</p>\n<p>It prophesied. When, at the sacred font,</p>\n<p>The spousals were complete &rsquo;twixt faith and him,</p>\n<p>Where pledge of mutual safety was exchang&rsquo;d,</p>\n<p>The dame, who was his surety, in her sleep</p>\n<p>Beheld the wondrous fruit, that was from him</p>\n<p>And from his heirs to issue. And that such</p>\n<p>He might be construed, as indeed he was,</p>\n<p>She was inspir&rsquo;d to name him of his owner,</p>\n<p>Whose he was wholly, and so call&rsquo;d him Dominic.</p>\n<p>And I speak of him, as the labourer,</p>\n<p>Whom Christ in his own garden chose to be</p>\n<p>His help-mate. Messenger he seem&rsquo;d, and friend</p>\n<p>Fast-knit to Christ; and the first love he show&rsquo;d,</p>\n<p>Was after the first counsel that Christ gave.</p>\n<p>Many a time his nurse, at entering found</p>\n<p>That he had ris&rsquo;n in silence, and was prostrate,</p>\n<p>As who should say, &ldquo;My errand was for this.&rdquo;</p>\n<p>O happy father! Felix rightly nam&rsquo;d!</p>\n<p>O favour&rsquo;d mother! rightly nam&rsquo;d Joanna!</p>\n<p>If that do mean, as men interpret it.</p>\n<p>Not for the world&rsquo;s sake, for which now they pore</p>\n<p>Upon Ostiense and Taddeo&rsquo;s page,</p>\n<p>But for the real manna, soon he grew</p>\n<p>Mighty in learning, and did set himself</p>\n<p>To go about the vineyard, that soon turns</p>\n<p>To wan and wither&rsquo;d, if not tended well:</p>\n<p>And from the see (whose bounty to the just</p>\n<p>And needy is gone by, not through its fault,</p>\n<p>But his who fills it basely), he besought,</p>\n<p>No dispensation for commuted wrong,</p>\n<p>Nor the first vacant fortune, nor the tenth),</p>\n<p>That to God&rsquo;s paupers rightly appertain,</p>\n<p>But, &rsquo;gainst an erring and degenerate world,</p>\n<p>Licence to fight, in favour of that seed,</p>\n<p>From which the twice twelve cions gird thee round.</p>\n<p>Then, with sage doctrine and good will to help,</p>\n<p>Forth on his great apostleship he far&rsquo;d,</p>\n<p>Like torrent bursting from a lofty vein;</p>\n<p>And, dashing &rsquo;gainst the stocks of heresy,</p>\n<p>Smote fiercest, where resistance was most stout.</p>\n<p>Thence many rivulets have since been turn&rsquo;d,</p>\n<p>Over the garden Catholic to lead</p>\n<p>Their living waters, and have fed its plants.</p>\n<p class="slindent">&ldquo;If such one wheel of that two-yoked car,</p>\n<p>Wherein the holy church defended her,</p>\n<p>And rode triumphant through the civil broil.</p>\n<p>Thou canst not doubt its fellow&rsquo;s excellence,</p>\n<p>Which Thomas, ere my coming, hath declar&rsquo;d</p>\n<p>So courteously unto thee. But the track,</p>\n<p>Which its smooth fellies made, is now deserted:</p>\n<p>That mouldy mother is where late were lees.</p>\n<p>His family, that wont to trace his path,</p>\n<p>Turn backward, and invert their steps; erelong</p>\n<p>To rue the gathering in of their ill crop,</p>\n<p>When the rejected tares in vain shall ask</p>\n<p>Admittance to the barn. I question not</p>\n<p>But he, who search&rsquo;d our volume, leaf by leaf,</p>\n<p>Might still find page with this inscription on&rsquo;t,</p>\n<p>&lsquo;I am as I was wont.&rsquo; Yet such were not</p>\n<p>From Acquasparta nor Casale, whence</p>\n<p>Of those, who come to meddle with the text,</p>\n<p>One stretches and another cramps its rule.</p>\n<p>Bonaventura&rsquo;s life in me behold,</p>\n<p>From Bagnororegio, one, who in discharge</p>\n<p>Of my great offices still laid aside</p>\n<p>All sinister aim. Illuminato here,</p>\n<p>And Agostino join me: two they were,</p>\n<p>Among the first of those barefooted meek ones,</p>\n<p>Who sought God&rsquo;s friendship in the cord: with them</p>\n<p>Hugues of Saint Victor, Pietro Mangiadore,</p>\n<p>And he of Spain in his twelve volumes shining,</p>\n<p>Nathan the prophet, Metropolitan</p>\n<p>Chrysostom, and Anselmo, and, who deign&rsquo;d</p>\n<p>To put his hand to the first art, Donatus.</p>\n<p>Raban is here: and at my side there shines</p>\n<p>Calabria&rsquo;s abbot, Joachim , endow&rsquo;d</p>\n<p>With soul prophetic. The bright courtesy</p>\n<p>Of friar Thomas, and his goodly lore,</p>\n<p>Have mov&rsquo;d me to the blazon of a peer</p>\n<p>So worthy, and with me have mov&rsquo;d this throng.&rdquo;</p>\n</div>','<p class="cantohead">Canto XIII</p>\n<div class="stanza"><p>Let him, who would conceive what now I saw,</p>\n<p>Imagine (and retain the image firm,</p>\n<p>As mountain rock, the whilst he hears me speak),</p>\n<p>Of stars fifteen, from midst the ethereal host</p>\n<p>Selected, that, with lively ray serene,</p>\n<p>O&rsquo;ercome the massiest air: thereto imagine</p>\n<p>The wain, that, in the bosom of our sky,</p>\n<p>Spins ever on its axle night and day,</p>\n<p>With the bright summit of that horn which swells</p>\n<p>Due from the pole, round which the first wheel rolls,</p>\n<p>T&rsquo; have rang&rsquo;d themselves in fashion of two signs</p>\n<p>In heav&rsquo;n, such as Ariadne made,</p>\n<p>When death&rsquo;s chill seized her; and that one of them</p>\n<p>Did compass in the other&rsquo;s beam; and both</p>\n<p>In such sort whirl around, that each should tend</p>\n<p>With opposite motion and, conceiving thus,</p>\n<p>Of that true constellation, and the dance</p>\n<p>Twofold, that circled me, he shall attain</p>\n<p>As &rsquo;t were the shadow; for things there as much</p>\n<p>Surpass our usage, as the swiftest heav&rsquo;n</p>\n<p>Is swifter than the Chiana. There was sung</p>\n<p>No Bacchus, and no Io Paean, but</p>\n<p>Three Persons in the Godhead, and in one</p>\n<p>Substance that nature and the human join&rsquo;d.</p>\n<p class="slindent">The song fulfill&rsquo;d its measure; and to us</p>\n<p>Those saintly lights attended, happier made</p>\n<p>At each new minist&rsquo;ring. Then silence brake,</p>\n<p>Amid th&rsquo; accordant sons of Deity,</p>\n<p>That luminary, in which the wondrous life</p>\n<p>Of the meek man of God was told to me;</p>\n<p>And thus it spake: &ldquo;One ear o&rsquo; th&rsquo; harvest thresh&rsquo;d,</p>\n<p>And its grain safely stor&rsquo;d, sweet charity</p>\n<p>Invites me with the other to like toil.</p>\n<p class="slindent">&ldquo;Thou know&rsquo;st, that in the bosom, whence the rib</p>\n<p>Was ta&rsquo;en to fashion that fair cheek, whose taste</p>\n<p>All the world pays for, and in that, which pierc&rsquo;d</p>\n<p>By the keen lance, both after and before</p>\n<p>Such satisfaction offer&rsquo;d, as outweighs</p>\n<p>Each evil in the scale, whate&rsquo;er of light</p>\n<p>To human nature is allow&rsquo;d, must all</p>\n<p>Have by his virtue been infus&rsquo;d, who form&rsquo;d</p>\n<p>Both one and other: and thou thence admir&rsquo;st</p>\n<p>In that I told thee, of beatitudes</p>\n<p>A second, there is none, to his enclos&rsquo;d</p>\n<p>In the fifth radiance. Open now thine eyes</p>\n<p>To what I answer thee; and thou shalt see</p>\n<p>Thy deeming and my saying meet in truth,</p>\n<p>As centre in the round. That which dies not,</p>\n<p>And that which can die, are but each the beam</p>\n<p>Of that idea, which our Soverign Sire</p>\n<p>Engendereth loving; for that lively light,</p>\n<p>Which passeth from his brightness; not disjoin&rsquo;d</p>\n<p>From him, nor from his love triune with them,</p>\n<p>Doth, through his bounty, congregate itself,</p>\n<p>Mirror&rsquo;d, as &rsquo;t were in new existences,</p>\n<p>Itself unalterable and ever one.</p>\n<p class="slindent">&ldquo;Descending hence unto the lowest powers,</p>\n<p>Its energy so sinks, at last it makes</p>\n<p>But brief contingencies: for so I name</p>\n<p>Things generated, which the heav&rsquo;nly orbs</p>\n<p>Moving, with seed or without seed, produce.</p>\n<p>Their wax, and that which molds it, differ much:</p>\n<p>And thence with lustre, more or less, it shows</p>\n<p>Th&rsquo; ideal stamp impress: so that one tree</p>\n<p>According to his kind, hath better fruit,</p>\n<p>And worse: and, at your birth, ye, mortal men,</p>\n<p>Are in your talents various. Were the wax</p>\n<p>Molded with nice exactness, and the heav&rsquo;n</p>\n<p>In its disposing influence supreme,</p>\n<p>The lustre of the seal should be complete:</p>\n<p>But nature renders it imperfect ever,</p>\n<p>Resembling thus the artist in her work,</p>\n<p>Whose faultering hand is faithless to his skill.</p>\n<p>Howe&rsquo;er, if love itself dispose, and mark</p>\n<p>The primal virtue, kindling with bright view,</p>\n<p>There all perfection is vouchsafed; and such</p>\n<p>The clay was made, accomplish&rsquo;d with each gift,</p>\n<p>That life can teem with; such the burden fill&rsquo;d</p>\n<p>The virgin&rsquo;s bosom: so that I commend</p>\n<p>Thy judgment, that the human nature ne&rsquo;er</p>\n<p>Was or can be, such as in them it was.</p>\n<p class="slindent">&ldquo;Did I advance no further than this point,</p>\n<p>&lsquo;How then had he no peer?&rsquo; thou might&rsquo;st reply.</p>\n<p>But, that what now appears not, may appear</p>\n<p>Right plainly, ponder, who he was, and what</p>\n<p>(When he was bidden &lsquo;Ask&rsquo;), the motive sway&rsquo;d</p>\n<p>To his requesting. I have spoken thus,</p>\n<p>That thou mayst see, he was a king, who ask&rsquo;d</p>\n<p>For wisdom, to the end he might be king</p>\n<p>Sufficient: not the number to search out</p>\n<p>Of the celestial movers; or to know,</p>\n<p>If necessary with contingent e&rsquo;er</p>\n<p>Have made necessity; or whether that</p>\n<p>Be granted, that first motion is; or if</p>\n<p>Of the mid circle can, by art, be made</p>\n<p>Triangle with each corner, blunt or sharp.</p>\n<p class="slindent">&ldquo;Whence, noting that, which I have said, and this,</p>\n<p>Thou kingly prudence and that ken mayst learn,</p>\n<p>At which the dart of my intention aims.</p>\n<p>And, marking clearly, that I told thee, &lsquo;Risen,&rsquo;</p>\n<p>Thou shalt discern it only hath respect</p>\n<p>To kings, of whom are many, and the good</p>\n<p>Are rare. With this distinction take my words;</p>\n<p>And they may well consist with that which thou</p>\n<p>Of the first human father dost believe,</p>\n<p>And of our well-beloved. And let this</p>\n<p>Henceforth be led unto thy feet, to make</p>\n<p>Thee slow in motion, as a weary man,</p>\n<p>Both to the &lsquo;yea&rsquo; and to the &lsquo;nay&rsquo; thou seest not.</p>\n<p>For he among the fools is down full low,</p>\n<p>Whose affirmation, or denial, is</p>\n<p>Without distinction, in each case alike</p>\n<p>Since it befalls, that in most instances</p>\n<p>Current opinion leads to false: and then</p>\n<p>Affection bends the judgment to her ply.</p>\n<p class="slindent">&ldquo;Much more than vainly doth he loose from shore,</p>\n<p>Since he returns not such as he set forth,</p>\n<p>Who fishes for the truth and wanteth skill.</p>\n<p>And open proofs of this unto the world</p>\n<p>Have been afforded in Parmenides,</p>\n<p>Melissus, Bryso, and the crowd beside,</p>\n<p>Who journey&rsquo;d on, and knew not whither: so did</p>\n<p>Sabellius, Arius, and the other fools,</p>\n<p>Who, like to scymitars, reflected back</p>\n<p>The scripture-image, by distortion marr&rsquo;d.</p>\n<p class="slindent">&ldquo;Let not the people be too swift to judge,</p>\n<p>As one who reckons on the blades in field,</p>\n<p>Or ere the crop be ripe. For I have seen</p>\n<p>The thorn frown rudely all the winter long</p>\n<p>And after bear the rose upon its top;</p>\n<p>And bark, that all the way across the sea</p>\n<p>Ran straight and speedy, perish at the last,</p>\n<p>E&rsquo;en in the haven&rsquo;s mouth seeing one steal,</p>\n<p>Another brine, his offering to the priest,</p>\n<p>Let not Dame Birtha and Sir Martin thence</p>\n<p>Into heav&rsquo;n&rsquo;s counsels deem that they can pry:</p>\n<p>For one of these may rise, the other fall.&rdquo;</p>\n</div>','<p class="cantohead">Canto XIV</p>\n<div class="stanza"><p>From centre to the circle, and so back</p>\n<p>From circle to the centre, water moves</p>\n<p>In the round chalice, even as the blow</p>\n<p>Impels it, inwardly, or from without.</p>\n<p>Such was the image glanc&rsquo;d into my mind,</p>\n<p>As the great spirit of Aquinum ceas&rsquo;d;</p>\n<p>And Beatrice after him her words</p>\n<p>Resum&rsquo;d alternate: &ldquo;Need there is (tho&rsquo; yet</p>\n<p>He tells it to you not in words, nor e&rsquo;en</p>\n<p>In thought) that he should fathom to its depth</p>\n<p>Another mystery. Tell him, if the light,</p>\n<p>Wherewith your substance blooms, shall stay with you</p>\n<p>Eternally, as now: and, if it doth,</p>\n<p>How, when ye shall regain your visible forms,</p>\n<p>The sight may without harm endure the change,</p>\n<p>That also tell.&rdquo; As those, who in a ring</p>\n<p>Tread the light measure, in their fitful mirth</p>\n<p>Raise loud the voice, and spring with gladder bound;</p>\n<p>Thus, at the hearing of that pious suit,</p>\n<p>The saintly circles in their tourneying</p>\n<p>And wond&rsquo;rous note attested new delight.</p>\n<p class="slindent">Whoso laments, that we must doff this garb</p>\n<p>Of frail mortality, thenceforth to live</p>\n<p>Immortally above, he hath not seen</p>\n<p>The sweet refreshing, of that heav&rsquo;nly shower.</p>\n<p class="slindent">Him, who lives ever, and for ever reigns</p>\n<p>In mystic union of the Three in One,</p>\n<p>Unbounded, bounding all, each spirit thrice</p>\n<p>Sang, with such melody, as but to hear</p>\n<p>For highest merit were an ample meed.</p>\n<p>And from the lesser orb the goodliest light,</p>\n<p>With gentle voice and mild, such as perhaps</p>\n<p>The angel&rsquo;s once to Mary, thus replied:</p>\n<p>&ldquo;Long as the joy of Paradise shall last,</p>\n<p>Our love shall shine around that raiment, bright,</p>\n<p>As fervent; fervent, as in vision blest;</p>\n<p>And that as far in blessedness exceeding,</p>\n<p>As it hath grave beyond its virtue great.</p>\n<p>Our shape, regarmented with glorious weeds</p>\n<p>Of saintly flesh, must, being thus entire,</p>\n<p>Show yet more gracious. Therefore shall increase,</p>\n<p>Whate&rsquo;er of light, gratuitous, imparts</p>\n<p>The Supreme Good; light, ministering aid,</p>\n<p>The better disclose his glory: whence</p>\n<p>The vision needs increasing, much increase</p>\n<p>The fervour, which it kindles; and that too</p>\n<p>The ray, that comes from it. But as the greed</p>\n<p>Which gives out flame, yet it its whiteness shines</p>\n<p>More lively than that, and so preserves</p>\n<p>Its proper semblance; thus this circling sphere</p>\n<p>Of splendour, shall to view less radiant seem,</p>\n<p>Than shall our fleshly robe, which yonder earth</p>\n<p>Now covers. Nor will such excess of light</p>\n<p>O&rsquo;erpower us, in corporeal organs made</p>\n<p>Firm, and susceptible of all delight.&rdquo;</p>\n<p class="slindent">So ready and so cordial an &ldquo;Amen,&rdquo;</p>\n<p>Followed from either choir, as plainly spoke</p>\n<p>Desire of their dead bodies; yet perchance</p>\n<p>Not for themselves, but for their kindred dear,</p>\n<p>Mothers and sires, and those whom best they lov&rsquo;d,</p>\n<p>Ere they were made imperishable flame.</p>\n<p class="slindent">And lo! forthwith there rose up round about</p>\n<p>A lustre over that already there,</p>\n<p>Of equal clearness, like the brightening up</p>\n<p>Of the horizon. As at an evening hour</p>\n<p>Of twilight, new appearances through heav&rsquo;n</p>\n<p>Peer with faint glimmer, doubtfully descried;</p>\n<p>So there new substances, methought began</p>\n<p>To rise in view; and round the other twain</p>\n<p>Enwheeling, sweep their ampler circuit wide.</p>\n<p class="slindent">O gentle glitter of eternal beam!</p>\n<p>With what a such whiteness did it flow,</p>\n<p>O&rsquo;erpowering vision in me! But so fair,</p>\n<p>So passing lovely, Beatrice show&rsquo;d,</p>\n<p>Mind cannot follow it, nor words express</p>\n<p>Her infinite sweetness. Thence mine eyes regain&rsquo;d</p>\n<p>Power to look up, and I beheld myself,</p>\n<p>Sole with my lady, to more lofty bliss</p>\n<p>Translated: for the star, with warmer smile</p>\n<p>Impurpled, well denoted our ascent.</p>\n<p class="slindent">With all the heart, and with that tongue which speaks</p>\n<p>The same in all, an holocaust I made</p>\n<p>To God, befitting the new grace vouchsaf&rsquo;d.</p>\n<p>And from my bosom had not yet upsteam&rsquo;d</p>\n<p>The fuming of that incense, when I knew</p>\n<p>The rite accepted. With such mighty sheen</p>\n<p>And mantling crimson, in two listed rays</p>\n<p>The splendours shot before me, that I cried,</p>\n<p>&ldquo;God of Sabaoth! that does prank them thus!&rdquo;</p>\n<p class="slindent">As leads the galaxy from pole to pole,</p>\n<p>Distinguish&rsquo;d into greater lights and less,</p>\n<p>Its pathway, which the wisest fail to spell;</p>\n<p>So thickly studded, in the depth of Mars,</p>\n<p>Those rays describ&rsquo;d the venerable sign,</p>\n<p>That quadrants in the round conjoining frame.</p>\n<p>Here memory mocks the toil of genius. Christ</p>\n<p>Beam&rsquo;d on that cross; and pattern fails me now.</p>\n<p>But whoso takes his cross, and follows Christ</p>\n<p>Will pardon me for that I leave untold,</p>\n<p>When in the flecker&rsquo;d dawning he shall spy</p>\n<p>The glitterance of Christ. From horn to horn,</p>\n<p>And &rsquo;tween the summit and the base did move</p>\n<p>Lights, scintillating, as they met and pass&rsquo;d.</p>\n<p>Thus oft are seen, with ever-changeful glance,</p>\n<p>Straight or athwart, now rapid and now slow,</p>\n<p>The atomies of bodies, long or short,</p>\n<p>To move along the sunbeam, whose slant line</p>\n<p>Checkers the shadow, interpos&rsquo;d by art</p>\n<p>Against the noontide heat. And as the chime</p>\n<p>Of minstrel music, dulcimer, and help</p>\n<p>With many strings, a pleasant dining makes</p>\n<p>To him, who heareth not distinct the note;</p>\n<p>So from the lights, which there appear&rsquo;d to me,</p>\n<p>Gather&rsquo;d along the cross a melody,</p>\n<p>That, indistinctly heard, with ravishment</p>\n<p>Possess&rsquo;d me. Yet I mark&rsquo;d it was a hymn</p>\n<p>Of lofty praises; for there came to me</p>\n<p>&ldquo;Arise and conquer,&rdquo; as to one who hears</p>\n<p>And comprehends not. Me such ecstasy</p>\n<p>O&rsquo;ercame, that never till that hour was thing</p>\n<p>That held me in so sweet imprisonment.</p>\n<p class="slindent">Perhaps my saying over bold appears,</p>\n<p>Accounting less the pleasure of those eyes,</p>\n<p>Whereon to look fulfilleth all desire.</p>\n<p>But he, who is aware those living seals</p>\n<p>Of every beauty work with quicker force,</p>\n<p>The higher they are ris&rsquo;n; and that there</p>\n<p>I had not turn&rsquo;d me to them; he may well</p>\n<p>Excuse me that, whereof in my excuse</p>\n<p>I do accuse me, and may own my truth;</p>\n<p>That holy pleasure here not yet reveal&rsquo;d,</p>\n<p>Which grows in transport as we mount aloof.</p>\n</div>','<p class="cantohead">Canto XV</p>\n<div class="stanza"><p>True love, that ever shows itself as clear</p>\n<p>In kindness, as loose appetite in wrong,</p>\n<p>Silenced that lyre harmonious, and still&rsquo;d</p>\n<p>The sacred chords, that are by heav&rsquo;n&rsquo;s right hand</p>\n<p>Unwound and tighten&rsquo;d, flow to righteous prayers</p>\n<p>Should they not hearken, who, to give me will</p>\n<p>For praying, in accordance thus were mute?</p>\n<p>He hath in sooth good cause for endless grief,</p>\n<p>Who, for the love of thing that lasteth not,</p>\n<p>Despoils himself forever of that love.</p>\n<p class="slindent">As oft along the still and pure serene,</p>\n<p>At nightfall, glides a sudden trail of fire,</p>\n<p>Attracting with involuntary heed</p>\n<p>The eye to follow it, erewhile at rest,</p>\n<p>And seems some star that shifted place in heav&rsquo;n,</p>\n<p>Only that, whence it kindles, none is lost,</p>\n<p>And it is soon extinct; thus from the horn,</p>\n<p>That on the dexter of the cross extends,</p>\n<p>Down to its foot, one luminary ran</p>\n<p>From mid the cluster shone there; yet no gem</p>\n<p>Dropp&rsquo;d from its foil; and through the beamy list</p>\n<p>Like flame in alabaster, glow&rsquo;d its course.</p>\n<p class="slindent">So forward stretch&rsquo;d him (if of credence aught</p>\n<p>Our greater muse may claim) the pious ghost</p>\n<p>Of old Anchises, in the&rsquo; Elysian bower,</p>\n<p>When he perceiv&rsquo;d his son. &ldquo;O thou, my blood!</p>\n<p>O most exceeding grace divine! to whom,</p>\n<p>As now to thee, hath twice the heav&rsquo;nly gate</p>\n<p>Been e&rsquo;er unclos&rsquo;d?&rdquo; so spake the light; whence I</p>\n<p>Turn&rsquo;d me toward him; then unto my dame</p>\n<p>My sight directed, and on either side</p>\n<p>Amazement waited me; for in her eyes</p>\n<p>Was lighted such a smile, I thought that mine</p>\n<p>Had div&rsquo;d unto the bottom of my grace</p>\n<p>And of my bliss in Paradise. Forthwith</p>\n<p>To hearing and to sight grateful alike,</p>\n<p>The spirit to his proem added things</p>\n<p>I understood not, so profound he spake;</p>\n<p>Yet not of choice but through necessity</p>\n<p>Mysterious; for his high conception scar&rsquo;d</p>\n<p>Beyond the mark of mortals. When the flight</p>\n<p>Of holy transport had so spent its rage,</p>\n<p>That nearer to the level of our thought</p>\n<p>The speech descended, the first sounds I heard</p>\n<p>Were, &ldquo;Best he thou, Triunal Deity!</p>\n<p>That hast such favour in my seed vouchsaf&rsquo;d!&rdquo;</p>\n<p>Then follow&rsquo;d: &ldquo;No unpleasant thirst, tho&rsquo; long,</p>\n<p>Which took me reading in the sacred book,</p>\n<p>Whose leaves or white or dusky never change,</p>\n<p>Thou hast allay&rsquo;d, my son, within this light,</p>\n<p>From whence my voice thou hear&rsquo;st; more thanks to her.</p>\n<p>Who for such lofty mounting has with plumes</p>\n<p>Begirt thee. Thou dost deem thy thoughts to me</p>\n<p>From him transmitted, who is first of all,</p>\n<p>E&rsquo;en as all numbers ray from unity;</p>\n<p>And therefore dost not ask me who I am,</p>\n<p>Or why to thee more joyous I appear,</p>\n<p>Than any other in this gladsome throng.</p>\n<p>The truth is as thou deem&rsquo;st; for in this hue</p>\n<p>Both less and greater in that mirror look,</p>\n<p>In which thy thoughts, or ere thou think&rsquo;st, are shown.</p>\n<p>But, that the love, which keeps me wakeful ever,</p>\n<p>Urging with sacred thirst of sweet desire,</p>\n<p>May be contended fully, let thy voice,</p>\n<p>Fearless, and frank and jocund, utter forth</p>\n<p>Thy will distinctly, utter forth the wish,</p>\n<p>Whereto my ready answer stands decreed.&rdquo;</p>\n<p class="slindent">I turn&rsquo;d me to Beatrice; and she heard</p>\n<p>Ere I had spoken, smiling, an assent,</p>\n<p>That to my will gave wings; and I began</p>\n<p>&ldquo;To each among your tribe, what time ye kenn&rsquo;d</p>\n<p>The nature, in whom naught unequal dwells,</p>\n<p>Wisdom and love were in one measure dealt;</p>\n<p>For that they are so equal in the sun,</p>\n<p>From whence ye drew your radiance and your heat,</p>\n<p>As makes all likeness scant. But will and means,</p>\n<p>In mortals, for the cause ye well discern,</p>\n<p>With unlike wings are fledge. A mortal I</p>\n<p>Experience inequality like this,</p>\n<p>And therefore give no thanks, but in the heart,</p>\n<p>For thy paternal greeting. This howe&rsquo;er</p>\n<p>I pray thee, living topaz! that ingemm&rsquo;st</p>\n<p>This precious jewel, let me hear thy name.&rdquo;</p>\n<p class="slindent">&ldquo;I am thy root, O leaf! whom to expect</p>\n<p>Even, hath pleas&rsquo;d me: &ldquo;thus the prompt reply</p>\n<p>Prefacing, next it added; &ldquo;he, of whom</p>\n<p>Thy kindred appellation comes, and who,</p>\n<p>These hundred years and more, on its first ledge</p>\n<p>Hath circuited the mountain, was my son</p>\n<p>And thy great grandsire. Well befits, his long</p>\n<p>Endurance should he shorten&rsquo;d by thy deeds.</p>\n<p class="slindent">&ldquo;Florence, within her ancient limit-mark,</p>\n<p>Which calls her still to matin prayers and noon,</p>\n<p>Was chaste and sober, and abode in peace.</p>\n<p>She had no armlets and no head-tires then,</p>\n<p>No purfled dames, no zone, that caught the eye</p>\n<p>More than the person did. Time was not yet,</p>\n<p>When at his daughter&rsquo;s birth the sire grew pale.</p>\n<p>For fear the age and dowry should exceed</p>\n<p>On each side just proportion. House was none</p>\n<p>Void of its family; nor yet had come</p>\n<p>Hardanapalus, to exhibit feats</p>\n<p>Of chamber prowess. Montemalo yet</p>\n<p>O&rsquo;er our suburban turret rose; as much</p>\n<p>To be surpass in fall, as in its rising.</p>\n<p>I saw Bellincione Berti walk abroad</p>\n<p>In leathern girdle and a clasp of bone;</p>\n<p>And, with no artful colouring on her cheeks,</p>\n<p>His lady leave the glass. The sons I saw</p>\n<p>Of Nerli and of Vecchio well content</p>\n<p>With unrob&rsquo;d jerkin; and their good dames handling</p>\n<p>The spindle and the flax; O happy they!</p>\n<p>Each sure of burial in her native land,</p>\n<p>And none left desolate a-bed for France!</p>\n<p>One wak&rsquo;d to tend the cradle, hushing it</p>\n<p>With sounds that lull&rsquo;d the parent&rsquo;s infancy:</p>\n<p>Another, with her maidens, drawing off</p>\n<p>The tresses from the distaff, lectur&rsquo;d them</p>\n<p>Old tales of Troy and Fesole and Rome.</p>\n<p>A Salterello and Cianghella we</p>\n<p>Had held as strange a marvel, as ye would</p>\n<p>A Cincinnatus or Cornelia now.</p>\n<p class="slindent">&ldquo;In such compos&rsquo;d and seemly fellowship,</p>\n<p>Such faithful and such fair equality,</p>\n<p>In so sweet household, Mary at my birth</p>\n<p>Bestow&rsquo;d me, call&rsquo;d on with loud cries; and there</p>\n<p>In your old baptistery, I was made</p>\n<p>Christian at once and Cacciaguida; as were</p>\n<p>My brethren, Eliseo and Moronto.</p>\n<p class="slindent">&ldquo;From Valdipado came to me my spouse,</p>\n<p>And hence thy surname grew. I follow&rsquo;d then</p>\n<p>The Emperor Conrad; and his knighthood he</p>\n<p>Did gird on me; in such good part he took</p>\n<p>My valiant service. After him I went</p>\n<p>To testify against that evil law,</p>\n<p>Whose people, by the shepherd&rsquo;s fault, possess</p>\n<p>Your right, usurping. There, by that foul crew</p>\n<p>Was I releas&rsquo;d from the deceitful world,</p>\n<p>Whose base affection many a spirit soils,</p>\n<p>And from the martyrdom came to this peace.&rdquo;</p>\n</div>','<p class="cantohead">Canto XVI</p>\n<div class="stanza"><p>O slight respect of man&rsquo;s nobility!</p>\n<p>I never shall account it marvelous,</p>\n<p>That our infirm affection here below</p>\n<p>Thou mov&rsquo;st to boasting, when I could not choose,</p>\n<p>E&rsquo;en in that region of unwarp&rsquo;d desire,</p>\n<p>In heav&rsquo;n itself, but make my vaunt in thee!</p>\n<p>Yet cloak thou art soon shorten&rsquo;d, for that time,</p>\n<p>Unless thou be eked out from day to day,</p>\n<p>Goes round thee with his shears. Resuming then</p>\n<p>With greeting such, as Rome, was first to bear,</p>\n<p>But since hath disaccustom&rsquo;d I began;</p>\n<p>And Beatrice, that a little space</p>\n<p>Was sever&rsquo;d, smil&rsquo;d reminding me of her,</p>\n<p>Whose cough embolden&rsquo;d (as the story holds)</p>\n<p>To first offence the doubting Guenever.</p>\n<p class="slindent">&ldquo;You are my sire,&rdquo; said I, &ldquo;you give me heart</p>\n<p>Freely to speak my thought: above myself</p>\n<p>You raise me. Through so many streams with joy</p>\n<p>My soul is fill&rsquo;d, that gladness wells from it;</p>\n<p>So that it bears the mighty tide, and bursts not</p>\n<p>Say then, my honour&rsquo;d stem! what ancestors</p>\n<p>Where those you sprang from, and what years were mark&rsquo;d</p>\n<p>In your first childhood? Tell me of the fold,</p>\n<p>That hath Saint John for guardian, what was then</p>\n<p>Its state, and who in it were highest seated?&rdquo;</p>\n<p class="slindent">As embers, at the breathing of the wind,</p>\n<p>Their flame enliven, so that light I saw</p>\n<p>Shine at my blandishments; and, as it grew</p>\n<p>More fair to look on, so with voice more sweet,</p>\n<p>Yet not in this our modern phrase, forthwith</p>\n<p>It answer&rsquo;d: &ldquo;From the day, when it was said</p>\n<p>&lsquo;Hail Virgin!&rsquo; to the throes, by which my mother,</p>\n<p>Who now is sainted, lighten&rsquo;d her of me</p>\n<p>Whom she was heavy with, this fire had come,</p>\n<p>Five hundred fifty times and thrice, its beams</p>\n<p>To reilumine underneath the foot</p>\n<p>Of its own lion. They, of whom I sprang,</p>\n<p>And I, had there our birth-place, where the last</p>\n<p>Partition of our city first is reach&rsquo;d</p>\n<p>By him, that runs her annual game. Thus much</p>\n<p>Suffice of my forefathers: who they were,</p>\n<p>And whence they hither came, more honourable</p>\n<p>It is to pass in silence than to tell.</p>\n<p>All those, who in that time were there from Mars</p>\n<p>Until the Baptist, fit to carry arms,</p>\n<p>Were but the fifth of them this day alive.</p>\n<p>But then the citizen&rsquo;s blood, that now is mix&rsquo;d</p>\n<p>From Campi and Certaldo and Fighine,</p>\n<p>Ran purely through the last mechanic&rsquo;s veins.</p>\n<p>O how much better were it, that these people</p>\n<p>Were neighbours to you, and that at Galluzzo</p>\n<p>And at Trespiano, ye should have your bound&rsquo;ry,</p>\n<p>Than to have them within, and bear the stench</p>\n<p>Of Aguglione&rsquo;s hind, and Signa&rsquo;s, him,</p>\n<p>That hath his eye already keen for bart&rsquo;ring!</p>\n<p>Had not the people, which of all the world</p>\n<p>Degenerates most, been stepdame unto Caesar,</p>\n<p>But, as a mother, gracious to her son;</p>\n<p>Such one, as hath become a Florentine,</p>\n<p>And trades and traffics, had been turn&rsquo;d adrift</p>\n<p>To Simifonte, where his grandsire ply&rsquo;d</p>\n<p>The beggar&rsquo;s craft. The Conti were possess&rsquo;d</p>\n<p>Of Montemurlo still: the Cerchi still</p>\n<p>Were in Acone&rsquo;s parish; nor had haply</p>\n<p>From Valdigrieve past the Buondelmonte.</p>\n<p>The city&rsquo;s malady hath ever source</p>\n<p>In the confusion of its persons, as</p>\n<p>The body&rsquo;s, in variety of food:</p>\n<p>And the blind bull falls with a steeper plunge,</p>\n<p>Than the blind lamb; and oftentimes one sword</p>\n<p>Doth more and better execution,</p>\n<p>Than five. Mark Luni, Urbisaglia mark,</p>\n<p>How they are gone, and after them how go</p>\n<p>Chiusi and Sinigaglia; and &rsquo;t will seem</p>\n<p>No longer new or strange to thee to hear,</p>\n<p>That families fail, when cities have their end.</p>\n<p>All things, that appertain t&rsquo; ye, like yourselves,</p>\n<p>Are mortal: but mortality in some</p>\n<p>Ye mark not, they endure so long, and you</p>\n<p>Pass by so suddenly. And as the moon</p>\n<p>Doth, by the rolling of her heav&rsquo;nly sphere,</p>\n<p>Hide and reveal the strand unceasingly;</p>\n<p>So fortune deals with Florence. Hence admire not</p>\n<p>At what of them I tell thee, whose renown</p>\n<p>Time covers, the first Florentines. I saw</p>\n<p>The Ughi, Catilini and Filippi,</p>\n<p>The Alberichi, Greci and Ormanni,</p>\n<p>Now in their wane, illustrious citizens:</p>\n<p>And great as ancient, of Sannella him,</p>\n<p>With him of Arca saw, and Soldanieri</p>\n<p>And Ardinghi, and Bostichi. At the poop,</p>\n<p>That now is laden with new felony,</p>\n<p>So cumb&rsquo;rous it may speedily sink the bark,</p>\n<p>The Ravignani sat, of whom is sprung</p>\n<p>The County Guido, and whoso hath since</p>\n<p>His title from the fam&rsquo;d Bellincione ta&rsquo;en.</p>\n<p>Fair governance was yet an art well priz&rsquo;d</p>\n<p>By him of Pressa: Galigaio show&rsquo;d</p>\n<p>The gilded hilt and pommel, in his house.</p>\n<p>The column, cloth&rsquo;d with verrey, still was seen</p>\n<p>Unshaken: the Sacchetti still were great,</p>\n<p>Giouchi, Sifanti, Galli and Barucci,</p>\n<p>With them who blush to hear the bushel nam&rsquo;d.</p>\n<p>Of the Calfucci still the branchy trunk</p>\n<p>Was in its strength: and to the curule chairs</p>\n<p>Sizii and Arigucci yet were drawn.</p>\n<p>How mighty them I saw, whom since their pride</p>\n<p>Hath undone! and in all her goodly deeds</p>\n<p>Florence was by the bullets of bright gold</p>\n<p>O&rsquo;erflourish&rsquo;d. Such the sires of those, who now,</p>\n<p>As surely as your church is vacant, flock</p>\n<p>Into her consistory, and at leisure</p>\n<p>There stall them and grow fat. The o&rsquo;erweening brood,</p>\n<p>That plays the dragon after him that flees,</p>\n<p>But unto such, as turn and show the tooth,</p>\n<p>Ay or the purse, is gentle as a lamb,</p>\n<p>Was on its rise, but yet so slight esteem&rsquo;d,</p>\n<p>That Ubertino of Donati grudg&rsquo;d</p>\n<p>His father-in-law should yoke him to its tribe.</p>\n<p>Already Caponsacco had descended</p>\n<p>Into the mart from Fesole: and Giuda</p>\n<p>And Infangato were good citizens.</p>\n<p>A thing incredible I tell, tho&rsquo; true:</p>\n<p>The gateway, named from those of Pera, led</p>\n<p>Into the narrow circuit of your walls.</p>\n<p>Each one, who bears the sightly quarterings</p>\n<p>Of the great Baron (he whose name and worth</p>\n<p>The festival of Thomas still revives)</p>\n<p>His knighthood and his privilege retain&rsquo;d;</p>\n<p>Albeit one, who borders them With gold,</p>\n<p>This day is mingled with the common herd.</p>\n<p>In Borgo yet the Gualterotti dwelt,</p>\n<p>And Importuni: well for its repose</p>\n<p>Had it still lack&rsquo;d of newer neighbourhood.</p>\n<p>The house, from whence your tears have had their spring,</p>\n<p>Through the just anger that hath murder&rsquo;d ye</p>\n<p>And put a period to your gladsome days,</p>\n<p>Was honour&rsquo;d, it, and those consorted with it.</p>\n<p>O Buondelmonte! what ill counseling</p>\n<p>Prevail&rsquo;d on thee to break the plighted bond</p>\n<p>Many, who now are weeping, would rejoice,</p>\n<p>Had God to Ema giv&rsquo;n thee, the first time</p>\n<p>Thou near our city cam&rsquo;st. But so was doom&rsquo;d:</p>\n<p>On that maim&rsquo;d stone set up to guard the bridge,</p>\n<p>At thy last peace, the victim, Florence! fell.</p>\n<p>With these and others like to them, I saw</p>\n<p>Florence in such assur&rsquo;d tranquility,</p>\n<p>She had no cause at which to grieve: with these</p>\n<p>Saw her so glorious and so just, that ne&rsquo;er</p>\n<p>The lily from the lance had hung reverse,</p>\n<p>Or through division been with vermeil dyed.&rdquo;</p>\n</div>','<p class="cantohead">Canto XVII</p>\n<div class="stanza"><p>Such as the youth, who came to Clymene</p>\n<p>To certify himself of that reproach,</p>\n<p>Which had been fasten&rsquo;d on him, (he whose end</p>\n<p>Still makes the fathers chary to their sons,</p>\n<p>E&rsquo;en such was I; nor unobserv&rsquo;d was such</p>\n<p>Of Beatrice, and that saintly lamp,</p>\n<p>Who had erewhile for me his station mov&rsquo;d;</p>\n<p>When thus by lady: &ldquo;Give thy wish free vent,</p>\n<p>That it may issue, bearing true report</p>\n<p>Of the mind&rsquo;s impress; not that aught thy words</p>\n<p>May to our knowledge add, but to the end,</p>\n<p>That thou mayst use thyself to own thy thirst</p>\n<p>And men may mingle for thee when they hear.&rdquo;</p>\n<p class="slindent">&ldquo;O plant! from whence I spring! rever&rsquo;d and lov&rsquo;d!</p>\n<p>Who soar&rsquo;st so high a pitch, thou seest as clear,</p>\n<p>As earthly thought determines two obtuse</p>\n<p>In one triangle not contain&rsquo;d, so clear</p>\n<p>Dost see contingencies, ere in themselves</p>\n<p>Existent, looking at the point whereto</p>\n<p>All times are present, I, the whilst I scal&rsquo;d</p>\n<p>With Virgil the soul purifying mount,</p>\n<p>And visited the nether world of woe,</p>\n<p>Touching my future destiny have heard</p>\n<p>Words grievous, though I feel me on all sides</p>\n<p>Well squar&rsquo;d to fortune&rsquo;s blows. Therefore my will</p>\n<p>Were satisfied to know the lot awaits me,</p>\n<p>The arrow, seen beforehand, slacks its flight.&rdquo;</p>\n<p class="slindent">So said I to the brightness, which erewhile</p>\n<p>To me had spoken, and my will declar&rsquo;d,</p>\n<p>As Beatrice will&rsquo;d, explicitly.</p>\n<p>Nor with oracular response obscure,</p>\n<p>Such, as or ere the Lamb of God was slain,</p>\n<p>Beguil&rsquo;d the credulous nations; but, in terms</p>\n<p>Precise and unambiguous lore, replied</p>\n<p>The spirit of paternal love, enshrin&rsquo;d,</p>\n<p>Yet in his smile apparent; and thus spake:</p>\n<p>&ldquo;Contingency, unfolded not to view</p>\n<p>Upon the tablet of your mortal mold,</p>\n<p>Is all depictur&rsquo;d in the&rsquo; eternal sight;</p>\n<p>But hence deriveth not necessity,</p>\n<p>More then the tall ship, hurried down the flood,</p>\n<p>Doth from the vision, that reflects the scene.</p>\n<p>From thence, as to the ear sweet harmony</p>\n<p>From organ comes, so comes before mine eye</p>\n<p>The time prepar&rsquo;d for thee. Such as driv&rsquo;n out</p>\n<p>From Athens, by his cruel stepdame&rsquo;s wiles,</p>\n<p>Hippolytus departed, such must thou</p>\n<p>Depart from Florence. This they wish, and this</p>\n<p>Contrive, and will ere long effectuate, there,</p>\n<p>Where gainful merchandize is made of Christ,</p>\n<p>Throughout the livelong day. The common cry,</p>\n<p>Will, as &rsquo;t is ever wont, affix the blame</p>\n<p>Unto the party injur&rsquo;d: but the truth</p>\n<p>Shall, in the vengeance it dispenseth, find</p>\n<p>A faithful witness. Thou shall leave each thing</p>\n<p>Belov&rsquo;d most dearly: this is the first shaft</p>\n<p>Shot from the bow of exile. Thou shalt prove</p>\n<p>How salt the savour is of other&rsquo;s bread,</p>\n<p>How hard the passage to descend and climb</p>\n<p>By other&rsquo;s stairs, But that shall gall thee most</p>\n<p>Will he the worthless and vile company,</p>\n<p>With whom thou must be thrown into these straits.</p>\n<p>For all ungrateful, impious all and mad,</p>\n<p>Shall turn &rsquo;gainst thee: but in a little while</p>\n<p>Theirs and not thine shall be the crimson&rsquo;d brow</p>\n<p>Their course shall so evince their brutishness</p>\n<p>T&rsquo; have ta&rsquo;en thy stand apart shall well become thee.</p>\n<p class="slindent">&ldquo;First refuge thou must find, first place of rest,</p>\n<p>In the great Lombard&rsquo;s courtesy, who bears</p>\n<p>Upon the ladder perch&rsquo;d the sacred bird.</p>\n<p>He shall behold thee with such kind regard,</p>\n<p>That &rsquo;twixt ye two, the contrary to that</p>\n<p>Which falls &rsquo;twixt other men, the granting shall</p>\n<p>Forerun the asking. With him shalt thou see</p>\n<p>That mortal, who was at his birth impress</p>\n<p>So strongly from this star, that of his deeds</p>\n<p>The nations shall take note. His unripe age</p>\n<p>Yet holds him from observance; for these wheels</p>\n<p>Only nine years have compass him about.</p>\n<p>But, ere the Gascon practice on great Harry,</p>\n<p>Sparkles of virtue shall shoot forth in him,</p>\n<p>In equal scorn of labours and of gold.</p>\n<p>His bounty shall be spread abroad so widely,</p>\n<p>As not to let the tongues e&rsquo;en of his foes</p>\n<p>Be idle in its praise. Look thou to him</p>\n<p>And his beneficence: for he shall cause</p>\n<p>Reversal of their lot to many people,</p>\n<p>Rich men and beggars interchanging fortunes.</p>\n<p>And thou shalt bear this written in thy soul</p>\n<p>Of him, but tell it not; &ldquo;and things he told</p>\n<p>Incredible to those who witness them;</p>\n<p>Then added: &ldquo;So interpret thou, my son,</p>\n<p>What hath been told thee.&mdash;Lo! the ambushment</p>\n<p>That a few circling seasons hide for thee!</p>\n<p>Yet envy not thy neighbours: time extends</p>\n<p>Thy span beyond their treason&rsquo;s chastisement.&rdquo;</p>\n<p class="slindent">Soon, as the saintly spirit, by his silence,</p>\n<p>Had shown the web, which I had streteh&rsquo;d for him</p>\n<p>Upon the warp, was woven, I began,</p>\n<p>As one, who in perplexity desires</p>\n<p>Counsel of other, wise, benign and friendly:</p>\n<p>&ldquo;My father! well I mark how time spurs on</p>\n<p>Toward me, ready to inflict the blow,</p>\n<p>Which falls most heavily on him, who most</p>\n<p>Abandoned himself. Therefore &rsquo;t is good</p>\n<p>I should forecast, that driven from the place</p>\n<p>Most dear to me, I may not lose myself</p>\n<p>All others by my song. Down through the world</p>\n<p>Of infinite mourning, and along the mount</p>\n<p>From whose fair height my lady&rsquo;s eyes did lift me,</p>\n<p>And after through this heav&rsquo;n from light to light,</p>\n<p>Have I learnt that, which if I tell again,</p>\n<p>It may with many woefully disrelish;</p>\n<p>And, if I am a timid friend to truth,</p>\n<p>I fear my life may perish among those,</p>\n<p>To whom these days shall be of ancient date.&rdquo;</p>\n<p class="slindent">The brightness, where enclos&rsquo;d the treasure smil&rsquo;d,</p>\n<p>Which I had found there, first shone glisteningly,</p>\n<p>Like to a golden mirror in the sun;</p>\n<p>Next answer&rsquo;d: &ldquo;Conscience, dimm&rsquo;d or by its own</p>\n<p>Or other&rsquo;s shame, will feel thy saying sharp.</p>\n<p>Thou, notwithstanding, all deceit remov&rsquo;d,</p>\n<p>See the whole vision be made manifest.</p>\n<p>And let them wince who have their withers wrung.</p>\n<p>What though, when tasted first, thy voice shall prove</p>\n<p>Unwelcome, on digestion it will turn</p>\n<p>To vital nourishment. The cry thou raisest,</p>\n<p>Shall, as the wind doth, smite the proudest summits;</p>\n<p>Which is of honour no light argument,</p>\n<p>For this there only have been shown to thee,</p>\n<p>Throughout these orbs, the mountain, and the deep,</p>\n<p>Spirits, whom fame hath note of. For the mind</p>\n<p>Of him, who hears, is loth to acquiesce</p>\n<p>And fix its faith, unless the instance brought</p>\n<p>Be palpable, and proof apparent urge.&rdquo;</p>\n</div>','<p class="cantohead">Canto XVIII</p>\n<div class="stanza"><p>Now in his word, sole, ruminating, joy&rsquo;d</p>\n<p>That blessed spirit; and I fed on mine,</p>\n<p>Tempting the sweet with bitter: she meanwhile,</p>\n<p>Who led me unto God, admonish&rsquo;d: &ldquo;Muse</p>\n<p>On other thoughts: bethink thee, that near Him</p>\n<p>I dwell, who recompenseth every wrong.&rdquo;</p>\n<p class="slindent">At the sweet sounds of comfort straight I turn&rsquo;d;</p>\n<p>And, in the saintly eyes what love was seen,</p>\n<p>I leave in silence here: nor through distrust</p>\n<p>Of my words only, but that to such bliss</p>\n<p>The mind remounts not without aid. Thus much</p>\n<p>Yet may I speak; that, as I gaz&rsquo;d on her,</p>\n<p>Affection found no room for other wish.</p>\n<p>While the everlasting pleasure, that did full</p>\n<p>On Beatrice shine, with second view</p>\n<p>From her fair countenance my gladden&rsquo;d soul</p>\n<p>Contented; vanquishing me with a beam</p>\n<p>Of her soft smile, she spake: &ldquo;Turn thee, and list.</p>\n<p>These eyes are not thy only Paradise.&rdquo;</p>\n<p class="slindent">As here we sometimes in the looks may see</p>\n<p>Th&rsquo; affection mark&rsquo;d, when that its sway hath ta&rsquo;en</p>\n<p>The spirit wholly; thus the hallow&rsquo;d light,</p>\n<p>To whom I turn&rsquo;d, flashing, bewray&rsquo;d its will</p>\n<p>To talk yet further with me, and began:</p>\n<p>&ldquo;On this fifth lodgment of the tree, whose life</p>\n<p>Is from its top, whose fruit is ever fair</p>\n<p>And leaf unwith&rsquo;ring, blessed spirits abide,</p>\n<p>That were below, ere they arriv&rsquo;d in heav&rsquo;n,</p>\n<p>So mighty in renown, as every muse</p>\n<p>Might grace her triumph with them. On the horns</p>\n<p>Look therefore of the cross: he, whom I name,</p>\n<p>Shall there enact, as doth 1n summer cloud</p>\n<p>Its nimble fire.&rdquo; Along the cross I saw,</p>\n<p>At the repeated name of Joshua,</p>\n<p>A splendour gliding; nor, the word was said,</p>\n<p>Ere it was done: then, at the naming saw</p>\n<p>Of the great Maccabee, another move</p>\n<p>With whirling speed; and gladness was the scourge</p>\n<p>Unto that top. The next for Charlemagne</p>\n<p>And for the peer Orlando, two my gaze</p>\n<p>Pursued, intently, as the eye pursues</p>\n<p>A falcon flying. Last, along the cross,</p>\n<p>William, and Renard, and Duke Godfrey drew</p>\n<p>My ken, and Robert Guiscard. And the soul,</p>\n<p>Who spake with me among the other lights</p>\n<p>Did move away, and mix; and with the choir</p>\n<p>Of heav&rsquo;nly songsters prov&rsquo;d his tuneful skill.</p>\n<p class="slindent">To Beatrice on my right l bent,</p>\n<p>Looking for intimation or by word</p>\n<p>Or act, what next behoov&rsquo;d; and did descry</p>\n<p>Such mere effulgence in her eyes, such joy,</p>\n<p>It past all former wont. And, as by sense</p>\n<p>Of new delight, the man, who perseveres</p>\n<p>In good deeds doth perceive from day to day</p>\n<p>His virtue growing; I e&rsquo;en thus perceiv&rsquo;d</p>\n<p>Of my ascent, together with the heav&rsquo;n</p>\n<p>The circuit widen&rsquo;d, noting the increase</p>\n<p>Of beauty in that wonder. Like the change</p>\n<p>In a brief moment on some maiden&rsquo;s cheek,</p>\n<p>Which from its fairness doth discharge the weight</p>\n<p>Of pudency, that stain&rsquo;d it; such in her,</p>\n<p>And to mine eyes so sudden was the change,</p>\n<p>Through silvery whiteness of that temperate star,</p>\n<p>Whose sixth orb now enfolded us. I saw,</p>\n<p>Within that Jovial cresset, the clear sparks</p>\n<p>Of love, that reign&rsquo;d there, fashion to my view</p>\n<p>Our language. And as birds, from river banks</p>\n<p>Arisen, now in round, now lengthen&rsquo;d troop,</p>\n<p>Array them in their flight, greeting, as seems,</p>\n<p>Their new-found pastures; so, within the lights,</p>\n<p>The saintly creatures flying, sang, and made</p>\n<p>Now D. now I. now L. figur&rsquo;d I&rsquo; th&rsquo; air.</p>\n<p>First, singing, to their notes they mov&rsquo;d, then one</p>\n<p>Becoming of these signs, a little while</p>\n<p>Did rest them, and were mute. O nymph divine</p>\n<p>Of Pegasean race! whose souls, which thou</p>\n<p>Inspir&rsquo;st, mak&rsquo;st glorious and long-liv&rsquo;d, as they</p>\n<p>Cities and realms by thee! thou with thyself</p>\n<p>Inform me; that I may set forth the shapes,</p>\n<p>As fancy doth present them. Be thy power</p>\n<p>Display&rsquo;d in this brief song. The characters,</p>\n<p>Vocal and consonant, were five-fold seven.</p>\n<p>In order each, as they appear&rsquo;d, I mark&rsquo;d.</p>\n<p>Diligite Justitiam, the first,</p>\n<p>Both verb and noun all blazon&rsquo;d; and the extreme</p>\n<p>Qui judicatis terram. In the M.</p>\n<p>Of the fifth word they held their station,</p>\n<p>Making the star seem silver streak&rsquo;d with gold.</p>\n<p>And on the summit of the M. I saw</p>\n<p>Descending other lights, that rested there,</p>\n<p>Singing, methinks, their bliss and primal good.</p>\n<p>Then, as at shaking of a lighted brand,</p>\n<p>Sparkles innumerable on all sides</p>\n<p>Rise scatter&rsquo;d, source of augury to th&rsquo; unwise;</p>\n<p>Thus more than thousand twinkling lustres hence</p>\n<p>Seem&rsquo;d reascending, and a higher pitch</p>\n<p>Some mounting, and some less; e&rsquo;en as the sun,</p>\n<p>Which kindleth them, decreed. And when each one</p>\n<p>Had settled in his place, the head and neck</p>\n<p>Then saw I of an eagle, lively</p>\n<p>Grav&rsquo;d in that streaky fire. Who painteth there,</p>\n<p>Hath none to guide him; of himself he guides;</p>\n<p>And every line and texture of the nest</p>\n<p>Doth own from him the virtue, fashions it.</p>\n<p>The other bright beatitude, that seem&rsquo;d</p>\n<p>Erewhile, with lilied crowning, well content</p>\n<p>To over-canopy the M. mov&rsquo;d forth,</p>\n<p>Following gently the impress of the bird.</p>\n<p class="slindent">\xA0Sweet star! what glorious and thick-studded gems</p>\n<p>Declar&rsquo;d to me our justice on the earth</p>\n<p>To be the effluence of that heav&rsquo;n, which thou,</p>\n<p>Thyself a costly jewel, dost inlay!</p>\n<p>Therefore I pray the Sovran Mind, from whom</p>\n<p>Thy motion and thy virtue are begun,</p>\n<p>That he would look from whence the fog doth rise,</p>\n<p>To vitiate thy beam: so that once more</p>\n<p>He may put forth his hand &rsquo;gainst such, as drive</p>\n<p>Their traffic in that sanctuary, whose walls</p>\n<p>With miracles and martyrdoms were built.</p>\n<p class="slindent">Ye host of heaven! whose glory I survey l</p>\n<p>O beg ye grace for those, that are on earth</p>\n<p>All after ill example gone astray.</p>\n<p>War once had for its instrument the sword:</p>\n<p>But now &rsquo;t is made, taking the bread away</p>\n<p>Which the good Father locks from none. &mdash;And thou,</p>\n<p>That writes but to cancel, think, that they,</p>\n<p>Who for the vineyard, which thou wastest, died,</p>\n<p>Peter and Paul live yet, and mark thy doings.</p>\n<p>Thou hast good cause to cry, &ldquo;My heart so cleaves</p>\n<p>To him, that liv&rsquo;d in solitude remote,</p>\n<p>And from the wilds was dragg&rsquo;d to martyrdom,</p>\n<p>I wist not of the fisherman nor Paul.&rdquo;</p>\n</div>','<p class="cantohead">Canto XIX</p>\n<div class="stanza"><p>Before my sight appear&rsquo;d, with open wings,</p>\n<p>The beauteous image, in fruition sweet</p>\n<p>Gladdening the thronged spirits. Each did seem</p>\n<p>A little ruby, whereon so intense</p>\n<p>The sun-beam glow&rsquo;d that to mine eyes it came</p>\n<p>In clear refraction. And that, which next</p>\n<p>Befalls me to portray, voice hath not utter&rsquo;d,</p>\n<p>Nor hath ink written, nor in fantasy</p>\n<p>Was e&rsquo;er conceiv&rsquo;d. For I beheld and heard</p>\n<p>The beak discourse; and, what intention form&rsquo;d</p>\n<p>Of many, singly as of one express,</p>\n<p>Beginning: &ldquo;For that I was just and piteous,</p>\n<p>l am exalted to this height of glory,</p>\n<p>The which no wish exceeds: and there on earth</p>\n<p>Have I my memory left, e&rsquo;en by the bad</p>\n<p>Commended, while they leave its course untrod.&rdquo;</p>\n<p class="slindent">Thus is one heat from many embers felt,</p>\n<p>As in that image many were the loves,</p>\n<p>And one the voice, that issued from them all.</p>\n<p>Whence I address them: &ldquo;O perennial flowers</p>\n<p>Of gladness everlasting! that exhale</p>\n<p>In single breath your odours manifold!</p>\n<p>Breathe now; and let the hunger be appeas&rsquo;d,</p>\n<p>That with great craving long hath held my soul,</p>\n<p>Finding no food on earth. This well I know,</p>\n<p>That if there be in heav&rsquo;n a realm, that shows</p>\n<p>In faithful mirror the celestial Justice,</p>\n<p>Yours without veil reflects it. Ye discern</p>\n<p>The heed, wherewith I do prepare myself</p>\n<p>To hearken; ye the doubt that urges me</p>\n<p>With such inveterate craving.&rdquo; Straight I saw,</p>\n<p>Like to a falcon issuing from the hood,</p>\n<p>That rears his head, and claps him with his wings,</p>\n<p>His beauty and his eagerness bewraying.</p>\n<p>So saw I move that stately sign, with praise</p>\n<p>Of grace divine inwoven and high song</p>\n<p>Of inexpressive joy. &ldquo;He,&rdquo; it began,</p>\n<p>&ldquo;Who turn&rsquo;d his compass on the world&rsquo;s extreme,</p>\n<p>And in that space so variously hath wrought,</p>\n<p>Both openly, and in secret, in such wise</p>\n<p>Could not through all the universe display</p>\n<p>Impression of his glory, that the Word</p>\n<p>Of his omniscience should not still remain</p>\n<p>In infinite excess. In proof whereof,</p>\n<p>He first through pride supplanted, who was sum</p>\n<p>Of each created being, waited not</p>\n<p>For light celestial, and abortive fell.</p>\n<p>Whence needs each lesser nature is but scant</p>\n<p>Receptacle unto that Good, which knows</p>\n<p>No limit, measur&rsquo;d by itself alone.</p>\n<p>Therefore your sight, of th&rsquo; omnipresent Mind</p>\n<p>A single beam, its origin must own</p>\n<p>Surpassing far its utmost potency.</p>\n<p>The ken, your world is gifted with, descends</p>\n<p>In th&rsquo; everlasting Justice as low down,</p>\n<p>As eye doth in the sea; which though it mark</p>\n<p>The bottom from the shore, in the wide main</p>\n<p>Discerns it not; and ne&rsquo;ertheless it is,</p>\n<p>But hidden through its deepness. Light is none,</p>\n<p>Save that which cometh from the pure serene</p>\n<p>Of ne&rsquo;er disturbed ether: for the rest,</p>\n<p>&rsquo;Tis darkness all, or shadow of the flesh,</p>\n<p>Or else its poison. Here confess reveal&rsquo;d</p>\n<p>That covert, which hath hidden from thy search</p>\n<p>The living justice, of the which thou mad&rsquo;st</p>\n<p>Such frequent question; for thou saidst&mdash;&rsquo;A man</p>\n<p>Is born on Indus&rsquo; banks, and none is there</p>\n<p>Who speaks of Christ, nor who doth read nor write,</p>\n<p>And all his inclinations and his acts,</p>\n<p>As far as human reason sees, are good,</p>\n<p>And he offendeth not in word or deed.</p>\n<p>But unbaptiz&rsquo;d he dies, and void of faith.</p>\n<p>Where is the justice that condemns him? where</p>\n<p>His blame, if he believeth not?&rsquo;&mdash;What then,</p>\n<p>And who art thou, that on the stool wouldst sit</p>\n<p>To judge at distance of a thousand miles</p>\n<p>With the short-sighted vision of a span?</p>\n<p>To him, who subtilizes thus with me,</p>\n<p>There would assuredly be room for doubt</p>\n<p>Even to wonder, did not the safe word</p>\n<p>Of scripture hold supreme authority.</p>\n<p class="slindent">&ldquo;O animals of clay! O spirits gross I</p>\n<p>The primal will, that in itself is good,</p>\n<p>Hath from itself, the chief Good, ne&rsquo;er been mov&rsquo;d.</p>\n<p>Justice consists in consonance with it,</p>\n<p>Derivable by no created good,</p>\n<p>Whose very cause depends upon its beam.&rdquo;</p>\n<p class="slindent">As on her nest the stork, that turns about</p>\n<p>Unto her young, whom lately she hath fed,</p>\n<p>While they with upward eyes do look on her;</p>\n<p>So lifted I my gaze; and bending so</p>\n<p>The ever-blessed image wav&rsquo;d its wings,</p>\n<p>Lab&rsquo;ring with such deep counsel. Wheeling round</p>\n<p>It warbled, and did say: &ldquo;As are my notes</p>\n<p>To thee, who understand&rsquo;st them not, such is</p>\n<p>Th&rsquo; eternal judgment unto mortal ken.&rdquo;</p>\n<p class="slindent">Then still abiding in that ensign rang&rsquo;d,</p>\n<p>Wherewith the Romans over-awed the world,</p>\n<p>Those burning splendours of the Holy Spirit</p>\n<p>Took up the strain; and thus it spake again:</p>\n<p>&ldquo;None ever hath ascended to this realm,</p>\n<p>Who hath not a believer been in Christ,</p>\n<p>Either before or after the blest limbs</p>\n<p>Were nail&rsquo;d upon the wood. But lo! of those</p>\n<p>Who call &lsquo;Christ, Christ,&rsquo; there shall be many found,</p>\n<p>\xA0In judgment, further off from him by far,</p>\n<p>Than such, to whom his name was never known.</p>\n<p>Christians like these the Ethiop shall condemn:</p>\n<p>When that the two assemblages shall part;</p>\n<p>One rich eternally, the other poor.</p>\n<p class="slindent">&ldquo;What may the Persians say unto your kings,</p>\n<p>When they shall see that volume, in the which</p>\n<p>All their dispraise is written, spread to view?</p>\n<p>There amidst Albert&rsquo;s works shall that be read,</p>\n<p>Which will give speedy motion to the pen,</p>\n<p>When Prague shall mourn her desolated realm.</p>\n<p>There shall be read the woe, that he doth work</p>\n<p>With his adulterate money on the Seine,</p>\n<p>Who by the tusk will perish: there be read</p>\n<p>The thirsting pride, that maketh fool alike</p>\n<p>The English and Scot, impatient of their bound.</p>\n<p>There shall be seen the Spaniard&rsquo;s luxury,</p>\n<p>The delicate living there of the Bohemian,</p>\n<p>Who still to worth has been a willing stranger.</p>\n<p>The halter of Jerusalem shall see</p>\n<p>A unit for his virtue, for his vices</p>\n<p>No less a mark than million. He, who guards</p>\n<p>The isle of fire by old Anchises honour&rsquo;d</p>\n<p>Shall find his avarice there and cowardice;</p>\n<p>And better to denote his littleness,</p>\n<p>The writing must be letters maim&rsquo;d, that speak</p>\n<p>Much in a narrow space. All there shall know</p>\n<p>His uncle and his brother&rsquo;s filthy doings,</p>\n<p>Who so renown&rsquo;d a nation and two crowns</p>\n<p>Have bastardized. And they, of Portugal</p>\n<p>And Norway, there shall be expos&rsquo;d with him</p>\n<p>Of Ratza, who hath counterfeited ill</p>\n<p>The coin of Venice. O blest Hungary!</p>\n<p>If thou no longer patiently abid&rsquo;st</p>\n<p>Thy ill-entreating! and, O blest Navarre!</p>\n<p>If with thy mountainous girdle thou wouldst arm thee</p>\n<p>In earnest of that day, e&rsquo;en now are heard</p>\n<p>Wailings and groans in Famagosta&rsquo;s streets</p>\n<p>And Nicosia&rsquo;s, grudging at their beast,</p>\n<p>Who keepeth even footing with the rest.&rdquo;</p>\n</div>','<p class="cantohead">Canto XX</p>\n<div class="stanza"><p>When, disappearing, from our hemisphere,</p>\n<p>The world&rsquo;s enlightener vanishes, and day</p>\n<p>On all sides wasteth, suddenly the sky,</p>\n<p>Erewhile irradiate only with his beam,</p>\n<p>Is yet again unfolded, putting forth</p>\n<p>Innumerable lights wherein one shines.</p>\n<p>Of such vicissitude in heaven I thought,</p>\n<p>As the great sign, that marshaleth the world</p>\n<p>And the world&rsquo;s leaders, in the blessed beak</p>\n<p>Was silent; for that all those living lights,</p>\n<p>Waxing in splendour, burst forth into songs,</p>\n<p>Such as from memory glide and fall away.</p>\n<p class="slindent">Sweet love! that dost apparel thee in smiles,</p>\n<p>How lustrous was thy semblance in those sparkles,</p>\n<p>Which merely are from holy thoughts inspir&rsquo;d!</p>\n<p class="slindent">After the precious and bright beaming stones,</p>\n<p>That did ingem the sixth light, ceas&rsquo;d the chiming</p>\n<p>Of their angelic bells; methought I heard</p>\n<p>The murmuring of a river, that doth fall</p>\n<p>From rock to rock transpicuous, making known</p>\n<p>The richness of his spring-head: and as sound</p>\n<p>Of cistern, at the fret-board, or of pipe,</p>\n<p>Is, at the wind-hole, modulate and tun&rsquo;d;</p>\n<p>Thus up the neck, as it were hollow, rose</p>\n<p>That murmuring of the eagle, and forthwith</p>\n<p>Voice there assum&rsquo;d, and thence along the beak</p>\n<p>Issued in form of words, such as my heart</p>\n<p>Did look for, on whose tables I inscrib&rsquo;d them.</p>\n<p class="slindent">&ldquo;The part in me, that sees, and bears the sun,,</p>\n<p>In mortal eagles,&rdquo; it began, &ldquo;must now</p>\n<p>Be noted steadfastly: for of the fires,</p>\n<p>That figure me, those, glittering in mine eye,</p>\n<p>Are chief of all the greatest. This, that shines</p>\n<p>Midmost for pupil, was the same, who sang</p>\n<p>The Holy Spirit&rsquo;s song, and bare about</p>\n<p>The ark from town to town; now doth he know</p>\n<p>The merit of his soul-impassion&rsquo;d strains</p>\n<p>By their well-fitted guerdon. Of the five,</p>\n<p>That make the circle of the vision, he</p>\n<p>Who to the beak is nearest, comforted</p>\n<p>The widow for her son: now doth he know</p>\n<p>How dear he costeth not to follow Christ,</p>\n<p>Both from experience of this pleasant life,</p>\n<p>And of its opposite. He next, who follows</p>\n<p>In the circumference, for the over arch,</p>\n<p>By true repenting slack&rsquo;d the pace of death:</p>\n<p>Now knoweth he, that the degrees of heav&rsquo;n</p>\n<p>Alter not, when through pious prayer below</p>\n<p>Today&rsquo;s is made tomorrow&rsquo;s destiny.</p>\n<p>The other following, with the laws and me,</p>\n<p>To yield the shepherd room, pass&rsquo;d o&rsquo;er to Greece,</p>\n<p>From good intent producing evil fruit:</p>\n<p>Now knoweth he, how all the ill, deriv&rsquo;d</p>\n<p>From his well doing, doth not helm him aught,</p>\n<p>Though it have brought destruction on the world.</p>\n<p>That, which thou seest in the under bow,</p>\n<p>Was William, whom that land bewails, which weeps</p>\n<p>For Charles and Frederick living: now he knows</p>\n<p>How well is lov&rsquo;d in heav&rsquo;n the righteous king,</p>\n<p>Which he betokens by his radiant seeming.</p>\n<p>Who in the erring world beneath would deem,</p>\n<p>That Trojan Ripheus in this round was set</p>\n<p>Fifth of the saintly splendours? now he knows</p>\n<p>Enough of that, which the world cannot see,</p>\n<p>The grace divine, albeit e&rsquo;en his sight</p>\n<p>Reach not its utmost depth.&rdquo; Like to the lark,</p>\n<p>That warbling in the air expatiates long,</p>\n<p>Then, trilling out his last sweet melody,</p>\n<p>Drops satiate with the sweetness; such appear&rsquo;d</p>\n<p>That image stampt by the&rsquo; everlasting pleasure,</p>\n<p>Which fashions like itself all lovely things.</p>\n<p class="slindent">I, though my doubting were as manifest,</p>\n<p>As is through glass the hue that mantles it,</p>\n<p>In silence waited not: for to my lips</p>\n<p>&ldquo;What things are these?&rdquo; involuntary rush&rsquo;d,</p>\n<p>And forc&rsquo;d a passage out: whereat I mark&rsquo;d</p>\n<p>A sudden lightening and new revelry.</p>\n<p>The eye was kindled: and the blessed sign</p>\n<p>No more to keep me wond&rsquo;ring and suspense,</p>\n<p>Replied: &ldquo;I see that thou believ&rsquo;st these things,</p>\n<p>Because I tell them, but discern&rsquo;st not how;</p>\n<p>So that thy knowledge waits not on thy faith:</p>\n<p>As one who knows the name of thing by rote,</p>\n<p>But is a stranger to its properties,</p>\n<p>Till other&rsquo;s tongue reveal them. Fervent love</p>\n<p>And lively hope with violence assail</p>\n<p>The kingdom of the heavens, and overcome</p>\n<p>The will of the Most high; not in such sort</p>\n<p>As man prevails o&rsquo;er man; but conquers it,</p>\n<p>Because &rsquo;t is willing to be conquer&rsquo;d, still,</p>\n<p>Though conquer&rsquo;d, by its mercy conquering.</p>\n<p class="slindent">&ldquo;Those, in the eye who live the first and fifth,</p>\n<p>Cause thee to marvel, in that thou behold&rsquo;st</p>\n<p>The region of the angels deck&rsquo;d with them.</p>\n<p>They quitted not their bodies, as thou deem&rsquo;st,</p>\n<p>Gentiles but Christians, in firm rooted faith,</p>\n<p>This of the feet in future to be pierc&rsquo;d,</p>\n<p>That of feet nail&rsquo;d already to the cross.</p>\n<p>One from the barrier of the dark abyss,</p>\n<p>Where never any with good will returns,</p>\n<p>Came back unto his bones. Of lively hope</p>\n<p>Such was the meed; of lively hope, that wing&rsquo;d</p>\n<p>The prayers sent up to God for his release,</p>\n<p>And put power into them to bend his will.</p>\n<p>The glorious Spirit, of whom I speak to thee,</p>\n<p>A little while returning to the flesh,</p>\n<p>Believ&rsquo;d in him, who had the means to help,</p>\n<p>And, in believing, nourish&rsquo;d such a flame</p>\n<p>Of holy love, that at the second death</p>\n<p>He was made sharer in our gamesome mirth.</p>\n<p>The other, through the riches of that grace,</p>\n<p>Which from so deep a fountain doth distil,</p>\n<p>As never eye created saw its rising,</p>\n<p>Plac&rsquo;d all his love below on just and right:</p>\n<p>Wherefore of grace God op&rsquo;d in him the eye</p>\n<p>To the redemption of mankind to come;</p>\n<p>Wherein believing, he endur&rsquo;d no more</p>\n<p>The filth of paganism, and for their ways</p>\n<p>Rebuk&rsquo;d the stubborn nations. The three nymphs,</p>\n<p>Whom at the right wheel thou beheldst advancing,</p>\n<p>Were sponsors for him more than thousand years</p>\n<p>Before baptizing. O how far remov&rsquo;d,</p>\n<p>Predestination! is thy root from such</p>\n<p>As see not the First cause entire: and ye,</p>\n<p>O mortal men! be wary how ye judge:</p>\n<p>For we, who see our Maker, know not yet</p>\n<p>The number of the chosen: and esteem</p>\n<p>Such scantiness of knowledge our delight:</p>\n<p>For all our good is in that primal good</p>\n<p>Concentrate, and God&rsquo;s will and ours are one.&rdquo;</p>\n<p class="slindent">So, by that form divine, was giv&rsquo;n to me</p>\n<p>Sweet medicine to clear and strengthen sight,</p>\n<p>And, as one handling skillfully the harp,</p>\n<p>Attendant on some skilful songster&rsquo;s voice</p>\n<p>Bids the chords vibrate, and therein the song</p>\n<p>Acquires more pleasure; so, the whilst it spake,</p>\n<p>It doth remember me, that I beheld</p>\n<p>The pair of blessed luminaries move.</p>\n<p>Like the accordant twinkling of two eyes,</p>\n<p>Their beamy circlets, dancing to the sounds.</p>\n</div>','<p class="cantohead">Canto XXI</p>\n<div class="stanza"><p>Again mine eyes were fix&rsquo;d on Beatrice,</p>\n<p>And with mine eyes my soul, that in her looks</p>\n<p>Found all contentment. Yet no smile she wore</p>\n<p>And, &ldquo;Did I smile,&rdquo; quoth she, &ldquo;thou wouldst be straight</p>\n<p>Like Semele when into ashes turn&rsquo;d:</p>\n<p>For, mounting these eternal palace-stairs,</p>\n<p>My beauty, which the loftier it climbs,</p>\n<p>As thou hast noted, still doth kindle more,</p>\n<p>So shines, that, were no temp&rsquo;ring interpos&rsquo;d,</p>\n<p>Thy mortal puissance would from its rays</p>\n<p>Shrink, as the leaf doth from the thunderbolt.</p>\n<p>Into the seventh splendour are we wafted,</p>\n<p>That underneath the burning lion&rsquo;s breast</p>\n<p>Beams, in this hour, commingled with his might,</p>\n<p>Thy mind be with thine eyes: and in them mirror&rsquo;d</p>\n<p>The shape, which in this mirror shall be shown.&rdquo;</p>\n<p>Whoso can deem, how fondly I had fed</p>\n<p>My sight upon her blissful countenance,</p>\n<p>May know, when to new thoughts I chang&rsquo;d, what joy</p>\n<p>To do the bidding of my heav&rsquo;nly guide:</p>\n<p>In equal balance poising either weight.</p>\n<p class="slindent">Within the crystal, which records the name,</p>\n<p>(As its remoter circle girds the world)</p>\n<p>Of that lov&rsquo;d monarch, in whose happy reign</p>\n<p>No ill had power to harm, I saw rear&rsquo;d up,</p>\n<p>In colour like to sun-illumin&rsquo;d gold.</p>\n<p>A ladder, which my ken pursued in vain,</p>\n<p>So lofty was the summit; down whose steps</p>\n<p>I saw the splendours in such multitude</p>\n<p>Descending, ev&rsquo;ry light in heav&rsquo;n, methought,</p>\n<p>Was shed thence. As the rooks, at dawn of day</p>\n<p>Bestirring them to dry their feathers chill,</p>\n<p>Some speed their way a-field, and homeward some,</p>\n<p>Returning, cross their flight, while some abide</p>\n<p>And wheel around their airy lodge; so seem&rsquo;d</p>\n<p>That glitterance, wafted on alternate wing,</p>\n<p>As upon certain stair it met, and clash&rsquo;d</p>\n<p>Its shining. And one ling&rsquo;ring near us, wax&rsquo;d</p>\n<p>So bright, that in my thought: said: &ldquo;The love,</p>\n<p>Which this betokens me, admits no doubt.&rdquo;</p>\n<p class="slindent">Unwillingly from question I refrain,</p>\n<p>To her, by whom my silence and my speech</p>\n<p>Are order&rsquo;d, looking for a sign: whence she,</p>\n<p>Who in the sight of Him, that seeth all,</p>\n<p>Saw wherefore I was silent, prompted me</p>\n<p>T&rsquo; indulge the fervent wish; and I began:</p>\n<p>&ldquo;I am not worthy, of my own desert,</p>\n<p>That thou shouldst answer me; but for her sake,</p>\n<p>Who hath vouchsaf&rsquo;d my asking, spirit blest!</p>\n<p>That in thy joy art shrouded! say the cause,</p>\n<p>Which bringeth thee so near: and wherefore, say,</p>\n<p>Doth the sweet symphony of Paradise</p>\n<p>Keep silence here, pervading with such sounds</p>\n<p>Of rapt devotion ev&rsquo;ry lower sphere?&rdquo;</p>\n<p>&ldquo;Mortal art thou in hearing as in sight;&rdquo;</p>\n<p>Was the reply: &ldquo;and what forbade the smile</p>\n<p>Of Beatrice interrupts our song.</p>\n<p>Only to yield thee gladness of my voice,</p>\n<p>And of the light that vests me, I thus far</p>\n<p>Descend these hallow&rsquo;d steps: not that more love</p>\n<p>Invites me; for lo! there aloft, as much</p>\n<p>Or more of love is witness&rsquo;d in those flames:</p>\n<p>But such my lot by charity assign&rsquo;d,</p>\n<p>That makes us ready servants, as thou seest,</p>\n<p>To execute the counsel of the Highest.</p>\n<p>&ldquo;That in this court,&rdquo; said I, &ldquo;O sacred lamp!</p>\n<p>Love no compulsion needs, but follows free</p>\n<p>Th&rsquo; eternal Providence, I well discern:</p>\n<p>This harder find to deem, why of thy peers</p>\n<p>Thou only to this office wert foredoom&rsquo;d.&rdquo;</p>\n<p>I had not ended, when, like rapid mill,</p>\n<p>Upon its centre whirl&rsquo;d the light; and then</p>\n<p>The love, that did inhabit there, replied:</p>\n<p>&ldquo;Splendour eternal, piercing through these folds,</p>\n<p>Its virtue to my vision knits, and thus</p>\n<p>Supported, lifts me so above myself,</p>\n<p>That on the sov&rsquo;ran essence, which it wells from,</p>\n<p>I have the power to gaze: and hence the joy,</p>\n<p>Wherewith I sparkle, equaling with my blaze</p>\n<p>The keenness of my sight. But not the soul,</p>\n<p>That is in heav&rsquo;n most lustrous, nor the seraph</p>\n<p>That hath his eyes most fix&rsquo;d on God, shall solve</p>\n<p>What thou hast ask&rsquo;d: for in th&rsquo; abyss it lies</p>\n<p>Of th&rsquo; everlasting statute sunk so low,</p>\n<p>That no created ken may fathom it.</p>\n<p>And, to the mortal world when thou return&rsquo;st,</p>\n<p>Be this reported; that none henceforth dare</p>\n<p>Direct his footsteps to so dread a bourn.</p>\n<p>The mind, that here is radiant, on the earth</p>\n<p>Is wrapt in mist. Look then if she may do,</p>\n<p>Below, what passeth her ability,</p>\n<p>When she is ta&rsquo;en to heav&rsquo;n.&rdquo; By words like these</p>\n<p>Admonish&rsquo;d, I the question urg&rsquo;d no more;</p>\n<p>And of the spirit humbly sued alone</p>\n<p>T&rsquo; instruct me of its state. &ldquo;&rsquo;Twixt either shore</p>\n<p>Of Italy, nor distant from thy land,</p>\n<p>A stony ridge ariseth, in such sort,</p>\n<p>The thunder doth not lift his voice so high,</p>\n<p>They call it Catria: at whose foot a cell</p>\n<p>Is sacred to the lonely Eremite,</p>\n<p>For worship set apart and holy rites.&rdquo;</p>\n<p>A third time thus it spake; then added: &ldquo;There</p>\n<p>So firmly to God&rsquo;s service I adher&rsquo;d,</p>\n<p>That with no costlier viands than the juice</p>\n<p>Of olives, easily I pass&rsquo;d the heats</p>\n<p>Of summer and the winter frosts, content</p>\n<p>In heav&rsquo;n-ward musings. Rich were the returns</p>\n<p>And fertile, which that cloister once was us&rsquo;d</p>\n<p>To render to these heavens: now &rsquo;t is fall&rsquo;n</p>\n<p>Into a waste so empty, that ere long</p>\n<p>Detection must lay bare its vanity</p>\n<p>Pietro Damiano there was I y-clept:</p>\n<p>Pietro the sinner, when before I dwelt</p>\n<p>Beside the Adriatic, in the house</p>\n<p>Of our blest Lady. Near upon my close</p>\n<p>Of mortal life, through much importuning</p>\n<p>I was constrain&rsquo;d to wear the hat that still</p>\n<p>From bad to worse it shifted.&mdash;Cephas came;</p>\n<p>He came, who was the Holy Spirit&rsquo;s vessel,</p>\n<p>Barefoot and lean, eating their bread, as chanc&rsquo;d,</p>\n<p>At the first table. Modern Shepherd&rsquo;s need</p>\n<p>Those who on either hand may prop and lead them,</p>\n<p>So burly are they grown: and from behind</p>\n<p>Others to hoist them. Down the palfrey&rsquo;s sides</p>\n<p>Spread their broad mantles, so as both the beasts</p>\n<p>Are cover&rsquo;d with one skin. O patience! thou</p>\n<p>That lookst on this and doth endure so long.&rdquo;</p>\n<p>I at those accents saw the splendours down</p>\n<p>From step to step alight, and wheel, and wax,</p>\n<p>Each circuiting, more beautiful. Round this</p>\n<p>They came, and stay&rsquo;d them; uttered them a shout</p>\n<p>So loud, it hath no likeness here: nor I</p>\n<p>Wist what it spake, so deaf&rsquo;ning was the thunder.</p>\n</div>','<p class="cantohead">Canto XXII</p>\n<div class="stanza"><p>Astounded, to the guardian of my steps</p>\n<p>I turn&rsquo;d me, like the chill, who always runs</p>\n<p>Thither for succour, where he trusteth most,</p>\n<p>And she was like the mother, who her son</p>\n<p>Beholding pale and breathless, with her voice</p>\n<p>Soothes him, and he is cheer&rsquo;d; for thus she spake,</p>\n<p>Soothing me: &ldquo;Know&rsquo;st not thou, thou art in heav&rsquo;n?</p>\n<p>And know&rsquo;st not thou, whatever is in heav&rsquo;n,</p>\n<p>Is holy, and that nothing there is done</p>\n<p>But is done zealously and well? Deem now,</p>\n<p>What change in thee the song, and what my smile</p>\n<p>had wrought, since thus the shout had pow&rsquo;r to move thee.</p>\n<p>In which couldst thou have understood their prayers,</p>\n<p>The vengeance were already known to thee,</p>\n<p>Which thou must witness ere thy mortal hour,</p>\n<p>The sword of heav&rsquo;n is not in haste to smite,</p>\n<p>Nor yet doth linger, save unto his seeming,</p>\n<p>Who in desire or fear doth look for it.</p>\n<p>But elsewhere now l bid thee turn thy view;</p>\n<p>So shalt thou many a famous spirit behold.&rdquo;</p>\n<p>Mine eyes directing, as she will&rsquo;d, I saw</p>\n<p>A hundred little spheres, that fairer grew</p>\n<p>By interchange of splendour. I remain&rsquo;d,</p>\n<p>As one, who fearful of o&rsquo;er-much presuming,</p>\n<p>Abates in him the keenness of desire,</p>\n<p>Nor dares to question, when amid those pearls,</p>\n<p>One largest and most lustrous onward drew,</p>\n<p>That it might yield contentment to my wish;</p>\n<p>And from within it these the sounds I heard.</p>\n<p class="slindent">&ldquo;If thou, like me, beheldst the charity</p>\n<p>That burns amongst us, what thy mind conceives,</p>\n<p>Were utter&rsquo;d. But that, ere the lofty bound</p>\n<p>Thou reach, expectance may not weary thee,</p>\n<p>I will make answer even to the thought,</p>\n<p>Which thou hast such respect of. In old days,</p>\n<p>That mountain, at whose side Cassino rests,</p>\n<p>Was on its height frequented by a race</p>\n<p>Deceived and ill dispos&rsquo;d: and I it was,</p>\n<p>Who thither carried first the name of Him,</p>\n<p>Who brought the soul-subliming truth to man.</p>\n<p>And such a speeding grace shone over me,</p>\n<p>That from their impious worship I reclaim&rsquo;d</p>\n<p>The dwellers round about, who with the world</p>\n<p>Were in delusion lost. These other flames,</p>\n<p>The spirits of men contemplative, were all</p>\n<p>Enliven&rsquo;d by that warmth, whose kindly force</p>\n<p>Gives birth to flowers and fruits of holiness.</p>\n<p>Here is Macarius; Romoaldo here:</p>\n<p>And here my brethren, who their steps refrain&rsquo;d</p>\n<p>Within the cloisters, and held firm their heart.&rdquo;</p>\n<p class="slindent">I answ&rsquo;ring, thus; &ldquo;Thy gentle words and kind,</p>\n<p>And this the cheerful semblance, I behold</p>\n<p>Not unobservant, beaming in ye all,</p>\n<p>Have rais&rsquo;d assurance in me, wakening it</p>\n<p>Full-blossom&rsquo;d in my bosom, as a rose</p>\n<p>Before the sun, when the consummate flower</p>\n<p>Has spread to utmost amplitude. Of thee</p>\n<p>Therefore entreat I, father! to declare</p>\n<p>If I may gain such favour, as to gaze</p>\n<p>Upon thine image, by no covering veil&rsquo;d.&rdquo;</p>\n<p class="slindent">&ldquo;Brother!&rdquo; he thus rejoin&rsquo;d, &ldquo;in the last sphere</p>\n<p>Expect completion of thy lofty aim,</p>\n<p>For there on each desire completion waits,</p>\n<p>And there on mine: where every aim is found</p>\n<p>Perfect, entire, and for fulfillment ripe.</p>\n<p>There all things are as they have ever been:</p>\n<p>For space is none to bound, nor pole divides,</p>\n<p>Our ladder reaches even to that clime,</p>\n<p>And so at giddy distance mocks thy view.</p>\n<p>Thither the Patriarch Jacob saw it stretch</p>\n<p>Its topmost round, when it appear&rsquo;d to him</p>\n<p>With angels laden. But to mount it now</p>\n<p>None lifts his foot from earth: and hence my rule</p>\n<p>Is left a profitless stain upon the leaves;</p>\n<p>The walls, for abbey rear&rsquo;d, turned into dens,</p>\n<p>The cowls to sacks choak&rsquo;d up with musty meal.</p>\n<p>Foul usury doth not more lift itself</p>\n<p>Against God&rsquo;s pleasure, than that fruit which makes</p>\n<p>The hearts of monks so wanton: for whate&rsquo;er</p>\n<p>Is in the church&rsquo;s keeping, all pertains.</p>\n<p>To such, as sue for heav&rsquo;n&rsquo;s sweet sake, and not</p>\n<p>To those who in respect of kindred claim,</p>\n<p>Or on more vile allowance. Mortal flesh</p>\n<p>Is grown so dainty, good beginnings last not</p>\n<p>From the oak&rsquo;s birth, unto the acorn&rsquo;s setting.</p>\n<p>His convent Peter founded without gold</p>\n<p>Or silver; I with pray&rsquo;rs and fasting mine;</p>\n<p>And Francis his in meek humility.</p>\n<p>And if thou note the point, whence each proceeds,</p>\n<p>Then look what it hath err&rsquo;d to, thou shalt find</p>\n<p>The white grown murky. Jordan was turn&rsquo;d back;</p>\n<p>And a less wonder, then the refluent sea,</p>\n<p>May at God&rsquo;s pleasure work amendment here.&rdquo;</p>\n<p class="slindent">So saying, to his assembly back he drew:</p>\n<p>And they together cluster&rsquo;d into one,</p>\n<p>Then all roll&rsquo;d upward like an eddying wind.</p>\n<p class="slindent">The sweet dame beckon&rsquo;d me to follow them:</p>\n<p>And, by that influence only, so prevail&rsquo;d</p>\n<p>Over my nature, that no natural motion,</p>\n<p>Ascending or descending here below,</p>\n<p>Had, as I mounted, with my pennon vied.</p>\n<p class="slindent">So, reader, as my hope is to return</p>\n<p>Unto the holy triumph, for the which</p>\n<p>I ofttimes wail my sins, and smite my breast,</p>\n<p>Thou hadst been longer drawing out and thrusting</p>\n<p>Thy finger in the fire, than I was, ere</p>\n<p>The sign, that followeth Taurus, I beheld,</p>\n<p>And enter&rsquo;d its precinct. O glorious stars!</p>\n<p>O light impregnate with exceeding virtue!</p>\n<p>To whom whate&rsquo;er of genius lifteth me</p>\n<p>Above the vulgar, grateful I refer;</p>\n<p>With ye the parent of all mortal life</p>\n<p>Arose and set, when I did first inhale</p>\n<p>The Tuscan air; and afterward, when grace</p>\n<p>Vouchsaf&rsquo;d me entrance to the lofty wheel</p>\n<p>That in its orb impels ye, fate decreed</p>\n<p>My passage at your clime. To you my soul</p>\n<p>Devoutly sighs, for virtue even now</p>\n<p>To meet the hard emprize that draws me on.</p>\n<p class="slindent">&ldquo;Thou art so near the sum of blessedness,&rdquo;</p>\n<p>Said Beatrice, &ldquo;that behooves thy ken</p>\n<p>Be vigilant and clear. And, to this end,</p>\n<p>Or even thou advance thee further, hence</p>\n<p>Look downward, and contemplate, what a world</p>\n<p>Already stretched under our feet there lies:</p>\n<p>So as thy heart may, in its blithest mood,</p>\n<p>Present itself to the triumphal throng,</p>\n<p>Which through the&rsquo; etherial concave comes rejoicing.&rdquo;</p>\n<p class="slindent">I straight obey&rsquo;d; and with mine eye return&rsquo;d</p>\n<p>Through all the seven spheres, and saw this globe</p>\n<p>So pitiful of semblance, that perforce</p>\n<p>It moved my smiles: and him in truth I hold</p>\n<p>For wisest, who esteems it least: whose thoughts</p>\n<p>Elsewhere are fix&rsquo;d, him worthiest call and best.</p>\n<p>I saw the daughter of Latona shine</p>\n<p>Without the shadow, whereof late I deem&rsquo;d</p>\n<p>That dense and rare were cause. Here I sustain&rsquo;d</p>\n<p>The visage, Hyperion! of thy sun;</p>\n<p>And mark&rsquo;d, how near him with their circle, round</p>\n<p>Move Maia and Dione; here discern&rsquo;d</p>\n<p>Jove&rsquo;s tempering &rsquo;twixt his sire and son; and hence</p>\n<p>Their changes and their various aspects</p>\n<p>Distinctly scann&rsquo;d. Nor might I not descry</p>\n<p>Of all the seven, how bulky each, how swift;</p>\n<p>Nor of their several distances not learn.</p>\n<p>This petty area (o&rsquo;er the which we stride</p>\n<p>So fiercely), as along the eternal twins</p>\n<p>I wound my way, appear&rsquo;d before me all,</p>\n<p>Forth from the havens stretch&rsquo;d unto the hills.</p>\n<p>Then to the beauteous eyes mine eyes return&rsquo;d.</p>\n</div>','<p class="cantohead">Canto XXIII</p>\n<div class="stanza"><p>E&rsquo;en as the bird, who midst the leafy bower</p>\n<p>Has, in her nest, sat darkling through the night,</p>\n<p>With her sweet brood, impatient to descry</p>\n<p>Their wished looks, and to bring home their food,</p>\n<p>In the fond quest unconscious of her toil:</p>\n<p>She, of the time prevenient, on the spray,</p>\n<p>That overhangs their couch, with wakeful gaze</p>\n<p>Expects the sun; nor ever, till the dawn,</p>\n<p>Removeth from the east her eager ken;</p>\n<p>So stood the dame erect, and bent her glance</p>\n<p>Wistfully on that region, where the sun</p>\n<p>Abateth most his speed; that, seeing her</p>\n<p>Suspense and wand&rsquo;ring, I became as one,</p>\n<p>In whom desire is waken&rsquo;d, and the hope</p>\n<p>Of somewhat new to come fills with delight.</p>\n<p class="slindent">Short space ensued; I was not held, I say,</p>\n<p>Long in expectance, when I saw the heav&rsquo;n</p>\n<p>Wax more and more resplendent; and, &ldquo;Behold,&rdquo;</p>\n<p>Cried Beatrice, &ldquo;the triumphal hosts</p>\n<p>Of Christ, and all the harvest reap&rsquo;d at length</p>\n<p>Of thy ascending up these spheres.&rdquo; Meseem&rsquo;d,</p>\n<p>That, while she spake her image all did burn,</p>\n<p>And in her eyes such fullness was of joy,</p>\n<p>And I am fain to pass unconstrued by.</p>\n<p class="slindent">As in the calm full moon, when Trivia smiles,</p>\n<p>In peerless beauty, &rsquo;mid th&rsquo; eternal nympus,</p>\n<p>That paint through all its gulfs the blue profound</p>\n<p>In bright pre-eminence so saw I there,</p>\n<p>O&rsquo;er million lamps a sun, from whom all drew</p>\n<p>Their radiance as from ours the starry train:</p>\n<p>And through the living light so lustrous glow&rsquo;d</p>\n<p>The substance, that my ken endur&rsquo;d it not.</p>\n<p class="slindent">O Beatrice! sweet and precious guide!</p>\n<p>Who cheer&rsquo;d me with her comfortable words!</p>\n<p>&ldquo;Against the virtue, that o&rsquo;erpow&rsquo;reth thee,</p>\n<p>Avails not to resist. Here is the might,</p>\n<p>And here the wisdom, which did open lay</p>\n<p>The path, that had been yearned for so long,</p>\n<p>Betwixt the heav&rsquo;n and earth.&rdquo; Like to the fire,</p>\n<p>That, in a cloud imprison&rsquo;d doth break out</p>\n<p>Expansive, so that from its womb enlarg&rsquo;d,</p>\n<p>It falleth against nature to the ground;</p>\n<p>Thus in that heav&rsquo;nly banqueting my soul</p>\n<p>Outgrew herself; and, in the transport lost.</p>\n<p>Holds now remembrance none of what she was.</p>\n<p class="slindent">&ldquo;Ope thou thine eyes, and mark me: thou hast seen</p>\n<p>Things, that empower thee to sustain my smile.&rdquo;</p>\n<p class="slindent">I was as one, when a forgotten dream</p>\n<p>Doth come across him, and he strives in vain</p>\n<p>To shape it in his fantasy again,</p>\n<p>Whenas that gracious boon was proffer&rsquo;d me,</p>\n<p>Which never may be cancel&rsquo;d from the book,</p>\n<p>Wherein the past is written. Now were all</p>\n<p>Those tongues to sound, that have on sweetest milk</p>\n<p>Of Polyhymnia and her sisters fed</p>\n<p>And fatten&rsquo;d, not with all their help to boot,</p>\n<p>Unto the thousandth parcel of the truth,</p>\n<p>My song might shadow forth that saintly smile,</p>\n<p>flow merely in her saintly looks it wrought.</p>\n<p>And with such figuring of Paradise</p>\n<p>The sacred strain must leap, like one, that meets</p>\n<p>A sudden interruption to his road.</p>\n<p>But he, who thinks how ponderous the theme,</p>\n<p>And that &rsquo;t is lain upon a mortal shoulder,</p>\n<p>May pardon, if it tremble with the burden.</p>\n<p>The track, our ventrous keel must furrow, brooks</p>\n<p>No unribb&rsquo;d pinnace, no self-sparing pilot.</p>\n<p class="slindent">&ldquo;Why doth my face,&rdquo; said Beatrice, &ldquo;thus</p>\n<p>Enamour thee, as that thou dost not turn</p>\n<p>Unto the beautiful garden, blossoming</p>\n<p>Beneath the rays of Christ? Here is the rose,</p>\n<p>Wherein the word divine was made incarnate;</p>\n<p>And here the lilies, by whose odour known</p>\n<p>The way of life was follow&rsquo;d.&rdquo; Prompt I heard</p>\n<p>Her bidding, and encounter once again</p>\n<p>The strife of aching vision. As erewhile,</p>\n<p>Through glance of sunlight, stream&rsquo;d through broken cloud,</p>\n<p>Mine eyes a flower-besprinkled mead have seen,</p>\n<p>Though veil&rsquo;d themselves in shade; so saw I there</p>\n<p>Legions of splendours, on whom burning rays</p>\n<p>Shed lightnings from above, yet saw I not</p>\n<p>The fountain whence they flow&rsquo;d. O gracious virtue!</p>\n<p>Thou, whose broad stamp is on them, higher up</p>\n<p>Thou didst exalt thy glory to give room</p>\n<p>To my o&rsquo;erlabour&rsquo;d sight: when at the name</p>\n<p>Of that fair flower, whom duly I invoke</p>\n<p>Both morn and eve, my soul, with all her might</p>\n<p>Collected, on the goodliest ardour fix&rsquo;d.</p>\n<p>And, as the bright dimensions of the star</p>\n<p>In heav&rsquo;n excelling, as once here on earth</p>\n<p>Were, in my eyeballs lively portray&rsquo;d,</p>\n<p>Lo! from within the sky a cresset fell,</p>\n<p>Circling in fashion of a diadem,</p>\n<p>And girt the star, and hov&rsquo;ring round it wheel&rsquo;d.</p>\n<p class="slindent">Whatever melody sounds sweetest here,</p>\n<p>And draws the spirit most unto itself,</p>\n<p>Might seem a rent cloud when it grates the thunder,</p>\n<p>Compar&rsquo;d unto the sounding of that lyre,</p>\n<p>Wherewith the goodliest sapphire, that inlays</p>\n<p>The floor of heav&rsquo;n, was crown&rsquo;d. &ldquo;Angelic Love</p>\n<p>I am, who thus with hov&rsquo;ring flight enwheel</p>\n<p>The lofty rapture from that womb inspir&rsquo;d,</p>\n<p>Where our desire did dwell: and round thee so,</p>\n<p>Lady of Heav&rsquo;n! will hover; long as thou</p>\n<p>Thy Son shalt follow, and diviner joy</p>\n<p>Shall from thy presence gild the highest sphere.&rdquo;</p>\n<p class="slindent">Such close was to the circling melody:</p>\n<p>And, as it ended, all the other lights</p>\n<p>Took up the strain, and echoed Mary&rsquo;s name.</p>\n<p class="slindent">The robe, that with its regal folds enwraps</p>\n<p>The world, and with the nearer breath of God</p>\n<p>Doth burn and quiver, held so far retir&rsquo;d</p>\n<p>Its inner hem and skirting over us,</p>\n<p>That yet no glimmer of its majesty</p>\n<p>Had stream&rsquo;d unto me: therefore were mine eyes</p>\n<p>Unequal to pursue the crowned flame,</p>\n<p>That rose and sought its natal seed of fire;</p>\n<p>And like to babe, that stretches forth its arms</p>\n<p>For very eagerness towards the breast,</p>\n<p>After the milk is taken; so outstretch&rsquo;d</p>\n<p>Their wavy summits all the fervent band,</p>\n<p>Through zealous love to Mary: then in view</p>\n<p>There halted, and &ldquo;Regina Coeli&rdquo; sang</p>\n<p>So sweetly, the delight hath left me never.</p>\n<p class="slindent">O what o&rsquo;erflowing plenty is up-pil&rsquo;d</p>\n<p>In those rich-laden coffers, which below</p>\n<p>Sow&rsquo;d the good seed, whose harvest now they keep.</p>\n<p class="slindent">Here are the treasures tasted, that with tears</p>\n<p>Were in the Babylonian exile won,</p>\n<p>When gold had fail&rsquo;d them. Here in synod high</p>\n<p>Of ancient council with the new conven&rsquo;d,</p>\n<p>Under the Son of Mary and of God,</p>\n<p>Victorious he his mighty triumph holds,</p>\n<p>To whom the keys of glory were assign&rsquo;d.</p>\n</div>','<p class="cantohead">Canto XXIV</p>\n<div class="stanza"><p>&ldquo;O ye! in chosen fellowship advanc&rsquo;d</p>\n<p>To the great supper of the blessed Lamb,</p>\n<p>Whereon who feeds hath every wish fulfill&rsquo;d!</p>\n<p>If to this man through God&rsquo;s grace be vouchsaf&rsquo;d</p>\n<p>Foretaste of that, which from your table falls,</p>\n<p>Or ever death his fated term prescribe;</p>\n<p>Be ye not heedless of his urgent will;</p>\n<p>But may some influence of your sacred dews</p>\n<p>Sprinkle him. Of the fount ye alway drink,</p>\n<p>Whence flows what most he craves.&rdquo; Beatrice spake,</p>\n<p>And the rejoicing spirits, like to spheres</p>\n<p>On firm-set poles revolving, trail&rsquo;d a blaze</p>\n<p>Of comet splendour; and as wheels, that wind</p>\n<p>Their circles in the horologe, so work</p>\n<p>The stated rounds, that to th&rsquo; observant eye</p>\n<p>The first seems still, and, as it flew, the last;</p>\n<p>E&rsquo;en thus their carols weaving variously,</p>\n<p>They by the measure pac&rsquo;d, or swift, or slow,</p>\n<p>Made me to rate the riches of their joy.</p>\n<p class="slindent">From that, which I did note in beauty most</p>\n<p>Excelling, saw I issue forth a flame</p>\n<p>So bright, as none was left more goodly there.</p>\n<p>Round Beatrice thrice it wheel&rsquo;d about,</p>\n<p>With so divine a song, that fancy&rsquo;s ear</p>\n<p>Records it not; and the pen passeth on</p>\n<p>And leaves a blank: for that our mortal speech,</p>\n<p>Nor e&rsquo;en the inward shaping of the brain,</p>\n<p>Hath colours fine enough to trace such folds.</p>\n<p class="slindent">&ldquo;O saintly sister mine! thy prayer devout</p>\n<p>Is with so vehement affection urg&rsquo;d,</p>\n<p>Thou dost unbind me from that beauteous sphere.&rdquo;</p>\n<p class="slindent">Such were the accents towards my lady breath&rsquo;d</p>\n<p>From that blest ardour, soon as it was stay&rsquo;d:</p>\n<p>To whom she thus: &ldquo;O everlasting light</p>\n<p>Of him, within whose mighty grasp our Lord</p>\n<p>Did leave the keys, which of this wondrous bliss</p>\n<p>He bare below! tent this man, as thou wilt,</p>\n<p>With lighter probe or deep, touching the faith,</p>\n<p>By the which thou didst on the billows walk.</p>\n<p>If he in love, in hope, and in belief,</p>\n<p>Be steadfast, is not hid from thee: for thou</p>\n<p>Hast there thy ken, where all things are beheld</p>\n<p>In liveliest portraiture. But since true faith</p>\n<p>Has peopled this fair realm with citizens,</p>\n<p>Meet is, that to exalt its glory more,</p>\n<p>Thou in his audience shouldst thereof discourse.&rdquo;</p>\n<p class="slindent">Like to the bachelor, who arms himself,</p>\n<p>And speaks not, till the master have propos&rsquo;d</p>\n<p>The question, to approve, and not to end it;</p>\n<p>So I, in silence, arm&rsquo;d me, while she spake,</p>\n<p>Summoning up each argument to aid;</p>\n<p>As was behooveful for such questioner,</p>\n<p>And such profession: &ldquo;As good Christian ought,</p>\n<p>Declare thee, What is faith?&rdquo; Whereat I rais&rsquo;d</p>\n<p>My forehead to the light, whence this had breath&rsquo;d,</p>\n<p>Then turn&rsquo;d to Beatrice, and in her looks</p>\n<p>Approval met, that from their inmost fount</p>\n<p>I should unlock the waters. &ldquo;May the grace,</p>\n<p>That giveth me the captain of the church</p>\n<p>For confessor,&rdquo; said I, &ldquo;vouchsafe to me</p>\n<p>Apt utterance for my thoughts!&rdquo; then added: &ldquo;Sire!</p>\n<p>E&rsquo;en as set down by the unerring style</p>\n<p>Of thy dear brother, who with thee conspir&rsquo;d</p>\n<p>To bring Rome in unto the way of life,</p>\n<p>Faith of things hop&rsquo;d is substance, and the proof</p>\n<p>Of things not seen; and herein doth consist</p>\n<p>Methinks its essence,&rdquo;&mdash;&ldquo;Rightly hast thou deem&rsquo;d,&rdquo;</p>\n<p>Was answer&rsquo;d: &ldquo;if thou well discern, why first</p>\n<p>He hath defin&rsquo;d it, substance, and then proof.&rdquo;</p>\n<p class="slindent">&ldquo;The deep things,&rdquo; I replied, &ldquo;which here I scan</p>\n<p>Distinctly, are below from mortal eye</p>\n<p>So hidden, they have in belief alone</p>\n<p>Their being, on which credence hope sublime</p>\n<p>Is built; and therefore substance it intends.</p>\n<p>And inasmuch as we must needs infer</p>\n<p>From such belief our reasoning, all respect</p>\n<p>To other view excluded, hence of proof</p>\n<p>Th&rsquo; intention is deriv&rsquo;d.&rdquo; Forthwith I heard:</p>\n<p>&ldquo;If thus, whate&rsquo;er by learning men attain,</p>\n<p>Were understood, the sophist would want room</p>\n<p>To exercise his wit.&rdquo; So breath&rsquo;d the flame</p>\n<p>Of love: then added: &ldquo;Current is the coin</p>\n<p>Thou utter&rsquo;st, both in weight and in alloy.</p>\n<p>But tell me, if thou hast it in thy purse.&rdquo;</p>\n<p class="slindent">&ldquo;Even so glittering and so round,&rdquo; said I,</p>\n<p>&ldquo;I not a whit misdoubt of its assay.&rdquo;</p>\n<p class="slindent">Next issued from the deep imbosom&rsquo;d splendour:</p>\n<p>&ldquo;Say, whence the costly jewel, on the which</p>\n<p>Is founded every virtue, came to thee.&rdquo;</p>\n<p>&ldquo;The flood,&rdquo; I answer&rsquo;d, &ldquo;from the Spirit of God</p>\n<p>Rain&rsquo;d down upon the ancient bond and new,&mdash;</p>\n<p>Here is the reas&rsquo;ning, that convinceth me</p>\n<p>So feelingly, each argument beside</p>\n<p>Seems blunt and forceless in comparison.&rdquo;</p>\n<p>Then heard I: &ldquo;Wherefore holdest thou that each,</p>\n<p>The elder proposition and the new,</p>\n<p>Which so persuade thee, are the voice of heav&rsquo;n?&rdquo;</p>\n<p class="slindent">&ldquo;The works, that follow&rsquo;d, evidence their truth; &rdquo;</p>\n<p>I answer&rsquo;d: &ldquo;Nature did not make for these</p>\n<p>The iron hot, or on her anvil mould them.&rdquo;</p>\n<p>&ldquo;Who voucheth to thee of the works themselves,</p>\n<p>Was the reply, &ldquo;that they in very deed</p>\n<p>Are that they purport? None hath sworn so to thee.&rdquo;</p>\n<p class="slindent">&ldquo;That all the world,&rdquo; said I, &ldquo;should have bee turn&rsquo;d</p>\n<p>To Christian, and no miracle been wrought,</p>\n<p>Would in itself be such a miracle,</p>\n<p>The rest were not an hundredth part so great.</p>\n<p>E&rsquo;en thou wentst forth in poverty and hunger</p>\n<p>To set the goodly plant, that from the vine,</p>\n<p>It once was, now is grown unsightly bramble.&rdquo;</p>\n<p>That ended, through the high celestial court</p>\n<p>Resounded all the spheres. &ldquo;Praise we one God!&rdquo;</p>\n<p>In song of most unearthly melody.</p>\n<p>And when that Worthy thus, from branch to branch,</p>\n<p>Examining, had led me, that we now</p>\n<p>Approach&rsquo;d the topmost bough, he straight resum&rsquo;d;</p>\n<p>&ldquo;The grace, that holds sweet dalliance with thy soul,</p>\n<p>So far discreetly hath thy lips unclos&rsquo;d</p>\n<p>That, whatsoe&rsquo;er has past them, I commend.</p>\n<p>Behooves thee to express, what thou believ&rsquo;st,</p>\n<p>The next, and whereon thy belief hath grown.&rdquo;</p>\n<p class="slindent">&ldquo;O saintly sire and spirit!&rdquo; I began,</p>\n<p>&ldquo;Who seest that, which thou didst so believe,</p>\n<p>As to outstrip feet younger than thine own,</p>\n<p>Toward the sepulchre? thy will is here,</p>\n<p>That I the tenour of my creed unfold;</p>\n<p>And thou the cause of it hast likewise ask&rsquo;d.</p>\n<p>And I reply: I in one God believe,</p>\n<p>One sole eternal Godhead, of whose love</p>\n<p>All heav&rsquo;n is mov&rsquo;d, himself unmov&rsquo;d the while.</p>\n<p>Nor demonstration physical alone,</p>\n<p>Or more intelligential and abstruse,</p>\n<p>Persuades me to this faith; but from that truth</p>\n<p>It cometh to me rather, which is shed</p>\n<p>Through Moses, the rapt Prophets, and the Psalms.</p>\n<p>The Gospel, and that ye yourselves did write,</p>\n<p>When ye were gifted of the Holy Ghost.</p>\n<p>In three eternal Persons I believe,</p>\n<p>Essence threefold and one, mysterious league</p>\n<p>Of union absolute, which, many a time,</p>\n<p>The word of gospel lore upon my mind</p>\n<p>Imprints: and from this germ, this firstling spark,</p>\n<p>The lively flame dilates, and like heav&rsquo;n&rsquo;s star</p>\n<p>Doth glitter in me.&rsquo;&rsquo; As the master hears,</p>\n<p>Well pleas&rsquo;d, and then enfoldeth in his arms</p>\n<p>The servant, who hath joyful tidings brought,</p>\n<p>And having told the errand keeps his peace;</p>\n<p>Thus benediction uttering with song</p>\n<p>Soon as my peace I held, compass&rsquo;d me thrice</p>\n<p>The apostolic radiance, whose behest</p>\n<p>Had op&rsquo;d lips; so well their answer pleas&rsquo;d.</p>\n</div>','<p class="cantohead">Canto XXV</p>\n<div class="stanza"><p>If e&rsquo;er the sacred poem that hath made</p>\n<p>Both heav&rsquo;n and earth copartners in its toil,</p>\n<p>And with lean abstinence, through many a year,</p>\n<p>Faded my brow, be destin&rsquo;d to prevail</p>\n<p>Over the cruelty, which bars me forth</p>\n<p>Of the fair sheep-fold, where a sleeping lamb</p>\n<p>The wolves set on and fain had worried me,</p>\n<p>With other voice and fleece of other grain</p>\n<p>I shall forthwith return, and, standing up</p>\n<p>At my baptismal font, shall claim the wreath</p>\n<p>Due to the poet&rsquo;s temples: for I there</p>\n<p>First enter&rsquo;d on the faith which maketh souls</p>\n<p>Acceptable to God: and, for its sake,</p>\n<p>Peter had then circled my forehead thus.</p>\n<p class="slindent">Next from the squadron, whence had issued forth</p>\n<p>The first fruit of Christ&rsquo;s vicars on the earth,</p>\n<p>Toward us mov&rsquo;d a light, at view whereof</p>\n<p>My Lady, full of gladness, spake to me:</p>\n<p>&ldquo;Lo! lo! behold the peer of mickle might,</p>\n<p>That makes Falicia throng&rsquo;d with visitants!&rdquo;</p>\n<p class="slindent">As when the ring-dove by his mate alights,</p>\n<p>In circles each about the other wheels,</p>\n<p>And murmuring cooes his fondness; thus saw I</p>\n<p>One, of the other great and glorious prince,</p>\n<p>With kindly greeting hail&rsquo;d, extolling both</p>\n<p>Their heavenly banqueting; but when an end</p>\n<p>Was to their gratulation, silent, each,</p>\n<p>Before me sat they down, so burning bright,</p>\n<p>I could not look upon them. Smiling then,</p>\n<p>Beatrice spake: &ldquo;O life in glory shrin&rsquo;d!&rdquo;</p>\n<p>Who didst the largess of our kingly court</p>\n<p>Set down with faithful pen! let now thy voice</p>\n<p>Of hope the praises in this height resound.</p>\n<p>For thou, who figur&rsquo;st them in shapes, as clear,</p>\n<p>As Jesus stood before thee, well can&rsquo;st speak them.&rdquo;</p>\n<p class="slindent">&ldquo;Lift up thy head, and be thou strong in trust:</p>\n<p>For that, which hither from the mortal world</p>\n<p>Arriveth, must be ripen&rsquo;d in our beam.&rdquo;</p>\n<p class="slindent">Such cheering accents from the second flame</p>\n<p>Assur&rsquo;d me; and mine eyes I lifted up</p>\n<p>Unto the mountains that had bow&rsquo;d them late</p>\n<p>With over-heavy burden. &ldquo;Sith our Liege</p>\n<p>Wills of his grace that thou, or ere thy death,</p>\n<p>In the most secret council, with his lords</p>\n<p>Shouldst be confronted, so that having view&rsquo;d</p>\n<p>The glories of our court, thou mayst therewith</p>\n<p>Thyself, and all who hear, invigorate</p>\n<p>With hope, that leads to blissful end; declare,</p>\n<p>What is that hope, how it doth flourish in thee,</p>\n<p>And whence thou hadst it?&rdquo; Thus proceeding still,</p>\n<p>The second light: and she, whose gentle love</p>\n<p>My soaring pennons in that lofty flight</p>\n<p>Escorted, thus preventing me, rejoin&rsquo;d:</p>\n<p>Among her sons, not one more full of hope,</p>\n<p>Hath the church militant: so &rsquo;t is of him</p>\n<p>Recorded in the sun, whose liberal orb</p>\n<p>Enlighteneth all our tribe: and ere his term</p>\n<p>Of warfare, hence permitted he is come,</p>\n<p>From Egypt to Jerusalem, to see.</p>\n<p>The other points, both which thou hast inquir&rsquo;d,</p>\n<p>Not for more knowledge, but that he may tell</p>\n<p>How dear thou holdst the virtue, these to him</p>\n<p>Leave I; for he may answer thee with ease,</p>\n<p>And without boasting, so God give him grace.&rdquo;</p>\n<p>Like to the scholar, practis&rsquo;d in his task,</p>\n<p>Who, willing to give proof of diligence,</p>\n<p>Seconds his teacher gladly, &ldquo;Hope,&rdquo; said I,</p>\n<p>&ldquo;Is of the joy to come a sure expectance,</p>\n<p>Th&rsquo; effect of grace divine and merit preceding.</p>\n<p>This light from many a star visits my heart,</p>\n<p>But flow&rsquo;d to me the first from him, who sang</p>\n<p>The songs of the Supreme, himself supreme</p>\n<p>Among his tuneful brethren. &lsquo;Let all hope</p>\n<p>In thee,&rsquo; so speak his anthem, &lsquo;who have known</p>\n<p>Thy name;&rsquo; and with my faith who know not that?</p>\n<p>From thee, the next, distilling from his spring,</p>\n<p>In thine epistle, fell on me the drops</p>\n<p>So plenteously, that I on others shower</p>\n<p>The influence of their dew.&rdquo; Whileas I spake,</p>\n<p>A lamping, as of quick and vollied lightning,</p>\n<p>Within the bosom of that mighty sheen,</p>\n<p>Play&rsquo;d tremulous; then forth these accents breath&rsquo;d:</p>\n<p>&ldquo;Love for the virtue which attended me</p>\n<p>E&rsquo;en to the palm, and issuing from the field,</p>\n<p>Glows vigorous yet within me, and inspires</p>\n<p>To ask of thee, whom also it delights;</p>\n<p>What promise thou from hope in chief dost win.&rdquo;</p>\n<p class="slindent">&ldquo;Both scriptures, new and ancient,&rdquo; I reply&rsquo;d;</p>\n<p>&ldquo;Propose the mark (which even now I view)</p>\n<p>For souls belov&rsquo;d of God. Isaias saith,</p>\n<p class="slindent">That, in their own land, each one must be clad</p>\n<p>In twofold vesture; and their proper lands this delicious life.</p>\n<p>In terms more full,</p>\n<p>And clearer far, thy brother hath set forth</p>\n<p>This revelation to us, where he tells</p>\n<p>Of the white raiment destin&rsquo;d to the saints.&rdquo;</p>\n<p>And, as the words were ending, from above,</p>\n<p>&ldquo;They hope in thee,&rdquo; first heard we cried: whereto</p>\n<p>Answer&rsquo;d the carols all. Amidst them next,</p>\n<p>A light of so clear amplitude emerg&rsquo;d,</p>\n<p>That winter&rsquo;s month were but a single day,</p>\n<p>Were such a crystal in the Cancer&rsquo;s sign.</p>\n<p class="slindent">Like as a virgin riseth up, and goes,</p>\n<p>And enters on the mazes of the dance,</p>\n<p>Though gay, yet innocent of worse intent,</p>\n<p>Than to do fitting honour to the bride;</p>\n<p>So I beheld the new effulgence come</p>\n<p>Unto the other two, who in a ring</p>\n<p>Wheel&rsquo;d, as became their rapture. In the dance</p>\n<p>And in the song it mingled. And the dame</p>\n<p>Held on them fix&rsquo;d her looks: e&rsquo;en as the spouse</p>\n<p>Silent and moveless. &ldquo;This is he, who lay</p>\n<p>Upon the bosom of our pelican:</p>\n<p>This he, into whose keeping from the cross</p>\n<p>The mighty charge was given.&rdquo; Thus she spake,</p>\n<p>Yet therefore naught the more remov&rsquo;d her Sight</p>\n<p>From marking them, or ere her words began,</p>\n<p>Or when they clos&rsquo;d. As he, who looks intent,</p>\n<p>And strives with searching ken, how he may see</p>\n<p>The sun in his eclipse, and, through desire</p>\n<p>Of seeing, loseth power of sight: so I</p>\n<p>Peer&rsquo;d on that last resplendence, while I heard:</p>\n<p>&ldquo;Why dazzlest thou thine eyes in seeking that,</p>\n<p>Which here abides not? Earth my body is,</p>\n<p>In earth: and shall be, with the rest, so long,</p>\n<p>As till our number equal the decree</p>\n<p>Of the Most High. The two that have ascended,</p>\n<p>In this our blessed cloister, shine alone</p>\n<p>With the two garments. So report below.&rdquo;</p>\n<p class="slindent">As when, for ease of labour, or to shun</p>\n<p>Suspected peril at a whistle&rsquo;s breath,</p>\n<p>The oars, erewhile dash&rsquo;d frequent in the wave,</p>\n<p>All rest; the flamy circle at that voice</p>\n<p>So rested, and the mingling sound was still,</p>\n<p>Which from the trinal band soft-breathing rose.</p>\n<p>I turn&rsquo;d, but ah! how trembled in my thought,</p>\n<p>When, looking at my side again to see</p>\n<p>Beatrice, I descried her not, although</p>\n<p>Not distant, on the happy coast she stood.</p>\n</div>','<p class="cantohead">Canto XXVI</p>\n<div class="stanza"><p>With dazzled eyes, whilst wond&rsquo;ring I remain&rsquo;d,</p>\n<p>Forth of the beamy flame which dazzled me,</p>\n<p>Issued a breath, that in attention mute</p>\n<p>Detain&rsquo;d me; and these words it spake: &ldquo;&nbsp;&rsquo;T were well,</p>\n<p>That, long as till thy vision, on my form</p>\n<p>O&rsquo;erspent, regain its virtue, with discourse</p>\n<p>Thou compensate the brief delay. Say then,</p>\n<p>Beginning, to what point thy soul aspires:</p>\n<p>And meanwhile rest assur&rsquo;d, that sight in thee</p>\n<p>Is but o&rsquo;erpowered a space, not wholly quench&rsquo;d:</p>\n<p>Since thy fair guide and lovely, in her look</p>\n<p>Hath potency, the like to that which dwelt</p>\n<p>In Ananias&rsquo; hand.&rsquo;&rsquo; I answering thus:</p>\n<p>&ldquo;Be to mine eyes the remedy or late</p>\n<p>Or early, at her pleasure; for they were</p>\n<p>The gates, at which she enter&rsquo;d, and did light</p>\n<p>Her never dying fire. My wishes here</p>\n<p>Are centered; in this palace is the weal,</p>\n<p>That Alpha and Omega, is to all</p>\n<p>The lessons love can read me.&rdquo; Yet again</p>\n<p>The voice which had dispers&rsquo;d my fear, when daz&rsquo;d</p>\n<p>With that excess, to converse urg&rsquo;d, and spake:</p>\n<p>&ldquo;Behooves thee sift more narrowly thy terms,</p>\n<p>And say, who level&rsquo;d at this scope thy bow.&rdquo;</p>\n<p class="slindent">&ldquo;Philosophy,&rdquo; said I, &ldquo;hath arguments,</p>\n<p>And this place hath authority enough</p>\n<p>&rsquo;T&rsquo; imprint in me such love: for, of constraint,</p>\n<p>Good, inasmuch as we perceive the good,</p>\n<p>Kindles our love, and in degree the more,</p>\n<p>As it comprises more of goodness in &rsquo;t.</p>\n<p>The essence then, where such advantage is,</p>\n<p>That each good, found without it, is naught else</p>\n<p>But of his light the beam, must needs attract</p>\n<p>The soul of each one, loving, who the truth</p>\n<p>Discerns, on which this proof is built. Such truth</p>\n<p>Learn I from him, who shows me the first love</p>\n<p>Of all intelligential substances</p>\n<p>Eternal: from his voice I learn, whose word</p>\n<p>Is truth, that of himself to Moses saith,</p>\n<p>&lsquo;I will make all my good before thee pass.&rsquo;</p>\n<p>Lastly from thee I learn, who chief proclaim&rsquo;st,</p>\n<p>E&rsquo;en at the outset of thy heralding,</p>\n<p>In mortal ears the mystery of heav&rsquo;n.&rdquo;</p>\n<p class="slindent">&ldquo;Through human wisdom, and th&rsquo; authority</p>\n<p>Therewith agreeing,&rdquo; heard I answer&rsquo;d, &ldquo;keep</p>\n<p>The choicest of thy love for God. But say,</p>\n<p>If thou yet other cords within thee feel&rsquo;st</p>\n<p>That draw thee towards him; so that thou report</p>\n<p>How many are the fangs, with which this love</p>\n<p>Is grappled to thy soul.&rdquo; I did not miss,</p>\n<p>To what intent the eagle of our Lord</p>\n<p>Had pointed his demand; yea noted well</p>\n<p>Th&rsquo; avowal, which he led to; and resum&rsquo;d:</p>\n<p>&ldquo;All grappling bonds, that knit the heart to God,</p>\n<p>Confederate to make fast our clarity.</p>\n<p>The being of the world, and mine own being,</p>\n<p>The death which he endur&rsquo;d that I should live,</p>\n<p>And that, which all the faithful hope, as I do,</p>\n<p>To the foremention&rsquo;d lively knowledge join&rsquo;d,</p>\n<p>Have from the sea of ill love sav&rsquo;d my bark,</p>\n<p>And on the coast secur&rsquo;d it of the right.</p>\n<p>As for the leaves, that in the garden bloom,</p>\n<p>My love for them is great, as is the good</p>\n<p>Dealt by th&rsquo; eternal hand, that tends them all.&rdquo;</p>\n<p class="slindent">I ended, and therewith a song most sweet</p>\n<p>Rang through the spheres; and &ldquo;Holy, holy, holy,&rdquo;</p>\n<p>Accordant with the rest my lady sang.</p>\n<p>And as a sleep is broken and dispers&rsquo;d</p>\n<p>Through sharp encounter of the nimble light,</p>\n<p>With the eye&rsquo;s spirit running forth to meet</p>\n<p>The ray, from membrane on to the membrane urg&rsquo;d;</p>\n<p>And the upstartled wight loathes that be sees;</p>\n<p>So, at his sudden waking, he misdeems</p>\n<p>Of all around him, till assurance waits</p>\n<p>On better judgment: thus the saintly came</p>\n<p>Drove from before mine eyes the motes away,</p>\n<p>With the resplendence of her own, that cast</p>\n<p>Their brightness downward, thousand miles below.</p>\n<p>Whence I my vision, clearer shall before,</p>\n<p>Recover&rsquo;d; and, well nigh astounded, ask&rsquo;d</p>\n<p>Of a fourth light, that now with us I saw.</p>\n<p class="slindent">And Beatrice: &ldquo;The first diving soul,</p>\n<p>That ever the first virtue fram&rsquo;d, admires</p>\n<p>Within these rays his Maker.&rdquo; Like the leaf,</p>\n<p>That bows its lithe top till the blast is blown;</p>\n<p>By its own virtue rear&rsquo;d then stands aloof;</p>\n<p>So I, the whilst she said, awe-stricken bow&rsquo;d.</p>\n<p>Then eagerness to speak embolden&rsquo;d me;</p>\n<p>And I began: &ldquo;O fruit! that wast alone</p>\n<p>Mature, when first engender&rsquo;d! Ancient father!</p>\n<p>That doubly seest in every wedded bride</p>\n<p>Thy daughter by affinity and blood!</p>\n<p>Devoutly as I may, I pray thee hold</p>\n<p>Converse with me: my will thou seest; and I,</p>\n<p>More speedily to hear thee, tell it not &rdquo;</p>\n<p class="slindent">It chanceth oft some animal bewrays,</p>\n<p>Through the sleek cov&rsquo;ring of his furry coat.</p>\n<p>The fondness, that stirs in him and conforms</p>\n<p>His outside seeming to the cheer within:</p>\n<p>And in like guise was Adam&rsquo;s spirit mov&rsquo;d</p>\n<p>To joyous mood, that through the covering shone,</p>\n<p>Transparent, when to pleasure me it spake:</p>\n<p>&ldquo;No need thy will be told, which I untold</p>\n<p>Better discern, than thou whatever thing</p>\n<p>Thou holdst most certain: for that will I see</p>\n<p>In Him, who is truth&rsquo;s mirror, and Himself</p>\n<p>Parhelion unto all things, and naught else</p>\n<p>To him. This wouldst thou hear; how long since God</p>\n<p>Plac&rsquo;d me high garden, from whose hounds</p>\n<p>She led me up in this ladder, steep and long;</p>\n<p>What space endur&rsquo;d my season of delight;</p>\n<p>Whence truly sprang the wrath that banish&rsquo;d me;</p>\n<p>And what the language, which I spake and fram&rsquo;d</p>\n<p>Not that I tasted of the tree, my son,</p>\n<p>Was in itself the cause of that exile,</p>\n<p>But only my transgressing of the mark</p>\n<p>Assign&rsquo;d me. There, whence at thy lady&rsquo;s hest</p>\n<p>The Mantuan mov&rsquo;d him, still was I debarr&rsquo;d</p>\n<p>This council, till the sun had made complete,</p>\n<p>Four thousand and three hundred rounds and twice,</p>\n<p>His annual journey; and, through every light</p>\n<p>In his broad pathway, saw I him return,</p>\n<p>Thousand save sev&rsquo;nty times, the whilst I dwelt</p>\n<p>Upon the earth. The language I did use</p>\n<p>Was worn away, or ever Nimrod&rsquo;s race</p>\n<p>Their unaccomplishable work began.</p>\n<p>For naught, that man inclines to, ere was lasting,</p>\n<p>Left by his reason free, and variable,</p>\n<p>As is the sky that sways him. That he speaks,</p>\n<p>Is nature&rsquo;s prompting: whether thus or thus,</p>\n<p>She leaves to you, as ye do most affect it.</p>\n<p>Ere I descended into hell&rsquo;s abyss,</p>\n<p>El was the name on earth of the Chief Good,</p>\n<p>Whose joy enfolds me: Eli then &rsquo;t was call&rsquo;d</p>\n<p>And so beseemeth: for, in mortals, use</p>\n<p>Is as the leaf upon the bough; that goes,</p>\n<p>And other comes instead. Upon the mount</p>\n<p>Most high above the waters, all my life,</p>\n<p>Both innocent and guilty, did but reach</p>\n<p>From the first hour, to that which cometh next</p>\n<p>(As the sun changes quarter), to the sixth.</p>\n</div>','<p class="cantohead">Canto XXVII</p>\n<div class="stanza"><p>Then &ldquo;Glory to the Father, to the Son,</p>\n<p>And to the Holy Spirit,&rdquo; rang aloud</p>\n<p>Throughout all Paradise, that with the song</p>\n<p>My spirit reel&rsquo;d, so passing sweet the strain:</p>\n<p>And what I saw was equal ecstasy;</p>\n<p>One universal smile it seem&rsquo;d of all things,</p>\n<p>Joy past compare, gladness unutterable,</p>\n<p>Imperishable life of peace and love,</p>\n<p>Exhaustless riches and unmeasur&rsquo;d bliss.</p>\n<p class="slindent">Before mine eyes stood the four torches lit;</p>\n<p>And that, which first had come, began to wax</p>\n<p>In brightness, and in semblance such became,</p>\n<p>As Jove might be, if he and Mars were birds,</p>\n<p>And interchang&rsquo;d their plumes. Silence ensued,</p>\n<p>Through the blest quire, by Him, who here appoints</p>\n<p>Vicissitude of ministry, enjoin&rsquo;d;</p>\n<p>When thus I heard: &ldquo;Wonder not, if my hue</p>\n<p>Be chang&rsquo;d; for, while I speak, these shalt thou see</p>\n<p>All in like manner change with me. My place</p>\n<p>He who usurps on earth (my place, ay, mine,</p>\n<p>Which in the presence of the Son of God</p>\n<p>Is void), the same hath made my cemetery</p>\n<p>A common sewer of puddle and of blood:</p>\n<p>The more below his triumph, who from hence</p>\n<p>Malignant fell.&rdquo; Such colour, as the sun,</p>\n<p>At eve or morning, paints and adverse cloud,</p>\n<p>Then saw I sprinkled over all the sky.</p>\n<p>And as th&rsquo; unblemish&rsquo;d dame, who in herself</p>\n<p>Secure of censure, yet at bare report</p>\n<p>Of other&rsquo;s failing, shrinks with maiden fear;</p>\n<p>So Beatrice in her semblance chang&rsquo;d:</p>\n<p>And such eclipse in heav&rsquo;n methinks was seen,</p>\n<p>When the Most Holy suffer&rsquo;d. Then the words</p>\n<p>Proceeded, with voice, alter&rsquo;d from itself</p>\n<p>So clean, the semblance did not alter more.</p>\n<p>&ldquo;Not to this end was Christ&rsquo;s spouse with my blood,</p>\n<p>With that of Linus, and of Cletus fed:</p>\n<p>That she might serve for purchase of base gold:</p>\n<p>But for the purchase of this happy life</p>\n<p>Did Sextus, Pius, and Callixtus bleed,</p>\n<p>And Urban, they, whose doom was not without</p>\n<p>Much weeping seal&rsquo;d. No purpose was of our</p>\n<p>That on the right hand of our successors</p>\n<p>Part of the Christian people should be set,</p>\n<p>And part upon their left; nor that the keys,</p>\n<p>Which were vouchsaf&rsquo;d me, should for ensign serve</p>\n<p>Unto the banners, that do levy war</p>\n<p>On the baptiz&rsquo;d: nor I, for sigil-mark</p>\n<p>Set upon sold and lying privileges;</p>\n<p>Which makes me oft to bicker and turn red.</p>\n<p>In shepherd&rsquo;s clothing greedy wolves below</p>\n<p>Range wide o&rsquo;er all the pastures. Arm of God!</p>\n<p>Why longer sleepst thou? Caorsines and Gascona</p>\n<p>Prepare to quaff our blood. O good beginning</p>\n<p>To what a vile conclusion must thou stoop!</p>\n<p>But the high providence, which did defend</p>\n<p>Through Scipio the world&rsquo;s glory unto Rome,</p>\n<p>Will not delay its succour: and thou, son,</p>\n<p>Who through thy mortal weight shall yet again</p>\n<p>Return below, open thy lips, nor hide</p>\n<p>What is by me not hidden.&rdquo; As a Hood</p>\n<p>Of frozen vapours streams adown the air,</p>\n<p>What time the she-goat with her skiey horn</p>\n<p>Touches the sun; so saw I there stream wide</p>\n<p>The vapours, who with us had linger&rsquo;d late</p>\n<p>And with glad triumph deck th&rsquo; ethereal cope.</p>\n<p>Onward my sight their semblances pursued;</p>\n<p>So far pursued, as till the space between</p>\n<p>From its reach sever&rsquo;d them: whereat the guide</p>\n<p>Celestial, marking me no more intent</p>\n<p>On upward gazing, said, &ldquo;Look down and see</p>\n<p>What circuit thou hast compass&rsquo;d.&rdquo; From the hour</p>\n<p>When I before had cast my view beneath,</p>\n<p>All the first region overpast I saw,</p>\n<p>Which from the midmost to the bound&rsquo;ry winds;</p>\n<p>That onward thence from Gades I beheld</p>\n<p>The unwise passage of Laertes&rsquo; son,</p>\n<p>And hitherward the shore, where thou, Europa!</p>\n<p>Mad&rsquo;st thee a joyful burden: and yet more</p>\n<p>Of this dim spot had seen, but that the sun,</p>\n<p>A constellation off and more, had ta&rsquo;en</p>\n<p>His progress in the zodiac underneath.</p>\n<p class="slindent">Then by the spirit, that doth never leave</p>\n<p>Its amorous dalliance with my lady&rsquo;s looks,</p>\n<p>Back with redoubled ardour were mine eyes</p>\n<p>Led unto her: and from her radiant smiles,</p>\n<p>Whenas I turn&rsquo;d me, pleasure so divine</p>\n<p>Did lighten on me, that whatever bait</p>\n<p>Or art or nature in the human flesh,</p>\n<p>Or in its limn&rsquo;d resemblance, can combine</p>\n<p>Through greedy eyes to take the soul withal,</p>\n<p>Were to her beauty nothing. Its boon influence</p>\n<p>From the fair nest of Leda rapt me forth,</p>\n<p>And wafted on into the swiftest heav&rsquo;n.</p>\n<p class="slindent">What place for entrance Beatrice chose,</p>\n<p>I may not say, so uniform was all,</p>\n<p>Liveliest and loftiest. She my secret wish</p>\n<p>Divin&rsquo;d; and with such gladness, that God&rsquo;s love</p>\n<p>Seem&rsquo;d from her visage shining, thus began:</p>\n<p>&ldquo;Here is the goal, whence motion on his race</p>\n<p>Starts; motionless the centre, and the rest</p>\n<p>All mov&rsquo;d around. Except the soul divine,</p>\n<p>Place in this heav&rsquo;n is none, the soul divine,</p>\n<p>Wherein the love, which ruleth o&rsquo;er its orb,</p>\n<p>Is kindled, and the virtue that it sheds;</p>\n<p>One circle, light and love, enclasping it,</p>\n<p>As this doth clasp the others; and to Him,</p>\n<p>Who draws the bound, its limit only known.</p>\n<p>Measur&rsquo;d itself by none, it doth divide</p>\n<p>Motion to all, counted unto them forth,</p>\n<p>As by the fifth or half ye count forth ten.</p>\n<p>The vase, wherein time&rsquo;s roots are plung&rsquo;d, thou seest,</p>\n<p>Look elsewhere for the leaves. O mortal lust!</p>\n<p>That canst not lift thy head above the waves</p>\n<p>Which whelm and sink thee down! The will in man</p>\n<p>Bears goodly blossoms; but its ruddy promise</p>\n<p>Is, by the dripping of perpetual rain,</p>\n<p>Made mere abortion: faith and innocence</p>\n<p>Are met with but in babes, each taking leave</p>\n<p>Ere cheeks with down are sprinkled; he, that fasts,</p>\n<p>While yet a stammerer, with his tongue let loose</p>\n<p>Gluts every food alike in every moon.</p>\n<p>One yet a babbler, loves and listens to</p>\n<p>His mother; but no sooner hath free use</p>\n<p>Of speech, than he doth wish her in her grave.</p>\n<p>So suddenly doth the fair child of him,</p>\n<p>Whose welcome is the morn and eve his parting,</p>\n<p>To negro blackness change her virgin white.</p>\n<p class="slindent">&ldquo;Thou, to abate thy wonder, note that none</p>\n<p>Bears rule in earth, and its frail family</p>\n<p>Are therefore wand&rsquo;rers. Yet before the date,</p>\n<p>When through the hundredth in his reck&rsquo;ning drops</p>\n<p>Pale January must be shor&rsquo;d aside</p>\n<p>From winter&rsquo;s calendar, these heav&rsquo;nly spheres</p>\n<p>Shall roar so loud, that fortune shall be fain</p>\n<p>To turn the poop, where she hath now the prow;</p>\n<p>So that the fleet run onward; and true fruit,</p>\n<p>Expected long, shall crown at last the bloom!&rdquo;</p>\n</div>','<p class="cantohead">Canto XXVIII</p>\n<div class="stanza"><p>So she who doth imparadise my soul,</p>\n<p>Had drawn the veil from off our pleasant life,</p>\n<p>And bar&rsquo;d the truth of poor mortality;</p>\n<p>When lo! as one who, in a mirror, spies</p>\n<p>The shining of a flambeau at his back,</p>\n<p>Lit sudden ore he deem of its approach,</p>\n<p>And turneth to resolve him, if the glass</p>\n<p>Have told him true, and sees the record faithful</p>\n<p>As note is to its metre; even thus,</p>\n<p>I well remember, did befall to me,</p>\n<p>Looking upon the beauteous eyes, whence love</p>\n<p>Had made the leash to take me. As I turn&rsquo;d;</p>\n<p>And that, which, in their circles, none who spies,</p>\n<p>Can miss of, in itself apparent, struck</p>\n<p>On mine; a point I saw, that darted light</p>\n<p>So sharp, no lid, unclosing, may bear up</p>\n<p>Against its keenness. The least star we view</p>\n<p>From hence, had seem&rsquo;d a moon, set by its side,</p>\n<p>As star by side of star. And so far off,</p>\n<p>Perchance, as is the halo from the light</p>\n<p>Which paints it, when most dense the vapour spreads,</p>\n<p>There wheel&rsquo;d about the point a circle of fire,</p>\n<p>More rapid than the motion, which first girds</p>\n<p>The world. Then, circle after circle, round</p>\n<p>Enring&rsquo;d each other; till the seventh reach&rsquo;d</p>\n<p>Circumference so ample, that its bow,</p>\n<p>Within the span of Juno&rsquo;s messenger,</p>\n<p>lied scarce been held entire. Beyond the sev&rsquo;nth,</p>\n<p>Follow&rsquo;d yet other two. And every one,</p>\n<p>As more in number distant from the first,</p>\n<p>Was tardier in motion; and that glow&rsquo;d</p>\n<p>With flame most pure, that to the sparkle&rsquo; of truth</p>\n<p>Was nearest, as partaking most, methinks,</p>\n<p>Of its reality. The guide belov&rsquo;d</p>\n<p>Saw me in anxious thought suspense, and spake:</p>\n<p>&ldquo;Heav&rsquo;n, and all nature, hangs upon that point.</p>\n<p>The circle thereto most conjoin&rsquo;d observe;</p>\n<p>And know, that by intenser love its course</p>\n<p>Is to this swiftness wing&rsquo;d. &ldquo;To whom I thus:</p>\n<p>&ldquo;It were enough; nor should I further seek,</p>\n<p>Had I but witness&rsquo;d order, in the world</p>\n<p>Appointed, such as in these wheels is seen.</p>\n<p>But in the sensible world such diff&rsquo;rence is,</p>\n<p>That is each round shows more divinity,</p>\n<p>As each is wider from the centre. Hence,</p>\n<p>If in this wondrous and angelic temple,</p>\n<p>That hath for confine only light and love,</p>\n<p>My wish may have completion I must know,</p>\n<p>Wherefore such disagreement is between</p>\n<p>Th&rsquo; exemplar and its copy: for myself,</p>\n<p>Contemplating, I fail to pierce the cause.&rdquo;</p>\n<p class="slindent">&ldquo;It is no marvel, if thy fingers foil&rsquo;d</p>\n<p>Do leave the knot untied: so hard &rsquo;t is grown</p>\n<p>For want of tenting.&rdquo; Thus she said: &ldquo;But take,&rdquo;</p>\n<p>She added, &ldquo;if thou wish thy cure, my words,</p>\n<p>And entertain them subtly. Every orb</p>\n<p>Corporeal, doth proportion its extent</p>\n<p>Unto the virtue through its parts diffus&rsquo;d.</p>\n<p>The greater blessedness preserves the more.</p>\n<p>The greater is the body (if all parts</p>\n<p>Share equally) the more is to preserve.</p>\n<p>Therefore the circle, whose swift course enwheels</p>\n<p>The universal frame answers to that,</p>\n<p>Which is supreme in knowledge and in love</p>\n<p>Thus by the virtue, not the seeming, breadth</p>\n<p>Of substance, measure, thou shalt see the heav&rsquo;ns,</p>\n<p>Each to the&rsquo; intelligence that ruleth it,</p>\n<p>Greater to more, and smaller unto less,</p>\n<p>Suited in strict and wondrous harmony.&rdquo;</p>\n<p class="slindent">As when the sturdy north blows from his cheek</p>\n<p>A blast, that scours the sky, forthwith our air,</p>\n<p>Clear&rsquo;d of the rack, that hung on it before,</p>\n<p>Glitters; and, With his beauties all unveil&rsquo;d,</p>\n<p>The firmament looks forth serene, and smiles;</p>\n<p>Such was my cheer, when Beatrice drove</p>\n<p>With clear reply the shadows back, and truth</p>\n<p>Was manifested, as a star in heaven.</p>\n<p>And when the words were ended, not unlike</p>\n<p>To iron in the furnace, every cirque</p>\n<p>Ebullient shot forth scintillating fires:</p>\n<p>And every sparkle shivering to new blaze,</p>\n<p>In number did outmillion the account</p>\n<p>Reduplicate upon the chequer&rsquo;d board.</p>\n<p>Then heard I echoing on from choir to choir,</p>\n<p>&ldquo;Hosanna,&rdquo; to the fixed point, that holds,</p>\n<p>And shall for ever hold them to their place,</p>\n<p>From everlasting, irremovable.</p>\n<p class="slindent">Musing awhile I stood: and she, who saw</p>\n<p>by inward meditations, thus began:</p>\n<p>&ldquo;In the first circles, they, whom thou beheldst,</p>\n<p>Are seraphim and cherubim. Thus swift</p>\n<p>Follow their hoops, in likeness to the point,</p>\n<p>Near as they can, approaching; and they can</p>\n<p>The more, the loftier their vision. Those,</p>\n<p>That round them fleet, gazing the Godhead next,</p>\n<p>Are thrones; in whom the first trine ends. And all</p>\n<p>Are blessed, even as their sight descends</p>\n<p>Deeper into the truth, wherein rest is</p>\n<p>For every mind. Thus happiness hath root</p>\n<p>In seeing, not in loving, which of sight</p>\n<p>Is aftergrowth. And of the seeing such</p>\n<p>The meed, as unto each in due degree</p>\n<p>Grace and good-will their measure have assign&rsquo;d.</p>\n<p>The other trine, that with still opening buds</p>\n<p>In this eternal springtide blossom fair,</p>\n<p>Fearless of bruising from the nightly ram,</p>\n<p>Breathe up in warbled melodies threefold</p>\n<p>Hosannas blending ever, from the three</p>\n<p>Transmitted. hierarchy of gods, for aye</p>\n<p>Rejoicing, dominations first, next then</p>\n<p>Virtues, and powers the third. The next to whom</p>\n<p>Are princedoms and archangels, with glad round</p>\n<p>To tread their festal ring; and last the band</p>\n<p>Angelical, disporting in their sphere.</p>\n<p>All, as they circle in their orders, look</p>\n<p>Aloft, and downward with such sway prevail,</p>\n<p>That all with mutual impulse tend to God.</p>\n<p>These once a mortal view beheld. Desire</p>\n<p>In Dionysius so intently wrought,</p>\n<p>That he, as I have done rang&rsquo;d them; and nam&rsquo;d</p>\n<p>Their orders, marshal&rsquo;d in his thought. From him</p>\n<p>Dissentient, one refus&rsquo;d his sacred read.</p>\n<p>But soon as in this heav&rsquo;n his doubting eyes</p>\n<p>Were open&rsquo;d, Gregory at his error smil&rsquo;d</p>\n<p>Nor marvel, that a denizen of earth</p>\n<p>Should scan such secret truth; for he had learnt</p>\n<p>Both this and much beside of these our orbs,</p>\n<p>From an eye-witness to heav&rsquo;n&rsquo;s mysteries.&rdquo;</p>\n</div>','<p class="cantohead">Canto XXIX</p>\n<div class="stanza"><p>No longer than what time Latona&rsquo;s twins</p>\n<p>Cover&rsquo;d of Libra and the fleecy star,</p>\n<p>Together both, girding the&rsquo; horizon hang,</p>\n<p>In even balance from the zenith pois&rsquo;d,</p>\n<p>Till from that verge, each, changing hemisphere,</p>\n<p>Part the nice level; e&rsquo;en so brief a space</p>\n<p>Did Beatrice&rsquo;s silence hold. A smile</p>\n<p>Bat painted on her cheek; and her fix&rsquo;d gaze</p>\n<p>Bent on the point, at which my vision fail&rsquo;d:</p>\n<p>When thus her words resuming she began:</p>\n<p>&ldquo;I speak, nor what thou wouldst inquire demand;</p>\n<p>For I have mark&rsquo;d it, where all time and place</p>\n<p>Are present. Not for increase to himself</p>\n<p>Of good, which may not be increas&rsquo;d, but forth</p>\n<p>To manifest his glory by its beams,</p>\n<p>Inhabiting his own eternity,</p>\n<p>Beyond time&rsquo;s limit or what bound soe&rsquo;er</p>\n<p>To circumscribe his being, as he will&rsquo;d,</p>\n<p>Into new natures, like unto himself,</p>\n<p>Eternal Love unfolded. Nor before,</p>\n<p>As if in dull inaction torpid lay.</p>\n<p>For not in process of before or aft</p>\n<p>Upon these waters mov&rsquo;d the Spirit of God.</p>\n<p>Simple and mix&rsquo;d, both form and substance, forth</p>\n<p>To perfect being started, like three darts</p>\n<p>Shot from a bow three-corded. And as ray</p>\n<p>In crystal, glass, and amber, shines entire,</p>\n<p>E&rsquo;en at the moment of its issuing; thus</p>\n<p>Did, from th&rsquo; eternal Sovran, beam entire</p>\n<p>His threefold operation, at one act</p>\n<p>Produc&rsquo;d coeval. Yet in order each</p>\n<p>Created his due station knew: those highest,</p>\n<p>Who pure intelligence were made: mere power</p>\n<p>The lowest: in the midst, bound with strict league,</p>\n<p>Intelligence and power, unsever&rsquo;d bond.</p>\n<p>Long tract of ages by the angels past,</p>\n<p>Ere the creating of another world,</p>\n<p>Describ&rsquo;d on Jerome&rsquo;s pages thou hast seen.</p>\n<p>But that what I disclose to thee is true,</p>\n<p>Those penmen, whom the Holy Spirit mov&rsquo;d</p>\n<p>In many a passage of their sacred book</p>\n<p>Attest; as thou by diligent search shalt find</p>\n<p>And reason in some sort discerns the same,</p>\n<p>Who scarce would grant the heav&rsquo;nly ministers</p>\n<p>Of their perfection void, so long a space.</p>\n<p>Thus when and where these spirits of love were made,</p>\n<p>Thou know&rsquo;st, and how: and knowing hast allay&rsquo;d</p>\n<p>Thy thirst, which from the triple question rose.</p>\n<p>Ere one had reckon&rsquo;d twenty, e&rsquo;en so soon</p>\n<p>Part of the angels fell: and in their fall</p>\n<p>Confusion to your elements ensued.</p>\n<p>The others kept their station: and this task,</p>\n<p>Whereon thou lookst, began with such delight,</p>\n<p>That they surcease not ever, day nor night,</p>\n<p>Their circling. Of that fatal lapse the cause</p>\n<p>Was the curst pride of him, whom thou hast seen</p>\n<p>Pent with the world&rsquo;s incumbrance. Those, whom here</p>\n<p>Thou seest, were lowly to confess themselves</p>\n<p>Of his free bounty, who had made them apt</p>\n<p>For ministries so high: therefore their views</p>\n<p>Were by enlight&rsquo;ning grace and their own merit</p>\n<p>Exalted; so that in their will confirm&rsquo;d</p>\n<p>They stand, nor feel to fall. For do not doubt,</p>\n<p>But to receive the grace, which heav&rsquo;n vouchsafes,</p>\n<p>Is meritorious, even as the soul</p>\n<p>With prompt affection welcometh the guest.</p>\n<p>Now, without further help, if with good heed</p>\n<p>My words thy mind have treasur&rsquo;d, thou henceforth</p>\n<p>This consistory round about mayst scan,</p>\n<p>And gaze thy fill. But since thou hast on earth</p>\n<p>Heard vain disputers, reasoners in the schools,</p>\n<p>Canvas the&rsquo; angelic nature, and dispute</p>\n<p>Its powers of apprehension, memory, choice;</p>\n<p>Therefore, &rsquo;t is well thou take from me the truth,</p>\n<p>Pure and without disguise, which they below,</p>\n<p>Equivocating, darken and perplex.</p>\n<p class="slindent">&ldquo;Know thou, that, from the first, these substances,</p>\n<p>Rejoicing in the countenance of God,</p>\n<p>Have held unceasingly their view, intent</p>\n<p>Upon the glorious vision, from the which</p>\n<p>Naught absent is nor hid: where then no change</p>\n<p>Of newness with succession interrupts,</p>\n<p>Remembrance there needs none to gather up</p>\n<p>Divided thought and images remote</p>\n<p class="slindent">&ldquo;So that men, thus at variance with the truth</p>\n<p>Dream, though their eyes be open; reckless some</p>\n<p>Of error; others well aware they err,</p>\n<p>To whom more guilt and shame are justly due.</p>\n<p>Each the known track of sage philosophy</p>\n<p>Deserts, and has a byway of his own:</p>\n<p>So much the restless eagerness to shine</p>\n<p>And love of singularity prevail.</p>\n<p>Yet this, offensive as it is, provokes</p>\n<p>Heav&rsquo;n&rsquo;s anger less, than when the book of God</p>\n<p>Is forc&rsquo;d to yield to man&rsquo;s authority,</p>\n<p>Or from its straightness warp&rsquo;d: no reck&rsquo;ning made</p>\n<p>What blood the sowing of it in the world</p>\n<p>Has cost; what favour for himself he wins,</p>\n<p>Who meekly clings to it. The aim of all</p>\n<p>Is how to shine: e&rsquo;en they, whose office is</p>\n<p>To preach the Gospel, let the gospel sleep,</p>\n<p>And pass their own inventions off instead.</p>\n<p>One tells, how at Christ&rsquo;s suffering the wan moon</p>\n<p>Bent back her steps, and shadow&rsquo;d o&rsquo;er the sun</p>\n<p>With intervenient disk, as she withdrew:</p>\n<p>Another, how the light shrouded itself</p>\n<p>Within its tabernacle, and left dark</p>\n<p>The Spaniard and the Indian, with the Jew.</p>\n<p>Such fables Florence in her pulpit hears,</p>\n<p>Bandied about more frequent, than the names</p>\n<p>Of Bindi and of Lapi in her streets.</p>\n<p>The sheep, meanwhile, poor witless ones, return</p>\n<p>From pasture, fed with wind: and what avails</p>\n<p>For their excuse, they do not see their harm?</p>\n<p>Christ said not to his first conventicle,</p>\n<p>&lsquo;Go forth and preach impostures to the world,&rsquo;</p>\n<p>But gave them truth to build on; and the sound</p>\n<p>Was mighty on their lips; nor needed they,</p>\n<p>Beside the gospel, other spear or shield,</p>\n<p>To aid them in their warfare for the faith.</p>\n<p>The preacher now provides himself with store</p>\n<p>Of jests and gibes; and, so there be no lack</p>\n<p>Of laughter, while he vents them, his big cowl</p>\n<p>Distends, and he has won the meed he sought:</p>\n<p>Could but the vulgar catch a glimpse the while</p>\n<p>Of that dark bird which nestles in his hood,</p>\n<p>They scarce would wait to hear the blessing said.</p>\n<p>Which now the dotards hold in such esteem,</p>\n<p>That every counterfeit, who spreads abroad</p>\n<p>The hands of holy promise, finds a throng</p>\n<p>Of credulous fools beneath. Saint Anthony</p>\n<p>Fattens with this his swine, and others worse</p>\n<p>Than swine, who diet at his lazy board,</p>\n<p>Paying with unstamp&rsquo;d metal for their fare.</p>\n<p class="slindent">&ldquo;But (for we far have wander&rsquo;d) let us seek</p>\n<p>The forward path again; so as the way</p>\n<p>Be shorten&rsquo;d with the time. No mortal tongue</p>\n<p>Nor thought of man hath ever reach&rsquo;d so far,</p>\n<p>That of these natures he might count the tribes.</p>\n<p>What Daniel of their thousands hath reveal&rsquo;d</p>\n<p>With finite number infinite conceals.</p>\n<p>The fountain at whose source these drink their beams,</p>\n<p>With light supplies them in as many modes,</p>\n<p>As there are splendours, that it shines on: each</p>\n<p>According to the virtue it conceives,</p>\n<p>Differing in love and sweet affection.</p>\n<p>Look then how lofty and how huge in breadth</p>\n<p>The&rsquo; eternal might, which, broken and dispers&rsquo;d</p>\n<p>Over such countless mirrors, yet remains</p>\n<p>Whole in itself and one, as at the first.&rdquo;</p>\n</div>','<p class="cantohead">Canto XXX</p>\n<div class="stanza"><p>Noon&rsquo;s fervid hour perchance six thousand miles</p>\n<p>From hence is distant; and the shadowy cone</p>\n<p>Almost to level on our earth declines;</p>\n<p>When from the midmost of this blue abyss</p>\n<p>By turns some star is to our vision lost.</p>\n<p>And straightway as the handmaid of the sun</p>\n<p>Puts forth her radiant brow, all, light by light,</p>\n<p>Fade, and the spangled firmament shuts in,</p>\n<p>E&rsquo;en to the loveliest of the glittering throng.</p>\n<p>Thus vanish&rsquo;d gradually from my sight</p>\n<p>The triumph, which plays ever round the point,</p>\n<p>That overcame me, seeming (for it did)</p>\n<p>Engirt by that it girdeth. Wherefore love,</p>\n<p>With loss of other object, forc&rsquo;d me bend</p>\n<p>Mine eyes on Beatrice once again.</p>\n<p class="slindent">If all, that hitherto is told of her,</p>\n<p>Were in one praise concluded, &rsquo;t were too weak</p>\n<p>To furnish out this turn. Mine eyes did look</p>\n<p>On beauty, such, as I believe in sooth,</p>\n<p>Not merely to exceed our human, but,</p>\n<p>That save its Maker, none can to the full</p>\n<p>Enjoy it. At this point o&rsquo;erpower&rsquo;d I fail,</p>\n<p>Unequal to my theme, as never bard</p>\n<p>Of buskin or of sock hath fail&rsquo;d before.</p>\n<p>For, as the sun doth to the feeblest sight,</p>\n<p>E&rsquo;en so remembrance of that witching smile</p>\n<p>Hath dispossess my spirit of itself.</p>\n<p>Not from that day, when on this earth I first</p>\n<p>Beheld her charms, up to that view of them,</p>\n<p>Have I with song applausive ever ceas&rsquo;d</p>\n<p>To follow, but not follow them no more;</p>\n<p>My course here bounded, as each artist&rsquo;s is,</p>\n<p>When it doth touch the limit of his skill.</p>\n<p class="slindent">She (such as I bequeath her to the bruit</p>\n<p>Of louder trump than mine, which hasteneth on,</p>\n<p>Urging its arduous matter to the close),</p>\n<p>Her words resum&rsquo;d, in gesture and in voice</p>\n<p>Resembling one accustom&rsquo;d to command:</p>\n<p>&ldquo;Forth from the last corporeal are we come</p>\n<p>Into the heav&rsquo;n, that is unbodied light,</p>\n<p>Light intellectual replete with love,</p>\n<p>Love of true happiness replete with joy,</p>\n<p>Joy, that transcends all sweetness of delight.</p>\n<p>Here shalt thou look on either mighty host</p>\n<p>Of Paradise; and one in that array,</p>\n<p>Which in the final judgment thou shalt see.&rdquo;</p>\n<p class="slindent">As when the lightning, in a sudden spleen</p>\n<p>Unfolded, dashes from the blinding eyes</p>\n<p>The visive spirits dazzled and bedimm&rsquo;d;</p>\n<p>So, round about me, fulminating streams</p>\n<p>Of living radiance play&rsquo;d, and left me swath&rsquo;d</p>\n<p>And veil&rsquo;d in dense impenetrable blaze.</p>\n<p>Such weal is in the love, that stills this heav&rsquo;n;</p>\n<p>For its own flame the torch this fitting ever!</p>\n<p class="slindent">No sooner to my list&rsquo;ning ear had come</p>\n<p>The brief assurance, than I understood</p>\n<p>New virtue into me infus&rsquo;d, and sight</p>\n<p>Kindled afresh, with vigour to sustain</p>\n<p>Excess of light, however pure. I look&rsquo;d;</p>\n<p>And in the likeness of a river saw</p>\n<p>Light flowing, from whose amber-seeming waves</p>\n<p>Flash&rsquo;d up effulgence, as they glided on</p>\n<p>&rsquo;Twixt banks, on either side, painted with spring,</p>\n<p>Incredible how fair; and, from the tide,</p>\n<p>There ever and anon, outstarting, flew</p>\n<p>Sparkles instinct with life; and in the flow&rsquo;rs</p>\n<p>Did set them, like to rubies chas&rsquo;d in gold;</p>\n<p>Then, as if drunk with odors, plung&rsquo;d again</p>\n<p>Into the wondrous flood; from which, as one</p>\n<p>Re&rsquo;enter&rsquo;d, still another rose. &ldquo;The thirst</p>\n<p>Of knowledge high, whereby thou art inflam&rsquo;d,</p>\n<p>To search the meaning of what here thou seest,</p>\n<p>The more it warms thee, pleases me the more.</p>\n<p>But first behooves thee of this water drink,</p>\n<p>Or ere that longing be allay&rsquo;d.&rdquo; So spake</p>\n<p>The day-star of mine eyes; then thus subjoin&rsquo;d:</p>\n<p>&ldquo;This stream, and these, forth issuing from its gulf,</p>\n<p>And diving back, a living topaz each,</p>\n<p>With all this laughter on its bloomy shores,</p>\n<p>Are but a preface, shadowy of the truth</p>\n<p>They emblem: not that, in themselves, the things</p>\n<p>Are crude; but on thy part is the defect,</p>\n<p>For that thy views not yet aspire so high.&rdquo;</p>\n<p>Never did babe, that had outslept his wont,</p>\n<p>Rush, with such eager straining, to the milk,</p>\n<p>As I toward the water, bending me,</p>\n<p>To make the better mirrors of mine eyes</p>\n<p>In the refining wave; and, as the eaves</p>\n<p>Of mine eyelids did drink of it, forthwith</p>\n<p>Seem&rsquo;d it unto me turn&rsquo;d from length to round,</p>\n<p>Then as a troop of maskers, when they put</p>\n<p>Their vizors off, look other than before,</p>\n<p>The counterfeited semblance thrown aside;</p>\n<p>So into greater jubilee were chang&rsquo;d</p>\n<p>Those flowers and sparkles, and distinct I saw</p>\n<p>Before me either court of heav&rsquo;n displac&rsquo;d.</p>\n<p class="slindent">O prime enlightener! thou who crav&rsquo;st me strength</p>\n<p>On the high triumph of thy realm to gaze!</p>\n<p>Grant virtue now to utter what I kenn&rsquo;d,</p>\n<p>\xA0\xA0\xA0\xA0There is in heav&rsquo;n a light, whose goodly shine</p>\n<p>Makes the Creator visible to all</p>\n<p>Created, that in seeing him alone</p>\n<p>Have peace; and in a circle spreads so far,</p>\n<p>That the circumference were too loose a zone</p>\n<p>To girdle in the sun. All is one beam,</p>\n<p>Reflected from the summit of the first,</p>\n<p>That moves, which being hence and vigour takes,</p>\n<p>And as some cliff, that from the bottom eyes</p>\n<p>Its image mirror&rsquo;d in the crystal flood,</p>\n<p>As if &rsquo;t admire its brave appareling</p>\n<p>Of verdure and of flowers: so, round about,</p>\n<p>Eyeing the light, on more than million thrones,</p>\n<p>Stood, eminent, whatever from our earth</p>\n<p>Has to the skies return&rsquo;d. How wide the leaves</p>\n<p>Extended to their utmost of this rose,</p>\n<p>Whose lowest step embosoms such a space</p>\n<p>Of ample radiance! Yet, nor amplitude</p>\n<p>Nor height impeded, but my view with ease</p>\n<p>Took in the full dimensions of that joy.</p>\n<p>Near or remote, what there avails, where God</p>\n<p>Immediate rules, and Nature, awed, suspends</p>\n<p>Her sway? Into the yellow of the rose</p>\n<p>Perennial, which in bright expansiveness,</p>\n<p>Lays forth its gradual blooming, redolent</p>\n<p>Of praises to the never-wint&rsquo;ring sun,</p>\n<p>As one, who fain would speak yet holds his peace,</p>\n<p>Beatrice led me; and, &ldquo;Behold,&rdquo; she said,</p>\n<p>&ldquo;This fair assemblage! stoles of snowy white</p>\n<p>How numberless! The city, where we dwell,</p>\n<p>Behold how vast! and these our seats so throng&rsquo;d</p>\n<p>Few now are wanting here! In that proud stall,</p>\n<p>On which, the crown, already o&rsquo;er its state</p>\n<p>Suspended, holds thine eyes&mdash;or ere thyself</p>\n<p>Mayst at the wedding sup,&mdash;shall rest the soul</p>\n<p>Of the great Harry, he who, by the world</p>\n<p>Augustas hail&rsquo;d, to Italy must come,</p>\n<p>Before her day be ripe. But ye are sick,</p>\n<p>And in your tetchy wantonness as blind,</p>\n<p>As is the bantling, that of hunger dies,</p>\n<p>And drives away the nurse. Nor may it be,</p>\n<p>That he, who in the sacred forum sways,</p>\n<p>Openly or in secret, shall with him</p>\n<p>Accordant walk: Whom God will not endure</p>\n<p>I&rsquo; th&rsquo; holy office long; but thrust him down</p>\n<p>To Simon Magus, where Magna&rsquo;s priest</p>\n<p>Will sink beneath him: such will be his meed.&rdquo;</p>\n</div>','<p class="cantohead">Canto XXXI</p>\n<div class="stanza"><p>In fashion, as a snow-white rose, lay then</p>\n<p>Before my view the saintly multitude,</p>\n<p>Which in his own blood Christ espous&rsquo;d. Meanwhile</p>\n<p>That other host, that soar aloft to gaze</p>\n<p>And celebrate his glory, whom they love,</p>\n<p>Hover&rsquo;d around; and, like a troop of bees,</p>\n<p>Amid the vernal sweets alighting now,</p>\n<p>Now, clustering, where their fragrant labour glows,</p>\n<p>Flew downward to the mighty flow&rsquo;r, or rose</p>\n<p>From the redundant petals, streaming back</p>\n<p>Unto the steadfast dwelling of their joy.</p>\n<p>Faces had they of flame, and wings of gold;</p>\n<p>The rest was whiter than the driven snow.</p>\n<p>And as they flitted down into the flower,</p>\n<p>From range to range, fanning their plumy loins,</p>\n<p>Whisper&rsquo;d the peace and ardour, which they won</p>\n<p>From that soft winnowing. Shadow none, the vast</p>\n<p>Interposition of such numerous flight</p>\n<p>Cast, from above, upon the flower, or view</p>\n<p>Obstructed aught. For, through the universe,</p>\n<p>Wherever merited, celestial light</p>\n<p>Glides freely, and no obstacle prevents.</p>\n<p class="slindent">All there, who reign in safety and in bliss,</p>\n<p>Ages long past or new, on one sole mark</p>\n<p>Their love and vision fix&rsquo;d. O trinal beam</p>\n<p>Of individual star, that charmst them thus,</p>\n<p>Vouchsafe one glance to gild our storm below!</p>\n<p class="slindent">If the grim brood, from Arctic shores that roam&rsquo;d,</p>\n<p>(Where helice, forever, as she wheels,</p>\n<p>Sparkles a mother&rsquo;s fondness on her son)</p>\n<p>Stood in mute wonder &rsquo;mid the works of Rome,</p>\n<p>When to their view the Lateran arose</p>\n<p>In greatness more than earthly; I, who then</p>\n<p>From human to divine had past, from time</p>\n<p>Unto eternity, and out of Florence</p>\n<p>To justice and to truth, how might I choose</p>\n<p>But marvel too? &rsquo;Twixt gladness and amaze,</p>\n<p>In sooth no will had I to utter aught,</p>\n<p>Or hear. And, as a pilgrim, when he rests</p>\n<p>Within the temple of his vow, looks round</p>\n<p>In breathless awe, and hopes some time to tell</p>\n<p>Of all its goodly state: e&rsquo;en so mine eyes</p>\n<p>Cours&rsquo;d up and down along the living light,</p>\n<p>Now low, and now aloft, and now around,</p>\n<p>Visiting every step. Looks I beheld,</p>\n<p>Where charity in soft persuasion sat,</p>\n<p>Smiles from within and radiance from above,</p>\n<p>And in each gesture grace and honour high.</p>\n<p class="slindent">So rov&rsquo;d my ken, and its general form</p>\n<p>All Paradise survey&rsquo;d: when round I turn&rsquo;d</p>\n<p>With purpose of my lady to inquire</p>\n<p>Once more of things, that held my thought suspense,</p>\n<p>But answer found from other than I ween&rsquo;d;</p>\n<p>For, Beatrice, when I thought to see,</p>\n<p>I saw instead a senior, at my side,</p>\n<p>\xA0Rob&rsquo;d, as the rest, in glory. Joy benign</p>\n<p>Glow&rsquo;d in his eye, and o&rsquo;er his cheek diffus&rsquo;d,</p>\n<p>With gestures such as spake a father&rsquo;s love.</p>\n<p>And, &ldquo;Whither is she vanish&rsquo;d?&rdquo; straight I ask&rsquo;d.</p>\n<p class="slindent">&ldquo;By Beatrice summon&rsquo;d,&rdquo; he replied,</p>\n<p>&ldquo;I come to aid thy wish. Looking aloft</p>\n<p>To the third circle from the highest, there</p>\n<p>Behold her on the throne, wherein her merit</p>\n<p>Hath plac&rsquo;d her.&rdquo; Answering not, mine eyes I rais&rsquo;d,</p>\n<p>And saw her, where aloof she sat, her brow</p>\n<p>A wreath reflecting of eternal beams.</p>\n<p>Not from the centre of the sea so far</p>\n<p>Unto the region of the highest thunder,</p>\n<p>As was my ken from hers; and yet the form</p>\n<p>Came through that medium down, unmix&rsquo;d and pure,</p>\n<p class="slindent">&ldquo;O Lady! thou in whom my hopes have rest!</p>\n<p>Who, for my safety, hast not scorn&rsquo;d, in hell</p>\n<p>To leave the traces of thy footsteps mark&rsquo;d!</p>\n<p>For all mine eyes have seen, I, to thy power</p>\n<p>And goodness, virtue owe and grace. Of slave,</p>\n<p>Thou hast to freedom brought me; and no means,</p>\n<p>For my deliverance apt, hast left untried.</p>\n<p>Thy liberal bounty still toward me keep.</p>\n<p>That, when my spirit, which thou madest whole,</p>\n<p>Is loosen&rsquo;d from this body, it may find</p>\n<p>Favour with thee.&rdquo; So I my suit preferr&rsquo;d:</p>\n<p>And she, so distant, as appear&rsquo;d, look&rsquo;d down,</p>\n<p>And smil&rsquo;d; then tow&rsquo;rds th&rsquo; eternal fountain turn&rsquo;d.</p>\n<p class="slindent">And thus the senior, holy and rever&rsquo;d:</p>\n<p>&ldquo;That thou at length mayst happily conclude</p>\n<p>Thy voyage (to which end I was dispatch&rsquo;d,</p>\n<p>By supplication mov&rsquo;d and holy love)</p>\n<p>Let thy upsoaring vision range, at large,</p>\n<p>This garden through: for so, by ray divine</p>\n<p>Kindled, thy ken a higher flight shall mount;</p>\n<p>And from heav&rsquo;n&rsquo;s queen, whom fervent I adore,</p>\n<p>All gracious aid befriend us; for that I</p>\n<p>Am her own faithful Bernard.&rdquo; Like a wight,</p>\n<p>Who haply from Croatia wends to see</p>\n<p>Our Veronica, and the while &rsquo;t is shown,</p>\n<p>Hangs over it with never-sated gaze,</p>\n<p>And, all that he hath heard revolving, saith</p>\n<p>Unto himself in thought: &ldquo;And didst thou look</p>\n<p>E&rsquo;en thus, O Jesus, my true Lord and God?</p>\n<p>And was this semblance thine?&rdquo; So gaz&rsquo;d I then</p>\n<p>Adoring; for the charity of him,</p>\n<p>Who musing, in the world that peace enjoy&rsquo;d,</p>\n<p>Stood lively before me. &ldquo;Child of grace!&rdquo;</p>\n<p>Thus he began: &ldquo;thou shalt not knowledge gain</p>\n<p>Of this glad being, if thine eyes are held</p>\n<p>Still in this depth below. But search around</p>\n<p>The circles, to the furthest, till thou spy</p>\n<p>Seated in state, the queen, that of this realm</p>\n<p>Is sovran.&rdquo; Straight mine eyes I rais&rsquo;d; and bright,</p>\n<p>As, at the birth of morn, the eastern clime</p>\n<p>Above th&rsquo; horizon, where the sun declines;</p>\n<p>To mine eyes, that upward, as from vale</p>\n<p>To mountain sped, at th&rsquo; extreme bound, a part</p>\n<p>Excell&rsquo;d in lustre all the front oppos&rsquo;d.</p>\n<p>And as the glow burns ruddiest o&rsquo;er the wave,</p>\n<p>That waits the sloping beam, which Phaeton</p>\n<p>Ill knew to guide, and on each part the light</p>\n<p>Diminish&rsquo;d fades, intensest in the midst;</p>\n<p>So burn&rsquo;d the peaceful oriflamb, and slack&rsquo;d</p>\n<p>On every side the living flame decay&rsquo;d.</p>\n<p>And in that midst their sportive pennons wav&rsquo;d</p>\n<p>Thousands of angels; in resplendence each</p>\n<p>Distinct, and quaint adornment. At their glee</p>\n<p>And carol, smil&rsquo;d the Lovely One of heav&rsquo;n,</p>\n<p>That joy was in the eyes of all the blest.</p>\n<p class="slindent">Had I a tongue in eloquence as rich,</p>\n<p>As is the colouring in fancy&rsquo;s loom,</p>\n<p>&rsquo;T were all too poor to utter the least part</p>\n<p>Of that enchantment. When he saw mine eyes</p>\n<p>Intent on her, that charm&rsquo;d him, Bernard gaz&rsquo;d</p>\n<p>With so exceeding fondness, as infus&rsquo;d</p>\n<p>Ardour into my breast, unfelt before.</p>\n</div>','<p class="cantohead">Canto XXXII</p>\n<div class="stanza"><p>Freely the sage, though wrapt in musings high,</p>\n<p>Assum&rsquo;d the teacher&rsquo;s part, and mild began:</p>\n<p>&ldquo;The wound, that Mary clos&rsquo;d, she open&rsquo;d first,</p>\n<p>Who sits so beautiful at Mary&rsquo;s feet.</p>\n<p>The third in order, underneath her, lo!</p>\n<p>Rachel with Beatrice. Sarah next,</p>\n<p>Judith, Rebecca, and the gleaner maid,</p>\n<p>Meek ancestress of him, who sang the songs</p>\n<p>Of sore repentance in his sorrowful mood.</p>\n<p>All, as I name them, down from deaf to leaf,</p>\n<p>Are in gradation throned on the rose.</p>\n<p>And from the seventh step, successively,</p>\n<p>Adown the breathing tresses of the flow&rsquo;r</p>\n<p>Still doth the file of Hebrew dames proceed.</p>\n<p>For these are a partition wall, whereby</p>\n<p>The sacred stairs are sever&rsquo;d, as the faith</p>\n<p>In Christ divides them. On this part, where blooms</p>\n<p>Each leaf in full maturity, are set</p>\n<p>Such as in Christ, or ere he came, believ&rsquo;d.</p>\n<p>On th&rsquo; other, where an intersected space</p>\n<p>Yet shows the semicircle void, abide</p>\n<p>All they, who look&rsquo;d to Christ already come.</p>\n<p>And as our Lady on her glorious stool,</p>\n<p>And they who on their stools beneath her sit,</p>\n<p>This way distinction make: e&rsquo;en so on his,</p>\n<p>The mighty Baptist that way marks the line</p>\n<p>(He who endur&rsquo;d the desert and the pains</p>\n<p>Of martyrdom, and for two years of hell,</p>\n<p>Yet still continued holy), and beneath,</p>\n<p>Augustin, Francis, Benedict, and the rest,</p>\n<p>Thus far from round to round. So heav&rsquo;n&rsquo;s decree</p>\n<p>Forecasts, this garden equally to fill.</p>\n<p>With faith in either view, past or to come,</p>\n<p>Learn too, that downward from the step, which cleaves</p>\n<p>Midway the twain compartments, none there are</p>\n<p>Who place obtain for merit of their own,</p>\n<p>But have through others&rsquo; merit been advanc&rsquo;d,</p>\n<p>On set conditions: spirits all releas&rsquo;d,</p>\n<p>Ere for themselves they had the power to choose.</p>\n<p>And, if thou mark and listen to them well,</p>\n<p>Their childish looks and voice declare as much.</p>\n<p class="slindent">&ldquo;Here, silent as thou art, I know thy doubt;</p>\n<p>And gladly will I loose the knot, wherein</p>\n<p>Thy subtle thoughts have bound thee. From this realm</p>\n<p>Excluded, chalice no entrance here may find,</p>\n<p>No more shall hunger, thirst, or sorrow can.</p>\n<p>A law immutable hath establish&rsquo;d all;</p>\n<p>Nor is there aught thou seest, that doth not fit,</p>\n<p>Exactly, as the finger to the ring.</p>\n<p>It is not therefore without cause, that these,</p>\n<p>O&rsquo;erspeedy comers to immortal life,</p>\n<p>Are different in their shares of excellence.</p>\n<p>Our Sovran Lord&mdash;that settleth this estate</p>\n<p>In love and in delight so absolute,</p>\n<p>That wish can dare no further&mdash;every soul,</p>\n<p>Created in his joyous sight to dwell,</p>\n<p>With grace at pleasure variously endows.</p>\n<p>And for a proof th&rsquo; effect may well suffice.</p>\n<p>And &rsquo;t is moreover most expressly mark&rsquo;d</p>\n<p>In holy scripture, where the twins are said</p>\n<p>To, have struggled in the womb. Therefore, as grace</p>\n<p>Inweaves the coronet, so every brow</p>\n<p>Weareth its proper hue of orient light.</p>\n<p>And merely in respect to his prime gift,</p>\n<p>Not in reward of meritorious deed,</p>\n<p>Hath each his several degree assign&rsquo;d.</p>\n<p>In early times with their own innocence</p>\n<p>More was not wanting, than the parents&rsquo; faith,</p>\n<p>To save them: those first ages past, behoov&rsquo;d</p>\n<p>That circumcision in the males should imp</p>\n<p>The flight of innocent wings: but since the day</p>\n<p>Of grace hath come, without baptismal rites</p>\n<p>In Christ accomplish&rsquo;d, innocence herself</p>\n<p>Must linger yet below. Now raise thy view</p>\n<p>Unto the visage most resembling Christ:</p>\n<p>For, in her splendour only, shalt thou win</p>\n<p>The pow&rsquo;r to look on him.&rdquo; Forthwith I saw</p>\n<p>Such floods of gladness on her visage shower&rsquo;d,</p>\n<p>From holy spirits, winging that profound;</p>\n<p>That, whatsoever I had yet beheld,</p>\n<p>Had not so much suspended me with wonder,</p>\n<p>Or shown me such similitude of God.</p>\n<p>And he, who had to her descended, once,</p>\n<p>On earth, now hail&rsquo;d in heav&rsquo;n; and on pois&rsquo;d wing.</p>\n<p>&ldquo;Ave, Maria, Gratia Plena,&rdquo; sang:</p>\n<p>To whose sweet anthem all the blissful court,</p>\n<p>From all parts answ&rsquo;ring, rang: that holier joy</p>\n<p>Brooded the deep serene. &ldquo;Father rever&rsquo;d:</p>\n<p>Who deign&rsquo;st, for me, to quit the pleasant place,</p>\n<p>Wherein thou sittest, by eternal lot!</p>\n<p>Say, who that angel is, that with such glee</p>\n<p>Beholds our queen, and so enamour&rsquo;d glows</p>\n<p>Of her high beauty, that all fire he seems.&rdquo;</p>\n<p>So I again resorted to the lore</p>\n<p>Of my wise teacher, he, whom Mary&rsquo;s charms</p>\n<p>Embellish&rsquo;d, as the sun the morning star;</p>\n<p>Who thus in answer spake: &ldquo;In him are summ&rsquo;d,</p>\n<p>Whatever of buxomness and free delight</p>\n<p>May be in Spirit, or in angel, met:</p>\n<p>And so beseems: for that he bare the palm</p>\n<p>Down unto Mary, when the Son of God</p>\n<p>Vouchsaf&rsquo;d to clothe him in terrestrial weeds.</p>\n<p>Now let thine eyes wait heedful on my words,</p>\n<p>And note thou of this just and pious realm</p>\n<p>The chiefest nobles. Those, highest in bliss,</p>\n<p>The twain, on each hand next our empress thron&rsquo;d,</p>\n<p>Are as it were two roots unto this rose.</p>\n<p>He to the left, the parent, whose rash taste</p>\n<p>Proves bitter to his seed; and, on the right,</p>\n<p>That ancient father of the holy church,</p>\n<p>Into whose keeping Christ did give the keys</p>\n<p>Of this sweet flow&rsquo;r: near whom behold the seer,</p>\n<p>That, ere he died, saw all the grievous times</p>\n<p>Of the fair bride, who with the lance and nails</p>\n<p>Was won. And, near unto the other, rests</p>\n<p>The leader, under whom on manna fed</p>\n<p>Th&rsquo; ungrateful nation, fickle and perverse.</p>\n<p>On th&rsquo; other part, facing to Peter, lo!</p>\n<p>Where Anna sits, so well content to look</p>\n<p>On her lov&rsquo;d daughter, that with moveless eye</p>\n<p>She chants the loud hosanna: while, oppos&rsquo;d</p>\n<p>To the first father of your mortal kind,</p>\n<p>Is Lucia, at whose hest thy lady sped,</p>\n<p>When on the edge of ruin clos&rsquo;d thine eye.</p>\n<p class="slindent">&ldquo;But (for the vision hasteneth so an end)</p>\n<p>Here break we off, as the good workman doth,</p>\n<p>That shapes the cloak according to the cloth:</p>\n<p>And to the primal love our ken shall rise;</p>\n<p>That thou mayst penetrate the brightness, far</p>\n<p>As sight can bear thee. Yet, alas! in sooth</p>\n<p>Beating thy pennons, thinking to advance,</p>\n<p>Thou backward fall&rsquo;st. Grace then must first be gain&rsquo;d;</p>\n<p>Her grace, whose might can help thee. Thou in prayer</p>\n<p>Seek her: and, with affection, whilst I sue,</p>\n<p>Attend, and yield me all thy heart.&rdquo; He said,</p>\n<p>And thus the saintly orison began.</p>\n</div>','<p class="cantohead">Canto XXXIII</p>\n<div class="stanza"><p>&ldquo;O virgin mother, daughter of thy Son,</p>\n<p>Created beings all in lowliness</p>\n<p>Surpassing, as in height, above them all,</p>\n<p>Term by th&rsquo; eternal counsel pre-ordain&rsquo;d,</p>\n<p>Ennobler of thy nature, so advanc&rsquo;d</p>\n<p>In thee, that its great Maker did not scorn,</p>\n<p>Himself, in his own work enclos&rsquo;d to dwell!</p>\n<p>For in thy womb rekindling shone the love</p>\n<p>Reveal&rsquo;d, whose genial influence makes now</p>\n<p>This flower to germin in eternal peace!</p>\n<p>Here thou to us, of charity and love,</p>\n<p>Art, as the noon-day torch: and art, beneath,</p>\n<p>To mortal men, of hope a living spring.</p>\n<p>So mighty art thou, lady! and so great,</p>\n<p>That he who grace desireth, and comes not</p>\n<p>To thee for aidance, fain would have desire</p>\n<p>Fly without wings. Nor only him who asks,</p>\n<p>Thy bounty succours, but doth freely oft</p>\n<p>Forerun the asking. Whatsoe&rsquo;er may be</p>\n<p>Of excellence in creature, pity mild,</p>\n<p>Relenting mercy, large munificence,</p>\n<p>Are all combin&rsquo;d in thee. Here kneeleth one,</p>\n<p>Who of all spirits hath review&rsquo;d the state,</p>\n<p>From the world&rsquo;s lowest gap unto this height.</p>\n<p>Suppliant to thee he kneels, imploring grace</p>\n<p>For virtue, yet more high to lift his ken</p>\n<p>Toward the bliss supreme. And I, who ne&rsquo;er</p>\n<p>Coveted sight, more fondly, for myself,</p>\n<p>Than now for him, my prayers to thee prefer,</p>\n<p>(And pray they be not scant) that thou wouldst drive</p>\n<p>Each cloud of his mortality away;</p>\n<p>That on the sovran pleasure he may gaze.</p>\n<p>This also I entreat of thee, O queen!</p>\n<p>Who canst do what thou wilt! that in him thou</p>\n<p>Wouldst after all he hath beheld, preserve</p>\n<p>Affection sound, and human passions quell.</p>\n<p>Lo! Where, with Beatrice, many a saint</p>\n<p>Stretch their clasp&rsquo;d hands, in furtherance of my suit!&rdquo;</p>\n<p class="slindent">The eyes, that heav&rsquo;n with love and awe regards,</p>\n<p>Fix&rsquo;d on the suitor, witness&rsquo;d, how benign</p>\n<p>She looks on pious pray&rsquo;rs: then fasten&rsquo;d they</p>\n<p>On th&rsquo; everlasting light, wherein no eye</p>\n<p>Of creature, as may well be thought, so far</p>\n<p>Can travel inward. I, meanwhile, who drew</p>\n<p>Near to the limit, where all wishes end,</p>\n<p>The ardour of my wish (for so behooved),</p>\n<p>Ended within me. Beck&rsquo;ning smil&rsquo;d the sage,</p>\n<p>That I should look aloft: but, ere he bade,</p>\n<p>Already of myself aloft I look&rsquo;d;</p>\n<p>For visual strength, refining more and more,</p>\n<p>Bare me into the ray authentical</p>\n<p>Of sovran light. Thenceforward, what I saw,</p>\n<p>Was not for words to speak, nor memory&rsquo;s self</p>\n<p>To stand against such outrage on her skill.</p>\n<p>As one, who from a dream awaken&rsquo;d, straight,</p>\n<p>All he hath seen forgets; yet still retains</p>\n<p>Impression of the feeling in his dream;</p>\n<p>E&rsquo;en such am I: for all the vision dies,</p>\n<p>As &rsquo;t were, away; and yet the sense of sweet,</p>\n<p>That sprang from it, still trickles in my heart.</p>\n<p>Thus in the sun-thaw is the snow unseal&rsquo;d;</p>\n<p>Thus in the winds on flitting leaves was lost</p>\n<p>The Sybil&rsquo;s sentence. O eternal beam!</p>\n<p>(Whose height what reach of mortal thought may soar?)</p>\n<p>Yield me again some little particle</p>\n<p>Of what thou then appearedst, give my tongue</p>\n<p>Power, but to leave one sparkle of thy glory,</p>\n<p>Unto the race to come, that shall not lose</p>\n<p>Thy triumph wholly, if thou waken aught</p>\n<p>Of memory in me, and endure to hear</p>\n<p>The record sound in this unequal strain.</p>\n<p class="slindent">Such keenness from the living ray I met,</p>\n<p>That, if mine eyes had turn&rsquo;d away, methinks,</p>\n<p>I had been lost; but, so embolden&rsquo;d, on</p>\n<p>I pass&rsquo;d, as I remember, till my view</p>\n<p>Hover&rsquo;d the brink of dread infinitude.</p>\n<p class="slindent">O grace! unenvying of thy boon! that gav&rsquo;st</p>\n<p>Boldness to fix so earnestly my ken</p>\n<p>On th&rsquo; everlasting splendour, that I look&rsquo;d,</p>\n<p>While sight was unconsum&rsquo;d, and, in that depth,</p>\n<p>Saw in one volume clasp&rsquo;d of love, whatever</p>\n<p>The universe unfolds; all properties</p>\n<p>Of substance and of accident, beheld,</p>\n<p>Compounded, yet one individual light</p>\n<p>The whole. And of such bond methinks I saw</p>\n<p>The universal form: for that whenever</p>\n<p>I do but speak of it, my soul dilates</p>\n<p>Beyond her proper self; and, till I speak,</p>\n<p>One moment seems a longer lethargy,</p>\n<p>Than five-and-twenty ages had appear&rsquo;d</p>\n<p>To that emprize, that first made Neptune wonder</p>\n<p>At Argo&rsquo;s shadow darkening on his flood.</p>\n<p class="slindent">With fixed heed, suspense and motionless,</p>\n<p>Wond&rsquo;ring I gaz&rsquo;d; and admiration still</p>\n<p>Was kindled, as I gaz&rsquo;d. It may not be,</p>\n<p>That one, who looks upon that light, can turn</p>\n<p>To other object, willingly, his view.</p>\n<p>For all the good, that will may covet, there</p>\n<p>Is summ&rsquo;d; and all, elsewhere defective found,</p>\n<p>Complete. My tongue shall utter now, no more</p>\n<p>E&rsquo;en what remembrance keeps, than could the babe&rsquo;s</p>\n<p>That yet is moisten&rsquo;d at his mother&rsquo;s breast.</p>\n<p>Not that the semblance of the living light</p>\n<p>Was chang&rsquo;d (that ever as at first remain&rsquo;d)</p>\n<p>But that my vision quickening, in that sole</p>\n<p>Appearance, still new miracles descry&rsquo;d,</p>\n<p>And toil&rsquo;d me with the change. In that abyss</p>\n<p>Of radiance, clear and lofty, seem&rsquo;d methought,</p>\n<p>Three orbs of triple hue clipt in one bound:</p>\n<p>And, from another, one reflected seem&rsquo;d,</p>\n<p>As rainbow is from rainbow: and the third</p>\n<p>Seem&rsquo;d fire, breath&rsquo;d equally from both. Oh speech</p>\n<p>How feeble and how faint art thou, to give</p>\n<p>Conception birth! Yet this to what I saw</p>\n<p>Is less than little. Oh eternal light!</p>\n<p>Sole in thyself that dwellst; and of thyself</p>\n<p>Sole understood, past, present, or to come!</p>\n<p>Thou smiledst; on that circling, which in thee</p>\n<p>Seem&rsquo;d as reflected splendour, while I mus&rsquo;d;</p>\n<p>For I therein, methought, in its own hue</p>\n<p>Beheld our image painted: steadfastly</p>\n<p>I therefore por&rsquo;d upon the view. As one</p>\n<p>Who vers&rsquo;d in geometric lore, would fain</p>\n<p>Measure the circle; and, though pondering long</p>\n<p>And deeply, that beginning, which he needs,</p>\n<p>Finds not; e&rsquo;en such was I, intent to scan</p>\n<p>The novel wonder, and trace out the form,</p>\n<p>How to the circle fitted, and therein</p>\n<p>How plac&rsquo;d: but the flight was not for my wing;</p>\n<p>Had not a flash darted athwart my mind,</p>\n<p>And in the spleen unfolded what it sought.</p>\n<p class="slindent">Here vigour fail&rsquo;d the tow&rsquo;ring fantasy:</p>\n<p>But yet the will roll&rsquo;d onward, like a wheel</p>\n<p>In even motion, by the Love impell&rsquo;d,</p>\n<p>That moves the sun in heav&rsquo;n and all the stars.</p>\n</div>']};

},{}],10:[function(require,module,exports){
// paradiso/italian.js
"use strict";module.exports={bookname:'paradiso',author:'Dante Alighieri',translationid:"dante",title:'Paradiso',translation:false,source:'<a href="http://www.gutenberg.org/ebooks/1011">Project Gutenberg</a>',translationshortname:"Dante",translationfullname:"Dante Alighieri",translationclass:"poetry",text:['<p class="title">Paradiso</p>\n\t<p class="author">Dante Alighieri</p>','<p class="cantohead">Canto I</p>\n\n<div class="stanza"><p>La gloria di colui che tutto move</p>\n<p>per l&rsquo;universo penetra, e risplende</p>\n<p>in una parte pi&ugrave; e meno altrove.</p></div>\n\n<div class="stanza"><p>Nel ciel che pi&ugrave; de la sua luce prende</p>\n<p>fu&rsquo; io, e vidi cose che ridire</p>\n<p>n&eacute; sa n&eacute; pu&ograve; chi di l&agrave; s&ugrave; discende;</p></div>\n\n<div class="stanza"><p>perch&eacute; appressando s&eacute; al suo disire,</p>\n<p>nostro intelletto si profonda tanto,</p>\n<p>che dietro la memoria non pu&ograve; ire.</p></div>\n\n<div class="stanza"><p>Veramente quant&rsquo; io del regno santo</p>\n<p>ne la mia mente potei far tesoro,</p>\n<p>sar&agrave; ora materia del mio canto.</p></div>\n\n<div class="stanza"><p>O buono Appollo, a l&rsquo;ultimo lavoro</p>\n<p>fammi del tuo valor s&igrave; fatto vaso,</p>\n<p>come dimandi a dar l&rsquo;amato alloro.</p></div>\n\n<div class="stanza"><p>Infino a qui l&rsquo;un giogo di Parnaso</p>\n<p>assai mi fu; ma or con amendue</p>\n<p>m&rsquo;&egrave; uopo intrar ne l&rsquo;aringo rimaso.</p></div>\n\n<div class="stanza"><p>Entra nel petto mio, e spira tue</p>\n<p>s&igrave; come quando Mars&iuml;a traesti</p>\n<p>de la vagina de le membra sue.</p></div>\n\n<div class="stanza"><p>O divina virt&ugrave;, se mi ti presti</p>\n<p>tanto che l&rsquo;ombra del beato regno</p>\n<p>segnata nel mio capo io manifesti,</p></div>\n\n<div class="stanza"><p>vedra&rsquo;mi al pi&egrave; del tuo diletto legno</p>\n<p>venire, e coronarmi de le foglie</p>\n<p>che la materia e tu mi farai degno.</p></div>\n\n<div class="stanza"><p>S&igrave; rade volte, padre, se ne coglie</p>\n<p>per tr&iuml;unfare o cesare o poeta,</p>\n<p>colpa e vergogna de l&rsquo;umane voglie,</p></div>\n\n<div class="stanza"><p>che parturir letizia in su la lieta</p>\n<p>delfica de&iuml;t&agrave; dovria la fronda</p>\n<p>peneia, quando alcun di s&eacute; asseta.</p></div>\n\n<div class="stanza"><p>Poca favilla gran fiamma seconda:</p>\n<p>forse di retro a me con miglior voci</p>\n<p>si pregher&agrave; perch&eacute; Cirra risponda.</p></div>\n\n<div class="stanza"><p>Surge ai mortali per diverse foci</p>\n<p>la lucerna del mondo; ma da quella</p>\n<p>che quattro cerchi giugne con tre croci,</p></div>\n\n<div class="stanza"><p>con miglior corso e con migliore stella</p>\n<p>esce congiunta, e la mondana cera</p>\n<p>pi&ugrave; a suo modo tempera e suggella.</p></div>\n\n<div class="stanza"><p>Fatto avea di l&agrave; mane e di qua sera</p>\n<p>tal foce, e quasi tutto era l&agrave; bianco</p>\n<p>quello emisperio, e l&rsquo;altra parte nera,</p></div>\n\n<div class="stanza"><p>quando Beatrice in sul sinistro fianco</p>\n<p>vidi rivolta e riguardar nel sole:</p>\n<p>aguglia s&igrave; non li s&rsquo;affisse unquanco.</p></div>\n\n<div class="stanza"><p>E s&igrave; come secondo raggio suole</p>\n<p>uscir del primo e risalire in suso,</p>\n<p>pur come pelegrin che tornar vuole,</p></div>\n\n<div class="stanza"><p>cos&igrave; de l&rsquo;atto suo, per li occhi infuso</p>\n<p>ne l&rsquo;imagine mia, il mio si fece,</p>\n<p>e fissi li occhi al sole oltre nostr&rsquo; uso.</p></div>\n\n<div class="stanza"><p>Molto &egrave; licito l&agrave;, che qui non lece</p>\n<p>a le nostre virt&ugrave;, merc&eacute; del loco</p>\n<p>fatto per proprio de l&rsquo;umana spece.</p></div>\n\n<div class="stanza"><p>Io nol soffersi molto, n&eacute; s&igrave; poco,</p>\n<p>ch&rsquo;io nol vedessi sfavillar dintorno,</p>\n<p>com&rsquo; ferro che bogliente esce del foco;</p></div>\n\n<div class="stanza"><p>e di s&ugrave;bito parve giorno a giorno</p>\n<p>essere aggiunto, come quei che puote</p>\n<p>avesse il ciel d&rsquo;un altro sole addorno.</p></div>\n\n<div class="stanza"><p>Beatrice tutta ne l&rsquo;etterne rote</p>\n<p>fissa con li occhi stava; e io in lei</p>\n<p>le luci fissi, di l&agrave; s&ugrave; rimote.</p></div>\n\n<div class="stanza"><p>Nel suo aspetto tal dentro mi fei,</p>\n<p>qual si f&eacute; Glauco nel gustar de l&rsquo;erba</p>\n<p>che &rsquo;l f&eacute; consorto in mar de li altri d&egrave;i.</p></div>\n\n<div class="stanza"><p>Trasumanar significar per verba</p>\n<p>non si poria; per&ograve; l&rsquo;essemplo basti</p>\n<p>a cui esper&iuml;enza grazia serba.</p></div>\n\n<div class="stanza"><p>S&rsquo;i&rsquo; era sol di me quel che creasti</p>\n<p>novellamente, amor che &rsquo;l ciel governi,</p>\n<p>tu &rsquo;l sai, che col tuo lume mi levasti.</p></div>\n\n<div class="stanza"><p>Quando la rota che tu sempiterni</p>\n<p>desiderato, a s&eacute; mi fece atteso</p>\n<p>con l&rsquo;armonia che temperi e discerni,</p></div>\n\n<div class="stanza"><p>parvemi tanto allor del cielo acceso</p>\n<p>de la fiamma del sol, che pioggia o fiume</p>\n<p>lago non fece alcun tanto disteso.</p></div>\n\n<div class="stanza"><p>La novit&agrave; del suono e &rsquo;l grande lume</p>\n<p>di lor cagion m&rsquo;accesero un disio</p>\n<p>mai non sentito di cotanto acume.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; ella, che vedea me s&igrave; com&rsquo; io,</p>\n<p>a qu&iuml;etarmi l&rsquo;animo commosso,</p>\n<p>pria ch&rsquo;io a dimandar, la bocca aprio</p></div>\n\n<div class="stanza"><p>e cominci&ograve;: &laquo;Tu stesso ti fai grosso</p>\n<p>col falso imaginar, s&igrave; che non vedi</p>\n<p>ci&ograve; che vedresti se l&rsquo;avessi scosso.</p></div>\n\n<div class="stanza"><p>Tu non se&rsquo; in terra, s&igrave; come tu credi;</p>\n<p>ma folgore, fuggendo il proprio sito,</p>\n<p>non corse come tu ch&rsquo;ad esso riedi&raquo;.</p></div>\n\n<div class="stanza"><p>S&rsquo;io fui del primo dubbio disvestito</p>\n<p>per le sorrise parolette brevi,</p>\n<p>dentro ad un nuovo pi&ugrave; fu&rsquo; inretito</p></div>\n\n<div class="stanza"><p>e dissi: &laquo;Gi&agrave; contento requ&iuml;evi</p>\n<p>di grande ammirazion; ma ora ammiro</p>\n<p>com&rsquo; io trascenda questi corpi levi&raquo;.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; ella, appresso d&rsquo;un p&iuml;o sospiro,</p>\n<p>li occhi drizz&ograve; ver&rsquo; me con quel sembiante</p>\n<p>che madre fa sovra figlio deliro,</p></div>\n\n<div class="stanza"><p>e cominci&ograve;: &laquo;Le cose tutte quante</p>\n<p>hanno ordine tra loro, e questo &egrave; forma</p>\n<p>che l&rsquo;universo a Dio fa simigliante.</p></div>\n\n<div class="stanza"><p>Qui veggion l&rsquo;alte creature l&rsquo;orma</p>\n<p>de l&rsquo;etterno valore, il qual &egrave; fine</p>\n<p>al quale &egrave; fatta la toccata norma.</p></div>\n\n<div class="stanza"><p>Ne l&rsquo;ordine ch&rsquo;io dico sono accline</p>\n<p>tutte nature, per diverse sorti,</p>\n<p>pi&ugrave; al principio loro e men vicine;</p></div>\n\n<div class="stanza"><p>onde si muovono a diversi porti</p>\n<p>per lo gran mar de l&rsquo;essere, e ciascuna</p>\n<p>con istinto a lei dato che la porti.</p></div>\n\n<div class="stanza"><p>Questi ne porta il foco inver&rsquo; la luna;</p>\n<p>questi ne&rsquo; cor mortali &egrave; permotore;</p>\n<p>questi la terra in s&eacute; stringe e aduna;</p></div>\n\n<div class="stanza"><p>n&eacute; pur le creature che son fore</p>\n<p>d&rsquo;intelligenza quest&rsquo; arco saetta,</p>\n<p>ma quelle c&rsquo;hanno intelletto e amore.</p></div>\n\n<div class="stanza"><p>La provedenza, che cotanto assetta,</p>\n<p>del suo lume fa &rsquo;l ciel sempre qu&iuml;eto</p>\n<p>nel qual si volge quel c&rsquo;ha maggior fretta;</p></div>\n\n<div class="stanza"><p>e ora l&igrave;, come a sito decreto,</p>\n<p>cen porta la virt&ugrave; di quella corda</p>\n<p>che ci&ograve; che scocca drizza in segno lieto.</p></div>\n\n<div class="stanza"><p>Vero &egrave; che, come forma non s&rsquo;accorda</p>\n<p>molte f&iuml;ate a l&rsquo;intenzion de l&rsquo;arte,</p>\n<p>perch&rsquo; a risponder la materia &egrave; sorda,</p></div>\n\n<div class="stanza"><p>cos&igrave; da questo corso si diparte</p>\n<p>talor la creatura, c&rsquo;ha podere</p>\n<p>di piegar, cos&igrave; pinta, in altra parte;</p></div>\n\n<div class="stanza"><p>e s&igrave; come veder si pu&ograve; cadere</p>\n<p>foco di nube, s&igrave; l&rsquo;impeto primo</p>\n<p>l&rsquo;atterra torto da falso piacere.</p></div>\n\n<div class="stanza"><p>Non dei pi&ugrave; ammirar, se bene stimo,</p>\n<p>lo tuo salir, se non come d&rsquo;un rivo</p>\n<p>se d&rsquo;alto monte scende giuso ad imo.</p></div>\n\n<div class="stanza"><p>Maraviglia sarebbe in te se, privo</p>\n<p>d&rsquo;impedimento, gi&ugrave; ti fossi assiso,</p>\n<p>com&rsquo; a terra qu&iuml;ete in foco vivo&raquo;.</p></div>\n\n<div class="stanza"><p>Quinci rivolse inver&rsquo; lo cielo il viso.</p></div>','<p class="cantohead">Canto II</p>\n\n<div class="stanza"><p>O voi che siete in piccioletta barca,</p>\n<p>desiderosi d&rsquo;ascoltar, seguiti</p>\n<p>dietro al mio legno che cantando varca,</p></div>\n\n<div class="stanza"><p>tornate a riveder li vostri liti:</p>\n<p>non vi mettete in pelago, ch&eacute; forse,</p>\n<p>perdendo me, rimarreste smarriti.</p></div>\n\n<div class="stanza"><p>L&rsquo;acqua ch&rsquo;io prendo gi&agrave; mai non si corse;</p>\n<p>Minerva spira, e conducemi Appollo,</p>\n<p>e nove Muse mi dimostran l&rsquo;Orse.</p></div>\n\n<div class="stanza"><p>Voialtri pochi che drizzaste il collo</p>\n<p>per tempo al pan de li angeli, del quale</p>\n<p>vivesi qui ma non sen vien satollo,</p></div>\n\n<div class="stanza"><p>metter potete ben per l&rsquo;alto sale</p>\n<p>vostro navigio, servando mio solco</p>\n<p>dinanzi a l&rsquo;acqua che ritorna equale.</p></div>\n\n<div class="stanza"><p>Que&rsquo; glor&iuml;osi che passaro al Colco</p>\n<p>non s&rsquo;ammiraron come voi farete,</p>\n<p>quando Ias&oacute;n vider fatto bifolco.</p></div>\n\n<div class="stanza"><p>La concreata e perpet&uuml;a sete</p>\n<p>del de&iuml;forme regno cen portava</p>\n<p>veloci quasi come &rsquo;l ciel vedete.</p></div>\n\n<div class="stanza"><p>Beatrice in suso, e io in lei guardava;</p>\n<p>e forse in tanto in quanto un quadrel posa</p>\n<p>e vola e da la noce si dischiava,</p></div>\n\n<div class="stanza"><p>giunto mi vidi ove mirabil cosa</p>\n<p>mi torse il viso a s&eacute;; e per&ograve; quella</p>\n<p>cui non potea mia cura essere ascosa,</p></div>\n\n<div class="stanza"><p>volta ver&rsquo; me, s&igrave; lieta come bella,</p>\n<p>&laquo;Drizza la mente in Dio grata&raquo;, mi disse,</p>\n<p>&laquo;che n&rsquo;ha congiunti con la prima stella&raquo;.</p></div>\n\n<div class="stanza"><p>Parev&rsquo; a me che nube ne coprisse</p>\n<p>lucida, spessa, solida e pulita,</p>\n<p>quasi adamante che lo sol ferisse.</p></div>\n\n<div class="stanza"><p>Per entro s&eacute; l&rsquo;etterna margarita</p>\n<p>ne ricevette, com&rsquo; acqua recepe</p>\n<p>raggio di luce permanendo unita.</p></div>\n\n<div class="stanza"><p>S&rsquo;io era corpo, e qui non si concepe</p>\n<p>com&rsquo; una dimensione altra patio,</p>\n<p>ch&rsquo;esser convien se corpo in corpo repe,</p></div>\n\n<div class="stanza"><p>accender ne dovria pi&ugrave; il disio</p>\n<p>di veder quella essenza in che si vede</p>\n<p>come nostra natura e Dio s&rsquo;unio.</p></div>\n\n<div class="stanza"><p>L&igrave; si vedr&agrave; ci&ograve; che tenem per fede,</p>\n<p>non dimostrato, ma fia per s&eacute; noto</p>\n<p>a guisa del ver primo che l&rsquo;uom crede.</p></div>\n\n<div class="stanza"><p>Io rispuosi: &laquo;Madonna, s&igrave; devoto</p>\n<p>com&rsquo; esser posso pi&ugrave;, ringrazio lui</p>\n<p>lo qual dal mortal mondo m&rsquo;ha remoto.</p></div>\n\n<div class="stanza"><p>Ma ditemi: che son li segni bui</p>\n<p>di questo corpo, che l&agrave; giuso in terra</p>\n<p>fan di Cain favoleggiare altrui?&raquo;.</p></div>\n\n<div class="stanza"><p>Ella sorrise alquanto, e poi &laquo;S&rsquo;elli erra</p>\n<p>l&rsquo;oppin&iuml;on&raquo;, mi disse, &laquo;d&rsquo;i mortali</p>\n<p>dove chiave di senso non diserra,</p></div>\n\n<div class="stanza"><p>certo non ti dovrien punger li strali</p>\n<p>d&rsquo;ammirazione omai, poi dietro ai sensi</p>\n<p>vedi che la ragione ha corte l&rsquo;ali.</p></div>\n\n<div class="stanza"><p>Ma dimmi quel che tu da te ne pensi&raquo;.</p>\n<p>E io: &laquo;Ci&ograve; che n&rsquo;appar qua s&ugrave; diverso</p>\n<p>credo che fanno i corpi rari e densi&raquo;.</p></div>\n\n<div class="stanza"><p>Ed ella: &laquo;Certo assai vedrai sommerso</p>\n<p>nel falso il creder tuo, se bene ascolti</p>\n<p>l&rsquo;argomentar ch&rsquo;io li far&ograve; avverso.</p></div>\n\n<div class="stanza"><p>La spera ottava vi dimostra molti</p>\n<p>lumi, li quali e nel quale e nel quanto</p>\n<p>notar si posson di diversi volti.</p></div>\n\n<div class="stanza"><p>Se raro e denso ci&ograve; facesser tanto,</p>\n<p>una sola virt&ugrave; sarebbe in tutti,</p>\n<p>pi&ugrave; e men distributa e altrettanto.</p></div>\n\n<div class="stanza"><p>Virt&ugrave; diverse esser convegnon frutti</p>\n<p>di princ&igrave;pi formali, e quei, for ch&rsquo;uno,</p>\n<p>seguiterieno a tua ragion distrutti.</p></div>\n\n<div class="stanza"><p>Ancor, se raro fosse di quel bruno</p>\n<p>cagion che tu dimandi, o d&rsquo;oltre in parte</p>\n<p>fora di sua materia s&igrave; digiuno</p></div>\n\n<div class="stanza"><p>esto pianeto, o, s&igrave; come comparte</p>\n<p>lo grasso e &rsquo;l magro un corpo, cos&igrave; questo</p>\n<p>nel suo volume cangerebbe carte.</p></div>\n\n<div class="stanza"><p>Se &rsquo;l primo fosse, fora manifesto</p>\n<p>ne l&rsquo;eclissi del sol, per trasparere</p>\n<p>lo lume come in altro raro ingesto.</p></div>\n\n<div class="stanza"><p>Questo non &egrave;: per&ograve; &egrave; da vedere</p>\n<p>de l&rsquo;altro; e s&rsquo;elli avvien ch&rsquo;io l&rsquo;altro cassi,</p>\n<p>falsificato fia lo tuo parere.</p></div>\n\n<div class="stanza"><p>S&rsquo;elli &egrave; che questo raro non trapassi,</p>\n<p>esser conviene un termine da onde</p>\n<p>lo suo contrario pi&ugrave; passar non lassi;</p></div>\n\n<div class="stanza"><p>e indi l&rsquo;altrui raggio si rifonde</p>\n<p>cos&igrave; come color torna per vetro</p>\n<p>lo qual di retro a s&eacute; piombo nasconde.</p></div>\n\n<div class="stanza"><p>Or dirai tu ch&rsquo;el si dimostra tetro</p>\n<p>ivi lo raggio pi&ugrave; che in altre parti,</p>\n<p>per esser l&igrave; refratto pi&ugrave; a retro.</p></div>\n\n<div class="stanza"><p>Da questa instanza pu&ograve; deliberarti</p>\n<p>esper&iuml;enza, se gi&agrave; mai la provi,</p>\n<p>ch&rsquo;esser suol fonte ai rivi di vostr&rsquo; arti.</p></div>\n\n<div class="stanza"><p>Tre specchi prenderai; e i due rimovi</p>\n<p>da te d&rsquo;un modo, e l&rsquo;altro, pi&ugrave; rimosso,</p>\n<p>tr&rsquo;ambo li primi li occhi tuoi ritrovi.</p></div>\n\n<div class="stanza"><p>Rivolto ad essi, fa che dopo il dosso</p>\n<p>ti stea un lume che i tre specchi accenda</p>\n<p>e torni a te da tutti ripercosso.</p></div>\n\n<div class="stanza"><p>Ben che nel quanto tanto non si stenda</p>\n<p>la vista pi&ugrave; lontana, l&igrave; vedrai</p>\n<p>come convien ch&rsquo;igualmente risplenda.</p></div>\n\n<div class="stanza"><p>Or, come ai colpi de li caldi rai</p>\n<p>de la neve riman nudo il suggetto</p>\n<p>e dal colore e dal freddo primai,</p></div>\n\n<div class="stanza"><p>cos&igrave; rimaso te ne l&rsquo;intelletto</p>\n<p>voglio informar di luce s&igrave; vivace,</p>\n<p>che ti tremoler&agrave; nel suo aspetto.</p></div>\n\n<div class="stanza"><p>Dentro dal ciel de la divina pace</p>\n<p>si gira un corpo ne la cui virtute</p>\n<p>l&rsquo;esser di tutto suo contento giace.</p></div>\n\n<div class="stanza"><p>Lo ciel seguente, c&rsquo;ha tante vedute,</p>\n<p>quell&rsquo; esser parte per diverse essenze,</p>\n<p>da lui distratte e da lui contenute.</p></div>\n\n<div class="stanza"><p>Li altri giron per varie differenze</p>\n<p>le distinzion che dentro da s&eacute; hanno</p>\n<p>dispongono a lor fini e lor semenze.</p></div>\n\n<div class="stanza"><p>Questi organi del mondo cos&igrave; vanno,</p>\n<p>come tu vedi omai, di grado in grado,</p>\n<p>che di s&ugrave; prendono e di sotto fanno.</p></div>\n\n<div class="stanza"><p>Riguarda bene omai s&igrave; com&rsquo; io vado</p>\n<p>per questo loco al vero che disiri,</p>\n<p>s&igrave; che poi sappi sol tener lo guado.</p></div>\n\n<div class="stanza"><p>Lo moto e la virt&ugrave; d&rsquo;i santi giri,</p>\n<p>come dal fabbro l&rsquo;arte del martello,</p>\n<p>da&rsquo; beati motor convien che spiri;</p></div>\n\n<div class="stanza"><p>e &rsquo;l ciel cui tanti lumi fanno bello,</p>\n<p>de la mente profonda che lui volve</p>\n<p>prende l&rsquo;image e fassene suggello.</p></div>\n\n<div class="stanza"><p>E come l&rsquo;alma dentro a vostra polve</p>\n<p>per differenti membra e conformate</p>\n<p>a diverse potenze si risolve,</p></div>\n\n<div class="stanza"><p>cos&igrave; l&rsquo;intelligenza sua bontate</p>\n<p>multiplicata per le stelle spiega,</p>\n<p>girando s&eacute; sovra sua unitate.</p></div>\n\n<div class="stanza"><p>Virt&ugrave; diversa fa diversa lega</p>\n<p>col prez&iuml;oso corpo ch&rsquo;ella avviva,</p>\n<p>nel qual, s&igrave; come vita in voi, si lega.</p></div>\n\n<div class="stanza"><p>Per la natura lieta onde deriva,</p>\n<p>la virt&ugrave; mista per lo corpo luce</p>\n<p>come letizia per pupilla viva.</p></div>\n\n<div class="stanza"><p>Da essa vien ci&ograve; che da luce a luce</p>\n<p>par differente, non da denso e raro;</p>\n<p>essa &egrave; formal principio che produce,</p></div>\n\n<div class="stanza"><p>conforme a sua bont&agrave;, lo turbo e &rsquo;l chiaro&raquo;.</p></div>','<p class="cantohead">Canto III</p>\n\n<div class="stanza"><p>Quel sol che pria d&rsquo;amor mi scald&ograve; &rsquo;l petto,</p>\n<p>di bella verit&agrave; m&rsquo;avea scoverto,</p>\n<p>provando e riprovando, il dolce aspetto;</p></div>\n\n<div class="stanza"><p>e io, per confessar corretto e certo</p>\n<p>me stesso, tanto quanto si convenne</p>\n<p>leva&rsquo; il capo a proferer pi&ugrave; erto;</p></div>\n\n<div class="stanza"><p>ma vis&iuml;one apparve che ritenne</p>\n<p>a s&eacute; me tanto stretto, per vedersi,</p>\n<p>che di mia confession non mi sovvenne.</p></div>\n\n<div class="stanza"><p>Quali per vetri trasparenti e tersi,</p>\n<p>o ver per acque nitide e tranquille,</p>\n<p>non s&igrave; profonde che i fondi sien persi,</p></div>\n\n<div class="stanza"><p>tornan d&rsquo;i nostri visi le postille</p>\n<p>debili s&igrave;, che perla in bianca fronte</p>\n<p>non vien men forte a le nostre pupille;</p></div>\n\n<div class="stanza"><p>tali vid&rsquo; io pi&ugrave; facce a parlar pronte;</p>\n<p>per ch&rsquo;io dentro a l&rsquo;error contrario corsi</p>\n<p>a quel ch&rsquo;accese amor tra l&rsquo;omo e &rsquo;l fonte.</p></div>\n\n<div class="stanza"><p>S&ugrave;bito s&igrave; com&rsquo; io di lor m&rsquo;accorsi,</p>\n<p>quelle stimando specchiati sembianti,</p>\n<p>per veder di cui fosser, li occhi torsi;</p></div>\n\n<div class="stanza"><p>e nulla vidi, e ritorsili avanti</p>\n<p>dritti nel lume de la dolce guida,</p>\n<p>che, sorridendo, ardea ne li occhi santi.</p></div>\n\n<div class="stanza"><p>&laquo;Non ti maravigliar perch&rsquo; io sorrida&raquo;,</p>\n<p>mi disse, &laquo;appresso il tuo p&uuml;eril coto,</p>\n<p>poi sopra &rsquo;l vero ancor lo pi&egrave; non fida,</p></div>\n\n<div class="stanza"><p>ma te rivolve, come suole, a v&ograve;to:</p>\n<p>vere sustanze son ci&ograve; che tu vedi,</p>\n<p>qui rilegate per manco di voto.</p></div>\n\n<div class="stanza"><p>Per&ograve; parla con esse e odi e credi;</p>\n<p>ch&eacute; la verace luce che le appaga</p>\n<p>da s&eacute; non lascia lor torcer li piedi&raquo;.</p></div>\n\n<div class="stanza"><p>E io a l&rsquo;ombra che parea pi&ugrave; vaga</p>\n<p>di ragionar, drizza&rsquo;mi, e cominciai,</p>\n<p>quasi com&rsquo; uom cui troppa voglia smaga:</p></div>\n\n<div class="stanza"><p>&laquo;O ben creato spirito, che a&rsquo; rai</p>\n<p>di vita etterna la dolcezza senti</p>\n<p>che, non gustata, non s&rsquo;intende mai,</p></div>\n\n<div class="stanza"><p>graz&iuml;oso mi fia se mi contenti</p>\n<p>del nome tuo e de la vostra sorte&raquo;.</p>\n<p>Ond&rsquo; ella, pronta e con occhi ridenti:</p></div>\n\n<div class="stanza"><p>&laquo;La nostra carit&agrave; non serra porte</p>\n<p>a giusta voglia, se non come quella</p>\n<p>che vuol simile a s&eacute; tutta sua corte.</p></div>\n\n<div class="stanza"><p>I&rsquo; fui nel mondo vergine sorella;</p>\n<p>e se la mente tua ben s&eacute; riguarda,</p>\n<p>non mi ti celer&agrave; l&rsquo;esser pi&ugrave; bella,</p></div>\n\n<div class="stanza"><p>ma riconoscerai ch&rsquo;i&rsquo; son Piccarda,</p>\n<p>che, posta qui con questi altri beati,</p>\n<p>beata sono in la spera pi&ugrave; tarda.</p></div>\n\n<div class="stanza"><p>Li nostri affetti, che solo infiammati</p>\n<p>son nel piacer de lo Spirito Santo,</p>\n<p>letizian del suo ordine formati.</p></div>\n\n<div class="stanza"><p>E questa sorte che par gi&ugrave; cotanto,</p>\n<p>per&ograve; n&rsquo;&egrave; data, perch&eacute; fuor negletti</p>\n<p>li nostri voti, e v&ograve;ti in alcun canto&raquo;.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; io a lei: &laquo;Ne&rsquo; mirabili aspetti</p>\n<p>vostri risplende non so che divino</p>\n<p>che vi trasmuta da&rsquo; primi concetti:</p></div>\n\n<div class="stanza"><p>per&ograve; non fui a rimembrar festino;</p>\n<p>ma or m&rsquo;aiuta ci&ograve; che tu mi dici,</p>\n<p>s&igrave; che raffigurar m&rsquo;&egrave; pi&ugrave; latino.</p></div>\n\n<div class="stanza"><p>Ma dimmi: voi che siete qui felici,</p>\n<p>disiderate voi pi&ugrave; alto loco</p>\n<p>per pi&ugrave; vedere e per pi&ugrave; farvi amici?&raquo;.</p></div>\n\n<div class="stanza"><p>Con quelle altr&rsquo; ombre pria sorrise un poco;</p>\n<p>da indi mi rispuose tanto lieta,</p>\n<p>ch&rsquo;arder parea d&rsquo;amor nel primo foco:</p></div>\n\n<div class="stanza"><p>&laquo;Frate, la nostra volont&agrave; qu&iuml;eta</p>\n<p>virt&ugrave; di carit&agrave;, che fa volerne</p>\n<p>sol quel ch&rsquo;avemo, e d&rsquo;altro non ci asseta.</p></div>\n\n<div class="stanza"><p>Se dis&iuml;assimo esser pi&ugrave; superne,</p>\n<p>foran discordi li nostri disiri</p>\n<p>dal voler di colui che qui ne cerne;</p></div>\n\n<div class="stanza"><p>che vedrai non capere in questi giri,</p>\n<p>s&rsquo;essere in carit&agrave; &egrave; qui necesse,</p>\n<p>e se la sua natura ben rimiri.</p></div>\n\n<div class="stanza"><p>Anzi &egrave; formale ad esto beato esse</p>\n<p>tenersi dentro a la divina voglia,</p>\n<p>per ch&rsquo;una fansi nostre voglie stesse;</p></div>\n\n<div class="stanza"><p>s&igrave; che, come noi sem di soglia in soglia</p>\n<p>per questo regno, a tutto il regno piace</p>\n<p>com&rsquo; a lo re che &rsquo;n suo voler ne &rsquo;nvoglia.</p></div>\n\n<div class="stanza"><p>E &rsquo;n la sua volontade &egrave; nostra pace:</p>\n<p>ell&rsquo; &egrave; quel mare al qual tutto si move</p>\n<p>ci&ograve; ch&rsquo;ella cr&iuml;a o che natura face&raquo;.</p></div>\n\n<div class="stanza"><p>Chiaro mi fu allor come ogne dove</p>\n<p>in cielo &egrave; paradiso, etsi la grazia</p>\n<p>del sommo ben d&rsquo;un modo non vi piove.</p></div>\n\n<div class="stanza"><p>Ma s&igrave; com&rsquo; elli avvien, s&rsquo;un cibo sazia</p>\n<p>e d&rsquo;un altro rimane ancor la gola,</p>\n<p>che quel si chere e di quel si ringrazia,</p></div>\n\n<div class="stanza"><p>cos&igrave; fec&rsquo; io con atto e con parola,</p>\n<p>per apprender da lei qual fu la tela</p>\n<p>onde non trasse infino a co la spuola.</p></div>\n\n<div class="stanza"><p>&laquo;Perfetta vita e alto merto inciela</p>\n<p>donna pi&ugrave; s&ugrave;&raquo;, mi disse, &laquo;a la cui norma</p>\n<p>nel vostro mondo gi&ugrave; si veste e vela,</p></div>\n\n<div class="stanza"><p>perch&eacute; fino al morir si vegghi e dorma</p>\n<p>con quello sposo ch&rsquo;ogne voto accetta</p>\n<p>che caritate a suo piacer conforma.</p></div>\n\n<div class="stanza"><p>Dal mondo, per seguirla, giovinetta</p>\n<p>fuggi&rsquo;mi, e nel suo abito mi chiusi</p>\n<p>e promisi la via de la sua setta.</p></div>\n\n<div class="stanza"><p>Uomini poi, a mal pi&ugrave; ch&rsquo;a bene usi,</p>\n<p>fuor mi rapiron de la dolce chiostra:</p>\n<p>Iddio si sa qual poi mia vita fusi.</p></div>\n\n<div class="stanza"><p>E quest&rsquo; altro splendor che ti si mostra</p>\n<p>da la mia destra parte e che s&rsquo;accende</p>\n<p>di tutto il lume de la spera nostra,</p></div>\n\n<div class="stanza"><p>ci&ograve; ch&rsquo;io dico di me, di s&eacute; intende;</p>\n<p>sorella fu, e cos&igrave; le fu tolta</p>\n<p>di capo l&rsquo;ombra de le sacre bende.</p></div>\n\n<div class="stanza"><p>Ma poi che pur al mondo fu rivolta</p>\n<p>contra suo grado e contra buona usanza,</p>\n<p>non fu dal vel del cor gi&agrave; mai disciolta.</p></div>\n\n<div class="stanza"><p>Quest&rsquo; &egrave; la luce de la gran Costanza</p>\n<p>che del secondo vento di Soave</p>\n<p>gener&ograve; &rsquo;l terzo e l&rsquo;ultima possanza&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; parlommi, e poi cominci&ograve; &lsquo;Ave,</p>\n<p>Maria&rsquo; cantando, e cantando vanio</p>\n<p>come per acqua cupa cosa grave.</p></div>\n\n<div class="stanza"><p>La vista mia, che tanto lei seguio</p>\n<p>quanto possibil fu, poi che la perse,</p>\n<p>volsesi al segno di maggior disio,</p></div>\n\n<div class="stanza"><p>e a Beatrice tutta si converse;</p>\n<p>ma quella folgor&ograve; nel m&iuml;o sguardo</p>\n<p>s&igrave; che da prima il viso non sofferse;</p></div>\n\n<div class="stanza"><p>e ci&ograve; mi fece a dimandar pi&ugrave; tardo.</p></div>','<p class="cantohead">Canto IV</p>\n\n<div class="stanza"><p>Intra due cibi, distanti e moventi</p>\n<p>d&rsquo;un modo, prima si morria di fame,</p>\n<p>che liber&rsquo; omo l&rsquo;un recasse ai denti;</p></div>\n\n<div class="stanza"><p>s&igrave; si starebbe un agno intra due brame</p>\n<p>di fieri lupi, igualmente temendo;</p>\n<p>s&igrave; si starebbe un cane intra due dame:</p></div>\n\n<div class="stanza"><p>per che, s&rsquo;i&rsquo; mi tacea, me non riprendo,</p>\n<p>da li miei dubbi d&rsquo;un modo sospinto,</p>\n<p>poi ch&rsquo;era necessario, n&eacute; commendo.</p></div>\n\n<div class="stanza"><p>Io mi tacea, ma &rsquo;l mio disir dipinto</p>\n<p>m&rsquo;era nel viso, e &rsquo;l dimandar con ello,</p>\n<p>pi&ugrave; caldo assai che per parlar distinto.</p></div>\n\n<div class="stanza"><p>F&eacute; s&igrave; Beatrice qual f&eacute; Dan&iuml;ello,</p>\n<p>Nabuccodonosor levando d&rsquo;ira,</p>\n<p>che l&rsquo;avea fatto ingiustamente fello;</p></div>\n\n<div class="stanza"><p>e disse: &laquo;Io veggio ben come ti tira</p>\n<p>uno e altro disio, s&igrave; che tua cura</p>\n<p>s&eacute; stessa lega s&igrave; che fuor non spira.</p></div>\n\n<div class="stanza"><p>Tu argomenti: &ldquo;Se &rsquo;l buon voler dura,</p>\n<p>la v&iuml;olenza altrui per qual ragione</p>\n<p>di meritar mi scema la misura?&rdquo;.</p></div>\n\n<div class="stanza"><p>Ancor di dubitar ti d&agrave; cagione</p>\n<p>parer tornarsi l&rsquo;anime a le stelle,</p>\n<p>secondo la sentenza di Platone.</p></div>\n\n<div class="stanza"><p>Queste son le question che nel tuo velle</p>\n<p>pontano igualmente; e per&ograve; pria</p>\n<p>tratter&ograve; quella che pi&ugrave; ha di felle.</p></div>\n\n<div class="stanza"><p>D&rsquo;i Serafin colui che pi&ugrave; s&rsquo;india,</p>\n<p>Mo&iuml;s&egrave;, Samuel, e quel Giovanni</p>\n<p>che prender vuoli, io dico, non Maria,</p></div>\n\n<div class="stanza"><p>non hanno in altro cielo i loro scanni</p>\n<p>che questi spirti che mo t&rsquo;appariro,</p>\n<p>n&eacute; hanno a l&rsquo;esser lor pi&ugrave; o meno anni;</p></div>\n\n<div class="stanza"><p>ma tutti fanno bello il primo giro,</p>\n<p>e differentemente han dolce vita</p>\n<p>per sentir pi&ugrave; e men l&rsquo;etterno spiro.</p></div>\n\n<div class="stanza"><p>Qui si mostraro, non perch&eacute; sortita</p>\n<p>sia questa spera lor, ma per far segno</p>\n<p>de la celest&iuml;al c&rsquo;ha men salita.</p></div>\n\n<div class="stanza"><p>Cos&igrave; parlar conviensi al vostro ingegno,</p>\n<p>per&ograve; che solo da sensato apprende</p>\n<p>ci&ograve; che fa poscia d&rsquo;intelletto degno.</p></div>\n\n<div class="stanza"><p>Per questo la Scrittura condescende</p>\n<p>a vostra facultate, e piedi e mano</p>\n<p>attribuisce a Dio e altro intende;</p></div>\n\n<div class="stanza"><p>e Santa Chiesa con aspetto umano</p>\n<p>Gabr&iuml;el e Michel vi rappresenta,</p>\n<p>e l&rsquo;altro che Tobia rifece sano.</p></div>\n\n<div class="stanza"><p>Quel che Timeo de l&rsquo;anime argomenta</p>\n<p>non &egrave; simile a ci&ograve; che qui si vede,</p>\n<p>per&ograve; che, come dice, par che senta.</p></div>\n\n<div class="stanza"><p>Dice che l&rsquo;alma a la sua stella riede,</p>\n<p>credendo quella quindi esser decisa</p>\n<p>quando natura per forma la diede;</p></div>\n\n<div class="stanza"><p>e forse sua sentenza &egrave; d&rsquo;altra guisa</p>\n<p>che la voce non suona, ed esser puote</p>\n<p>con intenzion da non esser derisa.</p></div>\n\n<div class="stanza"><p>S&rsquo;elli intende tornare a queste ruote</p>\n<p>l&rsquo;onor de la influenza e &rsquo;l biasmo, forse</p>\n<p>in alcun vero suo arco percuote.</p></div>\n\n<div class="stanza"><p>Questo principio, male inteso, torse</p>\n<p>gi&agrave; tutto il mondo quasi, s&igrave; che Giove,</p>\n<p>Mercurio e Marte a nominar trascorse.</p></div>\n\n<div class="stanza"><p>L&rsquo;altra dubitazion che ti commove</p>\n<p>ha men velen, per&ograve; che sua malizia</p>\n<p>non ti poria menar da me altrove.</p></div>\n\n<div class="stanza"><p>Parere ingiusta la nostra giustizia</p>\n<p>ne li occhi d&rsquo;i mortali, &egrave; argomento</p>\n<p>di fede e non d&rsquo;eretica nequizia.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; puote vostro accorgimento</p>\n<p>ben penetrare a questa veritate,</p>\n<p>come disiri, ti far&ograve; contento.</p></div>\n\n<div class="stanza"><p>Se v&iuml;olenza &egrave; quando quel che pate</p>\n<p>n&iuml;ente conferisce a quel che sforza,</p>\n<p>non fuor quest&rsquo; alme per essa scusate:</p></div>\n\n<div class="stanza"><p>ch&eacute; volont&agrave;, se non vuol, non s&rsquo;ammorza,</p>\n<p>ma fa come natura face in foco,</p>\n<p>se mille volte v&iuml;olenza il torza.</p></div>\n\n<div class="stanza"><p>Per che, s&rsquo;ella si piega assai o poco,</p>\n<p>segue la forza; e cos&igrave; queste fero</p>\n<p>possendo rifuggir nel santo loco.</p></div>\n\n<div class="stanza"><p>Se fosse stato lor volere intero,</p>\n<p>come tenne Lorenzo in su la grada,</p>\n<p>e fece Muzio a la sua man severo,</p></div>\n\n<div class="stanza"><p>cos&igrave; l&rsquo;avria ripinte per la strada</p>\n<p>ond&rsquo; eran tratte, come fuoro sciolte;</p>\n<p>ma cos&igrave; salda voglia &egrave; troppo rada.</p></div>\n\n<div class="stanza"><p>E per queste parole, se ricolte</p>\n<p>l&rsquo;hai come dei, &egrave; l&rsquo;argomento casso</p>\n<p>che t&rsquo;avria fatto noia ancor pi&ugrave; volte.</p></div>\n\n<div class="stanza"><p>Ma or ti s&rsquo;attraversa un altro passo</p>\n<p>dinanzi a li occhi, tal che per te stesso</p>\n<p>non usciresti: pria saresti lasso.</p></div>\n\n<div class="stanza"><p>Io t&rsquo;ho per certo ne la mente messo</p>\n<p>ch&rsquo;alma beata non poria mentire,</p>\n<p>per&ograve; ch&rsquo;&egrave; sempre al primo vero appresso;</p></div>\n\n<div class="stanza"><p>e poi potesti da Piccarda udire</p>\n<p>che l&rsquo;affezion del vel Costanza tenne;</p>\n<p>s&igrave; ch&rsquo;ella par qui meco contradire.</p></div>\n\n<div class="stanza"><p>Molte f&iuml;ate gi&agrave;, frate, addivenne</p>\n<p>che, per fuggir periglio, contra grato</p>\n<p>si f&eacute; di quel che far non si convenne;</p></div>\n\n<div class="stanza"><p>come Almeone, che, di ci&ograve; pregato</p>\n<p>dal padre suo, la propria madre spense,</p>\n<p>per non perder piet&agrave; si f&eacute; spietato.</p></div>\n\n<div class="stanza"><p>A questo punto voglio che tu pense</p>\n<p>che la forza al voler si mischia, e fanno</p>\n<p>s&igrave; che scusar non si posson l&rsquo;offense.</p></div>\n\n<div class="stanza"><p>Voglia assoluta non consente al danno;</p>\n<p>ma consentevi in tanto in quanto teme,</p>\n<p>se si ritrae, cadere in pi&ugrave; affanno.</p></div>\n\n<div class="stanza"><p>Per&ograve;, quando Piccarda quello spreme,</p>\n<p>de la voglia assoluta intende, e io</p>\n<p>de l&rsquo;altra; s&igrave; che ver diciamo insieme&raquo;.</p></div>\n\n<div class="stanza"><p>Cotal fu l&rsquo;ondeggiar del santo rio</p>\n<p>ch&rsquo;usc&igrave; del fonte ond&rsquo; ogne ver deriva;</p>\n<p>tal puose in pace uno e altro disio.</p></div>\n\n<div class="stanza"><p>&laquo;O amanza del primo amante, o diva&raquo;,</p>\n<p>diss&rsquo; io appresso, &laquo;il cui parlar m&rsquo;inonda</p>\n<p>e scalda s&igrave;, che pi&ugrave; e pi&ugrave; m&rsquo;avviva,</p></div>\n\n<div class="stanza"><p>non &egrave; l&rsquo;affezion mia tanto profonda,</p>\n<p>che basti a render voi grazia per grazia;</p>\n<p>ma quei che vede e puote a ci&ograve; risponda.</p></div>\n\n<div class="stanza"><p>Io veggio ben che gi&agrave; mai non si sazia</p>\n<p>nostro intelletto, se &rsquo;l ver non lo illustra</p>\n<p>di fuor dal qual nessun vero si spazia.</p></div>\n\n<div class="stanza"><p>Posasi in esso, come fera in lustra,</p>\n<p>tosto che giunto l&rsquo;ha; e giugner puollo:</p>\n<p>se non, ciascun disio sarebbe frustra.</p></div>\n\n<div class="stanza"><p>Nasce per quello, a guisa di rampollo,</p>\n<p>a pi&egrave; del vero il dubbio; ed &egrave; natura</p>\n<p>ch&rsquo;al sommo pinge noi di collo in collo.</p></div>\n\n<div class="stanza"><p>Questo m&rsquo;invita, questo m&rsquo;assicura</p>\n<p>con reverenza, donna, a dimandarvi</p>\n<p>d&rsquo;un&rsquo;altra verit&agrave; che m&rsquo;&egrave; oscura.</p></div>\n\n<div class="stanza"><p>Io vo&rsquo; saper se l&rsquo;uom pu&ograve; sodisfarvi</p>\n<p>ai voti manchi s&igrave; con altri beni,</p>\n<p>ch&rsquo;a la vostra statera non sien parvi&raquo;.</p></div>\n\n<div class="stanza"><p>Beatrice mi guard&ograve; con li occhi pieni</p>\n<p>di faville d&rsquo;amor cos&igrave; divini,</p>\n<p>che, vinta, mia virtute di&egrave; le reni,</p></div>\n\n<div class="stanza"><p>e quasi mi perdei con li occhi chini.</p></div>','<p class="cantohead">Canto V</p>\n\n<div class="stanza"><p>&laquo;S&rsquo;io ti fiammeggio nel caldo d&rsquo;amore</p>\n<p>di l&agrave; dal modo che &rsquo;n terra si vede,</p>\n<p>s&igrave; che del viso tuo vinco il valore,</p></div>\n\n<div class="stanza"><p>non ti maravigliar, ch&eacute; ci&ograve; procede</p>\n<p>da perfetto veder, che, come apprende,</p>\n<p>cos&igrave; nel bene appreso move il piede.</p></div>\n\n<div class="stanza"><p>Io veggio ben s&igrave; come gi&agrave; resplende</p>\n<p>ne l&rsquo;intelletto tuo l&rsquo;etterna luce,</p>\n<p>che, vista, sola e sempre amore accende;</p></div>\n\n<div class="stanza"><p>e s&rsquo;altra cosa vostro amor seduce,</p>\n<p>non &egrave; se non di quella alcun vestigio,</p>\n<p>mal conosciuto, che quivi traluce.</p></div>\n\n<div class="stanza"><p>Tu vuo&rsquo; saper se con altro servigio,</p>\n<p>per manco voto, si pu&ograve; render tanto</p>\n<p>che l&rsquo;anima sicuri di letigio&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; cominci&ograve; Beatrice questo canto;</p>\n<p>e s&igrave; com&rsquo; uom che suo parlar non spezza,</p>\n<p>contin&uuml;&ograve; cos&igrave; &rsquo;l processo santo:</p></div>\n\n<div class="stanza"><p>&laquo;Lo maggior don che Dio per sua larghezza</p>\n<p>fesse creando, e a la sua bontate</p>\n<p>pi&ugrave; conformato, e quel ch&rsquo;e&rsquo; pi&ugrave; apprezza,</p></div>\n\n<div class="stanza"><p>fu de la volont&agrave; la libertate;</p>\n<p>di che le creature intelligenti,</p>\n<p>e tutte e sole, fuoro e son dotate.</p></div>\n\n<div class="stanza"><p>Or ti parr&agrave;, se tu quinci argomenti,</p>\n<p>l&rsquo;alto valor del voto, s&rsquo;&egrave; s&igrave; fatto</p>\n<p>che Dio consenta quando tu consenti;</p></div>\n\n<div class="stanza"><p>ch&eacute;, nel fermar tra Dio e l&rsquo;omo il patto,</p>\n<p>vittima fassi di questo tesoro,</p>\n<p>tal quale io dico; e fassi col suo atto.</p></div>\n\n<div class="stanza"><p>Dunque che render puossi per ristoro?</p>\n<p>Se credi bene usar quel c&rsquo;hai offerto,</p>\n<p>di maltolletto vuo&rsquo; far buon lavoro.</p></div>\n\n<div class="stanza"><p>Tu se&rsquo; omai del maggior punto certo;</p>\n<p>ma perch&eacute; Santa Chiesa in ci&ograve; dispensa,</p>\n<p>che par contra lo ver ch&rsquo;i&rsquo; t&rsquo;ho scoverto,</p></div>\n\n<div class="stanza"><p>convienti ancor sedere un poco a mensa,</p>\n<p>per&ograve; che &rsquo;l cibo rigido c&rsquo;hai preso,</p>\n<p>richiede ancora aiuto a tua dispensa.</p></div>\n\n<div class="stanza"><p>Apri la mente a quel ch&rsquo;io ti paleso</p>\n<p>e fermalvi entro; ch&eacute; non fa sc&iuml;enza,</p>\n<p>sanza lo ritenere, avere inteso.</p></div>\n\n<div class="stanza"><p>Due cose si convegnono a l&rsquo;essenza</p>\n<p>di questo sacrificio: l&rsquo;una &egrave; quella</p>\n<p>di che si fa; l&rsquo;altr&rsquo; &egrave; la convenenza.</p></div>\n\n<div class="stanza"><p>Quest&rsquo; ultima gi&agrave; mai non si cancella</p>\n<p>se non servata; e intorno di lei</p>\n<p>s&igrave; preciso di sopra si favella:</p></div>\n\n<div class="stanza"><p>per&ograve; necessitato fu a li Ebrei</p>\n<p>pur l&rsquo;offerere, ancor ch&rsquo;alcuna offerta</p>\n<p>s&igrave; permutasse, come saver dei.</p></div>\n\n<div class="stanza"><p>L&rsquo;altra, che per materia t&rsquo;&egrave; aperta,</p>\n<p>puote ben esser tal, che non si falla</p>\n<p>se con altra materia si converta.</p></div>\n\n<div class="stanza"><p>Ma non trasmuti carco a la sua spalla</p>\n<p>per suo arbitrio alcun, sanza la volta</p>\n<p>e de la chiave bianca e de la gialla;</p></div>\n\n<div class="stanza"><p>e ogne permutanza credi stolta,</p>\n<p>se la cosa dimessa in la sorpresa</p>\n<p>come &rsquo;l quattro nel sei non &egrave; raccolta.</p></div>\n\n<div class="stanza"><p>Per&ograve; qualunque cosa tanto pesa</p>\n<p>per suo valor che tragga ogne bilancia,</p>\n<p>sodisfar non si pu&ograve; con altra spesa.</p></div>\n\n<div class="stanza"><p>Non prendan li mortali il voto a ciancia;</p>\n<p>siate fedeli, e a ci&ograve; far non bieci,</p>\n<p>come Iept&egrave; a la sua prima mancia;</p></div>\n\n<div class="stanza"><p>cui pi&ugrave; si convenia dicer &lsquo;Mal feci&rsquo;,</p>\n<p>che, servando, far peggio; e cos&igrave; stolto</p>\n<p>ritrovar puoi il gran duca de&rsquo; Greci,</p></div>\n\n<div class="stanza"><p>onde pianse Efig&egrave;nia il suo bel volto,</p>\n<p>e f&eacute; pianger di s&eacute; i folli e i savi</p>\n<p>ch&rsquo;udir parlar di cos&igrave; fatto c&oacute;lto.</p></div>\n\n<div class="stanza"><p>Siate, Cristiani, a muovervi pi&ugrave; gravi:</p>\n<p>non siate come penna ad ogne vento,</p>\n<p>e non crediate ch&rsquo;ogne acqua vi lavi.</p></div>\n\n<div class="stanza"><p>Avete il novo e &rsquo;l vecchio Testamento,</p>\n<p>e &rsquo;l pastor de la Chiesa che vi guida;</p>\n<p>questo vi basti a vostro salvamento.</p></div>\n\n<div class="stanza"><p>Se mala cupidigia altro vi grida,</p>\n<p>uomini siate, e non pecore matte,</p>\n<p>s&igrave; che &rsquo;l Giudeo di voi tra voi non rida!</p></div>\n\n<div class="stanza"><p>Non fate com&rsquo; agnel che lascia il latte</p>\n<p>de la sua madre, e semplice e lascivo</p>\n<p>seco medesmo a suo piacer combatte!&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; Beatrice a me com&rsquo; &iuml;o scrivo;</p>\n<p>poi si rivolse tutta dis&iuml;ante</p>\n<p>a quella parte ove &rsquo;l mondo &egrave; pi&ugrave; vivo.</p></div>\n\n<div class="stanza"><p>Lo suo tacere e &rsquo;l trasmutar sembiante</p>\n<p>puoser silenzio al mio cupido ingegno,</p>\n<p>che gi&agrave; nuove questioni avea davante;</p></div>\n\n<div class="stanza"><p>e s&igrave; come saetta che nel segno</p>\n<p>percuote pria che sia la corda queta,</p>\n<p>cos&igrave; corremmo nel secondo regno.</p></div>\n\n<div class="stanza"><p>Quivi la donna mia vid&rsquo; io s&igrave; lieta,</p>\n<p>come nel lume di quel ciel si mise,</p>\n<p>che pi&ugrave; lucente se ne f&eacute; &rsquo;l pianeta.</p></div>\n\n<div class="stanza"><p>E se la stella si cambi&ograve; e rise,</p>\n<p>qual mi fec&rsquo; io che pur da mia natura</p>\n<p>trasmutabile son per tutte guise!</p></div>\n\n<div class="stanza"><p>Come &rsquo;n peschiera ch&rsquo;&egrave; tranquilla e pura</p>\n<p>traggonsi i pesci a ci&ograve; che vien di fori</p>\n<p>per modo che lo stimin lor pastura,</p></div>\n\n<div class="stanza"><p>s&igrave; vid&rsquo; io ben pi&ugrave; di mille splendori</p>\n<p>trarsi ver&rsquo; noi, e in ciascun s&rsquo;udia:</p>\n<p>&laquo;Ecco chi crescer&agrave; li nostri amori&raquo;.</p></div>\n\n<div class="stanza"><p>E s&igrave; come ciascuno a noi ven&igrave;a,</p>\n<p>vedeasi l&rsquo;ombra piena di letizia</p>\n<p>nel folg&oacute;r chiaro che di lei uscia.</p></div>\n\n<div class="stanza"><p>Pensa, lettor, se quel che qui s&rsquo;inizia</p>\n<p>non procedesse, come tu avresti</p>\n<p>di pi&ugrave; savere angosciosa carizia;</p></div>\n\n<div class="stanza"><p>e per te vederai come da questi</p>\n<p>m&rsquo;era in disio d&rsquo;udir lor condizioni,</p>\n<p>s&igrave; come a li occhi mi fur manifesti.</p></div>\n\n<div class="stanza"><p>&laquo;O bene nato a cui veder li troni</p>\n<p>del tr&iuml;unfo etternal concede grazia</p>\n<p>prima che la milizia s&rsquo;abbandoni,</p></div>\n\n<div class="stanza"><p>del lume che per tutto il ciel si spazia</p>\n<p>noi semo accesi; e per&ograve;, se disii</p>\n<p>di noi chiarirti, a tuo piacer ti sazia&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; da un di quelli spirti pii</p>\n<p>detto mi fu; e da Beatrice: &laquo;D&igrave;, d&igrave;</p>\n<p>sicuramente, e credi come a dii&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Io veggio ben s&igrave; come tu t&rsquo;annidi</p>\n<p>nel proprio lume, e che de li occhi il traggi,</p>\n<p>perch&rsquo; e&rsquo; corusca s&igrave; come tu ridi;</p></div>\n\n<div class="stanza"><p>ma non so chi tu se&rsquo;, n&eacute; perch&eacute; aggi,</p>\n<p>anima degna, il grado de la spera</p>\n<p>che si vela a&rsquo; mortai con altrui raggi&raquo;.</p></div>\n\n<div class="stanza"><p>Questo diss&rsquo; io diritto a la lumera</p>\n<p>che pria m&rsquo;avea parlato; ond&rsquo; ella fessi</p>\n<p>lucente pi&ugrave; assai di quel ch&rsquo;ell&rsquo; era.</p></div>\n\n<div class="stanza"><p>S&igrave; come il sol che si cela elli stessi</p>\n<p>per troppa luce, come &rsquo;l caldo ha r&oacute;se</p>\n<p>le temperanze d&rsquo;i vapori spessi,</p></div>\n\n<div class="stanza"><p>per pi&ugrave; letizia s&igrave; mi si nascose</p>\n<p>dentro al suo raggio la figura santa;</p>\n<p>e cos&igrave; chiusa chiusa mi rispuose</p></div>\n\n<div class="stanza"><p>nel modo che &rsquo;l seguente canto canta.</p></div>','<p class="cantohead">Canto VI</p>\n\n<div class="stanza"><p>&laquo;Poscia che Costantin l&rsquo;aquila volse</p>\n<p>contr&rsquo; al corso del ciel, ch&rsquo;ella seguio</p>\n<p>dietro a l&rsquo;antico che Lavina tolse,</p></div>\n\n<div class="stanza"><p>cento e cent&rsquo; anni e pi&ugrave; l&rsquo;uccel di Dio</p>\n<p>ne lo stremo d&rsquo;Europa si ritenne,</p>\n<p>vicino a&rsquo; monti de&rsquo; quai prima usc&igrave;o;</p></div>\n\n<div class="stanza"><p>e sotto l&rsquo;ombra de le sacre penne</p>\n<p>govern&ograve; &rsquo;l mondo l&igrave; di mano in mano,</p>\n<p>e, s&igrave; cangiando, in su la mia pervenne.</p></div>\n\n<div class="stanza"><p>Cesare fui e son Iustin&iuml;ano,</p>\n<p>che, per voler del primo amor ch&rsquo;i&rsquo; sento,</p>\n<p>d&rsquo;entro le leggi trassi il troppo e &rsquo;l vano.</p></div>\n\n<div class="stanza"><p>E prima ch&rsquo;io a l&rsquo;ovra fossi attento,</p>\n<p>una natura in Cristo esser, non pi&ugrave;e,</p>\n<p>credea, e di tal fede era contento;</p></div>\n\n<div class="stanza"><p>ma &rsquo;l benedetto Agapito, che fue</p>\n<p>sommo pastore, a la fede sincera</p>\n<p>mi dirizz&ograve; con le parole sue.</p></div>\n\n<div class="stanza"><p>Io li credetti; e ci&ograve; che &rsquo;n sua fede era,</p>\n<p>vegg&rsquo; io or chiaro s&igrave;, come tu vedi</p>\n<p>ogni contradizione e falsa e vera.</p></div>\n\n<div class="stanza"><p>Tosto che con la Chiesa mossi i piedi,</p>\n<p>a Dio per grazia piacque di spirarmi</p>\n<p>l&rsquo;alto lavoro, e tutto &rsquo;n lui mi diedi;</p></div>\n\n<div class="stanza"><p>e al mio Belisar commendai l&rsquo;armi,</p>\n<p>cui la destra del ciel fu s&igrave; congiunta,</p>\n<p>che segno fu ch&rsquo;i&rsquo; dovessi posarmi.</p></div>\n\n<div class="stanza"><p>Or qui a la question prima s&rsquo;appunta</p>\n<p>la mia risposta; ma sua condizione</p>\n<p>mi stringe a seguitare alcuna giunta,</p></div>\n\n<div class="stanza"><p>perch&eacute; tu veggi con quanta ragione</p>\n<p>si move contr&rsquo; al sacrosanto segno</p>\n<p>e chi &rsquo;l s&rsquo;appropria e chi a lui s&rsquo;oppone.</p></div>\n\n<div class="stanza"><p>Vedi quanta virt&ugrave; l&rsquo;ha fatto degno</p>\n<p>di reverenza; e cominci&ograve; da l&rsquo;ora</p>\n<p>che Pallante mor&igrave; per darli regno.</p></div>\n\n<div class="stanza"><p>Tu sai ch&rsquo;el fece in Alba sua dimora</p>\n<p>per trecento anni e oltre, infino al fine</p>\n<p>che i tre a&rsquo; tre pugnar per lui ancora.</p></div>\n\n<div class="stanza"><p>E sai ch&rsquo;el f&eacute; dal mal de le Sabine</p>\n<p>al dolor di Lucrezia in sette regi,</p>\n<p>vincendo intorno le genti vicine.</p></div>\n\n<div class="stanza"><p>Sai quel ch&rsquo;el f&eacute; portato da li egregi</p>\n<p>Romani incontro a Brenno, incontro a Pirro,</p>\n<p>incontro a li altri principi e collegi;</p></div>\n\n<div class="stanza"><p>onde Torquato e Quinzio, che dal cirro</p>\n<p>negletto fu nomato, i Deci e &rsquo; Fabi</p>\n<p>ebber la fama che volontier mirro.</p></div>\n\n<div class="stanza"><p>Esso atterr&ograve; l&rsquo;orgoglio de li Ar&agrave;bi</p>\n<p>che di retro ad Anibale passaro</p>\n<p>l&rsquo;alpestre rocce, Po, di che tu labi.</p></div>\n\n<div class="stanza"><p>Sott&rsquo; esso giovanetti tr&iuml;unfaro</p>\n<p>Scip&iuml;one e Pompeo; e a quel colle</p>\n<p>sotto &rsquo;l qual tu nascesti parve amaro.</p></div>\n\n<div class="stanza"><p>Poi, presso al tempo che tutto &rsquo;l ciel volle</p>\n<p>redur lo mondo a suo modo sereno,</p>\n<p>Cesare per voler di Roma il tolle.</p></div>\n\n<div class="stanza"><p>E quel che f&eacute; da Varo infino a Reno,</p>\n<p>Isara vide ed Era e vide Senna</p>\n<p>e ogne valle onde Rodano &egrave; pieno.</p></div>\n\n<div class="stanza"><p>Quel che f&eacute; poi ch&rsquo;elli usc&igrave; di Ravenna</p>\n<p>e salt&ograve; Rubicon, fu di tal volo,</p>\n<p>che nol seguiteria lingua n&eacute; penna.</p></div>\n\n<div class="stanza"><p>Inver&rsquo; la Spagna rivolse lo stuolo,</p>\n<p>poi ver&rsquo; Durazzo, e Farsalia percosse</p>\n<p>s&igrave; ch&rsquo;al Nil caldo si sent&igrave; del duolo.</p></div>\n\n<div class="stanza"><p>Antandro e Simeonta, onde si mosse,</p>\n<p>rivide e l&agrave; dov&rsquo; Ettore si cuba;</p>\n<p>e mal per Tolomeo poscia si scosse.</p></div>\n\n<div class="stanza"><p>Da indi scese folgorando a Iuba;</p>\n<p>onde si volse nel vostro occidente,</p>\n<p>ove sentia la pompeana tuba.</p></div>\n\n<div class="stanza"><p>Di quel che f&eacute; col baiulo seguente,</p>\n<p>Bruto con Cassio ne l&rsquo;inferno latra,</p>\n<p>e Modena e Perugia fu dolente.</p></div>\n\n<div class="stanza"><p>Piangene ancor la trista Cleopatra,</p>\n<p>che, fuggendoli innanzi, dal colubro</p>\n<p>la morte prese subitana e atra.</p></div>\n\n<div class="stanza"><p>Con costui corse infino al lito rubro;</p>\n<p>con costui puose il mondo in tanta pace,</p>\n<p>che fu serrato a Giano il suo delubro.</p></div>\n\n<div class="stanza"><p>Ma ci&ograve; che &rsquo;l segno che parlar mi face</p>\n<p>fatto avea prima e poi era fatturo</p>\n<p>per lo regno mortal ch&rsquo;a lui soggiace,</p></div>\n\n<div class="stanza"><p>diventa in apparenza poco e scuro,</p>\n<p>se in mano al terzo Cesare si mira</p>\n<p>con occhio chiaro e con affetto puro;</p></div>\n\n<div class="stanza"><p>ch&eacute; la viva giustizia che mi spira,</p>\n<p>li concedette, in mano a quel ch&rsquo;i&rsquo; dico,</p>\n<p>gloria di far vendetta a la sua ira.</p></div>\n\n<div class="stanza"><p>Or qui t&rsquo;ammira in ci&ograve; ch&rsquo;io ti repl&igrave;co:</p>\n<p>poscia con Tito a far vendetta corse</p>\n<p>de la vendetta del peccato antico.</p></div>\n\n<div class="stanza"><p>E quando il dente longobardo morse</p>\n<p>la Santa Chiesa, sotto le sue ali</p>\n<p>Carlo Magno, vincendo, la soccorse.</p></div>\n\n<div class="stanza"><p>Omai puoi giudicar di quei cotali</p>\n<p>ch&rsquo;io accusai di sopra e di lor falli,</p>\n<p>che son cagion di tutti vostri mali.</p></div>\n\n<div class="stanza"><p>L&rsquo;uno al pubblico segno i gigli gialli</p>\n<p>oppone, e l&rsquo;altro appropria quello a parte,</p>\n<p>s&igrave; ch&rsquo;&egrave; forte a veder chi pi&ugrave; si falli.</p></div>\n\n<div class="stanza"><p>Faccian li Ghibellin, faccian lor arte</p>\n<p>sott&rsquo; altro segno, ch&eacute; mal segue quello</p>\n<p>sempre chi la giustizia e lui diparte;</p></div>\n\n<div class="stanza"><p>e non l&rsquo;abbatta esto Carlo novello</p>\n<p>coi Guelfi suoi, ma tema de li artigli</p>\n<p>ch&rsquo;a pi&ugrave; alto leon trasser lo vello.</p></div>\n\n<div class="stanza"><p>Molte f&iuml;ate gi&agrave; pianser li figli</p>\n<p>per la colpa del padre, e non si creda</p>\n<p>che Dio trasmuti l&rsquo;armi per suoi gigli!</p></div>\n\n<div class="stanza"><p>Questa picciola stella si correda</p>\n<p>d&rsquo;i buoni spirti che son stati attivi</p>\n<p>perch&eacute; onore e fama li succeda:</p></div>\n\n<div class="stanza"><p>e quando li disiri poggian quivi,</p>\n<p>s&igrave; disv&iuml;ando, pur convien che i raggi</p>\n<p>del vero amore in s&ugrave; poggin men vivi.</p></div>\n\n<div class="stanza"><p>Ma nel commensurar d&rsquo;i nostri gaggi</p>\n<p>col merto &egrave; parte di nostra letizia,</p>\n<p>perch&eacute; non li vedem minor n&eacute; maggi.</p></div>\n\n<div class="stanza"><p>Quindi addolcisce la viva giustizia</p>\n<p>in noi l&rsquo;affetto s&igrave;, che non si puote</p>\n<p>torcer gi&agrave; mai ad alcuna nequizia.</p></div>\n\n<div class="stanza"><p>Diverse voci fanno dolci note;</p>\n<p>cos&igrave; diversi scanni in nostra vita</p>\n<p>rendon dolce armonia tra queste rote.</p></div>\n\n<div class="stanza"><p>E dentro a la presente margarita</p>\n<p>luce la luce di Romeo, di cui</p>\n<p>fu l&rsquo;ovra grande e bella mal gradita.</p></div>\n\n<div class="stanza"><p>Ma i Provenzai che fecer contra lui</p>\n<p>non hanno riso; e per&ograve; mal cammina</p>\n<p>qual si fa danno del ben fare altrui.</p></div>\n\n<div class="stanza"><p>Quattro figlie ebbe, e ciascuna reina,</p>\n<p>Ramondo Beringhiere, e ci&ograve; li fece</p>\n<p>Romeo, persona um&igrave;le e peregrina.</p></div>\n\n<div class="stanza"><p>E poi il mosser le parole biece</p>\n<p>a dimandar ragione a questo giusto,</p>\n<p>che li assegn&ograve; sette e cinque per diece,</p></div>\n\n<div class="stanza"><p>indi partissi povero e vetusto;</p>\n<p>e se &rsquo;l mondo sapesse il cor ch&rsquo;elli ebbe</p>\n<p>mendicando sua vita a frusto a frusto,</p></div>\n\n<div class="stanza"><p>assai lo loda, e pi&ugrave; lo loderebbe&raquo;.</p></div>','<p class="cantohead">Canto VII</p>\n\n<div class="stanza"><p>&laquo;Osanna, sanctus Deus saba&ograve;th,</p>\n<p>superillustrans claritate tua</p>\n<p>felices ignes horum malac&ograve;th!&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave;, volgendosi a la nota sua,</p>\n<p>fu viso a me cantare essa sustanza,</p>\n<p>sopra la qual doppio lume s&rsquo;addua;</p></div>\n\n<div class="stanza"><p>ed essa e l&rsquo;altre mossero a sua danza,</p>\n<p>e quasi velocissime faville</p>\n<p>mi si velar di s&ugrave;bita distanza.</p></div>\n\n<div class="stanza"><p>Io dubitava e dicea &lsquo;Dille, dille!&rsquo;</p>\n<p>fra me, &lsquo;dille&rsquo; dicea, &lsquo;a la mia donna</p>\n<p>che mi diseta con le dolci stille&rsquo;.</p></div>\n\n<div class="stanza"><p>Ma quella reverenza che s&rsquo;indonna</p>\n<p>di tutto me, pur per Be e per ice,</p>\n<p>mi richinava come l&rsquo;uom ch&rsquo;assonna.</p></div>\n\n<div class="stanza"><p>Poco sofferse me cotal Beatrice</p>\n<p>e cominci&ograve;, raggiandomi d&rsquo;un riso</p>\n<p>tal, che nel foco faria l&rsquo;uom felice:</p></div>\n\n<div class="stanza"><p>&laquo;Secondo mio infallibile avviso,</p>\n<p>come giusta vendetta giustamente</p>\n<p>punita fosse, t&rsquo;ha in pensier miso;</p></div>\n\n<div class="stanza"><p>ma io ti solver&ograve; tosto la mente;</p>\n<p>e tu ascolta, ch&eacute; le mie parole</p>\n<p>di gran sentenza ti faran presente.</p></div>\n\n<div class="stanza"><p>Per non soffrire a la virt&ugrave; che vole</p>\n<p>freno a suo prode, quell&rsquo; uom che non nacque,</p>\n<p>dannando s&eacute;, dann&ograve; tutta sua prole;</p></div>\n\n<div class="stanza"><p>onde l&rsquo;umana specie inferma giacque</p>\n<p>gi&ugrave; per secoli molti in grande errore,</p>\n<p>fin ch&rsquo;al Verbo di Dio discender piacque</p></div>\n\n<div class="stanza"><p>u&rsquo; la natura, che dal suo fattore</p>\n<p>s&rsquo;era allungata, un&igrave; a s&eacute; in persona</p>\n<p>con l&rsquo;atto sol del suo etterno amore.</p></div>\n\n<div class="stanza"><p>Or drizza il viso a quel ch&rsquo;or si ragiona:</p>\n<p>questa natura al suo fattore unita,</p>\n<p>qual fu creata, fu sincera e buona;</p></div>\n\n<div class="stanza"><p>ma per s&eacute; stessa pur fu ella sbandita</p>\n<p>di paradiso, per&ograve; che si torse</p>\n<p>da via di verit&agrave; e da sua vita.</p></div>\n\n<div class="stanza"><p>La pena dunque che la croce porse</p>\n<p>s&rsquo;a la natura assunta si misura,</p>\n<p>nulla gi&agrave; mai s&igrave; giustamente morse;</p></div>\n\n<div class="stanza"><p>e cos&igrave; nulla fu di tanta ingiura,</p>\n<p>guardando a la persona che sofferse,</p>\n<p>in che era contratta tal natura.</p></div>\n\n<div class="stanza"><p>Per&ograve; d&rsquo;un atto uscir cose diverse:</p>\n<p>ch&rsquo;a Dio e a&rsquo; Giudei piacque una morte;</p>\n<p>per lei trem&ograve; la terra e &rsquo;l ciel s&rsquo;aperse.</p></div>\n\n<div class="stanza"><p>Non ti dee oramai parer pi&ugrave; forte,</p>\n<p>quando si dice che giusta vendetta</p>\n<p>poscia vengiata fu da giusta corte.</p></div>\n\n<div class="stanza"><p>Ma io veggi&rsquo; or la tua mente ristretta</p>\n<p>di pensiero in pensier dentro ad un nodo,</p>\n<p>del qual con gran disio solver s&rsquo;aspetta.</p></div>\n\n<div class="stanza"><p>Tu dici: &ldquo;Ben discerno ci&ograve; ch&rsquo;i&rsquo; odo;</p>\n<p>ma perch&eacute; Dio volesse, m&rsquo;&egrave; occulto,</p>\n<p>a nostra redenzion pur questo modo&rdquo;.</p></div>\n\n<div class="stanza"><p>Questo decreto, frate, sta sepulto</p>\n<p>a li occhi di ciascuno il cui ingegno</p>\n<p>ne la fiamma d&rsquo;amor non &egrave; adulto.</p></div>\n\n<div class="stanza"><p>Veramente, per&ograve; ch&rsquo;a questo segno</p>\n<p>molto si mira e poco si discerne,</p>\n<p>dir&ograve; perch&eacute; tal modo fu pi&ugrave; degno.</p></div>\n\n<div class="stanza"><p>La divina bont&agrave;, che da s&eacute; sperne</p>\n<p>ogne livore, ardendo in s&eacute;, sfavilla</p>\n<p>s&igrave; che dispiega le bellezze etterne.</p></div>\n\n<div class="stanza"><p>Ci&ograve; che da lei sanza mezzo distilla</p>\n<p>non ha poi fine, perch&eacute; non si move</p>\n<p>la sua imprenta quand&rsquo; ella sigilla.</p></div>\n\n<div class="stanza"><p>Ci&ograve; che da essa sanza mezzo piove</p>\n<p>libero &egrave; tutto, perch&eacute; non soggiace</p>\n<p>a la virtute de le cose nove.</p></div>\n\n<div class="stanza"><p>Pi&ugrave; l&rsquo;&egrave; conforme, e per&ograve; pi&ugrave; le piace;</p>\n<p>ch&eacute; l&rsquo;ardor santo ch&rsquo;ogne cosa raggia,</p>\n<p>ne la pi&ugrave; somigliante &egrave; pi&ugrave; vivace.</p></div>\n\n<div class="stanza"><p>Di tutte queste dote s&rsquo;avvantaggia</p>\n<p>l&rsquo;umana creatura, e s&rsquo;una manca,</p>\n<p>di sua nobilit&agrave; convien che caggia.</p></div>\n\n<div class="stanza"><p>Solo il peccato &egrave; quel che la disfranca</p>\n<p>e falla dissim&igrave;le al sommo bene,</p>\n<p>per che del lume suo poco s&rsquo;imbianca;</p></div>\n\n<div class="stanza"><p>e in sua dignit&agrave; mai non rivene,</p>\n<p>se non r&iuml;empie, dove colpa v&ograve;ta,</p>\n<p>contra mal dilettar con giuste pene.</p></div>\n\n<div class="stanza"><p>Vostra natura, quando pecc&ograve; tota</p>\n<p>nel seme suo, da queste dignitadi,</p>\n<p>come di paradiso, fu remota;</p></div>\n\n<div class="stanza"><p>n&eacute; ricovrar potiensi, se tu badi</p>\n<p>ben sottilmente, per alcuna via,</p>\n<p>sanza passar per un di questi guadi:</p></div>\n\n<div class="stanza"><p>o che Dio solo per sua cortesia</p>\n<p>dimesso avesse, o che l&rsquo;uom per s&eacute; isso</p>\n<p>avesse sodisfatto a sua follia.</p></div>\n\n<div class="stanza"><p>Ficca mo l&rsquo;occhio per entro l&rsquo;abisso</p>\n<p>de l&rsquo;etterno consiglio, quanto puoi</p>\n<p>al mio parlar distrettamente fisso.</p></div>\n\n<div class="stanza"><p>Non potea l&rsquo;uomo ne&rsquo; termini suoi</p>\n<p>mai sodisfar, per non potere ir giuso</p>\n<p>con umiltate obed&iuml;endo poi,</p></div>\n\n<div class="stanza"><p>quanto disobediendo intese ir suso;</p>\n<p>e questa &egrave; la cagion per che l&rsquo;uom fue</p>\n<p>da poter sodisfar per s&eacute; dischiuso.</p></div>\n\n<div class="stanza"><p>Dunque a Dio convenia con le vie sue</p>\n<p>riparar l&rsquo;omo a sua intera vita,</p>\n<p>dico con l&rsquo;una, o ver con amendue.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; l&rsquo;ovra tanto &egrave; pi&ugrave; gradita</p>\n<p>da l&rsquo;operante, quanto pi&ugrave; appresenta</p>\n<p>de la bont&agrave; del core ond&rsquo; ell&rsquo; &egrave; uscita,</p></div>\n\n<div class="stanza"><p>la divina bont&agrave; che &rsquo;l mondo imprenta,</p>\n<p>di proceder per tutte le sue vie,</p>\n<p>a rilevarvi suso, fu contenta.</p></div>\n\n<div class="stanza"><p>N&eacute; tra l&rsquo;ultima notte e &rsquo;l primo die</p>\n<p>s&igrave; alto o s&igrave; magnifico processo,</p>\n<p>o per l&rsquo;una o per l&rsquo;altra, fu o fie:</p></div>\n\n<div class="stanza"><p>ch&eacute; pi&ugrave; largo fu Dio a dar s&eacute; stesso</p>\n<p>per far l&rsquo;uom sufficiente a rilevarsi,</p>\n<p>che s&rsquo;elli avesse sol da s&eacute; dimesso;</p></div>\n\n<div class="stanza"><p>e tutti li altri modi erano scarsi</p>\n<p>a la giustizia, se &rsquo;l Figliuol di Dio</p>\n<p>non fosse umil&iuml;ato ad incarnarsi.</p></div>\n\n<div class="stanza"><p>Or per empierti bene ogne disio,</p>\n<p>ritorno a dichiararti in alcun loco,</p>\n<p>perch&eacute; tu veggi l&igrave; cos&igrave; com&rsquo; io.</p></div>\n\n<div class="stanza"><p>Tu dici: &ldquo;Io veggio l&rsquo;acqua, io veggio il foco,</p>\n<p>l&rsquo;aere e la terra e tutte lor misture</p>\n<p>venire a corruzione, e durar poco;</p></div>\n\n<div class="stanza"><p>e queste cose pur furon creature;</p>\n<p>per che, se ci&ograve; ch&rsquo;&egrave; detto &egrave; stato vero,</p>\n<p>esser dovrien da corruzion sicure&rdquo;.</p></div>\n\n<div class="stanza"><p>Li angeli, frate, e &rsquo;l paese sincero</p>\n<p>nel qual tu se&rsquo;, dir si posson creati,</p>\n<p>s&igrave; come sono, in loro essere intero;</p></div>\n\n<div class="stanza"><p>ma li alimenti che tu hai nomati</p>\n<p>e quelle cose che di lor si fanno</p>\n<p>da creata virt&ugrave; sono informati.</p></div>\n\n<div class="stanza"><p>Creata fu la materia ch&rsquo;elli hanno;</p>\n<p>creata fu la virt&ugrave; informante</p>\n<p>in queste stelle che &rsquo;ntorno a lor vanno.</p></div>\n\n<div class="stanza"><p>L&rsquo;anima d&rsquo;ogne bruto e de le piante</p>\n<p>di complession potenz&iuml;ata tira</p>\n<p>lo raggio e &rsquo;l moto de le luci sante;</p></div>\n\n<div class="stanza"><p>ma vostra vita sanza mezzo spira</p>\n<p>la somma beninanza, e la innamora</p>\n<p>di s&eacute; s&igrave; che poi sempre la disira.</p></div>\n\n<div class="stanza"><p>E quinci puoi argomentare ancora</p>\n<p>vostra resurrezion, se tu ripensi</p>\n<p>come l&rsquo;umana carne fessi allora</p></div>\n\n<div class="stanza"><p>che li primi parenti intrambo fensi&raquo;.</p></div>','<p class="cantohead">Canto VIII</p>\n\n<div class="stanza"><p>Solea creder lo mondo in suo periclo</p>\n<p>che la bella Ciprigna il folle amore</p>\n<p>raggiasse, volta nel terzo epiciclo;</p></div>\n\n<div class="stanza"><p>per che non pur a lei faceano onore</p>\n<p>di sacrificio e di votivo grido</p>\n<p>le genti antiche ne l&rsquo;antico errore;</p></div>\n\n<div class="stanza"><p>ma D&iuml;one onoravano e Cupido,</p>\n<p>quella per madre sua, questo per figlio,</p>\n<p>e dicean ch&rsquo;el sedette in grembo a Dido;</p></div>\n\n<div class="stanza"><p>e da costei ond&rsquo; io principio piglio</p>\n<p>pigliavano il vocabol de la stella</p>\n<p>che &rsquo;l sol vagheggia or da coppa or da ciglio.</p></div>\n\n<div class="stanza"><p>Io non m&rsquo;accorsi del salire in ella;</p>\n<p>ma d&rsquo;esservi entro mi f&eacute; assai fede</p>\n<p>la donna mia ch&rsquo;i&rsquo; vidi far pi&ugrave; bella.</p></div>\n\n<div class="stanza"><p>E come in fiamma favilla si vede,</p>\n<p>e come in voce voce si discerne,</p>\n<p>quand&rsquo; una &egrave; ferma e altra va e riede,</p></div>\n\n<div class="stanza"><p>vid&rsquo; io in essa luce altre lucerne</p>\n<p>muoversi in giro pi&ugrave; e men correnti,</p>\n<p>al modo, credo, di lor viste interne.</p></div>\n\n<div class="stanza"><p>Di fredda nube non disceser venti,</p>\n<p>o visibili o no, tanto festini,</p>\n<p>che non paressero impediti e lenti</p></div>\n\n<div class="stanza"><p>a chi avesse quei lumi divini</p>\n<p>veduti a noi venir, lasciando il giro</p>\n<p>pria cominciato in li alti Serafini;</p></div>\n\n<div class="stanza"><p>e dentro a quei che pi&ugrave; innanzi appariro</p>\n<p>sonava &lsquo;Osanna&rsquo; s&igrave;, che unque poi</p>\n<p>di r&iuml;udir non fui sanza disiro.</p></div>\n\n<div class="stanza"><p>Indi si fece l&rsquo;un pi&ugrave; presso a noi</p>\n<p>e solo incominci&ograve;: &laquo;Tutti sem presti</p>\n<p>al tuo piacer, perch&eacute; di noi ti gioi.</p></div>\n\n<div class="stanza"><p>Noi ci volgiam coi principi celesti</p>\n<p>d&rsquo;un giro e d&rsquo;un girare e d&rsquo;una sete,</p>\n<p>ai quali tu del mondo gi&agrave; dicesti:</p></div>\n\n<div class="stanza"><p>&lsquo;Voi che &rsquo;ntendendo il terzo ciel movete&rsquo;;</p>\n<p>e sem s&igrave; pien d&rsquo;amor, che, per piacerti,</p>\n<p>non fia men dolce un poco di qu&iuml;ete&raquo;.</p></div>\n\n<div class="stanza"><p>Poscia che li occhi miei si fuoro offerti</p>\n<p>a la mia donna reverenti, ed essa</p>\n<p>fatti li avea di s&eacute; contenti e certi,</p></div>\n\n<div class="stanza"><p>rivolsersi a la luce che promessa</p>\n<p>tanto s&rsquo;avea, e &laquo;Deh, chi siete?&raquo; fue</p>\n<p>la voce mia di grande affetto impressa.</p></div>\n\n<div class="stanza"><p>E quanta e quale vid&rsquo; io lei far pi&ugrave;e</p>\n<p>per allegrezza nova che s&rsquo;accrebbe,</p>\n<p>quando parlai, a l&rsquo;allegrezze sue!</p></div>\n\n<div class="stanza"><p>Cos&igrave; fatta, mi disse: &laquo;Il mondo m&rsquo;ebbe</p>\n<p>gi&ugrave; poco tempo; e se pi&ugrave; fosse stato,</p>\n<p>molto sar&agrave; di mal, che non sarebbe.</p></div>\n\n<div class="stanza"><p>La mia letizia mi ti tien celato</p>\n<p>che mi raggia dintorno e mi nasconde</p>\n<p>quasi animal di sua seta fasciato.</p></div>\n\n<div class="stanza"><p>Assai m&rsquo;amasti, e avesti ben onde;</p>\n<p>che s&rsquo;io fossi gi&ugrave; stato, io ti mostrava</p>\n<p>di mio amor pi&ugrave; oltre che le fronde.</p></div>\n\n<div class="stanza"><p>Quella sinistra riva che si lava</p>\n<p>di Rodano poi ch&rsquo;&egrave; misto con Sorga,</p>\n<p>per suo segnore a tempo m&rsquo;aspettava,</p></div>\n\n<div class="stanza"><p>e quel corno d&rsquo;Ausonia che s&rsquo;imborga</p>\n<p>di Bari e di Gaeta e di Catona,</p>\n<p>da ove Tronto e Verde in mare sgorga.</p></div>\n\n<div class="stanza"><p>Fulgeami gi&agrave; in fronte la corona</p>\n<p>di quella terra che &rsquo;l Danubio riga</p>\n<p>poi che le ripe tedesche abbandona.</p></div>\n\n<div class="stanza"><p>E la bella Trinacria, che caliga</p>\n<p>tra Pachino e Peloro, sopra &rsquo;l golfo</p>\n<p>che riceve da Euro maggior briga,</p></div>\n\n<div class="stanza"><p>non per Tifeo ma per nascente solfo,</p>\n<p>attesi avrebbe li suoi regi ancora,</p>\n<p>nati per me di Carlo e di Ridolfo,</p></div>\n\n<div class="stanza"><p>se mala segnoria, che sempre accora</p>\n<p>li popoli suggetti, non avesse</p>\n<p>mosso Palermo a gridar: &ldquo;Mora, mora!&rdquo;.</p></div>\n\n<div class="stanza"><p>E se mio frate questo antivedesse,</p>\n<p>l&rsquo;avara povert&agrave; di Catalogna</p>\n<p>gi&agrave; fuggeria, perch&eacute; non li offendesse;</p></div>\n\n<div class="stanza"><p>ch&eacute; veramente proveder bisogna</p>\n<p>per lui, o per altrui, s&igrave; ch&rsquo;a sua barca</p>\n<p>carcata pi&ugrave; d&rsquo;incarco non si pogna.</p></div>\n\n<div class="stanza"><p>La sua natura, che di larga parca</p>\n<p>discese, avria mestier di tal milizia</p>\n<p>che non curasse di mettere in arca&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Per&ograve; ch&rsquo;i&rsquo; credo che l&rsquo;alta letizia</p>\n<p>che &rsquo;l tuo parlar m&rsquo;infonde, segnor mio,</p>\n<p>l&agrave; &rsquo;ve ogne ben si termina e s&rsquo;inizia,</p></div>\n\n<div class="stanza"><p>per te si veggia come la vegg&rsquo; io,</p>\n<p>grata m&rsquo;&egrave; pi&ugrave;; e anco quest&rsquo; ho caro</p>\n<p>perch&eacute; &rsquo;l discerni rimirando in Dio.</p></div>\n\n<div class="stanza"><p>Fatto m&rsquo;hai lieto, e cos&igrave; mi fa chiaro,</p>\n<p>poi che, parlando, a dubitar m&rsquo;hai mosso</p>\n<p>com&rsquo; esser pu&ograve;, di dolce seme, amaro&raquo;.</p></div>\n\n<div class="stanza"><p>Questo io a lui; ed elli a me: &laquo;S&rsquo;io posso</p>\n<p>mostrarti un vero, a quel che tu dimandi</p>\n<p>terrai lo viso come tien lo dosso.</p></div>\n\n<div class="stanza"><p>Lo ben che tutto il regno che tu scandi</p>\n<p>volge e contenta, fa esser virtute</p>\n<p>sua provedenza in questi corpi grandi.</p></div>\n\n<div class="stanza"><p>E non pur le nature provedute</p>\n<p>sono in la mente ch&rsquo;&egrave; da s&eacute; perfetta,</p>\n<p>ma esse insieme con la lor salute:</p></div>\n\n<div class="stanza"><p>per che quantunque quest&rsquo; arco saetta</p>\n<p>disposto cade a proveduto fine,</p>\n<p>s&igrave; come cosa in suo segno diretta.</p></div>\n\n<div class="stanza"><p>Se ci&ograve; non fosse, il ciel che tu cammine</p>\n<p>producerebbe s&igrave; li suoi effetti,</p>\n<p>che non sarebbero arti, ma ruine;</p></div>\n\n<div class="stanza"><p>e ci&ograve; esser non pu&ograve;, se li &rsquo;ntelletti</p>\n<p>che muovon queste stelle non son manchi,</p>\n<p>e manco il primo, che non li ha perfetti.</p></div>\n\n<div class="stanza"><p>Vuo&rsquo; tu che questo ver pi&ugrave; ti s&rsquo;imbianchi?&raquo;.</p>\n<p>E io: &laquo;Non gi&agrave;; ch&eacute; impossibil veggio</p>\n<p>che la natura, in quel ch&rsquo;&egrave; uopo, stanchi&raquo;.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; elli ancora: &laquo;Or d&igrave;: sarebbe il peggio</p>\n<p>per l&rsquo;omo in terra, se non fosse cive?&raquo;.</p>\n<p>&laquo;S&igrave;&raquo;, rispuos&rsquo; io; &laquo;e qui ragion non cheggio&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;E puot&rsquo; elli esser, se gi&ugrave; non si vive</p>\n<p>diversamente per diversi offici?</p>\n<p>Non, se &rsquo;l maestro vostro ben vi scrive&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; venne deducendo infino a quici;</p>\n<p>poscia conchiuse: &laquo;Dunque esser diverse</p>\n<p>convien di vostri effetti le radici:</p></div>\n\n<div class="stanza"><p>per ch&rsquo;un nasce Solone e altro Serse,</p>\n<p>altro Melchised&egrave;ch e altro quello</p>\n<p>che, volando per l&rsquo;aere, il figlio perse.</p></div>\n\n<div class="stanza"><p>La circular natura, ch&rsquo;&egrave; suggello</p>\n<p>a la cera mortal, fa ben sua arte,</p>\n<p>ma non distingue l&rsquo;un da l&rsquo;altro ostello.</p></div>\n\n<div class="stanza"><p>Quinci addivien ch&rsquo;Esa&ugrave; si diparte</p>\n<p>per seme da Iac&ograve;b; e vien Quirino</p>\n<p>da s&igrave; vil padre, che si rende a Marte.</p></div>\n\n<div class="stanza"><p>Natura generata il suo cammino</p>\n<p>simil farebbe sempre a&rsquo; generanti,</p>\n<p>se non vincesse il proveder divino.</p></div>\n\n<div class="stanza"><p>Or quel che t&rsquo;era dietro t&rsquo;&egrave; davanti:</p>\n<p>ma perch&eacute; sappi che di te mi giova,</p>\n<p>un corollario voglio che t&rsquo;ammanti.</p></div>\n\n<div class="stanza"><p>Sempre natura, se fortuna trova</p>\n<p>discorde a s&eacute;, com&rsquo; ogne altra semente</p>\n<p>fuor di sua reg&iuml;on, fa mala prova.</p></div>\n\n<div class="stanza"><p>E se &rsquo;l mondo l&agrave; gi&ugrave; ponesse mente</p>\n<p>al fondamento che natura pone,</p>\n<p>seguendo lui, avria buona la gente.</p></div>\n\n<div class="stanza"><p>Ma voi torcete a la relig&iuml;one</p>\n<p>tal che fia nato a cignersi la spada,</p>\n<p>e fate re di tal ch&rsquo;&egrave; da sermone;</p></div>\n\n<div class="stanza"><p>onde la traccia vostra &egrave; fuor di strada&raquo;.</p></div>','<p class="cantohead">Canto IX</p>\n\n<div class="stanza"><p>Da poi che Carlo tuo, bella Clemenza,</p>\n<p>m&rsquo;ebbe chiarito, mi narr&ograve; li &rsquo;nganni</p>\n<p>che ricever dovea la sua semenza;</p></div>\n\n<div class="stanza"><p>ma disse: &laquo;Taci e lascia muover li anni&raquo;;</p>\n<p>s&igrave; ch&rsquo;io non posso dir se non che pianto</p>\n<p>giusto verr&agrave; di retro ai vostri danni.</p></div>\n\n<div class="stanza"><p>E gi&agrave; la vita di quel lume santo</p>\n<p>rivolta s&rsquo;era al Sol che la r&iuml;empie</p>\n<p>come quel ben ch&rsquo;a ogne cosa &egrave; tanto.</p></div>\n\n<div class="stanza"><p>Ahi anime ingannate e fatture empie,</p>\n<p>che da s&igrave; fatto ben torcete i cuori,</p>\n<p>drizzando in vanit&agrave; le vostre tempie!</p></div>\n\n<div class="stanza"><p>Ed ecco un altro di quelli splendori</p>\n<p>ver&rsquo; me si fece, e &rsquo;l suo voler piacermi</p>\n<p>significava nel chiarir di fori.</p></div>\n\n<div class="stanza"><p>Li occhi di B&euml;atrice, ch&rsquo;eran fermi</p>\n<p>sovra me, come pria, di caro assenso</p>\n<p>al mio disio certificato fermi.</p></div>\n\n<div class="stanza"><p>&laquo;Deh, metti al mio voler tosto compenso,</p>\n<p>beato spirto&raquo;, dissi, &laquo;e fammi prova</p>\n<p>ch&rsquo;i&rsquo; possa in te refletter quel ch&rsquo;io penso!&raquo;.</p></div>\n\n<div class="stanza"><p>Onde la luce che m&rsquo;era ancor nova,</p>\n<p>del suo profondo, ond&rsquo; ella pria cantava,</p>\n<p>seguette come a cui di ben far giova:</p></div>\n\n<div class="stanza"><p>&laquo;In quella parte de la terra prava</p>\n<p>italica che siede tra R&iuml;alto</p>\n<p>e le fontane di Brenta e di Piava,</p></div>\n\n<div class="stanza"><p>si leva un colle, e non surge molt&rsquo; alto,</p>\n<p>l&agrave; onde scese gi&agrave; una facella</p>\n<p>che fece a la contrada un grande assalto.</p></div>\n\n<div class="stanza"><p>D&rsquo;una radice nacqui e io ed ella:</p>\n<p>Cunizza fui chiamata, e qui refulgo</p>\n<p>perch&eacute; mi vinse il lume d&rsquo;esta stella;</p></div>\n\n<div class="stanza"><p>ma lietamente a me medesma indulgo</p>\n<p>la cagion di mia sorte, e non mi noia;</p>\n<p>che parria forse forte al vostro vulgo.</p></div>\n\n<div class="stanza"><p>Di questa luculenta e cara gioia</p>\n<p>del nostro cielo che pi&ugrave; m&rsquo;&egrave; propinqua,</p>\n<p>grande fama rimase; e pria che moia,</p></div>\n\n<div class="stanza"><p>questo centesimo anno ancor s&rsquo;incinqua:</p>\n<p>vedi se far si dee l&rsquo;omo eccellente,</p>\n<p>s&igrave; ch&rsquo;altra vita la prima relinqua.</p></div>\n\n<div class="stanza"><p>E ci&ograve; non pensa la turba presente</p>\n<p>che Tagliamento e Adice richiude,</p>\n<p>n&eacute; per esser battuta ancor si pente;</p></div>\n\n<div class="stanza"><p>ma tosto fia che Padova al palude</p>\n<p>canger&agrave; l&rsquo;acqua che Vincenza bagna,</p>\n<p>per essere al dover le genti crude;</p></div>\n\n<div class="stanza"><p>e dove Sile e Cagnan s&rsquo;accompagna,</p>\n<p>tal signoreggia e va con la testa alta,</p>\n<p>che gi&agrave; per lui carpir si fa la ragna.</p></div>\n\n<div class="stanza"><p>Pianger&agrave; Feltro ancora la difalta</p>\n<p>de l&rsquo;empio suo pastor, che sar&agrave; sconcia</p>\n<p>s&igrave;, che per simil non s&rsquo;entr&ograve; in malta.</p></div>\n\n<div class="stanza"><p>Troppo sarebbe larga la bigoncia</p>\n<p>che ricevesse il sangue ferrarese,</p>\n<p>e stanco chi &rsquo;l pesasse a oncia a oncia,</p></div>\n\n<div class="stanza"><p>che doner&agrave; questo prete cortese</p>\n<p>per mostrarsi di parte; e cotai doni</p>\n<p>conformi fieno al viver del paese.</p></div>\n\n<div class="stanza"><p>S&ugrave; sono specchi, voi dicete Troni,</p>\n<p>onde refulge a noi Dio giudicante;</p>\n<p>s&igrave; che questi parlar ne paion buoni&raquo;.</p></div>\n\n<div class="stanza"><p>Qui si tacette; e fecemi sembiante</p>\n<p>che fosse ad altro volta, per la rota</p>\n<p>in che si mise com&rsquo; era davante.</p></div>\n\n<div class="stanza"><p>L&rsquo;altra letizia, che m&rsquo;era gi&agrave; nota</p>\n<p>per cara cosa, mi si fece in vista</p>\n<p>qual fin balasso in che lo sol percuota.</p></div>\n\n<div class="stanza"><p>Per letiziar l&agrave; s&ugrave; fulgor s&rsquo;acquista,</p>\n<p>s&igrave; come riso qui; ma gi&ugrave; s&rsquo;abbuia</p>\n<p>l&rsquo;ombra di fuor, come la mente &egrave; trista.</p></div>\n\n<div class="stanza"><p>&laquo;Dio vede tutto, e tuo veder s&rsquo;inluia&raquo;,</p>\n<p>diss&rsquo; io, &laquo;beato spirto, s&igrave; che nulla</p>\n<p>voglia di s&eacute; a te puot&rsquo; esser fuia.</p></div>\n\n<div class="stanza"><p>Dunque la voce tua, che &rsquo;l ciel trastulla</p>\n<p>sempre col canto di quei fuochi pii</p>\n<p>che di sei ali facen la coculla,</p></div>\n\n<div class="stanza"><p>perch&eacute; non satisface a&rsquo; miei disii?</p>\n<p>Gi&agrave; non attendere&rsquo; io tua dimanda,</p>\n<p>s&rsquo;io m&rsquo;intuassi, come tu t&rsquo;inmii&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;La maggior valle in che l&rsquo;acqua si spanda&raquo;,</p>\n<p>incominciaro allor le sue parole,</p>\n<p>&laquo;fuor di quel mar che la terra inghirlanda,</p></div>\n\n<div class="stanza"><p>tra &rsquo; discordanti liti contra &rsquo;l sole</p>\n<p>tanto sen va, che fa merid&iuml;ano</p>\n<p>l&agrave; dove l&rsquo;orizzonte pria far suole.</p></div>\n\n<div class="stanza"><p>Di quella valle fu&rsquo; io litorano</p>\n<p>tra Ebro e Macra, che per cammin corto</p>\n<p>parte lo Genovese dal Toscano.</p></div>\n\n<div class="stanza"><p>Ad un occaso quasi e ad un orto</p>\n<p>Buggea siede e la terra ond&rsquo; io fui,</p>\n<p>che f&eacute; del sangue suo gi&agrave; caldo il porto.</p></div>\n\n<div class="stanza"><p>Folco mi disse quella gente a cui</p>\n<p>fu noto il nome mio; e questo cielo</p>\n<p>di me s&rsquo;imprenta, com&rsquo; io fe&rsquo; di lui;</p></div>\n\n<div class="stanza"><p>ch&eacute; pi&ugrave; non arse la figlia di Belo,</p>\n<p>noiando e a Sicheo e a Creusa,</p>\n<p>di me, infin che si convenne al pelo;</p></div>\n\n<div class="stanza"><p>n&eacute; quella Rodop&euml;a che delusa</p>\n<p>fu da Demofoonte, n&eacute; Alcide</p>\n<p>quando Iole nel core ebbe rinchiusa.</p></div>\n\n<div class="stanza"><p>Non per&ograve; qui si pente, ma si ride,</p>\n<p>non de la colpa, ch&rsquo;a mente non torna,</p>\n<p>ma del valor ch&rsquo;ordin&ograve; e provide.</p></div>\n\n<div class="stanza"><p>Qui si rimira ne l&rsquo;arte ch&rsquo;addorna</p>\n<p>cotanto affetto, e discernesi &rsquo;l bene</p>\n<p>per che &rsquo;l mondo di s&ugrave; quel di gi&ugrave; torna.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; tutte le tue voglie piene</p>\n<p>ten porti che son nate in questa spera,</p>\n<p>proceder ancor oltre mi convene.</p></div>\n\n<div class="stanza"><p>Tu vuo&rsquo; saper chi &egrave; in questa lumera</p>\n<p>che qui appresso me cos&igrave; scintilla</p>\n<p>come raggio di sole in acqua mera.</p></div>\n\n<div class="stanza"><p>Or sappi che l&agrave; entro si tranquilla</p>\n<p>Raab; e a nostr&rsquo; ordine congiunta,</p>\n<p>di lei nel sommo grado si sigilla.</p></div>\n\n<div class="stanza"><p>Da questo cielo, in cui l&rsquo;ombra s&rsquo;appunta</p>\n<p>che &rsquo;l vostro mondo face, pria ch&rsquo;altr&rsquo; alma</p>\n<p>del tr&iuml;unfo di Cristo fu assunta.</p></div>\n\n<div class="stanza"><p>Ben si convenne lei lasciar per palma</p>\n<p>in alcun cielo de l&rsquo;alta vittoria</p>\n<p>che s&rsquo;acquist&ograve; con l&rsquo;una e l&rsquo;altra palma,</p></div>\n\n<div class="stanza"><p>perch&rsquo; ella favor&ograve; la prima gloria</p>\n<p>di Ios&uuml;&egrave; in su la Terra Santa,</p>\n<p>che poco tocca al papa la memoria.</p></div>\n\n<div class="stanza"><p>La tua citt&agrave;, che di colui &egrave; pianta</p>\n<p>che pria volse le spalle al suo fattore</p>\n<p>e di cui &egrave; la &rsquo;nvidia tanto pianta,</p></div>\n\n<div class="stanza"><p>produce e spande il maladetto fiore</p>\n<p>c&rsquo;ha disv&iuml;ate le pecore e li agni,</p>\n<p>per&ograve; che fatto ha lupo del pastore.</p></div>\n\n<div class="stanza"><p>Per questo l&rsquo;Evangelio e i dottor magni</p>\n<p>son derelitti, e solo ai Decretali</p>\n<p>si studia, s&igrave; che pare a&rsquo; lor vivagni.</p></div>\n\n<div class="stanza"><p>A questo intende il papa e &rsquo; cardinali;</p>\n<p>non vanno i lor pensieri a Nazarette,</p>\n<p>l&agrave; dove Gabr&iuml;ello aperse l&rsquo;ali.</p></div>\n\n<div class="stanza"><p>Ma Vaticano e l&rsquo;altre parti elette</p>\n<p>di Roma che son state cimitero</p>\n<p>a la milizia che Pietro seguette,</p></div>\n\n<div class="stanza"><p>tosto libere fien de l&rsquo;avoltero&raquo;.</p></div>','<p class="cantohead">Canto X</p>\n\n<div class="stanza"><p>Guardando nel suo Figlio con l&rsquo;Amore</p>\n<p>che l&rsquo;uno e l&rsquo;altro etternalmente spira,</p>\n<p>lo primo e ineffabile Valore</p></div>\n\n<div class="stanza"><p>quanto per mente e per loco si gira</p>\n<p>con tant&rsquo; ordine f&eacute;, ch&rsquo;esser non puote</p>\n<p>sanza gustar di lui chi ci&ograve; rimira.</p></div>\n\n<div class="stanza"><p>Leva dunque, lettore, a l&rsquo;alte rote</p>\n<p>meco la vista, dritto a quella parte</p>\n<p>dove l&rsquo;un moto e l&rsquo;altro si percuote;</p></div>\n\n<div class="stanza"><p>e l&igrave; comincia a vagheggiar ne l&rsquo;arte</p>\n<p>di quel maestro che dentro a s&eacute; l&rsquo;ama,</p>\n<p>tanto che mai da lei l&rsquo;occhio non parte.</p></div>\n\n<div class="stanza"><p>Vedi come da indi si dirama</p>\n<p>l&rsquo;oblico cerchio che i pianeti porta,</p>\n<p>per sodisfare al mondo che li chiama.</p></div>\n\n<div class="stanza"><p>Che se la strada lor non fosse torta,</p>\n<p>molta virt&ugrave; nel ciel sarebbe in vano,</p>\n<p>e quasi ogne potenza qua gi&ugrave; morta;</p></div>\n\n<div class="stanza"><p>e se dal dritto pi&ugrave; o men lontano</p>\n<p>fosse &rsquo;l partire, assai sarebbe manco</p>\n<p>e gi&ugrave; e s&ugrave; de l&rsquo;ordine mondano.</p></div>\n\n<div class="stanza"><p>Or ti riman, lettor, sovra &rsquo;l tuo banco,</p>\n<p>dietro pensando a ci&ograve; che si preliba,</p>\n<p>s&rsquo;esser vuoi lieto assai prima che stanco.</p></div>\n\n<div class="stanza"><p>Messo t&rsquo;ho innanzi: omai per te ti ciba;</p>\n<p>ch&eacute; a s&eacute; torce tutta la mia cura</p>\n<p>quella materia ond&rsquo; io son fatto scriba.</p></div>\n\n<div class="stanza"><p>Lo ministro maggior de la natura,</p>\n<p>che del valor del ciel lo mondo imprenta</p>\n<p>e col suo lume il tempo ne misura,</p></div>\n\n<div class="stanza"><p>con quella parte che s&ugrave; si rammenta</p>\n<p>congiunto, si girava per le spire</p>\n<p>in che pi&ugrave; tosto ognora s&rsquo;appresenta;</p></div>\n\n<div class="stanza"><p>e io era con lui; ma del salire</p>\n<p>non m&rsquo;accors&rsquo; io, se non com&rsquo; uom s&rsquo;accorge,</p>\n<p>anzi &rsquo;l primo pensier, del suo venire.</p></div>\n\n<div class="stanza"><p>&Egrave; B&euml;atrice quella che s&igrave; scorge</p>\n<p>di bene in meglio, s&igrave; subitamente</p>\n<p>che l&rsquo;atto suo per tempo non si sporge.</p></div>\n\n<div class="stanza"><p>Quant&rsquo; esser convenia da s&eacute; lucente</p>\n<p>quel ch&rsquo;era dentro al sol dov&rsquo; io entra&rsquo;mi,</p>\n<p>non per color, ma per lume parvente!</p></div>\n\n<div class="stanza"><p>Perch&rsquo; io lo &rsquo;ngegno e l&rsquo;arte e l&rsquo;uso chiami,</p>\n<p>s&igrave; nol direi che mai s&rsquo;imaginasse;</p>\n<p>ma creder puossi e di veder si brami.</p></div>\n\n<div class="stanza"><p>E se le fantasie nostre son basse</p>\n<p>a tanta altezza, non &egrave; maraviglia;</p>\n<p>ch&eacute; sopra &rsquo;l sol non fu occhio ch&rsquo;andasse.</p></div>\n\n<div class="stanza"><p>Tal era quivi la quarta famiglia</p>\n<p>de l&rsquo;alto Padre, che sempre la sazia,</p>\n<p>mostrando come spira e come figlia.</p></div>\n\n<div class="stanza"><p>E B&euml;atrice cominci&ograve;: &laquo;Ringrazia,</p>\n<p>ringrazia il Sol de li angeli, ch&rsquo;a questo</p>\n<p>sensibil t&rsquo;ha levato per sua grazia&raquo;.</p></div>\n\n<div class="stanza"><p>Cor di mortal non fu mai s&igrave; digesto</p>\n<p>a divozione e a rendersi a Dio</p>\n<p>con tutto &rsquo;l suo gradir cotanto presto,</p></div>\n\n<div class="stanza"><p>come a quelle parole mi fec&rsquo; io;</p>\n<p>e s&igrave; tutto &rsquo;l mio amore in lui si mise,</p>\n<p>che B&euml;atrice ecliss&ograve; ne l&rsquo;oblio.</p></div>\n\n<div class="stanza"><p>Non le dispiacque; ma s&igrave; se ne rise,</p>\n<p>che lo splendor de li occhi suoi ridenti</p>\n<p>mia mente unita in pi&ugrave; cose divise.</p></div>\n\n<div class="stanza"><p>Io vidi pi&ugrave; folg&oacute;r vivi e vincenti</p>\n<p>far di noi centro e di s&eacute; far corona,</p>\n<p>pi&ugrave; dolci in voce che in vista lucenti:</p></div>\n\n<div class="stanza"><p>cos&igrave; cinger la figlia di Latona</p>\n<p>vedem talvolta, quando l&rsquo;aere &egrave; pregno,</p>\n<p>s&igrave; che ritenga il fil che fa la zona.</p></div>\n\n<div class="stanza"><p>Ne la corte del cielo, ond&rsquo; io rivegno,</p>\n<p>si trovan molte gioie care e belle</p>\n<p>tanto che non si posson trar del regno;</p></div>\n\n<div class="stanza"><p>e &rsquo;l canto di quei lumi era di quelle;</p>\n<p>chi non s&rsquo;impenna s&igrave; che l&agrave; s&ugrave; voli,</p>\n<p>dal muto aspetti quindi le novelle.</p></div>\n\n<div class="stanza"><p>Poi, s&igrave; cantando, quelli ardenti soli</p>\n<p>si fuor girati intorno a noi tre volte,</p>\n<p>come stelle vicine a&rsquo; fermi poli,</p></div>\n\n<div class="stanza"><p>donne mi parver, non da ballo sciolte,</p>\n<p>ma che s&rsquo;arrestin tacite, ascoltando</p>\n<p>fin che le nove note hanno ricolte.</p></div>\n\n<div class="stanza"><p>E dentro a l&rsquo;un senti&rsquo; cominciar: &laquo;Quando</p>\n<p>lo raggio de la grazia, onde s&rsquo;accende</p>\n<p>verace amore e che poi cresce amando,</p></div>\n\n<div class="stanza"><p>multiplicato in te tanto resplende,</p>\n<p>che ti conduce su per quella scala</p>\n<p>u&rsquo; sanza risalir nessun discende;</p></div>\n\n<div class="stanza"><p>qual ti negasse il vin de la sua fiala</p>\n<p>per la tua sete, in libert&agrave; non fora</p>\n<p>se non com&rsquo; acqua ch&rsquo;al mar non si cala.</p></div>\n\n<div class="stanza"><p>Tu vuo&rsquo; saper di quai piante s&rsquo;infiora</p>\n<p>questa ghirlanda che &rsquo;ntorno vagheggia</p>\n<p>la bella donna ch&rsquo;al ciel t&rsquo;avvalora.</p></div>\n\n<div class="stanza"><p>Io fui de li agni de la santa greggia</p>\n<p>che Domenico mena per cammino</p>\n<p>u&rsquo; ben s&rsquo;impingua se non si vaneggia.</p></div>\n\n<div class="stanza"><p>Questi che m&rsquo;&egrave; a destra pi&ugrave; vicino,</p>\n<p>frate e maestro fummi, ed esso Alberto</p>\n<p>&egrave; di Cologna, e io Thomas d&rsquo;Aquino.</p></div>\n\n<div class="stanza"><p>Se s&igrave; di tutti li altri esser vuo&rsquo; certo,</p>\n<p>di retro al mio parlar ten vien col viso</p>\n<p>girando su per lo beato serto.</p></div>\n\n<div class="stanza"><p>Quell&rsquo; altro fiammeggiare esce del riso</p>\n<p>di Graz&iuml;an, che l&rsquo;uno e l&rsquo;altro foro</p>\n<p>aiut&ograve; s&igrave; che piace in paradiso.</p></div>\n\n<div class="stanza"><p>L&rsquo;altro ch&rsquo;appresso addorna il nostro coro,</p>\n<p>quel Pietro fu che con la poverella</p>\n<p>offerse a Santa Chiesa suo tesoro.</p></div>\n\n<div class="stanza"><p>La quinta luce, ch&rsquo;&egrave; tra noi pi&ugrave; bella,</p>\n<p>spira di tale amor, che tutto &rsquo;l mondo</p>\n<p>l&agrave; gi&ugrave; ne gola di saper novella:</p></div>\n\n<div class="stanza"><p>entro v&rsquo;&egrave; l&rsquo;alta mente u&rsquo; s&igrave; profondo</p>\n<p>saver fu messo, che, se &rsquo;l vero &egrave; vero,</p>\n<p>a veder tanto non surse il secondo.</p></div>\n\n<div class="stanza"><p>Appresso vedi il lume di quel cero</p>\n<p>che gi&ugrave; in carne pi&ugrave; a dentro vide</p>\n<p>l&rsquo;angelica natura e &rsquo;l ministero.</p></div>\n\n<div class="stanza"><p>Ne l&rsquo;altra piccioletta luce ride</p>\n<p>quello avvocato de&rsquo; tempi cristiani</p>\n<p>del cui latino Augustin si provide.</p></div>\n\n<div class="stanza"><p>Or se tu l&rsquo;occhio de la mente trani</p>\n<p>di luce in luce dietro a le mie lode,</p>\n<p>gi&agrave; de l&rsquo;ottava con sete rimani.</p></div>\n\n<div class="stanza"><p>Per vedere ogne ben dentro vi gode</p>\n<p>l&rsquo;anima santa che &rsquo;l mondo fallace</p>\n<p>fa manifesto a chi di lei ben ode.</p></div>\n\n<div class="stanza"><p>Lo corpo ond&rsquo; ella fu cacciata giace</p>\n<p>giuso in Cieldauro; ed essa da martiro</p>\n<p>e da essilio venne a questa pace.</p></div>\n\n<div class="stanza"><p>Vedi oltre fiammeggiar l&rsquo;ardente spiro</p>\n<p>d&rsquo;Isidoro, di Beda e di Riccardo,</p>\n<p>che a considerar fu pi&ugrave; che viro.</p></div>\n\n<div class="stanza"><p>Questi onde a me ritorna il tuo riguardo,</p>\n<p>&egrave; &rsquo;l lume d&rsquo;uno spirto che &rsquo;n pensieri</p>\n<p>gravi a morir li parve venir tardo:</p></div>\n\n<div class="stanza"><p>essa &egrave; la luce etterna di Sigieri,</p>\n<p>che, leggendo nel Vico de li Strami,</p>\n<p>silogizz&ograve; invid&iuml;osi veri&raquo;.</p></div>\n\n<div class="stanza"><p>Indi, come orologio che ne chiami</p>\n<p>ne l&rsquo;ora che la sposa di Dio surge</p>\n<p>a mattinar lo sposo perch&eacute; l&rsquo;ami,</p></div>\n\n<div class="stanza"><p>che l&rsquo;una parte e l&rsquo;altra tira e urge,</p>\n<p>tin tin sonando con s&igrave; dolce nota,</p>\n<p>che &rsquo;l ben disposto spirto d&rsquo;amor turge;</p></div>\n\n<div class="stanza"><p>cos&igrave; vid&rsquo; &iuml;o la gloriosa rota</p>\n<p>muoversi e render voce a voce in tempra</p>\n<p>e in dolcezza ch&rsquo;esser non p&ograve; nota</p></div>\n\n<div class="stanza"><p>se non col&agrave; dove gioir s&rsquo;insempra.</p></div>','<p class="cantohead">Canto XI</p>\n\n<div class="stanza"><p>O insensata cura de&rsquo; mortali,</p>\n<p>quanto son difettivi silogismi</p>\n<p>quei che ti fanno in basso batter l&rsquo;ali!</p></div>\n\n<div class="stanza"><p>Chi dietro a iura e chi ad amforismi</p>\n<p>sen giva, e chi seguendo sacerdozio,</p>\n<p>e chi regnar per forza o per sofismi,</p></div>\n\n<div class="stanza"><p>e chi rubare e chi civil negozio,</p>\n<p>chi nel diletto de la carne involto</p>\n<p>s&rsquo;affaticava e chi si dava a l&rsquo;ozio,</p></div>\n\n<div class="stanza"><p>quando, da tutte queste cose sciolto,</p>\n<p>con B&euml;atrice m&rsquo;era suso in cielo</p>\n<p>cotanto glor&iuml;osamente accolto.</p></div>\n\n<div class="stanza"><p>Poi che ciascuno fu tornato ne lo</p>\n<p>punto del cerchio in che avanti s&rsquo;era,</p>\n<p>fermossi, come a candellier candelo.</p></div>\n\n<div class="stanza"><p>E io senti&rsquo; dentro a quella lumera</p>\n<p>che pria m&rsquo;avea parlato, sorridendo</p>\n<p>incominciar, faccendosi pi&ugrave; mera:</p></div>\n\n<div class="stanza"><p>&laquo;Cos&igrave; com&rsquo; io del suo raggio resplendo,</p>\n<p>s&igrave;, riguardando ne la luce etterna,</p>\n<p>li tuoi pensieri onde cagioni apprendo.</p></div>\n\n<div class="stanza"><p>Tu dubbi, e hai voler che si ricerna</p>\n<p>in s&igrave; aperta e &rsquo;n s&igrave; distesa lingua</p>\n<p>lo dicer mio, ch&rsquo;al tuo sentir si sterna,</p></div>\n\n<div class="stanza"><p>ove dinanzi dissi: &ldquo;U&rsquo; ben s&rsquo;impingua&rdquo;,</p>\n<p>e l&agrave; u&rsquo; dissi: &ldquo;Non nacque il secondo&rdquo;;</p>\n<p>e qui &egrave; uopo che ben si distingua.</p></div>\n\n<div class="stanza"><p>La provedenza, che governa il mondo</p>\n<p>con quel consiglio nel quale ogne aspetto</p>\n<p>creato &egrave; vinto pria che vada al fondo,</p></div>\n\n<div class="stanza"><p>per&ograve; che andasse ver&rsquo; lo suo diletto</p>\n<p>la sposa di colui ch&rsquo;ad alte grida</p>\n<p>dispos&ograve; lei col sangue benedetto,</p></div>\n\n<div class="stanza"><p>in s&eacute; sicura e anche a lui pi&ugrave; fida,</p>\n<p>due principi ordin&ograve; in suo favore,</p>\n<p>che quinci e quindi le fosser per guida.</p></div>\n\n<div class="stanza"><p>L&rsquo;un fu tutto serafico in ardore;</p>\n<p>l&rsquo;altro per sap&iuml;enza in terra fue</p>\n<p>di cherubica luce uno splendore.</p></div>\n\n<div class="stanza"><p>De l&rsquo;un dir&ograve;, per&ograve; che d&rsquo;amendue</p>\n<p>si dice l&rsquo;un pregiando, qual ch&rsquo;om prende,</p>\n<p>perch&rsquo; ad un fine fur l&rsquo;opere sue.</p></div>\n\n<div class="stanza"><p>Intra Tupino e l&rsquo;acqua che discende</p>\n<p>del colle eletto dal beato Ubaldo,</p>\n<p>fertile costa d&rsquo;alto monte pende,</p></div>\n\n<div class="stanza"><p>onde Perugia sente freddo e caldo</p>\n<p>da Porta Sole; e di rietro le piange</p>\n<p>per grave giogo Nocera con Gualdo.</p></div>\n\n<div class="stanza"><p>Di questa costa, l&agrave; dov&rsquo; ella frange</p>\n<p>pi&ugrave; sua rattezza, nacque al mondo un sole,</p>\n<p>come fa questo talvolta di Gange.</p></div>\n\n<div class="stanza"><p>Per&ograve; chi d&rsquo;esso loco fa parole,</p>\n<p>non dica Ascesi, ch&eacute; direbbe corto,</p>\n<p>ma Or&iuml;ente, se proprio dir vuole.</p></div>\n\n<div class="stanza"><p>Non era ancor molto lontan da l&rsquo;orto,</p>\n<p>ch&rsquo;el cominci&ograve; a far sentir la terra</p>\n<p>de la sua gran virtute alcun conforto;</p></div>\n\n<div class="stanza"><p>ch&eacute; per tal donna, giovinetto, in guerra</p>\n<p>del padre corse, a cui, come a la morte,</p>\n<p>la porta del piacer nessun diserra;</p></div>\n\n<div class="stanza"><p>e dinanzi a la sua spirital corte</p>\n<p>et coram patre le si fece unito;</p>\n<p>poscia di d&igrave; in d&igrave; l&rsquo;am&ograve; pi&ugrave; forte.</p></div>\n\n<div class="stanza"><p>Questa, privata del primo marito,</p>\n<p>millecent&rsquo; anni e pi&ugrave; dispetta e scura</p>\n<p>fino a costui si stette sanza invito;</p></div>\n\n<div class="stanza"><p>n&eacute; valse udir che la trov&ograve; sicura</p>\n<p>con Amiclate, al suon de la sua voce,</p>\n<p>colui ch&rsquo;a tutto &rsquo;l mondo f&eacute; paura;</p></div>\n\n<div class="stanza"><p>n&eacute; valse esser costante n&eacute; feroce,</p>\n<p>s&igrave; che, dove Maria rimase giuso,</p>\n<p>ella con Cristo pianse in su la croce.</p></div>\n\n<div class="stanza"><p>Ma perch&rsquo; io non proceda troppo chiuso,</p>\n<p>Francesco e Povert&agrave; per questi amanti</p>\n<p>prendi oramai nel mio parlar diffuso.</p></div>\n\n<div class="stanza"><p>La lor concordia e i lor lieti sembianti,</p>\n<p>amore e maraviglia e dolce sguardo</p>\n<p>facieno esser cagion di pensier santi;</p></div>\n\n<div class="stanza"><p>tanto che &rsquo;l venerabile Bernardo</p>\n<p>si scalz&ograve; prima, e dietro a tanta pace</p>\n<p>corse e, correndo, li parve esser tardo.</p></div>\n\n<div class="stanza"><p>Oh ignota ricchezza! oh ben ferace!</p>\n<p>Scalzasi Egidio, scalzasi Silvestro</p>\n<p>dietro a lo sposo, s&igrave; la sposa piace.</p></div>\n\n<div class="stanza"><p>Indi sen va quel padre e quel maestro</p>\n<p>con la sua donna e con quella famiglia</p>\n<p>che gi&agrave; legava l&rsquo;umile capestro.</p></div>\n\n<div class="stanza"><p>N&eacute; li grav&ograve; vilt&agrave; di cuor le ciglia</p>\n<p>per esser fi&rsquo; di Pietro Bernardone,</p>\n<p>n&eacute; per parer dispetto a maraviglia;</p></div>\n\n<div class="stanza"><p>ma regalmente sua dura intenzione</p>\n<p>ad Innocenzio aperse, e da lui ebbe</p>\n<p>primo sigillo a sua relig&iuml;one.</p></div>\n\n<div class="stanza"><p>Poi che la gente poverella crebbe</p>\n<p>dietro a costui, la cui mirabil vita</p>\n<p>meglio in gloria del ciel si canterebbe,</p></div>\n\n<div class="stanza"><p>di seconda corona redimita</p>\n<p>fu per Onorio da l&rsquo;Etterno Spiro</p>\n<p>la santa voglia d&rsquo;esto archimandrita.</p></div>\n\n<div class="stanza"><p>E poi che, per la sete del martiro,</p>\n<p>ne la presenza del Soldan superba</p>\n<p>predic&ograve; Cristo e li altri che &rsquo;l seguiro,</p></div>\n\n<div class="stanza"><p>e per trovare a conversione acerba</p>\n<p>troppo la gente e per non stare indarno,</p>\n<p>redissi al frutto de l&rsquo;italica erba,</p></div>\n\n<div class="stanza"><p>nel crudo sasso intra Tevero e Arno</p>\n<p>da Cristo prese l&rsquo;ultimo sigillo,</p>\n<p>che le sue membra due anni portarno.</p></div>\n\n<div class="stanza"><p>Quando a colui ch&rsquo;a tanto ben sortillo</p>\n<p>piacque di trarlo suso a la mercede</p>\n<p>ch&rsquo;el merit&ograve; nel suo farsi pusillo,</p></div>\n\n<div class="stanza"><p>a&rsquo; frati suoi, s&igrave; com&rsquo; a giuste rede,</p>\n<p>raccomand&ograve; la donna sua pi&ugrave; cara,</p>\n<p>e comand&ograve; che l&rsquo;amassero a fede;</p></div>\n\n<div class="stanza"><p>e del suo grembo l&rsquo;anima preclara</p>\n<p>mover si volle, tornando al suo regno,</p>\n<p>e al suo corpo non volle altra bara.</p></div>\n\n<div class="stanza"><p>Pensa oramai qual fu colui che degno</p>\n<p>collega fu a mantener la barca</p>\n<p>di Pietro in alto mar per dritto segno;</p></div>\n\n<div class="stanza"><p>e questo fu il nostro patr&iuml;arca;</p>\n<p>per che qual segue lui, com&rsquo; el comanda,</p>\n<p>discerner puoi che buone merce carca.</p></div>\n\n<div class="stanza"><p>Ma &rsquo;l suo pecuglio di nova vivanda</p>\n<p>&egrave; fatto ghiotto, s&igrave; ch&rsquo;esser non puote</p>\n<p>che per diversi salti non si spanda;</p></div>\n\n<div class="stanza"><p>e quanto le sue pecore remote</p>\n<p>e vagabunde pi&ugrave; da esso vanno,</p>\n<p>pi&ugrave; tornano a l&rsquo;ovil di latte v&ograve;te.</p></div>\n\n<div class="stanza"><p>Ben son di quelle che temono &rsquo;l danno</p>\n<p>e stringonsi al pastor; ma son s&igrave; poche,</p>\n<p>che le cappe fornisce poco panno.</p></div>\n\n<div class="stanza"><p>Or, se le mie parole non son fioche,</p>\n<p>se la tua aud&iuml;enza &egrave; stata attenta,</p>\n<p>se ci&ograve; ch&rsquo;&egrave; detto a la mente revoche,</p></div>\n\n<div class="stanza"><p>in parte fia la tua voglia contenta,</p>\n<p>perch&eacute; vedrai la pianta onde si scheggia,</p>\n<p>e vedra&rsquo; il corr&egrave;gger che argomenta</p></div>\n\n<div class="stanza"><p>&ldquo;U&rsquo; ben s&rsquo;impingua, se non si vaneggia&rdquo;&raquo;.</p></div>','<p class="cantohead">Canto XII</p>\n\n<div class="stanza"><p>S&igrave; tosto come l&rsquo;ultima parola</p>\n<p>la benedetta fiamma per dir tolse,</p>\n<p>a rotar cominci&ograve; la santa mola;</p></div>\n\n<div class="stanza"><p>e nel suo giro tutta non si volse</p>\n<p>prima ch&rsquo;un&rsquo;altra di cerchio la chiuse,</p>\n<p>e moto a moto e canto a canto colse;</p></div>\n\n<div class="stanza"><p>canto che tanto vince nostre muse,</p>\n<p>nostre serene in quelle dolci tube,</p>\n<p>quanto primo splendor quel ch&rsquo;e&rsquo; refuse.</p></div>\n\n<div class="stanza"><p>Come si volgon per tenera nube</p>\n<p>due archi paralelli e concolori,</p>\n<p>quando Iunone a sua ancella iube,</p></div>\n\n<div class="stanza"><p>nascendo di quel d&rsquo;entro quel di fori,</p>\n<p>a guisa del parlar di quella vaga</p>\n<p>ch&rsquo;amor consunse come sol vapori,</p></div>\n\n<div class="stanza"><p>e fanno qui la gente esser presaga,</p>\n<p>per lo patto che Dio con No&egrave; puose,</p>\n<p>del mondo che gi&agrave; mai pi&ugrave; non s&rsquo;allaga:</p></div>\n\n<div class="stanza"><p>cos&igrave; di quelle sempiterne rose</p>\n<p>volgiensi circa noi le due ghirlande,</p>\n<p>e s&igrave; l&rsquo;estrema a l&rsquo;intima rispuose.</p></div>\n\n<div class="stanza"><p>Poi che &rsquo;l tripudio e l&rsquo;altra festa grande,</p>\n<p>s&igrave; del cantare e s&igrave; del fiammeggiarsi</p>\n<p>luce con luce gaud&iuml;ose e blande,</p></div>\n\n<div class="stanza"><p>insieme a punto e a voler quetarsi,</p>\n<p>pur come li occhi ch&rsquo;al piacer che i move</p>\n<p>conviene insieme chiudere e levarsi;</p></div>\n\n<div class="stanza"><p>del cor de l&rsquo;una de le luci nove</p>\n<p>si mosse voce, che l&rsquo;ago a la stella</p>\n<p>parer mi fece in volgermi al suo dove;</p></div>\n\n<div class="stanza"><p>e cominci&ograve;: &laquo;L&rsquo;amor che mi fa bella</p>\n<p>mi tragge a ragionar de l&rsquo;altro duca</p>\n<p>per cui del mio s&igrave; ben ci si favella.</p></div>\n\n<div class="stanza"><p>Degno &egrave; che, dov&rsquo; &egrave; l&rsquo;un, l&rsquo;altro s&rsquo;induca:</p>\n<p>s&igrave; che, com&rsquo; elli ad una militaro,</p>\n<p>cos&igrave; la gloria loro insieme luca.</p></div>\n\n<div class="stanza"><p>L&rsquo;essercito di Cristo, che s&igrave; caro</p>\n<p>cost&ograve; a r&iuml;armar, dietro a la &rsquo;nsegna</p>\n<p>si movea tardo, sospeccioso e raro,</p></div>\n\n<div class="stanza"><p>quando lo &rsquo;mperador che sempre regna</p>\n<p>provide a la milizia, ch&rsquo;era in forse,</p>\n<p>per sola grazia, non per esser degna;</p></div>\n\n<div class="stanza"><p>e, come &egrave; detto, a sua sposa soccorse</p>\n<p>con due campioni, al cui fare, al cui dire</p>\n<p>lo popol disv&iuml;ato si raccorse.</p></div>\n\n<div class="stanza"><p>In quella parte ove surge ad aprire</p>\n<p>Zefiro dolce le novelle fronde</p>\n<p>di che si vede Europa rivestire,</p></div>\n\n<div class="stanza"><p>non molto lungi al percuoter de l&rsquo;onde</p>\n<p>dietro a le quali, per la lunga foga,</p>\n<p>lo sol talvolta ad ogne uom si nasconde,</p></div>\n\n<div class="stanza"><p>siede la fortunata Calaroga</p>\n<p>sotto la protezion del grande scudo</p>\n<p>in che soggiace il leone e soggioga:</p></div>\n\n<div class="stanza"><p>dentro vi nacque l&rsquo;amoroso drudo</p>\n<p>de la fede cristiana, il santo atleta</p>\n<p>benigno a&rsquo; suoi e a&rsquo; nemici crudo;</p></div>\n\n<div class="stanza"><p>e come fu creata, fu repleta</p>\n<p>s&igrave; la sua mente di viva vertute</p>\n<p>che, ne la madre, lei fece profeta.</p></div>\n\n<div class="stanza"><p>Poi che le sponsalizie fuor compiute</p>\n<p>al sacro fonte intra lui e la Fede,</p>\n<p>u&rsquo; si dotar di mut&uuml;a salute,</p></div>\n\n<div class="stanza"><p>la donna che per lui l&rsquo;assenso diede,</p>\n<p>vide nel sonno il mirabile frutto</p>\n<p>ch&rsquo;uscir dovea di lui e de le rede;</p></div>\n\n<div class="stanza"><p>e perch&eacute; fosse qual era in costrutto,</p>\n<p>quinci si mosse spirito a nomarlo</p>\n<p>del possessivo di cui era tutto.</p></div>\n\n<div class="stanza"><p>Domenico fu detto; e io ne parlo</p>\n<p>s&igrave; come de l&rsquo;agricola che Cristo</p>\n<p>elesse a l&rsquo;orto suo per aiutarlo.</p></div>\n\n<div class="stanza"><p>Ben parve messo e famigliar di Cristo:</p>\n<p>che &rsquo;l primo amor che &rsquo;n lui fu manifesto,</p>\n<p>fu al primo consiglio che di&egrave; Cristo.</p></div>\n\n<div class="stanza"><p>Spesse f&iuml;ate fu tacito e desto</p>\n<p>trovato in terra da la sua nutrice,</p>\n<p>come dicesse: &lsquo;Io son venuto a questo&rsquo;.</p></div>\n\n<div class="stanza"><p>Oh padre suo veramente Felice!</p>\n<p>oh madre sua veramente Giovanna,</p>\n<p>se, interpretata, val come si dice!</p></div>\n\n<div class="stanza"><p>Non per lo mondo, per cui mo s&rsquo;affanna</p>\n<p>di retro ad Ost&iuml;ense e a Taddeo,</p>\n<p>ma per amor de la verace manna</p></div>\n\n<div class="stanza"><p>in picciol tempo gran dottor si feo;</p>\n<p>tal che si mise a circ&uuml;ir la vigna</p>\n<p>che tosto imbianca, se &rsquo;l vignaio &egrave; reo.</p></div>\n\n<div class="stanza"><p>E a la sedia che fu gi&agrave; benigna</p>\n<p>pi&ugrave; a&rsquo; poveri giusti, non per lei,</p>\n<p>ma per colui che siede, che traligna,</p></div>\n\n<div class="stanza"><p>non dispensare o due o tre per sei,</p>\n<p>non la fortuna di prima vacante,</p>\n<p>non decimas, quae sunt pauperum Dei,</p></div>\n\n<div class="stanza"><p>addimand&ograve;, ma contro al mondo errante</p>\n<p>licenza di combatter per lo seme</p>\n<p>del qual ti fascian ventiquattro piante.</p></div>\n\n<div class="stanza"><p>Poi, con dottrina e con volere insieme,</p>\n<p>con l&rsquo;officio appostolico si mosse</p>\n<p>quasi torrente ch&rsquo;alta vena preme;</p></div>\n\n<div class="stanza"><p>e ne li sterpi eretici percosse</p>\n<p>l&rsquo;impeto suo, pi&ugrave; vivamente quivi</p>\n<p>dove le resistenze eran pi&ugrave; grosse.</p></div>\n\n<div class="stanza"><p>Di lui si fecer poi diversi rivi</p>\n<p>onde l&rsquo;orto catolico si riga,</p>\n<p>s&igrave; che i suoi arbuscelli stan pi&ugrave; vivi.</p></div>\n\n<div class="stanza"><p>Se tal fu l&rsquo;una rota de la biga</p>\n<p>in che la Santa Chiesa si difese</p>\n<p>e vinse in campo la sua civil briga,</p></div>\n\n<div class="stanza"><p>ben ti dovrebbe assai esser palese</p>\n<p>l&rsquo;eccellenza de l&rsquo;altra, di cui Tomma</p>\n<p>dinanzi al mio venir fu s&igrave; cortese.</p></div>\n\n<div class="stanza"><p>Ma l&rsquo;orbita che f&eacute; la parte somma</p>\n<p>di sua circunferenza, &egrave; derelitta,</p>\n<p>s&igrave; ch&rsquo;&egrave; la muffa dov&rsquo; era la gromma.</p></div>\n\n<div class="stanza"><p>La sua famiglia, che si mosse dritta</p>\n<p>coi piedi a le sue orme, &egrave; tanto volta,</p>\n<p>che quel dinanzi a quel di retro gitta;</p></div>\n\n<div class="stanza"><p>e tosto si vedr&agrave; de la ricolta</p>\n<p>de la mala coltura, quando il loglio</p>\n<p>si lagner&agrave; che l&rsquo;arca li sia tolta.</p></div>\n\n<div class="stanza"><p>Ben dico, chi cercasse a foglio a foglio</p>\n<p>nostro volume, ancor troveria carta</p>\n<p>u&rsquo; leggerebbe &ldquo;I&rsquo; mi son quel ch&rsquo;i&rsquo; soglio&rdquo;;</p></div>\n\n<div class="stanza"><p>ma non fia da Casal n&eacute; d&rsquo;Acquasparta,</p>\n<p>l&agrave; onde vegnon tali a la scrittura,</p>\n<p>ch&rsquo;uno la fugge e altro la coarta.</p></div>\n\n<div class="stanza"><p>Io son la vita di Bonaventura</p>\n<p>da Bagnoregio, che ne&rsquo; grandi offici</p>\n<p>sempre pospuosi la sinistra cura.</p></div>\n\n<div class="stanza"><p>Illuminato e Augustin son quici,</p>\n<p>che fuor de&rsquo; primi scalzi poverelli</p>\n<p>che nel capestro a Dio si fero amici.</p></div>\n\n<div class="stanza"><p>Ugo da San Vittore &egrave; qui con elli,</p>\n<p>e Pietro Mangiadore e Pietro Spano,</p>\n<p>lo qual gi&ugrave; luce in dodici libelli;</p></div>\n\n<div class="stanza"><p>Nat&agrave;n profeta e &rsquo;l metropolitano</p>\n<p>Crisostomo e Anselmo e quel Donato</p>\n<p>ch&rsquo;a la prim&rsquo; arte degn&ograve; porre mano.</p></div>\n\n<div class="stanza"><p>Rabano &egrave; qui, e lucemi dallato</p>\n<p>il calavrese abate Giovacchino</p>\n<p>di spirito profetico dotato.</p></div>\n\n<div class="stanza"><p>Ad inveggiar cotanto paladino</p>\n<p>mi mosse l&rsquo;infiammata cortesia</p>\n<p>di fra Tommaso e &rsquo;l discreto latino;</p></div>\n\n<div class="stanza"><p>e mosse meco questa compagnia&raquo;.</p></div>','<p class="cantohead">Canto XIII</p>\n\n<div class="stanza"><p>Imagini, chi bene intender cupe</p>\n<p>quel ch&rsquo;i&rsquo; or vidi&mdash;e ritegna l&rsquo;image,</p>\n<p>mentre ch&rsquo;io dico, come ferma rupe&mdash;,</p></div>\n\n<div class="stanza"><p>quindici stelle che &rsquo;n diverse plage</p>\n<p>lo ciel avvivan di tanto sereno</p>\n<p>che soperchia de l&rsquo;aere ogne compage;</p></div>\n\n<div class="stanza"><p>imagini quel carro a cu&rsquo; il seno</p>\n<p>basta del nostro cielo e notte e giorno,</p>\n<p>s&igrave; ch&rsquo;al volger del temo non vien meno;</p></div>\n\n<div class="stanza"><p>imagini la bocca di quel corno</p>\n<p>che si comincia in punta de lo stelo</p>\n<p>a cui la prima rota va dintorno,</p></div>\n\n<div class="stanza"><p>aver fatto di s&eacute; due segni in cielo,</p>\n<p>qual fece la figliuola di Minoi</p>\n<p>allora che sent&igrave; di morte il gelo;</p></div>\n\n<div class="stanza"><p>e l&rsquo;un ne l&rsquo;altro aver li raggi suoi,</p>\n<p>e amendue girarsi per maniera</p>\n<p>che l&rsquo;uno andasse al primo e l&rsquo;altro al poi;</p></div>\n\n<div class="stanza"><p>e avr&agrave; quasi l&rsquo;ombra de la vera</p>\n<p>costellazione e de la doppia danza</p>\n<p>che circulava il punto dov&rsquo; io era:</p></div>\n\n<div class="stanza"><p>poi ch&rsquo;&egrave; tanto di l&agrave; da nostra usanza,</p>\n<p>quanto di l&agrave; dal mover de la Chiana</p>\n<p>si move il ciel che tutti li altri avanza.</p></div>\n\n<div class="stanza"><p>L&igrave; si cant&ograve; non Bacco, non Peana,</p>\n<p>ma tre persone in divina natura,</p>\n<p>e in una persona essa e l&rsquo;umana.</p></div>\n\n<div class="stanza"><p>Compi&eacute; &rsquo;l cantare e &rsquo;l volger sua misura;</p>\n<p>e attesersi a noi quei santi lumi,</p>\n<p>felicitando s&eacute; di cura in cura.</p></div>\n\n<div class="stanza"><p>Ruppe il silenzio ne&rsquo; concordi numi</p>\n<p>poscia la luce in che mirabil vita</p>\n<p>del poverel di Dio narrata fumi,</p></div>\n\n<div class="stanza"><p>e disse: &laquo;Quando l&rsquo;una paglia &egrave; trita,</p>\n<p>quando la sua semenza &egrave; gi&agrave; riposta,</p>\n<p>a batter l&rsquo;altra dolce amor m&rsquo;invita.</p></div>\n\n<div class="stanza"><p>Tu credi che nel petto onde la costa</p>\n<p>si trasse per formar la bella guancia</p>\n<p>il cui palato a tutto &rsquo;l mondo costa,</p></div>\n\n<div class="stanza"><p>e in quel che, forato da la lancia,</p>\n<p>e prima e poscia tanto sodisfece,</p>\n<p>che d&rsquo;ogne colpa vince la bilancia,</p></div>\n\n<div class="stanza"><p>quantunque a la natura umana lece</p>\n<p>aver di lume, tutto fosse infuso</p>\n<p>da quel valor che l&rsquo;uno e l&rsquo;altro fece;</p></div>\n\n<div class="stanza"><p>e per&ograve; miri a ci&ograve; ch&rsquo;io dissi suso,</p>\n<p>quando narrai che non ebbe &rsquo;l secondo</p>\n<p>lo ben che ne la quinta luce &egrave; chiuso.</p></div>\n\n<div class="stanza"><p>Or apri li occhi a quel ch&rsquo;io ti rispondo,</p>\n<p>e vedr&auml;i il tuo credere e &rsquo;l mio dire</p>\n<p>nel vero farsi come centro in tondo.</p></div>\n\n<div class="stanza"><p>Ci&ograve; che non more e ci&ograve; che pu&ograve; morire</p>\n<p>non &egrave; se non splendor di quella idea</p>\n<p>che partorisce, amando, il nostro Sire;</p></div>\n\n<div class="stanza"><p>ch&eacute; quella viva luce che s&igrave; mea</p>\n<p>dal suo lucente, che non si disuna</p>\n<p>da lui n&eacute; da l&rsquo;amor ch&rsquo;a lor s&rsquo;intrea,</p></div>\n\n<div class="stanza"><p>per sua bontate il suo raggiare aduna,</p>\n<p>quasi specchiato, in nove sussistenze,</p>\n<p>etternalmente rimanendosi una.</p></div>\n\n<div class="stanza"><p>Quindi discende a l&rsquo;ultime potenze</p>\n<p>gi&ugrave; d&rsquo;atto in atto, tanto divenendo,</p>\n<p>che pi&ugrave; non fa che brevi contingenze;</p></div>\n\n<div class="stanza"><p>e queste contingenze essere intendo</p>\n<p>le cose generate, che produce</p>\n<p>con seme e sanza seme il ciel movendo.</p></div>\n\n<div class="stanza"><p>La cera di costoro e chi la duce</p>\n<p>non sta d&rsquo;un modo; e per&ograve; sotto &rsquo;l segno</p>\n<p>id&euml;ale poi pi&ugrave; e men traluce.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; elli avvien ch&rsquo;un medesimo legno,</p>\n<p>secondo specie, meglio e peggio frutta;</p>\n<p>e voi nascete con diverso ingegno.</p></div>\n\n<div class="stanza"><p>Se fosse a punto la cera dedutta</p>\n<p>e fosse il cielo in sua virt&ugrave; supprema,</p>\n<p>la luce del suggel parrebbe tutta;</p></div>\n\n<div class="stanza"><p>ma la natura la d&agrave; sempre scema,</p>\n<p>similemente operando a l&rsquo;artista</p>\n<p>ch&rsquo;a l&rsquo;abito de l&rsquo;arte ha man che trema.</p></div>\n\n<div class="stanza"><p>Per&ograve; se &rsquo;l caldo amor la chiara vista</p>\n<p>de la prima virt&ugrave; dispone e segna,</p>\n<p>tutta la perfezion quivi s&rsquo;acquista.</p></div>\n\n<div class="stanza"><p>Cos&igrave; fu fatta gi&agrave; la terra degna</p>\n<p>di tutta l&rsquo;animal perfez&iuml;one;</p>\n<p>cos&igrave; fu fatta la Vergine pregna;</p></div>\n\n<div class="stanza"><p>s&igrave; ch&rsquo;io commendo tua oppin&iuml;one,</p>\n<p>che l&rsquo;umana natura mai non fue</p>\n<p>n&eacute; fia qual fu in quelle due persone.</p></div>\n\n<div class="stanza"><p>Or s&rsquo;i&rsquo; non procedesse avanti pi&ugrave;e,</p>\n<p>&lsquo;Dunque, come costui fu sanza pare?&rsquo;</p>\n<p>comincerebber le parole tue.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; paia ben ci&ograve; che non pare,</p>\n<p>pensa chi era, e la cagion che &rsquo;l mosse,</p>\n<p>quando fu detto &ldquo;Chiedi&rdquo;, a dimandare.</p></div>\n\n<div class="stanza"><p>Non ho parlato s&igrave;, che tu non posse</p>\n<p>ben veder ch&rsquo;el fu re, che chiese senno</p>\n<p>acci&ograve; che re suffic&iuml;ente fosse;</p></div>\n\n<div class="stanza"><p>non per sapere il numero in che enno</p>\n<p>li motor di qua s&ugrave;, o se necesse</p>\n<p>con contingente mai necesse fenno;</p></div>\n\n<div class="stanza"><p>non si est dare primum motum esse,</p>\n<p>o se del mezzo cerchio far si puote</p>\n<p>tr&iuml;angol s&igrave; ch&rsquo;un retto non avesse.</p></div>\n\n<div class="stanza"><p>Onde, se ci&ograve; ch&rsquo;io dissi e questo note,</p>\n<p>regal prudenza &egrave; quel vedere impari</p>\n<p>in che lo stral di mia intenzion percuote;</p></div>\n\n<div class="stanza"><p>e se al &ldquo;surse&rdquo; drizzi li occhi chiari,</p>\n<p>vedrai aver solamente respetto</p>\n<p>ai regi, che son molti, e &rsquo; buon son rari.</p></div>\n\n<div class="stanza"><p>Con questa distinzion prendi &rsquo;l mio detto;</p>\n<p>e cos&igrave; puote star con quel che credi</p>\n<p>del primo padre e del nostro Diletto.</p></div>\n\n<div class="stanza"><p>E questo ti sia sempre piombo a&rsquo; piedi,</p>\n<p>per farti mover lento com&rsquo; uom lasso</p>\n<p>e al s&igrave; e al no che tu non vedi:</p></div>\n\n<div class="stanza"><p>ch&eacute; quelli &egrave; tra li stolti bene a basso,</p>\n<p>che sanza distinzione afferma e nega</p>\n<p>ne l&rsquo;un cos&igrave; come ne l&rsquo;altro passo;</p></div>\n\n<div class="stanza"><p>perch&rsquo; elli &rsquo;ncontra che pi&ugrave; volte piega</p>\n<p>l&rsquo;oppin&iuml;on corrente in falsa parte,</p>\n<p>e poi l&rsquo;affetto l&rsquo;intelletto lega.</p></div>\n\n<div class="stanza"><p>Vie pi&ugrave; che &rsquo;ndarno da riva si parte,</p>\n<p>perch&eacute; non torna tal qual e&rsquo; si move,</p>\n<p>chi pesca per lo vero e non ha l&rsquo;arte.</p></div>\n\n<div class="stanza"><p>E di ci&ograve; sono al mondo aperte prove</p>\n<p>Parmenide, Melisso e Brisso e molti,</p>\n<p>li quali andaro e non sap&euml;an dove;</p></div>\n\n<div class="stanza"><p>s&igrave; f&eacute; Sabellio e Arrio e quelli stolti</p>\n<p>che furon come spade a le Scritture</p>\n<p>in render torti li diritti volti.</p></div>\n\n<div class="stanza"><p>Non sien le genti, ancor, troppo sicure</p>\n<p>a giudicar, s&igrave; come quei che stima</p>\n<p>le biade in campo pria che sien mature;</p></div>\n\n<div class="stanza"><p>ch&rsquo;i&rsquo; ho veduto tutto &rsquo;l verno prima</p>\n<p>lo prun mostrarsi rigido e feroce,</p>\n<p>poscia portar la rosa in su la cima;</p></div>\n\n<div class="stanza"><p>e legno vidi gi&agrave; dritto e veloce</p>\n<p>correr lo mar per tutto suo cammino,</p>\n<p>perire al fine a l&rsquo;intrar de la foce.</p></div>\n\n<div class="stanza"><p>Non creda donna Berta e ser Martino,</p>\n<p>per vedere un furare, altro offerere,</p>\n<p>vederli dentro al consiglio divino;</p></div>\n\n<div class="stanza"><p>ch&eacute; quel pu&ograve; surgere, e quel pu&ograve; cadere&raquo;.</p></div>','<p class="cantohead">Canto XIV</p>\n\n<div class="stanza"><p>Dal centro al cerchio, e s&igrave; dal cerchio al centro</p>\n<p>movesi l&rsquo;acqua in un ritondo vaso,</p>\n<p>secondo ch&rsquo;&egrave; percosso fuori o dentro:</p></div>\n\n<div class="stanza"><p>ne la mia mente f&eacute; s&ugrave;bito caso</p>\n<p>questo ch&rsquo;io dico, s&igrave; come si tacque</p>\n<p>la glor&iuml;osa vita di Tommaso,</p></div>\n\n<div class="stanza"><p>per la similitudine che nacque</p>\n<p>del suo parlare e di quel di Beatrice,</p>\n<p>a cui s&igrave; cominciar, dopo lui, piacque:</p></div>\n\n<div class="stanza"><p>&laquo;A costui fa mestieri, e nol vi dice</p>\n<p>n&eacute; con la voce n&eacute; pensando ancora,</p>\n<p>d&rsquo;un altro vero andare a la radice.</p></div>\n\n<div class="stanza"><p>Diteli se la luce onde s&rsquo;infiora</p>\n<p>vostra sustanza, rimarr&agrave; con voi</p>\n<p>etternalmente s&igrave; com&rsquo; ell&rsquo; &egrave; ora;</p></div>\n\n<div class="stanza"><p>e se rimane, dite come, poi</p>\n<p>che sarete visibili rifatti,</p>\n<p>esser por&agrave; ch&rsquo;al veder non vi n&ograve;i&raquo;.</p></div>\n\n<div class="stanza"><p>Come, da pi&ugrave; letizia pinti e tratti,</p>\n<p>a la f&iuml;ata quei che vanno a rota</p>\n<p>levan la voce e rallegrano li atti,</p></div>\n\n<div class="stanza"><p>cos&igrave;, a l&rsquo;orazion pronta e divota,</p>\n<p>li santi cerchi mostrar nova gioia</p>\n<p>nel torneare e ne la mira nota.</p></div>\n\n<div class="stanza"><p>Qual si lamenta perch&eacute; qui si moia</p>\n<p>per viver col&agrave; s&ugrave;, non vide quive</p>\n<p>lo refrigerio de l&rsquo;etterna ploia.</p></div>\n\n<div class="stanza"><p>Quell&rsquo; uno e due e tre che sempre vive</p>\n<p>e regna sempre in tre e &rsquo;n due e &rsquo;n uno,</p>\n<p>non circunscritto, e tutto circunscrive,</p></div>\n\n<div class="stanza"><p>tre volte era cantato da ciascuno</p>\n<p>di quelli spirti con tal melodia,</p>\n<p>ch&rsquo;ad ogne merto saria giusto muno.</p></div>\n\n<div class="stanza"><p>E io udi&rsquo; ne la luce pi&ugrave; dia</p>\n<p>del minor cerchio una voce modesta,</p>\n<p>forse qual fu da l&rsquo;angelo a Maria,</p></div>\n\n<div class="stanza"><p>risponder: &laquo;Quanto fia lunga la festa</p>\n<p>di paradiso, tanto il nostro amore</p>\n<p>si ragger&agrave; dintorno cotal vesta.</p></div>\n\n<div class="stanza"><p>La sua chiarezza s&eacute;guita l&rsquo;ardore;</p>\n<p>l&rsquo;ardor la vis&iuml;one, e quella &egrave; tanta,</p>\n<p>quant&rsquo; ha di grazia sovra suo valore.</p></div>\n\n<div class="stanza"><p>Come la carne glor&iuml;osa e santa</p>\n<p>fia rivestita, la nostra persona</p>\n<p>pi&ugrave; grata fia per esser tutta quanta;</p></div>\n\n<div class="stanza"><p>per che s&rsquo;accrescer&agrave; ci&ograve; che ne dona</p>\n<p>di grat&uuml;ito lume il sommo bene,</p>\n<p>lume ch&rsquo;a lui veder ne condiziona;</p></div>\n\n<div class="stanza"><p>onde la vis&iuml;on crescer convene,</p>\n<p>crescer l&rsquo;ardor che di quella s&rsquo;accende,</p>\n<p>crescer lo raggio che da esso vene.</p></div>\n\n<div class="stanza"><p>Ma s&igrave; come carbon che fiamma rende,</p>\n<p>e per vivo candor quella soverchia,</p>\n<p>s&igrave; che la sua parvenza si difende;</p></div>\n\n<div class="stanza"><p>cos&igrave; questo folg&oacute;r che gi&agrave; ne cerchia</p>\n<p>fia vinto in apparenza da la carne</p>\n<p>che tutto d&igrave; la terra ricoperchia;</p></div>\n\n<div class="stanza"><p>n&eacute; potr&agrave; tanta luce affaticarne:</p>\n<p>ch&eacute; li organi del corpo saran forti</p>\n<p>a tutto ci&ograve; che potr&agrave; dilettarne&raquo;.</p></div>\n\n<div class="stanza"><p>Tanto mi parver s&ugrave;biti e accorti</p>\n<p>e l&rsquo;uno e l&rsquo;altro coro a dicer &laquo;Amme!&raquo;,</p>\n<p>che ben mostrar disio d&rsquo;i corpi morti:</p></div>\n\n<div class="stanza"><p>forse non pur per lor, ma per le mamme,</p>\n<p>per li padri e per li altri che fuor cari</p>\n<p>anzi che fosser sempiterne fiamme.</p></div>\n\n<div class="stanza"><p>Ed ecco intorno, di chiarezza pari,</p>\n<p>nascere un lustro sopra quel che v&rsquo;era,</p>\n<p>per guisa d&rsquo;orizzonte che rischiari.</p></div>\n\n<div class="stanza"><p>E s&igrave; come al salir di prima sera</p>\n<p>comincian per lo ciel nove parvenze,</p>\n<p>s&igrave; che la vista pare e non par vera,</p></div>\n\n<div class="stanza"><p>parvemi l&igrave; novelle sussistenze</p>\n<p>cominciare a vedere, e fare un giro</p>\n<p>di fuor da l&rsquo;altre due circunferenze.</p></div>\n\n<div class="stanza"><p>Oh vero sfavillar del Santo Spiro!</p>\n<p>come si fece s&ugrave;bito e candente</p>\n<p>a li occhi miei che, vinti, nol soffriro!</p></div>\n\n<div class="stanza"><p>Ma B&euml;atrice s&igrave; bella e ridente</p>\n<p>mi si mostr&ograve;, che tra quelle vedute</p>\n<p>si vuol lasciar che non seguir la mente.</p></div>\n\n<div class="stanza"><p>Quindi ripreser li occhi miei virtute</p>\n<p>a rilevarsi; e vidimi translato</p>\n<p>sol con mia donna in pi&ugrave; alta salute.</p></div>\n\n<div class="stanza"><p>Ben m&rsquo;accors&rsquo; io ch&rsquo;io era pi&ugrave; levato,</p>\n<p>per l&rsquo;affocato riso de la stella,</p>\n<p>che mi parea pi&ugrave; roggio che l&rsquo;usato.</p></div>\n\n<div class="stanza"><p>Con tutto &rsquo;l core e con quella favella</p>\n<p>ch&rsquo;&egrave; una in tutti, a Dio feci olocausto,</p>\n<p>qual conveniesi a la grazia novella.</p></div>\n\n<div class="stanza"><p>E non er&rsquo; anco del mio petto essausto</p>\n<p>l&rsquo;ardor del sacrificio, ch&rsquo;io conobbi</p>\n<p>esso litare stato accetto e fausto;</p></div>\n\n<div class="stanza"><p>ch&eacute; con tanto lucore e tanto robbi</p>\n<p>m&rsquo;apparvero splendor dentro a due raggi,</p>\n<p>ch&rsquo;io dissi: &laquo;O El&iuml;&ograve;s che s&igrave; li addobbi!&raquo;.</p></div>\n\n<div class="stanza"><p>Come distinta da minori e maggi</p>\n<p>lumi biancheggia tra &rsquo; poli del mondo</p>\n<p>Galassia s&igrave;, che fa dubbiar ben saggi;</p></div>\n\n<div class="stanza"><p>s&igrave; costellati facean nel profondo</p>\n<p>Marte quei raggi il venerabil segno</p>\n<p>che fan giunture di quadranti in tondo.</p></div>\n\n<div class="stanza"><p>Qui vince la memoria mia lo &rsquo;ngegno;</p>\n<p>ch&eacute; quella croce lampeggiava Cristo,</p>\n<p>s&igrave; ch&rsquo;io non so trovare essempro degno;</p></div>\n\n<div class="stanza"><p>ma chi prende sua croce e segue Cristo,</p>\n<p>ancor mi scuser&agrave; di quel ch&rsquo;io lasso,</p>\n<p>vedendo in quell&rsquo; albor balenar Cristo.</p></div>\n\n<div class="stanza"><p>Di corno in corno e tra la cima e &rsquo;l basso</p>\n<p>si movien lumi, scintillando forte</p>\n<p>nel congiugnersi insieme e nel trapasso:</p></div>\n\n<div class="stanza"><p>cos&igrave; si veggion qui diritte e torte,</p>\n<p>veloci e tarde, rinovando vista,</p>\n<p>le minuzie d&rsquo;i corpi, lunghe e corte,</p></div>\n\n<div class="stanza"><p>moversi per lo raggio onde si lista</p>\n<p>talvolta l&rsquo;ombra che, per sua difesa,</p>\n<p>la gente con ingegno e arte acquista.</p></div>\n\n<div class="stanza"><p>E come giga e arpa, in tempra tesa</p>\n<p>di molte corde, fa dolce tintinno</p>\n<p>a tal da cui la nota non &egrave; intesa,</p></div>\n\n<div class="stanza"><p>cos&igrave; da&rsquo; lumi che l&igrave; m&rsquo;apparinno</p>\n<p>s&rsquo;accogliea per la croce una melode</p>\n<p>che mi rapiva, sanza intender l&rsquo;inno.</p></div>\n\n<div class="stanza"><p>Ben m&rsquo;accors&rsquo; io ch&rsquo;elli era d&rsquo;alte lode,</p>\n<p>per&ograve; ch&rsquo;a me ven&igrave;a &laquo;Resurgi&raquo; e &laquo;Vinci&raquo;</p>\n<p>come a colui che non intende e ode.</p></div>\n\n<div class="stanza"><p>&Iuml;o m&rsquo;innamorava tanto quinci,</p>\n<p>che &rsquo;nfino a l&igrave; non fu alcuna cosa</p>\n<p>che mi legasse con s&igrave; dolci vinci.</p></div>\n\n<div class="stanza"><p>Forse la mia parola par troppo osa,</p>\n<p>posponendo il piacer de li occhi belli,</p>\n<p>ne&rsquo; quai mirando mio disio ha posa;</p></div>\n\n<div class="stanza"><p>ma chi s&rsquo;avvede che i vivi suggelli</p>\n<p>d&rsquo;ogne bellezza pi&ugrave; fanno pi&ugrave; suso,</p>\n<p>e ch&rsquo;io non m&rsquo;era l&igrave; rivolto a quelli,</p></div>\n\n<div class="stanza"><p>escusar puommi di quel ch&rsquo;io m&rsquo;accuso</p>\n<p>per escusarmi, e vedermi dir vero:</p>\n<p>ch&eacute; &rsquo;l piacer santo non &egrave; qui dischiuso,</p></div>\n\n<div class="stanza"><p>perch&eacute; si fa, montando, pi&ugrave; sincero.</p></div>','<p class="cantohead">Canto XV</p>\n\n<div class="stanza"><p>Benigna volontade in che si liqua</p>\n<p>sempre l&rsquo;amor che drittamente spira,</p>\n<p>come cupidit&agrave; fa ne la iniqua,</p></div>\n\n<div class="stanza"><p>silenzio puose a quella dolce lira,</p>\n<p>e fece qu&iuml;etar le sante corde</p>\n<p>che la destra del cielo allenta e tira.</p></div>\n\n<div class="stanza"><p>Come saranno a&rsquo; giusti preghi sorde</p>\n<p>quelle sustanze che, per darmi voglia</p>\n<p>ch&rsquo;io le pregassi, a tacer fur concorde?</p></div>\n\n<div class="stanza"><p>Bene &egrave; che sanza termine si doglia</p>\n<p>chi, per amor di cosa che non duri</p>\n<p>etternalmente, quello amor si spoglia.</p></div>\n\n<div class="stanza"><p>Quale per li seren tranquilli e puri</p>\n<p>discorre ad ora ad or s&ugrave;bito foco,</p>\n<p>movendo li occhi che stavan sicuri,</p></div>\n\n<div class="stanza"><p>e pare stella che tramuti loco,</p>\n<p>se non che da la parte ond&rsquo; e&rsquo; s&rsquo;accende</p>\n<p>nulla sen perde, ed esso dura poco:</p></div>\n\n<div class="stanza"><p>tale dal corno che &rsquo;n destro si stende</p>\n<p>a pi&egrave; di quella croce corse un astro</p>\n<p>de la costellazion che l&igrave; resplende;</p></div>\n\n<div class="stanza"><p>n&eacute; si part&igrave; la gemma dal suo nastro,</p>\n<p>ma per la lista rad&iuml;al trascorse,</p>\n<p>che parve foco dietro ad alabastro.</p></div>\n\n<div class="stanza"><p>S&igrave; p&iuml;a l&rsquo;ombra d&rsquo;Anchise si porse,</p>\n<p>se fede merta nostra maggior musa,</p>\n<p>quando in Eliso del figlio s&rsquo;accorse.</p></div>\n\n<div class="stanza"><p>&laquo;O sanguis meus, o superinfusa</p>\n<p>grat&iuml;a De&iuml;, sicut tibi cui</p>\n<p>bis unquam celi ian&uuml;a reclusa?&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; quel lume: ond&rsquo; io m&rsquo;attesi a lui;</p>\n<p>poscia rivolsi a la mia donna il viso,</p>\n<p>e quinci e quindi stupefatto fui;</p></div>\n\n<div class="stanza"><p>ch&eacute; dentro a li occhi suoi ardeva un riso</p>\n<p>tal, ch&rsquo;io pensai co&rsquo; miei toccar lo fondo</p>\n<p>de la mia gloria e del mio paradiso.</p></div>\n\n<div class="stanza"><p>Indi, a udire e a veder giocondo,</p>\n<p>giunse lo spirto al suo principio cose,</p>\n<p>ch&rsquo;io non lo &rsquo;ntesi, s&igrave; parl&ograve; profondo;</p></div>\n\n<div class="stanza"><p>n&eacute; per elez&iuml;on mi si nascose,</p>\n<p>ma per necessit&agrave;, ch&eacute; &rsquo;l suo concetto</p>\n<p>al segno d&rsquo;i mortal si soprapuose.</p></div>\n\n<div class="stanza"><p>E quando l&rsquo;arco de l&rsquo;ardente affetto</p>\n<p>fu s&igrave; sfogato, che &rsquo;l parlar discese</p>\n<p>inver&rsquo; lo segno del nostro intelletto,</p></div>\n\n<div class="stanza"><p>la prima cosa che per me s&rsquo;intese,</p>\n<p>&laquo;Benedetto sia tu&raquo;, fu, &laquo;trino e uno,</p>\n<p>che nel mio seme se&rsquo; tanto cortese!&raquo;.</p></div>\n\n<div class="stanza"><p>E segu&igrave;: &laquo;Grato e lontano digiuno,</p>\n<p>tratto leggendo del magno volume</p>\n<p>du&rsquo; non si muta mai bianco n&eacute; bruno,</p></div>\n\n<div class="stanza"><p>solvuto hai, figlio, dentro a questo lume</p>\n<p>in ch&rsquo;io ti parlo, merc&egrave; di colei</p>\n<p>ch&rsquo;a l&rsquo;alto volo ti vest&igrave; le piume.</p></div>\n\n<div class="stanza"><p>Tu credi che a me tuo pensier mei</p>\n<p>da quel ch&rsquo;&egrave; primo, cos&igrave; come raia</p>\n<p>da l&rsquo;un, se si conosce, il cinque e &rsquo;l sei;</p></div>\n\n<div class="stanza"><p>e per&ograve; ch&rsquo;io mi sia e perch&rsquo; io paia</p>\n<p>pi&ugrave; gaud&iuml;oso a te, non mi domandi,</p>\n<p>che alcun altro in questa turba gaia.</p></div>\n\n<div class="stanza"><p>Tu credi &rsquo;l vero; ch&eacute; i minori e &rsquo; grandi</p>\n<p>di questa vita miran ne lo speglio</p>\n<p>in che, prima che pensi, il pensier pandi;</p></div>\n\n<div class="stanza"><p>ma perch&eacute; &rsquo;l sacro amore in che io veglio</p>\n<p>con perpet&uuml;a vista e che m&rsquo;asseta</p>\n<p>di dolce dis&iuml;ar, s&rsquo;adempia meglio,</p></div>\n\n<div class="stanza"><p>la voce tua sicura, balda e lieta</p>\n<p>suoni la volont&agrave;, suoni &rsquo;l disio,</p>\n<p>a che la mia risposta &egrave; gi&agrave; decreta!&raquo;.</p></div>\n\n<div class="stanza"><p>Io mi volsi a Beatrice, e quella udio</p>\n<p>pria ch&rsquo;io parlassi, e arrisemi un cenno</p>\n<p>che fece crescer l&rsquo;ali al voler mio.</p></div>\n\n<div class="stanza"><p>Poi cominciai cos&igrave;: &laquo;L&rsquo;affetto e &rsquo;l senno,</p>\n<p>come la prima equalit&agrave; v&rsquo;apparse,</p>\n<p>d&rsquo;un peso per ciascun di voi si fenno,</p></div>\n\n<div class="stanza"><p>per&ograve; che &rsquo;l sol che v&rsquo;allum&ograve; e arse,</p>\n<p>col caldo e con la luce &egrave; s&igrave; iguali,</p>\n<p>che tutte simiglianze sono scarse.</p></div>\n\n<div class="stanza"><p>Ma voglia e argomento ne&rsquo; mortali,</p>\n<p>per la cagion ch&rsquo;a voi &egrave; manifesta,</p>\n<p>diversamente son pennuti in ali;</p></div>\n\n<div class="stanza"><p>ond&rsquo; io, che son mortal, mi sento in questa</p>\n<p>disagguaglianza, e per&ograve; non ringrazio</p>\n<p>se non col core a la paterna festa.</p></div>\n\n<div class="stanza"><p>Ben supplico io a te, vivo topazio</p>\n<p>che questa gioia prez&iuml;osa ingemmi,</p>\n<p>perch&eacute; mi facci del tuo nome sazio&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O fronda mia in che io compiacemmi</p>\n<p>pur aspettando, io fui la tua radice&raquo;:</p>\n<p>cotal principio, rispondendo, femmi.</p></div>\n\n<div class="stanza"><p>Poscia mi disse: &laquo;Quel da cui si dice</p>\n<p>tua cognazione e che cent&rsquo; anni e pi&ugrave;e</p>\n<p>girato ha &rsquo;l monte in la prima cornice,</p></div>\n\n<div class="stanza"><p>mio figlio fu e tuo bisavol fue:</p>\n<p>ben si convien che la lunga fatica</p>\n<p>tu li raccorci con l&rsquo;opere tue.</p></div>\n\n<div class="stanza"><p>Fiorenza dentro da la cerchia antica,</p>\n<p>ond&rsquo; ella toglie ancora e terza e nona,</p>\n<p>si stava in pace, sobria e pudica.</p></div>\n\n<div class="stanza"><p>Non avea catenella, non corona,</p>\n<p>non gonne contigiate, non cintura</p>\n<p>che fosse a veder pi&ugrave; che la persona.</p></div>\n\n<div class="stanza"><p>Non faceva, nascendo, ancor paura</p>\n<p>la figlia al padre, che &rsquo;l tempo e la dote</p>\n<p>non fuggien quinci e quindi la misura.</p></div>\n\n<div class="stanza"><p>Non avea case di famiglia v&ograve;te;</p>\n<p>non v&rsquo;era giunto ancor Sardanapalo</p>\n<p>a mostrar ci&ograve; che &rsquo;n camera si puote.</p></div>\n\n<div class="stanza"><p>Non era vinto ancora Montemalo</p>\n<p>dal vostro Uccellatoio, che, com&rsquo; &egrave; vinto</p>\n<p>nel montar s&ugrave;, cos&igrave; sar&agrave; nel calo.</p></div>\n\n<div class="stanza"><p>Bellincion Berti vid&rsquo; io andar cinto</p>\n<p>di cuoio e d&rsquo;osso, e venir da lo specchio</p>\n<p>la donna sua sanza &rsquo;l viso dipinto;</p></div>\n\n<div class="stanza"><p>e vidi quel d&rsquo;i Nerli e quel del Vecchio</p>\n<p>esser contenti a la pelle scoperta,</p>\n<p>e le sue donne al fuso e al pennecchio.</p></div>\n\n<div class="stanza"><p>Oh fortunate! ciascuna era certa</p>\n<p>de la sua sepultura, e ancor nulla</p>\n<p>era per Francia nel letto diserta.</p></div>\n\n<div class="stanza"><p>L&rsquo;una vegghiava a studio de la culla,</p>\n<p>e, consolando, usava l&rsquo;id&iuml;oma</p>\n<p>che prima i padri e le madri trastulla;</p></div>\n\n<div class="stanza"><p>l&rsquo;altra, traendo a la rocca la chioma,</p>\n<p>favoleggiava con la sua famiglia</p>\n<p>d&rsquo;i Troiani, di Fiesole e di Roma.</p></div>\n\n<div class="stanza"><p>Saria tenuta allor tal maraviglia</p>\n<p>una Cianghella, un Lapo Salterello,</p>\n<p>qual or saria Cincinnato e Corniglia.</p></div>\n\n<div class="stanza"><p>A cos&igrave; riposato, a cos&igrave; bello</p>\n<p>viver di cittadini, a cos&igrave; fida</p>\n<p>cittadinanza, a cos&igrave; dolce ostello,</p></div>\n\n<div class="stanza"><p>Maria mi di&egrave;, chiamata in alte grida;</p>\n<p>e ne l&rsquo;antico vostro Batisteo</p>\n<p>insieme fui cristiano e Cacciaguida.</p></div>\n\n<div class="stanza"><p>Moronto fu mio frate ed Eliseo;</p>\n<p>mia donna venne a me di val di Pado,</p>\n<p>e quindi il sopranome tuo si feo.</p></div>\n\n<div class="stanza"><p>Poi seguitai lo &rsquo;mperador Currado;</p>\n<p>ed el mi cinse de la sua milizia,</p>\n<p>tanto per bene ovrar li venni in grado.</p></div>\n\n<div class="stanza"><p>Dietro li andai incontro a la nequizia</p>\n<p>di quella legge il cui popolo usurpa,</p>\n<p>per colpa d&rsquo;i pastor, vostra giustizia.</p></div>\n\n<div class="stanza"><p>Quivi fu&rsquo; io da quella gente turpa</p>\n<p>disviluppato dal mondo fallace,</p>\n<p>lo cui amor molt&rsquo; anime deturpa;</p></div>\n\n<div class="stanza"><p>e venni dal martiro a questa pace&raquo;.</p></div>','<p class="cantohead">Canto XVI</p>\n\n<div class="stanza"><p>O poca nostra nobilt&agrave; di sangue,</p>\n<p>se glor&iuml;ar di te la gente fai</p>\n<p>qua gi&ugrave; dove l&rsquo;affetto nostro langue,</p></div>\n\n<div class="stanza"><p>mirabil cosa non mi sar&agrave; mai:</p>\n<p>ch&eacute; l&agrave; dove appetito non si torce,</p>\n<p>dico nel cielo, io me ne gloriai.</p></div>\n\n<div class="stanza"><p>Ben se&rsquo; tu manto che tosto raccorce:</p>\n<p>s&igrave; che, se non s&rsquo;appon di d&igrave; in die,</p>\n<p>lo tempo va dintorno con le force.</p></div>\n\n<div class="stanza"><p>Dal &lsquo;voi&rsquo; che prima a Roma s&rsquo;offerie,</p>\n<p>in che la sua famiglia men persevra,</p>\n<p>ricominciaron le parole mie;</p></div>\n\n<div class="stanza"><p>onde Beatrice, ch&rsquo;era un poco scevra,</p>\n<p>ridendo, parve quella che tossio</p>\n<p>al primo fallo scritto di Ginevra.</p></div>\n\n<div class="stanza"><p>Io cominciai: &laquo;Voi siete il padre mio;</p>\n<p>voi mi date a parlar tutta baldezza;</p>\n<p>voi mi levate s&igrave;, ch&rsquo;i&rsquo; son pi&ugrave; ch&rsquo;io.</p></div>\n\n<div class="stanza"><p>Per tanti rivi s&rsquo;empie d&rsquo;allegrezza</p>\n<p>la mente mia, che di s&eacute; fa letizia</p>\n<p>perch&eacute; pu&ograve; sostener che non si spezza.</p></div>\n\n<div class="stanza"><p>Ditemi dunque, cara mia primizia,</p>\n<p>quai fuor li vostri antichi e quai fuor li anni</p>\n<p>che si segnaro in vostra p&uuml;erizia;</p></div>\n\n<div class="stanza"><p>ditemi de l&rsquo;ovil di San Giovanni</p>\n<p>quanto era allora, e chi eran le genti</p>\n<p>tra esso degne di pi&ugrave; alti scanni&raquo;.</p></div>\n\n<div class="stanza"><p>Come s&rsquo;avviva a lo spirar d&rsquo;i venti</p>\n<p>carbone in fiamma, cos&igrave; vid&rsquo; io quella</p>\n<p>luce risplendere a&rsquo; miei blandimenti;</p></div>\n\n<div class="stanza"><p>e come a li occhi miei si f&eacute; pi&ugrave; bella,</p>\n<p>cos&igrave; con voce pi&ugrave; dolce e soave,</p>\n<p>ma non con questa moderna favella,</p></div>\n\n<div class="stanza"><p>dissemi: &laquo;Da quel d&igrave; che fu detto &lsquo;Ave&rsquo;</p>\n<p>al parto in che mia madre, ch&rsquo;&egrave; or santa,</p>\n<p>s&rsquo;allev&iuml;&ograve; di me ond&rsquo; era grave,</p></div>\n\n<div class="stanza"><p>al suo Leon cinquecento cinquanta</p>\n<p>e trenta fiate venne questo foco</p>\n<p>a rinfiammarsi sotto la sua pianta.</p></div>\n\n<div class="stanza"><p>Li antichi miei e io nacqui nel loco</p>\n<p>dove si truova pria l&rsquo;ultimo sesto</p>\n<p>da quei che corre il vostro ann&uuml;al gioco.</p></div>\n\n<div class="stanza"><p>Basti d&rsquo;i miei maggiori udirne questo:</p>\n<p>chi ei si fosser e onde venner quivi,</p>\n<p>pi&ugrave; &egrave; tacer che ragionare onesto.</p></div>\n\n<div class="stanza"><p>Tutti color ch&rsquo;a quel tempo eran ivi</p>\n<p>da poter arme tra Marte e &rsquo;l Batista,</p>\n<p>eran il quinto di quei ch&rsquo;or son vivi.</p></div>\n\n<div class="stanza"><p>Ma la cittadinanza, ch&rsquo;&egrave; or mista</p>\n<p>di Campi, di Certaldo e di Fegghine,</p>\n<p>pura vediesi ne l&rsquo;ultimo artista.</p></div>\n\n<div class="stanza"><p>Oh quanto fora meglio esser vicine</p>\n<p>quelle genti ch&rsquo;io dico, e al Galluzzo</p>\n<p>e a Trespiano aver vostro confine,</p></div>\n\n<div class="stanza"><p>che averle dentro e sostener lo puzzo</p>\n<p>del villan d&rsquo;Aguglion, di quel da Signa,</p>\n<p>che gi&agrave; per barattare ha l&rsquo;occhio aguzzo!</p></div>\n\n<div class="stanza"><p>Se la gente ch&rsquo;al mondo pi&ugrave; traligna</p>\n<p>non fosse stata a Cesare noverca,</p>\n<p>ma come madre a suo figlio benigna,</p></div>\n\n<div class="stanza"><p>tal fatto &egrave; fiorentino e cambia e merca,</p>\n<p>che si sarebbe v&ograve;lto a Simifonti,</p>\n<p>l&agrave; dove andava l&rsquo;avolo a la cerca;</p></div>\n\n<div class="stanza"><p>sariesi Montemurlo ancor de&rsquo; Conti;</p>\n<p>sarieno i Cerchi nel piovier d&rsquo;Acone,</p>\n<p>e forse in Valdigrieve i Buondelmonti.</p></div>\n\n<div class="stanza"><p>Sempre la confusion de le persone</p>\n<p>principio fu del mal de la cittade,</p>\n<p>come del vostro il cibo che s&rsquo;appone;</p></div>\n\n<div class="stanza"><p>e cieco toro pi&ugrave; avaccio cade</p>\n<p>che cieco agnello; e molte volte taglia</p>\n<p>pi&ugrave; e meglio una che le cinque spade.</p></div>\n\n<div class="stanza"><p>Se tu riguardi Luni e Orbisaglia</p>\n<p>come sono ite, e come se ne vanno</p>\n<p>di retro ad esse Chiusi e Sinigaglia,</p></div>\n\n<div class="stanza"><p>udir come le schiatte si disfanno</p>\n<p>non ti parr&agrave; nova cosa n&eacute; forte,</p>\n<p>poscia che le cittadi termine hanno.</p></div>\n\n<div class="stanza"><p>Le vostre cose tutte hanno lor morte,</p>\n<p>s&igrave; come voi; ma celasi in alcuna</p>\n<p>che dura molto, e le vite son corte.</p></div>\n\n<div class="stanza"><p>E come &rsquo;l volger del ciel de la luna</p>\n<p>cuopre e discuopre i liti sanza posa,</p>\n<p>cos&igrave; fa di Fiorenza la Fortuna:</p></div>\n\n<div class="stanza"><p>per che non dee parer mirabil cosa</p>\n<p>ci&ograve; ch&rsquo;io dir&ograve; de li alti Fiorentini</p>\n<p>onde &egrave; la fama nel tempo nascosa.</p></div>\n\n<div class="stanza"><p>Io vidi li Ughi e vidi i Catellini,</p>\n<p>Filippi, Greci, Ormanni e Alberichi,</p>\n<p>gi&agrave; nel calare, illustri cittadini;</p></div>\n\n<div class="stanza"><p>e vidi cos&igrave; grandi come antichi,</p>\n<p>con quel de la Sannella, quel de l&rsquo;Arca,</p>\n<p>e Soldanieri e Ardinghi e Bostichi.</p></div>\n\n<div class="stanza"><p>Sovra la porta ch&rsquo;al presente &egrave; carca</p>\n<p>di nova fellonia di tanto peso</p>\n<p>che tosto fia iattura de la barca,</p></div>\n\n<div class="stanza"><p>erano i Ravignani, ond&rsquo; &egrave; disceso</p>\n<p>il conte Guido e qualunque del nome</p>\n<p>de l&rsquo;alto Bellincione ha poscia preso.</p></div>\n\n<div class="stanza"><p>Quel de la Pressa sapeva gi&agrave; come</p>\n<p>regger si vuole, e avea Galigaio</p>\n<p>dorata in casa sua gi&agrave; l&rsquo;elsa e &rsquo;l pome.</p></div>\n\n<div class="stanza"><p>Grand&rsquo; era gi&agrave; la colonna del Vaio,</p>\n<p>Sacchetti, Giuochi, Fifanti e Barucci</p>\n<p>e Galli e quei ch&rsquo;arrossan per lo staio.</p></div>\n\n<div class="stanza"><p>Lo ceppo di che nacquero i Calfucci</p>\n<p>era gi&agrave; grande, e gi&agrave; eran tratti</p>\n<p>a le curule Sizii e Arrigucci.</p></div>\n\n<div class="stanza"><p>Oh quali io vidi quei che son disfatti</p>\n<p>per lor superbia! e le palle de l&rsquo;oro</p>\n<p>fiorian Fiorenza in tutt&rsquo; i suoi gran fatti.</p></div>\n\n<div class="stanza"><p>Cos&igrave; facieno i padri di coloro</p>\n<p>che, sempre che la vostra chiesa vaca,</p>\n<p>si fanno grassi stando a consistoro.</p></div>\n\n<div class="stanza"><p>L&rsquo;oltracotata schiatta che s&rsquo;indraca</p>\n<p>dietro a chi fugge, e a chi mostra &rsquo;l dente</p>\n<p>o ver la borsa, com&rsquo; agnel si placa,</p></div>\n\n<div class="stanza"><p>gi&agrave; ven&igrave;a s&ugrave;, ma di picciola gente;</p>\n<p>s&igrave; che non piacque ad Ubertin Donato</p>\n<p>che po&iuml; il suocero il f&eacute; lor parente.</p></div>\n\n<div class="stanza"><p>Gi&agrave; era &rsquo;l Caponsacco nel mercato</p>\n<p>disceso gi&ugrave; da Fiesole, e gi&agrave; era</p>\n<p>buon cittadino Giuda e Infangato.</p></div>\n\n<div class="stanza"><p>Io dir&ograve; cosa incredibile e vera:</p>\n<p>nel picciol cerchio s&rsquo;entrava per porta</p>\n<p>che si nomava da quei de la Pera.</p></div>\n\n<div class="stanza"><p>Ciascun che de la bella insegna porta</p>\n<p>del gran barone il cui nome e &rsquo;l cui pregio</p>\n<p>la festa di Tommaso riconforta,</p></div>\n\n<div class="stanza"><p>da esso ebbe milizia e privilegio;</p>\n<p>avvegna che con popol si rauni</p>\n<p>oggi colui che la fascia col fregio.</p></div>\n\n<div class="stanza"><p>Gi&agrave; eran Gualterotti e Importuni;</p>\n<p>e ancor saria Borgo pi&ugrave; qu&iuml;eto,</p>\n<p>se di novi vicin fosser digiuni.</p></div>\n\n<div class="stanza"><p>La casa di che nacque il vostro fleto,</p>\n<p>per lo giusto disdegno che v&rsquo;ha morti</p>\n<p>e puose fine al vostro viver lieto,</p></div>\n\n<div class="stanza"><p>era onorata, essa e suoi consorti:</p>\n<p>o Buondelmonte, quanto mal fuggisti</p>\n<p>le nozze s&uuml;e per li altrui conforti!</p></div>\n\n<div class="stanza"><p>Molti sarebber lieti, che son tristi,</p>\n<p>se Dio t&rsquo;avesse conceduto ad Ema</p>\n<p>la prima volta ch&rsquo;a citt&agrave; venisti.</p></div>\n\n<div class="stanza"><p>Ma conveniesi a quella pietra scema</p>\n<p>che guarda &rsquo;l ponte, che Fiorenza fesse</p>\n<p>vittima ne la sua pace postrema.</p></div>\n\n<div class="stanza"><p>Con queste genti, e con altre con esse,</p>\n<p>vid&rsquo; io Fiorenza in s&igrave; fatto riposo,</p>\n<p>che non avea cagione onde piangesse.</p></div>\n\n<div class="stanza"><p>Con queste genti vid&rsquo;io glor&iuml;oso</p>\n<p>e giusto il popol suo, tanto che &rsquo;l giglio</p>\n<p>non era ad asta mai posto a ritroso,</p></div>\n\n<div class="stanza"><p>n&eacute; per divis&iuml;on fatto vermiglio&raquo;.</p></div>','<p class="cantohead">Canto XVII</p>\n\n<div class="stanza"><p>Qual venne a Climen&egrave;, per accertarsi</p>\n<p>di ci&ograve; ch&rsquo;av&euml;a incontro a s&eacute; udito,</p>\n<p>quei ch&rsquo;ancor fa li padri ai figli scarsi;</p></div>\n\n<div class="stanza"><p>tal era io, e tal era sentito</p>\n<p>e da Beatrice e da la santa lampa</p>\n<p>che pria per me avea mutato sito.</p></div>\n\n<div class="stanza"><p>Per che mia donna &laquo;Manda fuor la vampa</p>\n<p>del tuo disio&raquo;, mi disse, &laquo;s&igrave; ch&rsquo;ella esca</p>\n<p>segnata bene de la interna stampa:</p></div>\n\n<div class="stanza"><p>non perch&eacute; nostra conoscenza cresca</p>\n<p>per tuo parlare, ma perch&eacute; t&rsquo;ausi</p>\n<p>a dir la sete, s&igrave; che l&rsquo;uom ti mesca&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O cara piota mia che s&igrave; t&rsquo;insusi,</p>\n<p>che, come veggion le terrene menti</p>\n<p>non capere in tr&iuml;angol due ottusi,</p></div>\n\n<div class="stanza"><p>cos&igrave; vedi le cose contingenti</p>\n<p>anzi che sieno in s&eacute;, mirando il punto</p>\n<p>a cui tutti li tempi son presenti;</p></div>\n\n<div class="stanza"><p>mentre ch&rsquo;io era a Virgilio congiunto</p>\n<p>su per lo monte che l&rsquo;anime cura</p>\n<p>e discendendo nel mondo defunto,</p></div>\n\n<div class="stanza"><p>dette mi fuor di mia vita futura</p>\n<p>parole gravi, avvegna ch&rsquo;io mi senta</p>\n<p>ben tetragono ai colpi di ventura;</p></div>\n\n<div class="stanza"><p>per che la voglia mia saria contenta</p>\n<p>d&rsquo;intender qual fortuna mi s&rsquo;appressa:</p>\n<p>ch&eacute; saetta previsa vien pi&ugrave; lenta&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; diss&rsquo; io a quella luce stessa</p>\n<p>che pria m&rsquo;avea parlato; e come volle</p>\n<p>Beatrice, fu la mia voglia confessa.</p></div>\n\n<div class="stanza"><p>N&eacute; per ambage, in che la gente folle</p>\n<p>gi&agrave; s&rsquo;inviscava pria che fosse anciso</p>\n<p>l&rsquo;Agnel di Dio che le peccata tolle,</p></div>\n\n<div class="stanza"><p>ma per chiare parole e con preciso</p>\n<p>latin rispuose quello amor paterno,</p>\n<p>chiuso e parvente del suo proprio riso:</p></div>\n\n<div class="stanza"><p>&laquo;La contingenza, che fuor del quaderno</p>\n<p>de la vostra matera non si stende,</p>\n<p>tutta &egrave; dipinta nel cospetto etterno;</p></div>\n\n<div class="stanza"><p>necessit&agrave; per&ograve; quindi non prende</p>\n<p>se non come dal viso in che si specchia</p>\n<p>nave che per torrente gi&ugrave; discende.</p></div>\n\n<div class="stanza"><p>Da indi, s&igrave; come viene ad orecchia</p>\n<p>dolce armonia da organo, mi viene</p>\n<p>a vista il tempo che ti s&rsquo;apparecchia.</p></div>\n\n<div class="stanza"><p>Qual si partio Ipolito d&rsquo;Atene</p>\n<p>per la spietata e perfida noverca,</p>\n<p>tal di Fiorenza partir ti convene.</p></div>\n\n<div class="stanza"><p>Questo si vuole e questo gi&agrave; si cerca,</p>\n<p>e tosto verr&agrave; fatto a chi ci&ograve; pensa</p>\n<p>l&agrave; dove Cristo tutto d&igrave; si merca.</p></div>\n\n<div class="stanza"><p>La colpa seguir&agrave; la parte offensa</p>\n<p>in grido, come suol; ma la vendetta</p>\n<p>fia testimonio al ver che la dispensa.</p></div>\n\n<div class="stanza"><p>Tu lascerai ogne cosa diletta</p>\n<p>pi&ugrave; caramente; e questo &egrave; quello strale</p>\n<p>che l&rsquo;arco de lo essilio pria saetta.</p></div>\n\n<div class="stanza"><p>Tu proverai s&igrave; come sa di sale</p>\n<p>lo pane altrui, e come &egrave; duro calle</p>\n<p>lo scendere e &rsquo;l salir per l&rsquo;altrui scale.</p></div>\n\n<div class="stanza"><p>E quel che pi&ugrave; ti graver&agrave; le spalle,</p>\n<p>sar&agrave; la compagnia malvagia e scempia</p>\n<p>con la qual tu cadrai in questa valle;</p></div>\n\n<div class="stanza"><p>che tutta ingrata, tutta matta ed empia</p>\n<p>si far&agrave; contr&rsquo; a te; ma, poco appresso,</p>\n<p>ella, non tu, n&rsquo;avr&agrave; rossa la tempia.</p></div>\n\n<div class="stanza"><p>Di sua bestialitate il suo processo</p>\n<p>far&agrave; la prova; s&igrave; ch&rsquo;a te fia bello</p>\n<p>averti fatta parte per te stesso.</p></div>\n\n<div class="stanza"><p>Lo primo tuo refugio e &rsquo;l primo ostello</p>\n<p>sar&agrave; la cortesia del gran Lombardo</p>\n<p>che &rsquo;n su la scala porta il santo uccello;</p></div>\n\n<div class="stanza"><p>ch&rsquo;in te avr&agrave; s&igrave; benigno riguardo,</p>\n<p>che del fare e del chieder, tra voi due,</p>\n<p>fia primo quel che tra li altri &egrave; pi&ugrave; tardo.</p></div>\n\n<div class="stanza"><p>Con lui vedrai colui che &rsquo;mpresso fue,</p>\n<p>nascendo, s&igrave; da questa stella forte,</p>\n<p>che notabili fier l&rsquo;opere sue.</p></div>\n\n<div class="stanza"><p>Non se ne son le genti ancora accorte</p>\n<p>per la novella et&agrave;, ch&eacute; pur nove anni</p>\n<p>son queste rote intorno di lui torte;</p></div>\n\n<div class="stanza"><p>ma pria che &rsquo;l Guasco l&rsquo;alto Arrigo inganni,</p>\n<p>parran faville de la sua virtute</p>\n<p>in non curar d&rsquo;argento n&eacute; d&rsquo;affanni.</p></div>\n\n<div class="stanza"><p>Le sue magnificenze conosciute</p>\n<p>saranno ancora, s&igrave; che &rsquo; suoi nemici</p>\n<p>non ne potran tener le lingue mute.</p></div>\n\n<div class="stanza"><p>A lui t&rsquo;aspetta e a&rsquo; suoi benefici;</p>\n<p>per lui fia trasmutata molta gente,</p>\n<p>cambiando condizion ricchi e mendici;</p></div>\n\n<div class="stanza"><p>e portera&rsquo;ne scritto ne la mente</p>\n<p>di lui, e nol dirai&raquo;; e disse cose</p>\n<p>incredibili a quei che fier presente.</p></div>\n\n<div class="stanza"><p>Poi giunse: &laquo;Figlio, queste son le chiose</p>\n<p>di quel che ti fu detto; ecco le &rsquo;nsidie</p>\n<p>che dietro a pochi giri son nascose.</p></div>\n\n<div class="stanza"><p>Non vo&rsquo; per&ograve; ch&rsquo;a&rsquo; tuoi vicini invidie,</p>\n<p>poscia che s&rsquo;infutura la tua vita</p>\n<p>vie pi&ugrave; l&agrave; che &rsquo;l punir di lor perfidie&raquo;.</p></div>\n\n<div class="stanza"><p>Poi che, tacendo, si mostr&ograve; spedita</p>\n<p>l&rsquo;anima santa di metter la trama</p>\n<p>in quella tela ch&rsquo;io le porsi ordita,</p></div>\n\n<div class="stanza"><p>io cominciai, come colui che brama,</p>\n<p>dubitando, consiglio da persona</p>\n<p>che vede e vuol dirittamente e ama:</p></div>\n\n<div class="stanza"><p>&laquo;Ben veggio, padre mio, s&igrave; come sprona</p>\n<p>lo tempo verso me, per colpo darmi</p>\n<p>tal, ch&rsquo;&egrave; pi&ugrave; grave a chi pi&ugrave; s&rsquo;abbandona;</p></div>\n\n<div class="stanza"><p>per che di provedenza &egrave; buon ch&rsquo;io m&rsquo;armi,</p>\n<p>s&igrave; che, se loco m&rsquo;&egrave; tolto pi&ugrave; caro,</p>\n<p>io non perdessi li altri per miei carmi.</p></div>\n\n<div class="stanza"><p>Gi&ugrave; per lo mondo sanza fine amaro,</p>\n<p>e per lo monte del cui bel cacume</p>\n<p>li occhi de la mia donna mi levaro,</p></div>\n\n<div class="stanza"><p>e poscia per lo ciel, di lume in lume,</p>\n<p>ho io appreso quel che s&rsquo;io ridico,</p>\n<p>a molti fia sapor di forte agrume;</p></div>\n\n<div class="stanza"><p>e s&rsquo;io al vero son timido amico,</p>\n<p>temo di perder viver tra coloro</p>\n<p>che questo tempo chiameranno antico&raquo;.</p></div>\n\n<div class="stanza"><p>La luce in che rideva il mio tesoro</p>\n<p>ch&rsquo;io trovai l&igrave;, si f&eacute; prima corusca,</p>\n<p>quale a raggio di sole specchio d&rsquo;oro;</p></div>\n\n<div class="stanza"><p>indi rispuose: &laquo;Cosc&iuml;enza fusca</p>\n<p>o de la propria o de l&rsquo;altrui vergogna</p>\n<p>pur sentir&agrave; la tua parola brusca.</p></div>\n\n<div class="stanza"><p>Ma nondimen, rimossa ogne menzogna,</p>\n<p>tutta tua vis&iuml;on fa manifesta;</p>\n<p>e lascia pur grattar dov&rsquo; &egrave; la rogna.</p></div>\n\n<div class="stanza"><p>Ch&eacute; se la voce tua sar&agrave; molesta</p>\n<p>nel primo gusto, vital nodrimento</p>\n<p>lascer&agrave; poi, quando sar&agrave; digesta.</p></div>\n\n<div class="stanza"><p>Questo tuo grido far&agrave; come vento,</p>\n<p>che le pi&ugrave; alte cime pi&ugrave; percuote;</p>\n<p>e ci&ograve; non fa d&rsquo;onor poco argomento.</p></div>\n\n<div class="stanza"><p>Per&ograve; ti son mostrate in queste rote,</p>\n<p>nel monte e ne la valle dolorosa</p>\n<p>pur l&rsquo;anime che son di fama note,</p></div>\n\n<div class="stanza"><p>che l&rsquo;animo di quel ch&rsquo;ode, non posa</p>\n<p>n&eacute; ferma fede per essempro ch&rsquo;aia</p>\n<p>la sua radice incognita e ascosa,</p></div>\n\n<div class="stanza"><p>n&eacute; per altro argomento che non paia&raquo;.</p></div>','<p class="cantohead">Canto XVIII</p>\n\n<div class="stanza"><p>Gi&agrave; si godeva solo del suo verbo</p>\n<p>quello specchio beato, e io gustava</p>\n<p>lo mio, temprando col dolce l&rsquo;acerbo;</p></div>\n\n<div class="stanza"><p>e quella donna ch&rsquo;a Dio mi menava</p>\n<p>disse: &laquo;Muta pensier; pensa ch&rsquo;i&rsquo; sono</p>\n<p>presso a colui ch&rsquo;ogne torto disgrava&raquo;.</p></div>\n\n<div class="stanza"><p>Io mi rivolsi a l&rsquo;amoroso suono</p>\n<p>del mio conforto; e qual io allor vidi</p>\n<p>ne li occhi santi amor, qui l&rsquo;abbandono:</p></div>\n\n<div class="stanza"><p>non perch&rsquo; io pur del mio parlar diffidi,</p>\n<p>ma per la mente che non pu&ograve; redire</p>\n<p>sovra s&eacute; tanto, s&rsquo;altri non la guidi.</p></div>\n\n<div class="stanza"><p>Tanto poss&rsquo; io di quel punto ridire,</p>\n<p>che, rimirando lei, lo mio affetto</p>\n<p>libero fu da ogne altro disire,</p></div>\n\n<div class="stanza"><p>fin che &rsquo;l piacere etterno, che diretto</p>\n<p>raggiava in B&euml;atrice, dal bel viso</p>\n<p>mi contentava col secondo aspetto.</p></div>\n\n<div class="stanza"><p>Vincendo me col lume d&rsquo;un sorriso,</p>\n<p>ella mi disse: &laquo;Volgiti e ascolta;</p>\n<p>ch&eacute; non pur ne&rsquo; miei occhi &egrave; paradiso&raquo;.</p></div>\n\n<div class="stanza"><p>Come si vede qui alcuna volta</p>\n<p>l&rsquo;affetto ne la vista, s&rsquo;elli &egrave; tanto,</p>\n<p>che da lui sia tutta l&rsquo;anima tolta,</p></div>\n\n<div class="stanza"><p>cos&igrave; nel fiammeggiar del folg&oacute;r santo,</p>\n<p>a ch&rsquo;io mi volsi, conobbi la voglia</p>\n<p>in lui di ragionarmi ancora alquanto.</p></div>\n\n<div class="stanza"><p>El cominci&ograve;: &laquo;In questa quinta soglia</p>\n<p>de l&rsquo;albero che vive de la cima</p>\n<p>e frutta sempre e mai non perde foglia,</p></div>\n\n<div class="stanza"><p>spiriti son beati, che gi&ugrave;, prima</p>\n<p>che venissero al ciel, fuor di gran voce,</p>\n<p>s&igrave; ch&rsquo;ogne musa ne sarebbe opima.</p></div>\n\n<div class="stanza"><p>Per&ograve; mira ne&rsquo; corni de la croce:</p>\n<p>quello ch&rsquo;io nomer&ograve;, l&igrave; far&agrave; l&rsquo;atto</p>\n<p>che fa in nube il suo foco veloce&raquo;.</p></div>\n\n<div class="stanza"><p>Io vidi per la croce un lume tratto</p>\n<p>dal nomar Iosu&egrave;, com&rsquo; el si feo;</p>\n<p>n&eacute; mi fu noto il dir prima che &rsquo;l fatto.</p></div>\n\n<div class="stanza"><p>E al nome de l&rsquo;alto Macabeo</p>\n<p>vidi moversi un altro roteando,</p>\n<p>e letizia era ferza del paleo.</p></div>\n\n<div class="stanza"><p>Cos&igrave; per Carlo Magno e per Orlando</p>\n<p>due ne segu&igrave; lo mio attento sguardo,</p>\n<p>com&rsquo; occhio segue suo falcon volando.</p></div>\n\n<div class="stanza"><p>Poscia trasse Guiglielmo e Rinoardo</p>\n<p>e &rsquo;l duca Gottifredi la mia vista</p>\n<p>per quella croce, e Ruberto Guiscardo.</p></div>\n\n<div class="stanza"><p>Indi, tra l&rsquo;altre luci mota e mista,</p>\n<p>mostrommi l&rsquo;alma che m&rsquo;avea parlato</p>\n<p>qual era tra i cantor del cielo artista.</p></div>\n\n<div class="stanza"><p>Io mi rivolsi dal mio destro lato</p>\n<p>per vedere in Beatrice il mio dovere,</p>\n<p>o per parlare o per atto, segnato;</p></div>\n\n<div class="stanza"><p>e vidi le sue luci tanto mere,</p>\n<p>tanto gioconde, che la sua sembianza</p>\n<p>vinceva li altri e l&rsquo;ultimo solere.</p></div>\n\n<div class="stanza"><p>E come, per sentir pi&ugrave; dilettanza</p>\n<p>bene operando, l&rsquo;uom di giorno in giorno</p>\n<p>s&rsquo;accorge che la sua virtute avanza,</p></div>\n\n<div class="stanza"><p>s&igrave; m&rsquo;accors&rsquo; io che &rsquo;l mio girare intorno</p>\n<p>col cielo insieme avea cresciuto l&rsquo;arco,</p>\n<p>veggendo quel miracol pi&ugrave; addorno.</p></div>\n\n<div class="stanza"><p>E qual &egrave; &rsquo;l trasmutare in picciol varco</p>\n<p>di tempo in bianca donna, quando &rsquo;l volto</p>\n<p>suo si discarchi di vergogna il carco,</p></div>\n\n<div class="stanza"><p>tal fu ne li occhi miei, quando fui v&ograve;lto,</p>\n<p>per lo candor de la temprata stella</p>\n<p>sesta, che dentro a s&eacute; m&rsquo;avea ricolto.</p></div>\n\n<div class="stanza"><p>Io vidi in quella giov&iuml;al facella</p>\n<p>lo sfavillar de l&rsquo;amor che l&igrave; era</p>\n<p>segnare a li occhi miei nostra favella.</p></div>\n\n<div class="stanza"><p>E come augelli surti di rivera,</p>\n<p>quasi congratulando a lor pasture,</p>\n<p>fanno di s&eacute; or tonda or altra schiera,</p></div>\n\n<div class="stanza"><p>s&igrave; dentro ai lumi sante creature</p>\n<p>volitando cantavano, e faciensi</p>\n<p>or D, or I, or L in sue figure.</p></div>\n\n<div class="stanza"><p>Prima, cantando, a sua nota moviensi;</p>\n<p>poi, diventando l&rsquo;un di questi segni,</p>\n<p>un poco s&rsquo;arrestavano e taciensi.</p></div>\n\n<div class="stanza"><p>O diva Pegas&euml;a che li &rsquo;ngegni</p>\n<p>fai glor&iuml;osi e rendili longevi,</p>\n<p>ed essi teco le cittadi e &rsquo; regni,</p></div>\n\n<div class="stanza"><p>illustrami di te, s&igrave; ch&rsquo;io rilevi</p>\n<p>le lor figure com&rsquo; io l&rsquo;ho concette:</p>\n<p>paia tua possa in questi versi brevi!</p></div>\n\n<div class="stanza"><p>Mostrarsi dunque in cinque volte sette</p>\n<p>vocali e consonanti; e io notai</p>\n<p>le parti s&igrave;, come mi parver dette.</p></div>\n\n<div class="stanza"><p>&lsquo;DILIGITE IUSTITIAM&rsquo;, primai</p>\n<p>fur verbo e nome di tutto &rsquo;l dipinto;</p>\n<p>&lsquo;QUI IUDICATIS TERRAM&rsquo;, fur sezzai.</p></div>\n\n<div class="stanza"><p>Poscia ne l&rsquo;emme del vocabol quinto</p>\n<p>rimasero ordinate; s&igrave; che Giove</p>\n<p>pareva argento l&igrave; d&rsquo;oro distinto.</p></div>\n\n<div class="stanza"><p>E vidi scendere altre luci dove</p>\n<p>era il colmo de l&rsquo;emme, e l&igrave; quetarsi</p>\n<p>cantando, credo, il ben ch&rsquo;a s&eacute; le move.</p></div>\n\n<div class="stanza"><p>Poi, come nel percuoter d&rsquo;i ciocchi arsi</p>\n<p>surgono innumerabili faville,</p>\n<p>onde li stolti sogliono agurarsi,</p></div>\n\n<div class="stanza"><p>resurger parver quindi pi&ugrave; di mille</p>\n<p>luci e salir, qual assai e qual poco,</p>\n<p>s&igrave; come &rsquo;l sol che l&rsquo;accende sortille;</p></div>\n\n<div class="stanza"><p>e qu&iuml;etata ciascuna in suo loco,</p>\n<p>la testa e &rsquo;l collo d&rsquo;un&rsquo;aguglia vidi</p>\n<p>rappresentare a quel distinto foco.</p></div>\n\n<div class="stanza"><p>Quei che dipinge l&igrave;, non ha chi &rsquo;l guidi;</p>\n<p>ma esso guida, e da lui si rammenta</p>\n<p>quella virt&ugrave; ch&rsquo;&egrave; forma per li nidi.</p></div>\n\n<div class="stanza"><p>L&rsquo;altra b&euml;atitudo, che contenta</p>\n<p>pareva prima d&rsquo;ingigliarsi a l&rsquo;emme,</p>\n<p>con poco moto seguit&ograve; la &rsquo;mprenta.</p></div>\n\n<div class="stanza"><p>O dolce stella, quali e quante gemme</p>\n<p>mi dimostraro che nostra giustizia</p>\n<p>effetto sia del ciel che tu ingemme!</p></div>\n\n<div class="stanza"><p>Per ch&rsquo;io prego la mente in che s&rsquo;inizia</p>\n<p>tuo moto e tua virtute, che rimiri</p>\n<p>ond&rsquo; esce il fummo che &rsquo;l tuo raggio vizia;</p></div>\n\n<div class="stanza"><p>s&igrave; ch&rsquo;un&rsquo;altra f&iuml;ata omai s&rsquo;adiri</p>\n<p>del comperare e vender dentro al templo</p>\n<p>che si mur&ograve; di segni e di mart&igrave;ri.</p></div>\n\n<div class="stanza"><p>O milizia del ciel cu&rsquo; io contemplo,</p>\n<p>adora per color che sono in terra</p>\n<p>tutti sv&iuml;ati dietro al malo essemplo!</p></div>\n\n<div class="stanza"><p>Gi&agrave; si solea con le spade far guerra;</p>\n<p>ma or si fa togliendo or qui or quivi</p>\n<p>lo pan che &rsquo;l p&iuml;o Padre a nessun serra.</p></div>\n\n<div class="stanza"><p>Ma tu che sol per cancellare scrivi,</p>\n<p>pensa che Pietro e Paulo, che moriro</p>\n<p>per la vigna che guasti, ancor son vivi.</p></div>\n\n<div class="stanza"><p>Ben puoi tu dire: &laquo;I&rsquo; ho fermo &rsquo;l disiro</p>\n<p>s&igrave; a colui che volle viver solo</p>\n<p>e che per salti fu tratto al martiro,</p></div>\n\n<div class="stanza"><p>ch&rsquo;io non conosco il pescator n&eacute; Polo&raquo;.</p></div>','<p class="cantohead">Canto XIX</p>\n\n<div class="stanza"><p>Parea dinanzi a me con l&rsquo;ali aperte</p>\n<p>la bella image che nel dolce frui</p>\n<p>liete facevan l&rsquo;anime conserte;</p></div>\n\n<div class="stanza"><p>parea ciascuna rubinetto in cui</p>\n<p>raggio di sole ardesse s&igrave; acceso,</p>\n<p>che ne&rsquo; miei occhi rifrangesse lui.</p></div>\n\n<div class="stanza"><p>E quel che mi convien ritrar testeso,</p>\n<p>non port&ograve; voce mai, n&eacute; scrisse incostro,</p>\n<p>n&eacute; fu per fantasia gi&agrave; mai compreso;</p></div>\n\n<div class="stanza"><p>ch&rsquo;io vidi e anche udi&rsquo; parlar lo rostro,</p>\n<p>e sonar ne la voce e &laquo;io&raquo; e &laquo;mio&raquo;,</p>\n<p>quand&rsquo; era nel concetto e &lsquo;noi&rsquo; e &lsquo;nostro&rsquo;.</p></div>\n\n<div class="stanza"><p>E cominci&ograve;: &laquo;Per esser giusto e pio</p>\n<p>son io qui essaltato a quella gloria</p>\n<p>che non si lascia vincere a disio;</p></div>\n\n<div class="stanza"><p>e in terra lasciai la mia memoria</p>\n<p>s&igrave; fatta, che le genti l&igrave; malvage</p>\n<p>commendan lei, ma non seguon la storia&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; un sol calor di molte brage</p>\n<p>si fa sentir, come di molti amori</p>\n<p>usciva solo un suon di quella image.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; io appresso: &laquo;O perpet&uuml;i fiori</p>\n<p>de l&rsquo;etterna letizia, che pur uno</p>\n<p>parer mi fate tutti vostri odori,</p></div>\n\n<div class="stanza"><p>solvetemi, spirando, il gran digiuno</p>\n<p>che lungamente m&rsquo;ha tenuto in fame,</p>\n<p>non trovandoli in terra cibo alcuno.</p></div>\n\n<div class="stanza"><p>Ben so io che, se &rsquo;n cielo altro reame</p>\n<p>la divina giustizia fa suo specchio,</p>\n<p>che &rsquo;l vostro non l&rsquo;apprende con velame.</p></div>\n\n<div class="stanza"><p>Sapete come attento io m&rsquo;apparecchio</p>\n<p>ad ascoltar; sapete qual &egrave; quello</p>\n<p>dubbio che m&rsquo;&egrave; digiun cotanto vecchio&raquo;.</p></div>\n\n<div class="stanza"><p>Quasi falcone ch&rsquo;esce del cappello,</p>\n<p>move la testa e con l&rsquo;ali si plaude,</p>\n<p>voglia mostrando e faccendosi bello,</p></div>\n\n<div class="stanza"><p>vid&rsquo; io farsi quel segno, che di laude</p>\n<p>de la divina grazia era contesto,</p>\n<p>con canti quai si sa chi l&agrave; s&ugrave; gaude.</p></div>\n\n<div class="stanza"><p>Poi cominci&ograve;: &laquo;Colui che volse il sesto</p>\n<p>a lo stremo del mondo, e dentro ad esso</p>\n<p>distinse tanto occulto e manifesto,</p></div>\n\n<div class="stanza"><p>non pot&eacute; suo valor s&igrave; fare impresso</p>\n<p>in tutto l&rsquo;universo, che &rsquo;l suo verbo</p>\n<p>non rimanesse in infinito eccesso.</p></div>\n\n<div class="stanza"><p>E ci&ograve; fa certo che &rsquo;l primo superbo,</p>\n<p>che fu la somma d&rsquo;ogne creatura,</p>\n<p>per non aspettar lume, cadde acerbo;</p></div>\n\n<div class="stanza"><p>e quinci appar ch&rsquo;ogne minor natura</p>\n<p>&egrave; corto recettacolo a quel bene</p>\n<p>che non ha fine e s&eacute; con s&eacute; misura.</p></div>\n\n<div class="stanza"><p>Dunque vostra veduta, che convene</p>\n<p>esser alcun de&rsquo; raggi de la mente</p>\n<p>di che tutte le cose son ripiene,</p></div>\n\n<div class="stanza"><p>non p&ograve; da sua natura esser possente</p>\n<p>tanto, che suo principio discerna</p>\n<p>molto di l&agrave; da quel che l&rsquo;&egrave; parvente.</p></div>\n\n<div class="stanza"><p>Per&ograve; ne la giustizia sempiterna</p>\n<p>la vista che riceve il vostro mondo,</p>\n<p>com&rsquo; occhio per lo mare, entro s&rsquo;interna;</p></div>\n\n<div class="stanza"><p>che, ben che da la proda veggia il fondo,</p>\n<p>in pelago nol vede; e nondimeno</p>\n<p>&egrave;li, ma cela lui l&rsquo;esser profondo.</p></div>\n\n<div class="stanza"><p>Lume non &egrave;, se non vien dal sereno</p>\n<p>che non si turba mai; anzi &egrave; ten&egrave;bra</p>\n<p>od ombra de la carne o suo veleno.</p></div>\n\n<div class="stanza"><p>Assai t&rsquo;&egrave; mo aperta la latebra</p>\n<p>che t&rsquo;ascondeva la giustizia viva,</p>\n<p>di che facei question cotanto crebra;</p></div>\n\n<div class="stanza"><p>ch&eacute; tu dicevi: &ldquo;Un uom nasce a la riva</p>\n<p>de l&rsquo;Indo, e quivi non &egrave; chi ragioni</p>\n<p>di Cristo n&eacute; chi legga n&eacute; chi scriva;</p></div>\n\n<div class="stanza"><p>e tutti suoi voleri e atti buoni</p>\n<p>sono, quanto ragione umana vede,</p>\n<p>sanza peccato in vita o in sermoni.</p></div>\n\n<div class="stanza"><p>Muore non battezzato e sanza fede:</p>\n<p>ov&rsquo; &egrave; questa giustizia che &rsquo;l condanna?</p>\n<p>ov&rsquo; &egrave; la colpa sua, se ei non crede?&rdquo;.</p></div>\n\n<div class="stanza"><p>Or tu chi se&rsquo;, che vuo&rsquo; sedere a scranna,</p>\n<p>per giudicar di lungi mille miglia</p>\n<p>con la veduta corta d&rsquo;una spanna?</p></div>\n\n<div class="stanza"><p>Certo a colui che meco s&rsquo;assottiglia,</p>\n<p>se la Scrittura sovra voi non fosse,</p>\n<p>da dubitar sarebbe a maraviglia.</p></div>\n\n<div class="stanza"><p>Oh terreni animali! oh menti grosse!</p>\n<p>La prima volont&agrave;, ch&rsquo;&egrave; da s&eacute; buona,</p>\n<p>da s&eacute;, ch&rsquo;&egrave; sommo ben, mai non si mosse.</p></div>\n\n<div class="stanza"><p>Cotanto &egrave; giusto quanto a lei consuona:</p>\n<p>nullo creato bene a s&eacute; la tira,</p>\n<p>ma essa, rad&iuml;ando, lui cagiona&raquo;.</p></div>\n\n<div class="stanza"><p>Quale sovresso il nido si rigira</p>\n<p>poi c&rsquo;ha pasciuti la cicogna i figli,</p>\n<p>e come quel ch&rsquo;&egrave; pasto la rimira;</p></div>\n\n<div class="stanza"><p>cotal si fece, e s&igrave; lev&auml;i i cigli,</p>\n<p>la benedetta imagine, che l&rsquo;ali</p>\n<p>movea sospinte da tanti consigli.</p></div>\n\n<div class="stanza"><p>Roteando cantava, e dicea: &laquo;Quali</p>\n<p>son le mie note a te, che non le &rsquo;ntendi,</p>\n<p>tal &egrave; il giudicio etterno a voi mortali&raquo;.</p></div>\n\n<div class="stanza"><p>Poi si quetaro quei lucenti incendi</p>\n<p>de lo Spirito Santo ancor nel segno</p>\n<p>che f&eacute; i Romani al mondo reverendi,</p></div>\n\n<div class="stanza"><p>esso ricominci&ograve;: &laquo;A questo regno</p>\n<p>non sal&igrave; mai chi non credette &rsquo;n Cristo,</p>\n<p>n&eacute; pria n&eacute; poi ch&rsquo;el si chiavasse al legno.</p></div>\n\n<div class="stanza"><p>Ma vedi: molti gridan &ldquo;Cristo, Cristo!&rdquo;,</p>\n<p>che saranno in giudicio assai men prope</p>\n<p>a lui, che tal che non conosce Cristo;</p></div>\n\n<div class="stanza"><p>e tai Cristian danner&agrave; l&rsquo;Et&iuml;&ograve;pe,</p>\n<p>quando si partiranno i due collegi,</p>\n<p>l&rsquo;uno in etterno ricco e l&rsquo;altro in&ograve;pe.</p></div>\n\n<div class="stanza"><p>Che poran dir li Perse a&rsquo; vostri regi,</p>\n<p>come vedranno quel volume aperto</p>\n<p>nel qual si scrivon tutti suoi dispregi?</p></div>\n\n<div class="stanza"><p>L&igrave; si vedr&agrave;, tra l&rsquo;opere d&rsquo;Alberto,</p>\n<p>quella che tosto mover&agrave; la penna,</p>\n<p>per che &rsquo;l regno di Praga fia diserto.</p></div>\n\n<div class="stanza"><p>L&igrave; si vedr&agrave; il duol che sovra Senna</p>\n<p>induce, falseggiando la moneta,</p>\n<p>quel che morr&agrave; di colpo di cotenna.</p></div>\n\n<div class="stanza"><p>L&igrave; si vedr&agrave; la superbia ch&rsquo;asseta,</p>\n<p>che fa lo Scotto e l&rsquo;Inghilese folle,</p>\n<p>s&igrave; che non pu&ograve; soffrir dentro a sua meta.</p></div>\n\n<div class="stanza"><p>Vedrassi la lussuria e &rsquo;l viver molle</p>\n<p>di quel di Spagna e di quel di Boemme,</p>\n<p>che mai valor non conobbe n&eacute; volle.</p></div>\n\n<div class="stanza"><p>Vedrassi al Ciotto di Ierusalemme</p>\n<p>segnata con un i la sua bontate,</p>\n<p>quando &rsquo;l contrario segner&agrave; un emme.</p></div>\n\n<div class="stanza"><p>Vedrassi l&rsquo;avarizia e la viltate</p>\n<p>di quei che guarda l&rsquo;isola del foco,</p>\n<p>ove Anchise fin&igrave; la lunga etate;</p></div>\n\n<div class="stanza"><p>e a dare ad intender quanto &egrave; poco,</p>\n<p>la sua scrittura fian lettere mozze,</p>\n<p>che noteranno molto in parvo loco.</p></div>\n\n<div class="stanza"><p>E parranno a ciascun l&rsquo;opere sozze</p>\n<p>del barba e del fratel, che tanto egregia</p>\n<p>nazione e due corone han fatte bozze.</p></div>\n\n<div class="stanza"><p>E quel di Portogallo e di Norvegia</p>\n<p>l&igrave; si conosceranno, e quel di Rascia</p>\n<p>che male ha visto il conio di Vinegia.</p></div>\n\n<div class="stanza"><p>Oh beata Ungheria, se non si lascia</p>\n<p>pi&ugrave; malmenare! e beata Navarra,</p>\n<p>se s&rsquo;armasse del monte che la fascia!</p></div>\n\n<div class="stanza"><p>E creder de&rsquo; ciascun che gi&agrave;, per arra</p>\n<p>di questo, Niccos&iuml;a e Famagosta</p>\n<p>per la lor bestia si lamenti e garra,</p></div>\n\n<div class="stanza"><p>che dal fianco de l&rsquo;altre non si scosta&raquo;.</p></div>','<p class="cantohead">Canto XX</p>\n\n<div class="stanza"><p>Quando colui che tutto &rsquo;l mondo alluma</p>\n<p>de l&rsquo;emisperio nostro s&igrave; discende,</p>\n<p>che &rsquo;l giorno d&rsquo;ogne parte si consuma,</p></div>\n\n<div class="stanza"><p>lo ciel, che sol di lui prima s&rsquo;accende,</p>\n<p>subitamente si rif&agrave; parvente</p>\n<p>per molte luci, in che una risplende;</p></div>\n\n<div class="stanza"><p>e questo atto del ciel mi venne a mente,</p>\n<p>come &rsquo;l segno del mondo e de&rsquo; suoi duci</p>\n<p>nel benedetto rostro fu tacente;</p></div>\n\n<div class="stanza"><p>per&ograve; che tutte quelle vive luci,</p>\n<p>vie pi&ugrave; lucendo, cominciaron canti</p>\n<p>da mia memoria labili e caduci.</p></div>\n\n<div class="stanza"><p>O dolce amor che di riso t&rsquo;ammanti,</p>\n<p>quanto parevi ardente in que&rsquo; flailli,</p>\n<p>ch&rsquo;avieno spirto sol di pensier santi!</p></div>\n\n<div class="stanza"><p>Poscia che i cari e lucidi lapilli</p>\n<p>ond&rsquo; io vidi ingemmato il sesto lume</p>\n<p>puoser silenzio a li angelici squilli,</p></div>\n\n<div class="stanza"><p>udir mi parve un mormorar di fiume</p>\n<p>che scende chiaro gi&ugrave; di pietra in pietra,</p>\n<p>mostrando l&rsquo;ubert&agrave; del suo cacume.</p></div>\n\n<div class="stanza"><p>E come suono al collo de la cetra</p>\n<p>prende sua forma, e s&igrave; com&rsquo; al pertugio</p>\n<p>de la sampogna vento che pen&egrave;tra,</p></div>\n\n<div class="stanza"><p>cos&igrave;, rimosso d&rsquo;aspettare indugio,</p>\n<p>quel mormorar de l&rsquo;aguglia salissi</p>\n<p>su per lo collo, come fosse bugio.</p></div>\n\n<div class="stanza"><p>Fecesi voce quivi, e quindi uscissi</p>\n<p>per lo suo becco in forma di parole,</p>\n<p>quali aspettava il core ov&rsquo; io le scrissi.</p></div>\n\n<div class="stanza"><p>&laquo;La parte in me che vede e pate il sole</p>\n<p>ne l&rsquo;aguglie mortali&raquo;, incominciommi,</p>\n<p>&laquo;or fisamente riguardar si vole,</p></div>\n\n<div class="stanza"><p>perch&eacute; d&rsquo;i fuochi ond&rsquo; io figura fommi,</p>\n<p>quelli onde l&rsquo;occhio in testa mi scintilla,</p>\n<p>e&rsquo; di tutti lor gradi son li sommi.</p></div>\n\n<div class="stanza"><p>Colui che luce in mezzo per pupilla,</p>\n<p>fu il cantor de lo Spirito Santo,</p>\n<p>che l&rsquo;arca traslat&ograve; di villa in villa:</p></div>\n\n<div class="stanza"><p>ora conosce il merto del suo canto,</p>\n<p>in quanto effetto fu del suo consiglio,</p>\n<p>per lo remunerar ch&rsquo;&egrave; altrettanto.</p></div>\n\n<div class="stanza"><p>Dei cinque che mi fan cerchio per ciglio,</p>\n<p>colui che pi&ugrave; al becco mi s&rsquo;accosta,</p>\n<p>la vedovella consol&ograve; del figlio:</p></div>\n\n<div class="stanza"><p>ora conosce quanto caro costa</p>\n<p>non seguir Cristo, per l&rsquo;esper&iuml;enza</p>\n<p>di questa dolce vita e de l&rsquo;opposta.</p></div>\n\n<div class="stanza"><p>E quel che segue in la circunferenza</p>\n<p>di che ragiono, per l&rsquo;arco superno,</p>\n<p>morte indugi&ograve; per vera penitenza:</p></div>\n\n<div class="stanza"><p>ora conosce che &rsquo;l giudicio etterno</p>\n<p>non si trasmuta, quando degno preco</p>\n<p>fa crastino l&agrave; gi&ugrave; de l&rsquo;od&iuml;erno.</p></div>\n\n<div class="stanza"><p>L&rsquo;altro che segue, con le leggi e meco,</p>\n<p>sotto buona intenzion che f&eacute; mal frutto,</p>\n<p>per cedere al pastor si fece greco:</p></div>\n\n<div class="stanza"><p>ora conosce come il mal dedutto</p>\n<p>dal suo bene operar non li &egrave; nocivo,</p>\n<p>avvegna che sia &rsquo;l mondo indi distrutto.</p></div>\n\n<div class="stanza"><p>E quel che vedi ne l&rsquo;arco declivo,</p>\n<p>Guiglielmo fu, cui quella terra plora</p>\n<p>che piagne Carlo e Federigo vivo:</p></div>\n\n<div class="stanza"><p>ora conosce come s&rsquo;innamora</p>\n<p>lo ciel del giusto rege, e al sembiante</p>\n<p>del suo fulgore il fa vedere ancora.</p></div>\n\n<div class="stanza"><p>Chi crederebbe gi&ugrave; nel mondo errante</p>\n<p>che Rif&euml;o Troiano in questo tondo</p>\n<p>fosse la quinta de le luci sante?</p></div>\n\n<div class="stanza"><p>Ora conosce assai di quel che &rsquo;l mondo</p>\n<p>veder non pu&ograve; de la divina grazia,</p>\n<p>ben che sua vista non discerna il fondo&raquo;.</p></div>\n\n<div class="stanza"><p>Quale allodetta che &rsquo;n aere si spazia</p>\n<p>prima cantando, e poi tace contenta</p>\n<p>de l&rsquo;ultima dolcezza che la sazia,</p></div>\n\n<div class="stanza"><p>tal mi sembi&ograve; l&rsquo;imago de la &rsquo;mprenta</p>\n<p>de l&rsquo;etterno piacere, al cui disio</p>\n<p>ciascuna cosa qual ell&rsquo; &egrave; diventa.</p></div>\n\n<div class="stanza"><p>E avvegna ch&rsquo;io fossi al dubbiar mio</p>\n<p>l&igrave; quasi vetro a lo color ch&rsquo;el veste,</p>\n<p>tempo aspettar tacendo non patio,</p></div>\n\n<div class="stanza"><p>ma de la bocca, &laquo;Che cose son queste?&raquo;,</p>\n<p>mi pinse con la forza del suo peso:</p>\n<p>per ch&rsquo;io di coruscar vidi gran feste.</p></div>\n\n<div class="stanza"><p>Poi appresso, con l&rsquo;occhio pi&ugrave; acceso,</p>\n<p>lo benedetto segno mi rispuose</p>\n<p>per non tenermi in ammirar sospeso:</p></div>\n\n<div class="stanza"><p>&laquo;Io veggio che tu credi queste cose</p>\n<p>perch&rsquo; io le dico, ma non vedi come;</p>\n<p>s&igrave; che, se son credute, sono ascose.</p></div>\n\n<div class="stanza"><p>Fai come quei che la cosa per nome</p>\n<p>apprende ben, ma la sua quiditate</p>\n<p>veder non pu&ograve; se altri non la prome.</p></div>\n\n<div class="stanza"><p>Regnum celorum v&iuml;olenza pate</p>\n<p>da caldo amore e da viva speranza,</p>\n<p>che vince la divina volontate:</p></div>\n\n<div class="stanza"><p>non a guisa che l&rsquo;omo a l&rsquo;om sobranza,</p>\n<p>ma vince lei perch&eacute; vuole esser vinta,</p>\n<p>e, vinta, vince con sua beninanza.</p></div>\n\n<div class="stanza"><p>La prima vita del ciglio e la quinta</p>\n<p>ti fa maravigliar, perch&eacute; ne vedi</p>\n<p>la reg&iuml;on de li angeli dipinta.</p></div>\n\n<div class="stanza"><p>D&rsquo;i corpi suoi non uscir, come credi,</p>\n<p>Gentili, ma Cristiani, in ferma fede</p>\n<p>quel d&rsquo;i passuri e quel d&rsquo;i passi piedi.</p></div>\n\n<div class="stanza"><p>Ch&eacute; l&rsquo;una de lo &rsquo;nferno, u&rsquo; non si riede</p>\n<p>gi&agrave; mai a buon voler, torn&ograve; a l&rsquo;ossa;</p>\n<p>e ci&ograve; di viva spene fu mercede:</p></div>\n\n<div class="stanza"><p>di viva spene, che mise la possa</p>\n<p>ne&rsquo; prieghi fatti a Dio per suscitarla,</p>\n<p>s&igrave; che potesse sua voglia esser mossa.</p></div>\n\n<div class="stanza"><p>L&rsquo;anima glor&iuml;osa onde si parla,</p>\n<p>tornata ne la carne, in che fu poco,</p>\n<p>credette in lui che pot&euml;a aiutarla;</p></div>\n\n<div class="stanza"><p>e credendo s&rsquo;accese in tanto foco</p>\n<p>di vero amor, ch&rsquo;a la morte seconda</p>\n<p>fu degna di venire a questo gioco.</p></div>\n\n<div class="stanza"><p>L&rsquo;altra, per grazia che da s&igrave; profonda</p>\n<p>fontana stilla, che mai creatura</p>\n<p>non pinse l&rsquo;occhio infino a la prima onda,</p></div>\n\n<div class="stanza"><p>tutto suo amor l&agrave; gi&ugrave; pose a drittura:</p>\n<p>per che, di grazia in grazia, Dio li aperse</p>\n<p>l&rsquo;occhio a la nostra redenzion futura;</p></div>\n\n<div class="stanza"><p>ond&rsquo; ei credette in quella, e non sofferse</p>\n<p>da indi il puzzo pi&ugrave; del paganesmo;</p>\n<p>e riprendiene le genti perverse.</p></div>\n\n<div class="stanza"><p>Quelle tre donne li fur per battesmo</p>\n<p>che tu vedesti da la destra rota,</p>\n<p>dinanzi al battezzar pi&ugrave; d&rsquo;un millesmo.</p></div>\n\n<div class="stanza"><p>O predestinazion, quanto remota</p>\n<p>&egrave; la radice tua da quelli aspetti</p>\n<p>che la prima cagion non veggion tota!</p></div>\n\n<div class="stanza"><p>E voi, mortali, tenetevi stretti</p>\n<p>a giudicar: ch&eacute; noi, che Dio vedemo,</p>\n<p>non conosciamo ancor tutti li eletti;</p></div>\n\n<div class="stanza"><p>ed &egrave;nne dolce cos&igrave; fatto scemo,</p>\n<p>perch&eacute; il ben nostro in questo ben s&rsquo;affina,</p>\n<p>che quel che vole Iddio, e noi volemo&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; da quella imagine divina,</p>\n<p>per farmi chiara la mia corta vista,</p>\n<p>data mi fu soave medicina.</p></div>\n\n<div class="stanza"><p>E come a buon cantor buon citarista</p>\n<p>fa seguitar lo guizzo de la corda,</p>\n<p>in che pi&ugrave; di piacer lo canto acquista,</p></div>\n\n<div class="stanza"><p>s&igrave;, mentre ch&rsquo;e&rsquo; parl&ograve;, s&igrave; mi ricorda</p>\n<p>ch&rsquo;io vidi le due luci benedette,</p>\n<p>pur come batter d&rsquo;occhi si concorda,</p></div>\n\n<div class="stanza"><p>con le parole mover le fiammette.</p></div>','<p class="cantohead">Canto XXI</p>\n\n<div class="stanza"><p>Gi&agrave; eran li occhi miei rifissi al volto</p>\n<p>de la mia donna, e l&rsquo;animo con essi,</p>\n<p>e da ogne altro intento s&rsquo;era tolto.</p></div>\n\n<div class="stanza"><p>E quella non ridea; ma &laquo;S&rsquo;io ridessi&raquo;,</p>\n<p>mi cominci&ograve;, &laquo;tu ti faresti quale</p>\n<p>fu Semel&egrave; quando di cener fessi:</p></div>\n\n<div class="stanza"><p>ch&eacute; la bellezza mia, che per le scale</p>\n<p>de l&rsquo;etterno palazzo pi&ugrave; s&rsquo;accende,</p>\n<p>com&rsquo; hai veduto, quanto pi&ugrave; si sale,</p></div>\n\n<div class="stanza"><p>se non si temperasse, tanto splende,</p>\n<p>che &rsquo;l tuo mortal podere, al suo fulgore,</p>\n<p>sarebbe fronda che trono scoscende.</p></div>\n\n<div class="stanza"><p>Noi sem levati al settimo splendore,</p>\n<p>che sotto &rsquo;l petto del Leone ardente</p>\n<p>raggia mo misto gi&ugrave; del suo valore.</p></div>\n\n<div class="stanza"><p>Ficca di retro a li occhi tuoi la mente,</p>\n<p>e fa di quelli specchi a la figura</p>\n<p>che &rsquo;n questo specchio ti sar&agrave; parvente&raquo;.</p></div>\n\n<div class="stanza"><p>Qual savesse qual era la pastura</p>\n<p>del viso mio ne l&rsquo;aspetto beato</p>\n<p>quand&rsquo; io mi trasmutai ad altra cura,</p></div>\n\n<div class="stanza"><p>conoscerebbe quanto m&rsquo;era a grato</p>\n<p>ubidire a la mia celeste scorta,</p>\n<p>contrapesando l&rsquo;un con l&rsquo;altro lato.</p></div>\n\n<div class="stanza"><p>Dentro al cristallo che &rsquo;l vocabol porta,</p>\n<p>cerchiando il mondo, del suo caro duce</p>\n<p>sotto cui giacque ogne malizia morta,</p></div>\n\n<div class="stanza"><p>di color d&rsquo;oro in che raggio traluce</p>\n<p>vid&rsquo; io uno scaleo eretto in suso</p>\n<p>tanto, che nol seguiva la mia luce.</p></div>\n\n<div class="stanza"><p>Vidi anche per li gradi scender giuso</p>\n<p>tanti splendor, ch&rsquo;io pensai ch&rsquo;ogne lume</p>\n<p>che par nel ciel, quindi fosse diffuso.</p></div>\n\n<div class="stanza"><p>E come, per lo natural costume,</p>\n<p>le pole insieme, al cominciar del giorno,</p>\n<p>si movono a scaldar le fredde piume;</p></div>\n\n<div class="stanza"><p>poi altre vanno via sanza ritorno,</p>\n<p>altre rivolgon s&eacute; onde son mosse,</p>\n<p>e altre roteando fan soggiorno;</p></div>\n\n<div class="stanza"><p>tal modo parve me che quivi fosse</p>\n<p>in quello sfavillar che &rsquo;nsieme venne,</p>\n<p>s&igrave; come in certo grado si percosse.</p></div>\n\n<div class="stanza"><p>E quel che presso pi&ugrave; ci si ritenne,</p>\n<p>si f&eacute; s&igrave; chiaro, ch&rsquo;io dicea pensando:</p>\n<p>&lsquo;Io veggio ben l&rsquo;amor che tu m&rsquo;accenne.</p></div>\n\n<div class="stanza"><p>Ma quella ond&rsquo; io aspetto il come e &rsquo;l quando</p>\n<p>del dire e del tacer, si sta; ond&rsquo; io,</p>\n<p>contra &rsquo;l disio, fo ben ch&rsquo;io non dimando&rsquo;.</p></div>\n\n<div class="stanza"><p>Per ch&rsquo;ella, che ved&euml;a il tacer mio</p>\n<p>nel veder di colui che tutto vede,</p>\n<p>mi disse: &laquo;Solvi il tuo caldo disio&raquo;.</p></div>\n\n<div class="stanza"><p>E io incominciai: &laquo;La mia mercede</p>\n<p>non mi fa degno de la tua risposta;</p>\n<p>ma per colei che &rsquo;l chieder mi concede,</p></div>\n\n<div class="stanza"><p>vita beata che ti stai nascosta</p>\n<p>dentro a la tua letizia, fammi nota</p>\n<p>la cagion che s&igrave; presso mi t&rsquo;ha posta;</p></div>\n\n<div class="stanza"><p>e d&igrave; perch&eacute; si tace in questa rota</p>\n<p>la dolce sinfonia di paradiso,</p>\n<p>che gi&ugrave; per l&rsquo;altre suona s&igrave; divota&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Tu hai l&rsquo;udir mortal s&igrave; come il viso&raquo;,</p>\n<p>rispuose a me; &laquo;onde qui non si canta</p>\n<p>per quel che B&euml;atrice non ha riso.</p></div>\n\n<div class="stanza"><p>Gi&ugrave; per li gradi de la scala santa</p>\n<p>discesi tanto sol per farti festa</p>\n<p>col dire e con la luce che mi ammanta;</p></div>\n\n<div class="stanza"><p>n&eacute; pi&ugrave; amor mi fece esser pi&ugrave; presta,</p>\n<p>ch&eacute; pi&ugrave; e tanto amor quinci s&ugrave; ferve,</p>\n<p>s&igrave; come il fiammeggiar ti manifesta.</p></div>\n\n<div class="stanza"><p>Ma l&rsquo;alta carit&agrave;, che ci fa serve</p>\n<p>pronte al consiglio che &rsquo;l mondo governa,</p>\n<p>sorteggia qui s&igrave; come tu osserve&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Io veggio ben&raquo;, diss&rsquo; io, &laquo;sacra lucerna,</p>\n<p>come libero amore in questa corte</p>\n<p>basta a seguir la provedenza etterna;</p></div>\n\n<div class="stanza"><p>ma questo &egrave; quel ch&rsquo;a cerner mi par forte,</p>\n<p>perch&eacute; predestinata fosti sola</p>\n<p>a questo officio tra le tue consorte&raquo;.</p></div>\n\n<div class="stanza"><p>N&eacute; venni prima a l&rsquo;ultima parola,</p>\n<p>che del suo mezzo fece il lume centro,</p>\n<p>girando s&eacute; come veloce mola;</p></div>\n\n<div class="stanza"><p>poi rispuose l&rsquo;amor che v&rsquo;era dentro:</p>\n<p>&laquo;Luce divina sopra me s&rsquo;appunta,</p>\n<p>penetrando per questa in ch&rsquo;io m&rsquo;inventro,</p></div>\n\n<div class="stanza"><p>la cui virt&ugrave;, col mio veder congiunta,</p>\n<p>mi leva sopra me tanto, ch&rsquo;i&rsquo; veggio</p>\n<p>la somma essenza de la quale &egrave; munta.</p></div>\n\n<div class="stanza"><p>Quinci vien l&rsquo;allegrezza ond&rsquo; io fiammeggio;</p>\n<p>per ch&rsquo;a la vista mia, quant&rsquo; ella &egrave; chiara,</p>\n<p>la chiarit&agrave; de la fiamma pareggio.</p></div>\n\n<div class="stanza"><p>Ma quell&rsquo; alma nel ciel che pi&ugrave; si schiara,</p>\n<p>quel serafin che &rsquo;n Dio pi&ugrave; l&rsquo;occhio ha fisso,</p>\n<p>a la dimanda tua non satisfara,</p></div>\n\n<div class="stanza"><p>per&ograve; che s&igrave; s&rsquo;innoltra ne lo abisso</p>\n<p>de l&rsquo;etterno statuto quel che chiedi,</p>\n<p>che da ogne creata vista &egrave; scisso.</p></div>\n\n<div class="stanza"><p>E al mondo mortal, quando tu riedi,</p>\n<p>questo rapporta, s&igrave; che non presumma</p>\n<p>a tanto segno pi&ugrave; mover li piedi.</p></div>\n\n<div class="stanza"><p>La mente, che qui luce, in terra fumma;</p>\n<p>onde riguarda come pu&ograve; l&agrave; gi&ugrave;e</p>\n<p>quel che non pote perch&eacute; &rsquo;l ciel l&rsquo;assumma&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; mi prescrisser le parole sue,</p>\n<p>ch&rsquo;io lasciai la quistione e mi ritrassi</p>\n<p>a dimandarla umilmente chi fue.</p></div>\n\n<div class="stanza"><p>&laquo;Tra &rsquo; due liti d&rsquo;Italia surgon sassi,</p>\n<p>e non molto distanti a la tua patria,</p>\n<p>tanto che &rsquo; troni assai suonan pi&ugrave; bassi,</p></div>\n\n<div class="stanza"><p>e fanno un gibbo che si chiama Catria,</p>\n<p>di sotto al quale &egrave; consecrato un ermo,</p>\n<p>che suole esser disposto a sola latria&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; ricominciommi il terzo sermo;</p>\n<p>e poi, contin&uuml;ando, disse: &laquo;Quivi</p>\n<p>al servigio di Dio mi fe&rsquo; s&igrave; fermo,</p></div>\n\n<div class="stanza"><p>che pur con cibi di liquor d&rsquo;ulivi</p>\n<p>lievemente passava caldi e geli,</p>\n<p>contento ne&rsquo; pensier contemplativi.</p></div>\n\n<div class="stanza"><p>Render solea quel chiostro a questi cieli</p>\n<p>fertilemente; e ora &egrave; fatto vano,</p>\n<p>s&igrave; che tosto convien che si riveli.</p></div>\n\n<div class="stanza"><p>In quel loco fu&rsquo; io Pietro Damiano,</p>\n<p>e Pietro Peccator fu&rsquo; ne la casa</p>\n<p>di Nostra Donna in sul lito adriano.</p></div>\n\n<div class="stanza"><p>Poca vita mortal m&rsquo;era rimasa,</p>\n<p>quando fui chiesto e tratto a quel cappello,</p>\n<p>che pur di male in peggio si travasa.</p></div>\n\n<div class="stanza"><p>Venne Cef&agrave;s e venne il gran vasello</p>\n<p>de lo Spirito Santo, magri e scalzi,</p>\n<p>prendendo il cibo da qualunque ostello.</p></div>\n\n<div class="stanza"><p>Or voglion quinci e quindi chi rincalzi</p>\n<p>li moderni pastori e chi li meni,</p>\n<p>tanto son gravi, e chi di rietro li alzi.</p></div>\n\n<div class="stanza"><p>Cuopron d&rsquo;i manti loro i palafreni,</p>\n<p>s&igrave; che due bestie van sott&rsquo; una pelle:</p>\n<p>oh paz&iuml;enza che tanto sostieni!&raquo;.</p></div>\n\n<div class="stanza"><p>A questa voce vid&rsquo; io pi&ugrave; fiammelle</p>\n<p>di grado in grado scendere e girarsi,</p>\n<p>e ogne giro le facea pi&ugrave; belle.</p></div>\n\n<div class="stanza"><p>Dintorno a questa vennero e fermarsi,</p>\n<p>e fero un grido di s&igrave; alto suono,</p>\n<p>che non potrebbe qui assomigliarsi;</p></div>\n\n<div class="stanza"><p>n&eacute; io lo &rsquo;ntesi, s&igrave; mi vinse il tuono.</p></div>','<p class="cantohead">Canto XXII</p>\n\n<div class="stanza"><p>Oppresso di stupore, a la mia guida</p>\n<p>mi volsi, come parvol che ricorre</p>\n<p>sempre col&agrave; dove pi&ugrave; si confida;</p></div>\n\n<div class="stanza"><p>e quella, come madre che soccorre</p>\n<p>s&ugrave;bito al figlio palido e anelo</p>\n<p>con la sua voce, che &rsquo;l suol ben disporre,</p></div>\n\n<div class="stanza"><p>mi disse: &laquo;Non sai tu che tu se&rsquo; in cielo?</p>\n<p>e non sai tu che &rsquo;l cielo &egrave; tutto santo,</p>\n<p>e ci&ograve; che ci si fa vien da buon zelo?</p></div>\n\n<div class="stanza"><p>Come t&rsquo;avrebbe trasmutato il canto,</p>\n<p>e io ridendo, mo pensar lo puoi,</p>\n<p>poscia che &rsquo;l grido t&rsquo;ha mosso cotanto;</p></div>\n\n<div class="stanza"><p>nel qual, se &rsquo;nteso avessi i prieghi suoi,</p>\n<p>gi&agrave; ti sarebbe nota la vendetta</p>\n<p>che tu vedrai innanzi che tu muoi.</p></div>\n\n<div class="stanza"><p>La spada di qua s&ugrave; non taglia in fretta</p>\n<p>n&eacute; tardo, ma&rsquo; ch&rsquo;al parer di colui</p>\n<p>che dis&iuml;ando o temendo l&rsquo;aspetta.</p></div>\n\n<div class="stanza"><p>Ma rivolgiti omai inverso altrui;</p>\n<p>ch&rsquo;assai illustri spiriti vedrai,</p>\n<p>se com&rsquo; io dico l&rsquo;aspetto redui&raquo;.</p></div>\n\n<div class="stanza"><p>Come a lei piacque, li occhi ritornai,</p>\n<p>e vidi cento sperule che &rsquo;nsieme</p>\n<p>pi&ugrave; s&rsquo;abbellivan con mut&uuml;i rai.</p></div>\n\n<div class="stanza"><p>Io stava come quei che &rsquo;n s&eacute; repreme</p>\n<p>la punta del disio, e non s&rsquo;attenta</p>\n<p>di domandar, s&igrave; del troppo si teme;</p></div>\n\n<div class="stanza"><p>e la maggiore e la pi&ugrave; luculenta</p>\n<p>di quelle margherite innanzi fessi,</p>\n<p>per far di s&eacute; la mia voglia contenta.</p></div>\n\n<div class="stanza"><p>Poi dentro a lei udi&rsquo;: &laquo;Se tu vedessi</p>\n<p>com&rsquo; io la carit&agrave; che tra noi arde,</p>\n<p>li tuoi concetti sarebbero espressi.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; tu, aspettando, non tarde</p>\n<p>a l&rsquo;alto fine, io ti far&ograve; risposta</p>\n<p>pur al pensier, da che s&igrave; ti riguarde.</p></div>\n\n<div class="stanza"><p>Quel monte a cui Cassino &egrave; ne la costa</p>\n<p>fu frequentato gi&agrave; in su la cima</p>\n<p>da la gente ingannata e mal disposta;</p></div>\n\n<div class="stanza"><p>e quel son io che s&ugrave; vi portai prima</p>\n<p>lo nome di colui che &rsquo;n terra addusse</p>\n<p>la verit&agrave; che tanto ci soblima;</p></div>\n\n<div class="stanza"><p>e tanta grazia sopra me relusse,</p>\n<p>ch&rsquo;io ritrassi le ville circunstanti</p>\n<p>da l&rsquo;empio c&oacute;lto che &rsquo;l mondo sedusse.</p></div>\n\n<div class="stanza"><p>Questi altri fuochi tutti contemplanti</p>\n<p>uomini fuoro, accesi di quel caldo</p>\n<p>che fa nascere i fiori e &rsquo; frutti santi.</p></div>\n\n<div class="stanza"><p>Qui &egrave; Maccario, qui &egrave; Romoaldo,</p>\n<p>qui son li frati miei che dentro ai chiostri</p>\n<p>fermar li piedi e tennero il cor saldo&raquo;.</p></div>\n\n<div class="stanza"><p>E io a lui: &laquo;L&rsquo;affetto che dimostri</p>\n<p>meco parlando, e la buona sembianza</p>\n<p>ch&rsquo;io veggio e noto in tutti li ardor vostri,</p></div>\n\n<div class="stanza"><p>cos&igrave; m&rsquo;ha dilatata mia fidanza,</p>\n<p>come &rsquo;l sol fa la rosa quando aperta</p>\n<p>tanto divien quant&rsquo; ell&rsquo; ha di possanza.</p></div>\n\n<div class="stanza"><p>Per&ograve; ti priego, e tu, padre, m&rsquo;accerta</p>\n<p>s&rsquo;io posso prender tanta grazia, ch&rsquo;io</p>\n<p>ti veggia con imagine scoverta&raquo;.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; elli: &laquo;Frate, il tuo alto disio</p>\n<p>s&rsquo;adempier&agrave; in su l&rsquo;ultima spera,</p>\n<p>ove s&rsquo;adempion tutti li altri e &rsquo;l mio.</p></div>\n\n<div class="stanza"><p>Ivi &egrave; perfetta, matura e intera</p>\n<p>ciascuna dis&iuml;anza; in quella sola</p>\n<p>&egrave; ogne parte l&agrave; ove sempr&rsquo; era,</p></div>\n\n<div class="stanza"><p>perch&eacute; non &egrave; in loco e non s&rsquo;impola;</p>\n<p>e nostra scala infino ad essa varca,</p>\n<p>onde cos&igrave; dal viso ti s&rsquo;invola.</p></div>\n\n<div class="stanza"><p>Infin l&agrave; s&ugrave; la vide il patriarca</p>\n<p>Iacobbe porger la superna parte,</p>\n<p>quando li apparve d&rsquo;angeli s&igrave; carca.</p></div>\n\n<div class="stanza"><p>Ma, per salirla, mo nessun diparte</p>\n<p>da terra i piedi, e la regola mia</p>\n<p>rimasa &egrave; per danno de le carte.</p></div>\n\n<div class="stanza"><p>Le mura che solieno esser badia</p>\n<p>fatte sono spelonche, e le cocolle</p>\n<p>sacca son piene di farina ria.</p></div>\n\n<div class="stanza"><p>Ma grave usura tanto non si tolle</p>\n<p>contra &rsquo;l piacer di Dio, quanto quel frutto</p>\n<p>che fa il cor de&rsquo; monaci s&igrave; folle;</p></div>\n\n<div class="stanza"><p>ch&eacute; quantunque la Chiesa guarda, tutto</p>\n<p>&egrave; de la gente che per Dio dimanda;</p>\n<p>non di parenti n&eacute; d&rsquo;altro pi&ugrave; brutto.</p></div>\n\n<div class="stanza"><p>La carne d&rsquo;i mortali &egrave; tanto blanda,</p>\n<p>che gi&ugrave; non basta buon cominciamento</p>\n<p>dal nascer de la quercia al far la ghianda.</p></div>\n\n<div class="stanza"><p>Pier cominci&ograve; sanz&rsquo; oro e sanz&rsquo; argento,</p>\n<p>e io con orazione e con digiuno,</p>\n<p>e Francesco umilmente il suo convento;</p></div>\n\n<div class="stanza"><p>e se guardi &rsquo;l principio di ciascuno,</p>\n<p>poscia riguardi l&agrave; dov&rsquo; &egrave; trascorso,</p>\n<p>tu vederai del bianco fatto bruno.</p></div>\n\n<div class="stanza"><p>Veramente Iordan v&ograve;lto retrorso</p>\n<p>pi&ugrave; fu, e &rsquo;l mar fuggir, quando Dio volse,</p>\n<p>mirabile a veder che qui &rsquo;l soccorso&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; mi disse, e indi si raccolse</p>\n<p>al suo collegio, e &rsquo;l collegio si strinse;</p>\n<p>poi, come turbo, in s&ugrave; tutto s&rsquo;avvolse.</p></div>\n\n<div class="stanza"><p>La dolce donna dietro a lor mi pinse</p>\n<p>con un sol cenno su per quella scala,</p>\n<p>s&igrave; sua virt&ugrave; la mia natura vinse;</p></div>\n\n<div class="stanza"><p>n&eacute; mai qua gi&ugrave; dove si monta e cala</p>\n<p>naturalmente, fu s&igrave; ratto moto</p>\n<p>ch&rsquo;agguagliar si potesse a la mia ala.</p></div>\n\n<div class="stanza"><p>S&rsquo;io torni mai, lettore, a quel divoto</p>\n<p>tr&iuml;unfo per lo quale io piango spesso</p>\n<p>le mie peccata e &rsquo;l petto mi percuoto,</p></div>\n\n<div class="stanza"><p>tu non avresti in tanto tratto e messo</p>\n<p>nel foco il dito, in quant&rsquo; io vidi &rsquo;l segno</p>\n<p>che segue il Tauro e fui dentro da esso.</p></div>\n\n<div class="stanza"><p>O glor&iuml;ose stelle, o lume pregno</p>\n<p>di gran virt&ugrave;, dal quale io riconosco</p>\n<p>tutto, qual che si sia, il mio ingegno,</p></div>\n\n<div class="stanza"><p>con voi nasceva e s&rsquo;ascondeva vosco</p>\n<p>quelli ch&rsquo;&egrave; padre d&rsquo;ogne mortal vita,</p>\n<p>quand&rsquo; io senti&rsquo; di prima l&rsquo;aere tosco;</p></div>\n\n<div class="stanza"><p>e poi, quando mi fu grazia largita</p>\n<p>d&rsquo;entrar ne l&rsquo;alta rota che vi gira,</p>\n<p>la vostra reg&iuml;on mi fu sortita.</p></div>\n\n<div class="stanza"><p>A voi divotamente ora sospira</p>\n<p>l&rsquo;anima mia, per acquistar virtute</p>\n<p>al passo forte che a s&eacute; la tira.</p></div>\n\n<div class="stanza"><p>&laquo;Tu se&rsquo; s&igrave; presso a l&rsquo;ultima salute&raquo;,</p>\n<p>cominci&ograve; B&euml;atrice, &laquo;che tu dei</p>\n<p>aver le luci tue chiare e acute;</p></div>\n\n<div class="stanza"><p>e per&ograve;, prima che tu pi&ugrave; t&rsquo;inlei,</p>\n<p>rimira in gi&ugrave;, e vedi quanto mondo</p>\n<p>sotto li piedi gi&agrave; esser ti fei;</p></div>\n\n<div class="stanza"><p>s&igrave; che &rsquo;l tuo cor, quantunque pu&ograve;, giocondo</p>\n<p>s&rsquo;appresenti a la turba tr&iuml;unfante</p>\n<p>che lieta vien per questo etera tondo&raquo;.</p></div>\n\n<div class="stanza"><p>Col viso ritornai per tutte quante</p>\n<p>le sette spere, e vidi questo globo</p>\n<p>tal, ch&rsquo;io sorrisi del suo vil sembiante;</p></div>\n\n<div class="stanza"><p>e quel consiglio per migliore approbo</p>\n<p>che l&rsquo;ha per meno; e chi ad altro pensa</p>\n<p>chiamar si puote veramente probo.</p></div>\n\n<div class="stanza"><p>Vidi la figlia di Latona incensa</p>\n<p>sanza quell&rsquo; ombra che mi fu cagione</p>\n<p>per che gi&agrave; la credetti rara e densa.</p></div>\n\n<div class="stanza"><p>L&rsquo;aspetto del tuo nato, Iper&iuml;one,</p>\n<p>quivi sostenni, e vidi com&rsquo; si move</p>\n<p>circa e vicino a lui Maia e D&iuml;one.</p></div>\n\n<div class="stanza"><p>Quindi m&rsquo;apparve il temperar di Giove</p>\n<p>tra &rsquo;l padre e &rsquo;l figlio; e quindi mi fu chiaro</p>\n<p>il var&iuml;ar che fanno di lor dove;</p></div>\n\n<div class="stanza"><p>e tutti e sette mi si dimostraro</p>\n<p>quanto son grandi e quanto son veloci</p>\n<p>e come sono in distante riparo.</p></div>\n\n<div class="stanza"><p>L&rsquo;aiuola che ci fa tanto feroci,</p>\n<p>volgendom&rsquo; io con li etterni Gemelli,</p>\n<p>tutta m&rsquo;apparve da&rsquo; colli a le foci;</p></div>\n\n<div class="stanza"><p>poscia rivolsi li occhi a li occhi belli.</p></div>','<p class="cantohead">Canto XXIII</p>\n\n<div class="stanza"><p>Come l&rsquo;augello, intra l&rsquo;amate fronde,</p>\n<p>posato al nido de&rsquo; suoi dolci nati</p>\n<p>la notte che le cose ci nasconde,</p></div>\n\n<div class="stanza"><p>che, per veder li aspetti dis&iuml;ati</p>\n<p>e per trovar lo cibo onde li pasca,</p>\n<p>in che gravi labor li sono aggrati,</p></div>\n\n<div class="stanza"><p>previene il tempo in su aperta frasca,</p>\n<p>e con ardente affetto il sole aspetta,</p>\n<p>fiso guardando pur che l&rsquo;alba nasca;</p></div>\n\n<div class="stanza"><p>cos&igrave; la donna m&iuml;a stava eretta</p>\n<p>e attenta, rivolta inver&rsquo; la plaga</p>\n<p>sotto la quale il sol mostra men fretta:</p></div>\n\n<div class="stanza"><p>s&igrave; che, veggendola io sospesa e vaga,</p>\n<p>fecimi qual &egrave; quei che dis&iuml;ando</p>\n<p>altro vorria, e sperando s&rsquo;appaga.</p></div>\n\n<div class="stanza"><p>Ma poco fu tra uno e altro quando,</p>\n<p>del mio attender, dico, e del vedere</p>\n<p>lo ciel venir pi&ugrave; e pi&ugrave; rischiarando;</p></div>\n\n<div class="stanza"><p>e B&euml;atrice disse: &laquo;Ecco le schiere</p>\n<p>del tr&iuml;unfo di Cristo e tutto &rsquo;l frutto</p>\n<p>ricolto del girar di queste spere!&raquo;.</p></div>\n\n<div class="stanza"><p>Pariemi che &rsquo;l suo viso ardesse tutto,</p>\n<p>e li occhi avea di letizia s&igrave; pieni,</p>\n<p>che passarmen convien sanza costrutto.</p></div>\n\n<div class="stanza"><p>Quale ne&rsquo; plenilun&iuml;i sereni</p>\n<p>Triv&iuml;a ride tra le ninfe etterne</p>\n<p>che dipingon lo ciel per tutti i seni,</p></div>\n\n<div class="stanza"><p>vid&rsquo; i&rsquo; sopra migliaia di lucerne</p>\n<p>un sol che tutte quante l&rsquo;accendea,</p>\n<p>come fa &rsquo;l nostro le viste superne;</p></div>\n\n<div class="stanza"><p>e per la viva luce trasparea</p>\n<p>la lucente sustanza tanto chiara</p>\n<p>nel viso mio, che non la sostenea.</p></div>\n\n<div class="stanza"><p>Oh B&euml;atrice, dolce guida e cara!</p>\n<p>Ella mi disse: &laquo;Quel che ti sobranza</p>\n<p>&egrave; virt&ugrave; da cui nulla si ripara.</p></div>\n\n<div class="stanza"><p>Quivi &egrave; la sap&iuml;enza e la possanza</p>\n<p>ch&rsquo;apr&igrave; le strade tra &rsquo;l cielo e la terra,</p>\n<p>onde fu gi&agrave; s&igrave; lunga dis&iuml;anza&raquo;.</p></div>\n\n<div class="stanza"><p>Come foco di nube si diserra</p>\n<p>per dilatarsi s&igrave; che non vi cape,</p>\n<p>e fuor di sua natura in gi&ugrave; s&rsquo;atterra,</p></div>\n\n<div class="stanza"><p>la mente mia cos&igrave;, tra quelle dape</p>\n<p>fatta pi&ugrave; grande, di s&eacute; stessa usc&igrave;o,</p>\n<p>e che si fesse rimembrar non sape.</p></div>\n\n<div class="stanza"><p>&laquo;Apri li occhi e riguarda qual son io;</p>\n<p>tu hai vedute cose, che possente</p>\n<p>se&rsquo; fatto a sostener lo riso mio&raquo;.</p></div>\n\n<div class="stanza"><p>Io era come quei che si risente</p>\n<p>di vis&iuml;one oblita e che s&rsquo;ingegna</p>\n<p>indarno di ridurlasi a la mente,</p></div>\n\n<div class="stanza"><p>quand&rsquo; io udi&rsquo; questa proferta, degna</p>\n<p>di tanto grato, che mai non si stingue</p>\n<p>del libro che &rsquo;l preterito rassegna.</p></div>\n\n<div class="stanza"><p>Se mo sonasser tutte quelle lingue</p>\n<p>che Polimn&iuml;a con le suore fero</p>\n<p>del latte lor dolcissimo pi&ugrave; pingue,</p></div>\n\n<div class="stanza"><p>per aiutarmi, al millesmo del vero</p>\n<p>non si verria, cantando il santo riso</p>\n<p>e quanto il santo aspetto facea mero;</p></div>\n\n<div class="stanza"><p>e cos&igrave;, figurando il paradiso,</p>\n<p>convien saltar lo sacrato poema,</p>\n<p>come chi trova suo cammin riciso.</p></div>\n\n<div class="stanza"><p>Ma chi pensasse il ponderoso tema</p>\n<p>e l&rsquo;omero mortal che se ne carca,</p>\n<p>nol biasmerebbe se sott&rsquo; esso trema:</p></div>\n\n<div class="stanza"><p>non &egrave; pareggio da picciola barca</p>\n<p>quel che fendendo va l&rsquo;ardita prora,</p>\n<p>n&eacute; da nocchier ch&rsquo;a s&eacute; medesmo parca.</p></div>\n\n<div class="stanza"><p>&laquo;Perch&eacute; la faccia mia s&igrave; t&rsquo;innamora,</p>\n<p>che tu non ti rivolgi al bel giardino</p>\n<p>che sotto i raggi di Cristo s&rsquo;infiora?</p></div>\n\n<div class="stanza"><p>Quivi &egrave; la rosa in che &rsquo;l verbo divino</p>\n<p>carne si fece; quivi son li gigli</p>\n<p>al cui odor si prese il buon cammino&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; Beatrice; e io, che a&rsquo; suoi consigli</p>\n<p>tutto era pronto, ancora mi rendei</p>\n<p>a la battaglia de&rsquo; debili cigli.</p></div>\n\n<div class="stanza"><p>Come a raggio di sol, che puro mei</p>\n<p>per fratta nube, gi&agrave; prato di fiori</p>\n<p>vider, coverti d&rsquo;ombra, li occhi miei;</p></div>\n\n<div class="stanza"><p>vid&rsquo; io cos&igrave; pi&ugrave; turbe di splendori,</p>\n<p>folgorate di s&ugrave; da raggi ardenti,</p>\n<p>sanza veder principio di folg&oacute;ri.</p></div>\n\n<div class="stanza"><p>O benigna vert&ugrave; che s&igrave; li &rsquo;mprenti,</p>\n<p>s&ugrave; t&rsquo;essaltasti, per largirmi loco</p>\n<p>a li occhi l&igrave; che non t&rsquo;eran possenti.</p></div>\n\n<div class="stanza"><p>Il nome del bel fior ch&rsquo;io sempre invoco</p>\n<p>e mane e sera, tutto mi ristrinse</p>\n<p>l&rsquo;animo ad avvisar lo maggior foco;</p></div>\n\n<div class="stanza"><p>e come ambo le luci mi dipinse</p>\n<p>il quale e il quanto de la viva stella</p>\n<p>che l&agrave; s&ugrave; vince come qua gi&ugrave; vinse,</p></div>\n\n<div class="stanza"><p>per entro il cielo scese una facella,</p>\n<p>formata in cerchio a guisa di corona,</p>\n<p>e cinsela e girossi intorno ad ella.</p></div>\n\n<div class="stanza"><p>Qualunque melodia pi&ugrave; dolce suona</p>\n<p>qua gi&ugrave; e pi&ugrave; a s&eacute; l&rsquo;anima tira,</p>\n<p>parrebbe nube che squarciata tona,</p></div>\n\n<div class="stanza"><p>comparata al sonar di quella lira</p>\n<p>onde si coronava il bel zaffiro</p>\n<p>del quale il ciel pi&ugrave; chiaro s&rsquo;inzaffira.</p></div>\n\n<div class="stanza"><p>&laquo;Io sono amore angelico, che giro</p>\n<p>l&rsquo;alta letizia che spira del ventre</p>\n<p>che fu albergo del nostro disiro;</p></div>\n\n<div class="stanza"><p>e girerommi, donna del ciel, mentre</p>\n<p>che seguirai tuo figlio, e farai dia</p>\n<p>pi&ugrave; la spera suprema perch&eacute; l&igrave; entre&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; la circulata melodia</p>\n<p>si sigillava, e tutti li altri lumi</p>\n<p>facean sonare il nome di Maria.</p></div>\n\n<div class="stanza"><p>Lo real manto di tutti i volumi</p>\n<p>del mondo, che pi&ugrave; ferve e pi&ugrave; s&rsquo;avviva</p>\n<p>ne l&rsquo;alito di Dio e nei costumi,</p></div>\n\n<div class="stanza"><p>avea sopra di noi l&rsquo;interna riva</p>\n<p>tanto distante, che la sua parvenza,</p>\n<p>l&agrave; dov&rsquo; io era, ancor non appariva:</p></div>\n\n<div class="stanza"><p>per&ograve; non ebber li occhi miei potenza</p>\n<p>di seguitar la coronata fiamma</p>\n<p>che si lev&ograve; appresso sua semenza.</p></div>\n\n<div class="stanza"><p>E come fantolin che &rsquo;nver&rsquo; la mamma</p>\n<p>tende le braccia, poi che &rsquo;l latte prese,</p>\n<p>per l&rsquo;animo che &rsquo;nfin di fuor s&rsquo;infiamma;</p></div>\n\n<div class="stanza"><p>ciascun di quei candori in s&ugrave; si stese</p>\n<p>con la sua cima, s&igrave; che l&rsquo;alto affetto</p>\n<p>ch&rsquo;elli avieno a Maria mi fu palese.</p></div>\n\n<div class="stanza"><p>Indi rimaser l&igrave; nel mio cospetto,</p>\n<p>&lsquo;Regina celi&rsquo; cantando s&igrave; dolce,</p>\n<p>che mai da me non si part&igrave; &rsquo;l diletto.</p></div>\n\n<div class="stanza"><p>Oh quanta &egrave; l&rsquo;ubert&agrave; che si soffolce</p>\n<p>in quelle arche ricchissime che fuoro</p>\n<p>a seminar qua gi&ugrave; buone bobolce!</p></div>\n\n<div class="stanza"><p>Quivi si vive e gode del tesoro</p>\n<p>che s&rsquo;acquist&ograve; piangendo ne lo essilio</p>\n<p>di Babill&ograve;n, ove si lasci&ograve; l&rsquo;oro.</p></div>\n\n<div class="stanza"><p>Quivi tr&iuml;unfa, sotto l&rsquo;alto Filio</p>\n<p>di Dio e di Maria, di sua vittoria,</p>\n<p>e con l&rsquo;antico e col novo concilio,</p></div>\n\n<div class="stanza"><p>colui che tien le chiavi di tal gloria.</p></div>','<p class="cantohead">Canto XXIV</p>\n\n<div class="stanza"><p>&laquo;O sodalizio eletto a la gran cena</p>\n<p>del benedetto Agnello, il qual vi ciba</p>\n<p>s&igrave;, che la vostra voglia &egrave; sempre piena,</p></div>\n\n<div class="stanza"><p>se per grazia di Dio questi preliba</p>\n<p>di quel che cade de la vostra mensa,</p>\n<p>prima che morte tempo li prescriba,</p></div>\n\n<div class="stanza"><p>ponete mente a l&rsquo;affezione immensa</p>\n<p>e roratelo alquanto: voi bevete</p>\n<p>sempre del fonte onde vien quel ch&rsquo;ei pensa&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; Beatrice; e quelle anime liete</p>\n<p>si fero spere sopra fissi poli,</p>\n<p>fiammando, a volte, a guisa di comete.</p></div>\n\n<div class="stanza"><p>E come cerchi in tempra d&rsquo;or&iuml;uoli</p>\n<p>si giran s&igrave;, che &rsquo;l primo a chi pon mente</p>\n<p>qu&iuml;eto pare, e l&rsquo;ultimo che voli;</p></div>\n\n<div class="stanza"><p>cos&igrave; quelle carole, differente-</p>\n<p>mente danzando, de la sua ricchezza</p>\n<p>mi facieno stimar, veloci e lente.</p></div>\n\n<div class="stanza"><p>Di quella ch&rsquo;io notai di pi&ugrave; carezza</p>\n<p>vid&rsquo; &iuml;o uscire un foco s&igrave; felice,</p>\n<p>che nullo vi lasci&ograve; di pi&ugrave; chiarezza;</p></div>\n\n<div class="stanza"><p>e tre f&iuml;ate intorno di Beatrice</p>\n<p>si volse con un canto tanto divo,</p>\n<p>che la mia fantasia nol mi ridice.</p></div>\n\n<div class="stanza"><p>Per&ograve; salta la penna e non lo scrivo:</p>\n<p>ch&eacute; l&rsquo;imagine nostra a cotai pieghe,</p>\n<p>non che &rsquo;l parlare, &egrave; troppo color vivo.</p></div>\n\n<div class="stanza"><p>&laquo;O santa suora mia che s&igrave; ne prieghe</p>\n<p>divota, per lo tuo ardente affetto</p>\n<p>da quella bella spera mi disleghe&raquo;.</p></div>\n\n<div class="stanza"><p>Poscia fermato, il foco benedetto</p>\n<p>a la mia donna dirizz&ograve; lo spiro,</p>\n<p>che favell&ograve; cos&igrave; com&rsquo; i&rsquo; ho detto.</p></div>\n\n<div class="stanza"><p>Ed ella: &laquo;O luce etterna del gran viro</p>\n<p>a cui Nostro Segnor lasci&ograve; le chiavi,</p>\n<p>ch&rsquo;ei port&ograve; gi&ugrave;, di questo gaudio miro,</p></div>\n\n<div class="stanza"><p>tenta costui di punti lievi e gravi,</p>\n<p>come ti piace, intorno de la fede,</p>\n<p>per la qual tu su per lo mare andavi.</p></div>\n\n<div class="stanza"><p>S&rsquo;elli ama bene e bene spera e crede,</p>\n<p>non t&rsquo;&egrave; occulto, perch&eacute; &rsquo;l viso hai quivi</p>\n<p>dov&rsquo; ogne cosa dipinta si vede;</p></div>\n\n<div class="stanza"><p>ma perch&eacute; questo regno ha fatto civi</p>\n<p>per la verace fede, a glor&iuml;arla,</p>\n<p>di lei parlare &egrave; ben ch&rsquo;a lui arrivi&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; come il baccialier s&rsquo;arma e non parla</p>\n<p>fin che &rsquo;l maestro la question propone,</p>\n<p>per approvarla, non per terminarla,</p></div>\n\n<div class="stanza"><p>cos&igrave; m&rsquo;armava io d&rsquo;ogne ragione</p>\n<p>mentre ch&rsquo;ella dicea, per esser presto</p>\n<p>a tal querente e a tal professione.</p></div>\n\n<div class="stanza"><p>&laquo;D&igrave;, buon Cristiano, fatti manifesto:</p>\n<p>fede che &egrave;?&raquo;. Ond&rsquo; io levai la fronte</p>\n<p>in quella luce onde spirava questo;</p></div>\n\n<div class="stanza"><p>poi mi volsi a Beatrice, ed essa pronte</p>\n<p>sembianze femmi perch&rsquo; &iuml;o spandessi</p>\n<p>l&rsquo;acqua di fuor del mio interno fonte.</p></div>\n\n<div class="stanza"><p>&laquo;La Grazia che mi d&agrave; ch&rsquo;io mi confessi&raquo;,</p>\n<p>comincia&rsquo; io, &laquo;da l&rsquo;alto primipilo,</p>\n<p>faccia li miei concetti bene espressi&raquo;.</p></div>\n\n<div class="stanza"><p>E seguitai: &laquo;Come &rsquo;l verace stilo</p>\n<p>ne scrisse, padre, del tuo caro frate</p>\n<p>che mise teco Roma nel buon filo,</p></div>\n\n<div class="stanza"><p>fede &egrave; sustanza di cose sperate</p>\n<p>e argomento de le non parventi;</p>\n<p>e questa pare a me sua quiditate&raquo;.</p></div>\n\n<div class="stanza"><p>Allora udi&rsquo;: &laquo;Dirittamente senti,</p>\n<p>se bene intendi perch&eacute; la ripuose</p>\n<p>tra le sustanze, e poi tra li argomenti&raquo;.</p></div>\n\n<div class="stanza"><p>E io appresso: &laquo;Le profonde cose</p>\n<p>che mi largiscon qui la lor parvenza,</p>\n<p>a li occhi di l&agrave; gi&ugrave; son s&igrave; ascose,</p></div>\n\n<div class="stanza"><p>che l&rsquo;esser loro v&rsquo;&egrave; in sola credenza,</p>\n<p>sopra la qual si fonda l&rsquo;alta spene;</p>\n<p>e per&ograve; di sustanza prende intenza.</p></div>\n\n<div class="stanza"><p>E da questa credenza ci convene</p>\n<p>silogizzar, sanz&rsquo; avere altra vista:</p>\n<p>per&ograve; intenza d&rsquo;argomento tene&raquo;.</p></div>\n\n<div class="stanza"><p>Allora udi&rsquo;: &laquo;Se quantunque s&rsquo;acquista</p>\n<p>gi&ugrave; per dottrina, fosse cos&igrave; &rsquo;nteso,</p>\n<p>non l&igrave; avria loco ingegno di sofista&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; spir&ograve; di quello amore acceso;</p>\n<p>indi soggiunse: &laquo;Assai bene &egrave; trascorsa</p>\n<p>d&rsquo;esta moneta gi&agrave; la lega e &rsquo;l peso;</p></div>\n\n<div class="stanza"><p>ma dimmi se tu l&rsquo;hai ne la tua borsa&raquo;.</p>\n<p>Ond&rsquo; io: &laquo;S&igrave; ho, s&igrave; lucida e s&igrave; tonda,</p>\n<p>che nel suo conio nulla mi s&rsquo;inforsa&raquo;.</p></div>\n\n<div class="stanza"><p>Appresso usc&igrave; de la luce profonda</p>\n<p>che l&igrave; splendeva: &laquo;Questa cara gioia</p>\n<p>sopra la quale ogne virt&ugrave; si fonda,</p></div>\n\n<div class="stanza"><p>onde ti venne?&raquo;. E io: &laquo;La larga ploia</p>\n<p>de lo Spirito Santo, ch&rsquo;&egrave; diffusa</p>\n<p>in su le vecchie e &rsquo;n su le nuove cuoia,</p></div>\n\n<div class="stanza"><p>&egrave; silogismo che la m&rsquo;ha conchiusa</p>\n<p>acutamente s&igrave;, che &rsquo;nverso d&rsquo;ella</p>\n<p>ogne dimostrazion mi pare ottusa&raquo;.</p></div>\n\n<div class="stanza"><p>Io udi&rsquo; poi: &laquo;L&rsquo;antica e la novella</p>\n<p>proposizion che cos&igrave; ti conchiude,</p>\n<p>perch&eacute; l&rsquo;hai tu per divina favella?&raquo;.</p></div>\n\n<div class="stanza"><p>E io: &laquo;La prova che &rsquo;l ver mi dischiude,</p>\n<p>son l&rsquo;opere seguite, a che natura</p>\n<p>non scalda ferro mai n&eacute; batte incude&raquo;.</p></div>\n\n<div class="stanza"><p>Risposto fummi: &laquo;D&igrave;, chi t&rsquo;assicura</p>\n<p>che quell&rsquo; opere fosser? Quel medesmo</p>\n<p>che vuol provarsi, non altri, il ti giura&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Se &rsquo;l mondo si rivolse al cristianesmo&raquo;,</p>\n<p>diss&rsquo; io, &laquo;sanza miracoli, quest&rsquo; uno</p>\n<p>&egrave; tal, che li altri non sono il centesmo:</p></div>\n\n<div class="stanza"><p>ch&eacute; tu intrasti povero e digiuno</p>\n<p>in campo, a seminar la buona pianta</p>\n<p>che fu gi&agrave; vite e ora &egrave; fatta pruno&raquo;.</p></div>\n\n<div class="stanza"><p>Finito questo, l&rsquo;alta corte santa</p>\n<p>rison&ograve; per le spere un &lsquo;Dio laudamo&rsquo;</p>\n<p>ne la melode che l&agrave; s&ugrave; si canta.</p></div>\n\n<div class="stanza"><p>E quel baron che s&igrave; di ramo in ramo,</p>\n<p>essaminando, gi&agrave; tratto m&rsquo;avea,</p>\n<p>che a l&rsquo;ultime fronde appressavamo,</p></div>\n\n<div class="stanza"><p>ricominci&ograve;: &laquo;La Grazia, che donnea</p>\n<p>con la tua mente, la bocca t&rsquo;aperse</p>\n<p>infino a qui come aprir si dovea,</p></div>\n\n<div class="stanza"><p>s&igrave; ch&rsquo;io approvo ci&ograve; che fuori emerse;</p>\n<p>ma or convien espremer quel che credi,</p>\n<p>e onde a la credenza tua s&rsquo;offerse&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O santo padre, e spirito che vedi</p>\n<p>ci&ograve; che credesti s&igrave;, che tu vincesti</p>\n<p>ver&rsquo; lo sepulcro pi&ugrave; giovani piedi&raquo;,</p></div>\n\n<div class="stanza"><p>comincia&rsquo; io, &laquo;tu vuo&rsquo; ch&rsquo;io manifesti</p>\n<p>la forma qui del pronto creder mio,</p>\n<p>e anche la cagion di lui chiedesti.</p></div>\n\n<div class="stanza"><p>E io rispondo: Io credo in uno Dio</p>\n<p>solo ed etterno, che tutto &rsquo;l ciel move,</p>\n<p>non moto, con amore e con disio;</p></div>\n\n<div class="stanza"><p>e a tal creder non ho io pur prove</p>\n<p>fisice e metafisice, ma dalmi</p>\n<p>anche la verit&agrave; che quinci piove</p></div>\n\n<div class="stanza"><p>per Mo&iuml;s&egrave;, per profeti e per salmi,</p>\n<p>per l&rsquo;Evangelio e per voi che scriveste</p>\n<p>poi che l&rsquo;ardente Spirto vi f&eacute; almi;</p></div>\n\n<div class="stanza"><p>e credo in tre persone etterne, e queste</p>\n<p>credo una essenza s&igrave; una e s&igrave; trina,</p>\n<p>che soffera congiunto &lsquo;sono&rsquo; ed &lsquo;este&rsquo;.</p></div>\n\n<div class="stanza"><p>De la profonda condizion divina</p>\n<p>ch&rsquo;io tocco mo, la mente mi sigilla</p>\n<p>pi&ugrave; volte l&rsquo;evangelica dottrina.</p></div>\n\n<div class="stanza"><p>Quest&rsquo; &egrave; &rsquo;l principio, quest&rsquo; &egrave; la favilla</p>\n<p>che si dilata in fiamma poi vivace,</p>\n<p>e come stella in cielo in me scintilla&raquo;.</p></div>\n\n<div class="stanza"><p>Come &rsquo;l segnor ch&rsquo;ascolta quel che i piace,</p>\n<p>da indi abbraccia il servo, gratulando</p>\n<p>per la novella, tosto ch&rsquo;el si tace;</p></div>\n\n<div class="stanza"><p>cos&igrave;, benedicendomi cantando,</p>\n<p>tre volte cinse me, s&igrave; com&rsquo; io tacqui,</p>\n<p>l&rsquo;appostolico lume al cui comando</p></div>\n\n<div class="stanza"><p>io avea detto: s&igrave; nel dir li piacqui!</p></div>','<p class="cantohead">Canto XXV</p>\n\n<div class="stanza"><p>Se mai continga che &rsquo;l poema sacro</p>\n<p>al quale ha posto mano e cielo e terra,</p>\n<p>s&igrave; che m&rsquo;ha fatto per molti anni macro,</p></div>\n\n<div class="stanza"><p>vinca la crudelt&agrave; che fuor mi serra</p>\n<p>del bello ovile ov&rsquo; io dormi&rsquo; agnello,</p>\n<p>nimico ai lupi che li danno guerra;</p></div>\n\n<div class="stanza"><p>con altra voce omai, con altro vello</p>\n<p>ritorner&ograve; poeta, e in sul fonte</p>\n<p>del mio battesmo prender&ograve; &rsquo;l cappello;</p></div>\n\n<div class="stanza"><p>per&ograve; che ne la fede, che fa conte</p>\n<p>l&rsquo;anime a Dio, quivi intra&rsquo; io, e poi</p>\n<p>Pietro per lei s&igrave; mi gir&ograve; la fronte.</p></div>\n\n<div class="stanza"><p>Indi si mosse un lume verso noi</p>\n<p>di quella spera ond&rsquo; usc&igrave; la primizia</p>\n<p>che lasci&ograve; Cristo d&rsquo;i vicari suoi;</p></div>\n\n<div class="stanza"><p>e la mia donna, piena di letizia,</p>\n<p>mi disse: &laquo;Mira, mira: ecco il barone</p>\n<p>per cui l&agrave; gi&ugrave; si vicita Galizia&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; come quando il colombo si pone</p>\n<p>presso al compagno, l&rsquo;uno a l&rsquo;altro pande,</p>\n<p>girando e mormorando, l&rsquo;affezione;</p></div>\n\n<div class="stanza"><p>cos&igrave; vid&rsquo; &iuml;o l&rsquo;un da l&rsquo;altro grande</p>\n<p>principe glor&iuml;oso essere accolto,</p>\n<p>laudando il cibo che l&agrave; s&ugrave; li prande.</p></div>\n\n<div class="stanza"><p>Ma poi che &rsquo;l gratular si fu assolto,</p>\n<p>tacito coram me ciascun s&rsquo;affisse,</p>\n<p>ignito s&igrave; che vinc&euml;a &rsquo;l mio volto.</p></div>\n\n<div class="stanza"><p>Ridendo allora B&euml;atrice disse:</p>\n<p>&laquo;Inclita vita per cui la larghezza</p>\n<p>de la nostra basilica si scrisse,</p></div>\n\n<div class="stanza"><p>fa risonar la spene in questa altezza:</p>\n<p>tu sai, che tante fiate la figuri,</p>\n<p>quante Ies&ugrave; ai tre f&eacute; pi&ugrave; carezza&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Leva la testa e fa che t&rsquo;assicuri:</p>\n<p>che ci&ograve; che vien qua s&ugrave; del mortal mondo,</p>\n<p>convien ch&rsquo;ai nostri raggi si maturi&raquo;.</p></div>\n\n<div class="stanza"><p>Questo conforto del foco secondo</p>\n<p>mi venne; ond&rsquo; io lev&auml;i li occhi a&rsquo; monti</p>\n<p>che li &rsquo;ncurvaron pria col troppo pondo.</p></div>\n\n<div class="stanza"><p>&laquo;Poi che per grazia vuol che tu t&rsquo;affronti</p>\n<p>lo nostro Imperadore, anzi la morte,</p>\n<p>ne l&rsquo;aula pi&ugrave; secreta co&rsquo; suoi conti,</p></div>\n\n<div class="stanza"><p>s&igrave; che, veduto il ver di questa corte,</p>\n<p>la spene, che l&agrave; gi&ugrave; bene innamora,</p>\n<p>in te e in altrui di ci&ograve; conforte,</p></div>\n\n<div class="stanza"><p>di&rsquo; quel ch&rsquo;ell&rsquo; &egrave;, di&rsquo; come se ne &rsquo;nfiora</p>\n<p>la mente tua, e d&igrave; onde a te venne&raquo;.</p>\n<p>Cos&igrave; segu&igrave; &rsquo;l secondo lume ancora.</p></div>\n\n<div class="stanza"><p>E quella p&iuml;a che guid&ograve; le penne</p>\n<p>de le mie ali a cos&igrave; alto volo,</p>\n<p>a la risposta cos&igrave; mi prevenne:</p></div>\n\n<div class="stanza"><p>&laquo;La Chiesa militante alcun figliuolo</p>\n<p>non ha con pi&ugrave; speranza, com&rsquo; &egrave; scritto</p>\n<p>nel Sol che raggia tutto nostro stuolo:</p></div>\n\n<div class="stanza"><p>per&ograve; li &egrave; conceduto che d&rsquo;Egitto</p>\n<p>vegna in Ierusalemme per vedere,</p>\n<p>anzi che &rsquo;l militar li sia prescritto.</p></div>\n\n<div class="stanza"><p>Li altri due punti, che non per sapere</p>\n<p>son dimandati, ma perch&rsquo; ei rapporti</p>\n<p>quanto questa virt&ugrave; t&rsquo;&egrave; in piacere,</p></div>\n\n<div class="stanza"><p>a lui lasc&rsquo; io, ch&eacute; non li saran forti</p>\n<p>n&eacute; di iattanza; ed elli a ci&ograve; risponda,</p>\n<p>e la grazia di Dio ci&ograve; li comporti&raquo;.</p></div>\n\n<div class="stanza"><p>Come discente ch&rsquo;a dottor seconda</p>\n<p>pronto e libente in quel ch&rsquo;elli &egrave; esperto,</p>\n<p>perch&eacute; la sua bont&agrave; si disasconda,</p></div>\n\n<div class="stanza"><p>&laquo;Spene&raquo;, diss&rsquo; io, &laquo;&egrave; uno attender certo</p>\n<p>de la gloria futura, il qual produce</p>\n<p>grazia divina e precedente merto.</p></div>\n\n<div class="stanza"><p>Da molte stelle mi vien questa luce;</p>\n<p>ma quei la distill&ograve; nel mio cor pria</p>\n<p>che fu sommo cantor del sommo duce.</p></div>\n\n<div class="stanza"><p>&lsquo;Sperino in te&rsquo;, ne la sua t&euml;odia</p>\n<p>dice, &lsquo;color che sanno il nome tuo&rsquo;:</p>\n<p>e chi nol sa, s&rsquo;elli ha la fede mia?</p></div>\n\n<div class="stanza"><p>Tu mi stillasti, con lo stillar suo,</p>\n<p>ne la pistola poi; s&igrave; ch&rsquo;io son pieno,</p>\n<p>e in altrui vostra pioggia repluo&raquo;.</p></div>\n\n<div class="stanza"><p>Mentr&rsquo; io diceva, dentro al vivo seno</p>\n<p>di quello incendio tremolava un lampo</p>\n<p>s&ugrave;bito e spesso a guisa di baleno.</p></div>\n\n<div class="stanza"><p>Indi spir&ograve;: &laquo;L&rsquo;amore ond&rsquo; &iuml;o avvampo</p>\n<p>ancor ver&rsquo; la virt&ugrave; che mi seguette</p>\n<p>infin la palma e a l&rsquo;uscir del campo,</p></div>\n\n<div class="stanza"><p>vuol ch&rsquo;io respiri a te che ti dilette</p>\n<p>di lei; ed emmi a grato che tu diche</p>\n<p>quello che la speranza ti &rsquo;mpromette&raquo;.</p></div>\n\n<div class="stanza"><p>E io: &laquo;Le nove e le scritture antiche</p>\n<p>pongon lo segno, ed esso lo mi addita,</p>\n<p>de l&rsquo;anime che Dio s&rsquo;ha fatte amiche.</p></div>\n\n<div class="stanza"><p>Dice Isaia che ciascuna vestita</p>\n<p>ne la sua terra fia di doppia vesta:</p>\n<p>e la sua terra &egrave; questa dolce vita;</p></div>\n\n<div class="stanza"><p>e &rsquo;l tuo fratello assai vie pi&ugrave; digesta,</p>\n<p>l&agrave; dove tratta de le bianche stole,</p>\n<p>questa revelazion ci manifesta&raquo;.</p></div>\n\n<div class="stanza"><p>E prima, appresso al fin d&rsquo;este parole,</p>\n<p>&lsquo;Sperent in te&rsquo; di sopr&rsquo; a noi s&rsquo;ud&igrave;;</p>\n<p>a che rispuoser tutte le carole.</p></div>\n\n<div class="stanza"><p>Poscia tra esse un lume si schiar&igrave;</p>\n<p>s&igrave; che, se &rsquo;l Cancro avesse un tal cristallo,</p>\n<p>l&rsquo;inverno avrebbe un mese d&rsquo;un sol d&igrave;.</p></div>\n\n<div class="stanza"><p>E come surge e va ed entra in ballo</p>\n<p>vergine lieta, sol per fare onore</p>\n<p>a la novizia, non per alcun fallo,</p></div>\n\n<div class="stanza"><p>cos&igrave; vid&rsquo; io lo schiarato splendore</p>\n<p>venire a&rsquo; due che si volgieno a nota</p>\n<p>qual conveniesi al loro ardente amore.</p></div>\n\n<div class="stanza"><p>Misesi l&igrave; nel canto e ne la rota;</p>\n<p>e la mia donna in lor tenea l&rsquo;aspetto,</p>\n<p>pur come sposa tacita e immota.</p></div>\n\n<div class="stanza"><p>&laquo;Questi &egrave; colui che giacque sopra &rsquo;l petto</p>\n<p>del nostro pellicano, e questi fue</p>\n<p>di su la croce al grande officio eletto&raquo;.</p></div>\n\n<div class="stanza"><p>La donna mia cos&igrave;; n&eacute; per&ograve; pi&ugrave;e</p>\n<p>mosser la vista sua di stare attenta</p>\n<p>poscia che prima le parole sue.</p></div>\n\n<div class="stanza"><p>Qual &egrave; colui ch&rsquo;adocchia e s&rsquo;argomenta</p>\n<p>di vedere eclissar lo sole un poco,</p>\n<p>che, per veder, non vedente diventa;</p></div>\n\n<div class="stanza"><p>tal mi fec&rsquo; &iuml;o a quell&rsquo; ultimo foco</p>\n<p>mentre che detto fu: &laquo;Perch&eacute; t&rsquo;abbagli</p>\n<p>per veder cosa che qui non ha loco?</p></div>\n\n<div class="stanza"><p>In terra &egrave; terra il mio corpo, e saragli</p>\n<p>tanto con li altri, che &rsquo;l numero nostro</p>\n<p>con l&rsquo;etterno proposito s&rsquo;agguagli.</p></div>\n\n<div class="stanza"><p>Con le due stole nel beato chiostro</p>\n<p>son le due luci sole che saliro;</p>\n<p>e questo apporterai nel mondo vostro&raquo;.</p></div>\n\n<div class="stanza"><p>A questa voce l&rsquo;infiammato giro</p>\n<p>si qu&iuml;et&ograve; con esso il dolce mischio</p>\n<p>che si facea nel suon del trino spiro,</p></div>\n\n<div class="stanza"><p>s&igrave; come, per cessar fatica o rischio,</p>\n<p>li remi, pria ne l&rsquo;acqua ripercossi,</p>\n<p>tutti si posano al sonar d&rsquo;un fischio.</p></div>\n\n<div class="stanza"><p>Ahi quanto ne la mente mi commossi,</p>\n<p>quando mi volsi per veder Beatrice,</p>\n<p>per non poter veder, bench&eacute; io fossi</p></div>\n\n<div class="stanza"><p>presso di lei, e nel mondo felice!</p></div>','<p class="cantohead">Canto XXVI</p>\n\n<div class="stanza"><p>Mentr&rsquo; io dubbiava per lo viso spento,</p>\n<p>de la fulgida fiamma che lo spense</p>\n<p>usc&igrave; un spiro che mi fece attento,</p></div>\n\n<div class="stanza"><p>dicendo: &laquo;Intanto che tu ti risense</p>\n<p>de la vista che ha&iuml; in me consunta,</p>\n<p>ben &egrave; che ragionando la compense.</p></div>\n\n<div class="stanza"><p>Comincia dunque; e d&igrave; ove s&rsquo;appunta</p>\n<p>l&rsquo;anima tua, e fa ragion che sia</p>\n<p>la vista in te smarrita e non defunta:</p></div>\n\n<div class="stanza"><p>perch&eacute; la donna che per questa dia</p>\n<p>reg&iuml;on ti conduce, ha ne lo sguardo</p>\n<p>la virt&ugrave; ch&rsquo;ebbe la man d&rsquo;Anania&raquo;.</p></div>\n\n<div class="stanza"><p>Io dissi: &laquo;Al suo piacere e tosto e tardo</p>\n<p>vegna remedio a li occhi, che fuor porte</p>\n<p>quand&rsquo; ella entr&ograve; col foco ond&rsquo; io sempr&rsquo; ardo.</p></div>\n\n<div class="stanza"><p>Lo ben che fa contenta questa corte,</p>\n<p>Alfa e O &egrave; di quanta scrittura</p>\n<p>mi legge Amore o lievemente o forte&raquo;.</p></div>\n\n<div class="stanza"><p>Quella medesma voce che paura</p>\n<p>tolta m&rsquo;avea del s&ugrave;bito abbarbaglio,</p>\n<p>di ragionare ancor mi mise in cura;</p></div>\n\n<div class="stanza"><p>e disse: &laquo;Certo a pi&ugrave; angusto vaglio</p>\n<p>ti conviene schiarar: dicer convienti</p>\n<p>chi drizz&ograve; l&rsquo;arco tuo a tal berzaglio&raquo;.</p></div>\n\n<div class="stanza"><p>E io: &laquo;Per filosofici argomenti</p>\n<p>e per autorit&agrave; che quinci scende</p>\n<p>cotale amor convien che in me si &rsquo;mprenti:</p></div>\n\n<div class="stanza"><p>ch&eacute; &rsquo;l bene, in quanto ben, come s&rsquo;intende,</p>\n<p>cos&igrave; accende amore, e tanto maggio</p>\n<p>quanto pi&ugrave; di bontate in s&eacute; comprende.</p></div>\n\n<div class="stanza"><p>Dunque a l&rsquo;essenza ov&rsquo; &egrave; tanto avvantaggio,</p>\n<p>che ciascun ben che fuor di lei si trova</p>\n<p>altro non &egrave; ch&rsquo;un lume di suo raggio,</p></div>\n\n<div class="stanza"><p>pi&ugrave; che in altra convien che si mova</p>\n<p>la mente, amando, di ciascun che cerne</p>\n<p>il vero in che si fonda questa prova.</p></div>\n\n<div class="stanza"><p>Tal vero a l&rsquo;intelletto m&iuml;o sterne</p>\n<p>colui che mi dimostra il primo amore</p>\n<p>di tutte le sustanze sempiterne.</p></div>\n\n<div class="stanza"><p>Sternel la voce del verace autore,</p>\n<p>che dice a Mo&iuml;s&egrave;, di s&eacute; parlando:</p>\n<p>&lsquo;Io ti far&ograve; vedere ogne valore&rsquo;.</p></div>\n\n<div class="stanza"><p>Sternilmi tu ancora, incominciando</p>\n<p>l&rsquo;alto preconio che grida l&rsquo;arcano</p>\n<p>di qui l&agrave; gi&ugrave; sovra ogne altro bando&raquo;.</p></div>\n\n<div class="stanza"><p>E io udi&rsquo;: &laquo;Per intelletto umano</p>\n<p>e per autoritadi a lui concorde</p>\n<p>d&rsquo;i tuoi amori a Dio guarda il sovrano.</p></div>\n\n<div class="stanza"><p>Ma d&igrave; ancor se tu senti altre corde</p>\n<p>tirarti verso lui, s&igrave; che tu suone</p>\n<p>con quanti denti questo amor ti morde&raquo;.</p></div>\n\n<div class="stanza"><p>Non fu latente la santa intenzione</p>\n<p>de l&rsquo;aguglia di Cristo, anzi m&rsquo;accorsi</p>\n<p>dove volea menar mia professione.</p></div>\n\n<div class="stanza"><p>Per&ograve; ricominciai: &laquo;Tutti quei morsi</p>\n<p>che posson far lo cor volgere a Dio,</p>\n<p>a la mia caritate son concorsi:</p></div>\n\n<div class="stanza"><p>ch&eacute; l&rsquo;essere del mondo e l&rsquo;esser mio,</p>\n<p>la morte ch&rsquo;el sostenne perch&rsquo; io viva,</p>\n<p>e quel che spera ogne fedel com&rsquo; io,</p></div>\n\n<div class="stanza"><p>con la predetta conoscenza viva,</p>\n<p>tratto m&rsquo;hanno del mar de l&rsquo;amor torto,</p>\n<p>e del diritto m&rsquo;han posto a la riva.</p></div>\n\n<div class="stanza"><p>Le fronde onde s&rsquo;infronda tutto l&rsquo;orto</p>\n<p>de l&rsquo;ortolano etterno, am&rsquo; io cotanto</p>\n<p>quanto da lui a lor di bene &egrave; porto&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; com&rsquo; io tacqui, un dolcissimo canto</p>\n<p>rison&ograve; per lo cielo, e la mia donna</p>\n<p>dicea con li altri: &laquo;Santo, santo, santo!&raquo;.</p></div>\n\n<div class="stanza"><p>E come a lume acuto si disonna</p>\n<p>per lo spirto visivo che ricorre</p>\n<p>a lo splendor che va di gonna in gonna,</p></div>\n\n<div class="stanza"><p>e lo svegliato ci&ograve; che vede aborre,</p>\n<p>s&igrave; nesc&iuml;a &egrave; la s&ugrave;bita vigilia</p>\n<p>fin che la stimativa non soccorre;</p></div>\n\n<div class="stanza"><p>cos&igrave; de li occhi miei ogne quisquilia</p>\n<p>fug&ograve; Beatrice col raggio d&rsquo;i suoi,</p>\n<p>che rifulgea da pi&ugrave; di mille milia:</p></div>\n\n<div class="stanza"><p>onde mei che dinanzi vidi poi;</p>\n<p>e quasi stupefatto domandai</p>\n<p>d&rsquo;un quarto lume ch&rsquo;io vidi tra noi.</p></div>\n\n<div class="stanza"><p>E la mia donna: &laquo;Dentro da quei rai</p>\n<p>vagheggia il suo fattor l&rsquo;anima prima</p>\n<p>che la prima virt&ugrave; creasse mai&raquo;.</p></div>\n\n<div class="stanza"><p>Come la fronda che flette la cima</p>\n<p>nel transito del vento, e poi si leva</p>\n<p>per la propria virt&ugrave; che la soblima,</p></div>\n\n<div class="stanza"><p>fec&rsquo; io in tanto in quant&rsquo; ella diceva,</p>\n<p>stupendo, e poi mi rifece sicuro</p>\n<p>un disio di parlare ond&rsquo; &iuml;o ardeva.</p></div>\n\n<div class="stanza"><p>E cominciai: &laquo;O pomo che maturo</p>\n<p>solo prodotto fosti, o padre antico</p>\n<p>a cui ciascuna sposa &egrave; figlia e nuro,</p></div>\n\n<div class="stanza"><p>divoto quanto posso a te suppl&igrave;co</p>\n<p>perch&eacute; mi parli: tu vedi mia voglia,</p>\n<p>e per udirti tosto non la dico&raquo;.</p></div>\n\n<div class="stanza"><p>Talvolta un animal coverto broglia,</p>\n<p>s&igrave; che l&rsquo;affetto convien che si paia</p>\n<p>per lo seguir che face a lui la &rsquo;nvoglia;</p></div>\n\n<div class="stanza"><p>e similmente l&rsquo;anima primaia</p>\n<p>mi facea trasparer per la coverta</p>\n<p>quant&rsquo; ella a compiacermi ven&igrave;a gaia.</p></div>\n\n<div class="stanza"><p>Indi spir&ograve;: &laquo;Sanz&rsquo; essermi proferta</p>\n<p>da te, la voglia tua discerno meglio</p>\n<p>che tu qualunque cosa t&rsquo;&egrave; pi&ugrave; certa;</p></div>\n\n<div class="stanza"><p>perch&rsquo; io la veggio nel verace speglio</p>\n<p>che fa di s&eacute; pareglio a l&rsquo;altre cose,</p>\n<p>e nulla face lui di s&eacute; pareglio.</p></div>\n\n<div class="stanza"><p>Tu vuogli udir quant&rsquo; &egrave; che Dio mi puose</p>\n<p>ne l&rsquo;eccelso giardino, ove costei</p>\n<p>a cos&igrave; lunga scala ti dispuose,</p></div>\n\n<div class="stanza"><p>e quanto fu diletto a li occhi miei,</p>\n<p>e la propria cagion del gran disdegno,</p>\n<p>e l&rsquo;id&iuml;oma ch&rsquo;usai e che fei.</p></div>\n\n<div class="stanza"><p>Or, figluol mio, non il gustar del legno</p>\n<p>fu per s&eacute; la cagion di tanto essilio,</p>\n<p>ma solamente il trapassar del segno.</p></div>\n\n<div class="stanza"><p>Quindi onde mosse tua donna Virgilio,</p>\n<p>quattromilia trecento e due volumi</p>\n<p>di sol desiderai questo concilio;</p></div>\n\n<div class="stanza"><p>e vidi lui tornare a tutt&rsquo; i lumi</p>\n<p>de la sua strada novecento trenta</p>\n<p>f&iuml;ate, mentre ch&rsquo;&iuml;o in terra fu&rsquo;mi.</p></div>\n\n<div class="stanza"><p>La lingua ch&rsquo;io parlai fu tutta spenta</p>\n<p>innanzi che a l&rsquo;ovra inconsummabile</p>\n<p>fosse la gente di Nembr&ograve;t attenta:</p></div>\n\n<div class="stanza"><p>ch&eacute; nullo effetto mai raz&iuml;onabile,</p>\n<p>per lo piacere uman che rinovella</p>\n<p>seguendo il cielo, sempre fu durabile.</p></div>\n\n<div class="stanza"><p>Opera naturale &egrave; ch&rsquo;uom favella;</p>\n<p>ma cos&igrave; o cos&igrave;, natura lascia</p>\n<p>poi fare a voi secondo che v&rsquo;abbella.</p></div>\n\n<div class="stanza"><p>Pria ch&rsquo;i&rsquo; scendessi a l&rsquo;infernale ambascia,</p>\n<p>I s&rsquo;appellava in terra il sommo bene</p>\n<p>onde vien la letizia che mi fascia;</p></div>\n\n<div class="stanza"><p>e El si chiam&ograve; poi: e ci&ograve; convene,</p>\n<p>ch&eacute; l&rsquo;uso d&rsquo;i mortali &egrave; come fronda</p>\n<p>in ramo, che sen va e altra vene.</p></div>\n\n<div class="stanza"><p>Nel monte che si leva pi&ugrave; da l&rsquo;onda,</p>\n<p>fu&rsquo; io, con vita pura e disonesta,</p>\n<p>da la prim&rsquo; ora a quella che seconda,</p></div>\n\n<div class="stanza"><p>come &rsquo;l sol muta quadra, l&rsquo;ora sesta&raquo;.</p></div>','<p class="cantohead">Canto XXVII</p>\n\n<div class="stanza"><p>&lsquo;Al Padre, al Figlio, a lo Spirito Santo&rsquo;,</p>\n<p>cominci&ograve;, &lsquo;gloria!&rsquo;, tutto &rsquo;l paradiso,</p>\n<p>s&igrave; che m&rsquo;inebr&iuml;ava il dolce canto.</p></div>\n\n<div class="stanza"><p>Ci&ograve; ch&rsquo;io vedeva mi sembiava un riso</p>\n<p>de l&rsquo;universo; per che mia ebbrezza</p>\n<p>intrava per l&rsquo;udire e per lo viso.</p></div>\n\n<div class="stanza"><p>Oh gioia! oh ineffabile allegrezza!</p>\n<p>oh vita int&egrave;gra d&rsquo;amore e di pace!</p>\n<p>oh sanza brama sicura ricchezza!</p></div>\n\n<div class="stanza"><p>Dinanzi a li occhi miei le quattro face</p>\n<p>stavano accese, e quella che pria venne</p>\n<p>incominci&ograve; a farsi pi&ugrave; vivace,</p></div>\n\n<div class="stanza"><p>e tal ne la sembianza sua divenne,</p>\n<p>qual diverrebbe Iove, s&rsquo;elli e Marte</p>\n<p>fossero augelli e cambiassersi penne.</p></div>\n\n<div class="stanza"><p>La provedenza, che quivi comparte</p>\n<p>vice e officio, nel beato coro</p>\n<p>silenzio posto avea da ogne parte,</p></div>\n\n<div class="stanza"><p>quand&rsquo; &iuml;o udi&rsquo;: &laquo;Se io mi trascoloro,</p>\n<p>non ti maravigliar, ch&eacute;, dicend&rsquo; io,</p>\n<p>vedrai trascolorar tutti costoro.</p></div>\n\n<div class="stanza"><p>Quelli ch&rsquo;usurpa in terra il luogo mio,</p>\n<p>il luogo mio, il luogo mio, che vaca</p>\n<p>ne la presenza del Figliuol di Dio,</p></div>\n\n<div class="stanza"><p>fatt&rsquo; ha del cimitero mio cloaca</p>\n<p>del sangue e de la puzza; onde &rsquo;l perverso</p>\n<p>che cadde di qua s&ugrave;, l&agrave; gi&ugrave; si placa&raquo;.</p></div>\n\n<div class="stanza"><p>Di quel color che per lo sole avverso</p>\n<p>nube dipigne da sera e da mane,</p>\n<p>vid&rsquo; &iuml;o allora tutto &rsquo;l ciel cosperso.</p></div>\n\n<div class="stanza"><p>E come donna onesta che permane</p>\n<p>di s&eacute; sicura, e per l&rsquo;altrui fallanza,</p>\n<p>pur ascoltando, timida si fane,</p></div>\n\n<div class="stanza"><p>cos&igrave; Beatrice trasmut&ograve; sembianza;</p>\n<p>e tale eclissi credo che &rsquo;n ciel fue</p>\n<p>quando pat&igrave; la supprema possanza.</p></div>\n\n<div class="stanza"><p>Poi procedetter le parole sue</p>\n<p>con voce tanto da s&eacute; trasmutata,</p>\n<p>che la sembianza non si mut&ograve; pi&ugrave;e:</p></div>\n\n<div class="stanza"><p>&laquo;Non fu la sposa di Cristo allevata</p>\n<p>del sangue mio, di Lin, di quel di Cleto,</p>\n<p>per essere ad acquisto d&rsquo;oro usata;</p></div>\n\n<div class="stanza"><p>ma per acquisto d&rsquo;esto viver lieto</p>\n<p>e Sisto e P&iuml;o e Calisto e Urbano</p>\n<p>sparser lo sangue dopo molto fleto.</p></div>\n\n<div class="stanza"><p>Non fu nostra intenzion ch&rsquo;a destra mano</p>\n<p>d&rsquo;i nostri successor parte sedesse,</p>\n<p>parte da l&rsquo;altra del popol cristiano;</p></div>\n\n<div class="stanza"><p>n&eacute; che le chiavi che mi fuor concesse,</p>\n<p>divenisser signaculo in vessillo</p>\n<p>che contra battezzati combattesse;</p></div>\n\n<div class="stanza"><p>n&eacute; ch&rsquo;io fossi figura di sigillo</p>\n<p>a privilegi venduti e mendaci,</p>\n<p>ond&rsquo; io sovente arrosso e disfavillo.</p></div>\n\n<div class="stanza"><p>In vesta di pastor lupi rapaci</p>\n<p>si veggion di qua s&ugrave; per tutti i paschi:</p>\n<p>o difesa di Dio, perch&eacute; pur giaci?</p></div>\n\n<div class="stanza"><p>Del sangue nostro Caorsini e Guaschi</p>\n<p>s&rsquo;apparecchian di bere: o buon principio,</p>\n<p>a che vil fine convien che tu caschi!</p></div>\n\n<div class="stanza"><p>Ma l&rsquo;alta provedenza, che con Scipio</p>\n<p>difese a Roma la gloria del mondo,</p>\n<p>soccorr&agrave; tosto, s&igrave; com&rsquo; io concipio;</p></div>\n\n<div class="stanza"><p>e tu, figliuol, che per lo mortal pondo</p>\n<p>ancor gi&ugrave; tornerai, apri la bocca,</p>\n<p>e non asconder quel ch&rsquo;io non ascondo&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; come di vapor gelati fiocca</p>\n<p>in giuso l&rsquo;aere nostro, quando &rsquo;l corno</p>\n<p>de la capra del ciel col sol si tocca,</p></div>\n\n<div class="stanza"><p>in s&ugrave; vid&rsquo; io cos&igrave; l&rsquo;etera addorno</p>\n<p>farsi e fioccar di vapor tr&iuml;unfanti</p>\n<p>che fatto avien con noi quivi soggiorno.</p></div>\n\n<div class="stanza"><p>Lo viso mio seguiva i suoi sembianti,</p>\n<p>e segu&igrave; fin che &rsquo;l mezzo, per lo molto,</p>\n<p>li tolse il trapassar del pi&ugrave; avanti.</p></div>\n\n<div class="stanza"><p>Onde la donna, che mi vide assolto</p>\n<p>de l&rsquo;attendere in s&ugrave;, mi disse: &laquo;Adima</p>\n<p>il viso e guarda come tu se&rsquo; v&ograve;lto&raquo;.</p></div>\n\n<div class="stanza"><p>Da l&rsquo;ora ch&rsquo;&iuml;o avea guardato prima</p>\n<p>i&rsquo; vidi mosso me per tutto l&rsquo;arco</p>\n<p>che fa dal mezzo al fine il primo clima;</p></div>\n\n<div class="stanza"><p>s&igrave; ch&rsquo;io vedea di l&agrave; da Gade il varco</p>\n<p>folle d&rsquo;Ulisse, e di qua presso il lito</p>\n<p>nel qual si fece Europa dolce carco.</p></div>\n\n<div class="stanza"><p>E pi&ugrave; mi fora discoverto il sito</p>\n<p>di questa aiuola; ma &rsquo;l sol procedea</p>\n<p>sotto i mie&rsquo; piedi un segno e pi&ugrave; partito.</p></div>\n\n<div class="stanza"><p>La mente innamorata, che donnea</p>\n<p>con la mia donna sempre, di ridure</p>\n<p>ad essa li occhi pi&ugrave; che mai ardea;</p></div>\n\n<div class="stanza"><p>e se natura o arte f&eacute; pasture</p>\n<p>da pigliare occhi, per aver la mente,</p>\n<p>in carne umana o ne le sue pitture,</p></div>\n\n<div class="stanza"><p>tutte adunate, parrebber n&iuml;ente</p>\n<p>ver&rsquo; lo piacer divin che mi refulse,</p>\n<p>quando mi volsi al suo viso ridente.</p></div>\n\n<div class="stanza"><p>E la virt&ugrave; che lo sguardo m&rsquo;indulse,</p>\n<p>del bel nido di Leda mi divelse,</p>\n<p>e nel ciel velocissimo m&rsquo;impulse.</p></div>\n\n<div class="stanza"><p>Le parti sue vivissime ed eccelse</p>\n<p>s&igrave; uniforme son, ch&rsquo;i&rsquo; non so dire</p>\n<p>qual B&euml;atrice per loco mi scelse.</p></div>\n\n<div class="stanza"><p>Ma ella, che ved&euml;a &rsquo;l mio disire,</p>\n<p>incominci&ograve;, ridendo tanto lieta,</p>\n<p>che Dio parea nel suo volto gioire:</p></div>\n\n<div class="stanza"><p>&laquo;La natura del mondo, che qu&iuml;eta</p>\n<p>il mezzo e tutto l&rsquo;altro intorno move,</p>\n<p>quinci comincia come da sua meta;</p></div>\n\n<div class="stanza"><p>e questo cielo non ha altro dove</p>\n<p>che la mente divina, in che s&rsquo;accende</p>\n<p>l&rsquo;amor che &rsquo;l volge e la virt&ugrave; ch&rsquo;ei piove.</p></div>\n\n<div class="stanza"><p>Luce e amor d&rsquo;un cerchio lui comprende,</p>\n<p>s&igrave; come questo li altri; e quel precinto</p>\n<p>colui che &rsquo;l cinge solamente intende.</p></div>\n\n<div class="stanza"><p>Non &egrave; suo moto per altro distinto,</p>\n<p>ma li altri son mensurati da questo,</p>\n<p>s&igrave; come diece da mezzo e da quinto;</p></div>\n\n<div class="stanza"><p>e come il tempo tegna in cotal testo</p>\n<p>le sue radici e ne li altri le fronde,</p>\n<p>omai a te pu&ograve; esser manifesto.</p></div>\n\n<div class="stanza"><p>Oh cupidigia che i mortali affonde</p>\n<p>s&igrave; sotto te, che nessuno ha podere</p>\n<p>di trarre li occhi fuor de le tue onde!</p></div>\n\n<div class="stanza"><p>Ben fiorisce ne li uomini il volere;</p>\n<p>ma la pioggia contin&uuml;a converte</p>\n<p>in bozzacchioni le sosine vere.</p></div>\n\n<div class="stanza"><p>Fede e innocenza son reperte</p>\n<p>solo ne&rsquo; parvoletti; poi ciascuna</p>\n<p>pria fugge che le guance sian coperte.</p></div>\n\n<div class="stanza"><p>Tale, balbuz&iuml;endo ancor, digiuna,</p>\n<p>che poi divora, con la lingua sciolta,</p>\n<p>qualunque cibo per qualunque luna;</p></div>\n\n<div class="stanza"><p>e tal, balbuz&iuml;endo, ama e ascolta</p>\n<p>la madre sua, che, con loquela intera,</p>\n<p>dis&iuml;a poi di vederla sepolta.</p></div>\n\n<div class="stanza"><p>Cos&igrave; si fa la pelle bianca nera</p>\n<p>nel primo aspetto de la bella figlia</p>\n<p>di quel ch&rsquo;apporta mane e lascia sera.</p></div>\n\n<div class="stanza"><p>Tu, perch&eacute; non ti facci maraviglia,</p>\n<p>pensa che &rsquo;n terra non &egrave; chi governi;</p>\n<p>onde s&igrave; sv&iuml;a l&rsquo;umana famiglia.</p></div>\n\n<div class="stanza"><p>Ma prima che gennaio tutto si sverni</p>\n<p>per la centesma ch&rsquo;&egrave; l&agrave; gi&ugrave; negletta,</p>\n<p>raggeran s&igrave; questi cerchi superni,</p></div>\n\n<div class="stanza"><p>che la fortuna che tanto s&rsquo;aspetta,</p>\n<p>le poppe volger&agrave; u&rsquo; son le prore,</p>\n<p>s&igrave; che la classe correr&agrave; diretta;</p></div>\n\n<div class="stanza"><p>e vero frutto verr&agrave; dopo &rsquo;l fiore&raquo;.</p></div>','<p class="cantohead">Canto XXVIII</p>\n\n<div class="stanza"><p>Poscia che &rsquo;ncontro a la vita presente</p>\n<p>d&rsquo;i miseri mortali aperse &rsquo;l vero</p>\n<p>quella che &rsquo;mparadisa la mia mente,</p></div>\n\n<div class="stanza"><p>come in lo specchio fiamma di doppiero</p>\n<p>vede colui che se n&rsquo;alluma retro,</p>\n<p>prima che l&rsquo;abbia in vista o in pensiero,</p></div>\n\n<div class="stanza"><p>e s&eacute; rivolge per veder se &rsquo;l vetro</p>\n<p>li dice il vero, e vede ch&rsquo;el s&rsquo;accorda</p>\n<p>con esso come nota con suo metro;</p></div>\n\n<div class="stanza"><p>cos&igrave; la mia memoria si ricorda</p>\n<p>ch&rsquo;io feci riguardando ne&rsquo; belli occhi</p>\n<p>onde a pigliarmi fece Amor la corda.</p></div>\n\n<div class="stanza"><p>E com&rsquo; io mi rivolsi e furon tocchi</p>\n<p>li miei da ci&ograve; che pare in quel volume,</p>\n<p>quandunque nel suo giro ben s&rsquo;adocchi,</p></div>\n\n<div class="stanza"><p>un punto vidi che raggiava lume</p>\n<p>acuto s&igrave;, che &rsquo;l viso ch&rsquo;elli affoca</p>\n<p>chiuder conviensi per lo forte acume;</p></div>\n\n<div class="stanza"><p>e quale stella par quinci pi&ugrave; poca,</p>\n<p>parrebbe luna, locata con esso</p>\n<p>come stella con stella si coll&ograve;ca.</p></div>\n\n<div class="stanza"><p>Forse cotanto quanto pare appresso</p>\n<p>alo cigner la luce che &rsquo;l dipigne</p>\n<p>quando &rsquo;l vapor che &rsquo;l porta pi&ugrave; &egrave; spesso,</p></div>\n\n<div class="stanza"><p>distante intorno al punto un cerchio d&rsquo;igne</p>\n<p>si girava s&igrave; ratto, ch&rsquo;avria vinto</p>\n<p>quel moto che pi&ugrave; tosto il mondo cigne;</p></div>\n\n<div class="stanza"><p>e questo era d&rsquo;un altro circumcinto,</p>\n<p>e quel dal terzo, e &rsquo;l terzo poi dal quarto,</p>\n<p>dal quinto il quarto, e poi dal sesto il quinto.</p></div>\n\n<div class="stanza"><p>Sopra seguiva il settimo s&igrave; sparto</p>\n<p>gi&agrave; di larghezza, che &rsquo;l messo di Iuno</p>\n<p>intero a contenerlo sarebbe arto.</p></div>\n\n<div class="stanza"><p>Cos&igrave; l&rsquo;ottavo e &rsquo;l nono; e chiascheduno</p>\n<p>pi&ugrave; tardo si movea, secondo ch&rsquo;era</p>\n<p>in numero distante pi&ugrave; da l&rsquo;uno;</p></div>\n\n<div class="stanza"><p>e quello avea la fiamma pi&ugrave; sincera</p>\n<p>cui men distava la favilla pura,</p>\n<p>credo, per&ograve; che pi&ugrave; di lei s&rsquo;invera.</p></div>\n\n<div class="stanza"><p>La donna mia, che mi ved&euml;a in cura</p>\n<p>forte sospeso, disse: &laquo;Da quel punto</p>\n<p>depende il cielo e tutta la natura.</p></div>\n\n<div class="stanza"><p>Mira quel cerchio che pi&ugrave; li &egrave; congiunto;</p>\n<p>e sappi che &rsquo;l suo muovere &egrave; s&igrave; tosto</p>\n<p>per l&rsquo;affocato amore ond&rsquo; elli &egrave; punto&raquo;.</p></div>\n\n<div class="stanza"><p>E io a lei: &laquo;Se &rsquo;l mondo fosse posto</p>\n<p>con l&rsquo;ordine ch&rsquo;io veggio in quelle rote,</p>\n<p>sazio m&rsquo;avrebbe ci&ograve; che m&rsquo;&egrave; proposto;</p></div>\n\n<div class="stanza"><p>ma nel mondo sensibile si puote</p>\n<p>veder le volte tanto pi&ugrave; divine,</p>\n<p>quant&rsquo; elle son dal centro pi&ugrave; remote.</p></div>\n\n<div class="stanza"><p>Onde, se &rsquo;l mio disir dee aver fine</p>\n<p>in questo miro e angelico templo</p>\n<p>che solo amore e luce ha per confine,</p></div>\n\n<div class="stanza"><p>udir convienmi ancor come l&rsquo;essemplo</p>\n<p>e l&rsquo;essemplare non vanno d&rsquo;un modo,</p>\n<p>ch&eacute; io per me indarno a ci&ograve; contemplo&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Se li tuoi diti non sono a tal nodo</p>\n<p>suffic&iuml;enti, non &egrave; maraviglia:</p>\n<p>tanto, per non tentare, &egrave; fatto sodo!&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; la donna mia; poi disse: &laquo;Piglia</p>\n<p>quel ch&rsquo;io ti dicer&ograve;, se vuo&rsquo; saziarti;</p>\n<p>e intorno da esso t&rsquo;assottiglia.</p></div>\n\n<div class="stanza"><p>Li cerchi corporai sono ampi e arti</p>\n<p>secondo il pi&ugrave; e &rsquo;l men de la virtute</p>\n<p>che si distende per tutte lor parti.</p></div>\n\n<div class="stanza"><p>Maggior bont&agrave; vuol far maggior salute;</p>\n<p>maggior salute maggior corpo cape,</p>\n<p>s&rsquo;elli ha le parti igualmente compiute.</p></div>\n\n<div class="stanza"><p>Dunque costui che tutto quanto rape</p>\n<p>l&rsquo;altro universo seco, corrisponde</p>\n<p>al cerchio che pi&ugrave; ama e che pi&ugrave; sape:</p></div>\n\n<div class="stanza"><p>per che, se tu a la virt&ugrave; circonde</p>\n<p>la tua misura, non a la parvenza</p>\n<p>de le sustanze che t&rsquo;appaion tonde,</p></div>\n\n<div class="stanza"><p>tu vederai mirabil consequenza</p>\n<p>di maggio a pi&ugrave; e di minore a meno,</p>\n<p>in ciascun cielo, a s&uuml;a intelligenza&raquo;.</p></div>\n\n<div class="stanza"><p>Come rimane splendido e sereno</p>\n<p>l&rsquo;emisperio de l&rsquo;aere, quando soffia</p>\n<p>Borea da quella guancia ond&rsquo; &egrave; pi&ugrave; leno,</p></div>\n\n<div class="stanza"><p>per che si purga e risolve la roffia</p>\n<p>che pria turbava, s&igrave; che &rsquo;l ciel ne ride</p>\n<p>con le bellezze d&rsquo;ogne sua paroffia;</p></div>\n\n<div class="stanza"><p>cos&igrave; fec&rsquo;&iuml;o, poi che mi provide</p>\n<p>la donna mia del suo risponder chiaro,</p>\n<p>e come stella in cielo il ver si vide.</p></div>\n\n<div class="stanza"><p>E poi che le parole sue restaro,</p>\n<p>non altrimenti ferro disfavilla</p>\n<p>che bolle, come i cerchi sfavillaro.</p></div>\n\n<div class="stanza"><p>L&rsquo;incendio suo seguiva ogne scintilla;</p>\n<p>ed eran tante, che &rsquo;l numero loro</p>\n<p>pi&ugrave; che &rsquo;l doppiar de li scacchi s&rsquo;inmilla.</p></div>\n\n<div class="stanza"><p>Io sentiva osannar di coro in coro</p>\n<p>al punto fisso che li tiene a li ubi,</p>\n<p>e terr&agrave; sempre, ne&rsquo; quai sempre fuoro.</p></div>\n\n<div class="stanza"><p>E quella che ved&euml;a i pensier dubi</p>\n<p>ne la mia mente, disse: &laquo;I cerchi primi</p>\n<p>t&rsquo;hanno mostrato Serafi e Cherubi.</p></div>\n\n<div class="stanza"><p>Cos&igrave; veloci seguono i suoi vimi,</p>\n<p>per somigliarsi al punto quanto ponno;</p>\n<p>e posson quanto a veder son soblimi.</p></div>\n\n<div class="stanza"><p>Quelli altri amori che &rsquo;ntorno li vonno,</p>\n<p>si chiaman Troni del divino aspetto,</p>\n<p>per che &rsquo;l primo ternaro terminonno;</p></div>\n\n<div class="stanza"><p>e dei saper che tutti hanno diletto</p>\n<p>quanto la sua veduta si profonda</p>\n<p>nel vero in che si queta ogne intelletto.</p></div>\n\n<div class="stanza"><p>Quinci si pu&ograve; veder come si fonda</p>\n<p>l&rsquo;esser beato ne l&rsquo;atto che vede,</p>\n<p>non in quel ch&rsquo;ama, che poscia seconda;</p></div>\n\n<div class="stanza"><p>e del vedere &egrave; misura mercede,</p>\n<p>che grazia partorisce e buona voglia:</p>\n<p>cos&igrave; di grado in grado si procede.</p></div>\n\n<div class="stanza"><p>L&rsquo;altro ternaro, che cos&igrave; germoglia</p>\n<p>in questa primavera sempiterna</p>\n<p>che notturno Ar&iuml;ete non dispoglia,</p></div>\n\n<div class="stanza"><p>perpet&uuml;alemente &lsquo;Osanna&rsquo; sberna</p>\n<p>con tre melode, che suonano in tree</p>\n<p>ordini di letizia onde s&rsquo;interna.</p></div>\n\n<div class="stanza"><p>In essa gerarcia son l&rsquo;altre dee:</p>\n<p>prima Dominazioni, e poi Virtudi;</p>\n<p>l&rsquo;ordine terzo di Podestadi &egrave;e.</p></div>\n\n<div class="stanza"><p>Poscia ne&rsquo; due penultimi tripudi</p>\n<p>Principati e Arcangeli si girano;</p>\n<p>l&rsquo;ultimo &egrave; tutto d&rsquo;Angelici ludi.</p></div>\n\n<div class="stanza"><p>Questi ordini di s&ugrave; tutti s&rsquo;ammirano,</p>\n<p>e di gi&ugrave; vincon s&igrave;, che verso Dio</p>\n<p>tutti tirati sono e tutti tirano.</p></div>\n\n<div class="stanza"><p>E D&iuml;onisio con tanto disio</p>\n<p>a contemplar questi ordini si mise,</p>\n<p>che li nom&ograve; e distinse com&rsquo; io.</p></div>\n\n<div class="stanza"><p>Ma Gregorio da lui poi si divise;</p>\n<p>onde, s&igrave; tosto come li occhi aperse</p>\n<p>in questo ciel, di s&eacute; medesmo rise.</p></div>\n\n<div class="stanza"><p>E se tanto secreto ver proferse</p>\n<p>mortale in terra, non voglio ch&rsquo;ammiri:</p>\n<p>ch&eacute; chi &rsquo;l vide qua s&ugrave; gliel discoperse</p></div>\n\n<div class="stanza"><p>con altro assai del ver di questi giri&raquo;.</p></div>','<p class="cantohead">Canto XXIX</p>\n\n<div class="stanza"><p>Quando ambedue li figli di Latona,</p>\n<p>coperti del Montone e de la Libra,</p>\n<p>fanno de l&rsquo;orizzonte insieme zona,</p></div>\n\n<div class="stanza"><p>quant&rsquo; &egrave; dal punto che &rsquo;l cen&igrave;t inlibra</p>\n<p>infin che l&rsquo;uno e l&rsquo;altro da quel cinto,</p>\n<p>cambiando l&rsquo;emisperio, si dilibra,</p></div>\n\n<div class="stanza"><p>tanto, col volto di riso dipinto,</p>\n<p>si tacque B&euml;atrice, riguardando</p>\n<p>fiso nel punto che m&rsquo;av&euml;a vinto.</p></div>\n\n<div class="stanza"><p>Poi cominci&ograve;: &laquo;Io dico, e non dimando,</p>\n<p>quel che tu vuoli udir, perch&rsquo; io l&rsquo;ho visto</p>\n<p>l&agrave; &rsquo;ve s&rsquo;appunta ogne ubi e ogne quando.</p></div>\n\n<div class="stanza"><p>Non per aver a s&eacute; di bene acquisto,</p>\n<p>ch&rsquo;esser non pu&ograve;, ma perch&eacute; suo splendore</p>\n<p>potesse, risplendendo, dir &ldquo;Subsisto&rdquo;,</p></div>\n\n<div class="stanza"><p>in sua etternit&agrave; di tempo fore,</p>\n<p>fuor d&rsquo;ogne altro comprender, come i piacque,</p>\n<p>s&rsquo;aperse in nuovi amor l&rsquo;etterno amore.</p></div>\n\n<div class="stanza"><p>N&eacute; prima quasi torpente si giacque;</p>\n<p>ch&eacute; n&eacute; prima n&eacute; poscia procedette</p>\n<p>lo discorrer di Dio sovra quest&rsquo; acque.</p></div>\n\n<div class="stanza"><p>Forma e materia, congiunte e purette,</p>\n<p>usciro ad esser che non avia fallo,</p>\n<p>come d&rsquo;arco tricordo tre saette.</p></div>\n\n<div class="stanza"><p>E come in vetro, in ambra o in cristallo</p>\n<p>raggio resplende s&igrave;, che dal venire</p>\n<p>a l&rsquo;esser tutto non &egrave; intervallo,</p></div>\n\n<div class="stanza"><p>cos&igrave; &rsquo;l triforme effetto del suo sire</p>\n<p>ne l&rsquo;esser suo raggi&ograve; insieme tutto</p>\n<p>sanza distinz&iuml;one in essordire.</p></div>\n\n<div class="stanza"><p>Concreato fu ordine e costrutto</p>\n<p>a le sustanze; e quelle furon cima</p>\n<p>nel mondo in che puro atto fu produtto;</p></div>\n\n<div class="stanza"><p>pura potenza tenne la parte ima;</p>\n<p>nel mezzo strinse potenza con atto</p>\n<p>tal vime, che gi&agrave; mai non si divima.</p></div>\n\n<div class="stanza"><p>Ieronimo vi scrisse lungo tratto</p>\n<p>di secoli de li angeli creati</p>\n<p>anzi che l&rsquo;altro mondo fosse fatto;</p></div>\n\n<div class="stanza"><p>ma questo vero &egrave; scritto in molti lati</p>\n<p>da li scrittor de lo Spirito Santo,</p>\n<p>e tu te n&rsquo;avvedrai se bene agguati;</p></div>\n\n<div class="stanza"><p>e anche la ragione il vede alquanto,</p>\n<p>che non concederebbe che &rsquo; motori</p>\n<p>sanza sua perfezion fosser cotanto.</p></div>\n\n<div class="stanza"><p>Or sai tu dove e quando questi amori</p>\n<p>furon creati e come: s&igrave; che spenti</p>\n<p>nel tuo dis&iuml;o gi&agrave; son tre ardori.</p></div>\n\n<div class="stanza"><p>N&eacute; giugneriesi, numerando, al venti</p>\n<p>s&igrave; tosto, come de li angeli parte</p>\n<p>turb&ograve; il suggetto d&rsquo;i vostri alimenti.</p></div>\n\n<div class="stanza"><p>L&rsquo;altra rimase, e cominci&ograve; quest&rsquo; arte</p>\n<p>che tu discerni, con tanto diletto,</p>\n<p>che mai da circ&uuml;ir non si diparte.</p></div>\n\n<div class="stanza"><p>Principio del cader fu il maladetto</p>\n<p>superbir di colui che tu vedesti</p>\n<p>da tutti i pesi del mondo costretto.</p></div>\n\n<div class="stanza"><p>Quelli che vedi qui furon modesti</p>\n<p>a riconoscer s&eacute; da la bontate</p>\n<p>che li avea fatti a tanto intender presti:</p></div>\n\n<div class="stanza"><p>per che le viste lor furo essaltate</p>\n<p>con grazia illuminante e con lor merto,</p>\n<p>si c&rsquo;hanno ferma e piena volontate;</p></div>\n\n<div class="stanza"><p>e non voglio che dubbi, ma sia certo,</p>\n<p>che ricever la grazia &egrave; meritorio</p>\n<p>secondo che l&rsquo;affetto l&rsquo;&egrave; aperto.</p></div>\n\n<div class="stanza"><p>Omai dintorno a questo consistorio</p>\n<p>puoi contemplare assai, se le parole</p>\n<p>mie son ricolte, sanz&rsquo; altro aiutorio.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; &rsquo;n terra per le vostre scole</p>\n<p>si legge che l&rsquo;angelica natura</p>\n<p>&egrave; tal, che &rsquo;ntende e si ricorda e vole,</p></div>\n\n<div class="stanza"><p>ancor dir&ograve;, perch&eacute; tu veggi pura</p>\n<p>la verit&agrave; che l&agrave; gi&ugrave; si confonde,</p>\n<p>equivocando in s&igrave; fatta lettura.</p></div>\n\n<div class="stanza"><p>Queste sustanze, poi che fur gioconde</p>\n<p>de la faccia di Dio, non volser viso</p>\n<p>da essa, da cui nulla si nasconde:</p></div>\n\n<div class="stanza"><p>per&ograve; non hanno vedere interciso</p>\n<p>da novo obietto, e per&ograve; non bisogna</p>\n<p>rememorar per concetto diviso;</p></div>\n\n<div class="stanza"><p>s&igrave; che l&agrave; gi&ugrave;, non dormendo, si sogna,</p>\n<p>credendo e non credendo dicer vero;</p>\n<p>ma ne l&rsquo;uno &egrave; pi&ugrave; colpa e pi&ugrave; vergogna.</p></div>\n\n<div class="stanza"><p>Voi non andate gi&ugrave; per un sentiero</p>\n<p>filosofando: tanto vi trasporta</p>\n<p>l&rsquo;amor de l&rsquo;apparenza e &rsquo;l suo pensiero!</p></div>\n\n<div class="stanza"><p>E ancor questo qua s&ugrave; si comporta</p>\n<p>con men disdegno che quando &egrave; posposta</p>\n<p>la divina Scrittura o quando &egrave; torta.</p></div>\n\n<div class="stanza"><p>Non vi si pensa quanto sangue costa</p>\n<p>seminarla nel mondo e quanto piace</p>\n<p>chi umilmente con essa s&rsquo;accosta.</p></div>\n\n<div class="stanza"><p>Per apparer ciascun s&rsquo;ingegna e face</p>\n<p>sue invenzioni; e quelle son trascorse</p>\n<p>da&rsquo; predicanti e &rsquo;l Vangelio si tace.</p></div>\n\n<div class="stanza"><p>Un dice che la luna si ritorse</p>\n<p>ne la passion di Cristo e s&rsquo;interpuose,</p>\n<p>per che &rsquo;l lume del sol gi&ugrave; non si porse;</p></div>\n\n<div class="stanza"><p>e mente, ch&eacute; la luce si nascose</p>\n<p>da s&eacute;: per&ograve; a li Spani e a l&rsquo;Indi</p>\n<p>come a&rsquo; Giudei tale eclissi rispuose.</p></div>\n\n<div class="stanza"><p>Non ha Fiorenza tanti Lapi e Bindi</p>\n<p>quante s&igrave; fatte favole per anno</p>\n<p>in pergamo si gridan quinci e quindi:</p></div>\n\n<div class="stanza"><p>s&igrave; che le pecorelle, che non sanno,</p>\n<p>tornan del pasco pasciute di vento,</p>\n<p>e non le scusa non veder lo danno.</p></div>\n\n<div class="stanza"><p>Non disse Cristo al suo primo convento:</p>\n<p>&lsquo;Andate, e predicate al mondo ciance&rsquo;;</p>\n<p>ma diede lor verace fondamento;</p></div>\n\n<div class="stanza"><p>e quel tanto son&ograve; ne le sue guance,</p>\n<p>s&igrave; ch&rsquo;a pugnar per accender la fede</p>\n<p>de l&rsquo;Evangelio fero scudo e lance.</p></div>\n\n<div class="stanza"><p>Ora si va con motti e con iscede</p>\n<p>a predicare, e pur che ben si rida,</p>\n<p>gonfia il cappuccio e pi&ugrave; non si richiede.</p></div>\n\n<div class="stanza"><p>Ma tale uccel nel becchetto s&rsquo;annida,</p>\n<p>che se &rsquo;l vulgo il vedesse, vederebbe</p>\n<p>la perdonanza di ch&rsquo;el si confida:</p></div>\n\n<div class="stanza"><p>per cui tanta stoltezza in terra crebbe,</p>\n<p>che, sanza prova d&rsquo;alcun testimonio,</p>\n<p>ad ogne promession si correrebbe.</p></div>\n\n<div class="stanza"><p>Di questo ingrassa il porco sant&rsquo; Antonio,</p>\n<p>e altri assai che sono ancor pi&ugrave; porci,</p>\n<p>pagando di moneta sanza conio.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; siam digressi assai, ritorci</p>\n<p>li occhi oramai verso la dritta strada,</p>\n<p>s&igrave; che la via col tempo si raccorci.</p></div>\n\n<div class="stanza"><p>Questa natura s&igrave; oltre s&rsquo;ingrada</p>\n<p>in numero, che mai non fu loquela</p>\n<p>n&eacute; concetto mortal che tanto vada;</p></div>\n\n<div class="stanza"><p>e se tu guardi quel che si revela</p>\n<p>per Dan&iuml;el, vedrai che &rsquo;n sue migliaia</p>\n<p>determinato numero si cela.</p></div>\n\n<div class="stanza"><p>La prima luce, che tutta la raia,</p>\n<p>per tanti modi in essa si recepe,</p>\n<p>quanti son li splendori a chi s&rsquo;appaia.</p></div>\n\n<div class="stanza"><p>Onde, per&ograve; che a l&rsquo;atto che concepe</p>\n<p>segue l&rsquo;affetto, d&rsquo;amar la dolcezza</p>\n<p>diversamente in essa ferve e tepe.</p></div>\n\n<div class="stanza"><p>Vedi l&rsquo;eccelso omai e la larghezza</p>\n<p>de l&rsquo;etterno valor, poscia che tanti</p>\n<p>speculi fatti s&rsquo;ha in che si spezza,</p></div>\n\n<div class="stanza"><p>uno manendo in s&eacute; come davanti&raquo;.</p></div>','<p class="cantohead">Canto XXX</p>\n\n<div class="stanza"><p>Forse semilia miglia di lontano</p>\n<p>ci ferve l&rsquo;ora sesta, e questo mondo</p>\n<p>china gi&agrave; l&rsquo;ombra quasi al letto piano,</p></div>\n\n<div class="stanza"><p>quando &rsquo;l mezzo del cielo, a noi profondo,</p>\n<p>comincia a farsi tal, ch&rsquo;alcuna stella</p>\n<p>perde il parere infino a questo fondo;</p></div>\n\n<div class="stanza"><p>e come vien la chiarissima ancella</p>\n<p>del sol pi&ugrave; oltre, cos&igrave; &rsquo;l ciel si chiude</p>\n<p>di vista in vista infino a la pi&ugrave; bella.</p></div>\n\n<div class="stanza"><p>Non altrimenti il tr&iuml;unfo che lude</p>\n<p>sempre dintorno al punto che mi vinse,</p>\n<p>parendo inchiuso da quel ch&rsquo;elli &rsquo;nchiude,</p></div>\n\n<div class="stanza"><p>a poco a poco al mio veder si stinse:</p>\n<p>per che tornar con li occhi a B&euml;atrice</p>\n<p>nulla vedere e amor mi costrinse.</p></div>\n\n<div class="stanza"><p>Se quanto infino a qui di lei si dice</p>\n<p>fosse conchiuso tutto in una loda,</p>\n<p>poca sarebbe a fornir questa vice.</p></div>\n\n<div class="stanza"><p>La bellezza ch&rsquo;io vidi si trasmoda</p>\n<p>non pur di l&agrave; da noi, ma certo io credo</p>\n<p>che solo il suo fattor tutta la goda.</p></div>\n\n<div class="stanza"><p>Da questo passo vinto mi concedo</p>\n<p>pi&ugrave; che gi&agrave; mai da punto di suo tema</p>\n<p>soprato fosse comico o tragedo:</p></div>\n\n<div class="stanza"><p>ch&eacute;, come sole in viso che pi&ugrave; trema,</p>\n<p>cos&igrave; lo rimembrar del dolce riso</p>\n<p>la mente mia da me medesmo scema.</p></div>\n\n<div class="stanza"><p>Dal primo giorno ch&rsquo;i&rsquo; vidi il suo viso</p>\n<p>in questa vita, infino a questa vista,</p>\n<p>non m&rsquo;&egrave; il seguire al mio cantar preciso;</p></div>\n\n<div class="stanza"><p>ma or convien che mio seguir desista</p>\n<p>pi&ugrave; dietro a sua bellezza, poetando,</p>\n<p>come a l&rsquo;ultimo suo ciascuno artista.</p></div>\n\n<div class="stanza"><p>Cotal qual io lascio a maggior bando</p>\n<p>che quel de la mia tuba, che deduce</p>\n<p>l&rsquo;ard&uuml;a sua matera terminando,</p></div>\n\n<div class="stanza"><p>con atto e voce di spedito duce</p>\n<p>ricominci&ograve;: &laquo;Noi siamo usciti fore</p>\n<p>del maggior corpo al ciel ch&rsquo;&egrave; pura luce:</p></div>\n\n<div class="stanza"><p>luce intellett&uuml;al, piena d&rsquo;amore;</p>\n<p>amor di vero ben, pien di letizia;</p>\n<p>letizia che trascende ogne dolzore.</p></div>\n\n<div class="stanza"><p>Qui vederai l&rsquo;una e l&rsquo;altra milizia</p>\n<p>di paradiso, e l&rsquo;una in quelli aspetti</p>\n<p>che tu vedrai a l&rsquo;ultima giustizia&raquo;.</p></div>\n\n<div class="stanza"><p>Come s&ugrave;bito lampo che discetti</p>\n<p>li spiriti visivi, s&igrave; che priva</p>\n<p>da l&rsquo;atto l&rsquo;occhio di pi&ugrave; forti obietti,</p></div>\n\n<div class="stanza"><p>cos&igrave; mi circunfulse luce viva,</p>\n<p>e lasciommi fasciato di tal velo</p>\n<p>del suo fulgor, che nulla m&rsquo;appariva.</p></div>\n\n<div class="stanza"><p>&laquo;Sempre l&rsquo;amor che queta questo cielo</p>\n<p>accoglie in s&eacute; con s&igrave; fatta salute,</p>\n<p>per far disposto a sua fiamma il candelo&raquo;.</p></div>\n\n<div class="stanza"><p>Non fur pi&ugrave; tosto dentro a me venute</p>\n<p>queste parole brievi, ch&rsquo;io compresi</p>\n<p>me sormontar di sopr&rsquo; a mia virtute;</p></div>\n\n<div class="stanza"><p>e di novella vista mi raccesi</p>\n<p>tale, che nulla luce &egrave; tanto mera,</p>\n<p>che li occhi miei non si fosser difesi;</p></div>\n\n<div class="stanza"><p>e vidi lume in forma di rivera</p>\n<p>fulvido di fulgore, intra due rive</p>\n<p>dipinte di mirabil primavera.</p></div>\n\n<div class="stanza"><p>Di tal fiumana uscian faville vive,</p>\n<p>e d&rsquo;ogne parte si mettien ne&rsquo; fiori,</p>\n<p>quasi rubin che oro circunscrive;</p></div>\n\n<div class="stanza"><p>poi, come inebr&iuml;ate da li odori,</p>\n<p>riprofondavan s&eacute; nel miro gurge,</p>\n<p>e s&rsquo;una intrava, un&rsquo;altra n&rsquo;uscia fori.</p></div>\n\n<div class="stanza"><p>&laquo;L&rsquo;alto disio che mo t&rsquo;infiamma e urge,</p>\n<p>d&rsquo;aver notizia di ci&ograve; che tu vei,</p>\n<p>tanto mi piace pi&ugrave; quanto pi&ugrave; turge;</p></div>\n\n<div class="stanza"><p>ma di quest&rsquo; acqua convien che tu bei</p>\n<p>prima che tanta sete in te si sazi&raquo;:</p>\n<p>cos&igrave; mi disse il sol de li occhi miei.</p></div>\n\n<div class="stanza"><p>Anche soggiunse: &laquo;Il fiume e li topazi</p>\n<p>ch&rsquo;entrano ed escono e &rsquo;l rider de l&rsquo;erbe</p>\n<p>son di lor vero umbriferi prefazi.</p></div>\n\n<div class="stanza"><p>Non che da s&eacute; sian queste cose acerbe;</p>\n<p>ma &egrave; difetto da la parte tua,</p>\n<p>che non hai viste ancor tanto superbe&raquo;.</p></div>\n\n<div class="stanza"><p>Non &egrave; fantin che s&igrave; s&ugrave;bito rua</p>\n<p>col volto verso il latte, se si svegli</p>\n<p>molto tardato da l&rsquo;usanza sua,</p></div>\n\n<div class="stanza"><p>come fec&rsquo; io, per far migliori spegli</p>\n<p>ancor de li occhi, chinandomi a l&rsquo;onda</p>\n<p>che si deriva perch&eacute; vi s&rsquo;immegli;</p></div>\n\n<div class="stanza"><p>e s&igrave; come di lei bevve la gronda</p>\n<p>de le palpebre mie, cos&igrave; mi parve</p>\n<p>di sua lunghezza divenuta tonda.</p></div>\n\n<div class="stanza"><p>Poi, come gente stata sotto larve,</p>\n<p>che pare altro che prima, se si sveste</p>\n<p>la sembianza non s&uuml;a in che disparve,</p></div>\n\n<div class="stanza"><p>cos&igrave; mi si cambiaro in maggior feste</p>\n<p>li fiori e le faville, s&igrave; ch&rsquo;io vidi</p>\n<p>ambo le corti del ciel manifeste.</p></div>\n\n<div class="stanza"><p>O isplendor di Dio, per cu&rsquo; io vidi</p>\n<p>l&rsquo;alto tr&iuml;unfo del regno verace,</p>\n<p>dammi virt&ugrave; a dir com&rsquo; &iuml;o il vidi!</p></div>\n\n<div class="stanza"><p>Lume &egrave; l&agrave; s&ugrave; che visibile face</p>\n<p>lo creatore a quella creatura</p>\n<p>che solo in lui vedere ha la sua pace.</p></div>\n\n<div class="stanza"><p>E&rsquo; si distende in circular figura,</p>\n<p>in tanto che la sua circunferenza</p>\n<p>sarebbe al sol troppo larga cintura.</p></div>\n\n<div class="stanza"><p>Fassi di raggio tutta sua parvenza</p>\n<p>reflesso al sommo del mobile primo,</p>\n<p>che prende quindi vivere e potenza.</p></div>\n\n<div class="stanza"><p>E come clivo in acqua di suo imo</p>\n<p>si specchia, quasi per vedersi addorno,</p>\n<p>quando &egrave; nel verde e ne&rsquo; fioretti opimo,</p></div>\n\n<div class="stanza"><p>s&igrave;, soprastando al lume intorno intorno,</p>\n<p>vidi specchiarsi in pi&ugrave; di mille soglie</p>\n<p>quanto di noi l&agrave; s&ugrave; fatto ha ritorno.</p></div>\n\n<div class="stanza"><p>E se l&rsquo;infimo grado in s&eacute; raccoglie</p>\n<p>s&igrave; grande lume, quanta &egrave; la larghezza</p>\n<p>di questa rosa ne l&rsquo;estreme foglie!</p></div>\n\n<div class="stanza"><p>La vista mia ne l&rsquo;ampio e ne l&rsquo;altezza</p>\n<p>non si smarriva, ma tutto prendeva</p>\n<p>il quanto e &rsquo;l quale di quella allegrezza.</p></div>\n\n<div class="stanza"><p>Presso e lontano, l&igrave;, n&eacute; pon n&eacute; leva:</p>\n<p>ch&eacute; dove Dio sanza mezzo governa,</p>\n<p>la legge natural nulla rileva.</p></div>\n\n<div class="stanza"><p>Nel giallo de la rosa sempiterna,</p>\n<p>che si digrada e dilata e redole</p>\n<p>odor di lode al sol che sempre verna,</p></div>\n\n<div class="stanza"><p>qual &egrave; colui che tace e dicer vole,</p>\n<p>mi trasse B&euml;atrice, e disse: &laquo;Mira</p>\n<p>quanto &egrave; &rsquo;l convento de le bianche stole!</p></div>\n\n<div class="stanza"><p>Vedi nostra citt&agrave; quant&rsquo; ella gira;</p>\n<p>vedi li nostri scanni s&igrave; ripieni,</p>\n<p>che poca gente pi&ugrave; ci si disira.</p></div>\n\n<div class="stanza"><p>E &rsquo;n quel gran seggio a che tu li occhi tieni</p>\n<p>per la corona che gi&agrave; v&rsquo;&egrave; s&ugrave; posta,</p>\n<p>prima che tu a queste nozze ceni,</p></div>\n\n<div class="stanza"><p>seder&agrave; l&rsquo;alma, che fia gi&ugrave; agosta,</p>\n<p>de l&rsquo;alto Arrigo, ch&rsquo;a drizzare Italia</p>\n<p>verr&agrave; in prima ch&rsquo;ella sia disposta.</p></div>\n\n<div class="stanza"><p>La cieca cupidigia che v&rsquo;ammalia</p>\n<p>simili fatti v&rsquo;ha al fantolino</p>\n<p>che muor per fame e caccia via la balia.</p></div>\n\n<div class="stanza"><p>E fia prefetto nel foro divino</p>\n<p>allora tal, che palese e coverto</p>\n<p>non ander&agrave; con lui per un cammino.</p></div>\n\n<div class="stanza"><p>Ma poco poi sar&agrave; da Dio sofferto</p>\n<p>nel santo officio; ch&rsquo;el sar&agrave; detruso</p>\n<p>l&agrave; dove Simon mago &egrave; per suo merto,</p></div>\n\n<div class="stanza"><p>e far&agrave; quel d&rsquo;Alagna intrar pi&ugrave; giuso&raquo;.</p></div>','<p class="cantohead">Canto XXXI</p>\n\n<div class="stanza"><p>In forma dunque di candida rosa</p>\n<p>mi si mostrava la milizia santa</p>\n<p>che nel suo sangue Cristo fece sposa;</p></div>\n\n<div class="stanza"><p>ma l&rsquo;altra, che volando vede e canta</p>\n<p>la gloria di colui che la &rsquo;nnamora</p>\n<p>e la bont&agrave; che la fece cotanta,</p></div>\n\n<div class="stanza"><p>s&igrave; come schiera d&rsquo;ape che s&rsquo;infiora</p>\n<p>una f&iuml;ata e una si ritorna</p>\n<p>l&agrave; dove suo laboro s&rsquo;insapora,</p></div>\n\n<div class="stanza"><p>nel gran fior discendeva che s&rsquo;addorna</p>\n<p>di tante foglie, e quindi risaliva</p>\n<p>l&agrave; dove &rsquo;l s&uuml;o amor sempre soggiorna.</p></div>\n\n<div class="stanza"><p>Le facce tutte avean di fiamma viva</p>\n<p>e l&rsquo;ali d&rsquo;oro, e l&rsquo;altro tanto bianco,</p>\n<p>che nulla neve a quel termine arriva.</p></div>\n\n<div class="stanza"><p>Quando scendean nel fior, di banco in banco</p>\n<p>porgevan de la pace e de l&rsquo;ardore</p>\n<p>ch&rsquo;elli acquistavan ventilando il fianco.</p></div>\n\n<div class="stanza"><p>N&eacute; l&rsquo;interporsi tra &rsquo;l disopra e &rsquo;l fiore</p>\n<p>di tanta moltitudine volante</p>\n<p>impediva la vista e lo splendore:</p></div>\n\n<div class="stanza"><p>ch&eacute; la luce divina &egrave; penetrante</p>\n<p>per l&rsquo;universo secondo ch&rsquo;&egrave; degno,</p>\n<p>s&igrave; che nulla le puote essere ostante.</p></div>\n\n<div class="stanza"><p>Questo sicuro e gaud&iuml;oso regno,</p>\n<p>frequente in gente antica e in novella,</p>\n<p>viso e amore avea tutto ad un segno.</p></div>\n\n<div class="stanza"><p>O trina luce che &rsquo;n unica stella</p>\n<p>scintillando a lor vista, s&igrave; li appaga!</p>\n<p>guarda qua giuso a la nostra procella!</p></div>\n\n<div class="stanza"><p>Se i barbari, venendo da tal plaga</p>\n<p>che ciascun giorno d&rsquo;Elice si cuopra,</p>\n<p>rotante col suo figlio ond&rsquo; ella &egrave; vaga,</p></div>\n\n<div class="stanza"><p>veggendo Roma e l&rsquo;ard&uuml;a sua opra,</p>\n<p>stupefaciensi, quando Laterano</p>\n<p>a le cose mortali and&ograve; di sopra;</p></div>\n\n<div class="stanza"><p>&iuml;o, che al divino da l&rsquo;umano,</p>\n<p>a l&rsquo;etterno dal tempo era venuto,</p>\n<p>e di Fiorenza in popol giusto e sano,</p></div>\n\n<div class="stanza"><p>di che stupor dovea esser compiuto!</p>\n<p>Certo tra esso e &rsquo;l gaudio mi facea</p>\n<p>libito non udire e starmi muto.</p></div>\n\n<div class="stanza"><p>E quasi peregrin che si ricrea</p>\n<p>nel tempio del suo voto riguardando,</p>\n<p>e spera gi&agrave; ridir com&rsquo; ello stea,</p></div>\n\n<div class="stanza"><p>su per la viva luce passeggiando,</p>\n<p>menava &iuml;o li occhi per li gradi,</p>\n<p>mo s&ugrave;, mo gi&ugrave; e mo recirculando.</p></div>\n\n<div class="stanza"><p>Ved&euml;a visi a carit&agrave; s&uuml;adi,</p>\n<p>d&rsquo;altrui lume fregiati e di suo riso,</p>\n<p>e atti ornati di tutte onestadi.</p></div>\n\n<div class="stanza"><p>La forma general di paradiso</p>\n<p>gi&agrave; tutta m&iuml;o sguardo avea compresa,</p>\n<p>in nulla parte ancor fermato fiso;</p></div>\n\n<div class="stanza"><p>e volgeami con voglia r&iuml;accesa</p>\n<p>per domandar la mia donna di cose</p>\n<p>di che la mente mia era sospesa.</p></div>\n\n<div class="stanza"><p>Uno intend&euml;a, e altro mi rispuose:</p>\n<p>credea veder Beatrice e vidi un sene</p>\n<p>vestito con le genti glor&iuml;ose.</p></div>\n\n<div class="stanza"><p>Diffuso era per li occhi e per le gene</p>\n<p>di benigna letizia, in atto pio</p>\n<p>quale a tenero padre si convene.</p></div>\n\n<div class="stanza"><p>E &laquo;Ov&rsquo; &egrave; ella?&raquo;, s&ugrave;bito diss&rsquo; io.</p>\n<p>Ond&rsquo; elli: &laquo;A terminar lo tuo disiro</p>\n<p>mosse Beatrice me del loco mio;</p></div>\n\n<div class="stanza"><p>e se riguardi s&ugrave; nel terzo giro</p>\n<p>dal sommo grado, tu la rivedrai</p>\n<p>nel trono che suoi merti le sortiro&raquo;.</p></div>\n\n<div class="stanza"><p>Sanza risponder, li occhi s&ugrave; levai,</p>\n<p>e vidi lei che si facea corona</p>\n<p>reflettendo da s&eacute; li etterni rai.</p></div>\n\n<div class="stanza"><p>Da quella reg&iuml;on che pi&ugrave; s&ugrave; tona</p>\n<p>occhio mortale alcun tanto non dista,</p>\n<p>qualunque in mare pi&ugrave; gi&ugrave; s&rsquo;abbandona,</p></div>\n\n<div class="stanza"><p>quanto l&igrave; da Beatrice la mia vista;</p>\n<p>ma nulla mi facea, ch&eacute; s&uuml;a effige</p>\n<p>non discend&euml;a a me per mezzo mista.</p></div>\n\n<div class="stanza"><p>&laquo;O donna in cui la mia speranza vige,</p>\n<p>e che soffristi per la mia salute</p>\n<p>in inferno lasciar le tue vestige,</p></div>\n\n<div class="stanza"><p>di tante cose quant&rsquo; i&rsquo; ho vedute,</p>\n<p>dal tuo podere e da la tua bontate</p>\n<p>riconosco la grazia e la virtute.</p></div>\n\n<div class="stanza"><p>Tu m&rsquo;hai di servo tratto a libertate</p>\n<p>per tutte quelle vie, per tutt&rsquo; i modi</p>\n<p>che di ci&ograve; fare avei la potestate.</p></div>\n\n<div class="stanza"><p>La tua magnificenza in me custodi,</p>\n<p>s&igrave; che l&rsquo;anima mia, che fatt&rsquo; hai sana,</p>\n<p>piacente a te dal corpo si disnodi&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; orai; e quella, s&igrave; lontana</p>\n<p>come parea, sorrise e riguardommi;</p>\n<p>poi si torn&ograve; a l&rsquo;etterna fontana.</p></div>\n\n<div class="stanza"><p>E &rsquo;l santo sene: &laquo;Acci&ograve; che tu assommi</p>\n<p>perfettamente&raquo;, disse, &laquo;il tuo cammino,</p>\n<p>a che priego e amor santo mandommi,</p></div>\n\n<div class="stanza"><p>vola con li occhi per questo giardino;</p>\n<p>ch&eacute; veder lui t&rsquo;acconcer&agrave; lo sguardo</p>\n<p>pi&ugrave; al montar per lo raggio divino.</p></div>\n\n<div class="stanza"><p>E la regina del cielo, ond&rsquo; &iuml;o ardo</p>\n<p>tutto d&rsquo;amor, ne far&agrave; ogne grazia,</p>\n<p>per&ograve; ch&rsquo;i&rsquo; sono il suo fedel Bernardo&raquo;.</p></div>\n\n<div class="stanza"><p>Qual &egrave; colui che forse di Croazia</p>\n<p>viene a veder la Veronica nostra,</p>\n<p>che per l&rsquo;antica fame non sen sazia,</p></div>\n\n<div class="stanza"><p>ma dice nel pensier, fin che si mostra:</p>\n<p>&lsquo;Segnor mio Ies&ugrave; Cristo, Dio verace,</p>\n<p>or fu s&igrave; fatta la sembianza vostra?&rsquo;;</p></div>\n\n<div class="stanza"><p>tal era io mirando la vivace</p>\n<p>carit&agrave; di colui che &rsquo;n questo mondo,</p>\n<p>contemplando, gust&ograve; di quella pace.</p></div>\n\n<div class="stanza"><p>&laquo;Figliuol di grazia, quest&rsquo; esser giocondo&raquo;,</p>\n<p>cominci&ograve; elli, &laquo;non ti sar&agrave; noto,</p>\n<p>tenendo li occhi pur qua gi&ugrave; al fondo;</p></div>\n\n<div class="stanza"><p>ma guarda i cerchi infino al pi&ugrave; remoto,</p>\n<p>tanto che veggi seder la regina</p>\n<p>cui questo regno &egrave; suddito e devoto&raquo;.</p></div>\n\n<div class="stanza"><p>Io levai li occhi; e come da mattina</p>\n<p>la parte or&iuml;ental de l&rsquo;orizzonte</p>\n<p>soverchia quella dove &rsquo;l sol declina,</p></div>\n\n<div class="stanza"><p>cos&igrave;, quasi di valle andando a monte</p>\n<p>con li occhi, vidi parte ne lo stremo</p>\n<p>vincer di lume tutta l&rsquo;altra fronte.</p></div>\n\n<div class="stanza"><p>E come quivi ove s&rsquo;aspetta il temo</p>\n<p>che mal guid&ograve; Fetonte, pi&ugrave; s&rsquo;infiamma,</p>\n<p>e quinci e quindi il lume si fa scemo,</p></div>\n\n<div class="stanza"><p>cos&igrave; quella pacifica oriafiamma</p>\n<p>nel mezzo s&rsquo;avvivava, e d&rsquo;ogne parte</p>\n<p>per igual modo allentava la fiamma;</p></div>\n\n<div class="stanza"><p>e a quel mezzo, con le penne sparte,</p>\n<p>vid&rsquo; io pi&ugrave; di mille angeli festanti,</p>\n<p>ciascun distinto di fulgore e d&rsquo;arte.</p></div>\n\n<div class="stanza"><p>Vidi a lor giochi quivi e a lor canti</p>\n<p>ridere una bellezza, che letizia</p>\n<p>era ne li occhi a tutti li altri santi;</p></div>\n\n<div class="stanza"><p>e s&rsquo;io avessi in dir tanta divizia</p>\n<p>quanta ad imaginar, non ardirei</p>\n<p>lo minimo tentar di sua delizia.</p></div>\n\n<div class="stanza"><p>Bernardo, come vide li occhi miei</p>\n<p>nel caldo suo caler fissi e attenti,</p>\n<p>li suoi con tanto affetto volse a lei,</p></div>\n\n<div class="stanza"><p>che &rsquo; miei di rimirar f&eacute; pi&ugrave; ardenti.</p></div>','<p class="cantohead">Canto XXXII</p>\n\n<div class="stanza"><p>Affetto al suo piacer, quel contemplante</p>\n<p>libero officio di dottore assunse,</p>\n<p>e cominci&ograve; queste parole sante:</p></div>\n\n<div class="stanza"><p>&laquo;La piaga che Maria richiuse e unse,</p>\n<p>quella ch&rsquo;&egrave; tanto bella da&rsquo; suoi piedi</p>\n<p>&egrave; colei che l&rsquo;aperse e che la punse.</p></div>\n\n<div class="stanza"><p>Ne l&rsquo;ordine che fanno i terzi sedi,</p>\n<p>siede Rachel di sotto da costei</p>\n<p>con B&euml;atrice, s&igrave; come tu vedi.</p></div>\n\n<div class="stanza"><p>Sarra e Rebecca, Iud&igrave;t e colei</p>\n<p>che fu bisava al cantor che per doglia</p>\n<p>del fallo disse &lsquo;Miserere mei&rsquo;,</p></div>\n\n<div class="stanza"><p>puoi tu veder cos&igrave; di soglia in soglia</p>\n<p>gi&ugrave; digradar, com&rsquo; io ch&rsquo;a proprio nome</p>\n<p>vo per la rosa gi&ugrave; di foglia in foglia.</p></div>\n\n<div class="stanza"><p>E dal settimo grado in gi&ugrave;, s&igrave; come</p>\n<p>infino ad esso, succedono Ebree,</p>\n<p>dirimendo del fior tutte le chiome;</p></div>\n\n<div class="stanza"><p>perch&eacute;, secondo lo sguardo che f&eacute;e</p>\n<p>la fede in Cristo, queste sono il muro</p>\n<p>a che si parton le sacre scalee.</p></div>\n\n<div class="stanza"><p>Da questa parte onde &rsquo;l fiore &egrave; maturo</p>\n<p>di tutte le sue foglie, sono assisi</p>\n<p>quei che credettero in Cristo venturo;</p></div>\n\n<div class="stanza"><p>da l&rsquo;altra parte onde sono intercisi</p>\n<p>di v&ograve;ti i semicirculi, si stanno</p>\n<p>quei ch&rsquo;a Cristo venuto ebber li visi.</p></div>\n\n<div class="stanza"><p>E come quinci il glor&iuml;oso scanno</p>\n<p>de la donna del cielo e li altri scanni</p>\n<p>di sotto lui cotanta cerna fanno,</p></div>\n\n<div class="stanza"><p>cos&igrave; di contra quel del gran Giovanni,</p>\n<p>che sempre santo &rsquo;l diserto e &rsquo;l martiro</p>\n<p>sofferse, e poi l&rsquo;inferno da due anni;</p></div>\n\n<div class="stanza"><p>e sotto lui cos&igrave; cerner sortiro</p>\n<p>Francesco, Benedetto e Augustino</p>\n<p>e altri fin qua gi&ugrave; di giro in giro.</p></div>\n\n<div class="stanza"><p>Or mira l&rsquo;alto proveder divino:</p>\n<p>ch&eacute; l&rsquo;uno e l&rsquo;altro aspetto de la fede</p>\n<p>igualmente empier&agrave; questo giardino.</p></div>\n\n<div class="stanza"><p>E sappi che dal grado in gi&ugrave; che fiede</p>\n<p>a mezzo il tratto le due discrezioni,</p>\n<p>per nullo proprio merito si siede,</p></div>\n\n<div class="stanza"><p>ma per l&rsquo;altrui, con certe condizioni:</p>\n<p>ch&eacute; tutti questi son spiriti ascolti</p>\n<p>prima ch&rsquo;avesser vere elez&iuml;oni.</p></div>\n\n<div class="stanza"><p>Ben te ne puoi accorger per li volti</p>\n<p>e anche per le voci p&uuml;erili,</p>\n<p>se tu li guardi bene e se li ascolti.</p></div>\n\n<div class="stanza"><p>Or dubbi tu e dubitando sili;</p>\n<p>ma io discioglier&ograve; &rsquo;l forte legame</p>\n<p>in che ti stringon li pensier sottili.</p></div>\n\n<div class="stanza"><p>Dentro a l&rsquo;ampiezza di questo reame</p>\n<p>cas&uuml;al punto non puote aver sito,</p>\n<p>se non come tristizia o sete o fame:</p></div>\n\n<div class="stanza"><p>ch&eacute; per etterna legge &egrave; stabilito</p>\n<p>quantunque vedi, s&igrave; che giustamente</p>\n<p>ci si risponde da l&rsquo;anello al dito;</p></div>\n\n<div class="stanza"><p>e per&ograve; questa festinata gente</p>\n<p>a vera vita non &egrave; sine causa</p>\n<p>intra s&eacute; qui pi&ugrave; e meno eccellente.</p></div>\n\n<div class="stanza"><p>Lo rege per cui questo regno pausa</p>\n<p>in tanto amore e in tanto diletto,</p>\n<p>che nulla volont&agrave; &egrave; di pi&ugrave; ausa,</p></div>\n\n<div class="stanza"><p>le menti tutte nel suo lieto aspetto</p>\n<p>creando, a suo piacer di grazia dota</p>\n<p>diversamente; e qui basti l&rsquo;effetto.</p></div>\n\n<div class="stanza"><p>E ci&ograve; espresso e chiaro vi si nota</p>\n<p>ne la Scrittura santa in quei gemelli</p>\n<p>che ne la madre ebber l&rsquo;ira commota.</p></div>\n\n<div class="stanza"><p>Per&ograve;, secondo il color d&rsquo;i capelli,</p>\n<p>di cotal grazia l&rsquo;altissimo lume</p>\n<p>degnamente convien che s&rsquo;incappelli.</p></div>\n\n<div class="stanza"><p>Dunque, sanza merc&eacute; di lor costume,</p>\n<p>locati son per gradi differenti,</p>\n<p>sol differendo nel primiero acume.</p></div>\n\n<div class="stanza"><p>Bastavasi ne&rsquo; secoli recenti</p>\n<p>con l&rsquo;innocenza, per aver salute,</p>\n<p>solamente la fede d&rsquo;i parenti;</p></div>\n\n<div class="stanza"><p>poi che le prime etadi fuor compiute,</p>\n<p>convenne ai maschi a l&rsquo;innocenti penne</p>\n<p>per circuncidere acquistar virtute;</p></div>\n\n<div class="stanza"><p>ma poi che &rsquo;l tempo de la grazia venne,</p>\n<p>sanza battesmo perfetto di Cristo</p>\n<p>tale innocenza l&agrave; gi&ugrave; si ritenne.</p></div>\n\n<div class="stanza"><p>Riguarda omai ne la faccia che a Cristo</p>\n<p>pi&ugrave; si somiglia, ch&eacute; la sua chiarezza</p>\n<p>sola ti pu&ograve; disporre a veder Cristo&raquo;.</p></div>\n\n<div class="stanza"><p>Io vidi sopra lei tanta allegrezza</p>\n<p>piover, portata ne le menti sante</p>\n<p>create a trasvolar per quella altezza,</p></div>\n\n<div class="stanza"><p>che quantunque io avea visto davante,</p>\n<p>di tanta ammirazion non mi sospese,</p>\n<p>n&eacute; mi mostr&ograve; di Dio tanto sembiante;</p></div>\n\n<div class="stanza"><p>e quello amor che primo l&igrave; discese,</p>\n<p>cantando &lsquo;Ave, Maria, grat&iuml;a plena&rsquo;,</p>\n<p>dinanzi a lei le sue ali distese.</p></div>\n\n<div class="stanza"><p>Rispuose a la divina cantilena</p>\n<p>da tutte parti la beata corte,</p>\n<p>s&igrave; ch&rsquo;ogne vista sen f&eacute; pi&ugrave; serena.</p></div>\n\n<div class="stanza"><p>&laquo;O santo padre, che per me comporte</p>\n<p>l&rsquo;esser qua gi&ugrave;, lasciando il dolce loco</p>\n<p>nel qual tu siedi per etterna sorte,</p></div>\n\n<div class="stanza"><p>qual &egrave; quell&rsquo; angel che con tanto gioco</p>\n<p>guarda ne li occhi la nostra regina,</p>\n<p>innamorato s&igrave; che par di foco?&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; ricorsi ancora a la dottrina</p>\n<p>di colui ch&rsquo;abbelliva di Maria,</p>\n<p>come del sole stella mattutina.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;Baldezza e leggiadria</p>\n<p>quant&rsquo; esser puote in angelo e in alma,</p>\n<p>tutta &egrave; in lui; e s&igrave; volem che sia,</p></div>\n\n<div class="stanza"><p>perch&rsquo; elli &egrave; quelli che port&ograve; la palma</p>\n<p>giuso a Maria, quando &rsquo;l Figliuol di Dio</p>\n<p>carcar si volse de la nostra salma.</p></div>\n\n<div class="stanza"><p>Ma vieni omai con li occhi s&igrave; com&rsquo; io</p>\n<p>andr&ograve; parlando, e nota i gran patrici</p>\n<p>di questo imperio giustissimo e pio.</p></div>\n\n<div class="stanza"><p>Quei due che seggon l&agrave; s&ugrave; pi&ugrave; felici</p>\n<p>per esser propinquissimi ad Agusta,</p>\n<p>son d&rsquo;esta rosa quasi due radici:</p></div>\n\n<div class="stanza"><p>colui che da sinistra le s&rsquo;aggiusta</p>\n<p>&egrave; il padre per lo cui ardito gusto</p>\n<p>l&rsquo;umana specie tanto amaro gusta;</p></div>\n\n<div class="stanza"><p>dal destro vedi quel padre vetusto</p>\n<p>di Santa Chiesa a cui Cristo le chiavi</p>\n<p>raccomand&ograve; di questo fior venusto.</p></div>\n\n<div class="stanza"><p>E quei che vide tutti i tempi gravi,</p>\n<p>pria che morisse, de la bella sposa</p>\n<p>che s&rsquo;acquist&ograve; con la lancia e coi clavi,</p></div>\n\n<div class="stanza"><p>siede lungh&rsquo; esso, e lungo l&rsquo;altro posa</p>\n<p>quel duca sotto cui visse di manna</p>\n<p>la gente ingrata, mobile e retrosa.</p></div>\n\n<div class="stanza"><p>Di contr&rsquo; a Pietro vedi sedere Anna,</p>\n<p>tanto contenta di mirar sua figlia,</p>\n<p>che non move occhio per cantare osanna;</p></div>\n\n<div class="stanza"><p>e contro al maggior padre di famiglia</p>\n<p>siede Lucia, che mosse la tua donna</p>\n<p>quando chinavi, a rovinar, le ciglia.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; &rsquo;l tempo fugge che t&rsquo;assonna,</p>\n<p>qui farem punto, come buon sartore</p>\n<p>che com&rsquo; elli ha del panno fa la gonna;</p></div>\n\n<div class="stanza"><p>e drizzeremo li occhi al primo amore,</p>\n<p>s&igrave; che, guardando verso lui, pen&egrave;tri</p>\n<p>quant&rsquo; &egrave; possibil per lo suo fulgore.</p></div>\n\n<div class="stanza"><p>Veramente, ne forse tu t&rsquo;arretri</p>\n<p>movendo l&rsquo;ali tue, credendo oltrarti,</p>\n<p>orando grazia conven che s&rsquo;impetri</p></div>\n\n<div class="stanza"><p>grazia da quella che puote aiutarti;</p>\n<p>e tu mi seguirai con l&rsquo;affezione,</p>\n<p>s&igrave; che dal dicer mio lo cor non parti&raquo;.</p></div>\n\n<div class="stanza"><p>E cominci&ograve; questa santa orazione:</p></div>','<p class="cantohead">Canto XXXIII</p>\n\n<div class="stanza"><p>&laquo;Vergine Madre, figlia del tuo figlio,</p>\n<p>umile e alta pi&ugrave; che creatura,</p>\n<p>termine fisso d&rsquo;etterno consiglio,</p></div>\n\n<div class="stanza"><p>tu se&rsquo; colei che l&rsquo;umana natura</p>\n<p>nobilitasti s&igrave;, che &rsquo;l suo fattore</p>\n<p>non disdegn&ograve; di farsi sua fattura.</p></div>\n\n<div class="stanza"><p>Nel ventre tuo si raccese l&rsquo;amore,</p>\n<p>per lo cui caldo ne l&rsquo;etterna pace</p>\n<p>cos&igrave; &egrave; germinato questo fiore.</p></div>\n\n<div class="stanza"><p>Qui se&rsquo; a noi merid&iuml;ana face</p>\n<p>di caritate, e giuso, intra &rsquo; mortali,</p>\n<p>se&rsquo; di speranza fontana vivace.</p></div>\n\n<div class="stanza"><p>Donna, se&rsquo; tanto grande e tanto vali,</p>\n<p>che qual vuol grazia e a te non ricorre,</p>\n<p>sua dis&iuml;anza vuol volar sanz&rsquo; ali.</p></div>\n\n<div class="stanza"><p>La tua benignit&agrave; non pur soccorre</p>\n<p>a chi domanda, ma molte f&iuml;ate</p>\n<p>liberamente al dimandar precorre.</p></div>\n\n<div class="stanza"><p>In te misericordia, in te pietate,</p>\n<p>in te magnificenza, in te s&rsquo;aduna</p>\n<p>quantunque in creatura &egrave; di bontate.</p></div>\n\n<div class="stanza"><p>Or questi, che da l&rsquo;infima lacuna</p>\n<p>de l&rsquo;universo infin qui ha vedute</p>\n<p>le vite spiritali ad una ad una,</p></div>\n\n<div class="stanza"><p>supplica a te, per grazia, di virtute</p>\n<p>tanto, che possa con li occhi levarsi</p>\n<p>pi&ugrave; alto verso l&rsquo;ultima salute.</p></div>\n\n<div class="stanza"><p>E io, che mai per mio veder non arsi</p>\n<p>pi&ugrave; ch&rsquo;i&rsquo; fo per lo suo, tutti miei prieghi</p>\n<p>ti porgo, e priego che non sieno scarsi,</p></div>\n\n<div class="stanza"><p>perch&eacute; tu ogne nube li disleghi</p>\n<p>di sua mortalit&agrave; co&rsquo; prieghi tuoi,</p>\n<p>s&igrave; che &rsquo;l sommo piacer li si dispieghi.</p></div>\n\n<div class="stanza"><p>Ancor ti priego, regina, che puoi</p>\n<p>ci&ograve; che tu vuoli, che conservi sani,</p>\n<p>dopo tanto veder, li affetti suoi.</p></div>\n\n<div class="stanza"><p>Vinca tua guardia i movimenti umani:</p>\n<p>vedi Beatrice con quanti beati</p>\n<p>per li miei prieghi ti chiudon le mani!&raquo;.</p></div>\n\n<div class="stanza"><p>Li occhi da Dio diletti e venerati,</p>\n<p>fissi ne l&rsquo;orator, ne dimostraro</p>\n<p>quanto i devoti prieghi le son grati;</p></div>\n\n<div class="stanza"><p>indi a l&rsquo;etterno lume s&rsquo;addrizzaro,</p>\n<p>nel qual non si dee creder che s&rsquo;invii</p>\n<p>per creatura l&rsquo;occhio tanto chiaro.</p></div>\n\n<div class="stanza"><p>E io ch&rsquo;al fine di tutt&rsquo; i disii</p>\n<p>appropinquava, s&igrave; com&rsquo; io dovea,</p>\n<p>l&rsquo;ardor del desiderio in me finii.</p></div>\n\n<div class="stanza"><p>Bernardo m&rsquo;accennava, e sorridea,</p>\n<p>perch&rsquo; io guardassi suso; ma io era</p>\n<p>gi&agrave; per me stesso tal qual ei volea:</p></div>\n\n<div class="stanza"><p>ch&eacute; la mia vista, venendo sincera,</p>\n<p>e pi&ugrave; e pi&ugrave; intrava per lo raggio</p>\n<p>de l&rsquo;alta luce che da s&eacute; &egrave; vera.</p></div>\n\n<div class="stanza"><p>Da quinci innanzi il mio veder fu maggio</p>\n<p>che &rsquo;l parlar mostra, ch&rsquo;a tal vista cede,</p>\n<p>e cede la memoria a tanto oltraggio.</p></div>\n\n<div class="stanza"><p>Qual &egrave; col&uuml;i che sognando vede,</p>\n<p>che dopo &rsquo;l sogno la passione impressa</p>\n<p>rimane, e l&rsquo;altro a la mente non riede,</p></div>\n\n<div class="stanza"><p>cotal son io, ch&eacute; quasi tutta cessa</p>\n<p>mia vis&iuml;one, e ancor mi distilla</p>\n<p>nel core il dolce che nacque da essa.</p></div>\n\n<div class="stanza"><p>Cos&igrave; la neve al sol si disigilla;</p>\n<p>cos&igrave; al vento ne le foglie levi</p>\n<p>si perdea la sentenza di Sibilla.</p></div>\n\n<div class="stanza"><p>O somma luce che tanto ti levi</p>\n<p>da&rsquo; concetti mortali, a la mia mente</p>\n<p>ripresta un poco di quel che parevi,</p></div>\n\n<div class="stanza"><p>e fa la lingua mia tanto possente,</p>\n<p>ch&rsquo;una favilla sol de la tua gloria</p>\n<p>possa lasciare a la futura gente;</p></div>\n\n<div class="stanza"><p>ch&eacute;, per tornare alquanto a mia memoria</p>\n<p>e per sonare un poco in questi versi,</p>\n<p>pi&ugrave; si conceper&agrave; di tua vittoria.</p></div>\n\n<div class="stanza"><p>Io credo, per l&rsquo;acume ch&rsquo;io soffersi</p>\n<p>del vivo raggio, ch&rsquo;i&rsquo; sarei smarrito,</p>\n<p>se li occhi miei da lui fossero aversi.</p></div>\n\n<div class="stanza"><p>E&rsquo; mi ricorda ch&rsquo;io fui pi&ugrave; ardito</p>\n<p>per questo a sostener, tanto ch&rsquo;i&rsquo; giunsi</p>\n<p>l&rsquo;aspetto mio col valore infinito.</p></div>\n\n<div class="stanza"><p>Oh abbondante grazia ond&rsquo; io presunsi</p>\n<p>ficcar lo viso per la luce etterna,</p>\n<p>tanto che la veduta vi consunsi!</p></div>\n\n<div class="stanza"><p>Nel suo profondo vidi che s&rsquo;interna,</p>\n<p>legato con amore in un volume,</p>\n<p>ci&ograve; che per l&rsquo;universo si squaderna:</p></div>\n\n<div class="stanza"><p>sustanze e accidenti e lor costume</p>\n<p>quasi conflati insieme, per tal modo</p>\n<p>che ci&ograve; ch&rsquo;i&rsquo; dico &egrave; un semplice lume.</p></div>\n\n<div class="stanza"><p>La forma universal di questo nodo</p>\n<p>credo ch&rsquo;i&rsquo; vidi, perch&eacute; pi&ugrave; di largo,</p>\n<p>dicendo questo, mi sento ch&rsquo;i&rsquo; godo.</p></div>\n\n<div class="stanza"><p>Un punto solo m&rsquo;&egrave; maggior letargo</p>\n<p>che venticinque secoli a la &rsquo;mpresa</p>\n<p>che f&eacute; Nettuno ammirar l&rsquo;ombra d&rsquo;Argo.</p></div>\n\n<div class="stanza"><p>Cos&igrave; la mente mia, tutta sospesa,</p>\n<p>mirava fissa, immobile e attenta,</p>\n<p>e sempre di mirar faceasi accesa.</p></div>\n\n<div class="stanza"><p>A quella luce cotal si diventa,</p>\n<p>che volgersi da lei per altro aspetto</p>\n<p>&egrave; impossibil che mai si consenta;</p></div>\n\n<div class="stanza"><p>per&ograve; che &rsquo;l ben, ch&rsquo;&egrave; del volere obietto,</p>\n<p>tutto s&rsquo;accoglie in lei, e fuor di quella</p>\n<p>&egrave; defettivo ci&ograve; ch&rsquo;&egrave; l&igrave; perfetto.</p></div>\n\n<div class="stanza"><p>Omai sar&agrave; pi&ugrave; corta mia favella,</p>\n<p>pur a quel ch&rsquo;io ricordo, che d&rsquo;un fante</p>\n<p>che bagni ancor la lingua a la mammella.</p></div>\n\n<div class="stanza"><p>Non perch&eacute; pi&ugrave; ch&rsquo;un semplice sembiante</p>\n<p>fosse nel vivo lume ch&rsquo;io mirava,</p>\n<p>che tal &egrave; sempre qual s&rsquo;era davante;</p></div>\n\n<div class="stanza"><p>ma per la vista che s&rsquo;avvalorava</p>\n<p>in me guardando, una sola parvenza,</p>\n<p>mutandom&rsquo; io, a me si travagliava.</p></div>\n\n<div class="stanza"><p>Ne la profonda e chiara sussistenza</p>\n<p>de l&rsquo;alto lume parvermi tre giri</p>\n<p>di tre colori e d&rsquo;una contenenza;</p></div>\n\n<div class="stanza"><p>e l&rsquo;un da l&rsquo;altro come iri da iri</p>\n<p>parea reflesso, e &rsquo;l terzo parea foco</p>\n<p>che quinci e quindi igualmente si spiri.</p></div>\n\n<div class="stanza"><p>Oh quanto &egrave; corto il dire e come fioco</p>\n<p>al mio concetto! e questo, a quel ch&rsquo;i&rsquo; vidi,</p>\n<p>&egrave; tanto, che non basta a dicer &lsquo;poco&rsquo;.</p></div>\n\n<div class="stanza"><p>O luce etterna che sola in te sidi,</p>\n<p>sola t&rsquo;intendi, e da te intelletta</p>\n<p>e intendente te ami e arridi!</p></div>\n\n<div class="stanza"><p>Quella circulazion che s&igrave; concetta</p>\n<p>pareva in te come lume reflesso,</p>\n<p>da li occhi miei alquanto circunspetta,</p></div>\n\n<div class="stanza"><p>dentro da s&eacute;, del suo colore stesso,</p>\n<p>mi parve pinta de la nostra effige:</p>\n<p>per che &rsquo;l mio viso in lei tutto era messo.</p></div>\n\n<div class="stanza"><p>Qual &egrave; &rsquo;l geom&egrave;tra che tutto s&rsquo;affige</p>\n<p>per misurar lo cerchio, e non ritrova,</p>\n<p>pensando, quel principio ond&rsquo; elli indige,</p></div>\n\n<div class="stanza"><p>tal era io a quella vista nova:</p>\n<p>veder voleva come si convenne</p>\n<p>l&rsquo;imago al cerchio e come vi s&rsquo;indova;</p></div>\n\n<div class="stanza"><p>ma non eran da ci&ograve; le proprie penne:</p>\n<p>se non che la mia mente fu percossa</p>\n<p>da un fulgore in che sua voglia venne.</p></div>\n\n<div class="stanza"><p>A l&rsquo;alta fantasia qui manc&ograve; possa;</p>\n<p>ma gi&agrave; volgeva il mio disio e &rsquo;l velle,</p>\n<p>s&igrave; come rota ch&rsquo;igualmente &egrave; mossa,</p></div>\n\n<div class="stanza"><p>l&rsquo;amor che move il sole e l&rsquo;altre stelle.</p></div>']};

},{}],11:[function(require,module,exports){
// paradiso/longfellow.js

},{}]},{},[7])