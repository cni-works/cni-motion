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

test('Content exit enables transition before releasing the visible start state', () => {
	const add = runtimeCode.indexOf("loader.classList.add('cni-loader--content-exit')");
	const commit = runtimeCode.indexOf('void loader.offsetWidth', add);
	const remove = runtimeCode.indexOf("loader.classList.remove('cni-loader--content-ready')", add);
	assert.ok(add > -1 && commit > add && remove > commit);
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
		addEventListener() {}, removeEventListener() {}, remove() { loader.isConnected = false; },
		getBoundingClientRect() { return { left: 0, top: 0, right: 1280, bottom: 720, width: 1280, height: 720 }; },
	};
	return loader;
}

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
