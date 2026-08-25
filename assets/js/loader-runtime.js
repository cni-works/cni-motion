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

	function lockScroll(root) {
		if (!root || root.cniLoaderScrollLock) return;
		var doc = root.ownerDocument || document;
		var view = doc.defaultView || window;
		var supportsStableGutter = !!(view.CSS && typeof view.CSS.supports === 'function' && view.CSS.supports('scrollbar-gutter', 'stable'));
		var scrollbarWidth = Math.max(0, view.innerWidth - doc.documentElement.clientWidth);
		var state = {
			hadClass: root.classList.contains('cni-loader-lock'),
			hadStableClass: root.classList.contains('cni-loader-scrollbar-stable'),
			paddingRight: root.style.getPropertyValue('padding-right'),
			paddingRightPriority: root.style.getPropertyPriority('padding-right')
		};
		root.cniLoaderScrollLock = state;
		if (supportsStableGutter && scrollbarWidth > 0) root.classList.add('cni-loader-scrollbar-stable');
		if (!supportsStableGutter && scrollbarWidth > 0) {
			var currentPadding = parseFloat(view.getComputedStyle(root).paddingRight) || 0;
			root.style.setProperty('padding-right', currentPadding + scrollbarWidth + 'px', 'important');
		}
		root.classList.add('cni-loader-lock');
	}

	function unlockScroll(root) {
		if (!root || !root.cniLoaderScrollLock) return;
		var state = root.cniLoaderScrollLock;
		if (!state.hadClass) root.classList.remove('cni-loader-lock');
		if (!state.hadStableClass) root.classList.remove('cni-loader-scrollbar-stable');
		if (state.paddingRight) root.style.setProperty('padding-right', state.paddingRight, state.paddingRightPriority);
		else root.style.removeProperty('padding-right');
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
			if (loadHandler) { window.removeEventListener('load', loadHandler); loadHandler = null; }
		}

		function rootCleanup() {
			if (!manageRoot) return;
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

		function reveal(revealDuration) {
			if (finished || !setState('site-reveal')) return;
			loader.classList.add('cni-loader--exiting');
			emit('cni:loader-reveal');
			schedule(function () { finish('sequence-complete'); }, revealDuration);
		}

		function contentExit(exitDuration, revealDuration) {
			if (finished || !setState('content-exit')) return;
			emit('cni:loader-content-exit');
			loader.classList.remove('cni-loader--content-ready');
			if (loader.dataset.cniLoaderExit === 'none') { reveal(revealDuration); return; }
			loader.classList.add('cni-loader--content-exit');
			schedule(function () { reveal(revealDuration); }, exitDuration);
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
			if (!setState('active')) throw new Error('Invalid loader active transition');
			started = true;
			loader.classList.add('cni-loader--active');
			emit('cni:loader-start');

			var ready = readyGate(maxWait);
			schedule(function () { finish('safety-timeout'); }, enterDuration + holdDuration + maxWait + exitDuration + revealDuration + 1500);
			wait(enterDuration).then(function () {
				if (finished || !setState('waiting')) return Promise.reject('finished');
				loader.classList.add('cni-loader--content-ready');
				return Promise.all([wait(holdDuration), ready]);
			}).then(function () {
				if (!finished) contentExit(exitDuration, revealDuration);
			}).catch(function (error) {
				if (!finished && error !== 'finished') finish('error');
			});
		} catch (error) {
			finish('error');
		}

		return controller;
	}

	window.CNIMotionLoaderRuntime = { run: run, lockScroll: lockScroll, unlockScroll: unlockScroll };
}());
