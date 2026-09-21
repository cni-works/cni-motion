(function () {
	'use strict';

	var STATE_CLASSES = ['idle','active','waiting','content-exit','site-reveal','complete','site-ready'];
	var TRANSITIONS = {
		'idle': ['active','complete'],
		'active': ['waiting','complete'],
		'waiting': ['content-exit','complete'],
		'content-exit': ['site-reveal','complete'],
		'site-reveal': ['complete'],
		'complete': ['site-ready'],
		'site-ready': []
	};

	function integer(value, fallback, min, max) {
		var parsed = parseInt(value, 10);
		if (!Number.isFinite(parsed)) parsed = fallback;
		return Math.max(min, Math.min(max, parsed));
	}

	function clearBootstrapCover(root) {
		if (typeof window.cniMotionClearBootstrapCover === 'function') window.cniMotionClearBootstrapCover();
		else if (root) root.classList.remove('cni-loader-booting');
	}

	function clearBootstrapFailSafes() {
		if (window.cniMotionEarlyCoverFailSafe) window.clearTimeout(window.cniMotionEarlyCoverFailSafe);
		if (window.cniMotionFailSafe && window.cniMotionFailSafe !== window.cniMotionEarlyCoverFailSafe) window.clearTimeout(window.cniMotionFailSafe);
		window.cniMotionEarlyCoverFailSafe = null;
		window.cniMotionFailSafe = null;
	}

	function handoffBootstrapCover(root, loader) {
		if (!root || !root.classList.contains('cni-loader-booting')) return;
		/* Transfer responsibility only after the active loader covers the viewport. */
		void loader.offsetWidth;
		window.requestAnimationFrame(function () {
			var doc = root.ownerDocument || document;
			var view = doc.defaultView || window;
			var style = view.getComputedStyle(loader);
			var rect = loader.getBoundingClientRect();
			var viewportWidth = doc.documentElement.clientWidth || view.innerWidth;
			var viewportHeight = doc.documentElement.clientHeight || view.innerHeight;
			var lockState = root.cniLoaderScrollLock;
			var scrollbarWidth = lockState && Number.isFinite(lockState.scrollbarWidth) ? lockState.scrollbarWidth : 0;
			var expectedWidth = Math.max(1, viewportWidth - scrollbarWidth);
			var horizontallyCovered = rect.width + 1 >= expectedWidth && Math.abs(rect.left) <= scrollbarWidth + 1 && rect.right + scrollbarWidth + 1 >= viewportWidth;
			if (!loader.classList.contains('cni-loader--active') || style.display === 'none' || style.visibility === 'hidden' || style.position !== 'fixed' || !horizontallyCovered || rect.top > 0 || rect.bottom + 1 < viewportHeight) return;
			clearBootstrapFailSafes();
			clearBootstrapCover(root);
		});
	}

	function lockScroll(root) {
		if (!root || root.cniLoaderScrollLock) return;
		var doc = root.ownerDocument || document;
		var view = doc.defaultView || window;
		var pendingRelease = root.cniLoaderScrollLockRelease;
		var inheritedStableClass = !!pendingRelease && !pendingRelease.hadStableClass && root.classList.contains('cni-loader-scrollbar-stable');
		if (pendingRelease) {
			pendingRelease.cancelled = true;
			root.cniLoaderScrollLockRelease = null;
		}
		var supportsStableGutter = !!(view.CSS && typeof view.CSS.supports === 'function' && view.CSS.supports('scrollbar-gutter', 'stable'));
		var scrollbarWidth = Math.max(0, view.innerWidth - doc.documentElement.clientWidth);
		var state = {
			doc: doc,
			view: view,
			hadClass: root.classList.contains('cni-loader-lock'),
			hadStableClass: pendingRelease ? pendingRelease.hadStableClass : root.classList.contains('cni-loader-scrollbar-stable'),
			addedStableClass: inheritedStableClass || (supportsStableGutter && scrollbarWidth > 0 && !(pendingRelease ? pendingRelease.hadStableClass : root.classList.contains('cni-loader-scrollbar-stable'))),
			scrollbarWidth: scrollbarWidth,
			paddingRight: root.style.getPropertyValue('padding-right'),
			paddingRightPriority: root.style.getPropertyPriority('padding-right'),
			scrollX: view.scrollX || view.pageXOffset || 0,
			scrollY: view.scrollY || view.pageYOffset || 0,
			scrollbarRestored: false
		};
		state.preventScroll = function (event) { if (event && event.cancelable) event.preventDefault(); };
		state.preventScrollKey = function (event) {
			if ([' ', 'Spacebar', 'PageUp', 'PageDown', 'End', 'Home', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].indexOf(event.key) !== -1) state.preventScroll(event);
		};
		state.holdScroll = function () {
			var x = view.scrollX || view.pageXOffset || 0;
			var y = view.scrollY || view.pageYOffset || 0;
			if ((x !== state.scrollX || y !== state.scrollY) && typeof view.scrollTo === 'function') view.scrollTo(state.scrollX, state.scrollY);
		};
		root.cniLoaderScrollLock = state;
		if (typeof view.addEventListener === 'function') {
			view.addEventListener('wheel', state.preventScroll, { passive: false });
			view.addEventListener('touchmove', state.preventScroll, { passive: false });
			view.addEventListener('scroll', state.holdScroll, { passive: true });
		}
		if (typeof doc.addEventListener === 'function') doc.addEventListener('keydown', state.preventScrollKey, true);
		if (supportsStableGutter && scrollbarWidth > 0) root.classList.add('cni-loader-scrollbar-stable');
		if (!supportsStableGutter && scrollbarWidth > 0) {
			var currentPadding = parseFloat(view.getComputedStyle(root).paddingRight) || 0;
			root.style.setProperty('padding-right', currentPadding + scrollbarWidth + 'px', 'important');
		}
		root.classList.add('cni-loader-lock');
	}

	function restoreScrollbar(root) {
		if (!root || !root.cniLoaderScrollLock || root.cniLoaderScrollLock.scrollbarRestored) return;
		var state = root.cniLoaderScrollLock;
		var view = state.view;
		if (!state.hadClass) root.classList.remove('cni-loader-lock');
		if (state.paddingRight) root.style.setProperty('padding-right', state.paddingRight, state.paddingRightPriority);
		else root.style.removeProperty('padding-right');
		state.scrollbarRestored = true;
		if (state.addedStableClass) {
			state.cancelled = false;
			root.cniLoaderScrollLockRelease = state;
			var releaseStableGutter = function () {
				if (state.cancelled || root.cniLoaderScrollLockRelease !== state || (root.cniLoaderScrollLock && root.cniLoaderScrollLock !== state)) return;
				root.classList.remove('cni-loader-scrollbar-stable');
				root.cniLoaderScrollLockRelease = null;
			};
			if (typeof view.requestAnimationFrame === 'function') view.requestAnimationFrame(function () { view.requestAnimationFrame(releaseStableGutter); });
			else releaseStableGutter();
		}
	}

	function unlockScroll(root) {
		if (!root || !root.cniLoaderScrollLock) return;
		var state = root.cniLoaderScrollLock;
		restoreScrollbar(root);
		if (typeof state.view.removeEventListener === 'function') {
			state.view.removeEventListener('wheel', state.preventScroll);
			state.view.removeEventListener('touchmove', state.preventScroll);
			state.view.removeEventListener('scroll', state.holdScroll);
		}
		if (typeof state.doc.removeEventListener === 'function') state.doc.removeEventListener('keydown', state.preventScrollKey, true);
		root.cniLoaderScrollLock = null;
	}

	function run(loader, options) {
		options = options || {};
		if (!loader || !loader.classList || !loader.dataset) return null;
		if (loader.cniLoaderController) return loader.cniLoaderController;

		var root = options.root || document.documentElement;
		var manageRoot = options.manageRoot !== false;
		var reduced = !!options.reduced;
		var emitEvents = options.emitEvents !== false;
		var removeOnComplete = options.removeOnComplete !== false;
		var state = 'idle';
		var finished = false;
		var started = false;
		var timers = [];
		var loadHandler = null;
		var revealEndHandler = null;
		var revealFinishFrame = null;
		var enterStartFrames = [];
		var imageCleanups = [];

		function emit(name, detail) {
			if (!emitEvents) return;
			document.dispatchEvent(new CustomEvent(name, { detail: detail || { loader: loader, state: state } }));
		}

		function setState(next) {
			if (state === next) return true;
			if (STATE_CLASSES.indexOf(next) === -1) return false;
			if (!TRANSITIONS[state] || TRANSITIONS[state].indexOf(next) === -1) return false;
			loader.classList.remove('cni-loader--state-' + state);
			state = next;
			loader.dataset.cniLoaderState = next;
			loader.classList.add('cni-loader--state-' + next);
			return true;
		}

		function schedule(callback, delay) {
			var timer = window.setTimeout(callback, Math.max(0, delay));
			timers.push(timer);
			return timer;
		}

		function wait(delay) {
			return new Promise(function (resolve) { schedule(resolve, delay); });
		}

		function clearWork() {
			timers.forEach(function (timer) { window.clearTimeout(timer); });
			timers = [];
			if (typeof window.cancelAnimationFrame === 'function') enterStartFrames.forEach(function (frame) { window.cancelAnimationFrame(frame); });
			enterStartFrames = [];
			imageCleanups.forEach(function (cleanup) { cleanup(); });
			imageCleanups = [];
			if (loadHandler) { window.removeEventListener('load', loadHandler); loadHandler = null; }
			if (revealEndHandler) { loader.removeEventListener('transitionend', revealEndHandler); revealEndHandler = null; }
			if (revealFinishFrame && typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(revealFinishFrame);
			revealFinishFrame = null;
		}

		function rootCleanup() {
			if (!manageRoot) return;
			clearBootstrapFailSafes();
			clearBootstrapCover(root);
			unlockScroll(root);
			root.classList.remove('cni-loader-js-ready', 'cni-loader-skip');
		}

		function finish(reason) {
			if (finished) return;
			finished = true;
			clearWork();
			if (state !== 'complete' && state !== 'site-ready') setState('complete');
			rootCleanup();
			loader.classList.add('cni-loader--complete');
			if (started || reason !== 'frequency-skip') emit('cni:loader-complete', { loader: loader, state: 'complete', reason: reason || 'complete' });
			try {
				if (removeOnComplete && loader.parentNode) loader.parentNode.removeChild(loader);
			} finally {
				setState('site-ready');
				if (typeof options.onComplete === 'function') options.onComplete(reason || 'complete', loader);
			}
		}

		function readyGate(maxWait) {
			return new Promise(function (resolve) {
				var resolved = false;
				function ready() { if (resolved || finished) return; resolved = true; if (loadHandler) { window.removeEventListener('load', loadHandler); loadHandler = null; } resolve(); }
				if (options.readyPromise && typeof options.readyPromise.then === 'function') options.readyPromise.then(ready, ready);
				else if (document.readyState === 'complete') ready();
				else { loadHandler = ready; window.addEventListener('load', loadHandler, { once: true }); }
				schedule(ready, maxWait);
			});
		}

		function revealTransitionMatches(event) {
			if (!event) return false;
			if (reduced) return event.target === loader && event.propertyName === 'opacity';
			var effect = loader.dataset.cniLoader || 'fade';
			if (effect === 'circle-reveal') return event.target === loader && (!event.pseudoElement || event.pseudoElement === '::before') && (event.propertyName === 'width' || event.propertyName === 'height');
			if (effect === 'fade') return event.target === loader && event.propertyName === 'opacity';
			if (effect.indexOf('wipe-') === 0) return event.target === loader && event.propertyName === 'transform';
			if (effect === 'split-horizontal' || effect === 'split-vertical') return event.target !== loader && event.target.parentNode === loader && event.target.classList && event.target.classList.contains('cni-loader__panel') && event.propertyName === 'transform';
			return false;
		}

		function reveal(revealDuration) {
			if (finished || !setState('site-reveal')) return;
			if (manageRoot) restoreScrollbar(root);
			var revealFinishQueued = false;
			function finishReveal(reason) {
				if (finished || revealFinishQueued) return;
				revealFinishQueued = true;
				if (revealEndHandler) { loader.removeEventListener('transitionend', revealEndHandler); revealEndHandler = null; }
				var complete = function () { revealFinishFrame = null; finish(reason); };
				if (typeof window.requestAnimationFrame === 'function') revealFinishFrame = window.requestAnimationFrame(complete);
				else complete();
			}
			revealEndHandler = function (event) { if (revealTransitionMatches(event)) finishReveal('transition-complete'); };
			loader.addEventListener('transitionend', revealEndHandler);
			/* Commit the fully covered state before the reveal transition starts. */
			void loader.offsetWidth;
			loader.classList.add('cni-loader--exiting');
			emit('cni:loader-reveal');
			if (revealDuration <= 0) { finishReveal('sequence-complete'); return; }
			/* A bounded fallback preserves completion when a browser suppresses transitionend. */
			schedule(function () { finishReveal('transition-fallback'); }, revealDuration + Math.max(500, Math.min(1500, revealDuration)));
		}

		function contentExit(exitDuration, revealDuration) {
			if (finished || !setState('content-exit')) return;
			emit('cni:loader-content-exit');
			if (loader.dataset.cniLoaderExit === 'none') { loader.classList.remove('cni-loader--content-ready'); reveal(revealDuration); return; }
			loader.classList.add('cni-loader--content-exit');
			/* Establish the visible start state with transitions enabled first. */
			void loader.offsetWidth;
			loader.classList.remove('cni-loader--content-ready');
			schedule(function () { reveal(revealDuration); }, exitDuration);
		}

		function prepareContent(callback) {
			var images = [];
			var pending = 0;
			var ready = false;

			function startAfterInitialPaint() {
				if (ready || finished) return;
				ready = true;
				imageCleanups.forEach(function (cleanup) { cleanup(); });
				imageCleanups = [];
				void loader.offsetWidth;
				if (typeof window.requestAnimationFrame !== 'function') { schedule(callback, 0); return; }
				enterStartFrames.push(window.requestAnimationFrame(function () {
					enterStartFrames.push(window.requestAnimationFrame(callback));
				}));
			}

			function imageReady() {
				pending -= 1;
				if (pending <= 0) startAfterInitialPaint();
			}

			if (typeof loader.querySelectorAll === 'function') images = Array.prototype.slice.call(loader.querySelectorAll('.cni-loader__content img'));
			pending = images.length;
			if (!pending) { startAfterInitialPaint(); return; }

			schedule(startAfterInitialPaint, 1000);
			images.forEach(function (image) {
				var settled = false;
				function settle() { if (settled) return; settled = true; cleanup(); imageReady(); }
				function cleanup() {
					if (typeof image.removeEventListener === 'function') {
						image.removeEventListener('load', settle);
						image.removeEventListener('error', settle);
					}
				}
				imageCleanups.push(cleanup);
				if (image.complete) {
					if (typeof image.decode === 'function') {
						try { Promise.resolve(image.decode()).then(settle, settle); }
						catch (error) { settle(); }
					} else settle();
				} else if (typeof image.addEventListener === 'function') {
					image.addEventListener('load', settle, { once: true });
					image.addEventListener('error', settle, { once: true });
				} else settle();
			});
		}

		var controller = {
			finish: finish,
			getState: function () { return state; }
		};
		loader.cniLoaderController = controller;
		loader.dataset.cniLoaderState = 'idle';
		loader.classList.add('cni-loader--state-idle');

		try {
			var frequency = loader.dataset.cniFrequency || 'always';
			if (!options.ignoreFrequency && frequency !== 'always') {
				var key = frequency === 'session' ? 'cni_motion_loader_session_v1' : 'cni_motion_loader_seen_v1';
				var storage = frequency === 'session' ? window.sessionStorage : window.localStorage;
				try {
					if (storage.getItem(key)) { finish('frequency-skip'); return controller; }
					storage.setItem(key, '1');
				} catch (ignore) {}
			}

			var enter = loader.dataset.cniLoaderEnter || 'fade';
			var exit = loader.dataset.cniLoaderExit || 'fade-out';
			var enterDuration = enter === 'none' ? 0 : integer(loader.dataset.cniLoaderEnterDuration, 400, 0, 5000);
			var holdDuration = integer(loader.dataset.cniLoaderHold, 700, 0, 5000);
			var exitDuration = exit === 'none' ? 0 : integer(loader.dataset.cniLoaderExitDuration, 400, 0, 5000);
			var revealDuration = integer(loader.dataset.cniLoaderRevealDuration, 500, 0, 5000);
			var maxWait = integer(loader.dataset.cniLoaderMaxWait, 3000, 0, 10000);
			if (reduced) {
				enterDuration = enter === 'none' ? 0 : Math.min(enterDuration, 120);
				exitDuration = exit === 'none' ? 0 : Math.min(exitDuration, 120);
				revealDuration = Math.min(revealDuration, 120);
			}

			loader.style.setProperty('--cni-enter', enterDuration + 'ms');
			loader.style.setProperty('--cni-exit', exitDuration + 'ms');
			loader.style.setProperty('--cni-reveal', revealDuration + 'ms');
			if (manageRoot) lockScroll(root);
			prepareContent(function () {
				if (finished || started) return;
				if (!setState('active')) { finish('error'); return; }
				started = true;
				loader.classList.add('cni-loader--active');
				emit('cni:loader-start');

				var ready = readyGate(maxWait);
				schedule(function () { finish('safety-timeout'); }, enterDuration + holdDuration + maxWait + exitDuration + revealDuration + 1500);
				if (manageRoot) handoffBootstrapCover(root, loader);
				wait(enterDuration).then(function () {
					if (finished || !setState('waiting')) return Promise.reject('finished');
					loader.classList.add('cni-loader--content-ready');
					return Promise.all([wait(holdDuration), ready]);
				}).then(function () {
					if (!finished) contentExit(exitDuration, revealDuration);
				}).catch(function (error) {
					if (!finished && error !== 'finished') finish('error');
				});
			});
		} catch (error) {
			finish('error');
		}

		return controller;
	}

	window.CNIMotionLoaderRuntime = { run: run, lockScroll: lockScroll, restoreScrollbar: restoreScrollbar, unlockScroll: unlockScroll };
}());
