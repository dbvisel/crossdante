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
var bookdata = require("./purgatorio/bookdata");
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

},{"./modules/app":4,"./modules/appdata":5,"./purgatorio/bookdata":8}],8:[function(require,module,exports){
"use strict";

// the spine for the book

module.exports = {

	bookname: 'purgatorio',
	booktitle: "Purgatorio",
	bookauthor: "Dante Alighieri",
	description: "<p>The adventure-packed sequel to <em>Inferno</em>.",

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
"use strict";module.exports={bookname:'purgatorio',author:'Dante Alighieri',translationid:"cary",title:'Purgatory',translation:true,source:'<a href="http://www.gutenberg.org/ebooks/1006">Project Gutenberg</a>',translationshortname:"Cary",translationfullname:"Henry Francis Cary",translationclass:"poetry",text:['<p class="title">Purgatory</p>\n\t\t<p class="author">Henry Francis Cary</p>','<p class="cantohead">Canto I</p>\n<div class="stanza"><p>O&rsquo;er better waves to speed her rapid course</p>\n<p>The light bark of my genius lifts the sail,</p>\n<p>Well pleas&rsquo;d to leave so cruel sea behind;</p>\n<p>And of that second region will I sing,</p>\n<p>In which the human spirit from sinful blot</p>\n<p>Is purg&rsquo;d, and for ascent to Heaven prepares.</p>\n<p class="slindent">Here, O ye hallow&rsquo;d Nine! for in your train</p>\n<p>I follow, here the deadened strain revive;</p>\n<p>Nor let Calliope refuse to sound</p>\n<p>A somewhat higher song, of that loud tone,</p>\n<p>Which when the wretched birds of chattering note</p>\n<p>Had heard, they of forgiveness lost all hope.</p>\n<p class="slindent">Sweet hue of eastern sapphire, that was spread</p>\n<p>O&rsquo;er the serene aspect of the pure air,</p>\n<p>High up as the first circle, to mine eyes</p>\n<p>Unwonted joy renew&rsquo;d, soon as I &rsquo;scap&rsquo;d</p>\n<p>Forth from the atmosphere of deadly gloom,</p>\n<p>That had mine eyes and bosom fill&rsquo;d with grief.</p>\n<p>The radiant planet, that to love invites,</p>\n<p>Made all the orient laugh, and veil&rsquo;d beneath</p>\n<p>The Pisces&rsquo; light, that in his escort came.</p>\n<p class="slindent">To the right hand I turn&rsquo;d, and fix&rsquo;d my mind</p>\n<p>On the&rsquo; other pole attentive, where I saw</p>\n<p>Four stars ne&rsquo;er seen before save by the ken</p>\n<p>Of our first parents. Heaven of their rays</p>\n<p>Seem&rsquo;d joyous. O thou northern site, bereft</p>\n<p>Indeed, and widow&rsquo;d, since of these depriv&rsquo;d!</p>\n<p class="slindent">As from this view I had desisted, straight</p>\n<p>Turning a little tow&rsquo;rds the other pole,</p>\n<p>There from whence now the wain had disappear&rsquo;d,</p>\n<p>I saw an old man standing by my side</p>\n<p>Alone, so worthy of rev&rsquo;rence in his look,</p>\n<p>That ne&rsquo;er from son to father more was ow&rsquo;d.</p>\n<p>Low down his beard and mix&rsquo;d with hoary white</p>\n<p>Descended, like his locks, which parting fell</p>\n<p>Upon his breast in double fold. The beams</p>\n<p>Of those four luminaries on his face</p>\n<p>So brightly shone, and with such radiance clear</p>\n<p>Deck&rsquo;d it, that I beheld him as the sun.</p>\n<p class="slindent">&ldquo;Say who are ye, that stemming the blind stream,</p>\n<p>Forth from th&rsquo; eternal prison-house have fled?&rdquo;</p>\n<p>He spoke and moved those venerable plumes.</p>\n<p>&ldquo;Who hath conducted, or with lantern sure</p>\n<p>Lights you emerging from the depth of night,</p>\n<p>That makes the infernal valley ever black?</p>\n<p>Are the firm statutes of the dread abyss</p>\n<p>Broken, or in high heaven new laws ordain&rsquo;d,</p>\n<p>That thus, condemn&rsquo;d, ye to my caves approach?&rdquo;</p>\n<p class="slindent">My guide, then laying hold on me, by words</p>\n<p>And intimations given with hand and head,</p>\n<p>Made my bent knees and eye submissive pay</p>\n<p>Due reverence; then thus to him replied.</p>\n<p class="slindent">&ldquo;Not of myself I come; a Dame from heaven</p>\n<p>Descending, had besought me in my charge</p>\n<p>To bring. But since thy will implies, that more</p>\n<p>Our true condition I unfold at large,</p>\n<p>Mine is not to deny thee thy request.</p>\n<p>This mortal ne&rsquo;er hath seen the farthest gloom.</p>\n<p>But erring by his folly had approach&rsquo;d</p>\n<p>So near, that little space was left to turn.</p>\n<p>Then, as before I told, I was dispatch&rsquo;d</p>\n<p>To work his rescue, and no way remain&rsquo;d</p>\n<p>Save this which I have ta&rsquo;en. I have display&rsquo;d</p>\n<p>Before him all the regions of the bad;</p>\n<p>And purpose now those spirits to display,</p>\n<p>That under thy command are purg&rsquo;d from sin.</p>\n<p>How I have brought him would be long to say.</p>\n<p>From high descends the virtue, by whose aid</p>\n<p>I to thy sight and hearing him have led.</p>\n<p>Now may our coming please thee. In the search</p>\n<p>Of liberty he journeys: that how dear</p>\n<p>They know, who for her sake have life refus&rsquo;d.</p>\n<p>Thou knowest, to whom death for her was sweet</p>\n<p>In Utica, where thou didst leave those weeds,</p>\n<p>That in the last great day will shine so bright.</p>\n<p>For us the&rsquo; eternal edicts are unmov&rsquo;d:</p>\n<p>He breathes, and I am free of Minos&rsquo; power,</p>\n<p>Abiding in that circle where the eyes</p>\n<p>Of thy chaste Marcia beam, who still in look</p>\n<p>Prays thee, O hallow&rsquo;d spirit! to own her shine.</p>\n<p>Then by her love we&rsquo; implore thee, let us pass</p>\n<p>Through thy sev&rsquo;n regions; for which best thanks</p>\n<p>I for thy favour will to her return,</p>\n<p>If mention there below thou not disdain.&rdquo;</p>\n<p class="slindent">&ldquo;Marcia so pleasing in my sight was found,&rdquo;</p>\n<p>He then to him rejoin&rsquo;d, &ldquo;while I was there,</p>\n<p>That all she ask&rsquo;d me I was fain to grant.</p>\n<p>Now that beyond the&rsquo; accursed stream she dwells,</p>\n<p>She may no longer move me, by that law,</p>\n<p>Which was ordain&rsquo;d me, when I issued thence.</p>\n<p>Not so, if Dame from heaven, as thou sayst,</p>\n<p>Moves and directs thee; then no flattery needs.</p>\n<p>Enough for me that in her name thou ask.</p>\n<p>Go therefore now: and with a slender reed</p>\n<p>See that thou duly gird him, and his face</p>\n<p>Lave, till all sordid stain thou wipe from thence.</p>\n<p>For not with eye, by any cloud obscur&rsquo;d,</p>\n<p>Would it be seemly before him to come,</p>\n<p>Who stands the foremost minister in heaven.</p>\n<p>This islet all around, there far beneath,</p>\n<p>Where the wave beats it, on the oozy bed</p>\n<p>Produces store of reeds. No other plant,</p>\n<p>Cover&rsquo;d with leaves, or harden&rsquo;d in its stalk,</p>\n<p>There lives, not bending to the water&rsquo;s sway.</p>\n<p>After, this way return not; but the sun</p>\n<p>Will show you, that now rises, where to take</p>\n<p>The mountain in its easiest ascent.&rdquo;</p>\n<p class="slindent">He disappear&rsquo;d; and I myself uprais&rsquo;d</p>\n<p>Speechless, and to my guide retiring close,</p>\n<p>Toward him turn&rsquo;d mine eyes. He thus began;</p>\n<p>&ldquo;My son! observant thou my steps pursue.</p>\n<p>We must retreat to rearward, for that way</p>\n<p>The champain to its low extreme declines.&rdquo;</p>\n<p class="slindent">The dawn had chas&rsquo;d the matin hour of prime,</p>\n<p>Which deaf before it, so that from afar</p>\n<p>I spy&rsquo;d the trembling of the ocean stream.</p>\n<p class="slindent">We travers&rsquo;d the deserted plain, as one</p>\n<p>Who, wander&rsquo;d from his track, thinks every step</p>\n<p>Trodden in vain till he regain the path.</p>\n<p class="slindent">When we had come, where yet the tender dew</p>\n<p>Strove with the sun, and in a place, where fresh</p>\n<p>The wind breath&rsquo;d o&rsquo;er it, while it slowly dried;</p>\n<p>Both hands extended on the watery grass</p>\n<p>My master plac&rsquo;d, in graceful act and kind.</p>\n<p>Whence I of his intent before appriz&rsquo;d,</p>\n<p>Stretch&rsquo;d out to him my cheeks suffus&rsquo;d with tears.</p>\n<p>There to my visage he anew restor&rsquo;d</p>\n<p>That hue, which the dun shades of hell conceal&rsquo;d.</p>\n<p class="slindent">Then on the solitary shore arriv&rsquo;d,</p>\n<p>That never sailing on its waters saw</p>\n<p>Man, that could after measure back his course,</p>\n<p>He girt me in such manner as had pleas&rsquo;d</p>\n<p>Him who instructed, and O, strange to tell!</p>\n<p>As he selected every humble plant,</p>\n<p>Wherever one was pluck&rsquo;d, another there</p>\n<p>Resembling, straightway in its place arose.</p>\n</div>','<p class="cantohead">Canto II</p>\n<div class="stanza"><p>Now had the sun to that horizon reach&rsquo;d,</p>\n<p>That covers, with the most exalted point</p>\n<p>Of its meridian circle, Salem&rsquo;s walls,</p>\n<p>And night, that opposite to him her orb</p>\n<p>Sounds, from the stream of Ganges issued forth,</p>\n<p>Holding the scales, that from her hands are dropp&rsquo;d</p>\n<p>When she reigns highest: so that where I was,</p>\n<p>Aurora&rsquo;s white and vermeil-tinctur&rsquo;d cheek</p>\n<p>To orange turn&rsquo;d as she in age increas&rsquo;d.</p>\n<p class="slindent">Meanwhile we linger&rsquo;d by the water&rsquo;s brink,</p>\n<p>Like men, who, musing on their road, in thought</p>\n<p>Journey, while motionless the body rests.</p>\n<p>When lo! as near upon the hour of dawn,</p>\n<p>Through the thick vapours Mars with fiery beam</p>\n<p>Glares down in west, over the ocean floor;</p>\n<p>So seem&rsquo;d, what once again I hope to view,</p>\n<p>A light so swiftly coming through the sea,</p>\n<p>No winged course might equal its career.</p>\n<p>From which when for a space I had withdrawn</p>\n<p>Thine eyes, to make inquiry of my guide,</p>\n<p>Again I look&rsquo;d and saw it grown in size</p>\n<p>And brightness: thou on either side appear&rsquo;d</p>\n<p>Something, but what I knew not of bright hue,</p>\n<p>And by degrees from underneath it came</p>\n<p>Another. My preceptor silent yet</p>\n<p>Stood, while the brightness, that we first discern&rsquo;d,</p>\n<p>Open&rsquo;d the form of wings: then when he knew</p>\n<p>The pilot, cried aloud, &ldquo;Down, down; bend low</p>\n<p>Thy knees; behold God&rsquo;s angel: fold thy hands:</p>\n<p>Now shalt thou see true Ministers indeed.</p>\n<p>Lo how all human means he sets at naught!</p>\n<p>So that nor oar he needs, nor other sail</p>\n<p>Except his wings, between such distant shores.</p>\n<p>Lo how straight up to heaven he holds them rear&rsquo;d,</p>\n<p>Winnowing the air with those eternal plumes,</p>\n<p>That not like mortal hairs fall off or change!&rdquo;</p>\n<p class="slindent">As more and more toward us came, more bright</p>\n<p>Appear&rsquo;d the bird of God, nor could the eye</p>\n<p>Endure his splendor near: I mine bent down.</p>\n<p>He drove ashore in a small bark so swift</p>\n<p>And light, that in its course no wave it drank.</p>\n<p>The heav&rsquo;nly steersman at the prow was seen,</p>\n<p>Visibly written blessed in his looks.</p>\n<p>Within a hundred spirits and more there sat.</p>\n<p>&ldquo;In Exitu Israel de Aegypto;&rdquo;</p>\n<p>All with one voice together sang, with what</p>\n<p>In the remainder of that hymn is writ.</p>\n<p>Then soon as with the sign of holy cross</p>\n<p>He bless&rsquo;d them, they at once leap&rsquo;d out on land,</p>\n<p>The swiftly as he came return&rsquo;d. The crew,</p>\n<p>There left, appear&rsquo;d astounded with the place,</p>\n<p>Gazing around as one who sees new sights.</p>\n<p class="slindent">From every side the sun darted his beams,</p>\n<p>And with his arrowy radiance from mid heav&rsquo;n</p>\n<p>Had chas&rsquo;d the Capricorn, when that strange tribe</p>\n<p>Lifting their eyes towards us: If ye know,</p>\n<p>Declare what path will Lead us to the mount.&rdquo;</p>\n<p class="slindent">Them Virgil answer&rsquo;d. &ldquo;Ye suppose perchance</p>\n<p>Us well acquainted with this place: but here,</p>\n<p>We, as yourselves, are strangers. Not long erst</p>\n<p>We came, before you but a little space,</p>\n<p>By other road so rough and hard, that now</p>\n<p>The&rsquo; ascent will seem to us as play.&rdquo; The spirits,</p>\n<p>Who from my breathing had perceiv&rsquo;d I liv&rsquo;d,</p>\n<p>Grew pale with wonder. As the multitude</p>\n<p>Flock round a herald, sent with olive branch,</p>\n<p>To hear what news he brings, and in their haste</p>\n<p>Tread one another down, e&rsquo;en so at sight</p>\n<p>Of me those happy spirits were fix&rsquo;d, each one</p>\n<p>Forgetful of its errand, to depart,</p>\n<p>Where cleans&rsquo;d from sin, it might be made all fair.</p>\n<p class="slindent">Then one I saw darting before the rest</p>\n<p>With such fond ardour to embrace me, I</p>\n<p>To do the like was mov&rsquo;d. O shadows vain</p>\n<p>Except in outward semblance! thrice my hands</p>\n<p>I clasp&rsquo;d behind it, they as oft return&rsquo;d</p>\n<p>Empty into my breast again. Surprise</p>\n<p>I needs must think was painted in my looks,</p>\n<p>For that the shadow smil&rsquo;d and backward drew.</p>\n<p>To follow it I hasten&rsquo;d, but with voice</p>\n<p>Of sweetness it enjoin&rsquo;d me to desist.</p>\n<p>Then who it was I knew, and pray&rsquo;d of it,</p>\n<p>To talk with me, it would a little pause.</p>\n<p>It answered: &ldquo;Thee as in my mortal frame</p>\n<p>I lov&rsquo;d, so loos&rsquo;d forth it I love thee still,</p>\n<p>And therefore pause; but why walkest thou here?&rdquo;</p>\n<p class="slindent">&ldquo;Not without purpose once more to return,</p>\n<p>Thou find&rsquo;st me, my Casella, where I am</p>\n<p>Journeying this way;&rdquo; I said, &ldquo;but how of thee</p>\n<p>Hath so much time been lost?&rdquo; He answer&rsquo;d straight:</p>\n<p>&ldquo;No outrage hath been done to me, if he</p>\n<p>Who when and whom he chooses takes, me oft</p>\n<p>This passage hath denied, since of just will</p>\n<p>His will he makes. These three months past indeed,</p>\n<p>He, whose chose to enter, with free leave</p>\n<p>Hath taken; whence I wand&rsquo;ring by the shore</p>\n<p>Where Tyber&rsquo;s wave grows salt, of him gain&rsquo;d kind</p>\n<p>Admittance, at that river&rsquo;s mouth, tow&rsquo;rd which</p>\n<p>His wings are pointed, for there always throng</p>\n<p>All such as not to Archeron descend.&rdquo;</p>\n<p class="slindent">Then I: &ldquo;If new laws have not quite destroy&rsquo;d</p>\n<p>Memory and use of that sweet song of love,</p>\n<p>That while all my cares had power to &rsquo;swage;</p>\n<p>Please thee with it a little to console</p>\n<p>My spirit, that incumber&rsquo;d with its frame,</p>\n<p>Travelling so far, of pain is overcome.&rdquo;</p>\n<p class="slindent">&ldquo;Love that discourses in my thoughts.&rdquo; He then</p>\n<p>Began in such soft accents, that within</p>\n<p>The sweetness thrills me yet. My gentle guide</p>\n<p>And all who came with him, so well were pleas&rsquo;d,</p>\n<p>That seem&rsquo;d naught else might in their thoughts have room.</p>\n<p class="slindent">Fast fix&rsquo;d in mute attention to his notes</p>\n<p>We stood, when lo! that old man venerable</p>\n<p>Exclaiming, &ldquo;How is this, ye tardy spirits?</p>\n<p>What negligence detains you loit&rsquo;ring here?</p>\n<p>Run to the mountain to cast off those scales,</p>\n<p>That from your eyes the sight of God conceal.&rdquo;</p>\n<p class="slindent">As a wild flock of pigeons, to their food</p>\n<p>Collected, blade or tares, without their pride</p>\n<p>Accustom&rsquo;d, and in still and quiet sort,</p>\n<p>If aught alarm them, suddenly desert</p>\n<p>Their meal, assail&rsquo;d by more important care;</p>\n<p>So I that new-come troop beheld, the song</p>\n<p>Deserting, hasten to the mountain&rsquo;s side,</p>\n<p>As one who goes yet where he tends knows not.</p>\n<p class="slindent">Nor with less hurried step did we depart.</p>\n</div>','<p class="cantohead">Canto III</p>\n<div class="stanza"><p>Them sudden flight had scatter&rsquo;d over the plain,</p>\n<p>Turn&rsquo;d tow&rsquo;rds the mountain, whither reason&rsquo;s voice</p>\n<p>Drives us; I to my faithful company</p>\n<p>Adhering, left it not. For how of him</p>\n<p>Depriv&rsquo;d, might I have sped, or who beside</p>\n<p>Would o&rsquo;er the mountainous tract have led my steps</p>\n<p>He with the bitter pang of self-remorse</p>\n<p>Seem&rsquo;d smitten. O clear conscience and upright</p>\n<p>How doth a little fling wound thee sore!</p>\n<p class="slindent">Soon as his feet desisted (slack&rsquo;ning pace),</p>\n<p>From haste, that mars all decency of act,</p>\n<p>My mind, that in itself before was wrapt,</p>\n<p>Its thoughts expanded, as with joy restor&rsquo;d:</p>\n<p>And full against the steep ascent I set</p>\n<p>My face, where highest to heav&rsquo;n its top o&rsquo;erflows.</p>\n<p class="slindent">The sun, that flar&rsquo;d behind, with ruddy beam</p>\n<p>Before my form was broken; for in me</p>\n<p>His rays resistance met. I turn&rsquo;d aside</p>\n<p>With fear of being left, when I beheld</p>\n<p>Only before myself the ground obscur&rsquo;d.</p>\n<p>When thus my solace, turning him around,</p>\n<p>Bespake me kindly: &ldquo;Why distrustest thou?</p>\n<p>Believ&rsquo;st not I am with thee, thy sure guide?</p>\n<p>It now is evening there, where buried lies</p>\n<p>The body, in which I cast a shade, remov&rsquo;d</p>\n<p>To Naples from Brundusium&rsquo;s wall. Nor thou</p>\n<p>Marvel, if before me no shadow fall,</p>\n<p>More than that in the sky element</p>\n<p>One ray obstructs not other. To endure</p>\n<p>Torments of heat and cold extreme, like frames</p>\n<p>That virtue hath dispos&rsquo;d, which how it works</p>\n<p>Wills not to us should be reveal&rsquo;d. Insane</p>\n<p>Who hopes, our reason may that space explore,</p>\n<p>Which holds three persons in one substance knit.</p>\n<p>Seek not the wherefore, race of human kind;</p>\n<p>Could ye have seen the whole, no need had been</p>\n<p>For Mary to bring forth. Moreover ye</p>\n<p>Have seen such men desiring fruitlessly;</p>\n<p>To whose desires repose would have been giv&rsquo;n,</p>\n<p>That now but serve them for eternal grief.</p>\n<p>I speak of Plato, and the Stagyrite,</p>\n<p>And others many more.&rdquo; And then he bent</p>\n<p>Downwards his forehead, and in troubled mood</p>\n<p>Broke off his speech. Meanwhile we had arriv&rsquo;d</p>\n<p>Far as the mountain&rsquo;s foot, and there the rock</p>\n<p>Found of so steep ascent, that nimblest steps</p>\n<p>To climb it had been vain. The most remote</p>\n<p>Most wild untrodden path, in all the tract</p>\n<p>&rsquo;Twixt Lerice and Turbia were to this</p>\n<p>A ladder easy&rsquo; and open of access.</p>\n<p class="slindent">&ldquo;Who knows on which hand now the steep declines?&rdquo;</p>\n<p>My master said and paus&rsquo;d, &ldquo;so that he may</p>\n<p>Ascend, who journeys without aid of wine,?&rdquo;</p>\n<p>And while with looks directed to the ground</p>\n<p>The meaning of the pathway he explor&rsquo;d,</p>\n<p>And I gaz&rsquo;d upward round the stony height,</p>\n<p>Of spirits, that toward us mov&rsquo;d their steps,</p>\n<p>Yet moving seem&rsquo;d not, they so slow approach&rsquo;d.</p>\n<p class="slindent">I thus my guide address&rsquo;d: &ldquo;Upraise thine eyes,</p>\n<p>Lo that way some, of whom thou may&rsquo;st obtain</p>\n<p>Counsel, if of thyself thou find&rsquo;st it not!&rdquo;</p>\n<p class="slindent">Straightway he look&rsquo;d, and with free speech replied:</p>\n<p>&ldquo;Let us tend thither: they but softly come.</p>\n<p>And thou be firm in hope, my son belov&rsquo;d.&rdquo;</p>\n<p class="slindent">Now was that people distant far in space</p>\n<p>A thousand paces behind ours, as much</p>\n<p>As at a throw the nervous arm could fling,</p>\n<p>When all drew backward on the messy crags</p>\n<p>Of the steep bank, and firmly stood unmov&rsquo;d</p>\n<p>As one who walks in doubt might stand to look.</p>\n<p class="slindent">&ldquo;O spirits perfect! O already chosen!&rdquo;</p>\n<p>Virgil to them began, &ldquo;by that blest peace,</p>\n<p>Which, as I deem, is for you all prepar&rsquo;d,</p>\n<p>Instruct us where the mountain low declines,</p>\n<p>So that attempt to mount it be not vain.</p>\n<p>For who knows most, him loss of time most grieves.&rdquo;</p>\n<p class="slindent">As sheep, that step from forth their fold, by one,</p>\n<p>Or pairs, or three at once; meanwhile the rest</p>\n<p>Stand fearfully, bending the eye and nose</p>\n<p>To ground, and what the foremost does, that do</p>\n<p>The others, gath&rsquo;ring round her, if she stops,</p>\n<p>Simple and quiet, nor the cause discern;</p>\n<p>So saw I moving to advance the first,</p>\n<p>Who of that fortunate crew were at the head,</p>\n<p>Of modest mien and graceful in their gait.</p>\n<p>When they before me had beheld the light</p>\n<p>From my right side fall broken on the ground,</p>\n<p>So that the shadow reach&rsquo;d the cave, they stopp&rsquo;d</p>\n<p>And somewhat back retir&rsquo;d: the same did all,</p>\n<p>Who follow&rsquo;d, though unweeting of the cause</p>\n<p class="slindent">&ldquo;Unask&rsquo;d of you, yet freely I confess,</p>\n<p>This is a human body which ye see.</p>\n<p>That the sun&rsquo;s light is broken on the ground,</p>\n<p>Marvel not: but believe, that not without</p>\n<p>Virtue deriv&rsquo;d from Heaven, we to climb</p>\n<p>Over this wall aspire.&rdquo; So them bespake</p>\n<p>My master; and that virtuous tribe rejoin&rsquo;d;</p>\n<p>&ldquo; Turn, and before you there the entrance lies,&rdquo;</p>\n<p>Making a signal to us with bent hands.</p>\n<p class="slindent">Then of them one began. &ldquo;Whoe&rsquo;er thou art,</p>\n<p>Who journey&rsquo;st thus this way, thy visage turn,</p>\n<p>Think if me elsewhere thou hast ever seen.&rdquo;</p>\n<p class="slindent">I tow&rsquo;rds him turn&rsquo;d, and with fix&rsquo;d eye beheld.</p>\n<p>Comely, and fair, and gentle of aspect,</p>\n<p>He seem&rsquo;d, but on one brow a gash was mark&rsquo;d.</p>\n<p class="slindent">When humbly I disclaim&rsquo;d to have beheld</p>\n<p>Him ever: &ldquo;Now behold!&rdquo; he said, and show&rsquo;d</p>\n<p>High on his breast a wound: then smiling spake.</p>\n<p class="slindent">&ldquo;I am Manfredi, grandson to the Queen</p>\n<p>Costanza: whence I pray thee, when return&rsquo;d,</p>\n<p>To my fair daughter go, the parent glad</p>\n<p>Of Aragonia and Sicilia&rsquo;s pride;</p>\n<p>And of the truth inform her, if of me</p>\n<p>Aught else be told. When by two mortal blows</p>\n<p>My frame was shatter&rsquo;d, I betook myself</p>\n<p>Weeping to him, who of free will forgives.</p>\n<p>My sins were horrible; but so wide arms</p>\n<p>Hath goodness infinite, that it receives</p>\n<p>All who turn to it. Had this text divine</p>\n<p>Been of Cosenza&rsquo;s shepherd better scann&rsquo;d,</p>\n<p>Who then by Clement on my hunt was set,</p>\n<p>Yet at the bridge&rsquo;s head my bones had lain,</p>\n<p>Near Benevento, by the heavy mole</p>\n<p>Protected; but the rain now drenches them,</p>\n<p>And the wind drives, out of the kingdom&rsquo;s bounds,</p>\n<p>Far as the stream of Verde, where, with lights</p>\n<p>Extinguish&rsquo;d, he remov&rsquo;d them from their bed.</p>\n<p>Yet by their curse we are not so destroy&rsquo;d,</p>\n<p>But that the eternal love may turn, while hope</p>\n<p>Retains her verdant blossoms. True it is,</p>\n<p>That such one as in contumacy dies</p>\n<p>Against the holy church, though he repent,</p>\n<p>Must wander thirty-fold for all the time</p>\n<p>In his presumption past; if such decree</p>\n<p>Be not by prayers of good men shorter made</p>\n<p>Look therefore if thou canst advance my bliss;</p>\n<p>Revealing to my good Costanza, how</p>\n<p>Thou hast beheld me, and beside the terms</p>\n<p>Laid on me of that interdict; for here</p>\n<p>By means of those below much profit comes.&rdquo;</p>\n</div>','<p class="cantohead">Canto IV</p>\n<div class="stanza"><p>When by sensations of delight or pain,</p>\n<p>That any of our faculties hath seiz&rsquo;d,</p>\n<p>Entire the soul collects herself, it seems</p>\n<p>She is intent upon that power alone,</p>\n<p>And thus the error is disprov&rsquo;d which holds</p>\n<p>The soul not singly lighted in the breast.</p>\n<p>And therefore when as aught is heard or seen,</p>\n<p>That firmly keeps the soul toward it turn&rsquo;d,</p>\n<p>Time passes, and a man perceives it not.</p>\n<p>For that, whereby he hearken, is one power,</p>\n<p>Another that, which the whole spirit hash;</p>\n<p>This is as it were bound, while that is free.</p>\n<p class="slindent">This found I true by proof, hearing that spirit</p>\n<p>And wond&rsquo;ring; for full fifty steps aloft</p>\n<p>The sun had measur&rsquo;d unobserv&rsquo;d of me,</p>\n<p>When we arriv&rsquo;d where all with one accord</p>\n<p>The spirits shouted, &ldquo;Here is what ye ask.&rdquo;</p>\n<p class="slindent">A larger aperture ofttimes is stopp&rsquo;d</p>\n<p>With forked stake of thorn by villager,</p>\n<p>When the ripe grape imbrowns, than was the path,</p>\n<p>By which my guide, and I behind him close,</p>\n<p>Ascended solitary, when that troop</p>\n<p>Departing left us. On Sanleo&rsquo;s road</p>\n<p>Who journeys, or to Noli low descends,</p>\n<p>Or mounts Bismantua&rsquo;s height, must use his feet;</p>\n<p>But here a man had need to fly, I mean</p>\n<p>With the swift wing and plumes of high desire,</p>\n<p>Conducted by his aid, who gave me hope,</p>\n<p>And with light furnish&rsquo;d to direct my way.</p>\n<p class="slindent">We through the broken rock ascended, close</p>\n<p>Pent on each side, while underneath the ground</p>\n<p>Ask&rsquo;d help of hands and feet. When we arriv&rsquo;d</p>\n<p>Near on the highest ridge of the steep bank,</p>\n<p>Where the plain level open&rsquo;d I exclaim&rsquo;d,</p>\n<p>&ldquo;O master! say which way can we proceed?&rdquo;</p>\n<p class="slindent">He answer&rsquo;d, &ldquo;Let no step of thine recede.</p>\n<p>Behind me gain the mountain, till to us</p>\n<p>Some practis&rsquo;d guide appear.&rdquo; That eminence</p>\n<p>Was lofty that no eye might reach its point,</p>\n<p>And the side proudly rising, more than line</p>\n<p>From the mid quadrant to the centre drawn.</p>\n<p>I wearied thus began: &ldquo;Parent belov&rsquo;d!</p>\n<p>Turn, and behold how I remain alonw,</p>\n<p>If thou stay not.&rdquo;&mdash;&ldquo;My son!&rdquo; He straight reply&rsquo;d,</p>\n<p>&ldquo;Thus far put forth thy strength; &ldquo;and to a track</p>\n<p>Pointed, that, on this side projecting, round</p>\n<p>Circles the hill. His words so spurr&rsquo;d me on,</p>\n<p>That I behind him clamb&rsquo;ring, forc&rsquo;d myself,</p>\n<p>Till my feet press&rsquo;d the circuit plain beneath.</p>\n<p>There both together seated, turn&rsquo;d we round</p>\n<p>To eastward, whence was our ascent: and oft</p>\n<p>Many beside have with delight look&rsquo;d back.</p>\n<p class="slindent">First on the nether shores I turn&rsquo;d my eyes,</p>\n<p>Then rais&rsquo;d them to the sun, and wond&rsquo;ring mark&rsquo;d</p>\n<p>That from the left it smote us. Soon perceiv&rsquo;d</p>\n<p>That Poet sage how at the car of light</p>\n<p>Amaz&rsquo;d I stood, where &rsquo;twixt us and the north</p>\n<p>Its course it enter&rsquo;d. Whence he thus to me:</p>\n<p>&ldquo;Were Leda&rsquo;s offspring now in company</p>\n<p>Of that broad mirror, that high up and low</p>\n<p>Imparts his light beneath, thou might&rsquo;st behold</p>\n<p>The ruddy zodiac nearer to the bears</p>\n<p>Wheel, if its ancient course it not forsook.</p>\n<p>How that may be if thou would&rsquo;st think; within</p>\n<p>Pond&rsquo;ring, imagine Sion with this mount</p>\n<p>Plac&rsquo;d on the earth, so that to both be one</p>\n<p>Horizon, and two hemispheres apart,</p>\n<p>Where lies the path that Phaeton ill knew</p>\n<p>To guide his erring chariot: thou wilt see</p>\n<p>How of necessity by this on one</p>\n<p>He passes, while by that on the&rsquo; other side,</p>\n<p>If with clear view shine intellect attend.&rdquo;</p>\n<p class="slindent">&ldquo;Of truth, kind teacher!&rdquo; I exclaim&rsquo;d, &ldquo;so clear</p>\n<p>Aught saw I never, as I now discern</p>\n<p>Where seem&rsquo;d my ken to fail, that the mid orb</p>\n<p>Of the supernal motion (which in terms</p>\n<p>Of art is called the Equator, and remains</p>\n<p>Ever between the sun and winter) for the cause</p>\n<p>Thou hast assign&rsquo;d, from hence toward the north</p>\n<p>Departs, when those who in the Hebrew land</p>\n<p>Inhabit, see it tow&rsquo;rds the warmer part.</p>\n<p>But if it please thee, I would gladly know,</p>\n<p>How far we have to journey: for the hill</p>\n<p>Mounts higher, than this sight of mine can mount.&rdquo;</p>\n<p class="slindent">He thus to me: &ldquo;Such is this steep ascent,</p>\n<p>That it is ever difficult at first,</p>\n<p>But, more a man proceeds, less evil grows.</p>\n<p>When pleasant it shall seem to thee, so much</p>\n<p>That upward going shall be easy to thee.</p>\n<p>As in a vessel to go down the tide,</p>\n<p>Then of this path thou wilt have reach&rsquo;d the end.</p>\n<p>There hope to rest thee from thy toil. No more</p>\n<p>I answer, and thus far for certain know.&rdquo;</p>\n<p>As he his words had spoken, near to us</p>\n<p>A voice there sounded: &ldquo;Yet ye first perchance</p>\n<p>May to repose you by constraint be led.&rdquo;</p>\n<p>At sound thereof each turn&rsquo;d, and on the left</p>\n<p>A huge stone we beheld, of which nor I</p>\n<p>Nor he before was ware. Thither we drew,</p>\n<p>find there were some, who in the shady place</p>\n<p>Behind the rock were standing, as a man</p>\n<p>Thru&rsquo; idleness might stand. Among them one,</p>\n<p>Who seem&rsquo;d to me much wearied, sat him down,</p>\n<p>And with his arms did fold his knees about,</p>\n<p>Holding his face between them downward bent.</p>\n<p class="slindent">&ldquo;Sweet Sir!&rdquo; I cry&rsquo;d, &ldquo;behold that man, who shows</p>\n<p>Himself more idle, than if laziness</p>\n<p>Were sister to him.&rdquo; Straight he turn&rsquo;d to us,</p>\n<p>And, o&rsquo;er the thigh lifting his face, observ&rsquo;d,</p>\n<p>Then in these accents spake: &ldquo;Up then, proceed</p>\n<p>Thou valiant one.&rdquo; Straight who it was I knew;</p>\n<p>Nor could the pain I felt (for want of breath</p>\n<p>Still somewhat urg&rsquo;d me) hinder my approach.</p>\n<p>And when I came to him, he scarce his head</p>\n<p>Uplifted, saying &ldquo;Well hast thou discern&rsquo;d,</p>\n<p>How from the left the sun his chariot leads.&rdquo;</p>\n<p class="slindent">His lazy acts and broken words my lips</p>\n<p>To laughter somewhat mov&rsquo;d; when I began:</p>\n<p>&ldquo;Belacqua, now for thee I grieve no more.</p>\n<p>But tell, why thou art seated upright there?</p>\n<p>Waitest thou escort to conduct thee hence?</p>\n<p>Or blame I only shine accustom&rsquo;d ways?&rdquo;</p>\n<p>Then he: &ldquo;My brother, of what use to mount,</p>\n<p>When to my suffering would not let me pass</p>\n<p>The bird of God, who at the portal sits?</p>\n<p>Behooves so long that heav&rsquo;n first bear me round</p>\n<p>Without its limits, as in life it bore,</p>\n<p>Because I to the end repentant Sighs</p>\n<p>Delay&rsquo;d, if prayer do not aid me first,</p>\n<p>That riseth up from heart which lives in grace.</p>\n<p>What other kind avails, not heard in heaven?&rdquo;&nbsp;&rsquo;</p>\n<p class="slindent">Before me now the Poet up the mount</p>\n<p>Ascending, cried: &ldquo;Haste thee, for see the sun</p>\n<p>Has touch&rsquo;d the point meridian, and the night</p>\n<p>Now covers with her foot Marocco&rsquo;s shore.&rdquo;</p>\n</div>','<p class="cantohead">Canto V</p>\n<div class="stanza"><p>Now had I left those spirits, and pursued</p>\n<p>The steps of my Conductor, when beheld</p>\n<p>Pointing the finger at me one exclaim&rsquo;d:</p>\n<p>&ldquo;See how it seems as if the light not shone</p>\n<p>From the left hand of him beneath, and he,</p>\n<p>As living, seems to be led on.&rdquo; Mine eyes</p>\n<p>I at that sound reverting, saw them gaze</p>\n<p>Through wonder first at me, and then at me</p>\n<p>And the light broken underneath, by turns.</p>\n<p>&ldquo;Why are thy thoughts thus riveted?&rdquo; my guide</p>\n<p>Exclaim&rsquo;d, &ldquo;that thou hast slack&rsquo;d thy pace? or how</p>\n<p>Imports it thee, what thing is whisper&rsquo;d here?</p>\n<p>Come after me, and to their babblings leave</p>\n<p>The crowd. Be as a tower, that, firmly set,</p>\n<p>Shakes not its top for any blast that blows!</p>\n<p>He, in whose bosom thought on thought shoots out,</p>\n<p>Still of his aim is wide, in that the one</p>\n<p>Sicklies and wastes to nought the other&rsquo;s strength.&rdquo;</p>\n<p class="slindent">What other could I answer save &ldquo;I come?&rdquo;</p>\n<p>I said it, somewhat with that colour ting&rsquo;d</p>\n<p>Which ofttimes pardon meriteth for man.</p>\n<p class="slindent">Meanwhile traverse along the hill there came,</p>\n<p>A little way before us, some who sang</p>\n<p>The &ldquo;Miserere&rdquo; in responsive Strains.</p>\n<p>When they perceiv&rsquo;d that through my body I</p>\n<p>Gave way not for the rays to pass, their song</p>\n<p>Straight to a long and hoarse exclaim they chang&rsquo;d;</p>\n<p>And two of them, in guise of messengers,</p>\n<p>Ran on to meet us, and inquiring ask&rsquo;d:</p>\n<p>Of your condition we would gladly learn.&rdquo;</p>\n<p class="slindent">To them my guide. &ldquo;Ye may return, and bear</p>\n<p>Tidings to them who sent you, that his frame</p>\n<p>Is real flesh. If, as I deem, to view</p>\n<p>His shade they paus&rsquo;d, enough is answer&rsquo;d them.</p>\n<p>Him let them honour, they may prize him well.&rdquo;</p>\n<p class="slindent">Ne&rsquo;er saw I fiery vapours with such speed</p>\n<p>Cut through the serene air at fall of night,</p>\n<p>Nor August&rsquo;s clouds athwart the setting sun,</p>\n<p>That upward these did not in shorter space</p>\n<p>Return; and, there arriving, with the rest</p>\n<p>Wheel back on us, as with loose rein a troop.</p>\n<p class="slindent">&ldquo;Many,&rdquo; exclaim&rsquo;d the bard, &ldquo;are these, who throng</p>\n<p>Around us: to petition thee they come.</p>\n<p>Go therefore on, and listen as thou go&rsquo;st.&rdquo;</p>\n<p class="slindent">&ldquo;O spirit! who go&rsquo;st on to blessedness</p>\n<p>With the same limbs, that clad thee at thy birth.&rdquo;</p>\n<p>Shouting they came, &ldquo;a little rest thy step.</p>\n<p>Look if thou any one amongst our tribe</p>\n<p>Hast e&rsquo;er beheld, that tidings of him there</p>\n<p>Thou mayst report. Ah, wherefore go&rsquo;st thou on?</p>\n<p>Ah wherefore tarriest thou not? We all</p>\n<p>By violence died, and to our latest hour</p>\n<p>Were sinners, but then warn&rsquo;d by light from heav&rsquo;n,</p>\n<p>So that, repenting and forgiving, we</p>\n<p>Did issue out of life at peace with God,</p>\n<p>Who with desire to see him fills our heart.&rdquo;</p>\n<p class="slindent">Then I: &ldquo;The visages of all I scan</p>\n<p>Yet none of ye remember. But if aught,</p>\n<p>That I can do, may please you, gentle spirits!</p>\n<p>Speak; and I will perform it, by that peace,</p>\n<p>Which on the steps of guide so excellent</p>\n<p>Following from world to world intent I seek.&rdquo;</p>\n<p class="slindent">In answer he began: &ldquo;None here distrusts</p>\n<p>Thy kindness, though not promis&rsquo;d with an oath;</p>\n<p>So as the will fail not for want of power.</p>\n<p>Whence I, who sole before the others speak,</p>\n<p>Entreat thee, if thou ever see that land,</p>\n<p>Which lies between Romagna and the realm</p>\n<p>Of Charles, that of thy courtesy thou pray</p>\n<p>Those who inhabit Fano, that for me</p>\n<p>Their adorations duly be put up,</p>\n<p>By which I may purge off my grievous sins.</p>\n<p>From thence I came. But the deep passages,</p>\n<p>Whence issued out the blood wherein I dwelt,</p>\n<p>Upon my bosom in Antenor&rsquo;s land</p>\n<p>Were made, where to be more secure I thought.</p>\n<p>The author of the deed was Este&rsquo;s prince,</p>\n<p>Who, more than right could warrant, with his wrath</p>\n<p>Pursued me. Had I towards Mira fled,</p>\n<p>When overta&rsquo;en at Oriaco, still</p>\n<p>Might I have breath&rsquo;d. But to the marsh I sped,</p>\n<p>And in the mire and rushes tangled there</p>\n<p>Fell, and beheld my life-blood float the plain.&rdquo;</p>\n<p class="slindent">Then said another: &ldquo;Ah! so may the wish,</p>\n<p>That takes thee o&rsquo;er the mountain, be fulfill&rsquo;d,</p>\n<p>As thou shalt graciously give aid to mine.</p>\n<p>Of Montefeltro I; Buonconte I:</p>\n<p>Giovanna nor none else have care for me,</p>\n<p>Sorrowing with these I therefore go.&rdquo; I thus:</p>\n<p>&ldquo;From Campaldino&rsquo;s field what force or chance</p>\n<p>Drew thee, that ne&rsquo;er thy sepulture was known?&rdquo;</p>\n<p class="slindent">&ldquo;Oh!&rdquo; answer&rsquo;d he, &ldquo;at Casentino&rsquo;s foot</p>\n<p>A stream there courseth, nam&rsquo;d Archiano, sprung</p>\n<p>In Apennine above the Hermit&rsquo;s seat.</p>\n<p>E&rsquo;en where its name is cancel&rsquo;d, there came I,</p>\n<p>Pierc&rsquo;d in the heart, fleeing away on foot,</p>\n<p>And bloodying the plain. Here sight and speech</p>\n<p>Fail&rsquo;d me, and finishing with Mary&rsquo;s name</p>\n<p>I fell, and tenantless my flesh remain&rsquo;d.</p>\n<p>I will report the truth; which thou again0</p>\n<p>Tell to the living. Me God&rsquo;s angel took,</p>\n<p>Whilst he of hell exclaim&rsquo;d: &ldquo;O thou from heav&rsquo;n!</p>\n<p>Say wherefore hast thou robb&rsquo;d me? Thou of him</p>\n<p>Th&rsquo; eternal portion bear&rsquo;st with thee away</p>\n<p>For one poor tear that he deprives me of.</p>\n<p>But of the other, other rule I make.&rdquo;</p>\n<p class="slindent">&ldquo;Thou knowest how in the atmosphere collects</p>\n<p>That vapour dank, returning into water,</p>\n<p>Soon as it mounts where cold condenses it.</p>\n<p>That evil will, which in his intellect</p>\n<p>Still follows evil, came, and rais&rsquo;d the wind</p>\n<p>And smoky mist, by virtue of the power</p>\n<p>Given by his nature. Thence the valley, soon</p>\n<p>As day was spent, he cover&rsquo;d o&rsquo;er with cloud</p>\n<p>From Pratomagno to the mountain range,</p>\n<p>And stretch&rsquo;d the sky above, so that the air</p>\n<p>Impregnate chang&rsquo;d to water. Fell the rain,</p>\n<p>And to the fosses came all that the land</p>\n<p>Contain&rsquo;d not; and, as mightiest streams are wont,</p>\n<p>To the great river with such headlong sweep</p>\n<p>Rush&rsquo;d, that nought stay&rsquo;d its course. My stiffen&rsquo;d frame</p>\n<p>Laid at his mouth the fell Archiano found,</p>\n<p>And dash&rsquo;d it into Arno, from my breast</p>\n<p>Loos&rsquo;ning the cross, that of myself I made</p>\n<p>When overcome with pain. He hurl&rsquo;d me on,</p>\n<p>Along the banks and bottom of his course;</p>\n<p>Then in his muddy spoils encircling wrapt.&rdquo;</p>\n<p class="slindent">&ldquo;Ah! when thou to the world shalt be return&rsquo;d,</p>\n<p>And rested after thy long road,&rdquo; so spake</p>\n<p>Next the third spirit; &ldquo;then remember me.</p>\n<p>I once was Pia. Sienna gave me life,</p>\n<p>Maremma took it from me. That he knows,</p>\n<p>Who me with jewell&rsquo;d ring had first espous&rsquo;d.&rdquo;</p>\n</div>','<p class="cantohead">Canto VI</p>\n<div class="stanza"><p>When from their game of dice men separate,</p>\n<p>He, who hath lost, remains in sadness fix&rsquo;d,</p>\n<p>Revolving in his mind, what luckless throws</p>\n<p>He cast: but meanwhile all the company</p>\n<p>Go with the other; one before him runs,</p>\n<p>And one behind his mantle twitches, one</p>\n<p>Fast by his side bids him remember him.</p>\n<p>He stops not; and each one, to whom his hand</p>\n<p>Is stretch&rsquo;d, well knows he bids him stand aside;</p>\n<p>And thus he from the press defends himself.</p>\n<p>E&rsquo;en such was I in that close-crowding throng;</p>\n<p>And turning so my face around to all,</p>\n<p>And promising, I &rsquo;scap&rsquo;d from it with pains.</p>\n<p class="slindent">Here of Arezzo him I saw, who fell</p>\n<p>By Ghino&rsquo;s cruel arm; and him beside,</p>\n<p>Who in his chase was swallow&rsquo;d by the stream.</p>\n<p>Here Frederic Novello, with his hand</p>\n<p>Stretch&rsquo;d forth, entreated; and of Pisa he,</p>\n<p>Who put the good Marzuco to such proof</p>\n<p>Of constancy. Count Orso I beheld;</p>\n<p>And from its frame a soul dismiss&rsquo;d for spite</p>\n<p>And envy, as it said, but for no crime:</p>\n<p>I speak of Peter de la Brosse; and here,</p>\n<p>While she yet lives, that Lady of Brabant</p>\n<p>Let her beware; lest for so false a deed</p>\n<p>She herd with worse than these. When I was freed</p>\n<p>From all those spirits, who pray&rsquo;d for others&rsquo; prayers</p>\n<p>To hasten on their state of blessedness;</p>\n<p>Straight I began: &ldquo;O thou, my luminary!</p>\n<p>It seems expressly in thy text denied,</p>\n<p>That heaven&rsquo;s supreme decree can never bend</p>\n<p>To supplication; yet with this design</p>\n<p>Do these entreat. Can then their hope be vain,</p>\n<p>Or is thy saying not to me reveal&rsquo;d?&rdquo;</p>\n<p class="slindent">He thus to me: &ldquo;Both what I write is plain,</p>\n<p>And these deceiv&rsquo;d not in their hope, if well</p>\n<p>Thy mind consider, that the sacred height</p>\n<p>Of judgment doth not stoop, because love&rsquo;s flame</p>\n<p>In a short moment all fulfils, which he</p>\n<p>Who sojourns here, in right should satisfy.</p>\n<p>Besides, when I this point concluded thus,</p>\n<p>By praying no defect could be supplied;</p>\n<p>Because the pray&rsquo;r had none access to God.</p>\n<p>Yet in this deep suspicion rest thou not</p>\n<p>Contented unless she assure thee so,</p>\n<p>Who betwixt truth and mind infuses light.</p>\n<p>I know not if thou take me right; I mean</p>\n<p>Beatrice. Her thou shalt behold above,</p>\n<p>Upon this mountain&rsquo;s crown, fair seat of joy.&rdquo;</p>\n<p class="slindent">Then I: &ldquo;Sir! let us mend our speed; for now</p>\n<p>I tire not as before; and lo! the hill</p>\n<p>Stretches its shadow far.&rdquo; He answer&rsquo;d thus:</p>\n<p>&ldquo;Our progress with this day shall be as much</p>\n<p>As we may now dispatch; but otherwise</p>\n<p>Than thou supposest is the truth. For there</p>\n<p>Thou canst not be, ere thou once more behold</p>\n<p>Him back returning, who behind the steep</p>\n<p>Is now so hidden, that as erst his beam</p>\n<p>Thou dost not break. But lo! a spirit there</p>\n<p>Stands solitary, and toward us looks:</p>\n<p>It will instruct us in the speediest way.&rdquo;</p>\n<p class="slindent">We soon approach&rsquo;d it. O thou Lombard spirit!</p>\n<p>How didst thou stand, in high abstracted mood,</p>\n<p>Scarce moving with slow dignity thine eyes!</p>\n<p>It spoke not aught, but let us onward pass,</p>\n<p>Eyeing us as a lion on his watch.</p>\n<p>I3ut Virgil with entreaty mild advanc&rsquo;d,</p>\n<p>Requesting it to show the best ascent.</p>\n<p>It answer to his question none return&rsquo;d,</p>\n<p>But of our country and our kind of life</p>\n<p>Demanded. When my courteous guide began,</p>\n<p>&ldquo;Mantua,&rdquo; the solitary shadow quick</p>\n<p>Rose towards us from the place in which it stood,</p>\n<p>And cry&rsquo;d, &ldquo;Mantuan! I am thy countryman</p>\n<p>Sordello.&rdquo; Each the other then embrac&rsquo;d.</p>\n<p class="slindent">Ah slavish Italy! thou inn of grief,</p>\n<p>Vessel without a pilot in loud storm,</p>\n<p>Lady no longer of fair provinces,</p>\n<p>But brothel-house impure! this gentle spirit,</p>\n<p>Ev&rsquo;n from the Pleasant sound of his dear land</p>\n<p>Was prompt to greet a fellow citizen</p>\n<p>With such glad cheer; while now thy living ones</p>\n<p>In thee abide not without war; and one</p>\n<p>Malicious gnaws another, ay of those</p>\n<p>Whom the same wall and the same moat contains,</p>\n<p>Seek, wretched one! around thy sea-coasts wide;</p>\n<p>Then homeward to thy bosom turn, and mark</p>\n<p>If any part of the sweet peace enjoy.</p>\n<p>What boots it, that thy reins Justinian&rsquo;s hand</p>\n<p>Befitted, if thy saddle be unpress&rsquo;d?</p>\n<p>Nought doth he now but aggravate thy shame.</p>\n<p>Ah people! thou obedient still shouldst live,</p>\n<p>And in the saddle let thy Caesar sit,</p>\n<p>If well thou marked&rsquo;st that which God commands</p>\n<p class="slindent">Look how that beast to felness hath relaps&rsquo;d</p>\n<p>From having lost correction of the spur,</p>\n<p>Since to the bridle thou hast set thine hand,</p>\n<p>O German Albert! who abandon&rsquo;st her,</p>\n<p>That is grown savage and unmanageable,</p>\n<p>When thou should&rsquo;st clasp her flanks with forked heels.</p>\n<p>Just judgment from the stars fall on thy blood!</p>\n<p>And be it strange and manifest to all!</p>\n<p>Such as may strike thy successor with dread!</p>\n<p>For that thy sire and thou have suffer&rsquo;d thus,</p>\n<p>Through greediness of yonder realms detain&rsquo;d,</p>\n<p>The garden of the empire to run waste.</p>\n<p>Come see the Capulets and Montagues,</p>\n<p>The Philippeschi and Monaldi! man</p>\n<p>Who car&rsquo;st for nought! those sunk in grief, and these</p>\n<p>With dire suspicion rack&rsquo;d. Come, cruel one!</p>\n<p>Come and behold the&rsquo; oppression of the nobles,</p>\n<p>And mark their injuries: and thou mayst see.</p>\n<p>What safety Santafiore can supply.</p>\n<p>Come and behold thy Rome, who calls on thee,</p>\n<p>Desolate widow! day and night with moans:</p>\n<p>&ldquo;My Caesar, why dost thou desert my side?&rdquo;</p>\n<p>Come and behold what love among thy people:</p>\n<p>And if no pity touches thee for us,</p>\n<p>Come and blush for thine own report. For me,</p>\n<p>If it be lawful, O Almighty Power,</p>\n<p>Who wast in earth for our sakes crucified!</p>\n<p>Are thy just eyes turn&rsquo;d elsewhere? or is this</p>\n<p>A preparation in the wond&rsquo;rous depth</p>\n<p>Of thy sage counsel made, for some good end,</p>\n<p>Entirely from our reach of thought cut off?</p>\n<p>So are the&rsquo; Italian cities all o&rsquo;erthrong&rsquo;d</p>\n<p>With tyrants, and a great Marcellus made</p>\n<p>Of every petty factious villager.</p>\n<p class="slindent">My Florence! thou mayst well remain unmov&rsquo;d</p>\n<p>At this digression, which affects not thee:</p>\n<p>Thanks to thy people, who so wisely speed.</p>\n<p>Many have justice in their heart, that long</p>\n<p>Waiteth for counsel to direct the bow,</p>\n<p>Or ere it dart unto its aim: but shine</p>\n<p>Have it on their lip&rsquo;s edge. Many refuse</p>\n<p>To bear the common burdens: readier thine</p>\n<p>Answer uneall&rsquo;d, and cry, &ldquo;Behold I stoop!&rdquo;</p>\n<p class="slindent">Make thyself glad, for thou hast reason now,</p>\n<p>Thou wealthy! thou at peace! thou wisdom-fraught!</p>\n<p>Facts best witness if I speak the truth.</p>\n<p>Athens and Lacedaemon, who of old</p>\n<p>Enacted laws, for civil arts renown&rsquo;d,</p>\n<p>Made little progress in improving life</p>\n<p>Tow&rsquo;rds thee, who usest such nice subtlety,</p>\n<p>That to the middle of November scarce</p>\n<p>Reaches the thread thou in October weav&rsquo;st.</p>\n<p>How many times, within thy memory,</p>\n<p>Customs, and laws, and coins, and offices</p>\n<p>Have been by thee renew&rsquo;d, and people chang&rsquo;d!</p>\n<p class="slindent">If thou remember&rsquo;st well and can&rsquo;st see clear,</p>\n<p>Thou wilt perceive thyself like a sick wretch,</p>\n<p>Who finds no rest upon her down, hut oft</p>\n<p>Shifting her side, short respite seeks from pain.</p>\n</div>','<p class="cantohead">Canto VII</p>\n<div class="stanza"><p>After their courteous greetings joyfully</p>\n<p>Sev&rsquo;n times exchang&rsquo;d, Sordello backward drew</p>\n<p>Exclaiming, &ldquo;Who are ye?&rdquo; &ldquo;Before this mount</p>\n<p>By spirits worthy of ascent to God</p>\n<p>Was sought, my bones had by Octavius&rsquo; care</p>\n<p>Been buried. I am Virgil, for no sin</p>\n<p>Depriv&rsquo;d of heav&rsquo;n, except for lack of faith.&rdquo;</p>\n<p class="slindent">So answer&rsquo;d him in few my gentle guide.</p>\n<p class="slindent">As one, who aught before him suddenly</p>\n<p>Beholding, whence his wonder riseth, cries</p>\n<p>&ldquo;It is yet is not,&rdquo; wav&rsquo;ring in belief;</p>\n<p>Such he appear&rsquo;d; then downward bent his eyes,</p>\n<p>And drawing near with reverential step,</p>\n<p>Caught him, where of mean estate might clasp</p>\n<p>His lord. &ldquo;Glory of Latium!&rdquo; he exclaim&rsquo;d,</p>\n<p>&ldquo;In whom our tongue its utmost power display&rsquo;d!</p>\n<p>Boast of my honor&rsquo;d birth-place! what desert</p>\n<p>Of mine, what favour rather undeserv&rsquo;d,</p>\n<p>Shows thee to me? If I to hear that voice</p>\n<p>Am worthy, say if from below thou com&rsquo;st</p>\n<p>And from what cloister&rsquo;s pale?&rdquo;&mdash;&ldquo;Through every orb</p>\n<p>Of that sad region,&rdquo; he reply&rsquo;d, &ldquo;thus far</p>\n<p>Am I arriv&rsquo;d, by heav&rsquo;nly influence led</p>\n<p>And with such aid I come. There is a place</p>\n<p>There underneath, not made by torments sad,</p>\n<p>But by dun shades alone; where mourning&rsquo;s voice</p>\n<p>Sounds not of anguish sharp, but breathes in sighs.</p>\n<p>There I with little innocents abide,</p>\n<p>Who by death&rsquo;s fangs were bitten, ere exempt</p>\n<p>From human taint. There I with those abide,</p>\n<p>Who the three holy virtues put not on,</p>\n<p>But understood the rest, and without blame</p>\n<p>Follow&rsquo;d them all. But if thou know&rsquo;st and canst,</p>\n<p>Direct us, how we soonest may arrive,</p>\n<p>Where Purgatory its true beginning takes.&rdquo;</p>\n<p class="slindent">He answer&rsquo;d thus: &ldquo;We have no certain place</p>\n<p>Assign&rsquo;d us: upwards I may go or round,</p>\n<p>Far as I can, I join thee for thy guide.</p>\n<p>But thou beholdest now how day declines:</p>\n<p>And upwards to proceed by night, our power</p>\n<p>Excels: therefore it may be well to choose</p>\n<p>A place of pleasant sojourn. To the right</p>\n<p>Some spirits sit apart retir&rsquo;d. If thou</p>\n<p>Consentest, I to these will lead thy steps:</p>\n<p>And thou wilt know them, not without delight.&rdquo;</p>\n<p class="slindent">&ldquo;How chances this?&rdquo; was answer&rsquo;d; &ldquo;who so wish&rsquo;d</p>\n<p>To ascend by night, would he be thence debarr&rsquo;d</p>\n<p>By other, or through his own weakness fail?&rdquo;</p>\n<p class="slindent">The good Sordello then, along the ground</p>\n<p>Trailing his finger, spoke: &ldquo;Only this line</p>\n<p>Thou shalt not overpass, soon as the sun</p>\n<p>Hath disappear&rsquo;d; not that aught else impedes</p>\n<p>Thy going upwards, save the shades of night.</p>\n<p>These with the wont of power perplex the will.</p>\n<p>With them thou haply mightst return beneath,</p>\n<p>Or to and fro around the mountain&rsquo;s side</p>\n<p>Wander, while day is in the horizon shut.&rdquo;</p>\n<p class="slindent">My master straight, as wond&rsquo;ring at his speech,</p>\n<p>Exclaim&rsquo;d: &ldquo;Then lead us quickly, where thou sayst,</p>\n<p>That, while we stay, we may enjoy delight.&rdquo;</p>\n<p class="slindent">A little space we were remov&rsquo;d from thence,</p>\n<p>When I perceiv&rsquo;d the mountain hollow&rsquo;d out.</p>\n<p>Ev&rsquo;n as large valleys hollow&rsquo;d out on earth,</p>\n<p class="slindent">&ldquo;That way,&rdquo; the&rsquo; escorting spirit cried, &ldquo;we go,</p>\n<p>Where in a bosom the high bank recedes:</p>\n<p>And thou await renewal of the day.&rdquo;</p>\n<p class="slindent">Betwixt the steep and plain a crooked path</p>\n<p>Led us traverse into the ridge&rsquo;s side,</p>\n<p>Where more than half the sloping edge expires.</p>\n<p>Refulgent gold, and silver thrice refin&rsquo;d,</p>\n<p>And scarlet grain and ceruse, Indian wood</p>\n<p>Of lucid dye serene, fresh emeralds</p>\n<p>But newly broken, by the herbs and flowers</p>\n<p>Plac&rsquo;d in that fair recess, in color all</p>\n<p>Had been surpass&rsquo;d, as great surpasses less.</p>\n<p>Nor nature only there lavish&rsquo;d her hues,</p>\n<p>But of the sweetness of a thousand smells</p>\n<p>A rare and undistinguish&rsquo;d fragrance made.</p>\n<p class="slindent">&ldquo;Salve Regina,&rdquo; on the grass and flowers</p>\n<p>Here chanting I beheld those spirits sit</p>\n<p>Who not beyond the valley could be seen.</p>\n<p class="slindent">&ldquo;Before the west&rsquo;ring sun sink to his bed,&rdquo;</p>\n<p>Began the Mantuan, who our steps had turn&rsquo;d,</p>\n<p class="slindent">&ldquo;&rsquo;Mid those desires not that I lead ye on.</p>\n<p>For from this eminence ye shall discern</p>\n<p>Better the acts and visages of all,</p>\n<p>Than in the nether vale among them mix&rsquo;d.</p>\n<p>He, who sits high above the rest, and seems</p>\n<p>To have neglected that he should have done,</p>\n<p>And to the others&rsquo; song moves not his lip,</p>\n<p>The Emperor Rodolph call, who might have heal&rsquo;d</p>\n<p>The wounds whereof fair Italy hath died,</p>\n<p>So that by others she revives but slowly,</p>\n<p>He, who with kindly visage comforts him,</p>\n<p>Sway&rsquo;d in that country, where the water springs,</p>\n<p>That Moldaw&rsquo;s river to the Elbe, and Elbe</p>\n<p>Rolls to the ocean: Ottocar his name:</p>\n<p>Who in his swaddling clothes was of more worth</p>\n<p>Than Winceslaus his son, a bearded man,</p>\n<p>Pamper&rsquo;d with rank luxuriousness and ease.</p>\n<p>And that one with the nose depress, who close</p>\n<p>In counsel seems with him of gentle look,</p>\n<p>Flying expir&rsquo;d, with&rsquo;ring the lily&rsquo;s flower.</p>\n<p>Look there how he doth knock against his breast!</p>\n<p>The other ye behold, who for his cheek</p>\n<p>Makes of one hand a couch, with frequent sighs.</p>\n<p>They are the father and the father-in-law</p>\n<p>Of Gallia&rsquo;s bane: his vicious life they know</p>\n<p>And foul; thence comes the grief that rends them thus.</p>\n<p class="slindent">&ldquo;He, so robust of limb, who measure keeps</p>\n<p>In song, with him of feature prominent,</p>\n<p>With ev&rsquo;ry virtue bore his girdle brac&rsquo;d.</p>\n<p>And if that stripling who behinds him sits,</p>\n<p>King after him had liv&rsquo;d, his virtue then</p>\n<p>From vessel to like vessel had been pour&rsquo;d;</p>\n<p>Which may not of the other heirs be said.</p>\n<p>By James and Frederick his realms are held;</p>\n<p>Neither the better heritage obtains.</p>\n<p>Rarely into the branches of the tree</p>\n<p>Doth human worth mount up; and so ordains</p>\n<p>He who bestows it, that as his free gift</p>\n<p>It may be call&rsquo;d. To Charles my words apply</p>\n<p>No less than to his brother in the song;</p>\n<p>Which Pouille and Provence now with grief confess.</p>\n<p>So much that plant degenerates from its seed,</p>\n<p>As more than Beatrice and Margaret</p>\n<p>Costanza still boasts of her valorous spouse.</p>\n<p class="slindent">&ldquo;Behold the king of simple life and plain,</p>\n<p>Harry of England, sitting there alone:</p>\n<p>He through his branches better issue spreads.</p>\n<p class="slindent">&ldquo;That one, who on the ground beneath the rest</p>\n<p>Sits lowest, yet his gaze directs aloft,</p>\n<p>Us William, that brave Marquis, for whose cause</p>\n<p>The deed of Alexandria and his war</p>\n<p>Makes Conferrat and Canavese weep.&rdquo;</p>\n</div>','<p class="cantohead">Canto VIII</p>\n<div class="stanza"><p>Now was the hour that wakens fond desire</p>\n<p>In men at sea, and melts their thoughtful heart,</p>\n<p>Who in the morn have bid sweet friends farewell,</p>\n<p>And pilgrim newly on his road with love</p>\n<p>Thrills, if he hear the vesper bell from far,</p>\n<p>That seems to mourn for the expiring day:</p>\n<p>When I, no longer taking heed to hear</p>\n<p>Began, with wonder, from those spirits to mark</p>\n<p>One risen from its seat, which with its hand</p>\n<p>Audience implor&rsquo;d. Both palms it join&rsquo;d and rais&rsquo;d,</p>\n<p>Fixing its steadfast gaze towards the east,</p>\n<p>As telling God, &ldquo;I care for naught beside.&rdquo;</p>\n<p class="slindent">&ldquo;Te Lucis Ante,&rdquo; so devoutly then</p>\n<p>Came from its lip, and in so soft a strain,</p>\n<p>That all my sense in ravishment was lost.</p>\n<p>And the rest after, softly and devout,</p>\n<p>Follow&rsquo;d through all the hymn, with upward gaze</p>\n<p>Directed to the bright supernal wheels.</p>\n<p class="slindent">Here, reader! for the truth makes thine eyes keen:</p>\n<p>For of so subtle texture is this veil,</p>\n<p>That thou with ease mayst pass it through unmark&rsquo;d.</p>\n<p class="slindent">I saw that gentle band silently next</p>\n<p>Look up, as if in expectation held,</p>\n<p>Pale and in lowly guise; and from on high</p>\n<p>I saw forth issuing descend beneath</p>\n<p>Two angels with two flame-illumin&rsquo;d swords,</p>\n<p>Broken and mutilated at their points.</p>\n<p>Green as the tender leaves but newly born,</p>\n<p>Their vesture was, the which by wings as green</p>\n<p>Beaten, they drew behind them, fann&rsquo;d in air.</p>\n<p>A little over us one took his stand,</p>\n<p>The other lighted on the&rsquo; Opposing hill,</p>\n<p>So that the troop were in the midst contain&rsquo;d.</p>\n<p class="slindent">Well I descried the whiteness on their heads;</p>\n<p>But in their visages the dazzled eye</p>\n<p>Was lost, as faculty that by too much</p>\n<p>Is overpower&rsquo;d. &ldquo;From Mary&rsquo;s bosom both</p>\n<p>Are come,&rdquo; exclaim&rsquo;d Sordello, &ldquo;as a guard</p>\n<p>Over the vale, ganst him, who hither tends,</p>\n<p>The serpent.&rdquo; Whence, not knowing by which path</p>\n<p>He came, I turn&rsquo;d me round, and closely press&rsquo;d,</p>\n<p>All frozen, to my leader&rsquo;s trusted side.</p>\n<p class="slindent">Sordello paus&rsquo;d not: &ldquo;To the valley now</p>\n<p>(For it is time) let us descend; and hold</p>\n<p>Converse with those great shadows: haply much</p>\n<p>Their sight may please ye.&rdquo; Only three steps down</p>\n<p>Methinks I measur&rsquo;d, ere I was beneath,</p>\n<p>And noted one who look&rsquo;d as with desire</p>\n<p>To know me. Time was now that air arrow dim;</p>\n<p>Yet not so dim, that &rsquo;twixt his eyes and mine</p>\n<p>It clear&rsquo;d not up what was conceal&rsquo;d before.</p>\n<p>Mutually tow&rsquo;rds each other we advanc&rsquo;d.</p>\n<p>Nino, thou courteous judge! what joy I felt,</p>\n<p>When I perceiv&rsquo;d thou wert not with the bad!</p>\n<p class="slindent">No salutation kind on either part</p>\n<p>Was left unsaid. He then inquir&rsquo;d: &ldquo;How long</p>\n<p>Since thou arrived&rsquo;st at the mountain&rsquo;s foot,</p>\n<p>Over the distant waves?&rdquo; &mdash;&ldquo;O!&rdquo; answer&rsquo;d I,</p>\n<p>&ldquo;Through the sad seats of woe this morn I came,</p>\n<p>And still in my first life, thus journeying on,</p>\n<p>The other strive to gain.&rdquo; Soon as they heard</p>\n<p>My words, he and Sordello backward drew,</p>\n<p>As suddenly amaz&rsquo;d. To Virgil one,</p>\n<p>The other to a spirit turn&rsquo;d, who near</p>\n<p>Was seated, crying: &ldquo;Conrad! up with speed:</p>\n<p>Come, see what of his grace high God hath will&rsquo;d.&rdquo;</p>\n<p>Then turning round to me: &ldquo;By that rare mark</p>\n<p>Of honour which thou ow&rsquo;st to him, who hides</p>\n<p>So deeply his first cause, it hath no ford,</p>\n<p>When thou shalt he beyond the vast of waves.</p>\n<p>Tell my Giovanna, that for me she call</p>\n<p>There, where reply to innocence is made.</p>\n<p>Her mother, I believe, loves me no more;</p>\n<p>Since she has chang&rsquo;d the white and wimpled folds,</p>\n<p>Which she is doom&rsquo;d once more with grief to wish.</p>\n<p>By her it easily may be perceiv&rsquo;d,</p>\n<p>How long in women lasts the flame of love,</p>\n<p>If sight and touch do not relume it oft.</p>\n<p>For her so fair a burial will not make</p>\n<p>The viper which calls Milan to the field,</p>\n<p>As had been made by shrill Gallura&rsquo;s bird.&rdquo;</p>\n<p class="slindent">He spoke, and in his visage took the stamp</p>\n<p>Of that right seal, which with due temperature</p>\n<p>Glows in the bosom. My insatiate eyes</p>\n<p>Meanwhile to heav&rsquo;n had travel&rsquo;d, even there</p>\n<p>Where the bright stars are slowest, as a wheel</p>\n<p>Nearest the axle; when my guide inquir&rsquo;d:</p>\n<p>&ldquo;What there aloft, my son, has caught thy gaze?&rdquo;</p>\n<p class="slindent">I answer&rsquo;d: &ldquo;The three torches, with which here</p>\n<p>The pole is all on fire. &ldquo;He then to me:</p>\n<p>&ldquo;The four resplendent stars, thou saw&rsquo;st this morn</p>\n<p>Are there beneath, and these ris&rsquo;n in their stead.&rdquo;</p>\n<p class="slindent">While yet he spoke. Sordello to himself</p>\n<p>Drew him, and cry&rsquo;d: &ldquo;Lo there our enemy!&rdquo;</p>\n<p>And with his hand pointed that way to look.</p>\n<p class="slindent">Along the side, where barrier none arose</p>\n<p>Around the little vale, a serpent lay,</p>\n<p>Such haply as gave Eve the bitter food.</p>\n<p>Between the grass and flowers, the evil snake</p>\n<p>Came on, reverting oft his lifted head;</p>\n<p>And, as a beast that smoothes its polish&rsquo;d coat,</p>\n<p>Licking his hack. I saw not, nor can tell,</p>\n<p>How those celestial falcons from their seat</p>\n<p>Mov&rsquo;d, but in motion each one well descried,</p>\n<p>Hearing the air cut by their verdant plumes.</p>\n<p>The serpent fled; and to their stations back</p>\n<p>The angels up return&rsquo;d with equal flight.</p>\n<p class="slindent">The Spirit (who to Nino, when he call&rsquo;d,</p>\n<p>Had come), from viewing me with fixed ken,</p>\n<p>Through all that conflict, loosen&rsquo;d not his sight.</p>\n<p class="slindent">&ldquo;So may the lamp, which leads thee up on high,</p>\n<p>Find, in thy destin&rsquo;d lot, of wax so much,</p>\n<p>As may suffice thee to the enamel&rsquo;s height.&rdquo;</p>\n<p>It thus began: &ldquo;If any certain news</p>\n<p>Of Valdimagra and the neighbour part</p>\n<p>Thou know&rsquo;st, tell me, who once was mighty there</p>\n<p>They call&rsquo;d me Conrad Malaspina, not</p>\n<p>That old one, but from him I sprang. The love</p>\n<p>I bore my people is now here refin&rsquo;d.&rdquo;</p>\n<p class="slindent">&ldquo;In your dominions,&rdquo; I answer&rsquo;d, &ldquo;ne&rsquo;er was I.</p>\n<p>But through all Europe where do those men dwell,</p>\n<p>To whom their glory is not manifest?</p>\n<p>The fame, that honours your illustrious house,</p>\n<p>Proclaims the nobles and proclaims the land;</p>\n<p>So that he knows it who was never there.</p>\n<p>I swear to you, so may my upward route</p>\n<p>Prosper! your honour&rsquo;d nation not impairs</p>\n<p>The value of her coffer and her sword.</p>\n<p>Nature and use give her such privilege,</p>\n<p>That while the world is twisted from his course</p>\n<p>By a bad head, she only walks aright,</p>\n<p>And has the evil way in scorn.&rdquo; He then:</p>\n<p>&ldquo;Now pass thee on: sev&rsquo;n times the tired sun</p>\n<p>Revisits not the couch, which with four feet</p>\n<p>The forked Aries covers, ere that kind</p>\n<p>Opinion shall be nail&rsquo;d into thy brain</p>\n<p>With stronger nails than other&rsquo;s speech can drive,</p>\n<p>If the sure course of judgment be not stay&rsquo;d.&rdquo;</p>\n</div>','<p class="cantohead">Canto IX</p>\n<div class="stanza"><p>Now the fair consort of Tithonus old,</p>\n<p>Arisen from her mate&rsquo;s beloved arms,</p>\n<p>Look&rsquo;d palely o&rsquo;er the eastern cliff: her brow,</p>\n<p>Lucent with jewels, glitter&rsquo;d, set in sign</p>\n<p>Of that chill animal, who with his train</p>\n<p>Smites fearful nations: and where then we were,</p>\n<p>Two steps of her ascent the night had past,</p>\n<p>And now the third was closing up its wing,</p>\n<p>When I, who had so much of Adam with me,</p>\n<p>Sank down upon the grass, o&rsquo;ercome with sleep,</p>\n<p>There where all five were seated. In that hour,</p>\n<p>When near the dawn the swallow her sad lay,</p>\n<p>Rememb&rsquo;ring haply ancient grief, renews,</p>\n<p>And with our minds more wand&rsquo;rers from the flesh,</p>\n<p>And less by thought restrain&rsquo;d are, as &rsquo;t were, full</p>\n<p>Of holy divination in their dreams,</p>\n<p>Then in a vision did I seem to view</p>\n<p>A golden-feather&rsquo;d eagle in the sky,</p>\n<p>With open wings, and hov&rsquo;ring for descent,</p>\n<p>And I was in that place, methought, from whence</p>\n<p>Young Ganymede, from his associates &rsquo;reft,</p>\n<p>Was snatch&rsquo;d aloft to the high consistory.</p>\n<p>&ldquo;Perhaps,&rdquo; thought I within me, &ldquo;here alone</p>\n<p>He strikes his quarry, and elsewhere disdains</p>\n<p>To pounce upon the prey.&rdquo; Therewith, it seem&rsquo;d,</p>\n<p>A little wheeling in his airy tour</p>\n<p>Terrible as the lightning rush&rsquo;d he down,</p>\n<p>And snatch&rsquo;d me upward even to the fire.</p>\n<p>There both, I thought, the eagle and myself</p>\n<p>Did burn; and so intense th&rsquo; imagin&rsquo;d flames,</p>\n<p>That needs my sleep was broken off. As erst</p>\n<p>Achilles shook himself, and round him roll&rsquo;d</p>\n<p>His waken&rsquo;d eyeballs wond&rsquo;ring where he was,</p>\n<p>Whenas his mother had from Chiron fled</p>\n<p>To Scyros, with him sleeping in her arms;</p>\n<p>E&rsquo;en thus I shook me, soon as from my face</p>\n<p>The slumber parted, turning deadly pale,</p>\n<p>Like one ice-struck with dread. Solo at my side</p>\n<p>My comfort stood: and the bright sun was now</p>\n<p>More than two hours aloft: and to the sea</p>\n<p>My looks were turn&rsquo;d. &ldquo;Fear not,&rdquo; my master cried,</p>\n<p>&ldquo;Assur&rsquo;d we are at happy point. Thy strength</p>\n<p>Shrink not, but rise dilated. Thou art come</p>\n<p>To Purgatory now. Lo! there the cliff</p>\n<p>That circling bounds it! Lo! the entrance there,</p>\n<p>Where it doth seem disparted! Ere the dawn</p>\n<p>Usher&rsquo;d the daylight, when thy wearied soul</p>\n<p>Slept in thee, o&rsquo;er the flowery vale beneath</p>\n<p>A lady came, and thus bespake me: &ldquo;I</p>\n<p>Am Lucia. Suffer me to take this man,</p>\n<p>Who slumbers. Easier so his way shall speed.&rdquo;</p>\n<p>Sordello and the other gentle shapes</p>\n<p>Tarrying, she bare thee up: and, as day shone,</p>\n<p>This summit reach&rsquo;d: and I pursued her steps.</p>\n<p>Here did she place thee. First her lovely eyes</p>\n<p>That open entrance show&rsquo;d me; then at once</p>\n<p>She vanish&rsquo;d with thy sleep.&rdquo; Like one, whose doubts</p>\n<p>Are chas&rsquo;d by certainty, and terror turn&rsquo;d</p>\n<p>To comfort on discovery of the truth,</p>\n<p>Such was the change in me: and as my guide</p>\n<p>Beheld me fearless, up along the cliff</p>\n<p>He mov&rsquo;d, and I behind him, towards the height.</p>\n<p class="slindent">Reader! thou markest how my theme doth rise,</p>\n<p>Nor wonder therefore, if more artfully</p>\n<p>I prop the structure! Nearer now we drew,</p>\n<p>Arriv&rsquo;d&rsquo; whence in that part, where first a breach</p>\n<p>As of a wall appear&rsquo;d, I could descry</p>\n<p>A portal, and three steps beneath, that led</p>\n<p>For inlet there, of different colour each,</p>\n<p>And one who watch&rsquo;d, but spake not yet a word.</p>\n<p>As more and more mine eye did stretch its view,</p>\n<p>I mark&rsquo;d him seated on the highest step,</p>\n<p>In visage such, as past my power to bear.</p>\n<p>Grasp&rsquo;d in his hand a naked sword, glanc&rsquo;d back</p>\n<p>The rays so toward me, that I oft in vain</p>\n<p>My sight directed. &ldquo;Speak from whence ye stand:&rdquo;</p>\n<p>He cried: &ldquo;What would ye? Where is your escort?</p>\n<p>Take heed your coming upward harm ye not.&rdquo;</p>\n<p class="slindent">&ldquo;A heavenly dame, not skilless of these things,&rdquo;</p>\n<p>Replied the&rsquo; instructor, &ldquo;told us, even now,</p>\n<p>&lsquo;Pass that way: here the gate is.&rdquo;&mdash;&ldquo;And may she</p>\n<p>Befriending prosper your ascent,&rdquo; resum&rsquo;d</p>\n<p>The courteous keeper of the gate: &ldquo;Come then</p>\n<p>Before our steps.&rdquo; We straightway thither came.</p>\n<p class="slindent">The lowest stair was marble white so smooth</p>\n<p>And polish&rsquo;d, that therein my mirror&rsquo;d form</p>\n<p>Distinct I saw. The next of hue more dark</p>\n<p>Than sablest grain, a rough and singed block,</p>\n<p>Crack&rsquo;d lengthwise and across. The third, that lay</p>\n<p>Massy above, seem&rsquo;d porphyry, that flam&rsquo;d</p>\n<p>Red as the life-blood spouting from a vein.</p>\n<p>On this God&rsquo;s angel either foot sustain&rsquo;d,</p>\n<p>Upon the threshold seated, which appear&rsquo;d</p>\n<p>A rock of diamond. Up the trinal steps</p>\n<p>My leader cheerily drew me. &ldquo;Ask,&rdquo; said he,</p>\n<p class="slindent">&ldquo;With humble heart, that he unbar the bolt.&rdquo;</p>\n<p class="slindent">Piously at his holy feet devolv&rsquo;d</p>\n<p>I cast me, praying him for pity&rsquo;s sake</p>\n<p>That he would open to me: but first fell</p>\n<p>Thrice on my bosom prostrate. Seven times0</p>\n<p>The letter, that denotes the inward stain,</p>\n<p>He on my forehead with the blunted point</p>\n<p>Of his drawn sword inscrib&rsquo;d. And &ldquo;Look,&rdquo; he cried,</p>\n<p>&ldquo;When enter&rsquo;d, that thou wash these scars away.&rdquo;</p>\n<p class="slindent">Ashes, or earth ta&rsquo;en dry out of the ground,</p>\n<p>Were of one colour with the robe he wore.</p>\n<p>From underneath that vestment forth he drew</p>\n<p>Two keys of metal twain: the one was gold,</p>\n<p>Its fellow silver. With the pallid first,</p>\n<p>And next the burnish&rsquo;d, he so ply&rsquo;d the gate,</p>\n<p>As to content me well. &ldquo;Whenever one</p>\n<p>Faileth of these, that in the keyhole straight</p>\n<p>It turn not, to this alley then expect</p>\n<p>Access in vain.&rdquo; Such were the words he spake.</p>\n<p>&ldquo;One is more precious: but the other needs</p>\n<p>Skill and sagacity, large share of each,</p>\n<p>Ere its good task to disengage the knot</p>\n<p>Be worthily perform&rsquo;d. From Peter these</p>\n<p>I hold, of him instructed, that I err</p>\n<p>Rather in opening than in keeping fast;</p>\n<p>So but the suppliant at my feet implore.&rdquo;</p>\n<p class="slindent">Then of that hallow&rsquo;d gate he thrust the door,</p>\n<p>Exclaiming, &ldquo;Enter, but this warning hear:</p>\n<p>He forth again departs who looks behind.&rdquo;</p>\n<p class="slindent">As in the hinges of that sacred ward</p>\n<p>The swivels turn&rsquo;d, sonorous metal strong,</p>\n<p>Harsh was the grating; nor so surlily</p>\n<p>Roar&rsquo;d the Tarpeian, when by force bereft</p>\n<p>Of good Metellus, thenceforth from his loss</p>\n<p>To leanness doom&rsquo;d. Attentively I turn&rsquo;d,</p>\n<p>List&rsquo;ning the thunder, that first issued forth;</p>\n<p>And &ldquo;We praise thee, O God,&rdquo; methought I heard</p>\n<p>In accents blended with sweet melody.</p>\n<p>The strains came o&rsquo;er mine ear, e&rsquo;en as the sound</p>\n<p>Of choral voices, that in solemn chant</p>\n<p>With organ mingle, and, now high and clear,</p>\n<p>Come swelling, now float indistinct away.</p>\n</div>','<p class="cantohead">Canto X</p>\n<div class="stanza"><p>When we had passed the threshold of the gate</p>\n<p>(Which the soul&rsquo;s ill affection doth disuse,</p>\n<p>Making the crooked seem the straighter path),</p>\n<p>I heard its closing sound. Had mine eyes turn&rsquo;d,</p>\n<p>For that offence what plea might have avail&rsquo;d?</p>\n<p class="slindent">We mounted up the riven rock, that wound</p>\n<p>On either side alternate, as the wave</p>\n<p>Flies and advances. &ldquo;Here some little art</p>\n<p>Behooves us,&rdquo; said my leader, &ldquo;that our steps</p>\n<p>Observe the varying flexure of the path.&rdquo;</p>\n<p class="slindent">Thus we so slowly sped, that with cleft orb</p>\n<p>The moon once more o&rsquo;erhangs her wat&rsquo;ry couch,</p>\n<p>Ere we that strait have threaded. But when free</p>\n<p>We came and open, where the mount above</p>\n<p>One solid mass retires, I spent, with toil,</p>\n<p>And both, uncertain of the way, we stood,</p>\n<p>Upon a plain more lonesome, than the roads</p>\n<p>That traverse desert wilds. From whence the brink</p>\n<p>Borders upon vacuity, to foot</p>\n<p>Of the steep bank, that rises still, the space</p>\n<p>Had measur&rsquo;d thrice the stature of a man:</p>\n<p>And, distant as mine eye could wing its flight,</p>\n<p>To leftward now and now to right dispatch&rsquo;d,</p>\n<p>That cornice equal in extent appear&rsquo;d.</p>\n<p class="slindent">Not yet our feet had on that summit mov&rsquo;d,</p>\n<p>When I discover&rsquo;d that the bank around,</p>\n<p>Whose proud uprising all ascent denied,</p>\n<p>Was marble white, and so exactly wrought</p>\n<p>With quaintest sculpture, that not there alone</p>\n<p>Had Polycletus, but e&rsquo;en nature&rsquo;s self</p>\n<p>Been sham&rsquo;d. The angel who came down to earth</p>\n<p>With tidings of the peace so many years</p>\n<p>Wept for in vain, that op&rsquo;d the heavenly gates</p>\n<p>From their long interdict) before us seem&rsquo;d,</p>\n<p>In a sweet act, so sculptur&rsquo;d to the life,</p>\n<p>He look&rsquo;d no silent image. One had sworn</p>\n<p>He had said, &ldquo;Hail!&rdquo; for she was imag&rsquo;d there,</p>\n<p>By whom the key did open to God&rsquo;s love,</p>\n<p>And in her act as sensibly impress</p>\n<p>That word, &ldquo;Behold the handmaid of the Lord,&rdquo;</p>\n<p>As figure seal&rsquo;d on wax. &ldquo;Fix not thy mind</p>\n<p>On one place only,&rdquo; said the guide belov&rsquo;d,</p>\n<p>Who had me near him on that part where lies</p>\n<p>The heart of man. My sight forthwith I turn&rsquo;d</p>\n<p>And mark&rsquo;d, behind the virgin mother&rsquo;s form,</p>\n<p>Upon that side, where he, that mov&rsquo;d me, stood,</p>\n<p>Another story graven on the rock.</p>\n<p class="slindent">I passed athwart the bard, and drew me near,</p>\n<p>That it might stand more aptly for my view.</p>\n<p>There in the self-same marble were engrav&rsquo;d</p>\n<p>The cart and kine, drawing the sacred ark,</p>\n<p>That from unbidden office awes mankind.</p>\n<p>Before it came much people; and the whole</p>\n<p>Parted in seven quires. One sense cried, &ldquo;Nay,&rdquo;</p>\n<p>Another, &ldquo;Yes, they sing.&rdquo; Like doubt arose</p>\n<p>Betwixt the eye and smell, from the curl&rsquo;d fume</p>\n<p>Of incense breathing up the well-wrought toil.</p>\n<p>Preceding the blest vessel, onward came</p>\n<p>With light dance leaping, girt in humble guise,</p>\n<p>Sweet Israel&rsquo;s harper: in that hap he seem&rsquo;d</p>\n<p>Less and yet more than kingly. Opposite,</p>\n<p>At a great palace, from the lattice forth</p>\n<p>Look&rsquo;d Michol, like a lady full of scorn</p>\n<p>And sorrow. To behold the tablet next,</p>\n<p>Which at the hack of Michol whitely shone,</p>\n<p>I mov&rsquo;d me. There was storied on the rock</p>\n<p>The&rsquo; exalted glory of the Roman prince,</p>\n<p>Whose mighty worth mov&rsquo;d Gregory to earn</p>\n<p>His mighty conquest, Trajan th&rsquo; Emperor.</p>\n<p>A widow at his bridle stood, attir&rsquo;d</p>\n<p>In tears and mourning. Round about them troop&rsquo;d</p>\n<p>Full throng of knights, and overhead in gold</p>\n<p>The eagles floated, struggling with the wind.</p>\n<p>The wretch appear&rsquo;d amid all these to say:</p>\n<p>&ldquo;Grant vengeance, sire! for, woe beshrew this heart</p>\n<p>My son is murder&rsquo;d.&rdquo; He replying seem&rsquo;d;</p>\n<p class="slindent">&ldquo;Wait now till I return.&rdquo; And she, as one</p>\n<p>Made hasty by her grief; &ldquo;O sire, if thou</p>\n<p>Dost not return?&rdquo;&mdash;&ldquo;Where I am, who then is,</p>\n<p>May right thee.&rdquo;&mdash;&ldquo; What to thee is other&rsquo;s good,</p>\n<p>If thou neglect thy own?&rdquo;&mdash;&ldquo;Now comfort thee,&rdquo;</p>\n<p>At length he answers. &ldquo;It beseemeth well</p>\n<p>My duty be perform&rsquo;d, ere I move hence:</p>\n<p>So justice wills; and pity bids me stay.&rdquo;</p>\n<p class="slindent">He, whose ken nothing new surveys, produc&rsquo;d</p>\n<p>That visible speaking, new to us and strange</p>\n<p>The like not found on earth. Fondly I gaz&rsquo;d</p>\n<p>Upon those patterns of meek humbleness,</p>\n<p>Shapes yet more precious for their artist&rsquo;s sake,</p>\n<p>When &ldquo;Lo,&rdquo; the poet whisper&rsquo;d, &ldquo;where this way</p>\n<p>(But slack their pace), a multitude advance.</p>\n<p>These to the lofty steps shall guide us on.&rdquo;</p>\n<p class="slindent">Mine eyes, though bent on view of novel sights</p>\n<p>Their lov&rsquo;d allurement, were not slow to turn.</p>\n<p class="slindent">Reader! I would not that amaz&rsquo;d thou miss</p>\n<p>Of thy good purpose, hearing how just God</p>\n<p>Decrees our debts be cancel&rsquo;d. Ponder not</p>\n<p>The form of suff&rsquo;ring. Think on what succeeds,</p>\n<p>Think that at worst beyond the mighty doom</p>\n<p>It cannot pass. &ldquo;Instructor,&rdquo; I began,</p>\n<p>&ldquo;What I see hither tending, bears no trace</p>\n<p>Of human semblance, nor of aught beside</p>\n<p>That my foil&rsquo;d sight can guess.&rdquo; He answering thus:</p>\n<p>&ldquo;So courb&rsquo;d to earth, beneath their heavy teems</p>\n<p>Of torment stoop they, that mine eye at first</p>\n<p>Struggled as thine. But look intently thither,</p>\n<p>An disentangle with thy lab&rsquo;ring view,</p>\n<p>What underneath those stones approacheth: now,</p>\n<p>E&rsquo;en now, mayst thou discern the pangs of each.&rdquo;</p>\n<p class="slindent">Christians and proud! O poor and wretched ones!</p>\n<p>That feeble in the mind&rsquo;s eye, lean your trust</p>\n<p>Upon unstaid perverseness! Know ye not</p>\n<p>That we are worms, yet made at last to form</p>\n<p>The winged insect, imp&rsquo;d with angel plumes</p>\n<p>That to heaven&rsquo;s justice unobstructed soars?</p>\n<p>Why buoy ye up aloft your unfleg&rsquo;d souls?</p>\n<p>Abortive then and shapeless ye remain,</p>\n<p>Like the untimely embryon of a worm!</p>\n<p class="slindent">As, to support incumbent floor or roof,</p>\n<p>For corbel is a figure sometimes seen,</p>\n<p>That crumples up its knees unto its breast,</p>\n<p>With the feign&rsquo;d posture stirring ruth unfeign&rsquo;d</p>\n<p>In the beholder&rsquo;s fancy; so I saw</p>\n<p>These fashion&rsquo;d, when I noted well their guise.</p>\n<p class="slindent">Each, as his back was laden, came indeed</p>\n<p>Or more or less contract; but it appear&rsquo;d</p>\n<p>As he, who show&rsquo;d most patience in his look,</p>\n<p>Wailing exclaim&rsquo;d: &ldquo;I can endure no more.&rdquo;</p>\n</div>','<p class="cantohead">Canto XI</p>\n<div class="stanza"><p>O thou Almighty Father, who dost make</p>\n<p>The heavens thy dwelling, not in bounds confin&rsquo;d,</p>\n<p>But that with love intenser there thou view&rsquo;st</p>\n<p>Thy primal effluence, hallow&rsquo;d be thy name:</p>\n<p>Join each created being to extol</p>\n<p>Thy might, for worthy humblest thanks and praise</p>\n<p>Is thy blest Spirit. May thy kingdom&rsquo;s peace</p>\n<p>Come unto us; for we, unless it come,</p>\n<p>With all our striving thither tend in vain.</p>\n<p>As of their will the angels unto thee</p>\n<p>Tender meet sacrifice, circling thy throne</p>\n<p>With loud hosannas, so of theirs be done</p>\n<p>By saintly men on earth. Grant us this day</p>\n<p>Our daily manna, without which he roams</p>\n<p>Through this rough desert retrograde, who most</p>\n<p>Toils to advance his steps. As we to each</p>\n<p>Pardon the evil done us, pardon thou</p>\n<p>Benign, and of our merit take no count.</p>\n<p>&rsquo;Gainst the old adversary prove thou not</p>\n<p>Our virtue easily subdu&rsquo;d; but free</p>\n<p>From his incitements and defeat his wiles.</p>\n<p>This last petition, dearest Lord! is made</p>\n<p>Not for ourselves, since that were needless now,</p>\n<p>But for their sakes who after us remain.&rdquo;</p>\n<p class="slindent">Thus for themselves and us good speed imploring,</p>\n<p>Those spirits went beneath a weight like that</p>\n<p>We sometimes feel in dreams, all, sore beset,</p>\n<p>But with unequal anguish, wearied all,</p>\n<p>Round the first circuit, purging as they go,</p>\n<p>The world&rsquo;s gross darkness off: In our behalf</p>\n<p>If there vows still be offer&rsquo;d, what can here</p>\n<p>For them be vow&rsquo;d and done by such, whose wills</p>\n<p>Have root of goodness in them? Well beseems</p>\n<p>That we should help them wash away the stains</p>\n<p>They carried hence, that so made pure and light,</p>\n<p>They may spring upward to the starry spheres.</p>\n<p class="slindent">&ldquo;Ah! so may mercy-temper&rsquo;d justice rid</p>\n<p>Your burdens speedily, that ye have power</p>\n<p>To stretch your wing, which e&rsquo;en to your desire</p>\n<p>Shall lift you, as ye show us on which hand</p>\n<p>Toward the ladder leads the shortest way.</p>\n<p>And if there be more passages than one,</p>\n<p>Instruct us of that easiest to ascend;</p>\n<p>For this man who comes with me, and bears yet</p>\n<p>The charge of fleshly raiment Adam left him,</p>\n<p>Despite his better will but slowly mounts.&rdquo;</p>\n<p>From whom the answer came unto these words,</p>\n<p>Which my guide spake, appear&rsquo;d not; but &rsquo;twas said</p>\n<p class="slindent">&ldquo;Along the bank to rightward come with us,</p>\n<p>And ye shall find a pass that mocks not toil</p>\n<p>Of living man to climb: and were it not</p>\n<p>That I am hinder&rsquo;d by the rock, wherewith</p>\n<p>This arrogant neck is tam&rsquo;d, whence needs I stoop</p>\n<p>My visage to the ground, him, who yet lives,</p>\n<p>Whose name thou speak&rsquo;st not him I fain would view.</p>\n<p>To mark if e&rsquo;er I knew him? and to crave</p>\n<p>His pity for the fardel that I bear.</p>\n<p>I was of Latiun, of a Tuscan horn</p>\n<p>A mighty one: Aldobranlesco&rsquo;s name</p>\n<p>My sire&rsquo;s, I know not if ye e&rsquo;er have heard.</p>\n<p>My old blood and forefathers&rsquo; gallant deeds</p>\n<p>Made me so haughty, that I clean forgot</p>\n<p>The common mother, and to such excess,</p>\n<p>Wax&rsquo;d in my scorn of all men, that I fell,</p>\n<p>Fell therefore; by what fate Sienna&rsquo;s sons,</p>\n<p>Each child in Campagnatico, can tell.</p>\n<p>I am Omberto; not me only pride</p>\n<p>Hath injur&rsquo;d, but my kindred all involv&rsquo;d</p>\n<p>In mischief with her. Here my lot ordains</p>\n<p>Under this weight to groan, till I appease</p>\n<p>God&rsquo;s angry justice, since I did it not</p>\n<p>Amongst the living, here amongst the dead.&rdquo;</p>\n<p class="slindent">List&rsquo;ning I bent my visage down: and one</p>\n<p>(Not he who spake) twisted beneath the weight</p>\n<p>That urg&rsquo;d him, saw me, knew me straight, and call&rsquo;d,</p>\n<p>Holding his eyes With difficulty fix&rsquo;d</p>\n<p>Intent upon me, stooping as I went</p>\n<p>Companion of their way. &ldquo;O!&rdquo; I exclaim&rsquo;d,</p>\n<p class="slindent">&ldquo;Art thou not Oderigi, art not thou</p>\n<p>Agobbio&rsquo;s glory, glory of that art</p>\n<p>Which they of Paris call the limmer&rsquo;s skill?&rdquo;</p>\n<p class="slindent">&ldquo;Brother!&rdquo; said he, &ldquo;with tints that gayer smile,</p>\n<p>Bolognian Franco&rsquo;s pencil lines the leaves.</p>\n<p>His all the honour now; mine borrow&rsquo;d light.</p>\n<p>In truth I had not been thus courteous to him,</p>\n<p>The whilst I liv&rsquo;d, through eagerness of zeal</p>\n<p>For that pre-eminence my heart was bent on.</p>\n<p>Here of such pride the forfeiture is paid.</p>\n<p>Nor were I even here; if, able still</p>\n<p>To sin, I had not turn&rsquo;d me unto God.</p>\n<p>O powers of man! how vain your glory, nipp&rsquo;d</p>\n<p>E&rsquo;en in its height of verdure, if an age</p>\n<p>Less bright succeed not! Cimabue thought</p>\n<p>To lord it over painting&rsquo;s field; and now</p>\n<p>The cry is Giotto&rsquo;s, and his name eclips&rsquo;d.</p>\n<p>Thus hath one Guido from the other snatch&rsquo;d</p>\n<p>The letter&rsquo;d prize: and he perhaps is born,</p>\n<p>Who shall drive either from their nest. The noise</p>\n<p>Of worldly fame is but a blast of wind,</p>\n<p>That blows from divers points, and shifts its name</p>\n<p>Shifting the point it blows from. Shalt thou more</p>\n<p>Live in the mouths of mankind, if thy flesh</p>\n<p>Part shrivel&rsquo;d from thee, than if thou hadst died,</p>\n<p>Before the coral and the pap were left,</p>\n<p>Or ere some thousand years have passed? and that</p>\n<p>Is, to eternity compar&rsquo;d, a space,</p>\n<p>Briefer than is the twinkling of an eye</p>\n<p>To the heaven&rsquo;s slowest orb. He there who treads</p>\n<p>So leisurely before me, far and wide</p>\n<p>Through Tuscany resounded once; and now</p>\n<p>Is in Sienna scarce with whispers nam&rsquo;d:</p>\n<p>There was he sov&rsquo;reign, when destruction caught</p>\n<p>The madd&rsquo;ning rage of Florence, in that day</p>\n<p>Proud as she now is loathsome. Your renown</p>\n<p>Is as the herb, whose hue doth come and go,</p>\n<p>And his might withers it, by whom it sprang</p>\n<p>Crude from the lap of earth.&rdquo; I thus to him:</p>\n<p>&ldquo;True are thy sayings: to my heart they breathe</p>\n<p>The kindly spirit of meekness, and allay</p>\n<p>What tumours rankle there. But who is he</p>\n<p>Of whom thou spak&rsquo;st but now?&rdquo;&mdash;&ldquo;This,&rdquo; he replied,</p>\n<p>&ldquo;Is Provenzano. He is here, because</p>\n<p>He reach&rsquo;d, with grasp presumptuous, at the sway</p>\n<p>Of all Sienna. Thus he still hath gone,</p>\n<p>Thus goeth never-resting, since he died.</p>\n<p>Such is th&rsquo; acquittance render&rsquo;d back of him,</p>\n<p>Who, beyond measure, dar&rsquo;d on earth.&rdquo; I then:</p>\n<p>&ldquo;If soul that to the verge of life delays</p>\n<p>Repentance, linger in that lower space,</p>\n<p>Nor hither mount, unless good prayers befriend,</p>\n<p>How chanc&rsquo;d admittance was vouchsaf&rsquo;d to him?&rdquo;</p>\n<p class="slindent">&ldquo;When at his glory&rsquo;s topmost height,&rdquo; said he,</p>\n<p>&ldquo;Respect of dignity all cast aside,</p>\n<p>Freely He fix&rsquo;d him on Sienna&rsquo;s plain,</p>\n<p>A suitor to redeem his suff&rsquo;ring friend,</p>\n<p>Who languish&rsquo;d in the prison-house of Charles,</p>\n<p>Nor for his sake refus&rsquo;d through every vein</p>\n<p>To tremble. More I will not say; and dark,</p>\n<p>I know, my words are, but thy neighbours soon</p>\n<p>Shall help thee to a comment on the text.</p>\n<p>This is the work, that from these limits freed him.&rdquo;</p>\n</div>','<p class="cantohead">Canto XII</p>\n<div class="stanza"><p>With equal pace as oxen in the yoke,</p>\n<p>I with that laden spirit journey&rsquo;d on</p>\n<p>Long as the mild instructor suffer&rsquo;d me;</p>\n<p>But when he bade me quit him, and proceed</p>\n<p>(For &ldquo;here,&rdquo; said he, &ldquo;behooves with sail and oars</p>\n<p>Each man, as best he may, push on his bar&rdquo;,</p>\n<p>Upright, as one dispos&rsquo;d for speed, I rais&rsquo;d</p>\n<p>My body, still in thought submissive bow&rsquo;d.</p>\n<p class="slindent">I now my leader&rsquo;s track not loth pursued;</p>\n<p>And each had shown how light we far&rsquo;d along</p>\n<p>When thus he warn&rsquo;d me: &ldquo;Bend thine eyesight down:</p>\n<p>For thou to ease the way shall find it good</p>\n<p>To ruminate the bed beneath thy feet.&rdquo;</p>\n<p class="slindent">As in memorial of the buried, drawn</p>\n<p>Upon earth-level tombs, the sculptur&rsquo;d form</p>\n<p>Of what was once, appears (at sight whereof</p>\n<p>Tears often stream forth by remembrance wak&rsquo;d,</p>\n<p>Whose sacred stings the piteous only feel),</p>\n<p>So saw I there, but with more curious skill</p>\n<p>Of portraiture o&rsquo;erwrought, whate&rsquo;er of space</p>\n<p>From forth the mountain stretches. On one part</p>\n<p>Him I beheld, above all creatures erst</p>\n<p>Created noblest, light&rsquo;ning fall from heaven:</p>\n<p>On th&rsquo; other side with bolt celestial pierc&rsquo;d</p>\n<p>Briareus: cumb&rsquo;ring earth he lay through dint</p>\n<p>Of mortal ice-stroke. The Thymbraean god</p>\n<p>With Mars, I saw, and Pallas, round their sire,</p>\n<p>Arm&rsquo;d still, and gazing on the giant&rsquo;s limbs</p>\n<p>Strewn o&rsquo;er th&rsquo; ethereal field. Nimrod I saw:</p>\n<p>At foot of the stupendous work he stood,</p>\n<p>As if bewilder&rsquo;d, looking on the crowd</p>\n<p>Leagued in his proud attempt on Sennaar&rsquo;s plain.</p>\n<p class="slindent">O Niobe! in what a trance of woe</p>\n<p>Thee I beheld, upon that highway drawn,</p>\n<p>Sev&rsquo;n sons on either side thee slain! O Saul!</p>\n<p>How ghastly didst thou look! on thine own sword</p>\n<p>Expiring in Gilboa, from that hour</p>\n<p>Ne&rsquo;er visited with rain from heav&rsquo;n or dew!</p>\n<p class="slindent">O fond Arachne! thee I also saw</p>\n<p>Half spider now in anguish crawling up</p>\n<p>Th&rsquo; unfinish&rsquo;d web thou weaved&rsquo;st to thy bane!</p>\n<p class="slindent">O Rehoboam! here thy shape doth seem</p>\n<p>Louring no more defiance! but fear-smote</p>\n<p>With none to chase him in his chariot whirl&rsquo;d.</p>\n<p class="slindent">Was shown beside upon the solid floor</p>\n<p>How dear Alcmaeon forc&rsquo;d his mother rate</p>\n<p>That ornament in evil hour receiv&rsquo;d:</p>\n<p>How in the temple on Sennacherib fell</p>\n<p>His sons, and how a corpse they left him there.</p>\n<p>Was shown the scath and cruel mangling made</p>\n<p>By Tomyris on Cyrus, when she cried:</p>\n<p>&ldquo;Blood thou didst thirst for, take thy fill of blood!&rdquo;</p>\n<p>Was shown how routed in the battle fled</p>\n<p>Th&rsquo; Assyrians, Holofernes slain, and e&rsquo;en</p>\n<p>The relics of the carnage. Troy I mark&rsquo;d</p>\n<p>In ashes and in caverns. Oh! how fall&rsquo;n,</p>\n<p>How abject, Ilion, was thy semblance there!</p>\n<p class="slindent">What master of the pencil or the style</p>\n<p>Had trac&rsquo;d the shades and lines, that might have made</p>\n<p>The subtlest workman wonder? Dead the dead,</p>\n<p>The living seem&rsquo;d alive; with clearer view</p>\n<p>His eye beheld not who beheld the truth,</p>\n<p>Than mine what I did tread on, while I went</p>\n<p>Low bending. Now swell out; and with stiff necks</p>\n<p>Pass on, ye sons of Eve! veil not your looks,</p>\n<p>Lest they descry the evil of your path!</p>\n<p class="slindent">I noted not (so busied was my thought)</p>\n<p>How much we now had circled of the mount,</p>\n<p>And of his course yet more the sun had spent,</p>\n<p>When he, who with still wakeful caution went,</p>\n<p>Admonish&rsquo;d: &ldquo;Raise thou up thy head: for know</p>\n<p>Time is not now for slow suspense. Behold</p>\n<p>That way an angel hasting towards us! Lo</p>\n<p>Where duly the sixth handmaid doth return</p>\n<p>From service on the day. Wear thou in look</p>\n<p>And gesture seemly grace of reverent awe,</p>\n<p>That gladly he may forward us aloft.</p>\n<p>Consider that this day ne&rsquo;er dawns again.&rdquo;</p>\n<p class="slindent">Time&rsquo;s loss he had so often warn&rsquo;d me &rsquo;gainst,</p>\n<p>I could not miss the scope at which he aim&rsquo;d.</p>\n<p class="slindent">The goodly shape approach&rsquo;d us, snowy white</p>\n<p>In vesture, and with visage casting streams</p>\n<p>Of tremulous lustre like the matin star.</p>\n<p>His arms he open&rsquo;d, then his wings; and spake:</p>\n<p>&ldquo;Onward: the steps, behold! are near; and now</p>\n<p>Th&rsquo; ascent is without difficulty gain&rsquo;d.&rdquo;</p>\n<p class="slindent">A scanty few are they, who when they hear</p>\n<p>Such tidings, hasten. O ye race of men</p>\n<p>Though born to soar, why suffer ye a wind</p>\n<p>So slight to baffle ye? He led us on</p>\n<p>Where the rock parted; here against my front</p>\n<p>Did beat his wings, then promis&rsquo;d I should fare</p>\n<p>In safety on my way. As to ascend</p>\n<p>That steep, upon whose brow the chapel stands</p>\n<p>(O&rsquo;er Rubaconte, looking lordly down</p>\n<p>On the well-guided city,) up the right</p>\n<p>Th&rsquo; impetuous rise is broken by the steps</p>\n<p>Carv&rsquo;d in that old and simple age, when still</p>\n<p>The registry and label rested safe;</p>\n<p>Thus is th&rsquo; acclivity reliev&rsquo;d, which here</p>\n<p>Precipitous from the other circuit falls:</p>\n<p>But on each hand the tall cliff presses close.</p>\n<p class="slindent">As ent&rsquo;ring there we turn&rsquo;d, voices, in strain</p>\n<p>Ineffable, sang: &ldquo;Blessed are the poor</p>\n<p>In spirit.&rdquo; Ah how far unlike to these</p>\n<p>The straits of hell; here songs to usher us,</p>\n<p>There shrieks of woe! We climb the holy stairs:</p>\n<p>And lighter to myself by far I seem&rsquo;d</p>\n<p>Than on the plain before, whence thus I spake:</p>\n<p>&ldquo;Say, master, of what heavy thing have I</p>\n<p>Been lighten&rsquo;d, that scarce aught the sense of toil</p>\n<p>Affects me journeying?&rdquo; He in few replied:</p>\n<p>&ldquo;When sin&rsquo;s broad characters, that yet remain</p>\n<p>Upon thy temples, though well nigh effac&rsquo;d,</p>\n<p>Shall be, as one is, all clean razed out,</p>\n<p>Then shall thy feet by heartiness of will</p>\n<p>Be so o&rsquo;ercome, they not alone shall feel</p>\n<p>No sense of labour, but delight much more</p>\n<p>Shall wait them urg&rsquo;d along their upward way.&rdquo;</p>\n<p class="slindent">Then like to one, upon whose head is plac&rsquo;d</p>\n<p>Somewhat he deems not of but from the becks</p>\n<p>Of others as they pass him by; his hand</p>\n<p>Lends therefore help to&rsquo; assure him, searches, finds,</p>\n<p>And well performs such office as the eye</p>\n<p>Wants power to execute: so stretching forth</p>\n<p>The fingers of my right hand, did I find</p>\n<p>Six only of the letters, which his sword</p>\n<p>Who bare the keys had trac&rsquo;d upon my brow.</p>\n<p>The leader, as he mark&rsquo;d mine action, smil&rsquo;d.</p>\n</div>','<p class="cantohead">Canto XIII</p>\n<div class="stanza"><p>We reach&rsquo;d the summit of the scale, and stood</p>\n<p>Upon the second buttress of that mount</p>\n<p>Which healeth him who climbs. A cornice there,</p>\n<p>Like to the former, girdles round the hill;</p>\n<p>Save that its arch with sweep less ample bends.</p>\n<p class="slindent">Shadow nor image there is seen; all smooth</p>\n<p>The rampart and the path, reflecting nought</p>\n<p>But the rock&rsquo;s sullen hue. &ldquo;If here we wait</p>\n<p>For some to question,&rdquo; said the bard, &ldquo;I fear</p>\n<p>Our choice may haply meet too long delay.&rdquo;</p>\n<p class="slindent">Then fixedly upon the sun his eyes</p>\n<p>He fastn&rsquo;d, made his right the central point</p>\n<p>From whence to move, and turn&rsquo;d the left aside.</p>\n<p>&ldquo;O pleasant light, my confidence and hope,</p>\n<p>Conduct us thou,&rdquo; he cried, &ldquo;on this new way,</p>\n<p>Where now I venture, leading to the bourn</p>\n<p>We seek. The universal world to thee</p>\n<p>Owes warmth and lustre. If no other cause</p>\n<p>Forbid, thy beams should ever be our guide.&rdquo;</p>\n<p class="slindent">Far, as is measur&rsquo;d for a mile on earth,</p>\n<p>In brief space had we journey&rsquo;d; such prompt will</p>\n<p>Impell&rsquo;d; and towards us flying, now were heard</p>\n<p>Spirits invisible, who courteously</p>\n<p>Unto love&rsquo;s table bade the welcome guest.</p>\n<p>The voice, that first? flew by, call&rsquo;d forth aloud,</p>\n<p>&ldquo;They have no wine; &rdquo; so on behind us past,</p>\n<p>Those sounds reiterating, nor yet lost</p>\n<p>In the faint distance, when another came</p>\n<p>Crying, &ldquo;I am Orestes,&rdquo; and alike</p>\n<p>Wing&rsquo;d its fleet way. &ldquo;Oh father!&rdquo; I exclaim&rsquo;d,</p>\n<p>&ldquo;What tongues are these?&rdquo; and as I question&rsquo;d, lo!</p>\n<p>A third exclaiming, &ldquo;Love ye those have wrong&rsquo;d you.&rdquo;</p>\n<p class="slindent">&ldquo;This circuit,&rdquo; said my teacher, &ldquo;knots the scourge</p>\n<p>For envy, and the cords are therefore drawn</p>\n<p>By charity&rsquo;s correcting hand. The curb</p>\n<p>Is of a harsher sound, as thou shalt hear</p>\n<p>(If I deem rightly), ere thou reach the pass,</p>\n<p>Where pardon sets them free. But fix thine eyes</p>\n<p>Intently through the air, and thou shalt see</p>\n<p>A multitude before thee seated, each</p>\n<p>Along the shelving grot.&rdquo; Then more than erst</p>\n<p>I op&rsquo;d my eyes, before me view&rsquo;d, and saw</p>\n<p>Shadows with garments dark as was the rock;</p>\n<p>And when we pass&rsquo;d a little forth, I heard</p>\n<p>A crying, &ldquo;Blessed Mary! pray for us,</p>\n<p>Michael and Peter! all ye saintly host!&rdquo;</p>\n<p class="slindent">I do not think there walks on earth this day</p>\n<p>Man so remorseless, that he hath not yearn&rsquo;d</p>\n<p>With pity at the sight that next I saw.</p>\n<p>Mine eyes a load of sorrow teemed, when now</p>\n<p>I stood so near them, that their semblances</p>\n<p>Came clearly to my view. Of sackcloth vile</p>\n<p>Their cov&rsquo;ring seem&rsquo;d; and on his shoulder one</p>\n<p>Did stay another, leaning, and all lean&rsquo;d</p>\n<p>Against the cliff. E&rsquo;en thus the blind and poor,</p>\n<p>Near the confessionals, to crave an alms,</p>\n<p>Stand, each his head upon his fellow&rsquo;s sunk,</p>\n<p>So most to stir compassion, not by sound</p>\n<p>Of words alone, but that, which moves not less,</p>\n<p>The sight of mis&rsquo;ry. And as never beam</p>\n<p>Of noonday visiteth the eyeless man,</p>\n<p>E&rsquo;en so was heav&rsquo;n a niggard unto these</p>\n<p>Of his fair light; for, through the orbs of all,</p>\n<p>A thread of wire, impiercing, knits them up,</p>\n<p>As for the taming of a haggard hawk.</p>\n<p class="slindent">It were a wrong, methought, to pass and look</p>\n<p>On others, yet myself the while unseen.</p>\n<p>To my sage counsel therefore did I turn.</p>\n<p>He knew the meaning of the mute appeal,</p>\n<p>Nor waited for my questioning, but said:</p>\n<p>&ldquo;Speak; and be brief, be subtle in thy words.&rdquo;</p>\n<p class="slindent">On that part of the cornice, whence no rim</p>\n<p>Engarlands its steep fall, did Virgil come;</p>\n<p>On the&rsquo; other side me were the spirits, their cheeks</p>\n<p>Bathing devout with penitential tears,</p>\n<p>That through the dread impalement forc&rsquo;d a way.</p>\n<p class="slindent">I turn&rsquo;d me to them, and &ldquo;O shades!&rdquo; said I,</p>\n<p class="slindent">&ldquo;Assur&rsquo;d that to your eyes unveil&rsquo;d shall shine</p>\n<p>The lofty light, sole object of your wish,</p>\n<p>So may heaven&rsquo;s grace clear whatsoe&rsquo;er of foam</p>\n<p>Floats turbid on the conscience, that thenceforth</p>\n<p>The stream of mind roll limpid from its source,</p>\n<p>As ye declare (for so shall ye impart</p>\n<p>A boon I dearly prize) if any soul</p>\n<p>Of Latium dwell among ye; and perchance</p>\n<p>That soul may profit, if I learn so much.&rdquo;</p>\n<p class="slindent">&ldquo;My brother, we are each one citizens</p>\n<p>Of one true city. Any thou wouldst say,</p>\n<p>Who lived a stranger in Italia&rsquo;s land.&rdquo;</p>\n<p class="slindent">So heard I answering, as appeal&rsquo;d, a voice</p>\n<p>That onward came some space from whence I stood.</p>\n<p class="slindent">A spirit I noted, in whose look was mark&rsquo;d</p>\n<p>Expectance. Ask ye how? The chin was rais&rsquo;d</p>\n<p>As in one reft of sight. &ldquo;Spirit,&rdquo; said I,</p>\n<p>&ldquo;Who for thy rise are tutoring (if thou be</p>\n<p>That which didst answer to me,) or by place</p>\n<p>Or name, disclose thyself, that I may know thee.&rdquo;</p>\n<p class="slindent">&ldquo;I was,&rdquo; it answer&rsquo;d, &ldquo;of Sienna: here</p>\n<p>I cleanse away with these the evil life,</p>\n<p>Soliciting with tears that He, who is,</p>\n<p>Vouchsafe him to us. Though Sapia nam&rsquo;d</p>\n<p>In sapience I excell&rsquo;d not, gladder far</p>\n<p>Of others&rsquo; hurt, than of the good befell me.</p>\n<p>That thou mayst own I now deceive thee not,</p>\n<p>Hear, if my folly were not as I speak it.</p>\n<p>When now my years slop&rsquo;d waning down the arch,</p>\n<p>It so bechanc&rsquo;d, my fellow citizens</p>\n<p>Near Colle met their enemies in the field,</p>\n<p>And I pray&rsquo;d God to grant what He had will&rsquo;d.</p>\n<p>There were they vanquish&rsquo;d, and betook themselves</p>\n<p>Unto the bitter passages of flight.</p>\n<p>I mark&rsquo;d the hunt, and waxing out of bounds</p>\n<p>In gladness, lifted up my shameless brow,</p>\n<p>And like the merlin cheated by a gleam,</p>\n<p>Cried, &ldquo;It is over. Heav&rsquo;n! I fear thee not.&rdquo;</p>\n<p>Upon my verge of life I wish&rsquo;d for peace</p>\n<p>With God; nor repentance had supplied</p>\n<p>What I did lack of duty, were it not</p>\n<p>The hermit Piero, touch&rsquo;d with charity,</p>\n<p>In his devout orisons thought on me.</p>\n<p>But who art thou that question&rsquo;st of our state,</p>\n<p>Who go&rsquo;st to my belief, with lids unclos&rsquo;d,</p>\n<p>And breathest in thy talk?&rdquo;&mdash;&ldquo;Mine eyes,&rdquo; said I,</p>\n<p>&ldquo;May yet be here ta&rsquo;en from me; but not long;</p>\n<p>For they have not offended grievously</p>\n<p>With envious glances. But the woe beneath</p>\n<p>Urges my soul with more exceeding dread.</p>\n<p>That nether load already weighs me down.&rdquo;</p>\n<p class="slindent">She thus: &ldquo;Who then amongst us here aloft</p>\n<p>Hath brought thee, if thou weenest to return?&rdquo;</p>\n<p class="slindent">&ldquo;He,&rdquo; answer&rsquo;d I, &ldquo;who standeth mute beside me.</p>\n<p>I live: of me ask therefore, chosen spirit,</p>\n<p>If thou desire I yonder yet should move</p>\n<p>For thee my mortal feet.&rdquo; &mdash;&ldquo;Oh!&rdquo; she replied,</p>\n<p>&ldquo;This is so strange a thing, it is great sign</p>\n<p>That God doth love thee. Therefore with thy prayer</p>\n<p>Sometime assist me: and by that I crave,</p>\n<p>Which most thou covetest, that if thy feet</p>\n<p>E&rsquo;er tread on Tuscan soil, thou save my fame</p>\n<p>Amongst my kindred. Them shalt thou behold</p>\n<p>With that vain multitude, who set their hope</p>\n<p>On Telamone&rsquo;s haven, there to fail</p>\n<p>Confounded, more shall when the fancied stream</p>\n<p>They sought of Dian call&rsquo;d: but they who lead</p>\n<p>Their navies, more than ruin&rsquo;d hopes shall mourn.&rdquo;</p>\n</div>','<p class="cantohead">Canto XIV</p>\n<div class="stanza"><p>&ldquo;Say who is he around our mountain winds,</p>\n<p>Or ever death has prun&rsquo;d his wing for flight,</p>\n<p>That opes his eyes and covers them at will?&rdquo;</p>\n<p class="slindent">&ldquo;I know not who he is, but know thus much</p>\n<p>He comes not singly. Do thou ask of him,</p>\n<p>For thou art nearer to him, and take heed</p>\n<p>Accost him gently, so that he may speak.&rdquo;</p>\n<p class="slindent">Thus on the right two Spirits bending each</p>\n<p>Toward the other, talk&rsquo;d of me, then both</p>\n<p>Addressing me, their faces backward lean&rsquo;d,</p>\n<p>And thus the one began: &ldquo;O soul, who yet</p>\n<p>Pent in the body, tendest towards the sky!</p>\n<p>For charity, we pray thee&rsquo; comfort us,</p>\n<p>Recounting whence thou com&rsquo;st, and who thou art:</p>\n<p>For thou dost make us at the favour shown thee</p>\n<p>Marvel, as at a thing that ne&rsquo;er hath been.&rdquo;</p>\n<p class="slindent">&ldquo;There stretches through the midst of Tuscany,</p>\n<p>I straight began: &ldquo;a brooklet, whose well-head</p>\n<p>Springs up in Falterona, with his race</p>\n<p>Not satisfied, when he some hundred miles</p>\n<p>Hath measur&rsquo;d. From his banks bring, I this frame.</p>\n<p>To tell you who I am were words misspent:</p>\n<p>For yet my name scarce sounds on rumour&rsquo;s lip.&rdquo;</p>\n<p class="slindent">&ldquo;If well I do incorp&rsquo;rate with my thought</p>\n<p>The meaning of thy speech,&rdquo; said he, who first</p>\n<p>Addrest me, &ldquo;thou dost speak of Arno&rsquo;s wave.&rdquo;</p>\n<p class="slindent">To whom the other: &ldquo;Why hath he conceal&rsquo;d</p>\n<p>The title of that river, as a man</p>\n<p>Doth of some horrible thing?&rdquo; The spirit, who</p>\n<p>Thereof was question&rsquo;d, did acquit him thus:</p>\n<p>&ldquo;I know not: but &rsquo;tis fitting well the name</p>\n<p>Should perish of that vale; for from the source</p>\n<p>Where teems so plenteously the Alpine steep</p>\n<p>Maim&rsquo;d of Pelorus, (that doth scarcely pass</p>\n<p>Beyond that limit,) even to the point</p>\n<p>Whereunto ocean is restor&rsquo;d, what heaven</p>\n<p>Drains from th&rsquo; exhaustless store for all earth&rsquo;s streams,</p>\n<p>Throughout the space is virtue worried down,</p>\n<p>As &rsquo;twere a snake, by all, for mortal foe,</p>\n<p>Or through disastrous influence on the place,</p>\n<p>Or else distortion of misguided wills,</p>\n<p>That custom goads to evil: whence in those,</p>\n<p>The dwellers in that miserable vale,</p>\n<p>Nature is so transform&rsquo;d, it seems as they</p>\n<p>Had shar&rsquo;d of Circe&rsquo;s feeding. &rsquo;Midst brute swine,</p>\n<p>Worthier of acorns than of other food</p>\n<p>Created for man&rsquo;s use, he shapeth first</p>\n<p>His obscure way; then, sloping onward, finds</p>\n<p>Curs, snarlers more in spite than power, from whom</p>\n<p>He turns with scorn aside: still journeying down,</p>\n<p>By how much more the curst and luckless foss</p>\n<p>Swells out to largeness, e&rsquo;en so much it finds</p>\n<p>Dogs turning into wolves. Descending still</p>\n<p>Through yet more hollow eddies, next he meets</p>\n<p>A race of foxes, so replete with craft,</p>\n<p>They do not fear that skill can master it.</p>\n<p>Nor will I cease because my words are heard</p>\n<p>By other ears than thine. It shall be well</p>\n<p>For this man, if he keep in memory</p>\n<p>What from no erring Spirit I reveal.</p>\n<p>Lo! I behold thy grandson, that becomes</p>\n<p>A hunter of those wolves, upon the shore</p>\n<p>Of the fierce stream, and cows them all with dread:</p>\n<p>Their flesh yet living sets he up to sale,</p>\n<p>Then like an aged beast to slaughter dooms.</p>\n<p>Many of life he reaves, himself of worth</p>\n<p>And goodly estimation. Smear&rsquo;d with gore</p>\n<p>Mark how he issues from the rueful wood,</p>\n<p>Leaving such havoc, that in thousand years</p>\n<p>It spreads not to prime lustihood again.&rdquo;</p>\n<p class="slindent">As one, who tidings hears of woe to come,</p>\n<p>Changes his looks perturb&rsquo;d, from whate&rsquo;er part</p>\n<p>The peril grasp him, so beheld I change</p>\n<p>That spirit, who had turn&rsquo;d to listen, struck</p>\n<p>With sadness, soon as he had caught the word.</p>\n<p class="slindent">His visage and the other&rsquo;s speech did raise</p>\n<p>Desire in me to know the names of both,</p>\n<p>whereof with meek entreaty I inquir&rsquo;d.</p>\n<p class="slindent">The shade, who late addrest me, thus resum&rsquo;d:</p>\n<p>&ldquo;Thy wish imports that I vouchsafe to do</p>\n<p>For thy sake what thou wilt not do for mine.</p>\n<p>But since God&rsquo;s will is that so largely shine</p>\n<p>His grace in thee, I will be liberal too.</p>\n<p>Guido of Duca know then that I am.</p>\n<p>Envy so parch&rsquo;d my blood, that had I seen</p>\n<p>A fellow man made joyous, thou hadst mark&rsquo;d</p>\n<p>A livid paleness overspread my cheek.</p>\n<p>Such harvest reap I of the seed I sow&rsquo;d.</p>\n<p>O man, why place thy heart where there doth need</p>\n<p>Exclusion of participants in good?</p>\n<p>This is Rinieri&rsquo;s spirit, this the boast</p>\n<p>And honour of the house of Calboli,</p>\n<p>Where of his worth no heritage remains.</p>\n<p>Nor his the only blood, that hath been stript</p>\n<p>(&rsquo;twixt Po, the mount, the Reno, and the shore,)</p>\n<p>Of all that truth or fancy asks for bliss;</p>\n<p>But in those limits such a growth has sprung</p>\n<p>Of rank and venom&rsquo;d roots, as long would mock</p>\n<p>Slow culture&rsquo;s toil. Where is good Lizio? where</p>\n<p>Manardi, Traversalo, and Carpigna?</p>\n<p>O bastard slips of old Romagna&rsquo;s line!</p>\n<p>When in Bologna the low artisan,</p>\n<p>And in Faenza yon Bernardin sprouts,</p>\n<p>A gentle cyon from ignoble stem.</p>\n<p>Wonder not, Tuscan, if thou see me weep,</p>\n<p>When I recall to mind those once lov&rsquo;d names,</p>\n<p>Guido of Prata, and of Azzo him</p>\n<p>That dwelt with you; Tignoso and his troop,</p>\n<p>With Traversaro&rsquo;s house and Anastagio s,</p>\n<p>(Each race disherited) and beside these,</p>\n<p>The ladies and the knights, the toils and ease,</p>\n<p>That witch&rsquo;d us into love and courtesy;</p>\n<p>Where now such malice reigns in recreant hearts.</p>\n<p>O Brettinoro! wherefore tarriest still,</p>\n<p>Since forth of thee thy family hath gone,</p>\n<p>And many, hating evil, join&rsquo;d their steps?</p>\n<p>Well doeth he, that bids his lineage cease,</p>\n<p>Bagnacavallo; Castracaro ill,</p>\n<p>And Conio worse, who care to propagate</p>\n<p>A race of Counties from such blood as theirs.</p>\n<p>Well shall ye also do, Pagani, then</p>\n<p>When from amongst you tries your demon child.</p>\n<p>Not so, howe&rsquo;er, that henceforth there remain</p>\n<p>True proof of what ye were. O Hugolin!</p>\n<p>Thou sprung of Fantolini&rsquo;s line! thy name</p>\n<p>Is safe, since none is look&rsquo;d for after thee</p>\n<p>To cloud its lustre, warping from thy stock.</p>\n<p>But, Tuscan, go thy ways; for now I take</p>\n<p>Far more delight in weeping than in words.</p>\n<p>Such pity for your sakes hath wrung my heart.&rdquo;</p>\n<p class="slindent">We knew those gentle spirits at parting heard</p>\n<p>Our steps. Their silence therefore of our way</p>\n<p>Assur&rsquo;d us. Soon as we had quitted them,</p>\n<p>Advancing onward, lo! a voice that seem&rsquo;d</p>\n<p>Like vollied light&rsquo;ning, when it rives the air,</p>\n<p>Met us, and shouted, &ldquo;Whosoever finds</p>\n<p>Will slay me,&rdquo; then fled from us, as the bolt</p>\n<p>Lanc&rsquo;d sudden from a downward-rushing cloud.</p>\n<p>When it had giv&rsquo;n short truce unto our hearing,</p>\n<p>Behold the other with a crash as loud</p>\n<p>As the quick-following thunder: &ldquo;Mark in me</p>\n<p>Aglauros turn&rsquo;d to rock.&rdquo; I at the sound</p>\n<p>Retreating drew more closely to my guide.</p>\n<p class="slindent">Now in mute stillness rested all the air:</p>\n<p>And thus he spake: &ldquo;There was the galling bit.</p>\n<p>But your old enemy so baits his hook,</p>\n<p>He drags you eager to him. Hence nor curb</p>\n<p>Avails you, nor reclaiming call. Heav&rsquo;n calls</p>\n<p>And round about you wheeling courts your gaze</p>\n<p>With everlasting beauties. Yet your eye</p>\n<p>Turns with fond doting still upon the earth.</p>\n<p>Therefore He smites you who discerneth all.&rdquo;</p>\n</div>','<p class="cantohead">Canto XV</p>\n<div class="stanza"><p>As much as &rsquo;twixt the third hour&rsquo;s close and dawn,</p>\n<p>Appeareth of heav&rsquo;n&rsquo;s sphere, that ever whirls</p>\n<p>As restless as an infant in his play,</p>\n<p>So much appear&rsquo;d remaining to the sun</p>\n<p>Of his slope journey towards the western goal.</p>\n<p class="slindent">Evening was there, and here the noon of night;</p>\n<p>and full upon our forehead smote the beams.</p>\n<p>For round the mountain, circling, so our path</p>\n<p>Had led us, that toward the sun-set now</p>\n<p>Direct we journey&rsquo;d: when I felt a weight</p>\n<p>Of more exceeding splendour, than before,</p>\n<p>Press on my front. The cause unknown, amaze</p>\n<p>Possess&rsquo;d me, and both hands against my brow</p>\n<p>Lifting, I interpos&rsquo;d them, as a screen,</p>\n<p>That of its gorgeous superflux of light</p>\n<p>Clipp&rsquo;d the diminish&rsquo;d orb. As when the ray,</p>\n<p>Striking On water or the surface clear</p>\n<p>Of mirror, leaps unto the opposite part,</p>\n<p>Ascending at a glance, e&rsquo;en as it fell,</p>\n<p>(And so much differs from the stone, that falls</p>\n<p>Through equal space, as practice skill hath shown;</p>\n<p>Thus with refracted light before me seemed</p>\n<p>The ground there smitten; whence in sudden haste</p>\n<p>My sight recoil&rsquo;d. &ldquo;What is this, sire belov&rsquo;d!</p>\n<p>&rsquo;Gainst which I strive to shield the sight in vain?&rdquo;</p>\n<p>Cried I, &ldquo;and which towards us moving seems?&rdquo;</p>\n<p class="slindent">&ldquo;Marvel not, if the family of heav&rsquo;n,&rdquo;</p>\n<p>He answer&rsquo;d, &ldquo;yet with dazzling radiance dim</p>\n<p>Thy sense it is a messenger who comes,</p>\n<p>Inviting man&rsquo;s ascent. Such sights ere long,</p>\n<p>Not grievous, shall impart to thee delight,</p>\n<p>As thy perception is by nature wrought</p>\n<p>Up to their pitch.&rdquo; The blessed angel, soon</p>\n<p>As we had reach&rsquo;d him, hail&rsquo;d us with glad voice:</p>\n<p>&ldquo;Here enter on a ladder far less steep</p>\n<p>Than ye have yet encounter&rsquo;d.&rdquo; We forthwith</p>\n<p>Ascending, heard behind us chanted sweet,</p>\n<p>&ldquo;Blessed the merciful,&rdquo; and &ldquo;happy thou!</p>\n<p>That conquer&rsquo;st.&rdquo; Lonely each, my guide and I</p>\n<p>Pursued our upward way; and as we went,</p>\n<p>Some profit from his words I hop&rsquo;d to win,</p>\n<p>And thus of him inquiring, fram&rsquo;d my speech:</p>\n<p class="slindent">&ldquo;What meant Romagna&rsquo;s spirit, when he spake</p>\n<p>Of bliss exclusive with no partner shar&rsquo;d?&rdquo;</p>\n<p class="slindent">He straight replied: &ldquo;No wonder, since he knows,</p>\n<p>What sorrow waits on his own worst defect,</p>\n<p>If he chide others, that they less may mourn.</p>\n<p>Because ye point your wishes at a mark,</p>\n<p>Where, by communion of possessors, part</p>\n<p>Is lessen&rsquo;d, envy bloweth up the sighs of men.</p>\n<p>No fear of that might touch ye, if the love</p>\n<p>Of higher sphere exalted your desire.</p>\n<p>For there, by how much more they call it ours,</p>\n<p>So much propriety of each in good</p>\n<p>Increases more, and heighten&rsquo;d charity</p>\n<p>Wraps that fair cloister in a brighter flame.&rdquo;</p>\n<p class="slindent">&ldquo;Now lack I satisfaction more,&rdquo; said I,</p>\n<p>&ldquo;Than if thou hadst been silent at the first,</p>\n<p>And doubt more gathers on my lab&rsquo;ring thought.</p>\n<p>How can it chance, that good distributed,</p>\n<p>The many, that possess it, makes more rich,</p>\n<p>Than if &rsquo;t were shar&rsquo;d by few?&rdquo; He answering thus:</p>\n<p>&ldquo;Thy mind, reverting still to things of earth,</p>\n<p>Strikes darkness from true light. The highest good</p>\n<p>Unlimited, ineffable, doth so speed</p>\n<p>To love, as beam to lucid body darts,</p>\n<p>Giving as much of ardour as it finds.</p>\n<p>The sempiternal effluence streams abroad</p>\n<p>Spreading, wherever charity extends.</p>\n<p>So that the more aspirants to that bliss</p>\n<p>Are multiplied, more good is there to love,</p>\n<p>And more is lov&rsquo;d; as mirrors, that reflect,</p>\n<p>Each unto other, propagated light.</p>\n<p>If these my words avail not to allay</p>\n<p>Thy thirsting, Beatrice thou shalt see,</p>\n<p>Who of this want, and of all else thou hast,</p>\n<p>Shall rid thee to the full. Provide but thou</p>\n<p>That from thy temples may be soon eras&rsquo;d,</p>\n<p>E&rsquo;en as the two already, those five scars,</p>\n<p>That when they pain thee worst, then kindliest heal,&rdquo;</p>\n<p class="slindent">&ldquo;Thou,&rdquo; I had said, &ldquo;content&rsquo;st me,&rdquo; when I saw</p>\n<p>The other round was gain&rsquo;d, and wond&rsquo;ring eyes</p>\n<p>Did keep me mute. There suddenly I seem&rsquo;d</p>\n<p>By an ecstatic vision wrapt away;</p>\n<p>And in a temple saw, methought, a crowd</p>\n<p>Of many persons; and at th&rsquo; entrance stood</p>\n<p>A dame, whose sweet demeanour did express</p>\n<p>A mother&rsquo;s love, who said, &ldquo;Child! why hast thou</p>\n<p>Dealt with us thus? Behold thy sire and I</p>\n<p>Sorrowing have sought thee;&rdquo; and so held her peace,</p>\n<p>And straight the vision fled. A female next</p>\n<p>Appear&rsquo;d before me, down whose visage cours&rsquo;d</p>\n<p>Those waters, that grief forces out from one</p>\n<p>By deep resentment stung, who seem&rsquo;d to say:</p>\n<p>&ldquo;If thou, Pisistratus, be lord indeed</p>\n<p>Over this city, nam&rsquo;d with such debate</p>\n<p>Of adverse gods, and whence each science sparkles,</p>\n<p>Avenge thee of those arms, whose bold embrace</p>\n<p>Hath clasp&rsquo;d our daughter; &ldquo;and to fuel, meseem&rsquo;d,</p>\n<p>Benign and meek, with visage undisturb&rsquo;d,</p>\n<p>Her sovran spake: &ldquo;How shall we those requite,</p>\n<p>Who wish us evil, if we thus condemn</p>\n<p>The man that loves us?&rdquo; After that I saw</p>\n<p>A multitude, in fury burning, slay</p>\n<p>With stones a stripling youth, and shout amain</p>\n<p>&ldquo;Destroy, destroy: &ldquo;and him I saw, who bow&rsquo;d</p>\n<p>Heavy with death unto the ground, yet made</p>\n<p>His eyes, unfolded upward, gates to heav&rsquo;n,</p>\n<p>Praying forgiveness of th&rsquo; Almighty Sire,</p>\n<p>Amidst that cruel conflict, on his foes,</p>\n<p>With looks, that With compassion to their aim.</p>\n<p class="slindent">Soon as my spirit, from her airy flight</p>\n<p>Returning, sought again the things, whose truth</p>\n<p>Depends not on her shaping, I observ&rsquo;d</p>\n<p>How she had rov&rsquo;d to no unreal scenes</p>\n<p class="slindent">Meanwhile the leader, who might see I mov&rsquo;d,</p>\n<p>As one, who struggles to shake off his sleep,</p>\n<p>Exclaim&rsquo;d: &ldquo;What ails thee, that thou canst not hold</p>\n<p>Thy footing firm, but more than half a league</p>\n<p>Hast travel&rsquo;d with clos&rsquo;d eyes and tott&rsquo;ring gait,</p>\n<p>Like to a man by wine or sleep o&rsquo;ercharg&rsquo;d?&rdquo;</p>\n<p class="slindent">&ldquo;Beloved father! so thou deign,&rdquo; said I,</p>\n<p>&ldquo;To listen, I will tell thee what appear&rsquo;d</p>\n<p>Before me, when so fail&rsquo;d my sinking steps.&rdquo;</p>\n<p class="slindent">He thus: &ldquo;Not if thy Countenance were mask&rsquo;d</p>\n<p>With hundred vizards, could a thought of thine</p>\n<p>How small soe&rsquo;er, elude me. What thou saw&rsquo;st</p>\n<p>Was shown, that freely thou mightst ope thy heart</p>\n<p>To the waters of peace, that flow diffus&rsquo;d</p>\n<p>From their eternal fountain. I not ask&rsquo;d,</p>\n<p>What ails thee? for such cause as he doth, who</p>\n<p>Looks only with that eye which sees no more,</p>\n<p>When spiritless the body lies; but ask&rsquo;d,</p>\n<p>To give fresh vigour to thy foot. Such goads</p>\n<p>The slow and loit&rsquo;ring need; that they be found</p>\n<p>Not wanting, when their hour of watch returns.&rdquo;</p>\n<p class="slindent">So on we journey&rsquo;d through the evening sky</p>\n<p>Gazing intent, far onward, as our eyes</p>\n<p>With level view could stretch against the bright</p>\n<p>Vespertine ray: and lo! by slow degrees</p>\n<p>Gath&rsquo;ring, a fog made tow&rsquo;rds us, dark as night.</p>\n<p>There was no room for &rsquo;scaping; and that mist</p>\n<p>Bereft us, both of sight and the pure air.</p>\n</div>','<p class="cantohead">Canto XVI</p>\n<div class="stanza"><p>Hell&rsquo;s dunnest gloom, or night unlustrous, dark,</p>\n<p>Of every planes &rsquo;reft, and pall&rsquo;d in clouds,</p>\n<p>Did never spread before the sight a veil</p>\n<p>In thickness like that fog, nor to the sense</p>\n<p>So palpable and gross. Ent&rsquo;ring its shade,</p>\n<p>Mine eye endured not with unclosed lids;</p>\n<p>Which marking, near me drew the faithful guide,</p>\n<p>Offering me his shoulder for a stay.</p>\n<p class="slindent">As the blind man behind his leader walks,</p>\n<p>Lest he should err, or stumble unawares</p>\n<p>On what might harm him, or perhaps destroy,</p>\n<p>I journey&rsquo;d through that bitter air and foul,</p>\n<p>Still list&rsquo;ning to my escort&rsquo;s warning voice,</p>\n<p>&ldquo;Look that from me thou part not.&rdquo; Straight I heard</p>\n<p>Voices, and each one seem&rsquo;d to pray for peace,</p>\n<p>And for compassion, to the Lamb of God</p>\n<p>That taketh sins away. Their prelude still</p>\n<p>Was &ldquo;Agnus Dei,&rdquo; and through all the choir,</p>\n<p>One voice, one measure ran, that perfect seem&rsquo;d</p>\n<p>The concord of their song. &ldquo;Are these I hear</p>\n<p>Spirits, O master?&rdquo; I exclaim&rsquo;d; and he:</p>\n<p>&ldquo;Thou aim&rsquo;st aright: these loose the bonds of wrath.&rdquo;</p>\n<p class="slindent">&ldquo;Now who art thou, that through our smoke dost cleave?</p>\n<p>And speak&rsquo;st of us, as thou thyself e&rsquo;en yet</p>\n<p>Dividest time by calends?&rdquo; So one voice</p>\n<p>Bespake me; whence my master said: &ldquo;Reply;</p>\n<p>And ask, if upward hence the passage lead.&rdquo;</p>\n<p class="slindent">&ldquo;O being! who dost make thee pure, to stand</p>\n<p>Beautiful once more in thy Maker&rsquo;s sight!</p>\n<p>Along with me: and thou shalt hear and wonder.&rdquo;</p>\n<p>Thus I, whereto the spirit answering spake:</p>\n<p>&ldquo;Long as &rsquo;t is lawful for me, shall my steps</p>\n<p>Follow on thine; and since the cloudy smoke</p>\n<p>Forbids the seeing, hearing in its stead</p>\n<p>Shall keep us join&rsquo;d.&rdquo; I then forthwith began</p>\n<p>&ldquo;Yet in my mortal swathing, I ascend</p>\n<p>To higher regions, and am hither come</p>\n<p>Through the fearful agony of hell.</p>\n<p>And, if so largely God hath doled his grace,</p>\n<p>That, clean beside all modern precedent,</p>\n<p>He wills me to behold his kingly state,</p>\n<p>From me conceal not who thou wast, ere death</p>\n<p>Had loos&rsquo;d thee; but instruct me: and instruct</p>\n<p>If rightly to the pass I tend; thy words</p>\n<p>The way directing as a safe escort.&rdquo;</p>\n<p class="slindent">&ldquo;I was of Lombardy, and Marco call&rsquo;d:</p>\n<p>Not inexperienc&rsquo;d of the world, that worth</p>\n<p>I still affected, from which all have turn&rsquo;d</p>\n<p>The nerveless bow aside. Thy course tends right</p>\n<p>Unto the summit:&rdquo; and, replying thus,</p>\n<p>He added, &ldquo;I beseech thee pray for me,</p>\n<p>When thou shalt come aloft.&rdquo; And I to him:</p>\n<p>&ldquo;Accept my faith for pledge I will perform</p>\n<p>What thou requirest. Yet one doubt remains,</p>\n<p>That wrings me sorely, if I solve it not,</p>\n<p>Singly before it urg&rsquo;d me, doubled now</p>\n<p>By thine opinion, when I couple that</p>\n<p>With one elsewhere declar&rsquo;d, each strength&rsquo;ning other.</p>\n<p>The world indeed is even so forlorn</p>\n<p>Of all good as thou speak&rsquo;st it and so swarms</p>\n<p>With every evil. Yet, beseech thee, point</p>\n<p>The cause out to me, that myself may see,</p>\n<p>And unto others show it: for in heaven</p>\n<p>One places it, and one on earth below.&rdquo;</p>\n<p class="slindent">Then heaving forth a deep and audible sigh,</p>\n<p>&ldquo;Brother!&rdquo; he thus began, &ldquo;the world is blind;</p>\n<p>And thou in truth com&rsquo;st from it. Ye, who live,</p>\n<p>Do so each cause refer to heav&rsquo;n above,</p>\n<p>E&rsquo;en as its motion of necessity</p>\n<p>Drew with it all that moves. If this were so,</p>\n<p>Free choice in you were none; nor justice would</p>\n<p>There should be joy for virtue, woe for ill.</p>\n<p>Your movements have their primal bent from heaven;</p>\n<p>Not all; yet said I all; what then ensues?</p>\n<p>Light have ye still to follow evil or good,</p>\n<p>And of the will free power, which, if it stand</p>\n<p>Firm and unwearied in Heav&rsquo;n&rsquo;s first assay,</p>\n<p>Conquers at last, so it be cherish&rsquo;d well,</p>\n<p>Triumphant over all. To mightier force,</p>\n<p>To better nature subject, ye abide</p>\n<p>Free, not constrain&rsquo;d by that, which forms in you</p>\n<p>The reasoning mind uninfluenc&rsquo;d of the stars.</p>\n<p>If then the present race of mankind err,</p>\n<p>Seek in yourselves the cause, and find it there.</p>\n<p>Herein thou shalt confess me no false spy.</p>\n<p class="slindent">&ldquo;Forth from his plastic hand, who charm&rsquo;d beholds</p>\n<p>Her image ere she yet exist, the soul</p>\n<p>Comes like a babe, that wantons sportively</p>\n<p>Weeping and laughing in its wayward moods,</p>\n<p>As artless and as ignorant of aught,</p>\n<p>Save that her Maker being one who dwells</p>\n<p>With gladness ever, willingly she turns</p>\n<p>To whate&rsquo;er yields her joy. Of some slight good</p>\n<p>The flavour soon she tastes; and, snar&rsquo;d by that,</p>\n<p>With fondness she pursues it, if no guide</p>\n<p>Recall, no rein direct her wand&rsquo;ring course.</p>\n<p>Hence it behov&rsquo;d, the law should be a curb;</p>\n<p>A sovereign hence behov&rsquo;d, whose piercing view</p>\n<p>Might mark at least the fortress and main tower</p>\n<p>Of the true city. Laws indeed there are:</p>\n<p>But who is he observes them? None; not he,</p>\n<p>Who goes before, the shepherd of the flock,</p>\n<p>Who chews the cud but doth not cleave the hoof.</p>\n<p>Therefore the multitude, who see their guide</p>\n<p>Strike at the very good they covet most,</p>\n<p>Feed there and look no further. Thus the cause</p>\n<p>Is not corrupted nature in yourselves,</p>\n<p>But ill-conducting, that hath turn&rsquo;d the world</p>\n<p>To evil. Rome, that turn&rsquo;d it unto good,</p>\n<p>Was wont to boast two suns, whose several beams</p>\n<p>Cast light on either way, the world&rsquo;s and God&rsquo;s.</p>\n<p>One since hath quench&rsquo;d the other; and the sword</p>\n<p>Is grafted on the crook; and so conjoin&rsquo;d</p>\n<p>Each must perforce decline to worse, unaw&rsquo;d</p>\n<p>By fear of other. If thou doubt me, mark</p>\n<p>The blade: each herb is judg&rsquo;d of by its seed.</p>\n<p>That land, through which Adice and the Po</p>\n<p>Their waters roll, was once the residence</p>\n<p>Of courtesy and velour, ere the day,</p>\n<p>That frown&rsquo;d on Frederick; now secure may pass</p>\n<p>Those limits, whosoe&rsquo;er hath left, for shame,</p>\n<p>To talk with good men, or come near their haunts.</p>\n<p>Three aged ones are still found there, in whom</p>\n<p>The old time chides the new: these deem it long</p>\n<p>Ere God restore them to a better world:</p>\n<p>The good Gherardo, of Palazzo he</p>\n<p>Conrad, and Guido of Castello, nam&rsquo;d</p>\n<p>In Gallic phrase more fitly the plain Lombard.</p>\n<p>On this at last conclude. The church of Rome,</p>\n<p>Mixing two governments that ill assort,</p>\n<p>Hath miss&rsquo;d her footing, fall&rsquo;n into the mire,</p>\n<p>And there herself and burden much defil&rsquo;d.&rdquo;</p>\n<p class="slindent">&ldquo;O Marco!&rdquo; I replied, shine arguments</p>\n<p>Convince me: and the cause I now discern</p>\n<p>Why of the heritage no portion came</p>\n<p>To Levi&rsquo;s offspring. But resolve me this</p>\n<p>Who that Gherardo is, that as thou sayst</p>\n<p>Is left a sample of the perish&rsquo;d race,</p>\n<p>And for rebuke to this untoward age?&rdquo;</p>\n<p class="slindent">&ldquo;Either thy words,&rdquo; said he, &ldquo;deceive; or else</p>\n<p>Are meant to try me; that thou, speaking Tuscan,</p>\n<p>Appear&rsquo;st not to have heard of good Gherado;</p>\n<p>The sole addition that, by which I know him;</p>\n<p>Unless I borrow&rsquo;d from his daughter Gaia</p>\n<p>Another name to grace him. God be with you.</p>\n<p>I bear you company no more. Behold</p>\n<p>The dawn with white ray glimm&rsquo;ring through the mist.</p>\n<p>I must away&mdash;the angel comes&mdash;ere he</p>\n<p>Appear.&rdquo; He said, and would not hear me more.</p>\n</div>','<p class="cantohead">Canto XVII</p>\n<div class="stanza"><p>Call to remembrance, reader, if thou e&rsquo;er</p>\n<p>Hast, on a mountain top, been ta&rsquo;en by cloud,</p>\n<p>Through which thou saw&rsquo;st no better, than the mole</p>\n<p>Doth through opacous membrane; then, whene&rsquo;er</p>\n<p>The wat&rsquo;ry vapours dense began to melt</p>\n<p>Into thin air, how faintly the sun&rsquo;s sphere</p>\n<p>Seem&rsquo;d wading through them; so thy nimble thought</p>\n<p>May image, how at first I re-beheld</p>\n<p>The sun, that bedward now his couch o&rsquo;erhung.</p>\n<p class="slindent">Thus with my leader&rsquo;s feet still equaling pace</p>\n<p>From forth that cloud I came, when now expir&rsquo;d</p>\n<p>The parting beams from off the nether shores.</p>\n<p class="slindent">O quick and forgetive power! that sometimes dost</p>\n<p>So rob us of ourselves, we take no mark</p>\n<p>Though round about us thousand trumpets clang!</p>\n<p>What moves thee, if the senses stir not? Light</p>\n<p>Kindled in heav&rsquo;n, spontaneous, self-inform&rsquo;d,</p>\n<p>Or likelier gliding down with swift illapse</p>\n<p>By will divine. Portray&rsquo;d before me came</p>\n<p>The traces of her dire impiety,</p>\n<p>Whose form was chang&rsquo;d into the bird, that most</p>\n<p>Delights itself in song: and here my mind</p>\n<p>Was inwardly so wrapt, it gave no place</p>\n<p>To aught that ask&rsquo;d admittance from without.</p>\n<p class="slindent">Next shower&rsquo;d into my fantasy a shape</p>\n<p>As of one crucified, whose visage spake</p>\n<p>Fell rancour, malice deep, wherein he died;</p>\n<p>And round him Ahasuerus the great king,</p>\n<p>Esther his bride, and Mordecai the just,</p>\n<p>Blameless in word and deed. As of itself</p>\n<p>That unsubstantial coinage of the brain</p>\n<p>Burst, like a bubble, Which the water fails</p>\n<p>That fed it; in my vision straight uprose</p>\n<p>A damsel weeping loud, and cried, &ldquo;O queen!</p>\n<p>O mother! wherefore has intemperate ire</p>\n<p>Driv&rsquo;n thee to loath thy being? Not to lose</p>\n<p>Lavinia, desp&rsquo;rate thou hast slain thyself.</p>\n<p>Now hast thou lost me. I am she, whose tears</p>\n<p>Mourn, ere I fall, a mother&rsquo;s timeless end.&rdquo;</p>\n<p class="slindent">E&rsquo;en as a sleep breaks off, if suddenly</p>\n<p>New radiance strike upon the closed lids,</p>\n<p>The broken slumber quivering ere it dies;</p>\n<p>Thus from before me sunk that imagery</p>\n<p>Vanishing, soon as on my face there struck</p>\n<p>The light, outshining far our earthly beam.</p>\n<p>As round I turn&rsquo;d me to survey what place</p>\n<p>I had arriv&rsquo;d at, &ldquo;Here ye mount,&rdquo; exclaim&rsquo;d</p>\n<p>A voice, that other purpose left me none,</p>\n<p>Save will so eager to behold who spake,</p>\n<p>I could not choose but gaze. As &rsquo;fore the sun,</p>\n<p>That weighs our vision down, and veils his form</p>\n<p>In light transcendent, thus my virtue fail&rsquo;d</p>\n<p>Unequal. &ldquo;This is Spirit from above,</p>\n<p>Who marshals us our upward way, unsought;</p>\n<p>And in his own light shrouds him;. As a man</p>\n<p>Doth for himself, so now is done for us.</p>\n<p>For whoso waits imploring, yet sees need</p>\n<p>Of his prompt aidance, sets himself prepar&rsquo;d</p>\n<p>For blunt denial, ere the suit be made.</p>\n<p>Refuse we not to lend a ready foot</p>\n<p>At such inviting: haste we to ascend,</p>\n<p>Before it darken: for we may not then,</p>\n<p>Till morn again return.&rdquo; So spake my guide;</p>\n<p>And to one ladder both address&rsquo;d our steps;</p>\n<p>And the first stair approaching, I perceiv&rsquo;d</p>\n<p>Near me as &rsquo;twere the waving of a wing,</p>\n<p>That fann&rsquo;d my face and whisper&rsquo;d: &ldquo;Blessed they</p>\n<p>The peacemakers: they know not evil wrath.&rdquo;</p>\n<p class="slindent">Now to such height above our heads were rais&rsquo;d</p>\n<p>The last beams, follow&rsquo;d close by hooded night,</p>\n<p>That many a star on all sides through the gloom</p>\n<p>Shone out. &ldquo;Why partest from me, O my strength?&rdquo;</p>\n<p>So with myself I commun&rsquo;d; for I felt</p>\n<p>My o&rsquo;ertoil&rsquo;d sinews slacken. We had reach&rsquo;d</p>\n<p>The summit, and were fix&rsquo;d like to a bark</p>\n<p>Arriv&rsquo;d at land. And waiting a short space,</p>\n<p>If aught should meet mine ear in that new round,</p>\n<p>Then to my guide I turn&rsquo;d, and said: &ldquo;Lov&rsquo;d sire!</p>\n<p>Declare what guilt is on this circle purg&rsquo;d.</p>\n<p>If our feet rest, no need thy speech should pause.&rdquo;</p>\n<p class="slindent">He thus to me: &ldquo;The love of good, whate&rsquo;er</p>\n<p>Wanted of just proportion, here fulfils.</p>\n<p>Here plies afresh the oar, that loiter&rsquo;d ill.</p>\n<p>But that thou mayst yet clearlier understand,</p>\n<p>Give ear unto my words, and thou shalt cull</p>\n<p>Some fruit may please thee well, from this delay.</p>\n<p class="slindent">&ldquo;Creator, nor created being, ne&rsquo;er,</p>\n<p>My son,&rdquo; he thus began, &ldquo;was without love,</p>\n<p>Or natural, or the free spirit&rsquo;s growth.</p>\n<p>Thou hast not that to learn. The natural still</p>\n<p>Is without error; but the other swerves,</p>\n<p>If on ill object bent, or through excess</p>\n<p>Of vigour, or defect. While e&rsquo;er it seeks</p>\n<p>The primal blessings, or with measure due</p>\n<p>Th&rsquo; inferior, no delight, that flows from it,</p>\n<p>Partakes of ill. But let it warp to evil,</p>\n<p>Or with more ardour than behooves, or less.</p>\n<p>Pursue the good, the thing created then</p>\n<p>Works &rsquo;gainst its Maker. Hence thou must infer</p>\n<p>That love is germin of each virtue in ye,</p>\n<p>And of each act no less, that merits pain.</p>\n<p>Now since it may not be, but love intend</p>\n<p>The welfare mainly of the thing it loves,</p>\n<p>All from self-hatred are secure; and since</p>\n<p>No being can be thought t&rsquo; exist apart</p>\n<p>And independent of the first, a bar</p>\n<p>Of equal force restrains from hating that.</p>\n<p class="slindent">&ldquo;Grant the distinction just; and it remains</p>\n<p>The&rsquo; evil must be another&rsquo;s, which is lov&rsquo;d.</p>\n<p>Three ways such love is gender&rsquo;d in your clay.</p>\n<p>There is who hopes (his neighbour&rsquo;s worth deprest,)</p>\n<p>Preeminence himself, and coverts hence</p>\n<p>For his own greatness that another fall.</p>\n<p>There is who so much fears the loss of power,</p>\n<p>Fame, favour, glory (should his fellow mount</p>\n<p>Above him), and so sickens at the thought,</p>\n<p>He loves their opposite: and there is he,</p>\n<p>Whom wrong or insult seems to gall and shame</p>\n<p>That he doth thirst for vengeance, and such needs</p>\n<p>Must doat on other&rsquo;s evil. Here beneath</p>\n<p>This threefold love is mourn&rsquo;d. Of th&rsquo; other sort</p>\n<p>Be now instructed, that which follows good</p>\n<p>But with disorder&rsquo;d and irregular course.</p>\n<p class="slindent">&ldquo;All indistinctly apprehend a bliss</p>\n<p>On which the soul may rest, the hearts of all</p>\n<p>Yearn after it, and to that wished bourn</p>\n<p>All therefore strive to tend. If ye behold</p>\n<p>Or seek it with a love remiss and lax,</p>\n<p>This cornice after just repenting lays</p>\n<p>Its penal torment on ye. Other good</p>\n<p>There is, where man finds not his happiness:</p>\n<p>It is not true fruition, not that blest</p>\n<p>Essence, of every good the branch and root.</p>\n<p>The love too lavishly bestow&rsquo;d on this,</p>\n<p>Along three circles over us, is mourn&rsquo;d.</p>\n<p>Account of that division tripartite</p>\n<p>Expect not, fitter for thine own research.</p>\n</div>','<p class="cantohead">Canto XVIII</p>\n<div class="stanza"><p>The teacher ended, and his high discourse</p>\n<p>Concluding, earnest in my looks inquir&rsquo;d</p>\n<p>If I appear&rsquo;d content; and I, whom still</p>\n<p>Unsated thirst to hear him urg&rsquo;d, was mute,</p>\n<p>Mute outwardly, yet inwardly I said:</p>\n<p>&ldquo;Perchance my too much questioning offends</p>\n<p>But he, true father, mark&rsquo;d the secret wish</p>\n<p>By diffidence restrain&rsquo;d, and speaking, gave</p>\n<p>Me boldness thus to speak: &ldquo;Master, my Sight</p>\n<p>Gathers so lively virtue from thy beams,</p>\n<p>That all, thy words convey, distinct is seen.</p>\n<p>Wherefore I pray thee, father, whom this heart</p>\n<p>Holds dearest! thou wouldst deign by proof t&rsquo; unfold</p>\n<p>That love, from which as from their source thou bring&rsquo;st</p>\n<p>All good deeds and their opposite.&rdquo; He then:</p>\n<p>&ldquo;To what I now disclose be thy clear ken</p>\n<p>Directed, and thou plainly shalt behold</p>\n<p>How much those blind have err&rsquo;d, who make themselves</p>\n<p>The guides of men. The soul, created apt</p>\n<p>To love, moves versatile which way soe&rsquo;er</p>\n<p>Aught pleasing prompts her, soon as she is wak&rsquo;d</p>\n<p>By pleasure into act. Of substance true</p>\n<p>Your apprehension forms its counterfeit,</p>\n<p>And in you the ideal shape presenting</p>\n<p>Attracts the soul&rsquo;s regard. If she, thus drawn,</p>\n<p>incline toward it, love is that inclining,</p>\n<p>And a new nature knit by pleasure in ye.</p>\n<p>Then as the fire points up, and mounting seeks</p>\n<p>His birth-place and his lasting seat, e&rsquo;en thus</p>\n<p>Enters the captive soul into desire,</p>\n<p>Which is a spiritual motion, that ne&rsquo;er rests</p>\n<p>Before enjoyment of the thing it loves.</p>\n<p>Enough to show thee, how the truth from those</p>\n<p>Is hidden, who aver all love a thing</p>\n<p>Praise-worthy in itself: although perhaps</p>\n<p>Its substance seem still good. Yet if the wax</p>\n<p>Be good, it follows not th&rsquo; impression must.&rdquo;</p>\n<p>&ldquo;What love is,&rdquo; I return&rsquo;d, &ldquo;thy words, O guide!</p>\n<p>And my own docile mind, reveal. Yet thence</p>\n<p>New doubts have sprung. For from without if love</p>\n<p>Be offer&rsquo;d to us, and the spirit knows</p>\n<p>No other footing, tend she right or wrong,</p>\n<p>Is no desert of hers.&rdquo; He answering thus:</p>\n<p>&ldquo;What reason here discovers I have power</p>\n<p>To show thee: that which lies beyond, expect</p>\n<p>From Beatrice, faith not reason&rsquo;s task.</p>\n<p>Spirit, substantial form, with matter join&rsquo;d</p>\n<p>Not in confusion mix&rsquo;d, hath in itself</p>\n<p>Specific virtue of that union born,</p>\n<p>Which is not felt except it work, nor prov&rsquo;d</p>\n<p>But through effect, as vegetable life</p>\n<p>By the green leaf. From whence his intellect</p>\n<p>Deduced its primal notices of things,</p>\n<p>Man therefore knows not, or his appetites</p>\n<p>Their first affections; such in you, as zeal</p>\n<p>In bees to gather honey; at the first,</p>\n<p>Volition, meriting nor blame nor praise.</p>\n<p>But o&rsquo;er each lower faculty supreme,</p>\n<p>That as she list are summon&rsquo;d to her bar,</p>\n<p>Ye have that virtue in you, whose just voice</p>\n<p>Uttereth counsel, and whose word should keep</p>\n<p>The threshold of assent. Here is the source,</p>\n<p>Whence cause of merit in you is deriv&rsquo;d,</p>\n<p>E&rsquo;en as the affections good or ill she takes,</p>\n<p>Or severs, winnow&rsquo;d as the chaff. Those men</p>\n<p>Who reas&rsquo;ning went to depth profoundest, mark&rsquo;d</p>\n<p>That innate freedom, and were thence induc&rsquo;d</p>\n<p>To leave their moral teaching to the world.</p>\n<p>Grant then, that from necessity arise</p>\n<p>All love that glows within you; to dismiss</p>\n<p>Or harbour it, the pow&rsquo;r is in yourselves.</p>\n<p>Remember, Beatrice, in her style,</p>\n<p>Denominates free choice by eminence</p>\n<p>The noble virtue, if in talk with thee</p>\n<p>She touch upon that theme.&rdquo; The moon, well nigh</p>\n<p>To midnight hour belated, made the stars</p>\n<p>Appear to wink and fade; and her broad disk</p>\n<p>Seem&rsquo;d like a crag on fire, as up the vault</p>\n<p>That course she journey&rsquo;d, which the sun then warms,</p>\n<p>When they of Rome behold him at his set.</p>\n<p>Betwixt Sardinia and the Corsic isle.</p>\n<p>And now the weight, that hung upon my thought,</p>\n<p>Was lighten&rsquo;d by the aid of that clear spirit,</p>\n<p>Who raiseth Andes above Mantua&rsquo;s name.</p>\n<p>I therefore, when my questions had obtain&rsquo;d</p>\n<p>Solution plain and ample, stood as one</p>\n<p>Musing in dreary slumber; but not long</p>\n<p>Slumber&rsquo;d; for suddenly a multitude,</p>\n<p>The steep already turning, from behind,</p>\n<p>Rush&rsquo;d on. With fury and like random rout,</p>\n<p>As echoing on their shores at midnight heard</p>\n<p>Ismenus and Asopus, for his Thebes</p>\n<p>If Bacchus&rsquo; help were needed; so came these</p>\n<p>Tumultuous, curving each his rapid step,</p>\n<p>By eagerness impell&rsquo;d of holy love.</p>\n<p class="slindent">Soon they o&rsquo;ertook us; with such swiftness mov&rsquo;d</p>\n<p>The mighty crowd. Two spirits at their head</p>\n<p>Cried weeping; &ldquo;Blessed Mary sought with haste</p>\n<p>The hilly region. Caesar to subdue</p>\n<p>Ilerda, darted in Marseilles his sting,</p>\n<p>And flew to Spain.&rdquo;&mdash;&ldquo;Oh tarry not: away;&rdquo;</p>\n<p>The others shouted; &ldquo;let not time be lost</p>\n<p>Through slackness of affection. Hearty zeal</p>\n<p>To serve reanimates celestial grace.&rdquo;</p>\n<p class="slindent">&ldquo;O ye, in whom intenser fervency</p>\n<p>Haply supplies, where lukewarm erst ye fail&rsquo;d,</p>\n<p>Slow or neglectful, to absolve your part</p>\n<p>Of good and virtuous, this man, who yet lives,</p>\n<p>(Credit my tale, though strange) desires t&rsquo; ascend,</p>\n<p>So morning rise to light us. Therefore say</p>\n<p>Which hand leads nearest to the rifted rock?&rdquo;</p>\n<p class="slindent">So spake my guide, to whom a shade return&rsquo;d:</p>\n<p>&ldquo;Come after us, and thou shalt find the cleft.</p>\n<p>We may not linger: such resistless will</p>\n<p>Speeds our unwearied course. Vouchsafe us then</p>\n<p>Thy pardon, if our duty seem to thee</p>\n<p>Discourteous rudeness. In Verona I</p>\n<p>Was abbot of San Zeno, when the hand</p>\n<p>Of Barbarossa grasp&rsquo;d Imperial sway,</p>\n<p>That name, ne&rsquo;er utter&rsquo;d without tears in Milan.</p>\n<p>And there is he, hath one foot in his grave,</p>\n<p>Who for that monastery ere long shall weep,</p>\n<p>Ruing his power misus&rsquo;d: for that his son,</p>\n<p>Of body ill compact, and worse in mind,</p>\n<p>And born in evil, he hath set in place</p>\n<p>Of its true pastor.&rdquo; Whether more he spake,</p>\n<p>Or here was mute, I know not: he had sped</p>\n<p>E&rsquo;en now so far beyond us. Yet thus much</p>\n<p>I heard, and in rememb&rsquo;rance treasur&rsquo;d it.</p>\n<p class="slindent">He then, who never fail&rsquo;d me at my need,</p>\n<p>Cried, &ldquo;Hither turn. Lo! two with sharp remorse</p>\n<p>Chiding their sin!&rdquo; In rear of all the troop</p>\n<p>These shouted: &ldquo;First they died, to whom the sea</p>\n<p>Open&rsquo;d, or ever Jordan saw his heirs:</p>\n<p>And they, who with Aeneas to the end</p>\n<p>Endur&rsquo;d not suffering, for their portion chose</p>\n<p>Life without glory.&rdquo; Soon as they had fled</p>\n<p>Past reach of sight, new thought within me rose</p>\n<p>By others follow&rsquo;d fast, and each unlike</p>\n<p>Its fellow: till led on from thought to thought,</p>\n<p>And pleasur&rsquo;d with the fleeting train, mine eye</p>\n<p>Was clos&rsquo;d, and meditation chang&rsquo;d to dream.</p>\n</div>','<p class="cantohead">Canto XIX</p>\n<div class="stanza"><p>It was the hour, when of diurnal heat</p>\n<p>No reliques chafe the cold beams of the moon,</p>\n<p>O&rsquo;erpower&rsquo;d by earth, or planetary sway</p>\n<p>Of Saturn; and the geomancer sees</p>\n<p>His Greater Fortune up the east ascend,</p>\n<p>Where gray dawn checkers first the shadowy cone;</p>\n<p>When &rsquo;fore me in my dream a woman&rsquo;s shape</p>\n<p>There came, with lips that stammer&rsquo;d, eyes aslant,</p>\n<p>Distorted feet, hands maim&rsquo;d, and colour pale.</p>\n<p class="slindent">I look&rsquo;d upon her; and as sunshine cheers</p>\n<p>Limbs numb&rsquo;d by nightly cold, e&rsquo;en thus my look</p>\n<p>Unloos&rsquo;d her tongue, next in brief space her form</p>\n<p>Decrepit rais&rsquo;d erect, and faded face</p>\n<p>With love&rsquo;s own hue illum&rsquo;d. Recov&rsquo;ring speech</p>\n<p>She forthwith warbling such a strain began,</p>\n<p>That I, how loth soe&rsquo;er, could scarce have held</p>\n<p>Attention from the song. &ldquo;I,&rdquo; thus she sang,</p>\n<p>&ldquo;I am the Siren, she, whom mariners</p>\n<p>On the wide sea are wilder&rsquo;d when they hear:</p>\n<p>Such fulness of delight the list&rsquo;ner feels.</p>\n<p>I from his course Ulysses by my lay</p>\n<p>Enchanted drew. Whoe&rsquo;er frequents me once</p>\n<p>Parts seldom; so I charm him, and his heart</p>\n<p>Contented knows no void.&rdquo; Or ere her mouth</p>\n<p>Was clos&rsquo;d, to shame her at her side appear&rsquo;d</p>\n<p>A dame of semblance holy. With stern voice</p>\n<p>She utter&rsquo;d; &ldquo;Say, O Virgil, who is this?&rdquo;</p>\n<p>Which hearing, he approach&rsquo;d, with eyes still bent</p>\n<p>Toward that goodly presence: th&rsquo; other seiz&rsquo;d her,</p>\n<p>And, her robes tearing, open&rsquo;d her before,</p>\n<p>And show&rsquo;d the belly to me, whence a smell,</p>\n<p>Exhaling loathsome, wak&rsquo;d me. Round I turn&rsquo;d</p>\n<p>Mine eyes, and thus the teacher: &ldquo;At the least</p>\n<p>Three times my voice hath call&rsquo;d thee. Rise, begone.</p>\n<p>Let us the opening find where thou mayst pass.&rdquo;</p>\n<p class="slindent">I straightway rose. Now day, pour&rsquo;d down from high,</p>\n<p>Fill&rsquo;d all the circuits of the sacred mount;</p>\n<p>And, as we journey&rsquo;d, on our shoulder smote</p>\n<p>The early ray. I follow&rsquo;d, stooping low</p>\n<p>My forehead, as a man, o&rsquo;ercharg&rsquo;d with thought,</p>\n<p>Who bends him to the likeness of an arch,</p>\n<p>That midway spans the flood; when thus I heard,</p>\n<p>&ldquo;Come, enter here,&rdquo; in tone so soft and mild,</p>\n<p>As never met the ear on mortal strand.</p>\n<p class="slindent">With swan-like wings dispread and pointing up,</p>\n<p>Who thus had spoken marshal&rsquo;d us along,</p>\n<p>Where each side of the solid masonry</p>\n<p>The sloping, walls retir&rsquo;d; then mov&rsquo;d his plumes,</p>\n<p>And fanning us, affirm&rsquo;d that those, who mourn,</p>\n<p>Are blessed, for that comfort shall be theirs.</p>\n<p class="slindent">&ldquo;What aileth thee, that still thou look&rsquo;st to earth?&rdquo;</p>\n<p>Began my leader; while th&rsquo; angelic shape</p>\n<p>A little over us his station took.</p>\n<p class="slindent">&ldquo;New vision,&rdquo; I replied, &ldquo;hath rais&rsquo;d in me</p>\n<p>8urmisings strange and anxious doubts, whereon</p>\n<p>My soul intent allows no other thought</p>\n<p>Or room or entrance.&mdash;&ldquo;Hast thou seen,&rdquo; said he,</p>\n<p>&ldquo;That old enchantress, her, whose wiles alone</p>\n<p>The spirits o&rsquo;er us weep for? Hast thou seen</p>\n<p>How man may free him of her bonds? Enough.</p>\n<p>Let thy heels spurn the earth, and thy rais&rsquo;d ken</p>\n<p>Fix on the lure, which heav&rsquo;n&rsquo;s eternal King</p>\n<p>Whirls in the rolling spheres.&rdquo; As on his feet</p>\n<p>The falcon first looks down, then to the sky</p>\n<p>Turns, and forth stretches eager for the food,</p>\n<p>That woos him thither; so the call I heard,</p>\n<p>So onward, far as the dividing rock</p>\n<p>Gave way, I journey&rsquo;d, till the plain was reach&rsquo;d.</p>\n<p class="slindent">On the fifth circle when I stood at large,</p>\n<p>A race appear&rsquo;d before me, on the ground</p>\n<p>All downward lying prone and weeping sore.</p>\n<p>&ldquo;My soul hath cleaved to the dust,&rdquo; I heard</p>\n<p>With sighs so deep, they well nigh choak&rsquo;d the words.</p>\n<p>&ldquo;O ye elect of God, whose penal woes</p>\n<p>Both hope and justice mitigate, direct</p>\n<p>Tow&rsquo;rds the steep rising our uncertain way.&rdquo;</p>\n<p class="slindent">&ldquo;If ye approach secure from this our doom,</p>\n<p>Prostration&mdash;and would urge your course with speed,</p>\n<p>See that ye still to rightward keep the brink.&rdquo;</p>\n<p class="slindent">So them the bard besought; and such the words,</p>\n<p>Beyond us some short space, in answer came.</p>\n<p class="slindent">I noted what remain&rsquo;d yet hidden from them:</p>\n<p>Thence to my liege&rsquo;s eyes mine eyes I bent,</p>\n<p>And he, forthwith interpreting their suit,</p>\n<p>Beckon&rsquo;d his glad assent. Free then to act,</p>\n<p>As pleas&rsquo;d me, I drew near, and took my stand</p>\n<p>O&rsquo;er that shade, whose words I late had mark&rsquo;d.</p>\n<p>And, &ldquo;Spirit!&rdquo; I said, &ldquo;in whom repentant tears</p>\n<p>Mature that blessed hour, when thou with God</p>\n<p>Shalt find acceptance, for a while suspend</p>\n<p>For me that mightier care. Say who thou wast,</p>\n<p>Why thus ye grovel on your bellies prone,</p>\n<p>And if in aught ye wish my service there,</p>\n<p>Whence living I am come.&rdquo; He answering spake</p>\n<p>&ldquo;The cause why Heav&rsquo;n our back toward his cope</p>\n<p>Reverses, shalt thou know: but me know first</p>\n<p>The successor of Peter, and the name</p>\n<p>And title of my lineage from that stream,</p>\n<p>That&rsquo; twixt Chiaveri and Siestri draws</p>\n<p>His limpid waters through the lowly glen.</p>\n<p>A month and little more by proof I learnt,</p>\n<p>With what a weight that robe of sov&rsquo;reignty</p>\n<p>Upon his shoulder rests, who from the mire</p>\n<p>Would guard it: that each other fardel seems</p>\n<p>But feathers in the balance. Late, alas!</p>\n<p>Was my conversion: but when I became</p>\n<p>Rome&rsquo;s pastor, I discern&rsquo;d at once the dream</p>\n<p>And cozenage of life, saw that the heart</p>\n<p>Rested not there, and yet no prouder height</p>\n<p>Lur&rsquo;d on the climber: wherefore, of that life</p>\n<p>No more enamour&rsquo;d, in my bosom love</p>\n<p>Of purer being kindled. For till then</p>\n<p>I was a soul in misery, alienate</p>\n<p>From God, and covetous of all earthly things;</p>\n<p>Now, as thou seest, here punish&rsquo;d for my doting.</p>\n<p>Such cleansing from the taint of avarice</p>\n<p>Do spirits converted need. This mount inflicts</p>\n<p>No direr penalty. E&rsquo;en as our eyes</p>\n<p>Fasten&rsquo;d below, nor e&rsquo;er to loftier clime</p>\n<p>Were lifted, thus hath justice level&rsquo;d us</p>\n<p>Here on the earth. As avarice quench&rsquo;d our love</p>\n<p>Of good, without which is no working, thus</p>\n<p>Here justice holds us prison&rsquo;d, hand and foot</p>\n<p>Chain&rsquo;d down and bound, while heaven&rsquo;s just Lord shall please.</p>\n<p>So long to tarry motionless outstretch&rsquo;d.&rdquo;</p>\n<p class="slindent">My knees I stoop&rsquo;d, and would have spoke; but he,</p>\n<p>Ere my beginning, by his ear perceiv&rsquo;d</p>\n<p>I did him reverence; and &ldquo;What cause,&rdquo; said he,</p>\n<p>&ldquo;Hath bow&rsquo;d thee thus!&rdquo;&mdash;&ldquo;Compunction,&rdquo; I rejoin&rsquo;d.</p>\n<p>&ldquo;And inward awe of your high dignity.&rdquo;</p>\n<p class="slindent">&ldquo;Up,&rdquo; he exclaim&rsquo;d, &ldquo;brother! upon thy feet</p>\n<p>Arise: err not: thy fellow servant I,</p>\n<p>(Thine and all others&rsquo;) of one Sovran Power.</p>\n<p>If thou hast ever mark&rsquo;d those holy sounds</p>\n<p>Of gospel truth, &rsquo;nor shall be given ill marriage,&rsquo;</p>\n<p>Thou mayst discern the reasons of my speech.</p>\n<p>Go thy ways now; and linger here no more.</p>\n<p>Thy tarrying is a let unto the tears,</p>\n<p>With which I hasten that whereof thou spak&rsquo;st.</p>\n<p>I have on earth a kinswoman; her name</p>\n<p>Alagia, worthy in herself, so ill</p>\n<p>Example of our house corrupt her not:</p>\n<p>And she is all remaineth of me there.&rdquo;</p>\n</div>','<p class="cantohead">Canto XX</p>\n<div class="stanza"><p>Ill strives the will, &rsquo;gainst will more wise that strives</p>\n<p>His pleasure therefore to mine own preferr&rsquo;d,</p>\n<p>I drew the sponge yet thirsty from the wave.</p>\n<p class="slindent">Onward I mov&rsquo;d: he also onward mov&rsquo;d,</p>\n<p>Who led me, coasting still, wherever place</p>\n<p>Along the rock was vacant, as a man</p>\n<p>Walks near the battlements on narrow wall.</p>\n<p>For those on th&rsquo; other part, who drop by drop</p>\n<p>Wring out their all-infecting malady,</p>\n<p>Too closely press the verge. Accurst be thou!</p>\n<p>Inveterate wolf! whose gorge ingluts more prey,</p>\n<p>Than every beast beside, yet is not fill&rsquo;d!</p>\n<p>So bottomless thy maw! &mdash;Ye spheres of heaven!</p>\n<p>To whom there are, as seems, who attribute</p>\n<p>All change in mortal state, when is the day</p>\n<p>Of his appearing, for whom fate reserves</p>\n<p>To chase her hence? &mdash;With wary steps and slow</p>\n<p>We pass&rsquo;d; and I attentive to the shades,</p>\n<p>Whom piteously I heard lament and wail;</p>\n<p>And, &rsquo;midst the wailing, one before us heard</p>\n<p>Cry out &ldquo;O blessed Virgin!&rdquo; as a dame</p>\n<p>In the sharp pangs of childbed; and &ldquo;How poor</p>\n<p>Thou wast,&rdquo; it added, &ldquo;witness that low roof</p>\n<p>Where thou didst lay thy sacred burden down.</p>\n<p>O good Fabricius! thou didst virtue choose</p>\n<p>With poverty, before great wealth with vice.&rdquo;</p>\n<p class="slindent">The words so pleas&rsquo;d me, that desire to know</p>\n<p>The spirit, from whose lip they seem&rsquo;d to come,</p>\n<p>Did draw me onward. Yet it spake the gift</p>\n<p>Of Nicholas, which on the maidens he</p>\n<p>Bounteous bestow&rsquo;d, to save their youthful prime</p>\n<p>Unblemish&rsquo;d. &ldquo;Spirit! who dost speak of deeds</p>\n<p>So worthy, tell me who thou was,&rdquo; I said,</p>\n<p>&ldquo;And why thou dost with single voice renew</p>\n<p>Memorial of such praise. That boon vouchsaf&rsquo;d</p>\n<p>Haply shall meet reward; if I return</p>\n<p>To finish the Short pilgrimage of life,</p>\n<p>Still speeding to its close on restless wing.&rdquo;</p>\n<p class="slindent">&ldquo;I,&rdquo; answer&rsquo;d he, &ldquo;will tell thee, not for hell,</p>\n<p>Which thence I look for; but that in thyself</p>\n<p>Grace so exceeding shines, before thy time</p>\n<p>Of mortal dissolution. I was root</p>\n<p>Of that ill plant, whose shade such poison sheds</p>\n<p>O&rsquo;er all the Christian land, that seldom thence</p>\n<p>Good fruit is gather&rsquo;d. Vengeance soon should come,</p>\n<p>Had Ghent and Douay, Lille and Bruges power;</p>\n<p>And vengeance I of heav&rsquo;n&rsquo;s great Judge implore.</p>\n<p>Hugh Capet was I high: from me descend</p>\n<p>The Philips and the Louis, of whom France</p>\n<p>Newly is govern&rsquo;d; born of one, who ply&rsquo;d</p>\n<p>The slaughterer&rsquo;s trade at Paris. When the race</p>\n<p>Of ancient kings had vanish&rsquo;d (all save one</p>\n<p>Wrapt up in sable weeds) within my gripe</p>\n<p>I found the reins of empire, and such powers</p>\n<p>Of new acquirement, with full store of friends,</p>\n<p>That soon the widow&rsquo;d circlet of the crown</p>\n<p>Was girt upon the temples of my son,</p>\n<p>He, from whose bones th&rsquo; anointed race begins.</p>\n<p>Till the great dower of Provence had remov&rsquo;d</p>\n<p>The stains, that yet obscur&rsquo;d our lowly blood,</p>\n<p>Its sway indeed was narrow, but howe&rsquo;er</p>\n<p>It wrought no evil: there, with force and lies,</p>\n<p>Began its rapine; after, for amends,</p>\n<p>Poitou it seiz&rsquo;d, Navarre and Gascony.</p>\n<p>To Italy came Charles, and for amends</p>\n<p>Young Conradine an innocent victim slew,</p>\n<p>And sent th&rsquo; angelic teacher back to heav&rsquo;n,</p>\n<p>Still for amends. I see the time at hand,</p>\n<p>That forth from France invites another Charles</p>\n<p>To make himself and kindred better known.</p>\n<p>Unarm&rsquo;d he issues, saving with that lance,</p>\n<p>Which the arch-traitor tilted with; and that</p>\n<p>He carries with so home a thrust, as rives</p>\n<p>The bowels of poor Florence. No increase</p>\n<p>Of territory hence, but sin and shame</p>\n<p>Shall be his guerdon, and so much the more</p>\n<p>As he more lightly deems of such foul wrong.</p>\n<p>I see the other, who a prisoner late</p>\n<p>Had steps on shore, exposing to the mart</p>\n<p>His daughter, whom he bargains for, as do</p>\n<p>The Corsairs for their slaves. O avarice!</p>\n<p>What canst thou more, who hast subdued our blood</p>\n<p>So wholly to thyself, they feel no care</p>\n<p>Of their own flesh? To hide with direr guilt</p>\n<p>Past ill and future, lo! the flower-de-luce</p>\n<p>Enters Alagna! in his Vicar Christ</p>\n<p>Himself a captive, and his mockery</p>\n<p>Acted again! Lo! to his holy lip</p>\n<p>The vinegar and gall once more applied!</p>\n<p>And he &rsquo;twixt living robbers doom&rsquo;d to bleed!</p>\n<p>Lo! the new Pilate, of whose cruelty</p>\n<p>Such violence cannot fill the measure up,</p>\n<p>With no degree to sanction, pushes on</p>\n<p>Into the temple his yet eager sails!</p>\n<p class="slindent">&ldquo;O sovran Master! when shall I rejoice</p>\n<p>To see the vengeance, which thy wrath well-pleas&rsquo;d</p>\n<p>In secret silence broods?&mdash;While daylight lasts,</p>\n<p>So long what thou didst hear of her, sole spouse</p>\n<p>Of the Great Spirit, and on which thou turn&rsquo;dst</p>\n<p>To me for comment, is the general theme</p>\n<p>Of all our prayers: but when it darkens, then</p>\n<p>A different strain we utter, then record</p>\n<p>Pygmalion, whom his gluttonous thirst of gold</p>\n<p>Made traitor, robber, parricide: the woes</p>\n<p>Of Midas, which his greedy wish ensued,</p>\n<p>Mark&rsquo;d for derision to all future times:</p>\n<p>And the fond Achan, how he stole the prey,</p>\n<p>That yet he seems by Joshua&rsquo;s ire pursued.</p>\n<p>Sapphira with her husband next, we blame;</p>\n<p>And praise the forefeet, that with furious ramp</p>\n<p>Spurn&rsquo;d Heliodorus. All the mountain round</p>\n<p>Rings with the infamy of Thracia&rsquo;s king,</p>\n<p>Who slew his Phrygian charge: and last a shout</p>\n<p>Ascends: &ldquo;Declare, O Crassus! for thou know&rsquo;st,</p>\n<p>The flavour of thy gold.&rdquo; The voice of each</p>\n<p>Now high now low, as each his impulse prompts,</p>\n<p>Is led through many a pitch, acute or grave.</p>\n<p>Therefore, not singly, I erewhile rehears&rsquo;d</p>\n<p>That blessedness we tell of in the day:</p>\n<p>But near me none beside his accent rais&rsquo;d.&rdquo;</p>\n<p class="slindent">From him we now had parted, and essay&rsquo;d</p>\n<p>With utmost efforts to surmount the way,</p>\n<p>When I did feel, as nodding to its fall,</p>\n<p>The mountain tremble; whence an icy chill</p>\n<p>Seiz&rsquo;d on me, as on one to death convey&rsquo;d.</p>\n<p>So shook not Delos, when Latona there</p>\n<p>Couch&rsquo;d to bring forth the twin-born eyes of heaven.</p>\n<p class="slindent">Forthwith from every side a shout arose</p>\n<p>So vehement, that suddenly my guide</p>\n<p>Drew near, and cried: &ldquo;Doubt not, while I conduct thee.&rdquo;</p>\n<p>&ldquo;Glory!&rdquo; all shouted (such the sounds mine ear</p>\n<p>Gather&rsquo;d from those, who near me swell&rsquo;d the sounds)</p>\n<p>&ldquo;Glory in the highest be to God.&rdquo; We stood</p>\n<p>Immovably suspended, like to those,</p>\n<p>The shepherds, who first heard in Bethlehem&rsquo;s field</p>\n<p>That song: till ceas&rsquo;d the trembling, and the song</p>\n<p>Was ended: then our hallow&rsquo;d path resum&rsquo;d,</p>\n<p>Eying the prostrate shadows, who renew&rsquo;d</p>\n<p>Their custom&rsquo;d mourning. Never in my breast</p>\n<p>Did ignorance so struggle with desire</p>\n<p>Of knowledge, if my memory do not err,</p>\n<p>As in that moment; nor through haste dar&rsquo;d I</p>\n<p>To question, nor myself could aught discern,</p>\n<p>So on I far&rsquo;d in thoughtfulness and dread.</p>\n</div>','<p class="cantohead">Canto XXI</p>\n<div class="stanza"><p>The natural thirst, ne&rsquo;er quench&rsquo;d but from the well,</p>\n<p>Whereof the woman of Samaria crav&rsquo;d,</p>\n<p>Excited: haste along the cumber&rsquo;d path,</p>\n<p>After my guide, impell&rsquo;d; and pity mov&rsquo;d</p>\n<p>My bosom for the &rsquo;vengeful deed, though just.</p>\n<p>When lo! even as Luke relates, that Christ</p>\n<p>Appear&rsquo;d unto the two upon their way,</p>\n<p>New-risen from his vaulted grave; to us</p>\n<p>A shade appear&rsquo;d, and after us approach&rsquo;d,</p>\n<p>Contemplating the crowd beneath its feet.</p>\n<p>We were not ware of it; so first it spake,</p>\n<p>Saying, &ldquo;God give you peace, my brethren!&rdquo; then</p>\n<p>Sudden we turn&rsquo;d: and Virgil such salute,</p>\n<p>As fitted that kind greeting, gave, and cried:</p>\n<p>&ldquo;Peace in the blessed council be thy lot</p>\n<p>Awarded by that righteous court, which me</p>\n<p>To everlasting banishment exiles!&rdquo;</p>\n<p class="slindent">&ldquo;How!&rdquo; he exclaim&rsquo;d, nor from his speed meanwhile</p>\n<p>Desisting, &ldquo;If that ye be spirits, whom God</p>\n<p>Vouchsafes not room above, who up the height</p>\n<p>Has been thus far your guide?&rdquo; To whom the bard:</p>\n<p>&ldquo;If thou observe the tokens, which this man</p>\n<p>Trac&rsquo;d by the finger of the angel bears,</p>\n<p>&rsquo;Tis plain that in the kingdom of the just</p>\n<p>He needs must share. But sithence she, whose wheel</p>\n<p>Spins day and night, for him not yet had drawn</p>\n<p>That yarn, which, on the fatal distaff pil&rsquo;d,</p>\n<p>Clotho apportions to each wight that breathes,</p>\n<p>His soul, that sister is to mine and thine,</p>\n<p>Not of herself could mount, for not like ours</p>\n<p>Her ken: whence I, from forth the ample gulf</p>\n<p>Of hell was ta&rsquo;en, to lead him, and will lead</p>\n<p>Far as my lore avails. But, if thou know,</p>\n<p>Instruct us for what cause, the mount erewhile</p>\n<p>Thus shook and trembled: wherefore all at once</p>\n<p>Seem&rsquo;d shouting, even from his wave-wash&rsquo;d foot.&rdquo;</p>\n<p class="slindent">That questioning so tallied with my wish,</p>\n<p>The thirst did feel abatement of its edge</p>\n<p>E&rsquo;en from expectance. He forthwith replied,</p>\n<p>&ldquo;In its devotion nought irregular</p>\n<p>This mount can witness, or by punctual rule</p>\n<p>Unsanction&rsquo;d; here from every change exempt.</p>\n<p>Other than that, which heaven in itself</p>\n<p>Doth of itself receive, no influence</p>\n<p>Can reach us. Tempest none, shower, hail or snow,</p>\n<p>Hoar frost or dewy moistness, higher falls</p>\n<p>Than that brief scale of threefold steps: thick clouds</p>\n<p>Nor scudding rack are ever seen: swift glance</p>\n<p>Ne&rsquo;er lightens, nor Thaumantian Iris gleams,</p>\n<p>That yonder often shift on each side heav&rsquo;n.</p>\n<p>Vapour adust doth never mount above</p>\n<p>The highest of the trinal stairs, whereon</p>\n<p>Peter&rsquo;s vicegerent stands. Lower perchance,</p>\n<p>With various motion rock&rsquo;d, trembles the soil:</p>\n<p>But here, through wind in earth&rsquo;s deep hollow pent,</p>\n<p>I know not how, yet never trembled: then</p>\n<p>Trembles, when any spirit feels itself</p>\n<p>So purified, that it may rise, or move</p>\n<p>For rising, and such loud acclaim ensues.</p>\n<p>Purification by the will alone</p>\n<p>Is prov&rsquo;d, that free to change society</p>\n<p>Seizes the soul rejoicing in her will.</p>\n<p>Desire of bliss is present from the first;</p>\n<p>But strong propension hinders, to that wish</p>\n<p>By the just ordinance of heav&rsquo;n oppos&rsquo;d;</p>\n<p>Propension now as eager to fulfil</p>\n<p>Th&rsquo; allotted torment, as erewhile to sin.</p>\n<p>And I who in this punishment had lain</p>\n<p>Five hundred years and more, but now have felt</p>\n<p>Free wish for happier clime. Therefore thou felt&rsquo;st</p>\n<p>The mountain tremble, and the spirits devout</p>\n<p>Heard&rsquo;st, over all his limits, utter praise</p>\n<p>To that liege Lord, whom I entreat their joy</p>\n<p>To hasten.&rdquo; Thus he spake: and since the draught</p>\n<p>Is grateful ever as the thirst is keen,</p>\n<p>No words may speak my fullness of content.</p>\n<p class="slindent">&ldquo;Now,&rdquo; said the instructor sage, &ldquo;I see the net</p>\n<p>That takes ye here, and how the toils are loos&rsquo;d,</p>\n<p>Why rocks the mountain and why ye rejoice.</p>\n<p>Vouchsafe, that from thy lips I next may learn,</p>\n<p>Who on the earth thou wast, and wherefore here</p>\n<p>So many an age wert prostrate.&rdquo;&mdash;&ldquo;In that time,</p>\n<p>When the good Titus, with Heav&rsquo;n&rsquo;s King to help,</p>\n<p>Aveng&rsquo;d those piteous gashes, whence the blood</p>\n<p>By Judas sold did issue, with the name</p>\n<p>Most lasting and most honour&rsquo;d there was I</p>\n<p>Abundantly renown&rsquo;d,&rdquo; the shade reply&rsquo;d,</p>\n<p>&ldquo;Not yet with faith endued. So passing sweet</p>\n<p>My vocal Spirit, from Tolosa, Rome</p>\n<p>To herself drew me, where I merited</p>\n<p>A myrtle garland to inwreathe my brow.</p>\n<p>Statius they name me still. Of Thebes I sang,</p>\n<p>And next of great Achilles: but i&rsquo; th&rsquo; way</p>\n<p>Fell with the second burthen. Of my flame</p>\n<p>Those sparkles were the seeds, which I deriv&rsquo;d</p>\n<p>From the bright fountain of celestial fire</p>\n<p>That feeds unnumber&rsquo;d lamps, the song I mean</p>\n<p>Which sounds Aeneas&rsquo; wand&rsquo;rings: that the breast</p>\n<p>I hung at, that the nurse, from whom my veins</p>\n<p>Drank inspiration: whose authority</p>\n<p>Was ever sacred with me. To have liv&rsquo;d</p>\n<p>Coeval with the Mantuan, I would bide</p>\n<p>The revolution of another sun</p>\n<p>Beyond my stated years in banishment.&rdquo;</p>\n<p class="slindent">The Mantuan, when he heard him, turn&rsquo;d to me,</p>\n<p>And holding silence: by his countenance</p>\n<p>Enjoin&rsquo;d me silence but the power which wills,</p>\n<p>Bears not supreme control: laughter and tears</p>\n<p>Follow so closely on the passion prompts them,</p>\n<p>They wait not for the motions of the will</p>\n<p>In natures most sincere. I did but smile,</p>\n<p>As one who winks; and thereupon the shade</p>\n<p>Broke off, and peer&rsquo;d into mine eyes, where best</p>\n<p>Our looks interpret. &ldquo;So to good event</p>\n<p>Mayst thou conduct such great emprize,&rdquo; he cried,</p>\n<p>&ldquo;Say, why across thy visage beam&rsquo;d, but now,</p>\n<p>The lightning of a smile!&rdquo; On either part</p>\n<p>Now am I straiten&rsquo;d; one conjures me speak,</p>\n<p>Th&rsquo; other to silence binds me: whence a sigh</p>\n<p>I utter, and the sigh is heard. &ldquo;Speak on; &rdquo;</p>\n<p>The teacher cried; &ldquo;and do not fear to speak,</p>\n<p>But tell him what so earnestly he asks.&rdquo;</p>\n<p>Whereon I thus: &ldquo;Perchance, O ancient spirit!</p>\n<p>Thou marvel&rsquo;st at my smiling. There is room</p>\n<p>For yet more wonder. He who guides my ken</p>\n<p>On high, he is that Mantuan, led by whom</p>\n<p>Thou didst presume of men arid gods to sing.</p>\n<p>If other cause thou deem&rsquo;dst for which I smil&rsquo;d,</p>\n<p>Leave it as not the true one; and believe</p>\n<p>Those words, thou spak&rsquo;st of him, indeed the cause.&rdquo;</p>\n<p class="slindent">Now down he bent t&rsquo; embrace my teacher&rsquo;s feet;</p>\n<p>But he forbade him: &ldquo;Brother! do it not:</p>\n<p>Thou art a shadow, and behold&rsquo;st a shade.&rdquo;</p>\n<p>He rising answer&rsquo;d thus: &ldquo;Now hast thou prov&rsquo;d</p>\n<p>The force and ardour of the love I bear thee,</p>\n<p>When I forget we are but things of air,</p>\n<p>And as a substance treat an empty shade.&rdquo;</p>\n</div>','<p class="cantohead">Canto XXII</p>\n<div class="stanza"><p>Now we had left the angel, who had turn&rsquo;d</p>\n<p>To the sixth circle our ascending step,</p>\n<p>One gash from off my forehead raz&rsquo;d: while they,</p>\n<p>Whose wishes tend to justice, shouted forth:</p>\n<p>&ldquo;Blessed!&rdquo; and ended with, &ldquo;I thirst:&rdquo; and I,</p>\n<p>More nimble than along the other straits,</p>\n<p>So journey&rsquo;d, that, without the sense of toil,</p>\n<p>I follow&rsquo;d upward the swift-footed shades;</p>\n<p>When Virgil thus began: &ldquo;Let its pure flame</p>\n<p>From virtue flow, and love can never fail</p>\n<p>To warm another&rsquo;s bosom&rsquo; so the light</p>\n<p>Shine manifestly forth. Hence from that hour,</p>\n<p>When &rsquo;mongst us in the purlieus of the deep,</p>\n<p>Came down the spirit of Aquinum&rsquo;s hard,</p>\n<p>Who told of thine affection, my good will</p>\n<p>Hath been for thee of quality as strong</p>\n<p>As ever link&rsquo;d itself to one not seen.</p>\n<p>Therefore these stairs will now seem short to me.</p>\n<p>But tell me: and if too secure I loose</p>\n<p>The rein with a friend&rsquo;s license, as a friend</p>\n<p>Forgive me, and speak now as with a friend:</p>\n<p>How chanc&rsquo;d it covetous desire could find</p>\n<p>Place in that bosom, &rsquo;midst such ample store</p>\n<p>Of wisdom, as thy zeal had treasur&rsquo;d there?&rdquo;</p>\n<p class="slindent">First somewhat mov&rsquo;d to laughter by his words,</p>\n<p>Statius replied: &ldquo;Each syllable of thine</p>\n<p>Is a dear pledge of love. Things oft appear</p>\n<p>That minister false matters to our doubts,</p>\n<p>When their true causes are remov&rsquo;d from sight.</p>\n<p>Thy question doth assure me, thou believ&rsquo;st</p>\n<p>I was on earth a covetous man, perhaps</p>\n<p>Because thou found&rsquo;st me in that circle plac&rsquo;d.</p>\n<p>Know then I was too wide of avarice:</p>\n<p>And e&rsquo;en for that excess, thousands of moons</p>\n<p>Have wax&rsquo;d and wan&rsquo;d upon my sufferings.</p>\n<p>And were it not that I with heedful care</p>\n<p>Noted where thou exclaim&rsquo;st as if in ire</p>\n<p>With human nature, &rsquo;Why, thou cursed thirst</p>\n<p>Of gold! dost not with juster measure guide</p>\n<p>The appetite of mortals?&rsquo; I had met</p>\n<p>The fierce encounter of the voluble rock.</p>\n<p>Then was I ware that with too ample wing</p>\n<p>The hands may haste to lavishment, and turn&rsquo;d,</p>\n<p>As from my other evil, so from this</p>\n<p>In penitence. How many from their grave</p>\n<p>Shall with shorn locks arise, who living, aye</p>\n<p>And at life&rsquo;s last extreme, of this offence,</p>\n<p>Through ignorance, did not repent. And know,</p>\n<p>The fault which lies direct from any sin</p>\n<p>In level opposition, here With that</p>\n<p>Wastes its green rankness on one common heap.</p>\n<p>Therefore if I have been with those, who wail</p>\n<p>Their avarice, to cleanse me, through reverse</p>\n<p>Of their transgression, such hath been my lot.&rdquo;</p>\n<p class="slindent">To whom the sovran of the pastoral song:</p>\n<p>&ldquo;While thou didst sing that cruel warfare wag&rsquo;d</p>\n<p>By the twin sorrow of Jocasta&rsquo;s womb,</p>\n<p>From thy discourse with Clio there, it seems</p>\n<p>As faith had not been shine: without the which</p>\n<p>Good deeds suffice not. And if so, what sun</p>\n<p>Rose on thee, or what candle pierc&rsquo;d the dark</p>\n<p>That thou didst after see to hoist the sail,</p>\n<p>And follow, where the fisherman had led?&rdquo;</p>\n<p class="slindent">He answering thus: &ldquo;By thee conducted first,</p>\n<p>I enter&rsquo;d the Parnassian grots, and quaff&rsquo;d</p>\n<p>Of the clear spring; illumin&rsquo;d first by thee</p>\n<p>Open&rsquo;d mine eyes to God. Thou didst, as one,</p>\n<p>Who, journeying through the darkness, hears a light</p>\n<p>Behind, that profits not himself, but makes</p>\n<p>His followers wise, when thou exclaimedst, &rsquo;Lo!</p>\n<p>A renovated world! Justice return&rsquo;d!</p>\n<p>Times of primeval innocence restor&rsquo;d!</p>\n<p>And a new race descended from above!&rsquo;</p>\n<p>Poet and Christian both to thee I owed.</p>\n<p>That thou mayst mark more clearly what I trace,</p>\n<p>My hand shall stretch forth to inform the lines</p>\n<p>With livelier colouring. Soon o&rsquo;er all the world,</p>\n<p>By messengers from heav&rsquo;n, the true belief</p>\n<p>Teem&rsquo;d now prolific, and that word of thine</p>\n<p>Accordant, to the new instructors chim&rsquo;d.</p>\n<p>Induc&rsquo;d by which agreement, I was wont</p>\n<p>Resort to them; and soon their sanctity</p>\n<p>So won upon me, that, Domitian&rsquo;s rage</p>\n<p>Pursuing them, I mix&rsquo;d my tears with theirs,</p>\n<p>And, while on earth I stay&rsquo;d, still succour&rsquo;d them;</p>\n<p>And their most righteous customs made me scorn</p>\n<p>All sects besides. Before I led the Greeks</p>\n<p>In tuneful fiction, to the streams of Thebes,</p>\n<p>I was baptiz&rsquo;d; but secretly, through fear,</p>\n<p>Remain&rsquo;d a Christian, and conform&rsquo;d long time</p>\n<p>To Pagan rites. Five centuries and more,</p>\n<p>T for that lukewarmness was fain to pace</p>\n<p>Round the fourth circle. Thou then, who hast rais&rsquo;d</p>\n<p>The covering, which did hide such blessing from me,</p>\n<p>Whilst much of this ascent is yet to climb,</p>\n<p>Say, if thou know, where our old Terence bides,</p>\n<p>Caecilius, Plautus, Varro: if condemn&rsquo;d</p>\n<p>They dwell, and in what province of the deep.&rdquo;</p>\n<p>&ldquo;These,&rdquo; said my guide, &ldquo;with Persius and myself,</p>\n<p>And others many more, are with that Greek,</p>\n<p>Of mortals, the most cherish&rsquo;d by the Nine,</p>\n<p>In the first ward of darkness. There ofttimes</p>\n<p>We of that mount hold converse, on whose top</p>\n<p>For aye our nurses live. We have the bard</p>\n<p>Of Pella, and the Teian, Agatho,</p>\n<p>Simonides, and many a Grecian else</p>\n<p>Ingarlanded with laurel. Of thy train</p>\n<p>Antigone is there, Deiphile,</p>\n<p>Argia, and as sorrowful as erst</p>\n<p>Ismene, and who show&rsquo;d Langia&rsquo;s wave:</p>\n<p>Deidamia with her sisters there,</p>\n<p>And blind Tiresias&rsquo; daughter, and the bride</p>\n<p>Sea-born of Peleus.&rdquo; Either poet now</p>\n<p>Was silent, and no longer by th&rsquo; ascent</p>\n<p>Or the steep walls obstructed, round them cast</p>\n<p>Inquiring eyes. Four handmaids of the day</p>\n<p>Had finish&rsquo;d now their office, and the fifth</p>\n<p>Was at the chariot-beam, directing still</p>\n<p>Its balmy point aloof, when thus my guide:</p>\n<p>&ldquo;Methinks, it well behooves us to the brink</p>\n<p>Bend the right shoulder&rsquo; circuiting the mount,</p>\n<p>As we have ever us&rsquo;d.&rdquo; So custom there</p>\n<p>Was usher to the road, the which we chose</p>\n<p>Less doubtful, as that worthy shade complied.</p>\n<p class="slindent">They on before me went; I sole pursued,</p>\n<p>List&rsquo;ning their speech, that to my thoughts convey&rsquo;d</p>\n<p>Mysterious lessons of sweet poesy.</p>\n<p>But soon they ceas&rsquo;d; for midway of the road</p>\n<p>A tree we found, with goodly fruitage hung,</p>\n<p>And pleasant to the smell: and as a fir</p>\n<p>Upward from bough to bough less ample spreads,</p>\n<p>So downward this less ample spread, that none.</p>\n<p>Methinks, aloft may climb. Upon the side,</p>\n<p>That clos&rsquo;d our path, a liquid crystal fell</p>\n<p>From the steep rock, and through the sprays above</p>\n<p>Stream&rsquo;d showering. With associate step the bards</p>\n<p>Drew near the plant; and from amidst the leaves</p>\n<p>A voice was heard: &ldquo;Ye shall be chary of me;&rdquo;</p>\n<p>And after added: &ldquo;Mary took more thought</p>\n<p>For joy and honour of the nuptial feast,</p>\n<p>Than for herself who answers now for you.</p>\n<p>The women of old Rome were satisfied</p>\n<p>With water for their beverage. Daniel fed</p>\n<p>On pulse, and wisdom gain&rsquo;d. The primal age</p>\n<p>Was beautiful as gold; and hunger then</p>\n<p>Made acorns tasteful, thirst each rivulet</p>\n<p>Run nectar. Honey and locusts were the food,</p>\n<p>Whereon the Baptist in the wilderness</p>\n<p>Fed, and that eminence of glory reach&rsquo;d</p>\n<p>And greatness, which the&rsquo; Evangelist records.&rdquo;</p>\n</div>','<p class="cantohead">Canto XXIII</p>\n<div class="stanza"><p>On the green leaf mine eyes were fix&rsquo;d, like his</p>\n<p>Who throws away his days in idle chase</p>\n<p>Of the diminutive, when thus I heard</p>\n<p>The more than father warn me: &ldquo;Son! our time</p>\n<p>Asks thriftier using. Linger not: away.&rdquo;</p>\n<p class="slindent">Thereat my face and steps at once I turn&rsquo;d</p>\n<p>Toward the sages, by whose converse cheer&rsquo;d</p>\n<p>I journey&rsquo;d on, and felt no toil: and lo!</p>\n<p>A sound of weeping and a song: &ldquo;My lips,</p>\n<p>O Lord!&rdquo; and these so mingled, it gave birth</p>\n<p>To pleasure and to pain. &ldquo;O Sire, belov&rsquo;d!</p>\n<p>Say what is this I hear?&rdquo; Thus I inquir&rsquo;d.</p>\n<p class="slindent">&ldquo;Spirits,&rdquo; said he, &ldquo;who as they go, perchance,</p>\n<p>Their debt of duty pay.&rdquo; As on their road</p>\n<p>The thoughtful pilgrims, overtaking some</p>\n<p>Not known unto them, turn to them, and look,</p>\n<p>But stay not; thus, approaching from behind</p>\n<p>With speedier motion, eyed us, as they pass&rsquo;d,</p>\n<p>A crowd of spirits, silent and devout.</p>\n<p>The eyes of each were dark and hollow: pale</p>\n<p>Their visage, and so lean withal, the bones</p>\n<p>Stood staring thro&rsquo; the skin. I do not think</p>\n<p>Thus dry and meagre Erisicthon show&rsquo;d,</p>\n<p>When pinc&rsquo;ed by sharp-set famine to the quick.</p>\n<p class="slindent">&ldquo;Lo!&rdquo; to myself I mus&rsquo;d, &ldquo;the race, who lost</p>\n<p>Jerusalem, when Mary with dire beak</p>\n<p>Prey&rsquo;d on her child.&rdquo; The sockets seem&rsquo;d as rings,</p>\n<p>From which the gems were drops. Who reads the name</p>\n<p>Of man upon his forehead, there the M</p>\n<p>Had trac&rsquo;d most plainly. Who would deem, that scent</p>\n<p>Of water and an apple, could have prov&rsquo;d</p>\n<p>Powerful to generate such pining want,</p>\n<p>Not knowing how it wrought? While now I stood</p>\n<p>Wond&rsquo;ring what thus could waste them (for the cause</p>\n<p>Of their gaunt hollowness and scaly rind</p>\n<p>Appear&rsquo;d not) lo! a spirit turn&rsquo;d his eyes</p>\n<p>In their deep-sunken cell, and fasten&rsquo;d then</p>\n<p>On me, then cried with vehemence aloud:</p>\n<p>&ldquo;What grace is this vouchsaf&rsquo;d me?&rdquo; By his looks</p>\n<p>I ne&rsquo;er had recogniz&rsquo;d him: but the voice</p>\n<p>Brought to my knowledge what his cheer conceal&rsquo;d.</p>\n<p>Remembrance of his alter&rsquo;d lineaments</p>\n<p>Was kindled from that spark; and I agniz&rsquo;d</p>\n<p>The visage of Forese. &ldquo;Ah! respect</p>\n<p>This wan and leprous wither&rsquo;d skin,&rdquo; thus he</p>\n<p>Suppliant implor&rsquo;d, &ldquo;this macerated flesh.</p>\n<p>Speak to me truly of thyself. And who</p>\n<p>Are those twain spirits, that escort thee there?</p>\n<p>Be it not said thou Scorn&rsquo;st to talk with me.&rdquo;</p>\n<p class="slindent">&ldquo;That face of thine,&rdquo; I answer&rsquo;d him, &ldquo;which dead</p>\n<p>I once bewail&rsquo;d, disposes me not less</p>\n<p>For weeping, when I see It thus transform&rsquo;d.</p>\n<p>Say then, by Heav&rsquo;n, what blasts ye thus? The whilst</p>\n<p>I wonder, ask not Speech from me: unapt</p>\n<p>Is he to speak, whom other will employs.</p>\n<p class="slindent">He thus: &ldquo;The water and tee plant we pass&rsquo;d,</p>\n<p>Virtue possesses, by th&rsquo; eternal will</p>\n<p>Infus&rsquo;d, the which so pines me. Every spirit,</p>\n<p>Whose song bewails his gluttony indulg&rsquo;d</p>\n<p>Too grossly, here in hunger and in thirst</p>\n<p>Is purified. The odour, which the fruit,</p>\n<p>And spray, that showers upon the verdure, breathe,</p>\n<p>Inflames us with desire to feed and drink.</p>\n<p>Nor once alone encompassing our route</p>\n<p>We come to add fresh fuel to the pain:</p>\n<p>Pain, said I? solace rather: for that will</p>\n<p>To the tree leads us, by which Christ was led</p>\n<p>To call Elias, joyful when he paid</p>\n<p>Our ransom from his vein.&rdquo; I answering thus:</p>\n<p>&ldquo;Forese! from that day, in which the world</p>\n<p>For better life thou changedst, not five years</p>\n<p>Have circled. If the power of sinning more</p>\n<p>Were first concluded in thee, ere thou knew&rsquo;st</p>\n<p>That kindly grief, which re-espouses us</p>\n<p>To God, how hither art thou come so soon?</p>\n<p>I thought to find thee lower, there, where time</p>\n<p>Is recompense for time.&rdquo; He straight replied:</p>\n<p>&ldquo;To drink up the sweet wormwood of affliction</p>\n<p>I have been brought thus early by the tears</p>\n<p>Stream&rsquo;d down my Nella&rsquo;s cheeks. Her prayers devout,</p>\n<p>Her sighs have drawn me from the coast, where oft</p>\n<p>Expectance lingers, and have set me free</p>\n<p>From th&rsquo; other circles. In the sight of God</p>\n<p>So much the dearer is my widow priz&rsquo;d,</p>\n<p>She whom I lov&rsquo;d so fondly, as she ranks</p>\n<p>More singly eminent for virtuous deeds.</p>\n<p>The tract most barb&rsquo;rous of Sardinia&rsquo;s isle,</p>\n<p>Hath dames more chaste and modester by far</p>\n<p>Than that wherein I left her. O sweet brother!</p>\n<p>What wouldst thou have me say? A time to come</p>\n<p>Stands full within my view, to which this hour</p>\n<p>Shall not be counted of an ancient date,</p>\n<p>When from the pulpit shall be loudly warn&rsquo;d</p>\n<p>Th&rsquo; unblushing dames of Florence, lest they bare</p>\n<p>Unkerchief&rsquo;d bosoms to the common gaze.</p>\n<p>What savage women hath the world e&rsquo;er seen,</p>\n<p>What Saracens, for whom there needed scourge</p>\n<p>Of spiritual or other discipline,</p>\n<p>To force them walk with cov&rsquo;ring on their limbs!</p>\n<p>But did they see, the shameless ones, that Heav&rsquo;n</p>\n<p>Wafts on swift wing toward them, while I speak,</p>\n<p>Their mouths were op&rsquo;d for howling: they shall taste</p>\n<p>Of Borrow (unless foresight cheat me here)</p>\n<p>Or ere the cheek of him be cloth&rsquo;d with down</p>\n<p>Who is now rock&rsquo;d with lullaby asleep.</p>\n<p>Ah! now, my brother, hide thyself no more,</p>\n<p>Thou seest how not I alone but all</p>\n<p>Gaze, where thou veil&rsquo;st the intercepted sun.&rdquo;</p>\n<p class="slindent">Whence I replied: &ldquo;If thou recall to mind</p>\n<p>What we were once together, even yet</p>\n<p>Remembrance of those days may grieve thee sore.</p>\n<p>That I forsook that life, was due to him</p>\n<p>Who there precedes me, some few evenings past,</p>\n<p>When she was round, who shines with sister lamp</p>\n<p>To his, that glisters yonder,&rdquo; and I show&rsquo;d</p>\n<p>The sun. &ldquo;Tis he, who through profoundest night</p>\n<p>Of he true dead has brought me, with this flesh</p>\n<p>As true, that follows. From that gloom the aid</p>\n<p>Of his sure comfort drew me on to climb,</p>\n<p>And climbing wind along this mountain-steep,</p>\n<p>Which rectifies in you whate&rsquo;er the world</p>\n<p>Made crooked and deprav&rsquo;d I have his word,</p>\n<p>That he will bear me company as far</p>\n<p>As till I come where Beatrice dwells:</p>\n<p>But there must leave me. Virgil is that spirit,</p>\n<p>Who thus hath promis&rsquo;d,&rdquo; and I pointed to him;</p>\n<p>&ldquo;The other is that shade, for whom so late</p>\n<p>Your realm, as he arose, exulting shook</p>\n<p>Through every pendent cliff and rocky bound.&rdquo;</p>\n</div>','<p class="cantohead">Canto XXIV</p>\n<div class="stanza"><p>Our journey was not slacken&rsquo;d by our talk,</p>\n<p>Nor yet our talk by journeying. Still we spake,</p>\n<p>And urg&rsquo;d our travel stoutly, like a ship</p>\n<p>When the wind sits astern. The shadowy forms,</p>\n<p>That seem&rsquo;d things dead and dead again, drew in</p>\n<p>At their deep-delved orbs rare wonder of me,</p>\n<p>Perceiving I had life; and I my words</p>\n<p>Continued, and thus spake; &ldquo;He journeys up</p>\n<p>Perhaps more tardily then else he would,</p>\n<p>For others&rsquo; sake. But tell me, if thou know&rsquo;st,</p>\n<p>Where is Piccarda? Tell me, if I see</p>\n<p>Any of mark, among this multitude,</p>\n<p>Who eye me thus.&rdquo;&mdash;&ldquo;My sister (she for whom,</p>\n<p>&rsquo;Twixt beautiful and good I cannot say</p>\n<p>Which name was fitter ) wears e&rsquo;en now her crown,</p>\n<p>And triumphs in Olympus.&rdquo; Saying this,</p>\n<p>He added: &ldquo;Since spare diet hath so worn</p>\n<p>Our semblance out, &rsquo;t is lawful here to name</p>\n<p>Each one. This,&rdquo; and his finger then he rais&rsquo;d,</p>\n<p>&ldquo;Is Buonaggiuna,&mdash;Buonaggiuna, he</p>\n<p>Of Lucca: and that face beyond him, pierc&rsquo;d</p>\n<p>Unto a leaner fineness than the rest,</p>\n<p>Had keeping of the church: he was of Tours,</p>\n<p>And purges by wan abstinence away</p>\n<p>Bolsena&rsquo;s eels and cups of muscadel.&rdquo;</p>\n<p class="slindent">He show&rsquo;d me many others, one by one,</p>\n<p>And all, as they were nam&rsquo;d, seem&rsquo;d well content;</p>\n<p>For no dark gesture I discern&rsquo;d in any.</p>\n<p>I saw through hunger Ubaldino grind</p>\n<p>His teeth on emptiness; and Boniface,</p>\n<p>That wav&rsquo;d the crozier o&rsquo;er a num&rsquo;rous flock.</p>\n<p>I saw the Marquis, who tad time erewhile</p>\n<p>To swill at Forli with less drought, yet so</p>\n<p>Was one ne&rsquo;er sated. I howe&rsquo;er, like him,</p>\n<p>That gazing &rsquo;midst a crowd, singles out one,</p>\n<p>So singled him of Lucca; for methought</p>\n<p>Was none amongst them took such note of me.</p>\n<p>Somewhat I heard him whisper of Gentucca:</p>\n<p>The sound was indistinct, and murmur&rsquo;d there,</p>\n<p>Where justice, that so strips them, fix&rsquo;d her sting.</p>\n<p class="slindent">&ldquo;Spirit!&rdquo; said I, &ldquo;it seems as thou wouldst fain</p>\n<p>Speak with me. Let me hear thee. Mutual wish</p>\n<p>To converse prompts, which let us both indulge.&rdquo;</p>\n<p class="slindent">He, answ&rsquo;ring, straight began: &ldquo;Woman is born,</p>\n<p>Whose brow no wimple shades yet, that shall make</p>\n<p>My city please thee, blame it as they may.</p>\n<p>Go then with this forewarning. If aught false</p>\n<p>My whisper too implied, th&rsquo; event shall tell</p>\n<p>But say, if of a truth I see the man</p>\n<p>Of that new lay th&rsquo; inventor, which begins</p>\n<p>With &lsquo;Ladies, ye that con the lore of love&rsquo;.&rdquo;</p>\n<p class="slindent">To whom I thus: &ldquo;Count of me but as one</p>\n<p>Who am the scribe of love; that, when he breathes,</p>\n<p>Take up my pen, and, as he dictates, write.&rdquo;</p>\n<p class="slindent">&ldquo;Brother!&rdquo; said he, &ldquo;the hind&rsquo;rance which once held</p>\n<p>The notary with Guittone and myself,</p>\n<p>Short of that new and sweeter style I hear,</p>\n<p>Is now disclos&rsquo;d. I see how ye your plumes</p>\n<p>Stretch, as th&rsquo; inditer guides them; which, no question,</p>\n<p>Ours did not. He that seeks a grace beyond,</p>\n<p>Sees not the distance parts one style from other.&rdquo;</p>\n<p>And, as contented, here he held his peace.</p>\n<p class="slindent">Like as the bird, that winter near the Nile,</p>\n<p>In squared regiment direct their course,</p>\n<p>Then stretch themselves in file for speedier flight;</p>\n<p>Thus all the tribe of spirits, as they turn&rsquo;d</p>\n<p>Their visage, faster deaf, nimble alike</p>\n<p>Through leanness and desire. And as a man,</p>\n<p>Tir&rsquo;d With the motion of a trotting steed,</p>\n<p>Slacks pace, and stays behind his company,</p>\n<p>Till his o&rsquo;erbreathed lungs keep temperate time;</p>\n<p>E&rsquo;en so Forese let that holy crew</p>\n<p>Proceed, behind them lingering at my side,</p>\n<p>And saying: &ldquo;When shall I again behold thee?&rdquo;</p>\n<p class="slindent">&ldquo;How long my life may last,&rdquo; said I, &ldquo;I know not;</p>\n<p>This know, how soon soever I return,</p>\n<p>My wishes will before me have arriv&rsquo;d.</p>\n<p>Sithence the place, where I am set to live,</p>\n<p>Is, day by day, more scoop&rsquo;d of all its good,</p>\n<p>And dismal ruin seems to threaten it.&rdquo;</p>\n<p class="slindent">&ldquo;Go now,&rdquo; he cried: &ldquo;lo! he, whose guilt is most,</p>\n<p>Passes before my vision, dragg&rsquo;d at heels</p>\n<p>Of an infuriate beast. Toward the vale,</p>\n<p>Where guilt hath no redemption, on it speeds,</p>\n<p>Each step increasing swiftness on the last;</p>\n<p>Until a blow it strikes, that leaveth him</p>\n<p>A corse most vilely shatter&rsquo;d. No long space</p>\n<p>Those wheels have yet to roll&rdquo; (therewith his eyes</p>\n<p>Look&rsquo;d up to heav&rsquo;n) &ldquo;ere thou shalt plainly see</p>\n<p>That which my words may not more plainly tell.</p>\n<p>I quit thee: time is precious here: I lose</p>\n<p>Too much, thus measuring my pace with shine.&rdquo;</p>\n<p class="slindent">As from a troop of well-rank&rsquo;d chivalry</p>\n<p>One knight, more enterprising than the rest,</p>\n<p>Pricks forth at gallop, eager to display</p>\n<p>His prowess in the first encounter prov&rsquo;d</p>\n<p>So parted he from us with lengthen&rsquo;d strides,</p>\n<p>And left me on the way with those twain spirits,</p>\n<p>Who were such mighty marshals of the world.</p>\n<p class="slindent">When he beyond us had so fled mine eyes</p>\n<p>No nearer reach&rsquo;d him, than my thought his words,</p>\n<p>The branches of another fruit, thick hung,</p>\n<p>And blooming fresh, appear&rsquo;d. E&rsquo;en as our steps</p>\n<p>Turn&rsquo;d thither, not far off it rose to view.</p>\n<p>Beneath it were a multitude, that rais&rsquo;d</p>\n<p>Their hands, and shouted forth I know not What</p>\n<p>Unto the boughs; like greedy and fond brats,</p>\n<p>That beg, and answer none obtain from him,</p>\n<p>Of whom they beg; but more to draw them on,</p>\n<p>He at arm&rsquo;s length the object of their wish</p>\n<p>Above them holds aloft, and hides it not.</p>\n<p class="slindent">At length, as undeceiv&rsquo;d they went their way:</p>\n<p>And we approach the tree, who vows and tears</p>\n<p>Sue to in vain, the mighty tree. &ldquo;Pass on,</p>\n<p>And come not near. Stands higher up the wood,</p>\n<p>Whereof Eve tasted, and from it was ta&rsquo;en</p>\n<p>&rsquo;this plant.&rdquo; Such sounds from midst the thickets came.</p>\n<p>Whence I, with either bard, close to the side</p>\n<p>That rose, pass&rsquo;d forth beyond. &ldquo;Remember,&rdquo; next</p>\n<p>We heard, &ldquo;those noblest creatures of the clouds,</p>\n<p>How they their twofold bosoms overgorg&rsquo;d</p>\n<p>Oppos&rsquo;d in fight to Theseus: call to mind</p>\n<p>The Hebrews, how effeminate they stoop&rsquo;d</p>\n<p>To ease their thirst; whence Gideon&rsquo;s ranks were thinn&rsquo;d,</p>\n<p>As he to Midian march&rsquo;d adown the hills.&rdquo;</p>\n<p class="slindent">Thus near one border coasting, still we heard</p>\n<p>The sins of gluttony, with woe erewhile</p>\n<p>Reguerdon&rsquo;d. Then along the lonely path,</p>\n<p>Once more at large, full thousand paces on</p>\n<p>We travel&rsquo;d, each contemplative and mute.</p>\n<p class="slindent">&ldquo;Why pensive journey thus ye three alone?&rdquo;</p>\n<p>Thus suddenly a voice exclaim&rsquo;d: whereat</p>\n<p>I shook, as doth a scar&rsquo;d and paltry beast;</p>\n<p>Then rais&rsquo;d my head to look from whence it came.</p>\n<p class="slindent">Was ne&rsquo;er, in furnace, glass, or metal seen</p>\n<p>So bright and glowing red, as was the shape</p>\n<p>I now beheld. &ldquo;If ye desire to mount,&rdquo;</p>\n<p>He cried, &ldquo;here must ye turn. This way he goes,</p>\n<p>Who goes in quest of peace.&rdquo; His countenance</p>\n<p>Had dazzled me; and to my guides I fac&rsquo;d</p>\n<p>Backward, like one who walks, as sound directs.</p>\n<p class="slindent">As when, to harbinger the dawn, springs up</p>\n<p>On freshen&rsquo;d wing the air of May, and breathes</p>\n<p>Of fragrance, all impregn&rsquo;d with herb and flowers,</p>\n<p>E&rsquo;en such a wind I felt upon my front</p>\n<p>Blow gently, and the moving of a wing</p>\n<p>Perceiv&rsquo;d, that moving shed ambrosial smell;</p>\n<p>And then a voice: &ldquo;Blessed are they, whom grace</p>\n<p>Doth so illume, that appetite in them</p>\n<p>Exhaleth no inordinate desire,</p>\n<p>Still hung&rsquo;ring as the rule of temperance wills.&rdquo;</p>\n</div>','<p class="cantohead">Canto XXV</p>\n<div class="stanza"><p>It was an hour, when he who climbs, had need</p>\n<p>To walk uncrippled: for the sun had now</p>\n<p>To Taurus the meridian circle left,</p>\n<p>And to the Scorpion left the night. As one</p>\n<p>That makes no pause, but presses on his road,</p>\n<p>Whate&rsquo;er betide him, if some urgent need</p>\n<p>Impel: so enter&rsquo;d we upon our way,</p>\n<p>One before other; for, but singly, none</p>\n<p>That steep and narrow scale admits to climb.</p>\n<p class="slindent">E&rsquo;en as the young stork lifteth up his wing</p>\n<p>Through wish to fly, yet ventures not to quit</p>\n<p>The nest, and drops it; so in me desire</p>\n<p>Of questioning my guide arose, and fell,</p>\n<p>Arriving even to the act, that marks</p>\n<p>A man prepar&rsquo;d for speech. Him all our haste</p>\n<p>Restrain&rsquo;d not, but thus spake the sire belov&rsquo;d:</p>\n<p>Fear not to speed the shaft, that on thy lip</p>\n<p>Stands trembling for its flight.&rdquo; Encourag&rsquo;d thus</p>\n<p>I straight began: &ldquo;How there can leanness come,</p>\n<p>Where is no want of nourishment to feed?&rdquo;</p>\n<p class="slindent">&ldquo;If thou,&rdquo; he answer&rsquo;d, &ldquo;hadst remember&rsquo;d thee,</p>\n<p>How Meleager with the wasting brand</p>\n<p>Wasted alike, by equal fires consm&rsquo;d,</p>\n<p>This would not trouble thee: and hadst thou thought,</p>\n<p>How in the mirror your reflected form</p>\n<p>With mimic motion vibrates, what now seems</p>\n<p>Hard, had appear&rsquo;d no harder than the pulp</p>\n<p>Of summer fruit mature. But that thy will</p>\n<p>In certainty may find its full repose,</p>\n<p>Lo Statius here! on him I call, and pray</p>\n<p>That he would now be healer of thy wound.&rdquo;</p>\n<p class="slindent">&ldquo;If in thy presence I unfold to him</p>\n<p>The secrets of heaven&rsquo;s vengeance, let me plead</p>\n<p>Thine own injunction, to exculpate me.&rdquo;</p>\n<p>So Statius answer&rsquo;d, and forthwith began:</p>\n<p>&ldquo;Attend my words, O son, and in thy mind</p>\n<p>Receive them: so shall they be light to clear</p>\n<p>The doubt thou offer&rsquo;st. Blood, concocted well,</p>\n<p>Which by the thirsty veins is ne&rsquo;er imbib&rsquo;d,</p>\n<p>And rests as food superfluous, to be ta&rsquo;en</p>\n<p>From the replenish&rsquo;d table, in the heart</p>\n<p>Derives effectual virtue, that informs</p>\n<p>The several human limbs, as being that,</p>\n<p>Which passes through the veins itself to make them.</p>\n<p>Yet more concocted it descends, where shame</p>\n<p>Forbids to mention: and from thence distils</p>\n<p>In natural vessel on another&rsquo;s blood.</p>\n<p>Then each unite together, one dispos&rsquo;d</p>\n<p>T&rsquo; endure, to act the other, through meet frame</p>\n<p>Of its recipient mould: that being reach&rsquo;d,</p>\n<p>It &rsquo;gins to work, coagulating first;</p>\n<p>Then vivifies what its own substance caus&rsquo;d</p>\n<p>To bear. With animation now indued,</p>\n<p>The active virtue (differing from a plant</p>\n<p>No further, than that this is on the way</p>\n<p>And at its limit that) continues yet</p>\n<p>To operate, that now it moves, and feels,</p>\n<p>As sea sponge clinging to the rock: and there</p>\n<p>Assumes th&rsquo; organic powers its seed convey&rsquo;d.</p>\n<p>&lsquo;This is the period, son! at which the virtue,</p>\n<p>That from the generating heart proceeds,</p>\n<p>Is pliant and expansive; for each limb</p>\n<p>Is in the heart by forgeful nature plann&rsquo;d.</p>\n<p>How babe of animal becomes, remains</p>\n<p>For thy consid&rsquo;ring. At this point, more wise,</p>\n<p>Than thou hast err&rsquo;d, making the soul disjoin&rsquo;d</p>\n<p>From passive intellect, because he saw</p>\n<p>No organ for the latter&rsquo;s use assign&rsquo;d.</p>\n<p class="slindent">&ldquo;Open thy bosom to the truth that comes.</p>\n<p>Know soon as in the embryo, to the brain,</p>\n<p>Articulation is complete, then turns</p>\n<p>The primal Mover with a smile of joy</p>\n<p>On such great work of nature, and imbreathes</p>\n<p>New spirit replete with virtue, that what here</p>\n<p>Active it finds, to its own substance draws,</p>\n<p>And forms an individual soul, that lives,</p>\n<p>And feels, and bends reflective on itself.</p>\n<p>And that thou less mayst marvel at the word,</p>\n<p>Mark the sun&rsquo;s heat, how that to wine doth change,</p>\n<p>Mix&rsquo;d with the moisture filter&rsquo;d through the vine.</p>\n<p class="slindent">&ldquo;When Lachesis hath spun the thread, the soul</p>\n<p>Takes with her both the human and divine,</p>\n<p>Memory, intelligence, and will, in act</p>\n<p>Far keener than before, the other powers</p>\n<p>Inactive all and mute. No pause allow&rsquo;d,</p>\n<p>In wond&rsquo;rous sort self-moving, to one strand</p>\n<p>Of those, where the departed roam, she falls,</p>\n<p>Here learns her destin&rsquo;d path. Soon as the place</p>\n<p>Receives her, round the plastic virtue beams,</p>\n<p>Distinct as in the living limbs before:</p>\n<p>And as the air, when saturate with showers,</p>\n<p>The casual beam refracting, decks itself</p>\n<p>With many a hue; so here the ambient air</p>\n<p>Weareth that form, which influence of the soul</p>\n<p>Imprints on it; and like the flame, that where</p>\n<p>The fire moves, thither follows, so henceforth</p>\n<p>The new form on the spirit follows still:</p>\n<p>Hence hath it semblance, and is shadow call&rsquo;d,</p>\n<p>With each sense even to the sight endued:</p>\n<p>Hence speech is ours, hence laughter, tears, and sighs</p>\n<p>Which thou mayst oft have witness&rsquo;d on the mount</p>\n<p>Th&rsquo; obedient shadow fails not to present</p>\n<p>Whatever varying passion moves within us.</p>\n<p>And this the cause of what thou marvel&rsquo;st at.&rdquo;</p>\n<p class="slindent">Now the last flexure of our way we reach&rsquo;d,</p>\n<p>And to the right hand turning, other care</p>\n<p>Awaits us. Here the rocky precipice</p>\n<p>Hurls forth redundant flames, and from the rim</p>\n<p>A blast upblown, with forcible rebuff</p>\n<p>Driveth them back, sequester&rsquo;d from its bound.</p>\n<p class="slindent">Behoov&rsquo;d us, one by one, along the side,</p>\n<p>That border&rsquo;d on the void, to pass; and I</p>\n<p>Fear&rsquo;d on one hand the fire, on th&rsquo; other fear&rsquo;d</p>\n<p>Headlong to fall: when thus th&rsquo; instructor warn&rsquo;d:</p>\n<p>&ldquo;Strict rein must in this place direct the eyes.</p>\n<p>A little swerving and the way is lost.&rdquo;</p>\n<p class="slindent">Then from the bosom of the burning mass,</p>\n<p>&ldquo;O God of mercy!&rdquo; heard I sung; and felt</p>\n<p>No less desire to turn. And when I saw</p>\n<p>Spirits along the flame proceeding, I</p>\n<p>Between their footsteps and mine own was fain</p>\n<p>To share by turns my view. At the hymn&rsquo;s close</p>\n<p>They shouted loud, &ldquo;I do not know a man;&rdquo;</p>\n<p>Then in low voice again took up the strain,</p>\n<p>Which once more ended, &ldquo;To the wood,&rdquo; they cried,</p>\n<p>&ldquo;Ran Dian, and drave forth Callisto, stung</p>\n<p>With Cytherea&rsquo;s poison:&rdquo; then return&rsquo;d</p>\n<p>Unto their song; then marry a pair extoll&rsquo;d,</p>\n<p>Who liv&rsquo;d in virtue chastely, and the bands</p>\n<p>Of wedded love. Nor from that task, I ween,</p>\n<p>Surcease they; whilesoe&rsquo;er the scorching fire</p>\n<p>Enclasps them. Of such skill appliance needs</p>\n<p>To medicine the wound, that healeth last.</p>\n</div>','<p class="cantohead">Canto XXVI</p>\n<div class="stanza"><p>While singly thus along the rim we walk&rsquo;d,</p>\n<p>Oft the good master warn&rsquo;d me: &ldquo;Look thou well.</p>\n<p>Avail it that I caution thee.&rdquo; The sun</p>\n<p>Now all the western clime irradiate chang&rsquo;d</p>\n<p>From azure tinct to white; and, as I pass&rsquo;d,</p>\n<p>My passing shadow made the umber&rsquo;d flame</p>\n<p>Burn ruddier. At so strange a sight I mark&rsquo;d</p>\n<p>That many a spirit marvel&rsquo;d on his way.</p>\n<p class="slindent">This bred occasion first to speak of me,</p>\n<p>&ldquo;He seems,&rdquo; said they, &ldquo;no insubstantial frame:&rdquo;</p>\n<p>Then to obtain what certainty they might,</p>\n<p>Stretch&rsquo;d towards me, careful not to overpass</p>\n<p>The burning pale. &ldquo;O thou, who followest</p>\n<p>The others, haply not more slow than they,</p>\n<p>But mov&rsquo;d by rev&rsquo;rence, answer me, who burn</p>\n<p>In thirst and fire: nor I alone, but these</p>\n<p>All for thine answer do more thirst, than doth</p>\n<p>Indian or Aethiop for the cooling stream.</p>\n<p>Tell us, how is it that thou mak&rsquo;st thyself</p>\n<p>A wall against the sun, as thou not yet</p>\n<p>Into th&rsquo; inextricable toils of death</p>\n<p>Hadst enter&rsquo;d?&rdquo; Thus spake one, and I had straight</p>\n<p>Declar&rsquo;d me, if attention had not turn&rsquo;d</p>\n<p>To new appearance. Meeting these, there came,</p>\n<p>Midway the burning path, a crowd, on whom</p>\n<p>Earnestly gazing, from each part I view</p>\n<p>The shadows all press forward, sev&rsquo;rally</p>\n<p>Each snatch a hasty kiss, and then away.</p>\n<p>E&rsquo;en so the emmets, &rsquo;mid their dusky troops,</p>\n<p>Peer closely one at other, to spy out</p>\n<p>Their mutual road perchance, and how they thrive.</p>\n<p class="slindent">That friendly greeting parted, ere dispatch</p>\n<p>Of the first onward step, from either tribe</p>\n<p>Loud clamour rises: those, who newly come,</p>\n<p>Shout Sodom and Gomorrah!&rdquo; these, &ldquo;The cow</p>\n<p>Pasiphae enter&rsquo;d, that the beast she woo&rsquo;d</p>\n<p>Might rush unto her luxury.&rdquo; Then as cranes,</p>\n<p>That part towards the Riphaean mountains fly,</p>\n<p>Part towards the Lybic sands, these to avoid</p>\n<p>The ice, and those the sun; so hasteth off</p>\n<p>One crowd, advances th&rsquo; other; and resume</p>\n<p>Their first song weeping, and their several shout.</p>\n<p class="slindent">Again drew near my side the very same,</p>\n<p>Who had erewhile besought me, and their looks</p>\n<p>Mark&rsquo;d eagerness to listen. I, who twice</p>\n<p>Their will had noted, spake: &ldquo;O spirits secure,</p>\n<p>Whene&rsquo;er the time may be, of peaceful end!</p>\n<p>My limbs, nor crude, nor in mature old age,</p>\n<p>Have I left yonder: here they bear me, fed</p>\n<p>With blood, and sinew-strung. That I no more</p>\n<p>May live in blindness, hence I tend aloft.</p>\n<p>There is a dame on high, who wind for us</p>\n<p>This grace, by which my mortal through your realm</p>\n<p>I bear. But may your utmost wish soon meet</p>\n<p>Such full fruition, that the orb of heaven,</p>\n<p>Fullest of love, and of most ample space,</p>\n<p>Receive you, as ye tell (upon my page</p>\n<p>Henceforth to stand recorded) who ye are,</p>\n<p>And what this multitude, that at your backs</p>\n<p>Have past behind us.&rdquo; As one, mountain-bred,</p>\n<p>Rugged and clownish, if some city&rsquo;s walls</p>\n<p>He chance to enter, round him stares agape,</p>\n<p>Confounded and struck dumb; e&rsquo;en such appear&rsquo;d</p>\n<p>Each spirit. But when rid of that amaze,</p>\n<p>(Not long the inmate of a noble heart)</p>\n<p>He, who before had question&rsquo;d, thus resum&rsquo;d:</p>\n<p>&ldquo;O blessed, who, for death preparing, tak&rsquo;st</p>\n<p>Experience of our limits, in thy bark!</p>\n<p>Their crime, who not with us proceed, was that,</p>\n<p>For which, as he did triumph, Caesar heard</p>\n<p>The snout of &rsquo;queen,&rsquo; to taunt him. Hence their cry</p>\n<p>Of &rsquo;Sodom,&rsquo; as they parted, to rebuke</p>\n<p>Themselves, and aid the burning by their shame.</p>\n<p>Our sinning was Hermaphrodite: but we,</p>\n<p>Because the law of human kind we broke,</p>\n<p>Following like beasts our vile concupiscence,</p>\n<p>Hence parting from them, to our own disgrace</p>\n<p>Record the name of her, by whom the beast</p>\n<p>In bestial tire was acted. Now our deeds</p>\n<p>Thou know&rsquo;st, and how we sinn&rsquo;d. If thou by name</p>\n<p>Wouldst haply know us, time permits not now</p>\n<p>To tell so much, nor can I. Of myself</p>\n<p>Learn what thou wishest. Guinicelli I,</p>\n<p>Who having truly sorrow&rsquo;d ere my last,</p>\n<p>Already cleanse me.&rdquo; With such pious joy,</p>\n<p>As the two sons upon their mother gaz&rsquo;d</p>\n<p>From sad Lycurgus rescu&rsquo;d, such my joy</p>\n<p>(Save that I more represt it) when I heard</p>\n<p>From his own lips the name of him pronounc&rsquo;d,</p>\n<p>Who was a father to me, and to those</p>\n<p>My betters, who have ever us&rsquo;d the sweet</p>\n<p>And pleasant rhymes of love. So nought I heard</p>\n<p>Nor spake, but long time thoughtfully I went,</p>\n<p>Gazing on him; and, only for the fire,</p>\n<p>Approach&rsquo;d not nearer. When my eyes were fed</p>\n<p>By looking on him, with such solemn pledge,</p>\n<p>As forces credence, I devoted me</p>\n<p>Unto his service wholly. In reply</p>\n<p>He thus bespake me: &ldquo;What from thee I hear</p>\n<p>Is grav&rsquo;d so deeply on my mind, the waves</p>\n<p>Of Lethe shall not wash it off, nor make</p>\n<p>A whit less lively. But as now thy oath</p>\n<p>Has seal&rsquo;d the truth, declare what cause impels</p>\n<p>That love, which both thy looks and speech bewray.&rdquo;</p>\n<p class="slindent">&ldquo;Those dulcet lays,&rdquo; I answer&rsquo;d, &ldquo;which, as long</p>\n<p>As of our tongue the beauty does not fade,</p>\n<p>Shall make us love the very ink that trac&rsquo;d them.&rdquo;</p>\n<p class="slindent">&ldquo;Brother!&rdquo; he cried, and pointed at a shade</p>\n<p>Before him, &ldquo;there is one, whose mother speech</p>\n<p>Doth owe to him a fairer ornament.</p>\n<p>He in love ditties and the tales of prose</p>\n<p>Without a rival stands, and lets the fools</p>\n<p>Talk on, who think the songster of Limoges</p>\n<p>O&rsquo;ertops him. Rumour and the popular voice</p>\n<p>They look to more than truth, and so confirm</p>\n<p>Opinion, ere by art or reason taught.</p>\n<p>Thus many of the elder time cried up</p>\n<p>Guittone, giving him the prize, till truth</p>\n<p>By strength of numbers vanquish&rsquo;d. If thou own</p>\n<p>So ample privilege, as to have gain&rsquo;d</p>\n<p>Free entrance to the cloister, whereof Christ</p>\n<p>Is Abbot of the college, say to him</p>\n<p>One paternoster for me, far as needs</p>\n<p>For dwellers in this world, where power to sin</p>\n<p>No longer tempts us.&rdquo; Haply to make way</p>\n<p>For one, that follow&rsquo;d next, when that was said,</p>\n<p>He vanish&rsquo;d through the fire, as through the wave</p>\n<p>A fish, that glances diving to the deep.</p>\n<p class="slindent">I, to the spirit he had shown me, drew</p>\n<p>A little onward, and besought his name,</p>\n<p>For which my heart, I said, kept gracious room.</p>\n<p>He frankly thus began: &ldquo;Thy courtesy</p>\n<p>So wins on me, I have nor power nor will</p>\n<p>To hide me. I am Arnault; and with songs,</p>\n<p>Sorely lamenting for my folly past,</p>\n<p>Thorough this ford of fire I wade, and see</p>\n<p>The day, I hope for, smiling in my view.</p>\n<p>I pray ye by the worth that guides ye up</p>\n<p>Unto the summit of the scale, in time</p>\n<p>Remember ye my suff&rsquo;rings.&rdquo; With such words</p>\n<p>He disappear&rsquo;d in the refining flame.</p>\n</div>','<p class="cantohead">Canto XXVII</p>\n<div class="stanza"><p>Now was the sun so station&rsquo;d, as when first</p>\n<p>His early radiance quivers on the heights,</p>\n<p>Where stream&rsquo;d his Maker&rsquo;s blood, while Libra hangs</p>\n<p>Above Hesperian Ebro, and new fires</p>\n<p>Meridian flash on Ganges&rsquo; yellow tide.</p>\n<p class="slindent">So day was sinking, when the&rsquo; angel of God</p>\n<p>Appear&rsquo;d before us. Joy was in his mien.</p>\n<p>Forth of the flame he stood upon the brink,</p>\n<p>And with a voice, whose lively clearness far</p>\n<p>Surpass&rsquo;d our human, &ldquo;Blessed are the pure</p>\n<p>In heart,&rdquo; he Sang: then near him as we came,</p>\n<p>&ldquo;Go ye not further, holy spirits!&rdquo; he cried,</p>\n<p>&ldquo;Ere the fire pierce you: enter in; and list</p>\n<p>Attentive to the song ye hear from thence.&rdquo;</p>\n<p class="slindent">I, when I heard his saying, was as one</p>\n<p>Laid in the grave. My hands together clasp&rsquo;d,</p>\n<p>And upward stretching, on the fire I look&rsquo;d,</p>\n<p>And busy fancy conjur&rsquo;d up the forms</p>\n<p>Erewhile beheld alive consum&rsquo;d in flames.</p>\n<p class="slindent">Th&rsquo; escorting spirits turn&rsquo;d with gentle looks</p>\n<p>Toward me, and the Mantuan spake: &ldquo;My son,</p>\n<p>Here torment thou mayst feel, but canst not death.</p>\n<p>Remember thee, remember thee, if I</p>\n<p>Safe e&rsquo;en on Geryon brought thee: now I come</p>\n<p>More near to God, wilt thou not trust me now?</p>\n<p>Of this be sure: though in its womb that flame</p>\n<p>A thousand years contain&rsquo;d thee, from thy head</p>\n<p>No hair should perish. If thou doubt my truth,</p>\n<p>Approach, and with thy hands thy vesture&rsquo;s hem</p>\n<p>Stretch forth, and for thyself confirm belief.</p>\n<p>Lay now all fear, O lay all fear aside.</p>\n<p>Turn hither, and come onward undismay&rsquo;d.&rdquo;</p>\n<p>I still, though conscience urg&rsquo;d&rsquo; no step advanc&rsquo;d.</p>\n<p class="slindent">When still he saw me fix&rsquo;d and obstinate,</p>\n<p>Somewhat disturb&rsquo;d he cried: &ldquo;Mark now, my son,</p>\n<p>From Beatrice thou art by this wall</p>\n<p>Divided.&rdquo; As at Thisbe&rsquo;s name the eye</p>\n<p>Of Pyramus was open&rsquo;d (when life ebb&rsquo;d</p>\n<p>Fast from his veins), and took one parting glance,</p>\n<p>While vermeil dyed the mulberry; thus I turn&rsquo;d</p>\n<p>To my sage guide, relenting, when I heard</p>\n<p>The name, that springs forever in my breast.</p>\n<p class="slindent">He shook his forehead; and, &ldquo;How long,&rdquo; he said,</p>\n<p>&ldquo;Linger we now?&rdquo; then smil&rsquo;d, as one would smile</p>\n<p>Upon a child, that eyes the fruit and yields.</p>\n<p>Into the fire before me then he walk&rsquo;d;</p>\n<p>And Statius, who erewhile no little space</p>\n<p>Had parted us, he pray&rsquo;d to come behind.</p>\n<p class="slindent">I would have cast me into molten glass</p>\n<p>To cool me, when I enter&rsquo;d; so intense</p>\n<p>Rag&rsquo;d the conflagrant mass. The sire belov&rsquo;d,</p>\n<p>To comfort me, as he proceeded, still</p>\n<p>Of Beatrice talk&rsquo;d. &ldquo;Her eyes,&rdquo; saith he,</p>\n<p>&ldquo;E&rsquo;en now I seem to view.&rdquo; From the other side</p>\n<p>A voice, that sang, did guide us, and the voice</p>\n<p>Following, with heedful ear, we issued forth,</p>\n<p>There where the path led upward. &ldquo;Come,&rdquo; we heard,</p>\n<p>&ldquo;Come, blessed of my Father.&rdquo; Such the sounds,</p>\n<p>That hail&rsquo;d us from within a light, which shone</p>\n<p>So radiant, I could not endure the view.</p>\n<p>&ldquo;The sun,&rdquo; it added, &ldquo;hastes: and evening comes.</p>\n<p>Delay not: ere the western sky is hung</p>\n<p>With blackness, strive ye for the pass.&rdquo; Our way</p>\n<p>Upright within the rock arose, and fac&rsquo;d</p>\n<p>Such part of heav&rsquo;n, that from before my steps</p>\n<p>The beams were shrouded of the sinking sun.</p>\n<p class="slindent">Nor many stairs were overpass, when now</p>\n<p>By fading of the shadow we perceiv&rsquo;d</p>\n<p>The sun behind us couch&rsquo;d: and ere one face</p>\n<p>Of darkness o&rsquo;er its measureless expanse</p>\n<p>Involv&rsquo;d th&rsquo; horizon, and the night her lot</p>\n<p>Held individual, each of us had made</p>\n<p>A stair his pallet: not that will, but power,</p>\n<p>Had fail&rsquo;d us, by the nature of that mount</p>\n<p>Forbidden further travel. As the goats,</p>\n<p>That late have skipp&rsquo;d and wanton&rsquo;d rapidly</p>\n<p>Upon the craggy cliffs, ere they had ta&rsquo;en</p>\n<p>Their supper on the herb, now silent lie</p>\n<p>And ruminate beneath the umbrage brown,</p>\n<p>While noonday rages; and the goatherd leans</p>\n<p>Upon his staff, and leaning watches them:</p>\n<p>And as the swain, that lodges out all night</p>\n<p>In quiet by his flock, lest beast of prey</p>\n<p>Disperse them; even so all three abode,</p>\n<p>I as a goat and as the shepherds they,</p>\n<p>Close pent on either side by shelving rock.</p>\n<p class="slindent">A little glimpse of sky was seen above;</p>\n<p>Yet by that little I beheld the stars</p>\n<p>In magnitude and rustle shining forth</p>\n<p>With more than wonted glory. As I lay,</p>\n<p>Gazing on them, and in that fit of musing,</p>\n<p>Sleep overcame me, sleep, that bringeth oft</p>\n<p>Tidings of future hap. About the hour,</p>\n<p>As I believe, when Venus from the east</p>\n<p>First lighten&rsquo;d on the mountain, she whose orb</p>\n<p>Seems always glowing with the fire of love,</p>\n<p>A lady young and beautiful, I dream&rsquo;d,</p>\n<p>Was passing o&rsquo;er a lea; and, as she came,</p>\n<p>Methought I saw her ever and anon</p>\n<p>Bending to cull the flowers; and thus she sang:</p>\n<p>&ldquo;Know ye, whoever of my name would ask,</p>\n<p>That I am Leah: for my brow to weave</p>\n<p>A garland, these fair hands unwearied ply.</p>\n<p>To please me at the crystal mirror, here</p>\n<p>I deck me. But my sister Rachel, she</p>\n<p>Before her glass abides the livelong day,</p>\n<p>Her radiant eyes beholding, charm&rsquo;d no less,</p>\n<p>Than I with this delightful task. Her joy</p>\n<p>In contemplation, as in labour mine.&rdquo;</p>\n<p class="slindent">And now as glimm&rsquo;ring dawn appear&rsquo;d, that breaks</p>\n<p>More welcome to the pilgrim still, as he</p>\n<p>Sojourns less distant on his homeward way,</p>\n<p>Darkness from all sides fled, and with it fled</p>\n<p>My slumber; whence I rose and saw my guide</p>\n<p>Already risen. &ldquo;That delicious fruit,</p>\n<p>Which through so many a branch the zealous care</p>\n<p>Of mortals roams in quest of, shall this day</p>\n<p>Appease thy hunger.&rdquo; Such the words I heard</p>\n<p>From Virgil&rsquo;s lip; and never greeting heard</p>\n<p>So pleasant as the sounds. Within me straight</p>\n<p>Desire so grew upon desire to mount,</p>\n<p>Thenceforward at each step I felt the wings</p>\n<p>Increasing for my flight. When we had run</p>\n<p>O&rsquo;er all the ladder to its topmost round,</p>\n<p>As there we stood, on me the Mantuan fix&rsquo;d</p>\n<p>His eyes, and thus he spake: &ldquo;Both fires, my son,</p>\n<p>The temporal and eternal, thou hast seen,</p>\n<p>And art arriv&rsquo;d, where of itself my ken</p>\n<p>No further reaches. I with skill and art</p>\n<p>Thus far have drawn thee. Now thy pleasure take</p>\n<p>For guide. Thou hast o&rsquo;ercome the steeper way,</p>\n<p>O&rsquo;ercome the straighter. Lo! the sun, that darts</p>\n<p>His beam upon thy forehead! lo! the herb,</p>\n<p>The arboreta and flowers, which of itself</p>\n<p>This land pours forth profuse! Till those bright eyes</p>\n<p>With gladness come, which, weeping, made me haste</p>\n<p>To succour thee, thou mayst or seat thee down,</p>\n<p>Or wander where thou wilt. Expect no more</p>\n<p>Sanction of warning voice or sign from me,</p>\n<p>Free of thy own arbitrement to choose,</p>\n<p>Discreet, judicious. To distrust thy sense</p>\n<p>Were henceforth error. I invest thee then</p>\n<p>With crown and mitre, sovereign o&rsquo;er thyself.&rdquo;</p>\n</div>','<p class="cantohead">Canto XXVIII</p>\n<div class="stanza"><p>Through that celestial forest, whose thick shade</p>\n<p>With lively greenness the new-springing day</p>\n<p>Attemper&rsquo;d, eager now to roam, and search</p>\n<p>Its limits round, forthwith I left the bank,</p>\n<p>Along the champain leisurely my way</p>\n<p>Pursuing, o&rsquo;er the ground, that on all sides</p>\n<p>Delicious odour breath&rsquo;d. A pleasant air,</p>\n<p>That intermitted never, never veer&rsquo;d,</p>\n<p>Smote on my temples, gently, as a wind</p>\n<p>Of softest influence: at which the sprays,</p>\n<p>Obedient all, lean&rsquo;d trembling to that part</p>\n<p>Where first the holy mountain casts his shade,</p>\n<p>Yet were not so disorder&rsquo;d, but that still</p>\n<p>Upon their top the feather&rsquo;d quiristers</p>\n<p>Applied their wonted art, and with full joy</p>\n<p>Welcom&rsquo;d those hours of prime, and warbled shrill</p>\n<p>Amid the leaves, that to their jocund lays</p>\n<p>inept tenor; even as from branch to branch,</p>\n<p>Along the piney forests on the shore</p>\n<p>Of Chiassi, rolls the gath&rsquo;ring melody,</p>\n<p>When Eolus hath from his cavern loos&rsquo;d</p>\n<p>The dripping south. Already had my steps,</p>\n<p>Though slow, so far into that ancient wood</p>\n<p>Transported me, I could not ken the place</p>\n<p>Where I had enter&rsquo;d, when behold! my path</p>\n<p>Was bounded by a rill, which to the left</p>\n<p>With little rippling waters bent the grass,</p>\n<p>That issued from its brink. On earth no wave</p>\n<p>How clean soe&rsquo;er, that would not seem to have</p>\n<p>Some mixture in itself, compar&rsquo;d with this,</p>\n<p>Transpicuous, clear; yet darkly on it roll&rsquo;d,</p>\n<p>Darkly beneath perpetual gloom, which ne&rsquo;er</p>\n<p>Admits or sun or moon light there to shine.</p>\n<p class="slindent">My feet advanc&rsquo;d not; but my wond&rsquo;ring eyes</p>\n<p>Pass&rsquo;d onward, o&rsquo;er the streamlet, to survey</p>\n<p>The tender May-bloom, flush&rsquo;d through many a hue,</p>\n<p>In prodigal variety: and there,</p>\n<p>As object, rising suddenly to view,</p>\n<p>That from our bosom every thought beside</p>\n<p>With the rare marvel chases, I beheld</p>\n<p>A lady all alone, who, singing, went,</p>\n<p>And culling flower from flower, wherewith her way</p>\n<p>Was all o&rsquo;er painted. &ldquo;Lady beautiful!</p>\n<p>Thou, who (if looks, that use to speak the heart,</p>\n<p>Are worthy of our trust), with love&rsquo;s own beam</p>\n<p>Dost warm thee,&rdquo; thus to her my speech I fram&rsquo;d:</p>\n<p>&ldquo;Ah! please thee hither towards the streamlet bend</p>\n<p>Thy steps so near, that I may list thy song.</p>\n<p>Beholding thee and this fair place, methinks,</p>\n<p>I call to mind where wander&rsquo;d and how look&rsquo;d</p>\n<p>Proserpine, in that season, when her child</p>\n<p>The mother lost, and she the bloomy spring.&rdquo;</p>\n<p class="slindent">As when a lady, turning in the dance,</p>\n<p>Doth foot it featly, and advances scarce</p>\n<p>One step before the other to the ground;</p>\n<p>Over the yellow and vermilion flowers</p>\n<p>Thus turn&rsquo;d she at my suit, most maiden-like,</p>\n<p>Valing her sober eyes, and came so near,</p>\n<p>That I distinctly caught the dulcet sound.</p>\n<p>Arriving where the limped waters now</p>\n<p>Lav&rsquo;d the green sward, her eyes she deign&rsquo;d to raise,</p>\n<p>That shot such splendour on me, as I ween</p>\n<p>Ne&rsquo;er glanced from Cytherea&rsquo;s, when her son</p>\n<p>Had sped his keenest weapon to her heart.</p>\n<p>Upon the opposite bank she stood and smil&rsquo;d</p>\n<p>through her graceful fingers shifted still</p>\n<p>The intermingling dyes, which without seed</p>\n<p>That lofty land unbosoms. By the stream</p>\n<p>Three paces only were we sunder&rsquo;d: yet</p>\n<p>The Hellespont, where Xerxes pass&rsquo;d it o&rsquo;er,</p>\n<p>(A curb for ever to the pride of man)</p>\n<p>Was by Leander not more hateful held</p>\n<p>For floating, with inhospitable wave</p>\n<p>&rsquo;Twixt Sestus and Abydos, than by me</p>\n<p>That flood, because it gave no passage thence.</p>\n<p class="slindent">&ldquo;Strangers ye come, and haply in this place,</p>\n<p>That cradled human nature in its birth,</p>\n<p>Wond&rsquo;ring, ye not without suspicion view</p>\n<p>My smiles: but that sweet strain of psalmody,</p>\n<p>&lsquo;Thou, Lord! hast made me glad,&rsquo; will give ye light,</p>\n<p>Which may uncloud your minds. And thou, who stand&rsquo;st</p>\n<p>The foremost, and didst make thy suit to me,</p>\n<p>Say if aught else thou wish to hear: for I</p>\n<p>Came prompt to answer every doubt of thine.&rdquo;</p>\n<p class="slindent">She spake; and I replied: &ldquo;l know not how</p>\n<p>To reconcile this wave and rustling sound</p>\n<p>Of forest leaves, with what I late have heard</p>\n<p>Of opposite report.&rdquo; She answering thus:</p>\n<p>&ldquo;I will unfold the cause, whence that proceeds,</p>\n<p>Which makes thee wonder; and so purge the cloud</p>\n<p>That hath enwraps thee. The First Good, whose joy</p>\n<p>Is only in himself, created man</p>\n<p>For happiness, and gave this goodly place,</p>\n<p>His pledge and earnest of eternal peace.</p>\n<p>Favour&rsquo;d thus highly, through his own defect</p>\n<p>He fell, and here made short sojourn; he fell,</p>\n<p>And, for the bitterness of sorrow, chang&rsquo;d</p>\n<p>Laughter unblam&rsquo;d and ever-new delight.</p>\n<p>That vapours none, exhal&rsquo;d from earth beneath,</p>\n<p>Or from the waters (which, wherever heat</p>\n<p>Attracts them, follow), might ascend thus far</p>\n<p>To vex man&rsquo;s peaceful state, this mountain rose</p>\n<p>So high toward the heav&rsquo;n, nor fears the rage</p>\n<p>0f elements contending, from that part</p>\n<p>Exempted, where the gate his limit bars.</p>\n<p>Because the circumambient air throughout</p>\n<p>With its first impulse circles still, unless</p>\n<p>Aught interpose to cheek or thwart its course;</p>\n<p>Upon the summit, which on every side</p>\n<p>To visitation of th&rsquo; impassive air</p>\n<p>Is open, doth that motion strike, and makes</p>\n<p>Beneath its sway th&rsquo; umbrageous wood resound:</p>\n<p>And in the shaken plant such power resides,</p>\n<p>That it impregnates with its efficacy</p>\n<p>The voyaging breeze, upon whose subtle plume</p>\n<p>That wafted flies abroad; and th&rsquo; other land</p>\n<p>Receiving (as &rsquo;t is worthy in itself,</p>\n<p>Or in the clime, that warms it), doth conceive,</p>\n<p>And from its womb produces many a tree</p>\n<p>Of various virtue. This when thou hast heard,</p>\n<p>The marvel ceases, if in yonder earth</p>\n<p>Some plant without apparent seed be found</p>\n<p>To fix its fibrous stem. And further learn,</p>\n<p>That with prolific foison of all seeds,</p>\n<p>This holy plain is fill&rsquo;d, and in itself</p>\n<p>Bears fruit that ne&rsquo;er was pluck&rsquo;d on other soil.</p>\n<p&ldquo;he water, thou behold&rsquo;st, springs not from vein,</p>\n<p>As stream, that intermittently repairs</p>\n<p>And spends his pulse of life, but issues forth</p>\n<p>From fountain, solid, undecaying, sure;</p>\n<p>And by the will omnific, full supply</p>\n<p>Feeds whatsoe&rsquo;er On either side it pours;</p>\n<p>On this devolv&rsquo;d with power to take away</p>\n<p>Remembrance of offence, on that to bring</p>\n<p>Remembrance back of every good deed done.</p>\n<p>From whence its name of Lethe on this part;</p>\n<p>On th&rsquo; other Eunoe: both of which must first</p>\n<p>Be tasted ere it work; the last exceeding</p>\n<p>All flavours else. Albeit thy thirst may now</p>\n<p>Be well contented, if I here break off,</p>\n<p>No more revealing: yet a corollary</p>\n<p>I freely give beside: nor deem my words</p>\n<p>Less grateful to thee, if they somewhat pass</p>\n<p>The stretch of promise. They, whose verse of yore</p>\n<p>The golden age recorded and its bliss,</p>\n<p>On the Parnassian mountain, of this place</p>\n<p>Perhaps had dream&rsquo;d. Here was man guiltless, here</p>\n<p>Perpetual spring and every fruit, and this</p>\n<p>The far-fam&rsquo;d nectar.&rdquo; Turning to the bards,</p>\n<p>When she had ceas&rsquo;d, I noted in their looks</p>\n<p>A smile at her conclusion; then my face</p>\n<p>Again directed to the lovely dame.</p>\n</div>','<p class="cantohead">Canto XXIX</p>\n<div class="stanza"><p>Singing, as if enamour&rsquo;d, she resum&rsquo;d</p>\n<p>And clos&rsquo;d the song, with &ldquo;Blessed they whose sins</p>\n<p>Are cover&rsquo;d.&rdquo; Like the wood-nymphs then, that tripp&rsquo;d</p>\n<p>Singly across the sylvan shadows, one</p>\n<p>Eager to view and one to &rsquo;scape the sun,</p>\n<p>So mov&rsquo;d she on, against the current, up</p>\n<p>The verdant rivage. I, her mincing step</p>\n<p>Observing, with as tardy step pursued.</p>\n<p class="slindent">Between us not an hundred paces trod,</p>\n<p>The bank, on each side bending equally,</p>\n<p>Gave me to face the orient. Nor our way</p>\n<p>Far onward brought us, when to me at once</p>\n<p>She turn&rsquo;d, and cried: &ldquo;My brother! look and hearken.&rdquo;</p>\n<p>And lo! a sudden lustre ran across</p>\n<p>Through the great forest on all parts, so bright</p>\n<p>I doubted whether lightning were abroad;</p>\n<p>But that expiring ever in the spleen,</p>\n<p>That doth unfold it, and this during still</p>\n<p>And waxing still in splendor, made me question</p>\n<p>What it might be: and a sweet melody</p>\n<p>Ran through the luminous air. Then did I chide</p>\n<p>With warrantable zeal the hardihood</p>\n<p>Of our first parent, for that there were earth</p>\n<p>Stood in obedience to the heav&rsquo;ns, she only,</p>\n<p>Woman, the creature of an hour, endur&rsquo;d not</p>\n<p>Restraint of any veil: which had she borne</p>\n<p>Devoutly, joys, ineffable as these,</p>\n<p>Had from the first, and long time since, been mine.</p>\n<p class="slindent">While through that wilderness of primy sweets</p>\n<p>That never fade, suspense I walk&rsquo;d, and yet</p>\n<p>Expectant of beatitude more high,</p>\n<p>Before us, like a blazing fire, the air</p>\n<p>Under the green boughs glow&rsquo;d; and, for a song,</p>\n<p>Distinct the sound of melody was heard.</p>\n<p class="slindent">O ye thrice holy virgins! for your sakes</p>\n<p>If e&rsquo;er I suffer&rsquo;d hunger, cold and watching,</p>\n<p>Occasion calls on me to crave your bounty.</p>\n<p>Now through my breast let Helicon his stream</p>\n<p>Pour copious; and Urania with her choir</p>\n<p>Arise to aid me: while the verse unfolds</p>\n<p>Things that do almost mock the grasp of thought.</p>\n<p class="slindent">Onward a space, what seem&rsquo;d seven trees of gold,</p>\n<p>The intervening distance to mine eye</p>\n<p>Falsely presented; but when I was come</p>\n<p>So near them, that no lineament was lost</p>\n<p>Of those, with which a doubtful object, seen</p>\n<p>Remotely, plays on the misdeeming sense,</p>\n<p>Then did the faculty, that ministers</p>\n<p>Discourse to reason, these for tapers of gold</p>\n<p>Distinguish, and it th&rsquo; singing trace the sound</p>\n<p>&ldquo;Hosanna.&rdquo; Above, their beauteous garniture</p>\n<p>Flam&rsquo;d with more ample lustre, than the moon</p>\n<p>Through cloudless sky at midnight in her full.</p>\n<p class="slindent">I turn&rsquo;d me full of wonder to my guide;</p>\n<p>And he did answer with a countenance</p>\n<p>Charg&rsquo;d with no less amazement: whence my view</p>\n<p>Reverted to those lofty things, which came</p>\n<p>So slowly moving towards us, that the bride</p>\n<p>Would have outstript them on her bridal day.</p>\n<p class="slindent">The lady called aloud: &ldquo;Why thus yet burns</p>\n<p>Affection in thee for these living, lights,</p>\n<p>And dost not look on that which follows them?&rdquo;</p>\n<p class="slindent">I straightway mark&rsquo;d a tribe behind them walk,</p>\n<p>As if attendant on their leaders, cloth&rsquo;d</p>\n<p>With raiment of such whiteness, as on earth</p>\n<p>Was never. On my left, the wat&rsquo;ry gleam</p>\n<p>Borrow&rsquo;d, and gave me back, when there I look&rsquo;d.</p>\n<p>As in a mirror, my left side portray&rsquo;d.</p>\n<p class="slindent">When I had chosen on the river&rsquo;s edge</p>\n<p>Such station, that the distance of the stream</p>\n<p>Alone did separate me; there I stay&rsquo;d</p>\n<p>My steps for clearer prospect, and beheld</p>\n<p>The flames go onward, leaving, as they went,</p>\n<p>The air behind them painted as with trail</p>\n<p>Of liveliest pencils! so distinct were mark&rsquo;d</p>\n<p>All those sev&rsquo;n listed colours, whence the sun</p>\n<p>Maketh his bow, and Cynthia her zone.</p>\n<p>These streaming gonfalons did flow beyond</p>\n<p>My vision; and ten paces, as I guess,</p>\n<p>Parted the outermost. Beneath a sky</p>\n<p>So beautiful, came foul and-twenty elders,</p>\n<p>By two and two, with flower-de-luces crown&rsquo;d.</p>\n<p>All sang one song: &ldquo;Blessed be thou among</p>\n<p>The daughters of Adam! and thy loveliness</p>\n<p>Blessed for ever!&rdquo; After that the flowers,</p>\n<p>And the fresh herblets, on the opposite brink,</p>\n<p>Were free from that elected race; as light</p>\n<p>In heav&rsquo;n doth second light, came after them</p>\n<p>Four animals, each crown&rsquo;d with verdurous leaf.</p>\n<p>With six wings each was plum&rsquo;d, the plumage full</p>\n<p>Of eyes, and th&rsquo; eyes of Argus would be such,</p>\n<p>Were they endued with life. Reader, more rhymes</p>\n<p>Will not waste in shadowing forth their form:</p>\n<p>For other need no straitens, that in this</p>\n<p>I may not give my bounty room. But read</p>\n<p>Ezekiel; for he paints them, from the north</p>\n<p>How he beheld them come by Chebar&rsquo;s flood,</p>\n<p>In whirlwind, cloud and fire; and even such</p>\n<p>As thou shalt find them character&rsquo;d by him,</p>\n<p>Here were they; save as to the pennons; there,</p>\n<p>From him departing, John accords with me.</p>\n<p class="slindent">The space, surrounded by the four, enclos&rsquo;d</p>\n<p>A car triumphal: on two wheels it came</p>\n<p>Drawn at a Gryphon&rsquo;s neck; and he above</p>\n<p>Stretch&rsquo;d either wing uplifted, &rsquo;tween the midst</p>\n<p>And the three listed hues, on each side three;</p>\n<p>So that the wings did cleave or injure none;</p>\n<p>And out of sight they rose. The members, far</p>\n<p>As he was bird, were golden; white the rest</p>\n<p>With vermeil intervein&rsquo;d. So beautiful</p>\n<p>A car in Rome ne&rsquo;er grac&rsquo;d Augustus pomp,</p>\n<p>Or Africanus&rsquo;: e&rsquo;en the sun&rsquo;s itself</p>\n<p>Were poor to this, that chariot of the sun</p>\n<p>Erroneous, which in blazing ruin fell</p>\n<p>At Tellus&rsquo; pray&rsquo;r devout, by the just doom</p>\n<p>Mysterious of all-seeing Jove. Three nymphs</p>\n<p>,k the right wheel, came circling in smooth dance;</p>\n<p>The one so ruddy, that her form had scarce</p>\n<p>Been known within a furnace of clear flame:</p>\n<p>The next did look, as if the flesh and bones</p>\n<p>Were emerald: snow new-fallen seem&rsquo;d the third.</p>\n<p>Now seem&rsquo;d the white to lead, the ruddy now;</p>\n<p>And from her song who led, the others took</p>\n<p>Their treasure, swift or slow. At th&rsquo; other wheel,</p>\n<p>A band quaternion, each in purple clad,</p>\n<p>Advanc&rsquo;d with festal step, as of them one</p>\n<p>The rest conducted, one, upon whose front</p>\n<p>Three eyes were seen. In rear of all this group,</p>\n<p>Two old men I beheld, dissimilar</p>\n<p>In raiment, but in port and gesture like,</p>\n<p>Solid and mainly grave; of whom the one</p>\n<p>Did show himself some favour&rsquo;d counsellor</p>\n<p>Of the great Coan, him, whom nature made</p>\n<p>To serve the costliest creature of her tribe.</p>\n<p>His fellow mark&rsquo;d an opposite intent,</p>\n<p>Bearing a sword, whose glitterance and keen edge,</p>\n<p>E&rsquo;en as I view&rsquo;d it with the flood between,</p>\n<p>Appall&rsquo;d me. Next four others I beheld,</p>\n<p>Of humble seeming: and, behind them all,</p>\n<p>One single old man, sleeping, as he came,</p>\n<p>With a shrewd visage. And these seven, each</p>\n<p>Like the first troop were habited, hut wore</p>\n<p>No braid of lilies on their temples wreath&rsquo;d.</p>\n<p>Rather with roses and each vermeil flower,</p>\n<p>A sight, but little distant, might have sworn,</p>\n<p>That they were all on fire above their brow.</p>\n<p class="slindent">Whenas the car was o&rsquo;er against me, straight.</p>\n<p>Was heard a thund&rsquo;ring, at whose voice it seem&rsquo;d</p>\n<p>The chosen multitude were stay&rsquo;d; for there,</p>\n<p>With the first ensigns, made they solemn halt.</p>\n</div>','<p class="cantohead">Canto XXX</p>\n<div class="stanza"><p>Soon as the polar light, which never knows</p>\n<p>Setting nor rising, nor the shadowy veil</p>\n<p>Of other cloud than sin, fair ornament</p>\n<p>Of the first heav&rsquo;n, to duty each one there</p>\n<p>Safely convoying, as that lower doth</p>\n<p>The steersman to his port, stood firmly fix&rsquo;d;</p>\n<p>Forthwith the saintly tribe, who in the van</p>\n<p>Between the Gryphon and its radiance came,</p>\n<p>Did turn them to the car, as to their rest:</p>\n<p>And one, as if commission&rsquo;d from above,</p>\n<p>In holy chant thrice shorted forth aloud:</p>\n<p>&ldquo;Come, spouse, from Libanus!&rdquo; and all the rest</p>\n<p>Took up the song&mdash;At the last audit so</p>\n<p>The blest shall rise, from forth his cavern each</p>\n<p>Uplifting lightly his new-vested flesh,</p>\n<p>As, on the sacred litter, at the voice</p>\n<p>Authoritative of that elder, sprang</p>\n<p>A hundred ministers and messengers</p>\n<p>Of life eternal. &ldquo;Blessed thou! who com&rsquo;st!&rdquo;</p>\n<p>And, &ldquo;O,&rdquo; they cried, &ldquo;from full hands scatter ye</p>\n<p>Unwith&rsquo;ring lilies;&rdquo; and, so saying, cast</p>\n<p>Flowers over head and round them on all sides.</p>\n<p class="slindent">I have beheld, ere now, at break of day,</p>\n<p>The eastern clime all roseate, and the sky</p>\n<p>Oppos&rsquo;d, one deep and beautiful serene,</p>\n<p>And the sun&rsquo;s face so shaded, and with mists</p>\n<p>Attemper&rsquo;d at lids rising, that the eye</p>\n<p>Long while endur&rsquo;d the sight: thus in a cloud</p>\n<p>Of flowers, that from those hands angelic rose,</p>\n<p>And down, within and outside of the car,</p>\n<p>Fell showering, in white veil with olive wreath&rsquo;d,</p>\n<p>A virgin in my view appear&rsquo;d, beneath</p>\n<p>Green mantle, rob&rsquo;d in hue of living flame:</p>\n<p>And o&rsquo;er my Spirit, that in former days</p>\n<p>Within her presence had abode so long,</p>\n<p>No shudd&rsquo;ring terror crept. Mine eyes no more</p>\n<p>Had knowledge of her; yet there mov&rsquo;d from her</p>\n<p>A hidden virtue, at whose touch awak&rsquo;d,</p>\n<p>The power of ancient love was strong within me.</p>\n<p class="slindent">No sooner on my vision streaming, smote</p>\n<p>The heav&rsquo;nly influence, which years past, and e&rsquo;en</p>\n<p>In childhood, thrill&rsquo;d me, than towards Virgil I</p>\n<p>Turn&rsquo;d me to leftward, panting, like a babe,</p>\n<p>That flees for refuge to his mother&rsquo;s breast,</p>\n<p>If aught have terrified or work&rsquo;d him woe:</p>\n<p>And would have cried: &ldquo;There is no dram of blood,</p>\n<p>That doth not quiver in me. The old flame</p>\n<p>Throws out clear tokens of reviving fire:&rdquo;</p>\n<p>But Virgil had bereav&rsquo;d us of himself,</p>\n<p>Virgil, my best-lov&rsquo;d father; Virgil, he</p>\n<p>To whom I gave me up for safety: nor,</p>\n<p>All, our prime mother lost, avail&rsquo;d to save</p>\n<p>My undew&rsquo;d cheeks from blur of soiling tears.</p>\n<p class="slindent">&ldquo;Dante, weep not, that Virgil leaves thee: nay,</p>\n<p>Weep thou not yet: behooves thee feel the edge</p>\n<p>Of other sword, and thou shalt weep for that.&rdquo;</p>\n<p class="slindent">As to the prow or stern, some admiral</p>\n<p>Paces the deck, inspiriting his crew,</p>\n<p>When &rsquo;mid the sail-yards all hands ply aloof;</p>\n<p>Thus on the left side of the car I saw,</p>\n<p>(Turning me at the sound of mine own name,</p>\n<p>Which here I am compell&rsquo;d to register)</p>\n<p>The virgin station&rsquo;d, who before appeared</p>\n<p>Veil&rsquo;d in that festive shower angelical.</p>\n<p class="slindent">Towards me, across the stream, she bent her eyes;</p>\n<p>Though from her brow the veil descending, bound</p>\n<p>With foliage of Minerva, suffer&rsquo;d not</p>\n<p>That I beheld her clearly; then with act</p>\n<p>Full royal, still insulting o&rsquo;er her thrall,</p>\n<p>Added, as one, who speaking keepeth back</p>\n<p>The bitterest saying, to conclude the speech:</p>\n<p>&ldquo;Observe me well. I am, in sooth, I am</p>\n<p>Beatrice. What! and hast thou deign&rsquo;d at last</p>\n<p>Approach the mountain? knewest not, O man!</p>\n<p>Thy happiness is whole?&rdquo; Down fell mine eyes</p>\n<p>On the clear fount, but there, myself espying,</p>\n<p>Recoil&rsquo;d, and sought the greensward: such a weight</p>\n<p>Of shame was on my forehead. With a mien</p>\n<p>Of that stern majesty, which doth surround</p>\n<p>mother&rsquo;s presence to her awe-struck child,</p>\n<p>She look&rsquo;d; a flavour of such bitterness</p>\n<p>Was mingled in her pity. There her words</p>\n<p>Brake off, and suddenly the angels sang:</p>\n<p>&ldquo;In thee, O gracious Lord, my hope hath been:&rdquo;</p>\n<p>But went no farther than, &ldquo;Thou Lord, hast set</p>\n<p>My feet in ample room.&rdquo; As snow, that lies</p>\n<p>Amidst the living rafters on the back</p>\n<p>Of Italy congeal&rsquo;d when drifted high</p>\n<p>And closely pil&rsquo;d by rough Sclavonian blasts,</p>\n<p>Breathe but the land whereon no shadow falls,</p>\n<p>And straightway melting it distils away,</p>\n<p>Like a fire-wasted taper: thus was I,</p>\n<p>Without a sigh or tear, or ever these</p>\n<p>Did sing, that with the chiming of heav&rsquo;n&rsquo;s sphere,</p>\n<p>Still in their warbling chime: but when the strain</p>\n<p>Of dulcet symphony, express&rsquo;d for me</p>\n<p>Their soft compassion, more than could the words</p>\n<p>&ldquo;Virgin, why so consum&rsquo;st him?&rdquo; then the ice,</p>\n<p>Congeal&rsquo;d about my bosom, turn&rsquo;d itself</p>\n<p>To spirit and water, and with anguish forth</p>\n<p>Gush&rsquo;d through the lips and eyelids from the heart.</p>\n<p class="slindent">Upon the chariot&rsquo;s right edge still she stood,</p>\n<p>Immovable, and thus address&rsquo;d her words</p>\n<p>To those bright semblances with pity touch&rsquo;d:</p>\n<p>&ldquo;Ye in th&rsquo; eternal day your vigils keep,</p>\n<p>So that nor night nor slumber, with close stealth,</p>\n<p>Conveys from you a single step in all</p>\n<p>The goings on of life: thence with more heed</p>\n<p>I shape mine answer, for his ear intended,</p>\n<p>Who there stands weeping, that the sorrow now</p>\n<p>May equal the transgression. Not alone</p>\n<p>Through operation of the mighty orbs,</p>\n<p>That mark each seed to some predestin&rsquo;d aim,</p>\n<p>As with aspect or fortunate or ill</p>\n<p>The constellations meet, but through benign</p>\n<p>Largess of heav&rsquo;nly graces, which rain down</p>\n<p>From such a height, as mocks our vision, this man</p>\n<p>Was in the freshness of his being, such,</p>\n<p>So gifted virtually, that in him</p>\n<p>All better habits wond&rsquo;rously had thriv&rsquo;d.</p>\n<p>The more of kindly strength is in the soil,</p>\n<p>So much doth evil seed and lack of culture</p>\n<p>Mar it the more, and make it run to wildness.</p>\n<p>These looks sometime upheld him; for I show&rsquo;d</p>\n<p>My youthful eyes, and led him by their light</p>\n<p>In upright walking. Soon as I had reach&rsquo;d</p>\n<p>The threshold of my second age, and chang&rsquo;d</p>\n<p>My mortal for immortal, then he left me,</p>\n<p>And gave himself to others. When from flesh</p>\n<p>To spirit I had risen, and increase</p>\n<p>Of beauty and of virtue circled me,</p>\n<p>I was less dear to him, and valued less.</p>\n<p>His steps were turn&rsquo;d into deceitful ways,</p>\n<p>Following false images of good, that make</p>\n<p>No promise perfect. Nor avail&rsquo;d me aught</p>\n<p>To sue for inspirations, with the which,</p>\n<p>I, both in dreams of night, and otherwise,</p>\n<p>Did call him back; of them so little reck&rsquo;d him,</p>\n<p>Such depth he fell, that all device was short</p>\n<p>Of his preserving, save that he should view</p>\n<p>The children of perdition. To this end</p>\n<p>I visited the purlieus of the dead:</p>\n<p>And one, who hath conducted him thus high,</p>\n<p>Receiv&rsquo;d my supplications urg&rsquo;d with weeping.</p>\n<p>It were a breaking of God&rsquo;s high decree,</p>\n<p>If Lethe should be past, and such food tasted</p>\n<p>Without the cost of some repentant tear.&rdquo;</p>\n</div>','<p class="cantohead">Canto XXXI</p>\n<div class="stanza"><p>&ldquo;O Thou!&rdquo; her words she thus without delay</p>\n<p>Resuming, turn&rsquo;d their point on me, to whom</p>\n<p>They but with lateral edge seem&rsquo;d harsh before,</p>\n<p>&ldquo;Say thou, who stand&rsquo;st beyond the holy stream,</p>\n<p>If this be true. A charge so grievous needs</p>\n<p>Thine own avowal.&rdquo; On my faculty</p>\n<p>Such strange amazement hung, the voice expir&rsquo;d</p>\n<p>Imperfect, ere its organs gave it birth.</p>\n<p class="slindent">A little space refraining, then she spake:</p>\n<p>&ldquo;What dost thou muse on? Answer me. The wave</p>\n<p>On thy remembrances of evil yet</p>\n<p>Hath done no injury.&rdquo; A mingled sense</p>\n<p>Of fear and of confusion, from my lips</p>\n<p>Did such a &ldquo;Yea &ldquo; produce, as needed help</p>\n<p>Of vision to interpret. As when breaks</p>\n<p>In act to be discharg&rsquo;d, a cross-bow bent</p>\n<p>Beyond its pitch, both nerve and bow o&rsquo;erstretch&rsquo;d,</p>\n<p>The flagging weapon feebly hits the mark;</p>\n<p>Thus, tears and sighs forth gushing, did I burst</p>\n<p>Beneath the heavy load, and thus my voice</p>\n<p>Was slacken&rsquo;d on its way. She straight began:</p>\n<p>&ldquo;When my desire invited thee to love</p>\n<p>The good, which sets a bound to our aspirings,</p>\n<p>What bar of thwarting foss or linked chain</p>\n<p>Did meet thee, that thou so should&rsquo;st quit the hope</p>\n<p>Of further progress, or what bait of ease</p>\n<p>Or promise of allurement led thee on</p>\n<p>Elsewhere, that thou elsewhere should&rsquo;st rather wait?&rdquo;</p>\n<p class="slindent">A bitter sigh I drew, then scarce found voice</p>\n<p>To answer, hardly to these sounds my lips</p>\n<p>Gave utterance, wailing: &ldquo;Thy fair looks withdrawn,</p>\n<p>Things present, with deceitful pleasures, turn&rsquo;d</p>\n<p>My steps aside.&rdquo; She answering spake: &ldquo;Hadst thou</p>\n<p>Been silent, or denied what thou avow&rsquo;st,</p>\n<p>Thou hadst not hid thy sin the more: such eye</p>\n<p>Observes it. But whene&rsquo;er the sinner&rsquo;s cheek</p>\n<p>Breaks forth into the precious-streaming tears</p>\n<p>Of self-accusing, in our court the wheel</p>\n<p>Of justice doth run counter to the edge.</p>\n<p>Howe&rsquo;er that thou may&rsquo;st profit by thy shame</p>\n<p>For errors past, and that henceforth more strength</p>\n<p>May arm thee, when thou hear&rsquo;st the Siren-voice,</p>\n<p>Lay thou aside the motive to this grief,</p>\n<p>And lend attentive ear, while I unfold</p>\n<p>How opposite a way my buried flesh</p>\n<p>Should have impell&rsquo;d thee. Never didst thou spy</p>\n<p>In art or nature aught so passing sweet,</p>\n<p>As were the limbs, that in their beauteous frame</p>\n<p>Enclos&rsquo;d me, and are scatter&rsquo;d now in dust.</p>\n<p>If sweetest thing thus fail&rsquo;d thee with my death,</p>\n<p>What, afterward, of mortal should thy wish</p>\n<p>Have tempted? When thou first hadst felt the dart</p>\n<p>Of perishable things, in my departing</p>\n<p>For better realms, thy wing thou should&rsquo;st have prun&rsquo;d</p>\n<p>To follow me, and never stoop&rsquo;d again</p>\n<p>To &rsquo;bide a second blow for a slight girl,</p>\n<p>Or other gaud as transient and as vain.</p>\n<p>The new and inexperienc&rsquo;d bird awaits,</p>\n<p>Twice it may be, or thrice, the fowler&rsquo;s aim;</p>\n<p>But in the sight of one, whose plumes are full,</p>\n<p>In vain the net is spread, the arrow wing&rsquo;d.&rdquo;</p>\n<p class="slindent">I stood, as children silent and asham&rsquo;d</p>\n<p>Stand, list&rsquo;ning, with their eyes upon the earth,</p>\n<p>Acknowledging their fault and self-condemn&rsquo;d.</p>\n<p>And she resum&rsquo;d: &ldquo;If, but to hear thus pains thee,</p>\n<p>Raise thou thy beard, and lo! what sight shall do!&rdquo;</p>\n<p class="slindent">With less reluctance yields a sturdy holm,</p>\n<p>Rent from its fibers by a blast, that blows</p>\n<p>From off the pole, or from Iarbas&rsquo; land,</p>\n<p>Than I at her behest my visage rais&rsquo;d:</p>\n<p>And thus the face denoting by the beard,</p>\n<p>I mark&rsquo;d the secret sting her words convey&rsquo;d.</p>\n<p class="slindent">No sooner lifted I mine aspect up,</p>\n<p>Than downward sunk that vision I beheld</p>\n<p>Of goodly creatures vanish; and mine eyes</p>\n<p>Yet unassur&rsquo;d and wavering, bent their light</p>\n<p>On Beatrice. Towards the animal,</p>\n<p>Who joins two natures in one form, she turn&rsquo;d,</p>\n<p>And, even under shadow of her veil,</p>\n<p>And parted by the verdant rill, that flow&rsquo;d</p>\n<p>Between, in loveliness appear&rsquo;d as much</p>\n<p>Her former self surpassing, as on earth</p>\n<p>All others she surpass&rsquo;d. Remorseful goads</p>\n<p>Shot sudden through me. Each thing else, the more</p>\n<p>Its love had late beguil&rsquo;d me, now the more</p>\n<p>I Was loathsome. On my heart so keenly smote</p>\n<p>The bitter consciousness, that on the ground</p>\n<p>O&rsquo;erpower&rsquo;d I fell: and what my state was then,</p>\n<p>She knows who was the cause. When now my strength</p>\n<p>Flow&rsquo;d back, returning outward from the heart,</p>\n<p>The lady, whom alone I first had seen,</p>\n<p>I found above me. &ldquo;Loose me not,&rdquo; she cried:</p>\n<p>&ldquo;Loose not thy hold;&rdquo; and lo! had dragg&rsquo;d me high</p>\n<p>As to my neck into the stream, while she,</p>\n<p>Still as she drew me after, swept along,</p>\n<p>Swift as a shuttle, bounding o&rsquo;er the wave.</p>\n<p class="slindent">The blessed shore approaching then was heard</p>\n<p>So sweetly, &ldquo;Tu asperges me,&rdquo; that I</p>\n<p>May not remember, much less tell the sound.</p>\n<p>The beauteous dame, her arms expanding, clasp&rsquo;d</p>\n<p>My temples, and immerg&rsquo;d me, where &rsquo;t was fit</p>\n<p>The wave should drench me: and thence raising up,</p>\n<p>Within the fourfold dance of lovely nymphs</p>\n<p>Presented me so lav&rsquo;d, and with their arm</p>\n<p>They each did cover me. &ldquo;Here are we nymphs,</p>\n<p>And in the heav&rsquo;n are stars. Or ever earth</p>\n<p>Was visited of Beatrice, we</p>\n<p>Appointed for her handmaids, tended on her.</p>\n<p>We to her eyes will lead thee; but the light</p>\n<p>Of gladness that is in them, well to scan,</p>\n<p>Those yonder three, of deeper ken than ours,</p>\n<p>Thy sight shall quicken.&rdquo; Thus began their song;</p>\n<p>And then they led me to the Gryphon&rsquo;s breast,</p>\n<p>While, turn&rsquo;d toward us, Beatrice stood.</p>\n<p>&ldquo;Spare not thy vision. We have stationed thee</p>\n<p>Before the emeralds, whence love erewhile</p>\n<p>Hath drawn his weapons on thee. &ldquo;As they spake,</p>\n<p>A thousand fervent wishes riveted</p>\n<p>Mine eyes upon her beaming eyes, that stood</p>\n<p>Still fix&rsquo;d toward the Gryphon motionless.</p>\n<p>As the sun strikes a mirror, even thus</p>\n<p>Within those orbs the twofold being, shone,</p>\n<p>For ever varying, in one figure now</p>\n<p>Reflected, now in other. Reader! muse</p>\n<p>How wond&rsquo;rous in my sight it seem&rsquo;d to mark</p>\n<p>A thing, albeit steadfast in itself,</p>\n<p>Yet in its imag&rsquo;d semblance mutable.</p>\n<p class="slindent">Full of amaze, and joyous, while my soul</p>\n<p>Fed on the viand, whereof still desire</p>\n<p>Grows with satiety, the other three</p>\n<p>With gesture, that declar&rsquo;d a loftier line,</p>\n<p>Advanc&rsquo;d: to their own carol on they came</p>\n<p>Dancing in festive ring angelical.</p>\n<p class="slindent">&ldquo;Turn, Beatrice!&rdquo; was their song: &ldquo;O turn</p>\n<p>Thy saintly sight on this thy faithful one,</p>\n<p>Who to behold thee many a wearisome pace</p>\n<p>Hath measur&rsquo;d. Gracious at our pray&rsquo;r vouchsafe</p>\n<p>Unveil to him thy cheeks: that he may mark</p>\n<p>Thy second beauty, now conceal&rsquo;d.&rdquo; O splendour!</p>\n<p>O sacred light eternal! who is he</p>\n<p>So pale with musing in Pierian shades,</p>\n<p>Or with that fount so lavishly imbued,</p>\n<p>Whose spirit should not fail him in th&rsquo; essay</p>\n<p>To represent thee such as thou didst seem,</p>\n<p>When under cope of the still-chiming heaven</p>\n<p>Thou gav&rsquo;st to open air thy charms reveal&rsquo;d.</p>\n</div>','<p class="cantohead">Canto XXXII</p>\n<div class="stanza"><p>Mine eyes with such an eager coveting,</p>\n<p>Were bent to rid them of their ten years&rsquo; thirst,</p>\n<p>No other sense was waking: and e&rsquo;en they</p>\n<p>Were fenc&rsquo;d on either side from heed of aught;</p>\n<p>So tangled in its custom&rsquo;d toils that smile</p>\n<p>Of saintly brightness drew me to itself,</p>\n<p>When forcibly toward the left my sight</p>\n<p>The sacred virgins turn&rsquo;d; for from their lips</p>\n<p>I heard the warning sounds: &ldquo;Too fix&rsquo;d a gaze!&rdquo;</p>\n<p class="slindent">Awhile my vision labor&rsquo;d; as when late</p>\n<p>Upon the&rsquo; o&rsquo;erstrained eyes the sun hath smote:</p>\n<p>But soon to lesser object, as the view</p>\n<p>Was now recover&rsquo;d (lesser in respect</p>\n<p>To that excess of sensible, whence late</p>\n<p>I had perforce been sunder&rsquo;d) on their right</p>\n<p>I mark&rsquo;d that glorious army wheel, and turn,</p>\n<p>Against the sun and sev&rsquo;nfold lights, their front.</p>\n<p>As when, their bucklers for protection rais&rsquo;d,</p>\n<p>A well-rang&rsquo;d troop, with portly banners curl&rsquo;d,</p>\n<p>Wheel circling, ere the whole can change their ground:</p>\n<p>E&rsquo;en thus the goodly regiment of heav&rsquo;n</p>\n<p>Proceeding, all did pass us, ere the car</p>\n<p>Had slop&rsquo;d his beam. Attendant at the wheels</p>\n<p>The damsels turn&rsquo;d; and on the Gryphon mov&rsquo;d</p>\n<p>The sacred burden, with a pace so smooth,</p>\n<p>No feather on him trembled. The fair dame</p>\n<p>Who through the wave had drawn me, companied</p>\n<p>By Statius and myself, pursued the wheel,</p>\n<p>Whose orbit, rolling, mark&rsquo;d a lesser arch.</p>\n<p class="slindent">Through the high wood, now void (the more her blame,</p>\n<p>Who by the serpent was beguil&rsquo;d) I past</p>\n<p>With step in cadence to the harmony</p>\n<p>Angelic. Onward had we mov&rsquo;d, as far</p>\n<p>Perchance as arrow at three several flights</p>\n<p>Full wing&rsquo;d had sped, when from her station down</p>\n<p>Descended Beatrice. With one voice</p>\n<p>All murmur&rsquo;d &ldquo;Adam,&rdquo; circling next a plant</p>\n<p>Despoil&rsquo;d of flowers and leaf on every bough.</p>\n<p>Its tresses, spreading more as more they rose,</p>\n<p>Were such, as &rsquo;midst their forest wilds for height</p>\n<p>The Indians might have gaz&rsquo;d at. &ldquo;Blessed thou!</p>\n<p>Gryphon, whose beak hath never pluck&rsquo;d that tree</p>\n<p>Pleasant to taste: for hence the appetite</p>\n<p>Was warp&rsquo;d to evil.&rdquo; Round the stately trunk</p>\n<p>Thus shouted forth the rest, to whom return&rsquo;d</p>\n<p>The animal twice-gender&rsquo;d: &ldquo;Yea: for so</p>\n<p>The generation of the just are sav&rsquo;d.&rdquo;</p>\n<p>And turning to the chariot-pole, to foot</p>\n<p>He drew it of the widow&rsquo;d branch, and bound</p>\n<p>There left unto the stock whereon it grew.</p>\n<p class="slindent">As when large floods of radiance from above</p>\n<p>Stream, with that radiance mingled, which ascends</p>\n<p>Next after setting of the scaly sign,</p>\n<p>Our plants then burgeon, and each wears anew</p>\n<p>His wonted colours, ere the sun have yok&rsquo;d</p>\n<p>Beneath another star his flamy steeds;</p>\n<p>Thus putting forth a hue, more faint than rose,</p>\n<p>And deeper than the violet, was renew&rsquo;d</p>\n<p>The plant, erewhile in all its branches bare.</p>\n<p class="slindent">Unearthly was the hymn, which then arose.</p>\n<p>I understood it not, nor to the end</p>\n<p>Endur&rsquo;d the harmony. Had I the skill</p>\n<p>To pencil forth, how clos&rsquo;d th&rsquo; unpitying eyes</p>\n<p>Slumb&rsquo;ring, when Syrinx warbled, (eyes that paid</p>\n<p>So dearly for their watching,) then like painter,</p>\n<p>That with a model paints, I might design</p>\n<p>The manner of my falling into sleep.</p>\n<p>But feign who will the slumber cunningly;</p>\n<p>I pass it by to when I wak&rsquo;d, and tell</p>\n<p>How suddenly a flash of splendour rent</p>\n<p>The curtain of my sleep, and one cries out:</p>\n<p>&ldquo;Arise, what dost thou?&rdquo; As the chosen three,</p>\n<p>On Tabor&rsquo;s mount, admitted to behold</p>\n<p>The blossoming of that fair tree, whose fruit</p>\n<p>Is coveted of angels, and doth make</p>\n<p>Perpetual feast in heaven, to themselves</p>\n<p>Returning at the word, whence deeper sleeps</p>\n<p>Were broken, that they their tribe diminish&rsquo;d saw,</p>\n<p>Both Moses and Elias gone, and chang&rsquo;d</p>\n<p>The stole their master wore: thus to myself</p>\n<p>Returning, over me beheld I stand</p>\n<p>The piteous one, who cross the stream had brought</p>\n<p>My steps. &ldquo;And where,&rdquo; all doubting, I exclaim&rsquo;d,</p>\n<p>&ldquo;Is Beatrice?&rdquo;&mdash;&ldquo;See her,&rdquo; she replied,</p>\n<p>&ldquo;Beneath the fresh leaf seated on its root.</p>\n<p>Behold th&rsquo; associate choir that circles her.</p>\n<p>The others, with a melody more sweet</p>\n<p>And more profound, journeying to higher realms,</p>\n<p>Upon the Gryphon tend.&rdquo; If there her words</p>\n<p>Were clos&rsquo;d, I know not; but mine eyes had now</p>\n<p>Ta&rsquo;en view of her, by whom all other thoughts</p>\n<p>Were barr&rsquo;d admittance. On the very ground</p>\n<p>Alone she sat, as she had there been left</p>\n<p>A guard upon the wain, which I beheld</p>\n<p>Bound to the twyform beast. The seven nymphs</p>\n<p>Did make themselves a cloister round about her,</p>\n<p>And in their hands upheld those lights secure</p>\n<p>From blast septentrion and the gusty south.</p>\n<p class="slindent">&ldquo;A little while thou shalt be forester here:</p>\n<p>And citizen shalt be forever with me,</p>\n<p>Of that true Rome, wherein Christ dwells a Roman</p>\n<p>To profit the misguided world, keep now</p>\n<p>Thine eyes upon the car; and what thou seest,</p>\n<p>Take heed thou write, returning to that place.&rdquo;</p>\n<p class="slindent">Thus Beatrice: at whose feet inclin&rsquo;d</p>\n<p>Devout, at her behest, my thought and eyes,</p>\n<p>I, as she bade, directed. Never fire,</p>\n<p>With so swift motion, forth a stormy cloud</p>\n<p>Leap&rsquo;d downward from the welkin&rsquo;s farthest bound,</p>\n<p>As I beheld the bird of Jove descending</p>\n<p>Pounce on the tree, and, as he rush&rsquo;d, the rind,</p>\n<p>Disparting crush beneath him, buds much more</p>\n<p>And leaflets. On the car with all his might</p>\n<p>He struck, whence, staggering like a ship, it reel&rsquo;d,</p>\n<p>At random driv&rsquo;n, to starboard now, o&rsquo;ercome,</p>\n<p>And now to larboard, by the vaulting waves.</p>\n<p class="slindent">Next springing up into the chariot&rsquo;s womb</p>\n<p>A fox I saw, with hunger seeming pin&rsquo;d</p>\n<p>Of all good food. But, for his ugly sins</p>\n<p>The saintly maid rebuking him, away</p>\n<p>Scamp&rsquo;ring he turn&rsquo;d, fast as his hide-bound corpse</p>\n<p>Would bear him. Next, from whence before he came,</p>\n<p>I saw the eagle dart into the hull</p>\n<p>O&rsquo; th&rsquo; car, and leave it with his feathers lin&rsquo;d;</p>\n<p>And then a voice, like that which issues forth</p>\n<p>From heart with sorrow riv&rsquo;d, did issue forth</p>\n<p>From heav&rsquo;n, and, &ldquo;O poor bark of mine!&rdquo; it cried,</p>\n<p>&ldquo;How badly art thou freighted!&rdquo; Then, it seem&rsquo;d,</p>\n<p>That the earth open&rsquo;d between either wheel,</p>\n<p>And I beheld a dragon issue thence,</p>\n<p>That through the chariot fix&rsquo;d his forked train;</p>\n<p>And like a wasp that draggeth back the sting,</p>\n<p>So drawing forth his baleful train, he dragg&rsquo;d</p>\n<p>Part of the bottom forth, and went his way</p>\n<p>Exulting. What remain&rsquo;d, as lively turf</p>\n<p>With green herb, so did clothe itself with plumes,</p>\n<p>Which haply had with purpose chaste and kind</p>\n<p>Been offer&rsquo;d; and therewith were cloth&rsquo;d the wheels,</p>\n<p>Both one and other, and the beam, so quickly</p>\n<p>A sigh were not breath&rsquo;d sooner. Thus transform&rsquo;d,</p>\n<p>The holy structure, through its several parts,</p>\n<p>Did put forth heads, three on the beam, and one</p>\n<p>On every side; the first like oxen horn&rsquo;d,</p>\n<p>But with a single horn upon their front</p>\n<p>The four. Like monster sight hath never seen.</p>\n<p>O&rsquo;er it methought there sat, secure as rock</p>\n<p>On mountain&rsquo;s lofty top, a shameless whore,</p>\n<p>Whose ken rov&rsquo;d loosely round her. At her side,</p>\n<p>As &rsquo;t were that none might bear her off, I saw</p>\n<p>A giant stand; and ever, and anon</p>\n<p>They mingled kisses. But, her lustful eyes</p>\n<p>Chancing on me to wander, that fell minion</p>\n<p>Scourg&rsquo;d her from head to foot all o&rsquo;er; then full</p>\n<p>Of jealousy, and fierce with rage, unloos&rsquo;d</p>\n<p>The monster, and dragg&rsquo;d on, so far across</p>\n<p>The forest, that from me its shades alone</p>\n<p>Shielded the harlot and the new-form&rsquo;d brute.</p>\n</div>','<p class="cantohead">Canto XXXIII</p>\n<div class="stanza"><p>&ldquo;The heathen, Lord! are come!&rdquo; responsive thus,</p>\n<p>The trinal now, and now the virgin band</p>\n<p>Quaternion, their sweet psalmody began,</p>\n<p>Weeping; and Beatrice listen&rsquo;d, sad</p>\n<p>And sighing, to the song&rsquo;, in such a mood,</p>\n<p>That Mary, as she stood beside the cross,</p>\n<p>Was scarce more chang&rsquo;d. But when they gave her place</p>\n<p>To speak, then, risen upright on her feet,</p>\n<p>She, with a colour glowing bright as fire,</p>\n<p>Did answer: &ldquo;Yet a little while, and ye</p>\n<p>Shall see me not; and, my beloved sisters,</p>\n<p>Again a little while, and ye shall see me.&rdquo;</p>\n<p class="slindent">Before her then she marshall&rsquo;d all the seven,</p>\n<p>And, beck&rsquo;ning only motion&rsquo;d me, the dame,</p>\n<p>And that remaining sage, to follow her.</p>\n<p class="slindent">So on she pass&rsquo;d; and had not set, I ween,</p>\n<p>Her tenth step to the ground, when with mine eyes</p>\n<p>Her eyes encounter&rsquo;d; and, with visage mild,</p>\n<p>&ldquo;So mend thy pace,&rdquo; she cried, &ldquo;that if my words</p>\n<p>Address thee, thou mayst still be aptly plac&rsquo;d</p>\n<p>To hear them.&rdquo; Soon as duly to her side</p>\n<p>I now had hasten&rsquo;d: &ldquo;Brother!&rdquo; she began,</p>\n<p>&ldquo;Why mak&rsquo;st thou no attempt at questioning,</p>\n<p>As thus we walk together?&rdquo; Like to those</p>\n<p>Who, speaking with too reverent an awe</p>\n<p>Before their betters, draw not forth the voice</p>\n<p>Alive unto their lips, befell me shell</p>\n<p>That I in sounds imperfect thus began:</p>\n<p>&ldquo;Lady! what I have need of, that thou know&rsquo;st,</p>\n<p>And what will suit my need.&rdquo; She answering thus:</p>\n<p>&ldquo;Of fearfulness and shame, I will, that thou</p>\n<p>Henceforth do rid thee: that thou speak no more,</p>\n<p>As one who dreams. Thus far be taught of me:</p>\n<p>The vessel, which thou saw&rsquo;st the serpent break,</p>\n<p>Was and is not: let him, who hath the blame,</p>\n<p>Hope not to scare God&rsquo;s vengeance with a sop.</p>\n<p>Without an heir for ever shall not be</p>\n<p>That eagle, he, who left the chariot plum&rsquo;d,</p>\n<p>Which monster made it first and next a prey.</p>\n<p>Plainly I view, and therefore speak, the stars</p>\n<p>E&rsquo;en now approaching, whose conjunction, free</p>\n<p>From all impediment and bar, brings on</p>\n<p>A season, in the which, one sent from God,</p>\n<p>(Five hundred, five, and ten, do mark him out)</p>\n<p>That foul one, and th&rsquo; accomplice of her guilt,</p>\n<p>The giant, both shall slay. And if perchance</p>\n<p>My saying, dark as Themis or as Sphinx,</p>\n<p>Fail to persuade thee, (since like them it foils</p>\n<p>The intellect with blindness) yet ere long</p>\n<p>Events shall be the Naiads, that will solve</p>\n<p>This knotty riddle, and no damage light</p>\n<p>On flock or field. Take heed; and as these words</p>\n<p>By me are utter&rsquo;d, teach them even so</p>\n<p>To those who live that life, which is a race</p>\n<p>To death: and when thou writ&rsquo;st them, keep in mind</p>\n<p>Not to conceal how thou hast seen the plant,</p>\n<p>That twice hath now been spoil&rsquo;d. This whoso robs,</p>\n<p>This whoso plucks, with blasphemy of deed</p>\n<p>Sins against God, who for his use alone</p>\n<p>Creating hallow&rsquo;d it. For taste of this,</p>\n<p>In pain and in desire, five thousand years</p>\n<p>And upward, the first soul did yearn for him,</p>\n<p>Who punish&rsquo;d in himself the fatal gust.</p>\n<p class="slindent">&ldquo;Thy reason slumbers, if it deem this height</p>\n<p>And summit thus inverted of the plant,</p>\n<p>Without due cause: and were not vainer thoughts,</p>\n<p>As Elsa&rsquo;s numbing waters, to thy soul,</p>\n<p>And their fond pleasures had not dyed it dark</p>\n<p>As Pyramus the mulberry, thou hadst seen,</p>\n<p>In such momentous circumstance alone,</p>\n<p>God&rsquo;s equal justice morally implied</p>\n<p>In the forbidden tree. But since I mark thee</p>\n<p>In understanding harden&rsquo;d into stone,</p>\n<p>And, to that hardness, spotted too and stain&rsquo;d,</p>\n<p>So that thine eye is dazzled at my word,</p>\n<p>I will, that, if not written, yet at least</p>\n<p>Painted thou take it in thee, for the cause,</p>\n<p>That one brings home his staff inwreath&rsquo;d with palm.</p>\n<p class="slindent">&ldquo;I thus: &ldquo;As wax by seal, that changeth not</p>\n<p>Its impress, now is stamp&rsquo;d my brain by thee.</p>\n<p>But wherefore soars thy wish&rsquo;d-for speech so high</p>\n<p>Beyond my sight, that loses it the more,</p>\n<p>The more it strains to reach it?&rdquo;&mdash;&ldquo;To the end</p>\n<p>That thou mayst know,&rdquo; she answer&rsquo;d straight, &ldquo;the school,</p>\n<p>That thou hast follow&rsquo;d; and how far behind,</p>\n<p>When following my discourse, its learning halts:</p>\n<p>And mayst behold your art, from the divine</p>\n<p>As distant, as the disagreement is</p>\n<p>&rsquo;Twixt earth and heaven&rsquo;s most high and rapturous orb.&rdquo;</p>\n<p class="slindent">&ldquo;I not remember,&rdquo; I replied, &ldquo;that e&rsquo;er</p>\n<p>I was estrang&rsquo;d from thee, nor for such fault</p>\n<p>Doth conscience chide me.&rdquo; Smiling she return&rsquo;d:</p>\n<p>&ldquo;If thou canst, not remember, call to mind</p>\n<p>How lately thou hast drunk of Lethe&rsquo;s wave;</p>\n<p>And, sure as smoke doth indicate a flame,</p>\n<p>In that forgetfulness itself conclude</p>\n<p>Blame from thy alienated will incurr&rsquo;d.</p>\n<p>From henceforth verily my words shall be</p>\n<p>As naked as will suit them to appear</p>\n<p>In thy unpractis&rsquo;d view.&rdquo; More sparkling now,</p>\n<p>And with retarded course the sun possess&rsquo;d</p>\n<p>The circle of mid-day, that varies still</p>\n<p>As th&rsquo; aspect varies of each several clime,</p>\n<p>When, as one, sent in vaward of a troop</p>\n<p>For escort, pauses, if perchance he spy</p>\n<p>Vestige of somewhat strange and rare: so paus&rsquo;d</p>\n<p>The sev&rsquo;nfold band, arriving at the verge</p>\n<p>Of a dun umbrage hoar, such as is seen,</p>\n<p>Beneath green leaves and gloomy branches, oft</p>\n<p>To overbrow a bleak and alpine cliff.</p>\n<p>And, where they stood, before them, as it seem&rsquo;d,</p>\n<p>Tigris and Euphrates both beheld,</p>\n<p>Forth from one fountain issue; and, like friends,</p>\n<p>Linger at parting. &ldquo;O enlight&rsquo;ning beam!</p>\n<p>O glory of our kind! beseech thee say</p>\n<p>What water this, which from one source deriv&rsquo;d</p>\n<p>Itself removes to distance from itself?&rdquo;</p>\n<p class="slindent">To such entreaty answer thus was made:</p>\n<p>&ldquo;Entreat Matilda, that she teach thee this.&rdquo;</p>\n<p class="slindent">And here, as one, who clears himself of blame</p>\n<p>Imputed, the fair dame return&rsquo;d: &ldquo;Of me</p>\n<p>He this and more hath learnt; and I am safe</p>\n<p>That Lethe&rsquo;s water hath not hid it from him.&rdquo;</p>\n<p class="slindent">And Beatrice: &ldquo;Some more pressing care</p>\n<p>That oft the memory &rsquo;reeves, perchance hath made</p>\n<p>His mind&rsquo;s eye dark. But lo! where Eunoe cows!</p>\n<p>Lead thither; and, as thou art wont, revive</p>\n<p>His fainting virtue.&rdquo; As a courteous spirit,</p>\n<p>That proffers no excuses, but as soon</p>\n<p>As he hath token of another&rsquo;s will,</p>\n<p>Makes it his own; when she had ta&rsquo;en me, thus</p>\n<p>The lovely maiden mov&rsquo;d her on, and call&rsquo;d</p>\n<p>To Statius with an air most lady-like:</p>\n<p>&ldquo;Come thou with him.&rdquo; Were further space allow&rsquo;d,</p>\n<p>Then, Reader, might I sing, though but in part,</p>\n<p>That beverage, with whose sweetness I had ne&rsquo;er</p>\n<p>Been sated. But, since all the leaves are full,</p>\n<p>Appointed for this second strain, mine art</p>\n<p>With warning bridle checks me. I return&rsquo;d</p>\n<p>From the most holy wave, regenerate,</p>\n<p>If &rsquo;en as new plants renew&rsquo;d with foliage new,</p>\n<p>Pure and made apt for mounting to the stars.</p>\n</div>']};

},{}],10:[function(require,module,exports){
// purgatorio/italian.js
"use strict";module.exports={bookname:'purgatorio',author:'Dante Alighieri',translationid:"dante",title:'Purgatorio',translation:false,source:'<a href="http://www.gutenberg.org/ebooks/1010">Project Gutenberg</a>',translationshortname:"Dante",translationfullname:"Dante Alighieri",translationclass:"poetry",text:['<p class="title">Purgatorio</p>\n\t<p class="author">Dante Alighieri</p>','<p class="cantohead">Canto I</p>\n\n<div class="stanza"><p>Per correr miglior acque alza le vele</p>\n<p>omai la navicella del mio ingegno,</p>\n<p>che lascia dietro a s&eacute; mar s&igrave; crudele;</p></div>\n\n<div class="stanza"><p>e canter&ograve; di quel secondo regno</p>\n<p>dove l&rsquo;umano spirito si purga</p>\n<p>e di salire al ciel diventa degno.</p></div>\n\n<div class="stanza"><p>Ma qui la morta poes&igrave; resurga,</p>\n<p>o sante Muse, poi che vostro sono;</p>\n<p>e qui Cal&iuml;op&egrave; alquanto surga,</p></div>\n\n<div class="stanza"><p>seguitando il mio canto con quel suono</p>\n<p>di cui le Piche misere sentiro</p>\n<p>lo colpo tal, che disperar perdono.</p></div>\n\n<div class="stanza"><p>Dolce color d&rsquo;or&iuml;ental zaffiro,</p>\n<p>che s&rsquo;accoglieva nel sereno aspetto</p>\n<p>del mezzo, puro infino al primo giro,</p></div>\n\n<div class="stanza"><p>a li occhi miei ricominci&ograve; diletto,</p>\n<p>tosto ch&rsquo;io usci&rsquo; fuor de l&rsquo;aura morta</p>\n<p>che m&rsquo;avea contristati li occhi e &rsquo;l petto.</p></div>\n\n<div class="stanza"><p>Lo bel pianeto che d&rsquo;amar conforta</p>\n<p>faceva tutto rider l&rsquo;or&iuml;ente,</p>\n<p>velando i Pesci ch&rsquo;erano in sua scorta.</p></div>\n\n<div class="stanza"><p>I&rsquo; mi volsi a man destra, e puosi mente</p>\n<p>a l&rsquo;altro polo, e vidi quattro stelle</p>\n<p>non viste mai fuor ch&rsquo;a la prima gente.</p></div>\n\n<div class="stanza"><p>Goder pareva &rsquo;l ciel di lor fiammelle:</p>\n<p>oh settentr&iuml;onal vedovo sito,</p>\n<p>poi che privato se&rsquo; di mirar quelle!</p></div>\n\n<div class="stanza"><p>Com&rsquo; io da loro sguardo fui partito,</p>\n<p>un poco me volgendo a l &rsquo;altro polo,</p>\n<p>l&agrave; onde &rsquo;l Carro gi&agrave; era sparito,</p></div>\n\n<div class="stanza"><p>vidi presso di me un veglio solo,</p>\n<p>degno di tanta reverenza in vista,</p>\n<p>che pi&ugrave; non dee a padre alcun figliuolo.</p></div>\n\n<div class="stanza"><p>Lunga la barba e di pel bianco mista</p>\n<p>portava, a&rsquo; suoi capelli simigliante,</p>\n<p>de&rsquo; quai cadeva al petto doppia lista.</p></div>\n\n<div class="stanza"><p>Li raggi de le quattro luci sante</p>\n<p>fregiavan s&igrave; la sua faccia di lume,</p>\n<p>ch&rsquo;i&rsquo; &rsquo;l vedea come &rsquo;l sol fosse davante.</p></div>\n\n<div class="stanza"><p>&laquo;Chi siete voi che contro al cieco fiume</p>\n<p>fuggita avete la pregione etterna?&raquo;,</p>\n<p>diss&rsquo; el, movendo quelle oneste piume.</p></div>\n\n<div class="stanza"><p>&laquo;Chi v&rsquo;ha guidati, o che vi fu lucerna,</p>\n<p>uscendo fuor de la profonda notte</p>\n<p>che sempre nera fa la valle inferna?</p></div>\n\n<div class="stanza"><p>Son le leggi d&rsquo;abisso cos&igrave; rotte?</p>\n<p>o &egrave; mutato in ciel novo consiglio,</p>\n<p>che, dannati, venite a le mie grotte?&raquo;.</p></div>\n\n<div class="stanza"><p>Lo duca mio allor mi di&egrave; di piglio,</p>\n<p>e con parole e con mani e con cenni</p>\n<p>reverenti mi f&eacute; le gambe e &rsquo;l ciglio.</p></div>\n\n<div class="stanza"><p>Poscia rispuose lui: &laquo;Da me non venni:</p>\n<p>donna scese del ciel, per li cui prieghi</p>\n<p>de la mia compagnia costui sovvenni.</p></div>\n\n<div class="stanza"><p>Ma da ch&rsquo;&egrave; tuo voler che pi&ugrave; si spieghi</p>\n<p>di nostra condizion com&rsquo; ell&rsquo; &egrave; vera,</p>\n<p>esser non puote il mio che a te si nieghi.</p></div>\n\n<div class="stanza"><p>Questi non vide mai l&rsquo;ultima sera;</p>\n<p>ma per la sua follia le fu s&igrave; presso,</p>\n<p>che molto poco tempo a volger era.</p></div>\n\n<div class="stanza"><p>S&igrave; com&rsquo; io dissi, fui mandato ad esso</p>\n<p>per lui campare; e non l&igrave; era altra via</p>\n<p>che questa per la quale i&rsquo; mi son messo.</p></div>\n\n<div class="stanza"><p>Mostrata ho lui tutta la gente ria;</p>\n<p>e ora intendo mostrar quelli spirti</p>\n<p>che purgan s&eacute; sotto la tua bal&igrave;a.</p></div>\n\n<div class="stanza"><p>Com&rsquo; io l&rsquo;ho tratto, saria lungo a dirti;</p>\n<p>de l&rsquo;alto scende virt&ugrave; che m&rsquo;aiuta</p>\n<p>conducerlo a vederti e a udirti.</p></div>\n\n<div class="stanza"><p>Or ti piaccia gradir la sua venuta:</p>\n<p>libert&agrave; va cercando, ch&rsquo;&egrave; s&igrave; cara,</p>\n<p>come sa chi per lei vita rifiuta.</p></div>\n\n<div class="stanza"><p>Tu &rsquo;l sai, ch&eacute; non ti fu per lei amara</p>\n<p>in Utica la morte, ove lasciasti</p>\n<p>la vesta ch&rsquo;al gran d&igrave; sar&agrave; s&igrave; chiara.</p></div>\n\n<div class="stanza"><p>Non son li editti etterni per noi guasti,</p>\n<p>ch&eacute; questi vive e Min&ograve;s me non lega;</p>\n<p>ma son del cerchio ove son li occhi casti</p></div>\n\n<div class="stanza"><p>di Marzia tua, che &rsquo;n vista ancor ti priega,</p>\n<p>o santo petto, che per tua la tegni:</p>\n<p>per lo suo amore adunque a noi ti piega.</p></div>\n\n<div class="stanza"><p>Lasciane andar per li tuoi sette regni;</p>\n<p>grazie riporter&ograve; di te a lei,</p>\n<p>se d&rsquo;esser mentovato l&agrave; gi&ugrave; degni&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Marz&iuml;a piacque tanto a li occhi miei</p>\n<p>mentre ch&rsquo;i&rsquo; fu&rsquo; di l&agrave;&raquo;, diss&rsquo; elli allora,</p>\n<p>&laquo;che quante grazie volse da me, fei.</p></div>\n\n<div class="stanza"><p>Or che di l&agrave; dal mal fiume dimora,</p>\n<p>pi&ugrave; muover non mi pu&ograve;, per quella legge</p>\n<p>che fatta fu quando me n&rsquo;usci&rsquo; fora.</p></div>\n\n<div class="stanza"><p>Ma se donna del ciel ti move e regge,</p>\n<p>come tu di&rsquo;, non c&rsquo;&egrave; mestier lusinghe:</p>\n<p>bastisi ben che per lei mi richegge.</p></div>\n\n<div class="stanza"><p>Va dunque, e fa che tu costui ricinghe</p>\n<p>d&rsquo;un giunco schietto e che li lavi &rsquo;l viso,</p>\n<p>s&igrave; ch&rsquo;ogne sucidume quindi stinghe;</p></div>\n\n<div class="stanza"><p>ch&eacute; non si converria, l&rsquo;occhio sorpriso</p>\n<p>d&rsquo;alcuna nebbia, andar dinanzi al primo</p>\n<p>ministro, ch&rsquo;&egrave; di quei di paradiso.</p></div>\n\n<div class="stanza"><p>Questa isoletta intorno ad imo ad imo,</p>\n<p>l&agrave; gi&ugrave; col&agrave; dove la batte l&rsquo;onda,</p>\n<p>porta di giunchi sovra &rsquo;l molle limo:</p></div>\n\n<div class="stanza"><p>null&rsquo; altra pianta che facesse fronda</p>\n<p>o indurasse, vi puote aver vita,</p>\n<p>per&ograve; ch&rsquo;a le percosse non seconda.</p></div>\n\n<div class="stanza"><p>Poscia non sia di qua vostra reddita;</p>\n<p>lo sol vi mosterr&agrave;, che surge omai,</p>\n<p>prendere il monte a pi&ugrave; lieve salita&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; spar&igrave;; e io s&ugrave; mi levai</p>\n<p>sanza parlare, e tutto mi ritrassi</p>\n<p>al duca mio, e li occhi a lui drizzai.</p></div>\n\n<div class="stanza"><p>El cominci&ograve;: &laquo;Figliuol, segui i miei passi:</p>\n<p>volgianci in dietro, ch&eacute; di qua dichina</p>\n<p>questa pianura a&rsquo; suoi termini bassi&raquo;.</p></div>\n\n<div class="stanza"><p>L&rsquo;alba vinceva l&rsquo;ora mattutina</p>\n<p>che fuggia innanzi, s&igrave; che di lontano</p>\n<p>conobbi il tremolar de la marina.</p></div>\n\n<div class="stanza"><p>Noi andavam per lo solingo piano</p>\n<p>com&rsquo; om che torna a la perduta strada,</p>\n<p>che &rsquo;nfino ad essa li pare ire in vano.</p></div>\n\n<div class="stanza"><p>Quando noi fummo l&agrave; &rsquo;ve la rugiada</p>\n<p>pugna col sole, per essere in parte</p>\n<p>dove, ad orezza, poco si dirada,</p></div>\n\n<div class="stanza"><p>ambo le mani in su l&rsquo;erbetta sparte</p>\n<p>soavemente &rsquo;l mio maestro pose:</p>\n<p>ond&rsquo; io, che fui accorto di sua arte,</p></div>\n\n<div class="stanza"><p>porsi ver&rsquo; lui le guance lagrimose;</p>\n<p>ivi mi fece tutto discoverto</p>\n<p>quel color che l&rsquo;inferno mi nascose.</p></div>\n\n<div class="stanza"><p>Venimmo poi in sul lito diserto,</p>\n<p>che mai non vide navicar sue acque</p>\n<p>omo, che di tornar sia poscia esperto.</p></div>\n\n<div class="stanza"><p>Quivi mi cinse s&igrave; com&rsquo; altrui piacque:</p>\n<p>oh maraviglia! ch&eacute; qual elli scelse</p>\n<p>l&rsquo;umile pianta, cotal si rinacque</p></div>\n\n<div class="stanza"><p>subitamente l&agrave; onde l&rsquo;avelse.</p></div>','<p class="cantohead">Canto II</p>\n\n<div class="stanza"><p>Gi&agrave; era &rsquo;l sole a l&rsquo;orizzonte giunto</p>\n<p>lo cui merid&iuml;an cerchio coverchia</p>\n<p>Ierusal&egrave;m col suo pi&ugrave; alto punto;</p></div>\n\n<div class="stanza"><p>e la notte, che opposita a lui cerchia,</p>\n<p>uscia di Gange fuor con le Bilance,</p>\n<p>che le caggion di man quando soverchia;</p></div>\n\n<div class="stanza"><p>s&igrave; che le bianche e le vermiglie guance,</p>\n<p>l&agrave; dov&rsquo; i&rsquo; era, de la bella Aurora</p>\n<p>per troppa etate divenivan rance.</p></div>\n\n<div class="stanza"><p>Noi eravam lunghesso mare ancora,</p>\n<p>come gente che pensa a suo cammino,</p>\n<p>che va col cuore e col corpo dimora.</p></div>\n\n<div class="stanza"><p>Ed ecco, qual, sorpreso dal mattino,</p>\n<p>per li grossi vapor Marte rosseggia</p>\n<p>gi&ugrave; nel ponente sovra &rsquo;l suol marino,</p></div>\n\n<div class="stanza"><p>cotal m&rsquo;apparve, s&rsquo;io ancor lo veggia,</p>\n<p>un lume per lo mar venir s&igrave; ratto,</p>\n<p>che &rsquo;l muover suo nessun volar pareggia.</p></div>\n\n<div class="stanza"><p>Dal qual com&rsquo; io un poco ebbi ritratto</p>\n<p>l&rsquo;occhio per domandar lo duca mio,</p>\n<p>rividil pi&ugrave; lucente e maggior fatto.</p></div>\n\n<div class="stanza"><p>Poi d&rsquo;ogne lato ad esso m&rsquo;appario</p>\n<p>un non sapeva che bianco, e di sotto</p>\n<p>a poco a poco un altro a lui usc&igrave;o.</p></div>\n\n<div class="stanza"><p>Lo mio maestro ancor non facea motto,</p>\n<p>mentre che i primi bianchi apparver ali;</p>\n<p>allor che ben conobbe il galeotto,</p></div>\n\n<div class="stanza"><p>grid&ograve;: &laquo;Fa, fa che le ginocchia cali.</p>\n<p>Ecco l&rsquo;angel di Dio: piega le mani;</p>\n<p>omai vedrai di s&igrave; fatti officiali.</p></div>\n\n<div class="stanza"><p>Vedi che sdegna li argomenti umani,</p>\n<p>s&igrave; che remo non vuol, n&eacute; altro velo</p>\n<p>che l&rsquo;ali sue, tra liti s&igrave; lontani.</p></div>\n\n<div class="stanza"><p>Vedi come l&rsquo;ha dritte verso &rsquo;l cielo,</p>\n<p>trattando l&rsquo;aere con l&rsquo;etterne penne,</p>\n<p>che non si mutan come mortal pelo&raquo;.</p></div>\n\n<div class="stanza"><p>Poi, come pi&ugrave; e pi&ugrave; verso noi venne</p>\n<p>l&rsquo;uccel divino, pi&ugrave; chiaro appariva:</p>\n<p>per che l&rsquo;occhio da presso nol sostenne,</p></div>\n\n<div class="stanza"><p>ma chinail giuso; e quei sen venne a riva</p>\n<p>con un vasello snelletto e leggero,</p>\n<p>tanto che l&rsquo;acqua nulla ne &rsquo;nghiottiva.</p></div>\n\n<div class="stanza"><p>Da poppa stava il celestial nocchiero,</p>\n<p>tal che faria beato pur descripto;</p>\n<p>e pi&ugrave; di cento spirti entro sediero.</p></div>\n\n<div class="stanza"><p>&lsquo;In exitu Isr&auml;el de Aegypto&rsquo;</p>\n<p>cantavan tutti insieme ad una voce</p>\n<p>con quanto di quel salmo &egrave; poscia scripto.</p></div>\n\n<div class="stanza"><p>Poi fece il segno lor di santa croce;</p>\n<p>ond&rsquo; ei si gittar tutti in su la piaggia:</p>\n<p>ed el sen g&igrave;, come venne, veloce.</p></div>\n\n<div class="stanza"><p>La turba che rimase l&igrave;, selvaggia</p>\n<p>parea del loco, rimirando intorno</p>\n<p>come colui che nove cose assaggia.</p></div>\n\n<div class="stanza"><p>Da tutte parti saettava il giorno</p>\n<p>lo sol, ch&rsquo;avea con le saette conte</p>\n<p>di mezzo &rsquo;l ciel cacciato Capricorno,</p></div>\n\n<div class="stanza"><p>quando la nova gente alz&ograve; la fronte</p>\n<p>ver&rsquo; noi, dicendo a noi: &laquo;Se voi sapete,</p>\n<p>mostratene la via di gire al monte&raquo;.</p></div>\n\n<div class="stanza"><p>E Virgilio rispuose: &laquo;Voi credete</p>\n<p>forse che siamo esperti d&rsquo;esto loco;</p>\n<p>ma noi siam peregrin come voi siete.</p></div>\n\n<div class="stanza"><p>Dianzi venimmo, innanzi a voi un poco,</p>\n<p>per altra via, che fu s&igrave; aspra e forte,</p>\n<p>che lo salire omai ne parr&agrave; gioco&raquo;.</p></div>\n\n<div class="stanza"><p>L&rsquo;anime, che si fuor di me accorte,</p>\n<p>per lo spirare, ch&rsquo;i&rsquo; era ancor vivo,</p>\n<p>maravigliando diventaro smorte.</p></div>\n\n<div class="stanza"><p>E come a messagger che porta ulivo</p>\n<p>tragge la gente per udir novelle,</p>\n<p>e di calcar nessun si mostra schivo,</p></div>\n\n<div class="stanza"><p>cos&igrave; al viso mio s&rsquo;affisar quelle</p>\n<p>anime fortunate tutte quante,</p>\n<p>quasi obl&iuml;ando d&rsquo;ire a farsi belle.</p></div>\n\n<div class="stanza"><p>Io vidi una di lor trarresi avante</p>\n<p>per abbracciarmi con s&igrave; grande affetto,</p>\n<p>che mosse me a far lo somigliante.</p></div>\n\n<div class="stanza"><p>Ohi ombre vane, fuor che ne l&rsquo;aspetto!</p>\n<p>tre volte dietro a lei le mani avvinsi,</p>\n<p>e tante mi tornai con esse al petto.</p></div>\n\n<div class="stanza"><p>Di maraviglia, credo, mi dipinsi;</p>\n<p>per che l&rsquo;ombra sorrise e si ritrasse,</p>\n<p>e io, seguendo lei, oltre mi pinsi.</p></div>\n\n<div class="stanza"><p>Soavemente disse ch&rsquo;io posasse;</p>\n<p>allor conobbi chi era, e pregai</p>\n<p>che, per parlarmi, un poco s&rsquo;arrestasse.</p></div>\n\n<div class="stanza"><p>Rispuosemi: &laquo;Cos&igrave; com&rsquo; io t&rsquo;amai</p>\n<p>nel mortal corpo, cos&igrave; t&rsquo;amo sciolta:</p>\n<p>per&ograve; m&rsquo;arresto; ma tu perch&eacute; vai?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Casella mio, per tornar altra volta</p>\n<p>l&agrave; dov&rsquo; io son, fo io questo v&iuml;aggio&raquo;,</p>\n<p>diss&rsquo; io; &laquo;ma a te com&rsquo; &egrave; tanta ora tolta?&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;Nessun m&rsquo;&egrave; fatto oltraggio,</p>\n<p>se quei che leva quando e cui li piace,</p>\n<p>pi&ugrave; volte m&rsquo;ha negato esto passaggio;</p></div>\n\n<div class="stanza"><p>ch&eacute; di giusto voler lo suo si face:</p>\n<p>veramente da tre mesi elli ha tolto</p>\n<p>chi ha voluto intrar, con tutta pace.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; io, ch&rsquo;era ora a la marina v&ograve;lto</p>\n<p>dove l&rsquo;acqua di Tevero s&rsquo;insala,</p>\n<p>benignamente fu&rsquo; da lui ricolto.</p></div>\n\n<div class="stanza"><p>A quella foce ha elli or dritta l&rsquo;ala,</p>\n<p>per&ograve; che sempre quivi si ricoglie</p>\n<p>qual verso Acheronte non si cala&raquo;.</p></div>\n\n<div class="stanza"><p>E io: &laquo;Se nuova legge non ti toglie</p>\n<p>memoria o uso a l&rsquo;amoroso canto</p>\n<p>che mi solea quetar tutte mie doglie,</p></div>\n\n<div class="stanza"><p>di ci&ograve; ti piaccia consolare alquanto</p>\n<p>l&rsquo;anima mia, che, con la sua persona</p>\n<p>venendo qui, &egrave; affannata tanto!&raquo;.</p></div>\n\n<div class="stanza"><p>&lsquo;Amor che ne la mente mi ragiona&rsquo;</p>\n<p>cominci&ograve; elli allor s&igrave; dolcemente,</p>\n<p>che la dolcezza ancor dentro mi suona.</p></div>\n\n<div class="stanza"><p>Lo mio maestro e io e quella gente</p>\n<p>ch&rsquo;eran con lui parevan s&igrave; contenti,</p>\n<p>come a nessun toccasse altro la mente.</p></div>\n\n<div class="stanza"><p>Noi eravam tutti fissi e attenti</p>\n<p>a le sue note; ed ecco il veglio onesto</p>\n<p>gridando: &laquo;Che &egrave; ci&ograve;, spiriti lenti?</p></div>\n\n<div class="stanza"><p>qual negligenza, quale stare &egrave; questo?</p>\n<p>Correte al monte a spogliarvi lo scoglio</p>\n<p>ch&rsquo;esser non lascia a voi Dio manifesto&raquo;.</p></div>\n\n<div class="stanza"><p>Come quando, cogliendo biado o loglio,</p>\n<p>li colombi adunati a la pastura,</p>\n<p>queti, sanza mostrar l&rsquo;usato orgoglio,</p></div>\n\n<div class="stanza"><p>se cosa appare ond&rsquo; elli abbian paura,</p>\n<p>subitamente lasciano star l&rsquo;esca,</p>\n<p>perch&rsquo; assaliti son da maggior cura;</p></div>\n\n<div class="stanza"><p>cos&igrave; vid&rsquo; io quella masnada fresca</p>\n<p>lasciar lo canto, e fuggir ver&rsquo; la costa,</p>\n<p>com&rsquo; om che va, n&eacute; sa dove r&iuml;esca;</p></div>\n\n<div class="stanza"><p>n&eacute; la nostra partita fu men tosta.</p></div>','<p class="cantohead">Canto III</p>\n\n<div class="stanza"><p>Avvegna che la subitana fuga</p>\n<p>dispergesse color per la campagna,</p>\n<p>rivolti al monte ove ragion ne fruga,</p></div>\n\n<div class="stanza"><p>i&rsquo; mi ristrinsi a la fida compagna:</p>\n<p>e come sare&rsquo; io sanza lui corso?</p>\n<p>chi m&rsquo;avria tratto su per la montagna?</p></div>\n\n<div class="stanza"><p>El mi parea da s&eacute; stesso rimorso:</p>\n<p>o dignitosa cosc&iuml;enza e netta,</p>\n<p>come t&rsquo;&egrave; picciol fallo amaro morso!</p></div>\n\n<div class="stanza"><p>Quando li piedi suoi lasciar la fretta,</p>\n<p>che l&rsquo;onestade ad ogn&rsquo; atto dismaga,</p>\n<p>la mente mia, che prima era ristretta,</p></div>\n\n<div class="stanza"><p>lo &rsquo;ntento rallarg&ograve;, s&igrave; come vaga,</p>\n<p>e diedi &rsquo;l viso mio incontr&rsquo; al poggio</p>\n<p>che &rsquo;nverso &rsquo;l ciel pi&ugrave; alto si dislaga.</p></div>\n\n<div class="stanza"><p>Lo sol, che dietro fiammeggiava roggio,</p>\n<p>rotto m&rsquo;era dinanzi a la figura,</p>\n<p>ch&rsquo;av&euml;a in me de&rsquo; suoi raggi l&rsquo;appoggio.</p></div>\n\n<div class="stanza"><p>Io mi volsi dallato con paura</p>\n<p>d&rsquo;essere abbandonato, quand&rsquo; io vidi</p>\n<p>solo dinanzi a me la terra oscura;</p></div>\n\n<div class="stanza"><p>e &rsquo;l mio conforto: &laquo;Perch&eacute; pur diffidi?&raquo;,</p>\n<p>a dir mi cominci&ograve; tutto rivolto;</p>\n<p>&laquo;non credi tu me teco e ch&rsquo;io ti guidi?</p></div>\n\n<div class="stanza"><p>Vespero &egrave; gi&agrave; col&agrave; dov&rsquo; &egrave; sepolto</p>\n<p>lo corpo dentro al quale io facea ombra;</p>\n<p>Napoli l&rsquo;ha, e da Brandizio &egrave; tolto.</p></div>\n\n<div class="stanza"><p>Ora, se innanzi a me nulla s&rsquo;aombra,</p>\n<p>non ti maravigliar pi&ugrave; che d&rsquo;i cieli</p>\n<p>che l&rsquo;uno a l&rsquo;altro raggio non ingombra.</p></div>\n\n<div class="stanza"><p>A sofferir tormenti, caldi e geli</p>\n<p>simili corpi la Virt&ugrave; dispone</p>\n<p>che, come fa, non vuol ch&rsquo;a noi si sveli.</p></div>\n\n<div class="stanza"><p>Matto &egrave; chi spera che nostra ragione</p>\n<p>possa trascorrer la infinita via</p>\n<p>che tiene una sustanza in tre persone.</p></div>\n\n<div class="stanza"><p>State contenti, umana gente, al quia;</p>\n<p>ch&eacute;, se potuto aveste veder tutto,</p>\n<p>mestier non era parturir Maria;</p></div>\n\n<div class="stanza"><p>e dis&iuml;ar vedeste sanza frutto</p>\n<p>tai che sarebbe lor disio quetato,</p>\n<p>ch&rsquo;etternalmente &egrave; dato lor per lutto:</p></div>\n\n<div class="stanza"><p>io dico d&rsquo;Aristotile e di Plato</p>\n<p>e di molt&rsquo; altri&raquo;; e qui chin&ograve; la fronte,</p>\n<p>e pi&ugrave; non disse, e rimase turbato.</p></div>\n\n<div class="stanza"><p>Noi divenimmo intanto a pi&egrave; del monte;</p>\n<p>quivi trovammo la roccia s&igrave; erta,</p>\n<p>che &rsquo;ndarno vi sarien le gambe pronte.</p></div>\n\n<div class="stanza"><p>Tra Lerice e Turb&igrave;a la pi&ugrave; diserta,</p>\n<p>la pi&ugrave; rotta ruina &egrave; una scala,</p>\n<p>verso di quella, agevole e aperta.</p></div>\n\n<div class="stanza"><p>&laquo;Or chi sa da qual man la costa cala&raquo;,</p>\n<p>disse &rsquo;l maestro mio fermando &rsquo;l passo,</p>\n<p>&laquo;s&igrave; che possa salir chi va sanz&rsquo; ala?&raquo;.</p></div>\n\n<div class="stanza"><p>E mentre ch&rsquo;e&rsquo; tenendo &rsquo;l viso basso</p>\n<p>essaminava del cammin la mente,</p>\n<p>e io mirava suso intorno al sasso,</p></div>\n\n<div class="stanza"><p>da man sinistra m&rsquo;appar&igrave; una gente</p>\n<p>d&rsquo;anime, che movieno i pi&egrave; ver&rsquo; noi,</p>\n<p>e non pareva, s&igrave; ven&iuml;an lente.</p></div>\n\n<div class="stanza"><p>&laquo;Leva&raquo;, diss&rsquo; io, &laquo;maestro, li occhi tuoi:</p>\n<p>ecco di qua chi ne dar&agrave; consiglio,</p>\n<p>se tu da te medesmo aver nol puoi&raquo;.</p></div>\n\n<div class="stanza"><p>Guard&ograve; allora, e con libero piglio</p>\n<p>rispuose: &laquo;Andiamo in l&agrave;, ch&rsquo;ei vegnon piano;</p>\n<p>e tu ferma la spene, dolce figlio&raquo;.</p></div>\n\n<div class="stanza"><p>Ancora era quel popol di lontano,</p>\n<p>i&rsquo; dico dopo i nostri mille passi,</p>\n<p>quanto un buon gittator trarria con mano,</p></div>\n\n<div class="stanza"><p>quando si strinser tutti ai duri massi</p>\n<p>de l&rsquo;alta ripa, e stetter fermi e stretti</p>\n<p>com&rsquo; a guardar, chi va dubbiando, stassi.</p></div>\n\n<div class="stanza"><p>&laquo;O ben finiti, o gi&agrave; spiriti eletti&raquo;,</p>\n<p>Virgilio incominci&ograve;, &laquo;per quella pace</p>\n<p>ch&rsquo;i&rsquo; credo che per voi tutti s&rsquo;aspetti,</p></div>\n\n<div class="stanza"><p>ditene dove la montagna giace,</p>\n<p>s&igrave; che possibil sia l&rsquo;andare in suso;</p>\n<p>ch&eacute; perder tempo a chi pi&ugrave; sa pi&ugrave; spiace&raquo;.</p></div>\n\n<div class="stanza"><p>Come le pecorelle escon del chiuso</p>\n<p>a una, a due, a tre, e l&rsquo;altre stanno</p>\n<p>timidette atterrando l&rsquo;occhio e &rsquo;l muso;</p></div>\n\n<div class="stanza"><p>e ci&ograve; che fa la prima, e l&rsquo;altre fanno,</p>\n<p>addossandosi a lei, s&rsquo;ella s&rsquo;arresta,</p>\n<p>semplici e quete, e lo &rsquo;mperch&eacute; non sanno;</p></div>\n\n<div class="stanza"><p>s&igrave; vid&rsquo; io muovere a venir la testa</p>\n<p>di quella mandra fortunata allotta,</p>\n<p>pudica in faccia e ne l&rsquo;andare onesta.</p></div>\n\n<div class="stanza"><p>Come color dinanzi vider rotta</p>\n<p>la luce in terra dal mio destro canto,</p>\n<p>s&igrave; che l&rsquo;ombra era da me a la grotta,</p></div>\n\n<div class="stanza"><p>restaro, e trasser s&eacute; in dietro alquanto,</p>\n<p>e tutti li altri che venieno appresso,</p>\n<p>non sappiendo &rsquo;l perch&eacute;, fenno altrettanto.</p></div>\n\n<div class="stanza"><p>&laquo;Sanza vostra domanda io vi confesso</p>\n<p>che questo &egrave; corpo uman che voi vedete;</p>\n<p>per che &rsquo;l lume del sole in terra &egrave; fesso.</p></div>\n\n<div class="stanza"><p>Non vi maravigliate, ma credete</p>\n<p>che non sanza virt&ugrave; che da ciel vegna</p>\n<p>cerchi di soverchiar questa parete&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; &rsquo;l maestro; e quella gente degna</p>\n<p>&laquo;Tornate&raquo;, disse, &laquo;intrate innanzi dunque&raquo;,</p>\n<p>coi dossi de le man faccendo insegna.</p></div>\n\n<div class="stanza"><p>E un di loro incominci&ograve;: &laquo;Chiunque</p>\n<p>tu se&rsquo;, cos&igrave; andando, volgi &rsquo;l viso:</p>\n<p>pon mente se di l&agrave; mi vedesti unque&raquo;.</p></div>\n\n<div class="stanza"><p>Io mi volsi ver&rsquo; lui e guardail fiso:</p>\n<p>biondo era e bello e di gentile aspetto,</p>\n<p>ma l&rsquo;un de&rsquo; cigli un colpo avea diviso.</p></div>\n\n<div class="stanza"><p>Quand&rsquo; io mi fui umilmente disdetto</p>\n<p>d&rsquo;averlo visto mai, el disse: &laquo;Or vedi&raquo;;</p>\n<p>e mostrommi una piaga a sommo &rsquo;l petto.</p></div>\n\n<div class="stanza"><p>Poi sorridendo disse: &laquo;Io son Manfredi,</p>\n<p>nepote di Costanza imperadrice;</p>\n<p>ond&rsquo; io ti priego che, quando tu riedi,</p></div>\n\n<div class="stanza"><p>vadi a mia bella figlia, genitrice</p>\n<p>de l&rsquo;onor di Cicilia e d&rsquo;Aragona,</p>\n<p>e dichi &rsquo;l vero a lei, s&rsquo;altro si dice.</p></div>\n\n<div class="stanza"><p>Poscia ch&rsquo;io ebbi rotta la persona</p>\n<p>di due punte mortali, io mi rendei,</p>\n<p>piangendo, a quei che volontier perdona.</p></div>\n\n<div class="stanza"><p>Orribil furon li peccati miei;</p>\n<p>ma la bont&agrave; infinita ha s&igrave; gran braccia,</p>\n<p>che prende ci&ograve; che si rivolge a lei.</p></div>\n\n<div class="stanza"><p>Se &rsquo;l pastor di Cosenza, che a la caccia</p>\n<p>di me fu messo per Clemente allora,</p>\n<p>avesse in Dio ben letta questa faccia,</p></div>\n\n<div class="stanza"><p>l&rsquo;ossa del corpo mio sarieno ancora</p>\n<p>in co del ponte presso a Benevento,</p>\n<p>sotto la guardia de la grave mora.</p></div>\n\n<div class="stanza"><p>Or le bagna la pioggia e move il vento</p>\n<p>di fuor dal regno, quasi lungo &rsquo;l Verde,</p>\n<p>dov&rsquo; e&rsquo; le trasmut&ograve; a lume spento.</p></div>\n\n<div class="stanza"><p>Per lor maladizion s&igrave; non si perde,</p>\n<p>che non possa tornar, l&rsquo;etterno amore,</p>\n<p>mentre che la speranza ha fior del verde.</p></div>\n\n<div class="stanza"><p>Vero &egrave; che quale in contumacia more</p>\n<p>di Santa Chiesa, ancor ch&rsquo;al fin si penta,</p>\n<p>star li convien da questa ripa in fore,</p></div>\n\n<div class="stanza"><p>per ognun tempo ch&rsquo;elli &egrave; stato, trenta,</p>\n<p>in sua presunz&iuml;on, se tal decreto</p>\n<p>pi&ugrave; corto per buon prieghi non diventa.</p></div>\n\n<div class="stanza"><p>Vedi oggimai se tu mi puoi far lieto,</p>\n<p>revelando a la mia buona Costanza</p>\n<p>come m&rsquo;hai visto, e anco esto divieto;</p></div>\n\n<div class="stanza"><p>ch&eacute; qui per quei di l&agrave; molto s&rsquo;avanza&raquo;.</p></div>','<p class="cantohead">Canto IV</p>\n\n<div class="stanza"><p>Quando per dilettanze o ver per doglie,</p>\n<p>che alcuna virt&ugrave; nostra comprenda,</p>\n<p>l&rsquo;anima bene ad essa si raccoglie,</p></div>\n\n<div class="stanza"><p>par ch&rsquo;a nulla potenza pi&ugrave; intenda;</p>\n<p>e questo &egrave; contra quello error che crede</p>\n<p>ch&rsquo;un&rsquo;anima sovr&rsquo; altra in noi s&rsquo;accenda.</p></div>\n\n<div class="stanza"><p>E per&ograve;, quando s&rsquo;ode cosa o vede</p>\n<p>che tegna forte a s&eacute; l&rsquo;anima volta,</p>\n<p>vassene &rsquo;l tempo e l&rsquo;uom non se n&rsquo;avvede;</p></div>\n\n<div class="stanza"><p>ch&rsquo;altra potenza &egrave; quella che l&rsquo;ascolta,</p>\n<p>e altra &egrave; quella c&rsquo;ha l&rsquo;anima intera:</p>\n<p>questa &egrave; quasi legata e quella &egrave; sciolta.</p></div>\n\n<div class="stanza"><p>Di ci&ograve; ebb&rsquo; io esper&iuml;enza vera,</p>\n<p>udendo quello spirto e ammirando;</p>\n<p>ch&eacute; ben cinquanta gradi salito era</p></div>\n\n<div class="stanza"><p>lo sole, e io non m&rsquo;era accorto, quando</p>\n<p>venimmo ove quell&rsquo; anime ad una</p>\n<p>gridaro a noi: &laquo;Qui &egrave; vostro dimando&raquo;.</p></div>\n\n<div class="stanza"><p>Maggiore aperta molte volte impruna</p>\n<p>con una forcatella di sue spine</p>\n<p>l&rsquo;uom de la villa quando l&rsquo;uva imbruna,</p></div>\n\n<div class="stanza"><p>che non era la calla onde sal&igrave;ne</p>\n<p>lo duca mio, e io appresso, soli,</p>\n<p>come da noi la schiera si part&igrave;ne.</p></div>\n\n<div class="stanza"><p>Vassi in Sanleo e discendesi in Noli,</p>\n<p>montasi su in Bismantova e &rsquo;n Cacume</p>\n<p>con esso i pi&egrave;; ma qui convien ch&rsquo;om voli;</p></div>\n\n<div class="stanza"><p>dico con l&rsquo;ale snelle e con le piume</p>\n<p>del gran disio, di retro a quel condotto</p>\n<p>che speranza mi dava e facea lume.</p></div>\n\n<div class="stanza"><p>Noi salavam per entro &rsquo;l sasso rotto,</p>\n<p>e d&rsquo;ogne lato ne stringea lo stremo,</p>\n<p>e piedi e man volea il suol di sotto.</p></div>\n\n<div class="stanza"><p>Poi che noi fummo in su l&rsquo;orlo suppremo</p>\n<p>de l&rsquo;alta ripa, a la scoperta piaggia,</p>\n<p>&laquo;Maestro mio&raquo;, diss&rsquo; io, &laquo;che via faremo?&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;Nessun tuo passo caggia;</p>\n<p>pur su al monte dietro a me acquista,</p>\n<p>fin che n&rsquo;appaia alcuna scorta saggia&raquo;.</p></div>\n\n<div class="stanza"><p>Lo sommo er&rsquo; alto che vincea la vista,</p>\n<p>e la costa superba pi&ugrave; assai</p>\n<p>che da mezzo quadrante a centro lista.</p></div>\n\n<div class="stanza"><p>Io era lasso, quando cominciai:</p>\n<p>&laquo;O dolce padre, volgiti, e rimira</p>\n<p>com&rsquo; io rimango sol, se non restai&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Figliuol mio&raquo;, disse, &laquo;infin quivi ti tira&raquo;,</p>\n<p>additandomi un balzo poco in s&ugrave;e</p>\n<p>che da quel lato il poggio tutto gira.</p></div>\n\n<div class="stanza"><p>S&igrave; mi spronaron le parole sue,</p>\n<p>ch&rsquo;i&rsquo; mi sforzai carpando appresso lui,</p>\n<p>tanto che &rsquo;l cinghio sotto i pi&egrave; mi fue.</p></div>\n\n<div class="stanza"><p>A seder ci ponemmo ivi ambedui</p>\n<p>v&ograve;lti a levante ond&rsquo; eravam saliti,</p>\n<p>che suole a riguardar giovare altrui.</p></div>\n\n<div class="stanza"><p>Li occhi prima drizzai ai bassi liti;</p>\n<p>poscia li alzai al sole, e ammirava</p>\n<p>che da sinistra n&rsquo;eravam feriti.</p></div>\n\n<div class="stanza"><p>Ben s&rsquo;avvide il poeta ch&rsquo;&iuml;o stava</p>\n<p>stupido tutto al carro de la luce,</p>\n<p>ove tra noi e Aquilone intrava.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; elli a me: &laquo;Se Castore e Poluce</p>\n<p>fossero in compagnia di quello specchio</p>\n<p>che s&ugrave; e gi&ugrave; del suo lume conduce,</p></div>\n\n<div class="stanza"><p>tu vedresti il Zod&iuml;aco rubecchio</p>\n<p>ancora a l&rsquo;Orse pi&ugrave; stretto rotare,</p>\n<p>se non uscisse fuor del cammin vecchio.</p></div>\n\n<div class="stanza"><p>Come ci&ograve; sia, se &rsquo;l vuoi poter pensare,</p>\n<p>dentro raccolto, imagina S&iuml;&ograve;n</p>\n<p>con questo monte in su la terra stare</p></div>\n\n<div class="stanza"><p>s&igrave;, ch&rsquo;amendue hanno un solo orizz&ograve;n</p>\n<p>e diversi emisperi; onde la strada</p>\n<p>che mal non seppe carreggiar Fet&ograve;n,</p></div>\n\n<div class="stanza"><p>vedrai come a costui convien che vada</p>\n<p>da l&rsquo;un, quando a colui da l&rsquo;altro fianco,</p>\n<p>se lo &rsquo;ntelletto tuo ben chiaro bada&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Certo, maestro mio,&raquo; diss&rsquo; io, &laquo;unquanco</p>\n<p>non vid&rsquo; io chiaro s&igrave; com&rsquo; io discerno</p>\n<p>l&agrave; dove mio ingegno parea manco,</p></div>\n\n<div class="stanza"><p>che &rsquo;l mezzo cerchio del moto superno,</p>\n<p>che si chiama Equatore in alcun&rsquo; arte,</p>\n<p>e che sempre riman tra &rsquo;l sole e &rsquo;l verno,</p></div>\n\n<div class="stanza"><p>per la ragion che di&rsquo;, quinci si parte</p>\n<p>verso settentr&iuml;on, quanto li Ebrei</p>\n<p>vedevan lui verso la calda parte.</p></div>\n\n<div class="stanza"><p>Ma se a te piace, volontier saprei</p>\n<p>quanto avemo ad andar; ch&eacute; &rsquo;l poggio sale</p>\n<p>pi&ugrave; che salir non posson li occhi miei&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;Questa montagna &egrave; tale,</p>\n<p>che sempre al cominciar di sotto &egrave; grave;</p>\n<p>e quant&rsquo; om pi&ugrave; va s&ugrave;, e men fa male.</p></div>\n\n<div class="stanza"><p>Per&ograve;, quand&rsquo; ella ti parr&agrave; soave</p>\n<p>tanto, che s&ugrave; andar ti fia leggero</p>\n<p>com&rsquo; a seconda gi&ugrave; andar per nave,</p></div>\n\n<div class="stanza"><p>allor sarai al fin d&rsquo;esto sentiero;</p>\n<p>quivi di riposar l&rsquo;affanno aspetta.</p>\n<p>Pi&ugrave; non rispondo, e questo so per vero&raquo;.</p></div>\n\n<div class="stanza"><p>E com&rsquo; elli ebbe sua parola detta,</p>\n<p>una voce di presso son&ograve;: &laquo;Forse</p>\n<p>che di sedere in pria avrai distretta!&raquo;.</p></div>\n\n<div class="stanza"><p>Al suon di lei ciascun di noi si torse,</p>\n<p>e vedemmo a mancina un gran petrone,</p>\n<p>del qual n&eacute; io n&eacute; ei prima s&rsquo;accorse.</p></div>\n\n<div class="stanza"><p>L&agrave; ci traemmo; e ivi eran persone</p>\n<p>che si stavano a l&rsquo;ombra dietro al sasso</p>\n<p>come l&rsquo;uom per negghienza a star si pone.</p></div>\n\n<div class="stanza"><p>E un di lor, che mi sembiava lasso,</p>\n<p>sedeva e abbracciava le ginocchia,</p>\n<p>tenendo &rsquo;l viso gi&ugrave; tra esse basso.</p></div>\n\n<div class="stanza"><p>&laquo;O dolce segnor mio&raquo;, diss&rsquo; io, &laquo;adocchia</p>\n<p>colui che mostra s&eacute; pi&ugrave; negligente</p>\n<p>che se pigrizia fosse sua serocchia&raquo;.</p></div>\n\n<div class="stanza"><p>Allor si volse a noi e puose mente,</p>\n<p>movendo &rsquo;l viso pur su per la coscia,</p>\n<p>e disse: &laquo;Or va tu s&ugrave;, che se&rsquo; valente!&raquo;.</p></div>\n\n<div class="stanza"><p>Conobbi allor chi era, e quella angoscia</p>\n<p>che m&rsquo;avacciava un poco ancor la lena,</p>\n<p>non m&rsquo;imped&igrave; l&rsquo;andare a lui; e poscia</p></div>\n\n<div class="stanza"><p>ch&rsquo;a lui fu&rsquo; giunto, alz&ograve; la testa a pena,</p>\n<p>dicendo: &laquo;Hai ben veduto come &rsquo;l sole</p>\n<p>da l&rsquo;omero sinistro il carro mena?&raquo;.</p></div>\n\n<div class="stanza"><p>Li atti suoi pigri e le corte parole</p>\n<p>mosser le labbra mie un poco a riso;</p>\n<p>poi cominciai: &laquo;Belacqua, a me non dole</p></div>\n\n<div class="stanza"><p>di te omai; ma dimmi: perch&eacute; assiso</p>\n<p>quiritto se&rsquo;? attendi tu iscorta,</p>\n<p>o pur lo modo usato t&rsquo;ha&rsquo; ripriso?&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli: &laquo;O frate, andar in s&ugrave; che porta?</p>\n<p>ch&eacute; non mi lascerebbe ire a&rsquo; mart&igrave;ri</p>\n<p>l&rsquo;angel di Dio che siede in su la porta.</p></div>\n\n<div class="stanza"><p>Prima convien che tanto il ciel m&rsquo;aggiri</p>\n<p>di fuor da essa, quanto fece in vita,</p>\n<p>per ch&rsquo;io &rsquo;ndugiai al fine i buon sospiri,</p></div>\n\n<div class="stanza"><p>se oraz&iuml;one in prima non m&rsquo;aita</p>\n<p>che surga s&ugrave; di cuor che in grazia viva;</p>\n<p>l&rsquo;altra che val, che &rsquo;n ciel non &egrave; udita?&raquo;.</p></div>\n\n<div class="stanza"><p>E gi&agrave; il poeta innanzi mi saliva,</p>\n<p>e dicea: &laquo;Vienne omai; vedi ch&rsquo;&egrave; tocco</p>\n<p>merid&iuml;an dal sole e a la riva</p></div>\n\n<div class="stanza"><p>cuopre la notte gi&agrave; col pi&egrave; Morrocco&raquo;.</p></div>','<p class="cantohead">Canto V</p>\n\n<div class="stanza"><p>Io era gi&agrave; da quell&rsquo; ombre partito,</p>\n<p>e seguitava l&rsquo;orme del mio duca,</p>\n<p>quando di retro a me, drizzando &rsquo;l dito,</p></div>\n\n<div class="stanza"><p>una grid&ograve;: &laquo;Ve&rsquo; che non par che luca</p>\n<p>lo raggio da sinistra a quel di sotto,</p>\n<p>e come vivo par che si conduca!&raquo;.</p></div>\n\n<div class="stanza"><p>Li occhi rivolsi al suon di questo motto,</p>\n<p>e vidile guardar per maraviglia</p>\n<p>pur me, pur me, e &rsquo;l lume ch&rsquo;era rotto.</p></div>\n\n<div class="stanza"><p>&laquo;Perch&eacute; l&rsquo;animo tuo tanto s&rsquo;impiglia&raquo;,</p>\n<p>disse &rsquo;l maestro, &laquo;che l&rsquo;andare allenti?</p>\n<p>che ti fa ci&ograve; che quivi si pispiglia?</p></div>\n\n<div class="stanza"><p>Vien dietro a me, e lascia dir le genti:</p>\n<p>sta come torre ferma, che non crolla</p>\n<p>gi&agrave; mai la cima per soffiar di venti;</p></div>\n\n<div class="stanza"><p>ch&eacute; sempre l&rsquo;omo in cui pensier rampolla</p>\n<p>sovra pensier, da s&eacute; dilunga il segno,</p>\n<p>perch&eacute; la foga l&rsquo;un de l&rsquo;altro insolla&raquo;.</p></div>\n\n<div class="stanza"><p>Che potea io ridir, se non &laquo;Io vegno&raquo;?</p>\n<p>Dissilo, alquanto del color consperso</p>\n<p>che fa l&rsquo;uom di perdon talvolta degno.</p></div>\n\n<div class="stanza"><p>E &rsquo;ntanto per la costa di traverso</p>\n<p>venivan genti innanzi a noi un poco,</p>\n<p>cantando &lsquo;Miserere&rsquo; a verso a verso.</p></div>\n\n<div class="stanza"><p>Quando s&rsquo;accorser ch&rsquo;i&rsquo; non dava loco</p>\n<p>per lo mio corpo al trapassar d&rsquo;i raggi,</p>\n<p>mutar lor canto in un &laquo;oh!&raquo; lungo e roco;</p></div>\n\n<div class="stanza"><p>e due di loro, in forma di messaggi,</p>\n<p>corsero incontr&rsquo; a noi e dimandarne:</p>\n<p>&laquo;Di vostra condizion fatene saggi&raquo;.</p></div>\n\n<div class="stanza"><p>E &rsquo;l mio maestro: &laquo;Voi potete andarne</p>\n<p>e ritrarre a color che vi mandaro</p>\n<p>che &rsquo;l corpo di costui &egrave; vera carne.</p></div>\n\n<div class="stanza"><p>Se per veder la sua ombra restaro,</p>\n<p>com&rsquo; io avviso, assai &egrave; lor risposto:</p>\n<p>f&agrave;ccianli onore, ed esser pu&ograve; lor caro&raquo;.</p></div>\n\n<div class="stanza"><p>Vapori accesi non vid&rsquo; io s&igrave; tosto</p>\n<p>di prima notte mai fender sereno,</p>\n<p>n&eacute;, sol calando, nuvole d&rsquo;agosto,</p></div>\n\n<div class="stanza"><p>che color non tornasser suso in meno;</p>\n<p>e, giunti l&agrave;, con li altri a noi dier volta,</p>\n<p>come schiera che scorre sanza freno.</p></div>\n\n<div class="stanza"><p>&laquo;Questa gente che preme a noi &egrave; molta,</p>\n<p>e vegnonti a pregar&raquo;, disse &rsquo;l poeta:</p>\n<p>&laquo;per&ograve; pur va, e in andando ascolta&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O anima che vai per esser lieta</p>\n<p>con quelle membra con le quai nascesti&raquo;,</p>\n<p>venian gridando, &laquo;un poco il passo queta.</p></div>\n\n<div class="stanza"><p>Guarda s&rsquo;alcun di noi unqua vedesti,</p>\n<p>s&igrave; che di lui di l&agrave; novella porti:</p>\n<p>deh, perch&eacute; vai? deh, perch&eacute; non t&rsquo;arresti?</p></div>\n\n<div class="stanza"><p>Noi fummo tutti gi&agrave; per forza morti,</p>\n<p>e peccatori infino a l&rsquo;ultima ora;</p>\n<p>quivi lume del ciel ne fece accorti,</p></div>\n\n<div class="stanza"><p>s&igrave; che, pentendo e perdonando, fora</p>\n<p>di vita uscimmo a Dio pacificati,</p>\n<p>che del disio di s&eacute; veder n&rsquo;accora&raquo;.</p></div>\n\n<div class="stanza"><p>E io: &laquo;Perch&eacute; ne&rsquo; vostri visi guati,</p>\n<p>non riconosco alcun; ma s&rsquo;a voi piace</p>\n<p>cosa ch&rsquo;io possa, spiriti ben nati,</p></div>\n\n<div class="stanza"><p>voi dite, e io far&ograve; per quella pace</p>\n<p>che, dietro a&rsquo; piedi di s&igrave; fatta guida,</p>\n<p>di mondo in mondo cercar mi si face&raquo;.</p></div>\n\n<div class="stanza"><p>E uno incominci&ograve;: &laquo;Ciascun si fida</p>\n<p>del beneficio tuo sanza giurarlo,</p>\n<p>pur che &rsquo;l voler nonpossa non ricida.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; io, che solo innanzi a li altri parlo,</p>\n<p>ti priego, se mai vedi quel paese</p>\n<p>che siede tra Romagna e quel di Carlo,</p></div>\n\n<div class="stanza"><p>che tu mi sie di tuoi prieghi cortese</p>\n<p>in Fano, s&igrave; che ben per me s&rsquo;adori</p>\n<p>pur ch&rsquo;i&rsquo; possa purgar le gravi offese.</p></div>\n\n<div class="stanza"><p>Quindi fu&rsquo; io; ma li profondi f&oacute;ri</p>\n<p>ond&rsquo; usc&igrave; &rsquo;l sangue in sul quale io sedea,</p>\n<p>fatti mi fuoro in grembo a li Antenori,</p></div>\n\n<div class="stanza"><p>l&agrave; dov&rsquo; io pi&ugrave; sicuro esser credea:</p>\n<p>quel da Esti il f&eacute; far, che m&rsquo;avea in ira</p>\n<p>assai pi&ugrave; l&agrave; che dritto non volea.</p></div>\n\n<div class="stanza"><p>Ma s&rsquo;io fosse fuggito inver&rsquo; la Mira,</p>\n<p>quando fu&rsquo; sovragiunto ad Or&iuml;aco,</p>\n<p>ancor sarei di l&agrave; dove si spira.</p></div>\n\n<div class="stanza"><p>Corsi al palude, e le cannucce e &rsquo;l braco</p>\n<p>m&rsquo;impigliar s&igrave; ch&rsquo;i&rsquo; caddi; e l&igrave; vid&rsquo; io</p>\n<p>de le mie vene farsi in terra laco&raquo;.</p></div>\n\n<div class="stanza"><p>Poi disse un altro: &laquo;Deh, se quel disio</p>\n<p>si compia che ti tragge a l&rsquo;alto monte,</p>\n<p>con buona p&iuml;etate aiuta il mio!</p></div>\n\n<div class="stanza"><p>Io fui di Montefeltro, io son Bonconte;</p>\n<p>Giovanna o altri non ha di me cura;</p>\n<p>per ch&rsquo;io vo tra costor con bassa fronte&raquo;.</p></div>\n\n<div class="stanza"><p>E io a lui: &laquo;Qual forza o qual ventura</p>\n<p>ti trav&iuml;&ograve; s&igrave; fuor di Campaldino,</p>\n<p>che non si seppe mai tua sepultura?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Oh!&raquo;, rispuos&rsquo; elli, &laquo;a pi&egrave; del Casentino</p>\n<p>traversa un&rsquo;acqua c&rsquo;ha nome l&rsquo;Archiano,</p>\n<p>che sovra l&rsquo;Ermo nasce in Apennino.</p></div>\n\n<div class="stanza"><p>L&agrave; &rsquo;ve &rsquo;l vocabol suo diventa vano,</p>\n<p>arriva&rsquo; io forato ne la gola,</p>\n<p>fuggendo a piede e sanguinando il piano.</p></div>\n\n<div class="stanza"><p>Quivi perdei la vista e la parola;</p>\n<p>nel nome di Maria fini&rsquo;, e quivi</p>\n<p>caddi, e rimase la mia carne sola.</p></div>\n\n<div class="stanza"><p>Io dir&ograve; vero, e tu &rsquo;l rid&igrave; tra &rsquo; vivi:</p>\n<p>l&rsquo;angel di Dio mi prese, e quel d&rsquo;inferno</p>\n<p>gridava: &ldquo;O tu del ciel, perch&eacute; mi privi?</p></div>\n\n<div class="stanza"><p>Tu te ne porti di costui l&rsquo;etterno</p>\n<p>per una lagrimetta che &rsquo;l mi toglie;</p>\n<p>ma io far&ograve; de l&rsquo;altro altro governo!&rdquo;.</p></div>\n\n<div class="stanza"><p>Ben sai come ne l&rsquo;aere si raccoglie</p>\n<p>quell&rsquo; umido vapor che in acqua riede,</p>\n<p>tosto che sale dove &rsquo;l freddo il coglie.</p></div>\n\n<div class="stanza"><p>Giunse quel mal voler che pur mal chiede</p>\n<p>con lo &rsquo;ntelletto, e mosse il fummo e &rsquo;l vento</p>\n<p>per la virt&ugrave; che sua natura diede.</p></div>\n\n<div class="stanza"><p>Indi la valle, come &rsquo;l d&igrave; fu spento,</p>\n<p>da Pratomagno al gran giogo coperse</p>\n<p>di nebbia; e &rsquo;l ciel di sopra fece intento,</p></div>\n\n<div class="stanza"><p>s&igrave; che &rsquo;l pregno aere in acqua si converse;</p>\n<p>la pioggia cadde, e a&rsquo; fossati venne</p>\n<p>di lei ci&ograve; che la terra non sofferse;</p></div>\n\n<div class="stanza"><p>e come ai rivi grandi si convenne,</p>\n<p>ver&rsquo; lo fiume real tanto veloce</p>\n<p>si ruin&ograve;, che nulla la ritenne.</p></div>\n\n<div class="stanza"><p>Lo corpo mio gelato in su la foce</p>\n<p>trov&ograve; l&rsquo;Archian rubesto; e quel sospinse</p>\n<p>ne l&rsquo;Arno, e sciolse al mio petto la croce</p></div>\n\n<div class="stanza"><p>ch&rsquo;i&rsquo; fe&rsquo; di me quando &rsquo;l dolor mi vinse;</p>\n<p>volt&ograve;mmi per le ripe e per lo fondo,</p>\n<p>poi di sua preda mi coperse e cinse&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Deh, quando tu sarai tornato al mondo</p>\n<p>e riposato de la lunga via&raquo;,</p>\n<p>seguit&ograve; &rsquo;l terzo spirito al secondo,</p></div>\n\n<div class="stanza"><p>&laquo;ricorditi di me, che son la Pia;</p>\n<p>Siena mi f&eacute;, disfecemi Maremma:</p>\n<p>salsi colui che &rsquo;nnanellata pria</p></div>\n\n<div class="stanza"><p>disposando m&rsquo;avea con la sua gemma&raquo;.</p></div>','<p class="cantohead">Canto VI</p>\n\n<div class="stanza"><p>Quando si parte il gioco de la zara,</p>\n<p>colui che perde si riman dolente,</p>\n<p>repetendo le volte, e tristo impara;</p></div>\n\n<div class="stanza"><p>con l&rsquo;altro se ne va tutta la gente;</p>\n<p>qual va dinanzi, e qual di dietro il prende,</p>\n<p>e qual dallato li si reca a mente;</p></div>\n\n<div class="stanza"><p>el non s&rsquo;arresta, e questo e quello intende;</p>\n<p>a cui porge la man, pi&ugrave; non fa pressa;</p>\n<p>e cos&igrave; da la calca si difende.</p></div>\n\n<div class="stanza"><p>Tal era io in quella turba spessa,</p>\n<p>volgendo a loro, e qua e l&agrave;, la faccia,</p>\n<p>e promettendo mi sciogliea da essa.</p></div>\n\n<div class="stanza"><p>Quiv&rsquo; era l&rsquo;Aretin che da le braccia</p>\n<p>fiere di Ghin di Tacco ebbe la morte,</p>\n<p>e l&rsquo;altro ch&rsquo;anneg&ograve; correndo in caccia.</p></div>\n\n<div class="stanza"><p>Quivi pregava con le mani sporte</p>\n<p>Federigo Novello, e quel da Pisa</p>\n<p>che f&eacute; parer lo buon Marzucco forte.</p></div>\n\n<div class="stanza"><p>Vidi conte Orso e l&rsquo;anima divisa</p>\n<p>dal corpo suo per astio e per inveggia,</p>\n<p>com&rsquo; e&rsquo; dicea, non per colpa commisa;</p></div>\n\n<div class="stanza"><p>Pier da la Broccia dico; e qui proveggia,</p>\n<p>mentr&rsquo; &egrave; di qua, la donna di Brabante,</p>\n<p>s&igrave; che per&ograve; non sia di peggior greggia.</p></div>\n\n<div class="stanza"><p>Come libero fui da tutte quante</p>\n<p>quell&rsquo; ombre che pregar pur ch&rsquo;altri prieghi,</p>\n<p>s&igrave; che s&rsquo;avacci lor divenir sante,</p></div>\n\n<div class="stanza"><p>io cominciai: &laquo;El par che tu mi nieghi,</p>\n<p>o luce mia, espresso in alcun testo</p>\n<p>che decreto del cielo orazion pieghi;</p></div>\n\n<div class="stanza"><p>e questa gente prega pur di questo:</p>\n<p>sarebbe dunque loro speme vana,</p>\n<p>o non m&rsquo;&egrave; &rsquo;l detto tuo ben manifesto?&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;La mia scrittura &egrave; piana;</p>\n<p>e la speranza di costor non falla,</p>\n<p>se ben si guarda con la mente sana;</p></div>\n\n<div class="stanza"><p>ch&eacute; cima di giudicio non s&rsquo;avvalla</p>\n<p>perch&eacute; foco d&rsquo;amor compia in un punto</p>\n<p>ci&ograve; che de&rsquo; sodisfar chi qui s&rsquo;astalla;</p></div>\n\n<div class="stanza"><p>e l&agrave; dov&rsquo; io fermai cotesto punto,</p>\n<p>non s&rsquo;ammendava, per pregar, difetto,</p>\n<p>perch&eacute; &rsquo;l priego da Dio era disgiunto.</p></div>\n\n<div class="stanza"><p>Veramente a cos&igrave; alto sospetto</p>\n<p>non ti fermar, se quella nol ti dice</p>\n<p>che lume fia tra &rsquo;l vero e lo &rsquo;ntelletto.</p></div>\n\n<div class="stanza"><p>Non so se &rsquo;ntendi: io dico di Beatrice;</p>\n<p>tu la vedrai di sopra, in su la vetta</p>\n<p>di questo monte, ridere e felice&raquo;.</p></div>\n\n<div class="stanza"><p>E io: &laquo;Segnore, andiamo a maggior fretta,</p>\n<p>ch&eacute; gi&agrave; non m&rsquo;affatico come dianzi,</p>\n<p>e vedi omai che &rsquo;l poggio l&rsquo;ombra getta&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Noi anderem con questo giorno innanzi&raquo;,</p>\n<p>rispuose, &laquo;quanto pi&ugrave; potremo omai;</p>\n<p>ma &rsquo;l fatto &egrave; d&rsquo;altra forma che non stanzi.</p></div>\n\n<div class="stanza"><p>Prima che sie l&agrave; s&ugrave;, tornar vedrai</p>\n<p>colui che gi&agrave; si cuopre de la costa,</p>\n<p>s&igrave; che &rsquo; suoi raggi tu romper non fai.</p></div>\n\n<div class="stanza"><p>Ma vedi l&agrave; un&rsquo;anima che, posta</p>\n<p>sola soletta, inverso noi riguarda:</p>\n<p>quella ne &rsquo;nsegner&agrave; la via pi&ugrave; tosta&raquo;.</p></div>\n\n<div class="stanza"><p>Venimmo a lei: o anima lombarda,</p>\n<p>come ti stavi altera e disdegnosa</p>\n<p>e nel mover de li occhi onesta e tarda!</p></div>\n\n<div class="stanza"><p>Ella non ci dic&euml;a alcuna cosa,</p>\n<p>ma lasciavane gir, solo sguardando</p>\n<p>a guisa di leon quando si posa.</p></div>\n\n<div class="stanza"><p>Pur Virgilio si trasse a lei, pregando</p>\n<p>che ne mostrasse la miglior salita;</p>\n<p>e quella non rispuose al suo dimando,</p></div>\n\n<div class="stanza"><p>ma di nostro paese e de la vita</p>\n<p>ci &rsquo;nchiese; e &rsquo;l dolce duca incominciava</p>\n<p>&laquo;Mant&uuml;a . . . &raquo;, e l&rsquo;ombra, tutta in s&eacute; romita,</p></div>\n\n<div class="stanza"><p>surse ver&rsquo; lui del loco ove pria stava,</p>\n<p>dicendo: &laquo;O Mantoano, io son Sordello</p>\n<p>de la tua terra!&raquo;; e l&rsquo;un l&rsquo;altro abbracciava.</p></div>\n\n<div class="stanza"><p>Ahi serva Italia, di dolore ostello,</p>\n<p>nave sanza nocchiere in gran tempesta,</p>\n<p>non donna di province, ma bordello!</p></div>\n\n<div class="stanza"><p>Quell&rsquo; anima gentil fu cos&igrave; presta,</p>\n<p>sol per lo dolce suon de la sua terra,</p>\n<p>di fare al cittadin suo quivi festa;</p></div>\n\n<div class="stanza"><p>e ora in te non stanno sanza guerra</p>\n<p>li vivi tuoi, e l&rsquo;un l&rsquo;altro si rode</p>\n<p>di quei ch&rsquo;un muro e una fossa serra.</p></div>\n\n<div class="stanza"><p>Cerca, misera, intorno da le prode</p>\n<p>le tue marine, e poi ti guarda in seno,</p>\n<p>s&rsquo;alcuna parte in te di pace gode.</p></div>\n\n<div class="stanza"><p>Che val perch&eacute; ti racconciasse il freno</p>\n<p>Iustin&iuml;ano, se la sella &egrave; v&ograve;ta?</p>\n<p>Sanz&rsquo; esso fora la vergogna meno.</p></div>\n\n<div class="stanza"><p>Ahi gente che dovresti esser devota,</p>\n<p>e lasciar seder Cesare in la sella,</p>\n<p>se bene intendi ci&ograve; che Dio ti nota,</p></div>\n\n<div class="stanza"><p>guarda come esta fiera &egrave; fatta fella</p>\n<p>per non esser corretta da li sproni,</p>\n<p>poi che ponesti mano a la predella.</p></div>\n\n<div class="stanza"><p>O Alberto tedesco ch&rsquo;abbandoni</p>\n<p>costei ch&rsquo;&egrave; fatta indomita e selvaggia,</p>\n<p>e dovresti inforcar li suoi arcioni,</p></div>\n\n<div class="stanza"><p>giusto giudicio da le stelle caggia</p>\n<p>sovra &rsquo;l tuo sangue, e sia novo e aperto,</p>\n<p>tal che &rsquo;l tuo successor temenza n&rsquo;aggia!</p></div>\n\n<div class="stanza"><p>Ch&rsquo;avete tu e &rsquo;l tuo padre sofferto,</p>\n<p>per cupidigia di cost&agrave; distretti,</p>\n<p>che &rsquo;l giardin de lo &rsquo;mperio sia diserto.</p></div>\n\n<div class="stanza"><p>Vieni a veder Montecchi e Cappelletti,</p>\n<p>Monaldi e Filippeschi, uom sanza cura:</p>\n<p>color gi&agrave; tristi, e questi con sospetti!</p></div>\n\n<div class="stanza"><p>Vien, crudel, vieni, e vedi la pressura</p>\n<p>d&rsquo;i tuoi gentili, e cura lor magagne;</p>\n<p>e vedrai Santafior com&rsquo; &egrave; oscura!</p></div>\n\n<div class="stanza"><p>Vieni a veder la tua Roma che piagne</p>\n<p>vedova e sola, e d&igrave; e notte chiama:</p>\n<p>&laquo;Cesare mio, perch&eacute; non m&rsquo;accompagne?&raquo;.</p></div>\n\n<div class="stanza"><p>Vieni a veder la gente quanto s&rsquo;ama!</p>\n<p>e se nulla di noi piet&agrave; ti move,</p>\n<p>a vergognar ti vien de la tua fama.</p></div>\n\n<div class="stanza"><p>E se licito m&rsquo;&egrave;, o sommo Giove</p>\n<p>che fosti in terra per noi crucifisso,</p>\n<p>son li giusti occhi tuoi rivolti altrove?</p></div>\n\n<div class="stanza"><p>O &egrave; preparazion che ne l&rsquo;abisso</p>\n<p>del tuo consiglio fai per alcun bene</p>\n<p>in tutto de l&rsquo;accorger nostro scisso?</p></div>\n\n<div class="stanza"><p>Ch&eacute; le citt&agrave; d&rsquo;Italia tutte piene</p>\n<p>son di tiranni, e un Marcel diventa</p>\n<p>ogne villan che parteggiando viene.</p></div>\n\n<div class="stanza"><p>Fiorenza mia, ben puoi esser contenta</p>\n<p>di questa digression che non ti tocca,</p>\n<p>merc&eacute; del popol tuo che si argomenta.</p></div>\n\n<div class="stanza"><p>Molti han giustizia in cuore, e tardi scocca</p>\n<p>per non venir sanza consiglio a l&rsquo;arco;</p>\n<p>ma il popol tuo l&rsquo;ha in sommo de la bocca.</p></div>\n\n<div class="stanza"><p>Molti rifiutan lo comune incarco;</p>\n<p>ma il popol tuo solicito risponde</p>\n<p>sanza chiamare, e grida: &laquo;I&rsquo; mi sobbarco!&raquo;.</p></div>\n\n<div class="stanza"><p>Or ti fa lieta, ch&eacute; tu hai ben onde:</p>\n<p>tu ricca, tu con pace e tu con senno!</p>\n<p>S&rsquo;io dico &rsquo;l ver, l&rsquo;effetto nol nasconde.</p></div>\n\n<div class="stanza"><p>Atene e Lacedemona, che fenno</p>\n<p>l&rsquo;antiche leggi e furon s&igrave; civili,</p>\n<p>fecero al viver bene un picciol cenno</p></div>\n\n<div class="stanza"><p>verso di te, che fai tanto sottili</p>\n<p>provedimenti, ch&rsquo;a mezzo novembre</p>\n<p>non giugne quel che tu d&rsquo;ottobre fili.</p></div>\n\n<div class="stanza"><p>Quante volte, del tempo che rimembre,</p>\n<p>legge, moneta, officio e costume</p>\n<p>hai tu mutato, e rinovate membre!</p></div>\n\n<div class="stanza"><p>E se ben ti ricordi e vedi lume,</p>\n<p>vedrai te somigliante a quella inferma</p>\n<p>che non pu&ograve; trovar posa in su le piume,</p></div>\n\n<div class="stanza"><p>ma con dar volta suo dolore scherma.</p></div>','<p class="cantohead">Canto VII</p>\n\n<div class="stanza"><p>Poscia che l&rsquo;accoglienze oneste e liete</p>\n<p>furo iterate tre e quattro volte,</p>\n<p>Sordel si trasse, e disse: &laquo;Voi, chi siete?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Anzi che a questo monte fosser volte</p>\n<p>l&rsquo;anime degne di salire a Dio,</p>\n<p>fur l&rsquo;ossa mie per Ottavian sepolte.</p></div>\n\n<div class="stanza"><p>Io son Virgilio; e per null&rsquo; altro rio</p>\n<p>lo ciel perdei che per non aver f&eacute;&raquo;.</p>\n<p>Cos&igrave; rispuose allora il duca mio.</p></div>\n\n<div class="stanza"><p>Qual &egrave; colui che cosa innanzi s&eacute;</p>\n<p>s&ugrave;bita vede ond&rsquo; e&rsquo; si maraviglia,</p>\n<p>che crede e non, dicendo &laquo;Ella &egrave; . . . non &egrave; . . . &raquo;,</p></div>\n\n<div class="stanza"><p>tal parve quelli; e poi chin&ograve; le ciglia,</p>\n<p>e umilmente ritorn&ograve; ver&rsquo; lui,</p>\n<p>e abbracci&ograve;l l&agrave; &rsquo;ve &rsquo;l minor s&rsquo;appiglia.</p></div>\n\n<div class="stanza"><p>&laquo;O gloria di Latin&raquo;, disse, &laquo;per cui</p>\n<p>mostr&ograve; ci&ograve; che potea la lingua nostra,</p>\n<p>o pregio etterno del loco ond&rsquo; io fui,</p></div>\n\n<div class="stanza"><p>qual merito o qual grazia mi ti mostra?</p>\n<p>S&rsquo;io son d&rsquo;udir le tue parole degno,</p>\n<p>dimmi se vien d&rsquo;inferno, e di qual chiostra&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Per tutt&rsquo; i cerchi del dolente regno&raquo;,</p>\n<p>rispuose lui, &laquo;son io di qua venuto;</p>\n<p>virt&ugrave; del ciel mi mosse, e con lei vegno.</p></div>\n\n<div class="stanza"><p>Non per far, ma per non fare ho perduto</p>\n<p>a veder l&rsquo;alto Sol che tu disiri</p>\n<p>e che fu tardi per me conosciuto.</p></div>\n\n<div class="stanza"><p>Luogo &egrave; l&agrave; gi&ugrave; non tristo di mart&igrave;ri,</p>\n<p>ma di tenebre solo, ove i lamenti</p>\n<p>non suonan come guai, ma son sospiri.</p></div>\n\n<div class="stanza"><p>Quivi sto io coi pargoli innocenti</p>\n<p>dai denti morsi de la morte avante</p>\n<p>che fosser da l&rsquo;umana colpa essenti;</p></div>\n\n<div class="stanza"><p>quivi sto io con quei che le tre sante</p>\n<p>virt&ugrave; non si vestiro, e sanza vizio</p>\n<p>conobber l&rsquo;altre e seguir tutte quante.</p></div>\n\n<div class="stanza"><p>Ma se tu sai e puoi, alcuno indizio</p>\n<p>d&agrave; noi per che venir possiam pi&ugrave; tosto</p>\n<p>l&agrave; dove purgatorio ha dritto inizio&raquo;.</p></div>\n\n<div class="stanza"><p>Rispuose: &laquo;Loco certo non c&rsquo;&egrave; posto;</p>\n<p>licito m&rsquo;&egrave; andar suso e intorno;</p>\n<p>per quanto ir posso, a guida mi t&rsquo;accosto.</p></div>\n\n<div class="stanza"><p>Ma vedi gi&agrave; come dichina il giorno,</p>\n<p>e andar s&ugrave; di notte non si puote;</p>\n<p>per&ograve; &egrave; buon pensar di bel soggiorno.</p></div>\n\n<div class="stanza"><p>Anime sono a destra qua remote;</p>\n<p>se mi consenti, io ti merr&ograve; ad esse,</p>\n<p>e non sanza diletto ti fier note&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Com&rsquo; &egrave; ci&ograve;?&raquo;, fu risposto. &laquo;Chi volesse</p>\n<p>salir di notte, fora elli impedito</p>\n<p>d&rsquo;altrui, o non sarria ch&eacute; non potesse?&raquo;.</p></div>\n\n<div class="stanza"><p>E &rsquo;l buon Sordello in terra freg&ograve; &rsquo;l dito,</p>\n<p>dicendo: &laquo;Vedi? sola questa riga</p>\n<p>non varcheresti dopo &rsquo;l sol partito:</p></div>\n\n<div class="stanza"><p>non per&ograve; ch&rsquo;altra cosa desse briga,</p>\n<p>che la notturna tenebra, ad ir suso;</p>\n<p>quella col nonpoder la voglia intriga.</p></div>\n\n<div class="stanza"><p>Ben si poria con lei tornare in giuso</p>\n<p>e passeggiar la costa intorno errando,</p>\n<p>mentre che l&rsquo;orizzonte il d&igrave; tien chiuso&raquo;.</p></div>\n\n<div class="stanza"><p>Allora il mio segnor, quasi ammirando,</p>\n<p>&laquo;Menane&raquo;, disse, &laquo;dunque l&agrave; &rsquo;ve dici</p>\n<p>ch&rsquo;aver si pu&ograve; diletto dimorando&raquo;.</p></div>\n\n<div class="stanza"><p>Poco allungati c&rsquo;eravam di lici,</p>\n<p>quand&rsquo; io m&rsquo;accorsi che &rsquo;l monte era scemo,</p>\n<p>a guisa che i vallon li sceman quici.</p></div>\n\n<div class="stanza"><p>&laquo;Col&agrave;&raquo;, disse quell&rsquo; ombra, &laquo;n&rsquo;anderemo</p>\n<p>dove la costa face di s&eacute; grembo;</p>\n<p>e l&agrave; il novo giorno attenderemo&raquo;.</p></div>\n\n<div class="stanza"><p>Tra erto e piano era un sentiero schembo,</p>\n<p>che ne condusse in fianco de la lacca,</p>\n<p>l&agrave; dove pi&ugrave; ch&rsquo;a mezzo muore il lembo.</p></div>\n\n<div class="stanza"><p>Oro e argento fine, cocco e biacca,</p>\n<p>indaco, legno lucido e sereno,</p>\n<p>fresco smeraldo in l&rsquo;ora che si fiacca,</p></div>\n\n<div class="stanza"><p>da l&rsquo;erba e da li fior, dentr&rsquo; a quel seno</p>\n<p>posti, ciascun saria di color vinto,</p>\n<p>come dal suo maggiore &egrave; vinto il meno.</p></div>\n\n<div class="stanza"><p>Non avea pur natura ivi dipinto,</p>\n<p>ma di soavit&agrave; di mille odori</p>\n<p>vi facea uno incognito e indistinto.</p></div>\n\n<div class="stanza"><p>&lsquo;Salve, Regina&rsquo; in sul verde e &rsquo;n su&rsquo; fiori</p>\n<p>quindi seder cantando anime vidi,</p>\n<p>che per la valle non parean di fuori.</p></div>\n\n<div class="stanza"><p>&laquo;Prima che &rsquo;l poco sole omai s&rsquo;annidi&raquo;,</p>\n<p>cominci&ograve; &rsquo;l Mantoan che ci avea v&ograve;lti,</p>\n<p>&laquo;tra color non vogliate ch&rsquo;io vi guidi.</p></div>\n\n<div class="stanza"><p>Di questo balzo meglio li atti e &rsquo; volti</p>\n<p>conoscerete voi di tutti quanti,</p>\n<p>che ne la lama gi&ugrave; tra essi accolti.</p></div>\n\n<div class="stanza"><p>Colui che pi&ugrave; siede alto e fa sembianti</p>\n<p>d&rsquo;aver negletto ci&ograve; che far dovea,</p>\n<p>e che non move bocca a li altrui canti,</p></div>\n\n<div class="stanza"><p>Rodolfo imperador fu, che potea</p>\n<p>sanar le piaghe c&rsquo;hanno Italia morta,</p>\n<p>s&igrave; che tardi per altri si ricrea.</p></div>\n\n<div class="stanza"><p>L&rsquo;altro che ne la vista lui conforta,</p>\n<p>resse la terra dove l&rsquo;acqua nasce</p>\n<p>che Molta in Albia, e Albia in mar ne porta:</p></div>\n\n<div class="stanza"><p>Ottacchero ebbe nome, e ne le fasce</p>\n<p>fu meglio assai che Vincislao suo figlio</p>\n<p>barbuto, cui lussuria e ozio pasce.</p></div>\n\n<div class="stanza"><p>E quel nasetto che stretto a consiglio</p>\n<p>par con colui c&rsquo;ha s&igrave; benigno aspetto,</p>\n<p>mor&igrave; fuggendo e disfiorando il giglio:</p></div>\n\n<div class="stanza"><p>guardate l&agrave; come si batte il petto!</p>\n<p>L&rsquo;altro vedete c&rsquo;ha fatto a la guancia</p>\n<p>de la sua palma, sospirando, letto.</p></div>\n\n<div class="stanza"><p>Padre e suocero son del mal di Francia:</p>\n<p>sanno la vita sua viziata e lorda,</p>\n<p>e quindi viene il duol che s&igrave; li lancia.</p></div>\n\n<div class="stanza"><p>Quel che par s&igrave; membruto e che s&rsquo;accorda,</p>\n<p>cantando, con colui dal maschio naso,</p>\n<p>d&rsquo;ogne valor port&ograve; cinta la corda;</p></div>\n\n<div class="stanza"><p>e se re dopo lui fosse rimaso</p>\n<p>lo giovanetto che retro a lui siede,</p>\n<p>ben andava il valor di vaso in vaso,</p></div>\n\n<div class="stanza"><p>che non si puote dir de l&rsquo;altre rede;</p>\n<p>Iacomo e Federigo hanno i reami;</p>\n<p>del retaggio miglior nessun possiede.</p></div>\n\n<div class="stanza"><p>Rade volte risurge per li rami</p>\n<p>l&rsquo;umana probitate; e questo vole</p>\n<p>quei che la d&agrave;, perch&eacute; da lui si chiami.</p></div>\n\n<div class="stanza"><p>Anche al nasuto vanno mie parole</p>\n<p>non men ch&rsquo;a l&rsquo;altro, Pier, che con lui canta,</p>\n<p>onde Puglia e Proenza gi&agrave; si dole.</p></div>\n\n<div class="stanza"><p>Tant&rsquo; &egrave; del seme suo minor la pianta,</p>\n<p>quanto, pi&ugrave; che Beatrice e Margherita,</p>\n<p>Costanza di marito ancor si vanta.</p></div>\n\n<div class="stanza"><p>Vedete il re de la semplice vita</p>\n<p>seder l&agrave; solo, Arrigo d&rsquo;Inghilterra:</p>\n<p>questi ha ne&rsquo; rami suoi migliore uscita.</p></div>\n\n<div class="stanza"><p>Quel che pi&ugrave; basso tra costor s&rsquo;atterra,</p>\n<p>guardando in suso, &egrave; Guiglielmo marchese,</p>\n<p>per cui e Alessandria e la sua guerra</p></div>\n\n<div class="stanza"><p>fa pianger Monferrato e Canavese&raquo;.</p></div>','<p class="cantohead">Canto VIII</p>\n\n<div class="stanza"><p>Era gi&agrave; l&rsquo;ora che volge il disio</p>\n<p>ai navicanti e &rsquo;ntenerisce il core</p>\n<p>lo d&igrave; c&rsquo;han detto ai dolci amici addio;</p></div>\n\n<div class="stanza"><p>e che lo novo peregrin d&rsquo;amore</p>\n<p>punge, se ode squilla di lontano</p>\n<p>che paia il giorno pianger che si more;</p></div>\n\n<div class="stanza"><p>quand&rsquo; io incominciai a render vano</p>\n<p>l&rsquo;udire e a mirare una de l&rsquo;alme</p>\n<p>surta, che l&rsquo;ascoltar chiedea con mano.</p></div>\n\n<div class="stanza"><p>Ella giunse e lev&ograve; ambo le palme,</p>\n<p>ficcando li occhi verso l&rsquo;or&iuml;ente,</p>\n<p>come dicesse a Dio: &lsquo;D&rsquo;altro non calme&rsquo;.</p></div>\n\n<div class="stanza"><p>&lsquo;Te lucis ante&rsquo; s&igrave; devotamente</p>\n<p>le usc&igrave;o di bocca e con s&igrave; dolci note,</p>\n<p>che fece me a me uscir di mente;</p></div>\n\n<div class="stanza"><p>e l&rsquo;altre poi dolcemente e devote</p>\n<p>seguitar lei per tutto l&rsquo;inno intero,</p>\n<p>avendo li occhi a le superne rote.</p></div>\n\n<div class="stanza"><p>Aguzza qui, lettor, ben li occhi al vero,</p>\n<p>ch&eacute; &rsquo;l velo &egrave; ora ben tanto sottile,</p>\n<p>certo che &rsquo;l trapassar dentro &egrave; leggero.</p></div>\n\n<div class="stanza"><p>Io vidi quello essercito gentile</p>\n<p>tacito poscia riguardare in s&ugrave;e,</p>\n<p>quasi aspettando, palido e um&igrave;le;</p></div>\n\n<div class="stanza"><p>e vidi uscir de l&rsquo;alto e scender gi&ugrave;e</p>\n<p>due angeli con due spade affocate,</p>\n<p>tronche e private de le punte sue.</p></div>\n\n<div class="stanza"><p>Verdi come fogliette pur mo nate</p>\n<p>erano in veste, che da verdi penne</p>\n<p>percosse traean dietro e ventilate.</p></div>\n\n<div class="stanza"><p>L&rsquo;un poco sovra noi a star si venne,</p>\n<p>e l&rsquo;altro scese in l&rsquo;opposita sponda,</p>\n<p>s&igrave; che la gente in mezzo si contenne.</p></div>\n\n<div class="stanza"><p>Ben discern&euml;a in lor la testa bionda;</p>\n<p>ma ne la faccia l&rsquo;occhio si smarria,</p>\n<p>come virt&ugrave; ch&rsquo;a troppo si confonda.</p></div>\n\n<div class="stanza"><p>&laquo;Ambo vegnon del grembo di Maria&raquo;,</p>\n<p>disse Sordello, &laquo;a guardia de la valle,</p>\n<p>per lo serpente che verr&agrave; vie via&raquo;.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; io, che non sapeva per qual calle,</p>\n<p>mi volsi intorno, e stretto m&rsquo;accostai,</p>\n<p>tutto gelato, a le fidate spalle.</p></div>\n\n<div class="stanza"><p>E Sordello anco: &laquo;Or avvalliamo omai</p>\n<p>tra le grandi ombre, e parleremo ad esse;</p>\n<p>graz&iuml;oso fia lor vedervi assai&raquo;.</p></div>\n\n<div class="stanza"><p>Solo tre passi credo ch&rsquo;i&rsquo; scendesse,</p>\n<p>e fui di sotto, e vidi un che mirava</p>\n<p>pur me, come conoscer mi volesse.</p></div>\n\n<div class="stanza"><p>Temp&rsquo; era gi&agrave; che l&rsquo;aere s&rsquo;annerava,</p>\n<p>ma non s&igrave; che tra li occhi suoi e &rsquo; miei</p>\n<p>non dichiarisse ci&ograve; che pria serrava.</p></div>\n\n<div class="stanza"><p>Ver&rsquo; me si fece, e io ver&rsquo; lui mi fei:</p>\n<p>giudice Nin gentil, quanto mi piacque</p>\n<p>quando ti vidi non esser tra &rsquo; rei!</p></div>\n\n<div class="stanza"><p>Nullo bel salutar tra noi si tacque;</p>\n<p>poi dimand&ograve;: &laquo;Quant&rsquo; &egrave; che tu venisti</p>\n<p>a pi&egrave; del monte per le lontane acque?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Oh!&raquo;, diss&rsquo; io lui, &laquo;per entro i luoghi tristi</p>\n<p>venni stamane, e sono in prima vita,</p>\n<p>ancor che l&rsquo;altra, s&igrave; andando, acquisti&raquo;.</p></div>\n\n<div class="stanza"><p>E come fu la mia risposta udita,</p>\n<p>Sordello ed elli in dietro si raccolse</p>\n<p>come gente di s&ugrave;bito smarrita.</p></div>\n\n<div class="stanza"><p>L&rsquo;uno a Virgilio e l&rsquo;altro a un si volse</p>\n<p>che sedea l&igrave;, gridando: &laquo;S&ugrave;, Currado!</p>\n<p>vieni a veder che Dio per grazia volse&raquo;.</p></div>\n\n<div class="stanza"><p>Poi, v&ograve;lto a me: &laquo;Per quel singular grado</p>\n<p>che tu dei a colui che s&igrave; nasconde</p>\n<p>lo suo primo perch&eacute;, che non l&igrave; &egrave; guado,</p></div>\n\n<div class="stanza"><p>quando sarai di l&agrave; da le larghe onde,</p>\n<p>d&igrave; a Giovanna mia che per me chiami</p>\n<p>l&agrave; dove a li &rsquo;nnocenti si risponde.</p></div>\n\n<div class="stanza"><p>Non credo che la sua madre pi&ugrave; m&rsquo;ami,</p>\n<p>poscia che trasmut&ograve; le bianche bende,</p>\n<p>le quai convien che, misera!, ancor brami.</p></div>\n\n<div class="stanza"><p>Per lei assai di lieve si comprende</p>\n<p>quanto in femmina foco d&rsquo;amor dura,</p>\n<p>se l&rsquo;occhio o &rsquo;l tatto spesso non l&rsquo;accende.</p></div>\n\n<div class="stanza"><p>Non le far&agrave; s&igrave; bella sepultura</p>\n<p>la vipera che Melanesi accampa,</p>\n<p>com&rsquo; avria fatto il gallo di Gallura&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; dicea, segnato de la stampa,</p>\n<p>nel suo aspetto, di quel dritto zelo</p>\n<p>che misuratamente in core avvampa.</p></div>\n\n<div class="stanza"><p>Li occhi miei ghiotti andavan pur al cielo,</p>\n<p>pur l&agrave; dove le stelle son pi&ugrave; tarde,</p>\n<p>s&igrave; come rota pi&ugrave; presso a lo stelo.</p></div>\n\n<div class="stanza"><p>E &rsquo;l duca mio: &laquo;Figliuol, che l&agrave; s&ugrave; guarde?&raquo;.</p>\n<p>E io a lui: &laquo;A quelle tre facelle</p>\n<p>di che &rsquo;l polo di qua tutto quanto arde&raquo;.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; elli a me: &laquo;Le quattro chiare stelle</p>\n<p>che vedevi staman, son di l&agrave; basse,</p>\n<p>e queste son salite ov&rsquo; eran quelle&raquo;.</p></div>\n\n<div class="stanza"><p>Com&rsquo; ei parlava, e Sordello a s&eacute; il trasse</p>\n<p>dicendo: &laquo;Vedi l&agrave; &rsquo;l nostro avversaro&raquo;;</p>\n<p>e drizz&ograve; il dito perch&eacute; &rsquo;n l&agrave; guardasse.</p></div>\n\n<div class="stanza"><p>Da quella parte onde non ha riparo</p>\n<p>la picciola vallea, era una biscia,</p>\n<p>forse qual diede ad Eva il cibo amaro.</p></div>\n\n<div class="stanza"><p>Tra l&rsquo;erba e &rsquo; fior ven&igrave;a la mala striscia,</p>\n<p>volgendo ad ora ad or la testa, e &rsquo;l dosso</p>\n<p>leccando come bestia che si liscia.</p></div>\n\n<div class="stanza"><p>Io non vidi, e per&ograve; dicer non posso,</p>\n<p>come mosser li astor celest&iuml;ali;</p>\n<p>ma vidi bene e l&rsquo;uno e l&rsquo;altro mosso.</p></div>\n\n<div class="stanza"><p>Sentendo fender l&rsquo;aere a le verdi ali,</p>\n<p>fugg&igrave; &rsquo;l serpente, e li angeli dier volta,</p>\n<p>suso a le poste rivolando iguali.</p></div>\n\n<div class="stanza"><p>L&rsquo;ombra che s&rsquo;era al giudice raccolta</p>\n<p>quando chiam&ograve;, per tutto quello assalto</p>\n<p>punto non fu da me guardare sciolta.</p></div>\n\n<div class="stanza"><p>&laquo;Se la lucerna che ti mena in alto</p>\n<p>truovi nel tuo arbitrio tanta cera</p>\n<p>quant&rsquo; &egrave; mestiere infino al sommo smalto&raquo;,</p></div>\n\n<div class="stanza"><p>cominci&ograve; ella, &laquo;se novella vera</p>\n<p>di Val di Magra o di parte vicina</p>\n<p>sai, dillo a me, che gi&agrave; grande l&agrave; era.</p></div>\n\n<div class="stanza"><p>Fui chiamato Currado Malaspina;</p>\n<p>non son l&rsquo;antico, ma di lui discesi;</p>\n<p>a&rsquo; miei portai l&rsquo;amor che qui raffina&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Oh!&raquo;, diss&rsquo; io lui, &laquo;per li vostri paesi</p>\n<p>gi&agrave; mai non fui; ma dove si dimora</p>\n<p>per tutta Europa ch&rsquo;ei non sien palesi?</p></div>\n\n<div class="stanza"><p>La fama che la vostra casa onora,</p>\n<p>grida i segnori e grida la contrada,</p>\n<p>s&igrave; che ne sa chi non vi fu ancora;</p></div>\n\n<div class="stanza"><p>e io vi giuro, s&rsquo;io di sopra vada,</p>\n<p>che vostra gente onrata non si sfregia</p>\n<p>del pregio de la borsa e de la spada.</p></div>\n\n<div class="stanza"><p>Uso e natura s&igrave; la privilegia,</p>\n<p>che, perch&eacute; il capo reo il mondo torca,</p>\n<p>sola va dritta e &rsquo;l mal cammin dispregia&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli: &laquo;Or va; che &rsquo;l sol non si ricorca</p>\n<p>sette volte nel letto che &rsquo;l Montone</p>\n<p>con tutti e quattro i pi&egrave; cuopre e inforca,</p></div>\n\n<div class="stanza"><p>che cotesta cortese oppin&iuml;one</p>\n<p>ti fia chiavata in mezzo de la testa</p>\n<p>con maggior chiovi che d&rsquo;altrui sermone,</p></div>\n\n<div class="stanza"><p>se corso di giudicio non s&rsquo;arresta&raquo;.</p></div>','<p class="cantohead">Canto IX</p>\n\n<div class="stanza"><p>La concubina di Titone antico</p>\n<p>gi&agrave; s&rsquo;imbiancava al balco d&rsquo;or&iuml;ente,</p>\n<p>fuor de le braccia del suo dolce amico;</p></div>\n\n<div class="stanza"><p>di gemme la sua fronte era lucente,</p>\n<p>poste in figura del freddo animale</p>\n<p>che con la coda percuote la gente;</p></div>\n\n<div class="stanza"><p>e la notte, de&rsquo; passi con che sale,</p>\n<p>fatti avea due nel loco ov&rsquo; eravamo,</p>\n<p>e &rsquo;l terzo gi&agrave; chinava in giuso l&rsquo;ale;</p></div>\n\n<div class="stanza"><p>quand&rsquo; io, che meco avea di quel d&rsquo;Adamo,</p>\n<p>vinto dal sonno, in su l&rsquo;erba inchinai</p>\n<p>l&agrave; &rsquo;ve gi&agrave; tutti e cinque sedavamo.</p></div>\n\n<div class="stanza"><p>Ne l&rsquo;ora che comincia i tristi lai</p>\n<p>la rondinella presso a la mattina,</p>\n<p>forse a memoria de&rsquo; suo&rsquo; primi guai,</p></div>\n\n<div class="stanza"><p>e che la mente nostra, peregrina</p>\n<p>pi&ugrave; da la carne e men da&rsquo; pensier presa,</p>\n<p>a le sue vis&iuml;on quasi &egrave; divina,</p></div>\n\n<div class="stanza"><p>in sogno mi parea veder sospesa</p>\n<p>un&rsquo;aguglia nel ciel con penne d&rsquo;oro,</p>\n<p>con l&rsquo;ali aperte e a calare intesa;</p></div>\n\n<div class="stanza"><p>ed esser mi parea l&agrave; dove fuoro</p>\n<p>abbandonati i suoi da Ganimede,</p>\n<p>quando fu ratto al sommo consistoro.</p></div>\n\n<div class="stanza"><p>Fra me pensava: &lsquo;Forse questa fiede</p>\n<p>pur qui per uso, e forse d&rsquo;altro loco</p>\n<p>disdegna di portarne suso in piede&rsquo;.</p></div>\n\n<div class="stanza"><p>Poi mi parea che, poi rotata un poco,</p>\n<p>terribil come folgor discendesse,</p>\n<p>e me rapisse suso infino al foco.</p></div>\n\n<div class="stanza"><p>Ivi parea che ella e io ardesse;</p>\n<p>e s&igrave; lo &rsquo;ncendio imaginato cosse,</p>\n<p>che convenne che &rsquo;l sonno si rompesse.</p></div>\n\n<div class="stanza"><p>Non altrimenti Achille si riscosse,</p>\n<p>li occhi svegliati rivolgendo in giro</p>\n<p>e non sappiendo l&agrave; dove si fosse,</p></div>\n\n<div class="stanza"><p>quando la madre da Chir&oacute;n a Schiro</p>\n<p>trafugg&ograve; lui dormendo in le sue braccia,</p>\n<p>l&agrave; onde poi li Greci il dipartiro;</p></div>\n\n<div class="stanza"><p>che mi scoss&rsquo; io, s&igrave; come da la faccia</p>\n<p>mi fugg&igrave; &rsquo;l sonno, e diventa&rsquo; ismorto,</p>\n<p>come fa l&rsquo;uom che, spaventato, agghiaccia.</p></div>\n\n<div class="stanza"><p>Dallato m&rsquo;era solo il mio conforto,</p>\n<p>e &rsquo;l sole er&rsquo; alto gi&agrave; pi&ugrave; che due ore,</p>\n<p>e &rsquo;l viso m&rsquo;era a la marina torto.</p></div>\n\n<div class="stanza"><p>&laquo;Non aver tema&raquo;, disse il mio segnore;</p>\n<p>&laquo;fatti sicur, ch&eacute; noi semo a buon punto;</p>\n<p>non stringer, ma rallarga ogne vigore.</p></div>\n\n<div class="stanza"><p>Tu se&rsquo; omai al purgatorio giunto:</p>\n<p>vedi l&agrave; il balzo che &rsquo;l chiude dintorno;</p>\n<p>vedi l&rsquo;entrata l&agrave; &rsquo;ve par digiunto.</p></div>\n\n<div class="stanza"><p>Dianzi, ne l&rsquo;alba che procede al giorno,</p>\n<p>quando l&rsquo;anima tua dentro dormia,</p>\n<p>sovra li fiori ond&rsquo; &egrave; l&agrave; gi&ugrave; addorno</p></div>\n\n<div class="stanza"><p>venne una donna, e disse: &ldquo;I&rsquo; son Lucia;</p>\n<p>lasciatemi pigliar costui che dorme;</p>\n<p>s&igrave; l&rsquo;agevoler&ograve; per la sua via&rdquo;.</p></div>\n\n<div class="stanza"><p>Sordel rimase e l&rsquo;altre genti forme;</p>\n<p>ella ti tolse, e come &rsquo;l d&igrave; fu chiaro,</p>\n<p>sen venne suso; e io per le sue orme.</p></div>\n\n<div class="stanza"><p>Qui ti pos&ograve;, ma pria mi dimostraro</p>\n<p>li occhi suoi belli quella intrata aperta;</p>\n<p>poi ella e &rsquo;l sonno ad una se n&rsquo;andaro&raquo;.</p></div>\n\n<div class="stanza"><p>A guisa d&rsquo;uom che &rsquo;n dubbio si raccerta</p>\n<p>e che muta in conforto sua paura,</p>\n<p>poi che la verit&agrave; li &egrave; discoperta,</p></div>\n\n<div class="stanza"><p>mi cambia&rsquo; io; e come sanza cura</p>\n<p>vide me &rsquo;l duca mio, su per lo balzo</p>\n<p>si mosse, e io di rietro inver&rsquo; l&rsquo;altura.</p></div>\n\n<div class="stanza"><p>Lettor, tu vedi ben com&rsquo; io innalzo</p>\n<p>la mia matera, e per&ograve; con pi&ugrave; arte</p>\n<p>non ti maravigliar s&rsquo;io la rincalzo.</p></div>\n\n<div class="stanza"><p>Noi ci appressammo, ed eravamo in parte</p>\n<p>che l&agrave; dove pareami prima rotto,</p>\n<p>pur come un fesso che muro diparte,</p></div>\n\n<div class="stanza"><p>vidi una porta, e tre gradi di sotto</p>\n<p>per gire ad essa, di color diversi,</p>\n<p>e un portier ch&rsquo;ancor non facea motto.</p></div>\n\n<div class="stanza"><p>E come l&rsquo;occhio pi&ugrave; e pi&ugrave; v&rsquo;apersi,</p>\n<p>vidil seder sovra &rsquo;l grado sovrano,</p>\n<p>tal ne la faccia ch&rsquo;io non lo soffersi;</p></div>\n\n<div class="stanza"><p>e una spada nuda av&euml;a in mano,</p>\n<p>che reflett&euml;a i raggi s&igrave; ver&rsquo; noi,</p>\n<p>ch&rsquo;io drizzava spesso il viso in vano.</p></div>\n\n<div class="stanza"><p>&laquo;Dite costinci: che volete voi?&raquo;,</p>\n<p>cominci&ograve; elli a dire, &laquo;ov&rsquo; &egrave; la scorta?</p>\n<p>Guardate che &rsquo;l venir s&ugrave; non vi n&ograve;i&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Donna del ciel, di queste cose accorta&raquo;,</p>\n<p>rispuose &rsquo;l mio maestro a lui, &laquo;pur dianzi</p>\n<p>ne disse: &ldquo;Andate l&agrave;: quivi &egrave; la porta&rdquo;&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Ed ella i passi vostri in bene avanzi&raquo;,</p>\n<p>ricominci&ograve; il cortese portinaio:</p>\n<p>&laquo;Venite dunque a&rsquo; nostri gradi innanzi&raquo;.</p></div>\n\n<div class="stanza"><p>L&agrave; ne venimmo; e lo scaglion primaio</p>\n<p>bianco marmo era s&igrave; pulito e terso,</p>\n<p>ch&rsquo;io mi specchiai in esso qual io paio.</p></div>\n\n<div class="stanza"><p>Era il secondo tinto pi&ugrave; che perso,</p>\n<p>d&rsquo;una petrina ruvida e arsiccia,</p>\n<p>crepata per lo lungo e per traverso.</p></div>\n\n<div class="stanza"><p>Lo terzo, che di sopra s&rsquo;ammassiccia,</p>\n<p>porfido mi parea, s&igrave; fiammeggiante</p>\n<p>come sangue che fuor di vena spiccia.</p></div>\n\n<div class="stanza"><p>Sovra questo ten&euml;a ambo le piante</p>\n<p>l&rsquo;angel di Dio sedendo in su la soglia</p>\n<p>che mi sembiava pietra di diamante.</p></div>\n\n<div class="stanza"><p>Per li tre gradi s&ugrave; di buona voglia</p>\n<p>mi trasse il duca mio, dicendo: &laquo;Chiedi</p>\n<p>umilemente che &rsquo;l serrame scioglia&raquo;.</p></div>\n\n<div class="stanza"><p>Divoto mi gittai a&rsquo; santi piedi;</p>\n<p>misericordia chiesi e ch&rsquo;el m&rsquo;aprisse,</p>\n<p>ma tre volte nel petto pria mi diedi.</p></div>\n\n<div class="stanza"><p>Sette P ne la fronte mi descrisse</p>\n<p>col punton de la spada, e &laquo;Fa che lavi,</p>\n<p>quando se&rsquo; dentro, queste piaghe&raquo; disse.</p></div>\n\n<div class="stanza"><p>Cenere, o terra che secca si cavi,</p>\n<p>d&rsquo;un color fora col suo vestimento;</p>\n<p>e di sotto da quel trasse due chiavi.</p></div>\n\n<div class="stanza"><p>L&rsquo;una era d&rsquo;oro e l&rsquo;altra era d&rsquo;argento;</p>\n<p>pria con la bianca e poscia con la gialla</p>\n<p>fece a la porta s&igrave;, ch&rsquo;i&rsquo; fu&rsquo; contento.</p></div>\n\n<div class="stanza"><p>&laquo;Quandunque l&rsquo;una d&rsquo;este chiavi falla,</p>\n<p>che non si volga dritta per la toppa&raquo;,</p>\n<p>diss&rsquo; elli a noi, &laquo;non s&rsquo;apre questa calla.</p></div>\n\n<div class="stanza"><p>Pi&ugrave; cara &egrave; l&rsquo;una; ma l&rsquo;altra vuol troppa</p>\n<p>d&rsquo;arte e d&rsquo;ingegno avanti che diserri,</p>\n<p>perch&rsquo; ella &egrave; quella che &rsquo;l nodo digroppa.</p></div>\n\n<div class="stanza"><p>Da Pier le tegno; e dissemi ch&rsquo;i&rsquo; erri</p>\n<p>anzi ad aprir ch&rsquo;a tenerla serrata,</p>\n<p>pur che la gente a&rsquo; piedi mi s&rsquo;atterri&raquo;.</p></div>\n\n<div class="stanza"><p>Poi pinse l&rsquo;uscio a la porta sacrata,</p>\n<p>dicendo: &laquo;Intrate; ma facciovi accorti</p>\n<p>che di fuor torna chi &rsquo;n dietro si guata&raquo;.</p></div>\n\n<div class="stanza"><p>E quando fuor ne&rsquo; cardini distorti</p>\n<p>li spigoli di quella regge sacra,</p>\n<p>che di metallo son sonanti e forti,</p></div>\n\n<div class="stanza"><p>non rugghi&ograve; s&igrave; n&eacute; si mostr&ograve; s&igrave; acra</p>\n<p>Tarp&euml;a, come tolto le fu il buono</p>\n<p>Metello, per che poi rimase macra.</p></div>\n\n<div class="stanza"><p>Io mi rivolsi attento al primo tuono,</p>\n<p>e &lsquo;Te Deum laudamus&rsquo; mi parea</p>\n<p>udire in voce mista al dolce suono.</p></div>\n\n<div class="stanza"><p>Tale imagine a punto mi rendea</p>\n<p>ci&ograve; ch&rsquo;io udiva, qual prender si suole</p>\n<p>quando a cantar con organi si stea;</p></div>\n\n<div class="stanza"><p>ch&rsquo;or s&igrave; or no s&rsquo;intendon le parole.</p></div>','<p class="cantohead">Canto X</p>\n\n<div class="stanza"><p>Poi fummo dentro al soglio de la porta</p>\n<p>che &rsquo;l mal amor de l&rsquo;anime disusa,</p>\n<p>perch&eacute; fa parer dritta la via torta,</p></div>\n\n<div class="stanza"><p>sonando la senti&rsquo; esser richiusa;</p>\n<p>e s&rsquo;io avesse li occhi v&ograve;lti ad essa,</p>\n<p>qual fora stata al fallo degna scusa?</p></div>\n\n<div class="stanza"><p>Noi salavam per una pietra fessa,</p>\n<p>che si moveva e d&rsquo;una e d&rsquo;altra parte,</p>\n<p>s&igrave; come l&rsquo;onda che fugge e s&rsquo;appressa.</p></div>\n\n<div class="stanza"><p>&laquo;Qui si conviene usare un poco d&rsquo;arte&raquo;,</p>\n<p>cominci&ograve; &rsquo;l duca mio, &laquo;in accostarsi</p>\n<p>or quinci, or quindi al lato che si parte&raquo;.</p></div>\n\n<div class="stanza"><p>E questo fece i nostri passi scarsi,</p>\n<p>tanto che pria lo scemo de la luna</p>\n<p>rigiunse al letto suo per ricorcarsi,</p></div>\n\n<div class="stanza"><p>che noi fossimo fuor di quella cruna;</p>\n<p>ma quando fummo liberi e aperti</p>\n<p>s&ugrave; dove il monte in dietro si rauna,</p></div>\n\n<div class="stanza"><p>&iuml;o stancato e amendue incerti</p>\n<p>di nostra via, restammo in su un piano</p>\n<p>solingo pi&ugrave; che strade per diserti.</p></div>\n\n<div class="stanza"><p>Da la sua sponda, ove confina il vano,</p>\n<p>al pi&egrave; de l&rsquo;alta ripa che pur sale,</p>\n<p>misurrebbe in tre volte un corpo umano;</p></div>\n\n<div class="stanza"><p>e quanto l&rsquo;occhio mio potea trar d&rsquo;ale,</p>\n<p>or dal sinistro e or dal destro fianco,</p>\n<p>questa cornice mi parea cotale.</p></div>\n\n<div class="stanza"><p>L&agrave; s&ugrave; non eran mossi i pi&egrave; nostri anco,</p>\n<p>quand&rsquo; io conobbi quella ripa intorno</p>\n<p>che dritto di salita aveva manco,</p></div>\n\n<div class="stanza"><p>esser di marmo candido e addorno</p>\n<p>d&rsquo;intagli s&igrave;, che non pur Policleto,</p>\n<p>ma la natura l&igrave; avrebbe scorno.</p></div>\n\n<div class="stanza"><p>L&rsquo;angel che venne in terra col decreto</p>\n<p>de la molt&rsquo; anni lagrimata pace,</p>\n<p>ch&rsquo;aperse il ciel del suo lungo divieto,</p></div>\n\n<div class="stanza"><p>dinanzi a noi pareva s&igrave; verace</p>\n<p>quivi intagliato in un atto soave,</p>\n<p>che non sembiava imagine che tace.</p></div>\n\n<div class="stanza"><p>Giurato si saria ch&rsquo;el dicesse &lsquo;Ave!&rsquo;;</p>\n<p>perch&eacute; iv&rsquo; era imaginata quella</p>\n<p>ch&rsquo;ad aprir l&rsquo;alto amor volse la chiave;</p></div>\n\n<div class="stanza"><p>e avea in atto impressa esta favella</p>\n<p>&lsquo;Ecce ancilla De&iuml;&rsquo;, propriamente</p>\n<p>come figura in cera si suggella.</p></div>\n\n<div class="stanza"><p>&laquo;Non tener pur ad un loco la mente&raquo;,</p>\n<p>disse &rsquo;l dolce maestro, che m&rsquo;avea</p>\n<p>da quella parte onde &rsquo;l cuore ha la gente.</p></div>\n\n<div class="stanza"><p>Per ch&rsquo;i&rsquo; mi mossi col viso, e vedea</p>\n<p>di retro da Maria, da quella costa</p>\n<p>onde m&rsquo;era colui che mi movea,</p></div>\n\n<div class="stanza"><p>un&rsquo;altra storia ne la roccia imposta;</p>\n<p>per ch&rsquo;io varcai Virgilio, e fe&rsquo;mi presso,</p>\n<p>acci&ograve; che fosse a li occhi miei disposta.</p></div>\n\n<div class="stanza"><p>Era intagliato l&igrave; nel marmo stesso</p>\n<p>lo carro e &rsquo; buoi, traendo l&rsquo;arca santa,</p>\n<p>per che si teme officio non commesso.</p></div>\n\n<div class="stanza"><p>Dinanzi parea gente; e tutta quanta,</p>\n<p>partita in sette cori, a&rsquo; due mie&rsquo; sensi</p>\n<p>faceva dir l&rsquo;un &lsquo;No&rsquo;, l&rsquo;altro &lsquo;S&igrave;, canta&rsquo;.</p></div>\n\n<div class="stanza"><p>Similemente al fummo de li &rsquo;ncensi</p>\n<p>che v&rsquo;era imaginato, li occhi e &rsquo;l naso</p>\n<p>e al s&igrave; e al no discordi fensi.</p></div>\n\n<div class="stanza"><p>L&igrave; precedeva al benedetto vaso,</p>\n<p>trescando alzato, l&rsquo;umile salmista,</p>\n<p>e pi&ugrave; e men che re era in quel caso.</p></div>\n\n<div class="stanza"><p>Di contra, effig&iuml;ata ad una vista</p>\n<p>d&rsquo;un gran palazzo, Mic&ograve;l ammirava</p>\n<p>s&igrave; come donna dispettosa e trista.</p></div>\n\n<div class="stanza"><p>I&rsquo; mossi i pi&egrave; del loco dov&rsquo; io stava,</p>\n<p>per avvisar da presso un&rsquo;altra istoria,</p>\n<p>che di dietro a Mic&ograve;l mi biancheggiava.</p></div>\n\n<div class="stanza"><p>Quiv&rsquo; era stor&iuml;ata l&rsquo;alta gloria</p>\n<p>del roman principato, il cui valore</p>\n<p>mosse Gregorio a la sua gran vittoria;</p></div>\n\n<div class="stanza"><p>i&rsquo; dico di Traiano imperadore;</p>\n<p>e una vedovella li era al freno,</p>\n<p>di lagrime atteggiata e di dolore.</p></div>\n\n<div class="stanza"><p>Intorno a lui parea calcato e pieno</p>\n<p>di cavalieri, e l&rsquo;aguglie ne l&rsquo;oro</p>\n<p>sovr&rsquo; essi in vista al vento si movieno.</p></div>\n\n<div class="stanza"><p>La miserella intra tutti costoro</p>\n<p>pareva dir: &laquo;Segnor, fammi vendetta</p>\n<p>di mio figliuol ch&rsquo;&egrave; morto, ond&rsquo; io m&rsquo;accoro&raquo;;</p></div>\n\n<div class="stanza"><p>ed elli a lei rispondere: &laquo;Or aspetta</p>\n<p>tanto ch&rsquo;i&rsquo; torni&raquo;; e quella: &laquo;Segnor mio&raquo;,</p>\n<p>come persona in cui dolor s&rsquo;affretta,</p></div>\n\n<div class="stanza"><p>&laquo;se tu non torni?&raquo;; ed ei: &laquo;Chi fia dov&rsquo; io,</p>\n<p>la ti far&agrave;&raquo;; ed ella: &laquo;L&rsquo;altrui bene</p>\n<p>a te che fia, se &rsquo;l tuo metti in oblio?&raquo;;</p></div>\n\n<div class="stanza"><p>ond&rsquo; elli: &laquo;Or ti conforta; ch&rsquo;ei convene</p>\n<p>ch&rsquo;i&rsquo; solva il mio dovere anzi ch&rsquo;i&rsquo; mova:</p>\n<p>giustizia vuole e piet&agrave; mi ritene&raquo;.</p></div>\n\n<div class="stanza"><p>Colui che mai non vide cosa nova</p>\n<p>produsse esto visibile parlare,</p>\n<p>novello a noi perch&eacute; qui non si trova.</p></div>\n\n<div class="stanza"><p>Mentr&rsquo; io mi dilettava di guardare</p>\n<p>l&rsquo;imagini di tante umilitadi,</p>\n<p>e per lo fabbro loro a veder care,</p></div>\n\n<div class="stanza"><p>&laquo;Ecco di qua, ma fanno i passi radi&raquo;,</p>\n<p>mormorava il poeta, &laquo;molte genti:</p>\n<p>questi ne &rsquo;nv&iuml;eranno a li alti gradi&raquo;.</p></div>\n\n<div class="stanza"><p>Li occhi miei, ch&rsquo;a mirare eran contenti</p>\n<p>per veder novitadi ond&rsquo; e&rsquo; son vaghi,</p>\n<p>volgendosi ver&rsquo; lui non furon lenti.</p></div>\n\n<div class="stanza"><p>Non vo&rsquo; per&ograve;, lettor, che tu ti smaghi</p>\n<p>di buon proponimento per udire</p>\n<p>come Dio vuol che &rsquo;l debito si paghi.</p></div>\n\n<div class="stanza"><p>Non attender la forma del mart&igrave;re:</p>\n<p>pensa la succession; pensa ch&rsquo;al peggio</p>\n<p>oltre la gran sentenza non pu&ograve; ire.</p></div>\n\n<div class="stanza"><p>Io cominciai: &laquo;Maestro, quel ch&rsquo;io veggio</p>\n<p>muovere a noi, non mi sembian persone,</p>\n<p>e non so che, s&igrave; nel veder vaneggio&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;La grave condizione</p>\n<p>di lor tormento a terra li rannicchia,</p>\n<p>s&igrave; che &rsquo; miei occhi pria n&rsquo;ebber tencione.</p></div>\n\n<div class="stanza"><p>Ma guarda fiso l&agrave;, e disviticchia</p>\n<p>col viso quel che vien sotto a quei sassi:</p>\n<p>gi&agrave; scorger puoi come ciascun si picchia&raquo;.</p></div>\n\n<div class="stanza"><p>O superbi cristian, miseri lassi,</p>\n<p>che, de la vista de la mente infermi,</p>\n<p>fidanza avete ne&rsquo; retrosi passi,</p></div>\n\n<div class="stanza"><p>non v&rsquo;accorgete voi che noi siam vermi</p>\n<p>nati a formar l&rsquo;angelica farfalla,</p>\n<p>che vola a la giustizia sanza schermi?</p></div>\n\n<div class="stanza"><p>Di che l&rsquo;animo vostro in alto galla,</p>\n<p>poi siete quasi antomata in difetto,</p>\n<p>s&igrave; come vermo in cui formazion falla?</p></div>\n\n<div class="stanza"><p>Come per sostentar solaio o tetto,</p>\n<p>per mensola talvolta una figura</p>\n<p>si vede giugner le ginocchia al petto,</p></div>\n\n<div class="stanza"><p>la qual fa del non ver vera rancura</p>\n<p>nascere &rsquo;n chi la vede; cos&igrave; fatti</p>\n<p>vid&rsquo; io color, quando puosi ben cura.</p></div>\n\n<div class="stanza"><p>Vero &egrave; che pi&ugrave; e meno eran contratti</p>\n<p>secondo ch&rsquo;avien pi&ugrave; e meno a dosso;</p>\n<p>e qual pi&ugrave; paz&iuml;enza avea ne li atti,</p></div>\n\n<div class="stanza"><p>piangendo parea dicer: &lsquo;Pi&ugrave; non posso&rsquo;.</p></div>','<p class="cantohead">Canto XI</p>\n\n<div class="stanza"><p>&laquo;O Padre nostro, che ne&rsquo; cieli stai,</p>\n<p>non circunscritto, ma per pi&ugrave; amore</p>\n<p>ch&rsquo;ai primi effetti di l&agrave; s&ugrave; tu hai,</p></div>\n\n<div class="stanza"><p>laudato sia &rsquo;l tuo nome e &rsquo;l tuo valore</p>\n<p>da ogne creatura, com&rsquo; &egrave; degno</p>\n<p>di render grazie al tuo dolce vapore.</p></div>\n\n<div class="stanza"><p>Vegna ver&rsquo; noi la pace del tuo regno,</p>\n<p>ch&eacute; noi ad essa non potem da noi,</p>\n<p>s&rsquo;ella non vien, con tutto nostro ingegno.</p></div>\n\n<div class="stanza"><p>Come del suo voler li angeli tuoi</p>\n<p>fan sacrificio a te, cantando osanna,</p>\n<p>cos&igrave; facciano li uomini de&rsquo; suoi.</p></div>\n\n<div class="stanza"><p>D&agrave; oggi a noi la cotidiana manna,</p>\n<p>sanza la qual per questo aspro diserto</p>\n<p>a retro va chi pi&ugrave; di gir s&rsquo;affanna.</p></div>\n\n<div class="stanza"><p>E come noi lo mal ch&rsquo;avem sofferto</p>\n<p>perdoniamo a ciascuno, e tu perdona</p>\n<p>benigno, e non guardar lo nostro merto.</p></div>\n\n<div class="stanza"><p>Nostra virt&ugrave; che di legger s&rsquo;adona,</p>\n<p>non spermentar con l&rsquo;antico avversaro,</p>\n<p>ma libera da lui che s&igrave; la sprona.</p></div>\n\n<div class="stanza"><p>Quest&rsquo; ultima preghiera, segnor caro,</p>\n<p>gi&agrave; non si fa per noi, ch&eacute; non bisogna,</p>\n<p>ma per color che dietro a noi restaro&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; a s&eacute; e noi buona ramogna</p>\n<p>quell&rsquo; ombre orando, andavan sotto &rsquo;l pondo,</p>\n<p>simile a quel che talvolta si sogna,</p></div>\n\n<div class="stanza"><p>disparmente angosciate tutte a tondo</p>\n<p>e lasse su per la prima cornice,</p>\n<p>purgando la caligine del mondo.</p></div>\n\n<div class="stanza"><p>Se di l&agrave; sempre ben per noi si dice,</p>\n<p>di qua che dire e far per lor si puote</p>\n<p>da quei c&rsquo;hanno al voler buona radice?</p></div>\n\n<div class="stanza"><p>Ben si de&rsquo; loro atar lavar le note</p>\n<p>che portar quinci, s&igrave; che, mondi e lievi,</p>\n<p>possano uscire a le stellate ruote.</p></div>\n\n<div class="stanza"><p>&laquo;Deh, se giustizia e piet&agrave; vi disgrievi</p>\n<p>tosto, s&igrave; che possiate muover l&rsquo;ala,</p>\n<p>che secondo il disio vostro vi lievi,</p></div>\n\n<div class="stanza"><p>mostrate da qual mano inver&rsquo; la scala</p>\n<p>si va pi&ugrave; corto; e se c&rsquo;&egrave; pi&ugrave; d&rsquo;un varco,</p>\n<p>quel ne &rsquo;nsegnate che men erto cala;</p></div>\n\n<div class="stanza"><p>ch&eacute; questi che vien meco, per lo &rsquo;ncarco</p>\n<p>de la carne d&rsquo;Adamo onde si veste,</p>\n<p>al montar s&ugrave;, contra sua voglia, &egrave; parco&raquo;.</p></div>\n\n<div class="stanza"><p>Le lor parole, che rendero a queste</p>\n<p>che dette avea colui cu&rsquo; io seguiva,</p>\n<p>non fur da cui venisser manifeste;</p></div>\n\n<div class="stanza"><p>ma fu detto: &laquo;A man destra per la riva</p>\n<p>con noi venite, e troverete il passo</p>\n<p>possibile a salir persona viva.</p></div>\n\n<div class="stanza"><p>E s&rsquo;io non fossi impedito dal sasso</p>\n<p>che la cervice mia superba doma,</p>\n<p>onde portar convienmi il viso basso,</p></div>\n\n<div class="stanza"><p>cotesti, ch&rsquo;ancor vive e non si noma,</p>\n<p>guardere&rsquo; io, per veder s&rsquo;i&rsquo; &rsquo;l conosco,</p>\n<p>e per farlo pietoso a questa soma.</p></div>\n\n<div class="stanza"><p>Io fui latino e nato d&rsquo;un gran Tosco:</p>\n<p>Guiglielmo Aldobrandesco fu mio padre;</p>\n<p>non so se &rsquo;l nome suo gi&agrave; mai fu vosco.</p></div>\n\n<div class="stanza"><p>L&rsquo;antico sangue e l&rsquo;opere leggiadre</p>\n<p>d&rsquo;i miei maggior mi fer s&igrave; arrogante,</p>\n<p>che, non pensando a la comune madre,</p></div>\n\n<div class="stanza"><p>ogn&rsquo; uomo ebbi in despetto tanto avante,</p>\n<p>ch&rsquo;io ne mori&rsquo;, come i Sanesi sanno,</p>\n<p>e sallo in Campagnatico ogne fante.</p></div>\n\n<div class="stanza"><p>Io sono Omberto; e non pur a me danno</p>\n<p>superbia fa, ch&eacute; tutti miei consorti</p>\n<p>ha ella tratti seco nel malanno.</p></div>\n\n<div class="stanza"><p>E qui convien ch&rsquo;io questo peso porti</p>\n<p>per lei, tanto che a Dio si sodisfaccia,</p>\n<p>poi ch&rsquo;io nol fe&rsquo; tra &rsquo; vivi, qui tra &rsquo; morti&raquo;.</p></div>\n\n<div class="stanza"><p>Ascoltando chinai in gi&ugrave; la faccia;</p>\n<p>e un di lor, non questi che parlava,</p>\n<p>si torse sotto il peso che li &rsquo;mpaccia,</p></div>\n\n<div class="stanza"><p>e videmi e conobbemi e chiamava,</p>\n<p>tenendo li occhi con fatica fisi</p>\n<p>a me che tutto chin con loro andava.</p></div>\n\n<div class="stanza"><p>&laquo;Oh!&raquo;, diss&rsquo; io lui, &laquo;non se&rsquo; tu Oderisi,</p>\n<p>l&rsquo;onor d&rsquo;Agobbio e l&rsquo;onor di quell&rsquo; arte</p>\n<p>ch&rsquo;alluminar chiamata &egrave; in Parisi?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Frate&raquo;, diss&rsquo; elli, &laquo;pi&ugrave; ridon le carte</p>\n<p>che pennelleggia Franco Bolognese;</p>\n<p>l&rsquo;onore &egrave; tutto or suo, e mio in parte.</p></div>\n\n<div class="stanza"><p>Ben non sare&rsquo; io stato s&igrave; cortese</p>\n<p>mentre ch&rsquo;io vissi, per lo gran disio</p>\n<p>de l&rsquo;eccellenza ove mio core intese.</p></div>\n\n<div class="stanza"><p>Di tal superbia qui si paga il fio;</p>\n<p>e ancor non sarei qui, se non fosse</p>\n<p>che, possendo peccar, mi volsi a Dio.</p></div>\n\n<div class="stanza"><p>Oh vana gloria de l&rsquo;umane posse!</p>\n<p>com&rsquo; poco verde in su la cima dura,</p>\n<p>se non &egrave; giunta da l&rsquo;etati grosse!</p></div>\n\n<div class="stanza"><p>Credette Cimabue ne la pittura</p>\n<p>tener lo campo, e ora ha Giotto il grido,</p>\n<p>s&igrave; che la fama di colui &egrave; scura.</p></div>\n\n<div class="stanza"><p>Cos&igrave; ha tolto l&rsquo;uno a l&rsquo;altro Guido</p>\n<p>la gloria de la lingua; e forse &egrave; nato</p>\n<p>chi l&rsquo;uno e l&rsquo;altro caccer&agrave; del nido.</p></div>\n\n<div class="stanza"><p>Non &egrave; il mondan romore altro ch&rsquo;un fiato</p>\n<p>di vento, ch&rsquo;or vien quinci e or vien quindi,</p>\n<p>e muta nome perch&eacute; muta lato.</p></div>\n\n<div class="stanza"><p>Che voce avrai tu pi&ugrave;, se vecchia scindi</p>\n<p>da te la carne, che se fossi morto</p>\n<p>anzi che tu lasciassi il &lsquo;pappo&rsquo; e &rsquo;l &lsquo;dindi&rsquo;,</p></div>\n\n<div class="stanza"><p>pria che passin mill&rsquo; anni? ch&rsquo;&egrave; pi&ugrave; corto</p>\n<p>spazio a l&rsquo;etterno, ch&rsquo;un muover di ciglia</p>\n<p>al cerchio che pi&ugrave; tardi in cielo &egrave; torto.</p></div>\n\n<div class="stanza"><p>Colui che del cammin s&igrave; poco piglia</p>\n<p>dinanzi a me, Toscana son&ograve; tutta;</p>\n<p>e ora a pena in Siena sen pispiglia,</p></div>\n\n<div class="stanza"><p>ond&rsquo; era sire quando fu distrutta</p>\n<p>la rabbia fiorentina, che superba</p>\n<p>fu a quel tempo s&igrave; com&rsquo; ora &egrave; putta.</p></div>\n\n<div class="stanza"><p>La vostra nominanza &egrave; color d&rsquo;erba,</p>\n<p>che viene e va, e quei la discolora</p>\n<p>per cui ella esce de la terra acerba&raquo;.</p></div>\n\n<div class="stanza"><p>E io a lui: &laquo;Tuo vero dir m&rsquo;incora</p>\n<p>bona umilt&agrave;, e gran tumor m&rsquo;appiani;</p>\n<p>ma chi &egrave; quei di cui tu parlavi ora?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Quelli &egrave;&raquo;, rispuose, &laquo;Provenzan Salvani;</p>\n<p>ed &egrave; qui perch&eacute; fu presunt&uuml;oso</p>\n<p>a recar Siena tutta a le sue mani.</p></div>\n\n<div class="stanza"><p>Ito &egrave; cos&igrave; e va, sanza riposo,</p>\n<p>poi che mor&igrave;; cotal moneta rende</p>\n<p>a sodisfar chi &egrave; di l&agrave; troppo oso&raquo;.</p></div>\n\n<div class="stanza"><p>E io: &laquo;Se quello spirito ch&rsquo;attende,</p>\n<p>pria che si penta, l&rsquo;orlo de la vita,</p>\n<p>qua gi&ugrave; dimora e qua s&ugrave; non ascende,</p></div>\n\n<div class="stanza"><p>se buona oraz&iuml;on lui non aita,</p>\n<p>prima che passi tempo quanto visse,</p>\n<p>come fu la venuta lui largita?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Quando vivea pi&ugrave; glor&iuml;oso&raquo;, disse,</p>\n<p>&laquo;liberamente nel Campo di Siena,</p>\n<p>ogne vergogna diposta, s&rsquo;affisse;</p></div>\n\n<div class="stanza"><p>e l&igrave;, per trar l&rsquo;amico suo di pena,</p>\n<p>ch&rsquo;e&rsquo; sostenea ne la prigion di Carlo,</p>\n<p>si condusse a tremar per ogne vena.</p></div>\n\n<div class="stanza"><p>Pi&ugrave; non dir&ograve;, e scuro so che parlo;</p>\n<p>ma poco tempo andr&agrave;, che &rsquo; tuoi vicini</p>\n<p>faranno s&igrave; che tu potrai chiosarlo.</p></div>\n\n<div class="stanza"><p>Quest&rsquo; opera li tolse quei confini&raquo;.</p></div>','<p class="cantohead">Canto XII</p>\n\n<div class="stanza"><p>Di pari, come buoi che vanno a giogo,</p>\n<p>m&rsquo;andava io con quell&rsquo; anima carca,</p>\n<p>fin che &rsquo;l sofferse il dolce pedagogo.</p></div>\n\n<div class="stanza"><p>Ma quando disse: &laquo;Lascia lui e varca;</p>\n<p>ch&eacute; qui &egrave; buono con l&rsquo;ali e coi remi,</p>\n<p>quantunque pu&ograve;, ciascun pinger sua barca&raquo;;</p></div>\n\n<div class="stanza"><p>dritto s&igrave; come andar vuolsi rife&rsquo;mi</p>\n<p>con la persona, avvegna che i pensieri</p>\n<p>mi rimanessero e chinati e scemi.</p></div>\n\n<div class="stanza"><p>Io m&rsquo;era mosso, e seguia volontieri</p>\n<p>del mio maestro i passi, e amendue</p>\n<p>gi&agrave; mostravam com&rsquo; eravam leggeri;</p></div>\n\n<div class="stanza"><p>ed el mi disse: &laquo;Volgi li occhi in gi&ugrave;e:</p>\n<p>buon ti sar&agrave;, per tranquillar la via,</p>\n<p>veder lo letto de le piante tue&raquo;.</p></div>\n\n<div class="stanza"><p>Come, perch&eacute; di lor memoria sia,</p>\n<p>sovra i sepolti le tombe terragne</p>\n<p>portan segnato quel ch&rsquo;elli eran pria,</p></div>\n\n<div class="stanza"><p>onde l&igrave; molte volte si ripiagne</p>\n<p>per la puntura de la rimembranza,</p>\n<p>che solo a&rsquo; p&iuml;i d&agrave; de le calcagne;</p></div>\n\n<div class="stanza"><p>s&igrave; vid&rsquo; io l&igrave;, ma di miglior sembianza</p>\n<p>secondo l&rsquo;artificio, figurato</p>\n<p>quanto per via di fuor del monte avanza.</p></div>\n\n<div class="stanza"><p>Vedea colui che fu nobil creato</p>\n<p>pi&ugrave; ch&rsquo;altra creatura, gi&ugrave; dal cielo</p>\n<p>folgoreggiando scender, da l&rsquo;un lato.</p></div>\n\n<div class="stanza"><p>Ved&euml;a Br&iuml;areo fitto dal telo</p>\n<p>celest&iuml;al giacer, da l&rsquo;altra parte,</p>\n<p>grave a la terra per lo mortal gelo.</p></div>\n\n<div class="stanza"><p>Vedea Timbreo, vedea Pallade e Marte,</p>\n<p>armati ancora, intorno al padre loro,</p>\n<p>mirar le membra d&rsquo;i Giganti sparte.</p></div>\n\n<div class="stanza"><p>Vedea Nembr&ograve;t a pi&egrave; del gran lavoro</p>\n<p>quasi smarrito, e riguardar le genti</p>\n<p>che &rsquo;n Senna&agrave;r con lui superbi fuoro.</p></div>\n\n<div class="stanza"><p>O N&iuml;ob&egrave;, con che occhi dolenti</p>\n<p>vedea io te segnata in su la strada,</p>\n<p>tra sette e sette tuoi figliuoli spenti!</p></div>\n\n<div class="stanza"><p>O Sa&ugrave;l, come in su la propria spada</p>\n<p>quivi parevi morto in Gelbo&egrave;,</p>\n<p>che poi non sent&igrave; pioggia n&eacute; rugiada!</p></div>\n\n<div class="stanza"><p>O folle Aragne, s&igrave; vedea io te</p>\n<p>gi&agrave; mezza ragna, trista in su li stracci</p>\n<p>de l&rsquo;opera che mal per te si f&eacute;.</p></div>\n\n<div class="stanza"><p>O Robo&agrave;m, gi&agrave; non par che minacci</p>\n<p>quivi &rsquo;l tuo segno; ma pien di spavento</p>\n<p>nel porta un carro, sanza ch&rsquo;altri il cacci.</p></div>\n\n<div class="stanza"><p>Mostrava ancor lo duro pavimento</p>\n<p>come Almeon a sua madre f&eacute; caro</p>\n<p>parer lo sventurato addornamento.</p></div>\n\n<div class="stanza"><p>Mostrava come i figli si gittaro</p>\n<p>sovra Sennacher&igrave;b dentro dal tempio,</p>\n<p>e come, morto lui, quivi il lasciaro.</p></div>\n\n<div class="stanza"><p>Mostrava la ruina e &rsquo;l crudo scempio</p>\n<p>che f&eacute; Tamiri, quando disse a Ciro:</p>\n<p>&laquo;Sangue sitisti, e io di sangue t&rsquo;empio&raquo;.</p></div>\n\n<div class="stanza"><p>Mostrava come in rotta si fuggiro</p>\n<p>li Assiri, poi che fu morto Oloferne,</p>\n<p>e anche le reliquie del martiro.</p></div>\n\n<div class="stanza"><p>Vedeva Troia in cenere e in caverne;</p>\n<p>o Il&iuml;&oacute;n, come te basso e vile</p>\n<p>mostrava il segno che l&igrave; si discerne!</p></div>\n\n<div class="stanza"><p>Qual di pennel fu maestro o di stile</p>\n<p>che ritraesse l&rsquo;ombre e &rsquo; tratti ch&rsquo;ivi</p>\n<p>mirar farieno uno ingegno sottile?</p></div>\n\n<div class="stanza"><p>Morti li morti e i vivi parean vivi:</p>\n<p>non vide mei di me chi vide il vero,</p>\n<p>quant&rsquo; io calcai, fin che chinato givi.</p></div>\n\n<div class="stanza"><p>Or superbite, e via col viso altero,</p>\n<p>figliuoli d&rsquo;Eva, e non chinate il volto</p>\n<p>s&igrave; che veggiate il vostro mal sentero!</p></div>\n\n<div class="stanza"><p>Pi&ugrave; era gi&agrave; per noi del monte v&ograve;lto</p>\n<p>e del cammin del sole assai pi&ugrave; speso</p>\n<p>che non stimava l&rsquo;animo non sciolto,</p></div>\n\n<div class="stanza"><p>quando colui che sempre innanzi atteso</p>\n<p>andava, cominci&ograve;: &laquo;Drizza la testa;</p>\n<p>non &egrave; pi&ugrave; tempo di gir s&igrave; sospeso.</p></div>\n\n<div class="stanza"><p>Vedi col&agrave; un angel che s&rsquo;appresta</p>\n<p>per venir verso noi; vedi che torna</p>\n<p>dal servigio del d&igrave; l&rsquo;ancella sesta.</p></div>\n\n<div class="stanza"><p>Di reverenza il viso e li atti addorna,</p>\n<p>s&igrave; che i diletti lo &rsquo;nv&iuml;arci in suso;</p>\n<p>pensa che questo d&igrave; mai non raggiorna!&raquo;.</p></div>\n\n<div class="stanza"><p>Io era ben del suo ammonir uso</p>\n<p>pur di non perder tempo, s&igrave; che &rsquo;n quella</p>\n<p>materia non potea parlarmi chiuso.</p></div>\n\n<div class="stanza"><p>A noi ven&igrave;a la creatura bella,</p>\n<p>biancovestito e ne la faccia quale</p>\n<p>par tremolando mattutina stella.</p></div>\n\n<div class="stanza"><p>Le braccia aperse, e indi aperse l&rsquo;ale;</p>\n<p>disse: &laquo;Venite: qui son presso i gradi,</p>\n<p>e agevolemente omai si sale.</p></div>\n\n<div class="stanza"><p>A questo invito vegnon molto radi:</p>\n<p>o gente umana, per volar s&ugrave; nata,</p>\n<p>perch&eacute; a poco vento cos&igrave; cadi?&raquo;.</p></div>\n\n<div class="stanza"><p>Menocci ove la roccia era tagliata;</p>\n<p>quivi mi batt&eacute; l&rsquo;ali per la fronte;</p>\n<p>poi mi promise sicura l&rsquo;andata.</p></div>\n\n<div class="stanza"><p>Come a man destra, per salire al monte</p>\n<p>dove siede la chiesa che soggioga</p>\n<p>la ben guidata sopra Rubaconte,</p></div>\n\n<div class="stanza"><p>si rompe del montar l&rsquo;ardita foga</p>\n<p>per le scalee che si fero ad etade</p>\n<p>ch&rsquo;era sicuro il quaderno e la doga;</p></div>\n\n<div class="stanza"><p>cos&igrave; s&rsquo;allenta la ripa che cade</p>\n<p>quivi ben ratta da l&rsquo;altro girone;</p>\n<p>ma quinci e quindi l&rsquo;alta pietra rade.</p></div>\n\n<div class="stanza"><p>Noi volgendo ivi le nostre persone,</p>\n<p>&lsquo;Beati pauperes spiritu!&rsquo; voci</p>\n<p>cantaron s&igrave;, che nol diria sermone.</p></div>\n\n<div class="stanza"><p>Ahi quanto son diverse quelle foci</p>\n<p>da l&rsquo;infernali! ch&eacute; quivi per canti</p>\n<p>s&rsquo;entra, e l&agrave; gi&ugrave; per lamenti feroci.</p></div>\n\n<div class="stanza"><p>Gi&agrave; montavam su per li scaglion santi,</p>\n<p>ed esser mi parea troppo pi&ugrave; lieve</p>\n<p>che per lo pian non mi parea davanti.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; io: &laquo;Maestro, d&igrave;, qual cosa greve</p>\n<p>levata s&rsquo;&egrave; da me, che nulla quasi</p>\n<p>per me fatica, andando, si riceve?&raquo;.</p></div>\n\n<div class="stanza"><p>Rispuose: &laquo;Quando i P che son rimasi</p>\n<p>ancor nel volto tuo presso che stinti,</p>\n<p>saranno, com&rsquo; &egrave; l&rsquo;un, del tutto rasi,</p></div>\n\n<div class="stanza"><p>fier li tuoi pi&egrave; dal buon voler s&igrave; vinti,</p>\n<p>che non pur non fatica sentiranno,</p>\n<p>ma fia diletto loro esser s&ugrave; pinti&raquo;.</p></div>\n\n<div class="stanza"><p>Allor fec&rsquo; io come color che vanno</p>\n<p>con cosa in capo non da lor saputa,</p>\n<p>se non che &rsquo; cenni altrui sospecciar fanno;</p></div>\n\n<div class="stanza"><p>per che la mano ad accertar s&rsquo;aiuta,</p>\n<p>e cerca e truova e quello officio adempie</p>\n<p>che non si pu&ograve; fornir per la veduta;</p></div>\n\n<div class="stanza"><p>e con le dita de la destra scempie</p>\n<p>trovai pur sei le lettere che &rsquo;ncise</p>\n<p>quel da le chiavi a me sovra le tempie:</p></div>\n\n<div class="stanza"><p>a che guardando, il mio duca sorrise.</p></div>','<p class="cantohead">Canto XIII</p>\n\n<div class="stanza"><p>Noi eravamo al sommo de la scala,</p>\n<p>dove secondamente si risega</p>\n<p>lo monte che salendo altrui dismala.</p></div>\n\n<div class="stanza"><p>Ivi cos&igrave; una cornice lega</p>\n<p>dintorno il poggio, come la primaia;</p>\n<p>se non che l&rsquo;arco suo pi&ugrave; tosto piega.</p></div>\n\n<div class="stanza"><p>Ombra non l&igrave; &egrave; n&eacute; segno che si paia:</p>\n<p>parsi la ripa e parsi la via schietta</p>\n<p>col livido color de la petraia.</p></div>\n\n<div class="stanza"><p>&laquo;Se qui per dimandar gente s&rsquo;aspetta&raquo;,</p>\n<p>ragionava il poeta, &laquo;io temo forse</p>\n<p>che troppo avr&agrave; d&rsquo;indugio nostra eletta&raquo;.</p></div>\n\n<div class="stanza"><p>Poi fisamente al sole li occhi porse;</p>\n<p>fece del destro lato a muover centro,</p>\n<p>e la sinistra parte di s&eacute; torse.</p></div>\n\n<div class="stanza"><p>&laquo;O dolce lume a cui fidanza i&rsquo; entro</p>\n<p>per lo novo cammin, tu ne conduci&raquo;,</p>\n<p>dicea, &laquo;come condur si vuol quinc&rsquo; entro.</p></div>\n\n<div class="stanza"><p>Tu scaldi il mondo, tu sovr&rsquo; esso luci;</p>\n<p>s&rsquo;altra ragione in contrario non ponta,</p>\n<p>esser dien sempre li tuoi raggi duci&raquo;.</p></div>\n\n<div class="stanza"><p>Quanto di qua per un migliaio si conta,</p>\n<p>tanto di l&agrave; eravam noi gi&agrave; iti,</p>\n<p>con poco tempo, per la voglia pronta;</p></div>\n\n<div class="stanza"><p>e verso noi volar furon sentiti,</p>\n<p>non per&ograve; visti, spiriti parlando</p>\n<p>a la mensa d&rsquo;amor cortesi inviti.</p></div>\n\n<div class="stanza"><p>La prima voce che pass&ograve; volando</p>\n<p>&lsquo;Vinum non habent&rsquo; altamente disse,</p>\n<p>e dietro a noi l&rsquo;and&ograve; re&iuml;terando.</p></div>\n\n<div class="stanza"><p>E prima che del tutto non si udisse</p>\n<p>per allungarsi, un&rsquo;altra &lsquo;I&rsquo; sono Oreste&rsquo;</p>\n<p>pass&ograve; gridando, e anco non s&rsquo;affisse.</p></div>\n\n<div class="stanza"><p>&laquo;Oh!&raquo;, diss&rsquo; io, &laquo;padre, che voci son queste?&raquo;.</p>\n<p>E com&rsquo; io domandai, ecco la terza</p>\n<p>dicendo: &lsquo;Amate da cui male aveste&rsquo;.</p></div>\n\n<div class="stanza"><p>E &rsquo;l buon maestro: &laquo;Questo cinghio sferza</p>\n<p>la colpa de la invidia, e per&ograve; sono</p>\n<p>tratte d&rsquo;amor le corde de la ferza.</p></div>\n\n<div class="stanza"><p>Lo fren vuol esser del contrario suono;</p>\n<p>credo che l&rsquo;udirai, per mio avviso,</p>\n<p>prima che giunghi al passo del perdono.</p></div>\n\n<div class="stanza"><p>Ma ficca li occhi per l&rsquo;aere ben fiso,</p>\n<p>e vedrai gente innanzi a noi sedersi,</p>\n<p>e ciascun &egrave; lungo la grotta assiso&raquo;.</p></div>\n\n<div class="stanza"><p>Allora pi&ugrave; che prima li occhi apersi;</p>\n<p>guarda&rsquo;mi innanzi, e vidi ombre con manti</p>\n<p>al color de la pietra non diversi.</p></div>\n\n<div class="stanza"><p>E poi che fummo un poco pi&ugrave; avanti,</p>\n<p>udia gridar: &lsquo;Maria, &ograve;ra per noi&rsquo;:</p>\n<p>gridar &lsquo;Michele&rsquo; e &lsquo;Pietro&rsquo; e &lsquo;Tutti santi&rsquo;.</p></div>\n\n<div class="stanza"><p>Non credo che per terra vada ancoi</p>\n<p>omo s&igrave; duro, che non fosse punto</p>\n<p>per compassion di quel ch&rsquo;i&rsquo; vidi poi;</p></div>\n\n<div class="stanza"><p>ch&eacute;, quando fui s&igrave; presso di lor giunto,</p>\n<p>che li atti loro a me venivan certi,</p>\n<p>per li occhi fui di grave dolor munto.</p></div>\n\n<div class="stanza"><p>Di vil ciliccio mi parean coperti,</p>\n<p>e l&rsquo;un sofferia l&rsquo;altro con la spalla,</p>\n<p>e tutti da la ripa eran sofferti.</p></div>\n\n<div class="stanza"><p>Cos&igrave; li ciechi a cui la roba falla,</p>\n<p>stanno a&rsquo; perdoni a chieder lor bisogna,</p>\n<p>e l&rsquo;uno il capo sopra l&rsquo;altro avvalla,</p></div>\n\n<div class="stanza"><p>perch&eacute; &rsquo;n altrui piet&agrave; tosto si pogna,</p>\n<p>non pur per lo sonar de le parole,</p>\n<p>ma per la vista che non meno agogna.</p></div>\n\n<div class="stanza"><p>E come a li orbi non approda il sole,</p>\n<p>cos&igrave; a l&rsquo;ombre quivi, ond&rsquo; io parlo ora,</p>\n<p>luce del ciel di s&eacute; largir non vole;</p></div>\n\n<div class="stanza"><p>ch&eacute; a tutti un fil di ferro i cigli f&oacute;ra</p>\n<p>e cusce s&igrave;, come a sparvier selvaggio</p>\n<p>si fa per&ograve; che queto non dimora.</p></div>\n\n<div class="stanza"><p>A me pareva, andando, fare oltraggio,</p>\n<p>veggendo altrui, non essendo veduto:</p>\n<p>per ch&rsquo;io mi volsi al mio consiglio saggio.</p></div>\n\n<div class="stanza"><p>Ben sapev&rsquo; ei che volea dir lo muto;</p>\n<p>e per&ograve; non attese mia dimanda,</p>\n<p>ma disse: &laquo;Parla, e sie breve e arguto&raquo;.</p></div>\n\n<div class="stanza"><p>Virgilio mi ven&igrave;a da quella banda</p>\n<p>de la cornice onde cader si puote,</p>\n<p>perch&eacute; da nulla sponda s&rsquo;inghirlanda;</p></div>\n\n<div class="stanza"><p>da l&rsquo;altra parte m&rsquo;eran le divote</p>\n<p>ombre, che per l&rsquo;orribile costura</p>\n<p>premevan s&igrave;, che bagnavan le gote.</p></div>\n\n<div class="stanza"><p>Volsimi a loro e: &laquo;O gente sicura&raquo;,</p>\n<p>incominciai, &laquo;di veder l&rsquo;alto lume</p>\n<p>che &rsquo;l disio vostro solo ha in sua cura,</p></div>\n\n<div class="stanza"><p>se tosto grazia resolva le schiume</p>\n<p>di vostra cosc&iuml;enza s&igrave; che chiaro</p>\n<p>per essa scenda de la mente il fiume,</p></div>\n\n<div class="stanza"><p>ditemi, ch&eacute; mi fia grazioso e caro,</p>\n<p>s&rsquo;anima &egrave; qui tra voi che sia latina;</p>\n<p>e forse lei sar&agrave; buon s&rsquo;i&rsquo; l&rsquo;apparo&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O frate mio, ciascuna &egrave; cittadina</p>\n<p>d&rsquo;una vera citt&agrave;; ma tu vuo&rsquo; dire</p>\n<p>che vivesse in Italia peregrina&raquo;.</p></div>\n\n<div class="stanza"><p>Questo mi parve per risposta udire</p>\n<p>pi&ugrave; innanzi alquanto che l&agrave; dov&rsquo; io stava,</p>\n<p>ond&rsquo; io mi feci ancor pi&ugrave; l&agrave; sentire.</p></div>\n\n<div class="stanza"><p>Tra l&rsquo;altre vidi un&rsquo;ombra ch&rsquo;aspettava</p>\n<p>in vista; e se volesse alcun dir &lsquo;Come?&rsquo;,</p>\n<p>lo mento a guisa d&rsquo;orbo in s&ugrave; levava.</p></div>\n\n<div class="stanza"><p>&laquo;Spirto&raquo;, diss&rsquo; io, &laquo;che per salir ti dome,</p>\n<p>se tu se&rsquo; quelli che mi rispondesti,</p>\n<p>fammiti conto o per luogo o per nome&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Io fui sanese&raquo;, rispuose, &laquo;e con questi</p>\n<p>altri rimendo qui la vita ria,</p>\n<p>lagrimando a colui che s&eacute; ne presti.</p></div>\n\n<div class="stanza"><p>Savia non fui, avvegna che Sap&igrave;a</p>\n<p>fossi chiamata, e fui de li altrui danni</p>\n<p>pi&ugrave; lieta assai che di ventura mia.</p></div>\n\n<div class="stanza"><p>E perch&eacute; tu non creda ch&rsquo;io t&rsquo;inganni,</p>\n<p>odi s&rsquo;i&rsquo; fui, com&rsquo; io ti dico, folle,</p>\n<p>gi&agrave; discendendo l&rsquo;arco d&rsquo;i miei anni.</p></div>\n\n<div class="stanza"><p>Eran li cittadin miei presso a Colle</p>\n<p>in campo giunti co&rsquo; loro avversari,</p>\n<p>e io pregava Iddio di quel ch&rsquo;e&rsquo; volle.</p></div>\n\n<div class="stanza"><p>Rotti fuor quivi e v&ograve;lti ne li amari</p>\n<p>passi di fuga; e veggendo la caccia,</p>\n<p>letizia presi a tutte altre dispari,</p></div>\n\n<div class="stanza"><p>tanto ch&rsquo;io volsi in s&ugrave; l&rsquo;ardita faccia,</p>\n<p>gridando a Dio: &ldquo;Omai pi&ugrave; non ti temo!&rdquo;,</p>\n<p>come f&eacute; &rsquo;l merlo per poca bonaccia.</p></div>\n\n<div class="stanza"><p>Pace volli con Dio in su lo stremo</p>\n<p>de la mia vita; e ancor non sarebbe</p>\n<p>lo mio dover per penitenza scemo,</p></div>\n\n<div class="stanza"><p>se ci&ograve; non fosse, ch&rsquo;a memoria m&rsquo;ebbe</p>\n<p>Pier Pettinaio in sue sante orazioni,</p>\n<p>a cui di me per caritate increbbe.</p></div>\n\n<div class="stanza"><p>Ma tu chi se&rsquo;, che nostre condizioni</p>\n<p>vai dimandando, e porti li occhi sciolti,</p>\n<p>s&igrave; com&rsquo; io credo, e spirando ragioni?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Li occhi&raquo;, diss&rsquo; io, &laquo;mi fieno ancor qui tolti,</p>\n<p>ma picciol tempo, ch&eacute; poca &egrave; l&rsquo;offesa</p>\n<p>fatta per esser con invidia v&ograve;lti.</p></div>\n\n<div class="stanza"><p>Troppa &egrave; pi&ugrave; la paura ond&rsquo; &egrave; sospesa</p>\n<p>l&rsquo;anima mia del tormento di sotto,</p>\n<p>che gi&agrave; lo &rsquo;ncarco di l&agrave; gi&ugrave; mi pesa&raquo;.</p></div>\n\n<div class="stanza"><p>Ed ella a me: &laquo;Chi t&rsquo;ha dunque condotto</p>\n<p>qua s&ugrave; tra noi, se gi&ugrave; ritornar credi?&raquo;.</p>\n<p>E io: &laquo;Costui ch&rsquo;&egrave; meco e non fa motto.</p></div>\n\n<div class="stanza"><p>E vivo sono; e per&ograve; mi richiedi,</p>\n<p>spirito eletto, se tu vuo&rsquo; ch&rsquo;i&rsquo; mova</p>\n<p>di l&agrave; per te ancor li mortai piedi&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Oh, questa &egrave; a udir s&igrave; cosa nuova&raquo;,</p>\n<p>rispuose, &laquo;che gran segno &egrave; che Dio t&rsquo;ami;</p>\n<p>per&ograve; col priego tuo talor mi giova.</p></div>\n\n<div class="stanza"><p>E cheggioti, per quel che tu pi&ugrave; brami,</p>\n<p>se mai calchi la terra di Toscana,</p>\n<p>che a&rsquo; miei propinqui tu ben mi rinfami.</p></div>\n\n<div class="stanza"><p>Tu li vedrai tra quella gente vana</p>\n<p>che spera in Talamone, e perderagli</p>\n<p>pi&ugrave; di speranza ch&rsquo;a trovar la Diana;</p></div>\n\n<div class="stanza"><p>ma pi&ugrave; vi perderanno li ammiragli&raquo;.</p></div>','<p class="cantohead">Canto XIV</p>\n\n<div class="stanza"><p>&laquo;Chi &egrave; costui che &rsquo;l nostro monte cerchia</p>\n<p>prima che morte li abbia dato il volo,</p>\n<p>e apre li occhi a sua voglia e coverchia?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Non so chi sia, ma so ch&rsquo;e&rsquo; non &egrave; solo;</p>\n<p>domandal tu che pi&ugrave; li t&rsquo;avvicini,</p>\n<p>e dolcemente, s&igrave; che parli, acco&rsquo;lo&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; due spirti, l&rsquo;uno a l&rsquo;altro chini,</p>\n<p>ragionavan di me ivi a man dritta;</p>\n<p>poi fer li visi, per dirmi, supini;</p></div>\n\n<div class="stanza"><p>e disse l&rsquo;uno: &laquo;O anima che fitta</p>\n<p>nel corpo ancora inver&rsquo; lo ciel ten vai,</p>\n<p>per carit&agrave; ne consola e ne ditta</p></div>\n\n<div class="stanza"><p>onde vieni e chi se&rsquo;; ch&eacute; tu ne fai</p>\n<p>tanto maravigliar de la tua grazia,</p>\n<p>quanto vuol cosa che non fu pi&ugrave; mai&raquo;.</p></div>\n\n<div class="stanza"><p>E io: &laquo;Per mezza Toscana si spazia</p>\n<p>un fiumicel che nasce in Falterona,</p>\n<p>e cento miglia di corso nol sazia.</p></div>\n\n<div class="stanza"><p>Di sovr&rsquo; esso rech&rsquo; io questa persona:</p>\n<p>dirvi ch&rsquo;i&rsquo; sia, saria parlare indarno,</p>\n<p>ch&eacute; &rsquo;l nome mio ancor molto non suona&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Se ben lo &rsquo;ntendimento tuo accarno</p>\n<p>con lo &rsquo;ntelletto&raquo;, allora mi rispuose</p>\n<p>quei che diceva pria, &laquo;tu parli d&rsquo;Arno&raquo;.</p></div>\n\n<div class="stanza"><p>E l&rsquo;altro disse lui: &laquo;Perch&eacute; nascose</p>\n<p>questi il vocabol di quella riviera,</p>\n<p>pur com&rsquo; om fa de l&rsquo;orribili cose?&raquo;.</p></div>\n\n<div class="stanza"><p>E l&rsquo;ombra che di ci&ograve; domandata era,</p>\n<p>si sdebit&ograve; cos&igrave;: &laquo;Non so; ma degno</p>\n<p>ben &egrave; che &rsquo;l nome di tal valle p&egrave;ra;</p></div>\n\n<div class="stanza"><p>ch&eacute; dal principio suo, ov&rsquo; &egrave; s&igrave; pregno</p>\n<p>l&rsquo;alpestro monte ond&rsquo; &egrave; tronco Peloro,</p>\n<p>che &rsquo;n pochi luoghi passa oltra quel segno,</p></div>\n\n<div class="stanza"><p>infin l&agrave; &rsquo;ve si rende per ristoro</p>\n<p>di quel che &rsquo;l ciel de la marina asciuga,</p>\n<p>ond&rsquo; hanno i fiumi ci&ograve; che va con loro,</p></div>\n\n<div class="stanza"><p>vert&ugrave; cos&igrave; per nimica si fuga</p>\n<p>da tutti come biscia, o per sventura</p>\n<p>del luogo, o per mal uso che li fruga:</p></div>\n\n<div class="stanza"><p>ond&rsquo; hanno s&igrave; mutata lor natura</p>\n<p>li abitator de la misera valle,</p>\n<p>che par che Circe li avesse in pastura.</p></div>\n\n<div class="stanza"><p>Tra brutti porci, pi&ugrave; degni di galle</p>\n<p>che d&rsquo;altro cibo fatto in uman uso,</p>\n<p>dirizza prima il suo povero calle.</p></div>\n\n<div class="stanza"><p>Botoli trova poi, venendo giuso,</p>\n<p>ringhiosi pi&ugrave; che non chiede lor possa,</p>\n<p>e da lor disdegnosa torce il muso.</p></div>\n\n<div class="stanza"><p>Vassi caggendo; e quant&rsquo; ella pi&ugrave; &rsquo;ngrossa,</p>\n<p>tanto pi&ugrave; trova di can farsi lupi</p>\n<p>la maladetta e sventurata fossa.</p></div>\n\n<div class="stanza"><p>Discesa poi per pi&ugrave; pelaghi cupi,</p>\n<p>trova le volpi s&igrave; piene di froda,</p>\n<p>che non temono ingegno che le occ&ugrave;pi.</p></div>\n\n<div class="stanza"><p>N&eacute; lascer&ograve; di dir perch&rsquo; altri m&rsquo;oda;</p>\n<p>e buon sar&agrave; costui, s&rsquo;ancor s&rsquo;ammenta</p>\n<p>di ci&ograve; che vero spirto mi disnoda.</p></div>\n\n<div class="stanza"><p>Io veggio tuo nepote che diventa</p>\n<p>cacciator di quei lupi in su la riva</p>\n<p>del fiero fiume, e tutti li sgomenta.</p></div>\n\n<div class="stanza"><p>Vende la carne loro essendo viva;</p>\n<p>poscia li ancide come antica belva;</p>\n<p>molti di vita e s&eacute; di pregio priva.</p></div>\n\n<div class="stanza"><p>Sanguinoso esce de la trista selva;</p>\n<p>lasciala tal, che di qui a mille anni</p>\n<p>ne lo stato primaio non si rinselva&raquo;.</p></div>\n\n<div class="stanza"><p>Com&rsquo; a l&rsquo;annunzio di dogliosi danni</p>\n<p>si turba il viso di colui ch&rsquo;ascolta,</p>\n<p>da qual che parte il periglio l&rsquo;assanni,</p></div>\n\n<div class="stanza"><p>cos&igrave; vid&rsquo; io l&rsquo;altr&rsquo; anima, che volta</p>\n<p>stava a udir, turbarsi e farsi trista,</p>\n<p>poi ch&rsquo;ebbe la parola a s&eacute; raccolta.</p></div>\n\n<div class="stanza"><p>Lo dir de l&rsquo;una e de l&rsquo;altra la vista</p>\n<p>mi fer voglioso di saper lor nomi,</p>\n<p>e dimanda ne fei con prieghi mista;</p></div>\n\n<div class="stanza"><p>per che lo spirto che di pria parl&ograve;mi</p>\n<p>ricominci&ograve;: &laquo;Tu vuo&rsquo; ch&rsquo;io mi deduca</p>\n<p>nel fare a te ci&ograve; che tu far non vuo&rsquo;mi.</p></div>\n\n<div class="stanza"><p>Ma da che Dio in te vuol che traluca</p>\n<p>tanto sua grazia, non ti sar&ograve; scarso;</p>\n<p>per&ograve; sappi ch&rsquo;io fui Guido del Duca.</p></div>\n\n<div class="stanza"><p>Fu il sangue mio d&rsquo;invidia s&igrave; r&iuml;arso,</p>\n<p>che se veduto avesse uom farsi lieto,</p>\n<p>visto m&rsquo;avresti di livore sparso.</p></div>\n\n<div class="stanza"><p>Di mia semente cotal paglia mieto;</p>\n<p>o gente umana, perch&eacute; poni &rsquo;l core</p>\n<p>l&agrave; &rsquo;v&rsquo; &egrave; mestier di consorte divieto?</p></div>\n\n<div class="stanza"><p>Questi &egrave; Rinier; questi &egrave; &rsquo;l pregio e l&rsquo;onore</p>\n<p>de la casa da Calboli, ove nullo</p>\n<p>fatto s&rsquo;&egrave; reda poi del suo valore.</p></div>\n\n<div class="stanza"><p>E non pur lo suo sangue &egrave; fatto brullo,</p>\n<p>tra &rsquo;l Po e &rsquo;l monte e la marina e &rsquo;l Reno,</p>\n<p>del ben richesto al vero e al trastullo;</p></div>\n\n<div class="stanza"><p>ch&eacute; dentro a questi termini &egrave; ripieno</p>\n<p>di venenosi sterpi, s&igrave; che tardi</p>\n<p>per coltivare omai verrebber meno.</p></div>\n\n<div class="stanza"><p>Ov&rsquo; &egrave; &rsquo;l buon Lizio e Arrigo Mainardi?</p>\n<p>Pier Traversaro e Guido di Carpigna?</p>\n<p>Oh Romagnuoli tornati in bastardi!</p></div>\n\n<div class="stanza"><p>Quando in Bologna un Fabbro si ralligna?</p>\n<p>quando in Faenza un Bernardin di Fosco,</p>\n<p>verga gentil di picciola gramigna?</p></div>\n\n<div class="stanza"><p>Non ti maravigliar s&rsquo;io piango, Tosco,</p>\n<p>quando rimembro, con Guido da Prata,</p>\n<p>Ugolin d&rsquo;Azzo che vivette nosco,</p></div>\n\n<div class="stanza"><p>Federigo Tignoso e sua brigata,</p>\n<p>la casa Traversara e li Anastagi</p>\n<p>(e l&rsquo;una gente e l&rsquo;altra &egrave; diretata),</p></div>\n\n<div class="stanza"><p>le donne e &rsquo; cavalier, li affanni e li agi</p>\n<p>che ne &rsquo;nvogliava amore e cortesia</p>\n<p>l&agrave; dove i cuor son fatti s&igrave; malvagi.</p></div>\n\n<div class="stanza"><p>O Bretinoro, ch&eacute; non fuggi via,</p>\n<p>poi che gita se n&rsquo;&egrave; la tua famiglia</p>\n<p>e molta gente per non esser ria?</p></div>\n\n<div class="stanza"><p>Ben fa Bagnacaval, che non rifiglia;</p>\n<p>e mal fa Castrocaro, e peggio Conio,</p>\n<p>che di figliar tai conti pi&ugrave; s&rsquo;impiglia.</p></div>\n\n<div class="stanza"><p>Ben faranno i Pagan, da che &rsquo;l demonio</p>\n<p>lor sen gir&agrave;; ma non per&ograve; che puro</p>\n<p>gi&agrave; mai rimagna d&rsquo;essi testimonio.</p></div>\n\n<div class="stanza"><p>O Ugolin de&rsquo; Fantolin, sicuro</p>\n<p>&egrave; &rsquo;l nome tuo, da che pi&ugrave; non s&rsquo;aspetta</p>\n<p>chi far lo possa, tralignando, scuro.</p></div>\n\n<div class="stanza"><p>Ma va via, Tosco, omai; ch&rsquo;or mi diletta</p>\n<p>troppo di pianger pi&ugrave; che di parlare,</p>\n<p>s&igrave; m&rsquo;ha nostra ragion la mente stretta&raquo;.</p></div>\n\n<div class="stanza"><p>Noi sapavam che quell&rsquo; anime care</p>\n<p>ci sentivano andar; per&ograve;, tacendo,</p>\n<p>fac&euml;an noi del cammin confidare.</p></div>\n\n<div class="stanza"><p>Poi fummo fatti soli procedendo,</p>\n<p>folgore parve quando l&rsquo;aere fende,</p>\n<p>voce che giunse di contra dicendo:</p></div>\n\n<div class="stanza"><p>&lsquo;Anciderammi qualunque m&rsquo;apprende&rsquo;;</p>\n<p>e fugg&igrave; come tuon che si dilegua,</p>\n<p>se s&ugrave;bito la nuvola scoscende.</p></div>\n\n<div class="stanza"><p>Come da lei l&rsquo;udir nostro ebbe triegua,</p>\n<p>ed ecco l&rsquo;altra con s&igrave; gran fracasso,</p>\n<p>che somigli&ograve; tonar che tosto segua:</p></div>\n\n<div class="stanza"><p>&laquo;Io sono Aglauro che divenni sasso&raquo;;</p>\n<p>e allor, per ristrignermi al poeta,</p>\n<p>in destro feci, e non innanzi, il passo.</p></div>\n\n<div class="stanza"><p>Gi&agrave; era l&rsquo;aura d&rsquo;ogne parte queta;</p>\n<p>ed el mi disse: &laquo;Quel fu &rsquo;l duro camo</p>\n<p>che dovria l&rsquo;uom tener dentro a sua meta.</p></div>\n\n<div class="stanza"><p>Ma voi prendete l&rsquo;esca, s&igrave; che l&rsquo;amo</p>\n<p>de l&rsquo;antico avversaro a s&eacute; vi tira;</p>\n<p>e per&ograve; poco val freno o richiamo.</p></div>\n\n<div class="stanza"><p>Chiamavi &rsquo;l cielo e &rsquo;ntorno vi si gira,</p>\n<p>mostrandovi le sue bellezze etterne,</p>\n<p>e l&rsquo;occhio vostro pur a terra mira;</p></div>\n\n<div class="stanza"><p>onde vi batte chi tutto discerne&raquo;.</p></div>','<p class="cantohead">Canto XV</p>\n\n<div class="stanza"><p>Quanto tra l&rsquo;ultimar de l&rsquo;ora terza</p>\n<p>e &rsquo;l principio del d&igrave; par de la spera</p>\n<p>che sempre a guisa di fanciullo scherza,</p></div>\n\n<div class="stanza"><p>tanto pareva gi&agrave; inver&rsquo; la sera</p>\n<p>essere al sol del suo corso rimaso;</p>\n<p>vespero l&agrave;, e qui mezza notte era.</p></div>\n\n<div class="stanza"><p>E i raggi ne ferien per mezzo &rsquo;l naso,</p>\n<p>perch&eacute; per noi girato era s&igrave; &rsquo;l monte,</p>\n<p>che gi&agrave; dritti andavamo inver&rsquo; l&rsquo;occaso,</p></div>\n\n<div class="stanza"><p>quand&rsquo; io senti&rsquo; a me gravar la fronte</p>\n<p>a lo splendore assai pi&ugrave; che di prima,</p>\n<p>e stupor m&rsquo;eran le cose non conte;</p></div>\n\n<div class="stanza"><p>ond&rsquo; io levai le mani inver&rsquo; la cima</p>\n<p>de le mie ciglia, e fecimi &rsquo;l solecchio,</p>\n<p>che del soverchio visibile lima.</p></div>\n\n<div class="stanza"><p>Come quando da l&rsquo;acqua o da lo specchio</p>\n<p>salta lo raggio a l&rsquo;opposita parte,</p>\n<p>salendo su per lo modo parecchio</p></div>\n\n<div class="stanza"><p>a quel che scende, e tanto si diparte</p>\n<p>dal cader de la pietra in igual tratta,</p>\n<p>s&igrave; come mostra esper&iuml;enza e arte;</p></div>\n\n<div class="stanza"><p>cos&igrave; mi parve da luce rifratta</p>\n<p>quivi dinanzi a me esser percosso;</p>\n<p>per che a fuggir la mia vista fu ratta.</p></div>\n\n<div class="stanza"><p>&laquo;Che &egrave; quel, dolce padre, a che non posso</p>\n<p>schermar lo viso tanto che mi vaglia&raquo;,</p>\n<p>diss&rsquo; io, &laquo;e pare inver&rsquo; noi esser mosso?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Non ti maravigliar s&rsquo;ancor t&rsquo;abbaglia</p>\n<p>la famiglia del cielo&raquo;, a me rispuose:</p>\n<p>&laquo;messo &egrave; che viene ad invitar ch&rsquo;om saglia.</p></div>\n\n<div class="stanza"><p>Tosto sar&agrave; ch&rsquo;a veder queste cose</p>\n<p>non ti fia grave, ma fieti diletto</p>\n<p>quanto natura a sentir ti dispuose&raquo;.</p></div>\n\n<div class="stanza"><p>Poi giunti fummo a l&rsquo;angel benedetto,</p>\n<p>con lieta voce disse: &laquo;Intrate quinci</p>\n<p>ad un scaleo vie men che li altri eretto&raquo;.</p></div>\n\n<div class="stanza"><p>Noi montavam, gi&agrave; partiti di linci,</p>\n<p>e &lsquo;Beati misericordes!&rsquo; fue</p>\n<p>cantato retro, e &lsquo;Godi tu che vinci!&rsquo;.</p></div>\n\n<div class="stanza"><p>Lo mio maestro e io soli amendue</p>\n<p>suso andavamo; e io pensai, andando,</p>\n<p>prode acquistar ne le parole sue;</p></div>\n\n<div class="stanza"><p>e dirizza&rsquo;mi a lui s&igrave; dimandando:</p>\n<p>&laquo;Che volse dir lo spirto di Romagna,</p>\n<p>e &lsquo;divieto&rsquo; e &lsquo;consorte&rsquo; menzionando?&raquo;.</p></div>\n\n<div class="stanza"><p>Per ch&rsquo;elli a me: &laquo;Di sua maggior magagna</p>\n<p>conosce il danno; e per&ograve; non s&rsquo;ammiri</p>\n<p>se ne riprende perch&eacute; men si piagna.</p></div>\n\n<div class="stanza"><p>Perch&eacute; s&rsquo;appuntano i vostri disiri</p>\n<p>dove per compagnia parte si scema,</p>\n<p>invidia move il mantaco a&rsquo; sospiri.</p></div>\n\n<div class="stanza"><p>Ma se l&rsquo;amor de la spera supprema</p>\n<p>torcesse in suso il disiderio vostro,</p>\n<p>non vi sarebbe al petto quella tema;</p></div>\n\n<div class="stanza"><p>ch&eacute;, per quanti si dice pi&ugrave; l&igrave; &lsquo;nostro&rsquo;,</p>\n<p>tanto possiede pi&ugrave; di ben ciascuno,</p>\n<p>e pi&ugrave; di caritate arde in quel chiostro&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Io son d&rsquo;esser contento pi&ugrave; digiuno&raquo;,</p>\n<p>diss&rsquo; io, &laquo;che se mi fosse pria taciuto,</p>\n<p>e pi&ugrave; di dubbio ne la mente aduno.</p></div>\n\n<div class="stanza"><p>Com&rsquo; esser puote ch&rsquo;un ben, distributo</p>\n<p>in pi&ugrave; posseditor, faccia pi&ugrave; ricchi</p>\n<p>di s&eacute; che se da pochi &egrave; posseduto?&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;Per&ograve; che tu rificchi</p>\n<p>la mente pur a le cose terrene,</p>\n<p>di vera luce tenebre dispicchi.</p></div>\n\n<div class="stanza"><p>Quello infinito e ineffabil bene</p>\n<p>che l&agrave; s&ugrave; &egrave;, cos&igrave; corre ad amore</p>\n<p>com&rsquo; a lucido corpo raggio vene.</p></div>\n\n<div class="stanza"><p>Tanto si d&agrave; quanto trova d&rsquo;ardore;</p>\n<p>s&igrave; che, quantunque carit&agrave; si stende,</p>\n<p>cresce sovr&rsquo; essa l&rsquo;etterno valore.</p></div>\n\n<div class="stanza"><p>E quanta gente pi&ugrave; l&agrave; s&ugrave; s&rsquo;intende,</p>\n<p>pi&ugrave; v&rsquo;&egrave; da bene amare, e pi&ugrave; vi s&rsquo;ama,</p>\n<p>e come specchio l&rsquo;uno a l&rsquo;altro rende.</p></div>\n\n<div class="stanza"><p>E se la mia ragion non ti disfama,</p>\n<p>vedrai Beatrice, ed ella pienamente</p>\n<p>ti torr&agrave; questa e ciascun&rsquo; altra brama.</p></div>\n\n<div class="stanza"><p>Procaccia pur che tosto sieno spente,</p>\n<p>come son gi&agrave; le due, le cinque piaghe,</p>\n<p>che si richiudon per esser dolente&raquo;.</p></div>\n\n<div class="stanza"><p>Com&rsquo; io voleva dicer &lsquo;Tu m&rsquo;appaghe&rsquo;,</p>\n<p>vidimi giunto in su l&rsquo;altro girone,</p>\n<p>s&igrave; che tacer mi fer le luci vaghe.</p></div>\n\n<div class="stanza"><p>Ivi mi parve in una vis&iuml;one</p>\n<p>estatica di s&ugrave;bito esser tratto,</p>\n<p>e vedere in un tempio pi&ugrave; persone;</p></div>\n\n<div class="stanza"><p>e una donna, in su l&rsquo;entrar, con atto</p>\n<p>dolce di madre dicer: &laquo;Figliuol mio,</p>\n<p>perch&eacute; hai tu cos&igrave; verso noi fatto?</p></div>\n\n<div class="stanza"><p>Ecco, dolenti, lo tuo padre e io</p>\n<p>ti cercavamo&raquo;. E come qui si tacque,</p>\n<p>ci&ograve; che pareva prima, dispario.</p></div>\n\n<div class="stanza"><p>Indi m&rsquo;apparve un&rsquo;altra con quell&rsquo; acque</p>\n<p>gi&ugrave; per le gote che &rsquo;l dolor distilla</p>\n<p>quando di gran dispetto in altrui nacque,</p></div>\n\n<div class="stanza"><p>e dir: &laquo;Se tu se&rsquo; sire de la villa</p>\n<p>del cui nome ne&rsquo; d&egrave;i fu tanta lite,</p>\n<p>e onde ogne sc&iuml;enza disfavilla,</p></div>\n\n<div class="stanza"><p>vendica te di quelle braccia ardite</p>\n<p>ch&rsquo;abbracciar nostra figlia, o Pisistr&agrave;to&raquo;.</p>\n<p>E &rsquo;l segnor mi parea, benigno e mite,</p></div>\n\n<div class="stanza"><p>risponder lei con viso temperato:</p>\n<p>&laquo;Che farem noi a chi mal ne disira,</p>\n<p>se quei che ci ama &egrave; per noi condannato?&raquo;,</p></div>\n\n<div class="stanza"><p>Poi vidi genti accese in foco d&rsquo;ira</p>\n<p>con pietre un giovinetto ancider, forte</p>\n<p>gridando a s&eacute; pur: &laquo;Martira, martira!&raquo;.</p></div>\n\n<div class="stanza"><p>E lui vedea chinarsi, per la morte</p>\n<p>che l&rsquo;aggravava gi&agrave;, inver&rsquo; la terra,</p>\n<p>ma de li occhi facea sempre al ciel porte,</p></div>\n\n<div class="stanza"><p>orando a l&rsquo;alto Sire, in tanta guerra,</p>\n<p>che perdonasse a&rsquo; suoi persecutori,</p>\n<p>con quello aspetto che piet&agrave; diserra.</p></div>\n\n<div class="stanza"><p>Quando l&rsquo;anima mia torn&ograve; di fori</p>\n<p>a le cose che son fuor di lei vere,</p>\n<p>io riconobbi i miei non falsi errori.</p></div>\n\n<div class="stanza"><p>Lo duca mio, che mi potea vedere</p>\n<p>far s&igrave; com&rsquo; om che dal sonno si slega,</p>\n<p>disse: &laquo;Che hai che non ti puoi tenere,</p></div>\n\n<div class="stanza"><p>ma se&rsquo; venuto pi&ugrave; che mezza lega</p>\n<p>velando li occhi e con le gambe avvolte,</p>\n<p>a guisa di cui vino o sonno piega?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O dolce padre mio, se tu m&rsquo;ascolte,</p>\n<p>io ti dir&ograve;&raquo;, diss&rsquo; io, &laquo;ci&ograve; che m&rsquo;apparve</p>\n<p>quando le gambe mi furon s&igrave; tolte&raquo;.</p></div>\n\n<div class="stanza"><p>Ed ei: &laquo;Se tu avessi cento larve</p>\n<p>sovra la faccia, non mi sarian chiuse</p>\n<p>le tue cogitazion, quantunque parve.</p></div>\n\n<div class="stanza"><p>Ci&ograve; che vedesti fu perch&eacute; non scuse</p>\n<p>d&rsquo;aprir lo core a l&rsquo;acque de la pace</p>\n<p>che da l&rsquo;etterno fonte son diffuse.</p></div>\n\n<div class="stanza"><p>Non dimandai &ldquo;Che hai?&rdquo; per quel che face</p>\n<p>chi guarda pur con l&rsquo;occhio che non vede,</p>\n<p>quando disanimato il corpo giace;</p></div>\n\n<div class="stanza"><p>ma dimandai per darti forza al piede:</p>\n<p>cos&igrave; frugar conviensi i pigri, lenti</p>\n<p>ad usar lor vigilia quando riede&raquo;.</p></div>\n\n<div class="stanza"><p>Noi andavam per lo vespero, attenti</p>\n<p>oltre quanto potean li occhi allungarsi</p>\n<p>contra i raggi serotini e lucenti.</p></div>\n\n<div class="stanza"><p>Ed ecco a poco a poco un fummo farsi</p>\n<p>verso di noi come la notte oscuro;</p>\n<p>n&eacute; da quello era loco da cansarsi.</p></div>\n\n<div class="stanza"><p>Questo ne tolse li occhi e l&rsquo;aere puro.</p></div>','<p class="cantohead">Canto XVI</p>\n\n<div class="stanza"><p>Buio d&rsquo;inferno e di notte privata</p>\n<p>d&rsquo;ogne pianeto, sotto pover cielo,</p>\n<p>quant&rsquo; esser pu&ograve; di nuvol tenebrata,</p></div>\n\n<div class="stanza"><p>non fece al viso mio s&igrave; grosso velo</p>\n<p>come quel fummo ch&rsquo;ivi ci coperse,</p>\n<p>n&eacute; a sentir di cos&igrave; aspro pelo,</p></div>\n\n<div class="stanza"><p>che l&rsquo;occhio stare aperto non sofferse;</p>\n<p>onde la scorta mia saputa e fida</p>\n<p>mi s&rsquo;accost&ograve; e l&rsquo;omero m&rsquo;offerse.</p></div>\n\n<div class="stanza"><p>S&igrave; come cieco va dietro a sua guida</p>\n<p>per non smarrirsi e per non dar di cozzo</p>\n<p>in cosa che &rsquo;l molesti, o forse ancida,</p></div>\n\n<div class="stanza"><p>m&rsquo;andava io per l&rsquo;aere amaro e sozzo,</p>\n<p>ascoltando il mio duca che diceva</p>\n<p>pur: &laquo;Guarda che da me tu non sia mozzo&raquo;.</p></div>\n\n<div class="stanza"><p>Io sentia voci, e ciascuna pareva</p>\n<p>pregar per pace e per misericordia</p>\n<p>l&rsquo;Agnel di Dio che le peccata leva.</p></div>\n\n<div class="stanza"><p>Pur &lsquo;Agnus Dei&rsquo; eran le loro essordia;</p>\n<p>una parola in tutte era e un modo,</p>\n<p>s&igrave; che parea tra esse ogne concordia.</p></div>\n\n<div class="stanza"><p>&laquo;Quei sono spirti, maestro, ch&rsquo;i&rsquo; odo?&raquo;,</p>\n<p>diss&rsquo; io. Ed elli a me: &laquo;Tu vero apprendi,</p>\n<p>e d&rsquo;iracundia van solvendo il nodo&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Or tu chi se&rsquo; che &rsquo;l nostro fummo fendi,</p>\n<p>e di noi parli pur come se tue</p>\n<p>partissi ancor lo tempo per calendi?&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; per una voce detto fue;</p>\n<p>onde &rsquo;l maestro mio disse: &laquo;Rispondi,</p>\n<p>e domanda se quinci si va s&ugrave;e&raquo;.</p></div>\n\n<div class="stanza"><p>E io: &laquo;O creatura che ti mondi</p>\n<p>per tornar bella a colui che ti fece,</p>\n<p>maraviglia udirai, se mi secondi&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Io ti seguiter&ograve; quanto mi lece&raquo;,</p>\n<p>rispuose; &laquo;e se veder fummo non lascia,</p>\n<p>l&rsquo;udir ci terr&agrave; giunti in quella vece&raquo;.</p></div>\n\n<div class="stanza"><p>Allora incominciai: &laquo;Con quella fascia</p>\n<p>che la morte dissolve men vo suso,</p>\n<p>e venni qui per l&rsquo;infernale ambascia.</p></div>\n\n<div class="stanza"><p>E se Dio m&rsquo;ha in sua grazia rinchiuso,</p>\n<p>tanto che vuol ch&rsquo;i&rsquo; veggia la sua corte</p>\n<p>per modo tutto fuor del moderno uso,</p></div>\n\n<div class="stanza"><p>non mi celar chi fosti anzi la morte,</p>\n<p>ma dilmi, e dimmi s&rsquo;i&rsquo; vo bene al varco;</p>\n<p>e tue parole fier le nostre scorte&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Lombardo fui, e fu&rsquo; chiamato Marco;</p>\n<p>del mondo seppi, e quel valore amai</p>\n<p>al quale ha or ciascun disteso l&rsquo;arco.</p></div>\n\n<div class="stanza"><p>Per montar s&ugrave; dirittamente vai&raquo;.</p>\n<p>Cos&igrave; rispuose, e soggiunse: &laquo;I&rsquo; ti prego</p>\n<p>che per me prieghi quando s&ugrave; sarai&raquo;.</p></div>\n\n<div class="stanza"><p>E io a lui: &laquo;Per fede mi ti lego</p>\n<p>di far ci&ograve; che mi chiedi; ma io scoppio</p>\n<p>dentro ad un dubbio, s&rsquo;io non me ne spiego.</p></div>\n\n<div class="stanza"><p>Prima era scempio, e ora &egrave; fatto doppio</p>\n<p>ne la sentenza tua, che mi fa certo</p>\n<p>qui, e altrove, quello ov&rsquo; io l&rsquo;accoppio.</p></div>\n\n<div class="stanza"><p>Lo mondo &egrave; ben cos&igrave; tutto diserto</p>\n<p>d&rsquo;ogne virtute, come tu mi sone,</p>\n<p>e di malizia gravido e coverto;</p></div>\n\n<div class="stanza"><p>ma priego che m&rsquo;addite la cagione,</p>\n<p>s&igrave; ch&rsquo;i&rsquo; la veggia e ch&rsquo;i&rsquo; la mostri altrui;</p>\n<p>ch&eacute; nel cielo uno, e un qua gi&ugrave; la pone&raquo;.</p></div>\n\n<div class="stanza"><p>Alto sospir, che duolo strinse in &laquo;uhi!&raquo;,</p>\n<p>mise fuor prima; e poi cominci&ograve;: &laquo;Frate,</p>\n<p>lo mondo &egrave; cieco, e tu vien ben da lui.</p></div>\n\n<div class="stanza"><p>Voi che vivete ogne cagion recate</p>\n<p>pur suso al cielo, pur come se tutto</p>\n<p>movesse seco di necessitate.</p></div>\n\n<div class="stanza"><p>Se cos&igrave; fosse, in voi fora distrutto</p>\n<p>libero arbitrio, e non fora giustizia</p>\n<p>per ben letizia, e per male aver lutto.</p></div>\n\n<div class="stanza"><p>Lo cielo i vostri movimenti inizia;</p>\n<p>non dico tutti, ma, posto ch&rsquo;i&rsquo; &rsquo;l dica,</p>\n<p>lume v&rsquo;&egrave; dato a bene e a malizia,</p></div>\n\n<div class="stanza"><p>e libero voler; che, se fatica</p>\n<p>ne le prime battaglie col ciel dura,</p>\n<p>poi vince tutto, se ben si notrica.</p></div>\n\n<div class="stanza"><p>A maggior forza e a miglior natura</p>\n<p>liberi soggiacete; e quella cria</p>\n<p>la mente in voi, che &rsquo;l ciel non ha in sua cura.</p></div>\n\n<div class="stanza"><p>Per&ograve;, se &rsquo;l mondo presente disvia,</p>\n<p>in voi &egrave; la cagione, in voi si cheggia;</p>\n<p>e io te ne sar&ograve; or vera spia.</p></div>\n\n<div class="stanza"><p>Esce di mano a lui che la vagheggia</p>\n<p>prima che sia, a guisa di fanciulla</p>\n<p>che piangendo e ridendo pargoleggia,</p></div>\n\n<div class="stanza"><p>l&rsquo;anima semplicetta che sa nulla,</p>\n<p>salvo che, mossa da lieto fattore,</p>\n<p>volontier torna a ci&ograve; che la trastulla.</p></div>\n\n<div class="stanza"><p>Di picciol bene in pria sente sapore;</p>\n<p>quivi s&rsquo;inganna, e dietro ad esso corre,</p>\n<p>se guida o fren non torce suo amore.</p></div>\n\n<div class="stanza"><p>Onde convenne legge per fren porre;</p>\n<p>convenne rege aver, che discernesse</p>\n<p>de la vera cittade almen la torre.</p></div>\n\n<div class="stanza"><p>Le leggi son, ma chi pon mano ad esse?</p>\n<p>Nullo, per&ograve; che &rsquo;l pastor che procede,</p>\n<p>rugumar pu&ograve;, ma non ha l&rsquo;unghie fesse;</p></div>\n\n<div class="stanza"><p>per che la gente, che sua guida vede</p>\n<p>pur a quel ben fedire ond&rsquo; ella &egrave; ghiotta,</p>\n<p>di quel si pasce, e pi&ugrave; oltre non chiede.</p></div>\n\n<div class="stanza"><p>Ben puoi veder che la mala condotta</p>\n<p>&egrave; la cagion che &rsquo;l mondo ha fatto reo,</p>\n<p>e non natura che &rsquo;n voi sia corrotta.</p></div>\n\n<div class="stanza"><p>Soleva Roma, che &rsquo;l buon mondo feo,</p>\n<p>due soli aver, che l&rsquo;una e l&rsquo;altra strada</p>\n<p>facean vedere, e del mondo e di Deo.</p></div>\n\n<div class="stanza"><p>L&rsquo;un l&rsquo;altro ha spento; ed &egrave; giunta la spada</p>\n<p>col pasturale, e l&rsquo;un con l&rsquo;altro insieme</p>\n<p>per viva forza mal convien che vada;</p></div>\n\n<div class="stanza"><p>per&ograve; che, giunti, l&rsquo;un l&rsquo;altro non teme:</p>\n<p>se non mi credi, pon mente a la spiga,</p>\n<p>ch&rsquo;ogn&rsquo; erba si conosce per lo seme.</p></div>\n\n<div class="stanza"><p>In sul paese ch&rsquo;Adice e Po riga,</p>\n<p>solea valore e cortesia trovarsi,</p>\n<p>prima che Federigo avesse briga;</p></div>\n\n<div class="stanza"><p>or pu&ograve; sicuramente indi passarsi</p>\n<p>per qualunque lasciasse, per vergogna</p>\n<p>di ragionar coi buoni o d&rsquo;appressarsi.</p></div>\n\n<div class="stanza"><p>Ben v&rsquo;&egrave;n tre vecchi ancora in cui rampogna</p>\n<p>l&rsquo;antica et&agrave; la nova, e par lor tardo</p>\n<p>che Dio a miglior vita li ripogna:</p></div>\n\n<div class="stanza"><p>Currado da Palazzo e &rsquo;l buon Gherardo</p>\n<p>e Guido da Castel, che mei si noma,</p>\n<p>francescamente, il semplice Lombardo.</p></div>\n\n<div class="stanza"><p>D&igrave; oggimai che la Chiesa di Roma,</p>\n<p>per confondere in s&eacute; due reggimenti,</p>\n<p>cade nel fango, e s&eacute; brutta e la soma&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O Marco mio&raquo;, diss&rsquo; io, &laquo;bene argomenti;</p>\n<p>e or discerno perch&eacute; dal retaggio</p>\n<p>li figli di Lev&igrave; furono essenti.</p></div>\n\n<div class="stanza"><p>Ma qual Gherardo &egrave; quel che tu per saggio</p>\n<p>di&rsquo; ch&rsquo;&egrave; rimaso de la gente spenta,</p>\n<p>in rimprov&egrave;ro del secol selvaggio?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O tuo parlar m&rsquo;inganna, o el mi tenta&raquo;,</p>\n<p>rispuose a me; &laquo;ch&eacute;, parlandomi tosco,</p>\n<p>par che del buon Gherardo nulla senta.</p></div>\n\n<div class="stanza"><p>Per altro sopranome io nol conosco,</p>\n<p>s&rsquo;io nol togliessi da sua figlia Gaia.</p>\n<p>Dio sia con voi, ch&eacute; pi&ugrave; non vegno vosco.</p></div>\n\n<div class="stanza"><p>Vedi l&rsquo;albor che per lo fummo raia</p>\n<p>gi&agrave; biancheggiare, e me convien partirmi</p>\n<p>(l&rsquo;angelo &egrave; ivi) prima ch&rsquo;io li paia&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; torn&ograve;, e pi&ugrave; non volle udirmi.</p></div>','<p class="cantohead">Canto XVII</p>\n\n<div class="stanza"><p>Ricorditi, lettor, se mai ne l&rsquo;alpe</p>\n<p>ti colse nebbia per la qual vedessi</p>\n<p>non altrimenti che per pelle talpe,</p></div>\n\n<div class="stanza"><p>come, quando i vapori umidi e spessi</p>\n<p>a diradar cominciansi, la spera</p>\n<p>del sol debilemente entra per essi;</p></div>\n\n<div class="stanza"><p>e fia la tua imagine leggera</p>\n<p>in giugnere a veder com&rsquo; io rividi</p>\n<p>lo sole in pria, che gi&agrave; nel corcar era.</p></div>\n\n<div class="stanza"><p>S&igrave;, pareggiando i miei co&rsquo; passi fidi</p>\n<p>del mio maestro, usci&rsquo; fuor di tal nube</p>\n<p>ai raggi morti gi&agrave; ne&rsquo; bassi lidi.</p></div>\n\n<div class="stanza"><p>O imaginativa che ne rube</p>\n<p>talvolta s&igrave; di fuor, ch&rsquo;om non s&rsquo;accorge</p>\n<p>perch&eacute; dintorno suonin mille tube,</p></div>\n\n<div class="stanza"><p>chi move te, se &rsquo;l senso non ti porge?</p>\n<p>Moveti lume che nel ciel s&rsquo;informa,</p>\n<p>per s&eacute; o per voler che gi&ugrave; lo scorge.</p></div>\n\n<div class="stanza"><p>De l&rsquo;empiezza di lei che mut&ograve; forma</p>\n<p>ne l&rsquo;uccel ch&rsquo;a cantar pi&ugrave; si diletta,</p>\n<p>ne l&rsquo;imagine mia apparve l&rsquo;orma;</p></div>\n\n<div class="stanza"><p>e qui fu la mia mente s&igrave; ristretta</p>\n<p>dentro da s&eacute;, che di fuor non ven&igrave;a</p>\n<p>cosa che fosse allor da lei ricetta.</p></div>\n\n<div class="stanza"><p>Poi piovve dentro a l&rsquo;alta fantasia</p>\n<p>un crucifisso, dispettoso e fero</p>\n<p>ne la sua vista, e cotal si moria;</p></div>\n\n<div class="stanza"><p>intorno ad esso era il grande Ass&uuml;ero,</p>\n<p>Est&egrave;r sua sposa e &rsquo;l giusto Mardoceo,</p>\n<p>che fu al dire e al far cos&igrave; intero.</p></div>\n\n<div class="stanza"><p>E come questa imagine rompeo</p>\n<p>s&eacute; per s&eacute; stessa, a guisa d&rsquo;una bulla</p>\n<p>cui manca l&rsquo;acqua sotto qual si feo,</p></div>\n\n<div class="stanza"><p>surse in mia vis&iuml;one una fanciulla</p>\n<p>piangendo forte, e dicea: &laquo;O regina,</p>\n<p>perch&eacute; per ira hai voluto esser nulla?</p></div>\n\n<div class="stanza"><p>Ancisa t&rsquo;hai per non perder Lavina;</p>\n<p>or m&rsquo;hai perduta! Io son essa che lutto,</p>\n<p>madre, a la tua pria ch&rsquo;a l&rsquo;altrui ruina&raquo;.</p></div>\n\n<div class="stanza"><p>Come si frange il sonno ove di butto</p>\n<p>nova luce percuote il viso chiuso,</p>\n<p>che fratto guizza pria che muoia tutto;</p></div>\n\n<div class="stanza"><p>cos&igrave; l&rsquo;imaginar mio cadde giuso</p>\n<p>tosto che lume il volto mi percosse,</p>\n<p>maggior assai che quel ch&rsquo;&egrave; in nostro uso.</p></div>\n\n<div class="stanza"><p>I&rsquo; mi volgea per veder ov&rsquo; io fosse,</p>\n<p>quando una voce disse &laquo;Qui si monta&raquo;,</p>\n<p>che da ogne altro intento mi rimosse;</p></div>\n\n<div class="stanza"><p>e fece la mia voglia tanto pronta</p>\n<p>di riguardar chi era che parlava,</p>\n<p>che mai non posa, se non si raffronta.</p></div>\n\n<div class="stanza"><p>Ma come al sol che nostra vista grava</p>\n<p>e per soverchio sua figura vela,</p>\n<p>cos&igrave; la mia virt&ugrave; quivi mancava.</p></div>\n\n<div class="stanza"><p>&laquo;Questo &egrave; divino spirito, che ne la</p>\n<p>via da ir s&ugrave; ne drizza sanza prego,</p>\n<p>e col suo lume s&eacute; medesmo cela.</p></div>\n\n<div class="stanza"><p>S&igrave; fa con noi, come l&rsquo;uom si fa sego;</p>\n<p>ch&eacute; quale aspetta prego e l&rsquo;uopo vede,</p>\n<p>malignamente gi&agrave; si mette al nego.</p></div>\n\n<div class="stanza"><p>Or accordiamo a tanto invito il piede;</p>\n<p>procacciam di salir pria che s&rsquo;abbui,</p>\n<p>ch&eacute; poi non si poria, se &rsquo;l d&igrave; non riede&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; disse il mio duca, e io con lui</p>\n<p>volgemmo i nostri passi ad una scala;</p>\n<p>e tosto ch&rsquo;io al primo grado fui,</p></div>\n\n<div class="stanza"><p>senti&rsquo;mi presso quasi un muover d&rsquo;ala</p>\n<p>e ventarmi nel viso e dir: &lsquo;Beati</p>\n<p>pacifici, che son sanz&rsquo; ira mala!&rsquo;.</p></div>\n\n<div class="stanza"><p>Gi&agrave; eran sovra noi tanto levati</p>\n<p>li ultimi raggi che la notte segue,</p>\n<p>che le stelle apparivan da pi&ugrave; lati.</p></div>\n\n<div class="stanza"><p>&lsquo;O virt&ugrave; mia, perch&eacute; s&igrave; ti dilegue?&rsquo;,</p>\n<p>fra me stesso dicea, ch&eacute; mi sentiva</p>\n<p>la possa de le gambe posta in triegue.</p></div>\n\n<div class="stanza"><p>Noi eravam dove pi&ugrave; non saliva</p>\n<p>la scala s&ugrave;, ed eravamo affissi,</p>\n<p>pur come nave ch&rsquo;a la piaggia arriva.</p></div>\n\n<div class="stanza"><p>E io attesi un poco, s&rsquo;io udissi</p>\n<p>alcuna cosa nel novo girone;</p>\n<p>poi mi volsi al maestro mio, e dissi:</p></div>\n\n<div class="stanza"><p>&laquo;Dolce mio padre, d&igrave;, quale offensione</p>\n<p>si purga qui nel giro dove semo?</p>\n<p>Se i pi&egrave; si stanno, non stea tuo sermone&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;L&rsquo;amor del bene, scemo</p>\n<p>del suo dover, quiritta si ristora;</p>\n<p>qui si ribatte il mal tardato remo.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; pi&ugrave; aperto intendi ancora,</p>\n<p>volgi la mente a me, e prenderai</p>\n<p>alcun buon frutto di nostra dimora&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;N&eacute; creator n&eacute; creatura mai&raquo;,</p>\n<p>cominci&ograve; el, &laquo;figliuol, fu sanza amore,</p>\n<p>o naturale o d&rsquo;animo; e tu &rsquo;l sai.</p></div>\n\n<div class="stanza"><p>Lo naturale &egrave; sempre sanza errore,</p>\n<p>ma l&rsquo;altro puote errar per malo obietto</p>\n<p>o per troppo o per poco di vigore.</p></div>\n\n<div class="stanza"><p>Mentre ch&rsquo;elli &egrave; nel primo ben diretto,</p>\n<p>e ne&rsquo; secondi s&eacute; stesso misura,</p>\n<p>esser non pu&ograve; cagion di mal diletto;</p></div>\n\n<div class="stanza"><p>ma quando al mal si torce, o con pi&ugrave; cura</p>\n<p>o con men che non dee corre nel bene,</p>\n<p>contra &rsquo;l fattore adovra sua fattura.</p></div>\n\n<div class="stanza"><p>Quinci comprender puoi ch&rsquo;esser convene</p>\n<p>amor sementa in voi d&rsquo;ogne virtute</p>\n<p>e d&rsquo;ogne operazion che merta pene.</p></div>\n\n<div class="stanza"><p>Or, perch&eacute; mai non pu&ograve; da la salute</p>\n<p>amor del suo subietto volger viso,</p>\n<p>da l&rsquo;odio proprio son le cose tute;</p></div>\n\n<div class="stanza"><p>e perch&eacute; intender non si pu&ograve; diviso,</p>\n<p>e per s&eacute; stante, alcuno esser dal primo,</p>\n<p>da quello odiare ogne effetto &egrave; deciso.</p></div>\n\n<div class="stanza"><p>Resta, se dividendo bene stimo,</p>\n<p>che &rsquo;l mal che s&rsquo;ama &egrave; del prossimo; ed esso</p>\n<p>amor nasce in tre modi in vostro limo.</p></div>\n\n<div class="stanza"><p>&egrave; chi, per esser suo vicin soppresso,</p>\n<p>spera eccellenza, e sol per questo brama</p>\n<p>ch&rsquo;el sia di sua grandezza in basso messo;</p></div>\n\n<div class="stanza"><p>&egrave; chi podere, grazia, onore e fama</p>\n<p>teme di perder perch&rsquo; altri sormonti,</p>\n<p>onde s&rsquo;attrista s&igrave; che &rsquo;l contrario ama;</p></div>\n\n<div class="stanza"><p>ed &egrave; chi per ingiuria par ch&rsquo;aonti,</p>\n<p>s&igrave; che si fa de la vendetta ghiotto,</p>\n<p>e tal convien che &rsquo;l male altrui impronti.</p></div>\n\n<div class="stanza"><p>Questo triforme amor qua gi&ugrave; di sotto</p>\n<p>si piange: or vo&rsquo; che tu de l&rsquo;altro intende,</p>\n<p>che corre al ben con ordine corrotto.</p></div>\n\n<div class="stanza"><p>Ciascun confusamente un bene apprende</p>\n<p>nel qual si queti l&rsquo;animo, e disira;</p>\n<p>per che di giugner lui ciascun contende.</p></div>\n\n<div class="stanza"><p>Se lento amore a lui veder vi tira</p>\n<p>o a lui acquistar, questa cornice,</p>\n<p>dopo giusto penter, ve ne martira.</p></div>\n\n<div class="stanza"><p>Altro ben &egrave; che non fa l&rsquo;uom felice;</p>\n<p>non &egrave; felicit&agrave;, non &egrave; la buona</p>\n<p>essenza, d&rsquo;ogne ben frutto e radice.</p></div>\n\n<div class="stanza"><p>L&rsquo;amor ch&rsquo;ad esso troppo s&rsquo;abbandona,</p>\n<p>di sovr&rsquo; a noi si piange per tre cerchi;</p>\n<p>ma come tripartito si ragiona,</p></div>\n\n<div class="stanza"><p>tacciolo, acci&ograve; che tu per te ne cerchi&raquo;.</p></div>','<p class="cantohead">Canto XVIII</p>\n\n<div class="stanza"><p>Posto avea fine al suo ragionamento</p>\n<p>l&rsquo;alto dottore, e attento guardava</p>\n<p>ne la mia vista s&rsquo;io parea contento;</p></div>\n\n<div class="stanza"><p>e io, cui nova sete ancor frugava,</p>\n<p>di fuor tacea, e dentro dicea: &lsquo;Forse</p>\n<p>lo troppo dimandar ch&rsquo;io fo li grava&rsquo;.</p></div>\n\n<div class="stanza"><p>Ma quel padre verace, che s&rsquo;accorse</p>\n<p>del timido voler che non s&rsquo;apriva,</p>\n<p>parlando, di parlare ardir mi porse.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; io: &laquo;Maestro, il mio veder s&rsquo;avviva</p>\n<p>s&igrave; nel tuo lume, ch&rsquo;io discerno chiaro</p>\n<p>quanto la tua ragion parta o descriva.</p></div>\n\n<div class="stanza"><p>Per&ograve; ti prego, dolce padre caro,</p>\n<p>che mi dimostri amore, a cui reduci</p>\n<p>ogne buono operare e &rsquo;l suo contraro&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Drizza&raquo;, disse, &laquo;ver&rsquo; me l&rsquo;agute luci</p>\n<p>de lo &rsquo;ntelletto, e fieti manifesto</p>\n<p>l&rsquo;error de&rsquo; ciechi che si fanno duci.</p></div>\n\n<div class="stanza"><p>L&rsquo;animo, ch&rsquo;&egrave; creato ad amar presto,</p>\n<p>ad ogne cosa &egrave; mobile che piace,</p>\n<p>tosto che dal piacere in atto &egrave; desto.</p></div>\n\n<div class="stanza"><p>Vostra apprensiva da esser verace</p>\n<p>tragge intenzione, e dentro a voi la spiega,</p>\n<p>s&igrave; che l&rsquo;animo ad essa volger face;</p></div>\n\n<div class="stanza"><p>e se, rivolto, inver&rsquo; di lei si piega,</p>\n<p>quel piegare &egrave; amor, quell&rsquo; &egrave; natura</p>\n<p>che per piacer di novo in voi si lega.</p></div>\n\n<div class="stanza"><p>Poi, come &rsquo;l foco movesi in altura</p>\n<p>per la sua forma ch&rsquo;&egrave; nata a salire</p>\n<p>l&agrave; dove pi&ugrave; in sua matera dura,</p></div>\n\n<div class="stanza"><p>cos&igrave; l&rsquo;animo preso entra in disire,</p>\n<p>ch&rsquo;&egrave; moto spiritale, e mai non posa</p>\n<p>fin che la cosa amata il fa gioire.</p></div>\n\n<div class="stanza"><p>Or ti puote apparer quant&rsquo; &egrave; nascosa</p>\n<p>la veritate a la gente ch&rsquo;avvera</p>\n<p>ciascun amore in s&eacute; laudabil cosa;</p></div>\n\n<div class="stanza"><p>per&ograve; che forse appar la sua matera</p>\n<p>sempre esser buona, ma non ciascun segno</p>\n<p>&egrave; buono, ancor che buona sia la cera&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Le tue parole e &rsquo;l mio seguace ingegno&raquo;,</p>\n<p>rispuos&rsquo; io lui, &laquo;m&rsquo;hanno amor discoverto,</p>\n<p>ma ci&ograve; m&rsquo;ha fatto di dubbiar pi&ugrave; pregno;</p></div>\n\n<div class="stanza"><p>ch&eacute;, s&rsquo;amore &egrave; di fuori a noi offerto</p>\n<p>e l&rsquo;anima non va con altro piede,</p>\n<p>se dritta o torta va, non &egrave; suo merto&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;Quanto ragion qui vede,</p>\n<p>dir ti poss&rsquo; io; da indi in l&agrave; t&rsquo;aspetta</p>\n<p>pur a Beatrice, ch&rsquo;&egrave; opra di fede.</p></div>\n\n<div class="stanza"><p>Ogne forma sustanz&iuml;al, che setta</p>\n<p>&egrave; da matera ed &egrave; con lei unita,</p>\n<p>specifica vertute ha in s&eacute; colletta,</p></div>\n\n<div class="stanza"><p>la qual sanza operar non &egrave; sentita,</p>\n<p>n&eacute; si dimostra mai che per effetto,</p>\n<p>come per verdi fronde in pianta vita.</p></div>\n\n<div class="stanza"><p>Per&ograve;, l&agrave; onde vegna lo &rsquo;ntelletto</p>\n<p>de le prime notizie, omo non sape,</p>\n<p>e de&rsquo; primi appetibili l&rsquo;affetto,</p></div>\n\n<div class="stanza"><p>che sono in voi s&igrave; come studio in ape</p>\n<p>di far lo mele; e questa prima voglia</p>\n<p>merto di lode o di biasmo non cape.</p></div>\n\n<div class="stanza"><p>Or perch&eacute; a questa ogn&rsquo; altra si raccoglia,</p>\n<p>innata v&rsquo;&egrave; la virt&ugrave; che consiglia,</p>\n<p>e de l&rsquo;assenso de&rsquo; tener la soglia.</p></div>\n\n<div class="stanza"><p>Quest&rsquo; &egrave; &rsquo;l principio l&agrave; onde si piglia</p>\n<p>ragion di meritare in voi, secondo</p>\n<p>che buoni e rei amori accoglie e viglia.</p></div>\n\n<div class="stanza"><p>Color che ragionando andaro al fondo,</p>\n<p>s&rsquo;accorser d&rsquo;esta innata libertate;</p>\n<p>per&ograve; moralit&agrave; lasciaro al mondo.</p></div>\n\n<div class="stanza"><p>Onde, poniam che di necessitate</p>\n<p>surga ogne amor che dentro a voi s&rsquo;accende,</p>\n<p>di ritenerlo &egrave; in voi la podestate.</p></div>\n\n<div class="stanza"><p>La nobile virt&ugrave; Beatrice intende</p>\n<p>per lo libero arbitrio, e per&ograve; guarda</p>\n<p>che l&rsquo;abbi a mente, s&rsquo;a parlar ten prende&raquo;.</p></div>\n\n<div class="stanza"><p>La luna, quasi a mezza notte tarda,</p>\n<p>facea le stelle a noi parer pi&ugrave; rade,</p>\n<p>fatta com&rsquo; un secchion che tuttor arda;</p></div>\n\n<div class="stanza"><p>e correa contro &rsquo;l ciel per quelle strade</p>\n<p>che &rsquo;l sole infiamma allor che quel da Roma</p>\n<p>tra &rsquo; Sardi e &rsquo; Corsi il vede quando cade.</p></div>\n\n<div class="stanza"><p>E quell&rsquo; ombra gentil per cui si noma</p>\n<p>Pietola pi&ugrave; che villa mantoana,</p>\n<p>del mio carcar diposta avea la soma;</p></div>\n\n<div class="stanza"><p>per ch&rsquo;io, che la ragione aperta e piana</p>\n<p>sovra le mie quistioni avea ricolta,</p>\n<p>stava com&rsquo; om che sonnolento vana.</p></div>\n\n<div class="stanza"><p>Ma questa sonnolenza mi fu tolta</p>\n<p>subitamente da gente che dopo</p>\n<p>le nostre spalle a noi era gi&agrave; volta.</p></div>\n\n<div class="stanza"><p>E quale Ismeno gi&agrave; vide e Asopo</p>\n<p>lungo di s&egrave; di notte furia e calca,</p>\n<p>pur che i Teban di Bacco avesser uopo,</p></div>\n\n<div class="stanza"><p>cotal per quel giron suo passo falca,</p>\n<p>per quel ch&rsquo;io vidi di color, venendo,</p>\n<p>cui buon volere e giusto amor cavalca.</p></div>\n\n<div class="stanza"><p>Tosto fur sovr&rsquo; a noi, perch&eacute; correndo</p>\n<p>si movea tutta quella turba magna;</p>\n<p>e due dinanzi gridavan piangendo:</p></div>\n\n<div class="stanza"><p>&laquo;Maria corse con fretta a la montagna;</p>\n<p>e Cesare, per soggiogare Ilerda,</p>\n<p>punse Marsilia e poi corse in Ispagna&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Ratto, ratto, che &rsquo;l tempo non si perda</p>\n<p>per poco amor&raquo;, gridavan li altri appresso,</p>\n<p>&laquo;che studio di ben far grazia rinverda&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O gente in cui fervore aguto adesso</p>\n<p>ricompie forse negligenza e indugio</p>\n<p>da voi per tepidezza in ben far messo,</p></div>\n\n<div class="stanza"><p>questi che vive, e certo i&rsquo; non vi bugio,</p>\n<p>vuole andar s&ugrave;, pur che &rsquo;l sol ne riluca;</p>\n<p>per&ograve; ne dite ond&rsquo; &egrave; presso il pertugio&raquo;.</p></div>\n\n<div class="stanza"><p>Parole furon queste del mio duca;</p>\n<p>e un di quelli spirti disse: &laquo;Vieni</p>\n<p>di retro a noi, e troverai la buca.</p></div>\n\n<div class="stanza"><p>Noi siam di voglia a muoverci s&igrave; pieni,</p>\n<p>che restar non potem; per&ograve; perdona,</p>\n<p>se villania nostra giustizia tieni.</p></div>\n\n<div class="stanza"><p>Io fui abate in San Zeno a Verona</p>\n<p>sotto lo &rsquo;mperio del buon Barbarossa,</p>\n<p>di cui dolente ancor Milan ragiona.</p></div>\n\n<div class="stanza"><p>E tale ha gi&agrave; l&rsquo;un pi&egrave; dentro la fossa,</p>\n<p>che tosto pianger&agrave; quel monastero,</p>\n<p>e tristo fia d&rsquo;avere avuta possa;</p></div>\n\n<div class="stanza"><p>perch&eacute; suo figlio, mal del corpo intero,</p>\n<p>e de la mente peggio, e che mal nacque,</p>\n<p>ha posto in loco di suo pastor vero&raquo;.</p></div>\n\n<div class="stanza"><p>Io non so se pi&ugrave; disse o s&rsquo;ei si tacque,</p>\n<p>tant&rsquo; era gi&agrave; di l&agrave; da noi trascorso;</p>\n<p>ma questo intesi, e ritener mi piacque.</p></div>\n\n<div class="stanza"><p>E quei che m&rsquo;era ad ogne uopo soccorso</p>\n<p>disse: &laquo;Volgiti qua: vedine due</p>\n<p>venir dando a l&rsquo;accid&iuml;a di morso&raquo;.</p></div>\n\n<div class="stanza"><p>Di retro a tutti dicean: &laquo;Prima fue</p>\n<p>morta la gente a cui il mar s&rsquo;aperse,</p>\n<p>che vedesse Iordan le rede sue.</p></div>\n\n<div class="stanza"><p>E quella che l&rsquo;affanno non sofferse</p>\n<p>fino a la fine col figlio d&rsquo;Anchise,</p>\n<p>s&eacute; stessa a vita sanza gloria offerse&raquo;.</p></div>\n\n<div class="stanza"><p>Poi quando fuor da noi tanto divise</p>\n<p>quell&rsquo; ombre, che veder pi&ugrave; non potiersi,</p>\n<p>novo pensiero dentro a me si mise,</p></div>\n\n<div class="stanza"><p>del qual pi&ugrave; altri nacquero e diversi;</p>\n<p>e tanto d&rsquo;uno in altro vaneggiai,</p>\n<p>che li occhi per vaghezza ricopersi,</p></div>\n\n<div class="stanza"><p>e &rsquo;l pensamento in sogno trasmutai.</p></div>','<p class="cantohead">Canto XIX</p>\n\n<div class="stanza"><p>Ne l&rsquo;ora che non pu&ograve; &rsquo;l calor d&iuml;urno</p>\n<p>intepidar pi&ugrave; &rsquo;l freddo de la luna,</p>\n<p>vinto da terra, e talor da Saturno</p></div>\n\n<div class="stanza"><p>&mdash;quando i geomanti lor Maggior Fortuna</p>\n<p>veggiono in or&iuml;ente, innanzi a l&rsquo;alba,</p>\n<p>surger per via che poco le sta bruna&mdash;,</p></div>\n\n<div class="stanza"><p>mi venne in sogno una femmina balba,</p>\n<p>ne li occhi guercia, e sovra i pi&egrave; distorta,</p>\n<p>con le man monche, e di colore scialba.</p></div>\n\n<div class="stanza"><p>Io la mirava; e come &rsquo;l sol conforta</p>\n<p>le fredde membra che la notte aggrava,</p>\n<p>cos&igrave; lo sguardo mio le facea scorta</p></div>\n\n<div class="stanza"><p>la lingua, e poscia tutta la drizzava</p>\n<p>in poco d&rsquo;ora, e lo smarrito volto,</p>\n<p>com&rsquo; amor vuol, cos&igrave; le colorava.</p></div>\n\n<div class="stanza"><p>Poi ch&rsquo;ell&rsquo; avea &rsquo;l parlar cos&igrave; disciolto,</p>\n<p>cominciava a cantar s&igrave;, che con pena</p>\n<p>da lei avrei mio intento rivolto.</p></div>\n\n<div class="stanza"><p>&laquo;Io son&raquo;, cantava, &laquo;io son dolce serena,</p>\n<p>che &rsquo; marinari in mezzo mar dismago;</p>\n<p>tanto son di piacere a sentir piena!</p></div>\n\n<div class="stanza"><p>Io volsi Ulisse del suo cammin vago</p>\n<p>al canto mio; e qual meco s&rsquo;ausa,</p>\n<p>rado sen parte; s&igrave; tutto l&rsquo;appago!&raquo;.</p></div>\n\n<div class="stanza"><p>Ancor non era sua bocca richiusa,</p>\n<p>quand&rsquo; una donna apparve santa e presta</p>\n<p>lunghesso me per far colei confusa.</p></div>\n\n<div class="stanza"><p>&laquo;O Virgilio, Virgilio, chi &egrave; questa?&raquo;,</p>\n<p>fieramente dicea; ed el ven&igrave;a</p>\n<p>con li occhi fitti pur in quella onesta.</p></div>\n\n<div class="stanza"><p>L&rsquo;altra prendea, e dinanzi l&rsquo;apria</p>\n<p>fendendo i drappi, e mostravami &rsquo;l ventre;</p>\n<p>quel mi svegli&ograve; col puzzo che n&rsquo;uscia.</p></div>\n\n<div class="stanza"><p>Io mossi li occhi, e &rsquo;l buon maestro: &laquo;Almen tre</p>\n<p>voci t&rsquo;ho messe!&raquo;, dicea, &laquo;Surgi e vieni;</p>\n<p>troviam l&rsquo;aperta per la qual tu entre&raquo;.</p></div>\n\n<div class="stanza"><p>S&ugrave; mi levai, e tutti eran gi&agrave; pieni</p>\n<p>de l&rsquo;alto d&igrave; i giron del sacro monte,</p>\n<p>e andavam col sol novo a le reni.</p></div>\n\n<div class="stanza"><p>Seguendo lui, portava la mia fronte</p>\n<p>come colui che l&rsquo;ha di pensier carca,</p>\n<p>che fa di s&eacute; un mezzo arco di ponte;</p></div>\n\n<div class="stanza"><p>quand&rsquo; io udi&rsquo; &laquo;Venite; qui si varca&raquo;</p>\n<p>parlare in modo soave e benigno,</p>\n<p>qual non si sente in questa mortal marca.</p></div>\n\n<div class="stanza"><p>Con l&rsquo;ali aperte, che parean di cigno,</p>\n<p>volseci in s&ugrave; colui che s&igrave; parlonne</p>\n<p>tra due pareti del duro macigno.</p></div>\n\n<div class="stanza"><p>Mosse le penne poi e ventilonne,</p>\n<p>&lsquo;Qui lugent&rsquo; affermando esser beati,</p>\n<p>ch&rsquo;avran di consolar l&rsquo;anime donne.</p></div>\n\n<div class="stanza"><p>&laquo;Che hai che pur inver&rsquo; la terra guati?&raquo;,</p>\n<p>la guida mia incominci&ograve; a dirmi,</p>\n<p>poco amendue da l&rsquo;angel sormontati.</p></div>\n\n<div class="stanza"><p>E io: &laquo;Con tanta sospeccion fa irmi</p>\n<p>novella vis&iuml;on ch&rsquo;a s&eacute; mi piega,</p>\n<p>s&igrave; ch&rsquo;io non posso dal pensar partirmi&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Vedesti&raquo;, disse, &laquo;quell&rsquo;antica strega</p>\n<p>che sola sovr&rsquo; a noi omai si piagne;</p>\n<p>vedesti come l&rsquo;uom da lei si slega.</p></div>\n\n<div class="stanza"><p>Bastiti, e batti a terra le calcagne;</p>\n<p>li occhi rivolgi al logoro che gira</p>\n<p>lo rege etterno con le rote magne&raquo;.</p></div>\n\n<div class="stanza"><p>Quale &rsquo;l falcon, che prima a&rsquo; pi&eacute; si mira,</p>\n<p>indi si volge al grido e si protende</p>\n<p>per lo disio del pasto che l&agrave; il tira,</p></div>\n\n<div class="stanza"><p>tal mi fec&rsquo; io; e tal, quanto si fende</p>\n<p>la roccia per dar via a chi va suso,</p>\n<p>n&rsquo;andai infin dove &rsquo;l cerchiar si prende.</p></div>\n\n<div class="stanza"><p>Com&rsquo; io nel quinto giro fui dischiuso,</p>\n<p>vidi gente per esso che piangea,</p>\n<p>giacendo a terra tutta volta in giuso.</p></div>\n\n<div class="stanza"><p>&lsquo;Adhaesit pavimento anima mea&rsquo;</p>\n<p>sentia dir lor con s&igrave; alti sospiri,</p>\n<p>che la parola a pena s&rsquo;intendea.</p></div>\n\n<div class="stanza"><p>&laquo;O eletti di Dio, li cui soffriri</p>\n<p>e giustizia e speranza fa men duri,</p>\n<p>drizzate noi verso li alti saliri&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Se voi venite dal giacer sicuri,</p>\n<p>e volete trovar la via pi&ugrave; tosto,</p>\n<p>le vostre destre sien sempre di fori&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; preg&ograve; &rsquo;l poeta, e s&igrave; risposto</p>\n<p>poco dinanzi a noi ne fu; per ch&rsquo;io</p>\n<p>nel parlare avvisai l&rsquo;altro nascosto,</p></div>\n\n<div class="stanza"><p>e volsi li occhi a li occhi al segnor mio:</p>\n<p>ond&rsquo; elli m&rsquo;assent&igrave; con lieto cenno</p>\n<p>ci&ograve; che chiedea la vista del disio.</p></div>\n\n<div class="stanza"><p>Poi ch&rsquo;io potei di me fare a mio senno,</p>\n<p>trassimi sovra quella creatura</p>\n<p>le cui parole pria notar mi fenno,</p></div>\n\n<div class="stanza"><p>dicendo: &laquo;Spirto in cui pianger matura</p>\n<p>quel sanza &rsquo;l quale a Dio tornar non p&ograve;ssi,</p>\n<p>sosta un poco per me tua maggior cura.</p></div>\n\n<div class="stanza"><p>Chi fosti e perch&eacute; v&ograve;lti avete i dossi</p>\n<p>al s&ugrave;, mi d&igrave;, e se vuo&rsquo; ch&rsquo;io t&rsquo;impetri</p>\n<p>cosa di l&agrave; ond&rsquo; io vivendo mossi&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;Perch&eacute; i nostri diretri</p>\n<p>rivolga il cielo a s&eacute;, saprai; ma prima</p>\n<p>scias quod ego fui successor Petri.</p></div>\n\n<div class="stanza"><p>Intra S&iuml;estri e Chiaveri s&rsquo;adima</p>\n<p>una fiumana bella, e del suo nome</p>\n<p>lo titol del mio sangue fa sua cima.</p></div>\n\n<div class="stanza"><p>Un mese e poco pi&ugrave; prova&rsquo; io come</p>\n<p>pesa il gran manto a chi dal fango il guarda,</p>\n<p>che piuma sembran tutte l&rsquo;altre some.</p></div>\n\n<div class="stanza"><p>La mia convers&iuml;one, om&egrave;!, fu tarda;</p>\n<p>ma, come fatto fui roman pastore,</p>\n<p>cos&igrave; scopersi la vita bugiarda.</p></div>\n\n<div class="stanza"><p>Vidi che l&igrave; non s&rsquo;acquetava il core,</p>\n<p>n&eacute; pi&ugrave; salir potiesi in quella vita;</p>\n<p>per che di questa in me s&rsquo;accese amore.</p></div>\n\n<div class="stanza"><p>Fino a quel punto misera e partita</p>\n<p>da Dio anima fui, del tutto avara;</p>\n<p>or, come vedi, qui ne son punita.</p></div>\n\n<div class="stanza"><p>Quel ch&rsquo;avarizia fa, qui si dichiara</p>\n<p>in purgazion de l&rsquo;anime converse;</p>\n<p>e nulla pena il monte ha pi&ugrave; amara.</p></div>\n\n<div class="stanza"><p>S&igrave; come l&rsquo;occhio nostro non s&rsquo;aderse</p>\n<p>in alto, fisso a le cose terrene,</p>\n<p>cos&igrave; giustizia qui a terra il merse.</p></div>\n\n<div class="stanza"><p>Come avarizia spense a ciascun bene</p>\n<p>lo nostro amore, onde operar perd&eacute;si,</p>\n<p>cos&igrave; giustizia qui stretti ne tene,</p></div>\n\n<div class="stanza"><p>ne&rsquo; piedi e ne le man legati e presi;</p>\n<p>e quanto fia piacer del giusto Sire,</p>\n<p>tanto staremo immobili e distesi&raquo;.</p></div>\n\n<div class="stanza"><p>Io m&rsquo;era inginocchiato e volea dire;</p>\n<p>ma com&rsquo; io cominciai ed el s&rsquo;accorse,</p>\n<p>solo ascoltando, del mio reverire,</p></div>\n\n<div class="stanza"><p>&laquo;Qual cagion&raquo;, disse, &laquo;in gi&ugrave; cos&igrave; ti torse?&raquo;.</p>\n<p>E io a lui: &laquo;Per vostra dignitate</p>\n<p>mia cosc&iuml;enza dritto mi rimorse&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Drizza le gambe, l&egrave;vati s&ugrave;, frate!&raquo;,</p>\n<p>rispuose; &laquo;non errar: conservo sono</p>\n<p>teco e con li altri ad una podestate.</p></div>\n\n<div class="stanza"><p>Se mai quel santo evangelico suono</p>\n<p>che dice &lsquo;Neque nubent&rsquo; intendesti,</p>\n<p>ben puoi veder perch&rsquo; io cos&igrave; ragiono.</p></div>\n\n<div class="stanza"><p>Vattene omai: non vo&rsquo; che pi&ugrave; t&rsquo;arresti;</p>\n<p>ch&eacute; la tua stanza mio pianger disagia,</p>\n<p>col qual maturo ci&ograve; che tu dicesti.</p></div>\n\n<div class="stanza"><p>Nepote ho io di l&agrave; c&rsquo;ha nome Alagia,</p>\n<p>buona da s&eacute;, pur che la nostra casa</p>\n<p>non faccia lei per essempro malvagia;</p></div>\n\n<div class="stanza"><p>e questa sola di l&agrave; m&rsquo;&egrave; rimasa&raquo;.</p></div>','<p class="cantohead">Canto XX</p>\n\n<div class="stanza"><p>Contra miglior voler voler mal pugna;</p>\n<p>onde contra &rsquo;l piacer mio, per piacerli,</p>\n<p>trassi de l&rsquo;acqua non sazia la spugna.</p></div>\n\n<div class="stanza"><p>Mossimi; e &rsquo;l duca mio si mosse per li</p>\n<p>luoghi spediti pur lungo la roccia,</p>\n<p>come si va per muro stretto a&rsquo; merli;</p></div>\n\n<div class="stanza"><p>ch&eacute; la gente che fonde a goccia a goccia</p>\n<p>per li occhi il mal che tutto &rsquo;l mondo occupa,</p>\n<p>da l&rsquo;altra parte in fuor troppo s&rsquo;approccia.</p></div>\n\n<div class="stanza"><p>Maladetta sie tu, antica lupa,</p>\n<p>che pi&ugrave; che tutte l&rsquo;altre bestie hai preda</p>\n<p>per la tua fame sanza fine cupa!</p></div>\n\n<div class="stanza"><p>O ciel, nel cui girar par che si creda</p>\n<p>le condizion di qua gi&ugrave; trasmutarsi,</p>\n<p>quando verr&agrave; per cui questa disceda?</p></div>\n\n<div class="stanza"><p>Noi andavam con passi lenti e scarsi,</p>\n<p>e io attento a l&rsquo;ombre, ch&rsquo;i&rsquo; sentia</p>\n<p>pietosamente piangere e lagnarsi;</p></div>\n\n<div class="stanza"><p>e per ventura udi&rsquo; &laquo;Dolce Maria!&raquo;</p>\n<p>dinanzi a noi chiamar cos&igrave; nel pianto</p>\n<p>come fa donna che in parturir sia;</p></div>\n\n<div class="stanza"><p>e seguitar: &laquo;Povera fosti tanto,</p>\n<p>quanto veder si pu&ograve; per quello ospizio</p>\n<p>dove sponesti il tuo portato santo&raquo;.</p></div>\n\n<div class="stanza"><p>Seguentemente intesi: &laquo;O buon Fabrizio,</p>\n<p>con povert&agrave; volesti anzi virtute</p>\n<p>che gran ricchezza posseder con vizio&raquo;.</p></div>\n\n<div class="stanza"><p>Queste parole m&rsquo;eran s&igrave; piaciute,</p>\n<p>ch&rsquo;io mi trassi oltre per aver contezza</p>\n<p>di quello spirto onde parean venute.</p></div>\n\n<div class="stanza"><p>Esso parlava ancor de la larghezza</p>\n<p>che fece Niccol&ograve; a le pulcelle,</p>\n<p>per condurre ad onor lor giovinezza.</p></div>\n\n<div class="stanza"><p>&laquo;O anima che tanto ben favelle,</p>\n<p>dimmi chi fosti&raquo;, dissi, &laquo;e perch&eacute; sola</p>\n<p>tu queste degne lode rinovelle.</p></div>\n\n<div class="stanza"><p>Non fia sanza merc&eacute; la tua parola,</p>\n<p>s&rsquo;io ritorno a compi&eacute;r lo cammin corto</p>\n<p>di quella vita ch&rsquo;al termine vola&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli: &laquo;Io ti dir&ograve;, non per conforto</p>\n<p>ch&rsquo;io attenda di l&agrave;, ma perch&eacute; tanta</p>\n<p>grazia in te luce prima che sie morto.</p></div>\n\n<div class="stanza"><p>Io fui radice de la mala pianta</p>\n<p>che la terra cristiana tutta aduggia,</p>\n<p>s&igrave; che buon frutto rado se ne schianta.</p></div>\n\n<div class="stanza"><p>Ma se Doagio, Lilla, Guanto e Bruggia</p>\n<p>potesser, tosto ne saria vendetta;</p>\n<p>e io la cheggio a lui che tutto giuggia.</p></div>\n\n<div class="stanza"><p>Chiamato fui di l&agrave; Ugo Ciappetta;</p>\n<p>di me son nati i Filippi e i Luigi</p>\n<p>per cui novellamente &egrave; Francia retta.</p></div>\n\n<div class="stanza"><p>Figliuol fu&rsquo; io d&rsquo;un beccaio di Parigi:</p>\n<p>quando li regi antichi venner meno</p>\n<p>tutti, fuor ch&rsquo;un renduto in panni bigi,</p></div>\n\n<div class="stanza"><p>trova&rsquo;mi stretto ne le mani il freno</p>\n<p>del governo del regno, e tanta possa</p>\n<p>di nuovo acquisto, e s&igrave; d&rsquo;amici pieno,</p></div>\n\n<div class="stanza"><p>ch&rsquo;a la corona vedova promossa</p>\n<p>la testa di mio figlio fu, dal quale</p>\n<p>cominciar di costor le sacrate ossa.</p></div>\n\n<div class="stanza"><p>Mentre che la gran dota provenzale</p>\n<p>al sangue mio non tolse la vergogna,</p>\n<p>poco valea, ma pur non facea male.</p></div>\n\n<div class="stanza"><p>L&igrave; cominci&ograve; con forza e con menzogna</p>\n<p>la sua rapina; e poscia, per ammenda,</p>\n<p>Pont&igrave; e Normandia prese e Guascogna.</p></div>\n\n<div class="stanza"><p>Carlo venne in Italia e, per ammenda,</p>\n<p>vittima f&eacute; di Curradino; e poi</p>\n<p>ripinse al ciel Tommaso, per ammenda.</p></div>\n\n<div class="stanza"><p>Tempo vegg&rsquo; io, non molto dopo ancoi,</p>\n<p>che tragge un altro Carlo fuor di Francia,</p>\n<p>per far conoscer meglio e s&eacute; e &rsquo; suoi.</p></div>\n\n<div class="stanza"><p>Sanz&rsquo; arme n&rsquo;esce e solo con la lancia</p>\n<p>con la qual giostr&ograve; Giuda, e quella ponta</p>\n<p>s&igrave;, ch&rsquo;a Fiorenza fa scoppiar la pancia.</p></div>\n\n<div class="stanza"><p>Quindi non terra, ma peccato e onta</p>\n<p>guadagner&agrave;, per s&eacute; tanto pi&ugrave; grave,</p>\n<p>quanto pi&ugrave; lieve simil danno conta.</p></div>\n\n<div class="stanza"><p>L&rsquo;altro, che gi&agrave; usc&igrave; preso di nave,</p>\n<p>veggio vender sua figlia e patteggiarne</p>\n<p>come fanno i corsar de l&rsquo;altre schiave.</p></div>\n\n<div class="stanza"><p>O avarizia, che puoi tu pi&ugrave; farne,</p>\n<p>poscia c&rsquo;ha&rsquo; il mio sangue a te s&igrave; tratto,</p>\n<p>che non si cura de la propria carne?</p></div>\n\n<div class="stanza"><p>Perch&eacute; men paia il mal futuro e &rsquo;l fatto,</p>\n<p>veggio in Alagna intrar lo fiordaliso,</p>\n<p>e nel vicario suo Cristo esser catto.</p></div>\n\n<div class="stanza"><p>Veggiolo un&rsquo;altra volta esser deriso;</p>\n<p>veggio rinovellar l&rsquo;aceto e &rsquo;l fiele,</p>\n<p>e tra vivi ladroni esser anciso.</p></div>\n\n<div class="stanza"><p>Veggio il novo Pilato s&igrave; crudele,</p>\n<p>che ci&ograve; nol sazia, ma sanza decreto</p>\n<p>portar nel Tempio le cupide vele.</p></div>\n\n<div class="stanza"><p>O Segnor mio, quando sar&ograve; io lieto</p>\n<p>a veder la vendetta che, nascosa,</p>\n<p>fa dolce l&rsquo;ira tua nel tuo secreto?</p></div>\n\n<div class="stanza"><p>Ci&ograve; ch&rsquo;io dicea di quell&rsquo; unica sposa</p>\n<p>de lo Spirito Santo e che ti fece</p>\n<p>verso me volger per alcuna chiosa,</p></div>\n\n<div class="stanza"><p>tanto &egrave; risposto a tutte nostre prece</p>\n<p>quanto &rsquo;l d&igrave; dura; ma com&rsquo; el s&rsquo;annotta,</p>\n<p>contrario suon prendemo in quella vece.</p></div>\n\n<div class="stanza"><p>Noi repetiam Pigmal&iuml;on allotta,</p>\n<p>cui traditore e ladro e paricida</p>\n<p>fece la voglia sua de l&rsquo;oro ghiotta;</p></div>\n\n<div class="stanza"><p>e la miseria de l&rsquo;avaro Mida,</p>\n<p>che segu&igrave; a la sua dimanda gorda,</p>\n<p>per la qual sempre convien che si rida.</p></div>\n\n<div class="stanza"><p>Del folle Ac&agrave;n ciascun poi si ricorda,</p>\n<p>come fur&ograve; le spoglie, s&igrave; che l&rsquo;ira</p>\n<p>di Ios&uuml;&egrave; qui par ch&rsquo;ancor lo morda.</p></div>\n\n<div class="stanza"><p>Indi accusiam col marito Saffira;</p>\n<p>lodiam i calci ch&rsquo;ebbe El&iuml;odoro;</p>\n<p>e in infamia tutto &rsquo;l monte gira</p></div>\n\n<div class="stanza"><p>Polinest&ograve;r ch&rsquo;ancise Polidoro;</p>\n<p>ultimamente ci si grida: &ldquo;Crasso,</p>\n<p>dilci, che &rsquo;l sai: di che sapore &egrave; l&rsquo;oro?&rdquo;.</p></div>\n\n<div class="stanza"><p>Talor parla l&rsquo;uno alto e l&rsquo;altro basso,</p>\n<p>secondo l&rsquo;affezion ch&rsquo;ad ir ci sprona</p>\n<p>ora a maggiore e ora a minor passo:</p></div>\n\n<div class="stanza"><p>per&ograve; al ben che &rsquo;l d&igrave; ci si ragiona,</p>\n<p>dianzi non era io sol; ma qui da presso</p>\n<p>non alzava la voce altra persona&raquo;.</p></div>\n\n<div class="stanza"><p>Noi eravam partiti gi&agrave; da esso,</p>\n<p>e brigavam di soverchiar la strada</p>\n<p>tanto quanto al poder n&rsquo;era permesso,</p></div>\n\n<div class="stanza"><p>quand&rsquo; io senti&rsquo;, come cosa che cada,</p>\n<p>tremar lo monte; onde mi prese un gelo</p>\n<p>qual prender suol colui ch&rsquo;a morte vada.</p></div>\n\n<div class="stanza"><p>Certo non si scoteo s&igrave; forte Delo,</p>\n<p>pria che Latona in lei facesse &rsquo;l nido</p>\n<p>a parturir li due occhi del cielo.</p></div>\n\n<div class="stanza"><p>Poi cominci&ograve; da tutte parti un grido</p>\n<p>tal, che &rsquo;l maestro inverso me si feo,</p>\n<p>dicendo: &laquo;Non dubbiar, mentr&rsquo; io ti guido&raquo;.</p></div>\n\n<div class="stanza"><p>&lsquo;Glor&iuml;a in excelsis&rsquo; tutti &lsquo;Deo&rsquo;</p>\n<p>dicean, per quel ch&rsquo;io da&rsquo; vicin compresi,</p>\n<p>onde intender lo grido si poteo.</p></div>\n\n<div class="stanza"><p>No&rsquo; istavamo immobili e sospesi</p>\n<p>come i pastor che prima udir quel canto,</p>\n<p>fin che &rsquo;l tremar cess&ograve; ed el compi&eacute;si.</p></div>\n\n<div class="stanza"><p>Poi ripigliammo nostro cammin santo,</p>\n<p>guardando l&rsquo;ombre che giacean per terra,</p>\n<p>tornate gi&agrave; in su l&rsquo;usato pianto.</p></div>\n\n<div class="stanza"><p>Nulla ignoranza mai con tanta guerra</p>\n<p>mi f&eacute; desideroso di sapere,</p>\n<p>se la memoria mia in ci&ograve; non erra,</p></div>\n\n<div class="stanza"><p>quanta pareami allor, pensando, avere;</p>\n<p>n&eacute; per la fretta dimandare er&rsquo; oso,</p>\n<p>n&eacute; per me l&igrave; potea cosa vedere:</p></div>\n\n<div class="stanza"><p>cos&igrave; m&rsquo;andava timido e pensoso.</p></div>','<p class="cantohead">Canto XXI</p>\n\n<div class="stanza"><p>La sete natural che mai non sazia</p>\n<p>se non con l&rsquo;acqua onde la femminetta</p>\n<p>samaritana domand&ograve; la grazia,</p></div>\n\n<div class="stanza"><p>mi travagliava, e pungeami la fretta</p>\n<p>per la &rsquo;mpacciata via dietro al mio duca,</p>\n<p>e condoleami a la giusta vendetta.</p></div>\n\n<div class="stanza"><p>Ed ecco, s&igrave; come ne scrive Luca</p>\n<p>che Cristo apparve a&rsquo; due ch&rsquo;erano in via,</p>\n<p>gi&agrave; surto fuor de la sepulcral buca,</p></div>\n\n<div class="stanza"><p>ci apparve un&rsquo;ombra, e dietro a noi ven&igrave;a,</p>\n<p>dal pi&egrave; guardando la turba che giace;</p>\n<p>n&eacute; ci addemmo di lei, s&igrave; parl&ograve; pria,</p></div>\n\n<div class="stanza"><p>dicendo: &laquo;O frati miei, Dio vi dea pace&raquo;.</p>\n<p>Noi ci volgemmo s&ugrave;biti, e Virgilio</p>\n<p>rend&eacute;li &rsquo;l cenno ch&rsquo;a ci&ograve; si conface.</p></div>\n\n<div class="stanza"><p>Poi cominci&ograve;: &laquo;Nel beato concilio</p>\n<p>ti ponga in pace la verace corte</p>\n<p>che me rilega ne l&rsquo;etterno essilio&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Come!&raquo;, diss&rsquo; elli, e parte andavam forte:</p>\n<p>&laquo;se voi siete ombre che Dio s&ugrave; non degni,</p>\n<p>chi v&rsquo;ha per la sua scala tanto scorte?&raquo;.</p></div>\n\n<div class="stanza"><p>E &rsquo;l dottor mio: &laquo;Se tu riguardi a&rsquo; segni</p>\n<p>che questi porta e che l&rsquo;angel profila,</p>\n<p>ben vedrai che coi buon convien ch&rsquo;e&rsquo; regni.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; lei che d&igrave; e notte fila</p>\n<p>non li avea tratta ancora la conocchia</p>\n<p>che Cloto impone a ciascuno e compila,</p></div>\n\n<div class="stanza"><p>l&rsquo;anima sua, ch&rsquo;&egrave; tua e mia serocchia,</p>\n<p>venendo s&ugrave;, non potea venir sola,</p>\n<p>per&ograve; ch&rsquo;al nostro modo non adocchia.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; io fui tratto fuor de l&rsquo;ampia gola</p>\n<p>d&rsquo;inferno per mostrarli, e mosterrolli</p>\n<p>oltre, quanto &rsquo;l potr&agrave; menar mia scola.</p></div>\n\n<div class="stanza"><p>Ma dimmi, se tu sai, perch&eacute; tai crolli</p>\n<p>di&egrave; dianzi &rsquo;l monte, e perch&eacute; tutto ad una</p>\n<p>parve gridare infino a&rsquo; suoi pi&egrave; molli&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; mi di&egrave;, dimandando, per la cruna</p>\n<p>del mio disio, che pur con la speranza</p>\n<p>si fece la mia sete men digiuna.</p></div>\n\n<div class="stanza"><p>Quei cominci&ograve;: &laquo;Cosa non &egrave; che sanza</p>\n<p>ordine senta la relig&iuml;one</p>\n<p>de la montagna, o che sia fuor d&rsquo;usanza.</p></div>\n\n<div class="stanza"><p>Libero &egrave; qui da ogne alterazione:</p>\n<p>di quel che &rsquo;l ciel da s&eacute; in s&eacute; riceve</p>\n<p>esser ci puote, e non d&rsquo;altro, cagione.</p></div>\n\n<div class="stanza"><p>Per che non pioggia, non grando, non neve,</p>\n<p>non rugiada, non brina pi&ugrave; s&ugrave; cade</p>\n<p>che la scaletta di tre gradi breve;</p></div>\n\n<div class="stanza"><p>nuvole spesse non paion n&eacute; rade,</p>\n<p>n&eacute; coruscar, n&eacute; figlia di Taumante,</p>\n<p>che di l&agrave; cangia sovente contrade;</p></div>\n\n<div class="stanza"><p>secco vapor non surge pi&ugrave; avante</p>\n<p>ch&rsquo;al sommo d&rsquo;i tre gradi ch&rsquo;io parlai,</p>\n<p>dov&rsquo; ha &rsquo;l vicario di Pietro le piante.</p></div>\n\n<div class="stanza"><p>Trema forse pi&ugrave; gi&ugrave; poco o assai;</p>\n<p>ma per vento che &rsquo;n terra si nasconda,</p>\n<p>non so come, qua s&ugrave; non trem&ograve; mai.</p></div>\n\n<div class="stanza"><p>Tremaci quando alcuna anima monda</p>\n<p>sentesi, s&igrave; che surga o che si mova</p>\n<p>per salir s&ugrave;; e tal grido seconda.</p></div>\n\n<div class="stanza"><p>De la mondizia sol voler fa prova,</p>\n<p>che, tutto libero a mutar convento,</p>\n<p>l&rsquo;alma sorprende, e di voler le giova.</p></div>\n\n<div class="stanza"><p>Prima vuol ben, ma non lascia il talento</p>\n<p>che divina giustizia, contra voglia,</p>\n<p>come fu al peccar, pone al tormento.</p></div>\n\n<div class="stanza"><p>E io, che son giaciuto a questa doglia</p>\n<p>cinquecent&rsquo; anni e pi&ugrave;, pur mo sentii</p>\n<p>libera volont&agrave; di miglior soglia:</p></div>\n\n<div class="stanza"><p>per&ograve; sentisti il tremoto e li pii</p>\n<p>spiriti per lo monte render lode</p>\n<p>a quel Segnor, che tosto s&ugrave; li &rsquo;nvii&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; ne disse; e per&ograve; ch&rsquo;el si gode</p>\n<p>tanto del ber quant&rsquo; &egrave; grande la sete,</p>\n<p>non saprei dir quant&rsquo; el mi fece prode.</p></div>\n\n<div class="stanza"><p>E &rsquo;l savio duca: &laquo;Omai veggio la rete</p>\n<p>che qui vi &rsquo;mpiglia e come si scalappia,</p>\n<p>perch&eacute; ci trema e di che congaudete.</p></div>\n\n<div class="stanza"><p>Ora chi fosti, piacciati ch&rsquo;io sappia,</p>\n<p>e perch&eacute; tanti secoli giaciuto</p>\n<p>qui se&rsquo;, ne le parole tue mi cappia&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Nel tempo che &rsquo;l buon Tito, con l&rsquo;aiuto</p>\n<p>del sommo rege, vendic&ograve; le f&oacute;ra</p>\n<p>ond&rsquo; usc&igrave; &rsquo;l sangue per Giuda venduto,</p></div>\n\n<div class="stanza"><p>col nome che pi&ugrave; dura e pi&ugrave; onora</p>\n<p>era io di l&agrave;&raquo;, rispuose quello spirto,</p>\n<p>&laquo;famoso assai, ma non con fede ancora.</p></div>\n\n<div class="stanza"><p>Tanto fu dolce mio vocale spirto,</p>\n<p>che, tolosano, a s&eacute; mi trasse Roma,</p>\n<p>dove mertai le tempie ornar di mirto.</p></div>\n\n<div class="stanza"><p>Stazio la gente ancor di l&agrave; mi noma:</p>\n<p>cantai di Tebe, e poi del grande Achille;</p>\n<p>ma caddi in via con la seconda soma.</p></div>\n\n<div class="stanza"><p>Al mio ardor fuor seme le faville,</p>\n<p>che mi scaldar, de la divina fiamma</p>\n<p>onde sono allumati pi&ugrave; di mille;</p></div>\n\n<div class="stanza"><p>de l&rsquo;Ene&iuml;da dico, la qual mamma</p>\n<p>fummi, e fummi nutrice, poetando:</p>\n<p>sanz&rsquo; essa non fermai peso di dramma.</p></div>\n\n<div class="stanza"><p>E per esser vivuto di l&agrave; quando</p>\n<p>visse Virgilio, assentirei un sole</p>\n<p>pi&ugrave; che non deggio al mio uscir di bando&raquo;.</p></div>\n\n<div class="stanza"><p>Volser Virgilio a me queste parole</p>\n<p>con viso che, tacendo, disse &lsquo;Taci&rsquo;;</p>\n<p>ma non pu&ograve; tutto la virt&ugrave; che vuole;</p></div>\n\n<div class="stanza"><p>ch&eacute; riso e pianto son tanto seguaci</p>\n<p>a la passion di che ciascun si spicca,</p>\n<p>che men seguon voler ne&rsquo; pi&ugrave; veraci.</p></div>\n\n<div class="stanza"><p>Io pur sorrisi come l&rsquo;uom ch&rsquo;ammicca;</p>\n<p>per che l&rsquo;ombra si tacque, e riguardommi</p>\n<p>ne li occhi ove &rsquo;l sembiante pi&ugrave; si ficca;</p></div>\n\n<div class="stanza"><p>e &laquo;Se tanto labore in bene assommi&raquo;,</p>\n<p>disse, &laquo;perch&eacute; la tua faccia testeso</p>\n<p>un lampeggiar di riso dimostrommi?&raquo;.</p></div>\n\n<div class="stanza"><p>Or son io d&rsquo;una parte e d&rsquo;altra preso:</p>\n<p>l&rsquo;una mi fa tacer, l&rsquo;altra scongiura</p>\n<p>ch&rsquo;io dica; ond&rsquo; io sospiro, e sono inteso</p></div>\n\n<div class="stanza"><p>dal mio maestro, e &laquo;Non aver paura&raquo;,</p>\n<p>mi dice, &laquo;di parlar; ma parla e digli</p>\n<p>quel ch&rsquo;e&rsquo; dimanda con cotanta cura&raquo;.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; io: &laquo;Forse che tu ti maravigli,</p>\n<p>antico spirto, del rider ch&rsquo;io fei;</p>\n<p>ma pi&ugrave; d&rsquo;ammirazion vo&rsquo; che ti pigli.</p></div>\n\n<div class="stanza"><p>Questi che guida in alto li occhi miei,</p>\n<p>&egrave; quel Virgilio dal qual tu togliesti</p>\n<p>forte a cantar de li uomini e d&rsquo;i d&egrave;i.</p></div>\n\n<div class="stanza"><p>Se cagion altra al mio rider credesti,</p>\n<p>lasciala per non vera, ed esser credi</p>\n<p>quelle parole che di lui dicesti&raquo;.</p></div>\n\n<div class="stanza"><p>Gi&agrave; s&rsquo;inchinava ad abbracciar li piedi</p>\n<p>al mio dottor, ma el li disse: &laquo;Frate,</p>\n<p>non far, ch&eacute; tu se&rsquo; ombra e ombra vedi&raquo;.</p></div>\n\n<div class="stanza"><p>Ed ei surgendo: &laquo;Or puoi la quantitate</p>\n<p>comprender de l&rsquo;amor ch&rsquo;a te mi scalda,</p>\n<p>quand&rsquo; io dismento nostra vanitate,</p></div>\n\n<div class="stanza"><p>trattando l&rsquo;ombre come cosa salda&raquo;.</p></div>','<p class="cantohead">Canto XXII</p>\n\n<div class="stanza"><p>Gi&agrave; era l&rsquo;angel dietro a noi rimaso,</p>\n<p>l&rsquo;angel che n&rsquo;avea v&ograve;lti al sesto giro,</p>\n<p>avendomi dal viso un colpo raso;</p></div>\n\n<div class="stanza"><p>e quei c&rsquo;hanno a giustizia lor disiro</p>\n<p>detto n&rsquo;avea beati, e le sue voci</p>\n<p>con &lsquo;sitiunt&rsquo;, sanz&rsquo; altro, ci&ograve; forniro.</p></div>\n\n<div class="stanza"><p>E io pi&ugrave; lieve che per l&rsquo;altre foci</p>\n<p>m&rsquo;andava, s&igrave; che sanz&rsquo; alcun labore</p>\n<p>seguiva in s&ugrave; li spiriti veloci;</p></div>\n\n<div class="stanza"><p>quando Virgilio incominci&ograve;: &laquo;Amore,</p>\n<p>acceso di virt&ugrave;, sempre altro accese,</p>\n<p>pur che la fiamma sua paresse fore;</p></div>\n\n<div class="stanza"><p>onde da l&rsquo;ora che tra noi discese</p>\n<p>nel limbo de lo &rsquo;nferno Giovenale,</p>\n<p>che la tua affezion mi f&eacute; palese,</p></div>\n\n<div class="stanza"><p>mia benvoglienza inverso te fu quale</p>\n<p>pi&ugrave; strinse mai di non vista persona,</p>\n<p>s&igrave; ch&rsquo;or mi parran corte queste scale.</p></div>\n\n<div class="stanza"><p>Ma dimmi, e come amico mi perdona</p>\n<p>se troppa sicurt&agrave; m&rsquo;allarga il freno,</p>\n<p>e come amico omai meco ragiona:</p></div>\n\n<div class="stanza"><p>come pot&eacute; trovar dentro al tuo seno</p>\n<p>loco avarizia, tra cotanto senno</p>\n<p>di quanto per tua cura fosti pieno?&raquo;.</p></div>\n\n<div class="stanza"><p>Queste parole Stazio mover fenno</p>\n<p>un poco a riso pria; poscia rispuose:</p>\n<p>&laquo;Ogne tuo dir d&rsquo;amor m&rsquo;&egrave; caro cenno.</p></div>\n\n<div class="stanza"><p>Veramente pi&ugrave; volte appaion cose</p>\n<p>che danno a dubitar falsa matera</p>\n<p>per le vere ragion che son nascose.</p></div>\n\n<div class="stanza"><p>La tua dimanda tuo creder m&rsquo;avvera</p>\n<p>esser ch&rsquo;i&rsquo; fossi avaro in l&rsquo;altra vita,</p>\n<p>forse per quella cerchia dov&rsquo; io era.</p></div>\n\n<div class="stanza"><p>Or sappi ch&rsquo;avarizia fu partita</p>\n<p>troppo da me, e questa dismisura</p>\n<p>migliaia di lunari hanno punita.</p></div>\n\n<div class="stanza"><p>E se non fosse ch&rsquo;io drizzai mia cura,</p>\n<p>quand&rsquo; io intesi l&agrave; dove tu chiame,</p>\n<p>crucciato quasi a l&rsquo;umana natura:</p></div>\n\n<div class="stanza"><p>&lsquo;Per che non reggi tu, o sacra fame</p>\n<p>de l&rsquo;oro, l&rsquo;appetito de&rsquo; mortali?&rsquo;,</p>\n<p>voltando sentirei le giostre grame.</p></div>\n\n<div class="stanza"><p>Allor m&rsquo;accorsi che troppo aprir l&rsquo;ali</p>\n<p>potean le mani a spendere, e pente&rsquo;mi</p>\n<p>cos&igrave; di quel come de li altri mali.</p></div>\n\n<div class="stanza"><p>Quanti risurgeran coi crini scemi</p>\n<p>per ignoranza, che di questa pecca</p>\n<p>toglie &rsquo;l penter vivendo e ne li stremi!</p></div>\n\n<div class="stanza"><p>E sappie che la colpa che rimbecca</p>\n<p>per dritta opposizione alcun peccato,</p>\n<p>con esso insieme qui suo verde secca;</p></div>\n\n<div class="stanza"><p>per&ograve;, s&rsquo;io son tra quella gente stato</p>\n<p>che piange l&rsquo;avarizia, per purgarmi,</p>\n<p>per lo contrario suo m&rsquo;&egrave; incontrato&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Or quando tu cantasti le crude armi</p>\n<p>de la doppia trestizia di Giocasta&raquo;,</p>\n<p>disse &rsquo;l cantor de&rsquo; buccolici carmi,</p></div>\n\n<div class="stanza"><p>&laquo;per quello che Cl&iuml;&ograve; teco l&igrave; tasta,</p>\n<p>non par che ti facesse ancor fedele</p>\n<p>la fede, sanza qual ben far non basta.</p></div>\n\n<div class="stanza"><p>Se cos&igrave; &egrave;, qual sole o quai candele</p>\n<p>ti stenebraron s&igrave;, che tu drizzasti</p>\n<p>poscia di retro al pescator le vele?&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a lui: &laquo;Tu prima m&rsquo;inv&iuml;asti</p>\n<p>verso Parnaso a ber ne le sue grotte,</p>\n<p>e prima appresso Dio m&rsquo;alluminasti.</p></div>\n\n<div class="stanza"><p>Facesti come quei che va di notte,</p>\n<p>che porta il lume dietro e s&eacute; non giova,</p>\n<p>ma dopo s&eacute; fa le persone dotte,</p></div>\n\n<div class="stanza"><p>quando dicesti: &lsquo;Secol si rinova;</p>\n<p>torna giustizia e primo tempo umano,</p>\n<p>e progen&iuml;e scende da ciel nova&rsquo;.</p></div>\n\n<div class="stanza"><p>Per te poeta fui, per te cristiano:</p>\n<p>ma perch&eacute; veggi mei ci&ograve; ch&rsquo;io disegno,</p>\n<p>a colorare stender&ograve; la mano.</p></div>\n\n<div class="stanza"><p>Gi&agrave; era &rsquo;l mondo tutto quanto pregno</p>\n<p>de la vera credenza, seminata</p>\n<p>per li messaggi de l&rsquo;etterno regno;</p></div>\n\n<div class="stanza"><p>e la parola tua sopra toccata</p>\n<p>si consonava a&rsquo; nuovi predicanti;</p>\n<p>ond&rsquo; io a visitarli presi usata.</p></div>\n\n<div class="stanza"><p>Vennermi poi parendo tanto santi,</p>\n<p>che, quando Domizian li perseguette,</p>\n<p>sanza mio lagrimar non fur lor pianti;</p></div>\n\n<div class="stanza"><p>e mentre che di l&agrave; per me si stette,</p>\n<p>io li sovvenni, e i lor dritti costumi</p>\n<p>fer dispregiare a me tutte altre sette.</p></div>\n\n<div class="stanza"><p>E pria ch&rsquo;io conducessi i Greci a&rsquo; fiumi</p>\n<p>di Tebe poetando, ebb&rsquo; io battesmo;</p>\n<p>ma per paura chiuso cristian fu&rsquo;mi,</p></div>\n\n<div class="stanza"><p>lungamente mostrando paganesmo;</p>\n<p>e questa tepidezza il quarto cerchio</p>\n<p>cerchiar mi f&eacute; pi&ugrave; che &rsquo;l quarto centesmo.</p></div>\n\n<div class="stanza"><p>Tu dunque, che levato hai il coperchio</p>\n<p>che m&rsquo;ascondeva quanto bene io dico,</p>\n<p>mentre che del salire avem soverchio,</p></div>\n\n<div class="stanza"><p>dimmi dov&rsquo; &egrave; Terrenzio nostro antico,</p>\n<p>Cecilio e Plauto e Varro, se lo sai:</p>\n<p>dimmi se son dannati, e in qual vico&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Costoro e Persio e io e altri assai&raquo;,</p>\n<p>rispuose il duca mio, &laquo;siam con quel Greco</p>\n<p>che le Muse lattar pi&ugrave; ch&rsquo;altri mai,</p></div>\n\n<div class="stanza"><p>nel primo cinghio del carcere cieco;</p>\n<p>spesse f&iuml;ate ragioniam del monte</p>\n<p>che sempre ha le nutrice nostre seco.</p></div>\n\n<div class="stanza"><p>Euripide v&rsquo;&egrave; nosco e Antifonte,</p>\n<p>Simonide, Agatone e altri pi&ugrave;e</p>\n<p>Greci che gi&agrave; di lauro ornar la fronte.</p></div>\n\n<div class="stanza"><p>Quivi si veggion de le genti tue</p>\n<p>Antigone, De&iuml;file e Argia,</p>\n<p>e Ismene s&igrave; trista come fue.</p></div>\n\n<div class="stanza"><p>V&eacute;deisi quella che mostr&ograve; Langia;</p>\n<p>&egrave;vvi la figlia di Tiresia, e Teti,</p>\n<p>e con le suore sue De&iuml;damia&raquo;.</p></div>\n\n<div class="stanza"><p>Tacevansi ambedue gi&agrave; li poeti,</p>\n<p>di novo attenti a riguardar dintorno,</p>\n<p>liberi da saliri e da pareti;</p></div>\n\n<div class="stanza"><p>e gi&agrave; le quattro ancelle eran del giorno</p>\n<p>rimase a dietro, e la quinta era al temo,</p>\n<p>drizzando pur in s&ugrave; l&rsquo;ardente corno,</p></div>\n\n<div class="stanza"><p>quando il mio duca: &laquo;Io credo ch&rsquo;a lo stremo</p>\n<p>le destre spalle volger ne convegna,</p>\n<p>girando il monte come far solemo&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; l&rsquo;usanza fu l&igrave; nostra insegna,</p>\n<p>e prendemmo la via con men sospetto</p>\n<p>per l&rsquo;assentir di quell&rsquo; anima degna.</p></div>\n\n<div class="stanza"><p>Elli givan dinanzi, e io soletto</p>\n<p>di retro, e ascoltava i lor sermoni,</p>\n<p>ch&rsquo;a poetar mi davano intelletto.</p></div>\n\n<div class="stanza"><p>Ma tosto ruppe le dolci ragioni</p>\n<p>un alber che trovammo in mezza strada,</p>\n<p>con pomi a odorar soavi e buoni;</p></div>\n\n<div class="stanza"><p>e come abete in alto si digrada</p>\n<p>di ramo in ramo, cos&igrave; quello in giuso,</p>\n<p>cred&rsquo; io, perch&eacute; persona s&ugrave; non vada.</p></div>\n\n<div class="stanza"><p>Dal lato onde &rsquo;l cammin nostro era chiuso,</p>\n<p>cadea de l&rsquo;alta roccia un liquor chiaro</p>\n<p>e si spandeva per le foglie suso.</p></div>\n\n<div class="stanza"><p>Li due poeti a l&rsquo;alber s&rsquo;appressaro;</p>\n<p>e una voce per entro le fronde</p>\n<p>grid&ograve;: &laquo;Di questo cibo avrete caro&raquo;.</p></div>\n\n<div class="stanza"><p>Poi disse: &laquo;Pi&ugrave; pensava Maria onde</p>\n<p>fosser le nozze orrevoli e intere,</p>\n<p>ch&rsquo;a la sua bocca, ch&rsquo;or per voi risponde.</p></div>\n\n<div class="stanza"><p>E le Romane antiche, per lor bere,</p>\n<p>contente furon d&rsquo;acqua; e Dan&iuml;ello</p>\n<p>dispregi&ograve; cibo e acquist&ograve; savere.</p></div>\n\n<div class="stanza"><p>Lo secol primo, quant&rsquo; oro fu bello,</p>\n<p>f&eacute; savorose con fame le ghiande,</p>\n<p>e nettare con sete ogne ruscello.</p></div>\n\n<div class="stanza"><p>Mele e locuste furon le vivande</p>\n<p>che nodriro il Batista nel diserto;</p>\n<p>per ch&rsquo;elli &egrave; glor&iuml;oso e tanto grande</p></div>\n\n<div class="stanza"><p>quanto per lo Vangelio v&rsquo;&egrave; aperto&raquo;.</p></div>','<p class="cantohead">Canto XXIII</p>\n\n<div class="stanza"><p>Mentre che li occhi per la fronda verde</p>\n<p>ficcava &iuml;o s&igrave; come far suole</p>\n<p>chi dietro a li uccellin sua vita perde,</p></div>\n\n<div class="stanza"><p>lo pi&ugrave; che padre mi dicea: &laquo;Figliuole,</p>\n<p>vienne oramai, ch&eacute; &rsquo;l tempo che n&rsquo;&egrave; imposto</p>\n<p>pi&ugrave; utilmente compartir si vuole&raquo;.</p></div>\n\n<div class="stanza"><p>Io volsi &rsquo;l viso, e &rsquo;l passo non men tosto,</p>\n<p>appresso i savi, che parlavan s&igrave;e,</p>\n<p>che l&rsquo;andar mi facean di nullo costo.</p></div>\n\n<div class="stanza"><p>Ed ecco piangere e cantar s&rsquo;ud&igrave;e</p>\n<p>&lsquo;Lab&iuml;a m&euml;a, Domine&rsquo; per modo</p>\n<p>tal, che diletto e doglia partur&igrave;e.</p></div>\n\n<div class="stanza"><p>&laquo;O dolce padre, che &egrave; quel ch&rsquo;i&rsquo; odo?&raquo;,</p>\n<p>comincia&rsquo; io; ed elli: &laquo;Ombre che vanno</p>\n<p>forse di lor dover solvendo il nodo&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; come i peregrin pensosi fanno,</p>\n<p>giugnendo per cammin gente non nota,</p>\n<p>che si volgono ad essa e non restanno,</p></div>\n\n<div class="stanza"><p>cos&igrave; di retro a noi, pi&ugrave; tosto mota,</p>\n<p>venendo e trapassando ci ammirava</p>\n<p>d&rsquo;anime turba tacita e devota.</p></div>\n\n<div class="stanza"><p>Ne li occhi era ciascuna oscura e cava,</p>\n<p>palida ne la faccia, e tanto scema</p>\n<p>che da l&rsquo;ossa la pelle s&rsquo;informava.</p></div>\n\n<div class="stanza"><p>Non credo che cos&igrave; a buccia strema</p>\n<p>Erisittone fosse fatto secco,</p>\n<p>per digiunar, quando pi&ugrave; n&rsquo;ebbe tema.</p></div>\n\n<div class="stanza"><p>Io dicea fra me stesso pensando: &lsquo;Ecco</p>\n<p>la gente che perd&eacute; Ierusalemme,</p>\n<p>quando Maria nel figlio di&egrave; di becco!&rsquo;</p></div>\n\n<div class="stanza"><p>Parean l&rsquo;occhiaie anella sanza gemme:</p>\n<p>chi nel viso de li uomini legge &lsquo;omo&rsquo;</p>\n<p>ben avria quivi conosciuta l&rsquo;emme.</p></div>\n\n<div class="stanza"><p>Chi crederebbe che l&rsquo;odor d&rsquo;un pomo</p>\n<p>s&igrave; governasse, generando brama,</p>\n<p>e quel d&rsquo;un&rsquo;acqua, non sappiendo como?</p></div>\n\n<div class="stanza"><p>Gi&agrave; era in ammirar che s&igrave; li affama,</p>\n<p>per la cagione ancor non manifesta</p>\n<p>di lor magrezza e di lor trista squama,</p></div>\n\n<div class="stanza"><p>ed ecco del profondo de la testa</p>\n<p>volse a me li occhi un&rsquo;ombra e guard&ograve; fiso;</p>\n<p>poi grid&ograve; forte: &laquo;Qual grazia m&rsquo;&egrave; questa?&raquo;.</p></div>\n\n<div class="stanza"><p>Mai non l&rsquo;avrei riconosciuto al viso;</p>\n<p>ma ne la voce sua mi fu palese</p>\n<p>ci&ograve; che l&rsquo;aspetto in s&eacute; avea conquiso.</p></div>\n\n<div class="stanza"><p>Questa favilla tutta mi raccese</p>\n<p>mia conoscenza a la cangiata labbia,</p>\n<p>e ravvisai la faccia di Forese.</p></div>\n\n<div class="stanza"><p>&laquo;Deh, non contendere a l&rsquo;asciutta scabbia</p>\n<p>che mi scolora&raquo;, pregava, &laquo;la pelle,</p>\n<p>n&eacute; a difetto di carne ch&rsquo;io abbia;</p></div>\n\n<div class="stanza"><p>ma dimmi il ver di te, d&igrave; chi son quelle</p>\n<p>due anime che l&agrave; ti fanno scorta;</p>\n<p>non rimaner che tu non mi favelle!&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;La faccia tua, ch&rsquo;io lagrimai gi&agrave; morta,</p>\n<p>mi d&agrave; di pianger mo non minor doglia&raquo;,</p>\n<p>rispuos&rsquo; io lui, &laquo;veggendola s&igrave; torta.</p></div>\n\n<div class="stanza"><p>Per&ograve; mi d&igrave;, per Dio, che s&igrave; vi sfoglia;</p>\n<p>non mi far dir mentr&rsquo; io mi maraviglio,</p>\n<p>ch&eacute; mal pu&ograve; dir chi &egrave; pien d&rsquo;altra voglia&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;De l&rsquo;etterno consiglio</p>\n<p>cade vert&ugrave; ne l&rsquo;acqua e ne la pianta</p>\n<p>rimasa dietro ond&rsquo; io s&igrave; m&rsquo;assottiglio.</p></div>\n\n<div class="stanza"><p>Tutta esta gente che piangendo canta</p>\n<p>per seguitar la gola oltra misura,</p>\n<p>in fame e &rsquo;n sete qui si rif&agrave; santa.</p></div>\n\n<div class="stanza"><p>Di bere e di mangiar n&rsquo;accende cura</p>\n<p>l&rsquo;odor ch&rsquo;esce del pomo e de lo sprazzo</p>\n<p>che si distende su per sua verdura.</p></div>\n\n<div class="stanza"><p>E non pur una volta, questo spazzo</p>\n<p>girando, si rinfresca nostra pena:</p>\n<p>io dico pena, e dovria dir sollazzo,</p></div>\n\n<div class="stanza"><p>ch&eacute; quella voglia a li alberi ci mena</p>\n<p>che men&ograve; Cristo lieto a dire &lsquo;El&igrave;&rsquo;,</p>\n<p>quando ne liber&ograve; con la sua vena&raquo;.</p></div>\n\n<div class="stanza"><p>E io a lui: &laquo;Forese, da quel d&igrave;</p>\n<p>nel qual mutasti mondo a miglior vita,</p>\n<p>cinqu&rsquo; anni non son v&ograve;lti infino a qui.</p></div>\n\n<div class="stanza"><p>Se prima fu la possa in te finita</p>\n<p>di peccar pi&ugrave;, che sovvenisse l&rsquo;ora</p>\n<p>del buon dolor ch&rsquo;a Dio ne rimarita,</p></div>\n\n<div class="stanza"><p>come se&rsquo; tu qua s&ugrave; venuto ancora?</p>\n<p>Io ti credea trovar l&agrave; gi&ugrave; di sotto,</p>\n<p>dove tempo per tempo si ristora&raquo;.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; elli a me: &laquo;S&igrave; tosto m&rsquo;ha condotto</p>\n<p>a ber lo dolce assenzo d&rsquo;i mart&igrave;ri</p>\n<p>la Nella mia con suo pianger dirotto.</p></div>\n\n<div class="stanza"><p>Con suoi prieghi devoti e con sospiri</p>\n<p>tratto m&rsquo;ha de la costa ove s&rsquo;aspetta,</p>\n<p>e liberato m&rsquo;ha de li altri giri.</p></div>\n\n<div class="stanza"><p>Tanto &egrave; a Dio pi&ugrave; cara e pi&ugrave; diletta</p>\n<p>la vedovella mia, che molto amai,</p>\n<p>quanto in bene operare &egrave; pi&ugrave; soletta;</p></div>\n\n<div class="stanza"><p>ch&eacute; la Barbagia di Sardigna assai</p>\n<p>ne le femmine sue pi&ugrave; &egrave; pudica</p>\n<p>che la Barbagia dov&rsquo; io la lasciai.</p></div>\n\n<div class="stanza"><p>O dolce frate, che vuo&rsquo; tu ch&rsquo;io dica?</p>\n<p>Tempo futuro m&rsquo;&egrave; gi&agrave; nel cospetto,</p>\n<p>cui non sar&agrave; quest&rsquo; ora molto antica,</p></div>\n\n<div class="stanza"><p>nel qual sar&agrave; in pergamo interdetto</p>\n<p>a le sfacciate donne fiorentine</p>\n<p>l&rsquo;andar mostrando con le poppe il petto.</p></div>\n\n<div class="stanza"><p>Quai barbare fuor mai, quai saracine,</p>\n<p>cui bisognasse, per farle ir coperte,</p>\n<p>o spiritali o altre discipline?</p></div>\n\n<div class="stanza"><p>Ma se le svergognate fosser certe</p>\n<p>di quel che &rsquo;l ciel veloce loro ammanna,</p>\n<p>gi&agrave; per urlare avrian le bocche aperte;</p></div>\n\n<div class="stanza"><p>ch&eacute;, se l&rsquo;antiveder qui non m&rsquo;inganna,</p>\n<p>prima fien triste che le guance impeli</p>\n<p>colui che mo si consola con nanna.</p></div>\n\n<div class="stanza"><p>Deh, frate, or fa che pi&ugrave; non mi ti celi!</p>\n<p>vedi che non pur io, ma questa gente</p>\n<p>tutta rimira l&agrave; dove &rsquo;l sol veli&raquo;.</p></div>\n\n<div class="stanza"><p>Per ch&rsquo;io a lui: &laquo;Se tu riduci a mente</p>\n<p>qual fosti meco, e qual io teco fui,</p>\n<p>ancor fia grave il memorar presente.</p></div>\n\n<div class="stanza"><p>Di quella vita mi volse costui</p>\n<p>che mi va innanzi, l&rsquo;altr&rsquo; ier, quando tonda</p>\n<p>vi si mostr&ograve; la suora di colui&raquo;,</p></div>\n\n<div class="stanza"><p>e &rsquo;l sol mostrai; &laquo;costui per la profonda</p>\n<p>notte menato m&rsquo;ha d&rsquo;i veri morti</p>\n<p>con questa vera carne che &rsquo;l seconda.</p></div>\n\n<div class="stanza"><p>Indi m&rsquo;han tratto s&ugrave; li suoi conforti,</p>\n<p>salendo e rigirando la montagna</p>\n<p>che drizza voi che &rsquo;l mondo fece torti.</p></div>\n\n<div class="stanza"><p>Tanto dice di farmi sua compagna</p>\n<p>che io sar&ograve; l&agrave; dove fia Beatrice;</p>\n<p>quivi convien che sanza lui rimagna.</p></div>\n\n<div class="stanza"><p>Virgilio &egrave; questi che cos&igrave; mi dice&raquo;,</p>\n<p>e addita&rsquo;lo; &laquo;e quest&rsquo; altro &egrave; quell&rsquo; ombra</p>\n<p>per cu&iuml; scosse dianzi ogne pendice</p></div>\n\n<div class="stanza"><p>lo vostro regno, che da s&eacute; lo sgombra&raquo;.</p></div>','<p class="cantohead">Canto XXIV</p>\n\n<div class="stanza"><p>N&eacute; &rsquo;l dir l&rsquo;andar, n&eacute; l&rsquo;andar lui pi&ugrave; lento</p>\n<p>facea, ma ragionando andavam forte,</p>\n<p>s&igrave; come nave pinta da buon vento;</p></div>\n\n<div class="stanza"><p>e l&rsquo;ombre, che parean cose rimorte,</p>\n<p>per le fosse de li occhi ammirazione</p>\n<p>traean di me, di mio vivere accorte.</p></div>\n\n<div class="stanza"><p>E io, contin&uuml;ando al mio sermone,</p>\n<p>dissi: &laquo;Ella sen va s&ugrave; forse pi&ugrave; tarda</p>\n<p>che non farebbe, per altrui cagione.</p></div>\n\n<div class="stanza"><p>Ma dimmi, se tu sai, dov&rsquo; &egrave; Piccarda;</p>\n<p>dimmi s&rsquo;io veggio da notar persona</p>\n<p>tra questa gente che s&igrave; mi riguarda&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;La mia sorella, che tra bella e buona</p>\n<p>non so qual fosse pi&ugrave;, tr&iuml;unfa lieta</p>\n<p>ne l&rsquo;alto Olimpo gi&agrave; di sua corona&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; disse prima; e poi: &laquo;Qui non si vieta</p>\n<p>di nominar ciascun, da ch&rsquo;&egrave; s&igrave; munta</p>\n<p>nostra sembianza via per la d&iuml;eta.</p></div>\n\n<div class="stanza"><p>Questi&raquo;, e mostr&ograve; col dito, &laquo;&egrave; Bonagiunta,</p>\n<p>Bonagiunta da Lucca; e quella faccia</p>\n<p>di l&agrave; da lui pi&ugrave; che l&rsquo;altre trapunta</p></div>\n\n<div class="stanza"><p>ebbe la Santa Chiesa in le sue braccia:</p>\n<p>dal Torso fu, e purga per digiuno</p>\n<p>l&rsquo;anguille di Bolsena e la vernaccia&raquo;.</p></div>\n\n<div class="stanza"><p>Molti altri mi nom&ograve; ad uno ad uno;</p>\n<p>e del nomar parean tutti contenti,</p>\n<p>s&igrave; ch&rsquo;io per&ograve; non vidi un atto bruno.</p></div>\n\n<div class="stanza"><p>Vidi per fame a v&ograve;to usar li denti</p>\n<p>Ubaldin da la Pila e Bonifazio</p>\n<p>che pastur&ograve; col rocco molte genti.</p></div>\n\n<div class="stanza"><p>Vidi messer Marchese, ch&rsquo;ebbe spazio</p>\n<p>gi&agrave; di bere a Forl&igrave; con men secchezza,</p>\n<p>e s&igrave; fu tal, che non si sent&igrave; sazio.</p></div>\n\n<div class="stanza"><p>Ma come fa chi guarda e poi s&rsquo;apprezza</p>\n<p>pi&ugrave; d&rsquo;un che d&rsquo;altro, fei a quel da Lucca,</p>\n<p>che pi&ugrave; parea di me aver contezza.</p></div>\n\n<div class="stanza"><p>El mormorava; e non so che &laquo;Gentucca&raquo;</p>\n<p>sentiv&rsquo; io l&agrave;, ov&rsquo; el sentia la piaga</p>\n<p>de la giustizia che s&igrave; li pilucca.</p></div>\n\n<div class="stanza"><p>&laquo;O anima&raquo;, diss&rsquo; io, &laquo;che par s&igrave; vaga</p>\n<p>di parlar meco, fa s&igrave; ch&rsquo;io t&rsquo;intenda,</p>\n<p>e te e me col tuo parlare appaga&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Femmina &egrave; nata, e non porta ancor benda&raquo;,</p>\n<p>cominci&ograve; el, &laquo;che ti far&agrave; piacere</p>\n<p>la mia citt&agrave;, come ch&rsquo;om la riprenda.</p></div>\n\n<div class="stanza"><p>Tu te n&rsquo;andrai con questo antivedere:</p>\n<p>se nel mio mormorar prendesti errore,</p>\n<p>dichiareranti ancor le cose vere.</p></div>\n\n<div class="stanza"><p>Ma d&igrave; s&rsquo;i&rsquo; veggio qui colui che fore</p>\n<p>trasse le nove rime, cominciando</p>\n<p>&lsquo;Donne ch&rsquo;avete intelletto d&rsquo;amore&rsquo;&raquo;.</p></div>\n\n<div class="stanza"><p>E io a lui: &laquo;I&rsquo; mi son un che, quando</p>\n<p>Amor mi spira, noto, e a quel modo</p>\n<p>ch&rsquo;e&rsquo; ditta dentro vo significando&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O frate, issa vegg&rsquo; io&raquo;, diss&rsquo; elli, &laquo;il nodo</p>\n<p>che &rsquo;l Notaro e Guittone e me ritenne</p>\n<p>di qua dal dolce stil novo ch&rsquo;i&rsquo; odo!</p></div>\n\n<div class="stanza"><p>Io veggio ben come le vostre penne</p>\n<p>di retro al dittator sen vanno strette,</p>\n<p>che de le nostre certo non avvenne;</p></div>\n\n<div class="stanza"><p>e qual pi&ugrave; a gradire oltre si mette,</p>\n<p>non vede pi&ugrave; da l&rsquo;uno a l&rsquo;altro stilo&raquo;;</p>\n<p>e, quasi contentato, si tacette.</p></div>\n\n<div class="stanza"><p>Come li augei che vernan lungo &rsquo;l Nilo,</p>\n<p>alcuna volta in aere fanno schiera,</p>\n<p>poi volan pi&ugrave; a fretta e vanno in filo,</p></div>\n\n<div class="stanza"><p>cos&igrave; tutta la gente che l&igrave; era,</p>\n<p>volgendo &rsquo;l viso, raffrett&ograve; suo passo,</p>\n<p>e per magrezza e per voler leggera.</p></div>\n\n<div class="stanza"><p>E come l&rsquo;uom che di trottare &egrave; lasso,</p>\n<p>lascia andar li compagni, e s&igrave; passeggia</p>\n<p>fin che si sfoghi l&rsquo;affollar del casso,</p></div>\n\n<div class="stanza"><p>s&igrave; lasci&ograve; trapassar la santa greggia</p>\n<p>Forese, e dietro meco sen veniva,</p>\n<p>dicendo: &laquo;Quando fia ch&rsquo;io ti riveggia?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Non so&raquo;, rispuos&rsquo; io lui, &laquo;quant&rsquo; io mi viva;</p>\n<p>ma gi&agrave; non f&iuml;a il tornar mio tantosto,</p>\n<p>ch&rsquo;io non sia col voler prima a la riva;</p></div>\n\n<div class="stanza"><p>per&ograve; che &rsquo;l loco u&rsquo; fui a viver posto,</p>\n<p>di giorno in giorno pi&ugrave; di ben si spolpa,</p>\n<p>e a trista ruina par disposto&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Or va&raquo;, diss&rsquo; el; &laquo;che quei che pi&ugrave; n&rsquo;ha colpa,</p>\n<p>vegg&rsquo; &iuml;o a coda d&rsquo;una bestia tratto</p>\n<p>inver&rsquo; la valle ove mai non si scolpa.</p></div>\n\n<div class="stanza"><p>La bestia ad ogne passo va pi&ugrave; ratto,</p>\n<p>crescendo sempre, fin ch&rsquo;ella il percuote,</p>\n<p>e lascia il corpo vilmente disfatto.</p></div>\n\n<div class="stanza"><p>Non hanno molto a volger quelle ruote&raquo;,</p>\n<p>e drizz&ograve; li occhi al ciel, &laquo;che ti fia chiaro</p>\n<p>ci&ograve; che &rsquo;l mio dir pi&ugrave; dichiarar non puote.</p></div>\n\n<div class="stanza"><p>Tu ti rimani omai; ch&eacute; &rsquo;l tempo &egrave; caro</p>\n<p>in questo regno, s&igrave; ch&rsquo;io perdo troppo</p>\n<p>venendo teco s&igrave; a paro a paro&raquo;.</p></div>\n\n<div class="stanza"><p>Qual esce alcuna volta di gualoppo</p>\n<p>lo cavalier di schiera che cavalchi,</p>\n<p>e va per farsi onor del primo intoppo,</p></div>\n\n<div class="stanza"><p>tal si part&igrave; da noi con maggior valchi;</p>\n<p>e io rimasi in via con esso i due</p>\n<p>che fuor del mondo s&igrave; gran marescalchi.</p></div>\n\n<div class="stanza"><p>E quando innanzi a noi intrato fue,</p>\n<p>che li occhi miei si fero a lui seguaci,</p>\n<p>come la mente a le parole sue,</p></div>\n\n<div class="stanza"><p>parvermi i rami gravidi e vivaci</p>\n<p>d&rsquo;un altro pomo, e non molto lontani</p>\n<p>per esser pur allora v&ograve;lto in laci.</p></div>\n\n<div class="stanza"><p>Vidi gente sott&rsquo; esso alzar le mani</p>\n<p>e gridar non so che verso le fronde,</p>\n<p>quasi bramosi fantolini e vani</p></div>\n\n<div class="stanza"><p>che pregano, e &rsquo;l pregato non risponde,</p>\n<p>ma, per fare esser ben la voglia acuta,</p>\n<p>tien alto lor disio e nol nasconde.</p></div>\n\n<div class="stanza"><p>Poi si part&igrave; s&igrave; come ricreduta;</p>\n<p>e noi venimmo al grande arbore adesso,</p>\n<p>che tanti prieghi e lagrime rifiuta.</p></div>\n\n<div class="stanza"><p>&laquo;Trapassate oltre sanza farvi presso:</p>\n<p>legno &egrave; pi&ugrave; s&ugrave; che fu morso da Eva,</p>\n<p>e questa pianta si lev&ograve; da esso&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; tra le frasche non so chi diceva;</p>\n<p>per che Virgilio e Stazio e io, ristretti,</p>\n<p>oltre andavam dal lato che si leva.</p></div>\n\n<div class="stanza"><p>&laquo;Ricordivi&raquo;, dicea, &laquo;d&rsquo;i maladetti</p>\n<p>nei nuvoli formati, che, satolli,</p>\n<p>Tes&euml;o combatter co&rsquo; doppi petti;</p></div>\n\n<div class="stanza"><p>e de li Ebrei ch&rsquo;al ber si mostrar molli,</p>\n<p>per che no i volle Gedeon compagni,</p>\n<p>quando inver&rsquo; Mad&iuml;an discese i colli&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; accostati a l&rsquo;un d&rsquo;i due vivagni</p>\n<p>passammo, udendo colpe de la gola</p>\n<p>seguite gi&agrave; da miseri guadagni.</p></div>\n\n<div class="stanza"><p>Poi, rallargati per la strada sola,</p>\n<p>ben mille passi e pi&ugrave; ci portar oltre,</p>\n<p>contemplando ciascun sanza parola.</p></div>\n\n<div class="stanza"><p>&laquo;Che andate pensando s&igrave; voi sol tre?&raquo;.</p>\n<p>s&ugrave;bita voce disse; ond&rsquo; io mi scossi</p>\n<p>come fan bestie spaventate e poltre.</p></div>\n\n<div class="stanza"><p>Drizzai la testa per veder chi fossi;</p>\n<p>e gi&agrave; mai non si videro in fornace</p>\n<p>vetri o metalli s&igrave; lucenti e rossi,</p></div>\n\n<div class="stanza"><p>com&rsquo; io vidi un che dicea: &laquo;S&rsquo;a voi piace</p>\n<p>montare in s&ugrave;, qui si convien dar volta;</p>\n<p>quinci si va chi vuole andar per pace&raquo;.</p></div>\n\n<div class="stanza"><p>L&rsquo;aspetto suo m&rsquo;avea la vista tolta;</p>\n<p>per ch&rsquo;io mi volsi dietro a&rsquo; miei dottori,</p>\n<p>com&rsquo; om che va secondo ch&rsquo;elli ascolta.</p></div>\n\n<div class="stanza"><p>E quale, annunziatrice de li albori,</p>\n<p>l&rsquo;aura di maggio movesi e olezza,</p>\n<p>tutta impregnata da l&rsquo;erba e da&rsquo; fiori;</p></div>\n\n<div class="stanza"><p>tal mi senti&rsquo; un vento dar per mezza</p>\n<p>la fronte, e ben senti&rsquo; mover la piuma,</p>\n<p>che f&eacute; sentir d&rsquo;ambros&iuml;a l&rsquo;orezza.</p></div>\n\n<div class="stanza"><p>E senti&rsquo; dir: &laquo;Beati cui alluma</p>\n<p>tanto di grazia, che l&rsquo;amor del gusto</p>\n<p>nel petto lor troppo disir non fuma,</p></div>\n\n<div class="stanza"><p>esur&iuml;endo sempre quanto &egrave; giusto!&raquo;.</p></div>','<p class="cantohead">Canto XXV</p>\n\n<div class="stanza"><p>Ora era onde &rsquo;l salir non volea storpio;</p>\n<p>ch&eacute; &rsquo;l sole av&euml;a il cerchio di merigge</p>\n<p>lasciato al Tauro e la notte a lo Scorpio:</p></div>\n\n<div class="stanza"><p>per che, come fa l&rsquo;uom che non s&rsquo;affigge</p>\n<p>ma vassi a la via sua, che che li appaia,</p>\n<p>se di bisogno stimolo il trafigge,</p></div>\n\n<div class="stanza"><p>cos&igrave; intrammo noi per la callaia,</p>\n<p>uno innanzi altro prendendo la scala</p>\n<p>che per artezza i salitor dispaia.</p></div>\n\n<div class="stanza"><p>E quale il cicognin che leva l&rsquo;ala</p>\n<p>per voglia di volare, e non s&rsquo;attenta</p>\n<p>d&rsquo;abbandonar lo nido, e gi&ugrave; la cala;</p></div>\n\n<div class="stanza"><p>tal era io con voglia accesa e spenta</p>\n<p>di dimandar, venendo infino a l&rsquo;atto</p>\n<p>che fa colui ch&rsquo;a dicer s&rsquo;argomenta.</p></div>\n\n<div class="stanza"><p>Non lasci&ograve;, per l&rsquo;andar che fosse ratto,</p>\n<p>lo dolce padre mio, ma disse: &laquo;Scocca</p>\n<p>l&rsquo;arco del dir, che &rsquo;nfino al ferro hai tratto&raquo;.</p></div>\n\n<div class="stanza"><p>Allor sicuramente apri&rsquo; la bocca</p>\n<p>e cominciai: &laquo;Come si pu&ograve; far magro</p>\n<p>l&agrave; dove l&rsquo;uopo di nodrir non tocca?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Se t&rsquo;ammentassi come Meleagro</p>\n<p>si consum&ograve; al consumar d&rsquo;un stizzo,</p>\n<p>non fora&raquo;, disse, &laquo;a te questo s&igrave; agro;</p></div>\n\n<div class="stanza"><p>e se pensassi come, al vostro guizzo,</p>\n<p>guizza dentro a lo specchio vostra image,</p>\n<p>ci&ograve; che par duro ti parrebbe vizzo.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; dentro a tuo voler t&rsquo;adage,</p>\n<p>ecco qui Stazio; e io lui chiamo e prego</p>\n<p>che sia or sanator de le tue piage&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Se la veduta etterna li dislego&raquo;,</p>\n<p>rispuose Stazio, &laquo;l&agrave; dove tu sie,</p>\n<p>discolpi me non potert&rsquo; io far nego&raquo;.</p></div>\n\n<div class="stanza"><p>Poi cominci&ograve;: &laquo;Se le parole mie,</p>\n<p>figlio, la mente tua guarda e riceve,</p>\n<p>lume ti fiero al come che tu die.</p></div>\n\n<div class="stanza"><p>Sangue perfetto, che poi non si beve</p>\n<p>da l&rsquo;assetate vene, e si rimane</p>\n<p>quasi alimento che di mensa leve,</p></div>\n\n<div class="stanza"><p>prende nel core a tutte membra umane</p>\n<p>virtute informativa, come quello</p>\n<p>ch&rsquo;a farsi quelle per le vene vane.</p></div>\n\n<div class="stanza"><p>Ancor digesto, scende ov&rsquo; &egrave; pi&ugrave; bello</p>\n<p>tacer che dire; e quindi poscia geme</p>\n<p>sovr&rsquo; altrui sangue in natural vasello.</p></div>\n\n<div class="stanza"><p>Ivi s&rsquo;accoglie l&rsquo;uno e l&rsquo;altro insieme,</p>\n<p>l&rsquo;un disposto a patire, e l&rsquo;altro a fare</p>\n<p>per lo perfetto loco onde si preme;</p></div>\n\n<div class="stanza"><p>e, giunto lui, comincia ad operare</p>\n<p>coagulando prima, e poi avviva</p>\n<p>ci&ograve; che per sua matera f&eacute; constare.</p></div>\n\n<div class="stanza"><p>Anima fatta la virtute attiva</p>\n<p>qual d&rsquo;una pianta, in tanto differente,</p>\n<p>che questa &egrave; in via e quella &egrave; gi&agrave; a riva,</p></div>\n\n<div class="stanza"><p>tanto ovra poi, che gi&agrave; si move e sente,</p>\n<p>come spungo marino; e indi imprende</p>\n<p>ad organar le posse ond&rsquo; &egrave; semente.</p></div>\n\n<div class="stanza"><p>Or si spiega, figliuolo, or si distende</p>\n<p>la virt&ugrave; ch&rsquo;&egrave; dal cor del generante,</p>\n<p>dove natura a tutte membra intende.</p></div>\n\n<div class="stanza"><p>Ma come d&rsquo;animal divegna fante,</p>\n<p>non vedi tu ancor: quest&rsquo; &egrave; tal punto,</p>\n<p>che pi&ugrave; savio di te f&eacute; gi&agrave; errante,</p></div>\n\n<div class="stanza"><p>s&igrave; che per sua dottrina f&eacute; disgiunto</p>\n<p>da l&rsquo;anima il possibile intelletto,</p>\n<p>perch&eacute; da lui non vide organo assunto.</p></div>\n\n<div class="stanza"><p>Apri a la verit&agrave; che viene il petto;</p>\n<p>e sappi che, s&igrave; tosto come al feto</p>\n<p>l&rsquo;articular del cerebro &egrave; perfetto,</p></div>\n\n<div class="stanza"><p>lo motor primo a lui si volge lieto</p>\n<p>sovra tant&rsquo; arte di natura, e spira</p>\n<p>spirito novo, di vert&ugrave; repleto,</p></div>\n\n<div class="stanza"><p>che ci&ograve; che trova attivo quivi, tira</p>\n<p>in sua sustanzia, e fassi un&rsquo;alma sola,</p>\n<p>che vive e sente e s&eacute; in s&eacute; rigira.</p></div>\n\n<div class="stanza"><p>E perch&eacute; meno ammiri la parola,</p>\n<p>guarda il calor del sole che si fa vino,</p>\n<p>giunto a l&rsquo;omor che de la vite cola.</p></div>\n\n<div class="stanza"><p>Quando L&agrave;chesis non ha pi&ugrave; del lino,</p>\n<p>solvesi da la carne, e in virtute</p>\n<p>ne porta seco e l&rsquo;umano e &rsquo;l divino:</p></div>\n\n<div class="stanza"><p>l&rsquo;altre potenze tutte quante mute;</p>\n<p>memoria, intelligenza e volontade</p>\n<p>in atto molto pi&ugrave; che prima agute.</p></div>\n\n<div class="stanza"><p>Sanza restarsi, per s&eacute; stessa cade</p>\n<p>mirabilmente a l&rsquo;una de le rive;</p>\n<p>quivi conosce prima le sue strade.</p></div>\n\n<div class="stanza"><p>Tosto che loco l&igrave; la circunscrive,</p>\n<p>la virt&ugrave; formativa raggia intorno</p>\n<p>cos&igrave; e quanto ne le membra vive.</p></div>\n\n<div class="stanza"><p>E come l&rsquo;aere, quand&rsquo; &egrave; ben p&iuml;orno,</p>\n<p>per l&rsquo;altrui raggio che &rsquo;n s&eacute; si reflette,</p>\n<p>di diversi color diventa addorno;</p></div>\n\n<div class="stanza"><p>cos&igrave; l&rsquo;aere vicin quivi si mette</p>\n<p>e in quella forma ch&rsquo;&egrave; in lui suggella</p>\n<p>virt&uuml;almente l&rsquo;alma che ristette;</p></div>\n\n<div class="stanza"><p>e simigliante poi a la fiammella</p>\n<p>che segue il foco l&agrave; &rsquo;vunque si muta,</p>\n<p>segue lo spirto sua forma novella.</p></div>\n\n<div class="stanza"><p>Per&ograve; che quindi ha poscia sua paruta,</p>\n<p>&egrave; chiamata ombra; e quindi organa poi</p>\n<p>ciascun sentire infino a la veduta.</p></div>\n\n<div class="stanza"><p>Quindi parliamo e quindi ridiam noi;</p>\n<p>quindi facciam le lagrime e &rsquo; sospiri</p>\n<p>che per lo monte aver sentiti puoi.</p></div>\n\n<div class="stanza"><p>Secondo che ci affliggono i disiri</p>\n<p>e li altri affetti, l&rsquo;ombra si figura;</p>\n<p>e quest&rsquo; &egrave; la cagion di che tu miri&raquo;.</p></div>\n\n<div class="stanza"><p>E gi&agrave; venuto a l&rsquo;ultima tortura</p>\n<p>s&rsquo;era per noi, e v&ograve;lto a la man destra,</p>\n<p>ed eravamo attenti ad altra cura.</p></div>\n\n<div class="stanza"><p>Quivi la ripa fiamma in fuor balestra,</p>\n<p>e la cornice spira fiato in suso</p>\n<p>che la reflette e via da lei sequestra;</p></div>\n\n<div class="stanza"><p>ond&rsquo; ir ne convenia dal lato schiuso</p>\n<p>ad uno ad uno; e io tem&euml;a &rsquo;l foco</p>\n<p>quinci, e quindi temeva cader giuso.</p></div>\n\n<div class="stanza"><p>Lo duca mio dicea: &laquo;Per questo loco</p>\n<p>si vuol tenere a li occhi stretto il freno,</p>\n<p>per&ograve; ch&rsquo;errar potrebbesi per poco&raquo;.</p></div>\n\n<div class="stanza"><p>&lsquo;Summae Deus clement&iuml;ae&rsquo; nel seno</p>\n<p>al grande ardore allora udi&rsquo; cantando,</p>\n<p>che di volger mi f&eacute; caler non meno;</p></div>\n\n<div class="stanza"><p>e vidi spirti per la fiamma andando;</p>\n<p>per ch&rsquo;io guardava a loro e a&rsquo; miei passi</p>\n<p>compartendo la vista a quando a quando.</p></div>\n\n<div class="stanza"><p>Appresso il fine ch&rsquo;a quell&rsquo; inno fassi,</p>\n<p>gridavano alto: &lsquo;Virum non cognosco&rsquo;;</p>\n<p>indi ricominciavan l&rsquo;inno bassi.</p></div>\n\n<div class="stanza"><p>Finitolo, anco gridavano: &laquo;Al bosco</p>\n<p>si tenne Diana, ed Elice caccionne</p>\n<p>che di Venere avea sentito il t&ograve;sco&raquo;.</p></div>\n\n<div class="stanza"><p>Indi al cantar tornavano; indi donne</p>\n<p>gridavano e mariti che fuor casti</p>\n<p>come virtute e matrimonio imponne.</p></div>\n\n<div class="stanza"><p>E questo modo credo che lor basti</p>\n<p>per tutto il tempo che &rsquo;l foco li abbruscia:</p>\n<p>con tal cura conviene e con tai pasti</p></div>\n\n<div class="stanza"><p>che la piaga da sezzo si ricuscia.</p></div>','<p class="cantohead">Canto XXVI</p>\n\n<div class="stanza"><p>Mentre che s&igrave; per l&rsquo;orlo, uno innanzi altro,</p>\n<p>ce n&rsquo;andavamo, e spesso il buon maestro</p>\n<p>diceami: &laquo;Guarda: giovi ch&rsquo;io ti scaltro&raquo;;</p></div>\n\n<div class="stanza"><p>feriami il sole in su l&rsquo;omero destro,</p>\n<p>che gi&agrave;, raggiando, tutto l&rsquo;occidente</p>\n<p>mutava in bianco aspetto di cilestro;</p></div>\n\n<div class="stanza"><p>e io facea con l&rsquo;ombra pi&ugrave; rovente</p>\n<p>parer la fiamma; e pur a tanto indizio</p>\n<p>vidi molt&rsquo; ombre, andando, poner mente.</p></div>\n\n<div class="stanza"><p>Questa fu la cagion che diede inizio</p>\n<p>loro a parlar di me; e cominciarsi</p>\n<p>a dir: &laquo;Colui non par corpo fittizio&raquo;;</p></div>\n\n<div class="stanza"><p>poi verso me, quanto pot&euml;an farsi,</p>\n<p>certi si fero, sempre con riguardo</p>\n<p>di non uscir dove non fosser arsi.</p></div>\n\n<div class="stanza"><p>&laquo;O tu che vai, non per esser pi&ugrave; tardo,</p>\n<p>ma forse reverente, a li altri dopo,</p>\n<p>rispondi a me che &rsquo;n sete e &rsquo;n foco ardo.</p></div>\n\n<div class="stanza"><p>N&eacute; solo a me la tua risposta &egrave; uopo;</p>\n<p>ch&eacute; tutti questi n&rsquo;hanno maggior sete</p>\n<p>che d&rsquo;acqua fredda Indo o Et&iuml;opo.</p></div>\n\n<div class="stanza"><p>Dinne com&rsquo; &egrave; che fai di te parete</p>\n<p>al sol, pur come tu non fossi ancora</p>\n<p>di morte intrato dentro da la rete&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; mi parlava un d&rsquo;essi; e io mi fora</p>\n<p>gi&agrave; manifesto, s&rsquo;io non fossi atteso</p>\n<p>ad altra novit&agrave; ch&rsquo;apparve allora;</p></div>\n\n<div class="stanza"><p>ch&eacute; per lo mezzo del cammino acceso</p>\n<p>venne gente col viso incontro a questa,</p>\n<p>la qual mi fece a rimirar sospeso.</p></div>\n\n<div class="stanza"><p>L&igrave; veggio d&rsquo;ogne parte farsi presta</p>\n<p>ciascun&rsquo; ombra e basciarsi una con una</p>\n<p>sanza restar, contente a brieve festa;</p></div>\n\n<div class="stanza"><p>cos&igrave; per entro loro schiera bruna</p>\n<p>s&rsquo;ammusa l&rsquo;una con l&rsquo;altra formica,</p>\n<p>forse a sp&iuml;ar lor via e lor fortuna.</p></div>\n\n<div class="stanza"><p>Tosto che parton l&rsquo;accoglienza amica,</p>\n<p>prima che &rsquo;l primo passo l&igrave; trascorra,</p>\n<p>sopragridar ciascuna s&rsquo;affatica:</p></div>\n\n<div class="stanza"><p>la nova gente: &laquo;Soddoma e Gomorra&raquo;;</p>\n<p>e l&rsquo;altra: &laquo;Ne la vacca entra Pasife,</p>\n<p>perch&eacute; &rsquo;l torello a sua lussuria corra&raquo;.</p></div>\n\n<div class="stanza"><p>Poi, come grue ch&rsquo;a le montagne Rife</p>\n<p>volasser parte, e parte inver&rsquo; l&rsquo;arene,</p>\n<p>queste del gel, quelle del sole schife,</p></div>\n\n<div class="stanza"><p>l&rsquo;una gente sen va, l&rsquo;altra sen vene;</p>\n<p>e tornan, lagrimando, a&rsquo; primi canti</p>\n<p>e al gridar che pi&ugrave; lor si convene;</p></div>\n\n<div class="stanza"><p>e raccostansi a me, come davanti,</p>\n<p>essi medesmi che m&rsquo;avean pregato,</p>\n<p>attenti ad ascoltar ne&rsquo; lor sembianti.</p></div>\n\n<div class="stanza"><p>Io, che due volte avea visto lor grato,</p>\n<p>incominciai: &laquo;O anime sicure</p>\n<p>d&rsquo;aver, quando che sia, di pace stato,</p></div>\n\n<div class="stanza"><p>non son rimase acerbe n&eacute; mature</p>\n<p>le membra mie di l&agrave;, ma son qui meco</p>\n<p>col sangue suo e con le sue giunture.</p></div>\n\n<div class="stanza"><p>Quinci s&ugrave; vo per non esser pi&ugrave; cieco;</p>\n<p>donna &egrave; di sopra che m&rsquo;acquista grazia,</p>\n<p>per che &rsquo;l mortal per vostro mondo reco.</p></div>\n\n<div class="stanza"><p>Ma se la vostra maggior voglia sazia</p>\n<p>tosto divegna, s&igrave; che &rsquo;l ciel v&rsquo;alberghi</p>\n<p>ch&rsquo;&egrave; pien d&rsquo;amore e pi&ugrave; ampio si spazia,</p></div>\n\n<div class="stanza"><p>ditemi, acci&ograve; ch&rsquo;ancor carte ne verghi,</p>\n<p>chi siete voi, e chi &egrave; quella turba</p>\n<p>che se ne va di retro a&rsquo; vostri terghi&raquo;.</p></div>\n\n<div class="stanza"><p>Non altrimenti stupido si turba</p>\n<p>lo montanaro, e rimirando ammuta,</p>\n<p>quando rozzo e salvatico s&rsquo;inurba,</p></div>\n\n<div class="stanza"><p>che ciascun&rsquo; ombra fece in sua paruta;</p>\n<p>ma poi che furon di stupore scarche,</p>\n<p>lo qual ne li alti cuor tosto s&rsquo;attuta,</p></div>\n\n<div class="stanza"><p>&laquo;Beato te, che de le nostre marche&raquo;,</p>\n<p>ricominci&ograve; colei che pria m&rsquo;inchiese,</p>\n<p>&laquo;per morir meglio, esper&iuml;enza imbarche!</p></div>\n\n<div class="stanza"><p>La gente che non vien con noi, offese</p>\n<p>di ci&ograve; per che gi&agrave; Cesar, tr&iuml;unfando,</p>\n<p>&ldquo;Regina&rdquo; contra s&eacute; chiamar s&rsquo;intese:</p></div>\n\n<div class="stanza"><p>per&ograve; si parton &ldquo;Soddoma&rdquo; gridando,</p>\n<p>rimproverando a s&eacute; com&rsquo; hai udito,</p>\n<p>e aiutan l&rsquo;arsura vergognando.</p></div>\n\n<div class="stanza"><p>Nostro peccato fu ermafrodito;</p>\n<p>ma perch&eacute; non servammo umana legge,</p>\n<p>seguendo come bestie l&rsquo;appetito,</p></div>\n\n<div class="stanza"><p>in obbrobrio di noi, per noi si legge,</p>\n<p>quando partinci, il nome di colei</p>\n<p>che s&rsquo;imbesti&ograve; ne le &rsquo;mbestiate schegge.</p></div>\n\n<div class="stanza"><p>Or sai nostri atti e di che fummo rei:</p>\n<p>se forse a nome vuo&rsquo; saper chi semo,</p>\n<p>tempo non &egrave; di dire, e non saprei.</p></div>\n\n<div class="stanza"><p>Farotti ben di me volere scemo:</p>\n<p>son Guido Guinizzelli, e gi&agrave; mi purgo</p>\n<p>per ben dolermi prima ch&rsquo;a lo stremo&raquo;.</p></div>\n\n<div class="stanza"><p>Quali ne la tristizia di Ligurgo</p>\n<p>si fer due figli a riveder la madre,</p>\n<p>tal mi fec&rsquo; io, ma non a tanto insurgo,</p></div>\n\n<div class="stanza"><p>quand&rsquo; io odo nomar s&eacute; stesso il padre</p>\n<p>mio e de li altri miei miglior che mai</p>\n<p>rime d&rsquo;amore usar dolci e leggiadre;</p></div>\n\n<div class="stanza"><p>e sanza udire e dir pensoso andai</p>\n<p>lunga f&iuml;ata rimirando lui,</p>\n<p>n&eacute;, per lo foco, in l&agrave; pi&ugrave; m&rsquo;appressai.</p></div>\n\n<div class="stanza"><p>Poi che di riguardar pasciuto fui,</p>\n<p>tutto m&rsquo;offersi pronto al suo servigio</p>\n<p>con l&rsquo;affermar che fa credere altrui.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;Tu lasci tal vestigio,</p>\n<p>per quel ch&rsquo;i&rsquo; odo, in me, e tanto chiaro,</p>\n<p>che Let&egrave; nol pu&ograve; t&ograve;rre n&eacute; far bigio.</p></div>\n\n<div class="stanza"><p>Ma se le tue parole or ver giuraro,</p>\n<p>dimmi che &egrave; cagion per che dimostri</p>\n<p>nel dire e nel guardar d&rsquo;avermi caro&raquo;.</p></div>\n\n<div class="stanza"><p>E io a lui: &laquo;Li dolci detti vostri,</p>\n<p>che, quanto durer&agrave; l&rsquo;uso moderno,</p>\n<p>faranno cari ancora i loro incostri&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O frate&raquo;, disse, &laquo;questi ch&rsquo;io ti cerno</p>\n<p>col dito&raquo;, e addit&ograve; un spirto innanzi,</p>\n<p>&laquo;fu miglior fabbro del parlar materno.</p></div>\n\n<div class="stanza"><p>Versi d&rsquo;amore e prose di romanzi</p>\n<p>soverchi&ograve; tutti; e lascia dir li stolti</p>\n<p>che quel di Lemos&igrave; credon ch&rsquo;avanzi.</p></div>\n\n<div class="stanza"><p>A voce pi&ugrave; ch&rsquo;al ver drizzan li volti,</p>\n<p>e cos&igrave; ferman sua oppin&iuml;one</p>\n<p>prima ch&rsquo;arte o ragion per lor s&rsquo;ascolti.</p></div>\n\n<div class="stanza"><p>Cos&igrave; fer molti antichi di Guittone,</p>\n<p>di grido in grido pur lui dando pregio,</p>\n<p>fin che l&rsquo;ha vinto il ver con pi&ugrave; persone.</p></div>\n\n<div class="stanza"><p>Or se tu hai s&igrave; ampio privilegio,</p>\n<p>che licito ti sia l&rsquo;andare al chiostro</p>\n<p>nel quale &egrave; Cristo abate del collegio,</p></div>\n\n<div class="stanza"><p>falli per me un dir d&rsquo;un paternostro,</p>\n<p>quanto bisogna a noi di questo mondo,</p>\n<p>dove poter peccar non &egrave; pi&ugrave; nostro&raquo;.</p></div>\n\n<div class="stanza"><p>Poi, forse per dar luogo altrui secondo</p>\n<p>che presso avea, disparve per lo foco,</p>\n<p>come per l&rsquo;acqua il pesce andando al fondo.</p></div>\n\n<div class="stanza"><p>Io mi fei al mostrato innanzi un poco,</p>\n<p>e dissi ch&rsquo;al suo nome il mio disire</p>\n<p>apparecchiava graz&iuml;oso loco.</p></div>\n\n<div class="stanza"><p>El cominci&ograve; liberamente a dire:</p>\n<p>&laquo;Tan m&rsquo;abellis vostre cortes deman,</p>\n<p>qu&rsquo;ieu no me puesc ni voill a vos cobrire.</p></div>\n\n<div class="stanza"><p>Ieu sui Arnaut, que plor e vau cantan;</p>\n<p>consiros vei la passada folor,</p>\n<p>e vei jausen lo joi qu&rsquo;esper, denan.</p></div>\n\n<div class="stanza"><p>Ara vos prec, per aquella valor</p>\n<p>que vos guida al som de l&rsquo;escalina,</p>\n<p>sovenha vos a temps de ma dolor!&raquo;.</p></div>\n\n<div class="stanza"><p>Poi s&rsquo;ascose nel foco che li affina.</p></div>','<p class="cantohead">Canto XXVII</p>\n\n<div class="stanza"><p>S&igrave; come quando i primi raggi vibra</p>\n<p>l&agrave; dove il suo fattor lo sangue sparse,</p>\n<p>cadendo Ibero sotto l&rsquo;alta Libra,</p></div>\n\n<div class="stanza"><p>e l&rsquo;onde in Gange da nona r&iuml;arse,</p>\n<p>s&igrave; stava il sole; onde &rsquo;l giorno sen giva,</p>\n<p>come l&rsquo;angel di Dio lieto ci apparse.</p></div>\n\n<div class="stanza"><p>Fuor de la fiamma stava in su la riva,</p>\n<p>e cantava &lsquo;Beati mundo corde!&rsquo;</p>\n<p>in voce assai pi&ugrave; che la nostra viva.</p></div>\n\n<div class="stanza"><p>Poscia &laquo;Pi&ugrave; non si va, se pria non morde,</p>\n<p>anime sante, il foco: intrate in esso,</p>\n<p>e al cantar di l&agrave; non siate sorde&raquo;,</p></div>\n\n<div class="stanza"><p>ci disse come noi li fummo presso;</p>\n<p>per ch&rsquo;io divenni tal, quando lo &rsquo;ntesi,</p>\n<p>qual &egrave; colui che ne la fossa &egrave; messo.</p></div>\n\n<div class="stanza"><p>In su le man commesse mi protesi,</p>\n<p>guardando il foco e imaginando forte</p>\n<p>umani corpi gi&agrave; veduti accesi.</p></div>\n\n<div class="stanza"><p>Volsersi verso me le buone scorte;</p>\n<p>e Virgilio mi disse: &laquo;Figliuol mio,</p>\n<p>qui pu&ograve; esser tormento, ma non morte.</p></div>\n\n<div class="stanza"><p>Ricorditi, ricorditi! E se io</p>\n<p>sovresso Ger&iuml;on ti guidai salvo,</p>\n<p>che far&ograve; ora presso pi&ugrave; a Dio?</p></div>\n\n<div class="stanza"><p>Credi per certo che se dentro a l&rsquo;alvo</p>\n<p>di questa fiamma stessi ben mille anni,</p>\n<p>non ti potrebbe far d&rsquo;un capel calvo.</p></div>\n\n<div class="stanza"><p>E se tu forse credi ch&rsquo;io t&rsquo;inganni,</p>\n<p>fatti ver&rsquo; lei, e fatti far credenza</p>\n<p>con le tue mani al lembo d&rsquo;i tuoi panni.</p></div>\n\n<div class="stanza"><p>Pon gi&ugrave; omai, pon gi&ugrave; ogne temenza;</p>\n<p>volgiti in qua e vieni: entra sicuro!&raquo;.</p>\n<p>E io pur fermo e contra cosc&iuml;enza.</p></div>\n\n<div class="stanza"><p>Quando mi vide star pur fermo e duro,</p>\n<p>turbato un poco disse: &laquo;Or vedi, figlio:</p>\n<p>tra B&euml;atrice e te &egrave; questo muro&raquo;.</p></div>\n\n<div class="stanza"><p>Come al nome di Tisbe aperse il ciglio</p>\n<p>Piramo in su la morte, e riguardolla,</p>\n<p>allor che &rsquo;l gelso divent&ograve; vermiglio;</p></div>\n\n<div class="stanza"><p>cos&igrave;, la mia durezza fatta solla,</p>\n<p>mi volsi al savio duca, udendo il nome</p>\n<p>che ne la mente sempre mi rampolla.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; ei croll&ograve; la fronte e disse: &laquo;Come!</p>\n<p>volenci star di qua?&raquo;; indi sorrise</p>\n<p>come al fanciul si fa ch&rsquo;&egrave; vinto al pome.</p></div>\n\n<div class="stanza"><p>Poi dentro al foco innanzi mi si mise,</p>\n<p>pregando Stazio che venisse retro,</p>\n<p>che pria per lunga strada ci divise.</p></div>\n\n<div class="stanza"><p>S&igrave; com&rsquo; fui dentro, in un bogliente vetro</p>\n<p>gittato mi sarei per rinfrescarmi,</p>\n<p>tant&rsquo; era ivi lo &rsquo;ncendio sanza metro.</p></div>\n\n<div class="stanza"><p>Lo dolce padre mio, per confortarmi,</p>\n<p>pur di Beatrice ragionando andava,</p>\n<p>dicendo: &laquo;Li occhi suoi gi&agrave; veder parmi&raquo;.</p></div>\n\n<div class="stanza"><p>Guidavaci una voce che cantava</p>\n<p>di l&agrave;; e noi, attenti pur a lei,</p>\n<p>venimmo fuor l&agrave; ove si montava.</p></div>\n\n<div class="stanza"><p>&lsquo;Venite, benedicti Patris mei&rsquo;,</p>\n<p>son&ograve; dentro a un lume che l&igrave; era,</p>\n<p>tal che mi vinse e guardar nol potei.</p></div>\n\n<div class="stanza"><p>&laquo;Lo sol sen va&raquo;, soggiunse, &laquo;e vien la sera;</p>\n<p>non v&rsquo;arrestate, ma studiate il passo,</p>\n<p>mentre che l&rsquo;occidente non si annera&raquo;.</p></div>\n\n<div class="stanza"><p>Dritta salia la via per entro &rsquo;l sasso</p>\n<p>verso tal parte ch&rsquo;io toglieva i raggi</p>\n<p>dinanzi a me del sol ch&rsquo;era gi&agrave; basso.</p></div>\n\n<div class="stanza"><p>E di pochi scaglion levammo i saggi,</p>\n<p>che &rsquo;l sol corcar, per l&rsquo;ombra che si spense,</p>\n<p>sentimmo dietro e io e li miei saggi.</p></div>\n\n<div class="stanza"><p>E pria che &rsquo;n tutte le sue parti immense</p>\n<p>fosse orizzonte fatto d&rsquo;uno aspetto,</p>\n<p>e notte avesse tutte sue dispense,</p></div>\n\n<div class="stanza"><p>ciascun di noi d&rsquo;un grado fece letto;</p>\n<p>ch&eacute; la natura del monte ci affranse</p>\n<p>la possa del salir pi&ugrave; e &rsquo;l diletto.</p></div>\n\n<div class="stanza"><p>Quali si stanno ruminando manse</p>\n<p>le capre, state rapide e proterve</p>\n<p>sovra le cime avante che sien pranse,</p></div>\n\n<div class="stanza"><p>tacite a l&rsquo;ombra, mentre che &rsquo;l sol ferve,</p>\n<p>guardate dal pastor, che &rsquo;n su la verga</p>\n<p>poggiato s&rsquo;&egrave; e lor di posa serve;</p></div>\n\n<div class="stanza"><p>e quale il mandr&iuml;an che fori alberga,</p>\n<p>lungo il pecuglio suo queto pernotta,</p>\n<p>guardando perch&eacute; fiera non lo sperga;</p></div>\n\n<div class="stanza"><p>tali eravamo tutti e tre allotta,</p>\n<p>io come capra, ed ei come pastori,</p>\n<p>fasciati quinci e quindi d&rsquo;alta grotta.</p></div>\n\n<div class="stanza"><p>Poco parer potea l&igrave; del di fori;</p>\n<p>ma, per quel poco, vedea io le stelle</p>\n<p>di lor solere e pi&ugrave; chiare e maggiori.</p></div>\n\n<div class="stanza"><p>S&igrave; ruminando e s&igrave; mirando in quelle,</p>\n<p>mi prese il sonno; il sonno che sovente,</p>\n<p>anzi che &rsquo;l fatto sia, sa le novelle.</p></div>\n\n<div class="stanza"><p>Ne l&rsquo;ora, credo, che de l&rsquo;or&iuml;ente</p>\n<p>prima raggi&ograve; nel monte Citerea,</p>\n<p>che di foco d&rsquo;amor par sempre ardente,</p></div>\n\n<div class="stanza"><p>giovane e bella in sogno mi parea</p>\n<p>donna vedere andar per una landa</p>\n<p>cogliendo fiori; e cantando dicea:</p></div>\n\n<div class="stanza"><p>&laquo;Sappia qualunque il mio nome dimanda</p>\n<p>ch&rsquo;i&rsquo; mi son Lia, e vo movendo intorno</p>\n<p>le belle mani a farmi una ghirlanda.</p></div>\n\n<div class="stanza"><p>Per piacermi a lo specchio, qui m&rsquo;addorno;</p>\n<p>ma mia suora Rachel mai non si smaga</p>\n<p>dal suo miraglio, e siede tutto giorno.</p></div>\n\n<div class="stanza"><p>Ell&rsquo; &egrave; d&rsquo;i suoi belli occhi veder vaga</p>\n<p>com&rsquo; io de l&rsquo;addornarmi con le mani;</p>\n<p>lei lo vedere, e me l&rsquo;ovrare appaga&raquo;.</p></div>\n\n<div class="stanza"><p>E gi&agrave; per li splendori antelucani,</p>\n<p>che tanto a&rsquo; pellegrin surgon pi&ugrave; grati,</p>\n<p>quanto, tornando, albergan men lontani,</p></div>\n\n<div class="stanza"><p>le tenebre fuggian da tutti lati,</p>\n<p>e &rsquo;l sonno mio con esse; ond&rsquo; io leva&rsquo;mi,</p>\n<p>veggendo i gran maestri gi&agrave; levati.</p></div>\n\n<div class="stanza"><p>&laquo;Quel dolce pome che per tanti rami</p>\n<p>cercando va la cura de&rsquo; mortali,</p>\n<p>oggi porr&agrave; in pace le tue fami&raquo;.</p></div>\n\n<div class="stanza"><p>Virgilio inverso me queste cotali</p>\n<p>parole us&ograve;; e mai non furo strenne</p>\n<p>che fosser di piacere a queste iguali.</p></div>\n\n<div class="stanza"><p>Tanto voler sopra voler mi venne</p>\n<p>de l&rsquo;esser s&ugrave;, ch&rsquo;ad ogne passo poi</p>\n<p>al volo mi sentia crescer le penne.</p></div>\n\n<div class="stanza"><p>Come la scala tutta sotto noi</p>\n<p>fu corsa e fummo in su &rsquo;l grado superno,</p>\n<p>in me ficc&ograve; Virgilio li occhi suoi,</p></div>\n\n<div class="stanza"><p>e disse: &laquo;Il temporal foco e l&rsquo;etterno</p>\n<p>veduto hai, figlio; e se&rsquo; venuto in parte</p>\n<p>dov&rsquo; io per me pi&ugrave; oltre non discerno.</p></div>\n\n<div class="stanza"><p>Tratto t&rsquo;ho qui con ingegno e con arte;</p>\n<p>lo tuo piacere omai prendi per duce;</p>\n<p>fuor se&rsquo; de l&rsquo;erte vie, fuor se&rsquo; de l&rsquo;arte.</p></div>\n\n<div class="stanza"><p>Vedi lo sol che &rsquo;n fronte ti riluce;</p>\n<p>vedi l&rsquo;erbette, i fiori e li arbuscelli</p>\n<p>che qui la terra sol da s&eacute; produce.</p></div>\n\n<div class="stanza"><p>Mentre che vegnan lieti li occhi belli</p>\n<p>che, lagrimando, a te venir mi fenno,</p>\n<p>seder ti puoi e puoi andar tra elli.</p></div>\n\n<div class="stanza"><p>Non aspettar mio dir pi&ugrave; n&eacute; mio cenno;</p>\n<p>libero, dritto e sano &egrave; tuo arbitrio,</p>\n<p>e fallo fora non fare a suo senno:</p></div>\n\n<div class="stanza"><p>per ch&rsquo;io te sovra te corono e mitrio&raquo;.</p></div>','<p class="cantohead">Canto XXVIII</p>\n\n<div class="stanza"><p>Vago gi&agrave; di cercar dentro e dintorno</p>\n<p>la divina foresta spessa e viva,</p>\n<p>ch&rsquo;a li occhi temperava il novo giorno,</p></div>\n\n<div class="stanza"><p>sanza pi&ugrave; aspettar, lasciai la riva,</p>\n<p>prendendo la campagna lento lento</p>\n<p>su per lo suol che d&rsquo;ogne parte auliva.</p></div>\n\n<div class="stanza"><p>Un&rsquo;aura dolce, sanza mutamento</p>\n<p>avere in s&eacute;, mi feria per la fronte</p>\n<p>non di pi&ugrave; colpo che soave vento;</p></div>\n\n<div class="stanza"><p>per cui le fronde, tremolando, pronte</p>\n<p>tutte quante piegavano a la parte</p>\n<p>u&rsquo; la prim&rsquo; ombra gitta il santo monte;</p></div>\n\n<div class="stanza"><p>non per&ograve; dal loro esser dritto sparte</p>\n<p>tanto, che li augelletti per le cime</p>\n<p>lasciasser d&rsquo;operare ogne lor arte;</p></div>\n\n<div class="stanza"><p>ma con piena letizia l&rsquo;ore prime,</p>\n<p>cantando, ricevieno intra le foglie,</p>\n<p>che tenevan bordone a le sue rime,</p></div>\n\n<div class="stanza"><p>tal qual di ramo in ramo si raccoglie</p>\n<p>per la pineta in su &rsquo;l lito di Chiassi,</p>\n<p>quand&rsquo; &euml;olo scilocco fuor discioglie.</p></div>\n\n<div class="stanza"><p>Gi&agrave; m&rsquo;avean trasportato i lenti passi</p>\n<p>dentro a la selva antica tanto, ch&rsquo;io</p>\n<p>non potea rivedere ond&rsquo; io mi &rsquo;ntrassi;</p></div>\n\n<div class="stanza"><p>ed ecco pi&ugrave; andar mi tolse un rio,</p>\n<p>che &rsquo;nver&rsquo; sinistra con sue picciole onde</p>\n<p>piegava l&rsquo;erba che &rsquo;n sua ripa usc&igrave;o.</p></div>\n\n<div class="stanza"><p>Tutte l&rsquo;acque che son di qua pi&ugrave; monde,</p>\n<p>parrieno avere in s&eacute; mistura alcuna</p>\n<p>verso di quella, che nulla nasconde,</p></div>\n\n<div class="stanza"><p>avvegna che si mova bruna bruna</p>\n<p>sotto l&rsquo;ombra perpet&uuml;a, che mai</p>\n<p>raggiar non lascia sole ivi n&eacute; luna.</p></div>\n\n<div class="stanza"><p>Coi pi&egrave; ristetti e con li occhi passai</p>\n<p>di l&agrave; dal fiumicello, per mirare</p>\n<p>la gran var&iuml;azion d&rsquo;i freschi mai;</p></div>\n\n<div class="stanza"><p>e l&agrave; m&rsquo;apparve, s&igrave; com&rsquo; elli appare</p>\n<p>subitamente cosa che disvia</p>\n<p>per maraviglia tutto altro pensare,</p></div>\n\n<div class="stanza"><p>una donna soletta che si gia</p>\n<p>e cantando e scegliendo fior da fiore</p>\n<p>ond&rsquo; era pinta tutta la sua via.</p></div>\n\n<div class="stanza"><p>&laquo;Deh, bella donna, che a&rsquo; raggi d&rsquo;amore</p>\n<p>ti scaldi, s&rsquo;i&rsquo; vo&rsquo; credere a&rsquo; sembianti</p>\n<p>che soglion esser testimon del core,</p></div>\n\n<div class="stanza"><p>vegnati in voglia di trarreti avanti&raquo;,</p>\n<p>diss&rsquo; io a lei, &laquo;verso questa rivera,</p>\n<p>tanto ch&rsquo;io possa intender che tu canti.</p></div>\n\n<div class="stanza"><p>Tu mi fai rimembrar dove e qual era</p>\n<p>Proserpina nel tempo che perdette</p>\n<p>la madre lei, ed ella primavera&raquo;.</p></div>\n\n<div class="stanza"><p>Come si volge, con le piante strette</p>\n<p>a terra e intra s&eacute;, donna che balli,</p>\n<p>e piede innanzi piede a pena mette,</p></div>\n\n<div class="stanza"><p>volsesi in su i vermigli e in su i gialli</p>\n<p>fioretti verso me, non altrimenti</p>\n<p>che vergine che li occhi onesti avvalli;</p></div>\n\n<div class="stanza"><p>e fece i prieghi miei esser contenti,</p>\n<p>s&igrave; appressando s&eacute;, che &rsquo;l dolce suono</p>\n<p>veniva a me co&rsquo; suoi intendimenti.</p></div>\n\n<div class="stanza"><p>Tosto che fu l&agrave; dove l&rsquo;erbe sono</p>\n<p>bagnate gi&agrave; da l&rsquo;onde del bel fiume,</p>\n<p>di levar li occhi suoi mi fece dono.</p></div>\n\n<div class="stanza"><p>Non credo che splendesse tanto lume</p>\n<p>sotto le ciglia a Venere, trafitta</p>\n<p>dal figlio fuor di tutto suo costume.</p></div>\n\n<div class="stanza"><p>Ella ridea da l&rsquo;altra riva dritta,</p>\n<p>trattando pi&ugrave; color con le sue mani,</p>\n<p>che l&rsquo;alta terra sanza seme gitta.</p></div>\n\n<div class="stanza"><p>Tre passi ci facea il fiume lontani;</p>\n<p>ma Elesponto, l&agrave; &rsquo;ve pass&ograve; Serse,</p>\n<p>ancora freno a tutti orgogli umani,</p></div>\n\n<div class="stanza"><p>pi&ugrave; odio da Leandro non sofferse</p>\n<p>per mareggiare intra Sesto e Abido,</p>\n<p>che quel da me perch&rsquo; allor non s&rsquo;aperse.</p></div>\n\n<div class="stanza"><p>&laquo;Voi siete nuovi, e forse perch&rsquo; io rido&raquo;,</p>\n<p>cominci&ograve; ella, &laquo;in questo luogo eletto</p>\n<p>a l&rsquo;umana natura per suo nido,</p></div>\n\n<div class="stanza"><p>maravigliando tienvi alcun sospetto;</p>\n<p>ma luce rende il salmo Delectasti,</p>\n<p>che puote disnebbiar vostro intelletto.</p></div>\n\n<div class="stanza"><p>E tu che se&rsquo; dinanzi e mi pregasti,</p>\n<p>d&igrave; s&rsquo;altro vuoli udir; ch&rsquo;i&rsquo; venni presta</p>\n<p>ad ogne tua question tanto che basti&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;L&rsquo;acqua&raquo;, diss&rsquo; io, &laquo;e &rsquo;l suon de la foresta</p>\n<p>impugnan dentro a me novella fede</p>\n<p>di cosa ch&rsquo;io udi&rsquo; contraria a questa&raquo;.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; ella: &laquo;Io dicer&ograve; come procede</p>\n<p>per sua cagion ci&ograve; ch&rsquo;ammirar ti face,</p>\n<p>e purgher&ograve; la nebbia che ti fiede.</p></div>\n\n<div class="stanza"><p>Lo sommo Ben, che solo esso a s&eacute; piace,</p>\n<p>f&eacute; l&rsquo;uom buono e a bene, e questo loco</p>\n<p>diede per arr&rsquo; a lui d&rsquo;etterna pace.</p></div>\n\n<div class="stanza"><p>Per sua difalta qui dimor&ograve; poco;</p>\n<p>per sua difalta in pianto e in affanno</p>\n<p>cambi&ograve; onesto riso e dolce gioco.</p></div>\n\n<div class="stanza"><p>Perch&eacute; &rsquo;l turbar che sotto da s&eacute; fanno</p>\n<p>l&rsquo;essalazion de l&rsquo;acqua e de la terra,</p>\n<p>che quanto posson dietro al calor vanno,</p></div>\n\n<div class="stanza"><p>a l&rsquo;uomo non facesse alcuna guerra,</p>\n<p>questo monte sal&igrave;o verso &rsquo;l ciel tanto,</p>\n<p>e libero n&rsquo;&egrave; d&rsquo;indi ove si serra.</p></div>\n\n<div class="stanza"><p>Or perch&eacute; in circuito tutto quanto</p>\n<p>l&rsquo;aere si volge con la prima volta,</p>\n<p>se non li &egrave; rotto il cerchio d&rsquo;alcun canto,</p></div>\n\n<div class="stanza"><p>in questa altezza ch&rsquo;&egrave; tutta disciolta</p>\n<p>ne l&rsquo;aere vivo, tal moto percuote,</p>\n<p>e fa sonar la selva perch&rsquo; &egrave; folta;</p></div>\n\n<div class="stanza"><p>e la percossa pianta tanto puote,</p>\n<p>che de la sua virtute l&rsquo;aura impregna</p>\n<p>e quella poi, girando, intorno scuote;</p></div>\n\n<div class="stanza"><p>e l&rsquo;altra terra, secondo ch&rsquo;&egrave; degna</p>\n<p>per s&eacute; e per suo ciel, concepe e figlia</p>\n<p>di diverse virt&ugrave; diverse legna.</p></div>\n\n<div class="stanza"><p>Non parrebbe di l&agrave; poi maraviglia,</p>\n<p>udito questo, quando alcuna pianta</p>\n<p>sanza seme palese vi s&rsquo;appiglia.</p></div>\n\n<div class="stanza"><p>E saper dei che la campagna santa</p>\n<p>dove tu se&rsquo;, d&rsquo;ogne semenza &egrave; piena,</p>\n<p>e frutto ha in s&eacute; che di l&agrave; non si schianta.</p></div>\n\n<div class="stanza"><p>L&rsquo;acqua che vedi non surge di vena</p>\n<p>che ristori vapor che gel converta,</p>\n<p>come fiume ch&rsquo;acquista e perde lena;</p></div>\n\n<div class="stanza"><p>ma esce di fontana salda e certa,</p>\n<p>che tanto dal voler di Dio riprende,</p>\n<p>quant&rsquo; ella versa da due parti aperta.</p></div>\n\n<div class="stanza"><p>Da questa parte con virt&ugrave; discende</p>\n<p>che toglie altrui memoria del peccato;</p>\n<p>da l&rsquo;altra d&rsquo;ogne ben fatto la rende.</p></div>\n\n<div class="stanza"><p>Quinci Let&egrave;; cos&igrave; da l&rsquo;altro lato</p>\n<p>E&uuml;no&egrave; si chiama, e non adopra</p>\n<p>se quinci e quindi pria non &egrave; gustato:</p></div>\n\n<div class="stanza"><p>a tutti altri sapori esto &egrave; di sopra.</p>\n<p>E avvegna ch&rsquo;assai possa esser sazia</p>\n<p>la sete tua perch&rsquo; io pi&ugrave; non ti scuopra,</p></div>\n\n<div class="stanza"><p>darotti un corollario ancor per grazia;</p>\n<p>n&eacute; credo che &rsquo;l mio dir ti sia men caro,</p>\n<p>se oltre promession teco si spazia.</p></div>\n\n<div class="stanza"><p>Quelli ch&rsquo;anticamente poetaro</p>\n<p>l&rsquo;et&agrave; de l&rsquo;oro e suo stato felice,</p>\n<p>forse in Parnaso esto loco sognaro.</p></div>\n\n<div class="stanza"><p>Qui fu innocente l&rsquo;umana radice;</p>\n<p>qui primavera sempre e ogne frutto;</p>\n<p>nettare &egrave; questo di che ciascun dice&raquo;.</p></div>\n\n<div class="stanza"><p>Io mi rivolsi &rsquo;n dietro allora tutto</p>\n<p>a&rsquo; miei poeti, e vidi che con riso</p>\n<p>udito av&euml;an l&rsquo;ultimo costrutto;</p></div>\n\n<div class="stanza"><p>poi a la bella donna torna&rsquo; il viso.</p></div>','<p class="cantohead">Canto XXIX</p>\n\n<div class="stanza"><p>Cantando come donna innamorata,</p>\n<p>contin&uuml;&ograve; col fin di sue parole:</p>\n<p>&lsquo;Beati quorum tecta sunt peccata!&rsquo;.</p></div>\n\n<div class="stanza"><p>E come ninfe che si givan sole</p>\n<p>per le salvatiche ombre, dis&iuml;ando</p>\n<p>qual di veder, qual di fuggir lo sole,</p></div>\n\n<div class="stanza"><p>allor si mosse contra &rsquo;l fiume, andando</p>\n<p>su per la riva; e io pari di lei,</p>\n<p>picciol passo con picciol seguitando.</p></div>\n\n<div class="stanza"><p>Non eran cento tra &rsquo; suoi passi e &rsquo; miei,</p>\n<p>quando le ripe igualmente dier volta,</p>\n<p>per modo ch&rsquo;a levante mi rendei.</p></div>\n\n<div class="stanza"><p>N&eacute; ancor fu cos&igrave; nostra via molta,</p>\n<p>quando la donna tutta a me si torse,</p>\n<p>dicendo: &laquo;Frate mio, guarda e ascolta&raquo;.</p></div>\n\n<div class="stanza"><p>Ed ecco un lustro s&ugrave;bito trascorse</p>\n<p>da tutte parti per la gran foresta,</p>\n<p>tal che di balenar mi mise in forse.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; &rsquo;l balenar, come vien, resta,</p>\n<p>e quel, durando, pi&ugrave; e pi&ugrave; splendeva,</p>\n<p>nel mio pensier dicea: &lsquo;Che cosa &egrave; questa?&rsquo;.</p></div>\n\n<div class="stanza"><p>E una melodia dolce correva</p>\n<p>per l&rsquo;aere luminoso; onde buon zelo</p>\n<p>mi f&eacute; riprender l&rsquo;ardimento d&rsquo;Eva,</p></div>\n\n<div class="stanza"><p>che l&agrave; dove ubidia la terra e &rsquo;l cielo,</p>\n<p>femmina, sola e pur test&eacute; formata,</p>\n<p>non sofferse di star sotto alcun velo;</p></div>\n\n<div class="stanza"><p>sotto &rsquo;l qual se divota fosse stata,</p>\n<p>avrei quelle ineffabili delizie</p>\n<p>sentite prima e pi&ugrave; lunga f&iuml;ata.</p></div>\n\n<div class="stanza"><p>Mentr&rsquo; io m&rsquo;andava tra tante primizie</p>\n<p>de l&rsquo;etterno piacer tutto sospeso,</p>\n<p>e dis&iuml;oso ancora a pi&ugrave; letizie,</p></div>\n\n<div class="stanza"><p>dinanzi a noi, tal quale un foco acceso,</p>\n<p>ci si f&eacute; l&rsquo;aere sotto i verdi rami;</p>\n<p>e &rsquo;l dolce suon per canti era gi&agrave; inteso.</p></div>\n\n<div class="stanza"><p>O sacrosante Vergini, se fami,</p>\n<p>freddi o vigilie mai per voi soffersi,</p>\n<p>cagion mi sprona ch&rsquo;io merc&eacute; vi chiami.</p></div>\n\n<div class="stanza"><p>Or convien che Elicona per me versi,</p>\n<p>e Uran&igrave;e m&rsquo;aiuti col suo coro</p>\n<p>forti cose a pensar mettere in versi.</p></div>\n\n<div class="stanza"><p>Poco pi&ugrave; oltre, sette alberi d&rsquo;oro</p>\n<p>falsava nel parere il lungo tratto</p>\n<p>del mezzo ch&rsquo;era ancor tra noi e loro;</p></div>\n\n<div class="stanza"><p>ma quand&rsquo; i&rsquo; fui s&igrave; presso di lor fatto,</p>\n<p>che l&rsquo;obietto comun, che &rsquo;l senso inganna,</p>\n<p>non perdea per distanza alcun suo atto,</p></div>\n\n<div class="stanza"><p>la virt&ugrave; ch&rsquo;a ragion discorso ammanna,</p>\n<p>s&igrave; com&rsquo; elli eran candelabri apprese,</p>\n<p>e ne le voci del cantare &lsquo;Osanna&rsquo;.</p></div>\n\n<div class="stanza"><p>Di sopra fiammeggiava il bello arnese</p>\n<p>pi&ugrave; chiaro assai che luna per sereno</p>\n<p>di mezza notte nel suo mezzo mese.</p></div>\n\n<div class="stanza"><p>Io mi rivolsi d&rsquo;ammirazion pieno</p>\n<p>al buon Virgilio, ed esso mi rispuose</p>\n<p>con vista carca di stupor non meno.</p></div>\n\n<div class="stanza"><p>Indi rendei l&rsquo;aspetto a l&rsquo;alte cose</p>\n<p>che si movieno incontr&rsquo; a noi s&igrave; tardi,</p>\n<p>che foran vinte da novelle spose.</p></div>\n\n<div class="stanza"><p>La donna mi sgrid&ograve;: &laquo;Perch&eacute; pur ardi</p>\n<p>s&igrave; ne l&rsquo;affetto de le vive luci,</p>\n<p>e ci&ograve; che vien di retro a lor non guardi?&raquo;.</p></div>\n\n<div class="stanza"><p>Genti vid&rsquo; io allor, come a lor duci,</p>\n<p>venire appresso, vestite di bianco;</p>\n<p>e tal candor di qua gi&agrave; mai non fuci.</p></div>\n\n<div class="stanza"><p>L&rsquo;acqua imprend&euml;a dal sinistro fianco,</p>\n<p>e rendea me la mia sinistra costa,</p>\n<p>s&rsquo;io riguardava in lei, come specchio anco.</p></div>\n\n<div class="stanza"><p>Quand&rsquo; io da la mia riva ebbi tal posta,</p>\n<p>che solo il fiume mi facea distante,</p>\n<p>per veder meglio ai passi diedi sosta,</p></div>\n\n<div class="stanza"><p>e vidi le fiammelle andar davante,</p>\n<p>lasciando dietro a s&eacute; l&rsquo;aere dipinto,</p>\n<p>e di tratti pennelli avean sembiante;</p></div>\n\n<div class="stanza"><p>s&igrave; che l&igrave; sopra rimanea distinto</p>\n<p>di sette liste, tutte in quei colori</p>\n<p>onde fa l&rsquo;arco il Sole e Delia il cinto.</p></div>\n\n<div class="stanza"><p>Questi ostendali in dietro eran maggiori</p>\n<p>che la mia vista; e, quanto a mio avviso,</p>\n<p>diece passi distavan quei di fori.</p></div>\n\n<div class="stanza"><p>Sotto cos&igrave; bel ciel com&rsquo; io diviso,</p>\n<p>ventiquattro seniori, a due a due,</p>\n<p>coronati venien di fiordaliso.</p></div>\n\n<div class="stanza"><p>Tutti cantavan: &laquo;Benedicta tue</p>\n<p>ne le figlie d&rsquo;Adamo, e benedette</p>\n<p>sieno in etterno le bellezze tue!&raquo;.</p></div>\n\n<div class="stanza"><p>Poscia che i fiori e l&rsquo;altre fresche erbette</p>\n<p>a rimpetto di me da l&rsquo;altra sponda</p>\n<p>libere fuor da quelle genti elette,</p></div>\n\n<div class="stanza"><p>s&igrave; come luce luce in ciel seconda,</p>\n<p>vennero appresso lor quattro animali,</p>\n<p>coronati ciascun di verde fronda.</p></div>\n\n<div class="stanza"><p>Ognuno era pennuto di sei ali;</p>\n<p>le penne piene d&rsquo;occhi; e li occhi d&rsquo;Argo,</p>\n<p>se fosser vivi, sarebber cotali.</p></div>\n\n<div class="stanza"><p>A descriver lor forme pi&ugrave; non spargo</p>\n<p>rime, lettor; ch&rsquo;altra spesa mi strigne,</p>\n<p>tanto ch&rsquo;a questa non posso esser largo;</p></div>\n\n<div class="stanza"><p>ma leggi Ezech&iuml;el, che li dipigne</p>\n<p>come li vide da la fredda parte</p>\n<p>venir con vento e con nube e con igne;</p></div>\n\n<div class="stanza"><p>e quali i troverai ne le sue carte,</p>\n<p>tali eran quivi, salvo ch&rsquo;a le penne</p>\n<p>Giovanni &egrave; meco e da lui si diparte.</p></div>\n\n<div class="stanza"><p>Lo spazio dentro a lor quattro contenne</p>\n<p>un carro, in su due rote, tr&iuml;unfale,</p>\n<p>ch&rsquo;al collo d&rsquo;un grifon tirato venne.</p></div>\n\n<div class="stanza"><p>Esso tendeva in s&ugrave; l&rsquo;una e l&rsquo;altra ale</p>\n<p>tra la mezzana e le tre e tre liste,</p>\n<p>s&igrave; ch&rsquo;a nulla, fendendo, facea male.</p></div>\n\n<div class="stanza"><p>Tanto salivan che non eran viste;</p>\n<p>le membra d&rsquo;oro avea quant&rsquo; era uccello,</p>\n<p>e bianche l&rsquo;altre, di vermiglio miste.</p></div>\n\n<div class="stanza"><p>Non che Roma di carro cos&igrave; bello</p>\n<p>rallegrasse Affricano, o vero Augusto,</p>\n<p>ma quel del Sol saria pover con ello;</p></div>\n\n<div class="stanza"><p>quel del Sol che, sv&iuml;ando, fu combusto</p>\n<p>per l&rsquo;orazion de la Terra devota,</p>\n<p>quando fu Giove arcanamente giusto.</p></div>\n\n<div class="stanza"><p>Tre donne in giro da la destra rota</p>\n<p>venian danzando; l&rsquo;una tanto rossa</p>\n<p>ch&rsquo;a pena fora dentro al foco nota;</p></div>\n\n<div class="stanza"><p>l&rsquo;altr&rsquo; era come se le carni e l&rsquo;ossa</p>\n<p>fossero state di smeraldo fatte;</p>\n<p>la terza parea neve test&eacute; mossa;</p></div>\n\n<div class="stanza"><p>e or par&euml;an da la bianca tratte,</p>\n<p>or da la rossa; e dal canto di questa</p>\n<p>l&rsquo;altre toglien l&rsquo;andare e tarde e ratte.</p></div>\n\n<div class="stanza"><p>Da la sinistra quattro facean festa,</p>\n<p>in porpore vestite, dietro al modo</p>\n<p>d&rsquo;una di lor ch&rsquo;avea tre occhi in testa.</p></div>\n\n<div class="stanza"><p>Appresso tutto il pertrattato nodo</p>\n<p>vidi due vecchi in abito dispari,</p>\n<p>ma pari in atto e onesto e sodo.</p></div>\n\n<div class="stanza"><p>L&rsquo;un si mostrava alcun de&rsquo; famigliari</p>\n<p>di quel sommo Ipocr&agrave;te che natura</p>\n<p>a li animali f&eacute; ch&rsquo;ell&rsquo; ha pi&ugrave; cari;</p></div>\n\n<div class="stanza"><p>mostrava l&rsquo;altro la contraria cura</p>\n<p>con una spada lucida e aguta,</p>\n<p>tal che di qua dal rio mi f&eacute; paura.</p></div>\n\n<div class="stanza"><p>Poi vidi quattro in umile paruta;</p>\n<p>e di retro da tutti un vecchio solo</p>\n<p>venir, dormendo, con la faccia arguta.</p></div>\n\n<div class="stanza"><p>E questi sette col primaio stuolo</p>\n<p>erano abit&uuml;ati, ma di gigli</p>\n<p>dintorno al capo non fac&euml;an brolo,</p></div>\n\n<div class="stanza"><p>anzi di rose e d&rsquo;altri fior vermigli;</p>\n<p>giurato avria poco lontano aspetto</p>\n<p>che tutti ardesser di sopra da&rsquo; cigli.</p></div>\n\n<div class="stanza"><p>E quando il carro a me fu a rimpetto,</p>\n<p>un tuon s&rsquo;ud&igrave;, e quelle genti degne</p>\n<p>parvero aver l&rsquo;andar pi&ugrave; interdetto,</p></div>\n\n<div class="stanza"><p>fermandosi ivi con le prime insegne.</p></div>','<p class="cantohead">Canto XXX</p>\n\n<div class="stanza"><p>Quando il settentr&iuml;on del primo cielo,</p>\n<p>che n&eacute; occaso mai seppe n&eacute; orto</p>\n<p>n&eacute; d&rsquo;altra nebbia che di colpa velo,</p></div>\n\n<div class="stanza"><p>e che faceva l&igrave; ciascun accorto</p>\n<p>di suo dover, come &rsquo;l pi&ugrave; basso face</p>\n<p>qual temon gira per venire a porto,</p></div>\n\n<div class="stanza"><p>fermo s&rsquo;affisse: la gente verace,</p>\n<p>venuta prima tra &rsquo;l grifone ed esso,</p>\n<p>al carro volse s&eacute; come a sua pace;</p></div>\n\n<div class="stanza"><p>e un di loro, quasi da ciel messo,</p>\n<p>&lsquo;Veni, sponsa, de Libano&rsquo; cantando</p>\n<p>grid&ograve; tre volte, e tutti li altri appresso.</p></div>\n\n<div class="stanza"><p>Quali i beati al novissimo bando</p>\n<p>surgeran presti ognun di sua caverna,</p>\n<p>la revestita voce alleluiando,</p></div>\n\n<div class="stanza"><p>cotali in su la divina basterna</p>\n<p>si levar cento, ad vocem tanti senis,</p>\n<p>ministri e messaggier di vita etterna.</p></div>\n\n<div class="stanza"><p>Tutti dicean: &lsquo;Benedictus qui venis!&rsquo;,</p>\n<p>e fior gittando e di sopra e dintorno,</p>\n<p>&lsquo;Manibus, oh, date lil&iuml;a plenis!&rsquo;.</p></div>\n\n<div class="stanza"><p>Io vidi gi&agrave; nel cominciar del giorno</p>\n<p>la parte or&iuml;ental tutta rosata,</p>\n<p>e l&rsquo;altro ciel di bel sereno addorno;</p></div>\n\n<div class="stanza"><p>e la faccia del sol nascere ombrata,</p>\n<p>s&igrave; che per temperanza di vapori</p>\n<p>l&rsquo;occhio la sostenea lunga f&iuml;ata:</p></div>\n\n<div class="stanza"><p>cos&igrave; dentro una nuvola di fiori</p>\n<p>che da le mani angeliche saliva</p>\n<p>e ricadeva in gi&ugrave; dentro e di fori,</p></div>\n\n<div class="stanza"><p>sovra candido vel cinta d&rsquo;uliva</p>\n<p>donna m&rsquo;apparve, sotto verde manto</p>\n<p>vestita di color di fiamma viva.</p></div>\n\n<div class="stanza"><p>E lo spirito mio, che gi&agrave; cotanto</p>\n<p>tempo era stato ch&rsquo;a la sua presenza</p>\n<p>non era di stupor, tremando, affranto,</p></div>\n\n<div class="stanza"><p>sanza de li occhi aver pi&ugrave; conoscenza,</p>\n<p>per occulta virt&ugrave; che da lei mosse,</p>\n<p>d&rsquo;antico amor sent&igrave; la gran potenza.</p></div>\n\n<div class="stanza"><p>Tosto che ne la vista mi percosse</p>\n<p>l&rsquo;alta virt&ugrave; che gi&agrave; m&rsquo;avea trafitto</p>\n<p>prima ch&rsquo;io fuor di p&uuml;erizia fosse,</p></div>\n\n<div class="stanza"><p>volsimi a la sinistra col respitto</p>\n<p>col quale il fantolin corre a la mamma</p>\n<p>quando ha paura o quando elli &egrave; afflitto,</p></div>\n\n<div class="stanza"><p>per dicere a Virgilio: &lsquo;Men che dramma</p>\n<p>di sangue m&rsquo;&egrave; rimaso che non tremi:</p>\n<p>conosco i segni de l&rsquo;antica fiamma&rsquo;.</p></div>\n\n<div class="stanza"><p>Ma Virgilio n&rsquo;avea lasciati scemi</p>\n<p>di s&eacute;, Virgilio dolcissimo patre,</p>\n<p>Virgilio a cui per mia salute die&rsquo;mi;</p></div>\n\n<div class="stanza"><p>n&eacute; quantunque perdeo l&rsquo;antica matre,</p>\n<p>valse a le guance nette di rugiada,</p>\n<p>che, lagrimando, non tornasser atre.</p></div>\n\n<div class="stanza"><p>&laquo;Dante, perch&eacute; Virgilio se ne vada,</p>\n<p>non pianger anco, non piangere ancora;</p>\n<p>ch&eacute; pianger ti conven per altra spada&raquo;.</p></div>\n\n<div class="stanza"><p>Quasi ammiraglio che in poppa e in prora</p>\n<p>viene a veder la gente che ministra</p>\n<p>per li altri legni, e a ben far l&rsquo;incora;</p></div>\n\n<div class="stanza"><p>in su la sponda del carro sinistra,</p>\n<p>quando mi volsi al suon del nome mio,</p>\n<p>che di necessit&agrave; qui si registra,</p></div>\n\n<div class="stanza"><p>vidi la donna che pria m&rsquo;appario</p>\n<p>velata sotto l&rsquo;angelica festa,</p>\n<p>drizzar li occhi ver&rsquo; me di qua dal rio.</p></div>\n\n<div class="stanza"><p>Tutto che &rsquo;l vel che le scendea di testa,</p>\n<p>cerchiato de le fronde di Minerva,</p>\n<p>non la lasciasse parer manifesta,</p></div>\n\n<div class="stanza"><p>regalmente ne l&rsquo;atto ancor proterva</p>\n<p>contin&uuml;&ograve; come colui che dice</p>\n<p>e &rsquo;l pi&ugrave; caldo parlar dietro reserva:</p></div>\n\n<div class="stanza"><p>&laquo;Guardaci ben! Ben son, ben son Beatrice.</p>\n<p>Come degnasti d&rsquo;accedere al monte?</p>\n<p>non sapei tu che qui &egrave; l&rsquo;uom felice?&raquo;.</p></div>\n\n<div class="stanza"><p>Li occhi mi cadder gi&ugrave; nel chiaro fonte;</p>\n<p>ma veggendomi in esso, i trassi a l&rsquo;erba,</p>\n<p>tanta vergogna mi grav&ograve; la fronte.</p></div>\n\n<div class="stanza"><p>Cos&igrave; la madre al figlio par superba,</p>\n<p>com&rsquo; ella parve a me; perch&eacute; d&rsquo;amaro</p>\n<p>sente il sapor de la pietade acerba.</p></div>\n\n<div class="stanza"><p>Ella si tacque; e li angeli cantaro</p>\n<p>di s&ugrave;bito &lsquo;In te, Domine, speravi&rsquo;;</p>\n<p>ma oltre &lsquo;pedes meos&rsquo; non passaro.</p></div>\n\n<div class="stanza"><p>S&igrave; come neve tra le vive travi</p>\n<p>per lo dosso d&rsquo;Italia si congela,</p>\n<p>soffiata e stretta da li venti schiavi,</p></div>\n\n<div class="stanza"><p>poi, liquefatta, in s&eacute; stessa trapela,</p>\n<p>pur che la terra che perde ombra spiri,</p>\n<p>s&igrave; che par foco fonder la candela;</p></div>\n\n<div class="stanza"><p>cos&igrave; fui sanza lagrime e sospiri</p>\n<p>anzi &rsquo;l cantar di quei che notan sempre</p>\n<p>dietro a le note de li etterni giri;</p></div>\n\n<div class="stanza"><p>ma poi che &rsquo;ntesi ne le dolci tempre</p>\n<p>lor compatire a me, par che se detto</p>\n<p>avesser: &lsquo;Donna, perch&eacute; s&igrave; lo stempre?&rsquo;,</p></div>\n\n<div class="stanza"><p>lo gel che m&rsquo;era intorno al cor ristretto,</p>\n<p>spirito e acqua fessi, e con angoscia</p>\n<p>de la bocca e de li occhi usc&igrave; del petto.</p></div>\n\n<div class="stanza"><p>Ella, pur ferma in su la detta coscia</p>\n<p>del carro stando, a le sustanze pie</p>\n<p>volse le sue parole cos&igrave; poscia:</p></div>\n\n<div class="stanza"><p>&laquo;Voi vigilate ne l&rsquo;etterno die,</p>\n<p>s&igrave; che notte n&eacute; sonno a voi non fura</p>\n<p>passo che faccia il secol per sue vie;</p></div>\n\n<div class="stanza"><p>onde la mia risposta &egrave; con pi&ugrave; cura</p>\n<p>che m&rsquo;intenda colui che di l&agrave; piagne,</p>\n<p>perch&eacute; sia colpa e duol d&rsquo;una misura.</p></div>\n\n<div class="stanza"><p>Non pur per ovra de le rote magne,</p>\n<p>che drizzan ciascun seme ad alcun fine</p>\n<p>secondo che le stelle son compagne,</p></div>\n\n<div class="stanza"><p>ma per larghezza di grazie divine,</p>\n<p>che s&igrave; alti vapori hanno a lor piova,</p>\n<p>che nostre viste l&agrave; non van vicine,</p></div>\n\n<div class="stanza"><p>questi fu tal ne la sua vita nova</p>\n<p>virt&uuml;almente, ch&rsquo;ogne abito destro</p>\n<p>fatto averebbe in lui mirabil prova.</p></div>\n\n<div class="stanza"><p>Ma tanto pi&ugrave; maligno e pi&ugrave; silvestro</p>\n<p>si fa &rsquo;l terren col mal seme e non c&oacute;lto,</p>\n<p>quant&rsquo; elli ha pi&ugrave; di buon vigor terrestro.</p></div>\n\n<div class="stanza"><p>Alcun tempo il sostenni col mio volto:</p>\n<p>mostrando li occhi giovanetti a lui,</p>\n<p>meco il menava in dritta parte v&ograve;lto.</p></div>\n\n<div class="stanza"><p>S&igrave; tosto come in su la soglia fui</p>\n<p>di mia seconda etade e mutai vita,</p>\n<p>questi si tolse a me, e diessi altrui.</p></div>\n\n<div class="stanza"><p>Quando di carne a spirto era salita,</p>\n<p>e bellezza e virt&ugrave; cresciuta m&rsquo;era,</p>\n<p>fu&rsquo; io a lui men cara e men gradita;</p></div>\n\n<div class="stanza"><p>e volse i passi suoi per via non vera,</p>\n<p>imagini di ben seguendo false,</p>\n<p>che nulla promession rendono intera.</p></div>\n\n<div class="stanza"><p>N&eacute; l&rsquo;impetrare ispirazion mi valse,</p>\n<p>con le quali e in sogno e altrimenti</p>\n<p>lo rivocai: s&igrave; poco a lui ne calse!</p></div>\n\n<div class="stanza"><p>Tanto gi&ugrave; cadde, che tutti argomenti</p>\n<p>a la salute sua eran gi&agrave; corti,</p>\n<p>fuor che mostrarli le perdute genti.</p></div>\n\n<div class="stanza"><p>Per questo visitai l&rsquo;uscio d&rsquo;i morti,</p>\n<p>e a colui che l&rsquo;ha qua s&ugrave; condotto,</p>\n<p>li prieghi miei, piangendo, furon porti.</p></div>\n\n<div class="stanza"><p>Alto fato di Dio sarebbe rotto,</p>\n<p>se Let&egrave; si passasse e tal vivanda</p>\n<p>fosse gustata sanza alcuno scotto</p></div>\n\n<div class="stanza"><p>di pentimento che lagrime spanda&raquo;.</p></div>','<p class="cantohead">Canto XXXI</p>\n\n<div class="stanza"><p>&laquo;O tu che se&rsquo; di l&agrave; dal fiume sacro&raquo;,</p>\n<p>volgendo suo parlare a me per punta,</p>\n<p>che pur per taglio m&rsquo;era paruto acro,</p></div>\n\n<div class="stanza"><p>ricominci&ograve;, seguendo sanza cunta,</p>\n<p>&laquo;d&igrave;, d&igrave; se questo &egrave; vero: a tanta accusa</p>\n<p>tua confession conviene esser congiunta&raquo;.</p></div>\n\n<div class="stanza"><p>Era la mia virt&ugrave; tanto confusa,</p>\n<p>che la voce si mosse, e pria si spense</p>\n<p>che da li organi suoi fosse dischiusa.</p></div>\n\n<div class="stanza"><p>Poco sofferse; poi disse: &laquo;Che pense?</p>\n<p>Rispondi a me; ch&eacute; le memorie triste</p>\n<p>in te non sono ancor da l&rsquo;acqua offense&raquo;.</p></div>\n\n<div class="stanza"><p>Confusione e paura insieme miste</p>\n<p>mi pinsero un tal &laquo;s&igrave;&raquo; fuor de la bocca,</p>\n<p>al quale intender fuor mestier le viste.</p></div>\n\n<div class="stanza"><p>Come balestro frange, quando scocca</p>\n<p>da troppa tesa, la sua corda e l&rsquo;arco,</p>\n<p>e con men foga l&rsquo;asta il segno tocca,</p></div>\n\n<div class="stanza"><p>s&igrave; scoppia&rsquo; io sottesso grave carco,</p>\n<p>fuori sgorgando lagrime e sospiri,</p>\n<p>e la voce allent&ograve; per lo suo varco.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; ella a me: &laquo;Per entro i mie&rsquo; disiri,</p>\n<p>che ti menavano ad amar lo bene</p>\n<p>di l&agrave; dal qual non &egrave; a che s&rsquo;aspiri,</p></div>\n\n<div class="stanza"><p>quai fossi attraversati o quai catene</p>\n<p>trovasti, per che del passare innanzi</p>\n<p>dovessiti cos&igrave; spogliar la spene?</p></div>\n\n<div class="stanza"><p>E quali agevolezze o quali avanzi</p>\n<p>ne la fronte de li altri si mostraro,</p>\n<p>per che dovessi lor passeggiare anzi?&raquo;.</p></div>\n\n<div class="stanza"><p>Dopo la tratta d&rsquo;un sospiro amaro,</p>\n<p>a pena ebbi la voce che rispuose,</p>\n<p>e le labbra a fatica la formaro.</p></div>\n\n<div class="stanza"><p>Piangendo dissi: &laquo;Le presenti cose</p>\n<p>col falso lor piacer volser miei passi,</p>\n<p>tosto che &rsquo;l vostro viso si nascose&raquo;.</p></div>\n\n<div class="stanza"><p>Ed ella: &laquo;Se tacessi o se negassi</p>\n<p>ci&ograve; che confessi, non fora men nota</p>\n<p>la colpa tua: da tal giudice sassi!</p></div>\n\n<div class="stanza"><p>Ma quando scoppia de la propria gota</p>\n<p>l&rsquo;accusa del peccato, in nostra corte</p>\n<p>rivolge s&eacute; contra &rsquo;l taglio la rota.</p></div>\n\n<div class="stanza"><p>Tuttavia, perch&eacute; mo vergogna porte</p>\n<p>del tuo errore, e perch&eacute; altra volta,</p>\n<p>udendo le serene, sie pi&ugrave; forte,</p></div>\n\n<div class="stanza"><p>pon gi&ugrave; il seme del piangere e ascolta:</p>\n<p>s&igrave; udirai come in contraria parte</p>\n<p>mover dovieti mia carne sepolta.</p></div>\n\n<div class="stanza"><p>Mai non t&rsquo;appresent&ograve; natura o arte</p>\n<p>piacer, quanto le belle membra in ch&rsquo;io</p>\n<p>rinchiusa fui, e che so&rsquo; &rsquo;n terra sparte;</p></div>\n\n<div class="stanza"><p>e se &rsquo;l sommo piacer s&igrave; ti fallio</p>\n<p>per la mia morte, qual cosa mortale</p>\n<p>dovea poi trarre te nel suo disio?</p></div>\n\n<div class="stanza"><p>Ben ti dovevi, per lo primo strale</p>\n<p>de le cose fallaci, levar suso</p>\n<p>di retro a me che non era pi&ugrave; tale.</p></div>\n\n<div class="stanza"><p>Non ti dovea gravar le penne in giuso,</p>\n<p>ad aspettar pi&ugrave; colpo, o pargoletta</p>\n<p>o altra novit&agrave; con s&igrave; breve uso.</p></div>\n\n<div class="stanza"><p>Novo augelletto due o tre aspetta;</p>\n<p>ma dinanzi da li occhi d&rsquo;i pennuti</p>\n<p>rete si spiega indarno o si saetta&raquo;.</p></div>\n\n<div class="stanza"><p>Quali fanciulli, vergognando, muti</p>\n<p>con li occhi a terra stannosi, ascoltando</p>\n<p>e s&eacute; riconoscendo e ripentuti,</p></div>\n\n<div class="stanza"><p>tal mi stav&rsquo; io; ed ella disse: &laquo;Quando</p>\n<p>per udir se&rsquo; dolente, alza la barba,</p>\n<p>e prenderai pi&ugrave; doglia riguardando&raquo;.</p></div>\n\n<div class="stanza"><p>Con men di resistenza si dibarba</p>\n<p>robusto cerro, o vero al nostral vento</p>\n<p>o vero a quel de la terra di Iarba,</p></div>\n\n<div class="stanza"><p>ch&rsquo;io non levai al suo comando il mento;</p>\n<p>e quando per la barba il viso chiese,</p>\n<p>ben conobbi il velen de l&rsquo;argomento.</p></div>\n\n<div class="stanza"><p>E come la mia faccia si distese,</p>\n<p>posarsi quelle prime creature</p>\n<p>da loro aspers&iuml;on l&rsquo;occhio comprese;</p></div>\n\n<div class="stanza"><p>e le mie luci, ancor poco sicure,</p>\n<p>vider Beatrice volta in su la fiera</p>\n<p>ch&rsquo;&egrave; sola una persona in due nature.</p></div>\n\n<div class="stanza"><p>Sotto &rsquo;l suo velo e oltre la rivera</p>\n<p>vincer pariemi pi&ugrave; s&eacute; stessa antica,</p>\n<p>vincer che l&rsquo;altre qui, quand&rsquo; ella c&rsquo;era.</p></div>\n\n<div class="stanza"><p>Di penter s&igrave; mi punse ivi l&rsquo;ortica,</p>\n<p>che di tutte altre cose qual mi torse</p>\n<p>pi&ugrave; nel suo amor, pi&ugrave; mi si f&eacute; nemica.</p></div>\n\n<div class="stanza"><p>Tanta riconoscenza il cor mi morse,</p>\n<p>ch&rsquo;io caddi vinto; e quale allora femmi,</p>\n<p>salsi colei che la cagion mi porse.</p></div>\n\n<div class="stanza"><p>Poi, quando il cor virt&ugrave; di fuor rendemmi,</p>\n<p>la donna ch&rsquo;io avea trovata sola</p>\n<p>sopra me vidi, e dicea: &laquo;Tiemmi, tiemmi!&raquo;.</p></div>\n\n<div class="stanza"><p>Tratto m&rsquo;avea nel fiume infin la gola,</p>\n<p>e tirandosi me dietro sen giva</p>\n<p>sovresso l&rsquo;acqua lieve come scola.</p></div>\n\n<div class="stanza"><p>Quando fui presso a la beata riva,</p>\n<p>&lsquo;Asperges me&rsquo; s&igrave; dolcemente udissi,</p>\n<p>che nol so rimembrar, non ch&rsquo;io lo scriva.</p></div>\n\n<div class="stanza"><p>La bella donna ne le braccia aprissi;</p>\n<p>abbracciommi la testa e mi sommerse</p>\n<p>ove convenne ch&rsquo;io l&rsquo;acqua inghiottissi.</p></div>\n\n<div class="stanza"><p>Indi mi tolse, e bagnato m&rsquo;offerse</p>\n<p>dentro a la danza de le quattro belle;</p>\n<p>e ciascuna del braccio mi coperse.</p></div>\n\n<div class="stanza"><p>&laquo;Noi siam qui ninfe e nel ciel siamo stelle;</p>\n<p>pria che Beatrice discendesse al mondo,</p>\n<p>fummo ordinate a lei per sue ancelle.</p></div>\n\n<div class="stanza"><p>Merrenti a li occhi suoi; ma nel giocondo</p>\n<p>lume ch&rsquo;&egrave; dentro aguzzeranno i tuoi</p>\n<p>le tre di l&agrave;, che miran pi&ugrave; profondo&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; cantando cominciaro; e poi</p>\n<p>al petto del grifon seco menarmi,</p>\n<p>ove Beatrice stava volta a noi.</p></div>\n\n<div class="stanza"><p>Disser: &laquo;Fa che le viste non risparmi;</p>\n<p>posto t&rsquo;avem dinanzi a li smeraldi</p>\n<p>ond&rsquo; Amor gi&agrave; ti trasse le sue armi&raquo;.</p></div>\n\n<div class="stanza"><p>Mille disiri pi&ugrave; che fiamma caldi</p>\n<p>strinsermi li occhi a li occhi rilucenti,</p>\n<p>che pur sopra &rsquo;l grifone stavan saldi.</p></div>\n\n<div class="stanza"><p>Come in lo specchio il sol, non altrimenti</p>\n<p>la doppia fiera dentro vi raggiava,</p>\n<p>or con altri, or con altri reggimenti.</p></div>\n\n<div class="stanza"><p>Pensa, lettor, s&rsquo;io mi maravigliava,</p>\n<p>quando vedea la cosa in s&eacute; star queta,</p>\n<p>e ne l&rsquo;idolo suo si trasmutava.</p></div>\n\n<div class="stanza"><p>Mentre che piena di stupore e lieta</p>\n<p>l&rsquo;anima mia gustava di quel cibo</p>\n<p>che, saziando di s&eacute;, di s&eacute; asseta,</p></div>\n\n<div class="stanza"><p>s&eacute; dimostrando di pi&ugrave; alto tribo</p>\n<p>ne li atti, l&rsquo;altre tre si fero avanti,</p>\n<p>danzando al loro angelico caribo.</p></div>\n\n<div class="stanza"><p>&laquo;Volgi, Beatrice, volgi li occhi santi&raquo;,</p>\n<p>era la sua canzone, &laquo;al tuo fedele</p>\n<p>che, per vederti, ha mossi passi tanti!</p></div>\n\n<div class="stanza"><p>Per grazia fa noi grazia che disvele</p>\n<p>a lui la bocca tua, s&igrave; che discerna</p>\n<p>la seconda bellezza che tu cele&raquo;.</p></div>\n\n<div class="stanza"><p>O isplendor di viva luce etterna,</p>\n<p>chi palido si fece sotto l&rsquo;ombra</p>\n<p>s&igrave; di Parnaso, o bevve in sua cisterna,</p></div>\n\n<div class="stanza"><p>che non paresse aver la mente ingombra,</p>\n<p>tentando a render te qual tu paresti</p>\n<p>l&agrave; dove armonizzando il ciel t&rsquo;adombra,</p></div>\n\n<div class="stanza"><p>quando ne l&rsquo;aere aperto ti solvesti?</p></div>','<p class="cantohead">Canto XXXII</p>\n\n<div class="stanza"><p>Tant&rsquo; eran li occhi miei fissi e attenti</p>\n<p>a disbramarsi la decenne sete,</p>\n<p>che li altri sensi m&rsquo;eran tutti spenti.</p></div>\n\n<div class="stanza"><p>Ed essi quinci e quindi avien parete</p>\n<p>di non caler&mdash;cos&igrave; lo santo riso</p>\n<p>a s&eacute; tra&eacute;li con l&rsquo;antica rete!&mdash;;</p></div>\n\n<div class="stanza"><p>quando per forza mi fu v&ograve;lto il viso</p>\n<p>ver&rsquo; la sinistra mia da quelle dee,</p>\n<p>perch&rsquo; io udi&rsquo; da loro un &laquo;Troppo fiso!&raquo;;</p></div>\n\n<div class="stanza"><p>e la disposizion ch&rsquo;a veder &egrave;e</p>\n<p>ne li occhi pur test&eacute; dal sol percossi,</p>\n<p>sanza la vista alquanto esser mi f&eacute;e.</p></div>\n\n<div class="stanza"><p>Ma poi ch&rsquo;al poco il viso riformossi</p>\n<p>(e dico &lsquo;al poco&rsquo; per rispetto al molto</p>\n<p>sensibile onde a forza mi rimossi),</p></div>\n\n<div class="stanza"><p>vidi &rsquo;n sul braccio destro esser rivolto</p>\n<p>lo glor&iuml;oso essercito, e tornarsi</p>\n<p>col sole e con le sette fiamme al volto.</p></div>\n\n<div class="stanza"><p>Come sotto li scudi per salvarsi</p>\n<p>volgesi schiera, e s&eacute; gira col segno,</p>\n<p>prima che possa tutta in s&eacute; mutarsi;</p></div>\n\n<div class="stanza"><p>quella milizia del celeste regno</p>\n<p>che procedeva, tutta trapassonne</p>\n<p>pria che piegasse il carro il primo legno.</p></div>\n\n<div class="stanza"><p>Indi a le rote si tornar le donne,</p>\n<p>e &rsquo;l grifon mosse il benedetto carco</p>\n<p>s&igrave;, che per&ograve; nulla penna crollonne.</p></div>\n\n<div class="stanza"><p>La bella donna che mi trasse al varco</p>\n<p>e Stazio e io seguitavam la rota</p>\n<p>che f&eacute; l&rsquo;orbita sua con minore arco.</p></div>\n\n<div class="stanza"><p>S&igrave; passeggiando l&rsquo;alta selva v&ograve;ta,</p>\n<p>colpa di quella ch&rsquo;al serpente crese,</p>\n<p>temprava i passi un&rsquo;angelica nota.</p></div>\n\n<div class="stanza"><p>Forse in tre voli tanto spazio prese</p>\n<p>disfrenata saetta, quanto eramo</p>\n<p>rimossi, quando B&euml;atrice scese.</p></div>\n\n<div class="stanza"><p>Io senti&rsquo; mormorare a tutti &laquo;Adamo&raquo;;</p>\n<p>poi cerchiaro una pianta dispogliata</p>\n<p>di foglie e d&rsquo;altra fronda in ciascun ramo.</p></div>\n\n<div class="stanza"><p>La coma sua, che tanto si dilata</p>\n<p>pi&ugrave; quanto pi&ugrave; &egrave; s&ugrave;, fora da l&rsquo;Indi</p>\n<p>ne&rsquo; boschi lor per altezza ammirata.</p></div>\n\n<div class="stanza"><p>&laquo;Beato se&rsquo;, grifon, che non discindi</p>\n<p>col becco d&rsquo;esto legno dolce al gusto,</p>\n<p>poscia che mal si torce il ventre quindi&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; dintorno a l&rsquo;albero robusto</p>\n<p>gridaron li altri; e l&rsquo;animal binato:</p>\n<p>&laquo;S&igrave; si conserva il seme d&rsquo;ogne giusto&raquo;.</p></div>\n\n<div class="stanza"><p>E v&ograve;lto al temo ch&rsquo;elli avea tirato,</p>\n<p>trasselo al pi&egrave; de la vedova frasca,</p>\n<p>e quel di lei a lei lasci&ograve; legato.</p></div>\n\n<div class="stanza"><p>Come le nostre piante, quando casca</p>\n<p>gi&ugrave; la gran luce mischiata con quella</p>\n<p>che raggia dietro a la celeste lasca,</p></div>\n\n<div class="stanza"><p>turgide fansi, e poi si rinovella</p>\n<p>di suo color ciascuna, pria che &rsquo;l sole</p>\n<p>giunga li suoi corsier sotto altra stella;</p></div>\n\n<div class="stanza"><p>men che di rose e pi&ugrave; che di v&iuml;ole</p>\n<p>colore aprendo, s&rsquo;innov&ograve; la pianta,</p>\n<p>che prima avea le ramora s&igrave; sole.</p></div>\n\n<div class="stanza"><p>Io non lo &rsquo;ntesi, n&eacute; qui non si canta</p>\n<p>l&rsquo;inno che quella gente allor cantaro,</p>\n<p>n&eacute; la nota soffersi tutta quanta.</p></div>\n\n<div class="stanza"><p>S&rsquo;io potessi ritrar come assonnaro</p>\n<p>li occhi spietati udendo di Siringa,</p>\n<p>li occhi a cui pur vegghiar cost&ograve; s&igrave; caro;</p></div>\n\n<div class="stanza"><p>come pintor che con essempro pinga,</p>\n<p>disegnerei com&rsquo; io m&rsquo;addormentai;</p>\n<p>ma qual vuol sia che l&rsquo;assonnar ben finga.</p></div>\n\n<div class="stanza"><p>Per&ograve; trascorro a quando mi svegliai,</p>\n<p>e dico ch&rsquo;un splendor mi squarci&ograve; &rsquo;l velo</p>\n<p>del sonno, e un chiamar: &laquo;Surgi: che fai?&raquo;.</p></div>\n\n<div class="stanza"><p>Quali a veder de&rsquo; fioretti del melo</p>\n<p>che del suo pome li angeli fa ghiotti</p>\n<p>e perpet&uuml;e nozze fa nel cielo,</p></div>\n\n<div class="stanza"><p>Pietro e Giovanni e Iacopo condotti</p>\n<p>e vinti, ritornaro a la parola</p>\n<p>da la qual furon maggior sonni rotti,</p></div>\n\n<div class="stanza"><p>e videro scemata loro scuola</p>\n<p>cos&igrave; di Mo&iuml;s&egrave; come d&rsquo;Elia,</p>\n<p>e al maestro suo cangiata stola;</p></div>\n\n<div class="stanza"><p>tal torna&rsquo; io, e vidi quella pia</p>\n<p>sovra me starsi che conducitrice</p>\n<p>fu de&rsquo; miei passi lungo &rsquo;l fiume pria.</p></div>\n\n<div class="stanza"><p>E tutto in dubbio dissi: &laquo;Ov&rsquo; &egrave; Beatrice?&raquo;.</p>\n<p>Ond&rsquo; ella: &laquo;Vedi lei sotto la fronda</p>\n<p>nova sedere in su la sua radice.</p></div>\n\n<div class="stanza"><p>Vedi la compagnia che la circonda:</p>\n<p>li altri dopo &rsquo;l grifon sen vanno suso</p>\n<p>con pi&ugrave; dolce canzone e pi&ugrave; profonda&raquo;.</p></div>\n\n<div class="stanza"><p>E se pi&ugrave; fu lo suo parlar diffuso,</p>\n<p>non so, per&ograve; che gi&agrave; ne li occhi m&rsquo;era</p>\n<p>quella ch&rsquo;ad altro intender m&rsquo;avea chiuso.</p></div>\n\n<div class="stanza"><p>Sola sedeasi in su la terra vera,</p>\n<p>come guardia lasciata l&igrave; del plaustro</p>\n<p>che legar vidi a la biforme fera.</p></div>\n\n<div class="stanza"><p>In cerchio le facevan di s&eacute; claustro</p>\n<p>le sette ninfe, con quei lumi in mano</p>\n<p>che son sicuri d&rsquo;Aquilone e d&rsquo;Austro.</p></div>\n\n<div class="stanza"><p>&laquo;Qui sarai tu poco tempo silvano;</p>\n<p>e sarai meco sanza fine cive</p>\n<p>di quella Roma onde Cristo &egrave; romano.</p></div>\n\n<div class="stanza"><p>Per&ograve;, in pro del mondo che mal vive,</p>\n<p>al carro tieni or li occhi, e quel che vedi,</p>\n<p>ritornato di l&agrave;, fa che tu scrive&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; Beatrice; e io, che tutto ai piedi</p>\n<p>d&rsquo;i suoi comandamenti era divoto,</p>\n<p>la mente e li occhi ov&rsquo; ella volle diedi.</p></div>\n\n<div class="stanza"><p>Non scese mai con s&igrave; veloce moto</p>\n<p>foco di spessa nube, quando piove</p>\n<p>da quel confine che pi&ugrave; va remoto,</p></div>\n\n<div class="stanza"><p>com&rsquo; io vidi calar l&rsquo;uccel di Giove</p>\n<p>per l&rsquo;alber gi&ugrave;, rompendo de la scorza,</p>\n<p>non che d&rsquo;i fiori e de le foglie nove;</p></div>\n\n<div class="stanza"><p>e fer&igrave; &rsquo;l carro di tutta sua forza;</p>\n<p>ond&rsquo; el pieg&ograve; come nave in fortuna,</p>\n<p>vinta da l&rsquo;onda, or da poggia, or da orza.</p></div>\n\n<div class="stanza"><p>Poscia vidi avventarsi ne la cuna</p>\n<p>del tr&iuml;unfal veiculo una volpe</p>\n<p>che d&rsquo;ogne pasto buon parea digiuna;</p></div>\n\n<div class="stanza"><p>ma, riprendendo lei di laide colpe,</p>\n<p>la donna mia la volse in tanta futa</p>\n<p>quanto sofferser l&rsquo;ossa sanza polpe.</p></div>\n\n<div class="stanza"><p>Poscia per indi ond&rsquo; era pria venuta,</p>\n<p>l&rsquo;aguglia vidi scender gi&ugrave; ne l&rsquo;arca</p>\n<p>del carro e lasciar lei di s&eacute; pennuta;</p></div>\n\n<div class="stanza"><p>e qual esce di cuor che si rammarca,</p>\n<p>tal voce usc&igrave; del cielo e cotal disse:</p>\n<p>&laquo;O navicella mia, com&rsquo; mal se&rsquo; carca!&raquo;.</p></div>\n\n<div class="stanza"><p>Poi parve a me che la terra s&rsquo;aprisse</p>\n<p>tr&rsquo;ambo le ruote, e vidi uscirne un drago</p>\n<p>che per lo carro s&ugrave; la coda fisse;</p></div>\n\n<div class="stanza"><p>e come vespa che ritragge l&rsquo;ago,</p>\n<p>a s&eacute; traendo la coda maligna,</p>\n<p>trasse del fondo, e gissen vago vago.</p></div>\n\n<div class="stanza"><p>Quel che rimase, come da gramigna</p>\n<p>vivace terra, da la piuma, offerta</p>\n<p>forse con intenzion sana e benigna,</p></div>\n\n<div class="stanza"><p>si ricoperse, e funne ricoperta</p>\n<p>e l&rsquo;una e l&rsquo;altra rota e &rsquo;l temo, in tanto</p>\n<p>che pi&ugrave; tiene un sospir la bocca aperta.</p></div>\n\n<div class="stanza"><p>Trasformato cos&igrave; &rsquo;l dificio santo</p>\n<p>mise fuor teste per le parti sue,</p>\n<p>tre sovra &rsquo;l temo e una in ciascun canto.</p></div>\n\n<div class="stanza"><p>Le prime eran cornute come bue,</p>\n<p>ma le quattro un sol corno avean per fronte:</p>\n<p>simile mostro visto ancor non fue.</p></div>\n\n<div class="stanza"><p>Sicura, quasi rocca in alto monte,</p>\n<p>seder sovresso una puttana sciolta</p>\n<p>m&rsquo;apparve con le ciglia intorno pronte;</p></div>\n\n<div class="stanza"><p>e come perch&eacute; non li fosse tolta,</p>\n<p>vidi di costa a lei dritto un gigante;</p>\n<p>e basciavansi insieme alcuna volta.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; l&rsquo;occhio cupido e vagante</p>\n<p>a me rivolse, quel feroce drudo</p>\n<p>la flagell&ograve; dal capo infin le piante;</p></div>\n\n<div class="stanza"><p>poi, di sospetto pieno e d&rsquo;ira crudo,</p>\n<p>disciolse il mostro, e trassel per la selva,</p>\n<p>tanto che sol di lei mi fece scudo</p></div>\n\n<div class="stanza"><p>a la puttana e a la nova belva.</p></div>','<p class="cantohead">Canto XXXIII</p>\n\n<div class="stanza"><p>&lsquo;Deus, venerunt gentes&rsquo;, alternando</p>\n<p>or tre or quattro dolce salmodia,</p>\n<p>le donne incominciaro, e lagrimando;</p></div>\n\n<div class="stanza"><p>e B&euml;atrice, sospirosa e pia,</p>\n<p>quelle ascoltava s&igrave; fatta, che poco</p>\n<p>pi&ugrave; a la croce si cambi&ograve; Maria.</p></div>\n\n<div class="stanza"><p>Ma poi che l&rsquo;altre vergini dier loco</p>\n<p>a lei di dir, levata dritta in p&egrave;,</p>\n<p>rispuose, colorata come foco:</p></div>\n\n<div class="stanza"><p>&lsquo;Modicum, et non videbitis me;</p>\n<p>et iterum, sorelle mie dilette,</p>\n<p>modicum, et vos videbitis me&rsquo;.</p></div>\n\n<div class="stanza"><p>Poi le si mise innanzi tutte e sette,</p>\n<p>e dopo s&eacute;, solo accennando, mosse</p>\n<p>me e la donna e &rsquo;l savio che ristette.</p></div>\n\n<div class="stanza"><p>Cos&igrave; sen giva; e non credo che fosse</p>\n<p>lo decimo suo passo in terra posto,</p>\n<p>quando con li occhi li occhi mi percosse;</p></div>\n\n<div class="stanza"><p>e con tranquillo aspetto &laquo;Vien pi&ugrave; tosto&raquo;,</p>\n<p>mi disse, &laquo;tanto che, s&rsquo;io parlo teco,</p>\n<p>ad ascoltarmi tu sie ben disposto&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; com&rsquo; io fui, com&rsquo; io dov&euml;a, seco,</p>\n<p>dissemi: &laquo;Frate, perch&eacute; non t&rsquo;attenti</p>\n<p>a domandarmi omai venendo meco?&raquo;.</p></div>\n\n<div class="stanza"><p>Come a color che troppo reverenti</p>\n<p>dinanzi a suo maggior parlando sono,</p>\n<p>che non traggon la voce viva ai denti,</p></div>\n\n<div class="stanza"><p>avvenne a me, che sanza intero suono</p>\n<p>incominciai: &laquo;Madonna, mia bisogna</p>\n<p>voi conoscete, e ci&ograve; ch&rsquo;ad essa &egrave; buono&raquo;.</p></div>\n\n<div class="stanza"><p>Ed ella a me: &laquo;Da tema e da vergogna</p>\n<p>voglio che tu omai ti disviluppe,</p>\n<p>s&igrave; che non parli pi&ugrave; com&rsquo; om che sogna.</p></div>\n\n<div class="stanza"><p>Sappi che &rsquo;l vaso che &rsquo;l serpente ruppe,</p>\n<p>fu e non &egrave;; ma chi n&rsquo;ha colpa, creda</p>\n<p>che vendetta di Dio non teme suppe.</p></div>\n\n<div class="stanza"><p>Non sar&agrave; tutto tempo sanza reda</p>\n<p>l&rsquo;aguglia che lasci&ograve; le penne al carro,</p>\n<p>per che divenne mostro e poscia preda;</p></div>\n\n<div class="stanza"><p>ch&rsquo;io veggio certamente, e per&ograve; il narro,</p>\n<p>a darne tempo gi&agrave; stelle propinque,</p>\n<p>secure d&rsquo;ogn&rsquo; intoppo e d&rsquo;ogne sbarro,</p></div>\n\n<div class="stanza"><p>nel quale un cinquecento diece e cinque,</p>\n<p>messo di Dio, ancider&agrave; la fuia</p>\n<p>con quel gigante che con lei delinque.</p></div>\n\n<div class="stanza"><p>E forse che la mia narrazion buia,</p>\n<p>qual Temi e Sfinge, men ti persuade,</p>\n<p>perch&rsquo; a lor modo lo &rsquo;ntelletto attuia;</p></div>\n\n<div class="stanza"><p>ma tosto fier li fatti le Naiade,</p>\n<p>che solveranno questo enigma forte</p>\n<p>sanza danno di pecore o di biade.</p></div>\n\n<div class="stanza"><p>Tu nota; e s&igrave; come da me son porte,</p>\n<p>cos&igrave; queste parole segna a&rsquo; vivi</p>\n<p>del viver ch&rsquo;&egrave; un correre a la morte.</p></div>\n\n<div class="stanza"><p>E aggi a mente, quando tu le scrivi,</p>\n<p>di non celar qual hai vista la pianta</p>\n<p>ch&rsquo;&egrave; or due volte dirubata quivi.</p></div>\n\n<div class="stanza"><p>Qualunque ruba quella o quella schianta,</p>\n<p>con bestemmia di fatto offende a Dio,</p>\n<p>che solo a l&rsquo;uso suo la cre&ograve; santa.</p></div>\n\n<div class="stanza"><p>Per morder quella, in pena e in disio</p>\n<p>cinquemilia anni e pi&ugrave; l&rsquo;anima prima</p>\n<p>bram&ograve; colui che &rsquo;l morso in s&eacute; punio.</p></div>\n\n<div class="stanza"><p>Dorme lo &rsquo;ngegno tuo, se non estima</p>\n<p>per singular cagione esser eccelsa</p>\n<p>lei tanto e s&igrave; travolta ne la cima.</p></div>\n\n<div class="stanza"><p>E se stati non fossero acqua d&rsquo;Elsa</p>\n<p>li pensier vani intorno a la tua mente,</p>\n<p>e &rsquo;l piacer loro un Piramo a la gelsa,</p></div>\n\n<div class="stanza"><p>per tante circostanze solamente</p>\n<p>la giustizia di Dio, ne l&rsquo;interdetto,</p>\n<p>conosceresti a l&rsquo;arbor moralmente.</p></div>\n\n<div class="stanza"><p>Ma perch&rsquo; io veggio te ne lo &rsquo;ntelletto</p>\n<p>fatto di pietra e, impetrato, tinto,</p>\n<p>s&igrave; che t&rsquo;abbaglia il lume del mio detto,</p></div>\n\n<div class="stanza"><p>voglio anco, e se non scritto, almen dipinto,</p>\n<p>che &rsquo;l te ne porti dentro a te per quello</p>\n<p>che si reca il bordon di palma cinto&raquo;.</p></div>\n\n<div class="stanza"><p>E io: &laquo;S&igrave; come cera da suggello,</p>\n<p>che la figura impressa non trasmuta,</p>\n<p>segnato &egrave; or da voi lo mio cervello.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; tanto sovra mia veduta</p>\n<p>vostra parola dis&iuml;ata vola,</p>\n<p>che pi&ugrave; la perde quanto pi&ugrave; s&rsquo;aiuta?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Perch&eacute; conoschi&raquo;, disse, &laquo;quella scuola</p>\n<p>c&rsquo;hai seguitata, e veggi sua dottrina</p>\n<p>come pu&ograve; seguitar la mia parola;</p></div>\n\n<div class="stanza"><p>e veggi vostra via da la divina</p>\n<p>distar cotanto, quanto si discorda</p>\n<p>da terra il ciel che pi&ugrave; alto festina&raquo;.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; io rispuosi lei: &laquo;Non mi ricorda</p>\n<p>ch&rsquo;i&rsquo; stran&iuml;asse me gi&agrave; mai da voi,</p>\n<p>n&eacute; honne cosc&iuml;enza che rimorda&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;E se tu ricordar non te ne puoi&raquo;,</p>\n<p>sorridendo rispuose, &laquo;or ti rammenta</p>\n<p>come bevesti di Let&egrave; ancoi;</p></div>\n\n<div class="stanza"><p>e se dal fummo foco s&rsquo;argomenta,</p>\n  <p>cotesta obliv&iuml;on chiaro conchiude</p>\n<p>colpa ne la tua voglia altrove attenta.</p></div>\n\n<div class="stanza"><p>Veramente oramai saranno nude</p>\n<p>le mie parole, quanto converrassi</p>\n<p>quelle scovrire a la tua vista rude&raquo;.</p></div>\n\n<div class="stanza"><p>E pi&ugrave; corusco e con pi&ugrave; lenti passi</p>\n<p>teneva il sole il cerchio di merigge,</p>\n<p>che qua e l&agrave;, come li aspetti, fassi,</p></div>\n\n<div class="stanza"><p>quando s&rsquo;affisser, s&igrave; come s&rsquo;affigge</p>\n<p>chi va dinanzi a gente per iscorta</p>\n<p>se trova novitate o sue vestigge,</p></div>\n\n<div class="stanza"><p>le sette donne al fin d&rsquo;un&rsquo;ombra smorta,</p>\n<p>qual sotto foglie verdi e rami nigri</p>\n<p>sovra suoi freddi rivi l&rsquo;alpe porta.</p></div>\n\n<div class="stanza"><p>Dinanzi ad esse &euml;ufrat&egrave;s e Tigri</p>\n<p>veder mi parve uscir d&rsquo;una fontana,</p>\n<p>e, quasi amici, dipartirsi pigri.</p></div>\n\n<div class="stanza"><p>&laquo;O luce, o gloria de la gente umana,</p>\n<p>che acqua &egrave; questa che qui si dispiega</p>\n<p>da un principio e s&eacute; da s&eacute; lontana?&raquo;.</p></div>\n\n<div class="stanza"><p>Per cotal priego detto mi fu: &laquo;Priega</p>\n<p>Matelda che &rsquo;l ti dica&raquo;. E qui rispuose,</p>\n<p>come fa chi da colpa si dislega,</p></div>\n\n<div class="stanza"><p>la bella donna: &laquo;Questo e altre cose</p>\n<p>dette li son per me; e son sicura</p>\n<p>che l&rsquo;acqua di Let&egrave; non gliel nascose&raquo;.</p></div>\n\n<div class="stanza"><p>E B&euml;atrice: &laquo;Forse maggior cura,</p>\n<p>che spesse volte la memoria priva,</p>\n<p>fatt&rsquo; ha la mente sua ne li occhi oscura.</p></div>\n\n<div class="stanza"><p>Ma vedi E&uuml;no&egrave; che l&agrave; diriva:</p>\n<p>menalo ad esso, e come tu se&rsquo; usa,</p>\n<p>la tramortita sua virt&ugrave; ravviva&raquo;.</p></div>\n\n<div class="stanza"><p>Come anima gentil, che non fa scusa,</p>\n<p>ma fa sua voglia de la voglia altrui</p>\n<p>tosto che &egrave; per segno fuor dischiusa;</p></div>\n\n<div class="stanza"><p>cos&igrave;, poi che da essa preso fui,</p>\n<p>la bella donna mossesi, e a Stazio</p>\n<p>donnescamente disse: &laquo;Vien con lui&raquo;.</p></div>\n\n<div class="stanza"><p>S&rsquo;io avessi, lettor, pi&ugrave; lungo spazio</p>\n<p>da scrivere, i&rsquo; pur cantere&rsquo; in parte</p>\n<p>lo dolce ber che mai non m&rsquo;avria sazio;</p></div>\n\n<div class="stanza"><p>ma perch&eacute; piene son tutte le carte</p>\n<p>ordite a questa cantica seconda,</p>\n<p>non mi lascia pi&ugrave; ir lo fren de l&rsquo;arte.</p></div>\n\n<div class="stanza"><p>Io ritornai da la santissima onda</p>\n<p>rifatto s&igrave; come piante novelle</p>\n<p>rinovellate di novella fronda,</p></div>\n\n<div class="stanza"><p>puro e disposto a salire a le stelle.</p></div>']};

},{}],11:[function(require,module,exports){
// purgatorio/longfellow.js

},{}]},{},[7])