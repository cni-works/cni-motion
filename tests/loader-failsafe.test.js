const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const earlyTemplate = fs.readFileSync(path.join(projectRoot, 'includes/class-assets.php'), 'utf8').match(/<<<'JS'\r?\n([\s\S]*?)\r?\nJS,/)[1];
const bootstrapCode = fs.readFileSync(path.join(projectRoot, 'assets/js/bootstrap.js'), 'utf8');
const runtimeCode = fs.readFileSync(path.join(projectRoot, 'assets/js/loader-runtime.js'), 'utf8');
const frontendCode = fs.readFileSync(path.join(projectRoot, 'assets/js/frontend.js'), 'utf8');
const assetsPhp = fs.readFileSync(path.join(projectRoot, 'includes/class-assets.php'), 'utf8');
const loaderPhp = fs.readFileSync(path.join(projectRoot, 'includes/class-loader.php'), 'utf8');
const settingsPhp = fs.readFileSync(path.join(projectRoot, 'includes/class-settings.php'), 'utf8');
const settingsPagePhp = fs.readFileSync(path.join(projectRoot, 'includes/views/settings-page.php'), 'utf8');
const adminCode = fs.readFileSync(path.join(projectRoot, 'assets/js/admin.js'), 'utf8');
const editorCode = fs.readFileSync(path.join(projectRoot, 'assets/js/editor.js'), 'utf8');
const blockAttributesPhp = fs.readFileSync(path.join(projectRoot, 'includes/class-block-attributes.php'), 'utf8');
const effectRegistryPhp = fs.readFileSync(path.join(projectRoot, 'includes/class-effect-registry.php'), 'utf8');
const cniBlocksIntegrationPhp = fs.readFileSync(path.join(projectRoot, 'integrations/cni-blocks.php'), 'utf8');
const motionCss = fs.readFileSync(path.join(projectRoot, 'assets/css/motion.css'), 'utf8');

test('Early CSS does not call a nonexistent WordPress style-tag helper', () => {
	assert.equal(assetsPhp.includes('wp_print_inline_style_tag'), false);
	assert.match(assetsPhp, /<style id="cni-motion-early-loader-css"/);
});

test('Booting loader starts content before deferred runtime and preloads images', () => {
	assert.match(motionCss, /html\.cni-loader-booting \.cni-loader\{display:block\}/);
	assert.match(loaderPhp, /--cni-enter:%2\$dms/);
	assert.match(assetsPhp, /rel="preload" as="image"/);
	assert.match(loaderPhp, /fetchpriority.*high/);
	assert.match(motionCss, /cni-motion-reduced-enabled\.cni-loader-booting/);
});

test('Loader logo is plugin-selected and its desktop/mobile width is shared by Preview and Frontend', () => {
	assert.equal(loaderPhp.includes("get_theme_mod( 'custom_logo' )"), false);
	assert.equal(assetsPhp.includes("get_theme_mod( 'custom_logo' )"), false);
	assert.match(settingsPhp, /'contentType' => 'custom-image'/);
	assert.match(settingsPagePhp, /'custom-image' => __\( 'ロゴ画像'/);
	assert.match(settingsPagePhp, /テーマのロゴ設定とは連動せず/);
	assert.match(motionCss, /\.cni-loader__image\{height:auto;max-width:var\(--cni-logo-desktop,300px\);width:100%\}/);
	assert.match(assetsPhp, /\.cni-loader__logo img,\.cni-loader__image\{max-width:var\(--cni-logo-mobile,180px\)/);
	assert.equal(adminCode.includes('config.siteLogoUrl'), false);
	assert.match(adminCode, /value\('contentType', 'custom-image'\)/);
});

test('CNI Blocks integration uses every current registered block slug', () => {
	const expected = [
		'auto-grid', 'breadcrumb', 'counter-plus', 'custom-field', 'fixed-display',
		'grid-card', 'heading-plus', 'outer', 'overlap-media', 'post-list',
		'selected-post-list', 'slide-gallery', 'step', 'step-item', 'tab-item',
		'table-plus', 'tabs', 'timeline', 'timeline-item', 'visual-embed',
	].map((slug) => `cni-blocks/${slug}`).sort();
	const actual = [...cniBlocksIntegrationPhp.matchAll(/'cni-blocks\/([a-z0-9-]+)'/g)]
		.map((match) => `cni-blocks/${match[1]}`)
		.filter((slug, index, list) => list.indexOf(slug) === index)
		.sort();
	assert.deepEqual(actual, expected);
	assert.match(cniBlocksIntegrationPhp, /'cni-blocks\/heading-plus'/);
	assert.match(cniBlocksIntegrationPhp, /\$matrix\['cni-blocks\/outer'\].*'stagger' => true/);
	assert.match(cniBlocksIntegrationPhp, /\$matrix\['cni-blocks\/auto-grid'\].*'stagger' => true/);
});

test('Mobile Stagger control only appears with Stagger and only removes its interval', () => {
	const staggerBranch = editorCode.indexOf('if (a.cniMotionStagger)');
	const mobileStaggerControl = editorCode.indexOf("label:__('スマホでも順番に表示'", staggerBranch);
	assert.ok(staggerBranch > -1 && mobileStaggerControl > staggerBranch);
	assert.equal(editorCode.includes("label:__('モバイルで遅延'"), false);
	assert.match(blockAttributesPhp, /data-cni-stagger-mobile/);
	assert.match(frontendCode, /baseDelay \+ \(mobile && !staggerOnMobile \? 0 : index \* interval\)/);
	assert.match(frontendCode, /child\.dataset\.cniMobileDelay = 'true'/);
});

test('Zoom In intensity supports CNI and dynamic Otter-like characters safely', () => {
	assert.match(effectRegistryPhp, /'zoom-in'.*'intensity' => 'zoom'/);
	assert.match(effectRegistryPhp, /'blur-zoom-out'.*'intensity' => 'blur-zoom'/);
	assert.match(editorCode, /控えめ \(0\.86\)/);
	assert.match(editorCode, /強め \(0\.65\)/);
	assert.match(editorCode, /ダイナミック \(0\.30・Otter風\)/);
	assert.match(blockAttributesPhp, /array\( 'standard', 'strong', 'dynamic' \)/);
	assert.match(motionCss, /data-cni-intensity=strong.*scale\(\.65\)/);
	assert.match(motionCss, /data-cni-intensity=dynamic.*scale\(\.3\)/);
	assert.match(motionCss, /@keyframes cni-zoom-in-dynamic\{0%\{opacity:0;transform:scale\(\.3\)\}50%\{opacity:1\}100%/);
});

test('All Clip Reveal directions use explicit shared Frontend and Editor keyframes', () => {
	for (const direction of ['left', 'right', 'up', 'down']) {
		assert.match(motionCss, new RegExp(`data-cni-motion=clip-reveal-${direction}\\]\\.cni-motion--running\\{animation-name:cni-clip-reveal-${direction}\\}`));
		assert.match(motionCss, new RegExp(`@keyframes cni-clip-reveal-${direction}\\{`));
	}
	assert.match(motionCss, /cni-motion-reduced-enabled\.cni-motion-js \[data-cni-motion\^=clip-reveal\]\.cni-motion--running\{animation-name:none!important/);
	assert.match(frontendCode, /el\.addEventListener\('animationend', finish\)/);
	assert.match(editorCode, /node\.addEventListener\('animationend', finish\)/);
});

test('Content exit enables transition before releasing the visible start state', () => {
	const add = runtimeCode.indexOf("loader.classList.add('cni-loader--content-exit')");
	const commit = runtimeCode.indexOf('void loader.offsetWidth', add);
	const remove = runtimeCode.indexOf("loader.classList.remove('cni-loader--content-ready')", add);
	assert.ok(add > -1 && commit > add && remove > commit);
});

test('Frontend waits for the full loader stylesheet before starting the runtime', () => {
	assert.match(motionCss, /\.cni-loader\{--cni-loader-css-ready:1\}/);
	assert.match(frontendCode, /getPropertyValue\('--cni-loader-css-ready'\)\.trim\(\) === '1'/);
	const readiness = frontendCode.indexOf('function loaderStylesReady(loader)');
	const retry = frontendCode.indexOf('window.requestAnimationFrame(startWhenStyled)', readiness);
	const runtime = frontendCode.indexOf('window.CNIMotionLoaderRuntime.run(loader', readiness);
	assert.ok(readiness > -1 && retry > readiness && runtime > retry);
});

test('Async optimized CSS cannot consume the Loader sequence before its styles arrive', () => {
	const loader = loaderElement();
	let cssReady = false;
	let runtimeStarts = 0;
	const env = environment({
		loader,
		computedStyle() {
			return { getPropertyValue(name) { return name === '--cni-loader-css-ready' && cssReady ? '1' : ''; } };
		},
	});
	env.context.CNIMotion = {};
	env.context.CNIMotionRegistry = [];
	env.context.CNIMotionLoaderRuntime = { run() { runtimeStarts++; } };
	vm.runInNewContext(frontendCode, env.context);
	assert.equal(runtimeStarts, 0, 'runtime must not start against missing async CSS');
	env.raf.shift()();
	assert.equal(runtimeStarts, 0);
	cssReady = true;
	env.raf.shift()();
	assert.equal(runtimeStarts, 1, 'runtime starts as soon as the real loader CSS is applied');
});

function classes(initial = []) {
	const values = new Set(initial);
	return {
		add: (...items) => items.forEach((item) => values.add(item)),
		remove: (...items) => items.forEach((item) => values.delete(item)),
		contains: (item) => values.has(item),
		values,
	};
}

function timers() {
	let next = 1;
	const pending = new Map();
	return {
		set(fn, delay) { const id = next++; pending.set(id, { fn, delay }); return id; },
		clear(id) { pending.delete(id); },
		fire(id) { const timer = pending.get(id); if (!timer) return; pending.delete(id); timer.fn(); },
		pending,
	};
}

function environment(options = {}) {
	const timer = timers();
	const rootClasses = classes();
	const properties = { '--cni-loader-bg': { value: 'pink', priority: '' } };
	const documentListeners = {};
	const raf = [];
	let loader = options.loader || null;
	let styleRemoved = false;
	let siteReadyEvents = 0;
	const styleNode = { parentNode: { removeChild() { styleRemoved = true; } } };
	const document = {
		readyState: options.readyState || 'complete',
		documentElement: null,
		defaultView: null,
		addEventListener(name, fn) { (documentListeners[name] ||= []).push(fn); },
		removeEventListener() {},
		dispatchEvent(event) { if (event && event.type === 'cni:site-ready') siteReadyEvents++; },
		getElementById(id) { return id === 'cni-motion-early-loader-css' && !styleRemoved ? styleNode : null; },
		querySelector(selector) { return selector === '.cni-loader' ? loader : null; },
		querySelectorAll() { if (options.queryError) throw new Error('query failure'); return []; },
	};
	const root = {
		classList: rootClasses,
		clientHeight: 720,
		clientWidth: 1280,
		ownerDocument: document,
		style: {
			getPropertyValue(name) { return properties[name] ? properties[name].value : ''; },
			getPropertyPriority(name) { return properties[name] ? properties[name].priority : ''; },
			setProperty(name, value, priority) { properties[name] = { value, priority: priority || '' }; },
			removeProperty(name) { delete properties[name]; },
		},
	};
	document.documentElement = root;
	const context = {
		CustomEvent: function CustomEvent(type, init) { this.type = type; this.detail = init && init.detail; },
		IntersectionObserver: function IntersectionObserver() {},
		console: { error() {} },
		document,
		getComputedStyle() { return { getPropertyValue() { return '0'; } }; },
		innerHeight: 720,
		innerWidth: 1280,
		localStorage: { getItem() { if (options.storageError) throw new Error('storage'); return options.firstSeen ? '1' : null; } },
		matchMedia() { return { matches: false }; },
		requestAnimationFrame(fn) { raf.push(fn); return raf.length; },
		sessionStorage: { getItem() { if (options.storageError) throw new Error('storage'); return options.sessionSeen ? '1' : null; } },
		setTimeout: timer.set,
		clearTimeout: timer.clear,
	};
	context.window = context;
	document.defaultView = context;
	context.getComputedStyle = options.computedStyle || context.getComputedStyle;
	return {
		context,
		documentListeners,
		get loader() { return loader; },
		set loader(value) { loader = value; },
		properties,
		raf,
		root,
		rootClasses,
		get siteReadyEvents() { return siteReadyEvents; },
		get styleRemoved() { return styleRemoved; },
		timer,
	};
}

function runEarly(env, frequency = 'always') {
	const config = JSON.stringify({ enabled: true, frequency, backgroundColor: '#123456' });
	vm.runInNewContext(earlyTemplate.replace('%s', config), env.context);
}

function loaderElement() {
	const classList = classes();
	const properties = {};
	const listeners = {};
	const loader = {
		classList,
		dataset: {
			cniFrequency: 'always', cniLoaderEnter: 'none', cniLoaderExit: 'none',
			cniLoaderHold: '0', cniLoaderEnterDuration: '0', cniLoaderExitDuration: '0',
			cniLoaderRevealDuration: '100', cniLoaderMaxWait: '500',
		},
		isConnected: true,
		offsetWidth: 1280,
		parentNode: { removeChild(node) { node.isConnected = false; } },
		style: { setProperty(name, value) { properties[name] = value; } },
		addEventListener(name, fn) { (listeners[name] ||= []).push(fn); },
		removeEventListener(name, fn) { if (listeners[name]) listeners[name] = listeners[name].filter((item) => item !== fn); },
		dispatch(name, event) { (listeners[name] || []).slice().forEach((fn) => fn(event)); },
		listeners,
		remove() { loader.isConnected = false; },
		getBoundingClientRect() { return { left: 0, top: 0, right: 1280, bottom: 720, width: 1280, height: 720 }; },
	};
	return loader;
}

test('Circle waits for its real pseudo-element transition before removing the Loader', async () => {
	const loader = loaderElement();
	loader.dataset.cniLoader = 'circle-reveal';
	const env = environment({ loader });
	vm.runInNewContext(runtimeCode, env.context);
	const controller = env.context.CNIMotionLoaderRuntime.run(loader, { root: env.root, manageRoot: false, emitEvents: false });
	const fireNextZeroTimer = () => {
		const entry = Array.from(env.timer.pending.entries()).find((item) => item[1].delay === 0);
		assert.ok(entry, 'expected a zero-duration sequence timer');
		env.timer.fire(entry[0]);
	};
	fireNextZeroTimer();
	await Promise.resolve(); await Promise.resolve();
	fireNextZeroTimer();
	await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
	assert.equal(controller.getState(), 'site-reveal');
	assert.equal(loader.isConnected, true, 'fixed duration must not remove the Loader first');
	loader.dispatch('transitionend', { target: loader, pseudoElement: '::before', propertyName: 'width' });
	assert.equal(loader.isConnected, true, 'the final reveal frame must be painted before removal');
	assert.ok(env.raf.length > 0);
	env.raf.shift()();
	assert.equal(loader.isConnected, false);
	assert.equal(controller.getState(), 'site-ready');
});

test('All Loader reveal families use transition completion with a bounded fallback', () => {
	assert.match(runtimeCode, /loader\.addEventListener\('transitionend', revealEndHandler\)/);
	assert.match(runtimeCode, /effect === 'circle-reveal'.*event\.pseudoElement/);
	assert.match(runtimeCode, /effect\.indexOf\('wipe-'\) === 0/);
	assert.match(runtimeCode, /effect === 'split-horizontal'.*effect === 'split-vertical'/);
	assert.match(runtimeCode, /revealDuration \+ Math\.max\(500, Math\.min\(1500, revealDuration\)\)/);
});

test('Stable scrollbar gutter does not keep the Early Cover above Site Reveal', () => {
	const loader = loaderElement();
	loader.getBoundingClientRect = () => ({ left: 0, top: 0, right: 1264, bottom: 720, width: 1264, height: 720 });
	const env = environment({
		loader,
		computedStyle() { return { display: 'block', visibility: 'visible', position: 'fixed', paddingRight: '0px' }; },
	});
	env.context.innerWidth = 1280;
	env.root.clientWidth = 1264;
	runEarly(env);
	vm.runInNewContext(bootstrapCode, env.context);
	vm.runInNewContext(runtimeCode, env.context);
	env.context.CNIMotionLoaderRuntime.run(loader, { root: env.root, manageRoot: true, emitEvents: false });
	assert.equal(env.root.cniLoaderScrollLock.scrollbarWidth, 16);
	/* scrollbar-gutter:stable can make clientWidth report the full viewport after lock. */
	env.root.clientWidth = 1280;
	env.raf.shift()();
	assert.equal(env.rootClasses.contains('cni-loader-booting'), false);
});

test('Scroll unlock keeps the stable gutter until the native scrollbar has returned', () => {
	const env = environment();
	env.context.CSS = { supports(property, value) { return property === 'scrollbar-gutter' && value === 'stable'; } };
	env.context.innerWidth = 1280;
	env.root.clientWidth = 1264;
	vm.runInNewContext(runtimeCode, env.context);
	env.context.CNIMotionLoaderRuntime.lockScroll(env.root);
	assert.equal(env.rootClasses.contains('cni-loader-lock'), true);
	assert.equal(env.rootClasses.contains('cni-loader-scrollbar-stable'), true);
	env.context.CNIMotionLoaderRuntime.restoreScrollbar(env.root);
	assert.equal(env.rootClasses.contains('cni-loader-lock'), false, 'scrolling must be enabled immediately');
	assert.equal(env.root.cniLoaderScrollLock.scrollbarRestored, true, 'input guard remains active through Site Reveal');
	assert.equal(env.rootClasses.contains('cni-loader-scrollbar-stable'), true, 'gutter remains while the native scrollbar settles');
	env.raf.shift()();
	assert.equal(env.rootClasses.contains('cni-loader-scrollbar-stable'), true);
	env.raf.shift()();
	assert.equal(env.rootClasses.contains('cni-loader-scrollbar-stable'), false);
	assert.equal(env.root.cniLoaderScrollLockRelease, null);
	env.context.CNIMotionLoaderRuntime.unlockScroll(env.root);
	assert.equal(env.root.cniLoaderScrollLock, null);
	assert.match(motionCss, /html\.cni-loader-scrollbar-stable\{scrollbar-gutter:stable\}/);
});

test('Site Reveal restores the native scrollbar before exposing the site', () => {
	const reveal = runtimeCode.indexOf('function reveal(revealDuration)');
	const restore = runtimeCode.indexOf('restoreScrollbar(root)', reveal);
	const exiting = runtimeCode.indexOf("loader.classList.add('cni-loader--exiting')", reveal);
	assert.ok(reveal > -1 && restore > reveal && exiting > restore);
});

test('A new preview lock safely takes over a pending stable-gutter release', () => {
	const env = environment();
	env.context.CSS = { supports() { return true; } };
	env.context.innerWidth = 1280;
	env.root.clientWidth = 1264;
	vm.runInNewContext(runtimeCode, env.context);
	env.context.CNIMotionLoaderRuntime.lockScroll(env.root);
	env.context.CNIMotionLoaderRuntime.unlockScroll(env.root);
	env.root.clientWidth = 1280;
	env.context.CNIMotionLoaderRuntime.lockScroll(env.root);
	env.context.CNIMotionLoaderRuntime.unlockScroll(env.root);
	while (env.raf.length) env.raf.shift()();
	assert.equal(env.rootClasses.contains('cni-loader-lock'), false);
	assert.equal(env.rootClasses.contains('cni-loader-scrollbar-stable'), false);
});

test('Case A/C: Early inline alone releases the cover within ten seconds', () => {
	const env = environment();
	runEarly(env);
	assert.equal(env.rootClasses.contains('cni-loader-booting'), true);
	const timerId = env.context.cniMotionEarlyCoverFailSafe;
	assert.equal(env.timer.pending.get(timerId).delay, 10000);
	env.timer.fire(timerId);
	assert.equal(env.rootClasses.contains('cni-loader-booting'), false);
	assert.equal(env.properties['--cni-loader-bg'].value, 'pink');
	assert.equal(env.rootClasses.contains('cni-site-ready'), true);
});

test('Case B: Missing Loader DOM releases the cover at DOMContentLoaded', () => {
	const env = environment({ readyState: 'loading' });
	runEarly(env);
	assert.equal(env.rootClasses.contains('cni-loader-booting'), true);
	env.documentListeners.DOMContentLoaded[0]();
	assert.equal(env.rootClasses.contains('cni-loader-booting'), false);
	assert.equal(env.context.cniMotionEarlyCoverFailSafe, null);
});

test('Frequency skips do not create a cover or an early timer', () => {
	const session = environment({ sessionSeen: true });
	runEarly(session, 'session');
	assert.equal(session.rootClasses.contains('cni-loader-booting'), false);
	assert.equal(session.rootClasses.contains('cni-loader-skip'), true);
	assert.equal(session.context.cniMotionEarlyCoverFailSafe, undefined);
	const first = environment({ firstSeen: true });
	runEarly(first, 'first-visit');
	assert.equal(first.rootClasses.contains('cni-loader-booting'), false);
});

test('Storage failure safely falls back to showing the loader cover', () => {
	const env = environment({ storageError: true });
	runEarly(env, 'session');
	assert.equal(env.rootClasses.contains('cni-loader-booting'), true);
});

test('Case D: Missing loader-runtime is caught by frontend and reveals the site', () => {
	const loader = loaderElement();
	const env = environment({ loader });
	runEarly(env);
	vm.runInNewContext(bootstrapCode, env.context);
	env.context.CNIMotion = {};
	env.context.CNIMotionRegistry = [];
	vm.runInNewContext(frontendCode, env.context);
	assert.equal(env.rootClasses.contains('cni-loader-booting'), false);
	assert.equal(loader.isConnected, false);
	assert.equal(env.rootClasses.contains('cni-site-ready'), true);
});

test('Case E: Frontend initialization exception releases the cover and loader', () => {
	const loader = loaderElement();
	const env = environment({ loader, queryError: true });
	runEarly(env);
	vm.runInNewContext(bootstrapCode, env.context);
	env.context.CNIMotion = {};
	env.context.CNIMotionRegistry = [];
	vm.runInNewContext(frontendCode, env.context);
	assert.equal(env.rootClasses.contains('cni-loader-booting'), false);
	assert.equal(loader.isConnected, false);
});

test('Case F: Active full-viewport loader takes responsibility before handoff', () => {
	const loader = loaderElement();
	const env = environment({
		loader,
		computedStyle() { return { display: 'block', visibility: 'visible', position: 'fixed', paddingRight: '0px' }; },
	});
	runEarly(env);
	vm.runInNewContext(bootstrapCode, env.context);
	vm.runInNewContext(runtimeCode, env.context);
	const controller = env.context.CNIMotionLoaderRuntime.run(loader, { root: env.root, manageRoot: true, emitEvents: false, onComplete() {} });
	assert.equal(env.rootClasses.contains('cni-loader-booting'), true);
	assert.notEqual(env.context.cniMotionEarlyCoverFailSafe, null);
	assert.ok(env.timer.pending.size > 1, 'loader safety timer must exist before handoff');
	env.raf.shift()();
	assert.equal(loader.classList.contains('cni-loader--active'), true);
	assert.equal(env.rootClasses.contains('cni-loader-booting'), false);
	assert.equal(env.context.cniMotionEarlyCoverFailSafe, null);
	controller.finish('test-complete');
});
