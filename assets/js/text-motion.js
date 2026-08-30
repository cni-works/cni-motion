(function () {
	'use strict';
	var config = window.CNIMotion || {};
	var data = window.CNIMotionTextData || {};
	var effects = Array.isArray(data.effects) ? data.effects.filter(function (effect) { return effect && typeof effect.slug === 'string' && Number.isFinite(effect.defaultDuration) && Array.isArray(effect.triggers); }) : [];
	var definitions = {};
	effects.forEach(function (effect) { definitions[effect.slug] = effect; });
	var reduced = !!config.reducedMotion && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var charObservers = {};
	var marqueeObserverContexts = new Map();
	function marqueeObserverContext(documentRef) {
		if (marqueeObserverContexts.has(documentRef)) return marqueeObserverContexts.get(documentRef);
		var view = documentRef.defaultView || window, entries = new Map(), observer = null;
		if ('IntersectionObserver' in view) observer = new view.IntersectionObserver(function (changes) {
			changes.forEach(function (entry) { var instance = entries.get(entry.target); if (instance) instance.pause('offscreen', !entry.isIntersecting); });
		}, { threshold: 0.01 });
		var context = { observer: observer, entries: entries }; marqueeObserverContexts.set(documentRef, context); return context;
	}

	function integer(value, fallback, min, max) {
		var parsed = parseInt(value, 10);
		return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
	}
	function isMobile(element) {
		var view = element.ownerDocument.defaultView || window;
		return view.innerWidth <= (integer(config.breakpoint, 768, 320, 3000));
	}
	function segment(text, documentLanguage) {
		if (window.Intl && typeof window.Intl.Segmenter === 'function') {
			try { return Array.from(new window.Intl.Segmenter(documentLanguage || undefined, { granularity: 'grapheme' }).segment(text), function (part) { return part.segment; }); } catch (ignore) {}
		}
		return Array.from(text);
	}
	function isExcluded(element) {
		if (!element || element.nodeType !== 1) return false;
		if (/^(SCRIPT|STYLE|NOSCRIPT|SVG|MATH|CODE|PRE|TEXTAREA|INPUT)$/i.test(element.tagName)) return true;
		return element.classList.contains('screen-reader-text') || element.hasAttribute('data-cni-motion-generated') || element.getAttribute('aria-hidden') === 'true';
	}
	function isAsciiWordCharacter(value) { return /^[A-Za-z0-9À-ÖØ-öø-ÿ'’_-]$/u.test(value); }

	function splitText(root) {
		var documentRef = root.ownerDocument;
		var language = documentRef.documentElement.lang || undefined;
		var records = [], index = 0;
		var walker = documentRef.createTreeWalker(root, window.NodeFilter.SHOW_TEXT, {
			acceptNode: function (node) {
				var parent = node.parentElement;
				if (!node.nodeValue || !node.nodeValue.trim() || !parent) return window.NodeFilter.FILTER_REJECT;
				for (var cursor = parent; cursor && cursor !== root; cursor = cursor.parentElement) if (isExcluded(cursor)) return window.NodeFilter.FILTER_REJECT;
				return window.NodeFilter.FILTER_ACCEPT;
			}
		});
		var nodes = [], current;
		while ((current = walker.nextNode())) nodes.push(current);
		nodes.forEach(function (textNode) {
			var parts = segment(textNode.nodeValue, language), fragment = documentRef.createDocumentFragment(), topNodes = [], word = [];
			function add(node) { topNodes.push(node); fragment.appendChild(node); }
			function character(value, parent) {
				var span = documentRef.createElement('span');
				span.className = 'cni-motion-char'; span.setAttribute('data-cni-motion-generated', 'character');
				span.style.setProperty('--cni-char-index', String(index++)); span.textContent = value; parent.appendChild(span);
			}
			function flushWord() {
				if (!word.length) return;
				var wrapper = documentRef.createElement('span'); wrapper.className = 'cni-motion-word'; wrapper.setAttribute('data-cni-motion-generated', 'word');
				word.forEach(function (value) { character(value, wrapper); }); word = []; add(wrapper);
			}
			parts.forEach(function (value) {
				if (/^\s+$/u.test(value)) { flushWord(); add(documentRef.createTextNode(value)); }
				else if (isAsciiWordCharacter(value)) word.push(value);
				else { flushWord(); var holder = documentRef.createDocumentFragment(); character(value, holder); while (holder.firstChild) add(holder.firstChild); }
			});
			flushWord();
			textNode.parentNode.insertBefore(fragment, textNode); textNode.parentNode.removeChild(textNode);
			records.push({ parent: topNodes[0] ? topNodes[0].parentNode : null, nodes: topNodes, original: textNode });
		});
		return {
			count: index,
			cleanup: function () {
				records.slice().reverse().forEach(function (record) {
					var first = record.nodes[0], parent = first && first.parentNode;
					if (!parent) return;
					parent.insertBefore(record.original, first);
					record.nodes.forEach(function (node) { if (node.parentNode === parent) parent.removeChild(node); });
				});
			}
		};
	}

	function characterInstance(element, options) {
		var effect = definitions[options.effect] || definitions['character-fade-up'];
		if (!effect) return null;
		var split;
		try { split = splitText(element); } catch (error) { return null; }
		if (!split.count) { split.cleanup(); return null; }
		var duration = integer(options.duration, effect.defaultDuration, 40, 5000);
		var requestedInterval = integer(options.interval, 70, 20, 500);
		var fitInterval = split.count > 1 ? Math.floor((4000 - duration) / (split.count - 1)) : requestedInterval;
		var interval = Math.min(requestedInterval, Math.max(20, fitInterval));
		var delay = integer(options.delay, 0, 0, 10000), done = false, timer = null, observer = null;
		element.dataset.cniTextEffect = effect.slug;
		element.style.setProperty('--cni-text-duration', duration + 'ms');
		element.style.setProperty('--cni-text-interval', interval + 'ms');
		element.style.setProperty('--cni-text-delay', delay + 'ms');
		element.classList.add('cni-text-motion--prepared');
		function complete() {
			if (done) return; done = true;
			if (timer) window.clearTimeout(timer);
			element.classList.remove('cni-text-motion--running','cni-text-motion--prepared');
			element.classList.add('cni-text-motion--complete');
			if (observer) { observer.unobserve(element); observer = null; }
		}
		function play() {
			if (done || element.classList.contains('cni-text-motion--running')) return;
			if (reduced) { complete(); return; }
			element.classList.add('cni-text-motion--running');
			timer = window.setTimeout(complete, delay + duration + Math.max(0, split.count - 1) * interval + 180);
		}
		function cleanup() {
			if (timer) window.clearTimeout(timer);
			if (observer) observer.unobserve(element);
			element.classList.remove('cni-text-motion--prepared','cni-text-motion--running','cni-text-motion--complete');
			delete element.dataset.cniTextEffect;
			['--cni-text-duration','--cni-text-interval','--cni-text-delay'].forEach(function (property) { element.style.removeProperty(property); });
			split.cleanup();
		}
		return { play: play, complete: complete, cleanup: cleanup, setObserver: function (value) { observer = value; } };
	}

	function characterObserver(offset) {
		var key = String(offset);
		if (!charObservers[key]) charObservers[key] = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) { if (entry.isIntersecting && entry.target.cniTextMotionInstance) entry.target.cniTextMotionInstance.play(); });
		}, { rootMargin: '0px 0px -' + offset + '% 0px', threshold: 0.01 });
		return charObservers[key];
	}
	function onCharacterReady(callback) {
		var settled = false;
		function ready() {
			if (settled) return; settled = true;
			document.removeEventListener('cni:loader-reveal', ready);
			document.removeEventListener('cni:site-ready', ready);
			callback();
		}
		var loader = document.querySelector('.cni-loader');
		if ((loader && loader.dataset.cniLoaderState === 'site-reveal') || window.cniMotionSiteReadySent) { ready(); return; }
		document.addEventListener('cni:loader-reveal', ready);
		document.addEventListener('cni:site-ready', ready);
	}
	function scheduleCharacter(element, instance, trigger, offset) {
		window.requestAnimationFrame(function () { window.requestAnimationFrame(function () {
			if (trigger === 'immediate') instance.play();
			else if (trigger === 'site-ready') onCharacterReady(instance.play);
			else if (trigger === 'auto') {
				var ready = function () {
					var rect = element.getBoundingClientRect();
					if (rect.top < window.innerHeight && rect.bottom > 0) instance.play(); else { var obs = characterObserver(offset); instance.setObserver(obs); obs.observe(element); }
				};
				onCharacterReady(ready);
			}
			else { var observer = characterObserver(offset); instance.setObserver(observer); observer.observe(element); }
		}); });
	}

	function containsInteractive(element) { return !!element.querySelector('a[href],button,input,select,textarea,[contenteditable="true"],[tabindex]:not([tabindex="-1"])'); }
	function marqueeInstance(element, options) {
		if (containsInteractive(element)) return null;
		var documentRef = element.ownerDocument, view = documentRef.defaultView || window;
		if (reduced || (isMobile(element) && options.mobile === false)) return { cleanup: function () {}, pause: function () {} };
		var originalNodes = Array.prototype.slice.call(element.childNodes), source = documentRef.createElement('span'), track = documentRef.createElement('span');
		var resizeObserver = null, rebuildFrame = 0, pauses = new Set(), destroyed = false, observerContext = marqueeObserverContext(documentRef);
		source.className = 'cni-marquee__source';
		track.className = 'cni-marquee__track'; track.setAttribute('aria-hidden', 'true'); track.setAttribute('data-cni-motion-generated', 'marquee');
		originalNodes.forEach(function (node) { source.appendChild(node); });
		element.appendChild(source); element.appendChild(track);
		element.classList.add('cni-marquee');
		if (options.fade) element.classList.add('cni-marquee--fade');
		function cloneItem() {
			var item = documentRef.createElement('span'); item.className = 'cni-marquee__item'; item.style.marginInlineEnd = options.gap + 'px';
			Array.prototype.forEach.call(source.childNodes, function (node) { item.appendChild(node.cloneNode(true)); }); return item;
		}
		function applyPause() { track.style.animationPlayState = pauses.size ? 'paused' : 'running'; }
		function pause(reason, active) { if (active) pauses.add(reason); else pauses.delete(reason); applyPause(); }
		function build() {
			if (destroyed) return;
			track.replaceChildren();
			var group = documentRef.createElement('span'); group.className = 'cni-marquee__group';
			track.appendChild(group); group.appendChild(cloneItem());
			var containerWidth = Math.max(1, element.getBoundingClientRect().width), guard = 0;
			var itemWidth = group.firstElementChild.getBoundingClientRect().width;
			if (itemWidth <= 0) { cleanup(); return; }
			while (group.getBoundingClientRect().width < containerWidth + itemWidth && guard++ < 100) group.appendChild(cloneItem());
			var width = Math.max(1, group.getBoundingClientRect().width), clone = group.cloneNode(true);
			track.appendChild(clone);
			element.style.setProperty('--cni-marquee-distance', width + 'px');
			element.style.setProperty('--cni-marquee-duration', (width / options.speed) + 's');
			element.dataset.cniMarqueeDirection = options.direction;
			applyPause();
		}
		function requestBuild() { if (rebuildFrame) view.cancelAnimationFrame(rebuildFrame); rebuildFrame = view.requestAnimationFrame(build); }
		function hoverIn() { pause('hover', true); } function hoverOut() { pause('hover', false); }
		if (options.pauseHover) { element.addEventListener('pointerenter', hoverIn); element.addEventListener('pointerleave', hoverOut); element.addEventListener('focusin', hoverIn); element.addEventListener('focusout', hoverOut); }
		resizeObserver = 'ResizeObserver' in view ? new view.ResizeObserver(requestBuild) : null; if (resizeObserver) resizeObserver.observe(element);
		if (observerContext.observer) { observerContext.entries.set(element, { pause: pause }); observerContext.observer.observe(element); }
		function visibility() { pause('document-hidden', documentRef.hidden); } documentRef.addEventListener('visibilitychange', visibility); visibility(); build();
		if (documentRef.fonts && documentRef.fonts.ready) documentRef.fonts.ready.then(requestBuild).catch(function () {});
		function cleanup() {
			if (destroyed) return; destroyed = true;
			if (rebuildFrame) view.cancelAnimationFrame(rebuildFrame); if (resizeObserver) resizeObserver.disconnect();
			if (observerContext.observer) { observerContext.observer.unobserve(element); observerContext.entries.delete(element); }
			documentRef.removeEventListener('visibilitychange', visibility); element.removeEventListener('pointerenter', hoverIn); element.removeEventListener('pointerleave', hoverOut); element.removeEventListener('focusin', hoverIn); element.removeEventListener('focusout', hoverOut);
			originalNodes.forEach(function (node) { element.insertBefore(node, source); }); source.remove(); track.remove();
			element.classList.remove('cni-marquee','cni-marquee--fade'); delete element.dataset.cniMarqueeDirection;
			['--cni-marquee-distance','--cni-marquee-duration'].forEach(function (property) { element.style.removeProperty(property); });
		}
		return { cleanup: cleanup, pause: pause };
	}

	function initElement(element) {
		if (element.cniTextMotionInstance) return;
		if (element.dataset.cniTextMode === 'character') {
			if (isMobile(element) && element.dataset.cniMobile !== 'true') return;
			var instance = characterInstance(element, { effect: element.dataset.cniTextEffect, duration: element.dataset.cniTextDuration, interval: element.dataset.cniTextInterval, delay: element.dataset.cniDelay });
			if (!instance) return; element.cniTextMotionInstance = instance; scheduleCharacter(element, instance, element.dataset.cniTrigger || 'auto', integer(element.dataset.cniOffset, 12, 0, 50));
		} else if (element.dataset.cniTextMode === 'marquee') {
			var marquee = marqueeInstance(element, { direction: element.dataset.cniMarqueeDirection === 'right' ? 'right' : 'left', speed: integer(element.dataset.cniMarqueeSpeed, 50, 10, 200), gap: integer(element.dataset.cniMarqueeGap, 48, 0, 300), fade: element.dataset.cniMarqueeFade === 'true', pauseHover: element.dataset.cniMarqueePauseHover === 'true', mobile: element.dataset.cniMarqueeMobile === 'true' });
			if (marquee) element.cniTextMotionInstance = marquee;
		}
	}
	function init() { document.querySelectorAll('[data-cni-text-mode]').forEach(initElement); }

	window.CNIMotionTextAPI = {
		effects: effects,
		character: function (element, options) { var instance = characterInstance(element, options); if (!instance) return null; window.requestAnimationFrame(function () { window.requestAnimationFrame(instance.play); }); return instance; },
		marquee: function (element, options) { return marqueeInstance(element, options); }
	};
	if (!window.CNIMotionTextEditor) {
		if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
	}
}());
