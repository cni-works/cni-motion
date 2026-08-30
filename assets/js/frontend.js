(function () {
	'use strict';
	var config = window.CNIMotion || {};
	var root = document.documentElement;
	var reduced = !!config.reducedMotion && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (config.reducedMotion) root.classList.add('cni-motion-reduced-enabled'); else root.classList.remove('cni-motion-reduced-enabled');
	var registry = Array.isArray(window.CNIMotionRegistry) ? window.CNIMotionRegistry.filter(function (item) { return item && typeof item === 'object' && typeof item.slug === 'string' && typeof item.category === 'string'; }) : [];
	var emphasis = registry.filter(function (item) { return item.category === 'emphasis'; }).map(function (item) { return item.slug; });
	var definitions = {};
	registry.forEach(function (item) { definitions[item.slug] = item; });
	var observers = {};
	var paintQueue = [];
	var paintScheduled = false;

	function event(name, element) {
		document.dispatchEvent(new CustomEvent(name, { detail: element ? { element: element, effect: element.dataset.cniMotion, trigger: element.dataset.cniTrigger } : {} }));
	}
	function siteReady() {
		if (window.cniMotionSiteReady) { window.cniMotionSiteReady(); return; }
		if (window.cniMotionSiteReadySent) return;
		window.cniMotionSiteReadySent = true; root.classList.add('cni-site-ready'); event('cni:site-ready');
	}
	function clearLoaderBootstrapCover() {
		if (typeof window.cniMotionClearBootstrapCover === 'function') window.cniMotionClearBootstrapCover();
		else root.classList.remove('cni-loader-booting');
	}
	function clearLoaderBootstrapFailSafes() {
		if (window.cniMotionEarlyCoverFailSafe) window.clearTimeout(window.cniMotionEarlyCoverFailSafe);
		if (window.cniMotionFailSafe && window.cniMotionFailSafe !== window.cniMotionEarlyCoverFailSafe) window.clearTimeout(window.cniMotionFailSafe);
		window.cniMotionEarlyCoverFailSafe = null;
		window.cniMotionFailSafe = null;
	}
	function numberValue(value, fallback) { var parsed = parseInt(value, 10); return Number.isFinite(parsed) ? parsed : fallback; }
	function category(el) { return el.dataset.cniCategory || (definitions[el.dataset.cniMotion] && definitions[el.dataset.cniMotion].category) || 'entrance'; }
	function duration(el) { return Math.max(100, Math.min(5000, parseInt(el.dataset.cniDuration, 10) || 600)); }
	function once(el) { var value = String(el.dataset.cniOnce || '').toLowerCase(); return value === 'true' || value === '1'; }
	function cancelCompletion(el) {
		if (el.cniMotionEndHandler) { el.removeEventListener('transitionend', el.cniMotionEndHandler); el.removeEventListener('animationend', el.cniMotionEndHandler); el.cniMotionEndHandler = null; }
		if (el.cniMotionCompletionTimer) { window.clearTimeout(el.cniMotionCompletionTimer); el.cniMotionCompletionTimer = null; }
	}
	function complete(el) {
		if (el.cniMotionCompleteLocked) return;
		el.cniMotionCompleteLocked = true; el.cniMotionQueuedPlay = false; cancelCompletion(el);
		el.classList.remove('cni-motion--pending', 'cni-motion--running'); el.classList.add('cni-motion--complete'); el.style.willChange = '';
		['--cni-motion-duration','--cni-motion-delay','--cni-motion-distance','--cni-motion-easing','--cni-motion-mask-color','--cni-motion-target-transform','--cni-motion-target-filter','--cni-motion-target-clip'].forEach(function (property) { el.style.removeProperty(property); });
		event('cni:motion-complete', el);
		if (once(el)) {
			el.cniMotionOnceComplete = true;
			if (el.cniMotionObserver) { el.cniMotionObserver.unobserve(el); el.cniMotionObserver = null; }
		}
		if (el.cniMotionObserveAfterComplete) { el.cniMotionObserveAfterComplete = false; watch(el, numberValue(el.dataset.cniOffset, 12), true); }
	}
	function awaitCompletion(el) {
		var finish = function (endEvent) { if (endEvent && endEvent.target !== el) return; complete(el); };
		el.cniMotionEndHandler = finish;
		el.addEventListener('transitionend', finish);
		el.addEventListener('animationend', finish);
		el.cniMotionCompletionTimer = window.setTimeout(finish, duration(el) + numberValue(getComputedStyle(el).getPropertyValue('--cni-motion-delay'), 0) + 160);
	}
	function prepareAfterPaint(el) {
		el.cniMotionPrepared = false;
		if (paintQueue.indexOf(el) === -1) paintQueue.push(el);
		if (paintScheduled) return;
		paintScheduled = true;
		window.requestAnimationFrame(function () { window.requestAnimationFrame(function () {
			var queue = paintQueue.slice(); paintQueue = []; paintScheduled = false;
			queue.forEach(function (item) { item.cniMotionPrepared = true; if (item.cniMotionQueuedPlay) { try { play(item); } catch (error) { complete(item); } } });
		}); });
	}
	function play(el) {
		if (!el || el.classList.contains('cni-motion--running')) return;
		if (once(el) && el.dataset.cniTrigger !== 'hover' && (el.cniMotionOnceComplete || el.classList.contains('cni-motion--complete'))) return;
		if (!el.cniMotionPrepared) { el.cniMotionQueuedPlay = true; return; }
		el.cniMotionQueuedPlay = false; el.cniMotionCompleteLocked = false; cancelCompletion(el);
		if (reduced && emphasis.indexOf(el.dataset.cniMotion) !== -1) { complete(el); return; }
		el.style.willChange = 'transform, opacity'; el.classList.remove('cni-motion--complete');
		void el.offsetWidth; awaitCompletion(el); el.classList.remove('cni-motion--pending'); el.classList.add('cni-motion--running'); event('cni:motion-start', el);
	}
	function reset(el) { if (!once(el) && category(el) === 'entrance') { el.cniMotionQueuedPlay = false; el.classList.remove('cni-motion--running', 'cni-motion--complete'); configure(el); } }
	function observer(offset) {
		var key = String(offset);
		if (!observers[key]) observers[key] = new IntersectionObserver(function (entries, obs) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					if (!entry.target.cniMotionWaitForExit) play(entry.target);
				} else {
					entry.target.cniMotionQueuedPlay = false;
					entry.target.cniMotionWaitForExit = false;
					reset(entry.target);
				}
			});
		}, { rootMargin: '0px 0px -' + offset + '% 0px', threshold: 0.01 });
		return observers[key];
	}
	function watch(el, offset, waitForExit) { el.cniMotionObserver = observer(offset); el.cniMotionWaitForExit = !!waitForExit; el.cniMotionObserver.observe(el); }
	function configure(el) {
		cancelCompletion(el); el.cniMotionCompleteLocked = false; el.cniMotionOnceComplete = false;
		if (category(el) !== 'entrance') el.dataset.cniOnce = 'true';
		var mobile = window.innerWidth <= (parseInt(config.breakpoint, 10) || 768);
		if (mobile && el.dataset.cniMobile !== 'true') { complete(el); return false; }
		var delay = parseInt(el.dataset.cniDelay, 10) || 0;
		if (mobile && el.dataset.cniMobileDelay !== 'true') delay = 0;
		el.style.setProperty('--cni-motion-duration', duration(el) + 'ms');
		el.style.setProperty('--cni-motion-delay', delay + 'ms');
		/* The server-rendered pending class protects the first paint. Measure the
		 * theme's real end state synchronously without allowing an intermediate paint. */
		el.classList.add('cni-motion--measuring');
		el.classList.remove('cni-motion--pending');
		var current = getComputedStyle(el);
		el.style.setProperty('--cni-motion-target-transform', current.transform || 'none');
		el.style.setProperty('--cni-motion-target-filter', current.filter || 'none');
		el.style.setProperty('--cni-motion-target-clip', current.clipPath || 'none');
		el.style.setProperty('--cni-motion-distance', numberValue(el.dataset.cniDistance, 16) + 'px');
		el.style.setProperty('--cni-motion-easing', el.dataset.cniEasing || 'ease-out');
		el.style.setProperty('--cni-motion-mask-color', el.dataset.cniMaskColor || '#fff');
		el.classList.add('cni-motion--pending'); void el.offsetWidth; el.classList.remove('cni-motion--measuring'); prepareAfterPaint(el); return true;
	}
	function stagger(parent) {
		var effect = parent.dataset.cniStagger, definition = definitions[effect] || definitions['fade-up'] || {defaultDuration:600,defaultDistance:16}, interval = numberValue(parent.dataset.cniStaggerInterval, 150);
		var mobile = window.innerWidth <= (parseInt(config.breakpoint, 10) || 768);
		var staggerOnMobile = parent.dataset.cniStaggerMobile === 'true';
		var baseDelay = parseInt(parent.dataset.cniDelay, 10) || 0;
		Array.prototype.forEach.call(parent.children, function (child, index) {
			if (child.hasAttribute('data-cni-motion')) return;
			child.classList.add('cni-motion'); child.dataset.cniMotion = effect; child.dataset.cniCategory = 'entrance'; child.dataset.cniTrigger = parent.dataset.cniTrigger || 'auto'; child.dataset.cniDuration = parent.dataset.cniDuration || String(definition.defaultDuration); child.dataset.cniDelay = String(baseDelay + (mobile && !staggerOnMobile ? 0 : index * interval)); child.dataset.cniDistance = definition.defaultDistance === null ? '16' : String(definition.defaultDistance); child.dataset.cniOffset = parent.dataset.cniOffset || '12'; child.dataset.cniOnce = parent.dataset.cniOnce || 'true'; child.dataset.cniMobile = parent.dataset.cniMobile || 'true'; child.dataset.cniMobileDelay = 'true';
		});
		parent.classList.remove('cni-motion'); parent.removeAttribute('data-cni-motion');
	}
	function initMotion() {
		document.querySelectorAll('[data-cni-stagger]').forEach(stagger);
		document.querySelectorAll('[data-cni-motion]').forEach(function (el) {
			if (!configure(el)) return;
			var trigger = el.dataset.cniTrigger || 'auto';
			if (trigger === 'hover' && emphasis.indexOf(el.dataset.cniMotion) !== -1) { el.addEventListener('pointerenter', function () { play(el); }); el.addEventListener('focusin', function () { play(el); }); return; }
			if (trigger === 'immediate') { requestAnimationFrame(function () { play(el); }); return; }
			if (trigger === 'site-ready') { document.addEventListener('cni:site-ready', function () { play(el); }, { once: true }); return; }
			if (trigger === 'auto') {
				document.addEventListener('cni:site-ready', function () { var rect = el.getBoundingClientRect(), offset = numberValue(el.dataset.cniOffset, 12); if (rect.top < window.innerHeight && rect.bottom > 0) { if (!once(el) && category(el) === 'entrance') el.cniMotionObserveAfterComplete = true; play(el); } else watch(el, offset, false); }, { once: true }); return;
			}
			watch(el, numberValue(el.dataset.cniOffset, 12), false);
		}); event('cni:motion-ready');
	}
	function loaderStylesReady(loader) {
		try { return getComputedStyle(loader).getPropertyValue('--cni-loader-css-ready').trim() === '1'; }
		catch (error) { return false; }
	}
	function runLoader(loader) {
		if (!window.CNIMotionLoaderRuntime || typeof window.CNIMotionLoaderRuntime.run !== 'function') throw new Error('Loader runtime unavailable');
		if (loader.cniLoaderStyleWait) return;
		loader.cniLoaderStyleWait = true;
		function startWhenStyled() {
			if (!loader.isConnected || window.cniMotionLoaderBootstrapExpired) { loader.cniLoaderStyleWait = false; return; }
			if (!loaderStylesReady(loader)) { window.requestAnimationFrame(startWhenStyled); return; }
			loader.cniLoaderStyleWait = false;
			window.CNIMotionLoaderRuntime.run(loader, { reduced: reduced, root: root, manageRoot: true, onComplete: siteReady });
		}
		startWhenStyled();
	}
	function start() {
		try {
			var loader = document.querySelector('.cni-loader');
			if (loader && window.cniMotionLoaderBootstrapExpired) { loader.remove(); loader = null; }
			if (!loader) { clearLoaderBootstrapFailSafes(); clearLoaderBootstrapCover(); root.classList.remove('cni-loader-lock', 'cni-loader-js-ready'); }
			initMotion();
			if (loader) runLoader(loader); else requestAnimationFrame(function () { requestAnimationFrame(siteReady); });
		} catch (error) {
			clearLoaderBootstrapFailSafes(); clearLoaderBootstrapCover(); root.classList.remove('cni-motion-js','cni-loader-js-ready'); if (window.CNIMotionLoaderRuntime && typeof window.CNIMotionLoaderRuntime.unlockScroll === 'function') window.CNIMotionLoaderRuntime.unlockScroll(root); else root.classList.remove('cni-loader-lock'); var failedLoader=document.querySelector('.cni-loader'); if(failedLoader) failedLoader.remove(); siteReady();
			if (window.console) console.error('CNI Motion:', error);
		}
	}
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true }); else start();
}());
