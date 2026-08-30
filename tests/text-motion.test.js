const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const runtime = read('assets/js/text-motion.js');
const loaderRuntime = read('assets/js/loader-runtime.js');
const attributes = read('includes/class-block-attributes.php');
const registry = read('includes/class-text-motion-registry.php');
const integration = read('integrations/cni-blocks.php');

test('text motion registry contains only the five approved character effects', () => {
	const slugs = [...registry.matchAll(/'slug'\s*=>\s*'([^']+)'/g)].map((match) => match[1]);
	assert.deepEqual(slugs, ['character-fade','character-fade-up','character-blur','character-bounce','typewriter']);
});

test('text motion is limited to heading, paragraph, and Heading+', () => {
	assert.match(registry, /'core\/heading', 'core\/paragraph'/);
	assert.match(integration, /'cni-blocks\/heading-plus'/);
});

test('server output keeps block, character, and marquee modes exclusive', () => {
	assert.match(attributes, /in_array\( \$mode, array\( 'character', 'marquee' \), true \)/);
	assert.match(attributes, /if \( 'block' !== \$mode \) return Block_Tools::apply_custom_css\( \$html, \$block, \$settings \);/);
});

test('split engine uses grapheme segmentation and preserves original text nodes for cleanup', () => {
	assert.match(runtime, /Intl\.Segmenter/);
	assert.match(runtime, /granularity: 'grapheme'/);
	assert.match(runtime, /return Array\.from\(text\)/);
	assert.match(runtime, /parent\.insertBefore\(record\.original, first\)/);
	assert.doesNotMatch(runtime, /\.innerHTML\s*=/);
});

test('marquee uses measured px-per-second duration and responsive/font remeasurement', () => {
	assert.match(runtime, /width \/ options\.speed/);
	assert.match(runtime, /ResizeObserver/);
	assert.match(runtime, /documentRef\.fonts\.ready/);
	assert.match(runtime, /aria-hidden/);
});

test('character Site Ready starts at Loader reveal and retains the final Site Ready fallback', () => {
	assert.match(runtime, /addEventListener\('cni:loader-reveal', ready\)/);
	assert.match(runtime, /addEventListener\('cni:site-ready', ready\)/);
	assert.match(runtime, /cniLoaderState === 'site-reveal'/);
	assert.match(runtime, /else if \(trigger === 'site-ready'\) onCharacterReady\(instance\.play\)/);
	const revealState = loaderRuntime.indexOf("setState('site-reveal')");
	const revealEvent = loaderRuntime.indexOf("emit('cni:loader-reveal')", revealState);
	const revealFinish = loaderRuntime.indexOf("finishReveal('transition-fallback')", revealEvent);
	assert.ok(revealState > -1 && revealEvent > revealState && revealFinish > revealEvent);
});

test('runtime contains no jQuery or scroll-wide DOM scan', () => {
	assert.doesNotMatch(runtime, /jQuery|\$\(/);
	assert.doesNotMatch(runtime, /addEventListener\(['"]scroll/);
});
