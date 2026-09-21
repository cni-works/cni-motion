const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const registry = read('includes/class-text-motion-registry.php');
const integration = read('integrations/cni-blocks.php');
const assets = read('includes/class-assets.php');
const runtime = read('assets/js/text-motion.js');
const editor = read('assets/js/text-accent-editor.js');
const motionCss = read('assets/css/motion.css');
const editorCss = read('assets/css/editor.css');

test('registry provides the four approved practical text accents', () => {
	const section = registry.slice(registry.indexOf('public static function accents'), registry.indexOf('public static function supports_block'));
	const slugs = [...section.matchAll(/'slug'\s*=>\s*'([^']+)'/g)].map((match) => match[1]);
	assert.deepEqual(slugs, ['marker', 'gradient-marker', 'underline', 'brush']);
	for (const accent of ['marker', 'gradient-marker', 'underline', 'brush']) assert.ok(section.includes(`'${accent}'`));
});

test('text accents are limited to practical RichText blocks including Heading+', () => {
	assert.match(registry, /cni_motion_text_accent_blocks.*'core\/heading', 'core\/paragraph', 'core\/list-item'/);
	assert.match(integration, /cni_motion_text_accent_blocks/);
	assert.match(integration, /text_accent_blocks[\s\S]*cni-blocks\/heading-plus/);
});

test('editor registers an isolated RichText format with saved data attributes', () => {
	assert.match(editor, /registerFormatType\(FORMAT_NAME/);
	assert.match(editor, /tagName: 'span'/);
	assert.match(editor, /className: 'cni-text-accent'/);
	for (const attribute of ['data-cni-accent-style', 'data-cni-accent-direction', 'data-cni-accent-color', 'data-cni-accent-duration', 'data-cni-accent-trigger']) assert.ok(editor.includes(attribute));
	assert.doesNotMatch(editor, /setAttributes\s*\(/);
});

test('toolbar exposes compact basic controls and collapsible detailed timing controls', () => {
	for (const label of ['スタイル', '描画方向', '色1', '色2', '詳細設定', '太さ', '透明度', '時間', '遅延', '発火', '再生', '解除']) assert.ok(editor.includes(label));
	assert.match(editor, /PanelBody.*詳細設定.*initialOpen: false/);
	assert.match(editor, /cni-text-accent-popover__grid/);
	assert.match(editor, /cni-text-accent-popover__details-grid/);
	assert.match(editorCss, /width:min\(480px,calc\(100vw - 32px\)\)/);
	assert.match(editorCss, /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
	assert.doesNotMatch(editorCss, /max-height:min\(68vh,520px\)/);
	assert.match(editor, /textApi\.accent/);
	assert.match(editor, /removeFormat\(props\.value, FORMAT_NAME\)/);
});

test('Heading+ selection resolves through the public block-editor clientId API', () => {
	assert.match(editor, /wp\.data && wp\.data\.useSelect/);
	assert.match(editor, /useSelectedBlockName\(\)/);
	assert.match(editor, /resolveSelectedBlockName\(select\)/);
	assert.match(editor, /props\.contentRef && props\.contentRef\.current/);
	assert.match(editor, /closest\('\[data-type\]'\)/);
	assert.match(editor, /getSelectedBlockClientId/);
	assert.match(editor, /getBlockName\(clientId\)/);
	assert.match(registry, /accentBlocks/);
});

test('frontend accent lifecycle is event driven and remains readable without JavaScript', () => {
	assert.match(runtime, /function accentInstance\(element, options\)/);
	assert.match(runtime, /function accentObserver\(offset\)/);
	assert.match(runtime, /cni-text-accent--prepared/);
	assert.match(runtime, /cni-text-accent--running/);
	assert.match(runtime, /cni-text-accent--complete/);
	assert.match(runtime, /cni:loader-reveal/);
	assert.doesNotMatch(runtime, /addEventListener\(['"]scroll/);
	assert.doesNotMatch(editor, /\.innerHTML\s*=/);
});

test('CSS supports wrapped inline text, all styles and reduced motion', () => {
	assert.match(motionCss, /box-decoration-break:clone/);
	for (const style of ['marker', 'gradient-marker', 'underline', 'brush']) assert.match(motionCss, new RegExp(`data-cni-accent-style=${style}`));
	assert.match(motionCss, /cni-text-accent--running.*transition:background-size/);
	assert.match(motionCss, /cni-motion-reduced-enabled \.cni-text-accent/);
	assert.match(editorCss, /editor-styles-wrapper \.cni-text-accent/);
});

test('editor-only format asset is loaded with WordPress public RichText dependencies', () => {
	assert.match(assets, /cni-motion-text-accent-editor/);
	assert.match(assets, /wp-rich-text/);
	assert.match(assets, /wp-block-editor/);
});
