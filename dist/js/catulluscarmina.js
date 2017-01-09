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
var bookdata = require("./catulluscarmina/bookdata");
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
appdata.versionhistory = bookdata.versionhistory;
appdata.comingsoon = bookdata.comingsoon;

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

},{"./catulluscarmina/bookdata":5,"./modules/app":9,"./modules/appdata":10}],5:[function(require,module,exports){
"use strict";

// the spine for the book

module.exports = {

	bookname: 'catulluscarmina',
	booktitle: "The Carmina",
	bookauthor: "Caius Valerius Catullus",
	description: "<p>A version of Catullus.</p>",
	versionhistory: [// this is the version history for a particular book, a list
	"0.0.1: first release"],
	comingsoon: // this is what goes in the coming soon section, a single chunk of HTML
	"<p>More translations!</p>",

	cantotitles: [// this is canto sequence
	"Title page", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "VIIII", "X" /*,"XI","XII","XIII","XIIII","XV","XVI","XVII","XVIII","XVIIII","XX","XXI","XXII","XXIII","XXIIII","XXV","XXVI","XXVII","XXVIII","XXVIIII","XXX","XXXI","XXXII","XXXIII","XXXIIII","XXXV","XXXVI","XXXVII","XXXVIII","XXXVIIII","XL","XLI","XLII","XLIII","XLIIII","XLV","XLVI","XLVII","XLVIII","XLVIIII","L","LI","LII","LIII","LIIII","LV","LVI","LVII","LVIII","LVIIII","LX","LXI","LXII","LXIII","LXIIII","LXV","LXVI","LXVII","LXVIII","LXVIIII","LXX","LXXI","LXXII","LXXIII","LXXIIII","LXXV","LXXVI","LXXVII","LXXVIII","LXXVIIII","LXXX","LXXXI","LXXXII","LXXXIII","LXXXIIII","LXXXV","LXXXVI","LXXXVII","LXXXVIII","LXXXVIIII","XC","XCI","XCII","XCIII","XCIIII","XCV","XCVI","XCVII","XCVIII","XCVIIII","C","CI","CII","CIII","CIIII","CV","CVI","CVII","CVIII","CVIIII","CX","CXI","CXII","CXIII","CXIIII","CXV","CXVI"*/
	],

	translationdata: [// this is translation sequence
	{ "translationid": "catullus",
		"order": 0 }, { "translationid": "burtonsmitherspoetry",
		"order": 1 }, { "translationid": "burtonsmithersprose",
		"order": 2 }],

	textdata: [// set up translations
	require("./translations/catullus"), require("./translations/burtonsmitherspoetry"), require("./translations/burtonsmithersprose")]
};

},{"./translations/burtonsmitherspoetry":6,"./translations/burtonsmithersprose":7,"./translations/catullus":8}],6:[function(require,module,exports){
// catulluscarmina/burtonsmitherspoetry.js

"use strict";

module.exports = {
	bookname: 'catulluscarmina',
	author: 'Caius Valerius Catullus',
	translationid: "burtonsmitherspoetry",
	title: 'The Carmina',
	translation: true,
	source: '<a href="http://www.gutenberg.org/files/20732/20732-h/20732-h.htm">Project Gutenberg</a>',
	translationshortname: "Burton/Smithers verse",
	translationfullname: "Richard Burton & Leonard C. Smithers verse",
	translationclass: "poetry",
	text: ['<p class="title">The Carmina</p>\n\t<p class="author">Richard Burton &amp; Leonard C. Smithers</p>\n\t<p class="subtitle">(verse translation)</p>', '<p class="cantohead">I.</p>\n\t<p class="cantosubhead">Dedication to Cornelius Nepos.</p>\n\t<div class="stanza">\n\t\t<p>Now smooth\u2019d to polish due with pumice dry</p>\n\t\t<p>Whereto this lively booklet new give I?</p>\n\t\t<p>To thee (Cornelius!); for wast ever fain</p>\n\t\t<p>To deem my trifles somewhat boon contain;</p>\n\t\t<p>E\u2019en when thou single \u2019mongst Italians found</p>\n\t\t<p>Daredst all periods in three Scripts expound</p>\n\t\t<p>Learned (by Jupiter!) elaborately.</p>\n\t\t<p>Then take thee whatso in this booklet be,</p>\n\t\t<p>Such as it is, whereto O Patron Maid</p>\n\t\t<p>To live down Ages lend thou lasting aid!</p>\n\t</div>', '<p class="cantohead">II.</p>\n\t<p class="cantosubhead">Lesbia\u2019s Sparrow.</p>\n\t<div class="stanza">\n\t\t<p>Sparrow! my pet\u2019s delicious joy,</p>\n    <p>Wherewith in bosom nurst to toy</p>\n    <p>She loves, and gives her finger-tip</p>\n    <p>For sharp-nib\u2019d greeding neb to nip,</p>\n    <p>Were she who my desire withstood</p>\n    <p>To seek some pet of merry mood,</p>\n    <p>As crumb o\u2019 comfort for her grief,</p>\n    <p>Methinks her burning lowe\u2019s relief:</p>\n    <p>Could I, as plays she, play with thee,</p>\n    <p>That mind might win from misery free!</p>\n    <p class="divider">* * * * *</p>\n    <p>To me t\u2019were grateful (as they say),</p>\n    <p>Gold codling was to fleet-foot May,</p>\n    <p>Whose long-bound zone it loosed for aye.</p>\n\t</div>', '<p class="cantohead">III.</p>\n\t<p class="cantosubhead">On the Death of Lesbia\u2019s Sparrow.</p>\n\t<div class="stanza">\n\t\t<p>Weep every Venus, and all Cupids wail,</p>\n\t\t<p>And men whose gentler spirits still prevail.</p>\n\t\t<p>Dead is the Sparrow of my girl, the joy,</p>\n\t\t<p>Sparrow, my sweeting\u2019s most delicious toy,</p>\n\t\t<p>Whom loved she dearer than her very eyes;</p>\n\t\t<p>For he was honeyed-pet and anywise</p>\n\t\t<p>Knew her, as even she her mother knew;</p>\n\t\t<p>Ne\u2019er from her bosom\u2019s harbourage he flew</p>\n\t\t<p>But \u2019round her hopping here, there, everywhere,</p>\n\t\t<p>Piped he to none but her his lady fair.</p>\n\t\t<p>Now must he wander o\u2019er the darkling way</p>\n\t\t<p>Thither, whence life-return the Fates denay.</p>\n\t\t<p>But ah! beshrew you, evil Shadows low\u2019ring</p>\n\t\t<p>In Orcus ever loveliest things devouring:</p>\n\t\t<p>Who bore so pretty a Sparrow fro\u2019 her ta\u2019en.</p>\n\t\t<p>(Oh hapless birdie and Oh deed of bane!)</p>\n\t\t<p>Now by your wanton work my girl appears</p>\n\t\t<p>With turgid eyelids tinted rose by tears.</p>\n\t</div>', '<p class="cantohead">IIII.</p>\n\t<p class="cantosubhead">On his Pinnace.</p>\n\t<div class="stanza">\n\t\t<p>Yonder Pinnace ye (my guests!) behold</p>\n\t\t<p>Saith she was erstwhile fleetest-fleet of crafts,</p>\n\t\t<p>Nor could by swiftness of aught plank that swims,</p>\n\t\t<p>Be she outstripped, whether paddle plied,</p>\n\t\t<p>Or fared she scudding under canvas-sail.</p>\n\t\t<p>Eke she defieth threat\u2019ning Adrian shore,</p>\n\t\t<p>Dare not denay her, insular Cyclades,</p>\n\t\t<p>And noble Rhodos and ferocious Thrace,</p>\n\t\t<p>Propontis too and blustering Pontic bight.</p>\n\t\t<p>Where she (my Pinnace now) in times before,</p>\n\t\t<p>Was leafy woodling on Cyt\xF3rean Chine</p>\n\t\t<p>For ever loquent lisping with her leaves.</p>\n\t\t<p>Pontic Amastris! Box-tree-clad Cyt\xF3rus!</p>\n\t\t<p>Cognisant were ye, and you weet full well</p>\n\t\t<p>(So saith my Pinnace) how from earliest age</p>\n\t\t<p>Upon your highmost-spiring peak she stood,</p>\n\t\t<p>How in your waters first her sculls were dipt,</p>\n\t\t<p>And thence thro\u2019 many and many an important strait</p>\n\t\t<p>She bore her owner whether left or right,</p>\n\t\t<p>Where breezes bade her fare, or Jupiter deigned</p>\n\t\t<p>At once propitious strike the sail full square;</p>\n\t\t<p>Nor to the sea-shore gods was aught of vow</p>\n\t\t<p>By her deemed needful, when from Ocean\u2019s bourne</p>\n\t\t<p>Extreme she voyaged for this limpid lake.</p>\n\t\t<p>Yet were such things whilome: now she retired</p>\n\t\t<p>In quiet age devotes herself to thee</p>\n\t\t<p>(O twin-born Castor) twain with Castor\u2019s twin.</p>\n\t</div>', '<p class="cantohead">V.</p>\n\t<p class="cantosubhead">To Lesbia, (of Lesbos&mdash;Clodia?)</p>\n\t<div class="stanza">\n\t\t<p>Love we (my Lesbia!) and live we our day,</p>\n\t\t<p>While all stern sayings crabbed sages say,</p>\n\t\t<p>At one doit\u2019s value let us price and prize!</p>\n\t\t<p>The Suns can westward sink again to rise</p>\n\t\t<p>But we, extinguished once our tiny light,</p>\n\t\t<p>Perforce shall slumber through one lasting night!</p>\n\t\t<p>Kiss me a thousand times, then hundred more,</p>\n\t\t<p>Then thousand others, then a new five-score,</p>\n\t\t<p>Still other thousand other hundred store.</p>\n\t\t<p>Last when the sums to many thousands grow,</p>\n\t\t<p>The tale let\u2019s trouble till no more we know,</p>\n\t\t<p>Nor envious wight despiteful shall misween us</p>\n\t\t<p>Knowing how many kisses have been kissed between us.</p>\n\t</div>', '<p class="cantohead">VI.</p>\n\t<p class="cantosubhead">To Flavius: Mis-speaking his Mistress.</p>\n\t<div class="stanza">\n\t\t<p>Thy Charmer (Flavius!) to Catullus\u2019 ear</p>\n\t\t<p>Were she not manner\u2019d mean and worst in wit</p>\n\t\t<p>Perforce thou hadst praised nor couldst silence keep.</p>\n\t\t<p>But some enfevered jade, I wot-not-what,</p>\n\t\t<p>Some piece thou lovest, blushing this to own.</p>\n\t\t<p>For, nowise \u2019customed widower nights to lie</p>\n\t\t<p>Thou \u2019rt ever summoned by no silent bed</p>\n\t\t<p>With flow\u2019r-wreaths fragrant and with Syrian oil,</p>\n\t\t<p>By mattress, bolsters, here, there, everywhere</p>\n\t\t<p>Deep-dinted, and by quaking, shaking couch</p>\n\t\t<p>All crepitation and mobility.</p>\n\t\t<p>Explain! none whoredoms (no!) shall close my lips.</p>\n\t\t<p>Why? such outfuttered flank thou ne\u2019er wouldst show</p>\n\t\t<p>Had not some fulsome work by thee been wrought.</p>\n\t\t<p>Then what thou holdest, boon or bane be pleased</p>\n\t\t<p>Disclose! For thee and thy beloved fain would I</p>\n\t\t<p>Upraise to Heaven with my liveliest lay.</p>\n\t</div>', '<p class="cantohead">VII.</p>\n\t<p class="cantosubhead">To Lesbia still Beloved.</p>\n\t<div class="stanza">\n\t\t<p>Thou ask\u2019st How many kissing bouts I bore</p>\n\t\t<p>From thee (my Lesbia!) or be enough or more?</p>\n\t\t<p>I say what mighty sum of Lybian-sands</p>\n\t\t<p>Confine Cyrene\u2019s Laserpitium-lands</p>\n\t\t<p>\u2019Twixt Oracle of Jove the Swelterer</p>\n\t\t<p>And olden Battus\u2019 holy Sepulchre,</p>\n\t\t<p>Or stars innumerate through night-stillness ken</p>\n\t\t<p>The stolen Love-delights of mortal men,</p>\n\t\t<p>For that to kiss thee with unending kisses</p>\n\t\t<p>For mad Catullus enough and more be this,</p>\n\t\t<p>Kisses nor curious wight shall count their tale,</p>\n\t\t<p>Nor to bewitch us evil tongue avail.</p>\n\t</div>', '<p class="cantohead">VIII.</p>\n\t<p class="cantosubhead">To Himself recounting Lesbia\u2019s Inconstancy.</p>\n\t<div class="stanza">\n\t\t<p>Woe-full Catullus! cease to play the fool</p>\n\t\t<p>And what thou seest dead as dead regard!</p>\n\t\t<p>Whil\xF2me the sheeniest suns for thee did shine</p>\n\t\t<p>When oft-a-tripping whither led the girl</p>\n\t\t<p>By us belov\xE8d, as shall none be loved.</p>\n\t\t<p>There all so merry doings then were done</p>\n\t\t<p>After thy liking, nor the girl was loath.</p>\n\t\t<p>Then cert\xE8s sheeniest suns for thee did shine.</p>\n\t\t<p>Now she\u2019s unwilling: thou too (hapless!) will</p>\n\t\t<p>Her flight to follow, and sad life to live:</p>\n\t\t<p>Endure with stubborn soul and still obdure.</p>\n\t\t<p>Damsel, adieu! Catullus obdurate grown</p>\n\t\t<p>Nor seeks thee, neither asks of thine unwill;</p>\n\t\t<p>Yet shalt thou sorrow when none woos thee more;</p>\n\t\t<p>Reprobate! Woe to thee! What life remains?</p>\n\t\t<p>Who now shall love thee? Who\u2019ll think thee fair?</p>\n\t\t<p>Whom now shalt ever love? Whose wilt be called?</p>\n\t\t<p>To whom shalt kisses give? whose liplets nip?</p>\n\t\t<p>But thou (Catullus!) destiny-doomed obdure.</p>\n\t</div>', '<p class="cantohead">VIIII.</p>\n\t<p class="cantosubhead">To Veranius returned from Travel.</p>\n\t<div class="stanza">\n\t\t<p>Veranius! over every friend of me</p>\n\t\t<p>Forestanding, owned I hundred thousands three,</p>\n\t\t<p>Home to Penates and to single-soul\u2019d</p>\n\t\t<p>Brethren, returned art thou and mother old?</p>\n\t\t<p>Yes, thou art come. Oh, winsome news come well!</p>\n\t\t<p>Now shall I see thee, safely hear thee tell</p>\n\t\t<p>Of sites Iberian, deeds and nations \u2019spied,</p>\n\t\t<p>(As be thy wont) and neck-a-neck applied</p>\n\t\t<p>I\u2019ll greet with kisses thy glad lips and eyne.</p>\n\t\t<p>Oh! Of all mortal men beatified</p>\n\t\t<p>Whose joy and gladness greater be than mine?</p>\n\t</div>', '<p class="cantohead">X.</p>\n\t<p class="cantosubhead">He meets Varus and Mistress.</p>\n\t<div class="stanza">\n\t\t<p>Led me my Varus to his flame,</p>\n\t\t<p>As I from Forum idling came.</p>\n\t\t<p>Forthright some whorelet judged I it</p>\n\t\t<p>Nor lacking looks nor wanting wit,</p>\n\t\t<p>When hied we thither, mid us three</p>\n\t\t<p>Fell various talk, as how might be</p>\n\t\t<p>Bithynia now, and how it fared,</p>\n\t\t<p>And if some coin I made or spared.</p>\n\t\t<p>\u201CThere was no cause\u201D (I soothly said)</p>\n\t\t<p>\u201CThe Pr\xE6tors or the Cohort made</p>\n\t\t<p>Thence to return with oilier head;</p>\n\t\t<p>The more when ruled by &mdash;&mdash;</p>\n\t\t<p>Pr\xE6tor, as pile the Cohort rating.\u201D</p>\n\t\t<p>Quoth they, \u201CBut cert\xE8s as \u2019twas there</p>\n\t\t<p>The custom rose, some men to bear</p>\n\t\t<p>Litter thou boughtest?\u201D I to her</p>\n\t\t<p>To seem but richer, wealthier,</p>\n\t\t<p>Cry, \u201CNay, with me \u2019twas not so ill</p>\n\t\t<p>That, given the Province suffered, still</p>\n\t\t<p>Eight stiff-backed loons I could not buy.\u201D</p>\n\t\t<p>(Withal none here nor there owned I</p>\n\t\t<p>Who broken leg of Couch outworn</p>\n\t\t<p>On nape of neck had ever borne!)</p>\n\t\t<p>Then she, as pathic piece became,</p>\n\t\t<p>\u201CPrithee Catullus mine, those same</p>\n\t\t<p>Lend me, Serapis-wards I\u2019d hie.\u201D</p>\n\t\t<p class="divider">* * * * *</p>\n\t\t<p>\u201CEasy, on no-wise, no,\u201D quoth I,</p>\n\t\t<p>\u201CWhate\u2019er was mine, I lately said</p>\n\t\t<p>Is some mistake, my camarade</p>\n\t\tOne Cinna&mdash;Gaius&mdash;bought the lot,</p>\n\t\t<p>But his or mine, it matters what?</p>\n\t\t<p>I use it freely as though bought,</p>\n\t\t<p>Yet thou, pert troubler, most absurd,</p>\n\t\t<p>None suffer\u2019st speak an idle word.\u201D</p>\n\t</div>']
};

},{}],7:[function(require,module,exports){
// catulluscarmina/burtonsmithersprose.js

"use strict";

module.exports = {
	bookname: 'catulluscarmina',
	author: 'Caius Valerius Catullus',
	translationid: "burtonsmithersprose",
	title: 'The Carmina',
	translation: true,
	source: '<a href="http://www.gutenberg.org/files/20732/20732-h/20732-h.htm">Project Gutenberg</a>',
	translationshortname: "Burton/Smithers prose",
	translationfullname: "Richard Burton & Leonard C. Smithers prose",
	translationclass: "prose",
	text: ['<p class="title">The Carmina</p>\n\t<p class="author">Richard Burton &amp; Leonard C. Smithers</p>\n\t<p class="subtitle">(prose translation)</p>', '<p class="cantohead">I.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<p>To whom inscribe my dainty tome\u2014just out and with ashen pumice polished? Cornelius, to thee! for thou wert wont to deem my triflings of account, and at a time when thou alone of Italians didst dare unfold the ages\u2019 abstract in three chronicles\u2014learned, by Jupiter!\u2014and most laboriously writ. Wherefore take thou this booklet, such as \u2019tis, and O Virgin Patroness, may it outlive generations more than one.</p>', '<p class="cantohead">II.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<p>Sparrow, petling of my girl, with which she wantons, which she presses to her bosom, and whose eager peckings is accustomed to incite by stretching forth her forefinger, when my bright-hued beautiful one is pleased to jest in manner light as (perchance) a solace for her heart ache, thus methinks she allays love\u2019s pressing heats! Would that in manner like, I were able with thee to sport and sad cares of mind to lighten!</p>', '<p class="cantohead">III.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<p>Mourn ye, O ye Loves and Cupids and all men of gracious mind. Dead is the sparrow of my girl, sparrow, sweetling of my girl. Which more than her eyes she loved; for sweet as honey was it and its mistress knew, as well as damsel knoweth her own mother nor from her bosom did it rove, but hopping round first one side then the other, to its mistress alone it evermore did chirp. Now does it fare along that path of shadows whence naught may e\u2019er return. Ill be to ye, savage glooms of Orcus, which swallow up all things of fairness: which have snatched away from me the comely sparrow. O deed of bale! O sparrow sad of plight! Now on thy account my girl\u2019s sweet eyes, swollen, do redden with tear-drops.</p>', '<p class="cantohead">IIII.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<p>That pinnace which ye see, my friends, says that it was the speediest of boats, nor any craft the surface skimming but it could gain the lead, whether the course were gone o\u2019er with plashing oars or bended sail. And this the menacing Adriatic shores may not deny, nor may the Island Cyclades, nor noble Rhodes and bristling Thrace, Propontis nor the gusty Pontic gulf, where itself (afterwards a pinnace to become) erstwhile was a foliaged clump; and oft on Cytorus\u2019 ridge hath this foliage announced itself in vocal rustling. And to thee, Pontic Amastris, and to box-screened Cytorus, the pinnace vows that this was alway and yet is of common knowledge most notorious; states that from its primal being it stood upon thy topmost peak, dipped its oars in thy waters, and bore its master thence through surly seas of number frequent, whether the wind whistled \u2019gainst the starboard quarter or the lee or whether Jove propitious fell on both the sheets at once; nor any vows [from stress of storm] to shore-gods were ever made by it when coming from the uttermost seas unto this glassy lake. But these things were of time gone by: now laid away, it rusts in peace and dedicates its age to thee, twin Castor, and to Castor\u2019s twin.</p>', '<p class="cantohead">V.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<p>Let us live, my Lesbia, and let us love, and count all the mumblings of sour age at a penny\u2019s fee. Suns set can rise again: we when once our brief light has set must sleep through a perpetual night. Give me of kisses a thousand, and then a hundred, then another thousand, then a second hundred, then another thousand without resting, then a hundred. Then, when we have made many thousands, we will confuse the count lest we know the numbering, so that no wretch may be able to envy us through knowledge of our kisses\u2019 number.</p>', '<p class="cantohead">VI.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<p>O Flavius, of thy sweetheart to Catullus thou would\u2019st speak, nor could\u2019st thou keep silent, were she not both ill-mannered and ungraceful. In truth thou affectest I know not what hot-blooded whore: this thou art ashamed to own. For that thou dost not lie alone a-nights thy couch, fragrant with garlands and Syrian unguent, in no way mute cries out, and eke the pillow and bolsters indented here and there, and the creakings and joggings of the quivering bed: unless thou canst silence these, nothing and again nothing avails thee to hide thy whoredoms. And why? Thou wouldst not display such drain\xE8d flanks unless occupied in some tomfoolery. Wherefore, whatsoever thou hast, be it good or ill, tell us! I wish to laud thee and thy loves to the sky in joyous verse.</p>', '<p class="cantohead">VII.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<p>Thou askest, how many kisses of thine, Lesbia, may be enough and to spare for me. As the countless Libyan sands which strew the spicy strand of Cyrene \u2019twixt the oracle of swelt\u2019ring Jove and the sacred sepulchre of ancient Battus, or as the thronging stars which in the hush of darkness witness the furtive loves of mortals, to kiss thee with kisses of so great a number is enough and to spare for passion-driven Catullus: so many that prying eyes may not avail to number, nor ill tongues to ensorcel.</p>', '<p class="cantohead">VIII.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<p>Unhappy Catullus, cease thy trifling and what thou seest lost know to be lost. Once bright days used to shine on thee when thou wert wont to haste whither thy girl didst lead thee, loved by us as never girl will e\u2019er be loved. There those many joys were joyed which thou didst wish, nor was the girl unwilling. In truth bright days used once to shine on thee. Now she no longer wishes: thou too, powerless to avail, must be unwilling, nor pursue the retreating one, nor live unhappy, but with firm-set mind endure, steel thyself. Farewell, girl, now Catullus steels himself, seeks thee not, nor entreats thy acquiescence. But thou wilt pine, when thou hast no entreaty proffered. Faithless, go thy way! what manner of life remaineth to thee? who now will visit thee? who find thee beautiful? whom wilt thou love now? whose girl wilt thou be called? whom wilt thou kiss? whose lips wilt thou bite? But thou, Catullus, remain hardened as steel.</p>', '<p class="cantohead">VIIII.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<p>Veranius, of all my friends standing in the front, owned I three hundred thousands of them, hast thou come home to thy Penates, thy longing brothers and thine aged mother? Thou hast come back. O joyful news to me! I may see thee safe and sound, and may hear thee speak of regions, deeds, and peoples Iberian, as is thy manner; and reclining o\u2019er thy neck shall kiss thy jocund mouth and eyes. O all ye blissfullest of men, who more gladsome or more blissful is than I am?</p>', '<p class="cantohead">X.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<p>Varus drew me off to see his mistress as I was strolling from the Forum: a little whore, as it seemed to me at the first glance, neither inelegant nor lacking good looks. When we came in, we fell to discussing various subjects, amongst which, how was Bithynia now, how things had gone there, and whether I had made any money there. I replied, what was true, that neither ourselves nor the pr&aelig;tors nor their suite had brought away anything whereby to flaunt a better-scented poll, especially as our pr&aelig;tor, the irrumating beast, cared not a single hair for his suite. \u201CBut surely,\u201D she said, \u201Cyou got some men to bear your litter, for they are said to grow there?\u201D I, to make myself appear to the girl as one of the fortunate, \u201CNay,\u201D I say, \u201Cit did not go that badly with me, ill as the province turned out, that I could not procure eight strapping knaves to bear me.\u201D (But not a single one was mine either here or there who the fractured foot of my old bedstead could hoist on his neck.) And she, like a pathic girl, \u201CI pray thee,\u201D says she, \u201Clend me, my Catullus, those bearers for a short time, for I wish to be borne to the shrine of Serapis.\u201D \u201CStay,\u201D quoth I to the girl, \u201Cwhen I said I had this, my tongue slipped; my friend, Cinna Gaius, he provided himself with these. In truth, whether his or mine&mdash;what do I trouble? I use them as though I had paid for them. But thou, in ill manner with foolish teasing dost not allow me to be heedless.\u201D</p']
};

},{}],8:[function(require,module,exports){
// catulluscarmina/catullus.js

"use strict";

module.exports = {
   bookname: 'catulluscarmina',
   author: 'Caius Valerius Catullus',
   translationid: "catullus",
   title: 'The Carmina',
   translation: false,
   source: '<a href="http://www.gutenberg.org/files/20732/20732-h/20732-h.htm">Project Gutenberg</a>',
   translationshortname: "Catullus",
   translationfullname: "Caius Valerius Catullus",
   translationclass: "poetry",
   text: ['<p class="title">The Carmina</p>\n\t<p class="author">Caius Valerius Catullus</p>', '<p class="cantohead">I.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<div class="stanza">\n\t\t<p>Quoi dono lepidum novom libellum</p>\n\t\t<p>Arida modo pumice expolitum?</p>\n\t\t<p>Corneli, tibi: namque tu solebas</p>\n\t\t<p>Meas esse aliquid putare nugas,</p>\n\t\t<p>Iam tum cum ausus es unus Italorum</p>\n\t\t<p>Omne &aelig;vum tribus explicare chartis</p>\n\t\t<p>Doctis, Iuppiter, et laboriosis.</p>\n\t\t<p>Quare habe tibi quidquid hoc libelli,</p>\n\t\t<p>Qualecumque, quod o patrona virgo,</p>\n\t\t<p>Plus uno maneat perenne s&aelig;clo.</p>\n\t</div>', '<p class="cantohead">II.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<div class="stanza">\n\t\t<p>Passer, delici&aelig; me&aelig; puell&aelig;,</p>\n\t\t<p>Quicum ludere, quem in sinu tenere,</p>\n\t\t<p>Quoi primum digitum dare adpetenti</p>\n\t\t<p>Et acris solet incitare morsus,</p>\n\t\t<p>Cum desiderio meo nitenti</p>\n\t\t<p>Carum nescioquid libet iocari</p>\n\t\t<p>Vt solaciolum sui doloris,</p>\n\t\t<p>Credo ut iam gravis acquiescat ardor:</p>\n\t\t<p>Tecum ludere sicut ipsa possem</p>\n\t\t<p>Et tristis animi levare curas!</p>\n\t\t<p class="divider">* * * * *</p>\n\t\t<p>Tam gratumst mihi quam ferunt puell&aelig;</p>\n\t\t<p>Pernici aureolum fuisse malum,</p>\n\t\t<p>Quod zonam soluit diu ligatam.</p>\n\t\t</div>', '<p class="cantohead">III.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<div class="stanza">\n    <p>Lugete, o Veneres Cupidinesque,</p>\n    <p>Et quantumst hominum venustiorum.</p>\n    <p>Passer mortuus est me&aelig; puell&aelig;,</p>\n    <p>Passer, delici&aelig; me&aelig; puell&aelig;,</p>\n    <p>Quem plus illa oculis suis amabat:</p>\n    <p>Nam mellitus erat suamque norat</p>\n    <p>Ipsa tam bene quam puella matrem</p>\n    <p>Nec sese a gremio illius movebat,</p>\n    <p>Sed circumsiliens modo huc modo illuc</p>\n    <p>Ad solam dominam usque pipiabat.</p>\n    <p>Qui nunc it per iter tenebricosum</p>\n    <p>Illuc, unde negant redire quemquam.</p>\n    <p>At vobis male sit, mal&aelig; tenebr&aelig;</p>\n    <p>Orci, qu&aelig; omnia bella devoratis:</p>\n    <p>Tam bellum mihi passerem abstulistis.</p>\n    <p>O factum male! io miselle passer!</p>\n    <p>Tua nunc opera me&aelig; puell&aelig;</p>\n    <p>Flendo turgiduli rubent ocelli.</p>\n  </div>', '<p class="cantohead">IIII.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<div class="stanza"><p>Phaselus ille, quem videtis, hospites,</p>\n    <p>Ait fuisse navium celerrimus,</p>\n    <p>Neque ullius natantis impetum trabis</p>\n    <p>Nequisse pr&aelig;ter ire, sive palmulis</p>\n    <p>Opus foret volare sive linteo.</p>\n    <p>Et hoc negat minacis Adriatici</p>\n    <p>Negare litus insulasve Cycladas</p>\n    <p>Rhodumque nobilem horridamque Thraciam</p>\n    <p>Propontida trucemve Ponticum sinum,</p>\n    <p>Vbi iste post phaselus antea fuit</p>\n    <p>Comata silva: nam Cytorio in iugo</p>\n    <p>Loquente s&aelig;pe sibilum edidit coma.</p>\n    <p>Amastri Pontica et Cytore buxifer,</p>\n    <p>Tibi h&aelig;c fuisse et esse cognitissima</p>\n    <p>Ait phaselus: ultima ex origine</p>\n    <p>Tuo stetisse dicit in cacumine,</p>\n    <p>Tuo imbuisse palmulas in &aelig;quore,</p>\n    <p>Et inde tot per inpotentia freta</p>\n    <p>Erum tulisse, l&aelig;va sive dextera</p>\n    <p>Vocaret aura, sive utrumque Iuppiter</p>\n    <p>Simul secundus incidisset in pedem;</p>\n    <p>Neque ulla vota litoralibus deis</p>\n    <p>Sibi esse facta, cum veniret a marei</p>\n    <p>Novissime hunc ad usque limpidum lacum.</p>\n    <p>Sed h&aelig;c prius fuere: nunc recondita</p>\n    <p>Senet quiete seque dedicat tibi,</p>\n    <p>Gemelle Castor et gemelle Castoris.</p>\n\t</div>', '<p class="cantohead">V.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<div class="stanza"><p>Vivamus, mea Lesbia, atque amemus,</p>\n    <p>Rumoresque senum severiorum</p>\n    <p>Omnes unius &aelig;stimemus assis.</p>\n    <p>Soles occidere et redire possunt:</p>\n  \t<p>Nobis cum semel occidit brevis lux,</p>\n    <p>Nox est perpetua una dormienda.</p>\n    <p>Da mi basia mille, deinde centum,</p>\n    <p>Dein mille altera, dein secunda centum,</p>\n    <p>Deinde usque altera mille, deinde centum.</p>\n    <p>Dein, cum milia multa fecerimus,</p>\n    <p>Conturbabimus illa, ne sciamus,</p>\n    <p>Aut nequis malus invidere possit,</p>\n    <p>Cum tantum sciet esse basiorum.</p>\n\t</div>', '<p class="cantohead">VI.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<div class="stanza"><p>Flavi, delicias tuas Catullo,</p>\n    <p>Nei sint inlepid&aelig; atque inelegantes,</p>\n    <p>Velles dicere, nec tacere posses.</p>\n    <p>Verum nescioquid febriculosi</p>\n    <p>Scorti diligis: hoc pudet fateri.</p>\n    <p>Nam te non viduas iacere noctes</p>\n    <p>Nequiquam tacitum cubile clamat</p>\n    <p>Sertis ac Syrio fragrans olivo,</p>\n    <p>Pulvinusque per&aelig;que et hic et ille</p>\n    <p>Attritus, tremulique quassa lecti</p>\n    <p>Argutatio inambulatioque.</p>\n    <p>Nam nil stupra valet, nihil, tacere.</p>\n    <p>Cur? non tam latera ecfututa pandas,</p>\n    <p>Nei tu quid facias ineptiarum.</p>\n    <p>Quare quidquid habes boni malique,</p>\n    <p>Dic nobis. volo te ac tuos amores</p>\n    <p>Ad c&aelig;lum lepido vocare versu.</p>\n\t</div>', '<p class="cantohead">VII.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<div class="stanza"><p>Qu&aelig;ris, quot mihi basiationes</p>\n    <p>Tu&aelig;, Lesbia, sint satis superque.</p>\n    <p>Quam magnus numerus Libyss&aelig; aren&aelig;</p>\n    <p>Lasarpiciferis iacet Cyrenis,</p>\n    <p>Oraclum Iovis inter &aelig;stuosi</p>\n    <p>Et Batti veteris sacrum sepulcrum,</p>\n    <p>Aut quam sidera multa, cum tacet nox,</p>\n    <p>Furtivos hominum vident amores,</p>\n    <p>Tam te basia multa basiare</p>\n    <p>Vesano satis et super Catullost,</p>\n    <p>Qu&aelig; nec pernumerare curiosi</p>\n    <p>Possint nec mala fascinare lingua.</p>\n\t</div>', '<p class="cantohead">VIII.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<div class="stanza"><p>Miser Catulle, desinas ineptire,</p>\n    <p>Et quod vides perisse perditum ducas.</p>\n    <p>Fulsere quondam candidi tibi soles,</p>\n    <p>Cum ventitabas quo puella ducebat</p>\n  \t<p>Amata nobis quantum amabitur nulla.</p>\n    <p>Ibi illa multa tum iocosa fiebant,</p>\n    <p>Qu&aelig; tu volebas nec puella nolebat.</p>\n    <p>Fulsere vere candidi tibi soles.</p>\n    <p>Nunc iam illa non vult: tu quoque, inpotens, noli</p>\n  \t<p>Nec qu&aelig; fugit sectare, nec miser vive,</p>\n    <p>Sed obstinata mente perfer, obdura.</p>\n    <p>Vale, puella. iam Catullus obdurat,</p>\n    <p>Nec te requiret nec rogabit invitam:</p>\n    <p>At tu dolebis, cum rogaberis nulla.</p>\n  \t<p>Scelesta, v&aelig; te! qu&aelig; tibi manet vita!</p>\n    <p>Quis nunc te adibit? cui videberis bella?</p>\n    <p>Quem nunc amabis? cuius esse diceris?</p>\n    <p>Quem basiabis? cui labella mordebis?</p>\n    <p>At tu, Catulle, destinatus obdura.</p>\n\t</div>', '<p class="cantohead">VIIII.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<div class="stanza"><p>Verani, omnibus e meis amicis</p>\n    <p>Antistans mihi milibus trecentis,</p>\n    <p>Venistine domum ad tuos Penates</p>\n    <p>Fratresque unanimos anumque matrem?</p>\n    <p>Venisti. o mihi nuntii beati!</p>\n    <p>Visam te incolumem audiamque Hiberum</p>\n    <p>Narrantem loca, facta, nationes,</p>\n    <p>Vt mos est tuus, adplicansque collum</p>\n    <p>Iocundum os oculosque suaviabor.</p>\n    <p>O quantumst hominum beatiorum,</p>\n    <p>Quid me l&aelig;tius est beatiusve?</p>\n\t</div>', '<p class="cantohead">X.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<div class="stanza"><p>Varus me meus ad suos amores</p>\n    <p>Visum duxerat e foro otiosum,</p>\n    <p>Scortillum, ut mihi tum repente visumst,</p>\n    <p>Non sane inlepidum neque invenustum.</p>\n    <p>Huc ut venimus, incidere nobis</p>\n    <p>Sermones varii, in quibus, quid esset</p>\n    <p>Iam Bithynia, quo modo se haberet,</p>\n    <p>Ecquonam mihi profuisset &aelig;re.</p>\n    <p>Respondi id quod erat, nihil neque ipsis</p>\n    <p>Nec pr&aelig;toribus esse nec cohorti,</p>\n    <p>Cur quisquam caput unctius referret,</p>\n    <p>Pr&aelig;sertim quibus esset inrumator</p>\n    <p>Pr&aelig;tor, non faciens pili cohortem.</p>\n    <p>\u2018At certe tamen, inquiunt, quod illic</p>\n    <p>Natum dicitur esse, conparasti</p>\n    <p>Ad lecticam homines.\u2019 ego, ut puell&aelig;</p>\n    <p>Vnum me facerem beatiorem,</p>\n    <p>\u2018Non\u2019 inquam \u2018mihi tam fuit maligne,</p>\n    <p>Vt, provincia quod mala incidisset,</p>\n    <p>Non possem octo homines parare rectos.\u2019</p>\n    <p>At mi nullus erat nec hic neque illic,</p>\n    <p>Fractum qui veteris pedem grabati</p>\n    <p>In collo sibi collocare posset.</p>\n    <p>Hic illa, ut decuit cin&aelig;diorem,</p>\n    <p>\u2018Qu&aelig;so\u2019 inquit \u2018mihi, mi Catulle, paulum</p>\n    <p>Istos. commode enim volo ad Sarapim</p>\n    <p>Deferri.\u2019 \u2018minime\u2019 inquii puell&aelig;;</p>\n    <p class="divider">* * * * *</p>\n    <p>\u2018Istud quod modo dixeram me habere,</p>\n    <p>Fugit me ratio: meus sodalis</p>\n    <p>Cinnast Gaius, is sibi paravit.</p>\n    <p>Verum, utrum illius an mei, quid ad me?</p>\n    <p>Vtor tam bene quam mihi pararim.</p>\n    <p>Sed tu insulsa male ac molesta vivis,</p>\n    <p>Per quam non licet esse negligentem.\u2019</p>\n\t</div>']
};

},{}],9:[function(require,module,exports){
// version 4: now going to ES6 & Babel

"use strict";

var Hammer = require("hammerjs");
var Fastclick = require("fastclick");
var Velocity = require("velocity-animate");

var dom = require("./dom");
var data = require("./appdata");

var app = {
	helpers: {
		gettranslationindex: function gettranslationindex(transid) {
			for (var j = 0; j < data.translationdata.length; j++) {
				if (transid == data.translationdata[j].translationid) {
					return j;
				}
			}
		},
		rounded: function rounded(pixels) {

			// this is still a mess, fix this

			return data.lens.right.lineheight * Math.floor(pixels / data.lens.right.lineheight);
		},
		nexttrans: function nexttrans(giventranslation) {
			if (data.currenttranslationlist.length > 1) {
				if (data.currenttranslationlist.indexOf(giventranslation) + 1 == data.currenttranslationlist.length) {
					return data.currenttranslationlist[0];
				} else {
					return data.currenttranslationlist[data.currenttranslationlist.indexOf(giventranslation) + 1];
				}
			} else {
				return giventranslation;
			}
		},
		prevtrans: function prevtrans(giventranslation) {
			if (data.currenttranslationlist.length > 1) {
				if (data.currenttranslationlist.indexOf(giventranslation) == 0) {
					return data.currenttranslationlist[data.currenttranslationlist.length - 1];
				} else {
					return data.currenttranslationlist[data.currenttranslationlist.indexOf(giventranslation) - 1];
				}
			} else {
				return giventranslation;
			}
		},
		fixpadding: function fixpadding(thisside) {
			var divs = document.querySelectorAll("#text p");
			var div, padding, desiredwidth;
			var maxwidth = 0;

			if (dom.hasclass(thisside.text, "poetry")) {

				// this is poetry, figure out longest line

				thisside.text.style.paddingLeft = 0;
				for (var i = 0; i < divs.length; i++) {
					div = divs[i];
					div.style.display = "inline-block";
					if (div.clientWidth > maxwidth) {
						maxwidth = div.clientWidth + 90;
					}
					div.style.display = "block";
				}

				console.log("—>text width: " + thisside.width);
				console.log("—>max width: " + maxwidth);

				thisside.text.style.paddingLeft = (thisside.width - maxwidth) / 2 + "px";
				thisside.text.style.paddingRight = (thisside.width - maxwidth) / 2 + "px";
			} else {

				// this is prose, standardized padding

				desiredwidth = 75; // this is in vw

				console.log("—>text width: " + thisside.width);
				console.log("—>desired width: " + desiredwidth);
				console.log("—>lineheight: " + thisside.lineheight);

				//		console.log(lens.width + " "+desiredwidth);
				//		var padding = (lens.width - desiredwidth)/2;

				padding = (100 - desiredwidth) / 2;
				/*
    if((desiredwidth + 2) > lens.width) {
    	thisside.text.style.paddingLeft = "1vw";
    	thisside.text.style.paddingRight = "1vw";
    } else {
    	*/
				thisside.text.style.paddingLeft = padding + "vw";
				thisside.text.style.paddingRight = padding + "vw";
				//		}
			}
		},
		fixpaddingresponsive: function fixpaddingresponsive(thisside) {
			var divs = document.querySelectorAll("#" + thisside.slider.id + " .textframe p");
			var div;
			var maxwidth = 0;

			if (dom.hasclass(thisside.text, "poetry")) {

				// this is poetry, figure out longest line

				thisside.text.style.paddingLeft = 0;
				thisside.text.style.paddingRight = 0;
				thisside.textinside.style.marginLeft = 0;
				thisside.textinside.style.marginRight = 0;
				thisside.textinside.style.paddingLeft = 0;
				thisside.textinside.style.paddingRight = 0;
				for (var i = 0; i < divs.length; i++) {
					div = divs[i];
					div.style.display = "inline-block";

					// this is not picking up indents, I think – maybe div.clientWidth + (div.style.marginLeft + div.style.textIndent)

					if (div.clientWidth > maxwidth) {
						maxwidth = div.clientWidth + 90;
					}
					div.style.display = "block";
				}

				if (thisside.width - 16 > maxwidth) {
					console.log("Text width: " + thisside.width + "; max line width: " + maxwidth + "; calculated padding: " + (thisside.width - maxwidth - 16 - 16) / 2 + "px");
					thisside.text.style.paddingLeft = 0;
					thisside.text.style.paddingRight = 0;
					thisside.textinside.style.paddingLeft = 0;
					thisside.textinside.style.paddingRight = 0;
					thisside.textinside.style.marginLeft = (thisside.width - maxwidth - 16 - 16) / 2 + "px";
					thisside.textinside.style.marginRight = (thisside.width - maxwidth - 16 - 16) / 2 + "px";
				} else {
					console.log("Too wide! Text width: " + thisside.width + "; max line width: " + maxwidth + ".");
					thisside.text.style.paddingLeft = 8 + "px";
					thisside.text.style.paddingRight = 8 + "px";
					thisside.textinside.style.marginLeft = 0;
					thisside.textinside.style.marginRight = 0;
				}
			} else {
				console.log("Prose, not doing anything.");
			}
		},
		turnonsynchscrolling: function turnonsynchscrolling() {
			document.querySelector("#sliderleft .textframe").onscroll = function () {
				var percentage = this.scrollTop / this.scrollHeight * document.querySelector("#sliderright .textframe").scrollHeight;
				document.querySelector("#sliderright .textframe").scrollTop = percentage;
			};
			document.querySelector("#sliderright .textframe").onscroll = function () {
				var percentage = this.scrollTop / this.scrollHeight * document.querySelector("#sliderleft .textframe").scrollHeight;
				document.querySelector("#sliderleft .textframe").scrollTop = percentage;
			};
		},
		getUrlVars: function getUrlVars() {
			var vars = {};
			/*eslint-disable no-unused-vars*/
			var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
				vars[key] = value;
			});
			/*eslint-endable no-unused-vars*/
			return vars;
		}
	},
	notes: {
		setup: function setup() {
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
						app.notes.createclick(children[j]);
					}
				}
				count++;
			}
		},
		createclick: function createclick(el) {
			el.onclick = function (e) {
				e.stopPropagation();

				var thisnote = this.getAttribute("data-notenumber");
				var notetext = document.querySelector(".notetext[data-notenumber=\"" + thisnote + "\"]").innerHTML;
				app.notes.hide();
				var insert = dom.create("<div class=\"notewindow\" id=\"notewindow\">\n\t\t\t\t\t\t" + notetext + "\n\t\t\t\t\t</div>");
				data.elements.main.appendChild(insert);
				document.getElementById("notewindow").onclick = function () {
					app.notes.hide();
				};
			};
		},
		hide: function hide() {
			dom.removebyselector(".notewindow");
		}
	},
	settings: {
		gosettings: function gosettings(element) {

			// this is never actually used!

			element.onclick = function () {
				app.setpage("settings");
			};
		},
		checkboxgo: function checkboxgo(el) {
			el.onclick = function () {
				app.settings.changetranslation(this.id.replace("check-", ""), document.getElementById(this.id).checked);
			};
		},
		checkboxspango: function checkboxspango(el) {
			el.onclick = function () {
				document.getElementById("check-" + this.id).checked = !document.getElementById("check-" + this.id).checked;
				app.settings.changetranslation(this.id, document.getElementById("check-" + this.id).checked);
			};
		},
		changetranslation: function changetranslation(thisid, isset) {
			for (var i in data.translationdata) {
				if (thisid == data.translationdata[i].translationid) {
					if (isset) {
						data.currenttranslationlist.push(thisid);
						data.translationcount++;
					} else {
						if (data.translationcount > 1) {
							var j = data.currenttranslationlist.indexOf(thisid);
							if (j > -1) {
								data.currenttranslationlist.splice(j, 1);
							}
							data.translationcount--;
						} else {
							// there's only one translation in the list, do not delete last
							document.getElementById("check-" + thisid.toLowerCase()).checked = true;
						}
					}
				}
				app.localdata.save();
			}

			var newlist = [];
			for (var _i in data.translationdata) {
				if (data.currenttranslationlist.indexOf(data.translationdata[_i].translationid) > -1) {
					newlist.push(data.translationdata[_i].translationid);
				}
			}
			data.currenttranslationlist = newlist.slice();

			if (data.currenttranslationlist.indexOf(data.lens.right.translation) < 0) {
				data.lens.right.translation = data.currenttranslationlist[0];
			}

			app.settings.update();
		},
		update: function update() {
			// fired whenever we go to settings page

			// add in translation chooser

			dom.removebyselector("#translatorlist");
			var insert = dom.create('<ul id="translatorlist"></ul>');
			document.getElementById("translationchoose").appendChild(insert);
			var translatorlist = document.querySelector("#translatorlist");
			for (var i in data.translationdata) {
				insert = dom.create("<li>\n\t\t\t\t\t\t<input type=\"checkbox\" id=\"check-" + data.translationdata[i].translationid + "\" />\n\t\t\t\t\t\t<label for=\"" + data.translationdata[i].translationid + "\" id=\"" + data.translationdata[i].translationid + "\" ><span><span></span></span>" + data.translationdata[i].translationfullname + "</label>\n\t\t\t\t\t</li>");
				translatorlist.appendChild(insert);
				document.getElementById("check-" + data.translationdata[i].translationid).checked = data.currenttranslationlist.indexOf(data.translationdata[i].translationid) > -1;
			}

			var inputcheckbox = document.querySelectorAll("#translatorlist input[type=checkbox]");
			for (var _i2 = 0; _i2 < inputcheckbox.length; _i2++) {
				app.settings.checkboxgo(inputcheckbox[_i2]);
			}
			var translatorlistlabel = document.querySelectorAll("#translatorlist label");
			for (var _i3 = 0; _i3 < translatorlistlabel.length; _i3++) {
				app.settings.checkboxspango(translatorlistlabel[_i3]);
			}

			// add in toc

			dom.removebyselector("#selectors");
			insert = dom.create("<div id=\"selectors\">\n\t\t\t\t\t<p>Canto: <select id=\"selectcanto\"></select></p>\n\t\t\t\t\t<p>Translation: <select id=\"selecttranslator\"></select></p>\n\t\t\t\t\t<p><span id=\"selectgo\">Go</span></p>\n\t\t\t\t</div>");
			document.getElementById("translationgo").appendChild(insert);
			for (var _i4 = 0; _i4 < data.cantocount; _i4++) {
				insert = dom.create("<option id=\"canto" + _i4 + "\" " + (data.canto == _i4 ? "selected" : "") + ">" + data.cantotitles[_i4] + "</option>");
				document.getElementById("selectcanto").appendChild(insert);
			}
			for (var _i5 in data.currenttranslationlist) {
				for (var j = 0; j < data.translationdata.length; j++) {
					if (data.translationdata[j].translationid == data.currenttranslationlist[_i5]) {
						insert = dom.create("<option id=\"tr_" + data.translationdata[j].translationid + "\" " + (data.currenttranslationlist.indexOf(data.lens.right.translation) == _i5 ? "selected" : "") + ">" + data.translationdata[j].translationfullname + "</option>");
						document.getElementById("selecttranslator").appendChild(insert);
					}
				}
			}

			document.querySelector("#selectgo").onclick = function () {
				var selected = document.getElementById("selecttranslator");
				var thistrans = selected.options[selected.selectedIndex].id.substr(3);
				selected = document.getElementById("selectcanto");
				var thiscanto = selected.options[selected.selectedIndex].id.substr(5);
				for (var _j = 0; _j < data.translationdata.length; _j++) {
					if (data.currenttranslationlist[_j] == thistrans) {
						app.setpage("lens");
						app.setlens(data.currenttranslationlist[_j], thiscanto, "right", 0);
					}
				}
			};
		}
	},
	localdata: {
		save: function save() {
			// this should store appdate on localstorage

			var tostore = JSON.stringify({
				currentcanto: data.canto,
				currenttransright: data.lens.right.translation,
				currenttransleft: data.lens.left.translation,
				translationset: data.currenttranslationlist,
				twinmode: data.usersettings.twinmode,
				nightmode: data.usersettings.nightmode,
				shownotes: data.usersettings.shownotes
			});

			var storage = window.localStorage;
			storage.setItem(data.bookname, tostore);

			// save current location as hash

			if (history.pushState) {
				var newurl = window.location.origin + window.location.pathname + ("?canto=" + data.canto + "&trans=" + data.lens.right.translation);
				if (data.usersettings.twinmode) {
					newurl += "&lefttrans=" + data.lens.left.translation;
				}
				if (window.location.protocol !== "file:") {
					window.history.pushState({ path: newurl }, '', newurl);
				} else {
					console.log(newurl);
				}
			}
		},
		read: function read() {

			if (app.helpers.getUrlVars().reset) {
				console.log("Resetting local storage!");
				var _storage = window.localStorage;
				_storage.removeItem(data.bookname);
			}

			var gotocanto = 0;
			var gototrans = "";
			var gotolefttrans = "";
			var gototwinmode = false;
			var cantoflag = false;
			var transflag = false;

			// this should take localstorage and replace the values in data with it

			// first, read local storage

			var storage = window.localStorage;
			var toread = storage.getItem(data.bookname);

			if (toread !== null) {
				console.log("What's in local storage: " + toread);
				var storedvalues = JSON.parse(toread);
				console.log(storedvalues);
				data.currentcanto = storedvalues.currentcanto;
				data.lens.right.translation = storedvalues.currenttransright;
				data.lens.left.translation = storedvalues.currenttransleft;
				data.usersettings.twinmode = storedvalues.twinmode;
				data.usersettings.nightmode = storedvalues.nightmode;
				data.usersettings.shownotes = storedvalues.shownotes;
				data.currenttranslationlist = storedvalues.translationset;
				if (data.usersettings.twinmode) {
					dom.addclass("body", "twinmode");
					dom.removeclass("#twinmode", "off");
					dom.addclass("#singlemode", "off");
				} else {
					dom.removeclass("body", "twinmode");
					dom.addclass("#twinmode", "off");
					dom.removeclass("#singlemode", "off");
				}
				if (data.usersettings.nightmode) {
					dom.addclass("body", "nightmode");
					dom.removeclass("#nightmode", "off");
					dom.addclass("#daymode", "off");
				} else {
					dom.removeclass("body", "nightmode");
					dom.addclass("#nightmode", "off");
					dom.removeclass("#daymode", "off");
				}
				if (data.usersettings.shownotes) {
					dom.removeclass("body", "hidenotes");
					dom.removeclass("#shownotes", "off");
					dom.addclass("#hidenotes", "off");
				} else {
					dom.addclass("body", "hidenotes");
					dom.addclass("#shownotes", "off");
					dom.removeclass("#hidenotes", "off");
				}
				app.setlens(data.currenttranslationlist[app.helpers.gettranslationindex(data.lens.right.translation)], data.currentcanto, "right", 0);
			}

			// second, read hash

			if (app.helpers.getUrlVars().canto) {
				gotocanto = app.helpers.getUrlVars().canto;
				cantoflag = true;
			}
			if (app.helpers.getUrlVars().trans) {
				gototrans = app.helpers.getUrlVars().trans;
				transflag = true;
			}
			if (app.helpers.getUrlVars().lefttrans) {
				gotolefttrans = app.helpers.getUrlVars().lefttrans;
				gototwinmode = true;
			}

			if (cantoflag && transflag) {
				console.log("We have canto & trans from URL!");
				if (gototwinmode) {
					console.log("We have left trans from URL!");
					data.usersettings.twinmode = true;
					dom.addclass("body", "twinmode");
					dom.removeclass("#twinmode", "off");
					dom.addclass("#singlemode", "off");
					data.lens.left.translation = gotolefttrans;
				}
				app.setlens(data.currenttranslationlist[app.helpers.gettranslationindex(gototrans)], gotocanto, "right", 0);
			} else {
				console.log("No canto/translation found in URL.");
			}
		}
	},
	controls: {
		start: function start() {
			app.controls.navbar();
			app.controls.settings();
			app.controls.swiping();
			app.controls.notes();
			app.controls.keys();
		},
		navbar: function navbar() {
			// button controls
			document.querySelector("#navbarleft .navprev").onclick = function () {
				app.setlens(app.helpers.nexttrans(data.lens.left.translation), data.canto, "left");
			};
			document.querySelector("#navbarleft .navnext").onclick = function () {
				app.setlens(app.helpers.prevtrans(data.lens.left.translation), data.canto, "left");
			};
			document.querySelector("#navbarleft .navup").onclick = function () {
				app.setlens(data.lens.right.translation, data.canto - 1, "right", 0);
			};
			document.querySelector("#navbarleft .navdown").onclick = function () {
				app.setlens(data.lens.right.translation, data.canto + 1, "right", 0);
			};
			document.querySelector("#navbarright .navprev").onclick = function () {
				app.setlens(app.helpers.nexttrans(data.lens.right.translation), data.canto, "right");
			};
			document.querySelector("#navbarright .navnext").onclick = function () {
				app.setlens(app.helpers.prevtrans(data.lens.right.translation), data.canto, "right");
			};
			document.querySelector("#navbarright .navup").onclick = function () {
				app.setlens(data.lens.right.translation, data.canto - 1, "right", 0);
			};
			document.querySelector("#navbarright .navdown").onclick = function () {
				app.setlens(data.lens.right.translation, data.canto + 1, "right", 0);
			};
			document.querySelector("#navbarleft .navclose").onclick = function () {
				dom.removeclass("body", "twinmode");
				dom.addclass("#twinmode", "off");
				dom.removeclass("#singlemode", "off");
				data.usersettings.twinmode = false;
				app.resize();
			};
			data.elements.titlebar.onclick = function () {
				app.setpage("lens");
			};
			document.querySelector("#navbarright .navsettings").onclick = function () {
				app.settings.update();
				app.setpage("settings");
			};

			document.body.onkeyup = function (e) {
				// maybe this is screwing us on mobile?
				e.preventDefault();
				dom.removeclass(".button", "on");
			};
		},
		settings: function settings() {
			document.getElementById("aboutlink").onclick = function () {
				app.setpage("about");
			};
			document.getElementById("helplink").onclick = function () {
				app.setpage("help");
			};

			if (data.usersettings.twinmode) {
				dom.removeclass("#twinmode", "off");
				dom.addclass("#singlemode", "off");
			} else {
				dom.addclass("#twinmode", "off");
				dom.removeclass("#singlemode", "off");
			}

			if (data.usersettings.nightmode) {
				dom.removeclass("#nightmode", "off");
				dom.addclass("#daymode", "off");
			} else {
				dom.addclass("#nightmode", "off");
				dom.removeclass("#daymode", "off");
			}

			if (data.usersettings.shownotes) {
				dom.removeclass("#shownotes", "off");
				dom.addclass("#hidenotes", "off");
			} else {
				dom.addclass("#shownotes", "off");
				dom.removeclass("#hidenotes", "off");
			}

			document.getElementById("daymode").onclick = function () {
				dom.removeclass("body", "nightmode");
				dom.addclass("#nightmode", "off");
				dom.removeclass("#daymode", "off");
				data.usersettings.nightmode = false;
			};
			document.querySelector("#nightmode").onclick = function () {
				dom.addclass("body", "nightmode");
				dom.removeclass("#nightmode", "off");
				dom.addclass("#daymode", "off");
				data.usersettings.nightmode = true;
			};
			if (document.getElementById("singlemode") !== null) {
				document.getElementById("singlemode").onclick = function () {
					dom.removeclass("body", "twinmode");
					dom.addclass("#twinmode", "off");
					dom.removeclass("#singlemode", "off");
					data.usersettings.twinmode = false;
				};
				document.querySelector("#twinmode").onclick = function () {
					dom.addclass("body", "twinmode");
					dom.removeclass("#twinmode", "off");
					dom.addclass("#singlemode", "off");
					data.usersettings.twinmode = true;
				};
			}

			// show/hide notes

			document.querySelector("#hidenotes").onclick = function () {
				dom.addclass("body", "hidenotes");
				dom.addclass("#shownotes", "off");
				dom.removeclass("#hidenotes", "off");
			};
			document.querySelector("#shownotes").onclick = function () {
				dom.removeclass("body", "hidenotes");
				dom.addclass("#hidenotes", "off");
				dom.removeclass("#shownotes", "off");
			};

			document.getElementById("backbutton").onclick = function () {
				if (data.currentpage == "help" || data.currentpage == "about") {
					app.setpage("settings");
				} else {
					app.setpage("lens");
				}
			};

			// set up about page

			document.getElementById("abouttext").innerHTML = data.description; // set up about page

			for (var i in data.versionhistory) {
				document.getElementById("versionhistory").innerHTML += "<li>" + data.versionhistory[i] + "</li>";
			}
			document.getElementById("comingsoon").innerHTML = data.comingsoon;
		},
		notes: function notes() {
			data.elements.main.onclick = function () {
				app.notes.hide();
			};

			for (var i = 0; i < data.textdata.length; i++) {
				var thisnotes = data.textdata[i].notes;
				if (typeof thisnotes !== "undefined") {
					console.log("Inserting notes for " + data.textdata[i].translationid);
					for (var j = 0; j < thisnotes.length; j++) {
						for (var k = 0; k < thisnotes[j].length; k++) {
							var thisnote = thisnotes[j][k];
							if (data.textdata[i].text[j].indexOf("{{" + thisnote.noteno + "}}") > 0) {
								var copy = data.textdata[i].text[j].replace("{{" + thisnote.noteno + "}}", "<span class=\"note\"><span class=\"noteno\">" + (k + 1) + "</span><span class=\"notetext\">" + thisnote.notetext + "</span></span>");
								data.textdata[i].text[j] = copy;
							} else {
								console.log("Not found in canto " + j + ": " + thisnote.noteno + ": " + thisnote.notetext);
							}
						}
					}
				}
			}
		},
		swiping: function swiping() {
			// swipe controls
			data.elements.hammerright = new Hammer(data.lens.right.slider, {
				touchAction: 'auto'
			});
			data.elements.hammerleft = new Hammer(data.lens.left.slider, {
				touchAction: 'auto'
			});
			data.elements.hammerright.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
			data.elements.hammerright.on('swipeleft', function (e) {
				e.preventDefault();
				app.setlens(app.helpers.nexttrans(data.lens.right.translation), data.canto, "right");
			}).on('swiperight', function (e) {
				e.preventDefault();
				app.setlens(app.helpers.prevtrans(data.lens.right.translation), data.canto, "right");
			});

			data.elements.hammerright.on('swipedown', function (e) {
				// e.preventDefault(); // attempt to fix android swipe down = reload behavior
				if (data.lens.right.text.scrollTop === 0) {
					app.setlens(data.lens.right.translation, data.canto - 1, "right", 1); // this needs to be at the bottom!
				}
			}).on('swipeup', function (e) {
				e.preventDefault();
				// if difference between current scroll position + height of frame & complete height
				// of column is less than 8, go to the next one
				if (Math.abs(data.lens.right.text.scrollTop + data.lens.right.text.clientHeight - data.lens.right.text.scrollHeight) < 4) {
					app.setlens(data.lens.right.translation, data.canto + 1, "right");
				}
			});
			data.elements.hammerleft.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
			data.elements.hammerleft.on('swipeleft', function (e) {
				e.preventDefault();
				app.setlens(app.helpers.nexttrans(data.lens.left.translation), data.canto, "left");
			}).on('swiperight', function (e) {
				e.preventDefault();
				app.setlens(app.helpers.prevtrans(data.lens.left.translation), data.canto, "left");
			});

			data.elements.hammerleft.on('swipedown', function (e) {
				// e.preventDefault(); // attempt to fix android swipe down = reload behavior
				if (data.lens.left.text.scrollTop === 0) {
					app.setlens(data.lens.right.translation, data.canto - 1, "right", 1); // this needs to be at the bottom!
				}
			}).on('swipeup', function (e) {
				e.preventDefault();
				// if difference between current scroll position + height of frame & complete height
				// of column is less than 8, go to the next one
				if (Math.abs(data.lens.left.text.scrollTop + data.lens.left.text.clientHeight - data.lens.left.text.scrollHeight) < 4) {
					app.setlens(data.lens.right.translation, data.canto + 1, "right");
				}
			});
		},
		keys: function keys() {
			// key controls

			document.body.onkeydown = function (e) {
				e.preventDefault();
				if ((e.keyCode || e.which) === 37) {
					dom.addclass("#navprev", "on");
					app.setlens(app.helpers.prevtrans(data.lens.right.translation), data.canto, "right");
				}
				if ((e.keyCode || e.which) === 39) {
					dom.addclass("#navnext", "on");
					app.setlens(app.helpers.nexttrans(data.lens.right.translation), data.canto, "right");
				}
				if ((e.keyCode || e.which) === 38) {
					dom.addclass("#navup", "on");
					app.setlens(data.lens.right.translation, data.canto - 1, "right");
				}
				if ((e.keyCode || e.which) === 40) {
					dom.addclass("#navdown", "on");
					app.setlens(data.lens.right.translation, data.canto + 1, "right", 0);
				}

				if ((e.keyCode || e.which) === 33) {
					// pageup: right now this goes to the previous canto
					dom.addclass("#navup", "on");
					app.setlens(data.lens.right.translation, data.canto - 1, "right");
				}
				if ((e.keyCode || e.which) === 34) {
					// pagedown: right now this goes to the next canto
					dom.addclass("#navdown", "on");
					app.setlens(data.lens.right.translation, data.canto + 1, "right", 0);
				}

				if ((e.keyCode || e.which) === 36) {
					// home: right now this goes to the first canto
					dom.addclass("#navup", "on");
					app.setlens(data.lens.right.translation, 0, "right");
				}
				if ((e.keyCode || e.which) === 35) {
					// end: right now this goes to the last canto
					dom.addclass("#navdown", "on");
					app.setlens(data.lens.right.translation, data.cantocount - 1, "right", 0);
				}
			};
		}
	},
	resize: function resize() {

		//console.log("Navbar: " + document.getElementById("navbar").clientWidth);
		//console.log("Navtitle: " + data.lens.right.titlebar.clientWidth);
		//console.log("button width: " + document.querySelector(".navprev").clientWidth);

		data.windowwidth = window.innerWidth;
		data.windowheight = window.innerHeight;
		var titlewidth = document.getElementById("navbar").clientWidth - 5 * 40 - 1;

		if (data.usersettings.twinmode && data.windowwidth > 768) {
			dom.addclass("body", "twinmode");
			titlewidth = document.getElementById("navbar").clientWidth / 2 - 5 * 40 - 1;
			console.log("Twin mode!");
			if (data.lens.left.translation === "") {
				data.lens.left.translation = app.helpers.nexttrans(data.lens.right.translation);
			}

			var thistrans = app.helpers.gettranslationindex(data.lens.left.translation);

			dom.addclass("#sliderleft .textframe", data.translationdata[thistrans].translationclass);
			var insert = dom.create(data.textdata[thistrans].text[data.canto]);
			data.lens.left.textinside.appendChild(insert);

			data.lens.left.slider.style.width = "50%";
			data.lens.right.slider.style.width = "50%";
			app.setlens(data.lens.left.translation, data.canto, "left");
		} else {
			console.log("Single mode!");
			dom.removeclass("body", "twinmode");

			data.lens.left.slider.style.width = "0";
			data.lens.right.slider.style.width = "100%";
		}

		data.lens.left.titlebar.style.width = titlewidth + "px";
		data.lens.left.titlebar.setAttribute("style", "width:" + titlewidth + "px");
		data.lens.right.titlebar.style.width = titlewidth + "px";
		data.lens.right.titlebar.setAttribute("style", "width:" + titlewidth + "px");

		console.log("The window has been resized! New width: " + data.windowwidth + "," + data.windowheight);
		data.lens.width = data.windowwidth;
		data.lens.height = data.windowheight - document.getElementById("navbar").clientHeight; // is this accurate on iOS?

		dom.addclass(".page", data.lens.width > data.lens.height ? "landscape" : "portrait");
		dom.removeclass(".page", data.lens.width > data.lens.height ? "portrait" : "landscape");
		/*
  data.elements.main.style.width = data.lens.width+"px";
  data.elements.content.style.width = data.lens.width+"px";
  */
		data.elements.main.style.height = data.windowheight + "px";
		data.elements.content.style.height = data.lens.height + "px";

		if (data.system.responsive) {
			// are these numbers actually synched to what's in the CSS? check!

			var actualwidth = data.usersettings.twinmode ? data.windowwidth / 2 : data.windowwidth;

			if (actualwidth < 640) {
				data.lens.left.lineheight = 20;
				data.lens.right.lineheight = 20;
			} else {
				if (actualwidth < 768) {
					data.lens.left.lineheight = 24;
					data.lens.right.lineheight = 24;
				} else {
					if (actualwidth < 1024) {
						data.lens.left.lineheight = 28;
						data.lens.right.lineheight = 28;
					} else {
						data.lens.left.lineheight = 32;
						data.lens.right.lineheight = 32;
					}
				}
			}
		} else {
			data.lens.left.lineheight = data.windowwidth / 25;
			data.lens.right.lineheight = data.windowwidth / 25;
		}

		data.lens.left.width = data.usersettings.twinmode ? data.windowwidth / 2 : 0;
		data.lens.right.width = data.usersettings.twinmode ? data.windowwidth / 2 : data.windowwidth;

		app.setlens(data.lens.right.translation, data.canto, "right");
	},
	setlens: function setlens(newtrans, newcanto, side, percentage) {
		console.log("\nSetlens called for " + newtrans + ", canto " + newcanto + ", " + side);

		// if page isn't set to "lens" this doesn't do anything

		if (data.currentpage == "lens") {
			(function () {

				var changetrans = void 0,
				    changecanto = false;
				var thisside = data.lens[side];
				var otherside = side == "right" ? data.lens.left : data.lens.right;
				var other = side == "right" ? "left" : "right";
				//		dom.removebyselector("#oldtextleft"); // attempt to fix flickering if too fast change
				//		dom.removebyselector("#oldtextright"); // attempt to fix flickering if too fast change

				var oldtransindex = data.currenttranslationlist.indexOf(thisside.translation); // the number of the old translation in current list
				var newtransindex = data.currenttranslationlist.indexOf(newtrans); // the number of the trans we're going to in currentlist

				if (newcanto !== data.canto) {
					changecanto = true;
					if (newcanto >= data.cantocount) {
						newcanto = 0;
					} else {
						if (newcanto < 0) {
							newcanto = data.cantocount - 1;
						}
					}
				}

				if (newtransindex - oldtransindex !== 0) {
					changetrans = true;
					percentage = thisside.text.scrollTop /*+ thisside.text.clientHeight*/ / thisside.text.scrollHeight;
					console.log("\u2014>Current percentage: " + percentage);
				}

				// need to figure which translationdata we need from master list of translations

				var othertranslationindex = 0;
				var newtranslationindex = app.helpers.gettranslationindex(newtrans);
				var oldtranslationindex = app.helpers.gettranslationindex(thisside.translation);
				if (data.usersettings.twinmode) {
					othertranslationindex = app.helpers.gettranslationindex(otherside.translation);
				}

				if (changetrans) {

					console.log("Changing translation!");

					// changing translation

					thisside.text.id = "oldtext" + side;
					var direction = 0;

					// if new is bigger than old AND ( old is not 0 OR new is not the last one )
					// OR if new is 0 and old is the last one

					if (newtransindex > oldtransindex && (oldtransindex > 0 || newtransindex !== data.currenttranslationlist.length - 1) || newtransindex == 0 && oldtransindex == data.currenttranslationlist.length - 1) {

						// we are inserting to the right

						var insert = dom.create("<div id=\"newtext" + side + "\" class=\"textframe " + data.translationdata[newtranslationindex].translationclass + "\" style=\"left:100%;\"><div class=\"textinsideframe\">" + data.textdata[newtranslationindex].text[newcanto] + "</div></div>");
						thisside.slider.appendChild(insert);
						if (data.usersettings.twinmode) {
							direction = "-50%";
						} else {
							direction = "-100%";
						}
					} else {

						// we are inserting to the left

						var _insert = dom.create("<div id=\"newtext" + side + "\" class=\"textframe " + data.translationdata[newtranslationindex].translationclass + "\" style=\"left:-100%;\"><div class=\"textinsideframe\">" + data.textdata[newtranslationindex].text[newcanto] + "</div></div>");
						thisside.slider.insertBefore(_insert, thisside.slider.childNodes[0]);
						if (data.usersettings.twinmode) {
							direction = "50%";
						} else {
							direction = "100%";
						}
					}

					otherside.slider.style.zIndex = 500;
					Velocity(thisside.slider, { 'left': direction }, {
						duration: data.system.delay,
						mobileHA: false,
						complete: function complete() {
							dom.removebyselector("#oldtext" + side);
							otherside.slider.style.zIndex = 1;
							thisside.slider.style.left = "0";
							thisside.text.style.left = "0";
							dom.addclass("#slider" + side + " .textframe", "makescroll");
						}
					});
					thisside.text = document.querySelector("#newtext" + side);
					thisside.textinside = document.querySelector("#newtext" + side + " .textinsideframe");
					thisside.translation = newtrans;

					// this method still isn't great! it tries to round to current lineheight
					// to avoid cutting off lines

					var scrollto = app.helpers.rounded(percentage * document.querySelector("#newtext" + side).scrollHeight);
					document.querySelector("#newtext" + side).scrollTop = scrollto;
					if (data.usersettings.twinmode) {
						var _scrollto = app.helpers.rounded(percentage * document.querySelector("#newtext" + other).scrollHeight);
						document.querySelector("#newtext" + other).scrollTop = _scrollto;
					}
					console.log("Scrolling to:" + scrollto);
					if (data.usersettings.twinmode) {
						app.helpers.turnonsynchscrolling();
					}
				}

				if (changecanto || !changetrans) {

					// we are either changing canto OR this is the first run

					if (data.usersettings.twinmode) {
						document.querySelector("#slider" + other + " .textinsideframe").innerHTML = data.textdata[othertranslationindex].text[newcanto];
						dom.removeclass("#slider" + other + " .textframe", data.translationdata[othertranslationindex].translationclass);
						dom.addclass("#slider" + other + " .textframe", data.translationdata[othertranslationindex].translationclass);
						document.querySelector("#slider" + side + " .textinsideframe").innerHTML = data.textdata[newtranslationindex].text[newcanto];
						dom.removeclass("#slider" + side + " .textframe", data.translationdata[oldtranslationindex].translationclass);
						dom.addclass("#slider" + side + " .textframe", data.translationdata[newtranslationindex].translationclass);
					} else {
						document.querySelector("#slider" + side + " .textinsideframe").innerHTML = data.textdata[newtranslationindex].text[newcanto];
						dom.removeclass("#slider" + side + " .textframe", data.translationdata[oldtranslationindex].translationclass); // is this not working for multiple classes?
						dom.addclass("#slider" + side + " .textframe", data.translationdata[newtranslationindex].translationclass); // is this not working for multiple classes?
					}
					data.canto = newcanto;

					if (percentage > 0) {
						document.querySelector("#newtext" + side).scrollTop = document.querySelector("#newtext" + side).scrollHeight;
						if (data.usersettings.twinmode) {
							document.querySelector("#newtext" + other).scrollTop = document.querySelector("#newtext" + other).scrollHeight;
						}
					} else {
						document.querySelector("#newtext" + side).scrollTop = 0;
						if (data.usersettings.twinmode) {
							document.querySelector("#newtext" + other).scrollTop = 0;
						}
					}
				}

				if (data.system.responsive) {
					app.helpers.fixpaddingresponsive(thisside);
					if (data.usersettings.twinmode) {
						app.helpers.fixpaddingresponsive(otherside);
					}
				} else {
					app.helpers.fixpadding(thisside);
					if (data.usersettings.twinmode) {
						app.helpers.fixpadding(otherside);
					}
				}

				// deal with title bar

				if (data.canto > 0) {
					thisside.titlebar.innerHTML = data.translationdata[newtranslationindex].translationshortname + " \xB7 <strong>Canto " + data.canto + "</strong>";
					if (data.usersettings.twinmode) {
						if (data.usersettings.twinmode) {
							otherside.titlebar.innerHTML = data.translationdata[othertranslationindex].translationshortname + " \xB7 <strong>Canto " + data.canto + "</strong>";
						}
					}
				} else {
					thisside.titlebar.innerHTML = "&nbsp;";
					if (data.usersettings.twinmode) {
						otherside.titlebar.innerHTML = "&nbsp;";
					}
				}

				// set up notes

				app.notes.setup();

				// turn on synch scrolling

				if (data.usersettings.twinmode) {
					app.helpers.turnonsynchscrolling();
				}

				// record changes

				app.localdata.save();
			})();
		}
	},
	setpage: function setpage(newpage) {
		dom.removeclass(".page", "on");
		dom.addclass(".page#" + newpage, "on");
		data.currentpage = newpage;
		if (newpage !== "lens") {
			// set title to be whatever the h1 is

			var newtitle = document.querySelector("#" + newpage + " h1").innerHTML;
			data.elements.titlebar.innerHTML = newtitle;
			dom.addclass("nav#navbarleft", "off");
			dom.addclass("nav#navbarright", "off");

			dom.addclass("#navbarother", "on");

			// make back button on left of nav bar visible!
		} else {
			dom.removeclass("nav#navbarleft", "off");
			dom.removeclass("nav#navbarright", "off");

			dom.removeclass("#navbarother", "on");

			// hide back button on left of nav bar!

			app.resize();
		}
	},
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
	onDeviceReady: function onDeviceReady() {
		data.system.oncordova = true; // we're running on cordova
		data.system.platform = device.plaform; // should be either "iOS" or "Android"
		console.log(device.cordova);
		console.log("Cordova running. Platform: " + data.system.platform);
		app.setup();
	},
	setup: function setup() {
		console.log("In setup");

		// basic doc setup

		data.elements.lens = document.getElementById("lens");
		data.elements.main = document.getElementById("main");
		data.elements.content = document.getElementById("content");
		data.elements.titlebar = document.querySelector("#navbarother .navtitle");

		data.lens.left.slider = document.getElementById("sliderleft");
		data.lens.left.text = document.querySelector("#sliderleft .textframe");
		data.lens.left.textinside = document.querySelector("#sliderleft .textinsideframe");
		data.lens.left.titlebar = document.querySelector("#navbarleft .navtitle");

		data.lens.right.slider = document.getElementById("sliderright");
		data.lens.right.text = document.querySelector("#sliderright .textframe");
		data.lens.right.textinside = document.querySelector("#sliderright .textinsideframe");
		data.lens.right.titlebar = document.querySelector("#navbarright .navtitle");

		document.title = "Cross Dante " + data.booktitle;

		if (data.usersettings.nightmode) {
			dom.addclass("body", "nightmode");
		} else {
			dom.removeclass("body", "nightmode");
		}

		// set up current translation list (initially use all of them)

		for (var i in data.translationdata) {
			data.currenttranslationlist.push(data.translationdata[i].translationid);
			document.getElementById("textsources").innerHTML += "<li>" + data.translationdata[i].translationfullname + ", <em>" + data.translationdata[i].title + ":</em> " + data.translationdata[i].source + "</li>";
		}

		data.lens.right.translation = data.currenttranslationlist[0];
		if (!data.system.oncordova) {
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

							if (data.currentpage == "lens" && data.lens.right.text.scrollTop < 1) {
								app.setlens(data.lens.right.translation, data.canto - 1, "right", 1);
							}
							return;
						}
					}
				};
				document.addEventListener('touchstart', touchstartHandler, false);
				document.addEventListener('touchmove', touchmoveHandler, false);
			});
		}

		app.controls.start(); // this sets up controls
		app.localdata.read(); // this reads in locally saved data
		dom.addclass("body", data.bookname);
		dom.addclass("body", data.system.oncordova ? "cordova" : "web");
		dom.removebyselector("#loadingscrim");
		app.setpage("lens"); // this could feasibly be set to what's in data.currentpage if we wanted to save that locally?
	}
};

module.exports = app;

},{"./appdata":10,"./dom":11,"fastclick":1,"hammerjs":2,"velocity-animate":3}],10:[function(require,module,exports){
"use strict";

// appdata.js

module.exports = {
	currenttranslationlist: [], // list of ids of translations we're currently using
	windowwidth: window.innerWidth, // the window width
	windowheight: window.innerHeight, // the window height
	currentpage: "lens", // the page that we're currently viewing
	canto: 0, // the current canto
	elements: {
		lens: document.getElementById("lens"),
		main: document.getElementById("main"),
		content: document.getElementById("content"),
		hammerleft: "",
		hammerright: ""
	},
	lens: {
		width: window.innerWidth, // is this actually needed? same as windowwidth
		height: window.innerHeight - 40, // this is assuming navbar is always 40px
		left: {
			translation: "", // this was an index, changing it to a member of currenttranslationlist
			lineheight: 24, // this is the base lineheight; changed at different sizes
			percentage: 0, // this is current percentage of page (maybe this should be in terms of lines on page?)
			lines: 0, // this is the number of lines calculated to be on the page
			width: 0, // this is the width of the left lens (0 if not in twin mode)
			titlebar: document.querySelector("#navbarleft .navtitle"),
			slider: document.getElementById("#sliderleft"),
			textinside: document.querySelector("#sliderleft .textinsideframe"),
			text: document.getElementById("#sliderleft .textframe")
		},
		right: {
			translation: "", // this is an id found in currenttranslationlist
			lineheight: 24, // this is the base lineheight; changed at different sizes
			percentage: 0, // this is current percentage of page (maybe this should be in terms of lines on page?)
			lines: 0, // this is the number of lines calculated to be on the page
			width: window.innerWidth, // this is the width of the right lens (same as window if not in twin mode)
			titlebar: document.querySelector("#navbarright .navtitle"),
			slider: document.getElementById("#sliderright"),
			textinside: document.querySelector("#sliderright .textinsideframe"),
			text: document.getElementById("#sliderright .textframe")
		}
	},
	system: {
		responsive: true, // if false, attempts to use viewport units (doesn't work right now)
		oncordova: false, // this is true if running as an app
		platform: "", // if on cordova, this is the platform for the book
		delay: 600 // this is the amount of time swiping takes, in ms
	},
	usersettings: { // these can be overridden by previously saved user settings
		twinmode: false, // whether or not twin mode is turned on
		nightmode: false, // whether or not night mode is turned on
		shownotes: true // whether or not notes are shown
	},

	// things that come from the bookfile (all of these are overwritten:)

	bookname: "", // the work's individual code (lowercase, no punctuation, no spaces), e.g. "inferno"
	booktitle: "", // the work's title
	bookauthor: "", // the work's author (distinct from translator)
	versionhistory: [], // the version history, an array of texts
	comingsoon: "", // the book's coming soon information, a chunk of HTML
	translationcount: 0, // this is the number of different translations in the book
	cantocount: 0, // this is the number of cantos in the book
	textdata: [],
	translationdata: [],
	cantotitles: [] // the canonical titles for cantos, used in navbar and in selection
};

},{}],11:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZmFzdGNsaWNrL2xpYi9mYXN0Y2xpY2suanMiLCJub2RlX21vZHVsZXMvaGFtbWVyanMvaGFtbWVyLmpzIiwibm9kZV9tb2R1bGVzL3ZlbG9jaXR5LWFuaW1hdGUvdmVsb2NpdHkuanMiLCJzcmMvanMvY2F0dWxsdXNjYXJtaW5hLmpzIiwic3JjL2pzL2NhdHVsbHVzY2FybWluYS9ib29rZGF0YS5qcyIsInNyYy9qcy9jYXR1bGx1c2Nhcm1pbmEvdHJhbnNsYXRpb25zL2J1cnRvbnNtaXRoZXJzcG9ldHJ5LmpzIiwic3JjL2pzL2NhdHVsbHVzY2FybWluYS90cmFuc2xhdGlvbnMvYnVydG9uc21pdGhlcnNwcm9zZS5qcyIsInNyYy9qcy9jYXR1bGx1c2Nhcm1pbmEvdHJhbnNsYXRpb25zL2NhdHVsbHVzLmpzIiwic3JjL2pzL21vZHVsZXMvYXBwLmpzIiwic3JjL2pzL21vZHVsZXMvYXBwZGF0YS5qcyIsInNyYy9qcy9tb2R1bGVzL2RvbS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDejBCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNubEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyNUhBOztBQUVBLElBQU0sTUFBTSxRQUFRLGVBQVIsQ0FBWjtBQUNBLElBQUksV0FBVyxRQUFRLDRCQUFSLENBQWY7QUFDQSxJQUFJLFVBQVUsUUFBUSxtQkFBUixDQUFkOztBQUVBLFFBQVEsUUFBUixHQUFtQixTQUFTLFFBQTVCO0FBQ0EsUUFBUSxlQUFSLEdBQTBCLFNBQVMsZUFBbkM7QUFDQSxRQUFRLFdBQVIsR0FBc0IsU0FBUyxXQUEvQjtBQUNBLFFBQVEsZ0JBQVIsR0FBMkIsU0FBUyxlQUFULENBQXlCLE1BQXBEO0FBQ0EsUUFBUSxVQUFSLEdBQXFCLFNBQVMsV0FBVCxDQUFxQixNQUExQztBQUNBLFFBQVEsV0FBUixHQUFzQixTQUFTLFdBQS9CO0FBQ0EsUUFBUSxRQUFSLEdBQW1CLFNBQVMsUUFBNUI7QUFDQSxRQUFRLFNBQVIsR0FBb0IsU0FBUyxTQUE3QjtBQUNBLFFBQVEsVUFBUixHQUFxQixTQUFTLFVBQTlCO0FBQ0EsUUFBUSxjQUFSLEdBQXlCLFNBQVMsY0FBbEM7QUFDQSxRQUFRLFVBQVIsR0FBcUIsU0FBUyxVQUE5Qjs7QUFFQSxLQUFJLElBQUksQ0FBUixJQUFhLFFBQVEsUUFBckIsRUFBK0I7QUFDOUIsTUFBSSxJQUFJLENBQVIsSUFBYSxRQUFRLGVBQXJCLEVBQXNDO0FBQ3JDLE1BQUcsUUFBUSxlQUFSLENBQXdCLENBQXhCLEVBQTJCLGFBQTNCLElBQTRDLFFBQVEsUUFBUixDQUFpQixDQUFqQixFQUFvQixhQUFuRSxFQUFrRjtBQUNqRixXQUFRLGVBQVIsQ0FBd0IsQ0FBeEIsRUFBMkIsUUFBM0IsR0FBc0MsUUFBUSxRQUFSLENBQWlCLENBQWpCLEVBQW9CLFFBQTFEO0FBQ0EsV0FBUSxlQUFSLENBQXdCLENBQXhCLEVBQTJCLE1BQTNCLEdBQW9DLFFBQVEsUUFBUixDQUFpQixDQUFqQixFQUFvQixNQUF4RDtBQUNBLFdBQVEsZUFBUixDQUF3QixDQUF4QixFQUEyQixLQUEzQixHQUFtQyxRQUFRLFFBQVIsQ0FBaUIsQ0FBakIsRUFBb0IsS0FBdkQ7QUFDQSxXQUFRLGVBQVIsQ0FBd0IsQ0FBeEIsRUFBMkIsV0FBM0IsR0FBeUMsUUFBUSxRQUFSLENBQWlCLENBQWpCLEVBQW9CLFdBQTdEO0FBQ0EsV0FBUSxlQUFSLENBQXdCLENBQXhCLEVBQTJCLG9CQUEzQixHQUFrRCxRQUFRLFFBQVIsQ0FBaUIsQ0FBakIsRUFBb0Isb0JBQXRFO0FBQ0EsV0FBUSxlQUFSLENBQXdCLENBQXhCLEVBQTJCLG1CQUEzQixHQUFpRCxRQUFRLFFBQVIsQ0FBaUIsQ0FBakIsRUFBb0IsbUJBQXJFO0FBQ0EsV0FBUSxlQUFSLENBQXdCLENBQXhCLEVBQTJCLGdCQUEzQixHQUE4QyxRQUFRLFFBQVIsQ0FBaUIsQ0FBakIsRUFBb0IsZ0JBQWxFO0FBQ0EsV0FBUSxlQUFSLENBQXdCLENBQXhCLEVBQTJCLE1BQTNCLEdBQW9DLFFBQVEsUUFBUixDQUFpQixDQUFqQixFQUFvQixNQUF4RDtBQUNBO0FBQ0Q7QUFDRDs7QUFFRCxJQUFJLFVBQUo7Ozs7O0FDakNBOztBQUVBLE9BQU8sT0FBUCxHQUFpQjs7QUFFaEIsV0FBVSxpQkFGTTtBQUdoQixZQUFXLGFBSEs7QUFJaEIsYUFBWSx5QkFKSTtBQUtoQiw2Q0FMZ0I7QUFNaEIsaUJBQWdCLENBQUU7QUFDakIsdUJBRGUsQ0FOQTtBQVNoQixhQUFhO0FBQ1osNEJBVmU7O0FBYWhCLGNBQWEsQ0FBRTtBQUNkLGFBRFksRUFDQyxHQURELEVBQ0ssSUFETCxFQUNVLEtBRFYsRUFDZ0IsTUFEaEIsRUFDdUIsR0FEdkIsRUFDMkIsSUFEM0IsRUFDZ0MsS0FEaEMsRUFDc0MsTUFEdEMsRUFDNkMsT0FEN0MsRUFDcUQsR0FEckQsQ0FDd0Q7QUFEeEQsRUFiRzs7QUFpQmhCLGtCQUFpQixDQUFFO0FBQ2xCLEdBQUMsaUJBQWdCLFVBQWpCO0FBQ0MsV0FBUSxDQURULEVBRGdCLEVBR2hCLEVBQUMsaUJBQWdCLHNCQUFqQjtBQUNDLFdBQVEsQ0FEVCxFQUhnQixFQUtoQixFQUFDLGlCQUFnQixxQkFBakI7QUFDQyxXQUFRLENBRFQsRUFMZ0IsQ0FqQkQ7O0FBMEJoQixXQUFVLENBQUU7QUFDWCxTQUFRLHlCQUFSLENBRFMsRUFFVCxRQUFRLHFDQUFSLENBRlMsRUFHVCxRQUFRLG9DQUFSLENBSFM7QUExQk0sQ0FBakI7OztBQ0ZBOztBQUVBOztBQUVBLE9BQU8sT0FBUCxHQUFpQjtBQUNoQixXQUFVLGlCQURNO0FBRWhCLFNBQVEseUJBRlE7QUFHaEIsZ0JBQWMsc0JBSEU7QUFJaEIsUUFBTyxhQUpTO0FBS2hCLGNBQWEsSUFMRztBQU1oQixtR0FOZ0I7QUFPaEIsdUJBQXFCLHVCQVBMO0FBUWhCLHNCQUFvQiw0Q0FSSjtBQVNoQixtQkFBaUIsUUFURDtBQVVoQixPQUFLO0FBVlcsQ0FBakI7OztBQ0pBOztBQUVBOztBQUVBLE9BQU8sT0FBUCxHQUFpQjtBQUNoQixXQUFVLGlCQURNO0FBRWhCLFNBQVEseUJBRlE7QUFHaEIsZ0JBQWMscUJBSEU7QUFJaEIsUUFBTyxhQUpTO0FBS2hCLGNBQWEsSUFMRztBQU1oQixtR0FOZ0I7QUFPaEIsdUJBQXFCLHVCQVBMO0FBUWhCLHNCQUFvQiw0Q0FSSjtBQVNoQixtQkFBaUIsT0FURDtBQVVoQixPQUFLO0FBVlcsQ0FBakI7OztBQ0pBOztBQUVBOztBQUVBLE9BQU8sT0FBUCxHQUFpQjtBQUNoQixhQUFVLGlCQURNO0FBRWhCLFdBQVEseUJBRlE7QUFHaEIsa0JBQWMsVUFIRTtBQUloQixVQUFPLGFBSlM7QUFLaEIsZ0JBQWEsS0FMRztBQU1oQixxR0FOZ0I7QUFPaEIseUJBQXFCLFVBUEw7QUFRaEIsd0JBQW9CLHlCQVJKO0FBU2hCLHFCQUFpQixRQVREO0FBVWhCLFNBQUs7QUFWVyxDQUFqQjs7O0FDSkE7O0FBRUE7O0FBRUEsSUFBTSxTQUFTLFFBQVEsVUFBUixDQUFmO0FBQ0EsSUFBTSxZQUFZLFFBQVEsV0FBUixDQUFsQjtBQUNBLElBQU0sV0FBVyxRQUFRLGtCQUFSLENBQWpCOztBQUVBLElBQU0sTUFBTSxRQUFRLE9BQVIsQ0FBWjtBQUNBLElBQUksT0FBTyxRQUFRLFdBQVIsQ0FBWDs7QUFFQSxJQUFJLE1BQU07QUFDVCxVQUFTO0FBQ1IsdUJBQXFCLDZCQUFTLE9BQVQsRUFBa0I7QUFDdEMsUUFBSSxJQUFJLElBQUksQ0FBWixFQUFlLElBQUksS0FBSyxlQUFMLENBQXFCLE1BQXhDLEVBQWdELEdBQWhELEVBQXFEO0FBQ3BELFFBQUcsV0FBVyxLQUFLLGVBQUwsQ0FBcUIsQ0FBckIsRUFBd0IsYUFBdEMsRUFBcUQ7QUFDcEQsWUFBTyxDQUFQO0FBQ0E7QUFDRDtBQUNELEdBUE87QUFRUixXQUFTLGlCQUFTLE1BQVQsRUFBaUI7O0FBRXpCOztBQUVBLFVBQU8sS0FBSyxJQUFMLENBQVUsS0FBVixDQUFnQixVQUFoQixHQUE2QixLQUFLLEtBQUwsQ0FBVyxTQUFTLEtBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsVUFBcEMsQ0FBcEM7QUFFQSxHQWRPO0FBZVIsYUFBVyxtQkFBUyxnQkFBVCxFQUEyQjtBQUNyQyxPQUFHLEtBQUssc0JBQUwsQ0FBNEIsTUFBNUIsR0FBcUMsQ0FBeEMsRUFBMkM7QUFDMUMsUUFBSSxLQUFLLHNCQUFMLENBQTRCLE9BQTVCLENBQW9DLGdCQUFwQyxJQUF3RCxDQUF6RCxJQUErRCxLQUFLLHNCQUFMLENBQTRCLE1BQTlGLEVBQXVHO0FBQ3RHLFlBQU8sS0FBSyxzQkFBTCxDQUE0QixDQUE1QixDQUFQO0FBQ0EsS0FGRCxNQUVPO0FBQ04sWUFBTyxLQUFLLHNCQUFMLENBQTZCLEtBQUssc0JBQUwsQ0FBNEIsT0FBNUIsQ0FBb0MsZ0JBQXBDLElBQXdELENBQXJGLENBQVA7QUFDQTtBQUNELElBTkQsTUFNTztBQUNOLFdBQU8sZ0JBQVA7QUFDQTtBQUNELEdBekJPO0FBMEJSLGFBQVcsbUJBQVMsZ0JBQVQsRUFBMkI7QUFDckMsT0FBRyxLQUFLLHNCQUFMLENBQTRCLE1BQTVCLEdBQXFDLENBQXhDLEVBQTJDO0FBQzFDLFFBQUcsS0FBSyxzQkFBTCxDQUE0QixPQUE1QixDQUFvQyxnQkFBcEMsS0FBeUQsQ0FBNUQsRUFBK0Q7QUFDOUQsWUFBTyxLQUFLLHNCQUFMLENBQTRCLEtBQUssc0JBQUwsQ0FBNEIsTUFBNUIsR0FBcUMsQ0FBakUsQ0FBUDtBQUNBLEtBRkQsTUFFTztBQUNOLFlBQU8sS0FBSyxzQkFBTCxDQUE2QixLQUFLLHNCQUFMLENBQTRCLE9BQTVCLENBQW9DLGdCQUFwQyxJQUF3RCxDQUFyRixDQUFQO0FBQ0E7QUFDRCxJQU5ELE1BTU87QUFDTixXQUFPLGdCQUFQO0FBQ0E7QUFDRCxHQXBDTztBQXFDUixjQUFZLG9CQUFTLFFBQVQsRUFBbUI7QUFDOUIsT0FBTSxPQUFPLFNBQVMsZ0JBQVQsQ0FBMEIsU0FBMUIsQ0FBYjtBQUNBLE9BQUksR0FBSixFQUFTLE9BQVQsRUFBa0IsWUFBbEI7QUFDQSxPQUFJLFdBQVcsQ0FBZjs7QUFFQSxPQUFHLElBQUksUUFBSixDQUFhLFNBQVMsSUFBdEIsRUFBMkIsUUFBM0IsQ0FBSCxFQUF5Qzs7QUFFeEM7O0FBRUEsYUFBUyxJQUFULENBQWMsS0FBZCxDQUFvQixXQUFwQixHQUFrQyxDQUFsQztBQUNBLFNBQUksSUFBSSxJQUFFLENBQVYsRUFBYSxJQUFFLEtBQUssTUFBcEIsRUFBNEIsR0FBNUIsRUFBaUM7QUFDaEMsV0FBTSxLQUFLLENBQUwsQ0FBTjtBQUNBLFNBQUksS0FBSixDQUFVLE9BQVYsR0FBb0IsY0FBcEI7QUFDQSxTQUFHLElBQUksV0FBSixHQUFrQixRQUFyQixFQUErQjtBQUM5QixpQkFBVyxJQUFJLFdBQUosR0FBa0IsRUFBN0I7QUFDQTtBQUNELFNBQUksS0FBSixDQUFVLE9BQVYsR0FBb0IsT0FBcEI7QUFDQTs7QUFFRCxZQUFRLEdBQVIsQ0FBWSxtQkFBbUIsU0FBUyxLQUF4QztBQUNBLFlBQVEsR0FBUixDQUFZLGtCQUFrQixRQUE5Qjs7QUFFQSxhQUFTLElBQVQsQ0FBYyxLQUFkLENBQW9CLFdBQXBCLEdBQWtDLENBQUMsU0FBUyxLQUFULEdBQWlCLFFBQWxCLElBQTRCLENBQTVCLEdBQThCLElBQWhFO0FBQ0EsYUFBUyxJQUFULENBQWMsS0FBZCxDQUFvQixZQUFwQixHQUFtQyxDQUFDLFNBQVMsS0FBVCxHQUFpQixRQUFsQixJQUE0QixDQUE1QixHQUE4QixJQUFqRTtBQUNBLElBbkJELE1BbUJPOztBQUVOOztBQUVBLG1CQUFlLEVBQWYsQ0FKTSxDQUlhOztBQUVuQixZQUFRLEdBQVIsQ0FBWSxtQkFBbUIsU0FBUyxLQUF4QztBQUNBLFlBQVEsR0FBUixDQUFZLHNCQUFzQixZQUFsQztBQUNBLFlBQVEsR0FBUixDQUFZLG1CQUFtQixTQUFTLFVBQXhDOztBQUVBO0FBQ0E7O0FBRUEsY0FBVSxDQUFDLE1BQU0sWUFBUCxJQUFxQixDQUEvQjtBQUNBOzs7Ozs7QUFNQSxhQUFTLElBQVQsQ0FBYyxLQUFkLENBQW9CLFdBQXBCLEdBQWtDLFVBQVEsSUFBMUM7QUFDQSxhQUFTLElBQVQsQ0FBYyxLQUFkLENBQW9CLFlBQXBCLEdBQW1DLFVBQVEsSUFBM0M7QUFDQTtBQUNBO0FBRUQsR0F0Rk87QUF1RlIsd0JBQXNCLDhCQUFTLFFBQVQsRUFBbUI7QUFDeEMsT0FBTSxPQUFPLFNBQVMsZ0JBQVQsT0FBOEIsU0FBUyxNQUFULENBQWdCLEVBQTlDLG1CQUFiO0FBQ0EsT0FBSSxHQUFKO0FBQ0EsT0FBSSxXQUFXLENBQWY7O0FBRUEsT0FBRyxJQUFJLFFBQUosQ0FBYSxTQUFTLElBQXRCLEVBQTJCLFFBQTNCLENBQUgsRUFBeUM7O0FBRXhDOztBQUVBLGFBQVMsSUFBVCxDQUFjLEtBQWQsQ0FBb0IsV0FBcEIsR0FBa0MsQ0FBbEM7QUFDQSxhQUFTLElBQVQsQ0FBYyxLQUFkLENBQW9CLFlBQXBCLEdBQW1DLENBQW5DO0FBQ0EsYUFBUyxVQUFULENBQW9CLEtBQXBCLENBQTBCLFVBQTFCLEdBQXVDLENBQXZDO0FBQ0EsYUFBUyxVQUFULENBQW9CLEtBQXBCLENBQTBCLFdBQTFCLEdBQXdDLENBQXhDO0FBQ0EsYUFBUyxVQUFULENBQW9CLEtBQXBCLENBQTBCLFdBQTFCLEdBQXdDLENBQXhDO0FBQ0EsYUFBUyxVQUFULENBQW9CLEtBQXBCLENBQTBCLFlBQTFCLEdBQXlDLENBQXpDO0FBQ0EsU0FBSSxJQUFJLElBQUUsQ0FBVixFQUFhLElBQUUsS0FBSyxNQUFwQixFQUE0QixHQUE1QixFQUFpQztBQUNoQyxXQUFNLEtBQUssQ0FBTCxDQUFOO0FBQ0EsU0FBSSxLQUFKLENBQVUsT0FBVixHQUFvQixjQUFwQjs7QUFFQTs7QUFFQSxTQUFHLElBQUksV0FBSixHQUFrQixRQUFyQixFQUErQjtBQUM5QixpQkFBVyxJQUFJLFdBQUosR0FBa0IsRUFBN0I7QUFDQTtBQUNELFNBQUksS0FBSixDQUFVLE9BQVYsR0FBb0IsT0FBcEI7QUFDQTs7QUFHRCxRQUFJLFNBQVMsS0FBVCxHQUFnQixFQUFqQixHQUF3QixRQUEzQixFQUFxQztBQUNwQyxhQUFRLEdBQVIsa0JBQTJCLFNBQVMsS0FBcEMsMEJBQThELFFBQTlELDhCQUErRixDQUFDLFNBQVMsS0FBVCxHQUFpQixRQUFqQixHQUEwQixFQUExQixHQUE2QixFQUE5QixJQUFrQyxDQUFqSTtBQUNBLGNBQVMsSUFBVCxDQUFjLEtBQWQsQ0FBb0IsV0FBcEIsR0FBa0MsQ0FBbEM7QUFDQSxjQUFTLElBQVQsQ0FBYyxLQUFkLENBQW9CLFlBQXBCLEdBQW1DLENBQW5DO0FBQ0EsY0FBUyxVQUFULENBQW9CLEtBQXBCLENBQTBCLFdBQTFCLEdBQXdDLENBQXhDO0FBQ0EsY0FBUyxVQUFULENBQW9CLEtBQXBCLENBQTBCLFlBQTFCLEdBQXlDLENBQXpDO0FBQ0EsY0FBUyxVQUFULENBQW9CLEtBQXBCLENBQTBCLFVBQTFCLEdBQXVDLENBQUMsU0FBUyxLQUFULEdBQWlCLFFBQWpCLEdBQTRCLEVBQTVCLEdBQWlDLEVBQWxDLElBQXNDLENBQXRDLEdBQXdDLElBQS9FO0FBQ0EsY0FBUyxVQUFULENBQW9CLEtBQXBCLENBQTBCLFdBQTFCLEdBQXdDLENBQUMsU0FBUyxLQUFULEdBQWlCLFFBQWpCLEdBQTBCLEVBQTFCLEdBQStCLEVBQWhDLElBQW9DLENBQXBDLEdBQXNDLElBQTlFO0FBQ0EsS0FSRCxNQVFPO0FBQ04sYUFBUSxHQUFSLDRCQUFxQyxTQUFTLEtBQTlDLDBCQUF3RSxRQUF4RTtBQUNBLGNBQVMsSUFBVCxDQUFjLEtBQWQsQ0FBb0IsV0FBcEIsR0FBa0MsSUFBRSxJQUFwQztBQUNBLGNBQVMsSUFBVCxDQUFjLEtBQWQsQ0FBb0IsWUFBcEIsR0FBbUMsSUFBRSxJQUFyQztBQUNBLGNBQVMsVUFBVCxDQUFvQixLQUFwQixDQUEwQixVQUExQixHQUF1QyxDQUF2QztBQUNBLGNBQVMsVUFBVCxDQUFvQixLQUFwQixDQUEwQixXQUExQixHQUF3QyxDQUF4QztBQUNBO0FBQ0QsSUF0Q0QsTUFzQ087QUFDTixZQUFRLEdBQVIsQ0FBWSw0QkFBWjtBQUNBO0FBQ0QsR0FySU87QUFzSVIsd0JBQXNCLGdDQUFXO0FBQ2hDLFlBQVMsYUFBVCxDQUF1Qix3QkFBdkIsRUFBaUQsUUFBakQsR0FBNEQsWUFBVztBQUN0RSxRQUFJLGFBQWEsS0FBSyxTQUFMLEdBQWlCLEtBQUssWUFBdEIsR0FBcUMsU0FBUyxhQUFULENBQXVCLHlCQUF2QixFQUFrRCxZQUF4RztBQUNBLGFBQVMsYUFBVCxDQUF1Qix5QkFBdkIsRUFBa0QsU0FBbEQsR0FBOEQsVUFBOUQ7QUFDQSxJQUhEO0FBSUEsWUFBUyxhQUFULENBQXVCLHlCQUF2QixFQUFrRCxRQUFsRCxHQUE2RCxZQUFXO0FBQ3ZFLFFBQUksYUFBYSxLQUFLLFNBQUwsR0FBaUIsS0FBSyxZQUF0QixHQUFxQyxTQUFTLGFBQVQsQ0FBdUIsd0JBQXZCLEVBQWlELFlBQXZHO0FBQ0EsYUFBUyxhQUFULENBQXVCLHdCQUF2QixFQUFpRCxTQUFqRCxHQUE2RCxVQUE3RDtBQUNBLElBSEQ7QUFJQSxHQS9JTztBQWdKUixjQUFZLHNCQUFXO0FBQ3RCLE9BQUksT0FBTyxFQUFYO0FBQ0E7QUFDQSxPQUFJLFFBQVEsT0FBTyxRQUFQLENBQWdCLElBQWhCLENBQXFCLE9BQXJCLENBQTZCLHlCQUE3QixFQUF3RCxVQUFTLENBQVQsRUFBVyxHQUFYLEVBQWUsS0FBZixFQUFzQjtBQUN6RixTQUFLLEdBQUwsSUFBWSxLQUFaO0FBQ0EsSUFGVyxDQUFaO0FBR0E7QUFDQSxVQUFPLElBQVA7QUFDQTtBQXhKTyxFQURBO0FBMkpULFFBQU87QUFDTixTQUFPLGlCQUFXO0FBQ2pCLE9BQUksUUFBUSxDQUFaO0FBQ0EsT0FBSSxRQUFRLFNBQVMsZ0JBQVQsQ0FBMEIsT0FBMUIsQ0FBWjs7QUFFQSxRQUFJLElBQUksSUFBSSxDQUFaLEVBQWUsSUFBSSxNQUFNLE1BQXpCLEVBQWlDLEdBQWpDLEVBQXNDO0FBQ3JDLFFBQUksV0FBVyxNQUFNLENBQU4sRUFBUyxRQUF4QjtBQUNBLFNBQUksSUFBSSxJQUFFLENBQVYsRUFBYSxJQUFJLFNBQVMsTUFBMUIsRUFBa0MsR0FBbEMsRUFBdUM7QUFDdEMsU0FBRyxJQUFJLFFBQUosQ0FBYSxTQUFTLENBQVQsQ0FBYixFQUF5QixVQUF6QixDQUFILEVBQXlDO0FBQ3hDLGVBQVMsQ0FBVCxFQUFZLFlBQVosQ0FBeUIsaUJBQXpCLEVBQTRDLEtBQTVDO0FBQ0E7QUFDRCxTQUFHLElBQUksUUFBSixDQUFhLFNBQVMsQ0FBVCxDQUFiLEVBQXlCLFFBQXpCLENBQUgsRUFBdUM7QUFDdEMsZUFBUyxDQUFULEVBQVksWUFBWixDQUF5QixpQkFBekIsRUFBNEMsS0FBNUM7QUFDQSxVQUFJLEtBQUosQ0FBVSxXQUFWLENBQXNCLFNBQVMsQ0FBVCxDQUF0QjtBQUNBO0FBQ0Q7QUFDRDtBQUNBO0FBQ0QsR0FsQks7QUFtQk4sZUFBYSxxQkFBUyxFQUFULEVBQWE7QUFDekIsTUFBRyxPQUFILEdBQWEsVUFBUyxDQUFULEVBQVk7QUFDeEIsTUFBRSxlQUFGOztBQUVBLFFBQUksV0FBVyxLQUFLLFlBQUwsQ0FBa0IsaUJBQWxCLENBQWY7QUFDQSxRQUFJLFdBQVcsU0FBUyxhQUFULGtDQUFxRCxRQUFyRCxVQUFtRSxTQUFsRjtBQUNBLFFBQUksS0FBSixDQUFVLElBQVY7QUFDQSxRQUFJLFNBQVMsSUFBSSxNQUFKLGdFQUNULFFBRFMsd0JBQWI7QUFHQSxTQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CLFdBQW5CLENBQStCLE1BQS9CO0FBQ0EsYUFBUyxjQUFULENBQXdCLFlBQXhCLEVBQXNDLE9BQXRDLEdBQWdELFlBQU07QUFDckQsU0FBSSxLQUFKLENBQVUsSUFBVjtBQUNBLEtBRkQ7QUFHQSxJQWJEO0FBY0EsR0FsQ0s7QUFtQ04sUUFBTSxnQkFBVztBQUNoQixPQUFJLGdCQUFKLENBQXFCLGFBQXJCO0FBQ0E7QUFyQ0ssRUEzSkU7QUFrTVQsV0FBVTtBQUNULGNBQVksb0JBQVMsT0FBVCxFQUFrQjs7QUFFN0I7O0FBRUEsV0FBUSxPQUFSLEdBQWtCLFlBQU07QUFDdkIsUUFBSSxPQUFKLENBQVksVUFBWjtBQUNBLElBRkQ7QUFHQSxHQVJRO0FBU1QsY0FBWSxvQkFBUyxFQUFULEVBQWE7QUFDeEIsTUFBRyxPQUFILEdBQWEsWUFBVztBQUN2QixRQUFJLFFBQUosQ0FBYSxpQkFBYixDQUErQixLQUFLLEVBQUwsQ0FBUSxPQUFSLENBQWdCLFFBQWhCLEVBQXlCLEVBQXpCLENBQS9CLEVBQTRELFNBQVMsY0FBVCxDQUF3QixLQUFLLEVBQTdCLEVBQWlDLE9BQTdGO0FBQ0EsSUFGRDtBQUdBLEdBYlE7QUFjVCxrQkFBZ0Isd0JBQVMsRUFBVCxFQUFhO0FBQzVCLE1BQUcsT0FBSCxHQUFhLFlBQVc7QUFDdkIsYUFBUyxjQUFULFlBQWlDLEtBQUssRUFBdEMsRUFBNEMsT0FBNUMsR0FBc0QsQ0FBQyxTQUFTLGNBQVQsWUFBaUMsS0FBSyxFQUF0QyxFQUE0QyxPQUFuRztBQUNBLFFBQUksUUFBSixDQUFhLGlCQUFiLENBQStCLEtBQUssRUFBcEMsRUFBdUMsU0FBUyxjQUFULFlBQWlDLEtBQUssRUFBdEMsRUFBNEMsT0FBbkY7QUFDQSxJQUhEO0FBSUEsR0FuQlE7QUFvQlQscUJBQW1CLDJCQUFTLE1BQVQsRUFBaUIsS0FBakIsRUFBd0I7QUFDMUMsUUFBSSxJQUFJLENBQVIsSUFBYSxLQUFLLGVBQWxCLEVBQW1DO0FBQ2xDLFFBQUcsVUFBVSxLQUFLLGVBQUwsQ0FBcUIsQ0FBckIsRUFBd0IsYUFBckMsRUFBb0Q7QUFDbkQsU0FBRyxLQUFILEVBQVU7QUFDVCxXQUFLLHNCQUFMLENBQTRCLElBQTVCLENBQWlDLE1BQWpDO0FBQ0EsV0FBSyxnQkFBTDtBQUNBLE1BSEQsTUFHTztBQUNOLFVBQUcsS0FBSyxnQkFBTCxHQUF3QixDQUEzQixFQUE4QjtBQUM3QixXQUFJLElBQUksS0FBSyxzQkFBTCxDQUE0QixPQUE1QixDQUFvQyxNQUFwQyxDQUFSO0FBQ0EsV0FBSSxJQUFJLENBQUMsQ0FBVCxFQUFZO0FBQ1gsYUFBSyxzQkFBTCxDQUE0QixNQUE1QixDQUFtQyxDQUFuQyxFQUFzQyxDQUF0QztBQUNBO0FBQ0QsWUFBSyxnQkFBTDtBQUNBLE9BTkQsTUFNTztBQUNOO0FBQ0EsZ0JBQVMsY0FBVCxDQUF3QixXQUFTLE9BQU8sV0FBUCxFQUFqQyxFQUF1RCxPQUF2RCxHQUFpRSxJQUFqRTtBQUNBO0FBQ0Q7QUFDRDtBQUNELFFBQUksU0FBSixDQUFjLElBQWQ7QUFDQTs7QUFFRCxPQUFJLFVBQVUsRUFBZDtBQUNBLFFBQUksSUFBSSxFQUFSLElBQWEsS0FBSyxlQUFsQixFQUFtQztBQUNsQyxRQUFHLEtBQUssc0JBQUwsQ0FBNEIsT0FBNUIsQ0FBb0MsS0FBSyxlQUFMLENBQXFCLEVBQXJCLEVBQXdCLGFBQTVELElBQTZFLENBQUMsQ0FBakYsRUFBb0Y7QUFDbkYsYUFBUSxJQUFSLENBQWEsS0FBSyxlQUFMLENBQXFCLEVBQXJCLEVBQXdCLGFBQXJDO0FBQ0E7QUFDRDtBQUNELFFBQUssc0JBQUwsR0FBOEIsUUFBUSxLQUFSLEVBQTlCOztBQUVBLE9BQUcsS0FBSyxzQkFBTCxDQUE0QixPQUE1QixDQUFvQyxLQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLFdBQXBELElBQW1FLENBQXRFLEVBQXlFO0FBQ3hFLFNBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsV0FBaEIsR0FBOEIsS0FBSyxzQkFBTCxDQUE0QixDQUE1QixDQUE5QjtBQUNBOztBQUVELE9BQUksUUFBSixDQUFhLE1BQWI7QUFDQSxHQXZEUTtBQXdEVCxVQUFRLGtCQUFXO0FBQUU7O0FBRXBCOztBQUVBLE9BQUksZ0JBQUosQ0FBcUIsaUJBQXJCO0FBQ0EsT0FBSSxTQUFTLElBQUksTUFBSixDQUFXLCtCQUFYLENBQWI7QUFDQSxZQUFTLGNBQVQsQ0FBd0IsbUJBQXhCLEVBQTZDLFdBQTdDLENBQXlELE1BQXpEO0FBQ0EsT0FBTSxpQkFBaUIsU0FBUyxhQUFULENBQXVCLGlCQUF2QixDQUF2QjtBQUNBLFFBQUksSUFBSSxDQUFSLElBQWEsS0FBSyxlQUFsQixFQUFtQztBQUNsQyxhQUFTLElBQUksTUFBSiw0REFDNEIsS0FBSyxlQUFMLENBQXFCLENBQXJCLEVBQXdCLGFBRHBELHdDQUVPLEtBQUssZUFBTCxDQUFxQixDQUFyQixFQUF3QixhQUYvQixnQkFFcUQsS0FBSyxlQUFMLENBQXFCLENBQXJCLEVBQXdCLGFBRjdFLHNDQUUwSCxLQUFLLGVBQUwsQ0FBcUIsQ0FBckIsRUFBd0IsbUJBRmxKLCtCQUFUO0FBSUEsbUJBQWUsV0FBZixDQUEyQixNQUEzQjtBQUNBLGFBQVMsY0FBVCxDQUF3QixXQUFTLEtBQUssZUFBTCxDQUFxQixDQUFyQixFQUF3QixhQUF6RCxFQUF3RSxPQUF4RSxHQUFtRixLQUFLLHNCQUFMLENBQTRCLE9BQTVCLENBQW9DLEtBQUssZUFBTCxDQUFxQixDQUFyQixFQUF3QixhQUE1RCxJQUE2RSxDQUFDLENBQWpLO0FBQ0E7O0FBRUQsT0FBSSxnQkFBZ0IsU0FBUyxnQkFBVCxDQUEwQixzQ0FBMUIsQ0FBcEI7QUFDQSxRQUFJLElBQUksTUFBSSxDQUFaLEVBQWUsTUFBSSxjQUFjLE1BQWpDLEVBQXlDLEtBQXpDLEVBQThDO0FBQzdDLFFBQUksUUFBSixDQUFhLFVBQWIsQ0FBd0IsY0FBYyxHQUFkLENBQXhCO0FBQ0E7QUFDRCxPQUFJLHNCQUFzQixTQUFTLGdCQUFULENBQTBCLHVCQUExQixDQUExQjtBQUNBLFFBQUksSUFBSSxNQUFJLENBQVosRUFBZSxNQUFJLG9CQUFvQixNQUF2QyxFQUErQyxLQUEvQyxFQUFvRDtBQUNuRCxRQUFJLFFBQUosQ0FBYSxjQUFiLENBQTRCLG9CQUFvQixHQUFwQixDQUE1QjtBQUNBOztBQUVEOztBQUVBLE9BQUksZ0JBQUosQ0FBcUIsWUFBckI7QUFDQSxZQUFTLElBQUksTUFBSixtT0FBVDtBQUtBLFlBQVMsY0FBVCxDQUF3QixlQUF4QixFQUF5QyxXQUF6QyxDQUFxRCxNQUFyRDtBQUNBLFFBQUksSUFBSSxNQUFJLENBQVosRUFBZSxNQUFJLEtBQUssVUFBeEIsRUFBb0MsS0FBcEMsRUFBeUM7QUFDeEMsYUFBUyxJQUFJLE1BQUosd0JBQStCLEdBQS9CLFlBQXVDLEtBQUssS0FBTCxJQUFjLEdBQWYsR0FBb0IsVUFBcEIsR0FBaUMsRUFBdkUsVUFBOEUsS0FBSyxXQUFMLENBQWlCLEdBQWpCLENBQTlFLGVBQVQ7QUFDQSxhQUFTLGNBQVQsQ0FBd0IsYUFBeEIsRUFBdUMsV0FBdkMsQ0FBbUQsTUFBbkQ7QUFDQTtBQUNELFFBQUksSUFBSSxHQUFSLElBQWEsS0FBSyxzQkFBbEIsRUFBMEM7QUFDekMsU0FBSSxJQUFJLElBQUksQ0FBWixFQUFlLElBQUksS0FBSyxlQUFMLENBQXFCLE1BQXhDLEVBQWdELEdBQWhELEVBQXFEO0FBQ3BELFNBQUcsS0FBSyxlQUFMLENBQXFCLENBQXJCLEVBQXdCLGFBQXhCLElBQXlDLEtBQUssc0JBQUwsQ0FBNEIsR0FBNUIsQ0FBNUMsRUFBNEU7QUFDM0UsZUFBUyxJQUFJLE1BQUosc0JBQTZCLEtBQUssZUFBTCxDQUFxQixDQUFyQixFQUF3QixhQUFyRCxZQUF5RSxLQUFLLHNCQUFMLENBQTRCLE9BQTVCLENBQW9DLEtBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsV0FBcEQsS0FBb0UsR0FBckUsR0FBMEUsVUFBMUUsR0FBdUYsRUFBL0osVUFBc0ssS0FBSyxlQUFMLENBQXFCLENBQXJCLEVBQXdCLG1CQUE5TCxlQUFUO0FBQ0EsZUFBUyxjQUFULENBQXdCLGtCQUF4QixFQUE0QyxXQUE1QyxDQUF3RCxNQUF4RDtBQUNBO0FBQ0Q7QUFDRDs7QUFFRCxZQUFTLGFBQVQsQ0FBdUIsV0FBdkIsRUFBb0MsT0FBcEMsR0FBOEMsWUFBTTtBQUNuRCxRQUFJLFdBQVcsU0FBUyxjQUFULENBQXdCLGtCQUF4QixDQUFmO0FBQ0EsUUFBSSxZQUFZLFNBQVMsT0FBVCxDQUFpQixTQUFTLGFBQTFCLEVBQXlDLEVBQXpDLENBQTRDLE1BQTVDLENBQW1ELENBQW5ELENBQWhCO0FBQ0EsZUFBVyxTQUFTLGNBQVQsQ0FBd0IsYUFBeEIsQ0FBWDtBQUNBLFFBQUksWUFBWSxTQUFTLE9BQVQsQ0FBaUIsU0FBUyxhQUExQixFQUF5QyxFQUF6QyxDQUE0QyxNQUE1QyxDQUFtRCxDQUFuRCxDQUFoQjtBQUNBLFNBQUksSUFBSSxLQUFJLENBQVosRUFBZSxLQUFJLEtBQUssZUFBTCxDQUFxQixNQUF4QyxFQUFnRCxJQUFoRCxFQUFxRDtBQUNwRCxTQUFHLEtBQUssc0JBQUwsQ0FBNEIsRUFBNUIsS0FBa0MsU0FBckMsRUFBZ0Q7QUFDL0MsVUFBSSxPQUFKLENBQVksTUFBWjtBQUNBLFVBQUksT0FBSixDQUFZLEtBQUssc0JBQUwsQ0FBNEIsRUFBNUIsQ0FBWixFQUEyQyxTQUEzQyxFQUFxRCxPQUFyRCxFQUE2RCxDQUE3RDtBQUNBO0FBQ0Q7QUFDRCxJQVhEO0FBWUE7QUFwSFEsRUFsTUQ7QUF3VFQsWUFBVztBQUNWLFFBQU0sZ0JBQVc7QUFBRTs7QUFFbEIsT0FBSSxVQUFVLEtBQUssU0FBTCxDQUFlO0FBQzVCLGtCQUFpQixLQUFLLEtBRE07QUFFNUIsdUJBQW9CLEtBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsV0FGUjtBQUc1QixzQkFBbUIsS0FBSyxJQUFMLENBQVUsSUFBVixDQUFlLFdBSE47QUFJNUIsb0JBQWtCLEtBQUssc0JBSks7QUFLNUIsY0FBZSxLQUFLLFlBQUwsQ0FBa0IsUUFMTDtBQU01QixlQUFnQixLQUFLLFlBQUwsQ0FBa0IsU0FOTjtBQU81QixlQUFnQixLQUFLLFlBQUwsQ0FBa0I7QUFQTixJQUFmLENBQWQ7O0FBVUEsT0FBSSxVQUFVLE9BQU8sWUFBckI7QUFDQSxXQUFRLE9BQVIsQ0FBZ0IsS0FBSyxRQUFyQixFQUErQixPQUEvQjs7QUFFQTs7QUFFQSxPQUFJLFFBQVEsU0FBWixFQUF1QjtBQUN0QixRQUFJLFNBQVMsT0FBTyxRQUFQLENBQWdCLE1BQWhCLEdBQXlCLE9BQU8sUUFBUCxDQUFnQixRQUF6QyxnQkFBOEQsS0FBSyxLQUFuRSxlQUFrRixLQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLFdBQWxHLENBQWI7QUFDQSxRQUFHLEtBQUssWUFBTCxDQUFrQixRQUFyQixFQUErQjtBQUM5QiwrQkFBd0IsS0FBSyxJQUFMLENBQVUsSUFBVixDQUFlLFdBQXZDO0FBQ0E7QUFDRCxRQUFJLE9BQU8sUUFBUCxDQUFnQixRQUFoQixLQUE2QixPQUFqQyxFQUEwQztBQUN6QyxZQUFPLE9BQVAsQ0FBZSxTQUFmLENBQXlCLEVBQUMsTUFBSyxNQUFOLEVBQXpCLEVBQXVDLEVBQXZDLEVBQTBDLE1BQTFDO0FBQ0EsS0FGRCxNQUVPO0FBQ04sYUFBUSxHQUFSLENBQVksTUFBWjtBQUNBO0FBQ0Q7QUFDRCxHQTdCUztBQThCVixRQUFNLGdCQUFXOztBQUVoQixPQUFHLElBQUksT0FBSixDQUFZLFVBQVosR0FBeUIsS0FBNUIsRUFBbUM7QUFDbEMsWUFBUSxHQUFSLENBQVksMEJBQVo7QUFDQSxRQUFJLFdBQVUsT0FBTyxZQUFyQjtBQUNBLGFBQVEsVUFBUixDQUFtQixLQUFLLFFBQXhCO0FBQ0E7O0FBRUQsT0FBSSxZQUFZLENBQWhCO0FBQ0EsT0FBSSxZQUFZLEVBQWhCO0FBQ0EsT0FBSSxnQkFBZ0IsRUFBcEI7QUFDQSxPQUFJLGVBQWUsS0FBbkI7QUFDQSxPQUFJLFlBQVksS0FBaEI7QUFDQSxPQUFJLFlBQVksS0FBaEI7O0FBRUE7O0FBRUE7O0FBRUEsT0FBSSxVQUFVLE9BQU8sWUFBckI7QUFDQSxPQUFJLFNBQVMsUUFBUSxPQUFSLENBQWdCLEtBQUssUUFBckIsQ0FBYjs7QUFFQSxPQUFHLFdBQVcsSUFBZCxFQUFvQjtBQUNuQixZQUFRLEdBQVIsQ0FBWSw4QkFBNkIsTUFBekM7QUFDQSxRQUFJLGVBQWUsS0FBSyxLQUFMLENBQVcsTUFBWCxDQUFuQjtBQUNBLFlBQVEsR0FBUixDQUFZLFlBQVo7QUFDQSxTQUFLLFlBQUwsR0FBb0IsYUFBYSxZQUFqQztBQUNBLFNBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsV0FBaEIsR0FBOEIsYUFBYSxpQkFBM0M7QUFDQSxTQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsV0FBZixHQUE2QixhQUFhLGdCQUExQztBQUNBLFNBQUssWUFBTCxDQUFrQixRQUFsQixHQUE2QixhQUFhLFFBQTFDO0FBQ0EsU0FBSyxZQUFMLENBQWtCLFNBQWxCLEdBQThCLGFBQWEsU0FBM0M7QUFDQSxTQUFLLFlBQUwsQ0FBa0IsU0FBbEIsR0FBOEIsYUFBYSxTQUEzQztBQUNBLFNBQUssc0JBQUwsR0FBOEIsYUFBYSxjQUEzQztBQUNBLFFBQUcsS0FBSyxZQUFMLENBQWtCLFFBQXJCLEVBQStCO0FBQzlCLFNBQUksUUFBSixDQUFhLE1BQWIsRUFBb0IsVUFBcEI7QUFDQSxTQUFJLFdBQUosQ0FBZ0IsV0FBaEIsRUFBNEIsS0FBNUI7QUFDQSxTQUFJLFFBQUosQ0FBYSxhQUFiLEVBQTJCLEtBQTNCO0FBQ0EsS0FKRCxNQUlPO0FBQ04sU0FBSSxXQUFKLENBQWdCLE1BQWhCLEVBQXVCLFVBQXZCO0FBQ0EsU0FBSSxRQUFKLENBQWEsV0FBYixFQUF5QixLQUF6QjtBQUNBLFNBQUksV0FBSixDQUFnQixhQUFoQixFQUE4QixLQUE5QjtBQUNBO0FBQ0QsUUFBRyxLQUFLLFlBQUwsQ0FBa0IsU0FBckIsRUFBZ0M7QUFDL0IsU0FBSSxRQUFKLENBQWEsTUFBYixFQUFvQixXQUFwQjtBQUNBLFNBQUksV0FBSixDQUFnQixZQUFoQixFQUE2QixLQUE3QjtBQUNBLFNBQUksUUFBSixDQUFhLFVBQWIsRUFBd0IsS0FBeEI7QUFDQSxLQUpELE1BSU87QUFDTixTQUFJLFdBQUosQ0FBZ0IsTUFBaEIsRUFBdUIsV0FBdkI7QUFDQSxTQUFJLFFBQUosQ0FBYSxZQUFiLEVBQTBCLEtBQTFCO0FBQ0EsU0FBSSxXQUFKLENBQWdCLFVBQWhCLEVBQTJCLEtBQTNCO0FBQ0E7QUFDRCxRQUFHLEtBQUssWUFBTCxDQUFrQixTQUFyQixFQUFnQztBQUMvQixTQUFJLFdBQUosQ0FBZ0IsTUFBaEIsRUFBdUIsV0FBdkI7QUFDQSxTQUFJLFdBQUosQ0FBZ0IsWUFBaEIsRUFBNkIsS0FBN0I7QUFDQSxTQUFJLFFBQUosQ0FBYSxZQUFiLEVBQTBCLEtBQTFCO0FBQ0EsS0FKRCxNQUlPO0FBQ04sU0FBSSxRQUFKLENBQWEsTUFBYixFQUFvQixXQUFwQjtBQUNBLFNBQUksUUFBSixDQUFhLFlBQWIsRUFBMEIsS0FBMUI7QUFDQSxTQUFJLFdBQUosQ0FBZ0IsWUFBaEIsRUFBNkIsS0FBN0I7QUFDQTtBQUNELFFBQUksT0FBSixDQUFZLEtBQUssc0JBQUwsQ0FBNEIsSUFBSSxPQUFKLENBQVksbUJBQVosQ0FBZ0MsS0FBSyxJQUFMLENBQVUsS0FBVixDQUFnQixXQUFoRCxDQUE1QixDQUFaLEVBQXNHLEtBQUssWUFBM0csRUFBd0gsT0FBeEgsRUFBZ0ksQ0FBaEk7QUFDQTs7QUFFRDs7QUFFQSxPQUFHLElBQUksT0FBSixDQUFZLFVBQVosR0FBeUIsS0FBNUIsRUFBbUM7QUFDbEMsZ0JBQVksSUFBSSxPQUFKLENBQVksVUFBWixHQUF5QixLQUFyQztBQUNBLGdCQUFZLElBQVo7QUFDQTtBQUNELE9BQUcsSUFBSSxPQUFKLENBQVksVUFBWixHQUF5QixLQUE1QixFQUFtQztBQUNsQyxnQkFBWSxJQUFJLE9BQUosQ0FBWSxVQUFaLEdBQXlCLEtBQXJDO0FBQ0EsZ0JBQVksSUFBWjtBQUNBO0FBQ0QsT0FBRyxJQUFJLE9BQUosQ0FBWSxVQUFaLEdBQXlCLFNBQTVCLEVBQXVDO0FBQ3RDLG9CQUFnQixJQUFJLE9BQUosQ0FBWSxVQUFaLEdBQXlCLFNBQXpDO0FBQ0EsbUJBQWUsSUFBZjtBQUNBOztBQUVELE9BQUcsYUFBYSxTQUFoQixFQUEyQjtBQUMxQixZQUFRLEdBQVIsQ0FBWSxpQ0FBWjtBQUNBLFFBQUcsWUFBSCxFQUFpQjtBQUNoQixhQUFRLEdBQVIsQ0FBWSw4QkFBWjtBQUNBLFVBQUssWUFBTCxDQUFrQixRQUFsQixHQUE2QixJQUE3QjtBQUNBLFNBQUksUUFBSixDQUFhLE1BQWIsRUFBb0IsVUFBcEI7QUFDQSxTQUFJLFdBQUosQ0FBZ0IsV0FBaEIsRUFBNEIsS0FBNUI7QUFDQSxTQUFJLFFBQUosQ0FBYSxhQUFiLEVBQTJCLEtBQTNCO0FBQ0EsVUFBSyxJQUFMLENBQVUsSUFBVixDQUFlLFdBQWYsR0FBNkIsYUFBN0I7QUFDQTtBQUNELFFBQUksT0FBSixDQUFZLEtBQUssc0JBQUwsQ0FBNEIsSUFBSSxPQUFKLENBQVksbUJBQVosQ0FBZ0MsU0FBaEMsQ0FBNUIsQ0FBWixFQUFvRixTQUFwRixFQUE4RixPQUE5RixFQUFzRyxDQUF0RztBQUNBLElBWEQsTUFXTztBQUNOLFlBQVEsR0FBUixDQUFZLG9DQUFaO0FBQ0E7QUFDRDtBQTFIUyxFQXhURjtBQW9iVCxXQUFVO0FBQ1QsU0FBTyxpQkFBVztBQUNqQixPQUFJLFFBQUosQ0FBYSxNQUFiO0FBQ0EsT0FBSSxRQUFKLENBQWEsUUFBYjtBQUNBLE9BQUksUUFBSixDQUFhLE9BQWI7QUFDQSxPQUFJLFFBQUosQ0FBYSxLQUFiO0FBQ0EsT0FBSSxRQUFKLENBQWEsSUFBYjtBQUNBLEdBUFE7QUFRVCxVQUFRLGtCQUFXO0FBQ2xCO0FBQ0EsWUFBUyxhQUFULENBQXVCLHNCQUF2QixFQUErQyxPQUEvQyxHQUF5RCxZQUFNO0FBQzlELFFBQUksT0FBSixDQUFZLElBQUksT0FBSixDQUFZLFNBQVosQ0FBc0IsS0FBSyxJQUFMLENBQVUsSUFBVixDQUFlLFdBQXJDLENBQVosRUFBOEQsS0FBSyxLQUFuRSxFQUF5RSxNQUF6RTtBQUNBLElBRkQ7QUFHQSxZQUFTLGFBQVQsQ0FBdUIsc0JBQXZCLEVBQStDLE9BQS9DLEdBQXlELFlBQU07QUFDOUQsUUFBSSxPQUFKLENBQVksSUFBSSxPQUFKLENBQVksU0FBWixDQUFzQixLQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsV0FBckMsQ0FBWixFQUE4RCxLQUFLLEtBQW5FLEVBQXlFLE1BQXpFO0FBQ0EsSUFGRDtBQUdBLFlBQVMsYUFBVCxDQUF1QixvQkFBdkIsRUFBNkMsT0FBN0MsR0FBdUQsWUFBTTtBQUM1RCxRQUFJLE9BQUosQ0FBWSxLQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLFdBQTVCLEVBQXdDLEtBQUssS0FBTCxHQUFXLENBQW5ELEVBQXFELE9BQXJELEVBQTZELENBQTdEO0FBQ0EsSUFGRDtBQUdBLFlBQVMsYUFBVCxDQUF1QixzQkFBdkIsRUFBK0MsT0FBL0MsR0FBeUQsWUFBTTtBQUM5RCxRQUFJLE9BQUosQ0FBWSxLQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLFdBQTVCLEVBQXdDLEtBQUssS0FBTCxHQUFXLENBQW5ELEVBQXFELE9BQXJELEVBQTZELENBQTdEO0FBQ0EsSUFGRDtBQUdBLFlBQVMsYUFBVCxDQUF1Qix1QkFBdkIsRUFBZ0QsT0FBaEQsR0FBMEQsWUFBTTtBQUMvRCxRQUFJLE9BQUosQ0FBWSxJQUFJLE9BQUosQ0FBWSxTQUFaLENBQXNCLEtBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsV0FBdEMsQ0FBWixFQUErRCxLQUFLLEtBQXBFLEVBQTBFLE9BQTFFO0FBQ0EsSUFGRDtBQUdBLFlBQVMsYUFBVCxDQUF1Qix1QkFBdkIsRUFBZ0QsT0FBaEQsR0FBMEQsWUFBTTtBQUMvRCxRQUFJLE9BQUosQ0FBWSxJQUFJLE9BQUosQ0FBWSxTQUFaLENBQXNCLEtBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsV0FBdEMsQ0FBWixFQUErRCxLQUFLLEtBQXBFLEVBQTBFLE9BQTFFO0FBQ0EsSUFGRDtBQUdBLFlBQVMsYUFBVCxDQUF1QixxQkFBdkIsRUFBOEMsT0FBOUMsR0FBd0QsWUFBTTtBQUM3RCxRQUFJLE9BQUosQ0FBWSxLQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLFdBQTVCLEVBQXdDLEtBQUssS0FBTCxHQUFXLENBQW5ELEVBQXFELE9BQXJELEVBQTZELENBQTdEO0FBQ0EsSUFGRDtBQUdBLFlBQVMsYUFBVCxDQUF1Qix1QkFBdkIsRUFBZ0QsT0FBaEQsR0FBMEQsWUFBTTtBQUMvRCxRQUFJLE9BQUosQ0FBWSxLQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLFdBQTVCLEVBQXdDLEtBQUssS0FBTCxHQUFXLENBQW5ELEVBQXFELE9BQXJELEVBQTZELENBQTdEO0FBQ0EsSUFGRDtBQUdBLFlBQVMsYUFBVCxDQUF1Qix1QkFBdkIsRUFBZ0QsT0FBaEQsR0FBMEQsWUFBTTtBQUMvRCxRQUFJLFdBQUosQ0FBZ0IsTUFBaEIsRUFBdUIsVUFBdkI7QUFDQSxRQUFJLFFBQUosQ0FBYSxXQUFiLEVBQXlCLEtBQXpCO0FBQ0EsUUFBSSxXQUFKLENBQWdCLGFBQWhCLEVBQThCLEtBQTlCO0FBQ0EsU0FBSyxZQUFMLENBQWtCLFFBQWxCLEdBQTZCLEtBQTdCO0FBQ0EsUUFBSSxNQUFKO0FBQ0EsSUFORDtBQU9BLFFBQUssUUFBTCxDQUFjLFFBQWQsQ0FBdUIsT0FBdkIsR0FBaUMsWUFBTTtBQUN0QyxRQUFJLE9BQUosQ0FBWSxNQUFaO0FBQ0EsSUFGRDtBQUdBLFlBQVMsYUFBVCxDQUF1QiwyQkFBdkIsRUFBb0QsT0FBcEQsR0FBOEQsWUFBTTtBQUNuRSxRQUFJLFFBQUosQ0FBYSxNQUFiO0FBQ0EsUUFBSSxPQUFKLENBQVksVUFBWjtBQUNBLElBSEQ7O0FBS0EsWUFBUyxJQUFULENBQWMsT0FBZCxHQUF3QixVQUFDLENBQUQsRUFBTztBQUFFO0FBQ2hDLE1BQUUsY0FBRjtBQUNBLFFBQUksV0FBSixDQUFnQixTQUFoQixFQUEwQixJQUExQjtBQUNBLElBSEQ7QUFJQSxHQXJEUTtBQXNEVCxZQUFVLG9CQUFXO0FBQ3BCLFlBQVMsY0FBVCxDQUF3QixXQUF4QixFQUFxQyxPQUFyQyxHQUErQyxZQUFNO0FBQ3BELFFBQUksT0FBSixDQUFZLE9BQVo7QUFDQSxJQUZEO0FBR0EsWUFBUyxjQUFULENBQXdCLFVBQXhCLEVBQW9DLE9BQXBDLEdBQThDLFlBQU07QUFDbkQsUUFBSSxPQUFKLENBQVksTUFBWjtBQUNBLElBRkQ7O0FBSUEsT0FBRyxLQUFLLFlBQUwsQ0FBa0IsUUFBckIsRUFBK0I7QUFDOUIsUUFBSSxXQUFKLENBQWdCLFdBQWhCLEVBQTRCLEtBQTVCO0FBQ0EsUUFBSSxRQUFKLENBQWEsYUFBYixFQUEyQixLQUEzQjtBQUNBLElBSEQsTUFHTztBQUNOLFFBQUksUUFBSixDQUFhLFdBQWIsRUFBeUIsS0FBekI7QUFDQSxRQUFJLFdBQUosQ0FBZ0IsYUFBaEIsRUFBOEIsS0FBOUI7QUFDQTs7QUFFRCxPQUFHLEtBQUssWUFBTCxDQUFrQixTQUFyQixFQUFnQztBQUMvQixRQUFJLFdBQUosQ0FBZ0IsWUFBaEIsRUFBNkIsS0FBN0I7QUFDQSxRQUFJLFFBQUosQ0FBYSxVQUFiLEVBQXdCLEtBQXhCO0FBQ0EsSUFIRCxNQUdPO0FBQ04sUUFBSSxRQUFKLENBQWEsWUFBYixFQUEwQixLQUExQjtBQUNBLFFBQUksV0FBSixDQUFnQixVQUFoQixFQUEyQixLQUEzQjtBQUNBOztBQUVELE9BQUcsS0FBSyxZQUFMLENBQWtCLFNBQXJCLEVBQWdDO0FBQy9CLFFBQUksV0FBSixDQUFnQixZQUFoQixFQUE2QixLQUE3QjtBQUNBLFFBQUksUUFBSixDQUFhLFlBQWIsRUFBMEIsS0FBMUI7QUFDQSxJQUhELE1BR087QUFDTixRQUFJLFFBQUosQ0FBYSxZQUFiLEVBQTBCLEtBQTFCO0FBQ0EsUUFBSSxXQUFKLENBQWdCLFlBQWhCLEVBQTZCLEtBQTdCO0FBQ0E7O0FBRUQsWUFBUyxjQUFULENBQXdCLFNBQXhCLEVBQW1DLE9BQW5DLEdBQTZDLFlBQU07QUFDbEQsUUFBSSxXQUFKLENBQWdCLE1BQWhCLEVBQXVCLFdBQXZCO0FBQ0EsUUFBSSxRQUFKLENBQWEsWUFBYixFQUEwQixLQUExQjtBQUNBLFFBQUksV0FBSixDQUFnQixVQUFoQixFQUEyQixLQUEzQjtBQUNBLFNBQUssWUFBTCxDQUFrQixTQUFsQixHQUE4QixLQUE5QjtBQUNBLElBTEQ7QUFNQSxZQUFTLGFBQVQsQ0FBdUIsWUFBdkIsRUFBcUMsT0FBckMsR0FBK0MsWUFBTTtBQUNwRCxRQUFJLFFBQUosQ0FBYSxNQUFiLEVBQW9CLFdBQXBCO0FBQ0EsUUFBSSxXQUFKLENBQWdCLFlBQWhCLEVBQTZCLEtBQTdCO0FBQ0EsUUFBSSxRQUFKLENBQWEsVUFBYixFQUF3QixLQUF4QjtBQUNBLFNBQUssWUFBTCxDQUFrQixTQUFsQixHQUE4QixJQUE5QjtBQUNBLElBTEQ7QUFNQSxPQUFHLFNBQVMsY0FBVCxDQUF3QixZQUF4QixNQUEwQyxJQUE3QyxFQUFtRDtBQUNsRCxhQUFTLGNBQVQsQ0FBd0IsWUFBeEIsRUFBc0MsT0FBdEMsR0FBZ0QsWUFBTTtBQUNyRCxTQUFJLFdBQUosQ0FBZ0IsTUFBaEIsRUFBdUIsVUFBdkI7QUFDQSxTQUFJLFFBQUosQ0FBYSxXQUFiLEVBQXlCLEtBQXpCO0FBQ0EsU0FBSSxXQUFKLENBQWdCLGFBQWhCLEVBQThCLEtBQTlCO0FBQ0EsVUFBSyxZQUFMLENBQWtCLFFBQWxCLEdBQTZCLEtBQTdCO0FBQ0EsS0FMRDtBQU1BLGFBQVMsYUFBVCxDQUF1QixXQUF2QixFQUFvQyxPQUFwQyxHQUE4QyxZQUFNO0FBQ25ELFNBQUksUUFBSixDQUFhLE1BQWIsRUFBb0IsVUFBcEI7QUFDQSxTQUFJLFdBQUosQ0FBZ0IsV0FBaEIsRUFBNEIsS0FBNUI7QUFDQSxTQUFJLFFBQUosQ0FBYSxhQUFiLEVBQTJCLEtBQTNCO0FBQ0EsVUFBSyxZQUFMLENBQWtCLFFBQWxCLEdBQTZCLElBQTdCO0FBQ0EsS0FMRDtBQU1BOztBQUVEOztBQUVBLFlBQVMsYUFBVCxDQUF1QixZQUF2QixFQUFxQyxPQUFyQyxHQUErQyxZQUFNO0FBQ3BELFFBQUksUUFBSixDQUFhLE1BQWIsRUFBb0IsV0FBcEI7QUFDQSxRQUFJLFFBQUosQ0FBYSxZQUFiLEVBQTBCLEtBQTFCO0FBQ0EsUUFBSSxXQUFKLENBQWdCLFlBQWhCLEVBQTZCLEtBQTdCO0FBQ0EsSUFKRDtBQUtBLFlBQVMsYUFBVCxDQUF1QixZQUF2QixFQUFxQyxPQUFyQyxHQUErQyxZQUFNO0FBQ3BELFFBQUksV0FBSixDQUFnQixNQUFoQixFQUF1QixXQUF2QjtBQUNBLFFBQUksUUFBSixDQUFhLFlBQWIsRUFBMEIsS0FBMUI7QUFDQSxRQUFJLFdBQUosQ0FBZ0IsWUFBaEIsRUFBNkIsS0FBN0I7QUFDQSxJQUpEOztBQU1BLFlBQVMsY0FBVCxDQUF3QixZQUF4QixFQUFzQyxPQUF0QyxHQUFnRCxZQUFNO0FBQ3JELFFBQUcsS0FBSyxXQUFMLElBQW9CLE1BQXBCLElBQThCLEtBQUssV0FBTCxJQUFvQixPQUFyRCxFQUE4RDtBQUM3RCxTQUFJLE9BQUosQ0FBWSxVQUFaO0FBQ0EsS0FGRCxNQUVPO0FBQ04sU0FBSSxPQUFKLENBQVksTUFBWjtBQUNBO0FBQ0QsSUFORDs7QUFRQTs7QUFFQSxZQUFTLGNBQVQsQ0FBd0IsV0FBeEIsRUFBcUMsU0FBckMsR0FBaUQsS0FBSyxXQUF0RCxDQWxGb0IsQ0FrRmlEOztBQUVyRSxRQUFJLElBQUksQ0FBUixJQUFhLEtBQUssY0FBbEIsRUFBa0M7QUFDakMsYUFBUyxjQUFULENBQXdCLGdCQUF4QixFQUEwQyxTQUExQyxhQUE4RCxLQUFLLGNBQUwsQ0FBb0IsQ0FBcEIsQ0FBOUQ7QUFDQTtBQUNELFlBQVMsY0FBVCxDQUF3QixZQUF4QixFQUFzQyxTQUF0QyxHQUFrRCxLQUFLLFVBQXZEO0FBRUEsR0EvSVE7QUFnSlQsU0FBTyxpQkFBVztBQUNqQixRQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CLE9BQW5CLEdBQTZCLFlBQU07QUFDbEMsUUFBSSxLQUFKLENBQVUsSUFBVjtBQUNBLElBRkQ7O0FBSUEsUUFBSSxJQUFJLElBQUksQ0FBWixFQUFlLElBQUksS0FBSyxRQUFMLENBQWMsTUFBakMsRUFBeUMsR0FBekMsRUFBOEM7QUFDN0MsUUFBSSxZQUFZLEtBQUssUUFBTCxDQUFjLENBQWQsRUFBaUIsS0FBakM7QUFDQSxRQUFHLE9BQU8sU0FBUCxLQUFxQixXQUF4QixFQUFxQztBQUNwQyxhQUFRLEdBQVIsQ0FBWSx5QkFBeUIsS0FBSyxRQUFMLENBQWMsQ0FBZCxFQUFpQixhQUF0RDtBQUNBLFVBQUksSUFBSSxJQUFJLENBQVosRUFBZSxJQUFJLFVBQVUsTUFBN0IsRUFBcUMsR0FBckMsRUFBMEM7QUFDekMsV0FBSSxJQUFJLElBQUksQ0FBWixFQUFlLElBQUksVUFBVSxDQUFWLEVBQWEsTUFBaEMsRUFBd0MsR0FBeEMsRUFBNkM7QUFDNUMsV0FBSSxXQUFXLFVBQVUsQ0FBVixFQUFhLENBQWIsQ0FBZjtBQUNBLFdBQUcsS0FBSyxRQUFMLENBQWMsQ0FBZCxFQUFpQixJQUFqQixDQUFzQixDQUF0QixFQUF5QixPQUF6QixDQUFpQyxPQUFLLFNBQVMsTUFBZCxHQUFxQixJQUF0RCxJQUE4RCxDQUFqRSxFQUFvRTtBQUNuRSxZQUFJLE9BQU8sS0FBSyxRQUFMLENBQWMsQ0FBZCxFQUFpQixJQUFqQixDQUFzQixDQUF0QixFQUF5QixPQUF6QixDQUFpQyxPQUFLLFNBQVMsTUFBZCxHQUFxQixJQUF0RCxvREFBdUcsSUFBRSxDQUF6Ryx5Q0FBMkksU0FBUyxRQUFwSixvQkFBWDtBQUNBLGFBQUssUUFBTCxDQUFjLENBQWQsRUFBaUIsSUFBakIsQ0FBc0IsQ0FBdEIsSUFBMkIsSUFBM0I7QUFDQSxRQUhELE1BR087QUFDTixnQkFBUSxHQUFSLENBQVksd0JBQXNCLENBQXRCLEdBQXdCLElBQXhCLEdBQTZCLFNBQVMsTUFBdEMsR0FBNkMsSUFBN0MsR0FBa0QsU0FBUyxRQUF2RTtBQUNBO0FBQ0Q7QUFDRDtBQUNEO0FBQ0Q7QUFFRCxHQXZLUTtBQXdLVCxXQUFTLG1CQUFXO0FBQUk7QUFDdkIsUUFBSyxRQUFMLENBQWMsV0FBZCxHQUE0QixJQUFJLE1BQUosQ0FBVyxLQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLE1BQTNCLEVBQW1DO0FBQzlELGlCQUFjO0FBRGdELElBQW5DLENBQTVCO0FBR0EsUUFBSyxRQUFMLENBQWMsVUFBZCxHQUEyQixJQUFJLE1BQUosQ0FBVyxLQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsTUFBMUIsRUFBa0M7QUFDNUQsaUJBQWM7QUFEOEMsSUFBbEMsQ0FBM0I7QUFHQSxRQUFLLFFBQUwsQ0FBYyxXQUFkLENBQTBCLEdBQTFCLENBQThCLE9BQTlCLEVBQXVDLEdBQXZDLENBQTJDLEVBQUUsV0FBVyxPQUFPLGFBQXBCLEVBQTNDO0FBQ0EsUUFBSyxRQUFMLENBQWMsV0FBZCxDQUEwQixFQUExQixDQUE2QixXQUE3QixFQUF5QyxVQUFDLENBQUQsRUFBTztBQUMvQyxNQUFFLGNBQUY7QUFDQSxRQUFJLE9BQUosQ0FBWSxJQUFJLE9BQUosQ0FBWSxTQUFaLENBQXNCLEtBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsV0FBdEMsQ0FBWixFQUErRCxLQUFLLEtBQXBFLEVBQTBFLE9BQTFFO0FBQ0EsSUFIRCxFQUdHLEVBSEgsQ0FHTSxZQUhOLEVBR21CLFVBQUMsQ0FBRCxFQUFPO0FBQ3pCLE1BQUUsY0FBRjtBQUNBLFFBQUksT0FBSixDQUFZLElBQUksT0FBSixDQUFZLFNBQVosQ0FBc0IsS0FBSyxJQUFMLENBQVUsS0FBVixDQUFnQixXQUF0QyxDQUFaLEVBQStELEtBQUssS0FBcEUsRUFBMEUsT0FBMUU7QUFDQSxJQU5EOztBQVFBLFFBQUssUUFBTCxDQUFjLFdBQWQsQ0FBMEIsRUFBMUIsQ0FBNkIsV0FBN0IsRUFBeUMsVUFBQyxDQUFELEVBQU87QUFDL0M7QUFDQSxRQUFHLEtBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsSUFBaEIsQ0FBcUIsU0FBckIsS0FBbUMsQ0FBdEMsRUFBeUM7QUFDeEMsU0FBSSxPQUFKLENBQVksS0FBSyxJQUFMLENBQVUsS0FBVixDQUFnQixXQUE1QixFQUF3QyxLQUFLLEtBQUwsR0FBVyxDQUFuRCxFQUFxRCxPQUFyRCxFQUE2RCxDQUE3RCxFQUR3QyxDQUMwQjtBQUNsRTtBQUNELElBTEQsRUFLRyxFQUxILENBS00sU0FMTixFQUtnQixVQUFDLENBQUQsRUFBTztBQUN0QixNQUFFLGNBQUY7QUFDQTtBQUNBO0FBQ0EsUUFBRyxLQUFLLEdBQUwsQ0FBUyxLQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLElBQWhCLENBQXFCLFNBQXJCLEdBQWlDLEtBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsSUFBaEIsQ0FBcUIsWUFBdEQsR0FBcUUsS0FBSyxJQUFMLENBQVUsS0FBVixDQUFnQixJQUFoQixDQUFxQixZQUFuRyxJQUFtSCxDQUF0SCxFQUF5SDtBQUN4SCxTQUFJLE9BQUosQ0FBWSxLQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLFdBQTVCLEVBQXdDLEtBQUssS0FBTCxHQUFXLENBQW5ELEVBQXFELE9BQXJEO0FBQ0E7QUFDRCxJQVpEO0FBYUEsUUFBSyxRQUFMLENBQWMsVUFBZCxDQUF5QixHQUF6QixDQUE2QixPQUE3QixFQUFzQyxHQUF0QyxDQUEwQyxFQUFFLFdBQVcsT0FBTyxhQUFwQixFQUExQztBQUNBLFFBQUssUUFBTCxDQUFjLFVBQWQsQ0FBeUIsRUFBekIsQ0FBNEIsV0FBNUIsRUFBd0MsVUFBQyxDQUFELEVBQU87QUFDOUMsTUFBRSxjQUFGO0FBQ0EsUUFBSSxPQUFKLENBQVksSUFBSSxPQUFKLENBQVksU0FBWixDQUFzQixLQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsV0FBckMsQ0FBWixFQUE4RCxLQUFLLEtBQW5FLEVBQXlFLE1BQXpFO0FBQ0EsSUFIRCxFQUdHLEVBSEgsQ0FHTSxZQUhOLEVBR21CLFVBQUMsQ0FBRCxFQUFPO0FBQ3pCLE1BQUUsY0FBRjtBQUNBLFFBQUksT0FBSixDQUFZLElBQUksT0FBSixDQUFZLFNBQVosQ0FBc0IsS0FBSyxJQUFMLENBQVUsSUFBVixDQUFlLFdBQXJDLENBQVosRUFBOEQsS0FBSyxLQUFuRSxFQUF5RSxNQUF6RTtBQUNBLElBTkQ7O0FBUUEsUUFBSyxRQUFMLENBQWMsVUFBZCxDQUF5QixFQUF6QixDQUE0QixXQUE1QixFQUF3QyxVQUFDLENBQUQsRUFBTztBQUM5QztBQUNBLFFBQUcsS0FBSyxJQUFMLENBQVUsSUFBVixDQUFlLElBQWYsQ0FBb0IsU0FBcEIsS0FBa0MsQ0FBckMsRUFBd0M7QUFDdkMsU0FBSSxPQUFKLENBQVksS0FBSyxJQUFMLENBQVUsS0FBVixDQUFnQixXQUE1QixFQUF3QyxLQUFLLEtBQUwsR0FBVyxDQUFuRCxFQUFxRCxPQUFyRCxFQUE2RCxDQUE3RCxFQUR1QyxDQUMyQjtBQUNsRTtBQUNELElBTEQsRUFLRyxFQUxILENBS00sU0FMTixFQUtnQixVQUFDLENBQUQsRUFBTztBQUN0QixNQUFFLGNBQUY7QUFDQTtBQUNBO0FBQ0EsUUFBRyxLQUFLLEdBQUwsQ0FBUyxLQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsSUFBZixDQUFvQixTQUFwQixHQUFnQyxLQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsSUFBZixDQUFvQixZQUFwRCxHQUFtRSxLQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsSUFBZixDQUFvQixZQUFoRyxJQUFnSCxDQUFuSCxFQUFzSDtBQUNySCxTQUFJLE9BQUosQ0FBWSxLQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLFdBQTVCLEVBQXdDLEtBQUssS0FBTCxHQUFXLENBQW5ELEVBQXFELE9BQXJEO0FBQ0E7QUFDRCxJQVpEO0FBYUEsR0EzTlE7QUE0TlQsUUFBTSxnQkFBVztBQUNoQjs7QUFFQSxZQUFTLElBQVQsQ0FBYyxTQUFkLEdBQTBCLFVBQUMsQ0FBRCxFQUFPO0FBQ2hDLE1BQUUsY0FBRjtBQUNBLFFBQUcsQ0FBQyxFQUFFLE9BQUYsSUFBYSxFQUFFLEtBQWhCLE1BQTJCLEVBQTlCLEVBQWtDO0FBQ2pDLFNBQUksUUFBSixDQUFhLFVBQWIsRUFBd0IsSUFBeEI7QUFDQSxTQUFJLE9BQUosQ0FBWSxJQUFJLE9BQUosQ0FBWSxTQUFaLENBQXNCLEtBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsV0FBdEMsQ0FBWixFQUErRCxLQUFLLEtBQXBFLEVBQTBFLE9BQTFFO0FBQ0E7QUFDRCxRQUFHLENBQUMsRUFBRSxPQUFGLElBQWEsRUFBRSxLQUFoQixNQUEyQixFQUE5QixFQUFrQztBQUNqQyxTQUFJLFFBQUosQ0FBYSxVQUFiLEVBQXdCLElBQXhCO0FBQ0EsU0FBSSxPQUFKLENBQVksSUFBSSxPQUFKLENBQVksU0FBWixDQUFzQixLQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLFdBQXRDLENBQVosRUFBK0QsS0FBSyxLQUFwRSxFQUEwRSxPQUExRTtBQUNBO0FBQ0QsUUFBRyxDQUFDLEVBQUUsT0FBRixJQUFhLEVBQUUsS0FBaEIsTUFBMkIsRUFBOUIsRUFBa0M7QUFDakMsU0FBSSxRQUFKLENBQWEsUUFBYixFQUFzQixJQUF0QjtBQUNBLFNBQUksT0FBSixDQUFZLEtBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsV0FBNUIsRUFBd0MsS0FBSyxLQUFMLEdBQVcsQ0FBbkQsRUFBcUQsT0FBckQ7QUFDQTtBQUNELFFBQUcsQ0FBQyxFQUFFLE9BQUYsSUFBYSxFQUFFLEtBQWhCLE1BQTJCLEVBQTlCLEVBQWtDO0FBQ2pDLFNBQUksUUFBSixDQUFhLFVBQWIsRUFBd0IsSUFBeEI7QUFDQSxTQUFJLE9BQUosQ0FBWSxLQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLFdBQTVCLEVBQXdDLEtBQUssS0FBTCxHQUFXLENBQW5ELEVBQXFELE9BQXJELEVBQTZELENBQTdEO0FBQ0E7O0FBRUQsUUFBRyxDQUFDLEVBQUUsT0FBRixJQUFhLEVBQUUsS0FBaEIsTUFBMkIsRUFBOUIsRUFBa0M7QUFBRTtBQUNuQyxTQUFJLFFBQUosQ0FBYSxRQUFiLEVBQXNCLElBQXRCO0FBQ0EsU0FBSSxPQUFKLENBQVksS0FBSyxJQUFMLENBQVUsS0FBVixDQUFnQixXQUE1QixFQUF3QyxLQUFLLEtBQUwsR0FBVyxDQUFuRCxFQUFxRCxPQUFyRDtBQUNBO0FBQ0QsUUFBRyxDQUFDLEVBQUUsT0FBRixJQUFhLEVBQUUsS0FBaEIsTUFBMkIsRUFBOUIsRUFBa0M7QUFBRTtBQUNuQyxTQUFJLFFBQUosQ0FBYSxVQUFiLEVBQXdCLElBQXhCO0FBQ0EsU0FBSSxPQUFKLENBQVksS0FBSyxJQUFMLENBQVUsS0FBVixDQUFnQixXQUE1QixFQUF3QyxLQUFLLEtBQUwsR0FBVyxDQUFuRCxFQUFxRCxPQUFyRCxFQUE2RCxDQUE3RDtBQUNBOztBQUVELFFBQUcsQ0FBQyxFQUFFLE9BQUYsSUFBYSxFQUFFLEtBQWhCLE1BQTJCLEVBQTlCLEVBQWtDO0FBQUU7QUFDbkMsU0FBSSxRQUFKLENBQWEsUUFBYixFQUFzQixJQUF0QjtBQUNBLFNBQUksT0FBSixDQUFZLEtBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsV0FBNUIsRUFBd0MsQ0FBeEMsRUFBMEMsT0FBMUM7QUFDQTtBQUNELFFBQUcsQ0FBQyxFQUFFLE9BQUYsSUFBYSxFQUFFLEtBQWhCLE1BQTJCLEVBQTlCLEVBQWtDO0FBQUU7QUFDbkMsU0FBSSxRQUFKLENBQWEsVUFBYixFQUF3QixJQUF4QjtBQUNBLFNBQUksT0FBSixDQUFZLEtBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsV0FBNUIsRUFBd0MsS0FBSyxVQUFMLEdBQWdCLENBQXhELEVBQTBELE9BQTFELEVBQWtFLENBQWxFO0FBQ0E7QUFDRCxJQXBDRDtBQXFDQTtBQXBRUSxFQXBiRDtBQTByQlQsU0FBUSxrQkFBVzs7QUFFbEI7QUFDQTtBQUNBOztBQUVBLE9BQUssV0FBTCxHQUFtQixPQUFPLFVBQTFCO0FBQ0EsT0FBSyxZQUFMLEdBQW9CLE9BQU8sV0FBM0I7QUFDQSxNQUFJLGFBQWEsU0FBUyxjQUFULENBQXdCLFFBQXhCLEVBQWtDLFdBQWxDLEdBQWlELElBQUksRUFBckQsR0FBMkQsQ0FBNUU7O0FBRUEsTUFBRyxLQUFLLFlBQUwsQ0FBa0IsUUFBbEIsSUFBOEIsS0FBSyxXQUFMLEdBQW1CLEdBQXBELEVBQXlEO0FBQ3hELE9BQUksUUFBSixDQUFhLE1BQWIsRUFBb0IsVUFBcEI7QUFDQSxnQkFBYyxTQUFTLGNBQVQsQ0FBd0IsUUFBeEIsRUFBa0MsV0FBbEMsR0FBZ0QsQ0FBakQsR0FBdUQsSUFBSSxFQUEzRCxHQUFpRSxDQUE5RTtBQUNBLFdBQVEsR0FBUixDQUFZLFlBQVo7QUFDQSxPQUFHLEtBQUssSUFBTCxDQUFVLElBQVYsQ0FBZSxXQUFmLEtBQStCLEVBQWxDLEVBQXNDO0FBQ3JDLFNBQUssSUFBTCxDQUFVLElBQVYsQ0FBZSxXQUFmLEdBQTZCLElBQUksT0FBSixDQUFZLFNBQVosQ0FBc0IsS0FBSyxJQUFMLENBQVUsS0FBVixDQUFnQixXQUF0QyxDQUE3QjtBQUNBOztBQUVELE9BQUksWUFBWSxJQUFJLE9BQUosQ0FBWSxtQkFBWixDQUFnQyxLQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsV0FBL0MsQ0FBaEI7O0FBRUEsT0FBSSxRQUFKLENBQWEsd0JBQWIsRUFBdUMsS0FBSyxlQUFMLENBQXFCLFNBQXJCLEVBQWdDLGdCQUF2RTtBQUNBLE9BQUksU0FBUyxJQUFJLE1BQUosQ0FBVyxLQUFLLFFBQUwsQ0FBYyxTQUFkLEVBQXlCLElBQXpCLENBQThCLEtBQUssS0FBbkMsQ0FBWCxDQUFiO0FBQ0EsUUFBSyxJQUFMLENBQVUsSUFBVixDQUFlLFVBQWYsQ0FBMEIsV0FBMUIsQ0FBc0MsTUFBdEM7O0FBRUEsUUFBSyxJQUFMLENBQVUsSUFBVixDQUFlLE1BQWYsQ0FBc0IsS0FBdEIsQ0FBNEIsS0FBNUIsR0FBb0MsS0FBcEM7QUFDQSxRQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLE1BQWhCLENBQXVCLEtBQXZCLENBQTZCLEtBQTdCLEdBQXFDLEtBQXJDO0FBQ0EsT0FBSSxPQUFKLENBQVksS0FBSyxJQUFMLENBQVUsSUFBVixDQUFlLFdBQTNCLEVBQXVDLEtBQUssS0FBNUMsRUFBa0QsTUFBbEQ7QUFDQSxHQWpCRCxNQWlCTztBQUNOLFdBQVEsR0FBUixDQUFZLGNBQVo7QUFDQSxPQUFJLFdBQUosQ0FBZ0IsTUFBaEIsRUFBdUIsVUFBdkI7O0FBRUEsUUFBSyxJQUFMLENBQVUsSUFBVixDQUFlLE1BQWYsQ0FBc0IsS0FBdEIsQ0FBNEIsS0FBNUIsR0FBb0MsR0FBcEM7QUFDQSxRQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLE1BQWhCLENBQXVCLEtBQXZCLENBQTZCLEtBQTdCLEdBQXFDLE1BQXJDO0FBQ0E7O0FBRUQsT0FBSyxJQUFMLENBQVUsSUFBVixDQUFlLFFBQWYsQ0FBd0IsS0FBeEIsQ0FBOEIsS0FBOUIsR0FBeUMsVUFBekM7QUFDQSxPQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsUUFBZixDQUF3QixZQUF4QixDQUFxQyxPQUFyQyxhQUFzRCxVQUF0RDtBQUNBLE9BQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsUUFBaEIsQ0FBeUIsS0FBekIsQ0FBK0IsS0FBL0IsR0FBMEMsVUFBMUM7QUFDQSxPQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLFFBQWhCLENBQXlCLFlBQXpCLENBQXNDLE9BQXRDLGFBQXVELFVBQXZEOztBQUVBLFVBQVEsR0FBUiw4Q0FBdUQsS0FBSyxXQUE1RCxTQUEyRSxLQUFLLFlBQWhGO0FBQ0EsT0FBSyxJQUFMLENBQVUsS0FBVixHQUFrQixLQUFLLFdBQXZCO0FBQ0EsT0FBSyxJQUFMLENBQVUsTUFBVixHQUFtQixLQUFLLFlBQUwsR0FBb0IsU0FBUyxjQUFULENBQXdCLFFBQXhCLEVBQWtDLFlBQXpFLENBMUNrQixDQTBDcUU7O0FBRXZGLE1BQUksUUFBSixDQUFhLE9BQWIsRUFBcUIsS0FBSyxJQUFMLENBQVUsS0FBVixHQUFrQixLQUFLLElBQUwsQ0FBVSxNQUE1QixHQUFxQyxXQUFyQyxHQUFtRCxVQUF4RTtBQUNBLE1BQUksV0FBSixDQUFnQixPQUFoQixFQUF3QixLQUFLLElBQUwsQ0FBVSxLQUFWLEdBQWtCLEtBQUssSUFBTCxDQUFVLE1BQTVCLEdBQXFDLFVBQXJDLEdBQWtELFdBQTFFO0FBQ0E7Ozs7QUFJQSxPQUFLLFFBQUwsQ0FBYyxJQUFkLENBQW1CLEtBQW5CLENBQXlCLE1BQXpCLEdBQWtDLEtBQUssWUFBTCxHQUFrQixJQUFwRDtBQUNBLE9BQUssUUFBTCxDQUFjLE9BQWQsQ0FBc0IsS0FBdEIsQ0FBNEIsTUFBNUIsR0FBcUMsS0FBSyxJQUFMLENBQVUsTUFBVixHQUFpQixJQUF0RDs7QUFFQSxNQUFHLEtBQUssTUFBTCxDQUFZLFVBQWYsRUFBMkI7QUFDMUI7O0FBRUEsT0FBSSxjQUFjLEtBQUssWUFBTCxDQUFrQixRQUFsQixHQUE4QixLQUFLLFdBQUwsR0FBbUIsQ0FBakQsR0FBc0QsS0FBSyxXQUE3RTs7QUFFQSxPQUFHLGNBQWMsR0FBakIsRUFBc0I7QUFDckIsU0FBSyxJQUFMLENBQVUsSUFBVixDQUFlLFVBQWYsR0FBNEIsRUFBNUI7QUFDQSxTQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLFVBQWhCLEdBQTZCLEVBQTdCO0FBQ0EsSUFIRCxNQUdPO0FBQ04sUUFBRyxjQUFjLEdBQWpCLEVBQXNCO0FBQ3JCLFVBQUssSUFBTCxDQUFVLElBQVYsQ0FBZSxVQUFmLEdBQTRCLEVBQTVCO0FBQ0EsVUFBSyxJQUFMLENBQVUsS0FBVixDQUFnQixVQUFoQixHQUE2QixFQUE3QjtBQUNBLEtBSEQsTUFHTztBQUNOLFNBQUcsY0FBYyxJQUFqQixFQUF1QjtBQUN0QixXQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsVUFBZixHQUE0QixFQUE1QjtBQUNBLFdBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsVUFBaEIsR0FBNkIsRUFBN0I7QUFDQSxNQUhELE1BR087QUFDTixXQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsVUFBZixHQUE0QixFQUE1QjtBQUNBLFdBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsVUFBaEIsR0FBNkIsRUFBN0I7QUFDQTtBQUNEO0FBQ0Q7QUFDRCxHQXRCRCxNQXNCTztBQUNOLFFBQUssSUFBTCxDQUFVLElBQVYsQ0FBZSxVQUFmLEdBQTRCLEtBQUssV0FBTCxHQUFpQixFQUE3QztBQUNBLFFBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsVUFBaEIsR0FBNkIsS0FBSyxXQUFMLEdBQWlCLEVBQTlDO0FBQ0E7O0FBRUQsT0FBSyxJQUFMLENBQVUsSUFBVixDQUFlLEtBQWYsR0FBdUIsS0FBSyxZQUFMLENBQWtCLFFBQWxCLEdBQTZCLEtBQUssV0FBTCxHQUFtQixDQUFoRCxHQUFvRCxDQUEzRTtBQUNBLE9BQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsS0FBaEIsR0FBd0IsS0FBSyxZQUFMLENBQWtCLFFBQWxCLEdBQTZCLEtBQUssV0FBTCxHQUFtQixDQUFoRCxHQUFvRCxLQUFLLFdBQWpGOztBQUVBLE1BQUksT0FBSixDQUFZLEtBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsV0FBNUIsRUFBd0MsS0FBSyxLQUE3QyxFQUFtRCxPQUFuRDtBQUNBLEVBOXdCUTtBQSt3QlQsVUFBUyxpQkFBUyxRQUFULEVBQW1CLFFBQW5CLEVBQTZCLElBQTdCLEVBQW1DLFVBQW5DLEVBQStDO0FBQ3ZELFVBQVEsR0FBUiwyQkFBb0MsUUFBcEMsZ0JBQXVELFFBQXZELFVBQW9FLElBQXBFOztBQUVBOztBQUVBLE1BQUcsS0FBSyxXQUFMLElBQW9CLE1BQXZCLEVBQStCO0FBQUE7O0FBRTlCLFFBQUksb0JBQUo7QUFBQSxRQUFpQixjQUFjLEtBQS9CO0FBQ0EsUUFBSSxXQUFXLEtBQUssSUFBTCxDQUFVLElBQVYsQ0FBZjtBQUNBLFFBQUksWUFBYSxRQUFRLE9BQVQsR0FBb0IsS0FBSyxJQUFMLENBQVUsSUFBOUIsR0FBcUMsS0FBSyxJQUFMLENBQVUsS0FBL0Q7QUFDQSxRQUFJLFFBQVMsUUFBUSxPQUFULEdBQW9CLE1BQXBCLEdBQTZCLE9BQXpDO0FBQ0E7QUFDQTs7QUFFQSxRQUFJLGdCQUFnQixLQUFLLHNCQUFMLENBQTRCLE9BQTVCLENBQW9DLFNBQVMsV0FBN0MsQ0FBcEIsQ0FUOEIsQ0FTaUQ7QUFDL0UsUUFBSSxnQkFBZ0IsS0FBSyxzQkFBTCxDQUE0QixPQUE1QixDQUFvQyxRQUFwQyxDQUFwQixDQVY4QixDQVVxQzs7QUFFbkUsUUFBRyxhQUFhLEtBQUssS0FBckIsRUFBNEI7QUFDM0IsbUJBQWMsSUFBZDtBQUNBLFNBQUcsWUFBWSxLQUFLLFVBQXBCLEVBQWdDO0FBQy9CLGlCQUFXLENBQVg7QUFDQSxNQUZELE1BRU87QUFDTixVQUFHLFdBQVcsQ0FBZCxFQUFpQjtBQUNoQixrQkFBVyxLQUFLLFVBQUwsR0FBZ0IsQ0FBM0I7QUFDQTtBQUNEO0FBQ0Q7O0FBRUQsUUFBSSxnQkFBZ0IsYUFBakIsS0FBb0MsQ0FBdkMsRUFBMEM7QUFDekMsbUJBQWMsSUFBZDtBQUNBLGtCQUFjLFNBQVMsSUFBVCxDQUFjLFNBQWYsQ0FBeUIsZ0NBQXpCLEdBQTJELFNBQVMsSUFBVCxDQUFjLFlBQXRGO0FBQ0EsYUFBUSxHQUFSLGlDQUFxQyxVQUFyQztBQUNBOztBQUVEOztBQUVBLFFBQUksd0JBQXdCLENBQTVCO0FBQ0EsUUFBSSxzQkFBc0IsSUFBSSxPQUFKLENBQVksbUJBQVosQ0FBZ0MsUUFBaEMsQ0FBMUI7QUFDQSxRQUFJLHNCQUFzQixJQUFJLE9BQUosQ0FBWSxtQkFBWixDQUFnQyxTQUFTLFdBQXpDLENBQTFCO0FBQ0EsUUFBRyxLQUFLLFlBQUwsQ0FBa0IsUUFBckIsRUFBK0I7QUFDOUIsNkJBQXdCLElBQUksT0FBSixDQUFZLG1CQUFaLENBQWdDLFVBQVUsV0FBMUMsQ0FBeEI7QUFDQTs7QUFHRCxRQUFHLFdBQUgsRUFBZ0I7O0FBRWYsYUFBUSxHQUFSLENBQVksdUJBQVo7O0FBRUE7O0FBRUEsY0FBUyxJQUFULENBQWMsRUFBZCxlQUE2QixJQUE3QjtBQUNBLFNBQUksWUFBWSxDQUFoQjs7QUFFQTtBQUNBOztBQUVBLFNBQU0sZ0JBQWdCLGFBQWpCLEtBQW9DLGdCQUFnQixDQUFoQixJQUFxQixrQkFBbUIsS0FBSyxzQkFBTCxDQUE0QixNQUE1QixHQUFxQyxDQUFqSCxDQUFELElBQTRILGlCQUFpQixDQUFqQixJQUFzQixpQkFBa0IsS0FBSyxzQkFBTCxDQUE0QixNQUE1QixHQUFtQyxDQUEzTSxFQUFpTjs7QUFFaE47O0FBRUEsVUFBSSxTQUFTLElBQUksTUFBSix1QkFBOEIsSUFBOUIsNkJBQXlELEtBQUssZUFBTCxDQUFxQixtQkFBckIsRUFBMEMsZ0JBQW5HLCtEQUEwSyxLQUFLLFFBQUwsQ0FBYyxtQkFBZCxFQUFtQyxJQUFuQyxDQUF3QyxRQUF4QyxDQUExSyxrQkFBYjtBQUNBLGVBQVMsTUFBVCxDQUFnQixXQUFoQixDQUE0QixNQUE1QjtBQUNBLFVBQUcsS0FBSyxZQUFMLENBQWtCLFFBQXJCLEVBQStCO0FBQzlCLG1CQUFZLE1BQVo7QUFDQSxPQUZELE1BRU87QUFDTixtQkFBWSxPQUFaO0FBQ0E7QUFDRCxNQVhELE1BV087O0FBRU47O0FBRUEsVUFBSSxVQUFTLElBQUksTUFBSix1QkFBOEIsSUFBOUIsNkJBQXlELEtBQUssZUFBTCxDQUFxQixtQkFBckIsRUFBMEMsZ0JBQW5HLGdFQUEySyxLQUFLLFFBQUwsQ0FBYyxtQkFBZCxFQUFtQyxJQUFuQyxDQUF3QyxRQUF4QyxDQUEzSyxrQkFBYjtBQUNBLGVBQVMsTUFBVCxDQUFnQixZQUFoQixDQUE2QixPQUE3QixFQUFxQyxTQUFTLE1BQVQsQ0FBZ0IsVUFBaEIsQ0FBMkIsQ0FBM0IsQ0FBckM7QUFDQSxVQUFHLEtBQUssWUFBTCxDQUFrQixRQUFyQixFQUErQjtBQUM5QixtQkFBWSxLQUFaO0FBQ0EsT0FGRCxNQUVPO0FBQ04sbUJBQVksTUFBWjtBQUNBO0FBQ0Q7O0FBRUQsZUFBVSxNQUFWLENBQWlCLEtBQWpCLENBQXVCLE1BQXZCLEdBQWdDLEdBQWhDO0FBQ0EsY0FBUyxTQUFTLE1BQWxCLEVBQTBCLEVBQUMsUUFBTyxTQUFSLEVBQTFCLEVBQThDO0FBQzdDLGdCQUFVLEtBQUssTUFBTCxDQUFZLEtBRHVCO0FBRTdDLGdCQUFVLEtBRm1DO0FBRzdDLGdCQUFVLG9CQUFXO0FBQ3BCLFdBQUksZ0JBQUosY0FBZ0MsSUFBaEM7QUFDQSxpQkFBVSxNQUFWLENBQWlCLEtBQWpCLENBQXVCLE1BQXZCLEdBQWdDLENBQWhDO0FBQ0EsZ0JBQVMsTUFBVCxDQUFnQixLQUFoQixDQUFzQixJQUF0QixHQUE2QixHQUE3QjtBQUNBLGdCQUFTLElBQVQsQ0FBYyxLQUFkLENBQW9CLElBQXBCLEdBQTJCLEdBQTNCO0FBQ0EsV0FBSSxRQUFKLGFBQXVCLElBQXZCLGtCQUEwQyxZQUExQztBQUNBO0FBVDRDLE1BQTlDO0FBV0EsY0FBUyxJQUFULEdBQWdCLFNBQVMsYUFBVCxjQUFrQyxJQUFsQyxDQUFoQjtBQUNBLGNBQVMsVUFBVCxHQUFzQixTQUFTLGFBQVQsY0FBa0MsSUFBbEMsdUJBQXRCO0FBQ0EsY0FBUyxXQUFULEdBQXVCLFFBQXZCOztBQUVBO0FBQ0E7O0FBRUEsU0FBSSxXQUFXLElBQUksT0FBSixDQUFZLE9BQVosQ0FBb0IsYUFBYSxTQUFTLGFBQVQsY0FBa0MsSUFBbEMsRUFBMEMsWUFBM0UsQ0FBZjtBQUNBLGNBQVMsYUFBVCxjQUFrQyxJQUFsQyxFQUEwQyxTQUExQyxHQUFzRCxRQUF0RDtBQUNBLFNBQUcsS0FBSyxZQUFMLENBQWtCLFFBQXJCLEVBQStCO0FBQzlCLFVBQUksWUFBVyxJQUFJLE9BQUosQ0FBWSxPQUFaLENBQW9CLGFBQWEsU0FBUyxhQUFULGNBQWtDLEtBQWxDLEVBQTJDLFlBQTVFLENBQWY7QUFDQSxlQUFTLGFBQVQsY0FBa0MsS0FBbEMsRUFBMkMsU0FBM0MsR0FBdUQsU0FBdkQ7QUFDQTtBQUNELGFBQVEsR0FBUixDQUFZLGtCQUFrQixRQUE5QjtBQUNBLFNBQUcsS0FBSyxZQUFMLENBQWtCLFFBQXJCLEVBQStCO0FBQzlCLFVBQUksT0FBSixDQUFZLG9CQUFaO0FBQ0E7QUFDRDs7QUFFRCxRQUFHLGVBQWUsQ0FBQyxXQUFuQixFQUFnQzs7QUFFL0I7O0FBRUEsU0FBRyxLQUFLLFlBQUwsQ0FBa0IsUUFBckIsRUFBK0I7QUFDOUIsZUFBUyxhQUFULGFBQWlDLEtBQWpDLHdCQUEyRCxTQUEzRCxHQUF1RSxLQUFLLFFBQUwsQ0FBYyxxQkFBZCxFQUFxQyxJQUFyQyxDQUEwQyxRQUExQyxDQUF2RTtBQUNBLFVBQUksV0FBSixhQUEwQixLQUExQixrQkFBNkMsS0FBSyxlQUFMLENBQXFCLHFCQUFyQixFQUE0QyxnQkFBekY7QUFDQSxVQUFJLFFBQUosYUFBdUIsS0FBdkIsa0JBQTBDLEtBQUssZUFBTCxDQUFxQixxQkFBckIsRUFBNEMsZ0JBQXRGO0FBQ0EsZUFBUyxhQUFULGFBQWlDLElBQWpDLHdCQUEwRCxTQUExRCxHQUFzRSxLQUFLLFFBQUwsQ0FBYyxtQkFBZCxFQUFtQyxJQUFuQyxDQUF3QyxRQUF4QyxDQUF0RTtBQUNBLFVBQUksV0FBSixhQUEwQixJQUExQixrQkFBNEMsS0FBSyxlQUFMLENBQXFCLG1CQUFyQixFQUEwQyxnQkFBdEY7QUFDQSxVQUFJLFFBQUosYUFBdUIsSUFBdkIsa0JBQXlDLEtBQUssZUFBTCxDQUFxQixtQkFBckIsRUFBMEMsZ0JBQW5GO0FBQ0EsTUFQRCxNQU9PO0FBQ04sZUFBUyxhQUFULGFBQWlDLElBQWpDLHdCQUEwRCxTQUExRCxHQUFzRSxLQUFLLFFBQUwsQ0FBYyxtQkFBZCxFQUFtQyxJQUFuQyxDQUF3QyxRQUF4QyxDQUF0RTtBQUNBLFVBQUksV0FBSixhQUEwQixJQUExQixrQkFBNEMsS0FBSyxlQUFMLENBQXFCLG1CQUFyQixFQUEwQyxnQkFBdEYsRUFGTSxDQUVtRztBQUN6RyxVQUFJLFFBQUosYUFBdUIsSUFBdkIsa0JBQXlDLEtBQUssZUFBTCxDQUFxQixtQkFBckIsRUFBMEMsZ0JBQW5GLEVBSE0sQ0FHZ0c7QUFDdEc7QUFDRCxVQUFLLEtBQUwsR0FBYSxRQUFiOztBQUVBLFNBQUcsYUFBYSxDQUFoQixFQUFtQjtBQUNsQixlQUFTLGFBQVQsY0FBa0MsSUFBbEMsRUFBMEMsU0FBMUMsR0FBc0QsU0FBUyxhQUFULGNBQWtDLElBQWxDLEVBQTBDLFlBQWhHO0FBQ0EsVUFBRyxLQUFLLFlBQUwsQ0FBa0IsUUFBckIsRUFBK0I7QUFDOUIsZ0JBQVMsYUFBVCxjQUFrQyxLQUFsQyxFQUEyQyxTQUEzQyxHQUF1RCxTQUFTLGFBQVQsY0FBa0MsS0FBbEMsRUFBMkMsWUFBbEc7QUFDQTtBQUNELE1BTEQsTUFLTztBQUNOLGVBQVMsYUFBVCxjQUFrQyxJQUFsQyxFQUEwQyxTQUExQyxHQUFzRCxDQUF0RDtBQUNBLFVBQUcsS0FBSyxZQUFMLENBQWtCLFFBQXJCLEVBQStCO0FBQzlCLGdCQUFTLGFBQVQsY0FBa0MsS0FBbEMsRUFBMkMsU0FBM0MsR0FBdUQsQ0FBdkQ7QUFDQTtBQUNEO0FBQ0Q7O0FBRUQsUUFBRyxLQUFLLE1BQUwsQ0FBWSxVQUFmLEVBQTJCO0FBQzFCLFNBQUksT0FBSixDQUFZLG9CQUFaLENBQWlDLFFBQWpDO0FBQ0EsU0FBRyxLQUFLLFlBQUwsQ0FBa0IsUUFBckIsRUFBK0I7QUFDOUIsVUFBSSxPQUFKLENBQVksb0JBQVosQ0FBaUMsU0FBakM7QUFDQTtBQUNELEtBTEQsTUFLTztBQUNOLFNBQUksT0FBSixDQUFZLFVBQVosQ0FBdUIsUUFBdkI7QUFDQSxTQUFHLEtBQUssWUFBTCxDQUFrQixRQUFyQixFQUErQjtBQUM5QixVQUFJLE9BQUosQ0FBWSxVQUFaLENBQXVCLFNBQXZCO0FBQ0E7QUFDRDs7QUFFRDs7QUFFQSxRQUFHLEtBQUssS0FBTCxHQUFhLENBQWhCLEVBQW1CO0FBQ2xCLGNBQVMsUUFBVCxDQUFrQixTQUFsQixHQUFpQyxLQUFLLGVBQUwsQ0FBcUIsbUJBQXJCLEVBQTBDLG9CQUEzRSw0QkFBbUgsS0FBSyxLQUF4SDtBQUNBLFNBQUcsS0FBSyxZQUFMLENBQWtCLFFBQXJCLEVBQStCO0FBQzlCLFVBQUcsS0FBSyxZQUFMLENBQWtCLFFBQXJCLEVBQStCO0FBQzlCLGlCQUFVLFFBQVYsQ0FBbUIsU0FBbkIsR0FBa0MsS0FBSyxlQUFMLENBQXFCLHFCQUFyQixFQUE0QyxvQkFBOUUsNEJBQXNILEtBQUssS0FBM0g7QUFDQTtBQUNEO0FBQ0QsS0FQRCxNQU9PO0FBQ04sY0FBUyxRQUFULENBQWtCLFNBQWxCLEdBQThCLFFBQTlCO0FBQ0EsU0FBRyxLQUFLLFlBQUwsQ0FBa0IsUUFBckIsRUFBK0I7QUFDOUIsZ0JBQVUsUUFBVixDQUFtQixTQUFuQixHQUErQixRQUEvQjtBQUNBO0FBQ0Q7O0FBRUQ7O0FBRUEsUUFBSSxLQUFKLENBQVUsS0FBVjs7QUFFQTs7QUFFQSxRQUFHLEtBQUssWUFBTCxDQUFrQixRQUFyQixFQUErQjtBQUM5QixTQUFJLE9BQUosQ0FBWSxvQkFBWjtBQUNBOztBQUVEOztBQUVBLFFBQUksU0FBSixDQUFjLElBQWQ7QUFqTDhCO0FBa0w5QjtBQUNELEVBdjhCUTtBQXc4QlQsVUFBUyxpQkFBUyxPQUFULEVBQWtCO0FBQzFCLE1BQUksV0FBSixDQUFnQixPQUFoQixFQUF3QixJQUF4QjtBQUNBLE1BQUksUUFBSixDQUFhLFdBQVMsT0FBdEIsRUFBOEIsSUFBOUI7QUFDQSxPQUFLLFdBQUwsR0FBbUIsT0FBbkI7QUFDQSxNQUFHLFlBQVksTUFBZixFQUF1QjtBQUN0Qjs7QUFFQSxPQUFJLFdBQVcsU0FBUyxhQUFULENBQXVCLE1BQU0sT0FBTixHQUFnQixLQUF2QyxFQUE4QyxTQUE3RDtBQUNBLFFBQUssUUFBTCxDQUFjLFFBQWQsQ0FBdUIsU0FBdkIsR0FBbUMsUUFBbkM7QUFDQSxPQUFJLFFBQUosQ0FBYSxnQkFBYixFQUE4QixLQUE5QjtBQUNBLE9BQUksUUFBSixDQUFhLGlCQUFiLEVBQStCLEtBQS9COztBQUVBLE9BQUksUUFBSixDQUFhLGNBQWIsRUFBNEIsSUFBNUI7O0FBRUE7QUFFQSxHQVpELE1BWU87QUFDTixPQUFJLFdBQUosQ0FBZ0IsZ0JBQWhCLEVBQWlDLEtBQWpDO0FBQ0EsT0FBSSxXQUFKLENBQWdCLGlCQUFoQixFQUFrQyxLQUFsQzs7QUFFQSxPQUFJLFdBQUosQ0FBZ0IsY0FBaEIsRUFBK0IsSUFBL0I7O0FBRUE7O0FBRUEsT0FBSSxNQUFKO0FBQ0E7QUFDRCxFQWwrQlE7QUFtK0JULGFBQVksc0JBQVc7QUFDdEIsVUFBUSxHQUFSLENBQVksZUFBWjtBQUNBLE9BQUssVUFBTDs7QUFFQTtBQUVBLEVBeitCUTtBQTArQlQsYUFBWSxzQkFBVztBQUN0QixVQUFRLEdBQVIsQ0FBWSxpQkFBWjtBQUNBLE1BQUksVUFBVSxTQUFTLEdBQVQsQ0FBYSxPQUFiLENBQXNCLFNBQXRCLE1BQXNDLENBQUMsQ0FBdkMsSUFBNEMsU0FBUyxHQUFULENBQWEsT0FBYixDQUFzQixVQUF0QixNQUF1QyxDQUFDLENBQWxHO0FBQ0EsTUFBSSxjQUFjLEVBQUUsT0FBTyxPQUFQLEtBQW1CLFNBQXJCLENBQWxCLENBSHNCLENBRzZCO0FBQ25ELE1BQUcsV0FBVyxXQUFkLEVBQTJCO0FBQzFCLFlBQVMsZ0JBQVQsQ0FBMEIsYUFBMUIsRUFBeUMsSUFBSSxhQUE3QyxFQUE0RCxLQUE1RDtBQUNBLEdBRkQsTUFFTztBQUNOLE9BQUksS0FBSjtBQUNBOztBQUVELFNBQU8sZ0JBQVAsQ0FBd0IsUUFBeEIsRUFBa0MsS0FBSyxNQUF2QyxFQUErQyxLQUEvQzs7QUFFQTs7QUFFQSxNQUFJLHNCQUFzQixRQUExQixFQUFvQztBQUNuQyxZQUFTLGdCQUFULENBQTBCLGtCQUExQixFQUE4QyxZQUFNO0FBQ25ELGNBQVUsU0FBUyxJQUFuQjtBQUNBLElBRkQsRUFFRyxLQUZIO0FBR0E7QUFDRCxFQTcvQlE7QUE4L0JULGdCQUFlLHlCQUFXO0FBQ3pCLE9BQUssTUFBTCxDQUFZLFNBQVosR0FBd0IsSUFBeEIsQ0FEeUIsQ0FDVTtBQUNuQyxPQUFLLE1BQUwsQ0FBWSxRQUFaLEdBQXVCLE9BQU8sT0FBOUIsQ0FGeUIsQ0FFYztBQUN2QyxVQUFRLEdBQVIsQ0FBWSxPQUFPLE9BQW5CO0FBQ0EsVUFBUSxHQUFSLENBQVksZ0NBQWdDLEtBQUssTUFBTCxDQUFZLFFBQXhEO0FBQ0EsTUFBSSxLQUFKO0FBQ0EsRUFwZ0NRO0FBcWdDVCxRQUFPLGlCQUFXO0FBQ2pCLFVBQVEsR0FBUixDQUFZLFVBQVo7O0FBRUE7O0FBRUEsT0FBSyxRQUFMLENBQWMsSUFBZCxHQUFxQixTQUFTLGNBQVQsQ0FBd0IsTUFBeEIsQ0FBckI7QUFDQSxPQUFLLFFBQUwsQ0FBYyxJQUFkLEdBQXFCLFNBQVMsY0FBVCxDQUF3QixNQUF4QixDQUFyQjtBQUNBLE9BQUssUUFBTCxDQUFjLE9BQWQsR0FBd0IsU0FBUyxjQUFULENBQXdCLFNBQXhCLENBQXhCO0FBQ0EsT0FBSyxRQUFMLENBQWMsUUFBZCxHQUF5QixTQUFTLGFBQVQsQ0FBdUIsd0JBQXZCLENBQXpCOztBQUVBLE9BQUssSUFBTCxDQUFVLElBQVYsQ0FBZSxNQUFmLEdBQXdCLFNBQVMsY0FBVCxDQUF3QixZQUF4QixDQUF4QjtBQUNBLE9BQUssSUFBTCxDQUFVLElBQVYsQ0FBZSxJQUFmLEdBQXNCLFNBQVMsYUFBVCxDQUF1Qix3QkFBdkIsQ0FBdEI7QUFDQSxPQUFLLElBQUwsQ0FBVSxJQUFWLENBQWUsVUFBZixHQUE0QixTQUFTLGFBQVQsQ0FBdUIsOEJBQXZCLENBQTVCO0FBQ0EsT0FBSyxJQUFMLENBQVUsSUFBVixDQUFlLFFBQWYsR0FBMEIsU0FBUyxhQUFULENBQXVCLHVCQUF2QixDQUExQjs7QUFFQSxPQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLE1BQWhCLEdBQXlCLFNBQVMsY0FBVCxDQUF3QixhQUF4QixDQUF6QjtBQUNBLE9BQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsSUFBaEIsR0FBdUIsU0FBUyxhQUFULENBQXVCLHlCQUF2QixDQUF2QjtBQUNBLE9BQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsVUFBaEIsR0FBNkIsU0FBUyxhQUFULENBQXVCLCtCQUF2QixDQUE3QjtBQUNBLE9BQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsUUFBaEIsR0FBMkIsU0FBUyxhQUFULENBQXVCLHdCQUF2QixDQUEzQjs7QUFHQSxXQUFTLEtBQVQsR0FBaUIsaUJBQWlCLEtBQUssU0FBdkM7O0FBRUEsTUFBRyxLQUFLLFlBQUwsQ0FBa0IsU0FBckIsRUFBZ0M7QUFDL0IsT0FBSSxRQUFKLENBQWEsTUFBYixFQUFvQixXQUFwQjtBQUNBLEdBRkQsTUFFTztBQUNOLE9BQUksV0FBSixDQUFnQixNQUFoQixFQUF1QixXQUF2QjtBQUNBOztBQUVEOztBQUVBLE9BQUksSUFBSSxDQUFSLElBQWEsS0FBSyxlQUFsQixFQUFtQztBQUNsQyxRQUFLLHNCQUFMLENBQTRCLElBQTVCLENBQWlDLEtBQUssZUFBTCxDQUFxQixDQUFyQixFQUF3QixhQUF6RDtBQUNBLFlBQVMsY0FBVCxDQUF3QixhQUF4QixFQUF1QyxTQUF2QyxhQUEyRCxLQUFLLGVBQUwsQ0FBcUIsQ0FBckIsRUFBd0IsbUJBQW5GLGNBQStHLEtBQUssZUFBTCxDQUFxQixDQUFyQixFQUF3QixLQUF2SSxlQUFzSixLQUFLLGVBQUwsQ0FBcUIsQ0FBckIsRUFBd0IsTUFBOUs7QUFDQTs7QUFFRCxPQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLFdBQWhCLEdBQThCLEtBQUssc0JBQUwsQ0FBNEIsQ0FBNUIsQ0FBOUI7QUFDQSxNQUFHLENBQUMsS0FBSyxNQUFMLENBQVksU0FBaEIsRUFBMkI7QUFDMUI7QUFDQTtBQUNBLFVBQU8sZ0JBQVAsQ0FBd0IsTUFBeEIsRUFBZ0MsWUFBVztBQUMxQyxRQUFJLDRCQUE0QixLQUFoQztBQUNBLFFBQUksYUFBYSxDQUFqQjtBQUNBLFFBQUksb0JBQW9CLFNBQXBCLGlCQUFvQixDQUFTLENBQVQsRUFBWTtBQUNuQyxTQUFJLEVBQUUsT0FBRixDQUFVLE1BQVYsSUFBb0IsQ0FBeEIsRUFBMkI7QUFDM0Isa0JBQWEsRUFBRSxPQUFGLENBQVUsQ0FBVixFQUFhLE9BQTFCO0FBQ0E7QUFDQTtBQUNBLGlDQUE0QixPQUFPLFdBQVAsSUFBc0IsQ0FBbEQ7QUFDQSxLQU5EOztBQVFBLFFBQUksbUJBQW1CLFNBQW5CLGdCQUFtQixDQUFTLENBQVQsRUFBWTtBQUNsQyxTQUFJLFNBQVMsRUFBRSxPQUFGLENBQVUsQ0FBVixFQUFhLE9BQTFCO0FBQ0EsU0FBSSxjQUFjLFNBQVMsVUFBM0I7QUFDQSxrQkFBYSxNQUFiOztBQUVBLFNBQUkseUJBQUosRUFBK0I7QUFDOUI7QUFDQTtBQUNBLGtDQUE0QixLQUE1QjtBQUNBLFVBQUksY0FBYyxDQUFsQixFQUFxQjtBQUNwQixTQUFFLGNBQUY7O0FBRUEsV0FBRyxLQUFLLFdBQUwsSUFBb0IsTUFBcEIsSUFBOEIsS0FBSyxJQUFMLENBQVUsS0FBVixDQUFnQixJQUFoQixDQUFxQixTQUFyQixHQUFpQyxDQUFsRSxFQUFxRTtBQUNwRSxZQUFJLE9BQUosQ0FBWSxLQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLFdBQTVCLEVBQXlDLEtBQUssS0FBTCxHQUFXLENBQXBELEVBQXNELE9BQXRELEVBQThELENBQTlEO0FBQ0E7QUFDRDtBQUNBO0FBQ0Q7QUFDRCxLQWxCRDtBQW1CQSxhQUFTLGdCQUFULENBQTBCLFlBQTFCLEVBQXdDLGlCQUF4QyxFQUEyRCxLQUEzRDtBQUNBLGFBQVMsZ0JBQVQsQ0FBMEIsV0FBMUIsRUFBdUMsZ0JBQXZDLEVBQXlELEtBQXpEO0FBQ0EsSUFoQ0Q7QUFpQ0E7O0FBRUQsTUFBSSxRQUFKLENBQWEsS0FBYixHQTNFaUIsQ0EyRU07QUFDdkIsTUFBSSxTQUFKLENBQWMsSUFBZCxHQTVFaUIsQ0E0RU07QUFDdkIsTUFBSSxRQUFKLENBQWEsTUFBYixFQUFvQixLQUFLLFFBQXpCO0FBQ0EsTUFBSSxRQUFKLENBQWEsTUFBYixFQUFvQixLQUFLLE1BQUwsQ0FBWSxTQUFaLEdBQXdCLFNBQXhCLEdBQW9DLEtBQXhEO0FBQ0EsTUFBSSxnQkFBSixDQUFxQixlQUFyQjtBQUNBLE1BQUksT0FBSixDQUFZLE1BQVosRUFoRmlCLENBZ0ZJO0FBQ3JCO0FBdGxDUSxDQUFWOztBQXlsQ0EsT0FBTyxPQUFQLEdBQWlCLEdBQWpCOzs7OztBQ3BtQ0E7O0FBRUEsT0FBTyxPQUFQLEdBQWlCO0FBQ2hCLHlCQUF3QixFQURSLEVBQ2tCO0FBQ2xDLGNBQWEsT0FBTyxVQUZKLEVBRWtCO0FBQ2xDLGVBQWMsT0FBTyxXQUhMLEVBR21CO0FBQ25DLGNBQWEsTUFKRyxFQUlZO0FBQzVCLFFBQU8sQ0FMUyxFQUtPO0FBQ3ZCLFdBQVU7QUFDVCxRQUFNLFNBQVMsY0FBVCxDQUF3QixNQUF4QixDQURHO0FBRVQsUUFBTSxTQUFTLGNBQVQsQ0FBd0IsTUFBeEIsQ0FGRztBQUdULFdBQVMsU0FBUyxjQUFULENBQXdCLFNBQXhCLENBSEE7QUFJVCxjQUFZLEVBSkg7QUFLVCxlQUFhO0FBTEosRUFOTTtBQWFoQixPQUFNO0FBQ0wsU0FBTyxPQUFPLFVBRFQsRUFDeUI7QUFDOUIsVUFBUSxPQUFPLFdBQVAsR0FBcUIsRUFGeEIsRUFFNEI7QUFDakMsUUFBTTtBQUNMLGdCQUFhLEVBRFIsRUFDYztBQUNuQixlQUFZLEVBRlAsRUFFYTtBQUNsQixlQUFZLENBSFAsRUFHYTtBQUNsQixVQUFPLENBSkYsRUFJYTtBQUNsQixVQUFPLENBTEYsRUFLVTtBQUNmLGFBQVUsU0FBUyxhQUFULENBQXVCLHVCQUF2QixDQU5MO0FBT0wsV0FBUSxTQUFTLGNBQVQsQ0FBd0IsYUFBeEIsQ0FQSDtBQVFMLGVBQVksU0FBUyxhQUFULENBQXVCLDhCQUF2QixDQVJQO0FBU0wsU0FBTSxTQUFTLGNBQVQsQ0FBd0Isd0JBQXhCO0FBVEQsR0FIRDtBQWNMLFNBQU87QUFDTixnQkFBYSxFQURQLEVBQ2lCO0FBQ3ZCLGVBQVksRUFGTixFQUVnQjtBQUN0QixlQUFZLENBSE4sRUFHZ0I7QUFDdEIsVUFBTyxDQUpELEVBSWdCO0FBQ3RCLFVBQU8sT0FBTyxVQUxSLEVBS3FCO0FBQzNCLGFBQVUsU0FBUyxhQUFULENBQXVCLHdCQUF2QixDQU5KO0FBT04sV0FBUSxTQUFTLGNBQVQsQ0FBd0IsY0FBeEIsQ0FQRjtBQVFOLGVBQVksU0FBUyxhQUFULENBQXVCLCtCQUF2QixDQVJOO0FBU04sU0FBTSxTQUFTLGNBQVQsQ0FBd0IseUJBQXhCO0FBVEE7QUFkRixFQWJVO0FBdUNoQixTQUFRO0FBQ1AsY0FBWSxJQURMLEVBQ1c7QUFDbEIsYUFBVyxLQUZKLEVBRVc7QUFDbEIsWUFBVSxFQUhILEVBR1M7QUFDaEIsU0FBTyxHQUpBLENBSU87QUFKUCxFQXZDUTtBQTZDaEIsZUFBYyxFQUFJO0FBQ2pCLFlBQVUsS0FERyxFQUNJO0FBQ2pCLGFBQVcsS0FGRSxFQUVLO0FBQ2xCLGFBQVcsSUFIRSxDQUdJO0FBSEosRUE3Q0U7O0FBbURoQjs7QUFFQSxXQUFVLEVBckRNLEVBcURFO0FBQ2xCLFlBQVcsRUF0REssRUFzREU7QUFDbEIsYUFBWSxFQXZESSxFQXVERztBQUNuQixpQkFBZ0IsRUF4REEsRUF3REs7QUFDckIsYUFBWSxFQXpESSxFQXlERztBQUNuQixtQkFBa0IsQ0ExREYsRUEwREs7QUFDckIsYUFBWSxDQTNESSxFQTJERTtBQUNsQixXQUFVLEVBNURNO0FBNkRoQixrQkFBaUIsRUE3REQ7QUE4RGhCLGNBQWEsRUE5REcsQ0E4REc7QUE5REgsQ0FBakI7OztBQ0ZBOztBQUVBOztBQUVBLElBQU0sTUFBTTtBQUNYLFNBQVEsZ0JBQVMsT0FBVCxFQUFrQjtBQUN6QixNQUFJLE9BQU8sU0FBUyxzQkFBVCxFQUFYO0FBQ0EsTUFBSSxPQUFPLFNBQVMsYUFBVCxDQUF1QixLQUF2QixDQUFYO0FBQ0EsT0FBSyxTQUFMLEdBQWlCLE9BQWpCO0FBQ0EsU0FBTyxLQUFLLFVBQVosRUFBd0I7QUFDdkIsUUFBSyxXQUFMLENBQWlCLEtBQUssVUFBdEI7QUFDQTtBQUNELFNBQU8sSUFBUDtBQUNBLEVBVFU7QUFVWCxtQkFBa0IsMEJBQVMsY0FBVCxFQUF5QjtBQUMxQyxNQUFJLFdBQVcsU0FBUyxhQUFULENBQXVCLGNBQXZCLENBQWY7QUFDQSxNQUFHLGFBQWEsSUFBaEIsRUFBc0I7QUFDckIsWUFBUyxVQUFULENBQW9CLFdBQXBCLENBQWdDLFFBQWhDO0FBQ0E7QUFDRCxFQWZVO0FBZ0JYLFdBQVUsa0JBQVMsY0FBVCxFQUF5QixPQUF6QixFQUFrQztBQUMzQyxNQUFJLFlBQVksU0FBUyxnQkFBVCxDQUEwQixjQUExQixDQUFoQjtBQUNBLE1BQUcsUUFBUSxPQUFSLENBQWdCLEdBQWhCLElBQXVCLENBQUMsQ0FBM0IsRUFBOEI7QUFDN0IsT0FBSSxVQUFVLFFBQVEsS0FBUixDQUFjLEdBQWQsQ0FBZDtBQUNBLFFBQUksSUFBSSxJQUFJLENBQVosRUFBZSxJQUFJLFFBQVEsTUFBM0IsRUFBbUMsR0FBbkMsRUFBd0M7QUFDdkMsUUFBSSxRQUFKLENBQWEsY0FBYixFQUE2QixRQUFRLENBQVIsQ0FBN0I7QUFDQTtBQUNELEdBTEQsTUFLTztBQUNOLFFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxVQUFVLE1BQTlCLEVBQXNDLEdBQXRDLEVBQTJDO0FBQzFDLGNBQVUsQ0FBVixFQUFhLFNBQWIsQ0FBdUIsR0FBdkIsQ0FBMkIsT0FBM0I7QUFDQTtBQUNEO0FBQ0QsRUE1QlU7QUE2QlgsY0FBYSxxQkFBUyxjQUFULEVBQXlCLE9BQXpCLEVBQWtDO0FBQzlDLE1BQUksWUFBWSxTQUFTLGdCQUFULENBQTBCLGNBQTFCLENBQWhCO0FBQ0EsTUFBRyxRQUFRLE9BQVIsQ0FBZ0IsR0FBaEIsSUFBdUIsQ0FBQyxDQUEzQixFQUE4QjtBQUM3QixPQUFJLFVBQVUsUUFBUSxLQUFSLENBQWMsR0FBZCxDQUFkO0FBQ0EsUUFBSSxJQUFJLElBQUksQ0FBWixFQUFlLElBQUksUUFBUSxNQUEzQixFQUFtQyxHQUFuQyxFQUF3QztBQUN2QyxRQUFJLFdBQUosQ0FBZ0IsY0FBaEIsRUFBZ0MsUUFBUSxDQUFSLENBQWhDO0FBQ0E7QUFDRCxHQUxELE1BS087QUFDTixRQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksVUFBVSxNQUE5QixFQUFzQyxHQUF0QyxFQUEyQztBQUMxQyxjQUFVLENBQVYsRUFBYSxTQUFiLENBQXVCLE1BQXZCLENBQThCLE9BQTlCO0FBQ0E7QUFDRDtBQUNELEVBekNVO0FBMENYLFdBQVUsa0JBQVMsT0FBVCxFQUFrQixHQUFsQixFQUF1QjtBQUNoQyxTQUFPLENBQUMsTUFBTSxRQUFRLFNBQWQsR0FBMEIsR0FBM0IsRUFBZ0MsT0FBaEMsQ0FBd0MsTUFBTSxHQUFOLEdBQVksR0FBcEQsSUFBMkQsQ0FBQyxDQUFuRTtBQUNBO0FBNUNVLENBQVo7O0FBK0NBLE9BQU8sT0FBUCxHQUFpQixHQUFqQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCI7KGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdC8qKlxuXHQgKiBAcHJlc2VydmUgRmFzdENsaWNrOiBwb2x5ZmlsbCB0byByZW1vdmUgY2xpY2sgZGVsYXlzIG9uIGJyb3dzZXJzIHdpdGggdG91Y2ggVUlzLlxuXHQgKlxuXHQgKiBAY29kaW5nc3RhbmRhcmQgZnRsYWJzLWpzdjJcblx0ICogQGNvcHlyaWdodCBUaGUgRmluYW5jaWFsIFRpbWVzIExpbWl0ZWQgW0FsbCBSaWdodHMgUmVzZXJ2ZWRdXG5cdCAqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChzZWUgTElDRU5TRS50eHQpXG5cdCAqL1xuXG5cdC8qanNsaW50IGJyb3dzZXI6dHJ1ZSwgbm9kZTp0cnVlKi9cblx0LypnbG9iYWwgZGVmaW5lLCBFdmVudCwgTm9kZSovXG5cblxuXHQvKipcblx0ICogSW5zdGFudGlhdGUgZmFzdC1jbGlja2luZyBsaXN0ZW5lcnMgb24gdGhlIHNwZWNpZmllZCBsYXllci5cblx0ICpcblx0ICogQGNvbnN0cnVjdG9yXG5cdCAqIEBwYXJhbSB7RWxlbWVudH0gbGF5ZXIgVGhlIGxheWVyIHRvIGxpc3RlbiBvblxuXHQgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIFRoZSBvcHRpb25zIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0c1xuXHQgKi9cblx0ZnVuY3Rpb24gRmFzdENsaWNrKGxheWVyLCBvcHRpb25zKSB7XG5cdFx0dmFyIG9sZE9uQ2xpY2s7XG5cblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuXHRcdC8qKlxuXHRcdCAqIFdoZXRoZXIgYSBjbGljayBpcyBjdXJyZW50bHkgYmVpbmcgdHJhY2tlZC5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIGJvb2xlYW5cblx0XHQgKi9cblx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblxuXG5cdFx0LyoqXG5cdFx0ICogVGltZXN0YW1wIGZvciB3aGVuIGNsaWNrIHRyYWNraW5nIHN0YXJ0ZWQuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRyYWNraW5nQ2xpY2tTdGFydCA9IDA7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBlbGVtZW50IGJlaW5nIHRyYWNrZWQgZm9yIGEgY2xpY2suXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBFdmVudFRhcmdldFxuXHRcdCAqL1xuXHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFgtY29vcmRpbmF0ZSBvZiB0b3VjaCBzdGFydCBldmVudC5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudG91Y2hTdGFydFggPSAwO1xuXG5cblx0XHQvKipcblx0XHQgKiBZLWNvb3JkaW5hdGUgb2YgdG91Y2ggc3RhcnQgZXZlbnQuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRvdWNoU3RhcnRZID0gMDtcblxuXG5cdFx0LyoqXG5cdFx0ICogSUQgb2YgdGhlIGxhc3QgdG91Y2gsIHJldHJpZXZlZCBmcm9tIFRvdWNoLmlkZW50aWZpZXIuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLmxhc3RUb3VjaElkZW50aWZpZXIgPSAwO1xuXG5cblx0XHQvKipcblx0XHQgKiBUb3VjaG1vdmUgYm91bmRhcnksIGJleW9uZCB3aGljaCBhIGNsaWNrIHdpbGwgYmUgY2FuY2VsbGVkLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50b3VjaEJvdW5kYXJ5ID0gb3B0aW9ucy50b3VjaEJvdW5kYXJ5IHx8IDEwO1xuXG5cblx0XHQvKipcblx0XHQgKiBUaGUgRmFzdENsaWNrIGxheWVyLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgRWxlbWVudFxuXHRcdCAqL1xuXHRcdHRoaXMubGF5ZXIgPSBsYXllcjtcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBtaW5pbXVtIHRpbWUgYmV0d2VlbiB0YXAodG91Y2hzdGFydCBhbmQgdG91Y2hlbmQpIGV2ZW50c1xuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50YXBEZWxheSA9IG9wdGlvbnMudGFwRGVsYXkgfHwgMjAwO1xuXG5cdFx0LyoqXG5cdFx0ICogVGhlIG1heGltdW0gdGltZSBmb3IgYSB0YXBcblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudGFwVGltZW91dCA9IG9wdGlvbnMudGFwVGltZW91dCB8fCA3MDA7XG5cblx0XHRpZiAoRmFzdENsaWNrLm5vdE5lZWRlZChsYXllcikpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBTb21lIG9sZCB2ZXJzaW9ucyBvZiBBbmRyb2lkIGRvbid0IGhhdmUgRnVuY3Rpb24ucHJvdG90eXBlLmJpbmRcblx0XHRmdW5jdGlvbiBiaW5kKG1ldGhvZCwgY29udGV4dCkge1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCkgeyByZXR1cm4gbWV0aG9kLmFwcGx5KGNvbnRleHQsIGFyZ3VtZW50cyk7IH07XG5cdFx0fVxuXG5cblx0XHR2YXIgbWV0aG9kcyA9IFsnb25Nb3VzZScsICdvbkNsaWNrJywgJ29uVG91Y2hTdGFydCcsICdvblRvdWNoTW92ZScsICdvblRvdWNoRW5kJywgJ29uVG91Y2hDYW5jZWwnXTtcblx0XHR2YXIgY29udGV4dCA9IHRoaXM7XG5cdFx0Zm9yICh2YXIgaSA9IDAsIGwgPSBtZXRob2RzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuXHRcdFx0Y29udGV4dFttZXRob2RzW2ldXSA9IGJpbmQoY29udGV4dFttZXRob2RzW2ldXSwgY29udGV4dCk7XG5cdFx0fVxuXG5cdFx0Ly8gU2V0IHVwIGV2ZW50IGhhbmRsZXJzIGFzIHJlcXVpcmVkXG5cdFx0aWYgKGRldmljZUlzQW5kcm9pZCkge1xuXHRcdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHR9XG5cblx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMub25DbGljaywgdHJ1ZSk7XG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMub25Ub3VjaFN0YXJ0LCBmYWxzZSk7XG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5vblRvdWNoTW92ZSwgZmFsc2UpO1xuXHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5vblRvdWNoRW5kLCBmYWxzZSk7XG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0aGlzLm9uVG91Y2hDYW5jZWwsIGZhbHNlKTtcblxuXHRcdC8vIEhhY2sgaXMgcmVxdWlyZWQgZm9yIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBFdmVudCNzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gKGUuZy4gQW5kcm9pZCAyKVxuXHRcdC8vIHdoaWNoIGlzIGhvdyBGYXN0Q2xpY2sgbm9ybWFsbHkgc3RvcHMgY2xpY2sgZXZlbnRzIGJ1YmJsaW5nIHRvIGNhbGxiYWNrcyByZWdpc3RlcmVkIG9uIHRoZSBGYXN0Q2xpY2tcblx0XHQvLyBsYXllciB3aGVuIHRoZXkgYXJlIGNhbmNlbGxlZC5cblx0XHRpZiAoIUV2ZW50LnByb3RvdHlwZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24pIHtcblx0XHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBjYWxsYmFjaywgY2FwdHVyZSkge1xuXHRcdFx0XHR2YXIgcm12ID0gTm9kZS5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lcjtcblx0XHRcdFx0aWYgKHR5cGUgPT09ICdjbGljaycpIHtcblx0XHRcdFx0XHRybXYuY2FsbChsYXllciwgdHlwZSwgY2FsbGJhY2suaGlqYWNrZWQgfHwgY2FsbGJhY2ssIGNhcHR1cmUpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJtdi5jYWxsKGxheWVyLCB0eXBlLCBjYWxsYmFjaywgY2FwdHVyZSk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBjYWxsYmFjaywgY2FwdHVyZSkge1xuXHRcdFx0XHR2YXIgYWR2ID0gTm9kZS5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lcjtcblx0XHRcdFx0aWYgKHR5cGUgPT09ICdjbGljaycpIHtcblx0XHRcdFx0XHRhZHYuY2FsbChsYXllciwgdHlwZSwgY2FsbGJhY2suaGlqYWNrZWQgfHwgKGNhbGxiYWNrLmhpamFja2VkID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRcdFx0XHRcdGlmICghZXZlbnQucHJvcGFnYXRpb25TdG9wcGVkKSB7XG5cdFx0XHRcdFx0XHRcdGNhbGxiYWNrKGV2ZW50KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KSwgY2FwdHVyZSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YWR2LmNhbGwobGF5ZXIsIHR5cGUsIGNhbGxiYWNrLCBjYXB0dXJlKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHQvLyBJZiBhIGhhbmRsZXIgaXMgYWxyZWFkeSBkZWNsYXJlZCBpbiB0aGUgZWxlbWVudCdzIG9uY2xpY2sgYXR0cmlidXRlLCBpdCB3aWxsIGJlIGZpcmVkIGJlZm9yZVxuXHRcdC8vIEZhc3RDbGljaydzIG9uQ2xpY2sgaGFuZGxlci4gRml4IHRoaXMgYnkgcHVsbGluZyBvdXQgdGhlIHVzZXItZGVmaW5lZCBoYW5kbGVyIGZ1bmN0aW9uIGFuZFxuXHRcdC8vIGFkZGluZyBpdCBhcyBsaXN0ZW5lci5cblx0XHRpZiAodHlwZW9mIGxheWVyLm9uY2xpY2sgPT09ICdmdW5jdGlvbicpIHtcblxuXHRcdFx0Ly8gQW5kcm9pZCBicm93c2VyIG9uIGF0IGxlYXN0IDMuMiByZXF1aXJlcyBhIG5ldyByZWZlcmVuY2UgdG8gdGhlIGZ1bmN0aW9uIGluIGxheWVyLm9uY2xpY2tcblx0XHRcdC8vIC0gdGhlIG9sZCBvbmUgd29uJ3Qgd29yayBpZiBwYXNzZWQgdG8gYWRkRXZlbnRMaXN0ZW5lciBkaXJlY3RseS5cblx0XHRcdG9sZE9uQ2xpY2sgPSBsYXllci5vbmNsaWNrO1xuXHRcdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHRvbGRPbkNsaWNrKGV2ZW50KTtcblx0XHRcdH0sIGZhbHNlKTtcblx0XHRcdGxheWVyLm9uY2xpY2sgPSBudWxsO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQqIFdpbmRvd3MgUGhvbmUgOC4xIGZha2VzIHVzZXIgYWdlbnQgc3RyaW5nIHRvIGxvb2sgbGlrZSBBbmRyb2lkIGFuZCBpUGhvbmUuXG5cdCpcblx0KiBAdHlwZSBib29sZWFuXG5cdCovXG5cdHZhciBkZXZpY2VJc1dpbmRvd3NQaG9uZSA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIldpbmRvd3MgUGhvbmVcIikgPj0gMDtcblxuXHQvKipcblx0ICogQW5kcm9pZCByZXF1aXJlcyBleGNlcHRpb25zLlxuXHQgKlxuXHQgKiBAdHlwZSBib29sZWFuXG5cdCAqL1xuXHR2YXIgZGV2aWNlSXNBbmRyb2lkID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdBbmRyb2lkJykgPiAwICYmICFkZXZpY2VJc1dpbmRvd3NQaG9uZTtcblxuXG5cdC8qKlxuXHQgKiBpT1MgcmVxdWlyZXMgZXhjZXB0aW9ucy5cblx0ICpcblx0ICogQHR5cGUgYm9vbGVhblxuXHQgKi9cblx0dmFyIGRldmljZUlzSU9TID0gL2lQKGFkfGhvbmV8b2QpLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICYmICFkZXZpY2VJc1dpbmRvd3NQaG9uZTtcblxuXG5cdC8qKlxuXHQgKiBpT1MgNCByZXF1aXJlcyBhbiBleGNlcHRpb24gZm9yIHNlbGVjdCBlbGVtZW50cy5cblx0ICpcblx0ICogQHR5cGUgYm9vbGVhblxuXHQgKi9cblx0dmFyIGRldmljZUlzSU9TNCA9IGRldmljZUlzSU9TICYmICgvT1MgNF9cXGQoX1xcZCk/LykudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcblxuXG5cdC8qKlxuXHQgKiBpT1MgNi4wLTcuKiByZXF1aXJlcyB0aGUgdGFyZ2V0IGVsZW1lbnQgdG8gYmUgbWFudWFsbHkgZGVyaXZlZFxuXHQgKlxuXHQgKiBAdHlwZSBib29sZWFuXG5cdCAqL1xuXHR2YXIgZGV2aWNlSXNJT1NXaXRoQmFkVGFyZ2V0ID0gZGV2aWNlSXNJT1MgJiYgKC9PUyBbNi03XV9cXGQvKS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuXG5cdC8qKlxuXHQgKiBCbGFja0JlcnJ5IHJlcXVpcmVzIGV4Y2VwdGlvbnMuXG5cdCAqXG5cdCAqIEB0eXBlIGJvb2xlYW5cblx0ICovXG5cdHZhciBkZXZpY2VJc0JsYWNrQmVycnkxMCA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignQkIxMCcpID4gMDtcblxuXHQvKipcblx0ICogRGV0ZXJtaW5lIHdoZXRoZXIgYSBnaXZlbiBlbGVtZW50IHJlcXVpcmVzIGEgbmF0aXZlIGNsaWNrLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEVsZW1lbnR9IHRhcmdldCBUYXJnZXQgRE9NIGVsZW1lbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiB0aGUgZWxlbWVudCBuZWVkcyBhIG5hdGl2ZSBjbGlja1xuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5uZWVkc0NsaWNrID0gZnVuY3Rpb24odGFyZ2V0KSB7XG5cdFx0c3dpdGNoICh0YXJnZXQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xuXG5cdFx0Ly8gRG9uJ3Qgc2VuZCBhIHN5bnRoZXRpYyBjbGljayB0byBkaXNhYmxlZCBpbnB1dHMgKGlzc3VlICM2Milcblx0XHRjYXNlICdidXR0b24nOlxuXHRcdGNhc2UgJ3NlbGVjdCc6XG5cdFx0Y2FzZSAndGV4dGFyZWEnOlxuXHRcdFx0aWYgKHRhcmdldC5kaXNhYmxlZCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAnaW5wdXQnOlxuXG5cdFx0XHQvLyBGaWxlIGlucHV0cyBuZWVkIHJlYWwgY2xpY2tzIG9uIGlPUyA2IGR1ZSB0byBhIGJyb3dzZXIgYnVnIChpc3N1ZSAjNjgpXG5cdFx0XHRpZiAoKGRldmljZUlzSU9TICYmIHRhcmdldC50eXBlID09PSAnZmlsZScpIHx8IHRhcmdldC5kaXNhYmxlZCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAnbGFiZWwnOlxuXHRcdGNhc2UgJ2lmcmFtZSc6IC8vIGlPUzggaG9tZXNjcmVlbiBhcHBzIGNhbiBwcmV2ZW50IGV2ZW50cyBidWJibGluZyBpbnRvIGZyYW1lc1xuXHRcdGNhc2UgJ3ZpZGVvJzpcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiAoL1xcYm5lZWRzY2xpY2tcXGIvKS50ZXN0KHRhcmdldC5jbGFzc05hbWUpO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIERldGVybWluZSB3aGV0aGVyIGEgZ2l2ZW4gZWxlbWVudCByZXF1aXJlcyBhIGNhbGwgdG8gZm9jdXMgdG8gc2ltdWxhdGUgY2xpY2sgaW50byBlbGVtZW50LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEVsZW1lbnR9IHRhcmdldCBUYXJnZXQgRE9NIGVsZW1lbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiB0aGUgZWxlbWVudCByZXF1aXJlcyBhIGNhbGwgdG8gZm9jdXMgdG8gc2ltdWxhdGUgbmF0aXZlIGNsaWNrLlxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5uZWVkc0ZvY3VzID0gZnVuY3Rpb24odGFyZ2V0KSB7XG5cdFx0c3dpdGNoICh0YXJnZXQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xuXHRcdGNhc2UgJ3RleHRhcmVhJzpcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdGNhc2UgJ3NlbGVjdCc6XG5cdFx0XHRyZXR1cm4gIWRldmljZUlzQW5kcm9pZDtcblx0XHRjYXNlICdpbnB1dCc6XG5cdFx0XHRzd2l0Y2ggKHRhcmdldC50eXBlKSB7XG5cdFx0XHRjYXNlICdidXR0b24nOlxuXHRcdFx0Y2FzZSAnY2hlY2tib3gnOlxuXHRcdFx0Y2FzZSAnZmlsZSc6XG5cdFx0XHRjYXNlICdpbWFnZSc6XG5cdFx0XHRjYXNlICdyYWRpbyc6XG5cdFx0XHRjYXNlICdzdWJtaXQnOlxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdC8vIE5vIHBvaW50IGluIGF0dGVtcHRpbmcgdG8gZm9jdXMgZGlzYWJsZWQgaW5wdXRzXG5cdFx0XHRyZXR1cm4gIXRhcmdldC5kaXNhYmxlZCAmJiAhdGFyZ2V0LnJlYWRPbmx5O1xuXHRcdGRlZmF1bHQ6XG5cdFx0XHRyZXR1cm4gKC9cXGJuZWVkc2ZvY3VzXFxiLykudGVzdCh0YXJnZXQuY2xhc3NOYW1lKTtcblx0XHR9XG5cdH07XG5cblxuXHQvKipcblx0ICogU2VuZCBhIGNsaWNrIGV2ZW50IHRvIHRoZSBzcGVjaWZpZWQgZWxlbWVudC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxFbGVtZW50fSB0YXJnZXRFbGVtZW50XG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLnNlbmRDbGljayA9IGZ1bmN0aW9uKHRhcmdldEVsZW1lbnQsIGV2ZW50KSB7XG5cdFx0dmFyIGNsaWNrRXZlbnQsIHRvdWNoO1xuXG5cdFx0Ly8gT24gc29tZSBBbmRyb2lkIGRldmljZXMgYWN0aXZlRWxlbWVudCBuZWVkcyB0byBiZSBibHVycmVkIG90aGVyd2lzZSB0aGUgc3ludGhldGljIGNsaWNrIHdpbGwgaGF2ZSBubyBlZmZlY3QgKCMyNClcblx0XHRpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50ICE9PSB0YXJnZXRFbGVtZW50KSB7XG5cdFx0XHRkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKTtcblx0XHR9XG5cblx0XHR0b3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdO1xuXG5cdFx0Ly8gU3ludGhlc2lzZSBhIGNsaWNrIGV2ZW50LCB3aXRoIGFuIGV4dHJhIGF0dHJpYnV0ZSBzbyBpdCBjYW4gYmUgdHJhY2tlZFxuXHRcdGNsaWNrRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnTW91c2VFdmVudHMnKTtcblx0XHRjbGlja0V2ZW50LmluaXRNb3VzZUV2ZW50KHRoaXMuZGV0ZXJtaW5lRXZlbnRUeXBlKHRhcmdldEVsZW1lbnQpLCB0cnVlLCB0cnVlLCB3aW5kb3csIDEsIHRvdWNoLnNjcmVlblgsIHRvdWNoLnNjcmVlblksIHRvdWNoLmNsaWVudFgsIHRvdWNoLmNsaWVudFksIGZhbHNlLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCAwLCBudWxsKTtcblx0XHRjbGlja0V2ZW50LmZvcndhcmRlZFRvdWNoRXZlbnQgPSB0cnVlO1xuXHRcdHRhcmdldEVsZW1lbnQuZGlzcGF0Y2hFdmVudChjbGlja0V2ZW50KTtcblx0fTtcblxuXHRGYXN0Q2xpY2sucHJvdG90eXBlLmRldGVybWluZUV2ZW50VHlwZSA9IGZ1bmN0aW9uKHRhcmdldEVsZW1lbnQpIHtcblxuXHRcdC8vSXNzdWUgIzE1OTogQW5kcm9pZCBDaHJvbWUgU2VsZWN0IEJveCBkb2VzIG5vdCBvcGVuIHdpdGggYSBzeW50aGV0aWMgY2xpY2sgZXZlbnRcblx0XHRpZiAoZGV2aWNlSXNBbmRyb2lkICYmIHRhcmdldEVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnc2VsZWN0Jykge1xuXHRcdFx0cmV0dXJuICdtb3VzZWRvd24nO1xuXHRcdH1cblxuXHRcdHJldHVybiAnY2xpY2snO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RWxlbWVudH0gdGFyZ2V0RWxlbWVudFxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5mb2N1cyA9IGZ1bmN0aW9uKHRhcmdldEVsZW1lbnQpIHtcblx0XHR2YXIgbGVuZ3RoO1xuXG5cdFx0Ly8gSXNzdWUgIzE2MDogb24gaU9TIDcsIHNvbWUgaW5wdXQgZWxlbWVudHMgKGUuZy4gZGF0ZSBkYXRldGltZSBtb250aCkgdGhyb3cgYSB2YWd1ZSBUeXBlRXJyb3Igb24gc2V0U2VsZWN0aW9uUmFuZ2UuIFRoZXNlIGVsZW1lbnRzIGRvbid0IGhhdmUgYW4gaW50ZWdlciB2YWx1ZSBmb3IgdGhlIHNlbGVjdGlvblN0YXJ0IGFuZCBzZWxlY3Rpb25FbmQgcHJvcGVydGllcywgYnV0IHVuZm9ydHVuYXRlbHkgdGhhdCBjYW4ndCBiZSB1c2VkIGZvciBkZXRlY3Rpb24gYmVjYXVzZSBhY2Nlc3NpbmcgdGhlIHByb3BlcnRpZXMgYWxzbyB0aHJvd3MgYSBUeXBlRXJyb3IuIEp1c3QgY2hlY2sgdGhlIHR5cGUgaW5zdGVhZC4gRmlsZWQgYXMgQXBwbGUgYnVnICMxNTEyMjcyNC5cblx0XHRpZiAoZGV2aWNlSXNJT1MgJiYgdGFyZ2V0RWxlbWVudC5zZXRTZWxlY3Rpb25SYW5nZSAmJiB0YXJnZXRFbGVtZW50LnR5cGUuaW5kZXhPZignZGF0ZScpICE9PSAwICYmIHRhcmdldEVsZW1lbnQudHlwZSAhPT0gJ3RpbWUnICYmIHRhcmdldEVsZW1lbnQudHlwZSAhPT0gJ21vbnRoJykge1xuXHRcdFx0bGVuZ3RoID0gdGFyZ2V0RWxlbWVudC52YWx1ZS5sZW5ndGg7XG5cdFx0XHR0YXJnZXRFbGVtZW50LnNldFNlbGVjdGlvblJhbmdlKGxlbmd0aCwgbGVuZ3RoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGFyZ2V0RWxlbWVudC5mb2N1cygpO1xuXHRcdH1cblx0fTtcblxuXG5cdC8qKlxuXHQgKiBDaGVjayB3aGV0aGVyIHRoZSBnaXZlbiB0YXJnZXQgZWxlbWVudCBpcyBhIGNoaWxkIG9mIGEgc2Nyb2xsYWJsZSBsYXllciBhbmQgaWYgc28sIHNldCBhIGZsYWcgb24gaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RWxlbWVudH0gdGFyZ2V0RWxlbWVudFxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS51cGRhdGVTY3JvbGxQYXJlbnQgPSBmdW5jdGlvbih0YXJnZXRFbGVtZW50KSB7XG5cdFx0dmFyIHNjcm9sbFBhcmVudCwgcGFyZW50RWxlbWVudDtcblxuXHRcdHNjcm9sbFBhcmVudCA9IHRhcmdldEVsZW1lbnQuZmFzdENsaWNrU2Nyb2xsUGFyZW50O1xuXG5cdFx0Ly8gQXR0ZW1wdCB0byBkaXNjb3ZlciB3aGV0aGVyIHRoZSB0YXJnZXQgZWxlbWVudCBpcyBjb250YWluZWQgd2l0aGluIGEgc2Nyb2xsYWJsZSBsYXllci4gUmUtY2hlY2sgaWYgdGhlXG5cdFx0Ly8gdGFyZ2V0IGVsZW1lbnQgd2FzIG1vdmVkIHRvIGFub3RoZXIgcGFyZW50LlxuXHRcdGlmICghc2Nyb2xsUGFyZW50IHx8ICFzY3JvbGxQYXJlbnQuY29udGFpbnModGFyZ2V0RWxlbWVudCkpIHtcblx0XHRcdHBhcmVudEVsZW1lbnQgPSB0YXJnZXRFbGVtZW50O1xuXHRcdFx0ZG8ge1xuXHRcdFx0XHRpZiAocGFyZW50RWxlbWVudC5zY3JvbGxIZWlnaHQgPiBwYXJlbnRFbGVtZW50Lm9mZnNldEhlaWdodCkge1xuXHRcdFx0XHRcdHNjcm9sbFBhcmVudCA9IHBhcmVudEVsZW1lbnQ7XG5cdFx0XHRcdFx0dGFyZ2V0RWxlbWVudC5mYXN0Q2xpY2tTY3JvbGxQYXJlbnQgPSBwYXJlbnRFbGVtZW50O1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cGFyZW50RWxlbWVudCA9IHBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudDtcblx0XHRcdH0gd2hpbGUgKHBhcmVudEVsZW1lbnQpO1xuXHRcdH1cblxuXHRcdC8vIEFsd2F5cyB1cGRhdGUgdGhlIHNjcm9sbCB0b3AgdHJhY2tlciBpZiBwb3NzaWJsZS5cblx0XHRpZiAoc2Nyb2xsUGFyZW50KSB7XG5cdFx0XHRzY3JvbGxQYXJlbnQuZmFzdENsaWNrTGFzdFNjcm9sbFRvcCA9IHNjcm9sbFBhcmVudC5zY3JvbGxUb3A7XG5cdFx0fVxuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR9IHRhcmdldEVsZW1lbnRcblx0ICogQHJldHVybnMge0VsZW1lbnR8RXZlbnRUYXJnZXR9XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLmdldFRhcmdldEVsZW1lbnRGcm9tRXZlbnRUYXJnZXQgPSBmdW5jdGlvbihldmVudFRhcmdldCkge1xuXG5cdFx0Ly8gT24gc29tZSBvbGRlciBicm93c2VycyAobm90YWJseSBTYWZhcmkgb24gaU9TIDQuMSAtIHNlZSBpc3N1ZSAjNTYpIHRoZSBldmVudCB0YXJnZXQgbWF5IGJlIGEgdGV4dCBub2RlLlxuXHRcdGlmIChldmVudFRhcmdldC5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcblx0XHRcdHJldHVybiBldmVudFRhcmdldC5wYXJlbnROb2RlO1xuXHRcdH1cblxuXHRcdHJldHVybiBldmVudFRhcmdldDtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBPbiB0b3VjaCBzdGFydCwgcmVjb3JkIHRoZSBwb3NpdGlvbiBhbmQgc2Nyb2xsIG9mZnNldC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uVG91Y2hTdGFydCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIHRhcmdldEVsZW1lbnQsIHRvdWNoLCBzZWxlY3Rpb247XG5cblx0XHQvLyBJZ25vcmUgbXVsdGlwbGUgdG91Y2hlcywgb3RoZXJ3aXNlIHBpbmNoLXRvLXpvb20gaXMgcHJldmVudGVkIGlmIGJvdGggZmluZ2VycyBhcmUgb24gdGhlIEZhc3RDbGljayBlbGVtZW50IChpc3N1ZSAjMTExKS5cblx0XHRpZiAoZXZlbnQudGFyZ2V0VG91Y2hlcy5sZW5ndGggPiAxKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHR0YXJnZXRFbGVtZW50ID0gdGhpcy5nZXRUYXJnZXRFbGVtZW50RnJvbUV2ZW50VGFyZ2V0KGV2ZW50LnRhcmdldCk7XG5cdFx0dG91Y2ggPSBldmVudC50YXJnZXRUb3VjaGVzWzBdO1xuXG5cdFx0aWYgKGRldmljZUlzSU9TKSB7XG5cblx0XHRcdC8vIE9ubHkgdHJ1c3RlZCBldmVudHMgd2lsbCBkZXNlbGVjdCB0ZXh0IG9uIGlPUyAoaXNzdWUgIzQ5KVxuXHRcdFx0c2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xuXHRcdFx0aWYgKHNlbGVjdGlvbi5yYW5nZUNvdW50ICYmICFzZWxlY3Rpb24uaXNDb2xsYXBzZWQpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghZGV2aWNlSXNJT1M0KSB7XG5cblx0XHRcdFx0Ly8gV2VpcmQgdGhpbmdzIGhhcHBlbiBvbiBpT1Mgd2hlbiBhbiBhbGVydCBvciBjb25maXJtIGRpYWxvZyBpcyBvcGVuZWQgZnJvbSBhIGNsaWNrIGV2ZW50IGNhbGxiYWNrIChpc3N1ZSAjMjMpOlxuXHRcdFx0XHQvLyB3aGVuIHRoZSB1c2VyIG5leHQgdGFwcyBhbnl3aGVyZSBlbHNlIG9uIHRoZSBwYWdlLCBuZXcgdG91Y2hzdGFydCBhbmQgdG91Y2hlbmQgZXZlbnRzIGFyZSBkaXNwYXRjaGVkXG5cdFx0XHRcdC8vIHdpdGggdGhlIHNhbWUgaWRlbnRpZmllciBhcyB0aGUgdG91Y2ggZXZlbnQgdGhhdCBwcmV2aW91c2x5IHRyaWdnZXJlZCB0aGUgY2xpY2sgdGhhdCB0cmlnZ2VyZWQgdGhlIGFsZXJ0LlxuXHRcdFx0XHQvLyBTYWRseSwgdGhlcmUgaXMgYW4gaXNzdWUgb24gaU9TIDQgdGhhdCBjYXVzZXMgc29tZSBub3JtYWwgdG91Y2ggZXZlbnRzIHRvIGhhdmUgdGhlIHNhbWUgaWRlbnRpZmllciBhcyBhblxuXHRcdFx0XHQvLyBpbW1lZGlhdGVseSBwcmVjZWVkaW5nIHRvdWNoIGV2ZW50IChpc3N1ZSAjNTIpLCBzbyB0aGlzIGZpeCBpcyB1bmF2YWlsYWJsZSBvbiB0aGF0IHBsYXRmb3JtLlxuXHRcdFx0XHQvLyBJc3N1ZSAxMjA6IHRvdWNoLmlkZW50aWZpZXIgaXMgMCB3aGVuIENocm9tZSBkZXYgdG9vbHMgJ0VtdWxhdGUgdG91Y2ggZXZlbnRzJyBpcyBzZXQgd2l0aCBhbiBpT1MgZGV2aWNlIFVBIHN0cmluZyxcblx0XHRcdFx0Ly8gd2hpY2ggY2F1c2VzIGFsbCB0b3VjaCBldmVudHMgdG8gYmUgaWdub3JlZC4gQXMgdGhpcyBibG9jayBvbmx5IGFwcGxpZXMgdG8gaU9TLCBhbmQgaU9TIGlkZW50aWZpZXJzIGFyZSBhbHdheXMgbG9uZyxcblx0XHRcdFx0Ly8gcmFuZG9tIGludGVnZXJzLCBpdCdzIHNhZmUgdG8gdG8gY29udGludWUgaWYgdGhlIGlkZW50aWZpZXIgaXMgMCBoZXJlLlxuXHRcdFx0XHRpZiAodG91Y2guaWRlbnRpZmllciAmJiB0b3VjaC5pZGVudGlmaWVyID09PSB0aGlzLmxhc3RUb3VjaElkZW50aWZpZXIpIHtcblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMubGFzdFRvdWNoSWRlbnRpZmllciA9IHRvdWNoLmlkZW50aWZpZXI7XG5cblx0XHRcdFx0Ly8gSWYgdGhlIHRhcmdldCBlbGVtZW50IGlzIGEgY2hpbGQgb2YgYSBzY3JvbGxhYmxlIGxheWVyICh1c2luZyAtd2Via2l0LW92ZXJmbG93LXNjcm9sbGluZzogdG91Y2gpIGFuZDpcblx0XHRcdFx0Ly8gMSkgdGhlIHVzZXIgZG9lcyBhIGZsaW5nIHNjcm9sbCBvbiB0aGUgc2Nyb2xsYWJsZSBsYXllclxuXHRcdFx0XHQvLyAyKSB0aGUgdXNlciBzdG9wcyB0aGUgZmxpbmcgc2Nyb2xsIHdpdGggYW5vdGhlciB0YXBcblx0XHRcdFx0Ly8gdGhlbiB0aGUgZXZlbnQudGFyZ2V0IG9mIHRoZSBsYXN0ICd0b3VjaGVuZCcgZXZlbnQgd2lsbCBiZSB0aGUgZWxlbWVudCB0aGF0IHdhcyB1bmRlciB0aGUgdXNlcidzIGZpbmdlclxuXHRcdFx0XHQvLyB3aGVuIHRoZSBmbGluZyBzY3JvbGwgd2FzIHN0YXJ0ZWQsIGNhdXNpbmcgRmFzdENsaWNrIHRvIHNlbmQgYSBjbGljayBldmVudCB0byB0aGF0IGxheWVyIC0gdW5sZXNzIGEgY2hlY2tcblx0XHRcdFx0Ly8gaXMgbWFkZSB0byBlbnN1cmUgdGhhdCBhIHBhcmVudCBsYXllciB3YXMgbm90IHNjcm9sbGVkIGJlZm9yZSBzZW5kaW5nIGEgc3ludGhldGljIGNsaWNrIChpc3N1ZSAjNDIpLlxuXHRcdFx0XHR0aGlzLnVwZGF0ZVNjcm9sbFBhcmVudCh0YXJnZXRFbGVtZW50KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSB0cnVlO1xuXHRcdHRoaXMudHJhY2tpbmdDbGlja1N0YXJ0ID0gZXZlbnQudGltZVN0YW1wO1xuXHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IHRhcmdldEVsZW1lbnQ7XG5cblx0XHR0aGlzLnRvdWNoU3RhcnRYID0gdG91Y2gucGFnZVg7XG5cdFx0dGhpcy50b3VjaFN0YXJ0WSA9IHRvdWNoLnBhZ2VZO1xuXG5cdFx0Ly8gUHJldmVudCBwaGFudG9tIGNsaWNrcyBvbiBmYXN0IGRvdWJsZS10YXAgKGlzc3VlICMzNilcblx0XHRpZiAoKGV2ZW50LnRpbWVTdGFtcCAtIHRoaXMubGFzdENsaWNrVGltZSkgPCB0aGlzLnRhcERlbGF5KSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEJhc2VkIG9uIGEgdG91Y2htb3ZlIGV2ZW50IG9iamVjdCwgY2hlY2sgd2hldGhlciB0aGUgdG91Y2ggaGFzIG1vdmVkIHBhc3QgYSBib3VuZGFyeSBzaW5jZSBpdCBzdGFydGVkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUudG91Y2hIYXNNb3ZlZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIHRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0sIGJvdW5kYXJ5ID0gdGhpcy50b3VjaEJvdW5kYXJ5O1xuXG5cdFx0aWYgKE1hdGguYWJzKHRvdWNoLnBhZ2VYIC0gdGhpcy50b3VjaFN0YXJ0WCkgPiBib3VuZGFyeSB8fCBNYXRoLmFicyh0b3VjaC5wYWdlWSAtIHRoaXMudG91Y2hTdGFydFkpID4gYm91bmRhcnkpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBVcGRhdGUgdGhlIGxhc3QgcG9zaXRpb24uXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vblRvdWNoTW92ZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0aWYgKCF0aGlzLnRyYWNraW5nQ2xpY2spIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIElmIHRoZSB0b3VjaCBoYXMgbW92ZWQsIGNhbmNlbCB0aGUgY2xpY2sgdHJhY2tpbmdcblx0XHRpZiAodGhpcy50YXJnZXRFbGVtZW50ICE9PSB0aGlzLmdldFRhcmdldEVsZW1lbnRGcm9tRXZlbnRUYXJnZXQoZXZlbnQudGFyZ2V0KSB8fCB0aGlzLnRvdWNoSGFzTW92ZWQoZXZlbnQpKSB7XG5cdFx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH07XG5cblxuXHQvKipcblx0ICogQXR0ZW1wdCB0byBmaW5kIHRoZSBsYWJlbGxlZCBjb250cm9sIGZvciB0aGUgZ2l2ZW4gbGFiZWwgZWxlbWVudC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxIVE1MTGFiZWxFbGVtZW50fSBsYWJlbEVsZW1lbnRcblx0ICogQHJldHVybnMge0VsZW1lbnR8bnVsbH1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUuZmluZENvbnRyb2wgPSBmdW5jdGlvbihsYWJlbEVsZW1lbnQpIHtcblxuXHRcdC8vIEZhc3QgcGF0aCBmb3IgbmV3ZXIgYnJvd3NlcnMgc3VwcG9ydGluZyB0aGUgSFRNTDUgY29udHJvbCBhdHRyaWJ1dGVcblx0XHRpZiAobGFiZWxFbGVtZW50LmNvbnRyb2wgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmV0dXJuIGxhYmVsRWxlbWVudC5jb250cm9sO1xuXHRcdH1cblxuXHRcdC8vIEFsbCBicm93c2VycyB1bmRlciB0ZXN0IHRoYXQgc3VwcG9ydCB0b3VjaCBldmVudHMgYWxzbyBzdXBwb3J0IHRoZSBIVE1MNSBodG1sRm9yIGF0dHJpYnV0ZVxuXHRcdGlmIChsYWJlbEVsZW1lbnQuaHRtbEZvcikge1xuXHRcdFx0cmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGxhYmVsRWxlbWVudC5odG1sRm9yKTtcblx0XHR9XG5cblx0XHQvLyBJZiBubyBmb3IgYXR0cmlidXRlIGV4aXN0cywgYXR0ZW1wdCB0byByZXRyaWV2ZSB0aGUgZmlyc3QgbGFiZWxsYWJsZSBkZXNjZW5kYW50IGVsZW1lbnRcblx0XHQvLyB0aGUgbGlzdCBvZiB3aGljaCBpcyBkZWZpbmVkIGhlcmU6IGh0dHA6Ly93d3cudzMub3JnL1RSL2h0bWw1L2Zvcm1zLmh0bWwjY2F0ZWdvcnktbGFiZWxcblx0XHRyZXR1cm4gbGFiZWxFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbiwgaW5wdXQ6bm90KFt0eXBlPWhpZGRlbl0pLCBrZXlnZW4sIG1ldGVyLCBvdXRwdXQsIHByb2dyZXNzLCBzZWxlY3QsIHRleHRhcmVhJyk7XG5cdH07XG5cblxuXHQvKipcblx0ICogT24gdG91Y2ggZW5kLCBkZXRlcm1pbmUgd2hldGhlciB0byBzZW5kIGEgY2xpY2sgZXZlbnQgYXQgb25jZS5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uVG91Y2hFbmQgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdHZhciBmb3JFbGVtZW50LCB0cmFja2luZ0NsaWNrU3RhcnQsIHRhcmdldFRhZ05hbWUsIHNjcm9sbFBhcmVudCwgdG91Y2gsIHRhcmdldEVsZW1lbnQgPSB0aGlzLnRhcmdldEVsZW1lbnQ7XG5cblx0XHRpZiAoIXRoaXMudHJhY2tpbmdDbGljaykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gUHJldmVudCBwaGFudG9tIGNsaWNrcyBvbiBmYXN0IGRvdWJsZS10YXAgKGlzc3VlICMzNilcblx0XHRpZiAoKGV2ZW50LnRpbWVTdGFtcCAtIHRoaXMubGFzdENsaWNrVGltZSkgPCB0aGlzLnRhcERlbGF5KSB7XG5cdFx0XHR0aGlzLmNhbmNlbE5leHRDbGljayA9IHRydWU7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoKGV2ZW50LnRpbWVTdGFtcCAtIHRoaXMudHJhY2tpbmdDbGlja1N0YXJ0KSA+IHRoaXMudGFwVGltZW91dCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gUmVzZXQgdG8gcHJldmVudCB3cm9uZyBjbGljayBjYW5jZWwgb24gaW5wdXQgKGlzc3VlICMxNTYpLlxuXHRcdHRoaXMuY2FuY2VsTmV4dENsaWNrID0gZmFsc2U7XG5cblx0XHR0aGlzLmxhc3RDbGlja1RpbWUgPSBldmVudC50aW1lU3RhbXA7XG5cblx0XHR0cmFja2luZ0NsaWNrU3RhcnQgPSB0aGlzLnRyYWNraW5nQ2xpY2tTdGFydDtcblx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblx0XHR0aGlzLnRyYWNraW5nQ2xpY2tTdGFydCA9IDA7XG5cblx0XHQvLyBPbiBzb21lIGlPUyBkZXZpY2VzLCB0aGUgdGFyZ2V0RWxlbWVudCBzdXBwbGllZCB3aXRoIHRoZSBldmVudCBpcyBpbnZhbGlkIGlmIHRoZSBsYXllclxuXHRcdC8vIGlzIHBlcmZvcm1pbmcgYSB0cmFuc2l0aW9uIG9yIHNjcm9sbCwgYW5kIGhhcyB0byBiZSByZS1kZXRlY3RlZCBtYW51YWxseS4gTm90ZSB0aGF0XG5cdFx0Ly8gZm9yIHRoaXMgdG8gZnVuY3Rpb24gY29ycmVjdGx5LCBpdCBtdXN0IGJlIGNhbGxlZCAqYWZ0ZXIqIHRoZSBldmVudCB0YXJnZXQgaXMgY2hlY2tlZCFcblx0XHQvLyBTZWUgaXNzdWUgIzU3OyBhbHNvIGZpbGVkIGFzIHJkYXI6Ly8xMzA0ODU4OSAuXG5cdFx0aWYgKGRldmljZUlzSU9TV2l0aEJhZFRhcmdldCkge1xuXHRcdFx0dG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcblxuXHRcdFx0Ly8gSW4gY2VydGFpbiBjYXNlcyBhcmd1bWVudHMgb2YgZWxlbWVudEZyb21Qb2ludCBjYW4gYmUgbmVnYXRpdmUsIHNvIHByZXZlbnQgc2V0dGluZyB0YXJnZXRFbGVtZW50IHRvIG51bGxcblx0XHRcdHRhcmdldEVsZW1lbnQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHRvdWNoLnBhZ2VYIC0gd2luZG93LnBhZ2VYT2Zmc2V0LCB0b3VjaC5wYWdlWSAtIHdpbmRvdy5wYWdlWU9mZnNldCkgfHwgdGFyZ2V0RWxlbWVudDtcblx0XHRcdHRhcmdldEVsZW1lbnQuZmFzdENsaWNrU2Nyb2xsUGFyZW50ID0gdGhpcy50YXJnZXRFbGVtZW50LmZhc3RDbGlja1Njcm9sbFBhcmVudDtcblx0XHR9XG5cblx0XHR0YXJnZXRUYWdOYW1lID0gdGFyZ2V0RWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKHRhcmdldFRhZ05hbWUgPT09ICdsYWJlbCcpIHtcblx0XHRcdGZvckVsZW1lbnQgPSB0aGlzLmZpbmRDb250cm9sKHRhcmdldEVsZW1lbnQpO1xuXHRcdFx0aWYgKGZvckVsZW1lbnQpIHtcblx0XHRcdFx0dGhpcy5mb2N1cyh0YXJnZXRFbGVtZW50KTtcblx0XHRcdFx0aWYgKGRldmljZUlzQW5kcm9pZCkge1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRhcmdldEVsZW1lbnQgPSBmb3JFbGVtZW50O1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAodGhpcy5uZWVkc0ZvY3VzKHRhcmdldEVsZW1lbnQpKSB7XG5cblx0XHRcdC8vIENhc2UgMTogSWYgdGhlIHRvdWNoIHN0YXJ0ZWQgYSB3aGlsZSBhZ28gKGJlc3QgZ3Vlc3MgaXMgMTAwbXMgYmFzZWQgb24gdGVzdHMgZm9yIGlzc3VlICMzNikgdGhlbiBmb2N1cyB3aWxsIGJlIHRyaWdnZXJlZCBhbnl3YXkuIFJldHVybiBlYXJseSBhbmQgdW5zZXQgdGhlIHRhcmdldCBlbGVtZW50IHJlZmVyZW5jZSBzbyB0aGF0IHRoZSBzdWJzZXF1ZW50IGNsaWNrIHdpbGwgYmUgYWxsb3dlZCB0aHJvdWdoLlxuXHRcdFx0Ly8gQ2FzZSAyOiBXaXRob3V0IHRoaXMgZXhjZXB0aW9uIGZvciBpbnB1dCBlbGVtZW50cyB0YXBwZWQgd2hlbiB0aGUgZG9jdW1lbnQgaXMgY29udGFpbmVkIGluIGFuIGlmcmFtZSwgdGhlbiBhbnkgaW5wdXR0ZWQgdGV4dCB3b24ndCBiZSB2aXNpYmxlIGV2ZW4gdGhvdWdoIHRoZSB2YWx1ZSBhdHRyaWJ1dGUgaXMgdXBkYXRlZCBhcyB0aGUgdXNlciB0eXBlcyAoaXNzdWUgIzM3KS5cblx0XHRcdGlmICgoZXZlbnQudGltZVN0YW1wIC0gdHJhY2tpbmdDbGlja1N0YXJ0KSA+IDEwMCB8fCAoZGV2aWNlSXNJT1MgJiYgd2luZG93LnRvcCAhPT0gd2luZG93ICYmIHRhcmdldFRhZ05hbWUgPT09ICdpbnB1dCcpKSB7XG5cdFx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5mb2N1cyh0YXJnZXRFbGVtZW50KTtcblx0XHRcdHRoaXMuc2VuZENsaWNrKHRhcmdldEVsZW1lbnQsIGV2ZW50KTtcblxuXHRcdFx0Ly8gU2VsZWN0IGVsZW1lbnRzIG5lZWQgdGhlIGV2ZW50IHRvIGdvIHRocm91Z2ggb24gaU9TIDQsIG90aGVyd2lzZSB0aGUgc2VsZWN0b3IgbWVudSB3b24ndCBvcGVuLlxuXHRcdFx0Ly8gQWxzbyB0aGlzIGJyZWFrcyBvcGVuaW5nIHNlbGVjdHMgd2hlbiBWb2ljZU92ZXIgaXMgYWN0aXZlIG9uIGlPUzYsIGlPUzcgKGFuZCBwb3NzaWJseSBvdGhlcnMpXG5cdFx0XHRpZiAoIWRldmljZUlzSU9TIHx8IHRhcmdldFRhZ05hbWUgIT09ICdzZWxlY3QnKSB7XG5cdFx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRpZiAoZGV2aWNlSXNJT1MgJiYgIWRldmljZUlzSU9TNCkge1xuXG5cdFx0XHQvLyBEb24ndCBzZW5kIGEgc3ludGhldGljIGNsaWNrIGV2ZW50IGlmIHRoZSB0YXJnZXQgZWxlbWVudCBpcyBjb250YWluZWQgd2l0aGluIGEgcGFyZW50IGxheWVyIHRoYXQgd2FzIHNjcm9sbGVkXG5cdFx0XHQvLyBhbmQgdGhpcyB0YXAgaXMgYmVpbmcgdXNlZCB0byBzdG9wIHRoZSBzY3JvbGxpbmcgKHVzdWFsbHkgaW5pdGlhdGVkIGJ5IGEgZmxpbmcgLSBpc3N1ZSAjNDIpLlxuXHRcdFx0c2Nyb2xsUGFyZW50ID0gdGFyZ2V0RWxlbWVudC5mYXN0Q2xpY2tTY3JvbGxQYXJlbnQ7XG5cdFx0XHRpZiAoc2Nyb2xsUGFyZW50ICYmIHNjcm9sbFBhcmVudC5mYXN0Q2xpY2tMYXN0U2Nyb2xsVG9wICE9PSBzY3JvbGxQYXJlbnQuc2Nyb2xsVG9wKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFByZXZlbnQgdGhlIGFjdHVhbCBjbGljayBmcm9tIGdvaW5nIHRob3VnaCAtIHVubGVzcyB0aGUgdGFyZ2V0IG5vZGUgaXMgbWFya2VkIGFzIHJlcXVpcmluZ1xuXHRcdC8vIHJlYWwgY2xpY2tzIG9yIGlmIGl0IGlzIGluIHRoZSB3aGl0ZWxpc3QgaW4gd2hpY2ggY2FzZSBvbmx5IG5vbi1wcm9ncmFtbWF0aWMgY2xpY2tzIGFyZSBwZXJtaXR0ZWQuXG5cdFx0aWYgKCF0aGlzLm5lZWRzQ2xpY2sodGFyZ2V0RWxlbWVudCkpIHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR0aGlzLnNlbmRDbGljayh0YXJnZXRFbGVtZW50LCBldmVudCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIE9uIHRvdWNoIGNhbmNlbCwgc3RvcCB0cmFja2luZyB0aGUgY2xpY2suXG5cdCAqXG5cdCAqIEByZXR1cm5zIHt2b2lkfVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vblRvdWNoQ2FuY2VsID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy50cmFja2luZ0NsaWNrID0gZmFsc2U7XG5cdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmUgbW91c2UgZXZlbnRzIHdoaWNoIHNob3VsZCBiZSBwZXJtaXR0ZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vbk1vdXNlID0gZnVuY3Rpb24oZXZlbnQpIHtcblxuXHRcdC8vIElmIGEgdGFyZ2V0IGVsZW1lbnQgd2FzIG5ldmVyIHNldCAoYmVjYXVzZSBhIHRvdWNoIGV2ZW50IHdhcyBuZXZlciBmaXJlZCkgYWxsb3cgdGhlIGV2ZW50XG5cdFx0aWYgKCF0aGlzLnRhcmdldEVsZW1lbnQpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdGlmIChldmVudC5mb3J3YXJkZWRUb3VjaEV2ZW50KSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBQcm9ncmFtbWF0aWNhbGx5IGdlbmVyYXRlZCBldmVudHMgdGFyZ2V0aW5nIGEgc3BlY2lmaWMgZWxlbWVudCBzaG91bGQgYmUgcGVybWl0dGVkXG5cdFx0aWYgKCFldmVudC5jYW5jZWxhYmxlKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBEZXJpdmUgYW5kIGNoZWNrIHRoZSB0YXJnZXQgZWxlbWVudCB0byBzZWUgd2hldGhlciB0aGUgbW91c2UgZXZlbnQgbmVlZHMgdG8gYmUgcGVybWl0dGVkO1xuXHRcdC8vIHVubGVzcyBleHBsaWNpdGx5IGVuYWJsZWQsIHByZXZlbnQgbm9uLXRvdWNoIGNsaWNrIGV2ZW50cyBmcm9tIHRyaWdnZXJpbmcgYWN0aW9ucyxcblx0XHQvLyB0byBwcmV2ZW50IGdob3N0L2RvdWJsZWNsaWNrcy5cblx0XHRpZiAoIXRoaXMubmVlZHNDbGljayh0aGlzLnRhcmdldEVsZW1lbnQpIHx8IHRoaXMuY2FuY2VsTmV4dENsaWNrKSB7XG5cblx0XHRcdC8vIFByZXZlbnQgYW55IHVzZXItYWRkZWQgbGlzdGVuZXJzIGRlY2xhcmVkIG9uIEZhc3RDbGljayBlbGVtZW50IGZyb20gYmVpbmcgZmlyZWQuXG5cdFx0XHRpZiAoZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKSB7XG5cdFx0XHRcdGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQvLyBQYXJ0IG9mIHRoZSBoYWNrIGZvciBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgRXZlbnQjc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uIChlLmcuIEFuZHJvaWQgMilcblx0XHRcdFx0ZXZlbnQucHJvcGFnYXRpb25TdG9wcGVkID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQ2FuY2VsIHRoZSBldmVudFxuXHRcdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgdGhlIG1vdXNlIGV2ZW50IGlzIHBlcm1pdHRlZCwgcmV0dXJuIHRydWUgZm9yIHRoZSBhY3Rpb24gdG8gZ28gdGhyb3VnaC5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBPbiBhY3R1YWwgY2xpY2tzLCBkZXRlcm1pbmUgd2hldGhlciB0aGlzIGlzIGEgdG91Y2gtZ2VuZXJhdGVkIGNsaWNrLCBhIGNsaWNrIGFjdGlvbiBvY2N1cnJpbmdcblx0ICogbmF0dXJhbGx5IGFmdGVyIGEgZGVsYXkgYWZ0ZXIgYSB0b3VjaCAod2hpY2ggbmVlZHMgdG8gYmUgY2FuY2VsbGVkIHRvIGF2b2lkIGR1cGxpY2F0aW9uKSwgb3Jcblx0ICogYW4gYWN0dWFsIGNsaWNrIHdoaWNoIHNob3VsZCBiZSBwZXJtaXR0ZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vbkNsaWNrID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR2YXIgcGVybWl0dGVkO1xuXG5cdFx0Ly8gSXQncyBwb3NzaWJsZSBmb3IgYW5vdGhlciBGYXN0Q2xpY2stbGlrZSBsaWJyYXJ5IGRlbGl2ZXJlZCB3aXRoIHRoaXJkLXBhcnR5IGNvZGUgdG8gZmlyZSBhIGNsaWNrIGV2ZW50IGJlZm9yZSBGYXN0Q2xpY2sgZG9lcyAoaXNzdWUgIzQ0KS4gSW4gdGhhdCBjYXNlLCBzZXQgdGhlIGNsaWNrLXRyYWNraW5nIGZsYWcgYmFjayB0byBmYWxzZSBhbmQgcmV0dXJuIGVhcmx5LiBUaGlzIHdpbGwgY2F1c2Ugb25Ub3VjaEVuZCB0byByZXR1cm4gZWFybHkuXG5cdFx0aWYgKHRoaXMudHJhY2tpbmdDbGljaykge1xuXHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0XHRcdHRoaXMudHJhY2tpbmdDbGljayA9IGZhbHNlO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gVmVyeSBvZGQgYmVoYXZpb3VyIG9uIGlPUyAoaXNzdWUgIzE4KTogaWYgYSBzdWJtaXQgZWxlbWVudCBpcyBwcmVzZW50IGluc2lkZSBhIGZvcm0gYW5kIHRoZSB1c2VyIGhpdHMgZW50ZXIgaW4gdGhlIGlPUyBzaW11bGF0b3Igb3IgY2xpY2tzIHRoZSBHbyBidXR0b24gb24gdGhlIHBvcC11cCBPUyBrZXlib2FyZCB0aGUgYSBraW5kIG9mICdmYWtlJyBjbGljayBldmVudCB3aWxsIGJlIHRyaWdnZXJlZCB3aXRoIHRoZSBzdWJtaXQtdHlwZSBpbnB1dCBlbGVtZW50IGFzIHRoZSB0YXJnZXQuXG5cdFx0aWYgKGV2ZW50LnRhcmdldC50eXBlID09PSAnc3VibWl0JyAmJiBldmVudC5kZXRhaWwgPT09IDApIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHBlcm1pdHRlZCA9IHRoaXMub25Nb3VzZShldmVudCk7XG5cblx0XHQvLyBPbmx5IHVuc2V0IHRhcmdldEVsZW1lbnQgaWYgdGhlIGNsaWNrIGlzIG5vdCBwZXJtaXR0ZWQuIFRoaXMgd2lsbCBlbnN1cmUgdGhhdCB0aGUgY2hlY2sgZm9yICF0YXJnZXRFbGVtZW50IGluIG9uTW91c2UgZmFpbHMgYW5kIHRoZSBicm93c2VyJ3MgY2xpY2sgZG9lc24ndCBnbyB0aHJvdWdoLlxuXHRcdGlmICghcGVybWl0dGVkKSB7XG5cdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXHRcdH1cblxuXHRcdC8vIElmIGNsaWNrcyBhcmUgcGVybWl0dGVkLCByZXR1cm4gdHJ1ZSBmb3IgdGhlIGFjdGlvbiB0byBnbyB0aHJvdWdoLlxuXHRcdHJldHVybiBwZXJtaXR0ZWQ7XG5cdH07XG5cblxuXHQvKipcblx0ICogUmVtb3ZlIGFsbCBGYXN0Q2xpY2sncyBldmVudCBsaXN0ZW5lcnMuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHt2b2lkfVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGxheWVyID0gdGhpcy5sYXllcjtcblxuXHRcdGlmIChkZXZpY2VJc0FuZHJvaWQpIHtcblx0XHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2UsIHRydWUpO1xuXHRcdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0fVxuXG5cdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uQ2xpY2ssIHRydWUpO1xuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLm9uVG91Y2hTdGFydCwgZmFsc2UpO1xuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMub25Ub3VjaE1vdmUsIGZhbHNlKTtcblx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMub25Ub3VjaEVuZCwgZmFsc2UpO1xuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgdGhpcy5vblRvdWNoQ2FuY2VsLCBmYWxzZSk7XG5cdH07XG5cblxuXHQvKipcblx0ICogQ2hlY2sgd2hldGhlciBGYXN0Q2xpY2sgaXMgbmVlZGVkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0VsZW1lbnR9IGxheWVyIFRoZSBsYXllciB0byBsaXN0ZW4gb25cblx0ICovXG5cdEZhc3RDbGljay5ub3ROZWVkZWQgPSBmdW5jdGlvbihsYXllcikge1xuXHRcdHZhciBtZXRhVmlld3BvcnQ7XG5cdFx0dmFyIGNocm9tZVZlcnNpb247XG5cdFx0dmFyIGJsYWNrYmVycnlWZXJzaW9uO1xuXHRcdHZhciBmaXJlZm94VmVyc2lvbjtcblxuXHRcdC8vIERldmljZXMgdGhhdCBkb24ndCBzdXBwb3J0IHRvdWNoIGRvbid0IG5lZWQgRmFzdENsaWNrXG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cub250b3VjaHN0YXJ0ID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gQ2hyb21lIHZlcnNpb24gLSB6ZXJvIGZvciBvdGhlciBicm93c2Vyc1xuXHRcdGNocm9tZVZlcnNpb24gPSArKC9DaHJvbWVcXC8oWzAtOV0rKS8uZXhlYyhuYXZpZ2F0b3IudXNlckFnZW50KSB8fCBbLDBdKVsxXTtcblxuXHRcdGlmIChjaHJvbWVWZXJzaW9uKSB7XG5cblx0XHRcdGlmIChkZXZpY2VJc0FuZHJvaWQpIHtcblx0XHRcdFx0bWV0YVZpZXdwb3J0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWV0YVtuYW1lPXZpZXdwb3J0XScpO1xuXG5cdFx0XHRcdGlmIChtZXRhVmlld3BvcnQpIHtcblx0XHRcdFx0XHQvLyBDaHJvbWUgb24gQW5kcm9pZCB3aXRoIHVzZXItc2NhbGFibGU9XCJub1wiIGRvZXNuJ3QgbmVlZCBGYXN0Q2xpY2sgKGlzc3VlICM4OSlcblx0XHRcdFx0XHRpZiAobWV0YVZpZXdwb3J0LmNvbnRlbnQuaW5kZXhPZigndXNlci1zY2FsYWJsZT1ubycpICE9PSAtMSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIENocm9tZSAzMiBhbmQgYWJvdmUgd2l0aCB3aWR0aD1kZXZpY2Utd2lkdGggb3IgbGVzcyBkb24ndCBuZWVkIEZhc3RDbGlja1xuXHRcdFx0XHRcdGlmIChjaHJvbWVWZXJzaW9uID4gMzEgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFdpZHRoIDw9IHdpbmRvdy5vdXRlcldpZHRoKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0Ly8gQ2hyb21lIGRlc2t0b3AgZG9lc24ndCBuZWVkIEZhc3RDbGljayAoaXNzdWUgIzE1KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGRldmljZUlzQmxhY2tCZXJyeTEwKSB7XG5cdFx0XHRibGFja2JlcnJ5VmVyc2lvbiA9IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL1ZlcnNpb25cXC8oWzAtOV0qKVxcLihbMC05XSopLyk7XG5cblx0XHRcdC8vIEJsYWNrQmVycnkgMTAuMysgZG9lcyBub3QgcmVxdWlyZSBGYXN0Y2xpY2sgbGlicmFyeS5cblx0XHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mdGxhYnMvZmFzdGNsaWNrL2lzc3Vlcy8yNTFcblx0XHRcdGlmIChibGFja2JlcnJ5VmVyc2lvblsxXSA+PSAxMCAmJiBibGFja2JlcnJ5VmVyc2lvblsyXSA+PSAzKSB7XG5cdFx0XHRcdG1ldGFWaWV3cG9ydCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21ldGFbbmFtZT12aWV3cG9ydF0nKTtcblxuXHRcdFx0XHRpZiAobWV0YVZpZXdwb3J0KSB7XG5cdFx0XHRcdFx0Ly8gdXNlci1zY2FsYWJsZT1ubyBlbGltaW5hdGVzIGNsaWNrIGRlbGF5LlxuXHRcdFx0XHRcdGlmIChtZXRhVmlld3BvcnQuY29udGVudC5pbmRleE9mKCd1c2VyLXNjYWxhYmxlPW5vJykgIT09IC0xKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gd2lkdGg9ZGV2aWNlLXdpZHRoIChvciBsZXNzIHRoYW4gZGV2aWNlLXdpZHRoKSBlbGltaW5hdGVzIGNsaWNrIGRlbGF5LlxuXHRcdFx0XHRcdGlmIChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsV2lkdGggPD0gd2luZG93Lm91dGVyV2lkdGgpIHtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIElFMTAgd2l0aCAtbXMtdG91Y2gtYWN0aW9uOiBub25lIG9yIG1hbmlwdWxhdGlvbiwgd2hpY2ggZGlzYWJsZXMgZG91YmxlLXRhcC10by16b29tIChpc3N1ZSAjOTcpXG5cdFx0aWYgKGxheWVyLnN0eWxlLm1zVG91Y2hBY3Rpb24gPT09ICdub25lJyB8fCBsYXllci5zdHlsZS50b3VjaEFjdGlvbiA9PT0gJ21hbmlwdWxhdGlvbicpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIEZpcmVmb3ggdmVyc2lvbiAtIHplcm8gZm9yIG90aGVyIGJyb3dzZXJzXG5cdFx0ZmlyZWZveFZlcnNpb24gPSArKC9GaXJlZm94XFwvKFswLTldKykvLmV4ZWMobmF2aWdhdG9yLnVzZXJBZ2VudCkgfHwgWywwXSlbMV07XG5cblx0XHRpZiAoZmlyZWZveFZlcnNpb24gPj0gMjcpIHtcblx0XHRcdC8vIEZpcmVmb3ggMjcrIGRvZXMgbm90IGhhdmUgdGFwIGRlbGF5IGlmIHRoZSBjb250ZW50IGlzIG5vdCB6b29tYWJsZSAtIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTkyMjg5NlxuXG5cdFx0XHRtZXRhVmlld3BvcnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtZXRhW25hbWU9dmlld3BvcnRdJyk7XG5cdFx0XHRpZiAobWV0YVZpZXdwb3J0ICYmIChtZXRhVmlld3BvcnQuY29udGVudC5pbmRleE9mKCd1c2VyLXNjYWxhYmxlPW5vJykgIT09IC0xIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxXaWR0aCA8PSB3aW5kb3cub3V0ZXJXaWR0aCkpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gSUUxMTogcHJlZml4ZWQgLW1zLXRvdWNoLWFjdGlvbiBpcyBubyBsb25nZXIgc3VwcG9ydGVkIGFuZCBpdCdzIHJlY29tZW5kZWQgdG8gdXNlIG5vbi1wcmVmaXhlZCB2ZXJzaW9uXG5cdFx0Ly8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L3dpbmRvd3MvYXBwcy9IaDc2NzMxMy5hc3B4XG5cdFx0aWYgKGxheWVyLnN0eWxlLnRvdWNoQWN0aW9uID09PSAnbm9uZScgfHwgbGF5ZXIuc3R5bGUudG91Y2hBY3Rpb24gPT09ICdtYW5pcHVsYXRpb24nKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH07XG5cblxuXHQvKipcblx0ICogRmFjdG9yeSBtZXRob2QgZm9yIGNyZWF0aW5nIGEgRmFzdENsaWNrIG9iamVjdFxuXHQgKlxuXHQgKiBAcGFyYW0ge0VsZW1lbnR9IGxheWVyIFRoZSBsYXllciB0byBsaXN0ZW4gb25cblx0ICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBUaGUgb3B0aW9ucyB0byBvdmVycmlkZSB0aGUgZGVmYXVsdHNcblx0ICovXG5cdEZhc3RDbGljay5hdHRhY2ggPSBmdW5jdGlvbihsYXllciwgb3B0aW9ucykge1xuXHRcdHJldHVybiBuZXcgRmFzdENsaWNrKGxheWVyLCBvcHRpb25zKTtcblx0fTtcblxuXG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBkZWZpbmUuYW1kID09PSAnb2JqZWN0JyAmJiBkZWZpbmUuYW1kKSB7XG5cblx0XHQvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG5cdFx0ZGVmaW5lKGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIEZhc3RDbGljaztcblx0XHR9KTtcblx0fSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRcdG1vZHVsZS5leHBvcnRzID0gRmFzdENsaWNrLmF0dGFjaDtcblx0XHRtb2R1bGUuZXhwb3J0cy5GYXN0Q2xpY2sgPSBGYXN0Q2xpY2s7XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LkZhc3RDbGljayA9IEZhc3RDbGljaztcblx0fVxufSgpKTtcbiIsIi8qISBIYW1tZXIuSlMgLSB2Mi4wLjcgLSAyMDE2LTA0LTIyXG4gKiBodHRwOi8vaGFtbWVyanMuZ2l0aHViLmlvL1xuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNiBKb3JpayBUYW5nZWxkZXI7XG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgKi9cbihmdW5jdGlvbih3aW5kb3csIGRvY3VtZW50LCBleHBvcnROYW1lLCB1bmRlZmluZWQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG52YXIgVkVORE9SX1BSRUZJWEVTID0gWycnLCAnd2Via2l0JywgJ01veicsICdNUycsICdtcycsICdvJ107XG52YXIgVEVTVF9FTEVNRU5UID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbnZhciBUWVBFX0ZVTkNUSU9OID0gJ2Z1bmN0aW9uJztcblxudmFyIHJvdW5kID0gTWF0aC5yb3VuZDtcbnZhciBhYnMgPSBNYXRoLmFicztcbnZhciBub3cgPSBEYXRlLm5vdztcblxuLyoqXG4gKiBzZXQgYSB0aW1lb3V0IHdpdGggYSBnaXZlbiBzY29wZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lb3V0XG4gKiBAcGFyYW0ge09iamVjdH0gY29udGV4dFxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gc2V0VGltZW91dENvbnRleHQoZm4sIHRpbWVvdXQsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gc2V0VGltZW91dChiaW5kRm4oZm4sIGNvbnRleHQpLCB0aW1lb3V0KTtcbn1cblxuLyoqXG4gKiBpZiB0aGUgYXJndW1lbnQgaXMgYW4gYXJyYXksIHdlIHdhbnQgdG8gZXhlY3V0ZSB0aGUgZm4gb24gZWFjaCBlbnRyeVxuICogaWYgaXQgYWludCBhbiBhcnJheSB3ZSBkb24ndCB3YW50IHRvIGRvIGEgdGhpbmcuXG4gKiB0aGlzIGlzIHVzZWQgYnkgYWxsIHRoZSBtZXRob2RzIHRoYXQgYWNjZXB0IGEgc2luZ2xlIGFuZCBhcnJheSBhcmd1bWVudC5cbiAqIEBwYXJhbSB7KnxBcnJheX0gYXJnXG4gKiBAcGFyYW0ge1N0cmluZ30gZm5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF1cbiAqIEByZXR1cm5zIHtCb29sZWFufVxuICovXG5mdW5jdGlvbiBpbnZva2VBcnJheUFyZyhhcmcsIGZuLCBjb250ZXh0KSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuICAgICAgICBlYWNoKGFyZywgY29udGV4dFtmbl0sIGNvbnRleHQpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIHdhbGsgb2JqZWN0cyBhbmQgYXJyYXlzXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRvclxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHRcbiAqL1xuZnVuY3Rpb24gZWFjaChvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIGk7XG5cbiAgICBpZiAoIW9iaikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG9iai5mb3JFYWNoKSB7XG4gICAgICAgIG9iai5mb3JFYWNoKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCBvYmoubGVuZ3RoKSB7XG4gICAgICAgICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoaSBpbiBvYmopIHtcbiAgICAgICAgICAgIG9iai5oYXNPd25Qcm9wZXJ0eShpKSAmJiBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiB3cmFwIGEgbWV0aG9kIHdpdGggYSBkZXByZWNhdGlvbiB3YXJuaW5nIGFuZCBzdGFjayB0cmFjZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gQSBuZXcgZnVuY3Rpb24gd3JhcHBpbmcgdGhlIHN1cHBsaWVkIG1ldGhvZC5cbiAqL1xuZnVuY3Rpb24gZGVwcmVjYXRlKG1ldGhvZCwgbmFtZSwgbWVzc2FnZSkge1xuICAgIHZhciBkZXByZWNhdGlvbk1lc3NhZ2UgPSAnREVQUkVDQVRFRCBNRVRIT0Q6ICcgKyBuYW1lICsgJ1xcbicgKyBtZXNzYWdlICsgJyBBVCBcXG4nO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGUgPSBuZXcgRXJyb3IoJ2dldC1zdGFjay10cmFjZScpO1xuICAgICAgICB2YXIgc3RhY2sgPSBlICYmIGUuc3RhY2sgPyBlLnN0YWNrLnJlcGxhY2UoL15bXlxcKF0rP1tcXG4kXS9nbSwgJycpXG4gICAgICAgICAgICAucmVwbGFjZSgvXlxccythdFxccysvZ20sICcnKVxuICAgICAgICAgICAgLnJlcGxhY2UoL15PYmplY3QuPGFub255bW91cz5cXHMqXFwoL2dtLCAne2Fub255bW91c30oKUAnKSA6ICdVbmtub3duIFN0YWNrIFRyYWNlJztcblxuICAgICAgICB2YXIgbG9nID0gd2luZG93LmNvbnNvbGUgJiYgKHdpbmRvdy5jb25zb2xlLndhcm4gfHwgd2luZG93LmNvbnNvbGUubG9nKTtcbiAgICAgICAgaWYgKGxvZykge1xuICAgICAgICAgICAgbG9nLmNhbGwod2luZG93LmNvbnNvbGUsIGRlcHJlY2F0aW9uTWVzc2FnZSwgc3RhY2spO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtZXRob2QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuXG4vKipcbiAqIGV4dGVuZCBvYmplY3QuXG4gKiBtZWFucyB0aGF0IHByb3BlcnRpZXMgaW4gZGVzdCB3aWxsIGJlIG92ZXJ3cml0dGVuIGJ5IHRoZSBvbmVzIGluIHNyYy5cbiAqIEBwYXJhbSB7T2JqZWN0fSB0YXJnZXRcbiAqIEBwYXJhbSB7Li4uT2JqZWN0fSBvYmplY3RzX3RvX2Fzc2lnblxuICogQHJldHVybnMge09iamVjdH0gdGFyZ2V0XG4gKi9cbnZhciBhc3NpZ247XG5pZiAodHlwZW9mIE9iamVjdC5hc3NpZ24gIT09ICdmdW5jdGlvbicpIHtcbiAgICBhc3NpZ24gPSBmdW5jdGlvbiBhc3NpZ24odGFyZ2V0KSB7XG4gICAgICAgIGlmICh0YXJnZXQgPT09IHVuZGVmaW5lZCB8fCB0YXJnZXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjb252ZXJ0IHVuZGVmaW5lZCBvciBudWxsIHRvIG9iamVjdCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG91dHB1dCA9IE9iamVjdCh0YXJnZXQpO1xuICAgICAgICBmb3IgKHZhciBpbmRleCA9IDE7IGluZGV4IDwgYXJndW1lbnRzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpbmRleF07XG4gICAgICAgICAgICBpZiAoc291cmNlICE9PSB1bmRlZmluZWQgJiYgc291cmNlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbmV4dEtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShuZXh0S2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0W25leHRLZXldID0gc291cmNlW25leHRLZXldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfTtcbn0gZWxzZSB7XG4gICAgYXNzaWduID0gT2JqZWN0LmFzc2lnbjtcbn1cblxuLyoqXG4gKiBleHRlbmQgb2JqZWN0LlxuICogbWVhbnMgdGhhdCBwcm9wZXJ0aWVzIGluIGRlc3Qgd2lsbCBiZSBvdmVyd3JpdHRlbiBieSB0aGUgb25lcyBpbiBzcmMuXG4gKiBAcGFyYW0ge09iamVjdH0gZGVzdFxuICogQHBhcmFtIHtPYmplY3R9IHNyY1xuICogQHBhcmFtIHtCb29sZWFufSBbbWVyZ2U9ZmFsc2VdXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBkZXN0XG4gKi9cbnZhciBleHRlbmQgPSBkZXByZWNhdGUoZnVuY3Rpb24gZXh0ZW5kKGRlc3QsIHNyYywgbWVyZ2UpIHtcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHNyYyk7XG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlIChpIDwga2V5cy5sZW5ndGgpIHtcbiAgICAgICAgaWYgKCFtZXJnZSB8fCAobWVyZ2UgJiYgZGVzdFtrZXlzW2ldXSA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAgICAgZGVzdFtrZXlzW2ldXSA9IHNyY1trZXlzW2ldXTtcbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgfVxuICAgIHJldHVybiBkZXN0O1xufSwgJ2V4dGVuZCcsICdVc2UgYGFzc2lnbmAuJyk7XG5cbi8qKlxuICogbWVyZ2UgdGhlIHZhbHVlcyBmcm9tIHNyYyBpbiB0aGUgZGVzdC5cbiAqIG1lYW5zIHRoYXQgcHJvcGVydGllcyB0aGF0IGV4aXN0IGluIGRlc3Qgd2lsbCBub3QgYmUgb3ZlcndyaXR0ZW4gYnkgc3JjXG4gKiBAcGFyYW0ge09iamVjdH0gZGVzdFxuICogQHBhcmFtIHtPYmplY3R9IHNyY1xuICogQHJldHVybnMge09iamVjdH0gZGVzdFxuICovXG52YXIgbWVyZ2UgPSBkZXByZWNhdGUoZnVuY3Rpb24gbWVyZ2UoZGVzdCwgc3JjKSB7XG4gICAgcmV0dXJuIGV4dGVuZChkZXN0LCBzcmMsIHRydWUpO1xufSwgJ21lcmdlJywgJ1VzZSBgYXNzaWduYC4nKTtcblxuLyoqXG4gKiBzaW1wbGUgY2xhc3MgaW5oZXJpdGFuY2VcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNoaWxkXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBiYXNlXG4gKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXNdXG4gKi9cbmZ1bmN0aW9uIGluaGVyaXQoY2hpbGQsIGJhc2UsIHByb3BlcnRpZXMpIHtcbiAgICB2YXIgYmFzZVAgPSBiYXNlLnByb3RvdHlwZSxcbiAgICAgICAgY2hpbGRQO1xuXG4gICAgY2hpbGRQID0gY2hpbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShiYXNlUCk7XG4gICAgY2hpbGRQLmNvbnN0cnVjdG9yID0gY2hpbGQ7XG4gICAgY2hpbGRQLl9zdXBlciA9IGJhc2VQO1xuXG4gICAgaWYgKHByb3BlcnRpZXMpIHtcbiAgICAgICAgYXNzaWduKGNoaWxkUCwgcHJvcGVydGllcyk7XG4gICAgfVxufVxuXG4vKipcbiAqIHNpbXBsZSBmdW5jdGlvbiBiaW5kXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHRcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn1cbiAqL1xuZnVuY3Rpb24gYmluZEZuKGZuLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGJvdW5kRm4oKSB7XG4gICAgICAgIHJldHVybiBmbi5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpO1xuICAgIH07XG59XG5cbi8qKlxuICogbGV0IGEgYm9vbGVhbiB2YWx1ZSBhbHNvIGJlIGEgZnVuY3Rpb24gdGhhdCBtdXN0IHJldHVybiBhIGJvb2xlYW5cbiAqIHRoaXMgZmlyc3QgaXRlbSBpbiBhcmdzIHdpbGwgYmUgdXNlZCBhcyB0aGUgY29udGV4dFxuICogQHBhcmFtIHtCb29sZWFufEZ1bmN0aW9ufSB2YWxcbiAqIEBwYXJhbSB7QXJyYXl9IFthcmdzXVxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGJvb2xPckZuKHZhbCwgYXJncykge1xuICAgIGlmICh0eXBlb2YgdmFsID09IFRZUEVfRlVOQ1RJT04pIHtcbiAgICAgICAgcmV0dXJuIHZhbC5hcHBseShhcmdzID8gYXJnc1swXSB8fCB1bmRlZmluZWQgOiB1bmRlZmluZWQsIGFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsO1xufVxuXG4vKipcbiAqIHVzZSB0aGUgdmFsMiB3aGVuIHZhbDEgaXMgdW5kZWZpbmVkXG4gKiBAcGFyYW0geyp9IHZhbDFcbiAqIEBwYXJhbSB7Kn0gdmFsMlxuICogQHJldHVybnMgeyp9XG4gKi9cbmZ1bmN0aW9uIGlmVW5kZWZpbmVkKHZhbDEsIHZhbDIpIHtcbiAgICByZXR1cm4gKHZhbDEgPT09IHVuZGVmaW5lZCkgPyB2YWwyIDogdmFsMTtcbn1cblxuLyoqXG4gKiBhZGRFdmVudExpc3RlbmVyIHdpdGggbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2VcbiAqIEBwYXJhbSB7RXZlbnRUYXJnZXR9IHRhcmdldFxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyXG4gKi9cbmZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXJzKHRhcmdldCwgdHlwZXMsIGhhbmRsZXIpIHtcbiAgICBlYWNoKHNwbGl0U3RyKHR5cGVzKSwgZnVuY3Rpb24odHlwZSkge1xuICAgICAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogcmVtb3ZlRXZlbnRMaXN0ZW5lciB3aXRoIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlXG4gKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fSB0YXJnZXRcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlclxuICovXG5mdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVycyh0YXJnZXQsIHR5cGVzLCBoYW5kbGVyKSB7XG4gICAgZWFjaChzcGxpdFN0cih0eXBlcyksIGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgdGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIGZpbmQgaWYgYSBub2RlIGlzIGluIHRoZSBnaXZlbiBwYXJlbnRcbiAqIEBtZXRob2QgaGFzUGFyZW50XG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBub2RlXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBwYXJlbnRcbiAqIEByZXR1cm4ge0Jvb2xlYW59IGZvdW5kXG4gKi9cbmZ1bmN0aW9uIGhhc1BhcmVudChub2RlLCBwYXJlbnQpIHtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAobm9kZSA9PSBwYXJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBzbWFsbCBpbmRleE9mIHdyYXBwZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaW5kXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gZm91bmRcbiAqL1xuZnVuY3Rpb24gaW5TdHIoc3RyLCBmaW5kKSB7XG4gICAgcmV0dXJuIHN0ci5pbmRleE9mKGZpbmQpID4gLTE7XG59XG5cbi8qKlxuICogc3BsaXQgc3RyaW5nIG9uIHdoaXRlc3BhY2VcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm5zIHtBcnJheX0gd29yZHNcbiAqL1xuZnVuY3Rpb24gc3BsaXRTdHIoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci50cmltKCkuc3BsaXQoL1xccysvZyk7XG59XG5cbi8qKlxuICogZmluZCBpZiBhIGFycmF5IGNvbnRhaW5zIHRoZSBvYmplY3QgdXNpbmcgaW5kZXhPZiBvciBhIHNpbXBsZSBwb2x5RmlsbFxuICogQHBhcmFtIHtBcnJheX0gc3JjXG4gKiBAcGFyYW0ge1N0cmluZ30gZmluZFxuICogQHBhcmFtIHtTdHJpbmd9IFtmaW5kQnlLZXldXG4gKiBAcmV0dXJuIHtCb29sZWFufE51bWJlcn0gZmFsc2Ugd2hlbiBub3QgZm91bmQsIG9yIHRoZSBpbmRleFxuICovXG5mdW5jdGlvbiBpbkFycmF5KHNyYywgZmluZCwgZmluZEJ5S2V5KSB7XG4gICAgaWYgKHNyYy5pbmRleE9mICYmICFmaW5kQnlLZXkpIHtcbiAgICAgICAgcmV0dXJuIHNyYy5pbmRleE9mKGZpbmQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCBzcmMubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoKGZpbmRCeUtleSAmJiBzcmNbaV1bZmluZEJ5S2V5XSA9PSBmaW5kKSB8fCAoIWZpbmRCeUtleSAmJiBzcmNbaV0gPT09IGZpbmQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbn1cblxuLyoqXG4gKiBjb252ZXJ0IGFycmF5LWxpa2Ugb2JqZWN0cyB0byByZWFsIGFycmF5c1xuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybnMge0FycmF5fVxuICovXG5mdW5jdGlvbiB0b0FycmF5KG9iaikge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChvYmosIDApO1xufVxuXG4vKipcbiAqIHVuaXF1ZSBhcnJheSB3aXRoIG9iamVjdHMgYmFzZWQgb24gYSBrZXkgKGxpa2UgJ2lkJykgb3IganVzdCBieSB0aGUgYXJyYXkncyB2YWx1ZVxuICogQHBhcmFtIHtBcnJheX0gc3JjIFt7aWQ6MX0se2lkOjJ9LHtpZDoxfV1cbiAqIEBwYXJhbSB7U3RyaW5nfSBba2V5XVxuICogQHBhcmFtIHtCb29sZWFufSBbc29ydD1GYWxzZV1cbiAqIEByZXR1cm5zIHtBcnJheX0gW3tpZDoxfSx7aWQ6Mn1dXG4gKi9cbmZ1bmN0aW9uIHVuaXF1ZUFycmF5KHNyYywga2V5LCBzb3J0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICB2YXIgdmFsdWVzID0gW107XG4gICAgdmFyIGkgPSAwO1xuXG4gICAgd2hpbGUgKGkgPCBzcmMubGVuZ3RoKSB7XG4gICAgICAgIHZhciB2YWwgPSBrZXkgPyBzcmNbaV1ba2V5XSA6IHNyY1tpXTtcbiAgICAgICAgaWYgKGluQXJyYXkodmFsdWVzLCB2YWwpIDwgMCkge1xuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHNyY1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFsdWVzW2ldID0gdmFsO1xuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgaWYgKHNvcnQpIHtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLnNvcnQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLnNvcnQoZnVuY3Rpb24gc29ydFVuaXF1ZUFycmF5KGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYVtrZXldID4gYltrZXldO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqXG4gKiBnZXQgdGhlIHByZWZpeGVkIHByb3BlcnR5XG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge1N0cmluZ30gcHJvcGVydHlcbiAqIEByZXR1cm5zIHtTdHJpbmd8VW5kZWZpbmVkfSBwcmVmaXhlZFxuICovXG5mdW5jdGlvbiBwcmVmaXhlZChvYmosIHByb3BlcnR5KSB7XG4gICAgdmFyIHByZWZpeCwgcHJvcDtcbiAgICB2YXIgY2FtZWxQcm9wID0gcHJvcGVydHlbMF0udG9VcHBlckNhc2UoKSArIHByb3BlcnR5LnNsaWNlKDEpO1xuXG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlIChpIDwgVkVORE9SX1BSRUZJWEVTLmxlbmd0aCkge1xuICAgICAgICBwcmVmaXggPSBWRU5ET1JfUFJFRklYRVNbaV07XG4gICAgICAgIHByb3AgPSAocHJlZml4KSA/IHByZWZpeCArIGNhbWVsUHJvcCA6IHByb3BlcnR5O1xuXG4gICAgICAgIGlmIChwcm9wIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIHByb3A7XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIGdldCBhIHVuaXF1ZSBpZFxuICogQHJldHVybnMge251bWJlcn0gdW5pcXVlSWRcbiAqL1xudmFyIF91bmlxdWVJZCA9IDE7XG5mdW5jdGlvbiB1bmlxdWVJZCgpIHtcbiAgICByZXR1cm4gX3VuaXF1ZUlkKys7XG59XG5cbi8qKlxuICogZ2V0IHRoZSB3aW5kb3cgb2JqZWN0IG9mIGFuIGVsZW1lbnRcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAqIEByZXR1cm5zIHtEb2N1bWVudFZpZXd8V2luZG93fVxuICovXG5mdW5jdGlvbiBnZXRXaW5kb3dGb3JFbGVtZW50KGVsZW1lbnQpIHtcbiAgICB2YXIgZG9jID0gZWxlbWVudC5vd25lckRvY3VtZW50IHx8IGVsZW1lbnQ7XG4gICAgcmV0dXJuIChkb2MuZGVmYXVsdFZpZXcgfHwgZG9jLnBhcmVudFdpbmRvdyB8fCB3aW5kb3cpO1xufVxuXG52YXIgTU9CSUxFX1JFR0VYID0gL21vYmlsZXx0YWJsZXR8aXAoYWR8aG9uZXxvZCl8YW5kcm9pZC9pO1xuXG52YXIgU1VQUE9SVF9UT1VDSCA9ICgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cpO1xudmFyIFNVUFBPUlRfUE9JTlRFUl9FVkVOVFMgPSBwcmVmaXhlZCh3aW5kb3csICdQb2ludGVyRXZlbnQnKSAhPT0gdW5kZWZpbmVkO1xudmFyIFNVUFBPUlRfT05MWV9UT1VDSCA9IFNVUFBPUlRfVE9VQ0ggJiYgTU9CSUxFX1JFR0VYLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG5cbnZhciBJTlBVVF9UWVBFX1RPVUNIID0gJ3RvdWNoJztcbnZhciBJTlBVVF9UWVBFX1BFTiA9ICdwZW4nO1xudmFyIElOUFVUX1RZUEVfTU9VU0UgPSAnbW91c2UnO1xudmFyIElOUFVUX1RZUEVfS0lORUNUID0gJ2tpbmVjdCc7XG5cbnZhciBDT01QVVRFX0lOVEVSVkFMID0gMjU7XG5cbnZhciBJTlBVVF9TVEFSVCA9IDE7XG52YXIgSU5QVVRfTU9WRSA9IDI7XG52YXIgSU5QVVRfRU5EID0gNDtcbnZhciBJTlBVVF9DQU5DRUwgPSA4O1xuXG52YXIgRElSRUNUSU9OX05PTkUgPSAxO1xudmFyIERJUkVDVElPTl9MRUZUID0gMjtcbnZhciBESVJFQ1RJT05fUklHSFQgPSA0O1xudmFyIERJUkVDVElPTl9VUCA9IDg7XG52YXIgRElSRUNUSU9OX0RPV04gPSAxNjtcblxudmFyIERJUkVDVElPTl9IT1JJWk9OVEFMID0gRElSRUNUSU9OX0xFRlQgfCBESVJFQ1RJT05fUklHSFQ7XG52YXIgRElSRUNUSU9OX1ZFUlRJQ0FMID0gRElSRUNUSU9OX1VQIHwgRElSRUNUSU9OX0RPV047XG52YXIgRElSRUNUSU9OX0FMTCA9IERJUkVDVElPTl9IT1JJWk9OVEFMIHwgRElSRUNUSU9OX1ZFUlRJQ0FMO1xuXG52YXIgUFJPUFNfWFkgPSBbJ3gnLCAneSddO1xudmFyIFBST1BTX0NMSUVOVF9YWSA9IFsnY2xpZW50WCcsICdjbGllbnRZJ107XG5cbi8qKlxuICogY3JlYXRlIG5ldyBpbnB1dCB0eXBlIG1hbmFnZXJcbiAqIEBwYXJhbSB7TWFuYWdlcn0gbWFuYWdlclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm5zIHtJbnB1dH1cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBJbnB1dChtYW5hZ2VyLCBjYWxsYmFjaykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLm1hbmFnZXIgPSBtYW5hZ2VyO1xuICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICB0aGlzLmVsZW1lbnQgPSBtYW5hZ2VyLmVsZW1lbnQ7XG4gICAgdGhpcy50YXJnZXQgPSBtYW5hZ2VyLm9wdGlvbnMuaW5wdXRUYXJnZXQ7XG5cbiAgICAvLyBzbWFsbGVyIHdyYXBwZXIgYXJvdW5kIHRoZSBoYW5kbGVyLCBmb3IgdGhlIHNjb3BlIGFuZCB0aGUgZW5hYmxlZCBzdGF0ZSBvZiB0aGUgbWFuYWdlcixcbiAgICAvLyBzbyB3aGVuIGRpc2FibGVkIHRoZSBpbnB1dCBldmVudHMgYXJlIGNvbXBsZXRlbHkgYnlwYXNzZWQuXG4gICAgdGhpcy5kb21IYW5kbGVyID0gZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgaWYgKGJvb2xPckZuKG1hbmFnZXIub3B0aW9ucy5lbmFibGUsIFttYW5hZ2VyXSkpIHtcbiAgICAgICAgICAgIHNlbGYuaGFuZGxlcihldik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy5pbml0KCk7XG5cbn1cblxuSW5wdXQucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIHNob3VsZCBoYW5kbGUgdGhlIGlucHV0RXZlbnQgZGF0YSBhbmQgdHJpZ2dlciB0aGUgY2FsbGJhY2tcbiAgICAgKiBAdmlydHVhbFxuICAgICAqL1xuICAgIGhhbmRsZXI6IGZ1bmN0aW9uKCkgeyB9LFxuXG4gICAgLyoqXG4gICAgICogYmluZCB0aGUgZXZlbnRzXG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZXZFbCAmJiBhZGRFdmVudExpc3RlbmVycyh0aGlzLmVsZW1lbnQsIHRoaXMuZXZFbCwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICAgICAgdGhpcy5ldlRhcmdldCAmJiBhZGRFdmVudExpc3RlbmVycyh0aGlzLnRhcmdldCwgdGhpcy5ldlRhcmdldCwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICAgICAgdGhpcy5ldldpbiAmJiBhZGRFdmVudExpc3RlbmVycyhnZXRXaW5kb3dGb3JFbGVtZW50KHRoaXMuZWxlbWVudCksIHRoaXMuZXZXaW4sIHRoaXMuZG9tSGFuZGxlcik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHVuYmluZCB0aGUgZXZlbnRzXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZXZFbCAmJiByZW1vdmVFdmVudExpc3RlbmVycyh0aGlzLmVsZW1lbnQsIHRoaXMuZXZFbCwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICAgICAgdGhpcy5ldlRhcmdldCAmJiByZW1vdmVFdmVudExpc3RlbmVycyh0aGlzLnRhcmdldCwgdGhpcy5ldlRhcmdldCwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICAgICAgdGhpcy5ldldpbiAmJiByZW1vdmVFdmVudExpc3RlbmVycyhnZXRXaW5kb3dGb3JFbGVtZW50KHRoaXMuZWxlbWVudCksIHRoaXMuZXZXaW4sIHRoaXMuZG9tSGFuZGxlcik7XG4gICAgfVxufTtcblxuLyoqXG4gKiBjcmVhdGUgbmV3IGlucHV0IHR5cGUgbWFuYWdlclxuICogY2FsbGVkIGJ5IHRoZSBNYW5hZ2VyIGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge0hhbW1lcn0gbWFuYWdlclxuICogQHJldHVybnMge0lucHV0fVxuICovXG5mdW5jdGlvbiBjcmVhdGVJbnB1dEluc3RhbmNlKG1hbmFnZXIpIHtcbiAgICB2YXIgVHlwZTtcbiAgICB2YXIgaW5wdXRDbGFzcyA9IG1hbmFnZXIub3B0aW9ucy5pbnB1dENsYXNzO1xuXG4gICAgaWYgKGlucHV0Q2xhc3MpIHtcbiAgICAgICAgVHlwZSA9IGlucHV0Q2xhc3M7XG4gICAgfSBlbHNlIGlmIChTVVBQT1JUX1BPSU5URVJfRVZFTlRTKSB7XG4gICAgICAgIFR5cGUgPSBQb2ludGVyRXZlbnRJbnB1dDtcbiAgICB9IGVsc2UgaWYgKFNVUFBPUlRfT05MWV9UT1VDSCkge1xuICAgICAgICBUeXBlID0gVG91Y2hJbnB1dDtcbiAgICB9IGVsc2UgaWYgKCFTVVBQT1JUX1RPVUNIKSB7XG4gICAgICAgIFR5cGUgPSBNb3VzZUlucHV0O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIFR5cGUgPSBUb3VjaE1vdXNlSW5wdXQ7XG4gICAgfVxuICAgIHJldHVybiBuZXcgKFR5cGUpKG1hbmFnZXIsIGlucHV0SGFuZGxlcik7XG59XG5cbi8qKlxuICogaGFuZGxlIGlucHV0IGV2ZW50c1xuICogQHBhcmFtIHtNYW5hZ2VyfSBtYW5hZ2VyXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRUeXBlXG4gKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAqL1xuZnVuY3Rpb24gaW5wdXRIYW5kbGVyKG1hbmFnZXIsIGV2ZW50VHlwZSwgaW5wdXQpIHtcbiAgICB2YXIgcG9pbnRlcnNMZW4gPSBpbnB1dC5wb2ludGVycy5sZW5ndGg7XG4gICAgdmFyIGNoYW5nZWRQb2ludGVyc0xlbiA9IGlucHV0LmNoYW5nZWRQb2ludGVycy5sZW5ndGg7XG4gICAgdmFyIGlzRmlyc3QgPSAoZXZlbnRUeXBlICYgSU5QVVRfU1RBUlQgJiYgKHBvaW50ZXJzTGVuIC0gY2hhbmdlZFBvaW50ZXJzTGVuID09PSAwKSk7XG4gICAgdmFyIGlzRmluYWwgPSAoZXZlbnRUeXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkgJiYgKHBvaW50ZXJzTGVuIC0gY2hhbmdlZFBvaW50ZXJzTGVuID09PSAwKSk7XG5cbiAgICBpbnB1dC5pc0ZpcnN0ID0gISFpc0ZpcnN0O1xuICAgIGlucHV0LmlzRmluYWwgPSAhIWlzRmluYWw7XG5cbiAgICBpZiAoaXNGaXJzdCkge1xuICAgICAgICBtYW5hZ2VyLnNlc3Npb24gPSB7fTtcbiAgICB9XG5cbiAgICAvLyBzb3VyY2UgZXZlbnQgaXMgdGhlIG5vcm1hbGl6ZWQgdmFsdWUgb2YgdGhlIGRvbUV2ZW50c1xuICAgIC8vIGxpa2UgJ3RvdWNoc3RhcnQsIG1vdXNldXAsIHBvaW50ZXJkb3duJ1xuICAgIGlucHV0LmV2ZW50VHlwZSA9IGV2ZW50VHlwZTtcblxuICAgIC8vIGNvbXB1dGUgc2NhbGUsIHJvdGF0aW9uIGV0Y1xuICAgIGNvbXB1dGVJbnB1dERhdGEobWFuYWdlciwgaW5wdXQpO1xuXG4gICAgLy8gZW1pdCBzZWNyZXQgZXZlbnRcbiAgICBtYW5hZ2VyLmVtaXQoJ2hhbW1lci5pbnB1dCcsIGlucHV0KTtcblxuICAgIG1hbmFnZXIucmVjb2duaXplKGlucHV0KTtcbiAgICBtYW5hZ2VyLnNlc3Npb24ucHJldklucHV0ID0gaW5wdXQ7XG59XG5cbi8qKlxuICogZXh0ZW5kIHRoZSBkYXRhIHdpdGggc29tZSB1c2FibGUgcHJvcGVydGllcyBsaWtlIHNjYWxlLCByb3RhdGUsIHZlbG9jaXR5IGV0Y1xuICogQHBhcmFtIHtPYmplY3R9IG1hbmFnZXJcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICovXG5mdW5jdGlvbiBjb21wdXRlSW5wdXREYXRhKG1hbmFnZXIsIGlucHV0KSB7XG4gICAgdmFyIHNlc3Npb24gPSBtYW5hZ2VyLnNlc3Npb247XG4gICAgdmFyIHBvaW50ZXJzID0gaW5wdXQucG9pbnRlcnM7XG4gICAgdmFyIHBvaW50ZXJzTGVuZ3RoID0gcG9pbnRlcnMubGVuZ3RoO1xuXG4gICAgLy8gc3RvcmUgdGhlIGZpcnN0IGlucHV0IHRvIGNhbGN1bGF0ZSB0aGUgZGlzdGFuY2UgYW5kIGRpcmVjdGlvblxuICAgIGlmICghc2Vzc2lvbi5maXJzdElucHV0KSB7XG4gICAgICAgIHNlc3Npb24uZmlyc3RJbnB1dCA9IHNpbXBsZUNsb25lSW5wdXREYXRhKGlucHV0KTtcbiAgICB9XG5cbiAgICAvLyB0byBjb21wdXRlIHNjYWxlIGFuZCByb3RhdGlvbiB3ZSBuZWVkIHRvIHN0b3JlIHRoZSBtdWx0aXBsZSB0b3VjaGVzXG4gICAgaWYgKHBvaW50ZXJzTGVuZ3RoID4gMSAmJiAhc2Vzc2lvbi5maXJzdE11bHRpcGxlKSB7XG4gICAgICAgIHNlc3Npb24uZmlyc3RNdWx0aXBsZSA9IHNpbXBsZUNsb25lSW5wdXREYXRhKGlucHV0KTtcbiAgICB9IGVsc2UgaWYgKHBvaW50ZXJzTGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHNlc3Npb24uZmlyc3RNdWx0aXBsZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBmaXJzdElucHV0ID0gc2Vzc2lvbi5maXJzdElucHV0O1xuICAgIHZhciBmaXJzdE11bHRpcGxlID0gc2Vzc2lvbi5maXJzdE11bHRpcGxlO1xuICAgIHZhciBvZmZzZXRDZW50ZXIgPSBmaXJzdE11bHRpcGxlID8gZmlyc3RNdWx0aXBsZS5jZW50ZXIgOiBmaXJzdElucHV0LmNlbnRlcjtcblxuICAgIHZhciBjZW50ZXIgPSBpbnB1dC5jZW50ZXIgPSBnZXRDZW50ZXIocG9pbnRlcnMpO1xuICAgIGlucHV0LnRpbWVTdGFtcCA9IG5vdygpO1xuICAgIGlucHV0LmRlbHRhVGltZSA9IGlucHV0LnRpbWVTdGFtcCAtIGZpcnN0SW5wdXQudGltZVN0YW1wO1xuXG4gICAgaW5wdXQuYW5nbGUgPSBnZXRBbmdsZShvZmZzZXRDZW50ZXIsIGNlbnRlcik7XG4gICAgaW5wdXQuZGlzdGFuY2UgPSBnZXREaXN0YW5jZShvZmZzZXRDZW50ZXIsIGNlbnRlcik7XG5cbiAgICBjb21wdXRlRGVsdGFYWShzZXNzaW9uLCBpbnB1dCk7XG4gICAgaW5wdXQub2Zmc2V0RGlyZWN0aW9uID0gZ2V0RGlyZWN0aW9uKGlucHV0LmRlbHRhWCwgaW5wdXQuZGVsdGFZKTtcblxuICAgIHZhciBvdmVyYWxsVmVsb2NpdHkgPSBnZXRWZWxvY2l0eShpbnB1dC5kZWx0YVRpbWUsIGlucHV0LmRlbHRhWCwgaW5wdXQuZGVsdGFZKTtcbiAgICBpbnB1dC5vdmVyYWxsVmVsb2NpdHlYID0gb3ZlcmFsbFZlbG9jaXR5Lng7XG4gICAgaW5wdXQub3ZlcmFsbFZlbG9jaXR5WSA9IG92ZXJhbGxWZWxvY2l0eS55O1xuICAgIGlucHV0Lm92ZXJhbGxWZWxvY2l0eSA9IChhYnMob3ZlcmFsbFZlbG9jaXR5LngpID4gYWJzKG92ZXJhbGxWZWxvY2l0eS55KSkgPyBvdmVyYWxsVmVsb2NpdHkueCA6IG92ZXJhbGxWZWxvY2l0eS55O1xuXG4gICAgaW5wdXQuc2NhbGUgPSBmaXJzdE11bHRpcGxlID8gZ2V0U2NhbGUoZmlyc3RNdWx0aXBsZS5wb2ludGVycywgcG9pbnRlcnMpIDogMTtcbiAgICBpbnB1dC5yb3RhdGlvbiA9IGZpcnN0TXVsdGlwbGUgPyBnZXRSb3RhdGlvbihmaXJzdE11bHRpcGxlLnBvaW50ZXJzLCBwb2ludGVycykgOiAwO1xuXG4gICAgaW5wdXQubWF4UG9pbnRlcnMgPSAhc2Vzc2lvbi5wcmV2SW5wdXQgPyBpbnB1dC5wb2ludGVycy5sZW5ndGggOiAoKGlucHV0LnBvaW50ZXJzLmxlbmd0aCA+XG4gICAgICAgIHNlc3Npb24ucHJldklucHV0Lm1heFBvaW50ZXJzKSA/IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA6IHNlc3Npb24ucHJldklucHV0Lm1heFBvaW50ZXJzKTtcblxuICAgIGNvbXB1dGVJbnRlcnZhbElucHV0RGF0YShzZXNzaW9uLCBpbnB1dCk7XG5cbiAgICAvLyBmaW5kIHRoZSBjb3JyZWN0IHRhcmdldFxuICAgIHZhciB0YXJnZXQgPSBtYW5hZ2VyLmVsZW1lbnQ7XG4gICAgaWYgKGhhc1BhcmVudChpbnB1dC5zcmNFdmVudC50YXJnZXQsIHRhcmdldCkpIHtcbiAgICAgICAgdGFyZ2V0ID0gaW5wdXQuc3JjRXZlbnQudGFyZ2V0O1xuICAgIH1cbiAgICBpbnB1dC50YXJnZXQgPSB0YXJnZXQ7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVEZWx0YVhZKHNlc3Npb24sIGlucHV0KSB7XG4gICAgdmFyIGNlbnRlciA9IGlucHV0LmNlbnRlcjtcbiAgICB2YXIgb2Zmc2V0ID0gc2Vzc2lvbi5vZmZzZXREZWx0YSB8fCB7fTtcbiAgICB2YXIgcHJldkRlbHRhID0gc2Vzc2lvbi5wcmV2RGVsdGEgfHwge307XG4gICAgdmFyIHByZXZJbnB1dCA9IHNlc3Npb24ucHJldklucHV0IHx8IHt9O1xuXG4gICAgaWYgKGlucHV0LmV2ZW50VHlwZSA9PT0gSU5QVVRfU1RBUlQgfHwgcHJldklucHV0LmV2ZW50VHlwZSA9PT0gSU5QVVRfRU5EKSB7XG4gICAgICAgIHByZXZEZWx0YSA9IHNlc3Npb24ucHJldkRlbHRhID0ge1xuICAgICAgICAgICAgeDogcHJldklucHV0LmRlbHRhWCB8fCAwLFxuICAgICAgICAgICAgeTogcHJldklucHV0LmRlbHRhWSB8fCAwXG4gICAgICAgIH07XG5cbiAgICAgICAgb2Zmc2V0ID0gc2Vzc2lvbi5vZmZzZXREZWx0YSA9IHtcbiAgICAgICAgICAgIHg6IGNlbnRlci54LFxuICAgICAgICAgICAgeTogY2VudGVyLnlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpbnB1dC5kZWx0YVggPSBwcmV2RGVsdGEueCArIChjZW50ZXIueCAtIG9mZnNldC54KTtcbiAgICBpbnB1dC5kZWx0YVkgPSBwcmV2RGVsdGEueSArIChjZW50ZXIueSAtIG9mZnNldC55KTtcbn1cblxuLyoqXG4gKiB2ZWxvY2l0eSBpcyBjYWxjdWxhdGVkIGV2ZXJ5IHggbXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBzZXNzaW9uXG4gKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUludGVydmFsSW5wdXREYXRhKHNlc3Npb24sIGlucHV0KSB7XG4gICAgdmFyIGxhc3QgPSBzZXNzaW9uLmxhc3RJbnRlcnZhbCB8fCBpbnB1dCxcbiAgICAgICAgZGVsdGFUaW1lID0gaW5wdXQudGltZVN0YW1wIC0gbGFzdC50aW1lU3RhbXAsXG4gICAgICAgIHZlbG9jaXR5LCB2ZWxvY2l0eVgsIHZlbG9jaXR5WSwgZGlyZWN0aW9uO1xuXG4gICAgaWYgKGlucHV0LmV2ZW50VHlwZSAhPSBJTlBVVF9DQU5DRUwgJiYgKGRlbHRhVGltZSA+IENPTVBVVEVfSU5URVJWQUwgfHwgbGFzdC52ZWxvY2l0eSA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICB2YXIgZGVsdGFYID0gaW5wdXQuZGVsdGFYIC0gbGFzdC5kZWx0YVg7XG4gICAgICAgIHZhciBkZWx0YVkgPSBpbnB1dC5kZWx0YVkgLSBsYXN0LmRlbHRhWTtcblxuICAgICAgICB2YXIgdiA9IGdldFZlbG9jaXR5KGRlbHRhVGltZSwgZGVsdGFYLCBkZWx0YVkpO1xuICAgICAgICB2ZWxvY2l0eVggPSB2Lng7XG4gICAgICAgIHZlbG9jaXR5WSA9IHYueTtcbiAgICAgICAgdmVsb2NpdHkgPSAoYWJzKHYueCkgPiBhYnModi55KSkgPyB2LnggOiB2Lnk7XG4gICAgICAgIGRpcmVjdGlvbiA9IGdldERpcmVjdGlvbihkZWx0YVgsIGRlbHRhWSk7XG5cbiAgICAgICAgc2Vzc2lvbi5sYXN0SW50ZXJ2YWwgPSBpbnB1dDtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyB1c2UgbGF0ZXN0IHZlbG9jaXR5IGluZm8gaWYgaXQgZG9lc24ndCBvdmVydGFrZSBhIG1pbmltdW0gcGVyaW9kXG4gICAgICAgIHZlbG9jaXR5ID0gbGFzdC52ZWxvY2l0eTtcbiAgICAgICAgdmVsb2NpdHlYID0gbGFzdC52ZWxvY2l0eVg7XG4gICAgICAgIHZlbG9jaXR5WSA9IGxhc3QudmVsb2NpdHlZO1xuICAgICAgICBkaXJlY3Rpb24gPSBsYXN0LmRpcmVjdGlvbjtcbiAgICB9XG5cbiAgICBpbnB1dC52ZWxvY2l0eSA9IHZlbG9jaXR5O1xuICAgIGlucHV0LnZlbG9jaXR5WCA9IHZlbG9jaXR5WDtcbiAgICBpbnB1dC52ZWxvY2l0eVkgPSB2ZWxvY2l0eVk7XG4gICAgaW5wdXQuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xufVxuXG4vKipcbiAqIGNyZWF0ZSBhIHNpbXBsZSBjbG9uZSBmcm9tIHRoZSBpbnB1dCB1c2VkIGZvciBzdG9yYWdlIG9mIGZpcnN0SW5wdXQgYW5kIGZpcnN0TXVsdGlwbGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICogQHJldHVybnMge09iamVjdH0gY2xvbmVkSW5wdXREYXRhXG4gKi9cbmZ1bmN0aW9uIHNpbXBsZUNsb25lSW5wdXREYXRhKGlucHV0KSB7XG4gICAgLy8gbWFrZSBhIHNpbXBsZSBjb3B5IG9mIHRoZSBwb2ludGVycyBiZWNhdXNlIHdlIHdpbGwgZ2V0IGEgcmVmZXJlbmNlIGlmIHdlIGRvbid0XG4gICAgLy8gd2Ugb25seSBuZWVkIGNsaWVudFhZIGZvciB0aGUgY2FsY3VsYXRpb25zXG4gICAgdmFyIHBvaW50ZXJzID0gW107XG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlIChpIDwgaW5wdXQucG9pbnRlcnMubGVuZ3RoKSB7XG4gICAgICAgIHBvaW50ZXJzW2ldID0ge1xuICAgICAgICAgICAgY2xpZW50WDogcm91bmQoaW5wdXQucG9pbnRlcnNbaV0uY2xpZW50WCksXG4gICAgICAgICAgICBjbGllbnRZOiByb3VuZChpbnB1dC5wb2ludGVyc1tpXS5jbGllbnRZKVxuICAgICAgICB9O1xuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGltZVN0YW1wOiBub3coKSxcbiAgICAgICAgcG9pbnRlcnM6IHBvaW50ZXJzLFxuICAgICAgICBjZW50ZXI6IGdldENlbnRlcihwb2ludGVycyksXG4gICAgICAgIGRlbHRhWDogaW5wdXQuZGVsdGFYLFxuICAgICAgICBkZWx0YVk6IGlucHV0LmRlbHRhWVxuICAgIH07XG59XG5cbi8qKlxuICogZ2V0IHRoZSBjZW50ZXIgb2YgYWxsIHRoZSBwb2ludGVyc1xuICogQHBhcmFtIHtBcnJheX0gcG9pbnRlcnNcbiAqIEByZXR1cm4ge09iamVjdH0gY2VudGVyIGNvbnRhaW5zIGB4YCBhbmQgYHlgIHByb3BlcnRpZXNcbiAqL1xuZnVuY3Rpb24gZ2V0Q2VudGVyKHBvaW50ZXJzKSB7XG4gICAgdmFyIHBvaW50ZXJzTGVuZ3RoID0gcG9pbnRlcnMubGVuZ3RoO1xuXG4gICAgLy8gbm8gbmVlZCB0byBsb29wIHdoZW4gb25seSBvbmUgdG91Y2hcbiAgICBpZiAocG9pbnRlcnNMZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHJvdW5kKHBvaW50ZXJzWzBdLmNsaWVudFgpLFxuICAgICAgICAgICAgeTogcm91bmQocG9pbnRlcnNbMF0uY2xpZW50WSlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgeCA9IDAsIHkgPSAwLCBpID0gMDtcbiAgICB3aGlsZSAoaSA8IHBvaW50ZXJzTGVuZ3RoKSB7XG4gICAgICAgIHggKz0gcG9pbnRlcnNbaV0uY2xpZW50WDtcbiAgICAgICAgeSArPSBwb2ludGVyc1tpXS5jbGllbnRZO1xuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgeDogcm91bmQoeCAvIHBvaW50ZXJzTGVuZ3RoKSxcbiAgICAgICAgeTogcm91bmQoeSAvIHBvaW50ZXJzTGVuZ3RoKVxuICAgIH07XG59XG5cbi8qKlxuICogY2FsY3VsYXRlIHRoZSB2ZWxvY2l0eSBiZXR3ZWVuIHR3byBwb2ludHMuIHVuaXQgaXMgaW4gcHggcGVyIG1zLlxuICogQHBhcmFtIHtOdW1iZXJ9IGRlbHRhVGltZVxuICogQHBhcmFtIHtOdW1iZXJ9IHhcbiAqIEBwYXJhbSB7TnVtYmVyfSB5XG4gKiBAcmV0dXJuIHtPYmplY3R9IHZlbG9jaXR5IGB4YCBhbmQgYHlgXG4gKi9cbmZ1bmN0aW9uIGdldFZlbG9jaXR5KGRlbHRhVGltZSwgeCwgeSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHg6IHggLyBkZWx0YVRpbWUgfHwgMCxcbiAgICAgICAgeTogeSAvIGRlbHRhVGltZSB8fCAwXG4gICAgfTtcbn1cblxuLyoqXG4gKiBnZXQgdGhlIGRpcmVjdGlvbiBiZXR3ZWVuIHR3byBwb2ludHNcbiAqIEBwYXJhbSB7TnVtYmVyfSB4XG4gKiBAcGFyYW0ge051bWJlcn0geVxuICogQHJldHVybiB7TnVtYmVyfSBkaXJlY3Rpb25cbiAqL1xuZnVuY3Rpb24gZ2V0RGlyZWN0aW9uKHgsIHkpIHtcbiAgICBpZiAoeCA9PT0geSkge1xuICAgICAgICByZXR1cm4gRElSRUNUSU9OX05PTkU7XG4gICAgfVxuXG4gICAgaWYgKGFicyh4KSA+PSBhYnMoeSkpIHtcbiAgICAgICAgcmV0dXJuIHggPCAwID8gRElSRUNUSU9OX0xFRlQgOiBESVJFQ1RJT05fUklHSFQ7XG4gICAgfVxuICAgIHJldHVybiB5IDwgMCA/IERJUkVDVElPTl9VUCA6IERJUkVDVElPTl9ET1dOO1xufVxuXG4vKipcbiAqIGNhbGN1bGF0ZSB0aGUgYWJzb2x1dGUgZGlzdGFuY2UgYmV0d2VlbiB0d28gcG9pbnRzXG4gKiBAcGFyYW0ge09iamVjdH0gcDEge3gsIHl9XG4gKiBAcGFyYW0ge09iamVjdH0gcDIge3gsIHl9XG4gKiBAcGFyYW0ge0FycmF5fSBbcHJvcHNdIGNvbnRhaW5pbmcgeCBhbmQgeSBrZXlzXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IGRpc3RhbmNlXG4gKi9cbmZ1bmN0aW9uIGdldERpc3RhbmNlKHAxLCBwMiwgcHJvcHMpIHtcbiAgICBpZiAoIXByb3BzKSB7XG4gICAgICAgIHByb3BzID0gUFJPUFNfWFk7XG4gICAgfVxuICAgIHZhciB4ID0gcDJbcHJvcHNbMF1dIC0gcDFbcHJvcHNbMF1dLFxuICAgICAgICB5ID0gcDJbcHJvcHNbMV1dIC0gcDFbcHJvcHNbMV1dO1xuXG4gICAgcmV0dXJuIE1hdGguc3FydCgoeCAqIHgpICsgKHkgKiB5KSk7XG59XG5cbi8qKlxuICogY2FsY3VsYXRlIHRoZSBhbmdsZSBiZXR3ZWVuIHR3byBjb29yZGluYXRlc1xuICogQHBhcmFtIHtPYmplY3R9IHAxXG4gKiBAcGFyYW0ge09iamVjdH0gcDJcbiAqIEBwYXJhbSB7QXJyYXl9IFtwcm9wc10gY29udGFpbmluZyB4IGFuZCB5IGtleXNcbiAqIEByZXR1cm4ge051bWJlcn0gYW5nbGVcbiAqL1xuZnVuY3Rpb24gZ2V0QW5nbGUocDEsIHAyLCBwcm9wcykge1xuICAgIGlmICghcHJvcHMpIHtcbiAgICAgICAgcHJvcHMgPSBQUk9QU19YWTtcbiAgICB9XG4gICAgdmFyIHggPSBwMltwcm9wc1swXV0gLSBwMVtwcm9wc1swXV0sXG4gICAgICAgIHkgPSBwMltwcm9wc1sxXV0gLSBwMVtwcm9wc1sxXV07XG4gICAgcmV0dXJuIE1hdGguYXRhbjIoeSwgeCkgKiAxODAgLyBNYXRoLlBJO1xufVxuXG4vKipcbiAqIGNhbGN1bGF0ZSB0aGUgcm90YXRpb24gZGVncmVlcyBiZXR3ZWVuIHR3byBwb2ludGVyc2V0c1xuICogQHBhcmFtIHtBcnJheX0gc3RhcnQgYXJyYXkgb2YgcG9pbnRlcnNcbiAqIEBwYXJhbSB7QXJyYXl9IGVuZCBhcnJheSBvZiBwb2ludGVyc1xuICogQHJldHVybiB7TnVtYmVyfSByb3RhdGlvblxuICovXG5mdW5jdGlvbiBnZXRSb3RhdGlvbihzdGFydCwgZW5kKSB7XG4gICAgcmV0dXJuIGdldEFuZ2xlKGVuZFsxXSwgZW5kWzBdLCBQUk9QU19DTElFTlRfWFkpICsgZ2V0QW5nbGUoc3RhcnRbMV0sIHN0YXJ0WzBdLCBQUk9QU19DTElFTlRfWFkpO1xufVxuXG4vKipcbiAqIGNhbGN1bGF0ZSB0aGUgc2NhbGUgZmFjdG9yIGJldHdlZW4gdHdvIHBvaW50ZXJzZXRzXG4gKiBubyBzY2FsZSBpcyAxLCBhbmQgZ29lcyBkb3duIHRvIDAgd2hlbiBwaW5jaGVkIHRvZ2V0aGVyLCBhbmQgYmlnZ2VyIHdoZW4gcGluY2hlZCBvdXRcbiAqIEBwYXJhbSB7QXJyYXl9IHN0YXJ0IGFycmF5IG9mIHBvaW50ZXJzXG4gKiBAcGFyYW0ge0FycmF5fSBlbmQgYXJyYXkgb2YgcG9pbnRlcnNcbiAqIEByZXR1cm4ge051bWJlcn0gc2NhbGVcbiAqL1xuZnVuY3Rpb24gZ2V0U2NhbGUoc3RhcnQsIGVuZCkge1xuICAgIHJldHVybiBnZXREaXN0YW5jZShlbmRbMF0sIGVuZFsxXSwgUFJPUFNfQ0xJRU5UX1hZKSAvIGdldERpc3RhbmNlKHN0YXJ0WzBdLCBzdGFydFsxXSwgUFJPUFNfQ0xJRU5UX1hZKTtcbn1cblxudmFyIE1PVVNFX0lOUFVUX01BUCA9IHtcbiAgICBtb3VzZWRvd246IElOUFVUX1NUQVJULFxuICAgIG1vdXNlbW92ZTogSU5QVVRfTU9WRSxcbiAgICBtb3VzZXVwOiBJTlBVVF9FTkRcbn07XG5cbnZhciBNT1VTRV9FTEVNRU5UX0VWRU5UUyA9ICdtb3VzZWRvd24nO1xudmFyIE1PVVNFX1dJTkRPV19FVkVOVFMgPSAnbW91c2Vtb3ZlIG1vdXNldXAnO1xuXG4vKipcbiAqIE1vdXNlIGV2ZW50cyBpbnB1dFxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBJbnB1dFxuICovXG5mdW5jdGlvbiBNb3VzZUlucHV0KCkge1xuICAgIHRoaXMuZXZFbCA9IE1PVVNFX0VMRU1FTlRfRVZFTlRTO1xuICAgIHRoaXMuZXZXaW4gPSBNT1VTRV9XSU5ET1dfRVZFTlRTO1xuXG4gICAgdGhpcy5wcmVzc2VkID0gZmFsc2U7IC8vIG1vdXNlZG93biBzdGF0ZVxuXG4gICAgSW5wdXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChNb3VzZUlucHV0LCBJbnB1dCwge1xuICAgIC8qKlxuICAgICAqIGhhbmRsZSBtb3VzZSBldmVudHNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZXZcbiAgICAgKi9cbiAgICBoYW5kbGVyOiBmdW5jdGlvbiBNRWhhbmRsZXIoZXYpIHtcbiAgICAgICAgdmFyIGV2ZW50VHlwZSA9IE1PVVNFX0lOUFVUX01BUFtldi50eXBlXTtcblxuICAgICAgICAvLyBvbiBzdGFydCB3ZSB3YW50IHRvIGhhdmUgdGhlIGxlZnQgbW91c2UgYnV0dG9uIGRvd25cbiAgICAgICAgaWYgKGV2ZW50VHlwZSAmIElOUFVUX1NUQVJUICYmIGV2LmJ1dHRvbiA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5wcmVzc2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChldmVudFR5cGUgJiBJTlBVVF9NT1ZFICYmIGV2LndoaWNoICE9PSAxKSB7XG4gICAgICAgICAgICBldmVudFR5cGUgPSBJTlBVVF9FTkQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtb3VzZSBtdXN0IGJlIGRvd25cbiAgICAgICAgaWYgKCF0aGlzLnByZXNzZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChldmVudFR5cGUgJiBJTlBVVF9FTkQpIHtcbiAgICAgICAgICAgIHRoaXMucHJlc3NlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYWxsYmFjayh0aGlzLm1hbmFnZXIsIGV2ZW50VHlwZSwge1xuICAgICAgICAgICAgcG9pbnRlcnM6IFtldl0sXG4gICAgICAgICAgICBjaGFuZ2VkUG9pbnRlcnM6IFtldl0sXG4gICAgICAgICAgICBwb2ludGVyVHlwZTogSU5QVVRfVFlQRV9NT1VTRSxcbiAgICAgICAgICAgIHNyY0V2ZW50OiBldlxuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxudmFyIFBPSU5URVJfSU5QVVRfTUFQID0ge1xuICAgIHBvaW50ZXJkb3duOiBJTlBVVF9TVEFSVCxcbiAgICBwb2ludGVybW92ZTogSU5QVVRfTU9WRSxcbiAgICBwb2ludGVydXA6IElOUFVUX0VORCxcbiAgICBwb2ludGVyY2FuY2VsOiBJTlBVVF9DQU5DRUwsXG4gICAgcG9pbnRlcm91dDogSU5QVVRfQ0FOQ0VMXG59O1xuXG4vLyBpbiBJRTEwIHRoZSBwb2ludGVyIHR5cGVzIGlzIGRlZmluZWQgYXMgYW4gZW51bVxudmFyIElFMTBfUE9JTlRFUl9UWVBFX0VOVU0gPSB7XG4gICAgMjogSU5QVVRfVFlQRV9UT1VDSCxcbiAgICAzOiBJTlBVVF9UWVBFX1BFTixcbiAgICA0OiBJTlBVVF9UWVBFX01PVVNFLFxuICAgIDU6IElOUFVUX1RZUEVfS0lORUNUIC8vIHNlZSBodHRwczovL3R3aXR0ZXIuY29tL2phY29icm9zc2kvc3RhdHVzLzQ4MDU5NjQzODQ4OTg5MDgxNlxufTtcblxudmFyIFBPSU5URVJfRUxFTUVOVF9FVkVOVFMgPSAncG9pbnRlcmRvd24nO1xudmFyIFBPSU5URVJfV0lORE9XX0VWRU5UUyA9ICdwb2ludGVybW92ZSBwb2ludGVydXAgcG9pbnRlcmNhbmNlbCc7XG5cbi8vIElFMTAgaGFzIHByZWZpeGVkIHN1cHBvcnQsIGFuZCBjYXNlLXNlbnNpdGl2ZVxuaWYgKHdpbmRvdy5NU1BvaW50ZXJFdmVudCAmJiAhd2luZG93LlBvaW50ZXJFdmVudCkge1xuICAgIFBPSU5URVJfRUxFTUVOVF9FVkVOVFMgPSAnTVNQb2ludGVyRG93bic7XG4gICAgUE9JTlRFUl9XSU5ET1dfRVZFTlRTID0gJ01TUG9pbnRlck1vdmUgTVNQb2ludGVyVXAgTVNQb2ludGVyQ2FuY2VsJztcbn1cblxuLyoqXG4gKiBQb2ludGVyIGV2ZW50cyBpbnB1dFxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBJbnB1dFxuICovXG5mdW5jdGlvbiBQb2ludGVyRXZlbnRJbnB1dCgpIHtcbiAgICB0aGlzLmV2RWwgPSBQT0lOVEVSX0VMRU1FTlRfRVZFTlRTO1xuICAgIHRoaXMuZXZXaW4gPSBQT0lOVEVSX1dJTkRPV19FVkVOVFM7XG5cbiAgICBJbnB1dC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5zdG9yZSA9ICh0aGlzLm1hbmFnZXIuc2Vzc2lvbi5wb2ludGVyRXZlbnRzID0gW10pO1xufVxuXG5pbmhlcml0KFBvaW50ZXJFdmVudElucHV0LCBJbnB1dCwge1xuICAgIC8qKlxuICAgICAqIGhhbmRsZSBtb3VzZSBldmVudHNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZXZcbiAgICAgKi9cbiAgICBoYW5kbGVyOiBmdW5jdGlvbiBQRWhhbmRsZXIoZXYpIHtcbiAgICAgICAgdmFyIHN0b3JlID0gdGhpcy5zdG9yZTtcbiAgICAgICAgdmFyIHJlbW92ZVBvaW50ZXIgPSBmYWxzZTtcblxuICAgICAgICB2YXIgZXZlbnRUeXBlTm9ybWFsaXplZCA9IGV2LnR5cGUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKCdtcycsICcnKTtcbiAgICAgICAgdmFyIGV2ZW50VHlwZSA9IFBPSU5URVJfSU5QVVRfTUFQW2V2ZW50VHlwZU5vcm1hbGl6ZWRdO1xuICAgICAgICB2YXIgcG9pbnRlclR5cGUgPSBJRTEwX1BPSU5URVJfVFlQRV9FTlVNW2V2LnBvaW50ZXJUeXBlXSB8fCBldi5wb2ludGVyVHlwZTtcblxuICAgICAgICB2YXIgaXNUb3VjaCA9IChwb2ludGVyVHlwZSA9PSBJTlBVVF9UWVBFX1RPVUNIKTtcblxuICAgICAgICAvLyBnZXQgaW5kZXggb2YgdGhlIGV2ZW50IGluIHRoZSBzdG9yZVxuICAgICAgICB2YXIgc3RvcmVJbmRleCA9IGluQXJyYXkoc3RvcmUsIGV2LnBvaW50ZXJJZCwgJ3BvaW50ZXJJZCcpO1xuXG4gICAgICAgIC8vIHN0YXJ0IGFuZCBtb3VzZSBtdXN0IGJlIGRvd25cbiAgICAgICAgaWYgKGV2ZW50VHlwZSAmIElOUFVUX1NUQVJUICYmIChldi5idXR0b24gPT09IDAgfHwgaXNUb3VjaCkpIHtcbiAgICAgICAgICAgIGlmIChzdG9yZUluZGV4IDwgMCkge1xuICAgICAgICAgICAgICAgIHN0b3JlLnB1c2goZXYpO1xuICAgICAgICAgICAgICAgIHN0b3JlSW5kZXggPSBzdG9yZS5sZW5ndGggLSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50VHlwZSAmIChJTlBVVF9FTkQgfCBJTlBVVF9DQU5DRUwpKSB7XG4gICAgICAgICAgICByZW1vdmVQb2ludGVyID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGl0IG5vdCBmb3VuZCwgc28gdGhlIHBvaW50ZXIgaGFzbid0IGJlZW4gZG93biAoc28gaXQncyBwcm9iYWJseSBhIGhvdmVyKVxuICAgICAgICBpZiAoc3RvcmVJbmRleCA8IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgZXZlbnQgaW4gdGhlIHN0b3JlXG4gICAgICAgIHN0b3JlW3N0b3JlSW5kZXhdID0gZXY7XG5cbiAgICAgICAgdGhpcy5jYWxsYmFjayh0aGlzLm1hbmFnZXIsIGV2ZW50VHlwZSwge1xuICAgICAgICAgICAgcG9pbnRlcnM6IHN0b3JlLFxuICAgICAgICAgICAgY2hhbmdlZFBvaW50ZXJzOiBbZXZdLFxuICAgICAgICAgICAgcG9pbnRlclR5cGU6IHBvaW50ZXJUeXBlLFxuICAgICAgICAgICAgc3JjRXZlbnQ6IGV2XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZW1vdmVQb2ludGVyKSB7XG4gICAgICAgICAgICAvLyByZW1vdmUgZnJvbSB0aGUgc3RvcmVcbiAgICAgICAgICAgIHN0b3JlLnNwbGljZShzdG9yZUluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG52YXIgU0lOR0xFX1RPVUNIX0lOUFVUX01BUCA9IHtcbiAgICB0b3VjaHN0YXJ0OiBJTlBVVF9TVEFSVCxcbiAgICB0b3VjaG1vdmU6IElOUFVUX01PVkUsXG4gICAgdG91Y2hlbmQ6IElOUFVUX0VORCxcbiAgICB0b3VjaGNhbmNlbDogSU5QVVRfQ0FOQ0VMXG59O1xuXG52YXIgU0lOR0xFX1RPVUNIX1RBUkdFVF9FVkVOVFMgPSAndG91Y2hzdGFydCc7XG52YXIgU0lOR0xFX1RPVUNIX1dJTkRPV19FVkVOVFMgPSAndG91Y2hzdGFydCB0b3VjaG1vdmUgdG91Y2hlbmQgdG91Y2hjYW5jZWwnO1xuXG4vKipcbiAqIFRvdWNoIGV2ZW50cyBpbnB1dFxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBJbnB1dFxuICovXG5mdW5jdGlvbiBTaW5nbGVUb3VjaElucHV0KCkge1xuICAgIHRoaXMuZXZUYXJnZXQgPSBTSU5HTEVfVE9VQ0hfVEFSR0VUX0VWRU5UUztcbiAgICB0aGlzLmV2V2luID0gU0lOR0xFX1RPVUNIX1dJTkRPV19FVkVOVFM7XG4gICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XG5cbiAgICBJbnB1dC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFNpbmdsZVRvdWNoSW5wdXQsIElucHV0LCB7XG4gICAgaGFuZGxlcjogZnVuY3Rpb24gVEVoYW5kbGVyKGV2KSB7XG4gICAgICAgIHZhciB0eXBlID0gU0lOR0xFX1RPVUNIX0lOUFVUX01BUFtldi50eXBlXTtcblxuICAgICAgICAvLyBzaG91bGQgd2UgaGFuZGxlIHRoZSB0b3VjaCBldmVudHM/XG4gICAgICAgIGlmICh0eXBlID09PSBJTlBVVF9TVEFSVCkge1xuICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5zdGFydGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdG91Y2hlcyA9IG5vcm1hbGl6ZVNpbmdsZVRvdWNoZXMuY2FsbCh0aGlzLCBldiwgdHlwZSk7XG5cbiAgICAgICAgLy8gd2hlbiBkb25lLCByZXNldCB0aGUgc3RhcnRlZCBzdGF0ZVxuICAgICAgICBpZiAodHlwZSAmIChJTlBVVF9FTkQgfCBJTlBVVF9DQU5DRUwpICYmIHRvdWNoZXNbMF0ubGVuZ3RoIC0gdG91Y2hlc1sxXS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYWxsYmFjayh0aGlzLm1hbmFnZXIsIHR5cGUsIHtcbiAgICAgICAgICAgIHBvaW50ZXJzOiB0b3VjaGVzWzBdLFxuICAgICAgICAgICAgY2hhbmdlZFBvaW50ZXJzOiB0b3VjaGVzWzFdLFxuICAgICAgICAgICAgcG9pbnRlclR5cGU6IElOUFVUX1RZUEVfVE9VQ0gsXG4gICAgICAgICAgICBzcmNFdmVudDogZXZcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbi8qKlxuICogQHRoaXMge1RvdWNoSW5wdXR9XG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqIEBwYXJhbSB7TnVtYmVyfSB0eXBlIGZsYWdcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR8QXJyYXl9IFthbGwsIGNoYW5nZWRdXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZVNpbmdsZVRvdWNoZXMoZXYsIHR5cGUpIHtcbiAgICB2YXIgYWxsID0gdG9BcnJheShldi50b3VjaGVzKTtcbiAgICB2YXIgY2hhbmdlZCA9IHRvQXJyYXkoZXYuY2hhbmdlZFRvdWNoZXMpO1xuXG4gICAgaWYgKHR5cGUgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSkge1xuICAgICAgICBhbGwgPSB1bmlxdWVBcnJheShhbGwuY29uY2F0KGNoYW5nZWQpLCAnaWRlbnRpZmllcicsIHRydWUpO1xuICAgIH1cblxuICAgIHJldHVybiBbYWxsLCBjaGFuZ2VkXTtcbn1cblxudmFyIFRPVUNIX0lOUFVUX01BUCA9IHtcbiAgICB0b3VjaHN0YXJ0OiBJTlBVVF9TVEFSVCxcbiAgICB0b3VjaG1vdmU6IElOUFVUX01PVkUsXG4gICAgdG91Y2hlbmQ6IElOUFVUX0VORCxcbiAgICB0b3VjaGNhbmNlbDogSU5QVVRfQ0FOQ0VMXG59O1xuXG52YXIgVE9VQ0hfVEFSR0VUX0VWRU5UUyA9ICd0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCB0b3VjaGNhbmNlbCc7XG5cbi8qKlxuICogTXVsdGktdXNlciB0b3VjaCBldmVudHMgaW5wdXRcbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgSW5wdXRcbiAqL1xuZnVuY3Rpb24gVG91Y2hJbnB1dCgpIHtcbiAgICB0aGlzLmV2VGFyZ2V0ID0gVE9VQ0hfVEFSR0VUX0VWRU5UUztcbiAgICB0aGlzLnRhcmdldElkcyA9IHt9O1xuXG4gICAgSW5wdXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChUb3VjaElucHV0LCBJbnB1dCwge1xuICAgIGhhbmRsZXI6IGZ1bmN0aW9uIE1URWhhbmRsZXIoZXYpIHtcbiAgICAgICAgdmFyIHR5cGUgPSBUT1VDSF9JTlBVVF9NQVBbZXYudHlwZV07XG4gICAgICAgIHZhciB0b3VjaGVzID0gZ2V0VG91Y2hlcy5jYWxsKHRoaXMsIGV2LCB0eXBlKTtcbiAgICAgICAgaWYgKCF0b3VjaGVzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrKHRoaXMubWFuYWdlciwgdHlwZSwge1xuICAgICAgICAgICAgcG9pbnRlcnM6IHRvdWNoZXNbMF0sXG4gICAgICAgICAgICBjaGFuZ2VkUG9pbnRlcnM6IHRvdWNoZXNbMV0sXG4gICAgICAgICAgICBwb2ludGVyVHlwZTogSU5QVVRfVFlQRV9UT1VDSCxcbiAgICAgICAgICAgIHNyY0V2ZW50OiBldlxuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBAdGhpcyB7VG91Y2hJbnB1dH1cbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICogQHBhcmFtIHtOdW1iZXJ9IHR5cGUgZmxhZ1xuICogQHJldHVybnMge3VuZGVmaW5lZHxBcnJheX0gW2FsbCwgY2hhbmdlZF1cbiAqL1xuZnVuY3Rpb24gZ2V0VG91Y2hlcyhldiwgdHlwZSkge1xuICAgIHZhciBhbGxUb3VjaGVzID0gdG9BcnJheShldi50b3VjaGVzKTtcbiAgICB2YXIgdGFyZ2V0SWRzID0gdGhpcy50YXJnZXRJZHM7XG5cbiAgICAvLyB3aGVuIHRoZXJlIGlzIG9ubHkgb25lIHRvdWNoLCB0aGUgcHJvY2VzcyBjYW4gYmUgc2ltcGxpZmllZFxuICAgIGlmICh0eXBlICYgKElOUFVUX1NUQVJUIHwgSU5QVVRfTU9WRSkgJiYgYWxsVG91Y2hlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdGFyZ2V0SWRzW2FsbFRvdWNoZXNbMF0uaWRlbnRpZmllcl0gPSB0cnVlO1xuICAgICAgICByZXR1cm4gW2FsbFRvdWNoZXMsIGFsbFRvdWNoZXNdO1xuICAgIH1cblxuICAgIHZhciBpLFxuICAgICAgICB0YXJnZXRUb3VjaGVzLFxuICAgICAgICBjaGFuZ2VkVG91Y2hlcyA9IHRvQXJyYXkoZXYuY2hhbmdlZFRvdWNoZXMpLFxuICAgICAgICBjaGFuZ2VkVGFyZ2V0VG91Y2hlcyA9IFtdLFxuICAgICAgICB0YXJnZXQgPSB0aGlzLnRhcmdldDtcblxuICAgIC8vIGdldCB0YXJnZXQgdG91Y2hlcyBmcm9tIHRvdWNoZXNcbiAgICB0YXJnZXRUb3VjaGVzID0gYWxsVG91Y2hlcy5maWx0ZXIoZnVuY3Rpb24odG91Y2gpIHtcbiAgICAgICAgcmV0dXJuIGhhc1BhcmVudCh0b3VjaC50YXJnZXQsIHRhcmdldCk7XG4gICAgfSk7XG5cbiAgICAvLyBjb2xsZWN0IHRvdWNoZXNcbiAgICBpZiAodHlwZSA9PT0gSU5QVVRfU1RBUlQpIHtcbiAgICAgICAgaSA9IDA7XG4gICAgICAgIHdoaWxlIChpIDwgdGFyZ2V0VG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRhcmdldElkc1t0YXJnZXRUb3VjaGVzW2ldLmlkZW50aWZpZXJdID0gdHJ1ZTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGZpbHRlciBjaGFuZ2VkIHRvdWNoZXMgdG8gb25seSBjb250YWluIHRvdWNoZXMgdGhhdCBleGlzdCBpbiB0aGUgY29sbGVjdGVkIHRhcmdldCBpZHNcbiAgICBpID0gMDtcbiAgICB3aGlsZSAoaSA8IGNoYW5nZWRUb3VjaGVzLmxlbmd0aCkge1xuICAgICAgICBpZiAodGFyZ2V0SWRzW2NoYW5nZWRUb3VjaGVzW2ldLmlkZW50aWZpZXJdKSB7XG4gICAgICAgICAgICBjaGFuZ2VkVGFyZ2V0VG91Y2hlcy5wdXNoKGNoYW5nZWRUb3VjaGVzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNsZWFudXAgcmVtb3ZlZCB0b3VjaGVzXG4gICAgICAgIGlmICh0eXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0YXJnZXRJZHNbY2hhbmdlZFRvdWNoZXNbaV0uaWRlbnRpZmllcl07XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgIH1cblxuICAgIGlmICghY2hhbmdlZFRhcmdldFRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gW1xuICAgICAgICAvLyBtZXJnZSB0YXJnZXRUb3VjaGVzIHdpdGggY2hhbmdlZFRhcmdldFRvdWNoZXMgc28gaXQgY29udGFpbnMgQUxMIHRvdWNoZXMsIGluY2x1ZGluZyAnZW5kJyBhbmQgJ2NhbmNlbCdcbiAgICAgICAgdW5pcXVlQXJyYXkodGFyZ2V0VG91Y2hlcy5jb25jYXQoY2hhbmdlZFRhcmdldFRvdWNoZXMpLCAnaWRlbnRpZmllcicsIHRydWUpLFxuICAgICAgICBjaGFuZ2VkVGFyZ2V0VG91Y2hlc1xuICAgIF07XG59XG5cbi8qKlxuICogQ29tYmluZWQgdG91Y2ggYW5kIG1vdXNlIGlucHV0XG4gKlxuICogVG91Y2ggaGFzIGEgaGlnaGVyIHByaW9yaXR5IHRoZW4gbW91c2UsIGFuZCB3aGlsZSB0b3VjaGluZyBubyBtb3VzZSBldmVudHMgYXJlIGFsbG93ZWQuXG4gKiBUaGlzIGJlY2F1c2UgdG91Y2ggZGV2aWNlcyBhbHNvIGVtaXQgbW91c2UgZXZlbnRzIHdoaWxlIGRvaW5nIGEgdG91Y2guXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBJbnB1dFxuICovXG5cbnZhciBERURVUF9USU1FT1VUID0gMjUwMDtcbnZhciBERURVUF9ESVNUQU5DRSA9IDI1O1xuXG5mdW5jdGlvbiBUb3VjaE1vdXNlSW5wdXQoKSB7XG4gICAgSW5wdXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHZhciBoYW5kbGVyID0gYmluZEZuKHRoaXMuaGFuZGxlciwgdGhpcyk7XG4gICAgdGhpcy50b3VjaCA9IG5ldyBUb3VjaElucHV0KHRoaXMubWFuYWdlciwgaGFuZGxlcik7XG4gICAgdGhpcy5tb3VzZSA9IG5ldyBNb3VzZUlucHV0KHRoaXMubWFuYWdlciwgaGFuZGxlcik7XG5cbiAgICB0aGlzLnByaW1hcnlUb3VjaCA9IG51bGw7XG4gICAgdGhpcy5sYXN0VG91Y2hlcyA9IFtdO1xufVxuXG5pbmhlcml0KFRvdWNoTW91c2VJbnB1dCwgSW5wdXQsIHtcbiAgICAvKipcbiAgICAgKiBoYW5kbGUgbW91c2UgYW5kIHRvdWNoIGV2ZW50c1xuICAgICAqIEBwYXJhbSB7SGFtbWVyfSBtYW5hZ2VyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGlucHV0RXZlbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXREYXRhXG4gICAgICovXG4gICAgaGFuZGxlcjogZnVuY3Rpb24gVE1FaGFuZGxlcihtYW5hZ2VyLCBpbnB1dEV2ZW50LCBpbnB1dERhdGEpIHtcbiAgICAgICAgdmFyIGlzVG91Y2ggPSAoaW5wdXREYXRhLnBvaW50ZXJUeXBlID09IElOUFVUX1RZUEVfVE9VQ0gpLFxuICAgICAgICAgICAgaXNNb3VzZSA9IChpbnB1dERhdGEucG9pbnRlclR5cGUgPT0gSU5QVVRfVFlQRV9NT1VTRSk7XG5cbiAgICAgICAgaWYgKGlzTW91c2UgJiYgaW5wdXREYXRhLnNvdXJjZUNhcGFiaWxpdGllcyAmJiBpbnB1dERhdGEuc291cmNlQ2FwYWJpbGl0aWVzLmZpcmVzVG91Y2hFdmVudHMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdoZW4gd2UncmUgaW4gYSB0b3VjaCBldmVudCwgcmVjb3JkIHRvdWNoZXMgdG8gIGRlLWR1cGUgc3ludGhldGljIG1vdXNlIGV2ZW50XG4gICAgICAgIGlmIChpc1RvdWNoKSB7XG4gICAgICAgICAgICByZWNvcmRUb3VjaGVzLmNhbGwodGhpcywgaW5wdXRFdmVudCwgaW5wdXREYXRhKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc01vdXNlICYmIGlzU3ludGhldGljRXZlbnQuY2FsbCh0aGlzLCBpbnB1dERhdGEpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrKG1hbmFnZXIsIGlucHV0RXZlbnQsIGlucHV0RGF0YSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlbW92ZSB0aGUgZXZlbnQgbGlzdGVuZXJzXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24gZGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy50b3VjaC5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMubW91c2UuZGVzdHJveSgpO1xuICAgIH1cbn0pO1xuXG5mdW5jdGlvbiByZWNvcmRUb3VjaGVzKGV2ZW50VHlwZSwgZXZlbnREYXRhKSB7XG4gICAgaWYgKGV2ZW50VHlwZSAmIElOUFVUX1NUQVJUKSB7XG4gICAgICAgIHRoaXMucHJpbWFyeVRvdWNoID0gZXZlbnREYXRhLmNoYW5nZWRQb2ludGVyc1swXS5pZGVudGlmaWVyO1xuICAgICAgICBzZXRMYXN0VG91Y2guY2FsbCh0aGlzLCBldmVudERhdGEpO1xuICAgIH0gZWxzZSBpZiAoZXZlbnRUeXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkpIHtcbiAgICAgICAgc2V0TGFzdFRvdWNoLmNhbGwodGhpcywgZXZlbnREYXRhKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNldExhc3RUb3VjaChldmVudERhdGEpIHtcbiAgICB2YXIgdG91Y2ggPSBldmVudERhdGEuY2hhbmdlZFBvaW50ZXJzWzBdO1xuXG4gICAgaWYgKHRvdWNoLmlkZW50aWZpZXIgPT09IHRoaXMucHJpbWFyeVRvdWNoKSB7XG4gICAgICAgIHZhciBsYXN0VG91Y2ggPSB7eDogdG91Y2guY2xpZW50WCwgeTogdG91Y2guY2xpZW50WX07XG4gICAgICAgIHRoaXMubGFzdFRvdWNoZXMucHVzaChsYXN0VG91Y2gpO1xuICAgICAgICB2YXIgbHRzID0gdGhpcy5sYXN0VG91Y2hlcztcbiAgICAgICAgdmFyIHJlbW92ZUxhc3RUb3VjaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGkgPSBsdHMuaW5kZXhPZihsYXN0VG91Y2gpO1xuICAgICAgICAgICAgaWYgKGkgPiAtMSkge1xuICAgICAgICAgICAgICAgIGx0cy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHNldFRpbWVvdXQocmVtb3ZlTGFzdFRvdWNoLCBERURVUF9USU1FT1VUKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzU3ludGhldGljRXZlbnQoZXZlbnREYXRhKSB7XG4gICAgdmFyIHggPSBldmVudERhdGEuc3JjRXZlbnQuY2xpZW50WCwgeSA9IGV2ZW50RGF0YS5zcmNFdmVudC5jbGllbnRZO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sYXN0VG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdCA9IHRoaXMubGFzdFRvdWNoZXNbaV07XG4gICAgICAgIHZhciBkeCA9IE1hdGguYWJzKHggLSB0LngpLCBkeSA9IE1hdGguYWJzKHkgLSB0LnkpO1xuICAgICAgICBpZiAoZHggPD0gREVEVVBfRElTVEFOQ0UgJiYgZHkgPD0gREVEVVBfRElTVEFOQ0UpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxudmFyIFBSRUZJWEVEX1RPVUNIX0FDVElPTiA9IHByZWZpeGVkKFRFU1RfRUxFTUVOVC5zdHlsZSwgJ3RvdWNoQWN0aW9uJyk7XG52YXIgTkFUSVZFX1RPVUNIX0FDVElPTiA9IFBSRUZJWEVEX1RPVUNIX0FDVElPTiAhPT0gdW5kZWZpbmVkO1xuXG4vLyBtYWdpY2FsIHRvdWNoQWN0aW9uIHZhbHVlXG52YXIgVE9VQ0hfQUNUSU9OX0NPTVBVVEUgPSAnY29tcHV0ZSc7XG52YXIgVE9VQ0hfQUNUSU9OX0FVVE8gPSAnYXV0byc7XG52YXIgVE9VQ0hfQUNUSU9OX01BTklQVUxBVElPTiA9ICdtYW5pcHVsYXRpb24nOyAvLyBub3QgaW1wbGVtZW50ZWRcbnZhciBUT1VDSF9BQ1RJT05fTk9ORSA9ICdub25lJztcbnZhciBUT1VDSF9BQ1RJT05fUEFOX1ggPSAncGFuLXgnO1xudmFyIFRPVUNIX0FDVElPTl9QQU5fWSA9ICdwYW4teSc7XG52YXIgVE9VQ0hfQUNUSU9OX01BUCA9IGdldFRvdWNoQWN0aW9uUHJvcHMoKTtcblxuLyoqXG4gKiBUb3VjaCBBY3Rpb25cbiAqIHNldHMgdGhlIHRvdWNoQWN0aW9uIHByb3BlcnR5IG9yIHVzZXMgdGhlIGpzIGFsdGVybmF0aXZlXG4gKiBAcGFyYW0ge01hbmFnZXJ9IG1hbmFnZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFRvdWNoQWN0aW9uKG1hbmFnZXIsIHZhbHVlKSB7XG4gICAgdGhpcy5tYW5hZ2VyID0gbWFuYWdlcjtcbiAgICB0aGlzLnNldCh2YWx1ZSk7XG59XG5cblRvdWNoQWN0aW9uLnByb3RvdHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBzZXQgdGhlIHRvdWNoQWN0aW9uIHZhbHVlIG9uIHRoZSBlbGVtZW50IG9yIGVuYWJsZSB0aGUgcG9seWZpbGxcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBzZXQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIC8vIGZpbmQgb3V0IHRoZSB0b3VjaC1hY3Rpb24gYnkgdGhlIGV2ZW50IGhhbmRsZXJzXG4gICAgICAgIGlmICh2YWx1ZSA9PSBUT1VDSF9BQ1RJT05fQ09NUFVURSkge1xuICAgICAgICAgICAgdmFsdWUgPSB0aGlzLmNvbXB1dGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChOQVRJVkVfVE9VQ0hfQUNUSU9OICYmIHRoaXMubWFuYWdlci5lbGVtZW50LnN0eWxlICYmIFRPVUNIX0FDVElPTl9NQVBbdmFsdWVdKSB7XG4gICAgICAgICAgICB0aGlzLm1hbmFnZXIuZWxlbWVudC5zdHlsZVtQUkVGSVhFRF9UT1VDSF9BQ1RJT05dID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hY3Rpb25zID0gdmFsdWUudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGp1c3QgcmUtc2V0IHRoZSB0b3VjaEFjdGlvbiB2YWx1ZVxuICAgICAqL1xuICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0KHRoaXMubWFuYWdlci5vcHRpb25zLnRvdWNoQWN0aW9uKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogY29tcHV0ZSB0aGUgdmFsdWUgZm9yIHRoZSB0b3VjaEFjdGlvbiBwcm9wZXJ0eSBiYXNlZCBvbiB0aGUgcmVjb2duaXplcidzIHNldHRpbmdzXG4gICAgICogQHJldHVybnMge1N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBjb21wdXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFjdGlvbnMgPSBbXTtcbiAgICAgICAgZWFjaCh0aGlzLm1hbmFnZXIucmVjb2duaXplcnMsIGZ1bmN0aW9uKHJlY29nbml6ZXIpIHtcbiAgICAgICAgICAgIGlmIChib29sT3JGbihyZWNvZ25pemVyLm9wdGlvbnMuZW5hYmxlLCBbcmVjb2duaXplcl0pKSB7XG4gICAgICAgICAgICAgICAgYWN0aW9ucyA9IGFjdGlvbnMuY29uY2F0KHJlY29nbml6ZXIuZ2V0VG91Y2hBY3Rpb24oKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gY2xlYW5Ub3VjaEFjdGlvbnMoYWN0aW9ucy5qb2luKCcgJykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgb24gZWFjaCBpbnB1dCBjeWNsZSBhbmQgcHJvdmlkZXMgdGhlIHByZXZlbnRpbmcgb2YgdGhlIGJyb3dzZXIgYmVoYXZpb3JcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAgICAgKi9cbiAgICBwcmV2ZW50RGVmYXVsdHM6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBzcmNFdmVudCA9IGlucHV0LnNyY0V2ZW50O1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gaW5wdXQub2Zmc2V0RGlyZWN0aW9uO1xuXG4gICAgICAgIC8vIGlmIHRoZSB0b3VjaCBhY3Rpb24gZGlkIHByZXZlbnRlZCBvbmNlIHRoaXMgc2Vzc2lvblxuICAgICAgICBpZiAodGhpcy5tYW5hZ2VyLnNlc3Npb24ucHJldmVudGVkKSB7XG4gICAgICAgICAgICBzcmNFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFjdGlvbnMgPSB0aGlzLmFjdGlvbnM7XG4gICAgICAgIHZhciBoYXNOb25lID0gaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX05PTkUpICYmICFUT1VDSF9BQ1RJT05fTUFQW1RPVUNIX0FDVElPTl9OT05FXTtcbiAgICAgICAgdmFyIGhhc1BhblkgPSBpblN0cihhY3Rpb25zLCBUT1VDSF9BQ1RJT05fUEFOX1kpICYmICFUT1VDSF9BQ1RJT05fTUFQW1RPVUNIX0FDVElPTl9QQU5fWV07XG4gICAgICAgIHZhciBoYXNQYW5YID0gaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX1BBTl9YKSAmJiAhVE9VQ0hfQUNUSU9OX01BUFtUT1VDSF9BQ1RJT05fUEFOX1hdO1xuXG4gICAgICAgIGlmIChoYXNOb25lKSB7XG4gICAgICAgICAgICAvL2RvIG5vdCBwcmV2ZW50IGRlZmF1bHRzIGlmIHRoaXMgaXMgYSB0YXAgZ2VzdHVyZVxuXG4gICAgICAgICAgICB2YXIgaXNUYXBQb2ludGVyID0gaW5wdXQucG9pbnRlcnMubGVuZ3RoID09PSAxO1xuICAgICAgICAgICAgdmFyIGlzVGFwTW92ZW1lbnQgPSBpbnB1dC5kaXN0YW5jZSA8IDI7XG4gICAgICAgICAgICB2YXIgaXNUYXBUb3VjaFRpbWUgPSBpbnB1dC5kZWx0YVRpbWUgPCAyNTA7XG5cbiAgICAgICAgICAgIGlmIChpc1RhcFBvaW50ZXIgJiYgaXNUYXBNb3ZlbWVudCAmJiBpc1RhcFRvdWNoVGltZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYXNQYW5YICYmIGhhc1BhblkpIHtcbiAgICAgICAgICAgIC8vIGBwYW4teCBwYW4teWAgbWVhbnMgYnJvd3NlciBoYW5kbGVzIGFsbCBzY3JvbGxpbmcvcGFubmluZywgZG8gbm90IHByZXZlbnRcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYXNOb25lIHx8XG4gICAgICAgICAgICAoaGFzUGFuWSAmJiBkaXJlY3Rpb24gJiBESVJFQ1RJT05fSE9SSVpPTlRBTCkgfHxcbiAgICAgICAgICAgIChoYXNQYW5YICYmIGRpcmVjdGlvbiAmIERJUkVDVElPTl9WRVJUSUNBTCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByZXZlbnRTcmMoc3JjRXZlbnQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGNhbGwgcHJldmVudERlZmF1bHQgdG8gcHJldmVudCB0aGUgYnJvd3NlcidzIGRlZmF1bHQgYmVoYXZpb3IgKHNjcm9sbGluZyBpbiBtb3N0IGNhc2VzKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzcmNFdmVudFxuICAgICAqL1xuICAgIHByZXZlbnRTcmM6IGZ1bmN0aW9uKHNyY0V2ZW50KSB7XG4gICAgICAgIHRoaXMubWFuYWdlci5zZXNzaW9uLnByZXZlbnRlZCA9IHRydWU7XG4gICAgICAgIHNyY0V2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiB3aGVuIHRoZSB0b3VjaEFjdGlvbnMgYXJlIGNvbGxlY3RlZCB0aGV5IGFyZSBub3QgYSB2YWxpZCB2YWx1ZSwgc28gd2UgbmVlZCB0byBjbGVhbiB0aGluZ3MgdXAuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBhY3Rpb25zXG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuZnVuY3Rpb24gY2xlYW5Ub3VjaEFjdGlvbnMoYWN0aW9ucykge1xuICAgIC8vIG5vbmVcbiAgICBpZiAoaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX05PTkUpKSB7XG4gICAgICAgIHJldHVybiBUT1VDSF9BQ1RJT05fTk9ORTtcbiAgICB9XG5cbiAgICB2YXIgaGFzUGFuWCA9IGluU3RyKGFjdGlvbnMsIFRPVUNIX0FDVElPTl9QQU5fWCk7XG4gICAgdmFyIGhhc1BhblkgPSBpblN0cihhY3Rpb25zLCBUT1VDSF9BQ1RJT05fUEFOX1kpO1xuXG4gICAgLy8gaWYgYm90aCBwYW4teCBhbmQgcGFuLXkgYXJlIHNldCAoZGlmZmVyZW50IHJlY29nbml6ZXJzXG4gICAgLy8gZm9yIGRpZmZlcmVudCBkaXJlY3Rpb25zLCBlLmcuIGhvcml6b250YWwgcGFuIGJ1dCB2ZXJ0aWNhbCBzd2lwZT8pXG4gICAgLy8gd2UgbmVlZCBub25lIChhcyBvdGhlcndpc2Ugd2l0aCBwYW4teCBwYW4teSBjb21iaW5lZCBub25lIG9mIHRoZXNlXG4gICAgLy8gcmVjb2duaXplcnMgd2lsbCB3b3JrLCBzaW5jZSB0aGUgYnJvd3NlciB3b3VsZCBoYW5kbGUgYWxsIHBhbm5pbmdcbiAgICBpZiAoaGFzUGFuWCAmJiBoYXNQYW5ZKSB7XG4gICAgICAgIHJldHVybiBUT1VDSF9BQ1RJT05fTk9ORTtcbiAgICB9XG5cbiAgICAvLyBwYW4teCBPUiBwYW4teVxuICAgIGlmIChoYXNQYW5YIHx8IGhhc1BhblkpIHtcbiAgICAgICAgcmV0dXJuIGhhc1BhblggPyBUT1VDSF9BQ1RJT05fUEFOX1ggOiBUT1VDSF9BQ1RJT05fUEFOX1k7XG4gICAgfVxuXG4gICAgLy8gbWFuaXB1bGF0aW9uXG4gICAgaWYgKGluU3RyKGFjdGlvbnMsIFRPVUNIX0FDVElPTl9NQU5JUFVMQVRJT04pKSB7XG4gICAgICAgIHJldHVybiBUT1VDSF9BQ1RJT05fTUFOSVBVTEFUSU9OO1xuICAgIH1cblxuICAgIHJldHVybiBUT1VDSF9BQ1RJT05fQVVUTztcbn1cblxuZnVuY3Rpb24gZ2V0VG91Y2hBY3Rpb25Qcm9wcygpIHtcbiAgICBpZiAoIU5BVElWRV9UT1VDSF9BQ1RJT04pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgdG91Y2hNYXAgPSB7fTtcbiAgICB2YXIgY3NzU3VwcG9ydHMgPSB3aW5kb3cuQ1NTICYmIHdpbmRvdy5DU1Muc3VwcG9ydHM7XG4gICAgWydhdXRvJywgJ21hbmlwdWxhdGlvbicsICdwYW4teScsICdwYW4teCcsICdwYW4teCBwYW4teScsICdub25lJ10uZm9yRWFjaChmdW5jdGlvbih2YWwpIHtcblxuICAgICAgICAvLyBJZiBjc3Muc3VwcG9ydHMgaXMgbm90IHN1cHBvcnRlZCBidXQgdGhlcmUgaXMgbmF0aXZlIHRvdWNoLWFjdGlvbiBhc3N1bWUgaXQgc3VwcG9ydHNcbiAgICAgICAgLy8gYWxsIHZhbHVlcy4gVGhpcyBpcyB0aGUgY2FzZSBmb3IgSUUgMTAgYW5kIDExLlxuICAgICAgICB0b3VjaE1hcFt2YWxdID0gY3NzU3VwcG9ydHMgPyB3aW5kb3cuQ1NTLnN1cHBvcnRzKCd0b3VjaC1hY3Rpb24nLCB2YWwpIDogdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gdG91Y2hNYXA7XG59XG5cbi8qKlxuICogUmVjb2duaXplciBmbG93IGV4cGxhaW5lZDsgKlxuICogQWxsIHJlY29nbml6ZXJzIGhhdmUgdGhlIGluaXRpYWwgc3RhdGUgb2YgUE9TU0lCTEUgd2hlbiBhIGlucHV0IHNlc3Npb24gc3RhcnRzLlxuICogVGhlIGRlZmluaXRpb24gb2YgYSBpbnB1dCBzZXNzaW9uIGlzIGZyb20gdGhlIGZpcnN0IGlucHV0IHVudGlsIHRoZSBsYXN0IGlucHV0LCB3aXRoIGFsbCBpdCdzIG1vdmVtZW50IGluIGl0LiAqXG4gKiBFeGFtcGxlIHNlc3Npb24gZm9yIG1vdXNlLWlucHV0OiBtb3VzZWRvd24gLT4gbW91c2Vtb3ZlIC0+IG1vdXNldXBcbiAqXG4gKiBPbiBlYWNoIHJlY29nbml6aW5nIGN5Y2xlIChzZWUgTWFuYWdlci5yZWNvZ25pemUpIHRoZSAucmVjb2duaXplKCkgbWV0aG9kIGlzIGV4ZWN1dGVkXG4gKiB3aGljaCBkZXRlcm1pbmVzIHdpdGggc3RhdGUgaXQgc2hvdWxkIGJlLlxuICpcbiAqIElmIHRoZSByZWNvZ25pemVyIGhhcyB0aGUgc3RhdGUgRkFJTEVELCBDQU5DRUxMRUQgb3IgUkVDT0dOSVpFRCAoZXF1YWxzIEVOREVEKSwgaXQgaXMgcmVzZXQgdG9cbiAqIFBPU1NJQkxFIHRvIGdpdmUgaXQgYW5vdGhlciBjaGFuZ2Ugb24gdGhlIG5leHQgY3ljbGUuXG4gKlxuICogICAgICAgICAgICAgICBQb3NzaWJsZVxuICogICAgICAgICAgICAgICAgICB8XG4gKiAgICAgICAgICAgICstLS0tLSstLS0tLS0tLS0tLS0tLS0rXG4gKiAgICAgICAgICAgIHwgICAgICAgICAgICAgICAgICAgICB8XG4gKiAgICAgICstLS0tLSstLS0tLSsgICAgICAgICAgICAgICB8XG4gKiAgICAgIHwgICAgICAgICAgIHwgICAgICAgICAgICAgICB8XG4gKiAgIEZhaWxlZCAgICAgIENhbmNlbGxlZCAgICAgICAgICB8XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgKy0tLS0tLS0rLS0tLS0tK1xuICogICAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgIHxcbiAqICAgICAgICAgICAgICAgICAgICAgIFJlY29nbml6ZWQgICAgICAgQmVnYW5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2hhbmdlZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVuZGVkL1JlY29nbml6ZWRcbiAqL1xudmFyIFNUQVRFX1BPU1NJQkxFID0gMTtcbnZhciBTVEFURV9CRUdBTiA9IDI7XG52YXIgU1RBVEVfQ0hBTkdFRCA9IDQ7XG52YXIgU1RBVEVfRU5ERUQgPSA4O1xudmFyIFNUQVRFX1JFQ09HTklaRUQgPSBTVEFURV9FTkRFRDtcbnZhciBTVEFURV9DQU5DRUxMRUQgPSAxNjtcbnZhciBTVEFURV9GQUlMRUQgPSAzMjtcblxuLyoqXG4gKiBSZWNvZ25pemVyXG4gKiBFdmVyeSByZWNvZ25pemVyIG5lZWRzIHRvIGV4dGVuZCBmcm9tIHRoaXMgY2xhc3MuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIFJlY29nbml6ZXIob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IGFzc2lnbih7fSwgdGhpcy5kZWZhdWx0cywgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICB0aGlzLmlkID0gdW5pcXVlSWQoKTtcblxuICAgIHRoaXMubWFuYWdlciA9IG51bGw7XG5cbiAgICAvLyBkZWZhdWx0IGlzIGVuYWJsZSB0cnVlXG4gICAgdGhpcy5vcHRpb25zLmVuYWJsZSA9IGlmVW5kZWZpbmVkKHRoaXMub3B0aW9ucy5lbmFibGUsIHRydWUpO1xuXG4gICAgdGhpcy5zdGF0ZSA9IFNUQVRFX1BPU1NJQkxFO1xuXG4gICAgdGhpcy5zaW11bHRhbmVvdXMgPSB7fTtcbiAgICB0aGlzLnJlcXVpcmVGYWlsID0gW107XG59XG5cblJlY29nbml6ZXIucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIEB2aXJ0dWFsXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICBkZWZhdWx0czoge30sXG5cbiAgICAvKipcbiAgICAgKiBzZXQgb3B0aW9uc1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAgICogQHJldHVybiB7UmVjb2duaXplcn1cbiAgICAgKi9cbiAgICBzZXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgYXNzaWduKHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgLy8gYWxzbyB1cGRhdGUgdGhlIHRvdWNoQWN0aW9uLCBpbiBjYXNlIHNvbWV0aGluZyBjaGFuZ2VkIGFib3V0IHRoZSBkaXJlY3Rpb25zL2VuYWJsZWQgc3RhdGVcbiAgICAgICAgdGhpcy5tYW5hZ2VyICYmIHRoaXMubWFuYWdlci50b3VjaEFjdGlvbi51cGRhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlY29nbml6ZSBzaW11bHRhbmVvdXMgd2l0aCBhbiBvdGhlciByZWNvZ25pemVyLlxuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gb3RoZXJSZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge1JlY29nbml6ZXJ9IHRoaXNcbiAgICAgKi9cbiAgICByZWNvZ25pemVXaXRoOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKG90aGVyUmVjb2duaXplciwgJ3JlY29nbml6ZVdpdGgnLCB0aGlzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc2ltdWx0YW5lb3VzID0gdGhpcy5zaW11bHRhbmVvdXM7XG4gICAgICAgIG90aGVyUmVjb2duaXplciA9IGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCB0aGlzKTtcbiAgICAgICAgaWYgKCFzaW11bHRhbmVvdXNbb3RoZXJSZWNvZ25pemVyLmlkXSkge1xuICAgICAgICAgICAgc2ltdWx0YW5lb3VzW290aGVyUmVjb2duaXplci5pZF0gPSBvdGhlclJlY29nbml6ZXI7XG4gICAgICAgICAgICBvdGhlclJlY29nbml6ZXIucmVjb2duaXplV2l0aCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZHJvcCB0aGUgc2ltdWx0YW5lb3VzIGxpbmsuIGl0IGRvZXNudCByZW1vdmUgdGhlIGxpbmsgb24gdGhlIG90aGVyIHJlY29nbml6ZXIuXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfSBvdGhlclJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7UmVjb2duaXplcn0gdGhpc1xuICAgICAqL1xuICAgIGRyb3BSZWNvZ25pemVXaXRoOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKG90aGVyUmVjb2duaXplciwgJ2Ryb3BSZWNvZ25pemVXaXRoJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgb3RoZXJSZWNvZ25pemVyID0gZ2V0UmVjb2duaXplckJ5TmFtZUlmTWFuYWdlcihvdGhlclJlY29nbml6ZXIsIHRoaXMpO1xuICAgICAgICBkZWxldGUgdGhpcy5zaW11bHRhbmVvdXNbb3RoZXJSZWNvZ25pemVyLmlkXTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlY29nbml6ZXIgY2FuIG9ubHkgcnVuIHdoZW4gYW4gb3RoZXIgaXMgZmFpbGluZ1xuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gb3RoZXJSZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge1JlY29nbml6ZXJ9IHRoaXNcbiAgICAgKi9cbiAgICByZXF1aXJlRmFpbHVyZTogZnVuY3Rpb24ob3RoZXJSZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhvdGhlclJlY29nbml6ZXIsICdyZXF1aXJlRmFpbHVyZScsIHRoaXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXF1aXJlRmFpbCA9IHRoaXMucmVxdWlyZUZhaWw7XG4gICAgICAgIG90aGVyUmVjb2duaXplciA9IGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCB0aGlzKTtcbiAgICAgICAgaWYgKGluQXJyYXkocmVxdWlyZUZhaWwsIG90aGVyUmVjb2duaXplcikgPT09IC0xKSB7XG4gICAgICAgICAgICByZXF1aXJlRmFpbC5wdXNoKG90aGVyUmVjb2duaXplcik7XG4gICAgICAgICAgICBvdGhlclJlY29nbml6ZXIucmVxdWlyZUZhaWx1cmUodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGRyb3AgdGhlIHJlcXVpcmVGYWlsdXJlIGxpbmsuIGl0IGRvZXMgbm90IHJlbW92ZSB0aGUgbGluayBvbiB0aGUgb3RoZXIgcmVjb2duaXplci5cbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ9IG90aGVyUmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfSB0aGlzXG4gICAgICovXG4gICAgZHJvcFJlcXVpcmVGYWlsdXJlOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKG90aGVyUmVjb2duaXplciwgJ2Ryb3BSZXF1aXJlRmFpbHVyZScsIHRoaXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIG90aGVyUmVjb2duaXplciA9IGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCB0aGlzKTtcbiAgICAgICAgdmFyIGluZGV4ID0gaW5BcnJheSh0aGlzLnJlcXVpcmVGYWlsLCBvdGhlclJlY29nbml6ZXIpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5yZXF1aXJlRmFpbC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBoYXMgcmVxdWlyZSBmYWlsdXJlcyBib29sZWFuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgaGFzUmVxdWlyZUZhaWx1cmVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVxdWlyZUZhaWwubGVuZ3RoID4gMDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogaWYgdGhlIHJlY29nbml6ZXIgY2FuIHJlY29nbml6ZSBzaW11bHRhbmVvdXMgd2l0aCBhbiBvdGhlciByZWNvZ25pemVyXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfSBvdGhlclJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBjYW5SZWNvZ25pemVXaXRoOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5zaW11bHRhbmVvdXNbb3RoZXJSZWNvZ25pemVyLmlkXTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogWW91IHNob3VsZCB1c2UgYHRyeUVtaXRgIGluc3RlYWQgb2YgYGVtaXRgIGRpcmVjdGx5IHRvIGNoZWNrXG4gICAgICogdGhhdCBhbGwgdGhlIG5lZWRlZCByZWNvZ25pemVycyBoYXMgZmFpbGVkIGJlZm9yZSBlbWl0dGluZy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAgICAgKi9cbiAgICBlbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBzdGF0ZSA9IHRoaXMuc3RhdGU7XG5cbiAgICAgICAgZnVuY3Rpb24gZW1pdChldmVudCkge1xuICAgICAgICAgICAgc2VsZi5tYW5hZ2VyLmVtaXQoZXZlbnQsIGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vICdwYW5zdGFydCcgYW5kICdwYW5tb3ZlJ1xuICAgICAgICBpZiAoc3RhdGUgPCBTVEFURV9FTkRFRCkge1xuICAgICAgICAgICAgZW1pdChzZWxmLm9wdGlvbnMuZXZlbnQgKyBzdGF0ZVN0cihzdGF0ZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZW1pdChzZWxmLm9wdGlvbnMuZXZlbnQpOyAvLyBzaW1wbGUgJ2V2ZW50TmFtZScgZXZlbnRzXG5cbiAgICAgICAgaWYgKGlucHV0LmFkZGl0aW9uYWxFdmVudCkgeyAvLyBhZGRpdGlvbmFsIGV2ZW50KHBhbmxlZnQsIHBhbnJpZ2h0LCBwaW5jaGluLCBwaW5jaG91dC4uLilcbiAgICAgICAgICAgIGVtaXQoaW5wdXQuYWRkaXRpb25hbEV2ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHBhbmVuZCBhbmQgcGFuY2FuY2VsXG4gICAgICAgIGlmIChzdGF0ZSA+PSBTVEFURV9FTkRFRCkge1xuICAgICAgICAgICAgZW1pdChzZWxmLm9wdGlvbnMuZXZlbnQgKyBzdGF0ZVN0cihzdGF0ZSkpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHRoYXQgYWxsIHRoZSByZXF1aXJlIGZhaWx1cmUgcmVjb2duaXplcnMgaGFzIGZhaWxlZCxcbiAgICAgKiBpZiB0cnVlLCBpdCBlbWl0cyBhIGdlc3R1cmUgZXZlbnQsXG4gICAgICogb3RoZXJ3aXNlLCBzZXR1cCB0aGUgc3RhdGUgdG8gRkFJTEVELlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICAgICAqL1xuICAgIHRyeUVtaXQ6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIGlmICh0aGlzLmNhbkVtaXQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW1pdChpbnB1dCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaXQncyBmYWlsaW5nIGFueXdheVxuICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfRkFJTEVEO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjYW4gd2UgZW1pdD9cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBjYW5FbWl0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMucmVxdWlyZUZhaWwubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoISh0aGlzLnJlcXVpcmVGYWlsW2ldLnN0YXRlICYgKFNUQVRFX0ZBSUxFRCB8IFNUQVRFX1BPU1NJQkxFKSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHVwZGF0ZSB0aGUgcmVjb2duaXplclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dERhdGFcbiAgICAgKi9cbiAgICByZWNvZ25pemU6IGZ1bmN0aW9uKGlucHV0RGF0YSkge1xuICAgICAgICAvLyBtYWtlIGEgbmV3IGNvcHkgb2YgdGhlIGlucHV0RGF0YVxuICAgICAgICAvLyBzbyB3ZSBjYW4gY2hhbmdlIHRoZSBpbnB1dERhdGEgd2l0aG91dCBtZXNzaW5nIHVwIHRoZSBvdGhlciByZWNvZ25pemVyc1xuICAgICAgICB2YXIgaW5wdXREYXRhQ2xvbmUgPSBhc3NpZ24oe30sIGlucHV0RGF0YSk7XG5cbiAgICAgICAgLy8gaXMgaXMgZW5hYmxlZCBhbmQgYWxsb3cgcmVjb2duaXppbmc/XG4gICAgICAgIGlmICghYm9vbE9yRm4odGhpcy5vcHRpb25zLmVuYWJsZSwgW3RoaXMsIGlucHV0RGF0YUNsb25lXSkpIHtcbiAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTVEFURV9GQUlMRUQ7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXNldCB3aGVuIHdlJ3ZlIHJlYWNoZWQgdGhlIGVuZFxuICAgICAgICBpZiAodGhpcy5zdGF0ZSAmIChTVEFURV9SRUNPR05JWkVEIHwgU1RBVEVfQ0FOQ0VMTEVEIHwgU1RBVEVfRkFJTEVEKSkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFNUQVRFX1BPU1NJQkxFO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHRoaXMucHJvY2VzcyhpbnB1dERhdGFDbG9uZSk7XG5cbiAgICAgICAgLy8gdGhlIHJlY29nbml6ZXIgaGFzIHJlY29nbml6ZWQgYSBnZXN0dXJlXG4gICAgICAgIC8vIHNvIHRyaWdnZXIgYW4gZXZlbnRcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgJiAoU1RBVEVfQkVHQU4gfCBTVEFURV9DSEFOR0VEIHwgU1RBVEVfRU5ERUQgfCBTVEFURV9DQU5DRUxMRUQpKSB7XG4gICAgICAgICAgICB0aGlzLnRyeUVtaXQoaW5wdXREYXRhQ2xvbmUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJldHVybiB0aGUgc3RhdGUgb2YgdGhlIHJlY29nbml6ZXJcbiAgICAgKiB0aGUgYWN0dWFsIHJlY29nbml6aW5nIGhhcHBlbnMgaW4gdGhpcyBtZXRob2RcbiAgICAgKiBAdmlydHVhbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dERhdGFcbiAgICAgKiBAcmV0dXJucyB7Q29uc3R9IFNUQVRFXG4gICAgICovXG4gICAgcHJvY2VzczogZnVuY3Rpb24oaW5wdXREYXRhKSB7IH0sIC8vIGpzaGludCBpZ25vcmU6bGluZVxuXG4gICAgLyoqXG4gICAgICogcmV0dXJuIHRoZSBwcmVmZXJyZWQgdG91Y2gtYWN0aW9uXG4gICAgICogQHZpcnR1YWxcbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9XG4gICAgICovXG4gICAgZ2V0VG91Y2hBY3Rpb246IGZ1bmN0aW9uKCkgeyB9LFxuXG4gICAgLyoqXG4gICAgICogY2FsbGVkIHdoZW4gdGhlIGdlc3R1cmUgaXNuJ3QgYWxsb3dlZCB0byByZWNvZ25pemVcbiAgICAgKiBsaWtlIHdoZW4gYW5vdGhlciBpcyBiZWluZyByZWNvZ25pemVkIG9yIGl0IGlzIGRpc2FibGVkXG4gICAgICogQHZpcnR1YWxcbiAgICAgKi9cbiAgICByZXNldDogZnVuY3Rpb24oKSB7IH1cbn07XG5cbi8qKlxuICogZ2V0IGEgdXNhYmxlIHN0cmluZywgdXNlZCBhcyBldmVudCBwb3N0Zml4XG4gKiBAcGFyYW0ge0NvbnN0fSBzdGF0ZVxuICogQHJldHVybnMge1N0cmluZ30gc3RhdGVcbiAqL1xuZnVuY3Rpb24gc3RhdGVTdHIoc3RhdGUpIHtcbiAgICBpZiAoc3RhdGUgJiBTVEFURV9DQU5DRUxMRUQpIHtcbiAgICAgICAgcmV0dXJuICdjYW5jZWwnO1xuICAgIH0gZWxzZSBpZiAoc3RhdGUgJiBTVEFURV9FTkRFRCkge1xuICAgICAgICByZXR1cm4gJ2VuZCc7XG4gICAgfSBlbHNlIGlmIChzdGF0ZSAmIFNUQVRFX0NIQU5HRUQpIHtcbiAgICAgICAgcmV0dXJuICdtb3ZlJztcbiAgICB9IGVsc2UgaWYgKHN0YXRlICYgU1RBVEVfQkVHQU4pIHtcbiAgICAgICAgcmV0dXJuICdzdGFydCc7XG4gICAgfVxuICAgIHJldHVybiAnJztcbn1cblxuLyoqXG4gKiBkaXJlY3Rpb24gY29ucyB0byBzdHJpbmdcbiAqIEBwYXJhbSB7Q29uc3R9IGRpcmVjdGlvblxuICogQHJldHVybnMge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZGlyZWN0aW9uU3RyKGRpcmVjdGlvbikge1xuICAgIGlmIChkaXJlY3Rpb24gPT0gRElSRUNUSU9OX0RPV04pIHtcbiAgICAgICAgcmV0dXJuICdkb3duJztcbiAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiA9PSBESVJFQ1RJT05fVVApIHtcbiAgICAgICAgcmV0dXJuICd1cCc7XG4gICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gPT0gRElSRUNUSU9OX0xFRlQpIHtcbiAgICAgICAgcmV0dXJuICdsZWZ0JztcbiAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiA9PSBESVJFQ1RJT05fUklHSFQpIHtcbiAgICAgICAgcmV0dXJuICdyaWdodCc7XG4gICAgfVxuICAgIHJldHVybiAnJztcbn1cblxuLyoqXG4gKiBnZXQgYSByZWNvZ25pemVyIGJ5IG5hbWUgaWYgaXQgaXMgYm91bmQgdG8gYSBtYW5hZ2VyXG4gKiBAcGFyYW0ge1JlY29nbml6ZXJ8U3RyaW5nfSBvdGhlclJlY29nbml6ZXJcbiAqIEBwYXJhbSB7UmVjb2duaXplcn0gcmVjb2duaXplclxuICogQHJldHVybnMge1JlY29nbml6ZXJ9XG4gKi9cbmZ1bmN0aW9uIGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCByZWNvZ25pemVyKSB7XG4gICAgdmFyIG1hbmFnZXIgPSByZWNvZ25pemVyLm1hbmFnZXI7XG4gICAgaWYgKG1hbmFnZXIpIHtcbiAgICAgICAgcmV0dXJuIG1hbmFnZXIuZ2V0KG90aGVyUmVjb2duaXplcik7XG4gICAgfVxuICAgIHJldHVybiBvdGhlclJlY29nbml6ZXI7XG59XG5cbi8qKlxuICogVGhpcyByZWNvZ25pemVyIGlzIGp1c3QgdXNlZCBhcyBhIGJhc2UgZm9yIHRoZSBzaW1wbGUgYXR0cmlidXRlIHJlY29nbml6ZXJzLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIEF0dHJSZWNvZ25pemVyKCkge1xuICAgIFJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChBdHRyUmVjb2duaXplciwgUmVjb2duaXplciwge1xuICAgIC8qKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgQXR0clJlY29nbml6ZXJcbiAgICAgKi9cbiAgICBkZWZhdWx0czoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICogQGRlZmF1bHQgMVxuICAgICAgICAgKi9cbiAgICAgICAgcG9pbnRlcnM6IDFcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXNlZCB0byBjaGVjayBpZiBpdCB0aGUgcmVjb2duaXplciByZWNlaXZlcyB2YWxpZCBpbnB1dCwgbGlrZSBpbnB1dC5kaXN0YW5jZSA+IDEwLlxuICAgICAqIEBtZW1iZXJvZiBBdHRyUmVjb2duaXplclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufSByZWNvZ25pemVkXG4gICAgICovXG4gICAgYXR0clRlc3Q6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBvcHRpb25Qb2ludGVycyA9IHRoaXMub3B0aW9ucy5wb2ludGVycztcbiAgICAgICAgcmV0dXJuIG9wdGlvblBvaW50ZXJzID09PSAwIHx8IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA9PT0gb3B0aW9uUG9pbnRlcnM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByb2Nlc3MgdGhlIGlucHV0IGFuZCByZXR1cm4gdGhlIHN0YXRlIGZvciB0aGUgcmVjb2duaXplclxuICAgICAqIEBtZW1iZXJvZiBBdHRyUmVjb2duaXplclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICAgICAqIEByZXR1cm5zIHsqfSBTdGF0ZVxuICAgICAqL1xuICAgIHByb2Nlc3M6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBzdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgICAgIHZhciBldmVudFR5cGUgPSBpbnB1dC5ldmVudFR5cGU7XG5cbiAgICAgICAgdmFyIGlzUmVjb2duaXplZCA9IHN0YXRlICYgKFNUQVRFX0JFR0FOIHwgU1RBVEVfQ0hBTkdFRCk7XG4gICAgICAgIHZhciBpc1ZhbGlkID0gdGhpcy5hdHRyVGVzdChpbnB1dCk7XG5cbiAgICAgICAgLy8gb24gY2FuY2VsIGlucHV0IGFuZCB3ZSd2ZSByZWNvZ25pemVkIGJlZm9yZSwgcmV0dXJuIFNUQVRFX0NBTkNFTExFRFxuICAgICAgICBpZiAoaXNSZWNvZ25pemVkICYmIChldmVudFR5cGUgJiBJTlBVVF9DQU5DRUwgfHwgIWlzVmFsaWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RhdGUgfCBTVEFURV9DQU5DRUxMRUQ7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNSZWNvZ25pemVkIHx8IGlzVmFsaWQpIHtcbiAgICAgICAgICAgIGlmIChldmVudFR5cGUgJiBJTlBVVF9FTkQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGUgfCBTVEFURV9FTkRFRDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIShzdGF0ZSAmIFNUQVRFX0JFR0FOKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBTVEFURV9CRUdBTjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdGF0ZSB8IFNUQVRFX0NIQU5HRUQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFNUQVRFX0ZBSUxFRDtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBQYW5cbiAqIFJlY29nbml6ZWQgd2hlbiB0aGUgcG9pbnRlciBpcyBkb3duIGFuZCBtb3ZlZCBpbiB0aGUgYWxsb3dlZCBkaXJlY3Rpb24uXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIEF0dHJSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFBhblJlY29nbml6ZXIoKSB7XG4gICAgQXR0clJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMucFggPSBudWxsO1xuICAgIHRoaXMucFkgPSBudWxsO1xufVxuXG5pbmhlcml0KFBhblJlY29nbml6ZXIsIEF0dHJSZWNvZ25pemVyLCB7XG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBQYW5SZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICdwYW4nLFxuICAgICAgICB0aHJlc2hvbGQ6IDEwLFxuICAgICAgICBwb2ludGVyczogMSxcbiAgICAgICAgZGlyZWN0aW9uOiBESVJFQ1RJT05fQUxMXG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHRoaXMub3B0aW9ucy5kaXJlY3Rpb247XG4gICAgICAgIHZhciBhY3Rpb25zID0gW107XG4gICAgICAgIGlmIChkaXJlY3Rpb24gJiBESVJFQ1RJT05fSE9SSVpPTlRBTCkge1xuICAgICAgICAgICAgYWN0aW9ucy5wdXNoKFRPVUNIX0FDVElPTl9QQU5fWSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRpcmVjdGlvbiAmIERJUkVDVElPTl9WRVJUSUNBTCkge1xuICAgICAgICAgICAgYWN0aW9ucy5wdXNoKFRPVUNIX0FDVElPTl9QQU5fWCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjdGlvbnM7XG4gICAgfSxcblxuICAgIGRpcmVjdGlvblRlc3Q6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgICB2YXIgaGFzTW92ZWQgPSB0cnVlO1xuICAgICAgICB2YXIgZGlzdGFuY2UgPSBpbnB1dC5kaXN0YW5jZTtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IGlucHV0LmRpcmVjdGlvbjtcbiAgICAgICAgdmFyIHggPSBpbnB1dC5kZWx0YVg7XG4gICAgICAgIHZhciB5ID0gaW5wdXQuZGVsdGFZO1xuXG4gICAgICAgIC8vIGxvY2sgdG8gYXhpcz9cbiAgICAgICAgaWYgKCEoZGlyZWN0aW9uICYgb3B0aW9ucy5kaXJlY3Rpb24pKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5kaXJlY3Rpb24gJiBESVJFQ1RJT05fSE9SSVpPTlRBTCkge1xuICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9ICh4ID09PSAwKSA/IERJUkVDVElPTl9OT05FIDogKHggPCAwKSA/IERJUkVDVElPTl9MRUZUIDogRElSRUNUSU9OX1JJR0hUO1xuICAgICAgICAgICAgICAgIGhhc01vdmVkID0geCAhPSB0aGlzLnBYO1xuICAgICAgICAgICAgICAgIGRpc3RhbmNlID0gTWF0aC5hYnMoaW5wdXQuZGVsdGFYKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gKHkgPT09IDApID8gRElSRUNUSU9OX05PTkUgOiAoeSA8IDApID8gRElSRUNUSU9OX1VQIDogRElSRUNUSU9OX0RPV047XG4gICAgICAgICAgICAgICAgaGFzTW92ZWQgPSB5ICE9IHRoaXMucFk7XG4gICAgICAgICAgICAgICAgZGlzdGFuY2UgPSBNYXRoLmFicyhpbnB1dC5kZWx0YVkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlucHV0LmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICAgICAgcmV0dXJuIGhhc01vdmVkICYmIGRpc3RhbmNlID4gb3B0aW9ucy50aHJlc2hvbGQgJiYgZGlyZWN0aW9uICYgb3B0aW9ucy5kaXJlY3Rpb247XG4gICAgfSxcblxuICAgIGF0dHJUZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gQXR0clJlY29nbml6ZXIucHJvdG90eXBlLmF0dHJUZXN0LmNhbGwodGhpcywgaW5wdXQpICYmXG4gICAgICAgICAgICAodGhpcy5zdGF0ZSAmIFNUQVRFX0JFR0FOIHx8ICghKHRoaXMuc3RhdGUgJiBTVEFURV9CRUdBTikgJiYgdGhpcy5kaXJlY3Rpb25UZXN0KGlucHV0KSkpO1xuICAgIH0sXG5cbiAgICBlbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuXG4gICAgICAgIHRoaXMucFggPSBpbnB1dC5kZWx0YVg7XG4gICAgICAgIHRoaXMucFkgPSBpbnB1dC5kZWx0YVk7XG5cbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IGRpcmVjdGlvblN0cihpbnB1dC5kaXJlY3Rpb24pO1xuXG4gICAgICAgIGlmIChkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIGlucHV0LmFkZGl0aW9uYWxFdmVudCA9IHRoaXMub3B0aW9ucy5ldmVudCArIGRpcmVjdGlvbjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zdXBlci5lbWl0LmNhbGwodGhpcywgaW5wdXQpO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIFBpbmNoXG4gKiBSZWNvZ25pemVkIHdoZW4gdHdvIG9yIG1vcmUgcG9pbnRlcnMgYXJlIG1vdmluZyB0b3dhcmQgKHpvb20taW4pIG9yIGF3YXkgZnJvbSBlYWNoIG90aGVyICh6b29tLW91dCkuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIEF0dHJSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFBpbmNoUmVjb2duaXplcigpIHtcbiAgICBBdHRyUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFBpbmNoUmVjb2duaXplciwgQXR0clJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFBpbmNoUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAncGluY2gnLFxuICAgICAgICB0aHJlc2hvbGQ6IDAsXG4gICAgICAgIHBvaW50ZXJzOiAyXG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFtUT1VDSF9BQ1RJT05fTk9ORV07XG4gICAgfSxcblxuICAgIGF0dHJUZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3VwZXIuYXR0clRlc3QuY2FsbCh0aGlzLCBpbnB1dCkgJiZcbiAgICAgICAgICAgIChNYXRoLmFicyhpbnB1dC5zY2FsZSAtIDEpID4gdGhpcy5vcHRpb25zLnRocmVzaG9sZCB8fCB0aGlzLnN0YXRlICYgU1RBVEVfQkVHQU4pO1xuICAgIH0sXG5cbiAgICBlbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICBpZiAoaW5wdXQuc2NhbGUgIT09IDEpIHtcbiAgICAgICAgICAgIHZhciBpbk91dCA9IGlucHV0LnNjYWxlIDwgMSA/ICdpbicgOiAnb3V0JztcbiAgICAgICAgICAgIGlucHV0LmFkZGl0aW9uYWxFdmVudCA9IHRoaXMub3B0aW9ucy5ldmVudCArIGluT3V0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3N1cGVyLmVtaXQuY2FsbCh0aGlzLCBpbnB1dCk7XG4gICAgfVxufSk7XG5cbi8qKlxuICogUHJlc3NcbiAqIFJlY29nbml6ZWQgd2hlbiB0aGUgcG9pbnRlciBpcyBkb3duIGZvciB4IG1zIHdpdGhvdXQgYW55IG1vdmVtZW50LlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFByZXNzUmVjb2duaXplcigpIHtcbiAgICBSZWNvZ25pemVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLl90aW1lciA9IG51bGw7XG4gICAgdGhpcy5faW5wdXQgPSBudWxsO1xufVxuXG5pbmhlcml0KFByZXNzUmVjb2duaXplciwgUmVjb2duaXplciwge1xuICAgIC8qKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgUHJlc3NSZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICdwcmVzcycsXG4gICAgICAgIHBvaW50ZXJzOiAxLFxuICAgICAgICB0aW1lOiAyNTEsIC8vIG1pbmltYWwgdGltZSBvZiB0aGUgcG9pbnRlciB0byBiZSBwcmVzc2VkXG4gICAgICAgIHRocmVzaG9sZDogOSAvLyBhIG1pbmltYWwgbW92ZW1lbnQgaXMgb2ssIGJ1dCBrZWVwIGl0IGxvd1xuICAgIH0sXG5cbiAgICBnZXRUb3VjaEFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBbVE9VQ0hfQUNUSU9OX0FVVE9dO1xuICAgIH0sXG5cbiAgICBwcm9jZXNzOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgdmFyIHZhbGlkUG9pbnRlcnMgPSBpbnB1dC5wb2ludGVycy5sZW5ndGggPT09IG9wdGlvbnMucG9pbnRlcnM7XG4gICAgICAgIHZhciB2YWxpZE1vdmVtZW50ID0gaW5wdXQuZGlzdGFuY2UgPCBvcHRpb25zLnRocmVzaG9sZDtcbiAgICAgICAgdmFyIHZhbGlkVGltZSA9IGlucHV0LmRlbHRhVGltZSA+IG9wdGlvbnMudGltZTtcblxuICAgICAgICB0aGlzLl9pbnB1dCA9IGlucHV0O1xuXG4gICAgICAgIC8vIHdlIG9ubHkgYWxsb3cgbGl0dGxlIG1vdmVtZW50XG4gICAgICAgIC8vIGFuZCB3ZSd2ZSByZWFjaGVkIGFuIGVuZCBldmVudCwgc28gYSB0YXAgaXMgcG9zc2libGVcbiAgICAgICAgaWYgKCF2YWxpZE1vdmVtZW50IHx8ICF2YWxpZFBvaW50ZXJzIHx8IChpbnB1dC5ldmVudFR5cGUgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSAmJiAhdmFsaWRUaW1lKSkge1xuICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGlucHV0LmV2ZW50VHlwZSAmIElOUFVUX1NUQVJUKSB7XG4gICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgICAgICB0aGlzLl90aW1lciA9IHNldFRpbWVvdXRDb250ZXh0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTVEFURV9SRUNPR05JWkVEO1xuICAgICAgICAgICAgICAgIHRoaXMudHJ5RW1pdCgpO1xuICAgICAgICAgICAgfSwgb3B0aW9ucy50aW1lLCB0aGlzKTtcbiAgICAgICAgfSBlbHNlIGlmIChpbnB1dC5ldmVudFR5cGUgJiBJTlBVVF9FTkQpIHtcbiAgICAgICAgICAgIHJldHVybiBTVEFURV9SRUNPR05JWkVEO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTVEFURV9GQUlMRUQ7XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RpbWVyKTtcbiAgICB9LFxuXG4gICAgZW1pdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT09IFNUQVRFX1JFQ09HTklaRUQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbnB1dCAmJiAoaW5wdXQuZXZlbnRUeXBlICYgSU5QVVRfRU5EKSkge1xuICAgICAgICAgICAgdGhpcy5tYW5hZ2VyLmVtaXQodGhpcy5vcHRpb25zLmV2ZW50ICsgJ3VwJywgaW5wdXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5faW5wdXQudGltZVN0YW1wID0gbm93KCk7XG4gICAgICAgICAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm9wdGlvbnMuZXZlbnQsIHRoaXMuX2lucHV0KTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG4vKipcbiAqIFJvdGF0ZVxuICogUmVjb2duaXplZCB3aGVuIHR3byBvciBtb3JlIHBvaW50ZXIgYXJlIG1vdmluZyBpbiBhIGNpcmN1bGFyIG1vdGlvbi5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgQXR0clJlY29nbml6ZXJcbiAqL1xuZnVuY3Rpb24gUm90YXRlUmVjb2duaXplcigpIHtcbiAgICBBdHRyUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFJvdGF0ZVJlY29nbml6ZXIsIEF0dHJSZWNvZ25pemVyLCB7XG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBSb3RhdGVSZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICdyb3RhdGUnLFxuICAgICAgICB0aHJlc2hvbGQ6IDAsXG4gICAgICAgIHBvaW50ZXJzOiAyXG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFtUT1VDSF9BQ1RJT05fTk9ORV07XG4gICAgfSxcblxuICAgIGF0dHJUZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3VwZXIuYXR0clRlc3QuY2FsbCh0aGlzLCBpbnB1dCkgJiZcbiAgICAgICAgICAgIChNYXRoLmFicyhpbnB1dC5yb3RhdGlvbikgPiB0aGlzLm9wdGlvbnMudGhyZXNob2xkIHx8IHRoaXMuc3RhdGUgJiBTVEFURV9CRUdBTik7XG4gICAgfVxufSk7XG5cbi8qKlxuICogU3dpcGVcbiAqIFJlY29nbml6ZWQgd2hlbiB0aGUgcG9pbnRlciBpcyBtb3ZpbmcgZmFzdCAodmVsb2NpdHkpLCB3aXRoIGVub3VnaCBkaXN0YW5jZSBpbiB0aGUgYWxsb3dlZCBkaXJlY3Rpb24uXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIEF0dHJSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFN3aXBlUmVjb2duaXplcigpIHtcbiAgICBBdHRyUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFN3aXBlUmVjb2duaXplciwgQXR0clJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFN3aXBlUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAnc3dpcGUnLFxuICAgICAgICB0aHJlc2hvbGQ6IDEwLFxuICAgICAgICB2ZWxvY2l0eTogMC4zLFxuICAgICAgICBkaXJlY3Rpb246IERJUkVDVElPTl9IT1JJWk9OVEFMIHwgRElSRUNUSU9OX1ZFUlRJQ0FMLFxuICAgICAgICBwb2ludGVyczogMVxuICAgIH0sXG5cbiAgICBnZXRUb3VjaEFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBQYW5SZWNvZ25pemVyLnByb3RvdHlwZS5nZXRUb3VjaEFjdGlvbi5jYWxsKHRoaXMpO1xuICAgIH0sXG5cbiAgICBhdHRyVGVzdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHRoaXMub3B0aW9ucy5kaXJlY3Rpb247XG4gICAgICAgIHZhciB2ZWxvY2l0eTtcblxuICAgICAgICBpZiAoZGlyZWN0aW9uICYgKERJUkVDVElPTl9IT1JJWk9OVEFMIHwgRElSRUNUSU9OX1ZFUlRJQ0FMKSkge1xuICAgICAgICAgICAgdmVsb2NpdHkgPSBpbnB1dC5vdmVyYWxsVmVsb2NpdHk7XG4gICAgICAgIH0gZWxzZSBpZiAoZGlyZWN0aW9uICYgRElSRUNUSU9OX0hPUklaT05UQUwpIHtcbiAgICAgICAgICAgIHZlbG9jaXR5ID0gaW5wdXQub3ZlcmFsbFZlbG9jaXR5WDtcbiAgICAgICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gJiBESVJFQ1RJT05fVkVSVElDQUwpIHtcbiAgICAgICAgICAgIHZlbG9jaXR5ID0gaW5wdXQub3ZlcmFsbFZlbG9jaXR5WTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl9zdXBlci5hdHRyVGVzdC5jYWxsKHRoaXMsIGlucHV0KSAmJlxuICAgICAgICAgICAgZGlyZWN0aW9uICYgaW5wdXQub2Zmc2V0RGlyZWN0aW9uICYmXG4gICAgICAgICAgICBpbnB1dC5kaXN0YW5jZSA+IHRoaXMub3B0aW9ucy50aHJlc2hvbGQgJiZcbiAgICAgICAgICAgIGlucHV0Lm1heFBvaW50ZXJzID09IHRoaXMub3B0aW9ucy5wb2ludGVycyAmJlxuICAgICAgICAgICAgYWJzKHZlbG9jaXR5KSA+IHRoaXMub3B0aW9ucy52ZWxvY2l0eSAmJiBpbnB1dC5ldmVudFR5cGUgJiBJTlBVVF9FTkQ7XG4gICAgfSxcblxuICAgIGVtaXQ6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSBkaXJlY3Rpb25TdHIoaW5wdXQub2Zmc2V0RGlyZWN0aW9uKTtcbiAgICAgICAgaWYgKGRpcmVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5tYW5hZ2VyLmVtaXQodGhpcy5vcHRpb25zLmV2ZW50ICsgZGlyZWN0aW9uLCBpbnB1dCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm9wdGlvbnMuZXZlbnQsIGlucHV0KTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBBIHRhcCBpcyBlY29nbml6ZWQgd2hlbiB0aGUgcG9pbnRlciBpcyBkb2luZyBhIHNtYWxsIHRhcC9jbGljay4gTXVsdGlwbGUgdGFwcyBhcmUgcmVjb2duaXplZCBpZiB0aGV5IG9jY3VyXG4gKiBiZXR3ZWVuIHRoZSBnaXZlbiBpbnRlcnZhbCBhbmQgcG9zaXRpb24uIFRoZSBkZWxheSBvcHRpb24gY2FuIGJlIHVzZWQgdG8gcmVjb2duaXplIG11bHRpLXRhcHMgd2l0aG91dCBmaXJpbmdcbiAqIGEgc2luZ2xlIHRhcC5cbiAqXG4gKiBUaGUgZXZlbnREYXRhIGZyb20gdGhlIGVtaXR0ZWQgZXZlbnQgY29udGFpbnMgdGhlIHByb3BlcnR5IGB0YXBDb3VudGAsIHdoaWNoIGNvbnRhaW5zIHRoZSBhbW91bnQgb2ZcbiAqIG11bHRpLXRhcHMgYmVpbmcgcmVjb2duaXplZC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgUmVjb2duaXplclxuICovXG5mdW5jdGlvbiBUYXBSZWNvZ25pemVyKCkge1xuICAgIFJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIC8vIHByZXZpb3VzIHRpbWUgYW5kIGNlbnRlcixcbiAgICAvLyB1c2VkIGZvciB0YXAgY291bnRpbmdcbiAgICB0aGlzLnBUaW1lID0gZmFsc2U7XG4gICAgdGhpcy5wQ2VudGVyID0gZmFsc2U7XG5cbiAgICB0aGlzLl90aW1lciA9IG51bGw7XG4gICAgdGhpcy5faW5wdXQgPSBudWxsO1xuICAgIHRoaXMuY291bnQgPSAwO1xufVxuXG5pbmhlcml0KFRhcFJlY29nbml6ZXIsIFJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFBpbmNoUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAndGFwJyxcbiAgICAgICAgcG9pbnRlcnM6IDEsXG4gICAgICAgIHRhcHM6IDEsXG4gICAgICAgIGludGVydmFsOiAzMDAsIC8vIG1heCB0aW1lIGJldHdlZW4gdGhlIG11bHRpLXRhcCB0YXBzXG4gICAgICAgIHRpbWU6IDI1MCwgLy8gbWF4IHRpbWUgb2YgdGhlIHBvaW50ZXIgdG8gYmUgZG93biAobGlrZSBmaW5nZXIgb24gdGhlIHNjcmVlbilcbiAgICAgICAgdGhyZXNob2xkOiA5LCAvLyBhIG1pbmltYWwgbW92ZW1lbnQgaXMgb2ssIGJ1dCBrZWVwIGl0IGxvd1xuICAgICAgICBwb3NUaHJlc2hvbGQ6IDEwIC8vIGEgbXVsdGktdGFwIGNhbiBiZSBhIGJpdCBvZmYgdGhlIGluaXRpYWwgcG9zaXRpb25cbiAgICB9LFxuXG4gICAgZ2V0VG91Y2hBY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gW1RPVUNIX0FDVElPTl9NQU5JUFVMQVRJT05dO1xuICAgIH0sXG5cbiAgICBwcm9jZXNzOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuICAgICAgICB2YXIgdmFsaWRQb2ludGVycyA9IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA9PT0gb3B0aW9ucy5wb2ludGVycztcbiAgICAgICAgdmFyIHZhbGlkTW92ZW1lbnQgPSBpbnB1dC5kaXN0YW5jZSA8IG9wdGlvbnMudGhyZXNob2xkO1xuICAgICAgICB2YXIgdmFsaWRUb3VjaFRpbWUgPSBpbnB1dC5kZWx0YVRpbWUgPCBvcHRpb25zLnRpbWU7XG5cbiAgICAgICAgdGhpcy5yZXNldCgpO1xuXG4gICAgICAgIGlmICgoaW5wdXQuZXZlbnRUeXBlICYgSU5QVVRfU1RBUlQpICYmICh0aGlzLmNvdW50ID09PSAwKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmFpbFRpbWVvdXQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdlIG9ubHkgYWxsb3cgbGl0dGxlIG1vdmVtZW50XG4gICAgICAgIC8vIGFuZCB3ZSd2ZSByZWFjaGVkIGFuIGVuZCBldmVudCwgc28gYSB0YXAgaXMgcG9zc2libGVcbiAgICAgICAgaWYgKHZhbGlkTW92ZW1lbnQgJiYgdmFsaWRUb3VjaFRpbWUgJiYgdmFsaWRQb2ludGVycykge1xuICAgICAgICAgICAgaWYgKGlucHV0LmV2ZW50VHlwZSAhPSBJTlBVVF9FTkQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mYWlsVGltZW91dCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdmFsaWRJbnRlcnZhbCA9IHRoaXMucFRpbWUgPyAoaW5wdXQudGltZVN0YW1wIC0gdGhpcy5wVGltZSA8IG9wdGlvbnMuaW50ZXJ2YWwpIDogdHJ1ZTtcbiAgICAgICAgICAgIHZhciB2YWxpZE11bHRpVGFwID0gIXRoaXMucENlbnRlciB8fCBnZXREaXN0YW5jZSh0aGlzLnBDZW50ZXIsIGlucHV0LmNlbnRlcikgPCBvcHRpb25zLnBvc1RocmVzaG9sZDtcblxuICAgICAgICAgICAgdGhpcy5wVGltZSA9IGlucHV0LnRpbWVTdGFtcDtcbiAgICAgICAgICAgIHRoaXMucENlbnRlciA9IGlucHV0LmNlbnRlcjtcblxuICAgICAgICAgICAgaWYgKCF2YWxpZE11bHRpVGFwIHx8ICF2YWxpZEludGVydmFsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudCA9IDE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY291bnQgKz0gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5faW5wdXQgPSBpbnB1dDtcblxuICAgICAgICAgICAgLy8gaWYgdGFwIGNvdW50IG1hdGNoZXMgd2UgaGF2ZSByZWNvZ25pemVkIGl0LFxuICAgICAgICAgICAgLy8gZWxzZSBpdCBoYXMgYmVnYW4gcmVjb2duaXppbmcuLi5cbiAgICAgICAgICAgIHZhciB0YXBDb3VudCA9IHRoaXMuY291bnQgJSBvcHRpb25zLnRhcHM7XG4gICAgICAgICAgICBpZiAodGFwQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyBubyBmYWlsaW5nIHJlcXVpcmVtZW50cywgaW1tZWRpYXRlbHkgdHJpZ2dlciB0aGUgdGFwIGV2ZW50XG4gICAgICAgICAgICAgICAgLy8gb3Igd2FpdCBhcyBsb25nIGFzIHRoZSBtdWx0aXRhcCBpbnRlcnZhbCB0byB0cmlnZ2VyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmhhc1JlcXVpcmVGYWlsdXJlcygpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBTVEFURV9SRUNPR05JWkVEO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3RpbWVyID0gc2V0VGltZW91dENvbnRleHQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfUkVDT0dOSVpFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJ5RW1pdCgpO1xuICAgICAgICAgICAgICAgICAgICB9LCBvcHRpb25zLmludGVydmFsLCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFNUQVRFX0JFR0FOO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU1RBVEVfRkFJTEVEO1xuICAgIH0sXG5cbiAgICBmYWlsVGltZW91dDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3RpbWVyID0gc2V0VGltZW91dENvbnRleHQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfRkFJTEVEO1xuICAgICAgICB9LCB0aGlzLm9wdGlvbnMuaW50ZXJ2YWwsIHRoaXMpO1xuICAgICAgICByZXR1cm4gU1RBVEVfRkFJTEVEO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90aW1lcik7XG4gICAgfSxcblxuICAgIGVtaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZSA9PSBTVEFURV9SRUNPR05JWkVEKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnB1dC50YXBDb3VudCA9IHRoaXMuY291bnQ7XG4gICAgICAgICAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm9wdGlvbnMuZXZlbnQsIHRoaXMuX2lucHV0KTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG4vKipcbiAqIFNpbXBsZSB3YXkgdG8gY3JlYXRlIGEgbWFuYWdlciB3aXRoIGEgZGVmYXVsdCBzZXQgb2YgcmVjb2duaXplcnMuXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gSGFtbWVyKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBvcHRpb25zLnJlY29nbml6ZXJzID0gaWZVbmRlZmluZWQob3B0aW9ucy5yZWNvZ25pemVycywgSGFtbWVyLmRlZmF1bHRzLnByZXNldCk7XG4gICAgcmV0dXJuIG5ldyBNYW5hZ2VyKGVsZW1lbnQsIG9wdGlvbnMpO1xufVxuXG4vKipcbiAqIEBjb25zdCB7c3RyaW5nfVxuICovXG5IYW1tZXIuVkVSU0lPTiA9ICcyLjAuNyc7XG5cbi8qKlxuICogZGVmYXVsdCBzZXR0aW5nc1xuICogQG5hbWVzcGFjZVxuICovXG5IYW1tZXIuZGVmYXVsdHMgPSB7XG4gICAgLyoqXG4gICAgICogc2V0IGlmIERPTSBldmVudHMgYXJlIGJlaW5nIHRyaWdnZXJlZC5cbiAgICAgKiBCdXQgdGhpcyBpcyBzbG93ZXIgYW5kIHVudXNlZCBieSBzaW1wbGUgaW1wbGVtZW50YXRpb25zLCBzbyBkaXNhYmxlZCBieSBkZWZhdWx0LlxuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICovXG4gICAgZG9tRXZlbnRzOiBmYWxzZSxcblxuICAgIC8qKlxuICAgICAqIFRoZSB2YWx1ZSBmb3IgdGhlIHRvdWNoQWN0aW9uIHByb3BlcnR5L2ZhbGxiYWNrLlxuICAgICAqIFdoZW4gc2V0IHRvIGBjb21wdXRlYCBpdCB3aWxsIG1hZ2ljYWxseSBzZXQgdGhlIGNvcnJlY3QgdmFsdWUgYmFzZWQgb24gdGhlIGFkZGVkIHJlY29nbml6ZXJzLlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICogQGRlZmF1bHQgY29tcHV0ZVxuICAgICAqL1xuICAgIHRvdWNoQWN0aW9uOiBUT1VDSF9BQ1RJT05fQ09NUFVURSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqIEBkZWZhdWx0IHRydWVcbiAgICAgKi9cbiAgICBlbmFibGU6IHRydWUsXG5cbiAgICAvKipcbiAgICAgKiBFWFBFUklNRU5UQUwgRkVBVFVSRSAtLSBjYW4gYmUgcmVtb3ZlZC9jaGFuZ2VkXG4gICAgICogQ2hhbmdlIHRoZSBwYXJlbnQgaW5wdXQgdGFyZ2V0IGVsZW1lbnQuXG4gICAgICogSWYgTnVsbCwgdGhlbiBpdCBpcyBiZWluZyBzZXQgdGhlIHRvIG1haW4gZWxlbWVudC5cbiAgICAgKiBAdHlwZSB7TnVsbHxFdmVudFRhcmdldH1cbiAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICovXG4gICAgaW5wdXRUYXJnZXQ6IG51bGwsXG5cbiAgICAvKipcbiAgICAgKiBmb3JjZSBhbiBpbnB1dCBjbGFzc1xuICAgICAqIEB0eXBlIHtOdWxsfEZ1bmN0aW9ufVxuICAgICAqIEBkZWZhdWx0IG51bGxcbiAgICAgKi9cbiAgICBpbnB1dENsYXNzOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogRGVmYXVsdCByZWNvZ25pemVyIHNldHVwIHdoZW4gY2FsbGluZyBgSGFtbWVyKClgXG4gICAgICogV2hlbiBjcmVhdGluZyBhIG5ldyBNYW5hZ2VyIHRoZXNlIHdpbGwgYmUgc2tpcHBlZC5cbiAgICAgKiBAdHlwZSB7QXJyYXl9XG4gICAgICovXG4gICAgcHJlc2V0OiBbXG4gICAgICAgIC8vIFJlY29nbml6ZXJDbGFzcywgb3B0aW9ucywgW3JlY29nbml6ZVdpdGgsIC4uLl0sIFtyZXF1aXJlRmFpbHVyZSwgLi4uXVxuICAgICAgICBbUm90YXRlUmVjb2duaXplciwge2VuYWJsZTogZmFsc2V9XSxcbiAgICAgICAgW1BpbmNoUmVjb2duaXplciwge2VuYWJsZTogZmFsc2V9LCBbJ3JvdGF0ZSddXSxcbiAgICAgICAgW1N3aXBlUmVjb2duaXplciwge2RpcmVjdGlvbjogRElSRUNUSU9OX0hPUklaT05UQUx9XSxcbiAgICAgICAgW1BhblJlY29nbml6ZXIsIHtkaXJlY3Rpb246IERJUkVDVElPTl9IT1JJWk9OVEFMfSwgWydzd2lwZSddXSxcbiAgICAgICAgW1RhcFJlY29nbml6ZXJdLFxuICAgICAgICBbVGFwUmVjb2duaXplciwge2V2ZW50OiAnZG91YmxldGFwJywgdGFwczogMn0sIFsndGFwJ11dLFxuICAgICAgICBbUHJlc3NSZWNvZ25pemVyXVxuICAgIF0sXG5cbiAgICAvKipcbiAgICAgKiBTb21lIENTUyBwcm9wZXJ0aWVzIGNhbiBiZSB1c2VkIHRvIGltcHJvdmUgdGhlIHdvcmtpbmcgb2YgSGFtbWVyLlxuICAgICAqIEFkZCB0aGVtIHRvIHRoaXMgbWV0aG9kIGFuZCB0aGV5IHdpbGwgYmUgc2V0IHdoZW4gY3JlYXRpbmcgYSBuZXcgTWFuYWdlci5cbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICovXG4gICAgY3NzUHJvcHM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc2FibGVzIHRleHQgc2VsZWN0aW9uIHRvIGltcHJvdmUgdGhlIGRyYWdnaW5nIGdlc3R1cmUuIE1haW5seSBmb3IgZGVza3RvcCBicm93c2Vycy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ25vbmUnXG4gICAgICAgICAqL1xuICAgICAgICB1c2VyU2VsZWN0OiAnbm9uZScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc2FibGUgdGhlIFdpbmRvd3MgUGhvbmUgZ3JpcHBlcnMgd2hlbiBwcmVzc2luZyBhbiBlbGVtZW50LlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAnbm9uZSdcbiAgICAgICAgICovXG4gICAgICAgIHRvdWNoU2VsZWN0OiAnbm9uZScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc2FibGVzIHRoZSBkZWZhdWx0IGNhbGxvdXQgc2hvd24gd2hlbiB5b3UgdG91Y2ggYW5kIGhvbGQgYSB0b3VjaCB0YXJnZXQuXG4gICAgICAgICAqIE9uIGlPUywgd2hlbiB5b3UgdG91Y2ggYW5kIGhvbGQgYSB0b3VjaCB0YXJnZXQgc3VjaCBhcyBhIGxpbmssIFNhZmFyaSBkaXNwbGF5c1xuICAgICAgICAgKiBhIGNhbGxvdXQgY29udGFpbmluZyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgbGluay4gVGhpcyBwcm9wZXJ0eSBhbGxvd3MgeW91IHRvIGRpc2FibGUgdGhhdCBjYWxsb3V0LlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAnbm9uZSdcbiAgICAgICAgICovXG4gICAgICAgIHRvdWNoQ2FsbG91dDogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTcGVjaWZpZXMgd2hldGhlciB6b29taW5nIGlzIGVuYWJsZWQuIFVzZWQgYnkgSUUxMD5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ25vbmUnXG4gICAgICAgICAqL1xuICAgICAgICBjb250ZW50Wm9vbWluZzogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTcGVjaWZpZXMgdGhhdCBhbiBlbnRpcmUgZWxlbWVudCBzaG91bGQgYmUgZHJhZ2dhYmxlIGluc3RlYWQgb2YgaXRzIGNvbnRlbnRzLiBNYWlubHkgZm9yIGRlc2t0b3AgYnJvd3NlcnMuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqIEBkZWZhdWx0ICdub25lJ1xuICAgICAgICAgKi9cbiAgICAgICAgdXNlckRyYWc6ICdub25lJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3ZlcnJpZGVzIHRoZSBoaWdobGlnaHQgY29sb3Igc2hvd24gd2hlbiB0aGUgdXNlciB0YXBzIGEgbGluayBvciBhIEphdmFTY3JpcHRcbiAgICAgICAgICogY2xpY2thYmxlIGVsZW1lbnQgaW4gaU9TLiBUaGlzIHByb3BlcnR5IG9iZXlzIHRoZSBhbHBoYSB2YWx1ZSwgaWYgc3BlY2lmaWVkLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAncmdiYSgwLDAsMCwwKSdcbiAgICAgICAgICovXG4gICAgICAgIHRhcEhpZ2hsaWdodENvbG9yOiAncmdiYSgwLDAsMCwwKSdcbiAgICB9XG59O1xuXG52YXIgU1RPUCA9IDE7XG52YXIgRk9SQ0VEX1NUT1AgPSAyO1xuXG4vKipcbiAqIE1hbmFnZXJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBNYW5hZ2VyKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBhc3NpZ24oe30sIEhhbW1lci5kZWZhdWx0cywgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICB0aGlzLm9wdGlvbnMuaW5wdXRUYXJnZXQgPSB0aGlzLm9wdGlvbnMuaW5wdXRUYXJnZXQgfHwgZWxlbWVudDtcblxuICAgIHRoaXMuaGFuZGxlcnMgPSB7fTtcbiAgICB0aGlzLnNlc3Npb24gPSB7fTtcbiAgICB0aGlzLnJlY29nbml6ZXJzID0gW107XG4gICAgdGhpcy5vbGRDc3NQcm9wcyA9IHt9O1xuXG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLmlucHV0ID0gY3JlYXRlSW5wdXRJbnN0YW5jZSh0aGlzKTtcbiAgICB0aGlzLnRvdWNoQWN0aW9uID0gbmV3IFRvdWNoQWN0aW9uKHRoaXMsIHRoaXMub3B0aW9ucy50b3VjaEFjdGlvbik7XG5cbiAgICB0b2dnbGVDc3NQcm9wcyh0aGlzLCB0cnVlKTtcblxuICAgIGVhY2godGhpcy5vcHRpb25zLnJlY29nbml6ZXJzLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHZhciByZWNvZ25pemVyID0gdGhpcy5hZGQobmV3IChpdGVtWzBdKShpdGVtWzFdKSk7XG4gICAgICAgIGl0ZW1bMl0gJiYgcmVjb2duaXplci5yZWNvZ25pemVXaXRoKGl0ZW1bMl0pO1xuICAgICAgICBpdGVtWzNdICYmIHJlY29nbml6ZXIucmVxdWlyZUZhaWx1cmUoaXRlbVszXSk7XG4gICAgfSwgdGhpcyk7XG59XG5cbk1hbmFnZXIucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIHNldCBvcHRpb25zXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICAgKiBAcmV0dXJucyB7TWFuYWdlcn1cbiAgICAgKi9cbiAgICBzZXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgYXNzaWduKHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgLy8gT3B0aW9ucyB0aGF0IG5lZWQgYSBsaXR0bGUgbW9yZSBzZXR1cFxuICAgICAgICBpZiAob3B0aW9ucy50b3VjaEFjdGlvbikge1xuICAgICAgICAgICAgdGhpcy50b3VjaEFjdGlvbi51cGRhdGUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5pbnB1dFRhcmdldCkge1xuICAgICAgICAgICAgLy8gQ2xlYW4gdXAgZXhpc3RpbmcgZXZlbnQgbGlzdGVuZXJzIGFuZCByZWluaXRpYWxpemVcbiAgICAgICAgICAgIHRoaXMuaW5wdXQuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dC50YXJnZXQgPSBvcHRpb25zLmlucHV0VGFyZ2V0O1xuICAgICAgICAgICAgdGhpcy5pbnB1dC5pbml0KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHN0b3AgcmVjb2duaXppbmcgZm9yIHRoaXMgc2Vzc2lvbi5cbiAgICAgKiBUaGlzIHNlc3Npb24gd2lsbCBiZSBkaXNjYXJkZWQsIHdoZW4gYSBuZXcgW2lucHV0XXN0YXJ0IGV2ZW50IGlzIGZpcmVkLlxuICAgICAqIFdoZW4gZm9yY2VkLCB0aGUgcmVjb2duaXplciBjeWNsZSBpcyBzdG9wcGVkIGltbWVkaWF0ZWx5LlxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gW2ZvcmNlXVxuICAgICAqL1xuICAgIHN0b3A6IGZ1bmN0aW9uKGZvcmNlKSB7XG4gICAgICAgIHRoaXMuc2Vzc2lvbi5zdG9wcGVkID0gZm9yY2UgPyBGT1JDRURfU1RPUCA6IFNUT1A7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJ1biB0aGUgcmVjb2duaXplcnMhXG4gICAgICogY2FsbGVkIGJ5IHRoZSBpbnB1dEhhbmRsZXIgZnVuY3Rpb24gb24gZXZlcnkgbW92ZW1lbnQgb2YgdGhlIHBvaW50ZXJzICh0b3VjaGVzKVxuICAgICAqIGl0IHdhbGtzIHRocm91Z2ggYWxsIHRoZSByZWNvZ25pemVycyBhbmQgdHJpZXMgdG8gZGV0ZWN0IHRoZSBnZXN0dXJlIHRoYXQgaXMgYmVpbmcgbWFkZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dERhdGFcbiAgICAgKi9cbiAgICByZWNvZ25pemU6IGZ1bmN0aW9uKGlucHV0RGF0YSkge1xuICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuc2Vzc2lvbjtcbiAgICAgICAgaWYgKHNlc3Npb24uc3RvcHBlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcnVuIHRoZSB0b3VjaC1hY3Rpb24gcG9seWZpbGxcbiAgICAgICAgdGhpcy50b3VjaEFjdGlvbi5wcmV2ZW50RGVmYXVsdHMoaW5wdXREYXRhKTtcblxuICAgICAgICB2YXIgcmVjb2duaXplcjtcbiAgICAgICAgdmFyIHJlY29nbml6ZXJzID0gdGhpcy5yZWNvZ25pemVycztcblxuICAgICAgICAvLyB0aGlzIGhvbGRzIHRoZSByZWNvZ25pemVyIHRoYXQgaXMgYmVpbmcgcmVjb2duaXplZC5cbiAgICAgICAgLy8gc28gdGhlIHJlY29nbml6ZXIncyBzdGF0ZSBuZWVkcyB0byBiZSBCRUdBTiwgQ0hBTkdFRCwgRU5ERUQgb3IgUkVDT0dOSVpFRFxuICAgICAgICAvLyBpZiBubyByZWNvZ25pemVyIGlzIGRldGVjdGluZyBhIHRoaW5nLCBpdCBpcyBzZXQgdG8gYG51bGxgXG4gICAgICAgIHZhciBjdXJSZWNvZ25pemVyID0gc2Vzc2lvbi5jdXJSZWNvZ25pemVyO1xuXG4gICAgICAgIC8vIHJlc2V0IHdoZW4gdGhlIGxhc3QgcmVjb2duaXplciBpcyByZWNvZ25pemVkXG4gICAgICAgIC8vIG9yIHdoZW4gd2UncmUgaW4gYSBuZXcgc2Vzc2lvblxuICAgICAgICBpZiAoIWN1clJlY29nbml6ZXIgfHwgKGN1clJlY29nbml6ZXIgJiYgY3VyUmVjb2duaXplci5zdGF0ZSAmIFNUQVRFX1JFQ09HTklaRUQpKSB7XG4gICAgICAgICAgICBjdXJSZWNvZ25pemVyID0gc2Vzc2lvbi5jdXJSZWNvZ25pemVyID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCByZWNvZ25pemVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJlY29nbml6ZXIgPSByZWNvZ25pemVyc1tpXTtcblxuICAgICAgICAgICAgLy8gZmluZCBvdXQgaWYgd2UgYXJlIGFsbG93ZWQgdHJ5IHRvIHJlY29nbml6ZSB0aGUgaW5wdXQgZm9yIHRoaXMgb25lLlxuICAgICAgICAgICAgLy8gMS4gICBhbGxvdyBpZiB0aGUgc2Vzc2lvbiBpcyBOT1QgZm9yY2VkIHN0b3BwZWQgKHNlZSB0aGUgLnN0b3AoKSBtZXRob2QpXG4gICAgICAgICAgICAvLyAyLiAgIGFsbG93IGlmIHdlIHN0aWxsIGhhdmVuJ3QgcmVjb2duaXplZCBhIGdlc3R1cmUgaW4gdGhpcyBzZXNzaW9uLCBvciB0aGUgdGhpcyByZWNvZ25pemVyIGlzIHRoZSBvbmVcbiAgICAgICAgICAgIC8vICAgICAgdGhhdCBpcyBiZWluZyByZWNvZ25pemVkLlxuICAgICAgICAgICAgLy8gMy4gICBhbGxvdyBpZiB0aGUgcmVjb2duaXplciBpcyBhbGxvd2VkIHRvIHJ1biBzaW11bHRhbmVvdXMgd2l0aCB0aGUgY3VycmVudCByZWNvZ25pemVkIHJlY29nbml6ZXIuXG4gICAgICAgICAgICAvLyAgICAgIHRoaXMgY2FuIGJlIHNldHVwIHdpdGggdGhlIGByZWNvZ25pemVXaXRoKClgIG1ldGhvZCBvbiB0aGUgcmVjb2duaXplci5cbiAgICAgICAgICAgIGlmIChzZXNzaW9uLnN0b3BwZWQgIT09IEZPUkNFRF9TVE9QICYmICggLy8gMVxuICAgICAgICAgICAgICAgICAgICAhY3VyUmVjb2duaXplciB8fCByZWNvZ25pemVyID09IGN1clJlY29nbml6ZXIgfHwgLy8gMlxuICAgICAgICAgICAgICAgICAgICByZWNvZ25pemVyLmNhblJlY29nbml6ZVdpdGgoY3VyUmVjb2duaXplcikpKSB7IC8vIDNcbiAgICAgICAgICAgICAgICByZWNvZ25pemVyLnJlY29nbml6ZShpbnB1dERhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWNvZ25pemVyLnJlc2V0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSByZWNvZ25pemVyIGhhcyBiZWVuIHJlY29nbml6aW5nIHRoZSBpbnB1dCBhcyBhIHZhbGlkIGdlc3R1cmUsIHdlIHdhbnQgdG8gc3RvcmUgdGhpcyBvbmUgYXMgdGhlXG4gICAgICAgICAgICAvLyBjdXJyZW50IGFjdGl2ZSByZWNvZ25pemVyLiBidXQgb25seSBpZiB3ZSBkb24ndCBhbHJlYWR5IGhhdmUgYW4gYWN0aXZlIHJlY29nbml6ZXJcbiAgICAgICAgICAgIGlmICghY3VyUmVjb2duaXplciAmJiByZWNvZ25pemVyLnN0YXRlICYgKFNUQVRFX0JFR0FOIHwgU1RBVEVfQ0hBTkdFRCB8IFNUQVRFX0VOREVEKSkge1xuICAgICAgICAgICAgICAgIGN1clJlY29nbml6ZXIgPSBzZXNzaW9uLmN1clJlY29nbml6ZXIgPSByZWNvZ25pemVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGdldCBhIHJlY29nbml6ZXIgYnkgaXRzIGV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfFN0cmluZ30gcmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfE51bGx9XG4gICAgICovXG4gICAgZ2V0OiBmdW5jdGlvbihyZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChyZWNvZ25pemVyIGluc3RhbmNlb2YgUmVjb2duaXplcikge1xuICAgICAgICAgICAgcmV0dXJuIHJlY29nbml6ZXI7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVjb2duaXplcnMgPSB0aGlzLnJlY29nbml6ZXJzO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlY29nbml6ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAocmVjb2duaXplcnNbaV0ub3B0aW9ucy5ldmVudCA9PSByZWNvZ25pemVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlY29nbml6ZXJzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBhZGQgYSByZWNvZ25pemVyIHRvIHRoZSBtYW5hZ2VyXG4gICAgICogZXhpc3RpbmcgcmVjb2duaXplcnMgd2l0aCB0aGUgc2FtZSBldmVudCBuYW1lIHdpbGwgYmUgcmVtb3ZlZFxuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gcmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfE1hbmFnZXJ9XG4gICAgICovXG4gICAgYWRkOiBmdW5jdGlvbihyZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhyZWNvZ25pemVyLCAnYWRkJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVtb3ZlIGV4aXN0aW5nXG4gICAgICAgIHZhciBleGlzdGluZyA9IHRoaXMuZ2V0KHJlY29nbml6ZXIub3B0aW9ucy5ldmVudCk7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUoZXhpc3RpbmcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZWNvZ25pemVycy5wdXNoKHJlY29nbml6ZXIpO1xuICAgICAgICByZWNvZ25pemVyLm1hbmFnZXIgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMudG91Y2hBY3Rpb24udXBkYXRlKCk7XG4gICAgICAgIHJldHVybiByZWNvZ25pemVyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiByZW1vdmUgYSByZWNvZ25pemVyIGJ5IG5hbWUgb3IgaW5zdGFuY2VcbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ8U3RyaW5nfSByZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge01hbmFnZXJ9XG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihyZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhyZWNvZ25pemVyLCAncmVtb3ZlJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVjb2duaXplciA9IHRoaXMuZ2V0KHJlY29nbml6ZXIpO1xuXG4gICAgICAgIC8vIGxldCdzIG1ha2Ugc3VyZSB0aGlzIHJlY29nbml6ZXIgZXhpc3RzXG4gICAgICAgIGlmIChyZWNvZ25pemVyKSB7XG4gICAgICAgICAgICB2YXIgcmVjb2duaXplcnMgPSB0aGlzLnJlY29nbml6ZXJzO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gaW5BcnJheShyZWNvZ25pemVycywgcmVjb2duaXplcik7XG5cbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZWNvZ25pemVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIHRoaXMudG91Y2hBY3Rpb24udXBkYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogYmluZCBldmVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudHNcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyXG4gICAgICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gdGhpc1xuICAgICAqL1xuICAgIG9uOiBmdW5jdGlvbihldmVudHMsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGV2ZW50cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhhbmRsZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGhhbmRsZXJzID0gdGhpcy5oYW5kbGVycztcbiAgICAgICAgZWFjaChzcGxpdFN0cihldmVudHMpLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgaGFuZGxlcnNbZXZlbnRdID0gaGFuZGxlcnNbZXZlbnRdIHx8IFtdO1xuICAgICAgICAgICAgaGFuZGxlcnNbZXZlbnRdLnB1c2goaGFuZGxlcik7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogdW5iaW5kIGV2ZW50LCBsZWF2ZSBlbWl0IGJsYW5rIHRvIHJlbW92ZSBhbGwgaGFuZGxlcnNcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRzXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2hhbmRsZXJdXG4gICAgICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gdGhpc1xuICAgICAqL1xuICAgIG9mZjogZnVuY3Rpb24oZXZlbnRzLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmIChldmVudHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGhhbmRsZXJzID0gdGhpcy5oYW5kbGVycztcbiAgICAgICAgZWFjaChzcGxpdFN0cihldmVudHMpLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgaWYgKCFoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGhhbmRsZXJzW2V2ZW50XTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlcnNbZXZlbnRdICYmIGhhbmRsZXJzW2V2ZW50XS5zcGxpY2UoaW5BcnJheShoYW5kbGVyc1tldmVudF0sIGhhbmRsZXIpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBlbWl0IGV2ZW50IHRvIHRoZSBsaXN0ZW5lcnNcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgICAqL1xuICAgIGVtaXQ6IGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gICAgICAgIC8vIHdlIGFsc28gd2FudCB0byB0cmlnZ2VyIGRvbSBldmVudHNcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kb21FdmVudHMpIHtcbiAgICAgICAgICAgIHRyaWdnZXJEb21FdmVudChldmVudCwgZGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBubyBoYW5kbGVycywgc28gc2tpcCBpdCBhbGxcbiAgICAgICAgdmFyIGhhbmRsZXJzID0gdGhpcy5oYW5kbGVyc1tldmVudF0gJiYgdGhpcy5oYW5kbGVyc1tldmVudF0uc2xpY2UoKTtcbiAgICAgICAgaWYgKCFoYW5kbGVycyB8fCAhaGFuZGxlcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBkYXRhLnR5cGUgPSBldmVudDtcbiAgICAgICAgZGF0YS5wcmV2ZW50RGVmYXVsdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGF0YS5zcmNFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCBoYW5kbGVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGhhbmRsZXJzW2ldKGRhdGEpO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGRlc3Ryb3kgdGhlIG1hbmFnZXIgYW5kIHVuYmluZHMgYWxsIGV2ZW50c1xuICAgICAqIGl0IGRvZXNuJ3QgdW5iaW5kIGRvbSBldmVudHMsIHRoYXQgaXMgdGhlIHVzZXIgb3duIHJlc3BvbnNpYmlsaXR5XG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCAmJiB0b2dnbGVDc3NQcm9wcyh0aGlzLCBmYWxzZSk7XG5cbiAgICAgICAgdGhpcy5oYW5kbGVycyA9IHt9O1xuICAgICAgICB0aGlzLnNlc3Npb24gPSB7fTtcbiAgICAgICAgdGhpcy5pbnB1dC5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG4gICAgfVxufTtcblxuLyoqXG4gKiBhZGQvcmVtb3ZlIHRoZSBjc3MgcHJvcGVydGllcyBhcyBkZWZpbmVkIGluIG1hbmFnZXIub3B0aW9ucy5jc3NQcm9wc1xuICogQHBhcmFtIHtNYW5hZ2VyfSBtYW5hZ2VyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGFkZFxuICovXG5mdW5jdGlvbiB0b2dnbGVDc3NQcm9wcyhtYW5hZ2VyLCBhZGQpIHtcbiAgICB2YXIgZWxlbWVudCA9IG1hbmFnZXIuZWxlbWVudDtcbiAgICBpZiAoIWVsZW1lbnQuc3R5bGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgcHJvcDtcbiAgICBlYWNoKG1hbmFnZXIub3B0aW9ucy5jc3NQcm9wcywgZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgcHJvcCA9IHByZWZpeGVkKGVsZW1lbnQuc3R5bGUsIG5hbWUpO1xuICAgICAgICBpZiAoYWRkKSB7XG4gICAgICAgICAgICBtYW5hZ2VyLm9sZENzc1Byb3BzW3Byb3BdID0gZWxlbWVudC5zdHlsZVtwcm9wXTtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGVbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGVbcHJvcF0gPSBtYW5hZ2VyLm9sZENzc1Byb3BzW3Byb3BdIHx8ICcnO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKCFhZGQpIHtcbiAgICAgICAgbWFuYWdlci5vbGRDc3NQcm9wcyA9IHt9O1xuICAgIH1cbn1cblxuLyoqXG4gKiB0cmlnZ2VyIGRvbSBldmVudFxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICovXG5mdW5jdGlvbiB0cmlnZ2VyRG9tRXZlbnQoZXZlbnQsIGRhdGEpIHtcbiAgICB2YXIgZ2VzdHVyZUV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgZ2VzdHVyZUV2ZW50LmluaXRFdmVudChldmVudCwgdHJ1ZSwgdHJ1ZSk7XG4gICAgZ2VzdHVyZUV2ZW50Lmdlc3R1cmUgPSBkYXRhO1xuICAgIGRhdGEudGFyZ2V0LmRpc3BhdGNoRXZlbnQoZ2VzdHVyZUV2ZW50KTtcbn1cblxuYXNzaWduKEhhbW1lciwge1xuICAgIElOUFVUX1NUQVJUOiBJTlBVVF9TVEFSVCxcbiAgICBJTlBVVF9NT1ZFOiBJTlBVVF9NT1ZFLFxuICAgIElOUFVUX0VORDogSU5QVVRfRU5ELFxuICAgIElOUFVUX0NBTkNFTDogSU5QVVRfQ0FOQ0VMLFxuXG4gICAgU1RBVEVfUE9TU0lCTEU6IFNUQVRFX1BPU1NJQkxFLFxuICAgIFNUQVRFX0JFR0FOOiBTVEFURV9CRUdBTixcbiAgICBTVEFURV9DSEFOR0VEOiBTVEFURV9DSEFOR0VELFxuICAgIFNUQVRFX0VOREVEOiBTVEFURV9FTkRFRCxcbiAgICBTVEFURV9SRUNPR05JWkVEOiBTVEFURV9SRUNPR05JWkVELFxuICAgIFNUQVRFX0NBTkNFTExFRDogU1RBVEVfQ0FOQ0VMTEVELFxuICAgIFNUQVRFX0ZBSUxFRDogU1RBVEVfRkFJTEVELFxuXG4gICAgRElSRUNUSU9OX05PTkU6IERJUkVDVElPTl9OT05FLFxuICAgIERJUkVDVElPTl9MRUZUOiBESVJFQ1RJT05fTEVGVCxcbiAgICBESVJFQ1RJT05fUklHSFQ6IERJUkVDVElPTl9SSUdIVCxcbiAgICBESVJFQ1RJT05fVVA6IERJUkVDVElPTl9VUCxcbiAgICBESVJFQ1RJT05fRE9XTjogRElSRUNUSU9OX0RPV04sXG4gICAgRElSRUNUSU9OX0hPUklaT05UQUw6IERJUkVDVElPTl9IT1JJWk9OVEFMLFxuICAgIERJUkVDVElPTl9WRVJUSUNBTDogRElSRUNUSU9OX1ZFUlRJQ0FMLFxuICAgIERJUkVDVElPTl9BTEw6IERJUkVDVElPTl9BTEwsXG5cbiAgICBNYW5hZ2VyOiBNYW5hZ2VyLFxuICAgIElucHV0OiBJbnB1dCxcbiAgICBUb3VjaEFjdGlvbjogVG91Y2hBY3Rpb24sXG5cbiAgICBUb3VjaElucHV0OiBUb3VjaElucHV0LFxuICAgIE1vdXNlSW5wdXQ6IE1vdXNlSW5wdXQsXG4gICAgUG9pbnRlckV2ZW50SW5wdXQ6IFBvaW50ZXJFdmVudElucHV0LFxuICAgIFRvdWNoTW91c2VJbnB1dDogVG91Y2hNb3VzZUlucHV0LFxuICAgIFNpbmdsZVRvdWNoSW5wdXQ6IFNpbmdsZVRvdWNoSW5wdXQsXG5cbiAgICBSZWNvZ25pemVyOiBSZWNvZ25pemVyLFxuICAgIEF0dHJSZWNvZ25pemVyOiBBdHRyUmVjb2duaXplcixcbiAgICBUYXA6IFRhcFJlY29nbml6ZXIsXG4gICAgUGFuOiBQYW5SZWNvZ25pemVyLFxuICAgIFN3aXBlOiBTd2lwZVJlY29nbml6ZXIsXG4gICAgUGluY2g6IFBpbmNoUmVjb2duaXplcixcbiAgICBSb3RhdGU6IFJvdGF0ZVJlY29nbml6ZXIsXG4gICAgUHJlc3M6IFByZXNzUmVjb2duaXplcixcblxuICAgIG9uOiBhZGRFdmVudExpc3RlbmVycyxcbiAgICBvZmY6IHJlbW92ZUV2ZW50TGlzdGVuZXJzLFxuICAgIGVhY2g6IGVhY2gsXG4gICAgbWVyZ2U6IG1lcmdlLFxuICAgIGV4dGVuZDogZXh0ZW5kLFxuICAgIGFzc2lnbjogYXNzaWduLFxuICAgIGluaGVyaXQ6IGluaGVyaXQsXG4gICAgYmluZEZuOiBiaW5kRm4sXG4gICAgcHJlZml4ZWQ6IHByZWZpeGVkXG59KTtcblxuLy8gdGhpcyBwcmV2ZW50cyBlcnJvcnMgd2hlbiBIYW1tZXIgaXMgbG9hZGVkIGluIHRoZSBwcmVzZW5jZSBvZiBhbiBBTURcbi8vICBzdHlsZSBsb2FkZXIgYnV0IGJ5IHNjcmlwdCB0YWcsIG5vdCBieSB0aGUgbG9hZGVyLlxudmFyIGZyZWVHbG9iYWwgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnID8gc2VsZiA6IHt9KSk7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuZnJlZUdsb2JhbC5IYW1tZXIgPSBIYW1tZXI7XG5cbmlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBIYW1tZXI7XG4gICAgfSk7XG59IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IEhhbW1lcjtcbn0gZWxzZSB7XG4gICAgd2luZG93W2V4cG9ydE5hbWVdID0gSGFtbWVyO1xufVxuXG59KSh3aW5kb3csIGRvY3VtZW50LCAnSGFtbWVyJyk7XG4iLCIvKiEgVmVsb2NpdHlKUy5vcmcgKDEuMy4xKS4gKEMpIDIwMTQgSnVsaWFuIFNoYXBpcm8uIE1JVCBAbGljZW5zZTogZW4ud2lraXBlZGlhLm9yZy93aWtpL01JVF9MaWNlbnNlICovXG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqXG4gVmVsb2NpdHkgalF1ZXJ5IFNoaW1cbiAqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vKiEgVmVsb2NpdHlKUy5vcmcgalF1ZXJ5IFNoaW0gKDEuMC4xKS4gKEMpIDIwMTQgVGhlIGpRdWVyeSBGb3VuZGF0aW9uLiBNSVQgQGxpY2Vuc2U6IGVuLndpa2lwZWRpYS5vcmcvd2lraS9NSVRfTGljZW5zZS4gKi9cblxuLyogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBqUXVlcnkgZnVuY3Rpb25zIHRoYXQgVmVsb2NpdHkgcmVsaWVzIG9uLCB0aGVyZWJ5IHJlbW92aW5nIFZlbG9jaXR5J3MgZGVwZW5kZW5jeSBvbiBhIGZ1bGwgY29weSBvZiBqUXVlcnksIGFuZCBhbGxvd2luZyBpdCB0byB3b3JrIGluIGFueSBlbnZpcm9ubWVudC4gKi9cbi8qIFRoZXNlIHNoaW1tZWQgZnVuY3Rpb25zIGFyZSBvbmx5IHVzZWQgaWYgalF1ZXJ5IGlzbid0IHByZXNlbnQuIElmIGJvdGggdGhpcyBzaGltIGFuZCBqUXVlcnkgYXJlIGxvYWRlZCwgVmVsb2NpdHkgZGVmYXVsdHMgdG8galF1ZXJ5IHByb3Blci4gKi9cbi8qIEJyb3dzZXIgc3VwcG9ydDogVXNpbmcgdGhpcyBzaGltIGluc3RlYWQgb2YgalF1ZXJ5IHByb3BlciByZW1vdmVzIHN1cHBvcnQgZm9yIElFOC4gKi9cblxuKGZ1bmN0aW9uKHdpbmRvdykge1xuXHRcInVzZSBzdHJpY3RcIjtcblx0LyoqKioqKioqKioqKioqKlxuXHQgU2V0dXBcblx0ICoqKioqKioqKioqKioqKi9cblxuXHQvKiBJZiBqUXVlcnkgaXMgYWxyZWFkeSBsb2FkZWQsIHRoZXJlJ3Mgbm8gcG9pbnQgaW4gbG9hZGluZyB0aGlzIHNoaW0uICovXG5cdGlmICh3aW5kb3cualF1ZXJ5KSB7XG5cdFx0cmV0dXJuO1xuXHR9XG5cblx0LyogalF1ZXJ5IGJhc2UuICovXG5cdHZhciAkID0gZnVuY3Rpb24oc2VsZWN0b3IsIGNvbnRleHQpIHtcblx0XHRyZXR1cm4gbmV3ICQuZm4uaW5pdChzZWxlY3RvciwgY29udGV4dCk7XG5cdH07XG5cblx0LyoqKioqKioqKioqKioqKioqKioqXG5cdCBQcml2YXRlIE1ldGhvZHNcblx0ICoqKioqKioqKioqKioqKioqKioqL1xuXG5cdC8qIGpRdWVyeSAqL1xuXHQkLmlzV2luZG93ID0gZnVuY3Rpb24ob2JqKSB7XG5cdFx0LyoganNoaW50IGVxZXFlcTogZmFsc2UgKi9cblx0XHRyZXR1cm4gb2JqICYmIG9iaiA9PT0gb2JqLndpbmRvdztcblx0fTtcblxuXHQvKiBqUXVlcnkgKi9cblx0JC50eXBlID0gZnVuY3Rpb24ob2JqKSB7XG5cdFx0aWYgKCFvYmopIHtcblx0XHRcdHJldHVybiBvYmogKyBcIlwiO1xuXHRcdH1cblxuXHRcdHJldHVybiB0eXBlb2Ygb2JqID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBvYmogPT09IFwiZnVuY3Rpb25cIiA/XG5cdFx0XHRcdGNsYXNzMnR5cGVbdG9TdHJpbmcuY2FsbChvYmopXSB8fCBcIm9iamVjdFwiIDpcblx0XHRcdFx0dHlwZW9mIG9iajtcblx0fTtcblxuXHQvKiBqUXVlcnkgKi9cblx0JC5pc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbihvYmopIHtcblx0XHRyZXR1cm4gJC50eXBlKG9iaikgPT09IFwiYXJyYXlcIjtcblx0fTtcblxuXHQvKiBqUXVlcnkgKi9cblx0ZnVuY3Rpb24gaXNBcnJheWxpa2Uob2JqKSB7XG5cdFx0dmFyIGxlbmd0aCA9IG9iai5sZW5ndGgsXG5cdFx0XHRcdHR5cGUgPSAkLnR5cGUob2JqKTtcblxuXHRcdGlmICh0eXBlID09PSBcImZ1bmN0aW9uXCIgfHwgJC5pc1dpbmRvdyhvYmopKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0aWYgKG9iai5ub2RlVHlwZSA9PT0gMSAmJiBsZW5ndGgpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiB0eXBlID09PSBcImFycmF5XCIgfHwgbGVuZ3RoID09PSAwIHx8IHR5cGVvZiBsZW5ndGggPT09IFwibnVtYmVyXCIgJiYgbGVuZ3RoID4gMCAmJiAobGVuZ3RoIC0gMSkgaW4gb2JqO1xuXHR9XG5cblx0LyoqKioqKioqKioqKioqKlxuXHQgJCBNZXRob2RzXG5cdCAqKioqKioqKioqKioqKiovXG5cblx0LyogalF1ZXJ5OiBTdXBwb3J0IHJlbW92ZWQgZm9yIElFPDkuICovXG5cdCQuaXNQbGFpbk9iamVjdCA9IGZ1bmN0aW9uKG9iaikge1xuXHRcdHZhciBrZXk7XG5cblx0XHRpZiAoIW9iaiB8fCAkLnR5cGUob2JqKSAhPT0gXCJvYmplY3RcIiB8fCBvYmoubm9kZVR5cGUgfHwgJC5pc1dpbmRvdyhvYmopKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0dHJ5IHtcblx0XHRcdGlmIChvYmouY29uc3RydWN0b3IgJiZcblx0XHRcdFx0XHQhaGFzT3duLmNhbGwob2JqLCBcImNvbnN0cnVjdG9yXCIpICYmXG5cdFx0XHRcdFx0IWhhc093bi5jYWxsKG9iai5jb25zdHJ1Y3Rvci5wcm90b3R5cGUsIFwiaXNQcm90b3R5cGVPZlwiKSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGZvciAoa2V5IGluIG9iaikge1xuXHRcdH1cblxuXHRcdHJldHVybiBrZXkgPT09IHVuZGVmaW5lZCB8fCBoYXNPd24uY2FsbChvYmosIGtleSk7XG5cdH07XG5cblx0LyogalF1ZXJ5ICovXG5cdCQuZWFjaCA9IGZ1bmN0aW9uKG9iaiwgY2FsbGJhY2ssIGFyZ3MpIHtcblx0XHR2YXIgdmFsdWUsXG5cdFx0XHRcdGkgPSAwLFxuXHRcdFx0XHRsZW5ndGggPSBvYmoubGVuZ3RoLFxuXHRcdFx0XHRpc0FycmF5ID0gaXNBcnJheWxpa2Uob2JqKTtcblxuXHRcdGlmIChhcmdzKSB7XG5cdFx0XHRpZiAoaXNBcnJheSkge1xuXHRcdFx0XHRmb3IgKDsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0dmFsdWUgPSBjYWxsYmFjay5hcHBseShvYmpbaV0sIGFyZ3MpO1xuXG5cdFx0XHRcdFx0aWYgKHZhbHVlID09PSBmYWxzZSkge1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRmb3IgKGkgaW4gb2JqKSB7XG5cdFx0XHRcdFx0aWYgKCFvYmouaGFzT3duUHJvcGVydHkoaSkpIHtcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR2YWx1ZSA9IGNhbGxiYWNrLmFwcGx5KG9ialtpXSwgYXJncyk7XG5cblx0XHRcdFx0XHRpZiAodmFsdWUgPT09IGZhbHNlKSB7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoaXNBcnJheSkge1xuXHRcdFx0XHRmb3IgKDsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0dmFsdWUgPSBjYWxsYmFjay5jYWxsKG9ialtpXSwgaSwgb2JqW2ldKTtcblxuXHRcdFx0XHRcdGlmICh2YWx1ZSA9PT0gZmFsc2UpIHtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Zm9yIChpIGluIG9iaikge1xuXHRcdFx0XHRcdGlmICghb2JqLmhhc093blByb3BlcnR5KGkpKSB7XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dmFsdWUgPSBjYWxsYmFjay5jYWxsKG9ialtpXSwgaSwgb2JqW2ldKTtcblxuXHRcdFx0XHRcdGlmICh2YWx1ZSA9PT0gZmFsc2UpIHtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0LyogQ3VzdG9tICovXG5cdCQuZGF0YSA9IGZ1bmN0aW9uKG5vZGUsIGtleSwgdmFsdWUpIHtcblx0XHQvKiAkLmdldERhdGEoKSAqL1xuXHRcdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR2YXIgZ2V0SWQgPSBub2RlWyQuZXhwYW5kb10sXG5cdFx0XHRcdFx0c3RvcmUgPSBnZXRJZCAmJiBjYWNoZVtnZXRJZF07XG5cblx0XHRcdGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRyZXR1cm4gc3RvcmU7XG5cdFx0XHR9IGVsc2UgaWYgKHN0b3JlKSB7XG5cdFx0XHRcdGlmIChrZXkgaW4gc3RvcmUpIHtcblx0XHRcdFx0XHRyZXR1cm4gc3RvcmVba2V5XTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0LyogJC5zZXREYXRhKCkgKi9cblx0XHR9IGVsc2UgaWYgKGtleSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR2YXIgc2V0SWQgPSBub2RlWyQuZXhwYW5kb10gfHwgKG5vZGVbJC5leHBhbmRvXSA9ICsrJC51dWlkKTtcblxuXHRcdFx0Y2FjaGVbc2V0SWRdID0gY2FjaGVbc2V0SWRdIHx8IHt9O1xuXHRcdFx0Y2FjaGVbc2V0SWRdW2tleV0gPSB2YWx1ZTtcblxuXHRcdFx0cmV0dXJuIHZhbHVlO1xuXHRcdH1cblx0fTtcblxuXHQvKiBDdXN0b20gKi9cblx0JC5yZW1vdmVEYXRhID0gZnVuY3Rpb24obm9kZSwga2V5cykge1xuXHRcdHZhciBpZCA9IG5vZGVbJC5leHBhbmRvXSxcblx0XHRcdFx0c3RvcmUgPSBpZCAmJiBjYWNoZVtpZF07XG5cblx0XHRpZiAoc3RvcmUpIHtcblx0XHRcdC8vIENsZWFudXAgdGhlIGVudGlyZSBzdG9yZSBpZiBubyBrZXlzIGFyZSBwcm92aWRlZC5cblx0XHRcdGlmICgha2V5cykge1xuXHRcdFx0XHRkZWxldGUgY2FjaGVbaWRdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0JC5lYWNoKGtleXMsIGZ1bmN0aW9uKF8sIGtleSkge1xuXHRcdFx0XHRcdGRlbGV0ZSBzdG9yZVtrZXldO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0LyogalF1ZXJ5ICovXG5cdCQuZXh0ZW5kID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNyYywgY29weUlzQXJyYXksIGNvcHksIG5hbWUsIG9wdGlvbnMsIGNsb25lLFxuXHRcdFx0XHR0YXJnZXQgPSBhcmd1bWVudHNbMF0gfHwge30sXG5cdFx0XHRcdGkgPSAxLFxuXHRcdFx0XHRsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoLFxuXHRcdFx0XHRkZWVwID0gZmFsc2U7XG5cblx0XHRpZiAodHlwZW9mIHRhcmdldCA9PT0gXCJib29sZWFuXCIpIHtcblx0XHRcdGRlZXAgPSB0YXJnZXQ7XG5cblx0XHRcdHRhcmdldCA9IGFyZ3VtZW50c1tpXSB8fCB7fTtcblx0XHRcdGkrKztcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIHRhcmdldCAhPT0gXCJvYmplY3RcIiAmJiAkLnR5cGUodGFyZ2V0KSAhPT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0XHR0YXJnZXQgPSB7fTtcblx0XHR9XG5cblx0XHRpZiAoaSA9PT0gbGVuZ3RoKSB7XG5cdFx0XHR0YXJnZXQgPSB0aGlzO1xuXHRcdFx0aS0tO1xuXHRcdH1cblxuXHRcdGZvciAoOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmICgob3B0aW9ucyA9IGFyZ3VtZW50c1tpXSkpIHtcblx0XHRcdFx0Zm9yIChuYW1lIGluIG9wdGlvbnMpIHtcblx0XHRcdFx0XHRpZiAoIW9wdGlvbnMuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcblx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRzcmMgPSB0YXJnZXRbbmFtZV07XG5cdFx0XHRcdFx0Y29weSA9IG9wdGlvbnNbbmFtZV07XG5cblx0XHRcdFx0XHRpZiAodGFyZ2V0ID09PSBjb3B5KSB7XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoZGVlcCAmJiBjb3B5ICYmICgkLmlzUGxhaW5PYmplY3QoY29weSkgfHwgKGNvcHlJc0FycmF5ID0gJC5pc0FycmF5KGNvcHkpKSkpIHtcblx0XHRcdFx0XHRcdGlmIChjb3B5SXNBcnJheSkge1xuXHRcdFx0XHRcdFx0XHRjb3B5SXNBcnJheSA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRjbG9uZSA9IHNyYyAmJiAkLmlzQXJyYXkoc3JjKSA/IHNyYyA6IFtdO1xuXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRjbG9uZSA9IHNyYyAmJiAkLmlzUGxhaW5PYmplY3Qoc3JjKSA/IHNyYyA6IHt9O1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHR0YXJnZXRbbmFtZV0gPSAkLmV4dGVuZChkZWVwLCBjbG9uZSwgY29weSk7XG5cblx0XHRcdFx0XHR9IGVsc2UgaWYgKGNvcHkgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0dGFyZ2V0W25hbWVdID0gY29weTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGFyZ2V0O1xuXHR9O1xuXG5cdC8qIGpRdWVyeSAxLjQuMyAqL1xuXHQkLnF1ZXVlID0gZnVuY3Rpb24oZWxlbSwgdHlwZSwgZGF0YSkge1xuXHRcdGZ1bmN0aW9uICRtYWtlQXJyYXkoYXJyLCByZXN1bHRzKSB7XG5cdFx0XHR2YXIgcmV0ID0gcmVzdWx0cyB8fCBbXTtcblxuXHRcdFx0aWYgKGFycikge1xuXHRcdFx0XHRpZiAoaXNBcnJheWxpa2UoT2JqZWN0KGFycikpKSB7XG5cdFx0XHRcdFx0LyogJC5tZXJnZSAqL1xuXHRcdFx0XHRcdChmdW5jdGlvbihmaXJzdCwgc2Vjb25kKSB7XG5cdFx0XHRcdFx0XHR2YXIgbGVuID0gK3NlY29uZC5sZW5ndGgsXG5cdFx0XHRcdFx0XHRcdFx0aiA9IDAsXG5cdFx0XHRcdFx0XHRcdFx0aSA9IGZpcnN0Lmxlbmd0aDtcblxuXHRcdFx0XHRcdFx0d2hpbGUgKGogPCBsZW4pIHtcblx0XHRcdFx0XHRcdFx0Zmlyc3RbaSsrXSA9IHNlY29uZFtqKytdO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAobGVuICE9PSBsZW4pIHtcblx0XHRcdFx0XHRcdFx0d2hpbGUgKHNlY29uZFtqXSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRcdFx0Zmlyc3RbaSsrXSA9IHNlY29uZFtqKytdO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGZpcnN0Lmxlbmd0aCA9IGk7XG5cblx0XHRcdFx0XHRcdHJldHVybiBmaXJzdDtcblx0XHRcdFx0XHR9KShyZXQsIHR5cGVvZiBhcnIgPT09IFwic3RyaW5nXCIgPyBbYXJyXSA6IGFycik7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0W10ucHVzaC5jYWxsKHJldCwgYXJyKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcmV0O1xuXHRcdH1cblxuXHRcdGlmICghZWxlbSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHR5cGUgPSAodHlwZSB8fCBcImZ4XCIpICsgXCJxdWV1ZVwiO1xuXG5cdFx0dmFyIHEgPSAkLmRhdGEoZWxlbSwgdHlwZSk7XG5cblx0XHRpZiAoIWRhdGEpIHtcblx0XHRcdHJldHVybiBxIHx8IFtdO1xuXHRcdH1cblxuXHRcdGlmICghcSB8fCAkLmlzQXJyYXkoZGF0YSkpIHtcblx0XHRcdHEgPSAkLmRhdGEoZWxlbSwgdHlwZSwgJG1ha2VBcnJheShkYXRhKSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHEucHVzaChkYXRhKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcTtcblx0fTtcblxuXHQvKiBqUXVlcnkgMS40LjMgKi9cblx0JC5kZXF1ZXVlID0gZnVuY3Rpb24oZWxlbXMsIHR5cGUpIHtcblx0XHQvKiBDdXN0b206IEVtYmVkIGVsZW1lbnQgaXRlcmF0aW9uLiAqL1xuXHRcdCQuZWFjaChlbGVtcy5ub2RlVHlwZSA/IFtlbGVtc10gOiBlbGVtcywgZnVuY3Rpb24oaSwgZWxlbSkge1xuXHRcdFx0dHlwZSA9IHR5cGUgfHwgXCJmeFwiO1xuXG5cdFx0XHR2YXIgcXVldWUgPSAkLnF1ZXVlKGVsZW0sIHR5cGUpLFxuXHRcdFx0XHRcdGZuID0gcXVldWUuc2hpZnQoKTtcblxuXHRcdFx0aWYgKGZuID09PSBcImlucHJvZ3Jlc3NcIikge1xuXHRcdFx0XHRmbiA9IHF1ZXVlLnNoaWZ0KCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChmbikge1xuXHRcdFx0XHRpZiAodHlwZSA9PT0gXCJmeFwiKSB7XG5cdFx0XHRcdFx0cXVldWUudW5zaGlmdChcImlucHJvZ3Jlc3NcIik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmbi5jYWxsKGVsZW0sIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCQuZGVxdWV1ZShlbGVtLCB0eXBlKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cblx0LyoqKioqKioqKioqKioqKioqKlxuXHQgJC5mbiBNZXRob2RzXG5cdCAqKioqKioqKioqKioqKioqKiovXG5cblx0LyogalF1ZXJ5ICovXG5cdCQuZm4gPSAkLnByb3RvdHlwZSA9IHtcblx0XHRpbml0OiBmdW5jdGlvbihzZWxlY3Rvcikge1xuXHRcdFx0LyogSnVzdCByZXR1cm4gdGhlIGVsZW1lbnQgd3JhcHBlZCBpbnNpZGUgYW4gYXJyYXk7IGRvbid0IHByb2NlZWQgd2l0aCB0aGUgYWN0dWFsIGpRdWVyeSBub2RlIHdyYXBwaW5nIHByb2Nlc3MuICovXG5cdFx0XHRpZiAoc2VsZWN0b3Iubm9kZVR5cGUpIHtcblx0XHRcdFx0dGhpc1swXSA9IHNlbGVjdG9yO1xuXG5cdFx0XHRcdHJldHVybiB0aGlzO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiTm90IGEgRE9NIG5vZGUuXCIpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0b2Zmc2V0OiBmdW5jdGlvbigpIHtcblx0XHRcdC8qIGpRdWVyeSBhbHRlcmVkIGNvZGU6IERyb3BwZWQgZGlzY29ubmVjdGVkIERPTSBub2RlIGNoZWNraW5nLiAqL1xuXHRcdFx0dmFyIGJveCA9IHRoaXNbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0ID8gdGhpc1swXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSA6IHt0b3A6IDAsIGxlZnQ6IDB9O1xuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR0b3A6IGJveC50b3AgKyAod2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvY3VtZW50LnNjcm9sbFRvcCB8fCAwKSAtIChkb2N1bWVudC5jbGllbnRUb3AgfHwgMCksXG5cdFx0XHRcdGxlZnQ6IGJveC5sZWZ0ICsgKHdpbmRvdy5wYWdlWE9mZnNldCB8fCBkb2N1bWVudC5zY3JvbGxMZWZ0IHx8IDApIC0gKGRvY3VtZW50LmNsaWVudExlZnQgfHwgMClcblx0XHRcdH07XG5cdFx0fSxcblx0XHRwb3NpdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0XHQvKiBqUXVlcnkgKi9cblx0XHRcdGZ1bmN0aW9uIG9mZnNldFBhcmVudEZuKGVsZW0pIHtcblx0XHRcdFx0dmFyIG9mZnNldFBhcmVudCA9IGVsZW0ub2Zmc2V0UGFyZW50IHx8IGRvY3VtZW50O1xuXG5cdFx0XHRcdHdoaWxlIChvZmZzZXRQYXJlbnQgJiYgKG9mZnNldFBhcmVudC5ub2RlVHlwZS50b0xvd2VyQ2FzZSAhPT0gXCJodG1sXCIgJiYgb2Zmc2V0UGFyZW50LnN0eWxlLnBvc2l0aW9uID09PSBcInN0YXRpY1wiKSkge1xuXHRcdFx0XHRcdG9mZnNldFBhcmVudCA9IG9mZnNldFBhcmVudC5vZmZzZXRQYXJlbnQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gb2Zmc2V0UGFyZW50IHx8IGRvY3VtZW50O1xuXHRcdFx0fVxuXG5cdFx0XHQvKiBaZXB0byAqL1xuXHRcdFx0dmFyIGVsZW0gPSB0aGlzWzBdLFxuXHRcdFx0XHRcdG9mZnNldFBhcmVudCA9IG9mZnNldFBhcmVudEZuKGVsZW0pLFxuXHRcdFx0XHRcdG9mZnNldCA9IHRoaXMub2Zmc2V0KCksXG5cdFx0XHRcdFx0cGFyZW50T2Zmc2V0ID0gL14oPzpib2R5fGh0bWwpJC9pLnRlc3Qob2Zmc2V0UGFyZW50Lm5vZGVOYW1lKSA/IHt0b3A6IDAsIGxlZnQ6IDB9IDogJChvZmZzZXRQYXJlbnQpLm9mZnNldCgpO1xuXG5cdFx0XHRvZmZzZXQudG9wIC09IHBhcnNlRmxvYXQoZWxlbS5zdHlsZS5tYXJnaW5Ub3ApIHx8IDA7XG5cdFx0XHRvZmZzZXQubGVmdCAtPSBwYXJzZUZsb2F0KGVsZW0uc3R5bGUubWFyZ2luTGVmdCkgfHwgMDtcblxuXHRcdFx0aWYgKG9mZnNldFBhcmVudC5zdHlsZSkge1xuXHRcdFx0XHRwYXJlbnRPZmZzZXQudG9wICs9IHBhcnNlRmxvYXQob2Zmc2V0UGFyZW50LnN0eWxlLmJvcmRlclRvcFdpZHRoKSB8fCAwO1xuXHRcdFx0XHRwYXJlbnRPZmZzZXQubGVmdCArPSBwYXJzZUZsb2F0KG9mZnNldFBhcmVudC5zdHlsZS5ib3JkZXJMZWZ0V2lkdGgpIHx8IDA7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHRvcDogb2Zmc2V0LnRvcCAtIHBhcmVudE9mZnNldC50b3AsXG5cdFx0XHRcdGxlZnQ6IG9mZnNldC5sZWZ0IC0gcGFyZW50T2Zmc2V0LmxlZnRcblx0XHRcdH07XG5cdFx0fVxuXHR9O1xuXG5cdC8qKioqKioqKioqKioqKioqKioqKioqXG5cdCBQcml2YXRlIFZhcmlhYmxlc1xuXHQgKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQvKiBGb3IgJC5kYXRhKCkgKi9cblx0dmFyIGNhY2hlID0ge307XG5cdCQuZXhwYW5kbyA9IFwidmVsb2NpdHlcIiArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSk7XG5cdCQudXVpZCA9IDA7XG5cblx0LyogRm9yICQucXVldWUoKSAqL1xuXHR2YXIgY2xhc3MydHlwZSA9IHt9LFxuXHRcdFx0aGFzT3duID0gY2xhc3MydHlwZS5oYXNPd25Qcm9wZXJ0eSxcblx0XHRcdHRvU3RyaW5nID0gY2xhc3MydHlwZS50b1N0cmluZztcblxuXHR2YXIgdHlwZXMgPSBcIkJvb2xlYW4gTnVtYmVyIFN0cmluZyBGdW5jdGlvbiBBcnJheSBEYXRlIFJlZ0V4cCBPYmplY3QgRXJyb3JcIi5zcGxpdChcIiBcIik7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgdHlwZXMubGVuZ3RoOyBpKyspIHtcblx0XHRjbGFzczJ0eXBlW1wiW29iamVjdCBcIiArIHR5cGVzW2ldICsgXCJdXCJdID0gdHlwZXNbaV0udG9Mb3dlckNhc2UoKTtcblx0fVxuXG5cdC8qIE1ha2VzICQobm9kZSkgcG9zc2libGUsIHdpdGhvdXQgaGF2aW5nIHRvIGNhbGwgaW5pdC4gKi9cblx0JC5mbi5pbml0LnByb3RvdHlwZSA9ICQuZm47XG5cblx0LyogR2xvYmFsaXplIFZlbG9jaXR5IG9udG8gdGhlIHdpbmRvdywgYW5kIGFzc2lnbiBpdHMgVXRpbGl0aWVzIHByb3BlcnR5LiAqL1xuXHR3aW5kb3cuVmVsb2NpdHkgPSB7VXRpbGl0aWVzOiAkfTtcbn0pKHdpbmRvdyk7XG5cbi8qKioqKioqKioqKioqKioqKipcbiBWZWxvY2l0eS5qc1xuICoqKioqKioqKioqKioqKioqKi9cblxuKGZ1bmN0aW9uKGZhY3RvcnkpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cdC8qIENvbW1vbkpTIG1vZHVsZS4gKi9cblx0aWYgKHR5cGVvZiBtb2R1bGUgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSBcIm9iamVjdFwiKSB7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdFx0LyogQU1EIG1vZHVsZS4gKi9cblx0fSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuXHRcdGRlZmluZShmYWN0b3J5KTtcblx0XHQvKiBCcm93c2VyIGdsb2JhbHMuICovXG5cdH0gZWxzZSB7XG5cdFx0ZmFjdG9yeSgpO1xuXHR9XG59KGZ1bmN0aW9uKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblx0cmV0dXJuIGZ1bmN0aW9uKGdsb2JhbCwgd2luZG93LCBkb2N1bWVudCwgdW5kZWZpbmVkKSB7XG5cblx0XHQvKioqKioqKioqKioqKioqXG5cdFx0IFN1bW1hcnlcblx0XHQgKioqKioqKioqKioqKioqL1xuXG5cdFx0Lypcblx0XHQgLSBDU1M6IENTUyBzdGFjayB0aGF0IHdvcmtzIGluZGVwZW5kZW50bHkgZnJvbSB0aGUgcmVzdCBvZiBWZWxvY2l0eS5cblx0XHQgLSBhbmltYXRlKCk6IENvcmUgYW5pbWF0aW9uIG1ldGhvZCB0aGF0IGl0ZXJhdGVzIG92ZXIgdGhlIHRhcmdldGVkIGVsZW1lbnRzIGFuZCBxdWV1ZXMgdGhlIGluY29taW5nIGNhbGwgb250byBlYWNoIGVsZW1lbnQgaW5kaXZpZHVhbGx5LlxuXHRcdCAtIFByZS1RdWV1ZWluZzogUHJlcGFyZSB0aGUgZWxlbWVudCBmb3IgYW5pbWF0aW9uIGJ5IGluc3RhbnRpYXRpbmcgaXRzIGRhdGEgY2FjaGUgYW5kIHByb2Nlc3NpbmcgdGhlIGNhbGwncyBvcHRpb25zLlxuXHRcdCAtIFF1ZXVlaW5nOiBUaGUgbG9naWMgdGhhdCBydW5zIG9uY2UgdGhlIGNhbGwgaGFzIHJlYWNoZWQgaXRzIHBvaW50IG9mIGV4ZWN1dGlvbiBpbiB0aGUgZWxlbWVudCdzICQucXVldWUoKSBzdGFjay5cblx0XHQgTW9zdCBsb2dpYyBpcyBwbGFjZWQgaGVyZSB0byBhdm9pZCByaXNraW5nIGl0IGJlY29taW5nIHN0YWxlIChpZiB0aGUgZWxlbWVudCdzIHByb3BlcnRpZXMgaGF2ZSBjaGFuZ2VkKS5cblx0XHQgLSBQdXNoaW5nOiBDb25zb2xpZGF0aW9uIG9mIHRoZSB0d2VlbiBkYXRhIGZvbGxvd2VkIGJ5IGl0cyBwdXNoIG9udG8gdGhlIGdsb2JhbCBpbi1wcm9ncmVzcyBjYWxscyBjb250YWluZXIuXG5cdFx0IC0gdGljaygpOiBUaGUgc2luZ2xlIHJlcXVlc3RBbmltYXRpb25GcmFtZSBsb29wIHJlc3BvbnNpYmxlIGZvciB0d2VlbmluZyBhbGwgaW4tcHJvZ3Jlc3MgY2FsbHMuXG5cdFx0IC0gY29tcGxldGVDYWxsKCk6IEhhbmRsZXMgdGhlIGNsZWFudXAgcHJvY2VzcyBmb3IgZWFjaCBWZWxvY2l0eSBjYWxsLlxuXHRcdCAqL1xuXG5cdFx0LyoqKioqKioqKioqKioqKioqKioqKlxuXHRcdCBIZWxwZXIgRnVuY3Rpb25zXG5cdFx0ICoqKioqKioqKioqKioqKioqKioqKi9cblxuXHRcdC8qIElFIGRldGVjdGlvbi4gR2lzdDogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vanVsaWFuc2hhcGlyby85MDk4NjA5ICovXG5cdFx0dmFyIElFID0gKGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKGRvY3VtZW50LmRvY3VtZW50TW9kZSkge1xuXHRcdFx0XHRyZXR1cm4gZG9jdW1lbnQuZG9jdW1lbnRNb2RlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDc7IGkgPiA0OyBpLS0pIHtcblx0XHRcdFx0XHR2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuXHRcdFx0XHRcdGRpdi5pbm5lckhUTUwgPSBcIjwhLS1baWYgSUUgXCIgKyBpICsgXCJdPjxzcGFuPjwvc3Bhbj48IVtlbmRpZl0tLT5cIjtcblxuXHRcdFx0XHRcdGlmIChkaXYuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzcGFuXCIpLmxlbmd0aCkge1xuXHRcdFx0XHRcdFx0ZGl2ID0gbnVsbDtcblxuXHRcdFx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fSkoKTtcblxuXHRcdC8qIHJBRiBzaGltLiBHaXN0OiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9qdWxpYW5zaGFwaXJvLzk0OTc1MTMgKi9cblx0XHR2YXIgckFGU2hpbSA9IChmdW5jdGlvbigpIHtcblx0XHRcdHZhciB0aW1lTGFzdCA9IDA7XG5cblx0XHRcdHJldHVybiB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0XHRcdFx0dmFyIHRpbWVDdXJyZW50ID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKSxcblx0XHRcdFx0XHRcdHRpbWVEZWx0YTtcblxuXHRcdFx0XHQvKiBEeW5hbWljYWxseSBzZXQgZGVsYXkgb24gYSBwZXItdGljayBiYXNpcyB0byBtYXRjaCA2MGZwcy4gKi9cblx0XHRcdFx0LyogVGVjaG5pcXVlIGJ5IEVyaWsgTW9sbGVyLiBNSVQgbGljZW5zZTogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vcGF1bGlyaXNoLzE1Nzk2NzEgKi9cblx0XHRcdFx0dGltZURlbHRhID0gTWF0aC5tYXgoMCwgMTYgLSAodGltZUN1cnJlbnQgLSB0aW1lTGFzdCkpO1xuXHRcdFx0XHR0aW1lTGFzdCA9IHRpbWVDdXJyZW50ICsgdGltZURlbHRhO1xuXG5cdFx0XHRcdHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdGNhbGxiYWNrKHRpbWVDdXJyZW50ICsgdGltZURlbHRhKTtcblx0XHRcdFx0fSwgdGltZURlbHRhKTtcblx0XHRcdH07XG5cdFx0fSkoKTtcblxuXHRcdC8qIEFycmF5IGNvbXBhY3RpbmcuIENvcHlyaWdodCBMby1EYXNoLiBNSVQgTGljZW5zZTogaHR0cHM6Ly9naXRodWIuY29tL2xvZGFzaC9sb2Rhc2gvYmxvYi9tYXN0ZXIvTElDRU5TRS50eHQgKi9cblx0XHRmdW5jdGlvbiBjb21wYWN0U3BhcnNlQXJyYXkoYXJyYXkpIHtcblx0XHRcdHZhciBpbmRleCA9IC0xLFxuXHRcdFx0XHRcdGxlbmd0aCA9IGFycmF5ID8gYXJyYXkubGVuZ3RoIDogMCxcblx0XHRcdFx0XHRyZXN1bHQgPSBbXTtcblxuXHRcdFx0d2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcblx0XHRcdFx0dmFyIHZhbHVlID0gYXJyYXlbaW5kZXhdO1xuXG5cdFx0XHRcdGlmICh2YWx1ZSkge1xuXHRcdFx0XHRcdHJlc3VsdC5wdXNoKHZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHNhbml0aXplRWxlbWVudHMoZWxlbWVudHMpIHtcblx0XHRcdC8qIFVud3JhcCBqUXVlcnkvWmVwdG8gb2JqZWN0cy4gKi9cblx0XHRcdGlmIChUeXBlLmlzV3JhcHBlZChlbGVtZW50cykpIHtcblx0XHRcdFx0ZWxlbWVudHMgPSBbXS5zbGljZS5jYWxsKGVsZW1lbnRzKTtcblx0XHRcdFx0LyogV3JhcCBhIHNpbmdsZSBlbGVtZW50IGluIGFuIGFycmF5IHNvIHRoYXQgJC5lYWNoKCkgY2FuIGl0ZXJhdGUgd2l0aCB0aGUgZWxlbWVudCBpbnN0ZWFkIG9mIGl0cyBub2RlJ3MgY2hpbGRyZW4uICovXG5cdFx0XHR9IGVsc2UgaWYgKFR5cGUuaXNOb2RlKGVsZW1lbnRzKSkge1xuXHRcdFx0XHRlbGVtZW50cyA9IFtlbGVtZW50c107XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBlbGVtZW50cztcblx0XHR9XG5cblx0XHR2YXIgVHlwZSA9IHtcblx0XHRcdGlzU3RyaW5nOiBmdW5jdGlvbih2YXJpYWJsZSkge1xuXHRcdFx0XHRyZXR1cm4gKHR5cGVvZiB2YXJpYWJsZSA9PT0gXCJzdHJpbmdcIik7XG5cdFx0XHR9LFxuXHRcdFx0aXNBcnJheTogQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbih2YXJpYWJsZSkge1xuXHRcdFx0XHRyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhcmlhYmxlKSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiO1xuXHRcdFx0fSxcblx0XHRcdGlzRnVuY3Rpb246IGZ1bmN0aW9uKHZhcmlhYmxlKSB7XG5cdFx0XHRcdHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFyaWFibGUpID09PSBcIltvYmplY3QgRnVuY3Rpb25dXCI7XG5cdFx0XHR9LFxuXHRcdFx0aXNOb2RlOiBmdW5jdGlvbih2YXJpYWJsZSkge1xuXHRcdFx0XHRyZXR1cm4gdmFyaWFibGUgJiYgdmFyaWFibGUubm9kZVR5cGU7XG5cdFx0XHR9LFxuXHRcdFx0LyogQ29weXJpZ2h0IE1hcnRpbiBCb2htLiBNSVQgTGljZW5zZTogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vVG9tYWxhay84MThhNzhhMjI2YTA3MzhlYWFkZSAqL1xuXHRcdFx0aXNOb2RlTGlzdDogZnVuY3Rpb24odmFyaWFibGUpIHtcblx0XHRcdFx0cmV0dXJuIHR5cGVvZiB2YXJpYWJsZSA9PT0gXCJvYmplY3RcIiAmJlxuXHRcdFx0XHRcdFx0L15cXFtvYmplY3QgKEhUTUxDb2xsZWN0aW9ufE5vZGVMaXN0fE9iamVjdClcXF0kLy50ZXN0KE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YXJpYWJsZSkpICYmXG5cdFx0XHRcdFx0XHR2YXJpYWJsZS5sZW5ndGggIT09IHVuZGVmaW5lZCAmJlxuXHRcdFx0XHRcdFx0KHZhcmlhYmxlLmxlbmd0aCA9PT0gMCB8fCAodHlwZW9mIHZhcmlhYmxlWzBdID09PSBcIm9iamVjdFwiICYmIHZhcmlhYmxlWzBdLm5vZGVUeXBlID4gMCkpO1xuXHRcdFx0fSxcblx0XHRcdC8qIERldGVybWluZSBpZiB2YXJpYWJsZSBpcyBhIHdyYXBwZWQgalF1ZXJ5IG9yIFplcHRvIGVsZW1lbnQuICovXG5cdFx0XHRpc1dyYXBwZWQ6IGZ1bmN0aW9uKHZhcmlhYmxlKSB7XG5cdFx0XHRcdHJldHVybiB2YXJpYWJsZSAmJiAodmFyaWFibGUuanF1ZXJ5IHx8ICh3aW5kb3cuWmVwdG8gJiYgd2luZG93LlplcHRvLnplcHRvLmlzWih2YXJpYWJsZSkpKTtcblx0XHRcdH0sXG5cdFx0XHRpc1NWRzogZnVuY3Rpb24odmFyaWFibGUpIHtcblx0XHRcdFx0cmV0dXJuIHdpbmRvdy5TVkdFbGVtZW50ICYmICh2YXJpYWJsZSBpbnN0YW5jZW9mIHdpbmRvdy5TVkdFbGVtZW50KTtcblx0XHRcdH0sXG5cdFx0XHRpc0VtcHR5T2JqZWN0OiBmdW5jdGlvbih2YXJpYWJsZSkge1xuXHRcdFx0XHRmb3IgKHZhciBuYW1lIGluIHZhcmlhYmxlKSB7XG5cdFx0XHRcdFx0aWYgKHZhcmlhYmxlLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qKioqKioqKioqKioqKioqKlxuXHRcdCBEZXBlbmRlbmNpZXNcblx0XHQgKioqKioqKioqKioqKioqKiovXG5cblx0XHR2YXIgJCxcblx0XHRcdFx0aXNKUXVlcnkgPSBmYWxzZTtcblxuXHRcdGlmIChnbG9iYWwuZm4gJiYgZ2xvYmFsLmZuLmpxdWVyeSkge1xuXHRcdFx0JCA9IGdsb2JhbDtcblx0XHRcdGlzSlF1ZXJ5ID0gdHJ1ZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0JCA9IHdpbmRvdy5WZWxvY2l0eS5VdGlsaXRpZXM7XG5cdFx0fVxuXG5cdFx0aWYgKElFIDw9IDggJiYgIWlzSlF1ZXJ5KSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJWZWxvY2l0eTogSUU4IGFuZCBiZWxvdyByZXF1aXJlIGpRdWVyeSB0byBiZSBsb2FkZWQgYmVmb3JlIFZlbG9jaXR5LlwiKTtcblx0XHR9IGVsc2UgaWYgKElFIDw9IDcpIHtcblx0XHRcdC8qIFJldmVydCB0byBqUXVlcnkncyAkLmFuaW1hdGUoKSwgYW5kIGxvc2UgVmVsb2NpdHkncyBleHRyYSBmZWF0dXJlcy4gKi9cblx0XHRcdGpRdWVyeS5mbi52ZWxvY2l0eSA9IGpRdWVyeS5mbi5hbmltYXRlO1xuXG5cdFx0XHQvKiBOb3cgdGhhdCAkLmZuLnZlbG9jaXR5IGlzIGFsaWFzZWQsIGFib3J0IHRoaXMgVmVsb2NpdHkgZGVjbGFyYXRpb24uICovXG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0LyoqKioqKioqKioqKioqKioqXG5cdFx0IENvbnN0YW50c1xuXHRcdCAqKioqKioqKioqKioqKioqKi9cblxuXHRcdHZhciBEVVJBVElPTl9ERUZBVUxUID0gNDAwLFxuXHRcdFx0XHRFQVNJTkdfREVGQVVMVCA9IFwic3dpbmdcIjtcblxuXHRcdC8qKioqKioqKioqKioqXG5cdFx0IFN0YXRlXG5cdFx0ICoqKioqKioqKioqKiovXG5cblx0XHR2YXIgVmVsb2NpdHkgPSB7XG5cdFx0XHQvKiBDb250YWluZXIgZm9yIHBhZ2Utd2lkZSBWZWxvY2l0eSBzdGF0ZSBkYXRhLiAqL1xuXHRcdFx0U3RhdGU6IHtcblx0XHRcdFx0LyogRGV0ZWN0IG1vYmlsZSBkZXZpY2VzIHRvIGRldGVybWluZSBpZiBtb2JpbGVIQSBzaG91bGQgYmUgdHVybmVkIG9uLiAqL1xuXHRcdFx0XHRpc01vYmlsZTogL0FuZHJvaWR8d2ViT1N8aVBob25lfGlQYWR8aVBvZHxCbGFja0JlcnJ5fElFTW9iaWxlfE9wZXJhIE1pbmkvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpLFxuXHRcdFx0XHQvKiBUaGUgbW9iaWxlSEEgb3B0aW9uJ3MgYmVoYXZpb3IgY2hhbmdlcyBvbiBvbGRlciBBbmRyb2lkIGRldmljZXMgKEdpbmdlcmJyZWFkLCB2ZXJzaW9ucyAyLjMuMy0yLjMuNykuICovXG5cdFx0XHRcdGlzQW5kcm9pZDogL0FuZHJvaWQvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpLFxuXHRcdFx0XHRpc0dpbmdlcmJyZWFkOiAvQW5kcm9pZCAyXFwuM1xcLlszLTddL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSxcblx0XHRcdFx0aXNDaHJvbWU6IHdpbmRvdy5jaHJvbWUsXG5cdFx0XHRcdGlzRmlyZWZveDogL0ZpcmVmb3gvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpLFxuXHRcdFx0XHQvKiBDcmVhdGUgYSBjYWNoZWQgZWxlbWVudCBmb3IgcmUtdXNlIHdoZW4gY2hlY2tpbmcgZm9yIENTUyBwcm9wZXJ0eSBwcmVmaXhlcy4gKi9cblx0XHRcdFx0cHJlZml4RWxlbWVudDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSxcblx0XHRcdFx0LyogQ2FjaGUgZXZlcnkgcHJlZml4IG1hdGNoIHRvIGF2b2lkIHJlcGVhdGluZyBsb29rdXBzLiAqL1xuXHRcdFx0XHRwcmVmaXhNYXRjaGVzOiB7fSxcblx0XHRcdFx0LyogQ2FjaGUgdGhlIGFuY2hvciB1c2VkIGZvciBhbmltYXRpbmcgd2luZG93IHNjcm9sbGluZy4gKi9cblx0XHRcdFx0c2Nyb2xsQW5jaG9yOiBudWxsLFxuXHRcdFx0XHQvKiBDYWNoZSB0aGUgYnJvd3Nlci1zcGVjaWZpYyBwcm9wZXJ0eSBuYW1lcyBhc3NvY2lhdGVkIHdpdGggdGhlIHNjcm9sbCBhbmNob3IuICovXG5cdFx0XHRcdHNjcm9sbFByb3BlcnR5TGVmdDogbnVsbCxcblx0XHRcdFx0c2Nyb2xsUHJvcGVydHlUb3A6IG51bGwsXG5cdFx0XHRcdC8qIEtlZXAgdHJhY2sgb2Ygd2hldGhlciBvdXIgUkFGIHRpY2sgaXMgcnVubmluZy4gKi9cblx0XHRcdFx0aXNUaWNraW5nOiBmYWxzZSxcblx0XHRcdFx0LyogQ29udGFpbmVyIGZvciBldmVyeSBpbi1wcm9ncmVzcyBjYWxsIHRvIFZlbG9jaXR5LiAqL1xuXHRcdFx0XHRjYWxsczogW11cblx0XHRcdH0sXG5cdFx0XHQvKiBWZWxvY2l0eSdzIGN1c3RvbSBDU1Mgc3RhY2suIE1hZGUgZ2xvYmFsIGZvciB1bml0IHRlc3RpbmcuICovXG5cdFx0XHRDU1M6IHsgLyogRGVmaW5lZCBiZWxvdy4gKi99LFxuXHRcdFx0LyogQSBzaGltIG9mIHRoZSBqUXVlcnkgdXRpbGl0eSBmdW5jdGlvbnMgdXNlZCBieSBWZWxvY2l0eSAtLSBwcm92aWRlZCBieSBWZWxvY2l0eSdzIG9wdGlvbmFsIGpRdWVyeSBzaGltLiAqL1xuXHRcdFx0VXRpbGl0aWVzOiAkLFxuXHRcdFx0LyogQ29udGFpbmVyIGZvciB0aGUgdXNlcidzIGN1c3RvbSBhbmltYXRpb24gcmVkaXJlY3RzIHRoYXQgYXJlIHJlZmVyZW5jZWQgYnkgbmFtZSBpbiBwbGFjZSBvZiB0aGUgcHJvcGVydGllcyBtYXAgYXJndW1lbnQuICovXG5cdFx0XHRSZWRpcmVjdHM6IHsgLyogTWFudWFsbHkgcmVnaXN0ZXJlZCBieSB0aGUgdXNlci4gKi99LFxuXHRcdFx0RWFzaW5nczogeyAvKiBEZWZpbmVkIGJlbG93LiAqL30sXG5cdFx0XHQvKiBBdHRlbXB0IHRvIHVzZSBFUzYgUHJvbWlzZXMgYnkgZGVmYXVsdC4gVXNlcnMgY2FuIG92ZXJyaWRlIHRoaXMgd2l0aCBhIHRoaXJkLXBhcnR5IHByb21pc2VzIGxpYnJhcnkuICovXG5cdFx0XHRQcm9taXNlOiB3aW5kb3cuUHJvbWlzZSxcblx0XHRcdC8qIFZlbG9jaXR5IG9wdGlvbiBkZWZhdWx0cywgd2hpY2ggY2FuIGJlIG92ZXJyaWRlbiBieSB0aGUgdXNlci4gKi9cblx0XHRcdGRlZmF1bHRzOiB7XG5cdFx0XHRcdHF1ZXVlOiBcIlwiLFxuXHRcdFx0XHRkdXJhdGlvbjogRFVSQVRJT05fREVGQVVMVCxcblx0XHRcdFx0ZWFzaW5nOiBFQVNJTkdfREVGQVVMVCxcblx0XHRcdFx0YmVnaW46IHVuZGVmaW5lZCxcblx0XHRcdFx0Y29tcGxldGU6IHVuZGVmaW5lZCxcblx0XHRcdFx0cHJvZ3Jlc3M6IHVuZGVmaW5lZCxcblx0XHRcdFx0ZGlzcGxheTogdW5kZWZpbmVkLFxuXHRcdFx0XHR2aXNpYmlsaXR5OiB1bmRlZmluZWQsXG5cdFx0XHRcdGxvb3A6IGZhbHNlLFxuXHRcdFx0XHRkZWxheTogZmFsc2UsXG5cdFx0XHRcdG1vYmlsZUhBOiB0cnVlLFxuXHRcdFx0XHQvKiBBZHZhbmNlZDogU2V0IHRvIGZhbHNlIHRvIHByZXZlbnQgcHJvcGVydHkgdmFsdWVzIGZyb20gYmVpbmcgY2FjaGVkIGJldHdlZW4gY29uc2VjdXRpdmUgVmVsb2NpdHktaW5pdGlhdGVkIGNoYWluIGNhbGxzLiAqL1xuXHRcdFx0XHRfY2FjaGVWYWx1ZXM6IHRydWVcblx0XHRcdH0sXG5cdFx0XHQvKiBBIGRlc2lnbiBnb2FsIG9mIFZlbG9jaXR5IGlzIHRvIGNhY2hlIGRhdGEgd2hlcmV2ZXIgcG9zc2libGUgaW4gb3JkZXIgdG8gYXZvaWQgRE9NIHJlcXVlcnlpbmcuIEFjY29yZGluZ2x5LCBlYWNoIGVsZW1lbnQgaGFzIGEgZGF0YSBjYWNoZS4gKi9cblx0XHRcdGluaXQ6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0XHRcdFx0JC5kYXRhKGVsZW1lbnQsIFwidmVsb2NpdHlcIiwge1xuXHRcdFx0XHRcdC8qIFN0b3JlIHdoZXRoZXIgdGhpcyBpcyBhbiBTVkcgZWxlbWVudCwgc2luY2UgaXRzIHByb3BlcnRpZXMgYXJlIHJldHJpZXZlZCBhbmQgdXBkYXRlZCBkaWZmZXJlbnRseSB0aGFuIHN0YW5kYXJkIEhUTUwgZWxlbWVudHMuICovXG5cdFx0XHRcdFx0aXNTVkc6IFR5cGUuaXNTVkcoZWxlbWVudCksXG5cdFx0XHRcdFx0LyogS2VlcCB0cmFjayBvZiB3aGV0aGVyIHRoZSBlbGVtZW50IGlzIGN1cnJlbnRseSBiZWluZyBhbmltYXRlZCBieSBWZWxvY2l0eS5cblx0XHRcdFx0XHQgVGhpcyBpcyB1c2VkIHRvIGVuc3VyZSB0aGF0IHByb3BlcnR5IHZhbHVlcyBhcmUgbm90IHRyYW5zZmVycmVkIGJldHdlZW4gbm9uLWNvbnNlY3V0aXZlIChzdGFsZSkgY2FsbHMuICovXG5cdFx0XHRcdFx0aXNBbmltYXRpbmc6IGZhbHNlLFxuXHRcdFx0XHRcdC8qIEEgcmVmZXJlbmNlIHRvIHRoZSBlbGVtZW50J3MgbGl2ZSBjb21wdXRlZFN0eWxlIG9iamVjdC4gTGVhcm4gbW9yZSBoZXJlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9kb2NzL1dlYi9BUEkvd2luZG93LmdldENvbXB1dGVkU3R5bGUgKi9cblx0XHRcdFx0XHRjb21wdXRlZFN0eWxlOiBudWxsLFxuXHRcdFx0XHRcdC8qIFR3ZWVuIGRhdGEgaXMgY2FjaGVkIGZvciBlYWNoIGFuaW1hdGlvbiBvbiB0aGUgZWxlbWVudCBzbyB0aGF0IGRhdGEgY2FuIGJlIHBhc3NlZCBhY3Jvc3MgY2FsbHMgLS1cblx0XHRcdFx0XHQgaW4gcGFydGljdWxhciwgZW5kIHZhbHVlcyBhcmUgdXNlZCBhcyBzdWJzZXF1ZW50IHN0YXJ0IHZhbHVlcyBpbiBjb25zZWN1dGl2ZSBWZWxvY2l0eSBjYWxscy4gKi9cblx0XHRcdFx0XHR0d2VlbnNDb250YWluZXI6IG51bGwsXG5cdFx0XHRcdFx0LyogVGhlIGZ1bGwgcm9vdCBwcm9wZXJ0eSB2YWx1ZXMgb2YgZWFjaCBDU1MgaG9vayBiZWluZyBhbmltYXRlZCBvbiB0aGlzIGVsZW1lbnQgYXJlIGNhY2hlZCBzbyB0aGF0OlxuXHRcdFx0XHRcdCAxKSBDb25jdXJyZW50bHktYW5pbWF0aW5nIGhvb2tzIHNoYXJpbmcgdGhlIHNhbWUgcm9vdCBjYW4gaGF2ZSB0aGVpciByb290IHZhbHVlcycgbWVyZ2VkIGludG8gb25lIHdoaWxlIHR3ZWVuaW5nLlxuXHRcdFx0XHRcdCAyKSBQb3N0LWhvb2staW5qZWN0aW9uIHJvb3QgdmFsdWVzIGNhbiBiZSB0cmFuc2ZlcnJlZCBvdmVyIHRvIGNvbnNlY3V0aXZlbHkgY2hhaW5lZCBWZWxvY2l0eSBjYWxscyBhcyBzdGFydGluZyByb290IHZhbHVlcy4gKi9cblx0XHRcdFx0XHRyb290UHJvcGVydHlWYWx1ZUNhY2hlOiB7fSxcblx0XHRcdFx0XHQvKiBBIGNhY2hlIGZvciB0cmFuc2Zvcm0gdXBkYXRlcywgd2hpY2ggbXVzdCBiZSBtYW51YWxseSBmbHVzaGVkIHZpYSBDU1MuZmx1c2hUcmFuc2Zvcm1DYWNoZSgpLiAqL1xuXHRcdFx0XHRcdHRyYW5zZm9ybUNhY2hlOiB7fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0sXG5cdFx0XHQvKiBBIHBhcmFsbGVsIHRvIGpRdWVyeSdzICQuY3NzKCksIHVzZWQgZm9yIGdldHRpbmcvc2V0dGluZyBWZWxvY2l0eSdzIGhvb2tlZCBDU1MgcHJvcGVydGllcy4gKi9cblx0XHRcdGhvb2s6IG51bGwsIC8qIERlZmluZWQgYmVsb3cuICovXG5cdFx0XHQvKiBWZWxvY2l0eS13aWRlIGFuaW1hdGlvbiB0aW1lIHJlbWFwcGluZyBmb3IgdGVzdGluZyBwdXJwb3Nlcy4gKi9cblx0XHRcdG1vY2s6IGZhbHNlLFxuXHRcdFx0dmVyc2lvbjoge21ham9yOiAxLCBtaW5vcjogMywgcGF0Y2g6IDF9LFxuXHRcdFx0LyogU2V0IHRvIDEgb3IgMiAobW9zdCB2ZXJib3NlKSB0byBvdXRwdXQgZGVidWcgaW5mbyB0byBjb25zb2xlLiAqL1xuXHRcdFx0ZGVidWc6IGZhbHNlXG5cdFx0fTtcblxuXHRcdC8qIFJldHJpZXZlIHRoZSBhcHByb3ByaWF0ZSBzY3JvbGwgYW5jaG9yIGFuZCBwcm9wZXJ0eSBuYW1lIGZvciB0aGUgYnJvd3NlcjogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dpbmRvdy5zY3JvbGxZICovXG5cdFx0aWYgKHdpbmRvdy5wYWdlWU9mZnNldCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRWZWxvY2l0eS5TdGF0ZS5zY3JvbGxBbmNob3IgPSB3aW5kb3c7XG5cdFx0XHRWZWxvY2l0eS5TdGF0ZS5zY3JvbGxQcm9wZXJ0eUxlZnQgPSBcInBhZ2VYT2Zmc2V0XCI7XG5cdFx0XHRWZWxvY2l0eS5TdGF0ZS5zY3JvbGxQcm9wZXJ0eVRvcCA9IFwicGFnZVlPZmZzZXRcIjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0VmVsb2NpdHkuU3RhdGUuc2Nyb2xsQW5jaG9yID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IGRvY3VtZW50LmJvZHkucGFyZW50Tm9kZSB8fCBkb2N1bWVudC5ib2R5O1xuXHRcdFx0VmVsb2NpdHkuU3RhdGUuc2Nyb2xsUHJvcGVydHlMZWZ0ID0gXCJzY3JvbGxMZWZ0XCI7XG5cdFx0XHRWZWxvY2l0eS5TdGF0ZS5zY3JvbGxQcm9wZXJ0eVRvcCA9IFwic2Nyb2xsVG9wXCI7XG5cdFx0fVxuXG5cdFx0LyogU2hvcnRoYW5kIGFsaWFzIGZvciBqUXVlcnkncyAkLmRhdGEoKSB1dGlsaXR5LiAqL1xuXHRcdGZ1bmN0aW9uIERhdGEoZWxlbWVudCkge1xuXHRcdFx0LyogSGFyZGNvZGUgYSByZWZlcmVuY2UgdG8gdGhlIHBsdWdpbiBuYW1lLiAqL1xuXHRcdFx0dmFyIHJlc3BvbnNlID0gJC5kYXRhKGVsZW1lbnQsIFwidmVsb2NpdHlcIik7XG5cblx0XHRcdC8qIGpRdWVyeSA8PTEuNC4yIHJldHVybnMgbnVsbCBpbnN0ZWFkIG9mIHVuZGVmaW5lZCB3aGVuIG5vIG1hdGNoIGlzIGZvdW5kLiBXZSBub3JtYWxpemUgdGhpcyBiZWhhdmlvci4gKi9cblx0XHRcdHJldHVybiByZXNwb25zZSA9PT0gbnVsbCA/IHVuZGVmaW5lZCA6IHJlc3BvbnNlO1xuXHRcdH1cblxuXHRcdC8qKioqKioqKioqKioqKlxuXHRcdCBFYXNpbmdcblx0XHQgKioqKioqKioqKioqKiovXG5cblx0XHQvKiBTdGVwIGVhc2luZyBnZW5lcmF0b3IuICovXG5cdFx0ZnVuY3Rpb24gZ2VuZXJhdGVTdGVwKHN0ZXBzKSB7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24ocCkge1xuXHRcdFx0XHRyZXR1cm4gTWF0aC5yb3VuZChwICogc3RlcHMpICogKDEgLyBzdGVwcyk7XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdC8qIEJlemllciBjdXJ2ZSBmdW5jdGlvbiBnZW5lcmF0b3IuIENvcHlyaWdodCBHYWV0YW4gUmVuYXVkZWF1LiBNSVQgTGljZW5zZTogaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9NSVRfTGljZW5zZSAqL1xuXHRcdGZ1bmN0aW9uIGdlbmVyYXRlQmV6aWVyKG1YMSwgbVkxLCBtWDIsIG1ZMikge1xuXHRcdFx0dmFyIE5FV1RPTl9JVEVSQVRJT05TID0gNCxcblx0XHRcdFx0XHRORVdUT05fTUlOX1NMT1BFID0gMC4wMDEsXG5cdFx0XHRcdFx0U1VCRElWSVNJT05fUFJFQ0lTSU9OID0gMC4wMDAwMDAxLFxuXHRcdFx0XHRcdFNVQkRJVklTSU9OX01BWF9JVEVSQVRJT05TID0gMTAsXG5cdFx0XHRcdFx0a1NwbGluZVRhYmxlU2l6ZSA9IDExLFxuXHRcdFx0XHRcdGtTYW1wbGVTdGVwU2l6ZSA9IDEuMCAvIChrU3BsaW5lVGFibGVTaXplIC0gMS4wKSxcblx0XHRcdFx0XHRmbG9hdDMyQXJyYXlTdXBwb3J0ZWQgPSBcIkZsb2F0MzJBcnJheVwiIGluIHdpbmRvdztcblxuXHRcdFx0LyogTXVzdCBjb250YWluIGZvdXIgYXJndW1lbnRzLiAqL1xuXHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggIT09IDQpIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHQvKiBBcmd1bWVudHMgbXVzdCBiZSBudW1iZXJzLiAqL1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCA0OyArK2kpIHtcblx0XHRcdFx0aWYgKHR5cGVvZiBhcmd1bWVudHNbaV0gIT09IFwibnVtYmVyXCIgfHwgaXNOYU4oYXJndW1lbnRzW2ldKSB8fCAhaXNGaW5pdGUoYXJndW1lbnRzW2ldKSkge1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvKiBYIHZhbHVlcyBtdXN0IGJlIGluIHRoZSBbMCwgMV0gcmFuZ2UuICovXG5cdFx0XHRtWDEgPSBNYXRoLm1pbihtWDEsIDEpO1xuXHRcdFx0bVgyID0gTWF0aC5taW4obVgyLCAxKTtcblx0XHRcdG1YMSA9IE1hdGgubWF4KG1YMSwgMCk7XG5cdFx0XHRtWDIgPSBNYXRoLm1heChtWDIsIDApO1xuXG5cdFx0XHR2YXIgbVNhbXBsZVZhbHVlcyA9IGZsb2F0MzJBcnJheVN1cHBvcnRlZCA/IG5ldyBGbG9hdDMyQXJyYXkoa1NwbGluZVRhYmxlU2l6ZSkgOiBuZXcgQXJyYXkoa1NwbGluZVRhYmxlU2l6ZSk7XG5cblx0XHRcdGZ1bmN0aW9uIEEoYUExLCBhQTIpIHtcblx0XHRcdFx0cmV0dXJuIDEuMCAtIDMuMCAqIGFBMiArIDMuMCAqIGFBMTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIEIoYUExLCBhQTIpIHtcblx0XHRcdFx0cmV0dXJuIDMuMCAqIGFBMiAtIDYuMCAqIGFBMTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIEMoYUExKSB7XG5cdFx0XHRcdHJldHVybiAzLjAgKiBhQTE7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIGNhbGNCZXppZXIoYVQsIGFBMSwgYUEyKSB7XG5cdFx0XHRcdHJldHVybiAoKEEoYUExLCBhQTIpICogYVQgKyBCKGFBMSwgYUEyKSkgKiBhVCArIEMoYUExKSkgKiBhVDtcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gZ2V0U2xvcGUoYVQsIGFBMSwgYUEyKSB7XG5cdFx0XHRcdHJldHVybiAzLjAgKiBBKGFBMSwgYUEyKSAqIGFUICogYVQgKyAyLjAgKiBCKGFBMSwgYUEyKSAqIGFUICsgQyhhQTEpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBuZXd0b25SYXBoc29uSXRlcmF0ZShhWCwgYUd1ZXNzVCkge1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IE5FV1RPTl9JVEVSQVRJT05TOyArK2kpIHtcblx0XHRcdFx0XHR2YXIgY3VycmVudFNsb3BlID0gZ2V0U2xvcGUoYUd1ZXNzVCwgbVgxLCBtWDIpO1xuXG5cdFx0XHRcdFx0aWYgKGN1cnJlbnRTbG9wZSA9PT0gMC4wKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gYUd1ZXNzVDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR2YXIgY3VycmVudFggPSBjYWxjQmV6aWVyKGFHdWVzc1QsIG1YMSwgbVgyKSAtIGFYO1xuXHRcdFx0XHRcdGFHdWVzc1QgLT0gY3VycmVudFggLyBjdXJyZW50U2xvcGU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gYUd1ZXNzVDtcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gY2FsY1NhbXBsZVZhbHVlcygpIHtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBrU3BsaW5lVGFibGVTaXplOyArK2kpIHtcblx0XHRcdFx0XHRtU2FtcGxlVmFsdWVzW2ldID0gY2FsY0JlemllcihpICoga1NhbXBsZVN0ZXBTaXplLCBtWDEsIG1YMik7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gYmluYXJ5U3ViZGl2aWRlKGFYLCBhQSwgYUIpIHtcblx0XHRcdFx0dmFyIGN1cnJlbnRYLCBjdXJyZW50VCwgaSA9IDA7XG5cblx0XHRcdFx0ZG8ge1xuXHRcdFx0XHRcdGN1cnJlbnRUID0gYUEgKyAoYUIgLSBhQSkgLyAyLjA7XG5cdFx0XHRcdFx0Y3VycmVudFggPSBjYWxjQmV6aWVyKGN1cnJlbnRULCBtWDEsIG1YMikgLSBhWDtcblx0XHRcdFx0XHRpZiAoY3VycmVudFggPiAwLjApIHtcblx0XHRcdFx0XHRcdGFCID0gY3VycmVudFQ7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGFBID0gY3VycmVudFQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IHdoaWxlIChNYXRoLmFicyhjdXJyZW50WCkgPiBTVUJESVZJU0lPTl9QUkVDSVNJT04gJiYgKytpIDwgU1VCRElWSVNJT05fTUFYX0lURVJBVElPTlMpO1xuXG5cdFx0XHRcdHJldHVybiBjdXJyZW50VDtcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gZ2V0VEZvclgoYVgpIHtcblx0XHRcdFx0dmFyIGludGVydmFsU3RhcnQgPSAwLjAsXG5cdFx0XHRcdFx0XHRjdXJyZW50U2FtcGxlID0gMSxcblx0XHRcdFx0XHRcdGxhc3RTYW1wbGUgPSBrU3BsaW5lVGFibGVTaXplIC0gMTtcblxuXHRcdFx0XHRmb3IgKDsgY3VycmVudFNhbXBsZSAhPT0gbGFzdFNhbXBsZSAmJiBtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdIDw9IGFYOyArK2N1cnJlbnRTYW1wbGUpIHtcblx0XHRcdFx0XHRpbnRlcnZhbFN0YXJ0ICs9IGtTYW1wbGVTdGVwU2l6ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC0tY3VycmVudFNhbXBsZTtcblxuXHRcdFx0XHR2YXIgZGlzdCA9IChhWCAtIG1TYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0pIC8gKG1TYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZSArIDFdIC0gbVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSksXG5cdFx0XHRcdFx0XHRndWVzc0ZvclQgPSBpbnRlcnZhbFN0YXJ0ICsgZGlzdCAqIGtTYW1wbGVTdGVwU2l6ZSxcblx0XHRcdFx0XHRcdGluaXRpYWxTbG9wZSA9IGdldFNsb3BlKGd1ZXNzRm9yVCwgbVgxLCBtWDIpO1xuXG5cdFx0XHRcdGlmIChpbml0aWFsU2xvcGUgPj0gTkVXVE9OX01JTl9TTE9QRSkge1xuXHRcdFx0XHRcdHJldHVybiBuZXd0b25SYXBoc29uSXRlcmF0ZShhWCwgZ3Vlc3NGb3JUKTtcblx0XHRcdFx0fSBlbHNlIGlmIChpbml0aWFsU2xvcGUgPT09IDAuMCkge1xuXHRcdFx0XHRcdHJldHVybiBndWVzc0ZvclQ7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIGJpbmFyeVN1YmRpdmlkZShhWCwgaW50ZXJ2YWxTdGFydCwgaW50ZXJ2YWxTdGFydCArIGtTYW1wbGVTdGVwU2l6ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0dmFyIF9wcmVjb21wdXRlZCA9IGZhbHNlO1xuXG5cdFx0XHRmdW5jdGlvbiBwcmVjb21wdXRlKCkge1xuXHRcdFx0XHRfcHJlY29tcHV0ZWQgPSB0cnVlO1xuXHRcdFx0XHRpZiAobVgxICE9PSBtWTEgfHwgbVgyICE9PSBtWTIpIHtcblx0XHRcdFx0XHRjYWxjU2FtcGxlVmFsdWVzKCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0dmFyIGYgPSBmdW5jdGlvbihhWCkge1xuXHRcdFx0XHRpZiAoIV9wcmVjb21wdXRlZCkge1xuXHRcdFx0XHRcdHByZWNvbXB1dGUoKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAobVgxID09PSBtWTEgJiYgbVgyID09PSBtWTIpIHtcblx0XHRcdFx0XHRyZXR1cm4gYVg7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGFYID09PSAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuIDA7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKGFYID09PSAxKSB7XG5cdFx0XHRcdFx0cmV0dXJuIDE7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gY2FsY0JlemllcihnZXRURm9yWChhWCksIG1ZMSwgbVkyKTtcblx0XHRcdH07XG5cblx0XHRcdGYuZ2V0Q29udHJvbFBvaW50cyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gW3t4OiBtWDEsIHk6IG1ZMX0sIHt4OiBtWDIsIHk6IG1ZMn1dO1xuXHRcdFx0fTtcblxuXHRcdFx0dmFyIHN0ciA9IFwiZ2VuZXJhdGVCZXppZXIoXCIgKyBbbVgxLCBtWTEsIG1YMiwgbVkyXSArIFwiKVwiO1xuXHRcdFx0Zi50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gc3RyO1xuXHRcdFx0fTtcblxuXHRcdFx0cmV0dXJuIGY7XG5cdFx0fVxuXG5cdFx0LyogUnVuZ2UtS3V0dGEgc3ByaW5nIHBoeXNpY3MgZnVuY3Rpb24gZ2VuZXJhdG9yLiBBZGFwdGVkIGZyb20gRnJhbWVyLmpzLCBjb3B5cmlnaHQgS29lbiBCb2suIE1JVCBMaWNlbnNlOiBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL01JVF9MaWNlbnNlICovXG5cdFx0LyogR2l2ZW4gYSB0ZW5zaW9uLCBmcmljdGlvbiwgYW5kIGR1cmF0aW9uLCBhIHNpbXVsYXRpb24gYXQgNjBGUFMgd2lsbCBmaXJzdCBydW4gd2l0aG91dCBhIGRlZmluZWQgZHVyYXRpb24gaW4gb3JkZXIgdG8gY2FsY3VsYXRlIHRoZSBmdWxsIHBhdGguIEEgc2Vjb25kIHBhc3Ncblx0XHQgdGhlbiBhZGp1c3RzIHRoZSB0aW1lIGRlbHRhIC0tIHVzaW5nIHRoZSByZWxhdGlvbiBiZXR3ZWVuIGFjdHVhbCB0aW1lIGFuZCBkdXJhdGlvbiAtLSB0byBjYWxjdWxhdGUgdGhlIHBhdGggZm9yIHRoZSBkdXJhdGlvbi1jb25zdHJhaW5lZCBhbmltYXRpb24uICovXG5cdFx0dmFyIGdlbmVyYXRlU3ByaW5nUks0ID0gKGZ1bmN0aW9uKCkge1xuXHRcdFx0ZnVuY3Rpb24gc3ByaW5nQWNjZWxlcmF0aW9uRm9yU3RhdGUoc3RhdGUpIHtcblx0XHRcdFx0cmV0dXJuICgtc3RhdGUudGVuc2lvbiAqIHN0YXRlLngpIC0gKHN0YXRlLmZyaWN0aW9uICogc3RhdGUudik7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIHNwcmluZ0V2YWx1YXRlU3RhdGVXaXRoRGVyaXZhdGl2ZShpbml0aWFsU3RhdGUsIGR0LCBkZXJpdmF0aXZlKSB7XG5cdFx0XHRcdHZhciBzdGF0ZSA9IHtcblx0XHRcdFx0XHR4OiBpbml0aWFsU3RhdGUueCArIGRlcml2YXRpdmUuZHggKiBkdCxcblx0XHRcdFx0XHR2OiBpbml0aWFsU3RhdGUudiArIGRlcml2YXRpdmUuZHYgKiBkdCxcblx0XHRcdFx0XHR0ZW5zaW9uOiBpbml0aWFsU3RhdGUudGVuc2lvbixcblx0XHRcdFx0XHRmcmljdGlvbjogaW5pdGlhbFN0YXRlLmZyaWN0aW9uXG5cdFx0XHRcdH07XG5cblx0XHRcdFx0cmV0dXJuIHtkeDogc3RhdGUudiwgZHY6IHNwcmluZ0FjY2VsZXJhdGlvbkZvclN0YXRlKHN0YXRlKX07XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIHNwcmluZ0ludGVncmF0ZVN0YXRlKHN0YXRlLCBkdCkge1xuXHRcdFx0XHR2YXIgYSA9IHtcblx0XHRcdFx0XHRkeDogc3RhdGUudixcblx0XHRcdFx0XHRkdjogc3ByaW5nQWNjZWxlcmF0aW9uRm9yU3RhdGUoc3RhdGUpXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGIgPSBzcHJpbmdFdmFsdWF0ZVN0YXRlV2l0aERlcml2YXRpdmUoc3RhdGUsIGR0ICogMC41LCBhKSxcblx0XHRcdFx0XHRcdGMgPSBzcHJpbmdFdmFsdWF0ZVN0YXRlV2l0aERlcml2YXRpdmUoc3RhdGUsIGR0ICogMC41LCBiKSxcblx0XHRcdFx0XHRcdGQgPSBzcHJpbmdFdmFsdWF0ZVN0YXRlV2l0aERlcml2YXRpdmUoc3RhdGUsIGR0LCBjKSxcblx0XHRcdFx0XHRcdGR4ZHQgPSAxLjAgLyA2LjAgKiAoYS5keCArIDIuMCAqIChiLmR4ICsgYy5keCkgKyBkLmR4KSxcblx0XHRcdFx0XHRcdGR2ZHQgPSAxLjAgLyA2LjAgKiAoYS5kdiArIDIuMCAqIChiLmR2ICsgYy5kdikgKyBkLmR2KTtcblxuXHRcdFx0XHRzdGF0ZS54ID0gc3RhdGUueCArIGR4ZHQgKiBkdDtcblx0XHRcdFx0c3RhdGUudiA9IHN0YXRlLnYgKyBkdmR0ICogZHQ7XG5cblx0XHRcdFx0cmV0dXJuIHN0YXRlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24gc3ByaW5nUks0RmFjdG9yeSh0ZW5zaW9uLCBmcmljdGlvbiwgZHVyYXRpb24pIHtcblxuXHRcdFx0XHR2YXIgaW5pdFN0YXRlID0ge1xuXHRcdFx0XHRcdHg6IC0xLFxuXHRcdFx0XHRcdHY6IDAsXG5cdFx0XHRcdFx0dGVuc2lvbjogbnVsbCxcblx0XHRcdFx0XHRmcmljdGlvbjogbnVsbFxuXHRcdFx0XHR9LFxuXHRcdFx0XHRwYXRoID0gWzBdLFxuXHRcdFx0XHRcdFx0dGltZV9sYXBzZWQgPSAwLFxuXHRcdFx0XHRcdFx0dG9sZXJhbmNlID0gMSAvIDEwMDAwLFxuXHRcdFx0XHRcdFx0RFQgPSAxNiAvIDEwMDAsXG5cdFx0XHRcdFx0XHRoYXZlX2R1cmF0aW9uLCBkdCwgbGFzdF9zdGF0ZTtcblxuXHRcdFx0XHR0ZW5zaW9uID0gcGFyc2VGbG9hdCh0ZW5zaW9uKSB8fCA1MDA7XG5cdFx0XHRcdGZyaWN0aW9uID0gcGFyc2VGbG9hdChmcmljdGlvbikgfHwgMjA7XG5cdFx0XHRcdGR1cmF0aW9uID0gZHVyYXRpb24gfHwgbnVsbDtcblxuXHRcdFx0XHRpbml0U3RhdGUudGVuc2lvbiA9IHRlbnNpb247XG5cdFx0XHRcdGluaXRTdGF0ZS5mcmljdGlvbiA9IGZyaWN0aW9uO1xuXG5cdFx0XHRcdGhhdmVfZHVyYXRpb24gPSBkdXJhdGlvbiAhPT0gbnVsbDtcblxuXHRcdFx0XHQvKiBDYWxjdWxhdGUgdGhlIGFjdHVhbCB0aW1lIGl0IHRha2VzIGZvciB0aGlzIGFuaW1hdGlvbiB0byBjb21wbGV0ZSB3aXRoIHRoZSBwcm92aWRlZCBjb25kaXRpb25zLiAqL1xuXHRcdFx0XHRpZiAoaGF2ZV9kdXJhdGlvbikge1xuXHRcdFx0XHRcdC8qIFJ1biB0aGUgc2ltdWxhdGlvbiB3aXRob3V0IGEgZHVyYXRpb24uICovXG5cdFx0XHRcdFx0dGltZV9sYXBzZWQgPSBzcHJpbmdSSzRGYWN0b3J5KHRlbnNpb24sIGZyaWN0aW9uKTtcblx0XHRcdFx0XHQvKiBDb21wdXRlIHRoZSBhZGp1c3RlZCB0aW1lIGRlbHRhLiAqL1xuXHRcdFx0XHRcdGR0ID0gdGltZV9sYXBzZWQgLyBkdXJhdGlvbiAqIERUO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGR0ID0gRFQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR3aGlsZSAodHJ1ZSkge1xuXHRcdFx0XHRcdC8qIE5leHQvc3RlcCBmdW5jdGlvbiAuKi9cblx0XHRcdFx0XHRsYXN0X3N0YXRlID0gc3ByaW5nSW50ZWdyYXRlU3RhdGUobGFzdF9zdGF0ZSB8fCBpbml0U3RhdGUsIGR0KTtcblx0XHRcdFx0XHQvKiBTdG9yZSB0aGUgcG9zaXRpb24uICovXG5cdFx0XHRcdFx0cGF0aC5wdXNoKDEgKyBsYXN0X3N0YXRlLngpO1xuXHRcdFx0XHRcdHRpbWVfbGFwc2VkICs9IDE2O1xuXHRcdFx0XHRcdC8qIElmIHRoZSBjaGFuZ2UgdGhyZXNob2xkIGlzIHJlYWNoZWQsIGJyZWFrLiAqL1xuXHRcdFx0XHRcdGlmICghKE1hdGguYWJzKGxhc3Rfc3RhdGUueCkgPiB0b2xlcmFuY2UgJiYgTWF0aC5hYnMobGFzdF9zdGF0ZS52KSA+IHRvbGVyYW5jZSkpIHtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8qIElmIGR1cmF0aW9uIGlzIG5vdCBkZWZpbmVkLCByZXR1cm4gdGhlIGFjdHVhbCB0aW1lIHJlcXVpcmVkIGZvciBjb21wbGV0aW5nIHRoaXMgYW5pbWF0aW9uLiBPdGhlcndpc2UsIHJldHVybiBhIGNsb3N1cmUgdGhhdCBob2xkcyB0aGVcblx0XHRcdFx0IGNvbXB1dGVkIHBhdGggYW5kIHJldHVybnMgYSBzbmFwc2hvdCBvZiB0aGUgcG9zaXRpb24gYWNjb3JkaW5nIHRvIGEgZ2l2ZW4gcGVyY2VudENvbXBsZXRlLiAqL1xuXHRcdFx0XHRyZXR1cm4gIWhhdmVfZHVyYXRpb24gPyB0aW1lX2xhcHNlZCA6IGZ1bmN0aW9uKHBlcmNlbnRDb21wbGV0ZSkge1xuXHRcdFx0XHRcdHJldHVybiBwYXRoWyAocGVyY2VudENvbXBsZXRlICogKHBhdGgubGVuZ3RoIC0gMSkpIHwgMCBdO1xuXHRcdFx0XHR9O1xuXHRcdFx0fTtcblx0XHR9KCkpO1xuXG5cdFx0LyogalF1ZXJ5IGVhc2luZ3MuICovXG5cdFx0VmVsb2NpdHkuRWFzaW5ncyA9IHtcblx0XHRcdGxpbmVhcjogZnVuY3Rpb24ocCkge1xuXHRcdFx0XHRyZXR1cm4gcDtcblx0XHRcdH0sXG5cdFx0XHRzd2luZzogZnVuY3Rpb24ocCkge1xuXHRcdFx0XHRyZXR1cm4gMC41IC0gTWF0aC5jb3MocCAqIE1hdGguUEkpIC8gMjtcblx0XHRcdH0sXG5cdFx0XHQvKiBCb251cyBcInNwcmluZ1wiIGVhc2luZywgd2hpY2ggaXMgYSBsZXNzIGV4YWdnZXJhdGVkIHZlcnNpb24gb2YgZWFzZUluT3V0RWxhc3RpYy4gKi9cblx0XHRcdHNwcmluZzogZnVuY3Rpb24ocCkge1xuXHRcdFx0XHRyZXR1cm4gMSAtIChNYXRoLmNvcyhwICogNC41ICogTWF0aC5QSSkgKiBNYXRoLmV4cCgtcCAqIDYpKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdFx0LyogQ1NTMyBhbmQgUm9iZXJ0IFBlbm5lciBlYXNpbmdzLiAqL1xuXHRcdCQuZWFjaChcblx0XHRcdFx0W1xuXHRcdFx0XHRcdFtcImVhc2VcIiwgWzAuMjUsIDAuMSwgMC4yNSwgMS4wXV0sXG5cdFx0XHRcdFx0W1wiZWFzZS1pblwiLCBbMC40MiwgMC4wLCAxLjAwLCAxLjBdXSxcblx0XHRcdFx0XHRbXCJlYXNlLW91dFwiLCBbMC4wMCwgMC4wLCAwLjU4LCAxLjBdXSxcblx0XHRcdFx0XHRbXCJlYXNlLWluLW91dFwiLCBbMC40MiwgMC4wLCAwLjU4LCAxLjBdXSxcblx0XHRcdFx0XHRbXCJlYXNlSW5TaW5lXCIsIFswLjQ3LCAwLCAwLjc0NSwgMC43MTVdXSxcblx0XHRcdFx0XHRbXCJlYXNlT3V0U2luZVwiLCBbMC4zOSwgMC41NzUsIDAuNTY1LCAxXV0sXG5cdFx0XHRcdFx0W1wiZWFzZUluT3V0U2luZVwiLCBbMC40NDUsIDAuMDUsIDAuNTUsIDAuOTVdXSxcblx0XHRcdFx0XHRbXCJlYXNlSW5RdWFkXCIsIFswLjU1LCAwLjA4NSwgMC42OCwgMC41M11dLFxuXHRcdFx0XHRcdFtcImVhc2VPdXRRdWFkXCIsIFswLjI1LCAwLjQ2LCAwLjQ1LCAwLjk0XV0sXG5cdFx0XHRcdFx0W1wiZWFzZUluT3V0UXVhZFwiLCBbMC40NTUsIDAuMDMsIDAuNTE1LCAwLjk1NV1dLFxuXHRcdFx0XHRcdFtcImVhc2VJbkN1YmljXCIsIFswLjU1LCAwLjA1NSwgMC42NzUsIDAuMTldXSxcblx0XHRcdFx0XHRbXCJlYXNlT3V0Q3ViaWNcIiwgWzAuMjE1LCAwLjYxLCAwLjM1NSwgMV1dLFxuXHRcdFx0XHRcdFtcImVhc2VJbk91dEN1YmljXCIsIFswLjY0NSwgMC4wNDUsIDAuMzU1LCAxXV0sXG5cdFx0XHRcdFx0W1wiZWFzZUluUXVhcnRcIiwgWzAuODk1LCAwLjAzLCAwLjY4NSwgMC4yMl1dLFxuXHRcdFx0XHRcdFtcImVhc2VPdXRRdWFydFwiLCBbMC4xNjUsIDAuODQsIDAuNDQsIDFdXSxcblx0XHRcdFx0XHRbXCJlYXNlSW5PdXRRdWFydFwiLCBbMC43NywgMCwgMC4xNzUsIDFdXSxcblx0XHRcdFx0XHRbXCJlYXNlSW5RdWludFwiLCBbMC43NTUsIDAuMDUsIDAuODU1LCAwLjA2XV0sXG5cdFx0XHRcdFx0W1wiZWFzZU91dFF1aW50XCIsIFswLjIzLCAxLCAwLjMyLCAxXV0sXG5cdFx0XHRcdFx0W1wiZWFzZUluT3V0UXVpbnRcIiwgWzAuODYsIDAsIDAuMDcsIDFdXSxcblx0XHRcdFx0XHRbXCJlYXNlSW5FeHBvXCIsIFswLjk1LCAwLjA1LCAwLjc5NSwgMC4wMzVdXSxcblx0XHRcdFx0XHRbXCJlYXNlT3V0RXhwb1wiLCBbMC4xOSwgMSwgMC4yMiwgMV1dLFxuXHRcdFx0XHRcdFtcImVhc2VJbk91dEV4cG9cIiwgWzEsIDAsIDAsIDFdXSxcblx0XHRcdFx0XHRbXCJlYXNlSW5DaXJjXCIsIFswLjYsIDAuMDQsIDAuOTgsIDAuMzM1XV0sXG5cdFx0XHRcdFx0W1wiZWFzZU91dENpcmNcIiwgWzAuMDc1LCAwLjgyLCAwLjE2NSwgMV1dLFxuXHRcdFx0XHRcdFtcImVhc2VJbk91dENpcmNcIiwgWzAuNzg1LCAwLjEzNSwgMC4xNSwgMC44Nl1dXG5cdFx0XHRcdF0sIGZ1bmN0aW9uKGksIGVhc2luZ0FycmF5KSB7XG5cdFx0XHRWZWxvY2l0eS5FYXNpbmdzW2Vhc2luZ0FycmF5WzBdXSA9IGdlbmVyYXRlQmV6aWVyLmFwcGx5KG51bGwsIGVhc2luZ0FycmF5WzFdKTtcblx0XHR9KTtcblxuXHRcdC8qIERldGVybWluZSB0aGUgYXBwcm9wcmlhdGUgZWFzaW5nIHR5cGUgZ2l2ZW4gYW4gZWFzaW5nIGlucHV0LiAqL1xuXHRcdGZ1bmN0aW9uIGdldEVhc2luZyh2YWx1ZSwgZHVyYXRpb24pIHtcblx0XHRcdHZhciBlYXNpbmcgPSB2YWx1ZTtcblxuXHRcdFx0LyogVGhlIGVhc2luZyBvcHRpb24gY2FuIGVpdGhlciBiZSBhIHN0cmluZyB0aGF0IHJlZmVyZW5jZXMgYSBwcmUtcmVnaXN0ZXJlZCBlYXNpbmcsXG5cdFx0XHQgb3IgaXQgY2FuIGJlIGEgdHdvLS9mb3VyLWl0ZW0gYXJyYXkgb2YgaW50ZWdlcnMgdG8gYmUgY29udmVydGVkIGludG8gYSBiZXppZXIvc3ByaW5nIGZ1bmN0aW9uLiAqL1xuXHRcdFx0aWYgKFR5cGUuaXNTdHJpbmcodmFsdWUpKSB7XG5cdFx0XHRcdC8qIEVuc3VyZSB0aGF0IHRoZSBlYXNpbmcgaGFzIGJlZW4gYXNzaWduZWQgdG8galF1ZXJ5J3MgVmVsb2NpdHkuRWFzaW5ncyBvYmplY3QuICovXG5cdFx0XHRcdGlmICghVmVsb2NpdHkuRWFzaW5nc1t2YWx1ZV0pIHtcblx0XHRcdFx0XHRlYXNpbmcgPSBmYWxzZTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChUeXBlLmlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMSkge1xuXHRcdFx0XHRlYXNpbmcgPSBnZW5lcmF0ZVN0ZXAuYXBwbHkobnVsbCwgdmFsdWUpO1xuXHRcdFx0fSBlbHNlIGlmIChUeXBlLmlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMikge1xuXHRcdFx0XHQvKiBzcHJpbmdSSzQgbXVzdCBiZSBwYXNzZWQgdGhlIGFuaW1hdGlvbidzIGR1cmF0aW9uLiAqL1xuXHRcdFx0XHQvKiBOb3RlOiBJZiB0aGUgc3ByaW5nUks0IGFycmF5IGNvbnRhaW5zIG5vbi1udW1iZXJzLCBnZW5lcmF0ZVNwcmluZ1JLNCgpIHJldHVybnMgYW4gZWFzaW5nXG5cdFx0XHRcdCBmdW5jdGlvbiBnZW5lcmF0ZWQgd2l0aCBkZWZhdWx0IHRlbnNpb24gYW5kIGZyaWN0aW9uIHZhbHVlcy4gKi9cblx0XHRcdFx0ZWFzaW5nID0gZ2VuZXJhdGVTcHJpbmdSSzQuYXBwbHkobnVsbCwgdmFsdWUuY29uY2F0KFtkdXJhdGlvbl0pKTtcblx0XHRcdH0gZWxzZSBpZiAoVHlwZS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPT09IDQpIHtcblx0XHRcdFx0LyogTm90ZTogSWYgdGhlIGJlemllciBhcnJheSBjb250YWlucyBub24tbnVtYmVycywgZ2VuZXJhdGVCZXppZXIoKSByZXR1cm5zIGZhbHNlLiAqL1xuXHRcdFx0XHRlYXNpbmcgPSBnZW5lcmF0ZUJlemllci5hcHBseShudWxsLCB2YWx1ZSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRlYXNpbmcgPSBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0LyogUmV2ZXJ0IHRvIHRoZSBWZWxvY2l0eS13aWRlIGRlZmF1bHQgZWFzaW5nIHR5cGUsIG9yIGZhbGwgYmFjayB0byBcInN3aW5nXCIgKHdoaWNoIGlzIGFsc28galF1ZXJ5J3MgZGVmYXVsdClcblx0XHRcdCBpZiB0aGUgVmVsb2NpdHktd2lkZSBkZWZhdWx0IGhhcyBiZWVuIGluY29ycmVjdGx5IG1vZGlmaWVkLiAqL1xuXHRcdFx0aWYgKGVhc2luZyA9PT0gZmFsc2UpIHtcblx0XHRcdFx0aWYgKFZlbG9jaXR5LkVhc2luZ3NbVmVsb2NpdHkuZGVmYXVsdHMuZWFzaW5nXSkge1xuXHRcdFx0XHRcdGVhc2luZyA9IFZlbG9jaXR5LmRlZmF1bHRzLmVhc2luZztcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRlYXNpbmcgPSBFQVNJTkdfREVGQVVMVDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZWFzaW5nO1xuXHRcdH1cblxuXHRcdC8qKioqKioqKioqKioqKioqKlxuXHRcdCBDU1MgU3RhY2tcblx0XHQgKioqKioqKioqKioqKioqKiovXG5cblx0XHQvKiBUaGUgQ1NTIG9iamVjdCBpcyBhIGhpZ2hseSBjb25kZW5zZWQgYW5kIHBlcmZvcm1hbnQgQ1NTIHN0YWNrIHRoYXQgZnVsbHkgcmVwbGFjZXMgalF1ZXJ5J3MuXG5cdFx0IEl0IGhhbmRsZXMgdGhlIHZhbGlkYXRpb24sIGdldHRpbmcsIGFuZCBzZXR0aW5nIG9mIGJvdGggc3RhbmRhcmQgQ1NTIHByb3BlcnRpZXMgYW5kIENTUyBwcm9wZXJ0eSBob29rcy4gKi9cblx0XHQvKiBOb3RlOiBBIFwiQ1NTXCIgc2hvcnRoYW5kIGlzIGFsaWFzZWQgc28gdGhhdCBvdXIgY29kZSBpcyBlYXNpZXIgdG8gcmVhZC4gKi9cblx0XHR2YXIgQ1NTID0gVmVsb2NpdHkuQ1NTID0ge1xuXHRcdFx0LyoqKioqKioqKioqKipcblx0XHRcdCBSZWdFeFxuXHRcdFx0ICoqKioqKioqKioqKiovXG5cblx0XHRcdFJlZ0V4OiB7XG5cdFx0XHRcdGlzSGV4OiAvXiMoW0EtZlxcZF17M30pezEsMn0kL2ksXG5cdFx0XHRcdC8qIFVud3JhcCBhIHByb3BlcnR5IHZhbHVlJ3Mgc3Vycm91bmRpbmcgdGV4dCwgZS5nLiBcInJnYmEoNCwgMywgMiwgMSlcIiA9PT4gXCI0LCAzLCAyLCAxXCIgYW5kIFwicmVjdCg0cHggM3B4IDJweCAxcHgpXCIgPT0+IFwiNHB4IDNweCAycHggMXB4XCIuICovXG5cdFx0XHRcdHZhbHVlVW53cmFwOiAvXltBLXpdK1xcKCguKilcXCkkL2ksXG5cdFx0XHRcdHdyYXBwZWRWYWx1ZUFscmVhZHlFeHRyYWN0ZWQ6IC9bMC05Ll0rIFswLTkuXSsgWzAtOS5dKyggWzAtOS5dKyk/Lyxcblx0XHRcdFx0LyogU3BsaXQgYSBtdWx0aS12YWx1ZSBwcm9wZXJ0eSBpbnRvIGFuIGFycmF5IG9mIHN1YnZhbHVlcywgZS5nLiBcInJnYmEoNCwgMywgMiwgMSkgNHB4IDNweCAycHggMXB4XCIgPT0+IFsgXCJyZ2JhKDQsIDMsIDIsIDEpXCIsIFwiNHB4XCIsIFwiM3B4XCIsIFwiMnB4XCIsIFwiMXB4XCIgXS4gKi9cblx0XHRcdFx0dmFsdWVTcGxpdDogLyhbQS16XStcXCguK1xcKSl8KChbQS16MC05Iy0uXSs/KSg/PVxcc3wkKSkvaWdcblx0XHRcdH0sXG5cdFx0XHQvKioqKioqKioqKioqXG5cdFx0XHQgTGlzdHNcblx0XHRcdCAqKioqKioqKioqKiovXG5cblx0XHRcdExpc3RzOiB7XG5cdFx0XHRcdGNvbG9yczogW1wiZmlsbFwiLCBcInN0cm9rZVwiLCBcInN0b3BDb2xvclwiLCBcImNvbG9yXCIsIFwiYmFja2dyb3VuZENvbG9yXCIsIFwiYm9yZGVyQ29sb3JcIiwgXCJib3JkZXJUb3BDb2xvclwiLCBcImJvcmRlclJpZ2h0Q29sb3JcIiwgXCJib3JkZXJCb3R0b21Db2xvclwiLCBcImJvcmRlckxlZnRDb2xvclwiLCBcIm91dGxpbmVDb2xvclwiXSxcblx0XHRcdFx0dHJhbnNmb3Jtc0Jhc2U6IFtcInRyYW5zbGF0ZVhcIiwgXCJ0cmFuc2xhdGVZXCIsIFwic2NhbGVcIiwgXCJzY2FsZVhcIiwgXCJzY2FsZVlcIiwgXCJza2V3WFwiLCBcInNrZXdZXCIsIFwicm90YXRlWlwiXSxcblx0XHRcdFx0dHJhbnNmb3JtczNEOiBbXCJ0cmFuc2Zvcm1QZXJzcGVjdGl2ZVwiLCBcInRyYW5zbGF0ZVpcIiwgXCJzY2FsZVpcIiwgXCJyb3RhdGVYXCIsIFwicm90YXRlWVwiXVxuXHRcdFx0fSxcblx0XHRcdC8qKioqKioqKioqKipcblx0XHRcdCBIb29rc1xuXHRcdFx0ICoqKioqKioqKioqKi9cblxuXHRcdFx0LyogSG9va3MgYWxsb3cgYSBzdWJwcm9wZXJ0eSAoZS5nLiBcImJveFNoYWRvd0JsdXJcIikgb2YgYSBjb21wb3VuZC12YWx1ZSBDU1MgcHJvcGVydHlcblx0XHRcdCAoZS5nLiBcImJveFNoYWRvdzogWCBZIEJsdXIgU3ByZWFkIENvbG9yXCIpIHRvIGJlIGFuaW1hdGVkIGFzIGlmIGl0IHdlcmUgYSBkaXNjcmV0ZSBwcm9wZXJ0eS4gKi9cblx0XHRcdC8qIE5vdGU6IEJleW9uZCBlbmFibGluZyBmaW5lLWdyYWluZWQgcHJvcGVydHkgYW5pbWF0aW9uLCBob29raW5nIGlzIG5lY2Vzc2FyeSBzaW5jZSBWZWxvY2l0eSBvbmx5XG5cdFx0XHQgdHdlZW5zIHByb3BlcnRpZXMgd2l0aCBzaW5nbGUgbnVtZXJpYyB2YWx1ZXM7IHVubGlrZSBDU1MgdHJhbnNpdGlvbnMsIFZlbG9jaXR5IGRvZXMgbm90IGludGVycG9sYXRlIGNvbXBvdW5kLXZhbHVlcy4gKi9cblx0XHRcdEhvb2tzOiB7XG5cdFx0XHRcdC8qKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0XHQgUmVnaXN0cmF0aW9uXG5cdFx0XHRcdCAqKioqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0XHQvKiBUZW1wbGF0ZXMgYXJlIGEgY29uY2lzZSB3YXkgb2YgaW5kaWNhdGluZyB3aGljaCBzdWJwcm9wZXJ0aWVzIG11c3QgYmUgaW5kaXZpZHVhbGx5IHJlZ2lzdGVyZWQgZm9yIGVhY2ggY29tcG91bmQtdmFsdWUgQ1NTIHByb3BlcnR5LiAqL1xuXHRcdFx0XHQvKiBFYWNoIHRlbXBsYXRlIGNvbnNpc3RzIG9mIHRoZSBjb21wb3VuZC12YWx1ZSdzIGJhc2UgbmFtZSwgaXRzIGNvbnN0aXR1ZW50IHN1YnByb3BlcnR5IG5hbWVzLCBhbmQgdGhvc2Ugc3VicHJvcGVydGllcycgZGVmYXVsdCB2YWx1ZXMuICovXG5cdFx0XHRcdHRlbXBsYXRlczoge1xuXHRcdFx0XHRcdFwidGV4dFNoYWRvd1wiOiBbXCJDb2xvciBYIFkgQmx1clwiLCBcImJsYWNrIDBweCAwcHggMHB4XCJdLFxuXHRcdFx0XHRcdFwiYm94U2hhZG93XCI6IFtcIkNvbG9yIFggWSBCbHVyIFNwcmVhZFwiLCBcImJsYWNrIDBweCAwcHggMHB4IDBweFwiXSxcblx0XHRcdFx0XHRcImNsaXBcIjogW1wiVG9wIFJpZ2h0IEJvdHRvbSBMZWZ0XCIsIFwiMHB4IDBweCAwcHggMHB4XCJdLFxuXHRcdFx0XHRcdFwiYmFja2dyb3VuZFBvc2l0aW9uXCI6IFtcIlggWVwiLCBcIjAlIDAlXCJdLFxuXHRcdFx0XHRcdFwidHJhbnNmb3JtT3JpZ2luXCI6IFtcIlggWSBaXCIsIFwiNTAlIDUwJSAwcHhcIl0sXG5cdFx0XHRcdFx0XCJwZXJzcGVjdGl2ZU9yaWdpblwiOiBbXCJYIFlcIiwgXCI1MCUgNTAlXCJdXG5cdFx0XHRcdH0sXG5cdFx0XHRcdC8qIEEgXCJyZWdpc3RlcmVkXCIgaG9vayBpcyBvbmUgdGhhdCBoYXMgYmVlbiBjb252ZXJ0ZWQgZnJvbSBpdHMgdGVtcGxhdGUgZm9ybSBpbnRvIGEgbGl2ZSxcblx0XHRcdFx0IHR3ZWVuYWJsZSBwcm9wZXJ0eS4gSXQgY29udGFpbnMgZGF0YSB0byBhc3NvY2lhdGUgaXQgd2l0aCBpdHMgcm9vdCBwcm9wZXJ0eS4gKi9cblx0XHRcdFx0cmVnaXN0ZXJlZDoge1xuXHRcdFx0XHRcdC8qIE5vdGU6IEEgcmVnaXN0ZXJlZCBob29rIGxvb2tzIGxpa2UgdGhpcyA9PT4gdGV4dFNoYWRvd0JsdXI6IFsgXCJ0ZXh0U2hhZG93XCIsIDMgXSxcblx0XHRcdFx0XHQgd2hpY2ggY29uc2lzdHMgb2YgdGhlIHN1YnByb3BlcnR5J3MgbmFtZSwgdGhlIGFzc29jaWF0ZWQgcm9vdCBwcm9wZXJ0eSdzIG5hbWUsXG5cdFx0XHRcdFx0IGFuZCB0aGUgc3VicHJvcGVydHkncyBwb3NpdGlvbiBpbiB0aGUgcm9vdCdzIHZhbHVlLiAqL1xuXHRcdFx0XHR9LFxuXHRcdFx0XHQvKiBDb252ZXJ0IHRoZSB0ZW1wbGF0ZXMgaW50byBpbmRpdmlkdWFsIGhvb2tzIHRoZW4gYXBwZW5kIHRoZW0gdG8gdGhlIHJlZ2lzdGVyZWQgb2JqZWN0IGFib3ZlLiAqL1xuXHRcdFx0XHRyZWdpc3RlcjogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0LyogQ29sb3IgaG9va3MgcmVnaXN0cmF0aW9uOiBDb2xvcnMgYXJlIGRlZmF1bHRlZCB0byB3aGl0ZSAtLSBhcyBvcHBvc2VkIHRvIGJsYWNrIC0tIHNpbmNlIGNvbG9ycyB0aGF0IGFyZVxuXHRcdFx0XHRcdCBjdXJyZW50bHkgc2V0IHRvIFwidHJhbnNwYXJlbnRcIiBkZWZhdWx0IHRvIHRoZWlyIHJlc3BlY3RpdmUgdGVtcGxhdGUgYmVsb3cgd2hlbiBjb2xvci1hbmltYXRlZCxcblx0XHRcdFx0XHQgYW5kIHdoaXRlIGlzIHR5cGljYWxseSBhIGNsb3NlciBtYXRjaCB0byB0cmFuc3BhcmVudCB0aGFuIGJsYWNrIGlzLiBBbiBleGNlcHRpb24gaXMgbWFkZSBmb3IgdGV4dCAoXCJjb2xvclwiKSxcblx0XHRcdFx0XHQgd2hpY2ggaXMgYWxtb3N0IGFsd2F5cyBzZXQgY2xvc2VyIHRvIGJsYWNrIHRoYW4gd2hpdGUuICovXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBDU1MuTGlzdHMuY29sb3JzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHR2YXIgcmdiQ29tcG9uZW50cyA9IChDU1MuTGlzdHMuY29sb3JzW2ldID09PSBcImNvbG9yXCIpID8gXCIwIDAgMCAxXCIgOiBcIjI1NSAyNTUgMjU1IDFcIjtcblx0XHRcdFx0XHRcdENTUy5Ib29rcy50ZW1wbGF0ZXNbQ1NTLkxpc3RzLmNvbG9yc1tpXV0gPSBbXCJSZWQgR3JlZW4gQmx1ZSBBbHBoYVwiLCByZ2JDb21wb25lbnRzXTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR2YXIgcm9vdFByb3BlcnR5LFxuXHRcdFx0XHRcdFx0XHRob29rVGVtcGxhdGUsXG5cdFx0XHRcdFx0XHRcdGhvb2tOYW1lcztcblxuXHRcdFx0XHRcdC8qIEluIElFLCBjb2xvciB2YWx1ZXMgaW5zaWRlIGNvbXBvdW5kLXZhbHVlIHByb3BlcnRpZXMgYXJlIHBvc2l0aW9uZWQgYXQgdGhlIGVuZCB0aGUgdmFsdWUgaW5zdGVhZCBvZiBhdCB0aGUgYmVnaW5uaW5nLlxuXHRcdFx0XHRcdCBUaHVzLCB3ZSByZS1hcnJhbmdlIHRoZSB0ZW1wbGF0ZXMgYWNjb3JkaW5nbHkuICovXG5cdFx0XHRcdFx0aWYgKElFKSB7XG5cdFx0XHRcdFx0XHRmb3IgKHJvb3RQcm9wZXJ0eSBpbiBDU1MuSG9va3MudGVtcGxhdGVzKSB7XG5cdFx0XHRcdFx0XHRcdGlmICghQ1NTLkhvb2tzLnRlbXBsYXRlcy5oYXNPd25Qcm9wZXJ0eShyb290UHJvcGVydHkpKSB7XG5cdFx0XHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0aG9va1RlbXBsYXRlID0gQ1NTLkhvb2tzLnRlbXBsYXRlc1tyb290UHJvcGVydHldO1xuXHRcdFx0XHRcdFx0XHRob29rTmFtZXMgPSBob29rVGVtcGxhdGVbMF0uc3BsaXQoXCIgXCIpO1xuXG5cdFx0XHRcdFx0XHRcdHZhciBkZWZhdWx0VmFsdWVzID0gaG9va1RlbXBsYXRlWzFdLm1hdGNoKENTUy5SZWdFeC52YWx1ZVNwbGl0KTtcblxuXHRcdFx0XHRcdFx0XHRpZiAoaG9va05hbWVzWzBdID09PSBcIkNvbG9yXCIpIHtcblx0XHRcdFx0XHRcdFx0XHQvKiBSZXBvc2l0aW9uIGJvdGggdGhlIGhvb2sncyBuYW1lIGFuZCBpdHMgZGVmYXVsdCB2YWx1ZSB0byB0aGUgZW5kIG9mIHRoZWlyIHJlc3BlY3RpdmUgc3RyaW5ncy4gKi9cblx0XHRcdFx0XHRcdFx0XHRob29rTmFtZXMucHVzaChob29rTmFtZXMuc2hpZnQoKSk7XG5cdFx0XHRcdFx0XHRcdFx0ZGVmYXVsdFZhbHVlcy5wdXNoKGRlZmF1bHRWYWx1ZXMuc2hpZnQoKSk7XG5cblx0XHRcdFx0XHRcdFx0XHQvKiBSZXBsYWNlIHRoZSBleGlzdGluZyB0ZW1wbGF0ZSBmb3IgdGhlIGhvb2sncyByb290IHByb3BlcnR5LiAqL1xuXHRcdFx0XHRcdFx0XHRcdENTUy5Ib29rcy50ZW1wbGF0ZXNbcm9vdFByb3BlcnR5XSA9IFtob29rTmFtZXMuam9pbihcIiBcIiksIGRlZmF1bHRWYWx1ZXMuam9pbihcIiBcIildO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0LyogSG9vayByZWdpc3RyYXRpb24uICovXG5cdFx0XHRcdFx0Zm9yIChyb290UHJvcGVydHkgaW4gQ1NTLkhvb2tzLnRlbXBsYXRlcykge1xuXHRcdFx0XHRcdFx0aWYgKCFDU1MuSG9va3MudGVtcGxhdGVzLmhhc093blByb3BlcnR5KHJvb3RQcm9wZXJ0eSkpIHtcblx0XHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRob29rVGVtcGxhdGUgPSBDU1MuSG9va3MudGVtcGxhdGVzW3Jvb3RQcm9wZXJ0eV07XG5cdFx0XHRcdFx0XHRob29rTmFtZXMgPSBob29rVGVtcGxhdGVbMF0uc3BsaXQoXCIgXCIpO1xuXG5cdFx0XHRcdFx0XHRmb3IgKHZhciBqIGluIGhvb2tOYW1lcykge1xuXHRcdFx0XHRcdFx0XHRpZiAoIWhvb2tOYW1lcy5oYXNPd25Qcm9wZXJ0eShqKSkge1xuXHRcdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHZhciBmdWxsSG9va05hbWUgPSByb290UHJvcGVydHkgKyBob29rTmFtZXNbal0sXG5cdFx0XHRcdFx0XHRcdFx0XHRob29rUG9zaXRpb24gPSBqO1xuXG5cdFx0XHRcdFx0XHRcdC8qIEZvciBlYWNoIGhvb2ssIHJlZ2lzdGVyIGl0cyBmdWxsIG5hbWUgKGUuZy4gdGV4dFNoYWRvd0JsdXIpIHdpdGggaXRzIHJvb3QgcHJvcGVydHkgKGUuZy4gdGV4dFNoYWRvdylcblx0XHRcdFx0XHRcdFx0IGFuZCB0aGUgaG9vaydzIHBvc2l0aW9uIGluIGl0cyB0ZW1wbGF0ZSdzIGRlZmF1bHQgdmFsdWUgc3RyaW5nLiAqL1xuXHRcdFx0XHRcdFx0XHRDU1MuSG9va3MucmVnaXN0ZXJlZFtmdWxsSG9va05hbWVdID0gW3Jvb3RQcm9wZXJ0eSwgaG9va1Bvc2l0aW9uXTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0XHQgSW5qZWN0aW9uIGFuZCBFeHRyYWN0aW9uXG5cdFx0XHRcdCAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0XHQvKiBMb29rIHVwIHRoZSByb290IHByb3BlcnR5IGFzc29jaWF0ZWQgd2l0aCB0aGUgaG9vayAoZS5nLiByZXR1cm4gXCJ0ZXh0U2hhZG93XCIgZm9yIFwidGV4dFNoYWRvd0JsdXJcIikuICovXG5cdFx0XHRcdC8qIFNpbmNlIGEgaG9vayBjYW5ub3QgYmUgc2V0IGRpcmVjdGx5ICh0aGUgYnJvd3NlciB3b24ndCByZWNvZ25pemUgaXQpLCBzdHlsZSB1cGRhdGluZyBmb3IgaG9va3MgaXMgcm91dGVkIHRocm91Z2ggdGhlIGhvb2sncyByb290IHByb3BlcnR5LiAqL1xuXHRcdFx0XHRnZXRSb290OiBmdW5jdGlvbihwcm9wZXJ0eSkge1xuXHRcdFx0XHRcdHZhciBob29rRGF0YSA9IENTUy5Ib29rcy5yZWdpc3RlcmVkW3Byb3BlcnR5XTtcblxuXHRcdFx0XHRcdGlmIChob29rRGF0YSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGhvb2tEYXRhWzBdO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHQvKiBJZiB0aGVyZSB3YXMgbm8gaG9vayBtYXRjaCwgcmV0dXJuIHRoZSBwcm9wZXJ0eSBuYW1lIHVudG91Y2hlZC4gKi9cblx0XHRcdFx0XHRcdHJldHVybiBwcm9wZXJ0eTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdC8qIENvbnZlcnQgYW55IHJvb3RQcm9wZXJ0eVZhbHVlLCBudWxsIG9yIG90aGVyd2lzZSwgaW50byBhIHNwYWNlLWRlbGltaXRlZCBsaXN0IG9mIGhvb2sgdmFsdWVzIHNvIHRoYXRcblx0XHRcdFx0IHRoZSB0YXJnZXRlZCBob29rIGNhbiBiZSBpbmplY3RlZCBvciBleHRyYWN0ZWQgYXQgaXRzIHN0YW5kYXJkIHBvc2l0aW9uLiAqL1xuXHRcdFx0XHRjbGVhblJvb3RQcm9wZXJ0eVZhbHVlOiBmdW5jdGlvbihyb290UHJvcGVydHksIHJvb3RQcm9wZXJ0eVZhbHVlKSB7XG5cdFx0XHRcdFx0LyogSWYgdGhlIHJvb3RQcm9wZXJ0eVZhbHVlIGlzIHdyYXBwZWQgd2l0aCBcInJnYigpXCIsIFwiY2xpcCgpXCIsIGV0Yy4sIHJlbW92ZSB0aGUgd3JhcHBpbmcgdG8gbm9ybWFsaXplIHRoZSB2YWx1ZSBiZWZvcmUgbWFuaXB1bGF0aW9uLiAqL1xuXHRcdFx0XHRcdGlmIChDU1MuUmVnRXgudmFsdWVVbndyYXAudGVzdChyb290UHJvcGVydHlWYWx1ZSkpIHtcblx0XHRcdFx0XHRcdHJvb3RQcm9wZXJ0eVZhbHVlID0gcm9vdFByb3BlcnR5VmFsdWUubWF0Y2goQ1NTLlJlZ0V4LnZhbHVlVW53cmFwKVsxXTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvKiBJZiByb290UHJvcGVydHlWYWx1ZSBpcyBhIENTUyBudWxsLXZhbHVlIChmcm9tIHdoaWNoIHRoZXJlJ3MgaW5oZXJlbnRseSBubyBob29rIHZhbHVlIHRvIGV4dHJhY3QpLFxuXHRcdFx0XHRcdCBkZWZhdWx0IHRvIHRoZSByb290J3MgZGVmYXVsdCB2YWx1ZSBhcyBkZWZpbmVkIGluIENTUy5Ib29rcy50ZW1wbGF0ZXMuICovXG5cdFx0XHRcdFx0LyogTm90ZTogQ1NTIG51bGwtdmFsdWVzIGluY2x1ZGUgXCJub25lXCIsIFwiYXV0b1wiLCBhbmQgXCJ0cmFuc3BhcmVudFwiLiBUaGV5IG11c3QgYmUgY29udmVydGVkIGludG8gdGhlaXJcblx0XHRcdFx0XHQgemVyby12YWx1ZXMgKGUuZy4gdGV4dFNoYWRvdzogXCJub25lXCIgPT0+IHRleHRTaGFkb3c6IFwiMHB4IDBweCAwcHggYmxhY2tcIikgZm9yIGhvb2sgbWFuaXB1bGF0aW9uIHRvIHByb2NlZWQuICovXG5cdFx0XHRcdFx0aWYgKENTUy5WYWx1ZXMuaXNDU1NOdWxsVmFsdWUocm9vdFByb3BlcnR5VmFsdWUpKSB7XG5cdFx0XHRcdFx0XHRyb290UHJvcGVydHlWYWx1ZSA9IENTUy5Ib29rcy50ZW1wbGF0ZXNbcm9vdFByb3BlcnR5XVsxXTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gcm9vdFByb3BlcnR5VmFsdWU7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdC8qIEV4dHJhY3RlZCB0aGUgaG9vaydzIHZhbHVlIGZyb20gaXRzIHJvb3QgcHJvcGVydHkncyB2YWx1ZS4gVGhpcyBpcyB1c2VkIHRvIGdldCB0aGUgc3RhcnRpbmcgdmFsdWUgb2YgYW4gYW5pbWF0aW5nIGhvb2suICovXG5cdFx0XHRcdGV4dHJhY3RWYWx1ZTogZnVuY3Rpb24oZnVsbEhvb2tOYW1lLCByb290UHJvcGVydHlWYWx1ZSkge1xuXHRcdFx0XHRcdHZhciBob29rRGF0YSA9IENTUy5Ib29rcy5yZWdpc3RlcmVkW2Z1bGxIb29rTmFtZV07XG5cblx0XHRcdFx0XHRpZiAoaG9va0RhdGEpIHtcblx0XHRcdFx0XHRcdHZhciBob29rUm9vdCA9IGhvb2tEYXRhWzBdLFxuXHRcdFx0XHRcdFx0XHRcdGhvb2tQb3NpdGlvbiA9IGhvb2tEYXRhWzFdO1xuXG5cdFx0XHRcdFx0XHRyb290UHJvcGVydHlWYWx1ZSA9IENTUy5Ib29rcy5jbGVhblJvb3RQcm9wZXJ0eVZhbHVlKGhvb2tSb290LCByb290UHJvcGVydHlWYWx1ZSk7XG5cblx0XHRcdFx0XHRcdC8qIFNwbGl0IHJvb3RQcm9wZXJ0eVZhbHVlIGludG8gaXRzIGNvbnN0aXR1ZW50IGhvb2sgdmFsdWVzIHRoZW4gZ3JhYiB0aGUgZGVzaXJlZCBob29rIGF0IGl0cyBzdGFuZGFyZCBwb3NpdGlvbi4gKi9cblx0XHRcdFx0XHRcdHJldHVybiByb290UHJvcGVydHlWYWx1ZS50b1N0cmluZygpLm1hdGNoKENTUy5SZWdFeC52YWx1ZVNwbGl0KVtob29rUG9zaXRpb25dO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHQvKiBJZiB0aGUgcHJvdmlkZWQgZnVsbEhvb2tOYW1lIGlzbid0IGEgcmVnaXN0ZXJlZCBob29rLCByZXR1cm4gdGhlIHJvb3RQcm9wZXJ0eVZhbHVlIHRoYXQgd2FzIHBhc3NlZCBpbi4gKi9cblx0XHRcdFx0XHRcdHJldHVybiByb290UHJvcGVydHlWYWx1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdC8qIEluamVjdCB0aGUgaG9vaydzIHZhbHVlIGludG8gaXRzIHJvb3QgcHJvcGVydHkncyB2YWx1ZS4gVGhpcyBpcyB1c2VkIHRvIHBpZWNlIGJhY2sgdG9nZXRoZXIgdGhlIHJvb3QgcHJvcGVydHlcblx0XHRcdFx0IG9uY2UgVmVsb2NpdHkgaGFzIHVwZGF0ZWQgb25lIG9mIGl0cyBpbmRpdmlkdWFsbHkgaG9va2VkIHZhbHVlcyB0aHJvdWdoIHR3ZWVuaW5nLiAqL1xuXHRcdFx0XHRpbmplY3RWYWx1ZTogZnVuY3Rpb24oZnVsbEhvb2tOYW1lLCBob29rVmFsdWUsIHJvb3RQcm9wZXJ0eVZhbHVlKSB7XG5cdFx0XHRcdFx0dmFyIGhvb2tEYXRhID0gQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbZnVsbEhvb2tOYW1lXTtcblxuXHRcdFx0XHRcdGlmIChob29rRGF0YSkge1xuXHRcdFx0XHRcdFx0dmFyIGhvb2tSb290ID0gaG9va0RhdGFbMF0sXG5cdFx0XHRcdFx0XHRcdFx0aG9va1Bvc2l0aW9uID0gaG9va0RhdGFbMV0sXG5cdFx0XHRcdFx0XHRcdFx0cm9vdFByb3BlcnR5VmFsdWVQYXJ0cyxcblx0XHRcdFx0XHRcdFx0XHRyb290UHJvcGVydHlWYWx1ZVVwZGF0ZWQ7XG5cblx0XHRcdFx0XHRcdHJvb3RQcm9wZXJ0eVZhbHVlID0gQ1NTLkhvb2tzLmNsZWFuUm9vdFByb3BlcnR5VmFsdWUoaG9va1Jvb3QsIHJvb3RQcm9wZXJ0eVZhbHVlKTtcblxuXHRcdFx0XHRcdFx0LyogU3BsaXQgcm9vdFByb3BlcnR5VmFsdWUgaW50byBpdHMgaW5kaXZpZHVhbCBob29rIHZhbHVlcywgcmVwbGFjZSB0aGUgdGFyZ2V0ZWQgdmFsdWUgd2l0aCBob29rVmFsdWUsXG5cdFx0XHRcdFx0XHQgdGhlbiByZWNvbnN0cnVjdCB0aGUgcm9vdFByb3BlcnR5VmFsdWUgc3RyaW5nLiAqL1xuXHRcdFx0XHRcdFx0cm9vdFByb3BlcnR5VmFsdWVQYXJ0cyA9IHJvb3RQcm9wZXJ0eVZhbHVlLnRvU3RyaW5nKCkubWF0Y2goQ1NTLlJlZ0V4LnZhbHVlU3BsaXQpO1xuXHRcdFx0XHRcdFx0cm9vdFByb3BlcnR5VmFsdWVQYXJ0c1tob29rUG9zaXRpb25dID0gaG9va1ZhbHVlO1xuXHRcdFx0XHRcdFx0cm9vdFByb3BlcnR5VmFsdWVVcGRhdGVkID0gcm9vdFByb3BlcnR5VmFsdWVQYXJ0cy5qb2luKFwiIFwiKTtcblxuXHRcdFx0XHRcdFx0cmV0dXJuIHJvb3RQcm9wZXJ0eVZhbHVlVXBkYXRlZDtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0LyogSWYgdGhlIHByb3ZpZGVkIGZ1bGxIb29rTmFtZSBpc24ndCBhIHJlZ2lzdGVyZWQgaG9vaywgcmV0dXJuIHRoZSByb290UHJvcGVydHlWYWx1ZSB0aGF0IHdhcyBwYXNzZWQgaW4uICovXG5cdFx0XHRcdFx0XHRyZXR1cm4gcm9vdFByb3BlcnR5VmFsdWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0LyoqKioqKioqKioqKioqKioqKipcblx0XHRcdCBOb3JtYWxpemF0aW9uc1xuXHRcdFx0ICoqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdC8qIE5vcm1hbGl6YXRpb25zIHN0YW5kYXJkaXplIENTUyBwcm9wZXJ0eSBtYW5pcHVsYXRpb24gYnkgcG9sbHlmaWxsaW5nIGJyb3dzZXItc3BlY2lmaWMgaW1wbGVtZW50YXRpb25zIChlLmcuIG9wYWNpdHkpXG5cdFx0XHQgYW5kIHJlZm9ybWF0dGluZyBzcGVjaWFsIHByb3BlcnRpZXMgKGUuZy4gY2xpcCwgcmdiYSkgdG8gbG9vayBsaWtlIHN0YW5kYXJkIG9uZXMuICovXG5cdFx0XHROb3JtYWxpemF0aW9uczoge1xuXHRcdFx0XHQvKiBOb3JtYWxpemF0aW9ucyBhcmUgcGFzc2VkIGEgbm9ybWFsaXphdGlvbiB0YXJnZXQgKGVpdGhlciB0aGUgcHJvcGVydHkncyBuYW1lLCBpdHMgZXh0cmFjdGVkIHZhbHVlLCBvciBpdHMgaW5qZWN0ZWQgdmFsdWUpLFxuXHRcdFx0XHQgdGhlIHRhcmdldGVkIGVsZW1lbnQgKHdoaWNoIG1heSBuZWVkIHRvIGJlIHF1ZXJpZWQpLCBhbmQgdGhlIHRhcmdldGVkIHByb3BlcnR5IHZhbHVlLiAqL1xuXHRcdFx0XHRyZWdpc3RlcmVkOiB7XG5cdFx0XHRcdFx0Y2xpcDogZnVuY3Rpb24odHlwZSwgZWxlbWVudCwgcHJvcGVydHlWYWx1ZSkge1xuXHRcdFx0XHRcdFx0c3dpdGNoICh0eXBlKSB7XG5cdFx0XHRcdFx0XHRcdGNhc2UgXCJuYW1lXCI6XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIFwiY2xpcFwiO1xuXHRcdFx0XHRcdFx0XHRcdC8qIENsaXAgbmVlZHMgdG8gYmUgdW53cmFwcGVkIGFuZCBzdHJpcHBlZCBvZiBpdHMgY29tbWFzIGR1cmluZyBleHRyYWN0aW9uLiAqL1xuXHRcdFx0XHRcdFx0XHRjYXNlIFwiZXh0cmFjdFwiOlxuXHRcdFx0XHRcdFx0XHRcdHZhciBleHRyYWN0ZWQ7XG5cblx0XHRcdFx0XHRcdFx0XHQvKiBJZiBWZWxvY2l0eSBhbHNvIGV4dHJhY3RlZCB0aGlzIHZhbHVlLCBza2lwIGV4dHJhY3Rpb24uICovXG5cdFx0XHRcdFx0XHRcdFx0aWYgKENTUy5SZWdFeC53cmFwcGVkVmFsdWVBbHJlYWR5RXh0cmFjdGVkLnRlc3QocHJvcGVydHlWYWx1ZSkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGV4dHJhY3RlZCA9IHByb3BlcnR5VmFsdWU7XG5cdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdC8qIFJlbW92ZSB0aGUgXCJyZWN0KClcIiB3cmFwcGVyLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0ZXh0cmFjdGVkID0gcHJvcGVydHlWYWx1ZS50b1N0cmluZygpLm1hdGNoKENTUy5SZWdFeC52YWx1ZVVud3JhcCk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdC8qIFN0cmlwIG9mZiBjb21tYXMuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRleHRyYWN0ZWQgPSBleHRyYWN0ZWQgPyBleHRyYWN0ZWRbMV0ucmVwbGFjZSgvLChcXHMrKT8vZywgXCIgXCIpIDogcHJvcGVydHlWYWx1ZTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZXh0cmFjdGVkO1xuXHRcdFx0XHRcdFx0XHRcdC8qIENsaXAgbmVlZHMgdG8gYmUgcmUtd3JhcHBlZCBkdXJpbmcgaW5qZWN0aW9uLiAqL1xuXHRcdFx0XHRcdFx0XHRjYXNlIFwiaW5qZWN0XCI6XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIFwicmVjdChcIiArIHByb3BlcnR5VmFsdWUgKyBcIilcIjtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGJsdXI6IGZ1bmN0aW9uKHR5cGUsIGVsZW1lbnQsIHByb3BlcnR5VmFsdWUpIHtcblx0XHRcdFx0XHRcdHN3aXRjaCAodHlwZSkge1xuXHRcdFx0XHRcdFx0XHRjYXNlIFwibmFtZVwiOlxuXHRcdFx0XHRcdFx0XHRcdHJldHVybiBWZWxvY2l0eS5TdGF0ZS5pc0ZpcmVmb3ggPyBcImZpbHRlclwiIDogXCItd2Via2l0LWZpbHRlclwiO1xuXHRcdFx0XHRcdFx0XHRjYXNlIFwiZXh0cmFjdFwiOlxuXHRcdFx0XHRcdFx0XHRcdHZhciBleHRyYWN0ZWQgPSBwYXJzZUZsb2F0KHByb3BlcnR5VmFsdWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0LyogSWYgZXh0cmFjdGVkIGlzIE5hTiwgbWVhbmluZyB0aGUgdmFsdWUgaXNuJ3QgYWxyZWFkeSBleHRyYWN0ZWQuICovXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCEoZXh0cmFjdGVkIHx8IGV4dHJhY3RlZCA9PT0gMCkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHZhciBibHVyQ29tcG9uZW50ID0gcHJvcGVydHlWYWx1ZS50b1N0cmluZygpLm1hdGNoKC9ibHVyXFwoKFswLTldK1tBLXpdKylcXCkvaSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdC8qIElmIHRoZSBmaWx0ZXIgc3RyaW5nIGhhZCBhIGJsdXIgY29tcG9uZW50LCByZXR1cm4ganVzdCB0aGUgYmx1ciB2YWx1ZSBhbmQgdW5pdCB0eXBlLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKGJsdXJDb21wb25lbnQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0ZXh0cmFjdGVkID0gYmx1ckNvbXBvbmVudFsxXTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0LyogSWYgdGhlIGNvbXBvbmVudCBkb2Vzbid0IGV4aXN0LCBkZWZhdWx0IGJsdXIgdG8gMC4gKi9cblx0XHRcdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGV4dHJhY3RlZCA9IDA7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGV4dHJhY3RlZDtcblx0XHRcdFx0XHRcdFx0XHQvKiBCbHVyIG5lZWRzIHRvIGJlIHJlLXdyYXBwZWQgZHVyaW5nIGluamVjdGlvbi4gKi9cblx0XHRcdFx0XHRcdFx0Y2FzZSBcImluamVjdFwiOlxuXHRcdFx0XHRcdFx0XHRcdC8qIEZvciB0aGUgYmx1ciBlZmZlY3QgdG8gYmUgZnVsbHkgZGUtYXBwbGllZCwgaXQgbmVlZHMgdG8gYmUgc2V0IHRvIFwibm9uZVwiIGluc3RlYWQgb2YgMC4gKi9cblx0XHRcdFx0XHRcdFx0XHRpZiAoIXBhcnNlRmxvYXQocHJvcGVydHlWYWx1ZSkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBcIm5vbmVcIjtcblx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIFwiYmx1cihcIiArIHByb3BlcnR5VmFsdWUgKyBcIilcIjtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHQvKiA8PUlFOCBkbyBub3Qgc3VwcG9ydCB0aGUgc3RhbmRhcmQgb3BhY2l0eSBwcm9wZXJ0eS4gVGhleSB1c2UgZmlsdGVyOmFscGhhKG9wYWNpdHk9SU5UKSBpbnN0ZWFkLiAqL1xuXHRcdFx0XHRcdG9wYWNpdHk6IGZ1bmN0aW9uKHR5cGUsIGVsZW1lbnQsIHByb3BlcnR5VmFsdWUpIHtcblx0XHRcdFx0XHRcdGlmIChJRSA8PSA4KSB7XG5cdFx0XHRcdFx0XHRcdHN3aXRjaCAodHlwZSkge1xuXHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJuYW1lXCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gXCJmaWx0ZXJcIjtcblx0XHRcdFx0XHRcdFx0XHRjYXNlIFwiZXh0cmFjdFwiOlxuXHRcdFx0XHRcdFx0XHRcdFx0LyogPD1JRTggcmV0dXJuIGEgXCJmaWx0ZXJcIiB2YWx1ZSBvZiBcImFscGhhKG9wYWNpdHk9XFxkezEsM30pXCIuXG5cdFx0XHRcdFx0XHRcdFx0XHQgRXh0cmFjdCB0aGUgdmFsdWUgYW5kIGNvbnZlcnQgaXQgdG8gYSBkZWNpbWFsIHZhbHVlIHRvIG1hdGNoIHRoZSBzdGFuZGFyZCBDU1Mgb3BhY2l0eSBwcm9wZXJ0eSdzIGZvcm1hdHRpbmcuICovXG5cdFx0XHRcdFx0XHRcdFx0XHR2YXIgZXh0cmFjdGVkID0gcHJvcGVydHlWYWx1ZS50b1N0cmluZygpLm1hdGNoKC9hbHBoYVxcKG9wYWNpdHk9KC4qKVxcKS9pKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKGV4dHJhY3RlZCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQvKiBDb252ZXJ0IHRvIGRlY2ltYWwgdmFsdWUuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHByb3BlcnR5VmFsdWUgPSBleHRyYWN0ZWRbMV0gLyAxMDA7XG5cdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQvKiBXaGVuIGV4dHJhY3Rpbmcgb3BhY2l0eSwgZGVmYXVsdCB0byAxIHNpbmNlIGEgbnVsbCB2YWx1ZSBtZWFucyBvcGFjaXR5IGhhc24ndCBiZWVuIHNldC4gKi9cblx0XHRcdFx0XHRcdFx0XHRcdFx0cHJvcGVydHlWYWx1ZSA9IDE7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBwcm9wZXJ0eVZhbHVlO1xuXHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJpbmplY3RcIjpcblx0XHRcdFx0XHRcdFx0XHRcdC8qIE9wYWNpZmllZCBlbGVtZW50cyBhcmUgcmVxdWlyZWQgdG8gaGF2ZSB0aGVpciB6b29tIHByb3BlcnR5IHNldCB0byBhIG5vbi16ZXJvIHZhbHVlLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0ZWxlbWVudC5zdHlsZS56b29tID0gMTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0LyogU2V0dGluZyB0aGUgZmlsdGVyIHByb3BlcnR5IG9uIGVsZW1lbnRzIHdpdGggY2VydGFpbiBmb250IHByb3BlcnR5IGNvbWJpbmF0aW9ucyBjYW4gcmVzdWx0IGluIGFcblx0XHRcdFx0XHRcdFx0XHRcdCBoaWdobHkgdW5hcHBlYWxpbmcgdWx0cmEtYm9sZGluZyBlZmZlY3QuIFRoZXJlJ3Mgbm8gd2F5IHRvIHJlbWVkeSB0aGlzIHRocm91Z2hvdXQgYSB0d2VlbiwgYnV0IGRyb3BwaW5nIHRoZVxuXHRcdFx0XHRcdFx0XHRcdFx0IHZhbHVlIGFsdG9nZXRoZXIgKHdoZW4gb3BhY2l0eSBoaXRzIDEpIGF0IGxlYXN0cyBlbnN1cmVzIHRoYXQgdGhlIGdsaXRjaCBpcyBnb25lIHBvc3QtdHdlZW5pbmcuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAocGFyc2VGbG9hdChwcm9wZXJ0eVZhbHVlKSA+PSAxKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBcIlwiO1xuXHRcdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0LyogQXMgcGVyIHRoZSBmaWx0ZXIgcHJvcGVydHkncyBzcGVjLCBjb252ZXJ0IHRoZSBkZWNpbWFsIHZhbHVlIHRvIGEgd2hvbGUgbnVtYmVyIGFuZCB3cmFwIHRoZSB2YWx1ZS4gKi9cblx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIFwiYWxwaGEob3BhY2l0eT1cIiArIHBhcnNlSW50KHBhcnNlRmxvYXQocHJvcGVydHlWYWx1ZSkgKiAxMDAsIDEwKSArIFwiKVwiO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdC8qIFdpdGggYWxsIG90aGVyIGJyb3dzZXJzLCBub3JtYWxpemF0aW9uIGlzIG5vdCByZXF1aXJlZDsgcmV0dXJuIHRoZSBzYW1lIHZhbHVlcyB0aGF0IHdlcmUgcGFzc2VkIGluLiAqL1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0c3dpdGNoICh0eXBlKSB7XG5cdFx0XHRcdFx0XHRcdFx0Y2FzZSBcIm5hbWVcIjpcblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBcIm9wYWNpdHlcIjtcblx0XHRcdFx0XHRcdFx0XHRjYXNlIFwiZXh0cmFjdFwiOlxuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIHByb3BlcnR5VmFsdWU7XG5cdFx0XHRcdFx0XHRcdFx0Y2FzZSBcImluamVjdFwiOlxuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIHByb3BlcnR5VmFsdWU7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sXG5cdFx0XHRcdC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0XHQgQmF0Y2hlZCBSZWdpc3RyYXRpb25zXG5cdFx0XHRcdCAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0XHQvKiBOb3RlOiBCYXRjaGVkIG5vcm1hbGl6YXRpb25zIGV4dGVuZCB0aGUgQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWQgb2JqZWN0LiAqL1xuXHRcdFx0XHRyZWdpc3RlcjogZnVuY3Rpb24oKSB7XG5cblx0XHRcdFx0XHQvKioqKioqKioqKioqKioqKipcblx0XHRcdFx0XHQgVHJhbnNmb3Jtc1xuXHRcdFx0XHRcdCAqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0XHRcdC8qIFRyYW5zZm9ybXMgYXJlIHRoZSBzdWJwcm9wZXJ0aWVzIGNvbnRhaW5lZCBieSB0aGUgQ1NTIFwidHJhbnNmb3JtXCIgcHJvcGVydHkuIFRyYW5zZm9ybXMgbXVzdCB1bmRlcmdvIG5vcm1hbGl6YXRpb25cblx0XHRcdFx0XHQgc28gdGhhdCB0aGV5IGNhbiBiZSByZWZlcmVuY2VkIGluIGEgcHJvcGVydGllcyBtYXAgYnkgdGhlaXIgaW5kaXZpZHVhbCBuYW1lcy4gKi9cblx0XHRcdFx0XHQvKiBOb3RlOiBXaGVuIHRyYW5zZm9ybXMgYXJlIFwic2V0XCIsIHRoZXkgYXJlIGFjdHVhbGx5IGFzc2lnbmVkIHRvIGEgcGVyLWVsZW1lbnQgdHJhbnNmb3JtQ2FjaGUuIFdoZW4gYWxsIHRyYW5zZm9ybVxuXHRcdFx0XHRcdCBzZXR0aW5nIGlzIGNvbXBsZXRlIGNvbXBsZXRlLCBDU1MuZmx1c2hUcmFuc2Zvcm1DYWNoZSgpIG11c3QgYmUgbWFudWFsbHkgY2FsbGVkIHRvIGZsdXNoIHRoZSB2YWx1ZXMgdG8gdGhlIERPTS5cblx0XHRcdFx0XHQgVHJhbnNmb3JtIHNldHRpbmcgaXMgYmF0Y2hlZCBpbiB0aGlzIHdheSB0byBpbXByb3ZlIHBlcmZvcm1hbmNlOiB0aGUgdHJhbnNmb3JtIHN0eWxlIG9ubHkgbmVlZHMgdG8gYmUgdXBkYXRlZFxuXHRcdFx0XHRcdCBvbmNlIHdoZW4gbXVsdGlwbGUgdHJhbnNmb3JtIHN1YnByb3BlcnRpZXMgYXJlIGJlaW5nIGFuaW1hdGVkIHNpbXVsdGFuZW91c2x5LiAqL1xuXHRcdFx0XHRcdC8qIE5vdGU6IElFOSBhbmQgQW5kcm9pZCBHaW5nZXJicmVhZCBoYXZlIHN1cHBvcnQgZm9yIDJEIC0tIGJ1dCBub3QgM0QgLS0gdHJhbnNmb3Jtcy4gU2luY2UgYW5pbWF0aW5nIHVuc3VwcG9ydGVkXG5cdFx0XHRcdFx0IHRyYW5zZm9ybSBwcm9wZXJ0aWVzIHJlc3VsdHMgaW4gdGhlIGJyb3dzZXIgaWdub3JpbmcgdGhlICplbnRpcmUqIHRyYW5zZm9ybSBzdHJpbmcsIHdlIHByZXZlbnQgdGhlc2UgM0QgdmFsdWVzXG5cdFx0XHRcdFx0IGZyb20gYmVpbmcgbm9ybWFsaXplZCBmb3IgdGhlc2UgYnJvd3NlcnMgc28gdGhhdCB0d2VlbmluZyBza2lwcyB0aGVzZSBwcm9wZXJ0aWVzIGFsdG9nZXRoZXJcblx0XHRcdFx0XHQgKHNpbmNlIGl0IHdpbGwgaWdub3JlIHRoZW0gYXMgYmVpbmcgdW5zdXBwb3J0ZWQgYnkgdGhlIGJyb3dzZXIuKSAqL1xuXHRcdFx0XHRcdGlmICgoIUlFIHx8IElFID4gOSkgJiYgIVZlbG9jaXR5LlN0YXRlLmlzR2luZ2VyYnJlYWQpIHtcblx0XHRcdFx0XHRcdC8qIE5vdGU6IFNpbmNlIHRoZSBzdGFuZGFsb25lIENTUyBcInBlcnNwZWN0aXZlXCIgcHJvcGVydHkgYW5kIHRoZSBDU1MgdHJhbnNmb3JtIFwicGVyc3BlY3RpdmVcIiBzdWJwcm9wZXJ0eVxuXHRcdFx0XHRcdFx0IHNoYXJlIHRoZSBzYW1lIG5hbWUsIHRoZSBsYXR0ZXIgaXMgZ2l2ZW4gYSB1bmlxdWUgdG9rZW4gd2l0aGluIFZlbG9jaXR5OiBcInRyYW5zZm9ybVBlcnNwZWN0aXZlXCIuICovXG5cdFx0XHRcdFx0XHRDU1MuTGlzdHMudHJhbnNmb3Jtc0Jhc2UgPSBDU1MuTGlzdHMudHJhbnNmb3Jtc0Jhc2UuY29uY2F0KENTUy5MaXN0cy50cmFuc2Zvcm1zM0QpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgQ1NTLkxpc3RzLnRyYW5zZm9ybXNCYXNlLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0XHQvKiBXcmFwIHRoZSBkeW5hbWljYWxseSBnZW5lcmF0ZWQgbm9ybWFsaXphdGlvbiBmdW5jdGlvbiBpbiBhIG5ldyBzY29wZSBzbyB0aGF0IHRyYW5zZm9ybU5hbWUncyB2YWx1ZSBpc1xuXHRcdFx0XHRcdFx0IHBhaXJlZCB3aXRoIGl0cyByZXNwZWN0aXZlIGZ1bmN0aW9uLiAoT3RoZXJ3aXNlLCBhbGwgZnVuY3Rpb25zIHdvdWxkIHRha2UgdGhlIGZpbmFsIGZvciBsb29wJ3MgdHJhbnNmb3JtTmFtZS4pICovXG5cdFx0XHRcdFx0XHQoZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRcdHZhciB0cmFuc2Zvcm1OYW1lID0gQ1NTLkxpc3RzLnRyYW5zZm9ybXNCYXNlW2ldO1xuXG5cdFx0XHRcdFx0XHRcdENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3RyYW5zZm9ybU5hbWVdID0gZnVuY3Rpb24odHlwZSwgZWxlbWVudCwgcHJvcGVydHlWYWx1ZSkge1xuXHRcdFx0XHRcdFx0XHRcdHN3aXRjaCAodHlwZSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0LyogVGhlIG5vcm1hbGl6ZWQgcHJvcGVydHkgbmFtZSBpcyB0aGUgcGFyZW50IFwidHJhbnNmb3JtXCIgcHJvcGVydHkgLS0gdGhlIHByb3BlcnR5IHRoYXQgaXMgYWN0dWFsbHkgc2V0IGluIENTUy4gKi9cblx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJuYW1lXCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBcInRyYW5zZm9ybVwiO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQvKiBUcmFuc2Zvcm0gdmFsdWVzIGFyZSBjYWNoZWQgb250byBhIHBlci1lbGVtZW50IHRyYW5zZm9ybUNhY2hlIG9iamVjdC4gKi9cblx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJleHRyYWN0XCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8qIElmIHRoaXMgdHJhbnNmb3JtIGhhcyB5ZXQgdG8gYmUgYXNzaWduZWQgYSB2YWx1ZSwgcmV0dXJuIGl0cyBudWxsIHZhbHVlLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoRGF0YShlbGVtZW50KSA9PT0gdW5kZWZpbmVkIHx8IERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGVbdHJhbnNmb3JtTmFtZV0gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8qIFNjYWxlIENTUy5MaXN0cy50cmFuc2Zvcm1zQmFzZSBkZWZhdWx0IHRvIDEgd2hlcmVhcyBhbGwgb3RoZXIgdHJhbnNmb3JtIHByb3BlcnRpZXMgZGVmYXVsdCB0byAwLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiAvXnNjYWxlL2kudGVzdCh0cmFuc2Zvcm1OYW1lKSA/IDEgOiAwO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8qIFdoZW4gdHJhbnNmb3JtIHZhbHVlcyBhcmUgc2V0LCB0aGV5IGFyZSB3cmFwcGVkIGluIHBhcmVudGhlc2VzIGFzIHBlciB0aGUgQ1NTIHNwZWMuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0IFRodXMsIHdoZW4gZXh0cmFjdGluZyB0aGVpciB2YWx1ZXMgKGZvciB0d2VlbiBjYWxjdWxhdGlvbnMpLCB3ZSBzdHJpcCBvZmYgdGhlIHBhcmVudGhlc2VzLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdLnJlcGxhY2UoL1soKV0vZywgXCJcIik7XG5cdFx0XHRcdFx0XHRcdFx0XHRjYXNlIFwiaW5qZWN0XCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHZhciBpbnZhbGlkID0gZmFsc2U7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0LyogSWYgYW4gaW5kaXZpZHVhbCB0cmFuc2Zvcm0gcHJvcGVydHkgY29udGFpbnMgYW4gdW5zdXBwb3J0ZWQgdW5pdCB0eXBlLCB0aGUgYnJvd3NlciBpZ25vcmVzIHRoZSAqZW50aXJlKiB0cmFuc2Zvcm0gcHJvcGVydHkuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCBUaHVzLCBwcm90ZWN0IHVzZXJzIGZyb20gdGhlbXNlbHZlcyBieSBza2lwcGluZyBzZXR0aW5nIGZvciB0cmFuc2Zvcm0gdmFsdWVzIHN1cHBsaWVkIHdpdGggaW52YWxpZCB1bml0IHR5cGVzLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQvKiBTd2l0Y2ggb24gdGhlIGJhc2UgdHJhbnNmb3JtIHR5cGU7IGlnbm9yZSB0aGUgYXhpcyBieSByZW1vdmluZyB0aGUgbGFzdCBsZXR0ZXIgZnJvbSB0aGUgdHJhbnNmb3JtJ3MgbmFtZS4gKi9cblx0XHRcdFx0XHRcdFx0XHRcdFx0c3dpdGNoICh0cmFuc2Zvcm1OYW1lLnN1YnN0cigwLCB0cmFuc2Zvcm1OYW1lLmxlbmd0aCAtIDEpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0LyogV2hpdGVsaXN0IHVuaXQgdHlwZXMgZm9yIGVhY2ggdHJhbnNmb3JtLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJ0cmFuc2xhdGVcIjpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGludmFsaWQgPSAhLyglfHB4fGVtfHJlbXx2d3x2aHxcXGQpJC9pLnRlc3QocHJvcGVydHlWYWx1ZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8qIFNpbmNlIGFuIGF4aXMtZnJlZSBcInNjYWxlXCIgcHJvcGVydHkgaXMgc3VwcG9ydGVkIGFzIHdlbGwsIGEgbGl0dGxlIGhhY2sgaXMgdXNlZCBoZXJlIHRvIGRldGVjdCBpdCBieSBjaG9wcGluZyBvZmYgaXRzIGxhc3QgbGV0dGVyLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJzY2FsXCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y2FzZSBcInNjYWxlXCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvKiBDaHJvbWUgb24gQW5kcm9pZCBoYXMgYSBidWcgaW4gd2hpY2ggc2NhbGVkIGVsZW1lbnRzIGJsdXIgaWYgdGhlaXIgaW5pdGlhbCBzY2FsZVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0IHZhbHVlIGlzIGJlbG93IDEgKHdoaWNoIGNhbiBoYXBwZW4gd2l0aCBmb3JjZWZlZWRpbmcpLiBUaHVzLCB3ZSBkZXRlY3QgYSB5ZXQtdW5zZXQgc2NhbGUgcHJvcGVydHlcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCBhbmQgZW5zdXJlIHRoYXQgaXRzIGZpcnN0IHZhbHVlIGlzIGFsd2F5cyAxLiBNb3JlIGluZm86IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA0MTc4OTAvY3NzMy1hbmltYXRpb25zLXdpdGgtdHJhbnNmb3JtLWNhdXNlcy1ibHVycmVkLWVsZW1lbnRzLW9uLXdlYmtpdC8xMDQxNzk2MiMxMDQxNzk2MiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKFZlbG9jaXR5LlN0YXRlLmlzQW5kcm9pZCAmJiBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdID09PSB1bmRlZmluZWQgJiYgcHJvcGVydHlWYWx1ZSA8IDEpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cHJvcGVydHlWYWx1ZSA9IDE7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGludmFsaWQgPSAhLyhcXGQpJC9pLnRlc3QocHJvcGVydHlWYWx1ZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjYXNlIFwic2tld1wiOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0aW52YWxpZCA9ICEvKGRlZ3xcXGQpJC9pLnRlc3QocHJvcGVydHlWYWx1ZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjYXNlIFwicm90YXRlXCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpbnZhbGlkID0gIS8oZGVnfFxcZCkkL2kudGVzdChwcm9wZXJ0eVZhbHVlKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKCFpbnZhbGlkKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0LyogQXMgcGVyIHRoZSBDU1Mgc3BlYywgd3JhcCB0aGUgdmFsdWUgaW4gcGFyZW50aGVzZXMuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0RGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXSA9IFwiKFwiICsgcHJvcGVydHlWYWx1ZSArIFwiKVwiO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0LyogQWx0aG91Z2ggdGhlIHZhbHVlIGlzIHNldCBvbiB0aGUgdHJhbnNmb3JtQ2FjaGUgb2JqZWN0LCByZXR1cm4gdGhlIG5ld2x5LXVwZGF0ZWQgdmFsdWUgZm9yIHRoZSBjYWxsaW5nIGNvZGUgdG8gcHJvY2VzcyBhcyBub3JtYWwuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdH0pKCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0LyoqKioqKioqKioqKipcblx0XHRcdFx0XHQgQ29sb3JzXG5cdFx0XHRcdFx0ICoqKioqKioqKioqKiovXG5cblx0XHRcdFx0XHQvKiBTaW5jZSBWZWxvY2l0eSBvbmx5IGFuaW1hdGVzIGEgc2luZ2xlIG51bWVyaWMgdmFsdWUgcGVyIHByb3BlcnR5LCBjb2xvciBhbmltYXRpb24gaXMgYWNoaWV2ZWQgYnkgaG9va2luZyB0aGUgaW5kaXZpZHVhbCBSR0JBIGNvbXBvbmVudHMgb2YgQ1NTIGNvbG9yIHByb3BlcnRpZXMuXG5cdFx0XHRcdFx0IEFjY29yZGluZ2x5LCBjb2xvciB2YWx1ZXMgbXVzdCBiZSBub3JtYWxpemVkIChlLmcuIFwiI2ZmMDAwMFwiLCBcInJlZFwiLCBhbmQgXCJyZ2IoMjU1LCAwLCAwKVwiID09PiBcIjI1NSAwIDAgMVwiKSBzbyB0aGF0IHRoZWlyIGNvbXBvbmVudHMgY2FuIGJlIGluamVjdGVkL2V4dHJhY3RlZCBieSBDU1MuSG9va3MgbG9naWMuICovXG5cdFx0XHRcdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBDU1MuTGlzdHMuY29sb3JzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdFx0XHQvKiBXcmFwIHRoZSBkeW5hbWljYWxseSBnZW5lcmF0ZWQgbm9ybWFsaXphdGlvbiBmdW5jdGlvbiBpbiBhIG5ldyBzY29wZSBzbyB0aGF0IGNvbG9yTmFtZSdzIHZhbHVlIGlzIHBhaXJlZCB3aXRoIGl0cyByZXNwZWN0aXZlIGZ1bmN0aW9uLlxuXHRcdFx0XHRcdFx0IChPdGhlcndpc2UsIGFsbCBmdW5jdGlvbnMgd291bGQgdGFrZSB0aGUgZmluYWwgZm9yIGxvb3AncyBjb2xvck5hbWUuKSAqL1xuXHRcdFx0XHRcdFx0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHR2YXIgY29sb3JOYW1lID0gQ1NTLkxpc3RzLmNvbG9yc1tqXTtcblxuXHRcdFx0XHRcdFx0XHQvKiBOb3RlOiBJbiBJRTw9OCwgd2hpY2ggc3VwcG9ydCByZ2IgYnV0IG5vdCByZ2JhLCBjb2xvciBwcm9wZXJ0aWVzIGFyZSByZXZlcnRlZCB0byByZ2IgYnkgc3RyaXBwaW5nIG9mZiB0aGUgYWxwaGEgY29tcG9uZW50LiAqL1xuXHRcdFx0XHRcdFx0XHRDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtjb2xvck5hbWVdID0gZnVuY3Rpb24odHlwZSwgZWxlbWVudCwgcHJvcGVydHlWYWx1ZSkge1xuXHRcdFx0XHRcdFx0XHRcdHN3aXRjaCAodHlwZSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y2FzZSBcIm5hbWVcIjpcblx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGNvbG9yTmFtZTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0LyogQ29udmVydCBhbGwgY29sb3IgdmFsdWVzIGludG8gdGhlIHJnYiBmb3JtYXQuIChPbGQgSUUgY2FuIHJldHVybiBoZXggdmFsdWVzIGFuZCBjb2xvciBuYW1lcyBpbnN0ZWFkIG9mIHJnYi9yZ2JhLikgKi9cblx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJleHRyYWN0XCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHZhciBleHRyYWN0ZWQ7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0LyogSWYgdGhlIGNvbG9yIGlzIGFscmVhZHkgaW4gaXRzIGhvb2thYmxlIGZvcm0gKGUuZy4gXCIyNTUgMjU1IDI1NSAxXCIpIGR1ZSB0byBoYXZpbmcgYmVlbiBwcmV2aW91c2x5IGV4dHJhY3RlZCwgc2tpcCBleHRyYWN0aW9uLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoQ1NTLlJlZ0V4LndyYXBwZWRWYWx1ZUFscmVhZHlFeHRyYWN0ZWQudGVzdChwcm9wZXJ0eVZhbHVlKSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGV4dHJhY3RlZCA9IHByb3BlcnR5VmFsdWU7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dmFyIGNvbnZlcnRlZCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y29sb3JOYW1lcyA9IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRibGFjazogXCJyZ2IoMCwgMCwgMClcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRibHVlOiBcInJnYigwLCAwLCAyNTUpXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Z3JheTogXCJyZ2IoMTI4LCAxMjgsIDEyOClcIixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRncmVlbjogXCJyZ2IoMCwgMTI4LCAwKVwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJlZDogXCJyZ2IoMjU1LCAwLCAwKVwiLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHdoaXRlOiBcInJnYigyNTUsIDI1NSwgMjU1KVwiXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvKiBDb252ZXJ0IGNvbG9yIG5hbWVzIHRvIHJnYi4gKi9cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoL15bQS16XSskL2kudGVzdChwcm9wZXJ0eVZhbHVlKSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKGNvbG9yTmFtZXNbcHJvcGVydHlWYWx1ZV0gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjb252ZXJ0ZWQgPSBjb2xvck5hbWVzW3Byb3BlcnR5VmFsdWVdO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0LyogSWYgYW4gdW5tYXRjaGVkIGNvbG9yIG5hbWUgaXMgcHJvdmlkZWQsIGRlZmF1bHQgdG8gYmxhY2suICovXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnZlcnRlZCA9IGNvbG9yTmFtZXMuYmxhY2s7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvKiBDb252ZXJ0IGhleCB2YWx1ZXMgdG8gcmdiLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoQ1NTLlJlZ0V4LmlzSGV4LnRlc3QocHJvcGVydHlWYWx1ZSkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnZlcnRlZCA9IFwicmdiKFwiICsgQ1NTLlZhbHVlcy5oZXhUb1JnYihwcm9wZXJ0eVZhbHVlKS5qb2luKFwiIFwiKSArIFwiKVwiO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0LyogSWYgdGhlIHByb3ZpZGVkIGNvbG9yIGRvZXNuJ3QgbWF0Y2ggYW55IG9mIHRoZSBhY2NlcHRlZCBjb2xvciBmb3JtYXRzLCBkZWZhdWx0IHRvIGJsYWNrLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoISgvXnJnYmE/XFwoL2kudGVzdChwcm9wZXJ0eVZhbHVlKSkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnZlcnRlZCA9IGNvbG9yTmFtZXMuYmxhY2s7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0LyogUmVtb3ZlIHRoZSBzdXJyb3VuZGluZyBcInJnYi9yZ2JhKClcIiBzdHJpbmcgdGhlbiByZXBsYWNlIGNvbW1hcyB3aXRoIHNwYWNlcyBhbmQgc3RyaXBcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQgcmVwZWF0ZWQgc3BhY2VzIChpbiBjYXNlIHRoZSB2YWx1ZSBpbmNsdWRlZCBzcGFjZXMgdG8gYmVnaW4gd2l0aCkuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZXh0cmFjdGVkID0gKGNvbnZlcnRlZCB8fCBwcm9wZXJ0eVZhbHVlKS50b1N0cmluZygpLm1hdGNoKENTUy5SZWdFeC52YWx1ZVVud3JhcClbMV0ucmVwbGFjZSgvLChcXHMrKT8vZywgXCIgXCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0LyogU28gbG9uZyBhcyB0aGlzIGlzbid0IDw9SUU4LCBhZGQgYSBmb3VydGggKGFscGhhKSBjb21wb25lbnQgaWYgaXQncyBtaXNzaW5nIGFuZCBkZWZhdWx0IGl0IHRvIDEgKHZpc2libGUpLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoKCFJRSB8fCBJRSA+IDgpICYmIGV4dHJhY3RlZC5zcGxpdChcIiBcIikubGVuZ3RoID09PSAzKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZXh0cmFjdGVkICs9IFwiIDFcIjtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBleHRyYWN0ZWQ7XG5cdFx0XHRcdFx0XHRcdFx0XHRjYXNlIFwiaW5qZWN0XCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8qIElmIHRoaXMgaXMgSUU8PTggYW5kIGFuIGFscGhhIGNvbXBvbmVudCBleGlzdHMsIHN0cmlwIGl0IG9mZi4gKi9cblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKElFIDw9IDgpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAocHJvcGVydHlWYWx1ZS5zcGxpdChcIiBcIikubGVuZ3RoID09PSA0KSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRwcm9wZXJ0eVZhbHVlID0gcHJvcGVydHlWYWx1ZS5zcGxpdCgvXFxzKy8pLnNsaWNlKDAsIDMpLmpvaW4oXCIgXCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvKiBPdGhlcndpc2UsIGFkZCBhIGZvdXJ0aCAoYWxwaGEpIGNvbXBvbmVudCBpZiBpdCdzIG1pc3NpbmcgYW5kIGRlZmF1bHQgaXQgdG8gMSAodmlzaWJsZSkuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0gZWxzZSBpZiAocHJvcGVydHlWYWx1ZS5zcGxpdChcIiBcIikubGVuZ3RoID09PSAzKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cHJvcGVydHlWYWx1ZSArPSBcIiAxXCI7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0XHQvKiBSZS1pbnNlcnQgdGhlIGJyb3dzZXItYXBwcm9wcmlhdGUgd3JhcHBlcihcInJnYi9yZ2JhKClcIiksIGluc2VydCBjb21tYXMsIGFuZCBzdHJpcCBvZmYgZGVjaW1hbCB1bml0c1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQgb24gYWxsIHZhbHVlcyBidXQgdGhlIGZvdXJ0aCAoUiwgRywgYW5kIEIgb25seSBhY2NlcHQgd2hvbGUgbnVtYmVycykuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiAoSUUgPD0gOCA/IFwicmdiXCIgOiBcInJnYmFcIikgKyBcIihcIiArIHByb3BlcnR5VmFsdWUucmVwbGFjZSgvXFxzKy9nLCBcIixcIikucmVwbGFjZSgvXFwuKFxcZCkrKD89LCkvZywgXCJcIikgKyBcIilcIjtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHR9KSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdC8qKioqKioqKioqKioqKioqKioqKioqKipcblx0XHRcdCBDU1MgUHJvcGVydHkgTmFtZXNcblx0XHRcdCAqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdE5hbWVzOiB7XG5cdFx0XHRcdC8qIENhbWVsY2FzZSBhIHByb3BlcnR5IG5hbWUgaW50byBpdHMgSmF2YVNjcmlwdCBub3RhdGlvbiAoZS5nLiBcImJhY2tncm91bmQtY29sb3JcIiA9PT4gXCJiYWNrZ3JvdW5kQ29sb3JcIikuXG5cdFx0XHRcdCBDYW1lbGNhc2luZyBpcyB1c2VkIHRvIG5vcm1hbGl6ZSBwcm9wZXJ0eSBuYW1lcyBiZXR3ZWVuIGFuZCBhY3Jvc3MgY2FsbHMuICovXG5cdFx0XHRcdGNhbWVsQ2FzZTogZnVuY3Rpb24ocHJvcGVydHkpIHtcblx0XHRcdFx0XHRyZXR1cm4gcHJvcGVydHkucmVwbGFjZSgvLShcXHcpL2csIGZ1bmN0aW9uKG1hdGNoLCBzdWJNYXRjaCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHN1Yk1hdGNoLnRvVXBwZXJDYXNlKCk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdC8qIEZvciBTVkcgZWxlbWVudHMsIHNvbWUgcHJvcGVydGllcyAobmFtZWx5LCBkaW1lbnNpb25hbCBvbmVzKSBhcmUgR0VUL1NFVCB2aWEgdGhlIGVsZW1lbnQncyBIVE1MIGF0dHJpYnV0ZXMgKGluc3RlYWQgb2YgdmlhIENTUyBzdHlsZXMpLiAqL1xuXHRcdFx0XHRTVkdBdHRyaWJ1dGU6IGZ1bmN0aW9uKHByb3BlcnR5KSB7XG5cdFx0XHRcdFx0dmFyIFNWR0F0dHJpYnV0ZXMgPSBcIndpZHRofGhlaWdodHx4fHl8Y3h8Y3l8cnxyeHxyeXx4MXx4Mnx5MXx5MlwiO1xuXG5cdFx0XHRcdFx0LyogQ2VydGFpbiBicm93c2VycyByZXF1aXJlIGFuIFNWRyB0cmFuc2Zvcm0gdG8gYmUgYXBwbGllZCBhcyBhbiBhdHRyaWJ1dGUuIChPdGhlcndpc2UsIGFwcGxpY2F0aW9uIHZpYSBDU1MgaXMgcHJlZmVyYWJsZSBkdWUgdG8gM0Qgc3VwcG9ydC4pICovXG5cdFx0XHRcdFx0aWYgKElFIHx8IChWZWxvY2l0eS5TdGF0ZS5pc0FuZHJvaWQgJiYgIVZlbG9jaXR5LlN0YXRlLmlzQ2hyb21lKSkge1xuXHRcdFx0XHRcdFx0U1ZHQXR0cmlidXRlcyArPSBcInx0cmFuc2Zvcm1cIjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gbmV3IFJlZ0V4cChcIl4oXCIgKyBTVkdBdHRyaWJ1dGVzICsgXCIpJFwiLCBcImlcIikudGVzdChwcm9wZXJ0eSk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdC8qIERldGVybWluZSB3aGV0aGVyIGEgcHJvcGVydHkgc2hvdWxkIGJlIHNldCB3aXRoIGEgdmVuZG9yIHByZWZpeC4gKi9cblx0XHRcdFx0LyogSWYgYSBwcmVmaXhlZCB2ZXJzaW9uIG9mIHRoZSBwcm9wZXJ0eSBleGlzdHMsIHJldHVybiBpdC4gT3RoZXJ3aXNlLCByZXR1cm4gdGhlIG9yaWdpbmFsIHByb3BlcnR5IG5hbWUuXG5cdFx0XHRcdCBJZiB0aGUgcHJvcGVydHkgaXMgbm90IGF0IGFsbCBzdXBwb3J0ZWQgYnkgdGhlIGJyb3dzZXIsIHJldHVybiBhIGZhbHNlIGZsYWcuICovXG5cdFx0XHRcdHByZWZpeENoZWNrOiBmdW5jdGlvbihwcm9wZXJ0eSkge1xuXHRcdFx0XHRcdC8qIElmIHRoaXMgcHJvcGVydHkgaGFzIGFscmVhZHkgYmVlbiBjaGVja2VkLCByZXR1cm4gdGhlIGNhY2hlZCB2YWx1ZS4gKi9cblx0XHRcdFx0XHRpZiAoVmVsb2NpdHkuU3RhdGUucHJlZml4TWF0Y2hlc1twcm9wZXJ0eV0pIHtcblx0XHRcdFx0XHRcdHJldHVybiBbVmVsb2NpdHkuU3RhdGUucHJlZml4TWF0Y2hlc1twcm9wZXJ0eV0sIHRydWVdO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHR2YXIgdmVuZG9ycyA9IFtcIlwiLCBcIldlYmtpdFwiLCBcIk1velwiLCBcIm1zXCIsIFwiT1wiXTtcblxuXHRcdFx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIHZlbmRvcnNMZW5ndGggPSB2ZW5kb3JzLmxlbmd0aDsgaSA8IHZlbmRvcnNMZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0XHR2YXIgcHJvcGVydHlQcmVmaXhlZDtcblxuXHRcdFx0XHRcdFx0XHRpZiAoaSA9PT0gMCkge1xuXHRcdFx0XHRcdFx0XHRcdHByb3BlcnR5UHJlZml4ZWQgPSBwcm9wZXJ0eTtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHQvKiBDYXBpdGFsaXplIHRoZSBmaXJzdCBsZXR0ZXIgb2YgdGhlIHByb3BlcnR5IHRvIGNvbmZvcm0gdG8gSmF2YVNjcmlwdCB2ZW5kb3IgcHJlZml4IG5vdGF0aW9uIChlLmcuIHdlYmtpdEZpbHRlcikuICovXG5cdFx0XHRcdFx0XHRcdFx0cHJvcGVydHlQcmVmaXhlZCA9IHZlbmRvcnNbaV0gKyBwcm9wZXJ0eS5yZXBsYWNlKC9eXFx3LywgZnVuY3Rpb24obWF0Y2gpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBtYXRjaC50b1VwcGVyQ2FzZSgpO1xuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0LyogQ2hlY2sgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgdGhpcyBwcm9wZXJ0eSBhcyBwcmVmaXhlZC4gKi9cblx0XHRcdFx0XHRcdFx0aWYgKFR5cGUuaXNTdHJpbmcoVmVsb2NpdHkuU3RhdGUucHJlZml4RWxlbWVudC5zdHlsZVtwcm9wZXJ0eVByZWZpeGVkXSkpIHtcblx0XHRcdFx0XHRcdFx0XHQvKiBDYWNoZSB0aGUgbWF0Y2guICovXG5cdFx0XHRcdFx0XHRcdFx0VmVsb2NpdHkuU3RhdGUucHJlZml4TWF0Y2hlc1twcm9wZXJ0eV0gPSBwcm9wZXJ0eVByZWZpeGVkO1xuXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIFtwcm9wZXJ0eVByZWZpeGVkLCB0cnVlXTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvKiBJZiB0aGUgYnJvd3NlciBkb2Vzbid0IHN1cHBvcnQgdGhpcyBwcm9wZXJ0eSBpbiBhbnkgZm9ybSwgaW5jbHVkZSBhIGZhbHNlIGZsYWcgc28gdGhhdCB0aGUgY2FsbGVyIGNhbiBkZWNpZGUgaG93IHRvIHByb2NlZWQuICovXG5cdFx0XHRcdFx0XHRyZXR1cm4gW3Byb3BlcnR5LCBmYWxzZV07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0LyoqKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0IENTUyBQcm9wZXJ0eSBWYWx1ZXNcblx0XHRcdCAqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdFZhbHVlczoge1xuXHRcdFx0XHQvKiBIZXggdG8gUkdCIGNvbnZlcnNpb24uIENvcHlyaWdodCBUaW0gRG93bjogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy81NjIzODM4L3JnYi10by1oZXgtYW5kLWhleC10by1yZ2IgKi9cblx0XHRcdFx0aGV4VG9SZ2I6IGZ1bmN0aW9uKGhleCkge1xuXHRcdFx0XHRcdHZhciBzaG9ydGZvcm1SZWdleCA9IC9eIz8oW2EtZlxcZF0pKFthLWZcXGRdKShbYS1mXFxkXSkkL2ksXG5cdFx0XHRcdFx0XHRcdGxvbmdmb3JtUmVnZXggPSAvXiM/KFthLWZcXGRdezJ9KShbYS1mXFxkXXsyfSkoW2EtZlxcZF17Mn0pJC9pLFxuXHRcdFx0XHRcdFx0XHRyZ2JQYXJ0cztcblxuXHRcdFx0XHRcdGhleCA9IGhleC5yZXBsYWNlKHNob3J0Zm9ybVJlZ2V4LCBmdW5jdGlvbihtLCByLCBnLCBiKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gciArIHIgKyBnICsgZyArIGIgKyBiO1xuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0cmdiUGFydHMgPSBsb25nZm9ybVJlZ2V4LmV4ZWMoaGV4KTtcblxuXHRcdFx0XHRcdHJldHVybiByZ2JQYXJ0cyA/IFtwYXJzZUludChyZ2JQYXJ0c1sxXSwgMTYpLCBwYXJzZUludChyZ2JQYXJ0c1syXSwgMTYpLCBwYXJzZUludChyZ2JQYXJ0c1szXSwgMTYpXSA6IFswLCAwLCAwXTtcblx0XHRcdFx0fSxcblx0XHRcdFx0aXNDU1NOdWxsVmFsdWU6IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRcdFx0LyogVGhlIGJyb3dzZXIgZGVmYXVsdHMgQ1NTIHZhbHVlcyB0aGF0IGhhdmUgbm90IGJlZW4gc2V0IHRvIGVpdGhlciAwIG9yIG9uZSBvZiBzZXZlcmFsIHBvc3NpYmxlIG51bGwtdmFsdWUgc3RyaW5ncy5cblx0XHRcdFx0XHQgVGh1cywgd2UgY2hlY2sgZm9yIGJvdGggZmFsc2luZXNzIGFuZCB0aGVzZSBzcGVjaWFsIHN0cmluZ3MuICovXG5cdFx0XHRcdFx0LyogTnVsbC12YWx1ZSBjaGVja2luZyBpcyBwZXJmb3JtZWQgdG8gZGVmYXVsdCB0aGUgc3BlY2lhbCBzdHJpbmdzIHRvIDAgKGZvciB0aGUgc2FrZSBvZiB0d2VlbmluZykgb3IgdGhlaXIgaG9va1xuXHRcdFx0XHRcdCB0ZW1wbGF0ZXMgYXMgZGVmaW5lZCBhcyBDU1MuSG9va3MgKGZvciB0aGUgc2FrZSBvZiBob29rIGluamVjdGlvbi9leHRyYWN0aW9uKS4gKi9cblx0XHRcdFx0XHQvKiBOb3RlOiBDaHJvbWUgcmV0dXJucyBcInJnYmEoMCwgMCwgMCwgMClcIiBmb3IgYW4gdW5kZWZpbmVkIGNvbG9yIHdoZXJlYXMgSUUgcmV0dXJucyBcInRyYW5zcGFyZW50XCIuICovXG5cdFx0XHRcdFx0cmV0dXJuICghdmFsdWUgfHwgL14obm9uZXxhdXRvfHRyYW5zcGFyZW50fChyZ2JhXFwoMCwgPzAsID8wLCA/MFxcKSkpJC9pLnRlc3QodmFsdWUpKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0LyogUmV0cmlldmUgYSBwcm9wZXJ0eSdzIGRlZmF1bHQgdW5pdCB0eXBlLiBVc2VkIGZvciBhc3NpZ25pbmcgYSB1bml0IHR5cGUgd2hlbiBvbmUgaXMgbm90IHN1cHBsaWVkIGJ5IHRoZSB1c2VyLiAqL1xuXHRcdFx0XHRnZXRVbml0VHlwZTogZnVuY3Rpb24ocHJvcGVydHkpIHtcblx0XHRcdFx0XHRpZiAoL14ocm90YXRlfHNrZXcpL2kudGVzdChwcm9wZXJ0eSkpIHtcblx0XHRcdFx0XHRcdHJldHVybiBcImRlZ1wiO1xuXHRcdFx0XHRcdH0gZWxzZSBpZiAoLyheKHNjYWxlfHNjYWxlWHxzY2FsZVl8c2NhbGVafGFscGhhfGZsZXhHcm93fGZsZXhIZWlnaHR8ekluZGV4fGZvbnRXZWlnaHQpJCl8KChvcGFjaXR5fHJlZHxncmVlbnxibHVlfGFscGhhKSQpL2kudGVzdChwcm9wZXJ0eSkpIHtcblx0XHRcdFx0XHRcdC8qIFRoZSBhYm92ZSBwcm9wZXJ0aWVzIGFyZSB1bml0bGVzcy4gKi9cblx0XHRcdFx0XHRcdHJldHVybiBcIlwiO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHQvKiBEZWZhdWx0IHRvIHB4IGZvciBhbGwgb3RoZXIgcHJvcGVydGllcy4gKi9cblx0XHRcdFx0XHRcdHJldHVybiBcInB4XCI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHQvKiBIVE1MIGVsZW1lbnRzIGRlZmF1bHQgdG8gYW4gYXNzb2NpYXRlZCBkaXNwbGF5IHR5cGUgd2hlbiB0aGV5J3JlIG5vdCBzZXQgdG8gZGlzcGxheTpub25lLiAqL1xuXHRcdFx0XHQvKiBOb3RlOiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgZm9yIGNvcnJlY3RseSBzZXR0aW5nIHRoZSBub24tXCJub25lXCIgZGlzcGxheSB2YWx1ZSBpbiBjZXJ0YWluIFZlbG9jaXR5IHJlZGlyZWN0cywgc3VjaCBhcyBmYWRlSW4vT3V0LiAqL1xuXHRcdFx0XHRnZXREaXNwbGF5VHlwZTogZnVuY3Rpb24oZWxlbWVudCkge1xuXHRcdFx0XHRcdHZhciB0YWdOYW1lID0gZWxlbWVudCAmJiBlbGVtZW50LnRhZ05hbWUudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpO1xuXG5cdFx0XHRcdFx0aWYgKC9eKGJ8YmlnfGl8c21hbGx8dHR8YWJicnxhY3JvbnltfGNpdGV8Y29kZXxkZm58ZW18a2JkfHN0cm9uZ3xzYW1wfHZhcnxhfGJkb3xicnxpbWd8bWFwfG9iamVjdHxxfHNjcmlwdHxzcGFufHN1YnxzdXB8YnV0dG9ufGlucHV0fGxhYmVsfHNlbGVjdHx0ZXh0YXJlYSkkL2kudGVzdCh0YWdOYW1lKSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFwiaW5saW5lXCI7XG5cdFx0XHRcdFx0fSBlbHNlIGlmICgvXihsaSkkL2kudGVzdCh0YWdOYW1lKSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFwibGlzdC1pdGVtXCI7XG5cdFx0XHRcdFx0fSBlbHNlIGlmICgvXih0cikkL2kudGVzdCh0YWdOYW1lKSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFwidGFibGUtcm93XCI7XG5cdFx0XHRcdFx0fSBlbHNlIGlmICgvXih0YWJsZSkkL2kudGVzdCh0YWdOYW1lKSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFwidGFibGVcIjtcblx0XHRcdFx0XHR9IGVsc2UgaWYgKC9eKHRib2R5KSQvaS50ZXN0KHRhZ05hbWUpKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gXCJ0YWJsZS1yb3ctZ3JvdXBcIjtcblx0XHRcdFx0XHRcdC8qIERlZmF1bHQgdG8gXCJibG9ja1wiIHdoZW4gbm8gbWF0Y2ggaXMgZm91bmQuICovXG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHJldHVybiBcImJsb2NrXCI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHQvKiBUaGUgY2xhc3MgYWRkL3JlbW92ZSBmdW5jdGlvbnMgYXJlIHVzZWQgdG8gdGVtcG9yYXJpbHkgYXBwbHkgYSBcInZlbG9jaXR5LWFuaW1hdGluZ1wiIGNsYXNzIHRvIGVsZW1lbnRzIHdoaWxlIHRoZXkncmUgYW5pbWF0aW5nLiAqL1xuXHRcdFx0XHRhZGRDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgY2xhc3NOYW1lKSB7XG5cdFx0XHRcdFx0aWYgKGVsZW1lbnQuY2xhc3NMaXN0KSB7XG5cdFx0XHRcdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5jbGFzc05hbWUgKz0gKGVsZW1lbnQuY2xhc3NOYW1lLmxlbmd0aCA/IFwiIFwiIDogXCJcIikgKyBjbGFzc05hbWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LFxuXHRcdFx0XHRyZW1vdmVDbGFzczogZnVuY3Rpb24oZWxlbWVudCwgY2xhc3NOYW1lKSB7XG5cdFx0XHRcdFx0aWYgKGVsZW1lbnQuY2xhc3NMaXN0KSB7XG5cdFx0XHRcdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5jbGFzc05hbWUgPSBlbGVtZW50LmNsYXNzTmFtZS50b1N0cmluZygpLnJlcGxhY2UobmV3IFJlZ0V4cChcIihefFxcXFxzKVwiICsgY2xhc3NOYW1lLnNwbGl0KFwiIFwiKS5qb2luKFwifFwiKSArIFwiKFxcXFxzfCQpXCIsIFwiZ2lcIiksIFwiIFwiKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHQvKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0IFN0eWxlIEdldHRpbmcgJiBTZXR0aW5nXG5cdFx0XHQgKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0LyogVGhlIHNpbmd1bGFyIGdldFByb3BlcnR5VmFsdWUsIHdoaWNoIHJvdXRlcyB0aGUgbG9naWMgZm9yIGFsbCBub3JtYWxpemF0aW9ucywgaG9va3MsIGFuZCBzdGFuZGFyZCBDU1MgcHJvcGVydGllcy4gKi9cblx0XHRcdGdldFByb3BlcnR5VmFsdWU6IGZ1bmN0aW9uKGVsZW1lbnQsIHByb3BlcnR5LCByb290UHJvcGVydHlWYWx1ZSwgZm9yY2VTdHlsZUxvb2t1cCkge1xuXHRcdFx0XHQvKiBHZXQgYW4gZWxlbWVudCdzIGNvbXB1dGVkIHByb3BlcnR5IHZhbHVlLiAqL1xuXHRcdFx0XHQvKiBOb3RlOiBSZXRyaWV2aW5nIHRoZSB2YWx1ZSBvZiBhIENTUyBwcm9wZXJ0eSBjYW5ub3Qgc2ltcGx5IGJlIHBlcmZvcm1lZCBieSBjaGVja2luZyBhbiBlbGVtZW50J3Ncblx0XHRcdFx0IHN0eWxlIGF0dHJpYnV0ZSAod2hpY2ggb25seSByZWZsZWN0cyB1c2VyLWRlZmluZWQgdmFsdWVzKS4gSW5zdGVhZCwgdGhlIGJyb3dzZXIgbXVzdCBiZSBxdWVyaWVkIGZvciBhIHByb3BlcnR5J3Ncblx0XHRcdFx0ICpjb21wdXRlZCogdmFsdWUuIFlvdSBjYW4gcmVhZCBtb3JlIGFib3V0IGdldENvbXB1dGVkU3R5bGUgaGVyZTogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vZG9jcy9XZWIvQVBJL3dpbmRvdy5nZXRDb21wdXRlZFN0eWxlICovXG5cdFx0XHRcdGZ1bmN0aW9uIGNvbXB1dGVQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIHByb3BlcnR5KSB7XG5cdFx0XHRcdFx0LyogV2hlbiBib3gtc2l6aW5nIGlzbid0IHNldCB0byBib3JkZXItYm94LCBoZWlnaHQgYW5kIHdpZHRoIHN0eWxlIHZhbHVlcyBhcmUgaW5jb3JyZWN0bHkgY29tcHV0ZWQgd2hlbiBhblxuXHRcdFx0XHRcdCBlbGVtZW50J3Mgc2Nyb2xsYmFycyBhcmUgdmlzaWJsZSAod2hpY2ggZXhwYW5kcyB0aGUgZWxlbWVudCdzIGRpbWVuc2lvbnMpLiBUaHVzLCB3ZSBkZWZlciB0byB0aGUgbW9yZSBhY2N1cmF0ZVxuXHRcdFx0XHRcdCBvZmZzZXRIZWlnaHQvV2lkdGggcHJvcGVydHksIHdoaWNoIGluY2x1ZGVzIHRoZSB0b3RhbCBkaW1lbnNpb25zIGZvciBpbnRlcmlvciwgYm9yZGVyLCBwYWRkaW5nLCBhbmQgc2Nyb2xsYmFyLlxuXHRcdFx0XHRcdCBXZSBzdWJ0cmFjdCBib3JkZXIgYW5kIHBhZGRpbmcgdG8gZ2V0IHRoZSBzdW0gb2YgaW50ZXJpb3IgKyBzY3JvbGxiYXIuICovXG5cdFx0XHRcdFx0dmFyIGNvbXB1dGVkVmFsdWUgPSAwO1xuXG5cdFx0XHRcdFx0LyogSUU8PTggZG9lc24ndCBzdXBwb3J0IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlLCB0aHVzIHdlIGRlZmVyIHRvIGpRdWVyeSwgd2hpY2ggaGFzIGFuIGV4dGVuc2l2ZSBhcnJheVxuXHRcdFx0XHRcdCBvZiBoYWNrcyB0byBhY2N1cmF0ZWx5IHJldHJpZXZlIElFOCBwcm9wZXJ0eSB2YWx1ZXMuIFJlLWltcGxlbWVudGluZyB0aGF0IGxvZ2ljIGhlcmUgaXMgbm90IHdvcnRoIGJsb2F0aW5nIHRoZVxuXHRcdFx0XHRcdCBjb2RlYmFzZSBmb3IgYSBkeWluZyBicm93c2VyLiBUaGUgcGVyZm9ybWFuY2UgcmVwZXJjdXNzaW9ucyBvZiB1c2luZyBqUXVlcnkgaGVyZSBhcmUgbWluaW1hbCBzaW5jZVxuXHRcdFx0XHRcdCBWZWxvY2l0eSBpcyBvcHRpbWl6ZWQgdG8gcmFyZWx5IChhbmQgc29tZXRpbWVzIG5ldmVyKSBxdWVyeSB0aGUgRE9NLiBGdXJ0aGVyLCB0aGUgJC5jc3MoKSBjb2RlcGF0aCBpc24ndCB0aGF0IHNsb3cuICovXG5cdFx0XHRcdFx0aWYgKElFIDw9IDgpIHtcblx0XHRcdFx0XHRcdGNvbXB1dGVkVmFsdWUgPSAkLmNzcyhlbGVtZW50LCBwcm9wZXJ0eSk7IC8qIEdFVCAqL1xuXHRcdFx0XHRcdFx0LyogQWxsIG90aGVyIGJyb3dzZXJzIHN1cHBvcnQgZ2V0Q29tcHV0ZWRTdHlsZS4gVGhlIHJldHVybmVkIGxpdmUgb2JqZWN0IHJlZmVyZW5jZSBpcyBjYWNoZWQgb250byBpdHNcblx0XHRcdFx0XHRcdCBhc3NvY2lhdGVkIGVsZW1lbnQgc28gdGhhdCBpdCBkb2VzIG5vdCBuZWVkIHRvIGJlIHJlZmV0Y2hlZCB1cG9uIGV2ZXJ5IEdFVC4gKi9cblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0LyogQnJvd3NlcnMgZG8gbm90IHJldHVybiBoZWlnaHQgYW5kIHdpZHRoIHZhbHVlcyBmb3IgZWxlbWVudHMgdGhhdCBhcmUgc2V0IHRvIGRpc3BsYXk6XCJub25lXCIuIFRodXMsIHdlIHRlbXBvcmFyaWx5XG5cdFx0XHRcdFx0XHQgdG9nZ2xlIGRpc3BsYXkgdG8gdGhlIGVsZW1lbnQgdHlwZSdzIGRlZmF1bHQgdmFsdWUuICovXG5cdFx0XHRcdFx0XHR2YXIgdG9nZ2xlRGlzcGxheSA9IGZhbHNlO1xuXG5cdFx0XHRcdFx0XHRpZiAoL14od2lkdGh8aGVpZ2h0KSQvLnRlc3QocHJvcGVydHkpICYmIENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiZGlzcGxheVwiKSA9PT0gMCkge1xuXHRcdFx0XHRcdFx0XHR0b2dnbGVEaXNwbGF5ID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0Q1NTLnNldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJkaXNwbGF5XCIsIENTUy5WYWx1ZXMuZ2V0RGlzcGxheVR5cGUoZWxlbWVudCkpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHR2YXIgcmV2ZXJ0RGlzcGxheSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRpZiAodG9nZ2xlRGlzcGxheSkge1xuXHRcdFx0XHRcdFx0XHRcdENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRcdGlmICghZm9yY2VTdHlsZUxvb2t1cCkge1xuXHRcdFx0XHRcdFx0XHRpZiAocHJvcGVydHkgPT09IFwiaGVpZ2h0XCIgJiYgQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJib3hTaXppbmdcIikudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpICE9PSBcImJvcmRlci1ib3hcIikge1xuXHRcdFx0XHRcdFx0XHRcdHZhciBjb250ZW50Qm94SGVpZ2h0ID0gZWxlbWVudC5vZmZzZXRIZWlnaHQgLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImJvcmRlclRvcFdpZHRoXCIpKSB8fCAwKSAtIChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiYm9yZGVyQm90dG9tV2lkdGhcIikpIHx8IDApIC0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJwYWRkaW5nVG9wXCIpKSB8fCAwKSAtIChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwicGFkZGluZ0JvdHRvbVwiKSkgfHwgMCk7XG5cdFx0XHRcdFx0XHRcdFx0cmV2ZXJ0RGlzcGxheSgpO1xuXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGNvbnRlbnRCb3hIZWlnaHQ7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSBpZiAocHJvcGVydHkgPT09IFwid2lkdGhcIiAmJiBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImJveFNpemluZ1wiKS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgIT09IFwiYm9yZGVyLWJveFwiKSB7XG5cdFx0XHRcdFx0XHRcdFx0dmFyIGNvbnRlbnRCb3hXaWR0aCA9IGVsZW1lbnQub2Zmc2V0V2lkdGggLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImJvcmRlckxlZnRXaWR0aFwiKSkgfHwgMCkgLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImJvcmRlclJpZ2h0V2lkdGhcIikpIHx8IDApIC0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJwYWRkaW5nTGVmdFwiKSkgfHwgMCkgLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInBhZGRpbmdSaWdodFwiKSkgfHwgMCk7XG5cdFx0XHRcdFx0XHRcdFx0cmV2ZXJ0RGlzcGxheSgpO1xuXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGNvbnRlbnRCb3hXaWR0aDtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHR2YXIgY29tcHV0ZWRTdHlsZTtcblxuXHRcdFx0XHRcdFx0LyogRm9yIGVsZW1lbnRzIHRoYXQgVmVsb2NpdHkgaGFzbid0IGJlZW4gY2FsbGVkIG9uIGRpcmVjdGx5IChlLmcuIHdoZW4gVmVsb2NpdHkgcXVlcmllcyB0aGUgRE9NIG9uIGJlaGFsZlxuXHRcdFx0XHRcdFx0IG9mIGEgcGFyZW50IG9mIGFuIGVsZW1lbnQgaXRzIGFuaW1hdGluZyksIHBlcmZvcm0gYSBkaXJlY3QgZ2V0Q29tcHV0ZWRTdHlsZSBsb29rdXAgc2luY2UgdGhlIG9iamVjdCBpc24ndCBjYWNoZWQuICovXG5cdFx0XHRcdFx0XHRpZiAoRGF0YShlbGVtZW50KSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRcdGNvbXB1dGVkU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50LCBudWxsKTsgLyogR0VUICovXG5cdFx0XHRcdFx0XHRcdC8qIElmIHRoZSBjb21wdXRlZFN0eWxlIG9iamVjdCBoYXMgeWV0IHRvIGJlIGNhY2hlZCwgZG8gc28gbm93LiAqL1xuXHRcdFx0XHRcdFx0fSBlbHNlIGlmICghRGF0YShlbGVtZW50KS5jb21wdXRlZFN0eWxlKSB7XG5cdFx0XHRcdFx0XHRcdGNvbXB1dGVkU3R5bGUgPSBEYXRhKGVsZW1lbnQpLmNvbXB1dGVkU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50LCBudWxsKTsgLyogR0VUICovXG5cdFx0XHRcdFx0XHRcdC8qIElmIGNvbXB1dGVkU3R5bGUgaXMgY2FjaGVkLCB1c2UgaXQuICovXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRjb21wdXRlZFN0eWxlID0gRGF0YShlbGVtZW50KS5jb21wdXRlZFN0eWxlO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvKiBJRSBhbmQgRmlyZWZveCBkbyBub3QgcmV0dXJuIGEgdmFsdWUgZm9yIHRoZSBnZW5lcmljIGJvcmRlckNvbG9yIC0tIHRoZXkgb25seSByZXR1cm4gaW5kaXZpZHVhbCB2YWx1ZXMgZm9yIGVhY2ggYm9yZGVyIHNpZGUncyBjb2xvci5cblx0XHRcdFx0XHRcdCBBbHNvLCBpbiBhbGwgYnJvd3NlcnMsIHdoZW4gYm9yZGVyIGNvbG9ycyBhcmVuJ3QgYWxsIHRoZSBzYW1lLCBhIGNvbXBvdW5kIHZhbHVlIGlzIHJldHVybmVkIHRoYXQgVmVsb2NpdHkgaXNuJ3Qgc2V0dXAgdG8gcGFyc2UuXG5cdFx0XHRcdFx0XHQgU28sIGFzIGEgcG9seWZpbGwgZm9yIHF1ZXJ5aW5nIGluZGl2aWR1YWwgYm9yZGVyIHNpZGUgY29sb3JzLCB3ZSBqdXN0IHJldHVybiB0aGUgdG9wIGJvcmRlcidzIGNvbG9yIGFuZCBhbmltYXRlIGFsbCBib3JkZXJzIGZyb20gdGhhdCB2YWx1ZS4gKi9cblx0XHRcdFx0XHRcdGlmIChwcm9wZXJ0eSA9PT0gXCJib3JkZXJDb2xvclwiKSB7XG5cdFx0XHRcdFx0XHRcdHByb3BlcnR5ID0gXCJib3JkZXJUb3BDb2xvclwiO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvKiBJRTkgaGFzIGEgYnVnIGluIHdoaWNoIHRoZSBcImZpbHRlclwiIHByb3BlcnR5IG11c3QgYmUgYWNjZXNzZWQgZnJvbSBjb21wdXRlZFN0eWxlIHVzaW5nIHRoZSBnZXRQcm9wZXJ0eVZhbHVlIG1ldGhvZFxuXHRcdFx0XHRcdFx0IGluc3RlYWQgb2YgYSBkaXJlY3QgcHJvcGVydHkgbG9va3VwLiBUaGUgZ2V0UHJvcGVydHlWYWx1ZSBtZXRob2QgaXMgc2xvd2VyIHRoYW4gYSBkaXJlY3QgbG9va3VwLCB3aGljaCBpcyB3aHkgd2UgYXZvaWQgaXQgYnkgZGVmYXVsdC4gKi9cblx0XHRcdFx0XHRcdGlmIChJRSA9PT0gOSAmJiBwcm9wZXJ0eSA9PT0gXCJmaWx0ZXJcIikge1xuXHRcdFx0XHRcdFx0XHRjb21wdXRlZFZhbHVlID0gY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKHByb3BlcnR5KTsgLyogR0VUICovXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRjb21wdXRlZFZhbHVlID0gY29tcHV0ZWRTdHlsZVtwcm9wZXJ0eV07XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8qIEZhbGwgYmFjayB0byB0aGUgcHJvcGVydHkncyBzdHlsZSB2YWx1ZSAoaWYgZGVmaW5lZCkgd2hlbiBjb21wdXRlZFZhbHVlIHJldHVybnMgbm90aGluZyxcblx0XHRcdFx0XHRcdCB3aGljaCBjYW4gaGFwcGVuIHdoZW4gdGhlIGVsZW1lbnQgaGFzbid0IGJlZW4gcGFpbnRlZC4gKi9cblx0XHRcdFx0XHRcdGlmIChjb21wdXRlZFZhbHVlID09PSBcIlwiIHx8IGNvbXB1dGVkVmFsdWUgPT09IG51bGwpIHtcblx0XHRcdFx0XHRcdFx0Y29tcHV0ZWRWYWx1ZSA9IGVsZW1lbnQuc3R5bGVbcHJvcGVydHldO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRyZXZlcnREaXNwbGF5KCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0LyogRm9yIHRvcCwgcmlnaHQsIGJvdHRvbSwgYW5kIGxlZnQgKFRSQkwpIHZhbHVlcyB0aGF0IGFyZSBzZXQgdG8gXCJhdXRvXCIgb24gZWxlbWVudHMgb2YgXCJmaXhlZFwiIG9yIFwiYWJzb2x1dGVcIiBwb3NpdGlvbixcblx0XHRcdFx0XHQgZGVmZXIgdG8galF1ZXJ5IGZvciBjb252ZXJ0aW5nIFwiYXV0b1wiIHRvIGEgbnVtZXJpYyB2YWx1ZS4gKEZvciBlbGVtZW50cyB3aXRoIGEgXCJzdGF0aWNcIiBvciBcInJlbGF0aXZlXCIgcG9zaXRpb24sIFwiYXV0b1wiIGhhcyB0aGUgc2FtZVxuXHRcdFx0XHRcdCBlZmZlY3QgYXMgYmVpbmcgc2V0IHRvIDAsIHNvIG5vIGNvbnZlcnNpb24gaXMgbmVjZXNzYXJ5LikgKi9cblx0XHRcdFx0XHQvKiBBbiBleGFtcGxlIG9mIHdoeSBudW1lcmljIGNvbnZlcnNpb24gaXMgbmVjZXNzYXJ5OiBXaGVuIGFuIGVsZW1lbnQgd2l0aCBcInBvc2l0aW9uOmFic29sdXRlXCIgaGFzIGFuIHVudG91Y2hlZCBcImxlZnRcIlxuXHRcdFx0XHRcdCBwcm9wZXJ0eSwgd2hpY2ggcmV2ZXJ0cyB0byBcImF1dG9cIiwgbGVmdCdzIHZhbHVlIGlzIDAgcmVsYXRpdmUgdG8gaXRzIHBhcmVudCBlbGVtZW50LCBidXQgaXMgb2Z0ZW4gbm9uLXplcm8gcmVsYXRpdmVcblx0XHRcdFx0XHQgdG8gaXRzICpjb250YWluaW5nKiAobm90IHBhcmVudCkgZWxlbWVudCwgd2hpY2ggaXMgdGhlIG5lYXJlc3QgXCJwb3NpdGlvbjpyZWxhdGl2ZVwiIGFuY2VzdG9yIG9yIHRoZSB2aWV3cG9ydCAoYW5kIGFsd2F5cyB0aGUgdmlld3BvcnQgaW4gdGhlIGNhc2Ugb2YgXCJwb3NpdGlvbjpmaXhlZFwiKS4gKi9cblx0XHRcdFx0XHRpZiAoY29tcHV0ZWRWYWx1ZSA9PT0gXCJhdXRvXCIgJiYgL14odG9wfHJpZ2h0fGJvdHRvbXxsZWZ0KSQvaS50ZXN0KHByb3BlcnR5KSkge1xuXHRcdFx0XHRcdFx0dmFyIHBvc2l0aW9uID0gY29tcHV0ZVByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJwb3NpdGlvblwiKTsgLyogR0VUICovXG5cblx0XHRcdFx0XHRcdC8qIEZvciBhYnNvbHV0ZSBwb3NpdGlvbmluZywgalF1ZXJ5J3MgJC5wb3NpdGlvbigpIG9ubHkgcmV0dXJucyB2YWx1ZXMgZm9yIHRvcCBhbmQgbGVmdDtcblx0XHRcdFx0XHRcdCByaWdodCBhbmQgYm90dG9tIHdpbGwgaGF2ZSB0aGVpciBcImF1dG9cIiB2YWx1ZSByZXZlcnRlZCB0byAwLiAqL1xuXHRcdFx0XHRcdFx0LyogTm90ZTogQSBqUXVlcnkgb2JqZWN0IG11c3QgYmUgY3JlYXRlZCBoZXJlIHNpbmNlIGpRdWVyeSBkb2Vzbid0IGhhdmUgYSBsb3ctbGV2ZWwgYWxpYXMgZm9yICQucG9zaXRpb24oKS5cblx0XHRcdFx0XHRcdCBOb3QgYSBiaWcgZGVhbCBzaW5jZSB3ZSdyZSBjdXJyZW50bHkgaW4gYSBHRVQgYmF0Y2ggYW55d2F5LiAqL1xuXHRcdFx0XHRcdFx0aWYgKHBvc2l0aW9uID09PSBcImZpeGVkXCIgfHwgKHBvc2l0aW9uID09PSBcImFic29sdXRlXCIgJiYgL3RvcHxsZWZ0L2kudGVzdChwcm9wZXJ0eSkpKSB7XG5cdFx0XHRcdFx0XHRcdC8qIE5vdGU6IGpRdWVyeSBzdHJpcHMgdGhlIHBpeGVsIHVuaXQgZnJvbSBpdHMgcmV0dXJuZWQgdmFsdWVzOyB3ZSByZS1hZGQgaXQgaGVyZSB0byBjb25mb3JtIHdpdGggY29tcHV0ZVByb3BlcnR5VmFsdWUncyBiZWhhdmlvci4gKi9cblx0XHRcdFx0XHRcdFx0Y29tcHV0ZWRWYWx1ZSA9ICQoZWxlbWVudCkucG9zaXRpb24oKVtwcm9wZXJ0eV0gKyBcInB4XCI7IC8qIEdFVCAqL1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiBjb21wdXRlZFZhbHVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIHByb3BlcnR5VmFsdWU7XG5cblx0XHRcdFx0LyogSWYgdGhpcyBpcyBhIGhvb2tlZCBwcm9wZXJ0eSAoZS5nLiBcImNsaXBMZWZ0XCIgaW5zdGVhZCBvZiB0aGUgcm9vdCBwcm9wZXJ0eSBvZiBcImNsaXBcIiksXG5cdFx0XHRcdCBleHRyYWN0IHRoZSBob29rJ3MgdmFsdWUgZnJvbSBhIG5vcm1hbGl6ZWQgcm9vdFByb3BlcnR5VmFsdWUgdXNpbmcgQ1NTLkhvb2tzLmV4dHJhY3RWYWx1ZSgpLiAqL1xuXHRcdFx0XHRpZiAoQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbcHJvcGVydHldKSB7XG5cdFx0XHRcdFx0dmFyIGhvb2sgPSBwcm9wZXJ0eSxcblx0XHRcdFx0XHRcdFx0aG9va1Jvb3QgPSBDU1MuSG9va3MuZ2V0Um9vdChob29rKTtcblxuXHRcdFx0XHRcdC8qIElmIGEgY2FjaGVkIHJvb3RQcm9wZXJ0eVZhbHVlIHdhc24ndCBwYXNzZWQgaW4gKHdoaWNoIFZlbG9jaXR5IGFsd2F5cyBhdHRlbXB0cyB0byBkbyBpbiBvcmRlciB0byBhdm9pZCByZXF1ZXJ5aW5nIHRoZSBET00pLFxuXHRcdFx0XHRcdCBxdWVyeSB0aGUgRE9NIGZvciB0aGUgcm9vdCBwcm9wZXJ0eSdzIHZhbHVlLiAqL1xuXHRcdFx0XHRcdGlmIChyb290UHJvcGVydHlWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHQvKiBTaW5jZSB0aGUgYnJvd3NlciBpcyBub3cgYmVpbmcgZGlyZWN0bHkgcXVlcmllZCwgdXNlIHRoZSBvZmZpY2lhbCBwb3N0LXByZWZpeGluZyBwcm9wZXJ0eSBuYW1lIGZvciB0aGlzIGxvb2t1cC4gKi9cblx0XHRcdFx0XHRcdHJvb3RQcm9wZXJ0eVZhbHVlID0gQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgQ1NTLk5hbWVzLnByZWZpeENoZWNrKGhvb2tSb290KVswXSk7IC8qIEdFVCAqL1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8qIElmIHRoaXMgcm9vdCBoYXMgYSBub3JtYWxpemF0aW9uIHJlZ2lzdGVyZWQsIHBlZm9ybSB0aGUgYXNzb2NpYXRlZCBub3JtYWxpemF0aW9uIGV4dHJhY3Rpb24uICovXG5cdFx0XHRcdFx0aWYgKENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW2hvb2tSb290XSkge1xuXHRcdFx0XHRcdFx0cm9vdFByb3BlcnR5VmFsdWUgPSBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtob29rUm9vdF0oXCJleHRyYWN0XCIsIGVsZW1lbnQsIHJvb3RQcm9wZXJ0eVZhbHVlKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvKiBFeHRyYWN0IHRoZSBob29rJ3MgdmFsdWUuICovXG5cdFx0XHRcdFx0cHJvcGVydHlWYWx1ZSA9IENTUy5Ib29rcy5leHRyYWN0VmFsdWUoaG9vaywgcm9vdFByb3BlcnR5VmFsdWUpO1xuXG5cdFx0XHRcdFx0LyogSWYgdGhpcyBpcyBhIG5vcm1hbGl6ZWQgcHJvcGVydHkgKGUuZy4gXCJvcGFjaXR5XCIgYmVjb21lcyBcImZpbHRlclwiIGluIDw9SUU4KSBvciBcInRyYW5zbGF0ZVhcIiBiZWNvbWVzIFwidHJhbnNmb3JtXCIpLFxuXHRcdFx0XHRcdCBub3JtYWxpemUgdGhlIHByb3BlcnR5J3MgbmFtZSBhbmQgdmFsdWUsIGFuZCBoYW5kbGUgdGhlIHNwZWNpYWwgY2FzZSBvZiB0cmFuc2Zvcm1zLiAqL1xuXHRcdFx0XHRcdC8qIE5vdGU6IE5vcm1hbGl6aW5nIGEgcHJvcGVydHkgaXMgbXV0dWFsbHkgZXhjbHVzaXZlIGZyb20gaG9va2luZyBhIHByb3BlcnR5IHNpbmNlIGhvb2stZXh0cmFjdGVkIHZhbHVlcyBhcmUgc3RyaWN0bHlcblx0XHRcdFx0XHQgbnVtZXJpY2FsIGFuZCB0aGVyZWZvcmUgZG8gbm90IHJlcXVpcmUgbm9ybWFsaXphdGlvbiBleHRyYWN0aW9uLiAqL1xuXHRcdFx0XHR9IGVsc2UgaWYgKENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XSkge1xuXHRcdFx0XHRcdHZhciBub3JtYWxpemVkUHJvcGVydHlOYW1lLFxuXHRcdFx0XHRcdFx0XHRub3JtYWxpemVkUHJvcGVydHlWYWx1ZTtcblxuXHRcdFx0XHRcdG5vcm1hbGl6ZWRQcm9wZXJ0eU5hbWUgPSBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0oXCJuYW1lXCIsIGVsZW1lbnQpO1xuXG5cdFx0XHRcdFx0LyogVHJhbnNmb3JtIHZhbHVlcyBhcmUgY2FsY3VsYXRlZCB2aWEgbm9ybWFsaXphdGlvbiBleHRyYWN0aW9uIChzZWUgYmVsb3cpLCB3aGljaCBjaGVja3MgYWdhaW5zdCB0aGUgZWxlbWVudCdzIHRyYW5zZm9ybUNhY2hlLlxuXHRcdFx0XHRcdCBBdCBubyBwb2ludCBkbyB0cmFuc2Zvcm0gR0VUcyBldmVyIGFjdHVhbGx5IHF1ZXJ5IHRoZSBET007IGluaXRpYWwgc3R5bGVzaGVldCB2YWx1ZXMgYXJlIG5ldmVyIHByb2Nlc3NlZC5cblx0XHRcdFx0XHQgVGhpcyBpcyBiZWNhdXNlIHBhcnNpbmcgM0QgdHJhbnNmb3JtIG1hdHJpY2VzIGlzIG5vdCBhbHdheXMgYWNjdXJhdGUgYW5kIHdvdWxkIGJsb2F0IG91ciBjb2RlYmFzZTtcblx0XHRcdFx0XHQgdGh1cywgbm9ybWFsaXphdGlvbiBleHRyYWN0aW9uIGRlZmF1bHRzIGluaXRpYWwgdHJhbnNmb3JtIHZhbHVlcyB0byB0aGVpciB6ZXJvLXZhbHVlcyAoZS5nLiAxIGZvciBzY2FsZVggYW5kIDAgZm9yIHRyYW5zbGF0ZVgpLiAqL1xuXHRcdFx0XHRcdGlmIChub3JtYWxpemVkUHJvcGVydHlOYW1lICE9PSBcInRyYW5zZm9ybVwiKSB7XG5cdFx0XHRcdFx0XHRub3JtYWxpemVkUHJvcGVydHlWYWx1ZSA9IGNvbXB1dGVQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIENTUy5OYW1lcy5wcmVmaXhDaGVjayhub3JtYWxpemVkUHJvcGVydHlOYW1lKVswXSk7IC8qIEdFVCAqL1xuXG5cdFx0XHRcdFx0XHQvKiBJZiB0aGUgdmFsdWUgaXMgYSBDU1MgbnVsbC12YWx1ZSBhbmQgdGhpcyBwcm9wZXJ0eSBoYXMgYSBob29rIHRlbXBsYXRlLCB1c2UgdGhhdCB6ZXJvLXZhbHVlIHRlbXBsYXRlIHNvIHRoYXQgaG9va3MgY2FuIGJlIGV4dHJhY3RlZCBmcm9tIGl0LiAqL1xuXHRcdFx0XHRcdFx0aWYgKENTUy5WYWx1ZXMuaXNDU1NOdWxsVmFsdWUobm9ybWFsaXplZFByb3BlcnR5VmFsdWUpICYmIENTUy5Ib29rcy50ZW1wbGF0ZXNbcHJvcGVydHldKSB7XG5cdFx0XHRcdFx0XHRcdG5vcm1hbGl6ZWRQcm9wZXJ0eVZhbHVlID0gQ1NTLkhvb2tzLnRlbXBsYXRlc1twcm9wZXJ0eV1bMV07XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cHJvcGVydHlWYWx1ZSA9IENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XShcImV4dHJhY3RcIiwgZWxlbWVudCwgbm9ybWFsaXplZFByb3BlcnR5VmFsdWUpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0LyogSWYgYSAobnVtZXJpYykgdmFsdWUgd2Fzbid0IHByb2R1Y2VkIHZpYSBob29rIGV4dHJhY3Rpb24gb3Igbm9ybWFsaXphdGlvbiwgcXVlcnkgdGhlIERPTS4gKi9cblx0XHRcdFx0aWYgKCEvXltcXGQtXS8udGVzdChwcm9wZXJ0eVZhbHVlKSkge1xuXHRcdFx0XHRcdC8qIEZvciBTVkcgZWxlbWVudHMsIGRpbWVuc2lvbmFsIHByb3BlcnRpZXMgKHdoaWNoIFNWR0F0dHJpYnV0ZSgpIGRldGVjdHMpIGFyZSB0d2VlbmVkIHZpYVxuXHRcdFx0XHRcdCB0aGVpciBIVE1MIGF0dHJpYnV0ZSB2YWx1ZXMgaW5zdGVhZCBvZiB0aGVpciBDU1Mgc3R5bGUgdmFsdWVzLiAqL1xuXHRcdFx0XHRcdHZhciBkYXRhID0gRGF0YShlbGVtZW50KTtcblxuXHRcdFx0XHRcdGlmIChkYXRhICYmIGRhdGEuaXNTVkcgJiYgQ1NTLk5hbWVzLlNWR0F0dHJpYnV0ZShwcm9wZXJ0eSkpIHtcblx0XHRcdFx0XHRcdC8qIFNpbmNlIHRoZSBoZWlnaHQvd2lkdGggYXR0cmlidXRlIHZhbHVlcyBtdXN0IGJlIHNldCBtYW51YWxseSwgdGhleSBkb24ndCByZWZsZWN0IGNvbXB1dGVkIHZhbHVlcy5cblx0XHRcdFx0XHRcdCBUaHVzLCB3ZSB1c2UgdXNlIGdldEJCb3goKSB0byBlbnN1cmUgd2UgYWx3YXlzIGdldCB2YWx1ZXMgZm9yIGVsZW1lbnRzIHdpdGggdW5kZWZpbmVkIGhlaWdodC93aWR0aCBhdHRyaWJ1dGVzLiAqL1xuXHRcdFx0XHRcdFx0aWYgKC9eKGhlaWdodHx3aWR0aCkkL2kudGVzdChwcm9wZXJ0eSkpIHtcblx0XHRcdFx0XHRcdFx0LyogRmlyZWZveCB0aHJvd3MgYW4gZXJyb3IgaWYgLmdldEJCb3goKSBpcyBjYWxsZWQgb24gYW4gU1ZHIHRoYXQgaXNuJ3QgYXR0YWNoZWQgdG8gdGhlIERPTS4gKi9cblx0XHRcdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdFx0XHRwcm9wZXJ0eVZhbHVlID0gZWxlbWVudC5nZXRCQm94KClbcHJvcGVydHldO1xuXHRcdFx0XHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdFx0XHRcdHByb3BlcnR5VmFsdWUgPSAwO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdC8qIE90aGVyd2lzZSwgYWNjZXNzIHRoZSBhdHRyaWJ1dGUgdmFsdWUgZGlyZWN0bHkuICovXG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRwcm9wZXJ0eVZhbHVlID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUocHJvcGVydHkpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRwcm9wZXJ0eVZhbHVlID0gY29tcHV0ZVByb3BlcnR5VmFsdWUoZWxlbWVudCwgQ1NTLk5hbWVzLnByZWZpeENoZWNrKHByb3BlcnR5KVswXSk7IC8qIEdFVCAqL1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8qIFNpbmNlIHByb3BlcnR5IGxvb2t1cHMgYXJlIGZvciBhbmltYXRpb24gcHVycG9zZXMgKHdoaWNoIGVudGFpbHMgY29tcHV0aW5nIHRoZSBudW1lcmljIGRlbHRhIGJldHdlZW4gc3RhcnQgYW5kIGVuZCB2YWx1ZXMpLFxuXHRcdFx0XHQgY29udmVydCBDU1MgbnVsbC12YWx1ZXMgdG8gYW4gaW50ZWdlciBvZiB2YWx1ZSAwLiAqL1xuXHRcdFx0XHRpZiAoQ1NTLlZhbHVlcy5pc0NTU051bGxWYWx1ZShwcm9wZXJ0eVZhbHVlKSkge1xuXHRcdFx0XHRcdHByb3BlcnR5VmFsdWUgPSAwO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKFZlbG9jaXR5LmRlYnVnID49IDIpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcIkdldCBcIiArIHByb3BlcnR5ICsgXCI6IFwiICsgcHJvcGVydHlWYWx1ZSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gcHJvcGVydHlWYWx1ZTtcblx0XHRcdH0sXG5cdFx0XHQvKiBUaGUgc2luZ3VsYXIgc2V0UHJvcGVydHlWYWx1ZSwgd2hpY2ggcm91dGVzIHRoZSBsb2dpYyBmb3IgYWxsIG5vcm1hbGl6YXRpb25zLCBob29rcywgYW5kIHN0YW5kYXJkIENTUyBwcm9wZXJ0aWVzLiAqL1xuXHRcdFx0c2V0UHJvcGVydHlWYWx1ZTogZnVuY3Rpb24oZWxlbWVudCwgcHJvcGVydHksIHByb3BlcnR5VmFsdWUsIHJvb3RQcm9wZXJ0eVZhbHVlLCBzY3JvbGxEYXRhKSB7XG5cdFx0XHRcdHZhciBwcm9wZXJ0eU5hbWUgPSBwcm9wZXJ0eTtcblxuXHRcdFx0XHQvKiBJbiBvcmRlciB0byBiZSBzdWJqZWN0ZWQgdG8gY2FsbCBvcHRpb25zIGFuZCBlbGVtZW50IHF1ZXVlaW5nLCBzY3JvbGwgYW5pbWF0aW9uIGlzIHJvdXRlZCB0aHJvdWdoIFZlbG9jaXR5IGFzIGlmIGl0IHdlcmUgYSBzdGFuZGFyZCBDU1MgcHJvcGVydHkuICovXG5cdFx0XHRcdGlmIChwcm9wZXJ0eSA9PT0gXCJzY3JvbGxcIikge1xuXHRcdFx0XHRcdC8qIElmIGEgY29udGFpbmVyIG9wdGlvbiBpcyBwcmVzZW50LCBzY3JvbGwgdGhlIGNvbnRhaW5lciBpbnN0ZWFkIG9mIHRoZSBicm93c2VyIHdpbmRvdy4gKi9cblx0XHRcdFx0XHRpZiAoc2Nyb2xsRGF0YS5jb250YWluZXIpIHtcblx0XHRcdFx0XHRcdHNjcm9sbERhdGEuY29udGFpbmVyW1wic2Nyb2xsXCIgKyBzY3JvbGxEYXRhLmRpcmVjdGlvbl0gPSBwcm9wZXJ0eVZhbHVlO1xuXHRcdFx0XHRcdFx0LyogT3RoZXJ3aXNlLCBWZWxvY2l0eSBkZWZhdWx0cyB0byBzY3JvbGxpbmcgdGhlIGJyb3dzZXIgd2luZG93LiAqL1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRpZiAoc2Nyb2xsRGF0YS5kaXJlY3Rpb24gPT09IFwiTGVmdFwiKSB7XG5cdFx0XHRcdFx0XHRcdHdpbmRvdy5zY3JvbGxUbyhwcm9wZXJ0eVZhbHVlLCBzY3JvbGxEYXRhLmFsdGVybmF0ZVZhbHVlKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdHdpbmRvdy5zY3JvbGxUbyhzY3JvbGxEYXRhLmFsdGVybmF0ZVZhbHVlLCBwcm9wZXJ0eVZhbHVlKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0LyogVHJhbnNmb3JtcyAodHJhbnNsYXRlWCwgcm90YXRlWiwgZXRjLikgYXJlIGFwcGxpZWQgdG8gYSBwZXItZWxlbWVudCB0cmFuc2Zvcm1DYWNoZSBvYmplY3QsIHdoaWNoIGlzIG1hbnVhbGx5IGZsdXNoZWQgdmlhIGZsdXNoVHJhbnNmb3JtQ2FjaGUoKS5cblx0XHRcdFx0XHQgVGh1cywgZm9yIG5vdywgd2UgbWVyZWx5IGNhY2hlIHRyYW5zZm9ybXMgYmVpbmcgU0VULiAqL1xuXHRcdFx0XHRcdGlmIChDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0gJiYgQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbcHJvcGVydHldKFwibmFtZVwiLCBlbGVtZW50KSA9PT0gXCJ0cmFuc2Zvcm1cIikge1xuXHRcdFx0XHRcdFx0LyogUGVyZm9ybSBhIG5vcm1hbGl6YXRpb24gaW5qZWN0aW9uLiAqL1xuXHRcdFx0XHRcdFx0LyogTm90ZTogVGhlIG5vcm1hbGl6YXRpb24gbG9naWMgaGFuZGxlcyB0aGUgdHJhbnNmb3JtQ2FjaGUgdXBkYXRpbmcuICovXG5cdFx0XHRcdFx0XHRDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0oXCJpbmplY3RcIiwgZWxlbWVudCwgcHJvcGVydHlWYWx1ZSk7XG5cblx0XHRcdFx0XHRcdHByb3BlcnR5TmFtZSA9IFwidHJhbnNmb3JtXCI7XG5cdFx0XHRcdFx0XHRwcm9wZXJ0eVZhbHVlID0gRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVtwcm9wZXJ0eV07XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdC8qIEluamVjdCBob29rcy4gKi9cblx0XHRcdFx0XHRcdGlmIChDU1MuSG9va3MucmVnaXN0ZXJlZFtwcm9wZXJ0eV0pIHtcblx0XHRcdFx0XHRcdFx0dmFyIGhvb2tOYW1lID0gcHJvcGVydHksXG5cdFx0XHRcdFx0XHRcdFx0XHRob29rUm9vdCA9IENTUy5Ib29rcy5nZXRSb290KHByb3BlcnR5KTtcblxuXHRcdFx0XHRcdFx0XHQvKiBJZiBhIGNhY2hlZCByb290UHJvcGVydHlWYWx1ZSB3YXMgbm90IHByb3ZpZGVkLCBxdWVyeSB0aGUgRE9NIGZvciB0aGUgaG9va1Jvb3QncyBjdXJyZW50IHZhbHVlLiAqL1xuXHRcdFx0XHRcdFx0XHRyb290UHJvcGVydHlWYWx1ZSA9IHJvb3RQcm9wZXJ0eVZhbHVlIHx8IENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIGhvb2tSb290KTsgLyogR0VUICovXG5cblx0XHRcdFx0XHRcdFx0cHJvcGVydHlWYWx1ZSA9IENTUy5Ib29rcy5pbmplY3RWYWx1ZShob29rTmFtZSwgcHJvcGVydHlWYWx1ZSwgcm9vdFByb3BlcnR5VmFsdWUpO1xuXHRcdFx0XHRcdFx0XHRwcm9wZXJ0eSA9IGhvb2tSb290O1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvKiBOb3JtYWxpemUgbmFtZXMgYW5kIHZhbHVlcy4gKi9cblx0XHRcdFx0XHRcdGlmIChDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0pIHtcblx0XHRcdFx0XHRcdFx0cHJvcGVydHlWYWx1ZSA9IENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XShcImluamVjdFwiLCBlbGVtZW50LCBwcm9wZXJ0eVZhbHVlKTtcblx0XHRcdFx0XHRcdFx0cHJvcGVydHkgPSBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0oXCJuYW1lXCIsIGVsZW1lbnQpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvKiBBc3NpZ24gdGhlIGFwcHJvcHJpYXRlIHZlbmRvciBwcmVmaXggYmVmb3JlIHBlcmZvcm1pbmcgYW4gb2ZmaWNpYWwgc3R5bGUgdXBkYXRlLiAqL1xuXHRcdFx0XHRcdFx0cHJvcGVydHlOYW1lID0gQ1NTLk5hbWVzLnByZWZpeENoZWNrKHByb3BlcnR5KVswXTtcblxuXHRcdFx0XHRcdFx0LyogQSB0cnkvY2F0Y2ggaXMgdXNlZCBmb3IgSUU8PTgsIHdoaWNoIHRocm93cyBhbiBlcnJvciB3aGVuIFwiaW52YWxpZFwiIENTUyB2YWx1ZXMgYXJlIHNldCwgZS5nLiBhIG5lZ2F0aXZlIHdpZHRoLlxuXHRcdFx0XHRcdFx0IFRyeS9jYXRjaCBpcyBhdm9pZGVkIGZvciBvdGhlciBicm93c2VycyBzaW5jZSBpdCBpbmN1cnMgYSBwZXJmb3JtYW5jZSBvdmVyaGVhZC4gKi9cblx0XHRcdFx0XHRcdGlmIChJRSA8PSA4KSB7XG5cdFx0XHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRcdFx0ZWxlbWVudC5zdHlsZVtwcm9wZXJ0eU5hbWVdID0gcHJvcGVydHlWYWx1ZTtcblx0XHRcdFx0XHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAoVmVsb2NpdHkuZGVidWcpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiQnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IFtcIiArIHByb3BlcnR5VmFsdWUgKyBcIl0gZm9yIFtcIiArIHByb3BlcnR5TmFtZSArIFwiXVwiKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0LyogU1ZHIGVsZW1lbnRzIGhhdmUgdGhlaXIgZGltZW5zaW9uYWwgcHJvcGVydGllcyAod2lkdGgsIGhlaWdodCwgeCwgeSwgY3gsIGV0Yy4pIGFwcGxpZWQgZGlyZWN0bHkgYXMgYXR0cmlidXRlcyBpbnN0ZWFkIG9mIGFzIHN0eWxlcy4gKi9cblx0XHRcdFx0XHRcdFx0LyogTm90ZTogSUU4IGRvZXMgbm90IHN1cHBvcnQgU1ZHIGVsZW1lbnRzLCBzbyBpdCdzIG9rYXkgdGhhdCB3ZSBza2lwIGl0IGZvciBTVkcgYW5pbWF0aW9uLiAqL1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0dmFyIGRhdGEgPSBEYXRhKGVsZW1lbnQpO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChkYXRhICYmIGRhdGEuaXNTVkcgJiYgQ1NTLk5hbWVzLlNWR0F0dHJpYnV0ZShwcm9wZXJ0eSkpIHtcblx0XHRcdFx0XHRcdFx0XHQvKiBOb3RlOiBGb3IgU1ZHIGF0dHJpYnV0ZXMsIHZlbmRvci1wcmVmaXhlZCBwcm9wZXJ0eSBuYW1lcyBhcmUgbmV2ZXIgdXNlZC4gKi9cblx0XHRcdFx0XHRcdFx0XHQvKiBOb3RlOiBOb3QgYWxsIENTUyBwcm9wZXJ0aWVzIGNhbiBiZSBhbmltYXRlZCB2aWEgYXR0cmlidXRlcywgYnV0IHRoZSBicm93c2VyIHdvbid0IHRocm93IGFuIGVycm9yIGZvciB1bnN1cHBvcnRlZCBwcm9wZXJ0aWVzLiAqL1xuXHRcdFx0XHRcdFx0XHRcdGVsZW1lbnQuc2V0QXR0cmlidXRlKHByb3BlcnR5LCBwcm9wZXJ0eVZhbHVlKTtcblx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRlbGVtZW50LnN0eWxlW3Byb3BlcnR5TmFtZV0gPSBwcm9wZXJ0eVZhbHVlO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChWZWxvY2l0eS5kZWJ1ZyA+PSAyKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiU2V0IFwiICsgcHJvcGVydHkgKyBcIiAoXCIgKyBwcm9wZXJ0eU5hbWUgKyBcIik6IFwiICsgcHJvcGVydHlWYWx1ZSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0LyogUmV0dXJuIHRoZSBub3JtYWxpemVkIHByb3BlcnR5IG5hbWUgYW5kIHZhbHVlIGluIGNhc2UgdGhlIGNhbGxlciB3YW50cyB0byBrbm93IGhvdyB0aGVzZSB2YWx1ZXMgd2VyZSBtb2RpZmllZCBiZWZvcmUgYmVpbmcgYXBwbGllZCB0byB0aGUgRE9NLiAqL1xuXHRcdFx0XHRyZXR1cm4gW3Byb3BlcnR5TmFtZSwgcHJvcGVydHlWYWx1ZV07XG5cdFx0XHR9LFxuXHRcdFx0LyogVG8gaW5jcmVhc2UgcGVyZm9ybWFuY2UgYnkgYmF0Y2hpbmcgdHJhbnNmb3JtIHVwZGF0ZXMgaW50byBhIHNpbmdsZSBTRVQsIHRyYW5zZm9ybXMgYXJlIG5vdCBkaXJlY3RseSBhcHBsaWVkIHRvIGFuIGVsZW1lbnQgdW50aWwgZmx1c2hUcmFuc2Zvcm1DYWNoZSgpIGlzIGNhbGxlZC4gKi9cblx0XHRcdC8qIE5vdGU6IFZlbG9jaXR5IGFwcGxpZXMgdHJhbnNmb3JtIHByb3BlcnRpZXMgaW4gdGhlIHNhbWUgb3JkZXIgdGhhdCB0aGV5IGFyZSBjaHJvbm9naWNhbGx5IGludHJvZHVjZWQgdG8gdGhlIGVsZW1lbnQncyBDU1Mgc3R5bGVzLiAqL1xuXHRcdFx0Zmx1c2hUcmFuc2Zvcm1DYWNoZTogZnVuY3Rpb24oZWxlbWVudCkge1xuXHRcdFx0XHR2YXIgdHJhbnNmb3JtU3RyaW5nID0gXCJcIixcblx0XHRcdFx0XHRcdGRhdGEgPSBEYXRhKGVsZW1lbnQpO1xuXG5cdFx0XHRcdC8qIENlcnRhaW4gYnJvd3NlcnMgcmVxdWlyZSB0aGF0IFNWRyB0cmFuc2Zvcm1zIGJlIGFwcGxpZWQgYXMgYW4gYXR0cmlidXRlLiBIb3dldmVyLCB0aGUgU1ZHIHRyYW5zZm9ybSBhdHRyaWJ1dGUgdGFrZXMgYSBtb2RpZmllZCB2ZXJzaW9uIG9mIENTUydzIHRyYW5zZm9ybSBzdHJpbmdcblx0XHRcdFx0ICh1bml0cyBhcmUgZHJvcHBlZCBhbmQsIGV4Y2VwdCBmb3Igc2tld1gvWSwgc3VicHJvcGVydGllcyBhcmUgbWVyZ2VkIGludG8gdGhlaXIgbWFzdGVyIHByb3BlcnR5IC0tIGUuZy4gc2NhbGVYIGFuZCBzY2FsZVkgYXJlIG1lcmdlZCBpbnRvIHNjYWxlKFggWSkuICovXG5cdFx0XHRcdGlmICgoSUUgfHwgKFZlbG9jaXR5LlN0YXRlLmlzQW5kcm9pZCAmJiAhVmVsb2NpdHkuU3RhdGUuaXNDaHJvbWUpKSAmJiBkYXRhICYmIGRhdGEuaXNTVkcpIHtcblx0XHRcdFx0XHQvKiBTaW5jZSB0cmFuc2Zvcm0gdmFsdWVzIGFyZSBzdG9yZWQgaW4gdGhlaXIgcGFyZW50aGVzZXMtd3JhcHBlZCBmb3JtLCB3ZSB1c2UgYSBoZWxwZXIgZnVuY3Rpb24gdG8gc3RyaXAgb3V0IHRoZWlyIG51bWVyaWMgdmFsdWVzLlxuXHRcdFx0XHRcdCBGdXJ0aGVyLCBTVkcgdHJhbnNmb3JtIHByb3BlcnRpZXMgb25seSB0YWtlIHVuaXRsZXNzIChyZXByZXNlbnRpbmcgcGl4ZWxzKSB2YWx1ZXMsIHNvIGl0J3Mgb2theSB0aGF0IHBhcnNlRmxvYXQoKSBzdHJpcHMgdGhlIHVuaXQgc3VmZml4ZWQgdG8gdGhlIGZsb2F0IHZhbHVlLiAqL1xuXHRcdFx0XHRcdHZhciBnZXRUcmFuc2Zvcm1GbG9hdCA9IGZ1bmN0aW9uKHRyYW5zZm9ybVByb3BlcnR5KSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCB0cmFuc2Zvcm1Qcm9wZXJ0eSkpO1xuXHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHQvKiBDcmVhdGUgYW4gb2JqZWN0IHRvIG9yZ2FuaXplIGFsbCB0aGUgdHJhbnNmb3JtcyB0aGF0IHdlJ2xsIGFwcGx5IHRvIHRoZSBTVkcgZWxlbWVudC4gVG8ga2VlcCB0aGUgbG9naWMgc2ltcGxlLFxuXHRcdFx0XHRcdCB3ZSBwcm9jZXNzICphbGwqIHRyYW5zZm9ybSBwcm9wZXJ0aWVzIC0tIGV2ZW4gdGhvc2UgdGhhdCBtYXkgbm90IGJlIGV4cGxpY2l0bHkgYXBwbGllZCAoc2luY2UgdGhleSBkZWZhdWx0IHRvIHRoZWlyIHplcm8tdmFsdWVzIGFueXdheSkuICovXG5cdFx0XHRcdFx0dmFyIFNWR1RyYW5zZm9ybXMgPSB7XG5cdFx0XHRcdFx0XHR0cmFuc2xhdGU6IFtnZXRUcmFuc2Zvcm1GbG9hdChcInRyYW5zbGF0ZVhcIiksIGdldFRyYW5zZm9ybUZsb2F0KFwidHJhbnNsYXRlWVwiKV0sXG5cdFx0XHRcdFx0XHRza2V3WDogW2dldFRyYW5zZm9ybUZsb2F0KFwic2tld1hcIildLCBza2V3WTogW2dldFRyYW5zZm9ybUZsb2F0KFwic2tld1lcIildLFxuXHRcdFx0XHRcdFx0LyogSWYgdGhlIHNjYWxlIHByb3BlcnR5IGlzIHNldCAobm9uLTEpLCB1c2UgdGhhdCB2YWx1ZSBmb3IgdGhlIHNjYWxlWCBhbmQgc2NhbGVZIHZhbHVlc1xuXHRcdFx0XHRcdFx0ICh0aGlzIGJlaGF2aW9yIG1pbWljcyB0aGUgcmVzdWx0IG9mIGFuaW1hdGluZyBhbGwgdGhlc2UgcHJvcGVydGllcyBhdCBvbmNlIG9uIEhUTUwgZWxlbWVudHMpLiAqL1xuXHRcdFx0XHRcdFx0c2NhbGU6IGdldFRyYW5zZm9ybUZsb2F0KFwic2NhbGVcIikgIT09IDEgPyBbZ2V0VHJhbnNmb3JtRmxvYXQoXCJzY2FsZVwiKSwgZ2V0VHJhbnNmb3JtRmxvYXQoXCJzY2FsZVwiKV0gOiBbZ2V0VHJhbnNmb3JtRmxvYXQoXCJzY2FsZVhcIiksIGdldFRyYW5zZm9ybUZsb2F0KFwic2NhbGVZXCIpXSxcblx0XHRcdFx0XHRcdC8qIE5vdGU6IFNWRydzIHJvdGF0ZSB0cmFuc2Zvcm0gdGFrZXMgdGhyZWUgdmFsdWVzOiByb3RhdGlvbiBkZWdyZWVzIGZvbGxvd2VkIGJ5IHRoZSBYIGFuZCBZIHZhbHVlc1xuXHRcdFx0XHRcdFx0IGRlZmluaW5nIHRoZSByb3RhdGlvbidzIG9yaWdpbiBwb2ludC4gV2UgaWdub3JlIHRoZSBvcmlnaW4gdmFsdWVzIChkZWZhdWx0IHRoZW0gdG8gMCkuICovXG5cdFx0XHRcdFx0XHRyb3RhdGU6IFtnZXRUcmFuc2Zvcm1GbG9hdChcInJvdGF0ZVpcIiksIDAsIDBdXG5cdFx0XHRcdFx0fTtcblxuXHRcdFx0XHRcdC8qIEl0ZXJhdGUgdGhyb3VnaCB0aGUgdHJhbnNmb3JtIHByb3BlcnRpZXMgaW4gdGhlIHVzZXItZGVmaW5lZCBwcm9wZXJ0eSBtYXAgb3JkZXIuXG5cdFx0XHRcdFx0IChUaGlzIG1pbWljcyB0aGUgYmVoYXZpb3Igb2Ygbm9uLVNWRyB0cmFuc2Zvcm0gYW5pbWF0aW9uLikgKi9cblx0XHRcdFx0XHQkLmVhY2goRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZSwgZnVuY3Rpb24odHJhbnNmb3JtTmFtZSkge1xuXHRcdFx0XHRcdFx0LyogRXhjZXB0IGZvciB3aXRoIHNrZXdYL1ksIHJldmVydCB0aGUgYXhpcy1zcGVjaWZpYyB0cmFuc2Zvcm0gc3VicHJvcGVydGllcyB0byB0aGVpciBheGlzLWZyZWUgbWFzdGVyXG5cdFx0XHRcdFx0XHQgcHJvcGVydGllcyBzbyB0aGF0IHRoZXkgbWF0Y2ggdXAgd2l0aCBTVkcncyBhY2NlcHRlZCB0cmFuc2Zvcm0gcHJvcGVydGllcy4gKi9cblx0XHRcdFx0XHRcdGlmICgvXnRyYW5zbGF0ZS9pLnRlc3QodHJhbnNmb3JtTmFtZSkpIHtcblx0XHRcdFx0XHRcdFx0dHJhbnNmb3JtTmFtZSA9IFwidHJhbnNsYXRlXCI7XG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYgKC9ec2NhbGUvaS50ZXN0KHRyYW5zZm9ybU5hbWUpKSB7XG5cdFx0XHRcdFx0XHRcdHRyYW5zZm9ybU5hbWUgPSBcInNjYWxlXCI7XG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYgKC9ecm90YXRlL2kudGVzdCh0cmFuc2Zvcm1OYW1lKSkge1xuXHRcdFx0XHRcdFx0XHR0cmFuc2Zvcm1OYW1lID0gXCJyb3RhdGVcIjtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0LyogQ2hlY2sgdGhhdCB3ZSBoYXZlbid0IHlldCBkZWxldGVkIHRoZSBwcm9wZXJ0eSBmcm9tIHRoZSBTVkdUcmFuc2Zvcm1zIGNvbnRhaW5lci4gKi9cblx0XHRcdFx0XHRcdGlmIChTVkdUcmFuc2Zvcm1zW3RyYW5zZm9ybU5hbWVdKSB7XG5cdFx0XHRcdFx0XHRcdC8qIEFwcGVuZCB0aGUgdHJhbnNmb3JtIHByb3BlcnR5IGluIHRoZSBTVkctc3VwcG9ydGVkIHRyYW5zZm9ybSBmb3JtYXQuIEFzIHBlciB0aGUgc3BlYywgc3Vycm91bmQgdGhlIHNwYWNlLWRlbGltaXRlZCB2YWx1ZXMgaW4gcGFyZW50aGVzZXMuICovXG5cdFx0XHRcdFx0XHRcdHRyYW5zZm9ybVN0cmluZyArPSB0cmFuc2Zvcm1OYW1lICsgXCIoXCIgKyBTVkdUcmFuc2Zvcm1zW3RyYW5zZm9ybU5hbWVdLmpvaW4oXCIgXCIpICsgXCIpXCIgKyBcIiBcIjtcblxuXHRcdFx0XHRcdFx0XHQvKiBBZnRlciBwcm9jZXNzaW5nIGFuIFNWRyB0cmFuc2Zvcm0gcHJvcGVydHksIGRlbGV0ZSBpdCBmcm9tIHRoZSBTVkdUcmFuc2Zvcm1zIGNvbnRhaW5lciBzbyB3ZSBkb24ndFxuXHRcdFx0XHRcdFx0XHQgcmUtaW5zZXJ0IHRoZSBzYW1lIG1hc3RlciBwcm9wZXJ0eSBpZiB3ZSBlbmNvdW50ZXIgYW5vdGhlciBvbmUgb2YgaXRzIGF4aXMtc3BlY2lmaWMgcHJvcGVydGllcy4gKi9cblx0XHRcdFx0XHRcdFx0ZGVsZXRlIFNWR1RyYW5zZm9ybXNbdHJhbnNmb3JtTmFtZV07XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dmFyIHRyYW5zZm9ybVZhbHVlLFxuXHRcdFx0XHRcdFx0XHRwZXJzcGVjdGl2ZTtcblxuXHRcdFx0XHRcdC8qIFRyYW5zZm9ybSBwcm9wZXJ0aWVzIGFyZSBzdG9yZWQgYXMgbWVtYmVycyBvZiB0aGUgdHJhbnNmb3JtQ2FjaGUgb2JqZWN0LiBDb25jYXRlbmF0ZSBhbGwgdGhlIG1lbWJlcnMgaW50byBhIHN0cmluZy4gKi9cblx0XHRcdFx0XHQkLmVhY2goRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZSwgZnVuY3Rpb24odHJhbnNmb3JtTmFtZSkge1xuXHRcdFx0XHRcdFx0dHJhbnNmb3JtVmFsdWUgPSBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdO1xuXG5cdFx0XHRcdFx0XHQvKiBUcmFuc2Zvcm0ncyBwZXJzcGVjdGl2ZSBzdWJwcm9wZXJ0eSBtdXN0IGJlIHNldCBmaXJzdCBpbiBvcmRlciB0byB0YWtlIGVmZmVjdC4gU3RvcmUgaXQgdGVtcG9yYXJpbHkuICovXG5cdFx0XHRcdFx0XHRpZiAodHJhbnNmb3JtTmFtZSA9PT0gXCJ0cmFuc2Zvcm1QZXJzcGVjdGl2ZVwiKSB7XG5cdFx0XHRcdFx0XHRcdHBlcnNwZWN0aXZlID0gdHJhbnNmb3JtVmFsdWU7XG5cdFx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvKiBJRTkgb25seSBzdXBwb3J0cyBvbmUgcm90YXRpb24gdHlwZSwgcm90YXRlWiwgd2hpY2ggaXQgcmVmZXJzIHRvIGFzIFwicm90YXRlXCIuICovXG5cdFx0XHRcdFx0XHRpZiAoSUUgPT09IDkgJiYgdHJhbnNmb3JtTmFtZSA9PT0gXCJyb3RhdGVaXCIpIHtcblx0XHRcdFx0XHRcdFx0dHJhbnNmb3JtTmFtZSA9IFwicm90YXRlXCI7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHRyYW5zZm9ybVN0cmluZyArPSB0cmFuc2Zvcm1OYW1lICsgdHJhbnNmb3JtVmFsdWUgKyBcIiBcIjtcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdC8qIElmIHByZXNlbnQsIHNldCB0aGUgcGVyc3BlY3RpdmUgc3VicHJvcGVydHkgZmlyc3QuICovXG5cdFx0XHRcdFx0aWYgKHBlcnNwZWN0aXZlKSB7XG5cdFx0XHRcdFx0XHR0cmFuc2Zvcm1TdHJpbmcgPSBcInBlcnNwZWN0aXZlXCIgKyBwZXJzcGVjdGl2ZSArIFwiIFwiICsgdHJhbnNmb3JtU3RyaW5nO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwidHJhbnNmb3JtXCIsIHRyYW5zZm9ybVN0cmluZyk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8qIFJlZ2lzdGVyIGhvb2tzIGFuZCBub3JtYWxpemF0aW9ucy4gKi9cblx0XHRDU1MuSG9va3MucmVnaXN0ZXIoKTtcblx0XHRDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXIoKTtcblxuXHRcdC8qIEFsbG93IGhvb2sgc2V0dGluZyBpbiB0aGUgc2FtZSBmYXNoaW9uIGFzIGpRdWVyeSdzICQuY3NzKCkuICovXG5cdFx0VmVsb2NpdHkuaG9vayA9IGZ1bmN0aW9uKGVsZW1lbnRzLCBhcmcyLCBhcmczKSB7XG5cdFx0XHR2YXIgdmFsdWU7XG5cblx0XHRcdGVsZW1lbnRzID0gc2FuaXRpemVFbGVtZW50cyhlbGVtZW50cyk7XG5cblx0XHRcdCQuZWFjaChlbGVtZW50cywgZnVuY3Rpb24oaSwgZWxlbWVudCkge1xuXHRcdFx0XHQvKiBJbml0aWFsaXplIFZlbG9jaXR5J3MgcGVyLWVsZW1lbnQgZGF0YSBjYWNoZSBpZiB0aGlzIGVsZW1lbnQgaGFzbid0IHByZXZpb3VzbHkgYmVlbiBhbmltYXRlZC4gKi9cblx0XHRcdFx0aWYgKERhdGEoZWxlbWVudCkgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFZlbG9jaXR5LmluaXQoZWxlbWVudCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvKiBHZXQgcHJvcGVydHkgdmFsdWUuIElmIGFuIGVsZW1lbnQgc2V0IHdhcyBwYXNzZWQgaW4sIG9ubHkgcmV0dXJuIHRoZSB2YWx1ZSBmb3IgdGhlIGZpcnN0IGVsZW1lbnQuICovXG5cdFx0XHRcdGlmIChhcmczID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0dmFsdWUgPSBWZWxvY2l0eS5DU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBhcmcyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0LyogU2V0IHByb3BlcnR5IHZhbHVlLiAqL1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8qIHNQViByZXR1cm5zIGFuIGFycmF5IG9mIHRoZSBub3JtYWxpemVkIHByb3BlcnR5TmFtZS9wcm9wZXJ0eVZhbHVlIHBhaXIgdXNlZCB0byB1cGRhdGUgdGhlIERPTS4gKi9cblx0XHRcdFx0XHR2YXIgYWRqdXN0ZWRTZXQgPSBWZWxvY2l0eS5DU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBhcmcyLCBhcmczKTtcblxuXHRcdFx0XHRcdC8qIFRyYW5zZm9ybSBwcm9wZXJ0aWVzIGRvbid0IGF1dG9tYXRpY2FsbHkgc2V0LiBUaGV5IGhhdmUgdG8gYmUgZmx1c2hlZCB0byB0aGUgRE9NLiAqL1xuXHRcdFx0XHRcdGlmIChhZGp1c3RlZFNldFswXSA9PT0gXCJ0cmFuc2Zvcm1cIikge1xuXHRcdFx0XHRcdFx0VmVsb2NpdHkuQ1NTLmZsdXNoVHJhbnNmb3JtQ2FjaGUoZWxlbWVudCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0dmFsdWUgPSBhZGp1c3RlZFNldDtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiB2YWx1ZTtcblx0XHR9O1xuXG5cdFx0LyoqKioqKioqKioqKioqKioqXG5cdFx0IEFuaW1hdGlvblxuXHRcdCAqKioqKioqKioqKioqKioqKi9cblxuXHRcdHZhciBhbmltYXRlID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgb3B0cztcblxuXHRcdFx0LyoqKioqKioqKioqKioqKioqKlxuXHRcdFx0IENhbGwgQ2hhaW5cblx0XHRcdCAqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdC8qIExvZ2ljIGZvciBkZXRlcm1pbmluZyB3aGF0IHRvIHJldHVybiB0byB0aGUgY2FsbCBzdGFjayB3aGVuIGV4aXRpbmcgb3V0IG9mIFZlbG9jaXR5LiAqL1xuXHRcdFx0ZnVuY3Rpb24gZ2V0Q2hhaW4oKSB7XG5cdFx0XHRcdC8qIElmIHdlIGFyZSB1c2luZyB0aGUgdXRpbGl0eSBmdW5jdGlvbiwgYXR0ZW1wdCB0byByZXR1cm4gdGhpcyBjYWxsJ3MgcHJvbWlzZS4gSWYgbm8gcHJvbWlzZSBsaWJyYXJ5IHdhcyBkZXRlY3RlZCxcblx0XHRcdFx0IGRlZmF1bHQgdG8gbnVsbCBpbnN0ZWFkIG9mIHJldHVybmluZyB0aGUgdGFyZ2V0ZWQgZWxlbWVudHMgc28gdGhhdCB1dGlsaXR5IGZ1bmN0aW9uJ3MgcmV0dXJuIHZhbHVlIGlzIHN0YW5kYXJkaXplZC4gKi9cblx0XHRcdFx0aWYgKGlzVXRpbGl0eSkge1xuXHRcdFx0XHRcdHJldHVybiBwcm9taXNlRGF0YS5wcm9taXNlIHx8IG51bGw7XG5cdFx0XHRcdFx0LyogT3RoZXJ3aXNlLCBpZiB3ZSdyZSB1c2luZyAkLmZuLCByZXR1cm4gdGhlIGpRdWVyeS0vWmVwdG8td3JhcHBlZCBlbGVtZW50IHNldC4gKi9cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gZWxlbWVudHNXcmFwcGVkO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8qKioqKioqKioqKioqKioqKioqKioqKioqXG5cdFx0XHQgQXJndW1lbnRzIEFzc2lnbm1lbnRcblx0XHRcdCAqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0XHQvKiBUbyBhbGxvdyBmb3IgZXhwcmVzc2l2ZSBDb2ZmZWVTY3JpcHQgY29kZSwgVmVsb2NpdHkgc3VwcG9ydHMgYW4gYWx0ZXJuYXRpdmUgc3ludGF4IGluIHdoaWNoIFwiZWxlbWVudHNcIiAob3IgXCJlXCIpLCBcInByb3BlcnRpZXNcIiAob3IgXCJwXCIpLCBhbmQgXCJvcHRpb25zXCIgKG9yIFwib1wiKVxuXHRcdFx0IG9iamVjdHMgYXJlIGRlZmluZWQgb24gYSBjb250YWluZXIgb2JqZWN0IHRoYXQncyBwYXNzZWQgaW4gYXMgVmVsb2NpdHkncyBzb2xlIGFyZ3VtZW50LiAqL1xuXHRcdFx0LyogTm90ZTogU29tZSBicm93c2VycyBhdXRvbWF0aWNhbGx5IHBvcHVsYXRlIGFyZ3VtZW50cyB3aXRoIGEgXCJwcm9wZXJ0aWVzXCIgb2JqZWN0LiBXZSBkZXRlY3QgaXQgYnkgY2hlY2tpbmcgZm9yIGl0cyBkZWZhdWx0IFwibmFtZXNcIiBwcm9wZXJ0eS4gKi9cblx0XHRcdHZhciBzeW50YWN0aWNTdWdhciA9IChhcmd1bWVudHNbMF0gJiYgKGFyZ3VtZW50c1swXS5wIHx8ICgoJC5pc1BsYWluT2JqZWN0KGFyZ3VtZW50c1swXS5wcm9wZXJ0aWVzKSAmJiAhYXJndW1lbnRzWzBdLnByb3BlcnRpZXMubmFtZXMpIHx8IFR5cGUuaXNTdHJpbmcoYXJndW1lbnRzWzBdLnByb3BlcnRpZXMpKSkpLFxuXHRcdFx0XHRcdC8qIFdoZXRoZXIgVmVsb2NpdHkgd2FzIGNhbGxlZCB2aWEgdGhlIHV0aWxpdHkgZnVuY3Rpb24gKGFzIG9wcG9zZWQgdG8gb24gYSBqUXVlcnkvWmVwdG8gb2JqZWN0KS4gKi9cblx0XHRcdFx0XHRpc1V0aWxpdHksXG5cdFx0XHRcdFx0LyogV2hlbiBWZWxvY2l0eSBpcyBjYWxsZWQgdmlhIHRoZSB1dGlsaXR5IGZ1bmN0aW9uICgkLlZlbG9jaXR5KCkvVmVsb2NpdHkoKSksIGVsZW1lbnRzIGFyZSBleHBsaWNpdGx5XG5cdFx0XHRcdFx0IHBhc3NlZCBpbiBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyLiBUaHVzLCBhcmd1bWVudCBwb3NpdGlvbmluZyB2YXJpZXMuIFdlIG5vcm1hbGl6ZSB0aGVtIGhlcmUuICovXG5cdFx0XHRcdFx0ZWxlbWVudHNXcmFwcGVkLFxuXHRcdFx0XHRcdGFyZ3VtZW50SW5kZXg7XG5cblx0XHRcdHZhciBlbGVtZW50cyxcblx0XHRcdFx0XHRwcm9wZXJ0aWVzTWFwLFxuXHRcdFx0XHRcdG9wdGlvbnM7XG5cblx0XHRcdC8qIERldGVjdCBqUXVlcnkvWmVwdG8gZWxlbWVudHMgYmVpbmcgYW5pbWF0ZWQgdmlhIHRoZSAkLmZuIG1ldGhvZC4gKi9cblx0XHRcdGlmIChUeXBlLmlzV3JhcHBlZCh0aGlzKSkge1xuXHRcdFx0XHRpc1V0aWxpdHkgPSBmYWxzZTtcblxuXHRcdFx0XHRhcmd1bWVudEluZGV4ID0gMDtcblx0XHRcdFx0ZWxlbWVudHMgPSB0aGlzO1xuXHRcdFx0XHRlbGVtZW50c1dyYXBwZWQgPSB0aGlzO1xuXHRcdFx0XHQvKiBPdGhlcndpc2UsIHJhdyBlbGVtZW50cyBhcmUgYmVpbmcgYW5pbWF0ZWQgdmlhIHRoZSB1dGlsaXR5IGZ1bmN0aW9uLiAqL1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aXNVdGlsaXR5ID0gdHJ1ZTtcblxuXHRcdFx0XHRhcmd1bWVudEluZGV4ID0gMTtcblx0XHRcdFx0ZWxlbWVudHMgPSBzeW50YWN0aWNTdWdhciA/IChhcmd1bWVudHNbMF0uZWxlbWVudHMgfHwgYXJndW1lbnRzWzBdLmUpIDogYXJndW1lbnRzWzBdO1xuXHRcdFx0fVxuXG5cdFx0XHRlbGVtZW50cyA9IHNhbml0aXplRWxlbWVudHMoZWxlbWVudHMpO1xuXG5cdFx0XHRpZiAoIWVsZW1lbnRzKSB7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHN5bnRhY3RpY1N1Z2FyKSB7XG5cdFx0XHRcdHByb3BlcnRpZXNNYXAgPSBhcmd1bWVudHNbMF0ucHJvcGVydGllcyB8fCBhcmd1bWVudHNbMF0ucDtcblx0XHRcdFx0b3B0aW9ucyA9IGFyZ3VtZW50c1swXS5vcHRpb25zIHx8IGFyZ3VtZW50c1swXS5vO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cHJvcGVydGllc01hcCA9IGFyZ3VtZW50c1thcmd1bWVudEluZGV4XTtcblx0XHRcdFx0b3B0aW9ucyA9IGFyZ3VtZW50c1thcmd1bWVudEluZGV4ICsgMV07XG5cdFx0XHR9XG5cblx0XHRcdC8qIFRoZSBsZW5ndGggb2YgdGhlIGVsZW1lbnQgc2V0IChpbiB0aGUgZm9ybSBvZiBhIG5vZGVMaXN0IG9yIGFuIGFycmF5IG9mIGVsZW1lbnRzKSBpcyBkZWZhdWx0ZWQgdG8gMSBpbiBjYXNlIGFcblx0XHRcdCBzaW5nbGUgcmF3IERPTSBlbGVtZW50IGlzIHBhc3NlZCBpbiAod2hpY2ggZG9lc24ndCBjb250YWluIGEgbGVuZ3RoIHByb3BlcnR5KS4gKi9cblx0XHRcdHZhciBlbGVtZW50c0xlbmd0aCA9IGVsZW1lbnRzLmxlbmd0aCxcblx0XHRcdFx0XHRlbGVtZW50c0luZGV4ID0gMDtcblxuXHRcdFx0LyoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0IEFyZ3VtZW50IE92ZXJsb2FkaW5nXG5cdFx0XHQgKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0XHQvKiBTdXBwb3J0IGlzIGluY2x1ZGVkIGZvciBqUXVlcnkncyBhcmd1bWVudCBvdmVybG9hZGluZzogJC5hbmltYXRlKHByb3BlcnR5TWFwIFssIGR1cmF0aW9uXSBbLCBlYXNpbmddIFssIGNvbXBsZXRlXSkuXG5cdFx0XHQgT3ZlcmxvYWRpbmcgaXMgZGV0ZWN0ZWQgYnkgY2hlY2tpbmcgZm9yIHRoZSBhYnNlbmNlIG9mIGFuIG9iamVjdCBiZWluZyBwYXNzZWQgaW50byBvcHRpb25zLiAqL1xuXHRcdFx0LyogTm90ZTogVGhlIHN0b3AgYW5kIGZpbmlzaCBhY3Rpb25zIGRvIG5vdCBhY2NlcHQgYW5pbWF0aW9uIG9wdGlvbnMsIGFuZCBhcmUgdGhlcmVmb3JlIGV4Y2x1ZGVkIGZyb20gdGhpcyBjaGVjay4gKi9cblx0XHRcdGlmICghL14oc3RvcHxmaW5pc2h8ZmluaXNoQWxsKSQvaS50ZXN0KHByb3BlcnRpZXNNYXApICYmICEkLmlzUGxhaW5PYmplY3Qob3B0aW9ucykpIHtcblx0XHRcdFx0LyogVGhlIHV0aWxpdHkgZnVuY3Rpb24gc2hpZnRzIGFsbCBhcmd1bWVudHMgb25lIHBvc2l0aW9uIHRvIHRoZSByaWdodCwgc28gd2UgYWRqdXN0IGZvciB0aGF0IG9mZnNldC4gKi9cblx0XHRcdFx0dmFyIHN0YXJ0aW5nQXJndW1lbnRQb3NpdGlvbiA9IGFyZ3VtZW50SW5kZXggKyAxO1xuXG5cdFx0XHRcdG9wdGlvbnMgPSB7fTtcblxuXHRcdFx0XHQvKiBJdGVyYXRlIHRocm91Z2ggYWxsIG9wdGlvbnMgYXJndW1lbnRzICovXG5cdFx0XHRcdGZvciAodmFyIGkgPSBzdGFydGluZ0FyZ3VtZW50UG9zaXRpb247IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHQvKiBUcmVhdCBhIG51bWJlciBhcyBhIGR1cmF0aW9uLiBQYXJzZSBpdCBvdXQuICovXG5cdFx0XHRcdFx0LyogTm90ZTogVGhlIGZvbGxvd2luZyBSZWdFeCB3aWxsIHJldHVybiB0cnVlIGlmIHBhc3NlZCBhbiBhcnJheSB3aXRoIGEgbnVtYmVyIGFzIGl0cyBmaXJzdCBpdGVtLlxuXHRcdFx0XHRcdCBUaHVzLCBhcnJheXMgYXJlIHNraXBwZWQgZnJvbSB0aGlzIGNoZWNrLiAqL1xuXHRcdFx0XHRcdGlmICghVHlwZS5pc0FycmF5KGFyZ3VtZW50c1tpXSkgJiYgKC9eKGZhc3R8bm9ybWFsfHNsb3cpJC9pLnRlc3QoYXJndW1lbnRzW2ldKSB8fCAvXlxcZC8udGVzdChhcmd1bWVudHNbaV0pKSkge1xuXHRcdFx0XHRcdFx0b3B0aW9ucy5kdXJhdGlvbiA9IGFyZ3VtZW50c1tpXTtcblx0XHRcdFx0XHRcdC8qIFRyZWF0IHN0cmluZ3MgYW5kIGFycmF5cyBhcyBlYXNpbmdzLiAqL1xuXHRcdFx0XHRcdH0gZWxzZSBpZiAoVHlwZS5pc1N0cmluZyhhcmd1bWVudHNbaV0pIHx8IFR5cGUuaXNBcnJheShhcmd1bWVudHNbaV0pKSB7XG5cdFx0XHRcdFx0XHRvcHRpb25zLmVhc2luZyA9IGFyZ3VtZW50c1tpXTtcblx0XHRcdFx0XHRcdC8qIFRyZWF0IGEgZnVuY3Rpb24gYXMgYSBjb21wbGV0ZSBjYWxsYmFjay4gKi9cblx0XHRcdFx0XHR9IGVsc2UgaWYgKFR5cGUuaXNGdW5jdGlvbihhcmd1bWVudHNbaV0pKSB7XG5cdFx0XHRcdFx0XHRvcHRpb25zLmNvbXBsZXRlID0gYXJndW1lbnRzW2ldO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvKioqKioqKioqKioqKioqXG5cdFx0XHQgUHJvbWlzZXNcblx0XHRcdCAqKioqKioqKioqKioqKiovXG5cblx0XHRcdHZhciBwcm9taXNlRGF0YSA9IHtcblx0XHRcdFx0cHJvbWlzZTogbnVsbCxcblx0XHRcdFx0cmVzb2x2ZXI6IG51bGwsXG5cdFx0XHRcdHJlamVjdGVyOiBudWxsXG5cdFx0XHR9O1xuXG5cdFx0XHQvKiBJZiB0aGlzIGNhbGwgd2FzIG1hZGUgdmlhIHRoZSB1dGlsaXR5IGZ1bmN0aW9uICh3aGljaCBpcyB0aGUgZGVmYXVsdCBtZXRob2Qgb2YgaW52b2NhdGlvbiB3aGVuIGpRdWVyeS9aZXB0byBhcmUgbm90IGJlaW5nIHVzZWQpLCBhbmQgaWZcblx0XHRcdCBwcm9taXNlIHN1cHBvcnQgd2FzIGRldGVjdGVkLCBjcmVhdGUgYSBwcm9taXNlIG9iamVjdCBmb3IgdGhpcyBjYWxsIGFuZCBzdG9yZSByZWZlcmVuY2VzIHRvIGl0cyByZXNvbHZlciBhbmQgcmVqZWN0ZXIgbWV0aG9kcy4gVGhlIHJlc29sdmVcblx0XHRcdCBtZXRob2QgaXMgdXNlZCB3aGVuIGEgY2FsbCBjb21wbGV0ZXMgbmF0dXJhbGx5IG9yIGlzIHByZW1hdHVyZWx5IHN0b3BwZWQgYnkgdGhlIHVzZXIuIEluIGJvdGggY2FzZXMsIGNvbXBsZXRlQ2FsbCgpIGhhbmRsZXMgdGhlIGFzc29jaWF0ZWRcblx0XHRcdCBjYWxsIGNsZWFudXAgYW5kIHByb21pc2UgcmVzb2x2aW5nIGxvZ2ljLiBUaGUgcmVqZWN0IG1ldGhvZCBpcyB1c2VkIHdoZW4gYW4gaW52YWxpZCBzZXQgb2YgYXJndW1lbnRzIGlzIHBhc3NlZCBpbnRvIGEgVmVsb2NpdHkgY2FsbC4gKi9cblx0XHRcdC8qIE5vdGU6IFZlbG9jaXR5IGVtcGxveXMgYSBjYWxsLWJhc2VkIHF1ZXVlaW5nIGFyY2hpdGVjdHVyZSwgd2hpY2ggbWVhbnMgdGhhdCBzdG9wcGluZyBhbiBhbmltYXRpbmcgZWxlbWVudCBhY3R1YWxseSBzdG9wcyB0aGUgZnVsbCBjYWxsIHRoYXRcblx0XHRcdCB0cmlnZ2VyZWQgaXQgLS0gbm90IHRoYXQgb25lIGVsZW1lbnQgZXhjbHVzaXZlbHkuIFNpbWlsYXJseSwgdGhlcmUgaXMgb25lIHByb21pc2UgcGVyIGNhbGwsIGFuZCBhbGwgZWxlbWVudHMgdGFyZ2V0ZWQgYnkgYSBWZWxvY2l0eSBjYWxsIGFyZVxuXHRcdFx0IGdyb3VwZWQgdG9nZXRoZXIgZm9yIHRoZSBwdXJwb3NlcyBvZiByZXNvbHZpbmcgYW5kIHJlamVjdGluZyBhIHByb21pc2UuICovXG5cdFx0XHRpZiAoaXNVdGlsaXR5ICYmIFZlbG9jaXR5LlByb21pc2UpIHtcblx0XHRcdFx0cHJvbWlzZURhdGEucHJvbWlzZSA9IG5ldyBWZWxvY2l0eS5Qcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuXHRcdFx0XHRcdHByb21pc2VEYXRhLnJlc29sdmVyID0gcmVzb2x2ZTtcblx0XHRcdFx0XHRwcm9taXNlRGF0YS5yZWplY3RlciA9IHJlamVjdDtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdC8qKioqKioqKioqKioqKioqKioqKipcblx0XHRcdCBBY3Rpb24gRGV0ZWN0aW9uXG5cdFx0XHQgKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0XHQvKiBWZWxvY2l0eSdzIGJlaGF2aW9yIGlzIGNhdGVnb3JpemVkIGludG8gXCJhY3Rpb25zXCI6IEVsZW1lbnRzIGNhbiBlaXRoZXIgYmUgc3BlY2lhbGx5IHNjcm9sbGVkIGludG8gdmlldyxcblx0XHRcdCBvciB0aGV5IGNhbiBiZSBzdGFydGVkLCBzdG9wcGVkLCBvciByZXZlcnNlZC4gSWYgYSBsaXRlcmFsIG9yIHJlZmVyZW5jZWQgcHJvcGVydGllcyBtYXAgaXMgcGFzc2VkIGluIGFzIFZlbG9jaXR5J3Ncblx0XHRcdCBmaXJzdCBhcmd1bWVudCwgdGhlIGFzc29jaWF0ZWQgYWN0aW9uIGlzIFwic3RhcnRcIi4gQWx0ZXJuYXRpdmVseSwgXCJzY3JvbGxcIiwgXCJyZXZlcnNlXCIsIG9yIFwic3RvcFwiIGNhbiBiZSBwYXNzZWQgaW4gaW5zdGVhZCBvZiBhIHByb3BlcnRpZXMgbWFwLiAqL1xuXHRcdFx0dmFyIGFjdGlvbjtcblxuXHRcdFx0c3dpdGNoIChwcm9wZXJ0aWVzTWFwKSB7XG5cdFx0XHRcdGNhc2UgXCJzY3JvbGxcIjpcblx0XHRcdFx0XHRhY3Rpb24gPSBcInNjcm9sbFwiO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdGNhc2UgXCJyZXZlcnNlXCI6XG5cdFx0XHRcdFx0YWN0aW9uID0gXCJyZXZlcnNlXCI7XG5cdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0Y2FzZSBcImZpbmlzaFwiOlxuXHRcdFx0XHRjYXNlIFwiZmluaXNoQWxsXCI6XG5cdFx0XHRcdGNhc2UgXCJzdG9wXCI6XG5cdFx0XHRcdFx0LyoqKioqKioqKioqKioqKioqKipcblx0XHRcdFx0XHQgQWN0aW9uOiBTdG9wXG5cdFx0XHRcdFx0ICoqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdFx0XHQvKiBDbGVhciB0aGUgY3VycmVudGx5LWFjdGl2ZSBkZWxheSBvbiBlYWNoIHRhcmdldGVkIGVsZW1lbnQuICovXG5cdFx0XHRcdFx0JC5lYWNoKGVsZW1lbnRzLCBmdW5jdGlvbihpLCBlbGVtZW50KSB7XG5cdFx0XHRcdFx0XHRpZiAoRGF0YShlbGVtZW50KSAmJiBEYXRhKGVsZW1lbnQpLmRlbGF5VGltZXIpIHtcblx0XHRcdFx0XHRcdFx0LyogU3RvcCB0aGUgdGltZXIgZnJvbSB0cmlnZ2VyaW5nIGl0cyBjYWNoZWQgbmV4dCgpIGZ1bmN0aW9uLiAqL1xuXHRcdFx0XHRcdFx0XHRjbGVhclRpbWVvdXQoRGF0YShlbGVtZW50KS5kZWxheVRpbWVyLnNldFRpbWVvdXQpO1xuXG5cdFx0XHRcdFx0XHRcdC8qIE1hbnVhbGx5IGNhbGwgdGhlIG5leHQoKSBmdW5jdGlvbiBzbyB0aGF0IHRoZSBzdWJzZXF1ZW50IHF1ZXVlIGl0ZW1zIGNhbiBwcm9ncmVzcy4gKi9cblx0XHRcdFx0XHRcdFx0aWYgKERhdGEoZWxlbWVudCkuZGVsYXlUaW1lci5uZXh0KSB7XG5cdFx0XHRcdFx0XHRcdFx0RGF0YShlbGVtZW50KS5kZWxheVRpbWVyLm5leHQoKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGRlbGV0ZSBEYXRhKGVsZW1lbnQpLmRlbGF5VGltZXI7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8qIElmIHdlIHdhbnQgdG8gZmluaXNoIGV2ZXJ5dGhpbmcgaW4gdGhlIHF1ZXVlLCB3ZSBoYXZlIHRvIGl0ZXJhdGUgdGhyb3VnaCBpdFxuXHRcdFx0XHRcdFx0IGFuZCBjYWxsIGVhY2ggZnVuY3Rpb24uIFRoaXMgd2lsbCBtYWtlIHRoZW0gYWN0aXZlIGNhbGxzIGJlbG93LCB3aGljaCB3aWxsXG5cdFx0XHRcdFx0XHQgY2F1c2UgdGhlbSB0byBiZSBhcHBsaWVkIHZpYSB0aGUgZHVyYXRpb24gc2V0dGluZy4gKi9cblx0XHRcdFx0XHRcdGlmIChwcm9wZXJ0aWVzTWFwID09PSBcImZpbmlzaEFsbFwiICYmIChvcHRpb25zID09PSB0cnVlIHx8IFR5cGUuaXNTdHJpbmcob3B0aW9ucykpKSB7XG5cdFx0XHRcdFx0XHRcdC8qIEl0ZXJhdGUgdGhyb3VnaCB0aGUgaXRlbXMgaW4gdGhlIGVsZW1lbnQncyBxdWV1ZS4gKi9cblx0XHRcdFx0XHRcdFx0JC5lYWNoKCQucXVldWUoZWxlbWVudCwgVHlwZS5pc1N0cmluZyhvcHRpb25zKSA/IG9wdGlvbnMgOiBcIlwiKSwgZnVuY3Rpb24oXywgaXRlbSkge1xuXHRcdFx0XHRcdFx0XHRcdC8qIFRoZSBxdWV1ZSBhcnJheSBjYW4gY29udGFpbiBhbiBcImlucHJvZ3Jlc3NcIiBzdHJpbmcsIHdoaWNoIHdlIHNraXAuICovXG5cdFx0XHRcdFx0XHRcdFx0aWYgKFR5cGUuaXNGdW5jdGlvbihpdGVtKSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0aXRlbSgpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdFx0LyogQ2xlYXJpbmcgdGhlICQucXVldWUoKSBhcnJheSBpcyBhY2hpZXZlZCBieSByZXNldHRpbmcgaXQgdG8gW10uICovXG5cdFx0XHRcdFx0XHRcdCQucXVldWUoZWxlbWVudCwgVHlwZS5pc1N0cmluZyhvcHRpb25zKSA/IG9wdGlvbnMgOiBcIlwiLCBbXSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHR2YXIgY2FsbHNUb1N0b3AgPSBbXTtcblxuXHRcdFx0XHRcdC8qIFdoZW4gdGhlIHN0b3AgYWN0aW9uIGlzIHRyaWdnZXJlZCwgdGhlIGVsZW1lbnRzJyBjdXJyZW50bHkgYWN0aXZlIGNhbGwgaXMgaW1tZWRpYXRlbHkgc3RvcHBlZC4gVGhlIGFjdGl2ZSBjYWxsIG1pZ2h0IGhhdmVcblx0XHRcdFx0XHQgYmVlbiBhcHBsaWVkIHRvIG11bHRpcGxlIGVsZW1lbnRzLCBpbiB3aGljaCBjYXNlIGFsbCBvZiB0aGUgY2FsbCdzIGVsZW1lbnRzIHdpbGwgYmUgc3RvcHBlZC4gV2hlbiBhbiBlbGVtZW50XG5cdFx0XHRcdFx0IGlzIHN0b3BwZWQsIHRoZSBuZXh0IGl0ZW0gaW4gaXRzIGFuaW1hdGlvbiBxdWV1ZSBpcyBpbW1lZGlhdGVseSB0cmlnZ2VyZWQuICovXG5cdFx0XHRcdFx0LyogQW4gYWRkaXRpb25hbCBhcmd1bWVudCBtYXkgYmUgcGFzc2VkIGluIHRvIGNsZWFyIGFuIGVsZW1lbnQncyByZW1haW5pbmcgcXVldWVkIGNhbGxzLiBFaXRoZXIgdHJ1ZSAod2hpY2ggZGVmYXVsdHMgdG8gdGhlIFwiZnhcIiBxdWV1ZSlcblx0XHRcdFx0XHQgb3IgYSBjdXN0b20gcXVldWUgc3RyaW5nIGNhbiBiZSBwYXNzZWQgaW4uICovXG5cdFx0XHRcdFx0LyogTm90ZTogVGhlIHN0b3AgY29tbWFuZCBydW5zIHByaW9yIHRvIFZlbG9jaXR5J3MgUXVldWVpbmcgcGhhc2Ugc2luY2UgaXRzIGJlaGF2aW9yIGlzIGludGVuZGVkIHRvIHRha2UgZWZmZWN0ICppbW1lZGlhdGVseSosXG5cdFx0XHRcdFx0IHJlZ2FyZGxlc3Mgb2YgdGhlIGVsZW1lbnQncyBjdXJyZW50IHF1ZXVlIHN0YXRlLiAqL1xuXG5cdFx0XHRcdFx0LyogSXRlcmF0ZSB0aHJvdWdoIGV2ZXJ5IGFjdGl2ZSBjYWxsLiAqL1xuXHRcdFx0XHRcdCQuZWFjaChWZWxvY2l0eS5TdGF0ZS5jYWxscywgZnVuY3Rpb24oaSwgYWN0aXZlQ2FsbCkge1xuXHRcdFx0XHRcdFx0LyogSW5hY3RpdmUgY2FsbHMgYXJlIHNldCB0byBmYWxzZSBieSB0aGUgbG9naWMgaW5zaWRlIGNvbXBsZXRlQ2FsbCgpLiBTa2lwIHRoZW0uICovXG5cdFx0XHRcdFx0XHRpZiAoYWN0aXZlQ2FsbCkge1xuXHRcdFx0XHRcdFx0XHQvKiBJdGVyYXRlIHRocm91Z2ggdGhlIGFjdGl2ZSBjYWxsJ3MgdGFyZ2V0ZWQgZWxlbWVudHMuICovXG5cdFx0XHRcdFx0XHRcdCQuZWFjaChhY3RpdmVDYWxsWzFdLCBmdW5jdGlvbihrLCBhY3RpdmVFbGVtZW50KSB7XG5cdFx0XHRcdFx0XHRcdFx0LyogSWYgdHJ1ZSB3YXMgcGFzc2VkIGluIGFzIGEgc2Vjb25kYXJ5IGFyZ3VtZW50LCBjbGVhciBhYnNvbHV0ZWx5IGFsbCBjYWxscyBvbiB0aGlzIGVsZW1lbnQuIE90aGVyd2lzZSwgb25seVxuXHRcdFx0XHRcdFx0XHRcdCBjbGVhciBjYWxscyBhc3NvY2lhdGVkIHdpdGggdGhlIHJlbGV2YW50IHF1ZXVlLiAqL1xuXHRcdFx0XHRcdFx0XHRcdC8qIENhbGwgc3RvcHBpbmcgbG9naWMgd29ya3MgYXMgZm9sbG93czpcblx0XHRcdFx0XHRcdFx0XHQgLSBvcHRpb25zID09PSB0cnVlIC0tPiBzdG9wIGN1cnJlbnQgZGVmYXVsdCBxdWV1ZSBjYWxscyAoYW5kIHF1ZXVlOmZhbHNlIGNhbGxzKSwgaW5jbHVkaW5nIHJlbWFpbmluZyBxdWV1ZWQgb25lcy5cblx0XHRcdFx0XHRcdFx0XHQgLSBvcHRpb25zID09PSB1bmRlZmluZWQgLS0+IHN0b3AgY3VycmVudCBxdWV1ZTpcIlwiIGNhbGwgYW5kIGFsbCBxdWV1ZTpmYWxzZSBjYWxscy5cblx0XHRcdFx0XHRcdFx0XHQgLSBvcHRpb25zID09PSBmYWxzZSAtLT4gc3RvcCBvbmx5IHF1ZXVlOmZhbHNlIGNhbGxzLlxuXHRcdFx0XHRcdFx0XHRcdCAtIG9wdGlvbnMgPT09IFwiY3VzdG9tXCIgLS0+IHN0b3AgY3VycmVudCBxdWV1ZTpcImN1c3RvbVwiIGNhbGwsIGluY2x1ZGluZyByZW1haW5pbmcgcXVldWVkIG9uZXMgKHRoZXJlIGlzIG5vIGZ1bmN0aW9uYWxpdHkgdG8gb25seSBjbGVhciB0aGUgY3VycmVudGx5LXJ1bm5pbmcgcXVldWU6XCJjdXN0b21cIiBjYWxsKS4gKi9cblx0XHRcdFx0XHRcdFx0XHR2YXIgcXVldWVOYW1lID0gKG9wdGlvbnMgPT09IHVuZGVmaW5lZCkgPyBcIlwiIDogb3B0aW9ucztcblxuXHRcdFx0XHRcdFx0XHRcdGlmIChxdWV1ZU5hbWUgIT09IHRydWUgJiYgKGFjdGl2ZUNhbGxbMl0ucXVldWUgIT09IHF1ZXVlTmFtZSkgJiYgIShvcHRpb25zID09PSB1bmRlZmluZWQgJiYgYWN0aXZlQ2FsbFsyXS5xdWV1ZSA9PT0gZmFsc2UpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHQvKiBJdGVyYXRlIHRocm91Z2ggdGhlIGNhbGxzIHRhcmdldGVkIGJ5IHRoZSBzdG9wIGNvbW1hbmQuICovXG5cdFx0XHRcdFx0XHRcdFx0JC5lYWNoKGVsZW1lbnRzLCBmdW5jdGlvbihsLCBlbGVtZW50KSB7XG5cdFx0XHRcdFx0XHRcdFx0XHQvKiBDaGVjayB0aGF0IHRoaXMgY2FsbCB3YXMgYXBwbGllZCB0byB0aGUgdGFyZ2V0IGVsZW1lbnQuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoZWxlbWVudCA9PT0gYWN0aXZlRWxlbWVudCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQvKiBPcHRpb25hbGx5IGNsZWFyIHRoZSByZW1haW5pbmcgcXVldWVkIGNhbGxzLiBJZiB3ZSdyZSBkb2luZyBcImZpbmlzaEFsbFwiIHRoaXMgd29uJ3QgZmluZCBhbnl0aGluZyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0IGR1ZSB0byB0aGUgcXVldWUtY2xlYXJpbmcgYWJvdmUuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChvcHRpb25zID09PSB0cnVlIHx8IFR5cGUuaXNTdHJpbmcob3B0aW9ucykpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvKiBJdGVyYXRlIHRocm91Z2ggdGhlIGl0ZW1zIGluIHRoZSBlbGVtZW50J3MgcXVldWUuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0JC5lYWNoKCQucXVldWUoZWxlbWVudCwgVHlwZS5pc1N0cmluZyhvcHRpb25zKSA/IG9wdGlvbnMgOiBcIlwiKSwgZnVuY3Rpb24oXywgaXRlbSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0LyogVGhlIHF1ZXVlIGFycmF5IGNhbiBjb250YWluIGFuIFwiaW5wcm9ncmVzc1wiIHN0cmluZywgd2hpY2ggd2Ugc2tpcC4gKi9cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChUeXBlLmlzRnVuY3Rpb24oaXRlbSkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0LyogUGFzcyB0aGUgaXRlbSdzIGNhbGxiYWNrIGEgZmxhZyBpbmRpY2F0aW5nIHRoYXQgd2Ugd2FudCB0byBhYm9ydCBmcm9tIHRoZSBxdWV1ZSBjYWxsLlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQgKFNwZWNpZmljYWxseSwgdGhlIHF1ZXVlIHdpbGwgcmVzb2x2ZSB0aGUgY2FsbCdzIGFzc29jaWF0ZWQgcHJvbWlzZSB0aGVuIGFib3J0LikgICovXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGl0ZW0obnVsbCwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvKiBDbGVhcmluZyB0aGUgJC5xdWV1ZSgpIGFycmF5IGlzIGFjaGlldmVkIGJ5IHJlc2V0dGluZyBpdCB0byBbXS4gKi9cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQkLnF1ZXVlKGVsZW1lbnQsIFR5cGUuaXNTdHJpbmcob3B0aW9ucykgPyBvcHRpb25zIDogXCJcIiwgW10pO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKHByb3BlcnRpZXNNYXAgPT09IFwic3RvcFwiKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0LyogU2luY2UgXCJyZXZlcnNlXCIgdXNlcyBjYWNoZWQgc3RhcnQgdmFsdWVzICh0aGUgcHJldmlvdXMgY2FsbCdzIGVuZFZhbHVlcyksIHRoZXNlIHZhbHVlcyBtdXN0IGJlXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0IGNoYW5nZWQgdG8gcmVmbGVjdCB0aGUgZmluYWwgdmFsdWUgdGhhdCB0aGUgZWxlbWVudHMgd2VyZSBhY3R1YWxseSB0d2VlbmVkIHRvLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8qIE5vdGU6IElmIG9ubHkgcXVldWU6ZmFsc2UgYW5pbWF0aW9ucyBhcmUgY3VycmVudGx5IHJ1bm5pbmcgb24gYW4gZWxlbWVudCwgaXQgd29uJ3QgaGF2ZSBhIHR3ZWVuc0NvbnRhaW5lclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdCBvYmplY3QuIEFsc28sIHF1ZXVlOmZhbHNlIGFuaW1hdGlvbnMgY2FuJ3QgYmUgcmV2ZXJzZWQuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dmFyIGRhdGEgPSBEYXRhKGVsZW1lbnQpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChkYXRhICYmIGRhdGEudHdlZW5zQ29udGFpbmVyICYmIHF1ZXVlTmFtZSAhPT0gZmFsc2UpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCQuZWFjaChkYXRhLnR3ZWVuc0NvbnRhaW5lciwgZnVuY3Rpb24obSwgYWN0aXZlVHdlZW4pIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YWN0aXZlVHdlZW4uZW5kVmFsdWUgPSBhY3RpdmVUd2Vlbi5jdXJyZW50VmFsdWU7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjYWxsc1RvU3RvcC5wdXNoKGkpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKHByb3BlcnRpZXNNYXAgPT09IFwiZmluaXNoXCIgfHwgcHJvcGVydGllc01hcCA9PT0gXCJmaW5pc2hBbGxcIikge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8qIFRvIGdldCBhY3RpdmUgdHdlZW5zIHRvIGZpbmlzaCBpbW1lZGlhdGVseSwgd2UgZm9yY2VmdWxseSBzaG9ydGVuIHRoZWlyIGR1cmF0aW9ucyB0byAxbXMgc28gdGhhdFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdCB0aGV5IGZpbmlzaCB1cG9uIHRoZSBuZXh0IHJBZiB0aWNrIHRoZW4gcHJvY2VlZCB3aXRoIG5vcm1hbCBjYWxsIGNvbXBsZXRpb24gbG9naWMuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0YWN0aXZlQ2FsbFsyXS5kdXJhdGlvbiA9IDE7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHQvKiBQcmVtYXR1cmVseSBjYWxsIGNvbXBsZXRlQ2FsbCgpIG9uIGVhY2ggbWF0Y2hlZCBhY3RpdmUgY2FsbC4gUGFzcyBhbiBhZGRpdGlvbmFsIGZsYWcgZm9yIFwic3RvcFwiIHRvIGluZGljYXRlXG5cdFx0XHRcdFx0IHRoYXQgdGhlIGNvbXBsZXRlIGNhbGxiYWNrIGFuZCBkaXNwbGF5Om5vbmUgc2V0dGluZyBzaG91bGQgYmUgc2tpcHBlZCBzaW5jZSB3ZSdyZSBjb21wbGV0aW5nIHByZW1hdHVyZWx5LiAqL1xuXHRcdFx0XHRcdGlmIChwcm9wZXJ0aWVzTWFwID09PSBcInN0b3BcIikge1xuXHRcdFx0XHRcdFx0JC5lYWNoKGNhbGxzVG9TdG9wLCBmdW5jdGlvbihpLCBqKSB7XG5cdFx0XHRcdFx0XHRcdGNvbXBsZXRlQ2FsbChqLCB0cnVlKTtcblx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRpZiAocHJvbWlzZURhdGEucHJvbWlzZSkge1xuXHRcdFx0XHRcdFx0XHQvKiBJbW1lZGlhdGVseSByZXNvbHZlIHRoZSBwcm9taXNlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHN0b3AgY2FsbCBzaW5jZSBzdG9wIHJ1bnMgc3luY2hyb25vdXNseS4gKi9cblx0XHRcdFx0XHRcdFx0cHJvbWlzZURhdGEucmVzb2x2ZXIoZWxlbWVudHMpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8qIFNpbmNlIHdlJ3JlIHN0b3BwaW5nLCBhbmQgbm90IHByb2NlZWRpbmcgd2l0aCBxdWV1ZWluZywgZXhpdCBvdXQgb2YgVmVsb2NpdHkuICovXG5cdFx0XHRcdFx0cmV0dXJuIGdldENoYWluKCk7XG5cblx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHQvKiBUcmVhdCBhIG5vbi1lbXB0eSBwbGFpbiBvYmplY3QgYXMgYSBsaXRlcmFsIHByb3BlcnRpZXMgbWFwLiAqL1xuXHRcdFx0XHRcdGlmICgkLmlzUGxhaW5PYmplY3QocHJvcGVydGllc01hcCkgJiYgIVR5cGUuaXNFbXB0eU9iamVjdChwcm9wZXJ0aWVzTWFwKSkge1xuXHRcdFx0XHRcdFx0YWN0aW9uID0gXCJzdGFydFwiO1xuXG5cdFx0XHRcdFx0XHQvKioqKioqKioqKioqKioqKlxuXHRcdFx0XHRcdFx0IFJlZGlyZWN0c1xuXHRcdFx0XHRcdFx0ICoqKioqKioqKioqKioqKiovXG5cblx0XHRcdFx0XHRcdC8qIENoZWNrIGlmIGEgc3RyaW5nIG1hdGNoZXMgYSByZWdpc3RlcmVkIHJlZGlyZWN0IChzZWUgUmVkaXJlY3RzIGFib3ZlKS4gKi9cblx0XHRcdFx0XHR9IGVsc2UgaWYgKFR5cGUuaXNTdHJpbmcocHJvcGVydGllc01hcCkgJiYgVmVsb2NpdHkuUmVkaXJlY3RzW3Byb3BlcnRpZXNNYXBdKSB7XG5cdFx0XHRcdFx0XHRvcHRzID0gJC5leHRlbmQoe30sIG9wdGlvbnMpO1xuXG5cdFx0XHRcdFx0XHR2YXIgZHVyYXRpb25PcmlnaW5hbCA9IG9wdHMuZHVyYXRpb24sXG5cdFx0XHRcdFx0XHRcdFx0ZGVsYXlPcmlnaW5hbCA9IG9wdHMuZGVsYXkgfHwgMDtcblxuXHRcdFx0XHRcdFx0LyogSWYgdGhlIGJhY2t3YXJkcyBvcHRpb24gd2FzIHBhc3NlZCBpbiwgcmV2ZXJzZSB0aGUgZWxlbWVudCBzZXQgc28gdGhhdCBlbGVtZW50cyBhbmltYXRlIGZyb20gdGhlIGxhc3QgdG8gdGhlIGZpcnN0LiAqL1xuXHRcdFx0XHRcdFx0aWYgKG9wdHMuYmFja3dhcmRzID09PSB0cnVlKSB7XG5cdFx0XHRcdFx0XHRcdGVsZW1lbnRzID0gJC5leHRlbmQodHJ1ZSwgW10sIGVsZW1lbnRzKS5yZXZlcnNlKCk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8qIEluZGl2aWR1YWxseSB0cmlnZ2VyIHRoZSByZWRpcmVjdCBmb3IgZWFjaCBlbGVtZW50IGluIHRoZSBzZXQgdG8gcHJldmVudCB1c2VycyBmcm9tIGhhdmluZyB0byBoYW5kbGUgaXRlcmF0aW9uIGxvZ2ljIGluIHRoZWlyIHJlZGlyZWN0LiAqL1xuXHRcdFx0XHRcdFx0JC5lYWNoKGVsZW1lbnRzLCBmdW5jdGlvbihlbGVtZW50SW5kZXgsIGVsZW1lbnQpIHtcblx0XHRcdFx0XHRcdFx0LyogSWYgdGhlIHN0YWdnZXIgb3B0aW9uIHdhcyBwYXNzZWQgaW4sIHN1Y2Nlc3NpdmVseSBkZWxheSBlYWNoIGVsZW1lbnQgYnkgdGhlIHN0YWdnZXIgdmFsdWUgKGluIG1zKS4gUmV0YWluIHRoZSBvcmlnaW5hbCBkZWxheSB2YWx1ZS4gKi9cblx0XHRcdFx0XHRcdFx0aWYgKHBhcnNlRmxvYXQob3B0cy5zdGFnZ2VyKSkge1xuXHRcdFx0XHRcdFx0XHRcdG9wdHMuZGVsYXkgPSBkZWxheU9yaWdpbmFsICsgKHBhcnNlRmxvYXQob3B0cy5zdGFnZ2VyKSAqIGVsZW1lbnRJbmRleCk7XG5cdFx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoVHlwZS5pc0Z1bmN0aW9uKG9wdHMuc3RhZ2dlcikpIHtcblx0XHRcdFx0XHRcdFx0XHRvcHRzLmRlbGF5ID0gZGVsYXlPcmlnaW5hbCArIG9wdHMuc3RhZ2dlci5jYWxsKGVsZW1lbnQsIGVsZW1lbnRJbmRleCwgZWxlbWVudHNMZW5ndGgpO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0LyogSWYgdGhlIGRyYWcgb3B0aW9uIHdhcyBwYXNzZWQgaW4sIHN1Y2Nlc3NpdmVseSBpbmNyZWFzZS9kZWNyZWFzZSAoZGVwZW5kaW5nIG9uIHRoZSBwcmVzZW5zZSBvZiBvcHRzLmJhY2t3YXJkcylcblx0XHRcdFx0XHRcdFx0IHRoZSBkdXJhdGlvbiBvZiBlYWNoIGVsZW1lbnQncyBhbmltYXRpb24sIHVzaW5nIGZsb29ycyB0byBwcmV2ZW50IHByb2R1Y2luZyB2ZXJ5IHNob3J0IGR1cmF0aW9ucy4gKi9cblx0XHRcdFx0XHRcdFx0aWYgKG9wdHMuZHJhZykge1xuXHRcdFx0XHRcdFx0XHRcdC8qIERlZmF1bHQgdGhlIGR1cmF0aW9uIG9mIFVJIHBhY2sgZWZmZWN0cyAoY2FsbG91dHMgYW5kIHRyYW5zaXRpb25zKSB0byAxMDAwbXMgaW5zdGVhZCBvZiB0aGUgdXN1YWwgZGVmYXVsdCBkdXJhdGlvbiBvZiA0MDBtcy4gKi9cblx0XHRcdFx0XHRcdFx0XHRvcHRzLmR1cmF0aW9uID0gcGFyc2VGbG9hdChkdXJhdGlvbk9yaWdpbmFsKSB8fCAoL14oY2FsbG91dHx0cmFuc2l0aW9uKS8udGVzdChwcm9wZXJ0aWVzTWFwKSA/IDEwMDAgOiBEVVJBVElPTl9ERUZBVUxUKTtcblxuXHRcdFx0XHRcdFx0XHRcdC8qIEZvciBlYWNoIGVsZW1lbnQsIHRha2UgdGhlIGdyZWF0ZXIgZHVyYXRpb24gb2Y6IEEpIGFuaW1hdGlvbiBjb21wbGV0aW9uIHBlcmNlbnRhZ2UgcmVsYXRpdmUgdG8gdGhlIG9yaWdpbmFsIGR1cmF0aW9uLFxuXHRcdFx0XHRcdFx0XHRcdCBCKSA3NSUgb2YgdGhlIG9yaWdpbmFsIGR1cmF0aW9uLCBvciBDKSBhIDIwMG1zIGZhbGxiYWNrIChpbiBjYXNlIGR1cmF0aW9uIGlzIGFscmVhZHkgc2V0IHRvIGEgbG93IHZhbHVlKS5cblx0XHRcdFx0XHRcdFx0XHQgVGhlIGVuZCByZXN1bHQgaXMgYSBiYXNlbGluZSBvZiA3NSUgb2YgdGhlIHJlZGlyZWN0J3MgZHVyYXRpb24gdGhhdCBpbmNyZWFzZXMvZGVjcmVhc2VzIGFzIHRoZSBlbmQgb2YgdGhlIGVsZW1lbnQgc2V0IGlzIGFwcHJvYWNoZWQuICovXG5cdFx0XHRcdFx0XHRcdFx0b3B0cy5kdXJhdGlvbiA9IE1hdGgubWF4KG9wdHMuZHVyYXRpb24gKiAob3B0cy5iYWNrd2FyZHMgPyAxIC0gZWxlbWVudEluZGV4IC8gZWxlbWVudHNMZW5ndGggOiAoZWxlbWVudEluZGV4ICsgMSkgLyBlbGVtZW50c0xlbmd0aCksIG9wdHMuZHVyYXRpb24gKiAwLjc1LCAyMDApO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0LyogUGFzcyBpbiB0aGUgY2FsbCdzIG9wdHMgb2JqZWN0IHNvIHRoYXQgdGhlIHJlZGlyZWN0IGNhbiBvcHRpb25hbGx5IGV4dGVuZCBpdC4gSXQgZGVmYXVsdHMgdG8gYW4gZW1wdHkgb2JqZWN0IGluc3RlYWQgb2YgbnVsbCB0b1xuXHRcdFx0XHRcdFx0XHQgcmVkdWNlIHRoZSBvcHRzIGNoZWNraW5nIGxvZ2ljIHJlcXVpcmVkIGluc2lkZSB0aGUgcmVkaXJlY3QuICovXG5cdFx0XHRcdFx0XHRcdFZlbG9jaXR5LlJlZGlyZWN0c1twcm9wZXJ0aWVzTWFwXS5jYWxsKGVsZW1lbnQsIGVsZW1lbnQsIG9wdHMgfHwge30sIGVsZW1lbnRJbmRleCwgZWxlbWVudHNMZW5ndGgsIGVsZW1lbnRzLCBwcm9taXNlRGF0YS5wcm9taXNlID8gcHJvbWlzZURhdGEgOiB1bmRlZmluZWQpO1xuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdC8qIFNpbmNlIHRoZSBhbmltYXRpb24gbG9naWMgcmVzaWRlcyB3aXRoaW4gdGhlIHJlZGlyZWN0J3Mgb3duIGNvZGUsIGFib3J0IHRoZSByZW1haW5kZXIgb2YgdGhpcyBjYWxsLlxuXHRcdFx0XHRcdFx0IChUaGUgcGVyZm9ybWFuY2Ugb3ZlcmhlYWQgdXAgdG8gdGhpcyBwb2ludCBpcyB2aXJ0dWFsbHkgbm9uLWV4aXN0YW50LikgKi9cblx0XHRcdFx0XHRcdC8qIE5vdGU6IFRoZSBqUXVlcnkgY2FsbCBjaGFpbiBpcyBrZXB0IGludGFjdCBieSByZXR1cm5pbmcgdGhlIGNvbXBsZXRlIGVsZW1lbnQgc2V0LiAqL1xuXHRcdFx0XHRcdFx0cmV0dXJuIGdldENoYWluKCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHZhciBhYm9ydEVycm9yID0gXCJWZWxvY2l0eTogRmlyc3QgYXJndW1lbnQgKFwiICsgcHJvcGVydGllc01hcCArIFwiKSB3YXMgbm90IGEgcHJvcGVydHkgbWFwLCBhIGtub3duIGFjdGlvbiwgb3IgYSByZWdpc3RlcmVkIHJlZGlyZWN0LiBBYm9ydGluZy5cIjtcblxuXHRcdFx0XHRcdFx0aWYgKHByb21pc2VEYXRhLnByb21pc2UpIHtcblx0XHRcdFx0XHRcdFx0cHJvbWlzZURhdGEucmVqZWN0ZXIobmV3IEVycm9yKGFib3J0RXJyb3IpKTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGFib3J0RXJyb3IpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRyZXR1cm4gZ2V0Q2hhaW4oKTtcblx0XHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8qKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0IENhbGwtV2lkZSBWYXJpYWJsZXNcblx0XHRcdCAqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0LyogQSBjb250YWluZXIgZm9yIENTUyB1bml0IGNvbnZlcnNpb24gcmF0aW9zIChlLmcuICUsIHJlbSwgYW5kIGVtID09PiBweCkgdGhhdCBpcyB1c2VkIHRvIGNhY2hlIHJhdGlvcyBhY3Jvc3MgYWxsIGVsZW1lbnRzXG5cdFx0XHQgYmVpbmcgYW5pbWF0ZWQgaW4gYSBzaW5nbGUgVmVsb2NpdHkgY2FsbC4gQ2FsY3VsYXRpbmcgdW5pdCByYXRpb3MgbmVjZXNzaXRhdGVzIERPTSBxdWVyeWluZyBhbmQgdXBkYXRpbmcsIGFuZCBpcyB0aGVyZWZvcmVcblx0XHRcdCBhdm9pZGVkICh2aWEgY2FjaGluZykgd2hlcmV2ZXIgcG9zc2libGUuIFRoaXMgY29udGFpbmVyIGlzIGNhbGwtd2lkZSBpbnN0ZWFkIG9mIHBhZ2Utd2lkZSB0byBhdm9pZCB0aGUgcmlzayBvZiB1c2luZyBzdGFsZVxuXHRcdFx0IGNvbnZlcnNpb24gbWV0cmljcyBhY3Jvc3MgVmVsb2NpdHkgYW5pbWF0aW9ucyB0aGF0IGFyZSBub3QgaW1tZWRpYXRlbHkgY29uc2VjdXRpdmVseSBjaGFpbmVkLiAqL1xuXHRcdFx0dmFyIGNhbGxVbml0Q29udmVyc2lvbkRhdGEgPSB7XG5cdFx0XHRcdGxhc3RQYXJlbnQ6IG51bGwsXG5cdFx0XHRcdGxhc3RQb3NpdGlvbjogbnVsbCxcblx0XHRcdFx0bGFzdEZvbnRTaXplOiBudWxsLFxuXHRcdFx0XHRsYXN0UGVyY2VudFRvUHhXaWR0aDogbnVsbCxcblx0XHRcdFx0bGFzdFBlcmNlbnRUb1B4SGVpZ2h0OiBudWxsLFxuXHRcdFx0XHRsYXN0RW1Ub1B4OiBudWxsLFxuXHRcdFx0XHRyZW1Ub1B4OiBudWxsLFxuXHRcdFx0XHR2d1RvUHg6IG51bGwsXG5cdFx0XHRcdHZoVG9QeDogbnVsbFxuXHRcdFx0fTtcblxuXHRcdFx0LyogQSBjb250YWluZXIgZm9yIGFsbCB0aGUgZW5zdWluZyB0d2VlbiBkYXRhIGFuZCBtZXRhZGF0YSBhc3NvY2lhdGVkIHdpdGggdGhpcyBjYWxsLiBUaGlzIGNvbnRhaW5lciBnZXRzIHB1c2hlZCB0byB0aGUgcGFnZS13aWRlXG5cdFx0XHQgVmVsb2NpdHkuU3RhdGUuY2FsbHMgYXJyYXkgdGhhdCBpcyBwcm9jZXNzZWQgZHVyaW5nIGFuaW1hdGlvbiB0aWNraW5nLiAqL1xuXHRcdFx0dmFyIGNhbGwgPSBbXTtcblxuXHRcdFx0LyoqKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0IEVsZW1lbnQgUHJvY2Vzc2luZ1xuXHRcdFx0ICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0LyogRWxlbWVudCBwcm9jZXNzaW5nIGNvbnNpc3RzIG9mIHRocmVlIHBhcnRzIC0tIGRhdGEgcHJvY2Vzc2luZyB0aGF0IGNhbm5vdCBnbyBzdGFsZSBhbmQgZGF0YSBwcm9jZXNzaW5nIHRoYXQgKmNhbiogZ28gc3RhbGUgKGkuZS4gdGhpcmQtcGFydHkgc3R5bGUgbW9kaWZpY2F0aW9ucyk6XG5cdFx0XHQgMSkgUHJlLVF1ZXVlaW5nOiBFbGVtZW50LXdpZGUgdmFyaWFibGVzLCBpbmNsdWRpbmcgdGhlIGVsZW1lbnQncyBkYXRhIHN0b3JhZ2UsIGFyZSBpbnN0YW50aWF0ZWQuIENhbGwgb3B0aW9ucyBhcmUgcHJlcGFyZWQuIElmIHRyaWdnZXJlZCwgdGhlIFN0b3AgYWN0aW9uIGlzIGV4ZWN1dGVkLlxuXHRcdFx0IDIpIFF1ZXVlaW5nOiBUaGUgbG9naWMgdGhhdCBydW5zIG9uY2UgdGhpcyBjYWxsIGhhcyByZWFjaGVkIGl0cyBwb2ludCBvZiBleGVjdXRpb24gaW4gdGhlIGVsZW1lbnQncyAkLnF1ZXVlKCkgc3RhY2suIE1vc3QgbG9naWMgaXMgcGxhY2VkIGhlcmUgdG8gYXZvaWQgcmlza2luZyBpdCBiZWNvbWluZyBzdGFsZS5cblx0XHRcdCAzKSBQdXNoaW5nOiBDb25zb2xpZGF0aW9uIG9mIHRoZSB0d2VlbiBkYXRhIGZvbGxvd2VkIGJ5IGl0cyBwdXNoIG9udG8gdGhlIGdsb2JhbCBpbi1wcm9ncmVzcyBjYWxscyBjb250YWluZXIuXG5cdFx0XHQgYGVsZW1lbnRBcnJheUluZGV4YCBhbGxvd3MgcGFzc2luZyBpbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgb3JpZ2luYWwgYXJyYXkgdG8gdmFsdWUgZnVuY3Rpb25zLlxuXHRcdFx0IElmIGBlbGVtZW50c0luZGV4YCB3ZXJlIHVzZWQgaW5zdGVhZCB0aGUgaW5kZXggd291bGQgYmUgZGV0ZXJtaW5lZCBieSB0aGUgZWxlbWVudHMnIHBlci1lbGVtZW50IHF1ZXVlLlxuXHRcdFx0ICovXG5cdFx0XHRmdW5jdGlvbiBwcm9jZXNzRWxlbWVudChlbGVtZW50LCBlbGVtZW50QXJyYXlJbmRleCkge1xuXG5cdFx0XHRcdC8qKioqKioqKioqKioqKioqKioqKioqKioqXG5cdFx0XHRcdCBQYXJ0IEk6IFByZS1RdWV1ZWluZ1xuXHRcdFx0XHQgKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0XHQvKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdFx0XHRcdCBFbGVtZW50LVdpZGUgVmFyaWFibGVzXG5cdFx0XHRcdCAqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdFx0dmFyIC8qIFRoZSBydW50aW1lIG9wdHMgb2JqZWN0IGlzIHRoZSBleHRlbnNpb24gb2YgdGhlIGN1cnJlbnQgY2FsbCdzIG9wdGlvbnMgYW5kIFZlbG9jaXR5J3MgcGFnZS13aWRlIG9wdGlvbiBkZWZhdWx0cy4gKi9cblx0XHRcdFx0XHRcdG9wdHMgPSAkLmV4dGVuZCh7fSwgVmVsb2NpdHkuZGVmYXVsdHMsIG9wdGlvbnMpLFxuXHRcdFx0XHRcdFx0LyogQSBjb250YWluZXIgZm9yIHRoZSBwcm9jZXNzZWQgZGF0YSBhc3NvY2lhdGVkIHdpdGggZWFjaCBwcm9wZXJ0eSBpbiB0aGUgcHJvcGVydHlNYXAuXG5cdFx0XHRcdFx0XHQgKEVhY2ggcHJvcGVydHkgaW4gdGhlIG1hcCBwcm9kdWNlcyBpdHMgb3duIFwidHdlZW5cIi4pICovXG5cdFx0XHRcdFx0XHR0d2VlbnNDb250YWluZXIgPSB7fSxcblx0XHRcdFx0XHRcdGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGE7XG5cblx0XHRcdFx0LyoqKioqKioqKioqKioqKioqKlxuXHRcdFx0XHQgRWxlbWVudCBJbml0XG5cdFx0XHRcdCAqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdFx0aWYgKERhdGEoZWxlbWVudCkgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFZlbG9jaXR5LmluaXQoZWxlbWVudCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvKioqKioqKioqKioqKioqKioqXG5cdFx0XHRcdCBPcHRpb246IERlbGF5XG5cdFx0XHRcdCAqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdFx0LyogU2luY2UgcXVldWU6ZmFsc2UgZG9lc24ndCByZXNwZWN0IHRoZSBpdGVtJ3MgZXhpc3RpbmcgcXVldWUsIHdlIGF2b2lkIGluamVjdGluZyBpdHMgZGVsYXkgaGVyZSAoaXQncyBzZXQgbGF0ZXIgb24pLiAqL1xuXHRcdFx0XHQvKiBOb3RlOiBWZWxvY2l0eSByb2xscyBpdHMgb3duIGRlbGF5IGZ1bmN0aW9uIHNpbmNlIGpRdWVyeSBkb2Vzbid0IGhhdmUgYSB1dGlsaXR5IGFsaWFzIGZvciAkLmZuLmRlbGF5KClcblx0XHRcdFx0IChhbmQgdGh1cyByZXF1aXJlcyBqUXVlcnkgZWxlbWVudCBjcmVhdGlvbiwgd2hpY2ggd2UgYXZvaWQgc2luY2UgaXRzIG92ZXJoZWFkIGluY2x1ZGVzIERPTSBxdWVyeWluZykuICovXG5cdFx0XHRcdGlmIChwYXJzZUZsb2F0KG9wdHMuZGVsYXkpICYmIG9wdHMucXVldWUgIT09IGZhbHNlKSB7XG5cdFx0XHRcdFx0JC5xdWV1ZShlbGVtZW50LCBvcHRzLnF1ZXVlLCBmdW5jdGlvbihuZXh0KSB7XG5cdFx0XHRcdFx0XHQvKiBUaGlzIGlzIGEgZmxhZyB1c2VkIHRvIGluZGljYXRlIHRvIHRoZSB1cGNvbWluZyBjb21wbGV0ZUNhbGwoKSBmdW5jdGlvbiB0aGF0IHRoaXMgcXVldWUgZW50cnkgd2FzIGluaXRpYXRlZCBieSBWZWxvY2l0eS4gU2VlIGNvbXBsZXRlQ2FsbCgpIGZvciBmdXJ0aGVyIGRldGFpbHMuICovXG5cdFx0XHRcdFx0XHRWZWxvY2l0eS52ZWxvY2l0eVF1ZXVlRW50cnlGbGFnID0gdHJ1ZTtcblxuXHRcdFx0XHRcdFx0LyogVGhlIGVuc3VpbmcgcXVldWUgaXRlbSAod2hpY2ggaXMgYXNzaWduZWQgdG8gdGhlIFwibmV4dFwiIGFyZ3VtZW50IHRoYXQgJC5xdWV1ZSgpIGF1dG9tYXRpY2FsbHkgcGFzc2VzIGluKSB3aWxsIGJlIHRyaWdnZXJlZCBhZnRlciBhIHNldFRpbWVvdXQgZGVsYXkuXG5cdFx0XHRcdFx0XHQgVGhlIHNldFRpbWVvdXQgaXMgc3RvcmVkIHNvIHRoYXQgaXQgY2FuIGJlIHN1YmplY3RlZCB0byBjbGVhclRpbWVvdXQoKSBpZiB0aGlzIGFuaW1hdGlvbiBpcyBwcmVtYXR1cmVseSBzdG9wcGVkIHZpYSBWZWxvY2l0eSdzIFwic3RvcFwiIGNvbW1hbmQuICovXG5cdFx0XHRcdFx0XHREYXRhKGVsZW1lbnQpLmRlbGF5VGltZXIgPSB7XG5cdFx0XHRcdFx0XHRcdHNldFRpbWVvdXQ6IHNldFRpbWVvdXQobmV4dCwgcGFyc2VGbG9hdChvcHRzLmRlbGF5KSksXG5cdFx0XHRcdFx0XHRcdG5leHQ6IG5leHRcblx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvKioqKioqKioqKioqKioqKioqKioqXG5cdFx0XHRcdCBPcHRpb246IER1cmF0aW9uXG5cdFx0XHRcdCAqKioqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdFx0LyogU3VwcG9ydCBmb3IgalF1ZXJ5J3MgbmFtZWQgZHVyYXRpb25zLiAqL1xuXHRcdFx0XHRzd2l0Y2ggKG9wdHMuZHVyYXRpb24udG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0XHRcdFx0Y2FzZSBcImZhc3RcIjpcblx0XHRcdFx0XHRcdG9wdHMuZHVyYXRpb24gPSAyMDA7XG5cdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdGNhc2UgXCJub3JtYWxcIjpcblx0XHRcdFx0XHRcdG9wdHMuZHVyYXRpb24gPSBEVVJBVElPTl9ERUZBVUxUO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0XHRjYXNlIFwic2xvd1wiOlxuXHRcdFx0XHRcdFx0b3B0cy5kdXJhdGlvbiA9IDYwMDtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRcdC8qIFJlbW92ZSB0aGUgcG90ZW50aWFsIFwibXNcIiBzdWZmaXggYW5kIGRlZmF1bHQgdG8gMSBpZiB0aGUgdXNlciBpcyBhdHRlbXB0aW5nIHRvIHNldCBhIGR1cmF0aW9uIG9mIDAgKGluIG9yZGVyIHRvIHByb2R1Y2UgYW4gaW1tZWRpYXRlIHN0eWxlIGNoYW5nZSkuICovXG5cdFx0XHRcdFx0XHRvcHRzLmR1cmF0aW9uID0gcGFyc2VGbG9hdChvcHRzLmR1cmF0aW9uKSB8fCAxO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0LyoqKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0XHQgR2xvYmFsIE9wdGlvbjogTW9ja1xuXHRcdFx0XHQgKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0XHRcdGlmIChWZWxvY2l0eS5tb2NrICE9PSBmYWxzZSkge1xuXHRcdFx0XHRcdC8qIEluIG1vY2sgbW9kZSwgYWxsIGFuaW1hdGlvbnMgYXJlIGZvcmNlZCB0byAxbXMgc28gdGhhdCB0aGV5IG9jY3VyIGltbWVkaWF0ZWx5IHVwb24gdGhlIG5leHQgckFGIHRpY2suXG5cdFx0XHRcdFx0IEFsdGVybmF0aXZlbHksIGEgbXVsdGlwbGllciBjYW4gYmUgcGFzc2VkIGluIHRvIHRpbWUgcmVtYXAgYWxsIGRlbGF5cyBhbmQgZHVyYXRpb25zLiAqL1xuXHRcdFx0XHRcdGlmIChWZWxvY2l0eS5tb2NrID09PSB0cnVlKSB7XG5cdFx0XHRcdFx0XHRvcHRzLmR1cmF0aW9uID0gb3B0cy5kZWxheSA9IDE7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdG9wdHMuZHVyYXRpb24gKj0gcGFyc2VGbG9hdChWZWxvY2l0eS5tb2NrKSB8fCAxO1xuXHRcdFx0XHRcdFx0b3B0cy5kZWxheSAqPSBwYXJzZUZsb2F0KFZlbG9jaXR5Lm1vY2spIHx8IDE7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0LyoqKioqKioqKioqKioqKioqKipcblx0XHRcdFx0IE9wdGlvbjogRWFzaW5nXG5cdFx0XHRcdCAqKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0XHRcdG9wdHMuZWFzaW5nID0gZ2V0RWFzaW5nKG9wdHMuZWFzaW5nLCBvcHRzLmR1cmF0aW9uKTtcblxuXHRcdFx0XHQvKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0XHQgT3B0aW9uOiBDYWxsYmFja3Ncblx0XHRcdFx0ICoqKioqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdFx0LyogQ2FsbGJhY2tzIG11c3QgZnVuY3Rpb25zLiBPdGhlcndpc2UsIGRlZmF1bHQgdG8gbnVsbC4gKi9cblx0XHRcdFx0aWYgKG9wdHMuYmVnaW4gJiYgIVR5cGUuaXNGdW5jdGlvbihvcHRzLmJlZ2luKSkge1xuXHRcdFx0XHRcdG9wdHMuYmVnaW4gPSBudWxsO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKG9wdHMucHJvZ3Jlc3MgJiYgIVR5cGUuaXNGdW5jdGlvbihvcHRzLnByb2dyZXNzKSkge1xuXHRcdFx0XHRcdG9wdHMucHJvZ3Jlc3MgPSBudWxsO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKG9wdHMuY29tcGxldGUgJiYgIVR5cGUuaXNGdW5jdGlvbihvcHRzLmNvbXBsZXRlKSkge1xuXHRcdFx0XHRcdG9wdHMuY29tcGxldGUgPSBudWxsO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0LyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0XHQgT3B0aW9uOiBEaXNwbGF5ICYgVmlzaWJpbGl0eVxuXHRcdFx0XHQgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0XHRcdC8qIFJlZmVyIHRvIFZlbG9jaXR5J3MgZG9jdW1lbnRhdGlvbiAoVmVsb2NpdHlKUy5vcmcvI2Rpc3BsYXlBbmRWaXNpYmlsaXR5KSBmb3IgYSBkZXNjcmlwdGlvbiBvZiB0aGUgZGlzcGxheSBhbmQgdmlzaWJpbGl0eSBvcHRpb25zJyBiZWhhdmlvci4gKi9cblx0XHRcdFx0LyogTm90ZTogV2Ugc3RyaWN0bHkgY2hlY2sgZm9yIHVuZGVmaW5lZCBpbnN0ZWFkIG9mIGZhbHNpbmVzcyBiZWNhdXNlIGRpc3BsYXkgYWNjZXB0cyBhbiBlbXB0eSBzdHJpbmcgdmFsdWUuICovXG5cdFx0XHRcdGlmIChvcHRzLmRpc3BsYXkgIT09IHVuZGVmaW5lZCAmJiBvcHRzLmRpc3BsYXkgIT09IG51bGwpIHtcblx0XHRcdFx0XHRvcHRzLmRpc3BsYXkgPSBvcHRzLmRpc3BsYXkudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpO1xuXG5cdFx0XHRcdFx0LyogVXNlcnMgY2FuIHBhc3MgaW4gYSBzcGVjaWFsIFwiYXV0b1wiIHZhbHVlIHRvIGluc3RydWN0IFZlbG9jaXR5IHRvIHNldCB0aGUgZWxlbWVudCB0byBpdHMgZGVmYXVsdCBkaXNwbGF5IHZhbHVlLiAqL1xuXHRcdFx0XHRcdGlmIChvcHRzLmRpc3BsYXkgPT09IFwiYXV0b1wiKSB7XG5cdFx0XHRcdFx0XHRvcHRzLmRpc3BsYXkgPSBWZWxvY2l0eS5DU1MuVmFsdWVzLmdldERpc3BsYXlUeXBlKGVsZW1lbnQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChvcHRzLnZpc2liaWxpdHkgIT09IHVuZGVmaW5lZCAmJiBvcHRzLnZpc2liaWxpdHkgIT09IG51bGwpIHtcblx0XHRcdFx0XHRvcHRzLnZpc2liaWxpdHkgPSBvcHRzLnZpc2liaWxpdHkudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0LyoqKioqKioqKioqKioqKioqKioqKipcblx0XHRcdFx0IE9wdGlvbjogbW9iaWxlSEFcblx0XHRcdFx0ICoqKioqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdFx0LyogV2hlbiBzZXQgdG8gdHJ1ZSwgYW5kIGlmIHRoaXMgaXMgYSBtb2JpbGUgZGV2aWNlLCBtb2JpbGVIQSBhdXRvbWF0aWNhbGx5IGVuYWJsZXMgaGFyZHdhcmUgYWNjZWxlcmF0aW9uICh2aWEgYSBudWxsIHRyYW5zZm9ybSBoYWNrKVxuXHRcdFx0XHQgb24gYW5pbWF0aW5nIGVsZW1lbnRzLiBIQSBpcyByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQgYXQgdGhlIGNvbXBsZXRpb24gb2YgaXRzIGFuaW1hdGlvbi4gKi9cblx0XHRcdFx0LyogTm90ZTogQW5kcm9pZCBHaW5nZXJicmVhZCBkb2Vzbid0IHN1cHBvcnQgSEEuIElmIGEgbnVsbCB0cmFuc2Zvcm0gaGFjayAobW9iaWxlSEEpIGlzIGluIGZhY3Qgc2V0LCBpdCB3aWxsIHByZXZlbnQgb3RoZXIgdHJhbmZvcm0gc3VicHJvcGVydGllcyBmcm9tIHRha2luZyBlZmZlY3QuICovXG5cdFx0XHRcdC8qIE5vdGU6IFlvdSBjYW4gcmVhZCBtb3JlIGFib3V0IHRoZSB1c2Ugb2YgbW9iaWxlSEEgaW4gVmVsb2NpdHkncyBkb2N1bWVudGF0aW9uOiBWZWxvY2l0eUpTLm9yZy8jbW9iaWxlSEEuICovXG5cdFx0XHRcdG9wdHMubW9iaWxlSEEgPSAob3B0cy5tb2JpbGVIQSAmJiBWZWxvY2l0eS5TdGF0ZS5pc01vYmlsZSAmJiAhVmVsb2NpdHkuU3RhdGUuaXNHaW5nZXJicmVhZCk7XG5cblx0XHRcdFx0LyoqKioqKioqKioqKioqKioqKioqKioqXG5cdFx0XHRcdCBQYXJ0IElJOiBRdWV1ZWluZ1xuXHRcdFx0XHQgKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdFx0LyogV2hlbiBhIHNldCBvZiBlbGVtZW50cyBpcyB0YXJnZXRlZCBieSBhIFZlbG9jaXR5IGNhbGwsIHRoZSBzZXQgaXMgYnJva2VuIHVwIGFuZCBlYWNoIGVsZW1lbnQgaGFzIHRoZSBjdXJyZW50IFZlbG9jaXR5IGNhbGwgaW5kaXZpZHVhbGx5IHF1ZXVlZCBvbnRvIGl0LlxuXHRcdFx0XHQgSW4gdGhpcyB3YXksIGVhY2ggZWxlbWVudCdzIGV4aXN0aW5nIHF1ZXVlIGlzIHJlc3BlY3RlZDsgc29tZSBlbGVtZW50cyBtYXkgYWxyZWFkeSBiZSBhbmltYXRpbmcgYW5kIGFjY29yZGluZ2x5IHNob3VsZCBub3QgaGF2ZSB0aGlzIGN1cnJlbnQgVmVsb2NpdHkgY2FsbCB0cmlnZ2VyZWQgaW1tZWRpYXRlbHkuICovXG5cdFx0XHRcdC8qIEluIGVhY2ggcXVldWUsIHR3ZWVuIGRhdGEgaXMgcHJvY2Vzc2VkIGZvciBlYWNoIGFuaW1hdGluZyBwcm9wZXJ0eSB0aGVuIHB1c2hlZCBvbnRvIHRoZSBjYWxsLXdpZGUgY2FsbHMgYXJyYXkuIFdoZW4gdGhlIGxhc3QgZWxlbWVudCBpbiB0aGUgc2V0IGhhcyBoYWQgaXRzIHR3ZWVucyBwcm9jZXNzZWQsXG5cdFx0XHRcdCB0aGUgY2FsbCBhcnJheSBpcyBwdXNoZWQgdG8gVmVsb2NpdHkuU3RhdGUuY2FsbHMgZm9yIGxpdmUgcHJvY2Vzc2luZyBieSB0aGUgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHRpY2suICovXG5cdFx0XHRcdGZ1bmN0aW9uIGJ1aWxkUXVldWUobmV4dCkge1xuXHRcdFx0XHRcdHZhciBkYXRhLCBsYXN0VHdlZW5zQ29udGFpbmVyO1xuXG5cdFx0XHRcdFx0LyoqKioqKioqKioqKioqKioqKipcblx0XHRcdFx0XHQgT3B0aW9uOiBCZWdpblxuXHRcdFx0XHRcdCAqKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0XHRcdFx0LyogVGhlIGJlZ2luIGNhbGxiYWNrIGlzIGZpcmVkIG9uY2UgcGVyIGNhbGwgLS0gbm90IG9uY2UgcGVyIGVsZW1lbmV0IC0tIGFuZCBpcyBwYXNzZWQgdGhlIGZ1bGwgcmF3IERPTSBlbGVtZW50IHNldCBhcyBib3RoIGl0cyBjb250ZXh0IGFuZCBpdHMgZmlyc3QgYXJndW1lbnQuICovXG5cdFx0XHRcdFx0aWYgKG9wdHMuYmVnaW4gJiYgZWxlbWVudHNJbmRleCA9PT0gMCkge1xuXHRcdFx0XHRcdFx0LyogV2UgdGhyb3cgY2FsbGJhY2tzIGluIGEgc2V0VGltZW91dCBzbyB0aGF0IHRocm93biBlcnJvcnMgZG9uJ3QgaGFsdCB0aGUgZXhlY3V0aW9uIG9mIFZlbG9jaXR5IGl0c2VsZi4gKi9cblx0XHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRcdG9wdHMuYmVnaW4uY2FsbChlbGVtZW50cywgZWxlbWVudHMpO1xuXHRcdFx0XHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0XHR0aHJvdyBlcnJvcjtcblx0XHRcdFx0XHRcdFx0fSwgMSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0LyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdFx0XHRcdFx0IFR3ZWVuIERhdGEgQ29uc3RydWN0aW9uIChmb3IgU2Nyb2xsKVxuXHRcdFx0XHRcdCAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0XHRcdC8qIE5vdGU6IEluIG9yZGVyIHRvIGJlIHN1YmplY3RlZCB0byBjaGFpbmluZyBhbmQgYW5pbWF0aW9uIG9wdGlvbnMsIHNjcm9sbCdzIHR3ZWVuaW5nIGlzIHJvdXRlZCB0aHJvdWdoIFZlbG9jaXR5IGFzIGlmIGl0IHdlcmUgYSBzdGFuZGFyZCBDU1MgcHJvcGVydHkgYW5pbWF0aW9uLiAqL1xuXHRcdFx0XHRcdGlmIChhY3Rpb24gPT09IFwic2Nyb2xsXCIpIHtcblx0XHRcdFx0XHRcdC8qIFRoZSBzY3JvbGwgYWN0aW9uIHVuaXF1ZWx5IHRha2VzIGFuIG9wdGlvbmFsIFwib2Zmc2V0XCIgb3B0aW9uIC0tIHNwZWNpZmllZCBpbiBwaXhlbHMgLS0gdGhhdCBvZmZzZXRzIHRoZSB0YXJnZXRlZCBzY3JvbGwgcG9zaXRpb24uICovXG5cdFx0XHRcdFx0XHR2YXIgc2Nyb2xsRGlyZWN0aW9uID0gKC9eeCQvaS50ZXN0KG9wdHMuYXhpcykgPyBcIkxlZnRcIiA6IFwiVG9wXCIpLFxuXHRcdFx0XHRcdFx0XHRcdHNjcm9sbE9mZnNldCA9IHBhcnNlRmxvYXQob3B0cy5vZmZzZXQpIHx8IDAsXG5cdFx0XHRcdFx0XHRcdFx0c2Nyb2xsUG9zaXRpb25DdXJyZW50LFxuXHRcdFx0XHRcdFx0XHRcdHNjcm9sbFBvc2l0aW9uQ3VycmVudEFsdGVybmF0ZSxcblx0XHRcdFx0XHRcdFx0XHRzY3JvbGxQb3NpdGlvbkVuZDtcblxuXHRcdFx0XHRcdFx0LyogU2Nyb2xsIGFsc28gdW5pcXVlbHkgdGFrZXMgYW4gb3B0aW9uYWwgXCJjb250YWluZXJcIiBvcHRpb24sIHdoaWNoIGluZGljYXRlcyB0aGUgcGFyZW50IGVsZW1lbnQgdGhhdCBzaG91bGQgYmUgc2Nyb2xsZWQgLS1cblx0XHRcdFx0XHRcdCBhcyBvcHBvc2VkIHRvIHRoZSBicm93c2VyIHdpbmRvdyBpdHNlbGYuIFRoaXMgaXMgdXNlZnVsIGZvciBzY3JvbGxpbmcgdG93YXJkIGFuIGVsZW1lbnQgdGhhdCdzIGluc2lkZSBhbiBvdmVyZmxvd2luZyBwYXJlbnQgZWxlbWVudC4gKi9cblx0XHRcdFx0XHRcdGlmIChvcHRzLmNvbnRhaW5lcikge1xuXHRcdFx0XHRcdFx0XHQvKiBFbnN1cmUgdGhhdCBlaXRoZXIgYSBqUXVlcnkgb2JqZWN0IG9yIGEgcmF3IERPTSBlbGVtZW50IHdhcyBwYXNzZWQgaW4uICovXG5cdFx0XHRcdFx0XHRcdGlmIChUeXBlLmlzV3JhcHBlZChvcHRzLmNvbnRhaW5lcikgfHwgVHlwZS5pc05vZGUob3B0cy5jb250YWluZXIpKSB7XG5cdFx0XHRcdFx0XHRcdFx0LyogRXh0cmFjdCB0aGUgcmF3IERPTSBlbGVtZW50IGZyb20gdGhlIGpRdWVyeSB3cmFwcGVyLiAqL1xuXHRcdFx0XHRcdFx0XHRcdG9wdHMuY29udGFpbmVyID0gb3B0cy5jb250YWluZXJbMF0gfHwgb3B0cy5jb250YWluZXI7XG5cdFx0XHRcdFx0XHRcdFx0LyogTm90ZTogVW5saWtlIG90aGVyIHByb3BlcnRpZXMgaW4gVmVsb2NpdHksIHRoZSBicm93c2VyJ3Mgc2Nyb2xsIHBvc2l0aW9uIGlzIG5ldmVyIGNhY2hlZCBzaW5jZSBpdCBzbyBmcmVxdWVudGx5IGNoYW5nZXNcblx0XHRcdFx0XHRcdFx0XHQgKGR1ZSB0byB0aGUgdXNlcidzIG5hdHVyYWwgaW50ZXJhY3Rpb24gd2l0aCB0aGUgcGFnZSkuICovXG5cdFx0XHRcdFx0XHRcdFx0c2Nyb2xsUG9zaXRpb25DdXJyZW50ID0gb3B0cy5jb250YWluZXJbXCJzY3JvbGxcIiArIHNjcm9sbERpcmVjdGlvbl07IC8qIEdFVCAqL1xuXG5cdFx0XHRcdFx0XHRcdFx0LyogJC5wb3NpdGlvbigpIHZhbHVlcyBhcmUgcmVsYXRpdmUgdG8gdGhlIGNvbnRhaW5lcidzIGN1cnJlbnRseSB2aWV3YWJsZSBhcmVhICh3aXRob3V0IHRha2luZyBpbnRvIGFjY291bnQgdGhlIGNvbnRhaW5lcidzIHRydWUgZGltZW5zaW9uc1xuXHRcdFx0XHRcdFx0XHRcdCAtLSBzYXksIGZvciBleGFtcGxlLCBpZiB0aGUgY29udGFpbmVyIHdhcyBub3Qgb3ZlcmZsb3dpbmcpLiBUaHVzLCB0aGUgc2Nyb2xsIGVuZCB2YWx1ZSBpcyB0aGUgc3VtIG9mIHRoZSBjaGlsZCBlbGVtZW50J3MgcG9zaXRpb24gKmFuZCpcblx0XHRcdFx0XHRcdFx0XHQgdGhlIHNjcm9sbCBjb250YWluZXIncyBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbi4gKi9cblx0XHRcdFx0XHRcdFx0XHRzY3JvbGxQb3NpdGlvbkVuZCA9IChzY3JvbGxQb3NpdGlvbkN1cnJlbnQgKyAkKGVsZW1lbnQpLnBvc2l0aW9uKClbc2Nyb2xsRGlyZWN0aW9uLnRvTG93ZXJDYXNlKCldKSArIHNjcm9sbE9mZnNldDsgLyogR0VUICovXG5cdFx0XHRcdFx0XHRcdFx0LyogSWYgYSB2YWx1ZSBvdGhlciB0aGFuIGEgalF1ZXJ5IG9iamVjdCBvciBhIHJhdyBET00gZWxlbWVudCB3YXMgcGFzc2VkIGluLCBkZWZhdWx0IHRvIG51bGwgc28gdGhhdCB0aGlzIG9wdGlvbiBpcyBpZ25vcmVkLiAqL1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdG9wdHMuY29udGFpbmVyID0gbnVsbDtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0LyogSWYgdGhlIHdpbmRvdyBpdHNlbGYgaXMgYmVpbmcgc2Nyb2xsZWQgLS0gbm90IGEgY29udGFpbmluZyBlbGVtZW50IC0tIHBlcmZvcm0gYSBsaXZlIHNjcm9sbCBwb3NpdGlvbiBsb29rdXAgdXNpbmdcblx0XHRcdFx0XHRcdFx0IHRoZSBhcHByb3ByaWF0ZSBjYWNoZWQgcHJvcGVydHkgbmFtZXMgKHdoaWNoIGRpZmZlciBiYXNlZCBvbiBicm93c2VyIHR5cGUpLiAqL1xuXHRcdFx0XHRcdFx0XHRzY3JvbGxQb3NpdGlvbkN1cnJlbnQgPSBWZWxvY2l0eS5TdGF0ZS5zY3JvbGxBbmNob3JbVmVsb2NpdHkuU3RhdGVbXCJzY3JvbGxQcm9wZXJ0eVwiICsgc2Nyb2xsRGlyZWN0aW9uXV07IC8qIEdFVCAqL1xuXHRcdFx0XHRcdFx0XHQvKiBXaGVuIHNjcm9sbGluZyB0aGUgYnJvd3NlciB3aW5kb3csIGNhY2hlIHRoZSBhbHRlcm5hdGUgYXhpcydzIGN1cnJlbnQgdmFsdWUgc2luY2Ugd2luZG93LnNjcm9sbFRvKCkgZG9lc24ndCBsZXQgdXMgY2hhbmdlIG9ubHkgb25lIHZhbHVlIGF0IGEgdGltZS4gKi9cblx0XHRcdFx0XHRcdFx0c2Nyb2xsUG9zaXRpb25DdXJyZW50QWx0ZXJuYXRlID0gVmVsb2NpdHkuU3RhdGUuc2Nyb2xsQW5jaG9yW1ZlbG9jaXR5LlN0YXRlW1wic2Nyb2xsUHJvcGVydHlcIiArIChzY3JvbGxEaXJlY3Rpb24gPT09IFwiTGVmdFwiID8gXCJUb3BcIiA6IFwiTGVmdFwiKV1dOyAvKiBHRVQgKi9cblxuXHRcdFx0XHRcdFx0XHQvKiBVbmxpa2UgJC5wb3NpdGlvbigpLCAkLm9mZnNldCgpIHZhbHVlcyBhcmUgcmVsYXRpdmUgdG8gdGhlIGJyb3dzZXIgd2luZG93J3MgdHJ1ZSBkaW1lbnNpb25zIC0tIG5vdCBtZXJlbHkgaXRzIGN1cnJlbnRseSB2aWV3YWJsZSBhcmVhIC0tXG5cdFx0XHRcdFx0XHRcdCBhbmQgdGhlcmVmb3JlIGVuZCB2YWx1ZXMgZG8gbm90IG5lZWQgdG8gYmUgY29tcG91bmRlZCBvbnRvIGN1cnJlbnQgdmFsdWVzLiAqL1xuXHRcdFx0XHRcdFx0XHRzY3JvbGxQb3NpdGlvbkVuZCA9ICQoZWxlbWVudCkub2Zmc2V0KClbc2Nyb2xsRGlyZWN0aW9uLnRvTG93ZXJDYXNlKCldICsgc2Nyb2xsT2Zmc2V0OyAvKiBHRVQgKi9cblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0LyogU2luY2UgdGhlcmUncyBvbmx5IG9uZSBmb3JtYXQgdGhhdCBzY3JvbGwncyBhc3NvY2lhdGVkIHR3ZWVuc0NvbnRhaW5lciBjYW4gdGFrZSwgd2UgY3JlYXRlIGl0IG1hbnVhbGx5LiAqL1xuXHRcdFx0XHRcdFx0dHdlZW5zQ29udGFpbmVyID0ge1xuXHRcdFx0XHRcdFx0XHRzY3JvbGw6IHtcblx0XHRcdFx0XHRcdFx0XHRyb290UHJvcGVydHlWYWx1ZTogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0c3RhcnRWYWx1ZTogc2Nyb2xsUG9zaXRpb25DdXJyZW50LFxuXHRcdFx0XHRcdFx0XHRcdGN1cnJlbnRWYWx1ZTogc2Nyb2xsUG9zaXRpb25DdXJyZW50LFxuXHRcdFx0XHRcdFx0XHRcdGVuZFZhbHVlOiBzY3JvbGxQb3NpdGlvbkVuZCxcblx0XHRcdFx0XHRcdFx0XHR1bml0VHlwZTogXCJcIixcblx0XHRcdFx0XHRcdFx0XHRlYXNpbmc6IG9wdHMuZWFzaW5nLFxuXHRcdFx0XHRcdFx0XHRcdHNjcm9sbERhdGE6IHtcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnRhaW5lcjogb3B0cy5jb250YWluZXIsXG5cdFx0XHRcdFx0XHRcdFx0XHRkaXJlY3Rpb246IHNjcm9sbERpcmVjdGlvbixcblx0XHRcdFx0XHRcdFx0XHRcdGFsdGVybmF0ZVZhbHVlOiBzY3JvbGxQb3NpdGlvbkN1cnJlbnRBbHRlcm5hdGVcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdGVsZW1lbnQ6IGVsZW1lbnRcblx0XHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRcdGlmIChWZWxvY2l0eS5kZWJ1Zykge1xuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhcInR3ZWVuc0NvbnRhaW5lciAoc2Nyb2xsKTogXCIsIHR3ZWVuc0NvbnRhaW5lci5zY3JvbGwsIGVsZW1lbnQpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdFx0XHRcdFx0XHQgVHdlZW4gRGF0YSBDb25zdHJ1Y3Rpb24gKGZvciBSZXZlcnNlKVxuXHRcdFx0XHRcdFx0ICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0XHRcdFx0LyogUmV2ZXJzZSBhY3RzIGxpa2UgYSBcInN0YXJ0XCIgYWN0aW9uIGluIHRoYXQgYSBwcm9wZXJ0eSBtYXAgaXMgYW5pbWF0ZWQgdG93YXJkLiBUaGUgb25seSBkaWZmZXJlbmNlIGlzXG5cdFx0XHRcdFx0XHQgdGhhdCB0aGUgcHJvcGVydHkgbWFwIHVzZWQgZm9yIHJldmVyc2UgaXMgdGhlIGludmVyc2Ugb2YgdGhlIG1hcCB1c2VkIGluIHRoZSBwcmV2aW91cyBjYWxsLiBUaHVzLCB3ZSBtYW5pcHVsYXRlXG5cdFx0XHRcdFx0XHQgdGhlIHByZXZpb3VzIGNhbGwgdG8gY29uc3RydWN0IG91ciBuZXcgbWFwOiB1c2UgdGhlIHByZXZpb3VzIG1hcCdzIGVuZCB2YWx1ZXMgYXMgb3VyIG5ldyBtYXAncyBzdGFydCB2YWx1ZXMuIENvcHkgb3ZlciBhbGwgb3RoZXIgZGF0YS4gKi9cblx0XHRcdFx0XHRcdC8qIE5vdGU6IFJldmVyc2UgY2FuIGJlIGRpcmVjdGx5IGNhbGxlZCB2aWEgdGhlIFwicmV2ZXJzZVwiIHBhcmFtZXRlciwgb3IgaXQgY2FuIGJlIGluZGlyZWN0bHkgdHJpZ2dlcmVkIHZpYSB0aGUgbG9vcCBvcHRpb24uIChMb29wcyBhcmUgY29tcG9zZWQgb2YgbXVsdGlwbGUgcmV2ZXJzZXMuKSAqL1xuXHRcdFx0XHRcdFx0LyogTm90ZTogUmV2ZXJzZSBjYWxscyBkbyBub3QgbmVlZCB0byBiZSBjb25zZWN1dGl2ZWx5IGNoYWluZWQgb250byBhIGN1cnJlbnRseS1hbmltYXRpbmcgZWxlbWVudCBpbiBvcmRlciB0byBvcGVyYXRlIG9uIGNhY2hlZCB2YWx1ZXM7XG5cdFx0XHRcdFx0XHQgdGhlcmUgaXMgbm8gaGFybSB0byByZXZlcnNlIGJlaW5nIGNhbGxlZCBvbiBhIHBvdGVudGlhbGx5IHN0YWxlIGRhdGEgY2FjaGUgc2luY2UgcmV2ZXJzZSdzIGJlaGF2aW9yIGlzIHNpbXBseSBkZWZpbmVkXG5cdFx0XHRcdFx0XHQgYXMgcmV2ZXJ0aW5nIHRvIHRoZSBlbGVtZW50J3MgdmFsdWVzIGFzIHRoZXkgd2VyZSBwcmlvciB0byB0aGUgcHJldmlvdXMgKlZlbG9jaXR5KiBjYWxsLiAqL1xuXHRcdFx0XHRcdH0gZWxzZSBpZiAoYWN0aW9uID09PSBcInJldmVyc2VcIikge1xuXHRcdFx0XHRcdFx0ZGF0YSA9IERhdGEoZWxlbWVudCk7XG5cblx0XHRcdFx0XHRcdC8qIEFib3J0IGlmIHRoZXJlIGlzIG5vIHByaW9yIGFuaW1hdGlvbiBkYXRhIHRvIHJldmVyc2UgdG8uICovXG5cdFx0XHRcdFx0XHRpZiAoIWRhdGEpIHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAoIWRhdGEudHdlZW5zQ29udGFpbmVyKSB7XG5cdFx0XHRcdFx0XHRcdC8qIERlcXVldWUgdGhlIGVsZW1lbnQgc28gdGhhdCB0aGlzIHF1ZXVlIGVudHJ5IHJlbGVhc2VzIGl0c2VsZiBpbW1lZGlhdGVseSwgYWxsb3dpbmcgc3Vic2VxdWVudCBxdWV1ZSBlbnRyaWVzIHRvIHJ1bi4gKi9cblx0XHRcdFx0XHRcdFx0JC5kZXF1ZXVlKGVsZW1lbnQsIG9wdHMucXVldWUpO1xuXG5cdFx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdC8qKioqKioqKioqKioqKioqKioqKipcblx0XHRcdFx0XHRcdFx0IE9wdGlvbnMgUGFyc2luZ1xuXHRcdFx0XHRcdFx0XHQgKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0XHRcdFx0XHRcdC8qIElmIHRoZSBlbGVtZW50IHdhcyBoaWRkZW4gdmlhIHRoZSBkaXNwbGF5IG9wdGlvbiBpbiB0aGUgcHJldmlvdXMgY2FsbCxcblx0XHRcdFx0XHRcdFx0IHJldmVydCBkaXNwbGF5IHRvIFwiYXV0b1wiIHByaW9yIHRvIHJldmVyc2FsIHNvIHRoYXQgdGhlIGVsZW1lbnQgaXMgdmlzaWJsZSBhZ2Fpbi4gKi9cblx0XHRcdFx0XHRcdFx0aWYgKGRhdGEub3B0cy5kaXNwbGF5ID09PSBcIm5vbmVcIikge1xuXHRcdFx0XHRcdFx0XHRcdGRhdGEub3B0cy5kaXNwbGF5ID0gXCJhdXRvXCI7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRpZiAoZGF0YS5vcHRzLnZpc2liaWxpdHkgPT09IFwiaGlkZGVuXCIpIHtcblx0XHRcdFx0XHRcdFx0XHRkYXRhLm9wdHMudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0LyogSWYgdGhlIGxvb3Agb3B0aW9uIHdhcyBzZXQgaW4gdGhlIHByZXZpb3VzIGNhbGwsIGRpc2FibGUgaXQgc28gdGhhdCBcInJldmVyc2VcIiBjYWxscyBhcmVuJ3QgcmVjdXJzaXZlbHkgZ2VuZXJhdGVkLlxuXHRcdFx0XHRcdFx0XHQgRnVydGhlciwgcmVtb3ZlIHRoZSBwcmV2aW91cyBjYWxsJ3MgY2FsbGJhY2sgb3B0aW9uczsgdHlwaWNhbGx5LCB1c2VycyBkbyBub3Qgd2FudCB0aGVzZSB0byBiZSByZWZpcmVkLiAqL1xuXHRcdFx0XHRcdFx0XHRkYXRhLm9wdHMubG9vcCA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRkYXRhLm9wdHMuYmVnaW4gPSBudWxsO1xuXHRcdFx0XHRcdFx0XHRkYXRhLm9wdHMuY29tcGxldGUgPSBudWxsO1xuXG5cdFx0XHRcdFx0XHRcdC8qIFNpbmNlIHdlJ3JlIGV4dGVuZGluZyBhbiBvcHRzIG9iamVjdCB0aGF0IGhhcyBhbHJlYWR5IGJlZW4gZXh0ZW5kZWQgd2l0aCB0aGUgZGVmYXVsdHMgb3B0aW9ucyBvYmplY3QsXG5cdFx0XHRcdFx0XHRcdCB3ZSByZW1vdmUgbm9uLWV4cGxpY2l0bHktZGVmaW5lZCBwcm9wZXJ0aWVzIHRoYXQgYXJlIGF1dG8tYXNzaWduZWQgdmFsdWVzLiAqL1xuXHRcdFx0XHRcdFx0XHRpZiAoIW9wdGlvbnMuZWFzaW5nKSB7XG5cdFx0XHRcdFx0XHRcdFx0ZGVsZXRlIG9wdHMuZWFzaW5nO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0aWYgKCFvcHRpb25zLmR1cmF0aW9uKSB7XG5cdFx0XHRcdFx0XHRcdFx0ZGVsZXRlIG9wdHMuZHVyYXRpb247XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHQvKiBUaGUgb3B0cyBvYmplY3QgdXNlZCBmb3IgcmV2ZXJzYWwgaXMgYW4gZXh0ZW5zaW9uIG9mIHRoZSBvcHRpb25zIG9iamVjdCBvcHRpb25hbGx5IHBhc3NlZCBpbnRvIHRoaXNcblx0XHRcdFx0XHRcdFx0IHJldmVyc2UgY2FsbCBwbHVzIHRoZSBvcHRpb25zIHVzZWQgaW4gdGhlIHByZXZpb3VzIFZlbG9jaXR5IGNhbGwuICovXG5cdFx0XHRcdFx0XHRcdG9wdHMgPSAkLmV4dGVuZCh7fSwgZGF0YS5vcHRzLCBvcHRzKTtcblxuXHRcdFx0XHRcdFx0XHQvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0XHRcdFx0XHQgVHdlZW5zIENvbnRhaW5lciBSZWNvbnN0cnVjdGlvblxuXHRcdFx0XHRcdFx0XHQgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0XHRcdFx0XHQvKiBDcmVhdGUgYSBkZWVweSBjb3B5IChpbmRpY2F0ZWQgdmlhIHRoZSB0cnVlIGZsYWcpIG9mIHRoZSBwcmV2aW91cyBjYWxsJ3MgdHdlZW5zQ29udGFpbmVyLiAqL1xuXHRcdFx0XHRcdFx0XHRsYXN0VHdlZW5zQ29udGFpbmVyID0gJC5leHRlbmQodHJ1ZSwge30sIGRhdGEgPyBkYXRhLnR3ZWVuc0NvbnRhaW5lciA6IG51bGwpO1xuXG5cdFx0XHRcdFx0XHRcdC8qIE1hbmlwdWxhdGUgdGhlIHByZXZpb3VzIHR3ZWVuc0NvbnRhaW5lciBieSByZXBsYWNpbmcgaXRzIGVuZCB2YWx1ZXMgYW5kIGN1cnJlbnRWYWx1ZXMgd2l0aCBpdHMgc3RhcnQgdmFsdWVzLiAqL1xuXHRcdFx0XHRcdFx0XHRmb3IgKHZhciBsYXN0VHdlZW4gaW4gbGFzdFR3ZWVuc0NvbnRhaW5lcikge1xuXHRcdFx0XHRcdFx0XHRcdC8qIEluIGFkZGl0aW9uIHRvIHR3ZWVuIGRhdGEsIHR3ZWVuc0NvbnRhaW5lcnMgY29udGFpbiBhbiBlbGVtZW50IHByb3BlcnR5IHRoYXQgd2UgaWdub3JlIGhlcmUuICovXG5cdFx0XHRcdFx0XHRcdFx0aWYgKGxhc3RUd2VlbnNDb250YWluZXIuaGFzT3duUHJvcGVydHkobGFzdFR3ZWVuKSAmJiBsYXN0VHdlZW4gIT09IFwiZWxlbWVudFwiKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHR2YXIgbGFzdFN0YXJ0VmFsdWUgPSBsYXN0VHdlZW5zQ29udGFpbmVyW2xhc3RUd2Vlbl0uc3RhcnRWYWx1ZTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0bGFzdFR3ZWVuc0NvbnRhaW5lcltsYXN0VHdlZW5dLnN0YXJ0VmFsdWUgPSBsYXN0VHdlZW5zQ29udGFpbmVyW2xhc3RUd2Vlbl0uY3VycmVudFZhbHVlID0gbGFzdFR3ZWVuc0NvbnRhaW5lcltsYXN0VHdlZW5dLmVuZFZhbHVlO1xuXHRcdFx0XHRcdFx0XHRcdFx0bGFzdFR3ZWVuc0NvbnRhaW5lcltsYXN0VHdlZW5dLmVuZFZhbHVlID0gbGFzdFN0YXJ0VmFsdWU7XG5cblx0XHRcdFx0XHRcdFx0XHRcdC8qIEVhc2luZyBpcyB0aGUgb25seSBvcHRpb24gdGhhdCBlbWJlZHMgaW50byB0aGUgaW5kaXZpZHVhbCB0d2VlbiBkYXRhIChzaW5jZSBpdCBjYW4gYmUgZGVmaW5lZCBvbiBhIHBlci1wcm9wZXJ0eSBiYXNpcykuXG5cdFx0XHRcdFx0XHRcdFx0XHQgQWNjb3JkaW5nbHksIGV2ZXJ5IHByb3BlcnR5J3MgZWFzaW5nIHZhbHVlIG11c3QgYmUgdXBkYXRlZCB3aGVuIGFuIG9wdGlvbnMgb2JqZWN0IGlzIHBhc3NlZCBpbiB3aXRoIGEgcmV2ZXJzZSBjYWxsLlxuXHRcdFx0XHRcdFx0XHRcdFx0IFRoZSBzaWRlIGVmZmVjdCBvZiB0aGlzIGV4dGVuc2liaWxpdHkgaXMgdGhhdCBhbGwgcGVyLXByb3BlcnR5IGVhc2luZyB2YWx1ZXMgYXJlIGZvcmNlZnVsbHkgcmVzZXQgdG8gdGhlIG5ldyB2YWx1ZS4gKi9cblx0XHRcdFx0XHRcdFx0XHRcdGlmICghVHlwZS5pc0VtcHR5T2JqZWN0KG9wdGlvbnMpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxhc3RUd2VlbnNDb250YWluZXJbbGFzdFR3ZWVuXS5lYXNpbmcgPSBvcHRzLmVhc2luZztcblx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKFZlbG9jaXR5LmRlYnVnKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwicmV2ZXJzZSB0d2VlbnNDb250YWluZXIgKFwiICsgbGFzdFR3ZWVuICsgXCIpOiBcIiArIEpTT04uc3RyaW5naWZ5KGxhc3RUd2VlbnNDb250YWluZXJbbGFzdFR3ZWVuXSksIGVsZW1lbnQpO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdHR3ZWVuc0NvbnRhaW5lciA9IGxhc3RUd2VlbnNDb250YWluZXI7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0XHRcdFx0IFR3ZWVuIERhdGEgQ29uc3RydWN0aW9uIChmb3IgU3RhcnQpXG5cdFx0XHRcdFx0XHQgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdFx0XHR9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJzdGFydFwiKSB7XG5cblx0XHRcdFx0XHRcdC8qKioqKioqKioqKioqKioqKioqKioqKioqXG5cdFx0XHRcdFx0XHQgVmFsdWUgVHJhbnNmZXJyaW5nXG5cdFx0XHRcdFx0XHQgKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0XHRcdFx0LyogSWYgdGhpcyBxdWV1ZSBlbnRyeSBmb2xsb3dzIGEgcHJldmlvdXMgVmVsb2NpdHktaW5pdGlhdGVkIHF1ZXVlIGVudHJ5ICphbmQqIGlmIHRoaXMgZW50cnkgd2FzIGNyZWF0ZWRcblx0XHRcdFx0XHRcdCB3aGlsZSB0aGUgZWxlbWVudCB3YXMgaW4gdGhlIHByb2Nlc3Mgb2YgYmVpbmcgYW5pbWF0ZWQgYnkgVmVsb2NpdHksIHRoZW4gdGhpcyBjdXJyZW50IGNhbGwgaXMgc2FmZSB0byB1c2Vcblx0XHRcdFx0XHRcdCB0aGUgZW5kIHZhbHVlcyBmcm9tIHRoZSBwcmlvciBjYWxsIGFzIGl0cyBzdGFydCB2YWx1ZXMuIFZlbG9jaXR5IGF0dGVtcHRzIHRvIHBlcmZvcm0gdGhpcyB2YWx1ZSB0cmFuc2ZlclxuXHRcdFx0XHRcdFx0IHByb2Nlc3Mgd2hlbmV2ZXIgcG9zc2libGUgaW4gb3JkZXIgdG8gYXZvaWQgcmVxdWVyeWluZyB0aGUgRE9NLiAqL1xuXHRcdFx0XHRcdFx0LyogSWYgdmFsdWVzIGFyZW4ndCB0cmFuc2ZlcnJlZCBmcm9tIGEgcHJpb3IgY2FsbCBhbmQgc3RhcnQgdmFsdWVzIHdlcmUgbm90IGZvcmNlZmVkIGJ5IHRoZSB1c2VyIChtb3JlIG9uIHRoaXMgYmVsb3cpLFxuXHRcdFx0XHRcdFx0IHRoZW4gdGhlIERPTSBpcyBxdWVyaWVkIGZvciB0aGUgZWxlbWVudCdzIGN1cnJlbnQgdmFsdWVzIGFzIGEgbGFzdCByZXNvcnQuICovXG5cdFx0XHRcdFx0XHQvKiBOb3RlOiBDb252ZXJzZWx5LCBhbmltYXRpb24gcmV2ZXJzYWwgKGFuZCBsb29waW5nKSAqYWx3YXlzKiBwZXJmb3JtIGludGVyLWNhbGwgdmFsdWUgdHJhbnNmZXJzOyB0aGV5IG5ldmVyIHJlcXVlcnkgdGhlIERPTS4gKi9cblxuXHRcdFx0XHRcdFx0ZGF0YSA9IERhdGEoZWxlbWVudCk7XG5cblx0XHRcdFx0XHRcdC8qIFRoZSBwZXItZWxlbWVudCBpc0FuaW1hdGluZyBmbGFnIGlzIHVzZWQgdG8gaW5kaWNhdGUgd2hldGhlciBpdCdzIHNhZmUgKGkuZS4gdGhlIGRhdGEgaXNuJ3Qgc3RhbGUpXG5cdFx0XHRcdFx0XHQgdG8gdHJhbnNmZXIgb3ZlciBlbmQgdmFsdWVzIHRvIHVzZSBhcyBzdGFydCB2YWx1ZXMuIElmIGl0J3Mgc2V0IHRvIHRydWUgYW5kIHRoZXJlIGlzIGEgcHJldmlvdXNcblx0XHRcdFx0XHRcdCBWZWxvY2l0eSBjYWxsIHRvIHB1bGwgdmFsdWVzIGZyb20sIGRvIHNvLiAqL1xuXHRcdFx0XHRcdFx0aWYgKGRhdGEgJiYgZGF0YS50d2VlbnNDb250YWluZXIgJiYgZGF0YS5pc0FuaW1hdGluZyA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRcdFx0XHRsYXN0VHdlZW5zQ29udGFpbmVyID0gZGF0YS50d2VlbnNDb250YWluZXI7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8qKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0XHRcdFx0XHRcdCBUd2VlbiBEYXRhIENhbGN1bGF0aW9uXG5cdFx0XHRcdFx0XHQgKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0XHRcdFx0XHQvKiBUaGlzIGZ1bmN0aW9uIHBhcnNlcyBwcm9wZXJ0eSBkYXRhIGFuZCBkZWZhdWx0cyBlbmRWYWx1ZSwgZWFzaW5nLCBhbmQgc3RhcnRWYWx1ZSBhcyBhcHByb3ByaWF0ZS4gKi9cblx0XHRcdFx0XHRcdC8qIFByb3BlcnR5IG1hcCB2YWx1ZXMgY2FuIGVpdGhlciB0YWtlIHRoZSBmb3JtIG9mIDEpIGEgc2luZ2xlIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgZW5kIHZhbHVlLFxuXHRcdFx0XHRcdFx0IG9yIDIpIGFuIGFycmF5IGluIHRoZSBmb3JtIG9mIFsgZW5kVmFsdWUsIFssIGVhc2luZ10gWywgc3RhcnRWYWx1ZV0gXS5cblx0XHRcdFx0XHRcdCBUaGUgb3B0aW9uYWwgdGhpcmQgcGFyYW1ldGVyIGlzIGEgZm9yY2VmZWQgc3RhcnRWYWx1ZSB0byBiZSB1c2VkIGluc3RlYWQgb2YgcXVlcnlpbmcgdGhlIERPTSBmb3Jcblx0XHRcdFx0XHRcdCB0aGUgZWxlbWVudCdzIGN1cnJlbnQgdmFsdWUuIFJlYWQgVmVsb2NpdHkncyBkb2NtZW50YXRpb24gdG8gbGVhcm4gbW9yZSBhYm91dCBmb3JjZWZlZWRpbmc6IFZlbG9jaXR5SlMub3JnLyNmb3JjZWZlZWRpbmcgKi9cblx0XHRcdFx0XHRcdHZhciBwYXJzZVByb3BlcnR5VmFsdWUgPSBmdW5jdGlvbih2YWx1ZURhdGEsIHNraXBSZXNvbHZpbmdFYXNpbmcpIHtcblx0XHRcdFx0XHRcdFx0dmFyIGVuZFZhbHVlLCBlYXNpbmcsIHN0YXJ0VmFsdWU7XG5cblx0XHRcdFx0XHRcdFx0LyogSGFuZGxlIHRoZSBhcnJheSBmb3JtYXQsIHdoaWNoIGNhbiBiZSBzdHJ1Y3R1cmVkIGFzIG9uZSBvZiB0aHJlZSBwb3RlbnRpYWwgb3ZlcmxvYWRzOlxuXHRcdFx0XHRcdFx0XHQgQSkgWyBlbmRWYWx1ZSwgZWFzaW5nLCBzdGFydFZhbHVlIF0sIEIpIFsgZW5kVmFsdWUsIGVhc2luZyBdLCBvciBDKSBbIGVuZFZhbHVlLCBzdGFydFZhbHVlIF0gKi9cblx0XHRcdFx0XHRcdFx0aWYgKFR5cGUuaXNBcnJheSh2YWx1ZURhdGEpKSB7XG5cdFx0XHRcdFx0XHRcdFx0LyogZW5kVmFsdWUgaXMgYWx3YXlzIHRoZSBmaXJzdCBpdGVtIGluIHRoZSBhcnJheS4gRG9uJ3QgYm90aGVyIHZhbGlkYXRpbmcgZW5kVmFsdWUncyB2YWx1ZSBub3dcblx0XHRcdFx0XHRcdFx0XHQgc2luY2UgdGhlIGVuc3VpbmcgcHJvcGVydHkgY3ljbGluZyBsb2dpYyBkb2VzIHRoYXQuICovXG5cdFx0XHRcdFx0XHRcdFx0ZW5kVmFsdWUgPSB2YWx1ZURhdGFbMF07XG5cblx0XHRcdFx0XHRcdFx0XHQvKiBUd28taXRlbSBhcnJheSBmb3JtYXQ6IElmIHRoZSBzZWNvbmQgaXRlbSBpcyBhIG51bWJlciwgZnVuY3Rpb24sIG9yIGhleCBzdHJpbmcsIHRyZWF0IGl0IGFzIGFcblx0XHRcdFx0XHRcdFx0XHQgc3RhcnQgdmFsdWUgc2luY2UgZWFzaW5ncyBjYW4gb25seSBiZSBub24taGV4IHN0cmluZ3Mgb3IgYXJyYXlzLiAqL1xuXHRcdFx0XHRcdFx0XHRcdGlmICgoIVR5cGUuaXNBcnJheSh2YWx1ZURhdGFbMV0pICYmIC9eW1xcZC1dLy50ZXN0KHZhbHVlRGF0YVsxXSkpIHx8IFR5cGUuaXNGdW5jdGlvbih2YWx1ZURhdGFbMV0pIHx8IENTUy5SZWdFeC5pc0hleC50ZXN0KHZhbHVlRGF0YVsxXSkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHN0YXJ0VmFsdWUgPSB2YWx1ZURhdGFbMV07XG5cdFx0XHRcdFx0XHRcdFx0XHQvKiBUd28gb3IgdGhyZWUtaXRlbSBhcnJheTogSWYgdGhlIHNlY29uZCBpdGVtIGlzIGEgbm9uLWhleCBzdHJpbmcgb3IgYW4gYXJyYXksIHRyZWF0IGl0IGFzIGFuIGVhc2luZy4gKi9cblx0XHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKChUeXBlLmlzU3RyaW5nKHZhbHVlRGF0YVsxXSkgJiYgIUNTUy5SZWdFeC5pc0hleC50ZXN0KHZhbHVlRGF0YVsxXSkpIHx8IFR5cGUuaXNBcnJheSh2YWx1ZURhdGFbMV0pKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRlYXNpbmcgPSBza2lwUmVzb2x2aW5nRWFzaW5nID8gdmFsdWVEYXRhWzFdIDogZ2V0RWFzaW5nKHZhbHVlRGF0YVsxXSwgb3B0cy5kdXJhdGlvbik7XG5cblx0XHRcdFx0XHRcdFx0XHRcdC8qIERvbid0IGJvdGhlciB2YWxpZGF0aW5nIHN0YXJ0VmFsdWUncyB2YWx1ZSBub3cgc2luY2UgdGhlIGVuc3VpbmcgcHJvcGVydHkgY3ljbGluZyBsb2dpYyBpbmhlcmVudGx5IGRvZXMgdGhhdC4gKi9cblx0XHRcdFx0XHRcdFx0XHRcdGlmICh2YWx1ZURhdGFbMl0gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRzdGFydFZhbHVlID0gdmFsdWVEYXRhWzJdO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHQvKiBIYW5kbGUgdGhlIHNpbmdsZS12YWx1ZSBmb3JtYXQuICovXG5cdFx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0ZW5kVmFsdWUgPSB2YWx1ZURhdGE7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHQvKiBEZWZhdWx0IHRvIHRoZSBjYWxsJ3MgZWFzaW5nIGlmIGEgcGVyLXByb3BlcnR5IGVhc2luZyB0eXBlIHdhcyBub3QgZGVmaW5lZC4gKi9cblx0XHRcdFx0XHRcdFx0aWYgKCFza2lwUmVzb2x2aW5nRWFzaW5nKSB7XG5cdFx0XHRcdFx0XHRcdFx0ZWFzaW5nID0gZWFzaW5nIHx8IG9wdHMuZWFzaW5nO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0LyogSWYgZnVuY3Rpb25zIHdlcmUgcGFzc2VkIGluIGFzIHZhbHVlcywgcGFzcyB0aGUgZnVuY3Rpb24gdGhlIGN1cnJlbnQgZWxlbWVudCBhcyBpdHMgY29udGV4dCxcblx0XHRcdFx0XHRcdFx0IHBsdXMgdGhlIGVsZW1lbnQncyBpbmRleCBhbmQgdGhlIGVsZW1lbnQgc2V0J3Mgc2l6ZSBhcyBhcmd1bWVudHMuIFRoZW4sIGFzc2lnbiB0aGUgcmV0dXJuZWQgdmFsdWUuICovXG5cdFx0XHRcdFx0XHRcdGlmIChUeXBlLmlzRnVuY3Rpb24oZW5kVmFsdWUpKSB7XG5cdFx0XHRcdFx0XHRcdFx0ZW5kVmFsdWUgPSBlbmRWYWx1ZS5jYWxsKGVsZW1lbnQsIGVsZW1lbnRBcnJheUluZGV4LCBlbGVtZW50c0xlbmd0aCk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRpZiAoVHlwZS5pc0Z1bmN0aW9uKHN0YXJ0VmFsdWUpKSB7XG5cdFx0XHRcdFx0XHRcdFx0c3RhcnRWYWx1ZSA9IHN0YXJ0VmFsdWUuY2FsbChlbGVtZW50LCBlbGVtZW50QXJyYXlJbmRleCwgZWxlbWVudHNMZW5ndGgpO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0LyogQWxsb3cgc3RhcnRWYWx1ZSB0byBiZSBsZWZ0IGFzIHVuZGVmaW5lZCB0byBpbmRpY2F0ZSB0byB0aGUgZW5zdWluZyBjb2RlIHRoYXQgaXRzIHZhbHVlIHdhcyBub3QgZm9yY2VmZWQuICovXG5cdFx0XHRcdFx0XHRcdHJldHVybiBbZW5kVmFsdWUgfHwgMCwgZWFzaW5nLCBzdGFydFZhbHVlXTtcblx0XHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRcdC8qIEN5Y2xlIHRocm91Z2ggZWFjaCBwcm9wZXJ0eSBpbiB0aGUgbWFwLCBsb29raW5nIGZvciBzaG9ydGhhbmQgY29sb3IgcHJvcGVydGllcyAoZS5nLiBcImNvbG9yXCIgYXMgb3Bwb3NlZCB0byBcImNvbG9yUmVkXCIpLiBJbmplY3QgdGhlIGNvcnJlc3BvbmRpbmdcblx0XHRcdFx0XHRcdCBjb2xvclJlZCwgY29sb3JHcmVlbiwgYW5kIGNvbG9yQmx1ZSBSR0IgY29tcG9uZW50IHR3ZWVucyBpbnRvIHRoZSBwcm9wZXJ0aWVzTWFwICh3aGljaCBWZWxvY2l0eSB1bmRlcnN0YW5kcykgYW5kIHJlbW92ZSB0aGUgc2hvcnRoYW5kIHByb3BlcnR5LiAqL1xuXHRcdFx0XHRcdFx0JC5lYWNoKHByb3BlcnRpZXNNYXAsIGZ1bmN0aW9uKHByb3BlcnR5LCB2YWx1ZSkge1xuXHRcdFx0XHRcdFx0XHQvKiBGaW5kIHNob3J0aGFuZCBjb2xvciBwcm9wZXJ0aWVzIHRoYXQgaGF2ZSBiZWVuIHBhc3NlZCBhIGhleCBzdHJpbmcuICovXG5cdFx0XHRcdFx0XHRcdGlmIChSZWdFeHAoXCJeXCIgKyBDU1MuTGlzdHMuY29sb3JzLmpvaW4oXCIkfF5cIikgKyBcIiRcIikudGVzdChDU1MuTmFtZXMuY2FtZWxDYXNlKHByb3BlcnR5KSkpIHtcblx0XHRcdFx0XHRcdFx0XHQvKiBQYXJzZSB0aGUgdmFsdWUgZGF0YSBmb3IgZWFjaCBzaG9ydGhhbmQuICovXG5cdFx0XHRcdFx0XHRcdFx0dmFyIHZhbHVlRGF0YSA9IHBhcnNlUHJvcGVydHlWYWx1ZSh2YWx1ZSwgdHJ1ZSksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGVuZFZhbHVlID0gdmFsdWVEYXRhWzBdLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRlYXNpbmcgPSB2YWx1ZURhdGFbMV0sXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHN0YXJ0VmFsdWUgPSB2YWx1ZURhdGFbMl07XG5cblx0XHRcdFx0XHRcdFx0XHRpZiAoQ1NTLlJlZ0V4LmlzSGV4LnRlc3QoZW5kVmFsdWUpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHQvKiBDb252ZXJ0IHRoZSBoZXggc3RyaW5ncyBpbnRvIHRoZWlyIFJHQiBjb21wb25lbnQgYXJyYXlzLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0dmFyIGNvbG9yQ29tcG9uZW50cyA9IFtcIlJlZFwiLCBcIkdyZWVuXCIsIFwiQmx1ZVwiXSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRlbmRWYWx1ZVJHQiA9IENTUy5WYWx1ZXMuaGV4VG9SZ2IoZW5kVmFsdWUpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHN0YXJ0VmFsdWVSR0IgPSBzdGFydFZhbHVlID8gQ1NTLlZhbHVlcy5oZXhUb1JnYihzdGFydFZhbHVlKSA6IHVuZGVmaW5lZDtcblxuXHRcdFx0XHRcdFx0XHRcdFx0LyogSW5qZWN0IHRoZSBSR0IgY29tcG9uZW50IHR3ZWVucyBpbnRvIHByb3BlcnRpZXNNYXAuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNvbG9yQ29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR2YXIgZGF0YUFycmF5ID0gW2VuZFZhbHVlUkdCW2ldXTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoZWFzaW5nKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGF0YUFycmF5LnB1c2goZWFzaW5nKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChzdGFydFZhbHVlUkdCICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkYXRhQXJyYXkucHVzaChzdGFydFZhbHVlUkdCW2ldKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHByb3BlcnRpZXNNYXBbQ1NTLk5hbWVzLmNhbWVsQ2FzZShwcm9wZXJ0eSkgKyBjb2xvckNvbXBvbmVudHNbaV1dID0gZGF0YUFycmF5O1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHQvKiBSZW1vdmUgdGhlIGludGVybWVkaWFyeSBzaG9ydGhhbmQgcHJvcGVydHkgZW50cnkgbm93IHRoYXQgd2UndmUgcHJvY2Vzc2VkIGl0LiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0ZGVsZXRlIHByb3BlcnRpZXNNYXBbcHJvcGVydHldO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdC8qIENyZWF0ZSBhIHR3ZWVuIG91dCBvZiBlYWNoIHByb3BlcnR5LCBhbmQgYXBwZW5kIGl0cyBhc3NvY2lhdGVkIGRhdGEgdG8gdHdlZW5zQ29udGFpbmVyLiAqL1xuXHRcdFx0XHRcdFx0Zm9yICh2YXIgcHJvcGVydHkgaW4gcHJvcGVydGllc01hcCkge1xuXG5cdFx0XHRcdFx0XHRcdGlmICghcHJvcGVydGllc01hcC5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSkpIHtcblx0XHRcdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHQvKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0XHRcdFx0XHRcdFx0IFN0YXJ0IFZhbHVlIFNvdXJjaW5nXG5cdFx0XHRcdFx0XHRcdCAqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0XHRcdFx0XHQvKiBQYXJzZSBvdXQgZW5kVmFsdWUsIGVhc2luZywgYW5kIHN0YXJ0VmFsdWUgZnJvbSB0aGUgcHJvcGVydHkncyBkYXRhLiAqL1xuXHRcdFx0XHRcdFx0XHR2YXIgdmFsdWVEYXRhID0gcGFyc2VQcm9wZXJ0eVZhbHVlKHByb3BlcnRpZXNNYXBbcHJvcGVydHldKSxcblx0XHRcdFx0XHRcdFx0XHRcdGVuZFZhbHVlID0gdmFsdWVEYXRhWzBdLFxuXHRcdFx0XHRcdFx0XHRcdFx0ZWFzaW5nID0gdmFsdWVEYXRhWzFdLFxuXHRcdFx0XHRcdFx0XHRcdFx0c3RhcnRWYWx1ZSA9IHZhbHVlRGF0YVsyXTtcblxuXHRcdFx0XHRcdFx0XHQvKiBOb3cgdGhhdCB0aGUgb3JpZ2luYWwgcHJvcGVydHkgbmFtZSdzIGZvcm1hdCBoYXMgYmVlbiB1c2VkIGZvciB0aGUgcGFyc2VQcm9wZXJ0eVZhbHVlKCkgbG9va3VwIGFib3ZlLFxuXHRcdFx0XHRcdFx0XHQgd2UgZm9yY2UgdGhlIHByb3BlcnR5IHRvIGl0cyBjYW1lbENhc2Ugc3R5bGluZyB0byBub3JtYWxpemUgaXQgZm9yIG1hbmlwdWxhdGlvbi4gKi9cblx0XHRcdFx0XHRcdFx0cHJvcGVydHkgPSBDU1MuTmFtZXMuY2FtZWxDYXNlKHByb3BlcnR5KTtcblxuXHRcdFx0XHRcdFx0XHQvKiBJbiBjYXNlIHRoaXMgcHJvcGVydHkgaXMgYSBob29rLCB0aGVyZSBhcmUgY2lyY3Vtc3RhbmNlcyB3aGVyZSB3ZSB3aWxsIGludGVuZCB0byB3b3JrIG9uIHRoZSBob29rJ3Mgcm9vdCBwcm9wZXJ0eSBhbmQgbm90IHRoZSBob29rZWQgc3VicHJvcGVydHkuICovXG5cdFx0XHRcdFx0XHRcdHZhciByb290UHJvcGVydHkgPSBDU1MuSG9va3MuZ2V0Um9vdChwcm9wZXJ0eSksXG5cdFx0XHRcdFx0XHRcdFx0XHRyb290UHJvcGVydHlWYWx1ZSA9IGZhbHNlO1xuXG5cdFx0XHRcdFx0XHRcdC8qIE90aGVyIHRoYW4gZm9yIHRoZSBkdW1teSB0d2VlbiBwcm9wZXJ0eSwgcHJvcGVydGllcyB0aGF0IGFyZSBub3Qgc3VwcG9ydGVkIGJ5IHRoZSBicm93c2VyIChhbmQgZG8gbm90IGhhdmUgYW4gYXNzb2NpYXRlZCBub3JtYWxpemF0aW9uKSB3aWxsXG5cdFx0XHRcdFx0XHRcdCBpbmhlcmVudGx5IHByb2R1Y2Ugbm8gc3R5bGUgY2hhbmdlcyB3aGVuIHNldCwgc28gdGhleSBhcmUgc2tpcHBlZCBpbiBvcmRlciB0byBkZWNyZWFzZSBhbmltYXRpb24gdGljayBvdmVyaGVhZC5cblx0XHRcdFx0XHRcdFx0IFByb3BlcnR5IHN1cHBvcnQgaXMgZGV0ZXJtaW5lZCB2aWEgcHJlZml4Q2hlY2soKSwgd2hpY2ggcmV0dXJucyBhIGZhbHNlIGZsYWcgd2hlbiBubyBzdXBwb3J0ZWQgaXMgZGV0ZWN0ZWQuICovXG5cdFx0XHRcdFx0XHRcdC8qIE5vdGU6IFNpbmNlIFNWRyBlbGVtZW50cyBoYXZlIHNvbWUgb2YgdGhlaXIgcHJvcGVydGllcyBkaXJlY3RseSBhcHBsaWVkIGFzIEhUTUwgYXR0cmlidXRlcyxcblx0XHRcdFx0XHRcdFx0IHRoZXJlIGlzIG5vIHdheSB0byBjaGVjayBmb3IgdGhlaXIgZXhwbGljaXQgYnJvd3NlciBzdXBwb3J0LCBhbmQgc28gd2Ugc2tpcCBza2lwIHRoaXMgY2hlY2sgZm9yIHRoZW0uICovXG5cdFx0XHRcdFx0XHRcdGlmICgoIWRhdGEgfHwgIWRhdGEuaXNTVkcpICYmIHJvb3RQcm9wZXJ0eSAhPT0gXCJ0d2VlblwiICYmIENTUy5OYW1lcy5wcmVmaXhDaGVjayhyb290UHJvcGVydHkpWzFdID09PSBmYWxzZSAmJiBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtyb290UHJvcGVydHldID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdFx0XHRpZiAoVmVsb2NpdHkuZGVidWcpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiU2tpcHBpbmcgW1wiICsgcm9vdFByb3BlcnR5ICsgXCJdIGR1ZSB0byBhIGxhY2sgb2YgYnJvd3NlciBzdXBwb3J0LlwiKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHQvKiBJZiB0aGUgZGlzcGxheSBvcHRpb24gaXMgYmVpbmcgc2V0IHRvIGEgbm9uLVwibm9uZVwiIChlLmcuIFwiYmxvY2tcIikgYW5kIG9wYWNpdHkgKGZpbHRlciBvbiBJRTw9OCkgaXMgYmVpbmdcblx0XHRcdFx0XHRcdFx0IGFuaW1hdGVkIHRvIGFuIGVuZFZhbHVlIG9mIG5vbi16ZXJvLCB0aGUgdXNlcidzIGludGVudGlvbiBpcyB0byBmYWRlIGluIGZyb20gaW52aXNpYmxlLCB0aHVzIHdlIGZvcmNlZmVlZCBvcGFjaXR5XG5cdFx0XHRcdFx0XHRcdCBhIHN0YXJ0VmFsdWUgb2YgMCBpZiBpdHMgc3RhcnRWYWx1ZSBoYXNuJ3QgYWxyZWFkeSBiZWVuIHNvdXJjZWQgYnkgdmFsdWUgdHJhbnNmZXJyaW5nIG9yIHByaW9yIGZvcmNlZmVlZGluZy4gKi9cblx0XHRcdFx0XHRcdFx0aWYgKCgob3B0cy5kaXNwbGF5ICE9PSB1bmRlZmluZWQgJiYgb3B0cy5kaXNwbGF5ICE9PSBudWxsICYmIG9wdHMuZGlzcGxheSAhPT0gXCJub25lXCIpIHx8IChvcHRzLnZpc2liaWxpdHkgIT09IHVuZGVmaW5lZCAmJiBvcHRzLnZpc2liaWxpdHkgIT09IFwiaGlkZGVuXCIpKSAmJiAvb3BhY2l0eXxmaWx0ZXIvLnRlc3QocHJvcGVydHkpICYmICFzdGFydFZhbHVlICYmIGVuZFZhbHVlICE9PSAwKSB7XG5cdFx0XHRcdFx0XHRcdFx0c3RhcnRWYWx1ZSA9IDA7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHQvKiBJZiB2YWx1ZXMgaGF2ZSBiZWVuIHRyYW5zZmVycmVkIGZyb20gdGhlIHByZXZpb3VzIFZlbG9jaXR5IGNhbGwsIGV4dHJhY3QgdGhlIGVuZFZhbHVlIGFuZCByb290UHJvcGVydHlWYWx1ZVxuXHRcdFx0XHRcdFx0XHQgZm9yIGFsbCBvZiB0aGUgY3VycmVudCBjYWxsJ3MgcHJvcGVydGllcyB0aGF0IHdlcmUgKmFsc28qIGFuaW1hdGVkIGluIHRoZSBwcmV2aW91cyBjYWxsLiAqL1xuXHRcdFx0XHRcdFx0XHQvKiBOb3RlOiBWYWx1ZSB0cmFuc2ZlcnJpbmcgY2FuIG9wdGlvbmFsbHkgYmUgZGlzYWJsZWQgYnkgdGhlIHVzZXIgdmlhIHRoZSBfY2FjaGVWYWx1ZXMgb3B0aW9uLiAqL1xuXHRcdFx0XHRcdFx0XHRpZiAob3B0cy5fY2FjaGVWYWx1ZXMgJiYgbGFzdFR3ZWVuc0NvbnRhaW5lciAmJiBsYXN0VHdlZW5zQ29udGFpbmVyW3Byb3BlcnR5XSkge1xuXHRcdFx0XHRcdFx0XHRcdGlmIChzdGFydFZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHN0YXJ0VmFsdWUgPSBsYXN0VHdlZW5zQ29udGFpbmVyW3Byb3BlcnR5XS5lbmRWYWx1ZSArIGxhc3RUd2VlbnNDb250YWluZXJbcHJvcGVydHldLnVuaXRUeXBlO1xuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdC8qIFRoZSBwcmV2aW91cyBjYWxsJ3Mgcm9vdFByb3BlcnR5VmFsdWUgaXMgZXh0cmFjdGVkIGZyb20gdGhlIGVsZW1lbnQncyBkYXRhIGNhY2hlIHNpbmNlIHRoYXQncyB0aGVcblx0XHRcdFx0XHRcdFx0XHQgaW5zdGFuY2Ugb2Ygcm9vdFByb3BlcnR5VmFsdWUgdGhhdCBnZXRzIGZyZXNobHkgdXBkYXRlZCBieSB0aGUgdHdlZW5pbmcgcHJvY2Vzcywgd2hlcmVhcyB0aGUgcm9vdFByb3BlcnR5VmFsdWVcblx0XHRcdFx0XHRcdFx0XHQgYXR0YWNoZWQgdG8gdGhlIGluY29taW5nIGxhc3RUd2VlbnNDb250YWluZXIgaXMgZXF1YWwgdG8gdGhlIHJvb3QgcHJvcGVydHkncyB2YWx1ZSBwcmlvciB0byBhbnkgdHdlZW5pbmcuICovXG5cdFx0XHRcdFx0XHRcdFx0cm9vdFByb3BlcnR5VmFsdWUgPSBkYXRhLnJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGVbcm9vdFByb3BlcnR5XTtcblx0XHRcdFx0XHRcdFx0XHQvKiBJZiB2YWx1ZXMgd2VyZSBub3QgdHJhbnNmZXJyZWQgZnJvbSBhIHByZXZpb3VzIFZlbG9jaXR5IGNhbGwsIHF1ZXJ5IHRoZSBET00gYXMgbmVlZGVkLiAqL1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdC8qIEhhbmRsZSBob29rZWQgcHJvcGVydGllcy4gKi9cblx0XHRcdFx0XHRcdFx0XHRpZiAoQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbcHJvcGVydHldKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoc3RhcnRWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJvb3RQcm9wZXJ0eVZhbHVlID0gQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgcm9vdFByb3BlcnR5KTsgLyogR0VUICovXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8qIE5vdGU6IFRoZSBmb2xsb3dpbmcgZ2V0UHJvcGVydHlWYWx1ZSgpIGNhbGwgZG9lcyBub3QgYWN0dWFsbHkgdHJpZ2dlciBhIERPTSBxdWVyeTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0IGdldFByb3BlcnR5VmFsdWUoKSB3aWxsIGV4dHJhY3QgdGhlIGhvb2sgZnJvbSByb290UHJvcGVydHlWYWx1ZS4gKi9cblx0XHRcdFx0XHRcdFx0XHRcdFx0c3RhcnRWYWx1ZSA9IENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIHByb3BlcnR5LCByb290UHJvcGVydHlWYWx1ZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8qIElmIHN0YXJ0VmFsdWUgaXMgYWxyZWFkeSBkZWZpbmVkIHZpYSBmb3JjZWZlZWRpbmcsIGRvIG5vdCBxdWVyeSB0aGUgRE9NIGZvciB0aGUgcm9vdCBwcm9wZXJ0eSdzIHZhbHVlO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQganVzdCBncmFiIHJvb3RQcm9wZXJ0eSdzIHplcm8tdmFsdWUgdGVtcGxhdGUgZnJvbSBDU1MuSG9va3MuIFRoaXMgb3ZlcndyaXRlcyB0aGUgZWxlbWVudCdzIGFjdHVhbFxuXHRcdFx0XHRcdFx0XHRcdFx0XHQgcm9vdCBwcm9wZXJ0eSB2YWx1ZSAoaWYgb25lIGlzIHNldCksIGJ1dCB0aGlzIGlzIGFjY2VwdGFibGUgc2luY2UgdGhlIHByaW1hcnkgcmVhc29uIHVzZXJzIGZvcmNlZmVlZCBpc1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQgdG8gYXZvaWQgRE9NIHF1ZXJpZXMsIGFuZCB0aHVzIHdlIGxpa2V3aXNlIGF2b2lkIHF1ZXJ5aW5nIHRoZSBET00gZm9yIHRoZSByb290IHByb3BlcnR5J3MgdmFsdWUuICovXG5cdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQvKiBHcmFiIHRoaXMgaG9vaydzIHplcm8tdmFsdWUgdGVtcGxhdGUsIGUuZy4gXCIwcHggMHB4IDBweCBibGFja1wiLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRyb290UHJvcGVydHlWYWx1ZSA9IENTUy5Ib29rcy50ZW1wbGF0ZXNbcm9vdFByb3BlcnR5XVsxXTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdC8qIEhhbmRsZSBub24taG9va2VkIHByb3BlcnRpZXMgdGhhdCBoYXZlbid0IGFscmVhZHkgYmVlbiBkZWZpbmVkIHZpYSBmb3JjZWZlZWRpbmcuICovXG5cdFx0XHRcdFx0XHRcdFx0fSBlbHNlIGlmIChzdGFydFZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRcdFx0XHRcdHN0YXJ0VmFsdWUgPSBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBwcm9wZXJ0eSk7IC8qIEdFVCAqL1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdC8qKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0XHRcdFx0XHQgVmFsdWUgRGF0YSBFeHRyYWN0aW9uXG5cdFx0XHRcdFx0XHRcdCAqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0XHRcdFx0XHR2YXIgc2VwYXJhdGVkVmFsdWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRlbmRWYWx1ZVVuaXRUeXBlLFxuXHRcdFx0XHRcdFx0XHRcdFx0c3RhcnRWYWx1ZVVuaXRUeXBlLFxuXHRcdFx0XHRcdFx0XHRcdFx0b3BlcmF0b3IgPSBmYWxzZTtcblxuXHRcdFx0XHRcdFx0XHQvKiBTZXBhcmF0ZXMgYSBwcm9wZXJ0eSB2YWx1ZSBpbnRvIGl0cyBudW1lcmljIHZhbHVlIGFuZCBpdHMgdW5pdCB0eXBlLiAqL1xuXHRcdFx0XHRcdFx0XHR2YXIgc2VwYXJhdGVWYWx1ZSA9IGZ1bmN0aW9uKHByb3BlcnR5LCB2YWx1ZSkge1xuXHRcdFx0XHRcdFx0XHRcdHZhciB1bml0VHlwZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0bnVtZXJpY1ZhbHVlO1xuXG5cdFx0XHRcdFx0XHRcdFx0bnVtZXJpY1ZhbHVlID0gKHZhbHVlIHx8IFwiMFwiKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHQudG9TdHJpbmcoKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHQudG9Mb3dlckNhc2UoKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHQvKiBNYXRjaCB0aGUgdW5pdCB0eXBlIGF0IHRoZSBlbmQgb2YgdGhlIHZhbHVlLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvWyVBLXpdKyQvLCBmdW5jdGlvbihtYXRjaCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8qIEdyYWIgdGhlIHVuaXQgdHlwZS4gKi9cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR1bml0VHlwZSA9IG1hdGNoO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0LyogU3RyaXAgdGhlIHVuaXQgdHlwZSBvZmYgb2YgdmFsdWUuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIFwiXCI7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRcdFx0LyogSWYgbm8gdW5pdCB0eXBlIHdhcyBzdXBwbGllZCwgYXNzaWduIG9uZSB0aGF0IGlzIGFwcHJvcHJpYXRlIGZvciB0aGlzIHByb3BlcnR5IChlLmcuIFwiZGVnXCIgZm9yIHJvdGF0ZVogb3IgXCJweFwiIGZvciB3aWR0aCkuICovXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCF1bml0VHlwZSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0dW5pdFR5cGUgPSBDU1MuVmFsdWVzLmdldFVuaXRUeXBlKHByb3BlcnR5KTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gW251bWVyaWNWYWx1ZSwgdW5pdFR5cGVdO1xuXHRcdFx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0XHRcdC8qIFNlcGFyYXRlIHN0YXJ0VmFsdWUuICovXG5cdFx0XHRcdFx0XHRcdHNlcGFyYXRlZFZhbHVlID0gc2VwYXJhdGVWYWx1ZShwcm9wZXJ0eSwgc3RhcnRWYWx1ZSk7XG5cdFx0XHRcdFx0XHRcdHN0YXJ0VmFsdWUgPSBzZXBhcmF0ZWRWYWx1ZVswXTtcblx0XHRcdFx0XHRcdFx0c3RhcnRWYWx1ZVVuaXRUeXBlID0gc2VwYXJhdGVkVmFsdWVbMV07XG5cblx0XHRcdFx0XHRcdFx0LyogU2VwYXJhdGUgZW5kVmFsdWUsIGFuZCBleHRyYWN0IGEgdmFsdWUgb3BlcmF0b3IgKGUuZy4gXCIrPVwiLCBcIi09XCIpIGlmIG9uZSBleGlzdHMuICovXG5cdFx0XHRcdFx0XHRcdHNlcGFyYXRlZFZhbHVlID0gc2VwYXJhdGVWYWx1ZShwcm9wZXJ0eSwgZW5kVmFsdWUpO1xuXHRcdFx0XHRcdFx0XHRlbmRWYWx1ZSA9IHNlcGFyYXRlZFZhbHVlWzBdLnJlcGxhY2UoL14oWystXFwvKl0pPS8sIGZ1bmN0aW9uKG1hdGNoLCBzdWJNYXRjaCkge1xuXHRcdFx0XHRcdFx0XHRcdG9wZXJhdG9yID0gc3ViTWF0Y2g7XG5cblx0XHRcdFx0XHRcdFx0XHQvKiBTdHJpcCB0aGUgb3BlcmF0b3Igb2ZmIG9mIHRoZSB2YWx1ZS4gKi9cblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gXCJcIjtcblx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdGVuZFZhbHVlVW5pdFR5cGUgPSBzZXBhcmF0ZWRWYWx1ZVsxXTtcblxuXHRcdFx0XHRcdFx0XHQvKiBQYXJzZSBmbG9hdCB2YWx1ZXMgZnJvbSBlbmRWYWx1ZSBhbmQgc3RhcnRWYWx1ZS4gRGVmYXVsdCB0byAwIGlmIE5hTiBpcyByZXR1cm5lZC4gKi9cblx0XHRcdFx0XHRcdFx0c3RhcnRWYWx1ZSA9IHBhcnNlRmxvYXQoc3RhcnRWYWx1ZSkgfHwgMDtcblx0XHRcdFx0XHRcdFx0ZW5kVmFsdWUgPSBwYXJzZUZsb2F0KGVuZFZhbHVlKSB8fCAwO1xuXG5cdFx0XHRcdFx0XHRcdC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0XHRcdFx0XHRcdFx0IFByb3BlcnR5LVNwZWNpZmljIFZhbHVlIENvbnZlcnNpb25cblx0XHRcdFx0XHRcdFx0ICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0XHRcdFx0XHQvKiBDdXN0b20gc3VwcG9ydCBmb3IgcHJvcGVydGllcyB0aGF0IGRvbid0IGFjdHVhbGx5IGFjY2VwdCB0aGUgJSB1bml0IHR5cGUsIGJ1dCB3aGVyZSBwb2xseWZpbGxpbmcgaXMgdHJpdmlhbCBhbmQgcmVsYXRpdmVseSBmb29scHJvb2YuICovXG5cdFx0XHRcdFx0XHRcdGlmIChlbmRWYWx1ZVVuaXRUeXBlID09PSBcIiVcIikge1xuXHRcdFx0XHRcdFx0XHRcdC8qIEEgJS12YWx1ZSBmb250U2l6ZS9saW5lSGVpZ2h0IGlzIHJlbGF0aXZlIHRvIHRoZSBwYXJlbnQncyBmb250U2l6ZSAoYXMgb3Bwb3NlZCB0byB0aGUgcGFyZW50J3MgZGltZW5zaW9ucyksXG5cdFx0XHRcdFx0XHRcdFx0IHdoaWNoIGlzIGlkZW50aWNhbCB0byB0aGUgZW0gdW5pdCdzIGJlaGF2aW9yLCBzbyB3ZSBwaWdneWJhY2sgb2ZmIG9mIHRoYXQuICovXG5cdFx0XHRcdFx0XHRcdFx0aWYgKC9eKGZvbnRTaXplfGxpbmVIZWlnaHQpJC8udGVzdChwcm9wZXJ0eSkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdC8qIENvbnZlcnQgJSBpbnRvIGFuIGVtIGRlY2ltYWwgdmFsdWUuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRlbmRWYWx1ZSA9IGVuZFZhbHVlIC8gMTAwO1xuXHRcdFx0XHRcdFx0XHRcdFx0ZW5kVmFsdWVVbml0VHlwZSA9IFwiZW1cIjtcblx0XHRcdFx0XHRcdFx0XHRcdC8qIEZvciBzY2FsZVggYW5kIHNjYWxlWSwgY29udmVydCB0aGUgdmFsdWUgaW50byBpdHMgZGVjaW1hbCBmb3JtYXQgYW5kIHN0cmlwIG9mZiB0aGUgdW5pdCB0eXBlLiAqL1xuXHRcdFx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoL15zY2FsZS8udGVzdChwcm9wZXJ0eSkpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGVuZFZhbHVlID0gZW5kVmFsdWUgLyAxMDA7XG5cdFx0XHRcdFx0XHRcdFx0XHRlbmRWYWx1ZVVuaXRUeXBlID0gXCJcIjtcblx0XHRcdFx0XHRcdFx0XHRcdC8qIEZvciBSR0IgY29tcG9uZW50cywgdGFrZSB0aGUgZGVmaW5lZCBwZXJjZW50YWdlIG9mIDI1NSBhbmQgc3RyaXAgb2ZmIHRoZSB1bml0IHR5cGUuICovXG5cdFx0XHRcdFx0XHRcdFx0fSBlbHNlIGlmICgvKFJlZHxHcmVlbnxCbHVlKSQvaS50ZXN0KHByb3BlcnR5KSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0ZW5kVmFsdWUgPSAoZW5kVmFsdWUgLyAxMDApICogMjU1O1xuXHRcdFx0XHRcdFx0XHRcdFx0ZW5kVmFsdWVVbml0VHlwZSA9IFwiXCI7XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0LyoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0XHRcdFx0XHQgVW5pdCBSYXRpbyBDYWxjdWxhdGlvblxuXHRcdFx0XHRcdFx0XHQgKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0XHRcdFx0XHRcdC8qIFdoZW4gcXVlcmllZCwgdGhlIGJyb3dzZXIgcmV0dXJucyAobW9zdCkgQ1NTIHByb3BlcnR5IHZhbHVlcyBpbiBwaXhlbHMuIFRoZXJlZm9yZSwgaWYgYW4gZW5kVmFsdWUgd2l0aCBhIHVuaXQgdHlwZSBvZlxuXHRcdFx0XHRcdFx0XHQgJSwgZW0sIG9yIHJlbSBpcyBhbmltYXRlZCB0b3dhcmQsIHN0YXJ0VmFsdWUgbXVzdCBiZSBjb252ZXJ0ZWQgZnJvbSBwaXhlbHMgaW50byB0aGUgc2FtZSB1bml0IHR5cGUgYXMgZW5kVmFsdWUgaW4gb3JkZXJcblx0XHRcdFx0XHRcdFx0IGZvciB2YWx1ZSBtYW5pcHVsYXRpb24gbG9naWMgKGluY3JlbWVudC9kZWNyZW1lbnQpIHRvIHByb2NlZWQuIEZ1cnRoZXIsIGlmIHRoZSBzdGFydFZhbHVlIHdhcyBmb3JjZWZlZCBvciB0cmFuc2ZlcnJlZFxuXHRcdFx0XHRcdFx0XHQgZnJvbSBhIHByZXZpb3VzIGNhbGwsIHN0YXJ0VmFsdWUgbWF5IGFsc28gbm90IGJlIGluIHBpeGVscy4gVW5pdCBjb252ZXJzaW9uIGxvZ2ljIHRoZXJlZm9yZSBjb25zaXN0cyBvZiB0d28gc3RlcHM6XG5cdFx0XHRcdFx0XHRcdCAxKSBDYWxjdWxhdGluZyB0aGUgcmF0aW8gb2YgJS9lbS9yZW0vdmgvdncgcmVsYXRpdmUgdG8gcGl4ZWxzXG5cdFx0XHRcdFx0XHRcdCAyKSBDb252ZXJ0aW5nIHN0YXJ0VmFsdWUgaW50byB0aGUgc2FtZSB1bml0IG9mIG1lYXN1cmVtZW50IGFzIGVuZFZhbHVlIGJhc2VkIG9uIHRoZXNlIHJhdGlvcy4gKi9cblx0XHRcdFx0XHRcdFx0LyogVW5pdCBjb252ZXJzaW9uIHJhdGlvcyBhcmUgY2FsY3VsYXRlZCBieSBpbnNlcnRpbmcgYSBzaWJsaW5nIG5vZGUgbmV4dCB0byB0aGUgdGFyZ2V0IG5vZGUsIGNvcHlpbmcgb3ZlciBpdHMgcG9zaXRpb24gcHJvcGVydHksXG5cdFx0XHRcdFx0XHRcdCBzZXR0aW5nIHZhbHVlcyB3aXRoIHRoZSB0YXJnZXQgdW5pdCB0eXBlIHRoZW4gY29tcGFyaW5nIHRoZSByZXR1cm5lZCBwaXhlbCB2YWx1ZS4gKi9cblx0XHRcdFx0XHRcdFx0LyogTm90ZTogRXZlbiBpZiBvbmx5IG9uZSBvZiB0aGVzZSB1bml0IHR5cGVzIGlzIGJlaW5nIGFuaW1hdGVkLCBhbGwgdW5pdCByYXRpb3MgYXJlIGNhbGN1bGF0ZWQgYXQgb25jZSBzaW5jZSB0aGUgb3ZlcmhlYWRcblx0XHRcdFx0XHRcdFx0IG9mIGJhdGNoaW5nIHRoZSBTRVRzIGFuZCBHRVRzIHRvZ2V0aGVyIHVwZnJvbnQgb3V0d2VpZ2h0cyB0aGUgcG90ZW50aWFsIG92ZXJoZWFkXG5cdFx0XHRcdFx0XHRcdCBvZiBsYXlvdXQgdGhyYXNoaW5nIGNhdXNlZCBieSByZS1xdWVyeWluZyBmb3IgdW5jYWxjdWxhdGVkIHJhdGlvcyBmb3Igc3Vic2VxdWVudGx5LXByb2Nlc3NlZCBwcm9wZXJ0aWVzLiAqL1xuXHRcdFx0XHRcdFx0XHQvKiBUb2RvOiBTaGlmdCB0aGlzIGxvZ2ljIGludG8gdGhlIGNhbGxzJyBmaXJzdCB0aWNrIGluc3RhbmNlIHNvIHRoYXQgaXQncyBzeW5jZWQgd2l0aCBSQUYuICovXG5cdFx0XHRcdFx0XHRcdHZhciBjYWxjdWxhdGVVbml0UmF0aW9zID0gZnVuY3Rpb24oKSB7XG5cblx0XHRcdFx0XHRcdFx0XHQvKioqKioqKioqKioqKioqKioqKioqKioqXG5cdFx0XHRcdFx0XHRcdFx0IFNhbWUgUmF0aW8gQ2hlY2tzXG5cdFx0XHRcdFx0XHRcdFx0ICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0XHRcdFx0XHRcdC8qIFRoZSBwcm9wZXJ0aWVzIGJlbG93IGFyZSB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIHRoZSBlbGVtZW50IGRpZmZlcnMgc3VmZmljaWVudGx5IGZyb20gdGhpcyBjYWxsJ3Ncblx0XHRcdFx0XHRcdFx0XHQgcHJldmlvdXNseSBpdGVyYXRlZCBlbGVtZW50IHRvIGFsc28gZGlmZmVyIGluIGl0cyB1bml0IGNvbnZlcnNpb24gcmF0aW9zLiBJZiB0aGUgcHJvcGVydGllcyBtYXRjaCB1cCB3aXRoIHRob3NlXG5cdFx0XHRcdFx0XHRcdFx0IG9mIHRoZSBwcmlvciBlbGVtZW50LCB0aGUgcHJpb3IgZWxlbWVudCdzIGNvbnZlcnNpb24gcmF0aW9zIGFyZSB1c2VkLiBMaWtlIG1vc3Qgb3B0aW1pemF0aW9ucyBpbiBWZWxvY2l0eSxcblx0XHRcdFx0XHRcdFx0XHQgdGhpcyBpcyBkb25lIHRvIG1pbmltaXplIERPTSBxdWVyeWluZy4gKi9cblx0XHRcdFx0XHRcdFx0XHR2YXIgc2FtZVJhdGlvSW5kaWNhdG9ycyA9IHtcblx0XHRcdFx0XHRcdFx0XHRcdG15UGFyZW50OiBlbGVtZW50LnBhcmVudE5vZGUgfHwgZG9jdW1lbnQuYm9keSwgLyogR0VUICovXG5cdFx0XHRcdFx0XHRcdFx0XHRwb3NpdGlvbjogQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJwb3NpdGlvblwiKSwgLyogR0VUICovXG5cdFx0XHRcdFx0XHRcdFx0XHRmb250U2l6ZTogQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJmb250U2l6ZVwiKSAvKiBHRVQgKi9cblx0XHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRcdC8qIERldGVybWluZSBpZiB0aGUgc2FtZSAlIHJhdGlvIGNhbiBiZSB1c2VkLiAlIGlzIGJhc2VkIG9uIHRoZSBlbGVtZW50J3MgcG9zaXRpb24gdmFsdWUgYW5kIGl0cyBwYXJlbnQncyB3aWR0aCBhbmQgaGVpZ2h0IGRpbWVuc2lvbnMuICovXG5cdFx0XHRcdFx0XHRcdFx0c2FtZVBlcmNlbnRSYXRpbyA9ICgoc2FtZVJhdGlvSW5kaWNhdG9ycy5wb3NpdGlvbiA9PT0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0UG9zaXRpb24pICYmIChzYW1lUmF0aW9JbmRpY2F0b3JzLm15UGFyZW50ID09PSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQYXJlbnQpKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0LyogRGV0ZXJtaW5lIGlmIHRoZSBzYW1lIGVtIHJhdGlvIGNhbiBiZSB1c2VkLiBlbSBpcyByZWxhdGl2ZSB0byB0aGUgZWxlbWVudCdzIGZvbnRTaXplLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRzYW1lRW1SYXRpbyA9IChzYW1lUmF0aW9JbmRpY2F0b3JzLmZvbnRTaXplID09PSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RGb250U2l6ZSk7XG5cblx0XHRcdFx0XHRcdFx0XHQvKiBTdG9yZSB0aGVzZSByYXRpbyBpbmRpY2F0b3JzIGNhbGwtd2lkZSBmb3IgdGhlIG5leHQgZWxlbWVudCB0byBjb21wYXJlIGFnYWluc3QuICovXG5cdFx0XHRcdFx0XHRcdFx0Y2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0UGFyZW50ID0gc2FtZVJhdGlvSW5kaWNhdG9ycy5teVBhcmVudDtcblx0XHRcdFx0XHRcdFx0XHRjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQb3NpdGlvbiA9IHNhbWVSYXRpb0luZGljYXRvcnMucG9zaXRpb247XG5cdFx0XHRcdFx0XHRcdFx0Y2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0Rm9udFNpemUgPSBzYW1lUmF0aW9JbmRpY2F0b3JzLmZvbnRTaXplO1xuXG5cdFx0XHRcdFx0XHRcdFx0LyoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0XHRcdFx0XHRcdCBFbGVtZW50LVNwZWNpZmljIFVuaXRzXG5cdFx0XHRcdFx0XHRcdFx0ICoqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0XHRcdFx0XHRcdC8qIE5vdGU6IElFOCByb3VuZHMgdG8gdGhlIG5lYXJlc3QgcGl4ZWwgd2hlbiByZXR1cm5pbmcgQ1NTIHZhbHVlcywgdGh1cyB3ZSBwZXJmb3JtIGNvbnZlcnNpb25zIHVzaW5nIGEgbWVhc3VyZW1lbnRcblx0XHRcdFx0XHRcdFx0XHQgb2YgMTAwIChpbnN0ZWFkIG9mIDEpIHRvIGdpdmUgb3VyIHJhdGlvcyBhIHByZWNpc2lvbiBvZiBhdCBsZWFzdCAyIGRlY2ltYWwgdmFsdWVzLiAqL1xuXHRcdFx0XHRcdFx0XHRcdHZhciBtZWFzdXJlbWVudCA9IDEwMCxcblx0XHRcdFx0XHRcdFx0XHRcdFx0dW5pdFJhdGlvcyA9IHt9O1xuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCFzYW1lRW1SYXRpbyB8fCAhc2FtZVBlcmNlbnRSYXRpbykge1xuXHRcdFx0XHRcdFx0XHRcdFx0dmFyIGR1bW15ID0gZGF0YSAmJiBkYXRhLmlzU1ZHID8gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJyZWN0XCIpIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0VmVsb2NpdHkuaW5pdChkdW1teSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRzYW1lUmF0aW9JbmRpY2F0b3JzLm15UGFyZW50LmFwcGVuZENoaWxkKGR1bW15KTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0LyogVG8gYWNjdXJhdGVseSBhbmQgY29uc2lzdGVudGx5IGNhbGN1bGF0ZSBjb252ZXJzaW9uIHJhdGlvcywgdGhlIGVsZW1lbnQncyBjYXNjYWRlZCBvdmVyZmxvdyBhbmQgYm94LXNpemluZyBhcmUgc3RyaXBwZWQuXG5cdFx0XHRcdFx0XHRcdFx0XHQgU2ltaWxhcmx5LCBzaW5jZSB3aWR0aC9oZWlnaHQgY2FuIGJlIGFydGlmaWNpYWxseSBjb25zdHJhaW5lZCBieSB0aGVpciBtaW4tL21heC0gZXF1aXZhbGVudHMsIHRoZXNlIGFyZSBjb250cm9sbGVkIGZvciBhcyB3ZWxsLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0LyogTm90ZTogT3ZlcmZsb3cgbXVzdCBiZSBhbHNvIGJlIGNvbnRyb2xsZWQgZm9yIHBlci1heGlzIHNpbmNlIHRoZSBvdmVyZmxvdyBwcm9wZXJ0eSBvdmVyd3JpdGVzIGl0cyBwZXItYXhpcyB2YWx1ZXMuICovXG5cdFx0XHRcdFx0XHRcdFx0XHQkLmVhY2goW1wib3ZlcmZsb3dcIiwgXCJvdmVyZmxvd1hcIiwgXCJvdmVyZmxvd1lcIl0sIGZ1bmN0aW9uKGksIHByb3BlcnR5KSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFZlbG9jaXR5LkNTUy5zZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBwcm9wZXJ0eSwgXCJoaWRkZW5cIik7XG5cdFx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHRcdFZlbG9jaXR5LkNTUy5zZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBcInBvc2l0aW9uXCIsIHNhbWVSYXRpb0luZGljYXRvcnMucG9zaXRpb24pO1xuXHRcdFx0XHRcdFx0XHRcdFx0VmVsb2NpdHkuQ1NTLnNldFByb3BlcnR5VmFsdWUoZHVtbXksIFwiZm9udFNpemVcIiwgc2FtZVJhdGlvSW5kaWNhdG9ycy5mb250U2l6ZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRWZWxvY2l0eS5DU1Muc2V0UHJvcGVydHlWYWx1ZShkdW1teSwgXCJib3hTaXppbmdcIiwgXCJjb250ZW50LWJveFwiKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0Lyogd2lkdGggYW5kIGhlaWdodCBhY3QgYXMgb3VyIHByb3h5IHByb3BlcnRpZXMgZm9yIG1lYXN1cmluZyB0aGUgaG9yaXpvbnRhbCBhbmQgdmVydGljYWwgJSByYXRpb3MuICovXG5cdFx0XHRcdFx0XHRcdFx0XHQkLmVhY2goW1wibWluV2lkdGhcIiwgXCJtYXhXaWR0aFwiLCBcIndpZHRoXCIsIFwibWluSGVpZ2h0XCIsIFwibWF4SGVpZ2h0XCIsIFwiaGVpZ2h0XCJdLCBmdW5jdGlvbihpLCBwcm9wZXJ0eSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRWZWxvY2l0eS5DU1Muc2V0UHJvcGVydHlWYWx1ZShkdW1teSwgcHJvcGVydHksIG1lYXN1cmVtZW50ICsgXCIlXCIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0XHQvKiBwYWRkaW5nTGVmdCBhcmJpdHJhcmlseSBhY3RzIGFzIG91ciBwcm94eSBwcm9wZXJ0eSBmb3IgdGhlIGVtIHJhdGlvLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0VmVsb2NpdHkuQ1NTLnNldFByb3BlcnR5VmFsdWUoZHVtbXksIFwicGFkZGluZ0xlZnRcIiwgbWVhc3VyZW1lbnQgKyBcImVtXCIpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHQvKiBEaXZpZGUgdGhlIHJldHVybmVkIHZhbHVlIGJ5IHRoZSBtZWFzdXJlbWVudCB0byBnZXQgdGhlIHJhdGlvIGJldHdlZW4gMSUgYW5kIDFweC4gRGVmYXVsdCB0byAxIHNpbmNlIHdvcmtpbmcgd2l0aCAwIGNhbiBwcm9kdWNlIEluZmluaXRlLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0dW5pdFJhdGlvcy5wZXJjZW50VG9QeFdpZHRoID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0UGVyY2VudFRvUHhXaWR0aCA9IChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBcIndpZHRoXCIsIG51bGwsIHRydWUpKSB8fCAxKSAvIG1lYXN1cmVtZW50OyAvKiBHRVQgKi9cblx0XHRcdFx0XHRcdFx0XHRcdHVuaXRSYXRpb3MucGVyY2VudFRvUHhIZWlnaHQgPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQZXJjZW50VG9QeEhlaWdodCA9IChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBcImhlaWdodFwiLCBudWxsLCB0cnVlKSkgfHwgMSkgLyBtZWFzdXJlbWVudDsgLyogR0VUICovXG5cdFx0XHRcdFx0XHRcdFx0XHR1bml0UmF0aW9zLmVtVG9QeCA9IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdEVtVG9QeCA9IChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBcInBhZGRpbmdMZWZ0XCIpKSB8fCAxKSAvIG1lYXN1cmVtZW50OyAvKiBHRVQgKi9cblxuXHRcdFx0XHRcdFx0XHRcdFx0c2FtZVJhdGlvSW5kaWNhdG9ycy5teVBhcmVudC5yZW1vdmVDaGlsZChkdW1teSk7XG5cdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdHVuaXRSYXRpb3MuZW1Ub1B4ID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0RW1Ub1B4O1xuXHRcdFx0XHRcdFx0XHRcdFx0dW5pdFJhdGlvcy5wZXJjZW50VG9QeFdpZHRoID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0UGVyY2VudFRvUHhXaWR0aDtcblx0XHRcdFx0XHRcdFx0XHRcdHVuaXRSYXRpb3MucGVyY2VudFRvUHhIZWlnaHQgPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQZXJjZW50VG9QeEhlaWdodDtcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHQvKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdFx0XHRcdFx0XHRcdFx0IEVsZW1lbnQtQWdub3N0aWMgVW5pdHNcblx0XHRcdFx0XHRcdFx0XHQgKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0XHRcdFx0XHRcdFx0LyogV2hlcmVhcyAlIGFuZCBlbSByYXRpb3MgYXJlIGRldGVybWluZWQgb24gYSBwZXItZWxlbWVudCBiYXNpcywgdGhlIHJlbSB1bml0IG9ubHkgbmVlZHMgdG8gYmUgY2hlY2tlZFxuXHRcdFx0XHRcdFx0XHRcdCBvbmNlIHBlciBjYWxsIHNpbmNlIGl0J3MgZXhjbHVzaXZlbHkgZGVwZW5kYW50IHVwb24gZG9jdW1lbnQuYm9keSdzIGZvbnRTaXplLiBJZiB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lXG5cdFx0XHRcdFx0XHRcdFx0IHRoYXQgY2FsY3VsYXRlVW5pdFJhdGlvcygpIGlzIGJlaW5nIHJ1biBkdXJpbmcgdGhpcyBjYWxsLCByZW1Ub1B4IHdpbGwgc3RpbGwgYmUgc2V0IHRvIGl0cyBkZWZhdWx0IHZhbHVlIG9mIG51bGwsXG5cdFx0XHRcdFx0XHRcdFx0IHNvIHdlIGNhbGN1bGF0ZSBpdCBub3cuICovXG5cdFx0XHRcdFx0XHRcdFx0aWYgKGNhbGxVbml0Q29udmVyc2lvbkRhdGEucmVtVG9QeCA9PT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0LyogRGVmYXVsdCB0byBicm93c2VycycgZGVmYXVsdCBmb250U2l6ZSBvZiAxNnB4IGluIHRoZSBjYXNlIG9mIDAuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRjYWxsVW5pdENvbnZlcnNpb25EYXRhLnJlbVRvUHggPSBwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGRvY3VtZW50LmJvZHksIFwiZm9udFNpemVcIikpIHx8IDE2OyAvKiBHRVQgKi9cblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHQvKiBTaW1pbGFybHksIHZpZXdwb3J0IHVuaXRzIGFyZSAlLXJlbGF0aXZlIHRvIHRoZSB3aW5kb3cncyBpbm5lciBkaW1lbnNpb25zLiAqL1xuXHRcdFx0XHRcdFx0XHRcdGlmIChjYWxsVW5pdENvbnZlcnNpb25EYXRhLnZ3VG9QeCA9PT0gbnVsbCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y2FsbFVuaXRDb252ZXJzaW9uRGF0YS52d1RvUHggPSBwYXJzZUZsb2F0KHdpbmRvdy5pbm5lcldpZHRoKSAvIDEwMDsgLyogR0VUICovXG5cdFx0XHRcdFx0XHRcdFx0XHRjYWxsVW5pdENvbnZlcnNpb25EYXRhLnZoVG9QeCA9IHBhcnNlRmxvYXQod2luZG93LmlubmVySGVpZ2h0KSAvIDEwMDsgLyogR0VUICovXG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0dW5pdFJhdGlvcy5yZW1Ub1B4ID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5yZW1Ub1B4O1xuXHRcdFx0XHRcdFx0XHRcdHVuaXRSYXRpb3MudndUb1B4ID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS52d1RvUHg7XG5cdFx0XHRcdFx0XHRcdFx0dW5pdFJhdGlvcy52aFRvUHggPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLnZoVG9QeDtcblxuXHRcdFx0XHRcdFx0XHRcdGlmIChWZWxvY2l0eS5kZWJ1ZyA+PSAxKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhcIlVuaXQgcmF0aW9zOiBcIiArIEpTT04uc3RyaW5naWZ5KHVuaXRSYXRpb3MpLCBlbGVtZW50KTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuIHVuaXRSYXRpb3M7XG5cdFx0XHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRcdFx0LyoqKioqKioqKioqKioqKioqKioqXG5cdFx0XHRcdFx0XHRcdCBVbml0IENvbnZlcnNpb25cblx0XHRcdFx0XHRcdFx0ICoqKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0XHRcdFx0XHRcdC8qIFRoZSAqIGFuZCAvIG9wZXJhdG9ycywgd2hpY2ggYXJlIG5vdCBwYXNzZWQgaW4gd2l0aCBhbiBhc3NvY2lhdGVkIHVuaXQsIGluaGVyZW50bHkgdXNlIHN0YXJ0VmFsdWUncyB1bml0LiBTa2lwIHZhbHVlIGFuZCB1bml0IGNvbnZlcnNpb24uICovXG5cdFx0XHRcdFx0XHRcdGlmICgvW1xcLypdLy50ZXN0KG9wZXJhdG9yKSkge1xuXHRcdFx0XHRcdFx0XHRcdGVuZFZhbHVlVW5pdFR5cGUgPSBzdGFydFZhbHVlVW5pdFR5cGU7XG5cdFx0XHRcdFx0XHRcdFx0LyogSWYgc3RhcnRWYWx1ZSBhbmQgZW5kVmFsdWUgZGlmZmVyIGluIHVuaXQgdHlwZSwgY29udmVydCBzdGFydFZhbHVlIGludG8gdGhlIHNhbWUgdW5pdCB0eXBlIGFzIGVuZFZhbHVlIHNvIHRoYXQgaWYgZW5kVmFsdWVVbml0VHlwZVxuXHRcdFx0XHRcdFx0XHRcdCBpcyBhIHJlbGF0aXZlIHVuaXQgKCUsIGVtLCByZW0pLCB0aGUgdmFsdWVzIHNldCBkdXJpbmcgdHdlZW5pbmcgd2lsbCBjb250aW51ZSB0byBiZSBhY2N1cmF0ZWx5IHJlbGF0aXZlIGV2ZW4gaWYgdGhlIG1ldHJpY3MgdGhleSBkZXBlbmRcblx0XHRcdFx0XHRcdFx0XHQgb24gYXJlIGR5bmFtaWNhbGx5IGNoYW5naW5nIGR1cmluZyB0aGUgY291cnNlIG9mIHRoZSBhbmltYXRpb24uIENvbnZlcnNlbHksIGlmIHdlIGFsd2F5cyBub3JtYWxpemVkIGludG8gcHggYW5kIHVzZWQgcHggZm9yIHNldHRpbmcgdmFsdWVzLCB0aGUgcHggcmF0aW9cblx0XHRcdFx0XHRcdFx0XHQgd291bGQgYmVjb21lIHN0YWxlIGlmIHRoZSBvcmlnaW5hbCB1bml0IGJlaW5nIGFuaW1hdGVkIHRvd2FyZCB3YXMgcmVsYXRpdmUgYW5kIHRoZSB1bmRlcmx5aW5nIG1ldHJpY3MgY2hhbmdlIGR1cmluZyB0aGUgYW5pbWF0aW9uLiAqL1xuXHRcdFx0XHRcdFx0XHRcdC8qIFNpbmNlIDAgaXMgMCBpbiBhbnkgdW5pdCB0eXBlLCBubyBjb252ZXJzaW9uIGlzIG5lY2Vzc2FyeSB3aGVuIHN0YXJ0VmFsdWUgaXMgMCAtLSB3ZSBqdXN0IHN0YXJ0IGF0IDAgd2l0aCBlbmRWYWx1ZVVuaXRUeXBlLiAqL1xuXHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKChzdGFydFZhbHVlVW5pdFR5cGUgIT09IGVuZFZhbHVlVW5pdFR5cGUpICYmIHN0YXJ0VmFsdWUgIT09IDApIHtcblx0XHRcdFx0XHRcdFx0XHQvKiBVbml0IGNvbnZlcnNpb24gaXMgYWxzbyBza2lwcGVkIHdoZW4gZW5kVmFsdWUgaXMgMCwgYnV0ICpzdGFydFZhbHVlVW5pdFR5cGUqIG11c3QgYmUgdXNlZCBmb3IgdHdlZW4gdmFsdWVzIHRvIHJlbWFpbiBhY2N1cmF0ZS4gKi9cblx0XHRcdFx0XHRcdFx0XHQvKiBOb3RlOiBTa2lwcGluZyB1bml0IGNvbnZlcnNpb24gaGVyZSBtZWFucyB0aGF0IGlmIGVuZFZhbHVlVW5pdFR5cGUgd2FzIG9yaWdpbmFsbHkgYSByZWxhdGl2ZSB1bml0LCB0aGUgYW5pbWF0aW9uIHdvbid0IHJlbGF0aXZlbHlcblx0XHRcdFx0XHRcdFx0XHQgbWF0Y2ggdGhlIHVuZGVybHlpbmcgbWV0cmljcyBpZiB0aGV5IGNoYW5nZSwgYnV0IHRoaXMgaXMgYWNjZXB0YWJsZSBzaW5jZSB3ZSdyZSBhbmltYXRpbmcgdG93YXJkIGludmlzaWJpbGl0eSBpbnN0ZWFkIG9mIHRvd2FyZCB2aXNpYmlsaXR5LFxuXHRcdFx0XHRcdFx0XHRcdCB3aGljaCByZW1haW5zIHBhc3QgdGhlIHBvaW50IG9mIHRoZSBhbmltYXRpb24ncyBjb21wbGV0aW9uLiAqL1xuXHRcdFx0XHRcdFx0XHRcdGlmIChlbmRWYWx1ZSA9PT0gMCkge1xuXHRcdFx0XHRcdFx0XHRcdFx0ZW5kVmFsdWVVbml0VHlwZSA9IHN0YXJ0VmFsdWVVbml0VHlwZTtcblx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0LyogQnkgdGhpcyBwb2ludCwgd2UgY2Fubm90IGF2b2lkIHVuaXQgY29udmVyc2lvbiAoaXQncyB1bmRlc2lyYWJsZSBzaW5jZSBpdCBjYXVzZXMgbGF5b3V0IHRocmFzaGluZykuXG5cdFx0XHRcdFx0XHRcdFx0XHQgSWYgd2UgaGF2ZW4ndCBhbHJlYWR5LCB3ZSB0cmlnZ2VyIGNhbGN1bGF0ZVVuaXRSYXRpb3MoKSwgd2hpY2ggcnVucyBvbmNlIHBlciBlbGVtZW50IHBlciBjYWxsLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0ZWxlbWVudFVuaXRDb252ZXJzaW9uRGF0YSA9IGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGEgfHwgY2FsY3VsYXRlVW5pdFJhdGlvcygpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHQvKiBUaGUgZm9sbG93aW5nIFJlZ0V4IG1hdGNoZXMgQ1NTIHByb3BlcnRpZXMgdGhhdCBoYXZlIHRoZWlyICUgdmFsdWVzIG1lYXN1cmVkIHJlbGF0aXZlIHRvIHRoZSB4LWF4aXMuICovXG5cdFx0XHRcdFx0XHRcdFx0XHQvKiBOb3RlOiBXM0Mgc3BlYyBtYW5kYXRlcyB0aGF0IGFsbCBvZiBtYXJnaW4gYW5kIHBhZGRpbmcncyBwcm9wZXJ0aWVzIChldmVuIHRvcCBhbmQgYm90dG9tKSBhcmUgJS1yZWxhdGl2ZSB0byB0aGUgKndpZHRoKiBvZiB0aGUgcGFyZW50IGVsZW1lbnQuICovXG5cdFx0XHRcdFx0XHRcdFx0XHR2YXIgYXhpcyA9ICgvbWFyZ2lufHBhZGRpbmd8bGVmdHxyaWdodHx3aWR0aHx0ZXh0fHdvcmR8bGV0dGVyL2kudGVzdChwcm9wZXJ0eSkgfHwgL1gkLy50ZXN0KHByb3BlcnR5KSB8fCBwcm9wZXJ0eSA9PT0gXCJ4XCIpID8gXCJ4XCIgOiBcInlcIjtcblxuXHRcdFx0XHRcdFx0XHRcdFx0LyogSW4gb3JkZXIgdG8gYXZvaWQgZ2VuZXJhdGluZyBuXjIgYmVzcG9rZSBjb252ZXJzaW9uIGZ1bmN0aW9ucywgdW5pdCBjb252ZXJzaW9uIGlzIGEgdHdvLXN0ZXAgcHJvY2Vzczpcblx0XHRcdFx0XHRcdFx0XHRcdCAxKSBDb252ZXJ0IHN0YXJ0VmFsdWUgaW50byBwaXhlbHMuIDIpIENvbnZlcnQgdGhpcyBuZXcgcGl4ZWwgdmFsdWUgaW50byBlbmRWYWx1ZSdzIHVuaXQgdHlwZS4gKi9cblx0XHRcdFx0XHRcdFx0XHRcdHN3aXRjaCAoc3RhcnRWYWx1ZVVuaXRUeXBlKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgXCIlXCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0LyogTm90ZTogdHJhbnNsYXRlWCBhbmQgdHJhbnNsYXRlWSBhcmUgdGhlIG9ubHkgcHJvcGVydGllcyB0aGF0IGFyZSAlLXJlbGF0aXZlIHRvIGFuIGVsZW1lbnQncyBvd24gZGltZW5zaW9ucyAtLSBub3QgaXRzIHBhcmVudCdzIGRpbWVuc2lvbnMuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0IFZlbG9jaXR5IGRvZXMgbm90IGluY2x1ZGUgYSBzcGVjaWFsIGNvbnZlcnNpb24gcHJvY2VzcyB0byBhY2NvdW50IGZvciB0aGlzIGJlaGF2aW9yLiBUaGVyZWZvcmUsIGFuaW1hdGluZyB0cmFuc2xhdGVYL1kgZnJvbSBhICUgdmFsdWVcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQgdG8gYSBub24tJSB2YWx1ZSB3aWxsIHByb2R1Y2UgYW4gaW5jb3JyZWN0IHN0YXJ0IHZhbHVlLiBGb3J0dW5hdGVseSwgdGhpcyBzb3J0IG9mIGNyb3NzLXVuaXQgY29udmVyc2lvbiBpcyByYXJlbHkgZG9uZSBieSB1c2VycyBpbiBwcmFjdGljZS4gKi9cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRzdGFydFZhbHVlICo9IChheGlzID09PSBcInhcIiA/IGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGEucGVyY2VudFRvUHhXaWR0aCA6IGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGEucGVyY2VudFRvUHhIZWlnaHQpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNhc2UgXCJweFwiOlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8qIHB4IGFjdHMgYXMgb3VyIG1pZHBvaW50IGluIHRoZSB1bml0IGNvbnZlcnNpb24gcHJvY2VzczsgZG8gbm90aGluZy4gKi9cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHN0YXJ0VmFsdWUgKj0gZWxlbWVudFVuaXRDb252ZXJzaW9uRGF0YVtzdGFydFZhbHVlVW5pdFR5cGUgKyBcIlRvUHhcIl07XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdC8qIEludmVydCB0aGUgcHggcmF0aW9zIHRvIGNvbnZlcnQgaW50byB0byB0aGUgdGFyZ2V0IHVuaXQuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRzd2l0Y2ggKGVuZFZhbHVlVW5pdFR5cGUpIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y2FzZSBcIiVcIjpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRzdGFydFZhbHVlICo9IDEgLyAoYXhpcyA9PT0gXCJ4XCIgPyBlbGVtZW50VW5pdENvbnZlcnNpb25EYXRhLnBlcmNlbnRUb1B4V2lkdGggOiBlbGVtZW50VW5pdENvbnZlcnNpb25EYXRhLnBlcmNlbnRUb1B4SGVpZ2h0KTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjYXNlIFwicHhcIjpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvKiBzdGFydFZhbHVlIGlzIGFscmVhZHkgaW4gcHgsIGRvIG5vdGhpbmc7IHdlJ3JlIGRvbmUuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRzdGFydFZhbHVlICo9IDEgLyBlbGVtZW50VW5pdENvbnZlcnNpb25EYXRhW2VuZFZhbHVlVW5pdFR5cGUgKyBcIlRvUHhcIl07XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0LyoqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0XHRcdFx0XHQgUmVsYXRpdmUgVmFsdWVzXG5cdFx0XHRcdFx0XHRcdCAqKioqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdFx0XHRcdFx0LyogT3BlcmF0b3IgbG9naWMgbXVzdCBiZSBwZXJmb3JtZWQgbGFzdCBzaW5jZSBpdCByZXF1aXJlcyB1bml0LW5vcm1hbGl6ZWQgc3RhcnQgYW5kIGVuZCB2YWx1ZXMuICovXG5cdFx0XHRcdFx0XHRcdC8qIE5vdGU6IFJlbGF0aXZlICpwZXJjZW50IHZhbHVlcyogZG8gbm90IGJlaGF2ZSBob3cgbW9zdCBwZW9wbGUgdGhpbms7IHdoaWxlIG9uZSB3b3VsZCBleHBlY3QgXCIrPTUwJVwiXG5cdFx0XHRcdFx0XHRcdCB0byBpbmNyZWFzZSB0aGUgcHJvcGVydHkgMS41eCBpdHMgY3VycmVudCB2YWx1ZSwgaXQgaW4gZmFjdCBpbmNyZWFzZXMgdGhlIHBlcmNlbnQgdW5pdHMgaW4gYWJzb2x1dGUgdGVybXM6XG5cdFx0XHRcdFx0XHRcdCA1MCBwb2ludHMgaXMgYWRkZWQgb24gdG9wIG9mIHRoZSBjdXJyZW50ICUgdmFsdWUuICovXG5cdFx0XHRcdFx0XHRcdHN3aXRjaCAob3BlcmF0b3IpIHtcblx0XHRcdFx0XHRcdFx0XHRjYXNlIFwiK1wiOlxuXHRcdFx0XHRcdFx0XHRcdFx0ZW5kVmFsdWUgPSBzdGFydFZhbHVlICsgZW5kVmFsdWU7XG5cdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0XHRcdFx0XHRcdGNhc2UgXCItXCI6XG5cdFx0XHRcdFx0XHRcdFx0XHRlbmRWYWx1ZSA9IHN0YXJ0VmFsdWUgLSBlbmRWYWx1ZTtcblx0XHRcdFx0XHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRcdFx0XHRcdFx0Y2FzZSBcIipcIjpcblx0XHRcdFx0XHRcdFx0XHRcdGVuZFZhbHVlID0gc3RhcnRWYWx1ZSAqIGVuZFZhbHVlO1xuXHRcdFx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdFx0XHRcdFx0XHRjYXNlIFwiL1wiOlxuXHRcdFx0XHRcdFx0XHRcdFx0ZW5kVmFsdWUgPSBzdGFydFZhbHVlIC8gZW5kVmFsdWU7XG5cdFx0XHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdC8qKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0XHRcdFx0XHQgdHdlZW5zQ29udGFpbmVyIFB1c2hcblx0XHRcdFx0XHRcdFx0ICoqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0XHRcdFx0XHRcdC8qIENvbnN0cnVjdCB0aGUgcGVyLXByb3BlcnR5IHR3ZWVuIG9iamVjdCwgYW5kIHB1c2ggaXQgdG8gdGhlIGVsZW1lbnQncyB0d2VlbnNDb250YWluZXIuICovXG5cdFx0XHRcdFx0XHRcdHR3ZWVuc0NvbnRhaW5lcltwcm9wZXJ0eV0gPSB7XG5cdFx0XHRcdFx0XHRcdFx0cm9vdFByb3BlcnR5VmFsdWU6IHJvb3RQcm9wZXJ0eVZhbHVlLFxuXHRcdFx0XHRcdFx0XHRcdHN0YXJ0VmFsdWU6IHN0YXJ0VmFsdWUsXG5cdFx0XHRcdFx0XHRcdFx0Y3VycmVudFZhbHVlOiBzdGFydFZhbHVlLFxuXHRcdFx0XHRcdFx0XHRcdGVuZFZhbHVlOiBlbmRWYWx1ZSxcblx0XHRcdFx0XHRcdFx0XHR1bml0VHlwZTogZW5kVmFsdWVVbml0VHlwZSxcblx0XHRcdFx0XHRcdFx0XHRlYXNpbmc6IGVhc2luZ1xuXHRcdFx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0XHRcdGlmIChWZWxvY2l0eS5kZWJ1Zykge1xuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwidHdlZW5zQ29udGFpbmVyIChcIiArIHByb3BlcnR5ICsgXCIpOiBcIiArIEpTT04uc3RyaW5naWZ5KHR3ZWVuc0NvbnRhaW5lcltwcm9wZXJ0eV0pLCBlbGVtZW50KTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvKiBBbG9uZyB3aXRoIGl0cyBwcm9wZXJ0eSBkYXRhLCBzdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgZWxlbWVudCBpdHNlbGYgb250byB0d2VlbnNDb250YWluZXIuICovXG5cdFx0XHRcdFx0XHR0d2VlbnNDb250YWluZXIuZWxlbWVudCA9IGVsZW1lbnQ7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0LyoqKioqKioqKioqKioqKioqXG5cdFx0XHRcdFx0IENhbGwgUHVzaFxuXHRcdFx0XHRcdCAqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0XHRcdC8qIE5vdGU6IHR3ZWVuc0NvbnRhaW5lciBjYW4gYmUgZW1wdHkgaWYgYWxsIG9mIHRoZSBwcm9wZXJ0aWVzIGluIHRoaXMgY2FsbCdzIHByb3BlcnR5IG1hcCB3ZXJlIHNraXBwZWQgZHVlIHRvIG5vdFxuXHRcdFx0XHRcdCBiZWluZyBzdXBwb3J0ZWQgYnkgdGhlIGJyb3dzZXIuIFRoZSBlbGVtZW50IHByb3BlcnR5IGlzIHVzZWQgZm9yIGNoZWNraW5nIHRoYXQgdGhlIHR3ZWVuc0NvbnRhaW5lciBoYXMgYmVlbiBhcHBlbmRlZCB0by4gKi9cblx0XHRcdFx0XHRpZiAodHdlZW5zQ29udGFpbmVyLmVsZW1lbnQpIHtcblx0XHRcdFx0XHRcdC8qIEFwcGx5IHRoZSBcInZlbG9jaXR5LWFuaW1hdGluZ1wiIGluZGljYXRvciBjbGFzcy4gKi9cblx0XHRcdFx0XHRcdENTUy5WYWx1ZXMuYWRkQ2xhc3MoZWxlbWVudCwgXCJ2ZWxvY2l0eS1hbmltYXRpbmdcIik7XG5cblx0XHRcdFx0XHRcdC8qIFRoZSBjYWxsIGFycmF5IGhvdXNlcyB0aGUgdHdlZW5zQ29udGFpbmVycyBmb3IgZWFjaCBlbGVtZW50IGJlaW5nIGFuaW1hdGVkIGluIHRoZSBjdXJyZW50IGNhbGwuICovXG5cdFx0XHRcdFx0XHRjYWxsLnB1c2godHdlZW5zQ29udGFpbmVyKTtcblxuXHRcdFx0XHRcdFx0ZGF0YSA9IERhdGEoZWxlbWVudCk7XG5cblx0XHRcdFx0XHRcdGlmIChkYXRhKSB7XG5cdFx0XHRcdFx0XHRcdC8qIFN0b3JlIHRoZSB0d2VlbnNDb250YWluZXIgYW5kIG9wdGlvbnMgaWYgd2UncmUgd29ya2luZyBvbiB0aGUgZGVmYXVsdCBlZmZlY3RzIHF1ZXVlLCBzbyB0aGF0IHRoZXkgY2FuIGJlIHVzZWQgYnkgdGhlIHJldmVyc2UgY29tbWFuZC4gKi9cblx0XHRcdFx0XHRcdFx0aWYgKG9wdHMucXVldWUgPT09IFwiXCIpIHtcblxuXHRcdFx0XHRcdFx0XHRcdGRhdGEudHdlZW5zQ29udGFpbmVyID0gdHdlZW5zQ29udGFpbmVyO1xuXHRcdFx0XHRcdFx0XHRcdGRhdGEub3B0cyA9IG9wdHM7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHQvKiBTd2l0Y2ggb24gdGhlIGVsZW1lbnQncyBhbmltYXRpbmcgZmxhZy4gKi9cblx0XHRcdFx0XHRcdFx0ZGF0YS5pc0FuaW1hdGluZyA9IHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8qIE9uY2UgdGhlIGZpbmFsIGVsZW1lbnQgaW4gdGhpcyBjYWxsJ3MgZWxlbWVudCBzZXQgaGFzIGJlZW4gcHJvY2Vzc2VkLCBwdXNoIHRoZSBjYWxsIGFycmF5IG9udG9cblx0XHRcdFx0XHRcdCBWZWxvY2l0eS5TdGF0ZS5jYWxscyBmb3IgdGhlIGFuaW1hdGlvbiB0aWNrIHRvIGltbWVkaWF0ZWx5IGJlZ2luIHByb2Nlc3NpbmcuICovXG5cdFx0XHRcdFx0XHRpZiAoZWxlbWVudHNJbmRleCA9PT0gZWxlbWVudHNMZW5ndGggLSAxKSB7XG5cdFx0XHRcdFx0XHRcdC8qIEFkZCB0aGUgY3VycmVudCBjYWxsIHBsdXMgaXRzIGFzc29jaWF0ZWQgbWV0YWRhdGEgKHRoZSBlbGVtZW50IHNldCBhbmQgdGhlIGNhbGwncyBvcHRpb25zKSBvbnRvIHRoZSBnbG9iYWwgY2FsbCBjb250YWluZXIuXG5cdFx0XHRcdFx0XHRcdCBBbnl0aGluZyBvbiB0aGlzIGNhbGwgY29udGFpbmVyIGlzIHN1YmplY3RlZCB0byB0aWNrKCkgcHJvY2Vzc2luZy4gKi9cblx0XHRcdFx0XHRcdFx0VmVsb2NpdHkuU3RhdGUuY2FsbHMucHVzaChbY2FsbCwgZWxlbWVudHMsIG9wdHMsIG51bGwsIHByb21pc2VEYXRhLnJlc29sdmVyXSk7XG5cblx0XHRcdFx0XHRcdFx0LyogSWYgdGhlIGFuaW1hdGlvbiB0aWNrIGlzbid0IHJ1bm5pbmcsIHN0YXJ0IGl0LiAoVmVsb2NpdHkgc2h1dHMgaXQgb2ZmIHdoZW4gdGhlcmUgYXJlIG5vIGFjdGl2ZSBjYWxscyB0byBwcm9jZXNzLikgKi9cblx0XHRcdFx0XHRcdFx0aWYgKFZlbG9jaXR5LlN0YXRlLmlzVGlja2luZyA9PT0gZmFsc2UpIHtcblx0XHRcdFx0XHRcdFx0XHRWZWxvY2l0eS5TdGF0ZS5pc1RpY2tpbmcgPSB0cnVlO1xuXG5cdFx0XHRcdFx0XHRcdFx0LyogU3RhcnQgdGhlIHRpY2sgbG9vcC4gKi9cblx0XHRcdFx0XHRcdFx0XHR0aWNrKCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGVsZW1lbnRzSW5kZXgrKztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvKiBXaGVuIHRoZSBxdWV1ZSBvcHRpb24gaXMgc2V0IHRvIGZhbHNlLCB0aGUgY2FsbCBza2lwcyB0aGUgZWxlbWVudCdzIHF1ZXVlIGFuZCBmaXJlcyBpbW1lZGlhdGVseS4gKi9cblx0XHRcdFx0aWYgKG9wdHMucXVldWUgPT09IGZhbHNlKSB7XG5cdFx0XHRcdFx0LyogU2luY2UgdGhpcyBidWlsZFF1ZXVlIGNhbGwgZG9lc24ndCByZXNwZWN0IHRoZSBlbGVtZW50J3MgZXhpc3RpbmcgcXVldWUgKHdoaWNoIGlzIHdoZXJlIGEgZGVsYXkgb3B0aW9uIHdvdWxkIGhhdmUgYmVlbiBhcHBlbmRlZCksXG5cdFx0XHRcdFx0IHdlIG1hbnVhbGx5IGluamVjdCB0aGUgZGVsYXkgcHJvcGVydHkgaGVyZSB3aXRoIGFuIGV4cGxpY2l0IHNldFRpbWVvdXQuICovXG5cdFx0XHRcdFx0aWYgKG9wdHMuZGVsYXkpIHtcblx0XHRcdFx0XHRcdHNldFRpbWVvdXQoYnVpbGRRdWV1ZSwgb3B0cy5kZWxheSk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGJ1aWxkUXVldWUoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0LyogT3RoZXJ3aXNlLCB0aGUgY2FsbCB1bmRlcmdvZXMgZWxlbWVudCBxdWV1ZWluZyBhcyBub3JtYWwuICovXG5cdFx0XHRcdFx0LyogTm90ZTogVG8gaW50ZXJvcGVyYXRlIHdpdGggalF1ZXJ5LCBWZWxvY2l0eSB1c2VzIGpRdWVyeSdzIG93biAkLnF1ZXVlKCkgc3RhY2sgZm9yIHF1ZXVpbmcgbG9naWMuICovXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0JC5xdWV1ZShlbGVtZW50LCBvcHRzLnF1ZXVlLCBmdW5jdGlvbihuZXh0LCBjbGVhclF1ZXVlKSB7XG5cdFx0XHRcdFx0XHQvKiBJZiB0aGUgY2xlYXJRdWV1ZSBmbGFnIHdhcyBwYXNzZWQgaW4gYnkgdGhlIHN0b3AgY29tbWFuZCwgcmVzb2x2ZSB0aGlzIGNhbGwncyBwcm9taXNlLiAoUHJvbWlzZXMgY2FuIG9ubHkgYmUgcmVzb2x2ZWQgb25jZSxcblx0XHRcdFx0XHRcdCBzbyBpdCdzIGZpbmUgaWYgdGhpcyBpcyByZXBlYXRlZGx5IHRyaWdnZXJlZCBmb3IgZWFjaCBlbGVtZW50IGluIHRoZSBhc3NvY2lhdGVkIGNhbGwuKSAqL1xuXHRcdFx0XHRcdFx0aWYgKGNsZWFyUXVldWUgPT09IHRydWUpIHtcblx0XHRcdFx0XHRcdFx0aWYgKHByb21pc2VEYXRhLnByb21pc2UpIHtcblx0XHRcdFx0XHRcdFx0XHRwcm9taXNlRGF0YS5yZXNvbHZlcihlbGVtZW50cyk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHQvKiBEbyBub3QgY29udGludWUgd2l0aCBhbmltYXRpb24gcXVldWVpbmcuICovXG5cdFx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvKiBUaGlzIGZsYWcgaW5kaWNhdGVzIHRvIHRoZSB1cGNvbWluZyBjb21wbGV0ZUNhbGwoKSBmdW5jdGlvbiB0aGF0IHRoaXMgcXVldWUgZW50cnkgd2FzIGluaXRpYXRlZCBieSBWZWxvY2l0eS5cblx0XHRcdFx0XHRcdCBTZWUgY29tcGxldGVDYWxsKCkgZm9yIGZ1cnRoZXIgZGV0YWlscy4gKi9cblx0XHRcdFx0XHRcdFZlbG9jaXR5LnZlbG9jaXR5UXVldWVFbnRyeUZsYWcgPSB0cnVlO1xuXG5cdFx0XHRcdFx0XHRidWlsZFF1ZXVlKG5leHQpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0LyoqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0XHQgQXV0by1EZXF1ZXVpbmdcblx0XHRcdFx0ICoqKioqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0XHQvKiBBcyBwZXIgalF1ZXJ5J3MgJC5xdWV1ZSgpIGJlaGF2aW9yLCB0byBmaXJlIHRoZSBmaXJzdCBub24tY3VzdG9tLXF1ZXVlIGVudHJ5IG9uIGFuIGVsZW1lbnQsIHRoZSBlbGVtZW50XG5cdFx0XHRcdCBtdXN0IGJlIGRlcXVldWVkIGlmIGl0cyBxdWV1ZSBzdGFjayBjb25zaXN0cyAqc29sZWx5KiBvZiB0aGUgY3VycmVudCBjYWxsLiAoVGhpcyBjYW4gYmUgZGV0ZXJtaW5lZCBieSBjaGVja2luZ1xuXHRcdFx0XHQgZm9yIHRoZSBcImlucHJvZ3Jlc3NcIiBpdGVtIHRoYXQgalF1ZXJ5IHByZXBlbmRzIHRvIGFjdGl2ZSBxdWV1ZSBzdGFjayBhcnJheXMuKSBSZWdhcmRsZXNzLCB3aGVuZXZlciB0aGUgZWxlbWVudCdzXG5cdFx0XHRcdCBxdWV1ZSBpcyBmdXJ0aGVyIGFwcGVuZGVkIHdpdGggYWRkaXRpb25hbCBpdGVtcyAtLSBpbmNsdWRpbmcgJC5kZWxheSgpJ3Mgb3IgZXZlbiAkLmFuaW1hdGUoKSBjYWxscywgdGhlIHF1ZXVlJ3Ncblx0XHRcdFx0IGZpcnN0IGVudHJ5IGlzIGF1dG9tYXRpY2FsbHkgZmlyZWQuIFRoaXMgYmVoYXZpb3IgY29udHJhc3RzIHRoYXQgb2YgY3VzdG9tIHF1ZXVlcywgd2hpY2ggbmV2ZXIgYXV0by1maXJlLiAqL1xuXHRcdFx0XHQvKiBOb3RlOiBXaGVuIGFuIGVsZW1lbnQgc2V0IGlzIGJlaW5nIHN1YmplY3RlZCB0byBhIG5vbi1wYXJhbGxlbCBWZWxvY2l0eSBjYWxsLCB0aGUgYW5pbWF0aW9uIHdpbGwgbm90IGJlZ2luIHVudGlsXG5cdFx0XHRcdCBlYWNoIG9uZSBvZiB0aGUgZWxlbWVudHMgaW4gdGhlIHNldCBoYXMgcmVhY2hlZCB0aGUgZW5kIG9mIGl0cyBpbmRpdmlkdWFsbHkgcHJlLWV4aXN0aW5nIHF1ZXVlIGNoYWluLiAqL1xuXHRcdFx0XHQvKiBOb3RlOiBVbmZvcnR1bmF0ZWx5LCBtb3N0IHBlb3BsZSBkb24ndCBmdWxseSBncmFzcCBqUXVlcnkncyBwb3dlcmZ1bCwgeWV0IHF1aXJreSwgJC5xdWV1ZSgpIGZ1bmN0aW9uLlxuXHRcdFx0XHQgTGVhbiBtb3JlIGhlcmU6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA1ODE1OC9jYW4tc29tZWJvZHktZXhwbGFpbi1qcXVlcnktcXVldWUtdG8tbWUgKi9cblx0XHRcdFx0aWYgKChvcHRzLnF1ZXVlID09PSBcIlwiIHx8IG9wdHMucXVldWUgPT09IFwiZnhcIikgJiYgJC5xdWV1ZShlbGVtZW50KVswXSAhPT0gXCJpbnByb2dyZXNzXCIpIHtcblx0XHRcdFx0XHQkLmRlcXVldWUoZWxlbWVudCk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0LyoqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdFx0XHQgRWxlbWVudCBTZXQgSXRlcmF0aW9uXG5cdFx0XHQgKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdC8qIElmIHRoZSBcIm5vZGVUeXBlXCIgcHJvcGVydHkgZXhpc3RzIG9uIHRoZSBlbGVtZW50cyB2YXJpYWJsZSwgd2UncmUgYW5pbWF0aW5nIGEgc2luZ2xlIGVsZW1lbnQuXG5cdFx0XHQgUGxhY2UgaXQgaW4gYW4gYXJyYXkgc28gdGhhdCAkLmVhY2goKSBjYW4gaXRlcmF0ZSBvdmVyIGl0LiAqL1xuXHRcdFx0JC5lYWNoKGVsZW1lbnRzLCBmdW5jdGlvbihpLCBlbGVtZW50KSB7XG5cdFx0XHRcdC8qIEVuc3VyZSBlYWNoIGVsZW1lbnQgaW4gYSBzZXQgaGFzIGEgbm9kZVR5cGUgKGlzIGEgcmVhbCBlbGVtZW50KSB0byBhdm9pZCB0aHJvd2luZyBlcnJvcnMuICovXG5cdFx0XHRcdGlmIChUeXBlLmlzTm9kZShlbGVtZW50KSkge1xuXHRcdFx0XHRcdHByb2Nlc3NFbGVtZW50KGVsZW1lbnQsIGkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0LyoqKioqKioqKioqKioqKioqKlxuXHRcdFx0IE9wdGlvbjogTG9vcFxuXHRcdFx0ICoqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0LyogVGhlIGxvb3Agb3B0aW9uIGFjY2VwdHMgYW4gaW50ZWdlciBpbmRpY2F0aW5nIGhvdyBtYW55IHRpbWVzIHRoZSBlbGVtZW50IHNob3VsZCBsb29wIGJldHdlZW4gdGhlIHZhbHVlcyBpbiB0aGVcblx0XHRcdCBjdXJyZW50IGNhbGwncyBwcm9wZXJ0aWVzIG1hcCBhbmQgdGhlIGVsZW1lbnQncyBwcm9wZXJ0eSB2YWx1ZXMgcHJpb3IgdG8gdGhpcyBjYWxsLiAqL1xuXHRcdFx0LyogTm90ZTogVGhlIGxvb3Agb3B0aW9uJ3MgbG9naWMgaXMgcGVyZm9ybWVkIGhlcmUgLS0gYWZ0ZXIgZWxlbWVudCBwcm9jZXNzaW5nIC0tIGJlY2F1c2UgdGhlIGN1cnJlbnQgY2FsbCBuZWVkc1xuXHRcdFx0IHRvIHVuZGVyZ28gaXRzIHF1ZXVlIGluc2VydGlvbiBwcmlvciB0byB0aGUgbG9vcCBvcHRpb24gZ2VuZXJhdGluZyBpdHMgc2VyaWVzIG9mIGNvbnN0aXR1ZW50IFwicmV2ZXJzZVwiIGNhbGxzLFxuXHRcdFx0IHdoaWNoIGNoYWluIGFmdGVyIHRoZSBjdXJyZW50IGNhbGwuIFR3byByZXZlcnNlIGNhbGxzICh0d28gXCJhbHRlcm5hdGlvbnNcIikgY29uc3RpdHV0ZSBvbmUgbG9vcC4gKi9cblx0XHRcdG9wdHMgPSAkLmV4dGVuZCh7fSwgVmVsb2NpdHkuZGVmYXVsdHMsIG9wdGlvbnMpO1xuXHRcdFx0b3B0cy5sb29wID0gcGFyc2VJbnQob3B0cy5sb29wLCAxMCk7XG5cdFx0XHR2YXIgcmV2ZXJzZUNhbGxzQ291bnQgPSAob3B0cy5sb29wICogMikgLSAxO1xuXG5cdFx0XHRpZiAob3B0cy5sb29wKSB7XG5cdFx0XHRcdC8qIERvdWJsZSB0aGUgbG9vcCBjb3VudCB0byBjb252ZXJ0IGl0IGludG8gaXRzIGFwcHJvcHJpYXRlIG51bWJlciBvZiBcInJldmVyc2VcIiBjYWxscy5cblx0XHRcdFx0IFN1YnRyYWN0IDEgZnJvbSB0aGUgcmVzdWx0aW5nIHZhbHVlIHNpbmNlIHRoZSBjdXJyZW50IGNhbGwgaXMgaW5jbHVkZWQgaW4gdGhlIHRvdGFsIGFsdGVybmF0aW9uIGNvdW50LiAqL1xuXHRcdFx0XHRmb3IgKHZhciB4ID0gMDsgeCA8IHJldmVyc2VDYWxsc0NvdW50OyB4KyspIHtcblx0XHRcdFx0XHQvKiBTaW5jZSB0aGUgbG9naWMgZm9yIHRoZSByZXZlcnNlIGFjdGlvbiBvY2N1cnMgaW5zaWRlIFF1ZXVlaW5nIGFuZCB0aGVyZWZvcmUgdGhpcyBjYWxsJ3Mgb3B0aW9ucyBvYmplY3Rcblx0XHRcdFx0XHQgaXNuJ3QgcGFyc2VkIHVudGlsIHRoZW4gYXMgd2VsbCwgdGhlIGN1cnJlbnQgY2FsbCdzIGRlbGF5IG9wdGlvbiBtdXN0IGJlIGV4cGxpY2l0bHkgcGFzc2VkIGludG8gdGhlIHJldmVyc2Vcblx0XHRcdFx0XHQgY2FsbCBzbyB0aGF0IHRoZSBkZWxheSBsb2dpYyB0aGF0IG9jY3VycyBpbnNpZGUgKlByZS1RdWV1ZWluZyogY2FuIHByb2Nlc3MgaXQuICovXG5cdFx0XHRcdFx0dmFyIHJldmVyc2VPcHRpb25zID0ge1xuXHRcdFx0XHRcdFx0ZGVsYXk6IG9wdHMuZGVsYXksXG5cdFx0XHRcdFx0XHRwcm9ncmVzczogb3B0cy5wcm9ncmVzc1xuXHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHQvKiBJZiBhIGNvbXBsZXRlIGNhbGxiYWNrIHdhcyBwYXNzZWQgaW50byB0aGlzIGNhbGwsIHRyYW5zZmVyIGl0IHRvIHRoZSBsb29wIHJlZGlyZWN0J3MgZmluYWwgXCJyZXZlcnNlXCIgY2FsbFxuXHRcdFx0XHRcdCBzbyB0aGF0IGl0J3MgdHJpZ2dlcmVkIHdoZW4gdGhlIGVudGlyZSByZWRpcmVjdCBpcyBjb21wbGV0ZSAoYW5kIG5vdCB3aGVuIHRoZSB2ZXJ5IGZpcnN0IGFuaW1hdGlvbiBpcyBjb21wbGV0ZSkuICovXG5cdFx0XHRcdFx0aWYgKHggPT09IHJldmVyc2VDYWxsc0NvdW50IC0gMSkge1xuXHRcdFx0XHRcdFx0cmV2ZXJzZU9wdGlvbnMuZGlzcGxheSA9IG9wdHMuZGlzcGxheTtcblx0XHRcdFx0XHRcdHJldmVyc2VPcHRpb25zLnZpc2liaWxpdHkgPSBvcHRzLnZpc2liaWxpdHk7XG5cdFx0XHRcdFx0XHRyZXZlcnNlT3B0aW9ucy5jb21wbGV0ZSA9IG9wdHMuY29tcGxldGU7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0YW5pbWF0ZShlbGVtZW50cywgXCJyZXZlcnNlXCIsIHJldmVyc2VPcHRpb25zKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvKioqKioqKioqKioqKioqXG5cdFx0XHQgQ2hhaW5pbmdcblx0XHRcdCAqKioqKioqKioqKioqKiovXG5cblx0XHRcdC8qIFJldHVybiB0aGUgZWxlbWVudHMgYmFjayB0byB0aGUgY2FsbCBjaGFpbiwgd2l0aCB3cmFwcGVkIGVsZW1lbnRzIHRha2luZyBwcmVjZWRlbmNlIGluIGNhc2UgVmVsb2NpdHkgd2FzIGNhbGxlZCB2aWEgdGhlICQuZm4uIGV4dGVuc2lvbi4gKi9cblx0XHRcdHJldHVybiBnZXRDaGFpbigpO1xuXHRcdH07XG5cblx0XHQvKiBUdXJuIFZlbG9jaXR5IGludG8gdGhlIGFuaW1hdGlvbiBmdW5jdGlvbiwgZXh0ZW5kZWQgd2l0aCB0aGUgcHJlLWV4aXN0aW5nIFZlbG9jaXR5IG9iamVjdC4gKi9cblx0XHRWZWxvY2l0eSA9ICQuZXh0ZW5kKGFuaW1hdGUsIFZlbG9jaXR5KTtcblx0XHQvKiBGb3IgbGVnYWN5IHN1cHBvcnQsIGFsc28gZXhwb3NlIHRoZSBsaXRlcmFsIGFuaW1hdGUgbWV0aG9kLiAqL1xuXHRcdFZlbG9jaXR5LmFuaW1hdGUgPSBhbmltYXRlO1xuXG5cdFx0LyoqKioqKioqKioqKioqXG5cdFx0IFRpbWluZ1xuXHRcdCAqKioqKioqKioqKioqKi9cblxuXHRcdC8qIFRpY2tlciBmdW5jdGlvbi4gKi9cblx0XHR2YXIgdGlja2VyID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCByQUZTaGltO1xuXG5cdFx0LyogSW5hY3RpdmUgYnJvd3NlciB0YWJzIHBhdXNlIHJBRiwgd2hpY2ggcmVzdWx0cyBpbiBhbGwgYWN0aXZlIGFuaW1hdGlvbnMgaW1tZWRpYXRlbHkgc3ByaW50aW5nIHRvIHRoZWlyIGNvbXBsZXRpb24gc3RhdGVzIHdoZW4gdGhlIHRhYiByZWZvY3VzZXMuXG5cdFx0IFRvIGdldCBhcm91bmQgdGhpcywgd2UgZHluYW1pY2FsbHkgc3dpdGNoIHJBRiB0byBzZXRUaW1lb3V0ICh3aGljaCB0aGUgYnJvd3NlciAqZG9lc24ndCogcGF1c2UpIHdoZW4gdGhlIHRhYiBsb3NlcyBmb2N1cy4gV2Ugc2tpcCB0aGlzIGZvciBtb2JpbGVcblx0XHQgZGV2aWNlcyB0byBhdm9pZCB3YXN0aW5nIGJhdHRlcnkgcG93ZXIgb24gaW5hY3RpdmUgdGFicy4gKi9cblx0XHQvKiBOb3RlOiBUYWIgZm9jdXMgZGV0ZWN0aW9uIGRvZXNuJ3Qgd29yayBvbiBvbGRlciB2ZXJzaW9ucyBvZiBJRSwgYnV0IHRoYXQncyBva2F5IHNpbmNlIHRoZXkgZG9uJ3Qgc3VwcG9ydCByQUYgdG8gYmVnaW4gd2l0aC4gKi9cblx0XHRpZiAoIVZlbG9jaXR5LlN0YXRlLmlzTW9iaWxlICYmIGRvY3VtZW50LmhpZGRlbiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwidmlzaWJpbGl0eWNoYW5nZVwiLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0LyogUmVhc3NpZ24gdGhlIHJBRiBmdW5jdGlvbiAod2hpY2ggdGhlIGdsb2JhbCB0aWNrKCkgZnVuY3Rpb24gdXNlcykgYmFzZWQgb24gdGhlIHRhYidzIGZvY3VzIHN0YXRlLiAqL1xuXHRcdFx0XHRpZiAoZG9jdW1lbnQuaGlkZGVuKSB7XG5cdFx0XHRcdFx0dGlja2VyID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0XHRcdFx0XHRcdC8qIFRoZSB0aWNrIGZ1bmN0aW9uIG5lZWRzIGEgdHJ1dGh5IGZpcnN0IGFyZ3VtZW50IGluIG9yZGVyIHRvIHBhc3MgaXRzIGludGVybmFsIHRpbWVzdGFtcCBjaGVjay4gKi9cblx0XHRcdFx0XHRcdHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0XHRjYWxsYmFjayh0cnVlKTtcblx0XHRcdFx0XHRcdH0sIDE2KTtcblx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0LyogVGhlIHJBRiBsb29wIGhhcyBiZWVuIHBhdXNlZCBieSB0aGUgYnJvd3Nlciwgc28gd2UgbWFudWFsbHkgcmVzdGFydCB0aGUgdGljay4gKi9cblx0XHRcdFx0XHR0aWNrKCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dGlja2VyID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCByQUZTaGltO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHQvKioqKioqKioqKioqXG5cdFx0IFRpY2tcblx0XHQgKioqKioqKioqKioqL1xuXG5cdFx0LyogTm90ZTogQWxsIGNhbGxzIHRvIFZlbG9jaXR5IGFyZSBwdXNoZWQgdG8gdGhlIFZlbG9jaXR5LlN0YXRlLmNhbGxzIGFycmF5LCB3aGljaCBpcyBmdWxseSBpdGVyYXRlZCB0aHJvdWdoIHVwb24gZWFjaCB0aWNrLiAqL1xuXHRcdGZ1bmN0aW9uIHRpY2sodGltZXN0YW1wKSB7XG5cdFx0XHQvKiBBbiBlbXB0eSB0aW1lc3RhbXAgYXJndW1lbnQgaW5kaWNhdGVzIHRoYXQgdGhpcyBpcyB0aGUgZmlyc3QgdGljayBvY2N1cmVuY2Ugc2luY2UgdGlja2luZyB3YXMgdHVybmVkIG9uLlxuXHRcdFx0IFdlIGxldmVyYWdlIHRoaXMgbWV0YWRhdGEgdG8gZnVsbHkgaWdub3JlIHRoZSBmaXJzdCB0aWNrIHBhc3Mgc2luY2UgUkFGJ3MgaW5pdGlhbCBwYXNzIGlzIGZpcmVkIHdoZW5ldmVyXG5cdFx0XHQgdGhlIGJyb3dzZXIncyBuZXh0IHRpY2sgc3luYyB0aW1lIG9jY3Vycywgd2hpY2ggcmVzdWx0cyBpbiB0aGUgZmlyc3QgZWxlbWVudHMgc3ViamVjdGVkIHRvIFZlbG9jaXR5XG5cdFx0XHQgY2FsbHMgYmVpbmcgYW5pbWF0ZWQgb3V0IG9mIHN5bmMgd2l0aCBhbnkgZWxlbWVudHMgYW5pbWF0ZWQgaW1tZWRpYXRlbHkgdGhlcmVhZnRlci4gSW4gc2hvcnQsIHdlIGlnbm9yZVxuXHRcdFx0IHRoZSBmaXJzdCBSQUYgdGljayBwYXNzIHNvIHRoYXQgZWxlbWVudHMgYmVpbmcgaW1tZWRpYXRlbHkgY29uc2VjdXRpdmVseSBhbmltYXRlZCAtLSBpbnN0ZWFkIG9mIHNpbXVsdGFuZW91c2x5IGFuaW1hdGVkXG5cdFx0XHQgYnkgdGhlIHNhbWUgVmVsb2NpdHkgY2FsbCAtLSBhcmUgcHJvcGVybHkgYmF0Y2hlZCBpbnRvIHRoZSBzYW1lIGluaXRpYWwgUkFGIHRpY2sgYW5kIGNvbnNlcXVlbnRseSByZW1haW4gaW4gc3luYyB0aGVyZWFmdGVyLiAqL1xuXHRcdFx0aWYgKHRpbWVzdGFtcCkge1xuXHRcdFx0XHQvKiBXZSBpZ25vcmUgUkFGJ3MgaGlnaCByZXNvbHV0aW9uIHRpbWVzdGFtcCBzaW5jZSBpdCBjYW4gYmUgc2lnbmlmaWNhbnRseSBvZmZzZXQgd2hlbiB0aGUgYnJvd3NlciBpc1xuXHRcdFx0XHQgdW5kZXIgaGlnaCBzdHJlc3M7IHdlIG9wdCBmb3IgY2hvcHBpbmVzcyBvdmVyIGFsbG93aW5nIHRoZSBicm93c2VyIHRvIGRyb3AgaHVnZSBjaHVua3Mgb2YgZnJhbWVzLiAqL1xuXHRcdFx0XHR2YXIgdGltZUN1cnJlbnQgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuXG5cdFx0XHRcdC8qKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0XHQgQ2FsbCBJdGVyYXRpb25cblx0XHRcdFx0ICoqKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0XHRcdHZhciBjYWxsc0xlbmd0aCA9IFZlbG9jaXR5LlN0YXRlLmNhbGxzLmxlbmd0aDtcblxuXHRcdFx0XHQvKiBUbyBzcGVlZCB1cCBpdGVyYXRpbmcgb3ZlciB0aGlzIGFycmF5LCBpdCBpcyBjb21wYWN0ZWQgKGZhbHNleSBpdGVtcyAtLSBjYWxscyB0aGF0IGhhdmUgY29tcGxldGVkIC0tIGFyZSByZW1vdmVkKVxuXHRcdFx0XHQgd2hlbiBpdHMgbGVuZ3RoIGhhcyBiYWxsb29uZWQgdG8gYSBwb2ludCB0aGF0IGNhbiBpbXBhY3QgdGljayBwZXJmb3JtYW5jZS4gVGhpcyBvbmx5IGJlY29tZXMgbmVjZXNzYXJ5IHdoZW4gYW5pbWF0aW9uXG5cdFx0XHRcdCBoYXMgYmVlbiBjb250aW51b3VzIHdpdGggbWFueSBlbGVtZW50cyBvdmVyIGEgbG9uZyBwZXJpb2Qgb2YgdGltZTsgd2hlbmV2ZXIgYWxsIGFjdGl2ZSBjYWxscyBhcmUgY29tcGxldGVkLCBjb21wbGV0ZUNhbGwoKSBjbGVhcnMgVmVsb2NpdHkuU3RhdGUuY2FsbHMuICovXG5cdFx0XHRcdGlmIChjYWxsc0xlbmd0aCA+IDEwMDAwKSB7XG5cdFx0XHRcdFx0VmVsb2NpdHkuU3RhdGUuY2FsbHMgPSBjb21wYWN0U3BhcnNlQXJyYXkoVmVsb2NpdHkuU3RhdGUuY2FsbHMpO1xuXHRcdFx0XHRcdGNhbGxzTGVuZ3RoID0gVmVsb2NpdHkuU3RhdGUuY2FsbHMubGVuZ3RoO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0LyogSXRlcmF0ZSB0aHJvdWdoIGVhY2ggYWN0aXZlIGNhbGwuICovXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbHNMZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdC8qIFdoZW4gYSBWZWxvY2l0eSBjYWxsIGlzIGNvbXBsZXRlZCwgaXRzIFZlbG9jaXR5LlN0YXRlLmNhbGxzIGVudHJ5IGlzIHNldCB0byBmYWxzZS4gQ29udGludWUgb24gdG8gdGhlIG5leHQgY2FsbC4gKi9cblx0XHRcdFx0XHRpZiAoIVZlbG9jaXR5LlN0YXRlLmNhbGxzW2ldKSB7XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvKioqKioqKioqKioqKioqKioqKioqKioqXG5cdFx0XHRcdFx0IENhbGwtV2lkZSBWYXJpYWJsZXNcblx0XHRcdFx0XHQgKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0XHRcdFx0dmFyIGNhbGxDb250YWluZXIgPSBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tpXSxcblx0XHRcdFx0XHRcdFx0Y2FsbCA9IGNhbGxDb250YWluZXJbMF0sXG5cdFx0XHRcdFx0XHRcdG9wdHMgPSBjYWxsQ29udGFpbmVyWzJdLFxuXHRcdFx0XHRcdFx0XHR0aW1lU3RhcnQgPSBjYWxsQ29udGFpbmVyWzNdLFxuXHRcdFx0XHRcdFx0XHRmaXJzdFRpY2sgPSAhIXRpbWVTdGFydCxcblx0XHRcdFx0XHRcdFx0dHdlZW5EdW1teVZhbHVlID0gbnVsbDtcblxuXHRcdFx0XHRcdC8qIElmIHRpbWVTdGFydCBpcyB1bmRlZmluZWQsIHRoZW4gdGhpcyBpcyB0aGUgZmlyc3QgdGltZSB0aGF0IHRoaXMgY2FsbCBoYXMgYmVlbiBwcm9jZXNzZWQgYnkgdGljaygpLlxuXHRcdFx0XHRcdCBXZSBhc3NpZ24gdGltZVN0YXJ0IG5vdyBzbyB0aGF0IGl0cyB2YWx1ZSBpcyBhcyBjbG9zZSB0byB0aGUgcmVhbCBhbmltYXRpb24gc3RhcnQgdGltZSBhcyBwb3NzaWJsZS5cblx0XHRcdFx0XHQgKENvbnZlcnNlbHksIGhhZCB0aW1lU3RhcnQgYmVlbiBkZWZpbmVkIHdoZW4gdGhpcyBjYWxsIHdhcyBhZGRlZCB0byBWZWxvY2l0eS5TdGF0ZS5jYWxscywgdGhlIGRlbGF5XG5cdFx0XHRcdFx0IGJldHdlZW4gdGhhdCB0aW1lIGFuZCBub3cgd291bGQgY2F1c2UgdGhlIGZpcnN0IGZldyBmcmFtZXMgb2YgdGhlIHR3ZWVuIHRvIGJlIHNraXBwZWQgc2luY2Vcblx0XHRcdFx0XHQgcGVyY2VudENvbXBsZXRlIGlzIGNhbGN1bGF0ZWQgcmVsYXRpdmUgdG8gdGltZVN0YXJ0LikgKi9cblx0XHRcdFx0XHQvKiBGdXJ0aGVyLCBzdWJ0cmFjdCAxNm1zICh0aGUgYXBwcm94aW1hdGUgcmVzb2x1dGlvbiBvZiBSQUYpIGZyb20gdGhlIGN1cnJlbnQgdGltZSB2YWx1ZSBzbyB0aGF0IHRoZVxuXHRcdFx0XHRcdCBmaXJzdCB0aWNrIGl0ZXJhdGlvbiBpc24ndCB3YXN0ZWQgYnkgYW5pbWF0aW5nIGF0IDAlIHR3ZWVuIGNvbXBsZXRpb24sIHdoaWNoIHdvdWxkIHByb2R1Y2UgdGhlXG5cdFx0XHRcdFx0IHNhbWUgc3R5bGUgdmFsdWUgYXMgdGhlIGVsZW1lbnQncyBjdXJyZW50IHZhbHVlLiAqL1xuXHRcdFx0XHRcdGlmICghdGltZVN0YXJ0KSB7XG5cdFx0XHRcdFx0XHR0aW1lU3RhcnQgPSBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tpXVszXSA9IHRpbWVDdXJyZW50IC0gMTY7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0LyogVGhlIHR3ZWVuJ3MgY29tcGxldGlvbiBwZXJjZW50YWdlIGlzIHJlbGF0aXZlIHRvIHRoZSB0d2VlbidzIHN0YXJ0IHRpbWUsIG5vdCB0aGUgdHdlZW4ncyBzdGFydCB2YWx1ZVxuXHRcdFx0XHRcdCAod2hpY2ggd291bGQgcmVzdWx0IGluIHVucHJlZGljdGFibGUgdHdlZW4gZHVyYXRpb25zIHNpbmNlIEphdmFTY3JpcHQncyB0aW1lcnMgYXJlIG5vdCBwYXJ0aWN1bGFybHkgYWNjdXJhdGUpLlxuXHRcdFx0XHRcdCBBY2NvcmRpbmdseSwgd2UgZW5zdXJlIHRoYXQgcGVyY2VudENvbXBsZXRlIGRvZXMgbm90IGV4Y2VlZCAxLiAqL1xuXHRcdFx0XHRcdHZhciBwZXJjZW50Q29tcGxldGUgPSBNYXRoLm1pbigodGltZUN1cnJlbnQgLSB0aW1lU3RhcnQpIC8gb3B0cy5kdXJhdGlvbiwgMSk7XG5cblx0XHRcdFx0XHQvKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0XHRcdCBFbGVtZW50IEl0ZXJhdGlvblxuXHRcdFx0XHRcdCAqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0XHRcdFx0LyogRm9yIGV2ZXJ5IGNhbGwsIGl0ZXJhdGUgdGhyb3VnaCBlYWNoIG9mIHRoZSBlbGVtZW50cyBpbiBpdHMgc2V0LiAqL1xuXHRcdFx0XHRcdGZvciAodmFyIGogPSAwLCBjYWxsTGVuZ3RoID0gY2FsbC5sZW5ndGg7IGogPCBjYWxsTGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0XHRcdHZhciB0d2VlbnNDb250YWluZXIgPSBjYWxsW2pdLFxuXHRcdFx0XHRcdFx0XHRcdGVsZW1lbnQgPSB0d2VlbnNDb250YWluZXIuZWxlbWVudDtcblxuXHRcdFx0XHRcdFx0LyogQ2hlY2sgdG8gc2VlIGlmIHRoaXMgZWxlbWVudCBoYXMgYmVlbiBkZWxldGVkIG1pZHdheSB0aHJvdWdoIHRoZSBhbmltYXRpb24gYnkgY2hlY2tpbmcgZm9yIHRoZVxuXHRcdFx0XHRcdFx0IGNvbnRpbnVlZCBleGlzdGVuY2Ugb2YgaXRzIGRhdGEgY2FjaGUuIElmIGl0J3MgZ29uZSwgc2tpcCBhbmltYXRpbmcgdGhpcyBlbGVtZW50LiAqL1xuXHRcdFx0XHRcdFx0aWYgKCFEYXRhKGVsZW1lbnQpKSB7XG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHR2YXIgdHJhbnNmb3JtUHJvcGVydHlFeGlzdHMgPSBmYWxzZTtcblxuXHRcdFx0XHRcdFx0LyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0XHRcdFx0XHRcdCBEaXNwbGF5ICYgVmlzaWJpbGl0eSBUb2dnbGluZ1xuXHRcdFx0XHRcdFx0ICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdFx0XHRcdC8qIElmIHRoZSBkaXNwbGF5IG9wdGlvbiBpcyBzZXQgdG8gbm9uLVwibm9uZVwiLCBzZXQgaXQgdXBmcm9udCBzbyB0aGF0IHRoZSBlbGVtZW50IGNhbiBiZWNvbWUgdmlzaWJsZSBiZWZvcmUgdHdlZW5pbmcgYmVnaW5zLlxuXHRcdFx0XHRcdFx0IChPdGhlcndpc2UsIGRpc3BsYXkncyBcIm5vbmVcIiB2YWx1ZSBpcyBzZXQgaW4gY29tcGxldGVDYWxsKCkgb25jZSB0aGUgYW5pbWF0aW9uIGhhcyBjb21wbGV0ZWQuKSAqL1xuXHRcdFx0XHRcdFx0aWYgKG9wdHMuZGlzcGxheSAhPT0gdW5kZWZpbmVkICYmIG9wdHMuZGlzcGxheSAhPT0gbnVsbCAmJiBvcHRzLmRpc3BsYXkgIT09IFwibm9uZVwiKSB7XG5cdFx0XHRcdFx0XHRcdGlmIChvcHRzLmRpc3BsYXkgPT09IFwiZmxleFwiKSB7XG5cdFx0XHRcdFx0XHRcdFx0dmFyIGZsZXhWYWx1ZXMgPSBbXCItd2Via2l0LWJveFwiLCBcIi1tb3otYm94XCIsIFwiLW1zLWZsZXhib3hcIiwgXCItd2Via2l0LWZsZXhcIl07XG5cblx0XHRcdFx0XHRcdFx0XHQkLmVhY2goZmxleFZhbHVlcywgZnVuY3Rpb24oaSwgZmxleFZhbHVlKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImRpc3BsYXlcIiwgZmxleFZhbHVlKTtcblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiZGlzcGxheVwiLCBvcHRzLmRpc3BsYXkpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvKiBTYW1lIGdvZXMgd2l0aCB0aGUgdmlzaWJpbGl0eSBvcHRpb24sIGJ1dCBpdHMgXCJub25lXCIgZXF1aXZhbGVudCBpcyBcImhpZGRlblwiLiAqL1xuXHRcdFx0XHRcdFx0aWYgKG9wdHMudmlzaWJpbGl0eSAhPT0gdW5kZWZpbmVkICYmIG9wdHMudmlzaWJpbGl0eSAhPT0gXCJoaWRkZW5cIikge1xuXHRcdFx0XHRcdFx0XHRDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInZpc2liaWxpdHlcIiwgb3B0cy52aXNpYmlsaXR5KTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0LyoqKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0XHRcdFx0IFByb3BlcnR5IEl0ZXJhdGlvblxuXHRcdFx0XHRcdFx0ICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0XHRcdFx0LyogRm9yIGV2ZXJ5IGVsZW1lbnQsIGl0ZXJhdGUgdGhyb3VnaCBlYWNoIHByb3BlcnR5LiAqL1xuXHRcdFx0XHRcdFx0Zm9yICh2YXIgcHJvcGVydHkgaW4gdHdlZW5zQ29udGFpbmVyKSB7XG5cdFx0XHRcdFx0XHRcdC8qIE5vdGU6IEluIGFkZGl0aW9uIHRvIHByb3BlcnR5IHR3ZWVuIGRhdGEsIHR3ZWVuc0NvbnRhaW5lciBjb250YWlucyBhIHJlZmVyZW5jZSB0byBpdHMgYXNzb2NpYXRlZCBlbGVtZW50LiAqL1xuXHRcdFx0XHRcdFx0XHRpZiAodHdlZW5zQ29udGFpbmVyLmhhc093blByb3BlcnR5KHByb3BlcnR5KSAmJiBwcm9wZXJ0eSAhPT0gXCJlbGVtZW50XCIpIHtcblx0XHRcdFx0XHRcdFx0XHR2YXIgdHdlZW4gPSB0d2VlbnNDb250YWluZXJbcHJvcGVydHldLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjdXJyZW50VmFsdWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8qIEVhc2luZyBjYW4gZWl0aGVyIGJlIGEgcHJlLWdlbmVyZWF0ZWQgZnVuY3Rpb24gb3IgYSBzdHJpbmcgdGhhdCByZWZlcmVuY2VzIGEgcHJlLXJlZ2lzdGVyZWQgZWFzaW5nXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCBvbiB0aGUgVmVsb2NpdHkuRWFzaW5ncyBvYmplY3QuIEluIGVpdGhlciBjYXNlLCByZXR1cm4gdGhlIGFwcHJvcHJpYXRlIGVhc2luZyAqZnVuY3Rpb24qLiAqL1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRlYXNpbmcgPSBUeXBlLmlzU3RyaW5nKHR3ZWVuLmVhc2luZykgPyBWZWxvY2l0eS5FYXNpbmdzW3R3ZWVuLmVhc2luZ10gOiB0d2Vlbi5lYXNpbmc7XG5cblx0XHRcdFx0XHRcdFx0XHQvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdFx0XHRcdFx0XHRcdFx0IEN1cnJlbnQgVmFsdWUgQ2FsY3VsYXRpb25cblx0XHRcdFx0XHRcdFx0XHQgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0XHRcdFx0XHRcdFx0LyogSWYgdGhpcyBpcyB0aGUgbGFzdCB0aWNrIHBhc3MgKGlmIHdlJ3ZlIHJlYWNoZWQgMTAwJSBjb21wbGV0aW9uIGZvciB0aGlzIHR3ZWVuKSxcblx0XHRcdFx0XHRcdFx0XHQgZW5zdXJlIHRoYXQgY3VycmVudFZhbHVlIGlzIGV4cGxpY2l0bHkgc2V0IHRvIGl0cyB0YXJnZXQgZW5kVmFsdWUgc28gdGhhdCBpdCdzIG5vdCBzdWJqZWN0ZWQgdG8gYW55IHJvdW5kaW5nLiAqL1xuXHRcdFx0XHRcdFx0XHRcdGlmIChwZXJjZW50Q29tcGxldGUgPT09IDEpIHtcblx0XHRcdFx0XHRcdFx0XHRcdGN1cnJlbnRWYWx1ZSA9IHR3ZWVuLmVuZFZhbHVlO1xuXHRcdFx0XHRcdFx0XHRcdFx0LyogT3RoZXJ3aXNlLCBjYWxjdWxhdGUgY3VycmVudFZhbHVlIGJhc2VkIG9uIHRoZSBjdXJyZW50IGRlbHRhIGZyb20gc3RhcnRWYWx1ZS4gKi9cblx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0dmFyIHR3ZWVuRGVsdGEgPSB0d2Vlbi5lbmRWYWx1ZSAtIHR3ZWVuLnN0YXJ0VmFsdWU7XG5cdFx0XHRcdFx0XHRcdFx0XHRjdXJyZW50VmFsdWUgPSB0d2Vlbi5zdGFydFZhbHVlICsgKHR3ZWVuRGVsdGEgKiBlYXNpbmcocGVyY2VudENvbXBsZXRlLCBvcHRzLCB0d2VlbkRlbHRhKSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdC8qIElmIG5vIHZhbHVlIGNoYW5nZSBpcyBvY2N1cnJpbmcsIGRvbid0IHByb2NlZWQgd2l0aCBET00gdXBkYXRpbmcuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoIWZpcnN0VGljayAmJiAoY3VycmVudFZhbHVlID09PSB0d2Vlbi5jdXJyZW50VmFsdWUpKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdHR3ZWVuLmN1cnJlbnRWYWx1ZSA9IGN1cnJlbnRWYWx1ZTtcblxuXHRcdFx0XHRcdFx0XHRcdC8qIElmIHdlJ3JlIHR3ZWVuaW5nIGEgZmFrZSAndHdlZW4nIHByb3BlcnR5IGluIG9yZGVyIHRvIGxvZyB0cmFuc2l0aW9uIHZhbHVlcywgdXBkYXRlIHRoZSBvbmUtcGVyLWNhbGwgdmFyaWFibGUgc28gdGhhdFxuXHRcdFx0XHRcdFx0XHRcdCBpdCBjYW4gYmUgcGFzc2VkIGludG8gdGhlIHByb2dyZXNzIGNhbGxiYWNrLiAqL1xuXHRcdFx0XHRcdFx0XHRcdGlmIChwcm9wZXJ0eSA9PT0gXCJ0d2VlblwiKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHR0d2VlbkR1bW15VmFsdWUgPSBjdXJyZW50VmFsdWU7XG5cdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdC8qKioqKioqKioqKioqKioqKipcblx0XHRcdFx0XHRcdFx0XHRcdCBIb29rczogUGFydCBJXG5cdFx0XHRcdFx0XHRcdFx0XHQgKioqKioqKioqKioqKioqKioqL1xuXHRcdFx0XHRcdFx0XHRcdFx0dmFyIGhvb2tSb290O1xuXG5cdFx0XHRcdFx0XHRcdFx0XHQvKiBGb3IgaG9va2VkIHByb3BlcnRpZXMsIHRoZSBuZXdseS11cGRhdGVkIHJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGUgaXMgY2FjaGVkIG9udG8gdGhlIGVsZW1lbnQgc28gdGhhdCBpdCBjYW4gYmUgdXNlZFxuXHRcdFx0XHRcdFx0XHRcdFx0IGZvciBzdWJzZXF1ZW50IGhvb2tzIGluIHRoaXMgY2FsbCB0aGF0IGFyZSBhc3NvY2lhdGVkIHdpdGggdGhlIHNhbWUgcm9vdCBwcm9wZXJ0eS4gSWYgd2UgZGlkbid0IGNhY2hlIHRoZSB1cGRhdGVkXG5cdFx0XHRcdFx0XHRcdFx0XHQgcm9vdFByb3BlcnR5VmFsdWUsIGVhY2ggc3Vic2VxdWVudCB1cGRhdGUgdG8gdGhlIHJvb3QgcHJvcGVydHkgaW4gdGhpcyB0aWNrIHBhc3Mgd291bGQgcmVzZXQgdGhlIHByZXZpb3VzIGhvb2snc1xuXHRcdFx0XHRcdFx0XHRcdFx0IHVwZGF0ZXMgdG8gcm9vdFByb3BlcnR5VmFsdWUgcHJpb3IgdG8gaW5qZWN0aW9uLiBBIG5pY2UgcGVyZm9ybWFuY2UgYnlwcm9kdWN0IG9mIHJvb3RQcm9wZXJ0eVZhbHVlIGNhY2hpbmcgaXMgdGhhdFxuXHRcdFx0XHRcdFx0XHRcdFx0IHN1YnNlcXVlbnRseSBjaGFpbmVkIGFuaW1hdGlvbnMgdXNpbmcgdGhlIHNhbWUgaG9va1Jvb3QgYnV0IGEgZGlmZmVyZW50IGhvb2sgY2FuIHVzZSB0aGlzIGNhY2hlZCByb290UHJvcGVydHlWYWx1ZS4gKi9cblx0XHRcdFx0XHRcdFx0XHRcdGlmIChDU1MuSG9va3MucmVnaXN0ZXJlZFtwcm9wZXJ0eV0pIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0aG9va1Jvb3QgPSBDU1MuSG9va3MuZ2V0Um9vdChwcm9wZXJ0eSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0dmFyIHJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGUgPSBEYXRhKGVsZW1lbnQpLnJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGVbaG9va1Jvb3RdO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChyb290UHJvcGVydHlWYWx1ZUNhY2hlKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dHdlZW4ucm9vdFByb3BlcnR5VmFsdWUgPSByb290UHJvcGVydHlWYWx1ZUNhY2hlO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdC8qKioqKioqKioqKioqKioqKlxuXHRcdFx0XHRcdFx0XHRcdFx0IERPTSBVcGRhdGVcblx0XHRcdFx0XHRcdFx0XHRcdCAqKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0XHRcdFx0XHRcdFx0Lyogc2V0UHJvcGVydHlWYWx1ZSgpIHJldHVybnMgYW4gYXJyYXkgb2YgdGhlIHByb3BlcnR5IG5hbWUgYW5kIHByb3BlcnR5IHZhbHVlIHBvc3QgYW55IG5vcm1hbGl6YXRpb24gdGhhdCBtYXkgaGF2ZSBiZWVuIHBlcmZvcm1lZC4gKi9cblx0XHRcdFx0XHRcdFx0XHRcdC8qIE5vdGU6IFRvIHNvbHZlIGFuIElFPD04IHBvc2l0aW9uaW5nIGJ1ZywgdGhlIHVuaXQgdHlwZSBpcyBkcm9wcGVkIHdoZW4gc2V0dGluZyBhIHByb3BlcnR5IHZhbHVlIG9mIDAuICovXG5cdFx0XHRcdFx0XHRcdFx0XHR2YXIgYWRqdXN0ZWRTZXREYXRhID0gQ1NTLnNldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgLyogU0VUICovXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cHJvcGVydHksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dHdlZW4uY3VycmVudFZhbHVlICsgKHBhcnNlRmxvYXQoY3VycmVudFZhbHVlKSA9PT0gMCA/IFwiXCIgOiB0d2Vlbi51bml0VHlwZSksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dHdlZW4ucm9vdFByb3BlcnR5VmFsdWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dHdlZW4uc2Nyb2xsRGF0YSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdC8qKioqKioqKioqKioqKioqKioqXG5cdFx0XHRcdFx0XHRcdFx0XHQgSG9va3M6IFBhcnQgSUlcblx0XHRcdFx0XHRcdFx0XHRcdCAqKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0XHRcdFx0XHRcdFx0XHQvKiBOb3cgdGhhdCB3ZSBoYXZlIHRoZSBob29rJ3MgdXBkYXRlZCByb290UHJvcGVydHlWYWx1ZSAodGhlIHBvc3QtcHJvY2Vzc2VkIHZhbHVlIHByb3ZpZGVkIGJ5IGFkanVzdGVkU2V0RGF0YSksIGNhY2hlIGl0IG9udG8gdGhlIGVsZW1lbnQuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbcHJvcGVydHldKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8qIFNpbmNlIGFkanVzdGVkU2V0RGF0YSBjb250YWlucyBub3JtYWxpemVkIGRhdGEgcmVhZHkgZm9yIERPTSB1cGRhdGluZywgdGhlIHJvb3RQcm9wZXJ0eVZhbHVlIG5lZWRzIHRvIGJlIHJlLWV4dHJhY3RlZCBmcm9tIGl0cyBub3JtYWxpemVkIGZvcm0uID8/ICovXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtob29rUm9vdF0pIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHREYXRhKGVsZW1lbnQpLnJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGVbaG9va1Jvb3RdID0gQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbaG9va1Jvb3RdKFwiZXh0cmFjdFwiLCBudWxsLCBhZGp1c3RlZFNldERhdGFbMV0pO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdERhdGEoZWxlbWVudCkucm9vdFByb3BlcnR5VmFsdWVDYWNoZVtob29rUm9vdF0gPSBhZGp1c3RlZFNldERhdGFbMV07XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0LyoqKioqKioqKioqKioqKlxuXHRcdFx0XHRcdFx0XHRcdFx0IFRyYW5zZm9ybXNcblx0XHRcdFx0XHRcdFx0XHRcdCAqKioqKioqKioqKioqKiovXG5cblx0XHRcdFx0XHRcdFx0XHRcdC8qIEZsYWcgd2hldGhlciBhIHRyYW5zZm9ybSBwcm9wZXJ0eSBpcyBiZWluZyBhbmltYXRlZCBzbyB0aGF0IGZsdXNoVHJhbnNmb3JtQ2FjaGUoKSBjYW4gYmUgdHJpZ2dlcmVkIG9uY2UgdGhpcyB0aWNrIHBhc3MgaXMgY29tcGxldGUuICovXG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoYWRqdXN0ZWRTZXREYXRhWzBdID09PSBcInRyYW5zZm9ybVwiKSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRyYW5zZm9ybVByb3BlcnR5RXhpc3RzID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvKioqKioqKioqKioqKioqKlxuXHRcdFx0XHRcdFx0IG1vYmlsZUhBXG5cdFx0XHRcdFx0XHQgKioqKioqKioqKioqKioqKi9cblxuXHRcdFx0XHRcdFx0LyogSWYgbW9iaWxlSEEgaXMgZW5hYmxlZCwgc2V0IHRoZSB0cmFuc2xhdGUzZCB0cmFuc2Zvcm0gdG8gbnVsbCB0byBmb3JjZSBoYXJkd2FyZSBhY2NlbGVyYXRpb24uXG5cdFx0XHRcdFx0XHQgSXQncyBzYWZlIHRvIG92ZXJyaWRlIHRoaXMgcHJvcGVydHkgc2luY2UgVmVsb2NpdHkgZG9lc24ndCBhY3R1YWxseSBzdXBwb3J0IGl0cyBhbmltYXRpb24gKGhvb2tzIGFyZSB1c2VkIGluIGl0cyBwbGFjZSkuICovXG5cdFx0XHRcdFx0XHRpZiAob3B0cy5tb2JpbGVIQSkge1xuXHRcdFx0XHRcdFx0XHQvKiBEb24ndCBzZXQgdGhlIG51bGwgdHJhbnNmb3JtIGhhY2sgaWYgd2UndmUgYWxyZWFkeSBkb25lIHNvLiAqL1xuXHRcdFx0XHRcdFx0XHRpZiAoRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZS50cmFuc2xhdGUzZCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0XHRcdFx0LyogQWxsIGVudHJpZXMgb24gdGhlIHRyYW5zZm9ybUNhY2hlIG9iamVjdCBhcmUgbGF0ZXIgY29uY2F0ZW5hdGVkIGludG8gYSBzaW5nbGUgdHJhbnNmb3JtIHN0cmluZyB2aWEgZmx1c2hUcmFuc2Zvcm1DYWNoZSgpLiAqL1xuXHRcdFx0XHRcdFx0XHRcdERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGUudHJhbnNsYXRlM2QgPSBcIigwcHgsIDBweCwgMHB4KVwiO1xuXG5cdFx0XHRcdFx0XHRcdFx0dHJhbnNmb3JtUHJvcGVydHlFeGlzdHMgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmICh0cmFuc2Zvcm1Qcm9wZXJ0eUV4aXN0cykge1xuXHRcdFx0XHRcdFx0XHRDU1MuZmx1c2hUcmFuc2Zvcm1DYWNoZShlbGVtZW50KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvKiBUaGUgbm9uLVwibm9uZVwiIGRpc3BsYXkgdmFsdWUgaXMgb25seSBhcHBsaWVkIHRvIGFuIGVsZW1lbnQgb25jZSAtLSB3aGVuIGl0cyBhc3NvY2lhdGVkIGNhbGwgaXMgZmlyc3QgdGlja2VkIHRocm91Z2guXG5cdFx0XHRcdFx0IEFjY29yZGluZ2x5LCBpdCdzIHNldCB0byBmYWxzZSBzbyB0aGF0IGl0IGlzbid0IHJlLXByb2Nlc3NlZCBieSB0aGlzIGNhbGwgaW4gdGhlIG5leHQgdGljay4gKi9cblx0XHRcdFx0XHRpZiAob3B0cy5kaXNwbGF5ICE9PSB1bmRlZmluZWQgJiYgb3B0cy5kaXNwbGF5ICE9PSBcIm5vbmVcIikge1xuXHRcdFx0XHRcdFx0VmVsb2NpdHkuU3RhdGUuY2FsbHNbaV1bMl0uZGlzcGxheSA9IGZhbHNlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAob3B0cy52aXNpYmlsaXR5ICE9PSB1bmRlZmluZWQgJiYgb3B0cy52aXNpYmlsaXR5ICE9PSBcImhpZGRlblwiKSB7XG5cdFx0XHRcdFx0XHRWZWxvY2l0eS5TdGF0ZS5jYWxsc1tpXVsyXS52aXNpYmlsaXR5ID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0LyogUGFzcyB0aGUgZWxlbWVudHMgYW5kIHRoZSB0aW1pbmcgZGF0YSAocGVyY2VudENvbXBsZXRlLCBtc1JlbWFpbmluZywgdGltZVN0YXJ0LCB0d2VlbkR1bW15VmFsdWUpIGludG8gdGhlIHByb2dyZXNzIGNhbGxiYWNrLiAqL1xuXHRcdFx0XHRcdGlmIChvcHRzLnByb2dyZXNzKSB7XG5cdFx0XHRcdFx0XHRvcHRzLnByb2dyZXNzLmNhbGwoY2FsbENvbnRhaW5lclsxXSxcblx0XHRcdFx0XHRcdFx0XHRjYWxsQ29udGFpbmVyWzFdLFxuXHRcdFx0XHRcdFx0XHRcdHBlcmNlbnRDb21wbGV0ZSxcblx0XHRcdFx0XHRcdFx0XHRNYXRoLm1heCgwLCAodGltZVN0YXJ0ICsgb3B0cy5kdXJhdGlvbikgLSB0aW1lQ3VycmVudCksXG5cdFx0XHRcdFx0XHRcdFx0dGltZVN0YXJ0LFxuXHRcdFx0XHRcdFx0XHRcdHR3ZWVuRHVtbXlWYWx1ZSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0LyogSWYgdGhpcyBjYWxsIGhhcyBmaW5pc2hlZCB0d2VlbmluZywgcGFzcyBpdHMgaW5kZXggdG8gY29tcGxldGVDYWxsKCkgdG8gaGFuZGxlIGNhbGwgY2xlYW51cC4gKi9cblx0XHRcdFx0XHRpZiAocGVyY2VudENvbXBsZXRlID09PSAxKSB7XG5cdFx0XHRcdFx0XHRjb21wbGV0ZUNhbGwoaSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8qIE5vdGU6IGNvbXBsZXRlQ2FsbCgpIHNldHMgdGhlIGlzVGlja2luZyBmbGFnIHRvIGZhbHNlIHdoZW4gdGhlIGxhc3QgY2FsbCBvbiBWZWxvY2l0eS5TdGF0ZS5jYWxscyBoYXMgY29tcGxldGVkLiAqL1xuXHRcdFx0aWYgKFZlbG9jaXR5LlN0YXRlLmlzVGlja2luZykge1xuXHRcdFx0XHR0aWNrZXIodGljayk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0LyoqKioqKioqKioqKioqKioqKioqKipcblx0XHQgQ2FsbCBDb21wbGV0aW9uXG5cdFx0ICoqKioqKioqKioqKioqKioqKioqKiovXG5cblx0XHQvKiBOb3RlOiBVbmxpa2UgdGljaygpLCB3aGljaCBwcm9jZXNzZXMgYWxsIGFjdGl2ZSBjYWxscyBhdCBvbmNlLCBjYWxsIGNvbXBsZXRpb24gaXMgaGFuZGxlZCBvbiBhIHBlci1jYWxsIGJhc2lzLiAqL1xuXHRcdGZ1bmN0aW9uIGNvbXBsZXRlQ2FsbChjYWxsSW5kZXgsIGlzU3RvcHBlZCkge1xuXHRcdFx0LyogRW5zdXJlIHRoZSBjYWxsIGV4aXN0cy4gKi9cblx0XHRcdGlmICghVmVsb2NpdHkuU3RhdGUuY2FsbHNbY2FsbEluZGV4XSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdC8qIFB1bGwgdGhlIG1ldGFkYXRhIGZyb20gdGhlIGNhbGwuICovXG5cdFx0XHR2YXIgY2FsbCA9IFZlbG9jaXR5LlN0YXRlLmNhbGxzW2NhbGxJbmRleF1bMF0sXG5cdFx0XHRcdFx0ZWxlbWVudHMgPSBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tjYWxsSW5kZXhdWzFdLFxuXHRcdFx0XHRcdG9wdHMgPSBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tjYWxsSW5kZXhdWzJdLFxuXHRcdFx0XHRcdHJlc29sdmVyID0gVmVsb2NpdHkuU3RhdGUuY2FsbHNbY2FsbEluZGV4XVs0XTtcblxuXHRcdFx0dmFyIHJlbWFpbmluZ0NhbGxzRXhpc3QgPSBmYWxzZTtcblxuXHRcdFx0LyoqKioqKioqKioqKioqKioqKioqKioqKipcblx0XHRcdCBFbGVtZW50IEZpbmFsaXphdGlvblxuXHRcdFx0ICoqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdGZvciAodmFyIGkgPSAwLCBjYWxsTGVuZ3RoID0gY2FsbC5sZW5ndGg7IGkgPCBjYWxsTGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0dmFyIGVsZW1lbnQgPSBjYWxsW2ldLmVsZW1lbnQ7XG5cblx0XHRcdFx0LyogSWYgdGhlIHVzZXIgc2V0IGRpc3BsYXkgdG8gXCJub25lXCIgKGludGVuZGluZyB0byBoaWRlIHRoZSBlbGVtZW50KSwgc2V0IGl0IG5vdyB0aGF0IHRoZSBhbmltYXRpb24gaGFzIGNvbXBsZXRlZC4gKi9cblx0XHRcdFx0LyogTm90ZTogZGlzcGxheTpub25lIGlzbid0IHNldCB3aGVuIGNhbGxzIGFyZSBtYW51YWxseSBzdG9wcGVkICh2aWEgVmVsb2NpdHkoXCJzdG9wXCIpLiAqL1xuXHRcdFx0XHQvKiBOb3RlOiBEaXNwbGF5IGdldHMgaWdub3JlZCB3aXRoIFwicmV2ZXJzZVwiIGNhbGxzIGFuZCBpbmZpbml0ZSBsb29wcywgc2luY2UgdGhpcyBiZWhhdmlvciB3b3VsZCBiZSB1bmRlc2lyYWJsZS4gKi9cblx0XHRcdFx0aWYgKCFpc1N0b3BwZWQgJiYgIW9wdHMubG9vcCkge1xuXHRcdFx0XHRcdGlmIChvcHRzLmRpc3BsYXkgPT09IFwibm9uZVwiKSB7XG5cdFx0XHRcdFx0XHRDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImRpc3BsYXlcIiwgb3B0cy5kaXNwbGF5KTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAob3B0cy52aXNpYmlsaXR5ID09PSBcImhpZGRlblwiKSB7XG5cdFx0XHRcdFx0XHRDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInZpc2liaWxpdHlcIiwgb3B0cy52aXNpYmlsaXR5KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvKiBJZiB0aGUgZWxlbWVudCdzIHF1ZXVlIGlzIGVtcHR5IChpZiBvbmx5IHRoZSBcImlucHJvZ3Jlc3NcIiBpdGVtIGlzIGxlZnQgYXQgcG9zaXRpb24gMCkgb3IgaWYgaXRzIHF1ZXVlIGlzIGFib3V0IHRvIHJ1blxuXHRcdFx0XHQgYSBub24tVmVsb2NpdHktaW5pdGlhdGVkIGVudHJ5LCB0dXJuIG9mZiB0aGUgaXNBbmltYXRpbmcgZmxhZy4gQSBub24tVmVsb2NpdHktaW5pdGlhdGllZCBxdWV1ZSBlbnRyeSdzIGxvZ2ljIG1pZ2h0IGFsdGVyXG5cdFx0XHRcdCBhbiBlbGVtZW50J3MgQ1NTIHZhbHVlcyBhbmQgdGhlcmVieSBjYXVzZSBWZWxvY2l0eSdzIGNhY2hlZCB2YWx1ZSBkYXRhIHRvIGdvIHN0YWxlLiBUbyBkZXRlY3QgaWYgYSBxdWV1ZSBlbnRyeSB3YXMgaW5pdGlhdGVkIGJ5IFZlbG9jaXR5LFxuXHRcdFx0XHQgd2UgY2hlY2sgZm9yIHRoZSBleGlzdGVuY2Ugb2Ygb3VyIHNwZWNpYWwgVmVsb2NpdHkucXVldWVFbnRyeUZsYWcgZGVjbGFyYXRpb24sIHdoaWNoIG1pbmlmaWVycyB3b24ndCByZW5hbWUgc2luY2UgdGhlIGZsYWdcblx0XHRcdFx0IGlzIGFzc2lnbmVkIHRvIGpRdWVyeSdzIGdsb2JhbCAkIG9iamVjdCBhbmQgdGh1cyBleGlzdHMgb3V0IG9mIFZlbG9jaXR5J3Mgb3duIHNjb3BlLiAqL1xuXHRcdFx0XHR2YXIgZGF0YSA9IERhdGEoZWxlbWVudCk7XG5cblx0XHRcdFx0aWYgKG9wdHMubG9vcCAhPT0gdHJ1ZSAmJiAoJC5xdWV1ZShlbGVtZW50KVsxXSA9PT0gdW5kZWZpbmVkIHx8ICEvXFwudmVsb2NpdHlRdWV1ZUVudHJ5RmxhZy9pLnRlc3QoJC5xdWV1ZShlbGVtZW50KVsxXSkpKSB7XG5cdFx0XHRcdFx0LyogVGhlIGVsZW1lbnQgbWF5IGhhdmUgYmVlbiBkZWxldGVkLiBFbnN1cmUgdGhhdCBpdHMgZGF0YSBjYWNoZSBzdGlsbCBleGlzdHMgYmVmb3JlIGFjdGluZyBvbiBpdC4gKi9cblx0XHRcdFx0XHRpZiAoZGF0YSkge1xuXHRcdFx0XHRcdFx0ZGF0YS5pc0FuaW1hdGluZyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0LyogQ2xlYXIgdGhlIGVsZW1lbnQncyByb290UHJvcGVydHlWYWx1ZUNhY2hlLCB3aGljaCB3aWxsIGJlY29tZSBzdGFsZS4gKi9cblx0XHRcdFx0XHRcdGRhdGEucm9vdFByb3BlcnR5VmFsdWVDYWNoZSA9IHt9O1xuXG5cdFx0XHRcdFx0XHR2YXIgdHJhbnNmb3JtSEFQcm9wZXJ0eUV4aXN0cyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0LyogSWYgYW55IDNEIHRyYW5zZm9ybSBzdWJwcm9wZXJ0eSBpcyBhdCBpdHMgZGVmYXVsdCB2YWx1ZSAocmVnYXJkbGVzcyBvZiB1bml0IHR5cGUpLCByZW1vdmUgaXQuICovXG5cdFx0XHRcdFx0XHQkLmVhY2goQ1NTLkxpc3RzLnRyYW5zZm9ybXMzRCwgZnVuY3Rpb24oaSwgdHJhbnNmb3JtTmFtZSkge1xuXHRcdFx0XHRcdFx0XHR2YXIgZGVmYXVsdFZhbHVlID0gL15zY2FsZS8udGVzdCh0cmFuc2Zvcm1OYW1lKSA/IDEgOiAwLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y3VycmVudFZhbHVlID0gZGF0YS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXTtcblxuXHRcdFx0XHRcdFx0XHRpZiAoZGF0YS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXSAhPT0gdW5kZWZpbmVkICYmIG5ldyBSZWdFeHAoXCJeXFxcXChcIiArIGRlZmF1bHRWYWx1ZSArIFwiW14uXVwiKS50ZXN0KGN1cnJlbnRWYWx1ZSkpIHtcblx0XHRcdFx0XHRcdFx0XHR0cmFuc2Zvcm1IQVByb3BlcnR5RXhpc3RzID0gdHJ1ZTtcblxuXHRcdFx0XHRcdFx0XHRcdGRlbGV0ZSBkYXRhLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0LyogTW9iaWxlIGRldmljZXMgaGF2ZSBoYXJkd2FyZSBhY2NlbGVyYXRpb24gcmVtb3ZlZCBhdCB0aGUgZW5kIG9mIHRoZSBhbmltYXRpb24gaW4gb3JkZXIgdG8gYXZvaWQgaG9nZ2luZyB0aGUgR1BVJ3MgbWVtb3J5LiAqL1xuXHRcdFx0XHRcdFx0aWYgKG9wdHMubW9iaWxlSEEpIHtcblx0XHRcdFx0XHRcdFx0dHJhbnNmb3JtSEFQcm9wZXJ0eUV4aXN0cyA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdGRlbGV0ZSBkYXRhLnRyYW5zZm9ybUNhY2hlLnRyYW5zbGF0ZTNkO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvKiBGbHVzaCB0aGUgc3VicHJvcGVydHkgcmVtb3ZhbHMgdG8gdGhlIERPTS4gKi9cblx0XHRcdFx0XHRcdGlmICh0cmFuc2Zvcm1IQVByb3BlcnR5RXhpc3RzKSB7XG5cdFx0XHRcdFx0XHRcdENTUy5mbHVzaFRyYW5zZm9ybUNhY2hlKGVsZW1lbnQpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvKiBSZW1vdmUgdGhlIFwidmVsb2NpdHktYW5pbWF0aW5nXCIgaW5kaWNhdG9yIGNsYXNzLiAqL1xuXHRcdFx0XHRcdFx0Q1NTLlZhbHVlcy5yZW1vdmVDbGFzcyhlbGVtZW50LCBcInZlbG9jaXR5LWFuaW1hdGluZ1wiKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvKioqKioqKioqKioqKioqKioqKioqXG5cdFx0XHRcdCBPcHRpb246IENvbXBsZXRlXG5cdFx0XHRcdCAqKioqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdFx0LyogQ29tcGxldGUgaXMgZmlyZWQgb25jZSBwZXIgY2FsbCAobm90IG9uY2UgcGVyIGVsZW1lbnQpIGFuZCBpcyBwYXNzZWQgdGhlIGZ1bGwgcmF3IERPTSBlbGVtZW50IHNldCBhcyBib3RoIGl0cyBjb250ZXh0IGFuZCBpdHMgZmlyc3QgYXJndW1lbnQuICovXG5cdFx0XHRcdC8qIE5vdGU6IENhbGxiYWNrcyBhcmVuJ3QgZmlyZWQgd2hlbiBjYWxscyBhcmUgbWFudWFsbHkgc3RvcHBlZCAodmlhIFZlbG9jaXR5KFwic3RvcFwiKS4gKi9cblx0XHRcdFx0aWYgKCFpc1N0b3BwZWQgJiYgb3B0cy5jb21wbGV0ZSAmJiAhb3B0cy5sb29wICYmIChpID09PSBjYWxsTGVuZ3RoIC0gMSkpIHtcblx0XHRcdFx0XHQvKiBXZSB0aHJvdyBjYWxsYmFja3MgaW4gYSBzZXRUaW1lb3V0IHNvIHRoYXQgdGhyb3duIGVycm9ycyBkb24ndCBoYWx0IHRoZSBleGVjdXRpb24gb2YgVmVsb2NpdHkgaXRzZWxmLiAqL1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHRvcHRzLmNvbXBsZXRlLmNhbGwoZWxlbWVudHMsIGVsZW1lbnRzKTtcblx0XHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0XHRcdFx0XHR9LCAxKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0XHQgUHJvbWlzZSBSZXNvbHZpbmdcblx0XHRcdFx0ICoqKioqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdFx0LyogTm90ZTogSW5maW5pdGUgbG9vcHMgZG9uJ3QgcmV0dXJuIHByb21pc2VzLiAqL1xuXHRcdFx0XHRpZiAocmVzb2x2ZXIgJiYgb3B0cy5sb29wICE9PSB0cnVlKSB7XG5cdFx0XHRcdFx0cmVzb2x2ZXIoZWxlbWVudHMpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0LyoqKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0XHRcdFx0IE9wdGlvbjogTG9vcCAoSW5maW5pdGUpXG5cdFx0XHRcdCAqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0XHRcdGlmIChkYXRhICYmIG9wdHMubG9vcCA9PT0gdHJ1ZSAmJiAhaXNTdG9wcGVkKSB7XG5cdFx0XHRcdFx0LyogSWYgYSByb3RhdGVYL1kvWiBwcm9wZXJ0eSBpcyBiZWluZyBhbmltYXRlZCBieSAzNjAgZGVnIHdpdGggbG9vcDp0cnVlLCBzd2FwIHR3ZWVuIHN0YXJ0L2VuZCB2YWx1ZXMgdG8gZW5hYmxlXG5cdFx0XHRcdFx0IGNvbnRpbnVvdXMgaXRlcmF0aXZlIHJvdGF0aW9uIGxvb3BpbmcuIChPdGhlcmlzZSwgdGhlIGVsZW1lbnQgd291bGQganVzdCByb3RhdGUgYmFjayBhbmQgZm9ydGguKSAqL1xuXHRcdFx0XHRcdCQuZWFjaChkYXRhLnR3ZWVuc0NvbnRhaW5lciwgZnVuY3Rpb24ocHJvcGVydHlOYW1lLCB0d2VlbkNvbnRhaW5lcikge1xuXHRcdFx0XHRcdFx0aWYgKC9ecm90YXRlLy50ZXN0KHByb3BlcnR5TmFtZSkgJiYgKChwYXJzZUZsb2F0KHR3ZWVuQ29udGFpbmVyLnN0YXJ0VmFsdWUpIC0gcGFyc2VGbG9hdCh0d2VlbkNvbnRhaW5lci5lbmRWYWx1ZSkpICUgMzYwID09PSAwKSkge1xuXHRcdFx0XHRcdFx0XHR2YXIgb2xkU3RhcnRWYWx1ZSA9IHR3ZWVuQ29udGFpbmVyLnN0YXJ0VmFsdWU7XG5cblx0XHRcdFx0XHRcdFx0dHdlZW5Db250YWluZXIuc3RhcnRWYWx1ZSA9IHR3ZWVuQ29udGFpbmVyLmVuZFZhbHVlO1xuXHRcdFx0XHRcdFx0XHR0d2VlbkNvbnRhaW5lci5lbmRWYWx1ZSA9IG9sZFN0YXJ0VmFsdWU7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmICgvXmJhY2tncm91bmRQb3NpdGlvbi8udGVzdChwcm9wZXJ0eU5hbWUpICYmIHBhcnNlRmxvYXQodHdlZW5Db250YWluZXIuZW5kVmFsdWUpID09PSAxMDAgJiYgdHdlZW5Db250YWluZXIudW5pdFR5cGUgPT09IFwiJVwiKSB7XG5cdFx0XHRcdFx0XHRcdHR3ZWVuQ29udGFpbmVyLmVuZFZhbHVlID0gMDtcblx0XHRcdFx0XHRcdFx0dHdlZW5Db250YWluZXIuc3RhcnRWYWx1ZSA9IDEwMDtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFZlbG9jaXR5KGVsZW1lbnQsIFwicmV2ZXJzZVwiLCB7bG9vcDogdHJ1ZSwgZGVsYXk6IG9wdHMuZGVsYXl9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8qKioqKioqKioqKioqKipcblx0XHRcdFx0IERlcXVldWVpbmdcblx0XHRcdFx0ICoqKioqKioqKioqKioqKi9cblxuXHRcdFx0XHQvKiBGaXJlIHRoZSBuZXh0IGNhbGwgaW4gdGhlIHF1ZXVlIHNvIGxvbmcgYXMgdGhpcyBjYWxsJ3MgcXVldWUgd2Fzbid0IHNldCB0byBmYWxzZSAodG8gdHJpZ2dlciBhIHBhcmFsbGVsIGFuaW1hdGlvbiksXG5cdFx0XHRcdCB3aGljaCB3b3VsZCBoYXZlIGFscmVhZHkgY2F1c2VkIHRoZSBuZXh0IGNhbGwgdG8gZmlyZS4gTm90ZTogRXZlbiBpZiB0aGUgZW5kIG9mIHRoZSBhbmltYXRpb24gcXVldWUgaGFzIGJlZW4gcmVhY2hlZCxcblx0XHRcdFx0ICQuZGVxdWV1ZSgpIG11c3Qgc3RpbGwgYmUgY2FsbGVkIGluIG9yZGVyIHRvIGNvbXBsZXRlbHkgY2xlYXIgalF1ZXJ5J3MgYW5pbWF0aW9uIHF1ZXVlLiAqL1xuXHRcdFx0XHRpZiAob3B0cy5xdWV1ZSAhPT0gZmFsc2UpIHtcblx0XHRcdFx0XHQkLmRlcXVldWUoZWxlbWVudCwgb3B0cy5xdWV1ZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0LyoqKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdFx0IENhbGxzIEFycmF5IENsZWFudXBcblx0XHRcdCAqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0XHRcdC8qIFNpbmNlIHRoaXMgY2FsbCBpcyBjb21wbGV0ZSwgc2V0IGl0IHRvIGZhbHNlIHNvIHRoYXQgdGhlIHJBRiB0aWNrIHNraXBzIGl0LiBUaGlzIGFycmF5IGlzIGxhdGVyIGNvbXBhY3RlZCB2aWEgY29tcGFjdFNwYXJzZUFycmF5KCkuXG5cdFx0XHQgKEZvciBwZXJmb3JtYW5jZSByZWFzb25zLCB0aGUgY2FsbCBpcyBzZXQgdG8gZmFsc2UgaW5zdGVhZCBvZiBiZWluZyBkZWxldGVkIGZyb20gdGhlIGFycmF5OiBodHRwOi8vd3d3Lmh0bWw1cm9ja3MuY29tL2VuL3R1dG9yaWFscy9zcGVlZC92OC8pICovXG5cdFx0XHRWZWxvY2l0eS5TdGF0ZS5jYWxsc1tjYWxsSW5kZXhdID0gZmFsc2U7XG5cblx0XHRcdC8qIEl0ZXJhdGUgdGhyb3VnaCB0aGUgY2FsbHMgYXJyYXkgdG8gZGV0ZXJtaW5lIGlmIHRoaXMgd2FzIHRoZSBmaW5hbCBpbi1wcm9ncmVzcyBhbmltYXRpb24uXG5cdFx0XHQgSWYgc28sIHNldCBhIGZsYWcgdG8gZW5kIHRpY2tpbmcgYW5kIGNsZWFyIHRoZSBjYWxscyBhcnJheS4gKi9cblx0XHRcdGZvciAodmFyIGogPSAwLCBjYWxsc0xlbmd0aCA9IFZlbG9jaXR5LlN0YXRlLmNhbGxzLmxlbmd0aDsgaiA8IGNhbGxzTGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0aWYgKFZlbG9jaXR5LlN0YXRlLmNhbGxzW2pdICE9PSBmYWxzZSkge1xuXHRcdFx0XHRcdHJlbWFpbmluZ0NhbGxzRXhpc3QgPSB0cnVlO1xuXG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKHJlbWFpbmluZ0NhbGxzRXhpc3QgPT09IGZhbHNlKSB7XG5cdFx0XHRcdC8qIHRpY2soKSB3aWxsIGRldGVjdCB0aGlzIGZsYWcgdXBvbiBpdHMgbmV4dCBpdGVyYXRpb24gYW5kIHN1YnNlcXVlbnRseSB0dXJuIGl0c2VsZiBvZmYuICovXG5cdFx0XHRcdFZlbG9jaXR5LlN0YXRlLmlzVGlja2luZyA9IGZhbHNlO1xuXG5cdFx0XHRcdC8qIENsZWFyIHRoZSBjYWxscyBhcnJheSBzbyB0aGF0IGl0cyBsZW5ndGggaXMgcmVzZXQuICovXG5cdFx0XHRcdGRlbGV0ZSBWZWxvY2l0eS5TdGF0ZS5jYWxscztcblx0XHRcdFx0VmVsb2NpdHkuU3RhdGUuY2FsbHMgPSBbXTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvKioqKioqKioqKioqKioqKioqXG5cdFx0IEZyYW1ld29ya3Ncblx0XHQgKioqKioqKioqKioqKioqKioqL1xuXG5cdFx0LyogQm90aCBqUXVlcnkgYW5kIFplcHRvIGFsbG93IHRoZWlyICQuZm4gb2JqZWN0IHRvIGJlIGV4dGVuZGVkIHRvIGFsbG93IHdyYXBwZWQgZWxlbWVudHMgdG8gYmUgc3ViamVjdGVkIHRvIHBsdWdpbiBjYWxscy5cblx0XHQgSWYgZWl0aGVyIGZyYW1ld29yayBpcyBsb2FkZWQsIHJlZ2lzdGVyIGEgXCJ2ZWxvY2l0eVwiIGV4dGVuc2lvbiBwb2ludGluZyB0byBWZWxvY2l0eSdzIGNvcmUgYW5pbWF0ZSgpIG1ldGhvZC4gIFZlbG9jaXR5XG5cdFx0IGFsc28gcmVnaXN0ZXJzIGl0c2VsZiBvbnRvIGEgZ2xvYmFsIGNvbnRhaW5lciAod2luZG93LmpRdWVyeSB8fCB3aW5kb3cuWmVwdG8gfHwgd2luZG93KSBzbyB0aGF0IGNlcnRhaW4gZmVhdHVyZXMgYXJlXG5cdFx0IGFjY2Vzc2libGUgYmV5b25kIGp1c3QgYSBwZXItZWxlbWVudCBzY29wZS4gVGhpcyBtYXN0ZXIgb2JqZWN0IGNvbnRhaW5zIGFuIC5hbmltYXRlKCkgbWV0aG9kLCB3aGljaCBpcyBsYXRlciBhc3NpZ25lZCB0byAkLmZuXG5cdFx0IChpZiBqUXVlcnkgb3IgWmVwdG8gYXJlIHByZXNlbnQpLiBBY2NvcmRpbmdseSwgVmVsb2NpdHkgY2FuIGJvdGggYWN0IG9uIHdyYXBwZWQgRE9NIGVsZW1lbnRzIGFuZCBzdGFuZCBhbG9uZSBmb3IgdGFyZ2V0aW5nIHJhdyBET00gZWxlbWVudHMuICovXG5cdFx0Z2xvYmFsLlZlbG9jaXR5ID0gVmVsb2NpdHk7XG5cblx0XHRpZiAoZ2xvYmFsICE9PSB3aW5kb3cpIHtcblx0XHRcdC8qIEFzc2lnbiB0aGUgZWxlbWVudCBmdW5jdGlvbiB0byBWZWxvY2l0eSdzIGNvcmUgYW5pbWF0ZSgpIG1ldGhvZC4gKi9cblx0XHRcdGdsb2JhbC5mbi52ZWxvY2l0eSA9IGFuaW1hdGU7XG5cdFx0XHQvKiBBc3NpZ24gdGhlIG9iamVjdCBmdW5jdGlvbidzIGRlZmF1bHRzIHRvIFZlbG9jaXR5J3MgZ2xvYmFsIGRlZmF1bHRzIG9iamVjdC4gKi9cblx0XHRcdGdsb2JhbC5mbi52ZWxvY2l0eS5kZWZhdWx0cyA9IFZlbG9jaXR5LmRlZmF1bHRzO1xuXHRcdH1cblxuXHRcdC8qKioqKioqKioqKioqKioqKioqKioqKlxuXHRcdCBQYWNrYWdlZCBSZWRpcmVjdHNcblx0XHQgKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0XHQvKiBzbGlkZVVwLCBzbGlkZURvd24gKi9cblx0XHQkLmVhY2goW1wiRG93blwiLCBcIlVwXCJdLCBmdW5jdGlvbihpLCBkaXJlY3Rpb24pIHtcblx0XHRcdFZlbG9jaXR5LlJlZGlyZWN0c1tcInNsaWRlXCIgKyBkaXJlY3Rpb25dID0gZnVuY3Rpb24oZWxlbWVudCwgb3B0aW9ucywgZWxlbWVudHNJbmRleCwgZWxlbWVudHNTaXplLCBlbGVtZW50cywgcHJvbWlzZURhdGEpIHtcblx0XHRcdFx0dmFyIG9wdHMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucyksXG5cdFx0XHRcdFx0XHRiZWdpbiA9IG9wdHMuYmVnaW4sXG5cdFx0XHRcdFx0XHRjb21wbGV0ZSA9IG9wdHMuY29tcGxldGUsXG5cdFx0XHRcdFx0XHRjb21wdXRlZFZhbHVlcyA9IHtoZWlnaHQ6IFwiXCIsIG1hcmdpblRvcDogXCJcIiwgbWFyZ2luQm90dG9tOiBcIlwiLCBwYWRkaW5nVG9wOiBcIlwiLCBwYWRkaW5nQm90dG9tOiBcIlwifSxcblx0XHRcdFx0aW5saW5lVmFsdWVzID0ge307XG5cblx0XHRcdFx0aWYgKG9wdHMuZGlzcGxheSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0LyogU2hvdyB0aGUgZWxlbWVudCBiZWZvcmUgc2xpZGVEb3duIGJlZ2lucyBhbmQgaGlkZSB0aGUgZWxlbWVudCBhZnRlciBzbGlkZVVwIGNvbXBsZXRlcy4gKi9cblx0XHRcdFx0XHQvKiBOb3RlOiBJbmxpbmUgZWxlbWVudHMgY2Fubm90IGhhdmUgZGltZW5zaW9ucyBhbmltYXRlZCwgc28gdGhleSdyZSByZXZlcnRlZCB0byBpbmxpbmUtYmxvY2suICovXG5cdFx0XHRcdFx0b3B0cy5kaXNwbGF5ID0gKGRpcmVjdGlvbiA9PT0gXCJEb3duXCIgPyAoVmVsb2NpdHkuQ1NTLlZhbHVlcy5nZXREaXNwbGF5VHlwZShlbGVtZW50KSA9PT0gXCJpbmxpbmVcIiA/IFwiaW5saW5lLWJsb2NrXCIgOiBcImJsb2NrXCIpIDogXCJub25lXCIpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0b3B0cy5iZWdpbiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdC8qIElmIHRoZSB1c2VyIHBhc3NlZCBpbiBhIGJlZ2luIGNhbGxiYWNrLCBmaXJlIGl0IG5vdy4gKi9cblx0XHRcdFx0XHRpZiAoYmVnaW4pIHtcblx0XHRcdFx0XHRcdGJlZ2luLmNhbGwoZWxlbWVudHMsIGVsZW1lbnRzKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvKiBDYWNoZSB0aGUgZWxlbWVudHMnIG9yaWdpbmFsIHZlcnRpY2FsIGRpbWVuc2lvbmFsIHByb3BlcnR5IHZhbHVlcyBzbyB0aGF0IHdlIGNhbiBhbmltYXRlIGJhY2sgdG8gdGhlbS4gKi9cblx0XHRcdFx0XHRmb3IgKHZhciBwcm9wZXJ0eSBpbiBjb21wdXRlZFZhbHVlcykge1xuXHRcdFx0XHRcdFx0aWYgKCFjb21wdXRlZFZhbHVlcy5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSkpIHtcblx0XHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRpbmxpbmVWYWx1ZXNbcHJvcGVydHldID0gZWxlbWVudC5zdHlsZVtwcm9wZXJ0eV07XG5cblx0XHRcdFx0XHRcdC8qIEZvciBzbGlkZURvd24sIHVzZSBmb3JjZWZlZWRpbmcgdG8gYW5pbWF0ZSBhbGwgdmVydGljYWwgcHJvcGVydGllcyBmcm9tIDAuIEZvciBzbGlkZVVwLFxuXHRcdFx0XHRcdFx0IHVzZSBmb3JjZWZlZWRpbmcgdG8gc3RhcnQgZnJvbSBjb21wdXRlZCB2YWx1ZXMgYW5kIGFuaW1hdGUgZG93biB0byAwLiAqL1xuXHRcdFx0XHRcdFx0dmFyIHByb3BlcnR5VmFsdWUgPSBWZWxvY2l0eS5DU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBwcm9wZXJ0eSk7XG5cdFx0XHRcdFx0XHRjb21wdXRlZFZhbHVlc1twcm9wZXJ0eV0gPSAoZGlyZWN0aW9uID09PSBcIkRvd25cIikgPyBbcHJvcGVydHlWYWx1ZSwgMF0gOiBbMCwgcHJvcGVydHlWYWx1ZV07XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0LyogRm9yY2UgdmVydGljYWwgb3ZlcmZsb3cgY29udGVudCB0byBjbGlwIHNvIHRoYXQgc2xpZGluZyB3b3JrcyBhcyBleHBlY3RlZC4gKi9cblx0XHRcdFx0XHRpbmxpbmVWYWx1ZXMub3ZlcmZsb3cgPSBlbGVtZW50LnN0eWxlLm92ZXJmbG93O1xuXHRcdFx0XHRcdGVsZW1lbnQuc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdG9wdHMuY29tcGxldGUgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQvKiBSZXNldCBlbGVtZW50IHRvIGl0cyBwcmUtc2xpZGUgaW5saW5lIHZhbHVlcyBvbmNlIGl0cyBzbGlkZSBhbmltYXRpb24gaXMgY29tcGxldGUuICovXG5cdFx0XHRcdFx0Zm9yICh2YXIgcHJvcGVydHkgaW4gaW5saW5lVmFsdWVzKSB7XG5cdFx0XHRcdFx0XHRpZiAoaW5saW5lVmFsdWVzLmhhc093blByb3BlcnR5KHByb3BlcnR5KSkge1xuXHRcdFx0XHRcdFx0XHRlbGVtZW50LnN0eWxlW3Byb3BlcnR5XSA9IGlubGluZVZhbHVlc1twcm9wZXJ0eV07XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0LyogSWYgdGhlIHVzZXIgcGFzc2VkIGluIGEgY29tcGxldGUgY2FsbGJhY2ssIGZpcmUgaXQgbm93LiAqL1xuXHRcdFx0XHRcdGlmIChjb21wbGV0ZSkge1xuXHRcdFx0XHRcdFx0Y29tcGxldGUuY2FsbChlbGVtZW50cywgZWxlbWVudHMpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAocHJvbWlzZURhdGEpIHtcblx0XHRcdFx0XHRcdHByb21pc2VEYXRhLnJlc29sdmVyKGVsZW1lbnRzKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0VmVsb2NpdHkoZWxlbWVudCwgY29tcHV0ZWRWYWx1ZXMsIG9wdHMpO1xuXHRcdFx0fTtcblx0XHR9KTtcblxuXHRcdC8qIGZhZGVJbiwgZmFkZU91dCAqL1xuXHRcdCQuZWFjaChbXCJJblwiLCBcIk91dFwiXSwgZnVuY3Rpb24oaSwgZGlyZWN0aW9uKSB7XG5cdFx0XHRWZWxvY2l0eS5SZWRpcmVjdHNbXCJmYWRlXCIgKyBkaXJlY3Rpb25dID0gZnVuY3Rpb24oZWxlbWVudCwgb3B0aW9ucywgZWxlbWVudHNJbmRleCwgZWxlbWVudHNTaXplLCBlbGVtZW50cywgcHJvbWlzZURhdGEpIHtcblx0XHRcdFx0dmFyIG9wdHMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucyksXG5cdFx0XHRcdFx0XHRvcmlnaW5hbENvbXBsZXRlID0gb3B0cy5jb21wbGV0ZSxcblx0XHRcdFx0XHRcdHByb3BlcnRpZXNNYXAgPSB7b3BhY2l0eTogKGRpcmVjdGlvbiA9PT0gXCJJblwiKSA/IDEgOiAwfTtcblxuXHRcdFx0XHQvKiBTaW5jZSByZWRpcmVjdHMgYXJlIHRyaWdnZXJlZCBpbmRpdmlkdWFsbHkgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgYW5pbWF0ZWQgc2V0LCBhdm9pZCByZXBlYXRlZGx5IHRyaWdnZXJpbmdcblx0XHRcdFx0IGNhbGxiYWNrcyBieSBmaXJpbmcgdGhlbSBvbmx5IHdoZW4gdGhlIGZpbmFsIGVsZW1lbnQgaGFzIGJlZW4gcmVhY2hlZC4gKi9cblx0XHRcdFx0aWYgKGVsZW1lbnRzSW5kZXggIT09IGVsZW1lbnRzU2l6ZSAtIDEpIHtcblx0XHRcdFx0XHRvcHRzLmNvbXBsZXRlID0gb3B0cy5iZWdpbiA9IG51bGw7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0b3B0cy5jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0aWYgKG9yaWdpbmFsQ29tcGxldGUpIHtcblx0XHRcdFx0XHRcdFx0b3JpZ2luYWxDb21wbGV0ZS5jYWxsKGVsZW1lbnRzLCBlbGVtZW50cyk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChwcm9taXNlRGF0YSkge1xuXHRcdFx0XHRcdFx0XHRwcm9taXNlRGF0YS5yZXNvbHZlcihlbGVtZW50cyk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8qIElmIGEgZGlzcGxheSB3YXMgcGFzc2VkIGluLCB1c2UgaXQuIE90aGVyd2lzZSwgZGVmYXVsdCB0byBcIm5vbmVcIiBmb3IgZmFkZU91dCBvciB0aGUgZWxlbWVudC1zcGVjaWZpYyBkZWZhdWx0IGZvciBmYWRlSW4uICovXG5cdFx0XHRcdC8qIE5vdGU6IFdlIGFsbG93IHVzZXJzIHRvIHBhc3MgaW4gXCJudWxsXCIgdG8gc2tpcCBkaXNwbGF5IHNldHRpbmcgYWx0b2dldGhlci4gKi9cblx0XHRcdFx0aWYgKG9wdHMuZGlzcGxheSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0b3B0cy5kaXNwbGF5ID0gKGRpcmVjdGlvbiA9PT0gXCJJblwiID8gXCJhdXRvXCIgOiBcIm5vbmVcIik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRWZWxvY2l0eSh0aGlzLCBwcm9wZXJ0aWVzTWFwLCBvcHRzKTtcblx0XHRcdH07XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gVmVsb2NpdHk7XG5cdH0oKHdpbmRvdy5qUXVlcnkgfHwgd2luZG93LlplcHRvIHx8IHdpbmRvdyksIHdpbmRvdywgZG9jdW1lbnQpO1xufSkpO1xuXG4vKioqKioqKioqKioqKioqKioqXG4gS25vd24gSXNzdWVzXG4gKioqKioqKioqKioqKioqKioqL1xuXG4vKiBUaGUgQ1NTIHNwZWMgbWFuZGF0ZXMgdGhhdCB0aGUgdHJhbnNsYXRlWC9ZL1ogdHJhbnNmb3JtcyBhcmUgJS1yZWxhdGl2ZSB0byB0aGUgZWxlbWVudCBpdHNlbGYgLS0gbm90IGl0cyBwYXJlbnQuXG4gVmVsb2NpdHksIGhvd2V2ZXIsIGRvZXNuJ3QgbWFrZSB0aGlzIGRpc3RpbmN0aW9uLiBUaHVzLCBjb252ZXJ0aW5nIHRvIG9yIGZyb20gdGhlICUgdW5pdCB3aXRoIHRoZXNlIHN1YnByb3BlcnRpZXNcbiB3aWxsIHByb2R1Y2UgYW4gaW5hY2N1cmF0ZSBjb252ZXJzaW9uIHZhbHVlLiBUaGUgc2FtZSBpc3N1ZSBleGlzdHMgd2l0aCB0aGUgY3gvY3kgYXR0cmlidXRlcyBvZiBTVkcgY2lyY2xlcyBhbmQgZWxsaXBzZXMuICovXG4iLCJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgYXBwID0gcmVxdWlyZShcIi4vbW9kdWxlcy9hcHBcIik7XG5sZXQgYm9va2RhdGEgPSByZXF1aXJlKFwiLi9jYXR1bGx1c2Nhcm1pbmEvYm9va2RhdGFcIik7XG5sZXQgYXBwZGF0YSA9IHJlcXVpcmUoXCIuL21vZHVsZXMvYXBwZGF0YVwiKTtcblxuYXBwZGF0YS50ZXh0ZGF0YSA9IGJvb2tkYXRhLnRleHRkYXRhO1xuYXBwZGF0YS50cmFuc2xhdGlvbmRhdGEgPSBib29rZGF0YS50cmFuc2xhdGlvbmRhdGE7XG5hcHBkYXRhLmNhbnRvdGl0bGVzID0gYm9va2RhdGEuY2FudG90aXRsZXM7XG5hcHBkYXRhLnRyYW5zbGF0aW9uY291bnQgPSBib29rZGF0YS50cmFuc2xhdGlvbmRhdGEubGVuZ3RoO1xuYXBwZGF0YS5jYW50b2NvdW50ID0gYm9va2RhdGEuY2FudG90aXRsZXMubGVuZ3RoO1xuYXBwZGF0YS5kZXNjcmlwdGlvbiA9IGJvb2tkYXRhLmRlc2NyaXB0aW9uO1xuYXBwZGF0YS5ib29rbmFtZSA9IGJvb2tkYXRhLmJvb2tuYW1lO1xuYXBwZGF0YS5ib29rdGl0bGUgPSBib29rZGF0YS5ib29rdGl0bGU7XG5hcHBkYXRhLmJvb2thdXRob3IgPSBib29rZGF0YS5ib29rYXV0aG9yO1xuYXBwZGF0YS52ZXJzaW9uaGlzdG9yeSA9IGJvb2tkYXRhLnZlcnNpb25oaXN0b3J5O1xuYXBwZGF0YS5jb21pbmdzb29uID0gYm9va2RhdGEuY29taW5nc29vbjtcblxuZm9yKGxldCBpIGluIGFwcGRhdGEudGV4dGRhdGEpIHtcblx0Zm9yKGxldCBqIGluIGFwcGRhdGEudHJhbnNsYXRpb25kYXRhKSB7XG5cdFx0aWYoYXBwZGF0YS50cmFuc2xhdGlvbmRhdGFbal0udHJhbnNsYXRpb25pZCA9PSBhcHBkYXRhLnRleHRkYXRhW2ldLnRyYW5zbGF0aW9uaWQpIHtcblx0XHRcdGFwcGRhdGEudHJhbnNsYXRpb25kYXRhW2pdLmJvb2tuYW1lID0gYXBwZGF0YS50ZXh0ZGF0YVtpXS5ib29rbmFtZTtcblx0XHRcdGFwcGRhdGEudHJhbnNsYXRpb25kYXRhW2pdLmF1dGhvciA9IGFwcGRhdGEudGV4dGRhdGFbaV0uYXV0aG9yO1xuXHRcdFx0YXBwZGF0YS50cmFuc2xhdGlvbmRhdGFbal0udGl0bGUgPSBhcHBkYXRhLnRleHRkYXRhW2ldLnRpdGxlO1xuXHRcdFx0YXBwZGF0YS50cmFuc2xhdGlvbmRhdGFbal0udHJhbnNsYXRpb24gPSBhcHBkYXRhLnRleHRkYXRhW2ldLnRyYW5zbGF0aW9uO1xuXHRcdFx0YXBwZGF0YS50cmFuc2xhdGlvbmRhdGFbal0udHJhbnNsYXRpb25zaG9ydG5hbWUgPSBhcHBkYXRhLnRleHRkYXRhW2ldLnRyYW5zbGF0aW9uc2hvcnRuYW1lO1xuXHRcdFx0YXBwZGF0YS50cmFuc2xhdGlvbmRhdGFbal0udHJhbnNsYXRpb25mdWxsbmFtZSA9IGFwcGRhdGEudGV4dGRhdGFbaV0udHJhbnNsYXRpb25mdWxsbmFtZTtcblx0XHRcdGFwcGRhdGEudHJhbnNsYXRpb25kYXRhW2pdLnRyYW5zbGF0aW9uY2xhc3MgPSBhcHBkYXRhLnRleHRkYXRhW2ldLnRyYW5zbGF0aW9uY2xhc3M7XG5cdFx0XHRhcHBkYXRhLnRyYW5zbGF0aW9uZGF0YVtqXS5zb3VyY2UgPSBhcHBkYXRhLnRleHRkYXRhW2ldLnNvdXJjZTtcblx0XHR9XG5cdH1cbn1cblxuYXBwLmluaXRpYWxpemUoKTtcbiIsIi8vIHRoZSBzcGluZSBmb3IgdGhlIGJvb2tcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cblx0Ym9va25hbWU6ICdjYXR1bGx1c2Nhcm1pbmEnLFxuXHRib29rdGl0bGU6IFwiVGhlIENhcm1pbmFcIixcblx0Ym9va2F1dGhvcjogXCJDYWl1cyBWYWxlcml1cyBDYXR1bGx1c1wiLFxuXHRkZXNjcmlwdGlvbjogYDxwPkEgdmVyc2lvbiBvZiBDYXR1bGx1cy48L3A+YCxcblx0dmVyc2lvbmhpc3Rvcnk6IFsgLy8gdGhpcyBpcyB0aGUgdmVyc2lvbiBoaXN0b3J5IGZvciBhIHBhcnRpY3VsYXIgYm9vaywgYSBsaXN0XG5cdFx0XCIwLjAuMTogZmlyc3QgcmVsZWFzZVwiXG5cdF0sXG5cdGNvbWluZ3Nvb246ICAvLyB0aGlzIGlzIHdoYXQgZ29lcyBpbiB0aGUgY29taW5nIHNvb24gc2VjdGlvbiwgYSBzaW5nbGUgY2h1bmsgb2YgSFRNTFxuXHRcdFwiPHA+TW9yZSB0cmFuc2xhdGlvbnMhPC9wPlwiLFxuXG5cblx0Y2FudG90aXRsZXM6IFtcdC8vIHRoaXMgaXMgY2FudG8gc2VxdWVuY2Vcblx0XHRcIlRpdGxlIHBhZ2VcIixcIklcIixcIklJXCIsXCJJSUlcIixcIklJSUlcIixcIlZcIixcIlZJXCIsXCJWSUlcIixcIlZJSUlcIixcIlZJSUlJXCIsXCJYXCIvKixcIlhJXCIsXCJYSUlcIixcIlhJSUlcIixcIlhJSUlJXCIsXCJYVlwiLFwiWFZJXCIsXCJYVklJXCIsXCJYVklJSVwiLFwiWFZJSUlJXCIsXCJYWFwiLFwiWFhJXCIsXCJYWElJXCIsXCJYWElJSVwiLFwiWFhJSUlJXCIsXCJYWFZcIixcIlhYVklcIixcIlhYVklJXCIsXCJYWFZJSUlcIixcIlhYVklJSUlcIixcIlhYWFwiLFwiWFhYSVwiLFwiWFhYSUlcIixcIlhYWElJSVwiLFwiWFhYSUlJSVwiLFwiWFhYVlwiLFwiWFhYVklcIixcIlhYWFZJSVwiLFwiWFhYVklJSVwiLFwiWFhYVklJSUlcIixcIlhMXCIsXCJYTElcIixcIlhMSUlcIixcIlhMSUlJXCIsXCJYTElJSUlcIixcIlhMVlwiLFwiWExWSVwiLFwiWExWSUlcIixcIlhMVklJSVwiLFwiWExWSUlJSVwiLFwiTFwiLFwiTElcIixcIkxJSVwiLFwiTElJSVwiLFwiTElJSUlcIixcIkxWXCIsXCJMVklcIixcIkxWSUlcIixcIkxWSUlJXCIsXCJMVklJSUlcIixcIkxYXCIsXCJMWElcIixcIkxYSUlcIixcIkxYSUlJXCIsXCJMWElJSUlcIixcIkxYVlwiLFwiTFhWSVwiLFwiTFhWSUlcIixcIkxYVklJSVwiLFwiTFhWSUlJSVwiLFwiTFhYXCIsXCJMWFhJXCIsXCJMWFhJSVwiLFwiTFhYSUlJXCIsXCJMWFhJSUlJXCIsXCJMWFhWXCIsXCJMWFhWSVwiLFwiTFhYVklJXCIsXCJMWFhWSUlJXCIsXCJMWFhWSUlJSVwiLFwiTFhYWFwiLFwiTFhYWElcIixcIkxYWFhJSVwiLFwiTFhYWElJSVwiLFwiTFhYWElJSUlcIixcIkxYWFhWXCIsXCJMWFhYVklcIixcIkxYWFhWSUlcIixcIkxYWFhWSUlJXCIsXCJMWFhYVklJSUlcIixcIlhDXCIsXCJYQ0lcIixcIlhDSUlcIixcIlhDSUlJXCIsXCJYQ0lJSUlcIixcIlhDVlwiLFwiWENWSVwiLFwiWENWSUlcIixcIlhDVklJSVwiLFwiWENWSUlJSVwiLFwiQ1wiLFwiQ0lcIixcIkNJSVwiLFwiQ0lJSVwiLFwiQ0lJSUlcIixcIkNWXCIsXCJDVklcIixcIkNWSUlcIixcIkNWSUlJXCIsXCJDVklJSUlcIixcIkNYXCIsXCJDWElcIixcIkNYSUlcIixcIkNYSUlJXCIsXCJDWElJSUlcIixcIkNYVlwiLFwiQ1hWSVwiKi9cblx0XSxcblxuXHR0cmFuc2xhdGlvbmRhdGE6IFtcdC8vIHRoaXMgaXMgdHJhbnNsYXRpb24gc2VxdWVuY2Vcblx0XHR7XCJ0cmFuc2xhdGlvbmlkXCI6XCJjYXR1bGx1c1wiLFxuXHRcdFx0XCJvcmRlclwiOjB9LFxuXHRcdHtcInRyYW5zbGF0aW9uaWRcIjpcImJ1cnRvbnNtaXRoZXJzcG9ldHJ5XCIsXG5cdFx0XHRcIm9yZGVyXCI6MX0sXG5cdFx0e1widHJhbnNsYXRpb25pZFwiOlwiYnVydG9uc21pdGhlcnNwcm9zZVwiLFxuXHRcdFx0XCJvcmRlclwiOjJ9XG5cdF0sXG5cblx0dGV4dGRhdGE6IFtcdC8vIHNldCB1cCB0cmFuc2xhdGlvbnNcblx0XHRyZXF1aXJlKFwiLi90cmFuc2xhdGlvbnMvY2F0dWxsdXNcIiksXG5cdFx0cmVxdWlyZShcIi4vdHJhbnNsYXRpb25zL2J1cnRvbnNtaXRoZXJzcG9ldHJ5XCIpLFxuXHRcdHJlcXVpcmUoXCIuL3RyYW5zbGF0aW9ucy9idXJ0b25zbWl0aGVyc3Byb3NlXCIpXG5cdF1cbn07XG4iLCIvLyBjYXR1bGx1c2Nhcm1pbmEvYnVydG9uc21pdGhlcnNwb2V0cnkuanNcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRib29rbmFtZTogJ2NhdHVsbHVzY2FybWluYScsXG5cdGF1dGhvcjogJ0NhaXVzIFZhbGVyaXVzIENhdHVsbHVzJyxcblx0dHJhbnNsYXRpb25pZDpcImJ1cnRvbnNtaXRoZXJzcG9ldHJ5XCIsXG5cdHRpdGxlOiAnVGhlIENhcm1pbmEnLFxuXHR0cmFuc2xhdGlvbjogdHJ1ZSxcblx0c291cmNlOiBgPGEgaHJlZj1cImh0dHA6Ly93d3cuZ3V0ZW5iZXJnLm9yZy9maWxlcy8yMDczMi8yMDczMi1oLzIwNzMyLWguaHRtXCI+UHJvamVjdCBHdXRlbmJlcmc8L2E+YCxcblx0dHJhbnNsYXRpb25zaG9ydG5hbWU6XCJCdXJ0b24vU21pdGhlcnMgdmVyc2VcIixcblx0dHJhbnNsYXRpb25mdWxsbmFtZTpcIlJpY2hhcmQgQnVydG9uICYgTGVvbmFyZCBDLiBTbWl0aGVycyB2ZXJzZVwiLFxuXHR0cmFuc2xhdGlvbmNsYXNzOlwicG9ldHJ5XCIsXG5cdHRleHQ6W2A8cCBjbGFzcz1cInRpdGxlXCI+VGhlIENhcm1pbmE8L3A+XG5cdDxwIGNsYXNzPVwiYXV0aG9yXCI+UmljaGFyZCBCdXJ0b24gJmFtcDsgTGVvbmFyZCBDLiBTbWl0aGVyczwvcD5cblx0PHAgY2xhc3M9XCJzdWJ0aXRsZVwiPih2ZXJzZSB0cmFuc2xhdGlvbik8L3A+YCxcblxuXHRgPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5JLjwvcD5cblx0PHAgY2xhc3M9XCJjYW50b3N1YmhlYWRcIj5EZWRpY2F0aW9uIHRvIENvcm5lbGl1cyBOZXBvcy48L3A+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5Ob3cgc21vb3Ro4oCZZCB0byBwb2xpc2ggZHVlIHdpdGggcHVtaWNlIGRyeTwvcD5cblx0XHQ8cD5XaGVyZXRvIHRoaXMgbGl2ZWx5IGJvb2tsZXQgbmV3IGdpdmUgST88L3A+XG5cdFx0PHA+VG8gdGhlZSAoQ29ybmVsaXVzISk7IGZvciB3YXN0IGV2ZXIgZmFpbjwvcD5cblx0XHQ8cD5UbyBkZWVtIG15IHRyaWZsZXMgc29tZXdoYXQgYm9vbiBjb250YWluOzwvcD5cblx0XHQ8cD5F4oCZZW4gd2hlbiB0aG91IHNpbmdsZSDigJltb25nc3QgSXRhbGlhbnMgZm91bmQ8L3A+XG5cdFx0PHA+RGFyZWRzdCBhbGwgcGVyaW9kcyBpbiB0aHJlZSBTY3JpcHRzIGV4cG91bmQ8L3A+XG5cdFx0PHA+TGVhcm5lZCAoYnkgSnVwaXRlciEpIGVsYWJvcmF0ZWx5LjwvcD5cblx0XHQ8cD5UaGVuIHRha2UgdGhlZSB3aGF0c28gaW4gdGhpcyBib29rbGV0IGJlLDwvcD5cblx0XHQ8cD5TdWNoIGFzIGl0IGlzLCB3aGVyZXRvIE8gUGF0cm9uIE1haWQ8L3A+XG5cdFx0PHA+VG8gbGl2ZSBkb3duIEFnZXMgbGVuZCB0aG91IGxhc3RpbmcgYWlkITwvcD5cblx0PC9kaXY+YCxcblxuXHRgPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5JSS48L3A+XG5cdDxwIGNsYXNzPVwiY2FudG9zdWJoZWFkXCI+TGVzYmlh4oCZcyBTcGFycm93LjwvcD5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPlNwYXJyb3chIG15IHBldOKAmXMgZGVsaWNpb3VzIGpveSw8L3A+XG4gICAgPHA+V2hlcmV3aXRoIGluIGJvc29tIG51cnN0IHRvIHRveTwvcD5cbiAgICA8cD5TaGUgbG92ZXMsIGFuZCBnaXZlcyBoZXIgZmluZ2VyLXRpcDwvcD5cbiAgICA8cD5Gb3Igc2hhcnAtbmli4oCZZCBncmVlZGluZyBuZWIgdG8gbmlwLDwvcD5cbiAgICA8cD5XZXJlIHNoZSB3aG8gbXkgZGVzaXJlIHdpdGhzdG9vZDwvcD5cbiAgICA8cD5UbyBzZWVrIHNvbWUgcGV0IG9mIG1lcnJ5IG1vb2QsPC9wPlxuICAgIDxwPkFzIGNydW1iIG/igJkgY29tZm9ydCBmb3IgaGVyIGdyaWVmLDwvcD5cbiAgICA8cD5NZXRoaW5rcyBoZXIgYnVybmluZyBsb3dl4oCZcyByZWxpZWY6PC9wPlxuICAgIDxwPkNvdWxkIEksIGFzIHBsYXlzIHNoZSwgcGxheSB3aXRoIHRoZWUsPC9wPlxuICAgIDxwPlRoYXQgbWluZCBtaWdodCB3aW4gZnJvbSBtaXNlcnkgZnJlZSE8L3A+XG4gICAgPHAgY2xhc3M9XCJkaXZpZGVyXCI+KiAqICogKiAqPC9wPlxuICAgIDxwPlRvIG1lIHTigJl3ZXJlIGdyYXRlZnVsIChhcyB0aGV5IHNheSksPC9wPlxuICAgIDxwPkdvbGQgY29kbGluZyB3YXMgdG8gZmxlZXQtZm9vdCBNYXksPC9wPlxuICAgIDxwPldob3NlIGxvbmctYm91bmQgem9uZSBpdCBsb29zZWQgZm9yIGF5ZS48L3A+XG5cdDwvZGl2PmAsXG5cblx0YDxwIGNsYXNzPVwiY2FudG9oZWFkXCI+SUlJLjwvcD5cblx0PHAgY2xhc3M9XCJjYW50b3N1YmhlYWRcIj5PbiB0aGUgRGVhdGggb2YgTGVzYmlh4oCZcyBTcGFycm93LjwvcD5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPldlZXAgZXZlcnkgVmVudXMsIGFuZCBhbGwgQ3VwaWRzIHdhaWwsPC9wPlxuXHRcdDxwPkFuZCBtZW4gd2hvc2UgZ2VudGxlciBzcGlyaXRzIHN0aWxsIHByZXZhaWwuPC9wPlxuXHRcdDxwPkRlYWQgaXMgdGhlIFNwYXJyb3cgb2YgbXkgZ2lybCwgdGhlIGpveSw8L3A+XG5cdFx0PHA+U3BhcnJvdywgbXkgc3dlZXRpbmfigJlzIG1vc3QgZGVsaWNpb3VzIHRveSw8L3A+XG5cdFx0PHA+V2hvbSBsb3ZlZCBzaGUgZGVhcmVyIHRoYW4gaGVyIHZlcnkgZXllczs8L3A+XG5cdFx0PHA+Rm9yIGhlIHdhcyBob25leWVkLXBldCBhbmQgYW55d2lzZTwvcD5cblx0XHQ8cD5LbmV3IGhlciwgYXMgZXZlbiBzaGUgaGVyIG1vdGhlciBrbmV3OzwvcD5cblx0XHQ8cD5OZeKAmWVyIGZyb20gaGVyIGJvc29t4oCZcyBoYXJib3VyYWdlIGhlIGZsZXc8L3A+XG5cdFx0PHA+QnV0IOKAmXJvdW5kIGhlciBob3BwaW5nIGhlcmUsIHRoZXJlLCBldmVyeXdoZXJlLDwvcD5cblx0XHQ8cD5QaXBlZCBoZSB0byBub25lIGJ1dCBoZXIgaGlzIGxhZHkgZmFpci48L3A+XG5cdFx0PHA+Tm93IG11c3QgaGUgd2FuZGVyIG/igJllciB0aGUgZGFya2xpbmcgd2F5PC9wPlxuXHRcdDxwPlRoaXRoZXIsIHdoZW5jZSBsaWZlLXJldHVybiB0aGUgRmF0ZXMgZGVuYXkuPC9wPlxuXHRcdDxwPkJ1dCBhaCEgYmVzaHJldyB5b3UsIGV2aWwgU2hhZG93cyBsb3figJlyaW5nPC9wPlxuXHRcdDxwPkluIE9yY3VzIGV2ZXIgbG92ZWxpZXN0IHRoaW5ncyBkZXZvdXJpbmc6PC9wPlxuXHRcdDxwPldobyBib3JlIHNvIHByZXR0eSBhIFNwYXJyb3cgZnJv4oCZIGhlciB0YeKAmWVuLjwvcD5cblx0XHQ8cD4oT2ggaGFwbGVzcyBiaXJkaWUgYW5kIE9oIGRlZWQgb2YgYmFuZSEpPC9wPlxuXHRcdDxwPk5vdyBieSB5b3VyIHdhbnRvbiB3b3JrIG15IGdpcmwgYXBwZWFyczwvcD5cblx0XHQ8cD5XaXRoIHR1cmdpZCBleWVsaWRzIHRpbnRlZCByb3NlIGJ5IHRlYXJzLjwvcD5cblx0PC9kaXY+YCxcblxuXHRgPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5JSUlJLjwvcD5cblx0PHAgY2xhc3M9XCJjYW50b3N1YmhlYWRcIj5PbiBoaXMgUGlubmFjZS48L3A+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5Zb25kZXIgUGlubmFjZSB5ZSAobXkgZ3Vlc3RzISkgYmVob2xkPC9wPlxuXHRcdDxwPlNhaXRoIHNoZSB3YXMgZXJzdHdoaWxlIGZsZWV0ZXN0LWZsZWV0IG9mIGNyYWZ0cyw8L3A+XG5cdFx0PHA+Tm9yIGNvdWxkIGJ5IHN3aWZ0bmVzcyBvZiBhdWdodCBwbGFuayB0aGF0IHN3aW1zLDwvcD5cblx0XHQ8cD5CZSBzaGUgb3V0c3RyaXBwZWQsIHdoZXRoZXIgcGFkZGxlIHBsaWVkLDwvcD5cblx0XHQ8cD5PciBmYXJlZCBzaGUgc2N1ZGRpbmcgdW5kZXIgY2FudmFzLXNhaWwuPC9wPlxuXHRcdDxwPkVrZSBzaGUgZGVmaWV0aCB0aHJlYXTigJluaW5nIEFkcmlhbiBzaG9yZSw8L3A+XG5cdFx0PHA+RGFyZSBub3QgZGVuYXkgaGVyLCBpbnN1bGFyIEN5Y2xhZGVzLDwvcD5cblx0XHQ8cD5BbmQgbm9ibGUgUmhvZG9zIGFuZCBmZXJvY2lvdXMgVGhyYWNlLDwvcD5cblx0XHQ8cD5Qcm9wb250aXMgdG9vIGFuZCBibHVzdGVyaW5nIFBvbnRpYyBiaWdodC48L3A+XG5cdFx0PHA+V2hlcmUgc2hlIChteSBQaW5uYWNlIG5vdykgaW4gdGltZXMgYmVmb3JlLDwvcD5cblx0XHQ8cD5XYXMgbGVhZnkgd29vZGxpbmcgb24gQ3l0w7NyZWFuIENoaW5lPC9wPlxuXHRcdDxwPkZvciBldmVyIGxvcXVlbnQgbGlzcGluZyB3aXRoIGhlciBsZWF2ZXMuPC9wPlxuXHRcdDxwPlBvbnRpYyBBbWFzdHJpcyEgQm94LXRyZWUtY2xhZCBDeXTDs3J1cyE8L3A+XG5cdFx0PHA+Q29nbmlzYW50IHdlcmUgeWUsIGFuZCB5b3Ugd2VldCBmdWxsIHdlbGw8L3A+XG5cdFx0PHA+KFNvIHNhaXRoIG15IFBpbm5hY2UpIGhvdyBmcm9tIGVhcmxpZXN0IGFnZTwvcD5cblx0XHQ8cD5VcG9uIHlvdXIgaGlnaG1vc3Qtc3BpcmluZyBwZWFrIHNoZSBzdG9vZCw8L3A+XG5cdFx0PHA+SG93IGluIHlvdXIgd2F0ZXJzIGZpcnN0IGhlciBzY3VsbHMgd2VyZSBkaXB0LDwvcD5cblx0XHQ8cD5BbmQgdGhlbmNlIHRocm/igJkgbWFueSBhbmQgbWFueSBhbiBpbXBvcnRhbnQgc3RyYWl0PC9wPlxuXHRcdDxwPlNoZSBib3JlIGhlciBvd25lciB3aGV0aGVyIGxlZnQgb3IgcmlnaHQsPC9wPlxuXHRcdDxwPldoZXJlIGJyZWV6ZXMgYmFkZSBoZXIgZmFyZSwgb3IgSnVwaXRlciBkZWlnbmVkPC9wPlxuXHRcdDxwPkF0IG9uY2UgcHJvcGl0aW91cyBzdHJpa2UgdGhlIHNhaWwgZnVsbCBzcXVhcmU7PC9wPlxuXHRcdDxwPk5vciB0byB0aGUgc2VhLXNob3JlIGdvZHMgd2FzIGF1Z2h0IG9mIHZvdzwvcD5cblx0XHQ8cD5CeSBoZXIgZGVlbWVkIG5lZWRmdWwsIHdoZW4gZnJvbSBPY2VhbuKAmXMgYm91cm5lPC9wPlxuXHRcdDxwPkV4dHJlbWUgc2hlIHZveWFnZWQgZm9yIHRoaXMgbGltcGlkIGxha2UuPC9wPlxuXHRcdDxwPllldCB3ZXJlIHN1Y2ggdGhpbmdzIHdoaWxvbWU6IG5vdyBzaGUgcmV0aXJlZDwvcD5cblx0XHQ8cD5JbiBxdWlldCBhZ2UgZGV2b3RlcyBoZXJzZWxmIHRvIHRoZWU8L3A+XG5cdFx0PHA+KE8gdHdpbi1ib3JuIENhc3RvcikgdHdhaW4gd2l0aCBDYXN0b3LigJlzIHR3aW4uPC9wPlxuXHQ8L2Rpdj5gLFxuXG5cdGA8cCBjbGFzcz1cImNhbnRvaGVhZFwiPlYuPC9wPlxuXHQ8cCBjbGFzcz1cImNhbnRvc3ViaGVhZFwiPlRvIExlc2JpYSwgKG9mIExlc2JvcyZtZGFzaDtDbG9kaWE/KTwvcD5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkxvdmUgd2UgKG15IExlc2JpYSEpIGFuZCBsaXZlIHdlIG91ciBkYXksPC9wPlxuXHRcdDxwPldoaWxlIGFsbCBzdGVybiBzYXlpbmdzIGNyYWJiZWQgc2FnZXMgc2F5LDwvcD5cblx0XHQ8cD5BdCBvbmUgZG9pdOKAmXMgdmFsdWUgbGV0IHVzIHByaWNlIGFuZCBwcml6ZSE8L3A+XG5cdFx0PHA+VGhlIFN1bnMgY2FuIHdlc3R3YXJkIHNpbmsgYWdhaW4gdG8gcmlzZTwvcD5cblx0XHQ8cD5CdXQgd2UsIGV4dGluZ3Vpc2hlZCBvbmNlIG91ciB0aW55IGxpZ2h0LDwvcD5cblx0XHQ8cD5QZXJmb3JjZSBzaGFsbCBzbHVtYmVyIHRocm91Z2ggb25lIGxhc3RpbmcgbmlnaHQhPC9wPlxuXHRcdDxwPktpc3MgbWUgYSB0aG91c2FuZCB0aW1lcywgdGhlbiBodW5kcmVkIG1vcmUsPC9wPlxuXHRcdDxwPlRoZW4gdGhvdXNhbmQgb3RoZXJzLCB0aGVuIGEgbmV3IGZpdmUtc2NvcmUsPC9wPlxuXHRcdDxwPlN0aWxsIG90aGVyIHRob3VzYW5kIG90aGVyIGh1bmRyZWQgc3RvcmUuPC9wPlxuXHRcdDxwPkxhc3Qgd2hlbiB0aGUgc3VtcyB0byBtYW55IHRob3VzYW5kcyBncm93LDwvcD5cblx0XHQ8cD5UaGUgdGFsZSBsZXTigJlzIHRyb3VibGUgdGlsbCBubyBtb3JlIHdlIGtub3csPC9wPlxuXHRcdDxwPk5vciBlbnZpb3VzIHdpZ2h0IGRlc3BpdGVmdWwgc2hhbGwgbWlzd2VlbiB1czwvcD5cblx0XHQ8cD5Lbm93aW5nIGhvdyBtYW55IGtpc3NlcyBoYXZlIGJlZW4ga2lzc2VkIGJldHdlZW4gdXMuPC9wPlxuXHQ8L2Rpdj5gLFxuXG5cdGA8cCBjbGFzcz1cImNhbnRvaGVhZFwiPlZJLjwvcD5cblx0PHAgY2xhc3M9XCJjYW50b3N1YmhlYWRcIj5UbyBGbGF2aXVzOiBNaXMtc3BlYWtpbmcgaGlzIE1pc3RyZXNzLjwvcD5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPlRoeSBDaGFybWVyIChGbGF2aXVzISkgdG8gQ2F0dWxsdXPigJkgZWFyPC9wPlxuXHRcdDxwPldlcmUgc2hlIG5vdCBtYW5uZXLigJlkIG1lYW4gYW5kIHdvcnN0IGluIHdpdDwvcD5cblx0XHQ8cD5QZXJmb3JjZSB0aG91IGhhZHN0IHByYWlzZWQgbm9yIGNvdWxkc3Qgc2lsZW5jZSBrZWVwLjwvcD5cblx0XHQ8cD5CdXQgc29tZSBlbmZldmVyZWQgamFkZSwgSSB3b3Qtbm90LXdoYXQsPC9wPlxuXHRcdDxwPlNvbWUgcGllY2UgdGhvdSBsb3Zlc3QsIGJsdXNoaW5nIHRoaXMgdG8gb3duLjwvcD5cblx0XHQ8cD5Gb3IsIG5vd2lzZSDigJljdXN0b21lZCB3aWRvd2VyIG5pZ2h0cyB0byBsaWU8L3A+XG5cdFx0PHA+VGhvdSDigJlydCBldmVyIHN1bW1vbmVkIGJ5IG5vIHNpbGVudCBiZWQ8L3A+XG5cdFx0PHA+V2l0aCBmbG934oCZci13cmVhdGhzIGZyYWdyYW50IGFuZCB3aXRoIFN5cmlhbiBvaWwsPC9wPlxuXHRcdDxwPkJ5IG1hdHRyZXNzLCBib2xzdGVycywgaGVyZSwgdGhlcmUsIGV2ZXJ5d2hlcmU8L3A+XG5cdFx0PHA+RGVlcC1kaW50ZWQsIGFuZCBieSBxdWFraW5nLCBzaGFraW5nIGNvdWNoPC9wPlxuXHRcdDxwPkFsbCBjcmVwaXRhdGlvbiBhbmQgbW9iaWxpdHkuPC9wPlxuXHRcdDxwPkV4cGxhaW4hIG5vbmUgd2hvcmVkb21zIChubyEpIHNoYWxsIGNsb3NlIG15IGxpcHMuPC9wPlxuXHRcdDxwPldoeT8gc3VjaCBvdXRmdXR0ZXJlZCBmbGFuayB0aG91IG5l4oCZZXIgd291bGRzdCBzaG93PC9wPlxuXHRcdDxwPkhhZCBub3Qgc29tZSBmdWxzb21lIHdvcmsgYnkgdGhlZSBiZWVuIHdyb3VnaHQuPC9wPlxuXHRcdDxwPlRoZW4gd2hhdCB0aG91IGhvbGRlc3QsIGJvb24gb3IgYmFuZSBiZSBwbGVhc2VkPC9wPlxuXHRcdDxwPkRpc2Nsb3NlISBGb3IgdGhlZSBhbmQgdGh5IGJlbG92ZWQgZmFpbiB3b3VsZCBJPC9wPlxuXHRcdDxwPlVwcmFpc2UgdG8gSGVhdmVuIHdpdGggbXkgbGl2ZWxpZXN0IGxheS48L3A+XG5cdDwvZGl2PmAsXG5cblx0YDxwIGNsYXNzPVwiY2FudG9oZWFkXCI+VklJLjwvcD5cblx0PHAgY2xhc3M9XCJjYW50b3N1YmhlYWRcIj5UbyBMZXNiaWEgc3RpbGwgQmVsb3ZlZC48L3A+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5UaG91IGFza+KAmXN0IEhvdyBtYW55IGtpc3NpbmcgYm91dHMgSSBib3JlPC9wPlxuXHRcdDxwPkZyb20gdGhlZSAobXkgTGVzYmlhISkgb3IgYmUgZW5vdWdoIG9yIG1vcmU/PC9wPlxuXHRcdDxwPkkgc2F5IHdoYXQgbWlnaHR5IHN1bSBvZiBMeWJpYW4tc2FuZHM8L3A+XG5cdFx0PHA+Q29uZmluZSBDeXJlbmXigJlzIExhc2VycGl0aXVtLWxhbmRzPC9wPlxuXHRcdDxwPuKAmVR3aXh0IE9yYWNsZSBvZiBKb3ZlIHRoZSBTd2VsdGVyZXI8L3A+XG5cdFx0PHA+QW5kIG9sZGVuIEJhdHR1c+KAmSBob2x5IFNlcHVsY2hyZSw8L3A+XG5cdFx0PHA+T3Igc3RhcnMgaW5udW1lcmF0ZSB0aHJvdWdoIG5pZ2h0LXN0aWxsbmVzcyBrZW48L3A+XG5cdFx0PHA+VGhlIHN0b2xlbiBMb3ZlLWRlbGlnaHRzIG9mIG1vcnRhbCBtZW4sPC9wPlxuXHRcdDxwPkZvciB0aGF0IHRvIGtpc3MgdGhlZSB3aXRoIHVuZW5kaW5nIGtpc3NlczwvcD5cblx0XHQ8cD5Gb3IgbWFkIENhdHVsbHVzIGVub3VnaCBhbmQgbW9yZSBiZSB0aGlzLDwvcD5cblx0XHQ8cD5LaXNzZXMgbm9yIGN1cmlvdXMgd2lnaHQgc2hhbGwgY291bnQgdGhlaXIgdGFsZSw8L3A+XG5cdFx0PHA+Tm9yIHRvIGJld2l0Y2ggdXMgZXZpbCB0b25ndWUgYXZhaWwuPC9wPlxuXHQ8L2Rpdj5gLFxuXG5cdGA8cCBjbGFzcz1cImNhbnRvaGVhZFwiPlZJSUkuPC9wPlxuXHQ8cCBjbGFzcz1cImNhbnRvc3ViaGVhZFwiPlRvIEhpbXNlbGYgcmVjb3VudGluZyBMZXNiaWHigJlzIEluY29uc3RhbmN5LjwvcD5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPldvZS1mdWxsIENhdHVsbHVzISBjZWFzZSB0byBwbGF5IHRoZSBmb29sPC9wPlxuXHRcdDxwPkFuZCB3aGF0IHRob3Ugc2Vlc3QgZGVhZCBhcyBkZWFkIHJlZ2FyZCE8L3A+XG5cdFx0PHA+V2hpbMOybWUgdGhlIHNoZWVuaWVzdCBzdW5zIGZvciB0aGVlIGRpZCBzaGluZTwvcD5cblx0XHQ8cD5XaGVuIG9mdC1hLXRyaXBwaW5nIHdoaXRoZXIgbGVkIHRoZSBnaXJsPC9wPlxuXHRcdDxwPkJ5IHVzIGJlbG92w6hkLCBhcyBzaGFsbCBub25lIGJlIGxvdmVkLjwvcD5cblx0XHQ8cD5UaGVyZSBhbGwgc28gbWVycnkgZG9pbmdzIHRoZW4gd2VyZSBkb25lPC9wPlxuXHRcdDxwPkFmdGVyIHRoeSBsaWtpbmcsIG5vciB0aGUgZ2lybCB3YXMgbG9hdGguPC9wPlxuXHRcdDxwPlRoZW4gY2VydMOocyBzaGVlbmllc3Qgc3VucyBmb3IgdGhlZSBkaWQgc2hpbmUuPC9wPlxuXHRcdDxwPk5vdyBzaGXigJlzIHVud2lsbGluZzogdGhvdSB0b28gKGhhcGxlc3MhKSB3aWxsPC9wPlxuXHRcdDxwPkhlciBmbGlnaHQgdG8gZm9sbG93LCBhbmQgc2FkIGxpZmUgdG8gbGl2ZTo8L3A+XG5cdFx0PHA+RW5kdXJlIHdpdGggc3R1YmJvcm4gc291bCBhbmQgc3RpbGwgb2JkdXJlLjwvcD5cblx0XHQ8cD5EYW1zZWwsIGFkaWV1ISBDYXR1bGx1cyBvYmR1cmF0ZSBncm93bjwvcD5cblx0XHQ8cD5Ob3Igc2Vla3MgdGhlZSwgbmVpdGhlciBhc2tzIG9mIHRoaW5lIHVud2lsbDs8L3A+XG5cdFx0PHA+WWV0IHNoYWx0IHRob3Ugc29ycm93IHdoZW4gbm9uZSB3b29zIHRoZWUgbW9yZTs8L3A+XG5cdFx0PHA+UmVwcm9iYXRlISBXb2UgdG8gdGhlZSEgV2hhdCBsaWZlIHJlbWFpbnM/PC9wPlxuXHRcdDxwPldobyBub3cgc2hhbGwgbG92ZSB0aGVlPyBXaG/igJlsbCB0aGluayB0aGVlIGZhaXI/PC9wPlxuXHRcdDxwPldob20gbm93IHNoYWx0IGV2ZXIgbG92ZT8gV2hvc2Ugd2lsdCBiZSBjYWxsZWQ/PC9wPlxuXHRcdDxwPlRvIHdob20gc2hhbHQga2lzc2VzIGdpdmU/IHdob3NlIGxpcGxldHMgbmlwPzwvcD5cblx0XHQ8cD5CdXQgdGhvdSAoQ2F0dWxsdXMhKSBkZXN0aW55LWRvb21lZCBvYmR1cmUuPC9wPlxuXHQ8L2Rpdj5gLFxuXG5cdGA8cCBjbGFzcz1cImNhbnRvaGVhZFwiPlZJSUlJLjwvcD5cblx0PHAgY2xhc3M9XCJjYW50b3N1YmhlYWRcIj5UbyBWZXJhbml1cyByZXR1cm5lZCBmcm9tIFRyYXZlbC48L3A+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5WZXJhbml1cyEgb3ZlciBldmVyeSBmcmllbmQgb2YgbWU8L3A+XG5cdFx0PHA+Rm9yZXN0YW5kaW5nLCBvd25lZCBJIGh1bmRyZWQgdGhvdXNhbmRzIHRocmVlLDwvcD5cblx0XHQ8cD5Ib21lIHRvIFBlbmF0ZXMgYW5kIHRvIHNpbmdsZS1zb3Vs4oCZZDwvcD5cblx0XHQ8cD5CcmV0aHJlbiwgcmV0dXJuZWQgYXJ0IHRob3UgYW5kIG1vdGhlciBvbGQ/PC9wPlxuXHRcdDxwPlllcywgdGhvdSBhcnQgY29tZS4gT2gsIHdpbnNvbWUgbmV3cyBjb21lIHdlbGwhPC9wPlxuXHRcdDxwPk5vdyBzaGFsbCBJIHNlZSB0aGVlLCBzYWZlbHkgaGVhciB0aGVlIHRlbGw8L3A+XG5cdFx0PHA+T2Ygc2l0ZXMgSWJlcmlhbiwgZGVlZHMgYW5kIG5hdGlvbnMg4oCZc3BpZWQsPC9wPlxuXHRcdDxwPihBcyBiZSB0aHkgd29udCkgYW5kIG5lY2stYS1uZWNrIGFwcGxpZWQ8L3A+XG5cdFx0PHA+SeKAmWxsIGdyZWV0IHdpdGgga2lzc2VzIHRoeSBnbGFkIGxpcHMgYW5kIGV5bmUuPC9wPlxuXHRcdDxwPk9oISBPZiBhbGwgbW9ydGFsIG1lbiBiZWF0aWZpZWQ8L3A+XG5cdFx0PHA+V2hvc2Ugam95IGFuZCBnbGFkbmVzcyBncmVhdGVyIGJlIHRoYW4gbWluZT88L3A+XG5cdDwvZGl2PmAsXG5cblx0YDxwIGNsYXNzPVwiY2FudG9oZWFkXCI+WC48L3A+XG5cdDxwIGNsYXNzPVwiY2FudG9zdWJoZWFkXCI+SGUgbWVldHMgVmFydXMgYW5kIE1pc3RyZXNzLjwvcD5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkxlZCBtZSBteSBWYXJ1cyB0byBoaXMgZmxhbWUsPC9wPlxuXHRcdDxwPkFzIEkgZnJvbSBGb3J1bSBpZGxpbmcgY2FtZS48L3A+XG5cdFx0PHA+Rm9ydGhyaWdodCBzb21lIHdob3JlbGV0IGp1ZGdlZCBJIGl0PC9wPlxuXHRcdDxwPk5vciBsYWNraW5nIGxvb2tzIG5vciB3YW50aW5nIHdpdCw8L3A+XG5cdFx0PHA+V2hlbiBoaWVkIHdlIHRoaXRoZXIsIG1pZCB1cyB0aHJlZTwvcD5cblx0XHQ8cD5GZWxsIHZhcmlvdXMgdGFsaywgYXMgaG93IG1pZ2h0IGJlPC9wPlxuXHRcdDxwPkJpdGh5bmlhIG5vdywgYW5kIGhvdyBpdCBmYXJlZCw8L3A+XG5cdFx0PHA+QW5kIGlmIHNvbWUgY29pbiBJIG1hZGUgb3Igc3BhcmVkLjwvcD5cblx0XHQ8cD7igJxUaGVyZSB3YXMgbm8gY2F1c2XigJ0gKEkgc29vdGhseSBzYWlkKTwvcD5cblx0XHQ8cD7igJxUaGUgUHLDpnRvcnMgb3IgdGhlIENvaG9ydCBtYWRlPC9wPlxuXHRcdDxwPlRoZW5jZSB0byByZXR1cm4gd2l0aCBvaWxpZXIgaGVhZDs8L3A+XG5cdFx0PHA+VGhlIG1vcmUgd2hlbiBydWxlZCBieSAmbWRhc2g7Jm1kYXNoOzwvcD5cblx0XHQ8cD5QcsOmdG9yLCBhcyBwaWxlIHRoZSBDb2hvcnQgcmF0aW5nLuKAnTwvcD5cblx0XHQ8cD5RdW90aCB0aGV5LCDigJxCdXQgY2VydMOocyBhcyDigJl0d2FzIHRoZXJlPC9wPlxuXHRcdDxwPlRoZSBjdXN0b20gcm9zZSwgc29tZSBtZW4gdG8gYmVhcjwvcD5cblx0XHQ8cD5MaXR0ZXIgdGhvdSBib3VnaHRlc3Q/4oCdIEkgdG8gaGVyPC9wPlxuXHRcdDxwPlRvIHNlZW0gYnV0IHJpY2hlciwgd2VhbHRoaWVyLDwvcD5cblx0XHQ8cD5DcnksIOKAnE5heSwgd2l0aCBtZSDigJl0d2FzIG5vdCBzbyBpbGw8L3A+XG5cdFx0PHA+VGhhdCwgZ2l2ZW4gdGhlIFByb3ZpbmNlIHN1ZmZlcmVkLCBzdGlsbDwvcD5cblx0XHQ8cD5FaWdodCBzdGlmZi1iYWNrZWQgbG9vbnMgSSBjb3VsZCBub3QgYnV5LuKAnTwvcD5cblx0XHQ8cD4oV2l0aGFsIG5vbmUgaGVyZSBub3IgdGhlcmUgb3duZWQgSTwvcD5cblx0XHQ8cD5XaG8gYnJva2VuIGxlZyBvZiBDb3VjaCBvdXR3b3JuPC9wPlxuXHRcdDxwPk9uIG5hcGUgb2YgbmVjayBoYWQgZXZlciBib3JuZSEpPC9wPlxuXHRcdDxwPlRoZW4gc2hlLCBhcyBwYXRoaWMgcGllY2UgYmVjYW1lLDwvcD5cblx0XHQ8cD7igJxQcml0aGVlIENhdHVsbHVzIG1pbmUsIHRob3NlIHNhbWU8L3A+XG5cdFx0PHA+TGVuZCBtZSwgU2VyYXBpcy13YXJkcyBJ4oCZZCBoaWUu4oCdPC9wPlxuXHRcdDxwIGNsYXNzPVwiZGl2aWRlclwiPiogKiAqICogKjwvcD5cblx0XHQ8cD7igJxFYXN5LCBvbiBuby13aXNlLCBubyzigJ0gcXVvdGggSSw8L3A+XG5cdFx0PHA+4oCcV2hhdGXigJllciB3YXMgbWluZSwgSSBsYXRlbHkgc2FpZDwvcD5cblx0XHQ8cD5JcyBzb21lIG1pc3Rha2UsIG15IGNhbWFyYWRlPC9wPlxuXHRcdE9uZSBDaW5uYSZtZGFzaDtHYWl1cyZtZGFzaDtib3VnaHQgdGhlIGxvdCw8L3A+XG5cdFx0PHA+QnV0IGhpcyBvciBtaW5lLCBpdCBtYXR0ZXJzIHdoYXQ/PC9wPlxuXHRcdDxwPkkgdXNlIGl0IGZyZWVseSBhcyB0aG91Z2ggYm91Z2h0LDwvcD5cblx0XHQ8cD5ZZXQgdGhvdSwgcGVydCB0cm91YmxlciwgbW9zdCBhYnN1cmQsPC9wPlxuXHRcdDxwPk5vbmUgc3VmZmVy4oCZc3Qgc3BlYWsgYW4gaWRsZSB3b3JkLuKAnTwvcD5cblx0PC9kaXY+YFxuXHRdXG59O1xuIiwiLy8gY2F0dWxsdXNjYXJtaW5hL2J1cnRvbnNtaXRoZXJzcHJvc2UuanNcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRib29rbmFtZTogJ2NhdHVsbHVzY2FybWluYScsXG5cdGF1dGhvcjogJ0NhaXVzIFZhbGVyaXVzIENhdHVsbHVzJyxcblx0dHJhbnNsYXRpb25pZDpcImJ1cnRvbnNtaXRoZXJzcHJvc2VcIixcblx0dGl0bGU6ICdUaGUgQ2FybWluYScsXG5cdHRyYW5zbGF0aW9uOiB0cnVlLFxuXHRzb3VyY2U6IGA8YSBocmVmPVwiaHR0cDovL3d3dy5ndXRlbmJlcmcub3JnL2ZpbGVzLzIwNzMyLzIwNzMyLWgvMjA3MzItaC5odG1cIj5Qcm9qZWN0IEd1dGVuYmVyZzwvYT5gLFxuXHR0cmFuc2xhdGlvbnNob3J0bmFtZTpcIkJ1cnRvbi9TbWl0aGVycyBwcm9zZVwiLFxuXHR0cmFuc2xhdGlvbmZ1bGxuYW1lOlwiUmljaGFyZCBCdXJ0b24gJiBMZW9uYXJkIEMuIFNtaXRoZXJzIHByb3NlXCIsXG5cdHRyYW5zbGF0aW9uY2xhc3M6XCJwcm9zZVwiLFxuXHR0ZXh0OltgPHAgY2xhc3M9XCJ0aXRsZVwiPlRoZSBDYXJtaW5hPC9wPlxuXHQ8cCBjbGFzcz1cImF1dGhvclwiPlJpY2hhcmQgQnVydG9uICZhbXA7IExlb25hcmQgQy4gU21pdGhlcnM8L3A+XG5cdDxwIGNsYXNzPVwic3VidGl0bGVcIj4ocHJvc2UgdHJhbnNsYXRpb24pPC9wPmAsXG5cdGA8cCBjbGFzcz1cImNhbnRvaGVhZFwiPkkuPC9wPlxuXHQ8cCBjbGFzcz1cImNhbnRvc3ViaGVhZFwiPiZuYnNwOzwvcD5cblx0PHA+VG8gd2hvbSBpbnNjcmliZSBteSBkYWludHkgdG9tZeKAlGp1c3Qgb3V0IGFuZCB3aXRoIGFzaGVuIHB1bWljZSBwb2xpc2hlZD8gQ29ybmVsaXVzLCB0byB0aGVlISBmb3IgdGhvdSB3ZXJ0IHdvbnQgdG8gZGVlbSBteSB0cmlmbGluZ3Mgb2YgYWNjb3VudCwgYW5kIGF0IGEgdGltZSB3aGVuIHRob3UgYWxvbmUgb2YgSXRhbGlhbnMgZGlkc3QgZGFyZSB1bmZvbGQgdGhlIGFnZXPigJkgYWJzdHJhY3QgaW4gdGhyZWUgY2hyb25pY2xlc+KAlGxlYXJuZWQsIGJ5IEp1cGl0ZXIh4oCUYW5kIG1vc3QgbGFib3Jpb3VzbHkgd3JpdC4gV2hlcmVmb3JlIHRha2UgdGhvdSB0aGlzIGJvb2tsZXQsIHN1Y2ggYXMg4oCZdGlzLCBhbmQgTyBWaXJnaW4gUGF0cm9uZXNzLCBtYXkgaXQgb3V0bGl2ZSBnZW5lcmF0aW9ucyBtb3JlIHRoYW4gb25lLjwvcD5gLFxuXG5cdGA8cCBjbGFzcz1cImNhbnRvaGVhZFwiPklJLjwvcD5cblx0PHAgY2xhc3M9XCJjYW50b3N1YmhlYWRcIj4mbmJzcDs8L3A+XG5cdDxwPlNwYXJyb3csIHBldGxpbmcgb2YgbXkgZ2lybCwgd2l0aCB3aGljaCBzaGUgd2FudG9ucywgd2hpY2ggc2hlIHByZXNzZXMgdG8gaGVyIGJvc29tLCBhbmQgd2hvc2UgZWFnZXIgcGVja2luZ3MgaXMgYWNjdXN0b21lZCB0byBpbmNpdGUgYnkgc3RyZXRjaGluZyBmb3J0aCBoZXIgZm9yZWZpbmdlciwgd2hlbiBteSBicmlnaHQtaHVlZCBiZWF1dGlmdWwgb25lIGlzIHBsZWFzZWQgdG8gamVzdCBpbiBtYW5uZXIgbGlnaHQgYXMgKHBlcmNoYW5jZSkgYSBzb2xhY2UgZm9yIGhlciBoZWFydCBhY2hlLCB0aHVzIG1ldGhpbmtzIHNoZSBhbGxheXMgbG92ZeKAmXMgcHJlc3NpbmcgaGVhdHMhIFdvdWxkIHRoYXQgaW4gbWFubmVyIGxpa2UsIEkgd2VyZSBhYmxlIHdpdGggdGhlZSB0byBzcG9ydCBhbmQgc2FkIGNhcmVzIG9mIG1pbmQgdG8gbGlnaHRlbiE8L3A+YCxcblxuXHRgPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5JSUkuPC9wPlxuXHQ8cCBjbGFzcz1cImNhbnRvc3ViaGVhZFwiPiZuYnNwOzwvcD5cblx0PHA+TW91cm4geWUsIE8geWUgTG92ZXMgYW5kIEN1cGlkcyBhbmQgYWxsIG1lbiBvZiBncmFjaW91cyBtaW5kLiBEZWFkIGlzIHRoZSBzcGFycm93IG9mIG15IGdpcmwsIHNwYXJyb3csIHN3ZWV0bGluZyBvZiBteSBnaXJsLiBXaGljaCBtb3JlIHRoYW4gaGVyIGV5ZXMgc2hlIGxvdmVkOyBmb3Igc3dlZXQgYXMgaG9uZXkgd2FzIGl0IGFuZCBpdHMgbWlzdHJlc3Mga25ldywgYXMgd2VsbCBhcyBkYW1zZWwga25vd2V0aCBoZXIgb3duIG1vdGhlciBub3IgZnJvbSBoZXIgYm9zb20gZGlkIGl0IHJvdmUsIGJ1dCBob3BwaW5nIHJvdW5kIGZpcnN0IG9uZSBzaWRlIHRoZW4gdGhlIG90aGVyLCB0byBpdHMgbWlzdHJlc3MgYWxvbmUgaXQgZXZlcm1vcmUgZGlkIGNoaXJwLiBOb3cgZG9lcyBpdCBmYXJlIGFsb25nIHRoYXQgcGF0aCBvZiBzaGFkb3dzIHdoZW5jZSBuYXVnaHQgbWF5IGXigJllciByZXR1cm4uIElsbCBiZSB0byB5ZSwgc2F2YWdlIGdsb29tcyBvZiBPcmN1cywgd2hpY2ggc3dhbGxvdyB1cCBhbGwgdGhpbmdzIG9mIGZhaXJuZXNzOiB3aGljaCBoYXZlIHNuYXRjaGVkIGF3YXkgZnJvbSBtZSB0aGUgY29tZWx5IHNwYXJyb3cuIE8gZGVlZCBvZiBiYWxlISBPIHNwYXJyb3cgc2FkIG9mIHBsaWdodCEgTm93IG9uIHRoeSBhY2NvdW50IG15IGdpcmzigJlzIHN3ZWV0IGV5ZXMsIHN3b2xsZW4sIGRvIHJlZGRlbiB3aXRoIHRlYXItZHJvcHMuPC9wPmAsXG5cblx0YDxwIGNsYXNzPVwiY2FudG9oZWFkXCI+SUlJSS48L3A+XG5cdDxwIGNsYXNzPVwiY2FudG9zdWJoZWFkXCI+Jm5ic3A7PC9wPlxuXHQ8cD5UaGF0IHBpbm5hY2Ugd2hpY2ggeWUgc2VlLCBteSBmcmllbmRzLCBzYXlzIHRoYXQgaXQgd2FzIHRoZSBzcGVlZGllc3Qgb2YgYm9hdHMsIG5vciBhbnkgY3JhZnQgdGhlIHN1cmZhY2Ugc2tpbW1pbmcgYnV0IGl0IGNvdWxkIGdhaW4gdGhlIGxlYWQsIHdoZXRoZXIgdGhlIGNvdXJzZSB3ZXJlIGdvbmUgb+KAmWVyIHdpdGggcGxhc2hpbmcgb2FycyBvciBiZW5kZWQgc2FpbC4gQW5kIHRoaXMgdGhlIG1lbmFjaW5nIEFkcmlhdGljIHNob3JlcyBtYXkgbm90IGRlbnksIG5vciBtYXkgdGhlIElzbGFuZCBDeWNsYWRlcywgbm9yIG5vYmxlIFJob2RlcyBhbmQgYnJpc3RsaW5nIFRocmFjZSwgUHJvcG9udGlzIG5vciB0aGUgZ3VzdHkgUG9udGljIGd1bGYsIHdoZXJlIGl0c2VsZiAoYWZ0ZXJ3YXJkcyBhIHBpbm5hY2UgdG8gYmVjb21lKSBlcnN0d2hpbGUgd2FzIGEgZm9saWFnZWQgY2x1bXA7IGFuZCBvZnQgb24gQ3l0b3J1c+KAmSByaWRnZSBoYXRoIHRoaXMgZm9saWFnZSBhbm5vdW5jZWQgaXRzZWxmIGluIHZvY2FsIHJ1c3RsaW5nLiBBbmQgdG8gdGhlZSwgUG9udGljIEFtYXN0cmlzLCBhbmQgdG8gYm94LXNjcmVlbmVkIEN5dG9ydXMsIHRoZSBwaW5uYWNlIHZvd3MgdGhhdCB0aGlzIHdhcyBhbHdheSBhbmQgeWV0IGlzIG9mIGNvbW1vbiBrbm93bGVkZ2UgbW9zdCBub3RvcmlvdXM7IHN0YXRlcyB0aGF0IGZyb20gaXRzIHByaW1hbCBiZWluZyBpdCBzdG9vZCB1cG9uIHRoeSB0b3Btb3N0IHBlYWssIGRpcHBlZCBpdHMgb2FycyBpbiB0aHkgd2F0ZXJzLCBhbmQgYm9yZSBpdHMgbWFzdGVyIHRoZW5jZSB0aHJvdWdoIHN1cmx5IHNlYXMgb2YgbnVtYmVyIGZyZXF1ZW50LCB3aGV0aGVyIHRoZSB3aW5kIHdoaXN0bGVkIOKAmWdhaW5zdCB0aGUgc3RhcmJvYXJkIHF1YXJ0ZXIgb3IgdGhlIGxlZSBvciB3aGV0aGVyIEpvdmUgcHJvcGl0aW91cyBmZWxsIG9uIGJvdGggdGhlIHNoZWV0cyBhdCBvbmNlOyBub3IgYW55IHZvd3MgW2Zyb20gc3RyZXNzIG9mIHN0b3JtXSB0byBzaG9yZS1nb2RzIHdlcmUgZXZlciBtYWRlIGJ5IGl0IHdoZW4gY29taW5nIGZyb20gdGhlIHV0dGVybW9zdCBzZWFzIHVudG8gdGhpcyBnbGFzc3kgbGFrZS4gQnV0IHRoZXNlIHRoaW5ncyB3ZXJlIG9mIHRpbWUgZ29uZSBieTogbm93IGxhaWQgYXdheSwgaXQgcnVzdHMgaW4gcGVhY2UgYW5kIGRlZGljYXRlcyBpdHMgYWdlIHRvIHRoZWUsIHR3aW4gQ2FzdG9yLCBhbmQgdG8gQ2FzdG9y4oCZcyB0d2luLjwvcD5gLFxuXG5cdGA8cCBjbGFzcz1cImNhbnRvaGVhZFwiPlYuPC9wPlxuXHQ8cCBjbGFzcz1cImNhbnRvc3ViaGVhZFwiPiZuYnNwOzwvcD5cblx0PHA+TGV0IHVzIGxpdmUsIG15IExlc2JpYSwgYW5kIGxldCB1cyBsb3ZlLCBhbmQgY291bnQgYWxsIHRoZSBtdW1ibGluZ3Mgb2Ygc291ciBhZ2UgYXQgYSBwZW5ueeKAmXMgZmVlLiBTdW5zIHNldCBjYW4gcmlzZSBhZ2Fpbjogd2Ugd2hlbiBvbmNlIG91ciBicmllZiBsaWdodCBoYXMgc2V0IG11c3Qgc2xlZXAgdGhyb3VnaCBhIHBlcnBldHVhbCBuaWdodC4gR2l2ZSBtZSBvZiBraXNzZXMgYSB0aG91c2FuZCwgYW5kIHRoZW4gYSBodW5kcmVkLCB0aGVuIGFub3RoZXIgdGhvdXNhbmQsIHRoZW4gYSBzZWNvbmQgaHVuZHJlZCwgdGhlbiBhbm90aGVyIHRob3VzYW5kIHdpdGhvdXQgcmVzdGluZywgdGhlbiBhIGh1bmRyZWQuIFRoZW4sIHdoZW4gd2UgaGF2ZSBtYWRlIG1hbnkgdGhvdXNhbmRzLCB3ZSB3aWxsIGNvbmZ1c2UgdGhlIGNvdW50IGxlc3Qgd2Uga25vdyB0aGUgbnVtYmVyaW5nLCBzbyB0aGF0IG5vIHdyZXRjaCBtYXkgYmUgYWJsZSB0byBlbnZ5IHVzIHRocm91Z2gga25vd2xlZGdlIG9mIG91ciBraXNzZXPigJkgbnVtYmVyLjwvcD5gLFxuXG5cdGA8cCBjbGFzcz1cImNhbnRvaGVhZFwiPlZJLjwvcD5cblx0PHAgY2xhc3M9XCJjYW50b3N1YmhlYWRcIj4mbmJzcDs8L3A+XG5cdDxwPk8gRmxhdml1cywgb2YgdGh5IHN3ZWV0aGVhcnQgdG8gQ2F0dWxsdXMgdGhvdSB3b3VsZOKAmXN0IHNwZWFrLCBub3IgY291bGTigJlzdCB0aG91IGtlZXAgc2lsZW50LCB3ZXJlIHNoZSBub3QgYm90aCBpbGwtbWFubmVyZWQgYW5kIHVuZ3JhY2VmdWwuIEluIHRydXRoIHRob3UgYWZmZWN0ZXN0IEkga25vdyBub3Qgd2hhdCBob3QtYmxvb2RlZCB3aG9yZTogdGhpcyB0aG91IGFydCBhc2hhbWVkIHRvIG93bi4gRm9yIHRoYXQgdGhvdSBkb3N0IG5vdCBsaWUgYWxvbmUgYS1uaWdodHMgdGh5IGNvdWNoLCBmcmFncmFudCB3aXRoIGdhcmxhbmRzIGFuZCBTeXJpYW4gdW5ndWVudCwgaW4gbm8gd2F5IG11dGUgY3JpZXMgb3V0LCBhbmQgZWtlIHRoZSBwaWxsb3cgYW5kIGJvbHN0ZXJzIGluZGVudGVkIGhlcmUgYW5kIHRoZXJlLCBhbmQgdGhlIGNyZWFraW5ncyBhbmQgam9nZ2luZ3Mgb2YgdGhlIHF1aXZlcmluZyBiZWQ6IHVubGVzcyB0aG91IGNhbnN0IHNpbGVuY2UgdGhlc2UsIG5vdGhpbmcgYW5kIGFnYWluIG5vdGhpbmcgYXZhaWxzIHRoZWUgdG8gaGlkZSB0aHkgd2hvcmVkb21zLiBBbmQgd2h5PyBUaG91IHdvdWxkc3Qgbm90IGRpc3BsYXkgc3VjaCBkcmFpbsOoZCBmbGFua3MgdW5sZXNzIG9jY3VwaWVkIGluIHNvbWUgdG9tZm9vbGVyeS4gV2hlcmVmb3JlLCB3aGF0c29ldmVyIHRob3UgaGFzdCwgYmUgaXQgZ29vZCBvciBpbGwsIHRlbGwgdXMhIEkgd2lzaCB0byBsYXVkIHRoZWUgYW5kIHRoeSBsb3ZlcyB0byB0aGUgc2t5IGluIGpveW91cyB2ZXJzZS48L3A+YCxcblxuXHRgPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5WSUkuPC9wPlxuXHQ8cCBjbGFzcz1cImNhbnRvc3ViaGVhZFwiPiZuYnNwOzwvcD5cblx0PHA+VGhvdSBhc2tlc3QsIGhvdyBtYW55IGtpc3NlcyBvZiB0aGluZSwgTGVzYmlhLCBtYXkgYmUgZW5vdWdoIGFuZCB0byBzcGFyZSBmb3IgbWUuIEFzIHRoZSBjb3VudGxlc3MgTGlieWFuIHNhbmRzIHdoaWNoIHN0cmV3IHRoZSBzcGljeSBzdHJhbmQgb2YgQ3lyZW5lIOKAmXR3aXh0IHRoZSBvcmFjbGUgb2Ygc3dlbHTigJlyaW5nIEpvdmUgYW5kIHRoZSBzYWNyZWQgc2VwdWxjaHJlIG9mIGFuY2llbnQgQmF0dHVzLCBvciBhcyB0aGUgdGhyb25naW5nIHN0YXJzIHdoaWNoIGluIHRoZSBodXNoIG9mIGRhcmtuZXNzIHdpdG5lc3MgdGhlIGZ1cnRpdmUgbG92ZXMgb2YgbW9ydGFscywgdG8ga2lzcyB0aGVlIHdpdGgga2lzc2VzIG9mIHNvIGdyZWF0IGEgbnVtYmVyIGlzIGVub3VnaCBhbmQgdG8gc3BhcmUgZm9yIHBhc3Npb24tZHJpdmVuIENhdHVsbHVzOiBzbyBtYW55IHRoYXQgcHJ5aW5nIGV5ZXMgbWF5IG5vdCBhdmFpbCB0byBudW1iZXIsIG5vciBpbGwgdG9uZ3VlcyB0byBlbnNvcmNlbC48L3A+YCxcblxuXHRgPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5WSUlJLjwvcD5cblx0PHAgY2xhc3M9XCJjYW50b3N1YmhlYWRcIj4mbmJzcDs8L3A+XG5cdDxwPlVuaGFwcHkgQ2F0dWxsdXMsIGNlYXNlIHRoeSB0cmlmbGluZyBhbmQgd2hhdCB0aG91IHNlZXN0IGxvc3Qga25vdyB0byBiZSBsb3N0LiBPbmNlIGJyaWdodCBkYXlzIHVzZWQgdG8gc2hpbmUgb24gdGhlZSB3aGVuIHRob3Ugd2VydCB3b250IHRvIGhhc3RlIHdoaXRoZXIgdGh5IGdpcmwgZGlkc3QgbGVhZCB0aGVlLCBsb3ZlZCBieSB1cyBhcyBuZXZlciBnaXJsIHdpbGwgZeKAmWVyIGJlIGxvdmVkLiBUaGVyZSB0aG9zZSBtYW55IGpveXMgd2VyZSBqb3llZCB3aGljaCB0aG91IGRpZHN0IHdpc2gsIG5vciB3YXMgdGhlIGdpcmwgdW53aWxsaW5nLiBJbiB0cnV0aCBicmlnaHQgZGF5cyB1c2VkIG9uY2UgdG8gc2hpbmUgb24gdGhlZS4gTm93IHNoZSBubyBsb25nZXIgd2lzaGVzOiB0aG91IHRvbywgcG93ZXJsZXNzIHRvIGF2YWlsLCBtdXN0IGJlIHVud2lsbGluZywgbm9yIHB1cnN1ZSB0aGUgcmV0cmVhdGluZyBvbmUsIG5vciBsaXZlIHVuaGFwcHksIGJ1dCB3aXRoIGZpcm0tc2V0IG1pbmQgZW5kdXJlLCBzdGVlbCB0aHlzZWxmLiBGYXJld2VsbCwgZ2lybCwgbm93IENhdHVsbHVzIHN0ZWVscyBoaW1zZWxmLCBzZWVrcyB0aGVlIG5vdCwgbm9yIGVudHJlYXRzIHRoeSBhY3F1aWVzY2VuY2UuIEJ1dCB0aG91IHdpbHQgcGluZSwgd2hlbiB0aG91IGhhc3Qgbm8gZW50cmVhdHkgcHJvZmZlcmVkLiBGYWl0aGxlc3MsIGdvIHRoeSB3YXkhIHdoYXQgbWFubmVyIG9mIGxpZmUgcmVtYWluZXRoIHRvIHRoZWU/IHdobyBub3cgd2lsbCB2aXNpdCB0aGVlPyB3aG8gZmluZCB0aGVlIGJlYXV0aWZ1bD8gd2hvbSB3aWx0IHRob3UgbG92ZSBub3c/IHdob3NlIGdpcmwgd2lsdCB0aG91IGJlIGNhbGxlZD8gd2hvbSB3aWx0IHRob3Uga2lzcz8gd2hvc2UgbGlwcyB3aWx0IHRob3UgYml0ZT8gQnV0IHRob3UsIENhdHVsbHVzLCByZW1haW4gaGFyZGVuZWQgYXMgc3RlZWwuPC9wPmAsXG5cblx0YDxwIGNsYXNzPVwiY2FudG9oZWFkXCI+VklJSUkuPC9wPlxuXHQ8cCBjbGFzcz1cImNhbnRvc3ViaGVhZFwiPiZuYnNwOzwvcD5cblx0PHA+VmVyYW5pdXMsIG9mIGFsbCBteSBmcmllbmRzIHN0YW5kaW5nIGluIHRoZSBmcm9udCwgb3duZWQgSSB0aHJlZSBodW5kcmVkIHRob3VzYW5kcyBvZiB0aGVtLCBoYXN0IHRob3UgY29tZSBob21lIHRvIHRoeSBQZW5hdGVzLCB0aHkgbG9uZ2luZyBicm90aGVycyBhbmQgdGhpbmUgYWdlZCBtb3RoZXI/IFRob3UgaGFzdCBjb21lIGJhY2suIE8gam95ZnVsIG5ld3MgdG8gbWUhIEkgbWF5IHNlZSB0aGVlIHNhZmUgYW5kIHNvdW5kLCBhbmQgbWF5IGhlYXIgdGhlZSBzcGVhayBvZiByZWdpb25zLCBkZWVkcywgYW5kIHBlb3BsZXMgSWJlcmlhbiwgYXMgaXMgdGh5IG1hbm5lcjsgYW5kIHJlY2xpbmluZyBv4oCZZXIgdGh5IG5lY2sgc2hhbGwga2lzcyB0aHkgam9jdW5kIG1vdXRoIGFuZCBleWVzLiBPIGFsbCB5ZSBibGlzc2Z1bGxlc3Qgb2YgbWVuLCB3aG8gbW9yZSBnbGFkc29tZSBvciBtb3JlIGJsaXNzZnVsIGlzIHRoYW4gSSBhbT88L3A+YCxcblxuXHRgPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5YLjwvcD5cblx0PHAgY2xhc3M9XCJjYW50b3N1YmhlYWRcIj4mbmJzcDs8L3A+XG5cdDxwPlZhcnVzIGRyZXcgbWUgb2ZmIHRvIHNlZSBoaXMgbWlzdHJlc3MgYXMgSSB3YXMgc3Ryb2xsaW5nIGZyb20gdGhlIEZvcnVtOiBhIGxpdHRsZSB3aG9yZSwgYXMgaXQgc2VlbWVkIHRvIG1lIGF0IHRoZSBmaXJzdCBnbGFuY2UsIG5laXRoZXIgaW5lbGVnYW50IG5vciBsYWNraW5nIGdvb2QgbG9va3MuIFdoZW4gd2UgY2FtZSBpbiwgd2UgZmVsbCB0byBkaXNjdXNzaW5nIHZhcmlvdXMgc3ViamVjdHMsIGFtb25nc3Qgd2hpY2gsIGhvdyB3YXMgQml0aHluaWEgbm93LCBob3cgdGhpbmdzIGhhZCBnb25lIHRoZXJlLCBhbmQgd2hldGhlciBJIGhhZCBtYWRlIGFueSBtb25leSB0aGVyZS4gSSByZXBsaWVkLCB3aGF0IHdhcyB0cnVlLCB0aGF0IG5laXRoZXIgb3Vyc2VsdmVzIG5vciB0aGUgcHImYWVsaWc7dG9ycyBub3IgdGhlaXIgc3VpdGUgaGFkIGJyb3VnaHQgYXdheSBhbnl0aGluZyB3aGVyZWJ5IHRvIGZsYXVudCBhIGJldHRlci1zY2VudGVkIHBvbGwsIGVzcGVjaWFsbHkgYXMgb3VyIHByJmFlbGlnO3RvciwgdGhlIGlycnVtYXRpbmcgYmVhc3QsIGNhcmVkIG5vdCBhIHNpbmdsZSBoYWlyIGZvciBoaXMgc3VpdGUuIOKAnEJ1dCBzdXJlbHks4oCdIHNoZSBzYWlkLCDigJx5b3UgZ290IHNvbWUgbWVuIHRvIGJlYXIgeW91ciBsaXR0ZXIsIGZvciB0aGV5IGFyZSBzYWlkIHRvIGdyb3cgdGhlcmU/4oCdIEksIHRvIG1ha2UgbXlzZWxmIGFwcGVhciB0byB0aGUgZ2lybCBhcyBvbmUgb2YgdGhlIGZvcnR1bmF0ZSwg4oCcTmF5LOKAnSBJIHNheSwg4oCcaXQgZGlkIG5vdCBnbyB0aGF0IGJhZGx5IHdpdGggbWUsIGlsbCBhcyB0aGUgcHJvdmluY2UgdHVybmVkIG91dCwgdGhhdCBJIGNvdWxkIG5vdCBwcm9jdXJlIGVpZ2h0IHN0cmFwcGluZyBrbmF2ZXMgdG8gYmVhciBtZS7igJ0gKEJ1dCBub3QgYSBzaW5nbGUgb25lIHdhcyBtaW5lIGVpdGhlciBoZXJlIG9yIHRoZXJlIHdobyB0aGUgZnJhY3R1cmVkIGZvb3Qgb2YgbXkgb2xkIGJlZHN0ZWFkIGNvdWxkIGhvaXN0IG9uIGhpcyBuZWNrLikgQW5kIHNoZSwgbGlrZSBhIHBhdGhpYyBnaXJsLCDigJxJIHByYXkgdGhlZSzigJ0gc2F5cyBzaGUsIOKAnGxlbmQgbWUsIG15IENhdHVsbHVzLCB0aG9zZSBiZWFyZXJzIGZvciBhIHNob3J0IHRpbWUsIGZvciBJIHdpc2ggdG8gYmUgYm9ybmUgdG8gdGhlIHNocmluZSBvZiBTZXJhcGlzLuKAnSDigJxTdGF5LOKAnSBxdW90aCBJIHRvIHRoZSBnaXJsLCDigJx3aGVuIEkgc2FpZCBJIGhhZCB0aGlzLCBteSB0b25ndWUgc2xpcHBlZDsgbXkgZnJpZW5kLCBDaW5uYSBHYWl1cywgaGUgcHJvdmlkZWQgaGltc2VsZiB3aXRoIHRoZXNlLiBJbiB0cnV0aCwgd2hldGhlciBoaXMgb3IgbWluZSZtZGFzaDt3aGF0IGRvIEkgdHJvdWJsZT8gSSB1c2UgdGhlbSBhcyB0aG91Z2ggSSBoYWQgcGFpZCBmb3IgdGhlbS4gQnV0IHRob3UsIGluIGlsbCBtYW5uZXIgd2l0aCBmb29saXNoIHRlYXNpbmcgZG9zdCBub3QgYWxsb3cgbWUgdG8gYmUgaGVlZGxlc3Mu4oCdPC9wYCxcblx0XVxufTtcbiIsIi8vIGNhdHVsbHVzY2FybWluYS9jYXR1bGx1cy5qc1xuXG5cInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGJvb2tuYW1lOiAnY2F0dWxsdXNjYXJtaW5hJyxcblx0YXV0aG9yOiAnQ2FpdXMgVmFsZXJpdXMgQ2F0dWxsdXMnLFxuXHR0cmFuc2xhdGlvbmlkOlwiY2F0dWxsdXNcIixcblx0dGl0bGU6ICdUaGUgQ2FybWluYScsXG5cdHRyYW5zbGF0aW9uOiBmYWxzZSxcblx0c291cmNlOiBgPGEgaHJlZj1cImh0dHA6Ly93d3cuZ3V0ZW5iZXJnLm9yZy9maWxlcy8yMDczMi8yMDczMi1oLzIwNzMyLWguaHRtXCI+UHJvamVjdCBHdXRlbmJlcmc8L2E+YCxcblx0dHJhbnNsYXRpb25zaG9ydG5hbWU6XCJDYXR1bGx1c1wiLFxuXHR0cmFuc2xhdGlvbmZ1bGxuYW1lOlwiQ2FpdXMgVmFsZXJpdXMgQ2F0dWxsdXNcIixcblx0dHJhbnNsYXRpb25jbGFzczpcInBvZXRyeVwiLFxuXHR0ZXh0OltgPHAgY2xhc3M9XCJ0aXRsZVwiPlRoZSBDYXJtaW5hPC9wPlxuXHQ8cCBjbGFzcz1cImF1dGhvclwiPkNhaXVzIFZhbGVyaXVzIENhdHVsbHVzPC9wPmAsXG5cdGA8cCBjbGFzcz1cImNhbnRvaGVhZFwiPkkuPC9wPlxuXHQ8cCBjbGFzcz1cImNhbnRvc3ViaGVhZFwiPiZuYnNwOzwvcD5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPlF1b2kgZG9ubyBsZXBpZHVtIG5vdm9tIGxpYmVsbHVtPC9wPlxuXHRcdDxwPkFyaWRhIG1vZG8gcHVtaWNlIGV4cG9saXR1bT88L3A+XG5cdFx0PHA+Q29ybmVsaSwgdGliaTogbmFtcXVlIHR1IHNvbGViYXM8L3A+XG5cdFx0PHA+TWVhcyBlc3NlIGFsaXF1aWQgcHV0YXJlIG51Z2FzLDwvcD5cblx0XHQ8cD5JYW0gdHVtIGN1bSBhdXN1cyBlcyB1bnVzIEl0YWxvcnVtPC9wPlxuXHRcdDxwPk9tbmUgJmFlbGlnO3Z1bSB0cmlidXMgZXhwbGljYXJlIGNoYXJ0aXM8L3A+XG5cdFx0PHA+RG9jdGlzLCBJdXBwaXRlciwgZXQgbGFib3Jpb3Npcy48L3A+XG5cdFx0PHA+UXVhcmUgaGFiZSB0aWJpIHF1aWRxdWlkIGhvYyBsaWJlbGxpLDwvcD5cblx0XHQ8cD5RdWFsZWN1bXF1ZSwgcXVvZCBvIHBhdHJvbmEgdmlyZ28sPC9wPlxuXHRcdDxwPlBsdXMgdW5vIG1hbmVhdCBwZXJlbm5lIHMmYWVsaWc7Y2xvLjwvcD5cblx0PC9kaXY+YCxcblx0YDxwIGNsYXNzPVwiY2FudG9oZWFkXCI+SUkuPC9wPlxuXHQ8cCBjbGFzcz1cImNhbnRvc3ViaGVhZFwiPiZuYnNwOzwvcD5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPlBhc3NlciwgZGVsaWNpJmFlbGlnOyBtZSZhZWxpZzsgcHVlbGwmYWVsaWc7LDwvcD5cblx0XHQ8cD5RdWljdW0gbHVkZXJlLCBxdWVtIGluIHNpbnUgdGVuZXJlLDwvcD5cblx0XHQ8cD5RdW9pIHByaW11bSBkaWdpdHVtIGRhcmUgYWRwZXRlbnRpPC9wPlxuXHRcdDxwPkV0IGFjcmlzIHNvbGV0IGluY2l0YXJlIG1vcnN1cyw8L3A+XG5cdFx0PHA+Q3VtIGRlc2lkZXJpbyBtZW8gbml0ZW50aTwvcD5cblx0XHQ8cD5DYXJ1bSBuZXNjaW9xdWlkIGxpYmV0IGlvY2FyaTwvcD5cblx0XHQ8cD5WdCBzb2xhY2lvbHVtIHN1aSBkb2xvcmlzLDwvcD5cblx0XHQ8cD5DcmVkbyB1dCBpYW0gZ3JhdmlzIGFjcXVpZXNjYXQgYXJkb3I6PC9wPlxuXHRcdDxwPlRlY3VtIGx1ZGVyZSBzaWN1dCBpcHNhIHBvc3NlbTwvcD5cblx0XHQ8cD5FdCB0cmlzdGlzIGFuaW1pIGxldmFyZSBjdXJhcyE8L3A+XG5cdFx0PHAgY2xhc3M9XCJkaXZpZGVyXCI+KiAqICogKiAqPC9wPlxuXHRcdDxwPlRhbSBncmF0dW1zdCBtaWhpIHF1YW0gZmVydW50IHB1ZWxsJmFlbGlnOzwvcD5cblx0XHQ8cD5QZXJuaWNpIGF1cmVvbHVtIGZ1aXNzZSBtYWx1bSw8L3A+XG5cdFx0PHA+UXVvZCB6b25hbSBzb2x1aXQgZGl1IGxpZ2F0YW0uPC9wPlxuXHRcdDwvZGl2PmAsXG5cblx0YDxwIGNsYXNzPVwiY2FudG9oZWFkXCI+SUlJLjwvcD5cblx0PHAgY2xhc3M9XCJjYW50b3N1YmhlYWRcIj4mbmJzcDs8L3A+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cbiAgICA8cD5MdWdldGUsIG8gVmVuZXJlcyBDdXBpZGluZXNxdWUsPC9wPlxuICAgIDxwPkV0IHF1YW50dW1zdCBob21pbnVtIHZlbnVzdGlvcnVtLjwvcD5cbiAgICA8cD5QYXNzZXIgbW9ydHV1cyBlc3QgbWUmYWVsaWc7IHB1ZWxsJmFlbGlnOyw8L3A+XG4gICAgPHA+UGFzc2VyLCBkZWxpY2kmYWVsaWc7IG1lJmFlbGlnOyBwdWVsbCZhZWxpZzssPC9wPlxuICAgIDxwPlF1ZW0gcGx1cyBpbGxhIG9jdWxpcyBzdWlzIGFtYWJhdDo8L3A+XG4gICAgPHA+TmFtIG1lbGxpdHVzIGVyYXQgc3VhbXF1ZSBub3JhdDwvcD5cbiAgICA8cD5JcHNhIHRhbSBiZW5lIHF1YW0gcHVlbGxhIG1hdHJlbTwvcD5cbiAgICA8cD5OZWMgc2VzZSBhIGdyZW1pbyBpbGxpdXMgbW92ZWJhdCw8L3A+XG4gICAgPHA+U2VkIGNpcmN1bXNpbGllbnMgbW9kbyBodWMgbW9kbyBpbGx1YzwvcD5cbiAgICA8cD5BZCBzb2xhbSBkb21pbmFtIHVzcXVlIHBpcGlhYmF0LjwvcD5cbiAgICA8cD5RdWkgbnVuYyBpdCBwZXIgaXRlciB0ZW5lYnJpY29zdW08L3A+XG4gICAgPHA+SWxsdWMsIHVuZGUgbmVnYW50IHJlZGlyZSBxdWVtcXVhbS48L3A+XG4gICAgPHA+QXQgdm9iaXMgbWFsZSBzaXQsIG1hbCZhZWxpZzsgdGVuZWJyJmFlbGlnOzwvcD5cbiAgICA8cD5PcmNpLCBxdSZhZWxpZzsgb21uaWEgYmVsbGEgZGV2b3JhdGlzOjwvcD5cbiAgICA8cD5UYW0gYmVsbHVtIG1paGkgcGFzc2VyZW0gYWJzdHVsaXN0aXMuPC9wPlxuICAgIDxwPk8gZmFjdHVtIG1hbGUhIGlvIG1pc2VsbGUgcGFzc2VyITwvcD5cbiAgICA8cD5UdWEgbnVuYyBvcGVyYSBtZSZhZWxpZzsgcHVlbGwmYWVsaWc7PC9wPlxuICAgIDxwPkZsZW5kbyB0dXJnaWR1bGkgcnViZW50IG9jZWxsaS48L3A+XG4gIDwvZGl2PmAsXG5cblx0YDxwIGNsYXNzPVwiY2FudG9oZWFkXCI+SUlJSS48L3A+XG5cdDxwIGNsYXNzPVwiY2FudG9zdWJoZWFkXCI+Jm5ic3A7PC9wPlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UGhhc2VsdXMgaWxsZSwgcXVlbSB2aWRldGlzLCBob3NwaXRlcyw8L3A+XG4gICAgPHA+QWl0IGZ1aXNzZSBuYXZpdW0gY2VsZXJyaW11cyw8L3A+XG4gICAgPHA+TmVxdWUgdWxsaXVzIG5hdGFudGlzIGltcGV0dW0gdHJhYmlzPC9wPlxuICAgIDxwPk5lcXVpc3NlIHByJmFlbGlnO3RlciBpcmUsIHNpdmUgcGFsbXVsaXM8L3A+XG4gICAgPHA+T3B1cyBmb3JldCB2b2xhcmUgc2l2ZSBsaW50ZW8uPC9wPlxuICAgIDxwPkV0IGhvYyBuZWdhdCBtaW5hY2lzIEFkcmlhdGljaTwvcD5cbiAgICA8cD5OZWdhcmUgbGl0dXMgaW5zdWxhc3ZlIEN5Y2xhZGFzPC9wPlxuICAgIDxwPlJob2R1bXF1ZSBub2JpbGVtIGhvcnJpZGFtcXVlIFRocmFjaWFtPC9wPlxuICAgIDxwPlByb3BvbnRpZGEgdHJ1Y2VtdmUgUG9udGljdW0gc2ludW0sPC9wPlxuICAgIDxwPlZiaSBpc3RlIHBvc3QgcGhhc2VsdXMgYW50ZWEgZnVpdDwvcD5cbiAgICA8cD5Db21hdGEgc2lsdmE6IG5hbSBDeXRvcmlvIGluIGl1Z288L3A+XG4gICAgPHA+TG9xdWVudGUgcyZhZWxpZztwZSBzaWJpbHVtIGVkaWRpdCBjb21hLjwvcD5cbiAgICA8cD5BbWFzdHJpIFBvbnRpY2EgZXQgQ3l0b3JlIGJ1eGlmZXIsPC9wPlxuICAgIDxwPlRpYmkgaCZhZWxpZztjIGZ1aXNzZSBldCBlc3NlIGNvZ25pdGlzc2ltYTwvcD5cbiAgICA8cD5BaXQgcGhhc2VsdXM6IHVsdGltYSBleCBvcmlnaW5lPC9wPlxuICAgIDxwPlR1byBzdGV0aXNzZSBkaWNpdCBpbiBjYWN1bWluZSw8L3A+XG4gICAgPHA+VHVvIGltYnVpc3NlIHBhbG11bGFzIGluICZhZWxpZztxdW9yZSw8L3A+XG4gICAgPHA+RXQgaW5kZSB0b3QgcGVyIGlucG90ZW50aWEgZnJldGE8L3A+XG4gICAgPHA+RXJ1bSB0dWxpc3NlLCBsJmFlbGlnO3ZhIHNpdmUgZGV4dGVyYTwvcD5cbiAgICA8cD5Wb2NhcmV0IGF1cmEsIHNpdmUgdXRydW1xdWUgSXVwcGl0ZXI8L3A+XG4gICAgPHA+U2ltdWwgc2VjdW5kdXMgaW5jaWRpc3NldCBpbiBwZWRlbTs8L3A+XG4gICAgPHA+TmVxdWUgdWxsYSB2b3RhIGxpdG9yYWxpYnVzIGRlaXM8L3A+XG4gICAgPHA+U2liaSBlc3NlIGZhY3RhLCBjdW0gdmVuaXJldCBhIG1hcmVpPC9wPlxuICAgIDxwPk5vdmlzc2ltZSBodW5jIGFkIHVzcXVlIGxpbXBpZHVtIGxhY3VtLjwvcD5cbiAgICA8cD5TZWQgaCZhZWxpZztjIHByaXVzIGZ1ZXJlOiBudW5jIHJlY29uZGl0YTwvcD5cbiAgICA8cD5TZW5ldCBxdWlldGUgc2VxdWUgZGVkaWNhdCB0aWJpLDwvcD5cbiAgICA8cD5HZW1lbGxlIENhc3RvciBldCBnZW1lbGxlIENhc3RvcmlzLjwvcD5cblx0PC9kaXY+YCxcblxuXHRgPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5WLjwvcD5cblx0PHAgY2xhc3M9XCJjYW50b3N1YmhlYWRcIj4mbmJzcDs8L3A+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5WaXZhbXVzLCBtZWEgTGVzYmlhLCBhdHF1ZSBhbWVtdXMsPC9wPlxuICAgIDxwPlJ1bW9yZXNxdWUgc2VudW0gc2V2ZXJpb3J1bTwvcD5cbiAgICA8cD5PbW5lcyB1bml1cyAmYWVsaWc7c3RpbWVtdXMgYXNzaXMuPC9wPlxuICAgIDxwPlNvbGVzIG9jY2lkZXJlIGV0IHJlZGlyZSBwb3NzdW50OjwvcD5cbiAgXHQ8cD5Ob2JpcyBjdW0gc2VtZWwgb2NjaWRpdCBicmV2aXMgbHV4LDwvcD5cbiAgICA8cD5Ob3ggZXN0IHBlcnBldHVhIHVuYSBkb3JtaWVuZGEuPC9wPlxuICAgIDxwPkRhIG1pIGJhc2lhIG1pbGxlLCBkZWluZGUgY2VudHVtLDwvcD5cbiAgICA8cD5EZWluIG1pbGxlIGFsdGVyYSwgZGVpbiBzZWN1bmRhIGNlbnR1bSw8L3A+XG4gICAgPHA+RGVpbmRlIHVzcXVlIGFsdGVyYSBtaWxsZSwgZGVpbmRlIGNlbnR1bS48L3A+XG4gICAgPHA+RGVpbiwgY3VtIG1pbGlhIG11bHRhIGZlY2VyaW11cyw8L3A+XG4gICAgPHA+Q29udHVyYmFiaW11cyBpbGxhLCBuZSBzY2lhbXVzLDwvcD5cbiAgICA8cD5BdXQgbmVxdWlzIG1hbHVzIGludmlkZXJlIHBvc3NpdCw8L3A+XG4gICAgPHA+Q3VtIHRhbnR1bSBzY2lldCBlc3NlIGJhc2lvcnVtLjwvcD5cblx0PC9kaXY+YCxcblxuXHRgPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5WSS48L3A+XG5cdDxwIGNsYXNzPVwiY2FudG9zdWJoZWFkXCI+Jm5ic3A7PC9wPlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RmxhdmksIGRlbGljaWFzIHR1YXMgQ2F0dWxsbyw8L3A+XG4gICAgPHA+TmVpIHNpbnQgaW5sZXBpZCZhZWxpZzsgYXRxdWUgaW5lbGVnYW50ZXMsPC9wPlxuICAgIDxwPlZlbGxlcyBkaWNlcmUsIG5lYyB0YWNlcmUgcG9zc2VzLjwvcD5cbiAgICA8cD5WZXJ1bSBuZXNjaW9xdWlkIGZlYnJpY3Vsb3NpPC9wPlxuICAgIDxwPlNjb3J0aSBkaWxpZ2lzOiBob2MgcHVkZXQgZmF0ZXJpLjwvcD5cbiAgICA8cD5OYW0gdGUgbm9uIHZpZHVhcyBpYWNlcmUgbm9jdGVzPC9wPlxuICAgIDxwPk5lcXVpcXVhbSB0YWNpdHVtIGN1YmlsZSBjbGFtYXQ8L3A+XG4gICAgPHA+U2VydGlzIGFjIFN5cmlvIGZyYWdyYW5zIG9saXZvLDwvcD5cbiAgICA8cD5QdWx2aW51c3F1ZSBwZXImYWVsaWc7cXVlIGV0IGhpYyBldCBpbGxlPC9wPlxuICAgIDxwPkF0dHJpdHVzLCB0cmVtdWxpcXVlIHF1YXNzYSBsZWN0aTwvcD5cbiAgICA8cD5Bcmd1dGF0aW8gaW5hbWJ1bGF0aW9xdWUuPC9wPlxuICAgIDxwPk5hbSBuaWwgc3R1cHJhIHZhbGV0LCBuaWhpbCwgdGFjZXJlLjwvcD5cbiAgICA8cD5DdXI/IG5vbiB0YW0gbGF0ZXJhIGVjZnV0dXRhIHBhbmRhcyw8L3A+XG4gICAgPHA+TmVpIHR1IHF1aWQgZmFjaWFzIGluZXB0aWFydW0uPC9wPlxuICAgIDxwPlF1YXJlIHF1aWRxdWlkIGhhYmVzIGJvbmkgbWFsaXF1ZSw8L3A+XG4gICAgPHA+RGljIG5vYmlzLiB2b2xvIHRlIGFjIHR1b3MgYW1vcmVzPC9wPlxuICAgIDxwPkFkIGMmYWVsaWc7bHVtIGxlcGlkbyB2b2NhcmUgdmVyc3UuPC9wPlxuXHQ8L2Rpdj5gLFxuXG5cdGA8cCBjbGFzcz1cImNhbnRvaGVhZFwiPlZJSS48L3A+XG5cdDxwIGNsYXNzPVwiY2FudG9zdWJoZWFkXCI+Jm5ic3A7PC9wPlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UXUmYWVsaWc7cmlzLCBxdW90IG1paGkgYmFzaWF0aW9uZXM8L3A+XG4gICAgPHA+VHUmYWVsaWc7LCBMZXNiaWEsIHNpbnQgc2F0aXMgc3VwZXJxdWUuPC9wPlxuICAgIDxwPlF1YW0gbWFnbnVzIG51bWVydXMgTGlieXNzJmFlbGlnOyBhcmVuJmFlbGlnOzwvcD5cbiAgICA8cD5MYXNhcnBpY2lmZXJpcyBpYWNldCBDeXJlbmlzLDwvcD5cbiAgICA8cD5PcmFjbHVtIElvdmlzIGludGVyICZhZWxpZztzdHVvc2k8L3A+XG4gICAgPHA+RXQgQmF0dGkgdmV0ZXJpcyBzYWNydW0gc2VwdWxjcnVtLDwvcD5cbiAgICA8cD5BdXQgcXVhbSBzaWRlcmEgbXVsdGEsIGN1bSB0YWNldCBub3gsPC9wPlxuICAgIDxwPkZ1cnRpdm9zIGhvbWludW0gdmlkZW50IGFtb3Jlcyw8L3A+XG4gICAgPHA+VGFtIHRlIGJhc2lhIG11bHRhIGJhc2lhcmU8L3A+XG4gICAgPHA+VmVzYW5vIHNhdGlzIGV0IHN1cGVyIENhdHVsbG9zdCw8L3A+XG4gICAgPHA+UXUmYWVsaWc7IG5lYyBwZXJudW1lcmFyZSBjdXJpb3NpPC9wPlxuICAgIDxwPlBvc3NpbnQgbmVjIG1hbGEgZmFzY2luYXJlIGxpbmd1YS48L3A+XG5cdDwvZGl2PmAsXG5cblx0YDxwIGNsYXNzPVwiY2FudG9oZWFkXCI+VklJSS48L3A+XG5cdDxwIGNsYXNzPVwiY2FudG9zdWJoZWFkXCI+Jm5ic3A7PC9wPlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+TWlzZXIgQ2F0dWxsZSwgZGVzaW5hcyBpbmVwdGlyZSw8L3A+XG4gICAgPHA+RXQgcXVvZCB2aWRlcyBwZXJpc3NlIHBlcmRpdHVtIGR1Y2FzLjwvcD5cbiAgICA8cD5GdWxzZXJlIHF1b25kYW0gY2FuZGlkaSB0aWJpIHNvbGVzLDwvcD5cbiAgICA8cD5DdW0gdmVudGl0YWJhcyBxdW8gcHVlbGxhIGR1Y2ViYXQ8L3A+XG4gIFx0PHA+QW1hdGEgbm9iaXMgcXVhbnR1bSBhbWFiaXR1ciBudWxsYS48L3A+XG4gICAgPHA+SWJpIGlsbGEgbXVsdGEgdHVtIGlvY29zYSBmaWViYW50LDwvcD5cbiAgICA8cD5RdSZhZWxpZzsgdHUgdm9sZWJhcyBuZWMgcHVlbGxhIG5vbGViYXQuPC9wPlxuICAgIDxwPkZ1bHNlcmUgdmVyZSBjYW5kaWRpIHRpYmkgc29sZXMuPC9wPlxuICAgIDxwPk51bmMgaWFtIGlsbGEgbm9uIHZ1bHQ6IHR1IHF1b3F1ZSwgaW5wb3RlbnMsIG5vbGk8L3A+XG4gIFx0PHA+TmVjIHF1JmFlbGlnOyBmdWdpdCBzZWN0YXJlLCBuZWMgbWlzZXIgdml2ZSw8L3A+XG4gICAgPHA+U2VkIG9ic3RpbmF0YSBtZW50ZSBwZXJmZXIsIG9iZHVyYS48L3A+XG4gICAgPHA+VmFsZSwgcHVlbGxhLiBpYW0gQ2F0dWxsdXMgb2JkdXJhdCw8L3A+XG4gICAgPHA+TmVjIHRlIHJlcXVpcmV0IG5lYyByb2dhYml0IGludml0YW06PC9wPlxuICAgIDxwPkF0IHR1IGRvbGViaXMsIGN1bSByb2dhYmVyaXMgbnVsbGEuPC9wPlxuICBcdDxwPlNjZWxlc3RhLCB2JmFlbGlnOyB0ZSEgcXUmYWVsaWc7IHRpYmkgbWFuZXQgdml0YSE8L3A+XG4gICAgPHA+UXVpcyBudW5jIHRlIGFkaWJpdD8gY3VpIHZpZGViZXJpcyBiZWxsYT88L3A+XG4gICAgPHA+UXVlbSBudW5jIGFtYWJpcz8gY3VpdXMgZXNzZSBkaWNlcmlzPzwvcD5cbiAgICA8cD5RdWVtIGJhc2lhYmlzPyBjdWkgbGFiZWxsYSBtb3JkZWJpcz88L3A+XG4gICAgPHA+QXQgdHUsIENhdHVsbGUsIGRlc3RpbmF0dXMgb2JkdXJhLjwvcD5cblx0PC9kaXY+YCxcblxuXHRgPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5WSUlJSS48L3A+XG5cdDxwIGNsYXNzPVwiY2FudG9zdWJoZWFkXCI+Jm5ic3A7PC9wPlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VmVyYW5pLCBvbW5pYnVzIGUgbWVpcyBhbWljaXM8L3A+XG4gICAgPHA+QW50aXN0YW5zIG1paGkgbWlsaWJ1cyB0cmVjZW50aXMsPC9wPlxuICAgIDxwPlZlbmlzdGluZSBkb211bSBhZCB0dW9zIFBlbmF0ZXM8L3A+XG4gICAgPHA+RnJhdHJlc3F1ZSB1bmFuaW1vcyBhbnVtcXVlIG1hdHJlbT88L3A+XG4gICAgPHA+VmVuaXN0aS4gbyBtaWhpIG51bnRpaSBiZWF0aSE8L3A+XG4gICAgPHA+VmlzYW0gdGUgaW5jb2x1bWVtIGF1ZGlhbXF1ZSBIaWJlcnVtPC9wPlxuICAgIDxwPk5hcnJhbnRlbSBsb2NhLCBmYWN0YSwgbmF0aW9uZXMsPC9wPlxuICAgIDxwPlZ0IG1vcyBlc3QgdHV1cywgYWRwbGljYW5zcXVlIGNvbGx1bTwvcD5cbiAgICA8cD5Jb2N1bmR1bSBvcyBvY3Vsb3NxdWUgc3VhdmlhYm9yLjwvcD5cbiAgICA8cD5PIHF1YW50dW1zdCBob21pbnVtIGJlYXRpb3J1bSw8L3A+XG4gICAgPHA+UXVpZCBtZSBsJmFlbGlnO3RpdXMgZXN0IGJlYXRpdXN2ZT88L3A+XG5cdDwvZGl2PmAsXG5cblx0YDxwIGNsYXNzPVwiY2FudG9oZWFkXCI+WC48L3A+XG5cdDxwIGNsYXNzPVwiY2FudG9zdWJoZWFkXCI+Jm5ic3A7PC9wPlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VmFydXMgbWUgbWV1cyBhZCBzdW9zIGFtb3JlczwvcD5cbiAgICA8cD5WaXN1bSBkdXhlcmF0IGUgZm9ybyBvdGlvc3VtLDwvcD5cbiAgICA8cD5TY29ydGlsbHVtLCB1dCBtaWhpIHR1bSByZXBlbnRlIHZpc3Vtc3QsPC9wPlxuICAgIDxwPk5vbiBzYW5lIGlubGVwaWR1bSBuZXF1ZSBpbnZlbnVzdHVtLjwvcD5cbiAgICA8cD5IdWMgdXQgdmVuaW11cywgaW5jaWRlcmUgbm9iaXM8L3A+XG4gICAgPHA+U2VybW9uZXMgdmFyaWksIGluIHF1aWJ1cywgcXVpZCBlc3NldDwvcD5cbiAgICA8cD5JYW0gQml0aHluaWEsIHF1byBtb2RvIHNlIGhhYmVyZXQsPC9wPlxuICAgIDxwPkVjcXVvbmFtIG1paGkgcHJvZnVpc3NldCAmYWVsaWc7cmUuPC9wPlxuICAgIDxwPlJlc3BvbmRpIGlkIHF1b2QgZXJhdCwgbmloaWwgbmVxdWUgaXBzaXM8L3A+XG4gICAgPHA+TmVjIHByJmFlbGlnO3RvcmlidXMgZXNzZSBuZWMgY29ob3J0aSw8L3A+XG4gICAgPHA+Q3VyIHF1aXNxdWFtIGNhcHV0IHVuY3RpdXMgcmVmZXJyZXQsPC9wPlxuICAgIDxwPlByJmFlbGlnO3NlcnRpbSBxdWlidXMgZXNzZXQgaW5ydW1hdG9yPC9wPlxuICAgIDxwPlByJmFlbGlnO3Rvciwgbm9uIGZhY2llbnMgcGlsaSBjb2hvcnRlbS48L3A+XG4gICAgPHA+4oCYQXQgY2VydGUgdGFtZW4sIGlucXVpdW50LCBxdW9kIGlsbGljPC9wPlxuICAgIDxwPk5hdHVtIGRpY2l0dXIgZXNzZSwgY29ucGFyYXN0aTwvcD5cbiAgICA8cD5BZCBsZWN0aWNhbSBob21pbmVzLuKAmSBlZ28sIHV0IHB1ZWxsJmFlbGlnOzwvcD5cbiAgICA8cD5WbnVtIG1lIGZhY2VyZW0gYmVhdGlvcmVtLDwvcD5cbiAgICA8cD7igJhOb27igJkgaW5xdWFtIOKAmG1paGkgdGFtIGZ1aXQgbWFsaWduZSw8L3A+XG4gICAgPHA+VnQsIHByb3ZpbmNpYSBxdW9kIG1hbGEgaW5jaWRpc3NldCw8L3A+XG4gICAgPHA+Tm9uIHBvc3NlbSBvY3RvIGhvbWluZXMgcGFyYXJlIHJlY3Rvcy7igJk8L3A+XG4gICAgPHA+QXQgbWkgbnVsbHVzIGVyYXQgbmVjIGhpYyBuZXF1ZSBpbGxpYyw8L3A+XG4gICAgPHA+RnJhY3R1bSBxdWkgdmV0ZXJpcyBwZWRlbSBncmFiYXRpPC9wPlxuICAgIDxwPkluIGNvbGxvIHNpYmkgY29sbG9jYXJlIHBvc3NldC48L3A+XG4gICAgPHA+SGljIGlsbGEsIHV0IGRlY3VpdCBjaW4mYWVsaWc7ZGlvcmVtLDwvcD5cbiAgICA8cD7igJhRdSZhZWxpZztzb+KAmSBpbnF1aXQg4oCYbWloaSwgbWkgQ2F0dWxsZSwgcGF1bHVtPC9wPlxuICAgIDxwPklzdG9zLiBjb21tb2RlIGVuaW0gdm9sbyBhZCBTYXJhcGltPC9wPlxuICAgIDxwPkRlZmVycmku4oCZIOKAmG1pbmltZeKAmSBpbnF1aWkgcHVlbGwmYWVsaWc7OzwvcD5cbiAgICA8cCBjbGFzcz1cImRpdmlkZXJcIj4qICogKiAqICo8L3A+XG4gICAgPHA+4oCYSXN0dWQgcXVvZCBtb2RvIGRpeGVyYW0gbWUgaGFiZXJlLDwvcD5cbiAgICA8cD5GdWdpdCBtZSByYXRpbzogbWV1cyBzb2RhbGlzPC9wPlxuICAgIDxwPkNpbm5hc3QgR2FpdXMsIGlzIHNpYmkgcGFyYXZpdC48L3A+XG4gICAgPHA+VmVydW0sIHV0cnVtIGlsbGl1cyBhbiBtZWksIHF1aWQgYWQgbWU/PC9wPlxuICAgIDxwPlZ0b3IgdGFtIGJlbmUgcXVhbSBtaWhpIHBhcmFyaW0uPC9wPlxuICAgIDxwPlNlZCB0dSBpbnN1bHNhIG1hbGUgYWMgbW9sZXN0YSB2aXZpcyw8L3A+XG4gICAgPHA+UGVyIHF1YW0gbm9uIGxpY2V0IGVzc2UgbmVnbGlnZW50ZW0u4oCZPC9wPlxuXHQ8L2Rpdj5gLFxuXG5cdF1cbn07XG4iLCIvLyB2ZXJzaW9uIDQ6IG5vdyBnb2luZyB0byBFUzYgJiBCYWJlbFxuXG5cInVzZSBzdHJpY3RcIjtcblxuY29uc3QgSGFtbWVyID0gcmVxdWlyZShcImhhbW1lcmpzXCIpO1xuY29uc3QgRmFzdGNsaWNrID0gcmVxdWlyZShcImZhc3RjbGlja1wiKTtcbmNvbnN0IFZlbG9jaXR5ID0gcmVxdWlyZShcInZlbG9jaXR5LWFuaW1hdGVcIik7XG5cbmNvbnN0IGRvbSA9IHJlcXVpcmUoXCIuL2RvbVwiKTtcbmxldCBkYXRhID0gcmVxdWlyZShcIi4vYXBwZGF0YVwiKTtcblxudmFyIGFwcCA9IHtcblx0aGVscGVyczoge1xuXHRcdGdldHRyYW5zbGF0aW9uaW5kZXg6IGZ1bmN0aW9uKHRyYW5zaWQpIHtcblx0XHRcdGZvcihsZXQgaiA9IDA7IGogPCBkYXRhLnRyYW5zbGF0aW9uZGF0YS5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRpZih0cmFuc2lkID09IGRhdGEudHJhbnNsYXRpb25kYXRhW2pdLnRyYW5zbGF0aW9uaWQpIHtcblx0XHRcdFx0XHRyZXR1cm4gajtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cm91bmRlZDogZnVuY3Rpb24ocGl4ZWxzKSB7XG5cblx0XHRcdC8vIHRoaXMgaXMgc3RpbGwgYSBtZXNzLCBmaXggdGhpc1xuXG5cdFx0XHRyZXR1cm4gZGF0YS5sZW5zLnJpZ2h0LmxpbmVoZWlnaHQgKiBNYXRoLmZsb29yKHBpeGVscyAvIGRhdGEubGVucy5yaWdodC5saW5laGVpZ2h0KTtcblxuXHRcdH0sXG5cdFx0bmV4dHRyYW5zOiBmdW5jdGlvbihnaXZlbnRyYW5zbGF0aW9uKSB7XG5cdFx0XHRpZihkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3QubGVuZ3RoID4gMSkge1xuXHRcdFx0XHRpZigoZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0LmluZGV4T2YoZ2l2ZW50cmFuc2xhdGlvbikgKyAxKSA9PSBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3QubGVuZ3RoICkge1xuXHRcdFx0XHRcdHJldHVybiBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3RbMF07XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdFsoZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0LmluZGV4T2YoZ2l2ZW50cmFuc2xhdGlvbikgKyAxKV07XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBnaXZlbnRyYW5zbGF0aW9uO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cHJldnRyYW5zOiBmdW5jdGlvbihnaXZlbnRyYW5zbGF0aW9uKSB7XG5cdFx0XHRpZihkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3QubGVuZ3RoID4gMSkge1xuXHRcdFx0XHRpZihkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3QuaW5kZXhPZihnaXZlbnRyYW5zbGF0aW9uKSA9PSAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdFtkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3QubGVuZ3RoIC0gMV07XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdFsoZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0LmluZGV4T2YoZ2l2ZW50cmFuc2xhdGlvbikgLSAxKV07XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBnaXZlbnRyYW5zbGF0aW9uO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Zml4cGFkZGluZzogZnVuY3Rpb24odGhpc3NpZGUpIHtcblx0XHRcdGNvbnN0IGRpdnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiI3RleHQgcFwiKTtcblx0XHRcdHZhciBkaXYsIHBhZGRpbmcsIGRlc2lyZWR3aWR0aDtcblx0XHRcdGxldCBtYXh3aWR0aCA9IDA7XG5cblx0XHRcdGlmKGRvbS5oYXNjbGFzcyh0aGlzc2lkZS50ZXh0LFwicG9ldHJ5XCIpKSB7XG5cblx0XHRcdFx0Ly8gdGhpcyBpcyBwb2V0cnksIGZpZ3VyZSBvdXQgbG9uZ2VzdCBsaW5lXG5cblx0XHRcdFx0dGhpc3NpZGUudGV4dC5zdHlsZS5wYWRkaW5nTGVmdCA9IDA7XG5cdFx0XHRcdGZvcihsZXQgaT0wOyBpPGRpdnMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0XHRkaXYgPSBkaXZzW2ldO1xuXHRcdFx0XHRcdGRpdi5zdHlsZS5kaXNwbGF5ID0gXCJpbmxpbmUtYmxvY2tcIjtcblx0XHRcdFx0XHRpZihkaXYuY2xpZW50V2lkdGggPiBtYXh3aWR0aCkge1xuXHRcdFx0XHRcdFx0bWF4d2lkdGggPSBkaXYuY2xpZW50V2lkdGggKyA5MDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZGl2LnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zb2xlLmxvZyhcIuKAlD50ZXh0IHdpZHRoOiBcIiArIHRoaXNzaWRlLndpZHRoKTtcblx0XHRcdFx0Y29uc29sZS5sb2coXCLigJQ+bWF4IHdpZHRoOiBcIiArIG1heHdpZHRoKTtcblxuXHRcdFx0XHR0aGlzc2lkZS50ZXh0LnN0eWxlLnBhZGRpbmdMZWZ0ID0gKHRoaXNzaWRlLndpZHRoIC0gbWF4d2lkdGgpLzIrXCJweFwiO1xuXHRcdFx0XHR0aGlzc2lkZS50ZXh0LnN0eWxlLnBhZGRpbmdSaWdodCA9ICh0aGlzc2lkZS53aWR0aCAtIG1heHdpZHRoKS8yK1wicHhcIjtcblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0Ly8gdGhpcyBpcyBwcm9zZSwgc3RhbmRhcmRpemVkIHBhZGRpbmdcblxuXHRcdFx0XHRkZXNpcmVkd2lkdGggPSA3NTsgLy8gdGhpcyBpcyBpbiB2d1xuXG5cdFx0XHRcdGNvbnNvbGUubG9nKFwi4oCUPnRleHQgd2lkdGg6IFwiICsgdGhpc3NpZGUud2lkdGgpO1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIuKAlD5kZXNpcmVkIHdpZHRoOiBcIiArIGRlc2lyZWR3aWR0aCk7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwi4oCUPmxpbmVoZWlnaHQ6IFwiICsgdGhpc3NpZGUubGluZWhlaWdodCk7XG5cblx0XHRcdFx0Ly9cdFx0Y29uc29sZS5sb2cobGVucy53aWR0aCArIFwiIFwiK2Rlc2lyZWR3aWR0aCk7XG5cdFx0XHRcdC8vXHRcdHZhciBwYWRkaW5nID0gKGxlbnMud2lkdGggLSBkZXNpcmVkd2lkdGgpLzI7XG5cblx0XHRcdFx0cGFkZGluZyA9ICgxMDAgLSBkZXNpcmVkd2lkdGgpLzI7XG5cdFx0XHRcdC8qXG5cdFx0XHRcdGlmKChkZXNpcmVkd2lkdGggKyAyKSA+IGxlbnMud2lkdGgpIHtcblx0XHRcdFx0XHR0aGlzc2lkZS50ZXh0LnN0eWxlLnBhZGRpbmdMZWZ0ID0gXCIxdndcIjtcblx0XHRcdFx0XHR0aGlzc2lkZS50ZXh0LnN0eWxlLnBhZGRpbmdSaWdodCA9IFwiMXZ3XCI7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ki9cblx0XHRcdFx0dGhpc3NpZGUudGV4dC5zdHlsZS5wYWRkaW5nTGVmdCA9IHBhZGRpbmcrXCJ2d1wiO1xuXHRcdFx0XHR0aGlzc2lkZS50ZXh0LnN0eWxlLnBhZGRpbmdSaWdodCA9IHBhZGRpbmcrXCJ2d1wiO1xuXHRcdFx0XHQvL1x0XHR9XG5cdFx0XHR9XG5cblx0XHR9LFxuXHRcdGZpeHBhZGRpbmdyZXNwb25zaXZlOiBmdW5jdGlvbih0aGlzc2lkZSkge1xuXHRcdFx0Y29uc3QgZGl2cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYCMke3RoaXNzaWRlLnNsaWRlci5pZH0gLnRleHRmcmFtZSBwYCk7XG5cdFx0XHR2YXIgZGl2O1xuXHRcdFx0bGV0IG1heHdpZHRoID0gMDtcblxuXHRcdFx0aWYoZG9tLmhhc2NsYXNzKHRoaXNzaWRlLnRleHQsXCJwb2V0cnlcIikpIHtcblxuXHRcdFx0XHQvLyB0aGlzIGlzIHBvZXRyeSwgZmlndXJlIG91dCBsb25nZXN0IGxpbmVcblxuXHRcdFx0XHR0aGlzc2lkZS50ZXh0LnN0eWxlLnBhZGRpbmdMZWZ0ID0gMDtcblx0XHRcdFx0dGhpc3NpZGUudGV4dC5zdHlsZS5wYWRkaW5nUmlnaHQgPSAwO1xuXHRcdFx0XHR0aGlzc2lkZS50ZXh0aW5zaWRlLnN0eWxlLm1hcmdpbkxlZnQgPSAwO1xuXHRcdFx0XHR0aGlzc2lkZS50ZXh0aW5zaWRlLnN0eWxlLm1hcmdpblJpZ2h0ID0gMDtcblx0XHRcdFx0dGhpc3NpZGUudGV4dGluc2lkZS5zdHlsZS5wYWRkaW5nTGVmdCA9IDA7XG5cdFx0XHRcdHRoaXNzaWRlLnRleHRpbnNpZGUuc3R5bGUucGFkZGluZ1JpZ2h0ID0gMDtcblx0XHRcdFx0Zm9yKGxldCBpPTA7IGk8ZGl2cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdGRpdiA9IGRpdnNbaV07XG5cdFx0XHRcdFx0ZGl2LnN0eWxlLmRpc3BsYXkgPSBcImlubGluZS1ibG9ja1wiO1xuXG5cdFx0XHRcdFx0Ly8gdGhpcyBpcyBub3QgcGlja2luZyB1cCBpbmRlbnRzLCBJIHRoaW5rIOKAkyBtYXliZSBkaXYuY2xpZW50V2lkdGggKyAoZGl2LnN0eWxlLm1hcmdpbkxlZnQgKyBkaXYuc3R5bGUudGV4dEluZGVudClcblxuXHRcdFx0XHRcdGlmKGRpdi5jbGllbnRXaWR0aCA+IG1heHdpZHRoKSB7XG5cdFx0XHRcdFx0XHRtYXh3aWR0aCA9IGRpdi5jbGllbnRXaWR0aCArIDkwO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRkaXYuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcblx0XHRcdFx0fVxuXG5cblx0XHRcdFx0aWYoKHRoaXNzaWRlLndpZHRoIC0xNiApID4gbWF4d2lkdGgpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhgVGV4dCB3aWR0aDogJHt0aGlzc2lkZS53aWR0aH07IG1heCBsaW5lIHdpZHRoOiAke21heHdpZHRofTsgY2FsY3VsYXRlZCBwYWRkaW5nOiAkeyh0aGlzc2lkZS53aWR0aCAtIG1heHdpZHRoLTE2LTE2KS8yfXB4YCk7XG5cdFx0XHRcdFx0dGhpc3NpZGUudGV4dC5zdHlsZS5wYWRkaW5nTGVmdCA9IDA7XG5cdFx0XHRcdFx0dGhpc3NpZGUudGV4dC5zdHlsZS5wYWRkaW5nUmlnaHQgPSAwO1xuXHRcdFx0XHRcdHRoaXNzaWRlLnRleHRpbnNpZGUuc3R5bGUucGFkZGluZ0xlZnQgPSAwO1xuXHRcdFx0XHRcdHRoaXNzaWRlLnRleHRpbnNpZGUuc3R5bGUucGFkZGluZ1JpZ2h0ID0gMDtcblx0XHRcdFx0XHR0aGlzc2lkZS50ZXh0aW5zaWRlLnN0eWxlLm1hcmdpbkxlZnQgPSAodGhpc3NpZGUud2lkdGggLSBtYXh3aWR0aCAtIDE2IC0gMTYpLzIrXCJweFwiO1xuXHRcdFx0XHRcdHRoaXNzaWRlLnRleHRpbnNpZGUuc3R5bGUubWFyZ2luUmlnaHQgPSAodGhpc3NpZGUud2lkdGggLSBtYXh3aWR0aC0xNiAtIDE2KS8yK1wicHhcIjtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhgVG9vIHdpZGUhIFRleHQgd2lkdGg6ICR7dGhpc3NpZGUud2lkdGh9OyBtYXggbGluZSB3aWR0aDogJHttYXh3aWR0aH0uYCk7XG5cdFx0XHRcdFx0dGhpc3NpZGUudGV4dC5zdHlsZS5wYWRkaW5nTGVmdCA9IDgrXCJweFwiO1xuXHRcdFx0XHRcdHRoaXNzaWRlLnRleHQuc3R5bGUucGFkZGluZ1JpZ2h0ID0gOCtcInB4XCI7XG5cdFx0XHRcdFx0dGhpc3NpZGUudGV4dGluc2lkZS5zdHlsZS5tYXJnaW5MZWZ0ID0gMDtcblx0XHRcdFx0XHR0aGlzc2lkZS50ZXh0aW5zaWRlLnN0eWxlLm1hcmdpblJpZ2h0ID0gMDtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJQcm9zZSwgbm90IGRvaW5nIGFueXRoaW5nLlwiKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHR1cm5vbnN5bmNoc2Nyb2xsaW5nOiBmdW5jdGlvbigpIHtcblx0XHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc2xpZGVybGVmdCAudGV4dGZyYW1lXCIpLm9uc2Nyb2xsID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGxldCBwZXJjZW50YWdlID0gdGhpcy5zY3JvbGxUb3AgLyB0aGlzLnNjcm9sbEhlaWdodCAqIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc2xpZGVycmlnaHQgLnRleHRmcmFtZVwiKS5zY3JvbGxIZWlnaHQ7XG5cdFx0XHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc2xpZGVycmlnaHQgLnRleHRmcmFtZVwiKS5zY3JvbGxUb3AgPSBwZXJjZW50YWdlO1xuXHRcdFx0fTtcblx0XHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc2xpZGVycmlnaHQgLnRleHRmcmFtZVwiKS5vbnNjcm9sbCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRsZXQgcGVyY2VudGFnZSA9IHRoaXMuc2Nyb2xsVG9wIC8gdGhpcy5zY3JvbGxIZWlnaHQgKiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3NsaWRlcmxlZnQgLnRleHRmcmFtZVwiKS5zY3JvbGxIZWlnaHQ7XG5cdFx0XHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc2xpZGVybGVmdCAudGV4dGZyYW1lXCIpLnNjcm9sbFRvcCA9IHBlcmNlbnRhZ2U7XG5cdFx0XHR9O1xuXHRcdH0sXG5cdFx0Z2V0VXJsVmFyczogZnVuY3Rpb24oKSB7XG5cdFx0XHRsZXQgdmFycyA9IHt9O1xuXHRcdFx0Lyplc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtdmFycyovXG5cdFx0XHRsZXQgcGFydHMgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5yZXBsYWNlKC9bPyZdKyhbXj0mXSspPShbXiZdKikvZ2ksIGZ1bmN0aW9uKG0sa2V5LHZhbHVlKSB7XG5cdFx0XHRcdHZhcnNba2V5XSA9IHZhbHVlO1xuXHRcdFx0fSk7XG5cdFx0XHQvKmVzbGludC1lbmRhYmxlIG5vLXVudXNlZC12YXJzKi9cblx0XHRcdHJldHVybiB2YXJzO1xuXHRcdH0sXG5cdH0sXG5cdG5vdGVzOiB7XG5cdFx0c2V0dXA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0bGV0IGNvdW50ID0gMDtcblx0XHRcdGxldCBub3RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIubm90ZVwiKTtcblxuXHRcdFx0Zm9yKGxldCBpID0gMDsgaSA8IG5vdGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGxldCBjaGlsZHJlbiA9IG5vdGVzW2ldLmNoaWxkcmVuO1xuXHRcdFx0XHRmb3IobGV0IGo9MDsgaiA8IGNoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdFx0aWYoZG9tLmhhc2NsYXNzKGNoaWxkcmVuW2pdLFwibm90ZXRleHRcIikpIHtcblx0XHRcdFx0XHRcdGNoaWxkcmVuW2pdLnNldEF0dHJpYnV0ZShcImRhdGEtbm90ZW51bWJlclwiLCBjb3VudCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmKGRvbS5oYXNjbGFzcyhjaGlsZHJlbltqXSxcIm5vdGVub1wiKSkge1xuXHRcdFx0XHRcdFx0Y2hpbGRyZW5bal0uc2V0QXR0cmlidXRlKFwiZGF0YS1ub3RlbnVtYmVyXCIsIGNvdW50KTtcblx0XHRcdFx0XHRcdGFwcC5ub3Rlcy5jcmVhdGVjbGljayhjaGlsZHJlbltqXSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGNvdW50Kys7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRjcmVhdGVjbGljazogZnVuY3Rpb24oZWwpIHtcblx0XHRcdGVsLm9uY2xpY2sgPSBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cblx0XHRcdFx0bGV0IHRoaXNub3RlID0gdGhpcy5nZXRBdHRyaWJ1dGUoXCJkYXRhLW5vdGVudW1iZXJcIik7XG5cdFx0XHRcdGxldCBub3RldGV4dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5ub3RldGV4dFtkYXRhLW5vdGVudW1iZXI9XCIke3RoaXNub3RlfVwiXWApLmlubmVySFRNTDtcblx0XHRcdFx0YXBwLm5vdGVzLmhpZGUoKTtcblx0XHRcdFx0bGV0IGluc2VydCA9IGRvbS5jcmVhdGUoYDxkaXYgY2xhc3M9XCJub3Rld2luZG93XCIgaWQ9XCJub3Rld2luZG93XCI+XG5cdFx0XHRcdFx0XHQke25vdGV0ZXh0fVxuXHRcdFx0XHRcdDwvZGl2PmApO1xuXHRcdFx0XHRkYXRhLmVsZW1lbnRzLm1haW4uYXBwZW5kQ2hpbGQoaW5zZXJ0KTtcblx0XHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJub3Rld2luZG93XCIpLm9uY2xpY2sgPSAoKSA9PiB7XG5cdFx0XHRcdFx0YXBwLm5vdGVzLmhpZGUoKTtcblx0XHRcdFx0fTtcblx0XHRcdH07XG5cdFx0fSxcblx0XHRoaWRlOiBmdW5jdGlvbigpIHtcblx0XHRcdGRvbS5yZW1vdmVieXNlbGVjdG9yKFwiLm5vdGV3aW5kb3dcIik7XG5cdFx0fSxcblx0fSxcblx0c2V0dGluZ3M6IHtcblx0XHRnb3NldHRpbmdzOiBmdW5jdGlvbihlbGVtZW50KSB7XG5cblx0XHRcdC8vIHRoaXMgaXMgbmV2ZXIgYWN0dWFsbHkgdXNlZCFcblxuXHRcdFx0ZWxlbWVudC5vbmNsaWNrID0gKCkgPT4ge1xuXHRcdFx0XHRhcHAuc2V0cGFnZShcInNldHRpbmdzXCIpO1xuXHRcdFx0fTtcblx0XHR9LFxuXHRcdGNoZWNrYm94Z286IGZ1bmN0aW9uKGVsKSB7XG5cdFx0XHRlbC5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGFwcC5zZXR0aW5ncy5jaGFuZ2V0cmFuc2xhdGlvbih0aGlzLmlkLnJlcGxhY2UoXCJjaGVjay1cIixcIlwiKSxkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLmlkKS5jaGVja2VkKTtcblx0XHRcdH07XG5cdFx0fSxcblx0XHRjaGVja2JveHNwYW5nbzogZnVuY3Rpb24oZWwpIHtcblx0XHRcdGVsLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYGNoZWNrLSR7dGhpcy5pZH1gKS5jaGVja2VkID0gIWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBjaGVjay0ke3RoaXMuaWR9YCkuY2hlY2tlZDtcblx0XHRcdFx0YXBwLnNldHRpbmdzLmNoYW5nZXRyYW5zbGF0aW9uKHRoaXMuaWQsZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYGNoZWNrLSR7dGhpcy5pZH1gKS5jaGVja2VkKTtcblx0XHRcdH07XG5cdFx0fSxcblx0XHRjaGFuZ2V0cmFuc2xhdGlvbjogZnVuY3Rpb24odGhpc2lkLCBpc3NldCkge1xuXHRcdFx0Zm9yKGxldCBpIGluIGRhdGEudHJhbnNsYXRpb25kYXRhKSB7XG5cdFx0XHRcdGlmKHRoaXNpZCA9PSBkYXRhLnRyYW5zbGF0aW9uZGF0YVtpXS50cmFuc2xhdGlvbmlkKSB7XG5cdFx0XHRcdFx0aWYoaXNzZXQpIHtcblx0XHRcdFx0XHRcdGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdC5wdXNoKHRoaXNpZCk7XG5cdFx0XHRcdFx0XHRkYXRhLnRyYW5zbGF0aW9uY291bnQrKztcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0aWYoZGF0YS50cmFuc2xhdGlvbmNvdW50ID4gMSkge1xuXHRcdFx0XHRcdFx0XHRsZXQgaiA9IGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdC5pbmRleE9mKHRoaXNpZCk7XG5cdFx0XHRcdFx0XHRcdGlmIChqID4gLTEpIHtcblx0XHRcdFx0XHRcdFx0XHRkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3Quc3BsaWNlKGosIDEpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdGRhdGEudHJhbnNsYXRpb25jb3VudC0tO1xuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0Ly8gdGhlcmUncyBvbmx5IG9uZSB0cmFuc2xhdGlvbiBpbiB0aGUgbGlzdCwgZG8gbm90IGRlbGV0ZSBsYXN0XG5cdFx0XHRcdFx0XHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2hlY2stXCIrdGhpc2lkLnRvTG93ZXJDYXNlKCkpLmNoZWNrZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRhcHAubG9jYWxkYXRhLnNhdmUoKTtcblx0XHRcdH1cblxuXHRcdFx0bGV0IG5ld2xpc3QgPSBbXTtcblx0XHRcdGZvcihsZXQgaSBpbiBkYXRhLnRyYW5zbGF0aW9uZGF0YSkge1xuXHRcdFx0XHRpZihkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3QuaW5kZXhPZihkYXRhLnRyYW5zbGF0aW9uZGF0YVtpXS50cmFuc2xhdGlvbmlkKSA+IC0xKSB7XG5cdFx0XHRcdFx0bmV3bGlzdC5wdXNoKGRhdGEudHJhbnNsYXRpb25kYXRhW2ldLnRyYW5zbGF0aW9uaWQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3QgPSBuZXdsaXN0LnNsaWNlKCk7XG5cblx0XHRcdGlmKGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdC5pbmRleE9mKGRhdGEubGVucy5yaWdodC50cmFuc2xhdGlvbikgPCAwKSB7XG5cdFx0XHRcdGRhdGEubGVucy5yaWdodC50cmFuc2xhdGlvbiA9IGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdFswXTtcblx0XHRcdH1cblxuXHRcdFx0YXBwLnNldHRpbmdzLnVwZGF0ZSgpO1xuXHRcdH0sXG5cdFx0dXBkYXRlOiBmdW5jdGlvbigpIHtcdC8vIGZpcmVkIHdoZW5ldmVyIHdlIGdvIHRvIHNldHRpbmdzIHBhZ2VcblxuXHRcdFx0Ly8gYWRkIGluIHRyYW5zbGF0aW9uIGNob29zZXJcblxuXHRcdFx0ZG9tLnJlbW92ZWJ5c2VsZWN0b3IoXCIjdHJhbnNsYXRvcmxpc3RcIik7XG5cdFx0XHRsZXQgaW5zZXJ0ID0gZG9tLmNyZWF0ZSgnPHVsIGlkPVwidHJhbnNsYXRvcmxpc3RcIj48L3VsPicpO1xuXHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0cmFuc2xhdGlvbmNob29zZVwiKS5hcHBlbmRDaGlsZChpbnNlcnQpO1xuXHRcdFx0Y29uc3QgdHJhbnNsYXRvcmxpc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3RyYW5zbGF0b3JsaXN0XCIpO1xuXHRcdFx0Zm9yKGxldCBpIGluIGRhdGEudHJhbnNsYXRpb25kYXRhKSB7XG5cdFx0XHRcdGluc2VydCA9IGRvbS5jcmVhdGUoYDxsaT5cblx0XHRcdFx0XHRcdDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBpZD1cImNoZWNrLSR7ZGF0YS50cmFuc2xhdGlvbmRhdGFbaV0udHJhbnNsYXRpb25pZH1cIiAvPlxuXHRcdFx0XHRcdFx0PGxhYmVsIGZvcj1cIiR7ZGF0YS50cmFuc2xhdGlvbmRhdGFbaV0udHJhbnNsYXRpb25pZH1cIiBpZD1cIiR7ZGF0YS50cmFuc2xhdGlvbmRhdGFbaV0udHJhbnNsYXRpb25pZH1cIiA+PHNwYW4+PHNwYW4+PC9zcGFuPjwvc3Bhbj4ke2RhdGEudHJhbnNsYXRpb25kYXRhW2ldLnRyYW5zbGF0aW9uZnVsbG5hbWV9PC9sYWJlbD5cblx0XHRcdFx0XHQ8L2xpPmApO1xuXHRcdFx0XHR0cmFuc2xhdG9ybGlzdC5hcHBlbmRDaGlsZChpbnNlcnQpO1xuXHRcdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNoZWNrLVwiK2RhdGEudHJhbnNsYXRpb25kYXRhW2ldLnRyYW5zbGF0aW9uaWQpLmNoZWNrZWQgPSAoZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0LmluZGV4T2YoZGF0YS50cmFuc2xhdGlvbmRhdGFbaV0udHJhbnNsYXRpb25pZCkgPiAtMSk7XG5cdFx0XHR9XG5cblx0XHRcdGxldCBpbnB1dGNoZWNrYm94ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIiN0cmFuc2xhdG9ybGlzdCBpbnB1dFt0eXBlPWNoZWNrYm94XVwiKTtcblx0XHRcdGZvcihsZXQgaSA9IDA7IGkgPCBpbnB1dGNoZWNrYm94Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGFwcC5zZXR0aW5ncy5jaGVja2JveGdvKGlucHV0Y2hlY2tib3hbaV0pO1xuXHRcdFx0fVxuXHRcdFx0bGV0IHRyYW5zbGF0b3JsaXN0bGFiZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiI3RyYW5zbGF0b3JsaXN0IGxhYmVsXCIpO1xuXHRcdFx0Zm9yKGxldCBpID0gMDsgaSA8IHRyYW5zbGF0b3JsaXN0bGFiZWwubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0YXBwLnNldHRpbmdzLmNoZWNrYm94c3BhbmdvKHRyYW5zbGF0b3JsaXN0bGFiZWxbaV0pO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBhZGQgaW4gdG9jXG5cblx0XHRcdGRvbS5yZW1vdmVieXNlbGVjdG9yKFwiI3NlbGVjdG9yc1wiKTtcblx0XHRcdGluc2VydCA9IGRvbS5jcmVhdGUoYDxkaXYgaWQ9XCJzZWxlY3RvcnNcIj5cblx0XHRcdFx0XHQ8cD5DYW50bzogPHNlbGVjdCBpZD1cInNlbGVjdGNhbnRvXCI+PC9zZWxlY3Q+PC9wPlxuXHRcdFx0XHRcdDxwPlRyYW5zbGF0aW9uOiA8c2VsZWN0IGlkPVwic2VsZWN0dHJhbnNsYXRvclwiPjwvc2VsZWN0PjwvcD5cblx0XHRcdFx0XHQ8cD48c3BhbiBpZD1cInNlbGVjdGdvXCI+R288L3NwYW4+PC9wPlxuXHRcdFx0XHQ8L2Rpdj5gKTtcblx0XHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidHJhbnNsYXRpb25nb1wiKS5hcHBlbmRDaGlsZChpbnNlcnQpO1xuXHRcdFx0Zm9yKGxldCBpID0gMDsgaSA8IGRhdGEuY2FudG9jb3VudDsgaSsrKSB7XG5cdFx0XHRcdGluc2VydCA9IGRvbS5jcmVhdGUoYDxvcHRpb24gaWQ9XCJjYW50byR7aX1cIiAkeygoZGF0YS5jYW50byA9PSBpKSA/IFwic2VsZWN0ZWRcIiA6IFwiXCIpfT4ke2RhdGEuY2FudG90aXRsZXNbaV19PC9vcHRpb24+YCk7XG5cdFx0XHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2VsZWN0Y2FudG9cIikuYXBwZW5kQ2hpbGQoaW5zZXJ0KTtcblx0XHRcdH1cblx0XHRcdGZvcihsZXQgaSBpbiBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3QpIHtcblx0XHRcdFx0Zm9yKGxldCBqID0gMDsgaiA8IGRhdGEudHJhbnNsYXRpb25kYXRhLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdFx0aWYoZGF0YS50cmFuc2xhdGlvbmRhdGFbal0udHJhbnNsYXRpb25pZCA9PSBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3RbaV0pIHtcblx0XHRcdFx0XHRcdGluc2VydCA9IGRvbS5jcmVhdGUoYDxvcHRpb24gaWQ9XCJ0cl8ke2RhdGEudHJhbnNsYXRpb25kYXRhW2pdLnRyYW5zbGF0aW9uaWR9XCIgJHsoKGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdC5pbmRleE9mKGRhdGEubGVucy5yaWdodC50cmFuc2xhdGlvbikgPT0gaSkgPyBcInNlbGVjdGVkXCIgOiBcIlwiKX0+JHtkYXRhLnRyYW5zbGF0aW9uZGF0YVtqXS50cmFuc2xhdGlvbmZ1bGxuYW1lfTwvb3B0aW9uPmApO1xuXHRcdFx0XHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWxlY3R0cmFuc2xhdG9yXCIpLmFwcGVuZENoaWxkKGluc2VydCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc2VsZWN0Z29cIikub25jbGljayA9ICgpID0+IHtcblx0XHRcdFx0bGV0IHNlbGVjdGVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWxlY3R0cmFuc2xhdG9yXCIpO1xuXHRcdFx0XHRsZXQgdGhpc3RyYW5zID0gc2VsZWN0ZWQub3B0aW9uc1tzZWxlY3RlZC5zZWxlY3RlZEluZGV4XS5pZC5zdWJzdHIoMyk7XG5cdFx0XHRcdHNlbGVjdGVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWxlY3RjYW50b1wiKTtcblx0XHRcdFx0bGV0IHRoaXNjYW50byA9IHNlbGVjdGVkLm9wdGlvbnNbc2VsZWN0ZWQuc2VsZWN0ZWRJbmRleF0uaWQuc3Vic3RyKDUpO1xuXHRcdFx0XHRmb3IobGV0IGogPSAwOyBqIDwgZGF0YS50cmFuc2xhdGlvbmRhdGEubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0XHRpZihkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3Rbal0gPT0gdGhpc3RyYW5zKSB7XG5cdFx0XHRcdFx0XHRhcHAuc2V0cGFnZShcImxlbnNcIik7XG5cdFx0XHRcdFx0XHRhcHAuc2V0bGVucyhkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3Rbal0sdGhpc2NhbnRvLFwicmlnaHRcIiwwKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXHR9LFxuXHRsb2NhbGRhdGE6IHtcblx0XHRzYXZlOiBmdW5jdGlvbigpIHtcdC8vIHRoaXMgc2hvdWxkIHN0b3JlIGFwcGRhdGUgb24gbG9jYWxzdG9yYWdlXG5cblx0XHRcdGxldCB0b3N0b3JlID0gSlNPTi5zdHJpbmdpZnkoe1xuXHRcdFx0XHRjdXJyZW50Y2FudG86IFx0XHRcdGRhdGEuY2FudG8sXG5cdFx0XHRcdGN1cnJlbnR0cmFuc3JpZ2h0OiBcdGRhdGEubGVucy5yaWdodC50cmFuc2xhdGlvbixcblx0XHRcdFx0Y3VycmVudHRyYW5zbGVmdDogXHRkYXRhLmxlbnMubGVmdC50cmFuc2xhdGlvbixcblx0XHRcdFx0dHJhbnNsYXRpb25zZXQ6IFx0XHRkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3QsXG5cdFx0XHRcdHR3aW5tb2RlOiBcdFx0XHRcdFx0ZGF0YS51c2Vyc2V0dGluZ3MudHdpbm1vZGUsXG5cdFx0XHRcdG5pZ2h0bW9kZTogXHRcdFx0XHRcdGRhdGEudXNlcnNldHRpbmdzLm5pZ2h0bW9kZSxcblx0XHRcdFx0c2hvd25vdGVzOiBcdFx0XHRcdFx0ZGF0YS51c2Vyc2V0dGluZ3Muc2hvd25vdGVzXG5cdFx0XHR9KTtcblxuXHRcdFx0bGV0IHN0b3JhZ2UgPSB3aW5kb3cubG9jYWxTdG9yYWdlO1xuXHRcdFx0c3RvcmFnZS5zZXRJdGVtKGRhdGEuYm9va25hbWUsIHRvc3RvcmUpO1xuXG5cdFx0XHQvLyBzYXZlIGN1cnJlbnQgbG9jYXRpb24gYXMgaGFzaFxuXG5cdFx0XHRpZiAoaGlzdG9yeS5wdXNoU3RhdGUpIHtcblx0XHRcdFx0bGV0IG5ld3VybCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyBgP2NhbnRvPSR7ZGF0YS5jYW50b30mdHJhbnM9JHtkYXRhLmxlbnMucmlnaHQudHJhbnNsYXRpb259YDtcblx0XHRcdFx0aWYoZGF0YS51c2Vyc2V0dGluZ3MudHdpbm1vZGUpIHtcblx0XHRcdFx0XHRuZXd1cmwgKz0gYCZsZWZ0dHJhbnM9JHtkYXRhLmxlbnMubGVmdC50cmFuc2xhdGlvbn1gO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgIT09IFwiZmlsZTpcIikge1xuXHRcdFx0XHRcdHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZSh7cGF0aDpuZXd1cmx9LCcnLG5ld3VybCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2cobmV3dXJsKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVhZDogZnVuY3Rpb24oKSB7XG5cblx0XHRcdGlmKGFwcC5oZWxwZXJzLmdldFVybFZhcnMoKS5yZXNldCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIlJlc2V0dGluZyBsb2NhbCBzdG9yYWdlIVwiKTtcblx0XHRcdFx0bGV0IHN0b3JhZ2UgPSB3aW5kb3cubG9jYWxTdG9yYWdlO1xuXHRcdFx0XHRzdG9yYWdlLnJlbW92ZUl0ZW0oZGF0YS5ib29rbmFtZSk7XG5cdFx0XHR9XG5cblx0XHRcdGxldCBnb3RvY2FudG8gPSAwO1xuXHRcdFx0bGV0IGdvdG90cmFucyA9IFwiXCI7XG5cdFx0XHRsZXQgZ290b2xlZnR0cmFucyA9IFwiXCI7XG5cdFx0XHRsZXQgZ290b3R3aW5tb2RlID0gZmFsc2U7XG5cdFx0XHRsZXQgY2FudG9mbGFnID0gZmFsc2U7XG5cdFx0XHRsZXQgdHJhbnNmbGFnID0gZmFsc2U7XG5cblx0XHRcdC8vIHRoaXMgc2hvdWxkIHRha2UgbG9jYWxzdG9yYWdlIGFuZCByZXBsYWNlIHRoZSB2YWx1ZXMgaW4gZGF0YSB3aXRoIGl0XG5cblx0XHRcdC8vIGZpcnN0LCByZWFkIGxvY2FsIHN0b3JhZ2VcblxuXHRcdFx0bGV0IHN0b3JhZ2UgPSB3aW5kb3cubG9jYWxTdG9yYWdlO1xuXHRcdFx0bGV0IHRvcmVhZCA9IHN0b3JhZ2UuZ2V0SXRlbShkYXRhLmJvb2tuYW1lKTtcblxuXHRcdFx0aWYodG9yZWFkICE9PSBudWxsKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiV2hhdCdzIGluIGxvY2FsIHN0b3JhZ2U6IFwiKyB0b3JlYWQpO1xuXHRcdFx0XHRsZXQgc3RvcmVkdmFsdWVzID0gSlNPTi5wYXJzZSh0b3JlYWQpO1xuXHRcdFx0XHRjb25zb2xlLmxvZyhzdG9yZWR2YWx1ZXMpO1xuXHRcdFx0XHRkYXRhLmN1cnJlbnRjYW50byA9IHN0b3JlZHZhbHVlcy5jdXJyZW50Y2FudG87XG5cdFx0XHRcdGRhdGEubGVucy5yaWdodC50cmFuc2xhdGlvbiA9IHN0b3JlZHZhbHVlcy5jdXJyZW50dHJhbnNyaWdodDtcblx0XHRcdFx0ZGF0YS5sZW5zLmxlZnQudHJhbnNsYXRpb24gPSBzdG9yZWR2YWx1ZXMuY3VycmVudHRyYW5zbGVmdDtcblx0XHRcdFx0ZGF0YS51c2Vyc2V0dGluZ3MudHdpbm1vZGUgPSBzdG9yZWR2YWx1ZXMudHdpbm1vZGU7XG5cdFx0XHRcdGRhdGEudXNlcnNldHRpbmdzLm5pZ2h0bW9kZSA9IHN0b3JlZHZhbHVlcy5uaWdodG1vZGU7XG5cdFx0XHRcdGRhdGEudXNlcnNldHRpbmdzLnNob3dub3RlcyA9IHN0b3JlZHZhbHVlcy5zaG93bm90ZXM7XG5cdFx0XHRcdGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdCA9IHN0b3JlZHZhbHVlcy50cmFuc2xhdGlvbnNldDtcblx0XHRcdFx0aWYoZGF0YS51c2Vyc2V0dGluZ3MudHdpbm1vZGUpIHtcblx0XHRcdFx0XHRkb20uYWRkY2xhc3MoXCJib2R5XCIsXCJ0d2lubW9kZVwiKTtcblx0XHRcdFx0XHRkb20ucmVtb3ZlY2xhc3MoXCIjdHdpbm1vZGVcIixcIm9mZlwiKTtcblx0XHRcdFx0XHRkb20uYWRkY2xhc3MoXCIjc2luZ2xlbW9kZVwiLFwib2ZmXCIpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGRvbS5yZW1vdmVjbGFzcyhcImJvZHlcIixcInR3aW5tb2RlXCIpO1xuXHRcdFx0XHRcdGRvbS5hZGRjbGFzcyhcIiN0d2lubW9kZVwiLFwib2ZmXCIpO1xuXHRcdFx0XHRcdGRvbS5yZW1vdmVjbGFzcyhcIiNzaW5nbGVtb2RlXCIsXCJvZmZcIik7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoZGF0YS51c2Vyc2V0dGluZ3MubmlnaHRtb2RlKSB7XG5cdFx0XHRcdFx0ZG9tLmFkZGNsYXNzKFwiYm9keVwiLFwibmlnaHRtb2RlXCIpO1xuXHRcdFx0XHRcdGRvbS5yZW1vdmVjbGFzcyhcIiNuaWdodG1vZGVcIixcIm9mZlwiKTtcblx0XHRcdFx0XHRkb20uYWRkY2xhc3MoXCIjZGF5bW9kZVwiLFwib2ZmXCIpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGRvbS5yZW1vdmVjbGFzcyhcImJvZHlcIixcIm5pZ2h0bW9kZVwiKTtcblx0XHRcdFx0XHRkb20uYWRkY2xhc3MoXCIjbmlnaHRtb2RlXCIsXCJvZmZcIik7XG5cdFx0XHRcdFx0ZG9tLnJlbW92ZWNsYXNzKFwiI2RheW1vZGVcIixcIm9mZlwiKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZihkYXRhLnVzZXJzZXR0aW5ncy5zaG93bm90ZXMpIHtcblx0XHRcdFx0XHRkb20ucmVtb3ZlY2xhc3MoXCJib2R5XCIsXCJoaWRlbm90ZXNcIik7XG5cdFx0XHRcdFx0ZG9tLnJlbW92ZWNsYXNzKFwiI3Nob3dub3Rlc1wiLFwib2ZmXCIpO1xuXHRcdFx0XHRcdGRvbS5hZGRjbGFzcyhcIiNoaWRlbm90ZXNcIixcIm9mZlwiKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRkb20uYWRkY2xhc3MoXCJib2R5XCIsXCJoaWRlbm90ZXNcIik7XG5cdFx0XHRcdFx0ZG9tLmFkZGNsYXNzKFwiI3Nob3dub3Rlc1wiLFwib2ZmXCIpO1xuXHRcdFx0XHRcdGRvbS5yZW1vdmVjbGFzcyhcIiNoaWRlbm90ZXNcIixcIm9mZlwiKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRhcHAuc2V0bGVucyhkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3RbYXBwLmhlbHBlcnMuZ2V0dHJhbnNsYXRpb25pbmRleChkYXRhLmxlbnMucmlnaHQudHJhbnNsYXRpb24pXSxkYXRhLmN1cnJlbnRjYW50byxcInJpZ2h0XCIsMCk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIHNlY29uZCwgcmVhZCBoYXNoXG5cblx0XHRcdGlmKGFwcC5oZWxwZXJzLmdldFVybFZhcnMoKS5jYW50bykge1xuXHRcdFx0XHRnb3RvY2FudG8gPSBhcHAuaGVscGVycy5nZXRVcmxWYXJzKCkuY2FudG87XG5cdFx0XHRcdGNhbnRvZmxhZyA9IHRydWU7XG5cdFx0XHR9XG5cdFx0XHRpZihhcHAuaGVscGVycy5nZXRVcmxWYXJzKCkudHJhbnMpIHtcblx0XHRcdFx0Z290b3RyYW5zID0gYXBwLmhlbHBlcnMuZ2V0VXJsVmFycygpLnRyYW5zO1xuXHRcdFx0XHR0cmFuc2ZsYWcgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0aWYoYXBwLmhlbHBlcnMuZ2V0VXJsVmFycygpLmxlZnR0cmFucykge1xuXHRcdFx0XHRnb3RvbGVmdHRyYW5zID0gYXBwLmhlbHBlcnMuZ2V0VXJsVmFycygpLmxlZnR0cmFucztcblx0XHRcdFx0Z290b3R3aW5tb2RlID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0aWYoY2FudG9mbGFnICYmIHRyYW5zZmxhZykge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIldlIGhhdmUgY2FudG8gJiB0cmFucyBmcm9tIFVSTCFcIik7XG5cdFx0XHRcdGlmKGdvdG90d2lubW9kZSkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiV2UgaGF2ZSBsZWZ0IHRyYW5zIGZyb20gVVJMIVwiKTtcblx0XHRcdFx0XHRkYXRhLnVzZXJzZXR0aW5ncy50d2lubW9kZSA9IHRydWU7XG5cdFx0XHRcdFx0ZG9tLmFkZGNsYXNzKFwiYm9keVwiLFwidHdpbm1vZGVcIik7XG5cdFx0XHRcdFx0ZG9tLnJlbW92ZWNsYXNzKFwiI3R3aW5tb2RlXCIsXCJvZmZcIik7XG5cdFx0XHRcdFx0ZG9tLmFkZGNsYXNzKFwiI3NpbmdsZW1vZGVcIixcIm9mZlwiKTtcblx0XHRcdFx0XHRkYXRhLmxlbnMubGVmdC50cmFuc2xhdGlvbiA9IGdvdG9sZWZ0dHJhbnM7XG5cdFx0XHRcdH1cblx0XHRcdFx0YXBwLnNldGxlbnMoZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0W2FwcC5oZWxwZXJzLmdldHRyYW5zbGF0aW9uaW5kZXgoZ290b3RyYW5zKV0sZ290b2NhbnRvLFwicmlnaHRcIiwwKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiTm8gY2FudG8vdHJhbnNsYXRpb24gZm91bmQgaW4gVVJMLlwiKTtcblx0XHRcdH1cblx0XHR9LFxuXHR9LFxuXHRjb250cm9sczoge1xuXHRcdHN0YXJ0OiBmdW5jdGlvbigpIHtcblx0XHRcdGFwcC5jb250cm9scy5uYXZiYXIoKTtcblx0XHRcdGFwcC5jb250cm9scy5zZXR0aW5ncygpO1xuXHRcdFx0YXBwLmNvbnRyb2xzLnN3aXBpbmcoKTtcblx0XHRcdGFwcC5jb250cm9scy5ub3RlcygpO1xuXHRcdFx0YXBwLmNvbnRyb2xzLmtleXMoKTtcblx0XHR9LFxuXHRcdG5hdmJhcjogZnVuY3Rpb24oKSB7XG5cdFx0XHQvLyBidXR0b24gY29udHJvbHNcblx0XHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmF2YmFybGVmdCAubmF2cHJldlwiKS5vbmNsaWNrID0gKCkgPT4ge1xuXHRcdFx0XHRhcHAuc2V0bGVucyhhcHAuaGVscGVycy5uZXh0dHJhbnMoZGF0YS5sZW5zLmxlZnQudHJhbnNsYXRpb24pLGRhdGEuY2FudG8sXCJsZWZ0XCIpO1xuXHRcdFx0fTtcblx0XHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmF2YmFybGVmdCAubmF2bmV4dFwiKS5vbmNsaWNrID0gKCkgPT4ge1xuXHRcdFx0XHRhcHAuc2V0bGVucyhhcHAuaGVscGVycy5wcmV2dHJhbnMoZGF0YS5sZW5zLmxlZnQudHJhbnNsYXRpb24pLGRhdGEuY2FudG8sXCJsZWZ0XCIpO1xuXHRcdFx0fTtcblx0XHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmF2YmFybGVmdCAubmF2dXBcIikub25jbGljayA9ICgpID0+IHtcblx0XHRcdFx0YXBwLnNldGxlbnMoZGF0YS5sZW5zLnJpZ2h0LnRyYW5zbGF0aW9uLGRhdGEuY2FudG8tMSxcInJpZ2h0XCIsMCk7XG5cdFx0XHR9O1xuXHRcdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNuYXZiYXJsZWZ0IC5uYXZkb3duXCIpLm9uY2xpY2sgPSAoKSA9PiB7XG5cdFx0XHRcdGFwcC5zZXRsZW5zKGRhdGEubGVucy5yaWdodC50cmFuc2xhdGlvbixkYXRhLmNhbnRvKzEsXCJyaWdodFwiLDApO1xuXHRcdFx0fTtcblx0XHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmF2YmFycmlnaHQgLm5hdnByZXZcIikub25jbGljayA9ICgpID0+IHtcblx0XHRcdFx0YXBwLnNldGxlbnMoYXBwLmhlbHBlcnMubmV4dHRyYW5zKGRhdGEubGVucy5yaWdodC50cmFuc2xhdGlvbiksZGF0YS5jYW50byxcInJpZ2h0XCIpO1xuXHRcdFx0fTtcblx0XHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmF2YmFycmlnaHQgLm5hdm5leHRcIikub25jbGljayA9ICgpID0+IHtcblx0XHRcdFx0YXBwLnNldGxlbnMoYXBwLmhlbHBlcnMucHJldnRyYW5zKGRhdGEubGVucy5yaWdodC50cmFuc2xhdGlvbiksZGF0YS5jYW50byxcInJpZ2h0XCIpO1xuXHRcdFx0fTtcblx0XHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmF2YmFycmlnaHQgLm5hdnVwXCIpLm9uY2xpY2sgPSAoKSA9PiB7XG5cdFx0XHRcdGFwcC5zZXRsZW5zKGRhdGEubGVucy5yaWdodC50cmFuc2xhdGlvbixkYXRhLmNhbnRvLTEsXCJyaWdodFwiLDApO1xuXHRcdFx0fTtcblx0XHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmF2YmFycmlnaHQgLm5hdmRvd25cIikub25jbGljayA9ICgpID0+IHtcblx0XHRcdFx0YXBwLnNldGxlbnMoZGF0YS5sZW5zLnJpZ2h0LnRyYW5zbGF0aW9uLGRhdGEuY2FudG8rMSxcInJpZ2h0XCIsMCk7XG5cdFx0XHR9O1xuXHRcdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNuYXZiYXJsZWZ0IC5uYXZjbG9zZVwiKS5vbmNsaWNrID0gKCkgPT4ge1xuXHRcdFx0XHRkb20ucmVtb3ZlY2xhc3MoXCJib2R5XCIsXCJ0d2lubW9kZVwiKTtcblx0XHRcdFx0ZG9tLmFkZGNsYXNzKFwiI3R3aW5tb2RlXCIsXCJvZmZcIik7XG5cdFx0XHRcdGRvbS5yZW1vdmVjbGFzcyhcIiNzaW5nbGVtb2RlXCIsXCJvZmZcIik7XG5cdFx0XHRcdGRhdGEudXNlcnNldHRpbmdzLnR3aW5tb2RlID0gZmFsc2U7XG5cdFx0XHRcdGFwcC5yZXNpemUoKTtcblx0XHRcdH07XG5cdFx0XHRkYXRhLmVsZW1lbnRzLnRpdGxlYmFyLm9uY2xpY2sgPSAoKSA9PiB7XG5cdFx0XHRcdGFwcC5zZXRwYWdlKFwibGVuc1wiKTtcblx0XHRcdH07XG5cdFx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25hdmJhcnJpZ2h0IC5uYXZzZXR0aW5nc1wiKS5vbmNsaWNrID0gKCkgPT4ge1xuXHRcdFx0XHRhcHAuc2V0dGluZ3MudXBkYXRlKCk7XG5cdFx0XHRcdGFwcC5zZXRwYWdlKFwic2V0dGluZ3NcIik7XG5cdFx0XHR9O1xuXG5cdFx0XHRkb2N1bWVudC5ib2R5Lm9ua2V5dXAgPSAoZSkgPT4ge1x0Ly8gbWF5YmUgdGhpcyBpcyBzY3Jld2luZyB1cyBvbiBtb2JpbGU/XG5cdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0ZG9tLnJlbW92ZWNsYXNzKFwiLmJ1dHRvblwiLFwib25cIik7XG5cdFx0XHR9O1xuXHRcdH0sXG5cdFx0c2V0dGluZ3M6IGZ1bmN0aW9uKCkge1xuXHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhYm91dGxpbmtcIikub25jbGljayA9ICgpID0+IHtcblx0XHRcdFx0YXBwLnNldHBhZ2UoXCJhYm91dFwiKTtcblx0XHRcdH07XG5cdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlbHBsaW5rXCIpLm9uY2xpY2sgPSAoKSA9PiB7XG5cdFx0XHRcdGFwcC5zZXRwYWdlKFwiaGVscFwiKTtcblx0XHRcdH07XG5cblx0XHRcdGlmKGRhdGEudXNlcnNldHRpbmdzLnR3aW5tb2RlKSB7XG5cdFx0XHRcdGRvbS5yZW1vdmVjbGFzcyhcIiN0d2lubW9kZVwiLFwib2ZmXCIpO1xuXHRcdFx0XHRkb20uYWRkY2xhc3MoXCIjc2luZ2xlbW9kZVwiLFwib2ZmXCIpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZG9tLmFkZGNsYXNzKFwiI3R3aW5tb2RlXCIsXCJvZmZcIik7XG5cdFx0XHRcdGRvbS5yZW1vdmVjbGFzcyhcIiNzaW5nbGVtb2RlXCIsXCJvZmZcIik7XG5cdFx0XHR9XG5cblx0XHRcdGlmKGRhdGEudXNlcnNldHRpbmdzLm5pZ2h0bW9kZSkge1xuXHRcdFx0XHRkb20ucmVtb3ZlY2xhc3MoXCIjbmlnaHRtb2RlXCIsXCJvZmZcIik7XG5cdFx0XHRcdGRvbS5hZGRjbGFzcyhcIiNkYXltb2RlXCIsXCJvZmZcIik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRkb20uYWRkY2xhc3MoXCIjbmlnaHRtb2RlXCIsXCJvZmZcIik7XG5cdFx0XHRcdGRvbS5yZW1vdmVjbGFzcyhcIiNkYXltb2RlXCIsXCJvZmZcIik7XG5cdFx0XHR9XG5cblx0XHRcdGlmKGRhdGEudXNlcnNldHRpbmdzLnNob3dub3Rlcykge1xuXHRcdFx0XHRkb20ucmVtb3ZlY2xhc3MoXCIjc2hvd25vdGVzXCIsXCJvZmZcIik7XG5cdFx0XHRcdGRvbS5hZGRjbGFzcyhcIiNoaWRlbm90ZXNcIixcIm9mZlwiKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGRvbS5hZGRjbGFzcyhcIiNzaG93bm90ZXNcIixcIm9mZlwiKTtcblx0XHRcdFx0ZG9tLnJlbW92ZWNsYXNzKFwiI2hpZGVub3Rlc1wiLFwib2ZmXCIpO1xuXHRcdFx0fVxuXG5cdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImRheW1vZGVcIikub25jbGljayA9ICgpID0+IHtcblx0XHRcdFx0ZG9tLnJlbW92ZWNsYXNzKFwiYm9keVwiLFwibmlnaHRtb2RlXCIpO1xuXHRcdFx0XHRkb20uYWRkY2xhc3MoXCIjbmlnaHRtb2RlXCIsXCJvZmZcIik7XG5cdFx0XHRcdGRvbS5yZW1vdmVjbGFzcyhcIiNkYXltb2RlXCIsXCJvZmZcIik7XG5cdFx0XHRcdGRhdGEudXNlcnNldHRpbmdzLm5pZ2h0bW9kZSA9IGZhbHNlO1xuXHRcdFx0fTtcblx0XHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmlnaHRtb2RlXCIpLm9uY2xpY2sgPSAoKSA9PiB7XG5cdFx0XHRcdGRvbS5hZGRjbGFzcyhcImJvZHlcIixcIm5pZ2h0bW9kZVwiKTtcblx0XHRcdFx0ZG9tLnJlbW92ZWNsYXNzKFwiI25pZ2h0bW9kZVwiLFwib2ZmXCIpO1xuXHRcdFx0XHRkb20uYWRkY2xhc3MoXCIjZGF5bW9kZVwiLFwib2ZmXCIpO1xuXHRcdFx0XHRkYXRhLnVzZXJzZXR0aW5ncy5uaWdodG1vZGUgPSB0cnVlO1xuXHRcdFx0fTtcblx0XHRcdGlmKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2luZ2xlbW9kZVwiKSAhPT0gbnVsbCkge1xuXHRcdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNpbmdsZW1vZGVcIikub25jbGljayA9ICgpID0+IHtcblx0XHRcdFx0XHRkb20ucmVtb3ZlY2xhc3MoXCJib2R5XCIsXCJ0d2lubW9kZVwiKTtcblx0XHRcdFx0XHRkb20uYWRkY2xhc3MoXCIjdHdpbm1vZGVcIixcIm9mZlwiKTtcblx0XHRcdFx0XHRkb20ucmVtb3ZlY2xhc3MoXCIjc2luZ2xlbW9kZVwiLFwib2ZmXCIpO1xuXHRcdFx0XHRcdGRhdGEudXNlcnNldHRpbmdzLnR3aW5tb2RlID0gZmFsc2U7XG5cdFx0XHRcdH07XG5cdFx0XHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjdHdpbm1vZGVcIikub25jbGljayA9ICgpID0+IHtcblx0XHRcdFx0XHRkb20uYWRkY2xhc3MoXCJib2R5XCIsXCJ0d2lubW9kZVwiKTtcblx0XHRcdFx0XHRkb20ucmVtb3ZlY2xhc3MoXCIjdHdpbm1vZGVcIixcIm9mZlwiKTtcblx0XHRcdFx0XHRkb20uYWRkY2xhc3MoXCIjc2luZ2xlbW9kZVwiLFwib2ZmXCIpO1xuXHRcdFx0XHRcdGRhdGEudXNlcnNldHRpbmdzLnR3aW5tb2RlID0gdHJ1ZTtcblx0XHRcdFx0fTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gc2hvdy9oaWRlIG5vdGVzXG5cblx0XHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjaGlkZW5vdGVzXCIpLm9uY2xpY2sgPSAoKSA9PiB7XG5cdFx0XHRcdGRvbS5hZGRjbGFzcyhcImJvZHlcIixcImhpZGVub3Rlc1wiKTtcblx0XHRcdFx0ZG9tLmFkZGNsYXNzKFwiI3Nob3dub3Rlc1wiLFwib2ZmXCIpO1xuXHRcdFx0XHRkb20ucmVtb3ZlY2xhc3MoXCIjaGlkZW5vdGVzXCIsXCJvZmZcIik7XG5cdFx0XHR9XG5cdFx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3Nob3dub3Rlc1wiKS5vbmNsaWNrID0gKCkgPT4ge1xuXHRcdFx0XHRkb20ucmVtb3ZlY2xhc3MoXCJib2R5XCIsXCJoaWRlbm90ZXNcIik7XG5cdFx0XHRcdGRvbS5hZGRjbGFzcyhcIiNoaWRlbm90ZXNcIixcIm9mZlwiKTtcblx0XHRcdFx0ZG9tLnJlbW92ZWNsYXNzKFwiI3Nob3dub3Rlc1wiLFwib2ZmXCIpO1xuXHRcdFx0fVxuXG5cdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJhY2tidXR0b25cIikub25jbGljayA9ICgpID0+IHtcblx0XHRcdFx0aWYoZGF0YS5jdXJyZW50cGFnZSA9PSBcImhlbHBcIiB8fCBkYXRhLmN1cnJlbnRwYWdlID09IFwiYWJvdXRcIikge1xuXHRcdFx0XHRcdGFwcC5zZXRwYWdlKFwic2V0dGluZ3NcIik7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YXBwLnNldHBhZ2UoXCJsZW5zXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHQvLyBzZXQgdXAgYWJvdXQgcGFnZVxuXG5cdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFib3V0dGV4dFwiKS5pbm5lckhUTUwgPSBkYXRhLmRlc2NyaXB0aW9uOyBcdFx0Ly8gc2V0IHVwIGFib3V0IHBhZ2VcblxuXHRcdFx0Zm9yKGxldCBpIGluIGRhdGEudmVyc2lvbmhpc3RvcnkpIHtcblx0XHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ2ZXJzaW9uaGlzdG9yeVwiKS5pbm5lckhUTUwgKz0gYDxsaT4ke2RhdGEudmVyc2lvbmhpc3RvcnlbaV19PC9saT5gO1xuXHRcdFx0fVxuXHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb21pbmdzb29uXCIpLmlubmVySFRNTCA9IGRhdGEuY29taW5nc29vbjtcblxuXHRcdH0sXG5cdFx0bm90ZXM6IGZ1bmN0aW9uKCkge1xuXHRcdFx0ZGF0YS5lbGVtZW50cy5tYWluLm9uY2xpY2sgPSAoKSA9PiB7XG5cdFx0XHRcdGFwcC5ub3Rlcy5oaWRlKCk7XG5cdFx0XHR9O1xuXG5cdFx0XHRmb3IobGV0IGkgPSAwOyBpIDwgZGF0YS50ZXh0ZGF0YS5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRsZXQgdGhpc25vdGVzID0gZGF0YS50ZXh0ZGF0YVtpXS5ub3Rlcztcblx0XHRcdFx0aWYodHlwZW9mIHRoaXNub3RlcyAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiSW5zZXJ0aW5nIG5vdGVzIGZvciBcIiArIGRhdGEudGV4dGRhdGFbaV0udHJhbnNsYXRpb25pZCk7XG5cdFx0XHRcdFx0Zm9yKGxldCBqID0gMDsgaiA8IHRoaXNub3Rlcy5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRcdFx0Zm9yKGxldCBrID0gMDsgayA8IHRoaXNub3Rlc1tqXS5sZW5ndGg7IGsrKykge1xuXHRcdFx0XHRcdFx0XHRsZXQgdGhpc25vdGUgPSB0aGlzbm90ZXNbal1ba107XG5cdFx0XHRcdFx0XHRcdGlmKGRhdGEudGV4dGRhdGFbaV0udGV4dFtqXS5pbmRleE9mKFwie3tcIit0aGlzbm90ZS5ub3Rlbm8rXCJ9fVwiKSA+IDApIHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgY29weSA9IGRhdGEudGV4dGRhdGFbaV0udGV4dFtqXS5yZXBsYWNlKFwie3tcIit0aGlzbm90ZS5ub3Rlbm8rXCJ9fVwiLCBgPHNwYW4gY2xhc3M9XCJub3RlXCI+PHNwYW4gY2xhc3M9XCJub3Rlbm9cIj4ke2srMX08L3NwYW4+PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPiR7dGhpc25vdGUubm90ZXRleHR9PC9zcGFuPjwvc3Bhbj5gKTtcblx0XHRcdFx0XHRcdFx0XHRkYXRhLnRleHRkYXRhW2ldLnRleHRbal0gPSBjb3B5O1xuXHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiTm90IGZvdW5kIGluIGNhbnRvIFwiK2orXCI6IFwiK3RoaXNub3RlLm5vdGVubytcIjogXCIrdGhpc25vdGUubm90ZXRleHQpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHR9LFxuXHRcdHN3aXBpbmc6IGZ1bmN0aW9uKCkge1x0XHRcdC8vIHN3aXBlIGNvbnRyb2xzXG5cdFx0XHRkYXRhLmVsZW1lbnRzLmhhbW1lcnJpZ2h0ID0gbmV3IEhhbW1lcihkYXRhLmxlbnMucmlnaHQuc2xpZGVyLCB7XG5cdFx0XHRcdHRvdWNoQWN0aW9uIDogJ2F1dG8nXG5cdFx0XHR9KTtcblx0XHRcdGRhdGEuZWxlbWVudHMuaGFtbWVybGVmdCA9IG5ldyBIYW1tZXIoZGF0YS5sZW5zLmxlZnQuc2xpZGVyLCB7XG5cdFx0XHRcdHRvdWNoQWN0aW9uIDogJ2F1dG8nXG5cdFx0XHR9KTtcblx0XHRcdGRhdGEuZWxlbWVudHMuaGFtbWVycmlnaHQuZ2V0KCdzd2lwZScpLnNldCh7IGRpcmVjdGlvbjogSGFtbWVyLkRJUkVDVElPTl9BTEwgfSk7XG5cdFx0XHRkYXRhLmVsZW1lbnRzLmhhbW1lcnJpZ2h0Lm9uKCdzd2lwZWxlZnQnLChlKSA9PiB7XG5cdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0YXBwLnNldGxlbnMoYXBwLmhlbHBlcnMubmV4dHRyYW5zKGRhdGEubGVucy5yaWdodC50cmFuc2xhdGlvbiksZGF0YS5jYW50byxcInJpZ2h0XCIpO1xuXHRcdFx0fSkub24oJ3N3aXBlcmlnaHQnLChlKSA9PiB7XG5cdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0YXBwLnNldGxlbnMoYXBwLmhlbHBlcnMucHJldnRyYW5zKGRhdGEubGVucy5yaWdodC50cmFuc2xhdGlvbiksZGF0YS5jYW50byxcInJpZ2h0XCIpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGRhdGEuZWxlbWVudHMuaGFtbWVycmlnaHQub24oJ3N3aXBlZG93bicsKGUpID0+IHtcblx0XHRcdFx0Ly8gZS5wcmV2ZW50RGVmYXVsdCgpOyAvLyBhdHRlbXB0IHRvIGZpeCBhbmRyb2lkIHN3aXBlIGRvd24gPSByZWxvYWQgYmVoYXZpb3Jcblx0XHRcdFx0aWYoZGF0YS5sZW5zLnJpZ2h0LnRleHQuc2Nyb2xsVG9wID09PSAwKSB7XG5cdFx0XHRcdFx0YXBwLnNldGxlbnMoZGF0YS5sZW5zLnJpZ2h0LnRyYW5zbGF0aW9uLGRhdGEuY2FudG8tMSxcInJpZ2h0XCIsMSk7ICAvLyB0aGlzIG5lZWRzIHRvIGJlIGF0IHRoZSBib3R0b20hXG5cdFx0XHRcdH1cblx0XHRcdH0pLm9uKCdzd2lwZXVwJywoZSkgPT4ge1xuXHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdC8vIGlmIGRpZmZlcmVuY2UgYmV0d2VlbiBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbiArIGhlaWdodCBvZiBmcmFtZSAmIGNvbXBsZXRlIGhlaWdodFxuXHRcdFx0XHQvLyBvZiBjb2x1bW4gaXMgbGVzcyB0aGFuIDgsIGdvIHRvIHRoZSBuZXh0IG9uZVxuXHRcdFx0XHRpZihNYXRoLmFicyhkYXRhLmxlbnMucmlnaHQudGV4dC5zY3JvbGxUb3AgKyBkYXRhLmxlbnMucmlnaHQudGV4dC5jbGllbnRIZWlnaHQgLSBkYXRhLmxlbnMucmlnaHQudGV4dC5zY3JvbGxIZWlnaHQpIDwgNCkge1xuXHRcdFx0XHRcdGFwcC5zZXRsZW5zKGRhdGEubGVucy5yaWdodC50cmFuc2xhdGlvbixkYXRhLmNhbnRvKzEsXCJyaWdodFwiKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHRkYXRhLmVsZW1lbnRzLmhhbW1lcmxlZnQuZ2V0KCdzd2lwZScpLnNldCh7IGRpcmVjdGlvbjogSGFtbWVyLkRJUkVDVElPTl9BTEwgfSk7XG5cdFx0XHRkYXRhLmVsZW1lbnRzLmhhbW1lcmxlZnQub24oJ3N3aXBlbGVmdCcsKGUpID0+IHtcblx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRhcHAuc2V0bGVucyhhcHAuaGVscGVycy5uZXh0dHJhbnMoZGF0YS5sZW5zLmxlZnQudHJhbnNsYXRpb24pLGRhdGEuY2FudG8sXCJsZWZ0XCIpO1xuXHRcdFx0fSkub24oJ3N3aXBlcmlnaHQnLChlKSA9PiB7XG5cdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0YXBwLnNldGxlbnMoYXBwLmhlbHBlcnMucHJldnRyYW5zKGRhdGEubGVucy5sZWZ0LnRyYW5zbGF0aW9uKSxkYXRhLmNhbnRvLFwibGVmdFwiKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRkYXRhLmVsZW1lbnRzLmhhbW1lcmxlZnQub24oJ3N3aXBlZG93bicsKGUpID0+IHtcblx0XHRcdFx0Ly8gZS5wcmV2ZW50RGVmYXVsdCgpOyAvLyBhdHRlbXB0IHRvIGZpeCBhbmRyb2lkIHN3aXBlIGRvd24gPSByZWxvYWQgYmVoYXZpb3Jcblx0XHRcdFx0aWYoZGF0YS5sZW5zLmxlZnQudGV4dC5zY3JvbGxUb3AgPT09IDApIHtcblx0XHRcdFx0XHRhcHAuc2V0bGVucyhkYXRhLmxlbnMucmlnaHQudHJhbnNsYXRpb24sZGF0YS5jYW50by0xLFwicmlnaHRcIiwxKTsgIC8vIHRoaXMgbmVlZHMgdG8gYmUgYXQgdGhlIGJvdHRvbSFcblx0XHRcdFx0fVxuXHRcdFx0fSkub24oJ3N3aXBldXAnLChlKSA9PiB7XG5cdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0Ly8gaWYgZGlmZmVyZW5jZSBiZXR3ZWVuIGN1cnJlbnQgc2Nyb2xsIHBvc2l0aW9uICsgaGVpZ2h0IG9mIGZyYW1lICYgY29tcGxldGUgaGVpZ2h0XG5cdFx0XHRcdC8vIG9mIGNvbHVtbiBpcyBsZXNzIHRoYW4gOCwgZ28gdG8gdGhlIG5leHQgb25lXG5cdFx0XHRcdGlmKE1hdGguYWJzKGRhdGEubGVucy5sZWZ0LnRleHQuc2Nyb2xsVG9wICsgZGF0YS5sZW5zLmxlZnQudGV4dC5jbGllbnRIZWlnaHQgLSBkYXRhLmxlbnMubGVmdC50ZXh0LnNjcm9sbEhlaWdodCkgPCA0KSB7XG5cdFx0XHRcdFx0YXBwLnNldGxlbnMoZGF0YS5sZW5zLnJpZ2h0LnRyYW5zbGF0aW9uLGRhdGEuY2FudG8rMSxcInJpZ2h0XCIpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9LFxuXHRcdGtleXM6IGZ1bmN0aW9uKCkge1xuXHRcdFx0Ly8ga2V5IGNvbnRyb2xzXG5cblx0XHRcdGRvY3VtZW50LmJvZHkub25rZXlkb3duID0gKGUpID0+IHtcblx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRpZigoZS5rZXlDb2RlIHx8IGUud2hpY2gpID09PSAzNykge1xuXHRcdFx0XHRcdGRvbS5hZGRjbGFzcyhcIiNuYXZwcmV2XCIsXCJvblwiKTtcblx0XHRcdFx0XHRhcHAuc2V0bGVucyhhcHAuaGVscGVycy5wcmV2dHJhbnMoZGF0YS5sZW5zLnJpZ2h0LnRyYW5zbGF0aW9uKSxkYXRhLmNhbnRvLFwicmlnaHRcIik7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoKGUua2V5Q29kZSB8fCBlLndoaWNoKSA9PT0gMzkpIHtcblx0XHRcdFx0XHRkb20uYWRkY2xhc3MoXCIjbmF2bmV4dFwiLFwib25cIik7XG5cdFx0XHRcdFx0YXBwLnNldGxlbnMoYXBwLmhlbHBlcnMubmV4dHRyYW5zKGRhdGEubGVucy5yaWdodC50cmFuc2xhdGlvbiksZGF0YS5jYW50byxcInJpZ2h0XCIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKChlLmtleUNvZGUgfHwgZS53aGljaCkgPT09IDM4KSB7XG5cdFx0XHRcdFx0ZG9tLmFkZGNsYXNzKFwiI25hdnVwXCIsXCJvblwiKTtcblx0XHRcdFx0XHRhcHAuc2V0bGVucyhkYXRhLmxlbnMucmlnaHQudHJhbnNsYXRpb24sZGF0YS5jYW50by0xLFwicmlnaHRcIik7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYoKGUua2V5Q29kZSB8fCBlLndoaWNoKSA9PT0gNDApIHtcblx0XHRcdFx0XHRkb20uYWRkY2xhc3MoXCIjbmF2ZG93blwiLFwib25cIik7XG5cdFx0XHRcdFx0YXBwLnNldGxlbnMoZGF0YS5sZW5zLnJpZ2h0LnRyYW5zbGF0aW9uLGRhdGEuY2FudG8rMSxcInJpZ2h0XCIsMCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZigoZS5rZXlDb2RlIHx8IGUud2hpY2gpID09PSAzMykge1x0Ly8gcGFnZXVwOiByaWdodCBub3cgdGhpcyBnb2VzIHRvIHRoZSBwcmV2aW91cyBjYW50b1xuXHRcdFx0XHRcdGRvbS5hZGRjbGFzcyhcIiNuYXZ1cFwiLFwib25cIik7XG5cdFx0XHRcdFx0YXBwLnNldGxlbnMoZGF0YS5sZW5zLnJpZ2h0LnRyYW5zbGF0aW9uLGRhdGEuY2FudG8tMSxcInJpZ2h0XCIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKChlLmtleUNvZGUgfHwgZS53aGljaCkgPT09IDM0KSB7XHQvLyBwYWdlZG93bjogcmlnaHQgbm93IHRoaXMgZ29lcyB0byB0aGUgbmV4dCBjYW50b1xuXHRcdFx0XHRcdGRvbS5hZGRjbGFzcyhcIiNuYXZkb3duXCIsXCJvblwiKTtcblx0XHRcdFx0XHRhcHAuc2V0bGVucyhkYXRhLmxlbnMucmlnaHQudHJhbnNsYXRpb24sZGF0YS5jYW50bysxLFwicmlnaHRcIiwwKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKChlLmtleUNvZGUgfHwgZS53aGljaCkgPT09IDM2KSB7XHQvLyBob21lOiByaWdodCBub3cgdGhpcyBnb2VzIHRvIHRoZSBmaXJzdCBjYW50b1xuXHRcdFx0XHRcdGRvbS5hZGRjbGFzcyhcIiNuYXZ1cFwiLFwib25cIik7XG5cdFx0XHRcdFx0YXBwLnNldGxlbnMoZGF0YS5sZW5zLnJpZ2h0LnRyYW5zbGF0aW9uLDAsXCJyaWdodFwiKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZigoZS5rZXlDb2RlIHx8IGUud2hpY2gpID09PSAzNSkge1x0Ly8gZW5kOiByaWdodCBub3cgdGhpcyBnb2VzIHRvIHRoZSBsYXN0IGNhbnRvXG5cdFx0XHRcdFx0ZG9tLmFkZGNsYXNzKFwiI25hdmRvd25cIixcIm9uXCIpO1xuXHRcdFx0XHRcdGFwcC5zZXRsZW5zKGRhdGEubGVucy5yaWdodC50cmFuc2xhdGlvbixkYXRhLmNhbnRvY291bnQtMSxcInJpZ2h0XCIsMCk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXHR9LFxuXHRyZXNpemU6IGZ1bmN0aW9uKCkge1xuXG5cdFx0Ly9jb25zb2xlLmxvZyhcIk5hdmJhcjogXCIgKyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hdmJhclwiKS5jbGllbnRXaWR0aCk7XG5cdFx0Ly9jb25zb2xlLmxvZyhcIk5hdnRpdGxlOiBcIiArIGRhdGEubGVucy5yaWdodC50aXRsZWJhci5jbGllbnRXaWR0aCk7XG5cdFx0Ly9jb25zb2xlLmxvZyhcImJ1dHRvbiB3aWR0aDogXCIgKyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLm5hdnByZXZcIikuY2xpZW50V2lkdGgpO1xuXG5cdFx0ZGF0YS53aW5kb3d3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuXHRcdGRhdGEud2luZG93aGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuXHRcdGxldCB0aXRsZXdpZHRoID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXZiYXJcIikuY2xpZW50V2lkdGggLSAoNSAqIDQwKSAtIDE7XG5cblx0XHRpZihkYXRhLnVzZXJzZXR0aW5ncy50d2lubW9kZSAmJiBkYXRhLndpbmRvd3dpZHRoID4gNzY4KSB7XG5cdFx0XHRkb20uYWRkY2xhc3MoXCJib2R5XCIsXCJ0d2lubW9kZVwiKTtcblx0XHRcdHRpdGxld2lkdGggPSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXZiYXJcIikuY2xpZW50V2lkdGggLyAyKSAtICg1ICogNDApIC0gMTtcblx0XHRcdGNvbnNvbGUubG9nKFwiVHdpbiBtb2RlIVwiKTtcblx0XHRcdGlmKGRhdGEubGVucy5sZWZ0LnRyYW5zbGF0aW9uID09PSBcIlwiKSB7XG5cdFx0XHRcdGRhdGEubGVucy5sZWZ0LnRyYW5zbGF0aW9uID0gYXBwLmhlbHBlcnMubmV4dHRyYW5zKGRhdGEubGVucy5yaWdodC50cmFuc2xhdGlvbik7XG5cdFx0XHR9XG5cblx0XHRcdGxldCB0aGlzdHJhbnMgPSBhcHAuaGVscGVycy5nZXR0cmFuc2xhdGlvbmluZGV4KGRhdGEubGVucy5sZWZ0LnRyYW5zbGF0aW9uKTtcblxuXHRcdFx0ZG9tLmFkZGNsYXNzKFwiI3NsaWRlcmxlZnQgLnRleHRmcmFtZVwiLCBkYXRhLnRyYW5zbGF0aW9uZGF0YVt0aGlzdHJhbnNdLnRyYW5zbGF0aW9uY2xhc3MpO1xuXHRcdFx0bGV0IGluc2VydCA9IGRvbS5jcmVhdGUoZGF0YS50ZXh0ZGF0YVt0aGlzdHJhbnNdLnRleHRbZGF0YS5jYW50b10pO1xuXHRcdFx0ZGF0YS5sZW5zLmxlZnQudGV4dGluc2lkZS5hcHBlbmRDaGlsZChpbnNlcnQpO1xuXG5cdFx0XHRkYXRhLmxlbnMubGVmdC5zbGlkZXIuc3R5bGUud2lkdGggPSBcIjUwJVwiO1xuXHRcdFx0ZGF0YS5sZW5zLnJpZ2h0LnNsaWRlci5zdHlsZS53aWR0aCA9IFwiNTAlXCI7XG5cdFx0XHRhcHAuc2V0bGVucyhkYXRhLmxlbnMubGVmdC50cmFuc2xhdGlvbixkYXRhLmNhbnRvLFwibGVmdFwiKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc29sZS5sb2coXCJTaW5nbGUgbW9kZSFcIik7XG5cdFx0XHRkb20ucmVtb3ZlY2xhc3MoXCJib2R5XCIsXCJ0d2lubW9kZVwiKTtcblxuXHRcdFx0ZGF0YS5sZW5zLmxlZnQuc2xpZGVyLnN0eWxlLndpZHRoID0gXCIwXCI7XG5cdFx0XHRkYXRhLmxlbnMucmlnaHQuc2xpZGVyLnN0eWxlLndpZHRoID0gXCIxMDAlXCI7XG5cdFx0fVxuXG5cdFx0ZGF0YS5sZW5zLmxlZnQudGl0bGViYXIuc3R5bGUud2lkdGggPSBgJHt0aXRsZXdpZHRofXB4YDtcblx0XHRkYXRhLmxlbnMubGVmdC50aXRsZWJhci5zZXRBdHRyaWJ1dGUoXCJzdHlsZVwiLGB3aWR0aDoke3RpdGxld2lkdGh9cHhgKTtcblx0XHRkYXRhLmxlbnMucmlnaHQudGl0bGViYXIuc3R5bGUud2lkdGggPSBgJHt0aXRsZXdpZHRofXB4YDtcblx0XHRkYXRhLmxlbnMucmlnaHQudGl0bGViYXIuc2V0QXR0cmlidXRlKFwic3R5bGVcIixgd2lkdGg6JHt0aXRsZXdpZHRofXB4YCk7XG5cblx0XHRjb25zb2xlLmxvZyhgVGhlIHdpbmRvdyBoYXMgYmVlbiByZXNpemVkISBOZXcgd2lkdGg6ICR7ZGF0YS53aW5kb3d3aWR0aH0sJHtkYXRhLndpbmRvd2hlaWdodH1gKTtcblx0XHRkYXRhLmxlbnMud2lkdGggPSBkYXRhLndpbmRvd3dpZHRoO1xuXHRcdGRhdGEubGVucy5oZWlnaHQgPSBkYXRhLndpbmRvd2hlaWdodCAtIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2YmFyXCIpLmNsaWVudEhlaWdodDsgLy8gaXMgdGhpcyBhY2N1cmF0ZSBvbiBpT1M/XG5cblx0XHRkb20uYWRkY2xhc3MoXCIucGFnZVwiLGRhdGEubGVucy53aWR0aCA+IGRhdGEubGVucy5oZWlnaHQgPyBcImxhbmRzY2FwZVwiIDogXCJwb3J0cmFpdFwiKTtcblx0XHRkb20ucmVtb3ZlY2xhc3MoXCIucGFnZVwiLGRhdGEubGVucy53aWR0aCA+IGRhdGEubGVucy5oZWlnaHQgPyBcInBvcnRyYWl0XCIgOiBcImxhbmRzY2FwZVwiKTtcblx0XHQvKlxuXHRcdGRhdGEuZWxlbWVudHMubWFpbi5zdHlsZS53aWR0aCA9IGRhdGEubGVucy53aWR0aCtcInB4XCI7XG5cdFx0ZGF0YS5lbGVtZW50cy5jb250ZW50LnN0eWxlLndpZHRoID0gZGF0YS5sZW5zLndpZHRoK1wicHhcIjtcblx0XHQqL1xuXHRcdGRhdGEuZWxlbWVudHMubWFpbi5zdHlsZS5oZWlnaHQgPSBkYXRhLndpbmRvd2hlaWdodCtcInB4XCI7XG5cdFx0ZGF0YS5lbGVtZW50cy5jb250ZW50LnN0eWxlLmhlaWdodCA9IGRhdGEubGVucy5oZWlnaHQrXCJweFwiO1xuXG5cdFx0aWYoZGF0YS5zeXN0ZW0ucmVzcG9uc2l2ZSkge1xuXHRcdFx0Ly8gYXJlIHRoZXNlIG51bWJlcnMgYWN0dWFsbHkgc3luY2hlZCB0byB3aGF0J3MgaW4gdGhlIENTUz8gY2hlY2shXG5cblx0XHRcdGxldCBhY3R1YWx3aWR0aCA9IGRhdGEudXNlcnNldHRpbmdzLnR3aW5tb2RlID8gKGRhdGEud2luZG93d2lkdGggLyAyKSA6IGRhdGEud2luZG93d2lkdGg7XG5cblx0XHRcdGlmKGFjdHVhbHdpZHRoIDwgNjQwKSB7XG5cdFx0XHRcdGRhdGEubGVucy5sZWZ0LmxpbmVoZWlnaHQgPSAyMDtcblx0XHRcdFx0ZGF0YS5sZW5zLnJpZ2h0LmxpbmVoZWlnaHQgPSAyMDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmKGFjdHVhbHdpZHRoIDwgNzY4KSB7XG5cdFx0XHRcdFx0ZGF0YS5sZW5zLmxlZnQubGluZWhlaWdodCA9IDI0O1xuXHRcdFx0XHRcdGRhdGEubGVucy5yaWdodC5saW5laGVpZ2h0ID0gMjQ7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aWYoYWN0dWFsd2lkdGggPCAxMDI0KSB7XG5cdFx0XHRcdFx0XHRkYXRhLmxlbnMubGVmdC5saW5laGVpZ2h0ID0gMjg7XG5cdFx0XHRcdFx0XHRkYXRhLmxlbnMucmlnaHQubGluZWhlaWdodCA9IDI4O1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRkYXRhLmxlbnMubGVmdC5saW5laGVpZ2h0ID0gMzI7XG5cdFx0XHRcdFx0XHRkYXRhLmxlbnMucmlnaHQubGluZWhlaWdodCA9IDMyO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRkYXRhLmxlbnMubGVmdC5saW5laGVpZ2h0ID0gZGF0YS53aW5kb3d3aWR0aC8yNTtcblx0XHRcdGRhdGEubGVucy5yaWdodC5saW5laGVpZ2h0ID0gZGF0YS53aW5kb3d3aWR0aC8yNTtcblx0XHR9XG5cblx0XHRkYXRhLmxlbnMubGVmdC53aWR0aCA9IGRhdGEudXNlcnNldHRpbmdzLnR3aW5tb2RlID8gZGF0YS53aW5kb3d3aWR0aCAvIDIgOiAwO1xuXHRcdGRhdGEubGVucy5yaWdodC53aWR0aCA9IGRhdGEudXNlcnNldHRpbmdzLnR3aW5tb2RlID8gZGF0YS53aW5kb3d3aWR0aCAvIDIgOiBkYXRhLndpbmRvd3dpZHRoO1xuXG5cdFx0YXBwLnNldGxlbnMoZGF0YS5sZW5zLnJpZ2h0LnRyYW5zbGF0aW9uLGRhdGEuY2FudG8sXCJyaWdodFwiKTtcblx0fSxcblx0c2V0bGVuczogZnVuY3Rpb24obmV3dHJhbnMsIG5ld2NhbnRvLCBzaWRlLCBwZXJjZW50YWdlKSB7XG5cdFx0Y29uc29sZS5sb2coYFxcblNldGxlbnMgY2FsbGVkIGZvciAke25ld3RyYW5zfSwgY2FudG8gJHtuZXdjYW50b30sICR7c2lkZX1gKTtcblxuXHRcdC8vIGlmIHBhZ2UgaXNuJ3Qgc2V0IHRvIFwibGVuc1wiIHRoaXMgZG9lc24ndCBkbyBhbnl0aGluZ1xuXG5cdFx0aWYoZGF0YS5jdXJyZW50cGFnZSA9PSBcImxlbnNcIikge1xuXG5cdFx0XHRsZXQgY2hhbmdldHJhbnMsIGNoYW5nZWNhbnRvID0gZmFsc2U7XG5cdFx0XHRsZXQgdGhpc3NpZGUgPSBkYXRhLmxlbnNbc2lkZV07XG5cdFx0XHRsZXQgb3RoZXJzaWRlID0gKHNpZGUgPT0gXCJyaWdodFwiKSA/IGRhdGEubGVucy5sZWZ0IDogZGF0YS5sZW5zLnJpZ2h0O1xuXHRcdFx0bGV0IG90aGVyID0gKHNpZGUgPT0gXCJyaWdodFwiKSA/IFwibGVmdFwiIDogXCJyaWdodFwiO1xuXHRcdFx0Ly9cdFx0ZG9tLnJlbW92ZWJ5c2VsZWN0b3IoXCIjb2xkdGV4dGxlZnRcIik7IC8vIGF0dGVtcHQgdG8gZml4IGZsaWNrZXJpbmcgaWYgdG9vIGZhc3QgY2hhbmdlXG5cdFx0XHQvL1x0XHRkb20ucmVtb3ZlYnlzZWxlY3RvcihcIiNvbGR0ZXh0cmlnaHRcIik7IC8vIGF0dGVtcHQgdG8gZml4IGZsaWNrZXJpbmcgaWYgdG9vIGZhc3QgY2hhbmdlXG5cblx0XHRcdGxldCBvbGR0cmFuc2luZGV4ID0gZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0LmluZGV4T2YodGhpc3NpZGUudHJhbnNsYXRpb24pOyAvLyB0aGUgbnVtYmVyIG9mIHRoZSBvbGQgdHJhbnNsYXRpb24gaW4gY3VycmVudCBsaXN0XG5cdFx0XHRsZXQgbmV3dHJhbnNpbmRleCA9IGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdC5pbmRleE9mKG5ld3RyYW5zKTsgLy8gdGhlIG51bWJlciBvZiB0aGUgdHJhbnMgd2UncmUgZ29pbmcgdG8gaW4gY3VycmVudGxpc3RcblxuXHRcdFx0aWYobmV3Y2FudG8gIT09IGRhdGEuY2FudG8pIHtcblx0XHRcdFx0Y2hhbmdlY2FudG8gPSB0cnVlO1xuXHRcdFx0XHRpZihuZXdjYW50byA+PSBkYXRhLmNhbnRvY291bnQpIHtcblx0XHRcdFx0XHRuZXdjYW50byA9IDA7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aWYobmV3Y2FudG8gPCAwKSB7XG5cdFx0XHRcdFx0XHRuZXdjYW50byA9IGRhdGEuY2FudG9jb3VudC0xO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZigobmV3dHJhbnNpbmRleCAtIG9sZHRyYW5zaW5kZXgpICE9PSAwKSB7XG5cdFx0XHRcdGNoYW5nZXRyYW5zID0gdHJ1ZTtcblx0XHRcdFx0cGVyY2VudGFnZSA9ICh0aGlzc2lkZS50ZXh0LnNjcm9sbFRvcCAvKisgdGhpc3NpZGUudGV4dC5jbGllbnRIZWlnaHQqLykvdGhpc3NpZGUudGV4dC5zY3JvbGxIZWlnaHQ7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGDigJQ+Q3VycmVudCBwZXJjZW50YWdlOiAke3BlcmNlbnRhZ2V9YCk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIG5lZWQgdG8gZmlndXJlIHdoaWNoIHRyYW5zbGF0aW9uZGF0YSB3ZSBuZWVkIGZyb20gbWFzdGVyIGxpc3Qgb2YgdHJhbnNsYXRpb25zXG5cblx0XHRcdGxldCBvdGhlcnRyYW5zbGF0aW9uaW5kZXggPSAwO1xuXHRcdFx0bGV0IG5ld3RyYW5zbGF0aW9uaW5kZXggPSBhcHAuaGVscGVycy5nZXR0cmFuc2xhdGlvbmluZGV4KG5ld3RyYW5zKTtcblx0XHRcdGxldCBvbGR0cmFuc2xhdGlvbmluZGV4ID0gYXBwLmhlbHBlcnMuZ2V0dHJhbnNsYXRpb25pbmRleCh0aGlzc2lkZS50cmFuc2xhdGlvbik7XG5cdFx0XHRpZihkYXRhLnVzZXJzZXR0aW5ncy50d2lubW9kZSkge1xuXHRcdFx0XHRvdGhlcnRyYW5zbGF0aW9uaW5kZXggPSBhcHAuaGVscGVycy5nZXR0cmFuc2xhdGlvbmluZGV4KG90aGVyc2lkZS50cmFuc2xhdGlvbik7XG5cdFx0XHR9XG5cblxuXHRcdFx0aWYoY2hhbmdldHJhbnMpIHtcblxuXHRcdFx0XHRjb25zb2xlLmxvZyhcIkNoYW5naW5nIHRyYW5zbGF0aW9uIVwiKTtcblxuXHRcdFx0XHQvLyBjaGFuZ2luZyB0cmFuc2xhdGlvblxuXG5cdFx0XHRcdHRoaXNzaWRlLnRleHQuaWQgPSBgb2xkdGV4dCR7c2lkZX1gO1xuXHRcdFx0XHRsZXQgZGlyZWN0aW9uID0gMDtcblxuXHRcdFx0XHQvLyBpZiBuZXcgaXMgYmlnZ2VyIHRoYW4gb2xkIEFORCAoIG9sZCBpcyBub3QgMCBPUiBuZXcgaXMgbm90IHRoZSBsYXN0IG9uZSApXG5cdFx0XHRcdC8vIE9SIGlmIG5ldyBpcyAwIGFuZCBvbGQgaXMgdGhlIGxhc3Qgb25lXG5cblx0XHRcdFx0aWYoICgobmV3dHJhbnNpbmRleCA+IG9sZHRyYW5zaW5kZXgpICYmIChvbGR0cmFuc2luZGV4ID4gMCB8fCBuZXd0cmFuc2luZGV4ICE9PSAoZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0Lmxlbmd0aCAtIDEgKSkpIHx8IChuZXd0cmFuc2luZGV4ID09IDAgJiYgb2xkdHJhbnNpbmRleCA9PSAoZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0Lmxlbmd0aC0xKSkgKSB7XG5cblx0XHRcdFx0XHQvLyB3ZSBhcmUgaW5zZXJ0aW5nIHRvIHRoZSByaWdodFxuXG5cdFx0XHRcdFx0bGV0IGluc2VydCA9IGRvbS5jcmVhdGUoYDxkaXYgaWQ9XCJuZXd0ZXh0JHtzaWRlfVwiIGNsYXNzPVwidGV4dGZyYW1lICR7IGRhdGEudHJhbnNsYXRpb25kYXRhW25ld3RyYW5zbGF0aW9uaW5kZXhdLnRyYW5zbGF0aW9uY2xhc3MgfVwiIHN0eWxlPVwibGVmdDoxMDAlO1wiPjxkaXYgY2xhc3M9XCJ0ZXh0aW5zaWRlZnJhbWVcIj4keyBkYXRhLnRleHRkYXRhW25ld3RyYW5zbGF0aW9uaW5kZXhdLnRleHRbbmV3Y2FudG9dIH08L2Rpdj48L2Rpdj5gKTtcblx0XHRcdFx0XHR0aGlzc2lkZS5zbGlkZXIuYXBwZW5kQ2hpbGQoaW5zZXJ0KTtcblx0XHRcdFx0XHRpZihkYXRhLnVzZXJzZXR0aW5ncy50d2lubW9kZSkge1xuXHRcdFx0XHRcdFx0ZGlyZWN0aW9uID0gXCItNTAlXCI7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGRpcmVjdGlvbiA9IFwiLTEwMCVcIjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0XHQvLyB3ZSBhcmUgaW5zZXJ0aW5nIHRvIHRoZSBsZWZ0XG5cblx0XHRcdFx0XHRsZXQgaW5zZXJ0ID0gZG9tLmNyZWF0ZShgPGRpdiBpZD1cIm5ld3RleHQke3NpZGV9XCIgY2xhc3M9XCJ0ZXh0ZnJhbWUgJHsgZGF0YS50cmFuc2xhdGlvbmRhdGFbbmV3dHJhbnNsYXRpb25pbmRleF0udHJhbnNsYXRpb25jbGFzcyB9XCIgc3R5bGU9XCJsZWZ0Oi0xMDAlO1wiPjxkaXYgY2xhc3M9XCJ0ZXh0aW5zaWRlZnJhbWVcIj4keyBkYXRhLnRleHRkYXRhW25ld3RyYW5zbGF0aW9uaW5kZXhdLnRleHRbbmV3Y2FudG9dIH08L2Rpdj48L2Rpdj5gKTtcblx0XHRcdFx0XHR0aGlzc2lkZS5zbGlkZXIuaW5zZXJ0QmVmb3JlKGluc2VydCwgdGhpc3NpZGUuc2xpZGVyLmNoaWxkTm9kZXNbMF0pO1xuXHRcdFx0XHRcdGlmKGRhdGEudXNlcnNldHRpbmdzLnR3aW5tb2RlKSB7XG5cdFx0XHRcdFx0XHRkaXJlY3Rpb24gPSBcIjUwJVwiO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRkaXJlY3Rpb24gPSBcIjEwMCVcIjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRvdGhlcnNpZGUuc2xpZGVyLnN0eWxlLnpJbmRleCA9IDUwMDtcblx0XHRcdFx0VmVsb2NpdHkodGhpc3NpZGUuc2xpZGVyLCB7J2xlZnQnOmRpcmVjdGlvbn0sIHtcblx0XHRcdFx0XHRkdXJhdGlvbjogZGF0YS5zeXN0ZW0uZGVsYXksXG5cdFx0XHRcdFx0bW9iaWxlSEE6IGZhbHNlLFxuXHRcdFx0XHRcdGNvbXBsZXRlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdGRvbS5yZW1vdmVieXNlbGVjdG9yKGAjb2xkdGV4dCR7c2lkZX1gKTtcblx0XHRcdFx0XHRcdG90aGVyc2lkZS5zbGlkZXIuc3R5bGUuekluZGV4ID0gMTtcblx0XHRcdFx0XHRcdHRoaXNzaWRlLnNsaWRlci5zdHlsZS5sZWZ0ID0gXCIwXCI7XG5cdFx0XHRcdFx0XHR0aGlzc2lkZS50ZXh0LnN0eWxlLmxlZnQgPSBcIjBcIjtcblx0XHRcdFx0XHRcdGRvbS5hZGRjbGFzcyhgI3NsaWRlciR7c2lkZX0gLnRleHRmcmFtZWAsIFwibWFrZXNjcm9sbFwiKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHR0aGlzc2lkZS50ZXh0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI25ld3RleHQke3NpZGV9YCk7XG5cdFx0XHRcdHRoaXNzaWRlLnRleHRpbnNpZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjbmV3dGV4dCR7c2lkZX0gLnRleHRpbnNpZGVmcmFtZWApO1xuXHRcdFx0XHR0aGlzc2lkZS50cmFuc2xhdGlvbiA9IG5ld3RyYW5zO1xuXG5cdFx0XHRcdC8vIHRoaXMgbWV0aG9kIHN0aWxsIGlzbid0IGdyZWF0ISBpdCB0cmllcyB0byByb3VuZCB0byBjdXJyZW50IGxpbmVoZWlnaHRcblx0XHRcdFx0Ly8gdG8gYXZvaWQgY3V0dGluZyBvZmYgbGluZXNcblxuXHRcdFx0XHRsZXQgc2Nyb2xsdG8gPSBhcHAuaGVscGVycy5yb3VuZGVkKHBlcmNlbnRhZ2UgKiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjbmV3dGV4dCR7c2lkZX1gKS5zY3JvbGxIZWlnaHQpO1xuXHRcdFx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjbmV3dGV4dCR7c2lkZX1gKS5zY3JvbGxUb3AgPSBzY3JvbGx0bztcblx0XHRcdFx0aWYoZGF0YS51c2Vyc2V0dGluZ3MudHdpbm1vZGUpIHtcblx0XHRcdFx0XHRsZXQgc2Nyb2xsdG8gPSBhcHAuaGVscGVycy5yb3VuZGVkKHBlcmNlbnRhZ2UgKiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjbmV3dGV4dCR7b3RoZXJ9YCkuc2Nyb2xsSGVpZ2h0KTtcblx0XHRcdFx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjbmV3dGV4dCR7b3RoZXJ9YCkuc2Nyb2xsVG9wID0gc2Nyb2xsdG87XG5cdFx0XHRcdH1cblx0XHRcdFx0Y29uc29sZS5sb2coXCJTY3JvbGxpbmcgdG86XCIgKyBzY3JvbGx0byk7XG5cdFx0XHRcdGlmKGRhdGEudXNlcnNldHRpbmdzLnR3aW5tb2RlKSB7XG5cdFx0XHRcdFx0YXBwLmhlbHBlcnMudHVybm9uc3luY2hzY3JvbGxpbmcoKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZihjaGFuZ2VjYW50byB8fCAhY2hhbmdldHJhbnMpIHtcblxuXHRcdFx0XHQvLyB3ZSBhcmUgZWl0aGVyIGNoYW5naW5nIGNhbnRvIE9SIHRoaXMgaXMgdGhlIGZpcnN0IHJ1blxuXG5cdFx0XHRcdGlmKGRhdGEudXNlcnNldHRpbmdzLnR3aW5tb2RlKSB7XG5cdFx0XHRcdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI3NsaWRlciR7b3RoZXJ9IC50ZXh0aW5zaWRlZnJhbWVgKS5pbm5lckhUTUwgPSBkYXRhLnRleHRkYXRhW290aGVydHJhbnNsYXRpb25pbmRleF0udGV4dFtuZXdjYW50b107XG5cdFx0XHRcdFx0ZG9tLnJlbW92ZWNsYXNzKGAjc2xpZGVyJHtvdGhlcn0gLnRleHRmcmFtZWAsZGF0YS50cmFuc2xhdGlvbmRhdGFbb3RoZXJ0cmFuc2xhdGlvbmluZGV4XS50cmFuc2xhdGlvbmNsYXNzKTtcblx0XHRcdFx0XHRkb20uYWRkY2xhc3MoYCNzbGlkZXIke290aGVyfSAudGV4dGZyYW1lYCxkYXRhLnRyYW5zbGF0aW9uZGF0YVtvdGhlcnRyYW5zbGF0aW9uaW5kZXhdLnRyYW5zbGF0aW9uY2xhc3MpO1xuXHRcdFx0XHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNzbGlkZXIke3NpZGV9IC50ZXh0aW5zaWRlZnJhbWVgKS5pbm5lckhUTUwgPSBkYXRhLnRleHRkYXRhW25ld3RyYW5zbGF0aW9uaW5kZXhdLnRleHRbbmV3Y2FudG9dO1xuXHRcdFx0XHRcdGRvbS5yZW1vdmVjbGFzcyhgI3NsaWRlciR7c2lkZX0gLnRleHRmcmFtZWAsZGF0YS50cmFuc2xhdGlvbmRhdGFbb2xkdHJhbnNsYXRpb25pbmRleF0udHJhbnNsYXRpb25jbGFzcyk7XG5cdFx0XHRcdFx0ZG9tLmFkZGNsYXNzKGAjc2xpZGVyJHtzaWRlfSAudGV4dGZyYW1lYCxkYXRhLnRyYW5zbGF0aW9uZGF0YVtuZXd0cmFuc2xhdGlvbmluZGV4XS50cmFuc2xhdGlvbmNsYXNzKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjc2xpZGVyJHtzaWRlfSAudGV4dGluc2lkZWZyYW1lYCkuaW5uZXJIVE1MID0gZGF0YS50ZXh0ZGF0YVtuZXd0cmFuc2xhdGlvbmluZGV4XS50ZXh0W25ld2NhbnRvXTtcblx0XHRcdFx0XHRkb20ucmVtb3ZlY2xhc3MoYCNzbGlkZXIke3NpZGV9IC50ZXh0ZnJhbWVgLGRhdGEudHJhbnNsYXRpb25kYXRhW29sZHRyYW5zbGF0aW9uaW5kZXhdLnRyYW5zbGF0aW9uY2xhc3MpOyAvLyBpcyB0aGlzIG5vdCB3b3JraW5nIGZvciBtdWx0aXBsZSBjbGFzc2VzP1xuXHRcdFx0XHRcdGRvbS5hZGRjbGFzcyhgI3NsaWRlciR7c2lkZX0gLnRleHRmcmFtZWAsZGF0YS50cmFuc2xhdGlvbmRhdGFbbmV3dHJhbnNsYXRpb25pbmRleF0udHJhbnNsYXRpb25jbGFzcyk7IC8vIGlzIHRoaXMgbm90IHdvcmtpbmcgZm9yIG11bHRpcGxlIGNsYXNzZXM/XG5cdFx0XHRcdH1cblx0XHRcdFx0ZGF0YS5jYW50byA9IG5ld2NhbnRvO1xuXG5cdFx0XHRcdGlmKHBlcmNlbnRhZ2UgPiAwKSB7XG5cdFx0XHRcdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI25ld3RleHQke3NpZGV9YCkuc2Nyb2xsVG9wID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI25ld3RleHQke3NpZGV9YCkuc2Nyb2xsSGVpZ2h0O1xuXHRcdFx0XHRcdGlmKGRhdGEudXNlcnNldHRpbmdzLnR3aW5tb2RlKSB7XG5cdFx0XHRcdFx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjbmV3dGV4dCR7b3RoZXJ9YCkuc2Nyb2xsVG9wID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI25ld3RleHQke290aGVyfWApLnNjcm9sbEhlaWdodDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI25ld3RleHQke3NpZGV9YCkuc2Nyb2xsVG9wID0gMDtcblx0XHRcdFx0XHRpZihkYXRhLnVzZXJzZXR0aW5ncy50d2lubW9kZSkge1xuXHRcdFx0XHRcdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI25ld3RleHQke290aGVyfWApLnNjcm9sbFRvcCA9IDA7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGlmKGRhdGEuc3lzdGVtLnJlc3BvbnNpdmUpIHtcblx0XHRcdFx0YXBwLmhlbHBlcnMuZml4cGFkZGluZ3Jlc3BvbnNpdmUodGhpc3NpZGUpO1xuXHRcdFx0XHRpZihkYXRhLnVzZXJzZXR0aW5ncy50d2lubW9kZSkge1xuXHRcdFx0XHRcdGFwcC5oZWxwZXJzLmZpeHBhZGRpbmdyZXNwb25zaXZlKG90aGVyc2lkZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGFwcC5oZWxwZXJzLmZpeHBhZGRpbmcodGhpc3NpZGUpO1xuXHRcdFx0XHRpZihkYXRhLnVzZXJzZXR0aW5ncy50d2lubW9kZSkge1xuXHRcdFx0XHRcdGFwcC5oZWxwZXJzLmZpeHBhZGRpbmcob3RoZXJzaWRlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBkZWFsIHdpdGggdGl0bGUgYmFyXG5cblx0XHRcdGlmKGRhdGEuY2FudG8gPiAwKSB7XG5cdFx0XHRcdHRoaXNzaWRlLnRpdGxlYmFyLmlubmVySFRNTCA9IGAke2RhdGEudHJhbnNsYXRpb25kYXRhW25ld3RyYW5zbGF0aW9uaW5kZXhdLnRyYW5zbGF0aW9uc2hvcnRuYW1lfSDCtyA8c3Ryb25nPkNhbnRvICR7ZGF0YS5jYW50b308L3N0cm9uZz5gO1xuXHRcdFx0XHRpZihkYXRhLnVzZXJzZXR0aW5ncy50d2lubW9kZSkge1xuXHRcdFx0XHRcdGlmKGRhdGEudXNlcnNldHRpbmdzLnR3aW5tb2RlKSB7XG5cdFx0XHRcdFx0XHRvdGhlcnNpZGUudGl0bGViYXIuaW5uZXJIVE1MID0gYCR7ZGF0YS50cmFuc2xhdGlvbmRhdGFbb3RoZXJ0cmFuc2xhdGlvbmluZGV4XS50cmFuc2xhdGlvbnNob3J0bmFtZX0gwrcgPHN0cm9uZz5DYW50byAke2RhdGEuY2FudG99PC9zdHJvbmc+YDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXNzaWRlLnRpdGxlYmFyLmlubmVySFRNTCA9IFwiJm5ic3A7XCI7XG5cdFx0XHRcdGlmKGRhdGEudXNlcnNldHRpbmdzLnR3aW5tb2RlKSB7XG5cdFx0XHRcdFx0b3RoZXJzaWRlLnRpdGxlYmFyLmlubmVySFRNTCA9IFwiJm5ic3A7XCI7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gc2V0IHVwIG5vdGVzXG5cblx0XHRcdGFwcC5ub3Rlcy5zZXR1cCgpO1xuXG5cdFx0XHQvLyB0dXJuIG9uIHN5bmNoIHNjcm9sbGluZ1xuXG5cdFx0XHRpZihkYXRhLnVzZXJzZXR0aW5ncy50d2lubW9kZSkge1xuXHRcdFx0XHRhcHAuaGVscGVycy50dXJub25zeW5jaHNjcm9sbGluZygpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyByZWNvcmQgY2hhbmdlc1xuXG5cdFx0XHRhcHAubG9jYWxkYXRhLnNhdmUoKTtcblx0XHR9XG5cdH0sXG5cdHNldHBhZ2U6IGZ1bmN0aW9uKG5ld3BhZ2UpIHtcblx0XHRkb20ucmVtb3ZlY2xhc3MoXCIucGFnZVwiLFwib25cIik7XG5cdFx0ZG9tLmFkZGNsYXNzKFwiLnBhZ2UjXCIrbmV3cGFnZSxcIm9uXCIpO1xuXHRcdGRhdGEuY3VycmVudHBhZ2UgPSBuZXdwYWdlO1xuXHRcdGlmKG5ld3BhZ2UgIT09IFwibGVuc1wiKSB7XG5cdFx0XHQvLyBzZXQgdGl0bGUgdG8gYmUgd2hhdGV2ZXIgdGhlIGgxIGlzXG5cblx0XHRcdGxldCBuZXd0aXRsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjXCIgKyBuZXdwYWdlICsgXCIgaDFcIikuaW5uZXJIVE1MO1xuXHRcdFx0ZGF0YS5lbGVtZW50cy50aXRsZWJhci5pbm5lckhUTUwgPSBuZXd0aXRsZTtcblx0XHRcdGRvbS5hZGRjbGFzcyhcIm5hdiNuYXZiYXJsZWZ0XCIsXCJvZmZcIik7XG5cdFx0XHRkb20uYWRkY2xhc3MoXCJuYXYjbmF2YmFycmlnaHRcIixcIm9mZlwiKTtcblxuXHRcdFx0ZG9tLmFkZGNsYXNzKFwiI25hdmJhcm90aGVyXCIsXCJvblwiKTtcblxuXHRcdFx0Ly8gbWFrZSBiYWNrIGJ1dHRvbiBvbiBsZWZ0IG9mIG5hdiBiYXIgdmlzaWJsZSFcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHRkb20ucmVtb3ZlY2xhc3MoXCJuYXYjbmF2YmFybGVmdFwiLFwib2ZmXCIpO1xuXHRcdFx0ZG9tLnJlbW92ZWNsYXNzKFwibmF2I25hdmJhcnJpZ2h0XCIsXCJvZmZcIik7XG5cblx0XHRcdGRvbS5yZW1vdmVjbGFzcyhcIiNuYXZiYXJvdGhlclwiLFwib25cIik7XG5cblx0XHRcdC8vIGhpZGUgYmFjayBidXR0b24gb24gbGVmdCBvZiBuYXYgYmFyIVxuXG5cdFx0XHRhcHAucmVzaXplKCk7XG5cdFx0fVxuXHR9LFxuXHRpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZyhcImluaXRpYWxpemluZyFcIik7XG5cdFx0dGhpcy5iaW5kRXZlbnRzKCk7XG5cblx0XHQvLyBjaGVjayB0byBzZWUgaWYgdGhlcmUgYXJlIHNhdmVkIGxvY2Fsc3RvcmFnZSwgaWYgc28sIHRha2UgdGhvc2UgdmFsdWVzXG5cblx0fSxcblx0YmluZEV2ZW50czogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coXCJiaW5kaW5nIGV2ZW50cyFcIik7XG5cdFx0dmFyIHRlc3RhcHAgPSBkb2N1bWVudC5VUkwuaW5kZXhPZiggJ2h0dHA6Ly8nICkgPT09IC0xICYmIGRvY3VtZW50LlVSTC5pbmRleE9mKCAnaHR0cHM6Ly8nICkgPT09IC0xO1xuXHRcdHZhciB0ZXN0Y29yZG92YSA9ICEod2luZG93LmNvcmRvdmEgPT09IHVuZGVmaW5lZCk7IC8vIG5lZWQgdGhpcyBhcyB3ZWxsIGZvciBkZXZcblx0XHRpZih0ZXN0YXBwICYmIHRlc3Rjb3Jkb3ZhKSB7XG5cdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdkZXZpY2VyZWFkeScsIGFwcC5vbkRldmljZVJlYWR5LCBmYWxzZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGFwcC5zZXR1cCgpO1xuXHRcdH1cblxuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHRoaXMucmVzaXplLCBmYWxzZSk7XG5cblx0XHQvLyBzdGFydCBmYXN0Y2xpY2tcblxuXHRcdGlmICgnYWRkRXZlbnRMaXN0ZW5lcicgaW4gZG9jdW1lbnQpIHtcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XG5cdFx0XHRcdEZhc3RjbGljayhkb2N1bWVudC5ib2R5KTtcblx0XHRcdH0sIGZhbHNlKTtcblx0XHR9XG5cdH0sXG5cdG9uRGV2aWNlUmVhZHk6IGZ1bmN0aW9uKCkge1xuXHRcdGRhdGEuc3lzdGVtLm9uY29yZG92YSA9IHRydWU7IFx0XHRcdFx0XHQvLyB3ZSdyZSBydW5uaW5nIG9uIGNvcmRvdmFcblx0XHRkYXRhLnN5c3RlbS5wbGF0Zm9ybSA9IGRldmljZS5wbGFmb3JtO1x0Ly8gc2hvdWxkIGJlIGVpdGhlciBcImlPU1wiIG9yIFwiQW5kcm9pZFwiXG5cdFx0Y29uc29sZS5sb2coZGV2aWNlLmNvcmRvdmEpO1xuXHRcdGNvbnNvbGUubG9nKFwiQ29yZG92YSBydW5uaW5nLiBQbGF0Zm9ybTogXCIgKyBkYXRhLnN5c3RlbS5wbGF0Zm9ybSk7XG5cdFx0YXBwLnNldHVwKCk7XG5cdH0sXG5cdHNldHVwOiBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZyhcIkluIHNldHVwXCIpO1xuXG5cdFx0Ly8gYmFzaWMgZG9jIHNldHVwXG5cblx0XHRkYXRhLmVsZW1lbnRzLmxlbnMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxlbnNcIik7XG5cdFx0ZGF0YS5lbGVtZW50cy5tYWluID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYWluXCIpO1xuXHRcdGRhdGEuZWxlbWVudHMuY29udGVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGVudFwiKTtcblx0XHRkYXRhLmVsZW1lbnRzLnRpdGxlYmFyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNuYXZiYXJvdGhlciAubmF2dGl0bGVcIik7XG5cblx0XHRkYXRhLmxlbnMubGVmdC5zbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNsaWRlcmxlZnRcIik7XG5cdFx0ZGF0YS5sZW5zLmxlZnQudGV4dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc2xpZGVybGVmdCAudGV4dGZyYW1lXCIpO1xuXHRcdGRhdGEubGVucy5sZWZ0LnRleHRpbnNpZGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3NsaWRlcmxlZnQgLnRleHRpbnNpZGVmcmFtZVwiKTtcblx0XHRkYXRhLmxlbnMubGVmdC50aXRsZWJhciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmF2YmFybGVmdCAubmF2dGl0bGVcIik7XG5cblx0XHRkYXRhLmxlbnMucmlnaHQuc2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzbGlkZXJyaWdodFwiKTtcblx0XHRkYXRhLmxlbnMucmlnaHQudGV4dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc2xpZGVycmlnaHQgLnRleHRmcmFtZVwiKTtcblx0XHRkYXRhLmxlbnMucmlnaHQudGV4dGluc2lkZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc2xpZGVycmlnaHQgLnRleHRpbnNpZGVmcmFtZVwiKTtcblx0XHRkYXRhLmxlbnMucmlnaHQudGl0bGViYXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI25hdmJhcnJpZ2h0IC5uYXZ0aXRsZVwiKTtcblxuXG5cdFx0ZG9jdW1lbnQudGl0bGUgPSBcIkNyb3NzIERhbnRlIFwiICsgZGF0YS5ib29rdGl0bGU7XG5cblx0XHRpZihkYXRhLnVzZXJzZXR0aW5ncy5uaWdodG1vZGUpIHtcblx0XHRcdGRvbS5hZGRjbGFzcyhcImJvZHlcIixcIm5pZ2h0bW9kZVwiKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZG9tLnJlbW92ZWNsYXNzKFwiYm9keVwiLFwibmlnaHRtb2RlXCIpO1xuXHRcdH1cblxuXHRcdC8vIHNldCB1cCBjdXJyZW50IHRyYW5zbGF0aW9uIGxpc3QgKGluaXRpYWxseSB1c2UgYWxsIG9mIHRoZW0pXG5cblx0XHRmb3IobGV0IGkgaW4gZGF0YS50cmFuc2xhdGlvbmRhdGEpIHtcblx0XHRcdGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdC5wdXNoKGRhdGEudHJhbnNsYXRpb25kYXRhW2ldLnRyYW5zbGF0aW9uaWQpO1xuXHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0ZXh0c291cmNlc1wiKS5pbm5lckhUTUwgKz0gYDxsaT4ke2RhdGEudHJhbnNsYXRpb25kYXRhW2ldLnRyYW5zbGF0aW9uZnVsbG5hbWV9LCA8ZW0+JHtkYXRhLnRyYW5zbGF0aW9uZGF0YVtpXS50aXRsZX06PC9lbT4gJHtkYXRhLnRyYW5zbGF0aW9uZGF0YVtpXS5zb3VyY2V9PC9saT5gO1xuXHRcdH1cblxuXHRcdGRhdGEubGVucy5yaWdodC50cmFuc2xhdGlvbiA9IGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdFswXTtcblx0XHRpZighZGF0YS5zeXN0ZW0ub25jb3Jkb3ZhKSB7XG5cdFx0XHQvLyBhdHRlbXB0IHRvIGZpeCBhbmRyb2lkIHB1bGwgZG93biB0byByZWZyZXNoXG5cdFx0XHQvLyBjb2RlIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yOTAwODE5NC9kaXNhYmxpbmctYW5kcm9pZHMtY2hyb21lLXB1bGwtZG93bi10by1yZWZyZXNoLWZlYXR1cmVcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHZhciBtYXliZVByZXZlbnRQdWxsVG9SZWZyZXNoID0gZmFsc2U7XG5cdFx0XHRcdHZhciBsYXN0VG91Y2hZID0gMDtcblx0XHRcdFx0dmFyIHRvdWNoc3RhcnRIYW5kbGVyID0gZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRcdGlmIChlLnRvdWNoZXMubGVuZ3RoICE9IDEpIHJldHVybjtcblx0XHRcdFx0XHRsYXN0VG91Y2hZID0gZS50b3VjaGVzWzBdLmNsaWVudFk7XG5cdFx0XHRcdFx0Ly8gUHVsbC10by1yZWZyZXNoIHdpbGwgb25seSB0cmlnZ2VyIGlmIHRoZSBzY3JvbGwgYmVnaW5zIHdoZW4gdGhlXG5cdFx0XHRcdFx0Ly8gZG9jdW1lbnQncyBZIG9mZnNldCBpcyB6ZXJvLlxuXHRcdFx0XHRcdG1heWJlUHJldmVudFB1bGxUb1JlZnJlc2ggPSB3aW5kb3cucGFnZVlPZmZzZXQgPT0gMDtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHR2YXIgdG91Y2htb3ZlSGFuZGxlciA9IGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0XHR2YXIgdG91Y2hZID0gZS50b3VjaGVzWzBdLmNsaWVudFk7XG5cdFx0XHRcdFx0dmFyIHRvdWNoWURlbHRhID0gdG91Y2hZIC0gbGFzdFRvdWNoWTtcblx0XHRcdFx0XHRsYXN0VG91Y2hZID0gdG91Y2hZO1xuXG5cdFx0XHRcdFx0aWYgKG1heWJlUHJldmVudFB1bGxUb1JlZnJlc2gpIHtcblx0XHRcdFx0XHRcdC8vIFRvIHN1cHByZXNzIHB1bGwtdG8tcmVmcmVzaCBpdCBpcyBzdWZmaWNpZW50IHRvIHByZXZlbnREZWZhdWx0IHRoZVxuXHRcdFx0XHRcdFx0Ly8gZmlyc3Qgb3ZlcnNjcm9sbGluZyB0b3VjaG1vdmUuXG5cdFx0XHRcdFx0XHRtYXliZVByZXZlbnRQdWxsVG9SZWZyZXNoID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRpZiAodG91Y2hZRGVsdGEgPiAwKSB7XG5cdFx0XHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblxuXHRcdFx0XHRcdFx0XHRpZihkYXRhLmN1cnJlbnRwYWdlID09IFwibGVuc1wiICYmIGRhdGEubGVucy5yaWdodC50ZXh0LnNjcm9sbFRvcCA8IDEpIHtcblx0XHRcdFx0XHRcdFx0XHRhcHAuc2V0bGVucyhkYXRhLmxlbnMucmlnaHQudHJhbnNsYXRpb24sIGRhdGEuY2FudG8tMSxcInJpZ2h0XCIsMSk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fTtcblx0XHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRvdWNoc3RhcnRIYW5kbGVyLCBmYWxzZSk7XG5cdFx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRvdWNobW92ZUhhbmRsZXIsIGZhbHNlKTtcblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdGFwcC5jb250cm9scy5zdGFydCgpO1x0XHQvLyB0aGlzIHNldHMgdXAgY29udHJvbHNcblx0XHRhcHAubG9jYWxkYXRhLnJlYWQoKTtcdFx0Ly8gdGhpcyByZWFkcyBpbiBsb2NhbGx5IHNhdmVkIGRhdGFcblx0XHRkb20uYWRkY2xhc3MoXCJib2R5XCIsZGF0YS5ib29rbmFtZSk7XG5cdFx0ZG9tLmFkZGNsYXNzKFwiYm9keVwiLGRhdGEuc3lzdGVtLm9uY29yZG92YSA/IFwiY29yZG92YVwiIDogXCJ3ZWJcIik7XG5cdFx0ZG9tLnJlbW92ZWJ5c2VsZWN0b3IoXCIjbG9hZGluZ3NjcmltXCIpO1xuXHRcdGFwcC5zZXRwYWdlKFwibGVuc1wiKTsgLy8gdGhpcyBjb3VsZCBmZWFzaWJseSBiZSBzZXQgdG8gd2hhdCdzIGluIGRhdGEuY3VycmVudHBhZ2UgaWYgd2Ugd2FudGVkIHRvIHNhdmUgdGhhdCBsb2NhbGx5P1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFwcDtcbiIsIi8vIGFwcGRhdGEuanNcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGN1cnJlbnR0cmFuc2xhdGlvbmxpc3Q6IFtdLCAgICBcdFx0XHQvLyBsaXN0IG9mIGlkcyBvZiB0cmFuc2xhdGlvbnMgd2UncmUgY3VycmVudGx5IHVzaW5nXG5cdHdpbmRvd3dpZHRoOiB3aW5kb3cuaW5uZXJXaWR0aCxcdFx0XHQvLyB0aGUgd2luZG93IHdpZHRoXG5cdHdpbmRvd2hlaWdodDogd2luZG93LmlubmVySGVpZ2h0LFx0XHQvLyB0aGUgd2luZG93IGhlaWdodFxuXHRjdXJyZW50cGFnZTogXCJsZW5zXCIsXHRcdFx0XHRcdFx0XHRcdC8vIHRoZSBwYWdlIHRoYXQgd2UncmUgY3VycmVudGx5IHZpZXdpbmdcblx0Y2FudG86IDAsXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vIHRoZSBjdXJyZW50IGNhbnRvXG5cdGVsZW1lbnRzOiB7XG5cdFx0bGVuczogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsZW5zXCIpLFxuXHRcdG1haW46IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibWFpblwiKSxcblx0XHRjb250ZW50OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbnRlbnRcIiksXG5cdFx0aGFtbWVybGVmdDogXCJcIixcblx0XHRoYW1tZXJyaWdodDogXCJcIlxuXHR9LFxuXHRsZW5zOiB7XG5cdFx0d2lkdGg6IHdpbmRvdy5pbm5lcldpZHRoLFx0XHRcdFx0XHQvLyBpcyB0aGlzIGFjdHVhbGx5IG5lZWRlZD8gc2FtZSBhcyB3aW5kb3d3aWR0aFxuXHRcdGhlaWdodDogd2luZG93LmlubmVySGVpZ2h0IC0gNDAsXHQvLyB0aGlzIGlzIGFzc3VtaW5nIG5hdmJhciBpcyBhbHdheXMgNDBweFxuXHRcdGxlZnQ6IHtcblx0XHRcdHRyYW5zbGF0aW9uOiBcIlwiLCBcdFx0Ly8gdGhpcyB3YXMgYW4gaW5kZXgsIGNoYW5naW5nIGl0IHRvIGEgbWVtYmVyIG9mIGN1cnJlbnR0cmFuc2xhdGlvbmxpc3Rcblx0XHRcdGxpbmVoZWlnaHQ6IDI0LFx0XHRcdC8vIHRoaXMgaXMgdGhlIGJhc2UgbGluZWhlaWdodDsgY2hhbmdlZCBhdCBkaWZmZXJlbnQgc2l6ZXNcblx0XHRcdHBlcmNlbnRhZ2U6IDAsIFx0XHRcdC8vIHRoaXMgaXMgY3VycmVudCBwZXJjZW50YWdlIG9mIHBhZ2UgKG1heWJlIHRoaXMgc2hvdWxkIGJlIGluIHRlcm1zIG9mIGxpbmVzIG9uIHBhZ2U/KVxuXHRcdFx0bGluZXM6IDAsICAgICAgIFx0XHQvLyB0aGlzIGlzIHRoZSBudW1iZXIgb2YgbGluZXMgY2FsY3VsYXRlZCB0byBiZSBvbiB0aGUgcGFnZVxuXHRcdFx0d2lkdGg6IDAsXHRcdFx0XHRcdFx0Ly8gdGhpcyBpcyB0aGUgd2lkdGggb2YgdGhlIGxlZnQgbGVucyAoMCBpZiBub3QgaW4gdHdpbiBtb2RlKVxuXHRcdFx0dGl0bGViYXI6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmF2YmFybGVmdCAubmF2dGl0bGVcIiksXG5cdFx0XHRzbGlkZXI6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiI3NsaWRlcmxlZnRcIiksXG5cdFx0XHR0ZXh0aW5zaWRlOiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3NsaWRlcmxlZnQgLnRleHRpbnNpZGVmcmFtZVwiKSxcblx0XHRcdHRleHQ6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiI3NsaWRlcmxlZnQgLnRleHRmcmFtZVwiKSxcblx0XHR9LFxuXHRcdHJpZ2h0OiB7XG5cdFx0XHR0cmFuc2xhdGlvbjogXCJcIiwgXHRcdFx0XHRcdFx0Ly8gdGhpcyBpcyBhbiBpZCBmb3VuZCBpbiBjdXJyZW50dHJhbnNsYXRpb25saXN0XG5cdFx0XHRsaW5laGVpZ2h0OiAyNCxcdFx0XHRcdFx0XHRcdC8vIHRoaXMgaXMgdGhlIGJhc2UgbGluZWhlaWdodDsgY2hhbmdlZCBhdCBkaWZmZXJlbnQgc2l6ZXNcblx0XHRcdHBlcmNlbnRhZ2U6IDAsIFx0XHRcdFx0XHRcdFx0Ly8gdGhpcyBpcyBjdXJyZW50IHBlcmNlbnRhZ2Ugb2YgcGFnZSAobWF5YmUgdGhpcyBzaG91bGQgYmUgaW4gdGVybXMgb2YgbGluZXMgb24gcGFnZT8pXG5cdFx0XHRsaW5lczogMCwgICAgIFx0XHQgXHRcdFx0XHRcdC8vIHRoaXMgaXMgdGhlIG51bWJlciBvZiBsaW5lcyBjYWxjdWxhdGVkIHRvIGJlIG9uIHRoZSBwYWdlXG5cdFx0XHR3aWR0aDogd2luZG93LmlubmVyV2lkdGgsXHRcdC8vIHRoaXMgaXMgdGhlIHdpZHRoIG9mIHRoZSByaWdodCBsZW5zIChzYW1lIGFzIHdpbmRvdyBpZiBub3QgaW4gdHdpbiBtb2RlKVxuXHRcdFx0dGl0bGViYXI6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmF2YmFycmlnaHQgLm5hdnRpdGxlXCIpLFxuXHRcdFx0c2xpZGVyOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIiNzbGlkZXJyaWdodFwiKSxcblx0XHRcdHRleHRpbnNpZGU6IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc2xpZGVycmlnaHQgLnRleHRpbnNpZGVmcmFtZVwiKSxcblx0XHRcdHRleHQ6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiI3NsaWRlcnJpZ2h0IC50ZXh0ZnJhbWVcIilcblx0XHR9XG5cdH0sXG5cdHN5c3RlbToge1xuXHRcdHJlc3BvbnNpdmU6IHRydWUsXHQvLyBpZiBmYWxzZSwgYXR0ZW1wdHMgdG8gdXNlIHZpZXdwb3J0IHVuaXRzIChkb2Vzbid0IHdvcmsgcmlnaHQgbm93KVxuXHRcdG9uY29yZG92YTogZmFsc2UsXHQvLyB0aGlzIGlzIHRydWUgaWYgcnVubmluZyBhcyBhbiBhcHBcblx0XHRwbGF0Zm9ybTogXCJcIixcdFx0XHQvLyBpZiBvbiBjb3Jkb3ZhLCB0aGlzIGlzIHRoZSBwbGF0Zm9ybSBmb3IgdGhlIGJvb2tcblx0XHRkZWxheTogNjAwXHRcdFx0XHQvLyB0aGlzIGlzIHRoZSBhbW91bnQgb2YgdGltZSBzd2lwaW5nIHRha2VzLCBpbiBtc1xuXHR9LFxuXHR1c2Vyc2V0dGluZ3M6IHtcdFx0XHQvLyB0aGVzZSBjYW4gYmUgb3ZlcnJpZGRlbiBieSBwcmV2aW91c2x5IHNhdmVkIHVzZXIgc2V0dGluZ3Ncblx0XHR0d2lubW9kZTogZmFsc2UsXHQvLyB3aGV0aGVyIG9yIG5vdCB0d2luIG1vZGUgaXMgdHVybmVkIG9uXG5cdFx0bmlnaHRtb2RlOiBmYWxzZSxcdC8vIHdoZXRoZXIgb3Igbm90IG5pZ2h0IG1vZGUgaXMgdHVybmVkIG9uXG5cdFx0c2hvd25vdGVzOiB0cnVlXHRcdC8vIHdoZXRoZXIgb3Igbm90IG5vdGVzIGFyZSBzaG93blxuXHR9LFxuXG5cdC8vIHRoaW5ncyB0aGF0IGNvbWUgZnJvbSB0aGUgYm9va2ZpbGUgKGFsbCBvZiB0aGVzZSBhcmUgb3ZlcndyaXR0ZW46KVxuXG5cdGJvb2tuYW1lOiBcIlwiLFx0XHRcdFx0XHQvLyB0aGUgd29yaydzIGluZGl2aWR1YWwgY29kZSAobG93ZXJjYXNlLCBubyBwdW5jdHVhdGlvbiwgbm8gc3BhY2VzKSwgZS5nLiBcImluZmVybm9cIlxuXHRib29rdGl0bGU6IFwiXCIsXHRcdFx0XHQvLyB0aGUgd29yaydzIHRpdGxlXG5cdGJvb2thdXRob3I6IFwiXCIsXHRcdFx0XHQvLyB0aGUgd29yaydzIGF1dGhvciAoZGlzdGluY3QgZnJvbSB0cmFuc2xhdG9yKVxuXHR2ZXJzaW9uaGlzdG9yeTogW10sXHRcdC8vIHRoZSB2ZXJzaW9uIGhpc3RvcnksIGFuIGFycmF5IG9mIHRleHRzXG5cdGNvbWluZ3Nvb246IFwiXCIsXHRcdFx0XHQvLyB0aGUgYm9vaydzIGNvbWluZyBzb29uIGluZm9ybWF0aW9uLCBhIGNodW5rIG9mIEhUTUxcblx0dHJhbnNsYXRpb25jb3VudDogMCxcdC8vIHRoaXMgaXMgdGhlIG51bWJlciBvZiBkaWZmZXJlbnQgdHJhbnNsYXRpb25zIGluIHRoZSBib29rXG5cdGNhbnRvY291bnQ6IDAsXHRcdFx0XHQvLyB0aGlzIGlzIHRoZSBudW1iZXIgb2YgY2FudG9zIGluIHRoZSBib29rXG5cdHRleHRkYXRhOiBbXSxcblx0dHJhbnNsYXRpb25kYXRhOiBbXSxcblx0Y2FudG90aXRsZXM6IFtdXHRcdFx0XHQvLyB0aGUgY2Fub25pY2FsIHRpdGxlcyBmb3IgY2FudG9zLCB1c2VkIGluIG5hdmJhciBhbmQgaW4gc2VsZWN0aW9uXG59O1xuIiwiLy8gZG9tLmpzXG5cblwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBkb20gPSB7XG5cdGNyZWF0ZTogZnVuY3Rpb24oaHRtbFN0cikge1xuXHRcdHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXHRcdHZhciB0ZW1wID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdFx0dGVtcC5pbm5lckhUTUwgPSBodG1sU3RyO1xuXHRcdHdoaWxlICh0ZW1wLmZpcnN0Q2hpbGQpIHtcblx0XHRcdGZyYWcuYXBwZW5kQ2hpbGQodGVtcC5maXJzdENoaWxkKTtcblx0XHR9XG5cdFx0cmV0dXJuIGZyYWc7XG5cdH0sXG5cdHJlbW92ZWJ5c2VsZWN0b3I6IGZ1bmN0aW9uKHNlbGVjdG9yc3RyaW5nKSB7XG5cdFx0dmFyIHNlbGVjdG9yID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcnN0cmluZyk7XG5cdFx0aWYoc2VsZWN0b3IgIT09IG51bGwpIHtcblx0XHRcdHNlbGVjdG9yLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoc2VsZWN0b3IpO1xuXHRcdH1cblx0fSxcblx0YWRkY2xhc3M6IGZ1bmN0aW9uKHNlbGVjdG9yc3RyaW5nLCBteWNsYXNzKSB7XG5cdFx0dmFyIG15ZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3JzdHJpbmcpO1xuXHRcdGlmKG15Y2xhc3MuaW5kZXhPZihcIiBcIikgPiAtMSkge1xuXHRcdFx0dmFyIGNsYXNzZXMgPSBteWNsYXNzLnNwbGl0KFwiIFwiKTtcblx0XHRcdGZvcih2YXIgaiA9IDA7IGogPCBjbGFzc2VzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGRvbS5hZGRjbGFzcyhzZWxlY3RvcnN0cmluZywgY2xhc3Nlc1tqXSk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbXllbGVtZW50Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdG15ZWxlbWVudFtpXS5jbGFzc0xpc3QuYWRkKG15Y2xhc3MpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0cmVtb3ZlY2xhc3M6IGZ1bmN0aW9uKHNlbGVjdG9yc3RyaW5nLCBteWNsYXNzKSB7XG5cdFx0dmFyIG15ZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3JzdHJpbmcpO1xuXHRcdGlmKG15Y2xhc3MuaW5kZXhPZihcIiBcIikgPiAtMSkge1xuXHRcdFx0dmFyIGNsYXNzZXMgPSBteWNsYXNzLnNwbGl0KFwiIFwiKTtcblx0XHRcdGZvcih2YXIgaiA9IDA7IGogPCBjbGFzc2VzLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGRvbS5yZW1vdmVjbGFzcyhzZWxlY3RvcnN0cmluZywgY2xhc3Nlc1tqXSk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbXllbGVtZW50Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdG15ZWxlbWVudFtpXS5jbGFzc0xpc3QucmVtb3ZlKG15Y2xhc3MpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0aGFzY2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQsIGNscykge1xuXHRcdHJldHVybiAoJyAnICsgZWxlbWVudC5jbGFzc05hbWUgKyAnICcpLmluZGV4T2YoJyAnICsgY2xzICsgJyAnKSA+IC0xO1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRvbTtcbiJdfQ==
